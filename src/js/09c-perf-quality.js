/* ---------- (v439 SP) Visual quality (Auto / High / Balanced / Performance), the frame counter's detailed readout, and the benchmark ----------
   The user (2026-11-21, iPhone): 7 fps with an Anima's big moment, 15 fps under Sunflare with Asmodeus out, 26 fps while a skill plays,
   29 fps in the Belfry under stacked wind. The fights draw with Canvas 2D (the world, the monsters, the HUD), with the shared GPU painter
   (FGFX: each of its passes a WebGL layer copied onto the 2D canvas) and with GLM (the Animas' and bosses' 3D models: each pass again a
   WebGL canvas copied onto it). Each such copy makes the browser wait for that GPU work before the 2D canvas can go on.
   GQ: the visual quality of the Tower and the rifts (Settings > Visual quality, st.gq: 'auto' (the default), 'high', 'balanced', 'perf').
     level 0 High        the canvas at up to 2 device px a point (as before), the painter's layers and the models at full resolution
           1 Balanced    1.5 px a point, the painter's soft layers at 3/4 of their resolution, the Animas' models at 0.8
           2 Performance 1.25 px a point, the soft layers at 0.6, the models at 0.65
           3 (Auto only) Performance, paced at a steady 30 frames a second (every other display frame) when 60 cannot be held
     Only resolution and pacing: no effect, warning, hit or number is left out; the HUD and the warnings keep their shapes.
     Auto steps down on sustained evidence (the median frame interval over 90-frame windows above 20.5 ms for two windows running), takes
     a step back if the lower resolution did not make frames quicker (a CPU-bound moment), and steps up only after a long stretch of
     headroom (12 windows, ~18 s at 60 fps, the JavaScript time of a frame well under budget), waiting twice as long after each step up
     that had to be taken back within 20 s (no back-and-forth). Changes are rare, so the canvas is reallocated rarely.
     window.__SP_OFF = 1: none of this (v438: the canvas's own two-step resolution drop, no pacing).
   PERF: counters the frame counter's detailed readout shows (Settings > Frame counter details, st.fpsD): the frame interval's median and
     95th percentile over 5 s, frames over 33.3 and 50 ms, the JavaScript time of the game's update, its drawing (render submission) and
     the film lens (CPU time measured around each call: never GPU time, which the browser does not report here), enemies active and on
     screen, projectiles, particles, damage labels, the canvas's size and pixel ratio, the GPU layers copied onto the canvas a frame, the
     quality level. Written four times a second into one text node.
   PERF.bench(): Settings > Run benchmark: a fixed stress run on the game's own systems (the Garden of Unborn Stars' section 2 fight if it
   is open, else the Tower's first floor): idle, a pack of 20 round the pet, the pet's skill, its Ultimate with its Anima summoned, all at
   once; ~2.5 min (v441 FL: it opens with the film look off, on, and each of its parts alone over the pack of 20; the busiest phase is
   then repeated with one diagnostic switch each: 1.25 px a point, fewer effects; each put back after); nothing is saved from it (energy given back, the stage left without a result); the results shown with a Copy button. */
