const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { localeUrl, pageIdentity } = require("./locale");

const ROOT = path.resolve(__dirname, "../..");
const SITE_JS = path.join(ROOT, "src/js/site.js");
const SEARCH_INDEX = path.join(ROOT, "src/_data/searchIndex.js");

function readSiteJs() {
  return fs.readFileSync(SITE_JS, "utf8");
}

function loadSearchIndex() {
  const mod = path.join(ROOT, "src/_data/searchIndex.js");
  delete require.cache[require.resolve(mod)];
  return require(mod)();
}

describe("search nav source contract", () => {
  it("does not assign a.href = item.url without locale prefixing", () => {
    const src = readSiteJs();
    assert.doesNotMatch(src, /a\.href\s*=\s*item\.url\b/);
  });

  it("does not fall back to English title or body in renderSearch", () => {
    const src = readSiteJs();
    const renderBlock = src.match(/const renderSearch[\s\S]*?^  };/m);
    assert.ok(renderBlock, "renderSearch function should exist");
    const block = renderBlock[0];
    assert.doesNotMatch(block, /item\.title\?\.\s*en/);
    assert.doesNotMatch(block, /item\.body\?\.\s*en/);
  });

  it("prefixes search hrefs using documentLocale and localeUrl helper", () => {
    const src = readSiteJs();
    assert.match(src, /function localeUrl\s*\(/);
    assert.match(src, /localeUrl\s*\(\s*item\.url\s*,\s*lang\s*\)/);
    assert.match(src, /const documentLocale\s*=/);
  });
});

describe("searchIndex href contract", () => {
  it("stores unprefixed locale-tree paths", () => {
    const index = loadSearchIndex();
    for (const item of index) {
      assert.match(item.url, /^\//, `url should be root-relative: ${item.url}`);
      assert.doesNotMatch(item.url, /^\/en\//, `url should not be EN-prefixed: ${item.url}`);
      assert.doesNotMatch(item.url, /^\/zh\//, `url should not be ZH-prefixed: ${item.url}`);
    }
  });

  it("localeUrl maps every index url for vi, en, and zh", () => {
    const index = loadSearchIndex();
    for (const item of index) {
      assert.equal(localeUrl(item.url, "vi"), item.url);
      assert.equal(pageIdentity(localeUrl(item.url, "en")), pageIdentity(item.url));
      assert.equal(pageIdentity(localeUrl(item.url, "zh")), pageIdentity(item.url));
      assert.match(localeUrl(item.url, "en"), /^\/en(\/|$)/);
      assert.match(localeUrl(item.url, "zh"), /^\/zh(\/|$)/);
    }
  });
});
