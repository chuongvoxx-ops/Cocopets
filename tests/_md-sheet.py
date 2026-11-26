# (v450 MD, v455 MD2) contact sheets from Moby Dick's shots (tests/_md-shots.js): one sheet per path and DPR, a row per tier, a column per beat
# (the beats found from the files' names). usage: python3 tests/_md-sheet.py [gl|2d] [dpr] [dir] [label]
import sys, os, glob, re
from PIL import Image, ImageDraw, ImageFont
path = sys.argv[1] if len(sys.argv) > 1 else 'gl'
dpr = sys.argv[2] if len(sys.argv) > 2 else '1'
D = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v455-MD2')
LAB = sys.argv[4] if len(sys.argv) > 4 else 'Moby Dick'
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
except Exception: F = ImageFont.load_default()
TIERS = [('1', 'Base (1 ring)'), ('4', 'Adept (2 rings)'), ('7', 'Celestial (3 rings)')]
cw, crop = 200, (0.07, 0.74)
rows = []
for evo, lab in TIERS:
    fs = sorted(glob.glob(os.path.join(D, f'game-{path}-e{evo}-d{dpr}-*.png')), key=lambda p: int(re.search(r'-(\d+)-[^-]+\.png$', p).group(1)))
    row = []
    for p in fs:
        pl = re.search(r'-\d+-([^-]+)\.png$', p).group(1)
        im = Image.open(p).convert('RGB'); W, H = im.size; im = im.crop((0, int(H * crop[0]), W, int(H * crop[1])))
        row.append((im.resize((cw, int(im.size[1] * cw / im.size[0])), Image.LANCZOS), pl))
    if row: rows.append((lab, row))
if rows:
    h = rows[0][1][0][0].size[1]; cols = max(len(r) for _, r in rows)
    S = Image.new('RGB', (cols * (cw + 4) + 4, len(rows) * (h + 44) + 4), (6, 10, 26)); d = ImageDraw.Draw(S)
    for j, (lab, row) in enumerate(rows):
        y = 4 + j * (h + 44); d.text((8, y + 2), f'{LAB}, {lab}, {path.upper()} DPR {dpr}', fill=(190, 220, 255), font=F)
        for i, (im, pl) in enumerate(row):
            x = 4 + i * (cw + 4); S.paste(im, (x, y + 22)); d.text((x + 4, y + 24 + h - 18), pl, fill=(255, 255, 255), font=F)
    out = os.path.join(D, f'sheet-game-{path}-d{dpr}.png'); S.save(out); print('sheet', out, len(rows))
