const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  SECTION_IDS,
  validateHome,
  mergeLockedHrefs,
  applyOrder,
  documentsEqual,
  minimalValidDocument,
  LOCKED_HREFS,
} = require("./schema");

describe("validateHome", () => {
  it("accepts a minimal valid document", () => {
    const r = validateHome(minimalValidDocument());
    assert.equal(r.ok, true);
    assert.equal(r.fields.length, 0);
  });

  it("rejects wrong section count", () => {
    const doc = minimalValidDocument();
    doc.sections.pop();
    const r = validateHome(doc);
    assert.equal(r.ok, false);
    assert.ok(r.fields.some((f) => f.path === "sections"));
  });

  it("rejects duplicate ids", () => {
    const doc = minimalValidDocument();
    doc.sections[1].id = "hero";
    const r = validateHome(doc);
    assert.equal(r.ok, false);
  });

  it("rejects missing language copy", () => {
    const doc = minimalValidDocument();
    doc.sections[0].content.vi.eyebrow = "";
    const r = validateHome(doc);
    assert.equal(r.ok, false);
    assert.ok(r.fields.some((f) => f.path.includes("hero") && f.path.includes("vi")));
  });

  it("rejects unknown image slot on upload allowlist", () => {
    const { isAllowedUpload } = require("./schema");
    assert.equal(isAllowedUpload("hero", "art"), true);
    assert.equal(isAllowedUpload("hero", "logo"), false);
    assert.equal(isAllowedUpload("news", "art"), false);
  });

  it("rejects null section without throwing", () => {
    const doc = minimalValidDocument();
    doc.sections[0] = null;
    const r = validateHome(doc);
    assert.equal(r.ok, false);
    assert.ok(r.fields.some((f) => f.path === "sections[0]"));
  });

  it("rejects stats object without throwing", () => {
    const doc = minimalValidDocument();
    doc.sections[0].stats = {};
    const r = validateHome(doc);
    assert.equal(r.ok, false);
    assert.ok(r.fields.some((f) => f.path === "hero.stats"));
  });
});

describe("mergeLockedHrefs", () => {
  it("overwrites client hrefs with canonical map", () => {
    const doc = minimalValidDocument();
    doc.sections[0].cta.primary.href = "https://evil.example";
    const published = minimalValidDocument();
    const merged = mergeLockedHrefs(doc, published);
    const hero = merged.sections.find((s) => s.id === "hero");
    assert.equal(hero.cta.primary.href, LOCKED_HREFS.hero.primary);
    assert.equal(hero.cta.secondary.href, LOCKED_HREFS.hero.secondary);
    assert.equal(hero.cta.scroll.href, LOCKED_HREFS.hero.scroll);
  });

  it("does not persist mutated product hrefs", () => {
    const doc = minimalValidDocument();
    const products = doc.sections.find((s) => s.id === "products");
    products.items[0].href = "/hacked/";
    const merged = mergeLockedHrefs(doc, minimalValidDocument());
    const item = merged.sections.find((s) => s.id === "products").items[0];
    assert.equal(item.href, "/products/nv007/");
  });
});

describe("applyOrder", () => {
  it("rewrites order 1..12 from array position", () => {
    const doc = minimalValidDocument();
    const hero = doc.sections.find((s) => s.id === "hero");
    const about = doc.sections.find((s) => s.id === "about");
    doc.sections = [about, ...doc.sections.filter((s) => s.id !== "about" && s.id !== "hero"), hero];
    const ordered = applyOrder(doc);
    assert.equal(ordered.sections[0].id, "about");
    assert.equal(ordered.sections[0].order, 1);
    assert.equal(ordered.sections[11].id, "hero");
    assert.equal(ordered.sections[11].order, 12);
  });
});

describe("documentsEqual", () => {
  it("treats key order as equal", () => {
    const a = { version: 1, sections: [] };
    const b = { sections: [], version: 1 };
    assert.equal(documentsEqual(a, b), true);
  });
});
