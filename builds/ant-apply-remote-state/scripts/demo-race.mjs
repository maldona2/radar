#!/usr/bin/env node
/**
 * Race demo: start lock server, spawn 2 concurrent simulated applies.
 * With the wrapper they serialize (second waits on 409 retries).
 * Exit 0 if both succeed and lockfile versions are sequential (no corruption).
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.DEMO_PORT || 8791);
const LOCK_URL = `http://127.0.0.1:${PORT}`;
const WRAPPER = path.join(ROOT, 'bin/ant-apply-locked.mjs');
const SERVER = path.join(ROOT, 'server/lock-server.mjs');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitHealth(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`${url}/health`);
      if (r.ok) return true;
    } catch {
      /* retry */
    }
    await sleep(50);
  }
  throw new Error('server did not become healthy');
}

function runWorker(label, cwd, extraEnv = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const log = [];
    const child = spawn(
      process.execPath,
      [WRAPPER, '--simulate', '--project', 'demo-race', '--sleep-ms', '600', '--ttl', '60'],
      {
        cwd,
        env: {
          ...process.env,
          ANT_APPLY_LOCK_URL: LOCK_URL,
          ANT_APPLY_HOLDER: label,
          ...extraEnv,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    const onData = (buf) => {
      const t = buf.toString();
      log.push(t);
      process.stdout.write(`[${label}] ${t}`);
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('close', (code) => {
      resolve({
        label,
        code: code ?? 1,
        ms: Date.now() - started,
        log: log.join(''),
      });
    });
  });
}

async function main() {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'ant-apply-race-'));
  const dataDir = path.join(work, 'data');
  fs.mkdirSync(dataDir);

  console.log('=== ant-apply-remote-state demo:race ===');
  console.log(`work dir: ${work}`);
  console.log(`lock url: ${LOCK_URL}\n`);

  const server = spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      PORT: String(PORT),
      HOST: '127.0.0.1',
      ANT_APPLY_DATA_DIR: dataDir,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLog = '';
  server.stdout.on('data', (b) => {
    serverLog += b.toString();
  });
  server.stderr.on('data', (b) => {
    serverLog += b.toString();
  });

  let exitCode = 1;
  try {
    await waitHealth(LOCK_URL);
    console.log('[demo] server up\n');

    console.log('--- WITH LOCK: two concurrent simulated applies ---\n');
    const t0 = Date.now();
    const [a, b] = await Promise.all([
      runWorker('worker-A', work),
      runWorker('worker-B', work),
    ]);
    const elapsed = Date.now() - t0;

    console.log('\n--- results ---');
    console.log(`${a.label}: exit=${a.code} duration=${a.ms}ms`);
    console.log(`${b.label}: exit=${b.code} duration=${b.ms}ms`);
    console.log(`wall clock: ${elapsed}ms`);

    const sawRetry = /lock held|retry \d+/i.test(a.log + b.log);
    const bothOk = a.code === 0 && b.code === 0;

    const lockPath = path.join(work, 'claude-lock.json');
    if (!fs.existsSync(lockPath)) {
      throw new Error('claude-lock.json missing after race');
    }
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    console.log(`\nfinal lockfile version=${lock.version} resources=${(lock.resources || []).length}`);
    console.log(`lastApply.holder=${lock.lastApply?.holder}`);

    // Serialization proof: wall clock should be ~ sum of sleeps (>= ~1100ms), not ~max
    // and one worker should have logged a 409 retry; both exit 0; version === 3
    // (start empty → first apply v2, second apply v3 with our simulator: version = prev+1 from 1 default)
    // Actually simulator: prev.version || 1, then +1. First: 2, second: 3.
    const serialized =
      bothOk &&
      sawRetry &&
      elapsed >= 1000 &&
      (lock.resources || []).length === 2 &&
      lock.version === 3;

    if (serialized) {
      console.log('\nPROOF: workers serialized via remote lock (409→retry observed, both succeeded, 2 resources).');
      console.log('demo:race PASS');
      exitCode = 0;
    } else {
      console.error('\ndemo:race FAIL — expected serialization proof');
      console.error({ bothOk, sawRetry, elapsed, version: lock.version, resources: lock.resources?.length });
      exitCode = 1;
    }
  } catch (err) {
    console.error(`[demo] ERROR: ${err.message}`);
    if (serverLog) console.error(serverLog);
    exitCode = 1;
  } finally {
    server.kill('SIGTERM');
    await sleep(100);
    try {
      server.kill('SIGKILL');
    } catch {
      /* ignore */
    }
  }

  process.exit(exitCode);
}

main();
