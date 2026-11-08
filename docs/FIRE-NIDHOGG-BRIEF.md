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
