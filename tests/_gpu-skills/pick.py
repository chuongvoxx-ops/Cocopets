import sys, json
sys.path.insert(0, '.')
from sheet import load, base_of, classify, pick
res = load(sys.argv[1].split(',')); base = base_of(res); out = {}
for r in res:
    if r['group'] == 'baseline': continue
    classify(r, base)
    if r['gpu'] != '2D': out[r['id']] = [r['samples'][i]['t'] for i in pick(r, n=2 if r['slot'] == 'ult' else 1)]
    print(f"{r['id']:44} {r['gpu']:18} own {r['sumOwnQ']:6} extra {r['sumExtra']:6} -> {out.get(r['id'])}")
json.dump(out, open(sys.argv[2], 'w'))
