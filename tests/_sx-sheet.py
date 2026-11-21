# (v445 SB) contact sheets from Asmodeus's boss shots: python3 tests/_sx-sheet.py [tag: sx-d1 | sx-d2 | sx-d1L]
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'shots', 'v445-SB')
tag = sys.argv[1] if len(sys.argv) > 1 else 'sx-d1'
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
    S = Image.new('RGB', (cols * (cw + 6) + 6, rows * (h + 30) + 6), (16, 8, 14)); d = ImageDraw.Draw(S)
    for i, (im, lab) in enumerate(ims):
        x, y = 6 + (i % cols) * (cw + 6), 6 + (i // cols) * (h + 30); S.paste(im, (x, y)); d.text((x + 4, y + h + 6), lab, fill=(255, 200, 220), font=F)
    S.save(os.path.join(D, f'sheet-{name}-{tag}.png')); print('sheet', name, len(ims))
sheet('intro-perdition-rupture', [('01-intro-sigil', 'intro: the sigil'), ('02-intro-cocoon', 'intro: the cocoon'), ('03-intro-crown', 'intro: the crown, ASMODEUS'), ('04-fight', 'the fight: bars, debt, stingers'),
  ('05-perd-marks', 'Perdition: marks under the pet'), ('06-perd-strikes', 'Perdition: the strikes'), ('07-pin', 'the pinned stinger'), ('08-stinger-break', 'a stinger breaks'),
  ('09-exposed', 'EXPOSED: the Crucible bared'), ('10-rupt-crystal', 'Rupture: crystal, spines, lee'), ('11-rupt-rings', 'Rupture: the blades (in a lee)'), ('12-rupt-rings2', 'Rupture: the rings roll'),
  ('21-lash-tell', 'Tail Lash: the arc'), ('22-perd-seven-mark', 'Perdition III: seven-at-once mark'), ('23-perd-seven', 'Perdition III: the impale')], 4)
sheet('web-molt-debt-sin', [('13-web', 'Labyrinth: threads, gaps, knots'), ('14-web-turned', 'Labyrinth: the web turns'), ('15-molt-hunt', 'Molt: the shells, the real one'), ('16-molt-ambush-tell', 'Molt: the ambush glint'),
  ('17-molt-ambush', 'Molt: the ambush'), ('18-molt-shell-cracks', 'Molt: a shell cracks'), ('19-seal-starlight', 'the seal ripens, starlight'), ('20-purified', 'purified in the starlight'),
  ('24-sin-seals', 'The Seventh Sin: the seals'), ('25-sin-bloom', 'the Forbidden Bloom'), ('26-sin-strikes', 'the Seventh Sting: marks'), ('27-sin-before-testament', 'in a seal before the Testament'),
  ('28-testament', 'the Crimson Testament'), ('29-fall', 'the Last Whisper'), ('30-dissolve', 'it dissolves'), ('31-won', 'the trial won')], 4)
