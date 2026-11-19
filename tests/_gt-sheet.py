#!/usr/bin/env python3
"""v423 GT: contact sheets of the garden traps' pictures (tests/_gt-shots.js) ->
shots/v423-GT/sheet-<tag>-d<dpr>.png: one row per trap kind (calm, tell, strike), then the overview and a live frame.
usage: python3 tests/_gt-sheet.py <tag> <dpr> [title]"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v423-GT')
tag, dpr = sys.argv[1], sys.argv[2]; title = sys.argv[3] if len(sys.argv) > 3 else f'Garden of Unborn Stars traps ({tag}, DPR {dpr})'
pre = f'{tag}-d{dpr}-'
notes = json.load(open(os.path.join(D, pre + 'notes.json'))) if os.path.exists(os.path.join(D, pre + 'notes.json')) else {}
files = sorted(f for f in os.listdir(D) if f.startswith(pre) and f.endswith('.png'))
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13); big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except Exception: font = big = ImageFont.load_default()
kinds = ['pod', 'whip', 'gey', 'sap', 'star', 'trip', 'whipbr']; ph = ['calm', 'tell', 'strike']
C = 300; rows = []
for st in sorted({f[len(pre):].split('-')[0] for f in files}):
    for k in kinds:
        r = [f'{pre}{st}-{k}-{p}.png' for p in ph]
        if any(x in files for x in r): rows.append(r)
    big_ = [f'{pre}{st}-overview.png', f'{pre}{st}-live.png']
    rows.append([x for x in big_ if x in files])
cell = lambda f: Image.open(os.path.join(D, f)).convert('RGB')
W = 3 * C + 40; y = 40; parts = []
for r in rows:
    if not r: continue
    ims = [cell(f) if f in files else None for f in r]
    if any(f.endswith('overview.png') or f.endswith('live.png') for f in r):
        sc = [im.resize((C + 140, int(im.height * (C + 140) / im.width))) for im in ims if im]
        h = max(i.height for i in sc); parts.append(('big', r, sc, y)); y += h + 46
    else:
        sc = [im.resize((C, int(im.height * C / im.width))) if im else None for im in ims]
        h = max(i.height for i in sc if i); parts.append(('row', r, sc, y)); y += h + 46
sheet = Image.new('RGB', (max(W, 2 * (C + 140) + 30), y + 10), (18, 12, 24)); dr = ImageDraw.Draw(sheet)
dr.text((10, 10), title, fill=(242, 216, 161), font=big)
for kind, r, sc, y0 in parts:
    x = 10
    for f, im in zip(r, sc):
        if im is None: x += C + 10; continue
        sheet.paste(im, (x, y0)); n = notes.get(f, f[len(pre):-4])
        words, line, lines = n.split(), '', []
        for w_ in words:
            if dr.textlength(line + ' ' + w_, font=font) > im.width - 6: lines.append(line); line = w_
            else: line = (line + ' ' + w_).strip()
        lines.append(line)
        for k, l in enumerate(lines[:3]): dr.text((x + 3, y0 + im.height + 2 + k * 14), l, fill=(230, 226, 240), font=font)
        x += im.width + 10
out = os.path.join(D, f'sheet-{tag}-d{dpr}.png'); sheet.save(out); print(out, sheet.size)
