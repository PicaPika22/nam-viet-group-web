/**
 * Import news from https://www.namviet-jsc.com/vn/projects into src/news/posts/
 */
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const ROOT = path.resolve(__dirname, "..");
const NEWS_DIR = path.join(ROOT, "src/news/posts");
const IMG_DIR = path.join(ROOT, "src/assets/img/news");
const BASE = "https://www.namviet-jsc.com";

/** slug → MM/DD/YYYY from listing https://www.namviet-jsc.com/vn/projects */
const ARTICLES = [
  ["tap-doan-nam-viet-di-tham-nha-may-cua-tap-doan-dai-cuu-chau-quang-tay-trung-quoc", "08/10/2023", "tin-noi-bo"],
  ["hoi-thao-khoa-hoc", "12/10/2022", "tin-chuyen-nganh"],
  ["le-khai-xuan-dau-nam-moi-cua-cong-ty-co-phan-nam-viet", "09/19/2022", "tin-noi-bo"],
  ["thuc-an-chan-nuoi-nam-viet-da-dang-san-pham-vi-loi-ich-phat-trien-nganh-chan-nuoi-viet-nam", "04/01/2022", "tin-chuyen-nganh"],
  ["gioi-thieu-trung-tam-nghien-cuu-va-ung-dung-cong-nghe-nam-viet", "12/10/2020", "tin-noi-bo"],
  ["ket-noi-doanh-nghiep-and-co-so-dao-tao-nhan-luc", "12/08/2020", "tin-noi-bo"],
  ["tap-doan-dau-tu-va-phat-trien-nam-viet-to-chuc-kham-suc-khoe-dinh-ky-cho-can-bo-cong-nhan-vien", "12/06/2020", "tin-noi-bo"],
  ["chuyen-tham-quan-hop-tac-cua-tap-doan-nhat-ban-tai-tap-doan-dau-tu-va-phat-trien-nam-viet", "12/04/2020", "tin-noi-bo"],
];

const CATEGORY = {
  "tin-noi-bo": { vi: "Tin nội bộ", en: "Internal News", zh: "内部新闻" },
  "tin-chuyen-nganh": { vi: "Tin chuyên ngành", en: "Industry News", zh: "行业新闻" },
};

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent": "NamVietSiteImporter/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith("http")
            ? res.headers.location
            : BASE + res.headers.location;
          return fetchText(next).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      }
    );
    req.on("error", reject);
  });
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { headers: { "User-Agent": "NamVietSiteImporter/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith("http")
          ? res.headers.location
          : BASE + res.headers.location;
        return fetchBuffer(next).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
  });
}

function stripTags(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseDate(mmddyyyy) {
  // site uses MM/DD/YYYY
  const m = String(mmddyyyy || "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return "2020-01-01";
  return `${m[3]}-${m[1]}-${m[2]}`;
}

function absUrl(src) {
  if (!src) return "";
  src = String(src).replace(/&amp;/g, "&").trim();
  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return "https:" + src;
  return BASE + (src.startsWith("/") ? src : "/" + src);
}

/** Prefer direct Sanity CDN URL from Next.js image optimizer. */
function resolveImageUrl(src) {
  const u = absUrl(src);
  if (!u) return "";
  try {
    const parsed = new URL(u);
    if (parsed.pathname.includes("/_next/image") && parsed.searchParams.get("url")) {
      return decodeURIComponent(parsed.searchParams.get("url"));
    }
  } catch (_) {
    /* keep as-is */
  }
  const m = u.match(/url=(https?%3A%2F%2F[^&]+)/i);
  if (m) return decodeURIComponent(m[1]);
  return u;
}

function excerptFrom(text, n = 180) {
  const one = text.replace(/\s+/g, " ").trim();
  if (one.length <= n) return one;
  return one.slice(0, n).replace(/\s+\S*$/, "") + "…";
}

async function downloadImage(imgUrl, slug) {
  if (!imgUrl) return "/assets/img/hero.png";
  try {
    fs.mkdirSync(IMG_DIR, { recursive: true });
    const ext = path.extname(new URL(imgUrl).pathname).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
    const file = `${slug}${safeExt}`;
    const dest = path.join(IMG_DIR, file);
    if (!fs.existsSync(dest)) {
      const buf = await fetchBuffer(imgUrl);
      fs.writeFileSync(dest, buf);
    }
    return `/assets/img/news/${file}`;
  } catch (e) {
    console.warn("  image skip:", e.message);
    return "/assets/img/hero.png";
  }
}

function parseArticle(html, slug, listDate, catKey) {
  const h1 = decodeEntities(
    stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || slug)
  );
  const articleHtml = (html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) || [])[1] || "";
  let bodyText = stripTags(articleHtml);
  if (!bodyText || bodyText.length < 40) {
    const main = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || [])[1] || "";
    bodyText = stripTags(main);
  }

  const date = parseDate(listDate);

  // Images inside article column first, then page
  const scope = articleHtml || html;
  const imgs = [...scope.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]
    .map((m) => resolveImageUrl(m[1]))
    .filter(
      (u) =>
        u &&
        !/logo|icon|favicon|sprite|flag/i.test(u) &&
        !u.includes("data:")
    );
  // Also catch Sanity URLs embedded in next/image src even outside article
  if (!imgs.length) {
    for (const m of html.matchAll(/cdn\.sanity\.io\/images\/[^"'&\s]+/gi)) {
      imgs.push("https://" + m[0].replace(/^https?:\/\//, ""));
    }
  }

  return {
    title: h1,
    body: bodyText,
    date,
    imageCandidate: imgs[0] || "",
    category: CATEGORY[catKey] || CATEGORY["tin-noi-bo"],
    slug,
  };
}

function writePost(item, localImage) {
  const titleVi = item.title;
  const excerptVi = excerptFrom(item.body);
  const data = {
    title: { vi: titleVi, en: titleVi, zh: titleVi },
    category: item.category,
    date: item.date,
    image: localImage,
    excerpt: { vi: excerptVi, en: excerptVi, zh: excerptVi },
    body: {
      vi: item.body + "\n",
      en: item.body + "\n",
      zh: item.body + "\n",
    },
    source: `${BASE}/vn/projects/${item.slug}`,
  };
  const out = matter.stringify("\n", data);
  const file = path.join(NEWS_DIR, `${item.slug}.md`);
  fs.writeFileSync(file, out, "utf8");
  return file;
}

async function main() {
  fs.mkdirSync(NEWS_DIR, { recursive: true });
  // remove previous test import if present
  const test = path.join(NEWS_DIR, "nam-viet-thu-nghiem-content-studio.md");
  if (fs.existsSync(test)) fs.unlinkSync(test);

  const results = [];
  for (const [slug, listDate, catKey] of ARTICLES) {
    const url = `${BASE}/vn/projects/${slug}`;
    process.stdout.write(`→ ${slug}\n`);
    try {
      const html = await fetchText(url);
      const item = parseArticle(html, slug, listDate, catKey);
      if (!item.body || item.body.length < 20) {
        console.warn("  empty body, skip");
        continue;
      }
      console.log(`  img: ${item.imageCandidate.slice(0, 80) || "(none)"}`);
      const image = await downloadImage(item.imageCandidate, slug);
      const file = writePost(item, image);
      console.log(`  ok ${item.date} · ${item.title.slice(0, 60)}`);
      results.push({ slug, file, title: item.title, image });
    } catch (e) {
      console.error(`  FAIL: ${e.message}`);
    }
  }
  console.log(`\nImported ${results.length}/${ARTICLES.length} posts`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
