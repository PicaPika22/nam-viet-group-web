# Child spec 2 — Locale URLs

Date: 2026-08-20  
Status: approved for implementation planning  
Parent: [System completion program](2026-08-20-system-completion-program-design.md)  
Depends on: [Child spec 1 — Production lock](2026-08-20-production-lock-design.md) (done on the publishing CMS)  
Site: Nam Viet Group Eleventy 3 public site

Emit **three server-rendered HTML documents** per existing public page identity. `/` is Vietnamese. Language is the **URL**. Switcher is real navigation. Each document **self-canonicalizes** on the frozen apex origin. **No** hreflang, sitemap, JSON-LD, inner-page CMS, job-detail routes, or ecosystem/CSS WIP.

---

## 1. Goal and success

1. Every **existing** public HTML page identity exists at `{path}` (VI), `/en{path}` (EN), `/zh{path}` (ZH), trailing slash. `path` starts with `/` (example: `/about/` → `/en/about/`).
2. Each document’s **visible public copy** is that locale only. Crawlers do not need `data-lang` / CSS to pick a language.
3. Language switcher `href`s are server-rendered equivalent locale URLs for the **same page identity**. Clicking them loads that HTML. `html[lang]` / `span.lang` toggling on the same URL does **not** satisfy this spec.
4. Self-canonical is the absolute URL on `https://namvietjsc.vn` for that locale pathname (no query, no hash). `/en/about/` does **not** canonical to `/about/`.
5. Content JSON/markdown keeps **locale-agnostic** paths. Prefixing is render-only.
6. `npm run build` fails if a required translatable field is missing or blank. Editorial sign-off of real VI / EN / ZH copy is a **hard merge gate**.

Success is **not** Spec 3 SEO pack, translated slugs, or new page types.

---

## 2. Locked decisions

| Topic | Choice |
|---|---|
| Production canonical origin | `https://namvietjsc.vn` (apex). `SITE_URL`, `CORS_ORIGIN`, and `site.json.url` must be this origin. `www.namvietjsc.vn` and `*.vercel.app` are **non-canonical** |
| Public language authority | **URL only.** `/` always VI; `/en/…` always EN; `/zh/…` always ZH. `localStorage nv-lang`, `data-lang`, and client swap must not override public documents. No redirect from `nv-lang` or `Accept-Language` |
| Locale keys | Internal: `vi`, `en`, `zh`. Routes: `/`, `/en/`, `/zh/` |
| `html[lang]` | `vi` → `vi`; `en` → `en`; `zh` → `zh-Hans`. Do not emit `/zh-Hans/` paths. Spec 3 reuses this map for `hreflang` |
| Architecture | **A′:** one source template per page type. One render instance per `(page identity, locale)`. No `src/en/` / `src/zh/` clones |
| Static pages | May paginate `[vi, en, zh]` |
| Detail collections | Flattened `{ item, locale }` dataset. **No nested pagination.** Only collections that **already** own a public HTML identity |
| `localeUrl(path, locale)` | Prefix **locale-tree HTML page paths** only. Preserve query + fragment. Absolute `http(s):` unchanged (treated external). See §5 |
| `localized(value, locale)` | Select that locale. **No cross-language fallback.** Does not decide which fields are required |
| Required translations | Separate **validator**. Missing/blank required `{vi,en,zh}` copy → build fail. Optional localized fields may be empty if the page type allows |
| Locale-agnostic fields | slug, id, image path, phone, email, dates, and other non-copy fields do **not** need three copies |
| Trailing slash | Canonical form has `/`. No-slash variant **301** to slash. Both must never return 200. Mechanism is deploy/routing; not locked to Vercel vs generated artifacts |
| Unprefixed migration | Existing unprefixed paths are **reassigned to Vietnamese**. **No** general 301 `/about/` → `/en/about/` |
| Careers | Listing only: `/careers/` × 3. Cards keep `#id`. Apply stays `tel:`. **No** `/careers/{slug}/` |
| Admin surfaces | `/admin/`, `/dashboard/` stay unprefixed. Editor UI locale is **not** public `nv-lang` |
| Canonical | Frozen origin + canonical locale **pathname** only |

**Locale table**

```
vi  prefix ""     htmlLang vi
en  prefix "/en"  htmlLang en
zh  prefix "/zh"  htmlLang zh-Hans
```

---

## 3. Public locale tree

**In (every current public HTML identity × 3 locales):**

