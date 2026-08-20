# Locale URLs (Spec 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Emit three server-rendered public HTML documents per existing page identity (`/` VI, `/en/…` EN, `/zh/…` ZH) with URL as language authority, self-canonical on `https://namvietjscom.vn`, and no Spec 3 SEO pack.

**Architecture:** Pure helpers in `scripts/i18n/locale.js` (locale table, `localeUrl`, `localized`, `pageIdentity`, `canonicalUrl`, `flattenPairs`). Eleventy registers filters and flattened global data. Static templates paginate `[vi,en,zh]`; news/products/companies/leadership-person use one flat `{ item, locale }` dataset. Public switcher is `<a href>`. `nv-lang` must not override public documents.

**Tech Stack:** Eleventy 3, Nunjucks, Node 20 `node:test`. No new i18n plugin, no `src/en/` clones, no Jest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-20-locale-urls-design.md` (verbatim).
- Isolate from uncommitted ecosystem/CSS WIP on `main` (worktree). Do not edit ecosystem mill-line CSS/redesign files unless they are the only copy of a `span.lang` that must become `localized` — prefer locale render, not visual redesign.
- Do **not** implement hreflang, sitemap locale listing, JSON-LD, translated slugs, job-detail routes, inner-page CMS.
- Locale keys: `vi` | `en` | `zh`. Routes `/` `/en/` `/zh/`. `html[lang]`: `vi` / `en` / `zh-Hans`.
- Origin: `https://namvietjscom.vn`. Canonical = origin + locale **pathname** (no query/hash).
- `localeUrl` prefixes **locale-tree HTML page paths only**; preserves query + fragment; leaves `http(s):`, `mailto:`, `tel:`, `#…`, assets, admin, feeds, robots/sitemap, download files unchanged. Already-prefixed `/en/` `/zh/` content paths **throw**. Invalid locale **throws**. Absolute same-origin URLs are **not** rewritten by `localeUrl`.
- `localized(value, locale)`: no cross-language fallback. Required-field validation is **separate**.
- Careers: listing × 3 + `#id` only. Apply stays `tel:`.
- Tests: `node --test`. Node ≥20.
- `npm run test:cms` must stay green. Add `test:i18n` for locale unit tests; `test:i18n:site` for post-build `_site` parity (after Eleventy is wired).

## File map

| Path | Role |
|---|---|
| `scripts/i18n/locale.js` | `LOCALES`, `assertLocale`, `localeUrl`, `localized`, `pageIdentity`, `canonicalUrl`, `flattenPairs`, `isLocaleTreePath` |
| `scripts/i18n/locale.test.js` | Unit tests for helpers |
| `scripts/i18n/required.js` | Structural translation validator |
| `scripts/i18n/required.test.js` | Missing/blank required fields fail |
| `scripts/i18n/audit-absolute.test.js` | Same-origin absolute public-page links in `src/` |
| `scripts/i18n/tree-parity.test.js` | After build: VI/EN/ZH identity sets 1:1:1 + sample canonical/`html[lang]` |
| `.eleventy.js` | Filters, global flattened data, `eleventy.before` validation |
| `src/_data/site.json` | `localeDefault: "vi"`; `url` stays `https://namvietjscom.vn` |
| `src/_includes/macros/i18n.njk` | One-locale macros |
| `src/_includes/layouts/base.njk` | `html lang` + `data-lang` = **current** locale only |
| `src/_includes/partials/head.njk` | Self-canonical via `canonicalUrl` |
| `src/_includes/partials/header.njk` | Switcher `<a href>` + `localeUrl` on nav |
| `src/js/main.js` | Remove public `nv-lang` override; keep menu open/close only |
| `src/js/site.js` | Read `data-lang` as document locale (already set by HTML), do not default `"en"` against URL |
| Static `src/*.njk` | Locale pagination |
| `src/news/posts/posts.11tydata.js` | Flat `{ item, locale }` permalinks |
| `src/products/items/items.11tydata.js` | Same |
| `src/companies/company.njk` | Replace item pagination with flattened pairs |
| `src/about/leadership/person.njk` | Same |
| `src/admin/admin.js` | View-site = origin + `localeUrl(path, editorLocale)` |
| `src/dashboard/dashboard.js` | Same for homepage link |
| `vercel.json` | `trailingSlash: true` (deploy-layer 301 proof; spec allows this mechanism) |
| `package.json` | `test:i18n`, `test:i18n:site` |

