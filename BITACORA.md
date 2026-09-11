# Radar de Oportunidades — Bitácora

Bitácora acumulativa. Cada corrida (martes y viernes) **actualiza tesis existentes** y agrega solo lo nuevo que pase el filtro.

## Criterio de selección (el filtro "pala")

Una novedad entra solo si cumple **todas**:

1. **Direccionalidad**: apunta a algo que en 5-10 años sea infraestructura dada por sentada, no una moda.
2. **Carencia**: crea una necesidad adyacente que hoy nadie cubre bien (el "pico y pala" del oro).
3. **Ventana**: todavía es temprano — hay espacio para entrar antes de que se consolide.

No entran: rondas de inversión sin producto, benchmarks, drama corporativo, rumores.

## Ámbitos vigilados

IA / infraestructura · Energía y hardware · Bio / salud / materiales · Fintech / cripto / regulación

## Estados de una tesis

`NUEVA` · `ACELERA` · `ESTABLE` · `SE LLENÓ` (ya hay competencia fuerte) · `MUERTA`

---

## SOLOs hechos — no re-proponer

Cada corrida **debe leer esta tabla antes** de rankear `[SOLO]` accionables. Si el wedge ya está acá, no vuelve a la lista ni como “evolución del draft” salvo que Matias pida explícitamente el siguiente paso.

| # | Tesis | Build / veredicto | Estado |
|---|-------|-------------------|--------|
| SOLO #1 | T2 — Caché `tools/list` MCP | `builds/mcp-tools-list-cache` | **KILL** — latency ya ~2ms; dolor = schema bloat → `GITLAB_TOOLSETS` |
| SOLO #2 | T1 — Mandato JWT + guard MCP | `~/Coding/radar/builds/agent-mandate` (piloto `dev-write` hasta ~23/9) | **MVP hecho** — no re-proponer “verificador + demo MCP”; alinear al draft Mission es *otro* ticket solo con OK |
| SOLO #3 | T4 — C2PA × ffmpeg | `builds/c2pa-ffmpeg-preserve` (`VEREDICTO.md`) | **MVP hecho / stop deep** — publish 7/7; no SaaS sin señal |
| SOLO #4 | T5 — Backend remoto `ant apply` | `builds/ant-apply-remote-state` | **MVP hecho (2026-09-11)** — lock HTTP + wrapper + `demo:race` PASS; stop deep hasta señal / Anthropic remote state |

Reglas para la lista accionable:
1. Solo ideas **net-new** o un wedge claramente distinto (no el mismo MVP con otro nombre).
2. Si una tesis ACELERA pero el SOLO ya está hecho → reportá la señal, **no** propongas rebuild.
3. Propuesta de prototipo: una sola, y **nunca** una de esta tabla.


## Norte del Radar (reorientado 2026-09-11)

**Objetivo:** hallar un hueco pionero a **3–7 años** (necesidad/infra dada por sentada) y construir temprano un producto con camino a valor al madurar. Sin presión de ingreso ya.

**Perfil:** builder generalista; valt-web = laburo (no producto); interés en agentes; LatAm/empresas reales; software-only.

**Filtro de apuesta:** inevitable documentado + buildable solo + distribución creíble + buyer nombrable + moat ≠ “falta un RFC”.

**Anti:** wrappers/demos/fichas técnicas como apuesta principal; recircular SOLOs hechos.

### Apuestas candidatas (snapshot 2026-09-11)
Ver mensaje Chief of Staff del mismo día. Ranking vivo se actualiza en corridas mar/vie.

## Última corrida

**2026-09-11** (America/Argentina/Tucuman). Sin tesis nuevas (filtro severo). **Corrección post-corrida:** el ranking [SOLO] recirculó wedges ya hechos (mandato / cache MCP / C2PA); se agregó la tabla *SOLOs hechos — no re-proponer*. Actualizaciones: T1 Mission draft latest 9/9; T2 AWS Well-Architected + shims/Tasks; T3 balloteo NERC en curso; T5/T6 NUEVA→ESTABLE; T7 →ACELERA (forms OCC 25/9).

## Tesis vivas

| # | Tesis | Ámbito | Estado | Última revisión |
|---|-------|--------|--------|-----------------|
| 1 | El mandato del agente | IA + Fintech/regulación | ACELERA | 2026-09-11 |
| 2 | El plano de datos de MCP | IA / infraestructura | ACELERA | 2026-09-11 |
| 3 | El traductor scheduler ↔ red eléctrica | Energía / hardware | ACELERA | 2026-09-11 |
| 4 | Persistencia de procedencia (AI Act Art. 50) | Regulación | ESTABLE | 2026-09-11 |
| 5 | Terraform para agentes | IA / infraestructura | ESTABLE | 2026-09-11 |
| 6 | Sesiones persistentes agente↔modelo | IA / infraestructura | ESTABLE | 2026-09-11 |
| 7 | Kit de cumplimiento bancos/stablecoins | Fintech / regulación | ACELERA | 2026-09-11 |

---

### [2026-08-26] Tesis 1 — El mandato del agente: falta el objeto que dice "actúo por X con estos límites"

**TL;DR:** El agente ya tiene identidad estandarizada (una URL firmada), pero nada expresa *en nombre de quién* actúa ni con qué límites. Tres estándares técnicos y dos reguladores financieros llegaron al mismo hueco por caminos separados.

**Ámbito:** IA / infraestructura + Fintech / regulación (converge desde los dos lados)

