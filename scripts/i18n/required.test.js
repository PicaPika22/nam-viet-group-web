const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { validateNewsPost } = require("./required");

describe("validateNewsPost", () => {
  const ok = {
    title: { vi: "a", en: "b", zh: "c" },
    category: { vi: "a", en: "b", zh: "c" },
    excerpt: { vi: "a", en: "b", zh: "c" },
    body: { vi: "a", en: "b", zh: "c" },
  };
  it("accepts complete triads including copy-pasted VI", () => {
    validateNewsPost({ ...ok, title: { vi: "a", en: "a", zh: "a" } }, "slug");
  });
  it("fails blank zh with page identity and field", () => {
    assert.throws(
      () => validateNewsPost({ ...ok, body: { vi: "a", en: "b", zh: "  " } }, "hoi-thao"),
      /page=\/news\/hoi-thao\/[\s\S]*locale=zh[\s\S]*field=body/
    );
  });
});

const { validateProduct, validateJob } = require("./required");

describe("validateProduct", () => {
  const ok = {
    title: { vi: "a", en: "b", zh: "c" },
    summary: { vi: "a", en: "b", zh: "c" },
  };
  it("accepts complete triads including copy-pasted VI", () => {
    validateProduct({ ...ok, title: { vi: "a", en: "a", zh: "a" } }, "nv007");
  });
  it("fails blank zh with page identity and field", () => {
    assert.throws(
      () => validateProduct({ ...ok, summary: { vi: "a", en: "b", zh: "  " } }, "nv007"),
      /page=\/products\/nv007\/[\s\S]*locale=zh[\s\S]*field=summary/
    );
  });
});

describe("validateJob", () => {
  const ok = {
    title: { vi: "a", en: "b", zh: "c" },
    department: { vi: "a", en: "b", zh: "c" },
    location: { vi: "a", en: "b", zh: "c" },
    type: { vi: "a", en: "b", zh: "c" },
    summary: { vi: "a", en: "b", zh: "c" },
  };
  it("accepts complete triads including copy-pasted VI", () => {
    validateJob({ ...ok, title: { vi: "a", en: "a", zh: "a" } }, "prod-engineer");
  });
  it("fails blank zh with page identity and field", () => {
    assert.throws(
      () => validateJob({ ...ok, summary: { vi: "a", en: "b", zh: "  " } }, "prod-engineer"),
      /page=\/careers\/[\s\S]*locale=zh[\s\S]*field=summary/
    );
  });
});
