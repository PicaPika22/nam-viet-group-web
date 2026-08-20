module.exports = {
  eleventyComputed: {
    title: (data) => data.render && data.render.item.data.title,
    code: (data) => data.render && data.render.item.data.code,
    color: (data) => data.render && data.render.item.data.color,
    image: (data) => data.render && data.render.item.data.image,
    summary: (data) => data.render && data.render.item.data.summary,
    specs: (data) => data.render && data.render.item.data.specs,
  },
};
