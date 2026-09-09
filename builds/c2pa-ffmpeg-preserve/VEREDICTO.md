# Veredicto — ¿seguir con C2PA × ffmpeg?

**Fecha:** 2026-09-09  
**SOLO #3 / Tesis 4** · Build: `builds/c2pa-ffmpeg-preserve`

## TL;DR
El MVP **ya rindió lo que tenía que rendir**: el número **7/7**.  
**No** vale un mes más de laburo deep.  
**Sí** vale dejarlo publicado como ficha Radar + 1–2 experimentos baratos si aparece señal.

## Qué quedó demostrado
1. Stock ffmpeg **rompe** C2PA en las ops más comunes (incluido remux).
2. “Solo mapear metadata” **no alcanza** frente a JUMBF firmado.
3. Persistencia Art. 50 en un pipeline real = **detectar + re-firmar (o fallar)** post-ffmpeg, no confiar en el remux.
4. Re-firmar de verdad exige certificado en la **C2PA Trust List** (o trust propio cerrado). Eso es el muro comercial, no el wrapper.

## ¿Rinde frutos seguir investigando?

| Camino | Esfuerzo | ROI esperado | Recomendación |
|--------|----------|--------------|---------------|
| Publicar banco + post con 7/7 | 0.5–1 día | Alto para Radar/credibilidad | **Hacer** |
| Pulir wrapper detect/fail/resign demo | 1–2 días | Medio (demo) | Opcional |
| Banco de “flags que la gente cree que preservan” (`-map_metadata 0`, `use_metadata_tags`, etc.) | 0.5 día | Alto (desmonta mitos) | **Sí, barato** |
| Banco sharp / ImageMagick (imágenes) | 1–2 días | Medio-alto (más volumen que video) | Solo si hay tracción del post |
| Producto SaaS / certs / compliance pack | semanas–meses | Incierto; compite con Adobe/AWS | **No ahora** |
| Integrarlo en valt-web | — | Casi nulo (no hay pipeline media) | **No** |

### Criterio personal (Matías)
Igual que el mandato JWT: **ficha OSS / Radar sí; mes de laburo no**, hasta señal externa (alguien lo pide, el post convierte, o Dic-2026 dispara RFPs).

### Criterio de mercado
- Demanda regulatoria **sí** (Art. 50 / Measure 1.2, ~2026-12-02).
- El hueco “pipelines rompen la marca” es **real**.
- El dinero grande lo van a comer hyperscalers + CAI en editores.
- Sobrevive como **dependencia aburrida** en el pipeline del cliente (CI egress check, wrapper CLI) — no como plataforma.

## Qué hay que hacer (ordenado)

### Ya hecho
- [x] Banco 7 transforms + número marketing
- [x] Wrapper detect / avisar / bloquear / re-firmar (certs de test)
- [x] Validación Mac + Linux
- [x] Push a `maldona2/radar/builds/c2pa-ffmpeg-preserve`

### Barato y útil (si seguís un poco)
1. **Post / gist** con el 7/7 y el claim “remux también mata” (wedge).
2. Ampliar el banco con 2–3 comandos “preservistas” de blogs (`-map_metadata 0`, etc.) y documentar si fallan.
3. Un **script CI** de 20 líneas: `c2patool` en el artefacto de salida → fail si no hay claim.

### Pausar / matar deep work si
- Nadie reacciona al número en ~4–6 semanas, **y**
- No hay caso de uso propio (media pipeline), **y**
- No aparece RFP / compliance ask cerca de dic-2026.

Entonces: archivar como **keep-alive OSS** (el banco sigue siendo verdad) y no invertir más.

## Comparación con otros SOLOs
| SOLO | Veredicto |
|------|-----------|
| #1 MCP tools/list cache | **Kill** (latency ya ok; dolor = schema bloat) |
| #2 Agent mandate JWT | **Pilot** 14d; ROI personal débil; ficha sí |
| #3 C2PA × ffmpeg | **Stop deep / publish bank** — mejor wedge de los tres; peor fit diario |

## Una frase
> El fruit ya está: el 7/7. Seguir es marketing + CI check, no más ciencia. Producto grande = no, hasta que alguien pague por el aburrimiento.
