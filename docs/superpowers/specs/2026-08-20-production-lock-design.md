# Child spec 1 — Production lock

Date: 2026-08-20  
Status: done (publishing CMS)  
Parent: [System completion program](2026-08-20-system-completion-program-design.md)  
Site: Nam Viet Group Eleventy 3 CMS (`scripts/admin-api.js`)

Lock the Content Studio so production/remote **cannot fail-open**, CORS cannot be `*`, news/jobs slugs cannot traverse, news uploads match Home Editor image types, and GitHub Pages is not a second public origin. **No locale URLs, JSON-LD, or inner-page CMS.**

There is **no** `REQUIRE_ADMIN_AUTH` env var. Explicit switches are `NODE_ENV=production` and `CMS_MODE=remote`. Partial GitHub env also requires auth. Docs must not invent a switch the guard does not read.

---

## 1. Goal and success

1. `cms-guard.js` is **pure**: env/slug in → booleans/results out. No `process.exit`, no Express, no filesystem at runtime.
2. `admin-api.js` orchestrates: `bootCheck` fail → log all `errors` → `exit(1)` **before** `listen`. `isSafeSlug(req.params.slug)` false → **400**. `githubPublishReady` independently selects GitHub vs local disk.
3. News `/api/upload` accepts jpeg/png/webp only (GIF → **415**), same as Home Editor.
4. `.github/workflows/deploy.yml` Pages workflow is disabled or removed. README has an Ops checklist to disable Pages in repository settings.

Success is **not** Helmet, rate-limits, sessions, magic-byte file scanning, or Spec 2/3 SEO.

---

## 2. Locked decisions

| Topic | Choice |
|---|---|
| Guard module | `scripts/cms-guard.js` + `scripts/cms-guard.test.js` |
| `authRequired` | `NODE_ENV === "production"` **or** `CMS_MODE === "remote"` **or** `nonEmpty(GITHUB_TOKEN)` **or** `nonEmpty(GITHUB_REPO)`. Comparisons are **exact** (no `toLowerCase`) |
| `REQUIRE_ADMIN_AUTH` | **Does not exist** |
| `nonEmpty` | `String(value ?? "").trim().length > 0` — **presence only**. Do not trim/normalize secrets used to authenticate or publish |
| `hasBasicAuth` | `nonEmpty(ADMIN_USER) && nonEmpty(ADMIN_PASS)` |
| `hasTokenAuth` | `nonEmpty(ADMIN_TOKEN)` |
| `authConfigured` | `hasBasicAuth \|\| hasTokenAuth` |
| `githubPublishReady` | `nonEmpty(GITHUB_TOKEN) && nonEmpty(GITHUB_REPO)` — **not** the same as `authRequired` |
| `bootCheck` return | Always `{ ok, corsOrigin?, errors? }`. Local/open: `{ ok: true, corsOrigin: "*" }`. Auth-required success: `{ ok: true, corsOrigin: "<origin>" }`. Failure: `{ ok: false, errors: [{ code, message }] }` (all errors at once) |
| CORS when auth-required | `SITE_URL` and `CORS_ORIGIN` required, absolute `http:`/`https:`, no userinfo, `CORS_ORIGIN` is a **pure origin** (no path/query/hash except optional `/` pathname with empty search/hash), not `*`, `new URL(CORS_ORIGIN).origin === new URL(SITE_URL).origin`. Returned `corsOrigin` is `new URL(CORS_ORIGIN).origin` (port allowed) |
| `SITE_URL` in this spec | Required **only** when `authRequired` because it pairs with CORS. Spec 1 does **not** freeze the Spec 2/3 canonical SEO contract |
| Slug | Validate **router-provided decoded** `req.params.slug`. Do **not** `decodeURIComponent` again. Invalid encoding → 400 at HTTP. Grammar: `^[a-z0-9][a-z0-9-]{0,MAX_SLUG_LENGTH-1}$` |
| `MAX_SLUG_LENGTH` | Constant in source, default **80**. Audit (test-only, reads disk) of news/jobs **basename without `.md`**. If any existing slug is longer, set the constant to **96** or **128**, whichever smallest fits. Guard never computes max from the filesystem |
| Pages | Disable/remove the workflow **and** Ops disables repo Pages publishing (sign-off in README). No `noindex` fallback in Spec 1 |

---

## 3. Out of scope

- Locale prefixes, hreflang, sitemaps, JSON-LD, `site.json` social freeze.
- Helmet, rate-limit, cookie sessions, CSRF tokens.
- Magic-byte / content sniffing for uploads.
- Changing Home Editor upload slots (already jpeg/png/webp).
- Enabling GitHub publish when only one of token/repo is set (stay local-disk writes; still **auth-required**).

---

## 4. `cms-guard` API

All functions take a plain `env` object (tests pass fixtures; boot passes `process.env`) except `isSafeSlug(slug)` and `nonEmpty(value)`.

```
nonEmpty(value) → boolean

authRequired(env) → boolean
hasBasicAuth(env) → boolean
hasTokenAuth(env) → boolean
authConfigured(env) → boolean
githubPublishReady(env) → boolean

bootCheck(env) →
  | { ok: true, corsOrigin: string }
  | { ok: false, errors: { code: string, message: string }[] }

isSafeSlug(slug) → boolean
```

