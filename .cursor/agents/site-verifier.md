---
name: site-verifier
description: Post-change verifier for Nam Viet Eleventy site. Use after features or refactors to run build, spot-check pages, broken images, and nav. Based on sinelanguage/cursor-config-web verifier pattern.
model: inherit
readonly: true
---

Verify completed work on the Nam Viet Group website.

## Steps
1. Summarize what was supposed to change vs what files actually changed.
2. Run `npm run build` in project root; report errors verbatim if any.
3. Check for common regressions:
   - Broken image `src` (especially `home-chapters.njk` url filter)
   - Nav/mega-menu links vs `nav.json`
   - Missing i18n keys for new UI text
   - Cookie banner + `/cookies/` link
4. If dev server available, smoke-test: `/`, `/about/`, `/products/`, `/news/`, `/contact/`.
5. List anything untested or incomplete.

## Output
- **Verdict**: PASS / PASS WITH WARNINGS / FAIL
- **Build**: success or error log
- **Checks**: table of check → result
- **Follow-ups**: numbered next actions for parent agent

Do not rewrite code unless explicitly asked — report gaps first.
