# Task 6 Report — Dashboard UI

## Status

Implemented the independent Home Editor dashboard in `src/dashboard/` with the required three-column block list, multilingual form, timeline editor, image uploads, draft workflow, and scaled live-style preview.

## Delivered

- Login gate using the shared `nv_studio_auth` session key and Studio-compatible API base detection.
- Twelve draggable, selectable, visibility-controlled Home sections.
- VI / EN / 中文 content editing from copied browser-safe schema constants.
- Fixed-count stat, flow, check, product, and partner editing without exposing IDs or hrefs.
- Section, product, partner, banner, and milestone image uploads. Uploaded URLs remain in memory until **Lưu nháp**.
- Milestone add/delete/reorder controls with client-generated `m-...` IDs.
- Optimistic revision handling for save, publish, and discard, including 409 reloads and 400 field-level validation.
- Preview renderers using the public homepage class names, active editor language, uploaded images, and required map/news/ESG placeholders.
- Responsive dashboard styling, keyboard focus states, reduced-motion support, and unsaved-change protection.

## Verification

- `node --check src/dashboard/dashboard.js` — passed.
- `node --check src/dashboard/preview.js` — passed.
- `npm run test:cms` — 34/34 tests passed.
- `npm run build` — passed; Eleventy copied the dashboard assets.
- HTTP smoke check — `/dashboard/` returned 200 and `/api/health` returned local mode.
- IDE lint check — no errors in the four dashboard files.
- Static self-review confirmed no href input is present.

## Self-review

- The dashboard limits mutations to the requested schema-backed content and preserves locked CTA/product/partner URLs.
- Publish is disabled while local edits are unsaved, preventing accidental publication of a stale server draft.
- Direct port 8081 loads homepage styles from the health endpoint's `siteUrl` (localhost:8125 fallback), while retaining the required `/css/style.css` link.
- Validation navigates to the first affected section/language before placing the server message beside matching `data-path` inputs.

## Concern

A full visual/interactivity browser UAT was not completed because the available Playwright CLI had no browser binary installed. The long `npm run dev:cms` session did start successfully and endpoint smoke checks passed.
