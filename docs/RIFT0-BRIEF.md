# Rift 0 — The Blackfire Caldera: build brief (the lead plus five workers)

- **Spec:** `docs/rift0-spec.md`. Read all of it: it is the user's own design and it wins over this brief where they
  differ (except the art rule below).
- **The user's words:** "Build this all on the gpu, I want advance beautiful graphic and high level details and effects.
  It will take place of the Ember Wastes on the map. It will be renamed to The Blackfire Caldera. I want the bosses to be
  in real 3d and high level details like Beast Machine and Jaws." and "use the same team you used to build jaws and beast
  machine".
- **Art rule (firm):** the user showed reference pictures of another company's characters. Nobody on the team uses them.
  Every creature here is an **original design built from the spec's own words** (Fire Flan: a heavy amber-red gel with
  trapped ash, rising bubbles and a molten core moving inside; Bomb King: a floating living iron bomb, riveted, rune
  engraved, a crown of short metal projections round a thick ember fuse, plates round a central molten eye, **no face, no
  mouth, no teeth, no painted smile**; Ifrit: a huge humanoid of basalt plates over a molten core, two rough obsidian horns
  with red-hot edges, heat from the jaw, shoulders and plate seams, clawed stone hands). Do not add a flame mane, swept
  bladed crests, toothy grins or any other borrowed signature; when in doubt, simpler and more geological.

## How Rift 0 sits in the game (decided by the lead)
- Plan entry (the lead adds it in `21b-rift-ui.js`): `{ id: 'caldera', n: 0, zero: true, name: 'The Blackfire Caldera',
  lvl: 1, region: 'The volcano', sigil: 'Ember', gate: null, icon: 'caldera' }`, open from the start, its seal kept apart
  from the twelve (`sealCount` ignores it), no constellation gate, never unlocks Rift 1 (Rift 1 keeps its rule).
- **Six stages**, built with `riftSections` patterns:
  - I `['trial', 'boss']`: **The Ashen Hollows** (combat + Puzzle 1, the Frozen Causeway) → **Fire Flan** (`calflan`).
  - II `['trial', 'boss']`: **The Runebound Foundry** (combat + the bomb-return tutorial + Puzzle 2, the Three Rune
    Rings) → **Bomb King** (`calbomb`).
  - III `['trial', 'boss']`: **The Heartward Descent** (traversal and combat, no puzzle) → **Ifrit** (`califrit`), which
    seals the rift (`seal: true`, `Rf.sealing`).
  - A trial is drawn like a puzzle stage (`layout`, `legend`, `make`) and fought like a dungeon. The stage checkpoint
    system already gives "a wipe restarts the stage, never the dungeon" and preserves cleared stages.
- **Level 1.** `defRift({ id: 'caldera', n: 0, lvl: 1, ... })`. Tune with an ordinary level-1 starter pet
  (`quickStart`). The spec's numbers (damage reduction %, timings, caps) are the targets. Bosses: use `hpK` / the
  fiend's `dmgK` and `Rf.ease` so each boss fight lasts about its spec time for a level-1 starter that uses the
  mechanics (Flan ~2 min, Bomb King ~2.5, Ifrit ~3.5), and ordinary attacks alone are inefficient but never a hard lock.
- **Interaction in this game:** the player IS the pet. "Interact" = stand still beside an object for 0.75 s (the rift
  objects' channel: `H.obj({ use })`, a progress ring is drawn). "Return a bomb" = **hit the grounded bomb with any
  attack** during its safe window; it flies (with aim assist) to the boss / nearest valid target and bursts there; it can
  never hurt the pet. Use exactly this in the foundry tutorial and in Bomb King's arena.
- **Recovery:** lava contact = modest damage and a push back to the last safe edge (never instant death); falls in the
  Descent return to the last ledge with a modest penalty. Checkpoint + a small recovery station (a heal pickup or
  shrine) before each boss: that's the end of each trial (heal the pet when the trial's exit is taken, or place drops).

