#!/usr/bin/env python3
"""Contact sheets from the captured frames. usage: build.py <measure glob> <capture dir> <shots dir> [groups...]"""
import sys, os, glob, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheet import load, base_of, classify, tile, sheet

MG, CD, SD = sys.argv[1], sys.argv[2], sys.argv[3]
WANT = sys.argv[4].split(',') if len(sys.argv) > 4 else None
res = [r for r in load(MG.split(','))]
base = base_of(res)
E8 = {'fire': 'fire', 'frost': 'ice', 'leaf': 'wind', 'spark': 'thunder', 'cosmic': 'dark', 'bubble': 'water', 'candy': 'light', 'shadow': 'dark', 'gold': 'earth', 'prism': 'light'}
SKIPF = set(json.load(open(os.path.join(CD, 'skip.json')))) if os.path.exists(os.path.join(CD, 'skip.json')) else set()

def sheet_group(r):
    g = r['group']
    if g.startswith('elem:'): return g[5:]
    if g == 'cards': return E8.get(r['el'], r['el'])
    return g   # innate, star4, star5, star6

def label(r):
    slot = {'strong': 'Strong', 'ult': 'Ult'}[r['slot']]
    src = {'innate': 'innate', 'cards': 'card', 'star4': '4-star', 'star5': '5-star', 'star6': '6-star'}.get(r['group'], 'elemental')
    return f"{r['name']}  ·  {slot}", src

groups, overview = {}, []
SH = {'GPU (own)': 'GPU own painter', 'GPU (shared pass)': 'GPU shared pass'}
seen = set()
for r in res:
    if r['group'] == 'baseline' or r['id'] in seen: continue
    seen.add(r['id']); classify(r, base)
    if r['gpu'] == '2D': continue
    sg = sheet_group(r)
    if WANT and sg not in WANT: continue
    frames = sorted(f for f in glob.glob(os.path.join(CD, 'raw', r['id'], '*.png')) if os.path.basename(f) not in SKIPF and r['id'] + '/' + os.path.basename(f) not in SKIPF)
    if not frames: print('no frames', r['id']); continue
    lab, src = label(r)
    tiles = [tile(f, lab, f"{src} · {SH[r['gpu']]} · {float(os.path.basename(f)[:-4]):.1f}s") for f in frames]
    groups.setdefault(sg, []).extend(tiles)
    # the overview's frame: the captured one with the highest measured score
    sc = {round(s['t'], 2): x for s, x in zip(r['samples'], r['score'])}
    best = max(frames, key=lambda f: sc.get(round(float(os.path.basename(f)[:-4]), 2), 0))
    overview.append((sg, tile(best, lab.replace('  ·  ', ' · '), f"{sg} · {SH[r['gpu']]}", sc=0.4)))
TITLES = {'star4': '4-star signature moves (STAR4) on the GPU', 'star5': '5-star signature moves (STAR5) on the GPU', 'star6': '6-star golden Legendary moves (STAR6) on the GPU', 'innate': "Innate moves (from the pet's body) on the GPU"}
outs = []
for g, tl in groups.items():
    outs += sheet(tl, TITLES.get(g, f'{g.capitalize()}: elemental Strongs and ability cards on the GPU'), os.path.join(SD, f'gpu-skills-{g}.png'), cols=6)
if not WANT or 'overview' in (WANT or []):
    ORDER = ['star6', 'star5', 'star4', 'innate', 'earth', 'wind', 'light', 'dark', 'fire', 'water', 'ice', 'thunder']
    overview.sort(key=lambda p: ORDER.index(p[0]) if p[0] in ORDER else 99)
    outs += sheet([t for _, t in overview], 'GPU skills and ults: one key frame per move', os.path.join(SD, 'gpu-skills-overview.png'), cols=14)
print('\n'.join(outs))
