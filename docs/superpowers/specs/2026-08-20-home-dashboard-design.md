# Home Editor dashboard (phase 1)

Date: 2026-08-20  
Status: approved for implementation planning  
Site: Nam Viet Group Eleventy 3 (EN / VI / 中文)

Independent admin at `/dashboard/` to reorder, show/hide, and edit copy and images of the **homepage’s 12 existing blocks**. Not a page builder. Content Studio at `/admin/` stays for news and jobs.

---

## 1. Goal and success

An editor can:

1. Drag the 12 homepage blocks into a new order and toggle visibility.
2. Edit text in VI, EN, and 中文 for each block.
3. Replace images through named slots (no path typing).
4. Add / edit / delete journey timeline milestones.
5. Save a draft without changing the live homepage, then publish after validation.

Success: after publish, `home-chapters.njk` renders only from `src/_data/home.json`. No hardcoded titles, leads, stats, images, timeline, product teaser names, or partner logos remain in that template. CSS and HTML structure stay in code.

Live site updates after Eleventy rebuild (local watch, or Vercel ~1–2 minutes in production).

---

## 2. Out of scope (phase 1)

- Header, footer, inner pages (About, Products, Leadership, Contact, …).
- Changing CSS, grid, or adding new block types.
- Editing the ecosystem map, leadership roster, ESG pillars on `/sustainability/`, or news articles.
- Pixel-perfect full-page unpublished preview (Eleventy rendering the draft).
- Automatic cleanup/deletion of unused images.
- Client-editable URLs or routes.

---

## 3. Architecture

```
/admin/          Content Studio (news + careers) — unchanged
/dashboard/      Home Editor — new

src/_data/home.json          published homepage (Eleventy source of truth)
src/_cms/home.draft.json     draft, identical schema, not in _data
src/assets/img/home/         uploaded slot files
```

Draft sits in `src/_cms/` so Eleventy’s data cascade never loads it. Schema of draft and published files is the same. The only difference is role: published vs in-progress.

```
home.json  →  home-chapters.njk  →  Home HTML
```

`scripts/admin-api.js` (Express, port 8081 / Railway) serves `/dashboard/` and `/api/home*`. Same process already serves `/admin/` and news/jobs APIs.

Production: save/publish commits via GitHub Contents API; Vercel rebuilds from `home.json` only.

---

## 4. Document schema

Root file shape (draft and published):

```json
{
  "version": 1,
  "sections": [ /* exactly 12 blocks */ ]
}
```

Every block has the same top-level shape. Unused collections are `[]` or `{}`.

```json
{
  "id": "hero",
  "visible": true,
  "order": 1,
  "content": {
    "en": {},
    "vi": {},
    "zh": {}
  },
  "images": {},
  "stats": [],
  "items": [],
  "timeline": [],
  "cta": {
    "primary": { "href": "/#about" },
    "secondary": { "href": "/#ecosystem" }
  }
}
```

Rules:

- `id` is immutable. The editor never edits it. The API rejects unknown or duplicate ids.
- There are always exactly these 12 ids, no more, no less:

  `hero`, `about`, `ecosystem`, `manufacturing`, `products`, `logistics`, `network`, `sustainability`, `leadership`, `milestones`, `news`, `contact`

- `order` is 1–12, rewritten from list position on every successful save.
- `content.*` holds text only (eyebrow, titleLine1, titleLine2, lead, body, button labels, metric labels, …). Keys used depend on block; the server schema registry defines required keys per `id`.
- `images` maps **slot name → public URL** under `/assets/img/home/…` (or existing migrated paths). Editors never type paths.
- `cta.*.href` and any other routes live in JSON but are **server-owned**. The API strips client-supplied hrefs and restores them from the published document (or from the seed map on first publish).
- `stats[]` length is fixed per block (matches current layout). Editors change `value` and labels, not cardinality.
- `items[]` is block-specific: product teasers (5, fixed ids) or partners (existing ids). Phase 1 does not add/delete these rows (would require new URLs). Reorder allowed for partners. Product card order stays as seeded.
- `timeline[]` (milestones only): add / edit / delete / reorder. Each entry:

```json
{
  "id": "m-2002",
  "year": "2002",
  "icon": "building",
  "image": "/assets/img/home/milestones-2002.webp",
  "title": { "en": "", "vi": "", "zh": "" },
  "description": { "en": "", "vi": "", "zh": "" }
}
```