**`bootCheck` when `authRequired(env)` is false:** `{ ok: true, corsOrigin: "*" }`. Do not require `SITE_URL` / `CORS_ORIGIN`.

**`bootCheck` when `authRequired(env)` is true:** if `!authConfigured` push `AUTH_MISSING`. Validate `SITE_URL` / `CORS_ORIGIN` with codes below. On full success return `{ ok: true, corsOrigin }` where `corsOrigin` is the parsed origin string (scheme + host + port). `admin-api.js` uses **only** this field for `Access-Control-Allow-Origin` — no second CORS policy.

**Stable error `code` values** (messages may change; tests assert codes):

| Code | When |
|---|---|
| `AUTH_MISSING` | `authRequired` and not `authConfigured` |
| `SITE_URL_MISSING` | missing/blank `SITE_URL` |
| `SITE_URL_INVALID` | not absolute http(s), or has username/password, or `new URL` throws |
| `CORS_ORIGIN_MISSING` | missing/blank `CORS_ORIGIN` |
| `CORS_ORIGIN_WILDCARD` | `*` or equivalent allow-all |
| `CORS_ORIGIN_INVALID` | not absolute http(s), has userinfo, or has path/query/hash (beyond optional `/`) |
| `CORS_ORIGIN_MISMATCH` | parsed origins differ |

---

## 5. `admin-api.js` orchestration

```
const guard = bootCheck(process.env)
if (!guard.ok) {
  // log every error.code + error.message
  process.exit(1)
}
// CORS header = guard.corsOrigin
// listen() only after ok

REMOTE / GitHub Contents = githubPublishReady(process.env)

GET|PUT|DELETE /api/news/:slug and /api/careers/:slug:
  if (!isSafeSlug(req.params.slug)) → 400
```

Malformed percent-encoding that never becomes a decoded slug still **400** (router/app layer). Do not 500.

Existing `checkAuth` / Basic / token headers stay as today for **credential verification**. Guard does not compare passwords.

---

## 6. Upload GIF

`POST /api/upload` `fileFilter`: allow `image/jpeg`, `image/png`, `image/webp` only. GIF (and other types) → **415**, same mapping Home Editor already uses. No magic-byte scanner.

---

## 7. GitHub Pages

- Remove or disable (e.g. workflow `if: false`) `.github/workflows/deploy.yml` so **new** Pages deploys cannot run.
- `src/admin/README.md` checklist (Ops sign-off, not code):
  - [ ] Pages workflow disabled/removed
  - [ ] Repository Settings → Pages publishing disabled
  - [ ] Ops sign-off recorded

---

## 8. Docs

`.env.example` documents (comments, not a fake `REQUIRE_ADMIN_AUTH` key):

```
# Auth is required when NODE_ENV=production OR CMS_MODE=remote
# OR either GITHUB_TOKEN or GITHUB_REPO is non-empty (trimmed).
# GitHub Contents publish only when BOTH token and repo are set.
# When auth is required: SITE_URL and CORS_ORIGIN are required;
# CORS_ORIGIN must be a pure origin matching SITE_URL's origin.

NODE_ENV=production
CMS_MODE=remote
SITE_URL=https://example.com
CORS_ORIGIN=https://example.com
ADMIN_USER=
ADMIN_PASS=
ADMIN_TOKEN=
GITHUB_TOKEN=
GITHUB_REPO=
```

Local disk open mode: none of the `authRequired` triggers. README states that explicitly.

---

## 9. Testing

`scripts/cms-guard.test.js` (no `listen`):

- `authRequired` matrix: `production`, `CMS_MODE=remote`, token-only, repo-only → true; empty env → false; `NODE_ENV=Production`, `CMS_MODE=REMOTE` → false.
- Local `bootCheck` → `{ ok: true, corsOrigin: "*" }`.
- Auth-required, no credentials → `ok: false`, includes `AUTH_MISSING`.
- Token-only + `authConfigured` + matching `SITE_URL`/`CORS_ORIGIN` (trailing-slash vs not) → `ok: true`, `corsOrigin` is origin-only; `githubPublishReady` is **false**.
- `*`, path, query, userinfo, origin mismatch → corresponding `CORS_*` / `SITE_URL_*` codes.
- `isSafeSlug`: valid kebab; reject `..`, `foo/bar`, uppercase, `_`, Unicode, empty.
- Length `MAX_SLUG_LENGTH` → true; `MAX_SLUG_LENGTH + 1` → false.
- **Audit (test may read disk):** every news/jobs content file whose basename (no `.md`) is used as `:slug` must `isSafeSlug === true`. If this fails on length, raise `MAX_SLUG_LENGTH` constant and re-run — do not special-case files in the guard.

Route/app tests (existing Express test style, no browser E2E):

- `/api/news/foo%2Fbar` → **400**
- malformed percent-encoding in `:slug` → **400**
- GIF upload → **415**

`npm run test:cms` includes `cms-guard.test.js` and stays green with prior Home CMS tests.

---

## 10. What this file is not

Do not implement from this document until the user approves it and an implementation **plan** exists. Next: plan **only** for Spec 1, then code. Specs 2 and 3 wait.
