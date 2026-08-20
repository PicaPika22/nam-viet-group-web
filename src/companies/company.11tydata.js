const { localeUrl } = require("../../scripts/i18n/locale");

module.exports = {
  eleventyComputed: {
    company: (data) => data.render && data.render.item,
    title: (data) => {
      const loc = data.locale || data.render?.locale || "vi";
      return data.company?.name?.[loc] || "Company";
    },
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
      const loc = data.locale || data.render?.locale || "vi";
      const prefix = process.env.PATH_PREFIX || "/";
      const base = prefix === "/" ? "" : prefix.replace(/\/$/, "");
      const companiesUrl = `${base}${localeUrl("/companies/", loc)}`;
      const label = { en: "Companies", vi: "Công ty thành viên", zh: "成员企业" }[loc];
      const short = co.short?.[loc] || "";
      return `
      <span aria-hidden="true">/</span>
      <a href="${companiesUrl}">${label}</a>
      <span aria-hidden="true">/</span>
      <span>${short}</span>`;
    },
  },
};
