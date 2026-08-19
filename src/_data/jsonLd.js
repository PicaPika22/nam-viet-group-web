const site = require("./site.json");

function abs(path) {
  const root = String(site.url || "").replace(/\/$/, "");
  const next = path.startsWith("/") ? path : `/${path}`;
  return `${root}${next}`;
}

module.exports = {
  organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    legalName: site.legalName.en,
    url: site.url,
    logo: abs("/assets/img/logo-160.png"),
    email: site.emailPartner,
    telephone: site.phone,
    taxID: site.taxId,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.en,
      addressLocality: "Song Cong",
      addressRegion: "Thai Nguyen",
      addressCountry: "VN",
    },
  },
  website: {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    inLanguage: ["en", "vi", "zh-CN"],
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
  },
};
