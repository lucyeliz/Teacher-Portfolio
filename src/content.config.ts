import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

export const videoSources = [
  "local",
  "youtube",
  "drive",
  "loom",
  "vimeo",
  "other",
] as const;

const videoSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required."),
    date: z.coerce.date(),
    section: z.string().trim().min(1, "Section is required."),
    topic: z.string().trim().min(1, "Topic is required."),
    source: z.enum(videoSources),
    videoFile: z.string().trim().default(""),
    videoUrl: z.string().trim().default(""),
    thumbnail: z.string().trim().default(""),
    links: z
      .array(
        z.object({
          label: z.string().trim().min(1, "Link label is required."),
          url: z.string().url("Related artifact must use a valid URL."),
        }),
      )
      .default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  })
  .superRefine((data, context) => {
    if (data.source === "local" && !data.videoFile) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "videoFile is required when source is local.",
        path: ["videoFile"],
      });
    }

    if (data.source !== "local" && !data.videoUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `videoUrl is required when source is ${data.source}.`,
        path: ["videoUrl"],
      });
    }

    if (data.source !== "local" && data.videoUrl) {
      try {
        const parsed = new URL(data.videoUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
      } catch {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "videoUrl must be a valid http or https URL.",
          path: ["videoUrl"],
        });
      }
    }

    if (data.videoFile && !data.videoFile.startsWith("/")) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "videoFile must start with a forward slash, for example /videos/example.mp4.",
        path: ["videoFile"],
      });
    }
  });

const videos = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/videos" }),
  schema: videoSchema,
});

const sections = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/sections" }),
  schema: z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
  }),
});

export const collections = { videos, sections };
