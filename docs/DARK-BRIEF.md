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

# Round 2 — Doomsday (one worker)
File `src/js/20k5f-dark-ult-5.js`: `U.doomsday`, `delete U.forgottenkings` (its row in 20k1 is replaced; cost 100, cd 22).
Follow the spec's Doomsday section in `docs/elem-spec/dark-ults.md` exactly. Mechanics: a pressure mark/warn on the aim,
~1.0 s slow descent to establish size then a sharp acceleration (total ~2.2–2.6 s to impact), ONE major Dark AoE hit at
impact (total ≈ 14 × base × K × evoK — read the old U.forgottenkings budget in 20k5 and match it; kb 7, stun 0.5), area
R ≈ 3.2·K at level 1 growing to ≈ 4.4·K at Celestial; `H.X.negative(0.08)` exactly at impact (once; the hook falls back
to a violet flash under Fewer effects); then the shockwave, eruption, mist, temporary glowing fractures (light only,
fading within ~2 s — no permanent marks, nothing blocks navigation), fragments drifting out. No secondary damage from
decorative layers. The meteor is a real GeoKit volume: a faceted dark core (a `shard`/`bipyramid`-like irregular mesh)
with 3–5 uneven shell pieces round it, violet fractures in the seams that brighten as it nears the ground, streaming
shadow and long dark trails tearing off its rear, purple sparks and dissolving fragments; it tumbles slowly as it falls.
Celestial: colossal, shell pieces visibly shifting round the core with violet currents between them, the widest low
shockwave, a towering dark eruption and a broad fracture field. Never cover the pet: dim smoothly near it. Timing budget
≤ 4 ms typical at Celestial, one heavier impact frame allowed.

# Round 3 — Final Eclipse (one worker)
File `src/js/20k5g-dark-ult-6.js`: `U.finaleclipse`, `delete U.noreflection` (its row in 20k1 is replaced; cost 100, cd 22;
budget ≈ the old Night Without Reflection total — read U.noreflection in 20k5 — ≈ 14 × base × K × evoK as ONE sphere
impact `hitArea`, kb 7, stun 0.5; area ≈ 3.2·K → 4.4·K at Celestial). Follow the spec's Final Eclipse section exactly
(docs/elem-spec/dark-ults.md). Timeline ~3.5–4 s: sphere forms high over the aim (0–0.6) → its underside tears open and
the demon drops out, wings folded, then one decisive downbeat stops its fall beneath the sphere, feather fragments drift
(0.6–1.4) → hovering, it raises both hands; violet streams flow up its arms into the sphere; motes and fragments draw up
from the ground; the sphere swells and its currents accelerate (1.4–2.6; at Celestial the raised pose holds a beat longer)
→ shoulders back, wings brace, both arms drive down: the sphere tears free and plunges, stretching slightly, with a smoky
wake and violet streamers (2.6–3.0) → impact: the sphere compresses to a disc, then a huge low shockwave and a rising
wall of violet-black energy; the demon's wings fold and it dissolves into black feathers and smoke (3.0–3.9). Normal
camera, combat never paused, warnings/enemies visible, the pet never covered (dim smoothly near it).
**The demon is the point: the user wants it "3D like a Super Fiend boss and just as high quality".** Build it as a real
posed 3D figure: study `src/js/02f2-anima-3d.js` (Anima3D: oriented ellipsoid/capsule parts posed by a rig and projected
by a small camera, cel-shaded with bands, ink and gloss — the closest thing to a humanoid rig in the codebase: its
`shared limbs` and its feathered wing at ~line 244), `src/js/20h2-fiend-beasts.js` (`wing(c, K, o)` with kind 'feather':
primaries/secondaries/coverts — raven wings must be feathered layers with articulated shoulder, mid-wing and tip motion
and delayed tips, never bat membranes), `20h4-fiend-toon.js` (the toon shader the last fiends use) and a boss that
composes them (`20i-fiend-06-astaroth.js`, `20i-fiend-12-bahamut.js`). Model: a readable humanoid — head with a
restrained violet eye accent, neck, a torso with faceted/cloth-like dark surface (#180B2E body, #2B0B45 depth, fine
#A55CFF seams at Celestial), upper arms, forearms, hands with simple fingers (they must read as hands raised overhead and
then thrown down), a tattered cloak/robe lower body is fine instead of legs, two long raven wings. Pose keys: fall
(folded), downbeat (spread + follow-through), hover (slow wing cycle), raise (arms overhead, palms up), brace (shoulders
back, wings wide), throw (arms driven down, wings snapping forward), dissolve. Build it as parts in 3D posed per
keyframe with eased blends, depth-sorted, cel-shaded with ink and rim light; cache what is static (feather sprites,
textures), draw the posed figure live. The sphere: a GeoKit/`H.sphere`-style shaded black globe with slow dark-purple
bands, a thin #A55CFF limb, inward-curling shadow streams; at Celestial counter-moving currents and fragments orbiting
just inside the shell. Levels: Adept bigger sphere/area, more feather layers, clearer hand-to-sphere streams, more wing
follow-through; Celestial the grand silhouette, violet seams, the held pose, the largest impact, an outward ring of dark
fragments and a slow rain of dissolving feathers. Check the demon alone in your harness first (neutral light, glow off:
it must read as a winged humanoid with hands from the gameplay camera), then the full cast at levels 1/4/7.

