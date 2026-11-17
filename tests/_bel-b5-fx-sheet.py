#!/usr/bin/env python3
"""Uldroth's effects, before (v397) and after (v398 B5): shots/bel-b5-fx-before-*.png and -after-*.png (tests/_bel-b5-fx-shots.js
with TAG=before / after) side by side per state -> shots/bel-b5-v398-fx.png"""
import json, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots')
notes = json.load(open(os.path.join(D, 'bel-b5-fx-after.json')))
W, H, top, cols = 260, 420, 150, 5
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12); bold = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14); big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except Exception: font = bold = big = ImageFont.load_default()
rows = (len(notes) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W * 2 + (cols - 1) * 8, 44 + rows * (H + 44)), (14, 18, 24)); dr = ImageDraw.Draw(sheet)
dr.text((10, 12), 'Uldroth: attack and phase effects, before (v397) | after (v398, GPU water through FGFX)', fill=(201, 255, 248), font=big)
for i, (n, note) in enumerate(notes):
    x0, y0 = (i % cols) * (W * 2 + 8), 44 + (i // cols) * (H + 44)
    for k, tag in enumerate(['before', 'after']):
        im = Image.open(os.path.join(D, f'bel-b5-fx-{tag}-{n}.png')).convert('RGB'); s = W / im.width * 1.5
        im = im.resize((int(im.width * s), int(im.height * s))).crop((int(im.width * s / 2 - W / 2), int(top * s), int(im.width * s / 2 + W / 2), int(top * s) + H))
        sheet.paste(im, (x0 + k * W, y0)); dr.text((x0 + k * W + 6, y0 + 4), tag.upper(), fill=(255, 230, 120) if k else (200, 200, 200), font=bold)
    dr.text((x0 + 4, y0 + H + 4), (n + ': ' + note)[:80], fill=(230, 240, 236), font=font)
sheet.save(os.path.join(D, 'bel-b5-v398-fx.png')); print('sheet', len(notes))
