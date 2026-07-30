---
name: vertical-leadership-panels
description: >-
  Designs and implements East-Asian-inspired vertical leadership/speaker panel
  strips (navy panels, cut-out portraits, vertical name/role type, atmospheric
  watermark). Use for Nam Viet Leadership pages, org charts 1-4-5, Ban lãnh đạo
  redesigns, speaker grids, or when the user references vertical panel posters,
  writing-mode vertical-rl, or cinematic navy people strips.
---

# Vertical Leadership Panels

## When this applies

Nam Viet Group corporate site — Leadership list, About `#leadership`, or any equal-weight people strip that must feel **cinematic industrial / Kim (Metal) navy**, not cream catalog cards.

Read [reference.md](reference.md) for the deep visual breakdown of the source poster pattern.

## Design thesis (non-negotiable)

1. **Structure encodes hierarchy** — for Nam Viet use **1 → 4 → 5** (tier from `leadership.js`), never a flat equal grid when org tiers exist.
2. **Chairman is always the visual apex** — alone, centered, larger panel (`leader-panel--apex`).
3. **Signature is vertical type + navy panel + portrait fade** — not badges, chips, or name-under-photo cards.
4. **One job per band** — strip shows people + hierarchy; bio lives on profile pages.

## Layout rules (Nam Viet)

```text
                 [ Chairman — centered apex ]
          [ t2 ] [ t2 ] [ t2 ] [ t2 ]     ← row max-width ~80–92%, centered
       [ t3 ][ t3 ][ t3 ][ t3 ][ t3 ]  ← full width, equal flex
```

- Data: `src/_data/leadership.js` fields `tier`, `image`, `name.{en,vi,zh}`, `role.{en,vi,zh}`
- Partial pattern: `src/_includes/partials/leadership-strip.njk`
- Styles: `.leader-strip` / `.leader-panel` in `src/css/pages.css`
- Nunjucks: loop levels as `[1,2,3]`; **never** name the loop variable `tier`

## Visual system

| Token | Role |
|-------|------|
| Navy stage `#0F172A` / `--navy-900` | Strip background |
| Panel gradient navy-600 → navy-900 | Each column |
| Cream / white type | Name + role on panel |
| Accent blue | Apex role / eyebrow only |
| Watermark | Low-opacity industrial/group photo under veil — theme context, not subject |

### Portrait treatment

- Prefer real photos (already 3:4). Fade bottom into navy via gradient/`mask-image`.
- True cut-out (transparent PNG) is ideal for the poster look; if unavailable, full-bleed crop + fade is acceptable.
- Eye-line roughly consistent across a row.
- No floating badges on faces.

### Typography

- Desktop: `writing-mode: vertical-rl; text-orientation: mixed` for name + role in upper panel zone.
- Name larger / display face; role smaller / softer opacity.
- Mobile (≤900px): switch meta to horizontal at bottom of panel — vertical type becomes unreadable when panels are narrow.
- Keep `.lang en|vi|zh` spans.

## Motion

- Use existing `.reveal` + `data-delay` (stagger by tier then index).
- Hover: slight lift + slow image scale; respect `prefers-reduced-motion`.
- No GSAP required for this pattern.

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| ≥901px | Vertical type; 1 / 4 / 5 rows as designed |
| ≤900px | Horizontal meta; t2/t3 may `overflow-x: auto` + scroll-snap; apex stays centered full |
| ≤720px | Wider snap cards; never put Chairman mid-scroll among peers |

## Anti-patterns

- Flat 2×5 or 5 equal top-row peers when Chairman must dominate
- Cream card grid with name below photo (old roster look) as the primary Leadership expression
- Purple glow, pill badges, emoji, multi-layer drop shadows
- Showing all three languages at once
- Regenerating real executive faces with AI

## Implementation checklist

```
- [ ] Tier counts render 1 / 4 / 5 from data
- [ ] Chairman centered (measure midpoints of apex vs strip inner)
- [ ] Vertical type desktop; horizontal meta mobile
- [ ] Links to `/about/leadership/{id}/`
- [ ] i18n lang spans intact
- [ ] Reduced-motion safe
- [ ] About embed uses compact variant without breaking page subnav
```

## Related project skills

- `frontend-design` — broader visual direction / anti-slop
- `eleventy-nunjucks` — templates & filters
- `i18n-localization` — trilingual strings
- `web-accessibility` — focus, contrast, readable alternatives to vertical type on small screens

## Design ADN (canonical docs)

Prefer these when designing new surfaces — skills implement; ADN defines:

- Index: `design-system/ADN.md`
- Pattern: `design-system/patterns/vertical-people-panels.md`
- Page: `design-system/pages/leadership.md`
- Poster deep-dive: [reference.md](reference.md)
