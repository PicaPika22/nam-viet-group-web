const fs = require("fs");
const path = require("path");
const partners = require("../../src/_data/partners.json");
const journey = require("../../src/_data/journey");
const { LOCKED_HREFS, PRODUCT_HREFS } = require("./schema");

const langs = ["en", "vi", "zh"];

function i18n(en, vi, zh) {
  return { en, vi, zh };
}

function content(chapterLabel, values) {
  return Object.fromEntries(
    langs.map((lang) => [
      lang,
      { chapterLabel: chapterLabel[lang], ...values[lang] },
    ]),
  );
}

function stat(id, value, label, options = {}) {
  return {
    id,
    value,
    suffix: options.suffix || "",
    count: options.count ?? null,
    decimals: options.decimals || 0,
    icon: options.icon || "",
    label,
  };
}

function section(id, order, chapterLabel, values, extra = {}) {
  const hrefs = LOCKED_HREFS[id] || {};
  const cta = {};
  if (hrefs.primary) cta.primary = { href: hrefs.primary };
  if (hrefs.secondary) cta.secondary = { href: hrefs.secondary };
  if (hrefs.scroll) cta.scroll = { href: hrefs.scroll };
  return {
    id,
    visible: true,
    order,
    content: content(chapterLabel, values),
    images: {},
    stats: [],
    items: [],
    timeline: [],
    cta,
    ...extra,
  };
}

