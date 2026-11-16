#!/usr/bin/env python3
"""shots/gpu-skills-list.md from the measure pass. usage: makelist.py <measure json> <elemdef.json> <out.md> [capture dir]"""
import sys, os, json, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheet import load, base_of, classify

res = load([sys.argv[1]]); base = base_of(res); EDEF = json.load(open(sys.argv[2])); OUT = sys.argv[3]
CD = sys.argv[4] if len(sys.argv) > 4 else None
LV = {e + ':' + m['key']: m['lv'] for e, L0 in json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'enum.json')))['elem'].items() for m in L0}
E8 = {'fire': 'fire', 'frost': 'ice', 'leaf': 'wind', 'spark': 'thunder', 'cosmic': 'dark', 'bubble': 'water', 'candy': 'light', 'shadow': 'dark', 'gold': 'earth', 'prism': 'light'}
WRAP = {'fire': '20k6c-fire-strong-2.js', 'water': '20k7p-water-gpu.js', 'ice': '20k8h-ice-strong-2.js', 'thunder': '20k9h-thunder-strong-2.js'}
KIT = {'fire': '20k6a-fire-kit.js', 'water': '20k7a-water-kit.js', 'ice': '20k8a-ice-kit.js', 'thunder': '20k9a-thunder-kit.js', 'wind': '20k3l-wind-kit.js'}
rows, seen = [], set()
for r in res:
    if r['group'] == 'baseline' or r['id'] in seen: continue
    seen.add(r['id']); classify(r, base)
    g = r['group']; slot = 'Strong' if r['slot'] == 'strong' else 'Ult'
    if g.startswith('elem:'):
        e = g[5:]; k = r['key'][3:]; d = EDEF.get(e + ':' + k) or []; f = d[-1] if d else '?'
        files = [f] + ([WRAP[e]] if e in WRAP and WRAP[e] != f else []) + ([KIT[e]] if e in KIT and r['gpu'] != '2D' else [])
        mid, el, who = f'e:{e}:{k}', e, f'any star; {e} pets from Dungeon Lv {LV.get(e + ":" + k, "?")}'
        sect = 'Elemental Strongs (' + e + ')'
    elif g == 'cards':
        mid, el, who = r['key'], f"{E8.get(r['el'], r['el'])} ({r['el']})", 'any star (ability card, ' + r.get('rarity', '') + ')'
        files = ['02d-cards.js', '20b-game-dungeon.js']; sect = 'Ability cards'
    elif g == 'innate':
        mid, el = r['key'], "pet's own"
        who = "1-3 star pets' own Strong; any pet's 2nd Strong (Adept+)" if r['slot'] == 'strong' else "1-3 star pets' own Ult"
        files = ['02c-ability.js', '02d-cards.js', '20b-game-dungeon.js']; sect = "Innate moves (from the pet's body)"
    else:
        t = g[4:]; mid, el = r['key'], "pet's own" + (' (Throne of the Sun: fire/ice/water/thunder/light variants)' if r['key'] == 'y_sunthrone' else '')
        who = {'4': '4 star (own move; or inherited by fusion)', '5': '5 star pool, but starKit now gives 5 star pets elemental signature moves; reachable only through fusion inheritance (abOv)', '6': '6 star golden Legendary (8% roll per move; or inherited by fusion)'}[t]
        files = ['20k-dun-star.js'] + ([] if r['gpu'] != 'GPU (shared pass)' else ['20b-game-dungeon.js (shared pass)']); sect = f'STAR{t} signature moves'
    nfr = len(glob.glob(os.path.join(CD, 'raw', r['id'], '*.png'))) if CD else 0
    rows.append(dict(sect=sect, id=mid, name=r['name'], el=el, slot=slot, tier=('STAR' + g[4:]) if g.startswith('star') else ('elemental' if g.startswith('elem') else g), who=who, gpu=r['gpu'], files=', '.join(files),
                     q=f"{r['sumOwnQ']} / {r['sumExtra']}", note=r.get('note', ''), frames=nfr))

