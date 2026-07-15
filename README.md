# Lucy Krych’s Teaching Programming Portfolio

A static, storybook-inspired teaching portfolio for Lucy Krych, a prospective teacher studying Cognitive Science with a specialization in Language and Culture at UC San Diego. The site presents computing-education videos and related artifacts in plain language for school hiring committees, industry interviewers, instructors, and classmates.

The project uses Astro 5, strict TypeScript, Astro content collections, and plain CSS. It has no database, backend, CMS, analytics, cookies, or paid services. GitHub Pages hosts the generated static files.

## Quick start

Use Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

Astro prints the local URL, normally `http://localhost:4321/Teacher-Portfolio/`. Internal links include the same project base path used by GitHub Pages.

Before committing a change, run:

```sh
npm run test
npm run build
```

Other available commands:

```sh
npm run preview   # serve the production build locally
npm run posters   # optionally extract poster images from local videos with ffmpeg
```

`npm run posters` is optional and requires `ffmpeg` on the local machine. The website builds without generated posters.

## Adding content

Each published video is one Markdown file in `src/content/videos/`. A local video additionally has one media file in `public/videos/`; an externally hosted video needs no repository media file. The collection schema validates the frontmatter, and the filename becomes the URL slug.

For example, `src/content/videos/nested-repeats.md` creates `/videos/nested-repeats/`. Section pages, navigation items, topic filters, and detail pages are derived from content at build time, so adding a video does not require editing a component, page, layout, or configuration file.

See [AGENTS.md](./AGENTS.md) for the exact local-file and external-URL recipes, templates, media limits, privacy checks, and commit convention.

Optional section introductions live in `src/content/sections/`. A new `section` value creates its page and navigation item even when no matching introduction file exists.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/content.config.ts` | Zod schemas for videos and optional section introductions |
| `src/content/videos/` | One Markdown entry per video |
| `src/content/sections/` | Optional section introduction Markdown |
| `src/components/` | Shared head, navigation, cards, filters, players, and footer |
| `src/layouts/` | Shared page structure |
| `src/pages/` | Static and generated routes |
| `src/styles/tokens.css` | All color, type, spacing, shape, and motion design tokens |
| `src/utils/` | URL, media, collection, and deployment-path helpers |
| `public/videos/` | Browser-ready local video files |
| `public/posters/` | Optional local-video poster frames |
| `public/images/` | Portrait and branded image assets |
| `scripts/` | Optional maintenance scripts such as poster generation |
| `tests/` | Fast utility and validation tests |
| `.github/workflows/deploy.yml` | GitHub Pages build and deployment workflow |

## Content behavior

- Published videos sort newest first by the ISO `date` in frontmatter.
- Entries with `draft: true` do not appear in production pages.
- Up to three entries with `featured: true` appear on the Home page.
- YouTube URLs are normalized to privacy-enhanced `youtube-nocookie.com` embeds; common watch, share, Shorts, and embed URL forms are accepted.
- Google Drive video links use Drive preview URLs. Google Docs and Slides belong in `links` and open as external artifact cards rather than unreliable embeds.
- Sources that cannot be embedded render as a safe link-out card.
- YouTube thumbnails are derived automatically when `thumbnail` is empty. Local videos without a thumbnail use a designed topic placeholder; poster generation is optional.
- Duplicate slugs and duplicate non-empty `videoFile` or `videoUrl` values fail the build.

## Hosting and deployment

The `origin` Git remote is `https://github.com/lucyeliz/Teacher-Portfolio.git`, so the configured production address is:

<https://lucyeliz.github.io/Teacher-Portfolio/>

Astro uses:

- `site: https://lucyeliz.github.io`
- `base: /Teacher-Portfolio`
- static output with trailing slashes

Every push to `main` starts `.github/workflows/deploy.yml`. The workflow builds through `withastro/action` and deploys the artifact through GitHub’s official Pages action. The repository’s **Settings → Pages → Build and deployment → Source** must be set to **GitHub Actions** once by a repository administrator.

The custom-domain steps are intentionally commented out in `astro.config.mjs`. If a custom domain is added later, follow those steps and update the canonical production URL and sitemap URL together.

## Privacy and content safety

Do not publish phone numbers, tracking scripts, K–12 student names, classmate names, or identifying details in titles, descriptions, filenames, thumbnails, or alternative text. Footage with identifiable students requires documented consent before publication; an unlisted YouTube link is the preferred fallback for sensitive material. YouTube playback must continue to use `youtube-nocookie.com`.

The public contact address is `lkrych@ucsd.edu`. External links must open in a new tab with `rel="noopener noreferrer"`.

