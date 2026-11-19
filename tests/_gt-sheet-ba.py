#!/usr/bin/env python3
"""v423 GT: before (git HEAD) / after overview sheets of the same floor (The Thorn Walks, seeded) at DPR 1 and 3 ->
shots/v423-GT/sheet-before-after-d<dpr>.png"""
import os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v423-GT')
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14); big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except Exception: font = big = ImageFont.load_default()
for d in ('1', '3'):
    a, b = os.path.join(D, f'before-d{d}-s9-overview.png'), os.path.join(D, f'after-d{d}-s9-overview.png')
    if not (os.path.exists(a) and os.path.exists(b)): continue
    A, B = [Image.open(x).convert('RGB') for x in (a, b)]; W = 420; A = A.resize((W, int(A.height * W / A.width))); B = B.resize((W, int(B.height * W / B.width)))
    s = Image.new('RGB', (2 * W + 30, max(A.height, B.height) + 80), (18, 12, 24)); dr = ImageDraw.Draw(s)
    dr.text((10, 10), f'The Thorn Walks (S3), the same floor seed and view point, DPR {d} (HEAD rolls a different floor from it: the new props)', fill=(242, 216, 161), font=big)
    s.paste(A, (10, 44)); s.paste(B, (W + 20, 44))
    dr.text((10, 50 + A.height), 'before (git HEAD): thorn spikes + Tower traps', fill=(230, 226, 240), font=font)
    dr.text((W + 20, 50 + B.height), 'after: + the garden traps', fill=(230, 226, 240), font=font)
    out = os.path.join(D, f'sheet-before-after-d{d}.png'); s.save(out); print(out)
