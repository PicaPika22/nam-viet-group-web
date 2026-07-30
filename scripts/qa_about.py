# -*- coding: utf-8 -*-
"""About page QA scorecard — functional + a11y smoke + layout."""
from __future__ import annotations

import json
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8125"
URL = f"{BASE}/about/"
OUT = Path(r"d:\Code\WEB\scripts\_qa_about_out")
OUT.mkdir(parents=True, exist_ok=True)

findings: list[dict] = []
scores: dict[str, dict] = {}


def note(sev: str, area: str, msg: str):
    findings.append({"severity": sev, "area": area, "msg": msg})
    print(f"[{sev.upper()}] {area}: {msg}")


def score(area: str, points: float, max_points: float, detail: str):
    scores[area] = {"points": points, "max": max_points, "detail": detail}
    print(f"[SCORE] {area}: {points}/{max_points} — {detail}")


def main():
    console_errors = []
    page_errors = []
    failed_requests = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: page_errors.append(str(e)))
        page.on(
            "requestfailed",
            lambda r: failed_requests.append(f"{r.failure} {r.url}"),
        )

        resp = page.goto(URL, wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(800)

        # --- Load / HTTP ---
        status = resp.status if resp else 0
        if status == 200:
            score("http", 10, 10, f"HTTP {status}")
        else:
            score("http", 0, 10, f"HTTP {status}")
            note("blocker", "http", f"Unexpected status {status}")

        # --- Console / JS ---
        noisy = [e for e in console_errors if "favicon" not in e.lower()]
        if page_errors:
            score("js", 0, 15, f"pageerror: {page_errors[0][:120]}")
            note("blocker", "js", page_errors[0][:200])
        elif noisy:
            score("js", 8, 15, f"console.error x{len(noisy)}")
            note("major", "js", noisy[0][:200])
        else:
            score("js", 15, 15, "No page/console errors")

        # Scroll sections so lazy images decode before asset check
        page.evaluate(
            """async () => {
              for (const id of ['overview','ecosystem','vision','leadership']) {
                document.getElementById(id)?.scrollIntoView();
                await new Promise((r) => setTimeout(r, 120));
              }
              window.scrollTo(0, 0);
            }"""
        )
        page.wait_for_timeout(400)

        if failed_requests:
            note("major", "network", f"Failed requests: {failed_requests[:5]}")
            score("assets", 5, 15, f"{len(failed_requests)} failed requests")
        else:
            broken = page.evaluate(
                """() => [...document.images]
                  .filter(img => !img.complete || img.naturalWidth === 0)
                  .map(img => img.currentSrc || img.src)"""
            )
            if broken:
                score("assets", 6, 15, f"{len(broken)} broken images")
                note("major", "assets", f"Broken: {broken[:5]}")
            else:
                score("assets", 15, 15, "Images load OK")

        # Leadership teaser geometry (About no longer embeds full strip)
        geom = page.evaluate(
            """() => {
              const teaser = document.querySelector('.leader-teaser');
              if (!teaser) return null;
              const faces = document.querySelectorAll('.leader-teaser__face').length;
              const h = Math.round(teaser.getBoundingClientRect().height);
              const hrefs = [...teaser.querySelectorAll('a')].map(a => a.getAttribute('href') || '');
              const allToPage = hrefs.length > 0 && hrefs.every(h => h.includes('/about/leadership'));
              return { h, faces, allToPage, ok: h > 180 && h < 1600 && faces >= 8 };
            }"""
        )
        if not geom:
            score("strip_layout", 0, 10, "No leader-teaser")
            note("blocker", "layout", "leader-teaser missing")
        elif not geom["ok"]:
            score("strip_layout", 0, 10, f"Broken teaser h={geom['h']} faces={geom['faces']}")
            note("blocker", "layout", f"Teaser layout broken h={geom['h']} faces={geom['faces']}")
        else:
            score("strip_layout", 10, 10, f"Teaser OK h={geom['h']} faces={geom['faces']}")

        # --- Structure / content ---
        struct = page.evaluate(
            """() => {
              const h1 = [...document.querySelectorAll('h1')].map(e => e.innerText.trim());
              const main = document.querySelector('main');
              const strip = document.querySelector('.leader-teaser, .leader-strip, [class*="leadership"]');
              const imgs = document.images.length;
              const overflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
              const bodyText = (document.body.innerText || '').length;
              const emptyMain = main ? (main.innerText || '').trim().length < 80 : true;
              // reveal stuck
              const stuck = [...document.querySelectorAll('.reveal')]
                .filter(el => getComputedStyle(el).opacity === '0')
                .map(el => el.id || el.className.slice(0, 40));
              // legacy strip rows (should be empty on About after teaser)
              const rows = [...document.querySelectorAll('.leader-strip__row')].map(row => ({
                cls: row.className,
                count: row.querySelectorAll('a').length,
                hrefs: [...row.querySelectorAll('a')].map(a => a.getAttribute('href'))
              }));
              const teaser = document.querySelector('.leader-teaser');
              const teaserFaces = document.querySelectorAll('.leader-teaser__face').length;
              const teaserHrefs = teaser
                ? [...teaser.querySelectorAll('a')].map(a => a.getAttribute('href') || '')
                : [];
              const teaserToPage = teaserHrefs.length > 0 && teaserHrefs.every(h => h.includes('/about/leadership'));
              const hasTeaser = !!teaser;
              const panels = [...document.querySelectorAll('[data-page-panel]')]
                .map(el => el.getAttribute('data-page-panel'));
              const subnav = [...document.querySelectorAll('[data-page-subnav] [data-subnav-target]')]
                .map(el => el.getAttribute('data-subnav-target'));
              const chapters = [...document.querySelectorAll('.about-section[data-chapter], .about-hero[data-chapter]')]
                .map(el => el.getAttribute('data-chapter'));
              const hasGroupPhoto = !!document.querySelector('#leadership .leader__media');
              const hasClose = !!document.querySelector('.about-close');
              const hasPillarLetters = !!document.querySelector('#vision .pillar__letter');
              const capacityInVision = !!document.querySelector('#vision .about-capacity, #vision .about-capacity-stats');
              const capacityInOverview = !!document.querySelector('#overview .about-capacity, #overview .about-capacity-stats');
              const hasBleedHero = !!document.querySelector('.about-hero--bleed');
              const hasChain = !!document.querySelector('.about-chain');
              return { h1, h1count: h1.length, imgs, overflow, bodyText, emptyMain, stuck: stuck.slice(0, 12), rows,
                hasTeaser, teaserFaces, teaserToPage,
                panels, subnav, chapters, hasGroupPhoto, hasClose, hasPillarLetters, capacityInVision, capacityInOverview,
                hasBleedHero, hasChain,
                title: document.title, hasHeader: !!document.querySelector('header'), hasFooter: !!document.querySelector('footer') };
            }"""
        )
        print("STRUCT", json.dumps(struct, ensure_ascii=False, indent=2)[:2000])

        pts = 15
        if struct["emptyMain"]:
            pts -= 10
            note("blocker", "content", "Main content nearly empty")
        if struct["h1count"] != 1:
            pts -= 4
            note("major", "a11y", f"h1 count={struct['h1count']}: {struct['h1'][:3]}")
        if not struct["hasHeader"] or not struct["hasFooter"]:
            pts -= 3
            note("major", "structure", "Missing header/footer")
        if struct["bodyText"] < 400:
            pts -= 5
            note("major", "content", f"Very little text ({struct['bodyText']} chars)")
        score("structure", max(pts, 0), 15, f"h1={struct['h1count']} text={struct['bodyText']} chars")

        # --- IA story order: overview → ecosystem → vision → leadership ---
        expected = ["overview", "ecosystem", "vision", "leadership"]
        panels = struct.get("panels") or []
        subnav = struct.get("subnav") or []
        ia_ok = panels == expected and subnav == expected
        if ia_ok and not struct.get("hasGroupPhoto") and struct.get("hasClose"):
            extra = ""
            if struct.get("hasBleedHero") and struct.get("hasChain"):
                score("ia_order", 10, 10, "DOM + subnav OK; bleed hero; chain; no group photo; close CTA")
            else:
                score("ia_order", 8, 10, f"Order OK bleed={struct.get('hasBleedHero')} chain={struct.get('hasChain')}")
                note("medium", "ia", f"Missing redesign cues bleed={struct.get('hasBleedHero')} chain={struct.get('hasChain')}")
        elif panels == expected and subnav == expected:
            score("ia_order", 7, 10, f"Order OK but photo={struct.get('hasGroupPhoto')} close={struct.get('hasClose')}")
            if struct.get("hasGroupPhoto"):
                note("major", "ia", "Leadership still has group photo module")
            if not struct.get("hasClose"):
                note("major", "ia", "Missing closing CTA band")
        else:
            score("ia_order", 0, 10, f"panels={panels} subnav={subnav}")
            note("blocker", "ia", f"Expected {expected}, got panels={panels} subnav={subnav}")

        if struct.get("hasPillarLetters") or struct.get("capacityInVision") or not struct.get("capacityInOverview"):
            note(
                "medium",
                "vision",
                f"pillarLetters={struct.get('hasPillarLetters')} capacityVision={struct.get('capacityInVision')} capacityOverview={struct.get('capacityInOverview')}",
            )
            score(
                "vision_layout",
                4,
                10,
                "Vision still form-like or capacity misplaced",
            )
        else:
            score("vision_layout", 10, 10, "VMV redesign + capacity in overview")

        # --- Leadership teaser (details live on /about/leadership/) ---
        rows = struct.get("rows") or []
        if rows:
            score("leadership", 5, 15, "Legacy strip still on About")
            note("major", "leadership", "About should use leader-teaser, not full strip")
        elif not struct.get("hasTeaser"):
            score("leadership", 0, 15, "No leader-teaser found")
            note("blocker", "leadership", "About missing leadership teaser")
        elif not struct.get("teaserToPage"):
            score("leadership", 6, 15, "Teaser links not pointing to leadership page")
            note("major", "leadership", "Teaser should route to /about/leadership/")
        elif (struct.get("teaserFaces") or 0) < 8:
            score("leadership", 10, 15, f"Teaser faces={struct.get('teaserFaces')}")
            note("medium", "leadership", "Expected ≥8 non-chairman faces in teaser")
        else:
            score("leadership", 15, 15, "Teaser OK — details on leadership page")

        # --- Layout / responsive ---
        page.screenshot(path=str(OUT / "about-desktop.png"), full_page=True)
        if struct["overflow"]:
            score("layout_desktop", 5, 10, "Horizontal overflow at 1440")
            note("major", "layout", "Desktop horizontal overflow")
        else:
            score("layout_desktop", 10, 10, "No overflow at 1440")

        # stuck reveals below fold are OK; stuck in first viewport is bad
        first_stuck = page.evaluate(
            """() => [...document.querySelectorAll('.reveal')]
              .filter(el => {
                const r = el.getBoundingClientRect();
                const op = getComputedStyle(el).opacity;
                return op === '0' && r.top < window.innerHeight * 0.9 && r.bottom > 40;
              }).map(el => el.id || el.className.slice(0,50))"""
        )
        if first_stuck:
            note("major", "motion", f"Reveal stuck invisible in viewport: {first_stuck[:5]}")
            score("motion", 3, 10, "Content stuck at opacity 0")
        else:
            score("motion", 10, 10, "Above-fold reveals visible")

        page.set_viewport_size({"width": 375, "height": 812})
        page.goto(URL, wait_until="networkidle")
        page.wait_for_timeout(500)
        mob = page.evaluate(
            """() => ({
              overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
              h1: document.querySelector('h1')?.innerText?.trim()?.slice(0,80)
            })"""
        )
        page.screenshot(path=str(OUT / "about-mobile.png"), full_page=True)
        if mob["overflow"]:
            score("layout_mobile", 4, 10, "Overflow at 375")
            note("medium", "layout", "Mobile horizontal overflow")
        else:
            score("layout_mobile", 10, 10, "No overflow at 375")

        # --- A11y smoke ---
        page.set_viewport_size({"width": 1440, "height": 900})
        page.goto(URL, wait_until="networkidle")
        a11y = page.evaluate(
            """() => {
              const issues = [];
              document.querySelectorAll('img:not([alt])').forEach(i => issues.push('img missing alt'));
              document.querySelectorAll('button').forEach(b => {
                if (!(b.getAttribute('aria-label') || b.innerText.trim())) issues.push('empty button');
              });
              const htmlLang = document.documentElement.lang;
              if (!htmlLang) issues.push('html lang missing');
              return issues;
            }"""
        )
        if a11y:
            score("a11y", 5, 10, f"{len(a11y)} issues")
            for i in a11y[:5]:
                note("medium", "a11y", i)
        else:
            score("a11y", 10, 10, "Smoke OK")

        browser.close()

    total = sum(s["points"] for s in scores.values())
    max_total = sum(s["max"] for s in scores.values())
    pct = round(100 * total / max_total) if max_total else 0

    report = {
        "url": URL,
        "score": pct,
        "points": f"{total}/{max_total}",
        "breakdown": scores,
        "findings": findings,
        "counts": {
            "blocker": sum(1 for f in findings if f["severity"] == "blocker"),
            "major": sum(1 for f in findings if f["severity"] == "major"),
            "medium": sum(1 for f in findings if f["severity"] == "medium"),
        },
    }
    (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n======== ABOUT SCORE ========")
    print(f"TOTAL: {pct}/100  ({total}/{max_total})")
    print(json.dumps(report["counts"], indent=2))
    print(f"Report: {OUT / 'report.json'}")
    return report


if __name__ == "__main__":
    main()
