# (v435 SB) contact sheets from Samael's boss shots: python3 tests/_sb-sheet.py [tag: sb-d1 | sb-d3]
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'shots', 'v435-SB')
tag = sys.argv[1] if len(sys.argv) > 1 else 'sb-d1'
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
    S = Image.new('RGB', (cols * (cw + 6) + 6, rows * (h + 30) + 6), (18, 10, 8)); d = ImageDraw.Draw(S)
    for i, (im, lab) in enumerate(ims):
        x, y = 6 + (i % cols) * (cw + 6), 6 + (i // cols) * (h + 30); S.paste(im, (x, y)); d.text((x + 4, y + h + 6), lab, fill=(255, 214, 170), font=F)
    S.save(os.path.join(D, f'sheet-{name}-{tag}.png')); print('sheet', name, len(ims))
sheet('intro-powers', [('01-intro-sigil', 'intro: sigil, portal'), ('02-intro-assembly', 'intro: it assembles'), ('03-intro-roar', 'intro: the roar, SAMAEL'), ('04-fight', 'the fight: bars, Ruin'),
  ('05-charge-lane', 'Charge: the lane of light'), ('06-charge-gallop', 'Charge: the gallop'), ('07-charge-impact', 'Charge: horns, shockwave'), ('08-perd-tell', 'Perdition: the fan, its gap'),
  ('09-perd-crescents', 'Perdition: the crescents'), ('10-perd-cross-mark', 'Perdition III: the cross mark'), ('11-perd-cross-blast', 'Perdition III: the cross'), ('12-over-tell', 'Overdrive: the corona drawn'),
  ('13-over-corona', 'Overdrive: burning'), ('14-impact-hang', 'Impact: the hang, the spot'), ('15-impact-landing', 'Impact: the landing'), ('16-impact-rings', 'Impact: rings with gaps')], 4)
sheet('state-wrath-fall', [('17-impact-spires', 'Impact: spires, their lee'), ('18-vent', 'the vent: the heart bared'), ('19-vent-heart-struck', 'the vent: the heart struck'), ('20-cataclysm', 'the Cataclysm State'),
  ('21-cataclysm-charge-lane', 'Cataclysm: a charge'), ('22-phase2-roar', 'phase II: the roar\'s ring'), ('23-phase3-cataclysm', 'phase III: Cataclysm'), ('24-wrath-awakening', 'Wrath: the refuges'),
  ('25-wrath-seal', 'Wrath: the seal breaks'), ('26-wrath-ascension', 'Wrath: the ascension'), ('27-wrath-fallen-star', 'Wrath: the Fallen Star'), ('28-wrath-impact', 'Wrath: impact (sheltered)'),
  ('29-wrath-after', 'Wrath: after'), ('30-fall-roar', 'the fall: the last roar'), ('31-fall-dissolve', 'the fall: into embers'), ('32-won', 'the trial won'), ('33-anima', 'Samael answers: unlocked')], 4)
