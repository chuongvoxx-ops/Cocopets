// Ahuul's horde: half way down, 400 creatures pour out (70 at a time); it can't be struck meanwhile and rains frost;
// when the last falls its head comes low
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 52, seals: ['belfry', 'garden', 'dunes', 'sepulchre'] }); const { page, errors, shot, start, run } = T; page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('  console:', m.text().slice(0, 300)); });
  await start('aurora', 8); await run(6);
  // bring it to half health (through the second phase's cut)
  let r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.under = false; D.hitMon(b, b.hp - b.maxhp * 0.6, { pierce: true }); await new Promise(r => setTimeout(r, 2500)); b.under = false; D.hitMon(b, b.hp - b.maxhp * 0.5, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && b.act !== 'horde') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { act: b.act, lv: D.FD.FX.S.lv, frac: b.hp / b.maxhp }; });
  console.log('  ', JSON.stringify(r)); ok(r.act === 'horde', 'half way down, the horde begins');
  for (let i = 0; i < 5; i++) { await run(0.5); console.log('   t', JSON.stringify(await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; return { act: b.act, hd: !!M.hd, hdone: M.hordeDone, lv: D.FD.FX.S.lv, mons: D.mons.filter(q => !q.dead && q.horde).length }; }))); }
  await shot('aur-horde');
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; const h0 = b.hp; D.hitMon(b, 1e6, { pierce: true }); const alive = M.hd.list.length, tel = (D.FD.FX.S.teles || []).length; return { untouched: b.hp === h0, alive, under: b.under, left: M.hd.left }; });
  console.log('  ', JSON.stringify(r)); ok(r.untouched && r.alive > 20 && r.alive <= 70, 'it cannot be struck while they pour out, no more than seventy at once');
  // clear them all (as they come)
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, kinds = new Set(); let tele = 0; const t0 = performance.now(); while (performance.now() - t0 < 120000 && M.hd) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; for (const q of D.mons) if (!q.dead && q.horde) { kinds.add(q.type); q.guardFn = null; D.hitMon(q, 1e9, { flat: true }); } if (D.FD.FX.S.teles && D.FD.FX.S.teles.length) tele++; } return { done: !!M.hordeDone, act: b.act, under: b.under, kinds: [...kinds], tele }; });
  console.log('  ', JSON.stringify(r)); ok(r.done && r.act === 'bow' && !r.under, 'all 400 cleared: its head comes low and it can be struck again');
  ok(['rimescuttler', 'yeti', 'veilray', 'icegolem'].every(k => r.kinds.includes(k)), 'the horde is the summit\'s creatures: ' + r.kinds.join(','));
  await shot('aur-horde-end');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
