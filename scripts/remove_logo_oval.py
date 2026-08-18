# -*- coding: utf-8 -*-
"""Knock the ring/oval stroke out of the NV-JSC seal, leaving the lion,
crown, globe and text on a fully transparent disc (matches the mockup's
"glow disc, no ring" emblem). Re-applies the square-plate cutout from
clean_logo_bg.py first, always starting from _backup-original/ so this is
re-runnable without compounding.
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


def clean_dark_plate(im: Image.Image) -> Image.Image:
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


def clean_light_plate(im: Image.Image) -> Image.Image:
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


def _cluster(vals: list[int]) -> list[tuple[int, int]]:
    vals = sorted(vals)
    clusters: list[tuple[int, int]] = []
    cur = [vals[0]]
    for v in vals[1:]:
        if v - cur[-1] <= 2:
            cur.append(v)
        else:
            clusters.append((cur[0], cur[-1]))
            cur = [v]
    clusters.append((cur[0], cur[-1]))
    return clusters


def _find_ellipse(im: Image.Image, is_fg):
    """Fit the seal's outer ring from the extreme foreground pixels on the
    image's center row/column — the ring is the outermost shape, so its
    stroke gives the first and last cluster on each centerline."""
    w, h = im.size
    cy, cx = h // 2, w // 2
    row = [im.getpixel((x, cy)) for x in range(w)]
    fg_xs = [x for x, (r, g, b, a) in enumerate(row) if is_fg(r, g, b, a)]
    col = [im.getpixel((cx, y)) for y in range(h)]
    fg_ys = [y for y, (r, g, b, a) in enumerate(col) if is_fg(r, g, b, a)]
    left, right = _cluster(fg_xs)[0], _cluster(fg_xs)[-1]
    top, bottom = _cluster(fg_ys)[0], _cluster(fg_ys)[-1]
    ccx = ((left[0] + left[1]) / 2 + (right[0] + right[1]) / 2) / 2
    ccy = ((top[0] + top[1]) / 2 + (bottom[0] + bottom[1]) / 2) / 2
    rx = ((right[0] + right[1]) / 2 - (left[0] + left[1]) / 2) / 2
    ry = ((bottom[0] + bottom[1]) / 2 - (top[0] + top[1]) / 2) / 2
    thickness_x = left[1] - left[0] + 1
    thickness_y = top[1] - top[0] + 1
    return ccx, ccy, rx, ry, thickness_x, thickness_y


def knockout_ring(im: Image.Image, is_fg) -> Image.Image:
    ccx, ccy, rx, ry, tx, ty = _find_ellipse(im, is_fg)
    # Half-thickness in normalized ellipse units, generous by 90% so the
    # anti-aliased edge of the stroke (blended toward the background color,
    # not caught by the strict foreground color test) is fully cleared —
    # any alpha in this band is the ring, since the lion/globe/crown sit
    # well inside it with margin.
    half_band = max(tx / rx, ty / ry) * 1.6
    band_in, band_out = 1 - half_band, 1 + half_band
    px = im.load()
    w, h = im.size
    for y in range(h):
        dy = (y - ccy) / ry
        dy2 = dy * dy
        for x in range(w):
            dx = (x - ccx) / rx
            d = (dx * dx + dy2) ** 0.5
            if band_in <= d <= band_out:
                r, g, b, a = px[x, y]
                if a > 0:
                    px[x, y] = (r, g, b, 0)
    print(f"  ellipse center=({ccx:.0f},{ccy:.0f}) rx={rx:.0f} ry={ry:.0f} band=[{band_in:.3f},{band_out:.3f}]")
    return im


def recenter(im: Image.Image) -> Image.Image:
    """The seal (lion/crown/globe/text) was drawn off-center inside the
    square canvas — fine while the oval framed it, but with the oval gone
    the cluster reads as floating, lopsided, inside the round glow behind
    it. Re-center its bounding box on the canvas."""
    bbox = im.getbbox()
    if bbox is None:
        return im
    l, t, r, b = bbox
    w, h = im.size
    dx = round(w / 2 - (l + r) / 2)
    dy = round(h / 2 - (t + b) / 2)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.paste(im, (dx, dy), im)
    print(f"  recentered by dx={dx} dy={dy} (bbox was {bbox})")
    return canvas


def is_navy(r: int, g: int, b: int, a: int) -> bool:
    return a > 0 and r < 80 and g < 90 and b < 110


def is_cream(r: int, g: int, b: int, a: int) -> bool:
    return a > 0 and r > 180 and g > 180 and b > 160


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


def process(name: str, clean_plate, is_fg) -> None:
    src = BACKUP / name
    im = Image.open(src).convert("RGBA")
    im = clean_plate(im)
    print(f"{name}:")
    im = knockout_ring(im, is_fg)
    im = recenter(im)
    save_replace(im, SRC / name)
    if SITE.exists():
        save_replace(im, SITE / name)
    print(f"  done, corner={im.getpixel((0, 0))}")


def main() -> None:
    process("logo.png", clean_dark_plate, is_navy)
    process("logo-light.png", clean_light_plate, is_cream)


if __name__ == "__main__":
    main()
