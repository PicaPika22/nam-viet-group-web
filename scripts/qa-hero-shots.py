"""Capture hero screenshots at desktop/tablet/mobile for design review."""
import pathlib

from playwright.sync_api import sync_playwright

URL = "http://localhost:8125/"
OUT = pathlib.Path(__file__).parent / "_qa_hero_out"
OUT.mkdir(exist_ok=True)

VIEWPORTS = [
    ("desktop", 1440, 900, "en"),
    ("desktop-vi", 1440, 900, "vi"),
    ("wide-vi", 1920, 1000, "vi"),
    ("tablet", 834, 1112, "vi"),
    ("mobile", 390, 844, "vi"),
]


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for name, width, height, lang in VIEWPORTS:
            page = browser.new_page(viewport={"width": width, "height": height})
            page.add_init_script(f"localStorage.setItem('nv-lang', '{lang}')")
            page.goto(URL, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(2200)
            page.evaluate(
                "document.getElementById('loader')?.remove();"
                "document.getElementById('cookieBar')?.remove()"
            )
            page.wait_for_timeout(1200)
            page.screenshot(path=str(OUT / f"hero-{name}.png"))
            hero = page.locator("#hero")
            hero.screenshot(path=str(OUT / f"hero-{name}-section.png"))
            box = hero.bounding_box()
            print(name, box)
            page.close()
        browser.close()


if __name__ == "__main__":
    main()
