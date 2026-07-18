function withPrefix(path) {
  const raw = process.env.PATH_PREFIX || "/";
  const prefix = raw === "/" ? "" : raw.replace(/\/$/, "");
  if (!path.startsWith("/")) path = `/${path}`;
  return `${prefix}${path}`;
}

module.exports = function () {
  return [
    {
      url: withPrefix("/"),
      title: { en: "Home", vi: "Trang chủ", zh: "首页" },
      body: {
        en: "Feeding growth connecting the future agricultural ecosystem manufacturing logistics",
        vi: "Nuôi dưỡng tăng trưởng hệ sinh thái nông nghiệp sản xuất logistics",
        zh: "滋养增长 农业生态系统 生产 物流",
      },
    },
    {
      url: withPrefix("/about/"),
      title: { en: "About", vi: "Về chúng tôi", zh: "关于我们" },
      body: {
        en: "Experience innovation leadership company history",
        vi: "Kinh nghiệm đổi mới lãnh đạo lịch sử",
        zh: "经验 创新 领导 历史",
      },
    },
    {
      url: withPrefix("/products/"),
      title: { en: "Products", vi: "Sản phẩm", zh: "产品" },
      body: {
        en: "Pig cattle poultry aquaculture feed nutrition GF-901 HF-901",
        vi: "Thức ăn heo gia súc gia cầm thủy sản",
        zh: "猪饲料 牛饲料 禽饲料 水产饲料",
      },
    },
    {
      url: withPrefix("/news/"),
      title: { en: "News", vi: "Tin tức", zh: "新闻" },
      body: {
        en: "Corporate news projects CSR sustainability",
        vi: "Tin doanh nghiệp dự án CSR bền vững",
        zh: "企业新闻 项目 可持续发展",
      },
    },
    {
      url: withPrefix("/contact/"),
      title: { en: "Contact", vi: "Liên hệ", zh: "联系我们" },
      body: {
        en: "Partner inquiry logistics careers form",
        vi: "Hợp tác logistics tuyển dụng form",
        zh: "合作 物流 招聘 表单",
      },
    },
    {
      url: withPrefix("/sustainability/"),
      title: { en: "Sustainability", vi: "Bền vững", zh: "可持续发展" },
      body: {
        en: "ESG environment social governance",
        vi: "ESG môi trường xã hội quản trị",
        zh: "ESG 环境 社会 治理",
      },
    },
    {
      url: withPrefix("/careers/"),
      title: { en: "Careers", vi: "Tuyển dụng", zh: "招聘" },
      body: {
        en: "Jobs open roles production engineer logistics",
        vi: "Việc làm vị trí kỹ sư logistics",
        zh: "职位 工程师 物流",
      },
    },
    {
      url: withPrefix("/investors/"),
      title: { en: "Investors", vi: "Nhà đầu tư", zh: "投资者" },
      body: {
        en: "Annual report governance milestones capital",
        vi: "Báo cáo thường niên quản trị cột mốc vốn",
        zh: "年度报告 治理 里程碑 资本",
      },
    },
    {
      url: withPrefix("/downloads/"),
      title: { en: "Downloads", vi: "Tài liệu", zh: "资料下载" },
      body: {
        en: "Catalog PDF certifications ESG company profile",
        vi: "Catalogue chứng nhận ESG hồ sơ",
        zh: "目录 认证 ESG 简介",
      },
    },
    {
      url: withPrefix("/privacy/"),
      title: { en: "Privacy Policy", vi: "Chính sách bảo mật", zh: "隐私政策" },
      body: { en: "privacy cookies data", vi: "bảo mật cookie dữ liệu", zh: "隐私 cookie 数据" },
    },
    {
      url: withPrefix("/cookies/"),
      title: { en: "Cookie Policy", vi: "Chính sách cookie", zh: "Cookie 政策" },
      body: { en: "cookies consent analytics preferences", vi: "cookie đồng ý phân tích tùy chọn", zh: "cookie 同意 分析 偏好" },
    },
    {
      url: withPrefix("/terms/"),
      title: { en: "Terms of Use", vi: "Điều khoản sử dụng", zh: "使用条款" },
      body: { en: "terms conditions website", vi: "điều khoản website", zh: "条款 网站" },
    },
    {
      url: withPrefix("/products/gf-901/"),
      title: { en: "GF-901 Pig Feed", vi: "GF-901 Thức ăn heo", zh: "GF-901 猪饲料" },
      body: { en: "pig feed nutrition", vi: "thức ăn heo dinh dưỡng", zh: "猪饲料 营养" },
    },
    {
      url: withPrefix("/products/hf-901/"),
      title: { en: "HF-901 Cattle Feed", vi: "HF-901 Thức ăn gia súc", zh: "HF-901 牛饲料" },
      body: { en: "cattle feed", vi: "thức ăn gia súc", zh: "牛饲料" },
    },
    {
      url: withPrefix("/products/v-234/"),
      title: { en: "V-234 Poultry Feed", vi: "V-234 Thức ăn gia cầm", zh: "V-234 禽饲料" },
      body: { en: "poultry feed", vi: "thức ăn gia cầm", zh: "禽饲料" },
    },
    {
      url: withPrefix("/products/gf-22/"),
      title: { en: "GF-22 Aquaculture Feed", vi: "GF-22 Thức ăn thủy sản", zh: "GF-22 水产饲料" },
      body: { en: "aquaculture feed", vi: "thức ăn thủy sản", zh: "水产饲料" },
    },
    {
      url: withPrefix("/products/s-234/"),
      title: { en: "S-234 Specialized Nutrition", vi: "S-234 Dinh dưỡng chuyên biệt", zh: "S-234 特种营养" },
      body: { en: "specialized nutrition", vi: "dinh dưỡng chuyên biệt", zh: "特种营养" },
    },
  ];
};
