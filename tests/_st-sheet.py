# v463 ST: contact sheets from shots/v463-ST: the trap states (after-d<dpr>-<kind>-<state>.png) and the before/after views
# (view-before|after-d<dpr>-s<stage>-<kind>.png). python3 tests/_st-sheet.py
import os, glob, re
from PIL import Image, ImageDraw
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v463-ST')
KINDS = ['pend', 'clock', 'stall', 'swap', 'column', 'lance', 'glass', 'vhand', 'rift']
def label(im, s):
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 8 + 7 * len(s), 16], fill=(0, 0, 0)); d.text((4, 2), s, fill=(255, 255, 255))
def sheet(cells, cols, name, w=260):
    if not cells: return
    ims = []
    for p, s in cells:
        im = Image.open(p).convert('RGB'); h = int(im.height * w / im.width); im = im.resize((w, h)); label(im, s); ims.append(im)
    H = max(i.height for i in ims); rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (cols * w, rows * H), (20, 20, 20))
    for i, im in enumerate(ims): S.paste(im, ((i % cols) * w, (i // cols) * H))
    S.save(os.path.join(D, name)); print(name, S.size)
for dpr in (1, 3):
    cells = []
    for k in KINDS:
        for st in ('idle', 'warn', 'burst'):
            p = os.path.join(D, f'after-d{dpr}-{k}-{st}.png')
            if os.path.exists(p): cells.append((p, f'{k} {st}'))
    sheet(cells, 6, f'sheet-states-d{dpr}.png')
    cells = []
    for p in sorted(glob.glob(os.path.join(D, f'view-after-d{dpr}-*.png'))):
        b = p.replace('view-after', 'view-before'); m = re.search(r's(\d+)-(\w+)\.png$', p)
        if os.path.exists(b): cells.append((b, f'before s{m.group(1)} {m.group(2)}'))
        cells.append((p, f'after s{m.group(1)} {m.group(2)}'))
    sheet(cells, 6, f'sheet-before-after-d{dpr}.png')
