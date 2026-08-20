# Production lock (CMS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fail-closed Content Studio boot, origin-only CORS when auth is required, allowlisted news/jobs slugs, jpeg/png/webp news uploads, and no new GitHub Pages deploys.

**Architecture:** Pure predicates live in `scripts/cms-guard.js` (no `process.exit`, no Express, no filesystem at runtime). `scripts/admin-api.js` calls `bootCheck` before `listen`, uses returned `corsOrigin`, uses `githubPublishReady` for GitHub vs disk, and returns 400/415 at HTTP. Tests cover the guard without a server; a small HTTP test boots `createCmsApp` on an ephemeral port.

**Tech Stack:** Node 20 `node:test`, Express 5, multer (already in package.json). No Helmet, no new dependencies.

## Global Constraints

- Parent spec: `docs/superpowers/specs/2026-08-20-production-lock-design.md` (verbatim).
- **No** `REQUIRE_ADMIN_AUTH` env var. Do not document or read it.
- `authRequired`: `NODE_ENV === "production"` **or** `CMS_MODE === "remote"` **or** `nonEmpty(GITHUB_TOKEN)` **or** `nonEmpty(GITHUB_REPO)` — exact string match, no `toLowerCase`.
- `nonEmpty`: `String(value ?? "").trim().length > 0` for **presence only**. Do not trim `ADMIN_PASS`, `ADMIN_TOKEN`, or `GITHUB_TOKEN` before comparing credentials or calling GitHub.
- `authRequired` ≠ `githubPublishReady` ≠ `authConfigured`.
- `bootCheck` always returns `{ ok: true, corsOrigin }` or `{ ok: false, errors: [{ code, message }] }`. Local/open `corsOrigin` is `"*"`. Auth-required success `corsOrigin` is `new URL(CORS_ORIGIN).origin`.
- Error codes (stable): `AUTH_MISSING`, `SITE_URL_MISSING`, `SITE_URL_INVALID`, `CORS_ORIGIN_MISSING`, `CORS_ORIGIN_INVALID`, `CORS_ORIGIN_WILDCARD`, `CORS_ORIGIN_MISMATCH`. Collect **all** errors in one `bootCheck` call.
- Slug grammar: `^[a-z0-9][a-z0-9-]{0,MAX_SLUG_LENGTH-1}$` on the **router-decoded** param. Do not `decodeURIComponent` again in the guard. `MAX_SLUG_LENGTH` is a source constant (start **80**; raise to **96** or **128** only if the content audit fails).
- When `authRequired`: `SITE_URL` and `CORS_ORIGIN` required; CORS is a pure origin; no userinfo; origins must match. Spec 1 does not freeze SEO canonicals.
- News upload: jpeg/png/webp only; GIF → 415. No magic-byte scanner.
- Do not implement locale URLs, JSON-LD, Helmet, rate-limit, or inner-page CMS.
- Tests: `node --test`. Node ≥20. Do not add Jest.

## File map

| Path | Role |
|---|---|
| `scripts/cms-guard.js` | Pure env/slug predicates + `bootCheck` |
| `scripts/cms-guard.test.js` | Unit tests + news/jobs slug audit (disk OK here) |
| `scripts/admin-api.js` | `createCmsApp(env)`; boot; CORS; slug 400; GIF 415; `listen` only as main |
| `scripts/admin-api.http.test.js` | HTTP: `%2F`, malformed `%`, GIF 415 |
| `package.json` | `test:cms` includes the new test files |
| `.env.example` | Auth/CORS/GitHub contract comments; no `REQUIRE_ADMIN_AUTH`; no `CORS_ORIGIN=*` |
| `src/admin/README.md` | Fail-closed boot, local open mode, Pages Ops checklist |
| `.github/workflows/deploy.yml` | Remove (no new Pages deploys) |

---

### Task 1: `cms-guard` predicates (no bootCheck URLs yet)

**Files:**
- Create: `scripts/cms-guard.js`
- Create: `scripts/cms-guard.test.js`
- Modify: `package.json` (`test:cms` script)

