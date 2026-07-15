const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Prefix an internal root-relative path with Astro's configured deployment base. */
export function withBase(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? `${basePath}/` : `${basePath}${normalized}`;
}

export function assetUrl(value: string): string {
  return /^(?:https?:)?\/\//i.test(value) || value.startsWith("data:")
    ? value
    : withBase(value);
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
