# -*- coding: utf-8 -*-
"""Install the official NV-JSC oval seal (lion + globe + red ring).

Reads the uploaded source, knocks out fringe outside the red oval, and
writes logo.png + logo-light.png (same full-color seal on both).
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
ASSETS = ROOT / "assets" / "img"
BACKUP = ROOT / "_backup-original"

SOURCE_CANDIDATES = [
    BACKUP / "logo-seal.png",
    Path(
        r"C:\Users\CUONG_IVNSEC\.cursor\projects\d-Code-WEB\assets"
        r"\c__Users_CUONG_IVNSEC_AppData_Roaming_Cursor_User_workspaceStorage"
        r"_76c77f96463f479016e59a703d34bd4d_images"
        r"_logo-b441a7da-6f23-4211-acbb-7ef46f2a8c29.png"
    ),
]


def save_replace(im: Image.Image, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
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


def find_source() -> Path:
    for p in SOURCE_CANDIDATES:
        if p.exists():
            return p
    raise SystemExit("logo source not found")


def is_ring(r: int, g: int, b: int, a: int) -> bool:
    return a >= 160 and r >= 140 and r > g + 35 and r > b + 30


def fit_ellipse(im: Image.Image) -> tuple[float, float, float, float]:
    px = im.load()
    w, h = im.size
    xs: list[int] = []
    ys: list[int] = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_ring(r, g, b, a):
                xs.append(x)
                ys.append(y)
    if not xs:
        raise SystemExit("no red oval pixels found")
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    cx = (minx + maxx) / 2
    cy = (miny + maxy) / 2
    rx = (maxx - minx) / 2 * 1.02
    ry = (maxy - miny) / 2 * 1.02
    return cx, cy, rx, ry


def clean_seal(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    cx, cy, rx, ry = fit_ellipse(im)
    px = im.load()
    w, h = im.size
    rx2 = rx * rx
    ry2 = ry * ry
    for y in range(h):
        dy = y - cy
        dy2 = dy * dy / ry2
        for x in range(w):
            r, g, b, a = px[x, y]
            dx = x - cx
            d2 = dx * dx / rx2 + dy2
            if d2 > 1.04 or a < 18:
                px[x, y] = (0, 0, 0, 0)
            elif d2 > 0.92 and a < 90 and r < 80:
                # leftover dark fringe just outside the stroke
                px[x, y] = (0, 0, 0, 0)
    bbox = im.getbbox()
    if bbox is None:
        return im
    pad = 6
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(w, r + pad)
    b = min(h, b + pad)
    cropped = im.crop((l, t, r, b))
    print(f"  ellipse cx={cx:.1f} cy={cy:.1f} rx={rx:.1f} ry={ry:.1f}")
    print(f"  cropped {im.size} -> {cropped.size}")
    return cropped


def write_all(im: Image.Image) -> None:
    dests = [SRC / "logo.png", SRC / "logo-light.png"]
    if ASSETS.exists():
        dests += [ASSETS / "logo.png", ASSETS / "logo-light.png"]
    if SITE.exists():
        dests += [SITE / "logo.png", SITE / "logo-light.png"]
    for dest in dests:
        save_replace(im, dest)
        print(f"  wrote {dest}")


def main() -> None:
    src = find_source()
    BACKUP.mkdir(parents=True, exist_ok=True)
    bak = BACKUP / "logo-seal.png"
    if src.resolve() != bak.resolve():
        shutil.copyfile(src, bak)
        print(f"backed up -> {bak}")
    im = clean_seal(Image.open(src))
    write_all(im)
    sample = im.getpixel((im.size[0] // 2, im.size[1] // 2))
    print(f"center={sample} corner={im.getpixel((0, 0))}")


if __name__ == "__main__":
    main()
