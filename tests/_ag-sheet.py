# v435 AG: contact sheets of the Gate of Aries shots (shots/v435-AG/): before/after (the UI: the Rifts tab and the world map,
# where the gate now appears), the switchyard and the door, the altar, the fallbacks; at DPR 1 and DPR 3
import os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(__file__), '..', 'shots', 'v435-AG')
def font(n):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(f): return ImageFont.truetype(f, n)
    return ImageFont.load_default()
def sheet(rows, out, w=390):
    rows = [[(lab, os.path.join(D, f)) for lab, f in r if os.path.exists(os.path.join(D, f))] for r in rows]
    rows = [r for r in rows if r]
    if not rows: return
    h = int(w * 844 / 390); cols = max(len(r) for r in rows); F = font(18)
    S = Image.new('RGB', (cols * (w + 10) + 10, len(rows) * (h + 40) + 10), (30, 18, 16)); d = ImageDraw.Draw(S)
    for j, r in enumerate(rows):
        for i, (lab, p) in enumerate(r):
            im = Image.open(p).convert('RGB').resize((w, h), Image.LANCZOS); x, y = 10 + i * (w + 10), 10 + j * (h + 40)
            S.paste(im, (x, y + 30)); d.text((x + 4, y + 4), lab, fill=(255, 210, 170), font=F)
    S.save(os.path.join(D, out)); print('wrote', out)
for t in ['dpr1', 'dpr3']:
    sheet([[('BEFORE rifts tab', f'before-ui-gates-{t}.png'), ('BEFORE world map', f'before-map-caldera-{t}.png')],
           [('AFTER rifts tab (locked)', f'ui-locked-{t}.png'), ('AFTER rifts tab (open)', f'ui-gates-{t}.png'), ('AFTER world map', f'map-caldera-{t}.png'), ('AFTER gate card', f'map-gate-{t}.png'), ('AFTER the gate', f'yard1-{t}.png')]], f'sheet-before-after-{t}.png')
    sheet([[(n, f'{n}-{t}.png') for n in ['yard1', 'yard1-ember', 'yard1-quench', 'yard1-furnace', 'yard2-kiln']],
           [(n, f'{n}-{t}.png') for n in ['yard3-loop', 'yard3-braziers', 'door-climb', 'door-bar', 'door-parting']],
           [(n, f'{n}-{t}.png') for n in ['door-open']]], f'sheet-yard-{t}.png')
    sheet([[(n, f'{n}-{t}.png') for n in ['arena', 'arena-north', 'arena-west', 'arena-east', 'arena-south']],
           [(n, f'{n}-{t}.png') for n in ['arena-standin', 'arena-lowfx']]], f'sheet-altar-{t}.png')
    sheet([[(n, f'{n}-{t}.png') for n in ['nogl-yard', 'lowfx-yard', 'nogl-arena', 'lowfx-arena']]], f'sheet-fallbacks-{t}.png')
