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
  bootCheck,
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
