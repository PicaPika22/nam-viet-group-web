---
name: nam-viet-site
description: Nam Viet Group Eleventy site conventions — trilingual EN/VI/中文, mega-menu nav, homepage chapter IDs, and conflict-safe UI updates. Use when editing this corporate website, porting a redesign, adding pages, or changing header/home/CSS tokens.
---

# Nam Viet site

## Conflict-safe updates

When applying a visual redesign (Figma / `.dc.html` mockup):

1. Port **look** (type, color, layout, motion) into existing Nunjucks — do not paste mockup HTML wholesale.
2. Keep `nav.json` mega-menu and inner permalinks (`/about/`, `/products/`, `/news/`). Mockup hash-only nav is home-only decoration.
3. Keep `.lang.en` / `.lang.vi` / `.lang.zh` + `document.documentElement[data-lang]`. Do not switch to `data-l`.
4. Keep chapter IDs the rail and in-page links already use: `#hero`, `#about`, `#ecosystem`, `#manufacturing`, `#products`, `#logistics`, `#network`, `#sustainability`, `#leadership`, `#milestones`, `#news`, `#contact`. New sections (`#pillars`, `#quicklook`) are additive.
5. Do not overwrite CMS content (`src/news/posts`, `src/products/items`, `src/careers/jobs`) or `src/admin/`.
6. New optimized images go in as **additional files** (`hero-sky.webp`, `logo-160.png`). Do not delete existing `hero.png` / product JPGs still referenced elsewhere.

## Homepage chapters

`src/_includes/home-chapters.njk` is included from `src/index.njk` (`pageLayout: home`). Each `<section class="chapter">` needs `data-chapter` and `data-label-en|vi|zh` for the left rail.

## Header

`src/_includes/partials/header.njk` is shared by home and inner pages. Restyle the card; do not replace it with a one-page mockup header.

## Verify

```bash
npm run build
```

Smoke: `/`, `/about/`, `/products/`, `/news/`, `/contact/`. Language switcher must still persist `nv-lang`.
