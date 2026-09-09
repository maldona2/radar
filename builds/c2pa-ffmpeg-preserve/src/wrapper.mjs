/**
 * Naive preserve wrapper:
 * 1) note if input has C2PA
 * 2) run ffmpeg
 * 3) inspect output
 * 4) if input had C2PA and output lost it → exit 2 and print guidance
 *
 * Re-sign (true preserve with parent ingredient) is opt-in via --resign
 * using c2patool -m manifest -p parent.
 */
import { spawnSync } from "node:child_process";
import { resolveC2patool, resolveFfmpeg, inspectC2pa } from "./detect.mjs";

export function runFfmpeg(ffmpeg, args) {
  const r = spawnSync(ffmpeg, args, { encoding: "utf8" });
  return r;
}

export function wrapTransform({
  input,
  output,
  ffmpegArgs,
  resignManifest,
  resign = false,
}) {
  const c2patool = resolveC2patool();
  const ffmpeg = resolveFfmpeg();
  const before = inspectC2pa(c2patool, input);
  const r = runFfmpeg(ffmpeg, ffmpegArgs);
  if (r.status !== 0) {
    return {
      ok: false,
      stage: "ffmpeg",
      stderr: (r.stderr || "").slice(-800),
      before,
    };
  }
  let after = inspectC2pa(c2patool, output);
  let resigned = false;
  if (resign && before.present && !after.present && resignManifest) {
    const tmp = output + ".resign-tmp";
    const sign = spawnSync(
      c2patool,
      [output, "-m", resignManifest, "-p", input, "-o", tmp, "-f"],
      { encoding: "utf8", cwd: process.cwd() },
    );
    if (sign.status === 0) {
      spawnSync("mv", [tmp, output]);
      after = inspectC2pa(c2patool, output);
      resigned = after.present;
    }
  }
  const destroyed = before.present && !after.present;
  return {
    ok: !destroyed || resigned,
    destroyed,
    resigned,
    before,
    after,
    ffmpegStatus: r.status,
  };
}
