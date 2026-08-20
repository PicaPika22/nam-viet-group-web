const crypto = require("crypto");

const LANGS = ["en", "vi", "zh"];
const SECTION_IDS = [
  "hero",
  "about",
  "ecosystem",
  "manufacturing",
  "products",
  "logistics",
  "network",
  "sustainability",
  "leadership",
  "milestones",
  "news",
  "contact",
];

const CONTENT_KEYS = {
  hero: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary", "ctaSecondary", "scroll"],
  about: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "body"],
  ecosystem: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  manufacturing: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  products: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  logistics: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  network: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  sustainability: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  leadership: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "body", "ctaPrimary"],
  milestones: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "bannerStatement"],
  news: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
  contact: ["chapterLabel", "titleLine1", "titleLine2", "lead", "ctaPrimary", "ctaSecondary"],
};

const IMAGE_SLOTS = {
  hero: ["art"],
  about: ["media"],
  ecosystem: ["background"],
  manufacturing: ["media"],
  products: ["nv007", "nv-10s", "nv888", "nv40", "nv530"],
  logistics: ["background"],
  network: [],
  sustainability: ["media"],
  leadership: ["media"],
  milestones: ["banner"],
  news: [],
  contact: ["background"],
};

const STAT_COUNTS = {
  hero: 2,
  about: 4,
  manufacturing: 4,
  logistics: 3,
  milestones: 4,
};

const PRODUCT_IDS = ["nv007", "nv-10s", "nv888", "nv40", "nv530"];
const PRODUCT_HREFS = {
  nv007: "/products/nv007/",
  "nv-10s": "/products/nv-10s/",
  nv888: "/products/nv888/",
  nv40: "/products/nv40/",
  nv530: "/products/nv530/",
};
const PARTNER_IDS = [
  "van-aarsen",
  "bunge",
  "wilmar",
  "ajinomoto",
  "anderson",
  "andritz",
  "cargill",
  "cj",
  "olmix",
];
const PARTNER_URLS = {
  "van-aarsen": "https://www.vanaarsen.com/",
  bunge: "https://www.bunge.com/",
  wilmar: "https://www.wilmar-international.com/",
  ajinomoto: "https://www.ajinomoto.com/",
  anderson: "https://www.andersonintl.com/",
  andritz: "https://www.andritz.com/",
  cargill: "https://www.cargill.com/",
  cj: "https://www.cj.net/",
  olmix: "https://www.olmix.com/",
};
const FLOW_COUNT = 8;
const CHECK_COUNT = 4;
const TIMELINE_ICONS = ["building", "farm", "lab", "warehouse", "globe"];

const LOCKED_HREFS = {
  hero: { primary: "/#about", secondary: "/#ecosystem", scroll: "/#about" },
  ecosystem: { primary: "/about/#ecosystem" },
  manufacturing: { primary: "/products/" },
  products: { primary: "/products/" },
  logistics: { primary: "/#network" },
  network: { primary: "/contact/?type=partner" },
  sustainability: { primary: "/sustainability/" },
  leadership: { primary: "/about/leadership/" },
  news: { primary: "/news/" },
  contact: { primary: "/contact/?type=partner", secondary: "/contact/" },
};

function emptyI18n(value = "x") {
  return { en: value, vi: value, zh: value };
}

