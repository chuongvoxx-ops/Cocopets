// Rift 9's monster cap (liveCap 60): a fight floor never has more than sixty monsters on the field; the rest wait unseen
// (g.reserve) and walk back in as the field thins; the floor isn't clear while any wait; half as many gaze scarabs are
// rolled as before; the stronger monsters' health is 30% lower
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 90, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon'] }); const { page, errors, start, run } = T;
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  const S = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg; const live = D.mons.filter(m => !m.dead && !m.fobj && !m.boss); return { live: live.length, reserve: D.g.reserve.length, cap: D.F.liveCap, scarab: live.filter(m => m.type === 'witnessscarab').length + D.g.reserve.filter(m => m.type === 'witnessscarab').length, all: live.length + D.g.reserve.length, done: D.RIFT.self.done }; });
  const hp = await page.evaluate(() => { const M = window.__pp.MON; return { scarab: M.witnessscarab.hp, sentinel: M.brokensentinel.hp, leech: M.calciteleech.hp }; });
  ok(hp.scarab === 252 && hp.sentinel === 322 && hp.leech === 300, 'the stronger monsters have 30% less health (scarab 360 → 252, sentinel 460 → 322)', hp);
  let tot = { s: 0, n: 0 };
  for (const st of [0, 4, 6]) {
    await start('basilica', st); await run(2.5);
    let r = await S(); tot.s += r.scarab; tot.n += r.all;
    ok(r.cap === 60 && r.live <= 60, `stage ${st}: at most sixty on the field (${r.live} out, ${r.reserve} waiting)`, r);
    ok(r.scarab / r.all <= 0.12 && r.scarab / r.all >= 0.04, `stage ${st}: gaze scarabs held to about 11%, spread out (${r.scarab} of ${r.all})`);
    // clear the field in waves: the waiting ones come back, and the floor is not clear while any wait
    let sawBack = false, early = false;
    for (let k = 0; k < 14; k++) {
      await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons.filter(m => !m.dead && !m.boss && !m.fobj).slice(0, 25)) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } });
      await run(1.6); const q = await S(); if (q.reserve < r.reserve) sawBack = true; if (q.done && q.reserve > 0) early = true; r = q; if (!q.live && !q.reserve) break;
    }
    if (st === 0) ok(sawBack, 'waiting monsters walk back in as the field thins');
    ok(!early, `stage ${st}: never clear while monsters still wait`);
    r = await S(); ok(r.live === 0 && r.reserve === 0, `stage ${st}: every monster eventually came and fell`, r);
  }
  console.log('scarab share', (tot.s / tot.n * 100).toFixed(1) + '%', JSON.stringify(tot));
  ok(tot.s / tot.n <= 0.12 && tot.s / tot.n >= 0.04, 'gaze scarabs are about half the share they were (about 23% before)');
  ok(!errors.length, 'no page errors', errors.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); await T.browser.close(); process.exit(bad ? 1 : 0);
})();
