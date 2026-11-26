// (v464 RZ-U) Raziel's ultimate, The Book of Two Heavens: shots, checks and frame costs, headless (every GPU path forced on the software rasteriser).
// A dungeon (RIFT, stage), Raziel summoned at form K (1 base, 2 Lv4, 3 Lv7) with N monsters round the pet (optionally a boss), the ultimate fired
// once; then, at each time in TIMES (s into the ultimate), one frame drawn and kept (OUTDIR/<tag>-t<time>.png) and, with PERF=1, F frames
// measured there by tests/_pf-lib.js (frame ms, FGFX passes / quads / composites, GLM passes, 2D work, heap). Checks: the ultimate starts once
// and ends at UT.len, damage lands (per phase), Raziel leaves, GPU buffers of RAZIEL_GL after the summon, no page errors.
// When RAZIEL_MOVES (20g6) is not wired yet the test wires RAZIEL_ULT to the summon runner itself (H from the runner's own X).
// usage: HTML=test-rzu.html node tests/_rz-ult.js   env: RIFT (belfry|garden|dunes), STAGE (3), K (3), N (16), BOSS=1, DPR (2), TIMES (comma s),
//   OUTDIR (shots/v464-RZU), TAG, PERF=1, F (3), LOW=1 (lowFx), NOGL=1 (no WebGL painter: the 2D path), SUN=1 (Sunflare cast during it), OUT=json
const { open } = require('./_pf-lib');
const fs = require('fs'), path = require('path');
const K = +(process.env.K || 3), N = +(process.env.N || 16), DPR = +(process.env.DPR || 2), F = +(process.env.F || 3), PERF = process.env.PERF === '1';
const TIMES = (process.env.TIMES || '1.4,3.4,5.2,7.0,10.2,11.25,11.9,12.2,12.9,14.1').split(',').map(Number);
const OUTD = path.resolve(__dirname, '..', process.env.OUTDIR || 'shots/v464-RZU'), TAG = process.env.TAG || `k${K}-dpr${DPR}`;
(async () => {
  fs.mkdirSync(OUTD, { recursive: true });
  const nogl = process.env.NOGL === '1';
  const T = await open({ html: process.env.HTML, dpr: DPR, rift: process.env.RIFT || 'belfry', gpu: !nogl, flags: nogl ? { __NG_GL: 0, __RZ_GL: 0 } : { __RZ_GL: 1 } });
  const { page, errors, start, frames } = T; const ev = (f, a) => page.evaluate(f, a);
  // capture the summon runner's X (to wire the ultimate when RAZIEL_MOVES is not there yet)
  await ev(([low]) => { const P = window.__pp; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.res = null; if (low) P.st.lowFx = true; if (window.__RZ_TESTWIRE0) window.__RZ_TESTWIRE = 1;
    // (the bundle keeps the runner private: its X is caught from the Aries module's create, which the runner calls with H.X when the kit holds Aries;
    // the kit is switched to Raziel before the summon) unless RAZIEL_MOVES is there, which the runner creates itself for Gemini
    if (typeof self.RAZIEL_MOVES === 'undefined' || window.__RZ_TESTWIRE) { P.st.animas.eq = 'aries'; const o = self.SAMAEL_MOVES.create; self.SAMAEL_MOVES.create = function (H) { window.__RZX = H.X; return o.apply(this, arguments); }; }
    else P.st.animas.eq = 'gemini'; }, [process.env.LOW === '1']);
  await start(+(process.env.STAGE || 3));
  const info = await ev(([K, N, boss, sun, pre]) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g, AN = D.AN, X = window.__RZX;
    for (let k = 0; k < 60; k++) G.update(1 / 60);
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 8000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 60, sy = me.y + (Math.random() - 0.5) * 60; let ok = true; for (let dx = -8; dx <= 8 && ok; dx++) for (let dy = -6; dy <= 6 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x; me.y = best.y + 1; }
    const ms = D.mons.filter(m => !m.boss && !m.dead && !m.fobj && !m.still); ms.forEach((m, i) => { if (i < N) { const b = i / N * 6.283, r = 2.2 + (i % 4) * 1.3; Object.assign(m, { x: me.x + 2.5 + Math.cos(b) * r, y: me.y - 0.5 + Math.sin(b) * r * 0.75, hp: 1e9, maxhp: 1e9, aggro: true, spd: 0, atkCd: 99, dmg: 0 }); } else m.x = -999; });
    if (boss) { const b = D.lesserBoss(me.x + 4, me.y - 1.5, 1, 'Test'); if (b) { if (!D.mons.includes(b)) D.mons.push(b); Object.assign(b, { hp: 1e9, maxhp: 1e9, atkCd: 99, aggro: true }); } }
    g.intro = 0; D.banners.length = 0; if (D.SKIP) D.SKIP.fog = true; me.face = 1;
    const phOf = t => t < 2.2 ? 1 : t < 4 ? 2 : t < 5.8 ? 3 : t < 8.6 ? 4 : t < 12.4 ? 5 : 6;
    window.__RZHOLD = () => { me.hp = D.ST.hp; me.mp = 999; const U2 = window.__RZU, J = U2 && U2.ul, Lg = window.__RZLED;
      for (const m of D.mons) { m.atkCd = 99; if (m.maxhp >= 1e9) { const d = 1e9 - m.hp; if (d > 0 && J && Lg) { Lg.n++; Lg.sum += d; const ph = phOf(J.t); Lg.byPh[ph] = (Lg.byPh[ph] || 0) + d; Lg.mons.set(m, (Lg.mons.get(m) || 0) + d); } m.hp = 1e9; } }
      if (D.eshots) D.eshots.length = 0; };
    AN.kit.main.id = 'gemini'; AN.kit.main.k = K; AN.kit.res = null; AN.kit.resonance = null; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); const ok = AN.summon();
    for (let k = 0; k < 60 * 6 && !(AN.S.list[0] && AN.S.list[0].st === 'fight'); k++) { window.__RZHOLD(); G.update(1 / 60); }
    const a = AN.S.list[0]; if (!a) return { err: 'no anima' };
    // the damage ledger: every blow on a monster while the ultimate runs, by phase
    const ledger = window.__RZLED = { n: 0, sum: 0, byPh: {}, mons: new Map(), el: {} }; const hm = X && X.hitMon;
    let U = null, wired = 'moves';
    if (typeof self.RAZIEL_MOVES === 'undefined' || window.__RZ_TESTWIRE) { if (!X) return { err: 'no X' };
      wired = 'test';
      const T2 = () => X.Tz(), Pw = a2 => D.ST.atk * [0, 1.6, 2.5, 3.6][a2.k] * (a2.awk || 1);
      const living = () => D.mons.filter(m => !m.dead && !m.under && !m.falling && !(m.fobj && m.forward));
      const hit = (m, d, o) => X.hitMon(m, d, Object.assign({ src: 'anima' }, o || {}));
      U = self.RAZIEL_ULT.create({ X, me, g, S: AN.S, T: T2, ST: () => D.ST, P: Pw, living, near: () => [], hit, pose: a2 => a2.rzS || (a2.rzS = (self.RAZIEL_GL && self.RAZIEL_GL.idle ? self.RAZIEL_GL.idle([1, 4, 7][a2.k - 1], 0) : {})), anchors: a2 => a2.rzOut || null });
      window.__RZU = U; window.__RZP = D.ST.atk * [0, 1.6, 2.5, 3.6][a.k] * 2;
      const oU = AN.update, oG = AN.drawGround, oF = AN.drawFx, oC = AN.drawCine, oA = AN.drawAnima;
      AN.update = function (dt, dtR) { const r = oU.apply(this, arguments); U.update(dt, dtR); return r; };
      AN.drawGround = function (c) { const r = oG.apply(this, arguments); U.drawGround(c); return r; };
      AN.drawFx = function (c) { const r = oF.apply(this, arguments); U.drawFx(c); return r; };
      AN.drawCine = function (c, W, H) { const r = oC.apply(this, arguments); U.drawCine(c, W, H); return r; };
      // the model where the runner will draw it (RZ-M's route through AnimaArt, when it lands): RAZIEL_GL.draw with the pose the ultimate writes
      AN.drawAnima = function (c, e) { const R = self.RAZIEL_GL || null; if (e.id !== 'gemini' || !R || !R.ok()) return oA.apply(this, arguments);
        const Tz = X.Tz(), S = e.rzS || (e.rzS = R.idle([1, 4, 7][e.k - 1], 0)); S.t = e.t; S.x = e.x; S.y = e.y; S.evo = [1, 4, 7][e.k - 1]; S.lowFx = !!P.st.lowFx;
        const out = R.draw(c, X.sx(e.x), X.sy(e.y), Tz * [0, 2.1, 2.6, 3.1][e.k], S, { tile: Tz, alpha: (e.alpha == null ? 1 : e.alpha) }); if (out) e.rzOut = out; else oA.apply(this, arguments); };
      window.__RZSOLVE = () => { const R = self.RAZIEL_GL || null, e = AN.S.list[0]; if (!R || !e || !e.rzS || !R.solve) return; const Tz = X.Tz(); e.rzS.t = e.t; e.rzS.x = e.x; e.rzS.y = e.y; const o = R.solve(X.sx(e.x), X.sy(e.y), Tz * [0, 2.1, 2.6, 3.1][e.k], e.rzS, { tile: Tz }); if (o) e.rzOut = o; };
      // the 30 s are over: the runner's awakening without the old finale (fin is the ultimate)
      a.life = 0.001; G.update(1 / 60); a.finDone = true; a.aw = 0.7; a.awk = 2; U.start(a); window.__RZA = a; window.__RZAGAIN = U.start(a);
    } else { U = AN.rz && AN.rz.ul ? AN.rz.ul : null; window.__RZU = U; window.__RZP = D.ST.atk * [0, 1.6, 2.5, 3.6][a.k] * 2; if (!U) return { err: 'RAZIEL_MOVES has no ult instance (AN.rz.ul)' };
      window.__RZA = a; for (let k = 0; k < 60 * 6 && !(a.rz && a.rz.ready); k++) { window.__RZHOLD(); G.update(1 / 60); } window.__RZGO = () => { a.life = 0.001; for (let k = 0; k < 60 * 4 && !U.ul; k++) { window.__RZHOLD(); G.update(1 / 60); } window.__RZAGAIN = U.start(a); }; if (!pre) window.__RZGO(); }
    if (X && wired === 'test') X.hitMon = function (m, d, o) { const U2 = window.__RZU, J = U2 && U2.ul; if (J && o && o.src === 'anima') { const ph = J.t < 2.2 ? 1 : J.t < 4 ? 2 : J.t < 5.8 ? 3 : J.t < 8.6 ? 4 : J.t < 12.4 ? 5 : 6; void ph; const e = o.el || '?'; ledger.el[e] = (ledger.el[e] || 0) + d; } return hm.apply(this, arguments); };
    if (sun) { const mv = P.ELEM_LIST.light.ey_sunflare; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 4, sig: false })); window.__RZSUN = () => { me.mp = 999; D.g.cdU = 0; const n0 = D.ELEM.fx.length, ct = D.g.cineT; D.g.cineT = 0; D.useUlt(); D.g.cineT = ct; window.__RZSUNN = [n0, D.ELEM.fx.length]; }; }
    return { ok, wired, st: a.st, k: a.k, P: Math.round(D.ST.atk * [0, 1.6, 2.5, 3.6][a.k] * 2), atk: D.ST.atk, ul: !!(U && U.ul), mons: D.mons.filter(m => !m.dead && m.x > -500).length, gl: !!(self.RAZIEL_GL && self.RAZIEL_GL.ok()), fg: self.NIDHOGG_MOVES.FGFX.usable(), cv: [document.getElementById('arcCanvas').width, document.getElementById('arcCanvas').height] };
  }, [K, N, process.env.BOSS === '1', process.env.SUN === '1', process.env.PRE === '1']);
  console.log('setup', JSON.stringify(info)); if (info.err) { await T.browser.close(); process.exit(2); }
  const SUNAT = +(process.env.SUNAT || 6.0);
  const step = s => ev(([s, SUNAT]) => { const P = window.__pp, G = P.arc.game, U = window.__RZU; for (let k = 0; k < Math.round(s * 60); k++) { if (window.__RZSUN && U.ul && U.ul.t >= SUNAT) { const f = window.__RZSUN; window.__RZSUN = null; f(); } window.__RZHOLD(); P.arc.t += 1 / 60; G.update(1 / 60); if (window.__RZSOLVE) window.__RZSOLVE(); } return U && U.ul ? +U.ul.t.toFixed(2) : -1; }, [s, SUNAT]);
  const shot = async name => { const r = await ev(() => { const P = window.__pp, A = P.arc, G = A.game, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'); c.save(); G.draw(c); c.restore(); const F = self.NIDHOGG_MOVES.FGFX; if (F.frameEnd) F.frameEnd(); if (P.retro) P.retro.post(cv, c); return cv.toDataURL('image/png'); }); fs.writeFileSync(path.join(OUTD, name), Buffer.from(r.split(',')[1], 'base64')); };
  const md = (L, k) => { const v = L.map(r => r[k] || 0).sort((a, b) => a - b); return v[v.length >> 1]; }, mn = (L, k) => L.reduce((a, r) => a + (r[k] || 0), 0) / L.length;
  const sumR = rows => ({ ms: +md(rows, 'tot').toFixed(0), js: +(md(rows, 'tot') - md(rows, 'glmMs') - md(rows, 'diGLms')).toFixed(0), upd: +md(rows, 'upd').toFixed(1), fgFlush: +mn(rows, 'fgFlush').toFixed(1), fgQuads: +mn(rows, 'fgQuads').toFixed(0), fgDraws: +mn(rows, 'fgDraws').toFixed(1), fgComp: +mn(rows, 'fgComp').toFixed(1), fgFillMpx: +(mn(rows, 'fgFillV') / 1e6).toFixed(2), glmN: +mn(rows, 'glmN').toFixed(1), glmMpx: +(mn(rows, 'glmA') / 1e6).toFixed(2), compMpx: +((mn(rows, 'diGLA') + mn(rows, 'glmA')) / 1e6).toFixed(2), glmDraws: +mn(rows, 'glmDraw').toFixed(0), ktri: +(mn(rows, 'glmVerts') / 3e3).toFixed(0), grad: +mn(rows, 'grad').toFixed(1), cvNew: +mn(rows, 'cvNew').toFixed(1), cvResize: +mn(rows, 'cvResize').toFixed(1), heapKB: +(mn(rows, 'heap') / 1e3).toFixed(0), fillA: +(mn(rows, 'fillRectA') / 1e6).toFixed(2), diMpx: +(mn(rows, 'diA') / 1e6).toFixed(2), glCompile: +mn(rows, 'glCompile').toFixed(1) });
  const out = { info, at: {}, perf: {} }; let now = 0;
  if (process.env.PRE === '1') {   // the summon fighting before its ultimate (its powers held off: a plain frame of Raziel on the field), measured, then the ultimate
    await ev(() => { const a = window.__RZA; if (a && a.rz) a.rz.gap = 99; }); await frames(2, { prof: false, hold: ['window.__RZHOLD()'] });
    const rows = (await frames(F, { prof: false, hold: ['window.__RZHOLD()', 'window.__RZA && window.__RZA.rz && (window.__RZA.rz.gap = 99)'] })).rows; out.perf.pre = rows; console.log(' pre (fighting, idle)', JSON.stringify(sumR(rows)));
    await ev(() => window.__RZGO()); }
  const FPS = +(process.env.FPS || 60);
  for (const tm of (process.env.NOSHOT === '1' ? [] : TIMES)) {
    if (tm > now) { now = await step(tm - Math.max(0, now)) ; }
    const tl = await ev(() => { const U = window.__RZU; return U && U.ul ? U.ul.t : -1; }); const name = `${TAG}-t${tm.toFixed(2)}.png`;
    // two drawn frames first (the model's springs and the painter's caches settle), then the kept one
    await frames(2, { prof: false, hold: ['window.__RZHOLD()'] }); await shot(name); out.at[tm] = { t: tl };
    if (process.env.TRACE === '1') { await ev(() => { window.__PFC.trace = {}; }); await frames(1, { prof: false, hold: ['window.__RZHOLD()'] }); const tr = await ev(() => { const t = window.__PFC.trace; window.__PFC.trace = null; return t; });
      const lines = fs.readFileSync(path.resolve(__dirname, '..', process.env.HTML), 'utf8').split('\n'), srcs = fs.readdirSync(path.resolve(__dirname, '../src/js')).filter(f => f.endsWith('.js')).map(f => [f, fs.readFileSync(path.resolve(__dirname, '../src/js', f), 'utf8').split('\n')]);
      const mapLn = ln => { const text = (lines[+ln - 1] || '').trim(); if (text.length < 20) return '?' + ln; for (const [f, L] of srcs) { const i = L.findIndex(x => x.trim() === text); if (i >= 0) return f + '#' + (i + 1); } return '?' + ln; };
      console.log('  trace', Object.entries(tr).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => { const m = k.split(' '); return m[0] + ' ' + mapLn(m[1]) + ' ' + (m[2] || '') + ' x' + v; }).join('\n         ')); }
    if (PERF && process.env.AB === '1') { const on = [], off = [];   // v1 (window.__RZU_V1 = 1) and the current drawing alternating frame by frame at the same moment
      for (let k = 0; k < F; k++) for (const o of (k % 2 ? [0, 1] : [1, 0])) { await ev(o => { window.__RZU_V1 = o; }, o); const r = (await frames(1, { prof: false, hold: ['window.__RZHOLD()'] })).rows[0]; (o ? off : on).push(r); }
      await ev(() => { window.__RZU_V1 = 0; }); out.perf[tm] = { v1: sumR(off), v2: sumR(on) }; console.log(` t=${tm} (ul ${tl.toFixed(2)})\n   v1 ${JSON.stringify(out.perf[tm].v1)}\n   v2 ${JSON.stringify(out.perf[tm].v2)}`); now += 2 * F / 60 + 2 / 60; }
    else if (PERF) { const rows = (await frames(F, { prof: false, hold: ['window.__RZHOLD()'] })).rows;
      const S = sumR(rows); void { ms: +md(rows, 'tot').toFixed(0), js: +(md(rows, 'tot') - md(rows, 'glmMs') - md(rows, 'diGLms')).toFixed(0), upd: +md(rows, 'upd').toFixed(1), fgFlush: +mn(rows, 'fgFlush').toFixed(1), fgQuads: +mn(rows, 'fgQuads').toFixed(0), fgDraws: +mn(rows, 'fgDraws').toFixed(1), fgComp: +mn(rows, 'fgComp').toFixed(1), fgFillMpx: +(mn(rows, 'fgFillV') / 1e6).toFixed(2), glmN: +mn(rows, 'glmN').toFixed(1), glmMpx: +(mn(rows, 'glmA') / 1e6).toFixed(2), compMpx: +((mn(rows, 'diGLA') + mn(rows, 'glmA')) / 1e6).toFixed(2), glmDraws: +mn(rows, 'glmDraw').toFixed(0), ktri: +(mn(rows, 'glmVerts') / 3e3).toFixed(0), grad: +mn(rows, 'grad').toFixed(1), cvNew: +mn(rows, 'cvNew').toFixed(1), cvResize: +mn(rows, 'cvResize').toFixed(1), heapKB: +(mn(rows, 'heap') / 1e3).toFixed(0), fillA: +(mn(rows, 'fillRectA') / 1e6).toFixed(2), diMpx: +(mn(rows, 'diA') / 1e6).toFixed(2) };
      out.perf[tm] = S; console.log(` t=${tm} (ul ${tl.toFixed(2)}) ${JSON.stringify(S)}`); now += F / 60 + 2 / 60; }
    else { console.log(` t=${tm} (ul ${tl.toFixed(2)}) -> ${name}`); now += 2 / 60; }
  }
  if (process.env.SUN === '1') console.log(' sunflare cast: ELEM.fx before/after', JSON.stringify(await ev(() => window.__RZSUNN || null)));
  // run to the end: the ultimate ends once, Raziel leaves, the buffers are freed
  await ev(f => { window.__RZFPS = f; }, FPS);
  const fin = await ev(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, AN = D.AN, U = window.__RZU; let k = 0; const fps = window.__RZFPS || 60; for (; k < fps * 25 && (U.ul || AN.S.list.length); k++) { window.__RZHOLD(); G.update(1 / fps); }
    const L = window.__RZLED; for (let j = 0; j < 120; j++) G.update(1 / 60);
    return { startedTwice: !!window.__RZAGAIN, againAfter: !!(window.__RZA && U.start(window.__RZA)), steps: k, ulLeft: !!U.ul, animas: AN.S.list.length, zoomP: D.g.zoomP, cineT: D.g.cineT, dmg: { n: L.n, sum: Math.round(L.sum), mons: L.mons.size, perMonP: (() => { const v = [...L.mons.values()].sort((a, b) => b - a), Pp = window.__RZP; return v.length ? { max: +(v[0] / Pp).toFixed(1), med: +(v[v.length >> 1] / Pp).toFixed(1), min: +(v[v.length - 1] / Pp).toFixed(1) } : null; })(), byPh: Object.fromEntries(Object.entries(L.byPh).map(([k2, v]) => [k2, Math.round(v)])), el: Object.fromEntries(Object.entries(L.el).map(([k2, v]) => [k2, Math.round(v)])) }, gpu: self.RAZIEL_GL && self.RAZIEL_GL.gpuCount ? self.RAZIEL_GL.gpuCount() : null }; });
  out.fin = fin; console.log('end', JSON.stringify(fin));
  // REPEAT=n: n more summons, each to its ultimate's end, in the same page: the JS heap (after a forced GC) and RAZIEL_GL's live buffers after each
  for (let r = 0; r < +(process.env.REPEAT || 0); r++) {
    const rr = await ev(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, AN = D.AN; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, cine: null }); AN.summon();
      for (let k = 0; k < 60 * 8 && !(AN.S.list[0] && AN.S.list[0].rz && AN.S.list[0].rz.ready); k++) { window.__RZHOLD(); G.update(1 / 60); if (k % 6 === 0) { const c = document.getElementById('arcCanvas').getContext('2d'); c.save(); G.draw(c); c.restore(); } }
      const a = AN.S.list[0]; if (!a) return { err: 'no anima' }; a.life = 0.001; const U = AN.rz && AN.rz.ul; let ran = 0;
      for (let k = 0; k < 60 * 22 && AN.S.list.length; k++) { window.__RZHOLD(); G.update(1 / 60); if (U && U.ul) ran = Math.max(ran, U.ul.t); if (k % 10 === 0) { const c = document.getElementById('arcCanvas').getContext('2d'); c.save(); G.draw(c); c.restore(); } }
      for (let k = 0; k < 90; k++) G.update(1 / 60); if (window.gc) window.gc();
      return { ran: +ran.toFixed(2), left: AN.S.list.length, heapMB: +(performance.memory.usedJSHeapSize / 1e6).toFixed(1), gpu: self.RAZIEL_GL ? self.RAZIEL_GL.gpuCount() : null }; });
    console.log(' repeat', r + 1, JSON.stringify(rr)); (out.rep = out.rep || []).push(rr); }
  out.errors = errors; console.log('page errors', errors.length, errors.slice(0, 5));
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
  await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
