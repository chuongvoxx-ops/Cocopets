// v430 BW: frames of a Belfry hall draining (D2's first refuge valve hall; D1's gate hall with STAGE=0), the pet standing
// in the hall, the valve turned at t = 0, a frame every STEP s. OUT=dir PREFIX=name DPR=1|3 (URL/HTML: the build)
const { open } = require('./_bw-lib');
const fs = require('fs'), path = require('path');
(async () => {
  const dpr = +(process.env.DPR || 1), out = process.env.OUT || path.resolve(__dirname, '../shots/v430-BW'), pre = process.env.PREFIX || 'after', stage = +(process.env.STAGE || 3), step = +(process.env.STEP || 1.0), n = +(process.env.N || 7);
  fs.mkdirSync(out, { recursive: true });
  const T = await open({ dpr }); const { page, errors } = T;
  await T.start(stage); await T.run(0.5);
  // the hall: clear the brood out of it (the shots show the water), its leech gone, the pet at its middle
  const H = await page.evaluate(stage => { const D = window.__pp.arc.game._dbg, DS = window.BEL.dungeonCtx(D.g); const VH = DS.valveHalls[0], r = VH.room;
    for (const m of D.mons) if (!m.dead && !m.boss) { m.guardFn = null; if (m.x > r.x - 3 && m.x < r.x + r.w + 3 && m.y > r.y - 3 && m.y < r.y + r.h + 3) D.hitMon(m, 1e9, { flat: true }); }
    if (VH.leech) D.hitMon(VH.leech, 1e9, { flat: true });
    const G = DS.gate; return { cx: G ? G.cx : VH.cx, cy: G ? G.cy + 2 : VH.cy, gate: !!G, vx: VH.valve.x, vy: VH.valve.y }; }, stage);
  await T.goTo(H.cx, H.cy);
  if (H.gate) { await T.runG(1.0, 'const G = BEL.dungeonCtx(D.g).gate; G.last = { x: G.cx, y: G.cy + 1 }; D.me.x = G.cx; D.me.y = G.cy + 1; G.camT = 1.0;');   // (D1: the pet carried through the hall once, so it is explored (lit) for the shots, then set at its edge)
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, G = window.BEL.dungeonCtx(D.g).gate; G.last = null; D.me.x = G.cx; D.me.y = G.y1 - 0.4; }); }
  await T.runG(3.0, 'const DS = BEL.dungeonCtx(D.g); if (DS.gate) DS.gate.camT = 1.0;');   // (D1: the stage's own look at the gate hall held on it)
  const fr = async i => { const f = path.join(out, `${pre}-drain${H.gate ? '-gate' : ''}-dpr${dpr}-${String(i).padStart(2, '0')}.png`); await T.shot(f); return f; };
  await fr(0);
  // turn the valve(s): D2 one refuge valve; D1 all three gate valves (the last starts the full drain)
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, DS = window.BEL.dungeonCtx(D.g); const vs = D.RIFT.objs.filter(o => o.kind === 'valve');
    if (DS.gate) { for (const VH of DS.valveHalls) if (VH.leech) D.hitMon(VH.leech, 1e9, { flat: true }); vs.forEach(o => { o.locked = false; o.use(o); }); }
    else { const o = vs.find(o => o.valveHall === 0); o.use(o); } });
  const t0 = Date.now(); let lv = [];
  for (let i = 1; i <= n; i++) { const s = await T.runG(step, `const DS = BEL.dungeonCtx(D.g), V = DS.valveHalls[0]; if (DS.gate) DS.gate.camT = 1.0; return [+D.g.t.toFixed(2), DS.gate ? +DS.gate.level.toFixed(3) : +((V.W ? V.W.level : (V.region.off ? 0 : 1))).toFixed(3)];`); lv.push(s[s.length - 1]); await fr(i); }
  console.log(JSON.stringify({ pre, dpr, gate: H.gate, levels: lv, secs: (Date.now() - t0) / 1000 }));
  console.log('errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})();
