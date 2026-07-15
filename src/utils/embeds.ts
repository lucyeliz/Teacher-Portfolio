export type EmbeddableVideoSource = "youtube" | "drive" | "loom" | "vimeo";
export type VideoSource = EmbeddableVideoSource | "local" | "other";

export interface VideoEmbed {
  provider: EmbeddableVideoSource;
  src: string;
}

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const DRIVE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;

function parseHttpUrl(value: string): URL | null {
  const input = value.trim();
  if (!input) return null;

  const candidate = input.startsWith("//")
    ? `https:${input}`
    : /^[a-z][a-z\d+.-]*:/i.test(input)
      ? input
      : `https://${input}`;

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function isHost(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase();
  return host === domain || host.endsWith(`.${domain}`);
}

function validYouTubeId(value: string | null | undefined): string | null {
  const id = value?.trim() ?? "";
  return YOUTUBE_ID_PATTERN.test(id) ? id : null;
}

/** Extract the video ID from all common YouTube URL formats (or a bare ID). */
export function getYouTubeVideoId(value: string): string | null {
  const input = value.trim();
  const bareId = validYouTubeId(input);
  if (bareId) return bareId;

  const url = parseHttpUrl(input);
  if (!url) return null;

  if (isHost(url.hostname, "youtu.be")) {
    return validYouTubeId(url.pathname.split("/").filter(Boolean)[0]);
  }

  if (
    !isHost(url.hostname, "youtube.com") &&
    !isHost(url.hostname, "youtube-nocookie.com")
  ) {
    return null;
  }

  const pathParts = url.pathname.split("/").filter(Boolean);
  const route = pathParts[0]?.toLowerCase();

  if (route === "watch") {
    return validYouTubeId(url.searchParams.get("v"));
  }

  if (["shorts", "embed", "live", "v"].includes(route)) {
    return validYouTubeId(pathParts[1]);
  }

  return null;
}

/** Convert a YouTube URL to the privacy-enhanced, parameter-free embed URL. */
export function getYouTubeEmbedUrl(value: string): string | null {
  const id = getYouTubeVideoId(value);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export const normalizeYouTubeUrl = getYouTubeEmbedUrl;
export const normalizeYouTubeEmbedUrl = getYouTubeEmbedUrl;

/** Extract a file ID from a Google Drive file-sharing URL (not Docs/Slides links). */
export function getGoogleDriveFileId(value: string): string | null {
  const input = value.trim();
  if (DRIVE_ID_PATTERN.test(input) && !input.includes(".")) return input;

  const url = parseHttpUrl(input);
  if (!url || !isHost(url.hostname, "drive.google.com")) return null;

  const pathMatch = url.pathname.match(/\/file\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]+)/i);
  const candidate = pathMatch?.[1] ?? url.searchParams.get("id");
  return candidate && DRIVE_ID_PATTERN.test(candidate) ? candidate : null;
}

/** Convert a Drive file-sharing URL to the stable player-friendly /preview URL. */
export function getGoogleDrivePreviewUrl(value: string): string | null {
  const id = getGoogleDriveFileId(value);
  return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}

export const normalizeDriveUrl = getGoogleDrivePreviewUrl;
export const normalizeDrivePreviewUrl = getGoogleDrivePreviewUrl;

export function getLoomEmbedUrl(value: string): string | null {
  const url = parseHttpUrl(value);
  if (!url || !isHost(url.hostname, "loom.com")) return null;

  const match = url.pathname.match(/^\/(?:share|embed)\/([A-Za-z0-9_-]+)/i);
  return match?.[1] ? `https://www.loom.com/embed/${match[1]}` : null;
}

export function getVimeoEmbedUrl(value: string): string | null {
  const url = parseHttpUrl(value);
  if (!url || !isHost(url.hostname, "vimeo.com")) return null;

  const pathParts = url.pathname.split("/").filter(Boolean);
  const videoIndex = pathParts[0]?.toLowerCase() === "video" ? 1 : 0;
  const id = pathParts[videoIndex];
  if (!id || !/^\d+$/.test(id)) return null;

  const unlistedHash = pathParts[videoIndex + 1];
  const hashQuery = unlistedHash && /^[A-Za-z0-9]+$/.test(unlistedHash)
    ? `?h=${encodeURIComponent(unlistedHash)}`
    : url.searchParams.get("h")
      ? `?h=${encodeURIComponent(url.searchParams.get("h") ?? "")}`
      : "";

  return `https://player.vimeo.com/video/${id}${hashQuery}`;
}

/** Resolve an iframe-capable source. A null result should render as a link-out card. */
export function getVideoEmbed(
  source: VideoSource,
  videoUrl: string,
): VideoEmbed | null {
  let src: string | null = null;

  switch (source) {
    case "youtube":
      src = getYouTubeEmbedUrl(videoUrl);
      break;
    case "drive":
      src = getGoogleDrivePreviewUrl(videoUrl);
      break;
    case "loom":
      src = getLoomEmbedUrl(videoUrl);
      break;
    case "vimeo":
      src = getVimeoEmbedUrl(videoUrl);
      break;
    default:
      return null;
  }

  return src ? { provider: source, src } : null;
}

export function getEmbedUrl(source: VideoSource, videoUrl: string): string | null {
  return getVideoEmbed(source, videoUrl)?.src ?? null;
}

export function canEmbedVideo(source: VideoSource, videoUrl: string): boolean {
  return getVideoEmbed(source, videoUrl) !== null;
}

