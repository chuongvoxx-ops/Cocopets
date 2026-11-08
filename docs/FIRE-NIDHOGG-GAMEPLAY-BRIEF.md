# Nidhogg gameplay: 11th Fire ult (three workers: the Beast Machine team)

The user's spec, verbatim, is in `docs/elem-spec/fire-nidhogg.md`. Read all of it, especially §3–§11 and Verify.

The user has approved the model ("Looks awesome"). It lives in `src/js/20k6f-fire-nidhogg-model.js` as
`NIDHOGG_MODEL`; `docs/FIRE-NIDHOGG-BRIEF.md` covers its API, channels, clips, anchors, `turnDriver` and `drawSpin`.
**Do not restyle the model.** Small model tweaks needed for gameplay are fine, if they are minimal, commented and noted.

The row is already in `src/js/20k1-elem-core.js`: `['nidhogg', 'Nidhogg', 'dragon', 100, 120, ...]`, the 11th Fire ult.
The dev preview (`__pp.nidhoggPreview`) may stay. The real ult replaces it in play.

Reuse the proven vehicle systems. These are the precedents:
- Beast Machine: `src/js/20k9i-thunder-ult-11.js`, `20k9j`, `20k9k`, and `docs/THUNDER-BEAST-BRIEF.md` with its Notes.
- Sports Car: `src/js/20k4p`, `20k4q`, and `docs/LIGHT-CAR-BRIEF.md`.
- The VEH hooks in `src/js/20b-game-dungeon.js`.
- The shared smash helper `src/js/20k0v-vehicle-smash.js`. Nidhogg flies, so it doesn't smash props, except Dive Bomb and
  Ultima impacts, which may smash props in their area through the helper. That's optional, and must follow its protected
  list.

## User rules (standing)
- Never turn, yaw or twist the pet. It rides upright with its own sprite via `X.drawPetAt`.
- Performance: the user plays on an iPhone and a 2019 iMac. Use cached sprites and pooled projectiles and particles.
  Steady cost should stay at about 1.5 ms per frame or less while flying, with no hitch over about 6–8 ms. Reduce
  decoration on the low-effects setting, but never reduce counts or hits. Respect reduce-motion and shake settings.
- Feathered edges and light-only floor marks; effects never cover the pet.
- Never commit, never push, never touch `test.html`. Build your own page:
  `python3 src/build.py --test-only test-nid<1|2|3>.html`.

## Split (same workers and roles as Beast Machine)
| Worker | File | Owns |
|---|---|---|
| N1 (core) | `src/js/20k6g-fire-ult-11.js` plus small commented hooks in 20b, 12-arcade and tests | See below |
| N2 (Strongs) | `src/js/20k6h-fire-nidhogg-moves.js` | §6 Fireballs and §7 Flare |
| N3 (finisher) | `src/js/20k6i-fire-nidhogg-ultima.js` | §9–§10 Ultima: charge, beam, colossal explosion |

N1 (core) owns:
- `U.nidhogg` and its warm hook (model warm).
- §4 summon.
- §4 **real free flight**:
  - an aerial movement volume independent of ground navigation;
  - flying over gaps, water, cliffs and beyond the land outline into the open air;
  - no snapping back;
  - altitude: stable cruise height, climb over solid structures when there is clearance, respect really tall solids;
  - compact altitude controls if needed;
  - `turnDriver` snap-spins with `drawSpin` blur;
  - a camera that follows offshore, with the flight zoom of about 0.74 that the model worker used.
- §5 **Dive Bomb**, replacing Dodge:
  - zero cooldown, no hidden delay;
  - the next dive is accepted once the current dive and recovery finish, with a buffer;
  - target selection: the stick and aim, nearest enemy, or ground point, including aiming back at land from offshore;
  - invalid targeting over empty space shows an invalid marker and keeps flying;
  - one AoE damage event at impact; fire shockwave, embers, cracks;
  - pushes back up into flight.
- §8 Ultima meter, filled only by Dive Bomb, Fireballs and Flare damage, through `ctx.hit`.
- The Nidhogg HUD variant: crimson, orange and black buttons; Dive, Fireballs, Flare and Ultima icons; a remaining-time
  display.