**Interfaces:**
- Consumes: nothing
- Produces: `nonEmpty`, `authRequired`, `hasBasicAuth`, `hasTokenAuth`, `authConfigured`, `githubPublishReady`, `MAX_SLUG_LENGTH`, `isSafeSlug` (implement `isSafeSlug` in Task 3 if you split; **this task includes `isSafeSlug` with `MAX_SLUG_LENGTH = 80`** so later tasks import one module). Stub `bootCheck` in Task 2 — **do not stub**: implement `bootCheck` local branch only in this task (`!authRequired` → `{ ok: true, corsOrigin: "*" }`; `authRequired` without credentials → `{ ok: false, errors: [{ code: "AUTH_MISSING", ... }] }` and skip URL checks until Task 2 **or** implement full `bootCheck` in Task 2).

Implement **full `bootCheck` in Task 2**. This task: predicates + `isSafeSlug` + local/AUTH_MISSING `bootCheck` minimal? Cleaner: Task 1 only predicates + isSafeSlug; Task 2 adds bootCheck.

Task 1 produces: `nonEmpty`, `authRequired`, `hasBasicAuth`, `hasTokenAuth`, `authConfigured`, `githubPublishReady`, `MAX_SLUG_LENGTH`, `isSafeSlug`.

- [ ] **Step 1: Write failing tests**

Create `scripts/cms-guard.test.js`:

```js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  nonEmpty,
  authRequired,
  hasBasicAuth,
  hasTokenAuth,
  authConfigured,
  githubPublishReady,
  isSafeSlug,
  MAX_SLUG_LENGTH,
} = require("./cms-guard");

describe("nonEmpty", () => {
  it("is false for missing, empty, and whitespace-only", () => {
    assert.equal(nonEmpty(undefined), false);
    assert.equal(nonEmpty(""), false);
    assert.equal(nonEmpty("   "), false);
  });
  it("is true for a padded token without mutating callers", () => {
    assert.equal(nonEmpty(" abc "), true);
  });
});

describe("authRequired", () => {
  it("is false for an empty env", () => {
    assert.equal(authRequired({}), false);
  });
  it("is true for exact production and remote switches", () => {
    assert.equal(authRequired({ NODE_ENV: "production" }), true);
    assert.equal(authRequired({ CMS_MODE: "remote" }), true);
  });
  it("does not case-fold NODE_ENV or CMS_MODE", () => {
    assert.equal(authRequired({ NODE_ENV: "Production" }), false);
    assert.equal(authRequired({ CMS_MODE: "REMOTE" }), false);
  });
  it("is true if either GitHub var is non-empty after trim", () => {
    assert.equal(authRequired({ GITHUB_TOKEN: "t" }), true);
    assert.equal(authRequired({ GITHUB_REPO: "o/r" }), true);
    assert.equal(authRequired({ GITHUB_TOKEN: "  x  " }), true);
  });
});

describe("authConfigured vs githubPublishReady", () => {
  it("requires both user and password for basic", () => {
    assert.equal(hasBasicAuth({ ADMIN_USER: "u" }), false);
    assert.equal(hasBasicAuth({ ADMIN_USER: "u", ADMIN_PASS: "p" }), true);
  });
  it("treats token presence independently from GitHub publish", () => {
    const env = { ADMIN_TOKEN: "tok", GITHUB_TOKEN: "t" };
    assert.equal(hasTokenAuth(env), true);
    assert.equal(authConfigured(env), true);
    assert.equal(githubPublishReady(env), false);
  });
  it("githubPublishReady needs both token and repo", () => {
    assert.equal(githubPublishReady({ GITHUB_TOKEN: "t", GITHUB_REPO: "o/r" }), true);
  });
});

describe("isSafeSlug", () => {
  it("accepts kebab-case within the max length", () => {
    assert.equal(isSafeSlug("hoi-thao-khoa-hoc"), true);
    assert.equal(isSafeSlug("a".repeat(MAX_SLUG_LENGTH)), true);
  });
  it("rejects max+1, traversal, case, unicode, empty", () => {
    assert.equal(isSafeSlug("a".repeat(MAX_SLUG_LENGTH + 1)), false);
    assert.equal(isSafeSlug(".."), false);
    assert.equal(isSafeSlug("foo/bar"), false);
    assert.equal(isSafeSlug("ABC"), false);
    assert.equal(isSafeSlug("foo_bar"), false);
    assert.equal(isSafeSlug("tin-tức"), false);
    assert.equal(isSafeSlug(""), false);
    assert.equal(isSafeSlug(undefined), false);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
node --test scripts/cms-guard.test.js
```

