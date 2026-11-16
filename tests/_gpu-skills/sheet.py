#!/usr/bin/env python3
"""Classify measured moves (GPU own painter / GPU shared Tower pass / 2D) and build contact sheets.
usage: sheet.py <results.json,...> <outdir> [--groups star6,...] [--frames-dir DIR]"""
import json, sys, os, glob
from PIL import Image, ImageDraw, ImageFont

def load(paths):
    res = []
    for p in paths:
        for f in glob.glob(p):
            res += json.load(open(f))
    return res

def base_of(res):
    b = {}
    for r in res:
        if r['group'] == 'baseline':
            b[r['slot']] = [s['dunQ'] for s in r['samples']]
    return b

def classify(r, base):
    S = r['samples']; B = base.get(r['slot'], [])
    own = [s['ownQ'] for s in S]
    extra = [max(0, s['dunQ'] - (B[i] if i < len(B) else (B[-1] if B else 0))) for i, s in enumerate(S)]
    r['sumOwnQ'] = sum(own); r['sumExtra'] = sum(extra); r['maxOwnQ'] = max(own) if own else 0; r['maxExtra'] = max(extra) if extra else 0
    r['sumOwn2D'] = sum(s['own2D'] for s in S); r['sumOwnGL'] = sum(s['ownGL'] for s in S)
    r['score'] = [o + e for o, e in zip(own, extra)]
    if r['group'].startswith('elem:') and r['sumOwnQ'] < 20:
        r['gpu'] = '2D'   # (an elemental move counts only when its own drawing paints on the GPU; shared-pass glows are not a redraw)
        r['note'] = 'shared-pass glows only' if r['sumExtra'] >= 40 else ''
    elif r['sumOwnQ'] >= 20 and r['sumOwn2D'] > 20 * r['sumOwnQ']:
        r['gpu'] = '2D'; r['note'] = 'a few GPU glows; its picture is 2D'
    elif r['sumOwnQ'] >= 20:
        r['gpu'] = 'GPU (own)'
    elif r['sumExtra'] >= 40 and r['maxExtra'] >= (20 if r['slot'] == 'ult' else 8) and r['sumOwn2D'] < r['sumExtra']:
        r['gpu'] = 'GPU (shared pass)'
    else:
        r['gpu'] = '2D'
    return r

def pick(r, n=2, gap=0.5):
    S = r['samples']; sc = r['score']
    order = sorted(range(len(S)), key=lambda i: -sc[i])
    if not order: return []
    out = [order[0]]
    for i in order[1:]:
        if len(out) >= n: break
        if all(abs(S[i]['t'] - S[j]['t']) >= gap for j in out) and sc[i] >= 0.35 * sc[order[0]]:
            out.append(i)
    return sorted(out, key=lambda i: S[i]['t'])

CROP = (0, 110, 390, 730)   # the play area around the pet (phone frame 390 x 844)
SC = 0.62

def font(sz):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

def tile(path, label, sub, sc=None):
    sc = sc or SC; small = sc < 0.5; hd = 30 if small else 40
    im = Image.open(path).convert('RGB').crop(CROP)
    w, h = int(im.width * sc), int(im.height * sc)
    im = im.resize((w, h), Image.LANCZOS)
    T = Image.new('RGB', (w, h + hd), (24, 22, 32)); T.paste(im, (0, hd))
    d = ImageDraw.Draw(T); d.text((4, 2), label, fill=(255, 240, 200), font=font(11 if small else 14)); d.text((4, 16 if small else 21), sub, fill=(170, 200, 255), font=font(9 if small else 12))
    return T

def sheet(tiles, title, out, cols=6, maxside=3000):
    if not tiles: return []
    tw, th = tiles[0].size
    cols = min(cols, len(tiles), max(1, (maxside - 20) // (tw + 6)))
    rows_max = max(1, (maxside - 60) // (th + 6))
    per = cols * rows_max
    outs = []
    for k in range(0, len(tiles), per):
        chunk = tiles[k:k + per]; rows = (len(chunk) + cols - 1) // cols
        W = cols * (tw + 6) + 6; H = rows * (th + 6) + 46
        S = Image.new('RGB', (W, H), (12, 11, 18)); d = ImageDraw.Draw(S)
        part = '' if len(tiles) <= per else f'  ({k // per + 1}/{(len(tiles) + per - 1) // per})'
        d.text((8, 10), title + part, fill=(255, 255, 255), font=font(20))
        for i, t in enumerate(chunk):
            S.paste(t, (6 + (i % cols) * (tw + 6), 40 + (i // cols) * (th + 6)))
        o = out if len(tiles) <= per else out.replace('.png', f'-{k // per + 1}.png')
        S.save(o, optimize=True); outs.append(o)
    return outs
