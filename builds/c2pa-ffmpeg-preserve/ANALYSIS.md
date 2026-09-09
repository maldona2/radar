# Análisis — Tesis 4: Persistencia de procedencia (C2PA × ffmpeg)

Fecha: 2026-09-09 · Bitácora: ESTABLE · Obligación AI Act Art. 50 / Measure 1.2 hacia **2026-12-02**

## Qué es
Wrapper + banco: demostrar qué transformaciones ffmpeg comunes **destruyen** manifests C2PA, y (opcional) re-firmar con parent ingredient.

## Resultado MVP (2026-09-09)
**7/7 DESTROYED** — incluyendo remux (`-c copy`). Confirmado en Linux y Mac (`c2patool` 0.27.20).
Ver `reports/bank.md`.

## Por qué ahora
- C2PA define formato; pipelines (CDN/encode/crop) no preservan.
- Diciembre 2026 aprieta demanda de “provenance persistence”.
- El banco publicable es el wedge (número = marketing). El dolor es real y lo documenta la industria (egress strip, no solo generation).

## Competencia / paisaje
- `c2patool` / `c2pa-rs` — building blocks, no wrapper de pipeline.
- Adobe / CAI en editores — no cubre ffmpeg CLI genérico.
- AWS MediaConvert ya *verifica* / firma en cloud; hyperscalers van a ofrecer “managed”.
- Guías tipo “`-map_metadata 0`” subestiman JUMBF: nuestro banco las contradice en remux.

## Kill rules
- Si el banco da ~0 destrucciones con ffmpeg actual → matar (ya preserva). **No pasó.**
- Si re-sign automático no es aceptable (cert en C2PA Trust List) → el producto usable es **detect+fail** + guía, no “magia preserve”.
- Si un hyperscaler shippea preserve gestionado end-to-end en 6 meses → el banco sigue como OSS; el wrapper se achica a niche.

## Fit personal
No duele en el día a día (valt-web). Es el SOLO con **deadline externo** más claro del Radar. Buena ficha; mala apuesta full-time sin señal externa.

## Veredicto
Ver `VEREDICTO.md`.
