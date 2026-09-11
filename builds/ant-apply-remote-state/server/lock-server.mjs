#!/usr/bin/env node
/**
 * Minimal remote lock + state server for ant apply / claude-lock.json.
 * Zero deps: node:http + node:fs. Optional x-token auth from ANT_APPLY_TOKEN.
 *
 * Endpoints:
 *   POST /lock          { projectId, holder, ttlSec? } → 200 | 409
 *   POST /unlock        { projectId, lockId, holder }  → 200 | 403/404
 *   PUT  /state/:id     lockfile JSON body             → 200
 *   GET  /state/:id                                   → 200 | 404
 *   GET  /health                                      → 200
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = process.env.ANT_APPLY_DATA_DIR || path.join(ROOT, '.data');
const PORT = Number(process.env.PORT || process.env.ANT_APPLY_LOCK_PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const TOKEN = process.env.ANT_APPLY_TOKEN || '';
const DEFAULT_TTL = Number(process.env.ANT_APPLY_DEFAULT_TTL || 120);

fs.mkdirSync(DATA_DIR, { recursive: true });

/** @type {Map<string, { lockId: string, holder: string, expiresAt: number }>} */
const locks = new Map();

function now() {
  return Date.now();
}

function purgeExpired(projectId) {
  const cur = locks.get(projectId);
  if (cur && cur.expiresAt <= now()) {
    locks.delete(projectId);
    return true;
  }
  return false;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(Object.assign(new Error('invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, body) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

function checkToken(req) {
  if (!TOKEN) return true;
  const h = req.headers['x-token'];
  return h === TOKEN;
}

function statePath(projectId) {
  const safe = projectId.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128);
  return path.join(DATA_DIR, `${safe}.json`);
}

async function handleLock(req, res) {
  const body = (await readBody(req)) || {};
  const projectId = String(body.projectId || '').trim();
  const holder = String(body.holder || '').trim();
  const ttlSec = Math.max(5, Math.min(3600, Number(body.ttlSec) || DEFAULT_TTL));

  if (!projectId || !holder) {
    return send(res, 400, { error: 'projectId and holder required' });
  }

  purgeExpired(projectId);
  const existing = locks.get(projectId);
  if (existing) {
    return send(res, 409, {
      error: 'lock held',
      holder: existing.holder,
      lockId: existing.lockId,
      expiresAt: new Date(existing.expiresAt).toISOString(),
    });
  }

  const lockId = crypto.randomUUID();
  const expiresAt = now() + ttlSec * 1000;
  locks.set(projectId, { lockId, holder, expiresAt });
  return send(res, 200, {
    lockId,
    expiresAt: new Date(expiresAt).toISOString(),
    projectId,
    holder,
    ttlSec,
  });
}

async function handleUnlock(req, res) {
  const body = (await readBody(req)) || {};
  const projectId = String(body.projectId || '').trim();
  const lockId = String(body.lockId || '').trim();
  const holder = String(body.holder || '').trim();

  if (!projectId || !lockId || !holder) {
    return send(res, 400, { error: 'projectId, lockId, and holder required' });
  }

  purgeExpired(projectId);
  const existing = locks.get(projectId);
  if (!existing) {
    return send(res, 404, { error: 'no lock' });
  }
  if (existing.lockId !== lockId || existing.holder !== holder) {
    return send(res, 403, { error: 'holder or lockId mismatch' });
  }

  locks.delete(projectId);
  return send(res, 200, { ok: true, projectId });
}

async function handlePutState(req, res, projectId) {
  if (!checkToken(req)) return send(res, 401, { error: 'unauthorized' });
  const body = await readBody(req);
  if (body == null || typeof body !== 'object') {
    return send(res, 400, { error: 'JSON body required' });
  }
  const file = statePath(projectId);
  fs.writeFileSync(file, JSON.stringify(body, null, 2) + '\n', 'utf8');
  return send(res, 200, { ok: true, projectId, bytes: fs.statSync(file).size });
}

function handleGetState(req, res, projectId) {
  if (!checkToken(req)) return send(res, 401, { error: 'unauthorized' });
  const file = statePath(projectId);
  if (!fs.existsSync(file)) return send(res, 404, { error: 'no state' });
  const raw = fs.readFileSync(file, 'utf8');
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(raw);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
    const method = req.method || 'GET';
    const p = url.pathname;

    if (method === 'GET' && p === '/health') {
      return send(res, 200, { ok: true, locks: locks.size });
    }
    if (method === 'POST' && p === '/lock') return await handleLock(req, res);
    if (method === 'POST' && p === '/unlock') return await handleUnlock(req, res);

    const stateMatch = p.match(/^\/state\/([^/]+)$/);
    if (stateMatch) {
      const projectId = decodeURIComponent(stateMatch[1]);
      if (method === 'PUT') return await handlePutState(req, res, projectId);
      if (method === 'GET') return handleGetState(req, res, projectId);
    }

    send(res, 404, { error: 'not found' });
  } catch (err) {
    const status = err.status || 500;
    send(res, status, { error: err.message || String(err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[lock-server] listening on http://${HOST}:${PORT}`);
  console.log(`[lock-server] data dir: ${DATA_DIR}`);
  if (TOKEN) console.log('[lock-server] x-token auth enabled');
});

function shutdown() {
  console.log('[lock-server] shutting down');
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
