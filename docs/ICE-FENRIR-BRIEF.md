# Fenrir: 11th Ice ult (four workers, the Susano O team)

- **Spec:** `docs/elem-spec/ice-fenrir.md`. Read all of it; it is the user's own text and it wins over this brief.
- **Concept art:** `/mnt/user-data/attachments/78d1fddd-217b-590c-9262-fa063f90a263/cbea1e56-image.png` (top: wolf
  form, bottom: motorcycle form). The user's own design. Reference only; never copy it into the repo.
- **The user's extra instructions (sent with the spec):**
  - "Use the same team as Susano o. Draw it in gpu, same technique and method to achieve the organic 3d look of
    Susano O. I want detailed, high quality model with advanced shading and textures."
  - "Make environment destroyable when these attacks hit."
  - "The wolf is big, as big as a sports car and so should the motorcycle form."
- **Roster:** the row is already in `src/js/20k1-elem-core.js`: `['fenrir', 'Fenrir', 'dash', 100, 120, ...]`, the 11th
  Ice ult. `ELEM_ULT_LV`'s 11th entry (80) unlocks it. Don't edit the row except its description text, if a move's
  final behaviour differs.
- **Name clash:** Ice already has an ult called Diamond Dust (`diamonddust`, the 2nd). Fenrir's motorcycle finisher is
  a different move with the same display name. Keep them separate in code (`fenrirDust` or similar) and don't touch the
  old one.

## Precedents to read first
- **Susano O** (the technique to match): `20k5uz-gl-mesh.js` (`GLM`, the WebGL mesh builder and PBR shader),
  `20k5v` (model: one part set, two forms, a transformation, anchors, pose channels), `20k5w` (core: session, two
  forms, one timer set, one gauge, contextual menu, Jump, camera), `20k5x` (moves and `SUSANOO_GFX`, the GPU effects
  layer), `docs/DARK-SUSANOO-BRIEF.md` and its Notes, `tests/susanoo.js`, `tests/susanoo-jump.js`.
- **Sports Car** (driving, Drift, the size to match): `20k4p`, `20k4q`, `docs/LIGHT-CAR-BRIEF.md`.
- **Beast Machine:** `20k9i`, `20k9j`, `20k9k`, `docs/THUNDER-BEAST-BRIEF.md`.
- **Shared code:** the VEH hooks in `20b-game-dungeon.js` (`X.vehicle`, `vehBtns`, `camPick`), the smash helper
  `20k0v-vehicle-smash.js` (`VEH_SMASH`), the Ice kit `20k8a-ice-kit.js` (freeze rules, crystal helpers) and the Ice
  ults `20k8b`–`20k8f`.

## Decisions already made
- **Key and files:** key `fenrir`, kit key `ey_fenrir`.
- **Durations:** 20 / 25 / 35 s by tier, cooldown 120 s from exit, starting in motorcycle form. All in one `TUNE`.
- **Size:** both forms as big on screen as the Sports Car (measure its drawn length and match it). Hit radii and
  collision should match the drawing.
- **GPU drawing:** the model is drawn live with `GLM`, like Susano O: real meshes, PBR materials, about 30–60k
  triangles, one composite `drawImage`. Without WebGL, draw a simple low-detail fallback so the ult still plays.
- **The pet rides in the open** on the saddle in both forms (drawn with `X.drawPetAt`, upright, never yawed; a flat 2D
  roll during spins is fine). Unlike Susano O it is never hidden. During Somersault and Spinning Wheel the pet stays on
  the seat and rolls with the body.
- **Environment destruction:** every Fenrir attack breaks props through `VEH_SMASH` (its allowlist; doors and bridges
  are protected; chests open and shrines trigger). That covers the Drift sweep and endpoint spikes, cannon impacts and
  crystal shatters, Spinning Wheel's route, Somersault's crystal, Diamond Dust and the Frozen beam. Driving or running
  through small props also smashes them, as the Sports Car does.
- **Damage:** all damage goes through one `ctx.hit` / `ctx.hitArea` path in the core, which charges the gauge and
  smashes. Finisher hits don't charge.
- **Balance (provisional, in `TUNE`, H audits):** per-cast totals near Sports Car's and Beast Machine's current ones
  (both have `dmgK: 2`). The finishers land near Supernova and Judgement Day. Susano O's Dark Messiah must stay first
  in `tests/ult-damage-rank.js`.
- **Camera:** ground forms can use a zoom-only focus (`k: 0`). `camPick` in 20b handles rifts and fiend floors.
- **No Jump button** unless the user asks; the spec doesn't list one.

## Standing user rules
- **Performance:** the user plays on an iPhone and a 2019 iMac. Pool particles. Low effects reduce decoration only,
  never hits. GPU effects need a 2D fallback and valid premultiplied output (see `SUSANOO_GFX`: smoke `source-over`,
  light `lighter`).
- **Look:** feathered edges, no hard rims, light-only floor marks. Big finisher effects may cover the pet.
- **No motion-blur ghosts** on the vehicle. Trails and streaks are fine.
- **Timers** run on the game clock as deadlines, not per-frame countdowns (hit-stop skewed Susano's once).
- **Never** put reference art in the repo.
- **Git:** never commit, never push, never touch `test.html`. Build your own page:
  `python3 src/build.py --test-only test-fen<M|A|E|H>.html`. Use Edit, not whole-file rewrites, on shared files.

## Roles and files
| Worker | Role | File |
|---|---|---|
| **M** (model) | `FENRIR_MODEL`: one persistent part set and rig for both forms, the transformation, every pose channel and anchor, drawn with `GLM` | `src/js/20k8m-ice-fenrir-model.js` |
| **A** (core and animation) | `U.fenrir`: the session, both forms' movement, Drift with its form switch, HUD and menus, timers, gauge, cleanup, the animation layer | `src/js/20k8n-ice-ult-11.js` |
| **E** (effects and moves) | `FENRIR_MOVES`: Ice Cannon, Spinning Wheel, Somersault, Diamond Dust, Frozen, the Drift sweep and endpoint-spike effects, sound | `src/js/20k8o-ice-fenrir-moves.js` |
| **H** (helper) | Tests, the balance audit, freeze-rule research, anything the others ask for in Notes | `tests/fenrir.js` and Notes |

### M: the model
- Follow the spec's "Shared visual identity", "Wolf form", "Motorcycle form" and "Connected transformation" sections
  and the concept art closely.
- Exactly two wide tyres with tread and cyan-lit hubs, exactly two long thin cannons, one saddle, the wolf head, four
  articulated legs with clawed paws, the segmented tail, the crystal mane and armour. Every part exists in both forms.
- Materials: polished silver armour, dark machinery, rough rubber, faceted translucent cobalt and sapphire ice with
  internal cracks and frost, cyan emissive channels. Extend `GLM`'s shader for ice if needed (fresnel, facets, fake
  refraction), keeping its API stable for Susano O.
