# Uso: python scripts/crop_reference.py <imagen_origen>
import sys
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "images"
import os
from PIL import Image

src_path = sys.argv[1]
out_dir = str(OUT_DIR)

os.makedirs(out_dir, exist_ok=True)
img = Image.open(src_path)
w, h = img.size
print(f"Reference size: {w}x{h}")

# 1. Extract Real Avatars from reference
avatar_box = (int(w * 0.045), int(h * 0.338), int(w * 0.138), int(h * 0.366))
avatars_img = img.crop(avatar_box)
avatars_img.save(os.path.join(out_dir, "real_avatars.png"))

# 2. Extract Clean Hero Slab + Plinth + Gorilla
# Slicing from x=0.42*w to w so no text is cut
hero_right = img.crop((int(w * 0.42), int(h * 0.045), w, int(h * 0.438)))
hero_right = hero_right.convert("RGBA")
rw, rh = hero_right.size

# Gradient alpha feather on the left 70px to merge invisibly into #0A0D0B
for x in range(rw):
    if x < 70:
        factor = (x / 70.0) ** 1.8
        for y in range(rh):
            r, g, b, a = hero_right.getpixel((x, y))
            hero_right.putpixel((x, y), (int(r * factor), int(g * factor), int(b * factor), int(a * factor)))

hero_right.save(os.path.join(out_dir, "hero_art_seamless.png"))
# Also overwrite hero_art_exact.png with this seamless version
hero_right.save(os.path.join(out_dir, "hero_art_exact.png"))

# 3. Clean Brand Ribbon
ribbon = img.crop((0, int(h * 0.442), w, int(h * 0.506)))
ribbon.save(os.path.join(out_dir, "ribbon_exact.png"))

# 4. Clean Tech Sequence
tech_art = img.crop((int(w * 0.395), int(h * 0.528), int(w * 0.855), int(h * 0.702)))
tech_art.save(os.path.join(out_dir, "tech_sequence_exact.png"))

# 5. Clean 4 Pillar Photos
p1 = img.crop((int(w * 0.058), int(h * 0.718), int(w * 0.252), int(h * 0.795)))
p1.save(os.path.join(out_dir, "pillar_preserve_exact.png"))

p2 = img.crop((int(w * 0.294), int(h * 0.718), int(w * 0.488), int(h * 0.795)))
p2.save(os.path.join(out_dir, "pillar_auth_exact.png"))

p3 = img.crop((int(w * 0.528), int(h * 0.718), int(w * 0.722), int(h * 0.795)))
p3.save(os.path.join(out_dir, "pillar_understand_exact.png"))

p4 = img.crop((int(w * 0.762), int(h * 0.718), int(w * 0.955), int(h * 0.795)))
p4.save(os.path.join(out_dir, "pillar_belong_exact.png"))

# 6. Mission Texture
mission = img.crop((0, int(h * 0.89), w, int(h * 0.99)))
mission.save(os.path.join(out_dir, "mission_exact.png"))

print("Extracted successfully!")
