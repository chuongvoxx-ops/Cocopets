# v463 SS: contact sheets for the Sepulchre's far views: before | after at DPR 1 (each land at its map's top, right and bottom
# edges; each arena north and south), the DPR 3 set, lowFx / no-GPU, and the studio views
# usage: python3 tests/_ss-sheet.py   (reads shots/v463-SS/{before,after}-s<i>-<view>-dpr<k>.png, writes sheet-*.png there)
import os
from PIL import Image, ImageDraw
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v463-SS')
NAMES = {1: 'Hour Court (Halls)', 4: 'Hall in Two Ages', 7: 'Corner Kennels (Stairs)', 3: 'Tomb Court (Threnn)', 6: 'Raised Gallery (Vaul)', 10: 'Final Sanctuary (Khyros)'}
def load(p, w):
    im = Image.open(p).convert('RGB'); return im.resize((w, round(im.height * w / im.width)))
def sheet(pairs, name, w=230, cols=3):
    cells = []
    for label, paths in pairs:
        ims = [load(p, w) if os.path.exists(p) else None for p in paths]
        if not any(ims): continue
        h = max(i.height for i in ims if i)
        cell = Image.new('RGB', (w * len(ims) + 6 * (len(ims) - 1), h + 22), (24, 12, 20))
        for k, im in enumerate(ims):
            if im: cell.paste(im, (k * (w + 6), 22))
        ImageDraw.Draw(cell).text((4, 4), label, fill=(255, 230, 200)); cells.append(cell)
    if not cells: return
    cw = max(c.width for c in cells); ch = max(c.height for c in cells); rows = (len(cells) + cols - 1) // cols
    out = Image.new('RGB', (cols * (cw + 10) + 10, rows * (ch + 10) + 10), (10, 6, 10))
    for i, c in enumerate(cells): out.paste(c, (10 + (i % cols) * (cw + 10), 10 + (i // cols) * (ch + 10)))
    out.save(os.path.join(D, name)); print(name, out.size)
views = [(i, v) for i in (1, 4, 7) for v in ('top', 'right', 'bottom')] + [(i, v) for i in (3, 6, 10) for v in ('n', 's')]
sheet([(f'{NAMES[i]} {v}: before | after', [os.path.join(D, f'before-s{i}-{v}-dpr1.png'), os.path.join(D, f'after-s{i}-{v}-dpr1.png')]) for i, v in views], 'sheet-before-after-dpr1.png')
sheet([(f'{NAMES[i]} {v} (DPR 3): before | after', [os.path.join(D, f'before-s{i}-{v}-dpr3.png'), os.path.join(D, f'after-s{i}-{v}-dpr3.png')]) for i, v in views], 'sheet-before-after-dpr3.png')
sheet([(f'{NAMES[i]} {v}: lowFx | no GPU', [os.path.join(D, f'after-s{i}-{v}-lowfx-dpr1.png'), os.path.join(D, f'after-s{i}-{v}-nogl-dpr1.png')]) for i, v in views], 'sheet-lowfx-nogl-dpr1.png')
for land in ('sepulchre', 'twoages', 'borrowed'):
    p = os.path.join(D, f'studio-{land}.png')
    if os.path.exists(p): print('studio', land, Image.open(p).size)
