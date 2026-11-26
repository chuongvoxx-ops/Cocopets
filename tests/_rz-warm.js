// (v464 RZ-U) the floor under Raziel's ultimate: the chunks its camera pull-back reveals, painted live (before) or ahead in idle frames
// (after: 20b warmView, asked for by 20g6b). Every frame drawn (the 2D paths: the floor is 2D whatever the GPU does), at a phone's size.
// Raziel summoned and fighting for PRE s (frames drawn: the dungeon's idle frames do the warming), then its ultimate to the end. Per frame:
// gradients made, canvases made (a chunk is one), the frame's ms. Reported for the fight and for the ultimate: max, frames over 100 gradients, sum.
// usage: HTML=<test html> RIFT=belfry|garden|dunes node tests/_rz-warm.js   env: DPR (3), PRE (6), NOWARM=1 (before: no pre-painting), STAGE (3)
const { open } = require('./_pf-lib');
(async () => {
  const T = await open({ html: process.env.HTML, dpr: +(process.env.DPR || 3), rift: process.env.RIFT || 'belfry', gpu: false, flags: { __NG_GL: 0, __RZ_GL: 0, __RZU_NOWARM: process.env.NOWARM === '1' ? 1 : 0, __RZMOVE: process.env.MOVE === '1' ? 1 : 0 } });
  const { page, errors, start, frames } = T; const ev = (f, a) => page.evaluate(f, a);
  await ev(() => { const P = window.__pp; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.eq = 'gemini'; P.st.animas.res = null; });
  await start(+(process.env.STAGE || 3));
  const info = await ev(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN;
    for (let k = 0; k < 60; k++) G.update(1 / 60);
    if (window.__RZMOVE) { const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null; Math.random = (s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(777);
      for (let k = 0; k < 8000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 60, sy = me.y + (Math.random() - 0.5) * 60; if (Math.hypot(sx - me.x, sy - me.y) < 20) continue; let ok = true; for (let dx = -6; dx <= 6 && ok; dx++) for (let dy = -4; dy <= 4 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
      if (best) { me.x = best.x; me.y = best.y; } window.__RZMOVED = !!best; }
    window.__RZHOLD = () => { me.hp = D.ST.hp; me.mp = 999; for (const m of D.mons) m.atkCd = 99; if (D.eshots) D.eshots.length = 0; };
    D.g.intro = 0; D.banners.length = 0; AN.kit.main.k = 3; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); AN.summon();
    for (let k = 0; k < 60 * 8 && !(AN.S.list[0] && AN.S.list[0].rz && AN.S.list[0].rz.ready); k++) { window.__RZHOLD(); G.update(1 / 60); }
    const a = AN.S.list[0]; return { ok: !!a, st: a && a.st, ul: !!(AN.rz && AN.rz.ul), cv: [document.getElementById('arcCanvas').width, document.getElementById('arcCanvas').height], zoom: D.g.zoom, moved: !!window.__RZMOVED }; });
  console.log('setup', JSON.stringify(info));
  const S = (rows, name) => { const g = rows.map(r => r.grad), c = rows.map(r => r.cvNew), ms = rows.map(r => r.tot).sort((a, b) => a - b);
    const o = { frames: rows.length, gradMax: Math.max(...g), gradSum: g.reduce((a, b) => a + b, 0), over100: g.filter(x => x > 100).length, canvasMax: Math.max(...c), canvasSum: c.reduce((a, b) => a + b, 0), msMed: +ms[ms.length >> 1].toFixed(0), msMax: +ms[ms.length - 1].toFixed(0) };
    console.log(` ${name} ${JSON.stringify(o)}`); return o; };
  const fight = (await frames(Math.round(60 * +(process.env.PRE || 6)), { prof: false, hold: ['window.__RZHOLD()', 'window.__pp.arc.game._dbg.AN.S.list[0] && window.__pp.arc.game._dbg.AN.S.list[0].rz && (window.__pp.arc.game._dbg.AN.S.list[0].rz.gap = 99)'] })).rows;
  S(fight, 'fight');
  console.log(' trigger', JSON.stringify(await ev(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, a = D.AN.S.list[0], U = D.AN.rz && D.AN.rz.ul; a.life = 0.001; for (let k = 0; k < 60 * 3 && !(U && U.ul); k++) { window.__RZHOLD(); G.update(1 / 60); } return { st: a.st, ul: !!(U && U.ul), t: U && U.ul ? U.ul.t : null, life: a.life, ready: a.rz && a.rz.ready }; })));
  const ult = (await frames(60 * 15, { prof: false, hold: ['window.__RZHOLD()'] })).rows;
  S(ult, 'ult  ');
  const z = await ev(() => { const D = window.__pp.arc.game._dbg; return { zoom: D.g.zoom, left: D.AN.S.list.length }; }); console.log(' end', JSON.stringify(z));
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
