#!/usr/bin/env node
/**
 * Wrapper: acquire remote lock → optional pull state → ant apply (or --simulate)
 * → push state → unlock. Does NOT patch Anthropic's CLI.
 *
 * Usage:
 *   ant-apply-locked [--project ID] [--simulate] [--pull] [--no-push] [--ttl N] [-- ...]
 *   Extra args after -- (or remaining) are passed to `ant apply`.
 *
 * Env:
 *   ANT_APPLY_LOCK_URL   default http://127.0.0.1:8787
 *   ANT_APPLY_TOKEN      optional x-token for state endpoints
 *   ANT_APPLY_HOLDER     override holder id (default: hostname:pid)
 */

import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const LOCK_URL = (process.env.ANT_APPLY_LOCK_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const TOKEN = process.env.ANT_APPLY_TOKEN || '';
const LOCKFILE = 'claude-lock.json';

function parseArgs(argv) {
  const out = {
    project: null,
    simulate: false,
    pull: true,
    push: true,
    ttlSec: 120,
    sleepMs: 800,
    passthrough: [],
  };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--') {
      out.passthrough.push(...argv.slice(i + 1));
      break;
    }
    if (a === '--project' || a === '-p') {
      out.project = argv[++i];
    } else if (a.startsWith('--project=')) {
      out.project = a.slice('--project='.length);
    } else if (a === '--simulate') {
      out.simulate = true;
    } else if (a === '--no-pull') {
      out.pull = false;
    } else if (a === '--pull') {
      out.pull = true;
    } else if (a === '--no-push') {
      out.push = false;
    } else if (a === '--ttl') {
      out.ttlSec = Number(argv[++i]) || out.ttlSec;
    } else if (a.startsWith('--ttl=')) {
      out.ttlSec = Number(a.slice('--ttl='.length)) || out.ttlSec;
    } else if (a === '--sleep-ms') {
      out.sleepMs = Number(argv[++i]) || out.sleepMs;
    } else if (a.startsWith('--sleep-ms=')) {
      out.sleepMs = Number(a.slice('--sleep-ms='.length)) || out.sleepMs;
    } else if (a === '--help' || a === '-h') {
      out.help = true;
    } else {
      out.passthrough.push(a);
    }
    i++;
  }
  return out;
}

function projectIdFromCwd(cwd) {
  return crypto.createHash('sha256').update(cwd).digest('hex').slice(0, 16);
}

function headers(json = true) {
  const h = {};
  if (json) h['Content-Type'] = 'application/json';
  if (TOKEN) h['x-token'] = TOKEN;
  return h;
}

