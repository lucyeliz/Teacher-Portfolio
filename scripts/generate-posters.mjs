#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(root, "src", "content", "videos");
const publicDir = join(root, "public");

function markdownFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(fullPath);
    return /\.mdx?$/i.test(entry.name) ? [fullPath] : [];
  });
}

function unquote(value) {
  const trimmed = value.trim().replace(/\s+#.*$/, "").trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function frontmatterValue(markdown, key) {
  const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return "";
  const field = match[1].match(new RegExp(`^${key}\\s*:\\s*(.*)$`, "mi"));
  return field ? unquote(field[1]) : "";
}

function relativePosterPath(videoFile) {
  const clean = videoFile.split(/[?#]/, 1)[0].replace(/\\/g, "/").replace(/^\/+/, "");
  const parts = clean.split("/");
  if (!clean || parts.some((part) => part === "..")) return null;
  if (parts[0]?.toLowerCase() === "videos") parts.shift();
  if (parts.length === 0) return null;

  const filename = parts.at(-1);
  const extension = extname(filename);
  parts[parts.length - 1] = `${extension ? filename.slice(0, -extension.length) : filename}.jpg`;
  return join("posters", ...parts);
}

const ffmpegCheck = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
if (ffmpegCheck.error?.code === "ENOENT") {
  console.error("Poster generation needs ffmpeg. Install it, then run npm run posters again.");
  process.exit(1);
}

const entries = markdownFiles(contentDir);
if (entries.length === 0) {
  console.log("No video content files found; there are no posters to generate.");
  process.exit(0);
}

let created = 0;
let skipped = 0;
let failed = 0;

for (const contentFile of entries) {
  const markdown = readFileSync(contentFile, "utf8");
  const source = frontmatterValue(markdown, "source").toLowerCase();
  const videoFile = frontmatterValue(markdown, "videoFile");
  const thumbnail = frontmatterValue(markdown, "thumbnail");
  if (source !== "local" || !videoFile || thumbnail) continue;

  const sourcePath = resolve(publicDir, videoFile.replace(/^\/+/, ""));
  const posterRelative = relativePosterPath(videoFile);
  if (!posterRelative) {
    console.error(`Cannot derive a safe poster path for ${videoFile}.`);
    failed += 1;
    continue;
  }

  const posterPath = resolve(publicDir, posterRelative);
  if (!sourcePath.startsWith(`${publicDir}${sep}`) || !posterPath.startsWith(`${publicDir}${sep}`)) {
    console.error(`Refusing a path outside public/: ${videoFile}`);
    failed += 1;
    continue;
  }
  if (!existsSync(sourcePath)) {
    console.error(`Missing local video referenced by ${relative(root, contentFile)}: ${videoFile}`);
    failed += 1;
    continue;
  }
  if (existsSync(posterPath)) {
    console.log(`Already exists: /${posterRelative.split(sep).join("/")}`);
    skipped += 1;
    continue;
  }

  mkdirSync(dirname(posterPath), { recursive: true });
  const result = spawnSync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-ss",
      "00:00:00.500",
      "-i",
      sourcePath,
      "-frames:v",
      "1",
      "-vf",
      "scale='min(1280,iw)':-2",
      "-q:v",
      "3",
      "-y",
      posterPath,
    ],
    { stdio: "inherit" },
  );

  if (result.status === 0) {
    console.log(`Created: /${posterRelative.split(sep).join("/")}`);
    created += 1;
  } else {
    console.error(`Could not generate a poster for ${videoFile}.`);
    failed += 1;
  }
}

console.log(`Poster generation complete: ${created} created, ${skipped} already present, ${failed} failed.`);
if (failed > 0) process.exitCode = 1;
