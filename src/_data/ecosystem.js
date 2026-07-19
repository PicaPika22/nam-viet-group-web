/** Nam Viet Group ecosystem — sectors + member companies */
module.exports = {
  intro: {
    en: "One group. Six pillars. Companies and units working as a single value chain.",
    vi: "Một tập đoàn. Sáu trụ cột. Các công ty và đơn vị vận hành như một chuỗi giá trị.",
    zh: "一个集团，六大支柱。成员企业与单位协同形成一体化价值链。",
  },
  sectors: [
    {
      id: "feed",
      image: "/assets/img/products.png",
      key: { en: "01", vi: "01", zh: "01" },
      title: {
        en: "Feed & Nutrition",
        vi: "Thức ăn chăn nuôi",
        zh: "饲料营养",
      },
      blurb: {
        en: "Core manufacturing of livestock and poultry feed across the Group.",
        vi: "Sản xuất cốt lõi thức ăn chăn nuôi gia súc, gia cầm trong tập đoàn.",
        zh: "集团核心畜禽饲料生产业务。",
      },
      companies: [
        {
          id: "nam-viet",
          year: "2002",
          short: { en: "Nam Viet JSC", vi: "CTCP Nam Việt", zh: "南越股份" },
          name: {
            en: "Nam Viet Joint Stock Company",
            vi: "Công ty Cổ phần Nam Việt",
            zh: "南越股份公司",
          },
          desc: {
            en: "Core company — livestock & poultry feed manufacturing.",
            vi: "Đơn vị cốt lõi sản xuất thức ăn chăn nuôi gia súc, gia cầm.",
            zh: "核心企业，专注畜禽饲料生产。",
          },
        },
        {
          id: "fimico",
          year: "2014",
          short: { en: "Fimico Group", vi: "Fimico Group", zh: "Fimico" },
          name: {
            en: "Fimico Group International JSC",
            vi: "Công ty Cổ phần Quốc tế Fimico Group",
            zh: "Fimico 国际股份公司",
          },
          desc: {
            en: "Feed production; since 2021 also transport & warehouse leasing.",
            vi: "Thức ăn chăn nuôi; từ 2021 thêm vận tải và cho thuê kho bãi.",
            zh: "饲料生产；2021年起拓展运输与仓储租赁。",
          },
        },
        {
          id: "feed-trading",
          year: null,
          short: { en: "Feed Trading", vi: "Feed Trading", zh: "Feed Trading" },
          name: {
            en: "Feed Trading Co., Ltd.",
            vi: "Công ty TNHH Feed Trading",
            zh: "Feed Trading 有限公司",
          },
          desc: {
            en: "Animal feed and related trading.",
            vi: "Thức ăn chăn nuôi và thương mại liên quan.",
            zh: "饲料及相关贸易。",
          },
        },
      ],
    },
    {
      id: "logistics",
      image: "/assets/img/logistics.png",
      key: { en: "02", vi: "02", zh: "02" },
      title: {
        en: "Logistics & Ports",
        vi: "Logistics & cảng",
        zh: "物流与港口",
      },
      blurb: {
        en: "Warehousing, transport and port storage to international standards.",
        vi: "Kho bãi, vận tải và kho cảng theo tiêu chuẩn quốc tế.",
        zh: "国际标准仓储、运输与港口仓储。",
      },
      companies: [
        {
          id: "hutech",
          year: "2022",
          short: { en: "Hutech Vietnam", vi: "Hutech Việt Nam", zh: "Hutech" },
          name: {
            en: "Hutech Vietnam Co., Ltd.",
            vi: "Công ty TNHH Hutech Việt Nam",
            zh: "Hutech Vietnam 有限公司",
          },
          desc: {
            en: "100% acquired in 2022 — international warehousing & logistics.",
            vi: "Mua lại 100% năm 2022 — kho bãi & logistics chuẩn quốc tế.",
            zh: "2022年全资收购，国际标准仓储物流。",
          },
        },
        {
          id: "logistics-nv",
          year: null,
          short: { en: "Nam Viet Logistics", vi: "Logistics Nam Việt", zh: "南越物流" },
          name: {
            en: "Nam Viet Logistics JSC",
            vi: "Công ty Cổ phần Logistics Nam Việt",
            zh: "南越物流股份公司",
          },
          desc: {
            en: "Specialized transport and logistics.",
            vi: "Chuyên vận tải và logistics.",
            zh: "专业运输与物流。",
          },
        },
        {
          id: "warehouse-qn",
          year: "2017",
          unit: true,
          short: { en: "Cai Lan Warehouse", vi: "Tổng kho Cái Lân", zh: "盖麟总仓" },
          name: {
            en: "Nam Viet Agricultural Warehouse (Cai Lan, Quang Ninh)",
            vi: "Tổng kho nông sản Nam Việt — Kho cảng Quảng Ninh",
            zh: "南越农产品总仓（广宁盖麟）",
          },
          desc: {
            en: "Est. 2017 at Cai Lan — agri storage and import/export.",
            vi: "Thành lập 2017 tại Cái Lân — lưu giữ & xuất nhập khẩu nông sản.",
            zh: "2017年成立于盖麟，服务农产品仓储进出口。",
          },
        },
      ],
    },
    {
      id: "trade",
      image: "/assets/img/manufacturing.png",
      key: { en: "03", vi: "03", zh: "03" },
      title: {
        en: "Trade & Energy",
        vi: "Thương mại & năng lượng",
        zh: "贸易与能源",
      },
      blurb: {
        en: "Agri imports, wood-pellet export and fuel retail.",
        vi: "Nhập khẩu nông sản, xuất khẩu viên nén gỗ và bán lẻ xăng dầu.",
        zh: "农产品进口、木颗粒出口与燃油零售。",
      },
      companies: [
        {
          id: "trading-vn",
          year: null,
          short: { en: "Trading Vietnam", vi: "Trading Việt Nam", zh: "Trading VN" },
          name: {
            en: "Trading Vietnam Co., Ltd.",
            vi: "Công ty TNHH Trading Việt Nam",
            zh: "Trading Vietnam 有限公司",
          },
          desc: {
            en: "Agri imports for feed, wood-pellet export, fuel distribution.",
            vi: "Nhập khẩu nông sản, xuất khẩu viên nén gỗ, phân phối xăng dầu.",
            zh: "饲料原料进口、木颗粒出口与燃油分销。",
          },
        },
        {
          id: "vapco",
          year: null,
          short: { en: "Vapco", vi: "Vapco", zh: "Vapco" },
          name: {
            en: "Vapco International Production & Trading Co., Ltd.",
            vi: "Công ty TNHH Sản xuất và Thương mại Quốc tế Vapco",
            zh: "Vapco 国际生产与贸易有限公司",
          },
          desc: {
            en: "Production and international trading.",
            vi: "Sản xuất và thương mại quốc tế.",
            zh: "生产与国际贸易。",
          },
        },
        {
          id: "fuel",
          year: "2016",
          short: { en: "Nam Viet Fuel", vi: "Xăng dầu Nam Việt", zh: "南越石油" },
          name: {
            en: "Nam Viet Petroleum / Petrol Station No. 1",
            vi: "Công ty Xăng dầu Nam Việt (CHXD số 1)",
            zh: "南越石油（1号加油站）",
          },
          desc: {
            en: "Joined 2016 — fuel retail.",
            vi: "Gia nhập 2016 — bán lẻ xăng dầu.",
            zh: "2016年加入，燃油零售。",
          },
        },
      ],
    },
    {
      id: "infra",
      image: "/assets/img/about.png",
      key: { en: "04", vi: "04", zh: "04" },
      title: {
        en: "Infrastructure & Farms",
        vi: "Hạ tầng & trang trại",
        zh: "基建与农场",
      },
      blurb: {
        en: "Agricultural infrastructure, farms and real estate development.",
        vi: "Xây dựng hạ tầng nông nghiệp, trang trại và bất động sản.",
        zh: "农业基建、农场与房地产开发。",
      },
      companies: [
        {
          id: "xdnn-tn",
          year: "2018",
          short: { en: "Thai Nguyen Agri Construction", vi: "XDNN Thái Nguyên", zh: "太原农建" },
          name: {
            en: "Thai Nguyen Agricultural Construction & Rural Development JSC",
            vi: "CTCP Xây dựng Nông nghiệp và Phát triển Nông thôn Thái Nguyên",
            zh: "太原农业建设与农村发展股份公司",
          },
          desc: {
            en: "Joined 2018 — infrastructure, farms and real estate.",
            vi: "Gia nhập 2018 — hạ tầng, trang trại và bất động sản.",
            zh: "2018年加入，基建、农场与房地产。",
          },
        },
      ],
    },
    {
      id: "hospitality",
      image: "/assets/img/cta.png",
      key: { en: "05", vi: "05", zh: "05" },
      title: {
        en: "Hospitality",
        vi: "Du lịch & khách sạn",
        zh: "旅游酒店",
      },
      blurb: {
        en: "The King restaurants and 4-star hotel & condotel.",
        vi: "Hệ thống nhà hàng The King và khách sạn 4 sao The King Hotel & Condotel.",
        zh: "The King 餐饮与四星酒店 Condotel。",
      },
      companies: [
        {
          id: "tourism",
          year: null,
          short: { en: "Nam Viet Tourism", vi: "Du lịch Nam Việt", zh: "南越旅游" },
          name: {
            en: "Nam Viet Trade, Services & Tourism Development JSC",
            vi: "CTCP Phát triển Thương mại Dịch vụ và Du lịch Nam Việt",
            zh: "南越贸易服务与旅游发展股份公司",
          },
          desc: {
            en: "The King restaurants and The King Hotel & Condotel.",
            vi: "Nhà hàng The King và The King Hotel & Condotel.",
            zh: "The King 餐饮与 The King Hotel & Condotel。",
          },
        },
      ],
    },
    {
      id: "research",
      image: "/assets/img/sustainability.png",
      key: { en: "06", vi: "06", zh: "06" },
      title: {
        en: "Research & Quality",
        vi: "Nghiên cứu & chất lượng",
        zh: "研发与质量",
      },
      blurb: {
        en: "Quality control, animal health research and probiotics.",
        vi: "Kiểm soát chất lượng, nghiên cứu bệnh dịch và men vi sinh.",
        zh: "质量控制、疫病研究与益生菌。",
      },
      companies: [
        {
          id: "rd-center",
          year: "2016",
          unit: true,
          short: { en: "R&D Center", vi: "Trung tâm NC&ƯD", zh: "研发中心" },
          name: {
            en: "Nam Viet Technology Research & Application Center",
            vi: "Trung tâm Nghiên cứu và Ứng dụng Công nghệ Nam Việt",
            zh: "南越技术研究与应用中心",
          },
          desc: {
            en: "Est. 2016 — QC, disease research, probiotics.",
            vi: "Thành lập 2016 — kiểm soát chất lượng, bệnh dịch, men vi sinh.",
            zh: "2016年成立，质控、疫病与益生菌研究。",
          },
        },
      ],
    },
  ],
};
