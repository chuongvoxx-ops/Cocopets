# Belladonna: 11th Wind ult (the lead plus the Fenrir team)

- **Spec:** `docs/elem-spec/wind-belladonna.md`. Read all of it; it is the user's own text and it wins over this brief.
- **Concept art:** `/mnt/user-data/attachments/78d1fddd-217b-590c-9262-fa063f90a263/77e33666-image.png`. The user's
  own design. Reference only; never copy it into the repo.
- **Who leads what (the user's instruction):** the lead (the main session) takes charge of the model itself, and leads
  the animation and the effects, with the Fenrir team as support in those fields. So: the lead writes the base model
  and the art direction for animation and effects; M, A and E build to that direction and the lead reviews every pass.
- **Roster:** the row is already in `src/js/20k1-elem-core.js`: `['belladonna', 'Belladonna', 'flower', 100, 120, ...]`,
  the 11th Wind ult (`ELEM_ULT_LV`'s 11th entry, 80). Kit key `ey_belladonna`.

## Files (named to load after `GLM`, `20k5uz`)
| Who | Role | File |
|---|---|---|
| **Lead**, with **M** in support | `BELLADONNA_MODEL`: parts, rig, pose channels, anchors, drawn with `GLM` | `src/js/20k5ya-wind-belladonna-model.js` |
| **A** | `U.belladonna`: session, flight (Nidhogg's), Swoosh, menu, gauge, timers, cleanup, the animation layer | `src/js/20k5yb-wind-ult-11.js` |
| **E** | `BELLADONNA_MOVES`: Wildflowers, Ring Blade, Twister, the Swoosh and summon/exit effects, sound; a GPU effects layer with 2D fallback | `src/js/20k5yc-wind-belladonna-moves.js` |
| **H** | `tests/belladonna.js`, the balance audit, anything asked in Notes | tests and Notes |

## Precedents to read first
- **Nidhogg** (the flight to adapt): `20k6g` core (free flight over land, gaps and open air, the flight volume, cruise
  height, safe return, Dive Bomb, targeting, camera), `20k6h`, `20k6i`, `docs/FIRE-NIDHOGG-GAMEPLAY-BRIEF.md`.
- **Susano O and Fenrir** (the GPU technique and the session pattern): `20k5uz` (`GLM`), `20k5v` / `20k5w` / `20k5x`,
  `20k8m` / `20k8n` / `20k8o`, their briefs and Notes, `tests/susanoo.js`, `tests/fenrir.js`.
- **Shared:** the VEH hooks and `camPick` in `20b-game-dungeon.js`; `20k0v-vehicle-smash.js`; the Wind kit and ults
  `20k3*` (ribbon and petal looks to match; Flower Hurricane and Terrible Tornado are close cousins of Wildflowers and
  Twister, so reuse their vocabulary but keep them untouched).

## The design, fixed counts (verify list)
- Exactly **4** outer green leaves, **1** enormous pink flower, **1** small pearl-white inner flower.
- Exactly **6** green tentacles (3 a side) rooted behind the outer leaves, sweeping outward and back.
- Exactly **8** thin white tentacles (4 a side) rooted behind the white flower, reaching **forward** in depth.
- **1** ring above the flower with a clear gap, with exactly **8** long swords, points radially outward, always 8.
- Twister: exactly **6** tornadoes.
- Counts never change with level.

## Decisions already made
- **Durations and cooldown:** flight 20 / 25 / 35 s by tier, outer cooldown 120 s from exit (Nidhogg's), in `TUNE`.
- **Size:** the bloom is enormous: the pink flower about 5.5 tiles across at the game camera, the pet small at its
  centre (about 0.7 tiles tall, drawn with `X.drawPetAt`, upright, never yawed, always visible, never covered by white
  tentacles or petals). Collision is the pet's hub, not the petals.
- **Orientation:** the flower stands mostly vertical behind the pet, facing the camera, so it reads as a backdrop from
  the game camera at every heading. It does **not** yaw with the heading like a vehicle: steering banks and leans it
  (roll and a small yaw of at most about 25°), the petals and tentacles trail the motion. The lead's model takes
  `bank`, `lean`, `yaw` channels.
- **Flight:** Nidhogg's free flight, cruise height, wall climbing, offshore volume and safe return. No altitude button.
  Camera: the form frames itself (`k > 0`, centred on the model's `center` anchor, a little under the screen's middle,
  velocity lead), as Susano O's airship does, so `camPick` gives it the camera on rifts and fiend floors too.
- **Swoosh (Dodge):** Dive Bomb's targeting and commitment, as a banking, part-folded spiral pass round the enemy
  group at a safe height: no cooldown beyond Dive Bomb's cadence, one hit per enemy per activation, the full route
  validated.
- **Wildflowers (Strong 1):** one bounded hurricane field, ticks at a set cadence for a finite time, one field per
  caster (recast refreshes).
- **Ring Blade (Strong 2):** throws the model's own ring and swords (states `overhead`, `outbound`, `returning`); sweep
  plus end flourish count as one activation per enemy; the return is harmless; no recast while away; Twister recalls it
  first.
- **Twister (Ult, full gauge, once):** six tornadoes orbiting the flower, fixed ticks with one shared per-enemy registry
  per tick, a final pulse, then the safe return and dissolve. `noCharge`.
- **Tentacles never attack.**
- **Environment:** attacks smash props through `VEH_SMASH` in the core's hit path (the user's standing preference for
  ridden forms); doors and bridges are protected.
- **Balance (provisional, H audits):** per-cast totals near Nidhogg's and Fenrir's; Twister near Fenrir's finishers
  (95 / 115 / 125 DK total on one target); Dark Messiah stays first in `tests/ult-damage-rank.js`.
- **Jump:** none (it flies).

## Art direction (the lead's; M, A and E build to this)
- **Palette:** leaves deep emerald to spring green with pale gold veins and a waxy sheen; pink petals deep rose at the
  folded roots through rich pink to blush, ruffled edges catching light, satin; inner flower pearl white with ivory
  warmth and a pink bounce; green tentacles the leaves' green with a lighter belly; white tentacles pearl with a cool
  rim; ring pale gold-white metal with green enamel and mint-white energy; swords pale steel and gold hilts with
  luminous mint edges.
- **Motion:** everything breathes. Petals open and close a few degrees on a slow cycle, tips lag the root. Leaves sway
  from the stem. Tentacles carry travelling waves root to tip and swing against acceleration. The ring spins steadily
  and tilts into turns; the swords stay rigid on it.
- **Effects:** wind ribbons with a bright sharp outer edge fading gradually inward (the user's words); recognisable
  five-petal blossoms, not dots; mint-white and pink; feathered glows, no hard rims on glows; light-only floor marks.
  Effects on the GPU with a 2D fallback and valid premultiplied output.
- **Never** cover the pet's face, except the finisher's brightest beat.

## Standing user rules
- Performance: iPhone and a 2019 iMac. Pool particles. Low effects cut decoration only, never hits.
- No motion-blur ghosts. Timers as deadlines on the game clock. One damage path in the core (`ctx.hit` / `ctx.hitArea`)
  that charges the gauge and smashes.
- Never put reference art in the repo.
- Git: never commit, never push, never touch `test.html`. Build your own page with
  `python3 src/build.py --test-only test-bel<M|A|E|H>.html`. Use Edit on shared files, never whole-file rewrites.

## The model's API (the lead publishes the final list in Notes; build against this until then)
- `BELLADONNA_MODEL.create()` → `{ pose, draw(c, x, y, z, a, P, o), drawShadow(...) }`, `anchor(name)`,
  `anchorDir(name)`, `warm()`, `SIZE`, as `FENRIR_MODEL` has.
- Pose channels (all default 0 unless noted): `alpha` (1), `bloom` (0 closed bud .. 1 open .. 1.3 fully spread),
  `leaves` (0..1 unfurl), `white` (0..1 unfurl), `tentG` (0..1 unfurl, green), `tentW` (0..1 unfurl, white), `ring`
  (0..1 formed), `ringSpin` (radians), `ringTilt`, `ringGlow` (0..2), `ringAway` (1 hides the ring on the model while
  E draws it thrown; E draws it with `drawRing`), `fold` (0..1 petals swept back for speed), `bank`, `lean`, `yaw`,
  `sway` (time phase, radians), `accX`, `accY` (tentacle lag, tiles/s² scaled to about ±1), `glow` (0..2 petal inner
  light), `brace` (0..1 leaves braced for Twister).
- Anchors: `seat` (the pet's support), `center`, `ring` (its centre), `sword0`..`sword7` (tips), `top`, `leaf0`..`3`.
- `BELLADONNA_MODEL.drawRing(c, x, y, z, P, o)` draws the ring assembly alone at a world point (for Ring Blade).

## Notes (dated entries; ask each other questions here)
- (H, 2026-11-12, **balance baseline and suggested numbers, for A and E**) Per activation on one target, in
  DK = base x (1 + 0.08 (evo - 1)), as dealt (no hidden multiplier). Current values of the two nearest forms:
  | | Dodge move | Strong 1 | Strong 2 | Finisher (full cast) | Gauge |
  |---|---|---|---|---|---|
  | Nidhogg | Dive Bomb 3 | Fireballs 3 each x 1 / 2 / 3 = 3 / 6 / 9 | Flare 0.5 a lance x 10 / 20 / 30 (a lone target catches a few) | Ultima 6 (10 ticks x 0.6) + 14 = 20 | 30 x DK |
  | Fenrir | Drift 3 + 4 = 7 | Ice Cannon 3.5 a projectile x 2 / 4 / 6 = 7 / 14 / 21 | Somersault 5 + 5, Spinning Wheel 10 | Diamond Dust / Frozen 95 / 115 / 125 | 32 x DK |
  | Others, for the rank | | | | Dark Messiah 130 / 175 / 210 (must stay first), Supernova 86 / 136 / 151, Titan 89 / 107 / 111, Judgement Day 35-39 | |
  **Suggested Belladonna numbers:**
  - **Swoosh:** 4 DK, once per enemy per activation (no cooldown beyond Dive Bomb's cadence, so between Dive Bomb's 3
    and Drift's 7).
  - **Wildflowers:** a field of radius ~3 lasting 3.0 s, a tick every 0.3 s on the game clock = 10 ticks x 0.9 DK =
    **9 DK** to an enemy that stays inside; cooldown ~3.5 s from the cast; a recast replaces the field (its tick clock
    restarts, nothing stacks).
  - **Ring Blade:** sweep 5 DK + end flourish 5 DK = **10 DK**, each once per enemy per activation; the return 0;
    cooldown ~4 s from the catch.
  - **Twister:** six tornadoes for 5.0 s, a tick every 0.25 s = 20 ticks, each tick one hit per enemy through the
    shared registry: 4.0 / 5.0 / 5.5 DK a tick by tier (evo 1-3 / 4-6 / 7) = 80 / 100 / 110, plus the final pulse
    15 DK once per enemy = **95 / 115 / 125 DK**, `noCharge`. That equals Fenrir's finishers, sits under Supernova at
    evo 4 and 7 and well under Dark Messiah (lead 1.37x / 1.52x / 1.68x over Twister).
  - **Gauge:** `chargeK` 32 x DK (as Fenrir and Susano O).
  I measure the built moves in game (`tests/ult-damage-rank.js` gets `belladonna`) and adjust then.
- (H, 2026-11-12, **hooks `tests/belladonna.js` reads: lead, A and E please confirm or rename here**) Same pattern as
  `g._fenrir` (the test takes the first name that exists, so a rename is one line for me if you tell me).
  - **Lead, `BELLADONNA_MODEL`:** `COUNTS = { leaves: 4, swords: 8, tentG: 6, tentW: 8, pink: 1, white: 1, ring: 1 }`
    built from the part lists (not typed in), and enough to check directions for the last drawn frame:
    `anchor('ring')`, `anchor('sword0'..'sword7')` (tips; I check each tip is farther from the ring centre than its
    hilt: please add `anchor('hilt0'..'hilt7')` or an `anchorDir('swordN')` pointing hilt to tip), and for the white
    tentacles `anchor('tentW0'..'tentW7')` (tips) with `anchor('tentWroot0'..7)` or `anchorDir('tentWN')`, so I can
    check they reach forward (toward the camera: larger screen-forward depth than their roots). Green ones:
    `tentG0'..'tentG5` tips if cheap.
  - **A, the session `g._belladonna = S`:** `phase` (`'summon' | 'fly' | 'swoosh' | 'finisher' | 'out' | 'gone'`, any
    names with those meanings), `released`, `left` / `endT` (game-clock deadline), `charge`, `used`, `busy`,
    `cd = { s1, s2, dodge }`, `V` (`x, y, z, heading, locked`), `ctx`, `vs` (the VEH_SMASH instance), `safe` (the
    tracked safe-return point), and `stats`: `swooshes`, `swooshHits`, `swooshBad` (refused routes), `wild` (casts),
    `ring` (throws), `twister`, `smashed`, `cdSet`, `dealt`, `charged`, `offT` (s spent off the land).
    Labels through `GFX.labelS` in `drawBtns` (I expect `SWOOSH`, `WILDFLOWERS`, `RING BLADE`, `TWISTER`). Damage
    through `S.X.hitMon` (I wrap it and log every hit with the phase).
  - **E, on `BELLADONNA_MOVES.stats` (or `S.stats`):** `wildTicks`, `fields` (live Wildflowers fields: never above 1),
    `ringState` (`'overhead' | 'outbound' | 'returning'`, or on `ctx`), `ringHits`, `twisters` (tornadoes alive: 6
    while it runs), `twisterTicks`, and `ctx.twisterPlan = { t0, t1, ticks, tick }` set when the storm starts (as
    `ctx.frozenPlan`). `ctx.wildPlan = { t0, ticks, tick, life }` on each cast would let me check the cadence exactly.

### M, the materials in `GLM` (`src/js/20k5uz-gl-mesh.js`) (2026-11-12)
All additions; ids 0–21 and Susano O's and Fenrir's looks are untouched. Sample sheet (scratch, not in the repo): `belladonna-materials.png`.

- **Builder:** `surf(pos, nu, nv, m, { e, a, flip })`: `e(u, v)` writes the second attribute (`vA.y`), **`a(u, v)` the third (`vA.z`)**; without `a` the third is the current `AUX` (1), as before.
- **Petal and leaf convention (ids 22, 23, 24):** `vA.y` = along the blade, 0 root → 1 tip; `vA.z` = across it, 0 one edge → 0.5 the midrib → 1 the other edge. The underside (seen from behind its normal) is drawn darker, so give each blade one consistent facing (`flip`).
- **Ids:**
  - **22 leaf**: emerald → spring green, pale-gold midrib and side veins, waxy highlight, glows yellow-green lit from behind.
  - **23 pink petal**: deep rose root → rich pink → blush at the edge and tip, fine veins, satin; `glow` lights it from the root.
  - **24 pearl petal**: pearl with an ivory root, pink bounce, iridescent sheen at grazing angles; `glow` makes it glow.
  - **25 green tentacle**, **26 white tentacle**: for tubes, no attributes needed (the veins follow the tube's own normal, so they run length-wise); 26 has a cool rim.
  - **27 ring metal**: pale gold-white with an engraved vine and green enamel leaves. **Convention:** the ring is its own part with its origin at the ring's centre and its axis along the mesh's z; the vine repeats 18 times round and spans **local z −0.125..+0.125** (`v = clamp(z * 8, −1, 1)`), with a bead line at |v| 0.86. Tell me the band's real height and I'll change the 8.
  - **28 mint energy**: emissive white-green flowing round the same ring axis (z), driven by `glow`; it animates with the scene's time.
  - **29 sword blade**: pale mirror steel; `vA.y` = 1 at the cutting edges, 0 at the spine (the mint edge lights from 0.6 up; the fuller line is the band `vA.y` 0.10–0.16); `glow` brightens the edge.
  - Gold hilts: existing id 3.
- **Time:** `GLM.render(W, H, S, items)` reads **`S.t`** (seconds) for id 28's flow; left out it is 0 (a still pattern).
- **`glow`** is the per-item `glow` (0..1) as for Fenrir; ids 23, 24, 26, 28, 29 respond to it.
- **Halo pass:** `GLM.halos(c, list)` draws soft feathered discs with `lighter` on a 2D context, after the GL image: `list = [{ x, y, r, a, col, sy }]` in the context's units (`r` radius, `a` strength 0..1, `sy` an optional vertical squash for a ring seen at the game camera, about 0.72). `col` is a `'#RRGGBB'` or a name from `GLM.HALO`: `mint #7CFFC4`, `pink #FF7EB0`, `pearl #FFF1DC`, `gold #FFD98A`, `ice`, `engine`. Suggested: the ring 2 or 3 discs of `mint` (r about the ring's radius × 1.3, a 0.15–0.35 by glow), each blade edge one `mint` disc at mid-blade, the inner flower one `pink` plus one `pearl`.

### A, the core `src/js/20k5yb-wind-ult-11.js` (`U.belladonna`) (2026-11-12)
It runs end to end on the lead's model with stand-in moves (summon, flight, Swoosh, both Strongs, Twister, exit).

- **H's hooks, confirmed with two differences.** `g._belladonna = S`; `S.released`; `S.left` / `S.endT`; `S.charge`;
  `S.used`; `S.busy` (`'wildflowers' | 'ringBlade' | 'twister'`); `S.cd = { s1, s2, dodge }`; `S.V = { x, y, z,
  heading, vx, vy, locked, pose }`; `S.ctx`; `S.vs`; `S.safe`; `S.ring`.
  - **Difference 1:** `S.phase` is `'summon' | 'fly' | 'finisher' | 'out' | 'gone'`. There is no `'swoosh'` phase:
    a Swoosh runs inside `'fly'` with `S.swoosh` set (null otherwise).
  - **Difference 2:** stats are `swooshes`, `swooshHits`, `swooshBad`, `wild`, `ring`, `twister`, `smashed`, `cdSet`,
    `dealt`, `charged`, `offT` as you listed, plus `hits`, `flyT`, `ringOut`, `ringBack`, `recalls`, `offshoreExit`.
  - Labels: `SWOOSH`, `WILDFLOWERS`, `RING BLADE` (`RING AWAY` while it is thrown), the seconds, `TWISTER 45%` /
    `TWISTER` / `TWISTER!` / `TWISTER USED`. All damage goes through `S.X.hitMon`.
- **`BELLADONNA_MOVES` (E): what the core calls.** Looked up on `self.BELLADONNA_MOVES` at call time; anything missing
  falls back to my stand-in.
  - `wildflowers(ctx)`, `ringBlade(ctx)`, `twister(ctx)`: called once at the press; each calls `ctx.done()` once.
    `done()` frees the controls, so call it at the end of the cast recovery (Wildflowers) or at the release (Ring
    Blade); the field and the thrown ring carry on in your own fx and must check `ctx.alive()` every frame.
    Twister's `done()` starts the exit (call `ctx.safeReturn()` just before it).
  - Pictures only, no damage: `swoosh(ctx, D)` at the press (`D` = `ctx.swoosh`, live: `{ cx, cy, R, hitR, dir, x, y,
    z, a, u, ph: 'bank' | 'approach' | 'orbit' | 'open', group, high, dur }`); `summon(ctx, { x, y, dur, stages })` at
    the cast (`stages` = my `TUNE.sum` windows in s: seal, leaves, bloom, white, tentG, tentW, ring, lift);
    `exit(ctx, { x, y, glide, fold, how })` when the exit starts; `recallRing(ctx)` when Twister is pressed with the
    ring away.
  - Optional: `update(ctx, dt)`, `drawUnder(ctx, c)`, `drawEnt(ctx, c)`, `drawOver(ctx, c)`, `warm(ms)`, `TUNE`
    (`wildCd`, `ringCd` override mine), `icons` (`swoosh`, `wildflowers`, `ringBlade`, `twister`: `(x, cx, cy, r,
    ready)`), `stats`.
- **`ctx`:** `X, H, C, g, evo, tier (0/1/2), DK, TUNE, CLIPS, model, poseObj`; getters `vehicle` (live `S.V`), `ring`,
  `swoosh`, `charge`, `left`, `phase`; `now()` (the game clock);
  - damage, the only path: `hit(m, dmg, o)`, `hitArea(x, y, r, dmg, o)`, `hitOval(cx, cy, rx, ry, ang, dmg, o)`.
    `o.once` (any object: one hit per enemy across calls; make a new one per Twister tick and share it across the six
    funnels), `o.noCharge` (Twister), `o.noSmash`; the rest goes to `hitMon` (`kb`, `stun`, `el`, `src`). The two area
    hits break the scenery inside them whether or not a monster is there. `smashArea`, `smashOval` do that alone;
  - aim and ground: `mons()`, `target()` (`{ x, y, m }`), `aimPoint()`, `aimDir()`, `stick()`, `groundAt`,
    `canStand`, `nearestLand`, `inVolume`;
  - the ring: `ringState('outbound' | 'returning' | 'overhead')` moves the one ring through its states. While it is
    not `'overhead'` the model hides its own (`pose.ringAway`) and you draw it with `ctx.model.drawRing(c, x, y, z,
    ctx.poseObj, o)`; Ring Blade cannot be recast; its cooldown (4 s) restarts at the catch. `ctx.recall` is true
    once Twister has been pressed with the ring away: bring it back at once and set `'overhead'`; the core waits up to
    1.4 s, then takes it back itself and starts Twister;
  - drivers: `clip(name, u, extra)` / `pose(...)` (`'rest'` clears), `chan({ channel: value })` (raw pose overrides for
    this frame), `kick(channel, dv)`, `camera(o | null)`, `anchor(name)`, `scr(x, y, z)`, `T()`, `vanish()`,
    `safeReturn()`, `done()`, `alive()`, `calm()`, `low()`; yours to set: `twisterPlan`, `wildPlan`, `field`.
- **Clips (A's, on the lead's channels):** `cast` (Wildflowers: the bloom gathers, opens to 1.3 and glows), `ringWind`
  (the ring brightens, the swords accelerate), `ringThrow`, `ringCatch`, `twisterOpen` (opens fully, leaves brace, ring
  spins up), `twisterHold`, `twisterPulse`, `unwind`.
- **Swoosh.** Dive Bomb's target pick; the group within 3.6 tiles of the target sets the circle's centre. The whole
  route (approach, one full turn, the way out) is checked before it starts: inside the flight volume and clear of
  walls at the pass's height (1.5), trying radii 2.5 / 1.8 / 1.2 and both directions; where walls can be flown over,
  a pass above them is the fallback; else it is refused with a mark (`swooshBad`), nothing spent. 4 DK once per
  enemy within 2.3 tiles of the flower along the approach's end and the circle. 0.16 + 0.3 + 0.62 + 0.34 s; then
  the dodge cadence (0.85 s).
- **For the lead (animation):**
  - I write every channel in `blankPose()`. Base flight: `bank` up to 0.5 and `yaw` up to 0.4 from sideways travel,
    `lean` up to 0.22 from travel toward or away from the camera, `fold` up to 0.3 with speed, `sway` advancing 1.6 to
    2.4 rad/s, `ringTilt` following the bank on a soft spring, `ringSpin` 1.5 rad/s rising with speed and attacks.
  - `accX` / `accY` are already sprung (low damping), so the tentacles swing past and settle: the model should use
    them as they are, without smoothing them again.
  - I also write `bloom` a few hundredths either side of 1 as a slow breath. If `sway` already breathes the petals
    in the model, say so and I will take mine out.
  - **One channel of mine you do not have: `spin`** (radians): the whole flower's roll about the view axis during
    Swoosh's circle, two full turns, back to a multiple of 2 pi. If you add it (to `bank`), the pass reads as a spin;
    without it the Swoosh still banks and folds. The pet is drawn by the core, upright, and does not roll.
  - The camera aims at `anchor('center')` raised 1.2 tiles, zoom 0.8, led by the velocity.
- (A, later the same day, **for E**) Your file keeps the ring's state itself (`BM.ringState(ctx)`) and calls
  `ctx.setPose`. The core now follows both: each frame it reads `BELLADONNA_MOVES.ringState(ctx)` and mirrors it into
  `S.ring` (so the model hides its ring, `RING AWAY` shows, Ring Blade cannot be recast and its 4 s cooldown restarts
  at the catch), and `ctx.setPose(o)` is accepted as `ctx.chan(o)`: an override for **this frame only**, so call it
  every frame you need it. `ringAway` is never taken from `setPose`; it comes from the ring's state. You need not
  change anything; `ctx.ringState(...)` remains if you prefer to set it directly.
- (H, 2026-11-12, **first run on the built pieces: `tests/belladonna.js` 44 of 45 at evo 1 / 4 / 7, one real failure for
  A and E**) Run with `HTML=test-belH.html EVO=4 node tests/belladonna.js`; six consecutive runs gave the same result.
  - **Failing: the core and the moves disagree on the ring state.** E's moves keep the state in their own `STATE`
    map (`BM.ringState(ctx)`) and never call the core's `ctx.ringState('outbound' | 'returning' | 'overhead')`, so
    the core's `S.ring` stays `'overhead'` for the whole throw. Seen in the test: core `overhead`, moves `outbound`.
    What follows from it in `20k5yb`: `stats.ringOut` / `ringBack` stay 0, the Ring Blade cooldown from the catch
    (set inside `ctx.ringState('overhead')`) is never set, the button never shows `RING AWAY`, and the core's own
    recall before Twister (`tryUlt`, `recallCap`) never runs. The player-facing rules still hold today only because
    E guards them a second time (no recast while away; `twister` waits for the ring). Fix on either side: E calls
    `ctx.ringState(s)` at its three transitions, or A reads `BM.ringState(ctx)`. The check is
    'the core and the moves agree on the ring state while it is away'.
  - **As built, per activation on one target:** Swoosh 4 DK; Wildflowers 8 ticks x 1.1 = 8.8 DK (4.0 s, a tick every
    0.5 s; a recast restarts the tick clock, never a double tick); Ring Blade 8 DK, one activation per enemy; Twister
    10 ticks over 5.0 s, 95 / 115 / 125 DK in all with the last tick carrying a quarter, `noCharge`; gauge 32 x DK.
    All inside the suggested range; no change asked. In `tests/ult-damage-rank.js` (Wind only this run) Twister
    measured 95 / 115 DK at evo 1 / 4 and 109 DK mean at evo 7 (four casts: 125, 104, 83, 125: a still target three
    tiles out is not under a funnel on every tick, as the funnels orbit at 4.3). Under Dark Messiah's 130 / 175 / 210.
  - **Names the test settled on:** the model through `__pp.belladonna` (`COUNTS.greenTentacles`, `whiteTentacles`,
    `anchorAt(name, 0, 0, 0, pose)` with `swordN` / `hiltN`, `twN` / `twRootN`, `forward`); `ctx.twisterPlan`
    (`n`, `ticks[]`, `fired`, `t0`); `ctx.wildPlan` (`every`, `ticks`). No `fields` counter exists, so 'never two
    fields' is checked only through the tick cadence.

### E, the moves and effects `src/js/20k5yc-wind-belladonna-moves.js` (`BELLADONNA_MOVES`) (2026-11-12)
Built on A's contract as written above; all 45 checks of `tests/belladonna.js` pass on `test-belE.html`.

- **Functions:** `wildflowers(ctx)`, `ringBlade(ctx)` (returns false and calls `done()` if the ring is away), `twister(ctx)`,
  pictures `swoosh(ctx, D)`, `summon(ctx, D)` (throws `bloom` itself at `D.stages.bloom`, else at 40% of `dur`),
  `bloom(ctx, D)`, `exit(ctx, D)`; `ringState(ctx)`, `recallRing(ctx)`; `icons`; `emit(ctx, kind, x, y, z, n, o)` if the
  core wants petals of its own (kind 0 spark, 1 blossom, 2 petal); `warm()`; `TUNE` (`wildCd` 3.5, `ringCd` 4); `stats`;
  `GFX`. I use my own fx (key `belladonna-moves`, with `drawUnder` and `draw`), so I do not need the core's draw hooks.
- **What I call on `ctx`:** `now`, `alive`, `done`, `hitArea` (only damage path), `target` / `aimDir`, `anchor('center' |
  'ring')`, `scr` (the height scale), `clip` (`cast`, `ringWind`, `ringThrow`, `ringCatch`, `twisterOpen`, `twisterHold`,
  `twisterPulse`, `unwind`, `rest`), `ringState(...)`, `recall`, `model.drawRing(c, x, y, z, pose, { T, sx, sy, scale })`,
  `camera`, `safeReturn`. I set `wildPlan`, `field`, `ringPlan`, `twisterPlan`.
- **Numbers (H's suggestions, in `TUNE`):**
  - Wildflowers: radius 3.0, at most 5.5 tiles away, 10 ticks 0.3 s apart x 0.9 DK = 9 DK; cast recovery 0.4 s. One field a
    caster: a recast moves it and restarts its tick clock (`stats.fields` is 0 or 1).
  - Ring Blade: wind-up 0.3 s, out at 15 tiles/s (at most 8 tiles), sweep radius 1.9, end flourish radius 3.0, back in
    0.6 s (0.25 s when recalled). **One registry for the sweep and the flourish: 10 DK once an enemy per throw** (the spec's
    "one damage activation per enemy"; H suggested 5 + 5, which an enemy caught by both would also total). The return
    deals nothing.
  - Twister: settle 0.5 s, six marks 0.75 s, six tornadoes (base radius 1.6) on an orbit of 4.3 tiles at 1.05 rad/s for
    5.0 s. **20 scheduled ticks, 0.25 s apart; the final pulse IS the 20th tick, not an extra one** (the lead's
    decision): ticks 1 to 19 deal 4 / 5 / 5.5 DK, the 20th deals what is left of the budget, 19 / 20 / 20.5 DK, at radius
    x 1.3. On one target held under the storm: 19 x 4 + 19 = 95, 19 x 5 + 20 = 115, 19 x 5.5 + 20.5 = 125 DK. A new
    registry per tick, shared by the six funnels, so at most one hit an enemy a tick; `noCharge`. Then unwind 1.0 s,
    `safeReturn()` and `done()`.
    **For H:** `ctx.twisterPlan = { t0, t1, ticks: 20 (the count), at: [20 deadlines on the game clock, the last the
    pulse], tick: 0.25, tornadoes: 6, n: 6, r, orbitR, per, final, fired }`; `fired` ends at 20 at any frame rate (late
    frames catch up in a while loop on the deadlines).
  - **The orbit is a circle on the ground as the camera sees it**: a tornado's centre is at `(x0 + cos a x 4.3, y0 + sin a
    x 4.3 x GY)`, so the drawn bases and the hit discs share centres exactly.
- **3D on the GPU (`BELLADONNA_MOVES.GFX`; the user: "Do this in 3D and on gpu, all the effects aswell"):** every effect is
  geometry in the world (x, y on the ground, z up, tiles), projected in the vertex shader with the game's camera (the
  same screen mapping as `ctx.scr`) and depth-tested:
  - blossoms and loose petals: instanced meshes (a blossom is five cupped petals and a golden heart, 126 triangles; a
    petal 16), each with its own quaternion, so they tumble; lit like the pink petals (rose root, pink, blush tip, key
    light, rim, light through the petal). My own shader, not `GLM`'s material 23: the look is matched by eye;
  - tornadoes: a funnel surface (24 x 12), instanced, two shells a tornado turning against each other, tapered and
    bending in the vertex shader, shaded by its angle to the camera, with wind bands that each have a sharp bright edge
    and a gradual fade behind it; blossoms climb a helix round each;
  - wind ribbons: strips lying in the wind's plane (arcs round a vertical axis, or along a path), sharp bright outer
    edge, fading inward (the user's rule);
  - marks: quads on the ground (rings, the Wind seal, the turbulent air disc, floor light), drawn under the creatures;
    glows and sparkles face the camera.
  One offscreen canvas with a depth buffer, twice the game canvas's width: solid colour on the left, light on the right
  (valid premultiplied output). Wind is drawn twice, as a thin solid veil and as light, so it also reads on a bright
  floor. Depth against the game's 2D monsters is not possible: ground marks go under them, everything else over.
- **2D fallback** (no WebGL, no instancing, or a software rasteriser; `window.__BM_GL = 1` forces the GPU, `0` forces 2D):
  the same calls drawn flat (sprite blossoms, stroked ribbons, a gradient funnel). Hits, timing and state are computed
  before any drawing, so both paths play the same.
- **For A:** Twister ends with `safeReturn()` then `done()`; it does not call `vanish()` or `exit` (the core's exit does).
  If `swoosh`'s `D` stops being `ctx.swoosh`, the trail fades out.
- **For the lead:** the thrown ring is drawn with `ctx.model.drawRing` on the 2D canvas before my layer is laid over it.
  `anchor('sword0'..'sword7')` are not used: the blade trails are eight arcs at radius 1.9 round `anchor('ring')`; tell
  me the real tip radius and I will match it.
- (A, **ring state and the Twister checks, for H and E**) On a fresh build with today's `20k5yb`:
  - The core's `S.ring` follows `BM.ringState(ctx)` every frame at all three transitions: `RING AWAY` shows,
    `stats.ringOut` / `ringBack` count, and Ring Blade's 4 s cooldown restarts at the catch. H's ring checks and "a
    thrown ring is recalled before the storm" pass.
  - Twister pressed with the ring away: because E's `twister` opens with its own recall, the core now commits the
    finisher at the press (`S.used`, phase `'finisher'`) and counts `stats.recalls`; it only waits itself (up to
    1.4 s) when the moves have no `ringState` of their own.
  - What still fails in `tests/belladonna.js` is between the test and E's `twisterPlan`, not the core:
    (1) the test's `pl.ticks.map(...)` (line 157) treats `plan.ticks` as a list of times, but E sets `ticks: 20` (a
    count) and keeps the times in `plan.at`; (2) E's last pulse also does `plan.fired++`, so `fired` ends at 21 while
    `plan.ticks` is 20, and a held enemy takes 21 hits where the test allows `plan.ticks`.

### M, the detail pass on the model (`20k5ya`) (2026-11-12)
Proportions, counts, `COUNTS`, anchors and channel names are as the lead left them, with these changes:
- **New channel `spin`** (radians, default 0; A's Swoosh): the flower turns about its facing axis like a pinwheel (leaves, petals, both sets of tentacles). The hub with the pet's cushion, `seat`, `top`, `up`, `right` and the ring keep the unspun frame, so the pet and the ring do not move (checked: `seat` moves 0 for any `spin`). The tentacle tips do not lag the spin (the model has no spin rate); A: a little `sway` or `accX` during the turn gives the lag.
- **Tentacles** are now two dynamic tube meshes (`tentG`, `tentW`), rebuilt each draw along the rig's curves with `GLM.touchGeo` (new in `GLM`). The rig still lists every link (`tg0..tg9`, `tw0..tw7`: `COUNTS`, bounds and the anchors `tg*`, `tw*`, `tgRoot*`, `twRoot*` are unchanged in kind), but the links are no longer drawn one by one. Each link's path is walked in 4 sub-steps; green links shorten toward the tip (`GLEN`), and the tip winds 380 degrees into a spiral. `rigOf(P).tent = { g, w, gs, ga, ws, wa }` holds the curves. **The green tips moved** (`tg0` is now about [3.8, -2.9, 4.1] at rest): E, read the anchors, not old numbers.
- The two upper green tentacles leave at 42 degrees and swing out before curling: over 486 poses (`bank` ±0.5, `lean` ±0.4, `fold`, `sway`, `accX/Y` ±1.5, `bloom` 0.5 to 1.3) they stay at least 0.11 clear of the whole disc the swords sweep at any `ringSpin`. `ringTilt` was not swept.
- **Draw calls:** about 30 a frame (was about 150): 4 leaves, 11 pink, 11 white, the hub, the ring, 2 tentacle tubes.
- **Petals and leaves** have a rolled rim (a bead along each edge), more ruffle and denser meshes; the front pink row sits 0.08 further back with a flatter root, and both rows fold less at the root, so nothing dark shows inside the white flower, which now has a pearl bowl behind its petals. The hub has a calyx of 8 sepals, a rosette cushion under the pet and 14 gold stamens.
- **Ring and swords:** the engraving band is matched to `RING_T` (±0.1); each sword has a gem pommel in a claw, a wrapped grip, a cross-guard with swept quillons and gems, a collar, and a flat-and-bevel blade section. `S.t` is passed (`o.t` if the caller gives it, else the clock), so the mint energy flows.
- **Halos** (`GLM.halos`, after the GL image, also over the 2D picture and in `drawRing`): the ring and each blade in mint by `ringGlow`, the white flower in pearl and pink by `glow`. Low-effects mode keeps only the ring's and the pearl one.
- **2D fallback:** outlined petals, tapered curved tentacles from the same curves, a pearl cup with gold dots.
- (A, **free flight and breakable scenery: what to assert, for H**) (the user: "it operates like the airship and the
  dragon, freely can fly anywhere on the map"; "make environment destructible like the other ults")
  - **Flight is Susano O's airship code line for line** (`fly` in `20k5yb` = `fly` in `20k5w` = Nidhogg's): over a
    wall or a prop it climbs to `TUNE.wallZ` (3.2) and crosses; gaps, water and the open air round the map are flown
    at the cruise height (2.4) out to `TUNE.margin` (16 tiles) beyond the map; the one exception, shared with both, is
    a hand-drawn stage whose walls are full height (`X.air().hand`), where walls stop it.
    **Assert:** (a) on a dungeon floor, fly at a wall tile for 2 s: `S.V.z` reaches at least `wallZ - 0.3` and the
    flower ends beyond the wall (its tile index past it), never stopped; (b) fly off the map's edge: it keeps going
    until `-margin` / `w + margin`, `S.V.z` stays at the cruise height, `S.stats.offT` grows; (c) let the timer end out
    there: the pet lands on `canStand` ground and `S.stats.offshoreExit` is 1; (d) the same three on a rift floor and
    a fiend floor, comparing against `g._susanoo`'s airship at the same spot if you want parity rather than numbers.
  - **Swoosh is never refused for terrain inside the flight volume.** It tries the low pass (1.5) clear of walls,
    then the same pass above the walls (`ctx.swoosh.high`), then, where walls cannot be flown over, the pinwheel on
    the spot (`ctx.swoosh.spot`, `stats.swooshSpot`). Only an aim outside the volume is refused (`stats.swooshBad`).
    **Assert:** with an enemy tucked against a wall, a press always starts one (`stats.swooshes` + 1,
    `swooshBad` unchanged) and the flower's position is never inside a wall tile below `wallZ - 0.35`.
  - **Every attack breaks scenery through `VEH_SMASH`.** Swoosh breaks what is within `hitR` (2.3) of the flower along
    its pass (`stats.swooshSmash`); Wildflowers, Ring Blade and Twister break through `ctx.hitArea`, which smashes the
    circle it is given on every call, with or without a monster in it. `S.stats.smashed` counts every prop, pot, chest
    and shrine broken by the session; `S.vs` is the `VEH_SMASH` instance (`S.vs.props` null = a floor where nothing
    may be smashed: skip the test there).
    **Assert, one attack per case, on a floor with `S.vs.props`:** find a tile with `S.vs.smashable(tx, ty)` (as
    `tests/fenrir.js` does), put the target on it (Swoosh: an enemy on the next tile; Wildflowers and Ring Blade: aim
    there; Twister: hover within its formation radius of it), run the attack, and expect `S.vs.smashable(tx, ty)` to
    be null and `stats.smashed` to have grown; and that no door, gate, stair or bridge tile changed.

### E, second effects pass after the lead's review (2026-11-12)
Supersedes the numbers in my entry above where they differ. `tests/belladonna.js` 45 of 45, `elem-moves` (wind, belladonna), the rank test (95 / 115 / 125 DK) and smoke pass on the final build.
- **Twister, for H:** formation radius `orbitR` **5.6** (was 4.3), six funnels, hit radius `r` **1.9** each (was 1.6), `omega` 0.9 rad/s. A funnel's centre is `(x0 + cos a x 5.6, y0 + sin a x 5.6 x GY)`. With the funnels that far out, an enemy standing near the flower would have been missed by every tick, so **the storm round the flower is part of each tick too: one more disc of radius `core` 3.8 at the flower, through the same registry** (drawn: the blossom orbit, a turning air disc and a blush ring at 3.8). Still at most one hit an enemy a tick; 20 ticks, `plan.at`, `plan.ticks` = 20, `plan.fired` = 20; ticks 1 to 19 deal 4 / 5 / 5.5 DK, the 20th (the final pulse, funnel radius x 1.3) 19 / 20 / 20.5 DK. `plan` also carries `core`.
- **Twister, the staging:** the storm round the flower shows from the settle (before any funnel); the six marks flash on the floor (seal, white ring, star, a beam) 0.5 to 1.25 s; funnels 5.0 tiles tall and 2.6 wide at the top, a denser veil with a teal core at the base, bolder bands, 16 blossoms on each helix, a bright turning base ring at the damage radius, petals and gold sparks thrown from the bases on the ticks; the final pulse: all six swell and brighten, a ring of 40 blossoms and six ribbons sweeps out to 1.5 x the formation, then the funnels lift and stretch upward and thin into petals. Camera zoom 0.7 so the wider formation fits.
- **Ring Blade, for H:** the blade trails, the rim and the path trails use the model's tip radius (`BELLADONNA_MODEL.SIZE.swordSpan / 2`, 3.0 by default). The sweep's hit radius is now **3.0** (was 1.9) so the air disc on the floor and the weapon agree; the flourish radius is **4.2** (was 3.0). Still one registry: 10 DK once an enemy per throw.
- **Wildflowers:** blossoms on four heights (0.35 to 3.5 tiles), the far side at half strength (and behind, by depth, on the GPU), six long ribbons turning right round the field's edge at three heights.
- **2D fallback:** a cached funnel picture and a cached seal, half the particles (larger), fewer ribbons and blossoms, no very wide floor light.

### M, the white flower (2026-11-12)
- The hexagonal plate was the six outer white petals themselves: too wide, they overlapped into one sheet with its corners at their tips. They are now narrower rounded spoons that stand apart (`LW1` 0.98, `WW1` 0.4, `LW2` 0.66, `WW2` 0.3), with a gentler cup; both rows sit 0.08 nearer the viewer so the pink roots stay behind them. `PARTS.whiteA/whiteB` bounds follow the constants; counts, anchors and channels are unchanged.
- The lobed bowl with its bright rim is replaced by a round, shallow, darker ivory dish (radius 0.7) that only closes the gaps near the centre.
- Pearl material (id 24): pink-ivory and shaded toward the base and the sides, so neighbours read apart.
- The rolled rim of every blade now fades out over its first tenth (the folded root): those beads were the dark slits between the white petals.
- (E, same pass) **The pet's face:** on the GPU every fragment of my layer fades in a soft hole round `anchor('seat')` (raised 0.35; about 0.8 tiles wide, feathered to 1.3), in every move, the summon and the exit; it is lifted only for the 0.3 s of Twister's final pulse. On the 2D path blossoms, petals and sparks keep out of the same hole (ribbons and funnels there are light only). **Props:** every damaging call is `ctx.hitArea` over the whole drawn area: each Wildflowers tick (the field's disc), Ring Blade's sweep every frame (radius 3.0 along the route) and its flourish (4.2), each Twister tick (the six funnel discs and the core disc) and the final pulse; so each one smashes what stands inside it.
- (H, 2026-11-12, **free flight, breakable scenery and E's settled Twister plan are in `tests/belladonna.js`: 55 of 55
  at evo 1 / 4 / 7, twice each**) On `test-belH.html` built after E's second pass.
  - **Free flight:** flown straight left from the start: never stalled, never inside a solid wall below
    `wallZ - 0.35` (it reaches 3.2 over them), out to `-margin` at the cruise height with `stats.offT` growing; the
    timer ends out there, the pet lands on valid ground and `offshoreExit` is 1. Dungeon floor only: rift and fiend
    floors and parity with `g._susanoo` are not covered.
  - **Swoosh by a wall:** an enemy hard against a wall, three presses: three started, `swooshBad` unchanged, one hit a
    press, never through the wall below the crossing height. The out-of-volume refusal is not exercised.
  - **Scenery:** a named prop broken by each of Swoosh's pass, Wildflowers, Ring Blade and a Twister tick (Twister
    with no enemy on the floor); `stats.smashed` grows; no door, gate, stair or bridge broken.
  - **Twister:** `plan.ticks` 20, `plan.at` 20 deadlines, `fired` 20, the last hit on the 20th deadline, at most 20
    hits an enemy, the same at 20, 60 and 144 fps. Targets stand on the plan's orbit and under the storm's core.
  - **Full rank audit, all elements:** Twister 95 / 115 / 125 DK, third behind Supernova, level with Fenrir's two.
    Dark Messiah first at every evo: 130 / 175 / 210 DK, lead 1.34x / 1.40x / 1.51x.

### M, smaller with longer tendrils (2026-11-12, after v318)
- **Scale:** `VIS` 1 → **0.65** (the user: 35% smaller). Every placed part and anchor scales with it through the view (`anchor()`, `anchorAt()`); nothing in the rig's own frame moved. The pet is the core's and keeps its size, so it now reads larger in the flower, as asked. `drawShadow` now scales with `VIS` too (it did not before).
- **Tendrils:** both sets are 1.5x longer in the model's frame (`LG` 0.66 → 0.99, `LWT` 0.56 → 0.84; roots a little thicker), so against the smaller flower the green ones reach about as far as before in tiles and the white ones a little further. Counts unchanged (6 green, 8 white). The anchors `tg0..5` and `tw0..7` (the tips) moved out: read them from the model.
- **`SIZE` (tiles), new / v318:** `flower` 3.58 / 5.5; `leafSpan` 6.18 / 9.5; `ringR` 0.78 / 1.2; **`swordSpan` 3.9 / 6.0**; `hub` 0.39 / 0.6; `ringH` 3.18 (now in tiles; it was in model units, 4.89); new **`tentSpan` 11.2** (the green tendrils' full width at rest, tip to tip). `seat` stays in the flower's own frame.
- **E:** the thrown ring's sword tips now reach **1.95 tiles** from the ring's centre (`SIZE.swordSpan / 2`, was 3.0); `tipR()` picks that up by itself. Ring Blade's trail and damage reach should follow it.
- **A:** the flower is 0.65 of its v318 size; the tendrils span about 11.2 tiles. Size the camera zoom to `SIZE.tentSpan` or `SIZE.leafSpan` as suits. The `size` multiplier in `20k5yb` still applies on top.
- Clearance over 486 poses (`bank`, `lean`, `fold`, `sway`, `accX/Y`, `bloom` 0.5 to 1.3): the green tendrils clear the swords' disc by 0.9 or more; the white ones by 0.02 at the most extreme combination (`fold` 1 with full bank, lean and acceleration); every tendril clears the pet (a 0.32-tile sphere on the seat) by 0.05 or more.
- (A, v318 feedback "more lively ... it all looks very stiff", **per-tentacle channels, for M**) The core now drives
  everything the current channels allow (a 3 s breath that ripples white, pink, leaves; a hover bob and side drift;
  rolls and pitches into travel on springs that overshoot; strong tentacle lag with overshoot on stops; idle drift of
  `accX` / `accY`; `tentG` dipping to coil the green tips, `tentW` reaching like feelers; a shiver and a tremble on
  attacks; the swords' glint in `ringGlow`). What the model cannot show yet is tentacles moving **independently**:
  today every tentacle's wave runs on the one `sway` phase at one speed and amplitude. The core already writes these
  each frame; a model without them ignores them, so nothing breaks either way:
  - `tgPh[6]`, `twPh[8]`: each tentacle's own wave phase (radians, accumulated at its own speed, 0.83 to 1.5 times the
    shared one). Please use it **in place of** `sway` in that tentacle's travelling wave (`sin(tgPh[n] - jj * 0.75)`).
  - `tgAmp[6]`, `twAmp[8]`: a multiplier on that wave's amplitude (about 0.65 to 2.2; it rises with acceleration). Please
    also let the base amplitude grow: 0.11 and 0.09 rad read as stiff at the game camera; 0.2 and 0.16 would be closer.
  - `tgCoil[6]` (0..1): extra curl at the green tip (the last two links), slowly coiling and uncoiling.
  - `twReach[8]` (about -1..1): the white tentacle reaching forward (+) or drawing back (-), like a feeler; a few degrees
    of `W_FWD` and a little length.
  - `flick` (0..1, decays in 0.2 s): every tentacle flung outward at an attack (spread the roots' angle outward).
  - `breath` (radians, 3 s a cycle): if each petal row offsets its open angle by it (front row a quarter cycle after the
    back row, the white rows before both), the bloom ripples outward instead of breathing as one.
  - The model's size is read from `SIZE.leafSpan` for the camera (zoom 1.0 at 65%, lift 0.78): keep it true.
- **Later the same day: the ring is back to its v318 size** (the user: "bigger"). The flower, leaves and tendrils stay at `VIS` 0.65; the ring and its swords (and their halos) are drawn at `RS = 1 / VIS`, so in tiles they are exactly v318's: **`SIZE.ringR` 1.2, `SIZE.swordSpan` 6.0** (E: the thrown ring's reach is 3.0 tiles again through `tipR()`). The ring sits a little higher to clear the longer tendrils (`RING_Z` 1.55 → 1.8 in the flower's frame): **`SIZE.ringH` 3.34 tiles**; `anchor('ring')`, `sword0..7` and `hilt0..7` follow (A: the held ring's pose and the camera). The upper white tendrils leave a little lower (`TW_A` 48, 16 → 34, 10 degrees), so `twRoot*` moved slightly. Clearance over the same 486 poses: the whole disc the swords sweep (at any `ringSpin`) clears every tendril by 0.12 or more; the pet by 0.07.
- **M, A's per-tentacle channels are read** (2026-11-12): `tgPh[6]`/`twPh[8]` replace `sway` in each tentacle's travelling wave; `tgAmp`/`twAmp` multiply a base of 0.2 and 0.16 rad (was 0.11 and 0.09); `tgCoil` winds the last two green links up to 34 degrees tighter a link; `twReach` adds up to 7 degrees of forward reach and 7% length to a white feeler; `flick` flings the lower tentacles' roots down and out (up to 30% of their spread), opens the green coils and lengthens the lower feelers 6%; `breath` opens and closes each petal row 0.045 rad, the white rows a quarter cycle before the back pink row and the front pink row a quarter after. Absent channels fall back to the v318 shared wave, so an old pose looks as before. To keep the full-size ring clear, the two upper green and two upper white tentacles (the ones beside the ring) wave at 0.42 and 0.55 of that amplitude, do not fling at a flick, and `twReach` only draws the upper feelers back. Swept over 1080 poses (bank, lean, fold, acceleration, bloom, with random phases, amplitudes 0.65 to 2.2, coils, reaches, flick 0 / 0.5 / 1): the swords' whole disc clears every tentacle by 0.04 or more, the pet by 0.07.
- (A, v319 round, **channels the core now writes, for M**) Swoosh is rechoreographed as a flower bulb, and the petals and
  tentacles are driven harder. A model without these ignores them.
  - **`bulb`** (0..1): the bloom closed into a tight bud. The core sets it with `fold` 1, `bloom` 0.35, `white` 0.45 and
    `leaves` 0.8 through Swoosh's rise, dart and spin, then bursts open (`bloom` to 1.28, overshoot, a shiver). If you
    add a proper closed bud, key it on `bulb`; `fold` stays 1 at the same time, so a `fold`-only bud also works.
  - **`flutter`** (0..2, sprung): petal flutter strength. About 0.35 at rest, 0.9 at full speed, plus bursts to about 1.5
    at every hit dealt or taken and on the Swoosh burst; low (0.15) while a bud. **`flutterPh`** (radians, accumulated at
    9 + 6 x flutter rad/s): a phase to drive it with, so it never jumps when the strength changes. Please give each
    petal its own offset.
  - **`breathK`** (0..1.2): how much of your full `breath` range to use. About 1 (wandering 0.8..1.2), 0 in a bud.
  - **`stream`** (0..1, sprung): the tendrils streaming straight behind in the dart and the spin. The core already lowers
    `tgAmp` / `twAmp` and `tgCoil` with it and pushes `accX` / `accY` hard opposite the motion; if you read it, straighten
    the tendrils along the lag direction.
  - Per-tentacle channels, driven harder: speeds 1.2x with two-sine wander, base amplitude multiplier about 1.35
    (`tgAmp` up to about 2.6 with acceleration; the model clamps at 2.4), and every 2.5 s or so one tentacle makes a
    1.6 s slow reaching gesture (amplitude up, coil open, `twReach` up to about +1.2).

### E, Swoosh as a swoop (2026-11-12)
- `swoosh(ctx, D)` now draws a spiral of wind ribbons and petals behind the diving bud.
- It bursts open once: a flash, pink and green shock rings, petals and blossoms thrown out. The burst fires on the first frame where `D.ph` is neither `'bank'` nor `'approach'`, or when `D.burst` is true (A: set that if the bud opens elsewhere), or at the end.
- The air circle round the group shows after the burst. Hits are unchanged (A's core deals them).

### M, v319 round: the bulb, longer tendrils, petal flutter and breath (2026-11-12)
- **New channel `bulb`** (0..1, default 0): the bloom closes into a bud. Each pink row, the white flower and the leaves turn to closed angles, their sheets flatten so they overlap smoothly, and the whole bud tips 58 degrees up toward the viewer about the flower's right axis, so it reads as a teardrop with its tip up. The hub, the seat and the pet do not move; the pet is drawn over the bud's front. The tentacles stream back behind the bud. `fold` is unchanged (petals swept back for speed); A can use both together. `breath` fades out as the bud closes.
- **New channel `flutter`** (0..2, default 0): every petal and leaf shivers on its own phase, a quick pitch (up to 0.075 rad) and roll (0.06 rad) of its plane, about 7 to 10 Hz. Time comes from `P.t` (seconds) if A writes it, else the clock. It is a per-instance matrix change, no remesh.
- **`breath`** range: each row now opens and closes ±0.2 rad (11.5 degrees), rows still a quarter cycle apart.
- **Tendrils 1.3x longer again** (`LG` 0.99 → 1.29, `LWT` 0.84 → 1.09). `tgAmp`/`twAmp` are now honoured up to 3.5 (was 2.4) on the lower tentacles; the two upper pairs beside the ring take at most 2.0, at 0.4 (green) and 0.5 (white) of the base amplitude, and the upper green coils no longer open at a flick.
- **Ring:** raised to clear the longer tendrils (`RING_Z` 1.8 → 2.15 in the flower's frame): **`SIZE.ringH` 3.57 tiles** (was 3.34); `ringR` 1.2 and `swordSpan` 6.0 unchanged. `anchor('ring')`, `sword*` and `hilt*` move up with it.
- **`SIZE.tentSpan`** is now about 14.2 tiles (was 11.2); `flower`, `leafSpan` unchanged.
- Clearance over 1080 poses (bank, lean, fold, acceleration, bloom 0.5/1.3, random phases, amplitudes up to 3.5, coils, reaches, flick 0/0.5/1, bulb 0/0.5/1, flutter 1): the swords' whole disc clears every tentacle by 0.12 or more; tentacles clear the pet by 0.07.
- (A, after M's v319 round) Swoosh now closes with **`bulb` alone** (0 to 1 as it lifts, 1 through the dart and the spin,
  bursting back to 0 over the first fifth of the recovery). `bloom`, `white` and `leaves` stay near 1 (the burst
  overshoots `bloom` to 1.28) and `fold` is 0 in the swoop, so nothing stacks on M's bud. `flutter` is driven on `P.t`
  as M reads it; `flutterPh`, `breathK` and `stream` are dropped from the pose (the bud fades the breath itself; the
  streaming is in the tentacle amplitudes and the lag). The camera keeps zoom 0.8 now that `tentSpan` is 14.2 (the
  longest tendrils' tips may leave the edges of a phone view).
- **Bulb, revised after the lead's review:** the closed bud keeps its volume (about 90% of the open pink bloom's width, 65 to 70% with the leaves, and taller than wide): the pink rows grow (1.5x and 1.12x) and stretch along their length as they close, their sheets flatten so the outer row overlaps the inner like scales and the top comes to one point; the bud's axis is now the flower's own up (it stands up from the hub, its side toward the game camera), the leaves cup its lower third, the pet stays at its front. **New channel `bulbTip`** (radians, default 0): leans the bud's axis in the flower's plane (+ toward the flower's right), scaled by `bulb`; A: point it along the dive on screen, and use `lean` for toward or away from the camera. **The ring rises with the bud** (2.1 units along the flower's up at `bulb` 1, about 1.4 tiles), so `anchor('ring')`, `sword*` and `hilt*` move up while it is closed. Clearance: every petal and leaf vertex clears the swords' disc by 0.66 or more over bulb 0.5 to 1, bank, lean and bulbTip ±1; the tentacle sweep is as above (0.12 and 0.07).
- **Closed bud seals the pet in** (after the user's note): at `bulb` 1 the hub and the pet's cushion draw in (to 0.45) under the bud, the leaves stand up round its base as a calyx (70 degrees), and the white flower's pearl and pink halos fade out, so nothing pale shows at the front. `rigOf(P).A.bulb` gives the eased closure (0..1) if A wants to time the pet's hiding to it. The model draws no pet placeholder.

### E, effects pass for v321 (2026-11-13; the user: "more advance and elaborate")
- **Swoop slams:** I draw each slam on the core's `D.plan.at` / `ctx.swooshPlan.at` deadlines through `BELLADONNA_MOVES.slam(ctx, x, y, r, final)`.
  - A tip slam: green energy cracks running out, pink and green shock rings, petals and dust.
  - The final slam: a bloom-shaped (rosette) shockwave, a flash, flowers erupting.
  - Pictures only; the core deals the hits.
- **Wildflowers:** flowers sprout from the ground and wilt as the field ends; pollen motes drift up; soft light shafts.
- **Ring Blade:** sparks and torn petals on each enemy a blade reaches; thin blade afterimages; a wind wake on the floor; a glowing return.
- **Twister:** an outer counter-turning layer on each funnel; leaves on a wider, slower orbit; debris on a tight, fast one; scoured ground at the base; a flickering pink lightning core. Low effects drop the extra layers.
- (A, **v321 in the core, for H and E**) The user's changes, in `20k5yb`:
  - `TUNE.dur` 45 / 45 / 45 (was 20 / 25 / 35). Cooldowns: Wildflowers 1.0 s, Ring Blade 1.5 s from the catch; the core
    owns them now (E's `TUNE.wildCd` / `ringCd` are no longer read).
  - **Swoosh's new phase, `'slam'`,** between the swoop (`'orbit'`, still a closed bud) and the recovery (`'open'`): the bud
    bursts into bloom (`D.burst` true from that frame; **E: please fire your burst on `D.burst` / `ph === 'slam'` now, not
    on `'orbit'`**), spins in place and slams. **`ctx.swooshPlan` = `D.plan`** = `{ t0, t1, x, y, fired, at: [{ i, kind:
    'tip' | 'final', t, x, y, r, dmg, hits, done }] }`: six tip slams (tentacles 0, 3, 1, 4, 2, 5) at `t0 + 0.18` and every
    0.09 s after, on a ring 2.4 tiles round the flower, each one `ctx.hitArea` of 1.2 DK within 1.2 tiles with its own
    registry; then the final slam at `t0 + 0.87`, 3 DK within 3 tiles at the flower. All charge the gauge and break props.
    The phase lasts 1.05 s, so a Swoosh is now 2.47 s in all. Stats: `slams`, `slamFinal`, `slamHits`.
  - **M:** `tgSlam[6]` per green tentacle: -1 thrown up (the 0.16 s before its slam), +1 slammed onto the ground (its
    deadline), easing back to 0 over 0.35 s; the final slam drives all six. The core fakes it meanwhile with `tentG`,
    `accY` and a jolt of the flower.
  - **For H, `tests/belladonna.js`:** durations are 45 at every evo; the Swoosh's damage now has the slams after the pass
    (an enemy near the flower takes the swoop hit and up to one tip slam and the final slam: three hits, each its own
    event; filter by phase `slam` or by time after `swooshPlan.t0` if a check wants "one hit per enemy per pass").


### M, v320: the tentacle slam (2026-11-13)
- **New channel `slam[6]`** (one per green tentacle, same order as `tg0..5`: 0..2 the right side, upper to lower, 3..5 the left): **0** rest (as before), **1** raised high (thrown up and well out to its side, in the flower's own frame so it clears the ring as the flower banks), **2** slammed (over and down, its last third lying flat on the floor, its tip on the floor). Values between blend smoothly (A animates 0 → 1 → 2 → 0).
- **`slamDir[6]`** (optional, radians in the model's floor plane: 0 = the model's +x, positive toward the camera): where that tentacle lands. Without it they land in a ring round the sides and front (-4, 34, 72 degrees on the right; 184, 146, 108 on the left), about 6.4 tiles out. Slam 1 raises them high above the flower out at its sides; between 1 and 2 each point swings round the root on an arc (a whip cracking over, never folding in).
- **`floorZ`** (tiles, default -1.2): the floor's height relative to the model's origin (the `z` A draws it at, negated), so the tips land on the ground: A, pass `-z` of the draw (times 1 / the `size` multiplier if it is not 1).
- `anchor('tg0'..'tg5')` are the tips (on the floor when slammed): E can put the impact there.
- Clearance with random slams (0 to 2) added to the 1080-pose sweep: the swords' disc clears every tentacle by 0.12 or more and the tentacles clear the pet by 0.07.
- (H, **v321 in `tests/belladonna.js`: 61 of 61 at evo 1 / 4 / 7**, on `test-belH.html`, before E's effects pass ends)
  - **Updated:** 45 s at every evo. Cooldowns are read from `S.cdMax`: Wildflowers 1.0 s, Ring Blade 1.5 s. Swoosh's
    "one hit per enemy" now covers the swoop alone (hits before `swooshPlan.t0`).
  - **Added for the slams:** six tip slams and one final slam, all fired on their deadlines; each slam hits an enemy at
    most once; the final slam hits every enemy within its 3 tiles; 1.2 DK a tip slam, 3 DK the final; the slams charge
    the gauge (it is emptied as they begin); with no enemy present, every smashable prop well inside a slam circle
    breaks. The placement uses one press to learn the offset from start to slam centre, then puts that centre on a prop.
- (H, **balance read, v321, for the lead; numbers unchanged**) Sustained damage over 10 s, no finisher, crits suppressed,
  rooted neutral targets 3.5 tiles ahead, each slot pressed once whenever it is ready. One run each, so expect about 10 %
  spread; Fenrir's projectiles often miss in this crude driver. In DK/s at evo 4, one target / five targets:
  | Form | Strong 1 | Strong 2 | Everything incl. Dodge |
  |---|---|---|---|
  | Belladonna | Wildflowers 1.8 / 14 | Ring Blade 4.0 / 16-23 | 8.3 / 73 (11.6 / 77 at evo 1) |
  | Jaws, shark | Water Bombs 5.4 / 28 | Water Ray 2.0 / 14 | 7.8 / 54 |
  | Jaws, Leviathan (no pools) | Depth Charge 4.2 / 28 | Maelstrom 0 (needs a pool) | |
  | Nidhogg | 5.4 / 47 | 2.5 / 9 | 5.6 / 42 |
  | Beast Machine | 6.8 / 15 | 7.2 / 38 | 7.7 / 28 |
  | Susano O | 1.8 / 11 | 1.7 / 8 | 6.3 / 33 |
  | Fenrir | (misses) | (misses) / 9 | 6.7 / 55 |
  | Sports Car | 1.1 / 4 | 3.8 / 23 | 3.1 / 18 |
  - **Out of line:** Belladonna with every command used, on a group: 73-77 DK/s at evo 1 and 4, the highest in the
    table (next: Fenrir 55, Jaws 54, Nidhogg 42 at evo 4). Swoosh has no cooldown, and its slams add about 4 DK an
    enemy near the bloom, so Swoosh spam is the bulk. On one target it is 8-12 DK/s, also at the top.
  - **Odd, not high:** Wildflowers recast at its new 1.0 s cooldown restarts the field's tick clock (0.3 s ticks,
    10 a field), so spamming it deals 1.8 DK/s. Letting the field run its 3 s gives 3 DK/s. A player who presses it as
    soon as it is ready loses damage.
  - Jaws is in line: Water Bombs is the strongest single-target strong attack of the two forms (5.4 DK/s, about Nidhogg's
    Fireballs). Depth Charge's 3.8-tile blast gives 28 DK/s on five, level with Water Bombs and Nidhogg.
- (A, **balance trim, for H**) Swoosh's slams after H's read: each tentacle slam **0.8 DK** (was 1.2) within 1.2 tiles, the final slam **2.0 DK** (was 3.0) within 3 tiles; radii and timing unchanged. Please match the slam-damage check.
- (E, **for H: Wildflowers recast**) A recast while a field is active no longer resets its tick clock. The field moves to the new aim and is extended to a full duration from the recast (`n = k + 10` ticks). Its ticks carry on at `t0 + (k + 1) x 0.3` on the same clock, so pressing it whenever it is ready never loses a tick. `ctx.wildPlan` now has `ticks` = the field's current total, `fired` = ticks so far, and `t0` unchanged across recasts. Still one field per caster.
- (E) **Slam placement:** a tip slam's impact now sits at M's `anchor('tg' + i)`, when that anchor is on the floor (z < 0.8) within 2 tiles of the plan's hit position; otherwise it sits at the plan's `x`, `y`. The final slam stays at the plan's centre.
- (H, **after A's slam trim and E's Wildflowers fix**) `tests/belladonna.js` 62 of 62 and `tests/jaws.js` 87 of 87 at
  evo 1 / 4 / 7. The slam check is now 0.8 / 2.0 DK. New check: Wildflowers recast whenever ready never deals less
  than one cast left to run (6 s on one enemy: one cast 9 DK; five recasts 17.1 DK on one tick clock). Belladonna DPS
  with everything in use: 47 / 54 / 39 DK/s on five targets at evo 1 / 4 / 7, 7.9 / 7.9 / 4.2 on one (was 73-77 / 8-12),
  in the table's range (Fenrir 55, Jaws 54, Nidhogg 42 at evo 4). Wildflowers spammed is now 2.9 DK/s, was 1.8.
- (H, **the evo 7 "dip" in Belladonna's DPS is my driver's noise, not the game**) Repeated runs: five targets 39-74 DK/s
  at evo 1 and 29-69 at evo 7, one target 7.7-7.9 at evo 1 and 7.9-10.9 at evo 7. The spread comes from how many
  Wildflowers / Ring Blade casts fit around the 2.5 s Swooshes, which varied 1 to 4 a run. In some runs the targets also
  lost HP the session's `stats.dealt` does not count. No move scales the wrong way by tier: `20k5yb` has `dur` 45 / 45 / 45,
  fixed cooldowns and `size` 1, and DK carries the evo factor. Treat the group figures in my table as about ±40 %.
- **Revised slam (after A's hookup): new `slamR[6]`** (tiles from the hub, clamped 1.5 to 7, default **3.5**): where each slammed tip lands, along `slamDir` (or its default direction). The last part of the tentacle lies flat on the floor up to the tip at that distance; for a short reach the root rears up higher and the tentacle bends more at its middle, so it still comes down onto the floor rather than folding inward. `anchor('tg0'..'tg5')` is the landed tip. `slam` 1 raises them high above the flower out at its sides; 1 to 2 swings each point round the root (a whip cracking over). Clearance with random reaches 2.5 to 5 added to the sweep: the swords' disc clears every tentacle by 0.04 or more (the two upper white feelers' wave is capped a little lower for it); the pet by 0.07.
- **New channel `ringGreen`** (0..1, default 0; v321): blends the ring's energy band, the sword edges and the ring and sword halos from mint to a saturated green (#5DFF8A to #B6FFCF), with larger and stronger halos and an outer green aura at 1; `ringGlow` above 1 brightens it further. A drives the pulse (e.g. `ringGreen` 1 through Twister, `ringGlow` 1 to 2 on a sine).
