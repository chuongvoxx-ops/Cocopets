# Genbu — 11th Earth ult (four workers)

The user's spec, verbatim, is in `docs/elem-spec/earth-genbu.md`. Read all of it. The concept image is in the lead's
scratchpad (`genbu/genbu-concept.png`). Never copy reference art into the repo.

**It reuses the Beast Machine system** (a ridden vehicle form through 20b's generic `X.vehicle(o)`). Read
`docs/THUNDER-BEAST-BRIEF.md`, `src/js/20k9i-thunder-ult-11.js` (core: the VEH object, ctx, gauge, timer, HUD, Jump,
safe landing, `canDrive`, smash, restore, cooldown at exit) and `src/js/20k9ia-thunder-beast-gl.js` (the GPU model and
its hook) first.

## The row and the unlock
- The row in `src/js/20k1-elem-core.js`, Earth's 11th ult after Titan:
  `['genbu', 'Genbu', 'shield', 100, 120, '…']`.
- The unlock is the existing 11th step, `ELEM_ULT_LV[10]` (Dungeon level 80). The id is `ey_genbu`; the impl is
  `ELEM_IMPL.earth.ult.genbu`.

## Split
| Worker | File | Owns |
|---|---|---|
| Lead (model) | `src/js/20k2kz-earth-genbu-model.js` (`GENBU_MODEL`; see the Notes for its contract) | The GPU model, both forms and the transform; the pose channels and anchors below |
| A (core) | `src/js/20k2l-earth-genbu-core.js` | `U.genbu`; summon, walking, contact; Shell Roll; Jump; the Rock You and Drill Cannon plans and their damage; the Calamity gauge, transform, drilling phase and eight-drill climax (timing and damage); the crumble exit; HUD; timer; cleanup; the 2D placeholder draw |
| E (effects) | `src/js/20k2m-earth-genbu-moves.js` (`GENBU_MOVES`) | Every effect drawn from the core's plans: Rock You's crystals and shards, the flying drill bit's trail, the Shell Roll's sparks and dust, the surface cracks and ridges while burrowing, the eight Earth drills, the crumble's fragments |
| H (tests) | `tests/genbu.js` (+ `tests/lib/vehpin.js`) | Gameplay pinned per evo; the checks listed at the end |

**One damage path.** Every hit goes through the core's `ctx.hit` / `ctx.hitArea` / `ctx.hitOval`. They apply the
damage after mitigation with no overkill, charge the gauge (unless `noCharge`), and smash scenery via `VEH_SMASH`. E
only draws. Debris never deals damage.

## Controls (through 20b's VEH hooks)
| Normal control | Turtle | Calamity (drill form) |
|---|---|---|
| Movement | Walk and steer (heavy: slow turn rate, momentum) | Steer the drilling vehicle (over and under the ground) |
| Dodge | Shell Roll | Dive / descend |
| Jump (its own button above Dodge, and J) | Jump (Earth stomp) | Rise / ascend |
| Strong 1 | Rock You | Disabled (the drill is the weapon) |
| Strong 2 | Drill Cannon | Disabled |
| Ultimate | The Calamity gauge; a press when full starts Calamity | (in progress) |

Shell Roll and Jump are separate commands and both are always available. A press during the other is kept briefly and
goes when it ends. Normal attacks are suppressed.

## Timeline and numbers (provisional; every value is in the core's `TUNE`)
- **Form:** 20 / 25 / 35 s at evo 1–3 / 4–6 / 7, counted from the moment it can walk. The 120 s cooldown starts at the
  exit, once.
- **Summon:** 1.6 s. The turtle rises out of a ring of breaking ground (stone first, then legs, shell, drill), and the
  pet hops into the cockpit.
- **Walking:** top speed 6.5 tiles/s; steering 2.2 rad/s at rest down to 3.2 at speed; heavy momentum.
  - Trampling: 0.5 × DK per monster per pass, gated 0.5 s, contact only above 25% of top speed.
- **Shell Roll** (Dodge, cooldown 1.1 s):
  - Timing: tuck 0.12 s, spin-travel 0.7 s at 15 tiles/s (steerable), un-tuck 0.25 s.
  - Damage: one circle of radius 2.2 following the path, 2.6 × DK once per monster per roll, knockback 6.5.
  - Short invulnerability: 0.3 s from the tuck.
- **Jump** (no cooldown; Beast's rules):
  - Arc: crouch 0.16 s, air 0.8 s, recovery 0.08 s; peak 1.9; 4.2 tiles standing (6 at most).
  - Landing: an Earth stomp of 2.8 × DK within 2.8 tiles, knockback 7.
- **Rock You** (Strong 1, cooldown 2.2 s after the explosion):
  - Brace 0.35 s at a target (the nearest enemy within 9 tiles, else 4 tiles ahead).
  - Eruption: 5 / 6 / 7 crystals rise on a 3-tile cluster. Phase 1 deals 1.6 × DK, once per monster across all the
    crystals (the nearest crystal's circle, radius 1.1), and lifts the monster.
  - A readable pause of 0.7 s.
  - Explosion: phase 2 deals 2.4 × DK, once per monster, within 3.4 of the cluster's centre.
- **Drill Cannon** (Strong 2):
  - Spin-up 0.5 s.
  - The real bit flies out on a corkscrew route to the target, up to 9 tiles, in 0.9 s. On the way it deals 0.9 × DK
    per monster at most once per 0.3 s and at most 3 times per cast.
  - Final impact: 3.2 × DK within 3.0 tiles, once.
  - Return: 0.8 s on a visible arc, then docking 0.25 s.
  - The cooldown of 2.6 s runs only from the dock.
  - **Lockout:** no Drill Cannon, Rock You or Shell Roll while the bit is away. Jump is allowed; the bit homes to the
    carriage.
  - **Recall:** Calamity pressed while it is away recalls the bit at once (0.45 s back, no damage) and starts the
    transform only once it has docked.
- **Calamity gauge:** fills from damage actually dealt by the mounted attacks (after mitigation, no overkill) at
  `chargeK` 30 × DK. Calamity's own hits never charge it. It starts empty.
- **Calamity:**
  - **Transform:** 1.6 s, the seven steps of the spec on the model's `xf` 0..1. The ordinary timer is replaced by
    Calamity's own.
  - **Drilling phase:** 8 / 9 / 10 s, steerable at 9 tiles/s with Dodge = dive and Jump = rise.
    - Three heights: under (`z` −1.1), surface (0) and a breach leap (up to 1.4, 0.7 s).
    - On or above the ground the drill deals 1.2 × DK per monster, gated 0.4 s.
    - Under the ground there is no damage. Surface cracks and a moving ridge mark it, and enemies can't touch it.
    - Every emergence makes an Earth shockwave of 2.0 × DK within 3.0, at most once per 0.6 s.
    - Walls and the map's edge stop it at every depth. It never leaves the encounter's walkable space.
  - **Eight-drill climax** (3.2 s):
    - It surfaces at a valid spot, then exactly 8 spots are marked across the area round it. Each spot is at least
      2.2 tiles from the others, on standable ground within 8 tiles, and spots favour monsters.
    - The drills tear up over 0.6 s; each monster takes at most one eruption hit, 1.5 × DK, from its nearest drill
      within 2.2.
    - Spin-up 1.3 s.
    - One coordinated burst: 6.0 × DK once per monster within 3.2 of any drill (the union, not per drill).
    - All of it is `noCharge`.
  - **Ending:** the reverse transform (1.0 s), then the pet dismounts to a safe spot (0.3 s). The crumble (1.6 s) is
    presentation only and deals no damage. Controls are restored and the cooldown starts once.
- **Every hit** × `dmgK` 2 (as Beast Machine).

## Exits and cleanup
Timeout (turtle) → the crumble; the end of Calamity → the crumble; the pet's defeat, a party swap, the floor's end or
a reset → an immediate safe release. Every exit clears the following:
- the bit (docked);
- the underground state, so the pet stands on safe walkable ground;
- the plans, the queued presses and the gate maps.

Every exit restores the controls and starts the 120 s cooldown once.

## What A needs from the model (Lead): pose channels (`GENBU_GL.blankPose()`), anchors, draw hook
All channels are numbers. Amounts are 0..1 unless noted; angles are in radians. The core writes them every frame,
wraps phases, clamps every value and guards NaN.
- **Form:** `xf` 0 turtle .. 1 drill form, the whole transform. The core drives it through the spec's 7 steps in
  order:
  - 0–0.12 brace and open the shell clearances;
  - 0.12–0.26 head and tail in;
  - 0.26–0.48 legs fold, tracks rotate down;
  - 0.48–0.58 weight onto the tracks;
  - 0.58–0.78 carriage forward and lowering on its rails;
  - 0.78–0.86 lock;
  - 0.86–1 shell closes, drill accelerates.

  Lead: tell me if you want separate stage channels instead.
- **Walking:**
  - `gait`: phase in cycles, 0..1, wrapped by the core. A diagonal pair of legs plants at 0, the other at 0.5.
  - `gaitK`: stride amount.
  - `crouch`: legs compress for the Jump take-off.
  - `stomp`: landing squash, -0.3..1.
  - `brace`: feet splayed and planted for Rock You.
- **Body:** `bank` (-1..1), `pitch` (-1..1, + nose up), `bob` (tiles, a drawn offset), `breath`.
- **Head, neck and tail:** `headYaw` (-1..1), `headPitch` (-1..1), `neck` (0 retracted .. 1 extended, rest 0.7),
  `tail` (swing -1..1).
- **Shell Roll:**
  - `tuck`: head, legs and tail into the shell; the drill to its protected position on the carriage.
  - `roll`: the shell's spin about the vertical axis, an angle wrapped by the core. The cockpit and the pet go round
    with it but stay upright; the core draws the pet at the `seat` anchor.
- **Drill:**
  - `drillSpin`: angle, wrapped. `drillV`: 0..1, the motor speed for blur and whine.
  - `motor` (bearing glow), `vents` (dust and steam), `lockK` (mounting clamps closed).
  - `bitOut`: 1 while the bit is away (not drawn on the carriage), 0 when docked. Between 0 and 1 it slides along the
    motor axis, for docking.
- **Tracks:** `treadPh`, an angle wrapped by the core.
- **Light and wear:** `glow` (amber 0..2), `crack` (fracture lines through the armour), `buckle` (feet giving way at
  the end), `alpha`.
- **Ground:** `clipZ`, a world height; the model is cut there while burrowing, and null means no cut.
- **Anchors** (world `{ x, y, z }` from `GENBU_GL.anchor(name)` after a draw, or `anchorAt(name, x, y, z, a, P, o)` for
  a pose without drawing):
  - `seat`, `drillTip`, `drillBase` (motor and bearing), `carriage`, `head`, `beak`, `eyes`;
  - `footFL`, `footFR`, `footRL`, `footRR` and `trackFL`, `trackFR`, `trackRL`, `trackRR`;
  - `ventL`, `ventR`, `shellTop`, `tailTip`, `belly`.
- **The detached bit:** `GENBU_GL.drawBit(c, x, y, z, yaw, pitch, spin, o)`, the same bit as on the carriage, for the
  flying Drill Cannon and the recall. The core gives the bit's world pose each frame (`ctx.drill`).
- **Draw:** `GENBU_GL.draw(c, S, T, o)`, as Beast's hook.
  - The world position comes from the core's `S.body` (`x`, `y`, `z`, `a`, `scale`, `vis`).
  - `o.pet(cc, PX, PY)` is called at the seat so the pet is layered in the body.
  - It returns true when it drew, and false means the core's 2D placeholder draws.
  - Also `on()` (idle mesh build, as Beast's), `fail()`, `stats()`, and a force flag `window.__GENBU_GL`.
- **Size:** a footprint about 3.2 × 2.4 tiles (length × width) in turtle form and 3.6 × 2.0 in drill form. The rider
  is about 1.6 tiles up, the drill tip about 2.6 ahead of the centre. The core's collision uses these numbers; tell A if
  yours differ.

## What E reads (the core's plans on `ctx`)
- `ctx.body` (place, heading, `z`, form `xf`, `under`).
- `ctx.roll` (Shell Roll: `t`, `path`, `hit` set).
- `ctx.jumpLand` (landing events).
- `ctx.rockPlan`: `{ t0, cx, cy, crystals: [{ x, y, r, rise, t }], tErupt, tBurst, done }`.
- `ctx.drill`: the bit's world pose.
  - Fields: `{ state: 'docked' | 'spin' | 'out' | 'impact' | 'back' | 'dock', x, y, z, yaw, pitch, spin, trail: [...],
    impact: { x, y, t } }`.
- `ctx.calamity`:
  - Fields: `{ phase: 'xform' | 'drill' | 'climax' | 'revert' | 'crumble', t, z, under, emerge: [{ x, y, t }],
    ridge: {...}, drills: [{ x, y, t, spin, rise, burst }] }`.
  - `drills` always has exactly 8 entries.

They are all read-only for E. E's file may add `update(ctx, dt)`, `drawUnder(ctx, c)`, `drawOver(ctx, c)` and
`gpuUnder` / `gpuOver` (as 20k6h), all optional. The core runs with stubs when the file is absent.

## Standing rules
- **Performance:** for iPhone and a 2019 iMac. Pooled particles; less on the low setting; respect reduce-motion.
- **The pet:** never turn, yaw or 3D-twist it. The rider is drawn upright with `X.drawPetAt` at the `seat` anchor.
- **Scenery:** props the body passes through are smashed via `VEH_SMASH`, on the ground only, never underground. Never
  edit the map.
- **Timers:** deadlines on the game clock.
- **Git and pages:** never commit or push, and never touch `test.html`. Build your own page with
  `python3 src/build.py --test-only test-genbu<n>.html`.

## Checks (for H)
- Both forms connect: `xf` 0 → 1 → 0, every anchor finite, and the `seat` anchor always present.
- Four track pods in both forms: the `trackXX` anchors exist and touch the floor in drill form.
- Shell Roll and Jump both work, one right after the other, without merging.
- The physical drill: `ctx.drill` leaves and returns to `docked` on every cast. No Strong goes while it's away.
  Calamity while it's away recalls it first.
- Burrowing is controllable: Dodge takes it under and Jump brings it up. It is never outside walkable space, and the
  pet ends on safe ground.
- `ctx.calamity.drills.length === 8` at every evo. The burst hits each monster once.
- The crumble ending: no damage event after the burst, the controls are restored, and the cooldown is 120 s from the
  exit, set once.
- The gauge: Calamity's hits never charge it.
- Cleanup on timeout, defeat and reset: no underground state and no detached bit left behind.

## Notes
(Each worker adds dated notes here: decisions, changes, what others need to know.)

- **(A, 2026-11-13) The model contract as delivered, and how the core drives it.** The lead's first pass is
  `src/js/20k2kz-earth-genbu-model.js` (`GENBU_MODEL`). It has the same API as Jaws' model and replaces the
  `GENBU_GL` plan above.
  - **API:** `create()`, `draw(c, x, y, z, a, P, o)`, `drawShadow`, `anchor(name)` (after a draw),
    `anchorAt(name, x, y, z, a, P, o)`, `rigOf(P)`, `blankPose()`, `warm()`, `SIZE`, `COUNTS`, `PARTS`.
  - **Origin:** the ground under the body's centre; `z` is the height above the floor.
  - **Force flags:** `window.__GENBU_GL = 1` forces the GPU; `__GENBU_GLHQ` gives full resolution under software GL.
  - **Channels** (the core writes them every frame; phases wrapped, every value clamped, NaN guarded):
    - **`xf`** 0 turtle → 1 drill. The spec's steps are built into the model's ranges: brace 0–0.1, head and tail in
      0.08–0.32, legs fold and tracks down 0.22–0.6, weight onto the tracks 0.48–0.7, carriage 0.55–0.86, lock about
      0.85, shell closes 0.84–1. The core runs it linearly over the 1.6 s transform and back over the 1.0 s revert.
    - **`walk`** (radians) and **`walkK`:** from the gait (phase by distance, amount by speed).
    - **`crouch`:** the Jump's take-off.
    - **`roll`** 0..1: the tuck. The core spins the drawn heading itself (`drawA` = heading + the roll's spin).
    - **`bank`, `pitch`.**
    - **`drillSpin`:** idle at 2 rad/s, up to 40 when spun up.
    - **`drillOff`, `drillYaw`, `drillPitch`:** null at home. While the bit is away, `drillOff` is the bit's world
      position minus the dock's, in the body's frame (model units). `drillYaw` is relative to the drawn heading.
    - **`drillGlow`** (spin-up and Calamity), **`glow`** (0..1, from the gauge; 1 in the climax).
    - **`crumble`:** the ending, over 1.6 s after the dismount.
    - **`ground`:** `-z` while below the floor, else null.
    - **`alpha`.**
  - **The pet:** drawn by the core at the `seat` anchor after the body, upright, with `X.drawPetAt`.
  - **Anchors used:** `seat`, `drillTip` (the launch point and the docking target, taken with `drillOff` null),
    `dock`, `head`. The core's names `tailTip` and `footXX` / `trackXX` map to the model's `tail`, `foot0..3` and
    `track0..3`.
  - **Underground:** at `z` −1.05 the seat is at about 0.8 above the floor, so the pet stays visible riding the
    ridge.
  - **Model requests:**
    - A `jaw` channel would help Rock You's brace roar. Nice to have, not blocking.
    - The `foot0` anchor sits about 0.1 below the floor at rest. Fine for dust; tell A if it should be 0.
- **(A) Core status (`20k2l`):** a first full pass, run end to end in a probe at evo 4:
  - summon → walk;
  - Shell Roll, with a Jump pressed during it going after;
  - Rock You (two damage phases);
  - Drill Cannon (out → impact → back → dock, with the lockout);
  - Calamity (transform, dive and rise, emergence, exactly 8 drills, the burst, revert);
  - the crumble, which dismounts the pet onto walkable ground; cooldown 120 s, set once;
  - timeout with the drill away (recalled, crumble);
  - defeat underground (released on safe ground, nothing left behind).

  Placeholder 2D effects are drawn by the core until E's `GENBU_MOVES` hooks land. The core runs without them.
- **(A, 2026-11-13) For E: the plan hooks as implemented in `20k2l`.** All are read-only, on `ctx`, and the world
  units are tiles.
  - **Hooks:** `GENBU_MOVES.update(ctx, dt)`, `drawUnder(ctx, c)`, `drawEnt(ctx, c)`, `drawOver(ctx, c)`, all
    optional. They are called every frame after the core's own pass.
    - Set `GENBU_MOVES.drawsFx = true` when your file draws the effects. The core then stops drawing its placeholders:
      the summon ring, Rock You's area and crystals, the burrow ridge and cracks, the 8 marks and drills, the bit's
      trail, and its pooled dust, stone and sparks. It keeps the body, the pet and the HUD.
    - The bit itself is drawn by the lead's model through `drillOff`.
  - **`ctx.body`:** `{ x, y, z, a, speed, vx, vy, under, locked }`. `z` is below 0 while burrowing; `under` is true
    when `z` < −0.3. `ctx.pose` is the model's pose; `ctx.anchor(name)` gives world anchors.
  - **`ctx.roll`** (null when not rolling): `{ ph: 0 tuck | 1 spin | 2 unfold, t, dir, spin (angle), w (rad/s),
    hit: Set, path: [[x, y, t]] }`.
  - **`ctx.jumpLand`:** the last landing, `{ x, y, t, r, noHit }`. A new object appears per landing; compare `t`.
  - **`ctx.rockPlan`** (null when idle):
    - Plan fields: `{ t, cx, cy, tErupt, tBurst, burst, burstT, done }`.
    - `crystals: [{ x, y, r, h, lean, rise (s, the plan's clock), t (when it rose), up }]`.
    - Phase 1 is each crystal's `up`. Phase 2 is `burst` (at `burstT`). The plan lives for 0.6 s after the burst.
  - **`ctx.drill`:** `{ state, t, x, y, z, yaw, pitch, spin, trail: [[x, y, z, t]] (newest first, 28 max),
    impact: { x, y, t } | null, x1, y1 (the aim) }`.
    - `state` is one of: `'docked'`, `'spin'` (0.5 s spin-up), `'out'` (0.9 s), `'impact'` (0.25 s), `'back'`
      (0.8 s), `'recall'` (0.45 s, Calamity's recall; no damage), `'dock'` (0.25 s).
  - **`ctx.calamity`** (null before Calamity):
    - Phases: `'recall' | 'xform' | 'drill' | 'climax' | 'revert' | 'crumble'`.
    - Fields: `{ phase, t, xf, under, leap: { t } | null, emerge: [{ x, y, t }] (the last 8), ridge: { x, y, a, t }
      (while under), left, done }`.
    - In the climax it adds `drills: [8 × { x, y, i, delay, rise 0..1, spin, glow 0..1, up, burst (0, then 1 + s
      since the burst) }]`, `burstDone` and `burstT`. `drills.length` is always 8.
  - **Damage and timing are the core's.** Draw at those times. Nothing in `GENBU_MOVES` should call `ctx.hit`.
- **(A) For H: driving Genbu in `tests/elem-moves.js`.** A branch like Nidhogg's and Beast's:
  - Wait for `D.g._genbu.phase === 'walk'` (the summon takes 1.6 s).
  - With `e` the time since the cast:
    - every 2 s, `D.dodge()` (Shell Roll: one hit per monster within 2.2 of its path, the most reliable damage);
    - at `e` > 4, `D.useStrong('strong')` (Rock You at the nearest enemy, two damage phases over about 1.4 s);
    - at `e` > 7.5, `D.useStrong('strong2')` (Drill Cannon; it is refused while the bit is away, about 2.7 s per
      cast).
  - Holding the stick toward the monsters also tramples them (walking above 25% of top speed).
  - At the end: if `S.charge >= 1`, `D.useUlt()`, then wait for `S.released` (Calamity: about 1.6 s transform +
    8–10 s drilling + 3.2 s climax + 1 s revert + 1.9 s crumble; it ends by itself). Otherwise set `S.left = 0` (the
    crumble follows, 1.9 s).
  - `fxLeft` should be 0 after `S.released` plus 1.6 s.
  - For a pinned `tests/genbu.js` with `vehpin`: `{ key: 'genbu', el: 'earth', g: '_genbu', body: 'body', ready:
    'walk', busyKeys: ['roll', 'jump'], fin: 'Calamity' }`.
  - Stats: `S.stats` (`roll`, `rollHit`, `jump`, `jumpHit`, `rock`, `rockErupt`, `rockBurst`, `drill`, `drillTicks`,
    `drillImpact`, `docks`, `recalls`, `cal`, `dives`, `rises`, `emerge`, `drills8`, `eruptHits`, `burstHits`,
    `crumble`, `charged`).
  - `__dbg`: `ELEM_IMPL.earth.ult.genbu.__dbg` (`TUNE`, `anchor`, `pickEight`, `MODEL`).
- **(A) Feel pass, v1:**
  - **Walking:** the body sways over each planted diagonal pair (`bank`), dips as each pair takes the load (a drawn
    bob), rocks nose to tail (`pitch`), noses up as it heaves into motion and down as it brakes, and leans into turns.
  - **Shell Roll:** the spin rises from the tuck with an ease-in, judders heavily at full speed, and slows on a long
    ease-out with a wobble as it settles.
  - **Jump:** a deliberate compression (`crouch` over the 0.16 s crouch), nose up rising and down falling, and on
    landing an underdamped squash (`crouch` and a drawn dip) that springs back.
- **(E, 2026-11-13) Effects pass 2 (`20k2m`): every move's effects in true 3D on the GPU, captured with the model.**
  - **Renderer (`GENBU_MOVES.G3D`):**
    - Shapes are built in true 3D (a floor offset dy is dy × GY 0.72 in world y, as the model and the rig), so rocks are
      as deep as they are wide.
    - Three layers: stone (writes depth), dust (depth-tested only, so billows never cut each other) and light (screened,
      hidden behind stone). An invisible ellipsoid stand-in for the shell writes depth, so debris and light behind the
      turtle hide behind it (`window.__GB_OCC = 1` draws it, for checking).
    - Everything is cut at the floor (z 0) with a feathered edge, so drills, crystals and blasts tear up through it.
      Every hemisphere fades to zero alpha toward its base.
    - Force flags: `__GB_GL` (and `__NG_GL` for the shared floor painter, `NIDHOGG_MOVES.FGFX`).
  - **What it reads:** `ctx.roll`, `ctx.jumpLand`, `ctx.rockPlan`, `ctx.drill`, `ctx.calamity` (`emerge`, `drills`,
    `burstDone`), `ctx.body`, `ctx.pose.crumble` (so the timeout crumble gets its fragments too, where `ctx.calamity`
    is null) and `ctx.now()` (event ages are on the game clock).
  - **For A:**
    - The core stops calling `update` after `release()`, so `drawOver` steps the pieces itself from `ctx.now()` and the
      dust still settles during the fx's last 1.6 s.
    - The core catches hook errors silently, so `20k2m` reports each distinct one once as `console.warn('Genbu FX …')`
      and lists them in `GENBU_MOVES.errors`. `tests/genbu.js` already fails on such warnings.
  - **Moves:**
    - **Shell Roll:** sparks scraped off the rim (streaks), dark dirt flung tangentially, amber arc accents turning
      with `roll.spin` on two tiers, and a low ring of dust billows following the shell.
    - **Jump:** a feathered wave of dust carrying hopping clods outward, a ring of tipped slabs, glowing cracks, flying
      stone and a floor ring.
    - **Rock You:**
      - Amber cracks run to the target during the brace.
      - Each crystal is a faceted six-sided prism (beige stone faces, burnt-orange seams, glowing veins) with one or two
        smaller prisms leaning out of it. It thrusts up from below the floor through 2–3 tipped slabs.
      - The fractures brighten and pulse through the pause.
      - The burst throws crystal fragments, stone and dust, with a blast and a wave.
    - **Drill Cannon:**
      - Spin-up: amber arcs counter-rotate round the bearing, and dust comes from the vents.
      - The route carves a furrow (a trench with an amber glow between two lips of earth) that fades over 1.7 s, with
        clods and slabs thrown out.
      - Impact: a blast with slabs.
      - The return leaves an amber ribbon, and docking throws sparks.
    - **Calamity:**
      - Transform: dust comes off the tracks, and sparks fly as it locks.
      - On the surface, the drill throws earth and carves a furrow.
      - Underground: a ring of heaving earth with a bow wave round the buried body, a ridge of churned earth behind it,
        glowing crack stars over it, stones rolling off, and a pulsing amber marker.
      - Dive and emergence: slabs thrown up, a powerful wave and an amber blast.
    - **Climax:**
      - Eight fracture stars mark the spots.
      - Eight 3.6-tile stone drills, each with two sharp burnt-orange crystal flutes and an amber seam at each flute's
        root, rise from below. Their rotation is the core's `d.spin`, and their glow is `d.glow`. Energy spirals in to
        each tip.
      - One coordinated burst: amber columns, crystal fragments, clods and dust.
    - **Crumble:** stone-coated fragments (sand, burnt orange, steel), grit and slowly settling dust, after an amber
      flicker.
  - **Budget:** heaviest-moment vertices (all layers; lowFx in brackets):
    - Roll 10.4k (5.9k), Jump 9.4k (4.3k), Rock You burst 18.6k (10.7k), Drill Cannon 13.7k (5.7k), Crumble 3.9k (1.8k).
    - Calamity's climax at the burst: 71.7k (38.8k). It is the heaviest moment of all; the eight drills are 24 × 11
      grids, solid and seam layers.
    - Particles are pooled with per-kind caps (rocks 150, dust 46, sparks 120, slabs 40, fragments 84; lowFx 60 / 18 /
      45 / 16 / 30).
    - Test hooks: `G3D.dry.on` (build without drawing), `G3D.stats` (`maxTotal`, …), `G3D.layers()`,
      `GENBU_MOVES.nParts()`.
  - **For the lead (the model, not E's):**
    - While burrowing, the drill bit is drawn below the floor. It shows as a full bit sticking out of the ridge toward
      the camera, so `ground` doesn't seem to clip the bit.
    - The shell top above the floor reads as a flat disc. E's ring of earth now hides its edge.
    - The faint full-height vertical light line in some captures is the game's own ambient layer. It is there with
      E's effects off too.
  - **For H:** `tests/genbu.js` has no `GLFLAGS`. E ran it on the GPU path with a preload that adds the flags to every
    page (scratchpad `genbu/E/glpre.js`).
- **(E, 2026-11-14) Effects for the v336 changes (`20k2m`).**
  - **Drill Cannon** (spin → out → drill → explosion → mat → docked):
    - The furrow, the return ribbon and the dock sparks are gone.
    - `out`: an amber trail with two strands of air wound round the arc, a comet glow at the bit, and a flash on
      firing. E records the flight in 3D itself, because the core's `D.trail` only grows with horizontal travel and
      the arc is mostly vertical.
    - `drill`:
      - A churning ring of dark earth with a dust swirl round the lodged bit; clods, grit and sparks spiral out.
      - Crack stars spread further and pulse on each `D.nTick`, with a floor ring and a small flash.
      - An amber glow and column build toward the explosion.
    - The explosion keeps the blast and adds a burst of crystal fragments.
    - `mat`: amber motes converge on the carriage, and a ring of light sweeps from base to tip along the new bit,
      with a second ring at the bearing. A flash and sparks follow when it is whole (`mat` → `docked`).
  - **Summon** (from `ctx.summonT` and `ctx.SUMMON`):
    - Up to the breach: a bulging, fissured, glowing mound of earth with amber cracks spreading and rumbling dust.
    - At `burst`: an eruption of slabs and chunks, a dust column, a shock ring and an amber blast.
    - Then settling dust.
    - The turtle's depth stand-in is off until 0.2 s after the breach.
    - Before the pet mounts, the clear zone kept for the rider's face follows the pet, not the buried seat.
  - **Budget** (heaviest moment; lowFx in brackets):
    - Drill Cannon: spin-up 8.0k (3.5k), flight 8.6k (4.4k), drilling 14.0k (6.6k), explosion and `mat` 23.3k
      (10.8k).
    - Summon breach: 17.1k (7.1k).
    - Climax: unchanged at 72k (38k).
    - A 22 s Calamity with 7 dives peaks at 248 pieces (the caps total 440) and 24 events (capped at 64).
  - **For the lead (model):**
    - The lodged bit is drawn whole below the floor, as a drill pointing down-screen under the landing spot. The
      burrowing note above applies here too.
    - During the summon, a dark block of the model pokes through the bulge before the breach.
    - The light pillar and halo on the pet at the cast are the game's Ultimate-cast effect; they appear with E's
      effects off.
