# v398 PR: the shrines and power stones, before (old 2D) and after (repainted), in four lands, plus the bursts
# (shots from tests/_v398-relics.js)  ->  shots/v398-shrines-drops.png
import os
from PIL import Image, ImageDraw, ImageFont
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots')
lands = [('tower12', 'Tower floor 12'), ('tower47', 'Tower floor 47'), ('belfry', 'Drowned Belfry'), ('caldera', 'Blackfire Caldera')]
def crop(p):
    im = Image.open(p).convert('RGB'); w, h = im.size
    return im.crop((0, int(h * 0.2), w, int(h * 0.7)))   # (the pet's middle of the screen: the shrines and stones round it)
cw = 360
try: f = ImageFont.truetype('DejaVuSans-Bold.ttf', 18); fs = ImageFont.truetype('DejaVuSans.ttf', 15)
except Exception: f = fs = ImageFont.load_default()
cells = []
for k, t in lands:
    row = []
    for m in ('before', 'after'):
        p = os.path.join(R, 'v398-rel-%s-%s.png' % (k, m))
        im = crop(p) if os.path.exists(p) else Image.new('RGB', (390, 422), (30, 30, 30))
        row.append(im.resize((cw, round(im.height * cw / im.width)), Image.LANCZOS))
    cells.append((t, row))
ch = cells[0][1][0].height; pad, top, lab = 14, 40, 26
bp = os.path.join(R, 'v398-rel-burst.png'); burst = crop(bp).resize((cw, ch), Image.LANCZOS) if os.path.exists(bp) else None
W = pad + len(cells) * (cw * 2 + pad * 2) ; H = top + lab + ch + pad + (lab + ch + pad if burst else 0)
W = pad + 4 * (cw + pad); H = top + 2 * (lab + ch + pad) + (lab + ch + pad if burst else 0)
sheet = Image.new('RGB', (W, H), (14, 14, 20)); d = ImageDraw.Draw(sheet)
d.text((pad, 10), 'v398  Shrines and power stones: old 2D (top row) / repainted (middle row)', fill=(232, 228, 240), font=f)
for i, (t, (b, a)) in enumerate(cells):
    x = pad + i * (cw + pad)
    d.text((x + 2, top + 4), t + ' - before', fill=(190, 186, 200), font=fs); sheet.paste(b, (x, top + lab))
    y2 = top + lab + ch + pad; d.text((x + 2, y2 + 4), t + ' - after', fill=(232, 228, 240), font=fs); sheet.paste(a, (x, y2 + lab))
if burst:
    y3 = top + 2 * (lab + ch + pad); d.text((pad + 2, y3 + 4), 'a shrine touched and a stone picked up (the bursts)', fill=(232, 228, 240), font=fs); sheet.paste(burst, (pad, y3 + lab))
sheet.save(os.path.join(R, 'v398-shrines-drops.png')); print('wrote shots/v398-shrines-drops.png', sheet.size)
