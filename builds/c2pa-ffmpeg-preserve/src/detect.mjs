import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

export function resolveC2patool() {
  const candidates = [
    process.env.C2PATOOL,
    "c2patool",
    "/workspace/bin/c2patool",
    "/opt/homebrew/bin/c2patool",
  ].filter(Boolean);
  for (const c of candidates) {
    const r = spawnSync(c, ["--version"], { encoding: "utf8" });
    if (r.status === 0) return c;
  }
  throw new Error("c2patool not found. Install: brew install c2patool (or set C2PATOOL)");
}

export function resolveFfmpeg() {
  const c = process.env.FFMPEG || "ffmpeg";
  const r = spawnSync(c, ["-version"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("ffmpeg not found");
  return c;
}

/** @returns {{ present: boolean, summary: string, raw?: object }} */
export function inspectC2pa(c2patool, filePath) {
  if (!existsSync(filePath)) return { present: false, summary: "missing file" };
  const r = spawnSync(c2patool, [filePath], { encoding: "utf8", maxBuffer: 10_000_000 });
  const out = (r.stdout || "") + (r.stderr || "");
  if (/No claim found|no manifest|not found/i.test(out) || r.status !== 0 && /No claim/i.test(out)) {
    return { present: false, summary: "no C2PA claim", rawText: out.slice(0, 500) };
  }
  try {
    const json = JSON.parse(r.stdout);
    const active = json.active_manifest;
    return {
      present: Boolean(active),
      summary: active ? `active_manifest=${active}` : "parsed but no active_manifest",
      raw: json,
    };
  } catch {
    // sometimes non-json
    const present = /active_manifest|manifests/i.test(out) && !/No claim found/i.test(out);
    return { present, summary: present ? "claim-like output" : "no C2PA claim", rawText: out.slice(0, 500) };
  }
}
