#!/usr/bin/env node
/**
 * MCP stdio proxy: client ↔ (this process) ↔ upstream MCP server.
 * Caches successful `tools/list` responses; all other methods pass through.
 *
 * Transport: NDJSON (one JSON-RPC 2.0 message per line) on stdio.
 *
 * Usage:
 *   npx tsx src/proxy.ts -- <upstream-command> [args...]
 *   TTL_MS=60000 CACHE_SCOPE=myserver npx tsx src/proxy.ts -- node dist/src/mock-server.js
 *
 * Env / flags:
 *   --ttl-ms / TTL_MS          cache TTL (default 60000)
 *   --cache-scope / CACHE_SCOPE  cache key scope (default: upstream argv joined)
 *   --metrics-interval-ms      optional periodic metrics to stderr (0 = off)
 */

import { spawn, type ChildProcess } from "node:child_process";
import type { Readable, Writable } from "node:stream";
import { TtlCache, buildCacheKey } from "./cache.js";
import {
  isJsonRpcRequest,
  payloadCharCount,
  readMessages,
  writeMessage,
  type JsonRpcMessage,
  type JsonRpcRequest,
  type JsonRpcSuccess,
} from "./framing.js";
import { Metrics } from "./metrics.js";

export interface ProxyOptions {
  ttlMs: number;
  cacheScope: string;
  upstreamArgv: string[];
  metricsIntervalMs: number;
  /** Injected for tests / in-process demos. */
  stdin?: Readable;
  stdout?: Writable;
  stderr?: Writable;
  /** If set, use this instead of spawning a child (in-process upstream). */
  upstream?: {
    write: (msg: unknown) => void;
    onMessage: (handler: (msg: unknown) => void) => void;
    close?: () => void;
  };
}

export interface ProxyHandle {
  metrics: Metrics;
  cache: TtlCache<unknown>;
  close: () => void;
}

function parseArgs(argv: string[]): {
  ttlMs: number;
  cacheScope: string | undefined;
  metricsIntervalMs: number;
  upstreamArgv: string[];
} {
  const dash = argv.indexOf("--");
  const flagArgs = dash === -1 ? argv.slice(2) : argv.slice(2, dash);
  const upstreamArgv = dash === -1 ? [] : argv.slice(dash + 1);

  let ttlMs = Number(process.env.TTL_MS ?? 60_000);
  let cacheScope = process.env.CACHE_SCOPE || undefined;
  let metricsIntervalMs = Number(process.env.METRICS_INTERVAL_MS ?? 0);

  for (let i = 0; i < flagArgs.length; i++) {
    const a = flagArgs[i];
    if (a === "--ttl-ms") ttlMs = Number(flagArgs[++i]);
    else if (a === "--cache-scope") cacheScope = flagArgs[++i];
    else if (a === "--metrics-interval-ms")
      metricsIntervalMs = Number(flagArgs[++i]);
    else if (a === "--help" || a === "-h") {
      process.stderr.write(
        "Usage: mcp-tools-cache-proxy [--ttl-ms N] [--cache-scope S] -- <upstream> [args...]\n",
      );
      process.exit(0);
    }
  }

  return { ttlMs, cacheScope, metricsIntervalMs, upstreamArgv };
}

