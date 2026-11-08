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
| Dive Bomb | about 3 DK, radius about 2.6, knockback; the whole dive about 0.8–1.0 s |
| Fireballs | 1/2/3 × about 3 DK, radius about 1.8 each, one explosion event per fireball (no separate direct hit); cooldown 2 s |
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
    kept 0.6 s; a press in the last 0.35 s of its cooldown is kept. **Cooldowns:** exactly 2 s (Fireballs) and 4 s
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
