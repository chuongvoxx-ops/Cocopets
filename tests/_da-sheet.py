#!/usr/bin/env python3
"""(v433 DA) a contact sheet: python3 tests/_go-sheet.py NAME [--cols N] [--w W] [--title T] file.png[=caption] ...
-> shots/v433-DA/NAME-sheet.png (frames scaled to width W, in a grid, each captioned with its file name or its caption)"""
import os, sys
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v433-DA')
a = sys.argv[1:]; name = a.pop(0); cols, W, title = 4, 300, ''
while a and a[0].startswith('--'):
    k = a.pop(0)
    if k == '--cols': cols = int(a.pop(0))
    elif k == '--w': W = int(a.pop(0))
    elif k == '--title': title = a.pop(0)
items = []
for s in a:
    f, _, cap = s.partition('=')
    if os.path.exists(f): items.append((f, cap or os.path.basename(f)[:-4]))
if not items: print('no frames'); sys.exit(0)
ims = [Image.open(f).convert('RGB') for f, _ in items]
ims = [im.resize((W, max(1, int(im.height * W / im.width)))) for im in ims]
Hc = max(im.height for im in ims); cols = min(cols, len(ims)); rows = (len(ims) + cols - 1) // cols
top = 34 if title else 6
sheet = Image.new('RGB', (cols * W, top + rows * (Hc + 22)), (16, 10, 20)); dr = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12); big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
except Exception: font = big = ImageFont.load_default()
if title: dr.text((8, 8), title, fill=(200, 246, 248), font=big)
for i, (im, (f, cap)) in enumerate(zip(ims, items)):
    x, y = (i % cols) * W, top + (i // cols) * (Hc + 22); sheet.paste(im, (x, y)); dr.text((x + 4, y + im.height + 3), cap[:46], fill=(235, 225, 240), font=font)
out = os.path.join(D, f'{name}-sheet.png'); sheet.save(out); print('sheet', out, len(ims), 'frames')
