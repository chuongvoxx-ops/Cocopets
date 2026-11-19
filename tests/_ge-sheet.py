# v423 GE: contact sheets for the garden's rebuild: before/after at DPR 1 (every room type, each mini-game) and the DPR 3 set
# usage: python3 tests/_ge-sheet.py   (reads shots/v423-GE/{before,after}-<room>-dpr<k>.png, writes sheet-*.png there)
import os
from PIL import Image, ImageDraw
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v423-GE')
ROOMS = ['fight1', 'fight2', 'fight3', 'march', 'march-boss', 'starfall', 'gallery', 'orrubel', 'ambrel', 'calyx']
def load(p, w):
    im = Image.open(p).convert('RGB'); return im.resize((w, round(im.height * w / im.width)))
def sheet(pairs, name, w=260, cols=4):
    cells = []
    for label, paths in pairs:
        ims = [load(p, w) if os.path.exists(p) else None for p in paths]
        if not any(ims): continue
        h = max(i.height for i in ims if i)
        cell = Image.new('RGB', (w * len(ims) + 6 * (len(ims) - 1), h + 22), (20, 12, 28))
        for k, im in enumerate(ims):
            if im: cell.paste(im, (k * (w + 6), 22))
        dr = ImageDraw.Draw(cell); dr.text((4, 4), label, fill=(255, 236, 200))
        cells.append(cell)
    if not cells: return
    cw = max(c.width for c in cells); ch = max(c.height for c in cells); rows = (len(cells) + cols - 1) // cols
    out = Image.new('RGB', (cols * (cw + 10) + 10, rows * (ch + 10) + 10), (10, 6, 14))
    for i, c in enumerate(cells): out.paste(c, (10 + (i % cols) * (cw + 10), 10 + (i // cols) * (ch + 10)))
    out.save(os.path.join(D, name)); print(name, out.size)
sheet([(f'{r}: before | after', [os.path.join(D, f'before-{r}-dpr1.png'), os.path.join(D, f'after-{r}-dpr1.png')]) for r in ROOMS], 'sheet-before-after-dpr1.png', w=230, cols=3)
sheet([(f'{r} (DPR 3)', [os.path.join(D, f'after-{r}-dpr3.png')]) for r in ROOMS], 'sheet-after-dpr3.png', w=260, cols=5)
sheet([(f'{r}: lowFx', [os.path.join(D, f'after-{r}-lowfx-dpr1.png')]) for r in ROOMS], 'sheet-lowfx-dpr1.png', w=260, cols=5)
KINDS = ['eggtree', 'weepwillow', 'thornpine', 'bulbtree', 'giantfern', 'glowcaps', 'starlily', 'thornbush', 'mossrock']
sheet([(f'{k}: before | breaking', [os.path.join(D, f'break-{k}-a-dpr1.png'), os.path.join(D, f'break-{k}-b-dpr1.png')]) for k in KINDS], 'sheet-breaks-dpr1.png', w=200, cols=3)
