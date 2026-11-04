# Pink Light Strongs — brief (all ten)

The user's full spec is `docs/elem-spec/light-strongs.md` (verbatim; read your two sections and its "Art direction and shared
quality" part carefully). House rules, palette and lessons: `docs/LIGHT-PINK-BRIEF.md` and the header of
`docs/LIGHT-PINK-BRIEF-2.md` (no hard edges anywhere — feather every end; solid cores under additive glow; never a box cut out
round the pet, dim smoothly; no flat sprite clutter; smooth alive motion; cached sprites, no shadowBlur/filter, particles
via H.n()/H.Q(); GAME clock f.t for timelines; everything cleaned up).
Reuse the shipped pink pieces: `globalThis.LU1` (exported by 20k4b: `thickHeart(c,x,y,hp,spin,lean,a,lit,rimU)` — the thick
spinning heart, `smallSpr(col)`, `starSpr(col)`, `lineSpr()` (glowing heart outline), `glowC`, `blitC`, `bits()` heart/star
particles, `setH(H)`); see 20k4j (Aphrodite's Beam) for how to use them. Copy other helpers rather than editing shared files.
The spec's palette (#FF69B4, #FFB7D5, #D94B91, #FFF0F7, #D8B4FF, rose-gold #E8AFB8) is close to the shipped one; either is
fine, pink dominant. "H" in the spec = the pet's standing height ≈ 0.9 tile on screen.

This is a 2D canvas game (no 3D meshes/shaders): "3D" = cached shaded sprites, thickness bands, squash by |cos| for turns,
moving highlights — as the shipped ults do. Say so honestly in your report where the spec assumes engine features.

## Rows (already set in `src/js/20k1-elem-core.js`, ELEM_MOVES.light.strong; keep cost/cd)
honeyheart (was prismpetal), luvchain (was dawnspear), lovemirrors (was halo), lanternfall (kept key, rebuild in place),
loveshock (was stitch), lovebombs (was mirrorwing), eternallight (was sunseed), sweetheartstamp (was lucentwheel),
ribbonrendezvous (was chime), sugarrush (was starpoint).
In your file: `const S = ELEM_IMPL.light.strong; delete S.<old>; S.<new> = (C, H) => {...}` (lanternfall: just reassign).
Palace of Mirrors (old ult `U.mirrors` in 20k4-elem-light.js, already removed from the ult list) becomes the Strong Love
Mirrors: read its old code for the ricochet + downward-finale mechanic; leave the old file alone.

## Strong conventions
- A Strong's cast ~1–2.5 s (Love Shock's spheres bounce 3 s by spec; Love Mirrors ~2.5–3 s by spec).
- Damage: Strong totals ≈ 2–3 × C.base × C.K × evoK, where evoK = 1 + 0.08 × (evo − 1) (ELEM_STRONG_MULT ×3 is applied to
  C.base already by the kit — check how an existing reworked strong, e.g. src/js/20k8g-ice-strong-1.js or 20k7f/20k7g,
  computes its damage and match it). Split over the pieces; one hit per piece per target as the spec says.
- Counts per level exactly as the spec's progression table; Levels = C.evo 1..7; discrete counts hold until their breakpoint
  (4, 7); continuous size/richness interpolates.
- Sugar Rush moves the real pet: find how existing dash Strongs move the pet safely (grep `dash`/`me.dash`/`leap` in 20b and
  the elemental kits) and use that; never through walls; release movement control on interruption/cleanup.
- Ribbon Rendezvous roots: use the existing slow/bind/root helpers in H (bind, slow) and their resistance rules.

## Workers / files (one new file each; do not touch the others' files or shared files)
- A: `src/js/20k4k-light-strong-1.js` — honeyheart, luvchain
- B: `src/js/20k4l-light-strong-2.js` — lanternfall, lovemirrors
- C: `src/js/20k4m-light-strong-3.js` — loveshock, lovebombs
- D: `src/js/20k4n-light-strong-4.js` — eternallight, sweetheartstamp
- E: `src/js/20k4o-light-strong-5.js` — ribbonrendezvous, sugarrush

## Checking
`python3 src/build.py --test-only test-<you>.html` (never test.html; never commit/push). `HTML=test-<you>.html ELEM=light
ONLY=<k1>,<k2> SHOTS=1 SHOT_MS=750 SHOT_MS_ULT=1700 EVO=1 node tests/elem-moves.js`, and EVO=4, EVO=7 — must pass. Paused
screenshots at exact game times: copy /tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/ray/shot.js
(args KEY EVO times prefix; it looks the move up as `ELEM_LIST.light['ey_' + key]` — change to `'ex_'` for a Strong, and set
its HTML path; UNDER=1 puts the pet behind). Work in `.../scratchpad/<you>/`, make a montage `<you>/m.png` (rows = levels
1/4/7). Delete your test page when done. Report in a few lines: what each move does per level, damage, test results, montage path,
anything from the spec you couldn't do.
