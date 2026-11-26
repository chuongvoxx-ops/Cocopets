// v460 R3: writes shots/v460-R3/report.md from the narrative below and the measured tables in shots/v460-R3/runs/
// (table-before.md, table-ab.md, table-same.md: tests/_r3-abtable.js and the same-page runs). usage: node tests/_r3-report.js
const fs = require('fs'), path = require('path');
const D = path.resolve(__dirname, '../shots/v460-R3'), T = n => fs.readFileSync(path.join(D, 'runs', n), 'utf8').trim();
const md = `# v460 R3 — Rift 03 (The Mouth Beneath the Dunes): route, boss balance, performance (spec parts 6–8)

## v462 R3b update (this supersedes the route and counts in §8 below)

The user asked to "bring back the grub mounds, but instead of 30, have it at 20 only".
* **Route (9 stages):** D1 The Buried Road → P1 The Sandstorm Flight → B1 Sarrukh → D2 The Rust Flats → P2 The Echo Chamber → B2 Oneira →
  D3 The Moonlit Barrows → **P3 The Grub Mounds** → B3 Thul-Ammon → seal. Labels read Dungeon / Puzzle / Boss 1–3.
* **The Grub Mounds' "30"** is \`GRUBS_NEED\` (20r), the grubs to shoot before the sand goes still. It is now 20. The intro banner, the goal
  counter (n/20), the end banner ("Twenty grubs down") and the ready text read from it.
* Nothing else in the puzzle changed. It has no time limit and no reward of its own. Its pace (a mound every 1.3 s less 0.025 s per grub,
  a grub up 1.7 s less 0.02 s per grub, mantas from the 5th grub) runs on grubs shot, not on the target, so it simply ends sooner, before
  the fastest part of the ramp.
* **Saves:** layout version 3, and a new save starts at 3.
  * A v461 save (version 2, eight stages) keeps its number. Stages 0–6 are the same stages; 7, which meant Thul-Ammon next, now means the
    Grub Mounds, which is required again.
  * A v458 save (twelve stages) goes straight to its nine-stage checkpoint: \`0,1,1,2,3,3,5,5,6,7,8,8\`. Old 9 (the Mounds next) → 7;
    old 10 (the Mounds solved, the Throat of Sand retired) → Thul-Ammon (8).
  * The move runs once and grants no reward.
* **Files:** \`20r-rift-03-dunes.js\` (\`GRUBS_NEED\`, the section 3 pattern, the migration), \`04-state.js\` (new save \`ver.dunes: 3\`).
  Hunks tagged \`v462 R3b\`.
* **Tests** (test-r3.html):
  * \`_r3-route.js\` **77/77**. It plays the Grub Mounds by the hook: 13 mounds, not done at 19, done at exactly 20, banners say 20 and
    "Twenty grubs down". It also covers the 9-stage run, the labels, every v458 and every v461 checkpoint, and the bosses still ×3.
  * \`_dt-puzzles\` 4/4, \`_dt-counts\` 16/16, \`_dt-traps\` 49/49, \`_de-break\` 35/35, \`_de-smoke\` 20/20.
  * \`_da-fight\` GL=0 all ok, \`_db-fight\` thulammon QUICK=1 all ok.
  * \`rift-dunes.js\`: all 26 route, puzzle, boss and seal checks pass, including the Mounds at 20; it stops in the stale Amber Vigil part
    as before. Its first run under load failed 3 real-time checks (the flight's drift, the Echo Chamber's first notes); they passed on the
    re-run.
  * loadchk \`[] true\`.

Worker R3. Every production hunk is tagged \`v460 R3\`. Nothing committed, pushed or published. **No device test ran**: every number
below comes from headless Chromium with SwiftShader (a software GPU) on a shared 2-core box. Read the frame times as relative only.
They do not show what an iPhone or the 2019 iMac would get.

## In short

* **Route (8).** v458 played **12** stages: two back-to-back dungeons in every section (the Buried Road and the Tooth Courts; the Rust
  Flats and the Crystal Scar; the Moonlit Barrows and the Throat of Sand). Each pair shared the same land, brood, mini boss and kind
  of rolled floor, which is why Dungeon 1 and Dungeon 3 seemed to repeat. There were also three puzzles. It is now exactly
  **D1 The Buried Road → P1 The Sandstorm Flight → B1 Sarrukh → D2 The Rust Flats → P2 The Echo Chamber → B2 Oneira → D3 The Moonlit
  Barrows → B3 Thul-Ammon → seal**. That is 8 stages: 3 distinct dungeons in their 3 lands, 2 puzzles, 3 bosses. The labels read Dungeon 1–3,
  Puzzle 1–2 and Boss 1–3. Saves are migrated once, keyed by \`st.rift.ver.dunes = 2\` (a new save starts at 2).
* **Bosses ×3 (7).** Sarrukh, Oneira and Thul-Ammon now have exactly 3× v458's effective health and 3× v458's blows. This was measured
  in the same page against v458's numbers: every blow on them counts exactly 1/3, every blow of theirs is exactly 3×, and the bars and
  phase cuts are unchanged. Minions, mini bosses, monsters and traps are unchanged.
* **Performance (6).** I profiled before changing anything. The one problem specific to summons in boss fights: **while a six-star summon
  is out in a Rift 03 boss fight, the shared GLM canvas and its depth buffer were reallocated about 2 times every frame** (the boss's
  model pass and the summon's took turns resizing it). Without a summon the rate is 0–0.06 a frame. After the fix it is 0–0.13 a frame in
  all 9 boss × summon runs. The same frames are pixel-equal except 5–12 edge pixels. Nidhogg's tube rebuild also allocates ~0.3 MB less a frame
  (by construction). **On this software rasteriser the wall-time change is within noise.** The machine's load moved identical code by ±60%.
  So I do not claim an FPS gain. The switch \`window.__R3_OFF = 1\` restores v459's behaviour for an on-device A/B (steps below).

## 8. The route

What the code played (21b's \`startRift\` → 20m's \`riftDef\` / \`riftSections\` → 20r's \`stages\`):
\`f:Buried Road | f:Tooth Courts | p:Sandstorm Flight | b:Sarrukh | p:Echo Chamber | f:Rust Flats | f:Crystal Scar | b:Oneira | f:Moonlit
Barrows | p:Grub Mounds | f:Throat of Sand | b:Thul-Ammon\`. That is 6 dungeon stages and 3 puzzles. There were no duplicated entities or
stage objects (checked: monster lists do not grow, no two monsters share a spot). The "repeat" was the route itself.

Changes:
* \`src/js/20r-rift-03-dunes.js\`: \`stages\` cut to \`fight, puzzle, boss | fight, puzzle, boss | fight, boss\`. Each section keeps its first
  dungeon, with its land, brood, mini boss, traps and one random mod as before. The retired stages are kept by name only (\`retired\`), and
  the Grub Mounds module stays defined but is not played. Also: \`runLabels: true\`; \`RIFT_BY_ID.dunes.migrate\` and \`mapOld\`; the blurb's
  Grub Mounds phrase.
* \`src/js/20m-rift-core.js\` (\`riftStageLabel\`): \`Rf.runLabels\` numbers dungeons and puzzles through the whole run. \`riftStagePos\` is
  unchanged (the traps' density, the bosses' floors). The other rifts keep their per-section labels (tested on the Garden).
* \`src/js/04-state.js\` (shared, 2 small hunks): a new save's \`rift.ver.dunes = 2\`; \`sanitize\` calls \`RIFT_BY_ID.dunes.migrate\`, as for
  the Garden.
* Transitions, completion and rewards are the existing flow, unchanged: 21b \`riftFinish\` and the \`next\` / \`retry\` buttons. The last
  stage (\`seal\`) seals the rift.

**Migration (old 12-stage checkpoint → new):** \`0→0 1→1 2→1 3→2 4→3 5→3 6→5 7→5 8→6 9→7 10→7 11→7\`.
* Each move keeps what was done and skips nothing required. A retired stage moves on to what follows it.
* In section 2 the dungeon now comes before the puzzle. A run that had solved the Echo Chamber but not cleared the Rust Flats (4, 5)
  replays the Rust Flats, so Oneira is never reached early. A run that had cleared both (6) goes to Oneira.
* The migration runs once. It leaves seals, the gate and the Anima alone and grants no reward.

## 7. The bosses ×3

* **Health.** \`bossHpK: 2 → 6\` (20r). The bosses' effective health was already \`foeK.boss\`: every blow on the body counts 1/foeK.boss
  (\`dmgK\`), and every blow on a weak point counts its \`forward\` 2.4/foeK.boss. So both are now exactly 1/3 of v458's. The bar
  (\`maxhp\`, bars) is unchanged, so the percentage phase cuts fall where they did.
* **Damage.** A new \`bossDmgK: 3\` (20r), applied in 20m's \`riftDef\` to the boss's fresh \`riftFiend\` copy (\`fd.dmgK\`). Every attack the
  fiend owns is built from \`m.dmg\` (\`15 × … × FD.dmgK\`, 20h): its tells, sweeps, slams, shots (55% of m.dmg), ink pools (dps), the
  eruptions that call its brood, and contact. A fresh copy is made at each start, so a retry, a reload or a phase change cannot lay it twice.
* Unchanged: the brood it calls (MON stats), mini bosses, monsters (\`monHpK\`, \`miniHpK\`) and the rift's ×2 foe blow (\`foeDmgK\`), which
  applies on top as before. Traps never took \`foeK\`.
* One exception: Leo's Judgement (\`pierce\`) bypasses the armour factor by design (its three bars are three bars), so it is not ×3.

Measured (\`tests/_r3-route.js\`, same page; v458's numbers set back in-page, then v460's):

| boss | m.dmg v458 → v460 | a blow on the pet (with the rift's ×2) | a 10 000 blow on its body / weak point | bars, maxhp |
|---|---|---|---|---|
| Sarrukh | 94.5 → 283.6 | 189.1 → 567.2 | 5000 → 1666.7 / 12000 → 4000 | 28 bars, 915 576 (same) |
| Oneira | 103.9 → 311.7 | 207.8 → 623.5 | 5000 → 1666.7 / 12000 → 4000 | 31 bars, 1 044 963 (same) |
| Thul-Ammon | 113.5 → 340.6 | 227.1 → 681.2 | 5000 → 1666.7 / 12000 → 4000 | 32 bars, 1 238 016 (same) |

Effective health: Sarrukh about 1.83 M → 5.49 M, Oneira 2.09 M → 6.27 M, Thul-Ammon 2.48 M → 7.43 M.

Sarrukh's own blows (\`tests/_da-fight.js\`): Sand Wake 245.8 → 737.4, spat grain 94.5 → 283.6.

**A balance consequence to know (not a bug).** A level-32 pet with no gear has 464 HP. Its strongest boss blows are now larger than its
whole health: Sarrukh's Breach about 907, Oneira's Slam about 1060, Thul-Ammon's slam about 1022. They one-shot it unless dodged or blocked.
\`tests/_da-fight.js\` had to give the pet a deeper health pool to keep measuring.

## 6. Performance

### How it was measured
* \`tests/_r3-perf.js\` (survey) uses \`tests/_pf-lib.js\` counters (unchanged, apart from an off-switch for its own clip arithmetic, so the
  heap counter sees only the game).
* Settings: 390×844 at DPR 3, quality Balanced, every GPU path forced on as a phone takes it. The bosses and summons use the software
  rasteriser's 0.45–0.5× model resolution (HQ=0), because full-resolution GLM frames take seconds here.
* Scenarios, for each of the three dungeons: exploring (the pet walking, the camera easing), and crowd + traps (16 of the brood round the
  pet at the stage's densest trap cluster, the traps firing). Also each boss awake, and each boss with **Tiamat, Moby Dick and Nidhogg**
  cast in its arena. For each summon: the 6 frames after the cast (the spike), then 8 frames of its busy stretch. The summon was warmed
  first, as the loading screen does.
* "p95" over 8 frames is the worst frame.
* Also measured: the update alone (60 steps) and the dune traps' tick time; entity census (monsters alive and awake, traps live, shots,
  zones, particles, effects); GLM passes and canvas reallocations; heap growth; GL buffer and texture uploads; shader compiles; canvases made.
* Tools: \`_r3-cpu.js\` (CPU and allocation profile), \`_po-where.js\` (where a frame's area goes), \`_r3-same.js\` (same-page A/B and pixel
  compare with \`__R3_OFF\`), \`_r3-abtable.js\`.

### What the profile showed (before any change)
* **No earlier-room or duplicate entities.** A fight stage is one map of 7 rooms. Its ~110 monsters are spawned at the start, and the list
  does not grow over time or across stages. Each stage's traps, pictures and textures are let go when it closes (\`_de-break\`, \`_dt-traps\`).
* **The 222-monster Buried Road in the first survey** was a rolled *horde* curse (the random mod doubles the pack). It was not duplication.
  The later surveys turn the random mod off so the three dungeons compare.
* **Per-frame AI and trap work is small.** The update alone takes 0.3–5.5 ms; the dune traps' tick 0.01–0.3 ms. Only traps within 13 tiles
  tick. Drawing is 95–99% of the frame.
* **The lands are bound by drawing:**
  * The 2D area drawn: D1 15.6 Mpx a frame, D2 13.3, D3 14.2.
  * Full-screen layers: the land haze (\`drawStorm\`: 3 full-screen composites) and the vignette.
  * D1's sky adds the sun's corona pass and a full-screen 'lighter' glow.
  * Those are the lands' look, and v434 PO already cut the far view to where it shows, so I left them.
  * D1's extra sun corona and glow may be why D1 feels heavier than D3. This box's noise cannot confirm the ordering the user reported.
* **No** shader compiles in combat and **no** texture uploads.
* GL buffer uploads of 0.2–0.9 MB a frame are the bosses' and summons' tubes rebuilt on the CPU every frame (as designed).
* **Bosses are bound by the GLM model pass**, as v434 found: Oneira about 264 ms, Thul-Ammon about 343 ms of the frame on this rasteriser.
* **Summons in boss fights:**
  * The extra model pass (one per summon).
  * **The GLM canvas reallocated 1.9–2.25 times a frame**. The boss (keep 1) and the summon (Tiamat and Moby Dick keep; Nidhogg and the
    other ride summons were not kept) each resized the one shared canvas to their own size in turn. Each reallocation is a new drawing
    buffer and depth buffer, antialiased.
  * 0.8–3 MB of JS garbage a frame. Nidhogg is the largest at 2.7 MB sampled; its biggest single source is its tube ring points (0.3 MB).
  * 3–21 canvases made in the cast's first 6 frames when not warmed, 2–20 when warmed.

### What changed (each hunk is restored by \`window.__R3_OFF = 1\`)
* \`src/js/20k5uz-gl-mesh.js\` (GLM render, shared, 2 small hunks):
  * Kept passes size the canvas to the envelope of the last 8 kept passes (the widest W, the tallest H; rounded to 32).
  * The canvas shrinks only when it holds 1.35× that envelope (4× / 1.5 Mpx for keep 2), instead of resizing to each pass in turn.
  * A new \`keep: 'r3'\` means kept.
  * Each pass is still drawn in the top-left W×H and copied out as 0, 0, W, H, as v434 PO set up.
* \`S.keep = 'r3'\` for the summons whose pass is copied out as 0, 0, W, H (audited, one line each):
  * \`20k6fa-fire-nidhogg-gl.js\`, \`20k5v-dark-susanoo-model.js\`, \`20k7m-water-jaws-model.js\` (2 passes), \`20k8m-ice-fenrir-model.js\`,
    \`20k5ya-wind-belladonna-model.js\`, \`20k2kz-earth-genbu-model.js\`, \`20k9ia-thunder-beast-gl.js\`, \`20k4pa-light-car-gl.js\`.
  * Tiamat, Moby Dick, Golden Eagle and Snake Flame already set keep.
* \`src/js/20k6fa-fire-nidhogg-gl.js\` \`ringPt\` writes into one scratch triple. Its 4 callers hand it straight to \`setV\`, which copies it.
  The arithmetic is the same. This removes the 314 kB a frame the allocation profile attributed to \`ringPt\` (by construction). The
  same-page heap counter moved −320 kB (Sarrukh) and −343 kB (Thul-Ammon) with Nidhogg out, but that counter is noisy.
* Not changed (see "Unfinished"): the summons' own per-frame mesh math and garbage, the lands' full-screen layers, the GLM shading cost.

### Survey: v460 with \`__R3_OFF = 1\` (v459's behaviour) vs v460, separate pages one after the other, random mods off
The dungeon rows run **identical code** in both (no GLM pass there), so their spread (e.g. D3 crowd 62 vs 101 ms, D1 exploring worst
5.8 s, a SwiftShader stall) is this machine's noise. The firm evidence is the counters.

${T('table-ab.md')}

### Same-page A/B (\`tests/_r3-same.js\`: frames alternating v459 / v460 in one page, medians, N = 6; the same frame drawn v459 / v460 / v459)
Alternating frames make one side trade the shared canvas back and forth, so the reallocation counts here sit between the survey's two.
The survey's runs (each side alone) are the clean counts. Pixel compare: 5–12 pixels of the 705 510 differ by more than 8 levels (max 29),
where the control is clean. They lie at the model copy's edge (the copy now reads from a larger canvas). The "thul tiamat" row's control is
itself unstable (Tiamat's own clock). The wall times here swing both ways by up to 2×: on SwiftShader a reallocation is cheap and the copy
of a larger canvas costs a little more (GL copy ms +2…+13), so **the change is not measurably faster here**.

${T('table-same.md')}

### The v458 route survey (before anything changed; random mods on, summons not warmed: the first look)
${T('table-before.md')}

### Results against the request
* "Aim for stable 60 FPS": **not shown and not claimed.** No representative device test ran.
* Summon spikes: the reallocation churn the profile found is gone (counters). Its effect on a real GPU is unmeasured here.
* The GLM model pass itself (boss + summon: two full model passes a frame) remains the dominant cost on this rasteriser.

### Reproduction on a device (iPhone / iMac)
1. Build: \`python3 src/build.py\`, and open the page.
2. Settings: turn on Frame counter and Frame counter details (they read fps, ms, the worst frame and the GL copies, PERF).
3. Reach Rift 03 with a six-star summon in the party. The developer tools' unlock-all lets you pick a stage on the rift's strip.
4. Enter Boss 1 (stage 3), wait for Sarrukh to surface, cast the summon, and note fps, ms and the worst frame for ~10 s.
5. In the console run \`window.__R3_OFF = 1\` (v459's behaviour). Cast again and note the same. Then \`window.__R3_OFF = 0\`.
6. Repeat for Oneira (stage 6) and Thul-Ammon (stage 8).
7. For the dungeons: stages 1, 4 and 7, standing in a crowd near traps.

## Tests run (all on test-r3.html, the final code)
* \`tests/_r3-route.js\` **70/70**:
  * The route, its counts and distinct dungeons, and the labels (other rifts unchanged).
  * One complete run through the normal buttons: Continue, then next after each stage. 8 stages in order, none skipped, none twice.
  * A loss keeps the checkpoint, and retry replays the stage.
  * A real save and reload mid-run resumes at the Rust Flats.
  * A second finish call changes nothing.
  * The seal: +300 crystals once. Replaying Thul-Ammon after the seal gives +60, not the seal again.
  * Every old checkpoint 0–11 migrates as above, and never past a stage not done. A migrated or new save is not moved again, including
    through a real reload of an old save.
  * The bosses ×3 (table above). A retry is not stacked, and a phase change does not raise it.
  * Minions, monsters, the mini boss and the traps are unchanged.
* The rift's existing tests (indices updated to the new route):
  * \`_dt-counts\` 14/14, \`_dt-traps\` 49/49, \`_dt-puzzles\` 3/3.
  * \`_de-break\` 34/34, \`_de-smoke\` 16/16 (gpu, nogpu, painter off, lowFx).
  * \`_da-fight\` GL=0 all ok. Its effective-health check now expects 6 (BOSSK=2 for a v458 build); its blows are measured at v460's ×3.
  * \`_db-fight\` QUICK=1 for oneira and thulammon with GL=0, and for oneira with **GL=1** (the GPU model forced): all ok.
  * \`tests/rift-dunes.js\` (v98): all 24 route, puzzle, boss and seal checks pass. It then stops in its Amber Vigil part, because the
    Scorpio gate was rebuilt in v445 (no \`watchers\`). That part is stale and out of scope (the gate is separate).
* loadchk \`[] true\`; \`node --check\` passes on every touched file; no \`__pp\` in production code; 0 page errors in every run.

## Assumptions
* **Which puzzle was retired.** The section-3 puzzle (the Grub Mounds), because the spec gives section 3 no puzzle. The Sandstorm Flight
  is Puzzle 1 and the Echo Chamber is Puzzle 2.
* **Which dungeon each section keeps.** Its first one (the Buried Road, the Rust Flats, the Moonlit Barrows).
* **"Summon".** The six-star summon Ultimates. I measured Tiamat, Moby Dick and Nidhogg.
* **"HP ×3".** Effective health (this rift's existing \`foeK.boss\` mechanism). Bars and \`maxhp\` are unchanged, so the phase cuts and the
  HP bar's percentages behave as before.

## Unfinished / for the lead
* **No device measurement.** The FPS goal is unverified. Repro steps are above.
* The summons' own per-frame CPU mesh building:
  * Nidhogg still makes an estimated ~2.4 MB of garbage a frame (2.7 MB sampled, less the ring points; not re-profiled): vector helpers that return arrays, and GLM builder meshes
    rebuilt each frame.
  * Tiamat makes ~0.8 MB a frame.
  * Making these zero-allocation is a larger rewrite of those models, outside Rift 03.
* Boss + summon is still two full GLM model passes a frame. The shading cost is unchanged.
* \`tests/rift-dunes.js\`'s Amber Vigil part predates the v445 gate rebuild.
* The test pages were removed from the repo root. Rebuild with \`python3 src/build.py --test-only test-r3.html\`.
`;
fs.writeFileSync(path.join(D, 'report.md'), md); console.log('wrote', path.join(D, 'report.md'), md.length, 'chars');
