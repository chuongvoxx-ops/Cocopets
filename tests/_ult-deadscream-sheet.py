# Dead Scream (v391 U4): the before/after contact sheet -> shots/ult-deadscream-sheet.png
# Reads shots/ds-<before|after>-<moment>.png (tests/_ult-deadscream-shots.js) and shots/ds-after-studio.png.
# Rows: the old 2D picture and the new GPU one at the same moments (phone size, halved); the skull close up, turning (dark
# and pale backdrop; the second row jaw open, mid-scream); brightness-boosted crops (x3.2, gamma 0.55) of the light: any
# hard edge, quad border or cropped layer would show there as a line or a step.
import os
from PIL import Image, ImageDraw, ImageEnhance
S = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots')
M = ['form', 'risen', 'scream', 'wave', 'late', 'jawshut', 'burst', 'shards', 'ash']
W, H, G = 195, 422, 6
def lab(im, s, col=(255, 236, 140)):
    d = ImageDraw.Draw(im); w = 7 * len(s) + 10; d.rectangle((0, 0, w, 16), fill=(0, 0, 0)); d.text((5, 3), s, fill=col); return im
def shot(tag, m):
    p = os.path.join(S, f'ds-{tag}-{m}.png')
    return Image.open(p).convert('RGB') if os.path.exists(p) else Image.new('RGB', (390, 844), (40, 0, 0))
def boost(im):
    lut = [min(255, int(255 * ((v / 255) ** 0.55) * 1.6)) for v in range(256)]
    return ImageEnhance.Brightness(im.point(lut * 3)).enhance(1.25)
rows = []
for tag, name in (('before', 'BEFORE: the 2D version'), ('after', 'AFTER: GPU, 3D skull')):
    r = Image.new('RGB', (len(M) * (W + G), H + 22), (18, 16, 22)); ImageDraw.Draw(r).text((4, 4), name, fill=(255, 255, 255))
    for i, m in enumerate(M): r.paste(lab(shot(tag, m).resize((W, H), Image.LANCZOS), m), (i * (W + G), 22))
    rows.append(r)
st = os.path.join(S, 'ds-after-studio.png')
if os.path.exists(st):
    im = Image.open(st).convert('RGB'); k = (len(M) * (W + G)) / im.width; im = im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS)
    r = Image.new('RGB', (im.width, im.height + 22), (18, 16, 22)); ImageDraw.Draw(r).text((4, 4), 'the skull close up, turning (top: at rest; bottom: jaw open, mid-scream, cracked)', fill=(255, 255, 255)); r.paste(im, (0, 22)); rows.append(r)
# brightness-boosted crops of the after frames: (moment, box in the 390 x 844 frame)
CR = [('risen', (95, 150, 295, 420)), ('scream', (60, 180, 330, 560)), ('wave', (0, 330, 390, 700)), ('late', (95, 150, 295, 420)), ('burst', (20, 200, 370, 620)), ('shards', (40, 180, 350, 600))]
cw = (len(M) * (W + G)) // len(CR) - G
r = Image.new('RGB', (len(M) * (W + G), 0), (18, 16, 22)); crops = []
for m, b in CR:
    im = boost(shot('after', m).crop(b)); k = cw / im.width; im = im.resize((cw, int(im.height * k)), Image.LANCZOS); crops.append(lab(im, m + ' x3.2 boost'))
hh = max(c.height for c in crops); r = Image.new('RGB', (len(M) * (W + G), hh + 22), (18, 16, 22)); ImageDraw.Draw(r).text((4, 4), 'brightness-boosted crops of the GPU frames (edges of every glow, ring, beam and smoke layer)', fill=(255, 255, 255))
for i, c in enumerate(crops): r.paste(c, (i * (cw + G), 22))
rows.append(r)
sh = Image.new('RGB', (max(x.width for x in rows), sum(x.height + 8 for x in rows)), (10, 8, 12)); y = 0
for x in rows: sh.paste(x, (0, y)); y += x.height + 8
out = os.path.join(S, 'ult-deadscream-sheet.png'); sh.save(out); print(out, sh.size)
