# Nam Viet Group — Corporate Website

Chapter-storytelling home page plus multi-page corporate site (About, Products, News, Contact, Careers, Investors, Downloads, legal pages). Built with **Eleventy**, HTML/CSS/JS, trilingual **EN / VI / 中文**.

## Develop

```bash
npm install
npm run dev
# http://localhost:8123
```

## Build

```bash
npm run build
# Output: _site/
```

For GitHub project pages locally:

```bash
set PATH_PREFIX=/nam-viet-group-web/
npm run build
```

## Structure

| Path | Purpose |
|------|---------|
| `src/index.njk` | Home (12 chapters) |
| `src/about.njk` | About + leadership |
| `src/products/` | Catalog + markdown product items |
| `src/news/` | News index + markdown posts + RSS |
| `src/contact.njk` | Contact form (Formspree) |
| `src/careers.njk` | Open roles |
| `src/investors.njk` | IR highlights & reports |
| `src/downloads.njk` | Download center |
| `src/privacy.njk` / `terms.njk` | Legal |
| `src/_data/` | Site config, i18n, nav, careers, downloads |
| `src/css/` · `src/js/` · `src/assets/` | Static assets |

## Configure

Edit [`src/_data/site.json`](src/_data/site.json):

- `url` — production canonical URL
- `emailPartner` / `emailContact` / `phone` / `address`
- `formEndpoint` — your [Formspree](https://formspree.io) form URL (replace the placeholder)
- `analyticsId` — optional GA4 measurement ID (e.g. `G-XXXXXXXX`)
- `whatsapp` / `zalo` — floating chat numbers

### Content CMS (Git-based)

- **Products:** add `src/products/items/*.md`
- **News:** add `src/news/posts/*.md`
- Redeploy / rebuild after push

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) builds with `PATH_PREFIX=/nam-viet-group-web/` and publishes to **GitHub Pages**.

1. Repo → Settings → Pages → Source: **GitHub Actions**
2. Push to `main`
3. Site: `https://picapika22.github.io/nam-viet-group-web/`

For a custom domain, set `site.url`, clear `PATH_PREFIX` in the workflow (use `/`), and add a `CNAME` under `src/`.

## SEO & ops

- Open Graph + canonical tags on every page
- `robots.txt`, `sitemap.xml`, news `feed.xml`
- Cookie notice + optional GA4
- Privacy / Terms in three languages
