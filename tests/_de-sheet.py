# v433 DE: before / after contact sheets from shots/v433-DE/<before|after>[-dpr3]-<scene>.png
# usage: python3 tests/_de-sheet.py [suffix]   (suffix '' for DPR 1, '-dpr3' for the DPR 3 set) -> shots/v433-DE/sheet<suffix>.png
import os, sys
from PIL import Image, ImageDraw
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v433-DE')
suf = sys.argv[1] if len(sys.argv) > 1 else ''
scenes = [f[len('after' + suf) + 1:-4] for f in sorted(os.listdir(D)) if f.startswith('after' + suf + '-') and f.endswith('.png') and (suf or not f.startswith('after-dpr'))]
W = 300 if not suf else 360
rows = []
for s in scenes:
    pair = []
    for tag in ('before', 'after'):
        p = os.path.join(D, f'{tag}{suf}-{s}.png')
        if not os.path.exists(p): pair.append(None); continue
        im = Image.open(p).convert('RGB'); k = W / im.width; pair.append(im.resize((W, int(im.height * k))))
    rows.append((s, pair))
H = max((p.height for _, pr in rows for p in pr if p), default=100)
cols = 4; n = len(rows); R = (n + cols // 2 - 1) // (cols // 2)
sheet = Image.new('RGB', (cols * (W + 8) + 8, R * (H + 28) + 8), (24, 18, 22)); dr = ImageDraw.Draw(sheet)
for i, (s, pr) in enumerate(rows):
    r, c = divmod(i, cols // 2)
    for j, im in enumerate(pr):
        x = 8 + (c * 2 + j) * (W + 8); y = 8 + r * (H + 28)
        if im: sheet.paste(im, (x, y + 20))
        dr.text((x + 4, y + 4), f"{'BEFORE' if j == 0 else 'AFTER'}  {s}", fill=(255, 230, 200))
out = os.path.join(D, f'sheet{suf}.png'); sheet.save(out); print(out, sheet.size)
