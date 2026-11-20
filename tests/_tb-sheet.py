# (v429 TB) contact sheets from Belial's boss shots: python3 tests/_tb-sheet.py [tag: tb-d1 | tb-d3]
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'shots', 'v429-TB')
tag = sys.argv[1] if len(sys.argv) > 1 else 'tb-d1'
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
    S = Image.new('RGB', (cols * (cw + 6) + 6, rows * (h + 30) + 6), (18, 12, 8)); d = ImageDraw.Draw(S)
    for i, (im, lab) in enumerate(ims):
        x, y = 6 + (i % cols) * (cw + 6), 6 + (i // cols) * (h + 30); S.paste(im, (x, y)); d.text((x + 4, y + h + 6), lab, fill=(250, 226, 170), font=F)
    S.save(os.path.join(D, f'sheet-{name}-{tag}.png')); print('sheet', name, len(ims))
sheet('intro-powers', [('01-intro-sigil', 'intro: the sigil, pillars rising'), ('02-intro-assembly', 'intro: it assembles'), ('03-intro-roar', 'intro: the roar, BELIAL'), ('04-fight', 'the fight: bars, phase pips'),
  ('05-rush-lane', 'Rush: the lane of light'), ('06-rush-charge', 'Rush: the charge'), ('07-rush-impact', 'Rush: the horn thrust'), ('08-crown-open', 'Crown: the field opens'),
  ('09-crown-pull', 'Crown: rings down, pulled'), ('10-carapace-storing', 'Carapace: struck, storing'), ('11-carapace-broken', 'Carapace broken: stagger'), ('12-carapace-release', 'Carapace: its reach, full'),
  ('13-carapace-wave', 'Carapace: the retaliation'), ('14-stampede-ring', 'Stampede: reach, a ring'), ('15-stampede-rocks', 'Stampede: rocks on rings'), ('16-tail-tell', 'tail: its crescent tell')], 4)
sheet('dominion-phases-defeat', [('17-tail-sweep', 'tail: the sweep'), ('18-phase2', 'phase II'), ('19-dominion-pillars', 'Dominion: pillars, their lee'), ('20-dominion-weight', 'Dominion: the weight of heaven'),
  ('21-dominion-compression', 'Dominion: compression'), ('22-dominion-slam', 'Dominion: the slam (sheltered)'), ('23-dominion-pulse', 'Dominion: the second pulse'), ('24-phase3-overlap', 'phase III: stampede + crown'),
  ('25-defeat-crumble', 'defeat: the citadel crumbles'), ('26-defeat-dissolve', 'defeat: into gold'), ('27-defeat-dust', 'defeat: gold dust'), ('28-won', 'the trial won'), ('29-anima', 'Taurus answers: unlocked')], 4)