- §11 exit:
  - maintain and revalidate a **safe return position** on valid land;
  - never eject over empty space, below the map or inside terrain;
  - the dismiss in fire;
  - restore everything;
  - start the 120 s cooldown at exit.
- Timeout and defeat handling, and stub moves so the core can be tested before the other files exist.

## Contract: `NIDHOGG_MOVES`
Each move file starts with:
```js
const NM = (self.NIDHOGG_MOVES = self.NIDHOGG_MOVES || {});
```
- N2 adds `NM.fireballs(ctx)`, `NM.flare(ctx)`, `NM.TUNE_S`, `NM.warmS(ms)`.
- N3 adds `NM.ultima(ctx)`, `NM.TUNE_U`, `NM.warmU(ms)`.

Each calls `ctx.done()` when finished and checks `ctx.alive()` on every delayed step. N1 starts the **exact** Fireballs
2 s and Flare 4 s cooldowns from the press of a complete activation (state the rule you choose). The spec says once per
activation, not per projectile.

`ctx` (built by N1, mirroring Beast's; document the final list in the brief's Notes):
- `ctx.X`, `ctx.C`, `ctx.H`, `ctx.evo`, `ctx.tier` (0/1/2), `ctx.DK`.
- Hitting:
  - `ctx.hit(m, dmg, opts)`: the only damage path. It returns the effective damage dealt (after mitigation, no
    overkill) and charges the meter unless `opts.noCharge` is set.
  - `ctx.hitArea(x, y, r, dmg, opts)`: one hit per living monster.
- Targeting: `ctx.target()` gives aimed enemy targeting `{x, y, m}`; `ctx.mons()`; `ctx.aimPoint()` gives a ground
  aim point, and `null` if it is over no ground.
- Ground queries:
  - `ctx.groundAt(x, y)`: true if there is a solid ground surface to impact, false over water, gap or void (fireballs
    over water may splash; state your rule);
  - `ctx.canStand(x, y)` and `ctx.nearestLand(x, y)`.
- The dragon:
  - `ctx.dragon`: `{ x, y, z /*altitude*/, heading, vx, vy, pose /*NIDHOGG_MODEL pose channels*/, locked, vis }`;
  - moves write pose channels such as `jaw`, `throat`, `vents`, `glow`, `trace`, `ring`, `ringSpin`, `core`, `heat`,
    `spread`, `pitch` and so on. N1 eases or passes them to the model.
  - `ctx.anchor(name)` returns world `{x, y, z}` from `NIDHOGG_MODEL.anchor` for `mouth`, `belly`, `vents`, the ring
    centre, the wing roots and so on.
