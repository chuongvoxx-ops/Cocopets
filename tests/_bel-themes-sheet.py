# v394 PR: contact sheet of the Belfry's three dungeons side by side (shots from tests/_bel-themes.js shots)
# usage: python3 tests/_bel-themes-sheet.py  ->  shots/bel-themes-sheet.png
import os
from PIL import Image, ImageDraw, ImageFont
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots')
names = [('d1', 'D1  Drowned Lower Church'), ('d2', 'D2  Bell Foundry Undercroft'), ('d3', 'D3  Storm Galleries')]
ims = [Image.open(os.path.join(R, 'bel-themes-%s.png' % k)).convert('RGB') for k, _ in names]
w = 520; ims = [im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) for im in ims]
h = max(im.height for im in ims); pad, top = 16, 44
sheet = Image.new('RGB', (pad + len(ims) * (w + pad), top + h + pad), (14, 14, 20)); d = ImageDraw.Draw(sheet)
try: f = ImageFont.truetype('DejaVuSans-Bold.ttf', 20)
except Exception: f = ImageFont.load_default()
for i, (im, (_, t)) in enumerate(zip(ims, names)):
    x = pad + i * (w + pad); sheet.paste(im, (x, top)); d.text((x + 4, 12), t, fill=(230, 226, 240), font=f)
sheet.save(os.path.join(R, 'bel-themes-sheet.png')); print('wrote shots/bel-themes-sheet.png', sheet.size)
