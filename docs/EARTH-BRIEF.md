# Earth ultimates — the revamp (five workers)

The user's full spec, verbatim: `docs/elem-spec/earth-ults.md`. Read your section(s) and the "Completion and review"
section. The user: "I want the effects and models to be very high quality, advanced and 3D, use advanced shading and
textures to achieve this, high quality like ice, fire, water, dark, light, thunder." H = the pet's height ≈ 1 tile
(`T` px per tile on screen; use `C.K` for area scale as the other ults do).

## House standard (read before writing)
- The bar: the reworked elements — `src/js/20k8f-ice-ult-5.js` (U.catastrophe), fire `20k6*`, thunder `20k9*`, water `20k7*`,
  light `20k4*`, and the newest Dark ults `src/js/20k5g-dark-ult-6.js` (Final Eclipse: a GeoKit 3D model with cel bands,
  cached), `20k5k-dark-ult-10.js` (Dead Scream: shaded relief rendered once into cached sprites, separate moving parts),
  `20k5i-dark-ult-8.js` (Annihilation). Study how they build and cache 3D-looking models and how they layer effects.
- Rules from the user's feedback (every one of these has been sent back before):
  - feather EVERY edge: ring edges, ripple edges, beam feet, debris trails, decal borders — no hard lines anywhere;
  - floor marks are light-only and fade (warm amber light, settling dust — never dark permanent stains or flat discs);
  - never cover the pet: effects near/over it dim smoothly (never a cut-out box);
  - solid cores under additive glow (pure additive looks see-through); readable models under bloom (shading, rim, ink);
  - smooth, alive motion; buildup → release → fade; everything cleaned up on end, floor change and death.
- Performance: cached sprites/models (render each 3D model once per size/pose bucket to an offscreen canvas or use GeoKit
  with cached meshes), no per-frame gradients in loops, no shadowBlur/filter, particles via `H.n()`/`H.Q()`. Celestial
  should average ≲ 4 ms/frame. The user plays on an iPhone and a 2019 iMac.
- Toolkit `H`: `src/js/20k1-elem-core.js` (`create`: add, hitArea/hitLine/hitCone/hitRing, pull, warn, P/burst, sphere,
  fade, ease, sortNear, living, X.* = banner, sfx, flash, negative, hitstop, shake, ring, boom, light, after, hitMon,
  dmgO({...}) incl. stun/slow/kb options — grep how other ults apply slows and stuns). Runner passes the game clock;
  timelines use `f.t`. Continuous damage must be frame-rate independent (ticks on f.t, not per frame).
- 3D kits: `GeoKit` (`src/js/20h5-fiend-geo.js`: `cam`, `block/prism/pyramid/mesh`, `solid(...)` with cel bands, per-face
  painting, glints, ink; big recent use in `src/js/24b-hub-geo.js`) and `Anima3D` (`src/js/02f2-anima-3d.js`).
- Earth palette (gold/amber/stone): deep stone #2A2118, charcoal #3A3028, umber #5C4126, earth #7A5218, amber #D98A1E,
  gold #F2B73A, honey #FFCF5C, pale gold #FFE9B8, ember-core #FFF4D6. Dark rough stone dominant, gold/amber light in seams,
  edges and impacts. Readable on both dark and bright floors (rim light + ink).
- Damage: an ultimate ≈ `C.base × 12–16 × C.K × (1 + 0.08 × (evo − 1))` total on a monster in the area the whole time,
  split over its beats (Celestial may reach ~20×, being longer/richer). State your numbers. Levels: `C.evo` 1..7 (Adept 4,
  Celestial 7); interpolate between; discrete counts hold until their breakpoint. Wave hits must follow the visible front
  (one hit per enemy per wave, when the drawn front reaches it). Decorative debris never deals damage unless the spec says.

## Rows and files
The rows are set in `src/js/20k1-elem-core.js` (don't edit them except fixing your own row's description). Each worker
writes NEW files only (they sort after `20k2-elem-earth.js` and override it); delete the old key in your file.
Wrapper: `/* ---------- Earth, reworked: <move> ---------- */ (() => { const U = ELEM_IMPL.earth.ult; delete U.<old>; U.<key> = (C, H) => { ... }; })();`

