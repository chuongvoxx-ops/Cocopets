# v434 PO (from v430 PF): one contact sheet of the same-frame comparisons (tests/_po-same.js writes same-<tag>-<case>.png: v433 |
# v434 | their difference x16), each row labelled with its case and pixel statistics (from same-<tag>.json).
# usage: python3 tests/_po-sheet.py shots/v434-PO/sheet-same-1.png shots/v434-PO/same-s0-base.png ...
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
        for jn in ('same-%s.json' % st, 'same-%s-all.json' % st):
            if os.path.exists(os.path.join(d, jn)): J.update(json.load(open(os.path.join(d, jn))))
        if os.path.exists(os.path.join(d, 'same-stats.json')): J.update(json.load(open(os.path.join(d, 'same-stats.json'))).get(st, {}))   # (gathered from the runs' logs)
        s = J[case]['same']; stats = '  pixels differing by >2 levels: %d of %d, >8: %d, max %d' % (s['n2'], s['px'], s['n8'], s['max']) + ('  (control, v433 redrawn: >8: %d, max %d)' % (s['ctrl8'], s['ctrlMax']) if 'ctrl8' in s else '')
    except Exception as e: pass
    lab = Image.new('RGB', (im.size[0], 26), (16, 16, 20)); ImageDraw.Draw(lab).text((8, 7), os.path.basename(f) + '   (v433 | v434 | difference x16)' + stats, fill=(235, 235, 235))
    rows += [lab, im]
W = max(r.size[0] for r in rows); H = sum(r.size[1] for r in rows)
S = Image.new('RGB', (W, H), (0, 0, 0)); y = 0
for r in rows: S.paste(r, (0, y)); y += r.size[1]
S.save(out); print(out, S.size)