New milestones get a server-generated `id`. `icon` is a closed set: `building`, `farm`, `lab`, `warehouse`, `globe`. Banner image and banner statement live on the milestones block (`images.banner`, `content.*.bannerStatement`, `stats` for banner figures).

### Locked href map (seed; never editor-writable)

| Block | Primary | Secondary / extras |
|---|---|---|
| hero | `/#about` | `/#ecosystem`; scroll `/#about` |
| ecosystem | `/about/#ecosystem` | — |
| manufacturing | `/products/` | — |
| products | `/products/` | cards: `/products/nv007/`, `/products/nv-10s/`, `/products/nv888/`, `/products/nv40/`, `/products/nv530/` |
| logistics | `/#network` | — |
| network | `/contact/?type=partner` | partner outbound URLs copied from current `partners.json` and locked per partner `id` |
| sustainability | `/sustainability/` | — |
| leadership | `/about/leadership/` | — |
| news | `/news/` | — |
| contact | `/contact/?type=partner` | `/contact/` |

### Image slots (named; upload replaces slot in **draft** JSON only)

| Block | Slots |
|---|---|
| hero | `art` (not the logo in the ring) |
| about | `media` |
| ecosystem | `background` |
| manufacturing | `media` |
| products | `nv007`, `nv-10s`, `nv888`, `nv40`, `nv530` |
| logistics | `background` |
| network | `logo` per partner id |
| sustainability | `media` |
| leadership | `media` |
| milestones | `banner` plus per-item `image` |
| news | none |
| contact | `background` |

### Read-only on Home (not in editor, still rendered)

- Ecosystem company map partial (existing `_data`).
- News cards: latest 3 from `collections.news` (Studio).
- ESG pillar cards: existing `sustainability` data (shared with `/sustainability/`).
- Hero ring logo: existing brand asset.

---

## 5. Editor UI

Three columns on desktop; stack on small screens.

**Left — 12 blocks**

- Drag to reorder, visibility toggle, click to select.
- No control to change `id`.

**Center — block form**

- Tabs VI / EN / 中文 for the same fields.
- Unused fields for that `id` are hidden.
- Image rows: slot label, thumbnail, Replace. No path input.
- Stats / product names: text (and product image slots). No URL fields.
- Milestones: nested list with add / edit / delete / reorder.

**Right — preview**

- Draft preview of the selected block using the **same CSS classes and assets** as the real homepage block (`chapter`, `hero-nv`, …). Not a separate card chrome.
- Revision + draft/published status.
- “Open live homepage” → `SITE_URL` or local `http://localhost:8125/` (published build, not draft).

Login reuses Studio credentials. After login, session token in the browser same pattern as `/admin/`.

---

## 6. Save / validate / preview / publish

```
GET /api/home
  if no draft → copy published → home.draft.json

PUT /api/home/draft     save draft (validate, revision check)
POST /api/home/publish  draft → validate → revision checks → home.json
POST /api/home/discard  draft = copy of published
```

Publish does not invent a second schema. It copies the validated draft document onto published.

Eleventy never reads the draft file.

---

## 7. API contract

