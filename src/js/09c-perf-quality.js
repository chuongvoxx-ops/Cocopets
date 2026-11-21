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
   once; ~90 s (the last four phases repeat the busiest one with one diagnostic switch each: no lens fringe, no film look, 1.25 px a point,
   fewer effects; each put back after); nothing is saved from it (energy given back, the stage left without a result); the results shown with a Copy button. */
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
      `quality ${GQ.name()}${typeof st !== 'undefined' && st && st.lowFx ? ' · fewer effects' : ''} · heap ${mem}`].join('\n'); }

  /* ---- the benchmark ---- */
  let B = null;
  /* the run: five phases, then 'everything at once' again under four diagnostic switches, one at a time, put back after (so the phone
     itself shows which lever matters: the film lens's colour fringe pass, the whole film look, a lower canvas resolution, fewer effects) */
  const PH = [{ id: 'idle', t: 6, label: 'idle' }, { id: 'pack', t: 10, label: 'pack of 20' }, { id: 'skill', t: 10, label: 'pack + skill' }, { id: 'ult', t: 12, label: 'pack + Ultimate + Anima' }, { id: 'all', t: 12, label: 'everything at once' },
    { id: 'all', t: 8, label: ' - without the lens fringe', diag: 'nolens' }, { id: 'all', t: 8, label: ' - without the film look', diag: 'nofilm' }, { id: 'all', t: 8, label: ' - at 1.25 px a point', diag: 'lowres' }, { id: 'all', t: 8, label: ' - with fewer effects', diag: 'lowfx' }];
  let DG = null;   // (the diagnostic switch on, and what to put back)
  function diag(k) { undiag(); if (!k) return; DG = { k, retro: st.retro, gq: st.gq, low: st.lowFx };
    if (k === 'nolens') PERF.noLens = true; else if (k === 'nofilm') { st.retro = false; try { retro.frame(); } catch (e) {} } else if (k === 'lowres') { st.gq = 'perf'; try { arcLayout(); } catch (e) {} } else if (k === 'lowfx') st.lowFx = true; }
  function undiag() { const d = DG; if (!d) return; DG = null; PERF.noLens = false; st.retro = d.retro; st.lowFx = d.low; if (st.gq !== d.gq) { st.gq = d.gq; try { if (arc.open) arcLayout(); } catch (e) {} } try { retro.frame(); } catch (e) {} }
  function bench() {
    if (B || (typeof arc !== 'undefined' && arc.open)) return false;
    const garden = typeof riftOpen === 'function' && riftOpen('garden') && typeof startRift === 'function';
    B = { e0: st.energy, gq: st.gq, ph: -1, pt: 0, rows: PH.map(p => ({ id: p.id, label: p.label, iv: [], js: [], cp: 0, res: '' })), where: garden ? 'Garden of Unborn Stars, section 2 fight' : 'Tower, floor 1', started: false, t0: 0, warm: 0 };
    const e0 = st.energy; GQ.hold = true; st.energy = Math.max(st.energy, 10); B.made = performance.now();
    try { if (garden) startRift('garden', 3); else startDungeon(1); } catch (e) { B = null; GQ.hold = false; st.energy = e0; return false; }
    const poll = setInterval(() => { if (!B) { clearInterval(poll); return; }
      if (typeof arc === 'undefined' || !arc.open) { if (B.started || performance.now() - B.made > 120000) { clearInterval(poll); finish(true); } return; }   // (left by the player, or never opened)
      if (arc.state === 'ready' && !B.started) { try { beginPlay(); } catch (e) {} }
      if (arc.state === 'play' && !B.started) { B.started = true; B.t0 = performance.now(); B.warm = 3; }
      if (B.started && arc.state !== 'play') { clearInterval(poll); finish(true); } }, 200);
    return true;
  }
  function gather(D) {   // up to 20 of the brood round the pet, harmless for the run (the run's own sandbox: nothing is kept), on open floor near it
    const me = D.me, W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let spot = null;
    for (let k = 0; k < 4000 && !spot; k++) { const sx = me.x + (Math.random() - 0.5) * 40, sy = me.y + (Math.random() - 0.5) * 40; let ok = true; for (let dx = -6; dx <= 6 && ok; dx++) for (let dy = -4; dy <= 5 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) spot = { x: sx, y: sy }; }
    if (spot) { me.x = spot.x; me.y = spot.y; }
    const L = D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still); let i = 0;
    for (const m of L) { if (i >= 20) break; const b = i / 20 * 6.283, r = 2.0 + (i % 4) * 1.0, x = me.x + Math.cos(b) * r, y = me.y + 1.5 + Math.sin(b) * r * 0.75;
      if (D.walkAt(Math.floor(x), Math.floor(y))) { Object.assign(m, { x, y, hp: 1e9, maxhp: 1e9, aggro: true, spd: 0, atkCd: 99, dmg: 0 }); i++; } }
  }
  /* called by the arcade before each update while the run is on: the run's actions */
  function benchTick(dt) {
    if (!B || !B.started || !arc.game || !arc.game._dbg) return; const D = arc.game._dbg, me = D.me, g = D.g;
    if (B.warm > 0) { B.warm -= dt; if (B.warm <= 0) { B.ph = 0; B.pt = 0; g.intro = 0; } return; }
    B.pt += dt; const P = PH[B.ph]; if (!P) return;
    me.hp = D.ST.hp; me.mp = 999; for (const m of D.mons) if (m.hp > 1e8) m.atkCd = 99; if (D.eshots) D.eshots.length = 0;
    const id = P.id;
    if (B.pt <= dt + 1e-6) { diag(P.diag); if (id !== 'idle') gather(D); /* (the pack gathered again at each phase: the same load in every row) */ if (id === 'ult' || id === 'all') { try { const AN = D.AN; if (AN && AN.kit && !AN.S.list.length) { AN.S.used = false; AN.S.gauge = 1; AN.summon(); } } catch (e) {} } }
    if ((id === 'skill' || id === 'all') && (B.sk = (B.sk || 0) - dt) <= 0) { B.sk = 2; try { g.cdS = 0; D.useStrong('strong'); } catch (e) {} }
    if ((id === 'ult' || id === 'all') && (B.ul = (B.ul || 0) - dt) <= 0) { B.ul = 6; try { g.cdU = 0; D.useUlt(); } catch (e) {} }
    if (B.pt >= P.t) { B.ph++; B.pt = 0; B.sk = 0; B.ul = 0; if (B.ph >= PH.length) setTimeout(() => finish(false), 0); }   // (left after this frame: the arcade is mid-frame here)
  }
  function benchFrame(iv, upd, draw, post) { if (!B || B.ph < 0 || B.ph >= PH.length || !(iv > 0) || iv > 250) return; const R = B.rows[B.ph]; R.res = arcCanvas.width + '×' + arcCanvas.height; R.iv.push(iv); R.js.push(upd + draw + post); R.cp += cpF; }
  function finish(aborted) {
    const b = B; if (!b) return; B = null; undiag(); GQ.hold = false;
    try { if (typeof arc !== 'undefined' && arc.open) closeArcade(true); } catch (e) {}
    st.energy = b.e0; if (typeof updateHud === 'function') try { updateHud(); } catch (e) {}
    const q = (a, f) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * f))]; };
    const cv = typeof arcCanvas !== 'undefined' ? arcCanvas : null;
    const head = [`Cocopets benchmark (v439) · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`, `${b.where} · quality ${GQ.name()}${st.lowFx ? ' · fewer effects' : ''} · film look ${st.retro === false ? 'off' : 'on'}`,
      `screen ${innerWidth}×${innerHeight} @${devicePixelRatio} · canvas ${cv ? cv.width + '×' + cv.height : '-'} @${(+arc.dpr).toFixed(2)}`, navigator.userAgent];
    const rows = b.rows.map(R => { const n = R.iv.length, mean = n ? R.iv.reduce((s, x) => s + x, 0) / n : 0;
      return `${R.label.padEnd(24)} ${n ? (1000 / mean).toFixed(0).padStart(3) + ' fps' : '  - fps'} · med ${q(R.iv, 0.5).toFixed(1)} · p95 ${q(R.iv, 0.95).toFixed(1)} ms · >33 ${R.iv.filter(x => x > 33.4).length} · >50 ${R.iv.filter(x => x > 50).length} · JS ${q(R.js, 0.5).toFixed(1)} ms · GL copies ${n ? (R.cp / n).toFixed(1) : '-'}/frame · ${R.res}`; });
    const text = head.concat([aborted ? '(stopped early)' : ''], rows).join('\n');
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
  return { frame, copy, stats, lines, bench, benchTick, get bench_on() { return !!B; }, get on() { return !!B; }, get cpF() { return cpF; }, get cpAcc() { return cpAcc; }, get B() { return B; } };
})();
if (typeof self !== 'undefined') { self.GQ = GQ; self.PERF = PERF; }
