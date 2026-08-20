# Nam Viet Content Studio

CMS for **News** and **Careers** (EN / VI / 中文). Homepage blocks are edited separately in **Home Editor** (`/dashboard/`).

## Local

```bash
npm run dev:cms
```

- Site: http://localhost:8125/
- Studio: http://localhost:8125/admin/ (or http://127.0.0.1:8081/admin/ when only CMS runs)
- API: http://127.0.0.1:8081/api/health

Local mode writes files on disk under `src/news/posts/` and `src/careers/jobs/`.

## Home Editor (homepage blocks)

- Local: http://127.0.0.1:8081/dashboard/ (or http://localhost:8125/dashboard/ with `npm run dev:cms`)
- Studio (news/jobs): /admin/ — unchanged
- Draft file: `src/_cms/home.draft.json` (not used by Eleventy)
- Published: `src/_data/home.json`

**Lưu nháp** writes the draft file only. It does not change the public homepage. **Xuất bản** copies the validated draft onto `src/_data/home.json` and triggers a rebuild (local Eleventy watch, or Vercel ~1–2 minutes in production). **Hủy nháp** restores the draft from the published file.

### UAT checklist

Tick in the PR / chat (not a product feature):

1. Reorder two blocks, publish, homepage order matches.
2. Hide a block, publish, omitted from HTML.
3. Edit VI/EN/ZH of hero title, publish, all three `.lang` spans update.
4. Replace about image, save draft — live still old image; publish — new image.
5. Add a milestone, publish, timeline has the new card.
6. Two tabs: second publish with old revision → 409 + reload copy.
7. Discard restores draft to published.
8. `/admin/` news create still works.
9. `npm run test:cms` green.
10. `npx @11ty/eleventy --quiet` green.

## Production (Railway → GitHub → Vercel)

1. Deploy this repo on **Railway** with start command `node scripts/admin-api.js`.
2. Set env vars from [`.env.example`](../../.env.example) (`GITHUB_TOKEN`, `GITHUB_REPO`, `ADMIN_USER`, `ADMIN_PASS`).
3. Give editors the Railway URLs:
   - Content Studio (news/jobs): `https://your-cms.up.railway.app/admin/`
   - Home Editor (homepage blocks): `https://your-cms.up.railway.app/dashboard/`
4. Publishing creates a GitHub commit → **Vercel** rebuilds the public site in ~1–2 minutes.

### GitHub token

Create a fine-grained PAT with **Contents: Read and write** on this repository only.

## Auth

If `ADMIN_USER` + `ADMIN_PASS` (or `ADMIN_TOKEN`) are set, the Studio shows a login screen.
