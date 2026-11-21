#!/usr/bin/env python3
# v443 SB: before / after contact sheets from tests/_sbx-sheet.js crops (dev only).
# usage: python3 tests/_sbx-sheet.py [dir (shots/v443-SB)]  -> <dir>/sheet-<stage>.png (rows: before / after at each DPR;
# columns: still, moving, hit, strike, breaking) and <dir>/sheet-gpu-vs-2d.png (the after build's live light laid on the GPU
# and from 2D pictures, the same frame)
import os, sys, glob, re
from PIL import Image, ImageDraw
D = sys.argv[1] if len(sys.argv) > 1 else 'shots/v443-SB'
COLS = ['still', 'moving', 'hit', 'strike', 'breaking']
H = 300
def load(f):
    im = Image.open(f).convert('RGB'); k = H / im.height; return im.resize((max(1, int(im.width * k)), H))
stages = sorted({re.sub(r'^(before|after)-(.*)-dpr\d-.*$', r'\2', os.path.basename(f)) for f in glob.glob(os.path.join(D, '*-dpr*-still.png'))})
for st in stages:
    rows = []
    for dpr in ('1', '2', '3'):
        for tag in ('before', 'after'):
            fs = [os.path.join(D, f'{tag}-{st}-dpr{dpr}-{c}.png') for c in COLS]
            if not all(os.path.exists(f) for f in fs): continue
            rows.append((f'{tag} dpr {dpr}', [load(f) for f in fs]))
    if not rows: continue
    W = 130 + sum(i.width + 6 for i in rows[0][1]); sh = Image.new('RGB', (W, 26 + len(rows) * (H + 6)), (16, 14, 20)); d = ImageDraw.Draw(sh)
    x = 130
    for c, im in zip(COLS, rows[0][1]): d.text((x + 4, 6), c, fill=(230, 230, 230)); x += im.width + 6
    for j, (lab, ims) in enumerate(rows):
        y = 26 + j * (H + 6); d.text((6, y + H // 2), lab, fill=(230, 230, 230)); x = 130
        for im in ims: sh.paste(im, (x, y)); x += im.width + 6
    out = os.path.join(D, f'sheet-{st}.png'); sh.save(out); print(out, sh.size)
pairs = [(st, dpr) for st in stages for dpr in ('1', '2', '3') if os.path.exists(os.path.join(D, f'after-{st}-dpr{dpr}-gpu.png'))]
if pairs:
    ims = [(f'{st} dpr{dpr}', load(os.path.join(D, f'after-{st}-dpr{dpr}-gpu.png')), load(os.path.join(D, f'after-{st}-dpr{dpr}-moving2d.png'))) for st, dpr in pairs]
    W = 140 + max(a.width + b.width + 12 for _, a, b in ims); sh = Image.new('RGB', (W, 26 + len(ims) * (H + 6)), (16, 14, 20)); d = ImageDraw.Draw(sh); d.text((140, 6), 'GPU pass (left) | 2D pictures (right), the same frame', fill=(230, 230, 230))
    for j, (lab, a, b) in enumerate(ims): y = 26 + j * (H + 6); d.text((6, y + H // 2), lab, fill=(230, 230, 230)); sh.paste(a, (140, y)); sh.paste(b, (146 + a.width, y))
    out = os.path.join(D, 'sheet-gpu-vs-2d.png'); sh.save(out); print(out, sh.size)
