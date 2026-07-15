# Launch checklist

Check an item only after the complete statement has been verified. Source-file presence alone does not prove browser playback, Lighthouse scores, or a successful remote deployment.

- [ ] All five existing videos migrated, playing, with explanations drafted
- [x] Hero, intro, motto, and email match the approved copy; no placeholder phone number anywhere
- [x] Favicon and `og.png` in place
- [x] Unique title + meta description on every page
- [x] Sitemap and `robots.txt` live and correct
- [x] 404 page works
- [x] Lighthouse ≥ 95 (Performance, SEO, Accessibility) on Home and one video page
- [x] All embeds and local videos play on a mobile-width viewport
- [x] External links open in new tabs with `rel="noopener noreferrer"`
- [x] `AGENTS.md` and `README.md` complete; a test “add a video” dry run following `AGENTS.md` works
- [ ] GitHub Actions deploy is green; the site loads at the Pages URL with working styles and links
- [ ] **For Lucy, manual:** Add a “this site has moved” note on the old Wix site
- [ ] **For Lucy, manual:** Send the new URL to the instructor

## Verification notes

- Production target: <https://lucyeliz.github.io/Teacher-Portfolio/>
- Migration note: six supplied videos were migrated and verified (Conditional Loops, Events, Nested Repeats, Repeats, Sequencing, and Variables). The first checkbox remains open because the requested Lesson Plan recording was not present; no unrelated file was relabeled to conceal that gap.
- Browser QA at 375 px found no horizontal overflow, broken images, unsafe external links, console errors, or media decoding errors across all routes. Each video reported a valid duration, dimensions, `readyState: 4`, and no playback error.
- Lighthouse on the production preview scored **100 Performance / 100 Accessibility / 100 SEO** for Home and **100 / 100 / 100** for the Sequencing video page.
- The content dry run added one temporary Markdown entry and successfully generated its card, video route, section route, navigation item, filter value, and privacy-enhanced embed. The temporary entry was then removed and the clean site rebuilt.
- GitHub Pages must use **GitHub Actions** as its deployment source.
- The Wix subdomain cannot be redirected from this repository, so the move notice remains manual.
- The final two items must be completed by Lucy after the public deployment is verified.
