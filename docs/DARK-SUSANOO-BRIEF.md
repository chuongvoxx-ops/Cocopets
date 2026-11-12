# Susano O: 12th Dark ult (four workers)

- **Spec:** the user's spec is in `docs/elem-spec/dark-susanoo.md`. Read all of it. It says "11th"; the user has since said
  "have it as the 12th", because Day of the Dead is the 11th.
- **Concept art:** `/mnt/user-data/attachments/78d1fddd-217b-590c-9262-fa063f90a263/45531e18-image.png`. It's the
  user's own design. Use it as a reference only and never copy it into the repo. Top half: robot form. Bottom half:
  "Dark Messiah" spacecraft form.
- **Roster:** the row already exists in `src/js/20k1-elem-core.js`:
  `['susanoo', 'Susano O', 'crescent', 100, 240, ...]`. It's the 12th Dark ult, and `ELEM_ULT_LV` has a 12th entry (85).
  Don't edit the row.

## Precedents to reuse (read them)
- **Beast Machine:** `20k9i` core and VEH, `20k9j`, `20k9k`, `docs/THUNDER-BEAST-BRIEF.md` with its Notes.
- **Nidhogg:** model `20k6f`, core `20k6g` (free flight, safe return, bake planning), `20k6h`, `20k6i` (beam and
  colossal explosion). Briefs: `docs/FIRE-NIDHOGG-BRIEF.md` and `docs/FIRE-NIDHOGG-GAMEPLAY-BRIEF.md`.
- **Sports Car:** `20k4p` and `20k4q`.
- **Shared code:** the VEH hooks in `src/js/20b-game-dungeon.js` and the shared smash helper
  `src/js/20k0v-vehicle-smash.js`. Smashing is optional here; the spec doesn't ask for it, so skip it unless it's free.

## "Crown of Rock"
- No skill has that exact name. The spec says to find it or report what's missing.
- The closest match is the Earth ult **Crystal Coronation** (`coronation`, in `src/js/20k2f-earth-ult-5.js`, plus
  possibly helpers in `20k2-elem-earth.js`): crowns of giant crystals erupting around monsters.
- Dark Spikes reuses Crystal Coronation's real geometry and eruption code through a parameterised Dark variant: glossy
  black obsidian, silver-purple highlights, violet fissures. Coronation's own look and behaviour must stay identical.
- In your report, state clearly that the match is "Crystal Coronation, assumed to be the intended Crown of Rock".

## Standing user rules
- **The pet** is drawn upright with its own sprite (`X.drawPetAt`). Never yaw or twist it. A flat 2D roll during spins
  is OK, as on Drift. Keep it visible in the cockpit.
- **Performance** (the user plays on an iPhone and a 2019 iMac):
  - Bake into cached sprites per heading and pose, lazily, in slices of 3 ms or less, on every browser. Safari has no
    `requestIdleCallback`; see how `20k6g` warms.
  - Drawing should normally stay at about 1.5–2 ms per frame or less, with no hitch over about 6–8 ms.
  - Pool particles.
  - Low effects reduce decoration only, never hits.
- **No motion-blur ghosts on vehicles.** The user removed them from Nidhogg for performance. Wingtip-style streaks and
  trails are fine.
- **Look:** feathered edges, light-only floor marks, and no hard-edged effect shapes (the user dislikes crisp rims).
  Effects never cover the pet, except that big finisher explosions may cover it, as Nidhogg's Ultima now does.
- **Model quality:** Beast Machine and Nidhogg are the bar (sphere-traced or ray-marched baked parts, real lighting and
  materials).
- **Git:** never commit, push or touch `test.html`. Each worker builds its own page with
  `python3 src/build.py --test-only test-sus<M|A|E|H>.html`.

