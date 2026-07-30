"""
Normalize leadership portraits to the site standard:

  1800 × 2250 px  (4:5 portrait, hi-res)
  JPEG quality ~90, progressive
  Mild autocontrast (cutoff 1%) — no heavy skin-tone shifts

Crop is top-biased so faces stay in frame. Per-id centering overrides
can be set in CENTER_BY_ID.

Run:  python scripts/normalize_leadership_photos.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "assets" / "img" / "leadership"
OUT_W, OUT_H = 1800, 2250  # 4:5 hi-res
DEFAULT_CENTER = (0.5, 0.28)
JPEG_QUALITY = 90

# (x, y) in 0–1 for ImageOps.fit centering — tune eye-line / shoulders
CENTER_BY_ID: dict[str, tuple[float, float]] = {
    "ha-van-an": (0.5, 0.22),
    "nguyen-thi-nu": (0.5, 0.26),
    "hoang-thanh-phong": (0.48, 0.28),
    "nguyen-duc-hung": (0.5, 0.27),
    "nguyen-van-hung": (0.5, 0.26),
    "ha-van-huong": (0.5, 0.28),
    "nguyen-manh-ha": (0.5, 0.27),
    "le-van-mien": (0.5, 0.26),
    "pham-van-dung": (0.5, 0.28),
    "nguyen-manh-hai": (0.5, 0.27),
}


def normalize(path: Path) -> Path:
    stem = path.stem
    center = CENTER_BY_ID.get(stem, DEFAULT_CENTER)
    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        fitted = ImageOps.fit(
            im,
            (OUT_W, OUT_H),
            method=Image.Resampling.LANCZOS,
            centering=center,
        )
        # Mild tonal unify — cutoff keeps skin from crushing
        fitted = ImageOps.autocontrast(fitted, cutoff=1)
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
    print(f"  {dest.name}: {OUT_W}x{OUT_H} center={center}")
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
    print(f"Normalizing {len(files)} portraits -> {OUT_W}x{OUT_H} (4:5)")
    for path in files:
        normalize(path)
    print("Done.")


if __name__ == "__main__":
    main()