const GQ = (() => {
  const NAMES = ['High', 'Balanced', 'Performance', 'Performance 30'], CAP = [2, 1.5, 1.25, 1.25], FGK = [1, 0.75, 0.6, 0.6], GLK = [1, 0.8, 0.65, 0.65];
  const MODES = { high: 0, balanced: 1, perf: 2 };
  const off = () => { try { return typeof window !== 'undefined' && window.__SP_OFF === 1; } catch (e) { return false; } };
  const mode = () => (typeof st !== 'undefined' && st && MODES[st.gq] != null ? st.gq : 'auto');
  let A = 0, win = [], busy = [], bad = 0, good = 0, upNeed = 12, upAt = -1e9, settle = 0, hold = false, lastLvl = -1, chk = null, noDown = -1e9;
  const level = () => (off() ? 0 : mode() === 'auto' ? A : MODES[mode()]);
  const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : 0; };
  function apply() { const L = level(); if (L === lastLvl) return; const capCh = lastLvl < 0 || CAP[L] !== CAP[lastLvl]; lastLvl = L; settle = 60; win.length = 0; busy.length = 0;
    if (capCh && typeof arc !== 'undefined' && arc.open && arc.mode === 'dungeon' && typeof arcLayout === 'function') try { arcLayout(); } catch (e) {} }
  /* one drawn arcade frame: its interval (ms since the last drawn one) and the JavaScript time it took; live: the fight is being played */
  function tick(iv, js, live) {
    if (off() || !live || hold || mode() !== 'auto') { win.length = 0; busy.length = 0; return; }
    if (settle > 0) { settle--; return; }
    if (!(iv > 0) || iv > 250) return;   // (a hidden tab, a pause, a load: not evidence)
    win.push(iv); busy.push(js); if (win.length < 90) return;
    const m = med(win), b = med(busy); win.length = 0; busy.length = 0;
    /* a step down to a lower resolution that did not make the frames quicker (a CPU-bound moment: fewer pixels do not help it) is
       taken back, and no step down is tried again for a minute */
    if (chk) { const c0 = chk; chk = null; if (A === c0.lvl && A < 3 && m > c0.pre * 0.95) { A--; noDown = performance.now() + 60000; bad = 0; apply(); return; } }
    const slow = A === 3 ? false : m > 20.5;   // (at the paced level a frame every 33.3 ms is the plan)
    if (slow) { good = 0; if (++bad >= 2 && A < 3 && performance.now() > noDown) { bad = 0; if (performance.now() - upAt < 20000) upNeed = Math.min(96, upNeed * 2); A++; chk = { pre: m, lvl: A }; apply(); } return; }
    bad = 0;
    const room = A === 3 ? b < 11 : m < 17.6 && b < 9;
    if (A > 0 && room) { if (++good >= upNeed) { good = 0; A--; upAt = performance.now(); apply(); } } else good = 0;
  }
  // paced 30: skip a display frame when the last drawn one was less than ~25 ms ago
  const pace = (ms, last) => !off() && level() === 3 && ms - last < 25;
  /* the Animas' models (02f3..02f6): their pass's resolution in a fight: the quality's factor, and 3/4 under Fewer effects (lowFx: the
     user's own lever for a weak phone); partsK their effect meshes' (already at 0.6 under Fewer effects). Elsewhere (menus) 1 */
  const inFight = () => typeof arc !== 'undefined' && !!arc.game && arc.mode === 'dungeon';
  const animaK = () => (off() || !inFight() ? 1 : GLK[level()] * (typeof st !== 'undefined' && st && st.lowFx ? 0.75 : 1)), partsK = () => (off() || !inFight() ? 1 : GLK[level()]);
  return { tick, pace, apply, level, mode, animaK, partsK, name: () => (mode() === 'auto' ? 'Auto: ' : '') + NAMES[level()], cap: () => CAP[level()], fgK: () => FGK[level()], glK: () => (off() ? 1 : GLK[level()]),
    set hold(v) { hold = !!v; }, get hold() { return hold; }, reset() { A = 0; win.length = 0; busy.length = 0; bad = good = 0; upNeed = 12; chk = null; noDown = -1e9; apply(); }, get A() { return A; }, set A(v) { A = Math.max(0, Math.min(3, v | 0)); chk = null; apply(); }, NAMES };
})();

