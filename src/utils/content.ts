import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { getCollection, type CollectionEntry } from "astro:content";

import { assertUniqueVideoMedia, getPublishedVideos } from "./videos";

export type VideoEntry = CollectionEntry<"videos">;
export type SectionEntry = CollectionEntry<"sections">;

/** Load once through the collection API and apply cross-entry validation. */
export async function getAllVideoEntries(): Promise<VideoEntry[]> {
  const entries = await getCollection("videos");
  const validated = assertUniqueVideoMedia(entries) as VideoEntry[];

  for (const entry of validated) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) {
      throw new Error(`Video collection validation failed: ${entry.id} must be a lowercase kebab-case filename directly inside src/content/videos/.`);
    }

    if (entry.data.source !== "local" || entry.data.draft) continue;
    const relativePath = entry.data.videoFile.replace(/^\/+/, "");
    const absolutePath = resolve(process.cwd(), "public", relativePath);

    if (!existsSync(absolutePath)) {
      throw new Error(`Video collection validation failed: ${entry.id} references missing file ${entry.data.videoFile}. Add the file or set draft: true.`);
    }

    if (!entry.data.videoFile.toLowerCase().endsWith(".mp4")) {
      throw new Error(`Video collection validation failed: ${entry.id} must use a browser-ready .mp4 file. Transcode .mov files before publishing.`);
    }

    const maximumBytes = 95 * 1024 * 1024;
    if (statSync(absolutePath).size >= maximumBytes) {
      throw new Error(`Video collection validation failed: ${entry.data.videoFile} is 95 MiB or larger. Do not commit it; keep the entry in draft and use an unlisted YouTube URL.`);
    }
  }

  return validated;
}

export async function getPublishedVideoEntries(): Promise<VideoEntry[]> {
  return getPublishedVideos(await getAllVideoEntries()) as VideoEntry[];
}

export async function getSectionIntro(slug: string): Promise<SectionEntry | undefined> {
  const entries = await getCollection("sections");
  return entries.find((entry) => entry.id.replace(/\.(md|mdx)$/i, "") === slug);
}

export function formatVideoDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(value);
}
