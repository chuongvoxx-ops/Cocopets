# Fire moves rework: brief

The user plays Cocopets on an iPhone 17 and a 2019 iMac. Their verdict on the twenty fire elemental moves
(`src/js/20k6-elem-fire.js`): they don't look good enough. They want them **more elaborate, with better shading,
animation and effects, on the level of the Spike Bloom** (`src/js/20b3-espike.js`: faceted 3D volumes, a lit face and a
shaded face, bright edges, an outline, a glow and a crack at the foot, element detail, particles). Their words: "all fire
skills should also have a glow and particles effects around the fire attacks". Specifically: "The fire talon tails fire ult
[U09 Nine-Tailed Conflagration] should form as a circle around the pets and not cover up the pet, it looks really bad."
And the moves now **evolve with the pet**: "the fire wheel at first form should just be one, but at celestial should be 7
wheels."

## What exists
- The design of each move: `docs/elem-spec/fire.md` (F-S01..F-S10, F-U01..F-U10). Keep each move's identity and name.
- The current implementations: `src/js/20k6-elem-fire.js` (read your moves there, and its helpers: tongue, sheet, molten,
  plate, scorch, shimmer, phoenix, lantern, furnace, blade, banner). The toolkit H: `src/js/20k1-elem-core.js` (`create`:
  hitArea/Line/Cone/Ring, pull/push/slow/lift/bind, warn/warnLine/warnCone, fire (burning ground), P/burst particles,
  sphere/slab/glass/trail/core/softShadow/ribbon, sx/sy world→screen, GY floor squash, ease, fade, n(k) and Q() for
  Settings → "Fewer effects").
- **The new fire kit** `src/js/20k6a-fire-kit.js` (`FK`): `const K = FK.bind(H)` at cast time gives volumetric `flame`,
  `flameAt`, `fireball`, `ribbon`, `flameRing`, `scorch`, `shockRing`, `glow`, `floorLight`, particle helpers `embers`,
  `sparks`, `flakes`, `smoke`, `aura(x, y, r, dt, rate, z)` (the living air of embers and sparks round a burning thing;
  call it every update), `ignite`, `blast`, and the evolution helpers `evo(C)`, `evoN(C, a, b)`, `evoK(C)`. Use it for every
  flame. You may add to the kit **only by adding new functions at the end of K** (another worker is using it too; never
  change an existing function's behaviour). Better: keep move-specific shapes in your own file.

## What to do
Rewrite your five moves in a NEW file of your own (named below). It loads after the old file and replaces those keys:
```js
/* ---------- Fire, reworked: <your moves> ---------- */
(() => {
  const S = ELEM_IMPL.fire.strong, U = ELEM_IMPL.fire.ult;   // assign S.<key> = (C, H) => { const K = FK.bind(H); ... }
  ...
})();
```
Do not edit `20k6-elem-fire.js` (other workers read it); its old bodies are removed later.

For every move:
1. **Look**: every flame a shaded volume (FK.flame or better); molten/solid things shaded with 3–4 tone ramps, a dark
   crust, glowing seams, a rim light and an outline; every burning object casts `floorLight` and sheds `aura` embers;
   hits leave a `scorch`; impacts get `shockRing`, sparks, flakes, smoke; a heat shimmer where it is hottest. Anticipation
   (a wind-up/gathering), the strike, and a lingering afterglow that fades — never a pop in or out. Readable silhouettes at
   phone size (the pet is ~1 tile, T px; the screen ~9 tiles wide).
2. **Never cover the pet**: anything centred on the pet forms round it (a ring, behind it, or above it), drawn so the pet
   stays visible. Draw ground things in `drawUnder`, tall things in `draw`.
3. **Evolution** (`C.evo` 1..7: 1 Hatchling, 5 Guardian, 7 Celestial): each move grows visibly with the pet — more pieces
   (Firewheel Skip: `FK.evoN(C, 1, 7)` wheels), bigger radius, extra waves, an added finale at Celestial. Damage: the total
   is `C.base * <the move's current factor> * C.K * FK.evoK(C)`, split over the pieces so a seven-wheel cast deals about
   `evoK` times a one-wheel cast in total, not seven times (the Guardian/Celestial tier multipliers are applied
   elsewhere). Write one line in the move's header comment saying what evolution changes.
4. **Performance**: an iPhone and a 2019 iMac. Cache what you can (no new canvases per frame; gradients are fine in
   moderation); scale particle counts by `H.n()` / `H.Q()`; at most ~40 flames drawn at once even at Celestial.
5. Keep: damage lands only where something visibly strikes; warnings in the pet's colour (`C.col`); control through
   H.pull/lift/slow (boss-safe); every fx and zone cleaned up afterwards; the move's timing roughly as now.

## Checking
- Build your own test page: `python3 src/build.py --test-only test-<you>.html` (never test.html; never commit).
- If `window.__pp` never appears it is a syntax error: extract the largest `<script>` and `node --check` it. Beware a
  trailing `// comment` on a one-line function (it comments out the rest of the line): use `/* */`.
- Run: `HTML=test-<you>.html ELEM=fire ONLY=<key,key> SHOTS=1 SHOT_MS=750 SHOT_MS_ULT=1700 EVO=1 node tests/elem-moves.js`
  and again with `EVO=7`; screenshots land in `shots/elem-fire-<slot>-<key>-evo<N>.png`. The headless page runs at ~5 fps,
  so also take shots at other moments (vary SHOT_MS) to see the wind-up, the strike and the afterglow. **Look at every
  shot** and iterate until each move is clearly better than before (compare with the old `shots/elem-fire-*-<key>.png`).
  The test must report every move lands damage, cleans up, no page errors.
- Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (the test already uses it). Other workers run tests at
  the same time: run yours one at a time, and never `pkill`/`pgrep -f` other processes.

When done, report: your file, what each move now looks like and what evolution does to it, and the test output.
