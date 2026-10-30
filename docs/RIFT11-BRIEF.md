# Rift 11 — The Choir Before Creation: build brief

The user's design is `docs/rift11-spec.md` (follow it faithfully: names, colours, monsters, the three challenges, the
three bosses and their mechanics). The plan entry exists in `src/js/21b-rift-ui.js` (`id: 'choir'`, n 11, lvl 95; its
sigil there says 'Note' — the spec says **Rhythm**: change it to 'Rhythm'), gate anima `leo` "The Crown Chase"
(Cooperative tag), and the world-map node is drawn (`23b-world-map.js`).

**The model to follow is Rift 9, just finished and loved by the user — especially its bosses' detail, shading and
models.** Read `docs/RIFT9-BRIEF.md`, the Rift 9 sections of `docs/NOTES.md` (search "Rift 9"), and the Rift 9 files:
`src/js/20zt2-rift-09-basilica.js` (core: palette, lands, props, brood, minis, shared mechanics with an API block at the
top, arenas handed to the bosses, liveCap/typeShare/monCount/miniDmg tuning), `20zt-rift-09-stages.js` (the three
challenges), `20zu-rift-gate-libra.js` (the gate), `20zv/20zw/20zx-rift-fiend-basilica-*.js` (the bosses), and their tests
(`tests/_bas-smoke.js`, `_bas-mech.js`, `rift-bas-stages.js`, `rift-bas-gate.js`, `rift-bas-cap.js`,
`_boss-anim-basilica-*.js`). Mirror their structure.

## Files (alphabetical load order: core before stages' use, gate, bosses; all after 20zx and before 21)
- `src/js/20zy-rift-11-stages.js` — `const CHO_STAGES = { SCORE, BREATHWORKS, HELDNOTE }`.
- `src/js/20zy2-rift-11-choir.js` — the core: `const CHO = {}` palette (#341C2F maroon, #D9C9A5 bone, #A58A4E tarnished
  gold, #DA8F86 coral) + helpers with an API block at the top; three lands (circular plates linked by short bridges over
  darkness; giant hollow pipes curving overhead in three silhouettes — straight columns, low arches, large spirals —
  their openings pulsing with soft light so the cavern breathes; bone horns; no audience, no humanoid choir); the brood
  (`bellmite`, `pipeeel`, `hushmoth` per the spec; the moth's silence is a local pad effect only); three evil-Cocopet
  minis; `defRift({ id: 'choir', n: 11, ... lvl: 95, sigil: 'Rhythm', aff: ['wind', 'dark'], gate: { anima: 'leo', name:
  'The Crown Chase' } })` with the same tuning as Rift 9 as it now stands (ease 0.55, monEase 0.35, miniDmg 0.7, miniHp
  0.294, liveCap 60, monCount 0.65, and a typeShare for the most punishing type if one emerges), three sections
  (I: fight + SCORE + Tammor 'The Drum Chamber' | II: fight + BREATHWORKS + Veyra 'The Pipe Bridge' | III: fight +
  HELDNOTE + the Heart 'The Resonating Bowl'), the boss arenas built in the stage `make` and handed to the bosses via
  `X.rift.self.mod` (Tammor: 28 m chamber, three numbered concentric rings; Veyra: 32×28 m platform, three horn mouths
  on the far edge, three shelter wedges near the centre, a low arch to cling to; the Heart: 36 m circular floor in four
  quadrants with embossed symbols, four great curved horns outside its edge pointing in, drum pads for the Unfinished
  Chord), the SEALING (Rhythm Sigil), and the seal reward: a small bell accessory (necklace) whose cosmetic chime can be
  muted (a toggle on the accessory / in Settings). Decorative pulsing (pipe mouths, the arena rings' heartbeat) respects
  Settings → "Fewer effects" (`st.lowFx`) as its reduced-motion option; never shake the camera for the heartbeat.
- `src/js/20zz-rift-gate-leo.js` — the Leo gate "The Crown Chase", cooperative tag (model `20zu`, `20zp`): a heavenly
  sun-court; the pet chases a golden crown-bearer lion cub spirit that darts round the court; Michael's (Leo, heaven,
  gold, citrine) motif; catch it three times as it gets quicker and starts using decoy afterimages; 3–5 minutes.
- `src/js/20zz1-rift-fiend-choir-1.js` Tammor the Living Drum (id `tammor`), `20zz2-rift-fiend-choir-2.js` Veyra the
  Throat of Night (id `veyra`), `20zz3-rift-fiend-choir-3.js` The Heart That Hears (id `heart`) — **the Rift 9 bosses are
  the art bar** (and NOTES "BOSS ART STANDARD"): many parts in depth order, a 3–4 tone ramp per material, tube/sphere
  shading, faceted plates, hot edges, a clear focal point, never still, wind-up poses that telegraph every attack,
  stagger and death, artPoses for the anim test; screenshot every pose and look.
- Tests: `tests/_cho-smoke.js`, `tests/_cho-mech.js`, `tests/rift-cho-stages.js`, `tests/rift-cho-gate.js`,
  `tests/_boss-anim-choir-{tammor,veyra,heart}.js` (game-time waits: the headless page runs at ~5 fps); add the
  non-underscore ones and the anim tests to `runbat.sh`. `tests/path-order.js`: Rift 11 is now built (update its checks).

## Adapting "the pet holds while the handler fights"
In this game the player IS the pet (there is no separate handler or pet Hold/Recall command). Where the spec says the
pet holds a pad while the handler fights, make it: standing on the pad charges it; leaving pauses (never erases) the
charge; the charge pad has a short "latch" (charge keeps trickling 2 s after you step off) so you can step out to swing
at a monster. Where it says "command the pet to the pads", the player walks there.

## Rules (as for Rift 9)
- Hostile warnings keep the game's red-orange; decorative light is soft and unoutlined. Audio always has a visible
  equivalent (beats shown as lights/numbers/countdown borders).
- Never frame-perfect timing; every beat is previewed; a safe option always exists.
- Build with your own file name: `python3 src/build.py --test-only test-<name>.html`; run tests with `HTML=test-<name>.html`.
  If `__pp` never appears it's a syntax error: extract the big script and `node --check` it. Beware a trailing `// comment`
  on a one-line function: it comments out the rest of the line.
- Do not commit.
