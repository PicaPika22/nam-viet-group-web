# Nam Viet Group — agent notes

Eleventy 3 + Nunjucks corporate site. Public pages live in `src/`. Never hand-edit `_site/`.

## Stack

- `npm run dev` → http://localhost:8125 (`_site/` output)
- `npm run build` → Eleventy only
- Data: `src/_data/` (`site.json`, `nav.json`, `i18n.json`, collections)
- Templates: `src/_includes/layouts/` + `partials/` + `home-chapters.njk`
- CSS: `src/css/style.css` (global), `pages.css` (inner pages), `redesign.css` (2026 homepage modernization)
- JS: `src/js/main.js` (motion, i18n, nav), `src/js/site.js` (search, cookies, forms)

## Non-negotiables

1. Layout chain uses Eleventy `layout:` front matter. Do **not** use `{% extends %}` / `{% block %}` for page shells.
2. Trilingual UI: every new string needs **en / vi / zh**. Templates use `<span class="lang en|vi|zh">`, not hardcoded single-language copy. Default locale is `site.localeDefault` (`en`).
3. Keep mega-menu + inner URLs from `nav.json`. Homepage hash links (`/#about`) must not replace `/about/`, `/products/`, `/news/`.
4. Image URLs: `{{ '/assets/img/foo.jpg' | url }}`.
5. `| safe` is a security boundary — only for trusted template HTML (`content`, JSON-LD).
6. After template/CSS/JS changes, run `npm run build`.

## Visual system (2026 redesign)

- Type: **Fraunces** (display) + **Inter** (body) + Noto Sans SC (Chinese). Keep this pair; do not switch to Be Vietnam Pro.
- Accent green `#12a05a`, ink `#0f2019`, gold `#c9a44c`.
- Home hero: four depth planes (`hero-sky/mount/mid/fore.webp`). Keep `id="hero"` for the chapter rail.
- Header is a floating white card. Mega-menu, search, language pills, and contact CTA stay.

## Skills (read when relevant)

Project copies live in `.cursor/skills/` (and `.agents/skills/`):

| Skill | Use when |
| --- | --- |
| `eleventy-nunjucks` | templates, filters, `.eleventy.js`, permalinks |
| `frontend-design` | new sections, visual direction |
| `web-design-guidelines` | UI quality / UX review |
| `web-accessibility` | keyboard, focus, contrast, mega-menu |
| `i18n-localization` | new strings, locale parity |
| `seo` | meta, sitemap, structured data |
| `copywriting` | headlines / CTAs |
| `nam-viet-site` | this repo’s conflict-avoidance rules |
