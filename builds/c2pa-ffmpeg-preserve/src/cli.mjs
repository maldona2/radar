#!/usr/bin/env node
import { wrapTransform } from "./wrapper.mjs";

function usage() {
  console.error(`Usage:
  node src/cli.mjs --in signed.mp4 --out out.mp4 -- [ffmpeg args after -i handled...]
  Simpler: node src/cli.mjs --in in.mp4 --out out.mp4 --transform stream-copy|reencode-h264|...
  Optional: --resign --manifest certs/manifest.json`);
  process.exit(2);
}

const argv = process.argv.slice(2);
function flag(name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}
const input = flag("--in");
const output = flag("--out");
const transform = flag("--transform") || "stream-copy";
const resign = argv.includes("--resign");
const manifest = flag("--manifest");
if (!input || !output) usage();

const { TRANSFORMS } = await import("./transforms.mjs");
const t = TRANSFORMS.find((x) => x.id === transform);
if (!t) {
  console.error("Unknown transform", transform);
  process.exit(2);
}
const result = wrapTransform({
  input,
  output,
  ffmpegArgs: t.args(input, output),
  resign,
  resignManifest: manifest,
});
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 2);