| Identity (unprefixed) | Notes |
|---|---|
| `/` | Home |
| `/about/` | |
| `/about/leadership/` | List page |
| `/about/leadership/{id}/` | Person detail **already exists** — flatten `{ person, locale }` |
| `/companies/` | |
| `/companies/{id}/` | Company detail already exists |
| `/products/` | |
| `/products/{id}/` | Product detail already exists (`fileSlug`) |
| `/news/` | |
| `/news/{slug}/` | Article already exists |
| `/careers/` | Listing only |
| `/contact/` | |
| `/investors/` | |
| `/sustainability/` | |
| `/downloads/` | HTML page, not the PDF/DOCX files |
| `/privacy/` | Legal — still three locales |
| `/cookies/` | Legal — still three locales |
| `/terms/` | Legal — still three locales |

**Out of the locale tree (do not prefix):**

- `/admin/`, `/dashboard/`, `/mobile-concept/`
- `robots.txt`, `sitemap.xml`, `news/feed.xml`
- Assets (`/assets/…`, `/css/…`, `/js/…`, images) and downloadable files (PDF/DOCX)

Spec 2 does **not** invent identities (no job-detail routes). After build, VI / EN / ZH identity sets must be **1:1:1** (full tree parity).

---

## 4. Emission (A′)

One Nunjucks (or markdown+layout) source per page type.

**Static identities** (`/about/`, `/careers/`, `/privacy/`, …): paginate locales `[vi, en, zh]`.

**Existing detail identities** (news slug, product id, company id, leadership person id): a **flat** dataset of `{ item, locale }` pairs — not paginate-items then paginate-locales.

Example product dataset:

```
{ item: nv007, locale: "vi" } → /products/nv007/
{ item: nv007, locale: "en" } → /en/products/nv007/
{ item: nv007, locale: "zh" } → /zh/products/nv007/
```

Content continues to store `/products/nv007/`, never `/en/products/nv007/`.

---

## 5. `localeUrl(path, locale)`

Prefixes **only** internal public HTML paths that belong to the locale tree.

| Input | Result |
|---|---|
| `/about/` + `en` | `/en/about/` |
| `/products/nv007/` + `zh` | `/zh/products/nv007/` |
| `/about/` + `vi` | `/about/` |
| `https://…`, `http://…` | unchanged |
| `mailto:`, `tel:` | unchanged |
| `#prod-engineer` | unchanged (fragment only) |
| `/careers/#prod-engineer` + `en` | `/en/careers/#prod-engineer` (prefix locale-tree path; keep fragment) |
| `/news/?page=2` + `en` | `/en/news/?page=2` (prefix pathname; keep query) |
| `/assets/…`, `/css/…`, `/js/…` | unchanged |
| `/downloads/file.pdf` | unchanged |
| `/robots.txt`, `/sitemap.xml`, `/news/feed.xml` | unchanged |
| `/admin/`, `/dashboard/`, `/mobile-concept/` | unchanged |

**Not** “prefix every string that starts with `/`”.

For a **locale-tree HTML page URL**, `localeUrl` prefixes the **pathname** and preserves **query + fragment** unchanged.

Navigation URL → keep `?query` and `#fragment`.  
Canonical URL (§7) → pathname only (drop query and hash).

Absolute `http:` / `https:` values are **unchanged**. `localeUrl` does **not** parse same-origin absolute URLs into locale paths. Internal public navigation must be stored **root-relative**. Implementation planning **audits** content for same-origin absolute public-page links (`https://namvietjsc.vn/about/` and equivalents) and converts any hits to the root-relative content-path contract before relying on `localeUrl`.

If called with a content path that **already** contains an `/en/` or `/zh/` prefix, **fail the build/dev** — do not silently no-op. Content contract is unprefixed.

`locale` other than `vi` \| `en` \| `zh` → build/dev error. No silent default to `en` or `vi`.

---

## 6. Copy selection vs required fields

**`localized(value, locale)`** (name may differ in code): returns `value[locale]` for public HTML. No fallback to another locale. Primary copy in the document is **one** language. Public HTML must not ship three sibling language copies of the same string for CSS/`data-lang` to hide.

This helper does **not** know which fields are required.

**Required-localized validation** (separate, or an explicit `{ required: true }` option — API not locked): for each locale-tree page and each **required** translatable field, `vi` / `en` / `zh` must be present and non-blank after trim. Failure → **Eleventy build fails** with page identity, locale, and field name. No incomplete locale HTML is emitted.

Optional `{vi,en,zh}` fields may be empty when the page type allows. That must not fail the whole build.

Locale-agnostic fields are out of this validator.

**Editorial gate (not build):** copy-pasted VI into EN/ZH can pass structure and still **block merge** until Editorial signs real translations for the **entire** locale tree (not home only).

---

## 7. Document chrome

- `<html lang="…">` from the locale table (`zh` → `zh-Hans`).
- Self-canonical: `https://namvietjsc.vn` + locale pathname (trailing slash). Exclude query and fragment. `/en/careers/#prod-engineer` canonicalizes to `https://namvietjsc.vn/en/careers/`.
- Canonical must **not** follow the request Host (`www` or `*.vercel.app`). Those hosts are non-canonical; Ops should redirect them to apex. If redirect infra is outside this spec’s code, that is **Ops acceptance**, not a reason to emit host-relative canonicals.
- Switcher: three server-rendered `<a href>` from **page identity** + `localeUrl`, not `window.location` string hacks.

