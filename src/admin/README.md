# Nam Viet Content Studio

CMS for **News** and **Careers** (EN / VI / 中文).

## Local

```bash
npm run dev:cms
```

- Site: http://localhost:8125/
- Studio: http://localhost:8125/admin/ (or http://127.0.0.1:8081/admin/ when only CMS runs)
- API: http://127.0.0.1:8081/api/health

Local mode writes files on disk under `src/news/posts/` and `src/careers/jobs/`.

## Production (Railway → GitHub → Vercel)

1. Deploy this repo on **Railway** with start command `node scripts/admin-api.js`.
2. Set env vars from [`.env.example`](../../.env.example) (`GITHUB_TOKEN`, `GITHUB_REPO`, `ADMIN_USER`, `ADMIN_PASS`).
3. Give editors the Railway URL: `https://your-cms.up.railway.app/admin/`
4. Publishing creates a GitHub commit → **Vercel** rebuilds the public site in ~1–2 minutes.

### GitHub token

Create a fine-grained PAT with **Contents: Read and write** on this repository only.

## Auth

If `ADMIN_USER` + `ADMIN_PASS` (or `ADMIN_TOKEN`) are set, the Studio shows a login screen.
