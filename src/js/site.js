/* Corporate site helpers: search, forms, cookies, URL prefills */
(() => {
  "use strict";

  const html = document.documentElement;
  const documentLocale = () => {
    const dataLang = html.getAttribute("data-lang");
    if (dataLang === "vi" || dataLang === "en" || dataLang === "zh") return dataLang;
    const htmlLang = html.getAttribute("lang") || "";
    if (htmlLang === "vi" || htmlLang.startsWith("vi-")) return "vi";
    if (htmlLang === "zh-Hans" || htmlLang.startsWith("zh")) return "zh";
    if (htmlLang === "en" || htmlLang.startsWith("en-")) return "en";
    return "vi";
  };

  const LOCALE_PREFIX = { vi: "", en: "/en", zh: "/zh" };
  const TREE_ROOTS = [
    "/about",
    "/companies",
    "/products",
    "/news",
    "/careers",
    "/contact",
    "/investors",
    "/sustainability",
    "/downloads",
    "/privacy",
    "/cookies",
    "/terms",
  ];
  const OUT_ROOTS = ["/admin", "/dashboard", "/mobile-concept", "/assets", "/css", "/js"];
  const STATIC_EXT = /\.(xml|txt|pdf|docx|png|jpe?g|gif|webp|svg|css|js|ico|woff2?|map|json)$/i;

  const stripPath = (pathname) => String(pathname || "").split("?")[0].split("#")[0];

  const hasLocalePrefix = (pathname) => {
    const path = stripPath(pathname);
    return path === "/en" || path.startsWith("/en/") || path === "/zh" || path.startsWith("/zh/");
  };

  const isUnder = (path, root) => path === root || path === root + "/" || path.startsWith(root + "/");

  const isLocaleTreePath = (pathname) => {
    const path = stripPath(pathname);
    if (path === "/" || path === "") return true;
    if (STATIC_EXT.test(path)) return false;
    if (OUT_ROOTS.some((root) => isUnder(path, root))) return false;
    return TREE_ROOTS.some((root) => isUnder(path, root));
  };

  const pageIdentity = (pathname) => {
    let path = stripPath(pathname);
    if (path === "/en" || path.startsWith("/en/")) path = path.slice(3) || "/";
    else if (path === "/zh" || path.startsWith("/zh/")) path = path.slice(3) || "/";
    if (path === "") path = "/";
    if (path !== "/" && !path.endsWith("/")) path += "/";
    return path;
  };

  const isExternalOrFragment = (href) => {
    if (href.startsWith("#")) return true;
    if (href.startsWith("//")) return true;
    return /^[a-z][a-z0-9+.-]*:/i.test(href);
  };

  function localeUrl(href, locale) {
    if (locale !== "vi" && locale !== "en" && locale !== "zh") {
      throw new Error(`invalid locale: ${locale}`);
    }
    if (isExternalOrFragment(href)) return href;
    if (!href.startsWith("/")) return href;

    const url = new URL(href, "https://namvietjscom.vn");
    const { pathname, search, hash } = url;

    if (hasLocalePrefix(pathname) && isLocaleTreePath(pageIdentity(pathname))) {
      throw new Error(`already-prefixed content path: ${pathname}`);
    }

    if (!isLocaleTreePath(pathname)) return href;

    return LOCALE_PREFIX[locale] + pathname + search + hash;
  }

  /* Cookie consent */
  const cookieBar = document.getElementById("cookieBar");
  const cookieAccept = document.getElementById("cookieAccept");
  const cookieDecline = document.getElementById("cookieDecline");
  if (cookieBar && cookieAccept) {
    const key = "nv-cookie-consent";
    const stored = localStorage.getItem(key);
    if (!stored) cookieBar.hidden = false;
    const closeCookieBar = (value) => {
      localStorage.setItem(key, value);
      cookieBar.hidden = true;
    };
    cookieAccept.addEventListener("click", () => closeCookieBar("accepted"));
    cookieDecline?.addEventListener("click", () => closeCookieBar("declined"));
  }

  /* Site search */
  const searchToggle = document.getElementById("searchToggle");
  const siteSearch = document.getElementById("siteSearch");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const searchEmpty = document.getElementById("searchEmpty");
  let index = [];
  try {
    const raw = document.getElementById("searchIndex");
    if (raw) index = JSON.parse(raw.textContent || "[]");
  } catch (_) {
    index = [];
  }

  const closeSearch = () => {
    if (!siteSearch) return;
    siteSearch.hidden = true;
    searchToggle?.setAttribute("aria-expanded", "false");
  };
  const openSearch = () => {
    if (!siteSearch) return;
    siteSearch.hidden = false;
    searchToggle?.setAttribute("aria-expanded", "true");
    const lang = documentLocale();
    if (searchInput) {
      searchInput.placeholder = searchInput.dataset[`ph${lang[0].toUpperCase()}${lang.slice(1)}`] || searchInput.dataset.phEn || "";
      // data-ph-en style
      const map = { en: "phEn", vi: "phVi", zh: "phZh" };
      searchInput.placeholder = searchInput.dataset[map[lang]] || searchInput.placeholder;
      searchInput.focus();
    }
  };
  searchToggle?.addEventListener("click", () => {
    if (siteSearch?.hidden) openSearch();
    else closeSearch();
  });
  siteSearch?.addEventListener("click", (e) => {
    if (e.target === siteSearch) closeSearch();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSearch();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openSearch();
    }
  });

  const renderSearch = (q) => {
    if (!searchResults) return;
    const lang = documentLocale();
    const query = (q || "").trim().toLowerCase();
    searchResults.innerHTML = "";
    if (!query) {
      if (searchEmpty) searchEmpty.hidden = true;
      return;
    }
    const hits = index.filter((item) => {
      const title = (item.title?.[lang] || "").toLowerCase();
      const body = (item.body?.[lang] || "").toLowerCase();
      return title.includes(query) || body.includes(query);
    }).slice(0, 8);
    hits.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      const href = localeUrl(item.url, lang);
      a.href = href;
      a.textContent = item.title?.[lang] || href;
      li.appendChild(a);
      searchResults.appendChild(li);
    });
    if (searchEmpty) searchEmpty.hidden = hits.length > 0;
  };
  searchInput?.addEventListener("input", () => renderSearch(searchInput.value));

  /* Contact form prefills + AJAX submit */
  const form = document.getElementById("contactForm");
  if (form) {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const product = params.get("product");
    const role = params.get("role");
    const typeEl = document.getElementById("inquiryType");
    const productEl = document.getElementById("productCode");

    const syncInquiryLabels = () => {
      if (!typeEl) return;
      const lang = documentLocale();
      const key = lang === "vi" ? "labelVi" : lang === "zh" ? "labelZh" : "labelEn";
      [...typeEl.options].forEach((opt) => {
        const label = opt.dataset[key];
        if (label) opt.textContent = label;
      });
    };
    // data-label-en → dataset.labelEn
    syncInquiryLabels();
    const langWatch = new MutationObserver(syncInquiryLabels);
    langWatch.observe(html, { attributes: true, attributeFilter: ["data-lang"] });

    if (type && typeEl) typeEl.value = type;
    if (product && productEl) productEl.value = product;
    if (role) {
      const msg = form.querySelector('textarea[name="message"]');
      if (msg && !msg.value) msg.value = `Application for role: ${role}`;
      if (typeEl) typeEl.value = "careers";
    }

    const status = document.getElementById("formStatus");
    const success = {
      en: "Thank you. Our team will respond shortly.",
      vi: "Cảm ơn bạn. Đội ngũ chúng tôi sẽ phản hồi sớm.",
      zh: "感谢您。我们的团队将尽快回复。",
    };
    const error = {
      en: "Something went wrong. Please email us directly.",
      vi: "Có lỗi xảy ra. Vui lòng gửi email trực tiếp cho chúng tôi.",
      zh: "发送失败。请直接发送邮件联系我们。",
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const lang = documentLocale();
      const endpoint = form.getAttribute("action") || "";
      const data = new FormData(form);
      if (data.get("_gotcha")) return;

      // Demo / placeholder Formspree IDs: still show success UX for local demos
      const isPlaceholder = /formspree\.io\/f\/(xpwzgkqn|xxxx)/i.test(endpoint);

      try {
        if (!isPlaceholder) {
          const res = await fetch(endpoint, {
            method: "POST",
            body: data,
            headers: { Accept: "application/json" },
          });
          if (!res.ok) throw new Error("submit failed");
        }
        if (status) {
          status.hidden = false;
          status.classList.remove("is-error");
          status.textContent = success[lang] || success.en;
        }
        form.reset();
        if (product) {
          const el = document.getElementById("productCode");
          if (el) el.value = product;
        }
      } catch (_) {
        if (status) {
          status.hidden = false;
          status.classList.add("is-error");
          status.textContent = error[lang] || error.en;
        }
      }
    });
  }

  /* Inner pages: keep header in scrolled style at top */
  const header = document.getElementById("header");
  if (header?.classList.contains("header--inner")) {
    header.classList.add("is-scrolled");
  }

  /* Page subnav (About tabs) */
  const subnav = document.querySelector("[data-page-subnav]");
  if (subnav) {
    const links = [...subnav.querySelectorAll("[data-subnav-target]")];
    const panels = [...document.querySelectorAll("[data-page-panel]")];
    const setActive = id => {
      links.forEach(a => a.classList.toggle("is-active", a.dataset.subnavTarget === id));
    };
    links.forEach(a => {
      a.addEventListener("click", () => setActive(a.dataset.subnavTarget));
    });
    if (panels.length && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        entries => {
          for (const e of entries) {
            if (e.isIntersecting) setActive(e.target.dataset.pagePanel);
          }
        },
        { rootMargin: "-40% 0px -45% 0px", threshold: 0.1 }
      );
      panels.forEach(p => io.observe(p));
    }
    const hash = window.location.hash.replace("#", "");
    if (hash) setActive(hash);

    const syncStuck = () => {
      const stuck = subnav.getBoundingClientRect().top <= (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 68) + 1;
      subnav.classList.toggle("is-stuck", stuck);
    };
    syncStuck();
    window.addEventListener("scroll", syncStuck, { passive: true });
  }
})();