async function api(method, route, body) {
  const res = await fetch(`${LOCK_URL}${route}`, {
    method,
    headers: headers(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function antExists() {
  const r = spawnSync('ant', ['--version'], { encoding: 'utf8', stdio: 'pipe' });
  return !r.error && (r.status === 0 || typeof r.status === "number");
}

async function acquireLock(projectId, holder, ttlSec, { retries = 30, retryMs = 200 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const { ok, status, data } = await api('POST', '/lock', { projectId, holder, ttlSec });
    if (ok) {
      console.log(`[ant-apply-locked] lock acquired lockId=${data.lockId} expiresAt=${data.expiresAt}`);
      return data;
    }
    if (status === 409) {
      console.log(
        `[ant-apply-locked] lock held by ${data.holder} (expires ${data.expiresAt}); retry ${attempt}/${retries}`
      );
      await sleep(retryMs);
      continue;
    }
    throw new Error(`lock failed HTTP ${status}: ${JSON.stringify(data)}`);
  }
  throw new Error(`could not acquire lock for ${projectId} after ${retries} retries`);
}

async function unlock(projectId, lockId, holder) {
  const { ok, status, data } = await api('POST', '/unlock', { projectId, lockId, holder });
  if (!ok && status !== 404) {
    console.warn(`[ant-apply-locked] unlock warning HTTP ${status}: ${JSON.stringify(data)}`);
  } else {
    console.log(`[ant-apply-locked] unlocked project=${projectId}`);
  }
}

async function pullState(projectId, cwd) {
  const { ok, status, data } = await api('GET', `/state/${encodeURIComponent(projectId)}`);
  if (status === 404) {
    console.log('[ant-apply-locked] no remote state yet');
    return false;
  }
  if (!ok) throw new Error(`pull state HTTP ${status}: ${JSON.stringify(data)}`);
  const dest = path.join(cwd, LOCKFILE);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`[ant-apply-locked] pulled remote state → ${dest}`);
  return true;
}

async function pushState(projectId, cwd) {
  const src = path.join(cwd, LOCKFILE);
  if (!fs.existsSync(src)) {
    console.warn('[ant-apply-locked] no local claude-lock.json to push');
    return false;
  }
  const body = JSON.parse(fs.readFileSync(src, 'utf8'));
  const { ok, status, data } = await api('PUT', `/state/${encodeURIComponent(projectId)}`, body);
  if (!ok) throw new Error(`push state HTTP ${status}: ${JSON.stringify(data)}`);
  console.log(`[ant-apply-locked] pushed state (${data.bytes} bytes)`);
  return true;
}

function runAntApply(passthrough, cwd) {
  return new Promise((resolve) => {
    console.log(`[ant-apply-locked] running: ant apply ${passthrough.join(' ')}`.trim());
    const child = spawn('ant', ['apply', ...passthrough], {
      cwd,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', (err) => {
      console.error(`[ant-apply-locked] failed to spawn ant: ${err.message}`);
      resolve(127);
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function runSimulate({ sleepMs, holder, cwd, passthrough }) {
  console.log(`[ant-apply-locked] SIMULATE apply (sleep ${sleepMs}ms) holder=${holder}`);
  // Mark "applying" so race demo can detect overlapping windows without lock
  const stamp = path.join(cwd, `.apply-active-${process.pid}`);
  fs.writeFileSync(stamp, JSON.stringify({ holder, startedAt: new Date().toISOString() }), 'utf8');
  try {
    await sleep(sleepMs);
    const prev = fs.existsSync(path.join(cwd, LOCKFILE))
      ? JSON.parse(fs.readFileSync(path.join(cwd, LOCKFILE), 'utf8'))
      : { version: 1, resources: [] };
    const next = {
      ...prev,
      version: (prev.version || 1) + 1,
      lastApply: {
        holder,
        at: new Date().toISOString(),
        pid: process.pid,
        args: passthrough,
        simulated: true,
      },
      resources: [
        ...(prev.resources || []),
        {
          type: 'simulated.agent',
          id: `sim-${crypto.randomBytes(4).toString('hex')}`,
          hash: crypto.randomBytes(8).toString('hex'),
        },
      ],
    };
    fs.writeFileSync(path.join(cwd, LOCKFILE), JSON.stringify(next, null, 2) + '\n', 'utf8');
    console.log(`[ant-apply-locked] SIMULATE wrote ${LOCKFILE} version=${next.version}`);
    return 0;
  } finally {
    try {
      fs.unlinkSync(stamp);
    } catch {
      /* ignore */
    }
  }
}

function printHelp() {
  console.log(`ant-apply-locked — remote lock wrapper for ant apply

Usage:
  ant-apply-locked [options] [-- ant-apply-args...]

Options:
  --project, -p ID   Project id (default: sha256(cwd)[:16])
  --simulate         Sleep + write fake claude-lock.json (no Anthropic creds)
  --pull / --no-pull Pull remote state before apply (default: pull)
  --no-push          Skip PUT state after success
  --ttl N            Lock TTL seconds (default 120)
  --sleep-ms N       Simulate duration (default 800)
  -h, --help         This help

Env:
  ANT_APPLY_LOCK_URL  default http://127.0.0.1:8787
  ANT_APPLY_TOKEN     optional x-token
  ANT_APPLY_HOLDER    override holder id
`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const cwd = process.cwd();
  const projectId = opts.project || projectIdFromCwd(cwd);
  const holder = process.env.ANT_APPLY_HOLDER || `${os.hostname()}:${process.pid}`;

  let useSimulate = opts.simulate;
  if (!useSimulate) {
    const hasAnt = antExists();
    if (!hasAnt) {
      console.warn('[ant-apply-locked] `ant` not found on PATH — falling back to --simulate');
      useSimulate = true;
    }
  }

  let lock = null;
  let exitCode = 1;
  try {
    lock = await acquireLock(projectId, holder, opts.ttlSec);
    if (opts.pull) await pullState(projectId, cwd);

    if (useSimulate) {
      exitCode = await runSimulate({
        sleepMs: opts.sleepMs,
        holder,
        cwd,
        passthrough: opts.passthrough,
      });
    } else {
      exitCode = await runAntApply(opts.passthrough, cwd);
    }

    if (exitCode === 0 && opts.push) {
      await pushState(projectId, cwd);
    }
  } catch (err) {
    console.error(`[ant-apply-locked] ERROR: ${err.message}`);
    exitCode = 1;
  } finally {
    if (lock) {
      await unlock(projectId, lock.lockId, holder);
    }
  }
  process.exit(exitCode);
}

main();