## Roles and files
| Worker | Role | File(s) |
|---|---|---|
| **M**, model (built the Beast Machine and Nidhogg models) | `SUSANO_MODEL`: one persistent part set and rig for both forms, and every named pose | `src/js/20k5v-dark-susanoo-model.js` |
| **A**, animation and core (built Beast Machine's core and animation, and Nidhogg's core) | `U.susanoo`, the session, both forms' movement, HUD and menus, timers, Glides, Dive, the Transform choreography timing, attack pose clips, exit and restore | `src/js/20k5w-dark-ult-12.js`, plus small commented hooks in 20b, 12-arcade and tests |
| **E**, effects (built Catastrophe; also did Nidhogg's fire effects) | True Dark Blade, Dark Spikes (the Coronation Dark variant), Shockwave Pulsar, Dark Messiah (beam and explosion) | `src/js/20k5x-dark-susanoo-moves.js`, plus a minimal, commented parameterisation hook in `20k2f` if needed |
| **H**, helper (built Judgement Day and Nidhogg's Ultima) | Supports the others | See below |

H's jobs:
1. The Dark Messiah damage-supremacy audit (spec §12): a script that computes the full-cast per-target totals of every
   ult at matched tiers. Recommend Dark Messiah's explosion coefficient for a 1.25× lead and record the table in Notes.
2. The verification suite: a logic test covering the spec's §14 list (`tests/susanoo.js`).
3. The robot's basic sword swing, if the game routes basic attacks.
4. Anything else the other three ask for in Notes.

H edits only its own test and tool files, plus whatever files the others explicitly hand over in Notes.

## Contract (A builds `ctx`; M exports the model; E adds moves)
- **Model API (M)**, following the Nidhogg model's API:
  - `SUSANO_MODEL.create`, `warm(ms)`, `warmPlan`, `draw(c, x, y, z, heading, pose, o)`, `drawShadow` (soft and
    blurred), `anchor(name)`, `blankPose`, `relax`.
  - Pose channels:
    - transformation: `form` (0 = robot, 1 = airship); `xf` (0..1 progress through the ordered transformation, with
      named stage boundaries exported as `XF_STAGES`), or explicit per-stage channels;
    - robot body: gait and lean, bank, crouch, torso pitch;
    - sword: `sword` hold presets (rest, one-hand sweep, two-hand overhead, two-hand point-down) plus a 0..1 progress
      for each;
    - wings and thrusters: wing fold/spread, thrust;
    - cockpit and glow: cockpit cradle counter-rotation (automatic), `glow`, `channel` (the sword channel's violet
      intensity), `charge`.
  - Anchors: `swordTip`, `swordChannel`, `swordEdgeA`/`B` (for trails), the hilt and hands, `cockpit`, `seat`, the
    thrusters (L/R), the wing roots, `helm`, `feet`.
- **Moves API (E):**
  ```js
  const SM = (self.SUSANOO_MOVES = self.SUSANOO_MOVES || {});
  ```
  - `SM.darkBlade(ctx)`, `SM.darkSpikes(ctx)`, `SM.pulsar(ctx)`, `SM.messiah(ctx)`, `SM.TUNE`, `SM.warm(ms)`.
  - Each calls `ctx.done()` when finished and checks `ctx.alive()` at every step.
  - E drives the attack poses through `ctx.pose` channels (or A's pose-clip helpers; A documents them in Notes).
- **ctx (A)**, mirroring Nidhogg's and documented in Notes:
  - Basics: `X`, `C`, `H`, `evo`, `tier`, `DK`.
  - Damage: `hit` (the only damage path; it returns effective damage and charges the shared meter unless `noCharge`),
    `hitArea`, `hitOval`.
  - Targeting and terrain: `target`, `aimPoint`, `mons`, `groundAt`, `canStand`, `nearestLand`.
  - The vehicle: `vehicle` (x, y, z, heading, pose, form, locked), `anchor`, `scr`, `camera`.
  - Lifecycle: `done`, `alive`, `safeReturn`.
  - `ctx.messiah` is true while the finisher runs. `alive()` stays true through a committed Dark Messiah, even on a won
    floor, with a cap.

## Timings and controls (from the spec)
- **Session:**
  - **Robot:** 35 s, then **Transform**, a finite fold with input locked.
  - **Airship:** a fresh 20 s.
  - **Ending:** Dark Messiah, or a safe timeout exit.
  - **Cooldown:** 240 s, starting once at final exit.
- **Movement:** robot movement ×1.35 through the stat system, applied once and removed once.
- **Robot menu:**
  - Glides (Dodge)
  - True Dark Blade
  - Dark Spikes
  - Transform (Ult; a secondary indicator for Dark Messiah charge may show)
- **Airship menu:**
  - Dive (Dodge)
  - Shockwave Pulsar, the only Strong; the second Strong button collapses and its key binding is disabled
  - Dark Messiah (Ult), once the meter is full; it needs a fresh press after Transform
- **Charge:** one shared meter, filled from all damage dealt in both forms. Transform doesn't need or use the meter.
- **Unspecified numbers:** pick configurable values and report them.
  - Glides/Dive start from the dodge cadence.
  - Suggested starting points:
    - Glides: about 3 DK swept, once per enemy.
    - True Dark Blade: a wave of about 4 DK, once per enemy; cooldown about 2.5 s.
    - Dark Spikes: an eruption of about 2.5 DK plus a burst of about 3 DK, once per enemy per phase; cooldown about 3.5 s.
    - Dive: about 3 DK.
    - Pulsar: about 5 DK in radius 2.8; cooldown about 2 s.
    - Dark Messiah: as set by H's audit.

## Checks
- `ELEM=dark ONLY=susanoo EVO=1|4|7 HTML=<page> node tests/elem-moves.js`. A adapts the harness: robot attacks,
  Transform, then airship attacks, then Dark Messiah if the meter is full, else timeout.
- `tests/susanoo.js` (H).
- Regression: Beast Machine, Nidhogg, Sports Car and Day of the Dead at EVO 4; smoke; `tests/joystick.js`; the
  Crystal Coronation move test (`ELEM=earth ONLY=coronation`) to prove Earth is unchanged.
- Montages go in `/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/susanoo/`:
  - M: `model.png`, with the concept side by side, and `xform.png`, the transformation stages from several views
  - A: `core.png` and `transform.gif`
  - E: `moves.png` and `messiah.gif`
  - H: the audit table
- Append dated Notes below whenever the contract changes. Report concisely.

## Notes
- (A, 2026-11-12) **The core is in `src/js/20k5w-dark-ult-12.js`.** It runs on a painted stand-in model until
  `SUSANO_MODEL` exists; the real one is picked up automatically.
  - **What A calls on the model (M):**
    - `create({ T, dpr })` → `{ pose }`
    - `warm(ms)` (true when done) and `warmIdle(T, dpr)`
    - `draw(c, x, y, z, heading, pose, o)` with `o = { T, sx, sy, t, low, scale, pet(c, X, Y) }`. As in Nidhogg, the
      model calls `o.pet` at the seat; A draws the pet there upright.
    - `drawShadow(c, x, y, z, heading, pose, o)`
    - `anchor(name)` → world `{ x, y, z }`, for the last drawn frame
    - optional: `XF_STAGES` (names) and `XF_BOUNDS` (an array of length+1 with xf at each stage's start; default equal)
  - **Pose channels A writes each frame** (M reads them):
    - Transformation: `form` (0 robot, 1 airship; set to 1 only at the handover), `xf` (0..1), `stage` (name),
      `stageU` (0..1), `assemble` (0..1 through the summon), `alpha`.
    - Robot body: `gait` (a phase, it grows), `lean` (0..0.6, into acceleration), `bank` (±0.7), `crouch` (0..0.7),
      `pitch` (torso, ±0.4).
    - Sword: `sword` ('rest' | 'sweep' | 'overhead' | 'pointDown') and `swordU` (0..1 through that hold).
    - Wings, thrust and glow: `wing` (0 folded .. 1 spread), `thrust` (0..1), `glow`, `channel` (the sword channel's
      violet, 0..1), `charge` (0..1), `recoil` (from E).
    - Airship: `roll` (radians about the long axis, Dive's roll), `bank`, `pitch`.
  - **Transform stages** (s, `TUNE.xfStages`, 3.2 s in all): prepare 0.32, dock 0.34, clear 0.26, pitch 0.36, stow 0.32,
    wings 0.36, booms 0.32, thrusters 0.30, latch 0.26, establish 0.36. The robot rises to cruise height over the first
    four stages. `xf` is linear through the stages (or through M's `XF_BOUNDS`).
  - **Anchors A uses:** `seat` (via `o.pet`), `swordTip` and `swordChannel` (or `hilt`) for the Glides trail. E uses
    whichever anchors it needs.
  - **ctx (for E and H):**
    - Basics: `X`, `H`, `C`, `evo`, `tier`, `DK`, `CLIPS`, `poseObj` (the pose).
    - Damage: `hit(m, dmg, o)` returns effective damage and charges the meter unless `noCharge`.
      `hitArea(x, y, r, dmg, o)` and `hitOval(cx, cy, rx, ry, ang, dmg, o)` take `o.once`: any object whose hit set
      spans calls, so an enemy is hit once per activation.
    - Targeting and terrain: `target()`, `aimPoint()`, `aimDir()`, `stick()`, `mons()`, `groundAt`, `canStand`,
      `nearestLand`.
    - The vehicle: `vehicle` (the live `{ x, y, z, heading, pose, form 0|1, locked }`), `form` ('robot' | 'xform' |
      'air'), `anchor(name)`, `scr`, `T`, `camera({ zoom, x, y, k, shake })` (`null` resets it).
    - Lifecycle: `done()`, `alive()`, `safeReturn()`, `messiah` (true while it runs). `alive()` stays true through a
      committed Dark Messiah, even on a won floor, for up to 16 s.
    - Poses: `pose(name, u, extra)`, E's named poses mapped onto A's clips: `overhead` 0..0.5, `overheadSlam`
      0.5..0.62, `pointDown` 0..0.35, `pointDownPlunge` 0.35..0.6, `pulsarAim` 0..0.5, `pulsarFire` 0.5..1, `messiah`
      0..0.6, `messiahFire` 0.6..0.85, `sweep`, `rest`. The `extra` channels are written after. `clip(name, u)` runs a
      whole clip (`sweep` / `overhead` / `impale` / `pulsar` / `messiah`); each clip has `hit` and `rec`, the u of its
      strike and of its recovery.
    - While Shockwave Pulsar is busy, A follows `vehicle.heading` as E aims it, and keeps the ship's travel.
  - **Rules as built:**
    - Movement: `X.mvMod('susanoo', 1.35)` is set when the robot can move and cleared once at the final exit. A new 20b
      hook gives keyed movement modifiers inside the stat speed, and `VEH.drive(mx, my, dt, spd)` now passes that speed.
      The robot glides at that speed; the airship flies at it × `TUNE.airK` 1.75.
    - Timers: the robot gets exactly 35 s and the airship exactly 20 s. At expiry a running action is cut, its later
      hits are dropped, and the pet is set down safely.
    - Transform: pressed during a Glide or Strong, it waits for the recovery. A request not yet committed when the robot
      timer runs out loses to the timeout.
    - Fresh presses: the Ult needs a fresh press (a gap of 0.28 s or more since the previous press) both for Transform
      and for Dark Messiah, and Dark Messiah also waits 0.28 s after the handover. After the handover each Strong needs
      a release and a fresh press.
    - Glides and Dive share one cooldown: the game's dodge cadence, 0.85 s (× its arcane / dodgeK modifiers), after the
      recovery.
    - Cooldowns from the press: True Dark Blade 2.5 s, Dark Spikes 3.5 s, Pulsar 2 s.
    - Meter: `TUNE.chargeK` 32 (full at 32 × DK dealt).
    - Glides: 0.1 s prep + 0.42 s spinning sweep over 5.2 tiles, steerable at 2.2 rad/s; sword reach 2.7; 3 × DK, once
      per enemy.
    - Dive: 0.24 s roll + 0.3 s swoop + 0.14 s low pass + 0.38 s climb; 3 × DK in r 2.4, once per enemy. It targets an
      enemy near the aim line, else ground along it, else the nearest enemy. With none of those it shows an invalid
      marker and stays in flight.
- (H, 2026-11-12, Dark Messiah damage audit (spec §12); for E) `tests/ult-damage-rank.js` measures one complete cast of
  every Ultimate in the real game against one neutral target ('blob', HP 1e9, no armour or guard, rooted, 3 tiles out,
  fresh floor every cast), same pet for all (a neutral signature twist), ability star 6, mult 1.2, tier 1, evo 1/4/7,
  no crits (the roll is suppressed), all ticks, multi-hits and finite DoTs counted until 2 s of quiet. Vehicles compare
  their FINISHER only (Supernova, Judgement Day, Ultima, Dark Messiah); a whole session is player-dependent, not ranked.
  Leaders are re-cast 3 more times and averaged; DK = base x (1 + 0.08 (evo-1)).
  | evo | 1st | 2nd | 3rd | Dark Messiah now (blast 40 DK) |
  |---|---|---|---|---|
  | 1 | Titan 90.5 DK (max 96) | Supernova 89.0 (max 103.9) | Annihilation 24-38 | 40 DK, 3rd |
  | 4 | Supernova 132.8 (max 138.2) | Titan 103.2 (max 106.6) | Flower Hurricane 40.9 | 40 DK, 4th |
  | 7 | Supernova 144.4 (max 164.9) | Titan 106.4 (max 114.3) | Flower Hurricane 44.0 | 40 DK, 4th |
  (Sports Car's hits are x2 since today's user change, `TUNE.dmgK`; Judgement Day is 32-40 DK, Nidhogg's Ultima 17-20 DK.)
  **Recommendation:** Dark Messiah's one final explosion = **[130, 175, 210] DK by tier** (evo 1-3 / 4-6 / 7), i.e.
  `TUNE.messiah.blast` per tier, keeping the single hit per enemy and no beam damage. That is 1.25x the strongest
  single run measured (Supernova's max) at every tier (1.44x / 1.32x / 1.45x its mean). A flat value would need
  210 DK. Recheck with `HTML=<page> node tests/ult-damage-rank.js` (it fails unless Dark Messiah ranks first at
  every evo); quick: `ONLY=sportscar,titan,susanoo`. Not ranked: Thriller (echoes normal attacks), Day of the Dead
  (needs a downed ally), and support Ultimates that deal nothing to a lone target (Salvation, Love Sanctuary, Rhapsody,
  Winds of Oblivion, Flash, ...). Raw table: scratchpad `susanoo/audit.json`.
- (H, 2026-11-12) `tests/susanoo.js`: 41 logic checks of §14 on the real game (roster, x1.35 once, 35 s / fresh 20 s,
  menus via drawBtns labels, Strong 2 dead in the airship, hammered Ult never chains, one hit per enemy for Glides /
  Blade / Dive / Messiah, Spikes at most once per phase, shared meter, cooldown 240 s once at exit, timeouts in Glides /
  Dive / mid-fold, expiry boundary, Messiah near expiry, defeat, cleanup). All pass at evo 4 on A's and E's current files.

### M, 2026-11-12: the model API (`SUSANO_MODEL`, `src/js/20k5v-dark-susanoo-model.js`); stable from now on
- **Test hook:** test builds expose `__pp.susano`, which is `SUSANO_MODEL` itself.
- **How it's built:**
  - One persistent set of rigid parts and one rig for both forms.
  - The parts are sphere-traced into sprites, Beast/Nidhogg-style, and baked lazily **per view**: the camera's
    direction in each part's own frame.
  - That way every orientation the transformation reaches can be drawn.
  - The nearest baked view is fitted onto the true projection by a least-squares affine.
- **Coordinates:**
  - **Model frame:** x forward, y right, z up.
  - **Origin:** the robot's ground point.
  - **`draw(c, x, y, z, heading, pose, o)`:** x and y are game tiles; z is the model origin's altitude in tiles; the
    heading is the map angle `(cos a, sin a)`.
  - **Robot:** draw it with `z = 0`. It hovers about 0.12 above the floor by itself.
  - **Airship (and from `xf` ≈ 0.1):** the model lifts itself by 1.35, so the hull's centre sits at `z + 3.05`. Pass
    a negative z to bring it lower, for example in the Dive's low pass.
  - **The heading never flips:** the robot faces it; the airship's nose points along it. The transformation turns the
    body about mid-air, so the head leads.
- **`o`:** `{ T, sx, sy, t, scale, low, pet(c, X, Y) }`.
  - `T`, `sx`, `sy` are the game's tile size and world-to-screen functions.
  - `scale` is the drawn size; 1 is about 3.7 tiles tall without the wings.
  - `pet` is called **last**, at the cockpit seat, already upright. Draw the pet there with
    `X.drawPetAt(c, X, Y, { maxH: 0.62 * scale })`.
- **`drawShadow(c, x, y, z, heading, pose, o)`:** a soft, blurred blob shadow on the floor layer. Pass the same `z`.
- **Baking:**
  - **`setScale(T * dpr * scale)`:** call it once (or use `create({ T, dpr, scale })`).
  - **`warm(ms)`:** a slice; it never starts a step that would overrun. Returns true when the queue is empty.
  - **`warmIdle(T, dpr)`:** uses `requestIdleCallback` where it exists, otherwise `setTimeout`, so it works on Safari.
  - **`warmPlan({ form: 'robot' | 'airship' | 'xform' | 'all', heading })`:**
    - It orders the queue: quick half-size pictures of the base pose at every heading first, then sharp ones nearest
      the heading, then attack holds, banks and the Dive's roll.
    - `'xform'` adds every view the transformation passes through at that heading (±1 bucket).
    - Call it on form or bucket changes, not every frame. It returns `{ pending, total }`.
  - **`ready(form, heading, sharp?)`:** true once every part of that form's base pose can be drawn at that heading.
  - **During the robot phase, call `warmPlan({ form: 'airship' })` and `warmPlan({ form: 'xform', heading })`** so the
    fold never waits on a bake.
  - Draw-time misses are queued at the front automatically, and the nearest baked view stands in meanwhile.
- **Pose:** `blankPose()` returns `{ form, xf, assemble, alpha, gait, gaitAmp, lean, bank, crouch, pitch, twist, roll,
  sword, swordU, swordK, wingSpread, wingFold, thrust, glow, channel, charge }`. `relax(P, dt)` eases the body
  channels back to neutral.
  - **Form:**
    - `form`: 0 robot, 1 airship. Setting it to 1 forces the complete airship.
    - `xf`: 0..1 progress through the ordered transformation. `XF_STAGES` lists the stages
      (`lift, dock, open, pitch, stow, wings, booms, thrust, close, level`), each as `[from, to]` in `xf`.
    - `POSES` names the poses as `xf` values: `robot` 0, `clearance` .33, `pitched` .5, `stowed` .57, `winged` .69,
      `boomed` .77, `thrusted` .87, `airship` 1.
  - **Summon:** `assemble` 0..1. The cockpit rises first, then the frame, limbs, armour, wings and helmet; the sword
    comes last.
  - **Robot body:**
    - `lean` (forward), `bank` (roll into turns), `crouch`, `pitch` (torso bend), `twist` (torso yaw), all about -1..1.
    - `gait` (phase, radians) and `gaitAmp` (0..1) give a gentle floating stride.
  - **Airship:** `bank` (roll), `pitch` (nose; + is down), `roll` (radians; the Dive's barrel roll).
  - **Sword** (the model owns the hands, so they always sit on their grips):
    - `sword`: `'rest'` (a low two-handed guard), `'sweep'` (one hand; Glides and the basic swing; it folds the wings
      out of the way), `'overhead'` (two hands; True Dark Blade), or `'down'` (two hands, point down; Dark Spikes).
    - `swordU` 0..1: progress through the hold. `overhead` goes from raised to slammed, with the tip at the floor
      from about 0.85. `down` goes from the point at the floor to driven about 0.8 deep.
    - `swordK` 0..1: blend from `rest` into the hold.
    - Each hold includes its own torso bend, twist and crouch.
  - **Wings and engines:** `wingSpread` 0..1, `wingFold` 0..1, `thrust` 0..1 (exhaust).
  - **Glow:** `glow` (cores, eyes and seams), `channel` (the sword's violet channel), `charge` (a charge gathering at
    the sword's point; use it for the Pulsar and Messiah focus).
  - The cockpit cradle counter-rotates automatically, and the pet is always drawn upright.
- **Anchors:** `anchor(name)` returns world `{x, y, z}` for the last draw, on the parts as drawn; y is the game's
  ground y.
  - Names: `swordTip`, `swordBase`, `swordChannel` (mid-channel), `swordEdgeA`/`B` (the two edges near the tip, for
    trails), `hilt`, `handL`/`handR`, `cockpit`, `seat`, `thrusterL`/`R` (nozzle exits), `wingRootL`/`R`, `helm`,
    `feet`, `footL`/`R`, `center`, `pivot`.
  - `anchorDir(name)` gives a unit direction: `swordDir`, `swordFlat`, `thrusterDirL`/`R`, `up`, `forward`.
- **Debug:**
  - `rig(P, t)` returns the parts and anchors in the model frame.
  - `clearance(P)` returns `{ min, a, b, reachShort, floor }`: the closest approach of unjoined parts, in sphere
    approximation.
  - `SWORD` (the sword's grip, base and tip lengths), `VIEW`, and `__dbg`.
- (A, 2026-11-12, later) **A now draws with M's `SUSANO_MODEL`, mapped onto its channels.**
  - `wingSpread` = A's `wing`, with `wingFold` 0.
  - `gaitAmp` comes from the robot's speed.
  - The point-down hold is M's `'down'`.
  - `xf` runs linearly over A's 3.2 s of timed stages. M's `XF_STAGES` are ranges of `xf`, so M's own order and overlaps
    hold. `form` becomes 1 at the handover.
  - `warmPlan` runs at the cast (`robot` + `xform`), at the Transform commit (`xform` + `airship`) and in the floor-start
    warm-up (`all`).
  - Bake budgets per frame: summon 5 ms, fold 3 ms, otherwise 1 ms. The warm-up runs one slice after each frame on every
    browser.
- (E, 2026-11-12) **The moves are in `src/js/20k5x-dark-susanoo-moves.js` (`SUSANOO_MOVES`).**
  - **API:** `darkBlade(ctx)`, `darkSpikes(ctx)`, `pulsar(ctx)`, `messiah(ctx)`, `TUNE`, `warm(ms[, ctx])` (true when
    every sprite is baked; with a ctx, or the ctx last seen by `update`, it also prewarms the obsidian spires at the
    robot's screen size), `update(ctx, dt)` (only remembers the ctx). Each move calls `ctx.done()` once, checks
    `ctx.alive()` every frame, and poses through `ctx.pose(name, u, extra)` (`overhead`/`overheadSlam`, `pointDown`/
    `pointDownPlunge`, `pulsarAim`/`pulsarFire`, `messiah`/`messiahFire`, `rest`). Anchors used: `swordTip`,
    `swordChannel`, `cockpit`, `thrusterL/R`, `wingRootL/R`. Damage only through `ctx.hit`.
  - **Numbers (`TUNE`, x DK):** Blade 4.0 once per enemy (the slam's impact r 1.3 shares the set), wave 7/8/9 tiles at
    9 tiles/s, 4.6/5.6/6.6 wide. Spikes 2.5 eruption + 3.0 burst, each once per enemy. Pulsar 5.0 in r 2.8/3.0/3.2,
    once per enemy, nothing on invalid ground. Messiah: **130 / 175 / 210 DK** by tier, once per enemy as the
    shockfront (R 7/7.5/8) reaches it, `noCharge`; the beam deals nothing. `safeReturn()` then `done()`;
    `ctx.messiahPlan = { x, y, R, blast }` is readable for tests.
  - **Dark Spikes reuses Crystal Coronation** (assumed to be the spec's "Crown of Rock"). Hooks, all optional and
    commented; Earth's own cast passes none and is unchanged:
    - `20k2e`: `clusterGen(..., pal)` and `glowCanvas(..., pal)` take a palette (`cry`, `rock`, `inner`, `glow`, ...).
    - `20k2f`: `U.coronation(C, H, V)` takes `V` = `{ pal, timeK, oneHit, crownDmg, finDmg, hit, alive, banner,
      fis, crk, band, dust, warm, mote, puff, petAt, petDim }`; `U.coronation.prewarm(Spx, ev, ncr, pal, ms)`.
    - Proof: `ELEM=earth ONLY=coronation EVO=1/4/7` passes on old and new files, and a seeded cast gives identical
      per-hit damage at every evo (timing jitter matches the original's own run-to-run noise).
  - **Pet:** bright effects ease off softly near the cockpit; Coronation's spires in front of the cockpit fade (petDim
    0.85). Only the Messiah explosion covers the pet.
  - **Cost:** big soft layers (Messiah's beam glow, explosion, telegraph, large smoke) draw into one 1/3-size buffer per
    layer, blitted once over the touched area.
- (M, 2026-11-12, later) **API additions, matched to A's names:**
  - `XF_BOUNDS` is the start of each of M's ten stages in `xf`, in order, plus 1. A's timed stages map onto it with
    `xf = lerp(B[i], B[i+1], stageU)`.
  - The `sword` holds also accept `'pointDown'` and `'impale'` (same as `'down'`).
  - `wing` is read as `wingSpread` when `wingSpread` is unset.
  - `recoil` 0..1 adds a torso kick back and a small crouch.
  - Hands are axis parts (keyed round the grip), so the sword holds add no new views to bake.
- (A, 2026-11-12, for H and the coordinator) **Phase timers now run on the game clock** (`g.t`), with deadlines set when
  the robot can move and at the handover.
  - Why: a hit-stop pauses the core's step but not `g.t`, so a timer counted in steps ran over by the hit-stops. That is
    the airship lasting 20.13 s at EVO 1; the robot overran by 0.18 s once the same way.
  - The test was right. Hit-stops now count against the 35 s and the 20 s; `stats.robotT` / `airT` still sum the
    stepped time.
  - Dive aim: the cone is 0.6 rad, then a second look at 1.0 rad within 6 tiles, before it falls back to ground. A
    keyboard aims in 45° steps.
  - E's anchor rename (`wingRootL` / `wingRootR`) needs nothing from A: the core uses only `seat`, `swordTip` and
    `swordChannel`.
- (M, 2026-11-12, end of round) **Model status: robot, airship and the full transformation are in, and the API is
  unchanged.**
  - **Size:** the model now draws at a built-in `VIS` of 1.3 (exported), on top of `o.scale`.
    - The robot is about 4.8 tiles tall, or about 9 tiles across the wings.
    - The transformation lifts the body 1.75 tiles. The airship's hull centre is at `z + 3.97`.
    - Anchors include `VIS`; `setScale` applies it too, so keep passing `T * dpr * scale`.
    - Same camera, the robot is now clearly larger than Beast Machine; see `model.png`.
  - **Collision:** checked with `clearance(P)` in sphere approximation over `xf` 0..1 at 81 steps, and over every
    sword hold.
    - The worst graze is 0.09 tiles: the cradle clamping the blade beside the gripping hand. The rest are under 0.05.
    - The hands' reach shortfall is 0 except `down` at u = 0, which is short by 0.02.
  - **Design choices:**
    - The pods ride rail arms from the upper back, through a clearance pose behind the drums, then swing outboard and
      aft.
    - They dock level with the wing plane, outboard of the folded booms: the dorsal side can't be reached without
      crossing the arms.
    - The sword is carried over the right shoulder (the left hand lets go and regrips) into a cradle on the back. The
      back becomes the airship's underside, so the sword ends beneath the hull and projects ahead as the prow.
    - The skirt hinges up and rides its waist ring to the front, then lowers over the rear as the dorsal cowling.
  - **Bake** (desktop, in-game scale):
    - Planning `robot` + `airship` + `xform` is about 850 views and 10 MB.
    - Robot base views are drawable after about 5 s of idle CPU; everything completes in roughly 40–60 s of idle time.
    - Steps yield every 0.5 ms. Long slices seen headless (10–40 ms, occasionally more) are garbage-collection or
      canvas stalls, as with Nidhogg.
    - Banks and the Dive's roll are not pre-planned: they draw from the nearest baked view and bake lazily.
  - **Draw:** medians of 0.4 ms for the model and 0.5 ms for the soft shadow per frame. The p95 is about 10 ms in
    headless SwiftShader only.
- (H, 2026-11-12, the robot's basic sword swing, spec §4 last paragraph; handed over by A) In `20k5w`:
  `TUNE.swing = { dur 0.3, hit window u 0.2..0.62, reach 2.4, arc 2.3 rad, dmg 0.8 DK, kb 1.5 }`, `VEH.basic(A)` →
  `trySwing` (robot phase only; refused during Glides, a Strong, Transform, the airship, Messiah or exit) and `stepSwing`
  (M's one-hand `sweep` hold through `CLIPS.sweep`, the heading eased into the cut, Glides' edge trail via `pushTrail`,
  one `ctx.hit` per enemy per swing, so it charges the meter; `S.stats.swings`, `S.stats.swingHit`). Cleared by
  `startOut` and `commitXform`. In 20b, one commented line in `tryFire`: with a vehicle on, `VEH.basic(A)` is asked
  and, when it swings, `g.normalT = normalRate()` (the pet's own attack cadence); vehicles without `basic` keep
  "no ordinary attacks". The airship has no `basic` weapon (the call returns false outside the robot phase).
- (A, 2026-11-12, round 2: the user asked for livelier, wilder, more fluid animation) **The core now animates
  through one layer, `animate()`.** Each frame it builds targets and springs every pose channel to them, each with its
  own stiffness and damping:
  - The torso leads (lean, bank, pitch, twist, crouch).
  - The sword's progress follows.
  - The fans lag and sway (`wingSpread` / `wingFold`).
  - Impacts and locks jolt the springs.
  - Thrust flickers with acceleration.
  - A whole-body yaw (`yawOff`) and rise (`zOff`) are added to the heading and z that A passes to `draw` and
    `drawShadow`. That is how the hips turn with a cut and how the robot rises in a wind-up.
  - Layers:
    - Base: a breathing idle with a weight shift and fan breathing, a glide that leans and pitches with acceleration
      and banks into turns (the gait's phase and `gaitAmp` follow speed), and an airship with inertia.
    - Action: one clip at a time.
    - Secondary: the spring overshoot and the kicks.
  - **Clips**, each with anticipation, a fast eased strike, overshoot and follow-through:
    - `basic`: alternating right and left cuts. `swordU` runs forward or reversed along M's `sweep`, with ±0.75 twist
      and ±0.7 yaw. `TUNE.swing.dur` is now 0.44 s and the hits fall over u 0.38..0.72.
    - `sweep` (Glides): wind-up, lean out, then a stagger.
    - `overhead` (True Dark Blade): dip, arch and rise of 0.75, smash, impact kick and shake.
    - `impale` (Dark Spikes): lift high, plunge, then a planted strain with a tremor.
    - `pulsar`: nose lift, drive, then the recoil kick.
    - `messiah`: rise and pitch, then a tremor under the beam.
    - Dive: a full roll with overshoot, the nose dropping into the swoop, and an overshoot on the pull-up.
    - The fold's `xf` is eased per stage: back-out at the locks (dock, thrusters, latch), in-out on the turns (pitch,
      stow, wings, booms). Each lock jolts the springs.
  - **How E's poses are used:** `ctx.pose(name, u, extra)` records the pose and A plays it on the next frame.
    `overheadSlam` and `pointDownPlunge` held at 1 run the clip's recovery, driven from E's `recoil` / `channel`.
  - **For M (optional; A uses them if present, nothing breaks if not):**
    - `legSwing` (−1..1): the thighs swing back and fore with momentum, so the legs can trail in the glide.
    - `wingSwayL` / `wingSwayR` (radians): a per-fan lag on turns.
    - `hipYaw`: so the pelvis can turn separately from the whole-body yaw.
    - A wider `sweep` path (`swordArc` > 1, scaling the hold's arc), for even bigger cuts.

### M — round 2 (2026-11-12): bulk-up, hatch, metal

The API, channel names, anchors and stages are all unchanged. Additions and changed numbers:

- **New channel `hatch` (0..1; 0 = open, 1 = shut).** A gold-framed, heart-shaped chest shield on a hinge over the cockpit.
  - If A leaves it `null` or unset, it follows `assemble`: it closes over `assemble` 0.82→1, so the end of the summon seals the pet in.
  - At dismiss, A should drive `pose.hatch` from 1 to 0 before the parts scatter, so the pet is seen leaving.
  - Once `hatch` ≥ 0.98 the model does not call `o.pet`, so the pet is not drawn at all. Below that the pet is drawn and the hatch is drawn over it.
  - In the airship the hatch stays shut (it rides the torso).
  - The `seat` anchor and the pet's logical position are unchanged.
- **`VIS` is 1.3 → 1.45.** The robot is bigger on screen. Anchors include it automatically. A's hit radii in tiles may want about +10%.
- **Bulk.** Thicker upper arms, gauntlets with four flaring ring plates, a fist at 1.75×, thighs with three lames and geared knee disks, heavy shins with crimson plates, feet at 1.45×, a wider pelvis with hips at y ±0.4, layered pauldrons with gold crest ridges, and domed pectorals.
- **Shading.** Obsidian and enamel have a clear-coat (Fresnel env plus a sharp specular), panel seams with bevels and rivets, and edge wear in silver. Violet is only in seams, vents and cores.
- **Paths.**
  - The `sweep` follow-through runs further forward, so the right forearm clears the chest.
  - The carry's elbow pole leads forward, and the high `DOCK` waypoint is now `[0.4, 0.3, 1.95]`.
  - The pods lift higher to clear, swing wider, and dock further outboard (y ±1.18) beside the folded legs.
- **Clearance after the bulk-up.** The worst is −0.11 (sphere approximation) at xf ≈ 0.81: a thin boom rail grazes a forearm for a moment. The sword holds are all ≥ −0.03.
- **Cost at T = 41, dpr 1.5, k 88.**
  - Robot, airship and xform together are about 910 views and 14 MB.
  - Draw median is 0.4 ms, plus 0.6 ms for the shadow.
  - Median slice is 1.8 ms. The headless p99 is the same as round 1.
- **A's optional channels are supported (2026-11-12).** All are in `CH` and `blankPose`, and `relax` eases them to 0.
  - `legSwing` (−1..1): negative trails the feet back up to 0.38 and lifts them by 0.2; positive brings them forward by 0.16. Forward is suppressed during the `down` / `impale` plunge, so the feet stay off the blade. Robot only.
  - `wingSwayL` / `wingSwayR` (radians, clamped to ±0.6): each blade of that fan rotates in its plane by sway × (0.45 + 0.1·i), so the outer blades lag most. Halved in the airship.
  - `hipYaw` (radians, clamped to ±0.4): the pelvis, skirt and leg roots turn against the torso while the feet stay planted. Robot only.
  - `swordArc` (default 1, 0.5..1.6): scales the `sweep` path's angle and radius. The wind-up is capped at 1.2 and the follow-through at 1.08, so the forearm never cuts through the chest.
  - Hand grips were re-checked over every hold × u × swordArc × hipYaw × legSwing: the reach shortfall is ≤ 0.03 everywhere. The worst clearance is about −0.1 (a forearm brushing a thigh at hipYaw 0.4 in `rest`).

### M — round 3 (2026-11-12): live WebGL rendering

The user asked for it to be "drawn on the GPU". Susano O is now a real rigged 3D model, rendered live every frame. There is no per-view baking on the GL path.

**The API is unchanged.**
- `draw(c, x, y, z, heading, pose, o)`, `drawShadow`, `anchor`, `anchorDir`, every pose channel, `XF_STAGES`, `POSES`, the holds and the hatch all behave as before.
- The draw order inside `draw` is unchanged: the body, then the 2D plumes and glows, then the pet (only while the hatch is open), then the hatch.
- A and E don't need to change anything.

**New file `src/js/20k5uz-gl-mesh.js` (`GLM`).** It loads before the model. It is a small WebGL renderer with no library:
- WebGL2 where available, else WebGL1;
- a procedural mesh builder: bevelled boxes, ellipsoids and domes, tubes, tori (with gear teeth), lathes, extruded outlines and swept surfaces;
- one material per triangle;
- a physically based shader:
  - metal and roughness per material;
  - a clear-coat on the obsidian and enamel;
  - a key light, a violet rim and a studio environment;
  - procedural panel seams and rivets, gold filigree, brushed and scratched metal, braided rope, the grip wrap, the blade engraving, the hatch filigree;
  - emissive violet;
- context-loss and restore handling.

**The model** (`20k5v`) builds every part as a mesh at first use, in about 50–100 ms of CPU on desktop.
- The meshes reuse each part's shape frame and dimensions, and the existing rig drives them, so the transformation is continuous.
- Each frame, the posed parts render into one offscreen WebGL canvas sized to the model's bounds on screen (device pixels, capped at 1600), which is then drawn into the game canvas with `drawImage`.
- 34k triangles in the meshes, about 51k drawn (instanced parts such as the 14 blades); 44 draw calls a frame.
- The low-effects setting builds the meshes at lower detail.

**Fallback.** If there is no WebGL, the context is lost, or the renderer is a software rasteriser (no usable GPU), the old sprite path draws instead.
- The sprite path now never mixes views. If a part's view is missing, it is baked within a per-frame cap. Failing that, the whole model is drawn at the nearest heading where every part is ready, or the last complete frame is held.
- On a restored context, GL picks up again by itself.
- Our headless test browser has only SwiftShader, so the tests run the sprite path by default.
- Set `window.__SUSANO_GL = 1` to force GL there; it costs about 0.3–0.4 s a frame in SwiftShader, mostly the `drawImage` that waits for the CPU rasteriser.

**Sizing and other changes.**
- `VIS` is now 1.1, down from 1.45 in round 2; A's `zoomR` 0.86 is kept. The robot now fits a 390×844 screen with room to play. A's hit radii in tiles may want to shrink by about 25% to match.
- **Design:**
  - a reactor pack on the back, with the pods seated in gold sockets;
  - the rail arms now telescope out of the pack, so in robot form they are no longer loose sticks;
  - thicker, armoured rails.
- `warm`, `warmPlan` and `warmIdle` return at once on the GL path; nothing needs baking.

### M — round 4 (2026-11-12): a tall, hovering stance (for A)

The API and channels are unchanged. What changed in the model:

**Proportions.**
- Thigh 0.76 → 1.12, shin 0.76 → 1.1; the plating is stretched to match and the joints keep their size.
- The waist is narrower (0.34 → 0.25 half-width), and the neck is lifted 0.11.
- The spine pivot stands at z 2.72 (was 1.7). The airship keeps its old height.

**Base pose.** The robot now hovers, standing tall:
- the left leg extended down and slightly back, its foot pointed;
- the right knee raised forward;
- the torso upright and the chest open;
- the fans lifted (`BLADE_R` now runs from −8° to 130°).
- The `rest` hold is now one-handed: the sword is held out and down at the right side. In every one-handed hold the left arm is flung out wide.

**Legs and the channels A drives.**
- `gait` / `gaitAmp`: only a light flutter (±0.1 at the ankles); no walking.
- `legSwing` < 0: both legs trail back and lift.
- `crouch` (the holds' and A's own) briefly plants both feet: the raised knee drops and the extended leg comes in. Releasing it returns to the tall stance.
- `lean`, `bank`, `pitch`, `twist`: unchanged.

**For A.** Please drive the idle and glide from this stance and keep `crouch` near 0 except during the moves' wind-ups and impacts.
- The anchors are unchanged in meaning. `feet` and `footL` / `footR` now sit about 0.2–0.6 above the floor (hovering), and the robot is taller.

**Checks.**
- Transformation clearances are about the same as before; the worst is a thin rail grazing a forearm.
- Every hold × `legSwing` is clear, with no reach shortfall.

### M — round 5 (2026-11-12): spikes, the open claw, and the GLM API for E

**Spikes.** These are real meshes: faceted, bevelled cones with sharp tips, in silver, gunmetal and gold. They sit on:
- the helmet crown (three, swept back);
- each pauldron (a crest of three, plus three on the lower rim);
- the backs of the shoulder drums (two each);
- the gauntlet ridges (three each);
- the knees (a guard spike plus gear studs);
- the skirt hem (five);
- the reactor pack (low and on the flanks).

The transformation is clean: nothing collides visibly at xf 0.15–1, and the sphere clearances are the same as round 4. The sprite fallback has no spikes.

**The off-hand is an open claw.** A new part, `claw`, has a domed back, four splayed talon fingers with silver tips, and a thumb. It is used whenever the left hand is free.
- The arm is flung out with the forearm's armoured back turned up and the palm down.
- Grips that use both hands still use the fist.
- `anchor('handL')` is the middle of the palm while the claw shows.
- The gauntlet rings now end in round gold flanges, not square plates.

**For E: the `GLM` API is stable.**
- `GLM.ok()`: true when WebGL is usable. It makes the context on first call, and returns false when lost or failed.
- `GLM.soft`: true on a software rasteriser. Draw your own 2D fallback there.
- `GLM.builder(q)`: build a mesh. It has frames (`push(x, y, z, o)` with scaled frames allowed, `at(o)`, `along(o, d, up)`, `pop()`) and these primitives:
  - `box(c, h, bevel, mat)`
  - `ell(c, r, mat, { th0, th1, ph0, ph1, seg, rings, cap })`
  - `sph(c, r, mat, seg)`
  - `tube(a, b, r1, r2, mat, { cap0, cap1: 'round' | 'flat' | false })`
  - `spike(a, b, r, mat)`
  - `tor`, `torX`, `torY`, `torZ(c, R, r, mat, { teeth, tooth })`
  - `lathe([[x, r, mat], ...])`
  - `surf(pos(u, v), nu, nv, mat(u, v))`
  - `prism(outline2D, z0, z1, mat, { b })`
  - `done()` returns a mesh.
- Material ids are the model's `M_*`: 0 obsidian, 1 gunmetal, 2 silver, 3 gold, 4 rope, 5 crimson enamel, 6 violet (emissive), 7 dark, 8 eye, 9 blade silver, 10 cable, 11 steel, 12 violet edge, 13 grip.
- `GLM.render(W, H, S, items)` returns the WebGL canvas.
  - `S = { px, py, pd, cl, v, lk, ls, lr, up, low }`: the projection rows and clip mapping, the view direction and the lights.
  - Each item is `{ mesh, R0, R1, R2, T, alpha, glow, kind, wear }`.
  - It clears and renders one frame into the shared canvas, so copy it out with `drawImage` before the next call. The model renders inside its own `draw`, so call yours outside it.
- `glPass` inside `20k5v` shows how to build `S` for the game camera.
- One shared context serves both of us. Ask in Notes if you need a second program or blending mode, and I'll add it without changing these calls.
- (E, 2026-11-12, later) **Dark Messiah v2: gather, condense, drop, detonate (the user's design, after v309).**
  - **Sequence (`TUNE.messiah`):**
    - gather 2.4 s into the underbelly (M's `center` anchor lowered by `bellyDrop` 0.9);
    - condense 0.6 s into one speck;
    - drop 0.55 s, with the telegraph;
    - detonation at 3.55 s, which is `ctx.messiahPlan.tDetonate`.
  - **Gameplay is unchanged:**
    - 130 / 175 / 210 DK, once per enemy, as the dome's front (R 7 / 7.5 / 8, reached at `front` 0.42 s) passes it, with `noCharge`;
    - nothing before the blast deals damage;
    - `safeReturn()` and `done()` come 0.25 s and 1.15 s after the front ends.
    - The cloud lasts 5.6 s, and the explosion covers the pet.
  - **GPU layer:** `self.SUSANOO_GFX`, at the end of `20k5x` and separate from GLM.
    - One offscreen WebGL canvas (WebGL2, else WebGL1) at 0.5× the game canvas (0.36× on low effects; long side capped at 1100), drawn into the game canvas with one `drawImage` per frame.
    - Each frame makes 2 draw calls (4 since the WebKit fix below):
      - a full-canvas quad whose noise shader paints every soft and volumetric part;
      - one batch of 12,000 stateless point sprites (2,600 gather, 4,000 sparks, 2,600 embers, 900 debris, 1,900 motes; 40% of them on low effects).
    - It is used on real-GPU WebGL. On a software rasteriser (SwiftShader) or without WebGL, the simplified 2D path draws instead, so the headless tests run 2D.
    - `window.__SM_GL = 1` forces the GPU layer and `0` forces 2D. A lost context falls back to 2D.
    - Because the floor's darkness overlay is painted over the effects, the move calls `X.light` around the gather, the fall and the cloud.
- (E, 2026-11-12, WebKit fix) **The GPU layer's output is now valid premultiplied colour everywhere (rgb <= a).**
  - The GL canvas is twice as wide:
    - pass 0 draws the smoke and dark points in the left half, premultiplied, blended over;
    - pass 1 draws the light alone in the right half, added together, with alpha = its brightest channel.
  - `SUSANOO_GFX.blit` lays the left half `source-over`, then the right half `lighter`, so the light adds the same way in every browser. The LK-in-alpha hack is gone.
  - Cost: 4 draw calls and two `drawImage` calls a frame. Use `u_pass` and `u_off` to choose the half.
  - `SUSANOO_GFX.check()` (for tests) counts the pixels that break rgb <= a: 0 in every phase tested.

### M — round 6 (2026-11-12): the free arm at rest; the airship's prow

**The free (left) arm at rest.**
- It hangs beside the body, a little off the hip, the elbow nearly straight with a slight bend.
- The hand is relaxed and half open, its palm toward the thigh, the fingers loosely curled.
- During the transformation the left hand comes up smoothly to the hilt; it no longer pops onto it.
- A's springs still add to this pose. The holds are unchanged, and every hold reaches its grips (shortfall ≤ 0.03).

**The airship's prow.**
- The sword no longer docks in the back cradle; the cradle stays folded.
- Instead, both fists carry the sword up before the face during the dock stage, blade up. The pitch then turns it forward, and as the body stows the hilt settles on the hull's line just ahead of the head.
- In the airship the two fists hold the crossguard's ends, either side of the head. The head is the nose: its face is tipped up a little and the eye slits are larger.
- The blade runs ahead as the prow, angled slightly down.
- The pods now dock at y ±1.3 (was 1.18), clear of the long folded legs.

**For A and E.**
- In the airship, `swordTip`, `swordChannel` and `hilt` now point forward from the nose (they were under the hull). The Dark Messiah sword-point focus therefore sits ahead of the ship.
- `handL` and `handR` are the fists on the guard.

**Clearances.** The worst along the whole transformation is −0.08, a forearm brushing a drum while the sword rises. The helmet and the sword are clear throughout.
- (E, 2026-11-12, True Dark Blade v2) **The wave is now a thin flying crescent slash, not a standing wall** (the user's request after v310).
  - **Shape:** the crescent lies flat over the ground at z 0.35 (`TUNE.blade.z`).
    - It is 0.62 tiles thick at its centre (`thick`) and tapers to points at the tips.
    - It is bowed forward by min(1.5, 0.24 × width), so the tips trail the centre.
  - **Drawing:** a dark core with a sharp edge, a bright violet edge glow and a pale thread along the front, and a feathered violet outer glow.
    - Sparks, dark wisps and motes trail behind it, and violet fissures under its path light up, then fade.
    - Each segment fades on its own where its lane stops at a wall.
  - **Gameplay:** the reach, width, speed, damage (4 × DK, once per enemy) and wall stops are unchanged. The hit test now also follows the bow, so a monster is struck only when the drawn crescent reaches it.

### M — round 7 (2026-11-12): the head as the airship's nose

**The head is the figurehead.**
- During stow (from about stow 0.62) the helmet turns half a turn to face along the flight line, crown and horns up and swept back.
- It moves forward and up to lead the hull: above and just behind the crossguard, between the fists. It is drawn 1.5× in the airship (1.22 in the robot).
- An armoured neck extension (`neckx`, drawn with the rail mesh) joins it to the gorget, so there is no gap.

**The eyes.** The eye slits are larger, with 2D violet glows at both eyes (new anchors `eyeL` and `eyeR`). They are strong in the airship and readable in game.

**The prow.**
- The fists bring the hilt to the nose while the head waits.
- The blade runs straight along the flight line, slightly down (−0.05).
- `swordTip`, `hilt` and `swordChannel` stay valid and point ahead of the ship.

**Clearances.** One known graze: the turning helmet brushes the sword's pommel by −0.12 (sphere approximation) for a brief moment at xf ≈ 0.52 (I estimate under 0.1 s). Everything else is ≥ −0.08.
- (E, 2026-11-12, True Dark Blade v3) **The slash now reads as a wide horizontal arc in every direction.**
  - **Orientation:** the chord lies along world x, which is screen-x, leaning by 0.24 × cos(travel) toward the travel direction.
  - **Bulge:** the arc bulges down the screen (bow 1.6 × min(1.5, 0.24 × width)) when travelling down or sideways, and up the screen when travelling up. It passes smoothly through a straight line at about 20° above level.
  - **Thickness:** 0.62 × 0.75 tiles on screen.
  - **Hits:** a monster is struck when the drawn arc passes over it, within `TUNE.blade.band` 0.5 + its radius, once per activation. Each lane still stops at its wall.
  - **Gameplay:** damage, reach, speed and the arc's width are unchanged. A sideways slash now sweeps a horizontal band (its width along the travel), not a tall wall.
- (E, 2026-11-12, Death Ray) **Robot Strong 1 is now Death Ray; True Dark Blade is deleted.**
  - **API:** `SM.deathRay(ctx)`. `SM.darkBlade` is the same function until A switches the slot over.
  - **Timeline:**
    - 0.3 s wind-up, with the telegraph and the palm glowing;
    - 0.9 s carve: the ray fires from `anchor('handL')` and its contact point traces the circle (outer rings, a star, sigils, 12 runes);
    - 0.4 s charge: the ray is off, the circle pulses brighter and its runes turn;
    - then the burst: one hit per enemy inside the drawn circle, 4 × DK, charging the meter. A column of light and a shockwave ring follow, with the visuals lasting 0.9 s.
    - `done()` is called 0.3 s after the burst, so the move takes 1.9 s in all. The cooldown is unchanged at 2.5 s.
  - **Target spot:** taken from `aimOf`, which is the stick, else `target()`.
    - Its distance is clamped to between 2 and 5.5 tiles, stopped 0.5 short of the first wall along the line, and moved to `nearestLand` if it isn't ground.
    - The radius is 2.6 / 2.8 / 3.0 by tier.
    - `ctx.rayPlan = { x, y, R }` is readable for tests.
  - **Poses used (A's round-6 clips):**
    - `rayAim` u 0..1 over the wind-up;
    - `rayHold` u 0..1 over the carve, with extra `{ x, y }` set to the moving contact point so the arm follows the ray;
    - then `rayHold` 1 at the centre through the charge;
    - `rayRecoil` u 0..1 over 0.3 s from the burst.
  - **For A, please:**
    - label the button **"DEATH RAY"**;
    - draw its icon as `btnFace(...)`, then `SUSANOO_MOVES.icons.deathRay(x, cx, cy, r, rd)` (a hand's ray onto a glowing circle with a star), then `btnRim(...)`;
    - call `SM.deathRay` for the slot (falling back to `darkBlade`);
    - update any comments or hints that still say True Dark Blade. The internal slot key `blade` can stay.
  - **Other updates:** I updated `tests/susanoo.js` (it now expects "DEATH RAY") and the roster text in `20k1` ("Death Ray, a laser from the free hand that carves a magic circle which then explodes").
- (A, 2026-11-12, round 6) **Glides is a 4-stage combo with no cooldown, and Death Ray now runs in Strong 1.**
  - **Glides (`TUNE.combo`):** a press chains the next stage, 1 → 2 → 3 → 4.
    - A press during a stage is held and fires at the end of that stage's act (the glide and its hits), so there is no
      snap back to idle.
    - A press in the recovery, or up to 0.4 s after it, starts the next stage at once.
    - After stage 4, or once the window lapses, the next press starts stage 1.
    - Anti-spam: a stage can't be cut short. Its prep + act (0.27–0.5 s) is the minimum.
    - The dodge protection (0.06 s) is granted at most every 0.8 s.
  - **The four stages:**

    | Stage | Motion | Damage |
    |---|---|---|
    | 1 | a quick forward glide, cutting right to left in a 2.8 rad frontal arc | 3 × DK |
    | 2 | the return cut, left to right | 3 × DK |
    | 3 | a spinning glide, a full turn, all round | 3 × DK |
    | 4 (finisher) | a crouch, a leap-glide 1.4 tiles high, an overhead slam | 4.8 × DK in the blade's reach (3.0), and a dark shockwave of 3 × DK out to 3.6 |

    - The finisher also has knockback 8, a brief hit-stop (none under reduce-motion), and a spring kick of the body.
    - Every stage hits each enemy once and charges the meter.
  - **Button:** four pips over the Glides button show the current stage (the fourth glows white).
  - **Clips:** `glide1` / `glide2` (`cutClip`), `sweep` (stage 3) and `glide4`. Each stage starts from the pose the
    previous one left, so the springs carry it through.
  - **Death Ray:**
    - The slot calls `SM.deathRay`, falling back to `darkBlade`.
    - The button reads DEATH RAY and draws `SUSANOO_MOVES.icons.deathRay` between `btnFace` and `btnRim`.
    - The `ray` clip matches E's names: `rayAim` → u 0..0.25, `rayHold` → 0.25..0.8 (a slight strain), `rayRecoil` →
      0.8..1. The torso braces (a small crouch, leaning back about 0.18, twisted 0.25 toward the arm). The recoil throws
      the body back.
    - The `overhead` / `overheadSlam` poses are retired; the `overhead` clip stays for `ctx.clip`.
    - Your timing (0.3 s wind-up, 0.9 s carve, then the 0.4 s charge holding `rayHold` at 1, then a 0.3 s recoil) fits as
      is.
  - **For M: the free arm's aim.** A writes these every frame, from E's `extra.x` / `extra.y` (the moving contact point,
    so it tracks the ray):
    - `aimL` (0..1): the blend from the hanging free left arm to pointing;
    - `aimLYaw` (radians, body frame: 0 straight ahead, positive to the body's right as the heading turns);
    - `aimLPitch` (radians down from horizontal, toward the spot on the ground).

    Please aim the free left arm (the shoulder → the hand, the palm toward the target) along that direction when
    `aimL` > 0. Until then, Death Ray reads only through the torso.

### M — round 8 (2026-11-12): the head seated, the flight mask, the free arm's aim

**The head is seated in both forms; there is no neck.**
- **Robot:** the helmet sits down into a flared, gold-rimmed collar on the gorget. The neck pivot is lowered 0.07.
- **Airship:** the helmet turns to face along the flight line and sits between the pauldrons at the shoulder line, flush with the hull and partly enclosed by the shoulder armour. It is drawn at 1.38×. The fists and the sword prow stay ahead of it.
- The round-7 neck bridge (`neckx`) is gone.

**The flight mask.** A new part, `visor`: curved armour plates, gold trim, a narrow violet eye slit and a gold crest.
- It swings down over the face at xf 0.58–0.68, once the head has settled at the nose, and stays closed in the airship.
- In the robot it is retracted (not drawn).
- `eyeL` and `eyeR` move to the slit as it closes.

**The free arm's aim (A's channels).** `aimL`, `aimLYaw` and `aimLPitch` are now read.
- Direction in the heading's frame: `[cos(yaw)·cos(pitch), sin(yaw)·cos(pitch), −sin(pitch)]`.
- The shoulder and elbow extend toward it, blended by `aimL` over the hanging rest pose. The hand bends back at the wrist, fingers up, palm toward the target.
- `handL` is the palm, the ray's origin.
- Robot only, and only while the left hand is free.
- `relax` eases `aimL` back to 0.

**Clearances.**
- At hard-left aims the forearm passes close to the left fan's blades (sphere approximation −0.09; −0.18 if aimed upward).
- In the transformation the worst is a helmet/forearm graze at xf ≈ 0.52 (−0.11).
- (E, 2026-11-12, Death Bombs) **Robot Strong 1 is now Death Bombs; the Death Ray laser is deleted.**
  - **API:** `SM.deathBombs(ctx)`. `SM.deathRay` and `SM.darkBlade` point to the same function, so the core's current slot already plays it.
  - **Icon:** `SM.icons.deathBombs(x, cx, cy, r, rd)` (five orbs arcing over a glowing circle with a star), drawn between `btnFace` and `btnRim`. `SM.icons.deathRay` is the same glyph for now.
  - **Label:** "DEATH BOMBS". The coordinator wires it in `20k5w`.
  - **Targets:** the nearest enemies within 6.5 tiles come first, skipping any that would overlap an earlier circle; the remaining bombs go to a fan of spread spots along the aim.
    - Every spot is checked along the line of sight: stopped 0.5 short of a wall, then moved to `nearestLand` if it isn't ground.
    - `ctx.bombPlan = [{ x, y, R, t }]` is readable for tests.
  - **Timeline:**
    - 0.25 s wind-up (`rayAim`);
    - launches 0.08 s apart (`rayHold`, with extra `{ x, y }` at each bomb's target, so the arm points at each in turn);
    - `rayRecoil` for 0.3 s, then `done()` at about 0.87 s;
    - each bomb flies 0.32–0.5 s, sinks in, and its circle blooms;
    - the circle bursts 0.55 s after landing, with bursts at least 0.12 s apart, as a ripple.
  - **Damage:** 2.5 × DK per burst to each enemy inside that circle (radius 1.8 / 1.9 / 2.0), at most 2 hits per enemy (so at most 5 × DK), charging the meter. The cooldown stays 2.5 s.
