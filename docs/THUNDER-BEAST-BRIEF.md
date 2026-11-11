# Beast Machine — 11th Thunder ult (three workers)

The user's spec, verbatim, is in `docs/elem-spec/thunder-beastmachine.md`. Read all of it.

The row is already in `src/js/20k1-elem-core.js`: `['beastmachine', 'Beast Machine', 'fist', 100, 120, ...]`, the 11th
Thunder ult (the element key is `thunder`, display name "Lightning"). Don't edit the row. `ELEM_ULT_LV` already has 11
entries.

**It reuses the Sports Car system.** Read these before writing anything:
- `docs/LIGHT-CAR-BRIEF.md` with all its Notes (rounds 1–4)
- `src/js/20k4p-light-ult-11.js` (core: the VEH object, ctx, meter, timer, HUD, restore, cooldown at exit, safe landing,
  `canDrive`, smash)
- `src/js/20k4q-light-car-moves.js` (how moves run off ctx, pooled effects, `ctx.alive()`)
- the VEH hooks in `src/js/20b-game-dungeon.js` (search `VEH`, `vehBtns`, `carJump`, `drawPetAt`, `flowAt`)

The VEH hook in 20b is generic (`X.vehicle(o)`). Beast Machine sets its own VEH object; it must not break Sports Car.

## Differences from Sports Car
- **Dodge is Jump** (a heavy bounding hop with landing damage). There's no separate Jump button and no Drift. (Round 2 changed this: Dodge is Drift, Jump has its own button; see the Notes.)
  - The vehicle HUD needs a Beast variant: bronze, electric blue and gold, with missile, fist, jump and lightning-sphere
    icons.
  - Show the remaining form time.
  - If `vehBtns()` / the J key assume the car layout, make it per-vehicle: J may also trigger Beast's Jump. Keep the
    change small and commented, and keep Sports Car pixel-identical.
- **No prop smashing.** The spec says "Do not permanently destroy terrain". The machine collides like the car's
  non-smash path: walls and props block it. (Round 3, 2026-11-08, overrides this at the user's request: the machine smashes
  environmental props, chests and shrines; see the Notes.)
- **Jump:** no immunity for the whole flight. Mirror the Dodge's short i-frame convention only at take-off, if any. The
  next jump only after landing and recovery.
- **Numbers:** durations 20/25/35 s and a 120 s cooldown from exit, as Sports Car.

## Standing user rules
- Performance: the user plays on an iPhone and a 2019 iMac.
  - Bake the machine into cached sprites, per heading bucket and pose. Bake lazily on a small budget, plus a
    `U.beastmachine.warm` idle hook.
  - Pooled particles and missiles. Steady cost ≲ 1.5 ms per frame while riding. No single hitch over ~6 ms.
  - Less decoration on the low setting. Respect reduce-motion and shake settings.
- Effects: feather every edge. Floor marks are light only (no dark stains). Effects never cover the pet; the pet stays
  visible between the cannon banks.
- **Never turn, yaw or 3D-twist the pet.** The rider sits upright with its normal sprite, using `X.drawPetAt`. A flat 2D
  sway or tilt is OK. The machine itself may face its heading through baked heading buckets.
- Nothing copied from reference art.
- Never commit, push or touch `test.html`. Build your own page with `python3 src/build.py --test-only test-beast<1|2|3>.html`.

## Split
| Worker | File | Owns |
|---|---|---|
| B1 (core) | `src/js/20k9i-thunder-ult-11.js` plus small commented hooks in 20b / 12-arcade if needed | See below |
| B2 (Strongs) | `src/js/20k9j-thunder-beast-moves.js` | §5 Homing Missiles, §6 Heaven's Wrath |
| B3 (finisher) | `src/js/20k9k-thunder-beast-judgement.js` | §9 Judgement Day |

**B1 (core) owns:**
- `U.beastmachine`
- the §1 construction gag
- the §2/§3 model: an articulated, baked machine renderer driven by a pose
- §4 riding gait and contact damage
- §7 Jump
- §8 meter
- the HUD
- the timer
- §10 exit, restore and cooldown
- the stub moves for testing

B2 and B3 do not edit 20b, 20k9i, or each other's files.

