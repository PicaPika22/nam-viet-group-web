# Home Editor Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an independent `/dashboard/` Home Editor so editors can reorder, hide, and edit copy/images of the 12 homepage blocks via draft/publish, while `/admin/` news+jobs Studio stays unchanged.

**Architecture:** Homepage copy and images live in `src/_data/home.json` (published) and `src/_cms/home.draft.json` (same schema). `home-chapters.njk` only renders that JSON. Express `scripts/admin-api.js` mounts `/api/home*` and static `/dashboard/`. Validation, href locking, and revision checks live in `scripts/home-cms/` so they can be unit-tested without spinning the full server. Production still commits through the existing GitHub Contents helpers.

**Tech Stack:** Eleventy 3, Nunjucks, Express 5, Node 20 `node:test`, multer (already in package.json). No new CMS vendor. No database.

## Global Constraints

- Homepage source of truth is `src/_data/home.json` only; draft is `src/_cms/home.draft.json` with the **same schema**.
- Root shape: `{ "version": 1, "sections": [ /* exactly 12 */ ] }`.
- Fixed ids (immutable): `hero`, `about`, `ecosystem`, `manufacturing`, `products`, `logistics`, `network`, `sustainability`, `leadership`, `milestones`, `news`, `contact`.
- Editor may change text, image slots, visibility, order, and milestone timeline rows. URLs/routes are server-owned; never persist client hrefs.
- Image upload: jpeg/png/webp, max 8 MB, server-generated filename, do not delete files referenced by published JSON.
- Revisions are server-computed (local sha256 or GitHub SHA). Stale write → 409.
- `/admin/` Content Studio remains for news and careers. Do not fold those into the dashboard.
- Do not edit header/footer, inner pages, ecosystem map data, leadership roster, or ESG pillars on `/sustainability/`.
- Auth: reuse existing `POST /api/login` and `ADMIN_USER`/`ADMIN_PASS`/`ADMIN_TOKEN`. All `/api/home*` go through the existing `/api` auth middleware.
- Eleventy must ignore `src/dashboard/**` and `src/_cms/**`. Vercel must not passthrough the dashboard (same as admin).
- Tests run with `node --test` (Node ≥20). Do not add Jest.

## File map

| Path | Role |
|---|---|
| `scripts/home-cms/schema.js` | Ids, content keys, slots, locked hrefs, `validateHome`, `mergeLockedHrefs`, `applyOrder`, `documentsEqual`, `newMilestoneId` |
| `scripts/home-cms/schema.test.js` | Schema/href/order tests |
| `scripts/home-cms/store.js` | Local (and GitHub-backed) read/write draft+published, revision hashes |
| `scripts/home-cms/store.test.js` | Draft copy-on-missing, revision mismatch, publish copy |
| `scripts/home-cms/routes.js` | Express handlers: GET/PUT draft, POST publish/discard/images |
| `scripts/home-cms/routes.test.js` | HTTP tests via a tiny Express app (no GitHub) |
| `scripts/home-cms/seed.js` | Builds the first `home.json` from current homepage copy + `partners.json` + `journey.js` |
| `scripts/admin-api.js` | `require("./home-cms/routes").mount(app, deps)` + static `/dashboard` |
| `src/_data/home.json` | Published homepage document |
| `src/_cms/home.draft.json` | Draft (copy of published at seed time) |
| `src/_includes/home-chapters.njk` | Loop visible sections; include per-id partials |
| `src/_includes/home-blocks/*.njk` | One partial per block id, bound to `section` |
| `src/dashboard/index.html` | Home Editor UI |
| `src/dashboard/dashboard.css` | Editor chrome |
| `src/dashboard/dashboard.js` | Login, API, list, form, timeline, save/publish |
| `src/dashboard/preview.js` | CSS-faithful block preview |
| `.eleventy.js` | Ignore dashboard + `_cms`; passthrough dashboard when not `VERCEL` |
| `package.json` | `"test:cms": "node --test scripts/home-cms"` |
| `src/admin/README.md` | Add Home Editor section (do not rewrite Studio docs) |

---

### Task 1: Home document schema

**Files:**
- Create: `scripts/home-cms/schema.js`
- Create: `scripts/home-cms/schema.test.js`
- Modify: `package.json` (add `test:cms` script)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `LANGS = ["en","vi","zh"]`
  - `SECTION_IDS` (array of 12 strings)
  - `CONTENT_KEYS` (object id → string[])
  - `IMAGE_SLOTS` (object id → string[])
  - `STAT_COUNTS` (object id → number)
  - `LOCKED_HREFS` (canonical href map)
  - `PARTNER_IDS` (array)
  - `PRODUCT_IDS = ["nv007","nv-10s","nv888","nv40","nv530"]`
  - `FLOW_COUNT = 8`, `CHECK_COUNT = 4`
  - `validateHome(doc, { published }?) → { ok, fields: [{ path, message }] }`
  - `mergeLockedHrefs(doc, publishedDoc) → doc` (mutates a copy, returns new object)
  - `applyOrder(doc) → doc` (sets `order` 1..n from array index)
  - `documentsEqual(a, b) → boolean` (stable JSON stringify)
  - `newMilestoneId() → string` (`m-` + timestamp + 4 random chars)
  - `isAllowedUpload(sectionId, slot) → boolean`
  - `minimalValidDocument() → object` (test fixture with required keys filled `"x"`)

- [ ] **Step 1: Add the test script**

In `package.json` `scripts`:

```json
"test:cms": "node --test scripts/home-cms"
```

- [ ] **Step 2: Write the failing tests**

