# v420 GC: contact sheets of the Gate of Cancer shots (shots/v420-GC/): before/after and the whole gate, at DPR 1 and DPR 3
import os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'shots', 'v420-GC')
def font(n):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(f): return ImageFont.truetype(f, n)
    return ImageFont.load_default()
def sheet(rows, out, w=390):
    rows = [[(lab, os.path.join(D, f)) for lab, f in r if os.path.exists(os.path.join(D, f))] for r in rows]
    rows = [r for r in rows if r]
    if not rows: return
    h = int(w * 844 / 390); cols = max(len(r) for r in rows); F = font(18)
    S = Image.new('RGB', (cols * (w + 10) + 10, len(rows) * (h + 40) + 10), (24, 16, 40)); d = ImageDraw.Draw(S)
    for j, r in enumerate(rows):
        for i, (lab, p) in enumerate(r):
            im = Image.open(p).convert('RGB').resize((w, h), Image.LANCZOS); x, y = 10 + i * (w + 10), 10 + j * (h + 40)
            S.paste(im, (x, y + 30)); d.text((x + 4, y + 4), lab, fill=(236, 226, 255), font=F)
    S.save(os.path.join(D, out)); print('wrote', out)
for t in ['dpr1', 'dpr3']:
    sheet([[('BEFORE ' + n, f'before-{n}-{t}.png') for n in ['chamber', 'clam-open', 'win', 'win']],
           [('AFTER ' + n, f'{f}-{t}.png') for n, f in [('chamber', 'chamber'), ('clam-open', 'clam-open'), ('arena', 'arena'), ('arena + boss', 'arena-boss')]]], f'sheet-before-after-{t}.png')
    sheet([[(n, f'{n}-{t}.png') for n in ['chamber', 'chamber-pools', 'clam-open', 'door-seam', 'door-parting']],
           [(n, f'{n}-{t}.png') for n in ['door-light', 'door-open', 'arena', 'arena-north', 'arena-west']],
           [(n, f'{n}-{t}.png') for n in ['arena-south', 'arena-lowfx', 'arena-won', 'arena-boss', 'arena-boss-2']]], f'sheet-gate-{t}.png')
