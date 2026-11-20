# (v435 SM) contact sheets from the Samael shots: python3 tests/_sm-sheet.py [tag e.g. sm-k3-d1]
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'shots', 'v435-SM')
tag = sys.argv[1] if len(sys.argv) > 1 else 'sm-k3-d1'
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except Exception: F = ImageFont.load_default()
def sheet(name, items, cols, crop=None, cw=300):
    ims = []
    for f, lab in items:
        p = os.path.join(D, f'{tag}-{f}.png')
        if not os.path.exists(p): continue
        im = Image.open(p).convert('RGB')
        if crop: W, H = im.size; im = im.crop((0, int(H * crop[0]), W, int(H * crop[1])))
        im = im.resize((cw, int(im.size[1] * cw / im.size[0])), Image.LANCZOS)
        ims.append((im, lab))
    if not ims: return
    h = ims[0][0].size[1]; rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (cols * (cw + 6) + 6, rows * (h + 30) + 6), (10, 4, 8)); d = ImageDraw.Draw(S)
    for i, (im, lab) in enumerate(ims):
        x, y = 6 + (i % cols) * (cw + 6), 6 + (i // cols) * (h + 30); S.paste(im, (x, y)); d.text((x + 4, y + h + 6), lab, fill=(245, 190, 150), font=F)
    S.save(os.path.join(D, f'sheet-{name}-{tag}.png')); print('sheet', name, len(ims))
sheet('summon-powers', [('1-sigil', 'summon: sigil and portal'), ('2-assemble', 'assembling round the reactor'), ('3-landed', 'the four hooves strike'), ('4-roar', 'roar: combat-ready'),
  ('5-charge-wind', 'A. Hellbreak Charge: wind-up'), ('5-charge-run', 'A. the gallop, burning trail'), ('5-charge-impact', 'A. horn-first impact'), ('5-charge-after', 'A. chained charges'),
  ('6-perd-open', 'B. Horns of Perdition: horns open'), ('6-perd-slash', 'B. a crescent'), ('6-perd-slashes', 'B. crescents through them'), ('6-perd-end', 'B. the cross detonation'),
  ('7-over-brace', 'C. Furnace Overdrive: brace'), ('7-over-ignite', 'C. the reactor unfolds'), ('7-over-corona', 'C. the burning corona'),
  ('8-impact-crouch', 'D. First Impact: compress'), ('8-impact-rise', 'D. the leap'), ('8-impact-hang', 'D. the drill, hanging'), ('8-impact-dive', 'D. the dive'), ('8-impact-hit', 'D. impact'), ('8-impact-after', 'D. shockwaves, spires'),
  ('9-cataclysm', 'Cataclysm State')], 4, (0.08, 0.80))
sheet('wrath', [('10-awaken', 'awakening banner'), ('11-u1-awakening', '1 the Awakening: eclipse'), ('12-u2-seal', '2 the seal breaks: roar'), ('13-u2-crown', '2 the crown, rings of ruin'),
  ('14-u3-launch', '3 Ascension: launch'), ('15-u3-ascend', '3 the trail of flame'), ('16-u4-fallen-star', '4 the Fallen Star, sigils'), ('17-u4-dive', '4 the dive'),
  ('18-u5-impact', '5 impact: the flash'), ('19-u5-fireball', '5 fireball, domes'), ('20-u5-rings', '5 crimson rings, pillar'), ('21-u5-burst', '5 the final burst'),
  ('22-u6-remains', '6 the god remains'), ('23-u6-roar', '6 the last roar'), ('24-u6-dissolve', '6 dissolving, reactor last'), ('25-after', 'gone')], 4, (0.05, 0.85))
# before (the live version's Aries Anima) / after (Samael remade), side by side: python3 tests/_sm-sheet.py ba <dpr>
if tag == 'ba':
    d = sys.argv[2] if len(sys.argv) > 2 else '1'
    pairs = [('1-summon', '3-landed', 'summoned'), ('2-fight', '5-charge-run', 'fighting'), ('3-fight', '8-impact-hit', 'its power'), ('4-finale', '18-u5-impact', 'finisher'), ('5-finale', '20-u5-rings', 'finisher, later')]
    ims = []
    for b, a, lab in pairs:
        pb, pa = os.path.join(D, f'before-k3-d{d}-{b}.png'), os.path.join(D, f'sm-k3-d{d}-{a}.png')
        if not (os.path.exists(pb) and os.path.exists(pa)): continue
        ib, ia = [Image.open(p).convert('RGB') for p in (pb, pa)]
        cw = 300; ib = ib.resize((cw, int(ib.size[1] * cw / ib.size[0])), Image.LANCZOS); ia = ia.resize((cw, int(ia.size[1] * cw / ia.size[0])), Image.LANCZOS); ims.append((ib, ia, lab))
    if ims:
        h = ims[0][0].size[1]; S = Image.new('RGB', (len(ims) * 306 + 6, 2 * (h + 30) + 6), (10, 4, 8)); dr = ImageDraw.Draw(S)
        for i, (ib, ia, lab) in enumerate(ims):
            x = 6 + i * 306; S.paste(ib, (x, 6)); dr.text((x + 4, h + 10), 'BEFORE (live): ' + lab, fill=(200, 200, 220), font=F); S.paste(ia, (x, h + 36)); dr.text((x + 4, 2 * h + 40), 'AFTER: ' + lab, fill=(245, 190, 150), font=F)
        S.save(os.path.join(D, f'sheet-before-after-d{d}.png')); print('sheet before-after', len(ims))
