# Jaws: 11th Water ult (the lead plus the Fenrir and Belladonna team)

- **Spec:** `docs/elem-spec/water-jaws.md`. Read all of it; it is the user's own text and it wins over this brief.
- **Concept sheet:** `/mnt/user-data/attachments/78d1fddd-217b-590c-9262-fa063f90a263/60ee4873-image.png` (top: Jaws,
  the shark form; bottom: Leviathan, the siege form). The user's own design. Reference only; never copy it into the
  repo.
- **Method (the user's instruction):** "use the same team and method as belladonna". The lead writes the base model and
  the transformation blockout and leads the animation and effects; M, A, E and H support. Everything in real 3D on the
  GPU, effects included, with 2D fallbacks.
- **"Update the existing Jaws":** no Jaws ability exists in the game (Water has ten ults; the old "Leviathan's Ribbon"
  is unrelated and long deleted). Jaws is therefore the **11th Water ult**, key `jaws`, kit key `ey_jaws`, unlocked by
  `ELEM_ULT_LV`'s 11th entry (80). There is no saved progression to migrate. The roster row is added by the lead when
  the core lands (a row without an implementation must not ship).

## Fixed numbers (the spec's)
- Duration, shared by both forms: **30 s base, 45 s Adept, 60 s Celestial**. Outer cooldown **150 s**, set once when
  normal control returns. At most **3** Tidal Pools. **One** Shark Attack per summon.
- Provisional cooldowns: Water Ray / Depth Charge slot 2 s, Water Bombs / Maelstrom slot 4 s, Maw / Hydrojet no extra
  cooldown after recovery. Shared per slot across forms; a form change never readies the paired move.

## Files
| Who | Role | File |
|---|---|---|
| **Lead**, with **M** in support | `JAWS_MODEL`: one part set, both forms, the transformation, pose channels, anchors, drawn with `GLM` and M's cel materials (ids 30..35, `S.outline`) | `src/js/20k7m-water-jaws-model.js` |
| **A** | `U.jaws`: session, Nidhogg-style flight for the shark, anchored aiming for Leviathan, Anchor / Release, Maw, Hydrojet, the menu and the extra form button, timers, gauge, the pool registry (create, refresh, replace, claim, consume), cleanup, the animation layer | `src/js/20k7n-water-ult-11.js` |
| **E** | `JAWS_MOVES`: Water Ray, Water Bombs (was Rolling Wave), Depth Charge (plain and empowered), Maelstrom, Shark Attack, the pools' look, Maw's and Hydrojet's effects, the summon, the anchor halo, the exit, sound; real 3D on the GPU with 2D fallbacks | `src/js/20k7o-water-jaws-moves.js` |
| **H** | `tests/jaws.js` (the spec's verify list), the balance audit, anything asked in Notes | tests and Notes |

## Precedents
- **Belladonna** (`20k5ya` / `yb` / `yc`, `docs/WIND-BELLADONNA-BRIEF.md`) for the method, the self-framing camera, the
  3D GPU effects layer and the test's shape. **Fenrir** (`20k8m` / `n` / `o`) for a two-form session with one timer,
  one gauge, shared cooldowns and a contextual menu. **Nidhogg** (`20k6g`) for flight. **Sports Car** (`20k4p`) for
  Drift, which Maw's thrash follows. `camPick` and the VEH hooks in `20b`; `VEH_SMASH` in `20k0v`.

## Decisions already made
- **Size:** the hull, nose to tail root, is the Sports Car's length (about 3.2 tiles); with the tail about 5.
- **Flight:** the shark flies freely like Nidhogg, Susano O's airship and Belladonna (over walls, gaps, water, off
  the map within the flight volume, safe return). Leviathan holds position and altitude; the stick turns the hull.
- **Camera:** the form frames itself (`k > 0`, centred on the model's `center` anchor), so `camPick` gives it the
  camera on rift and fiend floors.
- **The pet** rides in the open cockpit in both forms, drawn by the core with `X.drawPetAt` at `anchor('seat')`,
  upright, never yawed, always visible.
- **Environment:** every attack breaks props through `VEH_SMASH` (the user's standing preference); doors and bridges
  are protected.
- **Tidal Pools** are owned by the core: a registry of at most three records `{ id, x, y, r, born, state }` with states
  `available`, `claimed`, `consumed`; the moves ask the core to create, refresh, claim and consume. Pools are visual
  surfaces only: no terrain, navigation or collision change, no damage, no gauge charge.
- **The extra form button** (Anchor / Release) sits beside the combat menu, small and labelled, with a key (`F`), the
  controller's spare face button if the game maps one, and touch.
- **Shark Attack** works from either form with any number of pools; from Leviathan it folds back to the shark during
  the approach. Its sky beam and the jaw closure are **two authored damage events** (the spec gives the beam "massive
  damage" and the closure "one colossal AoE Water damage event per eligible enemy"); each hits an enemy once;
  `noCharge`.
- **Balance (provisional, H audits):** normal moves near Fenrir's and Belladonna's; the empowered Depth Charge about
  2.5x the plain one; Shark Attack's total near the other finishers (95 / 115 / 125 DK); Dark Messiah stays first.

## Art direction (the lead's)
- **Cel shading with an outline** (M's ids 30 cobalt paint, 31 chrome, 32 dark steel, 33 reactor cyan, 34 tooth, 35
  canopy; `S.outline` on). Cobalt blue and polished chrome dominate; cyan is restrained and reveals structure.
- **The shark swims the air:** tail strokes travelling down the links, the body flexing a little against them, fins
  trimming, banking into turns, the jaw working on attacks.
- **Leviathan is heavy:** it settles, locks audibly, recoils as one mass, its stabilisers tilt on Hydrojet.
- **Water effects** in 3D on the GPU: layered blue depth, translucent turquoise edges, readable foam, shaped
  highlights, dimensional spray; enemies and boss telegraphs stay readable under them. Feathered glows, no hard rims
  on glows.
- **Never** cover the pet's face, except the finisher's brightest beats.

## Standing user rules
- Performance: iPhone and a 2019 iMac. Pool particles. Low effects cut decoration only, never hits.
- No motion-blur ghosts. Timers as deadlines on the game clock. One damage path in the core (`ctx.hit` / `ctx.hitArea`)
  that charges the gauge (after mitigation, no overkill) and smashes.
- Never put reference art in the repo.
- Git: never commit, never push, never touch `test.html`. Build your own page with
  `python3 src/build.py --test-only test-jaw<M|A|E|H>.html`. Use Edit on shared files, never whole-file rewrites.

## The model's API (see the file's header and `blankPose()`)
- `JAWS_MODEL.create()` → `{ pose, draw(c, x, y, z, a, P, o), drawShadow(...) }`; the heading `a` turns the model.
- Channels: `xf` (0 shark .. 1 Leviathan), `alpha`, `swim` (phase, radians), `swimK` (stroke size, 0..1), `jaw` (0..1
  open), `cannon` (0..1 extra extension), `recoil` (0..1), `bank`, `pitch`, `fin`, `tail`, `glow`, `charge` (mouth
  glow), `breath`.
- Anchors: `seat`, `center`, `mouth` (the muzzle), `breech`, `forward`, `head`, `snout`, `reactor`, `belly`, `gillL`,
  `gillR`, `finL`, `finR`, `dorsalTip`, `tailTip`, `jet`.
- `window.__pp.jaws` is the model in test builds; `window.__JAWS_GL = 1` forces the GPU model under software GL.

## M's cel materials (from M's report)
- ids 30..35: second attribute `vA.y` = 1 at a panel line or a plate's edge (darkens from about 0.82; 0.55..0.8 beside a
  line allows paint chips); third attribute `vA.z` = 1 sound paint, 0 worn to bare metal (id 30 only).
- 33 reactor cyan assumes the part's long axis is its local x; `S.t` drives its flow, the item's `glow` its brightness.
- 35 canopy is opaque dark-blue gloss. Item `spill` adds the cyan bounce to 32 and 35; item `wear` scales chips on 30.
- `S.outline` = thickness in pixels of the rendered image (about 1.4 px reads well at a 40 px tile; scale it with the
  render scale); `S.outlineCol`, `S.outlineBias`; per item `outline: false` opts out; needs smooth normals.

## Notes (dated entries; ask each other questions here)
- (H, **balance baseline and suggested numbers, for A and E**) Per activation on one target, in
  DK = base x (1 + 0.08 (evo - 1)), as dealt.
  | | Dodge move | Strong 1 | Strong 2 | Finisher | Gauge | Session |
  |---|---|---|---|---|---|---|
  | Fenrir | Drift 7 | Ice Cannon 7 / 14 / 21 | Somersault 5 + 5, Spinning Wheel 10 | 95 / 115 / 125 | 32 x DK | 20 / 25 / 35 s |
  | Belladonna | Swoosh 4 | Wildflowers 10 x 0.9 = 9 | Ring Blade 10 | Twister 19 ticks + pulse = 95 / 115 / 125 | 32 x DK | 20 / 25 / 35 s |
  | Others | | | | Dark Messiah 130 / 175 / 210 (must stay first), Supernova 97 / 125 / 139, Titan 90 / 103 / 110 | | |
  **Suggested Jaws numbers:**
  - **Maw:** 5 DK, once an enemy over the bite and the thrash together.
  - **Water Ray:** 5 DK, one explosion (radius about 2.2); slot cooldown 2 s. The pool: no damage, no charge.
  - **Rolling Wave:** 7 DK, once an enemy as it passes; slot cooldown 4 s.
  - **Hydrojet:** 0.
  - **Depth Charge:** plain 6 DK (radius about 2.4); empowered **15 DK** (2.5x, radius about 4), one blast an enemy, the
    geyser is its picture only; slot cooldown 2 s (shared with Water Ray).
  - **Maelstrom:** 8 ticks 0.4 s apart x 1.0 DK = 8, then the burst 8 DK = **16 DK** on an enemy inside any captured
    pool, the same with one, two or three pools (one registry a tick and one for the burst across the pools: more pools
    give more ground, never more damage on one enemy); slot cooldown 4 s (shared with Rolling Wave).
    Covered area at pool radius 2.5: about 20 / 39 / 59 square tiles with one / two / three separate pools.
  - **Shark Attack:** the sky beam 30 / 35 / 40 DK and the jaw closure 65 / 80 / 85 DK by tier, each once an enemy =
    **95 / 115 / 125 DK**, `noCharge`. Level with Fenrir's and Belladonna's, under Supernova at evo 4 and 7, Dark
    Messiah's lead 1.37x / 1.52x / 1.68x over it.
  - **Gauge:** the session is 30 / 45 / 60 s, up to 1.7x Belladonna's, and the pool loop (Ray, Wave, Anchor, empowered
    Depth Charge) lands about 33 DK a cycle on a gathered enemy. A flat 32 x DK would fill inside the first quarter of
    a Celestial session. Suggested `chargeK` **36 / 45 / 60 x DK by tier**, so a single-target fight fills it a little
    past the middle of the session at each tier and a crowd fills it sooner. I measure and adjust when it runs.
- (H, **hooks `tests/jaws.js` reads; A, E and the lead please confirm or rename here**) Same pattern as
  `g._belladonna`; the test takes the first name that exists.
  - **A, the session `g._jaws = S`:** `phase` (`'summon' | 'fly' | 'anchor' (transforming in) | 'siege' | 'release'
    (transforming out) | 'maw' | 'hydrojet' | 'finisher' | 'out' | 'gone'`, any names with those meanings), `form`
    (`'shark' | 'leviathan'`), `xf` (0..1), `released`, `left` / `endT`, `dur`, `charge`, `used`, `busy`,
    `cd = { s1, s2, dodge }` (one set for both forms), `V` (`x, y, z, heading, locked`), `ctx`, `vs`, `safe`,
    `pools` (the registry: an array of `{ id, x, y, r, born, state }`, state `'available' | 'claimed' | 'consumed'`,
    consumed ones removed or kept, either is fine), and `stats`: `anchors`, `releases`, `maws`, `mawHits`,
    `hydrojets`, `ray`, `wave`, `depth`, `depthEmp`, `mael`, `maelRefused`, `shark`, `poolsMade`, `poolsRefreshed`,
    `poolsReplaced`, `poolsConsumed`, `claimsReleased`, `smashed`, `cdSet`, `dealt`, `charged`, `offT`,
    `offshoreExit`, `timerSets` (how many times the deadline was written: must end at 1).
    On `ctx`: `pool.create(x, y)`, `pool.claim(id)`, `pool.release(id)`, `pool.consume(id)`, `pool.at(x, y)`, or
    whatever names A gives them (I call them directly for the registry cases: fourth pool, all claimed, cancelled
    claim). The form command: `D.VEH.form()` or `S.ctx.toggleForm()`; tell me which. Labels through `GFX.labelS` in
    `drawBtns`: `MAW`, `WATER RAY`, `ROLLING WAVE`, `ANCHOR` in the shark; `HYDROJET`, `DEPTH CHARGE`, `MAELSTROM`,
    `RELEASE` in Leviathan; `SHARK ATTACK` in both. Damage through `S.X.hitMon` (I wrap it and log each hit).
  - **E, on `ctx` and `JAWS_MOVES.stats`:** `ctx.maelPlan = { t0, ticks, at: [deadlines], pools: [ids], burstAt,
    fired }` set when the channel starts; `ctx.depthPlan = { id (the claimed pool or null), empowered, t0, t1 }` a shot;
    `ctx.sharkPlan = { beamAt, biteAt, fired: { beam, bite } }`; `stats`: `maelTicks`, `maelBursts`, `depthBlasts`,
    `beamHits`, `biteHits`. Each hit's options carry `src` (`'maw' | 'ray' | 'wave' | 'depth' | 'geyser' | 'mael' |
    'maelBurst' | 'beam' | 'bite'`) so the log can tell the events apart; if that is awkward, tell me how you tell
    them apart.
  - **Lead, `JAWS_MODEL`:** `PARTS` or a `COUNTS` built from the rig, with the same part names present at `xf` 0 and
    `xf` 1 (I check the part set is identical in both forms and that `anchorAt('seat', ...)` is finite and the seat's
    up stays upright through `xf` 0..1 in steps of 0.1).

### M, the detail pass on the model (`20k7m`) (2026-11-12)
The part set, the rig's structure, the stage order, the channels and the anchors' names are the lead's. What changed:
- **Head:** its own section (`hsec`: squarer, flatter, the top sloping to a chrome snout), a blue cap with a silver chevron, chrome cheeks, a brow, socket and angular cyan eye each side, a thick lip, 9 + 9 + 5 upper teeth; the jaw is a thick shell with a chin, 8 + 8 + 4 teeth, hinge bosses with cyan caps and a piston each side (a `strut` between the head and the jaw). The jaw's hinge moved a little forward (`T_JAW` 0.762).
- **Body:** flank plates with real thickness, a raised shoulder plate, a silver stripe, four chevron gill slots in a chrome frame, rivets; the reactor is a cyan cylinder in a cage of chrome rings, dark-steel struts and end bulkheads; fin sockets on the core; a taller dorsal fin and broader pectorals with silver leading edges and markings; armoured tail links with chrome collars and two small fins on link 1; a larger crescent tail fin.
- **Cockpit:** a tub with a chrome rim, a padded seat with a headrest, a framed windscreen, a console with two cyan screens and a yoke. `seat` is unchanged.
- **New parts** (all in the one persistent set): `strut` (a unit piston the rig stretches: the jaw's pistons always; the flanks' support arms and the fins' telescoping roots from the flanks' slide on), `lock` (three latches a side that slide out and seat on the plates as `xf` passes 0.84 to 1; `rigOf(P).A.lock` is that 0..1, for a clunk sound or spark), `pecIn` (a pectoral's inner panel: it slides 0.36 out of the trailing edge with the fins' stage).
- **Leviathan:** `FLANK_OUT` 0.44 → 0.6 and the plates tilt 13 degrees flatter, so it is broader and lower; the pectorals' roots ride out with the plates; the dorsal rakes 22 degrees; the cannon is a stepped pressure cannon with a lens deep in its bell, packed further back in the shark (`CAN0` 0.5: it no longer shows through the closed mouth) and thrown further out (`CAN_OUT` 0.9), so **`mouth` and `breech` moved**: read the anchors. The tail fin shrinks to 0.72 as it folds; `TAIL_FOLD` is a little looser.
- **Swimming:** the tail's wave is larger (0.52 rad at the tip at `swimK` 1) and the body counter-flexes more (0.085 rad). No new channel.
- **`SIZE`:** `len` 3.22 (unchanged: nose to tail root), `widLev` 2.3, `span` 3.31.
- **2D fallback:** each part's silhouette as seen (a convex outline of its own points) with a dark-blue line, cyan eyes, gills, reactor and lens, white teeth.
- **Clearance sweep** (vertex distances between every pair of parts that are not joined, `xf` 0..1 in 21 steps, four swim phases with full `tail` and `fin`, the jaw, the cannon, recoil): nothing crosses on the way; the closest pairs are resting contacts (the folded tail against the stern 0.02, tail link 0 against link 2 when folded 0.04, a stowed inner panel beside its flank 0.02, a hinge boss beside the flank's front edge 0.03).
- `JAWS_MODEL.__dbg` (`MESH`, `OUTL`) is for the studio and the sweep only.
- (H, **`tests/jaws.js` is written and waits for the core**) It parses and its model checks run on `test-jawH.html`
  (every shark part is still listed at `xf` 1; the seat anchor is finite and on the hull at `xf` 0, 0.1 .. 1). It then
  stops with "core absent" until `U.jaws` exists; none of the gameplay scenarios has run yet, so expect a round of
  name fixes on my side when `20k7n` and `20k7o` land. **For the lead:** the rig lists a part `lock` (six items) only
  at `xf` 1, nothing at `xf` 0. If the locks are meant to be the same parts hidden in the shark, list them there too
  (alpha 0) and I will tighten the check to an identical set. `jaws` is in `tests/ult-damage-rank.js` (ready phase
  `'fly'`, session `g._jaws`) and has a driver in `tests/elem-moves.js` (Maw every 2.5 s, the two Strongs in turn,
  Shark Attack if the gauge fills); both wait for the roster row. Until the row exists the test casts a sibling Water
  row under the key `jaws`; tell me if `elemAbility` needs more than the key to reach `U.jaws`.

### A, the core `src/js/20k7n-water-ult-11.js` (`U.jaws`) (2026-11-13)
It runs end to end on the lead's model and E's moves: summon, flight, Maw, Water Ray and its pool, Anchor with the six
beats, anchored aiming, Depth Charge (plain and empowered), Hydrojet, Maelstrom's refusal with no pool, Shark Attack
from either form, timeout, defeat and the cleanup. **Lead: the core is ready for the roster row** (`['jaws', 'Jaws', ...,
150]`, kit key `ey_jaws`).

- **H's hooks: confirmed, with these differences.**
  - `g._jaws = S`; `form`, `xf`, `released`, `left` / `endT`, `dur`, `charge`, `used`, `busy`, `cd = { s1, s2, dodge }`,
    `V`, `ctx`, `vs`, `safe`, `pools` are as you listed.
  - **`phase`** is `'summon' | 'fly' | 'xform' | 'siege' | 'finisher' | 'out' | 'gone'`. There is one transformation
    phase, `'xform'`, with `S.xfm = { from, to, u }` (`to` `'leviathan'` = anchoring, `'shark'` = releasing). Maw runs
    inside `'fly'` with `S.maw` set, Hydrojet inside `'siege'` with `S.jet` set (both null otherwise).
  - **`stats`** as you listed (`anchors`, `releases`, `maws`, `mawHits`, `hydrojets`, `ray`, `wave`, `depth`, `mael`,
    `maelRefused`, `shark`, `poolsMade`, `poolsRefreshed`, `poolsReplaced`, `poolsConsumed`, `claimsReleased`, `smashed`,
    `cdSet`, `dealt`, `charged`, `offT`, `offshoreExit`, `timerSets`), plus `switches`, `menuSets`, `beats`,
    `finFolds`, `mawBad`, `mawSmash`, `anchorBad`, `poolClaim`, `poolClear`, `poolFull`, `poolBlocked`, `poolInvalid`,
    `flyT`, `siegeT`, `xfT`, `hits`. `depthEmp` is E's to count (`JAWS_MOVES.stats.depthBig` today).
  - **The form command:** `D.VEH.form()` or `S.ctx.toggleForm()` (both ignore the held-key gate). In play it is the
    small button above Dodge (the vehicle layout's Jump slot: touch, and its `J` key) and the `F` key; `F` arrives
    through 20b's basic-attack hook as a key press, so Space does the same and a tap on the screen does not. The game
    has no controller mapping to add it to.
  - Labels: `WATER RAY`, `ROLLING WAVE`, `MAW`, `ANCHOR` / `ANCHORING`; `DEPTH CHARGE`, `MAELSTROM` (`NEEDS A POOL` when
    none can be claimed), `HYDROJET`, `RELEASE` / `RELEASING`; `SHARK ATTACK 45%` / `SHARK ATTACK` / `SHARK ATTACK!` /
    `SHARK ATTACK USED`; the seconds; `POOLS 2+1/3` (available + claimed / limit). `S.ctx.pips()` returns the three
    indicators as `'available' | 'claimed' | 'empty'`.
- **The pool registry: `ctx.pools` (also `ctx.pool`).** Records `{ id, x, y, r, born, t, state, owner }`; consumed
  ones leave `S.pools` (the last twelve are kept in `S.poolLog` with `how`).
  - `create(x, y, r?)` returns the pool made or refreshed, else `null`; `pools.last.how` says which: `'new'`,
    `'refresh'` (within 1.5 tiles of an available pool's centre: its `t` and `refreshed` change, `born` does not),
    `'claimed'` (the spot is a claimed pool: nothing), `'full'` (three live, all claimed: nothing), `'invalid'`,
    `'closed'` (the finisher or the exit). With three live it replaces the **oldest available**. **Pools form only on
    ground inside the map** (`pools.valid(x, y)`); an impact up to 1.5 tiles off valid ground settles on the nearest
    (`pools.snap(x, y, maxR)`). **H: your registry cases create pools at fixed offsets (`x + 9, y - 9` and so on) that
    land in walls, so they return null; use `pools.snap(x, y, 6)` for each spot first.**
  - `at(x, y, o?)` the available pool holding that point (`{ any: true }` also a claimed one); `list()`,
    `available()`, `claimed(owner?)`, `count()`.
  - `claim(pool | id, owner?)`, `claimAll(owner)`, `release(pool | id | owner)`, `consume(pool | id | owner)`,
    `clear(why)`. Claims belong to the owner value, not to the form, so a launched Depth Charge keeps its claim through
    Release. Nothing here deals damage or charges the gauge.
- **`JAWS_MOVES` (E): what the core calls.** `waterRay`, `rollingWave`, `depthCharge`, `maelstrom`, `sharkAttack`
  `(ctx)` once at the press, each calling `ctx.done()` once (`done()` frees the controls; a move that returns `false`
  spends nothing). Pictures: `maw(ctx, D)`, `hydrojet(ctx, D)`, `transform(ctx, D)` at each Anchor / Release,
  `anchorHalo(ctx, D)` when Leviathan is ready (`D.on` goes false at Release, the finisher or the exit),
  `summon(ctx, D)`, `exit(ctx, D)`. `D` for Maw is `ctx.maw`, live: `{ ph: 'roll' | 'dive' | 'thrash' | 'pull', x, y, z,
  a, tx, ty, dir, u, bitT, hitR, dur }`; for Hydrojet `ctx.jet`: `{ ph: 'burst' | 'settle', a, x0, y0, x1, y1, reach,
  u }`; for the transformation `ctx.transform`: `{ from, to, u, dur, beat }`.
- **`ctx`:** as Belladonna's (`hit`, `hitArea`, `hitOval` with `once`, `noCharge`, `noSmash`, the rest to `hitMon`,
  so `src` passes through; `smashArea`, `smashOval`; `mons`, `target`, `aimPoint`, `aimDir`, `stick`; `groundAt`,
  `canStand`, `nearestLand`, `inVolume`, `wallAt`; `anchor`, `scr`, `T`, `camera`; `clip` / `pose`, `chan` /
  `setPose`, `kick`; `notice(text)`; `vanish`, `safeReturn`, `done`, `alive`, `now`), plus `form`, `anchored`, `xf`,
  `maw`, `jet`, `transform`, `pools`, `pips()`, `toggleForm()`.
  - **Aiming:** as the shark, `target()` is the enemy near the stick's line, else the ground along it, else the
    nearest enemy. **As Leviathan it follows the hull:** the enemy nearest its line of fire, else an available pool on
    that line (`target().pool`), else the ground ahead.
  - **Clips:** `rayCharge`, `rayFire`, `waveCoil` / `tailCoil`, `waveFlick` / `tailFlick`, `depthCharge` /
    `cannonCharge`, `depthFire` / `cannonFire`, `maelstrom`, `attackDive` / `dive`, `attackBreach` / `breach`, `bite`.
- **Rules as built.** One deadline, written once (`timerSets`), running through both forms and their transformations;
  `chargeK` 36 / 45 / 60 x DK by tier (H's); Maw 5 DK once per enemy over the bite and the thrash; the slot cooldowns
  (2 s, 4 s) **run from the end of the cast**, so a form change straight after a cast never finds the paired move
  ready; Maw and Hydrojet share one 0.18 s recovery and the normal 0.38 s dodge protection.
  - **Anchor** takes 1.45 s, Release 1.15 s; beats `fins`, `flanks`, `cannon`, `cockpit`, `tail`, `lock` (reversed on
    Release). Where walls can be flown over, Leviathan sits above them (it rises to 3.2 as it transforms) and Hydrojet
    hops over them; only a stage of full-height walls can refuse an Anchor ("No room to anchor") or shorten a hop.
  - **Shark Attack from Leviathan:** the core folds `xf` back to 0 over the first 0.9 s while E's sequence runs
    (`stats.finFolds`); the form reads `'shark'` from then.
  - **Expiry** during a transformation, Maw, Hydrojet, a cast or a projectile's flight goes straight to the safe exit
    of the form it had (`S.expiredIn` records which); `ctx.alive()` is false from then, so later hits are dropped.
- **Still open, not the core's:**
  - H: the five `timeout@...` scenarios throw because `H.labels()` calls `D.VEH.drawBtns` after the exit, when the
    vehicle hook is rightly gone (`D.VEH` is null). Guard it and the scenarios will report.
  - E / H: Shark Attack's two hits arrive with `src: 'ult'`; the test wants `'beam'` and `'bite'`. Maelstrom logs 11
    hits an enemy (10 ticks and the burst) where the test expects the burst tagged apart.

### E, the moves and effects `src/js/20k7o-water-jaws-moves.js` (`JAWS_MOVES`), first pass (2026-11-12)
Built and captured on a stub `ctx` (no core yet): **A, this is the contract I wrote to; tell me what to rename.**
- **Functions:** `waterRay(ctx)`, `rollingWave(ctx)`, `depthCharge(ctx)`, `maelstrom(ctx)` (returns false, calls `done()` and `ctx.notice(text)` when no pool is available), `sharkAttack(ctx)`; pictures and sound only: `maw(ctx, D)`, `hydrojet(ctx, D { dx, dy })`, `summon(ctx, D { x, y, dur })`, `anchorHalo(ctx, D)` (call at Anchor with a live `D`; set `D.on = false` at Release), `transform(ctx, D { to })`, `exit(ctx, D)`; `poolFx(ctx)` (draws the pools; also started by `update(ctx)`, the summon and every move), `icons` (`waterRay`, `rollingWave`, `depthCharge`, `maelstrom`, `sharkAttack`, `maw`, `hydrojet`), `TUNE` (`rayCd` 2, `waveCd` 4), `stats`, `GFX`, `warm`, `update(ctx)`.
- **What I call on `ctx`** (as Belladonna's): `H`, `vehicle`, `now()`, `alive()`, `done()`, `hitArea`, `hitOval` (Rolling Wave's crest; falls back to `hit` per monster), `target()` / `aimDir()`, `mons()`, `anchor(name)` (`mouth`, `reactor`, `center`, `seat`, `tailTip`, `gillL/R`, `finL/R`, `jet`), `scr`, `clip(name, u)` (`rayCharge`, `rayFire`, `tailFlick`, `cannonCharge`, `cannonFire`, `maelstrom`, `dive`, `breach`, `rest`), `camera`, `safeReturn`, `notice`.
- **The pool API I expect, `ctx.pools`:** `list()` → live records `{ id, x, y, r, born, state }`; `at(x, y)` → the available pool containing the point, or null; `create(x, y, r)` → the record (new, refreshed, or after replacing the oldest available), or null when all three slots are claimed; `claim(id, owner)` → true only for an available pool; `release(id)` (a cast that never resolves); `consume(id)`; `clear()` (Shark Attack: the rest merge, no damage). Without `ctx.pools` my file runs a stand-in registry with exactly these rules. I may set `record.hide` (unused so far).
- **Damage events, as built:** Water Ray one `hitArea` at the impact, then `create`. Rolling Wave one registry for the whole pass; movable enemies under the crest are carried with `H.pull(m, aim)` (bosses and rooted enemies stay). Depth Charge: `done()` at the launch; plain one `hitArea`; into a pool claimed at the launch: 0.3 s plunge, one amplified `hitArea`, `consume`; an aborted shot releases its claim. Maelstrom: claims the pools available at the press; ticks on deadlines with one registry a tick across the whirlpools; `H.pull` each frame; then one burst through a second registry and `consume`; `done()` 0.6 s after the wind-up (the whirlpools carry on). Shark Attack: `pools.clear()`, then two authored hits, each its own registry and `noCharge`: the sky beam and the snap; then `safeReturn()` and `done()`.
- **Provisional numbers (H, please audit; all in `TUNE`):** Water Ray 7 DK, radius 2.2, pool radius 2.2, reach 9. Rolling Wave 6 DK once, 9 tiles at 10 tiles/s, 5.2 wide, carry 9 tiles/s. Depth Charge 6 DK radius 2.4; empowered 15 DK radius 4.4 (2.5 x). Maelstrom 10 ticks x 0.8 DK every 0.3 s, whirlpool radius pool + 0.7, pull 3.2 tiles/s within 1.6 beyond it, burst 6 DK radius 3.4 (14 DK a pool's worth on a held enemy). Shark Attack 95 / 115 / 125 DK: the beam 35% within 3.2 tiles of the shark, the snap 65% within 7 tiles; 6.84 s in all (ocean 0.9, dive 1.0, beam 0.8, gather 1.1, rise 0.9, pause 0.4, snap 0.14, aftermath 1.6). `ctx.sharkPlan`, `ctx.maelPlan` (`at`, `ticks`, `fired`, `burst`, `pools`), `ctx.depthPlan` are set for tests.
- **3D on the GPU:** Belladonna's layer with water: instanced funnels are the geysers, the whirlpools' cones and the sky beam; ribbons are the wave's stacked curling bands, the ray's helical streams, the reactor's streams and the jaws' arcs; the instanced blade mesh is the jaws' teeth and the droplets; pools, rings and the anchor seal are quads on the ground, with the water's dark body laid under the light. The pet's face stays clear (lifted for the beam's and the snap's first 0.3 s). 2D fallback as before.

### M, model round 2 (`20k7m`) (2026-11-12): the head, chrome, plating, mass, the stern
Rig structure, stage order and channels are unchanged. **Anchors that moved** (model units before `VIS` 0.92, shark / Leviathan), A and E please read them from the model:
- `seat` [0.45, 0, 0.77] / [0.45, 0, 0.57] (was x 0.61: the head is longer, so the cockpit sits further back; z is higher with the deeper hull).
- `gillL/R` [0.37, ±0.82, 0.02] / [0.37, ±1.42, 0.02] (the gills are lower and further back).
- `dorsalTip` [-0.77, 0, 1.84] / [-1.34, 0, 1.51]; `finL/R` about [-1.15, ±1.3, -0.53] / [-0.91, ±2.75, -0.02]; `tailTip` [-3.13, 0, 0] / [-2.41, 0, 0] (a shorter tail; in Leviathan the links telescope straight back, they no longer fold under the belly).
- Unchanged: `mouth` [1.45, 0, -0.03] / [2.35, 0, -0.03], `breech`, `snout`, `head`, `jet`, `center`, `reactor`, `belly`.
- **`jaw` 0 now leaves the mouth a little open** (0.16 of full): the teeth and the dark interior show at rest. `jaw` above 0.16 behaves as before.
- **The part set is the same at every `xf`** (36 items: the latches, the support arms, the fins' arms and inner panels are listed in the shark too, stowed inside the closed plates), for H's check.
What changed in looks: the head is 36% of the hull (`T_HEAD` 0.64), a flatter wedge, chrome over its front third and lower half, the eyes on the upper cheek under a chrome brow, 25 upper and 22 lower teeth, larger; the mid-hull is 16% deeper and wider and the tail shorter (`LTAIL` 0.31); each flank has a chrome lower third, three overlapping chrome-edged plates with a silver chevron each, and the gills in a dark chrome-edged frame; a spine row of eight plates behind the cockpit; a chrome keel; alternate tail sleeves in chrome. Leviathan: the flank plates turn 27 degrees flat-topped about their own middles and the pectorals rise level with them (a broad deck each side, the reactor open between); the tail telescopes to a short stern with the fin's two lobes turned flat as control surfaces. `SIZE`: `wid` 1.38, `widLev` 2.48 (was 1.2 and 2.3). The seat is a cel leather (new GLM id 36); id 30 has a ceiling and less gloss on up-facing faces.
Clearance sweep rerun (same method): nothing crosses; the closest pair is a hinge boss beside a flank's front edge, 0.04 with the jaw fully open.

### E, second effects pass (2026-11-12), still on a stub `ctx` (A's core has not landed)
- **Numbers now H's baseline (in `TUNE`):** Water Ray 5 DK; Rolling Wave 7; Depth Charge 6 plain, 15 empowered; Maelstrom 8 ticks x 1.0 every 0.3 s, burst 8; Shark Attack's beam 30 / 35 / 40 and closure 65 / 80 / 85 DK by tier. Maw's 5 and the gauge are A's.
- **Water Ray's pool** is now created 0.5 s after the impact (as the geyser falls back), not with the hit. H: a test that reads the pool right at the explosion will not find it yet.
- **Shark Attack, for A and M: the waterline.** While the shark is under, `ctx.waterline` is a height in tiles (0.05) and `JAWS_MOVES.waterline(ctx)` returns it; otherwise both are null. It is set from halfway through the ocean's spread (0.45 s) until the jaws have risen (4.7 s). **M: can the model take a pose channel (say `clipZ`) that discards fragments below a world height?** A: please pass `ctx.waterline` to it while it is not null (and hide the pet with it). I draw the foam ring at the cut, four splashes in sequence along the heading (snout, body, dorsal fin, tail, at 12 / 38 / 60 / 85% of the dive), bubbles, and the breach's column.
- **Teeth:** their own instanced mesh (a four-sided crystal blade, flat facets), 13 a jaw, 0.9 to 3.0 tiles long, largest at the front; the two rows are offset so they mesh at the snap. The closure hit is on the frame the jaws meet.
- **Empowered Depth Charge**, checked on my stand-in registry: claimed at the launch, 0.3 s plunge (the pool pulls in and darkens), then one hit of 15 DK within 4.4 tiles, the pool consumed, an 11-tile geyser with a ring of six smaller ones. Not yet run against A's registry.
- (A, **the waterline, for E and M**) Agreed as E proposed, and the core is ready for it:
  - While `ctx.waterline` (or `JAWS_MOVES.waterline(ctx)`) is a number during Shark Attack, the core writes it to
    **`pose.clipZ`** and passes **`o.clipZ`** to `draw` (a world height in tiles; null otherwise), and hides the pet
    while its `seat` anchor is under it. **M:** discard fragments whose world z is below `clipZ`, and list `clipZ: null`
    in `blankPose()` (that is how the core knows the model can cut: `'clipZ' in blankPose()`).
  - Until the model can cut, the core fades the whole hull out as its middle sinks through the waterline and back in as
    it breaches, so E's sequence already reads.
  - **The same cut gives the summon its order.** With `clipZ` in the model, the core raises the shark nose-up out of
    E's ring from under the floor (`clipZ` 0.04 through the summon): snout and teeth first, then the body, the fins and
    the tail, levelling off at the end; the pet waits in the ring and is seated as the cockpit comes up. Without it the
    summon stays the fade-in it is now.
- (E, on A's core, 2026-11-12) `tests/jaws.js` on `test-jawE.html` with my moves: see my report for the count. **Open, for A and H: displacement resistance.** I move enemies with `H.pull` (it refuses `m.boss` and `m.still`), but the test's `D.lesserBoss(...)` is still moved (0.9 tiles by Rolling Wave, about 5.5 by Maelstrom), so `H.pull` does not see it as a boss, and guarding on `m.lesser` stopped ordinary enemies being pulled too. **A: please give me `ctx.movable(m)`** (true only for enemies that may be displaced); my `carry()` already calls it when it exists. I also pass `kb: 0.001` on Rolling Wave's hit and Maelstrom's ticks, because `kb: 0` let the default knockback push enemies away from the aim.
- (H, **`tests/jaws.js` on the real core and E's second pass: 76 of 76 at evo 1 / 4 / 7; the rank audit and
  `elem-moves` pass**) `HTML=test-jawH.html EVO=7 node tests/jaws.js`. The last six runs had one flaky check, which was
  my setup (a movable test enemy beside a live boss); that condition is removed, the rest passed every time.
  - **Fixed on my side** (none was a game fault): labels read only while the vehicle hook is up; pools placed on
    `pools.valid` ground through `pools.snap`; E's plan names (`maelPlan.at`, `.burst`, `sharkPlan.tBeam`, `.tBite`:
    the two finisher events and Maelstrom's burst are told apart by their times, so no `src` tags are needed);
    damage sums use the amount asked for, not the amount after a lucky crit; stray floor monsters are removed from
    Leviathan's line of fire; movable test enemies are stunned, not left to wander.
  - **Added:** plain Depth Charge; Rolling Wave (one hit an enemy, movable enemies on both sides gathered toward the
    aim, a boss damaged once and left in place); Maelstrom with one, two and three pools (each captured pool strikes
    and is consumed; an enemy takes 16.0 DK in 9 hits whatever the count); expiry while anchoring, during Maw and with
    a Depth Charge in flight; defeat during Maelstrom; the part list identical at `xf` 0, 0.5 and 1 (36 items, after
    M's round 2).
  - **Boss resistance is checked through the moves' own call** (`H.pull(boss, ...)` returns false and moves it 0):
    a lesser boss walks on its own, so its displacement during a cast proves nothing either way.
  - **Measured, as built:** Maw 5, Water Ray 5, Rolling Wave 7, Depth Charge 6 plain / 15 empowered (2.5x),
    Maelstrom 8 x 1.0 + 8 = 16, Shark Attack 95 / 115 / 125 DK (beam 30 / 35 / 40 + closure 65 / 80 / 85) from either
    form with zero pools; `chargeK` 36 / 45 / 60. All equal the baseline; no change asked.
  - **Rank audit, all elements:** Jaws 95 / 115 / 125 DK, level with Belladonna and Fenrir. Dark Messiah first at
    every evo (130 / 175 / 210 DK); its lead over the next was 1.18x / 1.35x / 1.42x this run (Supernova measured
    110 DK at evo 1 and Frozen 129 DK at evo 4 here, both above their usual figures: cast-to-cast spread, not Jaws).
  - **Not covered:** rift and fiend floors; the full-height-wall stage that can refuse an Anchor; the `J` / `F` keys
    and the touch button themselves (the test calls `D.VEH.form()`); the pool indicators' drawing.

### M, the `waterline` channel (2026-11-12)
- **`waterline`** (pose channel, default `null` = off): a world height in tiles above the floor under the model (the same units as the `z` passed to `draw`). When it is a number, nothing of the model below that height is drawn, at any heading, `bank` and `pitch`, and a bright cyan-white band 0.07 model units tall sits just above the cut. A: copy E's `ctx.waterline` into `pose.waterline` while the shark dives and breaches, and set it back to `null` afterwards; hide the pet yourself while `anchor('seat').z` is below it. Off, it costs nothing (one uniform).
- It is `S.clip = [height in the model's own units, band]` in `GLM.render`, off unless a model passes it: Fenrir, Susano O and Belladonna do not.
- The 2D fallback clips with a rectangle at the waterline's screen height (game camera only).
- Also: the cannon's lens sits near the muzzle's lip now (no anchor moved), and the pectorals' silver root strip and marking are smaller.

### E, Rolling Wave replaced by Water Bombs (2026-11-12; the user: "Jaws will throw 7 water bombs at enemies, the bomb explode into water splash dealing water damages")
Supersedes every Rolling Wave entry above (H's numbers, A's labels, my contract).
- **Names:** move key `waterBombs` (was `rollingWave`), the shark's Strong 2 slot, cooldown 4 s shared with Maelstrom as before. Button `WATER BOMBS`, its icon three bombs over a splash (`paintBombsBtn` in `20k7n`, `icons.waterBombs` in `20k7o`). The core's stat is `bombs` (was `wave`), the plan key `['waterBombs', 's2', 'bombs']`; `TUNE.bombsCd` (was `waveCd`).
- **Behaviour:** after 0.15 s the shark lobs 7 bombs 0.09 s apart from `anchor('mouth')`, so the volley is out in 0.78 s and `done()` follows 0.1 s later. Targets are the enemies within 7 tiles, nearest first, round-robin; each throw leads a moving target by half its flight. Each bomb flies 0.4 to 0.5 s on an arc 1.6 tiles high. With no enemy in range the bombs land in a fan ahead along `aimDir()`, from 2.5 to 5.8 tiles out.
- **Damage:** each splash is one `hitArea` of **1.5 DK within 1.3 tiles**, with its own registry, so seven bombs on one enemy are seven hits (10.5 DK). Each splash charges the gauge and smashes props. A bomb landing in an available Tidal Pool makes a bigger splash and a small geyser; the damage is the same.
- `ctx.bombPlan = { n, targets, dmg, r, hits, burst }`; `JAWS_MOVES.stats.bombHits`, `bombVolleys`.
- **For H:** `tests/jaws.js` 5c now checks Water Bombs: 7 hits on a lone enemy, a spread over six enemies, the gauge, a fan with no enemy, cast in flight. The prop check for Water Bombs puts an enemy beside the prop.

### M, polish pass (`20k7m`, GLM ids 30-36) (2026-11-12, after v318)
No anchor, channel, part name or count changed; the part set is still 36 items at every `xf`; `waterline` unchanged.
- **Geometry:** stepped chrome-edged plates on the head cap either side of the chevron, a chrome nose ridge, rivet rows and an intake vent under each eye; vents on the spine plates; cable runs past the reactor; cyan light strips along the flank plates' lower seam and chrome lips on each plate's step; rivet rows along the flanks; the gill slots recessed in dark louvres; the cockpit has grab handles, side panels with switches, windscreen posts, console buttons and a roll bar; raised plates and rivets round every tail sleeve; a root spar and ribs on the tail fin; the pectorals are cambered blades with a slim silver slash and rivets (they no longer read pale from above), keeping the silver leading edge; two cyan throat lights under the mouth's roof (they show when the jaw opens; at rest the gap is too small to see them).
- **Shading:** sharper cel bands (a clear shadow band and a crisp light band), more panel-to-panel tint, a recess darkening beside every panel line and plate step, richer chrome (a darker ground, a hotter horizon line, a soft second sky band, per-panel tint), turned machining rings on dark steel, the reactor and gills a little brighter. Fenrir, Susano O and Belladonna do not use ids 30-36.
- (A, **`glowK`, for M**) The core writes `pose.glowK` each frame on a slow spring: about 0.35 between attacks (more with
  speed, in Leviathan and when Shark Attack is ready), 1 through every cast, Maw's dive and thrash, 0.85 in Hydrojet,
  0.75 through a transformation, 1.2 on the charging and firing clips, 1.25 through Shark Attack; clamped to 0..1.5.

### E, the wing cannons' effects (2026-11-12)
- **When they fire:** in Leviathan, alongside its ranged attacks: 4 shots 0.1 s apart while Depth Charge charges (at its target, or at the aimed point when the shot is going into a pool), and 6 shots 0.35 s apart through Maelstrom's channel, at the enemy nearest each whirlpool. Shots alternate left and right.
- **What each shot draws:** a baby-blue muzzle flash (`#8FD8FF` / `#BFEAFF`), a 0.12 s tracer and a small water burst. `JAWS_MOVES.wingGuns(ctx, target, n, o)` is exported for the core.
- **Damage:** none. The shots are look and sound only, so every move's hits are unchanged. The hit path is there (`TUNE.guns.dmg`, 0.5 DK within 0.8 would be the value), but adding hits broke 7 of H's per-move hit counts in `tests/jaws.js`.
- **M / A:** I read `anchor('cannonL')` and `anchor('cannonR')`. While they coincide, I fall back to under `finL` / `finR`. Each shot calls `ctx.kick('wingGun', 6)` and also `ctx.kick('wingGunL' | 'wingGunR', 6)`, so a per-side channel will work if you add one.

### M, v319 round: wing cannons, baby-blue glow (2026-11-12)
- **Wing cannons:** a new part `wingGun`, listed twice at every `xf` (the part set is now 38 items, identical at every `xf`). In Leviathan one hangs under each wing on a hard-point pylon (finned cooling sleeve with a blue cowl, a long chrome barrel, a glowing muzzle ring); in the shark it shrinks (to 0.12) up into the wing's root and is nearly transparent. They deploy over `xf` 0.55 to 0.95.
- **New anchors** `cannonL`, `cannonR`: the muzzles (left = the model's +y side, as `finL`). **New channel `wingGun`** (0..1): both guns slide back up to 0.12 units (recoil). E: read the anchors for the shots; the guns point along the hull's forward.
- **Glow:** the reactor-energy material (id 33: eyes, gills, seam strips, reactor, throat lights, muzzle rings) is now baby blue, and every part flickers on its own seed (a slow pulse, a quick shimmer, and short electrical stutters; never below 60%). The cobalt and chrome plates' edges carry a soft baby-blue emissive line. Soft baby-blue halos (`GLM.halos`, `#9FDFFF`) round the body, the eyes, the gills, the reactor (stronger in Leviathan) and the wing cannons' muzzles; low-effects mode keeps the body, eye and gill halos. They clip at the `waterline` like the model.
- **New channel `glowK`** (default 1, range 0..2.5): A pushes it up in attacks; it scales the glow, the edge light and the halos.
- **New anchors** `eyeL`, `eyeR` (used by the halos; free for E).
- Also fixed: a comment written in the waterline round had swallowed the rest of a line in the cannon's mesh, so the muzzle's chrome and steel rings, bolts, cyan slots and slide rods were missing since then. They are back.
- (A) `glowK` rescaled to M's range: rest 1 (a little more with speed, in Leviathan and with Shark Attack ready), casts / Maw / Hydrojet 1.6, transformation 1.3, charging and firing clips 2.0, Shark Attack 2.5, on the same slow spring.
- **Revised after the lead's review:** the wing cannons are chunkier (a cowled breech block, a barrel of twice the radius with a finned sleeve, a flared muzzle with a baby-blue ring), hung lower and further forward so they show under and ahead of each wing; in the shark they are **scale 0 and alpha 0** (still listed, so the part set is unchanged) and their halos are gated by the same factor (`rigOf(P).A.wingGunOut`, 0..1). `cannonL`/`cannonR` moved to the new muzzles. The glow is stronger: id 33 brighter, larger and stronger halos round the eyes, gills and reactor, a two-layer body aura, and the flicker's stutters dip to about 47% (never darker). **A:** `glowK` is 1 at rest; use about 2 to 2.5 in attacks.

### E, effects pass for v321 (2026-11-13; the user: "more advance and elaborate", "Give Depth Charge more effects and bigger AOE")
- **Depth Charge, for H:** the radius is **3.8** tiles plain (was 2.4) and **7.0** empowered (was 4.4), 1.6x, matched to the drawn blast. Damage per hit is unchanged (6 / 15 DK).
- **Depth Charge timing:** a plain shot now sinks for **0.42 s** after landing (a glowing charge, three countdown pulses) before it blasts. An empowered shot keeps its 0.3 s plunge. The blast adds:
  - a dome of water bursting up;
  - three shock rings across the floor;
  - a 7-tile geyser column (13 tiles empowered, with a ring of eight smaller ones);
  - falling rain;
  - foam lingering 2.4 to 3 s.
- **Other moves:**
  - Water Ray: a caustic sheath, sparks and spiral spray along the beam; foam and rain at the impact.
  - Water Bombs: a small geyser per splash, foam and rain.
  - Maelstrom: a vortex column over each whirlpool, foam spirals and rising currents.
  - Maw and Hydrojet: more spray, foam on the floor, Hydrojet's pressure rings.
  - Shark Attack: rain and lingering foam at the snap.
- **Pools, for M:** the Tidal Pools' look is still drawn in `20k7o` (`poolFx`). If you draw them in `20k7m`, tell me in Notes and I will gate mine (for example on `JAWS_MODEL.drawsPools`) so they are not drawn twice.
- All of it is in the slot-independent move functions, so A's slot swap needs nothing from me.
- (A, **v321 in the core, for H and E**) The user's changes, in `20k7n`:
  - `TUNE.dur` 60 / 60 / 60 (was 30 / 45 / 60). `S.poolMax` by tier 3 / 3 / 5 (`TUNE.pools`; a 4 at Adept is a one-number
    change). The pips and the `POOLS a+c/max` label follow it.
  - **Slots:** shark Strong 1 = `waterBombs` (`cd.s1`, 1.0 s), Strong 2 = `waterRay` (`cd.s2`, 1.5 s); Leviathan Strong 1 =
    `depthCharge` (`cd.s1`, 1.0 s), Strong 2 = `maelstrom` (`cd.s2`, 1.5 s). The slots stay paired across forms (the same
    numbers, so nothing is forced longer). The core owns the numbers now; E's `rayCd` / `bombsCd` are not read.
  - **No Anchor / Release:** no button in the Jump slot, no J key, no F key, `D.VEH.form` gone. `ctx.toggleForm()`
    remains as a **test hook only**: it counts as the fifth pool and transforms at the next free frame.
  - **Auto-transform:** `S.poolCasts` (also `stats.poolCasts`) counts Water Ray casts whose `pools.create` returned a pool
    (`'new'` or `'refresh'`); at 5 the shark transforms into Leviathan at its next free frame (`stats.autoXf` 1, a
    `LEVIATHAN` text), with the same transformation and beats. It never transforms back (`tryExtra` refuses from
    Leviathan); Shark Attack still folds it to the shark for its dive.
  - **Leviathan flies** (`phase` stays `'siege'`), at 0.8 of the shark's speed; Hydrojet is still its Dodge; it aims along
    its hull, which now follows the stick. No anchor halo (E's `anchorHalo` is no longer called).
  - **For H, `tests/jaws.js`:** replace every `H.toggle()` / `H.to('leviathan')` with five Water Ray casts on separate
    ground (or `S.ctx.toggleForm()`), and drop the Release cases (`H.to('shark')`, the timeout `@anchoring`,
    "anchored: position holds", "Release"). Strong 1 / 2 in the shark are now Bombs / Ray (the slot-cooldown checks swap).
    Expect labels `WATER BOMBS`, `WATER RAY`, `MAW`; no `ANCHOR` / `RELEASE`. Durations 60 at every evo; `poolMax` 5 at
    evo 7 (the fourth-pool-replaces case needs a sixth pool there).
- (A, **the user's answer: TRANSFORM back, for H and E**) Leviathan now has a **`TRANSFORM`** button in the Jump slot
  (above Dodge; key **J**, through 20b's `carJump` / `VEH.jump`), shown and usable **only in Leviathan** (its label reads
  `TRANSFORMING` while the change runs). In the shark the slot is empty: no button, and `VEH.jump` is null. Pressing it
  plays the same transformation back to the shark; the Strongs return to Water Bombs and Water Ray. Leviathan otherwise
  stays until Transform or the end. After going back, `S.poolCasts` restarts at 0 (five more pool casts transform it
  again; `stats.transformsBack` counts the returns); the pools stay. A 1 s lockout follows either change of form
  (`TUNE.xfLock`; the button shows it as a cooldown). **H:** use `D.VEH.jump()` (or `G.key('carjump', true)`) in
  Leviathan for the way back, or `S.ctx.toggleForm()` (in Leviathan it presses Transform; in the shark it counts as the
  fifth pool). Expect the label `TRANSFORM` only in Leviathan, never `ANCHOR` / `RELEASE`.


### M, the Tidal Pools' look (v320 round, 2026-11-13). Proposed split: M owns the look, A the records and rules, E the lifecycle effects
- **`JAWS_MODEL.drawPools(c, pools, o)`**: draws every pool in one GPU pass (one disc each, GLM material 37: a feathered water surface with animated caustics, ripples running out, a deeper centre, a foamy luminous rim that laps in and out, glints and small bubbles, baby blue), then soft feathered light on the floor round each and motes of light rising (`GLM.halos`). Without a usable GPU, a 2D picture of the same (gradient body, caustic sprite, lapping rim arcs, ripples, the swirl). Low-effects mode drops the motes and the 2D caustics.
  - `pools`: the core's records as they are (`ctx.pools.list()` or `S.pools`): it reads `id, x, y, r, born, t, state, claimT`. `o = { T, sx, sy, t, low }`, with `t` on the same clock as `born` (the core's `g.t`; `mOpts()` already has it).
  - **States**, all from the records: **forming** blooms out over 0.45 s after `born`; **idle**; **claimed** brightens and swirls (eased in from `claimT`); **refreshed** pulses when `t` moves; **gone**: when a record leaves the list (or turns `consumed`), the pool drains (spirals in and shrinks over 0.6 s), or **bursts** (a bright ring running out, 0.5 s) if it was claimed. It keeps those last frames itself, so the core can drop the record at once.
  - Call it **once per frame with the full list** (the drain and burst are detected by absence), in the floor layer, under the creatures and the model.
- **A:** call it from `drawUnder` (in place of the stand-in), e.g. `MOD().drawPools && MOD().drawPools(c, S.pools, mOpts(S, T))`, before the shadow.
- **E:** please drop the pool paint in `poolFx` (`Q.shade`, `air`, `floorGlow`, rings and arcs for each pool) once A's call is in, so they are not drawn twice; the geysers, splashes and claim beams stay yours. If you would rather keep the call on your side, call the same function from your `drawUnder`; just one of you, please.
- Cost: one `GLM.render` for all pools (one draw call each, five at most), up to 25 small halos.
- (H, **v321 in `tests/jaws.js`: 87 of 87 at evo 1 / 4 / 7**, on `test-jawH.html`, before E's effects pass ends)
  - **Removed:** every Anchor / Release case and "anchored: position holds".
  - **Added or changed:**
    - 60 s at every evo; `S.poolMax` 3 / 3 / 5 and the `POOLS 0/N` label; the registry cases filled to the tier's cap.
    - Slots: shark Strong 1 Water Bombs and Strong 2 Water Ray; Leviathan Strong 1 Depth Charge and Strong 2 Maelstrom.
      `cdMax` 1.0 / 1.5 in both forms, and again after Transform back.
    - A cooldown carries through the change of form (set to 6 s, it keeps running down).
    - Five Water Ray casts: casts 1-4 count (`poolCasts` 1..4) and leave the shark as it is; the fifth turns it into
      Leviathan (`stats.autoXf` 1). The buttons then switch to Depth Charge, Maelstrom, Hydrojet, Shark Attack and
      `TRANSFORM`, with no Ray, Bombs, Maw, Anchor or Release.
    - `TRANSFORM` via `D.VEH.jump()`: does nothing inside the 1 s lockout, then returns to the shark
      (`transformsBack` 1). `poolCasts` is back at 0; pools and the timer stay. No Transform button or `VEH.jump` in the
      shark. Five more casts transform it again (`autoXf` 2).
    - Depth Charge radius from `depthPlan.r` and who is hit: 3.8 plain and 7.0 empowered. Enemies inside are hit once;
      enemies 0.6 or more outside are not.
  - **Test-side timing fixes:** `zero()` waits for the cast to end before clearing cooldowns (they now start at the
    end of the cast). The Maelstrom is let finish before Hydrojet and Transform. The enemy at the whirlpool's rim is put
    on open floor with a clear line to the pool.
- (E) **Pools:** `poolFx` no longer paints anything. M's GPU pool renderer, hooked through the core's `drawUnder`, draws the pools, so they are not drawn twice. The moves' own pool moments (Depth Charge's plunge, Maelstrom's whirlpools) still draw over the pool.
- **v321, wings in the shark:** at `xf` 0 every Leviathan-only part is stowed inside the closed plates (support arms, latches, the fins' arms and inner panels) or drawn not at all (the wing guns: scale and alpha 0, and any part with alpha or scale 0 is now skipped in the GPU pass, outline hull included; their halos are gated by `wingGunOut`). The fins now start at `xf` 0.15 (to 0.5) and the flanks at 0.3 (to 0.8), so a small `xf` (a spring's overshoot up to 0.15) moves nothing at all. If the wings showed in the shark, the pose's `xf` was well above 0.15 there.
- **v321, the 2D fallback and recovery:** the flanks' support arms, the latches and the fins' telescoping arms now carry alpha 0 until the flanks start to slide (`xf` 0.3), so the 2D fallback draws none of them in the shark (on the GPU they were already hidden inside the plates); the wing guns were already alpha 0. A GPU draw that throws now falls back to the 2D picture for 1.5 s and then tries the GPU again (for good only after 3 failures within 20 s), in all four GPU models (Jaws, Belladonna, Fenrir, Susano O); and `GLM` now drops a WebGL context that is lost and not restored within 1.5 s and makes a fresh one (iOS can lose it in the background and never restore it), where before a lost context meant the 2D picture for the rest of the session.
