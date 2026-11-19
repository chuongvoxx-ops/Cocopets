# (v426 BL) contact sheets from the Belial shots: python3 tests/_bl-sheet.py [tag e.g. bl-k3-d1]
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'shots', 'v426-BL')
tag = sys.argv[1] if len(sys.argv) > 1 else 'bl-k3-d1'
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
    S = Image.new('RGB', (cols * (cw + 6) + 6, rows * (h + 30) + 6), (6, 8, 16)); d = ImageDraw.Draw(S)
    for i, (im, lab) in enumerate(ims):
        x, y = 6 + (i % cols) * (cw + 6), 6 + (i // cols) * (h + 30); S.paste(im, (x, y)); d.text((x + 4, y + h + 6), lab, fill=(245, 214, 160), font=F)
    S.save(os.path.join(D, f'sheet-{name}-{tag}.png')); print('sheet', name, len(ims))
sheet('summon-abilities', [('1-sigil', 'summon: the Taurus sigil, pillars break out'), ('2-assemble', 'assembles from the sky'), ('3-landed', 'lands: pressure wave'), ('4-roar', 'roar'),
  ('5-rush-wind', 'A. Thronebreaker Rush: wind-up'), ('5-rush-charge', 'A. the charge, footfalls'), ('5-rush-impact', 'A. impact'), ('5-rush-after', 'A. shockwave, debris'),
  ('6-crown-rise', 'B. Crown of Burdens: rings rise'), ('6-crown-rings', 'B. rings over the crowd'), ('6-crown-press', 'B. pressing, slowed'), ('6-crown-end', 'B. the slam'),
  ('7-carapace-rise', 'C. Citadel Carapace: dome'), ('7-carapace-hold', 'C. storing the blows'), ('7-carapace-wave', 'C. retaliation wave'),
  ('8-stamp-1', 'D. Graviton Stampede: 1'), ('8-stamp-2', 'D. stomps, rocks'), ('8-stamp-3', 'D. tail anchor'), ('8-stamp-end', 'D. crater')], 4, (0.08, 0.80))
sheet('dominion', [('9-awaken', 'awakening banner'), ('10-u1-silence', '1 silence (1.1 s)'), ('11-u2-pillars', '2 the World Pillars rise (2.7 s)'), ('12-u2-pillars-up', '2 pillars up (3.6 s)'),
  ('13-u3-heaven', '3 the weight of heaven (5.1 s)'), ('14-u4-compress', '4 compression (6.5 s)'), ('15-u4-silence', '4 compressing (7.05 s)'), ('16-u5-slam', '4 pillars lean in (7.3 s)'),
  ('17-u5-pulse2', '4 the held breath (7.95 s)'), ('18-u5-column', '5 DOMINION: the slam (8.5 s)'), ('19-u6-fall', '5 the second pulse (9.5 s)'), ('20-u6-dissolve', '6 pillars to light, dissolve (10.4 s)'), ('21-after', '6 dismissal (11.6 s)')], 4, (0.05, 0.85))
