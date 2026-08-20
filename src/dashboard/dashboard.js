(() => {
  "use strict";

  const metaApi = document.querySelector('meta[name="admin-api"]')?.content?.trim();
  const API =
    metaApi ||
    (location.port === "8125" || location.port === "8080"
      ? "http://127.0.0.1:8081/api"
      : `${location.origin}/api`);
  const AUTH_KEY = "nv_studio_auth";
  const LANGS = ["en", "vi", "zh"];
  const SECTION_IDS = [
    "hero", "about", "ecosystem", "manufacturing", "products", "logistics",
    "network", "sustainability", "leadership", "milestones", "news", "contact",
  ];
  const CONTENT_KEYS = {
    hero: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary", "ctaSecondary", "scroll"],
    about: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "body"],
    ecosystem: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
    manufacturing: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
    products: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
    logistics: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
    network: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
    sustainability: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
    leadership: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "body", "ctaPrimary"],
    milestones: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "bannerStatement"],
    news: ["chapterLabel", "eyebrow", "titleLine1", "titleLine2", "lead", "ctaPrimary"],
    contact: ["chapterLabel", "titleLine1", "titleLine2", "lead", "ctaPrimary", "ctaSecondary"],
  };
  const IMAGE_SLOTS = {
    hero: ["art"], about: ["media"], ecosystem: ["background"], manufacturing: ["media"],
    products: ["nv007", "nv-10s", "nv888", "nv40", "nv530"], logistics: ["background"],
    network: [], sustainability: ["media"], leadership: ["media"], milestones: ["banner"],
    news: [], contact: ["background"],
  };
  const STAT_COUNTS = { hero: 2, about: 4, manufacturing: 4, logistics: 3, milestones: 4 };
  const PRODUCT_IDS = ["nv007", "nv-10s", "nv888", "nv40", "nv530"];
  const PARTNER_IDS = ["van-aarsen", "bunge", "wilmar", "ajinomoto", "anderson", "andritz", "cargill", "cj", "olmix"];
  const FLOW_COUNT = 8;
  const CHECK_COUNT = 4;
  const TIMELINE_ICONS = ["building", "farm", "lab", "warehouse", "globe"];

  const SECTION_NAMES = {
    hero: "Mở đầu", about: "Về chúng tôi", ecosystem: "Hệ sinh thái",
    manufacturing: "Sản xuất", products: "Sản phẩm", logistics: "Logistics",
    network: "Đối tác", sustainability: "Bền vững", leadership: "Lãnh đạo",
    milestones: "Cột mốc", news: "Tin tức", contact: "Liên hệ",
  };
  const FIELD_NAMES = {
    chapterLabel: "Nhãn chương", eyebrow: "Dòng dẫn", titleLine1: "Tiêu đề — dòng 1",
    titleLine2: "Tiêu đề — dòng 2", lead: "Đoạn giới thiệu", body: "Nội dung",
    ctaPrimary: "Nút chính", ctaSecondary: "Nút phụ", scroll: "Nhãn cuộn",
    bannerStatement: "Thông điệp banner",
  };
  const LONG_FIELDS = new Set(["lead", "body", "bannerStatement"]);
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value) => window.HomePreview.escapeHtml(value);

  const state = {
    auth: null,
    draft: null,
    published: null,
    draftRevision: "",
    publishedRevision: "",
    status: "loading",
    selectedId: "hero",
    lang: "vi",
    dirty: false,
    siteUrl: "http://localhost:8125/",
  };

  class ApiError extends Error {
    constructor(status, data) {
      super(data.message || data.error || `HTTP ${status}`);
      this.status = status;
      this.data = data;
    }
  }

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
    if (!state.auth) return {};
    if (state.auth.token) return { "X-Admin-Token": state.auth.token };
    if (state.auth.basic) return { Authorization: `Basic ${state.auth.basic}` };
    return {};
  }

  async function api(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { ...(options.headers || {}), ...authHeaders() },
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      saveAuth(null);
      showLogin(true);
    }
    if (!response.ok) throw new ApiError(response.status, data);
    return data;
  }

  function showLogin(show) {
    $("#loginGate").hidden = !show;
    $("#appShell").hidden = show;
  }

  function toast(message, duration = 3000) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("is-show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("is-show"), duration);
  }

  function currentSection() {
    return state.draft?.sections?.find((section) => section.id === state.selectedId);
  }

  function setDirty(dirty = true) {
    state.dirty = dirty;
    $("#dirtyFlag").hidden = !dirty;
    $("#saveBtn").disabled = !dirty;
    $("#publishBtn").disabled = dirty || state.status === "in-sync";
    $("#statusDot").className = `status-dot ${dirty ? "is-dirty" : "is-clean"}`;
    $("#statusLabel").textContent = dirty
      ? "Thay đổi chưa lưu"
      : state.status === "in-sync" ? "Đã đồng bộ" : "Có bản nháp";
  }

  function applyState(data) {
    state.draft = data.draft;
    state.published = data.published;
    state.draftRevision = data.draftRevision;
    state.publishedRevision = data.publishedRevision;
    state.status = data.status || "draft";
    if (!state.draft.sections.some((section) => section.id === state.selectedId)) {
      state.selectedId = state.draft.sections[0]?.id || "hero";
    }
    renderAll();
    setDirty(false);
  }

  async function loadHome() {
    const data = await api("/home");
    applyState(data);
  }

  async function boot() {
    loadAuth();
    try {
      const health = await api("/health");
      state.siteUrl = health.siteUrl && health.siteUrl !== "/" ? health.siteUrl : "http://localhost:8125/";
      $("#siteLink").href = state.siteUrl;
      if (location.port !== "8125") {
        $("#homepageStyles").href = `${String(state.siteUrl).replace(/\/$/, "")}/css/style.css`;
      }
      $("#logoutBtn").hidden = !health.auth;
      $("#apiWarning").hidden = true;
      if (health.auth && !state.auth) {
        showLogin(true);
        return;
      }
      showLogin(false);
      await loadHome();
    } catch (error) {
      if (error.status === 401) return;
      showLogin(false);
      $("#apiWarning").textContent = `Không kết nối được Home API: ${error.message}`;
      $("#apiWarning").hidden = false;
    }
  }

  function renderAll() {
    renderBlockList();
    renderForm();
    renderPreview();
    $("#revisionLabel").textContent = state.draftRevision ? state.draftRevision.slice(0, 8) : "—";
  }

  function renderBlockList() {
    $("#blockList").innerHTML = state.draft.sections.map((section, index) => {
      const title = section.content?.[state.lang]?.titleLine1 || SECTION_NAMES[section.id];
      return `<li class="block-row${section.id === state.selectedId ? " is-selected" : ""}" draggable="true" data-index="${index}" data-id="${esc(section.id)}">
        <span class="drag-handle" aria-hidden="true">⠿</span>
        <button class="block-select" type="button" data-select="${esc(section.id)}">
          <small>${String(index + 1).padStart(2, "0")} · ${esc(section.id)}</small>
          <strong>${esc(title)}</strong>
        </button>
        <label class="visibility" title="Hiển thị khối">
          <input type="checkbox" data-visible="${esc(section.id)}" aria-label="Hiển thị ${esc(SECTION_NAMES[section.id])}" ${section.visible ? "checked" : ""}>
        </label>
      </li>`;
    }).join("");
  }

  function contentFields(section) {
    return (CONTENT_KEYS[section.id] || []).map((key) => {
      const value = section.content?.[state.lang]?.[key] || "";
      const path = `${section.id}.content.${state.lang}.${key}`;
      const control = LONG_FIELDS.has(key)
        ? `<textarea data-kind="content" data-key="${key}" data-path="${path}">${esc(value)}</textarea>`
        : `<input type="text" value="${esc(value)}" data-kind="content" data-key="${key}" data-path="${path}">`;
      return `<label class="field${LONG_FIELDS.has(key) ? " field--wide" : ""}"><span>${esc(FIELD_NAMES[key] || key)}</span>${control}<small class="field-error" data-error-for="${path}"></small></label>`;
    }).join("");
  }

  function imageCard(sectionId, slot, url, target = "section", index = -1) {
    const label = slot.replace(/^partner:|^timeline:/, "");
    const path = target === "timeline"
      ? `${sectionId}.timeline.${label}.image`
      : `${sectionId}.images.${slot}`;
    return `<div class="image-field">
      <div class="image-field__preview">${url ? `<img src="${esc(url)}" alt="">` : "Chưa có ảnh"}</div>
      <div class="image-field__meta"><strong title="${esc(url || "")}">${esc(label)}</strong>
        <label class="file-button">Thay ảnh<input type="file" accept="image/jpeg,image/png,image/webp" data-upload data-section="${sectionId}" data-slot="${esc(slot)}" data-target="${target}" data-index="${index}" data-path="${path}"></label>
      </div><small class="field-error" data-error-for="${path}"></small>
    </div>`;
  }

  function imagesSection(section) {
    const cards = (IMAGE_SLOTS[section.id] || []).map((slot) =>
      imageCard(section.id, slot, section.images?.[slot])
    );
    if (section.id === "network") {
      (section.items || []).forEach((partner, index) => {
        cards.push(imageCard(section.id, `partner:${partner.id}`, partner.image, "partner", index));
      });
    }
    if (!cards.length) return "";
    return `<section class="form-section"><div class="form-section__head"><h3>Hình ảnh</h3><p>JPEG, PNG hoặc WebP · tối đa 8 MB</p></div><div class="image-grid">${cards.join("")}</div></section>`;
  }

  function statsSection(section) {
    if (!(STAT_COUNTS[section.id] || 0)) return "";
    return `<section class="form-section"><div class="form-section__head"><h3>Số liệu</h3><p>Cố định ${STAT_COUNTS[section.id]} mục</p></div>
      <div class="data-stack">${(section.stats || []).map((stat, index) => `<div class="data-card">
        <div class="data-card__title"><strong>${esc(stat.id)}</strong></div>
        <div class="triple-fields">
          <label class="field"><span>Giá trị</span><input type="text" value="${esc(stat.value)}" data-kind="stat-value" data-index="${index}"></label>
          ${LANGS.map((lang) => { const path = `${section.id}.stats.${stat.id}.${lang}`; return `<label class="field"><span>Nhãn ${lang.toUpperCase()}</span><input type="text" value="${esc(stat.label?.[lang] || "")}" data-kind="stat-label" data-index="${index}" data-lang="${lang}" data-path="${path}"><small class="field-error" data-error-for="${path}"></small></label>`; }).join("")}
        </div></div>`).join("")}</div></section>`;
  }

  function itemsSection(section) {
    if (!["ecosystem", "manufacturing", "products"].includes(section.id)) return "";
    const fixedCount = section.id === "ecosystem" ? FLOW_COUNT : section.id === "manufacturing" ? CHECK_COUNT : PRODUCT_IDS.length;
    return `<section class="form-section"><div class="form-section__head"><h3>${section.id === "products" ? "Sản phẩm" : "Danh sách"}</h3><p>Cố định ${fixedCount} mục</p></div>
      <div class="data-stack">${(section.items || []).map((item, index) => `<div class="data-card">
        <div class="data-card__title"><strong>${esc(item.id)}</strong></div><div class="triple-fields">
          ${section.id === "products" ? `<label class="field"><span>Mã</span><input type="text" value="${esc(item.code)}" data-kind="item-code" data-index="${index}"></label>` : "<span></span>"}
          ${LANGS.map((lang) => `<label class="field"><span>${section.id === "products" ? "Tên" : "Nhãn"} ${lang.toUpperCase()}</span><input type="text" value="${esc((section.id === "products" ? item.name : item.label)?.[lang] || "")}" data-kind="item-label" data-index="${index}" data-lang="${lang}"></label>`).join("")}
        </div></div>`).join("")}</div></section>`;
  }

  function timelineSection(section) {
    if (section.id !== "milestones") return "";
    return `<section class="form-section"><div class="form-section__head"><h3>Dòng thời gian</h3><button class="button button--primary" id="addMilestone" type="button">+ Thêm cột mốc</button></div>
      <div class="timeline-list">${(section.timeline || []).map((item, index) => `<article class="timeline-card">
        <div class="timeline-card__top"><strong>${esc(item.year || "Cột mốc mới")}</strong><div class="timeline-actions">
          <button class="icon-button" type="button" data-move-timeline="${index}" data-direction="-1" aria-label="Di chuyển lên" ${index === 0 ? "disabled" : ""}>↑</button>
          <button class="icon-button" type="button" data-move-timeline="${index}" data-direction="1" aria-label="Di chuyển xuống" ${index === section.timeline.length - 1 ? "disabled" : ""}>↓</button>
          <button class="icon-button is-danger" type="button" data-delete-timeline="${index}" aria-label="Xóa cột mốc">×</button>
        </div></div>
        <div class="timeline-fields">
          <label class="field"><span>Năm</span><input type="text" value="${esc(item.year)}" data-kind="timeline" data-index="${index}" data-field="year" data-path="milestones.timeline.${item.id}"><small class="field-error" data-error-for="milestones.timeline.${item.id}"></small></label>
          <label class="field"><span>Biểu tượng</span><select data-kind="timeline" data-index="${index}" data-field="icon" data-path="milestones.timeline.${item.id}.icon">${TIMELINE_ICONS.map((icon) => `<option value="${icon}" ${item.icon === icon ? "selected" : ""}>${icon}</option>`).join("")}</select><small class="field-error" data-error-for="milestones.timeline.${item.id}.icon"></small></label>
          <div>${imageCard(section.id, `timeline:${item.id}`, item.image, "timeline", index)}</div>
          ${LANGS.map((lang) => { const path = `${section.id}.timeline.${item.id}.${lang}`; return `<label class="field"><span>Tiêu đề ${lang.toUpperCase()}</span><input type="text" value="${esc(item.title?.[lang] || "")}" data-kind="timeline-i18n" data-index="${index}" data-field="title" data-lang="${lang}" data-path="${path}"><small class="field-error" data-error-for="${path}"></small></label>`; }).join("")}
          ${LANGS.map((lang) => { const path = `${section.id}.timeline.${item.id}.${lang}`; return `<label class="field field--description"><span>Mô tả ${lang.toUpperCase()}</span><textarea data-kind="timeline-i18n" data-index="${index}" data-field="description" data-lang="${lang}" data-path="${path}">${esc(item.description?.[lang] || "")}</textarea></label>`; }).join("")}
        </div></article>`).join("")}</div>
      <p class="section-note">ID cột mốc được tạo tự động. Kéo ảnh vào đúng cột mốc rồi Lưu nháp để lưu nội dung.</p>
    </section>`;
  }

  function renderForm() {
    const section = currentSection();
    if (!section) {
      $("#blockForm").innerHTML = "<p>Không có dữ liệu.</p>";
      return;
    }
    $("#sectionKicker").textContent = `${String(state.draft.sections.indexOf(section) + 1).padStart(2, "0")} · ${section.id}`;
    $("#sectionTitle").textContent = SECTION_NAMES[section.id];
    $("#blockForm").innerHTML = `
      <section class="form-section"><div class="form-section__head"><h3>Nội dung ${state.lang.toUpperCase()}</h3><p>Các đường dẫn được hệ thống bảo vệ</p></div><div class="field-grid">${contentFields(section)}</div></section>
      ${imagesSection(section)}${statsSection(section)}${itemsSection(section)}${timelineSection(section)}`;
  }

  function renderPreview() {
    const section = currentSection();
    const number = String((state.draft?.sections?.indexOf(section) ?? 0) + 1).padStart(2, "0");
    $("#previewTitle").textContent = section ? SECTION_NAMES[section.id] : "Khối đang chọn";
    $("#previewMount").innerHTML = window.HomePreview.renderPreview(section, state.lang, number);
  }

  function markChanged({ list = false, form = false } = {}) {
    setDirty(true);
    if (list) renderBlockList();
    if (form) renderForm();
    renderPreview();
  }

  function updateModel(input) {
    const section = currentSection();
    const index = Number(input.dataset.index);
    switch (input.dataset.kind) {
      case "content":
        section.content[state.lang][input.dataset.key] = input.value;
        break;
      case "stat-value":
        section.stats[index].value = input.value;
        break;
      case "stat-label":
        section.stats[index].label[input.dataset.lang] = input.value;
        break;
      case "item-code":
        section.items[index].code = input.value;
        break;
      case "item-label": {
        const key = section.id === "products" ? "name" : "label";
        section.items[index][key][input.dataset.lang] = input.value;
        break;
      }
      case "timeline":
        section.timeline[index][input.dataset.field] = input.value;
        break;
      case "timeline-i18n":
        section.timeline[index][input.dataset.field][input.dataset.lang] = input.value;
        break;
      default:
        return;
    }
    setDirty(true);
    renderPreview();
  }

  async function uploadImage(input) {
    const file = input.files?.[0];
    if (!file) return;
    const section = currentSection();
    const form = new FormData();
    form.append("sectionId", input.dataset.section);
    form.append("slot", input.dataset.slot);
    form.append("file", file);
    input.disabled = true;
    toast("Đang tải ảnh…");
    try {
      const response = await fetch(`${API}/home/images`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        saveAuth(null);
        showLogin(true);
        throw new Error("Cần đăng nhập");
      }
      if (!response.ok) throw new Error(data.error || "Tải ảnh thất bại");
      const index = Number(input.dataset.index);
      if (input.dataset.target === "partner") section.items[index].image = data.url;
      else if (input.dataset.target === "timeline") section.timeline[index].image = data.url;
      else section.images[input.dataset.slot] = data.url;
      markChanged({ form: true });
      toast("Đã tải ảnh. Nhấn Lưu nháp để lưu thay đổi.");
    } catch (error) {
      toast(error.message);
      input.disabled = false;
      input.value = "";
    }
  }

  function clearErrors() {
    $$(".field-error").forEach((el) => { el.textContent = ""; });
    $$("[aria-invalid=true]").forEach((el) => el.removeAttribute("aria-invalid"));
  }

  function showFieldErrors(fields = []) {
    fields.forEach(({ path, message }) => {
      const error = $(`[data-error-for="${CSS.escape(path)}"]`);
      if (error) error.textContent = message;
      $$(`[data-path="${CSS.escape(path)}"]`).forEach((input) => input.setAttribute("aria-invalid", "true"));
    });
  }

  function focusFirstInvalidField(fields = []) {
    const first = fields.find((field) => SECTION_IDS.includes(String(field.path).split(".")[0]));
    if (!first) return;
    const parts = String(first.path).split(".");
    state.selectedId = parts[0];
    const errorLang = LANGS.find((lang) =>
      first.path.includes(`.content.${lang}.`) || first.path.endsWith(`.${lang}`)
    );
    if (errorLang) state.lang = errorLang;
    $$("#langTabs [data-lang]").forEach((tab) =>
      tab.setAttribute("aria-selected", String(tab.dataset.lang === state.lang))
    );
    renderAll();
  }

  async function reloadAfterConflict(error) {
    const data = error?.data || {};
    toast(
      [
        data.message || error.message || "Bản Home đã được cập nhật bởi người khác.",
        `Revision hiện tại: ${data.currentRevision || "—"}`,
        `Revision của bạn: ${data.yourRevision || "—"}`,
        "Vui lòng tải lại dữ liệu trước khi tiếp tục.",
      ].join(" "),
      8000
    );
    await loadHome();
  }

  async function saveDraft() {
    clearErrors();
    const button = $("#saveBtn");
    button.disabled = true;
    try {
      const data = await api("/home/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document: state.draft, revision: state.draftRevision }),
      });
      state.draft = data.draft;
      state.draftRevision = data.draftRevision;
      state.status = "draft";
      renderAll();
      setDirty(false);
      toast("Đã lưu bản nháp");
    } catch (error) {
      if (error.status === 409) await reloadAfterConflict(error);
      else if (error.status === 400) {
        focusFirstInvalidField(error.data.fields);
        showFieldErrors(error.data.fields);
        toast("Một số trường chưa hợp lệ. Kiểm tra các trường được đánh dấu.");
      } else toast(error.message);
    } finally {
      button.disabled = !state.dirty;
    }
  }

  async function publish() {
    if (state.dirty) {
      toast("Lưu bản nháp trước khi xuất bản.");
      return;
    }
    const button = $("#publishBtn");
    button.disabled = true;
    try {
      const data = await api("/home/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision: state.draftRevision, publishedRevision: state.publishedRevision }),
      });
      state.draftRevision = data.draftRevision;
      state.publishedRevision = data.publishedRevision;
      state.status = "in-sync";
      state.published = JSON.parse(JSON.stringify(state.draft));
      $("#revisionLabel").textContent = state.draftRevision.slice(0, 8);
      setDirty(false);
      toast("Đã xuất bản trang chủ");
    } catch (error) {
      if (error.status === 409) await reloadAfterConflict(error);
      else toast(error.message);
    } finally {
      $("#publishBtn").disabled = state.dirty || state.status === "in-sync";
    }
  }

  async function discard() {
    if (!confirm("Hủy toàn bộ thay đổi trong bản nháp và quay về bản đã xuất bản?")) return;
    try {
      const data = await api("/home/discard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revision: state.draftRevision, publishedRevision: state.publishedRevision }),
      });
      applyState(data);
      toast("Đã hủy bản nháp");
    } catch (error) {
      if (error.status === 409) await reloadAfterConflict(error);
      else toast(error.message);
    }
  }

  function addMilestone() {
    const section = currentSection();
    const id = `m-${Date.now().toString(36)}`;
    section.timeline.push({
      id,
      year: String(new Date().getFullYear()),
      icon: "building",
      image: "/assets/img/milestones/2002.jpg",
      title: { en: "New milestone", vi: "Cột mốc mới", zh: "新里程碑" },
      description: { en: "Add a description", vi: "Thêm mô tả", zh: "添加描述" },
    });
    markChanged({ form: true });
  }

  function bind() {
    $("#loginForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      $("#loginError").hidden = true;
      try {
        const response = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: $("#loginUser").value.trim(), password: $("#loginPass").value }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Đăng nhập thất bại");
        saveAuth({ token: data.token || null, basic: data.basic || null });
        showLogin(false);
        await loadHome();
      } catch (error) {
        $("#loginError").textContent = error.message;
        $("#loginError").hidden = false;
      }
    });

    $("#logoutBtn").addEventListener("click", () => { saveAuth(null); showLogin(true); });
    $("#saveBtn").addEventListener("click", saveDraft);
    $("#publishBtn").addEventListener("click", publish);
    $("#discardBtn").addEventListener("click", discard);

    $("#langTabs").addEventListener("click", (event) => {
      const button = event.target.closest("[data-lang]");
      if (!button) return;
      state.lang = button.dataset.lang;
      $$("#langTabs [data-lang]").forEach((tab) => tab.setAttribute("aria-selected", String(tab === button)));
      renderAll();
      setDirty(state.dirty);
    });

    $("#blockList").addEventListener("click", (event) => {
      const select = event.target.closest("[data-select]");
      if (select) {
        state.selectedId = select.dataset.select;
        renderAll();
        setDirty(state.dirty);
      }
    });
    $("#blockList").addEventListener("change", (event) => {
      const toggle = event.target.closest("[data-visible]");
      if (!toggle) return;
      state.draft.sections.find((section) => section.id === toggle.dataset.visible).visible = toggle.checked;
      markChanged({ list: true });
    });
    $("#blockList").addEventListener("dragstart", (event) => {
      const row = event.target.closest(".block-row");
      if (!row) return;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", row.dataset.index);
      row.classList.add("is-dragging");
    });
    $("#blockList").addEventListener("dragend", (event) => event.target.closest(".block-row")?.classList.remove("is-dragging"));
    $("#blockList").addEventListener("dragover", (event) => {
      if (event.target.closest(".block-row")) event.preventDefault();
    });
    $("#blockList").addEventListener("drop", (event) => {
      const target = event.target.closest(".block-row");
      if (!target) return;
      event.preventDefault();
      const from = Number(event.dataTransfer.getData("text/plain"));
      const to = Number(target.dataset.index);
      if (!Number.isInteger(from) || from === to) return;
      const [moved] = state.draft.sections.splice(from, 1);
      state.draft.sections.splice(to, 0, moved);
      state.draft.sections.forEach((section, index) => { section.order = index + 1; });
      markChanged({ list: true, form: true });
    });

    $("#blockForm").addEventListener("input", (event) => updateModel(event.target));
    $("#blockForm").addEventListener("change", (event) => {
      if (event.target.matches("[data-upload]")) uploadImage(event.target);
      else updateModel(event.target);
    });
    $("#blockForm").addEventListener("click", (event) => {
      if (event.target.id === "addMilestone") addMilestone();
      const del = event.target.closest("[data-delete-timeline]");
      if (del && confirm("Xóa cột mốc này?")) {
        currentSection().timeline.splice(Number(del.dataset.deleteTimeline), 1);
        markChanged({ form: true });
      }
      const move = event.target.closest("[data-move-timeline]");
      if (move) {
        const from = Number(move.dataset.moveTimeline);
        const to = from + Number(move.dataset.direction);
        const timeline = currentSection().timeline;
        if (to >= 0 && to < timeline.length) {
          [timeline[from], timeline[to]] = [timeline[to], timeline[from]];
          markChanged({ form: true });
        }
      }
    });

    window.addEventListener("beforeunload", (event) => {
      if (!state.dirty) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  bind();
  boot();
})();