function emptySection(id) {
  const content = { en: {}, vi: {}, zh: {} };
  for (const key of CONTENT_KEYS[id]) {
    for (const lang of LANGS) content[lang][key] = "x";
  }
  const images = {};
  for (const slot of IMAGE_SLOTS[id]) images[slot] = `/assets/img/home/${id}-${slot}.jpg`;
  const cta = {};
  const hrefs = LOCKED_HREFS[id] || {};
  if (hrefs.primary) cta.primary = { href: hrefs.primary };
  if (hrefs.secondary) cta.secondary = { href: hrefs.secondary };
  if (hrefs.scroll) cta.scroll = { href: hrefs.scroll };
  const stats = [];
  const n = STAT_COUNTS[id] || 0;
  for (let i = 0; i < n; i++) {
    stats.push({
      id: `s${i + 1}`,
      value: "1",
      suffix: "",
      count: 1,
      decimals: 0,
      icon: "",
      label: emptyI18n("x"),
    });
  }
  let items = [];
  if (id === "ecosystem") {
    items = Array.from({ length: FLOW_COUNT }, (_, i) => ({
      id: `flow-${i + 1}`,
      label: emptyI18n("x"),
    }));
  }
  if (id === "manufacturing") {
    items = Array.from({ length: CHECK_COUNT }, (_, i) => ({
      id: `check-${i + 1}`,
      label: emptyI18n("x"),
    }));
  }
  if (id === "products") {
    items = PRODUCT_IDS.map((pid) => ({
      id: pid,
      code: pid.toUpperCase(),
      href: PRODUCT_HREFS[pid],
      name: emptyI18n("x"),
    }));
  }
  if (id === "network") {
    items = PARTNER_IDS.map((pid) => ({
      id: pid,
      name: pid,
      url: PARTNER_URLS[pid],
      image: `/assets/img/partners/${pid}.png`,
    }));
  }
  const timeline =
    id === "milestones"
      ? [
          {
            id: "m-seed",
            year: "2002",
            icon: "building",
            image: "/assets/img/milestones/2002.jpg",
            title: emptyI18n("x"),
            description: emptyI18n("x"),
          },
        ]
      : [];
  return {
    id,
    visible: true,
    order: SECTION_IDS.indexOf(id) + 1,
    content,
    images,
    stats,
    items,
    timeline,
    cta,
  };
}

