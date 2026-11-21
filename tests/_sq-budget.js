// v440 SQ: the shared cosmetic budget (09c FXB) never touches the fight, and it lowers the cost of heavy frames.
// One page, a Garden fight (section 2, 20 of the brood round the pet, real monsters: they keep their HP and are hit), the pet's skill,
// Sunflare and stacked wind cast in turn, the arcade's frames stepped by hand at 60 Hz. Every frame is drawn three times from the same
// point of the game's dice (and with every particle's lazily drawn seed put back between them): (A) the budget off, (B) on at High's
// own limit, (C) on at a tight limit (FXB_LIMIT, 2 screens: everything that can be thinned is). Checked at every frame: the dice are
// drawn the same number of times in A, B and C, and drawing (any of them) leaves the game state as it was; then the fight goes on from
// C. Measured: the budget's state (used / limit in screens, items thinned) and the cost counters of A and C (the GPU's shaded fill,
// quads, 2D draws and their area, particles drawn).
// usage: HTML=<test html> node tests/_sq-budget.js   env: N (frames, 150), LIMIT (2), OUT (json)
process.env.RIFT = 'garden';
const { open } = require('./_pf-lib');
const fs = require('fs');
(async () => {
  const T = await open({ html: process.env.HTML, dpr: 3, rift: 'garden', flags: { __FXB_SNAP: 1, __SQDBG: process.env.DBG ? +process.env.DBG : -1 } }); const { page, start, errors, frames } = T;
  await page.evaluate(() => { window.__pp.st.dlv = 33; window.__pp.st.gq = 'high'; });
  await start(3);
  await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g; for (let k = 0; k < 90; k++) G.update(1 / 60);
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 6000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; let ok = true; for (let dx = -7; dx <= 8 && ok; dx++) for (let dy = -5; dy <= 5 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x - 1; me.y = best.y + 1; }
    D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still).slice(0, 20).forEach((m, i) => { const b = i / 20 * 6.283, r = 2.0 + (i % 4) * 1.0; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 1.5 + Math.sin(b) * r * 0.75, hp: m.maxhp * 40, maxhp: m.maxhp * 40, aggro: true }); });
    g.intro = 0; D.banners.length = 0; const RU = D.RULES; if (RU && RU.blocks && !RU.__po) { const b0 = RU.blocks; RU.blocks = k => k === 'noult' ? false : b0.call(RU, k); RU.__po = 1; } });
  await frames(3, { prof: false, hold: ['window.__pp.arc.game._dbg.me.hp = window.__pp.arc.game._dbg.ST.hp'] });   // (the painter warmed, the merge armed)
  const N = +(process.env.N || 150), LIM = +(process.env.LIMIT || 2);
  const res = await page.evaluate(async ([N, LIM]) => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, me = D.me, g = D.g, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'), C = window.__PFC, F = self.NIDHOGG_MOVES.FGFX, X = window.FXB;
    let seed = 99991; const dice = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; let nd = 0; window.__SQW = null; Math.random = () => { nd++; if (window.__SQW) window.__SQW.push((new Error().stack || '').split('\n')[2].trim().slice(0, 140)); return dice(); };
    const st = () => JSON.stringify({ m: D.mons.map(m => [m.dead ? 1 : 0, +m.x.toFixed(4), +m.y.toFixed(4), Math.round(m.hp)]), me: [Math.round(me.hp), Math.round(me.mp), +me.x.toFixed(4), +me.y.toFixed(4)], cd: [g.cdS, g.cdU].map(v => +(v || 0).toFixed(4)), t: +g.t.toFixed(4), fx: D.ELEM ? D.ELEM.fx.length : 0, zones: D.zones.length, shots: D.shots.length, eshots: D.eshots ? D.eshots.length : 0, parts: D.parts.length });
    const lazy = () => { const L = []; for (const k of ['parts', 'zones', 'shots', 'eshots', 'rings', 'bolts', 'helpers', 'mons', 'dragons']) { const a = D[k]; if (Array.isArray(a)) for (const o of a) if (o && typeof o === 'object' && o.sd == null) L.push(o); } if (D.ELEM) for (const f of D.ELEM.fx) if (f && f.sd == null) L.push(f); return L; };   /* (what a first draw seeds lazily from the dice: put back between the three draws) */
    const cast = (kind, id) => { me.mp = 999; if (kind === 'ult') { D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST.light.ey_sunflare, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); g.cdU = 0; D.useUlt(); } else if (kind === 'wind') { D.setKit('strong', Object.assign(P.elemAbility(P.ELEM_LIST.wind['ex_' + id], 'strong', P.st), { cost: 0, cd: 0, evo: 7 })); g.cdS = 0; D.useStrong('strong'); } };
    const plan = { 0: ['wind', 'windblades'], 20: ['ult'], 45: ['wind', 'cyclone'], 70: ['wind', 'gust'], 95: ['wind', 'cyclone'], 120: ['wind', 'gust'] };
    const draw = (mode) => { window.__FXB = mode === 'A' ? 0 : 1; window.__FXB_LIMIT = mode === 'C' ? LIM : 0; C.z(); C.on = true; const n0 = nd; c.save(); G.draw(c); c.restore(); F.frameEnd(); C.on = false; const r = { dice: nd - n0, fill: C.fgFillV, quads: C.fgQuads, di: C.di, diA: C.diA, fills: C.fill + C.stroke, glCopies: C.diGLr, b: X.state() }; return r; };
    const rows = []; let bad = 0, moved = 0; const t0 = performance.now();
    for (let f = 0; f < N; f++) { if (plan[f]) cast(...plan[f]); me.hp = D.ST.hp;
      const s0 = st(), q0 = seed, LZ = lazy(), np0 = D.parts.length, et0 = D.mons.map(m => m.emberT), back = () => { for (const o of LZ) delete o.sd; D.parts.length = np0; D.mons.forEach((m, i) => { m.emberT = et0[i]; }); };   /* (a burning monster's drawing adds an ember (and draws the dice) once a tenth of a second: put back too) */
      window.__SQW = []; const a = draw('A'); const wA = window.__SQW; window.__SQW = []; back(); const sA = st(); seed = q0;
      const b = draw('B'); const wB = window.__SQW; window.__SQW = null; if (a.dice !== b.dice) (window.__SQLOG = window.__SQLOG || []).push({ f, A: wA, B: wB }); back(); const sB = st(); seed = q0;
      const np1 = D.parts.length; const cc = draw('C'); const sC = JSON.stringify(Object.assign(JSON.parse(st()), { parts: np1 })); /* (C's own embers kept: the fight goes on from C, as it would) */
      if (a.dice !== b.dice || a.dice !== cc.dice) bad++; if (sA !== s0 || sB !== s0 || sC !== s0) moved++;
      rows.push({ f, dice: [a.dice, b.dice, cc.dice], A: a, B: b, C: cc });
      A.t += 1 / 60; G.update(1 / 60); }
    window.__FXB = 1; window.__FXB_LIMIT = 0;
    return { rows, bad, moved, secs: (performance.now() - t0) / 1000, final: st(), log: window.__SQLOG }; }, [N, LIM]);
  const R = res.rows, heavy = R.filter(r => r.A.b.used > 0 || true), mean = (L, f) => L.reduce((s, r) => s + f(r), 0) / Math.max(1, L.length);
  const sum = (L, k) => ({ fillMpx: +(mean(L, r => r[k].fill) / 1e6).toFixed(2), quads: +mean(L, r => r[k].quads).toFixed(0), di: +mean(L, r => r[k].di).toFixed(0), diMpx: +(mean(L, r => r[k].diA) / 1e6).toFixed(2), paths: +mean(L, r => r[k].fills).toFixed(0), copies: +mean(L, r => r[k].glCopies).toFixed(1) });
  const used = R.map(r => r.B.b.used), byBand = {};
  for (const [lo, hi, name] of [[0, 20, 'wind ring'], [20, 45, 'Sunflare (+ ring)'], [45, 95, 'Sunflare + cyclone + gust'], [95, N, 'stacked wind (+ Sunflare end)']]) { const L = R.filter(r => r.f >= lo && r.f < hi); if (!L.length) continue;
    byBand[name] = { frames: L.length, usedHigh: +mean(L, r => r.B.b.used).toFixed(1), layersHigh: +mean(L, r => r.B.b.ess).toFixed(1), decoScreens: +mean(L, r => r.B.b.dem[0] + r.B.b.dem[1] + r.B.b.dem[2]).toFixed(2), limHigh: L[0].B.b.lim, thinnedHigh: +mean(L, r => r.B.b.cut).toFixed(0), itemsHigh: +mean(L, r => r.B.b.n).toFixed(0), thinnedTight: +mean(L, r => r.C.b.cut).toFixed(0), off: sum(L, 'A'), high: sum(L, 'B'), tight: sum(L, 'C') }; }
  console.log(JSON.stringify(byBand, null, 1));
  if (res.log) for (const L of res.log.slice(0, 3)) console.log('  frame', L.f, 'dice callers A', JSON.stringify(L.A), '\n    B', JSON.stringify(L.B));
  for (const r of R) if (r.dice[0] !== r.dice[1] || r.dice[0] !== r.dice[2]) console.log('  dice differ at frame', r.f, JSON.stringify(r.dice), 'thinned B/C', r.B.b.cut, r.C.b.cut);
  console.log(`frames ${R.length} (${res.secs.toFixed(0)} s) · dice drawn the same with the budget off / at High / tight in every frame: ${res.bad === 0} (${res.bad} differ) · drawing never moved the game state: ${res.moved === 0} · max used at High ${Math.max(...used).toFixed(1)} screens · page errors ${errors.length}`);
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({ byBand, bad: res.bad, moved: res.moved, used, errors }, null, 1));
  await T.browser.close(); process.exit(res.bad || res.moved || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
