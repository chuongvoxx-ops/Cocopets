// v451 GE: Golden Eagle's mechanics on a dungeon floor, the game stepped by hand: the row (100 MP, 35 s, six-star only), per tier
// (evo 1 / 4 / 7) 3 / 4 / 6 waves released at their scheduled times (the last after the inhale), each wave hitting each enemy in its
// path once, the final wave the largest single hit, nothing outside the path or behind a wall, dt 1/60 vs 1/4 (the same hits),
// Fewer effects (the same hits), a boss (damage, no stun, no push), the others pushed along the aim, the cooldown (35 s from the
// cast at every tier, a short gesture), the caster downed mid-cast, the stage left mid-cast (GPU buffers freed), no page errors.
// usage: HTML=<test html> node tests/_gle-mech.js   env: GL=1 (GLM + FGFX forced on the software rasteriser)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const ok = (c, msg, v) => { console.log((c ? 'PASS ' : 'FAIL ') + msg + (v !== undefined ? '  ' + JSON.stringify(v) : '')); if (!c) process.exitCode = 1; };
(async () => {
  const GL = process.env.GL === '1';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (/Golden Eagle|GLM|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  page.setDefaultTimeout(1800000);
  await page.addInitScript(gl => { if (gl) { window.__GE_GL = 1; window.__NG_GL = 1; } }, GL);
  await page.goto('file://' + path.resolve(process.env.HTML)); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 });
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.st.devMoves = true; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1800000, polling: 500 }); await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 }); await page.waitForTimeout(300); await page.evaluate(() => { window.__pp.arc.paused = true; });
  const PRE = `const P = window.__pp, U = P.arc.game, D = U._dbg, me = D.me, g = D.g, GE = P.ELEM_IMPL.wind.ult.goldeneagle, H = D.ELEM.H;
    const step = (secs, each, dt) => { dt = dt || 1 / 60; let t = 0; while (t < secs - 1e-9) { U.update(dt); t += dt; if (each && each(t) === true) break; } return t; };
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  // the row
  const row = await ev(`const mv = P.ELEM_LIST.wind.ey_goldeneagle, six = P.skillsK ? P.skillsK.ELEM_SIX.wind.ult : null; return { has: !!mv, cost: mv && mv.cost, cd: mv && mv.cd, name: mv && mv.name, six: six ? six.includes('goldeneagle') : 'n/a', impl: typeof GE, tune: GE.TUNE.cd, beats: GE.TUNE.beats };`);
  ok(row.has && row.cost === 100 && row.cd === 35 && row.tune === 35 && row.impl === 'function', 'the row: Golden Eagle, Wind Ult, 100 MP, cooldown 35 s (the row and TUNE), implemented', row);
  ok(row.six === true, 'six-star only: on the Wind six-star Ult list (ELEM_SIX)', row.six);
  // an open place: the pet there, the floor's monsters held (no moves, no blows)
  const setup = await ev(`for (let k = 0; k < 30; k++) U.update(1 / 60); g.intro = 0; g.bossIntro = 0;
    // the place with the most open floor in a band 10 long along +x (the aim): the pet at its west end
    let best = null, bs = -1; for (let k = 0; k < 4000; k++) { const sx = Math.floor(me.x + (Math.random() - 0.5) * 90) + 0.5, sy = Math.floor(me.y + (Math.random() - 0.5) * 90) + 0.5; if (!W(sx, sy)) continue; let n = 0; for (let dx = -2; dx <= 10; dx++) for (let dy = -4; dy <= 4; dy++) if (W(sx + dx, sy + dy)) n++; if (n > bs) { bs = n; best = { x: sx, y: sy }; } }
    if (!best) return null; me.x = best.x; me.y = best.y; window.__T = { x: best.x, y: best.y };
    const L = D.mons.filter(m => !m.dead && !m.boss && !m.fiend && !m.fobj); window.__L = L.slice(0, 12);
    window.__hold = () => { me.hp = D.ST.hp; me.mp = 999; for (const m of D.mons) { m.atkCd = 99; m.cd = 99; m.spd = 0; if (m.__px) { const mv = Math.hypot(m.x - m.__px[0], m.y - m.__px[1]); if (mv > 1e-6) { window.__mv = window.__mv || {}; window.__mv[m.__i] = Math.max(window.__mv[m.__i] || 0, mv); } m.x = m.__px[0]; m.y = m.__px[1]; } } if (D.eshots) D.eshots.length = 0; D.zones.filter(z => z.own !== 'pet').forEach(z => { z.life = 0; z.fn = null; }); };
    step(1.0, () => { window.__hold(); me.x = best.x; me.y = best.y; });   // (the floor's flow field rebuilt round the pet's new place)
    return { mons: D.mons.filter(m => !m.dead).length, held: window.__L.length, at: best, open: bs };`);
  ok(setup && setup.held >= 10 && setup.open >= 80, 'an open place and the floor\'s monsters', setup);
  // the monsters: 0..7 in the path (along the aim, within the first wave's width), 8 behind the waves' line, 9 far to the side, 10, 11 far away
  const place = () => ev(`const T = window.__T, L = window.__L; me.x = T.x; me.y = T.y; window.__mv = {};
    // a dry cast for the waves' line and the floor's columns
    D.ELEM.ult('goldeneagle', { a: 0, base: 1, el: 'wind', e8: 'wind', evo: 1, tx: T.x + 4, ty: T.y }); const f = D.ELEM.fx[D.ELEM.fx.length - 1], S = f.S; f.life = 0; U.update(1 / 60);
    const O = S.O, cR = S.cR, colOK = (al, of) => { const j = Math.round(of / S.CW + S.J0); return j >= 0 && j < S.NC && cR[j] >= al + 0.6 && S.cS[j] <= al - 0.6; };
    // 0..7 in the path: spread along it on open floor inside the first wave's width; 8 behind the waves' line, 9 far to the side, 10, 11 far away
    const cand = []; for (let al = 0.6; al <= 7.4; al += 0.3) for (let of = -1.3; of <= 1.31; of += 0.26) if (W(O.x + al, O.y + of) && colOK(al, of)) cand.push([al, of]);
    const pick = []; for (let q = 0; q < 8; q++) { const want = 0.8 + q * 0.9; let b = null, bd = 1e9; for (const c of cand) { if (pick.some(p => Math.hypot(p[0] - c[0], p[1] - c[1]) < 0.85)) continue; const d = Math.abs(c[0] - want) + Math.abs(c[1]) * 0.2; if (d < bd) { bd = d; b = c; } } if (b) pick.push(b); }
    const spots = pick.concat([[-3.2, 0.0], [3.0, 6.5], [40, 40], [41, 44]]).slice(0, 12); while (pick.length < 8) { pick.push([60 + pick.length, 60]); spots.splice(pick.length - 1, 0, [60 + pick.length, 60]); }
    const put = [];
    L.forEach((m, i) => { const [al, of] = spots[i] || [50 + i, 50]; const x = O.x + al, y = O.y + of; m.__px = [x, y]; put.push([+al.toFixed(2), +of.toFixed(2), W(x, y), i < 8 ? colOK(al, of) : null]); Object.assign(m, { x, y, hp: 1e9, maxhp: 1e9, kbx: 0, kby: 0, stun: 0, chill: 0, freeze: 0, dead: false, boss: false, aggro: true, r: m.r || 0.4 }); m.__i = i; });
    return { O, put };`);
  // one cast through the elemental runner at a fixed base (100), aimed along +x; the hits logged at X.hitMon: [time from the cast, monster, damage, stun, boss]
  const cast = (o) => ev(`const o = arg; window.__hold(); window.__mv = {}; P.st.lowFx = !!o.low; const T = window.__T, X = H.X, h0 = X.hitMon, LOG = []; const t0 = g.t;
    X.hitMon = (m, d, op) => { if (op && op.src === 'ult' && op.el === 'wind') LOG.push([+(g.t - t0).toFixed(4), m.__i == null ? -1 : m.__i, +d.toFixed(4), op && op.stun ? op.stun : 0, !!m.boss]); return h0(m, d, op); };
    const p0 = H.push; window.__bp = 0; H.push = (m, x, y, st2) => { if (m.boss) window.__bp++; return p0(m, x, y, st2); };
    const MR = Math.random; Math.random = () => 0.999;   // (no crits: exact sums)
    const n0 = D.ELEM.fx.length; D.ELEM.ult('goldeneagle', { a: 0, base: 100, el: 'wind', e8: 'wind', evo: o.evo, tx: T.x + 4, ty: T.y, up: o.evo >= 7 });
    const f = D.ELEM.fx[D.ELEM.fx.length - 1], S = f.S; let fxT = 0, dead = null;
    step(o.secs || 10, t => { window.__hold(); if (o.kill != null && t >= o.kill && dead == null) { me.dead = true; dead = g.t - t0; } if (D.ELEM.fx.indexOf(f) < 0 && !fxT) fxT = g.t - t0; }, o.dt || 1 / 60);
    Math.random = MR; if (o.kill != null) me.dead = false; X.hitMon = h0; H.push = p0; P.st.lowFx = false;
    return { LOG, S: { tier: S.tier, NB: S.NB, TR: S.TR, log: S.log, DK: S.DK, waveD: S.waveD, finD: S.finD, waves: S.waves }, fxT, gone: D.ELEM.fx.indexOf(f) < 0, dead, mv: window.__mv, bossPush: window.__bp, zoom: g.zoomP };`, o);
  const per = LOG => { const M = {}; for (const [t, i, d, stn] of LOG) { const e = M[i] || (M[i] = { n: 0, sum: 0, max: 0, times: [], stun: 0 }); e.n++; e.sum = +(e.sum + d).toFixed(3); e.max = Math.max(e.max, d); e.times.push(t); e.stun = Math.max(e.stun, stn); } return M; };
  const pl = await place(); console.log('   placed (along, across, floor, column):', JSON.stringify(pl.put.slice(0, 10)));
  const ins = [0, 1, 2, 3, 4, 5, 6, 7].filter(i => pl.put[i][2] && pl.put[i][3]);
  ok(ins.length >= 6, 'at least 6 monsters placed in the path on open floor', ins);
  const TUNE = await ev(`return GE.TUNE;`);
  for (const evo of [1, 4, 7]) {
    await place(); const a = await cast({ evo, dt: 1 / 60 }), M = per(a.LOG), S = a.S, NB = [3, 4, 6][S.tier];
    const exp = []; for (let k = 0; k < NB; k++) exp.push(k < NB - 1 ? TUNE.first + k * TUNE.gap : TUNE.first + (NB - 2) * TUNE.gap + TUNE.gap + TUNE.inhale);
    const rel = S.log.filter(l => l[0] === 'wave' || l[0] === 'fin');
    ok(S.NB === NB && rel.length === NB && rel.every((l, k) => Math.abs(l[2] - exp[k]) < 1e-6 && l[1] === k) && rel[NB - 1][0] === 'fin' && rel.slice(0, -1).every(l => l[0] === 'wave'), `evo ${evo}: ${NB} wingbeats, released at ${exp.map(x => x.toFixed(2)).join(', ')} s (the last after the widest-span inhale, the final wave)`, rel);
    ok(ins.every(i => M[i] && M[i].n === NB), `evo ${evo}: each monster in the path hit once by each wave (${NB})`, ins.map(i => M[i] ? M[i].n : 0));
    ok(!M[8] && !M[9] && !M[10] && !M[11], `evo ${evo}: none behind the waves' line, far to the side or far away`, [8, 9, 10, 11].map(i => M[i] ? M[i].n : 0));
    const fin = a.LOG.filter(r => Math.abs(r[2] - S.finD) < 1e-3 && ins.includes(r[1])), byWave = {}; for (const h of a.LOG) { const k = S.waves.findIndex((w, j) => h[0] >= w.t0 - 1e-6 && (j === NB - 1 || h[0] < S.waves[j + 1].t0 - 1e-6)); (byWave[k] = byWave[k] || []).push(h); }
    ok(Math.abs(S.waveD - TUNE.waveK * S.DK) < 1e-6 && Math.abs(S.finD - TUNE.finK * S.DK) < 1e-6 && ins.every(i => M[i].max === +S.finD.toFixed(4)) && S.finD > S.waveD * 2.5 && fin.length === ins.length, `evo ${evo}: a wave ${TUNE.waveK} DK, the final ${TUNE.finK} DK: the cast's largest single hit, once per monster`, { DK: +S.DK.toFixed(2), wave: +S.waveD.toFixed(2), fin: +S.finD.toFixed(2), perEnemy: +((NB - 1) * S.waveD + S.finD).toFixed(1), perEnemyDK: (NB - 1) * TUNE.waveK + TUNE.finK });
    ok(ins.every(i => Math.abs(M[i].sum - ((NB - 1) * S.waveD + S.finD)) < 0.01), `evo ${evo}: per monster in the path ${(NB - 1) * TUNE.waveK + TUNE.finK} DK`, ins.map(i => M[i].sum));
    ok(ins.filter(i => a.mv[i] > 0.1).length >= Math.ceil(ins.length * 0.6), `evo ${evo}: the monsters in the path pushed along the aim (where the floor lets them move) (a stagger: stun ${TUNE.stun} / ${TUNE.stunF} s)`, ins.map(i => +(a.mv[i] || 0).toFixed(2)));
    ok(a.gone && a.fxT > 0, `evo ${evo}: the effect ends by itself (at ${a.fxT.toFixed(2)} s)`, { fxT: a.fxT });
    if (evo === 1) {
      await place(); const b = await cast({ evo, dt: 1 / 4 }), MB = per(b.LOG);
      const same = [...Array(12).keys()].every(i => (!M[i] && !MB[i]) || (M[i] && MB[i] && M[i].n === MB[i].n && Math.abs(M[i].sum - MB[i].sum) < 1e-3));
      const rb = b.S.log.filter(l => l[0] === 'wave' || l[0] === 'fin');
      ok(same && JSON.stringify(rb) === JSON.stringify(rel), 'dt 1/60 and dt 1/4 give the same hits (count and damage per held monster) and the same releases', { a: ins.map(i => M[i] && M[i].sum), b: ins.map(i => MB[i] && MB[i].sum) });
      await place(); const l = await cast({ evo, dt: 1 / 60, low: true }), ML = per(l.LOG);
      ok(ins.every(i => ML[i] && ML[i].n === M[i].n && Math.abs(ML[i].sum - M[i].sum) < 1e-3), 'Fewer effects: the same hits', ins.map(i => ML[i] && ML[i].n));
      // a boss in the path: every wave hits it, no stun, no push
      await place(); const bw = await ev(`D.wakeBoss(); const b = g.boss; if (!b) return null; let n = 0; while ((b.act === 'enter' || b.act === 'sleep' || g.bossIntro > 0) && n++ < 600) { g.bossIntro = 0; window.__hold(); U.update(1 / 60); } const m3 = window.__L[3]; b.__px = [m3.__px[0], m3.__px[1]]; m3.__px = [m3.__px[0] + 40, m3.__px[1] + 40]; b.x = b.__px[0]; b.y = b.__px[1]; b.hp = b.maxhp = 1e9; b.kbx = b.kby = 0; b.stun = 0; b.__i = 3; return { act: b.act, n };`);
      const bo = await cast({ evo, dt: 1 / 60 }), bHits = bo.LOG.filter(r => r[4] && r[1] === 3), bs = await ev(`const b = g.boss, r = { stun: b ? b.stun : null }; if (b) { b.__px = null; b.hp = 0; b.dead = true; } return r;`);
      ok(bw && bHits.length === 3 && bHits.every(r => r[3] === 0) && bo.bossPush === 0 && !(bs.stun > 0), 'a boss in the path takes every wave (3); no stun asked, no push (its crowd-control immunity kept)', { wake: bw, hits: bHits.length, pushCalls: bo.bossPush, moved: bo.mv[3] || 0, stun: bs.stun });
      // the caster downed mid-cast: no hit after it, the eagle gone quickly
      await place(); const k = await cast({ evo, dt: 1 / 60, kill: 2.0, secs: 4.5 }), after = k.LOG.filter(r => r[0] > k.dead + 1e-6).length;
      ok(after === 0 && k.gone && k.fxT > 0 && k.fxT - k.dead < 0.75, 'the caster downed mid-cast: no hit after, the eagle gone within 0.75 s', { dead: k.dead, gone: k.fxT, after, log: k.S.log });
    }
  }
  // a wall: the waves stop at it (a monster beyond the wall along the aim is never hit, and every hit lies on the floor the columns allow)
  const wall = await ev(`window.__hold(); const T = window.__T; let found = null;
    for (let k = 0; k < 6000 && !found; k++) { const sx = Math.floor(me.x + (Math.random() - 0.5) * 90) + 0.5, sy = Math.floor(me.y + (Math.random() - 0.5) * 90) + 0.5; if (!W(sx, sy)) continue;
      for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { const dx = Math.cos(a), dy = Math.sin(a); let s = 0.5; while (s < 6 && W(sx + dx * s, sy + dy * s)) s += 0.25; if (s < 2.5 || s >= 6) continue; let s2 = s; while (s2 < s + 3 && !W(sx + dx * s2, sy + dy * s2)) s2 += 0.25; if (s2 >= s + 3 || s2 > 7) continue;
        if (W(sx - dx * 2, sy - dy * 2) && W(sx + dx * (s2 + 0.6), sy + dy * (s2 + 0.6))) { found = { x: sx, y: sy, a, s, s2 }; break; } } }
    if (!found) return null; const L = window.__L, dx = Math.cos(found.a), dy = Math.sin(found.a); me.x = found.x; me.y = found.y; step(1.0, () => { window.__hold(); me.x = found.x; me.y = found.y; });
    L.forEach((m, i) => { const x = i === 0 ? found.x + dx * (found.s2 + 0.6) : i === 1 ? found.x + dx * (found.s - 0.8) : found.x + 50 + i, y = i === 0 ? found.y + dy * (found.s2 + 0.6) : i === 1 ? found.y + dy * (found.s - 0.8) : found.y + 50; m.__px = [x, y]; Object.assign(m, { x, y, hp: 1e9, maxhp: 1e9, dead: false, boss: false }); m.__i = i; });
    const X = H.X, h0 = X.hitMon, LOG = []; X.hitMon = (m, d, op) => { if (op && op.src === 'ult') LOG.push(m.__i); return h0(m, d, op); };
    D.ELEM.ult('goldeneagle', { a: found.a, base: 100, el: 'wind', e8: 'wind', evo: 1, tx: found.x + dx * 3, ty: found.y + dy * 3 }); step(7, () => { window.__hold(); }); X.hitMon = h0;
    const S = GE.STAT.last, j = Math.round(S.J0); return { found, beyond: LOG.filter(i => i === 0).length, before: LOG.filter(i => i === 1).length, mid: [+S.cS[j].toFixed(2), +S.cR[j].toFixed(2)], flow: H.X.flowAt ? [H.X.flowAt(me.x, me.y), H.X.flowAt(L[1].x, L[1].y)] : null };`);
  ok(wall && wall.beyond === 0 && wall.before === 3, 'a wall across the aim: the waves hit the monster before it (3 waves) and never the one beyond it', wall);
  // the cooldown: through the real cast (useUlt): 35 s from the cast at every tier, a short gesture
  const cd = await ev(`const out = []; for (const evo of [1, 4, 7]) { window.__hold(); g.cdU = 0; me.mp = 999; const mv = P.ELEM_LIST.wind.ey_goldeneagle; let ab = Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, evo, cost: 100 }); if (evo >= 7) ab = Object.assign({}, ab, { tier: 2, mult: ab.mult * 1.6 }); D.setKit('ult', ab);
      const n0 = D.ELEM.fx.length, mp0 = me.mp; D.useUlt(); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; out.push({ evo, cdU: g.cdU, row: mv.cd, fx: D.ELEM.fx.length - n0, NB: f && f.S ? f.S.NB : null, castT: me.castT, mp: mp0 - me.mp });
      step(1.0, () => { window.__hold(); }); out[out.length - 1].cdAfter1s = +g.cdU.toFixed(2); step(9, () => { window.__hold(); }); } return out;`);
  ok(cd.every(c => c.cdU === 35 && c.row === 35 && c.fx === 1 && c.mp === 100 && c.castT <= 0.45 + 1e-9 && c.cdAfter1s < 35 && c.cdAfter1s > 33.5) && cd.map(c => c.NB).join() === '3,4,6', 'the cooldown: 35 s, started when the cast commits (MP spent) at every tier; a short gesture (0.45 s); 3 / 4 / 6 wingbeats', cd);
  // the JS cost a frame (this machine): the move's update, the rig, and its whole drawing on the path in use (2D unless GL=1), 120 frames mid-cast at Celestial
  const js = await ev(`window.__hold(); const T = window.__T; me.x = T.x; me.y = T.y; D.ELEM.ult('goldeneagle', { a: 0, base: 100, el: 'wind', e8: 'wind', evo: 7, tx: T.x + 4, ty: T.y, up: true }); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; step(2.0, () => { window.__hold(); });
    const G = window.GOLDEAGLE_GL, r0 = G.rig; let rig = 0, up = 0, dr = 0; G.rig = Q => { const t = performance.now(); const o = r0(Q); rig += performance.now() - t; return o; }; const u0 = f.update; f.update = (dt, ff) => { const t = performance.now(); u0(dt, ff); up += performance.now() - t; };
    const c = document.getElementById('arcCanvas').getContext('2d'), N = 120; for (let k = 0; k < N; k++) { window.__hold(); U.update(1 / 60); const X = H.sx(f.x), Y = H.sy(f.y), Tz = H.X.Tz(), t = performance.now(); c.save(); f.drawUnder.call(f, c, f, X, Y, Tz, g.t); c.restore(); c.save(); f.draw.call(f, c, f, X, Y, Tz, g.t); c.restore(); dr += performance.now() - t; }
    G.rig = r0; f.update = u0; step(8, () => { window.__hold(); }); return { updateMs: +(up / N).toFixed(3), rigMs: +(rig / N).toFixed(3), drawMs: +(dr / N).toFixed(3), gl: G.usable() };`);
  console.log('   JS a frame (mid-cast, Celestial):', JSON.stringify(js));
  // the stage left mid-cast: the effect goes with it; the GPU buffers are given back (GL)
  const ex = await ev(`window.__hold(); const T = window.__T; me.x = T.x; me.y = T.y; D.ELEM.ult('goldeneagle', { a: 0, base: 100, el: 'wind', e8: 'wind', evo: 4, tx: T.x + 4, ty: T.y }); step(2.2, () => { window.__hold(); });
    const cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'); c.save(); U.draw(c); c.restore(); const gpu0 = window.GOLDEAGLE_GL.gpuCount(), fx0 = D.ELEM.fx.filter(f => f.key === 'goldeneagle').length;
    P.closeArcade(true); return { gpu0, fx0, gpu1: window.GOLDEAGLE_GL.gpuCount(), gl: window.GOLDEAGLE_GL.usable() };`);
  ok(ex.fx0 === 1 && ex.gpu1 === 0 && (!GL || ex.gpu0 > 0), 'the stage left mid-cast: the GPU buffers freed (' + (GL ? 'GL forced' : '2D') + ')', ex);
  ok(!errors.length, 'no page errors', errors.slice(0, 5));
  await browser.close();
})();
