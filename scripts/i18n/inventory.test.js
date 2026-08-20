const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const src = (p) => fs.readFileSync(path.resolve(__dirname, "../../src", p), "utf8");

describe("current emission inventory", () => {
  it("company and leadership person already paginate items", () => {
    assert.match(src("companies/company.njk"), /pagination:/);
    assert.match(src("about/leadership/person.njk"), /pagination:/);
  });
  it("news and products use permalink functions, not nested locale pagination yet", () => {
    assert.match(src("news/posts/posts.11tydata.js"), /permalink/);
    assert.match(src("products/items/items.11tydata.js"), /permalink/);
  });
});
