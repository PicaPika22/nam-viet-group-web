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
