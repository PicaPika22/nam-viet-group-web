module.exports = {
  layout: "layouts/product.njk",
  tags: "products",
  permalink: (data) => `/products/${data.page.fileSlug}/`,
};
