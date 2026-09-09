export interface MetricsSnapshot {
  hits: number;
  misses: number;
  latencySavedMs: number;
  /** Rough estimate: sum of (payloadChars / 4) on cache hits. */
  estimatedTokensSaved: number;
  requests: number;
}

/**
 * Token estimation: characters / 4.
 * This is a rough heuristic (similar to common GPT-style char/4 estimates),
 * not a real tokenizer. Documented so metrics stay interpretable.
 */
export function estimateTokensFromChars(chars: number): number {
  return Math.floor(chars / 4);
}

export class Metrics {
  hits = 0;
  misses = 0;
  latencySavedMs = 0;
  estimatedTokensSaved = 0;
  requests = 0;

  recordHit(upstreamLatencyMs: number, payloadChars: number): void {
    this.requests += 1;
    this.hits += 1;
    this.latencySavedMs += upstreamLatencyMs;
    this.estimatedTokensSaved += estimateTokensFromChars(payloadChars);
  }

  recordMiss(): void {
    this.requests += 1;
    this.misses += 1;
  }

  snapshot(): MetricsSnapshot {
    return {
      hits: this.hits,
      misses: this.misses,
      latencySavedMs: this.latencySavedMs,
      estimatedTokensSaved: this.estimatedTokensSaved,
      requests: this.requests,
    };
  }

  formatLine(): string {
    const s = this.snapshot();
    const hitRate =
      s.requests === 0 ? 0 : Math.round((s.hits / s.requests) * 1000) / 10;
    return (
      `metrics hits=${s.hits} misses=${s.misses} hitRate=${hitRate}% ` +
      `latencySavedMs=${s.latencySavedMs} estimatedTokensSaved=${s.estimatedTokensSaved} ` +
      `(tokens≈chars/4)`
    );
  }
}