## Files and owners (alphabetical load order puts stages before the core, both after `20zz3` and before `21`)
| Who | File | Owns |
|---|---|---|
| **C** (core) | `src/js/20zz5-rift-00-caldera.js` | `const CAL = {}`: palette, helpers with an API block at the top; the lands (biomes: `ashen`, `foundry`, `heartward`, and the three boss arenas' land `calderapit` or as you see fit) with floors, walls, gaps (lava), bridges, props (black fire crystal clusters, frost wells with the snowflake emblem, distant lavafalls, basalt columns, forge machinery, chains, pressure vessels), ambient embers; the **brood** (MON + painters + AI): `cinderslug`, `basaltcrawler` (frontal plates, glowing rear: frontal hits reduced), `emberwisp`, `furnaceimp`, `runicsentinel` (shielded front, exposes a rune after its attack), `bomblarva` (lands, flashes, explodes after a readable countdown; returnable as above), `ashenknight`, `crystalwisp` (one marked beam); the shared lava-contact rule; `defRift` with the six stages, tuning, `SEALING` (Ember Sigil), the seal reward (a beginner fire-themed accessory or cosmetic material through the existing accessory system), `Rf.everyStage` (embers, crystal pulses toward the heart); boss stages get `make: (X, self, H) => CAL.bossMake[S.boss] && CAL.bossMake[S.boss](X, self, H)` so each boss file owns its arena. Also `CAL.returnBomb(...)` / `CAL.frostWellArt(...)` helpers the others may reuse (publish the API early in the file's header; others may copy instead of waiting). |
| **S** (stages) | `src/js/20zz4-rift-00-stages.js` | `const CAL_STAGES = { HOLLOWS, FOUNDRY, DESCENT }` (every CAL use inside `make`): the three hand-drawn trials with their packs, hazards, the two puzzles exactly as the spec authors them (Frozen Causeway: five rotatable pieces, flow shown through each, split flow, both basins at once latch the bridge; hint after a delay; no enemies during the first attempt. Rune Rings: three rings Eye/Chain/Crown, levers A/B/C with physical lines to their two rings, highlight on approach, Reset, unlimited tries, "Show next move" computed by BFS from the current state), the bomb tutorial pack, the Descent's vents (glow+hiss, one safe demo first), ledges, final overlook; each ends at its exit with the recovery station. |
| **F** (Fire Flan) | `src/js/20zz6-rift-00-flan.js` | The `calflan` fiend (`RiftFiend.define`, `phases: 3, cuts: [1, 0.7, 0.35]`) and `CAL.bossMake.calflan` (its arena: circular basalt, three frost crystals in wells with cooling zones and interaction plates, integrity and recharge shown only when relevant). The **real-3D model in GLM** (materials ids **80..84**, inside the `/*<CAL-FLAN-MAT>*/` markers of `src/js/20k5uz-gl-mesh.js`): translucent amber-red gel with depth, trapped ash, rising bubbles, the molten core moving inside, wobble and squash with weight, the brittle chilled state (pale, cracked, core visible), phase 2 lobes, phase 3 taller and more transparent with steam. Cinderlings (2 max). All of the spec's mechanics and numbers. |
| **B** (Bomb King) | `src/js/20zz7-rift-00-bombking.js` | The `calbomb` fiend and `CAL.bossMake.calbomb` (three basalt blast shelters with marked safe sides). Real-3D GLM model (ids **85..89**, `/*<CAL-BOMB-MAT>*/`): heavy weathered riveted iron, engraved runes that tighten and glow, heat-discoloured edges, glowing seams, the crown of short projections round a thick ember fuse, plates that breathe and part round a central molten eye, venting (plates separate, core exposed, settles lower). Larvae bombs (2 max grounded), Royal Volley, Iron Orbit, the 7 s detonation with both answers, no death explosion. |
| **I** (Ifrit) | `src/js/20zz8-rift-00-ifrit.js` | The `califrit` fiend and `CAL.bossMake.califrit` (circular basalt platform, lavafalls around, two black-fire crystal growths with tethers, two frost wells with the same snowflake emblem). Real-3D GLM model (ids **90..96**, `/*<CAL-IFRIT-MAT>*/`): basalt plates, molten core showing through seams, obsidian horns with hot edges, clawed stone hands, the throne he rises from, phase 3 armour fracturing away and fire streaming up from the shoulders, the dark inert statue at the end. Titan Fist, Cinder Breath, Fault Line, Burning Cleave, falling rocks, Hellfire with the frost refuge and the overheat kneel. Rift sealing after him. |

