"""Download and normalize partner logos for the homepage marquee."""
from __future__ import annotations

import io
import json
import time
from pathlib import Path
from urllib.parse import quote

import requests
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "src" / "_data" / "partners.json").read_text(encoding="utf-8"))
OUT = ROOT / "src" / "assets" / "img" / "partners"
OUT.mkdir(parents=True, exist_ok=True)

CANVAS = (280, 120)
MAX = (244, 84)
UA = {"User-Agent": "NamVietBot/1.0 (contact@namvietgroup.vn)"}

# Wikimedia raster via Special:FilePath, or direct PNG URLs
SOURCES = {
    "bunge": "https://commons.wikimedia.org/wiki/Special:FilePath/Bunge-Limited-Logo.svg?width=320",
    "cargill": "https://commons.wikimedia.org/wiki/Special:FilePath/Cargill_logo.svg?width=320",
    "ajinomoto": "https://commons.wikimedia.org/wiki/Special:FilePath/Ajinomoto_logo.svg?width=320",
    "wilmar": "https://commons.wikimedia.org/wiki/Special:FilePath/Wilmar%20International%20Logo.svg?width=320",
    "andritz": "https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20Andritz%20Hydro.svg?width=320",
    "cj": "https://commons.wikimedia.org/wiki/Special:FilePath/CJ%20logo.svg?width=320",
    "anderson": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Anderson-Logo-No-Tag.webp",
    "van-aarsen": "https://vanaarsen.com/wp-content/uploads/2024/09/logo.png",
    "olmix": "https://images.seeklogo.com/logo-png/23/1/olmix-logo-png_seeklogo-235785.png",
}


def fetch(url: str) -> bytes | None:
    try:
        r = requests.get(url, timeout=30, headers=UA, allow_redirects=True)
        r.raise_for_status()
        ctype = r.headers.get("content-type", "")
        if "image" not in ctype and "svg" not in ctype:
            return None
        return r.content
    except Exception as exc:  # noqa: BLE001
        print(f"  fetch failed {url}: {exc}")
        return None


def normalize(raw: bytes) -> Image.Image:
    img = Image.open(io.BytesIO(raw)).convert("RGBA")
    img = ImageOps.contain(img, MAX, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", CANVAS, (255, 255, 255, 0))
    x = (CANVAS[0] - img.width) // 2
    y = (CANVAS[1] - img.height) // 2
    canvas.paste(img, (x, y), img)
    return canvas


def main() -> None:
    for partner in DATA:
        pid = partner["id"]
        dest = OUT / f"{pid}.png"
        url = SOURCES.get(pid, "")
        fallbacks = []
        if pid == "van-aarsen":
            fallbacks = [
                "https://commons.wikimedia.org/wiki/Special:FilePath/Van%20Aarsen%20logo.png?width=320",
            ]
        raw = fetch(url) if url else None
        for fb in fallbacks:
            if raw:
                break
            raw = fetch(fb)
        if not raw:
            print(f"{pid}: SKIPPED")
            continue
        out = normalize(raw)
        out.save(dest, "PNG", optimize=True)
        print(f"{pid}: saved {dest.name} ({out.size[0]}x{out.size[1]})")
        time.sleep(0.35)


if __name__ == "__main__":
    main()
