#!/usr/bin/env node
/**
 * Basic API + wrapper smoke tests (no Anthropic credentials).
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.TEST_PORT || 8792);
const LOCK_URL = `http://127.0.0.1:${PORT}`;
const SERVER = path.join(ROOT, 'server/lock-server.mjs');
const WRAPPER = path.join(ROOT, 'bin/ant-apply-locked.mjs');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitHealth(tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`${LOCK_URL}/health`);
      if (r.ok) return;
    } catch {
      /* */
    }
    await sleep(50);
  }
  throw new Error('server not healthy');
}

async function json(method, route, body, headers = {}) {
  const res = await fetch(`${LOCK_URL}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { ...opts, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (b) => (out += b));
    child.stderr.on('data', (b) => (out += b));
    child.on('close', (code) => resolve({ code: code ?? 1, out }));
  });
}

async function main() {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'ant-apply-test-'));
  const dataDir = path.join(work, 'data');
  fs.mkdirSync(dataDir);

  const server = spawn(process.execPath, [SERVER], {
    env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', ANT_APPLY_DATA_DIR: dataDir },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let failed = 0;
  const ok = (name) => console.log(`  PASS  ${name}`);
  const fail = (name, err) => {
    failed++;
    console.error(`  FAIL  ${name}: ${err.message || err}`);
  };

  try {
    await waitHealth();
    console.log('test: lock API');

    // acquire
    let r = await json('POST', '/lock', { projectId: 'p1', holder: 'h1', ttlSec: 30 });
    assert.equal(r.status, 200);
    assert.ok(r.data.lockId);
    ok('POST /lock');

    // conflict
    r = await json('POST', '/lock', { projectId: 'p1', holder: 'h2', ttlSec: 30 });
    assert.equal(r.status, 409);
    ok('POST /lock → 409 when held');

    // wrong unlock
    r = await json('POST', '/unlock', { projectId: 'p1', lockId: r.data.lockId, holder: 'h2' });
    assert.equal(r.status, 403);
    ok('POST /unlock → 403 mismatch');

    // correct unlock — need lockId from first acquire
    const first = await json('POST', '/lock', { projectId: 'p2', holder: 'h1', ttlSec: 30 });
    r = await json('POST', '/unlock', {
      projectId: 'p2',
      lockId: first.data.lockId,
      holder: 'h1',
    });
    assert.equal(r.status, 200);
    ok('POST /unlock');

    // state
    r = await json('PUT', '/state/p1', { version: 1, hello: true });
    assert.equal(r.status, 200);
    r = await json('GET', '/state/p1');
    assert.equal(r.status, 200);
    assert.equal(r.data.hello, true);
    ok('PUT/GET /state/:projectId');

    r = await json('GET', '/state/missing');
    assert.equal(r.status, 404);
    ok('GET /state missing → 404');

    // unlock p1 for wrapper test
    // re-get by acquiring after unlock of p1 — still held from first lock
    // First lock on p1 still held. Unlock it properly:
    // We need the lockId from the first acquire — re-fetch via 409 body
    const held = await json('POST', '/lock', { projectId: 'p1', holder: 'x' });
    assert.equal(held.status, 409);
    await json('POST', '/unlock', {
      projectId: 'p1',
      lockId: held.data.lockId,
      holder: held.data.holder,
    });

    console.log('test: wrapper --simulate');
    const w = await run(
      process.execPath,
      [WRAPPER, '--simulate', '--project', 'wrap1', '--sleep-ms', '50'],
      { cwd: work, env: { ...process.env, ANT_APPLY_LOCK_URL: LOCK_URL, ANT_APPLY_HOLDER: 'tester' } }
    );
    assert.equal(w.code, 0, w.out);
    assert.ok(fs.existsSync(path.join(work, 'claude-lock.json')));
    const st = await json('GET', '/state/wrap1');
    assert.equal(st.status, 200);
    assert.ok(st.data.simulated || st.data.lastApply?.simulated);
    ok('wrapper simulate + push state');

    if (failed === 0) {
      console.log('\nall tests passed');
      process.exitCode = 0;
    } else {
      console.error(`\n${failed} test(s) failed`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('test ERROR:', err);
    process.exitCode = 1;
  } finally {
    server.kill('SIGTERM');
    await sleep(80);
    try {
      server.kill('SIGKILL');
    } catch {
      /* */
    }
  }
}

main();
