# ADN · Vertical People Panels

**ID:** `adn.vertical-people-panels`  
**Family:** People / hierarchy strips  
**Mood:** Cinematic industrial · Kim (Metal) · East-Asian corporate panel grammar  
**Origin:** Forum-poster pattern (equal vertical speaker columns + vertical type) adapted for agribusiness conglomerate.

---

## 1. Intent

Present a set of people as one **navy composition**, not a catalog of cream cards.  
Type orientation and panel rhythm are the signature. Hierarchy is encoded by **position and scale**, not badges.

## 2. Signature DNA (must keep)

| Gene | Spec |
|------|------|
| Stage | Full-bleed or rounded stage · `--navy-900` `#0F172A` |
| Panel | Tall column · navy gradient `#1e3a5f` → `#0F172A` · 1px cream border ~10% |
| Portrait | Upper-third face · bottom fade into navy · optional true cut-out |
| Type | Desktop `writing-mode: vertical-rl` · name display · role smaller / softer |
| Gutter | Hairline gap `0.35–0.55rem` so stage watermark peeks through |
| Watermark | Thematic photo ≤18% opacity + navy veil — never the hero |
| Interaction | Whole panel = link · hover lift ~4px · image scale · reduced-motion safe |

## 3. Hierarchy genotypes

Pick one genotype; do not mix randomly.

### A · Peers (poster default)

One row of **N equal** panels (often 5). Use for speakers, jury, equal partners.

### B · Org 1–4–5 (Nam Viet Leadership)

```text
              [ Apex — centered, larger ]
         [ ] [ ] [ ] [ ]     ← mid tier, row centered (~80–92% width)
      [ ][ ][ ][ ][ ]        ← base tier, full width
```

- Apex alone on its row; always geometrically centered under strip inner.
- Mid row shared axis with apex (centered group).
- Base row widest foundation.

### C · Featured + strip

One wide feature + horizontal strip of others (profiles, news authors). Softer hierarchy than B.

## 4. Tokens (map to site CSS)

```
Stage:     --navy-900 / #0F172A
Panel mid: --navy-700 / #1e3a5f
Accent:    --navy-600 / #0369A1  (apex role / eyebrow only)
Type:      --cream / #f4f1ea
Display:   --font-display (Fraunces)
Ease:      --ease-out / --ease-soft
```

Do **not** introduce purple, terracotta-cream editorial defaults, or acid neon.

## 5. Typography genes

| Role | Treatment |
|------|-----------|
| Panel name | Display · cream · clamp ~1.05–1.65rem |
| Panel role | Sans · cream ~68% · smaller tracking |
| Strip eyebrow | Accent blue · uppercase/light |
| Mobile meta | Horizontal under portrait when panel width < ~12rem |

i18n: keep three `.lang` spans; never show all languages at once.

## 6. Responsive genes

| Width | Behavior |
|-------|----------|
| ≥901px | Vertical type · genotype layout intact |
| ≤900px | Horizontal meta · mid/base may snap-scroll |
| ≤720px | Wider snap cards · apex still first & centered |

## 7. Motion genes

- Reveal stagger: by tier, then index (`data-delay`).
- Hover: `translateY(-4px)` + image `scale(1.04→1.08)`.
- `prefers-reduced-motion`: kill transforms.

## 8. Anti-genes (forbidden)

- Cream card grid with name *under* photo as primary people UI
- Flat 2×5 when genotype B is required
- Pill badges / stickers on faces
- AI-generated real executive faces
- Dollar/stock collage watermarks on Nam Viet (wrong industry signal)
- Multi-layer glow shadows · emoji

## 9. Reuse recipes

| Surface | Genotype | Notes |
|---------|----------|-------|
| `/about/leadership/` | B (1–4–5) | Canonical |
| About `#leadership` | B compact | Smaller min-heights, rounded stage |
| Event speakers | A | Equal columns |
| Board subset | A or C | If no strict tiers |
| Mobile app / narrow | B stack | Apex full → snap rows |

## 10. Code anchors (this repo)

- Partial: `src/_includes/partials/leadership-strip.njk`
- CSS: `.leader-strip`, `.leader-panel` in `src/css/pages.css`
- Data: `src/_data/leadership.js` (`tier`)
- Skill: `.agents/skills/vertical-leadership-panels/`

## 11. Delivery checklist

- [ ] Genotype chosen and counts match data
- [ ] Apex centered if genotype B
- [ ] Vertical type desktop / horizontal mobile
- [ ] Watermark atmospheric only
- [ ] Contrast cream on navy OK
- [ ] Focus-visible ring present
- [ ] Brand test: without nav, still reads Nam Viet navy