### Inventory (Task 1 verifies; do not skip)

**Already paginated (flatten — do not add a second pagination axis):**

- `src/companies/company.njk` — `pagination.data: companies`, permalink `/companies/{{ company.id }}/`
- `src/about/leadership/person.njk` — `pagination.data: leadership`, permalink `/about/leadership/{{ person.id }}/`

**Permalink functions (not pagination) — add locale via flattened data or computed permalink:**

- `src/news/posts/posts.11tydata.js` — `/news/${fileSlug}/`
- `src/products/items/items.11tydata.js` — `/products/${fileSlug}/`

**Static templates (may paginate `[vi,en,zh]`):** `index.njk`, `about.njk`, `about/leadership/index.njk`, `companies/index.njk`, `products/index.njk`, `news/index.njk`, `careers.njk`, `contact.njk`, `investors.njk`, `sustainability.njk`, `downloads.njk`, `privacy.njk`, `cookies.njk`, `terms.njk`

**Not locale-tree:** `robots.njk`, `sitemap.njk`, `news/feed.njk`, `mobile-concept.njk`, admin/dashboard (ignored / passthrough)

**Public language JS:** `src/js/main.js` `setLang` + `localStorage nv-lang` default `"en"`; header `button[data-set-lang]`. Admin/dashboard use **`state.lang`**, not `nv-lang`.

**CMS view site today:** `admin.js` `publicUrl(path)` = `siteUrl + unprefixed path` (no locale prefix). `dashboard.js` `#siteLink` = `health.siteUrl` (homepage, no locale).

**Same-origin absolute page URLs:** at plan time, `src/` has `site.json.url` only — no `https://namvietjscom.vn/about/` hits. Task 1 test must keep that true.

**`html[lang]` today:** `base.njk` hardcodes `en`; `main.js` maps `zh` → `zh-CN`. Spec 2: server sets `zh-Hans`; JS must not overwrite.

**`navActive`:** compares `page.url` to unprefixed `item.href`. After locales, strip `/en` `/zh` via `pageIdentity` or nav will never highlight.

---

### Task 1: Inventory tests + same-origin audit

**Files:**
- Create: `scripts/i18n/audit-absolute.test.js`
- Create: `scripts/i18n/inventory.test.js`
- Modify: `package.json` (`test:i18n`)

**Interfaces:**
- Consumes: nothing
- Produces: green inventory/audit tests that later tasks must not regress

- [ ] **Step 1: Write failing tests**

`scripts/i18n/audit-absolute.test.js`:

```js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const SRC = path.join(ROOT, "src");
const ORIGIN = "https://namvietjscom.vn";
const PAGE = /https:\/\/namvietjscom\.vn(?:\/en|\/zh)?\/(?:about|companies|products|news|careers|contact|investors|sustainability|downloads|privacy|cookies|terms)(?:\/[^\s"'`)]*)?/gi;

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, acc);
    else if (/\.(njk|md|json|js|html)$/.test(name.name)) acc.push(p);
  }
  return acc;
}

describe("same-origin absolute public page links", () => {
  it("are absent from src (except site.json url field)", () => {
    const hits = [];
    for (const file of walk(SRC)) {
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      if (rel === "src/_data/site.json") continue;
      const text = fs.readFileSync(file, "utf8");
      const found = text.match(PAGE);
      if (found) hits.push({ rel, found });
    }
    assert.deepEqual(hits, []);
  });
});
```

`scripts/i18n/inventory.test.js`:

```js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const src = (p) => fs.readFileSync(path.resolve(__dirname, "../../src", p), "utf8");

