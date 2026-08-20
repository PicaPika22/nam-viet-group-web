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