# Round 4 — four workers at once (each its own file; never edit another's)
Rows set in 20k1: umbraheart replaced inkpalace (cost 95, cd 20), thriller replaced ravenfuneral (100, cd 30),
annihilation replaced abyssorrery (100, cd 24). The user wants every one of these "as high quality as fire, ice and light":
true shaded volumes (GeoKit / Anima3D / cached cel-shaded sprites), layered glow, directed particles, feathered edges,
nothing covering the pet, light-only floor marks that fade.

## H — Eclipse of the Hollow Moon, finale change (`src/js/20k5c-dark-ult-2.js`, the existing file)
The user: "it should squeeze into a tiny sphere and then expand and explode into negative energy when it bursts."
Replace the current compression-to-a-disc finale: after the last pulse the sphere SQUEEZES uniformly (all directions,
eased in, its corona and fractures crushed with it, light leaking from the cracks brightening as it shrinks) down to a
tiny bright marble (~0.12 of its size) and hangs for a beat (trembling, a high whine), then EXPANDS violently past its
original size and BURSTS: `H.X.negative(0.5)` at the burst, a sphere of negative energy rushing outward (an expanding
shell with an inverted look — bright pale core, dark rim — and violet-black shards), the shockwave and the existing hits
(the 4.6×base ring hit) moved to the burst moment. Keep the four pulses and damage.

## U — Umbra Heart (`src/js/20k5h-dark-ult-7.js`: `U.umbraheart`, `delete U.inkpalace`)
Follow the spec's Umbra Heart section (in the user's message, copied verbatim into `docs/elem-spec/dark-ults.md` §2)
exactly: one heart at its cast position; formation from rising shadow streams (excluded from the window); sustained 7 s
at level 1, 9 at Adept, 12 at Celestial (7, 7.5, 8, 9, 10, 11, 12); periodic damage timed to the visible beats
(e.g. every 0.7–0.8 s, `hitArea` over the pool), then ONE separately budgeted final burst much stronger than a tick.
Budget: ticks total ≈ 10 × base × K × evoK over the window (scale ticks so the total grows with the longer window),
burst ≈ 6 × base × K × evoK. The heart is a thick, rounded heart symbol rendered as a real shaded volume (reuse the
idea of `globalThis.LU1.thickHeart` from the pink Light ults — a cached shaded face + side band, squashed by |cos| as
it turns — but re-skinned: glossy near-black surface, dark-plum depth, violet fissures that light on each beat, moving
highlights), dripping viscous strands (stretching, detaching, varied sizes), ripples merging into a glistening pool
(light-only rims; the pool itself is a dark translucent surface that fades fully after), mist at the boundary,
fragments rising to the heart; the final burst as the spec says (contract, burst into curved dark-glass pieces, liquid
shadow, violet-black shockwave, pool surge, mist).

