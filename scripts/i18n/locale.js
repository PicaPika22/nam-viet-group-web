const LOCALES = {
  vi: { prefix: "", htmlLang: "vi" },
  en: { prefix: "/en", htmlLang: "en" },
  zh: { prefix: "/zh", htmlLang: "zh-Hans" },
};

const TREE_ROOTS = [
  "/about",
  "/companies",
  "/products",
  "/news",
  "/careers",
  "/contact",
  "/investors",
  "/sustainability",
  "/downloads",
  "/privacy",
  "/cookies",
  "/terms",
];

const OUT_ROOTS = ["/admin", "/dashboard", "/mobile-concept", "/assets", "/css", "/js"];

const STATIC_EXT = /\.(xml|txt|pdf|docx|png|jpe?g|gif|webp|svg|css|js|ico|woff2?|map|json)$/i;

function assertLocale(locale) {
  if (!Object.hasOwn(LOCALES, locale)) {
    throw new Error(`invalid locale: ${locale}`);
  }
}

function htmlLang(locale) {
  assertLocale(locale);
  return LOCALES[locale].htmlLang;
}

function stripPath(pathname) {
  return String(pathname || "").split("?")[0].split("#")[0];
}

function hasLocalePrefix(pathname) {
  const path = stripPath(pathname);
  return path === "/en" || path.startsWith("/en/") || path === "/zh" || path.startsWith("/zh/");
}

function isUnder(path, root) {
  return path === root || path === root + "/" || path.startsWith(root + "/");
}

function isLocaleTreePath(pathname) {
  const path = stripPath(pathname);
  if (path === "/" || path === "") return true;
  if (STATIC_EXT.test(path)) return false;
  if (OUT_ROOTS.some((root) => isUnder(path, root))) return false;
  return TREE_ROOTS.some((root) => isUnder(path, root));
}

function pageIdentity(pathname) {
  let path = stripPath(pathname);
  if (path === "/en" || path.startsWith("/en/")) {
    path = path.slice(3) || "/";
  } else if (path === "/zh" || path.startsWith("/zh/")) {
    path = path.slice(3) || "/";
  }
  if (path === "") path = "/";
  if (path !== "/" && !path.endsWith("/")) path += "/";
  return path;
}

function isExternalOrFragment(href) {
  if (href.startsWith("#")) return true;
  return /^[a-z][a-z0-9+.-]*:/i.test(href);
}

function localeUrl(href, locale) {
  assertLocale(locale);
  if (isExternalOrFragment(href)) return href;
  if (!href.startsWith("/")) return href;

  const url = new URL(href, "https://namvietjscom.vn");
  const { pathname, search, hash } = url;

  if (hasLocalePrefix(pathname) && isLocaleTreePath(pageIdentity(pathname))) {
    throw new Error(`already-prefixed content path: ${pathname}`);
  }

  if (!isLocaleTreePath(pathname)) return href;

  return LOCALES[locale].prefix + pathname + search + hash;
}

function canonicalUrl(origin, href, locale) {
  assertLocale(locale);
  const pathname = new URL(href, "https://namvietjscom.vn").pathname;
  const identity = pageIdentity(pathname);
  const localizedPath = localeUrl(identity, locale);
  const base = String(origin).replace(/\/$/, "");
  return base + localizedPath;
}

function localized(value, locale) {
  assertLocale(locale);
  if (value == null) return "";
  const selected = value[locale];
  return selected == null ? "" : selected;
}

function flattenPairs(items, locales = Object.keys(LOCALES)) {
  const pairs = [];
  for (const item of items) {
    for (const locale of locales) {
      pairs.push({ item, locale });
    }
  }
  return pairs;
}

module.exports = {
  LOCALES,
  assertLocale,
  htmlLang,
  localeUrl,
  pageIdentity,
  canonicalUrl,
  localized,
  flattenPairs,
  isLocaleTreePath,
};
