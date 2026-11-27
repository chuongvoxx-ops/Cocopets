#!/usr/bin/env python3
"""(v472 YB) 2D | GPU sheets of the Yuggoth Engine's bosses: for each boss, every fight shot taken both ways (fight-2d-<boss>-NN-what.png
beside fight-gpu-<boss>-NN-what.png, matched by 'what'), cropped to the field, two pairs a row; and the studio poses (studio-<boss>-<i>-d2 /
-gl). usage: python3 tests/_yb-sheet.py [folder (shots/v472-YB)]  -> sheet-fight-<boss>.png, sheet-studio-<boss>.png"""
import sys, os, re, glob
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'shots', 'v472-YB')
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except Exception: F = ImageFont.load_default()
def sheet(out, pairs, cw=300, crop=(0.0, 1.0)):
    rows = []
    for a, b, lab in pairs:
        ims = []
        for f in (a, b):
            if not f or not os.path.exists(f): ims.append(None); continue
            im = Image.open(f).convert('RGB'); W, H = im.size; im = im.crop((0, int(H * crop[0]), W, int(H * crop[1]))); ims.append(im.resize((cw, int(im.size[1] * cw / im.size[0]))))
        if any(ims): rows.append((ims, lab))
    if not rows: return
    h = max(i.size[1] for r in rows for i in r[0] if i); per = 2; n = (len(rows) + per - 1) // per
    S = Image.new('RGB', (per * (2 * cw + 18) + 6, n * (h + 30) + 6), (6, 8, 16)); d = ImageDraw.Draw(S)
    for k, (ims, lab) in enumerate(rows):
        x0, y0 = 6 + (k % per) * (2 * cw + 18), 6 + (k // per) * (h + 30)
        for j, im in enumerate(ims):
            if im: S.paste(im, (x0 + j * (cw + 4), y0))
        d.text((x0 + 4, y0 + h + 6), lab + '   (2D | GPU)', fill=(200, 214, 245), font=F)
    S.save(out); print('sheet', out, len(rows))
for boss in ('khaal', 'ixvorra', 'nyarzhul'):
    g = {}; d2 = {}
    for f in glob.glob(os.path.join(D, f'fight-gpu-{boss}-*.png')): m = re.match(r'.*-(\d\d)-(.+)\.png$', f); g[m.group(2)] = f
    for f in glob.glob(os.path.join(D, f'fight-2d-{boss}-*.png')): m = re.match(r'.*-(\d\d)-(.+)\.png$', f); d2[m.group(2)] = f
    order = sorted(set(g) | set(d2), key=lambda w: (g.get(w) or d2.get(w)))
    sheet(os.path.join(D, f'sheet-fight-{boss}.png'), [(d2.get(w), g.get(w), boss + ' ' + w) for w in order], crop=(0.08, 0.92))
    st = sorted(glob.glob(os.path.join(D, f'studio-{boss}-[0-9]-gl.png')))
    sheet(os.path.join(D, f'sheet-studio-{boss}.png'), [(f.replace('-gl.png', '-d2.png'), f, boss + ' pose ' + re.search(r'-(\d)-gl', f).group(1)) for f in st], cw=420)
