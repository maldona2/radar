/** Common ffmpeg transforms that pipelines actually run. */
export const TRANSFORMS = [
  {
    id: "stream-copy",
    label: "Stream copy (remux)",
    args: (inp, out) => ["-y", "-i", inp, "-c", "copy", out],
  },
  {
    id: "map-metadata-strip",
    label: "Stream copy + -map_metadata -1",
    args: (inp, out) => ["-y", "-i", inp, "-map_metadata", "-1", "-c", "copy", out],
  },
  {
    id: "reencode-h264",
    label: "Re-encode H.264 + AAC",
    args: (inp, out) => [
      "-y", "-i", inp,
      "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28",
      "-c:a", "aac", "-b:a", "96k",
      out,
    ],
  },
  {
    id: "scale-480",
    label: "Scale to 480p + re-encode",
    args: (inp, out) => [
      "-y", "-i", inp,
      "-vf", "scale=-2:480",
      "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28",
      "-c:a", "copy",
      out,
    ],
  },
  {
    id: "trim-0.5s",
    label: "Trim first 0.5s + re-encode",
    args: (inp, out) => [
      "-y", "-i", inp,
      "-ss", "0", "-t", "0.5",
      "-c:v", "libx264", "-preset", "ultrafast",
      "-c:a", "aac",
      out,
    ],
  },
  {
    id: "audio-strip",
    label: "Drop audio, copy video",
    args: (inp, out) => ["-y", "-i", inp, "-an", "-c:v", "copy", out],
  },
  {
    id: "movflags-faststart",
    label: "Remux + +faststart",
    args: (inp, out) => [
      "-y", "-i", inp, "-c", "copy", "-movflags", "+faststart", out,
    ],
  },
];