- Motorcycle: the head is the front fairing, legs fold into visible braces, the tail and rear armour become a big
  spiky rear cowl, cannons pivot down along the sides beside the front wheel.
- Transformation `xf` 0..1 (bike 0, wolf 1, both directions) on real pivots, with a collision sweep over the whole
  path. The seat stays a continuous supported point.
- Pose channels for A and E, at least: wheel spin, steering lean, suspension, run cycle (four legs), drift lean and
  spin, backflip, somersault pitch, curl (Spinning Wheel), paw lock and piston compression, cannon recoil, cartridge
  loading, barrel glow, tail sway, frost cracks (exit), dissolve alpha.
- Anchors, at least: `seat`, `center`, `muzzleL`, `muzzleR`, `wheelF`, `wheelR`, the four paws, `head`, `tailTip`.
- Deliverable: `fenrir-model.png`: both forms every 45° at the game camera, close-ups, the transformation frames, and
  a size comparison beside the Sports Car in game.

### A: the core
- Model the session on `20k5w` (two forms, one timer, one gauge) and the driving on `20k4p`.
- Motorcycle drives like the Sports Car (fast, leaning turns); the wolf runs (slightly slower, tighter turning). Put
  the numbers in `TUNE`.
- **Drift (the Dodge button):** attack first, then transform at the end, exactly once per completed Drift. Two damage
  phases: the moving sweep, then the endpoint ice-spike eruption (E draws both; you call them). The form and the menu
  change only when the other configuration is ready. Nothing else switches form.
- **Menu:** Strong 1 is Ice Cannon in both forms. Strong 2 is Somersault (bike) or Spinning Wheel (wolf) on one shared
  cooldown. Ult is Diamond Dust (bike) or Frozen (wolf) at full gauge, once per summon.
- One summon timer, one gauge, one outer cooldown; switching form changes none of them and resets no cooldown.
- Timeout: safe dismount and dissolve, no free finisher. A committed finisher completes. Cleanup is one guarded path.
- Expose `ctx` to E the way `20k5w` does (hit, hitArea with smashing, anchor, camera, pose and clip drivers, `done`).
- Deliverable: `fenrir-core.gif` (drive, Drift to wolf, run, Drift back).

### E: the moves and effects
- Follow each move's section of the spec exactly: the damage phases, the counts (Ice Cannon 1 / 2 / 3 paired volleys,
  so 2 / 4 / 6 projectiles) and Frozen's beam of exactly 5 s with fixed combat ticks.
- Ice Cannon: impact and crystal growth are one hit; the shatter is a second AoE.
- Diamond Dust freezes through the existing Ice status rules (H reports them) and respects boss freeze resistance.
- Neither finisher's exit effect deals damage.
- Use a GPU effects layer like `SUSANOO_GFX` where it clearly helps (the Frozen beam, Diamond Dust's crystal field and
  sparkle), with 2D fallbacks.
- Add sound for every move through the game's existing sound helper.
- Deliverables: `fenrir-moves.png` and one GIF per finisher.

### H: tests and audit
- `tests/fenrir.js`, covering the spec's verify list: endpoint spikes on every Drift, the form switching exactly once
  per Drift and never from other moves, 2 / 4 / 6 projectiles, shared cooldowns kept across a switch, the timer and
  gauge kept across a switch, one finisher per summon, the right contextual commands in each form, Frozen's damage
  window (5.00 s, tick count independent of frame rate), timeout without a finisher, cleanup, props smashed with doors
  and bridges kept.
- The balance audit: Fenrir's per-cast totals beside Sports Car and Beast Machine, and the rank test still putting
  Dark Messiah first. Record the table in Notes and recommend coefficients.
- Report the Ice freeze rules (who can be frozen, for how long, boss behaviour) in Notes for E, early.
- Add `fenrir` to `tests/ult-damage-rank.js` and to the `elem-moves` checks as needed.

