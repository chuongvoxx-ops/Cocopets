# v451 GE: contact sheets for shots/v451-GE: a grid of labelled images.
# usage: python3 tests/_sf-sheet.py out.png --cols N [--w W] label1=img1.png label2=img2.png ...
import sys
from PIL import Image, ImageDraw, ImageFont
args = sys.argv[1:]
out = args.pop(0); cols = 4; W = None
if '--cols' in args: i = args.index('--cols'); cols = int(args[i + 1]); del args[i:i + 2]
if '--w' in args: i = args.index('--w'); W = int(args[i + 1]); del args[i:i + 2]
items = []
for a in args:
    lab, p = a.split('=', 1); im = Image.open(p).convert('RGB')
    if W: im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
    items.append((lab, im))
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
except Exception: font = ImageFont.load_default()
LH, G = 30, 8
cw = max(im.width for _, im in items); ch = max(im.height for _, im in items)
rows = (len(items) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cw + (cols - 1) * G, rows * (ch + LH) + (rows - 1) * G), (18, 14, 16))
d = ImageDraw.Draw(sheet)
for k, (lab, im) in enumerate(items):
    x = (k % cols) * (cw + G); y = (k // cols) * (ch + LH + G)
    d.text((x + 6, y + 4), lab, fill=(240, 220, 200), font=font); sheet.paste(im, (x, y + LH))
sheet.save(out); print(out, sheet.size)
