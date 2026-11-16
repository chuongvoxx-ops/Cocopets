#!/usr/bin/env python3
"""Doomsday's contact sheet: before (the earlier 2D Doomsday, now the fallback) and after (the GPU rebuild) at each key beat,
from tests/_ult-doomsday-shots.js's frames (390 x 844, DPR 1), plus brightness-boosted crops of the GPU frames round every
light (x3 and lifted shadows: any hard edge, quad border or cropped layer would show as a line) -> shots/ult-doomsday-sheet.png
usage: python3 tests/_ult-doomsday-sheet.py"""
import json, os
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(HERE, '..', 'shots', 'ult-doomsday')
B = json.load(open(os.path.join(D, 'beats.json')))
imp = B['imp']
def font(n):
    try: return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', n)
    except Exception: return ImageFont.load_default()
F1, F2 = font(22), font(14)
shots = {(s['mode'], round(s['beat'], 2)): s for s in B['shots']}
beats = sorted({round(s['beat'], 2) for s in B['shots']})
def cap(b):
    d = b - imp
    names = {0.8: 'dark sky torn, meteor out', 1.25: 'the slow first fall', 1.75: 'the plunge'}
    if round(b, 2) in names: return f't {b:.2f}  ' + names[round(b, 2)]
    if d < 0: return f'IMP{d:+.2f}  about to strike'
    return f'IMP{d:+.2f}  ' + ('flash / negative' if d < 0.05 else 'dome, debris' if d < 0.4 else 'mushroom' if d < 1 else 'cracks, embers')
SC = 0.5; W0, H0 = int(390 * SC), int(844 * SC); PAD = 8
cols = len(beats); top = 44
rows = [m for m in ('2d', 'gpu') if any((m, b) in shots for b in beats)]
crops = []
for b in beats:
    s = shots.get(('gpu', b));
    if not s or not s.get('view'): continue
    v = s['view']; d = b - imp; T = v.get('T') or 40
    if d < -0.5 and b < 1.0: c = v['tear'] if b < 1.0 else v['meteor']
    elif d < 0: c = v['meteor']
    elif d < 0.4: c = v['aim']
    elif d < 1.0: c = [v['aim'][0], v['aim'][1] - int(T * 2.2)]
    else: c = v['aim']
    crops.append((b, c, int(T * (6 if d >= 0 else 4.5))))
CS = 230
sheet_w = PAD + cols * (W0 + PAD) + 150
sheet_h = top + len(rows) * (H0 + 26 + PAD) + (CS + 40 if crops else 0) + PAD
S = Image.new('RGB', (sheet_w, sheet_h), (16, 14, 22)); g = ImageDraw.Draw(S)
g.text((PAD, 10), f"DOOMSDAY  (evo {B['evo']}, impact at {imp:.2f} s)  -  before: the earlier 2D picture (now the fallback)  |  after: the GPU rebuild", fill=(230, 220, 255), font=F1)
y = top
for m in rows:
    g.text((PAD + cols * (W0 + PAD) + 6, y + H0 // 2 - 20), 'BEFORE\n2D' if m == '2d' else 'AFTER\nGPU', fill=(205, 168, 255), font=F1)
    for i, b in enumerate(beats):
        x = PAD + i * (W0 + PAD); s = shots.get((m, b))
        if s:
            im = Image.open(os.path.join(D, s['name'] + '.png')).convert('RGB').resize((W0, H0), Image.LANCZOS); S.paste(im, (x, y))
        g.text((x, y + H0 + 4), cap(b), fill=(200, 200, 210), font=F2)
    y += H0 + 26 + PAD
if crops:
    g.text((PAD, y), 'GPU frames, brightness x3 and shadows lifted (soft-edge check: no quad borders, no cut layers)', fill=(230, 220, 255), font=F2); y += 22
    x = PAD
    for b, c, r in crops:
        s = shots[('gpu', b)]; im = Image.open(os.path.join(D, s['name'] + '.png')).convert('RGB')
        bx = (max(0, c[0] - r), max(0, c[1] - r), min(im.width, c[0] + r), min(im.height, c[1] + r)); cr = im.crop(bx)
        cr = cr.point(lambda p: min(255, int(255 * (min(1.0, p / 255 * 3.0)) ** 0.8)))
        cr = ImageOps.contain(cr, (CS, CS), Image.LANCZOS); S.paste(cr, (x, y)); g.text((x, y + CS + 2), f'{b:.2f} s', fill=(200, 200, 210), font=F2); x += CS + PAD
        if x + CS > sheet_w: break
out = os.path.join(HERE, '..', 'shots', 'ult-doomsday-sheet.png'); S.save(out); print('wrote', os.path.normpath(out), S.size)
