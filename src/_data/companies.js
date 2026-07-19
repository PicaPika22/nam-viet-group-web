/** Flat member-company list for pages + nav — derived from ecosystem */
const ecosystem = require("./ecosystem");

/** Extra page copy (focus bullets) keyed by company id */
const focusesById = {
  "nam-viet": [
    {
      en: "Core livestock and poultry feed manufacturing for the Group",
      vi: "Sản xuất cốt lõi thức ăn gia súc, gia cầm cho tập đoàn",
      zh: "集团核心畜禽饲料生产",
    },
    {
      en: "Quality systems aligned with ISO · GMP · HACCP practice",
      vi: "Hệ thống chất lượng theo thực hành ISO · GMP · HACCP",
      zh: "质量体系对齐 ISO · GMP · HACCP 实践",
    },
    {
      en: "Long-term nutrition partnerships with farming customers",
      vi: "Đồng hành dinh dưỡng dài hạn với khách hàng chăn nuôi",
      zh: "与养殖客户建立长期营养合作",
    },
  ],
  fimico: [
    {
      en: "Feed manufacturing within the Nam Viet ecosystem",
      vi: "Sản xuất thức ăn trong hệ sinh thái Nam Việt",
      zh: "南越生态内的饲料生产",
    },
    {
      en: "Transport and warehouse leasing since 2021",
      vi: "Vận tải và cho thuê kho bãi từ 2021",
      zh: "2021年起运输与仓储租赁",
    },
    {
      en: "Bridge between feed production and farm partnerships",
      vi: "Cầu nối sản xuất thức ăn và hợp tác trang trại",
      zh: "连接饲料生产与农场合作",
    },
  ],
  "feed-trading": [
    {
      en: "Trading of animal feed and related materials",
      vi: "Thương mại thức ăn chăn nuôi và vật tư liên quan",
      zh: "饲料及相关物资贸易",
    },
    {
      en: "Support market access across the Group network",
      vi: "Hỗ trợ tiếp cận thị trường trong mạng lưới tập đoàn",
      zh: "支持集团网络内的市场覆盖",
    },
    {
      en: "Align supply with customer demand and seasonality",
      vi: "Đồng bộ cung ứng theo nhu cầu và mùa vụ khách hàng",
      zh: "按客户需求与季节协调供应",
    },
  ],
  hutech: [
    {
      en: "International-standard warehousing and logistics",
      vi: "Kho bãi và logistics chuẩn quốc tế",
      zh: "国际标准仓储与物流",
    },
    {
      en: "Fully integrated into the Group since 2022",
      vi: "Hội nhập toàn phần vào tập đoàn từ 2022",
      zh: "2022年起全面并入集团",
    },
    {
      en: "Serve domestic distribution and export flows",
      vi: "Phục vụ phân phối nội địa và luồng xuất khẩu",
      zh: "服务国内分销与出口物流",
    },
  ],
  "logistics-nv": [
    {
      en: "Specialized transport for agri and industrial cargo",
      vi: "Vận tải chuyên biệt cho hàng nông sản và công nghiệp",
      zh: "农产品与工业货物专业运输",
    },
    {
      en: "Connect plants, warehouses and port gateways",
      vi: "Kết nối nhà máy, kho bãi và cửa khẩu cảng",
      zh: "连接工厂、仓储与港口口岸",
    },
    {
      en: "Reliable scheduling across the Group value chain",
      vi: "Lịch trình ổn định trên chuỗi giá trị tập đoàn",
      zh: "保障集团价值链稳定调度",
    },
  ],
  "warehouse-qn": [
    {
      en: "Agri storage at Cai Lan port (Quang Ninh)",
      vi: "Lưu giữ nông sản tại cảng Cái Lân (Quảng Ninh)",
      zh: "广宁盖麟港农产品仓储",
    },
    {
      en: "Import / export handling for feed raw materials",
      vi: "Xuất nhập khẩu nguyên liệu thức ăn chăn nuôi",
      zh: "饲料原料进出口作业",
    },
    {
      en: "Strategic northern gateway for the Group",
      vi: "Cửa ngõ chiến lược phía Bắc của tập đoàn",
      zh: "集团北部战略门户",
    },
  ],
  "trading-vn": [
    {
      en: "Agricultural imports for feed manufacturing",
      vi: "Nhập khẩu nông sản phục vụ sản xuất thức ăn",
      zh: "服务饲料生产的农产品进口",
    },
    {
      en: "Wood-pellet export and international trade",
      vi: "Xuất khẩu viên nén gỗ và thương mại quốc tế",
      zh: "木颗粒出口与国际贸易",
    },
    {
      en: "Fuel distribution alongside energy retail partners",
      vi: "Phân phối xăng dầu cùng mạng lưới bán lẻ năng lượng",
      zh: "与能源零售网络协同燃油分销",
    },
  ],
  vapco: [
    {
      en: "Production and international trading operations",
      vi: "Sản xuất và hoạt động thương mại quốc tế",
      zh: "生产与国际贸易运营",
    },
    {
      en: "Complement Group supply and export programs",
      vi: "Bổ trợ chương trình cung ứng và xuất khẩu của tập đoàn",
      zh: "补充集团供应与出口计划",
    },
    {
      en: "Partner-facing commercial execution",
      vi: "Thực thi thương mại hướng tới đối tác",
      zh: "面向合作伙伴的商务执行",
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
      en: "High-tech farm and livestock facility projects",
      vi: "Dự án trang trại và cơ sở chăn nuôi công nghệ cao",
      zh: "高科技农场与养殖设施项目",
    },
    {
      en: "Real estate linked to agri-industrial growth",
      vi: "Bất động sản gắn với tăng trưởng nông–công nghiệp",
      zh: "与农工增长相关的房地产",
    },
  ],
  tourism: [
    {
      en: "The King restaurant system",
      vi: "Hệ thống nhà hàng The King",
      zh: "The King 餐饮系统",
    },
    {
      en: "The King Hotel & Condotel (4-star hospitality)",
      vi: "The King Hotel & Condotel (khách sạn 4 sao)",
      zh: "The King Hotel & Condotel（四星酒店）",
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