| Worker | File(s) | Move(s) |
|---|---|---|
| A | `src/js/20k2b-earth-ult-1.js` | E1 Shockwave Trampoline `U.trampoline` (`delete U.cathedral`) |
| B | `20k2c-earth-ult-2.js`, `20k2d-earth-ult-3.js` | E2 World Shaking `U.worldshaking` (`delete U.worldspine`); E7 Geode Arsenal `U.geodearsenal` (`delete U.celestialgeode`) |
| C | `20k2e-earth-ult-4.js`, `20k2f-earth-ult-5.js` | E3 Cataclysm `U.cataclysm` (`delete U.footfall`); E5 Crystal Coronation `U.coronation` (`delete U.kingdom`) |
| D | `20k2g-earth-ult-6.js` | E4 Rock Steady `U.rocksteady` (`delete U.saturn`) |
| E | `20k2h-earth-ult-7.js`, `20k2i-earth-ult-8.js` | E8 Gilded Quicksand `U.quicksand` (`delete U.amberepoch`); E9 Obsidian Drill `U.obsidiandrill` (`delete U.divide`) |
(mandala and mountainheart stay as they are for now.)

Shared files: only A and D may touch `src/js/20b-game-dungeon.js`, each with the smallest commented hook; always re-read
the exact region right before editing (the other may have edited nearby) and use small targeted edits. Only D may edit
`tests/elem-moves.js` (add `rocksteady ? 30 :` to the TAILW rule, and anything else Rock Steady's test needs).

## Per-worker notes
- **A — Trampoline:** the PET itself must jump (crouch, stretch, airborne, heavy landing, squash; ears/tail follow
  through if the rig allows). Find how the pet is drawn in the dungeon (20b draw of `me`, `drawPetFull` in 12-arcade.js,
  any existing z/hop/squash fields such as dodge or jump) and add one minimal commented hook (e.g. `me.hopZ` and
  `me.squash` read by the pet draw, with its shadow staying on the floor and shrinking with height). Don't grant
  invulnerability or change targeting; the pet stays at its cast position unless the game's movement moves it (follow the
  existing rules; simplest: shockwaves come from wherever the pet lands). 0.75 s cadence, longer final jump. Counts
  3/5/7 (1→3, 4→5, 7→7, interpolate 3,3,4,5,5,6,7), reach 3/3.75/4.5 × K. Waves hit each enemy once when the front reaches
  it. Adept wedge plates; Celestial layered amber fracture build-up; final jump taller, 1.3× wider, stronger hit.
- **B — World Shaking + Geode Arsenal:** the orb is a 3D shaded sphere with rotating mineral bands (render bands as
  textured lat-long or layered cached slices; keep volume readable) inside a beveled 3D torus ring (GeoKit or a
  sorted-segment torus with shaded sides and a luminous inner edge), tilted; one orb at every level, travels along the aim
  following the floor (stop at walls), contact ticks ~0.25 s, finale burst. Geodes: GeoKit-style rough spheres whose 4
  shell sections hinge open to a crystal bed; spears are faceted 3D crystals with continuous trajectories (`H.X` projectile
  helpers or own flight with one hit each); 3 volleys, third heavier.
- **C — Cataclysm + Coronation:** exactly 1/2/3 boulder impacts including the first (verify in a scratch test), crystals
  6/10/14 each exploding once ~0.6 s after landing with their own small area. The boulder ≈ 3H diameter at L1, larger with
  evo — make sure it fits the phone screen; a high-quality faceted 3D rock with recessed glowing veins (cached render per
  rotation bucket, or GeoKit mesh). Coronation: crowns of 6 faceted 3D crystal spires (dark stone root, honey inner planes,
  pale gold edges), one hit per crown pulse, each crown wider and stronger, 0.25 s apart.
- **D — Rock Steady:** user's numbers are required: 15/20/25 s, cd 120 (the row is set), retaliation 10 × each prevented
  amount to EVERY enemy within 3/3.75/4.5 × K, per hit, immediately. DECISION on the spec's conflict: incoming damage is
  HALVED (the identity line, "halve every incoming attack's damage"): the pet takes 50%, A = the prevented 50%. Make the
  fraction one constant (`ABSORB = 0.5`) so it can be changed. All pet damage goes through `hurtPet` in 20b, which already
  has a ward hook used by Love Sanctuary (`X.setWard`, see `src/js/20k4i-light-ult-8.js`): make the hook support more than
  one ward (a small list, or chain) so Love Sanctuary and Rock Steady both work, and keep Love Sanctuary's behaviour
  identical. Retaliation goes through hitMon with el 'earth', tagged so it cannot itself be reflected (and monsters don't
  reflect anyway — note it). No party damage. Rocks: 6/8/12 cel-shaded 3D beveled slabs (GeoKit), two tilted orbits, 2nd
  depth layer at Adept, 3 interlocking bands at Celestial; gaps keep the pet visible (the rocks pass behind and in front;
  dim the ones in front of the pet). Write a scratch test (not in tests/) proving: duration by level, an attacker's hit is
  halved, each nearby monster takes 10 × A (several targets), no reflection loop, cleanup.