## Contract: `BEAST_MOVES`
Each move file starts with `const BM = (self.BEAST_MOVES = self.BEAST_MOVES || {});` and adds its own keys:
- B2: `BM.missiles(ctx)`, `BM.wrath(ctx)`, `BM.TUNE_S = { missileCd, ... }`
- B3: `BM.judgement(ctx)`, `BM.TUNE_J = { ... }`
- each may add a `warm(budgetMs)` (`BM.warmS`, `BM.warmJ`)

B1 looks these up at call time. Each move calls `ctx.done()` when finished. Every delayed or per-frame step checks
`ctx.alive()` and stops cleanly when it is false.

**ctx (B1 builds it once per form):**
- `ctx.X`, `ctx.C`, `ctx.H`, `ctx.evo`, `ctx.tier` (0/1/2 for evo 1–3 / 4–6 / 7), `ctx.DK`
- `ctx.hit(m, dmg, opts)`: the only way to deal damage. It returns the effective damage dealt (after mitigation, no
  overkill) and adds it to the Judgement meter unless `opts.noCharge`.
- `ctx.hitArea(x, y, r, dmg, opts)`: one hit per living monster inside.
- `ctx.hitOval(cx, cy, rx, ry, ang, dmg, opts)`: one hit per monster whose circle overlaps the oval. Add it if B1 can;
  otherwise B2 builds it on `ctx.hit`.
- `ctx.target()`: aim/targeting pick `{x, y, m}`. `ctx.mons()`: living hittable monsters.
- `ctx.canStand(x, y)` / `ctx.nearestStand(x, y)`: walkable for the machine footprint.
- `ctx.flowAt(x, y)`: reachable on foot.
- `ctx.beast`: the live machine state (read/write):
  - `{ x, y, a /*heading*/, vx, vy, z /*height*/, scale, locked /*true = a move owns movement*/, contact /*false = no ramming*/, vis }`
  - `pose`: pose channels B1's renderer reads every frame, all numbers:
    - `crouch` 0..1
    - `armLRaise`, `armRRaise` 0..1 (hand lifted overhead)
    - `armLSlam`, `armRSlam` 0..1 (hand driven down/forward into the ground)
    - `armLReach`, `armRReach` (extend forward)
    - `cannonTilt` 0..1 (0 = rest, 1 = pointing up)
    - `recoilL`, `recoilR` 0..1
    - `cannonFold` 0..1 (braced/folded for Judgement)
    - `torsoDip` 0..1
    - `glow` 0..1 (crimson fittings + eyes)
    - `charge` 0..1 (electricity gathering over the body)
    - `shudder` 0..1
    - `legsExt` 0..1 (rear legs extended in the air)
    - `handsIn` 0..1
  - B1 eases each channel toward the value a move sets each frame (or the move sets it directly), and renders any
    combination believably from baked part sprites.
- `ctx.anchor(name)`: world position `{x, y, z}` of `'cannonL'`, `'cannonR'`, `'muzzleL'`, `'muzzleR'`, `'handL'`,
  `'handR'`, `'seat'`, `'eyes'`, `'chest'`, given the current pose and heading. This lets moves spawn effects from the
  right place.
- `ctx.scr(x, y, z)`: world to screen. `ctx.seat()`.
- `ctx.petX/petY/petZ/ejecting`: as Sports Car, for B3's rider ejection.
- `ctx.vis` / `beast.gone`: B3 sets these when the machine pops.
- `ctx.done()`, `ctx.alive()`. `ctx.judgement` is true while the finisher runs. B1 keeps `alive()` true through a
  started Judgement Day even on a won floor (capped at ~10 s), as with Supernova.

## Lifecycle (B1 enforces)
- **Missiles** don't lock movement. **Wrath** locks it (`beast.locked`) with bounded aim adjustment between strikes.
  B2 handles aim adjustment via `ctx.aimDir()`, which B1 provides.
- **Wrath cooldown** is exactly 2 s from the final strike: B2 calls `ctx.done()` at the final strike's recoil end and B1
  starts the 2 s from there. No overlap while a sequence is unfinished.
