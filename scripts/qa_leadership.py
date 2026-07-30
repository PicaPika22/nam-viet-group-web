# -*- coding: utf-8 -*-
"""Leadership page QA — band locks, card sizes, links, a11y smoke, console."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8125"
URL = f"{BASE}/about/leadership/"
OUT = Path(r"d:\Code\WEB\scripts\_qa_leadership_out")
OUT.mkdir(parents=True, exist_ok=True)

SUPPORT_IDS = ["nguyen-thi-nu", "hoang-thanh-phong", "le-van-mien"]
MEMBER_IDS = [
    "ha-van-huong",
    "nguyen-manh-ha",
    "pham-van-dung",
    "nguyen-manh-hai",
    "nguyen-duc-hung",
    "nguyen-van-hung",
]
FORBIDDEN_IN_SUPPORT = ["nguyen-van-hung", "nguyen-duc-hung"]

findings: list[dict] = []


def fail(sev: str, area: str, msg: str, **extra):
    findings.append({"severity": sev, "area": area, "msg": msg, **extra})
    print(f"[{sev.upper()}] {area}: {msg}")


def ok(area: str, msg: str):
    print(f"[OK] {area}: {msg}")


def ids_in_section(page, section_sel: str) -> list[str]:
    hrefs = page.locator(f"{section_sel} a.lgallery-card__link, {section_sel} a.lgallery-feature__link").evaluate_all(
        "els => els.map(e => e.getAttribute('href') || '')"
    )
    out = []
    for h in hrefs:
        m = re.search(r"/about/leadership/([a-z0-9-]+)/?", h)
        if m:
            out.append(m.group(1))
    return out


def main() -> int:
    console_errors: list[str] = []
    page_errors: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900}, locale="vi-VN")
        page = context.new_page()
        page.on(
            "console",
            lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
        )
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        page.goto(URL, wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(500)

        # --- Band membership ---
        office = ids_in_section(page, "#leadership-office")
        companies = ids_in_section(page, "#leadership-companies")
        chairman = ids_in_section(page, "#leadership-chairman")

        if chairman != ["ha-van-an"]:
            fail("blocker", "band", f"Chairman expected [ha-van-an], got {chairman}")
        else:
            ok("band", "Chairman = Hà Văn An")

        if office != SUPPORT_IDS:
            fail("blocker", "band", f"Support expected {SUPPORT_IDS}, got {office}")
        else:
            ok("band", f"Support = {office}")

        for bad in FORBIDDEN_IN_SUPPORT:
            if bad in office:
                fail("blocker", "band", f"{bad} MUST NOT be in Hỗ trợ Tập đoàn")

        if sorted(companies) != sorted(MEMBER_IDS):
            fail("blocker", "band", f"Members expected {MEMBER_IDS}, got {companies}")
        else:
            ok("band", f"Members include Văn Hùng + Đức Hùng ({len(companies)} người)")

        # Labels on cards
        for bad in FORBIDDEN_IN_SUPPORT:
            card = page.locator(f'#leadership-office a[href*="{bad}"]')
            if card.count():
                fail("blocker", "band", f"{bad} still rendered under #leadership-office")

        van = page.locator('#leadership-companies a[href*="nguyen-van-hung"]')
        if van.count() == 0:
            fail("blocker", "band", "Nguyễn Văn Hùng missing from member companies")
        else:
            label = van.locator(".lgallery-card__group .lang.vi").inner_text()
            if "thành viên" not in label.lower():
                fail("major", "band", f"Văn Hùng label wrong: {label!r}")
            else:
                ok("band", "Văn Hùng label = Công ty thành viên")

        # --- Card size parity (desktop 3-col) ---
        sizes = page.evaluate(
            """() => {
              const w = (sel) => [...document.querySelectorAll(sel)]
                .map(el => Math.round(el.getBoundingClientRect().width));
              return {
                office: w('#leadership-office .lgallery-card'),
                companies: w('#leadership-companies .lgallery-card'),
                officeMax: getComputedStyle(document.querySelector('.leader-gallery__grid--office')).maxWidth,
              };
            }"""
        )
        if sizes["officeMax"] not in ("none", "0px"):
            fail("major", "layout", f"Office grid still has max-width={sizes['officeMax']}")
        ow, cw = sizes["office"], sizes["companies"]
        if not ow or not cw:
            fail("blocker", "layout", f"Missing card widths office={ow} companies={cw}")
        elif abs(ow[0] - cw[0]) > 2:
            fail("major", "layout", f"Card width mismatch office={ow[0]} vs companies={cw[0]}")
        else:
            ok("layout", f"Card widths match ({ow[0]}px), max-width={sizes['officeMax']}")

        page.screenshot(path=str(OUT / "desktop-full.png"), full_page=True)

        # --- Jump nav ---
        for href, expect_id in [
            ("#leadership-chairman", "leadership-chairman"),
            ("#leadership-office", "leadership-office"),
            ("#leadership-companies", "leadership-companies"),
        ]:
            page.locator(f'.leader-gallery__jump a[href="{href}"]').click()
            page.wait_for_timeout(300)
            visible = page.locator(f"#{expect_id}").evaluate(
                "el => el.getBoundingClientRect().top < window.innerHeight && el.getBoundingClientRect().bottom > 0"
            )
            if not visible:
                fail("medium", "nav", f"Jump {href} did not bring section into view")
            else:
                ok("nav", f"Jump {href} OK")

        # --- Profile links (sample) ---
        for pid in ["ha-van-an", "nguyen-van-hung", "nguyen-thi-nu"]:
            resp = page.request.get(f"{BASE}/about/leadership/{pid}/")
            if resp.status != 200:
                fail("major", "links", f"/{pid}/ status {resp.status}")
            else:
                body = resp.text()
                if pid.replace("-", " ") not in body.lower() and pid not in body:
                    # soft check — name may be i18n
                    pass
                ok("links", f"/{pid}/ → 200")

        # Broken images in gallery
        broken_imgs = page.evaluate(
            """() => [...document.querySelectorAll('.leader-gallery img')]
              .filter(img => !img.complete || img.naturalWidth === 0)
              .map(img => img.src)"""
        )
        if broken_imgs:
            fail("major", "media", f"Broken images: {broken_imgs}")
        else:
            ok("media", "All gallery images loaded")

        # --- Mobile 375 ---
        page.set_viewport_size({"width": 375, "height": 812})
        page.goto(URL, wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(400)
        overflow = page.evaluate(
            "() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2"
        )
        if overflow:
            fail("medium", "responsive", "Horizontal overflow at 375px")
        else:
            ok("responsive", "No horizontal overflow at 375px")

        mobile_office = ids_in_section(page, "#leadership-office")
        if mobile_office != SUPPORT_IDS:
            fail("blocker", "band", f"Mobile support IDs wrong: {mobile_office}")
        else:
            ok("band", "Mobile band membership OK")

        page.screenshot(path=str(OUT / "mobile-full.png"), full_page=True)

        # --- A11y smoke ---
        page.set_viewport_size({"width": 1440, "height": 900})
        page.goto(URL, wait_until="networkidle", timeout=60000)
        a11y = page.evaluate(
            """() => {
              const issues = [];
              const h1 = document.querySelectorAll('h1');
              if (h1.length !== 1) issues.push(`h1 count=${h1.length}`);
              document.querySelectorAll('.leader-gallery img').forEach(img => {
                if (!img.getAttribute('alt') && img.getAttribute('alt') !== '') {
                  issues.push('img missing alt: ' + (img.src||'').slice(-40));
                }
              });
              document.querySelectorAll('a.lgallery-card__link').forEach(a => {
                if (!a.getAttribute('href')) issues.push('card link without href');
              });
              const office = document.getElementById('leadership-office');
              const companies = document.getElementById('leadership-companies');
              if (!office || !companies) issues.push('missing band section ids');
              return issues;
            }"""
        )
        for issue in a11y:
            fail("medium", "a11y", issue)
        if not a11y:
            ok("a11y", "Smoke checks passed (1 h1, alts, section ids)")

        # Sticky titles / empty grids
        empty_office = page.locator("#leadership-office .lgallery-card").count()
        empty_comp = page.locator("#leadership-companies .lgallery-card").count()
        if empty_office != 3:
            fail("blocker", "render", f"Office cards count={empty_office} expected 3")
        if empty_comp != 6:
            fail("blocker", "render", f"Company cards count={empty_comp} expected 6")

        # Console
        noisy = [e for e in console_errors if "favicon" not in e.lower()]
        if page_errors:
            fail("major", "console", f"pageerror: {page_errors[:3]}")
        if noisy:
            fail("medium", "console", f"console.error x{len(noisy)}: {noisy[0][:120]}")
        else:
            ok("console", "No page errors")

        browser.close()

    report = {
        "url": URL,
        "findings": findings,
        "counts": {
            "blocker": sum(1 for f in findings if f["severity"] == "blocker"),
            "major": sum(1 for f in findings if f["severity"] == "major"),
            "medium": sum(1 for f in findings if f["severity"] == "medium"),
        },
    }
    (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n=== SUMMARY ===")
    print(json.dumps(report["counts"], indent=2))
    print(f"Report: {OUT / 'report.json'}")
    return 1 if report["counts"]["blocker"] or report["counts"]["major"] else 0


if __name__ == "__main__":
    sys.exit(main())
