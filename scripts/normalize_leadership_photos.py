"""
Normalize leadership portraits to the site standard:

  900 × 1200 px  (3:4 portrait)
  JPEG quality ~86, progressive

Crop is top-biased so faces stay in frame when source ratios differ.
Run:  python scripts/normalize_leadership_photos.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "assets" / "img" / "leadership"
OUT_W, OUT_H = 900, 1200
# Bias crop toward the upper third (typical headshot framing)
CENTER = (0.5, 0.28)
JPEG_QUALITY = 86


def normalize(path: Path) -> Path:
    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        fitted = ImageOps.fit(
            im,
            (OUT_W, OUT_H),
            method=Image.Resampling.LANCZOS,
            centering=CENTER,
        )
        dest = path.with_suffix(".jpg")
        fitted.save(
            dest,
            "JPEG",
            quality=JPEG_QUALITY,
            optimize=True,
            progressive=True,
        )
    if dest != path and path.exists():
        path.unlink()
    print(f"  {dest.name}: {OUT_W}x{OUT_H}")
    return dest


def main() -> None:
    files = sorted(
        p
        for p in SRC.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )
    if not files:
        print(f"No images in {SRC}")
        return
    print(f"Normalizing {len(files)} portraits -> {OUT_W}x{OUT_H} (3:4)")
    for path in files:
        normalize(path)
    print("Done.")


if __name__ == "__main__":
    main()
