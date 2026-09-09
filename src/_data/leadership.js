/**
 * Leadership team — names/roles/photos from namviet-jsc.com/vn/about
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  BAND (bắt buộc) — KHÔNG đoán từ chức danh / tier số            ║
 * ║                                                                  ║
 * ║  "chairman"         → Chủ tịch Tập đoàn                         ║
 * ║  "group-support"    → Hỗ trợ Tập đoàn ONLY:                      ║
 * ║                       Nguyễn Thị Nụ, Hoàng Thanh Phong,           ║
 * ║                       Nguyễn Văn Đích (Giám đốc đối ngoại)        ║
 * ║  "member-director"  → Giám đốc công ty / đơn vị thành viên       ║
 * ║                       (gồm Lê Văn Miên — GĐ SCID Sông Công,       ║
 * ║                       AH Logistics & Du lịch Nam Việt;            ║
 * ║                       Feed Trading; kho Cái Lân)                  ║
 * ║                                                                  ║
 * ║  CẤM đưa vào group-support:                                      ║
 * ║    - nguyen-van-hung  (Giám đốc kho cảng Cái Lân)                 ║
 * ║    - nguyen-duc-hung  (GĐ Feed Trading)                           ║
 * ║    - le-van-mien      (GĐ SCID Sông Công / AH / Du lịch NV)       ║
 * ║    - mọi Giám đốc công ty thành viên khác                        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Portrait: 4:5 · 1800×2250 JPG · python scripts/normalize_leadership_photos.py
 * Optional: objectPosition (CSS), e.g. "center 18%"
 *
 * tier 1/2/3 được suy từ band (tương thích strip/orgchart cũ).
 * Templates Leadership gallery PHẢI lọc theo person.band — không dùng tier.
 */

const BAND = Object.freeze({
  CHAIRMAN: "chairman",
  GROUP_SUPPORT: "group-support",
  MEMBER_DIRECTOR: "member-director",
});

const TIER_FROM_BAND = Object.freeze({
  [BAND.CHAIRMAN]: 1,
  [BAND.GROUP_SUPPORT]: 2,
  [BAND.MEMBER_DIRECTOR]: 3,
});

/** IDs locked to group-support — ONLY these three */
const GROUP_SUPPORT_IDS = Object.freeze([
  "nguyen-thi-nu",
  "hoang-thanh-phong",
  "nguyen-van-dich", // Giám đốc đối ngoại
]);

/** Member-company directors — NEVER promote to group-support */
const MEMBER_DIRECTOR_IDS = Object.freeze([
  "le-van-mien", // GĐ SCID Sông Công, AH Logistics & Du lịch Nam Việt
  "ha-van-huong",
  "pham-van-dung",
  "nguyen-manh-hai",
  "nguyen-duc-hung", // Feed Trading — member director
  "nguyen-van-hung", // Cái Lân warehouse — member director (DO NOT move to support)
]);

