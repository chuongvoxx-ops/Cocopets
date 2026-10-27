#!/usr/bin/env python3
"""Compare two sets of PNG frames pixel by pixel: shots/px-<a>-*.png against shots/px-<b>-*.png; writes a diff picture of each
(differences scaled up 8x) as shots/pxd-<a>-<b>-*.png. usage: _pxdiff.py a b"""
import sys, os, glob
from PIL import Image, ImageChops
import numpy as np
H = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'shots')
a, b = sys.argv[1], sys.argv[2]
for fa in sorted(glob.glob(os.path.join(H, f'px-{a}-*.png'))):
    nm = os.path.basename(fa)[len(f'px-{a}-'):]
    fb = os.path.join(H, f'px-{b}-{nm}')
    if not os.path.exists(fb): continue
    A = np.asarray(Image.open(fa).convert('RGB')).astype(int); B = np.asarray(Image.open(fb).convert('RGB')).astype(int)
    d = np.abs(A - B).max(axis=2)
    print(f"{nm:<16} max {d.max():3d}  mean {d.mean():.3f}  >4: {(d > 4).sum():6d}  >16: {(d > 16).sum():6d}  >48: {(d > 48).sum():6d}  of {d.size}")
    Image.fromarray(np.clip(d * 8, 0, 255).astype('uint8')).save(os.path.join(H, f'pxd-{a}-{b}-{nm}'))
