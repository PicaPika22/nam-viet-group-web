# Reference — Vertical panel poster analysis

Source pattern: East-Asian corporate forum poster (investment / speakers). Adapted for Nam Viet Leadership (navy / Kim Metal), not finance-collage literalism.

## Composition anatomy

```text
┌──────────────────────────────────────────────┐
│  LIGHT ZONE — title / date / brand eyebrow   │  ← event poster only
│  soft watermark (skyline, charts, currency)  │
├──────┬──────┬──────┬──────┬──────────────────┤
│ P1   │ P2   │ P3   │ P4   │ P5               │  ← equal vertical panels
│ name │ name │ name │ name │ name  (vertical) │
│ role │ role │ role │ role │ role             │
│ ☺    │ ☺    │ ☺    │ ☺    │ ☺   (cut-outs)  │
└──────┴──────┴──────┴──────┴──────────────────┘
```

Two horizontal bands:

1. **Information band (light)** — hierarchy of event: badge → title → datetime. Airy, high-key, soft texture.
2. **People band (dark)** — five equal columns; people are the product.

For Nam Viet Leadership pages, drop the event title band (site already has chapter hero). Keep the **people band language** and re-encode hierarchy as **1–4–5 rows** instead of one equal row of five.

## Why the pattern works

| Principle | How the poster does it | Nam Viet adaptation |
|-----------|------------------------|---------------------|
| Rhythm | Equal panel widths = peers | Equal *within* a tier; apex larger |
| Depth | Cut-out over textured navy | Fade/mask over navy gradient + industrial watermark |
| Density | Vertical type frees horizontal space | Same on desktop; horizontal on mobile |
| Theme without noise | Currency/skyline at low opacity | Factory/group photo at ~0.12–0.2 opacity + navy veil |
| Equality vs rank | Five speakers same size | Chairman alone on top; then 4; then 5 |

## Color & material

- Monochrome **blue scale**: paper white → sky → royal → deep navy.
- Small **warm accent** (poster: gold badge) → Nam Viet: restrained gold/accent on apex role or eyebrow only.
- Panels read as **metal / night glass**, not pastel cards.

## Type system in the poster

- Display title: large, bold, high contrast on light ground.
- Meta (date): lighter weight, secondary blue.
- In-panel: **vertical-rl** name (large) + affiliation (small, thinner).
- Alignment: type sits beside the head, not across the face.

Web mapping:

- `writing-mode: vertical-rl`
- `text-orientation: mixed`
- Name: `--font-display`, cream
- Role: smaller sans, ~68% cream opacity

## Image craft skills implied

1. **Background removal / masking** — pen tool, select-subject, or AI matte; clean hair edges.
2. **Consistent lighting grade** — cool key, similar exposure across row.
3. **Compositing** — multiply/overlay watermarks; gradient veil for legibility.
4. **Crop discipline** — head in upper third; torso fade into panel base.
5. **Batch normalize** — same ratio (Nam Viet: 900×1200, 3:4).

## Layout / UI skills implied

1. **Grid literacy** — equal columns, hairline gutters, shared baseline for eyes.
2. **Hierarchy encoding** — size, position, solitude (apex alone) beat decorative labels.
3. **Responsive translation** — 5-up desktop → snap-scroll or stack; never lose apex center.
4. **CSS vertical writing** — plus fallback when column width < ~12rem.
5. **Focus / hit targets** — entire panel is the link; visible `:focus-visible`.

## Motion / interaction (web extension)

Poster is static. Web adds:

- Staggered reveal by tier
- Hover: translateY + image scale (compositor-friendly)
- Reduced motion: opacity only / no transform

## What NOT to copy literally

- US dollar / stock-chart collage (wrong industry signal for Nam Viet agribusiness)
- Yellow promo badge language of “forum 2021”
- Exactly five equal top-tier people when org is 1–4–5
- Traditional Chinese event copy

## Critique checklist when reviewing a build

- [ ] Does the strip still read as one navy composition?
- [ ] Is Chairman unmistakably first (center + scale)?
- [ ] Are panel gutters even; do eyes align across a row?
- [ ] Is vertical type legible (contrast, not covering face)?
- [ ] Does watermark stay atmospheric (< ~20% visual weight)?
- [ ] Mobile: can you reach every person without horizontal dead-ends?
- [ ] Would removing the nav still feel like Nam Viet (brand test)?