describe("current emission inventory", () => {
  it("company and leadership person already paginate items", () => {
    assert.match(src("companies/company.njk"), /pagination:/);
    assert.match(src("about/leadership/person.njk"), /pagination:/);
  });
  it("news and products use permalink functions, not nested locale pagination yet", () => {
    assert.match(src("news/posts/posts.11tydata.js"), /permalink/);
    assert.match(src("products/items/items.11tydata.js"), /permalink/);
  });
});
```

Do **not** assert `nv-lang` or `data-set-lang` here — those go away in Task 8 and would false-fail.

- [ ] **Step 2: Run tests — inventory should PASS (documents current tree); if audit fails, convert those hrefs to root-relative in the same task before continuing**

Run: `node --test scripts/i18n/audit-absolute.test.js scripts/i18n/inventory.test.js`

Expected: both PASS if repo matches the inventory above. If audit FAIL, replace same-origin absolute **page** URLs in content with root-relative paths (`/about/`), re-run until PASS. Do not teach `localeUrl` to parse absolute URLs.

- [ ] **Step 3: Add npm script**

In `package.json` scripts:

```json
"test:i18n": "node --test scripts/i18n/locale.test.js scripts/i18n/required.test.js scripts/i18n/audit-absolute.test.js scripts/i18n/inventory.test.js"
```

(`locale.test.js` / `required.test.js` land in Tasks 2–3; until then either create empty skipped files or only list existing files in `test:i18n` and expand the script each task.)

Start with:

```json
"test:i18n": "node --test scripts/i18n/audit-absolute.test.js scripts/i18n/inventory.test.js"
```

- [ ] **Step 4: Commit**

```bash
git add scripts/i18n/audit-absolute.test.js scripts/i18n/inventory.test.js package.json
git commit -m "test: lock locale-url inventory and same-origin href audit."
```

---

### Task 2: Pure `localeUrl` / `localized` / identity

**Files:**
- Create: `scripts/i18n/locale.js`
- Create: `scripts/i18n/locale.test.js`
- Modify: `package.json` (`test:i18n` includes `locale.test.js`)

**Interfaces:**
- Consumes: nothing
- Produces:

```js
LOCALES // { vi: { prefix: "", htmlLang: "vi" }, en: { prefix: "/en", htmlLang: "en" }, zh: { prefix: "/zh", htmlLang: "zh-Hans" } }
assertLocale(locale) // throws if not vi|en|zh
htmlLang(locale) // string
localeUrl(href, locale) // string | throws
pageIdentity(pathname) // unprefixed pathname with trailing slash (except identity "/")
canonicalUrl(origin, pathname, locale) // absolute, no query/hash
localized(value, locale) // string; throws if locale invalid; returns "" if missing (validator is Task 3)
flattenPairs(items, locales?) // [{ item, locale }, ...]
isLocaleTreePath(pathname) // boolean
```

- [ ] **Step 1: Write failing tests**

```js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  LOCALES,
  localeUrl,
  localized,
  pageIdentity,
  canonicalUrl,
  flattenPairs,
  htmlLang,
} = require("./locale");

