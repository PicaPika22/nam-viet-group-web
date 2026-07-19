/**
 * Nam Viet Content Studio API
 *
 * Local:  writes markdown to disk (npm run cms)
 * Railway: commits via GitHub Contents API → Vercel rebuilds the site
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
const NEWS_IMG_DIR = path.join(IMG_DIR, "news");
const ADMIN_DIR = path.join(ROOT, "src/admin");

const PORT = Number(process.env.PORT || process.env.ADMIN_API_PORT || 8081);
const HOST = process.env.HOST || "0.0.0.0";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_REPO = process.env.GITHUB_REPO || ""; // owner/repo
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const REMOTE = Boolean(GITHUB_TOKEN && GITHUB_REPO);

const ADMIN_USER = process.env.ADMIN_USER || "";
const ADMIN_PASS = process.env.ADMIN_PASS || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const app = express();
app.use(express.json({ limit: "8mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Admin-Token"
  );
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

function ensureDirs() {
  for (const d of [NEWS_DIR, JOBS_DIR, IMG_DIR, NEWS_IMG_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

function slugify(input) {
  return (
    String(input || "bai-viet")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "bai-viet"
  );
}

function normalizeDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function newsMarkdown(payload) {
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
  return matter.stringify("\n", data);
}

function jobMarkdown(payload, slug) {
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
  return matter.stringify("\n", data);
}

/* ── Auth ── */
function authEnabled() {
  return Boolean(ADMIN_TOKEN || (ADMIN_USER && ADMIN_PASS));
}

function checkAuth(req) {
  if (!authEnabled()) return true;
  const header = req.headers.authorization || "";
  const tokenHeader = req.headers["x-admin-token"];
  if (ADMIN_TOKEN && (tokenHeader === ADMIN_TOKEN || header === `Bearer ${ADMIN_TOKEN}`)) {
    return true;
  }
  if (ADMIN_USER && ADMIN_PASS && header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const [u, p] = decoded.split(":");
    return u === ADMIN_USER && p === ADMIN_PASS;
  }
  return false;
}

function requireAuth(req, res, next) {
  if (req.method === "OPTIONS") return next();
  if (req.path === "/api/health" || req.path === "/api/login") return next();
  if (!authEnabled()) return next();
  if (checkAuth(req)) return next();
  res.setHeader("WWW-Authenticate", 'Basic realm="Nam Viet Studio"');
  return res.status(401).json({ error: "Unauthorized" });
}

app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) return next();
  return requireAuth(req, res, next);
});

app.post("/api/login", (req, res) => {
  if (!authEnabled()) return res.json({ ok: true, mode: "open" });
  const { user, password, token } = req.body || {};
  if (ADMIN_TOKEN && token === ADMIN_TOKEN) {
    return res.json({ ok: true, token: ADMIN_TOKEN });
  }
  if (ADMIN_USER && ADMIN_PASS && user === ADMIN_USER && password === ADMIN_PASS) {
    const basic = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString("base64");
    return res.json({ ok: true, basic });
  }
  return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu" });
});

/* ── GitHub Contents API ── */
async function gh(pathname, opts = {}) {
  const url = `https://api.github.com/repos/${GITHUB_REPO}${pathname}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "nam-viet-content-studio",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data.message || res.statusText || "GitHub API error";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function ghGetFile(filePath) {
  try {
    return await gh(
      `/contents/${encodeURI(filePath)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
    );
  } catch (e) {
    if (e.status === 404) return null;
    throw e;
  }
}

