// (v444 SL) Samael's frame cost, summoned and as the Gate of Aries's boss, at a phone's size (390x844, DPR 3: the game canvas at its cap),
// every GPU path forced on the software rasteriser, measured by tests/_pf-lib.js: v443's drawing (window.__SL_OFF = 1) and v444's
// alternating frame by frame in one page (F frames a side), and the same frame (clock, dice, Date.now held) drawn off / on / off (the
// control) compared pixel by pixel (off | on | diff x16 into OUTDIR). Per scenario: this machine's frame ms (median), the WebGL -> 2D
// copies a frame (FGFX layers laid + GLM passes laid), GLM passes and their GL pixels, the composite area (Mpx, canvas px), the JS ms (the
// frame less the time waiting on the GPU's copies), the GLM triangles.
// Summon (the Garden, section 2's fight, 20 of the brood round the pet): idle, charge (mid-gallop), perd (crescents in flight), over (the
// corona), impact (the landing), cata (the Cataclysm State at rest), wrath (Wrath of the Fallen just after the impact).
// Boss (the Ramforge's Cataclysm Altar, its harness holding the AI): b-idle, b-charge, b-perd, b-over, b-impact, b-cata, b-wrath (the
// meteor's impact), b-phase (a phase break's roar and ring).
// usage: HTML=<test html> node tests/_sl-perf.js   env: SCN (comma list; default all), F (4), DPR (3), OUT=file.json, OUTDIR (shots/v444-SL/perf),
//   SAME=0 (no pixel compare), GQ (high|balanced|perf), ONLY=on|off (no A/B: just one side, e.g. on the v443 build)
const { open, summ } = require('./_pf-lib');
const fs = require('fs'), path = require('path');
const ALL = 'idle,charge,perd,over,impact,cata,wrath,b-idle,b-charge,b-perd,b-over,b-impact,b-cata,b-phase,b-wrath';
const SCN = (process.env.SCN || ALL).split(','), F = +(process.env.F || 4);
const GLMLOG = () => { window.__SPT = { n: 0, px: 0, big: 0 };
  for (const G of [self.WebGLRenderingContext, self.WebGL2RenderingContext]) { if (!G) continue; const P = G.prototype, o = P.viewport; P.viewport = function (x, y, w, h) { if (this.__pfK === 'glm' && w * h > 64) { const T = window.__SPT; T.n++; T.px += w * h; T.big = Math.max(T.big, w * h); } return o.apply(this, arguments); }; }
  window.__PFX = () => { const T = window.__SPT; return { glmPass: T.n, glmPx: T.px }; }; };
