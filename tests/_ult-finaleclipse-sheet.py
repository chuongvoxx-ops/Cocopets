#!/usr/bin/env python3
"""Final Eclipse's contact sheet (worker U1, v391): the key beats before (the original 2D) and after (the GPU rebuild), at
phone size, from shots/fe/*.png (tests/_ult-finaleclipse.js SHEET=1); a row of brightness-boosted crops of the GPU frames
(soft light, no hard edges); and the demon's turnaround (shots/fe/turn-*.png: front, three-quarter, side) if present.
usage: python3 tests/_ult-finaleclipse-sheet.py  -> shots/ult-finaleclipse-sheet.png"""
import json, os
from PIL import Image, ImageDraw, ImageEnhance, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, '..', 'shots', 'fe')
meta = json.load(open(os.path.join(D, 'shots.json')))
names = [n for n, _ in meta['gpu']]
W, H, S = 390, 844, 0.5          # each phone frame shown at half size
w, h = int(W * S), int(H * S)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
    big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
except Exception:
    font = big = ImageFont.load_default()
pad, lab = 6, 18
turn = sorted(f for f in os.listdir(D) if f.startswith('turn-') and f.endswith('.png'))
cols = len(names)
crop_h = int(h * 0.6)
rows_h = [lab + h, lab + h, lab + crop_h]
tw = 0
if turn:
    tim = [Image.open(os.path.join(D, f)).convert('RGB') for f in turn]
    th = 520
    tim = [t.resize((int(t.width * th / t.height), th)) for t in tim]
    tw = sum(t.width for t in tim) + pad * (len(tim) - 1)
sheet_w = max(cols * (w + pad) + pad, tw + 2 * pad)
sheet_h = 30 + sum(r + pad for r in rows_h) + (lab + 520 + pad * 2 if turn else 0)
sheet = Image.new('RGB', (sheet_w, sheet_h), (18, 16, 22))
g = ImageDraw.Draw(sheet)
g.text((pad, 6), f"Final Eclipse  (evo {meta['evo']})  before: the original 2D  /  after: the GPU rebuild  /  brightness x3 crops  /  the demon's turnaround", fill=(230, 220, 255), font=big)
y = 30
for row, (tag, title) in enumerate([('2d', 'before'), ('gpu', 'after'), ('boost', 'after, brightness x3 (soft edges)')]):
    for i, n in enumerate(names):
        x = pad + i * (w + pad)
        src = os.path.join(D, f"{'gpu' if tag == 'boost' else tag}-{n}.png")
        if not os.path.exists(src):
            continue
        im = Image.open(src).convert('RGB')
        if tag == 'boost':
            im = ImageEnhance.Brightness(im).enhance(3.0)
            im = im.crop((0, int(H * 0.05), W, int(H * 0.05) + int(H * 0.6))).resize((w, crop_h))
        else:
            im = im.resize((w, h))
        g.text((x, y + 2), f"{title if i == 0 else ''} {n}".strip(), fill=(200, 190, 230), font=font)
        sheet.paste(im, (x, y + lab))
    y += rows_h[row] + pad
if turn:
    g.text((pad, y + 2), 'the demon knight (GLM): front, three-quarter, side; whole figure and close-up, phone-size panels', fill=(200, 190, 230), font=font)
    x = pad
    for t in tim:
        sheet.paste(t, (x, y + lab)); x += t.width + pad
out = os.path.join(HERE, '..', 'shots', 'ult-finaleclipse-sheet.png')
sheet.save(out)
print('wrote', out, sheet.size)
