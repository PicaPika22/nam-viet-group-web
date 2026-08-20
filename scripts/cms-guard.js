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

module.exports = {
  MAX_SLUG_LENGTH,
  nonEmpty,
  authRequired,
  hasBasicAuth,
  hasTokenAuth,
  authConfigured,
  githubPublishReady,
  isSafeSlug,
  bootCheck,
};
