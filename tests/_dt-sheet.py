# v433 DT: contact sheets of the dune traps' pictures (shots/v433-DT): before/after overviews, and each kind calm / tell / strike
# python3 tests/_dt-sheet.py
import glob, json, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v433-DT')
try: FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
except Exception: FONT = ImageFont.load_default()
def label(im, t):
    d = ImageDraw.Draw(im); d.rectangle([0, 0, im.width, 22], fill=(0, 0, 0)); d.text((6, 3), t, fill=(255, 255, 255), font=FONT); return im
def sheet(files, cols, w, h, out, labels):
    rows = (len(files) + cols - 1) // cols; S = Image.new('RGB', (cols * w, rows * h), (16, 12, 20))
    for i, f in enumerate(files):
        im = Image.open(f).convert('RGB'); im.thumbnail((w, h)); S.paste(label(im, labels[i]), ((i % cols) * w, (i // cols) * h))
    S.save(out); print('sheet', out, len(files))
for dpr in ('1', '3'):
    # before / after overviews per stage
    ov = []; lb = []
    for st in ('0', '5', '8', '9'):
        for tag in ('before', 'after'):
            f = os.path.join(D, f'{tag}-d{dpr}-s{st}-overview.png')
            if os.path.exists(f): ov.append(f); lb.append(f'{tag} · stage {st}')
    if ov: sheet(ov, 4, 390, 844, os.path.join(D, f'sheet-d{dpr}-overviews.png'), lb)
    cl = sorted(f for f in glob.glob(os.path.join(D, f'after-d{dpr}-s*-*-*.png')))
    order = {'calm': 0, 'tell': 1, 'strike': 2}
    cl.sort(key=lambda f: (os.path.basename(f).split('-')[2], os.path.basename(f).split('-')[3], order.get(os.path.basename(f).split('-')[-1][:-4], 9)))
    if cl:
        tw = 300 if dpr == '1' else 450
        sheet(cl, 3, tw, tw, os.path.join(D, f'sheet-d{dpr}-traps.png'), ['-'.join(os.path.basename(f)[:-4].split('-')[2:]) for f in cl])