const PERF = (() => {
  const N = 600, IV = new Float32Array(N), JS = new Float32Array(N * 3); let n = 0, head = 0, last = 0;
  let cp = 0, cpF = 0, cpAcc = 0;   // (GPU layers copied onto the canvas: this frame, the last frame, a running sum for the benchmark)
  /* the arcade's drawn frame: its timestamp and its JavaScript parts (update, drawing, the lens) */
  function frame(ms, upd, draw, post) { const iv = last ? ms - last : 0; last = ms; IV[head] = iv; JS[head * 3] = upd; JS[head * 3 + 1] = draw; JS[head * 3 + 2] = post; head = (head + 1) % N; if (n < N) n++;
    cpF = cp; cpAcc += cp; cp = 0; if (B) benchFrame(iv, upd, draw, post); return iv; }
  const copy = () => { cp++; };
  function stats(span) {   // the last span ms of drawn frames
    const v = [], u = [], d = [], p = []; let t = 0, o33 = 0, o50 = 0;
    for (let k = 1; k <= n; k++) { const i = (head - k + N) % N, x = IV[i]; if (!(x > 0)) continue; t += x; if (t > span) break; v.push(x); u.push(JS[i * 3]); d.push(JS[i * 3 + 1]); p.push(JS[i * 3 + 2]); if (x > 33.4) o33++; if (x > 50) o50++; }
    const q = (a, f) => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.floor(b.length * f))]; };
    return { n: v.length, med: q(v, 0.5), p95: q(v, 0.95), o33, o50, upd: q(u, 0.5), draw: q(d, 0.5), post: q(p, 0.5) };
  }
  function scene() {   // what is on the field now (read only for the readout, four times a second)
    const o = { foes: 0, vis: 0, shots: 0, parts: 0, labels: 0 };
    try { const D = arc.game && arc.game._dbg; if (!D) return o; const a = D.toWorld ? D.toWorld(0, 0) : null, b = D.toWorld ? D.toWorld(arc.W || 0, arc.H || 0) : null;   // (the world rectangle on the screen)
      for (const m of D.mons) { if (m.dead) continue; o.foes++; if (a && m.x > a[0] - 1 && m.x < b[0] + 1 && m.y > a[1] - 1 && m.y < b[1] + 2) o.vis++; }
      o.shots = (D.shots ? D.shots.length : 0) + (D.eshots ? D.eshots.length : 0); o.parts = D.parts ? D.parts.length : 0; o.labels = D.texts ? D.texts.length : 0; } catch (e) {}
    return o; }
  function lines() {
    const s = stats(5000), sc = scene(), cv = typeof arcCanvas !== 'undefined' ? arcCanvas : null, mem = performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(0) + ' MB' : 'n/a';
    return [`med ${s.med.toFixed(1)} · p95 ${s.p95.toFixed(1)} ms · >33ms ${s.o33} · >50ms ${s.o50} (5 s)`,
      `CPU (JS) sim ${s.upd.toFixed(1)} · draw ${s.draw.toFixed(1)} · lens ${s.post.toFixed(1)} ms · GPU n/a`,
      `foes ${sc.foes} (${sc.vis} on screen) · shots ${sc.shots} · parts ${sc.parts} · labels ${sc.labels}`,
      `canvas ${cv ? cv.width + '×' + cv.height : '-'} @${typeof arc !== 'undefined' ? (+arc.dpr).toFixed(2) : '-'} · GL copies ${cpF}/frame`,
      FXB.line(),   /* v440 SQ: the cosmetic budget (used / limit, items thinned) */
      `quality ${GQ.name()}${typeof st !== 'undefined' && st && st.lowFx ? ' · fewer effects' : ''} · heap ${mem}`].join('\n'); }

  /* ---- the benchmark ---- */
  let B = null;
  /* the run: five phases, then 'everything at once' again under diagnostic switches, one at a time, put back after (so the phone
     itself shows which lever matters: a lower canvas resolution, fewer effects; v441 FL: the film look and its parts are the run's first rows)
     (v440 SQ) then the Drowned Belfry (a stage of its brood: a pack with its leaders round the pet in a flooded hall, the pet's wind
     moves stacked one on another, the hall's water draining) and a boss (the Belfry's first, the Baptism Chamber's GPU boss, with the
     pet's skill, Ultimate and Anima), each in its own stage (left without a result, the next one started). st: G the Garden (or the
     Tower), B the Belfry stage, X the boss stage. The Long run (bench({ long: true })) plays everything-at-once, the Belfry and the
     boss in turn, 20 s each, stage after stage, for 10 minutes of play, and reports each minute (frame times, the JavaScript heap where
     the browser tells it, the GL copies) and the first minute against the last: a phone that heats up shows as a slow drift */
  /* (v441 FL) the run opens with the film look: off, on (its parts at this quality), then each of its parts alone (forced on whatever
     the quality: the grade, the grain, the dust, the lens fringe), all with the pack of 20 round the pet, so the phone shows what the
     look and each of its parts cost; the 'no lens fringe' and 'no film look' rows of v439-v440 are these now */
  const PH = [{ id: 'pack', t: 8, label: 'film off', diag: 'film:off', st: 'G' }, { id: 'pack', t: 8, label: 'film on', diag: 'film:on', st: 'G' },
    { id: 'pack', t: 8, label: ' film: grade', diag: 'film:grade', st: 'G' }, { id: 'pack', t: 8, label: ' film: grain', diag: 'film:grain', st: 'G' }, { id: 'pack', t: 8, label: ' film: dust', diag: 'film:dust', st: 'G' }, { id: 'pack', t: 8, label: ' film: fringe', diag: 'film:fringe', st: 'G' },
    { id: 'idle', t: 6, label: 'idle', st: 'G' }, { id: 'pack', t: 10, label: 'pack of 20', st: 'G' }, { id: 'skill', t: 10, label: '+ skill', st: 'G' }, { id: 'ult', t: 12, label: '+ Ult. + Anima', st: 'G' }, { id: 'all', t: 12, label: 'everything', st: 'G' },
    { id: 'all', t: 8, label: ' 1.25 px/pt', diag: 'lowres', st: 'G' }, { id: 'all', t: 8, label: ' fewer effects', diag: 'lowfx', st: 'G' },
    { id: 'belfry', t: 16, label: 'Belfry, wind', st: 'B' }, { id: 'boss', t: 16, label: 'boss fight', st: 'X' }];
  const LONG = 600, LPH = [{ id: 'all', t: 20, label: 'everything', st: 'G' }, { id: 'belfry', t: 20, label: 'Belfry', st: 'B' }, { id: 'boss', t: 20, label: 'boss', st: 'X' }];
  const lpt = P => { try { return B && B.long && window.__BENCH_LPT > 0 ? window.__BENCH_LPT : P.t; } catch (e) { return P.t; } };   /* (tests: a shorter phase in the Long run) */
  let DG = null;   // (the diagnostic switch on, and what to put back)
  function diag(k) { undiag(); if (!k) return; DG = { k, retro: st.retro, gq: st.gq, low: st.lowFx };
    if (k === 'nolens') PERF.noLens = true; else if (k === 'nofilm') { st.retro = false; try { retro.frame(); } catch (e) {} }
    else if (k.slice(0, 5) === 'film:') { const p = k.slice(5); st.retro = p !== 'off'; try { retro.force = p === 'off' || p === 'on' ? null : { [p]: 1 }; retro.frame(); } catch (e) {} }   /* (v441 FL) */
    else if (k === 'lowres') { st.gq = 'perf'; try { arcLayout(); } catch (e) {} } else if (k === 'lowfx') st.lowFx = true; }
  function undiag() { const d = DG; if (!d) return; DG = null; PERF.noLens = false; st.retro = d.retro; try { retro.force = null; } catch (e) {} /* v441 FL */ st.lowFx = d.low; if (st.gq !== d.gq) { st.gq = d.gq; try { if (arc.open) arcLayout(); } catch (e) {} } try { retro.frame(); } catch (e) {} }
  const can = k => k === 'G' ? true : typeof riftOpen === 'function' && riftOpen('belfry') && typeof startRift === 'function';
  /* (v440 SQ) a stage of the run started (energy topped up for it: given back at the end) */
  function stageGo(k) { st.energy = Math.max(st.energy, 10); if (k === 'G') { if (B.garden) startRift('garden', 3); else startDungeon(1); } else startRift('belfry', k === 'B' ? 3 : 2); B.stg = k; B.sw = true; B.swAt = performance.now(); B.started = false; }
  function bench(o) {
    if (B || (typeof arc !== 'undefined' && arc.open)) return false;
    const garden = typeof riftOpen === 'function' && riftOpen('garden') && typeof startRift === 'function', long = !!(o && o.long);
    const plan = (long ? LPH : PH).filter(p => can(p.st));
    B = { e0: st.energy, gq: st.gq, ph: -1, pt: 0, plan, long, garden, rows: plan.map(p => ({ id: p.id, label: p.label, st: p.st, iv: [], js: [], cp: 0, res: '' })), where: garden ? 'Garden of Unborn Stars (section 2 fight)' : 'Tower, floor 1', started: false, t0: 0, warm: 0, stg: 'G', sw: false, play: 0, mins: [], stages: 0 };
    const e0 = st.energy; GQ.hold = true; B.made = performance.now();
    try { stageGo(plan[0].st); } catch (e) { B = null; GQ.hold = false; st.energy = e0; return false; }
    const poll = setInterval(() => { if (!B) { clearInterval(poll); return; }
      if (B.sw && performance.now() - B.swAt > 120000) { clearInterval(poll); finish(true); return; }   // (a stage that never opened)
      if (typeof arc === 'undefined' || !arc.open) { if (!B.sw && (B.started || performance.now() - B.made > 120000)) { clearInterval(poll); finish(true); } return; }   // (left by the player, or never opened)
      if (arc.state === 'ready' && !B.started) { try { beginPlay(); } catch (e) {} }
      if (arc.state === 'play' && !B.started) { B.started = true; B.sw = false; B.stages++; if (!B.t0) B.t0 = performance.now(); B.warm = 3; }
      if (B.started && !B.sw && arc.state !== 'play') { clearInterval(poll); finish(true); } }, 200);
    return true;
  }
  /* (v440 SQ) every one of the brood harmless and unkillable for the run (nothing it does may end in a kill, a level or a result) */
  const tame = D => { for (const m of D.mons) if (!m.dead && !m.boss && m.hp < 1e8) { m.hp = 1e9; m.maxhp = 1e9; } };
  function gather(D, at) {   // up to 20 of the brood round the pet, harmless for the run (the run's own sandbox: nothing is kept), on open floor near it
    const me = D.me, W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let spot = null;
    if (at && W(at.x, at.y)) spot = at;   /* (v440 SQ: a place asked for: the Belfry's flooded hall) */
    /* (v440 SQ) an open stretch of floor: wide near the pet first, then farther and smaller (a stage of narrow walks has none of the first) */
    for (const [R, hx, hy] of at ? [[12, 6, 4], [12, 4, 3]] : [[40, 6, 4], [70, 6, 4], [70, 4, 3], [70, 3, 2]]) for (let k = 0; k < 2500 && !spot; k++) { const sx = (at || me).x + (Math.random() - 0.5) * R, sy = (at || me).y + (Math.random() - 0.5) * R; let ok = true; for (let dx = -hx; dx <= hx && ok; dx++) for (let dy = -hy; dy <= hy + 1 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) spot = { x: sx, y: sy }; }
    if (spot) { me.x = spot.x; me.y = spot.y; }
    const L = D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still).sort((a, b) => (b.calLeader ? 1 : 0) - (a.calLeader ? 1 : 0)); let i = 0, j = 0;   /* (v440 SQ: the pack leaders first) */
    for (const m of L) { if (i >= 20 || j > 400) break; for (let tr = 0; tr < 12 && i < 20; tr++, j++) { const b = (i + tr * 0.37) / 20 * 6.283, r = 2.0 + ((i + tr) % 4) * 1.0 * (tr > 5 ? 0.6 : 1), x = me.x + Math.cos(b) * r, y = me.y + 1.5 * (tr > 5 ? 0.3 : 1) + Math.sin(b) * r * 0.75;   /* (v440 SQ: a few more places tried round a narrow spot) */
      if (D.walkAt(Math.floor(x), Math.floor(y))) { Object.assign(m, { x, y, hp: 1e9, maxhp: 1e9, aggro: true, spd: 0, atkCd: 99, dmg: 0 }); i++; break; } } }
    tame(D);
  }
  const summon = D => { try { const AN = D.AN; if (AN && AN.kit && !AN.S.list.length) { AN.S.used = false; AN.S.gauge = 1; AN.summon(); } } catch (e) {} };
  const WIND = ['windblades', 'cyclone', 'gust', 'cyclone', 'gust'];
  /* (v440 SQ) the Belfry: the pet in the first flooded hall with a pack and its leaders, its water let go a few seconds in */
  function belfryStart(D) { let at = null; try { const DS = BEL.dungeonCtx(D.g), VH = DS && DS.valveHalls[0]; if (VH && VH.room) { const r = VH.room; at = { x: r.x + r.w / 2, y: r.y + r.h / 2 }; B.vh = VH; } } catch (e) {} gather(D, at); B.wi = 0; B.dr = false; }
  function belfryDrain() { const VH = B.vh; if (!VH || !VH.valve || B.dr) return; B.dr = true; try { const L = VH.leech; VH.leech = null; VH.valve.use(VH.valve); VH.leech = L; } catch (e) {} }
  function windCast(D) { try { if (typeof ELEM_LIST === 'undefined' || !ELEM_LIST.wind || typeof elemAbility !== 'function') return; const k = WIND[B.wi++ % WIND.length], mv = ELEM_LIST.wind['ex_' + k]; if (!mv) return; D.setKit('strong', Object.assign(elemAbility(mv, 'strong', st), { cost: 0, cd: 0, evo: 7 })); D.g.cdS = 0; D.useStrong('strong'); } catch (e) {} }
  /* (v440 SQ) the boss: the pet a few steps from it, the fight woken, the boss kept at full health (it never falls: no result) */
  function bossStart(D) { const me = D.me, bo = D.mons.find(m => m.boss && !m.dead); B.boss = bo || null; if (bo) { const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); for (const [dx, dy] of [[0, 4], [3, 3], [-3, 3], [0, -4], [4, 0], [-4, 0], [0, 6]]) if (W(bo.x + dx, bo.y + dy)) { me.x = bo.x + dx; me.y = bo.y + dy; break; } } try { if (D.wakeBoss) D.wakeBoss(); } catch (e) {} D.g.intro = 0; tame(D); summon(D); }
  /* called by the arcade before each update while the run is on: the run's actions */
  function benchTick(dt) {
    if (!B || !B.started || B.sw || !arc.game || !arc.game._dbg) return; const D = arc.game._dbg, me = D.me, g = D.g, PL = B.plan;
    if (B.warm > 0) { B.warm -= dt; if (B.warm <= 0) { if (B.ph < 0) B.ph = 0; B.pt = 0; g.intro = 0; } return; }
    const P = PL[B.ph]; if (!P) return; B.pt += dt; if (B.long) B.play += dt;
    const id = P.id; me.hp = D.ST.hp; me.mp = 999; me.inv = Math.max(me.inv || 0, 0.2); for (const m of D.mons) if (m.hp > 1e8) m.atkCd = 99; if (id !== 'boss' && D.eshots) D.eshots.length = 0;   /* (v440 SQ: the pet unhurt; the boss's own shots kept: they are what is measured) */
    if (id === 'boss' && B.boss && !B.boss.dead) B.boss.hp = Math.max(B.boss.hp, B.boss.maxhp * 0.9);
    if (B.pt <= dt + 1e-6) { diag(P.diag); if (id === 'belfry') belfryStart(D); else if (id === 'boss') bossStart(D); else if (id !== 'idle') gather(D); /* (the pack gathered again at each phase: the same load in every row) */ if (id === 'ult' || id === 'all') summon(D); }
    if ((id === 'skill' || id === 'all' || id === 'boss') && (B.sk = (B.sk || 0) - dt) <= 0) { B.sk = 2; try { g.cdS = 0; D.useStrong('strong'); } catch (e) {} }
    if ((id === 'ult' || id === 'all' || id === 'boss') && (B.ul = (B.ul || 0) - dt) <= 0) { B.ul = 6; try { g.cdU = 0; D.useUlt(); } catch (e) {} }
    if (id === 'belfry') { if ((B.sk = (B.sk || 0) - dt) <= 0) { B.sk = 1.4; windCast(D); } if (B.pt > 5) belfryDrain(); }
    if (B.pt >= lpt(P)) { B.pt = 0; B.sk = 0; B.ul = 0;
      if (B.long) { if (B.play >= (window.__BENCH_LONG > 0 ? window.__BENCH_LONG : LONG)) {   /* (__BENCH_LONG: tests, a shorter long run) */ B.ph = PL.length; setTimeout(() => finish(false), 0); return; } B.ph = (B.ph + 1) % PL.length; }
      else { B.ph++; if (B.ph >= PL.length) { setTimeout(() => finish(false), 0); return; } }   // (left after this frame: the arcade is mid-frame here)
      const nx = PL[B.ph]; if (nx.st !== B.stg || B.long) { undiag(); B.sw = true; B.swAt = performance.now(); const k = nx.st; setTimeout(() => { if (!B) return; try { closeArcade(true); } catch (e) {} try { stageGo(k); } catch (e) { finish(true); } }, 0); } }   /* (v440 SQ: the next stage; in the Long run every phase in a fresh stage: rooms left and entered again) */
  }
  function benchFrame(iv, upd, draw, post) { if (!B || B.sw || B.warm > 0 || B.ph < 0 || B.ph >= B.plan.length || !(iv > 0) || iv > 250) return; const js = upd + draw + post;
    if (B.long) { const mi = Math.min(9, Math.floor(B.play / 60)); let M = B.mins[mi]; if (!M) M = B.mins[mi] = { iv: [], js: [], cp: 0, heap: 0, res: '' }; M.iv.push(iv); M.js.push(js); M.cp += cpF; M.res = arcCanvas.width + '×' + arcCanvas.height; if (performance.memory) M.heap = performance.memory.usedJSHeapSize; return; }
    const R = B.rows[B.ph]; R.res = arcCanvas.width + '×' + arcCanvas.height; R.iv.push(iv); R.js.push(js); R.cp += cpF; }
  /* (v441 FL) the film look's parts at this quality, for the card's head: ' (grade grain dust fringe)' */
  const filmParts = () => { try { const p = retro.parts; return p ? ' (' + ['grade', 'grain', 'dust', 'fringe'].filter(k => p[k]).join(' ') + ')' : ''; } catch (e) { return ''; } };
  function finish(aborted) {
    const b = B; if (!b) return; B = null; undiag(); GQ.hold = false;
    try { if (typeof arc !== 'undefined' && arc.open) closeArcade(true); } catch (e) {}
    st.energy = b.e0; if (typeof updateHud === 'function') try { updateHud(); } catch (e) {}
    const q = (a, f) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * f))]; };
    /* (v440 SQ) the card's text made compact for a chat: a short head, then one line a phase in fixed columns (fps, median and 95th
       percentile frame ms, frames over 33 and 50 ms, the JavaScript ms, GL copies a frame), the canvas size only where it differs */
    const res0 = (b.rows.find(R => R.res) || {}).res || (typeof arcCanvas !== 'undefined' ? arcCanvas.width + '×' + arcCanvas.height : '-');
    const ua = navigator.userAgent, dev = (/iPhone|iPad|Android[^;)]*|Macintosh|Windows NT [\d.]+|Linux/.exec(ua) || [''])[0], br = (/CriOS\/[\d]+|FxiOS\/[\d]+|EdgiOS\/[\d]+|Chrome\/[\d]+|Version\/[\d.]+ (Mobile\/\w+ )?Safari|Firefox\/[\d]+/.exec(ua) || [''])[0].replace(/ Mobile\/\w+/, '');
    const head = [`Cocopets benchmark v441${b.long ? ' · LONG RUN' : ''} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}${aborted ? ' · stopped early' : ''}`,
      `${dev} ${br} · screen ${innerWidth}×${innerHeight}@${devicePixelRatio} · canvas ${res0}@${(+arc.dpr).toFixed(2)}`,
      `quality ${GQ.name()}${st.lowFx ? ' · fewer fx' : ''} · film ${st.retro === false ? 'off' : 'on' + filmParts()} · ${b.where}`];
    const LW = b.long ? 9 : 15, col = (L, n, f, a, b2, o3, o5, j, cp, x) => `${L.padEnd(LW).slice(0, LW)}${(n ? String(Math.round(f)) : '-').padStart(4)}${a.padStart(6)}${b2.padStart(6)}${o3.padStart(5)}${o5.padStart(5)}${j.padStart(6)}${cp.padStart(4)}${x || ''}`;   /* (~50 characters: a phone's card and a chat keep a row on one line) */
    const line = (L, iv, js, cpS, x) => { const n = iv.length, mean = n ? iv.reduce((s, v) => s + v, 0) / n : 0, c3 = iv.filter(v => v > 33.4).length, c5 = iv.filter(v => v > 50).length;
      return col(L, n, n ? 1000 / mean : 0, q(iv, 0.5).toFixed(1), q(iv, 0.95).toFixed(1), b.long ? (n ? Math.round(c3 / n * 100) + '%' : '-') : String(c3), b.long ? (n ? Math.round(c5 / n * 100) + '%' : '-') : String(c5), (v => v >= 100 ? v.toFixed(0) : v.toFixed(1))(q(js, 0.5)), n ? (cpS / n).toFixed(1) : '-', x); };
    const th = col(b.long ? 'minute' : 'phase', 1, 0, 'med', 'p95', '>33', '>50', 'js', 'gl', b.long ? '   MB' : '').replace(new RegExp('^(.{' + LW + '}) +0'), '$1 fps');
    let rows;
    if (b.long) { rows = b.mins.map((M, i) => line(String(i + 1), M.iv, M.js, M.cp, (M.heap ? (M.heap / 1048576).toFixed(0) : '-').padStart(5)));
      const F0 = b.mins[0], F1 = b.mins[b.mins.length - 1];
      if (F0 && F1 && F1 !== F0) { const d = (a, c) => (c >= a ? '+' : '') + ((c - a) / Math.max(1e-6, a) * 100).toFixed(0) + '%';
        rows.push(`first → last minute: median ${q(F0.iv, 0.5).toFixed(1)} → ${q(F1.iv, 0.5).toFixed(1)} ms (${d(q(F0.iv, 0.5), q(F1.iv, 0.5))}), p95 ${q(F0.iv, 0.95).toFixed(1)} → ${q(F1.iv, 0.95).toFixed(1)} ms (${d(q(F0.iv, 0.95), q(F1.iv, 0.95))})`,
          F0.heap && F1.heap ? `JS heap ${(F0.heap / 1048576).toFixed(0)} → ${(F1.heap / 1048576).toFixed(0)} MB` : 'JS heap: not reported by this browser', `stages played ${b.stages} · >33 and >50: share of frames`); } }
    else rows = b.rows.map(R => line(R.label, R.iv, R.js, R.cp, '')).concat(b.rows.filter(R => R.res && R.res !== res0).map(R => `canvas in '${R.label.trim()}': ${R.res}`));
    const text = head.concat([th], rows).join('\n');
    show(text);
  }
  function show(text) {
    let el = document.getElementById('benchOut'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'benchOut'; el.innerHTML = '<div class="bo-card"><h3>Benchmark results</h3><pre></pre><div class="bo-row"><button class="btn primary" type="button" data-b="copy">Copy</button><button class="btn" type="button" data-b="close">Close</button></div></div>';
    el.querySelector('pre').textContent = text; document.body.appendChild(el);
    el.addEventListener('click', e => { const k = e.target.closest('[data-b]'); if (!k) return; if (k.dataset.b === 'close') el.remove();
      else { const done = () => { k.textContent = 'Copied'; }; try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => sel()); else sel(); } catch (e2) { sel(); } }
      function sel() { const r = document.createRange(); r.selectNodeContents(el.querySelector('pre')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); try { document.execCommand('copy'); k.textContent = 'Copied'; } catch (e3) {} } });
    try { localStorage.setItem('cocopets-bench', text); } catch (e) {}
  }
  /* (v440 SQ) the sizes of the game's picture caches (the long run's record of what could accumulate) */
  function mem() { const o = {}, sz = (k, f) => { try { const v = f(); o[k] = v == null ? null : v.size != null ? v.size : v.length; } catch (e) { o[k] = null; } };
    sz('glow', () => glowCache); sz('fx', () => fxCache); sz('sized', () => sizedCache); sz('sizedSeen', () => sizedSeen); try { o.sizedMpx = +(sizedPx / 1e6).toFixed(2); } catch (e) {}
    sz('text', () => TEXT_PICS); sz('textFree', () => TEXT_FREE); sz('mcImg', () => MC_IMG); sz('mcCv', () => MC_CV); sz('llImg', () => LL_IMG); sz('llCv', () => LL_CV); sz('petImg', () => petImgCache); sz('shade', () => shadeCache); sz('monPort', () => monPortraits); sz('bossPort', () => bossPortraits); sz('hubGeo', () => hubGeoCache);
    return o; }
  return { frame, copy, stats, lines, bench, benchTick, mem /* v440 SQ */, get bench_on() { return !!B; }, get on() { return !!B; }, get cpF() { return cpF; }, get cpAcc() { return cpAcc; }, get B() { return B; } };
})();
/* ---------- (v440 SQ) FXB: one shared budget for decorative effects ----------
   The fights' cost grows with how much soft, transparent picture is laid over the screen at once: the painter's GPU layers (FGFX:
   every attack, summon, boss effect and the particle pass), and on top of them the many small decorations: sparks, stars, petals,
   confetti, chips of debris, embers, smoke puffs, after-images, the land's drifting motes and the ultimates' own twinkles. FXB
   estimates each frame's coverage in "screens" (the FGFX layers' laid area over the canvas's, plus every decoration's own area over
   the view's) and, when the total is over the quality level's limit (High generous, Balanced, Performance tighter; Auto follows its
   level), thins the decorations in a fixed order: tier 0 first (the land's ambient motes, petals, confetti, snow, bubbles, peripheral
   sparkles), then tier 1 (sparks, small stars, debris, embers, puffs, the far floaters), then tier 2 (small glows, after-images:
   redundant trails), each never below a floor. Which items stay is fixed per item (its own hash from a generator of the budget's own,
   never the game's dice), so an item is shown or not for its whole life (no flicker), the ones far from the middle of the screen and
   the faint ones going first; the share kept moves a little each frame (no popping).
   It only decides what is drawn: the fight itself (damage, hits, targets, projectiles, telegraphs, zones, the effects' timing, every
   particle's own life) is untouched, every dangerous thing keeps its picture, and nothing it skips draws the game's dice (a skipped
   item that would have drawn them the first time it was drawn draws them the same). Its state shows in the frame counter's details.
   window.__FXB = 0 (or __SQ_OFF / __SP_OFF): off; window.__FXB_LIMIT: a fixed limit (tests) */
