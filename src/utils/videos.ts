import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";

import {
  getGoogleDrivePreviewUrl,
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
  type VideoSource,
} from "./embeds";

export interface VideoDataLike {
  title: string;
  date: Date | string | number;
  section: string;
  topic: string;
  source: VideoSource;
  videoFile?: string;
  videoUrl?: string;
  thumbnail?: string;
  featured?: boolean;
  draft?: boolean;
}

export interface VideoEntryLike<Data extends VideoDataLike = VideoDataLike> {
  id?: string;
  slug?: string;
  data: Data;
}

export interface ThumbnailOptions {
  /** Set false to avoid filesystem access (for example, in browser-only code). */
  detectLocalPoster?: boolean;
  /** Defaults to the repository's public directory. */
  publicDir?: string;
}

export type DuplicateVideoField = "slug" | "videoFile" | "videoUrl";

export interface DuplicateVideoValue {
  field: DuplicateVideoField;
  value: string;
  entries: string[];
}

function entryLabel(entry: VideoEntryLike): string {
  return entry.slug || entry.id || entry.data.title;
}

function timestamp(value: Date | string | number): number {
  const parsed = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sortVideosNewestFirst<T extends VideoEntryLike>(videos: readonly T[]): T[] {
  return [...videos].sort((left, right) => {
    const dateDifference = timestamp(right.data.date) - timestamp(left.data.date);
    if (dateDifference !== 0) return dateDifference;
    return left.data.title.localeCompare(right.data.title, undefined, { sensitivity: "base" });
  });
}

export function isPublishedVideo(video: VideoEntryLike): boolean {
  return video.data.draft !== true;
}

/** Exclude drafts and return a new newest-first array. */
export function getPublishedVideos<T extends VideoEntryLike>(videos: readonly T[]): T[] {
  return sortVideosNewestFirst(videos.filter(isPublishedVideo));
}

function sortedUnique(values: Iterable<string>): string[] {
  return [...new Set([...values].map((value) => value.trim()).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }),
  );
}

/** Unique published section names, suitable for generated navigation and routes. */
export function getSections(videos: readonly VideoEntryLike[]): string[] {
  return sortedUnique(videos.filter(isPublishedVideo).map((video) => video.data.section));
}

export const getUniqueSections = getSections;

/** Unique published topics, optionally limited to one section. */
export function getTopics(
  videos: readonly VideoEntryLike[],
  section?: string,
): string[] {
  return sortedUnique(
    videos
      .filter(isPublishedVideo)
      .filter((video) => section === undefined || video.data.section === section)
      .map((video) => video.data.topic),
  );
}

export const getUniqueTopics = getTopics;

function normalizedLocalFile(value: string): string {
  const clean = value.trim().replace(/\\/g, "/").replace(/\/{2,}/g, "/");
  return clean.length > 1 ? clean.replace(/\/$/, "") : clean;
}

function normalizedExternalUrl(source: VideoSource, value: string): string {
  const clean = value.trim();
  if (!clean) return "";

  if (source === "youtube") return getYouTubeEmbedUrl(clean) ?? clean;
  if (source === "drive") return getGoogleDrivePreviewUrl(clean) ?? clean;

  try {
    const url = new URL(clean);
    url.hash = "";
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString();
  } catch {
    return clean;
  }
}

function normalizedSlug(entry: VideoEntryLike): string {
  return (entry.slug || entry.id || "").trim().replace(/\.(?:md|mdx)$/i, "");
}