Create `scripts/home-cms/schema.test.js`:

```javascript
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  SECTION_IDS,
  validateHome,
  mergeLockedHrefs,
  applyOrder,
  documentsEqual,
  minimalValidDocument,
  LOCKED_HREFS,
} = require("./schema");

describe("validateHome", () => {
  it("accepts a minimal valid document", () => {
    const r = validateHome(minimalValidDocument());
    assert.equal(r.ok, true);
    assert.equal(r.fields.length, 0);
  });

  it("rejects wrong section count", () => {
    const doc = minimalValidDocument();
    doc.sections.pop();
    const r = validateHome(doc);
    assert.equal(r.ok, false);
    assert.ok(r.fields.some((f) => f.path === "sections"));
  });

  it("rejects duplicate ids", () => {
    const doc = minimalValidDocument();
    doc.sections[1].id = "hero";
    const r = validateHome(doc);
    assert.equal(r.ok, false);
  });

  it("rejects missing language copy", () => {
    const doc = minimalValidDocument();
    doc.sections[0].content.vi.eyebrow = "";
    const r = validateHome(doc);
    assert.equal(r.ok, false);
    assert.ok(r.fields.some((f) => f.path.includes("hero") && f.path.includes("vi")));
  });

  it("rejects unknown image slot on upload allowlist", () => {
    const { isAllowedUpload } = require("./schema");
    assert.equal(isAllowedUpload("hero", "art"), true);
    assert.equal(isAllowedUpload("hero", "logo"), false);
    assert.equal(isAllowedUpload("news", "art"), false);
  });
});

describe("mergeLockedHrefs", () => {
  it("overwrites client hrefs with canonical map", () => {
    const doc = minimalValidDocument();
    doc.sections[0].cta.primary.href = "https://evil.example";
    const published = minimalValidDocument();
    const merged = mergeLockedHrefs(doc, published);
    const hero = merged.sections.find((s) => s.id === "hero");
    assert.equal(hero.cta.primary.href, LOCKED_HREFS.hero.primary);
    assert.equal(hero.cta.secondary.href, LOCKED_HREFS.hero.secondary);
    assert.equal(hero.cta.scroll.href, LOCKED_HREFS.hero.scroll);
  });

  it("does not persist mutated product hrefs", () => {
    const doc = minimalValidDocument();
    const products = doc.sections.find((s) => s.id === "products");
    products.items[0].href = "/hacked/";
    const merged = mergeLockedHrefs(doc, minimalValidDocument());
    const item = merged.sections.find((s) => s.id === "products").items[0];
    assert.equal(item.href, "/products/nv007/");
  });
});

describe("applyOrder", () => {
  it("rewrites order 1..12 from array position", () => {
    const doc = minimalValidDocument();
    const hero = doc.sections.find((s) => s.id === "hero");
    const about = doc.sections.find((s) => s.id === "about");
    doc.sections = [about, ...doc.sections.filter((s) => s.id !== "about" && s.id !== "hero"), hero];
    const ordered = applyOrder(doc);
    assert.equal(ordered.sections[0].id, "about");
    assert.equal(ordered.sections[0].order, 1);
    assert.equal(ordered.sections[11].id, "hero");
    assert.equal(ordered.sections[11].order, 12);
  });
});

describe("documentsEqual", () => {
  it("treats key order as equal", () => {
    const a = { version: 1, sections: [] };
    const b = { sections: [], version: 1 };
    assert.equal(documentsEqual(a, b), true);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test:cms`

Expected: FAIL with `Cannot find module './schema'` (or missing exports).

- [ ] **Step 4: Write `scripts/home-cms/schema.js`**

