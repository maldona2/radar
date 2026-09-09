# C2PA × ffmpeg — destruction bank

Generated: 2026-09-09 · Mac (`c2patool` 0.27.20) + Linux box (ffmpeg 7.x)

**7/7 common ffmpeg transforms destroyed the C2PA claim.** That is the marketing number.

| Transform | id | Result |
|-----------|-----|--------|
| Stream copy (remux) | `stream-copy` | **DESTROYED** |
| Stream copy + `-map_metadata -1` | `map-metadata-strip` | **DESTROYED** |
| Re-encode H.264 + AAC | `reencode-h264` | **DESTROYED** |
| Scale to 480p + re-encode | `scale-480` | **DESTROYED** |
| Trim first 0.5s + re-encode | `trim-0.5s` | **DESTROYED** |
| Drop audio, copy video | `audio-strip` | **DESTROYED** |
| Remux + `+faststart` | `movflags-faststart` | **DESTROYED** |

Even **stream copy / remux** (no re-encode) wiped the claim. Guides that say “just `-map_metadata 0`” are not enough for C2PA JUMBF in practice with stock ffmpeg.
