# v463 SE: before/after contact sheets of the Sepulchre's lands and pieces: shots/v463-SE/sheet-<tag>.png
# usage: python3 tests/_se-sheet.py BEFORE_TAG AFTER_TAG [OUT]
import sys, os
from PIL import Image, ImageDraw
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v463-SE')
b, a = sys.argv[1], sys.argv[2]; out = sys.argv[3] if len(sys.argv) > 3 else f'sheet-{a}.png'
names = sorted({f[len(a) + 1:-4] for f in os.listdir(D) if f.startswith(a + '-') and f.endswith('.png')})
W, H = 260, 563
sheet = Image.new('RGB', (W * 2 + 30, (H + 24) * len(names) or 1), (18, 18, 24)); dr = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    for j, t in enumerate([b, a]):
        p = os.path.join(D, f'{t}-{n}.png')
        if os.path.exists(p): sheet.paste(Image.open(p).convert('RGB').resize((W, H)), (10 + j * (W + 10), i * (H + 24) + 20))
        dr.text((10 + j * (W + 10), i * (H + 24) + 4), f'{t} {n}', fill=(255, 255, 255))
sheet.save(os.path.join(D, out)); print(out, len(names))
