# Water Ultimates: brief (round 1: five new Ultimates only)

The user plays Cocopets on an iPhone 17 (Chrome, the Claude-hosted build) and a 2019 iMac. After the fire, lightning and
ice reworks (which they love) they asked for five new **Water Ultimates**, element key `water`. Their design, verbatim:
`docs/elem-spec/water-ults.md` — follow it closely, including every level 1 / 4 / 7 detail and every number. The data rows
are already in `ELEM_MOVES.water.ult` (src/js/20k1-elem-core.js): **mayhem, lotusbloom, aquaillusion, tsunami, rhapsody**.
Do NOT touch the Strong attacks or the other Ultimates (monsoon, jellyfish, leviathanribbon, returningsea, rainmaker stay).

The user is short on budget this week: work efficiently — build carefully once, check with a few well-chosen paused
screenshots at levels 1, 4 and 7, fix what you see, and stop when it is genuinely good. No endless polishing loops.

## The bar
**Catastrophe** (`src/js/20k8f-ice-ult-5.js`, `U.catastrophe`) is the user's favourite: "looks absolutely amazing, this is
what we should aim for" — sky beams with cached spiral columns, foot swirls, screen-wide particles, a cold dimming,
light-only floor traces, cached sprites so it stays cheap. Also see the ice kit `src/js/20k8a-ice-kit.js` (IK) and the
lightning kit `20k9a-thunder-kit.js` (TK) for the house style of shaded translucent shapes, glows and particles. Water's
look (the user): deep sapphire interiors, translucent turquoise surfaces, bright aqua edges, moving reflections, white foam
where it breaks; bubbles with transparent centres and pearlescent rims; large shapes establish the spectacle, droplets,
spray and glowing particles follow their movement.
Lessons from earlier rounds: abstract luminous translucent forms beat detailed creature models; nothing flat/blobby; no dark
marks left on the floor (only fading light/water sheen); cheap for an iPhone (cache sprites; no per-frame gradient creation
in loops; no shadowBlur/filter; particles via `H.n()` / `H.Q()`); never cover the pet (fade near it); everything cleaned up.

## Tools
- The toolkit H: `src/js/20k1-elem-core.js` (`create`): hitArea/Line/Cone/Ring, pull/push/slow/lift/bind, warn* (pet
  warnings are no longer drawn — skip them), P/burst particles, glow/core/ribbon helpers, sx/sy world→screen, GY floor
  squash, ease, fade, n(k), Q(); `H.X` (light, shake, flash, sfx, ring, boom, hitMon, nearestMon, after, hitstop, heal…).
  Bosses must never be locked/moved for long (`m.boss`).
- NOTE: the runner calls `draw`/`drawUnder` with the GAME clock as `t`; timeline logic inside a draw must use `f.t`.
- Evolution: `C.evo` 1..7 (1 Hatchling, 4 Adept, 7 Celestial). Damage total ≈ `C.base × 12–16 × C.K × (1 + 0.08 × (evo − 1))`
  split over the pieces (Mayhem and Tsunami at the top). Rhapsody heals instead of (or as well as) a light touch of damage.

## Files
Each worker writes ONE new file that loads after `20k7-elem-water.js`:
```js
/* ---------- Water, reworked: <moves> ---------- */
(() => { const U = ELEM_IMPL.water.ult; /* U.<key> = (C, H) => { ... } */ })();
```
The worker with `20k7b` also deletes the removed Ultimates: `for (const k of ['deeppalace','koispiral','moontide',
'shellocean','whirlgalaxy']) delete U[k];`.

## Checking
- Build your own page: `python3 src/build.py --test-only test-<you>.html` (never test.html; never commit). If `__pp` never
  appears it's a syntax error: `node --check` the extracted script; beware a trailing `//` comment on a one-line function.
- `HTML=test-<you>.html ELEM=water ONLY=<keys> SHOTS=1 SHOT_MS=750 SHOT_MS_ULT=1700 EVO=1 node tests/elem-moves.js`, again at
  EVO=7 (and 4 if needed). Take a few paused screenshots at exact game times through the cast and look at them.
- Other workers run at the same time: run tests one at a time; scripts in
  `/tmp/claude-0/-home-claude/78d1fddd-217b-590c-9262-fa063f90a263/scratchpad/<you>/`; never pkill others.
Report briefly: your file, what each move looks like at 1 / 4 / 7, the test output.
