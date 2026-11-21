# v445 AG: contact sheets of the Gate of Scorpio shots (shots/v445-AG/): before/after (the old 2D courtyard and the rebuilt
# gate), the courtyard (the gazes, a catch, a shadow, a chime, a thread), the great door opening, the sanctum, the fallbacks;
# at DPR 1 and DPR 3
import os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'shots', 'v445-AG')
def font(n):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(f): return ImageFont.truetype(f, n)
    return ImageFont.load_default()
def sheet(rows, out, w=390):
    rows = [[(lab, os.path.join(D, f)) for lab, f in r if os.path.exists(os.path.join(D, f))] for r in rows]
    rows = [r for r in rows if r]
    if not rows: return
    h = int(w * 844 / 390); cols = max(len(r) for r in rows); F = font(18)
    S = Image.new('RGB', (cols * (w + 10) + 10, len(rows) * (h + 40) + 10), (24, 14, 26)); d = ImageDraw.Draw(S)
    for j, r in enumerate(rows):
        for i, (lab, p) in enumerate(r):
            im = Image.open(p).convert('RGB').resize((w, h), Image.LANCZOS); x, y = 10 + i * (w + 10), 10 + j * (h + 40)
            S.paste(im, (x, y + 30)); d.text((x + 4, y + 4), lab, fill=(230, 200, 255), font=F)
    S.save(os.path.join(D, out)); print('wrote', out)
for t in ['dpr1', 'dpr3']:
    sheet([[('BEFORE the old courtyard', f'before-vigil-{t}.png'), ('BEFORE (2)', f'before-vigil2-{t}.png')],
           [('AFTER rifts tab', f'ui-gates-{t}.png'), ('AFTER the vigil', f'vigil-start-{t}.png'), ('AFTER the east wing', f'vigil-east-{t}.png'), ('AFTER the door open', f'door-open-{t}.png'), ('AFTER the sanctum', f'arena-{t}.png')]], f'sheet-before-after-{t}.png')
    sheet([[(n, f'{n}-{t}.png') for n in ['vigil-start', 'vigil-seen', 'vigil-carry', 'vigil-shadow', 'vigil-chime']],
           [(n, f'{n}-{t}.png') for n in ['vigil-thread', 'vigil-east']]], f'sheet-vigil-{t}.png')
    sheet([[(n, f'{n}-{t}.png') for n in ['door-rise', 'door-ignite', 'door-claw', 'door-uncoil', 'door-parting', 'door-open']]], f'sheet-door-{t}.png')
    sheet([[(n, f'{n}-{t}.png') for n in ['arena', 'arena-north', 'arena-west', 'arena-east', 'arena-south']],
           [(n, f'{n}-{t}.png') for n in ['arena-standin', 'arena-lowfx']]], f'sheet-sanctum-{t}.png')
    sheet([[(n, f'{n}-{t}.png') for n in ['nogl-vigil', 'lowfx-vigil', 'nogl-door', 'lowfx-door', 'nogl-arena', 'lowfx-arena']]], f'sheet-fallbacks-{t}.png')
