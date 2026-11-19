# v426 TG: contact sheets of the Gate of Taurus shots (shots/v426-TG/): before/after and the whole gate, at DPR 1 and DPR 3
import os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'shots', 'v426-TG')
def font(n):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(f): return ImageFont.truetype(f, n)
    return ImageFont.load_default()
def sheet(rows, out, w=390):
    rows = [[(lab, os.path.join(D, f)) for lab, f in r if os.path.exists(os.path.join(D, f))] for r in rows]
    rows = [r for r in rows if r]
    if not rows: return
    h = int(w * 844 / 390); cols = max(len(r) for r in rows); F = font(18)
    S = Image.new('RGB', (cols * (w + 10) + 10, len(rows) * (h + 40) + 10), (30, 22, 36)); d = ImageDraw.Draw(S)
    for j, r in enumerate(rows):
        for i, (lab, p) in enumerate(r):
            im = Image.open(p).convert('RGB').resize((w, h), Image.LANCZOS); x, y = 10 + i * (w + 10), 10 + j * (h + 40)
            S.paste(im, (x, y + 30)); d.text((x + 4, y + 4), lab, fill=(255, 230, 190), font=F)
    S.save(os.path.join(D, out)); print('wrote', out)
for t in ['dpr1', 'dpr3']:
    sheet([[('BEFORE ' + n, f'before-{n}-{t}.png') for n in ['chamber', 'mid-trace', 'win']],
           [('AFTER ' + n, f'{f}-{t}.png') for n, f in [('chamber', 'chamber'), ('mid-trace', 'puzzle-mid-trace'), ('door open', 'door-open'), ('arena', 'arena'), ('arena north', 'arena-north')]]], f'sheet-before-after-{t}.png')
    sheet([[(n, f'{n}-{t}.png') for n in ['chamber', 'chamber-north', 'puzzle-mid-trace', 'puzzle-bridge', 'door-seam']],
           [(n, f'{n}-{t}.png') for n in ['door-parting', 'door-light', 'door-open', 'arena', 'arena-north']],
           [(n, f'{n}-{t}.png') for n in ['arena-west', 'arena-east', 'arena-south', 'arena-won', 'arena-lowfx']],
           [(n, f'{n}-{t}.png') for n in ['lowfx-mid-trace', 'nogl-mid-trace']]], f'sheet-gate-{t}.png')
