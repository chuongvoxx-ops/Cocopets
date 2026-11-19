# (v418 AB) contact sheets from the Abaddon shots: python3 tests/_ab-sheet.py [tag e.g. ab-k3-d1]
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'shots', 'v418-AB')
tag = sys.argv[1] if len(sys.argv) > 1 else 'ab-k3-d1'
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except Exception: F = ImageFont.load_default()
def sheet(name, items, cols, crop=None, cw=300):
    ims = []
    for f, lab in items:
        p = os.path.join(D, f'{tag}-{f}.png')
        if not os.path.exists(p): continue
        im = Image.open(p).convert('RGB')
        if crop: W, H = im.size; im = im.crop((0, int(H * crop[0]), W, int(H * crop[1])))
        im = im.resize((cw, int(im.size[1] * cw / im.size[0])))
        ims.append((im, lab))
    if not ims: return
    h = ims[0][0].size[1]; rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (cols * (cw + 6) + 6, rows * (h + 30) + 6), (6, 8, 16)); d = ImageDraw.Draw(S)
    for i, (im, lab) in enumerate(ims):
        x, y = 6 + (i % cols) * (cw + 6), 6 + (i // cols) * (h + 30); S.paste(im, (x, y)); d.text((x + 4, y + h + 6), lab, fill=(200, 214, 245), font=F)
    S.save(os.path.join(D, f'sheet-{name}-{tag}.png')); print('sheet', name, len(ims))
sheet('summon-abilities', [('1-seal', 'summon: the lunar seal opens'), ('2-descend', 'descends in its sealed shell'), ('3-bloom', 'armour blossoms, Heart ignites'), ('4-carapace', 'A. Lunar Carapace'),
  ('5-reavers-a', 'B. Crescent Reavers: blades out'), ('5-reavers-b', 'B. crossing slashes'), ('5-reavers-c', 'B. chain'), ('5-reavers-d', 'B. final detonation'),
  ('6-tide-a', 'C. Gravitational Tide opens'), ('6-tide-b', 'C. lifted, drawn in'), ('6-tide-c', 'C. helix flow'), ('6-tide-end', 'C. release'),
  ('7-eclipse-seal', 'D. Eclipse Requiem: sealed'), ('7-eclipse-hold', 'D. absorbing'), ('7-eclipse-open', 'D. panels snap open'), ('7-eclipse-wave', 'D. lunar shockwave'), ('8-swipe', 'claw sweep')], 4, (0.08, 0.78))
sheet('ninth-tide', [('9-awaken', 'awakening banner'), ('10-t9-eclipse', '1 Eclipse'), ('11-t9-moon', '2 the Artificial Moon'), ('12-t9-ocean', '3 Reverse the Ocean'), ('13-t9-compress', '4 Lunar Compression'),
  ('14-t9-tide', '5 The Ninth Tide'), ('15-t9-blast', '5 the blast'), ('16-t9-recover', '6 Recovery'), ('17-after', 'after: lunar shield')], 3, (0.05, 0.85))
