# Jaws: 11th Water ult (the lead plus the Fenrir and Belladonna team)

- **Spec:** `docs/elem-spec/water-jaws.md`. Read all of it; it is the user's own text and it wins over this brief.
- **Concept sheet:** `/mnt/user-data/attachments/78d1fddd-217b-590c-9262-fa063f90a263/60ee4873-image.png` (top: Jaws,
  the shark form; bottom: Leviathan, the siege form). The user's own design. Reference only; never copy it into the
  repo.
- **Method (the user's instruction):** "use the same team and method as belladonna". The lead writes the base model and
  the transformation blockout and leads the animation and effects; M, A, E and H support. Everything in real 3D on the
  GPU, effects included, with 2D fallbacks.
- **"Update the existing Jaws":** no Jaws ability exists in the game (Water has ten ults; the old "Leviathan's Ribbon"
  is unrelated and long deleted). Jaws is therefore the **11th Water ult**, key `jaws`, kit key `ey_jaws`, unlocked by
  `ELEM_ULT_LV`'s 11th entry (80). There is no saved progression to migrate. The roster row is added by the lead when
  the core lands (a row without an implementation must not ship).

## Fixed numbers (the spec's)
- Duration, shared by both forms: **30 s base, 45 s Adept, 60 s Celestial**. Outer cooldown **150 s**, set once when
  normal control returns. At most **3** Tidal Pools. **One** Shark Attack per summon.
- Provisional cooldowns: Water Ray / Depth Charge slot 2 s, Rolling Wave / Maelstrom slot 4 s, Maw / Hydrojet no extra
  cooldown after recovery. Shared per slot across forms; a form change never readies the paired move.

## Files
| Who | Role | File |
|---|---|---|
| **Lead**, with **M** in support | `JAWS_MODEL`: one part set, both forms, the transformation, pose channels, anchors, drawn with `GLM` and M's cel materials (ids 30..35, `S.outline`) | `src/js/20k7m-water-jaws-model.js` |
| **A** | `U.jaws`: session, Nidhogg-style flight for the shark, anchored aiming for Leviathan, Anchor / Release, Maw, Hydrojet, the menu and the extra form button, timers, gauge, the pool registry (create, refresh, replace, claim, consume), cleanup, the animation layer | `src/js/20k7n-water-ult-11.js` |
| **E** | `JAWS_MOVES`: Water Ray, Rolling Wave, Depth Charge (plain and empowered), Maelstrom, Shark Attack, the pools' look, Maw's and Hydrojet's effects, the summon, the anchor halo, the exit, sound; real 3D on the GPU with 2D fallbacks | `src/js/20k7o-water-jaws-moves.js` |
| **H** | `tests/jaws.js` (the spec's verify list), the balance audit, anything asked in Notes | tests and Notes |

## Precedents
- **Belladonna** (`20k5ya` / `yb` / `yc`, `docs/WIND-BELLADONNA-BRIEF.md`) for the method, the self-framing camera, the
  3D GPU effects layer and the test's shape. **Fenrir** (`20k8m` / `n` / `o`) for a two-form session with one timer,
  one gauge, shared cooldowns and a contextual menu. **Nidhogg** (`20k6g`) for flight. **Sports Car** (`20k4p`) for
  Drift, which Maw's thrash follows. `camPick` and the VEH hooks in `20b`; `VEH_SMASH` in `20k0v`.

## Decisions already made
- **Size:** the hull, nose to tail root, is the Sports Car's length (about 3.2 tiles); with the tail about 5.
- **Flight:** the shark flies freely like Nidhogg, Susano O's airship and Belladonna (over walls, gaps, water, off
  the map within the flight volume, safe return). Leviathan holds position and altitude; the stick turns the hull.
- **Camera:** the form frames itself (`k > 0`, centred on the model's `center` anchor), so `camPick` gives it the
  camera on rift and fiend floors.
- **The pet** rides in the open cockpit in both forms, drawn by the core with `X.drawPetAt` at `anchor('seat')`,
  upright, never yawed, always visible.
- **Environment:** every attack breaks props through `VEH_SMASH` (the user's standing preference); doors and bridges
  are protected.
- **Tidal Pools** are owned by the core: a registry of at most three records `{ id, x, y, r, born, state }` with states
  `available`, `claimed`, `consumed`; the moves ask the core to create, refresh, claim and consume. Pools are visual
  surfaces only: no terrain, navigation or collision change, no damage, no gauge charge.
- **The extra form button** (Anchor / Release) sits beside the combat menu, small and labelled, with a key (`F`), the
  controller's spare face button if the game maps one, and touch.
- **Shark Attack** works from either form with any number of pools; from Leviathan it folds back to the shark during
  the approach. Its sky beam and the jaw closure are **two authored damage events** (the spec gives the beam "massive
  damage" and the closure "one colossal AoE Water damage event per eligible enemy"); each hits an enemy once;
  `noCharge`.
- **Balance (provisional, H audits):** normal moves near Fenrir's and Belladonna's; the empowered Depth Charge about
  2.5x the plain one; Shark Attack's total near the other finishers (95 / 115 / 125 DK); Dark Messiah stays first.

## Art direction (the lead's)
- **Cel shading with an outline** (M's ids 30 cobalt paint, 31 chrome, 32 dark steel, 33 reactor cyan, 34 tooth, 35
  canopy; `S.outline` on). Cobalt blue and polished chrome dominate; cyan is restrained and reveals structure.
- **The shark swims the air:** tail strokes travelling down the links, the body flexing a little against them, fins
  trimming, banking into turns, the jaw working on attacks.
- **Leviathan is heavy:** it settles, locks audibly, recoils as one mass, its stabilisers tilt on Hydrojet.
- **Water effects** in 3D on the GPU: layered blue depth, translucent turquoise edges, readable foam, shaped
  highlights, dimensional spray; enemies and boss telegraphs stay readable under them. Feathered glows, no hard rims
  on glows.
- **Never** cover the pet's face, except the finisher's brightest beats.

## Standing user rules
- Performance: iPhone and a 2019 iMac. Pool particles. Low effects cut decoration only, never hits.
- No motion-blur ghosts. Timers as deadlines on the game clock. One damage path in the core (`ctx.hit` / `ctx.hitArea`)
  that charges the gauge (after mitigation, no overkill) and smashes.
- Never put reference art in the repo.
- Git: never commit, never push, never touch `test.html`. Build your own page with
  `python3 src/build.py --test-only test-jaw<M|A|E|H>.html`. Use Edit on shared files, never whole-file rewrites.

## The model's API (see the file's header and `blankPose()`)
- `JAWS_MODEL.create()` → `{ pose, draw(c, x, y, z, a, P, o), drawShadow(...) }`; the heading `a` turns the model.
- Channels: `xf` (0 shark .. 1 Leviathan), `alpha`, `swim` (phase, radians), `swimK` (stroke size, 0..1), `jaw` (0..1
  open), `cannon` (0..1 extra extension), `recoil` (0..1), `bank`, `pitch`, `fin`, `tail`, `glow`, `charge` (mouth
  glow), `breath`.
- Anchors: `seat`, `center`, `mouth` (the muzzle), `breech`, `forward`, `head`, `snout`, `reactor`, `belly`, `gillL`,
  `gillR`, `finL`, `finR`, `dorsalTip`, `tailTip`, `jet`.
- `window.__pp.jaws` is the model in test builds; `window.__JAWS_GL = 1` forces the GPU model under software GL.

## M's cel materials (from M's report)
- ids 30..35: second attribute `vA.y` = 1 at a panel line or a plate's edge (darkens from about 0.82; 0.55..0.8 beside a
  line allows paint chips); third attribute `vA.z` = 1 sound paint, 0 worn to bare metal (id 30 only).
- 33 reactor cyan assumes the part's long axis is its local x; `S.t` drives its flow, the item's `glow` its brightness.
- 35 canopy is opaque dark-blue gloss. Item `spill` adds the cyan bounce to 32 and 35; item `wear` scales chips on 30.
- `S.outline` = thickness in pixels of the rendered image (about 1.4 px reads well at a 40 px tile; scale it with the
  render scale); `S.outlineCol`, `S.outlineBias`; per item `outline: false` opts out; needs smooth normals.

## Notes (dated entries; ask each other questions here)
