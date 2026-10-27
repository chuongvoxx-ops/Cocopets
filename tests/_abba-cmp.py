#!/usr/bin/env python3
"""Read an A B B A run (bat/abba-<tag>.log) and compare the two builds floor by floor (each the mean of its two runs)."""
import json, sys, os, statistics as st
H = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bat')
rows = {}
for ln in open(os.path.join(H, f'abba-{sys.argv[1]}.log')):
    p = ln.split(' ', 2)
    if len(p) < 3: continue
    fl, run, js = int(p[0]), p[1], json.loads(p[2])
    d = js[str(fl)]; ph = [k for k in d if k != 'id'][0]; rows.setdefault(fl, {'id': d['id'], 'A': [], 'B': []})[run[0]].append(d[ph])
pc = lambda a, b: f"{(b - a) / a * 100:+4.0f}%"
tot = {k: ([], []) for k in ('med', 'p90', 'mean')}
print(f"{'floor':>5} {'fiend':<12} {'median':>17} {'slowest 10%':>17} {'mean':>17}")
for fl in sorted(rows):
    r = rows[fl]; 
    if not r['A'] or not r['B']: continue
    v = {k: (st.mean(x[k] for x in r['A']), st.mean(x[k] for x in r['B'])) for k in tot}
    for k in tot: tot[k][0].append(v[k][0]); tot[k][1].append(v[k][1])
    print(f"{fl:>5} {r['id'][:11]:<12} " + ' '.join(f"{v[k][0]:5.1f}→{v[k][1]:5.1f}{pc(*v[k])}" for k in ('med', 'p90', 'mean')))
print()
for k, (a, b) in tot.items(): print(f"{k:<5} mean over floors {st.mean(a):5.1f} → {st.mean(b):5.1f} ms ({pc(st.mean(a), st.mean(b))})")