function buildSeedDocument() {
  return {
    version: 1,
    sections: [
      section(
        "hero",
        1,
        i18n("INTRO", "MỞ ĐẦU", "开篇"),
        {
          en: { eyebrow: "Nam Viet Group", titleLine1: "Feeding Growth.", titleLine2: "Connecting the Future.", lead: "For more than two decades, Nam Viet Group has developed an integrated agricultural ecosystem that connects manufacturing, logistics, port infrastructure and global partnerships — delivering sustainable value across every stage of the supply chain.", ctaPrimary: "Explore Our Journey", ctaSecondary: "Explore the ecosystem", scroll: "Scroll to explore" },
          vi: { eyebrow: "Tập đoàn Nam Việt", titleLine1: "Nuôi dưỡng tăng trưởng.", titleLine2: "Kết nối tương lai.", lead: "Hơn hai thập kỷ xây dựng hệ sinh thái nông nghiệp toàn diện — kết nối sản xuất, logistics, kho cảng và đối tác toàn cầu.", ctaPrimary: "Khám phá hành trình", ctaSecondary: "Khám phá hệ sinh thái", scroll: "Cuộn để khám phá" },
          zh: { eyebrow: "南越集团", titleLine1: "滋养增长。", titleLine2: "连接未来。", lead: "二十多年来，南越集团打造了覆盖生产、物流、港口基础设施与全球伙伴的农业一体化生态系统——在供应链每一环节创造可持续价值。", ctaPrimary: "探索我们的旅程", ctaSecondary: "探索生态体系", scroll: "向下滚动探索" },
        },
        {
          images: { art: "/assets/img/hero-chuan/rect-02.png" },
          stats: [
            stat("feed-capacity", "300.000+", i18n("Tonnes of feed per year", "Tấn thức ăn mỗi năm", "吨饲料年产能")),
            stat("factory-area", "40+ha", i18n("Factories & port warehousing", "Nhà xưởng & kho cảng", "厂房与港口仓储")),
          ],
        },
      ),
      section(
        "about",
        2,
        i18n("WHO WE ARE", "VỀ CHÚNG TÔI", "关于我们"),
        {
          en: { eyebrow: "Who We Are", titleLine1: "Built on Experience.", titleLine2: "Driven by Innovation.", lead: "For over 20 years, Nam Viet Group has been committed to creating sustainable growth through innovation, quality manufacturing and long-term partnerships.", body: "From feed production to logistics, ports and strategic investments, we continuously expand our ecosystem to deliver greater value for customers, communities and future generations." },
          vi: { eyebrow: "Về chúng tôi", titleLine1: "Xây dựng từ kinh nghiệm.", titleLine2: "Tiến bằng đổi mới.", lead: "Trong hơn hai thập kỷ qua, Nam Việt luôn theo đuổi mục tiêu phát triển bền vững thông qua đổi mới, sản xuất chất lượng cao và xây dựng những mối quan hệ hợp tác lâu dài.", body: "Từ lĩnh vực thức ăn chăn nuôi đến logistics, kho cảng và đầu tư chiến lược, chúng tôi không ngừng mở rộng hệ sinh thái để mang lại nhiều giá trị hơn cho khách hàng, đối tác và xã hội." },
          zh: { eyebrow: "关于我们", titleLine1: "以经验为基。", titleLine2: "以创新驱动。", lead: "二十多年来，南越集团致力于以创新、优质制造和长期合作，推动可持续增长。", body: "从饲料生产到物流、港口与战略投资，我们不断拓展生态系统，为客户、社区与未来世代创造更大价值。" },
        },
        {
          images: { media: "/assets/img/about.png" },
          stats: [
            stat("experience", "20+", i18n("Years of Experience", "Năm kinh nghiệm", "年行业经验"), { count: 20, suffix: "+" }),
            stat("companies", "10", i18n("Member Companies", "Công ty thành viên", "成员企业"), { count: 10 }),
            stat("projects", "186+", i18n("Projects Delivered", "Dự án đã triển khai", "已交付项目"), { count: 186, suffix: "+" }),
            stat("capital", "542B+", i18n("VND Charter Capital", "Vốn điều lệ (VNĐ)", "注册资本（越南盾）"), { count: 542, suffix: "B+" }),
          ],
        },
      ),
      section(
        "ecosystem",
        3,
        i18n("ECOSYSTEM", "HỆ SINH THÁI", "生态系统"),
        {
          en: { eyebrow: "Our Ecosystem", titleLine1: "One Ecosystem.", titleLine2: "Endless Possibilities.", lead: "Our integrated value chain enables us to control quality, optimize efficiency and create sustainable growth — from raw materials to global distribution.", ctaPrimary: "About Nam Viet" },
          vi: { eyebrow: "Hệ sinh thái Nam Việt", titleLine1: "Một hệ sinh thái.", titleLine2: "Muôn vàn giá trị.", lead: "Chuỗi giá trị khép kín giúp Nam Việt kiểm soát chất lượng, tối ưu hiệu quả vận hành và tạo ra giá trị bền vững — từ nguyên liệu đầu vào đến thị trường quốc tế.", ctaPrimary: "Về Nam Việt" },
          zh: { eyebrow: "南越生态系统", titleLine1: "一个生态系统。", titleLine2: "无限可能。", lead: "一体化价值链使我们能够把控质量、优化效率、实现可持续增长——从原材料到全球分销。", ctaPrimary: "关于南越" },
        },
        {
          images: { background: "/assets/img/ecosystem.png" },
          items: [
            ["raw-materials", "Raw Materials", "Nguyên liệu", "原材料"],
            ["research", "R&D", "R&D", "研发"],
            ["manufacturing", "Manufacturing", "Sản xuất", "生产制造"],
            ["packaging", "Packaging", "Đóng gói", "包装"],
            ["warehousing", "Warehousing", "Kho vận", "仓储"],
            ["logistics", "Logistics", "Logistics", "物流"],
            ["port-operations", "Port Operations", "Khai thác cảng", "港口运营"],
            ["global-distribution", "Global Distribution", "Phân phối toàn cầu", "全球分销"],
          ].map(([id, en, vi, zh]) => ({ id, label: i18n(en, vi, zh) })),
        },
      ),
      section(
        "manufacturing",
        4,
        i18n("MANUFACTURING", "SẢN XUẤT", "生产制造"),
        {
          en: { eyebrow: "Advanced Manufacturing", titleLine1: "Engineering", titleLine2: "Better Agriculture.", lead: "Modern production facilities equipped with advanced technologies ensure consistent product quality, operational excellence and food safety standards across every stage of manufacturing.", ctaPrimary: "Discover Our Capabilities" },
          vi: { eyebrow: "Năng lực sản xuất", titleLine1: "Công nghệ cho nông nghiệp", titleLine2: "bền vững hơn.", lead: "Hệ thống nhà máy hiện đại cùng dây chuyền công nghệ tiên tiến giúp Nam Việt đảm bảo chất lượng sản phẩm đồng nhất, tối ưu hiệu suất vận hành và đáp ứng các tiêu chuẩn an toàn nghiêm ngặt.", ctaPrimary: "Khám phá năng lực" },
          zh: { eyebrow: "先进制造", titleLine1: "以科技", titleLine2: "赋能可持续农业。", lead: "现代化生产基地与先进技术，确保制造各环节的产品质量、运营卓越与食品安全标准。", ctaPrimary: "了解我们的能力" },
        },
        {
          images: { media: "/assets/img/manufacturing.png" },
          items: [
            ["automated-production", "Automated Production", "Sản xuất tự động hóa", "自动化生产"],
            ["quality-control", "Quality Control", "Kiểm soát chất lượng", "质量控制"],
            ["international-standards", "International Standards", "Tiêu chuẩn quốc tế", "国际标准"],
            ["continuous-innovation", "Continuous Innovation", "Đổi mới liên tục", "持续创新"],
          ].map(([id, en, vi, zh]) => ({ id, label: i18n(en, vi, zh) })),
          stats: [
            stat("factories", "12+", i18n("Factories", "Nhà máy", "工厂"), { count: 12, suffix: "+" }),
            stat("capacity", "1.2M", i18n("Tons Annual Capacity", "Triệu tấn / năm", "百万吨/年产能"), { count: 1.2, decimals: 1, suffix: "M" }),
            stat("inspection", "100%", i18n("Quality Inspection", "Kiểm định chất lượng", "质量检验"), { count: 100, suffix: "%" }),
            stat("certified", "ISO · GMP · HACCP", i18n("Certified", "Đạt chứng nhận", "权威认证")),
          ],
        },
      ),
      section(
        "products",
        5,
        i18n("PRODUCTS", "SẢN PHẨM", "产品"),
        {
          en: { eyebrow: "Our Products", titleLine1: "Nutrition Designed", titleLine2: "for Every Stage.", lead: "From pig and poultry feed to aquaculture and specialty nutrition, our products are developed through scientific research to maximize animal health and production efficiency.", ctaPrimary: "View All Products" },
          vi: { eyebrow: "Sản phẩm", titleLine1: "Giải pháp dinh dưỡng", titleLine2: "cho mọi giai đoạn.", lead: "Mỗi dòng sản phẩm được phát triển dựa trên nghiên cứu khoa học nhằm tối ưu sức khỏe vật nuôi và nâng cao hiệu quả chăn nuôi.", ctaPrimary: "Xem tất cả sản phẩm" },
          zh: { eyebrow: "产品", titleLine1: "为每个阶段", titleLine2: "设计的营养方案。", lead: "从猪禽饲料到水产与特种营养，每款产品均基于科学研究，优化动物健康与生产效率。", ctaPrimary: "查看全部产品" },
        },
        {
          images: {
            nv007: "/assets/img/products/nv007.jpg",
            "nv-10s": "/assets/img/products/nv-10s.jpg",
            nv888: "/assets/img/products/nv888.jpg",
            nv40: "/assets/img/products/nv40.jpg",
            nv530: "/assets/img/products/nv530.jpg",
          },
          items: [
            ["nv007", "NV007", "Pig Feed", "Thức ăn heo", "猪饲料"],
            ["nv-10s", "NV10S", "Broiler Starter", "Gà trắng úm", "肉鸡育雏"],
            ["nv888", "NV888", "Dairy Cattle", "Bò sữa", "奶牛精料"],
            ["nv40", "NV40", "Fingerling Feed", "Cá giống", "鱼苗浮料"],
            ["nv530", "NV530", "Frog Feed", "Thức ăn ếch", "蛙用浮料"],
          ].map(([id, code, en, vi, zh]) => ({ id, code, href: PRODUCT_HREFS[id], name: i18n(en, vi, zh) })),
        },
      ),
      section(
        "logistics",
        6,
        i18n("LOGISTICS", "LOGISTICS", "物流"),
        {
          en: { eyebrow: "Smart Logistics", titleLine1: "Connecting Vietnam", titleLine2: "to Global Markets.", lead: "An efficient logistics network with warehouses, transportation systems and port infrastructure ensures reliable delivery and seamless supply chain management.", ctaPrimary: "Explore Logistics" },
          vi: { eyebrow: "Logistics", titleLine1: "Kết nối Việt Nam", titleLine2: "với thế giới.", lead: "Hệ thống logistics đồng bộ giúp tối ưu vận chuyển, kết nối chuỗi cung ứng và đưa sản phẩm đến khách hàng một cách nhanh chóng, an toàn.", ctaPrimary: "Khám phá logistics" },
          zh: { eyebrow: "智慧物流", titleLine1: "连接越南", titleLine2: "与全球市场。", lead: "高效的物流网络、仓储、运输与港口基础设施，确保可靠交付与无缝供应链管理。", ctaPrimary: "探索物流" },
        },
        {
          images: { background: "/assets/img/logistics.png" },
          stats: [
            stat("hubs", "20+", i18n("Strategic Logistics Hubs", "Trung tâm logistics", "战略物流枢纽"), { count: 20, suffix: "+" }),
            stat("shipments", "500+", i18n("Daily Shipments", "Chuyến hàng mỗi ngày", "日发货量"), { count: 500, suffix: "+" }),
            stat("visibility", "100%", i18n("Supply Chain Visibility", "Minh bạch chuỗi", "供应链可视化"), { count: 100, suffix: "%" }),
          ],
        },
      ),
      section(
        "network",
        7,
        i18n("PARTNERS", "ĐỐI TÁC", "合作伙伴"),
        {
          en: { eyebrow: "Global Partners", titleLine1: "Local Expertise.", titleLine2: "Global Partnerships.", lead: "We collaborate with leading international organizations to exchange knowledge, adopt advanced technologies and strengthen Vietnam's agricultural industry.", ctaPrimary: "Become Our Partner" },
          vi: { eyebrow: "Đối tác toàn cầu", titleLine1: "Hiểu thị trường Việt Nam.", titleLine2: "Kết nối thế giới.", lead: "Nam Việt hợp tác với nhiều tập đoàn hàng đầu thế giới nhằm chia sẻ công nghệ, kinh nghiệm và cùng kiến tạo giá trị bền vững.", ctaPrimary: "Trở thành đối tác" },
          zh: { eyebrow: "全球合作伙伴", titleLine1: "深耕本土。", titleLine2: "连接全球。", lead: "我们与全球领先机构合作，共享知识、引进先进技术，助力越南农业产业发展。", ctaPrimary: "成为合作伙伴" },
        },
        {
          items: partners.map(({ id, name, url, logo }) => ({ id, name, url, image: logo })),
        },
      ),
      section(
        "sustainability",
        8,
        i18n("ESG", "BỀN VỮNG", "可持续发展"),
        {
          en: { eyebrow: "Sustainability", titleLine1: "Growing Together.", titleLine2: "Responsibly.", lead: "Sustainability is integrated into every decision we make — from responsible sourcing and environmentally conscious manufacturing to community development and transparent governance.", ctaPrimary: "Learn More About ESG" },
          vi: { eyebrow: "Phát triển bền vững", titleLine1: "Cùng nhau phát triển.", titleLine2: "Có trách nhiệm.", lead: "Tính bền vững được đặt trong từng quyết định của chúng tôi — từ nguồn nguyên liệu có trách nhiệm, sản xuất thân thiện với môi trường đến phát triển cộng đồng và quản trị minh bạch.", ctaPrimary: "Tìm hiểu về ESG" },
          zh: { eyebrow: "可持续发展", titleLine1: "共同成长。", titleLine2: "负责任地前行。", lead: "可持续发展融入我们每一项决策——从负责任采购、环保制造到社区发展与透明治理。", ctaPrimary: "了解更多 ESG" },
        },
        { images: { media: "/assets/img/sustainability.png" } },
      ),
      section(
        "leadership",
        9,
        i18n("LEADERSHIP", "LÃNH ĐẠO", "领导团队"),
        {
          en: { eyebrow: "Our Leadership", titleLine1: "Leadership That", titleLine2: "Steers the Group.", body: "Built on charter capital of VND 542 billion, Nam Viet is steered by a leadership bench that aligns Group strategy with execution across feed, trade, manufacturing and logistics — so growth stays disciplined and the ecosystem stays coherent.", ctaPrimary: "Meet the Leadership" },
          vi: { eyebrow: "Ban lãnh đạo", titleLine1: "Ban lãnh đạo", titleLine2: "định hướng Tập đoàn.", body: "Trên nền vốn điều lệ 542 tỷ đồng, Nam Việt được dẫn dắt bởi đội ngũ lãnh đạo gắn chiến lược Tập đoàn với điều hành thực tế trên chuỗi thức ăn, thương mại, sản xuất và logistics — tăng trưởng có kỷ luật, hệ sinh thái vận hành thống nhất.", ctaPrimary: "Gặp ban lãnh đạo" },
          zh: { eyebrow: "领导团队", titleLine1: "以领导力", titleLine2: "掌舵集团。", body: "立足5,420亿越南盾注册资本，南越由高管团队统筹集团战略与日常执行，贯通饲料、贸易、制造与物流——增长有纪律，产业生态一体协同。", ctaPrimary: "认识集团领导" },
        },
        { images: { media: "/assets/img/leadership.jpg" } },
      ),
      section(
        "milestones",
        10,
        i18n("JOURNEY", "HÀNH TRÌNH", "发展历程"),
        {
          en: { eyebrow: "Our Journey", titleLine1: "Milestones That", titleLine2: "Built Who We Are.", lead: journey.intro.en, bannerStatement: journey.banner.statement.en },
          vi: { eyebrow: "Hành trình phát triển", titleLine1: "Những cột mốc", titleLine2: "làm nên Nam Việt.", lead: journey.intro.vi, bannerStatement: journey.banner.statement.vi },
          zh: { eyebrow: "发展历程", titleLine1: "里程碑", titleLine2: "铸就南越。", lead: journey.intro.zh, bannerStatement: journey.banner.statement.zh },
        },
        {
          images: { banner: `/assets/img/milestones/${journey.banner.file}` },
          stats: journey.banner.stats.map((row, index) =>
            stat(`banner-${index + 1}`, row.value, i18n(row.en, row.vi, row.zh), { icon: row.icon }),
          ),
          timeline: journey.items.map((row) => ({
            id: `m-${row.year}`,
            year: row.year,
            icon: row.icon,
            image: `/assets/img/milestones/${row.file}`,
            title: i18n(row.en.title, row.vi.title, row.zh.title),
            description: i18n(row.en.text, row.vi.text, row.zh.text),
          })),
        },
      ),
      section(
        "news",
        11,
        i18n("NEWS", "TIN TỨC", "新闻"),
        {
          en: { eyebrow: "News", titleLine1: "What’s Happening", titleLine2: "at Nam Viet.", lead: "Project updates, business activities and key developments across the Nam Viet ecosystem.", ctaPrimary: "View All News" },
          vi: { eyebrow: "Tin tức", titleLine1: "Tin mới", titleLine2: "từ Nam Việt.", lead: "Cập nhật dự án, hoạt động doanh nghiệp và những diễn biến đáng chú ý trong hệ sinh thái Nam Việt.", ctaPrimary: "Xem tất cả tin tức" },
          zh: { eyebrow: "新闻", titleLine1: "南越", titleLine2: "最新动态。", lead: "了解南越的项目进展、企业动态与重要更新。", ctaPrimary: "查看全部新闻" },
        },
      ),
      section(
        "contact",
        12,
        i18n("CONTACT", "LIÊN HỆ", "联系我们"),
        {
          en: { titleLine1: "Let's Grow the Future", titleLine2: "Together.", lead: "Whether you're looking for a trusted manufacturing partner, logistics solutions or long-term strategic collaboration, Nam Viet is ready to grow with you.", ctaPrimary: "Become Our Partner", ctaSecondary: "Contact Us" },
          vi: { titleLine1: "Cùng kiến tạo", titleLine2: "tương lai bền vững.", lead: "Đối tác sản xuất, giải pháp logistics hay hợp tác chiến lược — Nam Việt sẵn sàng đồng hành cùng bạn.", ctaPrimary: "Trở thành đối tác", ctaSecondary: "Liên hệ ngay" },
          zh: { titleLine1: "携手共创", titleLine2: "可持续未来。", lead: "无论您需要可靠的制造伙伴、物流方案还是长期战略合作，南越都已准备好与您共同成长。", ctaPrimary: "成为合作伙伴", ctaSecondary: "立即联系" },
        },
        { images: { background: "/assets/img/cta.png" } },
      ),
    ],
  };
}

if (require.main === module) {
  const doc = buildSeedDocument();
  const json = `${JSON.stringify(doc, null, 2)}\n`;
  const root = path.resolve(__dirname, "../..");
  fs.mkdirSync(path.join(root, "src/_cms"), { recursive: true });
  fs.mkdirSync(path.join(root, "src/assets/img/home"), { recursive: true });
  fs.writeFileSync(path.join(root, "src/_data/home.json"), json);
  fs.writeFileSync(path.join(root, "src/_cms/home.draft.json"), json);
}

module.exports = { buildSeedDocument };
