# v67 notes (for the report)

1. Unbind second summon: Animas sheet — "Unbind <name>" on the bound second's page and on the main Anima's page.
2. Tower pet panel: Evolve box under the stats.
3. Astral Awakening finishers x2 for every Anima except Bahamut (the 13th, id ophiuchus).
4. Magma (fire + earth reaction) remade: soft molten pool, darker crust at the rim, scorched halo fading into the floor,
   breathing glow, bubbles, rising embers.
5. Super Fiend speed-up (measured A B B A, 12 floors, test browser):
   - soft glows/shadows from copies made at their size, laid on whole pixels (also helps normal floors and Animas)
   - geometric fiends' faces textured/lit through their own outline (no clip per face)
   - fiend light pass: occlusion kept as one picture; both rim/key bands stretched up in one pass
   - Pale: nerves drawn without clips; brain and obelisk pictures on whole pixels
   - kept pictures on whole pixels, only their used part copied
   - Nuckelavee painted in two halves over two frames (no more 2ms/28ms alternation)
   - busy device: kept pictures repainted half as often again before any light pass is dropped
6. Leo: 3 boss bars (pierces armour).
7. Feathered: strike flashes, light sheets/columns/beams, Cerebral Tide, plain floor hazards; telegraph outlines crisp.
8. Team sheet: Anima slot, tap to bind.
# v68 notes (for the report)

Request (16:51): floor 120 Bahamut still slow on mobile; is it the size? optimise for phones, may shrink it 35%.

Why it was slow
- drawn at 1.2x: wings about twice the screen's width; five kept pictures each the full screen (cleared, repainted,
  copied whole every frame even where empty)
- tentacles' far reaches (they cross the whole floor) painted twice: under the rings and again over them
- every feather shaded through 2-3 clips
- v67's general speed-up only gave it -8% (41.2 -> 38.1 ms mean)

What changed (only src/js/20i-fiend-12-bahamut.js, plus two adaptive fallbacks)
- 35% smaller in the fight (BIG 1.2 -> 0.78); jewel keeps its old hit reach; the Anima (Ophiuchus) keeps its size
- each kept picture only as big as what it holds (gyroscope pictures hold the rings; wings, fish, tentacles their own)
- tentacles split at the gyroscope: inner part under the near rings, far reaches once, over everything
- feathers shaded without clips (smooth outline, bands by even-odd fills)
- 12-arcade.js: second resolution step 1.5 -> 1.25 if still <= ~half speed after the fiend has dropped its light passes
- 20h-fiend-core.js: quality raise that has to be undone within 5 s doubles the wait before the next try (no 1 s
  stutter every 8 s on a borderline phone)

Numbers (test browser, software rendering, 390x844 @2x, A B B A)
- Bahamut v67 -> v68: mean 37.2 -> 27.8 ms (-25%), median 35.7 -> 26.9, slowest 10% 49.1 -> 37.0
- vs v66: 41.2 -> ~28 ms (about a third)
- parts now: tentacles 5.4, wings 4.4, rings 3.1, fish 1.2, runes 0.9, sparks 0.8, bloom 0.4 ms; arena etc ~11 ms
- corrected v66 -> v67 over all 12 fiends: mean 30.4 -> 25.4 (-16%), median 28.4 -> 24.3 (-14%), slowest 10% 41.2 -> 33.9 (-18%)

Checks: mechanics (4 stages, failed + won Final Judgment), Anima Bahamut pictures, _dpr-step (10/10), battery.
# v69 notes (for the report)

Request (19:26): boss movement still slow and laggy; what if the arena is simplified; what would halve the draw time?

Where a floor 120 frame went in v68 (test browser, lowest quality at 1.5x, which a struggling phone falls back to):
- Bahamut ~57%, arena ~17% (sky 1.6 + wisps 0.8 + vignette 0.7 of 18.1 ms flushed), HUD ~12%, pet and the rest ~11%
- so the arena alone can't halve it: removing it entirely saves about a sixth

Why "slow": the game caps a frame's step at 1/20 s, so below 20 fps the whole fight runs in slow motion.
Why "laggy" boss: the colossus is kept as pictures repainted every 3rd frame; on a busy phone (from v67) every 4th,
and that kicked in before any lighting was given up.

What changed
- arena: the sky copied only where the platform doesn't cover it (most often a strip top and bottom); at reduced
  quality no screen vignette and no floating wisps; fewer wisps in Super Fiend arenas at full quality
- pet: drawn from a canvas copy of its SVG, not the SVG itself (its breathing changed its size every frame, so the
  browser re-rendered the SVG every frame: 1.1-1.5 ms a frame, more than the whole arena; every Tower floor and helpers)
- Bahamut: two kept pictures, not five (stepped: wings in 2 steps; body in 3 steps back to front), so two copies to
  the screen a frame instead of five; picture boxes only worked out when repainted
- Bahamut at reduced quality: no faint tentacle halo (5% alpha), no light pulses at lowest; at lowest also plain fins,
  no ring bevel lines, unlit runes just their plates, lit runes one glow stroke, no feather shafts, soft inner tentacle
  stretch one band
- HUD: labels, level badge, TAP button kept as pictures; boss name cut to fit once
- repaints slowed (x1.5) only after all lighting is given up (q 0), not first

Numbers: see bat/abba-v69q0.log, abba-v69q2.log, abba-v69all.log
# v70 notes (for the report)

Request (20:44): floor 120 Bahamut +15 bars, attacks +25%, rings spin more / livelier, wings flap more, tendrils
thinner and shorter ("would that improve performance?"), 3 more attack types.

- bars: 26 -> 41, each the same size (FIENDS extraBars 15; barHP from baseBars 26), so ~58% more health; phases at
  the same fractions; first-clear rewards still count 26 bars (21-dungeon.js uses baseBars)
- damage: m.dmg x1.25 (FIENDS dmgK) -> every attack (all are multiples of m.dmg)
- new attacks (each stage turns through four now; pickJob % 4):
  - I Feather Storm: wings rise and beat hard; 3 volleys, from each wing a fan of 5 feathers at the pet (0.6 dmg each)
  - II Halo Discus: 3 golden lanes, then 3 halos thrown down them that fly out and swing back home; two throws
  - III Cage of Light: 7 blows in a ring round the pet with one gap (marked OUT), bars of light linger, centre struck;
    the bars strike again violet 3.2 s later
  - IV Wings and Rings: the feathers and one throw of halos together
- rings: spin x1.6, tumble x1.4, each sways (0.15 rad, outer 0.07) and bobs; at full quality the colossus is repainted
  every other frame (2 steps) so the faster rings move smoothly, every third (3 steps) once quality drops
- wings: beat 0.3 -> 0.44, lag 0.22 -> 0.3, rate 2.6 -> 3.1 rad/s; raised and harder in the Feather Storm (M.flare)
- tendrils: 30% slimmer; at rest 28% shorter (and lower arcs); attack poses still reach their targets; Anima unchanged

Checks: _bahamut-mech (all stages, new jobs in rotation, fail + win), _bh-new (each new attack lands, 41 bars, x1.25),
shots at 4 stages, battery. Numbers: bat/abba-v70q0.log, abba-v70q2.log
# v71 notes (for the report)

Request (21:35): floor 100 Pale Intellect smooth until the second brain (phase 2), then slow. Optimise (second brain's
resolution/detail, all resolution and textures for phones), cut draw time as far as possible without changing the look,
mainly phase 2. +10 bars, attacks +15%, 2 new phase II attacks, 1 new phase III attack.

Cause of the phase 2 slowdown (measured, test browser, full quality): each brain's body is a kept picture repainted 24x/s
(real) and 12x/s (lie): two bodies = 36 full repaints a second (folds: 7 strokes a half over hundreds of points,
porcelain, bands, sheen). Repaints alone were ~6.4 ms a frame on average in phase 2, plus its nerves ~4.6 ms.

What changed (all look-preserving; pixel comparisons against v70 at matching states, rest/thinking/hit flash, 3 phases):
- still pictures: the two halves of each brain (folds, porcelain, bands, sheen, outline) are painted once while the brain
  holds its shape on screen; the thought light in the folds is its own picture per half (pre-hidden under sheen, outline,
  gloss and the near half), added at its strength each repaint. A repaint is now: copy + light + fissure + sense beneath
  (+ the lie's broken outline). Hit flashes use a second still picture (made once). While the shape changes (zoom, halves
  parting) the whole body is painted as before. Pixels vs v70: max 6-8 of 255 on <200 of 1.2M pixels.
- the petal ring round the sense beneath: one picture per hundredth of a radian of its slow sway (21 per brain, each made
  once), laid on whole pixels (shift under half a pixel).
- thought-light pictures cropped to their half.
- the lie's coarse picture enlarged once per repaint (12/s) instead of every frame (an enlarged copy costs several plain
  ones); position now on whole pixels.
- toon tubes: outline path built once (fill, flash and stroke share it); edge strips of no width skipped.
- floor marked as a solid disc: the sky is not copied behind it.
- tried and dropped: painting nerves together in one path (slower: one big mask instead of several small ones).
- repaint pieces per frame (phase 2, both brains): 1.76 -> 0.83 ms after the petal/glow changes.

Numbers (test browser, ABBA 180 frames, v70 -> v71 before the attacks were added; see bat/abbap-c5q2.log, c5q0.log):
- full quality 2x: p1 median 13.6->10.6, p90 29.3->13.5; p2 median 17.8->12.4, p90 26.1->16.8, mean 18.6->13.1;
  p3 median 14.0->14.2, p90 26.9->18.2, mean 18.0->14.3
- low quality 1.5x: p1 mean 11.1->8.1, p90 18.0->10.3; p2 median 13.0->8.6, p90 22.1->12.5, mean 14.2->9.3;
  p3 mean 11.1->9.1, p90 17.2->11.7
- phase 2 now costs less than phase 1 did in v70.

Balance: FIENDS pale extraBars 10, dmgK 1.15 -> 32 bars (22 base), each bar the same size (barHP from baseBars), blows
x1.15; first-clear rewards still count 22 bars.

Final numbers, finished v71 vs v70 (bat/abbap-v71q2.log, v71q0.log):
- full 2x: p1 median 15.3->11.0, p90 32.5->14.4; p2 median 18.3->14.3, p90 29.0->17.2, mean 19.8->14.4;
  p3 median 18.0->12.5, p90 31.4->17.5
- low 1.5x: p1 p90 19.4->11.1, mean 11.1->8.2; p2 median 12.4->8.4, p90 23.1->11.6, mean 14.2->9.1;
  p3 median 9.6->8.3, p90 20.3->11.8

New attacks:
- II Twin Tides: both minds roll out a tide at once; the lie's ring is broken (dashed, harmless) and its false gap opens
  where the pet stands; the real one's gap is narrower (0.48 rad) and well aside (1.5x dmg). First built with a second
  real tide 1 s later, dropped: a tide's soft band (8-stop radial gradient) is the costliest thing on the floor (~3-6 ms
  per ring here), two real rings at once cost ~+8 ms; now ~+4-5 ms, about phase I's Cerebral Tide plus the lie's ring.
  (Tried: start-at-zero gradient, 7 two-stop pieces, angular sectors - none cheaper.)
- II Racing Thoughts: 8 marks in 2.9 s, alternately under the pet (real, solid) and where it is running (the lie's,
  broken); with no lie in the room, 6 marks, all real (1.4x dmg each).