```javascript
const crypto = require("crypto");

const LANGS = ["en", "vi", "zh"];
const SECTION_IDS = [
  "hero",
  "about",
  "ecosystem",
  "manufacturing",
  "products",
  "logistics",
  "network",
  "sustainability",
  "leadership",
  "milestones",
  "news",
  "contact",
];

const CONTENT_KEYS = {
  hero: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary", "ctaSecondary", "scroll"],
  about: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "body"],
  ecosystem: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  manufacturing: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  products: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  logistics: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  network: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  sustainability: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  leadership: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "body", "ctaPrimary"],
  milestones: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "bannerStatement"],
  news: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  contact: ["chapterLabel", "titleLine1", "titleLine2", "lead", "ctaPrimary", "ctaSecondary"],
};

const IMAGE_SLOTS = {
  hero: ["art"],
  about: ["media"],
  ecosystem: ["background"],
  manufacturing: ["media"],
  products: ["nv007", "nv-10s", "nv888", "nv40", "nv530"],
  logistics: ["background"],
  network: [],
  sustainability: ["media"],
  leadership: ["media"],
  milestones: ["banner"],
  news: [],
  contact: ["background"],
};

const STAT_COUNTS = {
  hero: 2,
  about: 4,
  manufacturing: 4,
  logistics: 3,
  milestones: 4,
};

const PRODUCT_IDS = ["nv007", "nv-10s", "nv888", "nv40", "nv530"];
const PRODUCT_HREFS = {
  nv007: "/products/nv007/",
  "nv-10s": "/products/nv-10s/",
  nv888: "/products/nv888/",
  nv40: "/products/nv40/",
  nv530: "/products/nv530/",
};
const PARTNER_IDS = [
  "van-aarsen",
  "bunge",
  "wilmar",
  "ajinomoto",
  "anderson",
  "andritz",
  "cargill",
  "cj",
  "olmix",
];
const PARTNER_URLS = {
  "van-aarsen": "https://www.vanaarsen.com/",
  bunge: "https://www.bunge.com/",
  wilmar: "https://www.wilmar-international.com/",
  ajinomoto: "https://www.ajinomoto.com/",
  anderson: "https://www.andersonintl.com/",
  andritz: "https://www.andritz.com/",
  cargill: "https://www.cargill.com/",
  cj: "https://www.cj.net/",
  olmix: "https://www.olmix.com/",
};
const FLOW_COUNT = 8;
const CHECK_COUNT = 4;
const TIMELINE_ICONS = ["building", "farm", "lab", "warehouse", "globe"];

const LOCKED_HREFS = {
  hero: { primary: "/#about", secondary: "/#ecosystem", scroll: "/#about" },
  ecosystem: { primary: "/about/#ecosystem" },
  manufacturing: { primary: "/products/" },
  products: { primary: "/products/" },
  logistics: { primary: "/#network" },
  network: { primary: "/contact/?type=partner" },
  sustainability: { primary: "/sustainability/" },
  leadership: { primary: "/about/leadership/" },
  news: { primary: "/news/" },
  contact: { primary: "/contact/?type=partner", secondary: "/contact/" },
};

function emptyI18n(value = "x") {
  return { en: value, vi: value, zh: value };
}

function emptySection(id) {
  const content = { en: {}, vi: {}, zh: {} };
  for (const key of CONTENT_KEYS[id]) {
    for (const lang of LANGS) content[lang][key] = "x";
  }
  const images = {};
  for (const slot of IMAGE_SLOTS[id]) images[slot] = `/assets/img/home/${id}-${slot}.jpg`;
  const cta = {};
  const hrefs = LOCKED_HREFS[id] || {};
  if (hrefs.primary) cta.primary = { href: hrefs.primary };
  if (hrefs.secondary) cta.secondary = { href: hrefs.secondary };
  if (hrefs.scroll) cta.scroll = { href: hrefs.scroll };
  const stats = [];
  const n = STAT_COUNTS[id] || 0;
  for (let i = 0; i < n; i++) {
    stats.push({
      id: `s${i + 1}`,
      value: "1",
      suffix: "",
      count: 1,
      decimals: 0,
      icon: "",
      label: emptyI18n("x"),
    });
  }
  let items = [];
  if (id === "ecosystem") {
    items = Array.from({ length: FLOW_COUNT }, (_, i) => ({
      id: `flow-${i + 1}`,
      label: emptyI18n("x"),
    }));
  }
  if (id === "manufacturing") {
    items = Array.from({ length: CHECK_COUNT }, (_, i) => ({
      id: `check-${i + 1}`,
      label: emptyI18n("x"),
    }));
  }
  if (id === "products") {
    items = PRODUCT_IDS.map((pid) => ({
      id: pid,
      code: pid.toUpperCase(),
      href: PRODUCT_HREFS[pid],
      name: emptyI18n("x"),
    }));
  }
  if (id === "network") {
    items = PARTNER_IDS.map((pid) => ({
      id: pid,
      name: pid,
      url: PARTNER_URLS[pid],
      image: `/assets/img/partners/${pid}.png`,
    }));
  }
  const timeline =
    id === "milestones"
      ? [
          {
            id: "m-seed",
            year: "2002",
            icon: "building",
            image: "/assets/img/milestones/2002.jpg",
            title: emptyI18n("x"),
            description: emptyI18n("x"),
          },
        ]
      : [];
  return {
    id,
    visible: true,
    order: SECTION_IDS.indexOf(id) + 1,
    content,
    images,
    stats,
    items,
    timeline,
    cta,
  };
}

function minimalValidDocument() {
  return {
    version: 1,
    sections: SECTION_IDS.map(emptySection),
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

function documentsEqual(a, b) {
  return stableStringify(a) === stableStringify(b);
}

function applyOrder(doc) {
  const next = clone(doc);
  next.sections.forEach((s, i) => {
    s.order = i + 1;
  });
  return next;
}

function mergeLockedHrefs(doc, _publishedDoc) {
  const next = clone(doc);
  for (const section of next.sections) {
    const hrefs = LOCKED_HREFS[section.id] || {};
    section.cta = section.cta || {};
    if (hrefs.primary) section.cta.primary = { href: hrefs.primary };
    if (hrefs.secondary) section.cta.secondary = { href: hrefs.secondary };
    if (hrefs.scroll) section.cta.scroll = { href: hrefs.scroll };
    if (section.id === "products") {
      for (const item of section.items || []) {
        if (PRODUCT_HREFS[item.id]) item.href = PRODUCT_HREFS[item.id];
      }
    }
    if (section.id === "network") {
      for (const item of section.items || []) {
        if (PARTNER_URLS[item.id]) item.url = PARTNER_URLS[item.id];
      }
    }
  }
  return next;
}

function field(path, message, fields) {
  fields.push({ path, message });
}

function nonEmpty(value) {
  return String(value || "").trim().length > 0;
}

function validateHome(doc) {
  const fields = [];
  if (!doc || typeof doc !== "object") {
    return { ok: false, fields: [{ path: "", message: "Document required" }] };
  }
  if (doc.version !== 1) field("version", "version must be 1", fields);
  if (!Array.isArray(doc.sections) || doc.sections.length !== 12) {
    field("sections", "Must contain exactly 12 sections", fields);
    return { ok: false, fields };
  }
  const seen = new Set();
  for (const id of SECTION_IDS) {
    const section = doc.sections.find((s) => s.id === id);
    if (!section) field("sections", `Missing section ${id}`, fields);
  }
  for (const section of doc.sections) {
    if (!SECTION_IDS.includes(section.id)) field(`sections.${section.id}`, "Unknown id", fields);
    if (seen.has(section.id)) field(`sections.${section.id}`, "Duplicate id", fields);
    seen.add(section.id);
    if (typeof section.visible !== "boolean") field(`${section.id}.visible`, "visible must be boolean", fields);
    const keys = CONTENT_KEYS[section.id] || [];
    for (const lang of LANGS) {
      for (const key of keys) {
        if (!nonEmpty(section.content?.[lang]?.[key])) {
          field(`${section.id}.content.${lang}.${key}`, "Required", fields);
        }
      }
    }
    for (const slot of IMAGE_SLOTS[section.id] || []) {
      const url = section.images?.[slot];
      if (!nonEmpty(url) || !String(url).startsWith("/assets/img/")) {
        field(`${section.id}.images.${slot}`, "Image slot required", fields);
      }
    }
    const wantStats = STAT_COUNTS[section.id] || 0;
    if ((section.stats || []).length !== wantStats) {
      field(`${section.id}.stats`, `Must have ${wantStats} stats`, fields);
    }
    for (const stat of section.stats || []) {
      for (const lang of LANGS) {
        if (!nonEmpty(stat.label?.[lang])) field(`${section.id}.stats.${stat.id}.${lang}`, "Required", fields);
      }
    }
    if (section.id === "ecosystem" && (section.items || []).length !== FLOW_COUNT) {
      field("ecosystem.items", `Must have ${FLOW_COUNT} flow steps`, fields);
    }
    if (section.id === "manufacturing" && (section.items || []).length !== CHECK_COUNT) {
      field("manufacturing.items", `Must have ${CHECK_COUNT} checks`, fields);
    }
    if (section.id === "products") {
      const ids = (section.items || []).map((i) => i.id);
      if (ids.join() !== PRODUCT_IDS.join()) field("products.items", "Product ids/order are fixed", fields);
    }
    if (section.id === "network") {
      const ids = new Set((section.items || []).map((i) => i.id));
      for (const pid of PARTNER_IDS) {
        if (!ids.has(pid)) field("network.items", `Missing partner ${pid}`, fields);
      }
      if ((section.items || []).length !== PARTNER_IDS.length) {
        field("network.items", "Cannot add or delete partners in phase 1", fields);
      }
    }
    if (section.id === "milestones") {
      for (const row of section.timeline || []) {
        if (!nonEmpty(row.id) || !nonEmpty(row.year)) field(`milestones.timeline.${row.id}`, "id and year required", fields);
        if (row.icon && !TIMELINE_ICONS.includes(row.icon)) {
          field(`milestones.timeline.${row.id}.icon`, "Invalid icon", fields);
        }
        for (const lang of LANGS) {
          if (!nonEmpty(row.title?.[lang]) || !nonEmpty(row.description?.[lang])) {
            field(`milestones.timeline.${row.id}.${lang}`, "title and description required", fields);
          }
        }
        if (!nonEmpty(row.image) || !String(row.image).startsWith("/assets/img/")) {
          field(`milestones.timeline.${row.id}.image`, "Image required", fields);
        }
      }
    }
  }
  return { ok: fields.length === 0, fields };
}

function isAllowedUpload(sectionId, slot) {
  if (sectionId === "milestones" && String(slot).startsWith("timeline:")) return true;
  if (sectionId === "network" && String(slot).startsWith("partner:")) {
    return PARTNER_IDS.includes(slot.slice("partner:".length));
  }
  return (IMAGE_SLOTS[sectionId] || []).includes(slot);
}

function newMilestoneId() {
  return `m-${Date.now().toString(36)}-${crypto.randomBytes(2).toString("hex")}`;
}

module.exports = {
  LANGS,
  SECTION_IDS,
  CONTENT_KEYS,
  IMAGE_SLOTS,
  STAT_COUNTS,
  PRODUCT_IDS,
  PRODUCT_HREFS,
  PARTNER_IDS,
  PARTNER_URLS,
  FLOW_COUNT,
  CHECK_COUNT,
  TIMELINE_ICONS,
  LOCKED_HREFS,
  validateHome,
  mergeLockedHrefs,
  applyOrder,
  documentsEqual,
  minimalValidDocument,
  isAllowedUpload,
  newMilestoneId,
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:cms`

