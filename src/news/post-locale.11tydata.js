module.exports = {
  eleventyComputed: {
    title: (data) => data.render && data.render.item.data.title,
    date: (data) => data.render && data.render.item.data.date,
    category: (data) => data.render && data.render.item.data.category,
    image: (data) => data.render && data.render.item.data.image,
    body: (data) => data.render && data.render.item.data.body,
    excerpt: (data) => data.render && data.render.item.data.excerpt,
  },
};
