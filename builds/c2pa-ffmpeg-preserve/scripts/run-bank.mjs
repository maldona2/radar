#!/usr/bin/env node
/**
 * Bank: signed fixture → each ffmpeg transform → did C2PA survive?
 */
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { resolveC2patool, resolveFfmpeg, inspectC2pa } from "../src/detect.mjs";
import { TRANSFORMS } from "../src/transforms.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIX = join(ROOT, "fixtures");
const OUT = join(FIX, "out");
mkdirSync(OUT, { recursive: true });

const c2patool = resolveC2patool();
const ffmpeg = resolveFfmpeg();

// Ensure signed.mp4 exists
const signed = join(FIX, "signed.mp4");
const plain = join(FIX, "plain.mp4");
const manifest = join(ROOT, "certs/manifest.json");
if (!existsSync(plain)) {
  spawnSync(
    ffmpeg,
    [
      "-y", "-f", "lavfi", "-i", "color=c=blue:s=320x240:d=1",
      "-f", "lavfi", "-i", "sine=f=440:d=1", "-shortest",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", plain,
    ],
    { encoding: "utf8" },
  );
}
// re-sign always for fresh bank
const sign = spawnSync(
  c2patool,
  [plain, "-m", "manifest.json", "-o", signed, "-f"],
  { encoding: "utf8", cwd: join(ROOT, "certs") },
);
// c2patool writes relative to cwd when keys relative — output path: if -o is absolute OK
if (!existsSync(signed)) {
  // try with absolute paths and keys in certs
  const r2 = spawnSync(
    c2patool,
    [plain, "-m", manifest, "-o", signed, "-f"],
    { encoding: "utf8", cwd: join(ROOT, "certs") },
  );
  if (!existsSync(signed)) {
    console.error("Failed to sign fixture", sign.stderr || r2.stderr);
    process.exit(1);
  }
}

const before = inspectC2pa(c2patool, signed);
if (!before.present) {
  console.error("Fixture has no C2PA after sign", before);
  process.exit(1);
}

const rows = [];
for (const t of TRANSFORMS) {
  const outPath = join(OUT, `${t.id}.mp4`);
  const args = t.args(signed, outPath);
  const fr = spawnSync(ffmpeg, args, { encoding: "utf8" });
  const after = fr.status === 0 ? inspectC2pa(c2patool, outPath) : { present: false, summary: "ffmpeg failed" };
  const survived = Boolean(after.present);
  rows.push({
    id: t.id,
    label: t.label,
    ffmpegOk: fr.status === 0,
    c2paBefore: true,
    c2paAfter: survived,
    destroyed: !survived,
    detail: after.summary,
  });
  console.error(
    `${survived ? "✅ SURVIVED" : "❌ DESTROYED"}  ${t.id.padEnd(22)} ${t.label}`,
  );
}

const destroyed = rows.filter((r) => r.destroyed).length;
const survived = rows.filter((r) => !r.destroyed && r.ffmpegOk).length;
const report = {
  generatedAt: new Date().toISOString(),
  fixture: "fixtures/signed.mp4",
  tools: { ffmpeg, c2patool },
  totals: { transforms: rows.length, destroyed, survived },
  rows,
  takeaway:
    destroyed === 0
      ? "Unexpected: all transforms preserved C2PA — re-check tooling."
      : `${destroyed}/${rows.length} common ffmpeg transforms destroyed the C2PA claim. This is the marketing number.`,
};

writeFileSync(join(ROOT, "reports/bank.json"), JSON.stringify(report, null, 2));
const md = [
  "# C2PA × ffmpeg — destruction bank",
  "",
  `Generated: ${report.generatedAt}`,
  "",
  report.takeaway,
  "",
  "| Transform | Result | Detail |",
  "|-----------|--------|--------|",
  ...rows.map(
    (r) =>
      `| ${r.label} |\`${r.id}\`| ${r.destroyed ? "**DESTROYED**" : "survived"} | ${r.detail} |`,
  ),
  "",
].join("\n");
writeFileSync(join(ROOT, "reports/bank.md"), md);
console.log(JSON.stringify(report.totals));
console.log(report.takeaway);
