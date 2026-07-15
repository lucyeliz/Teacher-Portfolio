# AGENTS.md

## Site overview

This repository is Lucy Krych’s Teaching Programming Portfolio: an Astro 5 static site using strict TypeScript, Zod-validated Astro content collections, self-hosted fonts, and plain CSS. Videos and teaching artifacts are written for non-technical school and industry interviewers. GitHub Actions builds the site and GitHub Pages hosts it at the project base path. There is no database, backend, CMS, tracking, or cookie use. The core maintenance contract is that a new externally hosted video requires exactly one new Markdown file; a local video requires that Markdown file plus its browser-ready media file.

## How to add a video

Before handling any media, check privacy. Never put K–12 student names, classmate names, or identifying details in a title, description, filename, thumbnail, or alt text. Footage showing identifiable students requires consent before publication. When footage may be sensitive, prefer an unlisted YouTube upload and keep the entry in draft until permission is confirmed.

Use lowercase kebab-case for the Markdown filename and local media filename: letters, numbers, and hyphens only. The Markdown filename is the page slug. For example, `nested-repeats.md` becomes `/videos/nested-repeats/`, and its local file is `nested-repeats.mp4`.

Write two to four plain-language sentences in the Markdown body. Explain what the project demonstrates, what a learner or viewer will see, and why it matters for teaching. Do not assume the reader knows programming terms. Do not edit a page, component, navigation file, or configuration file when adding a video.

### Case A: local video file

1. Inspect the file size **before copying it into the repository**. GitHub rejects files at 100 MB, so this project uses a firm 95 MiB safety limit.
2. If the file is 95 MiB or larger, **do not copy or commit it**. Create only the Markdown entry using the local template below with `draft: true`, leave a body comment such as `<!-- TODO: Upload this video to YouTube as unlisted, set source to youtube, add videoUrl, then set draft to false. -->`, and do not invent a URL. Because a non-local source requires a URL, retain `source: local`, set the intended `videoFile` path, and keep the absent media entry in draft. Upload it to YouTube as unlisted, then switch `source` to `youtube`, clear `videoFile`, set `videoUrl`, and publish by changing `draft` to `false`.
3. If the input is `.mov`, transcode it to H.264/AAC `.mp4`; do not publish the `.mov`. Use ffmpeg with H.264, CRF 23, the medium preset, fast-start metadata, and a 1080p maximum. This command preserves aspect ratio and avoids upscaling:

   ```sh
   ffmpeg -i "input.mov" -vf "scale=w='min(1920,iw)':h='min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,format=yuv420p" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart "public/videos/descriptive-kebab-case.mp4"
   ```

4. For an existing compatible `.mp4` below the limit, copy it to `public/videos/descriptive-kebab-case.mp4`. Keep migration source files unchanged. Confirm the final repository file—not just the input—is below 95 MiB.
5. Create exactly one content file at `src/content/videos/descriptive-kebab-case.md` using this template:

   ```md
   ---
   title: "Clear, Human-Readable Title"
   date: 2026-07-14
   section: "Code Walkthroughs"
   topic: "Short Concept Label"
   source: local
   videoFile: "/videos/descriptive-kebab-case.mp4"
   videoUrl: ""
   thumbnail: ""
   links: []
   featured: false
   draft: false
   ---
   In two to four sentences, explain what the viewer will see and what the project demonstrates. Connect the activity to learning or teaching in language a non-technical reader can understand.
   ```

6. A blank `thumbnail` is valid and renders a designed topic placeholder. Optionally run `npm run posters` after installing ffmpeg; poster generation is never required for a successful build.
7. Run the verification steps below, inspect the new card and detail page, then commit with exactly this format: `content: add video "Clear, Human-Readable Title"`.

### Case B: external video URL

