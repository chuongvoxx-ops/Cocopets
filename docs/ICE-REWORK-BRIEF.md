# Ice moves rework: brief

The user plays Cocopets on an iPhone 17 (Chrome, the Claude-hosted build) and a 2019 iMac. After the fire and lightning
reworks (which they now love) they asked for Ice, element key `ice`, in `src/js/20k8-elem-ice.js`. Their design and the
key mapping are in `docs/elem-spec/ice-rework.md` (verbatim — follow it closely, including every level 1 / 4 / 7 detail).
They like only two current ice moves, Rimecoil (Strong) and Frozen Orrery (Ult): keep exactly their look at level 1 and
make them 3x bigger (and 3x the damage for the Orrery) at Celestial. Thousand-Wing Snowfall and Heart of Absolute Winter
become Strong attacks (rebuild them at Strong scale: ~1–2.5 s, smaller area, Strong damage), and every other Strong is
rehauled to the fire/lightning standard and escalates with evolution ("skills should get stronger and more elaborate by
level 7": more pieces at Adept, a repeated climax at Celestial, each repeat bigger than the last).

## The bar
The fire rework (`src/js/20k6b..e-fire-*.js`) and the lightning rework (`src/js/20k9b..h-thunder-*.js`, kit
`20k9a-thunder-kit.js`) are what the user now likes: shaded volumes, a glow and particles round everything, floor light,
buildup → release → beautiful fade, pieces that change visibly with evolution, never covering the pet. Also
`src/js/20b3-espike.js` (Spike Bloom) for faceted 3D shading — ice should feel like it: faceted translucent crystal.
Lessons (the user's own feedback): abstract, luminous, translucent spirit forms read far better than detailed creature
models; anything flat/2D/blobby gets rejected; no dark marks left on the floor (only fading light/frost that fades out);
everything must be cheap enough for an iPhone (cache sprites; no per-frame gradient creation in loops; no
shadowBlur/filter; particles via `H.n()` / `H.Q()`). The large shapes must stay visible inside the glow.

## Tools
- The toolkit H: `src/js/20k1-elem-core.js` (`create`: hitArea/Line/Cone/Ring, pull/push/slow/lift/bind, warn/warnLine/
  warnCone, P/burst particles, sphere/slab/glass/ribbon/core/softShadow, sx/sy world→screen, GY floor squash, ease, fade,
  n(k), Q()), `H.X` (light, shake, flash, sfx, ring, boom, hitMon, nearestMon, after, hitstop...). Freezing: `C.dmgO({
  freeze: secs })` / `chill`, and H.bind/H.slow; bosses only a short chill (cap a boss's freeze at ~1 s).
- **The ice kit** `src/js/20k8a-ice-kit.js` (`IK`): `const K = IK.bind(H)` gives the palette K.P (white, frost, pale,
  cyan, ice, blue, deep, abyss, lav, silver), `shard` (a cached faceted translucent crystal sprite at any angle, with a
  sliding lavender glint), `crystal` (a standing shard with glow and floor light), `iceRing`, `frostVeins`, `frozenPool`,
  `mist`, `glow`, `floorLight`, particles `snow`, `glitter`, `fragments`, `aura`, `shatterAt`, and evolution helpers
  `evo(C)`, `evoN(C, a, b)`, `lv(C, [n1, n4, n7])`, `evoK(C)`. You may ADD functions at the end of K (others use it
  too; never change an existing one's behaviour). Move-specific shapes live in your own file.
- The old implementations (read for the two kept moves, which must keep their look): `20k8-elem-ice.js`.
- NOTE (a trap the lightning workers hit): the runner calls `draw`/`drawUnder` with the GAME clock as `t`, not the
  effect's own time; timeline logic inside a draw must use `f.t`.

## Files
Each worker writes ONE new file that loads after the old one and replaces its keys:
```js
/* ---------- Ice, reworked: <moves> ---------- */
(() => { const S = ELEM_IMPL.ice.strong, U = ELEM_IMPL.ice.ult; /* S.<key> = (C, H) => { const K = IK.bind(H); ... } */ })();
```
The old keys that no longer exist are deleted by the worker with `20k8b`: `for (const k of ['wintermoth','hailshot'])
delete S[k]; for (const k of ['stillwinter','aurorastag','snowglass','whitecomet','hourglass','sevenfold',
'mirrorlabyrinth','snowfall','absolutewinter']) delete U[k];` (tests iterate the impl keys).

## Rules for every move
1. Follow the spec's look and its level 1 / 4 / 7 counts exactly (C.evo 1..7; stages between build up sensibly).
2. Buildup → release → fade; glows and particles round everything; floor light; frost that fades (nothing dark).
3. Never cover the pet: things centred on it form round/behind it; fade where something tall would pass over it.
4. Damage: an Ultimate's total ≈ `C.base × 12–16 × C.K × K.evoK(C)` (Ice Age at the top; Frozen Orrery 3x at Celestial
   per the user) split over its pieces; a Strong's ≈ its old factor × C.K × evoK × (1.07 at Adept, 1.15 at Celestial;
   Rimecoil much more at Celestial per the user). Hits land only where something visibly strikes.
5. Timing: an Ultimate's cast ~3–5 s (Let It Go lasts 5/8/12 s and Catastrophe 5→10 s by design); a Strong ~1–2.5 s.
   Every fx and zone cleaned up afterwards.
6. Performance: iPhone. Cache repeated shapes as sprites; keep per-frame work modest even at Celestial.

## Checking
- Build your own test page: `python3 src/build.py --test-only test-<you>.html` (never test.html; never commit).
  If `window.__pp` never appears it is a syntax error: extract the largest `<script>` and `node --check` it; beware a
  trailing `// comment` on a one-line function (use `/* */`).
- Run: `HTML=test-<you>.html ELEM=ice ONLY=<keys> SHOTS=1 SHOT_MS=750 SHOT_MS_ULT=1700 EVO=1 node tests/elem-moves.js`,
  again with EVO=4 and EVO=7. The headless page runs slowly: take your own shots at exact game times through the cast
  (buildup, release, fade) with the game paused between shots, and LOOK at every one. Iterate until each move is
  beautiful and clearly matches its spec at each level.
- Other workers run tests at the same time: run yours one at a time; keep your scripts in your own scratch subfolder
  (`/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/<you>/`); never pkill/pgrep -f others.

When done, report: your file, what each move looks like at levels 1 / 4 / 7, and the test output.
