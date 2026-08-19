/* ═══════════════════════════════════════════
   NAM VIET GROUP — interactions & motion
   ═══════════════════════════════════════════ */

(() => {
  "use strict";

  const html = document.documentElement;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─── Loader ─── */
  const loader = document.getElementById("loader");
  window.addEventListener("load", () => {
    setTimeout(() => loader.classList.add("is-done"), prefersReduced ? 0 : 900);
  });
  // Safety: never keep the loader longer than 3s even if an image stalls
  setTimeout(() => loader.classList.add("is-done"), 3000);

  /* ─── Language switch (persisted) ─── */
  const langButtons = document.querySelectorAll("[data-set-lang]");
  const setLang = (lang, animate = true) => {
    html.setAttribute("data-lang", lang);
    const htmlLang = { en: "en", vi: "vi", zh: "zh-CN" };
    html.setAttribute("lang", htmlLang[lang] || "en");
    localStorage.setItem("nv-lang", lang);
    langButtons.forEach(b => b.classList.toggle("is-active", b.dataset.setLang === lang));
    updateRailLabel();
    if (animate && !prefersReduced) {
      document.body.classList.remove("lang-switching");
      void document.body.offsetWidth; // restart animation
      document.body.classList.add("lang-switching");
    }
  };
  langButtons.forEach(b => b.addEventListener("click", () => setLang(b.dataset.setLang)));
  // NOTE: initial setLang is called after the chapter-rail setup below,
  // because updateRailLabel depends on variables declared there.

  /* ─── Header behaviour ─── */
  const header = document.getElementById("header");
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  let lastY = window.scrollY;
  const menuOpen = () => nav.classList.contains("is-open");
  const onHeaderScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);
    header.classList.toggle("is-hidden", !menuOpen() && y > lastY && y > 500);
    lastY = y;
  };

  /* ─── Mobile menu ─── */
  const setMenu = open => {
    nav.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    header.classList.toggle("is-menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    if (open) header.classList.remove("is-hidden");
    onHeaderScroll();
  };
  burger.setAttribute("aria-expanded", "false");
  burger.setAttribute("aria-controls", "nav");
  burger.addEventListener("click", () => setMenu(!menuOpen()));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" && menuOpen()) setMenu(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1280 && menuOpen()) setMenu(false);
  });

  /* ─── Reveal on scroll ─── */
  const revealTargets = document.querySelectorAll(".reveal, .reveal-img, .chapter__title, .hero__title");
  revealTargets.forEach(el => {
    const d = el.dataset.delay;
    if (d) el.style.setProperty("--d", `${d}ms`);
  });
  const revealIO = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          revealIO.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  revealTargets.forEach(el => revealIO.observe(el));

  /* ─── Animated counters ─── */
  const counters = document.querySelectorAll("[data-count]");
  const runCounter = el => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const duration = 1800;
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counterIO = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          runCounter(e.target);
          counterIO.unobserve(e.target);
        }
      }
    },
    { threshold: 0.6 }
  );
  counters.forEach(el => counterIO.observe(el));

  /* ─── Chapter rail (number + label + progress) ─── */
  const rail = document.getElementById("rail");
  const railIndex = document.getElementById("railIndex");
  const railProgress = document.getElementById("railProgress");
  const railLabel = document.getElementById("railLabel");
  const chapters = [...document.querySelectorAll(".chapter")];
  let activeChapter = chapters[0];

  function updateRailLabel() {
    if (!activeChapter) return;
    const lang = html.getAttribute("data-lang");
    const key = lang === "vi" ? "labelVi" : lang === "zh" ? "labelZh" : "labelEn";
    railLabel.textContent = activeChapter.dataset[key] || "";
  }

  const chapterIO = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (e.isIntersecting) {
          activeChapter = e.target;
          railIndex.textContent = e.target.dataset.chapter;
          updateRailLabel();
          const dark = e.target.classList.contains("chapter--dark") ||
                       e.target.classList.contains("cta") ||
                       e.target.classList.contains("hero");
          rail.classList.toggle("rail--light", dark);
        }
      }
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  chapters.forEach(c => chapterIO.observe(c));

  setLang(localStorage.getItem("nv-lang") || "en", false);

  /* ─── Scroll-linked effects (rAF batched) ─── */
  const parallaxBgs = [...document.querySelectorAll("[data-parallax]")];
  const parallaxImgs = [...document.querySelectorAll("[data-parallax-img] img")];
  const timelineFill = document.getElementById("timelineFill");
  const timelineSection = document.getElementById("milestones");
  let ticking = false;

  const onScrollFx = () => {
    const vh = window.innerHeight;

    if (!prefersReduced) {
      // Section background parallax
      for (const bg of parallaxBgs) {
        const rect = bg.parentElement.getBoundingClientRect
          ? bg.getBoundingClientRect()
          : null;
        if (!rect || rect.bottom < 0 || rect.top > vh) continue;
        const speed = parseFloat(bg.dataset.parallax);
        const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
        const img = bg.querySelector("img");
        if (img) img.style.transform = `translateY(${offset}px)`;
      }
      // Inline media subtle drift
      for (const img of parallaxImgs) {
        const rect = img.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) continue;
        const progress = (vh - rect.top) / (vh + rect.height); // 0..1
        img.style.transform = `translateY(${(progress - 0.5) * -24}px) scale(1.06)`;
      }
    }

    // Timeline progress line
    if (timelineFill && timelineSection) {
      const rect = timelineSection.getBoundingClientRect();
      const p = Math.min(Math.max((vh * 0.75 - rect.top) / rect.height, 0), 1);
      timelineFill.style.width = `${p * 100}%`;
    }

    // Rail progress within page
    const doc = document.documentElement;
    const total = doc.scrollHeight - vh;
    railProgress.style.height = `${(window.scrollY / total) * 100}%`;

    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      onHeaderScroll();
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScrollFx);
      }
    },
    { passive: true }
  );
  onHeaderScroll();
  onScrollFx();

  /* ─── Smooth anchor offset for fixed header ─── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", ev => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      ev.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (id === "#hero" ? 0 : 64);
      window.scrollTo({ top, behavior: prefersReduced ? "auto" : "smooth" });
      history.replaceState(null, "", id);
    });
  });
})();
