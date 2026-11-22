// v450 SF: Snake Flame's mechanics on a dungeon floor, the game stepped by hand: the timeline (12 ticks at T_C + 0, 0.5 .. 5.5, the
// finisher at T_C + 6), the finisher the largest hit, the tiers (radius +15 / +30 %), dt 1/60 vs 1/4 (the same hits), Fewer effects
// (the same hits), a boss (damage, no knock-back), enemies only, the cooldown (30 s from the cast at every tier), the caster downed
// mid-cast, the stage left mid-cast (GPU buffers freed), no page errors.
// usage: HTML=<test html> node tests/_sf-mech.js   env: GL=1 (GLM + FGFX forced on the software rasteriser), SHOTS=1 (a few frames into shots/v450-SF/mech)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const ok = (c, msg, v) => { console.log((c ? 'PASS ' : 'FAIL ') + msg + (v !== undefined ? '  ' + JSON.stringify(v) : '')); if (!c) process.exitCode = 1; };
(async () => {
  const GL = process.env.GL === '1';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (/Snake Flame|GLM|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  page.setDefaultTimeout(1800000);
  await page.addInitScript(gl => { if (gl) { window.__SF_GL = 1; window.__NG_GL = 1; } }, GL);
  await page.goto('file://' + path.resolve(process.env.HTML)); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 });
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.st.devMoves = true; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1800000, polling: 500 }); await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 }); await page.waitForTimeout(300); await page.evaluate(() => { window.__pp.arc.paused = true; });
  const PRE = `const P = window.__pp, U = P.arc.game, D = U._dbg, me = D.me, g = D.g, SF = P.ELEM_IMPL.fire.ult.snakeflame, H = D.ELEM.H;
    const step = (secs, each, dt) => { dt = dt || 1 / 60; let t = 0; while (t < secs - 1e-9) { U.update(dt); t += dt; if (each && each(t) === true) break; } return t; };
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  // an open place: the pet there, the floor's monsters held (no moves, no blows), a ring of them round a target point ahead
  const setup = await ev(`for (let k = 0; k < 30; k++) U.update(1 / 60); g.intro = 0; g.bossIntro = 0;
    // the most open place near the start (walkable tiles within 5)
    let best = null, bs = -1; for (let k = 0; k < 3000; k++) { const sx = Math.floor(me.x + (Math.random() - 0.5) * 80) + 0.5, sy = Math.floor(me.y + (Math.random() - 0.5) * 80) + 0.5; if (!W(sx, sy)) continue; let n = 0; for (let dx = -5; dx <= 5; dx++) for (let dy = -5; dy <= 5; dy++) if (dx * dx + dy * dy <= 25 && W(sx + dx, sy + dy)) n++; if (n > bs) { bs = n; best = { x: sx, y: sy }; } }
    if (!best) return null; me.x = best.x; me.y = best.y; for (let r = 4.5; r < 9; r += 0.5) { let done = false; for (let a = 0; a < 6.28 && !done; a += 0.3) { const x = best.x + Math.cos(a) * r, y = best.y + Math.sin(a) * r; if (W(x, y)) { me.x = x; me.y = y; done = true; } } if (done) break; }
    window.__T = { x: best.x, y: best.y };
    const L = D.mons.filter(m => !m.dead && !m.boss && !m.fiend && !m.fobj); window.__L = L.slice(0, 12);
    window.__hold = () => { me.hp = D.ST.hp; me.mp = 999; for (const m of D.mons) { m.atkCd = 99; m.cd = 99; m.spd = 0; if (m.__px) { m.x = m.__px[0]; m.y = m.__px[1]; } window.__kbMax = Math.max(window.__kbMax || 0, m.boss ? Math.hypot(m.kbx || 0, m.kby || 0) : 0); } if (D.eshots) D.eshots.length = 0; D.zones.filter(z => z.own !== 'pet').forEach(z => { z.life = 0; z.fn = null; }); };
    return { mons: D.mons.filter(m => !m.dead).length, held: window.__L.length, at: best, open: bs };`);
  ok(setup && setup.held >= 10, 'an open place and the floor\'s monsters', setup);
  // place (per tier: a dry cast gives the move's own centre and footprint): 10 in the footprint (radii 0.4 .. R - 0.9), 2 outside it
  const place = evo => ev(`const T = window.__T, L = window.__L; D.ELEM.ult('snakeflame', { a: 0, base: 1, E: { color: '#FF7A2E' }, el: 'fire', e8: 'fire', evo: arg, tx: T.x, ty: T.y, A: {}, up: arg >= 7 }); const f = D.ELEM.fx[D.ELEM.fx.length - 1], S = f.S; f.life = 0; U.update(1 / 60);
    const R = S.R, cx = S.cx, cy = S.cy, put = [], free = (x, y) => W(x, y) && put.every(p => Math.hypot(p[0] - x, p[1] - y) > 0.7);
    L.forEach((m, i) => { let x = null, y = null; for (let j = 0; j < 80 && x == null; j++) { const a = i * 2.4 + j * 0.37, r = i < 10 ? Math.max(0.3, 0.4 + (R - 0.9) * i / 9 - j * 0.03) : R + 0.9 + j * 0.08, qx = cx + Math.cos(a) * r, qy = cy + Math.sin(a) * r;
        if (!free(qx, qy)) continue; const inn = S.inFoot(qx, qy, m.r * 0.5), sure = S.inFoot(qx, qy, m.r * 0.5 + 0.5); if (i < 10 ? inn : !sure) { x = qx; y = qy; } }
      if (x == null) { x = cx + 40; y = cy + 40; } put.push([x, y]); m.__px = [x, y]; Object.assign(m, { x, y, hp: 1e9, maxhp: 1e9, kbx: 0, kby: 0, stun: 0, chill: 0, freeze: 0, dead: false, boss: false, aggro: true }); m.__i = i; });
    return { R, cx, cy, put };`, evo);
  // one cast through the elemental runner at a fixed base (100), the hits logged at X.hitMon (before crits): [time from the cast, monster, damage, kb]
  const cast = (o) => ev(`const o = arg; window.__hold(); P.st.lowFx = !!o.low; const T = window.__T, X = H.X, h0 = X.hitMon, LOG = []; const t0 = g.t;
    X.hitMon = (m, d, op) => { LOG.push([+(g.t - t0).toFixed(4), m.__i == null ? -1 : m.__i, +d.toFixed(4), op && op.kb ? op.kb : 0, !!m.boss]); return h0(m, d, op); };
    const n0 = D.ELEM.fx.length; D.ELEM.ult('snakeflame', { a: -Math.PI / 2, base: 100, E: { color: '#FF7A2E' }, el: 'fire', e8: 'fire', evo: o.evo, tx: T.x, ty: T.y, A: {}, up: o.evo >= 7 });
    const f = D.ELEM.fx[D.ELEM.fx.length - 1], S = f.S; let fxT = 0, maxFx = 0;
    const pos0 = window.__L.map(m => [m.x, m.y]);
    let dead = null; step(o.secs || 11.5, t => { window.__hold(); if (o.kill != null && t >= o.kill && dead == null) { me.dead = true; dead = g.t - t0; } maxFx = Math.max(maxFx, D.ELEM.fx.length - n0); if (D.ELEM.fx.indexOf(f) < 0 && !fxT) fxT = g.t - t0; }, o.dt || 1 / 60);
    if (o.kill != null) me.dead = false;
    X.hitMon = h0; P.st.lowFx = false; const moved = window.__L.map((m, i) => Math.hypot(m.x - pos0[i][0], m.y - pos0[i][1]));
    return { LOG, S: { R: S.R, tier: S.tier, T_C: S.T_C, T_X: S.T_X, log: S.log, cells: S.cells, tickD: S.tickD, finD: S.finD, DK: S.DK, cx: S.cx, cy: S.cy }, fxT, left: D.ELEM.fx.length - n0 + (D.ELEM.fx.indexOf(f) >= 0 ? 0 : 0), gone: D.ELEM.fx.indexOf(f) < 0, dead, moved, zoom: g.zoomP };`, o);
  const per = LOG => { const M = {}; for (const [t, i, d, kb] of LOG) { const e = M[i] || (M[i] = { n: 0, sum: 0, max: 0, times: [] }); e.n++; e.sum = +(e.sum + d).toFixed(3); e.max = Math.max(e.max, d); e.times.push(t); } return M; };
  const res = {};
  for (const evo of [1, 4, 7]) {
    const pl = await place(evo);
    const a = await cast({ evo, dt: 1 / 60 }), M = per(a.LOG), ins = [...Array(10).keys()], S = a.S; res[evo] = { a, M, R: S.R };
    const ticks = S.log.filter(l => l[0] === 'tick').map(l => +(l[1] - S.T_C).toFixed(3)), fin = S.log.filter(l => l[0] === 'fin');
    ok(ticks.length === 12 && ticks.every((t, k) => Math.abs(t - k * 0.5) < 1e-6) && fin.length === 1 && Math.abs(fin[0][1] - S.T_C - 6) < 1e-6, `evo ${evo}: 12 ticks at T_C + 0, 0.5 .. 5.5 and the finisher at T_C + 6.0 exactly`, { ticks, fin: fin.map(f => +(f[1] - S.T_C).toFixed(3)), T_C: S.T_C });
    ok(ins.every(i => M[i] && M[i].n === 13), `evo ${evo}: each of the 10 in the footprint hit 13 times (12 ticks + 1 finisher)`, ins.map(i => M[i] ? M[i].n : 0));
    ok(!M[10] && !M[11], `evo ${evo}: none outside the footprint (R + 0.7, R + 2)`, { out: [M[10] ? M[10].n : 0, M[11] ? M[11].n : 0] });
    ok(Math.abs(S.tickD - 0.45 * S.DK) < 1e-6 && Math.abs(S.finD - 7 * S.DK) < 1e-6 && ins.every(i => M[i].max === +S.finD.toFixed(4)) && S.finD > S.tickD * 10, `evo ${evo}: a tick 0.45 DK, the finisher 7 DK, the cast's largest hit`, { DK: +S.DK.toFixed(2), tick: +S.tickD.toFixed(2), fin: +S.finD.toFixed(2), total: +(12 * S.tickD + S.finD).toFixed(1) });
    ok(a.gone && a.fxT > 0, `evo ${evo}: the effect ends by itself (at ${a.fxT.toFixed(2)} s)`, { fxT: a.fxT });
    console.log(`   evo ${evo}: R ${S.R.toFixed(2)}  cells ${S.cells}  T_C ${S.T_C}  T_X ${S.T_X}  per enemy ${(12 * S.tickD + S.finD).toFixed(1)} (= ${((12 * S.tickD + S.finD) / S.DK).toFixed(2)} DK, DK ${S.DK.toFixed(1)})`);
    if (evo === 1) {
      await place(evo); const b = await cast({ evo, dt: 1 / 4 }), MB = per(b.LOG);
      const same = ins.concat([10, 11]).every(i => (!M[i] && !MB[i]) || (M[i] && MB[i] && M[i].n === MB[i].n && Math.abs(M[i].sum - MB[i].sum) < 1e-3));
      const bt = L => JSON.stringify(L.map(l => [l[0], l[1]])), ta = ins.map(i => M[i].times.map(x => x.toFixed(2)).join()), tb = ins.map(i => MB[i] ? MB[i].times.map(x => Math.round(x * 4) / 4).join() : '');
      ok(same && bt(a.S.log) === bt(b.S.log), 'dt 1/60 and dt 1/4 give the same hits (count and damage per held enemy) and the same beats (kind, scheduled time)', { a: ins.map(i => M[i] && M[i].sum), b: ins.map(i => MB[i] && MB[i].sum), beats: bt(b.S.log) });
      await place(evo); const l = await cast({ evo, dt: 1 / 60, low: true }), ML = per(l.LOG);
      ok(ins.every(i => ML[i] && ML[i].n === M[i].n && Math.abs(ML[i].sum - M[i].sum) < 1e-3), 'Fewer effects: the same hits', ins.map(i => ML[i] && ML[i].n));
      await place(evo); const bw = await ev(`D.wakeBoss(); const b = g.boss; if (!b) return null; let n = 0; while ((b.act === 'enter' || b.act === 'sleep' || g.bossIntro > 0) && n++ < 600) { g.bossIntro = 0; window.__hold(); U.update(1 / 60); } const m3 = window.__L[3]; b.__px = [m3.__px[0], m3.__px[1]]; m3.__px = [m3.__px[0] + 40, m3.__px[1] + 40]; b.x = b.__px[0]; b.y = b.__px[1]; b.hp = b.maxhp = 1e9; b.kbx = b.kby = 0; b.stun = 0; b.__i = 3; window.__kbMax = 0; return { act: b.act, type: b.type || b.kind, n };`);
      const bo = await cast({ evo, dt: 1 / 60 }), bHits = bo.LOG.filter(r => r[4]), kbB = await ev(`const b = g.boss, r = { kbMax: window.__kbMax, stun: b ? b.stun : null, chill: b ? b.chill : null }; if (b) { b.__px = null; b.hp = 0; b.dead = true; } return r;`);
      ok(bw && bHits.length === 13 && bHits.every(r => r[3] === 0) && !(kbB.stun > 0) && bo.LOG.filter(r => !r[4] && r[2] > 100).every(r => r[3] > 0), 'a boss in the fire takes every beat (13); the move gives it no knock-back or stun (kbMax: the pet\'s own knock trait, if it has one, at the game\'s boss rate); the others are knocked back by the finisher', { wake: bw, boss: bHits.length, kb: bHits.map(r => r[3]).slice(-2), kbB });
      await place(evo);
      const k = await cast({ evo, dt: 1 / 60, kill: 3.0, secs: 3.0 + 2.5 }), after = k.LOG.filter(r => r[0] > k.dead + 1e-6).length;
      ok(after === 0 && k.gone && k.fxT > 0 && k.fxT - k.dead < 0.75, 'the caster downed mid-cast: no hit after, the serpent gone within 0.75 s', { dead: k.dead, gone: k.fxT, after });
    }
  }
  const r1 = res[1].R, r4 = res[4].R, r7 = res[7].R;
  ok(Math.abs(r4 / r1 - 1.15) < 1e-6 && Math.abs(r7 / r1 - 1.3) < 1e-6, 'the footprint: +15% at Adept (evo 4), +30% at Celestial (evo 7)', { r1, r4, r7 });
  // the cooldown: through the real cast (useUlt): 30 s from the cast at every tier; the coil 6 s at every tier
  const cd = await ev(`const out = []; for (const evo of [1, 4, 7]) { window.__hold(); g.cdU = 0; const mv = P.ELEM_LIST.fire.ey_snakeflame; let ab = Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, evo, cost: 100 }); if (evo >= 7) ab = Object.assign({}, ab, { tier: 2, mult: ab.mult * 1.6 }); D.setKit('ult', ab);
      const n0 = D.ELEM.fx.length; D.useUlt(); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; out.push({ evo, cdU: g.cdU, row: mv.cd, fx: D.ELEM.fx.length - n0, coil: f && f.S ? +(f.S.T_X - f.S.T_C).toFixed(3) : null, castT: me.castT });
      step(11, () => { window.__hold(); }); } return out;`);
  ok(cd.every(c => c.cdU === 30 && c.row === 30 && c.fx === 1 && c.coil === 6 && c.castT <= 0.5 + 1e-9), 'the cooldown: 30 s, started by the cast at every tier; the coil 6 s; a short gesture (0.5 s)', cd);
  if (process.env.SHOTS) { /* (a frame mid-coil, for the eye) */ }
  // the JS cost a frame (this machine): the move's update, its rig, and its whole drawing on the path in use (2D unless GL=1), 120 frames mid-coil at Celestial
  const js = await ev(`window.__hold(); D.ELEM.ult('snakeflame', { a: 0, base: 100, E: { color: '#FF7A2E' }, el: 'fire', e8: 'fire', evo: 7, tx: window.__T.x, ty: window.__T.y, A: {}, up: true }); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; step(3.4, () => { window.__hold(); });
    const G = window.SNAKEFLAME_GL, r0 = G.rig; let rig = 0, up = 0, dr = 0; G.rig = Q => { const t = performance.now(); const o = r0(Q); rig += performance.now() - t; return o; }; const u0 = f.update; f.update = (dt, ff) => { const t = performance.now(); u0(dt, ff); up += performance.now() - t; };
    const c = document.getElementById('arcCanvas').getContext('2d'), N = 120; for (let k = 0; k < N; k++) { window.__hold(); U.update(1 / 60); const X = H.sx(f.x), Y = H.sy(f.y), T = D.ELEM.H.X.Tz(), t = performance.now(); c.save(); f.drawUnder.call(f, c, f, X, Y, T, g.t); c.restore(); c.save(); f.draw.call(f, c, f, X, Y, T, g.t); c.restore(); dr += performance.now() - t; }
    G.rig = r0; f.update = u0; step(8, () => { window.__hold(); }); return { updateMs: +(up / N).toFixed(3), rigMs: +(rig / N).toFixed(3), drawMs: +(dr / N).toFixed(3), gl: G.usable() };`);
  console.log('   JS a frame (mid-coil, Celestial):', JSON.stringify(js));
  // the stage left mid-cast: the effect goes with it; the GPU buffers are given back (GL)
  const ex = await ev(`window.__hold(); D.ELEM.ult('snakeflame', { a: 0, base: 100, E: { color: '#FF7A2E' }, el: 'fire', e8: 'fire', evo: 4, tx: window.__T.x, ty: window.__T.y, A: {}, up: false }); step(3, () => { window.__hold(); });
    const cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'); c.save(); U.draw(c); c.restore(); const gpu0 = window.SNAKEFLAME_GL.gpuCount(), fx0 = D.ELEM.fx.length;
    P.closeArcade(true); return { gpu0, fx0, gpu1: window.SNAKEFLAME_GL.gpuCount(), gl: window.SNAKEFLAME_GL.usable() };`);
  ok(ex.fx0 >= 1 && ex.gpu1 === 0 && (!GL || ex.gpu0 > 0), 'the stage left mid-cast: the GPU buffers freed (' + (GL ? 'GL forced' : '2D') + ')', ex);
  ok(!errors.length, 'no page errors', errors.slice(0, 5));
  await browser.close();
})();
