const path = require("path");
const markdownIt = require("markdown-it");
const md = markdownIt({ html: false, linkify: true, breaks: true });

module.exports = function (eleventyConfig) {
  eleventyConfig.ignores.add("src/admin/**");
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/.nojekyll": ".nojekyll" });

  eleventyConfig.addFilter("md", (value) => {
    if (value == null || value === "") return "";
    return md.render(String(value));
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
