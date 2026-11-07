# Sports Car — 11th Light ult (two workers)

The user's spec, verbatim: `docs/elem-spec/light-sportscar.md`. Read all of it. The row is already in
`src/js/20k1-elem-core.js`, set to `['sportscar', 'Sports Car', 'dash', 100, 120, ...]`. Don't edit the row. Light now
has 11 ults; `ELEM_ULT_LV` already has 11 entries.

## User bar (standing preferences)
- Performance: the user plays on an iPhone and a 2019 iMac. Bake the car body, wheels, hearts and stars into cached
  sprites. Bake lazily on a small per-frame budget, plus a `U.sportscar.warm` idle hook (20b calls `.warm` for ults).
  Keep any single frame from hitching more than about 6 ms, and keep the steady cost under about 1.5 ms per frame while
  driving.
- Effects: feather every edge. Floor marks are light-only (pink-white light and fading smoke, no dark stains). Effects
  must never cover the pet; the pet stays visible in the driver's seat. Clean up fully afterwards.
- **Never turn, yaw or 3D-twist the pet.** The user rejected that. The car may rotate to its heading (it's a vehicle,
  drawn from baked angle buckets or a rotated top-down/3-quarter sprite), but the pet sitting in it is drawn upright
  with its normal sprite.
- No reference art is copied into the repo.
- Never commit, push or touch `test.html`. Each worker builds its own page:
  `python3 src/build.py --test-only test-car<1|2>.html`.

## Study first
- `src/js/20b-game-dungeon.js`: `useUlt`, the strong-attack dispatch around line 776 (`CDK`, `SSL`), `dodge()` at ~716,
  input around ~1385 (`K.dodge`), the touch/HUD buttons and the ult icon drawing, `hitMon` (what it returns, whether
  you can get damage dealt after mitigation without overkill), party swap (`swap`, ~620), `me.petAlt`, `me.push`,
  `me.inv`, `drawEnt` depth sort, and `DunElem.refuse` with its useUlt refuse hook.
- Precedents:
  - `20k5p` Demon Blade: free movement while a move holds the pet.
  - `20k2j` Titan: baked pose sprites; the pet hides and reappears.
  - `20k5q` Day of the Dead: refuse hook, X proxy, and cooldown handling.
  - `20k3j` Zephyr's Blessing: a long-running ult with its own timer.
- Light look: `20k4b`–`20k4j` (ults) and `20k4k`–`20k4o` (Strongs at ult quality). Light palette is in 20k1:
  `#FFB3E0`, core `#FFF4FC`, dark `#C2508F`. Add pearl white `#FFF8FB` and gold `#FFD86B`.

## Split
| Worker | File | Owns |
|---|---|---|
| C1 (core) | `src/js/20k4p-light-ult-11.js` + small commented hooks in `20b` (and `20d` if needed) | See C1 below |
| C2 (moves) | `src/js/20k4q-light-car-moves.js` (no 20b edits; ask C1 via the contract below if one is needed) | See C2 below |

**C1 (core) owns:**
- the ult `U.sportscar`
- summon ritual (heart seal, ribbons tracing the car)
- car model and paint, baked
- driving and steering with wheel spin and lean
- swept contact damage with per-enemy gating
- Drift (replaces Dodge)
- the temporary control swap: scarlet Drift button with a tyre-track symbol; Strong buttons show Shooting Star and Love
  Sensation; ult icon becomes the Supernova meter (pink-gold ring fill, star+heart emblem, SUPERNOVA ready pulse)
- Supernova charge accounting
- timeout dissolve
- pet defeat, party swap and encounter cleanup
- the 120 s cooldown, starting at exit
- suppressing normal attacks
- restoring the loadout and cooldowns untouched
- sounds via the existing `api.sfx`

**C2 (moves) owns:**
- Shooting Star (radial star-missile volleys with real projectile hits)
- Love Sensation (jump arc, landing marker and shadow, one landing AoE, wall-safe landing point)
- Supernova (burnout poses and pulses, implosion, the one final explosion, the pet ejection arc and safe landing)
- all their sprites, effects and sounds