describe("localeUrl", () => {
  it("prefixes locale-tree paths and preserves query and hash", () => {
    assert.equal(localeUrl("/about/", "en"), "/en/about/");
    assert.equal(localeUrl("/about/", "vi"), "/about/");
    assert.equal(localeUrl("/products/nv007/", "zh"), "/zh/products/nv007/");
    assert.equal(localeUrl("/news/?page=2", "en"), "/en/news/?page=2");
    assert.equal(localeUrl("/careers/#prod-engineer", "en"), "/en/careers/#prod-engineer");
  });
  it("does not prefix assets, admin, feeds, files, or schemes", () => {
    assert.equal(localeUrl("/assets/img/hero.png", "en"), "/assets/img/hero.png");
    assert.equal(localeUrl("/admin/", "en"), "/admin/");
    assert.equal(localeUrl("/dashboard/", "zh"), "/dashboard/");
    assert.equal(localeUrl("/mobile-concept/", "en"), "/mobile-concept/");
    assert.equal(localeUrl("/robots.txt", "en"), "/robots.txt");
    assert.equal(localeUrl("/sitemap.xml", "en"), "/sitemap.xml");
    assert.equal(localeUrl("/news/feed.xml", "en"), "/news/feed.xml");
    assert.equal(localeUrl("/downloads/file.pdf", "en"), "/downloads/file.pdf");
    assert.equal(localeUrl("https://partner.example/", "en"), "https://partner.example/");
    assert.equal(localeUrl("https://namvietjscom.vn/about/", "en"), "https://namvietjscom.vn/about/");
    assert.equal(localeUrl("mailto:a@b.c", "vi"), "mailto:a@b.c");
    assert.equal(localeUrl("tel:+1", "zh"), "tel:+1");
    assert.equal(localeUrl("#prod-engineer", "en"), "#prod-engineer");
  });
  it("throws on already-prefixed content paths and invalid locale", () => {
    assert.throws(() => localeUrl("/en/about/", "vi"));
    assert.throws(() => localeUrl("/zh/news/foo/", "en"));
    assert.throws(() => localeUrl("/about/", "de"));
  });
});

describe("localized", () => {
  it("returns one locale and does not fall back", () => {
    assert.equal(localized({ vi: "a", en: "b", zh: "c" }, "en"), "b");
    assert.equal(localized({ vi: "a", en: "", zh: "c" }, "en"), "");
    assert.throws(() => localized({ vi: "a" }, "nope"));
  });
});

describe("identity and canonical", () => {
  it("strips locale prefix for identity", () => {
    assert.equal(pageIdentity("/en/about/"), "/about/");
    assert.equal(pageIdentity("/zh/products/nv007/"), "/products/nv007/");
    assert.equal(pageIdentity("/"), "/");
    assert.equal(pageIdentity("/en/"), "/");
  });
  it("canonical is origin + pathname only", () => {
    assert.equal(
      canonicalUrl("https://namvietjscom.vn", "/careers/#x", "en"),
      "https://namvietjscom.vn/en/careers/"
    );
    assert.equal(
      canonicalUrl("https://namvietjscom.vn", "/news/?page=2", "zh"),
      "https://namvietjscom.vn/zh/news/"
    );
    assert.equal(htmlLang("zh"), "zh-Hans");
  });
});

