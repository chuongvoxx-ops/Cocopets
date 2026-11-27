# (v470 AM) before / after contact sheets from the in-game photos (tests/_am-shots.js): python3 tests/_am-sheet.py [dpr 3] [stages 0,3,7] [atk]
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots', 'v470-AM')
dpr = sys.argv[1] if len(sys.argv) > 1 else '3'
stages = (sys.argv[2] if len(sys.argv) > 2 else '0,3,7').split(',')
atk = '-atk' if len(sys.argv) > 3 else ''
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except Exception: F = ImageFont.load_default()
CW = 390
rows = []
for s in stages:
    pair = []
    for tag in ('before', 'after'):
        p = os.path.join(D, tag, f'{tag}{atk if tag == "after" else ""}-d{dpr}-s{s}.png')
        if not os.path.exists(p): pair.append(None); continue
        im = Image.open(p).convert('RGB'); W, H = im.size
        im = im.crop((0, int(H * 0.18), W, int(H * 0.82)))   # (the middle of the screen: the group round the pet)
        im = im.resize((CW, int(im.size[1] * CW / im.size[0])), Image.LANCZOS); pair.append((tag, im))
    rows.append((s, pair))
h = max((p[1].size[1] for _, pr in rows for p in pr if p), default=100)
sheet = Image.new('RGB', (CW * 2 + 30, (h + 34) * len(rows) + 10), (16, 14, 22)); d = ImageDraw.Draw(sheet)
for i, (s, pair) in enumerate(rows):
    y = 10 + i * (h + 34)
    for j, p in enumerate(pair):
        if not p: continue
        tag, im = p; x = 10 + j * (CW + 10); sheet.paste(im, (x, y + 26)); d.text((x + 4, y + 2), f'{tag.upper()}  stage {s}  DPR {dpr}', fill=(240, 230, 255), font=F)
out = os.path.join(D, f'sheet{atk}-d{dpr}.png'); sheet.save(out); print(out)