- **E — Quicksand + Drill:** quicksand slows 40% (use the game's slow status) and ticks periodic damage; field is a
  textured granular surface (cached grain texture tiles, animated ripple ridges via offset/masked layers, feathered rim),
  sink illusion at the feet (grain ring), hardening mosaic → plates lift → final rupture hit (separate from the last tick).
  Drill: a constructed helix of faceted stone wedges with gold seams (GeoKit or cached per-rotation-phase renders, e.g. 12–
  16 phases), legible rotation, eruption hit, periodic contact ticks, finale plunge + one shared rupture hit per enemy.

## Checking (all workers)
- Build your own page: `python3 src/build.py --test-only test-<you>.html` (never test.html; never commit or push).
- `ELEM=earth ONLY=<key> EVO=1|4|7 HTML=test-<you>.html node tests/elem-moves.js` must pass (no page errors, cleanup).
- Screenshots from the real gameplay camera: copy
  `/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/ds/shot.js` (usage at its top; it was written
  for Dark/Dead Scream — switch element to earth, your move key and page, and replace its `f.HZ` frame-finder with your
  own), make a montage per move at `.../scratchpad/earth-<you>/<key>.png` (rows L1/L4/L7, columns = the key beats), LOOK
  at it with Read, fix rough edges and weak models, repeat until it's genuinely on par with the fire/ice/dark work.
- Report briefly: files changed, damage per level, any hooks added, Celestial ms/frame, anything unverified.

# Round 3 — Titan (one worker; the user's spec: `docs/elem-spec/earth-titan.md`, verbatim)
Row set in 20k1: key `titan` replaces `mountainheart` (cost 100, cd 57, glyph `'fist'` — add a small fist glyph to GLYPHS
in `src/js/02d-cards.js` if missing). File: `src/js/20k2j-earth-ult-9.js` (`delete U.mountainheart`).
- One golem, ~3× the pet's height (tune for the phone screen), entrance → 25 s combat (timer starts when active) →
  Worldbreaker finale (~2.5–3 s) → crumble. Peaceful departure if no monsters remain.
- A true 3D model: build the golem from GeoKit solids (src/js/20h5-fiend-geo.js; the Final Eclipse demon in 20k5g is the
  closest precedent: a big articulated 3D creature) — boulders/plates as beveled faceted solids with cel shading, stone
  texture (pits, scratches, worn light edges), deep dark gaps between plates, moss patches as painted face regions plus a
  few raised clumps; small white-green eyes deep in sockets. Rig: hips, torso, head, shoulders, upper arms, forearms,
  hands with segmented fingers + thumb (open / curl / fist), thighs, shins, feet with toes. Rigid plates, joint rotation
  only (no stretching). Cache what you can (per-part meshes; per-frame only transforms + a sorted draw); budget: Celestial
  ≲ 4–5 ms/frame; if live GeoKit is too slow, pre-render pose frames (walk cycle, attack keyframes) to cached canvases.
- Behaviour: it is an ally actor, not damageable unless the game's summon/companion system already supports that (grep
  20b for companion/summon/ally/anima behaviour and reuse what exists for following and targeting; otherwise a simple
  ally AI: follow the pet at a short distance, walk to the nearest monster in reach, attack). Walk with weight (dust per
  footfall). Attacks (Earth, scaled by C.base × K × evoK): heavy punch, sweeping backhand (arc), ground slam (shockwave
  ring, hit when the front arrives) — damage on the contact frame. Aim ≈ 2.5–3 DK per second of combat at L1 overall.
- Worldbreaker: gauntlets of rock assemble on the fists, windup overhead, two-fist slam: an initial impact hit near the
  fists (≈ 6 DK) + a travelling earthquake ring hitting each monster once as the front reaches it (≈ 5 DK), wider and
  stronger by level; decorative debris never hits. Celestial: towering jagged ridge, energy links to the chest.
- Levels: L1 / Adept (bigger shoulders/forearms, more glow) / Celestial (layered shoulder stones, engraved markings,
  golden light in fractures, widest slam). Never cover the pet with the golem: when it stands in front of the pet, dim
  it smoothly; keep it to the side/behind the pet when idle.
- House rules as above (feather edges, light-only floor marks, cleanup on end/floor change/death).
- Check: test page test-t.html, `ELEM=earth ONLY=titan EVO=1|4|7` (add `titan ? 34 :` to TAILW in tests/elem-moves.js),
  a model turntable montage (front/side/back/three-quarter, fist open/closed) at `.../scratchpad/titan/model.png` and an
  in-game montage (entrance, walk, punch, backhand, slam, Worldbreaker windup, slam, crumble) at L1/L4/L7 at
  `.../scratchpad/titan/titan.png`. Compare with the reference image; iterate until it reads as that golem.