async function ghPutFile(filePath, content, message, sha) {
  const body = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;
  return gh(`/contents/${encodeURI(filePath)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function ghPutBinary(filePath, buffer, message, sha) {
  const body = {
    message,
    content: buffer.toString("base64"),
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;
  return gh(`/contents/${encodeURI(filePath)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function ghDeleteFile(filePath, message, sha) {
  return gh(`/contents/${encodeURI(filePath)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sha, branch: GITHUB_BRANCH }),
  });
}

async function ghListDir(dirPath) {
  try {
    const data = await gh(
      `/contents/${encodeURI(dirPath)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
    );
    return Array.isArray(data) ? data : [];
  } catch (e) {
    if (e.status === 404) return [];
    throw e;
  }
}

async function remoteListMarkdown(dirPath) {
  const entries = await ghListDir(dirPath);
  const files = entries.filter(
    (f) => f.type === "file" && f.name.endsWith(".md") && !f.name.includes("11tydata")
  );
  const items = [];
  for (const f of files) {
    const file = await ghGetFile(`${dirPath}/${f.name}`);
    if (!file?.content) continue;
    const raw = Buffer.from(file.content, "base64").toString("utf8");
    const { data, content } = matter(raw);
    items.push({
      file: f.name,
      slug: f.name.replace(/\.md$/, ""),
      data,
      content: content.trim(),
      sha: file.sha,
    });
  }
  return items;
}

async function remoteUniqueSlug(dirPath, base) {
  let slug = base;
  let n = 2;
  while (await ghGetFile(`${dirPath}/${slug}.md`)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

/* ── Local FS helpers ── */
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

function writeNewsLocal(slug, payload) {
  const out = newsMarkdown(payload);
  fs.writeFileSync(path.join(NEWS_DIR, `${slug}.md`), out, "utf8");
}

function writeJobLocal(slug, payload) {
  const out = jobMarkdown(payload, slug);
  fs.writeFileSync(path.join(JOBS_DIR, `${slug}.md`), out, "utf8");
}

/* ── News routes ── */
app.get("/api/news", async (_req, res) => {
  try {
    const items = REMOTE
      ? await remoteListMarkdown("src/news/posts")
      : listMarkdown(NEWS_DIR);
    items.sort((a, b) => new Date(b.data.date || 0) - new Date(a.data.date || 0));
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get("/api/news/:slug", async (req, res) => {
  try {
    if (REMOTE) {
      const file = await ghGetFile(`src/news/posts/${req.params.slug}.md`);
      if (!file) return res.status(404).json({ error: "Not found" });
      const raw = Buffer.from(file.content, "base64").toString("utf8");
      const { data, content } = matter(raw);
      return res.json({
        slug: req.params.slug,
        data,
        content: content.trim(),
        sha: file.sha,
      });
    }
    const file = path.join(NEWS_DIR, `${req.params.slug}.md`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });
    const { data, content } = matter(fs.readFileSync(file, "utf8"));
    res.json({ slug: req.params.slug, data, content: content.trim() });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.post("/api/news", async (req, res) => {
  try {
    const titleVi = req.body?.title?.vi || req.body?.title?.en || "bai-viet";
    const base = slugify(titleVi);
    if (REMOTE) {
      const slug = await remoteUniqueSlug("src/news/posts", base);
      const content = newsMarkdown(req.body);
      await ghPutFile(
        `src/news/posts/${slug}.md`,
        content,
        `content: publish news ${slug}`
      );
      return res.status(201).json({ ok: true, slug, remote: true });
    }
    const slug = uniqueSlug(NEWS_DIR, base);
    writeNewsLocal(slug, req.body);
    res.status(201).json({ ok: true, slug });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.put("/api/news/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    if (REMOTE) {
      const existing = await ghGetFile(`src/news/posts/${slug}.md`);
      if (!existing) return res.status(404).json({ error: "Not found" });
      const content = newsMarkdown(req.body);
      await ghPutFile(
        `src/news/posts/${slug}.md`,
        content,
        `content: update news ${slug}`,
        existing.sha
      );
      return res.json({ ok: true, slug, remote: true });
    }
    const file = path.join(NEWS_DIR, `${slug}.md`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });
    writeNewsLocal(slug, req.body);
    res.json({ ok: true, slug });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.delete("/api/news/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    if (REMOTE) {
      const existing = await ghGetFile(`src/news/posts/${slug}.md`);
      if (!existing) return res.status(404).json({ error: "Not found" });
      await ghDeleteFile(
        `src/news/posts/${slug}.md`,
        `content: delete news ${slug}`,
        existing.sha
      );
      return res.json({ ok: true, remote: true });
    }
    const file = path.join(NEWS_DIR, `${slug}.md`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });
    fs.unlinkSync(file);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

/* ── Careers ── */
app.get("/api/careers", async (_req, res) => {
  try {
    const items = REMOTE
      ? await remoteListMarkdown("src/careers/jobs")
      : listMarkdown(JOBS_DIR);
    items.sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.post("/api/careers", async (req, res) => {
  try {
    const id = slugify(req.body?.id || req.body?.title?.vi || "vi-tri");
    if (REMOTE) {
      const slug = await remoteUniqueSlug("src/careers/jobs", id);
      const content = jobMarkdown({ ...req.body, id: slug }, slug);
      await ghPutFile(
        `src/careers/jobs/${slug}.md`,
        content,
        `content: publish job ${slug}`
      );
      return res.status(201).json({ ok: true, slug, remote: true });
    }
    const slug = uniqueSlug(JOBS_DIR, id);
    writeJobLocal(slug, { ...req.body, id: slug });
    res.status(201).json({ ok: true, slug });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.put("/api/careers/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    if (REMOTE) {
      const existing = await ghGetFile(`src/careers/jobs/${slug}.md`);
      if (!existing) return res.status(404).json({ error: "Not found" });
      const content = jobMarkdown(
        { ...req.body, id: req.body.id || slug },
        slug
      );
      await ghPutFile(
        `src/careers/jobs/${slug}.md`,
        content,
        `content: update job ${slug}`,
        existing.sha
      );
      return res.json({ ok: true, slug, remote: true });
    }
    const file = path.join(JOBS_DIR, `${slug}.md`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });
    writeJobLocal(slug, { ...req.body, id: req.body.id || slug });
    res.json({ ok: true, slug });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.delete("/api/careers/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    if (REMOTE) {
      const existing = await ghGetFile(`src/careers/jobs/${slug}.md`);
      if (!existing) return res.status(404).json({ error: "Not found" });
      await ghDeleteFile(
        `src/careers/jobs/${slug}.md`,
        `content: delete job ${slug}`,
        existing.sha
      );
      return res.json({ ok: true, remote: true });
    }
    const file = path.join(JOBS_DIR, `${slug}.md`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: "Not found" });
    fs.unlinkSync(file);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

/* ── Upload ── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error("Chỉ nhận file ảnh"));
  },
});

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
      ? ext
      : ".jpg";
    const base = slugify(path.basename(req.file.originalname, ext)) || "upload";
    const filename = `${base}-${Date.now()}${safeExt}`;
    const rel = `src/assets/img/news/${filename}`;
    const publicUrl = `/assets/img/news/${filename}`;

    if (REMOTE) {
      await ghPutBinary(rel, req.file.buffer, `content: upload ${filename}`);
      return res.json({ ok: true, url: publicUrl, remote: true });
    }
    ensureDirs();
    fs.writeFileSync(path.join(NEWS_IMG_DIR, filename), req.file.buffer);
    res.json({ ok: true, url: publicUrl });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    mode: REMOTE ? "github" : "local",
    repo: REMOTE ? GITHUB_REPO : null,
    branch: REMOTE ? GITHUB_BRANCH : null,
    auth: authEnabled(),
    siteUrl: process.env.SITE_URL || "/",
  })
);

/* ── Static admin UI + assets (Railway) ── */
app.get("/", (_req, res) => res.redirect("/admin/"));
if (fs.existsSync(ADMIN_DIR)) {
  app.use("/admin", express.static(ADMIN_DIR, { index: "index.html" }));
}
app.use("/assets", express.static(path.join(ROOT, "src/assets")));

ensureDirs();
app.listen(PORT, HOST, () => {
  console.log(`[admin-api] http://${HOST}:${PORT}`);
  console.log(`[admin-api] mode=${REMOTE ? "github:" + GITHUB_REPO : "local"}`);
  if (authEnabled()) console.log("[admin-api] auth=on");
});
