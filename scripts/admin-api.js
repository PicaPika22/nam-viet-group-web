/**
 * Local Admin API — Tin tức & Tuyển dụng
 * Port 8081 · CORS open for localhost Eleventy
 */
const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const matter = require("gray-matter");

const ROOT = path.resolve(__dirname, "..");
const NEWS_DIR = path.join(ROOT, "src/news/posts");
const JOBS_DIR = path.join(ROOT, "src/careers/jobs");
const IMG_DIR = path.join(ROOT, "src/assets/img");
const PORT = process.env.ADMIN_API_PORT || 8081;

const app = express();
app.use(express.json({ limit: "4mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

function ensureDirs() {
  for (const d of [NEWS_DIR, JOBS_DIR, IMG_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function slugify(input) {
  return String(input || "bai-viet")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "bai-viet";
}

function uniqueSlug(dir, base, ext = ".md") {
  let slug = base;
  let n = 2;
  while (fs.existsSync(path.join(dir, slug + ext))) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.includes("11tydata"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      return { file, slug: file.replace(/\.md$/, ""), data, content: content.trim() };
    });
}

function normalizeDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function writeNews(slug, payload) {
  if (!payload?.title || !(payload.title.vi || payload.title.en || payload.title.zh)) {
    throw new Error("Thiếu tiêu đề");
  }
  const data = {
    title: payload.title,
    category: payload.category,
    date: normalizeDate(payload.date),
    image: payload.image || "/assets/img/hero.png",
    excerpt: payload.excerpt,
    body: payload.body,
  };
  const out = matter.stringify("\n", data);
  fs.writeFileSync(path.join(NEWS_DIR, `${slug}.md`), out, "utf8");
}

function writeJob(slug, payload) {
  if (!payload?.title || !(payload.title.vi || payload.title.en || payload.title.zh)) {
    throw new Error("Thiếu tên vị trí");
  }
  const data = {
    id: payload.id || slug,
    order: Number(payload.order) || 10,
    title: payload.title,
    department: payload.department,
    location: payload.location,
    type: payload.type,
    summary: payload.summary,
  };
  const out = matter.stringify("\n", data);
  fs.writeFileSync(path.join(JOBS_DIR, `${slug}.md`), out, "utf8");
}

/* ── News ── */
app.get("/api/news", (_req, res) => {
  const items = listMarkdown(NEWS_DIR).sort(
    (a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0)
  );
  res.json(items);
});

app.get("/api/news/:slug", (req, res) => {
  const file = path.join(NEWS_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  res.json({ slug: req.params.slug, data, content: content.trim() });
});

app.post("/api/news", (req, res) => {
  try {
    const titleVi = req.body?.title?.vi || req.body?.title?.en || "bai-viet";
    const slug = uniqueSlug(NEWS_DIR, slugify(titleVi));
    writeNews(slug, req.body);
    res.status(201).json({ ok: true, slug });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.put("/api/news/:slug", (req, res) => {
  try {
    const file = path.join(NEWS_DIR, `${req.params.slug}.md`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });
    writeNews(req.params.slug, req.body);
    res.json({ ok: true, slug: req.params.slug });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.delete("/api/news/:slug", (req, res) => {
  const file = path.join(NEWS_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });
  fs.unlinkSync(file);
  res.json({ ok: true });
});

/* ── Careers ── */
app.get("/api/careers", (_req, res) => {
  const items = listMarkdown(JOBS_DIR).sort(
    (a, b) => (a.data.order || 0) - (b.data.order || 0)
  );
  res.json(items);
});

app.post("/api/careers", (req, res) => {
  try {
    const id = slugify(req.body?.id || req.body?.title?.vi || "vi-tri");
    const slug = uniqueSlug(JOBS_DIR, id);
    writeJob(slug, { ...req.body, id: slug });
    res.status(201).json({ ok: true, slug });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.put("/api/careers/:slug", (req, res) => {
  try {
    const file = path.join(JOBS_DIR, `${req.params.slug}.md`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });
    writeJob(req.params.slug, { ...req.body, id: req.body.id || req.params.slug });
    res.json({ ok: true, slug: req.params.slug });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.delete("/api/careers/:slug", (req, res) => {
  const file = path.join(JOBS_DIR, `${req.params.slug}.md`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });
  fs.unlinkSync(file);
  res.json({ ok: true });
});

/* ── Upload ── */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMG_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const base = slugify(path.basename(file.originalname, ext)) || "upload";
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error("Chỉ nhận file ảnh"));
  },
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  res.json({ ok: true, url: `/assets/img/${req.file.filename}` });
});

app.get("/api/health", (_req, res) => res.json({ ok: true, root: ROOT }));

ensureDirs();
app.listen(PORT, "127.0.0.1", () => {
  console.log(`[admin-api] http://127.0.0.1:${PORT}`);
});
