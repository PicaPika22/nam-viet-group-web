const path = require("path");

module.exports = function (eleventyConfig) {
  eleventyConfig.ignores.add("src/admin/**");
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/.nojekyll": ".nojekyll" });

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