## A — Annihilation (`src/js/20k5i-dark-ult-8.js`: `U.annihilation`, `delete U.abyssorrery`)
Follow `docs/elem-spec/dark-annihilation.md` exactly: six circles (one giant + five smaller of different sizes) drawn
progressively with rotating rings, glyphs and spokes; exactly six missiles (central largest) spiralling to a
convergence; an immense overhead sphere fed by six arrivals (ripples), held, then the thick downward strike into the
giant circle; the annihilation blast: concentrated flash, expanding shell, shockwave, a towering column with a
mushroom crown lit from within, circles fracturing, glyphs lifting, temporary cracks, a long beautiful aftermath.
`H.X.negative(0.12)` once at the strike's impact. Damage: ONE authoritative final hit (nothing before it, nothing after)
= 24 × base × K × evoK (the largest single hit and largest burst-ultimate total among the Dark ults: Final Eclipse ≈ 19.6,
Requiem/Doomsday ≈ 14), radius ≈ 4.4·K at level 1 → 6·K at Celestial. (Thriller's 30-second summon army is a sustained
effect whose total depends on how much the player attacks; the lead will tell the user how it compares.) Timeline
≈ 5–6 s plus the aftermath. Celestial: monumental formation, raised rotating rings, six coordinated trails, an immense
layered core, the largest explosion.

