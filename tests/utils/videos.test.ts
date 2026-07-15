import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  assertUniqueVideoMedia,
  findDuplicateVideoValues,
  getExpectedPosterPath,
  getPublishedVideos,
  getSections,
  getTopics,
  getVideoThumbnail,
  type VideoEntryLike,
} from "../../src/utils/videos";

function video(
  id: string,
  overrides: Partial<VideoEntryLike["data"]> = {},
): VideoEntryLike {
  return {
    id,
    data: {
      title: id,
      date: new Date("2026-01-01"),
      section: "Code Walkthroughs",
      topic: "Repeats",
      source: "local",
      videoFile: `/videos/${id}.mp4`,
      ...overrides,
    },
  };
}

describe("video collection helpers", () => {
  it("excludes drafts and sorts newest first without mutating the source", () => {
    const input = [
      video("older", { date: new Date("2026-01-01") }),
      video("draft", { date: new Date("2027-01-01"), draft: true }),
      video("newer", { date: new Date("2026-07-11") }),
    ];

    assert.deepEqual(getPublishedVideos(input).map((entry) => entry.id), ["newer", "older"]);
    assert.deepEqual(input.map((entry) => entry.id), ["older", "draft", "newer"]);
  });

  it("derives sorted, unique sections and section topics from published videos", () => {
    const input = [
      video("variables", { section: "Code Walkthroughs", topic: "Variables" }),
      video("lesson", { section: "Lesson Plans", topic: "Planning" }),
      video("repeat", { section: "Code Walkthroughs", topic: "Repeats" }),
      video("hidden", { section: "Draft Section", topic: "Draft", draft: true }),
    ];

    assert.deepEqual(getSections(input), ["Code Walkthroughs", "Lesson Plans"]);
    assert.deepEqual(getTopics(input, "Code Walkthroughs"), ["Repeats", "Variables"]);
  });
});

describe("duplicate validation", () => {
  it("detects equivalent YouTube URLs as one reused video", () => {
    const id = "dQw4w9WgXcQ";
    const input = [
      video("watch", {
        source: "youtube",
        videoFile: "",
        videoUrl: `https://youtube.com/watch?v=${id}&list=PL123`,
      }),
      video("short", {
        source: "youtube",
        videoFile: "",
        videoUrl: `https://youtu.be/${id}`,
      }),
    ];

    assert.deepEqual(findDuplicateVideoValues(input), [
      {
        field: "videoUrl",
        value: `https://www.youtube-nocookie.com/embed/${id}`,
        entries: ["watch", "short"],
      },
    ]);
    assert.throws(() => assertUniqueVideoMedia(input), /duplicate videoUrl.*watch, short/s);
  });

  it("detects repeated local files and duplicate slugs", () => {
    const input = [
      video("same", { videoFile: "/videos/shared.mp4" }),
      { ...video("other", { videoFile: "//videos//shared.mp4" }), slug: "same" },
    ];

    const duplicates = findDuplicateVideoValues(input);
    assert.equal(duplicates.some(({ field }) => field === "slug"), true);
    assert.equal(duplicates.some(({ field }) => field === "videoFile"), true);
  });

  it("returns a copy when all references are unique", () => {
    const input = [video("one"), video("two")];
    const result = assertUniqueVideoMedia(input);
    assert.deepEqual(result, input);
    assert.notEqual(result, input);
  });
});

describe("thumbnail rules", () => {
  it("derives the hqdefault image for YouTube", () => {
    const entry = video("youtube", {
      source: "youtube",
      videoFile: "",
      videoUrl: "https://youtu.be/dQw4w9WgXcQ",
    });
    assert.equal(
      getVideoThumbnail(entry, { detectLocalPoster: false }),
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
  });

  it("prefers an explicit thumbnail", () => {
    assert.equal(
      getVideoThumbnail(video("custom", { thumbnail: "/images/custom.webp" })),
      "/images/custom.webp",
    );
  });

  it("maps nested local videos to matching poster locations", () => {
    assert.equal(
      getExpectedPosterPath("/videos/demos/nested-repeats.mp4"),
      "/posters/demos/nested-repeats.jpg",
    );
  });

  it("auto-detects an optional generated local poster", () => {
    const publicDir = mkdtempSync(join(tmpdir(), "portfolio-posters-"));
    const posterDir = join(publicDir, "posters", "demos");
    mkdirSync(posterDir, { recursive: true });
    writeFileSync(join(posterDir, "repeats.jpg"), "test image");

    try {
      assert.equal(
        getVideoThumbnail(video("repeats", { videoFile: "/videos/demos/repeats.mp4" }), {
          publicDir,
        }),
        "/posters/demos/repeats.jpg",
      );
    } finally {
      rmSync(publicDir, { recursive: true, force: true });
    }
  });
});