Expected: PASS, all `schema.test.js` tests ok.

- [ ] **Step 6: Commit**

```bash
git add package.json scripts/home-cms/schema.js scripts/home-cms/schema.test.js
git commit -m "Add Home CMS schema validation and locked href merge."
```

---

### Task 2: Draft/published file store

**Files:**
- Create: `scripts/home-cms/store.js`
- Create: `scripts/home-cms/store.test.js`

**Interfaces:**
- Consumes: `validateHome`, `mergeLockedHrefs`, `applyOrder`, `documentsEqual` from `./schema`
- Produces:
  - `createStore({ rootDir, fsImpl, cryptoImpl })`
  - `store.getState() → { draft, published, draftRevision, publishedRevision, status }`
  - `store.saveDraft(document, revision) → state or throws HttpError`
  - `store.publish(revision, publishedRevision) → state`
  - `store.discard(revision, publishedRevision) → state`
  - `store.writeImage({ sectionId, slot, buffer, ext }) → { url, relPath }`
  - `class HttpError extends Error { status, body }`

Paths relative to repo `rootDir`:

- published: `src/_data/home.json`
- draft: `src/_cms/home.draft.json`
- images: `src/assets/img/home/`

Local revision = sha256 hex of file bytes (utf8 JSON with trailing newline). If draft file is missing, `getState` copies published → draft before hashing.

