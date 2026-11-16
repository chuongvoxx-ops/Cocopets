# Dead Scream (v391 U4): the 2D picture over the GPU one, at the same beats -> shots/ult-deadscream-match.png
# Both rows come from the same build and the same seeded game (tests/_ult-deadscream-shots.js with SEED=5, TAG=m2d GPU=0
# and TAG=mgpu GPU=1): the same pet, map, monsters and moments; only the picture differs. Then the skull close up, the 2D
# and the GPU side by side at three beats, and the GPU model turning (ds-mgpu-studio.png).
import os
from PIL import Image, ImageDraw
S = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots')
M = ['form', 'risen', 'scream', 'wave', 'late', 'jawshut', 'burst', 'shards', 'ash']
W, H, G = 195, 422, 6
def lab(im, s):
    d = ImageDraw.Draw(im); d.rectangle((0, 0, 7 * len(s) + 10, 16), fill=(0, 0, 0)); d.text((5, 3), s, fill=(255, 236, 140)); return im
def shot(tag, m):
    p = os.path.join(S, f'ds-{tag}-{m}.png')
    return Image.open(p).convert('RGB') if os.path.exists(p) else Image.new('RGB', (390, 844), (40, 0, 0))
rows = []
for tag, name in (('m2d', 'the 2D picture (the original)'), ('mgpu', 'the GPU picture: the 3D skull in the 2D look, the same effects (same build, same seeded game, same beats)')):
    r = Image.new('RGB', (len(M) * (W + G), H + 22), (18, 16, 22)); ImageDraw.Draw(r).text((4, 4), name, fill=(255, 255, 255))
    for i, m in enumerate(M): r.paste(lab(shot(tag, m).resize((W, H), Image.LANCZOS), m), (i * (W + G), 22))
    rows.append(r)
# the skull close up: 2D | GPU at three beats
box = (95, 95, 295, 345); cw = (len(M) * (W + G)) // 6 - G
r = Image.new('RGB', (len(M) * (W + G), 0)); tiles = []
for m in ('risen', 'scream', 'late'):
    for tag, nm in (('m2d', '2D'), ('mgpu', 'GPU')):
        im = shot(tag, m).crop(box); im = im.resize((cw, int(im.height * cw / im.width)), Image.LANCZOS); tiles.append(lab(im, f'{m} {nm}'))
hh = max(t.height for t in tiles); r = Image.new('RGB', (len(M) * (W + G), hh + 22), (18, 16, 22)); ImageDraw.Draw(r).text((4, 4), 'the skull close up: 2D | GPU, at the same moments', fill=(255, 255, 255))
for i, t in enumerate(tiles): r.paste(t, (i * (cw + G), 22))
rows.append(r)
st = os.path.join(S, 'ds-mgpu-studio.png')
if os.path.exists(st):
    im = Image.open(st).convert('RGB'); k = (len(M) * (W + G)) / im.width; im = im.resize((int(im.width * k), int(im.height * k)), Image.LANCZOS)
    r = Image.new('RGB', (im.width, im.height + 22), (18, 16, 22)); ImageDraw.Draw(r).text((4, 4), 'the GPU skull turning (top: at rest; bottom: mid-scream, jaw open)', fill=(255, 255, 255)); r.paste(im, (0, 22)); rows.append(r)
sh = Image.new('RGB', (max(x.width for x in rows), sum(x.height + 8 for x in rows)), (10, 8, 12)); y = 0
for x in rows: sh.paste(x, (0, y)); y += x.height + 8
out = os.path.join(S, 'ult-deadscream-match.png'); sh.save(out); print(out, sh.size)