- `ctx.scr(x, y, z)`: screen position.
- `ctx.camera(o)`: controlled camera framing or zoom requests (N3's Ultima needs a controlled pull-back), with bounded
  shake impulses.
- Lifecycle: `ctx.done()`, `ctx.alive()`. `ctx.ultima` is true while the finisher runs. N1 keeps `alive()` true
  through a started Ultima even on a won floor (cap it at about 14 s), as with Supernova and Judgement.
- `ctx.safeReturn()`: N3 calls this at the end to get the valid landing point for the pet's return. N1 then does the
  dismiss and restore.

## Balance starting points (state your final numbers)
DK = base × K × (1 + 0.08·(evo−1)).

| Move | Starting point |
|---|---|
| Flight | top speed about 10 tiles/s, responsive |
| Dive Bomb | about 3 DK, radius about 2.6, knockback; the whole dive about 1.4–1.7 s (round 3; was 0.8–1.0 s) |
| Fireballs | 1/2/3 × about 3 DK, radius about 1.8 each, one explosion event per fireball (no separate direct hit); cooldown 1 s (round 3; was 2 s) |
| Flare | 10/20/30 lances × about 0.5 DK with real collision; cooldown 4 s |
| Meter | dealt / (about 30 × DK) |
| Ultima beam | about 0.6 DK per 0.15 s tick for about 1.5 s on enemies in the beam's impact radius |
| Ultima explosion | about 14 DK once per enemy in the visible dome radius (about 6–7 tiles) |

Ultima's damage is `noCharge`. Durations are 20/25/35 s (configurable). The cooldown is 120 s from exit.

## Checking
- `ELEM=fire ONLY=nidhogg EVO=1|4|7 HTML=<page> node tests/elem-moves.js` must pass. N1 adapts the harness as was done
  for beastmachine.
- `ELEM=thunder ONLY=beastmachine EVO=4` and `ELEM=light ONLY=sportscar EVO=4` must stay green.
- Smoke, by the scratch-copy method.
- Each worker writes a logic test covering the spec's Verify items in its area.
- Montages go in `/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/nidhogg/`:
  - N1: `core.png` (summon, flight offshore, the dive bomb chain, the HUD, exit)
  - N2: `strongs.png`
  - N3: `ultima.png`, plus `ultima-play.gif` if you can
- Report concisely. Append dated Notes below when the contract changes.

## Notes
- (N1, 2026-11-08, the core's contract; `20k6g-fire-ult-11.js`. All additive to the brief's list)
  - Conventions as Beast: world tiles (`x`, `y` map tiles, `z` height in tiles), angles are map directions
    `(cos a, sin a)`. `ctx.H` is the DunElem toolkit (H.add, H.living, H.sx/sy ...), `ctx.X` = `H.X`.
    `ctx.model` = `NIDHOGG_MODEL`. `ctx.tier` 0/1/2, `ctx.evo`, `ctx.DK`.
  - Damage only through `ctx.hit(m, dmg, opts)` (returns effective damage; `opts.noCharge`; other opts go to hitMon:
    `kb`, `burn` ...) and `ctx.hitArea(x, y, r, dmg, opts)` (monster circle overlaps r; `opts.exclude` = a monster or a
    Set). Never `X.hitMon` / `H.hitArea` directly.
  - Targeting: `ctx.target()` -> `{x, y, m}`: with the stick pushed, the enemy nearest the aim line (within 0.5 rad,
    reach ~11); with no stick, the nearest enemy within 11; else the aim point (m = null). `ctx.aimPoint()` -> the
    ground point along the stick (from 4.5 tiles, else the first ground met from 2 to 9 tiles out, so a dragon offshore
    can strike the land's edge), or just below / ahead of the dragon with no stick; `null` over no ground.
    `ctx.aimDir()` (angle), `ctx.stick()` `{x, y, mag}`.
  - Ground: `ctx.groundAt(x, y)` true only on walkable floor inside the map (not wall tops, water, pits, lava, sky or
    off the map). `ctx.surfaceAt(x, y)` -> 'floor' | 'wall' | 'gap' (water, pits, lava, sky) | 'void' (off the map), for
    N2's rule (my suggestion: a fireball explodes on 'floor' and 'wall', fizzles with a splash over 'gap', and keeps
    falling / fades over 'void' with no damage). `ctx.canStand`, `ctx.nearestLand(x, y)`.
  - The dragon: `ctx.dragon = { x, y, z, heading, vx, vy, pose, locked, vis, high }`. `pose` is the model's pose
    object itself (shared). **Pose ownership:** while a Strong or Ultima is busy, N1 does NOT run its flight clip:
    the move drives the pose every frame, e.g. `ctx.model.CLIPS.fireball.run(P, t, dt, { n })`, `.flare`, `.ultima`,
    `.beam`, `.settle` (from its own `H.add` fx update). N1 still runs the snap-turn driver (it writes `bank`,
    `tailSwing`, `headYaw`, a flap burst during a spin) unless `dragon.locked`, and keeps the flight (position and
    altitude) going unless locked. After `ctx.done()` N1's fly/hover clip takes over again and the effect channels
    (jaw, throat, vents, glow, trace, ring, core, heat) relax to 0 by themselves.
  - Strongs are not locked by N1 (the dragon keeps flying; set `dragon.locked = true` yourself if a move must hold it;
    put it back before `done`). One Strong / dive at a time: a Strong pressed while another move or a dive runs is
    kept 0.6 s; a press in the last 0.4 s of its cooldown is kept. **Cooldowns:** exactly 1 s (Fireballs; round 3, was 2 s) and 4 s
    (Flare), counted from the press of the activation, once per activation; a new activation cannot start while the
    previous one is still running (it waits for `done`).
  - Ultima: N1 sets `dragon.locked = true`, `ctx.ultima = true`; N3 owns x / y / z / heading and the pose until
    `done`. `ctx.camera(o)`: `{ zoom (0.5..1.1), x, y, k (0..1: how far the view leans to x, y), shake }`; a later call
    merges; `ctx.camera(null)` gives the camera back (N1 also resets it at `done`). `ctx.safeReturn()` -> `{x, y}`: the
    validated landing; call it when you start settling, then `ctx.done()`. N1 then glides the dragon to that point,
    plays the `dismiss` clip, sets the pet down there and restores. `alive()` stays true through a started Ultima even
    on a won floor (cap 14 s).
  - Anchors: `ctx.anchor(name)` = `NIDHOGG_MODEL.anchor` of the last drawn frame (`mouth`, `head`, `eyes`, `chest`,
    `belly`, `seat`, `wingL/R`, `wingTipL/R`, `ventL/R`, `ring`, `tail`, `tailTip`), falling back to the dragon's
    position before the first draw. `ctx.scr(x, y, z)`, `ctx.T()`.
  - Optional hooks N1 calls: `NM.update(ctx, dt)`, `NM.drawUnder(ctx, c)` (floor layer), `NM.drawOver(ctx, c)` (over
    the actors); `NM.warmS(ms)` / `NM.warmU(ms)` in idle time and during the summon/flight (one per frame, ≤ 2 ms; return
    true when done). `ctx.calm()`, `ctx.low()`, `ctx.sfx`.
  - Debug: `g._nidhogg` (phase 'summon' | 'fly' | 'ultima' | 'out' | 'gone', `charge`, `left`, `dragon`, `ctx`, `stats`,
    `safe`), `ELEM_IMPL.fire.ult.nidhogg.__dbg`.
  - 20b hooks added: `X.air()` -> `{ w, h, tile(tx, ty), hand }` and a `VEH.cam()` camera focus beside FD/RIFT's.
- (N3, 2026-11-08, Ultima; `20k6i-fire-nidhogg-ultima.js`; additive) `NM.ultima(ctx)` drives the pose with the model's
  own clips (`ultima` played 1.15x = 4.52 s, then `beam` 1.5 s, then `settle` 1.6 s) and owns `dragon.x/y/z/heading`
  while it runs: it faces the impact, glides (during the first 1.1 s of the charge) to 3.8-7 tiles from it, rises with the
  clip's `dz`, and is pushed back 0.35 tiles by the beam's recoil. Impact: the crowd round `ctx.target()` (else
  `aimPoint()`, else ahead), pulled back onto `groundAt` ground (else `nearestLand`). Damage: 10 beam ticks, one every
  0.15 s from 4.67 s, `ctx.hitArea(ix, iy, 1.8, 0.6 DK, {noCharge, kb: 0})`; one explosion at 6.07 s,
  `ctx.hitArea(ix, iy, R, 14 DK, {noCharge, kb: 6})` with R = 6.0 / 6.5 / 7.0 tiles by tier (the dome's base and the
  ring drawn on the floor through the beam). `ctx.safeReturn()` is called once at the settle's start (6.42 s),
  `ctx.done()` at 8.0-8.25 s; the cloud then fades on its own (its fx keeps running ~2 s after done, touching nothing
  of the dragon). Camera: `ctx.camera({ zoom: 0.6, x, y, k: 0.7 })` at the press, `{ zoom: 0.57, x, y, k: 0.8 }` at the
  explosion, `{ shake, dur }` impulses (scaled 0.35 under reduce motion), `ctx.camera(null)` at done.
  Read-only `ctx.ultimaPlan = { x, y, beamR, blastR, ticks }`, `ctx.returnPoint`. `NM.warmU(ms)` bakes in ≤ ~2 ms
  slices (about 130 ms in all); the act also warms 1.5 ms a frame from the press. Test: `tests/nidhogg-ultima.js`.
- (N2, 2026-11-08; `20k6h-fire-nidhogg-moves.js`, additive)
  - Draws through its own `H.add` fx (key `'nidhogg-strongs'`); does not use `NM.update/drawUnder/drawOver`.
    `NM.warmS(ms)` bakes 21 sprites, pixel sprites painted a few rows per call (worst call ~5 ms in SwiftShader).
  - Pose: while busy (until `done`) each move drives the whole pose: `ctx.model.CLIPS.fireball.run(P, t, dt, { n: 0 })`
    / `.flare` for wings and body, then its own `throat`, `jaw`, `headPitch`, `neckCurve`, `pitch`, `glow`, `core`
    (Fireballs) or `vents`, `glow`, `heat`, `spread` / `pitch` kicks per fan (Flare). Neither locks the dragon.
  - `ctx.done()`: Fireballs 0.3 s after the last release (0.5 / 0.85 / 1.2 s after the press); Flare 0.25 s after the
    last launch (0.7 / 1.0 / 1.3 s). Projectiles in the air afterwards keep flying and can still hit.
  - Reads `ctx.target()` (aimed enemy first; its point if m is null), else `ctx.aimPoint()`, else the nearest enemy
    within 10, else 4.5 tiles ahead; `ctx.surfaceAt` (rule: 'floor' burst, 'wall' burst, 'gap' steam / no damage,
    'void' falls away / no damage), `ctx.mons()`, `ctx.anchor('mouth' | 'ventL/R' | 'wingL/R' | 'ring' | 'seat')`.
  - Damage: Fireballs one `ctx.hitArea(x, y, 1.8, 3.0 DK)` per fireball (no direct hit); Flare one `ctx.hit(m, 0.5 DK)`
    per lance on its first swept contact. When `ctx.alive()` turns false nothing more launches and the rest burn out
    with no damage; `done()` is still called once.
- (N1, 2026-11-08, after end-to-end with 20k6h and 20k6i; fixes for N3)
  - `ctx.camera` honours the framing point: `{ x, y, k }` leans the view k of the way from the dragon to (x, y) (an explicit
    `k: 0` is kept; with x / y and no k it is 0.6); `zoom` is clamped 0.5..1.1; calls merge; `null` hands it back.
    Shake follows Reduce Motion (none at all under it) and is capped at 10 / 0.5 s.
  - While `dragon.locked` during Ultima (or a move that locks), the turn driver follows `dragon.heading` (no snap-spin,
    no blur) instead of overwriting it; N1 takes the heading back after `done`.
  - The early-press window for a Strong is 0.4 s (was 0.35). A queued Ultima press is kept 3 s (through a dive and its
    recovery, ~1.9 s). Dive Bomb's slam is one plain hit (no burn ticks on top).
  - The safe return point snaps to its tile's centre when that is open (a point on a wall's margin could be nudged in).
  - Tests: `tests/elem-moves.js` (nidhogg: circles, a dive every 2 s, Strong 1 at 6 s, Strong 2 at 8.5 s, then Ultima if
    full else timeout; tail 22 s). N1's Verify-list test: `scratchpad/nidhogg/n1/logic.js` (pass the page path).
