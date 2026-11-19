# v423 GB: before / after contact sheet of a garden boss's fight moments (from tests/_gb-shots.js), one cell per moment:
# the HEAD build on the left, this build on the right. usage: python3 tests/_gb-sheet.py ambrel 1 [before-tag after-tag]
import sys, os
from PIL import Image, ImageDraw
boss, dpr = sys.argv[1], int(sys.argv[2]); bt = sys.argv[3] if len(sys.argv) > 3 else 'before'; at = sys.argv[4] if len(sys.argv) > 4 else 'after'
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v423-GB')
M = ['intro'] + {'ambrel': ['veil-wind', 'veil-strike', 'dive-wind', 'dive-strike', 'beam-wind', 'beam-strike', 'storm-wind', 'storm-strike'],
                 'calyx': ['whips-wind', 'whips-strike', 'rain-wind', 'rain-strike', 'bloom-wind', 'bloom-strike', 'constrict-wind', 'constrict-strike']}[boss] + ['hit', 'stun', 'phase2', 'p2-strike', 'defeat-1', 'defeat-2', 'defeat-3']
cw = 390 // (2 if dpr == 1 else 1); ch = 844 * cw // 390; cols = 4 if dpr == 1 else 3
cells = []
for m in M:
    pair = []
    for tg in (bt, at):
        f = os.path.join(R, 'raw', f'{boss}-{tg}-d{dpr}-{m}.png')
        im = Image.open(f).convert('RGB').resize((cw, ch), Image.LANCZOS) if os.path.exists(f) else Image.new('RGB', (cw, ch), (40, 0, 0))
        pair.append(im)
    cell = Image.new('RGB', (cw * 2 + 4, ch + 22), (12, 8, 16)); cell.paste(pair[0], (0, 22)); cell.paste(pair[1], (cw + 4, 22))
    d = ImageDraw.Draw(cell); d.text((4, 5), f'{m}   ({bt} | {at})', fill=(255, 230, 140)); cells.append(cell)
W = cells[0].width; H = cells[0].height; rows = (len(cells) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (W + 8), rows * (H + 8)), (255, 255, 255))
for i, c in enumerate(cells): sheet.paste(c, ((i % cols) * (W + 8), (i // cols) * (H + 8)))
out = os.path.join(R, f'{boss}-sheet-dpr{dpr}.png'); sheet.save(out, optimize=True); print(out, sheet.size)
