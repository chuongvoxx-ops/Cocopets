# (v430 BP) before/after contact sheets for Belial's polish: python3 tests/_bp-compose.py [dpr]
#  studio strips (tests/_bp-sheet.js): before-<mode>-d<dpr>.png over after-<mode>-d<dpr>.png -> cmp-<mode>-d<dpr>.png
#  battle frames (tests/_bl-battle.js, OUT=shots/v430-BP/battle): before-k3-d<dpr>-<shot>.png beside after -> cmp-battle-<group>-d<dpr>.png
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'shots', 'v430-BP'); dpr = sys.argv[1] if len(sys.argv) > 1 else '1'
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22); f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except Exception: F = f2 = ImageFont.load_default()
def studio(mode):
    a, b = os.path.join(D, f'before-{mode}-d{dpr}.png'), os.path.join(D, f'after-{mode}-d{dpr}.png')
    if not (os.path.exists(a) and os.path.exists(b)): return
    A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB'); W = 1500; A = A.resize((W, int(A.size[1] * W / A.size[0]))); B = B.resize((W, int(B.size[1] * W / B.size[0])))
    S = Image.new('RGB', (W, A.size[1] + B.size[1] + 80), (6, 8, 16)); d = ImageDraw.Draw(S)
    d.text((12, 8), f'BEFORE (v429) - {mode}', fill=(245, 214, 160), font=F); S.paste(A, (0, 40)); d.text((12, A.size[1] + 48), f'AFTER (v430 BP) - {mode}', fill=(160, 230, 160), font=F); S.paste(B, (0, A.size[1] + 80))
    S.save(os.path.join(D, f'cmp-{mode}-d{dpr}.png')); print('cmp', mode)
for m in ['walk', 'loco', 'idle', 'rush', 'crown', 'carapace', 'stamp', 'ult', 'walkz']: studio(m)
B = os.path.join(D, 'battle')
def battle(name, items, crop=(0.06, 0.82), cw=260):
    rows = []
    for f, lab in items:
        pa, pb = os.path.join(B, f'before-k3-d{dpr}-{f}.png'), os.path.join(B, f'after-k3-d{dpr}-{f}.png')
        if not os.path.exists(pb): continue
        ims = []
        for p in (pa, pb):
            if not os.path.exists(p): ims.append(None); continue
            im = Image.open(p).convert('RGB'); W, H = im.size; im = im.crop((0, int(H * crop[0]), W, int(H * crop[1]))); ims.append(im.resize((cw, int(im.size[1] * cw / im.size[0])), Image.LANCZOS))
        rows.append((ims, lab))
    if not rows: return
    h = rows[0][0][1].size[1]; n = len(rows); cols = min(n, 6)
    S = Image.new('RGB', (cols * (cw + 6) + 90, 2 * (h + 26) + 40 + (h * 2 + 52) * ((n - 1) // cols)), (6, 8, 16)); d = ImageDraw.Draw(S)
    for i, (ims, lab) in enumerate(rows):
        x, y0 = 90 + (i % cols) * (cw + 6), 30 + (i // cols) * (2 * h + 52)
        d.text((x + 2, y0 - 22), lab, fill=(245, 214, 160), font=f2)
        for j, im in enumerate(ims):
            if im is not None: S.paste(im, (x, y0 + j * (h + 20)))
        if i % cols == 0: d.text((6, y0 + h // 2), 'before', fill=(245, 214, 160), font=f2); d.text((6, y0 + h + 20 + h // 2), 'after', fill=(160, 230, 160), font=f2)
    S.save(os.path.join(D, f'cmp-battle-{name}-d{dpr}.png')); print('battle', name, n)
battle('rush', [('5-rush-wind', 'A rush: wind-up'), ('5-rush-charge', 'A charge'), ('5-rush-impact', 'A impact'), ('5-rush-after', 'A after')])
battle('crown', [('6-crown-rise', 'B crown: rise'), ('6-crown-rings', 'B rings'), ('6-crown-press', 'B press'), ('6-crown-end', 'B slam')])
battle('carapace', [('7-carapace-rise', 'C carapace: rise'), ('7-carapace-hold', 'C hold'), ('7-carapace-wave', 'C retaliation')])
battle('stamp', [('8-stamp-1', 'D stampede 1'), ('8-stamp-2', 'D stomps'), ('8-stamp-3', 'D tail'), ('8-stamp-end', 'D crater')])
battle('summon', [('1-sigil', 'summon sigil'), ('2-assemble', 'assemble'), ('3-landed', 'landed'), ('4-roar', 'roar')])
battle('ult', [('10-u1-silence', '1 silence'), ('11-u2-pillars', '2 pillars'), ('12-u2-pillars-up', '2 up'), ('13-u3-heaven', '3 heaven'), ('14-u4-compress', '4 compress'), ('15-u4-silence', '4 silence'),
  ('16-u5-slam', '4 lean in'), ('17-u5-pulse2', 'slam/held'), ('18-u5-column', '5 dominion'), ('19-u6-fall', '5 pulse 2'), ('20-u6-dissolve', '6 dissolve'), ('21-after', '6 dismissal')])
