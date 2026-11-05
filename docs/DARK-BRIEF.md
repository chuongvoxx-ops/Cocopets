# Dark ultimates — round 1 (four workers)

The user's full spec is `docs/elem-spec/dark-ults.md`: read its **Art direction**, **Models** and the **Requiem** sections
(the other five designs are not in this round). This round: build **Requiem** (new) and bring three existing Dark
ultimates the user likes up to the standard of the fire/thunder/ice/water/light reworks: **Eclipse of the Hollow Moon**
(more detailed, better-shaded, more 3D sphere; it detonates and the screen turns negative for half a second), **Black
Rose Compass** and **Eventide Spiral** (upgrade visuals and effects, keep what they are).

## House standard (read these before writing)
- The bar: `src/js/20k8f-ice-ult-5.js` U.catastrophe, and the reworked elements (`20k6*` fire, `20k9*` thunder, `20k8*`
  ice, `20k7*` water, `20k4*` light): shaded translucent volumes, glows and particles round everything, buildup → release →
  fade, cached sprites (no per-frame gradients in loops, no shadowBlur/filter), particles via H.n()/H.Q(), never cover the
  pet (dim the whole effect smoothly near it — never a cut-out box), light-only floor traces (no dark permanent marks —
  for Dark, violet light and fading smoke, not black stains), feathered ends everywhere (no hard edges: the user has sent
  back several effects for a hard line), solid cores under additive glow, everything cleaned up.
- Toolkit `H`: `src/js/20k1-elem-core.js` (`create`: add, hitArea/hitLine/hitCone/hitRing, pull, warn, P/burst, sphere,
  fade, ease, X.* = banner, sfx, flash, **negative(seconds)** (new: the whole scene inverts for that long; under Fewer
  effects it is a violet flash), hitstop, shake, ring, boom, light, after). Runner passes the GAME clock; timelines use `f.t`.
- Damage totals: an Ultimate ≈ `C.base × 12–16 × C.K × (1 + 0.08 × (evo − 1))` split over its beats; keep each move's
  existing total and cooldown unless the spec says otherwise. Levels = `C.evo` 1..7 (Adept 4, Celestial 7); stages between
  interpolate; discrete counts hold until their breakpoint.
- The true-3D kits: `GeoKit` (`src/js/20h5-fiend-geo.js`: `cam(X, Y, T)`, `block/prism/pyramid/mesh(v, f, o)`, `solid(c, cam,
  mesh, {R, t, s}, { mats, face(c, i, fr), light, ink… })` — cel bands, per-face painting in face space, glints, ink; see
  `src/js/24b-hub-geo.js` for a large, recent use of it with custom extrusions and face painters) and `Anima3D`
  (`02f2-anima-3d.js`). The user wants the dark pieces "on par with ice, fire, light and thunder": real volumes, visible
  thickness, moving highlights, material differences.
- Palette (spec): void #08050F, body #180B2E, plum #2B0B45, smoky violet #463052, energy #6D28A8, edges #A55CFF, accents
  #D0AEFF. Very dark purple dominant; bright violet only on thin contours, fractures and the most concentrated impacts.
  Readable against both dark and bright floors (rim light + ink).

## Existing code (reuse mechanics/balance; the old drawing is what's being replaced)
`src/js/20k5-elem-dark.js`: `U.hollowmoon` (line ~115), `U.blackrose` (~209), `U.eventide` (~235), `U.lastnight`
(~166, being replaced by Requiem). Read each one's timeline, hits, damage, zones and cleanup and keep that behaviour
(same hits at the same beats unless you say why) — rebuild the picture. Don't edit 20k5; your file reassigns the key
(`U.<key> = …`) or deletes it (`delete U.lastnight`). Rows in `src/js/20k1-elem-core.js` are set (requiem replaced
lastnight; hollowmoon's description mentions the negative flash); don't edit them.

## Files and owners (one new file each; the files sort after 20k5 so they override it)
| Worker | File | Job |
|---|---|---|
| R | `src/js/20k5b-dark-ult-1.js` | **Requiem** (`U.requiem`, `delete U.lastnight`) |
| M | `src/js/20k5c-dark-ult-2.js` | **Eclipse of the Hollow Moon** rebuilt (`U.hollowmoon`) |
| B | `src/js/20k5d-dark-ult-3.js` | **Black Rose Compass** rebuilt (`U.blackrose`) |
| E | `src/js/20k5e-dark-ult-4.js` | **Eventide Spiral** rebuilt (`U.eventide`) |
Wrapper: `/* ---------- Dark, reworked: <move> ---------- */ (() => { const U = ELEM_IMPL.dark.ult; … })();`
Nothing shared is edited by workers. If you want a shared helper, copy it into your file.

## R — Requiem
Follow the spec's Requiem section closely. Counts 1 / 3 at Adept / 5 at Celestial (1,1,2,3,3,4,5), three scheduled
sweeps per scythe over ~4 s, one hit per target per sweep from the blade's swept volume (hitLine/hitCone along the real
arc at the moment the blade passes; decorative trails never hit); total ≈ the old Curtain of the Last Night's budget
(read U.lastnight) ≈ 14 × base × K × evoK, split over the sweeps (the last sweep heavier). **The scythe is a real 3D
model built with GeoKit**: a closed volumetric blade (thick reinforced spine at the socket, broad curved body, long taper
to a hooked tip; model front/back/underside/spine/bevel so it keeps thickness edge-on) with blackened steel (dark, subtle
purple reflections via gloss/glint, brushed detail and fine scratches via the face painter, a few chips), a gunmetal-silver
sharpened bevel that catches a travelling highlight in the fast phase, recessed gothic grooves near the root with #6D28A8
energy running through them; a forged socket with overlapping plates, ribs, rivets, bolts, pointed-arch ornament; a
slightly bowed blackened-wood shaft (grain, scratches), two leather grips with wrap seams and engraved metal bands, a
weighted steel end cap. Proportions: shaft ≈ 3 pet-heights, blade reach ≈ 1.5 — then clamp for the camera (the whole
weapon must fit the phone screen while swinging; measure). Cache the static model per pose bucket? No — it rotates
continuously: draw it live with GeoKit (one scythe is ~6–10 solids; five at Celestial must stay ≤ 4 ms a frame: keep face
painting cheap, pre-render the face textures once as patterns). Animation: a dark portal (a dark elliptical rift with a
violet rim, smoke and ash) opens over the target area; the whole scythe emerges as one rigid object, tilts forward,
pauses poised; each attack = windup (slow back-rotation), cut (fast rotation about a pivot near the grip while
translating along the arc; the head leads), follow-through and settle (a tiny fitting vibration, no bending); behind the
blade a translucent shadow crescent + thinner violet trail + ash following the real path, fading fast so the steel stays
the main object; purple sparks at contacts. After the last sweep it slows, turns and withdraws intact into its portal,
which then closes. Adept: three scythes from staggered positions, brighter engravings, richer trails. Celestial: five in a
loose rotating arrangement round the enemies, engravings lighting in sequence, offset sweeps, interlacing afterimages;
all withdraw intact. Check the model with the glow off (a debug flag in your harness) under neutral light first — it must
look finished — then from the gameplay camera during a full cast.

