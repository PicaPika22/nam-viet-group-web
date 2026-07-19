module.exports = {
  eleventyComputed: {
    title: (data) => data.company?.name?.en || "Company",
    eyebrow: (data) =>
      data.company?.unit
        ? {
            en: "Group unit",
            vi: "Đơn vị tập đoàn",
            zh: "集团单位",
          }
        : {
            en: "Member company",
            vi: "Công ty thành viên",
            zh: "成员企业",
          },
    heading: (data) => data.company?.name,
    lead: (data) => data.company?.desc,
    breadcrumbHtml: (data) => {
      const co = data.company;
      if (!co) return "";
      const prefix = process.env.PATH_PREFIX || "/";
      const base = prefix === "/" ? "" : prefix.replace(/\/$/, "");
      const companiesUrl = `${base}/companies/`;
      return `
      <span aria-hidden="true">/</span>
      <a href="${companiesUrl}">
        <span class="lang en">Companies</span>
        <span class="lang vi">Công ty thành viên</span>
        <span class="lang zh">成员企业</span>
      </a>
      <span aria-hidden="true">/</span>
      <span>
        <span class="lang en">${co.short.en}</span>
        <span class="lang vi">${co.short.vi}</span>
        <span class="lang zh">${co.short.zh}</span>
      </span>`;
    },
  },
};
