import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";

/**
 * Transport: newline-delimited JSON (NDJSON) over stdio.
 * Each JSON-RPC 2.0 message is a single line terminated by `\n`.
 * No Content-Length headers. Documented and used consistently by mock + proxy.
 */

export type JsonRpcId = string | number | null;

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: unknown;
}

export interface JsonRpcSuccess {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result: unknown;
}

export interface JsonRpcErrorObject {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcFailure {
  jsonrpc: "2.0";
  id: JsonRpcId;
  error: JsonRpcErrorObject;
}

export type JsonRpcMessage = JsonRpcRequest | JsonRpcSuccess | JsonRpcFailure;

export function isJsonRpcRequest(msg: unknown): msg is JsonRpcRequest {
  if (!msg || typeof msg !== "object") return false;
  const m = msg as Record<string, unknown>;
  return m.jsonrpc === "2.0" && typeof m.method === "string";
}

export function writeMessage(stream: Writable, message: unknown): void {
  stream.write(`${JSON.stringify(message)}\n`);
}

export function readMessages(
  stream: Readable,
  onMessage: (msg: unknown, raw: string) => void,
  onError?: (err: Error, raw: string) => void,
): { close: () => void } {
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  rl.on("line", (line) => {
    const raw = line.trim();
    if (!raw) return;
    try {
      onMessage(JSON.parse(raw), raw);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)), raw);
    }
  });
  return {
    close: () => rl.close(),
  };
}

export function payloadCharCount(value: unknown): number {
  return JSON.stringify(value).length;
}
