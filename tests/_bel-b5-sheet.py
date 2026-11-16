#!/usr/bin/env python3
"""Uldroth's contact sheet (worker B5): the shots/bel-b5-NN-*.png frames from tests/_bel-b5-shots.js laid out in a grid with
their captions -> shots/bel-b5-sheet.png"""
import json, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots')
notes = dict(json.load(open(os.path.join(D, 'bel-b5-shots.json')))) if os.path.exists(os.path.join(D, 'bel-b5-shots.json')) else {}
names = sorted(f[7:-4] for f in os.listdir(D) if f.startswith('bel-b5-') and f[7:9].isdigit() and f.endswith('.png'))
W, H, cols = 300, 650, 5
rows = (len(names) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W, rows * (H + 56) + 40), (14, 18, 24))
dr = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13); big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except Exception: font = big = ImageFont.load_default()
dr.text((10, 10), 'Uldroth the Drowned Herald (B5) - GPU 3D, in the game', fill=(201, 255, 248), font=big)
for i, n in enumerate(names):
    im = Image.open(os.path.join(D, f'bel-b5-{n}.png')).convert('RGB'); im = im.resize((W, int(im.height * W / im.width)))
    im = im.crop((0, 0, W, min(H, im.height)))
    x, y = (i % cols) * W, 40 + (i // cols) * (H + 56)
    sheet.paste(im, (x, y))
    note = notes.get(n, '')
    words, line, lines = (n + ': ' + note).split(), '', []
    for w in words:
        if dr.textlength(line + ' ' + w, font=font) > W - 10: lines.append(line); line = w
        else: line = (line + ' ' + w).strip()
    lines.append(line)
    for k, l in enumerate(lines[:3]): dr.text((x + 5, y + H + 3 + k * 16), l, fill=(230, 240, 236), font=font)
sheet.save(os.path.join(D, 'bel-b5-sheet.png'))
print('sheet', len(names), 'frames')