- (N1, 2026-11-08, the "split apart" dragon: cause and fix; core only, the model untouched)
  - Cause: not the draw calls (same T, scale, pose, turn-driver heading as the preview) but the model's per-heading
    bake. (1) The idle warm-up and the cast passed different scales to the model's `setScale` (`Tz()` = TS x zoom, the
    zoom differs between floor start and cast); a higher k makes the model discard every baked picture, so the dragon
    flew on a near-empty cache. (2) On a cold cache a piece whose heading is not baked is drawn from another heading (or
    dropped), so head, neck, body, tail and the seat came out of step. The preview and studio sweeps were always warm.
  - Fix: one bake scale per floor (TS x dpr x the 0.74 flight zoom: the dragon's drawn size in flight, ~45% less bake
    work), used by both `U.nidhogg.warm` and the cast; a bake within 25% is kept. The dragon is only ever drawn at a
    heading whose whole picture set is usable; if the heading it should face is not ready yet it is drawn whole at the
    nearest ready one (with the spin-only channels bank / headYaw / tailSwing straight for that frame), while the wanted
    heading is queued first and baked at 4.5 ms a frame (the model's ≤ 3 ms slices); the summon's reveal waits for one
    usable heading (cap 4 s). `U.nidhogg.warm` also pumps the model's bake on idle time (≤ 8 ms of each idle period).
  - Check: `scratchpad/nidhogg/n1/connected.js warm|cold` draws the form's own `drawEnt` each sampled frame (333 frames:
    8-way circle twice, reversals, a dive, Fireballs, Flare, offshore, Ultima) and counts 4-connected alpha > 0.55
    pieces > 25 px, without the spin streaks / ghosts and the ring's floating segments: 0 splits warm and cold.
  - Limit: a truly cold cast (cast before the idle bake has run) shows the dragon facing the nearest baked heading for
    its first seconds of flight. On SwiftShader the first usable heading costs ~1.1 s CPU and each further one ~0.9 s
    (the head and jaw are baked near their drawn size, `PCAP`); real devices should be several times faster.
