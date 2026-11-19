# (v420 CB) contact sheets from Abaddon's boss shots: python3 tests/_cb-sheet.py [tag: cb-d1 | cb-d3]
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'shots', 'v420-CB')
tag = sys.argv[1] if len(sys.argv) > 1 else 'cb-d1'
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except Exception: F = ImageFont.load_default()
def sheet(name, items, cols, cw=300):
    ims = []
    for f, lab in items:
        p = os.path.join(D, f'{tag}-{f}.png')
        if not os.path.exists(p): continue
        im = Image.open(p).convert('RGB'); im = im.resize((cw, int(im.size[1] * cw / im.size[0]))); ims.append((im, lab))
    if not ims: return
    h = ims[0][0].size[1]; rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (cols * (cw + 6) + 6, rows * (h + 30) + 6), (8, 6, 18)); d = ImageDraw.Draw(S)
    for i, (im, lab) in enumerate(ims):
        x, y = 6 + (i % cols) * (cw + 6), 6 + (i // cols) * (h + 30); S.paste(im, (x, y)); d.text((x + 4, y + h + 6), lab, fill=(214, 204, 250), font=F)
    S.save(os.path.join(D, f'sheet-{name}-{tag}.png')); print('sheet', name, len(ims))
sheet('intro-powers', [('01-intro-seal', 'intro: the lunar seal, the descent'), ('02-intro-bloom', 'intro: it unfolds'), ('03-intro-name', 'intro: ABADDON'), ('04-fight', 'the fight: bars, phase pips'),
  ('05-reavers-tell', 'Reavers: the glowing paths'), ('06-reavers-blades', 'Reavers: the blades'), ('07-tide-open', 'Tide: the field opens'), ('08-tide-lift', 'Tide: lifted, dragged in'),
  ('09-carapace', 'Carapace: the shell soaks'), ('10-carapace-broken', 'Carapace broken: stagger'), ('11-eclipse-seal', 'Eclipse: sealed, storing'), ('12-eclipse-requiem', 'Eclipse: the Requiem'),
  ('13-claw-tell', 'claw: its tell'), ('14-claw-sweep', 'claw: the sweep')], 4)
sheet('tide-phases-defeat', [('15-phase2', 'phase II'), ('16-t9-pockets', 'Ninth Tide: moonlight pockets'), ('17-t9-sea', 'Ninth Tide: the sea lifted'), ('18-t9-compress', 'Ninth Tide: compression'),
  ('19-t9-blast', 'Ninth Tide: the blast (sheltered)'), ('20-phase3-overlap', 'phase III: Tide + Reavers'), ('21-defeat-falls', 'defeat: it falls'), ('22-defeat-bloom', 'defeat: into light'), ('23-won', 'the trial won')], 3)
