# -*- coding: utf-8 -*-
"""Make logo PNGs true cutouts (no square plate behind the seal).

Uses backups in _backup-original/ when present.
"""
from __future__ import annotations

import os
import shutil
import time
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "assets" / "img"
SITE = ROOT / "_site" / "assets" / "img"
BACKUP = ROOT / "_backup-original"


def clean_dark_logo(im: Image.Image) -> Image.Image:
    """logo.png — navy seal on cream/paper plate → transparent plate + fill."""
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
            chroma = max(r, g, b) - min(r, g, b)
            if luma >= 195 and chroma <= 45:
                px[x, y] = (r, g, b, 0)
            elif luma >= 175 and chroma <= 30 and a < 255:
                px[x, y] = (r, g, b, 0)
    return im


def clean_light_logo(im: Image.Image) -> Image.Image:
    """logo-light.png — light seal on navy plate → transparent plate."""
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
            if luma <= 55 and b >= r - 5 and b >= g - 5:
                px[x, y] = (r, g, b, 0)
            elif luma <= 70 and max(r, g, b) <= 90 and b >= r and b >= g and a < 255:
                px[x, y] = (r, g, b, 0)
    return im


def save_replace(im: Image.Image, dest: Path) -> None:
    tmp = dest.with_suffix(dest.suffix + ".tmp.png")
    im.save(tmp, "PNG", optimize=True)
    for _ in range(8):
        try:
            os.replace(tmp, dest)
            return
        except OSError:
            time.sleep(0.35)
    shutil.copyfile(tmp, dest)
    tmp.unlink(missing_ok=True)


def process(name: str, cleaner) -> None:
    bak = BACKUP / name
    src = bak if bak.exists() else SRC / name
    im = cleaner(Image.open(src).convert("RGBA"))
    save_replace(im, SRC / name)
    if SITE.exists():
        save_replace(im, SITE / name)
    print(f"{name}: corner={im.getpixel((0, 0))}")


def main() -> None:
    process("logo.png", clean_dark_logo)
    process("logo-light.png", clean_light_logo)


if __name__ == "__main__":
    main()