const people = [
  {
    id: "ha-van-an",
    band: BAND.CHAIRMAN,
    order: 1,
    featured: true,
    objectPosition: "center 18%",
    image: "/assets/img/leadership/ha-van-an.jpg",
    name: {
      en: "Ha Van An",
      vi: "Hà Văn An",
      zh: "何文安",
    },
    role: {
      en: "Chairman of the Group",
      vi: "Chủ tịch Tập đoàn",
      zh: "集团主席",
    },
    bio: {
      en: "At Nam Viet, we are committed to sustainable agriculture. We balance stakeholder interests while prioritizing environmental protection — advancing eco-friendly farming solutions, food security and rural growth, and creating lasting value for customers, partners and society.",
      vi: "Tại Nam Việt, chúng tôi cam kết phát triển nông nghiệp bền vững. Chúng tôi cân bằng lợi ích các bên liên quan, ưu tiên bảo vệ môi trường — đi đầu giải pháp canh tác thân thiện môi trường, an ninh lương thực và tăng trưởng kinh tế nông thôn, tạo giá trị lâu dài cho khách hàng, đối tác và xã hội.",
      zh: "在南越，我们致力于可持续农业。平衡各方利益、优先保护环境——推进环保耕作、粮食安全与农村增长，为客户、伙伴与社会创造长期价值。",
    },
  },
  {
    id: "nguyen-thi-nu",
    band: BAND.GROUP_SUPPORT,
    order: 10,
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
      en: "Supports Group executive leadership across member companies — turning strategy into day-to-day management and coordinated performance.",
      vi: "Hỗ trợ điều hành Tập đoàn tại các công ty thành viên — đưa định hướng lãnh đạo vào quản trị hàng ngày và hiệu quả phối hợp liên đơn vị.",
      zh: "协助集团在各成员企业的经营领导——将领导层方向落实为日常管理与跨单元协同绩效。",
    },
  },
  {
    id: "hoang-thanh-phong",
    band: BAND.GROUP_SUPPORT,
    order: 20,
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
      en: "Leads Group accounting and consolidated reporting — upholding transparency, capital discipline and financial standards across the Nam Viet ecosystem.",
      vi: "Phụ trách kế toán và báo cáo hợp nhất Tập đoàn — bảo đảm minh bạch, kỷ luật vốn và chuẩn mực tài chính trong toàn hệ sinh thái Nam Việt.",
      zh: "负责集团会计与合并报表——在南越生态内维护透明、资本纪律与财务标准。",
    },
  },
  {
    id: "le-van-mien",
    band: BAND.MEMBER_DIRECTOR,
    order: 95,
    image: "/assets/img/leadership/le-van-mien.jpg",
    name: {
      en: "Le Van Mien",
      vi: "Lê Văn Miên",
      zh: "黎文绵",
    },
    role: {
      en: "Director — Song Cong Industrial Development, AH Logistics & Nam Viet Tourism",
      vi: "Giám đốc SCID Sông Công, AH Logistics & Du lịch Nam Việt",
      zh: "宋功工业发展、AH Logistics 及南越旅游总经理",
    },
    bio: {
      en: "Leads Song Cong Industrial Development (SCID) on 20 ha in Song Cong II Industrial Park, directs AH Logistics, and now runs Nam Viet Trade–Services–Tourism Development — pairing the Group's industrial base in Thai Nguyen with its hospitality and services platform.",
      vi: "Điều hành CTCP Phát triển Công nghiệp Sông Công (SCID) trên 20ha tại KCN Sông Công II, làm Giám đốc CTCP AH Logistics và nay phụ trách CTCP Thương mại – Dịch vụ & Du lịch Nam Việt — gắn nền tảng công nghiệp của Tập đoàn tại Thái Nguyên với mảng lưu trú và dịch vụ.",
      zh: "执掌宋功工业发展（SCID，宋功二号工业园20公顷），兼任 AH Logistics 总经理，并接管南越贸易服务旅游发展——将集团在太原的工业基础与住宿及服务平台相结合。",
    },
  },
  {
    id: "nguyen-van-dich",
    band: BAND.GROUP_SUPPORT,
    order: 30,
    image: "/assets/img/leadership/nguyen-van-dich.jpg",
    name: {
      en: "Nguyen Van Dich",
      vi: "Nguyễn Văn Đích",
      zh: "阮文的",
    },
    role: {
      en: "Director of External Affairs",
      vi: "Giám đốc đối ngoại",
      zh: "对外事务总监",
    },
    bio: {
      en: "Leads external affairs for the Group — partner relations, investment promotion and stakeholder engagement across the Nam Viet ecosystem.",
      vi: "Phụ trách công tác đối ngoại của Tập đoàn — quan hệ đối tác, xúc tiến đầu tư và kết nối các bên liên quan trong hệ sinh thái Nam Việt.",
      zh: "负责集团对外事务——伙伴关系、投资促进与南越生态内各方联络。",
    },
  },
  {
    id: "ha-van-huong",
    band: BAND.MEMBER_DIRECTOR,
    order: 100,
    image: "/assets/img/leadership/ha-van-huong.jpg",
    name: {
      en: "Ha Van Huong",
      vi: "Hà Văn Hưởng",
      zh: "何文享",
    },
    role: {
      en: "Director, Vapco Production & Trading Co., Ltd. & Nam Viet Trade Logistics JSC",
      vi: "Giám đốc, Công ty TNHH SX & TM Vapco & CTCP Thương mại Logistics Nam Việt",
      zh: "Vapco 生产贸易有限公司及南越贸易物流股份公司总经理",
    },
    bio: {
      en: "Runs Vapco and Nam Viet Trade Logistics — premises leasing, warehousing and cargo services that host industrial tenants and keep Group logistics moving as one network.",
      vi: "Điều hành Vapco và Thương mại Logistics Nam Việt — cho thuê mặt bằng, kho bãi và dịch vụ hàng hóa, đón doanh nghiệp sản xuất và vận hành logistics Tập đoàn như một mạng lưới.",
      zh: "执掌 Vapco 与南越贸易物流——场地租赁、仓储与货运服务，承接入驻企业并使集团物流作为一体网络运转。",
    },
  },
  {
    id: "pham-van-dung",
    band: BAND.MEMBER_DIRECTOR,
    order: 120,
    image: "/assets/img/leadership/pham-van-dung.jpg",
    name: {
      en: "Pham Van Dung",
      vi: "Phạm Văn Dũng",
      zh: "范文勇",
    },
    role: {
      en: "Director, Pilmico Group JSC & AG Logistics JSC",
      vi: "Giám đốc, CTCP Pilmico Group & CTCP AG Logistics",
      zh: "Pilmico 集团股份公司及 AG Logistics 股份公司总经理",
    },
    bio: {
      en: "Leads Pilmico Group feed manufacturing and directs AG Logistics — production capacity paired with premises and logistics support for industrial partners in the Nam Viet ecosystem.",
      vi: "Điều hành sản xuất thức ăn tại CTCP Pilmico Group và làm Giám đốc CTCP AG Logistics — năng lực sản xuất gắn với hỗ trợ mặt bằng và logistics cho đối tác công nghiệp trong hệ sinh thái Nam Việt.",
      zh: "执掌 Pilmico 集团饲料生产并兼任 AG Logistics 总经理——产能与面向产业伙伴的场地及物流支持并举。",
    },
  },
  {
    id: "nguyen-manh-hai",
    band: BAND.MEMBER_DIRECTOR,
    order: 130,
    image: "/assets/img/leadership/nguyen-manh-hai.jpg",
    name: {
      en: "Nguyen Manh Hai",
      vi: "Nguyễn Mạnh Hải",
      zh: "阮孟海",
    },
    role: {
      en: "Director, Nam Viet Logistics Co., Ltd.",
      vi: "Giám đốc, CT TNHH Logistics Nam Việt",
      zh: "南越物流有限公司总经理",
    },
    bio: {
      en: "Runs Nam Viet Logistics — integrating warehouse, transport and distribution so Group cargo moves as one network, not isolated lanes.",
      vi: "Điều hành Logistics Nam Việt — tích hợp kho bãi, vận tải và phân phối để hàng hóa Tập đoàn vận hành như một mạng lưới thống nhất.",
      zh: "执掌南越物流——整合仓储、运输与分销，使集团货流作为一体网络而非割裂通道运转。",
    },
  },
  {
    id: "nguyen-duc-hung",
    band: BAND.MEMBER_DIRECTOR,
    order: 140,
    image: "/assets/img/leadership/nguyen-duc-hung.jpg",
    name: {
      en: "Nguyen Duc Hung",
      vi: "Nguyễn Đức Hùng",
      zh: "阮德雄",
    },
    role: {
      en: "Director, Feed Trading Vietnam Co., Ltd.",
      vi: "Giám đốc, CT TNHH Feed Trading Việt Nam",
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
    band: BAND.MEMBER_DIRECTOR,
    order: 150,
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
      en: "Leads Cai Lan port–warehouse operations in Quang Ninh — storage, stevedoring and international trade logistics that anchor the Group’s northern corridor.",
      vi: "Phụ trách kho cảng Cái Lân tại Quảng Ninh — lưu kho, bốc xếp và logistics thương mại quốc tế, trụ cột hành lang phía Bắc của Tập đoàn.",
      zh: "执掌广宁盖麟港仓储——仓储、装卸与国际贸易物流，支撑集团北部通道。",
    },
  },
];

