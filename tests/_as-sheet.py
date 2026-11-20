# (v436 AS) contact sheets from the Asmodeus shots: python3 tests/_as-sheet.py [tag e.g. as-k3-d1]
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v436-AS')
tag = sys.argv[1] if len(sys.argv) > 1 else 'as-k3-d1'
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
    S = Image.new('RGB', (cols * (cw + 6) + 6, rows * (h + 30) + 6), (12, 4, 10)); d = ImageDraw.Draw(S)
    for i, (im, lab) in enumerate(ims):
        x, y = 6 + (i % cols) * (cw + 6), 6 + (i // cols) * (h + 30); S.paste(im, (x, y)); d.text((x + 4, y + h + 6), lab, fill=(245, 180, 200), font=F)
    S.save(os.path.join(D, f'sheet-{name}-{tag}.png')); print('sheet', name, len(ims))
sheet('summon-powers', [('01-sigil', 'summon: the Scorpio sigil'), ('02-cocoon', 'the cocoon rises'), ('03-unfold', 'stingers unfold'), ('04-shatter', 'the cocoon shatters'), ('05-rise', 'legs, torso, Crucible'), ('06-crown', 'the crown spreads: ready'),
  ('07-perd-rise', 'A. Perdition: tails rise, lit'), ('07-perd-strike', 'A. a stinger strikes'), ('07-perd-strikes', 'A. strikes in turn'), ('07-perd-end', 'A. L7: seven impale'),
  ('08-lab-cast', 'B. Labyrinth: filaments'), ('08-lab-web', 'B. the web, spikes'), ('08-lab-hold', 'B. slowed, pulled'), ('08-lab-late', 'B. tightening'),
  ('09-molt-fold', 'C. Molt: folded, cracking'), ('09-molt-vanish', 'C. the shell, it vanishes'), ('09-molt-strike', 'C. strike from behind'), ('09-molt-blow', 'C. the shells burst'),
  ('10-rupt-conv', 'D. Rupture: tails converge'), ('10-rupt-crystal', 'D. the crystal swells'), ('10-rupt-shatter', 'D. shattered'), ('10-rupt-waves', 'D. waves of blades'), ('10-rupt-end', 'D. L7 eruption')], 4, (0.1, 0.8))
sheet('sin', [('11-awaken', 'awakening'), ('12-u1-seals', '1 the Seven Seals'), ('13-u1-crown', '1 the crown rises'), ('14-u2-cathedral', '2 the Scarlet Cathedral'), ('15-u2-rings', '2 rings, filaments'),
  ('16-u3-bloom', '3 the Crucible opens'), ('17-u3-flower', '3 the Forbidden Bloom'), ('18-u4-sting1', '4 the first sting'), ('19-u4-sting4', '4 strikes 2-4'), ('20-u4-seventh', '4 the seventh: all'),
  ('21-u5-collapse', '5 the collapse'), ('22-u5-detonation', '5 the detonation'), ('23-u5-testament', '5 the Crimson Testament'), ('24-u6-whisper', '6 the Last Whisper'), ('25-u6-dissolve', '6 legs first, Crucible last'), ('26-after', 'gone')], 4, (0.05, 0.85))
