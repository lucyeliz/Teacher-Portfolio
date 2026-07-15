import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

const githubUser = "lucyeliz";
const githubRepository = "Teacher-Portfolio";

export default defineConfig({
  site: `https://${githubUser}.github.io`,
  base: `/${githubRepository}`,
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap()],
});

/*
 * Future custom-domain setup:
 * 1. Change `site` to the custom origin, for example `https://lucykrych.com`.
 * 2. Change `base` to `/`.
 * 3. Add `public/CNAME` containing the custom hostname.
 */
