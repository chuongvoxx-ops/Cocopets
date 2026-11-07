# Dark Strongs — upgrade round (three workers, one move each)

The user (2026-11-07), verbatim:
"We will now rework and overhaul the strong attacks for Dark:
Eclipse disc: upgrade the visual so that it's on par with the ults, I want advance shading, texture and 3d effects, the
disc will be slightly bigger and animate properly, will contract and get smaller and then burst, stronger damages as
pets evolve.
Inkfang: upgrade the visual so that it's on par with the ults, I want advance shading, texture and 3d effects, 1 fang at
base, 2 at level 4, 3 at level 7.
Nightneedle cluster: upgrade the visual so that it's on par with the ults, I want advance shading, texture and 3d
effects, more needles as pets evolve."

## What exists
`src/js/20k5-elem-dark.js`: `S.inkfang` (~line 42), `S.eclipsedisc` (~49), `S.nightneedle` (~73) — read each one's
timeline, hits, damage and range, keep the gameplay feel (a Strong is a quick ~1–2 s move with cd 2.4–2.6 s, cost 24),
and rebuild the picture. Don't edit 20k5; each worker writes a new file that redefines its key (it loads later and
overrides). Rows in `src/js/20k1-elem-core.js` already have updated descriptions; don't edit them.

## Files
| Worker | File | Move |
|---|---|---|
| D1 | `src/js/20k5l-dark-strong-1.js` | Eclipse Disc `S.eclipsedisc` |
| D2 | `src/js/20k5m-dark-strong-2.js` | Inkfang `S.inkfang` |
| D3 | `src/js/20k5n-dark-strong-3.js` | Nightneedle Cluster `S.nightneedle` |
Wrapper: `(() => { const S = ELEM_IMPL.dark.strong; S.<key> = (C, H) => { ... }; })();`

## Standard (the user's bar: "on par with the ults")
- Study the Dark ults: `20k5g` (Final Eclipse, 3D obsidian), `20k5k` (Dead Scream, cached shaded relief), `20k5i`
  (Annihilation), `20k5h` (Umbra Heart, glossy shadow), `20k5c` (Dark Side of the Moon); and the Light pink Strong
  reworks `20k4k`–`20k4o` (Strongs brought to ult quality — copy their structure). Palette in docs/DARK-BRIEF.md: void
  #08050F, body #180B2E, plum #2B0B45, smoky violet #463052, energy #6D28A8, edges #A55CFF, accents #D0AEFF.
- Advanced shading, texture and real 3D-looking volume: cached sprites rendered once (per size / angle bucket), lazy
  bake on a small per-frame budget, plus a `S.<key>.warm` idle hook if the move has heavy sprites (the 20b warm hook
  only calls ults — check; if it doesn't call strongs, bake lazily on first cast within ~2 ms slices).
- Feather every edge, light-only floor marks (violet light and fading smoke, no dark stains), never cover the pet,
  readable under glow, clean up fully. Strongs fire often: keep each ≲ 0.8 ms/frame and no hitch > ~6 ms.
- Damage: keep each move's existing total at L1 and scale up with evolution (C.evo 1..7: Adept 4, Celestial 7) — e.g.
  ×(1 + 0.08·(evo−1)) like the ults, or a little more for Eclipse Disc ("stronger damage as pets evolve") — state it.
- Counts: Inkfang 1 / 2 at Adept (evo 4) / 3 at Celestial (evo 7) fangs (hold until breakpoints; each fang its own
  lunge path fanned around the aim, one hit per monster per fang); Nightneedle more needles by level (e.g. 7 → 9 → 11 →
  13 → 15 → 17 → 20; state yours), keeping total damage sensible (per-needle damage scaled so the total grows modestly).
- Eclipse Disc: slightly bigger (≈1.2–1.3×), proper animation: forms, spins as a shaded 3D disc (obsidian face with a
  violet rim, texture, a moving highlight, tilt), slides through the monsters hitting them, then contracts and shrinks
  to a point and bursts (a separate burst hit in a small radius).

## Checking (each worker)
- Own page `python3 src/build.py --test-only test-<d1|d2|d3>.html` (never test.html; never commit or push).
- `ELEM=dark ONLY=<key> EVO=1|4|7 HTML=<page> node tests/elem-moves.js` must pass (note: Blackglass Fracture is a known
  pre-existing failure — not yours).
- A montage at `/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/dark-strong/<key>.png`
  (rows L1/L4/L7, key beats; copy and adapt `.../scratchpad/rocky/shot.js` for a Strong), look, iterate to the bar.
- Report briefly: file, damage by level, counts, ms, anything unverified.
