// measures the bot's damage into the Last Page's ward (no ultimate; strong attacks only with the pet's own magic)
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 72, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth'] }); const { page, start, run } = T;
  for (const ult of [false, true]) {
  await start('library', 9); await run(5);
  const r = await page.evaluate(async ult => { const P = window.__pp, G = P.arc.game, D = G._dbg, b = D.g.boss, M = D.FD.FX.mem, FX = D.FD.FX, g = D.g, me = D.me, C = FX.C; M.hdDone = true; b.hp = b.maxhp * 0.17;
    let t0 = performance.now(); while (performance.now() - t0 < 20000 && !(M.lp && M.lp.st === 'cast')) { await new Promise(r => requestAnimationFrame(r)); me.hp = D.ST.hp; me.x = C.x; me.y = C.y - 6; }
    const L = M.lp; L.ward = L.max = 1e9; me.mp = D.ST.mp; let tLast = 0; const marks = [];
    while (M.lp && M.lp.st === 'cast') { await new Promise(r => requestAnimationFrame(r)); me.hp = D.ST.hp; const w = D.FD.S.weak.core; if (!w || w.dead) continue;
      if (Math.hypot(me.x - w.x, me.y - (w.y + 1.8)) > 1.2) { me.x = w.x + 0.3; me.y = w.y + 1.8; me.vx = me.vy = 0; }
      if (g.t - tLast > 0.26) { tLast = g.t; const sx = FX.sx(w.x), sy = FX.sy(w.y); G.down(sx, sy, 77); G.up(sx, sy, 77); }
      ['strong', 'strong2', 'strong3'].forEach((k, i) => { const ab = D.KIT[k], cd = g[['cdS', 'cdS2', 'cdS3'][i]]; if (ab && me.mp >= ab.cost && cd <= 0) D.useStrong(k); });
      if (ult && D.KIT.ult && me.mp >= D.KIT.ult.cost && g.cdU <= 0) D.useUlt();
      if (marks.length < Math.floor(L.t / 3)) marks.push(Math.round(L.dealt)); }
    return { dealt: Math.round(L.dealt), marks, atk: D.ST.atk, ult }; }, ult);
  console.log(JSON.stringify(r)); }
  await T.browser.close();
})();
