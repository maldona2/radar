/**
 * Offline demo: in-process mock upstream + cache proxy + N tools/list calls.
 * Prints a one-screen metrics report. No API keys / network.
 */

import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { createProxy } from "../src/proxy.js";
import { payloadCharCount, writeMessage, type JsonRpcRequest } from "../src/framing.js";
import { buildFatTools } from "../src/mock-server.js";

const LIST_CALLS = Number(process.env.DEMO_LIST_CALLS ?? 5);
const TTL_MS = Number(process.env.TTL_MS ?? 60_000);
const DELAY_MS = Number(process.env.MOCK_DELAY_MS ?? 150);
const TOOL_COUNT = Number(process.env.MOCK_TOOL_COUNT ?? 40);

function createMockUpstream(delayMs: number, toolCount: number) {
  const tools = buildFatTools(toolCount);
  const bus = new EventEmitter();
  return {
    tools,
    write(msg: unknown) {
      if (!msg || typeof msg !== "object") return;
      const req = msg as JsonRpcRequest;
      if (typeof req.method !== "string") return;
      setTimeout(() => {
        if (req.id === undefined || req.id === null) return;
        switch (req.method) {
          case "initialize":
            bus.emit("message", {
              jsonrpc: "2.0",
              id: req.id,
              result: {
                protocolVersion: "2024-11-05",
                capabilities: { tools: {} },
                serverInfo: { name: "radar-mock-mcp", version: "1.0.0" },
              },
            });
            break;
          case "tools/list":
            bus.emit("message", {
              jsonrpc: "2.0",
              id: req.id,
              result: { tools },
            });
            break;
          default:
            bus.emit("message", {
              jsonrpc: "2.0",
              id: req.id,
              error: { code: -32601, message: `Method not found: ${req.method}` },
            });
        }
      }, delayMs);
    },
    onMessage(handler: (msg: unknown) => void) {
      bus.on("message", handler);
    },
    close() {
      bus.removeAllListeners();
    },
  };
}

async function rpc(
  clientOut: PassThrough,
  replies: Map<number, { resolve: (v: unknown) => void }>,
  id: number,
  method: string,
  params?: unknown,
): Promise<{ elapsedMs: number; msg: unknown }> {
  const startedAt = Date.now();
  const msg = await new Promise<unknown>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timeout id=${id} method=${method}`)),
      10_000,
    );
    replies.set(id, {
      resolve: (v) => {
        clearTimeout(timer);
        resolve(v);
      },
    });
    writeMessage(clientOut, {
      jsonrpc: "2.0",
      id,
      method,
      ...(params !== undefined ? { params } : {}),
    });
  });
  return { elapsedMs: Date.now() - startedAt, msg };
}

async function main(): Promise<void> {
  const clientToProxy = new PassThrough();
  const proxyToClient = new PassThrough();
  const replies = new Map<number, { resolve: (v: unknown) => void }>();

  proxyToClient.on("data", (buf: Buffer) => {
    for (const line of buf.toString("utf8").split("\n")) {
      const raw = line.trim();
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as { id?: number };
        if (parsed.id !== undefined && replies.has(parsed.id)) {
          replies.get(parsed.id)!.resolve(parsed);
          replies.delete(parsed.id);
        }
      } catch {
        // ignore partial / noise
      }
    }
  });

  const upstream = createMockUpstream(DELAY_MS, TOOL_COUNT);
  const proxy = createProxy({
    ttlMs: TTL_MS,
    cacheScope: "demo-mock",
    upstreamArgv: [],
    metricsIntervalMs: 0,
    stdin: clientToProxy,
    stdout: proxyToClient,
    stderr: process.stderr,
    upstream,
  });

  const latencies: number[] = [];
  let toolsChars = 0;
  let id = 1;

  await rpc(clientToProxy, replies, id++, "initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "demo", version: "1.0.0" },
  });

  for (let i = 0; i < LIST_CALLS; i++) {
    const { elapsedMs, msg } = await rpc(
      clientToProxy,
      replies,
      id++,
      "tools/list",
    );
    latencies.push(elapsedMs);
    const result = (msg as { result?: unknown }).result;
    if (result && toolsChars === 0) toolsChars = payloadCharCount(result);
  }

  // Pass-through sanity: non-list method still works
  await rpc(clientToProxy, replies, id++, "ping").catch(() => undefined);

  const snap = proxy.metrics.snapshot();
  const metricsFormatted = proxy.metrics.formatLine();
  proxy.close();

  const missLatency = latencies[0] ?? 0;
  const hitLatencies = latencies.slice(1);
  const avgHit =
    hitLatencies.length === 0
      ? 0
      : Math.round(
          hitLatencies.reduce((a, b) => a + b, 0) / hitLatencies.length,
        );

  const lines = [
    "══════════════════════════════════════════════════",
    "  radar-mcp-tools-cache — demo report",
    "══════════════════════════════════════════════════",
    `  transport     : NDJSON JSON-RPC 2.0 over stdio`,
    `  list calls    : ${LIST_CALLS}`,
    `  ttlMs         : ${TTL_MS}`,
    `  mock delay    : ${DELAY_MS}ms  tools=${TOOL_COUNT}`,
    `  tools payload : ~${toolsChars} chars (~${Math.floor(toolsChars / 4)} tokens)`,
    `  latencies ms  : ${latencies.join(", ")}`,
    `  avg hit ms    : ${avgHit}  (first call = miss @ ${missLatency}ms)`,
    `  ${metricsFormatted}`,
    "══════════════════════════════════════════════════",
    "  Tip: second+ calls should be ≪ first (cache hit).",
    "══════════════════════════════════════════════════",
  ];
  console.log(lines.join("\n"));

  if (snap.hits < 1 || snap.misses < 1) {
    console.error("demo failed: expected at least 1 hit and 1 miss");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