function minimalValidDocument() {
  return {
    version: 1,
    sections: SECTION_IDS.map(emptySection),
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

function documentsEqual(a, b) {
  return stableStringify(a) === stableStringify(b);
}

function applyOrder(doc) {
  const next = clone(doc);
  next.sections.forEach((s, i) => {
    s.order = i + 1;
  });
  return next;
}

function mergeLockedHrefs(doc, _publishedDoc) {
  const next = clone(doc);
  for (const section of next.sections) {
    const hrefs = LOCKED_HREFS[section.id] || {};
    section.cta = section.cta || {};
    if (hrefs.primary) section.cta.primary = { href: hrefs.primary };
    if (hrefs.secondary) section.cta.secondary = { href: hrefs.secondary };
    if (hrefs.scroll) section.cta.scroll = { href: hrefs.scroll };
    if (section.id === "products") {
      for (const item of section.items || []) {
        if (PRODUCT_HREFS[item.id]) item.href = PRODUCT_HREFS[item.id];
      }
    }
    if (section.id === "network") {
      for (const item of section.items || []) {
        if (PARTNER_URLS[item.id]) item.url = PARTNER_URLS[item.id];
      }
    }
  }
  return next;
}

function field(path, message, fields) {
  fields.push({ path, message });
}

function nonEmpty(value) {
  return String(value || "").trim().length > 0;
}

function validateHome(doc) {
  const fields = [];
  if (!doc || typeof doc !== "object") {
    return { ok: false, fields: [{ path: "", message: "Document required" }] };
  }
  if (doc.version !== 1) field("version", "version must be 1", fields);
  if (!Array.isArray(doc.sections) || doc.sections.length !== 12) {
    field("sections", "Must contain exactly 12 sections", fields);
    return { ok: false, fields };
  }
  const seen = new Set();
  for (const id of SECTION_IDS) {
    const section = doc.sections.find((s) => s.id === id);
    if (!section) field("sections", `Missing section ${id}`, fields);
  }
  for (const section of doc.sections) {
    if (!SECTION_IDS.includes(section.id)) field(`sections.${section.id}`, "Unknown id", fields);
    if (seen.has(section.id)) field(`sections.${section.id}`, "Duplicate id", fields);
    seen.add(section.id);
    if (typeof section.visible !== "boolean") field(`${section.id}.visible`, "visible must be boolean", fields);
    const keys = CONTENT_KEYS[section.id] || [];
    for (const lang of LANGS) {
      for (const key of keys) {
        if (!nonEmpty(section.content?.[lang]?.[key])) {
          field(`${section.id}.content.${lang}.${key}`, "Required", fields);
        }
      }
    }
    for (const slot of IMAGE_SLOTS[section.id] || []) {
      const url = section.images?.[slot];
      if (!nonEmpty(url) || !String(url).startsWith("/assets/img/")) {
        field(`${section.id}.images.${slot}`, "Image slot required", fields);
      }
    }
    const wantStats = STAT_COUNTS[section.id] || 0;
    if ((section.stats || []).length !== wantStats) {
      field(`${section.id}.stats`, `Must have ${wantStats} stats`, fields);
    }
    for (const stat of section.stats || []) {
      for (const lang of LANGS) {
        if (!nonEmpty(stat.label?.[lang])) field(`${section.id}.stats.${stat.id}.${lang}`, "Required", fields);
      }
    }
    if (section.id === "ecosystem" && (section.items || []).length !== FLOW_COUNT) {
      field("ecosystem.items", `Must have ${FLOW_COUNT} flow steps`, fields);
    }
    if (section.id === "manufacturing" && (section.items || []).length !== CHECK_COUNT) {
      field("manufacturing.items", `Must have ${CHECK_COUNT} checks`, fields);
    }
    if (section.id === "products") {
      const ids = (section.items || []).map((i) => i.id);
      if (ids.join() !== PRODUCT_IDS.join()) field("products.items", "Product ids/order are fixed", fields);
    }
    if (section.id === "network") {
      const ids = new Set((section.items || []).map((i) => i.id));
      for (const pid of PARTNER_IDS) {
        if (!ids.has(pid)) field("network.items", `Missing partner ${pid}`, fields);
      }
      if ((section.items || []).length !== PARTNER_IDS.length) {
        field("network.items", "Cannot add or delete partners in phase 1", fields);
      }
    }
    if (section.id === "milestones") {
      for (const row of section.timeline || []) {
        if (!nonEmpty(row.id) || !nonEmpty(row.year)) field(`milestones.timeline.${row.id}`, "id and year required", fields);
        if (row.icon && !TIMELINE_ICONS.includes(row.icon)) {
          field(`milestones.timeline.${row.id}.icon`, "Invalid icon", fields);
        }
        for (const lang of LANGS) {
          if (!nonEmpty(row.title?.[lang]) || !nonEmpty(row.description?.[lang])) {
            field(`milestones.timeline.${row.id}.${lang}`, "title and description required", fields);
          }
        }
        if (!nonEmpty(row.image) || !String(row.image).startsWith("/assets/img/")) {
          field(`milestones.timeline.${row.id}.image`, "Image required", fields);
        }
      }
    }
  }
  return { ok: fields.length === 0, fields };
}

function isAllowedUpload(sectionId, slot) {
  if (sectionId === "milestones" && String(slot).startsWith("timeline:")) return true;
  if (sectionId === "network" && String(slot).startsWith("partner:")) {
    return PARTNER_IDS.includes(slot.slice("partner:".length));
  }
  return (IMAGE_SLOTS[sectionId] || []).includes(slot);
}

function newMilestoneId() {
  return `m-${Date.now().toString(36)}-${crypto.randomBytes(2).toString("hex")}`;
}

module.exports = {
  LANGS,
  SECTION_IDS,
  CONTENT_KEYS,
  IMAGE_SLOTS,
  STAT_COUNTS,
  PRODUCT_IDS,
  PRODUCT_HREFS,
  PARTNER_IDS,
  PARTNER_URLS,
  FLOW_COUNT,
  CHECK_COUNT,
  TIMELINE_ICONS,
  LOCKED_HREFS,
  validateHome,
  mergeLockedHrefs,
  applyOrder,
  documentsEqual,
  minimalValidDocument,
  isAllowedUpload,
  newMilestoneId,
};
