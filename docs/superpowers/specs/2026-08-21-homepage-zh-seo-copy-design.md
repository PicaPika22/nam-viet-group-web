# Homepage & site-wide meta — Chinese SEO copy pass

Date: 2026-08-21
Status: approved for implementation (scoped via AskUserQuestion with user)
Site: Nam Viet Group Eleventy 3 public site

## 1. Goal

Rewrite the homepage's Chinese (`zh`) visible copy and fix site-wide `<title>`/`<meta description>` localization so the site reads as SEO-standard, logically structured and engaging in Chinese, without changing data structure, visible EN/VI copy, or page layout.

## 2. Locked decisions (from user)

| Topic | Choice |
|---|---|
| Page scope, this pass | Home page (`src/_data/home.json`, all 12 sections) + site-wide `<title>`/`<meta description>` |
| Locale priority | Chinese (`zh`) first; VI/EN untouched in `home.json` body copy |
| Freedom level | Optimize wording + keywords; keep existing field structure and meaning; no new/removed fields |
| Keywords | No keyword list supplied — derive from industry content (feed manufacturing, agri logistics, port warehousing, export) |

## 3. Bug found during discovery (in scope as "meta site-wide")

`src/_includes/partials/head.njk` resolves a page's `<title>`/`<meta description>` from front-matter `title`/`description`. It already supports locale-object values (`{en, vi, zh}` picked by `[locale]`), but:

- Every top-level page (`about.njk`, `careers.njk`, `contact.njk`, `cookies.njk`, `downloads.njk`, `investors.njk`, `news/index.njk`, `privacy.njk`, `products/index.njk`, `companies/index.njk`, `sustainability.njk`, `terms.njk`) sets `title:` as a **plain English string**, so `<title>` is English on all 3 locale builds. None of them set `description:` at all, so `<meta description>` falls back to `site.description`, also a plain English string.
- `index.njk` (home) sets neither, so it falls back entirely to `site.title`/`site.description` (English) on every locale.
- `head.njk`'s fallback line (`docTitle = site.title`) has no locale-resolution branch, unlike `docDesc`, which already does.

This means the `<title>`/`<meta description>` for the Chinese build of every page — including the priority page, Home — currently render in English. Fixing this is required to make the Chinese SEO work in this pass actually visible to crawlers, and matches the existing `eyebrow:` front-matter convention (already a per-page locale object on several pages).

## 4. Changes

1. **`head.njk`**: give `docTitle`'s fallback (`site.title`) the same locale-object resolution `docDesc` already has, so an object-valued `site.title` resolves correctly when a page sets no `title`.
2. **`site.json`**: convert `title` and `description` from plain strings to `{en, vi, zh}` objects. VI/EN keep the existing copy (or a light equivalent); ZH gets a fresh SEO-optimized version. This is the global fallback (mainly exercised by Home).
3. **`index.njk`**: add explicit `title`/`description` front matter as `{en, vi, zh}` objects, ZH written for SEO (primary keyword near the front, 50-60 chars; description 150-160 chars with a natural CTA).
4. **All other top-level page files** listed above: convert `title:` to a `{en, vi, zh}` object and add a new `description:` `{en, vi, zh}` object. VI/EN titles mirror current English/visible page copy (kept simple, not a rewrite); ZH gets SEO-optimized title + description. This is metadata only — no visible body copy on these pages changes.
5. **`home.json`**: rewrite the `zh` block inside every section's `content` (`hero`, `about`, `ecosystem`, `manufacturing`, `products`, `logistics`, `network`, `sustainability`, `leadership`, `milestones`, `news`, `contact`) plus `zh` stat/item/timeline labels already present, for more natural, keyword-rich, engaging Chinese copy. Field names, section count, and non-`zh` locale values are untouched. Target semantic keywords (derived from content, not stuffed): 南越集团, 越南饲料生产商/饲料生产, 农业产业链/一体化生态, 物流与港口仓储, 猪禽料/水产饲料, ISO GMP HACCP 认证, 可持续农业/ESG, 太原/宋功 (for local relevance where natural).

## 5. Out of scope (future passes)

- VI/EN rewrite of `home.json` body copy.
- Body copy of About, Careers, Companies, Products, News, Investors, Sustainability pages (only their `<title>`/`<meta description>` change in this pass).
- Structured data (JSON-LD), sitemap, hreflang — explicitly excluded by the parent Locale URLs spec (Child spec 2) and not requested here.
- Per-product / per-news-post / per-job detail SEO copy.

## 6. Verification

- `npm run build` succeeds (Eleventy 3.0, existing i18n build gate requires all three locale fields present — confirms no missing translatable field).
- Spot-check rendered `_site` output: Chinese `<title>`/`<meta description>` on `/zh/` differ from the English ones and stay within SEO length guidance.
- No change to `en`/`vi` visible strings in `home.json`; no field additions/removals (diff review).
