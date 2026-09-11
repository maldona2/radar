# ant-apply-remote-state

**Radar thesis T5** — external remote lock + shared state for Anthropic `ant apply` / `claude-lock.json`.

Official docs say: *"Run one apply at a time, because nothing locks the lockfile."*  
This MVP wraps the CLI (does **not** patch Anthropic). Software-only demo; no paid APIs.

## Qué es / What

| Piece | Role |
|-------|------|
| `server/lock-server.mjs` | HTTP lock + state store (`node:http` + `fs`, zero deps) |
| `bin/ant-apply-locked.mjs` | Acquire → pull → `ant apply` (or `--simulate`) → push → unlock |
| `npm run demo:race` | Two concurrent simulated applies; proves serialization |

## Quick start

```bash
cd ant-apply-remote-state
npm start                 # lock server → http://127.0.0.1:8787
# another terminal:
node bin/ant-apply-locked.mjs --simulate --project demo
npm run demo:race         # must exit 0
npm test
```

Env:

| Variable | Default | Meaning |
|----------|---------|---------|
| `ANT_APPLY_LOCK_URL` | `http://127.0.0.1:8787` | Lock server base URL |
| `ANT_APPLY_TOKEN` | _(empty)_ | If set, required as `x-token` on state GET/PUT |
| `ANT_APPLY_HOLDER` | `hostname:pid` | Lock holder id |
| `PORT` / `ANT_APPLY_LOCK_PORT` | `8787` | Server listen port |
| `ANT_APPLY_DATA_DIR` | `.data/` | Where lockfile JSON is stored |

## Lock API (curl)

```bash
# Acquire (200) or conflict (409)
curl -sS -X POST http://127.0.0.1:8787/lock \
  -H 'Content-Type: application/json' \
  -d '{"projectId":"my-app","holder":"ci-job-1","ttlSec":120}'

# Unlock
curl -sS -X POST http://127.0.0.1:8787/unlock \
  -H 'Content-Type: application/json' \
  -d '{"projectId":"my-app","lockId":"<uuid>","holder":"ci-job-1"}'

# Push / pull lockfile state (optional: -H "x-token: $ANT_APPLY_TOKEN")
curl -sS -X PUT http://127.0.0.1:8787/state/my-app \
  -H 'Content-Type: application/json' \
  --data-binary @claude-lock.json

curl -sS http://127.0.0.1:8787/state/my-app
```

TTL expiry: if a client crashes, the lock auto-frees after `ttlSec` (default 120).

## Wrapper usage

```bash
export ANT_APPLY_LOCK_URL=http://127.0.0.1:8787

# Real ant (when installed + authenticated)
ant-apply-locked --project my-app -- --yes

# Demo / CI without Anthropic credentials
ant-apply-locked --simulate --project my-app --sleep-ms 500

# Flags
#   --project / -p   project id (default: sha256(cwd)[:16])
#   --simulate       fake apply (sleep + write claude-lock.json)
#   --no-pull        skip GET remote state
#   --no-push        skip PUT after success
#   --ttl N          lock TTL seconds
```

Flow: **lock → optional pull → apply → push on success → unlock in `finally`**.

## Demo race

```bash
npm run demo:race
```

Starts the server, spawns **two** concurrent `--simulate` workers on the same `projectId`.  
Expected proof:

- Second worker sees **409** / “lock held” and **retries**
- Both exit **0**
- Final `claude-lock.json` has **2** resources (serialized applies)
- Wall clock ≈ sum of sleeps (not parallel overlap)

Exit code **0** if serialization works.

## Kill rules (from ANALYSIS)

1. Anthropic announces remote state / lock API / “apply locking” → **kill** this backend (keep as historical gist).
2. After MVP, nobody in the circle uses it in 2–4 weeks **and** Matías does not run `ant apply` in CI → **archive**, don’t polish.
3. MVP must **not** reverse-engineer undocumented CLI flags / patch Anthropic’s binary — **external wrap only**.
4. If the only real value is Atlantis (PR comment bot) and not the lock → pivot or kill by signal.

See `ANALYSIS.md` for full thesis notes (Spanish).

## Layout

```
ant-apply-remote-state/
  ANALYSIS.md
  LICENSE                 # MIT
  README.md
  package.json
  bin/ant-apply-locked.mjs
  server/lock-server.mjs
  scripts/demo-race.mjs
  scripts/test.mjs
  .data/                  # runtime state (gitignored)
```

## License

MIT © 2026 Matías Maldonado
