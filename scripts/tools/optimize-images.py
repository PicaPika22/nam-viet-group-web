#!/usr/bin/env python3
"""
Batch image optimizer for Nam Viet Group website assets.
Lossless/smart compression in-place to drastically reduce page weight while
preserving exact file paths and visual quality.
"""

import os
import sys
from pathlib import Path
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
IMG_DIR = ROOT_DIR / "src" / "assets" / "img"

def get_max_dimension(rel_path: str) -> int:
    """Return ideal max dimension based on where the asset is displayed."""
    rel = rel_path.lower().replace("\\", "/")
    if "leadership" in rel:
        return 800  # Portraits are displayed at max ~300-400px
    if "milestones" in rel:
        return 1200 # Timeline cards are displayed at max ~450px
    if "hero" in rel or "rect-02" in rel:
        return 1920 # Full-screen banners
    return 1600     # General sector / content images

import time

def safe_replace(temp_path: Path, target_path: Path):
    for i in range(10):
        try:
            temp_path.replace(target_path)
            return
        except PermissionError:
            time.sleep(0.25)
    # Fallback: copy bytes
    with open(temp_path, "rb") as f_in, open(target_path, "wb") as f_out:
        f_out.write(f_in.read())
    temp_path.unlink(missing_ok=True)

def optimize_jpeg(file_path: Path, max_dim: int) -> tuple[int, int]:
    orig_size = file_path.stat().st_size
    with Image.open(file_path) as orig_img:
        img = orig_img.convert("RGB").copy()
    
    w, h = img.size
    if max(w, h) > max_dim:
        ratio = max_dim / max(w, h)
        new_w, new_h = int(w * ratio), int(h * ratio)
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    temp_path = file_path.with_suffix(".tmp.jpg")
    img.save(temp_path, "JPEG", quality=84, optimize=True, progressive=True)
    img.close()
    
    new_size = temp_path.stat().st_size
    if new_size < orig_size:
        safe_replace(temp_path, file_path)
        return orig_size, new_size
    else:
        temp_path.unlink(missing_ok=True)
        return orig_size, orig_size

def optimize_png(file_path: Path, max_dim: int) -> tuple[int, int]:
    orig_size = file_path.stat().st_size
    with Image.open(file_path) as orig_img:
        img = orig_img.copy()
        
    w, h = img.size
    if max(w, h) > max_dim:
        ratio = max_dim / max(w, h)
        new_w, new_h = int(w * ratio), int(h * ratio)
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    temp_path = file_path.with_suffix(".tmp.png")
    
    # Check if alpha is present
    has_alpha = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    
    if not has_alpha and orig_size > 1024 * 1024:
        # Continuous-tone photo saved as PNG: quantize to 256 colors palette
        quantized = img.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
        quantized.save(temp_path, "PNG", optimize=True)
        quantized.close()
    elif has_alpha and orig_size > 1024 * 1024:
        quantized = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
        quantized.save(temp_path, "PNG", optimize=True)
        quantized.close()
    else:
        img.save(temp_path, "PNG", optimize=True)
        
    img.close()
    new_size = temp_path.stat().st_size
    if new_size < orig_size:
        safe_replace(temp_path, file_path)
        return orig_size, new_size
    else:
        temp_path.unlink(missing_ok=True)
        return orig_size, orig_size

def main():
    if not IMG_DIR.exists():
        print(f"Error: Directory {IMG_DIR} does not exist.")
        sys.exit(1)
        
    print(f"Scanning {IMG_DIR} for images > 1MB...")
    large_files = []
    for root, _, files in os.walk(IMG_DIR):
        for f in files:
            p = Path(root) / f
            ext = p.suffix.lower()
            if ext in (".jpg", ".jpeg", ".png"):
                size = p.stat().st_size
                if size >= 1024 * 1024:
                    large_files.append(p)
                    
    print(f"Found {len(large_files)} images >= 1MB to optimize.\n")
    total_orig = 0
    total_new = 0
    
    for p in sorted(large_files):
        rel = p.relative_to(ROOT_DIR)
        max_dim = get_max_dimension(str(rel))
        ext = p.suffix.lower()
        
        if ext in (".jpg", ".jpeg"):
            orig_s, new_s = optimize_jpeg(p, max_dim)
        elif ext == ".png":
            orig_s, new_s = optimize_png(p, max_dim)
        else:
            continue
            
        saved_pct = (1 - new_s / orig_s) * 100 if orig_s > 0 else 0
        print(f"[OK] {rel}: {orig_s / 1024 / 1024:.2f} MB -> {new_s / 1024 / 1024:.2f} MB (-{saved_pct:.1f}%)")
        total_orig += orig_s
        total_new += new_s
        
    saved_mb = (total_orig - total_new) / 1024 / 1024
    overall_pct = (1 - total_new / total_orig) * 100 if total_orig > 0 else 0
    print("\n" + "=" * 60)
    print(f"TOTAL BEFORE: {total_orig / 1024 / 1024:.2f} MB")
    print(f"TOTAL AFTER:  {total_new / 1024 / 1024:.2f} MB")
    print(f"SAVED:        {saved_mb:.2f} MB (-{overall_pct:.1f}%)")
    print("=" * 60)

if __name__ == "__main__":
    main()