- [ ] **Step 1: Write failing tests**

Create `scripts/home-cms/store.test.js` using `fs.mkdtempSync` under `os.tmpdir()`. Seed both JSON files from `minimalValidDocument()`. Assert:

1. `getState()` creates draft when only published exists; `status === "in-sync"`.
2. `saveDraft` with wrong revision throws `HttpError` status 409; body has `currentRevision`.
3. `saveDraft` with matching revision writes draft; published bytes unchanged; `status === "draft"` after changing `visible`.
4. `publish` copies draft onto published; both revisions change; `status === "in-sync"`.
5. Client `cta.primary.href` of `"https://evil"` is stored as canonical `/#about`.
6. `writeImage` returns `/assets/img/home/hero-art-<digits>.webp` and does not modify JSON files.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/home-cms/store.test.js`

Expected: FAIL `Cannot find module './store'`.

- [ ] **Step 3: Implement `scripts/home-cms/store.js`**

Implementation notes (must match tests):

```javascript
class HttpError extends Error {
  constructor(status, body) {
    super(body.message || "Error");
    this.status = status;
    this.body = body;
  }
}

function hashBytes(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function writeJson(filePath, doc) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + "\n", "utf8");
}
```

`saveDraft`:

1. Read current draft revision; if `revision !== current` throw 409 with Vietnamese message from the spec.
2. `doc = applyOrder(mergeLockedHrefs(document, published))`.
3. `validateHome(doc)`; if not ok throw 400 `{ error: "Invalid document", fields }`.
4. Write draft JSON; return `getState()`.

`publish`:

1. Check draft revision and published revision; either mismatch → 409.
2. Validate current draft (already on disk).
3. Write published = draft (same object).
4. Return `getState()` (`in-sync`).

`writeImage`:

- Allowlist via `isAllowedUpload`.
- `ext` in `.jpg/.jpeg/.png/.webp` else 415.
- Filename `${sectionId}-${slot.replace(/:/g, "-")}-${Date.now()}${ext}`.
- Write buffer only. Do not touch JSON.

409 body:

```javascript
{
  error: "conflict",
  message: "Bản Home đã được cập nhật bởi người khác.",
  currentRevision,
  currentPublishedRevision,
  yourRevision: revision,
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/home-cms/store.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/home-cms/store.js scripts/home-cms/store.test.js
git commit -m "Add Home CMS draft and publish file store with revision checks."
```

---

### Task 3: Seed `home.json` from current homepage

**Files:**
- Create: `scripts/home-cms/seed.js`
- Create: `src/_data/home.json`
- Create: `src/_cms/home.draft.json`
- Create: `src/assets/img/home/.gitkeep`
- Test: extend `schema.test.js` with `it("seed document validates", …)`

**Interfaces:**
- Consumes: `validateHome` from schema; `src/_data/partners.json`; `src/_data/journey.js`
- Produces: `buildSeedDocument() → home document` that passes `validateHome`

- [ ] **Step 1: Write failing test**

Add to `schema.test.js`:

```javascript
it("seed document validates", () => {
  const { buildSeedDocument } = require("./seed");
  const r = validateHome(buildSeedDocument());
  assert.equal(r.ok, true, JSON.stringify(r.fields, null, 2));
});
```

- [ ] **Step 2: Run to verify fail**

Run: `node --test scripts/home-cms/schema.test.js`

Expected: FAIL missing `./seed`.

- [ ] **Step 3: Implement `scripts/home-cms/seed.js`**

`buildSeedDocument()` must copy **current live strings and image paths** from `src/_includes/home-chapters.njk` (do not invent new marketing copy). Use existing public paths (do not copy binary files into `img/home/` yet):

- hero `images.art`: `/assets/img/hero-chuan/rect-02.png`
- about `images.media`: `/assets/img/about.png`
- ecosystem `images.background`: `/assets/img/ecosystem.png`
- manufacturing `images.media`: `/assets/img/manufacturing.png`
- products images: `/assets/img/products/nv007.jpg` (and `nv-10s.jpg`, `nv888.jpg`, `nv40.jpg`, `nv530.jpg`)
- logistics `images.background`: `/assets/img/logistics.png`
- network items: `id`, `name`, `url`, `image` from `require("../../src/_data/partners.json")`
- sustainability `images.media`: `/assets/img/sustainability.png`
- leadership `images.media`: `/assets/img/leadership.jpg`
- milestones timeline: each `journey.items[]` → `{ id: "m-"+year, year, icon, image: "/assets/img/milestones/"+file, title: {en,vi,zh}, description: {en,vi,zh} }` from `en.title` / `en.text` etc.
- milestones `images.banner`: `/assets/img/milestones/` + `journey.banner.file`
- milestones `content.*.lead` = `journey.intro`
- milestones `content.*.bannerStatement` = `journey.banner.statement`
- milestones `stats` = banner stats (`value`, `icon`, `label` i18n)
- contact `images.background`: `/assets/img/cta.png`

Fill every `CONTENT_KEYS` field from the matching Nunjucks spans. Stats:

- hero: values `300.000+` / `40+ha` with labels from the template (no `data-count` on hero).
- about: `count` 20, 10, 186, 542 with suffixes `+`, ``, `+`, `B+`.
- manufacturing: 12+, 1.2M (decimals 1), 100%, text `ISO · GMP · HACCP` (`value` can be that string; `count` null).
- logistics: 20+, 500+, 100%.

Ecosystem `items` = 8 flow names from the template. Manufacturing `items` = 4 check labels. Product `name` + `code` from the five cards.

`chapterLabel` values are the current `data-label-*` attributes (e.g. hero EN `INTRO`).

- [ ] **Step 4: Write JSON files**

At the bottom of `seed.js` (or a tiny `scripts/home-cms/write-seed.js` run once):

```javascript
if (require.main === module) {
  const fs = require("fs");
  const path = require("path");
  const doc = buildSeedDocument();
  const json = JSON.stringify(doc, null, 2) + "\n";
  const root = path.resolve(__dirname, "../..");
  fs.mkdirSync(path.join(root, "src/_cms"), { recursive: true });
  fs.mkdirSync(path.join(root, "src/assets/img/home"), { recursive: true });
  fs.writeFileSync(path.join(root, "src/_data/home.json"), json);
  fs.writeFileSync(path.join(root, "src/_cms/home.draft.json"), json);
}
```

Run: `node scripts/home-cms/seed.js`

- [ ] **Step 5: Run tests**

Run: `npm run test:cms`

Expected: PASS including `seed document validates`.

- [ ] **Step 6: Commit**

```bash
git add scripts/home-cms/seed.js src/_data/home.json src/_cms/home.draft.json src/assets/img/home/.gitkeep
git commit -m "Seed homepage JSON from current chapter copy and media paths."
```

---

### Task 4: Render Home from `home.json`

**Files:**
- Create: `src/_includes/home-blocks/hero.njk` (and the other 11 ids)
- Modify: `src/_includes/home-chapters.njk` — replace the 12 hardcoded sections with a loop
- Modify: `.eleventy.js` — ignore `_cms` and `dashboard`

**Interfaces:**
- Consumes: Eleventy data key `home` from `src/_data/home.json` (`home.sections`)
- Produces: same visual homepage; hidden sections omitted; `chapter__num` is 1-based index among **visible** sections (zero-padded 2 digits)

Do **not** read `partners` or `journey` in these templates. Keep `{% include "partials/ecosystem-map.njk" %}` inside the ecosystem block. Keep the news `{% for post in collections.news %}` loop (first 3). Keep ESG `{% for pillar in sustainability.pillars %}`.

- [ ] **Step 1: Ignore CMS folders**

In `.eleventy.js` after the admin ignore:

```javascript
eleventyConfig.ignores.add("src/_cms/**");
eleventyConfig.ignores.add("src/dashboard/**");
if (!process.env.VERCEL) {
  eleventyConfig.addPassthroughCopy({ "src/dashboard": "dashboard" });
}
```

Keep the existing `src/admin` passthrough as-is (merge with the dashboard one, do not duplicate the `if (!process.env.VERCEL)` block awkwardly — one `if` that copies both admin and dashboard).

- [ ] **Step 2: Replace `home-chapters.njk` with a loop**

Use the `visibleHome` filter (do not increment a Nunjucks `{% set %}` inside `for` — it is unreliable). Add to `.eleventy.js`:

```javascript
eleventyConfig.addFilter("visibleHome", (home) => {
  const sections = (home && home.sections) || [];
  let n = 0;
  return sections
    .filter((s) => s && s.visible)
    .map((s) => {
      n += 1;
      return { ...s, displayNum: String(n).padStart(2, "0") };
    });
});
```

Then:

```njk
{% for section in home | visibleHome %}
  {% include "home-blocks/" + section.id + ".njk" %}
{% endfor %}
```

- [ ] **Step 3: Port each block partial**

Each `src/_includes/home-blocks/<id>.njk` is the current markup for that section from `home-chapters.njk` with these substitutions (example for copy and images):

```njk
<span class="lang en">{{ section.content.en.eyebrow }}</span>
<span class="lang vi">{{ section.content.vi.eyebrow }}</span>
<span class="lang zh">{{ section.content.zh.eyebrow }}</span>
```

```njk
<img src="{{ section.images.art | url }}" alt="" width="1672" height="941" fetchpriority="high" decoding="async">
```

```njk
<a href="{{ section.cta.primary.href | url }}" class="btn ...">
```

```njk
<span class="chapter__num reveal">{{ section.displayNum }}</span>
```

Hero ring logo stays hardcoded: `{{ '/assets/img/logo.png' | url }}`.

Stats: bind `stat.value` / `data-count="{{ stat.count }}"` when `stat.count` is a number; `stat.suffix`; labels from `stat.label.en|vi|zh`.

Products: `{% for item in section.items %}` — `section.images[item.id]`, `item.code`, `item.name.*`, `item.href`.

Network: `{% for partner in section.items %}` twice for the marquee (same as today). `partner.image`, `partner.url`, `partner.name`.

Milestones: `{% for item in section.timeline %}` replacing `journey.items`. Banner from `section.images.banner` and `section.content.*.bannerStatement`. Icons still branch on `item.icon` (same SVG markup as now).

News: header from `section`; cards still `collections.news`.

Contact: `section.images.background`, titles, two CTAs from `section.cta`.

- [ ] **Step 4: Verify the homepage still builds**

Run: `npx @11ty/eleventy --quiet`

Expected: exit 0. Spot-check `_site/index.html` contains `Feeding Growth` (from JSON) and does **not** contain a leftover hardcoded `journey.intro` reference. Grep `home-chapters.njk` and `home-blocks` for `partners` and `journey` — no matches.

- [ ] **Step 5: Commit**

```bash
git add .eleventy.js src/_includes/home-chapters.njk src/_includes/home-blocks
git commit -m "Render homepage chapters from home.json instead of hardcoded copy."
```

---

### Task 5: HTTP API for Home CMS

**Files:**
- Create: `scripts/home-cms/routes.js`
- Create: `scripts/home-cms/routes.test.js`
- Modify: `scripts/admin-api.js`

**Interfaces:**
- Consumes: `createStore`, `HttpError`, `isAllowedUpload` 
- Produces: `mountHomeRoutes(app, { store, upload })` registering:

| Method | Path |
|---|---|
| GET | `/api/home` |
| PUT | `/api/home/draft` |
| POST | `/api/home/publish` |
| POST | `/api/home/discard` |
| POST | `/api/home/images` |

JSON bodies as in the spec. `GET` calls `store.ensureDraft()` / `getState()`. Errors: `HttpError.status` → `res.status(err.status).json(err.body)`; unknown → 500.

Upload: reuse the existing multer instance pattern (memory, 8 MB, `image/*`) but **reject gif/svg** in the Home handler (415 unless jpeg/png/webp). Field names: `file`, `sectionId`, `slot`.

GitHub mode (production): `createStore` in admin-api should use a GitHub-backed implementation **or** wrap local writes with the existing `ghPutFile` / `ghPutBinary` / `ghGetFile`. Minimum for this task: local store wired in `admin-api.js`. If `REMOTE` is true, after each successful local-equivalent write, commit:

- draft save → `src/_cms/home.draft.json` message `home: save draft` (use SHA from `ghGetFile`)
- publish → `src/_data/home.json` **and** draft file (same contents) message `home: publish homepage`
- image → `src/assets/img/home/<filename>`

If GitHub SHA mismatch, map to 409 (do not overwrite). Pass GitHub file SHA through as `draftRevision`/`publishedRevision` when `REMOTE` so the editor’s revision matches Contents API.

- [ ] **Step 1: Write HTTP tests**

`routes.test.js` creates Express + json parser, `createStore` on a temp dir with a seeded published file, `mountHomeRoutes`, then `http`/`fetch` against `app.listen(0)`:

1. GET `/api/home` → 200, 12 sections, `draftRevision` string.
2. PUT draft with bad revision → 409.
3. PUT draft toggling `hero.visible` with good revision → 200; published file still has `visible: true`.
4. POST publish with good pair of revisions → published `hero.visible` false.
5. POST images with `sectionId=hero&slot=bogus` → 400.
6. PUT draft whose `cta.primary.href` is evil → saved draft href is `/#about`.

Do not assert 401 here (auth is global middleware already on `/api`).

- [ ] **Step 2: Run tests to verify fail**

Run: `node --test scripts/home-cms/routes.test.js`

Expected: FAIL missing `./routes`.

- [ ] **Step 3: Implement `routes.js` + mount in `admin-api.js`**

In `admin-api.js` after news/careers routes (keep those intact):

```javascript
const { createStore } = require("./home-cms/store");
const { mountHomeRoutes } = require("./home-cms/routes");

const homeStore = createStore({
  rootDir: ROOT,
  remote: REMOTE,
  ghGetFile,
  ghPutFile,
  ghPutBinary,
});
mountHomeRoutes(app, { store: homeStore, upload });
```

Serve dashboard **without** changing `/` → `/admin/`:

```javascript
const DASHBOARD_DIR = path.join(ROOT, "src/dashboard");
if (fs.existsSync(DASHBOARD_DIR)) {
  app.use("/dashboard", express.static(DASHBOARD_DIR, { index: "index.html" }));
}
```

Add `src/assets/img/home` to `ensureDirs()`.

- [ ] **Step 4: Run tests**

Run: `npm run test:cms`

Expected: all PASS. Manual: `node scripts/admin-api.js` then `curl http://127.0.0.1:8081/api/home` (may 401 if `.env` has auth — that is correct).

- [ ] **Step 5: Commit**

```bash
git add scripts/home-cms/routes.js scripts/home-cms/routes.test.js scripts/admin-api.js
git commit -m "Mount Home CMS draft, publish, and image upload API."
```

---

### Task 6: Dashboard UI (list, form, timeline, preview)

**Files:**
- Create: `src/dashboard/index.html`
- Create: `src/dashboard/dashboard.css`
- Create: `src/dashboard/dashboard.js`
- Create: `src/dashboard/preview.js`

**Interfaces:**
- Consumes: `/api/login`, `/api/home*`, `AUTH_KEY` can be `nv_studio_auth` (same as Studio) so one login works for both apps
- Produces: three-column editor described in the spec

Copy API base detection from `src/admin/admin.js` (`meta[name="admin-api"]`, port 8125 → `http://127.0.0.1:8081/api`).

- [ ] **Step 1: `index.html` shell**

- `robots` noindex
- Login gate (same fields as Studio, Vietnamese copy “Nam Viet Home”)
- App shell: left `#blockList`, center `#blockForm`, right `#previewPane`
- Buttons: Lưu nháp, Xuất bản, Hủy nháp (discard), “Mở trang chủ”
- Lang tabs VI / EN / 中文
- Status: `status` + short revision
- `<link rel="stylesheet" href="/css/style.css">` **and** `dashboard.css` so preview can reuse chapter classes
- `<meta name="admin-api" content="">`

- [ ] **Step 2: `dashboard.js` behavior**

State: `{ auth, draft, published, draftRevision, publishedRevision, status, selectedId, lang, dirty }`.

- Load GET `/api/home` after login. Select first section.
- Left list: 12 rows, drag handle using HTML5 DnD (`draggable="true"`), checkbox/switch for `visible`, click selects. **No input for `id`.**
- On drop: splice `draft.sections`, set `dirty`.
- Center: render fields from `CONTENT_KEYS[id]` for `state.lang`. Image rows from `IMAGE_SLOTS[id]` plus partner rows (`slot = partner:<id>`) and timeline image slots (`timeline:<itemId>`). File input `accept="image/jpeg,image/png,image/webp"`. On file chosen: POST `/api/home/images` with FormData, then set URL on the in-memory document (do not PUT draft until user clicks Lưu nháp).
- Stats: value + 3 labels; do not add/remove rows.
- Products: code + 3 names + image slot; no href field.
- Timeline (milestones only): add (client assigns temporary id `m-new-…`, server `newMilestoneId` is applied on save — or client calls no extra API; store/saveDraft should assign ids if `id` starts with `m-new-` **in `saveDraft`**). Safer: assign `newMilestoneId()` in the client by fetching nothing — generate with `m-` + `Date.now()`. Schema accepts any non-empty id. Delete + reorder list.
- Lưu nháp → PUT `{ document: draft, revision: draftRevision }`. On 409 show the spec message and GET reload. On 400 show `fields[]` next to inputs (`data-path`).
- Xuất bản → POST `{ revision, publishedRevision }`.
- Discard → POST `{ revision, publishedRevision }` then replace state.
- “Mở trang chủ” → `state.siteUrl` from `/api/health` `siteUrl`, else `http://localhost:8125/`.

Do not send a separate href field in the form. Leave `cta` objects untouched in memory except labels in `content.*`.

- [ ] **Step 3: `preview.js`**

`renderPreview(section)` returns an HTML string using the **same classes** as the live block (`chapter`, `hero-nv`, `chapter__title`, `about__grid`, …). Escape all text. Use `section.content.vi` for the preview language unless `state.lang` is set — preview follows the active lang tab.

Placeholders (plain `<p class="preview-widget">Rendered on the live page</p>`) for: ecosystem map, news cards, ESG pillars.

Load images via `section.images.*` and timeline `item.image`.

Inject into `#previewMount` inside a container with class `home-preview` that scales (`transform: scale(0.42); transform-origin: top left; width: 240%;`) so the real CSS layout fits the right column.

- [ ] **Step 4: `dashboard.css`**

Independent from Studio, but use brand tokens: `--green-900: #155134`, `--paper: #fbfaf7`, Inter/Fraunces if already on the page via `style.css`. Three columns: `grid-template-columns: 260px 1fr 380px`. Stack below 960px. Do not restyle the public homepage classes except inside `.home-preview` overflow/scale.

- [ ] **Step 5: Manual check**

Run: `$env:NODE_OPTIONS='--max-old-space-size=4096'; npm run dev:cms`

Open `http://127.0.0.1:8081/dashboard/` (or via 8125 `/dashboard/` if Eleventy passthrough is on). Login if prompted. Hide Contact, save draft, confirm `http://localhost:8125/` still shows Contact. Publish, refresh homepage — Contact gone. Restore visible, publish again.

- [ ] **Step 6: Commit**

```bash
git add src/dashboard .eleventy.js
git commit -m "Add independent Home Editor dashboard with draft preview."
```

---

### Task 7: Docs and UAT gate

**Files:**
- Modify: `src/admin/README.md` (add a “Home Editor” section at the top or after Local)
- Modify: `docs/superpowers/specs/2026-08-20-home-dashboard-design.md` only if a path drifted (keep spec accurate)

- [ ] **Step 1: Document URLs**

Add:

```markdown
## Home Editor (homepage blocks)

- Local: http://127.0.0.1:8081/dashboard/ (or http://localhost:8125/dashboard/ with `npm run dev:cms`)
- Studio (news/jobs): /admin/ — unchanged
- Draft file: `src/_cms/home.draft.json` (not used by Eleventy)
- Published: `src/_data/home.json`
```

State clearly: Lưu nháp does not change the public site; Xuất bản writes `home.json` and triggers rebuild.

- [ ] **Step 2: UAT checklist (tick in the PR / chat, not a new product feature)**

1. Reorder two blocks, publish, homepage order matches.
2. Hide a block, publish, omitted from HTML.
3. Edit VI/EN/ZH of hero title, publish, all three `.lang` spans update.
4. Replace about image, save draft — live still old image; publish — new image.
5. Add a milestone, publish, timeline has the new card.
6. Two tabs: second publish with old revision → 409 + reload copy.
7. Discard restores draft to published.
8. `/admin/` news create still works.
9. `npm run test:cms` green.
10. `npx @11ty/eleventy --quiet` green.

- [ ] **Step 3: Commit**

```bash
git add src/admin/README.md
git commit -m "Document the Home Editor dashboard next to Content Studio."
```

---

## Self-review vs spec

| Spec section | Task |
|---|---|
| `/dashboard/` independent of `/admin/` | 6, 5 |
| `home.json` + `home.draft.json` same schema | 1, 2, 3 |
| Draft outside `_data` | 2, 3, 4 |
| 12 fixed ids, order, visible | 1, 6 |
| Text/images/timeline; hrefs locked | 1, 2, 6 |
| Image slots, no delete on upload | 2, 5, 6 |
| Save → validate → preview → publish | 2, 5, 6 |
| Server revision 409 | 2, 5 |
| CSS-faithful preview | 6 |
| GitHub commit messages | 5 |
| Seed from current copy; stop reading partners/journey on Home | 3, 4 |
| Tests: 400/409, upload isolation | 1, 2, 5 |
| News cards / map / ESG pillars / hero logo untouched | 4, 6 placeholders |

Href mutation: persist canonical via `mergeLockedHrefs` (never store client hrefs). Do not 400 solely because the client sent a bogus href field.

No image cleanup task (explicitly out of scope).