(async () => {
  process.env.RIFT = 'garden';
  const T = await open({ html: process.env.HTML, dpr: +(process.env.DPR || 3), rift: 'garden', flags: { __SM_GL: 1, __SM_GLHQ: 1 }, init: GLMLOG }); const { page, errors, start, frames } = T;
  await page.evaluate(GQ => { const P = window.__pp; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.eq = 'aries'; P.st.animas.res = null; P.st.dlv = 33; if (GQ) P.st.gq = GQ; P.riftState().seals.caldera = 1; }, process.env.GQ || '');
  const out = { html: process.env.HTML, scen: {} }, OUTD = path.resolve(__dirname, '..', process.env.OUTDIR || 'shots/v444-SL/perf'); fs.mkdirSync(OUTD, { recursive: true });
  const ev = (f, a) => page.evaluate(f, a);
  const HOLD = ['window.__SLHOLD && window.__SLHOLD()'];
  const same = async name => { if (process.env.SAME === '0' || process.env.ONLY) return null; const r = await page.evaluate(async () => { const P = window.__pp, A = P.arc, G = A.game, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'), F = self.NIDHOGG_MOVES.FGFX;
      const pn = performance.now.bind(performance), mr = Math.random, dn = Date.now, T0 = pn(), D0 = dn();
      const draw = off => { window.__SL_OFF = off; performance.now = () => T0; Date.now = () => D0; let s = 777; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; try { c.save(); G.draw(c); c.restore(); if (F.frameEnd) F.frameEnd(); if (P.retro) P.retro.post(cv, c); } finally { performance.now = pn; Math.random = mr; Date.now = dn; } return c.getImageData(0, 0, cv.width, cv.height); };
      const a = draw(1), b = draw(0), a0 = draw(1); window.__SL_OFF = 0; let n8 = 0, n24 = 0, mx = 0, c8 = 0, sum = 0; const d = new Uint8ClampedArray(a.data.length);
      for (let i = 0; i < a.data.length; i += 4) { let m = 0, q = 0; for (let k = 0; k < 3; k++) { m = Math.max(m, Math.abs(a.data[i + k] - b.data[i + k])); q = Math.max(q, Math.abs(a.data[i + k] - a0.data[i + k])); } if (q > 8) c8++; if (m > 8) n8++; if (m > 24) n24++; sum += m; if (m > mx) mx = m; const e = Math.min(255, m * 16); d[i] = e; d[i + 1] = e; d[i + 2] = e; d[i + 3] = 255; }
      const sh = document.createElement('canvas'), w = cv.width, h = cv.height; sh.width = w * 3 + 16; sh.height = h; const x = sh.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, sh.width, h); x.putImageData(a, 0, 0); x.putImageData(b, w + 8, 0); x.putImageData(new ImageData(d, w, h), w * 2 + 16, 0);
      return { px: a.data.length / 4, n8, n24, mean: +(sum / (a.data.length / 4)).toFixed(3), max: mx, ctrl8: c8, png: sh.toDataURL('image/png') }; });
    fs.writeFileSync(path.join(OUTD, `same-${name}.png`), Buffer.from(r.png.split(',')[1], 'base64')); delete r.png; return r; };
  const md = (L, k) => { const v = L.map(r => r[k] || 0).sort((a, b) => a - b); return v[v.length >> 1]; }, mn = (L, k) => L.reduce((a, r) => a + (r[k] || 0), 0) / L.length;
  const S = L => ({ ms: +md(L, 'tot').toFixed(0), js: +(md(L, 'tot') - md(L, 'glmMs') - md(L, 'diGLms')).toFixed(0), copies: +(mn(L, 'diGL') + mn(L, 'glmN')).toFixed(1), fg: +mn(L, 'diGL').toFixed(1), glm: +mn(L, 'glmN').toFixed(1), glmPass: +mn(L, 'x_glmPass').toFixed(1),
    glmMpx: +(mn(L, 'x_glmPx') / 1e6).toFixed(2), compMpx: +((mn(L, 'diGLA') + mn(L, 'glmA')) / 1e6).toFixed(2), ktri: +(mn(L, 'glmVerts') / 3e3).toFixed(0), glmDraws: +mn(L, 'glmDraw').toFixed(0), glmRsz: +mn(L, 'cvResizeGLM').toFixed(1), fgFlush: +mn(L, 'fgFlush').toFixed(1), grad: +mn(L, 'grad').toFixed(1), heapKB: +(mn(L, 'heap') / 1e3).toFixed(0) });
  const measure = async (name, extra) => { const hold = HOLD.concat(extra || []); await frames(2, { prof: false, hold });
    const px = await same(name); const on = [], off = [];
    for (let k = 0; k < F; k++) for (const o of (process.env.ONLY ? [process.env.ONLY === 'off' ? 1 : 0] : k % 2 ? [0, 1] : [1, 0])) { await ev(o => { window.__SL_OFF = o; }, o); const r = (await frames(1, { prof: false, hold })).rows[0]; (o ? off : on).push(r); }
    await ev(() => { window.__SL_OFF = 0; });
    const probe = await ev(() => { const G = window.SAMAEL_GL, S2 = G && G.STATS; return S2 && S2.n ? [S2.W, S2.H, S2.items] : null; });
    const r = { v443: off.length ? S(off) : null, v444: on.length ? S(on) : null, px, model: probe }; out.scen[name] = r;
    console.log(` ${name.padEnd(9)} v443 ${JSON.stringify(r.v443)}\n ${''.padEnd(9)} v444 ${JSON.stringify(r.v444)}\n ${''.padEnd(9)} same ${JSON.stringify(px)} model ${JSON.stringify(probe)}`);
    if (process.env.WHERE === '1') { const seq = await ev(() => { const P = window.__pp, G = P.arc.game, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'), F = self.NIDHOGG_MOVES.FGFX, P2 = CanvasRenderingContext2D.prototype;
        const who = () => (new Error().stack || '').split('\n').slice(3, 6).map(l => { const m = l.match(/at ([^ ]+) .*:(\d+):\d+\)?$/); return m ? m[1] + ':' + m[2] : '?'; }).join(' < ');
        const SEQ = []; let n2 = 0; const odi = P2.drawImage, ofr = P2.fillRect, ofl = P2.fill, f0 = F.flush, b0 = F.begin; let Qc = null;
        P2.drawImage = function (s) { if (this === c) { if (s && s.__pfGL === 'glm') { SEQ.push(['GLM', n2, who()]); n2 = 0; } else if (s && s.__pfGL) SEQ.push(['lay', n2, '']); else n2++; } return odi.apply(this, arguments); };
        P2.fillRect = function () { if (this === c) n2++; return ofr.apply(this, arguments); }; P2.fill = function () { if (this === c) n2++; return ofl.apply(this, arguments); };
        F.begin = function () { Qc = b0.apply(this, arguments); return Qc; }; F.flush = function (cc) { if (cc === c && Qc && (Qc.nl || Qc.ns || Qc.nwl || Qc.nws)) { SEQ.push(['FG', n2, who(), (Qc.nl / 6 | 0) + (Qc.ns / 6 | 0)]); n2 = 0; } return f0.apply(this, arguments); };
        try { c.save(); G.draw(c); c.restore(); if (F.frameEnd) F.frameEnd(); } finally { P2.drawImage = odi; P2.fillRect = ofr; P2.fill = ofl; F.flush = f0; F.begin = b0; } return SEQ; });
      const lines = fs.readFileSync(path.resolve(__dirname, '..', process.env.HTML), 'utf8').split('\n'), srcs = fs.readdirSync(path.resolve(__dirname, '../src/js')).map(f => [f, fs.readFileSync(path.resolve(__dirname, '../src/js', f), 'utf8').split('\n')]);
      const mapLn = s => s.replace(/:(\d+)/g, (m, ln) => { const text = (lines[+ln - 1] || '').trim(); if (text.length < 20) return m; for (const [f, L] of srcs) { const i = L.findIndex(x => x.trim() === text); if (i >= 0) return ':' + f.replace(/\.js$/, '').slice(0, 14) + '#' + (i + 1); } return m; });
      for (const q of seq) console.log('     ', q[0].padEnd(4), String(q[1]).padStart(4), mapLn(q[2] || ''), q[3] != null ? q[3] : ''); }
    if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out)); return r; };
  const SUM = SCN.filter(s => !s.startsWith('b-')), BOSS = SCN.filter(s => s.startsWith('b-'));
  if (SUM.length) {
    const t0 = Date.now(); await start(3);
    const info = await ev(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g;
      for (let k = 0; k < 90; k++) G.update(1 / 60);
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
      for (let k = 0; k < 6000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; let ok = true; for (let dx = -7; dx <= 8 && ok; dx++) for (let dy = -5; dy <= 5 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
      if (best) { me.x = best.x - 1; me.y = best.y + 1; }
      D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still).forEach((m, i) => { if (i < 20) { const b = i / 20 * 6.283, r = 2.0 + (i % 4) * 1.0; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 1.5 + Math.sin(b) * r * 0.75, hp: 1e9, maxhp: 1e9, aggro: true, spd: 0, atkCd: 99, dmg: 0 }); } });
      g.intro = 0; D.banners.length = 0; D.SKIP.fog = true; me.face = 1;
      window.__SLHOLD = () => { me.hp = D.ST.hp; me.mp = 999; for (const m of D.mons) m.atkCd = 99; if (D.eshots) D.eshots.length = 0; const a = D.AN && D.AN.S.list[0]; if (a && a.sm && a.st === 'fight' && !window.__SLFREE) { a.sm.gap = 9; a.life = Math.max(a.life, 20); } };
      for (let k = 0; k < 120; k++) { window.__SLHOLD(); G.update(1 / 60); }
      const AN = D.AN; AN.kit.main.id = 'aries'; AN.kit.main.k = 3; AN.kit.res = null; AN.kit.resonance = null; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); const ok = AN.summon();
      for (let k = 0; k < 60 * 5.5; k++) { window.__SLHOLD(); G.update(1 / 60); } const a = AN.S.list[0];
      return { ok, st: a && a.st, cv: [document.getElementById('arcCanvas').width, document.getElementById('arcCanvas').height] }; });
    console.log(`== summon (Garden stage 3, ${((Date.now() - t0) / 1000).toFixed(0)} s)`, JSON.stringify(info));
    const cast = (kind, secs, pre) => ev(([kind, secs, pre]) => { const G = window.__pp.arc.game, D = G._dbg, a = D.AN.S.list[0]; if (!a || !a.sm) return 'none'; (0, eval)(pre || ''); if (kind) D.AN.sm.cast(a, kind); for (let k = 0; k < Math.round(secs * 60); k++) { window.__SLHOLD(); G.update(1 / 60); } return a.sm.act ? a.sm.act.kind + ' ' + a.sm.act.t.toFixed(2) : 'free'; }, [kind, secs, pre]);
    const rest = () => ev(() => { const G = window.__pp.arc.game, D = G._dbg, a = D.AN.S.list[0]; for (let k = 0; k < 60 * 4 && a && a.sm && a.sm.act; k++) { window.__SLHOLD(); G.update(1 / 60); } if (a && a.sm) { a.sm.over = 0; a.sm.cata = 0; } for (let k = 0; k < 60; k++) { window.__SLHOLD(); G.update(1 / 60); } });
    for (const sc of SUM) {
      if (sc === 'idle') { await rest(); await measure('idle'); }
      else if (sc === 'charge') { await rest(); console.log('  ', await cast('charge', 0.8)); await measure('charge'); }
      else if (sc === 'perd') { await rest(); console.log('  ', await cast('perd', 1.25)); await measure('perd'); }
      else if (sc === 'over') { await rest(); console.log('  ', await cast('over', 1.5)); await measure('over'); }
      else if (sc === 'impact') { await rest(); console.log('  ', await cast('impact', 1.55)); await measure('impact'); }
      else if (sc === 'cata') { await rest(); console.log('  ', await cast(null, 1.0, 'window.__pp.arc.game._dbg.AN.S.list[0].sm.cata = 12; window.__pp.arc.game._dbg.AN.S.list[0].sm.ruin = 100;')); await measure('cata', ['(() => { const a = window.__pp.arc.game._dbg.AN.S.list[0]; if (a && a.sm) a.sm.cata = Math.max(a.sm.cata, 6); })()']); }
      else if (sc === 'wrath') { await rest(); await ev(() => { window.__SLFREE = 1; const G = window.__pp.arc.game, D = G._dbg, a = D.AN.S.list[0]; a.life = 0.01; for (let k = 0; k < 60 * 9.6; k++) { window.__SLHOLD(); G.update(1 / 60); } }); await measure('wrath'); }
    }
  }
  if (BOSS.length) {
    const t0 = Date.now();
    await ev(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startGate('caldera'); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1800000, polling: 500 }); await ev(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 600000, polling: 500 });
    const info = await ev(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; Math.random = (s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(4242);
      const U = P.arc.game, D = U._dbg, me = D.me, st = s => { let t = 0; while (t < s) { me.hp = D.ST.hp; U.update(1 / 30); t += 1 / 30; } }, hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };
      const m = D.RIFT.self.mod; st(1.5); m.solve(); for (let i = 0; i < 900 && m.S.phase !== 'open'; i++) st(0.1); hold(16.5, 21.5); st(0.3);
      for (let i = 0; i < 200 && m.S.phase !== 'boss' && m.S.phase !== 'won'; i++) { hold(16.5, 19.4); st(0.1); }
      const SB = window.ARIES_BOSS; for (let i = 0; i < 300 && SB.test.S && SB.test.S.mode !== 'fight'; i++) { const s = SB.test.S; hold(s.m.x, s.m.y + 5.5); st(1 / 30); }
      const S = SB.test.S; SB.test.hold(true); S.gapOff = 0.4; D.g.intro = 0; if (D.SKIP) D.SKIP.fog = true;
      window.__SLHOLD = () => { me.hp = D.ST.hp; me.mp = 999; const s = SB.test.S; if (s && s.m) { s.m.hp = Math.max(s.m.hp, s.m.maxhp * (window.__SLHPF || 0.9)); } };
      hold(S.m.x + 0.6, S.m.y + 5.0); for (let k = 0; k < 30; k++) { window.__SLHOLD(); U.update(1 / 60); }
      return { phase: m.S.phase, mode: S.mode, hp: S.m.maxhp, cv: [document.getElementById('arcCanvas').width, document.getElementById('arcCanvas').height] }; });
    console.log(`== boss (Gate of Aries, ${((Date.now() - t0) / 1000).toFixed(0)} s)`, JSON.stringify(info));
    const force = (kind, secs, pre) => ev(([kind, secs, pre]) => { const U = window.__pp.arc.game, D = U._dbg, SB = window.ARIES_BOSS, S = SB.test.S; (0, eval)(pre || ''); if (kind) SB.test.force(kind); for (let k = 0; k < Math.round(secs * 60); k++) { window.__SLHOLD(); D.me.x = S.m.x + 0.6; D.me.y = S.m.y + 5.0; U.update(1 / 60); } return (S.acts[0] ? S.acts[0].kind + ' ' + S.acts[0].t.toFixed(2) : 'free') + (S.wr ? ' wrath ' + S.wr.t.toFixed(2) : ''); }, [kind, secs, pre]);
    const calm = () => ev(() => { const U = window.__pp.arc.game, SB = window.ARIES_BOSS, S = SB.test.S; SB.test.abortActs(); S.over = 0; S.cata = 0; S.vent = null; S.ventQ = 0; S.waves.length = 0; S.marks.length = 0; for (let k = 0; k < 60 * 2.5; k++) { window.__SLHOLD(); U.update(1 / 60); } });
    for (const sc of BOSS) {
      if (sc === 'b-idle') { await calm(); await measure('b-idle'); }
      else if (sc === 'b-charge') { await calm(); console.log('  ', await force('charge', 1.45)); await measure('b-charge'); }
      else if (sc === 'b-perd') { await calm(); console.log('  ', await force('perd', 2.0)); await measure('b-perd'); }
      else if (sc === 'b-over') { await calm(); console.log('  ', await force('over', 1.6)); await measure('b-over'); }
      else if (sc === 'b-impact') { await calm(); console.log('  ', await force('impact', 2.95)); await measure('b-impact'); }
      else if (sc === 'b-cata') { await calm(); console.log('  ', await force(null, 1.0, 'window.ARIES_BOSS.test.cataclysm()')); await measure('b-cata'); }
      else if (sc === 'b-phase') { await calm(); console.log('  ', await force(null, 0.75, 'window.ARIES_BOSS.test.phaseUp()')); await measure('b-phase'); }
      else if (sc === 'b-wrath') { await calm(); await ev(() => { window.__SLHPF = 0.04; }); console.log('  ', await force('wrath', 8.3)); await measure('b-wrath'); await ev(() => { window.__SLHPF = 0.9; }); }
    }
  }
  out.errors = errors; if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out));
  console.log('\npage errors', errors.length, errors.slice(0, 4));
  await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
