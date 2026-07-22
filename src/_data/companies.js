/** Flat member-company list for pages + nav — derived from ecosystem */
const ecosystem = require("./ecosystem");

/** Extra page copy (focus bullets) keyed by company id */
const focusesById = {
  "nam-viet": [
    {
      en: "Core livestock, poultry and aquaculture feed manufacturing",
      vi: "Sản xuất cốt lõi thức ăn gia súc, gia cầm và thủy sản",
      zh: "畜禽与水产饲料核心生产",
    },
    {
      en: "Lines: ~300,000 t/year (Skiold) and 10 t/hour aqua (Andritz)",
      vi: "Dây chuyền ~300.000 tấn/năm (Skiold) và thủy sản 10 tấn/giờ (Andritz)",
      zh: "产能约30万吨/年（Skiold）与水产10吨/小时（Andritz）",
    },
    {
      en: "Quality systems aligned with ISO · GMP · HACCP practice",
      vi: "Hệ thống chất lượng theo thực hành ISO · GMP · HACCP",
      zh: "质量体系对齐 ISO · GMP · HACCP 实践",
    },
  ],
  pilmico: [
    {
      en: "Feed manufacturing within the Nam Viet ecosystem",
      vi: "Sản xuất thức ăn trong hệ sinh thái Nam Việt",
      zh: "南越生态内的饲料生产",
    },
    {
      en: "Premises and logistics support for industrial partners",
      vi: "Hỗ trợ mặt bằng và logistics cho đối tác công nghiệp",
      zh: "为产业伙伴提供场地与物流支持",
    },
    {
      en: "Bridge between feed production and farm partnerships",
      vi: "Cầu nối sản xuất thức ăn và hợp tác trang trại",
      zh: "连接饲料生产与农场合作",
    },
  ],
  "feed-trading": [
    {
      en: "Road and waterway cargo transport since 2013",
      vi: "Vận chuyển đường bộ và đường thủy từ 2013",
      zh: "自2013年起公路与水路货运",
    },
    {
      en: "Support feed materials and agri logistics flows",
      vi: "Phục vụ dòng nguyên liệu thức ăn và logistics nông sản",
      zh: "支撑饲料原料与农产品物流",
    },
    {
      en: "Align supply with customer demand and seasonality",
      vi: "Đồng bộ cung ứng theo nhu cầu và mùa vụ khách hàng",
      zh: "按客户需求与季节协调供应",
    },
  ],
  "logistics-nv": [
    {
      en: "FDI investment advisory into Vietnam",
      vi: "Tư vấn dịch vụ đầu tư FDI vào Việt Nam",
      zh: "赴越FDI投资咨询服务",
    },
    {
      en: "Warehouses and workshops on 15 ha",
      vi: "Kho bãi và nhà xưởng trên 15ha",
      zh: "15公顷仓储与厂房",
    },
    {
      en: "International cargo transport services",
      vi: "Dịch vụ vận chuyển hàng hóa quốc tế",
      zh: "国际货物运输服务",
    },
  ],
  "ag-ah-logistics": [
    {
      en: "Premises leasing and logistics on 5 ha",
      vi: "Cho thuê mặt bằng và logistics trên 5ha",
      zh: "5公顷场地租赁与物流",
    },
    {
      en: "Serves regional manufacturing tenants",
      vi: "Phục vụ doanh nghiệp sản xuất trong khu vực",
      zh: "服务区域内制造企业",
    },
    {
      en: "Founded 2024 within the Group logistics network",
      vi: "Thành lập 2024 trong mạng lưới logistics Tập đoàn",
      zh: "2024年成立，纳入集团物流网络",
    },
  ],
  "warehouse-qn": [
    {
      en: "Port warehouse at Cai Lan (Quang Ninh), ~5 ha",
      vi: "Kho cảng Cái Lân (Quảng Ninh), gần 5ha",
      zh: "广宁盖麟港仓，近5公顷",
    },
    {
      en: "About 190,000 tonnes storage capacity",
      vi: "Công suất lưu giữ khoảng 190.000 tấn",
      zh: "约19万吨仓储能力",
    },
    {
      en: "Strategic northern gateway for the Group",
      vi: "Cửa ngõ chiến lược phía Bắc của tập đoàn",
      zh: "集团北部战略门户",
    },
  ],
  vapco: [
    {
      en: "Premises leasing and logistics on nearly 3 ha",
      vi: "Cho thuê mặt bằng và logistics gần 3ha",
      zh: "近3公顷场地租赁与物流",
    },
    {
      en: "Hosts industrial manufacturing tenants",
      vi: "Đón doanh nghiệp sản xuất thuê mặt bằng",
      zh: "承接入驻制造企业",
    },
    {
      en: "Founded 2018",
      vi: "Thành lập 2018",
      zh: "2018年成立",
    },
  ],
  hutech: [
    {
      en: "International-standard warehousing and logistics",
      vi: "Kho bãi và logistics chuẩn quốc tế",
      zh: "国际标准仓储与物流",
    },
    {
      en: "Integrated into the Group network",
      vi: "Hội nhập vào mạng lưới tập đoàn",
      zh: "并入集团网络",
    },
    {
      en: "Serve domestic distribution and export flows",
      vi: "Phục vụ phân phối nội địa và luồng xuất khẩu",
      zh: "服务国内分销与出口物流",
    },
  ],
  "trading-vn": [
    {
      en: "Agricultural imports for feed manufacturing",
      vi: "Nhập khẩu nông sản phục vụ sản xuất thức ăn",
      zh: "服务饲料生产的农产品进口",
    },
    {
      en: "International trade programs",
      vi: "Chương trình thương mại quốc tế",
      zh: "国际贸易业务",
    },
    {
      en: "Complement Group supply chains",
      vi: "Bổ trợ chuỗi cung ứng tập đoàn",
      zh: "补充集团供应链",
    },
  ],
  fuel: [
    {
      en: "Fuel retail under Nam Viet Petroleum",
      vi: "Bán lẻ xăng dầu dưới thương hiệu Nam Việt",
      zh: "南越品牌燃油零售",
    },
    {
      en: "Station network supporting local mobility and industry",
      vi: "Mạng lưới cửa hàng phục vụ giao thông và sản xuất địa phương",
      zh: "服务本地交通与产业的站点网络",
    },
    {
      en: "Part of the Group since 2016",
      vi: "Thuộc hệ sinh thái tập đoàn từ 2016",
      zh: "2016年起纳入集团生态",
    },
  ],
  "xdnn-tn": [
    {
      en: "Agricultural infrastructure and rural development",
      vi: "Hạ tầng nông nghiệp và phát triển nông thôn",
      zh: "农业基建与农村发展",
    },
    {
      en: "Clean, high-yield synchronized farm models",
      vi: "Mô hình trang trại sạch, năng suất cao, đồng bộ",
      zh: "清洁、高产、协同的农场模式",
    },
    {
      en: "Founded 2020",
      vi: "Thành lập 2020",
      zh: "2020年成立",
    },
  ],
  "song-cong": [
    {
      en: "Industrial development on 20 ha in Song Cong",
      vi: "Phát triển công nghiệp trên 20ha tại Sông Công",
      zh: "宋功20公顷工业发展",
    },
    {
      en: "Cargo management and FDI advisory services",
      vi: "Quản lý hàng hóa và tư vấn dịch vụ cho doanh nghiệp FDI",
      zh: "货物管理与FDI咨询服务",
    },
    {
      en: "Workshops and industrial services",
      vi: "Nhà xưởng và dịch vụ công nghiệp",
      zh: "厂房与工业服务",
    },
  ],
  tourism: [
    {
      en: "High-quality hotel and restaurant system",
      vi: "Hệ thống khách sạn và nhà hàng chất lượng cao",
      zh: "高品质酒店与餐饮体系",
    },
    {
      en: "Hospitality expansion since 2020",
      vi: "Mở rộng dịch vụ lưu trú từ 2020",
      zh: "自2020年起拓展住宿服务",
    },
    {
      en: "Conference, events and guest services",
      vi: "Hội nghị, sự kiện và dịch vụ đón tiếp",
      zh: "会议、活动与接待服务",
    },
  ],
  "rd-center": [
    {
      en: "Quality control and product diagnostics",
      vi: "Kiểm soát chất lượng và chẩn đoán sản phẩm",
      zh: "质量控制与产品诊断",
    },
    {
      en: "Animal health and disease research support",
      vi: "Hỗ trợ nghiên cứu bệnh dịch và sức khỏe vật nuôi",
      zh: "动物疫病与健康研究支持",
    },
    {
      en: "Probiotics and nutrition science applications",
      vi: "Ứng dụng men vi sinh và khoa học dinh dưỡng",
      zh: "益生菌与营养科学应用",
    },
  ],
};

module.exports = function () {
  const items = [];
  for (const sector of ecosystem.sectors || []) {
    for (const co of sector.companies || []) {
      items.push({
        ...co,
        focuses: focusesById[co.id] || [],
        sector: {
          id: sector.id,
          key: sector.key,
          title: sector.title,
          blurb: sector.blurb,
          image: sector.image,
        },
        url: `/companies/${co.id}/`,
      });
    }
  }
  for (const item of items) {
    item.siblings = items
      .filter((c) => c.sector.id === item.sector.id && c.id !== item.id)
      .map((c) => ({
        id: c.id,
        url: c.url,
        short: c.short,
      }));
  }
  return items;
};
