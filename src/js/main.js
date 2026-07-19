/* ═══════════════════════════════════════════
   NAM VIET GROUP — interactions & motion
   ═══════════════════════════════════════════ */

(() => {
  "use strict";

  const html = document.documentElement;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─── Loader ─── */
  const loader = document.getElementById("loader");
  const finishLoader = () => loader?.classList.add("is-done");
  window.addEventListener("load", () => {
    setTimeout(finishLoader, prefersReduced ? 0 : 900);
  });
  // Safety: never keep the loader longer than 3s even if an image stalls
  setTimeout(finishLoader, 3000);

  /* ─── Language switch (persisted dropdown) ─── */
  const langRoot = document.getElementById("langSwitch");
  const langToggle = document.getElementById("langToggle");
  const langMenu = document.getElementById("langMenu");
  const langButtons = document.querySelectorAll("[data-set-lang]");
  const langFlagEl = langRoot?.querySelector("[data-lang-flag]");
  const langCodeEl = langRoot?.querySelector("[data-lang-code]");
  const langMeta = {
    en: { code: "EN", flag: "en", label: "English" },
    vi: { code: "VI", flag: "vi", label: "Tiếng Việt" },
    zh: { code: "中文", flag: "zh", label: "中文" },
  };
  const closeLangMenu = () => {
    if (!langRoot || !langToggle || !langMenu) return;
    langRoot.classList.remove("is-open");
    langToggle.setAttribute("aria-expanded", "false");
    langMenu.hidden = true;
  };
  const openLangMenu = () => {
    if (!langRoot || !langToggle || !langMenu) return;
    langRoot.classList.add("is-open");
    langToggle.setAttribute("aria-expanded", "true");
    langMenu.hidden = false;
  };
  const setLang = (lang, animate = true) => {
    const next = langMeta[lang] ? lang : "en";
    html.setAttribute("data-lang", next);
    const htmlLang = { en: "en", vi: "vi", zh: "zh-CN" };
    html.setAttribute("lang", htmlLang[next] || "en");
    localStorage.setItem("nv-lang", next);
    langButtons.forEach(b => {
      const on = b.dataset.setLang === next;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    if (langFlagEl) langFlagEl.className = `lang-flag lang-flag--${langMeta[next].flag}`;
    if (langCodeEl) langCodeEl.textContent = langMeta[next].code;
    if (langToggle) langToggle.setAttribute("aria-label", `Language: ${langMeta[next].label}`);
    closeLangMenu();
    updateRailLabel();
    if (animate && !prefersReduced) {
      document.body.classList.remove("lang-switching");
      void document.body.offsetWidth; // restart animation
      document.body.classList.add("lang-switching");
    }
  };
  langToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (langRoot?.classList.contains("is-open")) closeLangMenu();
    else openLangMenu();
  });
  langButtons.forEach(b => b.addEventListener("click", () => setLang(b.dataset.setLang)));
  document.addEventListener("click", (e) => {
    if (langRoot && !langRoot.contains(e.target)) closeLangMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLangMenu();
  });
  // NOTE: initial setLang is called after the chapter-rail setup below,
  // because updateRailLabel depends on variables declared there.

  /* ─── Header behaviour ─── */
  const header = document.getElementById("header");
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  const isInnerHeader = header?.classList.contains("header--inner");
  let lastY = window.scrollY;
  const menuOpen = () => !!nav?.classList.contains("is-open");
  const onHeaderScroll = () => {
    if (!header) return;
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", isInnerHeader || y > 40);
    header.classList.toggle("is-hidden", !menuOpen() && y > lastY && y > 500);
    lastY = y;
  };

  /* ─── Mobile menu ─── */
  const navBackdrop = document.getElementById("navBackdrop");
  const navClose = document.getElementById("navClose");
  const setMenu = open => {
    if (!nav || !burger || !header) return;
    nav.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    header.classList.toggle("is-menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
    document.body.classList.toggle("is-nav-open", open);
    if (navBackdrop) {
      navBackdrop.hidden = !open;
      navBackdrop.classList.toggle("is-visible", open);
    }
    if (open) header.classList.remove("is-hidden");
    onHeaderScroll();
  };
  if (burger && nav) {
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-controls", "nav");
    burger.addEventListener("click", () => setMenu(!menuOpen()));
    navClose?.addEventListener("click", () => setMenu(false));
    navBackdrop?.addEventListener("click", () => setMenu(false));
    nav.querySelectorAll("a").forEach(a => {
      if (a.closest(".nav-dropdown, .nav-mega")) return;
      if (a.classList.contains("nav-item__link") && a.closest(".has-dropdown, .has-mega")) return;
      a.addEventListener("click", () => setMenu(false));
    });
    nav.querySelectorAll(".nav-dropdown a, .nav-mega a, .nav-mobile__cta").forEach(a =>
      a.addEventListener("click", () => setMenu(false))
    );
    window.addEventListener("keydown", e => {
      if (e.key === "Escape" && menuOpen()) setMenu(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1280 && menuOpen()) setMenu(false);
      nav.querySelectorAll(".nav-item.is-open").forEach(i => i.classList.remove("is-open"));
    });
  }

  /* Logo → home top (same-page click otherwise does nothing) */
  const goHomeTop = () => {
    setMenu(false);
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname || "/");
    }
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
    header?.classList.remove("is-hidden");
  };
  document.querySelectorAll(".header__logo, .nav-mobile__brand").forEach((logo) => {
    logo.addEventListener("click", (e) => {
      if (!document.body.classList.contains("page-home")) return;
      e.preventDefault();
      goHomeTop();
    });
  });

  /* Nav dropdown / mega (mobile accordion) */
  const navItems = nav ? [...nav.querySelectorAll(".nav-item.has-dropdown, .nav-item.has-mega")] : [];
  const syncNavPanels = () => {
    for (const item of navItems) {
      const open = item.classList.contains("is-open");
      item.querySelector(".nav-item__link")?.setAttribute("aria-expanded", open ? "true" : "false");
    }
  };
  navItems.forEach(item => {
    const trigger = item.querySelector(".nav-item__link");
    trigger?.addEventListener("click", e => {
      if (window.innerWidth > 1280) return;
      e.preventDefault();
      const wasOpen = item.classList.contains("is-open");
      navItems.forEach(i => i.classList.remove("is-open"));
      if (!wasOpen) {
        item.classList.add("is-open");
        requestAnimationFrame(() => {
          item.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
      }
      syncNavPanels();
    });
  });

  const syncDropdownChildActive = () => {
    if (!nav) return;
    const path = window.location.pathname.replace(/\/index\.html$/, "/");
    const hash = window.location.hash;
    nav.querySelectorAll(".nav-dropdown__link, .nav-mega__link").forEach(link => {
      const href = link.getAttribute("href") || "";
      const [linkPath, linkHash = ""] = href.split("#");
      const normalizedPath = linkPath.replace(/\/index\.html$/, "/") || "/";
      const pathMatch = normalizedPath === path || (normalizedPath !== "/" && path.startsWith(normalizedPath));
      const hashMatch = linkHash ? hash === `#${linkHash}` : pathMatch && !hash;
      link.classList.toggle("is-active", pathMatch && (linkHash ? hashMatch : hashMatch || pathMatch));
    });
  };
  syncDropdownChildActive();
  window.addEventListener("hashchange", syncDropdownChildActive);

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
    if (!activeChapter || !railLabel) return;
    const lang = html.getAttribute("data-lang");
    const key = lang === "vi" ? "labelVi" : lang === "zh" ? "labelZh" : "labelEn";
    railLabel.textContent = activeChapter.dataset[key] || "";
  }

  if (rail && chapters.length) {
    const chapterIO = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            activeChapter = e.target;
            if (railIndex) railIndex.textContent = e.target.dataset.chapter;
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
  }

  setLang(localStorage.getItem("nv-lang") || "en", false);

  /* ─── Scroll-linked effects (rAF batched) ─── */
  const parallaxBgs = [...document.querySelectorAll("[data-parallax]")];
  const parallaxImgs = [...document.querySelectorAll("[data-parallax-img] img")];
  const timelineFill = document.getElementById("timelineFill");
  const timelineSection = document.getElementById("milestones");
  const journeyTrack = document.getElementById("journeyTrack");
  const journeyPrev = document.querySelector("[data-journey-prev]");
  const journeyNext = document.querySelector("[data-journey-next]");
  let ticking = false;

  const journeyRoot = document.querySelector("[data-journey-tl]");
  const journeyCards = journeyTrack ? [...journeyTrack.querySelectorAll(".jcard")] : [];
  let journeyActive = 0;
  let journeyTimer = null;
  let journeyResumeTimer = null;
  let journeyInView = false;
  let journeyUserPaused = false;
  const JOURNEY_MS = 4200;
  const JOURNEY_RESUME_MS = 7000;

  const bumpJourneyProgress = () => {
    if (!journeyRoot || prefersReduced) return;
    journeyRoot.classList.remove("is-autoplaying");
    // force reflow so progress animation restarts on each slide
    void journeyRoot.offsetWidth;
    if (journeyInView && !journeyUserPaused && document.visibilityState === "visible") {
      journeyRoot.classList.add("is-autoplaying");
    }
  };

  const setJourneyActive = (index, { scroll = false } = {}) => {
    if (!journeyCards.length) return;
    const len = journeyCards.length;
    journeyActive = ((index % len) + len) % len;
    journeyCards.forEach((card, i) => {
      card.classList.toggle("is-active", i === journeyActive);
    });
    if (timelineFill) {
      const p = len > 1 ? journeyActive / (len - 1) : 1;
      timelineFill.style.width = `${p * 100}%`;
    }
    if (scroll) {
      journeyCards[journeyActive].scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        inline: "center",
        block: "nearest",
      });
    }
    bumpJourneyProgress();
  };

  const stopJourneyAuto = () => {
    if (journeyTimer) {
      clearInterval(journeyTimer);
      journeyTimer = null;
    }
    journeyRoot?.classList.remove("is-autoplaying");
  };

  const startJourneyAuto = () => {
    if (
      prefersReduced ||
      !journeyCards.length ||
      !journeyInView ||
      journeyUserPaused ||
      document.visibilityState !== "visible"
    ) {
      stopJourneyAuto();
      return;
    }
    stopJourneyAuto();
    bumpJourneyProgress();
    journeyTimer = setInterval(() => {
      setJourneyActive(journeyActive + 1, { scroll: true });
    }, JOURNEY_MS);
  };

  const pauseJourneyAuto = (resumeMs = JOURNEY_RESUME_MS) => {
    journeyUserPaused = true;
    stopJourneyAuto();
    if (journeyResumeTimer) clearTimeout(journeyResumeTimer);
    if (resumeMs > 0) {
      journeyResumeTimer = setTimeout(() => {
        journeyUserPaused = false;
        startJourneyAuto();
      }, resumeMs);
    }
  };

  const syncJourneyFromScroll = () => {
    if (!journeyTrack || !journeyCards.length) return;
    const trackRect = journeyTrack.getBoundingClientRect();
    const center = trackRect.left + trackRect.width / 2;
    let best = 0;
    let bestDist = Infinity;
    journeyCards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    if (best !== journeyActive) setJourneyActive(best);
  };

  const scrollJourneyBy = (dir) => {
    pauseJourneyAuto();
    setJourneyActive(journeyActive + dir, { scroll: true });
  };

  if (journeyTrack && journeyRoot) {
    let journeyScrollTick = false;
    let journeyScrollFromUser = false;

    journeyTrack.addEventListener(
      "scroll",
      () => {
        if (journeyScrollTick) return;
        journeyScrollTick = true;
        requestAnimationFrame(() => {
          if (journeyScrollFromUser) pauseJourneyAuto();
          syncJourneyFromScroll();
          journeyScrollTick = false;
        });
      },
      { passive: true }
    );
    journeyTrack.addEventListener(
      "pointerdown",
      () => {
        journeyScrollFromUser = true;
      },
      { passive: true }
    );
    journeyTrack.addEventListener(
      "pointerup",
      () => {
        journeyScrollFromUser = false;
      },
      { passive: true }
    );

    journeyPrev?.addEventListener("click", () => scrollJourneyBy(-1));
    journeyNext?.addEventListener("click", () => scrollJourneyBy(1));
    journeyCards.forEach((card, i) => {
      card.addEventListener("click", () => {
        pauseJourneyAuto();
        setJourneyActive(i, { scroll: true });
      });
    });
    journeyTrack.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowRight") {
        ev.preventDefault();
        scrollJourneyBy(1);
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        scrollJourneyBy(-1);
      }
    });

    journeyRoot.addEventListener("mouseenter", () => pauseJourneyAuto(0));
    journeyRoot.addEventListener("mouseleave", () => {
      journeyUserPaused = false;
      if (journeyResumeTimer) clearTimeout(journeyResumeTimer);
      startJourneyAuto();
    });
    journeyRoot.addEventListener("focusin", () => pauseJourneyAuto(0));
    journeyRoot.addEventListener("focusout", (ev) => {
      if (!journeyRoot.contains(ev.relatedTarget)) {
        journeyUserPaused = false;
        startJourneyAuto();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") stopJourneyAuto();
      else startJourneyAuto();
    });

    if ("IntersectionObserver" in window && timelineSection) {
      const io = new IntersectionObserver(
        ([entry]) => {
          journeyInView = entry.isIntersecting && entry.intersectionRatio > 0.35;
          if (journeyInView) startJourneyAuto();
          else stopJourneyAuto();
        },
        { threshold: [0.2, 0.35, 0.5] }
      );
      io.observe(timelineSection);
    } else {
      journeyInView = true;
      startJourneyAuto();
    }

    setJourneyActive(0);
    window.addEventListener("resize", syncJourneyFromScroll, { passive: true });
  }

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

    // Fallback page-scroll progress when track isn't overflowed
    if (timelineFill && timelineSection && journeyTrack) {
      const max = journeyTrack.scrollWidth - journeyTrack.clientWidth;
      if (max <= 2) {
        const rect = timelineSection.getBoundingClientRect();
        const p = Math.min(Math.max((vh * 0.75 - rect.top) / rect.height, 0), 1);
        timelineFill.style.width = `${p * 100}%`;
      }
    }

    // Rail progress within page
    if (railProgress) {
      const doc = document.documentElement;
      const total = doc.scrollHeight - vh;
      railProgress.style.height = `${total > 0 ? (window.scrollY / total) * 100 : 0}%`;
    }

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

  /* ─── Ecosystem map — sector tabs ─── */
  document.querySelectorAll("[data-eco-map]").forEach((root) => {
    const tabs = [...root.querySelectorAll("[data-eco-tab]")];
    const panels = [...root.querySelectorAll("[data-eco-panel]")];
    if (!tabs.length || !panels.length) return;

    const activate = (id, { focus = false } = {}) => {
      let activeTab = null;
      tabs.forEach((tab) => {
        const on = tab.dataset.ecoTab === id;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.tabIndex = on ? 0 : -1;
        if (on) activeTab = tab;
      });
      panels.forEach((panel) => {
        const on = panel.dataset.ecoPanel === id;
        panel.classList.toggle("is-active", on);
        if (on) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "");
      });
      if (focus && activeTab) activeTab.focus({ preventScroll: true });
      activeTab?.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        inline: "nearest",
        block: "nearest",
      });
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const id = tab.dataset.ecoTab;
        activate(id);
        if (root.closest(".page-inner") && id) {
          history.replaceState(null, "", `#${id}`);
        }
      });
    });

    const tablist = root.querySelector('[role="tablist"]');
    tablist?.addEventListener("keydown", (e) => {
      const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      const i = tabs.findIndex((t) => t.classList.contains("is-active"));
      let next = i;
      if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = tabs.length - 1;
      activate(tabs[next].dataset.ecoTab, { focus: true });
    });

    const hashId = window.location.hash.replace(/^#/, "");
    const fromHash = hashId && tabs.some((t) => t.dataset.ecoTab === hashId) ? hashId : "";
    const fromAttr = root.dataset.ecoInitial || "";
    const initial =
      fromHash ||
      fromAttr ||
      tabs.find((t) => t.classList.contains("is-active"))?.dataset.ecoTab ||
      tabs[0].dataset.ecoTab;
    activate(initial);
  });

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
