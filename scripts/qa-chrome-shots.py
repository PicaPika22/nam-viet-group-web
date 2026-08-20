"""Capture header + footer chrome for design review. Do not commit output."""
import pathlib

from playwright.sync_api import sync_playwright

URL = "http://localhost:8125/"
OUT = pathlib.Path(__file__).parent / "_qa_chrome_out"
OUT.mkdir(exist_ok=True)

VIEWPORTS = [
    ("desktop", 1440, 900),
    ("tablet", 834, 1112),
    ("mobile", 390, 844),
]


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for name, width, height in VIEWPORTS:
            page = browser.new_page(viewport={"width": width, "height": height})
            page.add_init_script("localStorage.setItem('nv-lang', 'vi')")
            page.goto(URL, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(1800)
            page.evaluate(
                "document.getElementById('loader')?.remove();"
                "document.getElementById('cookieBar')?.remove()"
            )
            page.wait_for_timeout(600)
            page.locator("#header").screenshot(path=str(OUT / f"header-{name}.png"))
            footer = page.locator(".footer")
            footer.scroll_into_view_if_needed()
            page.wait_for_timeout(400)
            footer.screenshot(path=str(OUT / f"footer-{name}.png"))
            print(name, "header", page.locator("#header").bounding_box())
            print(name, "footer", footer.bounding_box())
            page.close()
        browser.close()


if __name__ == "__main__":
    main()