Expected: FAIL (`Cannot find module './cms-guard'`).

- [ ] **Step 3: Implement `scripts/cms-guard.js`**

```js
"use strict";

const MAX_SLUG_LENGTH = 80;

function nonEmpty(value) {
  return String(value ?? "").trim().length > 0;
}

function authRequired(env) {
  const e = env || {};
  return (
    e.NODE_ENV === "production" ||
    e.CMS_MODE === "remote" ||
    nonEmpty(e.GITHUB_TOKEN) ||
    nonEmpty(e.GITHUB_REPO)
  );
}

function hasBasicAuth(env) {
  const e = env || {};
  return nonEmpty(e.ADMIN_USER) && nonEmpty(e.ADMIN_PASS);
}

function hasTokenAuth(env) {
  return nonEmpty((env || {}).ADMIN_TOKEN);
}

function authConfigured(env) {
  return hasBasicAuth(env) || hasTokenAuth(env);
}

function githubPublishReady(env) {
  const e = env || {};
  return nonEmpty(e.GITHUB_TOKEN) && nonEmpty(e.GITHUB_REPO);
}

function isSafeSlug(slug) {
  if (typeof slug !== "string") return false;
  const re = new RegExp(`^[a-z0-9][a-z0-9-]{0,${MAX_SLUG_LENGTH - 1}}$`);
  return re.test(slug);
}

module.exports = {
  MAX_SLUG_LENGTH,
  nonEmpty,
  authRequired,
  hasBasicAuth,
  hasTokenAuth,
  authConfigured,
  githubPublishReady,
  isSafeSlug,
};
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
node --test scripts/cms-guard.test.js
```

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/cms-guard.js scripts/cms-guard.test.js
git commit -m "Add pure CMS auth and slug predicates."
```

---

### Task 2: `bootCheck` CORS / SITE_URL

**Files:**
- Modify: `scripts/cms-guard.js`
- Modify: `scripts/cms-guard.test.js`

**Interfaces:**
- Consumes: Task 1 exports
- Produces: `bootCheck(env) → { ok, corsOrigin? } | { ok: false, errors }`

- [ ] **Step 1: Add failing `bootCheck` tests** (append to `cms-guard.test.js`)

```js
const { bootCheck } = require("./cms-guard");

