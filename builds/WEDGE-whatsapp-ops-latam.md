# Wedge — WhatsApp ops LatAm (apuesta #1)

Fecha: 2026-09-11 · Estado: diseño (sin build todavía)

## Promesa (una frase)
El cliente pregunta por WhatsApp; el negocio responde con **dato real** (stock/precio/pedido) y deja rastro en un sistema — no en la cabeza del vendedor.

## Qué NO es
- Chatbot de FAQ genérico
- Agencia “te armo el bot”
- Reemplazo total del CRM

## Primer wedge (MVP de aprendizaje)
**Un solo loop:** *consulta de estado de pedido / reorder de ítems frecuentes*  
(Inbound WhatsApp → identificar cliente → consultar fuente de verdad mínima → responder → loguear)

### In
- Mensaje inbound (Cloud API o BSP)
- Tabla mínima: clientes (teléfono → id) + pedidos/ítems (o Google Sheet / Airtable al inicio)

### Out
- Respuesta con estado o “no encontré, te paso con humano”
- Registro de la conversación + acción
- Escalación a humano (forward / tag)

### Fuera de scope v0
Catálogo dinámico completo, cobros, marketing templates masivos, multi-agente fancy, app móvil

## Stack tentativo
- Meta Cloud API (o BSP si onboarding más fácil en AR)
- Backend Node/Railway
- Store Postgres o Sheet al inicio
- Panel mínimo (lista de conversaciones + “tomar control”)

## Done-when (2–4 semanas de side)
1. 1 número de prueba + webhook live
2. 1 negocio piloto responde “esto me ahorra X mensajes/día”
3. Demo reproducible sin el piloto delante

## Kill rules
- 8–12 semanas sin 3 usuarios diarios del loop → matar o cambiar vertical
- Cada cliente pide custom distinto → estás en agencia; productizar o salir
- Meta/CRM grande resuelve el wedge end-to-end en tu vertical → pivot

## Próximo gate
Elegir **vertical con acceso a conversaciones reales** (familia, amigo, cliente de la plaza). Sin acceso = no build.

## Piloto concreto (2026-09-16)

| Campo | Valor |
|-------|--------|
| Vertical | Multi-tienda electrónica (celulares, fundas, accesorios, parlantes) |
| Dolor | Pierden clientes: chatean por WP y no les contestan |
| Preguntas típicas | Precio, stock, precios mayoristas, info de retiro |
| Fuente de verdad | Excel + ERP Zeus |
| ID cliente | Nombre, teléfono, mail |
| Quién responde hoy | Dueño + 1 empleada |
| WhatsApp | Número de prueba |
| Gate acceso | Matías habla con el piloto |

### MVP v0 (propuesto)
1. **No Zeus en v0** — export/sync periódico Excel/Sheet (SKU, stock, precio lista, precio mayorista). Zeus = fase 2.
2. Loop: inbound WP → detectar intención (precio/stock/mayorista/retiro) → match producto (nombre/SKU) → responder con dato → si no matchea o es ambiguo → **handoff humano**.
3. SLA blando: si nadie humano toma el chat en N min, al menos auto-ack “ya te vemos” (opcional).
4. Panel mínimo: cola de chats + tomar control.
5. Done-when: el piloto usa el número de prueba 1 semana y dice si bajó mensajes sin respuesta / se salvó alguna venta.

### Riesgos de este vertical
- Catálogo grande + nombres ambiguos (“fundas para el 15”)
- Dos tarifas (lista vs mayorista) → regla clara (ej. keyword “mayorista” o lista de teléfonos)
- Zeus cerrado → dependemos del Excel limpio

