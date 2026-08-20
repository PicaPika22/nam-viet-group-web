(() => {
  "use strict";

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const image = (src, className = "") =>
    src ? `<img class="${className}" src="${escapeHtml(src)}" alt="">` : "";

  function text(section, lang, key) {
    return escapeHtml(section.content?.[lang]?.[key] || "");
  }

  function langText(value, lang) {
    return `<span class="lang ${lang} is-preview-lang">${escapeHtml(value?.[lang] || "")}</span>`;
  }

  function title(section, lang, small = false, center = false, accent = false) {
    const classes = ["chapter__title"];
    if (small) classes.push("chapter__title--sm");
    if (center) classes.push("chapter__title--center");
    return `<h2 class="${classes.join(" ")}"><span class="lang ${lang} is-preview-lang"><span class="line-mask"><span class="line">${text(section, lang, "titleLine1")}</span></span><span class="line-mask"><span class="line ${accent ? "line--accent" : "line--muted"}">${text(section, lang, "titleLine2")}</span></span></span></h2>`;
  }

  function head(section, lang, number, options = {}) {
    const bodyOnlyLead = section.id === "about" || section.id === "manufacturing" || section.id === "sustainability";
    return `<header class="chapter__head${options.center ? " chapter__head--center" : ""}">
      <span class="chapter__num">${number}</span>
      <p class="eyebrow${options.light ? " eyebrow--light" : ""}">${text(section, lang, "eyebrow")}</p>
      ${title(section, lang, options.small, false, options.accent)}
      ${!bodyOnlyLead && section.content?.[lang]?.lead ? `<p class="chapter__desc">${text(section, lang, "lead")}</p>` : ""}
    </header>`;
  }

  function stats(section, lang, className = "stats") {
    return `<div class="${className}">${(section.stats || []).map((stat) =>
      `<div class="stat"><span class="stat__value">${escapeHtml(stat.value)}</span><span class="stat__label">${langText(stat.label, lang)}</span></div>`
    ).join("")}</div>`;
  }

  function button(section, lang, key = "ctaPrimary", light = false) {
    if (!section.content?.[lang]?.[key]) return "";
    return `<span class="btn ${light ? "btn--light" : "btn--dark"}"><span class="btn__dot"></span>${text(section, lang, key)}</span>`;
  }

  function shell(section, number, classes, body) {
    return `<section class="${classes}" id="preview-${escapeHtml(section.id)}" data-chapter="${number}">${body}</section>`;
  }

  const renderers = {
    hero(section, lang, number) {
      return shell(section, number, "hero-nv chapter", `
        <div class="hero-nv__scene"><div class="hero-nv__art">${image(section.images?.art)}</div><span class="hero-nv__focus-veil"></span></div>
        <ul class="hero-nv__metrics">${(section.stats || []).map((stat) => `<li class="hero-nv__metric"><p class="hero-nv__metric-value">${escapeHtml(stat.value)}</p><p class="hero-nv__metric-label">${langText(stat.label, lang)}</p></li>`).join("")}</ul>
        <div class="container hero-nv__grid"><div class="hero-nv__copy">
          <p class="eyebrow">${text(section, lang, "eyebrow")}</p>
          <h1 class="hero-nv__title"><span class="lang ${lang} is-preview-lang"><span class="line-mask"><span class="line">${text(section, lang, "titleLine1")}</span></span><span class="line-mask"><span class="line line--accent">${text(section, lang, "titleLine2")}</span></span></span></h1>
          <p class="lead hero-nv__desc">${text(section, lang, "lead")}</p>
          <div class="hero-nv__actions">${button(section, lang)} ${button(section, lang, "ctaSecondary", true)}</div>
        </div></div>`);
    },

    about(section, lang, number) {
      return shell(section, number, "chapter chapter--light", `<div class="container">${head(section, lang, number)}
        <div class="about__grid"><div class="about__media">${image(section.images?.media)}</div><div class="about__body">
          <p class="lead">${text(section, lang, "lead")}</p><p class="body-text">${text(section, lang, "body")}</p>${stats(section, lang)}
        </div></div></div>`);
    },

    ecosystem(section, lang, number) {
      return shell(section, number, "chapter chapter--dark", `<div class="chapter__bg">${image(section.images?.background)}<div class="chapter__bg-veil"></div></div>
        <div class="container">${head(section, lang, number, { light: true, accent: true })}
          <ol class="flow">${(section.items || []).map((item, i) => `<li class="flow__step"><span class="flow__no">${String(i + 1).padStart(2, "0")}</span><span class="flow__name">${langText(item.label, lang)}</span></li>`).join("")}</ol>
          <p class="preview-widget">Rendered on the live page</p>${button(section, lang, "ctaPrimary", true)}
        </div>`);
    },

    manufacturing(section, lang, number) {
      return shell(section, number, "chapter chapter--light", `<div class="container">${head(section, lang, number)}
        <div class="manu__grid"><div class="manu__body"><p class="lead">${text(section, lang, "lead")}</p>
          <ul class="checks">${(section.items || []).map((item) => `<li><i></i>${langText(item.label, lang)}</li>`).join("")}</ul>${button(section, lang)}
        </div><div class="manu__media">${image(section.images?.media)}</div></div>${stats(section, lang, "manu__stats")}</div>`);
    },

    products(section, lang, number) {
      return shell(section, number, "chapter chapter--cream", `<div class="container">${head(section, lang, number, { center: true })}
        <div class="products__grid">${(section.items || []).map((item) => `<article class="pcard pcard--media"><span class="pcard__media">${image(section.images?.[item.id])}</span><span class="pcard__code">${escapeHtml(item.code)}</span><span class="pcard__name">${langText(item.name, lang)}</span></article>`).join("")}</div>
        <div class="center">${button(section, lang)}</div></div>`);
    },

    logistics(section, lang, number) {
      return shell(section, number, "chapter chapter--dark", `<div class="chapter__bg">${image(section.images?.background)}<div class="chapter__bg-veil chapter__bg-veil--strong"></div></div>
        <div class="container">${head(section, lang, number, { light: true, accent: true })}${stats(section, lang, "logi__stats")}${button(section, lang, "ctaPrimary", true)}</div>`);
    },

    network(section, lang, number) {
      return shell(section, number, "chapter chapter--light", `<div class="container">${head(section, lang, number, { center: true })}</div>
        <div class="partner-marquee"><div class="partner-marquee__track">${(section.items || []).map((partner) => `<span class="partner-logo">${image(partner.image)}</span>`).join("")}</div></div>
        <div class="container center">${button(section, lang)}</div>`);
    },

    sustainability(section, lang, number) {
      return shell(section, number, "chapter chapter--cream", `<div class="container">${head(section, lang, number)}
        <div class="esg__grid"><div class="esg__media">${image(section.images?.media)}</div><div class="esg__body"><p class="lead">${text(section, lang, "lead")}</p>
          <p class="preview-widget">Rendered on the live page</p>${button(section, lang)}</div></div></div>`);
    },

    leadership(section, lang, number) {
      return shell(section, number, "chapter chapter--light", `<div class="container"><div class="leader__grid"><div class="leader__body">
        <span class="chapter__num">${number}</span><p class="eyebrow">${text(section, lang, "eyebrow")}</p>${title(section, lang, true)}
        <p class="body-text">${text(section, lang, "body")}</p>${button(section, lang)}
        </div><div class="leader__media">${image(section.images?.media)}</div></div></div>`);
    },

    milestones(section, lang, number) {
      return shell(section, number, "chapter chapter--cream chapter--journey", `<div class="container">
        <header class="journey__head"><span class="chapter__num">${number}</span><p class="eyebrow">${text(section, lang, "eyebrow")}</p>${title(section, lang, true)}<p class="journey__intro">${text(section, lang, "lead")}</p></header>
        <div class="journey-tl"><ol class="journey-tl__track">${(section.timeline || []).map((item, i) => `<li class="jcard${i === 0 ? " is-active" : ""}"><article class="jcard__panel"><div class="jcard__media">${image(item.image)}</div><div class="jcard__veil"></div><span class="jcard__year">${escapeHtml(item.year)}</span><div class="jcard__copy"><h3 class="jcard__title">${langText(item.title, lang)}</h3><p class="jcard__text">${langText(item.description, lang)}</p></div></article></li>`).join("")}</ol></div>
        <aside class="journey-banner"><div class="journey-banner__media">${image(section.images?.banner)}</div><div class="journey-banner__inner"><p>${text(section, lang, "bannerStatement")}</p>${stats(section, lang, "journey-banner__stats")}</div></aside>
      </div>`);
    },

    news(section, lang, number) {
      return shell(section, number, "chapter chapter--light", `<div class="container">${head(section, lang, number)}
        <p class="preview-widget">Rendered on the live page</p><div class="center">${button(section, lang)}</div></div>`);
    },

    contact(section, lang, number) {
      return shell(section, number, "chapter cta", `<div class="chapter__bg">${image(section.images?.background)}<div class="chapter__bg-veil chapter__bg-veil--warm"></div></div>
        <div class="container cta__inner"><span class="chapter__num">${number}</span>${title(section, lang, false, true, true)}
          <p class="chapter__desc chapter__desc--center">${text(section, lang, "lead")}</p><div class="cta__actions">${button(section, lang, "ctaPrimary", true)} ${button(section, lang, "ctaSecondary", true)}</div>
        </div>`);
    },
  };

  function renderPreview(section, lang = "vi", number = "01") {
    if (!section || !renderers[section.id]) {
      return '<div class="preview-empty">Chọn một khối để xem trước.</div>';
    }
    return renderers[section.id](section, lang, number);
  }

  window.HomePreview = { renderPreview, escapeHtml };
})();
