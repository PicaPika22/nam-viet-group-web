module.exports = {
  layout: "layouts/article.njk",
  tags: "news",
  permalink: (data) => `/news/${data.page.fileSlug}/`,
};
