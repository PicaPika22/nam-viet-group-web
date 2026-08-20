# Home section 03 — Ecosystem redesign

Date: 2026-08-20  
Status: draft for user review (not implemented)  
Surface: home page `#ecosystem` only (`src/_includes/home-chapters.njk`)

## Goal

Home chapter 03 must do one job: show that Nam Viet is **one closed value chain** *and* **a group of member companies**, in a **single layout**. The visitor picks a **sector pillar**; the chain lights the steps that belong to that pillar; a compact list names the companies in that pillar.

## Decisions (locked)

| Topic | Choice |
|---|---|
| Job | Both chain and members, one layout — not a process grid stacked on a company catalog |
| Control | Sector **gates** are the only control. Stations on the mill line are captions, not clickable |
| Company density | Short name + year (if any) + link to `/companies/{id}/` |
| Layout | **Mill pipeline** — 8 stations on a flowing line; 6 pillars as gates on the left (desktop) / a gate rail (mobile). Not a chip strip above a dimmed stepper |
| Motion | One orchestrated beat on sector change: current runs along mapped stations, then companies dock. `transform`/`opacity` + SVG `stroke-dashoffset` only |
| Default | First sector `feed` is selected on load |
| Copy language | EN / VI / ZH, same `lang` pattern as the rest of the home page |
| Visual chapter | Keep `chapter--dark` and the existing `ecosystem.png` background |

## Out of scope

- About page ecosystem block (`src/about.njk` + `ecosystem-map.njk` ink variant). About still shows the full map (legal name + description per company).
- Home chapters 04–06 (Manufacturing, Products, Logistics). They may overlap thematically; this spec does not rewrite them.
- New chain steps (no “hospitality” step bolted onto the agri chain).
- CMS / `home.json` for this section. Source of truth remains `src/_data/ecosystem.js`.
- Changing company URLs, sector ids, or company ids.

## Design direction

Subject: Nam Viet’s mill-to-port chain (grain, silo, plant, warehouse, quay). Audience: partners scanning how the group actually fits together. Job: pick a pillar, watch it light its stretch of the line, see who operates there.

**Signature (the one risk):** the chain is a **living mill line**, not a tab UI. A cream stroke crawls along an SVG path like material on a conveyor. Choosing a pillar opens a gate: the crawl jumps to that stretch, stations on it ignite, companies slide in as if loaded at those docks.

This is not: rounded chips + highlighted stepper + card row (the default conglomerate block). Numbering `01–08` stays because order on this line is real process order.

Tokens stay the site’s: `--green-900` / `--ink` ground, `--cream` type, `--accent` (`#9ddda1`) for live current, `--brand-blue` / `--brand-red` only on the wordmark elsewhere — not on the pipeline. Type: Fraunces for station numbers and the active pillar name; Inter for the other five pillars and company shorts.

## Layout

**Desktop (≥901px)** — two columns inside `.container`, pipeline as the stage:

```
03  OUR ECOSYSTEM
One Ecosystem. Endless Possibilities.
{thesis}

┌──────────────┐    01────02────03────04····05····06····07····08
│ FEED &       │     ●     ●     ●     ●     ○     ○     ○     ○
│ NUTRITION    │    ── flowing current on 01–04 ──
│ Logistics    │
│ Trade        │    Nam Viet JSC ’02 →  Pilmico ’14 →  Feed Trading ’13 →
│ Infra        │
│ Hospitality  │
│ Research     │
└──────────────┘
                                    [ Explore the ecosystem ]
```

- **Left rail:** six sector names. The active name is Fraunces, larger, cream; the rest are Inter, muted. These are the tabs (gates). One selected.
- **Right stage:** one SVG path through eight stations. Stations are stamps (index + short label), not boxes. Path behind dim stations is hairline; path through lit stations is thicker + `--accent` crawl.
- **Dock:** compact company links sit **under the lit stretch**, not in a full-width list that ignores geography. If lit stations are 05–08, the dock aligns toward the right of the path. Hospitality (no stations): dock sits under the rail, path stays dim, crawl pauses.

**Mobile (≤900px)**

- Gates become a horizontal rail (scroll-x), still `tablist`.
- Pipeline is a full-bleed horizontal mill line (scroll-x), stations stay in order 01→08.
- Dock stacks under the line, full width.
- Same state model: one sector, mapped stations lit, companies of that sector only.

Chapter chrome (03, eyebrow, title, thesis) stays above this machine. CTA stays below it. Background `ecosystem.png` + veil remains; the pipeline sits in the container, not as a full-viewport WebGL scene.

## Copy

Eyebrow (unchanged):

- EN: Our Ecosystem
- VI: Hệ sinh thái Nam Việt
- ZH: 南越生态系统

Title (unchanged):

- EN: One Ecosystem. / Endless Possibilities.
- VI: Một hệ sinh thái. / Muôn vàn giá trị.
- ZH: 一个生态系统。 / 无限可能。

Thesis (replace the current paragraph):

- EN: From raw materials to global distribution, Nam Viet’s member companies run as one chain — choose a pillar to see where it sits and who operates it.
- VI: Từ nguyên liệu đến phân phối toàn cầu, các công ty thành viên Nam Việt vận hành như một chuỗi — chọn trụ cột để thấy vị trí trên chuỗi và đơn vị phụ trách.
- ZH: 从原材料到全球分销，南越成员企业作为一条链运转——选择支柱即可看到其所在环节与运营单位。

CTA (replace “About Nam Viet”):

- EN: Explore the ecosystem
- VI: Xem hệ sinh thái
- ZH: 了解生态系统
- href: `/about/#ecosystem`