describe("bootCheck", () => {
  it("returns star CORS when auth is not required", () => {
    assert.deepEqual(bootCheck({}), { ok: true, corsOrigin: "*" });
  });

  it("lists AUTH_MISSING when production has no credentials", () => {
    const result = bootCheck({ NODE_ENV: "production" });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.code === "AUTH_MISSING"));
  });

  it("accepts matching origins when token-only GitHub env has admin token", () => {
    const result = bootCheck({
      GITHUB_TOKEN: "t",
      ADMIN_TOKEN: "tok",
      SITE_URL: "https://namviet.vn/",
      CORS_ORIGIN: "https://namviet.vn",
    });
    assert.equal(result.ok, true);
    assert.equal(result.corsOrigin, "https://namviet.vn");
    assert.equal(githubPublishReady({ GITHUB_TOKEN: "t" }), false);
  });

  it("rejects wildcard, path, query, userinfo, and origin mismatch", () => {
    const base = {
      NODE_ENV: "production",
      ADMIN_TOKEN: "tok",
      SITE_URL: "https://namviet.vn",
    };
    assert.ok(
      bootCheck({ ...base, CORS_ORIGIN: "*" }).errors.some((e) => e.code === "CORS_ORIGIN_WILDCARD"),
    );
    assert.ok(
      bootCheck({ ...base, CORS_ORIGIN: "https://namviet.vn/dashboard/" }).errors.some(
        (e) => e.code === "CORS_ORIGIN_INVALID",
      ),
    );
    assert.ok(
      bootCheck({ ...base, CORS_ORIGIN: "https://namviet.vn?foo=1" }).errors.some(
        (e) => e.code === "CORS_ORIGIN_INVALID",
      ),
    );
    assert.ok(
      bootCheck({
        ...base,
        SITE_URL: "https://user:pass@namviet.vn",
        CORS_ORIGIN: "https://namviet.vn",
      }).errors.some((e) => e.code === "SITE_URL_INVALID"),
    );
    assert.ok(
      bootCheck({ ...base, CORS_ORIGIN: "https://other.vn" }).errors.some(
        (e) => e.code === "CORS_ORIGIN_MISMATCH",
      ),
    );
  });

  it("collects multiple errors at once", () => {
    const result = bootCheck({ NODE_ENV: "production" });
    const codes = result.errors.map((e) => e.code);
    assert.ok(codes.includes("AUTH_MISSING"));
    assert.ok(codes.includes("SITE_URL_MISSING"));
    assert.ok(codes.includes("CORS_ORIGIN_MISSING"));
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL** (`bootCheck` is not a function).

```bash
node --test scripts/cms-guard.test.js
```

- [ ] **Step 3: Implement `bootCheck` in `cms-guard.js`**

Parse URLs with `String(raw ?? "").trim()` **only** for SITE_URL / CORS_ORIGIN syntax (not secrets).

```js
function error(code, message) {
  return { code, message };
}

function parseAbsoluteHttpUrl(raw) {
  if (!nonEmpty(raw)) return { missing: true };
  let parsed;
  try {
    parsed = new URL(String(raw).trim());
  } catch {
    return { invalid: true };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return { invalid: true };
  if (parsed.username !== "" || parsed.password !== "") return { invalid: true };
  return { parsed };
}

function isPureOrigin(parsed) {
  if (parsed.search !== "" || parsed.hash !== "") return false;
  return parsed.pathname === "/" || parsed.pathname === "";
}

function bootCheck(env) {
  const e = env || {};
  if (!authRequired(e)) {
    return { ok: true, corsOrigin: "*" };
  }

  const errors = [];
  if (!authConfigured(e)) {
    errors.push(error("AUTH_MISSING", "Admin credentials are required in production/remote mode."));
  }

  const site = parseAbsoluteHttpUrl(e.SITE_URL);
  if (site.missing) errors.push(error("SITE_URL_MISSING", "SITE_URL is required when auth is required."));
  else if (site.invalid) errors.push(error("SITE_URL_INVALID", "SITE_URL must be an absolute http(s) URL without credentials."));

  const corsRaw = String(e.CORS_ORIGIN ?? "").trim();
  if (!nonEmpty(e.CORS_ORIGIN)) {
    errors.push(error("CORS_ORIGIN_MISSING", "CORS_ORIGIN is required when auth is required."));
  } else if (corsRaw === "*") {
    errors.push(error("CORS_ORIGIN_WILDCARD", "CORS_ORIGIN must not be a wildcard."));
  } else {
    const cors = parseAbsoluteHttpUrl(e.CORS_ORIGIN);
    if (cors.invalid || !cors.parsed) {
      errors.push(error("CORS_ORIGIN_INVALID", "CORS_ORIGIN must be an absolute http(s) origin without credentials."));
    } else if (!isPureOrigin(cors.parsed)) {
      errors.push(error("CORS_ORIGIN_INVALID", "CORS_ORIGIN must be a pure origin (no path, query, or hash)."));
    } else if (site.parsed && cors.parsed.origin !== site.parsed.origin) {
      errors.push(error("CORS_ORIGIN_MISMATCH", "CORS_ORIGIN must match SITE_URL origin."));
    }
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, corsOrigin: parseAbsoluteHttpUrl(e.CORS_ORIGIN).parsed.origin };
}
```

Export `bootCheck`. Port on origin is allowed (`https://example.com:8443`).

- [ ] **Step 4: Run tests — expect PASS**

```bash
node --test scripts/cms-guard.test.js
```

- [ ] **Step 5: Commit**

```bash
git add scripts/cms-guard.js scripts/cms-guard.test.js
git commit -m "Validate CMS boot CORS against SITE_URL origin."
```

---

### Task 3: Existing slug audit; bump `MAX_SLUG_LENGTH` if needed

**Files:**
- Modify: `scripts/cms-guard.js` (only if audit requires 96 or 128)
- Modify: `scripts/cms-guard.test.js`

**Interfaces:**
- Consumes: `isSafeSlug`, `MAX_SLUG_LENGTH`
- Produces: unchanged API; constant may become 96 or 128

- [ ] **Step 1: Add audit test** (test **may** read disk; guard must not)

```js
const fs = require("node:fs");
const path = require("node:path");

describe("existing news/jobs slugs", () => {
  it("uses basename without .md and matches isSafeSlug", () => {
    const roots = [
      path.join(__dirname, "..", "src", "news", "posts"),
      path.join(__dirname, "..", "src", "careers", "jobs"),
    ];
    const slugs = [];
    for (const dir of roots) {
      for (const name of fs.readdirSync(dir)) {
        if (!name.endsWith(".md") || name.includes("11tydata")) continue;
        slugs.push(name.slice(0, -3));
      }
    }
    assert.ok(slugs.length > 0);
    for (const slug of slugs) {
      assert.equal(isSafeSlug(slug), true, slug);
    }
  });
});
```

- [ ] **Step 2: Run**

```bash
node --test scripts/cms-guard.test.js
```

If FAIL on length: set `MAX_SLUG_LENGTH` to **96**, re-run; if still fail, set **128**. Do not compute max from `readdir` inside `isSafeSlug`.

- [ ] **Step 3: Commit** (even if only the audit test landed)

```bash
git add scripts/cms-guard.js scripts/cms-guard.test.js
git commit -m "Audit existing news and job slugs against the allowlist."
```

---

### Task 4: Wire `admin-api.js`

**Files:**
- Modify: `scripts/admin-api.js`

**Interfaces:**
- Consumes: `bootCheck`, `githubPublishReady`, `isSafeSlug`, `authConfigured`
- Produces: `createCmsApp(env) → { ok: false, errors } | { ok: true, app, corsOrigin, remote }`  
  Main: fail → log every `code: message` → `process.exit(1)` **before** `listen`.

- [ ] **Step 1: Refactor without changing behavior except the spec items**

1. `require("./cms-guard")`.
2. Wrap the Express setup in `function createCmsApp(env)` using `const boot = bootCheck(env)`. If `!boot.ok` return `{ ok: false, errors: boot.errors }` — **do not listen**.
3. `app.use` CORS: `res.setHeader("Access-Control-Allow-Origin", boot.corsOrigin)` only (no `process.env.CORS_ORIGIN || "*"`).
4. Replace `const REMOTE = Boolean(GITHUB_TOKEN && GITHUB_REPO)` with `const remote = githubPublishReady(env)` and use `remote` everywhere `REMOTE` was used.
5. Read `GITHUB_*` / `ADMIN_*` from `env` (default `process.env`) so tests can inject fixtures. Keep comparing raw secret strings in `checkAuth` (no trim).
6. Use `authConfigured(env)` wherever `authEnabled()` gated login (same boolean meaning as today for configured credentials).
7. Before news/careers `:slug` handlers, reject unsafe encoding then `isSafeSlug`:

```js
function slugRequestLooksUnsafe(originalUrl) {
  const pathOnly = String(originalUrl || "").split("?")[0];
  if (!pathOnly.startsWith("/api/news/") && !pathOnly.startsWith("/api/careers/")) {
    return false;
  }
  if (/%2f/i.test(pathOnly) || /%5c/i.test(pathOnly)) return true;
  if (/%(?![0-9a-fA-F]{2})/.test(pathOnly)) return true;
  return false;
}

app.use((req, res, next) => {
  if (slugRequestLooksUnsafe(req.originalUrl)) {
    return res.status(400).json({ error: "Invalid slug" });
  }
  next();
});
```

At the start of `GET|PUT|DELETE` `/api/news/:slug` and `/api/careers/:slug`:

```js
if (!isSafeSlug(req.params.slug)) {
  return res.status(400).json({ error: "Invalid slug" });
}
```

8. URIError handler (malformed `%`):

```js
app.use((err, req, res, next) => {
  if (err instanceof URIError) {
    return res.status(400).json({ error: "Invalid slug" });
  }
  return next(err);
});
```

Place this after routes.

9. Bottom of file:

```js
module.exports = { createCmsApp };

if (require.main === module) {
  const result = createCmsApp(process.env);
  if (!result.ok) {
    for (const err of result.errors) {
      console.error(`[admin-api] ${err.code}: ${err.message}`);
    }
    process.exit(1);
  }
  result.app.listen(PORT, HOST, () => {
    console.log(`[admin-api] http://${HOST}:${PORT}`);
    console.log(
      `[admin-api] mode=${result.remote ? "github:" + (process.env.GITHUB_REPO || "") : "local"}`,
    );
    if (authConfigured(process.env)) console.log("[admin-api] auth=on");
  });
}
```

`PORT`/`HOST` stay as today (`process.env.PORT || process.env.ADMIN_API_PORT || 8081`).

10. **Do not** implement GIF in this task (Task 5) unless it is a one-liner; preferred: Task 5.

- [ ] **Step 2: Smoke local boot** (empty env, from repo root)

```bash
node -e "const {createCmsApp}=require('./scripts/admin-api'); const r=createCmsApp({}); if(!r.ok) process.exit(1); console.log(r.corsOrigin)"
```

Expected: prints `*`.

- [ ] **Step 3: Smoke fail-closed**

```bash
node -e "const {createCmsApp}=require('./scripts/admin-api'); const r=createCmsApp({NODE_ENV:'production'}); console.log(r.ok, r.errors.map(e=>e.code).join(','))"
```

Expected: `false` and codes including `AUTH_MISSING`.

- [ ] **Step 4: Commit**

```bash
git add scripts/admin-api.js
git commit -m "Fail-closed CMS boot and reject unsafe news slugs."
```

---

### Task 5: GIF 415 + HTTP slug tests

**Files:**
- Modify: `scripts/admin-api.js` (news `fileFilter` + upload error → 415; drop `.gif` from `safeExt`)
- Create: `scripts/admin-api.http.test.js`

**Interfaces:**
- Consumes: `createCmsApp`
- Produces: HTTP 400 for `%2F` / malformed `%`; HTTP 415 for GIF

- [ ] **Step 1: Write failing HTTP tests**

```js
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createCmsApp } = require("./admin-api");

