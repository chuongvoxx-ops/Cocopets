#!/usr/bin/env python3
"""v392 PR: the Belfry props' before/after contact sheet -> shots/bel-pr-sheet.png.
Each place: the old 2D props (before) beside the repainted ones (after), from tests/_bel-pr-props.js (TAG=before / after),
cropped to the play area; the studio sheet of every repainted picture (tests/_bel-pr-studio.js) at the foot."""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); SH = os.path.join(HERE, '..', 'shots')
NAMES = [('hall', 'Hall: dais, channels, sockets'), ('sockets', 'Hall: crystals in their sockets'), ('gates', 'Hall: north gate, pillars, plaques'), ('east', 'East foundry: Varkul\'s pit, bell halves, moulds'),
         ('east-bells', 'East foundry: hung bells, drains'), ('east-platform', 'East foundry: platform, plinth, coral cage'), ('west', 'West chapel: the pedestal'), ('north-arch', 'North cistern: the alcove'),
         ('cistern', 'Counterweight cistern (rift props)'), ('tide-landing', 'Tide ramp (rift props)'), ('church', 'Lower church (rift props)'), ('nave', 'Nhalu\'s nave: columns, wall')]
W, H, CROP = 390, 700, (0, 220, 780, 1620)   # (each shot: 780 x 1688 at DPR 2, the play area cropped, then halved)
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20); FS = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
except Exception: F = FS = ImageFont.load_default()
pairs = [(n, t) for n, t in NAMES if os.path.exists(os.path.join(SH, f'bel-pr-after-{n}.png'))]
cols = 2; rows = (len(pairs) + cols - 1) // cols; pad = 14; lab = 34; cw = W * 2 + pad; ch = H + lab + pad
studio = os.path.join(SH, 'bel-pr-studio.png'); st = Image.open(studio).convert('RGB') if os.path.exists(studio) else None
sw = cols * cw + pad; stH = int(st.height * (sw - 2 * pad) / st.width) + lab if st else 0
sheet = Image.new('RGB', (sw, 60 + rows * ch + stH + pad), (14, 20, 26)); d = ImageDraw.Draw(sheet)
d.text((pad, 16), 'The Drowned Belfry: props before (old 2D) and after (repainted 2.5D, v392 PR) - 390x844 @ DPR 2', fill=(232, 240, 236), font=F)
for i, (n, t) in enumerate(pairs):
    x0 = pad + (i % cols) * cw; y0 = 60 + (i // cols) * ch
    d.text((x0, y0 + 6), t, fill=(200, 236, 230), font=F)
    for j, tag in enumerate(['before', 'after']):
        p = os.path.join(SH, f'bel-pr-{tag}-{n}.png'); x = x0 + j * (W + 4)
        if os.path.exists(p): im = Image.open(p).convert('RGB').crop(CROP).resize((W, H), Image.LANCZOS); sheet.paste(im, (x, y0 + lab))
        else: d.rectangle([x, y0 + lab, x + W, y0 + lab + H], outline=(60, 70, 76))
        d.text((x + 8, y0 + lab + 6), tag.upper(), fill=(255, 220, 140) if tag == 'before' else (140, 255, 210), font=FS)
if st:
    y0 = 60 + rows * ch; d.text((pad, y0 + 6), 'Every repainted picture (studio sheet, 94 px per tile)', fill=(200, 236, 230), font=F)
    sheet.paste(st.resize((sw - 2 * pad, stH - lab), Image.LANCZOS), (pad, y0 + lab))
out = os.path.join(SH, 'bel-pr-sheet.png'); sheet.save(out, optimize=True); print(out, sheet.size)
