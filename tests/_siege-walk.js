const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 82, seals: ['belfry','garden','dunes','sepulchre','aurora','yuggoth','library'] }); const { page, start, run, shot, errors } = T; page.on('console', m => { if (/rror/.test(m.text())) console.log('CON', m.text().slice(0, 300)); });
  await start('moon', 6); await run(2);
  const r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; S.wave = 2; S.poured = 90; for (const m of S.mobs) D.hitMon(m, 1e9, { flat: true }); S.mobs = [];
    for (let i = 0; i < 30; i++) await new Promise(r => requestAnimationFrame(r));
    window.__ex0 = JSON.stringify(D.RIFT.exit) + ' rd=' + D.RIFT.done; const mw = D.M.MW, col = []; for (let y = 0; y <= 14; y++) col.push(y + ':' + [15,16,17,18,19].map(x => D.M.G[y * mw + x]).join(''));
    D.me.x = 17.5; D.me.y = 13.5; const path = []; const t0 = performance.now(); while (performance.now() - t0 < 4000) { D.me.vx = 0; D.me.vy = -5; D.X.moveEnt(D.me, 0, -0.08); await new Promise(r => requestAnimationFrame(r)); path.push(+D.me.y.toFixed(1)); }
    return { done: S.done, col, path: path.filter((v, i) => i % 15 === 0), exit: D.RIFT.exit, ex0: window.__ex0, state: window.__pp.arc.state, dead: D.me.dead }; });
  console.log(JSON.stringify(r, null, 0), errors.slice(0,2)); await shot('siege-walk'); process.exit(0); })();
