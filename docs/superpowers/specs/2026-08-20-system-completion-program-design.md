# System completion program (lock + locales)

Date: 2026-08-20  
Status: approved (program charter). Next: child spec 1 — Production lock.  
Site: Nam Viet Group Eleventy 3 (VI / EN / 中文)

Thin **program charter**. Departments sign requirements and sequence here. Detailed design lives in **child specs**, written and implemented one at a time. This file does not specify Eleventy i18n plugins, login UI, environment-variable names for mode detection, or JSON-LD field lists.

Related (not this program):

- [Home Editor dashboard](2026-08-20-home-dashboard-design.md) — done (homepage CMS).
- [Home ecosystem redesign](2026-08-20-home-ecosystem-redesign.md) — separate visual spec for `#ecosystem` only.

---

## 1. Goal and success

Ship a **production-safe** public site and CMS, with **crawlable** Vietnamese, English, and Chinese URLs. Inner-page CMS (companies, products, leadership, about) stays **out**.

The program is done when all of the following are true:

1. Production or explicitly configured remote CMS **requires admin authentication**. A missing or incomplete GitHub publishing configuration must **never** fall back to unauthenticated local mode. CORS wildcards are forbidden.
2. The public site has **one** production origin: **Vercel**. GitHub Pages is **not** a production publishing surface.
3. Every page in the public locale tree exists at `/…` (Vietnamese), `/en/…`, and `/zh/…` as **three server-rendered documents**. The language switcher **navigates** to the equivalent locale URL (normal request, not `history.pushState` / `data-lang` DOM swap). Each URL is **self-canonical**. `hreflang` and sitemaps list those URLs on the canonical host.
4. Homepage HTML includes Organization JSON-LD with **no empty or placeholder `sameAs`**. Social profiles are real or omitted from rendered structured data and UI. `analyticsId` may stay empty if Marketing does not ship analytics in this program.
5. Editors still only edit **Home Editor** (`/dashboard/`) and **Content Studio** news + jobs (`/admin/`). Completing this program must **not** add editable collections or fields for inner pages.

Success is **not** “editors can edit every page” and **not** a visual redesign.

---

## 2. Locked decisions

| Topic | Choice |
|---|---|
| Artifact | Program spec + **sequential child specs** (not one fat spec, not parallel tracks on `main`) |
| Public locales | Real URLs, three HTML documents per page |
| Default at `/` | **Vietnamese** |
| English | `/en/…` |
| Chinese | `/zh/…` |
| Locale codes | Route `/` `/en/` `/zh/`. `html[lang]`: `vi` / `en` / `zh-Hans`. `hreflang`: `vi` / `en` / `zh-Hans` |
| Page identity | **Locale-independent slug**. Only the locale prefix changes. No translated slugs in this program |
| Content paths in JSON/markdown | **Locale-agnostic** (`/products/nv007/`, `/about/`). Home Editor locked hrefs stay unprefixed |
| Prefixing | Only **internal root-relative public paths**. Absolute/external URLs, `#` anchors, `mailto:`, `tel:` unchanged |
| Unprefixed URL migration | **Breaking semantic reuse:** existing unprefixed paths become Vietnamese. They **cannot** 301 to English because the path is reused. `/en/…` is the new canonical English URL |
| Canonical | Each locale URL’s canonical is **itself** (absolute URL on the frozen production origin). `/en/about/` must **not** canonical to `/about/` |
| `x-default` | Absolute canonical **Vietnamese root** on the production origin |
| Production origin | **Exactly one** source of truth. Env and `site.json` representations must resolve to the same value. Ops freezes it **before Spec 2 merges** |
| Admin surfaces | `/admin/` and `/dashboard/` stay unprefixed, not in the public sitemap |
| Missing translation | **No cross-language fallback.** A page in the public locale tree without all three bodies is a **build/gate failure** |
| Inner-page CMS | **Later program** — companies, SKUs, leadership bios, about body |
| Ecosystem mill-line UI | **Out** — existing draft spec remains the owner |
| Child spec order | (1) Production lock → Ops confirms origin → (2) Locale URLs → (3) SEO pack |

---

## 3. Out of scope

- CMS for `/companies/`, `/products/`, `/about/`, leadership people, downloads, legal pages.
- New homepage block types, header/footer information architecture, or the ecosystem mill-line redesign.
- Accept-Language redirect on `/` (no geo/language sniffing at the root).
- Translated slugs per locale.
- Pixel-perfect unpublished Eleventy preview of locale drafts.
- Changing brand tokens, seal lockup, or GSAP storytelling except where the language switcher must emit real URLs.
- Merging uncommitted ecosystem/CSS WIP into this program.