export function createProxy(options: ProxyOptions): ProxyHandle {
  const stdin: Readable = options.stdin ?? process.stdin;
  const stdout: Writable = options.stdout ?? process.stdout;
  const stderr: Writable = options.stderr ?? process.stderr;

  const metrics = new Metrics();
  const cache = new TtlCache<unknown>({ ttlMs: options.ttlMs });
  const pending = new Map<
    string | number,
    { method: string; startedAt: number }
  >();

  let child: ChildProcess | undefined;
  let upstreamWrite: (msg: unknown) => void;
  let stopUpstream: (() => void) | undefined;
  let metricsTimer: NodeJS.Timeout | undefined;

  const forwardToClient = (msg: unknown) => {
    writeMessage(stdout, msg);
  };

  const handleUpstreamMessage = (msg: unknown) => {
    if (!msg || typeof msg !== "object") {
      forwardToClient(msg);
      return;
    }
    const m = msg as JsonRpcMessage & { id?: string | number | null };
    if ("id" in m && m.id !== undefined && m.id !== null) {
      const meta = pending.get(m.id);
      if (meta) {
        pending.delete(m.id);
        if (
          meta.method === "tools/list" &&
          "result" in m &&
          !("error" in m)
        ) {
          const latency = Date.now() - meta.startedAt;
          const result = (m as JsonRpcSuccess).result;
          const chars = payloadCharCount(result);
          const key = buildCacheKey(options.cacheScope, "tools/list");
          cache.set(key, result, {
            upstreamLatencyMs: latency,
            payloadChars: chars,
          });
        }
      }
    }
    forwardToClient(msg);
  };

  if (options.upstream) {
    upstreamWrite = options.upstream.write;
    options.upstream.onMessage(handleUpstreamMessage);
    stopUpstream = options.upstream.close;
  } else {
    if (options.upstreamArgv.length === 0) {
      throw new Error("No upstream command. Pass: -- <command> [args...]");
    }
    child = spawn(options.upstreamArgv[0], options.upstreamArgv.slice(1), {
      stdio: ["pipe", "pipe", "inherit"],
      env: process.env,
    });
    const childStdin = child.stdin;
    const childStdout = child.stdout;
    if (!childStdin || !childStdout) {
      throw new Error("Failed to open upstream stdio pipes");
    }
    upstreamWrite = (msg) => writeMessage(childStdin, msg);
    readMessages(childStdout, (msg) => handleUpstreamMessage(msg));
    child.on("exit", (code, signal) => {
      stderr.write(
        `[proxy] upstream exited code=${code} signal=${signal ?? ""}\n`,
      );
      process.exitCode = code ?? 1;
    });
    const childRef = child;
    stopUpstream = () => {
      if (!childRef.killed) childRef.kill("SIGTERM");
    };
  }

  const clientReader = readMessages(
    stdin,
    (msg) => {
      if (!isJsonRpcRequest(msg)) {
        upstreamWrite(msg);
        return;
      }
      const req = msg as JsonRpcRequest;

      if (
        req.method === "tools/list" &&
        req.id !== undefined &&
        req.id !== null
      ) {
        const key = buildCacheKey(options.cacheScope, "tools/list");
        const hit = cache.get(key);
        if (hit) {
          metrics.recordHit(hit.upstreamLatencyMs, hit.payloadChars);
          const response: JsonRpcSuccess = {
            jsonrpc: "2.0",
            id: req.id,
            result: hit.value,
          };
          forwardToClient(response);
          return;
        }
        metrics.recordMiss();
        pending.set(req.id, {
          method: req.method,
          startedAt: Date.now(),
        });
        upstreamWrite(req);
        return;
      }

      if (req.id !== undefined && req.id !== null) {
        pending.set(req.id, { method: req.method, startedAt: Date.now() });
      }
      upstreamWrite(req);
    },
    (err) => {
      stderr.write(`[proxy] bad client JSON: ${err.message}\n`);
    },
  );

  if (options.metricsIntervalMs > 0) {
    metricsTimer = setInterval(() => {
      stderr.write(`[proxy] ${metrics.formatLine()}\n`);
    }, options.metricsIntervalMs);
    metricsTimer.unref?.();
  }

  const close = () => {
    if (metricsTimer) clearInterval(metricsTimer);
    clientReader.close();
    stopUpstream?.();
  };

  return { metrics, cache, close };
}

function main(): void {
  const parsed = parseArgs(process.argv);
  const cacheScope =
    parsed.cacheScope ??
    (parsed.upstreamArgv.length
      ? parsed.upstreamArgv.join(" ")
      : "default-server");

  const handle = createProxy({
    ttlMs: parsed.ttlMs,
    cacheScope,
    upstreamArgv: parsed.upstreamArgv,
    metricsIntervalMs: parsed.metricsIntervalMs,
  });

  const shutdown = () => {
    process.stderr.write(`[proxy] ${handle.metrics.formatLine()}\n`);
    handle.close();
  };
  process.on("SIGINT", () => {
    shutdown();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    shutdown();
    process.exit(0);
  });
  process.stdin.on("end", () => {
    shutdown();
  });
}

const isDirect =
  Boolean(process.argv[1]) &&
  (process.argv[1]!.endsWith("proxy.ts") ||
    process.argv[1]!.endsWith("proxy.js"));

if (isDirect) {
  main();
}