describe("admin-api HTTP lock", () => {
  let server;
  let baseUrl;

  before(async () => {
    const created = createCmsApp({});
    assert.equal(created.ok, true);
    server = http.createServer(created.app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("returns 400 for encoded slash in news slug", async () => {
    const res = await fetch(`${baseUrl}/api/news/foo%2Fbar`);
    assert.equal(res.status, 400);
  });

  it("returns 400 for malformed percent-encoding in news slug", async () => {
    const res = await fetch(`${baseUrl}/api/news/foo%`);
    assert.equal(res.status, 400);
  });

  it("returns 415 for GIF news upload", async () => {
    const form = new FormData();
    form.append("file", new Blob(["GIF89a"], { type: "image/gif" }), "x.gif");
    const res = await fetch(`${baseUrl}/api/upload`, { method: "POST", body: form });
    assert.equal(res.status, 415);
  });
});
```

- [ ] **Step 2: Run — GIF test FAIL** (still 400/201) until filter changes; `%2F` should already be 400 from Task 4.

```bash
node --test scripts/admin-api.http.test.js
```

- [ ] **Step 3: News upload allowlist**

Replace the news `fileFilter` (not the Home Editor one if they share one `upload` instance — **split multer instances** if Home Editor still uses `^image//` in `routes.test.js`; in `admin-api.js` the **same** `upload` is passed to `mountHomeRoutes` and `/api/upload`).

Home Editor already rejects non-jpeg/png/webp **after** multer in `routes.js`. Tightening the shared `fileFilter` to jpeg/png/webp is **in spec** for `/api/upload` and is compatible with Home Editor (GIF already 415 there).

```js
const NEWS_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (NEWS_IMAGE_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error("Chỉ nhận file ảnh"));
  },
});
```

Wrap `/api/upload` like Home CMS:

```js
app.post("/api/upload", (req, res) => {
  upload.single("file")(req, res, async (uploadError) => {
    try {
      if (uploadError) {
        if (uploadError.message === "Chỉ nhận file ảnh") {
          return res.status(415).json({ error: "Unsupported image type" });
        }
        throw uploadError;
      }
      // existing write logic; safeExt only .jpg .jpeg .png .webp
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });
});
```

Remove `.gif` from `safeExt`.

- [ ] **Step 4: Run HTTP tests — expect PASS**

```bash
node --test scripts/admin-api.http.test.js
```

If `foo%` is 404 instead of 400, keep `slugRequestLooksUnsafe` `%(?![0-9a-fA-F]{2})` on `originalUrl` **and** the URIError handler. Do not accept 404.

- [ ] **Step 5: Commit**

```bash
git add scripts/admin-api.js scripts/admin-api.http.test.js
git commit -m "Reject GIF news uploads and encoded slug paths."
```

---

### Task 6: Docs, Pages workflow, `test:cms`

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `src/admin/README.md`
- Delete: `.github/workflows/deploy.yml`

**Interfaces:** none

- [ ] **Step 1: `package.json`**

```json
"test:cms": "node --test scripts/home-cms/schema.test.js scripts/home-cms/store.test.js scripts/home-cms/routes.test.js scripts/cms-guard.test.js scripts/admin-api.http.test.js"
```

- [ ] **Step 2: Replace `.env.example` body** with the spec comments and keys (`NODE_ENV`, `CMS_MODE`, `SITE_URL`, `CORS_ORIGIN` as **pure origin**, `ADMIN_*`, `GITHUB_*`). **No** `CORS_ORIGIN=*`. **No** `REQUIRE_ADMIN_AUTH`. Keep `HOST` / `GITHUB_BRANCH` if still used by `admin-api.js`.

- [ ] **Step 3: README** — add after Auth:

```markdown
## Production lock

- `NODE_ENV=production` or `CMS_MODE=remote` or any non-empty `GITHUB_TOKEN` / `GITHUB_REPO` **requires** admin credentials. The process logs error codes and **exits before listen** if boot fails.
- GitHub Contents publish runs only when **both** token and repo are set. Token-only still requires auth and does **not** fall back to an open local API.
- When auth is required, `SITE_URL` and `CORS_ORIGIN` are required; `CORS_ORIGIN` is a pure origin matching `SITE_URL`.
- Local open mode: none of those triggers (typical `npm run cms` on a laptop).

### GitHub Pages (Ops)

Public site is Vercel only.

- [ ] Pages workflow disabled/removed
- [ ] Repository Settings → Pages publishing disabled
- [ ] Ops sign-off recorded
```

Fix the Auth paragraph: production/remote **always** shows login because boot refuses missing credentials.

- [ ] **Step 4: Delete** `.github/workflows/deploy.yml`

- [ ] **Step 5: Run full CMS tests**

```bash
npm run test:cms
```

Expected: all pass (Home CMS 35 + guard + HTTP).

- [ ] **Step 6: Commit**

```bash
git add package.json .env.example src/admin/README.md
git rm .github/workflows/deploy.yml
git commit -m "Document fail-closed CMS boot and stop GitHub Pages deploys."
```

---

## Spec coverage

| Spec section | Task |
|---|---|
| Pure `cms-guard` | 1–2 |
| `authRequired` / no `REQUIRE_ADMIN_AUTH` | 1, 6 |
| `bootCheck` shapes + error codes | 2 |
| `isSafeSlug` + max/max+1 + audit | 1, 3 |
| `createCmsApp` / exit before listen | 4 |
| HTTP `%2F` + malformed `%` | 4–5 |
| GIF 415 | 5 |
| Pages + README checklist | 6 |
| `test:cms` includes new files | 6 |

## Placeholder scan

No TBD. `MAX_SLUG_LENGTH` bump is an explicit 96/128 constant, not runtime FS in the guard.