## T — Thriller (`src/js/20k5j-dark-ult-9.js`: `U.thriller`, `delete U.ravenfuneral`; plus a minimal commented hook in
`src/js/20b-game-dungeon.js`)
Follow the user's Thriller spec (`docs/elem-spec/dark-ults.md` §5) exactly. Counts by level 3,4,5,6,7,8,10; 30-second
combat phase after formation; each zombie, on each of the caster pet's normal attacks (one trigger per normal-attack
action — find where the dungeon fires the pet's normal attack in 20b and add one hook, e.g. `onNormal` listeners the
elemental core can register on, called once per action with the action's total damage before defences), performs its
own Dark attack at 100% of that normal attack's damage (through hitMon with el: 'dark', attributed to the pet; never
re-triggering the hook). Zombies are real actors: their own position, navigation along the floor (use the game's walk
checks), targeting (nearest valid monster, retarget on death), attack animation, and a modest HP that monsters can
damage if the game has a convention for summons (look for existing summons/animas/clones in 20b/20g; if none supports
taking damage, make them untargetable and say so). At 30 s: the rush (cracks brighten, sprint) and each detonates once
on arrival (substantial AoE ≈ 2 × base × K × evoK each), bounded to 2 s, dissolving harmlessly if no enemy remains.
The zombie is ONE fixed original undead Cocopet design (compact, hunched, rounded head, ragged ears, short clawed limbs,
stitched belly, dark grey + bruised purple, cracked, dim violet eyes, a slow purple pulse in its torso, mist at its feet)
— build it as a cel-shaded rigged figure (Anima3D parts or a cached sprite rig like the pets' `makeRig`) with rise,
idle, uneven walk, attack, sprint and explode animations, offset timing per individual. Clean up every listener, actor
and effect at the end, on floor change and on death. Test: write a scratch test (not tests/) proving the counts, the
30-second phase, that each normal attack produces one zombie attack per zombie at 100%, no recursion, once-only
explosions, and cleanup.

## All
`python3 src/build.py --test-only test-<you>.html` (never test.html; never commit/push). elem-moves at EVO 1/4/7
(`ELEM=dark ONLY=<key>`; Thriller needs a longer tail — if the 30 s phase breaks the test's cleanup check, add `thriller`
to a TAILW rule like lovesanctuary's in tests/elem-moves.js — only T may edit that test). Screenshots (copy
`/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/ray/shot.js`, set 'dark' and your page),
montage `.../scratchpad/<you>/m.png` (rows L1/L4/L7), look, fix, report briefly with timing at Celestial.

# Round 5 — Dead Scream (one worker)

## D — Dead Scream (`src/js/20k5k-dark-ult-10.js`: `U.deadscream`, `delete U.leviathan`)
The row is set in 20k1 (key `deadscream`, glyph `'skull'`, cost 100, cd 43). If the ult-button glyph table has no
`'skull'` glyph, add one (a small rounded skull icon) next to the others, or fall back to an existing dark glyph — check.
Spec: `docs/elem-spec/dark-ults.md` §1 (Dead Scream), with the user's changes below, which override the spec's notes.

A huge vibrating skull hovers above the pet and releases repeated pulses of dark energy into nearby enemies.
- Formation: a knot of smoke above the pet; a violet contour sketches the dome, cheekbones, sockets and jaw; the surface
  fills in dark bone / obsidian with fissures, violet light in the sockets. It follows the pet (smoothly), with small
  controlled vibrations and a slow tilt. Never cover the pet: it hovers clearly above it.
- Each pulse: the jaw lowers, light gathers in the sockets and teeth; the skull jolts and releases a broad dark-purple
  ring (a scream wave expanding over the floor around the pet); jagged sparks scatter from the jaw and cheekbones,
  shadow particles drift down, a ground ripple expands from under the pet (light-only, feathered floor art). The glow
  recedes between pulses.
- Level 1: one large skull, 7 active seconds. Adept (4): larger radius, stronger pulses, branching fissures, a
  fragmented halo behind the skull, two staggered ground ripples per pulse, 12 s. Celestial (7): a monumental skull,
  layered socket shadow, light travelling through its cracks, broken halo segments rotating, each scream a thick low
  dark wave with sparks and ash, 20 s. Interpolate durations by level (7 → 12 → 20).
- Expiry: the jaw closes, the socket light draws inward, and the skull disintegrates into rising smoke and fragments —
  plus the user's FINISHING EXPLOSION: a separate final dark burst around the pet dealing its own damage.
- Mechanics (the user's choices): periodic area damage around the pet (pulse every ~0.5 s; the area follows the pet).
  Each pulse applies FEAR (monsters flee from the pet briefly) and a short STUN — find the game's existing status
  conventions in 20b (grep stun / fear / frozen / slow / m.stun / m.fear); reuse them; if fear doesn't exist, add the
  smallest commented hook in 20b (monster AI moves away from a point while m.fearT > 0) — keep stun short (~0.25–0.4 s
  per pulse, so monsters are mostly locked while in range; bosses: use the game's boss resistance convention if any).
  The decorative sparks thrown from the jaw and cheekbones each create their OWN damage event on the monster they hit
  (small, so totals stay sensible). Totals: aim for a monster in range the whole time ≈ 14× base×K×evoK at level 1,
  ≈ 22× at Adept, ≈ 32× at Celestial, including sparks, plus the finishing explosion ≈ 4× (state the numbers you chose).
- House standard: feather every edge (rings, ripples, beams, halo segments — no hard lines anywhere, the user is
  vigilant about this), light-only floor marks, cached sprites for the skull (render the 3D-ish skull once per level to
  an offscreen canvas with GeoKit/Anima3D or layered paths; animate jaw as a separate piece), and keep Celestial under
  ~4 ms/frame on average. Clean up on end, floor change and death.

Check: `python3 src/build.py --test-only test-ds.html`; `ELEM=dark ONLY=deadscream EVO=1/4/7 HTML=test-ds.html node
tests/elem-moves.js` (add `deadscream ? 24 :` to the TAILW rule if the 20 s run needs it); screenshot montage (copy
`/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/ray/shot.js`) at
`.../scratchpad/ds/m.png` (rows L1/L4/L7: formation, a pulse, mid, the finish), look, fix, and report briefly with
the damage totals and the Celestial timing. Never commit/push.
