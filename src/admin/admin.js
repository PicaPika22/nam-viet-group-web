(() => {
  "use strict";

  const metaApi = document.querySelector('meta[name="admin-api"]')?.content?.trim();
  const API =
    metaApi ||
    (location.port === "8125" || location.port === "8080"
      ? "http://127.0.0.1:8081/api"
      : `${location.origin}/api`);
  const LANGS = ["vi", "en", "zh"];
  const AUTH_KEY = "nv_studio_auth";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const state = {
    tab: "news",
    lang: "vi",
    editing: null,
    news: [],
    careers: [],
    query: "",
    form: emptyNews(),
    job: emptyJob(),
    slugLocked: false,
    auth: null,
    mode: "local",
  };

  function loadAuth() {
    try {
      state.auth = JSON.parse(sessionStorage.getItem(AUTH_KEY) || "null");
    } catch {
      state.auth = null;
    }
  }

  function saveAuth(auth) {
    state.auth = auth;
    if (auth) sessionStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    else sessionStorage.removeItem(AUTH_KEY);
  }

  function authHeaders() {
    const h = {};
    if (!state.auth) return h;
    if (state.auth.token) h["X-Admin-Token"] = state.auth.token;
    if (state.auth.basic) h.Authorization = `Basic ${state.auth.basic}`;
    return h;
  }

  function emptyNews() {
    return {
      title: { vi: "", en: "", zh: "" },
      category: { vi: "Tin tức", en: "News", zh: "新闻" },
      date: todayInput(),
      image: "",
      excerpt: { vi: "", en: "", zh: "" },
      body: { vi: "", en: "", zh: "" },
    };
  }

  function emptyJob() {
    return {
      id: "",
      order: 10,
      title: { vi: "", en: "", zh: "" },
      department: { vi: "", en: "", zh: "" },
      location: { vi: "TP. Hồ Chí Minh", en: "Ho Chi Minh City", zh: "胡志明市" },
      type: { vi: "Toàn thời gian", en: "Full-time", zh: "全职" },
      summary: { vi: "", en: "", zh: "" },
    };
  }

  function todayInput() {
    return new Date().toISOString().slice(0, 10);
  }

  function toDateInput(value) {
    if (!value) return todayInput();
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toISOString().slice(0, 10);
  }

  function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function slugify(input) {
    return String(input || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-show"), 2600);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fillMissingLangs(obj, fallback = "") {
    const base = obj.vi || obj.en || obj.zh || fallback;
    for (const L of LANGS) {
      if (!obj[L]) obj[L] = base;
    }
    return obj;
  }

  function langFilled(obj) {
    return LANGS.reduce((acc, L) => {
      acc[L] = Boolean(obj?.[L] && String(obj[L]).trim());
      return acc;
    }, {});
  }

  function setLangDots(rootSel, filled) {
    $$(`${rootSel} .lang-dot`).forEach((dot) => {
      const L = dot.dataset.dot;
      dot.classList.toggle("is-filled", Boolean(filled[L]));
    });
  }

  async function api(path, opts = {}) {
    const headers = { ...(opts.headers || {}), ...authHeaders() };
    const res = await fetch(`${API}${path}`, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      saveAuth(null);
      showLogin(true);
      throw new Error("Cần đăng nhập");
    }
    if (!res.ok) throw new Error(data.error || res.statusText);
    return data;
  }

  function setLive(on, mode) {
    const el = $("#liveDot");
    const label = $("#liveLabel");
    if (!el) return;
    el.classList.toggle("is-on", on);
    el.classList.toggle("is-off", !on);
    if (label) {
      if (!on) label.textContent = "Offline";
      else if (mode === "github") label.textContent = "Cloud";
      else label.textContent = "Local";
    }
  }

  function showLogin(show) {
    const gate = $("#loginGate");
    const shell = $("#appShell");
    if (gate) gate.hidden = !show;
    if (shell) shell.hidden = show;
  }

  function showLoading() {
    $("#feed").innerHTML = `
      <div class="skeleton"></div>
      <div class="skeleton"></div>
      <div class="skeleton"></div>`;
  }

  function matchesQuery(text) {
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    return String(text || "").toLowerCase().includes(q);
  }

  async function load() {
    showLoading();
    try {
      const health = await api("/health");
      state.mode = health.mode || "local";
      $("#apiWarn").hidden = true;
      setLive(true, state.mode);
      const modeLabel = $("#modeLabel");
      if (modeLabel) {
        modeLabel.textContent =
          state.mode === "github"
            ? "Cloud CMS · commit → Vercel"
            : "Local CMS · EN / VI / 中文";
      }
      if (health.siteUrl && $("#siteLink")) {
        $("#siteLink").href = health.siteUrl;
      }
      if (health.auth && !state.auth) {
        showLogin(true);
        return;
      }
      showLogin(false);
      $("#logoutBtn").hidden = !health.auth;
    } catch {
      $("#apiWarn").hidden = false;
      setLive(false);
      $("#feed").innerHTML = `<div class="feed-empty">Không kết nối được API. Local: chạy <code>npm run cms</code>.</div>`;
      $("#listCount").textContent = "0";
      return;
    }

    try {
      if (state.tab === "news") {
        state.news = await api("/news");
        renderNewsFeed();
      } else {
        state.careers = await api("/careers");
        renderJobsFeed();
      }
    } catch (e) {
      $("#feed").innerHTML = `<div class="feed-empty">${escapeHtml(e.message || "Lỗi tải dữ liệu")}</div>`;
    }
  }

  function setTab(tab) {
    state.tab = tab;
    state.query = "";
    const search = $("#searchInput");
    if (search) search.value = "";
    $$(".rail__item").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));
    $("#triggerNews").hidden = tab !== "news";
    $("#triggerJobs").hidden = tab !== "careers";
    if (tab === "news") {
      $("#stageEyebrow").textContent = "Editorial";
      $("#stageTitle").textContent = "Tin tức";
      $("#stageLead").textContent =
        "Soạn thảo và xuất bản nội dung đa ngữ cho website tập đoàn.";
      $("#headCtaLabel").textContent = "Bài viết mới";
      $("#listTitle").textContent = "Đã xuất bản";
      if (search) search.placeholder = "Tìm theo tiêu đề…";
    } else {
      $("#stageEyebrow").textContent = "Careers";
      $("#stageTitle").textContent = "Tuyển dụng";
      $("#stageLead").textContent =
        "Quản lý vị trí mở — đồng bộ trực tiếp lên trang Careers.";
      $("#headCtaLabel").textContent = "Vị trí mới";
      $("#listTitle").textContent = "Vị trí đang mở";
      if (search) search.placeholder = "Tìm vị trí…";
    }
    load();
  }

  function renderNewsFeed() {
    const feed = $("#feed");
    const items = state.news.filter((item) => {
      const t = item.data.title || {};
      return matchesQuery(t.vi || t.en || t.zh || item.slug);
    });
    $("#listCount").textContent = String(items.length);

    if (!state.news.length) {
      feed.innerHTML = `
        <div class="feed-empty">
          <strong>Chưa có bài viết</strong>
          <p>Bắt đầu bằng “Bài viết mới” ở góc trên.</p>
          <button type="button" class="btn-primary" id="emptyNewsCta">Tạo bài đầu tiên</button>
        </div>`;
      $("#emptyNewsCta")?.addEventListener("click", () => openNewsModal());
      return;
    }
    if (!items.length) {
      feed.innerHTML = `<div class="feed-empty">Không tìm thấy bài khớp “${escapeHtml(state.query)}”.</div>`;
      return;
    }

    feed.innerHTML = items
      .map((item) => {
        const t = item.data.title || {};
        const ex = item.data.excerpt || {};
        const title = t.vi || t.en || t.zh || item.slug;
        const excerpt = ex.vi || ex.en || "";
        const img = item.data.image || "";
        const date = formatDate(item.data.date);
        const cat =
          (item.data.category && (item.data.category.vi || item.data.category.en)) ||
          "Tin tức";
        const media = img
          ? `<img class="feed-card__media" src="${img}" alt="">`
          : `<div class="feed-card__media feed-card__media--empty">NV</div>`;
        return `
        <article class="feed-card" data-slug="${item.slug}">
          ${media}
          <div class="feed-card__body">
            <div class="feed-card__top">
              <p class="feed-card__cat">${escapeHtml(cat)}</p>
              <span class="status-pill">Đã đăng</span>
            </div>
            <h3 class="feed-card__title">${escapeHtml(title)}</h3>
            ${excerpt ? `<p class="feed-card__excerpt">${escapeHtml(excerpt)}</p>` : ""}
            <p class="feed-card__date">${escapeHtml(date)}</p>
          </div>
          <div class="feed-card__actions">
            <a class="action-link" href="/news/${item.slug}/" target="_blank" rel="noopener">Xem</a>
            <button type="button" data-edit-news="${item.slug}">Sửa</button>
            <button type="button" class="is-danger" data-del-news="${item.slug}">Xóa</button>
          </div>
        </article>`;
      })
      .join("");
  }

  function renderJobsFeed() {
    const feed = $("#feed");
    const items = state.careers.filter((item) => {
      const d = item.data;
      const title = (d.title && (d.title.vi || d.title.en)) || item.slug;
      return matchesQuery(title);
    });
    $("#listCount").textContent = String(items.length);

    if (!state.careers.length) {
      feed.innerHTML = `
        <div class="feed-empty">
          <strong>Chưa có vị trí tuyển dụng</strong>
          <p>Tạo vị trí đầu tiên để hiện trên trang Careers.</p>
          <button type="button" class="btn-primary" id="emptyJobCta">Tạo vị trí</button>
        </div>`;
      $("#emptyJobCta")?.addEventListener("click", () => openJobModal());
      return;
    }
    if (!items.length) {
      feed.innerHTML = `<div class="feed-empty">Không tìm thấy vị trí khớp “${escapeHtml(state.query)}”.</div>`;
      return;
    }

    feed.innerHTML = items
      .map((item) => {
        const d = item.data;
        const title = (d.title && (d.title.vi || d.title.en)) || item.slug;
        const summary = (d.summary && (d.summary.vi || d.summary.en)) || "";
        const meta = [
          d.department && (d.department.vi || d.department.en),
          d.location && (d.location.vi || d.location.en),
          d.type && (d.type.vi || d.type.en),
        ]
          .filter(Boolean)
          .join(" · ");
        return `
        <article class="feed-card" data-slug="${item.slug}">
          <div class="feed-card__media feed-card__media--empty">Job</div>
          <div class="feed-card__body">
            <div class="feed-card__top">
              <p class="feed-card__cat">Tuyển dụng</p>
              <span class="status-pill">Đang mở</span>
            </div>
            <h3 class="feed-card__title">${escapeHtml(title)}</h3>
            ${summary ? `<p class="feed-card__excerpt">${escapeHtml(summary)}</p>` : ""}
            <p class="feed-card__date">${escapeHtml(meta)}</p>
          </div>
          <div class="feed-card__actions">
            <a class="action-link" href="/careers/" target="_blank" rel="noopener">Xem</a>
            <button type="button" data-edit-job="${item.slug}">Sửa</button>
            <button type="button" class="is-danger" data-del-job="${item.slug}">Xóa</button>
          </div>
        </article>`;
      })
      .join("");
  }

  /* ── Modal news ── */
  function openNewsModal(slug = null) {
    state.editing = slug;
    state.lang = "vi";
    if (slug) {
      const item = state.news.find((n) => n.slug === slug);
      if (!item) return;
      state.form = {
        title: { ...emptyNews().title, ...item.data.title },
        category: { ...emptyNews().category, ...item.data.category },
        date: toDateInput(item.data.date),
        image: item.data.image || "",
        excerpt: { ...emptyNews().excerpt, ...item.data.excerpt },
        body: { ...emptyNews().body, ...item.data.body },
      };
      $("#dialogNewsTitle").textContent = "Chỉnh sửa bài viết";
    } else {
      state.form = emptyNews();
      $("#dialogNewsTitle").textContent = "Bài viết mới";
    }
    syncNewsFormToUI();
    $("#modalNews").hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#titleInput")?.focus(), 40);
  }

  function closeNewsModal() {
    $("#modalNews").hidden = true;
    document.body.style.overflow = "";
    state.editing = null;
  }

  function syncNewsFormToUI() {
    const lang = state.lang;
    $$("#newsLangSwitch [data-lang]").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.lang === lang)
    );
    $("#titleInput").value = state.form.title[lang] || "";
    $("#excerptInput").value = state.form.excerpt[lang] || "";
    $("#bodyInput").value = state.form.body[lang] || "";
    $("#catInput").value = state.form.category[lang] || "";
    $("#dateInput").value = toDateInput(state.form.date);
    const box = $("#mediaBox");
    if (state.form.image) {
      box.classList.remove("is-empty");
      box.innerHTML = `<img src="${escapeHtml(state.form.image)}" alt=""><button type="button" class="media-box__remove" id="removeMedia" aria-label="Gỡ ảnh">✕</button>`;
      $("#removeMedia")?.addEventListener("click", () => {
        state.form.image = "";
        syncNewsFormToUI();
      });
    } else {
      box.classList.add("is-empty");
      box.innerHTML = "";
    }
    updateNewsLangDots();
    updatePostEnabled();
  }

  function updateNewsLangDots() {
    const filled = {};
    for (const L of LANGS) {
      filled[L] = Boolean(
        (state.form.title[L] || "").trim() ||
          (state.form.body[L] || "").trim() ||
          (state.form.excerpt[L] || "").trim()
      );
    }
    setLangDots("#newsLangSwitch", filled);
  }

  function readNewsUIToForm() {
    const lang = state.lang;
    state.form.title[lang] = $("#titleInput").value.trim();
    state.form.excerpt[lang] = $("#excerptInput").value.trim();
    state.form.body[lang] = $("#bodyInput").value.trim();
    state.form.category[lang] =
      $("#catInput").value.trim() || state.form.category[lang];
    state.form.date = $("#dateInput").value || state.form.date;
  }

  function updatePostEnabled() {
    const f = state.form;
    const ok =
      (f.title.vi || f.title.en || f.title.zh) &&
      (f.body.vi || f.body.en || f.body.zh || f.excerpt.vi || f.excerpt.en);
    $("#btnPostNews").disabled = !ok;
  }

  async function saveNews() {
    readNewsUIToForm();
    for (const key of ["title", "excerpt", "body", "category"]) {
      fillMissingLangs(state.form[key]);
    }
    state.form.date = toDateInput(state.form.date);
    const btn = $("#btnPostNews");
    btn.disabled = true;
    btn.textContent = "Đang xuất bản…";
    try {
      if (state.editing) {
        await api(`/news/${state.editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state.form),
        });
        toast("Đã cập nhật bài viết");
      } else {
        await api("/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state.form),
        });
        toast(
          state.mode === "github"
            ? "Đã commit — Vercel đang build (~1–2 phút)"
            : "Đã xuất bản bài viết"
        );
      }
      closeNewsModal();
      await load();
    } catch (e) {
      toast(e.message || "Lỗi lưu bài");
    } finally {
      btn.textContent = "Xuất bản";
      updatePostEnabled();
    }
  }

  /* ── Modal jobs ── */
  function openJobModal(slug = null) {
    state.editing = slug;
    state.lang = "vi";
    state.slugLocked = Boolean(slug);
    if (slug) {
      const item = state.careers.find((n) => n.slug === slug);
      if (!item) return;
      state.job = {
        ...emptyJob(),
        ...item.data,
        title: { ...emptyJob().title, ...item.data.title },
        department: { ...emptyJob().department, ...item.data.department },
        location: { ...emptyJob().location, ...item.data.location },
        type: { ...emptyJob().type, ...item.data.type },
        summary: { ...emptyJob().summary, ...item.data.summary },
        id: item.data.id || slug,
      };
      $("#dialogJobTitle").textContent = "Chỉnh sửa vị trí";
    } else {
      state.job = emptyJob();
      $("#dialogJobTitle").textContent = "Vị trí mới";
    }
    syncJobFormToUI();
    $("#jobId").disabled = state.slugLocked;
    $("#modalJob").hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#jobTitle")?.focus(), 40);
  }

  function closeJobModal() {
    $("#modalJob").hidden = true;
    document.body.style.overflow = "";
    state.editing = null;
    state.slugLocked = false;
    $("#jobId").disabled = false;
  }

  function syncJobFormToUI() {
    const lang = state.lang;
    $$("#jobLangSwitch [data-lang]").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.lang === lang)
    );
    $("#jobTitle").value = state.job.title[lang] || "";
    $("#jobDept").value = state.job.department[lang] || "";
    $("#jobLoc").value = state.job.location[lang] || "";
    $("#jobType").value = state.job.type[lang] || "";
    $("#jobSummary").value = state.job.summary[lang] || "";
    $("#jobId").value = state.job.id || "";
    $("#jobOrder").value = state.job.order || 10;
    updateJobLangDots();
  }

  function updateJobLangDots() {
    const filled = langFilled(state.job.title);
    for (const L of LANGS) {
      if ((state.job.summary[L] || "").trim()) filled[L] = true;
    }
    setLangDots("#jobLangSwitch", filled);
  }

  function readJobUIToForm() {
    const lang = state.lang;
    state.job.title[lang] = $("#jobTitle").value.trim();
    state.job.department[lang] = $("#jobDept").value.trim();
    state.job.location[lang] = $("#jobLoc").value.trim();
    state.job.type[lang] = $("#jobType").value.trim();
    state.job.summary[lang] = $("#jobSummary").value.trim();
    if (!state.slugLocked) {
      const typed = $("#jobId").value.trim();
      state.job.id = typed || slugify(state.job.title.vi || state.job.title.en);
      if (!typed && state.job.id) $("#jobId").value = state.job.id;
    } else {
      state.job.id = $("#jobId").value.trim() || state.job.id;
    }
    state.job.order = Number($("#jobOrder").value) || 10;
  }

  async function saveJob() {
    readJobUIToForm();
    for (const key of ["title", "department", "location", "type", "summary"]) {
      fillMissingLangs(state.job[key]);
    }
    if (!state.job.title.vi && !state.job.title.en) {
      toast("Nhập tên vị trí");
      return;
    }
    if (!state.job.id) {
      state.job.id = slugify(state.job.title.vi || state.job.title.en) || "vi-tri";
    }
    const btn = $("#btnPostJob");
    btn.disabled = true;
    btn.textContent = "Đang xuất bản…";
    try {
      if (state.editing) {
        await api(`/careers/${state.editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state.job),
        });
        toast("Đã cập nhật vị trí");
      } else {
        await api("/careers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state.job),
        });
        toast(
          state.mode === "github"
            ? "Đã commit — Vercel đang build (~1–2 phút)"
            : "Đã xuất bản tuyển dụng"
        );
      }
      closeJobModal();
      await load();
    } catch (e) {
      toast(e.message || "Lỗi lưu");
    } finally {
      btn.disabled = false;
      btn.textContent = "Xuất bản";
    }
  }

  async function uploadImage(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/upload`, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload thất bại");
    return data.url;
  }

  function bind() {
    $("#loginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $("#loginError");
      err.hidden = true;
      try {
        const data = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: $("#loginUser").value.trim(),
            password: $("#loginPass").value,
          }),
        }).then(async (r) => {
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.error || "Đăng nhập thất bại");
          return j;
        });
        saveAuth({
          token: data.token || null,
          basic: data.basic || null,
        });
        showLogin(false);
        await load();
      } catch (ex) {
        err.textContent = ex.message || "Đăng nhập thất bại";
        err.hidden = false;
      }
    });

    $("#logoutBtn")?.addEventListener("click", () => {
      saveAuth(null);
      showLogin(true);
    });

    $$(".rail__item").forEach((b) =>
      b.addEventListener("click", () => setTab(b.dataset.tab))
    );

    $("#headCta")?.addEventListener("click", () => {
      if (state.tab === "news") openNewsModal();
      else openJobModal();
    });
    $("#openNews")?.addEventListener("click", () => openNewsModal());
    $("#openNewsPhoto")?.addEventListener("click", () => {
      openNewsModal();
      setTimeout(() => $("#fileInput").click(), 200);
    });
    $("#openJob")?.addEventListener("click", () => openJobModal());

    $("#closeNews")?.addEventListener("click", closeNewsModal);
    $("#closeNews2")?.addEventListener("click", closeNewsModal);
    $("#closeJob")?.addEventListener("click", closeJobModal);
    $("#closeJob2")?.addEventListener("click", closeJobModal);
    $("#modalNews")?.addEventListener("click", (e) => {
      if (e.target.id === "modalNews") closeNewsModal();
    });
    $("#modalJob")?.addEventListener("click", (e) => {
      if (e.target.id === "modalJob") closeJobModal();
    });

    $$("#newsLangSwitch [data-lang]").forEach((b) =>
      b.addEventListener("click", () => {
        readNewsUIToForm();
        state.lang = b.dataset.lang;
        syncNewsFormToUI();
      })
    );
    $$("#jobLangSwitch [data-lang]").forEach((b) =>
      b.addEventListener("click", () => {
        readJobUIToForm();
        state.lang = b.dataset.lang;
        syncJobFormToUI();
      })
    );

    ["titleInput", "excerptInput", "bodyInput", "catInput", "dateInput"].forEach((id) => {
      $(`#${id}`)?.addEventListener("input", () => {
        readNewsUIToForm();
        updateNewsLangDots();
        updatePostEnabled();
      });
    });

    $("#jobTitle")?.addEventListener("input", () => {
      readJobUIToForm();
      if (!state.slugLocked && document.activeElement !== $("#jobId")) {
        const auto = slugify(state.job.title.vi || state.job.title.en);
        if (auto) {
          state.job.id = auto;
          $("#jobId").value = auto;
        }
      }
      updateJobLangDots();
    });
    ["jobDept", "jobLoc", "jobType", "jobSummary", "jobId", "jobOrder"].forEach((id) => {
      $(`#${id}`)?.addEventListener("input", () => {
        readJobUIToForm();
        updateJobLangDots();
      });
    });

    $("#btnPostNews")?.addEventListener("click", saveNews);
    $("#btnPostJob")?.addEventListener("click", saveJob);

    $("#pickPhoto")?.addEventListener("click", () => $("#fileInput").click());
    $("#fileInput")?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        toast("Đang tải ảnh…");
        state.form.image = await uploadImage(file);
        syncNewsFormToUI();
        toast("Đã thêm ảnh");
      } catch (err) {
        toast(err.message);
      }
      e.target.value = "";
    });

    $("#searchInput")?.addEventListener("input", (e) => {
      state.query = e.target.value || "";
      if (state.tab === "news") renderNewsFeed();
      else renderJobsFeed();
    });

    $("#feed")?.addEventListener("click", async (e) => {
      const editN = e.target.closest("[data-edit-news]");
      const delN = e.target.closest("[data-del-news]");
      const editJ = e.target.closest("[data-edit-job]");
      const delJ = e.target.closest("[data-del-job]");
      if (editN) openNewsModal(editN.dataset.editNews);
      if (editJ) openJobModal(editJ.dataset.editJob);
      if (delN) {
        if (!confirm("Xóa bài viết này? Thao tác không hoàn tác.")) return;
        try {
          await api(`/news/${delN.dataset.delNews}`, { method: "DELETE" });
          toast("Đã xóa bài viết");
          await load();
        } catch (err) {
          toast(err.message);
        }
      }
      if (delJ) {
        if (!confirm("Xóa vị trí này? Thao tác không hoàn tác.")) return;
        try {
          await api(`/careers/${delJ.dataset.delJob}`, { method: "DELETE" });
          toast("Đã xóa vị trí");
          await load();
        } catch (err) {
          toast(err.message);
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if ($("#modalNews") && !$("#modalNews").hidden) closeNewsModal();
        if ($("#modalJob") && !$("#modalJob").hidden) closeJobModal();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if ($("#modalNews") && !$("#modalNews").hidden && !$("#btnPostNews").disabled) {
          e.preventDefault();
          saveNews();
        }
        if ($("#modalJob") && !$("#modalJob").hidden) {
          e.preventDefault();
          saveJob();
        }
      }
    });
  }

  loadAuth();
  bind();
  setTab("news");
})();
