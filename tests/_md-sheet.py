# (v450 MD) contact sheets from Moby Dick's shots (tests/_md-shots.js): one sheet per path and DPR, a row per tier, a column per phase.
# usage: python3 tests/_md-sheet.py [gl|2d] [dpr]
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v450-MD')
path = sys.argv[1] if len(sys.argv) > 1 else 'gl'
dpr = sys.argv[2] if len(sys.argv) > 2 else '1'
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
except Exception: F = ImageFont.load_default()
PH = [('1-spread', 'water spreads'), ('2-shadow', 'shadow below'), ('3-breach', 'breach'), ('4-apex', 'apex'), ('5-roll', 'on its side'), ('6-slam', 'SLAM'),
      ('7-ring', 'ring 1'), ('8-rings', 'rings'), ('9-dissolve', 'dissolves'), ('10-recede', 'water recedes')]
TIERS = [('1', 'Base (1 ring)'), ('4', 'Adept (2 rings)'), ('7', 'Celestial (3 rings)')]
cw, crop = 220, (0.07, 0.72)
rows = []
for evo, lab in TIERS:
    row = []
    for ph, pl in PH:
        p = os.path.join(D, f'game-{path}-e{evo}-d{dpr}-{ph}.png')
        if not os.path.exists(p): continue
        im = Image.open(p).convert('RGB'); W, H = im.size; im = im.crop((0, int(H * crop[0]), W, int(H * crop[1])))
        row.append((im.resize((cw, int(im.size[1] * cw / im.size[0])), Image.LANCZOS), pl))
    if row: rows.append((lab, row))
if rows:
    h = rows[0][1][0][0].size[1]; cols = max(len(r) for _, r in rows)
    S = Image.new('RGB', (cols * (cw + 4) + 4, len(rows) * (h + 44) + 4), (6, 10, 26)); d = ImageDraw.Draw(S)
    for j, (lab, row) in enumerate(rows):
        y = 4 + j * (h + 44); d.text((8, y + 2), f'Moby Dick, {lab}, {path.upper()} DPR {dpr}', fill=(190, 220, 255), font=F)
        for i, (im, pl) in enumerate(row):
            x = 4 + i * (cw + 4); S.paste(im, (x, y + 22)); d.text((x + 4, y + 24 + h - 18), pl, fill=(255, 255, 255), font=F)
    out = os.path.join(D, f'sheet-game-{path}-d{dpr}.png'); S.save(out); print('sheet', out, len(rows))