- **Missile cooldown** is B2's `TUNE_S.missileCd` (around 1.5–2 s).
- **Judgement Day:** only when the meter is full, once per form, on a manual press. It locks everything and runs to
  completion. Its damage is `noCharge`.

## Balance starting points (state your final numbers)
DK = base × K × (1 + 0.08·(evo−1)).

| Part | Starting point |
|---|---|
| Contact | ~0.6 DK, gated 0.45 s per monster, only while moving above ~35% top speed |
| Top speed | ~8 tiles/s (a heavy bounding gait) |
| Jump | ~2.6 DK landing AoE r ~2.6, knockback, ~0.75 s airtime, high arc; cooldown from landing ~0.9–1.1 s (dodge cadence); planned safe landing like the car's Jump (walls block, no gaps) |
| Homing Missiles | 10/15/20 × ~0.45 DK, splash r ~0.9 at ~0.5× (the direct-hit target excluded from splash), cd ~1.8 s |
| Heaven's Wrath | 1/2/3 strikes × ~3.0 DK in an oval ~3.4 × 2.2 tiles ahead; then exactly 2 s cooldown |
| Judgement Day | impact ~4 DK; spheres 5/6/7 pulsing 4 times at ~1.5 DK per enemy per pulse (not per sphere); final burst ~10 DK once per enemy |
| Meter | dealt / (~30 × DK), so roughly 10–18 s of active play |

## Checking (each worker)
- `ELEM=thunder ONLY=beastmachine EVO=1|4|7 HTML=<page> node tests/elem-moves.js` must pass once B1's core exists.
  - B1 adapts the harness the way Sports Car's was (search `sportscar` in `tests/elem-moves.js`): ride through
    monsters, fire both Strongs, press Judgement if full, else time out.
- Also run `ELEM=light ONLY=sportscar EVO=4` to prove Sports Car is unbroken.
- B2 and B3 develop against a stub ctx in the scratchpad, then end to end once B1's file exists. Watch the Notes below.
- Montages go in `/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/beast/`:
  - B1: `core.png` (construction beats, riding gait, jump, HUD, timeout pop)
  - B2: `strongs.png`
  - B3: `judgement.png`
  Look at your montage and iterate to the bar.
- Report concisely: files, numbers, ms costs, what was tested and what wasn't.

