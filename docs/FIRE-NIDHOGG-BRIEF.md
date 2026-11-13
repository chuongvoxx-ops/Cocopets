# Nidhogg — 11th Fire ult: the model and its animation (round 1: no gameplay)

The user's spec is `docs/elem-spec/fire-nidhogg.md`. This round builds only the creature, its materials and its
animation, plus a dev preview. There is no ult row, no Strongs, no meter and no damage. The model follows the user's
own concept art: a crimson mecha-dragon, wyvern-like, with the forelimbs built into huge bat wings, which glow red
through veined membranes. The wings sit on gunmetal braces with orange-lit hubs and carry long claws. The body has
scarlet armour over living scales, a glowing segmented belly and furnace vents on the flanks. The neck is long and
spiked. The head has swept gunmetal horns, a spike crown, glowing eyes and a toothy jaw. Behind it come clawed hind
legs and a long whip tail lined with big dorsal spikes, ending in a bladed spearhead with glowing seams. The pet's
seat sits behind the neck. In the Ultima state a red rune ring spins over the back.

The file is `src/js/20k6f-fire-nidhogg-model.js`, standalone. It defines the global `NIDHOGG_MODEL` and sorts before
any `20k6g…` core. It uses only `glowSprite`, `blitSized` and `requestIdleCallback` from earlier files; the preview
also uses `arc`, `GFX`, `X.vehicle`, `X.drawPetAt` and `H.add`.

## How it is drawn
- **Rigid pieces:** torso, head, lower jaw, one neck segment, one tail segment, the tail blade and a hind foot.
  - Signed-distance models, sphere-traced per heading (16 buckets) into sprites, the same pipeline as Beast Machine.
  - Shading: a studio environment through Fresnel, a key light with soft self-shadows, a cool sky rim, ambient
    occlusion and normal-detail scales.
  - Wear: plate lines with worn bevels, scratches, scorch blotches, edge wear and grime.
- **Emission layer:** the torso, neck, tail, blade, head and jaw also bake an emission-only sprite (belly plates,
  seams, vents, eyes, mouth), drawn additively by the glow channels.
- **Affine mapping:** each piece is placed on screen by an affine that maps the bucket's own axes to the piece's
  3D forward and right axes. So one bake serves the body's heading, pitch and bank, every neck and tail segment's
  direction, the head's aim and the jaw's opening.
- **Bones:** wing arms, fingers, claws, hubs and the thigh and shin are traced side-on once and laid along their
  projected bones.
- **Dorsal spikes** (round 4): real four-sided pyramids built from the rig and projected each frame. Faces turned
  from the camera are skipped and the rest are lit by their true normal, so they look right at every heading.
- **Membranes:** drawn every frame as panels between the projected bones. Each is filled with a baked vein texture
  mapped per panel, then shaded by its normal: a dark span gradient, key light, and red light coming through,
  stronger with `glow` and `vents` and when edge-on.
- **Live drawing:** the ring, the lights (eyes, mouth core, throat, belly, vents, hubs) and the heat haze.
- **Depth:** every piece is sorted by depth. The rider is drawn last, upright, with its own sprite via the `pet`
  callback (the preview uses `X.drawPetAt`). The pet is never turned, yawed or twisted.

### Sizes and scales
| Constant | Value | Meaning |
|---|---|---|
| `VIS` | 1.25 | Tiles per rig unit |
| `TK` | 1.7 | Torso drawn larger than modelled |
| `HEADK` | 3.0 | Head drawn larger than modelled (round 3); the head and jaw are baked near their drawn scale (`PCAP` 270 / 230 px per unit) |
| `WK` | 1.36 | Wing scale. The wingspan is 1.4× the first review (user request), about 11 tiles at rest |
| `LK` | 1.6 | Leg scale |
| `NSC(i)`, `TSC(i)` | — | Drawn scale of neck segment i and tail segment i |

## Interface: `NIDHOGG_MODEL`
- `create({ T, dpr })` → `{ pose, draw, drawShadow, anchor, warm }`. It sets the bake scale from the tile size.
- `warm(ms)`: bake for at most `ms`, in slices of about 1 ms. A slice that would overrun the budget is never
  started. Returns true when everything is baked.
- `warmIdle(T, dpr)`: idle-time baking through `requestIdleCallback`, up to 3 ms per call. Use it as the Ult's
  `.warm` hook.
- `draw(c, x, y, z, heading, pose, o)`:
  - x, y in world tiles; z = height in tiles; heading = the map angle `(cos a, sin a)`.
  - `o = { T, sx, sy, t, pet(c, X, Y), scale?, low? }`. `sx` and `sy` are the game's world→screen functions; `pet`
    draws the rider at its seat.
  - It also asks for the bake of the current heading (quick half-size pictures first).
- `drawShadow(c, x, y, z, heading, pose, o)`: the ground shadow, drawn separately (floor layer). It is dragon-shaped
  (wings and body flattened on the floor), cast a little away from the light, and smaller and fainter with height.
