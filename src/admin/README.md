# Nam Viet Content Studio

Local CMS for **News** and **Careers** (EN / VI / 中文).

## Run

```bash
npm run dev:cms
```

- Site: http://localhost:8125/
- Studio: http://localhost:8125/admin/
- API: http://127.0.0.1:8081/api/health

Or separately: `npm run dev` + `npm run cms`.

## What it writes

| Content | Path |
|---------|------|
| News posts | `src/news/posts/*.md` |
| Jobs | `src/careers/jobs/*.md` |
| Uploaded images | `src/assets/img/` |

Eleventy watch rebuilds the public site while `npm run dev` is running.
