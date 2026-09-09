export interface CacheEntry<T> {
  value: T;
  /** Wall-clock expiry time (Date.now() based). */
  expiresAt: number;
  /** Upstream latency observed when the entry was populated (ms). */
  upstreamLatencyMs: number;
  /** Serialized size in characters of the cached JSON-RPC result payload. */
  payloadChars: number;
}

export interface TtlCacheOptions {
  ttlMs?: number;
}

/**
 * Simple in-memory TTL cache. Not process-shared; one map per proxy instance.
 */
export class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  readonly ttlMs: number;

  constructor(options: TtlCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? 60_000;
  }

  get(key: string, now = Date.now()): CacheEntry<T> | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(
    key: string,
    value: T,
    meta: { upstreamLatencyMs: number; payloadChars: number },
    now = Date.now(),
  ): CacheEntry<T> {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: now + this.ttlMs,
      upstreamLatencyMs: meta.upstreamLatencyMs,
      payloadChars: meta.payloadChars,
    };
    this.store.set(key, entry);
    return entry;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(now = Date.now()): number {
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
    return this.store.size;
  }
}

/**
 * Default cache scope: stable server identity string (command + args or explicit id).
 * Callers can override via CACHE_SCOPE / --cache-scope.
 */
export function buildCacheKey(scope: string, method: string): string {
  return `${scope}::${method}`;
}
