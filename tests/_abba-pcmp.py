#!/usr/bin/env python3
"""Compare an A B B A run over the phases of one floor (bat/abbap-<tag>.log): each phase the mean of its two runs per build."""
import json, sys, os, statistics as st
H = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bat')
rows = {}
for ln in open(os.path.join(H, f'abbap-{sys.argv[1]}.log')):
    p = ln.split(' ', 2)
    if len(p) < 3: continue
    fl, run, js = p[0], p[1], json.loads(p[2])
    d = js[fl]
    for ph in [k for k in d if k != 'id']: rows.setdefault(ph, {'A': [], 'B': []})[run[0]].append(d[ph])
pc = lambda a, b: f"{(b - a) / a * 100:+4.0f}%"
print(f"{'phase':>5} {'median':>17} {'slowest 10%':>17} {'mean':>17} {'cpu':>17}")
for ph in sorted(rows):
    r = rows[ph]
    if not r['A'] or not r['B']: continue
    v = {k: (st.mean(x[k] for x in r['A']), st.mean(x[k] for x in r['B'])) for k in ('med', 'p90', 'mean', 'cpu')}
    print(f"{ph:>5} " + ' '.join(f"{v[k][0]:5.1f}→{v[k][1]:5.1f}{pc(*v[k])}" for k in ('med', 'p90', 'mean', 'cpu')))
