# Uso: python scripts/extract_logos.py <imagen_origen>
import sys
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "images" / "logos"
import os
from PIL import Image

src_path = sys.argv[1]
out_dir = str(OUT_DIR)
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_path)
w, h = img.size

# Ribbon vertical range:
# The ribbon is located between y = int(h * 0.442) and y = int(h * 0.505)
ry_top = int(h * 0.460)
ry_bottom = int(h * 0.500)

logos_coords = {
    "pokemon.png": (int(w * 0.130), ry_top, int(w * 0.218), ry_bottom),
    "magic.png": (int(w * 0.230), ry_top, int(w * 0.320), ry_bottom),
    "onepiece.png": (int(w * 0.332), ry_top, int(w * 0.420), ry_bottom),
    "lorcana.png": (int(w * 0.432), ry_top, int(w * 0.528), ry_bottom),
    "topps.png": (int(w * 0.540), ry_top, int(w * 0.615), ry_bottom),
    "panini.png": (int(w * 0.635), ry_top, int(w * 0.725), ry_bottom),
}

# Function to remove background and make crisp monochrome dark logo with alpha
def make_transparent_logo(crop_img):
    crop_img = crop_img.convert("RGBA")
    cw, ch = crop_img.size
    
    # Get reference background color from corners
    bg_samples = [crop_img.getpixel((0, 0)), crop_img.getpixel((cw-1, 0)), crop_img.getpixel((0, ch-1)), crop_img.getpixel((cw-1, ch-1))]
    avg_bg = sum(s[0] + s[1] + s[2] for s in bg_samples) / (4.0 * 3.0)
    
    result = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    for x in range(cw):
        for y in range(ch):
            r, g, b, a = crop_img.getpixel((x, y))
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            
            # If pixel is darker than background, it belongs to the logo
            if lum < avg_bg - 12:
                # Keep original RGB, just calculate alpha
                alpha = int(min(255, (avg_bg - lum) * 3.5))
                result.putpixel((x, y), (r, g, b, alpha))
            else:
                result.putpixel((x, y), (0, 0, 0, 0))
    return result

for name, box in logos_coords.items():
    cropped = img.crop(box)
    clean_logo = make_transparent_logo(cropped)
    # Trim empty borders
    bbox = clean_logo.getbbox()
    if bbox:
        # Add slight 4px padding
        pad = 4
        pbox = (max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(clean_logo.width, bbox[2]+pad), min(clean_logo.height, bbox[3]+pad))
        clean_logo = clean_logo.crop(pbox)
    clean_logo.save(os.path.join(out_dir, name))
    print(f"Saved {name}: {clean_logo.size}")

print("All 6 original brand logos extracted cleanly with transparent alpha!")
