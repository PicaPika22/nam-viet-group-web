const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const src = (p) => fs.readFileSync(path.resolve(__dirname, "../../src", p), "utf8");

describe("current emission inventory", () => {
  it("company and leadership person paginate flattenPairs (one axis)", () => {
    const company = src("companies/company.njk");
    const person = src("about/leadership/person.njk");
    const eleventy = fs.readFileSync(path.resolve(__dirname, "../../.eleventy.js"), "utf8");
    assert.match(eleventy, /addGlobalData\("companyLocales"/);
    assert.match(eleventy, /addGlobalData\("leadershipPersonLocales"/);
    assert.match(eleventy, /flattenPairs/);
    assert.match(company, /data:\s*companyLocales/);
    assert.match(company, /alias:\s*render/);
    assert.match(company, /localeUrl\('\/companies\/' \+ render\.item\.id/);
    assert.doesNotMatch(company, /pagination:[\s\S]*pagination:/);
    assert.match(person, /data:\s*leadershipPersonLocales/);
    assert.match(person, /alias:\s*render/);
    assert.match(person, /localeUrl\('\/about\/leadership\/' \+ render\.item\.id/);
    assert.doesNotMatch(person, /pagination:[\s\S]*pagination:/);
  });
  it("news and products paginate flattenPairs (one axis)", () => {
    const post = src("news/post-locale.njk");
    const product = src("products/product-locale.njk");
    const eleventy = fs.readFileSync(path.resolve(__dirname, "../../.eleventy.js"), "utf8");
    assert.match(eleventy, /addGlobalData\("newsLocales"/);
    assert.match(eleventy, /addGlobalData\("productLocales"/);
    assert.match(src("news/posts/posts.11tydata.js"), /permalink:\s*false/);
    assert.match(src("products/items/items.11tydata.js"), /permalink:\s*false/);
    assert.match(post, /data:\s*newsLocales/);
    assert.match(post, /alias:\s*render/);
    assert.match(post, /localeUrl\('\/news\/' \+ render\.item\.fileSlug/);
    assert.doesNotMatch(post, /pagination:[\s\S]*pagination:/);
    assert.match(product, /data:\s*productLocales/);
    assert.match(product, /alias:\s*render/);
    assert.match(product, /localeUrl\('\/products\/' \+ render\.item\.fileSlug/);
    assert.doesNotMatch(product, /pagination:[\s\S]*pagination:/);
  });
});

const ROOT = path.resolve(__dirname, "../../");

function walkNjk(dir, acc = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (/^(admin|dashboard|_cms)$/.test(name.name)) continue;
      walkNjk(full, acc);
    } else if (name.name.endsWith(".njk")) acc.push(full);
  }
  return acc;
}

describe("one locale per document", () => {
  it("i18n macros emit obj[locale] without lang spans", () => {
    const macros = src("_includes/macros/i18n.njk");
    assert.match(macros, /obj\[locale\]/);
    assert.match(macros, /obj\[locale\]\s*\|\s*md/);
    assert.doesNotMatch(macros, /class="lang en"/);
    assert.doesNotMatch(macros, /class="lang vi"/);
    assert.doesNotMatch(macros, /class="lang zh"/);
  });

  it("base html lang uses locale and htmlLang", () => {
    const base = src("_includes/layouts/base.njk");
    assert.match(base, /set locale = locale or render\.locale or "vi"/);
    assert.match(base, /<html lang="\{\{\s*locale\s*\|\s*htmlLang\s*\}\}" data-lang="\{\{\s*locale\s*\}\}">/);
  });

  it("head canonical and og:url use canonicalUrl", () => {
    const head = src("_includes/partials/head.njk");
    assert.match(head, /canonicalUrl\(site\.url, page\.url, locale\)/);
    assert.equal(
      (head.match(/canonicalUrl\(site\.url, page\.url, locale\)/g) || []).length,
      2
    );
  });

  it("header switcher is localeUrl links without hreflang or data-set-lang", () => {
    const header = src("_includes/partials/header.njk");
    assert.match(header, /localeUrl\(pageIdentity\(page\.url\),\s*'vi'\)/);
    assert.match(header, /localeUrl\(pageIdentity\(page\.url\),\s*'en'\)/);
    assert.match(header, /localeUrl\(pageIdentity\(page\.url\),\s*'zh'\)/);
    assert.match(header, />VI</);
    assert.match(header, />EN</);
    assert.match(header, />中文</);
    assert.doesNotMatch(header, /hreflang=/);
    assert.doesNotMatch(header, /data-set-lang/);
    assert.match(header, /itemHref\s*\|\s*localeUrl\(locale\)\s*\|\s*url/);
  });

  it("navActive compares pageIdentity to unprefixed hrefs", () => {
    const eleventy = fs.readFileSync(path.join(ROOT, ".eleventy.js"), "utf8");
    const fn = eleventy.match(/addFilter\("navActive",[\s\S]*?\n  \}\);/);
    assert.ok(fn, "navActive filter");
    assert.match(fn[0], /pageIdentity\(/);
  });

  it("static locale-tree pages paginate locales", () => {
    const pages = [
      ["index.njk", "/"],
      ["about.njk", "/about/"],
      ["about/leadership/index.njk", "/about/leadership/"],
      ["companies/index.njk", "/companies/"],
      ["products/index.njk", "/products/"],
      ["news/index.njk", "/news/"],
      ["careers.njk", "/careers/"],
      ["contact.njk", "/contact/"],
      ["investors.njk", "/investors/"],
      ["sustainability.njk", "/sustainability/"],
      ["downloads.njk", "/downloads/"],
      ["privacy.njk", "/privacy/"],
      ["cookies.njk", "/cookies/"],
      ["terms.njk", "/terms/"],
    ];
    for (const [file, ident] of pages) {
      const t = src(file);
      assert.match(t, /data:\s*locales/, file);
      assert.match(t, /alias:\s*locale/, file);
      assert.match(
        t,
        new RegExp(
          `permalink:\\s*"\\{\\{\\s*localeUrl\\('${ident.replace(/\//g, "\\/")}',\\s*locale\\)\\s*\\}\\}"`
        ),
        file
      );
    }
  });

  it("does not locale-paginate robots, sitemap, news feed", () => {
    assert.doesNotMatch(src("robots.njk"), /data:\s*locales/);
    assert.doesNotMatch(src("sitemap.njk"), /data:\s*locales/);
    assert.doesNotMatch(src("news/feed.njk"), /data:\s*locales/);
    assert.match(src("robots.njk"), /permalink:\s*\/robots\.txt/);
    assert.match(src("sitemap.njk"), /permalink:\s*\/sitemap\.xml/);
    assert.match(src("news/feed.njk"), /permalink:\s*\/news\/feed\.xml/);
  });

  it("public njk has no class=\"lang en|vi|zh\" triples", () => {
    const hits = [];
    for (const file of walkNjk(path.join(ROOT, "src"))) {
      const text = fs.readFileSync(file, "utf8");
      if (/class="lang (en|vi|zh)"/.test(text)) {
        hits.push(path.relative(ROOT, file));
      }
    }
    assert.deepEqual(hits, []);
  });
});
