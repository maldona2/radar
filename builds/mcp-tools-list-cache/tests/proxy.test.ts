import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { createProxy } from "../src/proxy.js";
import { writeMessage, type JsonRpcRequest } from "../src/framing.js";

function mockUpstream(delayMs = 30) {
  const bus = new EventEmitter();
  let listCalls = 0;
  return {
    get listCalls() {
      return listCalls;
    },
    write(msg: unknown) {
      const req = msg as JsonRpcRequest;
      setTimeout(() => {
        if (req.id === undefined || req.id === null) return;
        if (req.method === "tools/list") {
          listCalls += 1;
          bus.emit("message", {
            jsonrpc: "2.0",
            id: req.id,
            result: {
              tools: [
                {
                  name: "t1",
                  description: "d".repeat(200),
                  inputSchema: { type: "object" },
                },
              ],
            },
          });
        } else {
          bus.emit("message", {
            jsonrpc: "2.0",
            id: req.id,
            result: { ok: true, method: req.method },
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

function collectReplies(stream: PassThrough) {
  const waiters = new Map<number, (v: unknown) => void>();
  stream.on("data", (buf: Buffer) => {
    for (const line of buf.toString("utf8").split("\n")) {
      const raw = line.trim();
      if (!raw) continue;
      try {
        const msg = JSON.parse(raw) as { id?: number };
        if (msg.id !== undefined && waiters.has(msg.id)) {
          waiters.get(msg.id)!(msg);
          waiters.delete(msg.id);
        }
      } catch {
        // ignore
      }
    }
  });
  return (id: number) =>
    new Promise<unknown>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`timeout ${id}`)), 5000);
      waiters.set(id, (v) => {
        clearTimeout(t);
        resolve(v);
      });
    });
}

describe("createProxy tools/list cache", () => {
  it("misses once then hits; passes through other methods", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const upstream = mockUpstream(40);
    const wait = collectReplies(stdout);

    const proxy = createProxy({
      ttlMs: 60_000,
      cacheScope: "test-server",
      upstreamArgv: [],
      metricsIntervalMs: 0,
      stdin,
      stdout,
      stderr: new PassThrough(),
      upstream,
    });

    const p1 = wait(1);
    writeMessage(stdin, { jsonrpc: "2.0", id: 1, method: "tools/list" });
    await p1;

    const p2 = wait(2);
    writeMessage(stdin, { jsonrpc: "2.0", id: 2, method: "tools/list" });
    await p2;

    const p3 = wait(3);
    writeMessage(stdin, { jsonrpc: "2.0", id: 3, method: "ping" });
    const ping = (await p3) as { result?: { method?: string } };

    assert.equal(upstream.listCalls, 1);
    assert.equal(proxy.metrics.hits, 1);
    assert.equal(proxy.metrics.misses, 1);
    assert.equal(ping.result?.method, "ping");
    assert.ok(proxy.metrics.estimatedTokensSaved > 0);

    proxy.close();
  });

  it("re-fetches after TTL expiry", async () => {
    const stdin = new PassThrough();
    const stdout = new PassThrough();
    const upstream = mockUpstream(10);
    const wait = collectReplies(stdout);

    const proxy = createProxy({
      ttlMs: 50,
      cacheScope: "ttl-server",
      upstreamArgv: [],
      metricsIntervalMs: 0,
      stdin,
      stdout,
      stderr: new PassThrough(),
      upstream,
    });

    const a = wait(1);
    writeMessage(stdin, { jsonrpc: "2.0", id: 1, method: "tools/list" });
    await a;

    await new Promise((r) => setTimeout(r, 70));

    const b = wait(2);
    writeMessage(stdin, { jsonrpc: "2.0", id: 2, method: "tools/list" });
    await b;

    assert.equal(upstream.listCalls, 2);
    assert.equal(proxy.metrics.misses, 2);
    assert.equal(proxy.metrics.hits, 0);

    proxy.close();
  });
});
