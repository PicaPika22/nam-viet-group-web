const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  LOCALES,
  localeUrl,
  localized,
  pageIdentity,
  canonicalUrl,
  flattenPairs,
  htmlLang,
} = require("./locale");

describe("localeUrl", () => {
  it("prefixes locale-tree paths and preserves query and hash", () => {
    assert.equal(localeUrl("/about/", "en"), "/en/about/");
    assert.equal(localeUrl("/about/", "vi"), "/about/");
    assert.equal(localeUrl("/products/nv007/", "zh"), "/zh/products/nv007/");
    assert.equal(localeUrl("/news/?page=2", "en"), "/en/news/?page=2");
    assert.equal(localeUrl("/careers/#prod-engineer", "en"), "/en/careers/#prod-engineer");
  });
  it("does not prefix assets, admin, feeds, files, or schemes", () => {
    assert.equal(localeUrl("/assets/img/hero.png", "en"), "/assets/img/hero.png");
    assert.equal(localeUrl("/admin/", "en"), "/admin/");
    assert.equal(localeUrl("/dashboard/", "zh"), "/dashboard/");
    assert.equal(localeUrl("/mobile-concept/", "en"), "/mobile-concept/");
    assert.equal(localeUrl("/robots.txt", "en"), "/robots.txt");
    assert.equal(localeUrl("/sitemap.xml", "en"), "/sitemap.xml");
    assert.equal(localeUrl("/news/feed.xml", "en"), "/news/feed.xml");
    assert.equal(localeUrl("/downloads/file.pdf", "en"), "/downloads/file.pdf");
    assert.equal(localeUrl("https://partner.example/", "en"), "https://partner.example/");
    assert.equal(localeUrl("https://namvietjscom.vn/about/", "en"), "https://namvietjscom.vn/about/");
    assert.equal(localeUrl("mailto:a@b.c", "vi"), "mailto:a@b.c");
    assert.equal(localeUrl("tel:+1", "zh"), "tel:+1");
    assert.equal(localeUrl("#prod-engineer", "en"), "#prod-engineer");
  });
  it("throws on already-prefixed content paths and invalid locale", () => {
    assert.throws(() => localeUrl("/en/about/", "vi"));
    assert.throws(() => localeUrl("/zh/news/foo/", "en"));
    assert.throws(() => localeUrl("/about/", "de"));
  });
});

describe("localized", () => {
  it("returns one locale and does not fall back", () => {
    assert.equal(localized({ vi: "a", en: "b", zh: "c" }, "en"), "b");
    assert.equal(localized({ vi: "a", en: "", zh: "c" }, "en"), "");
    assert.throws(() => localized({ vi: "a" }, "nope"));
  });
});

describe("identity and canonical", () => {
  it("strips locale prefix for identity", () => {
    assert.equal(pageIdentity("/en/about/"), "/about/");
    assert.equal(pageIdentity("/zh/products/nv007/"), "/products/nv007/");
    assert.equal(pageIdentity("/"), "/");
    assert.equal(pageIdentity("/en/"), "/");
  });
  it("canonical is origin + pathname only", () => {
    assert.equal(
      canonicalUrl("https://namvietjscom.vn", "/careers/#x", "en"),
      "https://namvietjscom.vn/en/careers/"
    );
    assert.equal(
      canonicalUrl("https://namvietjscom.vn", "/news/?page=2", "zh"),
      "https://namvietjscom.vn/zh/news/"
    );
    assert.equal(htmlLang("zh"), "zh-Hans");
  });
});

describe("flattenPairs", () => {
  it("is a cartesian product, not nested groups", () => {
    const items = [{ id: "nv007" }, { id: "nv888" }];
    const pairs = flattenPairs(items);
    assert.equal(pairs.length, 6);
    assert.deepEqual(
      pairs.map((p) => p.item.id + ":" + p.locale),
      ["nv007:vi", "nv007:en", "nv007:zh", "nv888:vi", "nv888:en", "nv888:zh"]
    );
  });
});
