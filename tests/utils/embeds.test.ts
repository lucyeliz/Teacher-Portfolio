import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canEmbedVideo,
  getGoogleDrivePreviewUrl,
  getVideoEmbed,
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
} from "../../src/utils/embeds";

const youtubeId = "dQw4w9WgXcQ";
const privateEmbed = `https://www.youtube-nocookie.com/embed/${youtubeId}`;

describe("YouTube URL normalization", () => {
  const variants = [
    `https://www.youtube.com/watch?v=${youtubeId}`,
    `https://www.youtube.com/watch?v=${youtubeId}&list=PL123&t=42s`,
    `https://youtu.be/${youtubeId}?si=tracking`,
    `https://youtube.com/shorts/${youtubeId}?feature=share`,
    `https://www.youtube.com/embed/${youtubeId}?start=10`,
    `https://www.youtube.com/live/${youtubeId}?list=PL123`,
    `https://www.youtube-nocookie.com/embed/${youtubeId}`,
    youtubeId,
  ];

  for (const value of variants) {
    it(`normalizes ${value}`, () => {
      assert.equal(getYouTubeVideoId(value), youtubeId);
      assert.equal(getYouTubeEmbedUrl(value), privateEmbed);
    });
  }

  it("rejects non-YouTube and playlist-only URLs", () => {
    assert.equal(getYouTubeEmbedUrl(`https://example.com/watch?v=${youtubeId}`), null);
    assert.equal(getYouTubeEmbedUrl("https://youtube.com/playlist?list=PL123"), null);
  });
});

describe("Google Drive URL normalization", () => {
  const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz";
  const preview = `https://drive.google.com/file/d/${id}/preview`;

  for (const value of [
    `https://drive.google.com/file/d/${id}/view?usp=sharing`,
    `https://drive.google.com/file/d/${id}/preview`,
    `https://drive.google.com/open?id=${id}`,
    `https://drive.google.com/uc?export=download&id=${id}`,
  ]) {
    it(`normalizes ${value}`, () => {
      assert.equal(getGoogleDrivePreviewUrl(value), preview);
    });
  }

  it("does not turn Google Docs or Drive folders into broken video embeds", () => {
    assert.equal(getGoogleDrivePreviewUrl(`https://docs.google.com/document/d/${id}/edit`), null);
    assert.equal(getGoogleDrivePreviewUrl(`https://drive.google.com/drive/folders/${id}`), null);
  });
});

describe("embed helpers", () => {
  it("returns an iframe source for supported providers", () => {
    assert.deepEqual(getVideoEmbed("youtube", `https://youtu.be/${youtubeId}`), {
      provider: "youtube",
      src: privateEmbed,
    });
    assert.equal(canEmbedVideo("youtube", `https://youtu.be/${youtubeId}`), true);
  });

  it("falls back for unsupported or malformed sources", () => {
    assert.equal(getVideoEmbed("other", "https://example.com/video"), null);
    assert.equal(canEmbedVideo("drive", "https://example.com/video"), false);
  });
});