All `/api/home*` routes require the existing admin auth when `ADMIN_USER`/`ADMIN_PASS` or `ADMIN_TOKEN` is set (required in production). Reuse `POST /api/login`. Unauthenticated → 401.

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/api/home` | — | `{ draft, published, draftRevision, publishedRevision, status }` |
| PUT | `/api/home/draft` | `{ document, revision }` | `{ ok, draft, draftRevision }` |
| POST | `/api/home/publish` | `{ revision, publishedRevision }` | `{ ok, publishedRevision, draftRevision }` |
| POST | `/api/home/images` | multipart `file`, `sectionId`, `slot` | `{ ok, url, sectionId, slot }` |
| POST | `/api/home/discard` | `{ revision, publishedRevision }` | same shape as GET after reset |

`status` is `"in-sync"` when draft equals published, otherwise `"draft"`.

### Validation (save and publish) — 400 + `fields[]`

- JSON parses and matches schema (`version` + `sections`).
- `sections.length === 12`; ids are the fixed set; no duplicates.
- Required text keys present and non-empty for `en`, `vi`, and `zh`.
- Image slot URLs present; file exists on disk (local) or as a GitHub contents path (production).
- `sectionId` + `slot` on upload are in the allowlist.
- Href/route fields equal the published (or seed) map. Client hrefs are ignored, not stored from input.

### Revision — 409

Revisions are **server-computed**: GitHub file SHA in production, content hash of the file locally. The client echoes them; the server compares against current files.

- Save: `revision` must equal current draft revision.
- Publish: `revision` must equal current draft **and** `publishedRevision` must equal current published.
- On mismatch: 409 with `currentRevision` / `currentPublishedRevision` and message:

  Bản Home đã được cập nhật bởi người khác.  
  Revision hiện tại: …  
  Revision của bạn: …  
  Vui lòng tải lại dữ liệu trước khi tiếp tục.

After success, the response includes the new server revisions. The editor must store those for the next write.

### Images

- jpeg / png / webp only; max 8 MB; 413 / 415 otherwise.
- Server names files `{sectionId}-{slot}-{timestamp}.{ext}` under `src/assets/img/home/` (milestone items: `{sectionId}-{itemId}-{timestamp}.{ext}`).
- Upload writes the **new file only**. It does not rewrite `home.json` or `home.draft.json` and does not delete the file still referenced by published JSON.
- Response returns `{ url }`. The client puts that URL into the in-memory slot, then `PUT /api/home/draft` persists it. Published slots keep the old file until publish.
- Phase 1: no image deletion after publish.

### Href merge

On every draft save and on publish, the server copies locked hrefs from the current published document (seed map if publishing the first time) onto the document being written. The request body is not the source of routes.

---

## 8. GitHub / local

Local (`npm run cms` / `dev:cms`): write files on disk. Eleventy `--serve` picks up `home.json` on publish.

Production (`GITHUB_TOKEN` + `GITHUB_REPO`):

- Save: commit `src/_cms/home.draft.json` and any new image blobs not yet in the repo.
- Publish: commit `src/_data/home.json` (and keep draft in sync with published after success so the next GET is in-sync).
- Vercel builds from `home.json`. Draft files in the repo do not change the public homepage.

Commit messages: `home: save draft` and `home: publish homepage`.

---

## 9. Preview renderer

A small renderer in the dashboard (not Eleventy) maps `id` → the same class names and DOM outline as `home-chapters.njk` for that block, injected with draft JSON. Load `/css/style.css` (and page CSS if needed) in the preview pane.

Acceptable gaps vs live page: no GSAP, no full-page scroll, no ecosystem map / news collection / ESG pillars widgets (show a placeholder label: “Rendered on the live page”).

---

## 10. Tests and UAT

**Automated (API / schema)**

- Missing language, wrong block count, duplicate id, unknown slot, mutated href → 400.
- Stale revision on save or publish → 409.
- No auth → 401.
- Upload: allowlisted slot; published JSON still points at the old image until publish.
- After publish, `home.json` equals the validated draft; Eleventy data key `home` contains the 12 blocks.

**UAT**

- Reorder blocks; hide one; live homepage omits it after publish.
- Edit all three languages; replace one image; save draft; live site unchanged; publish; live site updates after rebuild.
- Two sessions: second publish with old SHA → 409 and reload instruction.
- Discard restores draft from published.
- News/jobs Studio still works at `/admin/`.

---

## 11. Migration (first implementation)

1. Seed `home.json` from current `home-chapters.njk` copy/images plus homepage-only data currently in `partners.json` and `journey.js`.
2. Point `home-chapters.njk` at `home` data; remove hardcoded strings/images for those blocks.
3. Homepage must not read `partners.json` or `journey.js`. Leave those files in the repo for now (unused by Home); do not delete them in phase 1 unless nothing else imports them.
4. Copy seed to `src/_cms/home.draft.json` so the editor opens in-sync.

---

## 12. Decisions locked

1. New dashboard, not an expansion of Studio UI.
2. Phase 1 = homepage 12 blocks only; layout = reorder + visibility, not a freeform builder.
3. JSON files + existing Railway API + GitHub commit (no headless CMS, no extra database).
4. Unified schema for draft and published.
5. Text / images / visibility / order editable; URLs not editable in the UI or trusted from the client.
6. Named image slots; server-generated filenames; no delete of published-referenced files on upload.
7. Timeline is data on the milestones block.
8. Server-side revision checks; 409 on conflict.
9. In-dashboard CSS-faithful block preview; live tab shows published site.
10. `home.json` is the only source of truth for Home content listed in §1.
