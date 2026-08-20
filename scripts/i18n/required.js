const LOCALES = ["vi", "en", "zh"];

function isBlank(value) {
  return value == null || String(value).trim() === "";
}

function assertRequiredTriad(value, { page, field }) {
  for (const locale of LOCALES) {
    const part = value && typeof value === "object" ? value[locale] : undefined;
    if (isBlank(part)) {
      throw new Error(`page=${page} locale=${locale} field=${field}`);
    }
  }
}

function validateFields(data, fields, page) {
  for (const field of fields) {
    assertRequiredTriad(data && data[field], { page, field });
  }
}

function validateNewsPost(data, slug) {
  validateFields(data, ["title", "category", "excerpt", "body"], `/news/${slug}/`);
}

function validateProduct(data, slug) {
  validateFields(data, ["title", "summary"], `/products/${slug}/`);
}

function validateJob(data, id) {
  validateFields(data, ["title", "department", "location", "type", "summary"], "/careers/");
}

module.exports = {
  assertRequiredTriad,
  validateNewsPost,
  validateProduct,
  validateJob,
};