---

## 4. Departments and RACI

Roles may be filled by one person. Accountable still signs the child spec.

| Department | Responsible (R) | Accountable (A) |
|---|---|---|
| **Security** | Required auth in production/remote, CORS allowlist, news/jobs slug sanitization, image upload policy aligned with Home Editor | CMS security DoD |
| **Ops** | Railway env, freeze canonical production origin, Vercel domain, **disable** GitHub Pages as a publish surface | Production deploy |
| **Platform** | Eleventy locale tree, self-canonicals, switcher **hrefs** to equivalent locale URLs | Child spec 2 |
| **SEO / Marketing** | `hreflang` (self + both alternates + `x-default`), locale sitemaps, Organization JSON-LD, social/analytics fields | Child spec 3 remaining SEO fields |
| **Editorial** | Complete EN / VI / ZH **body and metadata** on every page that enters the public locale tree | **Hard merge gate** for Spec 2 — not advisory |
| **CMS** | Home Editor + Studio preview, locked hrefs, “view site” links on the frozen origin + locale prefix | Draft/publish homepage behavior unchanged |
| **Design** | Consult on switcher/header as **links**, not client-only lang swap | No visual redesign in this program |

**Handoff rules**

- Ops must not run GitHub Pages as a second public site beside Vercel.
- Platform must not merge Spec 2 until Spec 1 is applied on the publishing CMS **and** Ops has confirmed the canonical production origin.
- Spec 3 freezes social, analytics, Organization copy, and sitemap/hreflang config. It does **not** change the production origin locked before Spec 2.
- CMS must not add inner-page editors.

---

## 5. Child specs (sequence and gates)

Work **in order**. Spec N takes Spec N−1 outputs. Do not open parallel implementation on `main`.

```
Spec 1 Production lock
        → Ops confirms canonical Vercel origin (one source of truth)
        → Spec 2 Locale URLs
        → Spec 3 SEO pack
```

How production/remote is **detected** (env flags, `NODE_ENV`, GitHub vars, etc.) is **Spec 1**, not this charter. This charter only locks the **fail-closed invariant**.

### Spec 1 — Production lock

**Owners:** Security + Ops  

**In:** Current `scripts/admin-api.js`, `.env.example`, `.github/workflows/deploy.yml`.  

**Out:** Production/remote CMS cannot run unauthenticated; incomplete GitHub config cannot become open local mode; CORS has an explicit allowlist (no `*`); news/jobs slugs cannot traverse; GitHub Pages is not a production surface.

**Accept**

