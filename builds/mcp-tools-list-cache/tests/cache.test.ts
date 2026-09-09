import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TtlCache, buildCacheKey } from "../src/cache.js";

describe("TtlCache", () => {
  it("misses on empty key", () => {
    const cache = new TtlCache<string>({ ttlMs: 1000 });
    assert.equal(cache.get("k"), undefined);
  });

  it("hits before TTL expiry", () => {
    const cache = new TtlCache<string>({ ttlMs: 10_000 });
    const now = 1_000_000;
    cache.set("k", "v", { upstreamLatencyMs: 50, payloadChars: 100 }, now);
    const hit = cache.get("k", now + 100);
    assert.ok(hit);
    assert.equal(hit.value, "v");
    assert.equal(hit.upstreamLatencyMs, 50);
    assert.equal(hit.payloadChars, 100);
  });

  it("expires after TTL", () => {
    const cache = new TtlCache<string>({ ttlMs: 500 });
    const now = 1_000_000;
    cache.set("k", "v", { upstreamLatencyMs: 10, payloadChars: 4 }, now);
    assert.ok(cache.get("k", now + 499));
    assert.equal(cache.get("k", now + 500), undefined);
    assert.equal(cache.get("k", now + 501), undefined);
  });

  it("buildCacheKey scopes by server identity + method", () => {
    assert.equal(
      buildCacheKey("node mock.js", "tools/list"),
      "node mock.js::tools/list",
    );
  });
});
