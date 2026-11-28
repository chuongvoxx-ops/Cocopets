// (v473 TW) The Windbreak Crossing with no windbreak: stand in the middle of bridge 1, and walk straight across holding up, and walk across steering upwind; falls and times
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 52, seals: ['belfry', 'garden', 'dunes', 'sepulchre'] }); const { page, errors, start, run, killAll } = T;
  const M = (f, a) => page.evaluate(f, a);
  await start('aurora', 1); await run(2); await killAll();
  const info = await M(() => { const D = window.__pp.arc.game._dbg, B = D.RIFT.self.mod.bridges[0]; return { b: B.b, wind: B.wind, spd: D.me.spd || null, r: D.me.r }; }); console.log('bridge 1', JSON.stringify(info));
  for (const mode of ['still', 'up', 'upwind']) {
    const keys = mode === 'up' ? ['ArrowUp'] : mode === 'upwind' ? ['ArrowUp', info.wind > 0 ? 'ArrowLeft' : 'ArrowRight'] : [];
    await M(() => { const D = window.__pp.arc.game._dbg, B = D.RIFT.self.mod.bridges[0]; D.me.x = (B.b.x0 + B.b.x1) / 2; D.me.y = B.b.y1 + 1.2; }); await run(0.3);
    const pr = M(async mode => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = mod.bridges[0]; B.wall = 0; B.wallK = 0; B.exp = 0; const f0 = mod.S.falls;
      D.me.x = (B.b.x0 + B.b.x1) / 2; D.me.y = mode === 'still' ? (B.b.y0 + B.b.y1) / 2 : B.b.y1 + 0.6; D.me.vx = D.me.vy = 0; const t0 = performance.now(); let maxX = 0, x0 = D.me.x, t = 0, crossed = false, minY = D.me.y;
      while (performance.now() - t0 < 4000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; t = (performance.now() - t0) / 1000;
        if (mode !== 'still' && D.inp) { } if (mod.S.falls > f0) break; if (D.me.y < B.b.y0 - 0.5) { crossed = true; break; } maxX = Math.max(maxX, Math.abs(D.me.x - x0)); }
      return { falls: mod.S.falls - f0, t: +t.toFixed(2), crossed, drift: +maxX.toFixed(2), exp: +B.exp.toFixed(2) }; }, mode).catch(e => String(e));
    await page.waitForTimeout(30); for (const k of keys) await page.keyboard.down(k); const r = await pr; for (const k of keys) await page.keyboard.up(k);
    console.log(mode, JSON.stringify(r)); if (mode === 'still') continue; }
  console.log('errors', errors.length); process.exit(0);
})();
