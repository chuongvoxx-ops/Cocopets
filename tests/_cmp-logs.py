#!/usr/bin/env python3
"""Compare the per-floor lines of dun-frames logs from two builds (old → new), floor by floor.
usage: python3 tests/_cmp-logs.py bat/dun-base1.log,bat/dun-base3.log bat/dun-final1.log,bat/dun-final3.log"""
import re, sys, statistics as stt

LINE = re.compile(r"^(\d+) (\S+) dark (\S+) dpr \S+ \| explore draw ([\d.]+)/([\d.]+) cpu ([\d.]+) upd \S+ (\{[^}]*\}) \| boss draw (?:([\d.]+)/([\d.]+) cpu ([\d.]+)|-)")

def load(paths):
    out = {}
    for p in paths.split(','):
        for ln in open(p):
            m = LINE.match(ln.strip())
            if not m: continue
            fl = int(m.group(1))
            out[fl] = dict(land=m.group(2), em=float(m.group(4)), ep=float(m.group(5)), ec=float(m.group(6)),
                           bm=float(m.group(8)) if m.group(8) else None, bp=float(m.group(9)) if m.group(9) else None,
                           bc=float(m.group(10)) if m.group(10) else None)
    return out

A, B = load(sys.argv[1]), load(sys.argv[2])
floors = sorted(set(A) & set(B))
pc = lambda a, b: f"{(b - a) / a * 100:+.0f}%" if a and b is not None else ''
print(f"{'floor':>5} {'land':<9} {'explore median':>18} {'explore slowest 10%':>22} {'boss median':>18} {'boss slowest 10%':>20}")
cols = {k: ([], []) for k in ('em', 'ep', 'bm', 'bp', 'ec', 'bc')}
for fl in floors:
    a, b = A[fl], B[fl]
    for k in cols:
        if a[k] is not None and b[k] is not None: cols[k][0].append(a[k]); cols[k][1].append(b[k])
    f = lambda k: f"{a[k]:.0f}→{b[k]:.0f} {pc(a[k], b[k]):>5}" if a[k] is not None and b[k] is not None else '-'
    print(f"{fl:>5} {a['land']:<9} {f('em'):>18} {f('ep'):>22} {f('bm'):>18} {f('bp'):>20}")
print()
for k, name in (('em', 'explore frame, median'), ('ep', 'explore frame, slowest 10%'), ('bm', 'boss frame, median'), ('bp', 'boss frame, slowest 10%'), ('ec', 'explore main thread'), ('bc', 'boss main thread')):
    a, b = cols[k]
    if a: print(f"{name:<28} {stt.mean(a):5.1f} → {stt.mean(b):5.1f} ms  ({pc(stt.mean(a), stt.mean(b))})  over {len(a)} floors")
