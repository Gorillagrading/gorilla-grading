# Uso: python scripts/download_logos.py  (descarga los logos de los juegos desde Wikimedia)
import sys
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "images" / "logos"
import os
import urllib.request
import time

out_dir = str(OUT_DIR)
os.makedirs(out_dir, exist_ok=True)

logos = {
    "pokemon.svg": "https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pok%C3%A9mon_logo.svg",
    "magic.svg": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Magicthegathering-logo.svg",
    "onepiece.png": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/One_Piece_Card_Game_logo.svg/800px-One_Piece_Card_Game_logo.svg.png",
    "lorcana.webp": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Disney_Lorcana_logo.webp",
    "topps.svg": "https://upload.wikimedia.org/wikipedia/en/d/de/Topps_logo.svg",
    "panini.svg": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Panini_Group_logo.svg"
}

opener = urllib.request.build_opener()
opener.addheaders = [
    ('User-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
    ('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
]
urllib.request.install_opener(opener)

for name, url in logos.items():
    try:
        urllib.request.urlretrieve(url, os.path.join(out_dir, name))
        print(f"Downloaded {name}")
        time.sleep(1)
    except Exception as e:
        print(f"Failed to download {name}: {e}")
