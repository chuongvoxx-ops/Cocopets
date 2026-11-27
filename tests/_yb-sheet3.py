#!/usr/bin/env python3
"""(v472b YB) 2D | before | after sheets of the Yuggoth Engine's bosses' studio poses: studio-<boss>-<i>-d2.png, -before.png (v472's GPU
model) and -gl.png (this pass's), a row each.  usage: python3 tests/_yb-sheet3.py [folder (shots/v472b-YB)] -> sheet3-studio-<boss>.png"""
import sys, os, glob, re
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'shots', 'v472b-YB')
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except Exception: F = ImageFont.load_default()
cw = 360
for boss in ('khaal', 'ixvorra', 'nyarzhul'):
    rows = []
    for g in sorted(glob.glob(os.path.join(D, f'studio-{boss}-[0-9]-gl.png'))):
        i = re.search(r'-(\d)-gl', g).group(1); ims = []
        for f in (g.replace('-gl.png', '-d2.png'), g.replace('-gl.png', '-before.png'), g):
            if os.path.exists(f): im = Image.open(f).convert('RGB'); ims.append(im.resize((cw, int(im.size[1] * cw / im.size[0]))))
            else: ims.append(None)
        rows.append((ims, f'{boss} pose {i}   2D | v472 GPU (before) | v472b GPU (after)'))
    if not rows: continue
    h = max(im.size[1] for r in rows for im in r[0] if im)
    S = Image.new('RGB', (3 * (cw + 4) + 8, len(rows) * (h + 28) + 6), (6, 8, 16)); d = ImageDraw.Draw(S)
    for k, (ims, lab) in enumerate(rows):
        for j, im in enumerate(ims):
            if im: S.paste(im, (6 + j * (cw + 4), 6 + k * (h + 28)))
        d.text((10, 6 + k * (h + 28) + h + 5), lab, fill=(200, 214, 245), font=F)
    out = os.path.join(D, f'sheet3-studio-{boss}.png'); S.save(out); print('sheet', out, len(rows))