- Production or explicitly configured remote mode **MUST** require admin authentication. Missing `ADMIN_USER`+`ADMIN_PASS` and missing `ADMIN_TOKEN` in that mode → process **does not listen** (exit non-zero).
- Incomplete GitHub publishing config (token without repo, repo without token, or equivalent) must **not** be treated as unauthenticated local mode.
- Local interactive `npm run cms` on a developer machine may stay open **only** when the process is clearly not production/remote. Spec 1 defines that distinction.
- Remote/production CORS: explicit allowlist; `*` forbidden. Current production allows **only** the canonical Vercel site origin (www/apex treated as Spec 1 if both exist).
- Any **decoded** slug that introduces a path segment or parent-directory traversal returns **400**. At minimum reject `..`, `/`, and `\`. Exact slug grammar is Spec 1 (prefer allowlist).
- News upload allowlist matches Home Editor: jpeg, png, webp (no GIF).
- GitHub Pages deployment **disabled** as production DoD. If disable is temporarily impossible during migration: all Pages HTML is `noindex` **and** canonicalizes to the Vercel origin until Pages is removed.
- `npm run test:cms` stays green (35 tests, plus new auth/slug tests in that spec’s plan).

### Spec 2 — Locale URLs

**Owners:** Platform; CMS consulted  

**In:** Spec 1 live on the publishing CMS. **Canonical production origin frozen** (one value used by CMS “view site”, Eleventy `site.url` / equivalent, and later SEO). Content still stores unprefixed paths.  

**Out:** Three public URLs per page in the locale tree; each document is server-rendered in **one** language with the contracted `html[lang]`; switcher is a **normal navigation** to the equivalent path; locked hrefs unchanged in JSON; render prefixes EN/ZH **only** on internal root-relative public paths.

**Accept**

- Locale roots (trailing slash): `/`, `/en/`, `/zh/`. Inner pages: VI `{path}`, EN `/en{path}`, ZH `/zh{path}` (`path` starts with `/`, e.g. `/about/` → `/en/about/`). One canonical trailing-slash form; other slash variants redirect or are not emitted.
- Public route identity/slug is **locale-independent**. Switching language changes only the prefix (`/en/news/foo/` ↔ `/zh/news/foo/`).
- Each locale URL emits a **self-canonical** absolute URL on the frozen origin. `/en/about/` canonicalizes to `/en/about/`, not `/about/`.
- Language switcher **hrefs** point at the equivalent locale documents. Clicking them loads that HTML. Changing `html[lang]` or toggling `span.lang` **without** requesting the locale document does **not** satisfy this spec.
- Crawlers do not need `data-lang` to read the page language. Primary copy in each document is that locale only.
- **No silent fallback** to another locale’s body. Missing required translation → build or merge **failure** for that page’s inclusion in the public locale tree.
- Unprefixed paths that existed as English-default **keep the same path** and now serve **Vietnamese**. There is **no** general 301 from those paths to `/en/…`. Spec 2 may 301 only **non-reused** legacy paths, if any exist.
- Studio “view site” and dashboard preview links use the **frozen origin** + locale prefix when the editor UI language is EN or ZH.
- Eleventy `npm run build` succeeds.
- Editorial sign-off of the three-language checklist is a **hard merge gate**.

**Rollback:** After locale URLs are indexed or linked externally, a code revert must **not** 404 shipped `/en/…` and `/zh/…` (keep redirects or the paths). Merge only after Editorial’s hard gate.

### Spec 3 — SEO pack

**Owners:** SEO / Marketing  

**In:** Stable URL tree from spec 2. Production origin already frozen.  

**Out:** Reciprocal `hreflang` (`vi`, `en`, `zh-Hans`, plus `x-default` = absolute Vietnamese root); sitemap output listing every indexable locale URL **exactly once** on that host; Organization JSON-LD on the homepage (and inner layout if cheap); social/analytics fields with no placeholder or empty `sameAs`.

**Accept**

- View-source of `/` is Vietnamese (`html lang="vi"`).
- Each public URL emits **self + both language alternates + `x-default`**. All `hreflang` and canonical `href`s are **absolute** on the frozen production origin.
- Every indexable public locale URL appears **exactly once** in sitemap output (one host, three locale variants — not three hosts). Admin and dashboard URLs excluded.
- `robots.txt` disallows `/admin/` and `/dashboard/` as **crawl directives only**; they do not replace Spec 1 authentication.
- Placeholder social URLs gone from data **and** from rendered JSON-LD/UI.

---

## 6. Data flow (program level)

```
Editorial copy (3 langs in existing JSON/md)
        │
        ▼
Eleventy (spec 2) ──► Vercel public HTML
        ▲                    (self-canonical + locale prefix)
        │ GitHub commit
Railway CMS (spec 1 auth) ──► Home Editor + Studio
        │
        ▼
SEO pack (spec 3) ──► hreflang, sitemap, JSON-LD
                      (origin already frozen)
```

Content files do not store `/en/` or `/zh/` prefixes. Prefixing is a **render/routing** concern for **internal root-relative public paths only**. That keeps Home Editor `mergeLockedHrefs` maps valid: `/products/nv007/` gets a locale prefix; partner `https://…` URLs do not.

---

## 7. Error handling and rollback

| Event | Response |
|---|---|
| Spec 1 regression | Revert spec 1 alone. Public site URLs unchanged. |
| Spec 2 merge without Editorial hard gate | Do not merge. |
| Spec 2 after go-live | **URL contract.** Preserve shipped `/en/…` `/zh/…` (redirects if architecture reverts). |
| Spec 3 regression | **SEO contract only.** Revert hreflang/sitemap/JSON-LD without changing locale URLs. |
| CMS publish during spec 2 branch | Allowed; hrefs stay unprefixed. |

---

## 8. Testing (program bar)

Each child spec’s implementation plan owns concrete tests. This charter only sets the bar:

- Spec 1: Node tests for fail-closed production/remote, CORS (no `*`), decoded slug rejection; `test:cms` still 35+ green.
- Spec 2: Automated tests for **route generation and locale-link transformation** (roots, one nested path, one news slug, switcher equivalence, internal prefix, external URL unchanged, `html[lang]`). Spot-checks supplement, they do not replace those tests. No browser E2E suite required.
- Spec 3: Sitemap lists each indexable locale URL **once** on the canonical host; homepage HTML contains `application/ld+json` and four `hreflang` links (three locales + `x-default`).

---

## 9. What this file is not

Do not implement code from this document. Next artifact after approval: **child spec 1 (Production lock)** at `docs/superpowers/specs/`, then a plan **only for spec 1**. Specs 2 and 3 wait until spec 1 is done (or explicitly re-queued).
