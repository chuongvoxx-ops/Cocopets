#!/usr/bin/env python3
"""(v470b AH) a contact sheet with a set number of columns: _ah-sheet.py OUT.png COLS img1.png[=caption] ... (cells up to 600 px wide)"""
import sys
from PIL import Image, ImageDraw, ImageFont
out, cols, items = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
pics = []
for it in items:
    p, _, cap = it.partition('=')
    im = Image.open(p).convert('RGB'); pics.append((im, cap or p.rsplit('/', 1)[-1][:-4]))
cols = max(1, min(cols, len(pics))); w = max(i.width for i, _ in pics); h = max(i.height for i, _ in pics)
sc = min(1.0, 600 / w); tw, th = int(w * sc), int(h * sc); rows = (len(pics) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 30)), (18, 16, 22)); d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
except Exception: font = ImageFont.load_default()
for k, (im, cap) in enumerate(pics):
    x, y = (k % cols) * tw, (k // cols) * (th + 30); sheet.paste(im.resize((int(im.width * sc), int(im.height * sc))), (x, y)); d.text((x + 8, y + th + 6), cap[:70], fill=(230, 225, 210), font=font)
sheet.save(out); print('sheet', out)