1. Confirm the URL is intended to be shared. For YouTube, an unlisted link is acceptable and preferred for sensitive material, but consent is still required for identifiable students.
2. Choose the correct source: `youtube`, `drive`, `loom`, `vimeo`, or `other`. YouTube watch, `youtu.be`, Shorts, and embed URLs are normalized automatically. Use the original share URL in frontmatter. A Google Drive video share URL is supported; Google Docs and Slides belong under `links` instead of `videoUrl`.
3. Create exactly one content file at `src/content/videos/descriptive-kebab-case.md` using this template:

   ```md
   ---
   title: "Clear, Human-Readable Title"
   date: 2026-07-14
   section: "Code Walkthroughs"
   topic: "Short Concept Label"
   source: youtube
   videoFile: ""
   videoUrl: "https://www.youtube.com/watch?v=VIDEO_ID"
   thumbnail: ""
   links:
     - label: "Lesson plan (Google Doc)"
       url: "https://docs.google.com/document/d/..."
   featured: false
   draft: false
   ---
   In two to four sentences, explain what the viewer will see and what the project demonstrates. Connect the activity to learning or teaching in language a non-technical reader can understand.
   ```

4. Remove the example `links` item and use `links: []` when there is no related artifact. A blank YouTube thumbnail is derived automatically. For other sources, a blank thumbnail uses the topic placeholder.
5. Run the verification steps below, inspect the new card and detail page, then commit with exactly this format: `content: add video "Clear, Human-Readable Title"`.

### Frontmatter rules

- Required values: `title`, ISO date `date`, `section`, `topic`, and `source`.
- `source: local` requires a root-relative `videoFile` beginning with `/`, normally `/videos/<filename>.mp4`.
- Every non-local source requires `videoUrl`; keep `videoFile: ""`.
- `links`, `thumbnail`, `featured`, and `draft` may be left at their template defaults.
- `draft: true` keeps the entry out of public pages.
- Duplicate Markdown slugs and duplicate non-empty `videoFile` or `videoUrl` values fail the build. Fix the duplicate; do not bypass validation.
- External artifact links must be HTTPS wherever available. The shared UI opens them with `target="_blank" rel="noopener noreferrer"`.
- Never include a phone number. The public email is `lkrych@ucsd.edu` and belongs in the shared footer, not individual entries.

## How to add a new section

Use the desired human-readable name as the new video’s `section` value, for example `section: "Lesson Plans"`. That one value automatically creates the section page and navigation item; do not edit navigation, routing, or configuration.

An introduction is optional. To add one, create `src/content/sections/lesson-plans.md`, matching the section’s kebab-case slug:

```md
---
title: "Lesson Plans"
description: "A short, plain-language summary for cards or metadata."
---
Optional longer introductory copy can go here.
```

If no introduction file exists, the generated section page still works and simply has no custom introduction.

## How to change the theme

Edit `src/styles/tokens.css` only. All palette, typography, spacing, radius, shadow, and motion decisions are centralized there so the theme remains a one-file change. Preserve readable contrast, visible focus states, 44 px tap targets, and reduced-motion behavior. Do not copy or trace copyrighted Frog and Toad characters or artwork; decorative motifs must remain original.

## Do not change without explicit instruction

Future content-only tasks must not modify these areas:

- `.github/workflows/deploy.yml` or GitHub Pages settings
- `astro.config.mjs`, `package.json`, or `package-lock.json`
- `src/content.config.ts` or any content validation/duplicate-detection rule
- `src/layouts/`, shared navigation, route-generation code, or canonical/SEO behavior
- player/embed URL normalization, privacy behavior, or `youtube-nocookie.com`
- global contact, disclaimer, or consent language

If a requested video appears to require one of those changes, stop and explain why instead of widening the task silently.

## Verify locally

From the repository root:

```sh
npm install
npm run dev
```

Use the printed local URL to check the card, filter, generated section page, detail page, player/link-out behavior, related links, and mobile-width layout. Then stop the development server and run:

```sh
npm run test
npm run build
```

The build must finish without schema, duplicate-content, type, or broken-route errors. For a local video, also play it in the browser and seek near the end. For an external video, confirm its embed or link-out opens successfully. Do not mark a launch or deployment check complete based only on file existence.
