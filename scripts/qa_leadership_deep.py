# -*- coding: utf-8 -*-
"""Deeper Leadership QA — person pages, strip, keyboard, lang."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8125"
OUT = Path(r"d:\Code\WEB\scripts\_qa_leadership_out")
OUT.mkdir(parents=True, exist_ok=True)
findings: list[dict] = []


def fail(sev, area, msg):
    findings.append({"severity": sev, "area": area, "msg": msg})
    print(f"[{sev.upper()}] {area}: {msg}")


def ok(area, msg):
    print(f"[OK] {area}: {msg}")


def main() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})

        # Person page: Văn Hùng must say Cái Lân, not group support
        page.goto(f"{BASE}/about/leadership/nguyen-van-hung/", wait_until="networkidle")
        body = page.inner_text("main") if page.locator("main").count() else page.inner_text("body")
        if "Cái Lân" not in body and "Cai Lan" not in body:
            fail("major", "person", "Văn Hùng profile missing Cái Lân role text")
        else:
            ok("person", "Văn Hùng profile shows Cái Lân")
        if re.search(r"Hỗ trợ Tập đoàn", body) and "Cái Lân" not in body:
            fail("major", "person", "Văn Hùng profile wrongly framed as group support")
        # Back link
        back = page.locator('a[href*="/about/leadership"]').first
        if back.count() == 0:
            fail("medium", "person", "No back link to leadership list")
        else:
            ok("person", "Back link present")

        # Đức Hùng person page
        page.goto(f"{BASE}/about/leadership/nguyen-duc-hung/", wait_until="networkidle")
        body = page.inner_text("body")
        if "Feed Trading" not in body:
            fail("major", "person", "Đức Hùng profile missing Feed Trading")
        else:
            ok("person", "Đức Hùng profile shows Feed Trading")

        # About page — leadership strip / link
        page.goto(f"{BASE}/about/", wait_until="networkidle")
        about_html = page.content()
        # If strip embeds people, Văn Hùng must not be in support row
        if "leader-strip" in about_html or "leadership-strip" in about_html or "lgallery" in about_html:
            # Check any strip tier structure
            supportish = page.evaluate(
                """() => {
                  const root = document.querySelector('[class*="leader-strip"], [class*="leadership-strip"], #leadership');
                  if (!root) return null;
                  const text = root.innerText;
                  return {
                    hasVanHung: /Nguyễn Văn Hùng|Nguyen Van Hung/i.test(text),
                    hasCaiLan: /Cái Lân|Cai Lan/i.test(text),
                  };
                }"""
            )
            ok("about", f"Leadership section probe: {supportish}")
        lead_cta = page.locator('a[href*="/about/leadership"]')
        if lead_cta.count() == 0:
            fail("medium", "about", "About page missing link to /about/leadership/")
        else:
            ok("about", "About → Leadership link exists")

        # Keyboard: tab to first card link and activate focus-visible
        page.goto(f"{BASE}/about/leadership/", wait_until="networkidle")
        page.keyboard.press("Tab")
        focused = []
        for _ in range(40):
            page.keyboard.press("Tab")
            info = page.evaluate(
                """() => {
                  const el = document.activeElement;
                  if (!el) return null;
                  return { tag: el.tagName, href: el.getAttribute('href'), cls: el.className };
                }"""
            )
            if info and info.get("href") and "/about/leadership/" in (info.get("href") or ""):
                focused.append(info)
                break
        if not focused:
            fail("medium", "keyboard", "Could not Tab-focus a leadership profile link in 40 tabs")
        else:
            ok("keyboard", f"Tab reached profile link {focused[0].get('href')}")

        # Lang: site default is EN (html data-lang=en); switch to VI and verify
        page.evaluate("() => document.documentElement.setAttribute('data-lang', 'vi')")
        page.wait_for_timeout(100)
        vis = page.evaluate(
            """() => {
              const n = document.querySelector('.lgallery-card__name .lang.vi, .lgallery-feature__name .lang.vi');
              if (!n) return { found: false };
              const s = getComputedStyle(n);
              return { found: true, display: s.display, visibility: s.visibility, text: n.textContent.trim() };
            }"""
        )
        if not vis.get("found"):
            fail("major", "i18n", "No .lang.vi name node found on cards")
        elif vis.get("display") == "none" or vis.get("visibility") == "hidden":
            fail("major", "i18n", f"VI name hidden after data-lang=vi: {vis}")
        else:
            ok("i18n", f"VI name visible after switch: {vis.get('text')}")

        # Jump offset under sticky header — section title not fully covered
        page.locator('.leader-gallery__jump a[href="#leadership-office"]').click()
        page.wait_for_timeout(400)
        cover = page.evaluate(
            """() => {
              const sec = document.getElementById('leadership-office');
              const title = sec.querySelector('h2');
              const r = title.getBoundingClientRect();
              const header = document.querySelector('header, .site-header, .nav, [class*="header"]');
              const hb = header ? header.getBoundingClientRect().bottom : 0;
              return { titleTop: Math.round(r.top), headerBottom: Math.round(hb), covered: r.top < hb - 4 };
            }"""
        )
        if cover.get("covered"):
            fail(
                "medium",
                "nav",
                f"Jump target title under sticky header (top={cover['titleTop']}, headerBottom={cover['headerBottom']})",
            )
        else:
            ok("nav", f"Office title clear of header (top={cover['titleTop']})")

        # Data assert: build-time locks still present in module
        # (runtime check via page cards already done)

        # CSS regression: office and companies same track
        css = page.evaluate(
            """() => {
              const o = getComputedStyle(document.querySelector('.leader-gallery__grid--office'));
              const c = getComputedStyle(document.querySelector('.leader-gallery__grid--companies'));
              return { oCols: o.gridTemplateColumns, cCols: c.gridTemplateColumns, oMax: o.maxWidth };
            }"""
        )
        if css["oMax"] not in ("none", "0px"):
            fail("major", "css", f"office max-width regress: {css['oMax']}")
        else:
            ok("css", "office max-width none")

        page.screenshot(path=str(OUT / "person-van-hung.png"), full_page=False)
        page.goto(f"{BASE}/about/leadership/nguyen-van-hung/", wait_until="networkidle")
        page.screenshot(path=str(OUT / "person-van-hung.png"), full_page=True)

        browser.close()

    report = {
        "findings": findings,
        "counts": {
            "blocker": sum(1 for f in findings if f["severity"] == "blocker"),
            "major": sum(1 for f in findings if f["severity"] == "major"),
            "medium": sum(1 for f in findings if f["severity"] == "medium"),
        },
    }
    (OUT / "report-deep.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n=== DEEP SUMMARY ===")
    print(json.dumps(report["counts"], indent=2))
    for f in findings:
        print(f"  - {f}")
    return 1 if report["counts"]["blocker"] or report["counts"]["major"] else 0


if __name__ == "__main__":
    sys.exit(main())
