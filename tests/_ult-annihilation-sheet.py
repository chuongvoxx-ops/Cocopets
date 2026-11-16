# Annihilation's before/after contact sheet (v391 U3): pairs of phone-size frames (390 x 844) for each key beat from
# tests/_ult-annihilation.js (SHOTS=1 PREFIX=before / PREFIX=after), then brightness-boosted crops of the GPU frames round
# each soft layer's outer edge (gain x4 with a lifted gamma: any quad border, cut or cropped layer shows as a line).
# usage: python3 tests/_ult-annihilation-sheet.py   -> shots/ult-annihilation-sheet.png, shots/ult-annihilation-edges.png
import json, os
from PIL import Image, ImageDraw, ImageOps
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots')
info = {s[0]: s for s in json.load(open(os.path.join(D, 'ult-annihilation-after.json')))}
names = [n for n in info]
S = 0.5; w, h = int(390 * S), int(844 * S); lab = 20; per = 4
rows = (len(names) + per - 1) // per
sheet = Image.new('RGB', (per * 2 * w + (per - 1) * 8, rows * (h + lab) + 34), (14, 10, 22)); dr = ImageDraw.Draw(sheet)
dr.text((8, 8), 'Annihilation (Celestial): BEFORE (2D, left of each pair)  |  AFTER (GPU painter, right)   390x844 DPR1', fill=(220, 210, 240))
for i, n in enumerate(names):
    r, c = divmod(i, per); x = c * (2 * w + 8); y = 34 + r * (h + lab)
    for j, v in enumerate(['before', 'after']):
        p = os.path.join(D, 'ult-annihilation-%s-%s.png' % (v, n))
        if os.path.exists(p): sheet.paste(Image.open(p).convert('RGB').resize((w, h), Image.LANCZOS), (x + j * w, y + lab))
    dr.text((x + 4, y + 4), '%s  t=%.2f  %s' % (n, info[n][2], info[n][1]), fill=(230, 220, 255))
sheet.save(os.path.join(D, 'ult-annihilation-sheet.png'))
# the edge crops: where each soft layer fades out (star corona, strike, dome, crown, pillars, circles), boosted
def boost(im): im = im.convert('RGB'); return im.point(lambda v: min(255, int(255 * (v / 255.0) ** 0.7 * 1.35)))
crops = []
def add(n, cx, cy, sz, note):
    p = os.path.join(D, 'ult-annihilation-after-%s.png' % n)
    if not os.path.exists(p): return
    im = Image.open(p); x0 = int(max(0, min(390 - sz, cx - sz / 2))); y0 = int(max(0, min(844 - sz, cy - sz / 2)))
    crops.append((boost(im.crop((x0, y0, x0 + sz, y0 + sz))).resize((260, 260), Image.LANCZOS), '%s %s' % (n, note)))
for n, (_, _, t, ms, X, Y, T, ZC) in info.items():
    SY = Y - ZC * T
    if n.startswith('01'): add(n, X + T * 1.4, Y - T * 1.6, 150, 'pillars')
    if n.startswith('03'): add(n, X - T * 2.2, Y, 150, 'circle rim')
    if n.startswith('05'): add(n, X + T * 1.5, Y - T * 1.4, 150, 'missile trails')
    if n.startswith('06'): add(n, X + T * 1.9, max(SY + T * 0.9, 190), 150, 'star corona edge')
    if n.startswith('07'): add(n, X + T * 1.0, Y - T * 1.6, 150, 'strike beam side')
    if n.startswith('09'): add(n, X - T * 1.5, Y + T * 2.6, 150, 'dome front (floor)')
    if n.startswith('10'): add(n, X + T * 2.2, Y - T * 1.3, 150, 'cloud edge')
    if n.startswith('11'): add(n, X + T * 2.6, max(Y - T * 2.3, 190), 150, 'crown edge')
    if n.startswith('12'): add(n, X, Y, 150, 'aftermath floor')
E = Image.new('RGB', (4 * 268, ((len(crops) + 3) // 4) * 284 + 30), (14, 10, 22)); de = ImageDraw.Draw(E)
de.text((8, 8), 'GPU frames, brightness-boosted crops (gamma 0.7, x1.35): looking for cut edges, quad borders, cropped layers', fill=(220, 210, 240))
for i, (im, note) in enumerate(crops):
    r, c = divmod(i, 4); E.paste(im, (c * 268 + 4, 30 + r * 284 + 20)); de.text((c * 268 + 6, 30 + r * 284 + 4), note, fill=(230, 220, 255))
E.save(os.path.join(D, 'ult-annihilation-edges.png'))
# the edges strip under the sheet as well
full = Image.new('RGB', (max(sheet.width, E.width), sheet.height + E.height), (14, 10, 22)); full.paste(sheet, (0, 0)); full.paste(E, (0, sheet.height)); full.save(os.path.join(D, 'ult-annihilation-sheet.png'))
print('sheet', full.size, 'crops', len(crops))