- (N1, round 2, 2026-11-08; the user: smaller by 35%, no cruise/high button, a Drift-like spinning Dive Bomb)
  - Size: the dragon is drawn at `TUNE.size` 0.65 of the model (`o.scale` on draw / drawSpin / drawShadow; anchors and
    the spin streaks follow it). Flight zoom 0.74 -> 0.9. Cruise height 2.6 -> 2.2 tiles, wall clearance 3.4 -> 3.0.
    The rider is drawn at maxH 0.85 (was 1.0) to sit in the smaller seat. The bake scale follows (TS x dpr x 0.9 x 0.65).
    Full bake (SwiftShader, 88 pictures): dpr 1.5 11.2 s / 4.6 MB -> 8.9 s / 3.4 MB; dpr 2 (game cap) 16.4 s / 7.6 MB ->
    10.7 s / 4.6 MB. N2's and N3's effects are all anchor-based (mouth, vents, seat, ring) and line up unchanged; no
    edits to 20k6h / 20k6i. Gameplay radii and damage unchanged.
  - Altitude toggle removed: no HUD button (VEH.noJumpBtn, so 20b leaves no slot), J does nothing, no `dragon.high`.
    One cruise height plus the automatic climb over walls with clearance.
  - Dive Bomb: spin (0.2 s, one full turn plus the turn to the target, through the turn driver: ghosts, wingtip streaks,
    bank kick, tail whip) -> plunge (0.32 s) -> slam at 0.52 s (one AoE hit, 3 DK, r 2.6, unchanged) -> hold 0.08 s ->
    a second full spin while climbing back (0.3 s). 0.9 s in all (was 1.88 s). Zero cooldown; a press in the last 0.3 s
    is kept; the invalid marker as before. No sweep hits on the way down (the spec's "one damage event at impact"). The
    rider rolls one flat 2D turn per spin through drawPetAt's `rot` (never a yaw), kept down on the seat while rolled
    or pitched. The model's `dive` clip is retimed to this cadence.
  - Checks: `connected.js` now also samples every frame of three more dives: 0 splits warm (4 runs, ~490 frames each)
    and cold. Logic test: two spins per dive, one full rider roll per spin, slam at ~0.52 s, dive 0.8-1.0 s.
- (N1, round 3, 2026-11-08; the user: frozen dragon, rigid quick turns, Fireballs 1 s, a heavier Dive Bomb)
  - The frozen dragon: a cold cache drew the dragon at the nearest baked heading, straightened, until the bake caught
    up. On an iPhone this lasted seconds because Safari has no `requestIdleCallback`, so the floor-start warm-up hardly
    ran (the model's fallback is 2.5 ms every 40 ms, and N1's pump never started). Fixes, all in 20k6g, none in the model:
    - the warm-up pump now runs on every browser, as a slice after each frame sized to the frame rate it measures
      (3 ms at 60 fps, 1.6 ms when frames run late, 0.8 ms below ~30 fps);
    - `bakePlan()` rewrites the model's queue in this order: segments; the quick half-size pictures of every other
      heading, nearest first; the sharp pictures of the facing heading and the next one in the turn; the other quick
      pictures; the rest sharp, nearest first. Once the 8 even quick sets are in, every heading is drawable: the model
      maps a neighbour's pictures within 22.5 deg onto the true heading. The model's draw re-queues the drawn heading
      every frame, so the plan is redone whenever it has;
    - the summon bakes at 10 ms a frame (8 ms once something is drawable). On a cold cache it then hovers, flapping, at
      the end of the summon until every heading is drawable (`TUNE.readyHold`, at most 6 s);
    - the dragon is drawn at its true heading whenever one of the two baked headings around it is usable. If only one is
      (early in a cold cast), its bank is halved for the draw so the mapped torso keeps the rider's seat;
    - measured in real time on SwiftShader at dpr 2 (k 56). The game itself runs only 24-30 fps there, slower than an
      iPhone:

      | Case | Result |
      |---|---|
      | Floor-start warm-up, no cast | every heading drawable 25.9 s, all usable 59 s, all sharp 173 s |
      | Cast 0.3 s into the floor (fully cold) | dragon visible 2.5 s after the press; flies at 9.9 s (summon 3.4 s + 5.9 s hover) |
      | Cast 0.3 s into the floor, dpr 1.5 | flies at 7.4 s |
      | Cast 15 s into the floor | flies at 3.8 s (no extra hover) |
      | Cast 30 s into the floor | already drawable before the cast |

      In every case, 0 frames were drawn at a stand-in heading in flight (`coldcast.js`).
  - Smooth turns (`TUNE.turn`): flight no longer snap-spins (`turnDriver` is still created, but not used for flight).
    - The heading follows the stick at up to 5 rad/s. It closes the gap with k 7, and the turn rate eases in and out at
      26 rad/s2: a reversal takes about 0.75 s.
    - The fly clip gets the turn rate as its `turn` hint: bank into the turn, the head leading, the tail counter-swinging.
      The tail also lags on an underdamped spring, and the wings flap harder in hard turns.
    - The motion blur comes from a stand-in turn driver handed to `drawSpin`. Its ghosts are taken from the recent
      heading history (2 in flight, 3 in a dive) and its wingtip streaks span the last 0.16 s. Both are scaled by the turn
      rate over the last 0.1 s, from 0 at 1.6 rad/s to full at 4.6 rad/s, so gentle turns are clean.
  - Dive Bomb, 1.56 s in all (+ a 0.05/0.08 s hit-stop at the slam; none with reduce-motion):
    - wind-up spin 0.26 s (snappy, eased in-out, rearing 0.4 tiles);
    - accelerating plunge 0.30 s; slam at 0.56 s;
    - impact hold 0.10 s (it sinks into the slam);
    - grind on the ground 0.62 s: one full turn, fast off the slam (~22 rad/s) and running down (ease-out 2.2); wings
      spread and dragging, a lean, the tail swinging; a dust and ember swirl flung off the wingtips and tail;
    - push-off 0.28 s: a downstroke flap, a dust burst and a climb back to cruise.
    - Unchanged: zero cooldown, the press buffer (last 0.3 s), one AoE hit at the slam, one flat rider roll per spin.
  - Fireballs' cooldown is 1 s from the press (`TUNE.cdFire`). N2's own `TUNE_S.fireballCd` still reads 2.0: it is only
    documentation, since 20k6g owns the cooldowns. Fireballs are busy 0.5 / 0.8 / 1.1 s by tier, so at EVO 7 a new
    volley waits for the last one to end.
  - Checks:
    - `connected.js`: warm and cold now include continuous circles at 0.8 / 2 / 3.5 / 6 rad/s. The sweep sets `S.dur`
      as well, since it runs longer than a form;
    - logic test: smooth reversal (per-frame step at most the cap, between baked headings, 0.75 s, blurred); a gentle
      analog curve at 1.2 rad/s (no blur); the grind slower than the wind-up and decelerating; the dive 1.4-1.7 s;
      Fireballs 1 s.
