# v433 DS: contact sheets for the dunes' far views: before | after at DPR 1 (each land at its map's top, right and bottom
# edges; each arena north and south), the DPR 3 set, lowFx / no-GPU, and the studio views
# usage: python3 tests/_ds-sheet.py   (reads shots/v433-DS/{before,after}-s<i>-<view>-dpr<k>.png, writes sheet-*.png there)
import os
from PIL import Image, ImageDraw
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v433-DS')
NAMES = {0: 'Buried Road (dunes)', 5: 'Rust Flats (mesa)', 8: 'Moonlit Barrows (night)', 3: 'The Gullet (Sarrukh)', 7: 'The Whorl (Oneira)', 11: 'The Pit (Thul-Ammon)'}
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
views = [(i, v) for i in (0, 5, 8) for v in ('top', 'right', 'bottom')] + [(i, v) for i in (3, 7, 11) for v in ('n', 's')]
sheet([(f'{NAMES[i]} {v}: before | after', [os.path.join(D, f'before-s{i}-{v}-dpr1.png'), os.path.join(D, f'after-s{i}-{v}-dpr1.png')]) for i, v in views], 'sheet-before-after-dpr1.png')
sheet([(f'{NAMES[i]} {v} (DPR 3)', [os.path.join(D, f'after-s{i}-{v}-dpr3.png')]) for i, v in views], 'sheet-after-dpr3.png', w=260, cols=4)
sheet([(f'{NAMES[i]} {v}: lowFx | no GPU', [os.path.join(D, f'after-s{i}-{v}-lowfx-dpr1.png'), os.path.join(D, f'after-s{i}-{v}-nogl-dpr1.png')]) for i, v in views], 'sheet-lowfx-nogl-dpr1.png')
for land in ('dunes', 'mesa', 'nightdune'):
    p = os.path.join(D, f'studio-{land}.png')
    if os.path.exists(p): print('studio', land, Image.open(p).size)