## Notes
(Append contract changes here, dated, keeping them backward compatible.)
- (B1, 2026-11-07, contract details; all additive. B1's file is `20k9i-thunder-ult-11.js`)
  - Conventions: world tiles as the map (`x`, `y` top-down; `z` = height in tiles above the floor). Angles (`beast.a`,
    `ctx.aimDir()`, `hitOval`'s `ang`) are world-plane directions: `(cos a, sin a)` in map tiles, as on the screen.
    `ctx.scr(x, y, z)` = `[screenX, screenY]` (z lifts by 0.695 T per tile). `ctx.T()` = tile px now.
  - `ctx.H` is the DunElem toolkit the ult was cast with (`H.add`, `H.P`, `H.living`, `H.sx/sy` ...); `ctx.X` = `H.X`
    (20b: sfx, shake, flash, light, ring, text, after, walkPoint, blocked ...). Deal damage only through `ctx.hit`,
    `ctx.hitArea`, `ctx.hitOval` (never `X.hitMon` / `H.hitArea`), so the meter counts each event once.
  - `ctx.tier` = 0 / 1 / 2 (evo 1-3 / 4-6 / 7), `ctx.evo`, `ctx.DK` = base x K x (1 + 0.08 (evo-1)).
  - `ctx.hit(m, dmg, opts)` -> effective damage dealt (0 for a miss / invulnerable / dead). opts pass to hitMon
    (`kb`, `stun` ...) plus `noCharge`. `ctx.hitArea(x, y, r, dmg, opts)` -> count (monster circle overlaps r).
    `ctx.hitOval(cx, cy, rx, ry, ang, dmg, opts)` -> count: the oval's rx axis points along `ang`; a monster is hit when
    its circle (m.r) overlaps it. One hit per monster per call; `opts.exclude` (a Set or a monster) skips those.
  - `ctx.mons()` living hittable monsters; `ctx.target()` `{x, y, m}` (m may be null: then a point 4 tiles ahead).
  - `ctx.aimDir()` -> angle: the stick's direction if pushed, else the heading. `ctx.stick()` -> `{x, y, mag}`.
  - `ctx.anchor(name)` -> `{x, y, z}`: 'cannonL', 'cannonR' (barrel base), 'muzzleL', 'muzzleR' (the barrel tips;
    'muzzleL0..2' / 'muzzleR0..2' for each of the three barrels), 'handL', 'handR' (palm centre), 'seat', 'eyes',
    'chest', 'head' (snout tip), 'back'. Also `ctx.cannonDir(side)` -> unit `{x, y, z}` the barrels point along
    (side 'L' / 'R'), for missile launch velocity.
  - `beast.pose` channels are TARGETS: a move writes them each frame (or once) and B1 eases the drawn pose toward
    them (time constant 0.06 s; set `beast.poseSnap = true` for one frame to jump). While a move is busy B1 never
    touches the channels; after `ctx.done()` B1 relaxes every channel back to 0 (about 0.3 s), so moves needn't reset.
    `armLRaise` etc.: L = the machine's left (its own left as it faces its heading).
  - `beast.locked`: B1 sets it for Wrath (B2 may move `beast.a` by bounded steps between strikes) and for Judgement;
    Missiles run unlocked (the machine keeps walking). One Strong runs at a time; a press during another is kept for
    1 s and fires once when free. Missile cooldown starts at the press (`TUNE_S.missileCd`, default 1.8); Wrath's 2.0 s
    starts at its `ctx.done()`.
  - Optional hooks B1 calls if present: `BM.update(ctx, dt)` each frame, `BM.drawUnder(ctx, c)` (floor layer, under the
    actors) and `BM.drawOver(ctx, c)` (over the actors, under the HUD), each in save/restore + try/catch; `BM.warmS(ms)`,
    `BM.warmJ(ms)` from B1's idle bake and while riding. Drawing through your own `H.add` fx is fine too.
  - `ctx.calm()` (Reduce Motion), `ctx.low()` (low effects), `ctx.sfx` (= X.sfx: note, hiss, thud, crash, stomp,
    crack, twang, pop, whoosh ...). `ctx.beast.vis` 0..1 (0 = B1 stops drawing the machine), `beast.gone = true` also
    hides it. Ejection as Sports Car: `ctx.ejecting = true`, keep `ctx.petX/petY/petZ` updated; on `ctx.done()` B1
    places the pet at `ctx.nearestStand(petX, petY)`, restores everything and starts the 120 s cooldown.
  - Debug: `g._beast` is the live form (phase 'build' | 'ride' | 'judge' | 'out' | 'gone', `charge`, `left`, `beast`,
    `ctx`, `stats`); `ELEM_IMPL.thunder.ult.beastmachine.__dbg`.
- (B2, 2026-11-07; `20k9j-thunder-beast-moves.js`, additive)
  - B2 draws through its own `H.add` fx (key `'beast-strongs'`, `drawUnder` + `draw`); it does not use the optional
    `BM.update/drawUnder/drawOver` hooks. `BM.warmS(ms)` bakes 18 small sprites (largest step ~5 ms), returns true when done.
  - B2 reads `ctx.anchor('muzzleL0..2' / 'muzzleR0..2')` (falls back to 'muzzleL/R', then a guess), `ctx.cannonDir(side)`,
    `ctx.anchor('handL/R')`, `'seat'` (to dim effects over the pet), `ctx.aimDir()` (number, or {x,y} / [x,y] accepted),
    `ctx.mons()`, `ctx.hit()`. Wrath deals its oval through `ctx.hit` per monster (same overlap rule as `ctx.hitOval`:
    rx along the heading) plus a mode-1 wall check from the machine, so nothing behind a solid wall is struck.
  - Pose: Missiles write `cannonTilt`, `recoilL/R` (1 at each launch, decaying), `charge`, `glow` until their `ctx.done()`
    (as the cannons settle, ~1.0/1.4/1.5 s); missiles still in flight afterwards touch no pose. Wrath writes `armXRaise`,
    `armXSlam` (X = R first, then alternating), `torsoDip`, `crouch`, `shudder`, `glow`, `charge`, and turns `beast.a` by at
    most 0.7 rad (3.4 rad/s) between strikes. Wrath sets `beast.locked = true`, `contact = false` at start and restores
    both just before its `ctx.done()` (final strike's recoil end: 0.71 / 1.41 / 2.11 s after the press).
  - When `ctx.alive()` turns false: nothing more launches, missiles in the air fizzle with no damage, Wrath stops; each
    move still calls `ctx.done()` once.
- (B3, 2026-11-07, Judgement Day; additive) `BM.judgement(ctx)` runs about 7.5 s from the press to `ctx.done()`
  (impact 1.6 s, pulses 2.7 / 3.3 / 3.9 / 4.5, burst 5.6, pop 6.2, pet down 7.2, done 7.5), inside the ~10 s cap. It
  sets `beast.locked/contact`, moves `beast.x/y/z/a` through the leap, writes the pose channels each frame, sets
  `beast.gone = true`, `beast.vis = 0`, `ctx.vis = 0` at the pop, then `ctx.ejecting` + `petX/petY/petZ` and moves
  `me.x/me.y` to the landing (open, flow-reachable floor). Damage: `ctx.hitArea` (impact) and `ctx.hit`, all `noCharge`.
  It draws its own soft shadow under the machine while airborne (`BM.TUNE_J.shadow`; B1: set it false if your renderer
  already shades `beast.z > 0`). Spheres are ELEM fx with `drawEnt`/`entY` (depth-sorted with the machine). Read-only
  `ctx.judgementPlan = { lx, ly, R, spheres: [{x, y, r, rb}] }` for tests. Uses anchors 'chest', 'eyes', 'handL/R',
  'cannonL/R', 'seat' and `ctx.seat()`, `ctx.mons()`, `ctx.target()`, `ctx.canStand`, `ctx.flowAt` (falls back to
  `X.flowAt`), `ctx.nearestStand`.
- (B1, 2026-11-08, after end-to-end with 20k9j and 20k9k) All three files run together with no page errors.
  - B1 sets `BM.TUNE_J.shadow = false` at lookup (B1 draws the machine's own floor shadow, shrinking with `beast.z`).
  - One Strong at a time: a press while another Strong (or Judgement, a jump, the landing recovery) holds the machine is
    kept for 1 s; a press in the last 0.4 s of a cooldown is kept too. Judgement pressed in the air or mid-move goes on
    landing / at the move's end (within 1.2 s). Wrath's cooldown is set to exactly 2.0 s inside its `ctx.done()`.
  - B1 calls `warmS` / `warmJ` one per frame on at most 2 ms of leftover budget (idle time and while riding), until
    each returns true. On SwiftShader a single warm item runs up to ~4.7 ms (B3) / ~3.7 ms (B2); fine, just keep items small.
  - Tests: `tests/elem-moves.js` rides circles for beastmachine, fires Strong 1 at 2.4 s and Strong 2 at 5 s, then presses
    Judgement if full, else times out (tail 14 s). B1's Verify-list test: `scratchpad/beast/b1/logic.js`.
- (B4, 2026-11-08, the visual model rebuilt on the user's concept art; render only, no gameplay change) All in `20k9i`.
  - Layout as the concept: a rounded body, the armoured head hanging low in front (gold horn crests, crimson diamond on
    the brow, recessed red eyes, banded wedge snout, steel jaw with teeth), two huge rusty-bronze shoulder domes (gold
    band, a framed raised hex-plate cluster, faceted gem, gold spike, panel seams with rivets) each carrying a battery
    housing (gold band, gem, red vents) with three thick barrels in a row, the tufted red seat with twin red-tipped
    levers between them, massive segmented forearms planted far out on four-fingered hands with big gold talons,
    short rear legs tucked under, ribbed violet cables, steel pistons, steam puffs at the elbows, arcs round the batteries.
  - Pipeline: signed-distance parts sphere-traced per heading (16 buckets; torso, head, both domes, the battery housing,
    hand, foot) and bone pieces traced side-on once (forearm, upper arm, thigh, shin, barrel, joint, piston rod and
    sleeve). Geometry pass on every other pixel, full-resolution shading from it (re-traced where samples disagree),
    silhouette and material seams supersampled. PBR-style shading: studio environment (soft box, horizon line, warm
    floor) through Fresnel, warm key light with soft self-shadows, cool electric rim, AO, mottled rust, pitting,
    scratches, worn edges, grime/verdigris in creases, hex bevels and rivets as normal detail, faceted gems with inner
    glow. Soft contact occlusion is drawn under each dome, housing and the head. The rider is drawn after all machine
    parts, upright, with its own sprite.
  - Rig: drawn VIS = 1.15 x the rig units (collision unchanged). Shoulders y +/-0.84, hands y +/-1.34 (spider-wide),
    battery trunnion on the dome; barrels rest ~57 deg up and forward, cannonTilt -> ~83 deg, cannonFold -> braced low.
    Anchors keep their names and meaning; 'muzzleL0..2' / 'muzzleR0..2' are the three barrel tips; 'elbowL/R' added.
  - Bake: k = T x dpr x VIS px per rig unit, clamped 40..132. Slices of about 1 ms; a bakeStep never starts a slice
    that would overrun its budget (idle: <= 3 ms; riding 0.8 / 3 ms; build 4.5 ms). A heading needed now gets a quick
    half-size picture first (`BK.lo`). Full bake 5.8 s at k = 72, 13 s at k = 132 (desktop Chromium); p99 call
    4-6 ms, ~0.3% of calls hit a V8 GC pause of 6-14 ms (`BK.spikes` logs them). Sprites: 2.6 MB at k = 72, 8.8 MB at
    k = 132, plus ~3 MB reused scratch. Draw ~0.2 ms median per frame (SwiftShader); update while riding 0.1-0.2 ms
    once baked.
  - Fixed on the way: `S.ignT` stopped advancing after the build, so the ignition current stayed lit on the cables.
- (Round 2, single worker, 2026-11-08; user: "bit rigid to control ... movement faster by 35% ... bring back the drift
  button ... no cooldown on the jump button") All in `20k9i` plus one line in 20b. Supersedes "Dodge is Jump" above.
  - Riding: top 8 -> 10.8 tiles/s, accel 15 -> 26, coast 9 -> 12, overK 6 -> 10, steer 2.6..4.2 -> 4.4..6.8 rad/s,
    grip 9 -> 15, stride 1.9 -> 2.4 tiles per gait cycle (cadence 4.2 -> 4.5 Hz at top). Contact unchanged (0.6 DK, 0.45 s
    gate) but contactMin 0.35 -> 0.26 of top, so the threshold stays 2.8 tiles/s. moveBeast still sub-steps at 0.12 tiles.
  - Controls (Sports Car's layout): Dodge (Shift / Dodge button) = Drift; Jump = its own button above Drift
    (20b `vehBtns().j`, the car's exact positions) and J. `S.veh.noJumpBtn` is gone and 20b's `noJumpBtn` branch was
    removed (the car never set it, so its layout is unchanged).
  - Drift (TUNE.drift*): wind-up 0.07 / spin-burst 0.36 / recovery 0.17 s; burst 17 tiles/s eased off as the Dodge's
    along the stick, else the way it moves, else the heading; the stick bends it 5 rad/s; walls bounce it. Body spin =
    `beast.spin` (new field, added to the heading for drawing, anchors and the footprint; 0 outside a drift): one full
    turn plus the start offset (1 to 1.5 turns), ending square to the heading. 3.0 DK once per monster per drift within
    2.6 tiles (+0.85 m.r) of the centre's swept path, line of sight required, kb 7.5 (bosses: hitMon's x0.12; a boss
    hit also slows the burst). First strike: hit-stop 0.05 s (0.02 under Reduce Motion), shake + small flash (none under
    Reduce Motion). me.inv 0.38 s at the press. Cooldown 0.9 s from the press; a press in its last 0.2 s (or in the
    landing squash, or within 0.2 s of a touchdown while airborne) is kept, so drifts chain. No contact hit on a monster
    the claws struck until contactGate s after the drift ends. Strongs / Judgement pressed during the spin are queued.
  - Pose channels added (CH): `armLFling`, `armRFling` 0..1 (that arm flung out wide to its side, hand lifted),
    `bank` -1..1 (shoulders tipped; + lifts the right side and the flung arms swap high/low). Drift writes crouch,
    handsIn, torsoDip, bank, fling, armXReach, armXSlam (recovery slam), glow, charge, shudder.
  - Drift look: one faint motion ghost of the whole machine (baked headings reused; none on LOW), talon arcs from both
    hands (three streaks each, redrawn as true arcs round the centre between frames, faded near the rider), light-only
    spiral scratch marks on the floor (0.9 s), sparks flung along the spin, electric slashes between talon samples, a
    shockwave ring at the wind-up, three-line talon slashes and a ring on every monster struck (new pooled part kind 10),
    a two-hand slam with dust at the recovery. Pooled: claw samples <= 60 per hand, parts CAP 260, zaps capped at 24.
  - The rider: during a drift, one flat 2D roll through `drawPetAt`'s `o.rot`, as Sports Car's (exactly one turn, ending
    upright); otherwise upright. No yaw or 3D turn.
  - Jump: no cooldown (jumpCd 0); landing recovery 0.24 -> 0.05 s and a Jump goes through it; crouch 0.14 s (0.07 s for a
    hop taken within 0.2 s of a landing). A press in the air is kept (S.jumpLand) and fires on the touchdown frame; never a
    jump in mid-air. Planned safe landing and the landing hit unchanged (2.6 DK once per monster per landing). Take-off
    invulnerability 0.3 s, granted at most once per jumpInvLock 1.8 s (so a hop chain is not a permanent shield).
    A queued Strong or Judgement goes before a queued Jump.
  - Debug: `S.lastLand` {x, y, fb (1/2 = the planned spot had changed), x1, y1}; stats.drift / driftHit.
  - Cost (SwiftShader, 390x844 @1.5, machine draw = G.draw with minus without the machine): riding ~2.1-2.4 ms, mid-spin
    ~3.5 ms (the ghost), LOW mid-spin ~0.3 ms; whole update p50 2.5 ms, unchanged by Drift; 20-hop chain worst update
    frame 4-9 ms (planJump + landing fx; GC on SwiftShader).
  - Tests (scratchpad/beast/r2): logic5.js (B1's logic.js, Jump on J), drift.js (drift hits/spin/rider roll/buffer/mash,
    tunnelling at 60 and 20 fps, Strongs held, no drift in the air, 20-hop J-mash chain), smoke5.js, shot5.js, perf5.js.
- (Round 3, single worker, 2026-11-08; user: "Beast machine need to be able to destroy environmental objects aswell,
  trees, monuments etc, everything except doors and bridges connecting the lands together so that it can move around
  freely", then "Chest and shires should be destroyable aswell".) **This overrides the spec's "Do not permanently destroy
  terrain" for environmental objects** (walls, gaps and bridges, the actual terrain, still never change).
  - Shared helper: new `src/js/20k0v-vehicle-smash.js` (`VEH_SMASH.create(X, g)`, loads before 20k1 / 20k4p / 20k9i)
    holds the allowlist (`KINDS`), `PROTECT`, the pots, the `blk` passability check (X.blocked with smashable props open;
    mode 1 for the air), the swept `sweep`, `circle` / `oval` area smashes (never through a real wall: a mode-1 line from
    the machine, smashable props on the way don't stop it), the 0.14 s quiet rule, and `flowAt` (the flow field with a
    chain of smashable props counted reachable, for landing plans). Sports Car's `smashable` / `blk` / `smashSweep` now
    call it (same sweep, same order: props then pots; car behaviour unchanged apart from the wider list). Both still go
    through 20b's `X.carProps` hook (null on rift puzzle / trial / gate stages and Super Fiend floors).
  - Kinds: every environmental blocking prop the generators place (survey: genFloor over every Tower floor x3 seeds,
    every rift fight stage x4, drawn-stage legends, BIOMES lists): the Tower's 48 kinds, plus the rift lands' scatter and
    room-edge dressing (Garden, Dunes, Sepulchre, Aurora, Yuggoth, Library, Moon/castle, Basilica, Colours, Choir).
    Protected by name: `hourglass` (Sepulchre stage mechanic), `stairstub` (a stair), `eyeshrine` (shrine-like),
    `blank` (a drawn stage's wall); any unlisted kind blocks as before.
  - Chests and shrines (both vehicles): pots now include `chest`, opened through breakPot (full reward; a broken pot
    never pays again). 20b's hook gained `shrines()` / `smashShrine(s)`: an unused shrine gives its blessing through
    useShrine (as if walked onto), then is marked `used` + `broken` (not drawn, not walked onto again). No shrine has a
    cost or choice, none is a rift objective or counted by a floor rule; floor keys are neither pots nor shrines and are
    never touched. Shrine/pot smashes count in `stats.pots`.
  - Beast (20k9i): `S.vs`; `poseBlocked` / `moveBeast` use `S.vs.blk` (the first placement stays strict); ride, Drift
    and Jump planning (air and ground) pass through smashable props; `jumpReach` and `ctx.flowAt` use `S.vs.flowAt`.
    New ctx: `canDrive(x, y)`, `smashArea(x, y, r)`, `smashOval(cx, cy, rx, ry, ang)`. Body sweep each frame (in
    `moveBeast` and in `step`, ride/judge, z < 0.35): an oval (BODY + 0.1 / + 0.2) swept prev -> now plus the walking
    footprint's three circles against each prop tile, so no frame ends over an unbroken prop. Drift: `smashArea(R =
    driftR)` along the centre's swept path; Jump landing: `smashArea(jumpR)` (a timeout landing: the body only); smash
    fx: gold/blue sparks, bronze chips, a feathered ring, a short arc, light (fewer on LOW, no shake under Reduce Motion
    or for quiet chains). No damage, no Judgement charge.
  - 20k9j (Wrath): one guarded call `ctx.smashOval(...)` before each strike's hits. 20k9k (Judgement): planLanding uses
    `ctx.canDrive` when present; impact calls `ctx.smashArea(lx, ly, impR)` before its hit.
  - Cosmetic: 20u6 / 20zb2's ambient arcs and light threads skip broken props.
  - Tests: `scratchpad/beast/r3/props-beast.js` (Tower 21 forest, Tower 106 ruins, rift 2 Egg Orchard, rift 8 Inner
    Tide: ride / Drift / Jump / Wrath / Judgement through props, integrity, chests, shrines, bridge, protected kind,
    disabled stages); montage `scratchpad/beast/smash.png`.


- (FX worker, 2026-11-11; the user: "The stomping strong attack is too weak, make its AOE double add more lightning
  effects. Double its damage." `20k9j` only)
  - **AoE:** the oval's area is doubled: rx and ry × √2, from 1.1 × 1.7 to **1.56 × 2.4** tiles (3.4 × 2.2 → 4.8 × 3.1
    across × deep). It sits a little further ahead (`ahead` 1.8 → 2.2) so it still lies in front of the machine.
    `hitOval` and `smashOval` use the same numbers, so the light is still exactly the hit area.
  - **Damage:** `TUNE_S.wrath.dmg` 3.0 → **6.0** DK per strike, on top of the core's `TUNE.dmgK` × 2.
  - **Lightning:**
    - 4 / 5 / 6 branching bolts strike down out of the sky into the oval per strike, staggered over 0.22 s, each with a
      landing flash and sparks. They are drawn only; the strike's one hit per monster is unchanged.
    - Arcs crawl over the struck ground for 0.75 s (20/s, 10 on low).
    - 16 filaments (was 13) and 11 fractures (was 8) cover the larger oval.
    - A bigger white flash (screen flash 0.12 → 0.2), a larger glow, a floor shock ring across the oval and a stronger
      light.
  - Unchanged: strikes 1 / 2 / 3, the timing, the lock and turn, the exact 2 s cooldown from the final strike, and
    `ctx.alive()` stops everything.
  - **Cost** (SwiftShader, the strongs fx forced to raster, EVO 7, the median of 150 frames): before 6–9 ms, after
    about 20 ms. Most of the rise is the oval sprites covering twice the area. Untested on a device.
  - **Montage:** `scratchpad/fx/wrath.png` (before / after).
