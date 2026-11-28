# v474 LE: 2D | GPU contact sheets of the Library of Unwritten Lives's scenes (before = the old 2D art, after = the GPU rebuild)
# python3 tests/_le-sheet.py [A=before] [B=after] -> shots/v472-YE/sheet-<n>.png
import sys, os
from PIL import Image, ImageDraw
D = os.path.join(os.path.dirname(__file__), '..', 'shots', 'v474-LE'); A = sys.argv[1] if len(sys.argv) > 1 else 'before'; B = sys.argv[2] if len(sys.argv) > 2 else 'after'
names = sorted({f[len(B) + 1:-4] for f in os.listdir(D) if f.startswith(B + '-') and f.endswith('.png')})
W, H, per = 260, 563, 4
pages = [names[i:i + per * 2] for i in range(0, len(names), per * 2)]
for pi, page in enumerate(pages):
    sh = Image.new('RGB', (W * 2 * per + 10 * per, (H + 24) * ((len(page) + per - 1) // per)), (18, 16, 24)); d = ImageDraw.Draw(sh)
    for i, n in enumerate(page):
        x, y = (i % per) * (W * 2 + 10), (i // per) * (H + 24)
        for j, tag in enumerate((A, B)):
            p = os.path.join(D, f'{tag}-{n}.png')
            if os.path.exists(p): sh.paste(Image.open(p).convert('RGB').resize((W, H)), (x + j * W, y + 22))
        d.text((x + 4, y + 4), f'{n}   2D (left) | GPU (right)', fill=(230, 220, 255))
    sh.save(os.path.join(D, f'sheet-{pi + 1}.png')); print('sheet', pi + 1, len(page))
