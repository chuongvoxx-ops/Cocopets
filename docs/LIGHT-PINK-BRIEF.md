# Pink Light Ultimates — brief (round 1: three of the user's ten)

The user's spec (for ten "premium Light ultimates", cute, feminine, luminous, magical: glowing pink light, rounded hearts,
stars, soft pearly highlights, graceful ribbons, pastel sparkle — still powerful and satisfying) was cut to THREE for
budget: Rainbow Heart Attack, Sunflare, Holy Judgement. Keys in `ELEM_MOVES.light.ult` (already set): **rainbowheart,
sunflare, holyjudgement** (they replace firstdawn, orrery, lanterns — the worker with 20k4b deletes those:
`for (const k of ['firstdawn','orrery','lanterns']) delete ELEM_IMPL.light.ult[k];`). Don't touch other Light moves.
Levels = C.evo 1..7 (Celestial at 7). The user is short on budget: build carefully once, check a few paused screenshots
at levels 1, 4, 7, fix, stop.

## House standard (read these)
- The bar: `src/js/20k8f-ice-ult-5.js` U.catastrophe ("absolutely amazing, what we should aim for") and the fire/thunder/
  ice/water reworks (`20k6*`, `20k9*`, `20k8*`, `20k7*`): shaded translucent volumes, glows and particles round
  everything, buildup → release → fade, cached sprites (no per-frame gradients in loops, no shadowBlur/filter,
  particles via H.n()/H.Q()), never cover the pet (fade/cut-out near it), light-only floor traces, everything cleaned up.
  Pet warnings (H.warn*) are no longer drawn. The runner calls draw/drawUnder with the GAME clock as `t`; timeline logic
  in a draw uses `f.t`.
- Toolkit H: `src/js/20k1-elem-core.js` (`create`). Damage totals ≈ `C.base × 14–16 × C.K × (1 + 0.08 × (evo − 1))`.
  Bosses never locked/moved for long.

## The user's art direction (verbatim essentials)
Pink is the dominant element colour. Saturated rose-pink around the main forms, soft blush on secondary surfaces, pearly
white at narrow highlights and concentrated cores. Palette: main rose-pink glow #FF5CCB; candy-pink body #FF8FDB; strong
magenta accents #E83EAC; soft blush highlights #FFD4EE; pearl-white core and glints #FFF4FC; deeper pink shading #8F2D73;
restrained lavender accent #D5C4FF; Rainbow Heart Attack only: restrained mint #BFFFEA and peach #FFCDB4 accents.
Build from spheres, discs, rings, columns, cones, curved strips, crescents, smooth thick hearts, five-pointed stars,
simple polygons and particles; no creatures/faces/hands/humanoids. Hearts are explicitly required: one reusable rounded
heart shape with thickness and a soft bevel so it stays readable as it rotates (in 2D canvas: a cached heart sprite with a
darker rim band for thickness, lit front highlight, inner glow; when rotating about its vertical axis, squash its width by
|cos| and show the rim/side band when edge-on so it never vanishes). Stars with clear points. Major shapes: darker pink
body, soft internal luminosity, bright moving surface highlights, controlled outer glow; soft bloom on strong accents, not
uniform white fill; preserve contours at gameplay distance. Layers: large shapes establish the attack, medium trails/rings
describe motion, small hearts/stars/glints/dust add detail; phase offsets on repeated objects. Every ultimate: formation,
anticipation, action, impact or sustained action, decay. Keep impact flashes local and brief; enemies, pets and floor
warnings stay visible. Gameplay counts/durations/hits independent of frame rate and particle counts; "Fewer effects"
(st.lowFx / H.Q) reduces fine dust only, never counts, damage or durations.

## 1. Rainbow Heart Attack (rainbowheart)
Massive glowing pink hearts spin like tops and glide through the battlefield, trailing long strings of pastel light.
Model/formation: a thick, softly rounded heart with a pearl-pink interior, candy-pink body and saturated rose rim; broad
moving highlights on its curved front and back; enough thickness to stay visible from all angles. A narrow pink ribbon
curls upward from the pet's cast position tracing a large heart outline; the outline fills with light and gains volume;
its pointed tip tilts toward the ground as it begins turning around its vertical axis; it rises slightly above the floor
with a soft moving pink reflection beneath it.
Motion/impacts: glides through the enemy formation while spinning like a top; leans gently into turns, straightens during
acceleration; smooth sweeping curves, not random direction changes. Several thin glowing strings follow it, stretching into
long arcs round corners; pink dominant with lavender, peach and mint running through selected strands; small heart
sparkles and star glints peel away from the strings and fade at different speeds. On contact: a bright pulse runs from the
heart's lower point to its lobes, a small heart-shaped flash expands at the contact point, the strings briefly tighten
then relax; the heart stays intact and continues; repeated passes with controlled hit intervals.
Levels: 1 = one massive spinning heart, soft ground reflection, three light strings, ~5 s travel. 4 = two hearts on
complementary sweeping routes, strings interweave when they pass, a thin travelling rim highlight and tiny orbiting star
glints on each. 7 Celestial = three hearts glide and spin in a loose coordinated formation before separating toward
enemies; each trails several distinct strings with pastel accents and pearly sparkles; near expiry one final set of
staggered passes, spin slows, they dissolve into nested heart outlines that expand and fade, strings drift briefly after.
Counts by level 1..7: 1,1,1,2,2,2,3. Combat: exactly those counts; per-target repeat-hit interval; finite lifetime; route
around walls; retarget; vs one boss alternate approach angles; strings and dissolving outlines are decorative (no hits).

