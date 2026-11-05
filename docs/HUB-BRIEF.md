# Cocopets Town — the explorable hub (round 1 brief for four workers)

The user's spec is `docs/elem-spec/town-hub.md` (verbatim). Read it once; then this brief is the contract. The game is a
single-page 2D canvas game (no engine, no WebGL, no meshes): "3D" means the cel-shaded software renderer the bosses use
(`GeoKit` in `src/js/20h5-fiend-geo.js`: camera `cam(X, Y, T)`, meshes `block/prism/pyramid/mesh`, `solid(c, cam, mesh,
xform, { mats, face, ... })` with lit cel bands, textures on faces, glints, ink outlines) and `Anima3D` in
`02f2-anima-3d.js`. The user wants the town's buildings and props at the bosses' level of modelling and shading.
Build: `python3 src/build.py` (all `src/js/*.js` concatenate in name order into one page; `--test-only test-<you>.html`
for your own page, never test.html; never commit/push). Phone first (iPhone): cache static drawings as sprites, keep
per-frame work modest, no shadowBlur/filter in loops.

## What exists (reuse, don't rebuild)
- **Pocket Town** `src/js/23-town.js` + `23a-town-art.js`: a canvas village inside the Adventure overlay (`#townWrap`,
  `#townCv`, `#townUi`, opened by `openTown()` from the map tab 'town'). Free movement with a stick/WASD/tap-to-go, dash,
  jump, emotes, the party trailing behind, buildings with doors that open mini-game stage cards (`mapSel`,
  `renderStageCard` in 12-arcade / 11-map), NPC stalls with dialogue (eggs, treasure, forge, pearls, the elder, the gate
  sentinel), `st.town` saves the pet's position. **This is the movement/camera/interaction reference and the seed of the
  hub.**
- **The house**: `#stage` / `#room` (06-room.js, 06b-house.js: rooms, `switchRoom`, decorating `enterDecor/exitDecor`,
  drawer, `openHouse`, 06d-mansion), activities (08-activities: feed/play trays via `openTray('feed'|'play')`), the pet
  (07-pet, 07b-pets: `partyPets()`), farm plots (06c-farm: `CROPS` in 03-items, `growFarm(s, hours)` in 04-state simulates
  `house.rooms[].plots`, `st.pantry` holds food), SNACKS/food benefits (03-items, `FOOD_DXP`), shop (07g `openShop`),
  team (`openTeam`), cards/skills (`openCards`), lab (`openLaboratory`, fusion `openFusion`, ascension 07f), animas
  (`openAnimas`), dungeon/rift/world map (`openMap`, map tabs in 11-map/21-dungeon/21b-rift-ui).
- **State**: `st` (04-state.js: `newState`, `sanitize` — add new fields there with safe defaults so old saves load).
- **Dock** (`#dock`: Feed, Play, Adventure, House, Team, Card) and the HUD stay.

## The hub in one paragraph
On load the player arrives in **Cocopets Town** (the new hub canvas, full screen, the dock below it) with the active pet
and party. They walk a continuous outdoor map (`HUB` in `src/js/24-hub-layout.js`: 2600×2000 world px, districts,
terraces with ramps, paths, a river with bridges, buildings with doors, props, trees, plots). Walking to a facility shows
a prompt; tapping it (or walking into the door) opens that facility: the **cottage door opens the existing house
interior** (`#stage`, where feeding/sleeping/decorating/storage live; an "Outside" control returns to town), the farm
plots are walked up to and planted/watered/harvested in place, the kitchen cooks, the dojo opens training, the
sanctuary opens evolution/fusion/ascension, the market stalls are the old NPC stalls plus the shop, the workshop opens
decorating/upgrades, the Tower gate opens the dungeon, the rift gate opens the rifts, the six mini-game houses open their
stage cards. The old Adventure 'town' tab goes away (the hub *is* the town); the world/dungeon/rift tabs remain.

