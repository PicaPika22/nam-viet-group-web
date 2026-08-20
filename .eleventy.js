const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const markdownIt = require("markdown-it");
const {
  LOCALES,
  localeUrl,
  localized,
  pageIdentity,
  canonicalUrl,
  htmlLang,
} = require("./scripts/i18n/locale");
const { validateNewsPost, validateProduct, validateJob } = require("./scripts/i18n/required");

const md = markdownIt({ html: false, linkify: true, breaks: true });

function markdownEntries(relDir) {
  const dir = path.join(__dirname, relDir);
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => ({
      slug: path.basename(name, ".md"),
      data: matter(fs.readFileSync(path.join(dir, name), "utf8")).data,
    }));
}

module.exports = function (eleventyConfig) {
  eleventyConfig.ignores.add("src/admin/**");
  eleventyConfig.ignores.add("src/_cms/**");
  eleventyConfig.ignores.add("src/dashboard/**");
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  // Admin UI runs on Railway in production — skip on Vercel builds
  if (!process.env.VERCEL) {
    eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
    eleventyConfig.addPassthroughCopy({ "src/dashboard": "dashboard" });
  }
  eleventyConfig.addPassthroughCopy({ "src/.nojekyll": ".nojekyll" });

  eleventyConfig.addFilter("md", (value) => {
    if (value == null || value === "") return "";
    return md.render(String(value));
  });

  eleventyConfig.addFilter("visibleHome", (home) => {
    const sections = (home && home.sections) || [];
    let n = 0;
    return sections
      .filter((section) => section && section.visible)
      .map((section) => {
        n += 1;
        return { ...section, displayNum: String(n).padStart(2, "0") };
      });
  });

  eleventyConfig.addFilter("pathOnly", (value) => {
    if (!value) return "/";
    return String(value).split("#")[0] || "/";
  });

  eleventyConfig.addFilter("hasHash", (value) =>
    Boolean(value && String(value).includes("#"))
  );

  eleventyConfig.addFilter("navActive", (item, pageUrl) => {
    if (!item || !pageUrl) return false;
    const path = String(pageUrl).split("#")[0] || "/";
    const href = String(item.hrefInner || item.href || "/").split("#")[0];
    if (item.match === "prefix" && href !== "/" && href !== "/#") {
      if (path === href || path.startsWith(href)) return true;
    } else if (path === href) {
      return true;
    }
    const childHrefs = [
      ...(item.children || []).map((c) => c.href),
      ...((item.mega || []).flatMap((col) => (col.links || []).map((l) => l.href))),
    ];
    return childHrefs.some((raw) => {
      const childPath = String(raw || "").split("#")[0];
      if (!childPath || childPath === "/" || childPath === "/#") return false;
      return path === childPath || path.startsWith(childPath);
    });
  });

  eleventyConfig.addFilter("absoluteUrl", (url, base) => {
    if (!url) return base || "";
    if (/^https?:\/\//i.test(url)) return url;
    const root = (base || "").replace(/\/$/, "");
    return `${root}${url.startsWith("/") ? url : `/${url}`}`;
  });

  eleventyConfig.addFilter("isoDate", (value) => {
    try {
      return new Date(value).toISOString().slice(0, 10);
    } catch {
      return value;
    }
  });

  eleventyConfig.addFilter("localeUrl", (href, locale) => localeUrl(href, locale));
  eleventyConfig.addFilter("localized", (value, locale) => localized(value, locale));
  eleventyConfig.addFilter("pageIdentity", (pathname) => pageIdentity(pathname));
  eleventyConfig.addFilter("canonicalUrl", (origin, href, locale) =>
    canonicalUrl(origin, href, locale)
  );
  eleventyConfig.addFilter("htmlLang", (locale) => htmlLang(locale));
  eleventyConfig.addNunjucksGlobal("localeUrl", (href, locale) => localeUrl(href, locale));
  eleventyConfig.addNunjucksGlobal("localized", (value, locale) => localized(value, locale));
  eleventyConfig.addNunjucksGlobal("pageIdentity", (pathname) => pageIdentity(pathname));
  eleventyConfig.addNunjucksGlobal("canonicalUrl", (origin, href, locale) =>
    canonicalUrl(origin, href, locale)
  );
  eleventyConfig.addNunjucksGlobal("htmlLang", (locale) => htmlLang(locale));
  eleventyConfig.addGlobalData("locales", Object.keys(LOCALES));

  eleventyConfig.on("eleventy.before", () => {
    for (const { slug, data } of markdownEntries("src/news/posts")) {
      validateNewsPost(data, slug);
    }
    for (const { slug, data } of markdownEntries("src/products/items")) {
      validateProduct(data, slug);
    }
    for (const { slug, data } of markdownEntries("src/careers/jobs")) {
      validateJob(data, slug);
    }
  });

  eleventyConfig.addCollection("news", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/news/posts/*.md")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
  );

  eleventyConfig.addCollection("products", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/products/items/*.md")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
  );

  eleventyConfig.addCollection("careers", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/careers/jobs/*.md")
      .sort((a, b) => (a.data.order || 0) - (b.data.order || 0))
  );

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    pathPrefix: process.env.PATH_PREFIX || "/",
  };
};
