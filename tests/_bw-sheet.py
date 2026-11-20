# v430 BW: contact sheets for the Belfry's drains and doors, before (git HEAD) and after, from the frames the _bw-*.js
# scripts wrote into a scratch dir: python3 tests/_bw-sheet.py <frames dir> <out dir>
import sys, os, glob
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except Exception: F = ImageFont.load_default()

def sheet(rows, name, crop=None, cw=None):
    rows = [(lab, [f for f in fs if os.path.exists(f)]) for lab, fs in rows]; rows = [r for r in rows if r[1]]
    if not rows: return None
    ims = [[Image.open(f).convert('RGB') for f in fs] for _, fs in rows]
    if crop: ims = [[im.crop(tuple(int(v * im.size[0] / 390) for v in crop)) for im in r] for r in ims]
    if cw: ims = [[im.resize((cw, int(im.size[1] * cw / im.size[0]))) for im in r] for r in ims]
    w = max(im.size[0] for r in ims for im in r); h = max(im.size[1] for r in ims for im in r); n = max(len(r) for r in ims)
    S = Image.new('RGB', (n * (w + 6) + 6, len(ims) * (h + 30) + 6), (16, 20, 22)); d = ImageDraw.Draw(S)
    for j, ((lab, fs), r) in enumerate(zip(rows, ims)):
        for i, (f, im) in enumerate(zip(fs, r)):
            x, y = 6 + i * (w + 6), 6 + j * (h + 30); S.paste(im, (x, y + 24)); d.text((x + 4, y + 4), f'{lab} · {HALL.get(os.path.basename(f).split("-door-")[-1].split("-dpr")[0], os.path.basename(f)[:-4].split("-", 1)[1])}', fill=(230, 240, 236), font=F)
    p = os.path.join(out, name); S.save(p); return p

# (the Hall's north gate starts a fresh hall chosen and open: its frames run open -> shutting -> shut)
HALL = {'hall-N-closed': 'hall N gate open', 'hall-N-opening': 'hall N gate shutting', 'hall-N-open': 'hall N gate shut'}
made = []
for dpr in (1, 3):
    for kind in ('', '-gate'):
        b = sorted(glob.glob(f'{src}/before/before-drain{kind}-dpr{dpr}-*.png')); a = sorted(glob.glob(f'{src}/after/after-drain{kind}-dpr{dpr}-*.png'))
        made.append(sheet([('before', b), ('after', a)], f'v430-BW-drain{kind}-dpr{dpr}.png', crop=(0, 90, 390, 640), cw=300 if dpr == 1 else 360))
    for door in ('std', 'lift', 'boss', 'hall-N'):
        b = sorted(glob.glob(f'{src}/before/before-door-{door}-*-dpr{dpr}.png')); a = sorted(glob.glob(f'{src}/after/after-door-{door}-*-dpr{dpr}.png'))
        order = lambda fs: sorted(fs, key=lambda f: ['closed', 'unlocking', 'opening', 'open'].index(f.split('-door-')[1].split('-dpr')[0].split('-')[-1]))
        made.append(sheet([('before', order(b)), ('after', order(a))], f'v430-BW-door-{door}-dpr{dpr}.png', crop=(0, 60, 390, 640), cw=300 if dpr == 1 else 360))
print('\n'.join(m for m in made if m))