## Chain steps

Stable ids. Labels stay the current home copy.

| id | EN | VI | ZH |
|---|---|---|---|
| `raw-materials` | Raw Materials | Nguyên liệu | 原材料 |
| `rd` | R&D | R&D | 研发 |
| `manufacturing` | Manufacturing | Sản xuất | 生产制造 |
| `packaging` | Packaging | Đóng gói | 包装 |
| `warehousing` | Warehousing | Kho vận | 仓储 |
| `logistics` | Logistics | Logistics | 物流 |
| `port` | Port Operations | Khai thác cảng | 港口运营 |
| `distribution` | Global Distribution | Phân phối toàn cầu | 全球分销 |

## Sector → chain mapping

Stored on each sector as `chainSteps: string[]` (step ids). Empty array means: dim the whole chain, still show companies.

| sector.id | chainSteps |
|---|---|
| `feed` | `raw-materials`, `rd`, `manufacturing`, `packaging` |
| `logistics` | `warehousing`, `logistics`, `port`, `distribution` |
| `trade` | `raw-materials`, `distribution` |
| `infra` | `manufacturing`, `warehousing` |
| `hospitality` | _(empty)_ |
| `research` | `rd` |

Hospitality is off the agri chain on purpose. Do not invent a ninth step to make the highlight feel symmetric.

## Company row

For each company in the active sector, render only:

- `short` (EN/VI/ZH)
- `year` when present (omit the field when `year` is null)
- `unit` badge when `unit` is true (same EN/VI/ZH strings as the current map: Unit / Đơn vị / 单位)
- link to `/companies/{id}/`

Do not render `name` (legal) or `desc` on home 03.

Order: existing array order in `ecosystem.sectors[].companies`.

## Data

File: `src/_data/ecosystem.js`.

Additive shape:

- `ecosystem.chain`: array of `{ id, en, vi, zh }` in the table order above.
- `ecosystem.sectors[].chainSteps`: array of chain ids from the mapping table.

About’s eco-map ignores `chain` and `chainSteps`. Home 03 does not hardcode step labels or mappings in the Nunjucks template.

Home 03 **does not** include the current eco-map partial (`ecosystem-map.njk`). That partial stays for About.

## Accessibility

- Sector gates: `role="tablist"` / `tab` / `tabpanel` on the company dock, same keyboard model as the current eco-map (arrow keys, `aria-selected`, `tabindex`).
- Pipeline: not in the tab order. Stations and the SVG path are `aria-hidden="true"`.
- One `aria-live="polite"` status string when the sector changes, built from the **active language**: `sector.title` plus the labels of `chainSteps`. If `chainSteps` is empty: EN “{title} has no steps on the value chain.” / VI “{title} không nằm trên chuỗi giá trị.” / ZH “{title}不在价值链环节上。”
- Company links must have accessible names from `short` (and year if shown).
- Do not hide sector switching behind hover. Motion is feedback, not the only cue (opacity + stroke weight + live region).

## Visual rules

- Dark chapter: cream type, `--accent` only on the live stretch and the active gate. Do not paint the whole line red/blue.
- Dim stations: ~40% opacity, hairline path; labels remain readable.
- Lit stations: full opacity, larger stamp, thicker path segment.
- Company dock: one line per company on desktop (`short` · `year` · →); stack on small screens. Not the old 8-cell `.flow` grid. Not a card gallery.
- Active gate type is the loudest type in the machine; do not also shout the title of the chapter.

## Motion

One beat per sector change. Site already has GSAP + ScrollTrigger; use that, do not add another animation library.

**On section enter (once, if in view):** path draws left→right (`stroke-dashoffset`), then the default sector (`feed`) lights. Duration ~0.9s, `--ease-soft`.

**On sector change:**

1. Previous stretch and dock fade/slide out (`opacity` + `translateY(12px)`, ~180ms).
2. Accent dash **runs to the new mapped span** (SVG stroke, not width/left animation). Isolated stations (e.g. Research = `rd` only) pulse the stamp scale 1 → 1.08 → 1 (`transform` only).
3. Companies **stagger in** from the dock (`opacity` + `translateX(16px)`, 50ms between items, max 4 items so the beat stays short).
4. Hospitality: skip step 2’s crawl; freeze dash; play a short dim-pulse on the whole path, then dock in.

**Idle:** while `#ecosystem` is in view and `chainSteps` is non-empty, a slow repeating dash offset on the lit span only (material creeping). Pause when the section leaves the viewport (IntersectionObserver / ScrollTrigger). No `scroll` listeners, no rAF loop without a kill, no blur animation, no layout properties (`width`, `height`, `top`, `left`) as animation targets.

**`prefers-reduced-motion`:** no draw, no crawl, no stagger. Instant class swap for lit stations and dock. State and live region still update.

## Success

- Visitor can name the eight chain steps without leaving the section.
- Visitor can switch all six sectors with keyboard and mouse; the lit stretch and company dock update together **and** the motion beat plays (or instant swap if reduced motion).
- Hospitality shows companies, no lit stations, crawl paused.
- No legal name or long description on home 03.
- About ecosystem map still lists full company copy after this change.
- Pipeline does not cause horizontal page overflow; inner rails may scroll.
- Motion stays on the compositor: no jank from animating layout on the chapter.

## Non-goals for the first implementation plan

- WebGL, particles, or a second animation library.
- Filtering companies across sectors.
- Deep-linking a sector from the URL on home (About hash behavior stays as today).
- Making chain stations clickable.
