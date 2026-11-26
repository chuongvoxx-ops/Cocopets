// v450 SF, v452 SF2: Snake Flame's mechanics on a dungeon floor, the game stepped by hand: the timeline (12 ticks at T_C + 0, 0.5 .. 5.5,
// the finisher at T_C + 6 when the plunging head reaches the ground), ticks only on the visible fire (each tick's hits are exactly
// the enemies the drawn fire's field reaches at that time), the finisher the largest hit (its footprint the blast's), the roam
// (never through a wall, mostly on screen, over the floor round the pet and aim), the climb (high into the sky), the tiers (+15 / +30 %),
// dt 1/60 vs 1/4 (the same hits), Fewer effects (the same hits), a boss (damage, no knock-back), enemies only, the cooldown (30 s from
// the cast at every tier), the caster downed mid-cast, the stage left mid-cast (GPU buffers freed), no page errors.
// usage: HTML=<test html> node tests/_sf-mech.js   env: GL=1 (GLM + FGFX forced on the software rasteriser)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
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
  // an open place: the pet there, the floor's monsters held (no moves, no blows), 12 of them scattered round a target point ahead
  const setup = await ev(`for (let k = 0; k < 30; k++) U.update(1 / 60); g.intro = 0; g.bossIntro = 0;
    let best = null, bs = -1; for (let k = 0; k < 3000; k++) { const sx = Math.floor(me.x + (Math.random() - 0.5) * 80) + 0.5, sy = Math.floor(me.y + (Math.random() - 0.5) * 80) + 0.5; if (!W(sx, sy)) continue; let n = 0; for (let dx = -5; dx <= 5; dx++) for (let dy = -5; dy <= 5; dy++) if (dx * dx + dy * dy <= 25 && W(sx + dx, sy + dy)) n++; if (n > bs) { bs = n; best = { x: sx, y: sy }; } }
    if (!best) return null; me.x = best.x; me.y = best.y; for (let r = 3.0; r < 9; r += 0.5) { let done = false; for (let a = 1.2; a < 7.5 && !done; a += 0.3) { const x = best.x + Math.cos(a) * r, y = best.y + Math.sin(a) * r; if (W(x, y)) { me.x = x; me.y = y; done = true; } } if (done) break; }
    window.__T = { x: best.x, y: best.y };
    const L = D.mons.filter(m => !m.dead && !m.boss && !m.fiend && !m.fobj); window.__L = L.slice(0, 12);
    for (const m of D.mons) if (!window.__L.includes(m)) { m.__px = [m.x, m.y]; if (!m.boss) m.hp = m.maxhp = 1e9; }   // (every other monster held where it is; one that appears later is held far off: the cast is the same every time)
    window.__hold = () => { me.hp = D.ST.hp; me.mp = 999; for (const m of D.mons) { if (!m.__px) m.__px = [best.x + 60, best.y + 60]; m.atkCd = 99; m.cd = 99; m.spd = 0; if (m.__px) { m.x = m.__px[0]; m.y = m.__px[1]; } if (m.__i != null && (m.under || m.falling)) m.__bad = true; window.__kbMax = Math.max(window.__kbMax || 0, m.boss ? Math.hypot(m.kbx || 0, m.kby || 0) : 0); } if (D.eshots) D.eshots.length = 0; D.zones.filter(z => z.own !== 'pet').forEach(z => { z.life = 0; z.fn = null; }); };
    // the others far off (held where they are: the cast's area is round the pet and the aim)
    const put = []; window.__L.forEach((m, i) => { let x = null, y = null; for (let j = 0; j < 200 && x == null; j++) { const a = i * 2.39 + j * 0.61, r = 0.6 + (i % 6) * 1.05 + j * 0.02, qx = best.x + Math.cos(a) * r, qy = best.y + Math.sin(a) * r * 1.4; if (W(qx, qy) && put.every(p => Math.hypot(p[0] - qx, p[1] - qy) > 0.8)) { x = qx; y = qy; } }
      if (x == null) { x = best.x + 40; y = best.y + 40; } put.push([x, y]); m.__px = [x, y]; Object.assign(m, { x, y, hp: 1e9, maxhp: 1e9, kbx: 0, kby: 0, stun: 0, chill: 0, freeze: 0, dead: false, boss: false, aggro: true }); m.__i = i; });
    // (a monster whose own routine takes it under the ground or into a fall cannot be hit then: such ones are held far off and left out)
    step(12, () => { window.__hold(); }); const bad = window.__L.filter(m => m.__bad).map(m => m.__i); for (const m of window.__L) if (m.__bad) { m.__px = [best.x + 60, best.y + 60]; m.__out = true; }
    return { mons: D.mons.filter(m => !m.dead).length, held: window.__L.length, left: bad, at: best, open: bs, pet: [+me.x.toFixed(2), +me.y.toFixed(2)] };`);
  ok(setup && setup.held >= 10, 'an open place and the floor\'s monsters', setup);
  const reset = () => ev(`window.__L.forEach(m => { m.x = m.__px[0]; m.y = m.__px[1]; Object.assign(m, { hp: 1e9, maxhp: 1e9, kbx: 0, kby: 0, stun: 0, dead: false, boss: false }); }); return 1;`);
  // one cast through the elemental runner at a fixed base (100), the hits logged at X.hitMon (before crits): [time from the cast, monster, damage, kb, boss, beat]
  const cast = (o) => ev(`const o = arg; window.__hold(); P.st.lowFx = !!o.low; const T = window.__T, X = H.X, h0 = X.hitMon, LOG = []; const t0 = g.t; let S = null;
    X.hitMon = (m, d, op) => { LOG.push([+(g.t - t0).toFixed(4), m.__i == null ? (m.boss ? 99 : -1) : m.__i, +d.toFixed(4), op && op.kb ? op.kb : 0, !!m.boss, S ? S.log.length : -1]); return h0(m, d, op); };
    const LIV = {}, l0 = H.living; H.living = () => { const L = l0(); if (S) LIV[S.log.length] = window.__L.filter(m => L.includes(m)).map(m => m.__i); return L; };   // (who the game counts as hittable at each beat: a monster gone under the ground is not)
    const n0 = D.ELEM.fx.length; D.ELEM.ult('snakeflame', { a: -Math.PI / 2, base: 100, E: { color: '#FF7A2E' }, el: 'fire', e8: 'fire', evo: o.evo, tx: T.x, ty: T.y, A: {}, up: o.evo >= 7 });
    const f = D.ELEM.fx[D.ELEM.fx.length - 1]; S = f.S; let fxT = 0;
    // the camera at the cast (the view the roam is measured against)
    const Wv = U._dbg && P.arc ? (document.getElementById('arcCanvas').clientWidth || 390) : 390, Hv = document.getElementById('arcCanvas').clientHeight || 844;
    const view = []; let dead = null, zMax = 0;
    step(o.secs || 11.5, t => { window.__hold(); const tt = g.t - t0; if (o.kill != null && tt >= o.kill && dead == null) { me.dead = true; dead = tt; }
      if (tt > S.T_C && tt < S.T_CL) { const hp = S.headAt(tt); if (view.length % 30 === 0) (window.__VS = window.__VS || []).push([Math.round(H.sx(hp[0])), Math.round(H.sy(hp[1]) - hp[2] * H.X.Tz() * 0.8), +hp[0].toFixed(1), +hp[1].toFixed(1)]); view.push(H.sx(hp[0]) > 0 && H.sx(hp[0]) < Wv && H.sy(hp[1]) - hp[2] * H.X.Tz() * 0.8 > 0 && H.sy(hp[1]) < Hv ? 1 : 0); }
      if (tt > S.T_CL && tt < S.T_X) zMax = Math.max(zMax, S.headAt(tt)[2]);
      if (D.ELEM.fx.indexOf(f) < 0 && !fxT) fxT = tt; }, o.dt || 1 / 60);
    if (o.kill != null) me.dead = false;
    X.hitMon = h0; H.living = l0; P.st.lowFx = false;
    // each tick's expected hits: the held monsters the fire's field reaches at the tick's time (the same field the floor's fire is drawn from)
    const TU = SF.TUNE, exp = S.log.map((l, b) => window.__L.map(m => !(LIV[b] || []).includes(m.__i) ? 0 : l[0] === 'tick' ? (S.fieldM(m, l[1]) >= TU.burnMin ? 1 : 0) : (S.inFootX(m.x, m.y, m.r * 0.5) ? 1 : 0)));
    const away = window.__L.filter(m => S.log.some((l, b) => !(LIV[b] || []).includes(m.__i))).map(m => m.__i);
    const cam = { pet: [+me.x.toFixed(1), +me.y.toFixed(1)], sxPet: Math.round(H.sx(me.x)), syPet: Math.round(H.sy(me.y)), T: +H.X.Tz().toFixed(1), Wv, Hv, area: S.area && [+S.area.x.toFixed(1), +S.area.y.toFixed(1)], aim: [+S.cx.toFixed(1), +S.cy.toFixed(1)] };
    const hx = S.headAt(S.T_X), fp = S.floorPath(); let inWall = 0, overGap = 0; for (const p of fp) { if (D.blocked(p[0], p[1], 0.25, 1)) inWall++; if (!p[3]) overGap++; }
    let lifted = 0; for (const p of fp) if (!p[3] && p[2] > 0.5) lifted++;
    const bx = fp.map(p => p[0]), by = fp.map(p => p[1]);
    return { LOG, exp, S: { RX: S.RX, TW: S.TW, tier: S.tier, T_C: S.T_C, T_X: S.T_X, T_CL: S.T_CL, T_P: S.T_P, log: S.log, cells: S.cells, bcells: S.bcells, jets: S.jets, tickD: S.tickD, finD: S.finD, DK: S.DK, cx: S.cx, cy: S.cy, S1: S.S1, LB: S.LB },
      fxT, gone: D.ELEM.fx.indexOf(f) < 0, dead, away, cam, vs: (window.__VS || []).splice(0), head: hx.map(v => +v.toFixed(3)), zMax: +zMax.toFixed(2), onView: view.length ? +(view.reduce((a, b) => a + b, 0) / view.length).toFixed(3) : 0,
      path: { n: fp.length, inWall, overGap, lifted, w: +(Math.max(...bx) - Math.min(...bx)).toFixed(1), h: +(Math.max(...by) - Math.min(...by)).toFixed(1) } };`, o);
  const per = LOG => { const M = {}; for (const [t, i, d] of LOG) { const e = M[i] || (M[i] = { n: 0, sum: 0, max: 0, times: [] }); e.n++; e.sum = +(e.sum + d).toFixed(3); e.max = Math.max(e.max, d); e.times.push(t); } return M; };
  const res = {}, held = [...Array(12).keys()].filter(i => !(setup.left || []).includes(i));
  for (const evo of [1, 4, 7]) {
    await reset();
    const a = await cast({ evo, dt: 1 / 60 }), M = per(a.LOG), S = a.S; res[evo] = { a, M };
    const ticks = S.log.filter(l => l[0] === 'tick').map(l => +(l[1] - S.T_C).toFixed(3)), fin = S.log.filter(l => l[0] === 'fin');
    ok(ticks.length === 12 && ticks.every((t, k) => Math.abs(t - k * 0.5) < 1e-6) && fin.length === 1 && Math.abs(fin[0][1] - S.T_C - 6) < 1e-6, `evo ${evo}: 12 ticks at T_C + 0, 0.5 .. 5.5 and the finisher at T_C + 6.0 exactly`, { ticks, fin: fin.map(f => +(f[1] - S.T_C).toFixed(3)), T_C: S.T_C });
    ok(Math.abs(S.T_X - S.T_C - 6) < 1e-9 && Math.abs(a.head[0] - S.cx) < 0.05 && Math.abs(a.head[1] - S.cy) < 0.05 && Math.abs(a.head[2]) < 0.05, `evo ${evo}: the plunging head reaches the ground at the target exactly at T_C + 6.0 (the climb from T_C + ${(S.T_CL - S.T_C).toFixed(2)}, the plunge from T_C + ${(S.T_P - S.T_C).toFixed(2)})`, { head: a.head, at: [+S.cx.toFixed(3), +S.cy.toFixed(3)] });
    // each beat's hits on the held monsters: exactly those on the fire
    let mism = 0, hitT = 0; const tickHits = [], mm = []; S.log.forEach((l, b) => { const got = held.map(i => a.LOG.some(r => r[5] === b && r[1] === i) ? 1 : 0); for (const i of held) if (got[i] !== a.exp[b][i]) { mism++; mm.push([b, i, got[i], a.exp[b][i]]); } if (l[0] === 'tick') { const n = got.reduce((x, y) => x + y, 0); hitT += n; tickHits.push(n); } });
    ok(mism === 0 && hitT >= 6, `evo ${evo}: every tick hits exactly the held enemies standing in the visible fire (its field >= burnMin at that time), the finisher exactly those in the blast's footprint`, { mismatches: mism, mm: mm.slice(0, 6), tickHitsPerBeat: tickHits, finHits: held.filter(i => a.exp[S.log.length - 1][i]).length });
    const dup = S.log.some((l, b) => { const ids = a.LOG.filter(r => r[5] === b).map(r => r[1]).filter(i => i >= 0); return new Set(ids).size !== ids.length; });
    ok(!dup, `evo ${evo}: one hit per enemy per beat (the beat's Map)`);
    const finHits = a.LOG.filter(r => r[2] === +S.finD.toFixed(4)), maxTick = Math.max(0, ...a.LOG.filter(r => r[2] !== +S.finD.toFixed(4)).map(r => r[2]));
    ok(Math.abs(S.tickD - 0.5 * S.DK) < 1e-6 && Math.abs(S.finD - 7 * S.DK) < 1e-6 && finHits.length > 0 && S.finD > maxTick * 10, `evo ${evo}: a tick 0.5 DK, the finisher 7 DK, the cast's largest hit`, { DK: +S.DK.toFixed(2), tick: +S.tickD.toFixed(2), fin: +S.finD.toFixed(2), finHits: finHits.length });
    ok(a.path.inWall === 0 && a.path.n > 200, `evo ${evo}: the roam never goes through a wall (${a.path.n} path points, ${a.path.overGap} over a gap, ${a.path.lifted} of them lifted), spanning ${a.path.w} x ${a.path.h} tiles`, a.path);
    ok(a.onView >= 0.6, `evo ${evo}: the head is on screen most of the roam (${(a.onView * 100).toFixed(0)} %)`, { onView: a.onView, cam: a.cam, away: a.away, vs: a.vs });
    ok(a.zMax >= 12, `evo ${evo}: it climbs into the sky (the head ${a.zMax} tiles up)`, { zMax: a.zMax });
    ok(a.gone && a.fxT > 0, `evo ${evo}: the effect ends by itself (at ${a.fxT.toFixed(2)} s)`, { fxT: a.fxT });
    const tot = held.map(i => M[i] ? +(M[i].sum / S.DK).toFixed(2) : 0), nT = held.map(i => M[i] ? M[i].n - (M[i].max === +S.finD.toFixed(4) ? 1 : 0) : 0);
    console.log(`   evo ${evo}: RX ${S.RX.toFixed(2)} TW ${S.TW.toFixed(2)}  cells ${S.cells} (blast ${S.bcells}, jets ${S.jets})  T_C ${S.T_C} T_X ${S.T_X}  per held enemy: ticks ${JSON.stringify(nT)}  total DK ${JSON.stringify(tot)}  (max ${Math.max(...tot)}, DK ${S.DK.toFixed(1)})`);
    if (evo === 1) {
      await reset(); const b = await cast({ evo, dt: 1 / 4 }), MB = per(b.LOG);
      const cmp = held.filter(i => !a.away.includes(i) && !b.away.includes(i));
      const same = cmp.every(i => (!M[i] && !MB[i]) || (M[i] && MB[i] && M[i].n === MB[i].n && Math.abs(M[i].sum - MB[i].sum) < 1e-3));
      const bt = L => JSON.stringify(L.map(l => [l[0], l[1]]));
      ok(same && bt(a.S.log) === bt(b.S.log), 'dt 1/60 and dt 1/4 give the same hits (count and damage per held enemy) and the same beats (kind, scheduled time, hits)', { a: held.map(i => M[i] && M[i].sum), b: held.map(i => MB[i] && MB[i].sum) });
      await reset(); const l = await cast({ evo, dt: 1 / 60, low: true }), ML = per(l.LOG);
      ok(held.filter(i => !a.away.includes(i) && !l.away.includes(i)).every(i => (!M[i] && !ML[i]) || (ML[i] && M[i] && ML[i].n === M[i].n && Math.abs(ML[i].sum - M[i].sum) < 1e-3)), 'Fewer effects: the same hits', held.map(i => ML[i] && ML[i].n));
      // a boss at the target (where the plunge strikes and the fire is laid as it surges out): damage, no knock-back or stun
      await reset(); const bw = await ev(`D.wakeBoss(); const b = g.boss; if (!b) return null; let n = 0; while ((b.act === 'enter' || b.act === 'sleep' || g.bossIntro > 0) && n++ < 600) { g.bossIntro = 0; window.__hold(); U.update(1 / 60); } const T = window.__T; b.__px = [T.x + 0.4, T.y + 0.3]; b.x = b.__px[0]; b.y = b.__px[1]; b.hp = b.maxhp = 1e9; b.kbx = b.kby = 0; b.stun = 0; window.__kbMax = 0; return { act: b.act, type: b.type || b.kind, n };`);
      const bo = await cast({ evo, dt: 1 / 60 }), bHits = bo.LOG.filter(r => r[4]), kbB = await ev(`const b = g.boss, r = { kbMax: window.__kbMax, stun: b ? b.stun : null }; if (b) { b.__px = null; b.hp = 0; b.dead = true; } return r;`);
      ok(bw && bHits.length >= 2 && bHits.some(r => r[2] === +bo.S.finD.toFixed(4)) && bHits.every(r => r[3] === 0) && !(kbB.stun > 0) && bo.LOG.filter(r => !r[4] && r[2] === +bo.S.finD.toFixed(4)).every(r => r[3] > 0), 'a boss in the fire and the blast takes its beats (ticks and the finisher); the move gives it no knock-back or stun; the others are knocked back by the finisher', { wake: bw, boss: bHits.length, kb: bHits.map(r => r[3]).slice(-2), kbB });
      await reset(); const k = await cast({ evo, dt: 1 / 60, kill: 3.0, secs: 3.0 + 2.5 }), after = k.LOG.filter(r => r[0] > k.dead + 1e-6).length;
      ok(after === 0 && k.gone && k.fxT > 0 && k.fxT - k.dead < 0.75, 'the caster downed mid-cast: no hit after, the serpent gone within 0.75 s', { dead: k.dead, gone: k.fxT, after });
    }
  }
  const S1 = res[1].a.S, S4 = res[4].a.S, S7 = res[7].a.S;
  ok(Math.abs(S4.RX / S1.RX - 1.15) < 1e-6 && Math.abs(S7.RX / S1.RX - 1.3) < 1e-6 && Math.abs(S4.TW / S1.TW - 1.15) < 1e-6 && Math.abs(S7.TW / S1.TW - 1.3) < 1e-6 && S1.RX >= 3.6, 'the blast radius and the fire\'s width: +15% at Adept (evo 4), +30% at Celestial (evo 7); the blast at least v450\'s 3.6', { RX: [S1.RX, S4.RX, S7.RX], TW: [S1.TW, S4.TW, S7.TW] });
  // the cooldown: through the real cast (useUlt): 30 s from the cast at every tier; the six seconds at every tier
  const cd = await ev(`const out = []; for (const evo of [1, 4, 7]) { window.__hold(); g.cdU = 0; const mv = P.ELEM_LIST.fire.ey_snakeflame; let ab = Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, evo, cost: 100 }); if (evo >= 7) ab = Object.assign({}, ab, { tier: 2, mult: ab.mult * 1.6 }); D.setKit('ult', ab);
      const n0 = D.ELEM.fx.length; D.useUlt(); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; out.push({ evo, cdU: g.cdU, row: mv.cd, fx: D.ELEM.fx.length - n0, coil: f && f.S ? +(f.S.T_X - f.S.T_C).toFixed(3) : null, castT: me.castT });
      step(11, () => { window.__hold(); }); } return out;`);
  ok(cd.every(c => c.cdU === 30 && c.row === 30 && c.fx === 1 && c.coil === 6 && c.castT <= 0.5 + 1e-9), 'the cooldown: 30 s, started by the cast at every tier; the six seconds; a short gesture (0.5 s)', cd);
  // the JS cost a frame (this machine): the move's update, its rig, and its whole drawing on the path in use (2D unless GL=1), 120 frames mid-roam at Celestial
  const js = await ev(`window.__hold(); D.ELEM.ult('snakeflame', { a: 0, base: 100, E: { color: '#FF7A2E' }, el: 'fire', e8: 'fire', evo: 7, tx: window.__T.x, ty: window.__T.y, A: {}, up: true }); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; step(3.4, () => { window.__hold(); });
    const G = window.SNAKEFLAME_GL, r0 = G.rig; let rig = 0, up = 0, dr = 0; G.rig = Q => { const t = performance.now(); const o = r0(Q); rig += performance.now() - t; return o; }; const u0 = f.update; f.update = (dt, ff) => { const t = performance.now(); u0(dt, ff); up += performance.now() - t; };
    const c = document.getElementById('arcCanvas').getContext('2d'), N = 120; for (let k = 0; k < N; k++) { window.__hold(); U.update(1 / 60); const X = H.sx(f.x), Y = H.sy(f.y), T = D.ELEM.H.X.Tz(), t = performance.now(); c.save(); f.drawFloor.call(f, c, f, X, Y, T, g.t); c.restore(); c.save(); f.draw.call(f, c, f, X, Y, T, g.t); c.restore(); dr += performance.now() - t; }
    G.rig = r0; f.update = u0; step(9, () => { window.__hold(); }); return { updateMs: +(up / N).toFixed(3), rigMs: +(rig / N).toFixed(3), drawMs: +(dr / N).toFixed(3), gl: G.usable() };`);
  console.log('   JS a frame (mid-roam, Celestial):', JSON.stringify(js));
  // the build's cost at the cast (path, cells, blast cells)
  const bc = await ev(`window.__hold(); const t = performance.now(); D.ELEM.ult('snakeflame', { a: 0, base: 100, E: { color: '#FF7A2E' }, el: 'fire', e8: 'fire', evo: 7, tx: window.__T.x, ty: window.__T.y, A: {}, up: true }); const ms = performance.now() - t; step(9.5, () => { window.__hold(); }); return +ms.toFixed(1);`);
  console.log('   the cast\'s build (path, fire cells, blast cells; Celestial):', bc, 'ms');
  // the stage left mid-cast: the effect goes with it; the GPU buffers are given back (GL)
  const ex = await ev(`window.__hold(); D.ELEM.ult('snakeflame', { a: 0, base: 100, E: { color: '#FF7A2E' }, el: 'fire', e8: 'fire', evo: 4, tx: window.__T.x, ty: window.__T.y, A: {}, up: false }); step(3, () => { window.__hold(); });
    const cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'); c.save(); U.draw(c); c.restore(); const gpu0 = window.SNAKEFLAME_GL.gpuCount(), fx0 = D.ELEM.fx.length;
    P.closeArcade(true); return { gpu0, fx0, gpu1: window.SNAKEFLAME_GL.gpuCount(), gl: window.SNAKEFLAME_GL.usable() };`);
  ok(ex.fx0 >= 1 && ex.gpu1 === 0 && (!GL || ex.gpu0 > 0), 'the stage left mid-cast: the GPU buffers freed (' + (GL ? 'GL forced' : '2D') + ')', ex);
  ok(!errors.length, 'no page errors', errors.slice(0, 5));
  await browser.close();
})();