## Contract between C1 and C2
C2 defines a global in its file, which loads after C1's:
```js
const SPORTSCAR_MOVES = {
  TUNE: { ... },                 // volley count, missiles, speed, damage coefficients, cooldowns, burnout count, etc.
  shootingStar(ctx) {},          // returns nothing; calls ctx.done() when the action is finished (C1 then allows the next press)
  loveSensation(ctx) {},         // ditto
  supernova(ctx) {},             // the full finishing sequence; calls ctx.done() after the pet has landed safely
  warm(budgetMs) {},             // optional: bake C2's sprites; C1 calls it from U.sportscar.warm and while driving
  drawUnder(ctx, c) {}, drawOver(ctx, c) {}   // optional per-frame draws C1 calls inside its own draw (floor layer / above car)
};
```
C1 looks it up at call time (`typeof SPORTSCAR_MOVES !== 'undefined'`), so file order doesn't matter at load.

C1 builds `ctx` once per transformation:

**State (read/write):**
- `ctx.X`: the ult's X toolkit
- `ctx.C`: the ult's C (evo, K, base)
- `ctx.car`: the live car `{ x, y, a /*heading rad*/, vx, vy, speed, z /*height*/, susp /*0..1 squash*/, lean, slide /*drift angle*/, glow /*0..1 headlight+hub boost*/, scale, locked /*true = C2 owns movement*/, contact /*false = no ramming damage*/ }`
- `ctx.evo`

**Damage and charge:**
- `ctx.hit(m, dmg, opts)`: the only way C2 deals damage. It calls hitMon with `el: 'light'`, works out the real damage
  dealt (after mitigation, no overkill, 0 for misses or invulnerable targets) and adds charge unless
  `opts.noCharge`. Supernova passes `noCharge: true`.
- `ctx.hitArea(x, y, r, dmg, opts)`: one hit per living monster within r. It uses ctx.hit and returns the count.

**Helpers:**
- `ctx.canStand(x, y)`: walkable tile, not wall, inside the arena
- `ctx.nearestStand(x, y)`: the closest walkable point
- `ctx.target()`: the existing targeting/aim pick, giving `{x, y, m}`
- `ctx.done()`
- `ctx.alive()`: false once the form has been cancelled (pet down, encounter end or reset). C2 must check it in every
  `after()` and stop.

**Pet visibility:** for the ejection arc, C2 sets `ctx.petZ` and `ctx.petX/petY`. C1 draws the pet from those while
`ctx.ejecting` is set.

**Lifecycle, enforced by C1:**
- While a C2 action runs (`car.locked`), C1 ignores steering input, Drift and the other move buttons.
- Supernova: C1 checks the meter is full and that this is the first use, sets `car.contact = false`, `car.locked = true`
  and `ctx.supernova = true`, and calls `SPORTSCAR_MOVES.supernova(ctx)`. It ignores the timer from then on, because a
  started Supernova finishes. After `ctx.done()`, C1 removes the car, restores everything and starts the cooldown.
- Timeout with no Supernova: C1 dissolves the car into hearts and stars and sets the pet down.

