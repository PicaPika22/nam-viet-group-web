# Page ADN · Leadership

**ID:** `adn.page.leadership`  
**Routes:** `/about/leadership/`, About panel `#leadership`  
**Overrides:** [nam-viet-group/MASTER.md](../nam-viet-group/MASTER.md)  
**Pattern:** [vertical-people-panels.md](../patterns/vertical-people-panels.md) → genotype **B (1–4–5)**

---

## Page job

One purpose: show Group leadership hierarchy and open individual profiles.  
No secondary marketing widgets in the strip band.

## Composition

1. **Crumb rail (luminous)** — breadcrumb on soft map-blue ground  
2. **Strip (bright atlas stage)** — page `h1` + lead in strip head · genotype B · Higgsfield world-map watermark · **horizontal** name/role · hover lift + profile cue  
3. **Actions** — Contact + About CTAs on light stage

About embed: intro `leader__grid` (copy + group photo) then **compact** strip.

## Hierarchy map

| Tier | Count | Who | Layout gene |
|------|-------|-----|-------------|
| 1 | 1 | Chủ tịch (Hà Văn An) | Apex centered, larger |
| 2 | 4 | Phó TGĐ, KTT, GĐ then chốt | Centered row ~80–92% |
| 3 | 5 | GĐ đơn vị còn lại | Full-width equal |

Source of truth: `src/_data/leadership.js` → `person.tier`.

## Must / Must not

**Must**

- Use `leadership-strip` partial (or DNA-equivalent markup)
- Chairman geometrically centered
- Vertical panel type on desktop
- Profile links `/about/leadership/{id}/`

**Must not**

- Primary orgchart card skin as the main expression
- Flat peer grid that demotes Chairman
- Higgsfield faces replacing real portraits

## Motion

Tiered `.reveal` stagger; hover lift on panels; respect reduced motion.

## QA

- Counts 1/4/5
- Apex center delta &lt; 8px vs strip inner
- Compact About does not break sticky subnav
- Mobile: apex first; no Chairman lost in mid-scroll peers