## 4. Sunflare (sunflare)
A massive love heart hovers above the battlefield for seven seconds, flooding enemies with radiant light while pink hearts
and stars float around its beam. Keep the heart light pink: a smooth heart with a light girly-pink centre, pink body, and
animated curved strips or soft lights forming its corona; a rose-pink outer halo and pink decorative particles. Its
surface carries slowly rotating bands of pink radiance; narrow bright arcs emerge from the corona, curve outward, fade;
depth through its warm interior and brighter edge accents; readable silhouette. The heart appears overhead and brightens
into its active state; a broad shaft of pink-and-blush light reaches the ground, illuminating a huge circular attack
area. Little love hearts and five-pointed stars float around the shaft, rising and drifting in loose spirals, slower than
the light flowing downward through the beam. At each damage tick the corona and ground light give a restrained pulse; no
whole-screen flash.
(The user's spec text was originally a golden sun and its level lines still mention gold; the user rewrote it as a PINK
LOVE HEART — follow the pink heart. Use gold only, if at all, as a faint accent in fine strands at Celestial.)
Levels: 1 = one massive heart, one corona layer, a broad shaft, scattered hearts and stars, exactly 7 active seconds. 4 =
larger area, stronger damage, a second corona layer rotating at a different speed, richer surface light, more varied
heart/star heights, 7 s. 7 Celestial = three layers of moving corona rays, a bright pearl centre, soft rose halo; the huge
shaft carries fine strands while hearts and stars drift round its edges; at expiry the corona folds inward and the heart
dissolves into fine pink (and faint gold) light; 7 s. Combat: periodic Light damage to every valid enemy inside the large
AoE during the 7-second active window (enemies only); no burn; the ending dissolution adds no hit.

## 6. Holy Judgement (holyjudgement)
The pet launches a fan of pink homing lights into the sky and they descend onto enemies in bursts of glowing love hearts.
A large pink heart appears on the ground exactly where the pet stands at cast time; its outer line draws itself from the
lower point up both sides, joining between the lobes; soft inner light fills it; a few tiny hearts rise from it. Bright
projectile cores gather above the pet: each a small pearl-white light in a pointed pink glow with two thin trailing light
strings (simple luminous shapes, not missiles). They launch upward in a spreading fan, trails curving apart; after their
apex they turn toward valid enemies and accelerate down along smooth homing paths (continuous motion, launch through
descent). Each hit makes a clearly recognisable pink love heart at the ground contact that expands rapidly, brightens at
its rim and bursts into smaller hearts, stars and sparkling dust, with a soft circular pink ripple beneath. One damage
impact per projectile; miniature hearts decorative.
Levels: 1 = exactly 7 projectiles, one ground heart, simple pink trails, distinct heart-shaped impact pops. 4 = exactly
10, a two-height launch fan, paired luminous strands spiral round each projectile, impact hearts gain a second faint
expanding outline and richer stars. 7 Celestial = exactly 20 in four quick groups of five; the ground heart has two moving
border lines and a soft pearly centre; long graceful overhead arcs, bright pink-white cores, fine lavender accents in the
trails; a rolling sequence of twenty separate heart bursts across the target group; afterglow decorative. Counts 1..7:
7,8,9,10,13,16,20. Combat: cast heart anchored at the original position even if the pet moves; select valid targets,
retarget if one dies; vs one boss all may select it with staggered arrivals and a balanced total; whole sequence ~3–4 s.

## Files
- Worker A: `src/js/20k4b-light-ult-1.js` — U.rainbowheart and U.holyjudgement (share one cached heart sprite set), and
  the deletes above.
- Worker B: `src/js/20k4c-light-ult-2.js` — U.sunflare.
```js
/* ---------- Light (pink), reworked: <moves> ---------- */
(() => { const U = ELEM_IMPL.light.ult; /* U.<key> = (C, H) => { ... } */ })();
```
## Checking
Build your own page `python3 src/build.py --test-only test-<you>.html` (never test.html; never commit); `node --check` the
extracted script if `__pp` never appears. `HTML=test-<you>.html ELEM=light ONLY=<keys> SHOTS=1 SHOT_MS=750
SHOT_MS_ULT=1700 EVO=1 node tests/elem-moves.js`, and EVO=7. A few paused screenshots at exact game times; look at them.
Scripts in `/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/<you>/`. Report briefly.
