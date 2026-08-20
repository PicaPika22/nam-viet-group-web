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
  it("news and products use permalink functions, not nested locale pagination yet", () => {
    assert.match(src("news/posts/posts.11tydata.js"), /permalink/);
    assert.match(src("products/items/items.11tydata.js"), /permalink/);
  });
});
