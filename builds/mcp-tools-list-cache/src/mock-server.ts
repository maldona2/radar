#!/usr/bin/env node
/**
 * Mock MCP server (NDJSON stdio) with a fat tools/list payload and artificial delay.
 * Used by the offline demo — no API keys required.
 */

import {
  isJsonRpcRequest,
  readMessages,
  writeMessage,
  type JsonRpcRequest,
  type JsonRpcSuccess,
} from "./framing.js";

const DELAY_MS = Number(process.env.MOCK_DELAY_MS ?? 120);
const TOOL_COUNT = Number(process.env.MOCK_TOOL_COUNT ?? 40);

function buildFatTools(count: number) {
  const tools = [];
  for (let i = 1; i <= count; i++) {
    const pad = "x".repeat(180);
    tools.push({
      name: `demo_tool_${String(i).padStart(3, "0")}`,
      description:
        `Synthetic MCP tool #${i} with a deliberately long description for cache demos. ` +
        `It pretends to query inventory, summarize logs, or transform documents. ` +
        `Padding=${pad}`,
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: `Query text for tool ${i}` },
          limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          verbose: { type: "boolean", default: false },
        },
        required: ["query"],
        additionalProperties: false,
      },
    });
  }
  return tools;
}

const TOOLS = buildFatTools(TOOL_COUNT);

function respond(req: JsonRpcRequest, result: unknown): void {
  if (req.id === undefined || req.id === null) return;
  const msg: JsonRpcSuccess = { jsonrpc: "2.0", id: req.id, result };
  writeMessage(process.stdout, msg);
}

function handle(req: JsonRpcRequest): void {
  const delay = DELAY_MS;
  setTimeout(() => {
    switch (req.method) {
      case "initialize":
        respond(req, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "radar-mock-mcp", version: "1.0.0" },
        });
        break;
      case "tools/list":
        respond(req, { tools: TOOLS });
        break;
      case "tools/call":
        respond(req, {
          content: [
            {
              type: "text",
              text: `mock call ok: ${JSON.stringify(req.params ?? {})}`,
            },
          ],
        });
        break;
      case "ping":
        respond(req, {});
        break;
      default:
        if (req.id !== undefined && req.id !== null) {
          writeMessage(process.stdout, {
            jsonrpc: "2.0",
            id: req.id,
            error: { code: -32601, message: `Method not found: ${req.method}` },
          });
        }
    }
  }, delay);
}

function main(): void {
  process.stderr.write(
    `[mock] ready tools=${TOOLS.length} delayMs=${DELAY_MS} transport=ndjson-stdio\n`,
  );
  readMessages(process.stdin, (msg) => {
    if (!isJsonRpcRequest(msg)) return;
    handle(msg);
  });
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith("mock-server.ts") ||
    process.argv[1].endsWith("mock-server.js"));

if (isDirect) {
  main();
}

export { buildFatTools, TOOLS, DELAY_MS };
