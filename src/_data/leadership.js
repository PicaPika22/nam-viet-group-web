/**
 * Leadership team — names/roles/photos from namviet-jsc.com/vn/about
 *
 * Portrait upload standard (required for a consistent grid + profile):
 *   - Ratio:  3:4 (portrait)
 *   - Size:   900 × 1200 px (site store size)
 *   - Format: JPG
 *   - Framing: head & upper torso, face in the upper third, neutral/office backdrop
 * Normalize batch:  python scripts/normalize_leadership_photos.py
 */
module.exports = [
  {
    id: "ha-van-an",
    featured: true,
    image: "/assets/img/leadership/ha-van-an.jpg",
    name: {
      en: "Ha Van An",
      vi: "Hà Văn An",
      zh: "何文安",
    },
    role: {
      en: "Chairman of the Board",
      vi: "Chủ tịch HĐQT",
      zh: "董事会主席",
    },
    bio: {
      en: "At Nam Viet, we are committed to sustainable agriculture. We balance stakeholder interests while prioritizing environmental protection — advancing eco-friendly farming solutions, food security and rural growth, and creating lasting value for customers, partners and society.",
      vi: "Tại Nam Việt, chúng tôi cam kết phát triển nông nghiệp bền vững. Chúng tôi cân bằng lợi ích các bên liên quan, ưu tiên bảo vệ môi trường — đi đầu giải pháp canh tác thân thiện môi trường, an ninh lương thực và tăng trưởng kinh tế nông thôn, tạo giá trị lâu dài cho khách hàng, đối tác và xã hội.",
      zh: "在南越，我们致力于可持续农业。平衡各方利益、优先保护环境——推进环保耕作、粮食安全与农村增长，为客户、伙伴与社会创造长期价值。",
    },
  },
  {
    id: "nguyen-thi-nu",
    image: "/assets/img/leadership/nguyen-thi-nu.jpg",
    name: {
      en: "Nguyen Thi Nu",
      vi: "Nguyễn Thị Nụ",
      zh: "阮氏努",
    },
    role: {
      en: "Deputy General Director",
      vi: "Phó Tổng giám đốc",
      zh: "副总经理",
    },
    bio: {
      en: "Steers Group executive operations across member companies — translating Board strategy into disciplined day-to-day management and cross-unit performance.",
      vi: "Điều phối điều hành Tập đoàn tại các công ty thành viên — chuyển chiến lược HĐQT thành quản trị hàng ngày có kỷ luật và hiệu quả liên đơn vị.",
      zh: "统筹集团及成员企业运营——将董事会战略落地为有纪律的日常管理与跨单元绩效。",
    },
  },
  {
    id: "hoang-thanh-phong",
    image: "/assets/img/leadership/hoang-thanh-phong.jpg",
    name: {
      en: "Hoang Thanh Phong",
      vi: "Hoàng Thanh Phong",
      zh: "黄青峰",
    },
    role: {
      en: "Chief Accountant",
      vi: "Kế toán trưởng",
      zh: "总会计师",
    },
    bio: {
      en: "Owns Group accounting and consolidated reporting — upholding transparency, capital discipline and governance standards across the Nam Viet ecosystem.",
      vi: "Phụ trách kế toán và báo cáo hợp nhất Tập đoàn — bảo đảm minh bạch, kỷ luật vốn và chuẩn quản trị trong toàn hệ sinh thái Nam Việt.",
      zh: "负责集团会计与合并报表——在南越生态内维护透明、资本纪律与治理标准。",
    },
  },
  {
    id: "nguyen-duc-hung",
    image: "/assets/img/leadership/nguyen-duc-hung.jpg",
    name: {
      en: "Nguyen Duc Hung",
      vi: "Nguyễn Đức Hùng",
      zh: "阮德雄",
    },
    role: {
      en: "Director, Feed Trading Vietnam Co., Ltd.",
      vi: "GĐ CT TNHH Feed Trading Việt Nam",
      zh: "Feed Trading 越南有限公司总经理",
    },
    bio: {
      en: "Leads Feed Trading Vietnam — securing feed materials and logistics flows that keep the Group’s manufacturing network supplied and commercially agile.",
      vi: "Điều hành Feed Trading Việt Nam — bảo đảm nguồn nguyên liệu thức ăn và dòng logistics phục vụ mạng lưới sản xuất Tập đoàn, vận hành linh hoạt về thương mại.",
      zh: "执掌 Feed Trading 越南——保障饲料原料与物流通道，支撑集团生产网络供应与商业灵活度。",
    },
  },
  {
    id: "nguyen-van-hung",
    image: "/assets/img/leadership/nguyen-van-hung.jpg",
    name: {
      en: "Nguyen Van Hung",
      vi: "Nguyễn Văn Hùng",
      zh: "阮文雄",
    },
    role: {
      en: "Director, Cai Lan Port Warehouse",
      vi: "Giám đốc kho cảng Cái Lân",
      zh: "盖麟港仓储总监",
    },
    bio: {
      en: "Commands Cai Lan port–warehouse operations in Quang Ninh — storage, stevedoring and international trade logistics that anchor the Group’s northern corridor.",
      vi: "Phụ trách kho cảng Cái Lân tại Quảng Ninh — lưu kho, bốc xếp và logistics thương mại quốc tế, trụ cột hành lang phía Bắc của Tập đoàn.",
      zh: "执掌广宁盖麟港仓储——仓储、装卸与国际贸易物流，支撑集团北部通道。",
    },
  },
  {
    id: "ha-van-huong",
    image: "/assets/img/leadership/ha-van-huong.jpg",
    name: {
      en: "Ha Van Huong",
      vi: "Hà Văn Hưởng",
      zh: "何文享",
    },
    role: {
      en: "Director, Pilmico Group JSC",
      vi: "Giám đốc CTCP Pilmico Group",
      zh: "Pilmico 集团股份公司总经理",
    },
    bio: {
      en: "Leads Pilmico Group JSC within the Nam Viet ecosystem — feed manufacturing capacity backed by warehouse and logistics services for industrial partners.",
      vi: "Điều hành CTCP Pilmico Group trong hệ sinh thái Nam Việt — năng lực sản xuất thức ăn gắn với dịch vụ kho bãi và logistics cho đối tác công nghiệp.",
      zh: "执掌南越生态内的 Pilmico 集团股份——饲料产能与面向产业伙伴的仓储物流服务并举。",
    },
  },
  {
    id: "nguyen-manh-ha",
    image: "/assets/img/leadership/nguyen-manh-ha.jpg",
    name: {
      en: "Nguyen Manh Ha",
      vi: "Nguyễn Mạnh Hà",
      zh: "阮孟河",
    },
    role: {
      en: "Director, Nam Viet Trade–Tourism Development JSC",
      vi: "Giám đốc CT TMDV&DL Nam Việt",
      zh: "南越贸易旅游发展股份公司总经理",
    },
    bio: {
      en: "Directs Nam Viet Trade–Tourism Development — hospitality, events and service platforms that extend the Group’s brand beyond core agribusiness.",
      vi: "Điều hành CTCP phát triển thương mại – du lịch Nam Việt — lưu trú, sự kiện và nền tảng dịch vụ mở rộng thương hiệu Tập đoàn ngoài lõi nông nghiệp.",
      zh: "执掌南越贸易旅游发展股份——住宿、活动与服务平台，延展集团品牌至农业主业之外。",
    },
  },
  {
    id: "le-van-mien",
    image: "/assets/img/leadership/le-van-mien.jpg",
    name: {
      en: "Le Van Mien",
      vi: "Lê Văn Miên",
      zh: "黎文绵",
    },
    role: {
      en: "Assistant to the General Director, Nam Viet JSC",
      vi: "Trợ lý Tổng GĐ CTCP Nam Việt",
      zh: "南越股份公司总经理助理",
    },
    bio: {
      en: "Coordinates executive agendas for Nam Viet JSC — bridging manufacturing priorities with Group-level initiatives and stakeholder programs.",
      vi: "Điều phối chương trình điều hành CTCP Nam Việt — kết nối ưu tiên sản xuất với các sáng kiến cấp Tập đoàn và chương trình đối tác.",
      zh: "协调南越股份公司高管议程——衔接制造重点与集团级举措及伙伴项目。",
    },
  },
  {
    id: "pham-van-dung",
    image: "/assets/img/leadership/pham-van-dung.jpg",
    name: {
      en: "Pham Van Dung",
      vi: "Phạm Văn Dũng",
      zh: "范文勇",
    },
    role: {
      en: "Director, Thai Nguyen Agriculture & Rural Development Construction JSC",
      vi: "GĐ CTCP XD&PTNT Thái Nguyên",
      zh: "太原农业农村建设发展股份公司总经理",
    },
    bio: {
      en: "Leads Thai Nguyen agriculture and rural development construction — infrastructure and farm-system projects that expand the Group’s real-economy footprint.",
      vi: "Điều hành CTCP xây dựng nông nghiệp & phát triển nông thôn Thái Nguyên — hạ tầng và mô hình trang trại mở rộng dấu ấn kinh tế thực của Tập đoàn.",
      zh: "执掌太原农业农村建设发展股份——基础设施与农场体系项目，拓展集团实体经济布局。",
    },
  },
  {
    id: "nguyen-manh-hai",
    image: "/assets/img/leadership/nguyen-manh-hai.jpg",
    name: {
      en: "Nguyen Manh Hai",
      vi: "Nguyễn Mạnh Hải",
      zh: "阮孟海",
    },
    role: {
      en: "Director, Nam Viet Logistics Co., Ltd.",
      vi: "GĐ TNHH LD Nam Việt",
      zh: "南越物流有限公司总经理",
    },
    bio: {
      en: "Runs Nam Viet Logistics — integrating warehouse, transport and distribution so Group cargo moves as one network, not isolated lanes.",
      vi: "Điều hành Logistics Nam Việt — tích hợp kho bãi, vận tải và phân phối để hàng hóa Tập đoàn vận hành như một mạng lưới thống nhất.",
      zh: "执掌南越物流——整合仓储、运输与分销，使集团货流作为一体网络而非割裂通道运转。",
    },
  },
];