describe("flattenPairs", () => {
  it("is a cartesian product, not nested groups", () => {
    const items = [{ id: "nv007" }, { id: "nv888" }];
    const pairs = flattenPairs(items);
    assert.equal(pairs.length, 6);
    assert.deepEqual(
      pairs.map((p) => p.item.id + ":" + p.locale),
      ["nv007:vi", "nv007:en", "nv007:zh", "nv888:vi", "nv888:en", "nv888:zh"]
    );
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (module missing)

Run: `node --test scripts/i18n/locale.test.js`

- [ ] **Step 3: Implement `scripts/i18n/locale.js`**

Parse `href` into pathname/search/hash (use `new URL(href, "https://namvietjscom.vn")` **only** for root-relative strings; do not use that parse result to rewrite absolute http(s) — those return unchanged **before** parse-as-internal).

`isLocaleTreePath(pathname)`: true for `/` and paths under `/about`, `/companies`, `/products`, `/news` (but not `/news/feed.xml`), `/careers`, `/contact`, `/investors`, `/sustainability`, `/downloads` (not `*.pdf`/`*.docx`), `/privacy`, `/cookies`, `/terms`. False for `/admin`, `/dashboard`, `/mobile-concept`, `/assets`, `/css`, `/js`, `*.xml`, `*.txt`, typical static file extensions.

`pageIdentity`: strip a single leading `/en` or `/zh` prefix from pathname, then ensure trailing slash except keep `"/"` as `"/"` (root). `/en/` → `/`.

`canonicalUrl(origin, href, locale)`: take pathname of the **identity** (strip query/hash from href first), then `origin + localeUrl(identityPath, locale)` with no search/hash.

- [ ] **Step 4: Run tests PASS**

Run: `node --test scripts/i18n/locale.test.js`

- [ ] **Step 5: Commit**

```bash
git add scripts/i18n/locale.js scripts/i18n/locale.test.js package.json
git commit -m "feat: add localeUrl and localized helpers for Spec 2."
```

---

### Task 3: Required-translation validator

**Files:**
- Create: `scripts/i18n/required.js`
- Create: `scripts/i18n/required.test.js`

**Interfaces:**
- Consumes: `assertLocale` not required; uses `vi|en|zh`
- Produces: `assertRequiredTriad(value, { page, field })` throws `Error` whose `message` includes `page=`, `locale=`, `field=`. `validateNewsPost(data, slug)`, `validateProduct(data, slug)`, `validateJob(data, id)` using the lists below.

**Required `{vi,en,zh}` objects (structural only):**

| Source | Fields |
|---|---|
| News markdown | `title`, `category`, `excerpt`, `body` |
| Product markdown | `title`, `summary` |
| Job markdown | `title`, `department`, `location`, `type`, `summary` |

Blank = `null` / `undefined` / `""` / whitespace-only. Optional extra triad fields (if any) are **not** passed to `assertRequiredTriad`. Do not fail because EN equals VI (Editorial gate).

- [ ] **Step 1: Failing tests**

```js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { validateNewsPost } = require("./required");

describe("validateNewsPost", () => {
  const ok = {
    title: { vi: "a", en: "b", zh: "c" },
    category: { vi: "a", en: "b", zh: "c" },
    excerpt: { vi: "a", en: "b", zh: "c" },
    body: { vi: "a", en: "b", zh: "c" },
  };
  it("accepts complete triads including copy-pasted VI", () => {
    validateNewsPost({ ...ok, title: { vi: "a", en: "a", zh: "a" } }, "slug");
  });
  it("fails blank zh with page identity and field", () => {
    assert.throws(
      () => validateNewsPost({ ...ok, body: { vi: "a", en: "b", zh: "  " } }, "hoi-thao"),
      /page=\/news\/hoi-thao\/[\s\S]*locale=zh[\s\S]*field=body/
    );
  });
});
```

- [ ] **Step 2: Run FAIL** → **Step 3: implement** → **Step 4: PASS**

`validateNewsPost` page identity is `/news/${slug}/`.

- [ ] **Step 5: Commit**

```bash
git add scripts/i18n/required.js scripts/i18n/required.test.js package.json
git commit -m "feat: fail Eleventy data when required locale copy is blank."
```

---

### Task 4: Wire Eleventy filters + `eleventy.before` validation

**Files:**
- Modify: `.eleventy.js`
- Modify: `src/_data/site.json` (`localeDefault` → `"vi"`; keep `"locales": ["vi","en","zh"]` order with `vi` first if used)

**Interfaces:**
- Consumes: `localeUrl`, `localized`, `pageIdentity`, `canonicalUrl`, `htmlLang`, `flattenPairs`, `LOCALES` from `scripts/i18n/locale.js`; validators from `required.js`
- Produces: Nunjucks filters `localeUrl`, `localized`, `pageIdentity`, `canonicalUrl`, `htmlLang`; global `locales = ["vi","en","zh"]`; `eleventy.before` reads news/products/jobs markdown via existing globs and calls validators (throw → build fail)

- [ ] **Step 1: Write a failing unit test that `require("../.eleventy.js")` is unnecessary — instead test validators on a fixture file in `required.test.js`:** `validateNewsPost` on a cloned object with empty `zh.title` already in Task 3. This task adds `eleventyConfig.addFilter("localeUrl", (href, locale) => localeUrl(href, locale))` etc.

Also add globalData:

```js
const { flattenPairs } = require("./scripts/i18n/locale");
// companyLocales / leadershipPersonLocales added in Task 5 when those templates switch
```

- [ ] **Step 2: In `eleventy.before`, glob `src/news/posts/*.md`, parse with `gray-matter`, `validateNewsPost(data, slug)`. Same for products and jobs. If current content has a blank required field, **fix the content blank** (do not weaken the validator). Copy-pasted VI is allowed.

- [ ] **Step 3: `npx @11ty/eleventy --quiet` still builds (templates not yet locale-paginated). Filters unused is OK.

- [ ] **Step 4: Commit**

```bash
git add .eleventy.js src/_data/site.json scripts/i18n/required.js
git commit -m "feat: register locale filters and require complete news/product/job triads."
```

---

### Task 5: Flatten company + leadership person (no nested pagination)

**Files:**
- Modify: `.eleventy.js` — `addGlobalData("companyLocales", …)` and `leadershipPersonLocales`
- Modify: `src/companies/company.njk`
- Modify: `src/about/leadership/person.njk`

**Interfaces:**
- Consumes: `flattenPairs(items)`
- Produces: permalinks `/companies/{id}/` × 3 and `/about/leadership/{id}/` × 3

Company template change (pattern for person too):

```yaml
pagination:
  data: companyLocales
  size: 1
  alias: render
permalink: "{{ localeUrl('/companies/' + render.item.id + '/', render.locale) }}"
eleventyComputed:
  locale: "{{ render.locale }}"
```

In the body, `company` becomes `render.item`. Set `locale` on the page so layouts can read `locale` or `render.locale`.

Build `companyLocales` in `.eleventy.js` from existing `src/_data` companies array × `flattenPairs`.

- [ ] **Step 1:** After change, `npx @11ty/eleventy --quiet` and assert files exist: `_site/companies/<id>/index.html`, `_site/en/companies/<id>/index.html`, `_site/zh/companies/<id>/index.html` (pick one real id from data).

- [ ] **Step 2: Commit**

```bash
git add .eleventy.js src/companies/company.njk src/about/leadership/person.njk
git commit -m "feat: emit company and leadership person pages per locale."
```

---

### Task 6: News + product permalinks via flatten

**Files:**
- Modify: `.eleventy.js` — collections still glob markdown once; add `newsLocales` / `productLocales` as flatten of collection items **or** change 11tydata permalink to a function of `locale` using pagination on a computed list
- Modify: `src/news/posts/posts.11tydata.js`
- Modify: `src/products/items/items.11tydata.js`

**Do not** paginate the markdown collection and also paginate locales.

Recommended: directory data pagination:

```js
// posts.11tydata.js
module.exports = {
  layout: "layouts/article.njk",
  tags: "news",
  pagination: {
    data: "newsLocales",
    size: 1,
    alias: "render",
  },
  permalink: (data) => {
    const { localeUrl } = require("../../../scripts/i18n/locale");
    const slug = data.render.item.fileSlug;
    return localeUrl(`/news/${slug}/`, data.render.locale);
  },
};
```

If Eleventy forbids requiring from 11tydata, set permalink in Nunjucks front matter / `eleventyComputed.permalink` using the filter.

`newsLocales` global: `flattenPairs` of `getFilteredByGlob("src/news/posts/*.md")` mapped to `{ fileSlug, data }`.

**Avoid processing each `.md` three times as three independent Eleventy inputs** if that triples markdown parsing with nested pagination. Prefer **one** pagination dataset of pairs and a **single** template (`article.njk` via directory data on a dummy? ). Practical Eleventy 3 approach: keep one `article.njk` layout; use `eleventyConfig.addTemplate` only if needed.

Simpler approach that matches A′: add `src/news/post-locale.njk`:

```njk
---
pagination:
  data: newsLocales
  size: 1
  alias: render
permalink: "{{ localeUrl('/news/' + render.item.fileSlug + '/', render.locale) }}"
layout: layouts/article.njk
---
```

and **exclude** `src/news/posts/*.md` from writing their own permalink output (`permalink: false` in `posts.11tydata.js`) while keeping them in `collections.news` for lists.

- [ ] **Step 1:** Implement exclusion + `post-locale.njk` / `product-locale.njk` (or equivalent). Verify `_site/news/<slug>/index.html` and `_site/en/news/<slug>/index.html` exist. List pages still use `collections.news` **once** (unique slugs), not 3× duplicates — filter collection by `locale === 'vi'` or use original glob collection (unprefixed items only).

**Collection pitfall:** if markdown files still emit pages, you get duplicates. `permalink: false` on the md files.

- [ ] **Step 2: Commit**

```bash
git add src/news src/products .eleventy.js
git commit -m "feat: emit news and product pages per locale without nested pagination."
```

---

### Task 7: Static pages, macros, header, head, base

**Files:**
- Modify: `src/_includes/macros/i18n.njk`
- Modify: `src/_includes/layouts/base.njk`
- Modify: `src/_includes/partials/head.njk`
- Modify: `src/_includes/partials/header.njk`
- Modify: `src/_includes/partials/footer.njk`
- Modify: every static page in the inventory to paginate `locales`
- Modify: remaining `span.lang` in `_includes/home-blocks/*.njk`, inner layouts, cards
- Modify: `.eleventy.js` `navActive` to compare `pageIdentity(pageUrl)` to unprefixed hrefs

**Macros (one locale, `locale` in page data):**

```njk
{% macro inline(obj) -%}
{{ obj[locale] }}
{%- endmacro %}
```

Layouts must `{% set locale = locale or render.locale or "vi" %}`.

**base.njk:**

```html
<html lang="{{ locale | htmlLang }}" data-lang="{{ locale }}">
```

`data-lang` matches the document locale for **existing CSS typography**. Do not emit three sibling `.lang` copies.

**head.njk canonical:**

```njk
<link rel="canonical" href="{{ canonicalUrl(site.url, page.url, locale) }}">
```

Use the filter that drops query/hash. `og:url` same as canonical.

**header switcher:** replace the three `button[data-set-lang]` with:

```html
<a href="{{ localeUrl(pageIdentity(page.url), 'vi') }}" hreflang="vi" lang="vi">VI</a>
<a href="{{ localeUrl(pageIdentity(page.url), 'en') }}" hreflang="en" lang="en">EN</a>
<a href="{{ localeUrl(pageIdentity(page.url), 'zh') }}" hreflang="zh-Hans" lang="zh-Hans">中文</a>
```

(hreflang attributes on the switcher links are **link metadata**, not Spec 3 head `hreflang` alternate tags. If you want zero Spec 3 overlap, omit `hreflang` attributes and keep visible labels only.)

**Nav/CTA hrefs:** `href="{{ itemHref | localeUrl(locale) | url }}"`.

**Static pagination example (`about.njk`):**

```yaml
pagination:
  data: locales
  size: 1
  alias: locale
permalink: "{{ localeUrl('/about/', locale) }}"
```

Home `permalink: "{{ localeUrl('/', locale) }}"` with the same pagination.

- [ ] **Step 1:** Grep gate: `rg "span class=\"lang" src/_includes src/*.njk src/**/*.njk` should be empty for **public** templates (admin/dashboard may keep editor tabs).

- [ ] **Step 2: `npx @11ty/eleventy --quiet`** succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/_includes src/*.njk src/about src/companies src/products src/news .eleventy.js
git commit -m "feat: render one locale per document and real language switcher links."
```

---

### Task 8: Public JS, CMS view-site, trailing slash, tree parity

**Files:**
- Modify: `src/js/main.js`
- Modify: `src/js/site.js` (default `data-lang` fallback: use `html.getAttribute("lang")` mapped back, or `data-lang`; **do not** default `"en"` when `lang="vi"`)
- Modify: `src/admin/admin.js` `publicUrl` / `#siteLink` / news “view”
- Modify: `src/dashboard/dashboard.js` `#siteLink`
- Modify: `vercel.json` add `"trailingSlash": true`
- Create: `scripts/i18n/tree-parity.test.js`
- Modify: `package.json` `test:i18n:site`

**Public JS:** Delete `localStorage.setItem("nv-lang")` and `setLang(localStorage.getItem("nv-lang") || "en")`. Keep dropdown open/close if the toggle remains a button wrapping links. **Do not** set `html.lang` from JS (server already set `zh-Hans`). Do not map `zh` → `zh-CN`.

**CMS:** Reuse the same `localeUrl` via a tiny copied function in admin JS **or** a shared `src/admin/locale-url.js` built from the same rules (no Eleventy). Editor locale = `state.lang` (`vi|en|zh`); invalid → `"vi"`. View site:

```js
function viewSite(path) {
  const origin = (state.siteUrl || "").replace(/\/$/, "");
  const prefixed = localeUrl(path, state.lang === "en" || state.lang === "zh" ? state.lang : "vi");
  if (!origin) return prefixed;
  return origin + prefixed;
}
```

Dashboard homepage: `viewSite("/")`.

**tree-parity.test.js:** spawn `npx @11ty/eleventy --quiet` (or require `_site` already built). Scan `_site/**/index.html` paths; ignore `admin`, `dashboard`, `mobile-concept`. Map file path to identity:

- `_site/index.html` → `/`
- `_site/en/index.html` → `/`
- `_site/about/index.html` → `/about/`
- `_site/en/about/index.html` → `/about/`

Assert VI, EN, ZH identity sets equal. Read one EN about HTML: `html[lang]="en"`, canonical `https://namvietjscom.vn/en/about/`, does not contain three sibling `class="lang en"` + `class="lang vi"` + `class="lang zh"` for the same string. ZH sample: `lang="zh-Hans"`. News sample slug × 3. Asset path `/assets/` still at `_site/assets` not `_site/en/assets`.

Add npm:

```json
"test:i18n:site": "node --test scripts/i18n/tree-parity.test.js"
```

Parity test should run Eleventy first in the test file (`execFileSync` `npx` `@11ty/eleventy`).

- [ ] **Step 1: Write tree-parity test (FAIL until templates done — this task assumes Task 7 merged).**

- [ ] **Step 2: JS + CMS + vercel.json**

- [ ] **Step 3:** `npm run test:i18n` && `npm run test:i18n:site` && `npm run test:cms` && `npx @11ty/eleventy --quiet`

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/js/main.js src/js/site.js src/admin/admin.js src/dashboard/dashboard.js vercel.json scripts/i18n/tree-parity.test.js package.json
git commit -m "feat: drop public nv-lang override and verify locale-tree parity."
```

---

## Self-review (plan vs spec)

| Spec | Task |
|---|---|
| A′ flatten, no nested pagination | 5, 6 |
| `localeUrl` tree-only, query/hash preserve, absolute http unchanged | 2 |
| Same-origin absolute audit | 1 |
| `localized` vs required validator | 2, 3 |
| `html[lang]` zh-Hans | 2, 7 |
| Canonical pathname only | 2, 7, 8 |
| Full tree 1:1:1 | 8 |
| No `nv-lang` override | 8 |
| CMS view site editor locale | 8 |
| Trailing slash 301 | 8 `vercel.json` |
| Careers listing only | 7 (do not add job templates) |
| No Spec 3 hreflang/sitemap/JSON-LD | omitted |
| No ecosystem/CSS WIP | Global constraint |
| Editorial gate | human; not automated |

No placeholders left in helper APIs. Template conversion in Task 7 is grep-gated rather than pasting every Nunjucks file.
