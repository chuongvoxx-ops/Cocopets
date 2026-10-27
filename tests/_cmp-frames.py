#!/usr/bin/env python3
"""Compare dun-frames runs of two builds: per floor, the mean over repeat runs of each statistic, and the change.
usage: python3 tests/_cmp-frames.py base1,base2 final1,final2"""
import json, sys, os, statistics as stt

HERE = os.path.dirname(os.path.abspath(__file__))
def load(tags):
    runs = [json.load(open(os.path.join(HERE, '..', 'bat', f'dun-frames-{t}.json'))) for t in tags.split(',')]
    return runs

def stat(runs, fl, seg, key, sub):
    vals = []
    for r in runs:
        s = r.get(str(fl), {}).get(seg)
        if s and s.get(key) and s[key].get(sub) is not None: vals.append(s[key][sub])
    return sum(vals) / len(vals) if vals else None

A, B = load(sys.argv[1]), load(sys.argv[2])
floors = sorted(int(k) for k in A[0].keys())
rows = []
print(f"{'floor':>5} {'land':<10} | {'explore frame (med/p90 ms)':<34} | {'explore cpu':<16} | {'boss frame (med/p90 ms)':<34} | {'boss cpu':<16}")
tot = {k: [[], []] for k in ['em', 'ep', 'ec', 'bm', 'bp', 'bc']}
for fl in floors:
    land = A[0][str(fl)].get('biome', '?')
    def pair(seg, key, sub, tk):
        a, b = stat(A, fl, seg, key, sub), stat(B, fl, seg, key, sub)
        if a is None or b is None: return '-', None
        tot[tk][0].append(a); tot[tk][1].append(b)
        return f"{a:5.1f}→{b:5.1f}", (b - a) / a * 100
    em, emc = pair('explore', 'draw', 'med', 'em'); ep, epc = pair('explore', 'draw', 'p90', 'ep'); ec, ecc = pair('explore', 'cpu', 'med', 'ec')
    bm, bmc = pair('boss', 'draw', 'med', 'bm'); bp, bpc = pair('boss', 'draw', 'p90', 'bp'); bc, bcc = pair('boss', 'cpu', 'med', 'bc')
    f = lambda v: f"{v:+4.0f}%" if v is not None else '  -  '
    print(f"{fl:>5} {land:<10} | {em} {f(emc)} {ep} {f(epc)} | {ec} {f(ecc)} | {bm} {f(bmc)} {bp} {f(bpc)} | {bc} {f(bcc)}")
print()
for k, name in [('em', 'explore frame median'), ('ep', 'explore frame p90'), ('ec', 'explore cpu median'), ('bm', 'boss frame median'), ('bp', 'boss frame p90'), ('bc', 'boss cpu median')]:
    a, b = tot[k]
    if a: print(f"{name:<22} mean over floors {stt.mean(a):5.1f} → {stt.mean(b):5.1f} ms ({(stt.mean(b) - stt.mean(a)) / stt.mean(a) * 100:+.0f}%)   median of floors {stt.median(a):5.1f} → {stt.median(b):5.1f}")
