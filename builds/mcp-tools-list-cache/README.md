# radar-mcp-tools-cache

Minimal **MCP `tools/list` cache proxy** for local stdio servers.

It sits between an MCP client and an upstream MCP server, caches successful
`tools/list` responses (configurable TTL), and passes every other JSON-RPC
message through unchanged. Useful when clients re-list tools often and the
upstream payload is large.

**License:** MIT (see [`LICENSE`](./LICENSE)).

## Features

- Caches `tools/list` only (default TTL **60000 ms**)
- `cacheScope` defaults to **server identity** (upstream command + args, or `--cache-scope`)
- Pass-through for all other methods (`initialize`, `tools/call`, …)
- Metrics: hits / misses / latency saved / estimated tokens saved
- Offline demo + tests (no API keys)

## Transport

**Newline-delimited JSON (NDJSON)** over stdio: one JSON-RPC 2.0 message per
line, terminated by `\n`. No `Content-Length` framing.

The mock server and proxy both speak this dialect. If your real client/server
uses LSP-style `Content-Length` framing, adapt `src/framing.ts` or put a
frame translator on either side.

## Quick start (< 2 minutes)

```bash
git clone https://github.com/maldona2/radar-mcp-tools-cache.git
cd radar-mcp-tools-cache
npm install
npm test
npm run demo
```

Expected demo: first `tools/list` is slow (mock delay), later calls are near-instant cache hits, and a metrics line like:

```text
metrics hits=4 misses=1 hitRate=80% latencySavedMs=600 estimatedTokensSaved=12345 (tokens≈chars/4)
```

## Wire a real MCP client

Run the proxy with your upstream server as a child process:

```bash
npx tsx src/proxy.ts --ttl-ms 60000 --cache-scope my-server -- \
  npx -y @modelcontextprotocol/server-filesystem /tmp
```

Or after `npm run build`:

```bash
node dist/src/proxy.js --ttl-ms 60000 --cache-scope my-server -- \
  node /path/to/your-mcp-server.js
```

Point the client at the **proxy** command (stdio), not the upstream directly.
Example Cursor / Claude Desktop style config shape:

```json
{
  "mcpServers": {
    "cached-filesystem": {
      "command": "npx",
      "args": [
        "tsx",
        "/absolute/path/to/radar-mcp-tools-cache/src/proxy.ts",
        "--ttl-ms",
        "60000",
        "--cache-scope",
        "filesystem",
        "--",
        "npx",
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/tmp"
      ]
    }
  }
}
```

Env vars (optional): `TTL_MS`, `CACHE_SCOPE`, `METRICS_INTERVAL_MS`,
`MOCK_DELAY_MS`, `MOCK_TOOL_COUNT`.

## Metrics meaning

| Field | Meaning |
| --- | --- |
| `hits` / `misses` | Cache outcomes for `tools/list` |
| `hitRate` | `hits / (hits+misses)` |
| `latencySavedMs` | Sum of upstream latency recorded at fill time, credited on each hit |
| `estimatedTokensSaved` | Sum of `floor(payloadChars / 4)` on hits |

**Token estimation:** `chars / 4` on the JSON `result` payload. This is a rough
heuristic (not tiktoken / a real model tokenizer)—good enough to show order of
magnitude savings from skipping fat `tools/list` bodies.

Metrics print to **stderr** on shutdown (and periodically if
`METRICS_INTERVAL_MS` > 0).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run demo` | Mock + proxy + N list calls, one-screen report |
| `npm test` | Cache hit/miss/TTL + proxy integration tests |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run mock-server` | Standalone fat mock MCP server (NDJSON stdio) |
| `npm run proxy` | Run proxy (requires `-- <upstream>…`) |

## Layout

```text
src/proxy.ts        stdio proxy + CLI
src/cache.ts        TTL map
src/metrics.ts      counters + token estimate
src/framing.ts      NDJSON JSON-RPC helpers
src/mock-server.ts  fat tools/list + artificial delay
scripts/demo.ts     offline demo report
tests/              node:test suite
```

## Caveats / limitations

- NDJSON only (not Content-Length MCP framing)
- In-memory cache per proxy process (no disk / shared cache)
- Caches successful `tools/list` results only; does not invalidate on
  `notifications/tools/list_changed`
- Not a full MCP SDK—pragmatic JSON-RPC forwarding
- Stdio only (no HTTP transport in this minimal build)

## License

MIT
