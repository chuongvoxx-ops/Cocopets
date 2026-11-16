#!/usr/bin/env python3
"""v391 B1: the Belfry contact sheet (shots/bel-b1-sheet.png) from shots/bel-b1-*.png, and the floor seam check
(shots/bel-b1-seams.png): the floors' plate brightness-boosted and contrast-stretched, so a line at every tile edge (every
47 px) would stand out; also prints the mean brightness of the pixel columns on tile edges against those between them."""
import os, glob
from PIL import Image, ImageOps, ImageEnhance, ImageDraw
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots')
names = ['causeway', 'hall', 'hall-guard', 'cistern', 'clap-carry', 'clap-solved', 'cistern-lift', 'tide-foot', 'tide-warn', 'tide-surge', 'tide-landing2', 'tide-doors', 'baptism', 'nave', 'platform', 'cistern-gpu', 'tide-gpu', 'causeway-gpu']
files = [(n, os.path.join(D, 'bel-b1-%s.png' % n)) for n in names if os.path.exists(os.path.join(D, 'bel-b1-%s.png' % n))]
tw, th, cols = 260, 563, 5
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw + (cols + 1) * 8, rows * (th + 26) + 8), (10, 20, 28))
dr = ImageDraw.Draw(sheet)
for i, (n, f) in enumerate(files):
    im = Image.open(f).convert('RGB').resize((tw, th), Image.LANCZOS)
    x, y = 8 + (i % cols) * (tw + 8), 8 + (i // cols) * (th + 26)
    sheet.paste(im, (x, y)); dr.text((x + 4, y + th + 6), n, fill=(220, 240, 240))
sheet.save(os.path.join(D, 'bel-b1-sheet.png')); print('sheet', len(files), 'pictures')
fl = os.path.join(D, 'bel-b1-floors.png')
if os.path.exists(fl):
    im = Image.open(fl).convert('L')
    boost = ImageOps.autocontrast(ImageEnhance.Brightness(im).enhance(1.8), cutoff=1)
    boost = ImageEnhance.Contrast(boost).enhance(2.2)
    boost.convert('RGB').save(os.path.join(D, 'bel-b1-seams.png'))
    # tile edges every 47 px inside each 8x6-tile panel (panels at 386 px strides): column means on edges vs off edges
    px = im.load(); W, H = im.size; on = []; off = []
    for p in range(4):
        ox = p * (8 * 47 + 10)
        for tx in range(1, 8):
            for dx, lst in ((0, on), (-1, on), (12, off), (23, off)):
                x = ox + tx * 47 + dx
                lst.append(sum(px[x, y] for y in range(4, 6 * 47 - 4)) / (6 * 47 - 8))
    print('tile-edge columns mean %.2f, mid-tile columns mean %.2f (difference %.2f)' % (sum(on) / len(on), sum(off) / len(off), sum(on) / len(on) - sum(off) / len(off)))
