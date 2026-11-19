# (v417 BR) contact sheets of tests/_earth-strong-br-shots.js frames: one row per tier (evo), one column per beat
# usage: python3 tests/_earth-strong-br-sheet.py KEY DPR MODE evo1,evo2 beat1,beat2 [x0,y0,x1,y1 in CSS px]  -> shots/v417-BR/sheet-KEY-dDPR-MODE.png
import sys, os
from PIL import Image, ImageDraw
key, dpr, mode = sys.argv[1], int(sys.argv[2]), sys.argv[3]
evos = sys.argv[4].split(','); beats = sys.argv[5].split(',')
box = tuple(int(v) * dpr for v in (sys.argv[6].split(',') if len(sys.argv) > 6 else '0,200,390,640'.split(',')))
w, h = box[2] - box[0], box[3] - box[1]; k = 1 if dpr > 1 else 2 if w <= 400 else 1
im = Image.new('RGB', (w * k * len(beats), (h * k + 18 * dpr) * len(evos)), (20, 16, 14)); dr = ImageDraw.Draw(im)
for j, e in enumerate(evos):
    for i, b in enumerate(beats):
        p = f'shots/v417-BR/{key}-e{e}-d{dpr}-{mode}-{float(b):.2f}.png'
        y = j * (h * k + 18 * dpr)
        dr.text((i * w * k + 6, y + 3), f'{key} L{e} t={b}s {mode} dpr{dpr}', fill=(240, 220, 180))
        if os.path.exists(p): im.paste(Image.open(p).crop(box).resize((w * k, h * k), Image.LANCZOS), (i * w * k, y + 18 * dpr))
        else: print('missing', p)
out = f'shots/v417-BR/sheet-{key}-d{dpr}-{mode}.png'; im.save(out); print(out, im.size)