**Integration:** C1 makes the whole flow testable with a stub `SPORTSCAR_MOVES` if C2's file isn't there yet. C2 tests
its moves with a stub ctx/car built in a scratch harness (a car parked at the pet's position), then end to end once C1's
file exists. The two of you may message each other through files: append notes to `docs/LIGHT-CAR-BRIEF.md` under a
"## Notes" heading if the contract has to change. Read it before relying on anything.

## Balance starting points (state your final numbers)
- DK = base × K × (1 + 0.08·(evo−1)), as for the other ults.
- Ramming: about 0.6 DK per hit, gated at 0.45 s per monster per pass, and only while the car is moving above about 40%
  of top speed. A parked car deals no damage.
- Drift: about 2.2 DK once per monster per activation. Cooldown starts from the dodge cadence (0.85 s) and goes to about
  1.6 s. While drifting, ramming damage is suppressed for monsters the drift has already hit.
- Shooting Star: 3/4/5 volleys of 10/12/14 stars (L1/L4/L7), about 0.35 DK each, cooldown about 2.6 s.
- Love Sensation: one landing AoE of about 3.2 DK in a radius of about 2.4 tiles, cooldown about 3.2 s.
- Supernova: 3/4/5 burnout pulses of about 1.6 DK, rising, then a final blast of about 6 DK. One explosion hit per
  monster.
- Meter: charge = dealt / (about 14 × DK at the current evo), so about 20–30 s of active driving fills it. Tune it so a
  normal L1 run fills it before 20 s with active play.
- Durations 20/25/35 s at evo 1–3/4–6/7, starting when the car becomes controllable. Cooldown 120 s, starting at exit.

## Checking
- `ELEM=light ONLY=sportscar EVO=1|4|7 HTML=<page> node tests/elem-moves.js` must pass. C1 may need to make the test
  harness drive the car or press Supernova; keep any test edits small and commented.
- C1 also runs `node tests/smoke.js` against its page (or note how) and a scratch logic test covering every item in the
  spec's "Verify" list.
- Montages go in `/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/sportscar/`, e.g.
  `core.png` (summon, driving, drift, HUD swap, timeout) and `moves.png` (Shooting Star, Love Sensation, Supernova,
  ejection). Look at them and iterate to the bar. Adapt `.../scratchpad/rocky/shot.js` or `.../dracula/shot.js`.
- Report briefly: files, numbers, ms costs, what was tested and what wasn't.

## Notes
- (C2) Assumptions in `20k4q-light-car-moves.js`, tell me here if any is wrong:
  - `ctx.X` is the DunElem toolkit `H` the ult receives (has `.add`, `.X`, `.sx/.sy`, `.living`, `.n`, `.GY`). If you pass
    the raw game X instead, put `H` on `ctx.H`; C2 uses `ctx.H || ctx.X` and checks for `.add`.
  - C2 draws everything through its own `H.add(...)` fx (drawUnder = floor layer, draw = over the ents), so
    `SPORTSCAR_MOVES.drawUnder/drawOver` are not defined; nothing for you to call each frame except `warm`.
  - Shooting Star does not move the car and does not set `car.locked`; you may keep steering during it (or lock it, your
    call). Love Sensation sets `car.locked = true` and `car.contact = false` itself, moves `car.x/y/z/susp`, zeroes
    `vx/vy/speed` on landing and restores `locked = false` and the previous `contact` before `ctx.done()`.
  - Supernova: you set locked/contact/supernova as agreed. C2 zeroes `car.vx/vy/speed`, then owns `car.x/y/a/susp/glow`.
    During burnouts C2 sets `car.burn = 1` (0..1, wheels spinning furiously in place) and `car.wheelSpin` (rad/s, an
    override for the wheel turn rate while set; delete when 0). Please honour them in your wheel drawing if you can.
  - At the final explosion C2 sets `car.gone = true` (please stop drawing the car body and the seated pet then) and
    `ctx.ejecting = true` with `ctx.petX/petY/petZ` (tiles; petZ in tiles above the floor). On landing C2 sets
    `me.x/me.y` to the safe landing point (checked with ctx.canStand along the arc), `ctx.petZ = 0`, then `ctx.done()`.
  - Car footprint assumed `car.len || 2.4` by `car.wid || 1.2` tiles times `car.scale || 1` (wheel/headlight anchors
    for C2's smoke, hub and headlight glows). If your car exposes different numbers, set `car.len/car.wid`.
  - Cooldowns live in `SPORTSCAR_MOVES.TUNE.cd = { shootingStar, loveSensation }` (seconds); C2 calls `ctx.done()` when
    the move's committed part is over (Shooting Star: after the last volley leaves; its missiles fly on).

## Notes
- (C1, contract additions, all backward-compatible; C1's file is `20k4p-light-ult-11.js`)
  - `ctx.H` is the DunElem toolkit the ult was cast with (H.add, H.P, H.glow, H.sphere, H.burst, H.living, H.sx/sy ...);
    `ctx.X` is `H.X` (20b's toolkit: sfx, shake, flash, light, part, ring, text, after, Tz, walkPoint, blocked, moveEnt).
    Never call `X.hitMon` / `X.hitArea` / `H.hitArea` directly: use `ctx.hit` / `ctx.hitArea` so charge is counted once.
  - `ctx.DK` = base x K x (1 + 0.08 (evo-1)); `ctx.tier` = 1 / 2 / 3 (evo 1-3 / 4-6 / 7). `ctx.T()` = tile px now;
    `ctx.scr(x, y, z)` = [screenX, screenY] of a world point at height z tiles (z goes up the screen by 0.69 T per tile).
  - Car fields C2 may write while `car.locked`: `x, y, a, z, susp, glow, slide` (C1 keeps them wall-safe only while it
    drives), plus `car.vis` (0..1, default 1: the car's opacity; set 0 at the explosion and C1 stops drawing the car and its
    lights) and `car.wheelSpin` (rad/s; null = from speed; set a big number for burnouts and C1 spins the wheels/hubs).
  - `ctx.seat()` = { x, y, z }: the driver's seat in world tiles (z = seat height) for the ejection start.
  - Ejection: set `ctx.ejecting = true` and keep `ctx.petX / petY / petZ` (world tiles, z height) updated; C1 draws the pet
    there upright with its normal sprite and moves `me` with it. On `ctx.done()` C1 places the pet at
    `ctx.nearestStand(petX, petY)`, removes the car, restores controls and starts the cooldown.
  - `drawUnder(ctx, c)` is called from the floor layer (under every actor), `drawOver(ctx, c)` after the actors (over the
    car, under the HUD). Both are wrapped in save/restore and try/catch. `SPORTSCAR_MOVES.update(ctx, dt)` is also called
    each frame if present (optional).
  - Cooldowns of the three moves: C1 reads `TUNE.starCd` (default 2.6), `TUNE.loveCd` (3.2); C1 shows them on the buttons.
    C1 calls `shootingStar` / `loveSensation` only when off cooldown and nothing else is running; C1 sets `car.locked`
    for Love Sensation (C2 owns the arc) but NOT for Shooting Star (the car keeps driving; C2 fires from `ctx.car` each
    volley) unless `TUNE.starLock` is true. `ctx.done()` must be called exactly once per action.
- (C2, reply) Adopted: C2 uses `ctx.H` (falls back to `ctx.X` if it has `.add`), `ctx.DK` when given, `ctx.scr` for the
  height scale (z px per tile), `ctx.seat()` for the ejection start, sets `car.vis = 0` (and `car.gone = true`) at the
  explosion, `car.wheelSpin` during brake/burnouts (deleted after), and exports `TUNE.starCd = 2.6`, `TUNE.loveCd = 3.2`.
  `car.burn` is extra and optional. C2 still draws through its own `H.add` fx (floor layer + over the actors), so it does
  not define `drawUnder/drawOver/update`; nothing to call. Love Sensation also sets `car.locked = false` at its end
  (harmless if you unlock too). Supernova sets `me.x/me.y` to its checked landing point before `ctx.done()`.
- (C1) Housekeeping: at 15:26 C1 wrote `scratchpad/sportscar/shot.js` without checking the folder; if C2 had a file of that
  name there it was overwritten (sorry). C1's harness and pictures now live in `scratchpad/sportscar/c1/` only.
- (C1) Debug door: `ELEM_IMPL.light.ult.sportscar.__dbg` (BK bake state, TUNE, STUB ...); the live form is `g._sportscar`
  (phase 'summon' | 'drive' | 'nova' | 'out' | 'gone', `charge` 0..1, `left` s, `car`, `ctx`, `stats`); 20b's `_dbg.VEH`.
- (C2, after end-to-end with 20k4p) Everything runs on your car (star, love, nova, ejection, landing; no page errors).
  Two things for you: (1) `ctx.alive()` includes `!g.won`, so a Supernova whose pulses kill the room's last monster
  is cut off before its explosion/ejection (C2 drops all its effects at once; `ctx.ejecting` may be left true). Your call
  whether a started Supernova should play out on a win. (2) `ELEM=light ONLY=sportscar node tests/elem-moves.js` fails
  "lands damage" and "cleaned up" because the test only casts the ult and waits (the car stays, fx left = your
  'sportscar' fx); the harness needs to drive/fire or time the form out, as the brief anticipated.
