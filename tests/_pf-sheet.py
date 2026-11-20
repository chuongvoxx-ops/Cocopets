# v430 PF: one contact sheet of the same-frame comparisons (tests/_pf-same.js writes same-<stage>-<case>.png: v429 painter |
# v430 painter | their difference x16), each row labelled with its case and pixel statistics.
# usage: python3 tests/_pf-sheet.py shots/v430-PF/sheet-same.png shots/v430-PF/same-s0-sunflare.png ...
import sys, json, os
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
rows = []
for f in files:
    im = Image.open(f).convert('RGB'); k = 0.42; im = im.resize((int(im.size[0] * k), int(im.size[1] * k)))
    stats = ''
    try:
        d = os.path.dirname(f); name = os.path.basename(f)[5:-4]; st, case = name.split('-', 1)
        J = {}
        for jn in ('same-%s-all.json' % st, 'same-%s.json' % st):
            if os.path.exists(os.path.join(d, jn)): J.update(json.load(open(os.path.join(d, jn))))
        if os.path.exists(os.path.join(d, 'same-stats.json')): J.update(json.load(open(os.path.join(d, 'same-stats.json'))).get(st, {}))   # (gathered from the runs' logs)
        s = J[case]['same']; stats = '  pixels differing by >2 levels: %d of %d, >8: %d, max %d' % (s['n2'], s['px'], s['n8'], s['max']) + ('  (control, the old painter redrawn: >8: %d, max %d)' % (s['ctrl8'], s['ctrlMax']) if 'ctrl8' in s else '')
    except Exception as e: pass
    lab = Image.new('RGB', (im.size[0], 26), (16, 16, 20)); ImageDraw.Draw(lab).text((8, 7), os.path.basename(f) + '   (v429 painter | v430 painter | difference x16)' + stats, fill=(235, 235, 235))
    rows += [lab, im]
W = max(r.size[0] for r in rows); H = sum(r.size[1] for r in rows)
S = Image.new('RGB', (W, H), (0, 0, 0)); y = 0
for r in rows: S.paste(r, (0, y)); y += r.size[1]
S.save(out); print(out, S.size)
