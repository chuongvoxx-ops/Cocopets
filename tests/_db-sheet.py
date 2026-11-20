#!/usr/bin/env python3
"""(v433 DB) a contact sheet: _db-sheet.py OUT.png img1.png[=caption] img2.png[=caption] ... (4 across, captions under each)"""
import sys
from PIL import Image, ImageDraw, ImageFont
out, items = sys.argv[1], sys.argv[2:]
pics = []
for it in items:
    p, _, cap = it.partition('=')
    im = Image.open(p).convert('RGB'); pics.append((im, cap or p.rsplit('/', 1)[-1][:-4]))
cols = min(4, len(pics)); w = max(i.width for i, _ in pics); h = max(i.height for i, _ in pics)
sc = min(1.0, 420 / w); tw, th = int(w * sc), int(h * sc); rows = (len(pics) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 34)), (18, 16, 22)); d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
except Exception: font = ImageFont.load_default()
for k, (im, cap) in enumerate(pics):
    x, y = (k % cols) * tw, (k // cols) * (th + 34); sheet.paste(im.resize((int(im.width * sc), int(im.height * sc))), (x, y)); d.text((x + 6, y + th + 8), cap[:60], fill=(230, 225, 210), font=font)
sheet.save(out); print('sheet', out)