- III The Watching Sky: the sky's eyes open wide; three gazes (pool of light, rim, an eye that follows the pet) drift
  after the pet at about half its speed; one that holds it 0.7 s fixes (ring fills round, turns white, a shaft of the
  sky's light falls on it) and strikes 0.5 s later (1.6x dmg); each strikes at most twice; they close after 7 s.
  Rims are kept pictures and shafts only on a fixed gaze (stroked circles and always-on shafts cost ~2 ms more).
- phase II now turns through 6 attacks (+ Sever), phase III through 4 (+ the Name).

Checks: tests/_pale-new.js (bars, x1.15, each new attack lands; marks and tides counted), _pale-soak.js (natural rotation
in II and III, no errors), pale.js (whole fight), _pale-px.js + _pxdiff.py (look vs v70), _brain.js shots, battery.
# v73 notes

Request (Tue 09:15): pity on 10-egg summons; fusion rank-up chances; six-star redesign.

- Pity: st.pity10 counts 10-egg summons in a row without a 6★ (single eggs don't count). At 10/10 the next 10-egg
  summon forces one egg to 6★; any 10-egg summon with a 6★ resets to 0. Shown as a bar in the summon sheet, in the
  ceremony subtitle when guaranteed, in the odds text and the dungeon summon box. Saved (and st.summons now saved too).
- Fusion rank: child takes the parents' rank (higher when they differ; it used to be re-derived from traits and could
  fall, e.g. 5★+5★ -> 4★). Same rank may rise one: 3★ 20% (+5%/extra pet, max 50%), 4★ 25%/30%/35%... max 50%,
  5★ 5% +1%/extra pet -> 6★ Legendary. Rolled only at real fusion; Merge all: one roll on the whole group, its chance by
  group size. Stored as form x.rank (rarityOf clamps traits into the rank's range, so abilities follow), x.forged
  ("Star-forged" trait). The old +1 for fused generations is gone. Chances shown in the fusion note, the merge sheet
  and on each same-kind row; result says "Rose to N★!".
- Six-stars: x.leg {w angel|dragon, a, b, c}: wing colour, tip/bone colour, light colour; random per pet (300/300
  distinct in test, coats of every hue). Cute: sparkle/big/star/heart... eyes kept through evolution, sweet mouths.
  Wings: 1 pair at stages 1-2, 2 at 3-4, 3 at 5-6, 4 at 7, drawn larger every stage (55 -> 150 px across in the test).
  Angel: cel-shaded rows of feathers (Bahamut's feather plan in 2D), inked, tips coloured; dragon: membrane with
  shaded scallops, inked bones, claw. Extra pairs smaller and paler behind the main pair. Two lights orbit on a tilted
  ring from stage 2, passing behind and in front. Aura sunburst, armour, brow jewel in the pet's light colour.
  Halo stage 3, pauldrons 5, armour 6, crown 7. v72 golden pets get colours from their seed on load.

# v74 (Tue 10:09): wings beat, no overlap; legs attached; developer 100% six-star switch
- Pairs fanned round one root: 2nd above main, 3rd below, 9° gap between the angles each spans past the body; extra
  pairs drawn folded (fingers/feathers closer) until the fan fits under upright. Max three pairs (from Guardian).
  Each pair animates: rises and folds in (narrower across) on the upstroke, sweeps down and spreads on the downstroke,
  pair after pair; deeper when walking/flying; companions in the room beat too. Rise held to the fan's room.
- Legs: shanks start inside the body above its underside at the leg's x (bodyBottomAt), so feet never float.
- Developer tools: "Every egg a six-star" switch (st.dev6, saved): summons and hatched eggs 100% six-star.
- Fixed in passing: a duplicated else made ordinary pets' wings vanish in a draft (caught by the grid compare).

# v75 (Tue 10:42): Celestial six-stars float; a fourth, still pair of wings
- Stage 7 Legendaries float (about a quarter of the pet's height, drifting; lower asleep; down when held or perched);
  companions too; taps and hearts follow the float. Shadow shrinks with height.
- Fourth pair at Celestial: smallest (0.56), below the third, folded, holds still (no beat); the others' downstroke
  is held to 7 degrees so the third never reaches it. Beat now closes each wing about its own middle (squash across
  its axis) instead of squashing horizontally, so angles never grow toward a neighbour.
- rank-pity test: the merge-all group no longer picks the lead pet's element (it made the group five, flaky).

# v76 (Tue 11:05): the fourth pair beats gently; a magic circle under Celestial six-stars
- Fourth pair: in time with the third, at 0.35 of its swing and fold (gap to the third: 9 + 7 degrees, the third's
  downstroke 7; relative close <= 4.6).
- Magic circle: two CSS-turned layers (outer 28 s one way, inner 16 s the other; whole pictures turning, compositor
  only) in the pet's light colour, tilted flat on the floor under the pet, its size, pulsing; companions too.
  Outer: glow, two rings, a band of 24 made-up runes, ticks, an eight-pointed star; inner: ring of dots, six-pointed
  star, small star at the heart. Float lowered a little (0.19 of the pet's height).
- Fixed: the pet's svg lookups now take the pet's own picture (the circle's svg came first).

# v77 (Tue 11:52): six-stars grow 5-10% each evolution; chest gem clear of the mouth; performance
- Growth: legScale(p): room scale so the drawn body (top of its outline above the floor) is 5-10% taller each stage
  (seeded per pet), overriding the stage table (which stops growing at Guardian). Legendaries are also never drawn
  smaller to fit the room's frame (their wings had been shrinking them). Measured: 1.051-1.100 per step, 4 pets.
- Chest gem: at least 17 units below the mouth, on the belly if need be, never off the body (all pets).
- Performance (trace: paint/raster per frame, test browser):
  * Tower floor with a Legendary lead: 41 -> 59 fps, raster 7.7 -> 0.3 ms/frame. Cause: the map's portrait of the
    pet behind the Tower, repainted for every turn of its aura. Now the room's and map's animations pause while the
    Tower/a game covers them, and those views are not drawn at all under it; auras and halos move only in the room and
    on the evolution screen (still in lists, cards, portraits).
  * Room with three Legendaries: raster 7.4 -> 0.4 ms/frame. The aura, each wing and the lights are layers of their
    own round the picture (petRigHTML), each sized to what it holds, moved by CSS transforms only.

# v78 (Tue 12:59): magic circle and float in the Tower; crash diagnosis (memory churn)
- The circle was only in the room (HTML); the Tower draws the pet on a canvas. Now the dungeon draws it too: two
  pictures per colour and size (magicCircleCanvas), turned opposite ways and squashed flat under the pet, pulsing;
  the Celestial pet floats there as in the room (shadow shrinks with it). +0.3 ms median on floor 8.
- Crashes: no script errors on floors 7-9 in the test browser; Safari on a phone reloads a page that runs out of
  memory, and the floors were asking for a lot of it in passing: canvases made and dropped (probe _dun-mem.js, dpr 3):
  * blitSized made a new sized copy for every size a growing ring or glow passed through: ~70 canvases a second,
    10-35 MB a second of pictures to throw away. Now a copy is made only for a size asked on 8 different frames.
    Steady play: 1-2 MB/s.
  * Light holes (lit floors): a size every 2.5%, flickering torches asked for many: 141 MB in the first seconds of a
    floor. Now 4% steps, and the ones let go are emptied at once: 36 MB.
  * Text pictures let go are emptied at once too.
  * Floor start total: 178 -> 74 MB in the first 4 s; live canvases unchanged (~70 MB while playing, ~37 after).
- Frame times unchanged (floor 8 12.8 vs 12.5 median, floor 43 21.3 vs 21.4).

# v79 (Tue 14:18): Super Fiends from floor 60 harder
- fiendFor: from floor 60, +10 bars rising to +20 at floor 120 (round(10 + 10 * (n-60)/60)), blows x1.30 rising to
  x1.40, on top of a fiend's own (Pale +10 x1.15, Bahamut +15 x1.25). Each bar's health and the rewards unchanged.
  60 babylon 24 bars x1.30 · 70 abaddon 28 x1.32 · 80 azathoth 31 x1.33 · 90 choronzon 35 x1.35 · 100 pale 49 x1.57 ·
  110 akkorokamui 42 x1.38 · 120 bahamut 61 x1.75. Test: tests/fiend-hard.js (in the battery).

# v80 (Tue 14:45): four lights at Celestial; lights in the Tower too; measured in the room and the Tower
- legendStage: lights 4 at stage 7 ("Two more lights swirl around it"). Ring 1: 0.86 radius, tilted the other way,
  a little higher, turning the other way and faster, lights 0.78 the size.
- Room: each light is now one element (it passes behind/in front of the picture by z-index, not by a second copy),
  so four lights need the layers two did: 52 layers before and after, same memory (~49.7 MB estimate); paint/raster
  unchanged (raster 0.5/0.5 ms, draw-and-swap 2552-2563 -> 2354-2497 ms per 4 s, noise).
- Tower: lights were never drawn there (the game picture is made without them); now drawn on the canvas from one
  small picture each (legLightCanvas, a few kept): floor 8 median 19.8 -> 20.3 ms, floor 43 25.6 -> 24.3 (noise);
  canvases while playing 75.8 -> 77.1 MB, after 35.5 -> 36.0; garbage made unchanged (7 MB/4 s settled).

# v81 (Tue 15:31): floor bosses beside the pet, x4 health x1.3 blows; pets animated in parts in the Tower; livelier walk
- Floor bosses (guardians and act bosses) all drop in beside the pet when the floor is cleared (act bosses used to
  wait in their arena, often 18-20 tiles off); the camera's pull toward a boss is held to 3.2 tiles. Health x4,
  blows x1.3 (makeBoss). Test: tests/floor-boss.js (battery).
- Tower pet in parts (loadRig/drawPetRig): behind-body, body+face (x3 faces), foot, arm, wing; the far side drawn as
  the mirror. Feet step and shuffle, arms swing, a Strong thrusts the arms forward, an Ultimate raises them high;
  six-stars' wing pairs beat (16 frames per pair drawn ahead), ordinary wings flutter; arm/wing turns drawn ahead to
  3 degrees; each part cut to the pixels it paints (the body's shading mask had made its box 2.5x too big).
  Pet draw: ordinary 0.4 ms (whole 0.4), six-star 0.8 (whole 0.7) in the test browser.
  Floor frames (median ms, v80 -> v81): ordinary 17.1 -> 16.2 (floor 8), 26.1 -> 23.9 (43); six-star 21.8 -> 20.5,
  24.5 -> 26.2: within noise. Memory unchanged (77.6 vs 76.5 MB while playing, 36.7 vs 36.3 after).
  First floor of a session ready 0.2-0.4 s later (parts made); later floors as before (parts kept per form; the
  party's other pets' parts made during play).
- Home: feet lift 8 (was 5) and shuffle as they step; arms swing 26 degrees (was 14).

# v82 (Tue 16:37): soft rays everywhere; the red square; copies of the pet that move
- Red square: the Tower pet's happy and hurt faces (Counter, level-up, a win / a hit) were made with the normal face's
  defs, but each face's shading, mask and clip have their own ids (pp3*/pp4*/pp5*): the shading square showed unmasked.
  makeRig now gives each part its own picture's defs. Also part boxes measured with 12 units of room (getBBox leaves out
  strokes: an arm's round shoulder was cut flat); the pixel crop keeps them as tight. Probe: tests/_square.js (60 pets, 0).
- Copies (Mirror Twins, Shadow Army, Mirror Image): drawn still (whole picture, happy face). Now, while any are out, the
  pet in parts is drawn once a frame into one canvas (petSnap) and the pet and every copy are laid down from it, so they
  step, swing and beat their wings with it. Only the painted box is cleared and copied (drawImage tracked in that canvas).
  Pet + copies (test browser, ms): six-star 2 copies 1.8 -> 1.8, 4 copies 2.8 -> 2.3; ordinary 1.2 -> 1.1, 2.2 -> 1.4.
  3072 poses x 24 pets: none reach the canvas's edge. Tests: tests/_clones.js, _clone-cost.js, _snap-edge.js.
- Rays: softRay/raySprite (20-dun-data): gaussian across to exactly 0, rounded soft ends, three pieces so ends stay as soft
  as the ray is wide. beamSprite/columnSprite now reach exactly 0 at their sides (they stopped at 4 and 10 of 255).
  Changed: monster lasers (aim band, lock, fire: the diagonal pink/white beam), laser fence, sweep beams, laser/needle
  shots (rainbow by hueHex), lightning (soft glow end to end, crisp line inside), fiend vfx 'beam' (Choronzon), Choronzon
  cage walls/curtains/swap/spears, Pale tethers, Bahamut Judgment beams (no clip edge), its light from the ring, falling
  lances, star streaks, reticle lance, rune column, Aion shine/toon columns and Radiant Lance pillars, Abaddon's death
  line, anima Judgement pillar and summon shaft (flat feet), accessory pickup column, Dragon Breath (fan of rays),
  Eclipse corona, fiend aura god-rays (sheetSprite). Left as they were: warning outlines (telegraphs), dashed guides,
  spear heads, silk, UI banner lines. Test: tests/_rays.js.

# v83 (Tue 19:11): the game and its pets are Cocopets
- Page title Cocopets; intro "Cocopets · Series 1" (was Pocket Pals); hatch lines say Cocopet; loading label. Save key
  (pocket-pet-v1) kept so saves load. Places (Pocket Town, Pocket Realm, Pocket dimension) and everyday "pet" in menus kept.

# v84 (Tue 19:46): butterfly, dragonfly and crystal wings; rings instead of the circle for some Celestials
- makeLeg: after the old draws (so seeded pets keep colours), 48% get a new kind: butterfly 17%, dragonfly 16%, crystal
  15% (own a/b colours; v 0..1 shape variation; dragonfly n7 3|4). ring: circle 30, light 25, metal 20, element 25.
  cleanForm keeps w (LEG_KINDS), ring, n7, v. Existing pets: unchanged (circle, their wings).
- Pairs (legPairs): butterfly 1 always; dragonfly 1,1,1,2,2,2, then 3 or 4 (6/8 wings); crystal 1 to Junior+, 2 from
  Guardian (5); angel/dragon as before. Wing trait: butterfly/fairy/crystal.
- butterflyWing: forewing + hindwing traced from the reference's proportions; young plain and rounded, points, tail,
  veins (from the inner cell), cross-veins (Guardian), spots, eye-spot; Celestial: gradient panes to its light colour,
  scalloped hindwing, filigree flecks, sparkles; drawn 0.74-0.82 of the stage size (tall). Hindwing x0.8 below.
- dragonflyWing: clear blade (gradient fill, sheen), 3 long veins, cross-vein net (finer each stage), strong leading
  vein, pterostigma (light colour at Celestial).
- crystalWing: shards laid like feathers along an arm (3 young -> 7 Celestial; second pair 2 fewer), lit/shaded facets,
  bright edge, little shards over the roots, glints; Celestial tips in its light colour.
- Beats (LEG_BEAT [speed, swing, close]): butterfly 0.55/1.3/1.5, dragonfly 2.1/0.5/0.35, crystal 0.75/0.75/0.25; room
  legMove (data-beat) and Tower drawPetRig (rig.beat). Layout keys per kind/stage/v; fans never overlap (gold-art).
- Rings (ringSVG via magicCircleSVG style/el): light (glow band, ring, three comets), metal (18 hooked blades, grooved
  band, studs; gold/silver/bronze/iron from the light colour; inner toothed ring), element of the pet's coat: fire
  tongues, ice shards, water wave + foam, thunder zigzag, wind gusts, earth rocks, dark thorns, light rays. Spin x1.5-3.2.
  Room: magicCircleHTML(L, f) with animation-duration; Tower: magicCircleCanvas(..., style, el), rotation x spin.
- Cost: Tower pet draw angel 0.7, dragon 0.8, butterfly 0.6, dragonfly 0.6, crystal 0.7 ms; room raster 0.54 vs 0.55.
- Tests: _gold-art (kinds, pairs, fans, rings), _wing-kinds, _one-wing, _wing-floor, _kinds-live, _kind-cost.

# v85 (Tue 21:18/21:31): a third, smaller crystal pair; a butterfly swallowtail pair
- Crystal pairs 1,1,1,1,2,2,3 (the third below, smaller, 3 fewer shards). Butterfly: from Guardian a pair of swallowtails
  (swallowtailWing: pale root, soft spots, dark edge with crescents in the light colour, white veins, long tail) tucked
  below and behind the great pair, lower root (dy), turned down; x0.72 at Guardian/Mythic, nearly full size at Celestial
  (user: three pairs of them at Celestial was too much). Tower draw butterfly 0.9 ms.

# v86 (Wed 09:00 / Thu 09:48): the Tower much harder; floor rules by band (20l-dun-rules.js)
- Scaling (floorDef monHp/monDmg, on monsters, floor bosses, lesser bosses; not Super Fiends): floor layer health x4
  (floor 1) -> x10 (120), blows x1.35 -> x2; from floor 10 a section layer x4 health, x2 blows on top (stacked, as the
  request listed them apart). Totals: floor 10 x17.8 / x2.8; 25 x20.8 / x3.0; 50 x25.9 / x3.2; 119 x39.8 / x4.0.
  Twice the monsters from floor 10 (pack and maxMons x2), never on a fiend floor. Fiends: 10-49 +10 -> +25 bars x1.3;
  50+ +30 -> +50 bars, x1.5 -> x2.0 (replaces v79's 60+ rule). Tests: fiend-hard, floor-boss updated; floor-rules new.
- Bands (never fiend floors): 21-39 keys; 41-59 four guardians; 61-79 curse; 81-99 boon + 4 lesser bosses; 101-119
  chaos (curse + boon + keys; 10% Fortune Reversed: party boon + monster bane). Rolled from the floor seed (rollFloorRules
  before genFloor; a horde/thinned changes the pack sizes).
- Keys: 4 keys in far rooms (freeSpot: walls only; walkPoint needs the pet's flow field). Challenges: ward (60 s, waves
  every 8 s, monsters at the ward chip 10 hp; broken -> key lost, try again), keeper (lesser boss at half a guardian +
  mob of 6), shards (5 within 2.5-7 tiles, 45 s), rift (3 waves of 5, all dead). Boss waits for all 4 + monsters down.
  Keys drawn on plinths (ents kind 10), timers over them; HUD "Keys n/4".
- Four guardians: wakeBoss spawns 4 kinds (guardSpot round the pet); bossDeath counts, g.boss moves to the next, HUD
  "n/4 down"; last one wins. Lesser bosses: makeBoss(B2, {lesser, hpK}); asleep till within 9 tiles with LOS; die like
  elites (no floor win); count as monsters in the HUD.
- Curses: drain 0.5%/s HP+MP (min 1), noheal (heal() blocked), noskill, noult, nosummon (AN.ready/summon replaced),
  noacc (party ST from petCombat without acc), noswitch, nostone (stones cleared, dropStone no-op). Party boons: fury
  x1.5 dmg, haste x1.3, surge cd x2, regen 1%/s, ironskin -40% taken. Cards: astral banners 3 s each at floor start.
- Frames (test browser, v85 -> v86): floor 25 explore 15.9 -> 20.5 ms (alive 98 -> 211), floor 43 13.8 -> 25.8, boss
  phase on 43 (four guardians) 24.8 -> 66.7 ms, floor 85 11.9 -> 27.9. AI update 0.5 -> 1.7 ms.

# v87 (Thu, the Gaia expansion, stage 1): the rift framework, the Drowned Belfry, the Cancer gate
- Files: 20m-rift-core.js (RIFTS registry, defRift, riftDef -> a Tower floorDef with rift:{id,stage,kind,name,total},
  genRift from ASCII layouts (# . ~ = m i S B + legend letters -> M.marks), DunRift.create: objects used by standing
  beside for 0.75 s (once per visit: step away to use again), spawnPacks (o.rmark, NOT mark: the engine's hunter mark),
  setExit, goal, cine, onBossDeath; RIFT_GATES/defGate live here, before the gate files). 20n-rift-01-belfry.js (biome
  belfry: water gaps, blue shallows mud/mudSpot; monsters crawler/leech/reeflantern; bosses kharrox/nhalu/uldroth with
  rift:true, painters + AIs; six stages). 20o-rift-gate-cancer.js (Shell Nursery; mod exposes crabs/nests/S for the
  hook). 21b-rift-ui.js (RIFT_PLAN 13 rifts + 12 gates, the Rifts tab, startRift/startGate, riftFinish/gateFinish,
  rewards). 04-state st.rift {seals, prog, gates, rlyeh}; 23-town map spots; 12-arcade ready panels.
- Engine (20b): M = genRift for rifts; BOSS_KIND = F.bossKind on rift stages (rift bosses are pushed to BOSSES after
  BOSS_BY_ID is built: riftDef falls back to BOSSES.find); floorClearCheck/bossDeath defer to RIFT; boss stages
  g.bossWake=1 (boss asleep at B, wakes within 8.5 tiles with LOS: in the Belfry's small arenas that is as the pet walks
  in); winStage() = section clear -> finishWin; RIFT update/drawGround/ents(kind 11)/drawOver; HUD goal from RIFT.goal.
- Numbers: rift level L -> hpMul riftK(L) = ((8+1.6L)/24)(1+max(0,L-10)/60), dmgMul riftD(L) = (80+12L)/200; the
  Belfry L10: Kharrox 10500, Nhalu 13000, Uldroth 26000 health; no Tower band rules on rift stages.
- Checkpoint st.rift.prog[id] = next stage (a wipe restarts the stage); sealing: +300 crystals, +30 pearls, a sigil
  accessory, next rift opens, gate opens; gate win: Anima unlocked (st.animas.have) + ascend cinematic, +150 crystals.
- Fixed while testing: RIFT_GATES TDZ (defGate ran before 21b), m.mark collision (every frame threw: no HUD, no
  puzzles), boss kind, PT.orb hi: 0.3 (a number for a colour: addColorStop threw per frame), wheels re-toggling while
  the pet stood there. Test: tests/rift-belfry.js (31 checks: tab/map, all six stages' puzzles and bosses, surge sweep,
  sealing cinematic, rewards, the nursery herded by the hook, save/load) in runbat.
- Not built yet: the other 12 rifts and 11 gates (cards say "Not yet built"; R'lyeh hidden till 12 seals).

# v88 (Thu): the chart of Gaia; rifts restructured (18 stages); Belfry bosses rebuilt as Super Fiend-class
- World map (23b-world-map.js, 23-town.js renderWorld/worldPanInit/worldCard): a 1200x1500 painted chart panned and
  pinched (WV state; wheel/pinch/drag; +/- buttons; click after a drag suppressed). Original Gaia: a continent with
  bays, the NE/SE/W isles, nine terrain regions drawn as irregular cel-shaded shapes (polar, heights, crash steppe,
  petrified sanctuary, temporal ruins, sunscorch, dream archive, garden forest, drowned coast), a lake, rivers, cliffs,
  forests, peaks; Pocket Town and the Tower where they were (proportionally). Every destination is a button:
  WorldMap.PLACES (town, tower, great, rifts{12+rlyeh}, gates{12}, extras[14 flavour places]). Rift landmarks are
  original miniatures (tilted bell tower, blossom, sand maw, broken hourglass, ice arch+aurora, crashed vessel, open
  book, hollow moon, veiled eye, star pool, ribbed spire, ring of doors, R'lyeh); a violet rift curls behind an
  unsealed one, its gold sigil after, with a green recovery bloom round the region. Gates: two stone uprights, an
  incomplete gold ring, a constellation (STAR_PTS per sign; dark nodes + lock when dormant). Routes: dungeon order
  (gold once the next is open) and dungeon->gate. Plaques under everything (state lines: "Seal rift n first",
  "Trial available", "Anima unlocked"). Filters All/Dungeons/Anima gates + List (the Rifts tab). Cards (mapCard):
  dungeon (name, level, state, Enter/Continue, Details), gate (sign, Anima, activity, minutes, prerequisite, Begin),
  great rift, road places. Selecting a rift marks its gate (.pair) and vice versa. Bake key includes seals/gates/open/
  rlyeh; K = 1.6 on retina (1920x2400 canvas).
- Rift structure (20m): riftSections(sections) -> 18 stages: fight, puzzle, fight, puzzle, fight, boss x3.
  riftDef = floorDef(L) (the Tower's numbers for the rift's level: monHp/monDmg layers included) + rift land/brood/no
  band rules. Fight stage: genFloor (rooms 7, pack>=10, maxMons>=90, elite>=0.45, events on; no sub-biome mixing on
  rift floors: 20a roomBiome), types = brood x2 + 3 Tower kinds; riftFight: a mini boss (the rift's old boss kinds,
  lesserBoss(kind) with hpK 2) in the farthest room, the exit there, done when all are down. Puzzle stage: genRift
  layouts as before (each section's puzzle kind twice; the second room harder: Twin Basins, Bell Rack 1+4/2+3 to 5,
  Drowned Stair 4 landings/24 s). Boss stage: F.fiend = riftFiend(id, L + 3*section) -> the Super Fiend engine (20h):
  bars = n/5+2 + hard bars (+10..+25 below 50), blows x1.3, totalHP = 20 floor bosses of floor n; genFiendArena; FD;
  the seal via riftSealing on the last boss (RIFT.onBossDeath first in bossDeath). Belfry: 14/17/18 bars at floors
  10/13/16 (353k/465k/640k HP at level 12 party).
- Rift fiends (20t kit: frame/tube/limb/ell/hit/wetFloor/seaSky; RiftFiend.define -> RIFT_FIENDS + FIEND_DEFS):
  20u Thalassor the Bell-Carrier (hermit crab in the great bell: Claw Sweep cone, Toll ring waves with gaps (x2 in
  phase 2), Scuttle charge, Bell Shelter: dmgK 0.05 + brine fans; strike a clapper chain (3 objs, respawn 9 s) ->
  stunned 4.5 s, belly weak point x2.4; phase 2 crawler minions); 20v Veilwrack the Lantern Eel (trail body via
  FiendBeast.trail; Thunderwater lane line-tele 4 wide, two lanes in phase 2; Bite lunge; Lantern Lure fan; Coil ring
  with a gap; 4 drain wheels: beached 7 s with three bulb weak points; leeches on the other wheels in phase 2); 20w
  Ulvora the Sunken Choir (bell-jellyfish: Drowning Bell -> lit valve (strike it) raises a refuge, flood 6 s dps
  outside it, then the dome lifts 6 s with the heart weak point; Undertow pull+burst; the Choir: half the platform
  (islands safe; phase 2 only the raised one); Hymn bursts; reef lanterns heal it in phase 2). All toon-kit 3D cel
  shading (TN.ellipsoid/tube/eye), kept pictures (keep.steps 2).
- Garden and Dunes: taken out of the build (src/js/*.off) until rebuilt on the new structure with fiend bosses; their
  gates (Comet Meadow, Amber Vigil) stay. Old 6-stage garden/dunes tests kept for the rebuild.
- Tests: rift-belfry.js rewritten (34 checks: chart/cards/filters, fight stage + mini boss, puzzles incl. the second
  rooms, each boss's signature mechanic, phase 2, sealing, nursery, chart after the seal).

# v89 (Thu 16:09 notes): puzzle guidance, the door, Veilwrack on Astaroth's rig, the ice block
- Puzzles: every puzzle module may give hint() -> the next object; DunRift draws a bobbing yellow arrow + glow over it,
  an edge arrow with its label when off-screen, and a star on the minimap. Belfry goals are now steps ("Step 1 of 2 ·
  shut the OUTLET wheel (follow the arrow)"), wheel labels say state and action ("OUTLET: open · turn to shut" /
  "INLET: open ✓"), the small basin's wheel is "Practice wheel"; clappers follow a PLAN ([[3,0],[1,1],[2,1]] / 1+4,
  2+3 for the rack) with "Pick up the 3-ring clapper" / "Set it on the LEFT pan"; pans labelled LEFT/RIGHT; the tide
  arrow points to the next valve. Each puzzle has a `how` paragraph on the ready panel.
- The exit: a stone archway, dark until the stage is done, then lit with rays and its label; a green edge arrow when
  off-screen; a door marker on the minimap (clamped to the window's edge, pulsing ring when beyond it).
- Veilwrack (20v) rebuilt on Astaroth's model: the same trail body/fly/body()/wings/head painters (beast kit, scale
  textures), palette indigo/milk/amber, fins of lantern glass (no hour etchings), three brass-caged bulbs on the spine
  (lit in turn; all when beached), a swinging lantern on a chain from the chin. Behaviour as Astaroth's (weave, lantern
  breath cone, swoop line, coil ring with a gap, the Lantern Run = three paths flown backwards) + Thunderwater lanes and
  the drain wheels (dragged down 7 s, bulbs as weak points). No echoes (those are Astaroth's).
- The freeze block (20b ~1698) was a plain rounded square (read as a glitch): now a faceted ice crystal with facets,
  highlight and a turning frost star.

## v90 — Wardstones replace the Twin Basins / Sluice puzzles
- Belfry section 1 puzzles are now WARDS ("The Wardstone Vestibule") and WARDS2 ("The Crypt Wards").
- Four crystals (A–D). Stand by one to wake it; it charges for 60 s and must be guarded.
  Brood waves walk to the stone when the pet is away (>3.5) and chip its 10 lights; at 0 it breaks and goes back to sleep.
- Waves every 8 s of 3 (WARDS) / every 6 s of 4 with elites (WARDS2).
- A wall splits the room; a lever (L, plus K in the crypt) drops the wall tiles. Hint pointer follows A,B,L,C,D(,K).
- All four lit -> door opens. No more water lock / lock-out.
- rift-belfry test rewritten for wards; all passed.
- v90a: wardstone guard time 60 s -> 30 s (user request).

## v91 — 25 s wardstones; the Rushing Gallery replaces the Warded Crypt
- Wardstone guard time 25 s.
- Belfry section 1, puzzle 2 is now RUSH "The Rushing Gallery" (makeRush): a 64-row nave; the tide pushes the pet up
  it (5.4→7.6 tiles/s), stick steers between three lanes (x 3.5/5.5/7.5). Course blocks of 4 rows: mote runs (4 motes,
  lane may shift) or pew rows (1–2 lanes blocked, motes in the free lane); a pew guaranteed every 3 blocks.
  Mote +1 light; pew crash −4, pushback, inv; dodge through a pew vaults it. 36 lights needed (≈36–44 on a course).
  At the top: enough → crystal lit, done, door; else "NOT ENOUGH LIGHT", tide carries you back, light kept, new course.
  HUD bar at y 98 shows the light. Test section 3 rewritten (run starts, tide moves, mote, pew, second run, lit).
- Known flakes in rift-belfry: wards "chips its lights" (wave timing) and Veilwrack act watch (random acts).

## v92 — 14-stage structure, Mosaic, section-3 boons/curses, livelier bosses
- RIFT_SECTIONS (20m): [fight,puzzle,fight,puzzle,boss] ×2 + [fight,puzzle,fight,boss]; riftStagePos/riftStageLabel
  scan the stage list; riftDef boss offset = (section-1)*3; section-3 fights get S.mod 'boon'/'curse' -> F.band
  'rboon'/'rcurse' (20l rollFloorRules: boon alone / curse alone, no keys, no roaming minis). UI text "Fourteen stages".
- Belfry stages: 0 Narthex(kharrox) 1 CLAPPERS 2 Choir Stalls 3 TIDE 4 Thalassor | 5 Cloister(nhalu) 6 WARDS(3 crystals,
  20 s, lever) 7 Organ Loft 8 RUSH 9 Veilwrack | 10 Rising Galleries(boon, uldroth) 11 MOSAIC 12 Belfry Stair(curse) 13 Ulvora.
- makeWards: S.crystals (ids), S.need; word counts.
- 20m2-rift-match.js: riftMatch({name, need 45, moves 18, fillers}) -> stage; DOM overlay #riftMatch (.rift-match, removed
  on arcade open/close in 12-arcade); kinds = party pets (petSVG) + fillers (ICON pearl/coin/crystal/star/heart...);
  7×7, swap adjacent, 3 clear, 4 clears row, 5 clears kind; cascades; out of swaps -> fresh board, light kept;
  no-move boards reshuffle. mod exposes R, matches, tap for tests.
- Test rift-belfry rewritten for 14 stages (boon/curse checks, mosaic open/swap/dud/shift/shine). All passed.
- v92 shots: shots/_anim-*.png; rift-mosaic.png

## v93 — the stuck move stick
- Cause: the stick's pointer never got its up/cancel (the system takes the touch: app switch, notification, control
  centre, multi-finger gesture; iOS does not always send pointercancel). stick.id stayed set, the knob pinned, the
  pet kept walking, and every later touch in the stick zone fell through to tapAt (the stick was "taken").
- Fixes (12-arcade): lostpointercapture -> up; page-level pointerup/pointercancel (capture) release tracked ids;
  touchend/touchcancel with no touches left -> arcReleaseAll(); visibilitychange hidden / window blur / pagehide ->
  arcReleaseAll() (pointers with their last position, and keys); a mouse pointermove with buttons 0 releases;
  arcUp calls game.up regardless of arc.state. arc.ptr now maps id -> [x, y].
- 20b down(): a new thumb in the stick zone takes over a stick already held (its up was lost). up(x<0) never taps.
- tests/stick-stuck.js (in the battery).

## v94 — Rift-touched Cocopets as mini bosses; the Oracle Shell; boss art fixes
- 20m3-rift-evil.js: RiftEvil.make(seed) -> random pet form (makeForm + evolveForm to stage 4-5), soured palette
  (dark base, one accent ACC for eyes/gems/glow), fangs/monster mouth, fierce/glow eyes, horns 75%, bat wings, angry
  brows (loadSprites/makeRig take an `extra` face option now). Name "<Gloom|Hex|...><fang|paw|...> the Rift-Touched".
  RiftEvil.draw: drawPetRig at h = 2.5 r, feet at Y + 0.75 r, walk/arms/wings from its own motion, arms lift while
  attacking (m.ecast), breathing, hit squash, stun wobble + hurt face, smoke pool, accent aura, burning-eye glow.
  riftFight sets mini.evil/bname/glow; 20b drawBoss uses RiftEvil.draw when m.evil (AI stays the old kind's).
- 20o: the Cancer gate is now the Oracle Shell: CANCER_RIDDLES (candle / river / death, 4 wrong each); order shuffled
  per deal, answers shuffled per ask; DOM card #riftRiddle (.rift-match .rift-riddle, rr-* styles); wrong -> "THE CLAM
  SNAPS SHUT", all three again in a new order; 3 right -> win. mod: R, answer(i), deal(), riddles.
- 21b gate entry renamed "The Oracle Shell".
- 20w: tendrils clipped under the rim (underRim), near tendrils drawn before the dome, height capped at the rim.
- 20v: bulbs -> ivory bone spines; three cracked lantern-spines are the weak points (keys bulb0..2 kept); gill bubbles removed; banners say spines.

## v95 — Rift 2: the Garden of Unborn Stars (12 stages)
- 20p-rift-02-garden.js rebuilt (old file kept as .off): land/roster/painters/mon AI kept; old bosses gone.
  Mini bosses: BOSSES briarpet (thorn ring, charge w/ thorn trail), dustpet (pollen dash, fan), rootpet (root rake,
  eggs that hatch thornlings) — bodies are RiftEvil pets. Egg AI hatches a thornling at life 0.
- Stages (riftSections with per-section `pattern` + mods ['random','random'] -> F.band 'rrand' -> rollFloorRules deals
  one of 7 hands: curse | mboon | pboon | mbane | curse+mboon | pboon+mbane (reversed) | pboon+curse):
  0 Egg Orchard(briar) 1 RACE 2 Moss Terraces 3 Orrubel | 4 Glassless Conservatory(dust) 5 Pollen Galleries 6 STARFALL
  7 Ambrel | 8 GALLERY 9 Thorn Walks(root) 10 Root Cellars 11 Calyx Astrum (seal: THE ROOT WITHERS / THE BLOOM SIGIL).
- RACE "The Comet Circuit": ring track 30×18 (trackLayout), arches 1-4 + start, 3 laps, 3 comet rivals on waypoints
  (spd 3.9-4.2, rubber band 0.8/1.2, tired +0.09 per lost race), boost petals (1.3 s push), thorn patches (chill),
  countdown, leaderboard in drawOver. First -> done; else race again.
- STARFALL "The Falling Nursery": stars fall near the pet (ring telegraph shrinks, dur 2.4→1.5 s), catch radius 0.95,
  need 24; void shards (28% after 6) spill 2 if caught; streak text.
- GALLERY "The Seedshot Gallery": 16-wide bed, 3 lanes of pods (pod 1 hit, bud 2, gold 3 worth, darts), popped by the
  pet's own shots (X.shots exposed from 20b), need 24; hedge 'h' tiles wither (setTile) -> exit.
- tests/rift-garden.js rewritten (fights/hands, race slow+fast, starfall, gallery, meadow). Boss checks pending.
- 21b ready text now generic ("N stages in three sections…").
- bosses (20x-rift-fiend-garden-1/2/3): Orrubel (cradle pods -> eye), Ambrel (4 lure lanterns -> thorax), Calyx Astrum (lit star blossom -> core); tests/_boss-anim-garden.js; rift-garden.js full run all passed; in battery.

## v96 — Ambrel as the Void Eye; the Comet Circuit with teeth; the Bull Run; charset
- 20x-rift-fiend-garden-2: body = 3D yellow eyeball (iris/pupil track, blink, dilate, lid; dark smoke aura; 7 orbiting
  violet motes depth-sorted; 46 fur-lashes), ornate iridescent lacy fairy wings with swallow-tails; lanterns on chains
  beneath. Weak key still 'thorax' (banner "strike the eye").
- RACE v2: 5 laps; rivals 4.9+ with rubber band 0.78/1.25 and tiredness; they shoulder you (within 1.1, cd 2.5, start
  grace 4 s) and throw sparks from behind (cd 3.5); your bolts (X.shots) spin them out, a dodge into one knocks it flat;
  items b boost / p pearl shield (absorbs one hit) / v void petal trap (chill 2.2 s), all taken by rivals too; thorns slow
  both; geysers (period 5.5, warn ring) throw both back; two moss boulders roll the wrong way round the loop.
  Stumble = me.push back + chill 0.5. mod: R.bumps/knocks, sparks, boulders, items.
- Taurus gate = "The Bull Run" (20q rewritten; Comet Meadow bowling removed): 96-row lane, auto-run 5.2 t/s, auto-fire
  (R.power bolts a volley, R.rate), casks with numbers (gift power/rate; whole cask = thrown back), gate pairs +n/−n,
  comet-bull stampedes (wake at 11 tiles; through = −1 power), Great Cask 80 hp at the top (must break before arrival;
  else run again with power kept and cask ×0.85). 21b/20p gate name updated. Test section rewritten.
- head.html now declares <meta charset="utf-8"> (file:// loads sometimes decoded '·' as 'Â·').

## v97 — race heats; the Unbroken Constellation (Taurus gate); gate floors clean
- RACE: 3 laps, 2 heats, points 3/2/1/0 (unfinished comets scored by progress), pet wins ties; lose on points -> both
  heats again, tired +0.08. Comets 2x (9.8+): rubber band 0.42 when ahead of the pet, 0.62 level, 1.0 behind; knock
  stun 1.6 s.
- Taurus gate = 20q "The Unbroken Constellation": SKIES (Lantern 5/8, Twin Horns 6/8 with start star, Bull's Eye 7/9
  with bridge line [3,6] waking star 6); stars are H.obj the pet stands by (visit): first = start (required start
  enforced), then only an untraced line from the thread's end; degree numbers shown (odd pink); stranded banner; Undo /
  Start over buttons (#riftTrace, .rift-trace; NOTE `.ghost` is the drag-ghost class — never put it on buttons; the
  Mosaic/Oracle "Step away" buttons were invisible for that reason, fixed with .rm-close styling).
- startGate (21b): gates get no floor rules/packs (S.band = null, rooms 1…) — "HARDY MONSTERS" had shown in a gate.

## v98 — Rift 3: the Mouth Beneath the Dunes (12 stages)
- 20r-rift-03-dunes.js rebuilt (old kept as .off): land/brood/painters/mon AI kept; mini bosses sandpet (burrow +
  surface slam, spout ring), echopet (echo call -> grub, scream cone), jawpet (bone spike row, bite lunge) on RiftEvil
  bodies. Stages: 0 Buried Road(sand) 1 Tooth Courts 2 GLIDE 3 Sarrukh | 4 ECHO 5 Fossil Galleries(echo) 6 Listening
  Halls 7 Oneira | 8 Burrow Warrens(jaw) 9 MOUNDS 10 Throat of Sand 11 Thul-Ammon (seal THE JAW CLOSES / ECHO SIGIL).
  All fights mods random (rrand hands).
- GLIDE "The Sandstorm Glide": 110×11 canyon, carried +x 4.8 t/s, sinks 2.2 t/s unless stick up; 20 ribs with gaps
  (gapH 3.8→2.6), gusts every 5th rib (updraft), rib hit -> back to last cairn (every 4th gap); 20 gaps = done; end of
  canyon short -> new course.
- ECHO "The Echo Chamber": 6 resonator stones; rounds 3/4/5/6 notes; playback 0.75 s/note; shots (X.shots) strike;
  wrong -> replay. hitT only a 0.15 s debounce (cleared when the turn starts).
- MOUNDS "The Grub Mounds": 13 mounds ('n' marks — 'm' is the mud tile!), tremble 0.6 s then up 1.7→0.9 s; shots or a
  dodge take grubs; mantas (25% after 5) cost 2; need 30.
- tests/rift-dunes.js rewritten (old saved as _old-rift-dunes.js.txt); Amber Vigil section kept (seen check loosened).
- bosses (20y-rift-fiend-dunes-1/2/3): Sarrukh (spire while under -> throat), Oneira (4 lit echo stones -> mantle), Thul-Ammon (3 anchors -> eye); tests/_boss-anim-dunes.js; rift-dunes all passed; in battery.

## v99 — gentler Garden and Dunes; sandstorm waves; soft frost; weaker rift shields
- Rf.ease (20m riftDef): hpMul, dmgMul, monHp, monDmg × ease for every stage (fights, mini bosses via lesserBoss, fiends
  via F.hpMul/F.dmgMul). garden and dunes ease 0.6. Eased rifts cap elite chance at 0.3 (was ≥0.45 → often 0.6).
- Shielded affix on rift floors: shield 20% of HP (was 45%), and it soaks at most 60% of a hit (was all of it) — the
  "my damage went to 0" barrier. Milkcap front block 0.3 → 0.55.
- Sandstorm (PB.storm 'sand', Tower floors 101+): waves of 14 s storm / 12 s calm (g.stormC/g.stormK/g.stormOn), banner
  "SANDSTORM"; while it blows the pet loses 0.6% max HP a second (never below 1). drawStorm sand ×0.65 opacity × stormK;
  ambient sand particle rate 1+1.3·stormK (was ×3) and alpha 0.45 → 0.29. Glide puzzle streaks 0.2 → 0.13, 30 → 20.
- Frost power aura: soft radial mist fading to nothing (no fill edge, no dashed ring), ice-crystal glints, drifting snow.
- rift-dunes: chime check rings the chime by the hook if the channel was broken.

## v100 — the Sandstorm Flight (Puff Flight mechanics); Sarrukh as serpent + flower
- 20r GLIDE -> "The Sandstorm Flight": Puff Flight's physics in tiles (flap vy −6, gravity 19, max fall 8.4, speed 2.7),
  tap anywhere flaps (DunRift.tap -> mod.tap; 20b down() and key('tap'|'up'|'jump') route to RIFT.tap first), 4 hearts
  (rib/sand −1, 1.6 s shield; 0 -> back to last cairn, hearts restored), swaying ribs (gap 3.1→2.6, spacing 4.3),
  warned up/down gusts, amber shards, pet tilts with vy and its wings beat faster on a flap. 20 gaps.
- Sarrukh redesigned (20y-1): Astaroth/Veilwrack serpent rig in desert palette, thick (shoulders ~2.3), clipped at the sand with scoops/lips; head = Orrubel-style bud that blooms to a glowing cyan orb (weak 'throat' sits on the orb); six orbiting steel blades that spin/glow when it blooms. Constant G.sand puffs replaced by grit streaks (they had hazed the body). Renamed 'Sarrukh the Bloom Serpent'.

## v101 — Echo Chamber compact
- ECHO layout 13×10: six stones in a tight ring round the start (x 4.5–10.5, y 4.5–8.5) so all fit on a phone; each stone its own colour (STONE_COL) for bands, glow, number and the note shown when it rings (a wrong stone shows a red ✗).

## v102 — the beige smudge and the Dunes crash
- The smudge: (1) the Dunes' hollow grub emitted a 'smoke' particle of size 7 (drawn radius = size × tile × ~1.9 ≈ 13
  tiles!) on half of all frames while burrowing, plus size 10 when diving — now size 0.35 at 6/s and 0.8; (2) the
  Sandstorm elemental reaction (earth+wind, i.e. leaf+gold elements) dropped a 2.4-tile zone drawn as 9 big puffs, stacked
  without limit — now a refresh of any sand zone within 2.6 tiles, at most 3 live (older fade), drawn as a faint soft
  oval (α .16) with 7 grain streaks. All reaction zones capped at 24.
- The crash: MON AI `manta` (and mini-boss moves rootpet/echopet) called X.freeSpot, missing from the monster-AI X in
  20b — threw every time a manta's call finished. freeSpot now on that X.
- Dug grubs set m.under (aim/targeting skip them: no more "Guarded! 0" spam).
- Tower sandstorm weather: veils α .09, edge haze .12, pale grain streaks; no extra ×0.65 (SK = stormK).
- Stress check: 16 monsters × Sandstorm every frame for 8 s → ≤7 sand zones (3 live), 60 fps, 0 errors.

## v103 — the Team button mid-run
- 20b: HUD button (circle, two figures, "TEAM") at x = 10 + min(150, W·0.4) + 66, y 26, r 17, right of the health box;
  hidden when over/dead/anima cine/cineT. Tap -> openRunTeam() (checked in down() before RIFT.tap).
- 21c: openRunTeam(): arc.paused = true (no pause panel), body.run-team (sheet z-index 60 over the arcade), openTeam(st).
  "Play as" hidden mid-run; a green note says the run is paused. closeSheet() (09-ui) -> if no sheet follows (setTimeout 0)
  endRunTeam(): game.reparty() then unpause (unless the pause panel is up).
- 20b reparty(): party rebuilt from partyPets(): fresh petKit (+ team anima kit) and petCombat (noacc curse honoured) for
  each; kept pets keep hp/mp fractions, cooldowns, down; newcomers full; newcomers' sprites load in the background
  (played pet's stand in); F.party updated; played pet kept if still in (else first alive) via switchTo(i, true).
- tests/run-team.js (Tower floor 12: open, frozen, party out/in, +5 levels, close, hp share kept with new max, moving,
  newcomer in strip; rift: open/close) — in the battery.

## v104 — the rift desert's standing haze
- BIOMES.dunes.haze = { col '214,140,70', veil .26, edge .45, tint .1 }: drawStorm(c, haze) when no storm (no HP drain): drifting veils, pale sand streaks, warm edge haze and a light wash; ambient sand ×1.8. Not on fiend arenas.

## v105 — rooms 1.5x bigger
- 06-room: ROOM_ZOOM 1.5: ps = clamp(min(W, 0.9H)·0.27 / 1.5, 50, 110) (was 72..150) — pets, companions (--pb), furniture (def.w·ps), speeds all a third smaller; window clamp(W·0.24, 72, 136).
- styles: .room --rz 1.5; .wall and .floor laid out 1.5× larger and scale(1/1.5) from the top-left, so every theme's fixed-px wallpaper and floor pattern shrinks with them.

## v106 — Amber Vigil sanctuary
- A safe sanctuary (r 2.0 tiles) around the start and the gate: warm disc, six lanterns, "SAFE" label; drawn over the sight cones so they visibly stop at it. `inSafe()` counts as hidden; goal line says "safe in the sanctuary".
- Sight cones are now drawn round (no 0.6 vertical squash), so what you see matches what catches you.
- Gate drawn above the sanctuary. Test: rift-dunes adds a sanctuary check (all passed).

## v107 — rift 3 lands
- New file 20r1-rift-03-lands.js: BIOMES.mesa (The Rust Flats: orange cracked clay, huge layered red `mesarock`, glowing `pinkcrystal`, orange heat haze) and BIOMES.nightdune (The Moonlit Dunes: blue night sand, dark 0.56, `nightrock`/`deadshrub`/`skullpile`, ambient `greenflies` that cut light holes in the dark).
- riftSections takes a per-section `biome`; riftDef/genRift use the stage's biome (gates keep the rift's). Dunes section 2 = mesa, section 3 = nightdune (fights renamed The Rust Flats / The Crystal Scar; The Moonlit Barrows).
- New enemies (section 3): skelwar (Dune skeleton: raise + cone cut) and skelarcher (Bone archer: drawn green arrow on a line); both fall to a bone pile and rise once (MON.pile generalises the Rattlebones pile).
- Fix: monster sprites now receive m.mode (rift brood poses such as the grub under sand and skitter spread were never drawn).
- Desert rooms honour B.propN for prop counts.

## v108 — Thul-Ammon buried
- The head dome is clipped where it meets the sand (ground footprint ellipse from z0, front edge a curve), so the lower half no longer shows below the sand ring; sand mounds drawn after the clip. _boss-anim-dunes thulammon: all passed.

## v109 — Rift 4: The Sepulchre of Borrowed Hours
- 20s1-rift-04-stages.js (SEP_STAGES: LOOM, BEAST, AGES, LIARS, PURSUIT), 20s2-rift-04-sepulchre.js (biomes sepulchre/twoages/borrowed, props, brood seceater/cornerpup/mourndisc, minis hourpet/kennelpet, defRift), 20s3-rift-gate-gemini.js (The Twin Reflection, vertical mirror mazes 9x7, camera via mod.cam).
- Bosses (agents): 20z1 Threnn (bite/borrow/toll/still, core weak), 20z2 Vaul (record/mirror/glide/shards, loom+snare -> eye), 20z3 Khyros (prowl/angle/snap/spears/howl/hunt/exit, 3 phases, wedge -> slits; final boss -> sealing).
- Structure: I fight, trial(Loom), puzzle(Beast), Threnn | II trial(Ages), puzzle(Liars), Vaul | III fight(curse), trial(Pursuit), Khyros. riftSections 'trial' kind (puzzle stage, labelled Dungeon).
- Engine: zones 'stall' (slow patch) and 'ghost' (pet ghost, col/a); ambient goldmotes; RIFT.cam() camera focus; m.mark collision fixed (seceater uses stallT).
- Tests: rift-sep-{loom,ages,beast,liars,pursuit,gate}, _boss-anim-sepulchre-{threnn,vaul,khyros}, _sep-smoke.

## v110 — Rift 4 rework (user feedback)
- Kept: The Borrowed Beast, The Hall in Two Ages.
- Memory Loom → The Hour Court (COURT: dodge-ball, 30 crystals, perfect dodges). Lying Guardians → The Three Statues (SIEGE, 20s1b, 200/300/400 mobs, masons repair). Pursuit → The Broken Prophecy (PROPHECY: 6 tablets, generated unique clue sets, 2nd round with a cracked tablet). New: The Rolling Hour (ROLL, 20s1b: g.rollOnly, g.dodgeK, GIANT/FIRE).
- S1 fight: hourglass props shatterable (hourglassExtra: 3 s countdown, blast, 20 s time field freezing monsters and the pet if caught). S3 fight: 6 giant ice crystals (iceExtra; MON.icecrystal optional; onDeath freezes nearby, g.frostbite 20 s blocks HP/MP pickups).
- Vaul redesigned (agent): giant diamond head, 8 spinning 3D spikes, 3 light tentacles; acts record/mirror/rush/volley/lash.
- Plan: I fight+COURT+BEAST+Threnn | II AGES+SIEGE+Vaul | III fight+PROPHECY+ROLL+Khyros.
- Engine: riftFight extra hook (stage.extra), m.optional, MON.onDeath, RIFT X props, frostbite, timefield zone, g.petK, g.dodgeK, g.rollOnly in hitMon.

## v111 — fixes
- Ice crystal: faceted 3D prisms (lit/shadow faces, ridges), 20% smaller, bursting from cracked floor with tipped slabs and rubble.
- Borrowed biome: glassBridge (20e glassBridge()).
- Prophecy clues: compact two-column picture card (tablet icons), tap for words.
- Statues: HP x1.6, take half damage (guardFn 0.5).
- Vaul light tentacles straighter and flowing.

## v112
- Broken Prophecy removed; The Room That Remembers (SEP_STAGES.REMEMBER): anchors Q/Y switch eras carrying an item; seed+garden water -> root over chasm; sluice to wall -> erosion; slab shelter -> statue switch opens gate; garden water floods the hollow unless the Past drain is open. Camera zoom 0.78. Test rift-sep-remember.

## v113
- Gemini gate rebuilt: a boss fight vs a giant glass reflection of the lead pet (BOSSES mirrorpet via lesserBoss + RiftEvil.draw with the pet form recoloured; moves dash/fan/guard(reflects blows)/echoes; shards at each phase; hp max(B, atk*420)). Test rift-sep-gate rewritten.

## v114 — Rift 5 (The Pale Aurora): challenges + Capricorn gate
- Ice bridges (glassBridge ice mode) on glacier/observatory/whiteout; snow ambient + giant snowhill props in Dungeon 1.
- 20s5-rift-05-stages.js: AUR_STAGES.WIND (vanes raise windbreak on upwind edge; exposure meter → blown back to shelf; bridge 2 wind turns every 7 s, bridge 3 reversed),
  AVALANCHE (3 chutes/levers on west wall, 2 rail deflectors upper +1/lower −1 lane, dashed preview, basins at lanes 0/2/4 raise bridge rows x/y/z; rays after basin 1),
  EMBER (carry ember shelter to shelter, warmth drains outside/faster in blowing lanes, lanes cycle still→warn→blow, set in bowls, brazier opens barrier).
- 20s7-rift-gate-capricorn.js: The Crownstep Ascent — generated zig-zag cliff, crumbling ice planks (0.95 s → gap 4.5 s), icicles via X.warn fn (faster with height), gusts on upper bridges, 3 cairns (sorted bottom-up), crown → Capricorn wakes.
- Tests: rift-aur-stages, rift-aur-gate (added to runbat). Boss agents (thul/nivora/ahuul) were stopped by the user; bosses still placeholders.
- Ember bowls moved to the back of each shelter (n.y-1.6) so warming up doesn't auto-drop the ember.

## v115 — crystal trees + frost tomatoes
- 20s6b-rift-05-frost.js: PROPS.icetree (recursive faceted ice spikes, root shards, glints); PROP_EXT (window global in 20e) lets a prop declare a larger sprite box ([5.0,5.6] for icetree). Biome props: snowhill/snowrock/icewedge removed.
- Frost tomatoes via new core hook Rf.everyStage(X,self,H) (20m: amb.update/drawGround/drawOver, self.amb). 9–12 per fight, 4 per puzzle, 3 per boss stage. Wake r 1.7 → 2 s fuse (blast ring fills) → burst r 2.5: pet frozen 2.2 s (position locked, ice block drawn in drawOver), 8% HP, monsters freeze 3 s, stall patch; regrow after 14 s.
- Boss agents relaunched (thul/nivora/ahuul) with refreshed copies.

## v116 — Nivora merged (20z5, agent); tomatoes left out of boss arenas (drawn over the boss, crowded the mechanics).

## v117 — Thul merged (20z4, agent): cocoon (shuffle/collar/hail/stomp/ram) → hatch → wasp (hover/lunge/sweep/gale/dive); weak points eye (collar shattered) and sting (stinger stuck). Arena rim snow drifts replaced with PROPS.icetree drawn at metre scale (north/side rim only).

## v118 — Ahuul merged (20z6, agent): glide/sweep/bow/starfall/breath/rise/tether, weak point throat; final kill hands over to the sealing (Shelter Sigil). Pale Aurora complete: 3 bosses, 3 challenges, Capricorn gate. Battery: all pass (rift-belfry wave check and leo-sun bars flaky under load; pass on rerun, also on v114).

## v119 — rift wound, gate, horde, beasts
- 20m riftSealing drawCine: the wound is a fracture of space (11 radial cracks × 4 rings of dark glass panes pulled apart, white light through the cracks, missing panes at the heart, hairline tails, glints); on sealing the panes close and it shrinks to nothing. Gold sigil glyph and gold glow ball removed; resonance thread is thin rift-light.
- 20m riftGate(): 3D stone gate (pillars of cut blocks with side faces, voussoir arch + keystone, step), open = light-filled (radial core, swirling currents, inward motes, light on inner faces and floor); ×1.4 size. H.exit() passed to everyStage; tomatoes kept 5 tiles off the exit; freeze lock follows teleports.
- 20s6c-rift-05-beasts.js: yeti (leap slam + chill patch, snowball throw), icegolem (half damage until core cracks at 66%, 1.4 s slam r 2.6); section-3 fight mobs.
- Ahuul (20z6): The Horde at ≤52% in phase 2: untargetable, 400 creatures (≤70 alive; rimescuttler/yeti/veilray/icegolem/frostlantern, 35–45% hp), frost rings every 3.4 s and a nova every third; ends in a long bow. NB consts placed before `return` (TDZ inside the fiend IIFE is swallowed silently).
- Tests: rift-aur-beasts, rift-aur-horde.

## v120 — Rift 6, The Yuggoth Engine (stages + gate; bosses building)
- 20e: tile 'hull' (riveted plates, neon seams with glow, light studs), gaps 'coolant' and 'plasma' (patterns + backdrops), metalBridge (steel grating catwalk, hazard rails, neon trim) via B.metalBridge. 20a: 'hull' room gen.
- 20u6-rift-06-yuggoth.js: YUG palette; biomes wreckfield/coolant/engineheart; props hullshard, wreckrib, pylon, fungusstalk, coolanttank, pipestack, valve, piston, nervecable, metalspike (giant neon-lit steel spike clusters), neonpost; monsters sparkmite (line→dash), hullwing (spore bombs → poison), coilsentry (beam link to another monster, drawn by everyStage); chargecell (S1 extra: discharge chains through monsters ≤4.5 and cells ≤6.5); minis arcpet/coolpet/corepet; ambient lightning arcs between spikes/pylons/posts + ground strikes + sparks (everyStage update/drawOver); sealing THE CHARGE SIGIL.
- 20u5-rift-06-stages.js: CONDUCTOR (charged mites dash into/die beside dead nodes; live strip; docks), COIL (action: rotating beams 2→3→4, ring pulses, reversal, 24 sparks), MELTDOWN (action chase: rising plasma, conveyors, blast doors, pistons, live floor, valves = checkpoints/stall). Layout marks: 'm' and 'i' are RESERVED (mud/ice) — Capricorn gate fixed to 'q'.
- 20u7-rift-gate-aquarius.js: The Raincatcher Array (catch falling stars on rings, carry 3, deliver by colour, red debris, 3×4).
- Boss agents: khaal (20z7), ixvorra (20z8), nyarzhul (20z9).

## v121 — Ix-Vorra merged (20z8, agent): hover/rest, web, surge, lash, overload (cap → stagger, weak core ×2.3; fail → nova), spokes (phase 2 split ring). phases: 2 set in its roster entry.

## v122 — Kh'aal merged (20z7, agent): stalk/plate/slam/sweep/spit, phase 2 hop + devour (overcharge ×1.4); cells as fiend objects, stagger within 5.7 bares brain ×2.3. YUG.discharge now skips q.fobj (fiend proxies). One flaky run of its test, then 3 passes.

## v123 — Nyar'zhul merged (20z9, agent): beat/pulse/pistons/lash/clamp/flood/overload/swarm (300 repairmites, ≤60, heal at ports), overdrive phase 3; weak point lens. Rift 6 complete. Battery: timing flakes under 4-way load (juice, leo-sun, rift-belfry, rift-sep-gate, ahuul wake, yeti leap) all pass solo.

## v124 — Rift 6 mechas, eggs, biomechanical heart
- 20m3 RiftEvil: make(seed, {mecha}) → gunmetal palette + neon accent, glowing eyes, horns; draw renders the rig into an offscreen canvas and plates it (source-atop sheen, seams, rivets, glint), spike crown behind, lightning + eye beams in front. 20m riftFight passes Rf.mechaMinis.
- 20u6b-rift-06-mecha.js: warmech (r 1.3; missile salvo circles, arm cannon line), mechhound (circles, pounce hop), mechegg (cracks at 3.4 tiles → 4–5 egglings; broken early → 2), eggling; props biotube/xenospire/vertebra (glossy black biomechanical, PROP_EXT); engineheart props swapped; fight mobs include mechs; eggsExtra on the Engine Heart fight; minis r 1.75, hp ×1.15.
- 20b: monster-AI X gains killMon.
- Gemini redesign delegated (agents/gemini).

## v125 — mecha minis rendered as polished chrome: rig into offscreen → metal layer (sky/horizon/ground reflection gradient, side shading, specular hot spots, seams + rivets, glint, accent seam), rim light and occlusion edges cut from the silhouette shifted against itself. RiftEvil exposed on the test hook (tests/_mecha-mini-sheet.js).

## v126 — mecha minis cel-shaded instead of chrome: flat steel base (.8) with seams/rivets/flat glints/neon seam, hard shadow/core/light/rim bands cut from shifted silhouettes, bold ink outline from 8-way dilation.

## v127 — mecha minis: no seams/rivets/glints; coloured metal palette (one of six hues mixed with steel, neon accent); light steel tint .22 + shading bands at partial alpha + ink outline; rig eyes/gems visible, glow softened.

## v128 — Gemini (Raziel) redesigned by agent: twin celestial dragons (white-gold light / navy-blue lightning), horn crowns, auras; files 02e (gemini entry), 02f2 (MODELS.gemini, GEM_LIGHT/GEM_DARK), 02f (P.gemini → model, loco float), 02g (portrait bg), 20g (helixNova/stepHelix/yinYang/drawHelix; finisher Twin Helix Nova 9× power r 11 + 12× under beam, ranks 3rd of 13 behind ophiuchus, capricorn). tests/gemini-dragons.js (FAST=1 skips ranking), tests/_gem-preview.js. astral-banners flaky once (meteor event), passes rerun.

## v129 — war mechs no longer rolled: mechsExtra places 5–10 per Rift 6 floor (one a room, not the first), combined with each floor's own extra; mech hounds rarer (1 in 6 of rolled packs, ~4–16 a floor).

## v130 — Garden of Unborn Stars as a forest: new 20p2-rift-02-forest.js. Nine props (eggtree, weepwillow, thornpine, bulbtree, giantfern, glowcaps, starlily, thornbush, mossrock), propN [10,6] (20a forest case now honours propN), B.dress rim-thicket pass (hook in 20a before the reach check; local flood keeps rooms connected) → ~8–23 props a room. Undergrowth decals via new DECAL_EXT hook (gtuft, gflower, gfern, gmoss, groot). Vine bridges: new B.bridgeFn / B.bridgeEdge hooks in 20e; braided vines follow the walkway run, thorns out over the drop, tendrils hanging below. Tests: _gdn-smoke.js, _gdn-shot.js (helpers).

## v131 — Seedling March replaces the Comet Circuit race; Rift 7 The Library of Unwritten Lives
- Garden stage 1: MARCH (army runner) in 20p-rift-02-garden.js (agent 'march'); tests rift-gdn-march.js, rift-garden.js updated.
- Rift 7 'library' (lvl 70, sigil Truth, gate Virgo): 20za stages (CATALOGUE true-panel symbols ×2 rounds, FABLE life-order pages + page thief, PROCESSION escort with inspect/rest markers), 20zb lands catalogue/binding/archive (bookshelf walls via B.wallFn, book bridges via bridgeFn, GAP_EXT.inkvoid with black moon, props bookcase/libladder/lectern/bookstack/candelabra/inkwell/orrery, decals, rim-shelf dress), monsters marginworm/inkstalker/falsefolio + tottershelf (topples away, crushes), minis quillpet/blotpet/foliopet; 20zc Virgo gate Starseed Conservatory (Latin-square planting 3×3 then 4×4, weevils).
- Bosses: 20ze Syllax (agent), 20zf Vellum (agent), 20zg Nhalex final with THE LAST PAGE DPS check (ward 0.36 bars in 18 s; fail → wipeParty → THE PARTY FALLS).
- Engine hooks: 20e GAP_EXT (paint/back/base), B.wallFn, B.bridgeFn/B.bridgeEdge (v130), DECAL_EXT; 20a B.dress; 20b monster-AI X gains hitMon (fixes onDeath chains incl. Rift 6 charge cells) and wipeParty passed to fiends.
- Tests: rift-lib-stages, rift-lib-gate, _boss-anim-library-{syllax,vellum,nhalex}, rift-gdn-march (in runbat); helpers _lib-smoke, _lib-shot, _lib-totter, _nhx-dps.

## v132 — Catalogue of Truth is now 'Which is the true eye?': clear a mob of 80 (cap 24 alive, one Ink Warden ×14 hp), stand on the pedestal; four banners (eye/moon/crown/key) show, turn, shuffle (6@0.62s, 10@0.46s, 12@0.40s with double swaps); pick by plate; wrong → another mob of 80. Three wins open the passage. Camera frames the banners during the game; labels over the banners instead of big banners.

## v133 — Library monsters at half health and blows (Rf.monEase 0.5, new in 20m riftDef; bosses and minis unchanged). Catalogue: an instruction card on waking the pedestal (FIND THE TRUE EYE), eye banner ringed and tagged while shown.

## v134 — Library mini bosses at half health (miniHp 1 in each section, was the default 2).

## v135 — Evolve from the Team sheet (also from the run's pause): evolve(next, free, P) now evolves any pet (evoFrom tracks another pet; companions rebuilt); teamEvoHTML box + teamEvolve in 21c (needs explained by toast); body.run-team .evo-wrap z 70. Test team-evolve.js (runbat).

## v136 — Library: Dungeon 2 restyled 'The Silver Bindery' (silver/white/platinum: libTheme silver, silvervoid gap with silver moon, mirror & silverurn props, marble veins); Dungeon 3 'The Ascent of Light' (heaven tile, celestial cloud sky, holy platinum/gold theme, props platpillar/angelstatue/haloarch/censer/cloudbank/harp, angelic brood seraphling (holy fire rain)/haloguard (spear lunge)/ophanwheel (light burst), swirling light ribbons + motes via everyStage) and now two fights (The Gilded Stacks, The Stair of Clouds; boss now stage 9). Library furniture themed per land (THEMES in 20zb). Minis miniHp 0.6 (−40
## v136 — Library: Dungeon 2 restyled 'The Silver Bindery' (silver/white/platinum: libTheme silver, silvervoid gap with silver moon, mirror & silverurn props, marble veins); Dungeon 3 'The Ascent of Light' (heaven tile, celestial cloud sky, holy platinum/gold theme, props platpillar/angelstatue/haloarch/censer/cloudbank/harp, angelic brood seraphling (holy fire rain)/haloguard (spear lunge)/ophanwheel (light burst), swirling light ribbons + motes via everyStage) and two fights now (The Gilded Stacks, The Stair of Clouds; Nhalex now stage 9). Library furniture themed per land (THEMES in 20zb). Minis miniHp 0.6 (-40 percent). Syllax and Vellum hpK 1.25 dmgK 1.25 (riftFiend honours B.hpK). New file 20zb2-rift-07-heights.js.

## v137 — Ascent of Light: the swirling ribbons replaced by thin soft light threads (prop-to-prop between holy props, sky-to-prop, loose; fade in/out, a running bead; up to 6) in the spirit of Rift 6's arcs; heaven god-rays and sky glow much softer (0.045 / 0.22); motes fewer and fainter.

## v138 — Ascent of Light: the sky's god-ray shafts removed (celestial backdrop keeps its soft glow and clouds); light threads unchanged.

## v139 — False Procession: a winding climb (7 landings alternating left/right, 9-node route through 3 rest circles), books move only while the pet is within 5.5 (dashed lead circle), every landing ahead springs an ambush (6 waves, angelic + library mix). Holy fire: feathered (stretched glow column, soft core, light pool; no hard rectangle) and about half as much (2 per cast, cd 5.2-7.4). Nhalex's skylight shafts feathered too. Angel statues replaced by abstract 3D celestial monuments (faceted white-gold crystal in a gold ring / pearl orb in an armillary, on a stepped marble plinth). Tests: rift-lib-stages lead check, 6 ambushes; parking fix for the pedestal.

## v140 — Rift 8, The Hollow Moon (id 'moon', lvl 80, ease 0.55, monEase 0.5, minis miniHp 0.6). Lands mare / shafts / innertide (20zi: lunarvoid, hollowdeep, innertide gaps; moon props/decals; brood mooncalf, craterwisp, dustwraith, tideling, eclipsemoth; gravity geodes implode packs; minis craterpet/gravpet/tidepet; low-gravity motes). Challenges (20zh): THE WEIGHING (lure heavy mooncalves onto 3 scales via MOON.onLand, 3 landings each), THE TIDE RUN (rising silver tide with catch-up speed, drags + hurts, drowns monsters; 3 seal crystals 'moonseal'), THE BLACK SUN SIEGE (Last Lamp, waves 50/70/90 cap 36, umbral shades drink light, 3 lotus flares, relight, Umbral Herald). Gate Pisces 'The Silverline Basin' (20zj: catch leaping star-fish in silver ripples, avoid eels, 12 stars then the golden knot x3 in a row). Bosses (agents): Gharathul the Crater-Toad 20zk (stage 2, hpK/dmgK 1.25; leap/tongue/croak sac weak point/boulder lanes/brood of 30 moontads), the Selenarch 20zl (stage 5, hpK/dmgK 1.25; tilt/pan/ring sweep with gap/counterweight jam bares lens x2.5/gravity inversion), Ylth-Mora 20zm (stage 9 final; pull/tendril slam+sweep/eclipse with 4 lanterns/High Tide 300 horde/Weight of the Heart pearls; sealing). caves tile honours propN (20a). Tests: rift-moon-stages, rift-moon-gate, _boss-anim-moon-{gharathul,selenarch,ylthmora}; helpers _moon-smoke/_moon-shot/_moon-dbg/_moon-dps.
   v140 fixes: fiend core minion() passes x,y to walkPoint (a brood minion with no walkable spot used to spawn at undefined -> NaN drops); Gharathul hops back toward the middle when pinned past 0.55R, and the pet's boulder lane may graze it when the pet hugs it. Battery: all pass (load flakes re-run alone: anima-gauge, animas-ui, juice, leo-sun, rift-aur-beasts, khaal, gemini-dragons, syllax).

## v141 — Hotfix: the Black Sun Siege bridge was laid one tile off (the map has a one-tile border round the layout), leaving a strip of sea between island and bridge; now laid from the E mark down to the island. Siege shore and the Pisces pool centre use map coordinates (+1). rift-moon-stages now WALKS the pet up the bridge to the exit.

## v142 — Rift 8: the third land restyled THE MOON CASTLE (Taj-Mahal-like; biome id still 'innertide'): new file 20zi2-rift-08-castle.js — tile 'keep' white marble with inlay decals (inlaystar/inlayflower/marblevein), marbleWall (pointed niches, gold+black bands, pietra-dura flowers), moonpool gap, props minaret/chhatri/tajdome/pishtaq/cypress/fountain/jali/moonlantern, castleDress (rim props + a reflecting canal with cypresses in big courts), the palace panorama painted into the pool tiles (clipped) with its reflection via everyStage drawGround (MOON.castleView; not on boss stages), new guard 'marblesentry' (crescent glaive, cone sweep). Fights renamed The Marble Gardens / The Hall of Domes; mobs add marblesentry + umbral. Boss 1 replaced: Tsukimochi, the Moon Rabbit (20zk, agent; id 'tsukimochi'; pestle lane + stuck pestle weak, moon leap + stuck crescent x2.5, elixir brew mortar x2 / crack, mochi rolling lanes, the Warren of 30 moonbuns, exposed x3). Test _boss-anim-moon-tsukimochi (game-time waits). Gharathul removed.
   v142 battery: all pass (flakes re-run alone: anima-gauge, animas-ui, juice, astral-banners, stick-stuck, nyarzhul, rift-gdn-march).

## v143 — The castle panorama in the pools removed (user: tacky). Ylth-Mora optimised: the High Tide is 200 in four waves of 50 (next wave only once the last is cleared; WAVE n/4 banner and counter), the camera closes on the pet (zoom 0.7, k 0, tracking) during the tide and the eclipse, the bell sinks away (faded, not drawn at all once down) during the tide and rises again for the collapse; gold edge arrows point to unlit lanterns off screen during the eclipse; the moonpearls lie higher on the island (clear of the buttons). Test updated (200/50/4 waves, zoom + sink checks, eclipse zoom).

## v144 — Virgo gate weevils halved (every 14 s / 10 s, at most 2 / 3; a mid-line // comment bug fixed there too). RIFT 10, THE SEA OF FALLEN COLOURS (id 'colours', lvl 90, sigil Balance; opens on Rift 8's seal while Rift 9 is unbuilt: riftOpen steps over unbuilt rifts). Core 20zo: COL palette; lands greyshore (greysea gap) / prismreef (lightshallow) / huedeep (huedeep), glass bridges, props (bleachcoral, driftwood, greyrock, prismshard, greylighthouse, glasscoral, crystalarch, prismspire, lightkelp, glassurchin, huebloom, meteorshard, starcoral, voidpearl, huecolumn), decals; brood greyling (grab+drain), huewisp (paint splash), prismray (split beam), shardback (frontal guardFn 0.3, charge), chromawraith (blink+cone); prism crystals (6 beams through packs); minis bleachpet/refractpet/chromapet; drifting colour flecks. Challenges 20zn: THE PAINTED HORDE (40 red/45 blue/60 mixed, fonts, mismatch ×0.3), THE THREE LENSES (lensray beams clipped by lenses, 2 catches each), THE COLOURFALL (12 true colours, meteors+stains). Gate 20zp Sagittarius 'The Archer's Horizon' (mirror lattice, plates, predicted path, hold-to-flip, 3 rounds). Bosses (agents): Grisaille the Thief of Hues 20zq, Xelvara the Comet Brood 20zr (user spec), Chromatica the Colour Without a Name 20zs (user spec: Orbital Cut / Chromatic Burden / Conjunction; drained lake → blue). Seal reward: the ORBITAL RING (ACC_SPECIAL 'orbit', a.sp kept by cleanAccs, own SVG/canvas art, Legendary+). Tests: rift-col-stages, rift-col-gate, _boss-anim-colours-{grisaille,xelvara,chromatica}, _col-smoke, _orbit.
   v144 battery: all pass (flakes re-run alone: anima-gauge, animas-ui, juice, rift-aur-gate, rift-aur-beasts, rift-yug-stages, khaal, nyarzhul, rift-yug-mecha).

## v145 — Rift 10 lands 1 & 2 restyle
- 20e: new biome hooks B.floorFn (own floor texture per tile, inside the tile clip) and B.cliffTint (after cliff()).
- 20zo: shoreFloor (7 kinds: ripples, pebbles, sunk slab, shells, glass sand, tide pool, packed sand) and reefFloor (6 kinds: caustics, glass shard, glass ripples, glass beads, drop rings, gloss).
  Every tile: faint hue seam top/left (hueAt by x+y), bevel light/shade. Gap sides: two hue bands like the bridges (rimBands). Cliffs: rimCliff hue bands + wash.
- Props redone 3D: tube() branches, facetRock(), cylG() cylinders. bleachcoral, driftwood, greyrock, prismshard, greylighthouse, glasscoral, crystalarch, prismspire, lightkelp, glassurchin. Land 3 untouched.

## v146 — rift music (user's own songs)
- music/*.mp3 published as artifact supporting files (publish with `files` map each time they change; omitted = kept).
  solemn-vow (rift dungeon/trial/gate stages), epic-battle-chant (section 1 boss), qanun-idea-2 (section 2 boss), carry-the-fire (section 3 boss). Boss index = riftStagePos(Rf, stage).sec.
- 05b-music.js: one looping <audio>, unlocked on first tap with a silent wav; Web Audio gain for fades when same-origin (iOS ignores el.volume), else el.volume. Polls every 100 ms; crossfades; silent outside rifts, when st.sound is off or the tab is hidden.
- Hook: __pp.music (track, level, playing, want(), force(k)). Test tests/_music.js.

## v147 — music on phones
- Songs also uploaded to the asset store as AAC .mp4 (asset store refuses .mp3); SRC = [/_blob/<id>, music/<file>.mp3], probe on first tap picks the first that answers. Both work in the real viewer (checked in Chrome: 206s, canplay, time advancing). Capabilities now assets+db+user.
- Phone bug: unlock listened on pointerdown (not a user activation for touch) and set unlocked even when play() was refused, so it never retried. Now pointerup/touchend/click/keydown; unlocked only when a play really starts; every tap restarts a stalled wanted song.
- iOS: navigator.audioSession.type = 'playback' (so the silent switch doesn't mute); without audioSession on a phone, no Web Audio routing (element plays alone, no fades).
- Tests: _music, _music-mobile (touch-only, autoplay needs gesture).

## v148 — iPhone (Chrome = WebKit) still silent in v147
- iOS: no Web Audio routing at all (element plays alone; fades are cuts; loudness = phone's).
- Every tap starts the wanted song inside the gesture if it isn't the current one.
- A chip "♪ Tap for music · paused/stalled <rejection> e<code> rs<readyState> ns<networkState>" shows when a wanted song's time isn't advancing for 2 s — a diagnostic for the user's screenshots; can be trimmed to plain text once phones work.

## v149 — iPhone: NotSupportedError e4 (media player fetches files without the frame's access)
- load(k): page fetch()es the song (asset store copy, then the file beside the page; skips text/html and tiny answers), wraps it as a Blob (audio/mp4 or audio/mpeg) and plays the object URL. Then prefetches the other three in turn. file:// / localhost still play the files directly.
- While downloading, el holds the silent wav so a tap can't resume an old song. Chip shows ' dl' while downloading and ' L <status>' on a failed download.

## v150 — music built into the page (user: "compress it into the game, 1/5 size")
- v149 (in-page fetch + blob URL) still silent on the user's iPhone 17 / Chrome. Gave up on separate files.
- musicz/*.mp3: lame ABR 36k, 24 kHz, joint stereo, no tags: 3.55 MB total (1/5 of 18.2 MB). src/js/05a-music-data.js = MUSIC_DATA base64 (4.7 MB). Page now 11.4 MB.
- 05b-music.js rewritten: Web Audio only. AudioContext({sampleRate:24000}) made on a tap (pointerup/touchend/click/keydown), resumed on taps, 1-sample silent buffer started in the first tap; navigator.audioSession.type='playback'. decodeAudioData of the wanted song only (one kept decoded, ~40 MB), AudioBufferSourceNode loop, per-voice gain fades. Chip "♪ Tap for music · <state/err>" if wanted but engine not running for 2 s.
- Removed music/*.mp3 supporting files and the four asset-store copies; capabilities back to db+user.

## v151 — music removed (user: songs don't suit the game)
- 05a-music-data.js and 05b-music.js moved to src/_retired/; _music tests dropped from runbat. Asset-store copies deleted; capabilities db+user. Page back to 6.67 MB.
- Lessons for any future music: on the user's iPhone (Chrome/WebKit, in the claude.ai frame) media-element playback of files beside the page / asset store failed with NotSupportedError e4 (and in-page fetch+blob was also silent). The built-in Web Audio version (v150) was untested on the phone before removal.

## v152 — map & house music
- Carta Misteriosa (world map, Adventure screen, mapOpen && mapTab==='world') and Exploratory World (house: no map, no arcade, intro/splash hidden). Nothing in other map tabs, games, rifts.
- musicz2 → music2/*.mp3: lame ABR 44k, 24 kHz: 2.0 MB (1/4 of 8.5 MB). MUSIC_DATA keys carta, explore (05a). 05b restored from _retired (Web Audio player of v150) with new want().
- Page 9.35 MB. tests/_music.js rewritten (touch, phone UA; UA env for iPhone).

## v153 — Triumph of the Hero (bosses) & Champions Charge (dungeons)
- music2/triumph-of-the-hero.mp3 + champions-charge.mp3 (44k, 24 kHz; 2.16 MB = 1/4). MUSIC_DATA keys triumph, charge. Page 12.2 MB.
- want() in games (only the dungeon game: _dbg.F): rift boss stage -> triumph; rift gate -> carta; rift fight or trial (S.trial) -> charge; rift puzzle -> carta; Tower: F.fiend or g.boss && !g.won -> triumph, else charge. Other arcade games: none.
- tests/_music-arc.js.

## BOSS ART STANDARD (user, 26 Oct: "keep the quality for all bosses this high from now on") — the Threnn bar
Every new boss painter (rift fiends, Tower bosses, minis that get their own art) must match Threnn (20z1):
- Built from many separate parts (Threnn: head + 12 segments, 4 legs of jointed segments), painted back to front in depth order (sorted).
- Each material has its own 3-tone ramp + accent (BODY/_SH/_HI, PLATE/_SH/_HI, FACE/_SH/_HI, gold edging): lit face, shade side, a hot edge highlight, ink outline.
- Round parts shaded as tubes (TN.tubeLite); flat parts as faceted plates with a lit and a dark face; glass/sand/glow layers on top.
- Readable signature silhouette at phone size; one clear focal point (Threnn's clock face).
- Never still: idle breathing/ripple, secondary motion (legs paddle, sand runs, hands tick), reactions (recoil on hit, wind-up pose before every attack that also telegraphs it, a stagger/open pose, a death/descend).
- artPoses list for the anim test; screenshot every pose and look before publishing.

## v154 — Tower dragon painter rebuilt to the Threnn standard (user asked for one sample before the other ~15 families)
- src/js/20f2-boss-dragon.js replaces DunBoss.P.dragon (used by dragon, frostdragon, bonedragon, stormdragon, venomdragon); REACH.dragon 3.7.
- Faces the pet (m._df eased). Parts back to front: far wing, near wing (both from the upper back), 12-segment tail with blades + spade, far leg, breathing body (scales, 7 lit scutes, phase-2 cracks), near leg, arms, smooth tapered neck (spines, throat plates lit in sequence as breath gathers), head (thick ringed horns, hinged jaw, teeth, tongue, slit eye with lids, brow, nostril smoke, cheek frills).
- Poses: breath wind-up (rear, throat lights chest->head, jaw opens) then aimed gape; tail coil then whip; fireballs gape-snap; dive fast beats; hit recoil; stunned head hangs + stars; sleep head low, wings folded, eyes shut. Kind touches: fire embers, frost icicles + mist, shadow(bone) ribs + torn membranes, spark lightning on wing fingers, leaf venom drips + leafy frills.
- tests/_dragon-sheet.js (HTML=old build, OUT=name) renders the five + seven poses.

## v155 — Tower: every boss is a Rift-touched Cocopet; the 41 old bosses are "brutes" in the packs (user)
- 20b: FLOOR_EVIL = RiftEvil.make(seed of F.seed, F.n) made at floor start (F.bossName = its name). makeBoss (Tower, not rift, not o.brute) attaches m.evil: the floor's own boss uses FLOOR_EVIL; guardians (incl. the four of 41-59), key keepers, boon roamers get their own (towerEvil(2, n)). They keep the floor kind's AI (B.ai/B.id) and stats; drawn by RiftEvil.draw (falls back to DunBoss when m.under, e.g. burrowing).
- Brutes: from floor 3, each pack has a 30% chance of one (max 2 below floor 10, 4 after), kind matching the floor's biome when possible. lesserBoss(..., 0.5, '', kind, { brute: true }); dmg x0.5 (so half a mini boss's health and blows), xp x0.6, m.brute; no "LESSER BOSS" banners. Drawn as the old boss art (the dragon in its new painter).
- Super Fiend floors (every 10th) unchanged; rift minis were already evil Cocopets.
- Tests: tests/tower-evil.js; tests patched to treat m.brute as a monster (floor-rules finders; `if (!m.boss || m.brute) D.hitMon` in clear-the-floor helpers).

## v156 — mini boss HP bar everywhere
- 20b HUD: the boss strip now draws for BB = g.boss when up, else the nearest aggro'd lesser (not brute) within 15 tiles: rift dungeon minis, Tower key keepers and roamers. Smoothed fill kept per target (m._show).

## v157 — old-film look (Cuphead-like), Settings "Old film look" (st.retro, default on)
- src/js/05c-retro.js: five fixed full-screen layers appended straight to <body> (NOT in a z-indexed wrapper: that isolates the blend modes — the bug that made the first version a flat brown fog): multiply warm wash with brown vignette (opacity ~.52–.58 flicker), saturation grey .09, screen brown .05 (lifted blacks), overlay grain .15 (3 noise tiles, jumped every 83 ms), dust/hair/scratch canvas at half resolution. pointer-events none, z 2147483000+.
- 04-state: retro default true (sanitize: o.retro !== false). 09-ui: switch in settings.

## v158 — film look: +blur, +chromatic aberration
- 05c: BLUR 0.32 px (a backdrop-filter layer at the bottom of the stack), CA 0.10.
- CA: retro.post(arcCanvas, ctx) after each arcade frame (12-arcade arcFrame end), dungeon mode only (opaque): copy -> multiply red (red channel), canvas multiply cyan (red out), add the red copy back scaled by 1 + 0.04*CA about the centre ('lighter'). Radial split: 0 at the centre, ~0.8 css px at the edges at CA 0.1. 4 full-canvas passes per frame.

## v159 — film look stronger (user): BLUR 0.8 px ("5%"), CA 0.20 ("20%"). Scale: 2% blur = 0.32 px; CA 0.1 = 10%.

## v160 — film look settled (user): BLUR 0.48 px (3%), CA 0.14 (14%).

## v161 — CA 10%; big-screen performance (user: 2019 iMac lags, iPhone fine)
- Measured (tests-free script _perf.js, swiftshader so ratios only): at a 2560x1440 dpr-2 window the arcade canvas was 5120x2764 (14M px, 11x a phone); the CA pass cost as much as the whole game draw and the film layers halved the frame rate.
- 12-arcade arcLayout: pixel budget for the canvas: 4.2M px with the film look on, 8.3M off (dpr lowered, min 1). Phones unaffected.
- 05c: CA red copy at half size; BIG screens (> 4.5M device px) skip the backdrop blur and the saturation + screen layers (canvas enlargement gives the softness). CA pass 228 -> 71 ms (software) at iMac size.
- Build hook exposes __pp.retro.

## v162 — TEMPORARY: film look (grade, grain, dust, blur, CA) off on desktop computers for the user's iMac lag test
- 05c: DESKTOP = (hover: hover) and (pointer: fine) and no touch points; DESK_OFF = DESKTOP && true. Set to false to restore. Phones/tablets unchanged. Canvas budget on desktop uses the film-off 8.3M px.

## v163 — film look back on desktop, without chromatic aberration (user: the iMac lag went with the filters off)
- 05c: DESKTOP (hover+fine pointer, no touch) skips only retro.post (CA). Layers as before (BIG screens still skip blur, saturation, screen). Canvas budget back to 4.2M px with the film on. Phones keep CA 0.10.

## v164 — moved to GitHub: chuongvoxx-ops/cocopets (public), cloned at /home/claude/cocopets (main)
- From now on the repo is the source of truth: edit /home/claude/cocopets/src, build there, commit with the attribution lines, push to main. The scratchpad copy is the old workspace.
- src/build.py --web -> dist/index.html (05a-music-data.js left out) + dist/music/ from assets/music/ (full-quality originals, tags stripped) + .nojekyll. 05b-music: EMBED = typeof MUSIC_DATA !== 'undefined'; else fetch FILES[k] (music/*.mp3), AudioContext at native rate.
- .github/workflows/pages.yml builds --web and deploys to Pages on push to main. First run failed at configure-pages: Pages must be enabled (Settings → Pages → Source: GitHub Actions) by the user.
- Settings → "Move your save": Copy code (COCOPETS1: + base64 JSON of serialize()) / Paste code (sanitize, adoptState, save local + account). tests/save-move.js.
- Off Claude, saves are per-browser (localStorage); Store.connect() returns null without window.claude.

## Desktop keys in the Tower and rifts (user, 27 Oct)
- 12-arcade: DUN_KEYMAP used when arc.mode === 'dungeon' (letters lower-cased): D ab1 (Strong), S ab3 (Strong 2), A ab2 (Ult), F tap (normal attack, hold), W swap, E ab5 (anima summon), Shift dodge, Space tap (and starts the floor), arrows move, Tab swap, Enter start. Other arcade games keep KEYMAP (WASD moves). tests/dun-keys.js.

## The path through the game (user, 27 Oct) + world-map mouse fix
- 21b: towerCap() = 10 + 10 per rift in order that is sealed or not built (stops at the first built, unsealed one). riftOpen(r) = sealed || has a checkpoint || st.dun.best >= 10*r.n (R'lyeh: 12 seals). dunFloorOpen(n) = n <= best+1 && (n <= towerCap() || n <= best). riftLockText / floorLockText give the reasons; the floor-win lines say when a rift opens or a seal is needed.
- Rifts tab ("List" on the world map): Tower blocks of ten floors interleaved before each rift (data-rift="tower" data-n=b opens the Tower tab at the right floor). CSS: #riftInner minmax(0,1fr) (it overflowed a phone), .rf-card dark text (names were invisible in dark mode).
- 23-town worldPanInit: setPointerCapture only once a drag passes 8 px (capturing on pointerdown sent desktop clicks to the chart, so no place could be clicked).
- tests: path-order.js, map-mouse.js (mouse click, drag, phone tap); _rift-lib sets dun.best (120 when seals given, else 10) so rift tests open their rifts; run-team sets best 10.

## Website build: page shell (user: everything tiny on the phone at github.io)
- The Claude viewer wraps the page in doctype + <meta viewport> + a small reset; the web build had none, so phones laid it out at ~980 px and shrank it (and the page ran in quirks mode). build_web now writes the same shell: doctype, viewport (width=device-width, initial-scale=1, viewport-fit=cover), the reset ([hidden] !important, body margin 0, safe-area padding).

## Floors 1-9 eased (user): floorDef monHp and monDmg x0.7 for n <= 9 (monsters, brutes, floor bosses, mini bosses alike; hazards and floor 10 Super Fiend unchanged; rifts use n >= 10).

## The level-10 gift (user, 27 Oct)
- 22-gift lv10Check (every 1.5 s, at home only: no arcade, sheet, gift, map or intro open): the first time st.dlv >= 10, st.lv10Eggs = 1 and st.lv10Owed = 3; it hatches min(owed, room) eggs through the summon ceremony, stars from LV10_RATES (3★ 50%, 4★ 35%, 5★ 15%, never 6★); the rest stay owed until there is room. Saved (04-state sanitize). Existing saves at level 10+ get it once on their next visit home. tests/lv10-eggs.js.
- Eggs otherwise: the starting egg; crystal summons (10 for 1000, 1 for 120; 84/10/5/1%, six-star pity after 10 ten-pulls); the shop (300 pearls or the $4 test purchase).

## Welcome gift and daily rewards (user, 27 Oct) — src/js/22b-rewards.js
- Welcome (st.welcome 0 on newState; older saves are treated as given): 1000 crystals + a treasure box (applyGiftBox: its own 1000 crystals, cards, 3 gems, bundle, drink, foods) + 3 gemstones (the next evolution gem among them). Shown at home once.
- Daily rewards: st.login { m, n, last, seen }. One claim a day (local day), the n-th claim of the month gets loginPlan(n): 100 crystals when n % 3 == 0, LOGIN_GOODS between (coins, gems, honeycomb/ambrosia/feast, drinks, pearls, heart tart/sundae, a Fusion Stone on 13, treasure boxes on 14 and 28); the month's last calendar day always gives 1000 crystals. New month: n resets. The calendar opens by itself once a day at home (seen) and from Settings → Daily rewards. The old 50-coin daily toast is gone (dailyGift keeps the visit's XP).
- Gift screen: new 'stones' tile. Test hook quickStart marks welcome given and today seen. tests/rewards.js; smoke's old save marks lv10 gift and calendar seen.

## Rift and summon songs (user, 27 Oct) — src/js/05b-music.js
- Web build only (full-quality files in assets/music/). Tower floors (not bosses or Super Fiends): a random one of the rift dungeon songs (charge, belfort, rift2, desert, hours, library, waltz) picked per floor game (WeakMap on arc.game), kept for the floor. Rift dungeon/trial stages use RIFT_SONG by rift id: belfry → Drowned Belfort, garden → Rift 2, dunes → Desert Rose, sepulchre (Borrowed Hours) → Time After Time, library → The Library, moon → Waltz for the Moon; other rifts keep Champions Charge. Puzzle stages → Quest for the Crown, anima gates → Anima Gates (user's extra track, assumed for gates). Bosses still Triumph of the Hero.
- Anima summons: music.hold('summon') plays The Summoning while the summon lasts, then music.release('summon'); without the song (Claude build) the old synth theme plays.
- The Claude build embeds only the 4 core songs; pick() falls back (rift songs → charge, crown/gates → carta). Two decoded buffers kept at a time.
- tests/music-rifts.js: run with URL=http://localhost:8768/test.html after `build.py --web --test` to check the web build; without URL it checks the Claude build's fallbacks.

## Welcome gift raised; Belfry halved (user, 28 Oct)
- Welcome: 5000 crystals (WELCOME_CRYSTALS), the treasure box, 3 gems, and a free 10-egg summon: st.freeTen (sanitized 0..9). The summon screen opens by itself once a visit while one waits and the house has room for 10; the 10-egg button reads "Free", doSummon spends freeTen instead of crystals (needs room for all 10). .pack.free style.
- Rift ease kinds in riftDef: Rf.ease scales hpMul/dmgMul AND monHp/monDmg (so ordinary monsters get it twice: 0.6 → 0.36); Rf.monEase monsters only; new Rf.scale scales hpMul/dmgMul once, so monsters, minis and fiends all get exactly that share. Belfry: scale 0.5 (was unscaled). Checked: crawler 7605→3803 hp, mini 81k→41k, Thalassor 353k→177k.
- tests/rift-belfry "it sweeps, tolls and scuttles" is random (toll is a 25% pick per cycle in 40 s) and "the gallery" flakes under load; both pre-existing.

## Elemental moves (user, 29 Oct) — src/js/20k1-elem-core.js + 20k2..20k9-elem-*.js
- 160 moves: ELEM_MOVES[e8] = 10 Strongs + 10 Ults each (earth, wind, light, dark, fire, water, ice, thunder). Data (names, glyphs, costs, cds, descs) in the core; the choreography in one file an element: ELEM_IMPL[el].strong[key](C, H) / .ult[key](C, H).
- Learning: a pet learns its own element's moves (petElement) by Dungeon level: Strongs ELEM_STRONG_LV [1,1,3,6,10,15,20,30,40,50], Ults ELEM_ULT_LV [1,5,10,15,20,30,40,50,60,75]; Ults only for ≥5★ (ELEM_ULT_STARS) — enforced in elemLock (learn/equip), cleanDeck(d, p) (the deck drops a move the pet may not use), and useUlt (ab.elem && ab.star < 5 refuses). st.devMoves lifts the level locks only.
- Equip: deck ids 'e:<el>:<key>' (elemId/elemParse/deckFits); petKit resolves them via elemAbility (key 'ex_'/'ey_' + key, el = the element's own ELEMENTS alias, mult grows with stars like star moves). renderCards shows an "<Element> moves" grid per slot with lock badges (Lv N / ★5). tierStrong/tierUlt (Guardian/Celestial) wrap them like any ability; C.up/C.K = Celestial.
- ELEMENTS got aliases wind/ice/water/thunder/earth/dark/light (+E8_OF identities) so a move's hits carry its element for the reactions.
- Toolkit (DunElem.create(X) → H): hits by shape (hitLine/hitCone/hitRing), boss-safe control (pull/push/slow/lift/bind), pet-side warnings (warn/warnLine/warnCone in the element colour), fx objects with update/draw/drawUnder (drawUnder paints under monsters), particles thinned by H.n()/H.Q() (st.lowFx = Settings "Fewer effects"), shading helpers (sphere, slab, glass, core, trail, softShadow, block/spike/crystal shaded).
- Game: ELEM created beside STAR (20b); useStrong 'ex_' → ELEM.strong, useUlt 'ey_' → ELEM.ult; ELEM.update/draw(c)/draw(c, true) under ents.
- Tests: tests/elem-moves.js (ELEM=, ONLY=, SHOTS=1, SHOT_MS=, HTML=test-x.html with `build.py --test-only test-x.html`): rules, every implemented move lands damage / fxLeft 0 / no errors, the 3★ refusal, cleanup. docs/ELEM-BRIEF.md + docs/elem-spec/*.md: how an element file is written.

## Rift 9 — THE BASILICA OF THE VEILED EYE (user spec docs/rift9-spec.md, brief docs/RIFT9-BRIEF.md; 30 Oct)
- id 'basilica', n 9, lvl 85, sigil Veil, aff earth/dark, ease 0.55 / monEase 0.5. Core 20zt2: BAS palette (#242428 / #A18E65 / #D8D1BB / #BF675D), lands cloister / courtyard (veilchasm gap) / sanctuary, props and decals, red ceiling-slit stripes (everyStage, decorative, unoutlined). API block at the top of 20zt2: BAS.screen (rails, handle channel, goTo 1 s/stop), shadowOf/inShadow/drawShadow, gaze sources (inCone/gazeSeen/source), pylons (3 angles, dashed preview), BAS.calcify (3 stages, root + 20% HP, onRoot hook), spit droplets, art helpers, arenas BAS.arena.{eshra,thessarym,gharaal}; bosses reach the stage via BAS.ctx({g}).X.rift.self.mod. Brood calciteleech / witnessscarab (rotating gaze cone) / brokensentinel (orb lock line 1 s then charge); minis veilpet / witnesspet / basaltpet.
- Stages: 0 fight · 1 PILGRIMAGE (screens vs 3 pylons, latch) · 2 Eshra · 3 CONTAINMENT (3 basins, scarabs killed inside close locks; outside kill → carriable eye stone; next pen only after the group dies) · 4 fight · 5 Thessarym · 6 fight (curse) · 7 PROCESSION (one broad screen, holding the handle lifts the alcove gate; the screen never advances while a latch is shut; root → back to the last stop) · 8 Gharaal (seal). There is no pet Hold/Recall command in the game: "hold" is the handle channel. Stages file 20zt.
- Gate 20zu Libra "The Suspended Garden": tilt the hanging board by standing on it, roll the pearl into 3 blossoms; holes, gold weights after cup 1, a drifting hole after cup 2.
- Bosses (Threnn bar): Eshra 20zv (tail-eye Witness Ray tether 3 s broken by a pillar → scorch + reel; Claw Crush wedge; at 50% marks a pillar, cracked next ray, falls a cycle later, never the last), Thessarym 20zw (Passing Judgement numbered lanes; Unveiling locks then freezes the beam, a screen's shadow blocks it → reel; from 50% a tail sweep during the charge; the beam also adds Calcification — builder's addition, user asked about it), Gharaal 20zx (Slabfall + exposed limb ×2 >70%; Unveiling gaze then drags the sheltering screen a stop 70–35%; Witnesses Within two back eyes 2 s apart, shared shadow, calcite node breaks the main eye <35%; victory closes the wall-eye, plants bloom, banners crumble).
- Core fix: 20zt2 eshra make() retile before the tile cache exists threw a ReferenceError (guarded). Seal reward: Closed-Eye Talisman (ACC_SPECIAL 'veil', necklace). path-order test: floor 90 → Rift 9; Rift 9 sealed + floor 100 → Rift 10.
- Tests: _bas-smoke, _bas-mech, rift-bas-stages, rift-bas-gate, _boss-anim-basilica-{eshra,thessarym,gharaal} (slow: game-time waits).

## Rift 9 tuned for difficulty and phones (user, 30 Oct)
- Rift fight floors roll ~220 monsters in 9 packs of ~24 (pack = max(F.pack,10) + fillers); they all lived and were updated at once. New generic F.liveCap (a rift's liveCap; Rift 9: 60): liveCapTick (20b, every 0.5 s) moves the furthest unroused rolled-pack monsters (pack < 300, not boss/fobj/optional/nest/gremlin) off the field into g.reserve and walks them back, at least 9 tiles from the pet (or after 4 s), as the field thins. riftFight/trials' monstersLeft counts g.reserve, so a floor is never clear while any wait. The player isn't told.
- New generic F.typeShare (a rift's typeShare; Rift 9: { witnessscarab: 0.11 }): in the pack roll a shared type is held to that share of the floor and ≤3 a pack, and spread (a slot in four may take it while under share). Replacements avoid still types. Gaze scarabs went from ~23% expected (up to 40% of a floor, 16 to a pack) to 12–21 a floor, ≤3 a pack. Rift 9 mobs lists also carry one scarab each.
- Scarab hp 360 → 252, sentinel 460 → 322 (×0.7). Leech unchanged (300).
- Eshra's ossuary: its three tall pillars were drawn live every frame (~2 ms of ~11 ms of the scene); now pillarCached (20zt2) paints each once at the screen's resolution and again only when the zoom or its crack changes. Same picture (compared). The floor, vault backdrop and 20 props were already cached; the boss repaints every 2nd frame (keep). Scene draw 11 → 8 ms in the headless profile; the rest of the frame is the film post (global) and the pet.
- tests/rift-bas-cap.js.
- (30 Oct, later) Monsters and minis 30% lighter again: monEase 0.5 → 0.35, section miniHp 0.6 → 0.42, new Rf.miniDmg (riftFight scales the mini's dmg; Rift 9: 0.7). Bosses unchanged.
- Gaze cones left behind: everyStage now drops a scarab's source when it died, is falling, is at 0 hp, or is no longer in X.mons (the liveCap reserve), and clears m.gaze so it re-registers when it walks back; scarabs() skips falling / 0-hp ones.
- Courtyard (land 2) recoloured a darker navy purple-grey (floor #3F4159..., grout #20213A, faces #202138, fog/dark 11,11,22, lavender speckle) so it reads apart from the pale cloister. Its rooms also get 2–6 big growths each through the open floor (dressGrowths, connectivity kept): veilshard (shard cluster bursting from heaved flagstones), eyespire (twisting stack of sharp wedges with fins, needle tip), splitmonolith (two leaning slabs, red seam) — faceted lit/dark faces, eyes in the stone; PROP_EXT sized; drawn through the prop sprite cache.
- (30 Oct, later still) Rift 9's fight floors 35% thinner: new Rf.monCount (riftDef scales a fight floor's F.pack, min 4, and F.maxMons; Rift 9 0.65): ~222 → ~149. Mini bosses' health ×0.7 again (miniHp 0.42 → 0.294). The fight counter reads "N of TOTAL left": riftFight.goal uses monstersLeft (which counts the liveCap reserve) and remembers the floor's total.

## Spike Bloom by element (user, 30 Oct: "an earth skill shouldn't be used for light; no detail or shading")
- The innate Strong s_spikes (rolled from the body, any element) now has a version per e8 (20b3-espike.js, ESPIKE): Prism Thorns (light), Earthen Spires, Obsidian Thorns, Frost Spires, Geyser Bloom (a wobbling water spout), Gale Thorns, Volt Spires (arcs re-jittered), Flame Spires (fire keeps its old burning draw). Names/descs via espikeName/espikeDesc in petAbility, applyAbOv and innateAbility (strong2/3). drawESpike: two faces (lit/shaded gradients) meeting on a bright front edge, outline, reflected rim, base crack + glow, element detail; espikeBurst particles (thinned by Fewer effects). Spikes now 1.0–1.24 T tall (were 0.7).

## Rift 11 — THE CHOIR BEFORE CREATION (user spec docs/rift11-spec.md, brief docs/RIFT11-BRIEF.md; 30 Oct)
- id 'choir', n 11, lvl 95, sigil Rhythm (plan entry changed from Note), aff wind/dark; Rift 9's tuning (ease 0.55, monEase 0.35, miniDmg 0.7, miniHp 0.294, liveCap 60, monCount 0.65) + typeShare { pipeeel: 0.18 } (a guess). Core 20zy2 (API block at the top): CHO palette (#341C2F/#D9C9A5/#A58A4E/#DA8F86), lands scorehall / breathworks / resonance (oval plates over the choirdeep gap, plank bridges with gold rails, pipes as columns/arches/spirals on north-facing edges with breathing mouths, heartbeat ring inlays steady under Fewer effects, no camera shake); CHO.pad (charge, 2 s latch, silenced by hush moths, shelter dome), CHO.beat/phrase (numbered previews with countdown borders, hush and echo beats); brood bellmite / pipeeel / hushmoth; minis cadencepet / bellowspet / hushpet; arenas on X.rift.self.mod (Tammor rings, Veyra horns/wedges/arch, Heart quads/horns/pads). Seal reward: the Rhythm Bell (ACC_SPECIAL 'bell', necklace) with a chime muted by st.bellMute (Settings + the accessory's button). path-order: floor 110 → Choir; Choir sealed → 111+.
- Stages 0 fight · 1 SCORE (four pads, a hanging tablet's three-symbol order; phrase 2 rests then shines 2 s; wrong note resets the phrase; the moth hushes the lit pad) · 2 Tammor · 3 fight · 4 BREATHWORKS (drain lever, two shutters, the moth in the central blockage, light packets, three gauges; late mites knock shutters) · 5 Veyra · 6 fight (curse) · 7 HELDNOTE (30 s charge on the great pad, horn cones force steps off, three waves) · 8 the Heart (seal). Stages file 20zy.
- Gate 20zz Leo "The Crown Chase": tag the crown-bearer cub three times (puffs = the window; decoys in round 2, fading + gold dust in round 3); no damage.
- Bosses (Rift 9 art bar): Tammor 20zz1 (Threefold Beat on numbered rings, adjacent safe ring always; Hold the Silence ×1.75, 5 blows → falter; frontal cone beat from 50%), Veyra 20zz2 (hangs from the arch; Antiphon numbered horn lanes, shelter wedges, last lane safe; Stolen Note moth swaps the third horn ≥4 s ahead; drops sprawled ×1.75; from 50% on the floor with a wing cone; throat ×1.5 while glowing), the Heart 20zz3 (Pulse Measure three numbered quadrants; Dissonance echo outline + moths hushing a horn; The Unfinished Chord: charge the lit pad, shelter dome after step 3, whole-arena pulse, ring opens ×2; victory: silence, a chord, a dark seed with the Rhythm Sigil).
- Tests: _cho-smoke, _cho-mech, rift-cho-stages, rift-cho-gate, _boss-anim-choir-{tammor,veyra,heart} (slow: 10–20 min each headless).

## v180 — Fire moves reworked, signature moves, evolution
- Five- and six-star pets start with their own element's signature Strong and Ultimate (`starKit(stars, seed, e8)` in
  20k-dun-star.js; `AB.starStrong/starUlt.e8`; `innateAbility` returns `elemAbility(...)` with `sig: true`). A six-star
  has a STAR6_GOLD_CHANCE (8%) per slot of a golden move instead. Fusion carries an `ex_`/`ey_` signature to a child of
  the same element (`applyAbOv`). Elemental Celestial ults keep their own name (no " Ω").
- Every elemental cast carries `C.evo` (the pet's stage 1..7; `elemAbility` → `ab.evo` → 20b → `C.evo`).
- Fire: `20k6a-fire-kit.js` (FK: volumetric flame, fireball, ribbon, flameRing, scorch, shockRing, floorLight, aura,
  evo helpers). The twenty moves are reimplemented in 20k6b (S01–05), 20k6c (S06–10), 20k6d (U01–05), 20k6e (U06–10),
  which replace the old bodies in 20k6-elem-fire.js (still there, now dead code apart from its `_draw` hook). Each move's
  header says what evolution changes (Firewheel: 1 wheel → 7; Nine Tails: 3 → 9 tails in a halo round the pet).
  Damage total = base × factor × C.K × FK.evoK(C) split over the pieces. Brief: docs/FIRE-REWORK-BRIEF.md.
- Tests: elem-signature.js; elem-moves.js takes EVO=N and waits 9 game seconds at the end.
- v182: F-U01 is now Armageddon (one fire tornado; at Celestial 'Super Armageddon', four; ELEM_ULT_PLUS renames it) — the phoenix was removed at the user's request (deck ids e:fire:turningsky drop out through cleanDeck).
- v183: Rift 11 monsters and mini bosses halved (monEase 0.175, miniDmg 0.35, miniHp 0.147); bosses unchanged.
- v184: fire round 2 — Cinder Wave (was Cinder Fan), Burning Mandala (replaces Candlewick), Apocalypse (replaces River of Molten Stars); per-stage looks: Furnace Seed 7 seeds, Phoenix Talon 4 sets, Molten Lash 5, Salamander 7, Matchstars 4×, Carousel 4× blades + burning ground, Falling Suns 3 crowns, Dragonkiln a continuous fire-spirit body (Veilwrack silhouette), 3 dragons at Celestial; Hearthburst softened.
- v185: elemental Strongs ×3 (ELEM_STRONG_MULT); fire leaves no dark floor marks (FK.scorch is light only, fades out); Apocalypse optimised (cached sprites; ~1/6 the draw work at peak).
- v186: FIX rifts 1-10 fight floors had only their mini boss: Rift 9's monCount line had been inserted inside riftDef's if/else-if/else chain, so fight floors without monCount fell to the empty-floor branch. Moved after the chain; tests/rift-fight-floors.js.
- v187: Lightning reworked. Ten new Ultimates from the user's design (docs/elem-spec/thunder-ults.md): flash, thunderstorm, widepressure, ragnarok, supreme, glory, heavensbow, lotus, butterfly, worldsplitter (20k9b-f); the ten Strongs upgraded (20k9g-h); lightning kit TK (20k9a). Old thunder ult keys deleted in 20k9b. Brief: docs/THUNDER-REWORK-BRIEF.md. elem-moves.js waits in game time after each cast.
- v188: Lightning escalation: Ragnarok strikes 1/2/3 times (stages 1-4/5-6/7, last biggest); every Strong escalates (Static Blossom 1/2/3 bursts, Arc Boomerang 1/3/7, Forked Fang 2/4/8, Stormbead 4/6/10 twice, Volt Scythe 1/2/4, Thunderpin 1/3/7 + 3 gold pulses, Railflash 1/2/5 + rail-cannon, Sparkstep 1/3/7 echoes, Capacitor 2/4/8 plates, 3 claps, Stormthread 4/8/16).
- v189: props clipped (Rift 11's great horn and ~15 others drew past PROP_EXT): propSprite adds a margin (+1.6 wide, +0.6 tall), horn/petrifiedplant extents widened. The hook exports DunWorld, PROP_EXT, BIOMES.
- v190: Earth pets were nearly impossible (earth came only from the rare golden coat): abilityElement now gives earth ('gold') to browns/tans (h 18-70, s<48) and olive/moss greens (h 70-100). ~9% of pets now; existing pets with those coats became earth.
- v191: Ice reworked (docs/elem-spec/ice-rework.md, docs/ICE-REWORK-BRIEF.md): ults frozenorrery (kept, 3x at Celestial), diamonddust, frozenswords, letitgo, absolutezero, glacialonslaught, frozensingularity, snowman, catastrophe, iceage (20k8b-f); strongs incl. rimecoil (kept, 3x), snowfall + absolutewinter (moved from ults), wintermoth/hailshot dropped (20k8g-h); ice kit IK (20k8a). A canvas ellipse() guard in 20k1 clamps negative radii.
- v192: Ice round 2: Absolute Zero anchored where cast; Snowman replaced by Frozen Vortex (1→4 vortices, +3 s at Celestial); Catastrophe 4/5/7 s and cached beams (~36-52 → ~16 ms/frame headless); Ice Age sprouts are thin spike clusters.
- THE BAR (user, after v192): Catastrophe (src/js/20k8f-ice-ult-5.js) 'looks absolutely amazing, this is what we should aim for' — use it as the reference for every future element rework (sky beams with cached spiral columns, foot swirls, screen-wide snow, cold dimming, light-only floor traces).
- v194: Rift 2 Seedling March: Colossus 1600 → 1000 hp, stands closer (want 8 → 7), the camera leads further ahead (0.06/0.1 → 0.15/0.24 of the screen).
- v195: pet warnings (own 'pet' warn zones) are no longer drawn (the user: players don't dodge their own blows). Rift stages may show a single button (mod.hud()/mod.act() via RIFT.hud/act): the Seedling March shows only the stick and a SUPER SHOT (60 + 4 a seedling, piercing, 8 s cd). The march's volleys now total 0.5 a seedling (bolts capped for the eye, each carrying its share); crowds still take the base damage (clashes stay number against number).
- v196: Seedling March Colossus 12000 hp (the army volleys scale with its size now).
- v197: Water Ultimates round 1 (docs/elem-spec/water-ults.md, docs/WATER-REWORK-BRIEF.md): mayhem (Catastrophe in water), tsunami (20k7b), lotusbloom, rhapsody (heals 40/55/70% over 8/12/16 s) (20k7c), aquaillusion (curse: rooted, +20% damage taken, burst = 10% of recorded; hook in hitMon) (20k7d). Removed deeppalace, koispiral, moontide, shellocean, whirlgalaxy. Kept monsoon, jellyfish (to rebuild), leviathanribbon, returningsea, rainmaker. Bubble Snare renamed Bubble Spray. Strongs untouched.
- v198: Water round 2: Mayhem columns 25% thinner, feathered feet, more flow/particles; Tsunami waves pre-painted per cast (4 roll frames, one blit each) + glow/glitter; Lotus Bloom halo/rays/sparkles; Aqua Illusion feathered, burst 20% of recorded; new abyssalspiral (20k7d), bubblereverie + crescenttide (20k7c), heavenfall (20k7b). Removed leviathanribbon, returningsea, rainmaker, monsoon; jellyfish kept for a rebuild. The thin vertical line in the user's shots is 05c-retro's film scratch.
- v199: Water round 3: neptunetrident (20k7e; giant + 4 / + 10 small, one hit each, temporary crack decals) and jellyfish rebuilt (roaming, 1+1 / 2+2 / 3+4); crescenttide moved to Strongs (replaces crescentsurf) with ribbonfin, tideglass, rainneedle, whirlpool reworked (20k7f; shared sprites via globalThis.WU2K from 20k7c); bubblesnare (Bubble Spray), waterwheel, twinundertow, pearlburst, basin reworked (20k7g).
- v200: Water round 4: Tsunami deleted, Deep Blue Sea (ringed water spheres ~2x the pet, 1/3/5, Celestial finale) in 20k7b; Neptune's Trident giant impact = gathering light + flood + explosion (no cracks), small tridents' cracks shortened.
- v201: Deep Blue Sea: one big sphere + 2 / 5 small (levels 4 / 7), ethereal halo + shining core, per-sphere randomised tilt/spin/size/shade/paths.
- v202: Pink Light ultimates (docs/LIGHT-PINK-BRIEF.md): rainbowheart + holyjudgement (20k4b; shared thick-heart sprites), sunflare (20k4c). Replaced firstdawn, orrery, lanterns. The other seven pink Light designs (Crescent Beam, Meteor Shower, Ray of Light, Salvation, Ribbon Waltz, Wish Upon a Star, Love Sanctuary) are in the user's spec, not built yet.
- v203: Sunflare anchored at its cast point, spins in 3D, pink pulse waves per tick, no hard-edged shaft foot/cut-out.
- v204: Holy Judgement 20 / 40 at Adept (two fans) / 80 at Celestial (eight groups of ten); same total damage, shorter trails and sparser dust per light as the count grows.
- v205: Holy Judgement toned down to 20 / 30 at Adept (two fans) / 40 at Celestial (four groups of ten).
- v206: Ray of Light (replaces Seraphic Refraction): a vertical pink-white beam glides through the monsters; colossal with layered currents at Celestial.
- v207: Ray of Light: every column layer and the inner currents feather out over the last ~1.6 tiles (no hard bottom edge).
- v208: Ray of Light: no pet cut-out band (it showed as a dark box); the whole column eases down smoothly while the pet is on or behind it.
- v209: Ray of Light damage ×3 (45 × base instead of 15).
- v210: Ray of Light: pink lightning crackles down both edges (re-struck ~13×/s, with branches; 2/3/4 bolts per side by tier); the column flickers and a wide outer glow breathes.
- v211: Ray of Light: edge lightning removed; solid (normal-blended) rose body and an opaque pearl-white core with candy edges under the glow, so the column reads as substance.
- v212: Let It Go stays at its cast point; frozen field, veins and frost pattern fade softly at the rim (no hard ellipse edge).
- v213: Armageddon rebuilt as a fire Catastrophe: swirling firelight beams from a vortex of fire, flame tongues spiralling round each hot core, embers; 3 / 7 at Adept / 10 for 7 s as Super Armageddon. Same damage total, burn, cooldown.
- v214: Armageddon: flame-sprite crown at each foot and trail flames removed; twisting flame ribbons (2, 3 at Celestial) spiral and rise round the upper body of each core instead.
- v215: Armageddon beams cut by 40%: 2 / 4 at Adept / 6 at Celestial (same damage total, split over fewer beams).
- v216: Armageddon twisting flames: ribbons taper to points where they turn behind the core (no blunt cut ends) and their sides feather through six soft layers.
- v217: Armageddon flame ribbons feathered further: nine wide low-alpha layers, longer taper where they turn behind the core.
- v218: Armageddon beam sprite: its spiral strands thin and fade to nothing where they turn behind the core, and the flame curls taper to a hair at the tip with a faint halo (no thick hard-edged strokes).
- v219: Armageddon beam foot fully feathered (the cached column fades out over its last 20%, drawn a little past the foot).
- v220: Pink Light round 2 (docs/LIGHT-PINK-BRIEF-2.md): Crescent Beam (20k4e, replaces Daybreak Guilloche), Meteor Shower (20k4e, replaces Palace of Mirrors), Salvation (20k4f, replaces Solar Bloom Engine: full party heal + revive at every level; restoreParty/partySlot hooks in 20b, a "hud" draw layer), Ribbon Rainbow Heartache (20k4g, replaces Constellation Verdict). elem-moves exempts salvation from the damage check.
- v221: Light element UI is light pink (#FFB3E0, dark #C2508F) instead of cream: E8.light and ELEMENTS.light (skill buttons, element icons and rings, cast flashes), the Judgement reaction bolt.
- v222: Salvation cooldown 300 s (5 min); cooldowns of a minute or more read m:ss on the buttons.
- v223: Wish Upon a Star (20k4h, replaces River of Heaven) and Love Sanctuary (20k4i, replaces Crown of the Unsetting Sun; cd 60; stationary ward, shared shield pool 1.5× → 4× max HP, 10/15/20 s; petWard hook in hurtPet + setWard in 20b). All ten Light ults are now the pink designs. elem-moves: lovesanctuary exempt from the damage check, longer tail for it.
- v224: Love Sanctuary: dome removed (body and arc); just the magic circle, heart and the turning bands.
- v225: Aphrodite's Beam (20k4j, replaces Crescent Beam): the thick spinning heart (LU1 exports from 20k4b) above the pet zaps the 3/4/5 nearest monsters every 0.33 s with pink rays, hearts sprouting at hits; 7 / 10 / 14 s.
- v226: Aphrodite's Beam impacts: more, bigger, faster little hearts bursting out like ignition sparks, plus bright pink sparks.
- v227: 00-errbox.js: any uncaught error (or unhandled rejection) shows its message and location in a tap-to-close box on screen, so phone players can report startup failures.
- v228: boot reports a failing adoptState (loading the save) and a failing start-up in the error box instead of swallowing it in the hot-hook try/catch; error box strips URLs from stack lines.
- v229: start-up trace (BOOTLOG) and a 5 s safety net: if nothing loaded and no egg shows, the error box reports the trace, and with no save in this browser the egg is shown; room arrows ignore taps before a pet is loaded.
- v230: FIX website saves not loading: boot ran synchronously in 10-main.js before later files' top-level consts (elemParse, SUMMON_ONE…) were initialised, so a save with elemental moves or animas threw a TDZ error (the artifact hid it: its hot hook delays boot). Boot is now deferred with setTimeout 0.
- v231: all ten Light Strongs reworked pink (docs/LIGHT-STRONG-BRIEF.md, spec docs/elem-spec/light-strongs.md): Honey Sugar Heart Attack + Luv Me Luv Me Chain (20k4k), Lantern Fall + Love Mirrors (20k4l; Love Mirrors converted from Palace of Mirrors), Love Shock + Love Bombs (20k4m), Eternal Light + Sweetheart Stamp (20k4n), Ribbon Rendezvous + Sugar Rush (20k4o). Rows in 20k1 keep the old cost/cd.
- v232: COCOPETS TOWN (docs/HUB-BRIEF.md, spec docs/elem-spec/town-hub.md): the explorable town is the main hub. 24-hub-layout (shared data), 24a core (world, camera, collision with terraces/ramps/river/bridges, A* tap-to-go, party follow + idle errands, prompts, hub⇄house flow, save st.hub), 24b HubGeo (GeoKit cel-shaded 3D buildings, props, fantasy sculptures, cached), 24c HubLand (chunk-cached ground: grass, flagstones, plaza pavers, terraces, river with caustics/foam, bridges, dock; trees, ambience), 24d HubFacilities (every door, farm plots in town, kitchen with 5 recipes, feed/pet in town, stalls, upgrades, scenic rewards). The old Adventure town tab opens the hub. Tests: tests/hub.js, tests/hub-loops.js.
- v233: Town round 2: pets fully animated in town (shared drawPetFull in 12-arcade: rig, magic circle, leg lights, element glow, blinks, jump squash, dash lean; the Tower uses it too), permanent mini-map with facility glyphs (tap → signpost map), Jump is the big corner button, Dash smaller, Emote button removed; "Welcome to Town" (MUSIC_DATA town / assets/music/welcome-to-town.mp3) plays in town.
- v233b: the five embedded songs re-encoded 32 kb/s mono for the Claude build (page 17.1 → 15.6 MB, under the 16 MB artifact limit); the website keeps full-quality files.
- v234: Dark round 1 (docs/DARK-BRIEF.md, spec docs/elem-spec/dark-ults.md): Requiem (20k5b: GeoKit scythes 1/3/5, three sweeps each; replaces Curtain of the Last Night), Eclipse of the Hollow Moon rebuilt (20k5c: shaded sphere, corona, halo segments, detonation + screen negative 0.5 s via the new X.negative hook in 20b), Black Rose Compass rebuilt (20k5d: GeoKit thorns, layered rose), Eventide Spiral rebuilt (20k5e: shaded helical ribbons, torn coils). Known: the old Dark Strong Blackglass Fracture lands no damage in elem-moves (pre-existing).
- v235: Doomsday (20k5f, replaces Crown of Forgotten Kings): GeoKit faceted meteor with shell plates, slow-then-fast descent, one AoE hit at impact + X.negative(0.08), shockwave, eruption, temporary fracture field.
- v236: Final Eclipse (20k5g, replaces Night Without Reflection): Anima3D armoured horned demon with feathered raven wings drops from a torn black sphere, charges it with raised hands, hurls it down; one AoE impact.
- v237: Final Eclipse demon restyled: crimson muscle body, glossy black armour/horns/claws/feathers, real 3D spikes, a void face with a purple light inside; grows 1× → 1.5× (4 wings) at Adept → 2.5× (6 wings, 4 longer horns, more spikes) at Celestial; X.negative(0.08) at the sphere impact.
- v238: Final Eclipse demon: obsidian glass body with purple shading and violet rim (no red), torso anatomy replaced with abstract armour (chevron breastplate, segmented belly carapace, back plates, flank shards, violet seams).
- v239: Final Eclipse: fixed sizes per level (demon 1.6/2.4/4.0 tiles, sphere r 0.95/1.4/2.4·√K, no fitting to the room); after the throw the demon gathers and explodes — a second darkness wave hitArea (0.4× main, r 1.2× main, kb 5) instead of dissolving.
- v240: the negative frame plays under Fewer effects too (a speed setting); only the system Reduce Motion swaps it for a soft flash; it lasts at least three drawn frames and covers the whole canvas (identity transform).
- v241: Dark round 4: Hollow Moon finale squeezes to a marble, expands and bursts into negative energy (20k5c); Umbra Heart (20k5h, replaces Palace of Ink; 7/9/12 s pool + rupture); Annihilation (20k5i, replaces Abyssal Orrery; six circles, six missiles, sphere, strike, mushroom blast, one 24× hit); Thriller (20k5j, replaces Thousand-Raven Funeral; Anima3D zombie army 3/6/10 echoing each normal attack at 100% for 30 s, then rushing and exploding; onNormal hook in 20b tryFire). elem-moves: Thriller taps attacks, longer tails for thriller/umbraheart.
- v242: artifact build drops the embedded songs (10.8 MB; GitHub build still streams music); cast-pillar foot feathered into the floor; Thriller zombies claw on their own (~1 s), echo at 200 %, explosions 4x; cooldowns Annihilation 50, Final Eclipse 45, Doomsday 40.
- v243: Dead Scream (20k5k, replaces Leviathan Beneath the Floor; cd 43): a cached obsidian skull hovers over the pet and screams a pulse every 0.5 s for 7 / 12 / 20 s (area damage, 0.32 s stun, fear; sparks deal their own hits; ~14 / 22 / 32× + 4× finishing burst). Fear hook (m.fearT) in 20b; skull glyph in 02d.
- v244: Dead Scream: the halo arcs shiver constantly (harder as it gathers and screams) and every scream throws expanding copies of them outward that fade (L1 gets its own burst arcs); Celestial skull 20% smaller (HS 3.9 -> 3.12).
- v245: Thriller zombie blows halved (echoK 2 -> 1; their own claws scale with it; explosions unchanged at 4x); Eclipse of the Hollow Moon renamed Dark Side of the Moon (key hollowmoon unchanged).
- v246: Earth ultimates revamped (8 new, spec docs/elem-spec/earth-ults.md, brief docs/EARTH-BRIEF.md): Shockwave Trampoline (20k2b, the pet itself jumps: me.hopSq/hopArm/hopFoot hooks), World Shaking (20k2c), Geode Arsenal (20k2d), Cataclysm (20k2e, EARTHC 3D kit, 1/2/3 impacts + ember crystals), Crystal Coronation (20k2f), Rock Steady (20k2g, cd 120, halves hits and returns 10x the prevented half to every monster near; hurtPet now supports several wards via addWard), Gilded Quicksand (20k2h, own 40% slow m.sandT), Obsidian Drill (20k2i). Mandala and Heart of the Mountain kept.
- v247: Earth round 2: World Shaking spins/vibrates far more and homes on its target (retargets; finale on arrival); Geode Arsenal rebuilt as ember crystals (pet twirls up via me.twirl hook, 6/10/14 homing crystals, Celestial 2 waves of 7); Crystal Coronation now charges and explodes (own finale hit, totals unchanged); Obsidian Drill Celestial 1 + 7 small drills.
- v248: Geode Arsenal ember crystals 25% smaller; the pet now turns in real 3D (pose.yaw in drawPetRig: cached body / front / behind-half layers placed by 3D yaw and depth-sorted; yaw 0 pixel-identical), replacing the me.twirl squash.
- v249: Geode Arsenal: no turn (the user disliked it); the pet floats up facing front, waves its arms, dangles its feet and bobs. Rig yaw support kept, unused.
- v250: Rock Steady by level: prevents 50 / 60 / 70 % of each hit and strikes back at 100x / 200x / 400x the prevented amount (L1 / Adept / Celestial, evenly between).
- v251: Titan (20k2j, replaces Heart of the Mountain; cd 57): a ~150-stone articulated GeoKit golem with moss, 2.6 s entrance, 25 s ally AI (punch / backhand / ground slam), Worldbreaker finale and crumble; adaptive detail; drawEnt hook in 20b sorts it with monsters and the pet; fist glyph.
- v252: Titan optimised: no live 3D in play; key poses baked per level tier and 8 facings (5 baked + mirrored), lazily on a 2.4 ms/frame budget, cached across casts (LRU cap 48 MB); ~0.14 ms/frame warm vs ~23 ms before.
- v253: Titan fight 5 / 8 / 12 s (attacks x25/duration, Worldbreaker unchanged); leaner bake (fewer poses, 1.2x res, 1.2 ms slices, texture/moss built in steps, facings baked on demand, idle-time warm-up when a floor starts with Titan equipped; cap 32 MB).
- v254: Titan cd 40; when it falls 7.5+ tiles behind it sinks away, streams across as tumbling mossy stones with amber light, and re-forms ~2.2 tiles behind the pet (no attacks during; the timer keeps running).
- v255: Rocky (20k2k, replaces Thousand-Peak Mandala; cd 22): two baked 3D stone fists (knuckle row, curled fingers, wrapped thumb, cuff), 2 / 4 / 7-strike combos with the pet leaning, lunging and crouching in time (hooks me.hopLean, hopDX/DY, hopArmS); final Celestial straight punch strongest.
- v256: Rocky Celestial has 4 fists: a second pair 1.4x bigger hovers above-behind, echoes strikes 1-6 at 65% and merges into the final four-fist punch (+20%); own 1.4x bake, picture cache LRU 32 MB.
- v257: Rocky fists spread out (main pair ~1.7x further apart, Celestial upper pair wider and never overlapping, screen-clamped); each fist strikes its own side of the group, echoes land at their own spots; hit radii +20%.
- v258: four new Wind ultimates (spec docs/elem-spec/wind-ults.md, brief docs/WIND-BRIEF.md): Flower Hurricane (20k3b, replaces Skyfall Carousel; 7 twisters), Monsoon (20k3c, replaces Eye of the Tempest; cd 25, pull + 0.5 s ticks), Terrible Tornado (20k3d, replaces Crownless Hurricane; 1/3/6 tornadoes, built like Catastrophe), 1000 Blades (20k3e, replaces Thousand-Wing Migration; 10/30/60 katanas into 100/300/600 green flowers). All bake sprites lazily with .warm idle hooks.
- v259: Flower Hurricane rebuilt as a flower storm (3/5/7 cutting blossom streams, no funnels); Dandelion Cyclone re-skinned (20k3f: shaded seed head, baked seeds, galaxy at Celestial; damage now scales with level); Breath of the Wild (20k3g, replaces Breath Between Mountains; 20 s meadow, cd 120, heals the active pet 2/2.75/3.5% max HP per second inside); 1000 Blades keeps its warmed sprites through the cast zoom.
- v260: Fujin (20k3h, replaces Invisible Giant's Bow; cd 22): baked 3D emerald crystal spear, satin ribbon with lagging ends, 3/5/7 spear-first dives that grow in height, radius and damage (14/17/20 DK total); pet travels during ascents (moveEnt), invulnerable while airborne like the game's leap.
- v261: fix: monster onDeath hooks got a dungeon X without ST (the Torn Hull charge cell crashed with "X.ST is not a function" when it broke beside the pet, e.g. under a Fujin dive); X now carries ST.
- v262: Fujin damage x2 (28/34/40 DK) with heavier landings (hitstop, shake, double shockwave, crater light, wind spike) and a colossal final wind bloom at every level (final radius x1.4).
- v263: Pandemonium (20k3i, replaces Loom of the Heavens; cd 75): emerald cyclone lifts monsters into its eye (visual m.liftZ, held), ticks 10/14/18 DK over 7/10/14 s, other allied hits on captives x1.4 (m.pandemUntil hook in hitMon, own hits tagged), finale 10/13/16 DK.
- v264: Team menu live stage (21d-team-stage.js): the selected pet drawn live (drawPetFull) on an element-tinted starry nebula with a dais; idles, wanders, emotes; tap/rub/hold/play-ball interactions (joy and pats, no XP); swap transition; runs only while visible.
- v265: Pandemonium blades: one shared cross-section (0 alpha at the inner edge, rising translucent emerald, crisp mint-white rim on the outer edge), real transparency, rim kept outward as they turn; additive glow toned down.
- v266: Team stage optimised: real-time clock (wings were slowing with the frame rate), smooth wing rotation (wingSmooth in drawPetFull, stage only), background on its own low-DPR canvas refreshed ~4×/s, fewer stars and motes, no badge backdrop blur, town redraws 1×/s under the open sheet. ~2× the frame rate in tests.
- v267: Pandemonium optimised: ~half the per-frame cost (Celestial warm ~1.2 ms vs 2.2 ms): fewer real petal sprites with denser petal clouds, culling, buffer reuse, no per-frame allocation, 2-step bakes (longest step 1.9 ms), ImageBitmap sprites.
- v268: Pandemonium eye gets a pulsating, flickering emerald core (cached glow layers, filaments, inbound sparks; grows in, tightens and brightens before the finale, bursts with it).
- v269: Pandemonium core 35% smaller (all its layers, filaments and sparks scale together).
- v270: Pandemonium core another 30% smaller (0.455x the v268 size); half the big canopy bands get a 35% softer rim (bladeProfile soft param: wider, dimmer, eased rim; bandAs/bandBs alternating).
- v271: all big Pandemonium bands (canopy, outer, funnel bands) use the soft rim, now 0.42 (35 % softer +20 %).
- v272: Zephyr's Blessing (20k3j, replaces Palace of the Sky; cd 90): party buff on g.zephyr for 10/13/16 s: move x1.3, attack speed +20/30/35 % (normal interval and Strong cooldowns), 20 % damage reduction, slow immunity, Windguard charges 1 (2 at Celestial) block a hit with no knockback; addWard(fn, first) ordering; HUD chip.
- v273: fix: Zephyr's Blessing could not be equipped — its key `zephyr` clashed with the Wind Strong Returning Zephyr (elemParse found the Strong first). Renamed the Ultimate key to `zephyrblessing`; elem-moves now fails on any shared Strong/Ultimate key.
- v274: Zephyr's Blessing lasts 25 / 30 / 35 s (L1 / Adept / Celestial, evenly between) with a 60 s cooldown.
- v275: Zephyr's Blessing counter: every real hit taken while blessed (blocked or not, not DoT, max one burst per 0.3 s) shoots 6 / 8 / 10 homing wind-feather spikes, 0.45 / 0.55 / 0.65 x base x K x evoK each.
- v276: Winds of Oblivion (20k3k, replaces Horizon Severance; cd 60): a halo wave marks monsters Windworn for 10 / 14 / 17 s: their damage x0.75 (bosses too; shots/zones/timers attributed via wornBy), damage taken x1.25 and AI timers x0.8, steps x0.7 (non-bosses); dispels shields → attack → speed buffs (1, 2 from Adept; m.mbuffs generic hook); Celestial blocks new buffs for 5 s (noBuffUntil in 20d). Pre-existing: floor-rules floor-layer check and boss-run fail on HEAD too.
- v277: Zephyr aura widened and flattened (orbit from the pet's drawn width, 0.95–1.6 pet heights), lighter ribbons, segments over the pet fade to 0.15 so it stays clear.
- v278: Dark Strongs upgraded (brief docs/DARK-STRONG-BRIEF.md): Eclipse Disc (20k5l: 1.25x 3D obsidian disc, slide then contract and burst, damage x(1+0.12(evo-1))), Inkfang (20k5m: glossy ink fangs 1/2/3, ink-ribbon splash), Nightneedle Cluster (20k5n: faceted obsidian needles 7→20, total 2.94→4.35 DK).
- v279: Dracula (20k5o, Dark Strong replacing Blackglass Fracture; cost 28, cd 6): the pet becomes a vampire bat (me.petAlt hides the pet draw) and dives 2 / 3 / 4 times; each successful bite heals 6% max HP once; damage 2.5 / 3.6 / 4.8 x base total; darkness spheres and a blood siphon.
- v280: Demon Blade (20k5p, Dark Strong replacing Midnight Double; cost 28, cd 6): baked obsidian greatsword, 3 / 5 / 7-swing combo in the spec order ending with the overhead finisher, layered trails, 2% max HP per connecting swing (nonlethal, direct HP). X.pet() added to the elemental X so Dracula and Demon Blade end on a real party swap (ST is also replaced on level-up).
- v281: Demon Blade: no movement hold (the pet walks, attacks and dodges freely; the sword and swings follow it; swings play out at the aim when nothing is in reach, no HP cost); heavier darkness: smoke off the blade, crackles, afterimages, darkness spheres, slash marks, shards, splash and shadow rings on hits, a dome on the finisher.
- v282: Day of the Dead (20k5q, an 11th Dark Ultimate; cd 120): downed party members rise as spirits (40/50/60% of their max HP), fire their Ults on the same update, then Strong 1 and 2, fight 8/11/14 s and return to down. Spirits run moves through their own DunElem with a proxy X; DunElem.refuse + a useUlt hook refund the cast when nobody is down. ELEM_ULT_LV has an 11th entry; elem-moves accepts ≥10 Ults.
- v283: five new Dark Strongs — Death's Pursuit, Shadow Seam, Night Bloom, Eclipse Mantle (shield ward), Witch's Brand (def/speed cut + expiry detonation); replace hem, hollowlantern, undertow, ravenfold, umbralhook.
- v284: Sports Car — 11th Light ult (20k4p core: drive, ram, Drift, vehicle HUD, Supernova meter, 120 s cd from exit; 20k4q moves: Shooting Star, Love Sensation, Supernova burnouts + ejection).
- v285: Sports Car round 2 — Drift is a spinning dodge-style burst (3.0 DK, 2.5-tile sweep, knockback, cd 0.9 s, chained presses); top speed +40% (11.8); car-centre wall collision fix; Supernova faster spins, many more effects, damage doubled (pulses 3.2 DK, blast 12 DK).
- v286: Sports Car round 3 — Shooting Star / Love Sensation cd 1.5 s (buffered presses); Supernova 4/5/6 wide donut burnouts (sweep 2.5 DK + knockback, bigger waves, pink light wave per spin); car smashes allowlisted props/pots (RES.hitProp / breakPot) so dense rifts no longer block it.
- v287: Sports Car Jump — button above Drift (key J), 0.69 s hop over gap tiles beside bridges, planned safe landing (walkable + reachable), 1.2 DK landing hit, cd 1.2 s; Capricorn gate skips airborne pet.
- v288: Beast Machine — 11th Thunder ult (20k9i core: construction gag, sphere-traced bronze machine from the user's concept, ride, Jump as Dodge, Judgement meter, 120 s cd from exit; 20k9j Homing Missiles 10/15/20 + Heaven's Wrath 1/2/3 with exact 2 s cd; 20k9k Judgement Day leap, impale, sphere storm, burst, pop and ejection).
- v289: Beast Machine round 2 — top speed +35% (10.8) with snappier steering; Drift back (Shift / dodge button: spinning claw burst, 3.0 DK, cd 0.9 s, rider flat roll); Jump on its own button above Drift (J), no cooldown, buffered on touchdown, take-off i-frames at most every 1.8 s.
- v290: vehicles smash the environment — shared 20k0v VEH_SMASH (allowlist over every Tower and rift land prop kind, swept + circle/oval area smashes, prop-aware flowAt); Beast Machine smashes when riding, Drift, Jump landing, Wrath and Judgement; chests burst open through breakPot (reward once) and shrines bless through useShrine then break (both vehicles); walls, gaps, bridges, doors, exits, keys, stage objects and puzzle/Fiend stages protected.
- v291: smoother joystick — a held stick is never stolen by a second touch (api.ptrLive), the stick pad round its home always gives the stick even over a monster or vehicle, a resize no longer drops a held stick, a finger down during a pause or cinematic is adopted as the stick on its first drag; tests/joystick.js (real touch via CDP).
- v292: Beast Machine deals double damage on every hit (TUNE.dmgK 2 in hitCharge: riding, Drift, Jump, Missiles, Wrath, Judgement Day); the Judgement meter keeps its pace.
- v293: Nidhogg model and animation (20k6f NIDHOGG_MODEL: sphere-traced crimson mecha-dragon, 16 headings, membranes, glow layers, clips summon/hover/fly/climb/descend/dive/fireball/flare/ultima/beam/settle/dismiss); dev-only __pp.nidhoggPreview(); no gameplay yet.
- v294: Nidhogg round 3 — head ~1.5x with heavy jaw, brow, thick horns, spike crown and frills; tail 1.4x (16 links); continuous neck/tail strips and pinned limbs so turns never split (432-frame sweep); Ultima spike growth replaced by glowing traced outlines (trace channel); ring 2.2x thicker with bloom, smooth 3.2 rad/s spin.
- v295: Nidhogg round 4 — snap-spin turns (turnDriver, >24° in 0.12–0.2 s, rests on the 16 baked headings) with motion-blur ghosts (drawSpin); 3D projected dorsal spikes; head rebuilt to the Beast Machine standard (plated snout, studs, ember nostrils, detailed slit-pupil eyes, gem brow, banded horns, heavy jaw opening downward); anchors corrected.
- v296: Nidhogg — 11th Fire ult playable (20k6g core: summon, free flight beyond the land with altitude and offshore camera, zero-cooldown Dive Bomb, Ultima meter, crimson HUD, safe return, 120 s cd from exit, one bake scale per floor and whole-heading drawing so the dragon never splits; 20k6h Fireballs 1/2/3 cd 2 s + Flare 10/20/30 cd 4 s; 20k6i Ultima ring charge, beam 10 ticks, one colossal explosion); tests/nidhogg-ultima.js.
- v297: Nidhogg round 2 — drawn at 0.65 size (wingspan ~7 tiles, flight zoom 0.9, bake 16.4 s/7.6 MB → 10.7 s/4.6 MB at dpr 2); cruise/high toggle removed; Dive Bomb is spin → plunge → slam (0.52 s) → spin, ~0.9 s, zero cooldown, rider flat roll per spin.
- v298: fix "provided value is non-finite" crash: a monster knocked into a gap with no last walkable spot dropped coins at NaN (killMon falls back to its position / the pet), drop/dropAcc never place a pickup at a non-finite spot, GFX.blob skips non-finite input.
- v299: no more NaN stones: walkPoint no longer reads x/y from its options object when nothing walkable is near (gave NaN), and dropStone falls back to the pet's last walkable spot when the pet is offshore on Nidhogg.
- v300: Nidhogg round 3 — warm-up runs on every browser (Safari has no requestIdleCallback) with a quick-pictures-first bake plan, cold summon hovers until drawable so it never flies frozen; smooth continuous turns (5 rad/s, bank, head lead, tail lag) with turn-rate motion blur; Fireballs cd 1 s; heavier Dive Bomb 1.56 s (slam hit-stop, 0.62 s grinding ground spin, push-off); 2 blur ghosts max.
- v301: Nidhogg draws no motion-blur ghosts at all (ghostsOf returns none); the wingtip streaks stay.
- v302: Sports Car deals double damage on every hit (TUNE.dmgK 2 in hitCharge); the Supernova meter keeps its pace.
- v303: Nidhogg smashes the environment like Beast Machine (VEH_SMASH): the torso through props at cruise height (smashable props no longer block), Dive Bomb slam and grind, Fireballs and Ultima areas, Flare lance strikes; chests open and shrines bless once; protected kinds, doors, bridges, exits, walls and puzzle/Fiend stages untouched; no Ultima charge from props.
- v304: Nidhogg effects (fire waves blowing out and wavy fire strings into the mouth while charging; formless beam: no clip, soft scrolling flame layers at half resolution, licking tongues, rolling puffs; bigger blast 7/7.5/8 tiles with a taller column and cap, secondary bursts and lingering fires; soft blurred dragon shadow) and Heaven's Wrath oval 2x area (4.8 x 3.1 tiles), 6 DK per strike, sky bolts and crawling ground arcs; nidhogg-ultima test waits for flight.
- v305: Nidhogg Ultima has no pet cut-out (the fire covers the rider while it lasts, per the user); Heaven's Wrath floor oval is a feathered soft sprite with no rim, lightning thins toward the edge, plus spark showers, bouncing electric motes with hopping arcs and a softer bigger flash.
- v306: Susano O — 12th Dark ult (ELEM_ULT_LV gets an 85 entry): 20k5v SUSANO_MODEL one part set and rig for robot and Dark Messiah airship with a 10-stage connected transformation; 20k5w core (summon, robot glide x1.35 via X.mvMod, Glides, basic sword swing, Transform state machine, airship flight, Dive, two menus with one airship Strong, 35 s + fresh 20 s timers on the game clock, shared meter, 240 s cooldown at exit); 20k5x moves (True Dark Blade wave, Dark Spikes reusing Crystal Coronation in obsidian via optional hooks, Shockwave Pulsar, Dark Messiah 130/175/210 DK explosion, first in tests/ult-damage-rank.js); tests/susanoo.js 44 checks.
- v307: Susano O round 2 — model bulked up (VIS 1.45, thick layered arms and legs, 1.75x fists, lacquered clear-coat metal, gold-framed heart chest hatch that hides the pet once formed and opens at dismiss, legSwing/wingSway/hipYaw/swordArc channels); animation rebuilt on one spring layer (anticipation, overshoot, overlap; alternating twisting cuts, full-spin Glides, arched True Dark Blade, crouching Dark Spikes, eased Transform, banking airship); swing and Glides reach +10%.
- v308: Susano O rendered live in WebGL (20k5uz GLM: procedural rigged meshes, ~34k tris, 44 draws, PBR-style shader with clear-coat, filigree, engraving and emissive seams; one offscreen GL canvas per frame drawn into drawEnt); no per-view baking, solid from every side; pods seated in a reactor pack; VIS 1.1 to fit phones; sprite path kept as fallback (no WebGL, lost context, software renderer) and fixed to never mix views.
- v309: Susano O stands tall: thighs and shins ~1.45x, narrower waist, lifted neck, a hovering hero base pose (one leg trailing, one knee raised, chest open, off arm flung out, wings spread); idle bobs and breathes without crouching, the glide leans forward like flight with the legs trailing, attack crouches spring back to the stance; Dive reach 11 tiles.
- v310: Susano O: Dark Messiah rebuilt as gather → speck → drop → nuclear dark blast, drawn by a WebGL effects layer (12k GPU points + noise shader, valid premultiplied output, smoke over + light lighter; 2D fallback), damage unchanged; robot Jump (button above Glides, J, no cooldown, safe landings, 2.6 DK landing shockwave); airship camera centred on the drawn ship with velocity lead; more metal spikes and an open-claw off-hand on the model.
- v311: Susano O: free arm rests hanging at the side, hand relaxed; airship nose rebuilt like the concept (fists grip the crossguard, sword runs ahead as the prow, the helmeted head leads between the fists with glowing eyes); True Dark Blade wave is now a thin violet-edged crescent lying low and reading as a horizontal arc in every direction, hitbox matched to the drawn arc.
- v312: Susano O: True Dark Blade replaced by Death Ray (free-hand laser carves a magic circle that glows and explodes; same damage budget and cooldown; arm aims via aimL channels); Glides is a no-cooldown 4-hit combo (cut, return cut, spin, leaping slam finisher 1.6x + shockwave, stage pips on the button); head seated with no neck in both forms; a flight mask with a violet slit closes over the face during the transformation.
- v313: Susano O: Death Ray replaced by Death Bombs (five dark orbs flung at the nearest enemies, each sinks into a magic circle that bursts in a rippling chain; 2.5 DK per burst, max 2 hits per enemy); airship camera now aims at the model's drawn centre (its "center" anchor) and holds the ship 0.4 tiles under the screen middle.
- v314: camera: a ridden form that frames itself (Susano O's airship, k > 0) now wins over a rift's camera and over a Super Fiend floor's idle hook (camPick in 20b; a fiend's own cinematic framing still wins, and its arena keeps zoom <= 0.78). On rift floors the airship sat 4-4.7 tiles above centre; now 0.4 below.
- v315: Fenrir, the 11th Ice ult (unlock 80): one GLM-drawn mechanical ice wolf that folds into a motorcycle (20k8m model, 20k8n core, 20k8o moves + FENRIR GPU effects layer with 2D fallback). Drift attacks then switches form; Ice Cannon 2/4/6 shells; Somersault (bike) / Spinning Wheel (wolf); finishers Diamond Dust (bike, freezes 3 s) and Frozen (wolf, a 5.00 s beam on 20 fixed ticks), 95/115/125 DK. All attacks smash props via VEH_SMASH. tests/fenrir.js (46 checks).  
- v316: Fenrir: model polish (calipers, toothed pivot rings, chains, turbine vanes, teeth, engraved armour), body crystals glow from within with halos (crystalGlow channel, brighter with speed and attacks), engine and hub lights in a distinct violet-blue; Jump in both forms (button above Drift, J, no cooldown, safe landings, 2.6 DK landing frost burst, wolf leg tuck); Diamond Dust reworked to ten colossal glacial ice masses in three beats with ice-lightning, light shafts and a grander shatter (same damage and timing; freeze now in three steps). tests/fenrir-jump.js (13 checks).
- v317: Belladonna, the 11th Wind ult (unlock 80): a flying three-layer flower drawn live with GLM (20k5ya: 4 leaves, a pink bloom, a pearl inner flower, 6 green and 8 white dynamic-tube tentacles, one ring with 8 swords), Nidhogg-style free flight with a self-framing camera (20k5yb), and 3D GPU effects with a 2D fallback (20k5yc). Dodge is Swoosh; Strongs are Wildflowers and Ring Blade (the model's own ring thrown); the Twister gauge buys six orbiting tornadoes on 20 fixed ticks, 95/115/125 DK. All attacks smash props. GLM gains botanical materials 22-29, halos, touchGeo, and cel materials 30-35 with an outline for Jaws (unused yet). tests/belladonna.js (55 checks).
- v318: Jaws, the 11th Water ult (unlock 80): one cel-shaded mechanical shark that unfolds into Leviathan, a siege submarine, from a single 36-part set (20k7m; GLM cel ids 30-36, an outline, a waterline clip). Core 20k7n: Nidhogg-style flight, Anchor/Release (Jump slot, J), one timer 30/45/60 s, cooldown 150 s, a Tidal Pool registry (max 3: create, refresh, replace oldest, claim, consume), shared slot cooldowns, ctx.movable. Moves 20k7o in 3D on the GPU: Maw, Water Ray (leaves a pool), Rolling Wave, Hydrojet, Depth Charge (6 DK, 15 into a pool), Maelstrom (16 DK), Shark Attack (sky beam + spirit-jaw snap, 95/115/125 DK). tests/jaws.js (76 checks).
- v319: Jaws Water Bombs replace Rolling Wave (7 lobbed bombs round-robin over the nearest enemies, 1.5 DK splash each); Jaws model detail and cel shading polish; Belladonna flower at 65% with v318-size ring, 1.5x longer tendrils, lively animation (breath, bob, springs, per-tentacle waves, attack anticipation and follow-through); Belladonna defeat test waits for the exit petals.
- v320: Jaws: two wing cannons under the Leviathan wings (wingGun part, cannonL/R anchors, fire cosmetic alternating shots in Depth Charge and Maelstrom), a flickering baby-blue glow on eyes, gills, seams, reactor and plate edges with feathered halos (glowK: rest 1, attacks up to 2.5). Belladonna: Swoosh closes into a flower bud (bulb, bulbTip) with the pet hidden inside, dives, bursts open on impact; tendrils 1.3x longer with bigger irregular waves and reaching gestures; petal flutter and a stronger row breath; swoop effects anchored to the bud.
- v321: Belladonna: 45 s at every evo, Wildflowers 1.0 s, Ring Blade 1.5 s; Swoosh dives as a bud, then blooms, spins and slams six tentacles onto the nearest enemies (0.8 DK each, slam/slamDir/slamR/floorZ) and a final slam (2 DK, 3 tiles); Wildflowers recast keeps its tick clock; a queued Twister waits out a Swoosh (3.5 s). Jaws: 60 s, S1 Water Bombs 1.0 s, S2 Water Ray 1.5 s; pool cap 3/3/5; Anchor removed, the 5th pool cast auto-transforms to a flying Leviathan (S1 Depth Charge, S2 Maelstrom), a TRANSFORM button (Jump slot, J) returns to the shark and resets the count; Depth Charge radius 3.8/7.0 tiles; GPU Tidal Pool renderer (material 37, drawPools); elaborate effects pass on both ults. Tests: belladonna 62, jaws 87; joystick reset no longer clears the floor.
- v322: Jaws: the Jump slot shows TRANSFORMING during every morph; xf pinned to 0/1 outside a morph; Leviathan-only parts hidden at xf 0 in the 2D fallback too, fins deploy from xf 0.15, flanks from 0.3; zero-scale parts skipped in the GPU pass. Belladonna: ringGreen channel, the ring and swords glow and pulse green (2.5 Hz) through Twister. GLM recovers from a lost WebGL context (fresh context after 1.5 s) and a GPU draw error retries after 1.5 s (gives up after 3 in 20 s) instead of falling back to 2D for good. tests/gl.js: shader compile and GPU models drawing; jaws.js 88 (xf 0 in shark).
- v323: Jaws floating-wing fix: the model read the core's ever-growing breath phase as a flank offset, so the plates drifted outward over a session (1.4 tiles after a minute); breath is now a sin() swell in Leviathan only, swim and breath wrap, every pose channel clamped with NaN guarded. Closed glass canopy over the cockpit (canopy part and channel), the pet hidden inside while Jaws is active.
- v324: hotfix: Nidhogg Flare dealt no damage on the first cast after loading when far from the map origin (aimL had slipped into a comment, so a fresh lance timed its flight to (0, 0) and expired).
- v325: GPU remake, part 1. Nidhogg: a GLM 3D model (20k6fa, NIDHOGG_GL; GLM ids 38-48) with veined membranes, per-scale shading and warm emissive seams; wings 1.5x span and 1.1x chord (span 14.8 tiles) with shoulder/elbow/wrist/fingerSpread/billow channels; a realistic flight animation in 20k6g (flap cycle, glides, S-wave neck and tail, bank spring, eased clip blends); Ultima pull-back halved, flight zoom 0.78. Beast Machine: a GLM 3D model (20k9ia, BEAST_GL; ids 49-57, 67, 68) on a port of the 2D shader with analytic sphere occluders (AO and soft key shadows), round lens eyes, sharp horns; animation pass and GPU hookup in 20k9i. GPU skill effects for Nidhogg (FGFX), Beast Machine (EGFX) and Sports Car (LGFX), the 2D kept as fallback. Sports Car GPU model (20k4pa) included but not yet hooked. Tests: nidhogg.js, beast.js, car.js pins, gl.js per model, extents.
- v326: Nidhogg feedback: flight camera 25% wider (zoom 0.585, moves and Ultima scaled to it); Ultima rune ring 1.6x, brighter and faster, drawn over the dragon; wings held low and back under the ring through the Ultima (ultWingCheck in nidhogg-ultima.js, clearance 1.19); the hard orange Ultima outline replaced by a soft feathered orange-red aura that builds with the charge; every GPU effect quad (FGFX, EGFX, LGFX) fades to zero inside its rect, one layer per copy, 4 px gap in the older painters.
- v327: Sports Car Shooting Star: smaller pink stars (0.55x average, 0.5-1.4x varied per star, pink, hot pink and blush, pale bevel, pink glow and tails), GPU and 2D; hits unchanged.
- v328: Nidhogg skill effects in true 3D on the GPU (20k6hb: world-space meshes with depth): churning 3D fireballs with curved tails and billowing bursts, Flare lances as fire shafts with spiral ribbons, Dive Bomb trail and rising fireball over the dragon, the Ultima rune ring as spinning tori, a flame cylinder beam, a 3D dome blast and a rolling mushroom cap; the 2D effects stay the fallback. Ultima camera keeps a quarter of its authored pull-back (about 0.54 at the 0.585 flight zoom).
- v329: Nidhogg: the Fireball burst and the Ultima blast and mushroom cloud back to the GPU-painted version (the user preferred it: blended smoke and fire); the fireball in flight, Flare, Dive Bomb, the Ultima ring, charge and beam stay in true 3D.
- v330: Nidhogg Ultima camera: 30% less pull-back (ULT_CAM_K 0.25 to 0.175 of the authored zoom-out).
- v331: Nidhogg Ultima camera: 50% less pull-back again (ULT_CAM_K 0.0875); it still pulls back, just closer.
- v332: Nidhogg — wing membranes tucked into the flank (no slit between wing and body on the GPU model); Dive Bomb landing fire back to the flat painted version (3D dive layers off, DIVE3D); Flare cooldown 4 s → 2 s (baselines updated).
- v333: Nidhogg Ultima camera closer to the dragon: ULT_CAM_K 0.0875 → 0.04375 (half the pull-back) and ULT_LEAN_K 0.5 (the view leans half as far toward the beam target).
- v334: Nidhogg Ultima camera 1.6x closer than the flight zoom (ULT_IN 1.6, from the user's cropped screenshot); flight zoom unchanged (0.585).
- v335: Genbu — Earth's 11th ult (Lv 80): a gigantic mechanical turtle with a drill, ridden 20/25/35 s; GPU 3D model (20k2kz, materials 69–74; ~97k tris, ~51k lowFx; box-hull 2D fallback), core 20k2l (Shell Roll, Jump stomp, Rock You, Drill Cannon, Calamity: transform, burrow, eight Earth drills, crumble), 3D effects 20k2m; drill form with the motor retracted into the shell; tests/genbu.js (33 checks, GLFLAGS), elem-moves, extent and gl branches. Also: Nidhogg Ultima camera pulled back 20% (ULT_IN 1.6 → 1.28).
- v336: Genbu — all damage x3 (dmgK 2 → 6; gauge rate unchanged); Calamity drilling 16/18/20 s (cap 40); one Calamity command (DRILL under / RISE up; Jump hidden); Drill Cannon reworked: fired in an arc at the target (≥ 4 tiles out), lodges nose-down and grinds (4 ticks, r 1.7), explodes, a new bit materialises (drillMat channel; lodged bit placed free of the body sway, floor-cut); summon drills up out of the ground in front of the pet (drill form, nose up), then the pet hops on; roll gate fix; tests/genbu.js 35 checks (summon, Calamity length, new cannon flow).
- v337: Pets in 2.5D on the GPU (PetGL, 02h-pet-gl.js): the town, the room, the Tower and every fight draw a pet from its own art cut into layers (back split at the tail so ears/mane/wings/tail keep the drawing's order, arms and shoulder plates behind the body pushed out until they show, the face sliding round the body with a slight turn, a face per expression), copied into each canvas; old drawing for Legendaries, without WebGL, and if the copy is slow on a device. Flat art: arms and plates behind the body, set out from the coat's outline; arms at most half as long. 48 new genes: ears (bows, spiked, shell, mushroom, hound, rock), horns (spike crown, stone, oni, spiral, coral, moon), tails (devil, spiked club, pebbles, stinger, bow, cloud), wings (dragon, petal, bubble, moth, ribbon, star), arms (spiked, stone, pincers, ribbon, leaf, flame), feet (stone, crystal, talons, ribbon, cloud, spiked), skins (crystal, stone, feathered, magma, mossy, starry), markings (hearts, stars, zigzags, rosettes, swirls, bands); in hatching, evolution and the stage 4/5 horn and wing picks.
- v338: Six-star Legendaries in 2.5D on the GPU (02h-pet-gl.js, legendOK on by default; PetGL.legends(false) turns it off): wings beat with a quick downstroke, flex and tremble, swing smoothly within their flap limits and barely fold (butterflies fold up), drawn uncropped (wide raster box) with their outline ink set (var(--pet-line) -> #2B2433); the golden aura with a blurred glow under its rays and ring; lights as soft additive glows with a solid core and a 7-sample trail, passing behind the body (in front of the wings) on the far side; an aurora of 10 ribbons (fine blurred threads mixed with broad curtains, shades of the pet's element colour, fading and drifting) only in the dungeons and the Rift (drawPetFull o.aurora, set by 20b). Room: the canvas is fitted to the Legendary's frame (PetGL.box) and its DOM wing/aura/light layers hide while it draws (legMove skipped); the room now finds its picture by .pet-svg (a Legendary's own layers came first, so its face and tail were not driven). Tower and town: drawPetRig no longer skips Legendaries; GL draws their lights in the plain (lite) drawing from legLightGeo when drawPetFull asks (PetGL.will), else the old canvas lights. The magic circle has a soft blurred glow under each layer (magicCircleGlow on canvas, .mc-glow in the room).
- v339: The aurora keeps its place when the pet turns: drawPetRig passes mirror (o.flip) and the aurora program flips its view about the pet (uView.z negated; the frame is centred on it), cancelling the caller's flip. It fades away as the pet dodges (fast, rate 30) and back in after (rate 4): 20b eases me.aurK toward 0 while me.dodge or dead, and o.aurora is now 0..1 (multiplies each ribbon's alpha).
- v340: PetGL's cost guard is kept for each size of frame (COST.by, keyed by log2 of the frame's pixels): a size that is slow to hand over (EMA > 3.5 ms over 30 draws) is drawn softer step by step (q x0.8, down to about half) and only then falls back to the picture for that size; before, one slow frame size (the Team menu's big pet at a phone's full sharpness) turned the GPU drawing off for every pet for the rest of the visit, so the menu showed the old drawing. will() also says no for a pet whose last size fell back, so its canvas lights draw.
- v341: Pets drawn on the GPU turn round in 2.5D to face left or right instead of being mirrored. Tower, town, Team stage: drawPetSprite does not flip when PetGL.will draws the pet (glTurn) and hands drawPetRig o.dir (-1/1); its yaw eases (rate 7) to dir * 0.38 standing, 0.5 walking, through facing you; a pose's yaw is turned by dir, the step's foot slide too, and the aurora is not mirrored then. Room: the rig's scale drops the facing while its GL canvas is on; pet.yaw eases to facing * (0.36 or 0.5 walking, + look 0.2), 0 asleep, fast in a spin; GP.look is in screen terms (look.x * facing). Companions alike (c.yaw to facing * 0.36/0.5).
- v342: Apocalypse (Fire Ult, 20k6e) painted on the GPU through Nidhogg's FGFX (20k6h) wherever a real GPU draws it (window.__APOC_GL = 0 or a software rasteriser keeps the 2D): the great fireball a new FGFX kind 12, a turning globe of crimson plasma (3D domain-warped fbm on the sphere, crust lit from the upper left, fire welling up in patches, ridged molten veins brightening and widening with instability, a hot limb), with kind 13 a corona of flames licking off its limb (3D noise, no seam), prominence loops and a heart showing through as it destabilises; satellites the same, small; energy streams and fissures as seamless lines of gaussian beams (lineQ, ends overlapped an eighth so fades sum to one); the blast a flash, rays, shock fronts over burning fractured ground, a dome and mushroom cloud of billows cooling into smoke; firework trails and starbursts of beams and sparkles. Rune circles stay crisp 2D pictures (back half under the fire, front half over it). FGFX: 3D noise (n3, fbm3), solid pass is kinds 9-12, kind ranges made exact.
- v343: Armageddon (Fire Ult, 20k6d) painted on the GPU through FGFX like Apocalypse (window.__ARM_GL = 0 keeps the 2D): a new FGFX kind 14, a vortex of turbulent flame wound into log-spiral arms round a hot eye (the sky vortex, double at Celestial, and the swirl under each beam); each beam a column of scrolling turbulent fire in overlapping stretches about two widths long (so the grain holds down a long column) over its laid-over body, a white-hot core, fire tongues licking up and out as they wind round it (far ones dim), embers whirling up inside; the floor burning and cracking round the aim, a pool of firelight, burning ring, white splash and running embers under each beam, its firelight and burning patches left along its path; last flare (a fireball, shock ring, shimmer); embers drifting over the screen. Same beams, steering, timing and damage. (A reflection on some floors mirrors tall effects, 2D and GPU alike.)
- v344: Three more Fire Ults painted on the GPU (20k6e, a shared kit: gfx(flag), gLine, gFlame (a tongue at any angle), gBall, gSun, gTail, gStreak; window.__FIRE_GL = 0 or each move's own flag keeps the 2D). Nine-Tailed Conflagration (__NT_GL): each fox tail a volume of billowing fire swelling through its middle with turbulent light, tufts of flame leaning back along its flanks, a white-hot core and a blazing tip; the halo and sigil burning rings, the lance a spear of turbulent fire with a fireball point, the Celestial ring burst a ring of standing flames; ember paths and the lance track stay 2D marks. Crown of Falling Suns (__FS_GL): the suns turning plasma globes (the Apocalypse sphere, orange) with flame mantles and rays, falling as streaks of fire; flames and glints on the spikes; shock fronts over burning ground; the Celestial spires real flames; the crown bands and spikes stay crisp 2D solids, two GPU passes so back suns sit behind the front bands. Inferno Carousel (__IC_GL): the column a tall roaring flame (laid-over body, turbulent fire rising, the great tongue and two side tongues, a crown of tongues at its foot, a spiral of fire, a fireball cap); the blades stay crisp 2D solids with real fire licking off them and fire streaks as they fly; the rune ring a burning channel; the fire waves rings of flames; the burning patches real flames.
- v345: Crimson Lotus Forge (Fire Ult, 20k6d) painted on the GPU (gfxD; __CL_GL = 0 or __FIRE_GL = 0 keeps the 2D): the petals and bud stay crisp molten-crust solids (2D) with real flames on the petal tips; the forge floor a heat-stained disc (2D) under burning cracked ground, glowing veins and a burning rim; the flame sweeps turbulent fire racing between the layers (bands of light, fireballs and tongues along them); the bud's heart a swelling white-hot glow, then a roaring pillar of three great tongues over a laid-over body with fireballs rising up it, a shock front and shimmer; Celestial seeds bloom with glowing hearts and burst into tongues of fire and rings.