## M — Eclipse of the Hollow Moon
Keep its beats (warn, 4 pulses, compression, detonation ring, the hits and damage as in U.hollowmoon) and its
silhouette (a great dark sphere over the aim ringed by a silver corona). Rebuild the sphere as a real shaded volume:
near-black body with violet depth, slow-moving dark currents under the surface, a thin #A55CFF limb, a few luminous
fractures that brighten with each pulse, a silver corona of thin curved rays/filaments with occasional flares, shadow
motes spiralling in from the floor, the ground beneath a violet-lit ring (light only). Each pulse: the sphere jolts,
fractures flash, a dark ring races across the floor. Compression: the sphere crushes to a disc with light leaking from
the cracks. **Detonation: it explodes** (curved dark-glass shards, a violet-black shockwave, smoke, a bright #D0AEFF core
flash) and the screen turns negative for half a second: call `H.X.negative(0.5)` at the detonation beat (it exists in the
core now; it respects Fewer effects). More elaborate by level: Adept a second counter-rotating corona layer and more
fractures; Celestial a monumental sphere with orbiting broken halo segments and a slow rain of dark fragments after.

## B — Black Rose Compass
Keep its mechanics (four thorn-needles striking inward in pairs, the rose of folded shadow, its hits/damage as in
U.blackrose). Rebuild: the needles as real 3D thorns (GeoKit tapered spikes with a dark glossy surface, violet energy in
their grooves, ink edges) that form at the compass points on a faint violet sigil, turn to aim, and strike inward with
weight (windup, fast strike, recoil); the rose as a layered volume — dark petals with plum depth, violet rim light,
each petal a shaded curved strip that unfolds in sequence, a glowing #6D28A8 centre, thorned stem/leaves — blooming,
then closing/shattering into drifting petals and dark fragments; shadow mist, floating fragments, light-only floor sigil.
Level growth: Adept richer petals and a second petal layer; Celestial a larger rose with three layers, needles with
branching violet fractures, a final bloom that scatters petals across the arena.

## E — Eventide Spiral
Keep its mechanics (a towering corkscrew of darkness at the aim that unwinds from the top, each coil an expanding hit;
read U.eventide for the exact beats and damage). Rebuild: the corkscrew as a real shaded helical volume — a thick dark
ribbon spiralling up (two-tone: near-black upper face, plum underside, violet edge light), with currents running along it,
smoke and ash in its wake, dark fragments orbiting it, a violet-lit floor ring (light only); the unwinding coils as
expanding rings of torn shadow with luminous rims, each with a readable thickness and a feathered outer edge; a final
collapse into a dark bloom of fragments and mist. Level growth: Adept a second interleaved ribbon and richer currents;
Celestial a monumental spiral with three ribbons, branching violet fractures along the edges, and a last coil that
sweeps the whole arena. Never cover the pet: dim the spiral smoothly where it passes over it.

## Checking (all)
`python3 src/build.py --test-only test-<you>.html` (never test.html; never commit/push). `HTML=test-<you>.html ELEM=dark
ONLY=<key> SHOTS=1 SHOT_MS=750 SHOT_MS_ULT=1700 EVO=1 node tests/elem-moves.js`, and EVO=4, EVO=7 — all must pass (hits
land, cleanup, no errors). Paused screenshots at exact game times: copy
`/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/ray/shot.js` (args KEY EVO times prefix; it
looks the move up as `ELEM_LIST.light['ey_' + key]` — change 'light' to 'dark', set its HTML path; UNDER=1 puts the pet
behind the effect). Work in `.../scratchpad/<you>/`, montage `<you>/m.png` (rows = levels 1/4/7), look at it, fix hard
edges / see-through cores / anything covering the pet, re-run the tests. Report in a few lines: what it looks like per
level, damage per level in the test, timing (ms per frame at the peak, Celestial), montage path, anything you couldn't do.
