# Análisis — Tesis 5: Backend remoto para `ant apply`

Fecha: 2026-09-11 · Bitácora: ESTABLE · SOLO candidato (net-new)

## TL;DR
Anthropic ya hizo el Terraform de agentes (`ant apply` + `claude-lock.json`). **Ellos mismos documentan el hueco:** *“Run one apply at a time, because nothing locks the lockfile.”*  
El MVP barato (lock remoto + estado compartido) **sí vale 1–2 días como ficha**. **No** vale un mes: Anthropic o un Atlantis-clone lo pueden cerrar rápido.  
Veredicto: **SÍ análisis→MVP chico si Matías quiere**; kill inmediato si Anthropic anuncia remote state / locking.

## Qué es
`ant apply` (CLI `ant` ≥ 1.30.0, ~3/9/2026) declara agents, environments, skills, memory stores y deployments como archivos en el repo. Plan → approve → escribe `claude-lock.json` con IDs + hashes local/remoto. CI: `--dry-run` en PRs, `--yes` post-merge.

Fuente: [docs oficiales](https://platform.claude.com/docs/en/cli-sdks-libraries/cli/apply).

## Evidencia del hueco (no inferencia)
Docs, sección CI, textual:
> Run one apply at a time, because nothing locks the lockfile.

También: no adopta recursos creados en Console / `ant beta:agents create`; el lockfile es la única fuente de verdad de “qué se gestiona”. Commit del lockfile es obligatorio; applies parciales igual escriben estado.

Cobertura comunitaria (getclaudeskills, byteiota, Superpower Daily, Woyable) repite el mismo mental model Terraform **y** la misma constraint de serializar applies. **Nadie** publicó un backend de estado remoto compatible al 11/9/2026.

## Carencia concreta
Igual que Terraform pre–remote-backend:
1. **Locking distribuido** — dos `ant apply --yes` concurrentes (CI + laptop, o dos jobs) pueden corromper / divergir el lockfile.
2. **Estado compartido fuera de git** — git ayuda, pero merge conflicts en `claude-lock.json` + applies parciales duelen; equipos multi-workspace necesitan algo tipo S3+Dynamo lock.
3. **Atlantis-lite** — plan en PR / apply en merge con lock (opcional fase 2).

Lo que **no** es el hueco: el formato del lockfile (ya está); el plan/diff (ya está); WIF auth (recomendado por ellos).

## Competencia / paisaje
| Actor | Qué hace | Amenaza |
|-------|----------|---------|
| Anthropic | Dueño del CLI; extensión obvia = remote state | **Alta** — pueden shippear en semanas/meses |
| Terraform Cloud / Spacelift / Atlantis | Mental model; no hablan Claude resources | Baja directa |
| DIY git + “one apply at a time” | Workaround oficial | Cubre equipos chicos |
| Nadie OSS visible | Backend S3+lock para `claude-lock.json` | Vacío hoy |

No hay equivalente OpenAI/Google aún (byteiota) → el patrón es Claude-only por ahora.

## Fit personal (Matías)
- **Medio-alto** si ya (o va a) versionar Managed Agents / skills / deployments con `ant`.
- **Bajo** si solo usa Claude Code local sin `ant apply` en CI: el dolor no aparece hasta el segundo humano o el segundo job.
- Mejor fit diario que C2PA o GENIUS; peor urgencia que el mandato (que ya tiene piloto).

## Kill rules
1. Anthropic anuncia remote state / lock API / “apply locking” → **matar** el backend (queda gist histórico).
2. Tras el MVP, nadie en el círculo lo usa en 2–4 semanas **y** Matías no corre `ant apply` en CI → **archivar**, no pulir.
3. El MVP requiere reverse-engineer flags internos no documentados / romper el CLI → **no**; solo wrap externo (pre-apply lock + post-apply push state).
4. Si el valor real resulta ser solo Atlantis (PR comment bot) y no el lock → pivot o kill según señal.

## MVP done-when (1–2 días, local)
Sin tocar el binario de `ant`:
1. CLI wrapper `ant-apply-locked` (o script):
   - adquiere lock remoto (S3 + DynamoDB-style, o R2 + KV, o HTTP API mínima en Railway);
   - corre `ant apply …` con los mismos args;
   - sube `claude-lock.json` al store;
   - libera lock (TTL por si crashea).
2. Demo de 2 procesos concurrentes: sin wrapper → race; con wrapper → uno espera / falla limpio.
3. README + `ANALYSIS` + número: “N applies concurrentes serializados”.
4. Opcional fase 1.5: backend filesystem+HTTP en localhost para demo sin cloud.

**Fuera de scope MVP:** adopt de Console resources, multi-cloud agents, UI, Atlantis completo.

## Riesgos
- **Vendor swallow:** Anthropic cierra el hueco y el OSS queda comoditizado (aceptable como ficha Radar).
- **Adopción temprana:** pocos usan `ant apply` en equipos todavía → poca demanda externa short-term.
- **Git ya mitiga** para solo-devs → el wedge es **equipos/CI**, no el solo-founder.

## Veredicto
| Pregunta | Respuesta |
|----------|-----------|
| ¿El hueco es real? | **Sí** — documentado por Anthropic |
| ¿MVP 1–2 días? | **Sí** — wrapper + lock remoto |
| ¿Mes de laburo / producto? | **No** hasta señal (uso propio en CI o issue/PR externo) |
| ¿Mejor que Tasks store / GENIUS ahora? | **Sí** para Matías (Claude-native, wedge claro) |
| ¿Arrancar build ya? | Solo con OK explícito post-este informe |

## Próximo paso
Si Matías dice OK: scaffold en `~/Coding/radar/builds/ant-apply-remote-state` (o push a `maldona2/radar/builds/…`) con lock HTTP mínimo + demo race. Si no: dejar este ANALYSIS en la bitácora y seguir vigilando announcements de Anthropic.
