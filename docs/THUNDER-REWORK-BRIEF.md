# Lightning moves rework: brief

The user plays Cocopets on an iPhone 17 (Chrome, the Claude-hosted build) and a 2019 iMac. Their verdict on the Lightning
(element key `thunder`) moves in `src/js/20k9-elem-thunder.js`: "god awful". They wrote ten new **Ultimates**
(`docs/elem-spec/thunder-ults.md`, verbatim — follow it closely, including every level 1 / 4 / 7 detail) and asked that the
ten **Strong attacks** (`docs/elem-spec/thunder.md`, STRONG section) get the same quality upgrade the fire moves got.
They want "beautiful effects and high quality animations like the fire ults ... up to standard with glows and particles".

## The bar
The fire rework (`src/js/20k6b..e-fire-*.js`, kit `20k6a-fire-kit.js`) is what the user now likes: shaded volumes, a
glow and particles round everything, floor light, buildup → release → beautiful fade, pieces that change visibly with
evolution, never covering the pet. Also: `src/js/20b3-espike.js` (Spike Bloom) for faceted 3D shading. Lessons from the
fire round (the user's own feedback): abstract, luminous, translucent spirit forms read far better than attempts at
detailed creature models; anything that looks flat/2D/blobby gets rejected; dark marks left on the floor are disliked
(leave only fading light — violet impressions that fade out, never dark scorch); everything heavy must be cheap enough
for an iPhone (cache offscreen sprites for repeated shapes; no per-frame gradient creation in loops; no shadowBlur/filter;
particle counts via `H.n()` / `H.Q()`).

## Tools
- The toolkit H: `src/js/20k1-elem-core.js` (`create`: hitArea/Line/Cone/Ring, pull/push/slow/lift/bind, warn/warnLine/
  warnCone, P/burst particles, sphere/slab/glass/ribbon/core/softShadow, sx/sy world→screen, GY floor squash, ease, fade,
  n(k), Q()), `H.X` (light, shake, flash, sfx, ring, boom, hitMon, nearestMon, after, zap, bolt, hitstop...).
- **The lightning kit** `src/js/20k9a-thunder-kit.js` (`TK`): `const K = TK.bind(H)` gives the palette K.P (white, core,
  cyan, blue, ice, violet, deep, night, gold, amber), `bolt`, `arc` (re-growing forked arcs), `skyBolt`, `path`, `ribbon`
  (white-head / cyan / violet-fringe plasma trail), `orb`, `shockRing`, `groundArcs`, `scar` (fading violet impression),
  `glow`, `floorLight`, particles `sparks`, `motes`, `goldSparks`, `aura`, `zapAt`, and evolution helpers `evo(C)`,
  `evoN(C, a, b)`, `lv(C, [n1, n4, n7])`, `evoK(C)`. You may ADD functions at the end of K (others use it too; never
  change an existing one's behaviour). Move-specific shapes live in your own file.
- Old helpers to read for ideas: `20k9-elem-thunder.js`.

## Files
Each worker writes ONE new file that loads after the old one and replaces its keys:
```js
/* ---------- Lightning, reworked: <moves> ---------- */
(() => { const S = ELEM_IMPL.thunder.strong, U = ELEM_IMPL.thunder.ult; /* S.<key> = (C, H) => { const K = TK.bind(H); ... } */ })();
```
The new Ultimates' keys are in `ELEM_MOVES.thunder.ult` (already changed): flash, thunderstorm, widepressure, ragnarok,
supreme, glory, heavensbow, lotus, butterfly, worldsplitter. The old Ultimate keys (thunderking, ninedragon, ...) are
registered by the old file; the worker with `20k9b` deletes them: `for (const k of ['thunderking','ninedragon',
'capacitorsky','thunderloom','stormbird','magnetar','thousandbells','heavenrail','lightningtree','heartbeat']) delete U[k];`
(tests iterate the impl keys).

## Rules for every move
1. Follow the spec's look and its level 1 / 4 / 7 counts exactly (C.evo 1..7; stages between build up sensibly).
2. Buildup → release → fade; glows and particles round everything; floor light; strikes leave fading violet traces only.
3. Never cover the pet: things centred on it form round/behind it; fade where something tall would pass over it.
   Moves that move the pet (Lightning Flash) use the game's dash/position safely: set `H.me.inv` (invulnerable) during
   the dashes, keep the pet on walkable ground (`H.walk(x, y)` / `H.X.walkPoint`), and end where it can stand.
4. Damage: an Ultimate's total ≈ `C.base × 12–16 × C.K × K.evoK(C)` (look at the old ults' factors for scale; Ragnarok and
   Worldsplitter at the top) split over its pieces; a Strong's ≈ its old factor × C.K × evoK. Hits land only where
   something visibly strikes. Control (stun/paralysis) through `C.dmgO({ stun })` and H.slow etc.; bosses must not be
   locked for long (cap a boss's stun at ~1 s: check `m.boss`).
5. Timing: an Ultimate's cast ~3–5 s (Supreme Thunder lasts 10 s by design). Every fx and zone cleaned up afterwards.
6. Performance: iPhone. ≤ ~60 arcs/strokes-heavy items per frame at Celestial; cache repeated shapes as sprites.

## Checking
- Build your own test page: `python3 src/build.py --test-only test-<you>.html` (never test.html; never commit).
  If `window.__pp` never appears it is a syntax error: extract the largest `<script>` and `node --check` it; beware a
  trailing `// comment` on a one-line function (use `/* */`).
- Run: `HTML=test-<you>.html ELEM=thunder ONLY=<keys> SHOTS=1 SHOT_MS=750 SHOT_MS_ULT=1700 EVO=1 node tests/elem-moves.js`,
  again with EVO=4 and EVO=7. The headless page runs slowly (~5 fps, slower under load): take your own shots at exact
  game times through the cast (buildup, release, fade) with the game paused between shots, and LOOK at every one.
  Iterate until each move is beautiful and clearly matches its spec at each level.
- Other workers run tests at the same time: run yours one at a time; keep your scripts in your own scratch subfolder
  (`/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/<you>/`); never pkill/pgrep -f others.

When done, report: your file, what each move looks like at levels 1 / 4 / 7, and the test output.
