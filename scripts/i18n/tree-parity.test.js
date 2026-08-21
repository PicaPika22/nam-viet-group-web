const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { localeUrl } = require("./locale");

const ROOT = path.resolve(__dirname, "../..");
const SITE = path.join(ROOT, "_site");
const SRC = path.join(ROOT, "src");
const IGNORE = new Set(["admin", "dashboard", "mobile-concept"]);
const NEWS_SLUG = "hoi-thao-khoa-hoc";

function readSrc(rel) {
  return fs.readFileSync(path.join(SRC, rel), "utf8");
}

function viewSite(unprefixedPath, siteUrl, lang) {
  const origin = String(siteUrl || "").replace(/\/$/, "");
  const prefixed = localeUrl(
    unprefixedPath,
    lang === "en" || lang === "zh" ? lang : "vi"
  );
  if (!origin) return prefixed;
  return origin + prefixed;
}

function walkIndexHtml(dir, acc = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(name.name)) continue;
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walkIndexHtml(full, acc);
    else if (name.name === "index.html") acc.push(full);
  }
  return acc;
}

function posixRel(file) {
  return path.relative(SITE, file).split(path.sep).join("/");
}

function fileToIdentity(file) {
  const rel = posixRel(file);
  let p = "/" + rel.replace(/\/index\.html$/, "").replace(/^index\.html$/, "");
  if (p === "") p = "/";
  if (!p.endsWith("/")) p += "/";
  if (p === "/en/" || p === "/zh/") return "/";
  if (p.startsWith("/en/")) return p.slice(3);
  if (p.startsWith("/zh/")) return p.slice(3);
  return p;
}

function fileToLocale(file) {
  const rel = posixRel(file);
  if (rel === "en/index.html" || rel.startsWith("en/")) return "en";
  if (rel === "zh/index.html" || rel.startsWith("zh/")) return "zh";
  return "vi";
}

function hasSiblingLangTriples(html) {
  return (
    /class="lang en"/.test(html) &&
    /class="lang vi"/.test(html) &&
    /class="lang zh"/.test(html)
  );
}

function htmlLangAttr(html) {
  const m = html.match(/<html[^>]*\slang="([^"]+)"/i);
  return m ? m[1] : "";
}

function canonicalHref(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1] : "";
}

describe("viewSite contract", () => {
  it("is frozen origin plus localeUrl(unprefixed, editor locale)", () => {
    assert.equal(viewSite("/", "https://namvietjsc.vn/", "en"), "https://namvietjsc.vn/en/");
    assert.equal(viewSite("/", "https://namvietjsc.vn/", "vi"), "https://namvietjsc.vn/");
    assert.equal(
      viewSite(`/news/${NEWS_SLUG}/`, "https://namvietjsc.vn/", "zh"),
      `https://namvietjsc.vn/zh/news/${NEWS_SLUG}/`
    );
    assert.equal(viewSite("/", "", "en"), "/en/");
    assert.equal(viewSite("/news/x/", "", "de"), "/news/x/");
  });
});

describe("public JS, CMS view-site, trailing slash source", () => {
  it("does not let nv-lang override the public document", () => {
    const main = readSrc("js/main.js");
    assert.doesNotMatch(main, /nv-lang/);
    assert.doesNotMatch(main, /localStorage\.setItem\("nv-lang"/);
    assert.doesNotMatch(main, /localStorage\.getItem\("nv-lang"/);
    assert.doesNotMatch(main, /setLang\(/);
    assert.doesNotMatch(main, /setAttribute\("lang"/);
    assert.doesNotMatch(main, /zh-CN/);
  });

  it("reads data-lang as document locale without defaulting vi pages to en", () => {
    const site = readSrc("js/site.js");
    assert.doesNotMatch(site, /getAttribute\("data-lang"\)\s*\|\|\s*"en"/);
  });

  it("CMS view-site uses editor state.lang and localeUrl", () => {
    const admin = readSrc("admin/admin.js");
    const dashboard = readSrc("dashboard/dashboard.js");
    assert.match(admin, /function viewSite\(path\)/);
    assert.match(admin, /localeUrl\(/);
    assert.match(admin, /state\.lang === "en" \|\| state\.lang === "zh"/);
    assert.match(admin, /\$\("#siteLink"\)\.href = viewSite\("\/"\)/);
    assert.match(admin, /viewSite\(`\/news\/\$\{item\.slug\}\/`\)/);
    assert.match(dashboard, /function viewSite\(path\)/);
    assert.match(dashboard, /viewSite\("\/"\)/);
  });

  it("vercel trailingSlash is true", () => {
    const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
    assert.equal(vercel.trailingSlash, true);
  });
});

describe("locale tree parity", { timeout: 120000 }, () => {
  before(() => {
    const eleventyBin = path.join(ROOT, "node_modules", "@11ty", "eleventy", "cmd.cjs");
    execFileSync(process.execPath, [eleventyBin, "--quiet"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  });

  it("VI, EN, and ZH identity sets are 1:1:1", () => {
    const files = walkIndexHtml(SITE);
    const sets = { vi: new Set(), en: new Set(), zh: new Set() };
    for (const file of files) {
      sets[fileToLocale(file)].add(fileToIdentity(file));
    }
    const vi = [...sets.vi].sort();
    const en = [...sets.en].sort();
    const zh = [...sets.zh].sort();
    assert.ok(vi.length > 0, "VI tree is non-empty");
    assert.deepEqual(en, vi);
    assert.deepEqual(zh, vi);
  });

  it("EN about is self-canonical with html lang=en and no sibling lang triples", () => {
    const html = fs.readFileSync(path.join(SITE, "en", "about", "index.html"), "utf8");
    assert.equal(htmlLangAttr(html), "en");
    assert.equal(canonicalHref(html), "https://namvietjsc.vn/en/about/");
    assert.equal(hasSiblingLangTriples(html), false);
  });

  it("ZH about uses lang=zh-Hans", () => {
    const html = fs.readFileSync(path.join(SITE, "zh", "about", "index.html"), "utf8");
    assert.equal(htmlLangAttr(html), "zh-Hans");
    assert.equal(canonicalHref(html), "https://namvietjsc.vn/zh/about/");
  });

  it("news slug exists in all three locales", () => {
    for (const prefix of ["", "en/", "zh/"]) {
      const file = path.join(SITE, ...`${prefix}news/${NEWS_SLUG}/index.html`.split("/"));
      assert.equal(fs.existsSync(file), true, file);
    }
  });

  it("assets stay at _site/assets, not under a locale prefix", () => {
    assert.equal(fs.existsSync(path.join(SITE, "assets")), true);
    assert.equal(fs.existsSync(path.join(SITE, "en", "assets")), false);
    assert.equal(fs.existsSync(path.join(SITE, "zh", "assets")), false);
  });
});