def count(f): return sum(1 for x in rows if f(x))
low = lambda x: not x['tier'].startswith('STAR5') and not x['tier'].startswith('STAR6')
L = ['# GPU survey: Strongs and Ults in the Tower', '',
     'Every Strong and Ult that a pet can cast in the Tower was cast on a Tower floor (floor 3, five monsters in front of the pet) with the GPU path forced on the software rasteriser (`window.__NG_GL = 1`, swiftshader).',
     'For each move, the instrumentation counted, frame by frame, the FGFX quads queued by the move\'s own drawing (`ELEM.draw`, `STAR.draw`, `drawEnt`), the extra quads that the Tower\'s shared GPU pass (v354, `20b-game-dungeon.js` `dqBegin`) drew for it above an idle or empty-cast baseline, and the 2D canvas calls of the move\'s own drawing.', '',
     '- **GPU (own)**: the move\'s own drawing queues GPU quads, through FGFX (the shared painter in `20k6h-fire-nidhogg-moves.js`) or an element kit\'s `gpuBegin`. No 1-4 star move uses GLM or another WebGL context of its own.',
     '- **GPU (shared pass)**: the move has no drawing of its own, or only a little; its picture is the Tower\'s common effects (pet shots, shock rings, beams, bolts, pillars, slashes, meteors, dragons, burning ground, vortices), which the Tower\'s GPU pass paints. This applies to the innate, card and star moves only. An elemental Strong counts as GPU only when its own drawing paints on the GPU.',
     '- **2D**: canvas only, or only incidental shared-pass glows. "Quads" are summed over the sampled frames (every 0.1 s, for 2 s after a Strong and 3.2 s after an Ult), given as own / shared-pass extra.', '',
     '## Counts', '']
L.append(f"- Moves that 1-4 star pets can use (Strongs and Ults; Normals are listed separately below): **{count(low)}**. GPU: **{count(lambda x: low(x) and x['gpu'] != '2D')}** ({count(lambda x: low(x) and x['gpu'] == 'GPU (own)')} with their own painter, {count(lambda x: low(x) and x['gpu'] == 'GPU (shared pass)')} through the shared pass). 2D only: **{count(lambda x: low(x) and x['gpu'] == '2D')}**.")
for s in ['innate', 'cards', 'STAR4', 'elemental']:
    f = lambda x, s=s: x['tier'] == s
    L.append(f"  - {s}: {count(f)} moves, {count(lambda x: f(x) and x['gpu'] != '2D')} GPU, {count(lambda x: f(x) and x['gpu'] == '2D')} 2D")
hi = lambda x: not low(x)
L.append(f"- 5 and 6 star signature moves (added at the lead's request): **{count(hi)}**. GPU: **{count(lambda x: hi(x) and x['gpu'] != '2D')}**. 2D: **{count(lambda x: hi(x) and x['gpu'] == '2D')}**.")
for s in ['STAR5', 'STAR6']:
    f = lambda x, s=s: x['tier'] == s
    L.append(f"  - {s}: {count(f)} moves, {count(lambda x: f(x) and x['gpu'] != '2D')} GPU, {count(lambda x: f(x) and x['gpu'] == '2D')} 2D")
L += ['- Not counted: the elemental Ults (5 star or higher, `ELEM_ULT_STARS = 5`), including the four dark Ults being rebuilt (doomsday, finaleclipse, annihilation, deadscream). The 21 Normal attacks are listed below.', '']
cur = None
for x in rows:
    if x['sect'] != cur:
        cur = x['sect']; L += ['', f'## {cur}', '', '| move id | name | element | slot | tier | who can use it | render | quads own / shared | frames | file(s) |', '|---|---|---|---|---|---|---|---|---|---|']
    L.append(f"| `{x['id']}` | {x['name']} | {x['el']} | {x['slot']} | {x['tier']} | {x['who']} | {x['gpu']}{(' (' + x['note'] + ')') if x['note'] else ''} | {x['q']} | {x['frames']} | {x['files']} |")
L += ['', '## Normal attacks (not captured)', '',
      'There are 12 innate Normals (`n_twin`, `n_volley`, `n_spread`, `n_lance`, `n_seeker`, `n_wave`, `n_burst`, `n_chain`, `n_orbit`, `n_bouncer`, `n_boomerang`, `n_shard`) and 9 Normal cards (`firedart`, `icicle`, `leafblade`, `sparkzap`, `bubblebomb`, `shadowclaw`, `prismlaser`, `starboom`, `comet`). All of them are **2D**: the Tower\'s GPU pass skips shots with `src: \'normal\'` (`20b-game-dungeon.js` `drawShots`: `if (DQ && b.src !== \'normal\')`). Their hit booms and rings, and the burning ground that `comet` leaves behind, still go through the shared pass.', '']
open(OUT, 'w').write('\n'.join(L) + '\n')
print('rows', len(rows), 'low', count(low), 'lowGPU', count(lambda x: low(x) and x['gpu'] != '2D'))
