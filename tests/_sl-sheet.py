# (v444 SL) contact sheets for shots/v444-SL: images stacked (or side by side) under a label each.
# usage: python3 tests/_sl-sheet.py out.png [--row] label1=img1.png label2=img2.png ...   (--w N: scale every image to N px wide)
import sys
from PIL import Image, ImageDraw, ImageFont
args = sys.argv[1:]
out = args.pop(0); row = '--row' in args; args = [a for a in args if a != '--row']
W = None
if '--w' in args:
    i = args.index('--w'); W = int(args[i + 1]); del args[i:i + 2]
items = []
for a in args:
    lab, p = a.split('=', 1); im = Image.open(p).convert('RGB')
    if W: im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
    items.append((lab, im))
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except Exception: font = ImageFont.load_default()
LH = 34
if row:
    w = sum(im.width for _, im in items) + 10 * (len(items) - 1); h = max(im.height for _, im in items) + LH
else:
    w = max(im.width for _, im in items); h = sum(im.height + LH for _, im in items)
sheet = Image.new('RGB', (w, h), (12, 6, 8)); d = ImageDraw.Draw(sheet); x = y = 0
for lab, im in items:
    d.text((x + 8, y + 5), lab, fill=(242, 201, 160), font=font)
    sheet.paste(im, (x, y + LH))
    if row: x += im.width + 10
    else: y += im.height + LH
sheet.save(out); print(out, sheet.size)