function assertBands(list) {
  const byId = Object.fromEntries(list.map((p) => [p.id, p]));

  for (const id of GROUP_SUPPORT_IDS) {
    if (!byId[id] || byId[id].band !== BAND.GROUP_SUPPORT) {
      throw new Error(
        `[leadership] ${id} MUST be band="${BAND.GROUP_SUPPORT}" (Hỗ trợ Tập đoàn)`
      );
    }
  }

  for (const id of MEMBER_DIRECTOR_IDS) {
    if (!byId[id] || byId[id].band !== BAND.MEMBER_DIRECTOR) {
      throw new Error(
        `[leadership] ${id} MUST be band="${BAND.MEMBER_DIRECTOR}" (Giám đốc CT thành viên) — NEVER group-support`
      );
    }
  }

  if (!byId["ha-van-an"] || byId["ha-van-an"].band !== BAND.CHAIRMAN) {
    throw new Error(`[leadership] ha-van-an MUST be band="${BAND.CHAIRMAN}"`);
  }

  const supportExtras = list.filter(
    (p) => p.band === BAND.GROUP_SUPPORT && !GROUP_SUPPORT_IDS.includes(p.id)
  );
  if (supportExtras.length) {
    throw new Error(
      `[leadership] Extra group-support IDs not allowed: ${supportExtras
        .map((p) => p.id)
        .join(", ")}`
    );
  }
}

const leadership = people
  .map((p) => {
    if (!TIER_FROM_BAND[p.band]) {
      throw new Error(`[leadership] Unknown band "${p.band}" on ${p.id}`);
    }
    return {
      ...p,
      tier: TIER_FROM_BAND[p.band],
      // Booleans for Nunjucks — avoid person.band dotted lookup quirks
      isChairman: p.band === BAND.CHAIRMAN,
      isGroupSupport: p.band === BAND.GROUP_SUPPORT,
      isMemberDirector: p.band === BAND.MEMBER_DIRECTOR,
    };
  })
  .sort((a, b) => (a.order || 0) - (b.order || 0));

assertBands(leadership);

module.exports = leadership;
