const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 82, seals: ['belfry','garden','dunes','sepulchre','aurora','yuggoth','library'] }); const { page, start, run } = T;
  await start('moon', 3); await run(1);
  const r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, s = mod.seals[0]; mod.S.grace = 99; const w = D.X.spawnMon('dustwraith', s.x - 3, s.y + 3, { rift: true }); w.freeze = 99; const h0 = s.hp, hw = w.maxhp; const t0 = performance.now(); while (performance.now() - t0 < 6000) { D.me.x = s.x; D.me.y = s.y + 1.4; D.me.hp = D.ST.hp; await new Promise(r => requestAnimationFrame(r)); } return { sealMax: Math.round(s.maxhp), lost: Math.round(h0 - s.hp), wraith: Math.round(hw) }; });
  console.log(JSON.stringify(r)); process.exit(0); })();