## Files and owners (one file each; never edit another worker's file; shared edits are listed per worker)
| Worker | File | Owns |
|---|---|---|
| A core | `src/js/24a-hub-core.js` | world, camera, movement, collision, party follow + pet idle behaviours, depth sort/draw loop, interaction prompts, screen flow (hub ⇄ house ⇄ overlays), save, input. Shared edits: `src/body.html` (the hub canvas + UI container), `src/styles.css` (hub styles), 10-main.js (boot into the hub), 11-map.js/21-dungeon.js (remove the 'town' tab, keep stage cards), 23-town.js (retire `openTown` or make it a thin alias; keep what the hub reuses). |
| B buildings | `src/js/24b-hub-geo.js` | `HubGeo`: the 3D building and prop kit (every `kind` in `HUB.buildings` and `HUB.props`), cached rendering. No DOM, no game state. |
| C landscape | `src/js/24c-hub-land.js` | `HubLand`: terrain painter (grass, paving, paths, terraces/cliffs/ramps, river, bridges, dock), trees/shrubs/rocks/flowers as depth entities, ambience (sway, petals, fountain splash, ripples, chimney smoke, banners, butterflies, cooking steam) and the pet-visibility fade helper. No DOM, no game state. |
| D facilities | `src/js/24d-hub-facilities.js` | `HubFacilities`: every interaction (facility list with prompts and `open()`), the farm loop in town, the kitchen/cooking loop (new recipes → existing food), pet care in town (feed/pet/play responses), training/sanctuary/market/workshop/gates/mini-games wiring, scenic spots and small rewards, town upgrades data + visible flags, save fields. Shared edits: 04-state.js (`sanitize` for new fields), 03-items.js (recipes), the Feed/Play tray hooks in 08/09 if needed. |

Everything else (fiend files, elemental files, dungeon) is off limits.

## Contracts (exact; the core calls these, the kits must not need the core to be present)
Conventions: `c` canvas 2D context; `k` = screen px per world px (the camera zoom, 0.8–1.4); screen position of a world
point is `X = (wx - cam.x) * k + W/2`, `Y = (wy - cam.y) * k + H/2`; `t` = seconds; entities draw at their baseline
(feet) and sort by baseline y; elevation level `lv` lifts a thing visually by `lv * 70` world px (so a terrace at level 1
is drawn 70 px higher on screen than its map y; the core applies the lift, the kits just draw at the screen point they get).