**Qué pasó:**
Tres cuerpos de estándares independientes aterrizaron en el mismo modelo de identidad de agente en julio-agosto 2026: el draft IETF de Web Bot Auth donde el identificador de un cliente automatizado *es* la URL HTTPS que publica su JWKS ([draft-meunier-webbotauth-httpsig-protocol-02](https://datatracker.ietf.org/doc/draft-meunier-webbotauth-httpsig-protocol/), 18/8/2026); el draft OAuth de Client ID Metadata Document, ya adoptado por el WG, donde el `client_id` es una URL sin pre-registro ([draft-ietf-oauth-client-id-metadata-document-02](https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/), 6/7/2026); y la spec MCP `2026-07-28` que deprecó Dynamic Client Registration a favor de CIMD ([blog MCP](https://blog.modelcontextprotocol.io/posts/2026-07-28/)).
En paralelo, y sin conexión aparente, dos reguladores financieros escribieron el mismo hueco desde el otro lado: MAS publicó [SAFR](https://www.mas.gov.sg/publications/monographs-or-information-paper/2026/safeguards-for-agentic-finance-at-runtime) (julio 2026), que exige un checkpoint de gobernanza entre cada decisión del agente y su ejecución; y la FCA publicó el [Mills Review](https://www.fca.org.uk/publication/corporate/the-mills-review.pdf) (julio 2026), cuya recomendación 5 pide que el consumidor fije límites por adelantado en vez de aprobar paso a paso, y deja a la firma responsable del resultado aunque use herramientas de terceros.
**[2026-09-07]** Movimiento adicional del lado técnico, justo en el borde de la ventana anterior: el [roadmap oficial de MCP](https://blog.modelcontextprotocol.io/posts/mcp-roadmap/) (22/8/2026) declaró "agent identity and enterprise security" vía DPoP y Workload Identity Federation como próximo foco del protocolo, y Okta lanzó [Agent SSO GA](https://www.okta.com/) (24/8/2026) implementando el estándar XAA (Cross App Access, tokens ID-JAG) con extensión para MCP como "Enterprise-Managed Authorization". Ambos confirman la dirección pero atacan identidad técnica — quién firma — no el mandato en sí — en nombre de quién, con qué límites. La carencia central sigue sin cubrir.

**Por qué importa en 5-10 años:**
Firmar los requests salientes va a ser tan dado por sentado como tener TLS. Pero el estándar técnico solo prueba *quién firmó*; el texto de Web Bot Auth dice explícitamente que no hace ninguna afirmación sobre legitimidad ni autorización del operador. Y los reguladores están pidiendo exactamente lo que ese estándar dejó afuera. Cuando un agente ejecuta un pago o una acción irreversible, hay tres preguntas que alguien tiene que poder responder después: quién lo autorizó, con qué límites, y si se salió de ellos. Eso es un objeto de datos — el mandato — que hoy no tiene formato canónico, ni custodio, ni forma de presentarse como prueba.

**La carencia:**
Nadie cubre el *on-behalf-of*. El AS ve una URL, no un mandato. Falta concretamente: (a) un formato de mandato — alcance, monto, comerciante, frecuencia, vencimiento — verificable por cualquier contraparte antes de ejecutar; (b) un lugar donde el usuario lo revoque una sola vez y valga en todas las plataformas; (c) un audit trail con integridad probatoria, que es lo que SAFR pide sin decir en qué formato; (d) reputación/atestación de identificadores-URL: quién opera esa URL, qué organización legal hay detrás, qué incidentes tuvo. Hoy la única respuesta operativa a (d) es "estar en la lista de Cloudflare".

**Ideas paralelas:**
1. `[SOLO]` ~~**Librería + spec de mandato de agente.**~~ **HECHO (SOLO #2, 2026-09-09):** MVP JWT + guard MCP en `agent-mandate`; piloto en curso. No re-proponer. El draft Mission (9/9) es señal de tesis, no ticket automático de rebuild. Un formato firmado (JWT/VC) que expresa "el agente en la URL X actúa por el usuario Y, hasta $Z, en el dominio W, hasta la fecha F", con verificador en las tres o cuatro runtimes que importan y adaptadores para MCP y OAuth CIMD. *Primera versión mínima:* el verificador y una demo end-to-end donde un server MCP rechaza una tool call cuyo mandato no cubre el alcance pedido. Esto es un fin de semana de código y un año de posicionamiento — el que escribe la implementación de referencia influye sobre el estándar.
2. `[SOLO]` **Consola de mandatos del lado usuario.** Un solo lugar donde ver todos los agentes que actúan por vos, con qué límites, y matarlos. Empieza como herramienta open source; el registro que la respalda es el negocio.
3. `[CAPITAL]` **Registro neutral de identidad y reputación de agentes.** La barrera es de distribución y confianza, no técnica: hay que ser creíble para verificadores del lado servidor y sobrevivir a que Cloudflare quiera ser eso mismo. Solo tiene sentido con respaldo institucional.

**Ventana:**
Estimo 12-24 meses. Los drafts son individual/WG submissions, ninguno es RFC. SAFR y Mills son explícitamente **no vinculantes** — ese es el momento previo a la norma, no el posterior, y es exactamente donde un formato puede quedar consagrado. Riesgo de cierre: Cloudflare ya opera el trust registry de facto ([Verified Bots con Message Signatures](https://blog.cloudflare.com/verified-bots-with-cryptography/)) y va a intentar quedarse con la capa de reputación. La jugada no es competir con su edge, es la capa portable con delegación por usuario, que a ellos no les interesa.

**[2026-09-11]** Señal fuerte del lado estándar: el draft individual [Mission-Bound Authorization for OAuth 2.0](https://datatracker.ietf.org/doc/draft-mcguinness-oauth-mission/) (`draft-mcguinness-oauth-mission`) tiene revisión **latest publicada el 9/9/2026** en el sitio del autor ([HTML](https://mcguinness.github.io/mission-bound-authorization/draft-mcguinness-oauth-mission.html); -00 en datatracker sigue fechado 6/7/2026). Define exactamente el objeto que esta tesis nombraba — *Mission*: Intent → Authority Set → approval con `intent_hash`/`authority_hash` → tokens con claim `mission`, gated por lifecycle — y deja runtime enforcement en un companion separado ([Mission Mandate](https://mcguinness.github.io/mission-bound-authorization/draft-mcguinness-mission-mandate.html), [Mission Runtime](https://mcguinness.github.io/mission-bound-authorization/draft-mcguinness-mission-runtime.html)). Incluye mapeo explícito de tools MCP a `mission_resource_access`. Sigue siendo individual submission, no WG; **no hay implementación de referencia usable**. La carencia de producto (verificador + consola de mandatos) no se cerró — se volvió más concreta: ahora hay un formato candidato contra el cual implementar.

**Estado:** ACELERA

---

### [2026-08-26] Tesis 2 — El plano de datos de MCP: se volvió ruteable por header y no hay gateway a la altura

**TL;DR:** MCP se volvió stateless y ruteable por header: habilitó la capa de gateways, cachés y políticas — y no construyó ninguna. La spec deja todo eso explícitamente fuera de alcance.

**Ámbito:** IA / infraestructura

**Qué pasó:**
La spec MCP `2026-07-28` eliminó el handshake `initialize`/`initialized` y el header `Mcp-Session-Id`: cada request viaja solo. Introdujo headers `Mcp-Method` y `Mcp-Name` para que gateways, balanceadores y rate-limiters ruteen **sin inspeccionar el body**, y `ttlMs`/`cacheScope` en los resultados de `tools/list`. Roots, Sampling y Logging quedan deprecados con ventana de 12 meses. Fuentes: [spec 2026-07-28](https://blog.modelcontextprotocol.io/posts/2026-07-28/), [release candidate](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/), [SDK betas](https://blog.modelcontextprotocol.io/posts/sdk-betas-2026-07-28/).
**[2026-09-07]** Anthropic operacionalizó la dirección a nivel de producto: el [changelog de Claude Code v2.1.259](https://code.claude.com/docs/en/changelog) (2/9/2026) agregó `managedMcpServers`, un setting gestionado que deja a una organización proveer servidores MCP HTTP/SSE a todos sus usuarios — y excluye deliberadamente servidores locales por comando (stdio). Confirma que el "MCP empresarial" que se viene es fleet management de servidores remotos, no de procesos locales — pero sigue siendo un silo por vendor: Anthropic gestiona su propia flota, no hay gobernanza cross-cliente todavía.

**Por qué importa en 5-10 años:**
*(Inferencia mía, pero con un precedente muy directo.)* El cambio no es cosmético: convierte MCP de "sesión con estado entre host y server" en un protocolo HTTP sin estado, escalable horizontalmente y — la parte que importa — **gobernable por intermediarios**. Es la misma transición que HTTP/1.1 + headers habilitó para la CDN y el API gateway. Una vez que el tráfico de herramientas es ruteable por header, la capa de intermediarios aparece sola: proxies de política, cachés, WAFs de tool-calls. Ese estrato se vuelve dado por sentado.

**La carencia:**
La spec habilita el ruteo y deja explícitamente fuera de alcance todo lo demás. Falta: gateway de grado producción con autorización *por herramienta individual* (no por servidor), quotas por `Mcp-Name`, auditoría y DLP sobre argumentos y resultados; caché compartida de `tools/list` — `ttlMs` y `cacheScope` son metadata nueva sin implementación de referencia, falta el Varnish de catálogos de herramientas; y store durable para el nuevo Multi Round-Trip Request (`resultType: "input_required"`), que trasladó al cliente la responsabilidad del estado de interacciones a medio completar. *(Inferencia: eso último es lo que va a doler primero en producción.)*

**Ideas paralelas:**
1. `[SOLO]` ~~**Caché de `tools/list` como proxy de una línea.**~~ **KILL (SOLO #1, 2026-09-09):** proxy inútil vs GitLab real; pivot a pruning/`GITLAB_TOOLSETS`. Lo más chico y lo más inmediatamente útil. *Primera versión mínima:* un proxy que respeta `ttlMs`/`cacheScope` y mide cuánto latency y cuántos tokens ahorra en un host real. Si el número es bueno, el número es el marketing.
2. `[SOLO]` **Shim de migración legacy → 2026-07-28.** Roots, Sampling, Logging y el transporte HTTP+SSE vencen a mediados de 2027. Es un nicho con fecha de vencimiento — precisamente por eso nadie grande lo va a atender, y es la puerta de entrada a los clientes que después necesitan el gateway.
3. `[CAPITAL]` **Gateway de política MCP para empresa.** La barrera es de venta, no de código: hay que entrar en el ciclo de compra de seguridad corporativa. Los gateways MCP existentes fueron diseñados contra el modelo con sesión y quedan arquitectónicamente desalineados — esa es la apertura.

**Ventana:**
12-18 meses. La spec tiene menos de un mes y los SDKs salieron en beta en la misma ventana. Se cierra cuando los cloud vendors agreguen soporte MCP nativo en sus API gateways — pero el gateway genérico no llega a la política *específica de herramientas*, y ahí queda espacio más tiempo.

**[2026-09-11]** Cloud vendors operacionalizan el gateway MCP: AWS publicó (1/9/2026) el post de Architecture [*MCP went stateless… Well-Architected*](https://aws.amazon.com/blogs/architecture/mcp-went-stateless-is-your-aws-mcp-server-deployment-well-architected/) mapeando 2026-07-28 al Agentic AI Lens, y AgentCore Gateway ya admite `2026-07-28` vía `UpdateGateway` ([ML blog](https://aws.amazon.com/blogs/machine-learning/how-agentcore-gateway-supports-the-mcp-2026-07-28-spec/)). En paralelo aparecen shims OSS de migración legacy→stateless ([mcp-uplift](https://github.com/MohibShaikh/mcp-uplift), [mcpsense-proxy](https://github.com/comerade2134/mcpsense-proxy)) y una lib que honra `ttlMs`/`cacheScope` ([mcp-cache-kit](https://github.com/studiomeyer-io/mcp-cache-kit)). Microsoft publicó (7/8/2026) el sample durable de **MCP Tasks** sobre App Service + Table Storage + Service Bus ([Tech Community](https://techcommunity.microsoft.com/blog/appsonazureblog/build-durable-long-running-mcp-tasks-on-azure-app-service/4545170)) — confirma que el handle de task ≠ trabajo durable. El shim de migración (idea SOLO #2) se está llenando; la caché de catálogo tiene primer kit. **Sigue vacío** el gateway de política *por herramienta* cross-cliente y un store durable *portable* (SQLite/Postgres, no atado a Azure) para Tasks/MRTR.

**Estado:** ACELERA

---

### [2026-08-26] Tesis 3 — El traductor scheduler ↔ red eléctrica: nadie habla los dos idiomas

**TL;DR:** FERC va a obligar a modelar los datacenters como entidades eléctricas registradas, y PJM propuso cortarlos primero si no traen su propia generación. La curva de potencia real la define el scheduler, y nadie habla los dos idiomas.

**Ámbito:** Energía / hardware

**Qué pasó:**
Dos movimientos regulatorios en la ventana. El 16/7/2026 FERC ordenó a NERC presentar estándares obligatorios de *computational load integration* — incluyendo criterios de **registro** de cargas computacionales como entidades — antes del 31/12/2026, sin fijar umbrales: delegó todo a NERC ([resumen del docket RD26-7](https://www.willkie.com/-/media/files/publications/2026/07/ferc-orders-new-reliability-standards-for-data-centers-and-other-computational-loads.pdf); [guía técnica NERC, mayo 2026](https://www.nerc.com/globalassets/our-work/guidelines/reliability/RG_Risk-Mitigation-For-Emerging-Large-Loads.pdf)). Esa guía exige modelos dinámicos site-specific verificados antes de energizar, telemetría continua, espectro armónico esperado, y la declaración de la **porción de carga que es entrenamiento de IA**. Documenta el fenómeno CILR: apagones sincronizados de demanda en datacenters *geográficamente distintos* porque comparten el mismo job distribuido.
El 13/8/2026 PJM presentó ante FERC su marco IRAS: las Large Loads nuevas deben "build, bring, or buy" la generación que las respalde, y las que no **se cortan primero**, antes que los consumidores tradicionales ([PJM Inside Lines](https://insidelines.pjm.com/pjm-proposes-framework-to-connect-data-centers-without-compromising-reliability-affordability/)). De 32 GW de crecimiento proyectado 2024-2030 en PJM, 30 GW son datacenters.
**[2026-09-07]** Movimiento grande y concreto: bajo el Proyecto 2026-02, NERC posteó (19/8/2026) los borradores técnicos CLO-001-1, CLO-002-1 y CLO-003-1, con comment period hasta el 18/9 y balloteo inicial 9-18/9 ([boletín NERC](https://www.nerc.com/globalassets/programs/compliance/bulletins/2026_08_31_standardscompliancebulletin.pdf)). Crean dos entidades funcionales registradas nuevas — **Computational Load Owner** y **Computational Load Operator** — para sitios de ≥50 MW conectados a ≥100 kV, que exige modelos steady-state, dinámicos y de cortocircuito por sitio, verificados antes de energizar, re-verificados a los 180 días de cambios de hardware/firmware y cada 10 años, con envío obligatorio cada 13 meses. Es el registro formal que la Tesis 3 anticipaba — confirma que el datacenter pasa de "cliente" a recurso eléctrico registrado, con un pipeline de modelado que hoy nadie automatiza desde la telemetría real (DCGM/Redfish) del cluster.

**Por qué importa en 5-10 años:**
*(Inferencia, con precedente fuerte en los inversores tras la Orden 901.)* Una vez que existe un registro NERC de cargas computacionales, el datacenter deja de ser "un cliente" y pasa a ser un recurso registrado con obligaciones de comportamiento dinámico. Ese camino no se revierte. Y con IRAS, la flexibilidad de cómputo se vuelve moneda: la diferencia entre interconectarse en 3 años o en 7. Cuando "cuánto podés apagar y con cuánta anticipación" define el CAPEX de un campus, la flexibilidad deja de ser una promesa contractual y pasa a ser una capacidad operativa medida y liquidada.

**La carencia:**
Es casi puramente de software, y es la más limpia de las cuatro tesis por una razón estructural: **la gente que corre PSS/E no tiene acceso al stack de scheduling, y la gente que tiene el scheduler no sabe qué es un modelo de secuencia positiva.** La dinámica eléctrica real de un cluster de entrenamiento no la determina la PDU sino el paso de optimización — un all-reduce es un colapso de potencia sincronizado. Falta: (a) el traductor de telemetría de GPU/rack (DCGM, Redfish) a parámetros de modelo de carga validados, re-validados cuando cambia el workload — hoy es un PDF a mano que queda obsoleto en semanas; (b) análisis de riesgo correlacionado entre sitios (CILR), que es un problema de grafo cruzando topología de red eléctrica con topología de job placement; (c) el *grid-aware scheduler*: traducir una señal de despacho en power capping, migración de jobs y priorización inferencia-vs-entrenamiento sin destruir un training run — Kubernetes y Slurm no tienen concepto de precio ni de contingencia eléctrica; (d) M&V de la reducción contra un baseline no estacionario, que es el problema que ya mató a media industria del demand response, ahora con dos órdenes de magnitud más de dinero encima.

**Ideas paralelas:**
1. `[SOLO]` **Simulador de firma eléctrica de un training job.** Dado un job (topología de comunicación, tamaño de batch, tipo de all-reduce), predecir la curva de potencia y su espectro. Open source, chico, y es la pieza que ambos lados necesitan y ninguno puede escribir. *Primera versión mínima:* correr un job real instrumentado en un cluster chico y mostrar que la predicción coincide con la medición. Con eso en la mano se entra a la conversación con quien sea.
2. `[SOLO]` **Herramienta de riesgo correlacionado.** Cruzar placement de jobs contra contingencias compartidas de transmisión. Es análisis de grafos sobre datos mayormente públicos.
3. `[CAPITAL]` **Grid-aware scheduler como producto.** La barrera es acceso: hay que estar adentro de un operador de flota para probarlo. Los hyperscalers lo van a construir in-house si nadie llega antes.

**Ventana:**
12-24 meses, y con reloj visible: el estándar NERC se escribe *ahora* (borrador a diciembre 2026), y la filing de PJM tiene menos de dos semanas. Los incumbentes (consultoras de potencia, EMS como GE Vernova o Hitachi) están todos del lado *red*; del lado *cómputo* no hay nadie. Se cierra cuando NERC publique requisitos concretos y las consultoras grandes armen la práctica. Con el borrador ya en comment period y balloteo activo, el reloj empezó a correr en serio.

**[2026-09-11]** Reloj vivo: el balloteo inicial de CLO-001-1 / CLO-002-1 / CLO-003-1 + FAC-001-5 / FAC-002-5 corre **9–18/9/2026** (cierra 18/9 20:00 ET); comment period ROP cierra el mismo día ([boletín NERC 31/8](https://www.nerc.com/globalassets/programs/compliance/bulletins/2026_08_31_standardscompliancebulletin.pdf); [ROP page](https://www.nerc.com/who-we-are/rules-of-procedure/proposed-changes-to-rules-of-procedure)). PJM IRAS / Large Load Registry (docket ER26-3515-000): comentarios cerraron 3/9; effective date pedida **12/10/2026** ([Power Mag](https://www.powermag.com/pjm-widens-response-to-data-center-load-as-capacity-shortfalls-deepen/); [Data Center Knowledge](https://www.datacenterknowledge.com/energy-power-supply/pjm-s-new-deal-for-data-centers-bring-power-or-face-cuts)). La carencia del traductor scheduler↔modelo eléctrico no tiene producto nuevo visible. **Bloqueo [SOLO] #1 (simulador):** validar predicción vs medición real exige cluster instrumentado (GPU/DCGM) que Matias no tiene — no proponer build hasta acceso a telemetría real o dataset público equivalente.

**Estado:** ACELERA

---

### [2026-08-26] Tesis 4 — Persistencia de procedencia: la obligación ya está viva y los pipelines la rompen

**TL;DR:** La obligación de marcar contenido generado por IA ya está vigente en la UE, y además hay que *preservar* la marca al transformar contenido. Casi ningún pipeline lo hace, y el deadline duro es el 2 de diciembre.

**Ámbito:** Regulación / contenido

**Qué pasó:**
Las obligaciones de transparencia del Artículo 50 del AI Act **aplican desde el 2 de agosto de 2026**: los proveedores deben añadir marcas legibles por máquina que permitan detectar contenido generado o manipulado por IA. La Comisión publicó el Code of Practice on Transparency of AI-Generated Content el 10/6/2026 y actualizó sus guidelines el 6/8/2026. Hay fecha transitoria al **2 de diciembre de 2026** para sistemas puestos en el mercado antes de agosto. Fuentes: [guidelines](https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-transparency-obligations), [FAQ del Code](https://digital-strategy.ec.europa.eu/en/faqs/code-practice-transparency-ai-generated-content).
**[2026-09-07]** Sin novedades verificadas en la ventana 26/8-7/9: ningún subagente encontró actualización nueva de la Comisión Europea sobre Art. 50 o C2PA en este período. La cuenta regresiva al 2 de diciembre sigue corriendo sin cambios de fondo.

**Por qué importa en 5-10 años:**
*(Inferencia.)* La procedencia de contenido converge con identidad de agentes y con pagos: un canal firmado y con timestamp que dice "esto lo produjo tal sistema, en tal momento" sirve igual para etiquetar un deepfake, para atribuir la acción de un agente y para probar algo en una disputa. Es plomería de confianza, y la plomería de confianza siempre termina dada por sentada. Notar que esta tesis y la Tesis 1 apuntan al mismo sustrato desde ángulos distintos — si convergen, es una señal de que hay que mirar ahí primero.

**La carencia:**
C2PA/CAWG definen el *formato*; nadie provee el *servicio*. Falta: (a) un verificador neutral multi-proveedor — dado un archivo, decir si está marcado, por quién, y si la marca sobrevivió transformaciones, sin consultar al proveedor original uno por uno; (b) **provenance persistence**: la Measure 1.2 obliga a preservar las marcas existentes cuando un sistema de IA transforma contenido que recibe como input. Esa obligación cae sobre todo pipeline que reencodea, recorta o resume — CDNs, editores, plataformas — y hoy casi ninguno lo hace; (c) metodología de evidencia para quien **no** firme el Code y tenga que demostrar "alternative equivalently adequate means". Eso último es un producto de auditoría entero y no existe.

**Ideas paralelas:**
1. `[SOLO]` **Librería de preservación de procedencia para pipelines.** Un wrapper sobre ffmpeg / sharp / los transformadores comunes que preserve y re-firme la metadata C2PA en cada paso. Es aburrido, es obligatorio a partir de diciembre, y es exactamente el tipo de cosa que termina siendo dependencia de medio mundo. *Primera versión mínima:* el wrapper de ffmpeg más un banco de pruebas que muestre cuántas transformaciones comunes destruyen la marca hoy — ese banco de pruebas es publicable solo y genera la demanda.
2. `[SOLO]` **Verificador cross-provider como servicio.** Una API y una página donde tirás un archivo y te dice qué sabe. El producto es la cobertura, no la criptografía.
3. `[CAPITAL]` **Auditoría de conformidad del Artículo 50** para quien no firmó el Code. Requiere credibilidad regulatoria y presencia en la UE.

**Ventana:**
Corta — 6-12 meses, la más apretada de las cuatro, porque la obligación ya está viva. Diciembre de 2026 es el punto de inflexión de demanda. Se cierra cuando un hyperscaler ofrezca verificación de procedencia gestionada. La idea 1 es la que mejor sobrevive a eso, porque vive en el pipeline del cliente y no compite con un servicio.

**[2026-09-09] SOLO #3 cerrado (MVP).** Banco en `builds/c2pa-ffmpeg-preserve`: **7/7** transforms ffmpeg destruyen C2PA (incluido remux). Veredicto: publicar el número; no escalar a producto sin señal externa. Detalle: `builds/c2pa-ffmpeg-preserve/VEREDICTO.md`.

**[2026-09-11]** Sin novedades de la Comisión Europea en la ventana 7–11/9 sobre Art. 50 / Code of Practice. Cuenta regresiva al **2/12/2026** (~82 días). El MVP del banco de destrucción C2PA sigue siendo el artefacto accionable; no hay señal externa nueva que justifique escalar a producto.

**Estado:** ESTABLE

---

### [2026-09-07] Tesis 5 — Terraform para agentes: Anthropic define el patrón, nadie construyó el backend de estado compartido

**TL;DR:** Anthropic lanzó `ant apply`, gestión declarativa de agentes al estilo Terraform (plan→apply, drift, lockfile) — pero el propio doc admite que nada bloquea el lockfile. Falta el Terraform Cloud de la infraestructura agentic.

**Ámbito:** IA / infraestructura

**Qué pasó:**
El 3/9/2026 Anthropic incorporó `ant apply` a la CLI `ant` (v1.30.0): gestiona agentes, environments, skills, memory stores y deployments como recursos versionados en archivos, con workflow plan→apply, detección de drift por hash local vs. remoto, y un lockfile `claude-lock.json` que hay que commitear a mano ([docs](https://platform.claude.com/docs/en/cli-sdks-libraries/cli/apply); [release notes](https://platform.claude.com/docs/en/release-notes/overview)). La documentación dice textual que "nothing locks the lockfile": no hay backend de estado remoto, no hay locking para applies concurrentes, no hay rollback versionado — solo reversión manual o `--force`.

**Por qué importa en 5-10 años:**
*(Inferencia, con precedente directo.)* Es el mismo patrón que consagró a Terraform en cloud: declarar recursos como código, reconciliar contra el estado real. En 5-10 años gestionar flotas de agentes a mano vía consola va a ser tan raro como crear buckets S3 a mano hoy. Pero hoy es de un solo vendor — solo gestiona recursos de Anthropic — así que el patrón quedó validado y el backend cross-vendor sigue vacío.

**La carencia:**
Falta exactamente lo que en el mundo Terraform resolvieron Terraform Cloud, Atlantis, Spacelift, env0: (a) backend de estado remoto y compartido para equipos; (b) locking distribuido para applies concurrentes; (c) aprobaciones vía PR y rollback versionado; (d) — la parte nueva — todo esto cruzando múltiples proveedores de agentes (Anthropic, OpenAI, Google), no solo uno.

**Ideas paralelas:**
1. `[SOLO]` ~~**Backend de estado remoto para `ant apply`.**~~ **HECHO (SOLO #4, 2026-09-11):** `builds/ant-apply-remote-state` — lock HTTP + wrapper + demo:race PASS. No re-proponer; kill si Anthropic shippea remote state. Un servicio mínimo que reemplace el lockfile local por estado compartido con locking, compatible con el formato que ya definió Anthropic. *Primera versión mínima:* un backend tipo S3+lock (el mismo patrón que usó Terraform en sus primeros años) que dos personas puedan usar sin pisarse el `apply`.
2. `[SOLO]` **Wrapper de CI tipo Atlantis-para-agentes.** Plan en el PR, apply al mergear. Es la integración más pedida en el mundo Terraform y acá no existe ninguna todavía.
3. `[CAPITAL]` **Terraform Cloud para agentes, cross-vendor.** La barrera es cubrir múltiples proveedores con formatos de recurso distintos y venderle a equipos de plataforma — es un producto de infraestructura serio, no un fin de semana.

**Ventana:**
6-12 meses. La herramienta tiene días. Se cierra cuando Anthropic mismo construya el backend de estado (es la extensión obvia de lo que ya publicaron) o cuando HashiCorp/Pulumi anuncien soporte de providers para recursos de agentes.

**[2026-09-11]** Cobertura comunitaria del patrón (QA/ops posts 8/9) pero **ningún backend remoto** apareció: `claude-lock.json` sigue sin locking distribuido; Anthropic no anunció estado compartido. La carencia (S3+lock / Atlantis-para-agentes) está igual de abierta. Pasa de NUEVA → ESTABLE: el patrón quedó confirmado, no aceleró el cierre del hueco.

**Estado:** ESTABLE

---

### [2026-09-07] Tesis 6 — Sesiones persistentes agente↔modelo: cada proveedor arma su propio protocolo de estado, sin estándar de reconexión

**TL;DR:** OpenAI lanzó WebSocket Mode con tool calling asíncrono y mid-turn steering, con ~40% menos latencia en flujos con muchas tool calls. Es el patrón que va a reemplazar request/response por turno — y no hay ningún estándar cross-vendor para reconectar o recuperar estado cuando la conexión se corta.

**Ámbito:** IA / infraestructura

**Qué pasó:**
El 3/9/2026 OpenAI agregó a la Responses API un modo WebSocket persistente (hasta 60 minutos por conexión, hasta 16 streams concurrentes multiplexados vía `stream_id`, forking de conversaciones), tool calling asíncrono (el modelo sigue trabajando mientras la app corre las tools) y mid-turn steering (mandar instrucciones nuevas con una respuesta en curso). OpenAI reporta ellos mismos hasta ~40% menos latencia end-to-end en rollouts con 20+ tool calls ([changelog](https://developers.openai.com/api/docs/changelog); [guía de WebSocket Mode](https://developers.openai.com/api/docs/guides/websocket-mode)).

**Por qué importa en 5-10 años:**
*(Inferencia.)* El incentivo económico (latencia, costo) es demasiado fuerte para que esto quede como feature aislada: las conexiones bidireccionales con estado del lado servidor van a reemplazar el patrón por-turno para cualquier agente de tareas largas, de la misma forma que pasó con voz/video en tiempo real.

**La carencia:**
Cada proveedor está armando su propio protocolo de sesión larga sin ningún estándar de reconexión, checkpointing o estado recuperable cuando se corta la conexión (red móvil, tab cerrada, deploy). Falta una capa de gateway que normalice esto entre proveedores de LLM — hoy Cloudflare Durable Objects/Agents SDK y LiveKit tienen piezas de infraestructura de sesión con estado, pero ninguno apunta específicamente a sesiones agentic de tool-calling multi-proveedor.

**Ideas paralelas:**
1. `[SOLO]` **Proxy de reconexión con checkpoint.** Un gateway delante de WebSocket Mode que guarda snapshots de estado de sesión y permite reanudar tras un corte, sin cambiar el código del cliente. *Primera versión mínima:* demo que mate la conexión a propósito a mitad de una tarea con 10+ tool calls y la retome sin perder progreso.
2. `[SOLO]` **SDK cliente que abstraiga WebSocket Mode vs. polling/HTTP** para apps que necesitan degradar gracefully en redes malas — hoy cada equipo lo resuelve ad hoc.
3. `[CAPITAL]` **Capa de sesión cross-vendor** que normalice WebSocket Mode con lo que sea que shippeen después Anthropic o Google. Requiere acceso y soporte de cada proveedor — alto riesgo, alto premio si se logra antes de que el problema se fragmente.

**Ventana:**
6-12 meses, la más corta de las nuevas: la feature tiene días y es de un solo proveedor. Se cierra rápido si Anthropic o Google lanzan algo equivalente con semántica incompatible, fragmentando el problema antes de que alguien lo estandarice.

**[2026-09-11]** Docs de OpenAI ahora explicitan patrones de *Reconnect and recover* tras el límite de 60 min / drop ([WebSocket Mode guide](https://developers.openai.com/api/docs/guides/websocket-mode)); el SDK Node expone helpers de reconnect con backoff. Confirma el hueco: la conexión-local cache muere con el socket; sin `store=true` + `previous_response_id` (o replay full input) no hay recuperación. Nadie productizó un gateway de checkpoint mid-tool-call multi-proveedor. Pasa NUEVA → ESTABLE.

**Estado:** ESTABLE

---

### [2026-09-07] Tesis 7 — El kit de cumplimiento para bancos y emisores de stablecoins: la convergencia regulatoria ya está, la herramienta no

**TL;DR:** MAS y los reguladores de EEUU (OCC/GENIUS Act) aterrizaron en las mismas obligaciones prudenciales para stablecoins sin coordinarse, mientras la OCC ya empezó a cartar bancos nativos-cripto con carta plena. Nadie vende el kit de cumplimiento ni la capa de interoperabilidad entre estos bancos nuevos y los rieles tradicionales.

**Ámbito:** Fintech / regulación (convergencia Singapur + EEUU)

**Qué pasó:**
El 1/9/2026 MAS publicó un consultation paper que le da fuerza de ley (ya no solo guidance voluntaria) a su marco de stablecoins: reservas líquidas segregadas, redención a la par en plazo corto, prohibición de pagar interés por tenencia, stress testing periódico y plan de recuperación/wind-down obligatorio, comentarios hasta 16/10/2026 ([Asia Asset](https://www.asiaasset.com/digital-assets/singapores-mas-proposes-new-rules-to-bring-stablecoin-framework-into-force/); [Crowdfund Insider](https://www.crowdfundinsider.com/2026/09/305006-monetary-authority-of-singapore-mas-considers-ban-on-interest-for-regulated-stablecoins/)). En paralelo, en EEUU el deadline estatutario del GENIUS Act para reglas finales (18/7/2026) ya pasó sin regla publicada; desde el 18/1/2027 es ilegal para cualquier no-"permitted issuer" emitir una stablecoin de pago, con multas civiles hasta $500.000 — la OCC prometió regla final para noviembre 2026 ([Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/genius-act-compliance-cliff-137-113348697.html); [PYMNTS](https://www.pymnts.com/legal/2026/occ-races-the-clock-to-finish-genius-act-stablecoin-rules/)). Y el 2-3/9/2026 la OCC dio aprobación preliminar a dos cartas bancarias nacionales nuevas para jugadores cripto-nativos: Revolut Bank US (capital mínimo $95M) y OpenReserve, respaldada por a16z crypto, con carta **plena** — depósitos asegurados FDIC, préstamos y emisión de stablecoins vía subsidiaria (capital mínimo $210M) ([decisión OCC](https://www.occ.gov/topics/charters-and-licensing/interpretations-and-decisions/2026/cd1390.pdf); [The Block](https://www.theblock.co/news/regulation/2026-09-04-andreessen-horowitz-backed-openreserve-secures-preliminary-occ-approval-for-national-bank-charter-413528)).

**Por qué importa en 5-10 años:**
*(Inferencia.)* Cuando dos reguladores en jurisdicciones sin coordinación directa (MAS y OCC) llegan al mismo paquete de obligaciones — segregación de reservas, redención a la par, sin interés, stress test, wind-down plan — no es casualidad, es el mismo problema de estabilidad financiera resuelto con la misma solución de libro de texto (Basilea, aplicado a stablecoins). En 5-10 años ese paquete va a ser el estándar prudencial universal para cualquier emisor, y los bancos cripto-nativos con carta plena van a competir directo contra la banca tradicional en liquidación 24/7.

**La carencia:**
Ninguna carta ni norma viene con la herramienta de cumplimiento adentro. Falta: (a) "resolution planning as a service" — los bancos tradicionales arman sus wind-down plans con consultoras especializadas y años de práctica; los emisores de stablecoins no tienen ese know-how ni tooling; (b) atestación de reservas portable entre jurisdicciones — MAS, OCC/FDIC y MiCA piden variantes del mismo dato en formatos distintos y nadie lo estandarizó; (c) un kit de "GENIUS Act compliance readiness" activable en semanas cuando salga la regla final de la OCC en noviembre — motor de redención, AML/CFT, sanctions screening y reporting en el formato exacto que van a pedir; (d) la capa de interoperabilidad entre depósitos tokenizados de estos bancos nuevos y Fedwire/rieles tradicionales — cada banco de novo arma su propio conector desde cero, y JPMorgan (Kinexys) y Citi (Token Services) construyen rieles cerrados que no interoperan entre sí.

**Ideas paralelas:**
1. `[SOLO]` **Kit de compliance modular para GENIUS Act**, construido sobre los borradores ya públicos (NPRM de AML/CFT del 10/4/2026, CIP del 22/6/2026), listo para activar cuando salga la regla final. *Primera versión mínima:* motor de redención + sanctions screening funcionando contra los requisitos del borrador, documentado para adaptarse en días cuando cambie la letra chica.
2. `[SOLO]` **Plantilla de atestación de reservas portable** que mapee automáticamente el mismo dato a los formatos que piden MAS, OCC/FDIC y MiCA. Chico, aburrido, y exactamente el tipo de fricción que un emisor paga por sacarse de encima.
3. `[CAPITAL]` **"Treasury Prime para bancos cripto-nativos"**: banking-as-a-service específico para cartas OCC nuevas — conectores a Fedwire/FedNow/ACH más el stack de compliance BSA/AML de una entidad regulada como banco (no de una fintech que opera sobre un banco ya cartado). Requiere licencias, capital y relación regulatoria — barrera alta pero el hueco es real y nadie lo cubre hoy.

**Ventana:**
6-12 meses — la más apretada de las nuevas, con dos relojes concretos: el comment period de MAS cierra el 16/10/2026 y la regla final de la OCC bajo GENIUS Act llega en noviembre 2026. Se cierra cuando la OCC publique la regla final y el mercado se consolide alrededor de los primeros compliance vendors que ya estén listos ese día.

**[2026-09-11]** Dos relojes se aprietan: (1) OCC pide comentarios sobre **formularios de aplicación PPSI** (information collection) hasta el **25/9/2026** ([Federal Register 2026-15088](https://www.federalregister.gov/documents/2026/07/27/2026-15088/agency-information-collection-activities-proposed-information-collection-comment-request); [Orrick](https://infobytes.orrick.com/2026-07-31/occ-seeks-input-on-payment-stablecoin-licensing-and-registration-applications/)) — es la forma concreta del process de licensing, no la regla final; (2) consultation MAS P015-2026 sigue abierta hasta **16/10/2026** ([MAS](https://www.mas.gov.sg/publications/consultations/2026/consultation-on-proposed-amendments-to-the-payment-services-act-for-stablecoin-regulation)). Cliff estatutario GENIUS Act: **18/1/2027**. Sin regla final OCC todavía (promesa noviembre). La demanda de kit de compliance readiness sube con el detalle de los forms. Pasa NUEVA → ACELERA.

**Estado:** ACELERA

---

## Vigilando (no pasaron el filtro todavía, pero no los perdamos)

- **KV cache entre proveedores.** [Paper de U. Chicago, 2/8/2026](https://arxiv.org/html/2608.01526v1) proponiendo tratar el KV cache como contenido distribuido tipo CDN. Falta el formato de intercambio, la atestación de integridad y el metering. Real, pero NVIDIA está construyendo el stack vertical y va a definir el formato de facto. Revisar si aparece algo neutral.
- **Base die de HBM en nodo lógico** (Samsung en Hot Chips 2026). El hueco accesible es telemetría/RAS de flota y el toolchain de near-memory, no el silicio. Ventana 2-4 años — demasiado lejos para actuar, cerca para vigilar.
- **FDA y dispositivos médicos con IA generativa — [2026-09-11] actualización:** cohort TEMPO confirmado en **4** participantes (Dexcom, SonderMind, Limbic/Unpacked voice-CBT, Cadence/HypertensionOS) per [FDA participants page](https://www.fda.gov/medical-devices/digital-health-center-excellence/participants-selected-tempo-digital-health-devices-pilot) / [Becker's](https://www.beckershospitalreview.com/healthcare-information-technology/digital-health/4-companies-sign-on-to-fdas-digital-device-pilot/). MedTech Dive (8/9/2026) cubre el discussion paper de genAI (comentarios hasta **19/10/2026**) y el pivot a postmarket monitoring + "competency-based assessment". El hueco del *flight recorder* post-mercado sigue ad hoc. Todavía observación: ≤40 slots totales anunciados, cohort chico.
- **Screening de bioseguridad post-diseño-con-IA** ([Frontiers, 13/7/2026](https://www.frontiersin.org/journals/bioengineering-and-biotechnology/articles/10.3389/fbioe.2026.1858951/full)): la detección por identidad de secuencia se degrada por debajo del ~30%. El hueco más interesante es la correlación entre proveedores con preservación de privacidad — criptografía aplicada, sin wet lab. Fuera del radar activo por dificultad de venta, no por falta de mérito.
- **LAP, protocolo agente↔instrumento** ([arXiv 2606.03755](https://arxiv.org/abs/2606.03755)). Los propios autores dicen v0.1 sin estatus normativo ni implementación. Probablemente prematuro: un protocolo sin usuarios muere.
- **[2026-09-07] Estándar de refrigeración líquida tropical de Singapur (SS 726:2026).** IMDA/Enterprise Singapore publicaron el 27/8/2026 el primer estándar del mundo de refrigeración líquida para datacenters en clima tropical — carga de piso, calidad de fluido, corrosión/biofilm, water efficiency ([Enterprise Singapore, PDF](https://www.enterprisesg.gov.sg/-/media/esg/files/media-centre/media-releases/2026/august/mr03826_singapore-launches-worlds-first-liquid-cooling-standard-for-data-centres-in-tropical-climates.pdf)). El hueco es real — falta el "UL" que certifique cumplimiento contra corrosión/biofilm en clima cálido, y Data Center Knowledge (3/9/2026) documenta la corrosión como "governance gap" sin dueño claro — pero es un estándar voluntario sin body de certificación anunciado ni fecha de adopción obligatoria. Vigilar si aparece un ente certificador.
- **[2026-09-07] Costo de síntesis de ADN ausente en el diseño de proteínas con IA.** Retrospectiva de Bruce Wittmann (ex-lab Frances Arnold) en [arXiv](https://arxiv.org/abs/2609.03046) (2/9/2026) señala que casi ningún método de MLDE (machine-learning-guided directed evolution) contabiliza el costo real de síntesis/cribado — el modelo optimiza por "proteína óptima", el laboratorio necesita "proteína suficiente dado el presupuesto". La carencia (un "cost-aware campaign planner") es concreta, pero es un solo perspective paper de un autor, no un dato de adopción de mercado — prematuro para tesis, vale la pena vigilar si aparece un producto o un segundo paper que lo corrobore.

---

## Archivo

_(tesis muertas o saturadas, con la fecha y el motivo)_