The **lead** (me): the plan entry and its plumbing (`sealCount`, `towerCap`, Rift 1 unaffected, UI ordering), the world
map (the Ember Wastes become The Blackfire Caldera's landmark), integration, review, balance passes, release.

## Precedents to mirror
- **Rift 11** (`20zy-rift-11-stages.js`, `20zy2-rift-11-choir.js`, `20zz1..3-rift-fiend-choir-*.js`, `docs/RIFT11-BRIEF.md`)
  and **Rift 9** for structure: lands, brood, trials (`make` returns `{ update, drawGround, drawOver, goal, hint, cam }`,
  `H.obj`, `H.setExit`, `H.spawnPacks`, `X.warn`, `X.eshot`, `X.hurtPet`, `X.banner`, `X.after`...), boss stage `make`
  handing arena data to the fiend via `X.rift.self.mod`, `RiftFiend.define`, SEALING. NOTES "BOSS ART STANDARD".
- **The fiend engine** `20h-fiend-core.js`: `FX.tele / hz / obj / weak / parts / minion / slam / fan`, `dmgK`, `phase`,
  `ai`, `stunned`, `ending`, `camFocus`, `draw`, `drawFx`.
- **GLM real-3D models**: `20k5uz-gl-mesh.js` (builder primitives `box ell facet crystal spike sph tube tor torX/Y/Z
  lathe surf prism`, `render(W, H, S, items)`), and the way **Fenrir** (`20k8m`, `mkView`, `glPass`, `drawFallback`,
  `drawShadow`) and **Jaws** (`20k7m`) build meshes once, pose rigid parts each frame and draw the GLM canvas into the
  2D frame, with a 2D fallback when WebGL is missing or software. Materials are GLSL branches in GLM's fragment shader:
  add yours only between your markers (use Edit with your marker line as the anchor; afterwards `grep` that your block
  is still there, since others edit the same file — redo it if it was lost).
- GPU effects in 2D frames: the FGFX painter (`NIDHOGG_MOVES.FGFX`, `X.gq()` / dungeon `dqBegin`) for fire energy,
  glows, beams, smoke (Nidhogg's fire kinds look right for lava and flame).

## Standing user rules
- Performance: iPhone and a 2019 iMac. Bake meshes once; pool particles; `st.lowFx` cuts decoration only, never
  hazards, timers, weak points or interaction cues. GLM at reduced resolution on software GL; a 2D fallback always.
- Hostile warnings keep the game's red-orange; frost uses white-blue with the snowflake emblem and a chime; never
  colour-only (shape, label, sound too). Telegraphs 1.5–2.5 s early, longer for signature blasts; no unavoidable wipe;
  no surprise death explosion.
- Effects must read on light floors (dark under-layers where needed). Soft water/glow edges, no hard rims on glows.
- Never put reference art in the repo. Git: never commit, never push, never touch `test.html` / `pocket-pet.html`.
  Build your own page: `python3 src/build.py --test-only test-cal<C|S|F|B|I>.html`; run tests with
  `HTML=test-cal<X>.html`.
- **Keep the shared build working:** every file is concatenated into one script, so a syntax error in yours breaks
  everyone. Write your file outside `src/js` first if you like; whenever it is in `src/js`, it must pass
  `node --check` (run it after every edit). Never edit another worker's file; ask the lead in your final report for
  anything you need changed there.
- Screenshot every boss pose / stage state you make and look at it before calling it done (`docs`-style art bar:
  Jaws, Beast Machine, the Rift 9 and 11 bosses).
- Tests: each worker adds its own under `tests/` (`_cal-<x>-*.js`), game-time waits (the headless page runs slowly).
- In your final report: what you built, how it plays (times measured with a level-1 starter), screenshots' paths,
  open issues, anything the lead must wire.