const FXB = (() => {
  const LIM = [9, 6.5, 4.5, 4.5], FLOOR = [0.12, 0.3, 0.5];   /* (screens of coverage a frame by quality level: High, Balanced, Performance, paced; a heavy Garden fight lays 4-7 screens of GPU layers) */
  const off = () => { try { return window.__FXB === 0 || window.__SQ_OFF === 1 || window.__SP_OFF === 1; } catch (e) { return true; } };
  const K = [1, 1, 1], DEM = [0, 0, 0], DP = [0, 0, 0]; let on = false, fr = -1e9, lim = LIM[0], ess = 0, used = 0, n = 0, cut = 0, nP = 0, cutP = 0, area = 1, cx = 0, cy = 0, rd = 1, hs = 0x2545F491;
  const own = () => { hs = (Math.imul(hs, 1664525) + 1013904223) >>> 0; return hs / 4294967296; };
  /* the top of a fight's frame (20b draw): W, H the view (css px); the targets for this frame from the last one's demand */
  function begin(W, H) { const was = on; on = !off(); fr = performance.now(); for (let t = 0; t < 3; t++) { if (was) DP[t] = DEM[t]; DEM[t] = 0; } nP = n; cutP = cut; n = 0; cut = 0;   /* (a frame drawn with the budget off measured nothing: the last measure kept) */
    let L = 9; try { L = window.__FXB_LIMIT > 0 ? window.__FXB_LIMIT : LIM[typeof GQ !== 'undefined' ? GQ.level() : 0]; } catch (e) {} lim = L;
    let e = 0; try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX, cv = typeof arcCanvas !== 'undefined' ? arcCanvas : null; if (F && F.stats && cv) { e = (F.stats.cpxF || 0) / Math.max(1, cv.width * cv.height); F.stats.cpxF = 0; } } catch (er) {}
    ess = e; used = ess + DP[0] + DP[1] + DP[2]; area = Math.max(1, W * H); cx = W / 2; cy = H / 2; rd = 1 / Math.max(1, Math.hypot(cx, cy));
    let over = on ? used - lim : 0;
    for (let t = 0; t < 3; t++) { let tg = 1; if (over > 0 && DP[t] > 0) { const can = DP[t] * (1 - FLOOR[t]), c = Math.min(can, over); tg = 1 - c / DP[t]; over -= c; }
      const d = tg - K[t]; K[t] += d < 0 ? Math.max(d, -0.08) : Math.min(d, 0.03); if (!on) K[t] = 1; else { try { if (window.__FXB_SNAP) K[t] = tg; } catch (er) {} } } }   /* (__FXB_SNAP: tests, the target at once) */
  /* an item of a tier, its own hash h in [0, 1), its area px2 (css px), its place (x, y: css px) and alpha: draw it? */
  function keepH(h, tier, px2, x, y, a) { DEM[tier] += px2 / area; n++; const k = K[tier]; if (!on || k >= 0.999) return true;
    let w = 1; if (x != null) { const d = Math.hypot(x - cx, y - cy) * rd; if (d > 0.5) w += (d - 0.5) * 1.6; } if (a != null && a < 0.35) w += 0.35;
    if (h * w < k) return true; cut++; return false; }
  const keep = (o, tier, px2, x, y, a) => keepH(o.__fh != null ? o.__fh : (o.__fh = own()), tier, px2, x, y, a);
  return { begin, keep, keepH, get on() { return on && performance.now() - fr < 500; } /* (only within a fight's frames: a picture drawn elsewhere, a studio, a menu, is never thinned) */, get k() { return K; }, line() { return `fx ${used.toFixed(1)}/${lim} scr (layers ${ess.toFixed(1)}) · thinned ${cutP}/${nP}${on && K[0] < 0.999 ? ' · ' + K.map(v => Math.round(v * 100)).join('/') + '%' : ''}${on ? '' : ' · off'}`; }, state: () => ({ on, lim, ess, used, n, cut, nP, cutP, k: K.slice(), dem: DP.slice() }) };
})();
if (typeof self !== 'undefined') { self.GQ = GQ; self.PERF = PERF; self.FXB = FXB; /* v440 SQ */ }
