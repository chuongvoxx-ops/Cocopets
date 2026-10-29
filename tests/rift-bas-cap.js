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
  // a scarab's gaze leaves the field with it: killed, or stepped off the field by the cap
  await start('basilica', 6); await run(2);
  const gz = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, BAS = D.RIFT.self.amb.BAS, srcs = () => BAS.sources({ g: D.g }).filter(s => s.mon); const tick = () => new Promise(r => { const t0 = D.g.t; const f = () => D.g.t - t0 > 0.6 ? r() : requestAnimationFrame(f); f(); });
    const sc = D.mons.filter(m => m.type === 'witnessscarab' && !m.dead); if (sc.length < 2) return { n: sc.length };
    await tick(); const a = sc[0], b = sc[1], n0 = srcs().length, hadA = srcs().some(s => s.mon === a);
    D.hitMon(a, 1e9, { flat: true }); await tick(); const goneA = !srcs().some(s => s.mon === a);
    const i = D.mons.indexOf(b); D.mons.splice(i, 1); D.g.reserve.push(b); await tick(); const goneB = !srcs().some(s => s.mon === b);
    return { n: sc.length, n0, hadA, goneA, goneB, after: srcs().length }; });
  ok(gz.n < 2 || (gz.hadA && gz.goneA && gz.goneB), 'a scarab\'s gaze cone goes when it dies, and when it steps off the field', gz);
  // monsters and minis 30% lighter: monEase 0.35, miniHp 0.42, the minis' blows x0.7
  const rf = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID.basilica; return { monEase: R.monEase, miniDmg: R.miniDmg, miniHp: R.stages.filter(s => s.mini).map(s => s.hpK) }; });
  ok(rf.monEase === 0.35 && rf.miniDmg === 0.7 && rf.miniHp.every(v => v === 0.42), 'monsters and mini bosses 30% lighter in health and blows', rf);
  await start('basilica', 4); await run(2);
  const mini = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, m = D.mons.find(m => m.boss && m.mini); return m ? { hp: Math.round(m.maxhp), dmg: Math.round(m.dmg * 10) / 10 } : null; });
  console.log('  mini', JSON.stringify(mini));
  console.log('scarab share', (tot.s / tot.n * 100).toFixed(1) + '%', JSON.stringify(tot));
  ok(tot.s / tot.n <= 0.12 && tot.s / tot.n >= 0.04, 'gaze scarabs are about half the share they were (about 23% before)');
  ok(!errors.length, 'no page errors', errors.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); await T.browser.close(); process.exit(bad ? 1 : 0);
})();
