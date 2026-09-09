import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Metrics, estimateTokensFromChars } from "../src/metrics.js";

describe("Metrics", () => {
  it("estimates tokens as chars/4", () => {
    assert.equal(estimateTokensFromChars(400), 100);
    assert.equal(estimateTokensFromChars(3), 0);
  });

  it("accumulates hits and misses", () => {
    const m = new Metrics();
    m.recordMiss();
    m.recordHit(120, 400);
    m.recordHit(120, 400);
    const s = m.snapshot();
    assert.equal(s.misses, 1);
    assert.equal(s.hits, 2);
    assert.equal(s.requests, 3);
    assert.equal(s.latencySavedMs, 240);
    assert.equal(s.estimatedTokensSaved, 200);
    assert.match(m.formatLine(), /hits=2 misses=1/);
    assert.match(m.formatLine(), /tokens≈chars\/4/);
  });
});