/** Find duplicate slugs and media references without throwing. */
export function findDuplicateVideoValues(
  videos: readonly VideoEntryLike[],
): DuplicateVideoValue[] {
  const fields: Array<{
    field: DuplicateVideoField;
    value: (entry: VideoEntryLike) => string;
  }> = [
    { field: "slug", value: normalizedSlug },
    {
      field: "videoFile",
      value: (entry) => normalizedLocalFile(entry.data.videoFile ?? ""),
    },
    {
      field: "videoUrl",
      value: (entry) => normalizedExternalUrl(entry.data.source, entry.data.videoUrl ?? ""),
    },
  ];

  const duplicates: DuplicateVideoValue[] = [];

  for (const { field, value } of fields) {
    const seen = new Map<string, string[]>();
    for (const entry of videos) {
      const normalized = value(entry);
      if (!normalized) continue;
      const labels = seen.get(normalized) ?? [];
      labels.push(entryLabel(entry));
      seen.set(normalized, labels);
    }

    for (const [duplicateValue, entries] of seen) {
      if (entries.length > 1) duplicates.push({ field, value: duplicateValue, entries });
    }
  }

  return duplicates;
}

/** Fail a build early with a filename-oriented message when media is reused. */
export function assertUniqueVideoMedia<T extends VideoEntryLike>(videos: readonly T[]): T[] {
  const duplicates = findDuplicateVideoValues(videos);
  if (duplicates.length === 0) return [...videos];

  const details = duplicates
    .map(
      ({ field, value, entries }) =>
        `- duplicate ${field} "${value}" is used by: ${entries.join(", ")}`,
    )
    .join("\n");

  throw new Error(
    `Video collection validation failed:\n${details}\nEach video must have a unique slug and media URL/file.`,
  );
}

export const validateVideoCollection = assertUniqueVideoMedia;
export const assertNoDuplicateVideos = assertUniqueVideoMedia;

export type YouTubeThumbnailQuality =
  | "default"
  | "mqdefault"
  | "hqdefault"
  | "sddefault"
  | "maxresdefault";

export function getYouTubeThumbnailUrl(
  value: string,
  quality: YouTubeThumbnailQuality = "hqdefault",
): string | null {
  const id = getYouTubeVideoId(value);
  return id ? `https://i.ytimg.com/vi/${id}/${quality}.jpg` : null;
}

/**
 * Poster files mirror the path below public/videos inside public/posters.
 * Example: /videos/demos/repeats.mp4 -> /posters/demos/repeats.jpg
 */
export function getExpectedPosterPath(videoFile: string): string | null {
  const clean = videoFile.split(/[?#]/, 1)[0]?.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!clean) return null;

  const parts = clean.split("/");
  if (parts.some((part) => part === "..")) return null;
  if (parts[0]?.toLowerCase() === "videos") parts.shift();
  if (parts.length === 0) return null;

  const filename = parts.at(-1) ?? "";
  const extension = extname(filename);
  parts[parts.length - 1] = `${extension ? filename.slice(0, -extension.length) : filename}.jpg`;
  return `/posters/${parts.join("/")}`;
}

export const getLocalPosterPath = getExpectedPosterPath;

/** Return an existing generated poster, trying common image extensions. */
export function findLocalPoster(
  videoFile: string,
  publicDir = resolve(process.cwd(), "public"),
): string | null {
  const expected = getExpectedPosterPath(videoFile);
  if (!expected) return null;

  const stem = expected.replace(/\.jpg$/i, "");
  for (const extension of [".jpg", ".jpeg", ".png", ".webp"]) {
    const publicPath = `${stem}${extension}`;
    if (existsSync(join(publicDir, ...publicPath.split("/").filter(Boolean)))) {
      return publicPath;
    }
  }
  return null;
}

/** Apply thumbnail precedence: explicit image, derived YouTube image, generated local poster. */
export function getVideoThumbnail(
  video: VideoEntryLike | VideoDataLike,
  options: ThumbnailOptions = {},
): string | null {
  const data = "data" in video ? video.data : video;
  const explicit = data.thumbnail?.trim();
  if (explicit) return explicit;

  if (data.source === "youtube") {
    return getYouTubeThumbnailUrl(data.videoUrl ?? "");
  }

  if (data.source === "local" && options.detectLocalPoster !== false) {
    return findLocalPoster(
      data.videoFile ?? "",
      options.publicDir ?? resolve(process.cwd(), "public"),
    );
  }

  return null;
}

export const resolveVideoThumbnail = getVideoThumbnail;

