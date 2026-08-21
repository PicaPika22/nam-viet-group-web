const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const SRC = path.join(ROOT, "src");
const ORIGIN = "https://namvietjsc.vn";
const PAGE = /https:\/\/namvietjsc\.vn(?:\/en|\/zh)?\/(?:about|companies|products|news|careers|contact|investors|sustainability|downloads|privacy|cookies|terms)(?:\/[^\s"'`)]*)?/gi;

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, acc);
    else if (/\.(njk|md|json|js|html)$/.test(name.name)) acc.push(p);
  }
  return acc;
}

describe("same-origin absolute public page links", () => {
  it("are absent from src (except site.json url field)", () => {
    const hits = [];
    for (const file of walk(SRC)) {
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      if (rel === "src/_data/site.json") continue;
      const text = fs.readFileSync(file, "utf8");
      const found = text.match(PAGE);
      if (found) hits.push({ rel, found });
    }
    assert.deepEqual(hits, []);
  });
});
