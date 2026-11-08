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
- **Bones:** wing arms, fingers, claws, hubs, dorsal spikes and the thigh and shin are traced side-on once and laid
  along their projected bones.
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
| `HEADK` | 2.0 | Head drawn larger than modelled |
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
- `anchor(name)` → world `{x, y, z}` for the last `draw`:
  - body: `mouth`, `head`, `eyes`, `chest`, `belly`, `seat`;
  - wings: `wingL`, `wingR` (roots), `wingTipL`, `wingTipR`;
  - `ventL`, `ventR`;
  - `ring` (the centre over the back);
  - `tail` (the blade's base), `tailTip`.
- `blankPose()`, `CH` (the channel list), `CLIPS`, `relax(P, dt)` (ease toward neutral), `rig(P, t)` (body-local
  points), `preview(opts)`.
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

