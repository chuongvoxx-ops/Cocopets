# Wind ultimates — round 1 (four workers)

The user's spec, verbatim: `docs/elem-spec/wind-ults.md` (four moves W1–W4, then the user's master implementation prompt
with the shared visual/engineering direction and the Wind palette: mint #73E8B6, emerald #16A57B, pale air #E7FFF6,
blossom pink #FFAFD2, petal accent #DE5A9A). H = the pet's height ≈ 1 tile (use `C.K` for area scale like other ults).

## House standard (the user's feedback over many rounds — read before writing)
- The bar: the best reworked ults — Ice `src/js/20k8f-ice-ult-5.js` (U.catastrophe: the "Catastrophe" the spec names as
  Terrible Tornado's reference — it exists; study it), Dark `20k5g` (Final Eclipse) and `20k5k` (Dead Scream), Earth
  `20k2b`–`20k2k`, Light pink `20k4*` (petals/hearts helpers, ribbons in 20k4f Ribbon Heartache).
- Feather EVERY edge (ribbon ends, funnel rims, ring edges, decal borders) — no hard lines anywhere; floor marks are
  light-only and fade; never cover the pet (dim smoothly); readable models under glow (shading + rim, solid cores);
  smooth continuous motion; buildup → action → release → graceful exit; full cleanup on end, floor change and death.
- PERFORMANCE matters a lot (the user plays on an iPhone and a 2019 iMac and has complained about slowdowns): cache
  sprites (petals, flowers, swords, ribbon segments) once, no per-frame gradients in loops, no shadowBlur/filters,
  particles via `H.n()`/`H.Q()`, instanced draws; 600 flowers must be cheap blits from a few cached sprite variants ×
  rotation buckets. Target Celestial ≲ 3 ms/frame warm; no first-cast hitch > ~8 ms (bake detailed models lazily in
  small slices, like Titan 20k2j / Rocky 20k2k, and warm them in idle time via their `U.<key>.warm` hook in 20b).
- Damage: ≈ `C.base × 12–16 × C.K × (1 + 0.08 × (evo − 1))` for a monster in the area the whole time at L1 (Celestial may
  reach ~20×); continuous damage on a fixed 0.5 s tick on the game clock (`f.t`); one hit per enemy per wave/pulse/volume;
  decorative particles never deal damage. Discrete counts hold until their breakpoint (L1/L4/L7), continuous values
  interpolate. Bosses resist pulls/displacement (use the game's existing conventions) but take damage.
- Toolkit `H` in `src/js/20k1-elem-core.js` (add, hitArea/hitLine/hitRing, pull, sortNear, living, X.* helpers).

## Rows and files (rows already set in 20k1 — don't edit except fixing your own description)
| Worker | File | Move | Replaces |
|---|---|---|---|
| A | `src/js/20k3b-wind-ult-1.js` | W1 Flower Hurricane `U.flowerhurricane` | `delete U.carousel` |
| B | `src/js/20k3c-wind-ult-2.js` | W2 Monsoon `U.monsoon` (cd 25 set) | `delete U.tempest` |
| C | `src/js/20k3d-wind-ult-3.js` | W3 Terrible Tornado `U.terribletornado` | `delete U.hurricane` |
| D | `src/js/20k3e-wind-ult-4.js` | W4 1000 Blades `U.thousandblades` | `delete U.migration` |
Wrapper: `(() => { const U = ELEM_IMPL.wind.ult; delete U.<old>; U.<key> = (C, H) => { ... }; })();`
Don't edit shared files (20b, 12-arcade, tests/) except: a worker whose move lasts > 9 s may add `<key> ? N :` to the
TAILW rule in tests/elem-moves.js (re-read first; another worker may edit the same line — keep both).

## Checking
- Own page: `python3 src/build.py --test-only test-w<a|b|c|d>.html` (never test.html; never commit or push).
- `ELEM=wind ONLY=<key> EVO=1|4|7 HTML=<page> node tests/elem-moves.js` must pass.
- Screenshot montage from the real gameplay camera (copy and adapt
  `/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/rocky/shot.js`) at
  `.../scratchpad/wind-<a|b|c|d>/<key>.png` (rows L1/L4/L7, key beats), LOOK at it, fix, iterate to the bar.
- Measure ms/frame warm and cold at Celestial. Report briefly: files, damage per level, counts verified, ms, anything
  unverified.
