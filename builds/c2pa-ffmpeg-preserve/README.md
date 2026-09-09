# c2pa-ffmpeg-preserve

Radar tesis 4 — **persistencia de procedencia**.

Wrapper liviano sobre `ffmpeg` + banco de transformaciones que muestran cuántas operaciones comunes **destruyen** manifests C2PA.

## Reqs
- `ffmpeg`
- `c2patool` (`brew install c2patool` o binario en `PATH` / `C2PATOOL`)

## Banco (&lt;2 min)
```bash
# desde esta carpeta; certs de test incluidos (NO prod)
npm run bank
# → reports/bank.md + reports/bank.json
```

## Wrapper
```bash
node src/cli.mjs --in fixtures/signed.mp4 --out /tmp/out.mp4 --transform reencode-h264
# exit 2 si había C2PA y se perdió

node src/cli.mjs --in fixtures/signed.mp4 --out /tmp/out.mp4 --transform stream-copy \
  --resign --manifest certs/manifest.json
```

## Nota
Los certs en `certs/` son de **test** (C2PA Test Signing Cert). No usar en producción ni en trust list real.

Ver `ANALYSIS.md` para kill rules.