## Notes (workers append dated entries below; ask each other questions here)
- (H, 2026-11-12, **the Ice freeze rules, for E's Diamond Dust**) How freezing works in the game today (20b `hitMon` and
  the monster loop, `H.bind` in `20k1`):
  - **The status:** `m.freeze` = seconds left. While it is above 0 an ordinary monster is held (no movement, no
    attacks; 20b's monster loop: `held = m.freeze > 0 || m.stun > 0 ...`), is drawn inside the game's faceted ice
    block with a frost star (20b draws it; you need no art for the status itself), and it counts down by itself.
    Re-freezing takes the longer time (`Math.max`), it never stacks.
  - **How to apply it (use one of these, never write the fields by hand):**
    - through the hit: `ctx.hit(m, dmg, { freeze: seconds })` / `ctx.hitArea(..., { freeze: seconds })` (the opts go
      to `hitMon`). Only a hit that is not `dot` applies it. Add `chill: true` for the slow afterwards.
    - without damage: `H.bind(m, seconds)` (`ctx.H.bind`).
  - **Who can be frozen:** every ordinary monster, elites included. **Bosses, lesser bosses, mini bosses and fiends
    (`m.boss`) are never frozen:** both paths turn the freeze into a chill instead (`hitMon`: `m.chill = max(chill,
    1.5)`; `H.bind`: `chill = min(t, 1.5)`). A chilled boss moves at 0.7x speed, an ordinary monster at 0.55x.
    The boss loop does not read `m.freeze` at all, so do not set it on a boss to hold it (Ice Age sets 1 s on bosses for
    the ice-block picture only). A boss's stun is quartered (`o.stun * 0.25`) and only holds it while it walks.
  - **Durations in use:** Ice Strongs 1-1.5 s; Diamond Dust (the old ult) 1.0 s; Frozen Vortex ticks 1.1 s; Ice Age and
    its sprouts 3 s (the longest in the game); the basic frost nova 2.4 s. Chill: 2.2 s on monsters, 1-1.5 s on bosses.
  - **No resistance stat exists** beyond that boss rule: no diminishing returns, no per-monster immunity. A frozen
    monster takes normal damage (no shatter bonus in the core). `m.still` monsters freeze like any other.
  - **Suggestion for Fenrir's Diamond Dust:** freeze 3 s on ordinary monsters through the explosion's own hit opts
    (`{ freeze: 3, chill: true }`), which gives bosses the standard 1.5 s chill and no hold: that is "respecting boss
    freeze resistance". If you want the crystal-encased look on a boss, draw your own crystal round it; don't set
    `m.freeze` on it.
- (H, 2026-11-12, **hooks `tests/fenrir.js` needs: A and E please confirm or rename in Notes**) Modelled on
  `g._susanoo`. The test reads these and nothing private; if you name something differently, say so here and I adapt.
  - **A, the session `g._fenrir = S`:**
    - `S.phase`: `'summon' | 'ride' | 'drift' | 'finisher' | 'out' | 'gone'` (any names, but one for "controllable",
      one for "Drift running", one for "committed finisher", `'gone'` after the release); `S.released`.
    - `S.form`: `'bike' | 'wolf'` (the form in play now; it changes only at a Drift's end).
    - `S.left` (s of summon left, from a game-clock deadline `S.endT`), `S.charge` (0..1), `S.used` (finisher taken).
    - `S.cd = { cannon, s2, dodge }` (s left; `s2` the shared Somersault / Spinning Wheel cooldown), `S.busy`.
    - `S.ctx` (the ctx given to E), `S.V` (`x, y, heading, form, locked`).
    - `S.stats`: `drifts` (completed), `driftSweepHits`, `spikes` (endpoint eruptions fired: must equal `drifts`),
      `switches` (form changes: must equal `drifts`), `menuSets`, `cannon` (activations), `somersault`, `wheel`,
      `dust`, `frozen`, `smashed` (props broken through VEH_SMASH), `cdSet`, `dealt`, `charged`.
    - `VEH.drawBtns` labels through `GFX.labelS` as Susano's do: I read them to check the contextual commands
      (expected words: `ICE CANNON`, `DRIFT`, `SOMERSAULT` / `SPINNING WHEEL`, `DIAMOND DUST` / `FROZEN`).
    - Damage through `S.X.hitMon` (I wrap it to log every hit with the phase and form), as `hitCharge` does in 20k5w.
  - **E, on `FENRIR_MOVES` (or in `S.stats`, either is fine):**
    - `stats.shots`: Ice Cannon projectiles actually launched (2 / 4 / 6 per activation), `stats.shatters`.
    - Frozen: `ctx.frozenPlan = { t0, t1, ticks, tick }` set when the beam starts (game-clock times of the first and
      the last damaging tick window, the tick count and interval), and `stats.frozenTicks` counting as they land. The
      test runs the beam at 60 and at 20 fps and expects the same tick count and `t1 - t0 = 5.00 s`.
    - Diamond Dust: `stats.dustHits` or just one `ctx.hitArea` (I count hits per enemy from the log).
- (E, proposal 1, for A and M) **`FENRIR_MOVES` contract (`src/js/20k8o-ice-fenrir-moves.js`).** I'm building against a stub of this; tell me here what differs.
  - **What E exports** (`const FM = self.FENRIR_MOVES`):
    - Moves, each called once at the press: `iceCannon(ctx)`, `somersault(ctx)`, `spinningWheel(ctx)`, `diamondDust(ctx)`, `frozen(ctx)`. Each checks `ctx.alive()` every frame and calls `ctx.done()` exactly once. The two finishers call `ctx.safeReturn()` just before `ctx.done()`.
    - Drift effects, called by A:
      - `driftSweep(ctx)` → `{ stop() }`. Call it when the Drift starts and `stop()` when the slide ends. While running it follows `ctx.vehicle`, sprays frost, and applies the sweep damage through `ctx.hitArea` (radius `TUNE.drift.sweepR`, once per enemy per Drift).
      - `driftSpikes(ctx, x, y)`. Call it at the destination, before the transform starts. It erupts the big spikes and applies the endpoint damage (`TUNE.drift.spikeR`, once per enemy). It needs no `done()`.
    - Also `TUNE`, `warm(ms)` (true when baked), `update(ctx, dt)` (optional per-frame call; it only remembers ctx).
  - **What E needs on `ctx`** (as `20k5w` gives Susano's moves):
    - Basics: `X`, `H`, `C`, `evo`, `tier` (0/1/2), `DK`, `form` (`'bike'` | `'wolf'`).
    - **`now()`:** the game clock in seconds. Frozen's 5.00 s window and its ticks are deadlines on it.
    - Damage, the only path (it smashes props and charges the gauge unless `noCharge`):
      - `hit(m, dmg, o)`;
      - `hitArea(x, y, r, dmg, o)`;
      - `hitOval(cx, cy, rx, ry, ang, dmg, o)`, which is the Frozen beam's one volume.
      - `o.once` is any object whose hit set spans calls; `o.freeze` is seconds; `o.kb` is knockback.
      - Please make `hitArea` and `hitOval` smash props even when no monster is inside.
    - Status: I call `H.bind(m, seconds)` for Diamond Dust's freeze (non-boss: frozen; boss: chilled, 1.5 s at most). If you'd rather own it, give me `ctx.freeze(m, s)`.
    - Aim and terrain: `target()`, `aimPoint()`, `aimDir()`, `mons()`, `groundAt(x, y)`, `canStand(x, y)`, `nearestLand(x, y)`.
    - Vehicle: `vehicle` is the live `{ x, y, z, heading, locked }`.
      - **E moves the vehicle itself** during Somersault (z only), Spinning Wheel (x, y, z along the roll; it stops at anything `canStand` refuses) and Frozen's backflip (z, and up to 1.5 tiles backward).
      - E sets `vehicle.locked = true` for those and leaves it for A to clear at `done()`.
    - Other: `anchor(name)` → world `{ x, y, z }`; `camera(o | null)`; `done()`; `alive()`; `safeReturn()`; `finisher` (true while one runs).
  - **Named poses E drives through `ctx.pose(name, u, extra)`** (A maps them onto M's channels; u 0..1):

    | Move | Pose | Meaning |
    |---|---|---|
    | Ice Cannon | `cannonLoad` | chambers charge, barrel glow |
    | | `cannonFire` | recoil of one paired volley, 1 → 0 |
    | Somersault | `somersault` | one full vertical flip; pitch = u × 2π; suspension compresses near 0 and 1 |
    | Spinning Wheel | `wheelCurl` | forward somersault into the curl |
    | | `wheelRoll` | curled and rolling; extra `{ roll }` in radians, growing |
    | | `wheelLand` | unfold onto four paws |
    | Diamond Dust | `burnout` | rear wheel spinning; extra `{ spin }` = body yaw offset in radians |
    | Frozen | `backflip` | backward flip |
    | | `pawLock` | claws dig in, pistons compress |
    | | `frozenLoad` | cartridges load, receivers cycle |
    | | `frozenCharge` | energy gathers along the barrels |
    | | `frozenFire` | held through the beam; extra `{ recoil }` shudders |
    | | `frostCracks` | cracks spread before the exit |
    | Any | `rest` | back to idle |

  - **Anchors I use:** `muzzleL`, `muzzleR`, `wheelF`, `wheelR`, `pawFL`, `pawFR`, `pawRL`, `pawRR`, `seat`, `center`, `head`, `tailTip`. If one is missing I fall back to the vehicle's position.
  - **Finisher exits:** I draw the frost-crack light and the final burst of ice dust (no damage), then call `safeReturn()` and `done()`. A fades the model (dissolve alpha) from there.
  - **Provisional numbers (`FM.TUNE`, × DK; H to audit):**

    | Move | Damage | Shape |
    |---|---|---|
    | Ice Cannon, per projectile | 1.2 impact and growth (one hit) + 1.6 shatter | shatter AoE r 1.7 |
    | Drift | 2.0 sweep + 2.5 spikes | sweep r 1.7, spikes r 2.3 |
    | Somersault | 2.5 growth + 3.0 shatter | r 2.4, then r 2.8 |
    | Spinning Wheel | 4.5, once per enemy | along the roll |
    | Diamond Dust | 85 / 115 / 140, one shatter | r 6.6, `noCharge`; freeze 4 s as the rings rise |
    | Frozen | 85 / 115 / 140 total | 20 ticks, 0.25 s apart, over exactly 5.00 s; `noCharge`; beam 10 tiles × 1.3 half-width |

  - **Cooldowns** are A's; my suggestion is Ice Cannon 2.5 s and Strong 2 3.5 s.
- (H, 2026-11-12, **balance baseline and starting coefficients, for A and E**; measured in game on one rooted neutral
  target, per activation, in DK = base x (1 + 0.08 (evo-1)); both cars carry `dmgK: 2`, included)
  | | Dodge move | Strong 1 | Strong 2 | Finisher (one target, full cast) |
  |---|---|---|---|---|
  | Sports Car | Drift 6-7.2 | Shooting Star 0.7 a star (a lone target catches 2-4: ~2) | Love Sensation 6.4 | Supernova 89 / 133 / 144 (evo 1 / 4 / 7; max run 104 / 138 / 165) |
  | Beast Machine | Jump 6 | Homing Missiles 9 / 13.5 / 18 | Heaven's Wrath 12 a strike (x1 / 2 / 3) | Judgement Day 32-40 |
  | Dark Messiah (must stay first) | | | | 130 / 175 / 210 if E applied my Susano note (check: it was 40) |
  **Suggested Fenrir numbers (final, as dealt; no hidden multiplier):**
  - Drift: sweep 3 DK + endpoint spikes 4 DK (7 in all, as Sports Car's Drift), once per enemy per phase.
  - Ice Cannon: per projectile, impact 2 DK + shatter 1.5 DK (r ~1.6); 2 / 4 / 6 projectiles = 7 / 14 / 21 on a lone
    target if all land (Beast's missiles: 9 / 13.5 / 18).
  - Somersault: crystal growth 5 DK + shatter 5 DK. Spinning Wheel: 10 DK along the route, once per enemy (or
    2 passes x 5). Shared cooldown ~3 s.
  - Diamond Dust: one explosion, 95 / 115 / 125 DK by tier. Frozen: 5 s beam, 20 ticks (every 0.25 s) of
    4.75 / 5.75 / 6.25 DK = 95 / 115 / 125 DK. Both sit between Judgement Day and Supernova, and under Dark Messiah's
    130 / 175 / 210 with room to spare. Gauge: `chargeK` ~32 x DK as the others.
  I re-measure when the moves exist and adjust; `tests/ult-damage-rank.js` will carry both Fenrir finishers.
- (M, 2026-11-12, **`FENRIR_MODEL` API, first working build in `src/js/20k8m-ice-fenrir-model.js`; the look is still being worked on, the API is stable**)
  - **It follows A's names.** I read the channel names A's animation layer already writes in `20k8n`, and the calls match the stand-in's, so `MOD()` picks the real model up with no change.
  - **Calls:**
    - `create()` → `{ pose, draw, drawShadow, anchor, anchorDir }`;
    - `draw(c, x, y, z, heading, pose, o)` and `drawShadow(c, x, y, z, heading, pose, o)`, with `o = { T, sx, sy, t, scale, low, pet(c, X, Y) }`;
    - `anchor(name)` → world `{ x, y, z }` for the last draw; `anchorDir(name)`; `anchorAt(name, x, y, z, heading, pose)` without a draw;
    - `warm()`, `warmIdle()`, `warmPlan()`, `ready()` exist and return at once (nothing is baked);
    - `blankPose()`, `relax(pose, dt)`, `CH`, `XF_STAGES`, `XF_BOUNDS`, `stagesAt(xf)`, `clearance(pose)`, `VIS`, `SIZE`.
  - **Forms:** `pose.xf` 0 = motorcycle, 1 = wolf, any value between is the transformation (it runs both ways). `pose.form` is ignored.
  - **The pet:** `o.pet(c, X, Y)` is called once per draw at the saddle (also when `alpha` is 0 it is not called: draw the pet yourself then). Parts nearer the camera than the rider (cannons, head, crests, by heading) are drawn over the pet.
  - **Pose channels (radians for angles):**
    - `alpha`; `glow` 0..1 (cyan channels); `crack` 0..1 (frost cracking over every surface, for the exit);
    - wheels: `wheelF`, `wheelR` (each wheel's rolled angle), `steer` −1..1 (motorcycle: front wheel and fairing turn), `susp` −1..1;
    - body: `lean` (roll about the floor line, + to the body's left, as A's `-hw` gives), `pitch` (nose up +, about the middle), `flip` (added to pitch: + is a backflip, − a forward somersault; whole turns are fine), `crouch` 0..1, `drift` 0..1 (lower stance);
    - wolf: `gait` (the run's phase in strides), `gaitK` 0..1, `curl` 0..1 (tucked into a ring for Spinning Wheel), `pawLock` 0..1, `piston` 0..1;
    - cannons: `recoilL`, `recoilR` 0..1 (the barrel slides back 0.3), `cannonPitch`, `load` 0..1, `barrel` 0..1 (glow at the muzzles and breeches);
    - `tail` (sway), `tailLift` 0..1, `mane` 0..1 (crests flare), `head` (yaw), `headPitch`, `jaw` 0..1.
    - `vent` and `z` are A's own (not read; `z` is added by A to the draw height).
  - **Anchors:** `seat`, `center`, `muzzleL`, `muzzleR`, `breechL`, `breechR`, `wheelF`, `wheelR`, `pawFL`, `pawFR`, `pawRL`, `pawRR`, `head`, `mouth`, `eyeL`, `eyeR`, `tailTip`. Directions (`anchorDir`): `cannonDir`, `headDir`, `forward`, `up`. They follow lean, pitch and flip.
  - **Size:** `VIS` 0.94 is built in; the motorcycle is about 3.3 tiles long (the Sports Car is 3.24). `SIZE.bike` / `SIZE.wolf` give `len`, `wid`, `hgt` and a hit radius `r`; `SIZE.seatZ` gives the saddle height in each form. Pass `scale: 1`.
  - **Transformation stages** (`XF_STAGES`, xf from motorcycle to wolf): open 0–0.14, cannons 0.06–0.42, legs 0.16–0.52, lift 0.44–0.8, wheels 0.5–0.86, head 0.54–0.9, tail 0.58–0.96, lock 0.92–1. The saddle only rises (by 0.52 tiles) during `lift`; it never tilts or jumps.
  - **Without WebGL** (and on software GL, so in our headless tests) a low-detail 2D picture of the same rig is drawn; everything else (anchors, pet, shadow) is identical. Set `window.__FENRIR_GL = 1` to force the GPU path in tests.
  - **`GLM` additions (Susano O unaffected):** materials 14 ice, 15 rubber, 16 cyan energy, 17 saddle leather, 18 dark machinery, 19 silver armour; builder `crystal()` and `facet()` (flat-shaded shards); optional scene `rim` / `amb` colours and per-item `fx` (the frost crack). E can use these for ice effects.
- (A, 2026-11-12, **the core as built in `src/js/20k8n-ice-ult-11.js`: what M, E and H can rely on.** It runs on M's
  model and E's moves as they stand today; `tests/fenrir.js` passes except the items listed at the end.)
  - **H's hook names: confirmed as you listed them, none renamed.** `g._fenrir = S`; `S.phase` is `'summon' | 'ride' |
    'drift' | 'finisher' | 'out' | 'gone'`; `S.released`; `S.form` `'bike' | 'wolf'` (changed in one place only,
    `switchForm`, at a Drift's end); `S.left` and the game-clock deadline `S.endT`; `S.charge`; `S.used`;
    `S.cd = { cannon, s2, dodge }`; `S.busy` (`'iceCannon' | 'somersault' | 'spinningWheel' | 'fenrirDust' | 'frozen'`);
    `S.drift` (null unless a Drift runs); `S.V = { x, y, z, heading, form, locked, pose }`; `S.ctx`.
    `S.stats`: `drifts`, `driftSweepHits`, `spikes`, `spikeHits`, `switches`, `menuSets` (1 at the summon's end + 1 per
    switch), `cannon`, `somersault`, `wheel`, `dust`, `frozen`, `smashed`, `cdSet`, `dealt`, `charged`, `hits`, `rideT`,
    `bikeT`, `wolfT`. Labels through `GFX.labelS`: `ICE CANNON`, `SOMERSAULT` / `SPINNING WHEEL`, `DRIFT`, the seconds,
    and `DIAMOND DUST 45%` / `DIAMOND DUST` / `DIAMOND DUST!` / `DIAMOND DUST USED` (the same with `FROZEN`). All damage
    goes through `S.X.hitMon`.
  - **Drift (E: this is the contract your file already follows).** The core owns the Drift and **both** its hits:
    the moving sweep (3 DK, r 2.5 round the centre, once per monster) and the eruption at the stop (4 DK, r 3.0, once
    per monster, a 0.5 s freeze), H's 3 + 4. It calls `driftSweep(ctx, D)` at the press and `driftSpikes(ctx, D)` at
    the stop, pictures only. `D` is `ctx.drift`, live: `{ from, to, dir, side, x0, y0, x, y, u, ph: 'sweep' | 'spikes' |
    'xform', r, spikeR, spikesAt, tier }`. Timing: kick 0.05 s, burst 0.32 s, stop and spikes 0.3 s, transformation
    0.8 s (`pose.xf` eased over it); the form and the menu change at its last frame. Cooldown 1.9 s from the press.
    A timeout or a defeat during a Drift exits without the switch.
  - **`ctx` for E** (everything `20k5w` gave, plus): `X, H, C, g, evo, tier (0/1/2), DK, TUNE, CLIPS, model, poseObj`;
    `form`, `vehicle` (live `S.V`), `drift`, `charge`, `left`, `now()`; `hit(m, dmg, o)`, `hitArea(x, y, r, dmg, o)`,
    `hitOval(cx, cy, rx, ry, ang, dmg, o)` with `o.once` (any object), `o.noCharge` (finishers), `o.noSmash`, the rest
    passed to `hitMon` (`freeze`, `chill`, `kb`, `el`, `src`); the two area hits smash the scenery inside them whether or
    not a monster is there; `smashArea`, `smashOval`; `freeze(m, s)` (= `H.bind`); `mons()`, `target()`, `aimPoint()`,
    `aimDir()`, `stick()`; `groundAt`, `canStand`, `canDrive(x, y, heading)`, `nearestStand` / `nearestLand`;
    `move(dx, dy)` (the body moved against the walls, smashing what it passes; true when a wall stopped it);
    `anchor(name)`, `scr(x, y, z)`, `T()`, `camera(o | null)`; `clip(name, u, extra)` and `pose(name, u, extra)`;
    `chan({ channel: value })` (raw pose overrides for this frame), `kick(channel, dv)`; `vanish()` (the model is gone:
    the exit skips its dissolve); `safeReturn()`; `done()`; `alive()`; `finisher` (the running finisher's key, else
    null), `frozenPlan` / `dustPlan` (yours to set).
  - **Clips (A's animation, on M's channels; springs carry the settle).** Mine, which E's `POSE` table maps onto:
    `cannon`, `somersault`, `wheel`, `burnout`, `backflip`, `lock`, `load`, `beam`, `crack`. These lift the body
    themselves (`extra.h`), so E leaves `vehicle.z` alone. E's own names are accepted too, with no lift of their own
    (`cannonLoad`, `cannonFire`, `wheelCurl`, `wheelRoll`, `wheelLand`, `pawLock`, `frozenLoad`, `frozenCharge`,
    `frozenFire`, `frostCracks`; `rest` clears). `burnout`'s `extra.spin` turns the body during Diamond Dust.
  - **M's channels:** I write the names in your note with your signs (`lean`, `steer`, `head` + to its left; `flip` +
    backflip). `gait` is in strides, `gaitK` 0..1. `z` and `vent` stay mine. `drift` is 1 through the skid.
  - **Rules of the session:** one timer (`dur` 20 / 25 / 35 s from the moment it can be ridden), one gauge
    (`chargeK` 32 x DK of damage actually dealt, never from a finisher), one outer cooldown (120 s, set once in
    `release`). Cooldowns: Ice Cannon 2.5 s, Strong 2 3.5 s shared by Somersault and Spinning Wheel, neither reset by a
    switch (`FM.TUNE.cannonCd` / `s2Cd` override them if E sets them). Ice Cannon does not lock the ride; Strong 2
    and the finishers do. A Strong or the Ult pressed during a Drift waits for its end. Timeout: the pet steps off to
    safe ground, the body cracks and dissolves, no finisher. A finisher's `done()` goes to the same exit.
  - **Open, for H and E:**
    - H: the `dust` scenario throws `Cannot read properties of undefined (reading 'spd')`, and the page error
      `reading 'art'` in `drawBoss` follows from it. Both come from turning an ordinary monster into a boss by setting
      `m.boss = true` (it has no boss definition), not from the session.
    - E / H: Frozen's tick count on one target varies with where the nearest monster stands (20 of 20 in one run, 0 or
      13 in others at the same build). The beam starts at the muzzles after a 1.5-tile backflip, so a target that
      was beside or just in front of the wolf can sit outside the oval's thin end. The ticks themselves fire 20 times.
- (E, built; replaces my proposal 1 where they differ) **`FENRIR_MOVES` as it stands in `20k8o`, wired to A's core as A built it.**
  - **Moves:** `iceCannon`, `somersault`, `spinningWheel`, `fenrirDust` (also `diamondDust`), `frozen`. Each calls `ctx.done()` once. The two finishers call `ctx.safeReturn()`, then `ctx.vanish()` with a burst of ice dust (no damage), then `done()`.
  - **Drift:** `driftSweep(ctx, D)` and `driftSpikes(ctx, D)` are **pictures only**, driven by A's live info object. A deals both Drift hits; I deal none.
  - **Poses:** I drive A's clips through `ctx.clip`:
    - `cannon` (0..0.35 load, 0.35..1 after each volley's kick);
    - `somersault` (u over 1.12 s, extra `{ h }`);
    - `wheel` (0..0.14 curl, ..0.86 roll with extra `{ spin }`, ..1 landing);
    - `burnout`, `backflip`, `lock`, `load`, `beam`, `crack`.
    - The clips lift the body themselves, so I don't write `vehicle.z`.
  - **Vehicle movement I do:**
    - `vehicle.heading` during the burnout spin;
    - x and y during Frozen's backflip (up to 1.5 tiles back, checked with `canStand`);
    - the Spinning Wheel roll through `ctx.move(dx, dy)`.
  - **Clock:** `ctx.g.t`.
    - Frozen's window is `[t0, t0 + 5.00]`.
    - Its 20 ticks land at `t0 + (k + 0.5) × 0.25` (0.125 s … 4.875 s), as many as are due each frame.
    - `ctx.frozenPlan = { t0, t1, ticks, tick, per, fired }`.
  - **Numbers:** H's suggestions are applied. `FM.stats = { shots, shatters, frozenTicks, dustHits, wheelHits }`.
  - **Diamond Dust freeze:** each ring freezes what stands inside it with `H.bind(m, 3)` as it rises. The shatter hit also carries `{ freeze: 3, chill: true }`.
  - **GPU:** `FM.GFX` draws the Frozen beam with one shader quad, as light only (alpha = brightest channel), laid `lighter`. It is used on real-GPU WebGL; `window.__FM_GL = 1` forces it and `0` forces 2D. Everything else is 2D.
  - **For H:** in `tests/fenrir.js` the `dust` scenario turns an ordinary monster into a boss (`boss.boss = true`), and the game's own boss code then throws (`reading 'spd'`, `reading 'art'` in `drawBoss`). That is the test's fake boss, not the move. A real boss, or a fuller fake, is needed.
  - **For A:** `FM.icons` has glyphs (`iceCannon`, `somersault`, `spinningWheel`, `diamondDust`, `frozen`) if you want them.
- (M, 2026-11-12, **model status, first full pass**)
  - Both forms, the transformation and every channel above are in and drawn on the GPU. About 15.7k triangles in the meshes, 33k drawn per frame over 47 part instances (one draw call each); the meshes build once in about 35–80 ms.
  - The legs, head, neck and barrels are deliberately chunky so they read at the game's scale.
  - **Clearance sweep** (sphere stand-ins, ice shards not included): the transformation is clear except a −0.07 graze between the front and rear upper legs of one side while they unfold (xf 0.36–0.61).
  - **For E and H:** with the real model, `tests/fenrir.js` showed Frozen landing 0 ticks on monsters in one run (the beam ran its 20 ticks). With A's stand-in it hit. My wolf muzzles are at about x 2.1 ahead of the centre and z 2.0 up; if the beam's volume starts from the muzzle anchors, check its reach on the floor. The other failures (`dust` reading `spd`, `drawBoss` reading `art`, elem-moves "lands damage") happen with the stand-in too.
  - **For A:** the pet is drawn at `maxH: 0.7`, which is large beside the machine at this scale; your call.
- (A, 2026-11-12, **size and rider, after the user's "as big as a sports car"**)
  - The model is drawn at `S.size = TUNE.len / FENRIR_MODEL.SIZE.bike.len` (3.24 / 3.102 = 1.044 today), so the
    motorcycle is 3.24 tiles long whatever M's units become; the wolf is the same parts at the same scale. **M: keep
    `SIZE.bike.len` true to the drawn motorcycle (nose of the fairing to the rear cowl) and the scale follows.**
  - The camera no longer pulls back while riding (`TUNE.zoom` 1, as the Sports Car), so the two are the same length on
    the screen. E's own `ctx.camera({ zoom })` for the finishers still applies.
  - The rider is drawn `TUNE.petH` = 0.5 tiles tall on the saddle (it was 0.7; the Sports Car's driver is 1.2 inside a
    cockpit); it shrinks into the saddle during the summon and grows back as it steps off.
- (H, 2026-11-12, **tests and audit on the built core, moves and first model**)
  - `tests/fenrir.js`: **46 checks, all pass at EVO 1, 4 and 7** (five runs in a row). Changes since the first draft:
    the `dust` scenario now uses a real lesser boss (`D.lesserBoss`): ordinary monsters frozen 2.98 s, the boss hit
    once, chilled 1.48 s, never frozen; Frozen is run at 20, 30, 60 and 144 fps with three targets held in a row in
    front of the wolf: exactly 20 ticks, 0.25 s apart, window 5.00 s, every target takes all 20 at every rate.
  - **Frozen's "0 / 13 / 20 hits" (A's report):** not a tick bug. Two causes, both the scene's: (1) the floor's monsters
    keep walking (even ones the test had rooted), so they leave the 2.6-tile-wide beam; (2) the beam locks on the
    nearest enemy and swings at 0.7 rad/s, so a newcomer walking up pulls it off the first target. With the targets
    held and no newcomers it is 20 of 20. One real limit to know (E): the beam is cut at the first wall with a minimum
    length of 3 tiles, so with a wall just ahead a target 3+ tiles out is not reached (seen in the audit before I
    moved the test spot); that reads as intended.
  - **`elem-moves`:** the 0 damage and the leftover effect were the harness, which did not know how to ride Fenrir or
    end it. It now drives circles, Drifts every 2.5 s, fires both Strongs and ends the summon (finisher if the gauge
    is full, else its deadline). `ELEM=ice ONLY=fenrir` passes at EVO 1 / 4 / 7 (damage 2010 / 3389 / 4781, 0 effects
    left). No core bug found.
  - **Rank (`tests/ult-damage-rank.js`, both finishers: `fenrir` = Diamond Dust, `fenrir+frozen` = Frozen after one
    Drift), one target, DK:**
    | evo | Dark Messiah | Supernova | Diamond Dust | Frozen | Titan | Judgement Day |
    |---|---|---|---|---|---|---|
    | 1 | 130 | 86 (max 104) | 95 | 95 | 89 | 38 |
    | 4 | 175 | 136 | 115 | 115 | 107 | 39 |
    | 7 | 210 | 151 | 125 | 125 | 111 | 35 |
    Dark Messiah stays first at every evo (lead 1.29-1.39x over the next). Note evo 1: Fenrir's finishers (95) sit
    just above Supernova's mean (86) though under its best run (104); fine by the brief ("near Supernova").
  - **Moves as built = my suggested table** (Drift 3 + 4, Ice Cannon 2 + 1.5 a projectile, Somersault 5 + 5, Spinning
    Wheel 10, finishers 95 / 115 / 125, `chargeK` 32). Measured on a lone target: Drift 7, Spinning Wheel 10,
    Somersault 5-10 (a target 3 tiles out catches one of the two phases), Ice Cannon 7 per volley pair that lands.
    **No coefficient change recommended.**
  - **Props:** the smash check passes with the current model at all three evos (3 props broken by Drifts and cannon
    shots in the run, no door, gate, stair or bridge touched).
- (M, 2026-11-12, **model round 2: heavier build; API unchanged**)
  - **Changed numbers A and E may notice:**
    - the wheels and their arches are drawn 1.16× (hub height 0.58 in the motorcycle), and the frame sits 0.08 higher;
    - the wolf stands 0.86 above the motorcycle's height (was 0.72), so `SIZE.seatZ` and the muzzle anchors are higher;
    - the legs have a third segment (a hock) and wider stance: paws at y ±0.68;
    - the head is about 1.25× round 1's;
    - `XF_STAGES`: cannons 0.04–0.3, legs 0.26–0.56 (the front pair leads the rear pair).
  - **`curl`** now folds the legs back to the frame, tucks the head down ahead of the chest wheel, flares the crests and wraps the tail under.
  - **Ice** is now fewer, larger blades with a sapphire-to-cyan gradient, white facet edges and a fresnel rim. `GLM.builder().crystal()` writes the place along a shard into the third vertex attribute for that gradient.
  - **Counts:** 19.6k triangles in the meshes, about 41k drawn over 51 instances.
  - **Clearance sweep:** worst −0.07 (the tail's root on the rear arch); curled, the tail tip sits −0.13 into the pelvis wheel's stand-in.

### M, model round 3 (2026-11-12): proportion and silhouette
- **Wheelbase**: the motorcycle's hubs are now 2.44 model units apart (2.1 wheel diameters); the wolf's 2.02. Pivots, carrier arms (0.65), shoulders and hips (x ±0.72) re-derived.
- **Size**: `VIS` 0.94 → 0.75, so `SIZE.bike.len` is unchanged at **3.3** (wid 1.28, hgt 1.5, r 1.2); `SIZE.wolf.len` is **4.5** (was 3.67; wid 1.35, hgt 1.95, r 1.43). A: nothing to change if you scale to `SIZE.bike.len`; the wolf is longer than before for the same scale, so check any wolf-length reach or hit radius you took from `SIZE.wolf`.
- **Anchors moved** (model units before `VIS`, wolf / motorcycle): `muzzleL/R` x 2.94, y ±0.35, z 2.35 / x 2.33, y ±0.77, z 0.71; `mouth` x 2.83, z 1.51 / x 2.0, z 1.42; `head` x 2.35, z 1.8; `tailTip` x -2.54, z 1.58 / x -2.31, z 1.79; `seat` x -0.22; paws at x 1.24 / -1.18, y ±0.7. E: read them from `anchor()` as before, but effects with fixed offsets from the old positions will sit short.
- **Looks**: the wheel faces are open (arches of stepped lames over the top only; the rear arch is the same mesh turned about as the rump); a long level body with a waist; a longer wolf head carried low and forward; cannons on the shoulders past the nose (wolf), low along the flanks (motorcycle); the tail is 6 longer links with two big blades each; the hip crest shrinks in the wolf and stands as the cowl in the motorcycle.
- **`curl`** now folds the cannons to the flanks as well. Stage order, channels and the API are unchanged.
- 55k triangles drawn (51 instances). `clearance`: 0.04 or more through the transformation from xf 0.65; `jaw`/`neck` are treated as joined (the neck tucks under the fairing in the motorcycle); in `curl` the tail still sits 0.06 into the rear arch.
- Checks with my page: `tests/fenrir.js` 46 ok, `elem-moves` ice/fenrir passed, `tests/susanoo.js` 49 ok, `elem-moves` dark/susanoo passed.
- (E, GPU round) **Every Fenrir effect now has a GPU path: `FENRIR_MOVES.GFX` (`FENRIR_GFX`) in `20k8o`.**
  - **How it is built:** each move paints through one painter (`glow`, `floorLight`, `iceRing`, `frostVeins`, `frozenPool`, `mist`, `beam`, `arc`, `shard`, `spark`). The same calls are drawn in 2D through the Ice kit, or batched for the GPU.
  - **What the GPU draws:**
    - crystals as real triangles, two facets a shard, shaded in the fragment shader (translucent sapphire-to-cyan body, bright ridge, cyan rim, noise fractures that light up as it cracks, a glint);
    - lights as one batch of shader quads;
    - particles (frost, glitter, chips, Diamond Dust's twinkle) as one batch of points;
    - the Frozen beam with its own shader.
  - **Budget:** at most 5 draw calls a frame, and two `drawImage` calls to composite (left half `source-over`, right half `lighter`). The output is valid premultiplied colour.
  - **When it runs:** on real-GPU WebGL. `window.__FM_GL = 1` forces it and `0` forces 2D. A lost context falls back to 2D.
  - **Gameplay is identical on both paths:** all hits, timings and hitboxes live in the fx updates. Only the pictures and the particle source differ.
  - **One layer:** the GPU layer is composited once, over the scene. Crystals fade softly round the rider's seat, except in the two finishers, which may cover the pet.
  - **M's ice shader:** I did not reuse `GLM`'s ice material. The crystals have their own small shader, matched to the Ice kit's look.

### M, model round 4 (2026-11-12): mass and wheel size
- **Scale**: `VIS` 0.75 → 1.06; the longer round 3 frame is gone. `SIZE.bike.len` stays **3.29** (wid 1.80, hgt 2.23, r 1.38); `SIZE.wolf.len` **4.88** (wid 1.91, hgt 2.44, r 1.70); `SIZE.seatZ` [1.35, 2.09]. A: same length as before, but the model is now about 1.4× wider and taller on screen for the same scale.
- **Proportions** (model units, L = 3.1): wheel diameter 1.16 (0.38 L), tyre 0.49 wide; hubs 1.8 apart in the motorcycle (0.58 L), 1.5 in the wolf; the wolf's spine at about 1.9, its wheels' hubs at 1.17. Upper and lower legs thicker, paws 1.25× in the wolf, head 1.35×, barrel 1.95 long.
- **Anchors** (model units before `VIS`, wolf / motorcycle): `seat` [-0.15, 0, 1.97] / z 1.27; `muzzleL/R` [2.51, ±0.35, 2.19] / [1.9, ±0.77, 0.7]; `breech` x 0.44 / -0.17; `mouth` [2.46, 0, 1.43] / [1.74, 0, 1.34]; `head` [2.03, 0, 1.68] / [1.27, 0, 1.52]; `tailTip` [-2.26, 0, 1.57] / [-2.05, 0, 1.81]; paws x 1.04 / -1.0, y ±0.74 (wolf); `wheelF/R` x ±0.9, z 0.58 (motorcycle). E: in world units everything is 1.06× these, so muzzles and paws sit about 1.2× further out than in round 3.
- Rig, stage order, channels, API, materials and ice unchanged. 55k triangles drawn.
- `clearance`: no overlap anywhere through xf 0..1 (least 0.01, the jaw over the front arch at xf 0.6), nor in `curl`, `gaitK`, `crouch`, `pawLock`; `tail`/`fender` now count as joined (the tail's root sits on the rump arch).
- Checks with my page: `tests/fenrir.js` 46 ok, `elem-moves` ice/fenrir passed, `tests/susanoo.js` 49 ok, smoke 0 errors.
- (A, 2026-11-12, **Jump, both forms** (the user: "add a jump button and function similar to beast machine and sport cars"))
  - `VEH.jump` (the JUMP button above Drift, the J key) -> `tryJump`. It runs inside `S.phase === 'ride'` as `S.jump`
    (`{ t, air, x0, y0, x1, y1, h, plan }`), never during a Drift, a finisher, the summon or the exit. No cooldown; a
    press in the air is kept for the touchdown (`S.jumpLand`); a Drift, a Strong or the Ult pressed in the air waits
    for the landing. Take-off protection 0.3 s at most once per 1.8 s (`S.invT`, `stats.jumpInv`).
  - The landing is planned before take-off (`planJump`, as the Sports Car's): along the stick, else the heading; walls
    and the map's edge stop the flight; it lands only where the whole body fits, on walkable ground the pet could walk
    from (`landOK`); nowhere to land = a hop on the spot. 0.1 s squat, 0.62 s in the air, 5.9 to 8 tiles by speed.
  - Landing: 2.6 DK once per monster within 2.6 tiles through `hitCharge` (it charges the gauge), the scenery in the
    same circle broken through `VEH_SMASH`, a frost ring and burst of mine. `stats.jump`, `stats.jumpHit`.
  - Animation on M's existing channels: motorcycle = squat (`susp`, `crouch`), wheelie (`pitch` up to +0.5), wheels
    spinning, nose down before the touchdown, compression on landing; wolf = `crouch` to 0.95 in the air with `pitch`
    arcing. **M, a wish, not a blocker:** a `tuck` 0..1 channel that folds the four legs up under the body would read
    better than `crouch` for the wolf's leap.
  - Tests: `tests/fenrir-jump.js` (13 checks).

### M, model round 5 (2026-11-12): surface polish, crystal glow, engine glow, `tuck`
- **New channel `crystalGlow`** (default 1, range 0..2): the light inside the ice blades (mane, crests, tail and cowl, head, neck) and their halo. It breathes slowly by itself; A: drive it above 1 with speed or while attacking, 0 switches the glow off. A pose without the key reads as 1.
- **New channel `tuck`** (default 0, 0..1; A's Jump wish): draws the wolf's four legs up under the body, paws hanging toes-down. It scales with the legs' unfold, so it does nothing in the motorcycle form. A: use it for the airborne part of the wolf's leap in place of `crouch`.
- **Two blues**: the crystals are sapphire to azure-cyan (`#3FA8FF` halo); the engine (the reactor, hub rings, the running gear's and legs' light strips, new material 20) is a deep electric violet-blue (`#6A4DFF` halo) and spills a faint violet light onto the underside of nearby armour. Eyes, head lights and the cannons stay cyan. `glow` still drives the engine and cyan lights.
- **Surface**: the armour shader gains a slow relief so plates are not flat, engraved chevrons, vent slots, small hazard inlays and brighter highlights; new geometry: brake calipers, toothed rings at the pivots and shoulders, a chain run on each wheel arm, sidewall ribs, turbine vanes and a bolt circle on the wheels, eye housings and a full row of teeth, heat-tinted exhaust tips (material 21). 63k triangles drawn.
- `GLM`: materials 20 and 21 and the per-item `glow2` / `spill` are additions; left unset they are 0 and Susano O draws as before.