## Assumptions

These are the explicit assumptions used to build and maintain the repository:

1. The `origin` remote is authoritative for deployment. It identifies the GitHub owner as `lucyeliz` and the repository as `Teacher-Portfolio`; therefore the project Pages URL, canonical base, asset base, and sitemap location use `https://lucyeliz.github.io/Teacher-Portfolio/`.
2. `main` is the production branch. A push to any other branch does not deploy the public site.
3. No custom domain is active. The commented custom-domain block in `astro.config.mjs` is future guidance, not current configuration.
4. GitHub Pages is enabled for the repository and its deployment source can be set to GitHub Actions. A maintainer must perform that one-time repository setting because it cannot be guaranteed from source files alone.
5. The provided migration folder is not an exact filename match for the brief. It contains `Repeats.mp4` rather than `WP_Repeats.mp4`, `variables.mp4` rather than `Shapes video.mp4`, no file named as the requested Lesson Plan screen recording, and the extra files `Conditional Loops.mp4` and `Events.mp4`.
6. Migration filename mismatch rule: the actual bundle is authoritative, and a filename may substitute for a requested filename only when its subject is unambiguous—for example, `Repeats.mp4` for Repeats and `variables.mp4` for Variables. All six supplied videos are migrated under their own truthful topics: Sequencing, Repeats, Variables, Nested Repeats, Events, and Conditional Loops. No supplied file is guessed to be or relabeled as the missing Lesson Plan; that requested item stays unpublished until Lucy supplies the recording or an external URL.
7. Embedded media creation metadata is preferred for migrated dates. If it is absent, a reliable original filesystem timestamp may be used; a timestamp introduced merely by copying the file is not treated as the recording date. If neither is reliable, the entry remains a draft until Lucy supplies the date.
8. A “video under 95 MB” means the repository file itself is below 95 MiB, leaving safety margin below GitHub’s 100 MB hard limit. Larger files are not committed and use the documented draft/unlisted-YouTube workflow.
9. Local browser playback targets H.264 video with AAC audio in an `.mp4` container. `.mov` files are transcoded before publication and source migration files remain untouched.
10. Lucy has the right to publish supplied materials. Identifiable student footage is not evidence of consent by itself; it remains unpublished until consent is confirmed.
11. The supplied hero, tagline, introduction, motto, email address, and disclaimer copy are intentional and remain verbatim, including the grammar of the introduction, unless Lucy requests an edit.
12. Visitors are primarily non-technical. Labels and descriptions favor teaching outcomes and plain language over programming jargon.
13. A new section needs no bespoke introduction. If `src/content/sections/<section-slug>.md` is absent, its generated page appears without custom introductory copy.
14. External Google Docs and Slides are link-outs because access permissions and “published to the web” status cannot be inferred safely. No login-gated document is embedded as though it were public.
15. The first three newest published videos marked `featured: true` are sufficient for the Home page; additional featured entries remain accessible elsewhere.
16. The project deliberately ships without monetization, analytics, cookies, a contact form, a database, or server-side behavior.
17. Theme changes are made through `src/styles/tokens.css`; decorative artwork remains original and evokes a warm storybook mood without copying copyrighted characters or illustrations.
18. The three supplied `theme image` files reproduce copyrighted Frog and Toad artwork, so they are intentionally excluded from the new site. User-supplied portraits are the only photographs used publicly; all boat, book, leaf, reed, lily-pad, and ripple motifs are original.
19. The longer About-page biography and teaching-philosophy paragraphs are initial draft copy inferred from the supplied tagline, degree information, audience, and teaching focus. Lucy should revise them as her philosophy develops; the supplied introductory sentence remains verbatim.
20. “Latest Astro v5” means the newest release within major version 5, currently `5.18.2`, rather than the newest Astro major. npm currently reports Astro advisories whose published fixes require a later major; this project remains a static, input-free build and does not use the affected server-island or dynamic runtime patterns. A future major-version upgrade should be handled as a deliberate maintenance task.
21. The local `migration/` source bundle is ignored after migration so duplicate videos and the excluded copyrighted theme images are not accidentally committed or deployed. The browser-ready, kebab-case media copies in `public/videos/` and optimized portrait derivatives in `public/images/` are the site’s maintained assets.
22. The newer outdoor portrait is used only on the About page and is cropped to a responsive 4:5 frame; the existing indoor headshot remains on Home so this requested About-page change does not silently alter the established hero or Person-schema image.

## Launch status

Use [LAUNCH.md](./LAUNCH.md) as the source of truth for repository checks and the remaining GitHub/Lucy actions.
