# (v451 TM, v454 TM2) contact sheets from Tiamat's shots (tests/_tm-shots.js): one sheet per path and DPR, a row per tier, a column per phase.
# usage: python3 tests/_tm-sheet.py [gl|2d] [dpr]
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', os.environ.get('SHOTDIR', 'v454-TM2'))
path = sys.argv[1] if len(sys.argv) > 1 else 'gl'
dpr = sys.argv[2] if len(sys.argv) > 2 else '1'
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 14)
except Exception: F = ImageFont.load_default()
PH = [('01-forks', 'forks converge'), ('02-form', 'forming'), ('03-hover', 'swims'), ('04-roar', 'roar'), ('05-charge', 'charge to jaws'), ('06-fold', 'gathers'),
      ('07-dive', 'dive'), ('08-impact', 'IMPACT'), ('09-pulse', 'pulse 1'), ('10-pulses', 'last pulse'), ('11-fade', 'fades')]
TIERS = [('1', 'Base (1 pulse)'), ('4', 'Adept (2 pulses)'), ('7', 'Celestial (3 pulses)')]
cw, crop = 200, (0.0, 0.78)
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
    S = Image.new('RGB', (cols * (cw + 4) + 4, len(rows) * (h + 44) + 4), (8, 8, 24)); d = ImageDraw.Draw(S)
    for j, (lab, row) in enumerate(rows):
        y = 4 + j * (h + 44); d.text((8, y + 2), f'Tiamat, {lab}, {path.upper()} DPR {dpr}', fill=(200, 210, 255), font=F)
        for i, (im, pl) in enumerate(row):
            x = 4 + i * (cw + 4); S.paste(im, (x, y + 22)); d.text((x + 4, y + 24 + h - 18), pl, fill=(255, 255, 255), font=F)
    out = os.path.join(D, f'sheet-game-{path}-d{dpr}.png'); S.save(out); print('sheet', out, len(rows))
