#!/usr/bin/env python3
"""Compare two fiend-frames runs (bat/fiend-frames-<tag>.json): per floor and phase, median, slowest 10% and mean frame.
usage: python3 tests/_cmp-fiend.py base-tag new-tag"""
import json, sys, os, statistics as st
H = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bat')
A, B = (json.load(open(os.path.join(H, f'fiend-frames-{t}.json'))) for t in sys.argv[1:3])
pc = lambda a, b: f"{(b - a) / a * 100:+4.0f}%"
cols = {'med': ([], []), 'p90': ([], []), 'mean': ([], [])}
print(f"{'floor':>5} {'fiend':<12} {'median':>16} {'slowest 10%':>16} {'mean':>16}")
for fl in sorted(A, key=int):
    if fl not in B: continue
    for ph in A[fl]:
        if ph == 'id' or ph not in B[fl]: continue
        a, b = A[fl][ph], B[fl][ph]
        for k in cols: cols[k][0].append(a[k]); cols[k][1].append(b[k])
        print(f"{fl:>5} {A[fl]['id'][:11]:<12} " + ' '.join(f"{a[k]:5.1f}→{b[k]:5.1f}{pc(a[k], b[k])}" for k in ('med', 'p90', 'mean')))
print()
for k, (a, b) in cols.items(): print(f"{k:<5} mean over floors {st.mean(a):5.1f} → {st.mean(b):5.1f} ms ({pc(st.mean(a), st.mean(b))})")