- `anchor(name)` → world `{x, y, z}` for the last `draw`, on the part as drawn (round 4: anchors include the
  chain's attach shift):
  - body: `mouth`, `head`, `eyes`, `chest`, `belly`, `seat`;
  - wings: `wingL`, `wingR` (roots), `wingTipL`, `wingTipR`;
  - `ventL`, `ventR`;
  - `ring` (the centre over the back);
  - `tail` (the blade's base), `tailTip`.
- `blankPose()`, `CH` (the channel list), `CLIPS`, `relax(P, dt)` (ease toward neutral), `rig(P, t)` (body-local
  points), `preview(opts)`.
- `turnDriver({ a, thresh?, quant?, drift? })` → `D`: the heading driver. Use it for every change of direction
  (round 4).
  - Each frame, after the clip has run, call `D.step(dt, stickX, stickY, pose)`. It returns `{ spinStart }`; play a
    whoosh on it, for example `X.sfx.whoosh()`.
  - Draw at `D.a`, and move along `D.want`, the exact stick angle.
  - `D.spin` is null at rest; `D.u` is the spin's progress.
  - `D.ghosts(n)` gives the blur ghosts' headings and alphas.
- `drawSpin(c, x, y, z, pose, o, D)`: draws the ghost copies along the spin arc, then the dragon (as `draw` does, at
  `D.a`), then the wingtip swooshes. At rest it is just `draw`.
- `o.ghost` (internal to `drawSpin`): draws the body only, with no lights, ring, halo or rider.
- `__dbg`: the baker's state (`BK`: `k`, `bytes`, `ms`, `maxMs`, `spikes`), `setScale`, `bakeStep`, `readyB`.

## Pose channels (all numbers; 0 is neutral)
| Group | Channel | Range and meaning |
|---|---|---|
| Wings | `flap` | Phase in cycles; drivers advance it |
| | `flapAmp` | 0..1.2, the stroke amplitude |
| | `downFlex` | Extra finger flex on the downstroke |
| | `spread` | 0..1, braking flare: wings forward, fingers fanned and cupped |
| | `fold` | 0..1, partial fold for a dive |
| | `finger` | Finger curl |
| Neck and head | `neckCurve` | -1 stretched .. +1 raised swan curve |
| | `headYaw` | Radians |
| | `headPitch` | Radians, + is down |
| | `jaw` | 0..1, open |
| | `throat` | 0..1, flare |
| Body | `pitch` | Radians, + is nose down |
| | `bank` | Radians, + is right wing down |
| | `tailSwing` | -1..1, counter-swing |
| | `tailLift` | Tail raised or dropped |
| | `legs` | 0 tucked .. 1 reaching down; flight uses about 0.3, so the hind legs trail and show |
| | `breath` | Idle breathing amplitude |
| Effects | `vents` | 0..1, open |
| | `glow` | 0..1, internal light; belly, seams and vents always glow faintly at 0 |
| | `spikes` | 0..1, dorsal extension (round 3: no clip drives it past a slight lift) |
| | `trace` | 0..1, glowing orange-red traced outlines on the plate seams and the silhouette (Ultima charge, beam) |
| | `ring` | 0..1, visibility |
| | `ringSpin` | Angle; drivers integrate `ringSpinV` |
| | `core` | 0..1, the white-hot mouth core |
| | `heat` | 0..1, heat haze |
| | `alpha` | 0..1 |

Altitude is not a channel: pass z to `draw` and `drawShadow`.

## Clips (pose drivers)
- **Call:** `CLIPS[name].run(P, t, dt, ctx)`, where t is seconds since the clip started. It writes P and returns hints:
  - motion: `speed` (tiles/s), `dz` (tiles/s);
  - events: `slam`, `shot`, `burst`, `beam`, `shake`, `seal`, `mount`, `embers`, `ringBreak`.
- **Durations:** `CLIPS[name].dur`.
- **The clips:**
  - `summon` 3.4 s: seal, emergence through the haze with wings folded, the pet mounts at about 1.9–2.3 s, wings
    spread, a big downstroke rise.
  - `hover`.
  - `fly` (`ctx.turn` banks).
  - `climb`, `descend`.
  - `dive` 2.2 s: part-fold, plunge, braking flare, slam at 1.0 s, recovery.
  - `fireball` 1.6 s (`ctx.n` shots, one every 0.42 s: draw-in, flare, release with recoil).
  - `flare` 1.8 s (vents and wing recoil).
  - `ultima` 5.2 s, in order: spikes grow from 0.4 s, the ring appears at 1.3 s and accelerates to 14 rad/s, the body
    lights at 2.2 s, the mouth core forms at 3.4 s.
  - `beam`: the brace; loops while held.
  - `settle`: the ring breaks into embers; spikes and glow settle.
  - `dismiss` 1.6 s: fire, embers, fade.

## The dev preview (test builds only)
1. In a test build (`python3 src/build.py --test-only NAME.html`), start a Tower floor.
2. Call `__pp.nidhoggPreview()` (or `{ auto: false }`).
3. The dragon is summoned over the floor with the pet on its back, through the generic VEH hook:
   - the stick steers free flight (walls, gaps and water are ignored: it only draws);
   - Dodge dives, Strong 1 breathes fireballs, Strong 2 flares, the Ult runs the Ultima charge (then beam and settle
     in auto mode), J climbs;
   - left alone, it cycles every clip.
4. While flying, it zooms the camera out (`g.zoomP` 0.74) and restores it at the end.
5. `__pp.nidhoggPreview(false)` ends it.

`__pp.nidhogg` is the model object. Production carries the module but nothing calls it, and the production build has
no `__pp` (`build.py` asserts this).

## Numbers (desktop Chromium; SwiftShader canvas)
- **Bake:** about 120 pictures in all: 7 pieces × 16 headings plus 7 bone pieces, and emission layers for 6 of the
  7 pieces.
  - At the in-game scale (k ≈ 64–80 px per unit) a full bake takes 2–3 s and about 2–3 MB.
  - At the cap (k = 120) it takes about 6 s and about 7 MB.
  - Bake calls are ≤ 3 ms with occasional V8 GC outliers. For example, `maxMs` in the studio runs is 8–9 ms, as with
    Beast Machine.
- **Draw:** median about 0.6–0.7 ms per frame, including about 35 membrane path fills (no per-pixel work per frame).
  Low effects drops the heat haze and the belly bloom.

## Notes for the gameplay worker
- Use `warmIdle` as the Ult's warm hook and call `warm(2..4)` while the summon plays.
- Keep `draw` in an `H.add` fx's `drawEnt` and set `me.petAlt` to it, as the preview does. Put `drawShadow` in
  `drawUnder`.
- The rider is drawn last: put effects that must not cover it under it, or dim them near `anchor('seat')`.
- The 1.4× wingspan is about 11 tiles: wider than a phone's view at the floor's normal zoom. Keep a flight zoom of
  about 0.74 (as the preview does).
- Damage hit areas are not part of the model. Use the anchors: `mouth` for breath and the beam, `ventL/R` and the
  wing roots for Flare, `belly` for the dive's impact point below, and `ring` for the Ultima ring.
- Reuse `CLIPS` as the moves' pose drivers. Their hints mark the frames for effects and damage, for example `slam`,
  `shot`, `burst` and `beam`.

## Notes, round 3 (2026-11-08)
User feedback: a bigger, more robust head and horns, a longer tail, no coming apart in turns, no spike growth on the
Ultima charge (glowing traced outlines instead), and a thicker, glowing ring.
- **Head:** `HEADK` is 3.0 (was about 2), about 1.5× bigger on screen. It has a heavy skull, a deep jaw with a chin
  plate, a brow cap, thick swept horns (main horn root radius 0.066) with a lower horn, a crown of 9 spikes, 4
  cheek-frill spikes per side, jaw frills, and 7 + 6 teeth per side.
- **Tail:** 16 links (was 12), each 1.3× longer, about 1.4× the length in all. Tail spikes follow `TRAD`.
- **No separation in turns:** the neck and the tail are each one continuous swept strip. It is filled with a seamless
  tile cut from a periodic tube model and baked once (`ntube`, `ttube`); it no longer uses rigid segments per
  heading.
  - Each shell (torso, head, jaw, tip, foot) is laid on screen by a least-squares affine map fitted to its 3D axes.
    Shells crossfade between the two nearest headings, picked by world yaw.
  - Each chain (neck, tail, both wings and both legs) is shifted to where the drawn torso sprite actually puts its
    root (`attach`). Lights, eyes, hubs and spikes move with their chain.
  - The neck and tail roots are drawn under the torso.
  - The bank sign was also fixed: positive bank drops the right wing, and the near wing no longer vanishes.
- **Turn sweep:** every 5° × fly, dive and hover × banking both ways, with a hard tail counter-swing and head yaw.
  All 432 frames are one connected piece (alpha > 0.55, 4-connected, pieces > 25 px), with 0 splits.
- **Ultima:** the `trace` channel replaces spike growth. `ultima` ramps it from 0.4 to 2.2 s, `beam` holds it at 1,
  and `settle` fades it.
  - The strips get glowing orange edge strokes and the shells get a soft orange halo (`shadowBlur`, drawn only while
    `trace` > 0.02).
- **Ring:** the bands are about 2.2× thicker, each drawn in 4 steady passes (a wide bloom, a body, an inner glow and a
  hot core). The segments and ticks are thicker too.
  - The spin is cut from 14 to 3.2 rad/s, so the 24 runes no longer strobe (the old rate moved about 2 rune slots per
    frame at 30 fps). Runes and counter-rotation are kept.
- **Numbers:**
  - Full bake at the in-game scale (k ≈ 104) takes about 8 s of idle-time CPU in 2 ms calls, and 6.7 MB. Glow
    layers are now half resolution; parts are baked at drawn scale, capped at k = 150.
  - Bake calls are ≤ 3 ms apart from warm-up and GC outliers: 43 of about 7,300 calls are over 3.5 ms, worst 12 ms.
    Round 2 measured the same way gave 33 of about 3,600, worst 11 ms.
  - Draw (CPU) median is 1.0–1.3 ms.
  - SwiftShader software raster with a flush every frame: median 7.7 ms (11 ms while `trace` = 1), against 4.6 ms in
    round 2. The extra cost is the strips and the halo.
  - The headless canvas also stalls periodically (about every 30 frames). This happens in round 2 too, so it is not
    the model.


## Notes, round 4 (2026-11-08)
The user's requests:
- "Any turn or change of direction the dragon can do a quick spin and we can put a motion blur on it... really the
  spine and spikes on the back is the only thing that looks odd when the dragon turns."
- "Can we make [the head] detailed like [Beast Machine's]", with "detailed eyes and snout as well".

**Snap turns** (`turnDriver`; the dev preview uses it):
- The heading holds steady and rests exactly on one of the 16 baked headings (`quant`). At rest the body is one clean
  bake with no crossfade, so the spine is crisp. Travel still follows the stick exactly (`D.want`).
- A change of direction past `thresh` (default 0.42 rad, 24°) is an eased spin (cubic in/out) of 0.12 s for a small
  change, up to 0.2 s for a reversal. A spin that is more than half done can be retargeted.
- Smaller stick wobble is ignored. With `quant: false`, changes under the threshold drift at most `drift` rad/s
  (default 0.35).
- During a spin:
  - the bank kicks in, up to 0.75 at mid-spin;
  - the head leads (`headYaw`) and a flap burst adds speed and amplitude;
  - the tail whips through the spin, then settles on a damped spring with a little overshoot.
- The driver owns `bank` and `tailSwing`. Clips get `turn` ≈ 0, so the fly clip's idle sway no longer slides the
  spine.
- The preview plays `X.sfx.whoosh()` on each spin.

**Motion blur** (`drawSpin`):
- Up to 4 ghost copies (2 in low effects) at earlier eased headings along the arc, with alpha falling from about
  0.42. They are drawn low-detail, with no lights, ring, halo or rider, and only while spinning plus 0.12 s after.
- Then the dragon, then soft warm swoosh streaks off both wingtips along the swept arc.
- A test of 6.4 s with 7 direction changes gives 7 spins.

**Spine and dorsal spikes:**
- The flat side-on spike sprites are gone. Each dorsal spike (neck, back, tail and neck frills) is now a real
  four-sided pyramid built from the rig: a fin-like diamond base along the chain, with the tip swept back.
  - Each spike is projected every frame; faces turned from the camera are culled and the rest are lit by their true
    normal.
  - Each spike is attached with its chain's shift (back spikes now follow the drawn torso).
  - They no longer flip, fan or slide at any heading, including side-on and the bucket boundaries.
- Cost: about 30 small path fills per frame. The old spike sprite is no longer baked.

**Head**, rebuilt to the Beast-head standard, with the same sphere-traced detail and materials:
- **Snout:** a long angular wedge with chamfered edges. Four layered scarlet nasal plates, each proud at its front
  edge, step down at bevelled seams over scaled skin.
- **Snout top:** a ridge of steel studs alternating with small swept spikes. Flared nostrils with ember-lit holes
  (vent glow). A gunmetal lip line over 7 teeth per side.
- **Brows:** tapered leaf-shaped armour plates, rimmed in bronze, with 3 rivets each.
- **Gem:** a crimson faceted brow gem (emissive) in a bronze bezel.
- **Eyes:** a recessed socket, a glossy eyeball with a slit pupil in a radial-streaked orange-gold iris, a dark
  limbal ring, a strong specular, and a thin glowing rim. The live eye bloom is smaller so it no longer covers the
  modelled eye.
- **Cheeks and horns:** riveted flat-faced cheek plates. Thick swept gunmetal horns with bronze bands (two on the
  main horn, one at its tip half, one on the lower horn). Crown and cheek frills.
- **Jaw:** banded armour along its sides, a gunmetal lip line, a riveted chin plate, 6 teeth per side and the
  glowing mouth.
- **New materials:** `M_GOLD` (hammered bronze-gold with wear), `M_GEM` and `M_IRIS` (procedural pupil and iris).
  The armour and gold get a fine hammered dent normal.
- The head and jaw skip the generic plate-line grid, which read as plaid on the head; they have real seams.
- **Crispness:** the head and jaw were baked at most 150 px per unit while drawn at about 310 in game, about 2×
  upscaled and soft. They are now baked near their drawn scale (`PCAP`: head 270, jaw 230).
- **Jaw fix:** the jaw used to open upward, into the head. It now opens downward, so the open mouth, teeth and throat
  glow show.
- **Anchors:** `mouth`, `eyes`, `head`, the wing tips, the wing roots and `tail` now include the chain's attach
  shift, so they sit on the parts as drawn (checked with crosshairs).
- **Numbers** (SwiftShader):
  - Full bake at the in-game scale (k ≈ 104) takes about 18 s of idle-time CPU in 2 ms calls (was about 8 s). The
    rise comes from the richer head and jaw models baked at about 2× their old resolution.
  - Memory is 11.1 MB (was 6.7). Bake calls over 3.5 ms: 83 of about 15,800 (warm-up and GC), worst 18 ms.
  - Lowering `PCAP` to about 200 / 170 would roughly halve the head's share, at some loss of crispness.
  - Draw (CPU): 1.1 ms median at rest; 2.3 ms median during a spin (3 ghosts), which lasts about 0.2 s.
  - Software raster with a flush every frame: 11 ms at rest, 38 ms during a spin.
- **Checks:**
  - Turn sweep at 15° (144 frames): all one piece.
  - `turns2.png`: 4 snap-spin strips at 60 fps, plus the 16 stable headings close up on the spine.


## Notes (A, 2026-11-13): what the cores, moves and cameras use today (the GPU model must keep all of it)

Called on `NIDHOGG_MODEL` by the core (`20k6g`), the moves (`20k6h`) and the Ultima (`20k6i`):
- **API:** `create(opts)` (returns `{ pose, draw, anchor }`); `warm(ms)` and `warmIdle(T, dpr)` (idle-time
  readiness; the core holds the summon until the body is ready); `drawSpin(c, x, y, z, P, o, proxy)` (the only body
  draw: `o` = `{ T, sx, sy, t, low, scale, pet(cc, PX, PY) }`, and the proxy gives `a`, `k`, `blur`, `last`, `ghosts`);
  `drawShadow`; `turnDriver({ a })` (kept for the contract); `anchor(name)` / `inst.anchor(name)`; `blankPose`; `CH`;
  `CLIPS`; `relax`; `preview` (the test hook); `rig`; `VIS`.
- **The pet:** `o.pet(cc, PX, PY)` is called at the seat during the draw, so the pet is layered in the body. The core
  adds its own pitch lift and roll to the pet.
- **Pose channels written:**
  - Core: flap, flapAmp, downFlex, spread, headYaw, jaw, throat, pitch, bank, tailSwing, legs, vents, glow, trace,
    ring, core, alpha, heat.
  - Moves: flap, spread, neckCurve, headPitch, jaw, throat, pitch, vents, glow, ring, core, heat.
  - Ultima: jaw, throat, trace, ring, core.
  - Through the clips: every `CH` channel (fold, finger, tailLift, breath, spikes, ringSpin, ringSpinV too).
- **Clips run** (`CLIPS[name].run(P, t, dt, ctx)`): hover and fly (with `{ turn }`), dive, fireball (with `{ n }`,
  returns `shot`), flare, summon (returns `dz`, `seal`, `mount`), dismiss, ultima, beam, settle. Also present: climb,
  descend. Return fields read: `speed`, `dz`, `slam`, `shot`, `seal`, `mount`.
- **Anchors** (world `{ x, y, z }`):
  - Used: mouth (fireballs, flare, beam), seat (the pet, moves), belly, chest, ring (the Ultima), and ventL, ventR,
    wingL, wingR, ring (ember sources).
  - Defined but unused today: head, eyes, tail, tailTip, wingTipL, wingTipR (the wingtip streaks use the tips).
  - The moves' fallback guesses (`GUESS` in `20k6h`) assume the 0.65-of-size frame.
- **Camera:** `camFocus` uses the dragon's place, not anchors. The flight zoom is `TUNE.zoom`, with Ultima zooms
  0.62 and the shake. If the GPU model changes the drawn size, A retunes `TUNE.size` and the zoom.

## Notes (M, 2026-11-13): the GPU model, plan and part list (before modelling)

- **Where:** a new file `src/js/20k6fa-fire-nidhogg-gl.js` (`NIDHOGG_GL`), called from `20k6f`'s `draw()` before the
  2D path. `20k6f` keeps its rig, clips, anchors, shadow, ring, lights and the 2D sprite art (the fallback: no WebGL, a
  CPU renderer without `window.__NIDHOGG_GL`, or a GPU failure: 1.5 s, for good after 3 failures in 20 s).
- **Same rig, same channels, same anchors:** the GPU body is posed from `rig(P, t)` exactly as the 2D one (every `CH`
  channel, every clip). With the GPU on, the chains are drawn exactly where the rig puts them, so the anchors are the
  rig's points with no attach shift. No new channels needed; none renamed.
- **Camera:** the 2D one (`toS`: x across, y down the screen, height up by ZK), so the ring, the lights, the embers, the
  pet and every anchor line up with the GPU picture.
- **One GLM pass, about 15 items** (each item one draw call, plus its outline): torso; head; lower jaw; tail blade;
  skin (the neck and tail tubes, one dynamic mesh); lames (the scarlet armour shingles on neck and tail); belly bands
  (the lit plates under neck and tail); tail rails (steel, glowing seam); dorsal spikes (all 34, one dynamic mesh);
  membranes (both wings, one dynamic mesh); wing kit L / R (arm bones, fingers, claws, hubs); leg kit L / R (thigh,
  shin, foot, talons).
- **Parts (fidelity upgrade, same design):** the torso surface traced from the 2D model's own shape (chest, abdomen,
  haunches, wing shoulders) in crimson scales, six overlapping scarlet back lames, a segmented belly lit from within
  with glowing seams, flank vents (steel housings, glowing slots, louvres), flank tubes, wing mounts with orange-lit
  rings, hip joints, the armoured seat (padded cup, high back, roll hoop), spike sockets; the head (scaled skull,
  wedge snout, four layered nasal plates, studs and small spikes on the ridge, ember nostrils, gunmetal lip lines,
  upper teeth, riveted cheek plates, recessed glowing eyes with slit pupils and a lit rim, armoured brows with bronze
  trim and rivets, the brow gem in a bronze bezel, swept gunmetal horns with bronze bands, lower horns, a crown and
  cheek frills of spikes); the jaw (banded armour, chin plate, lip lines, lower teeth, the glowing mouth, a frill);
  the bladed tail tip (leaf blade, barbs, collar, glowing centre seam); veined membranes lit through red; the wing
  arms (shingled armour, ridge spikes, brace and piston), fingers, silver claws, hubs; legs with talons.
- **Materials (GLM ids 38–48, Nidhogg's own):** 38 crimson scales, 39 scarlet lacquered armour (worn edges), 40 dark
  steel / gunmetal, 41 horn, 42 the lit belly plates, 43 fire emitter (seams, vent slots, mouth, hub rings), 44 eye,
  45 teeth, 46 talons, 47 gem, 48 membrane. The trace (`trace`) heats the outline and every seam (GPU), plus soft
  halos along the silhouette.
- **Kept 2D (they are light, not body):** the Ultima ring, the eye / mouth / throat / belly / hub / vent glows, the heat
  embers, the shadow, the wingtip swooshes. The spin's ghosts are drawn in the same GPU pass (translucent body copies).
- **Exports added:** `NIDHOGG_MODEL.gl` (is the GPU drawing), `stats`, `SIZE` (extents for H), `COUNTS`.

## Notes (E, 2026-11-13): the moves and the Ultima on the GPU
- **One GPU fire painter, `NIDHOGG_MOVES.FGFX`** (end of `20k6h`), used by both `nidhogg-strongs` and `nidhogg-ultima`:
  one program, one offscreen canvas (left half solid, premultiplied source-over; right half light, screened), two draws
  per pass at most, 0.6 res (0.42 lowFx), 1200 quads cap. Kinds: glow, ring, beam, turbulent fire ball (fbm, a
  temperature ramp white > yellow > orange > red), flame tongue, burning ground (light only), fire beam (scrolling flame
  strip), sparkle, heat shimmer, smoke (solid), fire body and fire-beam body (solid: the colour laid over, so fire reads
  on pale floors). Painter calls: `glow ring beam fire billow tongue ground firebeam firebody star shimmer smoke trail`.
  The rider's face is a hole in every kind (`begin(c, [x, y, r])`; the Ultima passes null: it engulfs the scene).
- **Switch:** GPU on real hardware; software GL (SwiftShader) keeps the 2D pictures unless `window.__NG_GL = 1`;
  `__NG_GL = 0` forces 2D. No WebGL, a lost context or a shader error: the old 2D pictures, unchanged. Each act has
  `gpuUnder/gpuOver` beside its `under/over`; gameplay (timing, hits, radii, props) is untouched.
- **Looks:** Fireballs: a rolling fire ball with a flame-strip comet tail and a hot core; aim rings and floor light;
  bursts are a billowing body of fire turning to dark smoke, a short flash ring, scorched glowing ground. Flare: each
  lance a molten head with a tapering turbulent trail and a white-hot thread; vent heat shimmer. Ultima: fire strings
  flowing into the mouth, pressure rings, the mouth core; the beam a flame body + turbulent strip + white core, tongues,
  two molten spirals, an impact fire; the blast flash, shock rings, glowing fractures (light only), the dome, column and
  mushroom cloud as billows cooling into smoke.
- **Counts at the heaviest moment (one frame; draws / light quads / solid quads), desktop | lowFx:** Fireballs 2 / 108 /
  53 | 2 / 53 / 29; Flare (30 lances) 2 / 570 / 45 | 2 / 289 / 39; Ultima (cloud at 7.6 s) 2 / 618 / 131 | 2 / 236 / 62.
- Dive Bomb's effects live in `20k6g` (A's core) and were not changed.

- (H, 2026-11-13, **GPU remake: today's gameplay is pinned; please run these before and after each change**)
  `tests/nidhogg.js`, `tests/beast.js` and `tests/car.js` (shared harness `tests/lib/vehpin.js`) measure the ride on the
  real game and compare it with `tests/baseline/<key>-evo<N>.json`, which was written from a clean build of main
  (b5878f7). Run `HTML=<your page> EVO=1|4|7 node tests/<x>.js`.
  - **Strict, fails on any change:** every number in the core's and the move files' `TUNE`; the ride's length and the
    120 s cooldown; the buttons; the camera zoom while riding; for each move, the damage per hit, the cadence and the
    rate the meter fills; the finisher (one use, it never recharges the meter, nothing lands after the release); the
    exit on timeout; props broken by the dodge move and the jump; doors, gates, stairs and bridges kept.
  - **Soft, prints WARN only:** how many enemies a cast happened to reach; the camera's offset from the ride; the
    Supernova total (the car drives through its pulses).
  - Only intended gameplay changes need the baseline rewritten (`UPDATE=1`), and that should be said in Notes.
  - **A bug on main, for A and E (not caused by the remake):** Flare sometimes deals no damage at all. Its counter goes
    up, but no lance hits. It happens when the pet has moved about 19 tiles from where it stood before the summon (1
    of 3 runs in a minimal repro; never at the spawn spot). The repro script is
    `/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/nidflare-repro.js`; it needs `HTML=`.
    No lance ends on a wall in that run. `tests/nidhogg.js` keeps the pet where it is (`noMove`) until this is fixed.
  - (H, after v324) A fixed the Flare bug (`aimL` had slipped into a comment), and `noMove` is gone from
    `tests/nidhogg.js`. On the working tree it passes 25 of 25 at evo 1, 4 and 7; the only WARN is how many times one
    enemy was struck, which varies from run to run.

## Notes (M, 2026-11-13): the GPU model, as delivered

- **Files:** `src/js/20k6fa-fire-nidhogg-gl.js` (new, `NIDHOGG_GL`); `20k6f` calls it first in `draw()` (fallback: its 2D
  sprites); GLM (`20k5uz`) gains ids 38–48. Force on a CPU renderer with `window.__NIDHOGG_GL = 1` (`__NIDHOGG_GLHQ` for full
  resolution there).
- **No channel, clip or anchor changed.** On the GPU the chains are drawn exactly where the rig puts them (`R.dN/dT/dW`
  are zero), so every anchor is the rig's point. The ring, eye / mouth / throat / belly / hub / vent glows, embers,
  shadow, swooshes and the pet (`o.pet` at the seat) are drawn as before, over the GPU picture (the ring's far half under it).
- **For A:** with the GPU on, `__dbg.readyB / usableB` answer true and `warm()` returns true at once (nothing to bake), so
  the summon is not held and `drawHeading` never snaps. If the GPU drops out, they answer the 2D bake state again.
  `drawSpin`'s ghosts go into the body's own GPU pass. New exports: `NIDHOGG_MODEL.gl`, `.stats`, `.COUNTS()`, `.SIZE`
  (`length` 12.4, `span` 10.5, `height` 2.4, `nose` 5.0, `tail` 7.4, `seatZ` 1.04 tiles, hover pose, scale 1). Drawn size is
  the 2D model's (no retune needed). The neck and tail are drawn at 0.8 and 0.6 of the rig's radius and the torso at 0.88
  of its width, to match the 2D silhouette.
- **For H:** one pass, 16 items, 31 draw calls (with outlines), about 60k triangles (120k with outline hulls); dynamic
  meshes about 17k vertices rewritten a frame (1.4 ms median on the test machine's CPU); mesh build 65–150 ms once (at
  warm). Extents (farthest point from the body's origin, tiles, scale 1), worst over each clip: tail blade 9.0, tail 7.45,
  head 5.75 (6.1 in the dive), wings 5.5, membranes 5.2, legs 3.0; the seat is never covered (nearest other geometry
  0.14 tiles below it, a back spike's base). Suggest adding Nidhogg to `tests/gl.js` (`NIDHOGG_MODEL.gl` with the flag).

## Notes (M, 2026-11-13): bigger wings (the user: 1.5x length, 1.1x width)

- In the rig (`20k6f`), so the GPU model and the 2D fallback match: the wing's span by `WSPAN` 1.5, its chord by `WCHORD`
  1.1, its droop by `WZ` 1.25. The shoulders (roots) and the hip attachment are unchanged; veins and scalloped edge kept.
- **New joint channels for A** (amounts about 0, in `CH`, eased to 0 by `relax`): `shoulder` (-1..1, raises or lowers
  the whole wing on top of the flap), `elbow` (0..1, sweeps the forearm back), `wrist` (-1..1, droops or lifts the hand
  and fingers), `fingerSpread` (-1..1, fans the fingers), `billow` (0..1, the membrane's belly; GPU only).
- **A (camera):** `SIZE.span` 10.5 -> 14.8 tiles; `height` 2.4 -> 2.8; length unchanged (12.4).
- **H (extent guard):** the wings now reach 8.9 tiles from the body's origin (was 5.5); the tail blade is still the
  farthest point at 9.0. Clearance through every clip: wings at least 2.0 tiles from the head and 1.47 from the tail
  (summon); with the new channels at their limits (all folded) 1.36 from the tail; the seat is never covered (0.14).
- **E:** `wingL` / `wingR` (the roots) are unchanged; `wingTipL` / `wingTipR` (finger tips) move out with the span.

## Notes (M, 2026-11-13): the 2D fallback's bake (the summon's hold on a CPU renderer)

- The bake cost did not change with the bigger wings (the baked pictures are the same pieces at the same sizes: torso
  258x141, head 279x156 at k 72; the full bake 55 s before the GPU work, 59 s with the old wings, 59 s now on the test
  machine), and the time to flight was the same before and after the wings (hold 6.2 vs 6.9 s of game time, about 16 s
  real): the summon waits for 48 quick pictures (8 headings x 5 pieces at half scale, plus the 9 bones).
- Fixed by making those quick pictures cheaper: half the occlusion samples, a shorter shadow march, no edge
  supersampling (the sharp pictures, baked after, keep full quality). Now: the 48 quick pictures take 1.3 s of bake time
  (was 3.0 s), the hold is 1.15 s of game time (was 6.9 s), flight starts 8.6 s real after the cast (was 15.8 s).
  `elem-moves` (fire) passes with Nidhogg dealing damage; `nidhogg-ultima` passes at EVO 1/4/7; `nidhogg.js` 25 ok.

## Notes (A, 2026-11-13, v326): camera, the Ultima's wings and the ring

- **Camera:** the flight zoom is 0.585. It was 0.78; the user asked for 25% further out. Every zoom the moves and the
  Ultima ask for through `ctx.camera` was authored against a 0.9 flight zoom, so it is now scaled to the flight zoom.
  The Ultima keeps half its pull-back (`ULT_CAM_K` 0.5): charge and beam about 0.49, blast about 0.48 (was 0.6 and
  0.57).
- **The wings under the ring:** through the whole Ultima the core holds the wings spread low and back (`ULT_HOLD` in
  `20k6g`). It eases in over 0.2 s from the cast and out after it, over every clip, with the core's anticipation and
  recoil on top.
- **For H (a check to add):** `ELEM_IMPL.fire.ult.nidhogg.__dbg.ultWingCheck({ ringK })` runs the `ultima`, `beam` and
  `settle` clips frame by frame with the hold applied. For each frame where the ring shows, it measures every wing
  point (elbow, wrist, the four finger tips) against the ring's plane. It returns
  `{ clearance, frames, at }`: clearance is in rig units below the plane, and above 0 means no wing reaches the ring.
  - Today it gives 1.2 with `ringK` 1.6 (E's larger ring, radius 1.45 × 1.45 × 1.6 ≈ 3.4 rig units). Without the hold
    it would be -3.2: in `settle`, a wing tip 3.2 above the ring.
  - It is a plane test: a wing wholly below the plane cannot pass through the ring at any radius.
  - Suggested pass: `clearance > 0.3`.

## Notes (E, 2026-11-13, v326): hard edges, the Ultima ring, the charge aura
- **Hard crops (the user's "common problem"):** fixed: Noise-warped fire / body / smoke and lightning
  halos could reach their quad's edge (a straight cut). Every kind in FGFX (20k6h), EGFX (20k9j) and LGFX (20k4q) now
  fades to exactly 0 well inside its quad (round kinds from 0.72 of the radius, rings / rims from 0.92, strips across
  from 0.8). (The vertical line in the user's screenshots is the game's aged-film filter, not a crop. FGFX, EGFX and
  LGFX also now paint one layer at a time and copy the whole canvas each time: no half-canvas copies.)
- **Ultima ring (20k6f drawRing):** radius x RING_K = 1.6 (outer band 1.45 x 1.6 = 2.32 rig units round R.ring, the
  floating segments to 1.62 x 1.6), rune size x 1.35, a wider brighter bloom, visual spin x 1.5. Both halves are now
  drawn over the dragon (2D items at the top depth; after the GPU body), so no wing can slice through it. A: 20k6g's
  ultWingCheck already uses ringK 1.6, which matches.
- **Charge aura:** the outline no longer turns orange or thickens with P.trace (20k6fa); instead wide, low, overlapping
  orange-red halos along the neck, torso, head, tail and wings, eased in with the charge, with a gentle 4.2 rad/s
  pulse; the 2D path's trace shadow is softer and wider.