Public `main.js` must not call `setLang(localStorage.getItem("nv-lang") …)` to change the public document. Delete public read/write of `nv-lang` **unless** a listed non-public consumer still needs it. Admin/dashboard may keep their **own** UI language state; it must not change public URL semantics.

---

## 8. CMS “view site”

Home Editor locked hrefs stay unprefixed in JSON.

Studio/Dashboard “view site” (or equivalent): `frozen origin` + `localeUrl(unprefixedPath, editorLocale)`.

- Editor locale is the CMS UI locale (`vi` / `en` / `zh`), **not** public `nv-lang` / public `localStorage`.
- Invalid editor locale → normalize CMS UI state to the configured default, then build the link. Do not emit an invalid URL. A VI fallback here is **CMS convenience** only; it does not change public language authority.

`/admin/` and `/dashboard/` are not in the locale tree and are not in the public sitemap (sitemap listing is Spec 3).

---

## 9. Errors, migration, rollback

**Build/dev fail (no silent normalize):**

- Required translatable missing, null, undefined, `""`, or whitespace-only — include page identity, locale, field.
- `locale` not in `{vi,en,zh}`.
- Content page path that should be internal but is not root-relative; path that already has `/en/` or `/zh/`; identity collision (two identities emit the same permalink).
- Two render instances overwrite the same output path. `/en/`, `/zh/`, `/admin/`, `/dashboard/` must not be occupied by a content identity they do not own.

**Legacy English-at-unprefixed:** `/about/` becomes Vietnamese 200. It **cannot** also 301 to `/en/about/`. Only **non-reused** legacy paths (if any exist) may get a separate redirect table. Do not invent `/about/` → `/en/about/`.

**Trailing slash:** no-slash → 301 slash. Prove the deploy layer before merge/go-live; implementation not locked here.

**Before go-live:** if build, tests, or Editorial fail → do not merge. Production URL tree unchanged.

**After go-live:** `/en/…` and `/zh/…` are a **URL contract**. Application rollback must not 404 shipped locale URLs; keep serving or compatibility redirects. Do not change URLs ad-hoc. Keep VI paths stable when possible.

---

## 10. Testing

Automated tests for route generation and locale-link transformation. Spot-checks **supplement** full-tree parity; they do not replace it. No new browser E2E framework.

| Invariant | Test |
|---|---|
| 3 locale roots | `/`, `/en/`, `/zh/` |
| Static nested | `/about/` × 3 |
| Dynamic detail | representative news, product, company, leadership person × 3 |
| Full tree parity | every VI identity has matching EN and ZH (scan `_site`) |
| `html[lang]` | `vi`, `en`, `zh-Hans` |
| Switcher | 3 server-rendered equivalent hrefs |
| Internal page links | prefix locale-tree paths only; preserve `?query` and `#fragment` |
| Asset / download / admin / external | not prefixed |
| Already-prefixed content path | reject / build error |
| `localized` | one locale, no fallback |
| Required blank | build fail |
| Canonical | absolute, self, no query/hash; EN/ZH canonicals do not point at VI |
| Primary copy | generated page does not contain three sibling language copies for that copy |
| Public language JS | `nv-lang` does not override URL |
| Complete data | `npm run build` green |

---

## 11. Out of scope

- hreflang, `x-default`, locale sitemaps, Organization JSON-LD, social/analytics SEO pack (**Spec 3**). **Self-canonical is Spec 2** because it ships with the URL tree.
- Accept-Language detection; storage-driven public redirect.
- Translated slugs or locale-specific ids.
- New page identities; job-detail routes; inner-page CMS; schema expansion for companies/products/about/leadership.
- `src/en/` or `src/zh/` template trees.
- Ecosystem mill-line redesign / uncommitted CSS WIP.
- Visual redesign of header/footer/switcher (switcher **behavior** is in scope; look-and-feel is not).
- New browser E2E framework; service-worker i18n; machine translation.

---

## 12. Definition of done

Every existing public HTML page identity × `vi`/`en`/`zh` → three server-rendered documents → correct `html[lang]` → one locale copy → real switcher hrefs → correctly prefixed page links (not assets/admin) → self-canonical on apex → trailing-slash URL contract → no storage language override → no cross-language fallback → full locale-tree parity → `npm run build` green → Editorial three-language sign-off.

---

## 13. What this file is not

Spec approved. Next: implementation plan **only** for Spec 2, then code. Spec 3 waits. Work stays isolated from uncommitted ecosystem/CSS WIP on `main`.