### `HubGeo` (B)
```js
globalThis.HubGeo = {
  // a drawable for a building or prop: the core calls make() once per entity, then draw() every frame it is on screen
  make(entry) → { w, d,                 // footprint in world px (collision box centred on entry.x, from y-d to y)
                  top,                  // world px above the baseline the drawing reaches (for culling and roof fading)
                  door: [x, y] | null,  // where the player stands to use it (copied from the entry if given)
                  draw(c, X, Y, k, t, o) }  // o = { fade: 0..1 (1 = normal; <1 when the pet is behind it: dim the upper body/roof), lit: 0..1 (evening windows, round 2), flag: bool (facility active/upgraded) }
  // entry = an element of HUB.buildings or HUB.props ({ kind, x, y, w?, d?, face?, color?, game? }); unknown kind → a tidy placeholder box, never a throw
  kinds: [...]                           // the kinds it knows
}
```
Rendering rule: build each kind as GeoKit meshes (walls as blocks with recessed door/window insets, gabled/hipped roofs
as prisms with thickness and overhanging eaves, chimneys, porches, awnings, signs, posts, barrels…) with materials
(timber, cream plaster, mossy stone, tiled roofs in distinct colours, satin awnings), cel bands + ink + the GeoKit `face`
callback for tile rows / planks / plaster cracks / stone courses, then **cache the static picture per kind+k in an
offscreen canvas** (re-render when k changes by > 5%) and blit; draw only the animated bits live (banner cloth, smoke
is C's, lantern glow, sign swing, water in the fountain basin is C's — Geo draws the stone). A building's silhouette must
be recognisable at k = 1 on a 390 px wide phone. Camera for GeoKit: use `GeoKit.cam(X, Y, T)` with the kit's own
elevation (0.62 rad looks down like the town view) and T ≈ k × (world px per model unit you choose; e.g. 1 unit = 10 px).
Every kind in `HUB.buildings` and `HUB.props` must exist: cottage (tiled roof, timber framing, chimney, flower boxes,
porch), shed, dojo (tiered roof, banners' poles, lanterns), shrine, altar, kitchen (open front, counter, hanging pots),
stall (awning in entry.color, produce baskets, hanging sign), workshop (stone hearth chimney, big doors, timber beams),
gate (the Tower's arch), riftgate (a crystal arch), hangar, hedge, dome, mine, tent, gym (the six mini-game houses —
keep each one's colour identity from 23-town.js), bigtree (the flowering landmark), fountain (sculpted tiers), bench,
lanternpost, well, woodpile, flowerbed, trellis, cart, scarecrow, dummy (training target), banner, rack, crystal, pool,
torii, cookpot, crates, baskets, workbench, anvil, lumber, picnic, reeds, rocks, telescope, flowerring, readingbench,
plot (a farm bed: `o.stage` -1 empty / 0..3 crop stage, `o.wet` bool, `o.crop` key — draw the soil, the furrows, the
sprout→plant→ripe crop by stage), greenhouse (for the upgrade), and `shadow(c, X, Y, w, k)` a soft contact shadow.

### `HubLand` (C)
```js
globalThis.HubLand = {
  paintGround(c, cam, k, W, H, t),   // everything that lies flat: grass with variation, dirt/flagstone paths from HUB.paths, the plaza's patterned paving, terrace tops and their cliff/retaining-wall faces (a level-1 terrace face is 70 px tall on screen), ramps/stairs, the river (animated: flow lines, ripples, sparkle) and its banks, bridges' decks, the dock, flower patches, the farm's bed terraces. Cache into chunk canvases (e.g. 512 px world chunks per k) and blit; only animate water/sparkle live over the cache.
  entities() → [{ x, y, w, d, top, lv, kind, draw(c, X, Y, k, t, o) }],   // trees, shrubs, rocks, flowers, reeds from HUB.trees/shrubs/rocks(+ your own scatter): depth-sorted with buildings by the core; trees sway (crown offset by a slow sine), cherry trees shed petals; o.fade as in HubGeo
  update(dt, cam, k, W, H, t, wind),  // ambience: petals drifting, butterflies (2–5 near flowers), fountain splashes at HUB.props fountain, chimney smoke from the cottage/kitchen/workshop chimneys (positions: cottage [800, 380], kitchen [1560, 1300], workshop [2040, 1280] world px before lift), cooking steam at the cookpot, banner flutter phase, water ripples where pets stand in the river shallows (core passes positions via setPets([{x,y,el}]))
  drawOver(c, cam, k, W, H, t),       // the airborne layer drawn after all entities: petals, butterflies, smoke, steam, sparkles
  setPets(list),                      // [{ x, y, el }] el = 'water'|'wind'|'fire'|... : water pets ripple the stream, wind pets stir petals, fire pets warm the hearth (a glow at the nearest chimney/cookpot)
  lift(lv) → lv * 70,
}
```
Collision for the landscape is the core's job from the layout (terrace polygons, river polyline minus bridges); C only
paints. Light: soft daylight, readable; keep the palette warm (timber, cream, mossy stone, lush green). Shadows: a soft
ground shadow under trees.

### `HubFacilities` (D)
```js
globalThis.HubFacilities = {
  init(core),                          // core = the hub's API (below); called once when the hub starts
  places() → [{ id, x, y, r, lv, prompt: () => string|null, open: () => void, icon?: 'door'|'leaf'|'pot'|'sword'|'gem'|'coin'|'hammer'|'star'|'gate'|'game' }],   // every interactable spot: building doors (from HUB.buildings; D decides what each opens), farm plots, scenic spots, NPC stalls; prompt() returns the text for the on-screen button when the pet is within r (null hides it)
  extraEntities() → [...drawables like HubGeo.make's shape...],   // things only D knows: the six farm plots (use HubGeo.make({kind:'plot',...}) with live o.stage/wet/crop), NPCs standing at their stalls (reuse 23-town's NPC sprites/dialogue), the greenhouse once built
  update(dt, t),                        // timers: crop growth ticks (reuse growFarm's rule per hour), cooking in progress, pet-care reactions
  petIdle(pet, ctx) → action | null,    // optional: when the core's pets idle near a spot (bench, stream, flowerbed, bed), D may return { kind: 'sit'|'watch'|'sniff'|'curl', x, y, dur } so the core plays it; the core already does approach-for-affection/settle-nearby itself
  onFeed(k) / onPet() / onPlay()        // the dock's Feed tray selection, a tap on the pet, Play: visible responses in town (hearts, a happy hop, a toast of the benefit) and the stat effects via the existing functions
}
```
Core API handed to `init(core)`: `{ pet: () => ({x, y}), party: () => [...], toast(msg), prompt(id, on), teleport(x, y),
openHouse(), openOverlay(fn), onReturn(cb), emitHearts(x, y), say(npcId, line), addEntity(e), removeEntity(e),
blockers(), walkable(x, y) }`.

## Worker A — core (the one everybody plugs into)
1. **Screen flow.** New `<div id="hubWrap"><canvas id="hubCv"></canvas><div id="hubUi"></div></div>` inside `#app`
   above `#stage` (CSS: fills the stage area; the dock stays below). `enterHub()` shows it and hides `#stage`; `enterHouse()`
   the reverse (the cottage interior is the existing room; add an "Outside" button to the room's HUD area that calls
   `enterHub()`). Boot: `startGame` ends in the hub when `st.hub` exists or the save is new; keep `st.hub = { x, y, inside:
   bool }` so a reload returns where the player was (inside → the house). The Adventure button, Team, Card, House work
   from the hub (overlays over it); when they close, the hub frame resumes. Feed/Play in the hub call `HubFacilities.onFeed/
   onPlay` (fallback: open the tray as today). Remove the 'town' map tab (`setMapTab('town')` → `enterHub()` + `closeMap()`),
   keep stage cards: a mini-game house door opens `mapSel = key; openMap(); setMapTab('world'); renderStageCard()` or
   whatever the existing path to a stage card is (read 11-map/12-arcade; `focusGemStage` is a lead).
2. **World.** Port 23-town's movement (stick/WASD/tap-to-go, dash, jump, emotes, party followers with spacing) onto
   `HUB`: camera follows the player with a dead zone and soft clamp to the world, zoom k by screen width (390 px → k≈1.0;
   wider → up to 1.3). Collision: footprints of buildings (`x ± w/2`, `y - d .. y`), landscape entity footprints (small, at the
   trunk), terrace polygons (walls except inside ramps: a ramp rect is walkable and crossing it changes the walker's `lv`;
   anything off-ramp at a different lv than the terrace is blocked), the river polyline band (blocked except on bridges;
   the shallows 10 px either side are walkable 'splash' zones), the world edge. `walkable(x, y, lv)` and a slide-along-walls
   move like `townMove`. Pets and followers carry `lv`; drawing lifts by `HubLand.lift(lv)` (fallback lv*70).
3. **Depth and draw.** Per frame: `HubLand.paintGround` → gather entities (`HubGeo.make` cache per layout entry +
   `HubLand.entities()` + `HubFacilities.extraEntities()` + pets/NPCs) → cull to screen → sort by `y + lv*70` (feet) →
   draw with `o.fade` (an entity whose footprint-to-top region contains the player's screen point and whose baseline is
   below the player's feet gets fade 0.35, eased over 0.25 s) → `HubLand.drawOver` → prompts/UI. Fallbacks when a kit is
   missing: ground = flat green with path lines, entities = labelled boxes — so the core runs alone.
4. **Pets.** The player's active pet is the walker (sprites via `loadSprites(formOf(st))` as 23-town does). Followers: the
   rest of the party trail with 40 px spacing, path around blockers (steer: if blocked, try ±45°, ±90°). When the player
   stops for > 1.5 s followers settle (sit/idle animation) and one may approach for affection (heart emote); tap a pet →
   `HubFacilities.onPet()`. Idle behaviours: every 6–12 s an idle follower picks a nearby spot of interest (flowerbed,
   fountain edge, bench, stream bank, bigtree) within 220 px, walks there, plays `petIdle` (sit/sniff/watch 2–4 s), returns.
   Shadows under pets (`HubGeo.shadow` or an ellipse). Elemental touches: pass `[{x, y, el: petElement(p)}]` to
   `HubLand.setPets` each frame.
5. **Interaction.** Each frame find the nearest `HubFacilities.places()` entry within `r`; show one prompt button in
   `#hubUi` (bottom centre above the dock: an icon + text; tap or press E/Enter → `open()`); walking into a door rect also
   opens it. Signposts: a small optional map (`M` key / a corner button) that draws the layout's districts and a "you are
   here" dot (simple, round 1). Destination marker: when a facility is opened from the dock's Adventure etc., nothing;
   when the player taps a district name in the map, a soft marker shows the way (optional).
6. **Save.** `st.hub.x/y/lv/inside` on every change (reuse `saveSoon()`); `sanitize` defaults are D's job — coordinate by
   writing `st.hub = st.hub || { x: HUB.spawn.x, y: HUB.spawn.y, lv: 0, inside: false }` defensively in the core too.
7. **Performance.** Offscreen cull everything; cap followers' sprite work; the frame must stay ≤ 8 ms on the iPhone
   budget with all kits present (measure in Chromium with `performance.now()` around the frame and report the number).
8. **Test** (write `tests/hub.js`, Playwright like `tests/elem-moves.js`): the page boots into the hub; the player can walk
   from spawn to every district centre without getting stuck (drive the movement by setting the goal and stepping game
   time); terrace blocking works (walking straight at a cliff is blocked, the ramp is not); entering the cottage shows
   `#stage` and "Outside" returns; a mini-game door opens its stage card; reload keeps the position; no page errors.

## Worker B — buildings and props (`HubGeo`)
Build the kit above. Study `20h5-fiend-geo.js` (`solid`, materials, `face` callback, `block/prism`) and `02f2-anima-3d.js`
for the cel look; the bosses in `20i-fiend-07b-abaddon.js` / `20i-fiend-09b-choronzon.js` show GeoKit in use. Model
each building as a few meshes (base, walls with a recessed door and windows as darker inset faces plus frames/shutters
as thin blocks, roof prism with thickness and eaves, chimney block, porch posts/awning/sign) with 3–4 materials; use the
`face` callback to draw roof tile rows, plank lines, plaster cracks, stone courses, window glass (pearly gradient) in face
space. Distinct silhouettes and roof colours per building. Props the same way (fewer parts). Cache per kind+k. Write a
scratch harness page (your own HTML in the scratchpad that loads the built game's script or just your file + GeoKit) that
lays every kind out in a grid at k = 1 and k = 1.3 and screenshot it; iterate until each reads clearly and looks like
the bosses' quality (shading bands, inked edges, textured faces, glints on glass/metal). Report the montage.

## Worker C — landscape and ambience (`HubLand`)
Build the kit above. Ground: layered grass (base tone, darker patches, blade tufts, flowers near paths), path kinds
('flag' flagstones with mortar, 'dirt' worn earth with pebbles, the plaza a radial pattern of pink and cream pavers round
the fountain), terrace tops a shade lighter with mossy stone retaining walls (drawn as the 70-px faces along the
polygon's south-facing edges; north edges are hidden) and stone stairs/ramps at `HUB.terraces[].ramps`, the river
(banded water, animated flow lines, highlights, reeds at the banks, the dock planks, bridges' arched stone with a deck),
farm bed terraces (low stone edging) and the orchard's grass. Trees: oak (round layered canopy), pine (tiers), cherry
(pink blossom clusters, sheds petals), willow (drooping strands) — crowns as shaded blob clusters with ink edge, trunks
with bark lines, soft shadow; sway. Ambience per the contract. Cache ground chunks per k; measure `paintGround` cost on
a full phone screen (target ≤ 2 ms when cached). Scratch harness: paint the whole map at k = 0.35 for an overview and
a few screen-sized views at k = 1 (plaza, river, farm, sanctuary terrace); screenshot and iterate; report the montage.

## Worker D — facilities and loops (`HubFacilities`)
1. **Places.** For every building in `HUB.buildings`: cottage → `core.openHouse()`; shed → the farm's seed/tool menu
   (a small overlay: buy seeds with coins per `CROPS[].seed`, see pantry); dojo → `openTeam()` (training) with a sub-prompt
   for `openCards()` (skills); altar → `openLaboratory()` (evolution/ascension) and shrines → `openFusion()` / `openAnimas()`;
   kitchen → the cooking overlay (below); stalls A–D → Madame Ova (eggs), Pockets (treasure), Glim (forge → `openLaboratory`
   fusion stones), Marina (pearls) — port their stall overlays/dialogue from 23-town.js — plus `openShop()` at stall D or the
   kitchen counter (decide, say which); workshop → decorating (`openHouse()` then `enterDecor()` or the drawer) and a
   "Town upgrades" overlay (data model `st.hub.up = { greenhouse: 0|1, dojo: 0|1, shrine: 0|1, porch: 0|1, workshop: 0|1 }`,
   each with a coin/crystal cost from the existing economy; buying sets the flag and a toast; the core passes `flag` to
   the building's draw and D adds the greenhouse entity when built — visible changes beyond that are round 2); gate →
   `openMap(); setMapTab('dungeon')`; riftgate → `setMapTab('rift')`; mini-game houses → the stage card (coordinate with A:
   A exposes `core.openStage(key)`; call it); the elder and sentinel NPCs stand in the plaza/at the gate with their lines.
2. **Farm in town.** `st.hub.plots` = 6 plots `{ crop, g, water }` created on first visit (if the player's farm room has
   plots with crops, copy them over once so nothing is lost; afterwards the town plots are the farm — the farm room keeps
   working too, both grow via `growFarm`: extend it to `s.hub.plots`). Walking up to a plot prompts Plant (choose a seed
   you own / buy), Water (speeds growth as the room does), Harvest (yield to `st.pantry`, with the existing harvest
   feedback: numbers, sparkles, a toast). Draw stages via `HubGeo.make({kind:'plot'})` entities with live `o`.
3. **Cooking.** `RECIPES` (add to 03-items): 5 starter recipes from crops → existing SNACKS keys with a clear benefit line
   (e.g. Sunberry jam → 'sunberry' food ×2; Carrot stew → 'carrot' ×2 + a joy bonus; Pumpkin pie → 'pumpkin' ×2; Starfruit
   tart → 'starfruit'; Garden salad → berries ×3). Cooking takes real time (30–90 s) at the kitchen: start it, walk away,
   come back; `st.hub.cook = { recipe, at }`; collect → pantry, toast the benefit. The kitchen overlay shows ingredients
   owned, what each dish does (use `FOOD_DXP`/SNACKS text) before cooking.
4. **Pet care in town.** `onFeed(k)`: spend the pantry item exactly as the room's feed activity does (read 08-activities for
   the stat changes; refactor the stat part into a shared function if needed), show the pet eating (a short hop + hearts
   via `core.emitHearts`) and a toast with the benefit. `onPet()`: joy +, hearts. `onPlay()`: in round 1, `core.openHouse()`
   then `openTray('play')` (say so in the prompt: "Play inside").
5. **Scenic spots.** lookout: first visit awards a decoration/recipe (choose from existing items) with a toast; hidden
   garden: a daily pearl; reading bench: pets sit beside you (petIdle 'sit'); dock end: pets watch the stream; hideaway under
   the big tree: a sleepy curl. One-time rewards in `st.hub.found = {}`.
6. **Save.** Extend `sanitize` in 04-state.js with `s.hub` defaults (x, y, lv, inside, plots, cook, up, found) with bounds.
7. **Test** (write `tests/hub-loops.js`): plant → advance game time → water → harvest lands in the pantry; cook → wait → collect;
   feeding in town changes `st.food` as the room would; the lookout reward is given once; `st.hub` round-trips through
   `serialize`/`sanitize`; no page errors. If the core isn't in the build yet when you test, drive your functions directly.

## Done means
Each worker: file(s) written, your harness screenshots looked at, your test passing (`node tests/<yours>.js`), a short
report (what's built, numbers, what you couldn't do and why). Do not commit. The lead integrates, runs everything on the
full build, screenshots the town on a phone-sized viewport, and ships.
