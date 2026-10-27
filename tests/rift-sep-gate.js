// The Twin Reflection (Gemini gate): a giant reflection of the lead pet, its moves, the Mirror Guard throwing blows
// back, phases and shards, the kill ends the trial
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes', 'sepulchre'] }); const { page, errors, shot, start, run } = T;
  await start('sepulchre', 'gate'); await run(4);
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod.S.boss; return m ? { name: m.bname, hp: m.maxhp, r: m.r, ready: m.evil.ready, atk: D.ST.atk } : null; });
  console.log('  boss', JSON.stringify(r)); ok(r && /Reflection/.test(r.name) && r.ready, 'a giant reflection of the lead pet steps out'); await shot('gate-reflection');
  // watch its moves
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod.S.boss, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 30000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (m.act) seen.add(m.act); if (seen.has('dash') && seen.has('fan') && seen.has('guard')) break; } return [...seen]; });
  ok(['dash', 'fan', 'guard'].every(a => r.includes(a)), 'its moves: ' + r.join(','));
  // the Mirror Guard throws a blow back
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, m = mod.S.boss; m.act = 'guard'; m.actT = 0; m.step = 0; const t0 = performance.now(); while (performance.now() - t0 < 1500 && !(m.reflectT > 0)) await new Promise(r => requestAnimationFrame(r)); const hp0 = m.hp, n0 = mod.S.reflected; D.me.hp = D.ST.hp; const pet0 = D.me.hp; D.me.inv = 0; D.hitMon(m, 5000, {}); await new Promise(r => setTimeout(r, 100)); return { reflT: m.reflectT, took: hp0 - m.hp, refl: mod.S.reflected - n0 }; });
  console.log('  guard', JSON.stringify(r)); ok(r.took === 0 && r.refl >= 1, 'Mirror Guard: the blow does nothing and is thrown back');
  await shot('gate-guard');
  // phases and shards
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod.S.boss; m.reflectT = 0; m.guardFn = null; D.hitMon(m, m.maxhp * 0.4, { flat: true }); await new Promise(r => setTimeout(r, 1500)); const p2 = m.phase, sh = D.mons.filter(q => !q.dead && q.type === 'mirrorshard').length; return { p2, sh }; });
  ok(r.p2 >= 2 && r.sh >= 1, 'second phase: shards split off ' + JSON.stringify(r)); await shot('gate-phase2');
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod.S.boss; D.hitMon(m, 1e12, { flat: true }); });
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 25000 }).catch(() => {}); const st = await page.evaluate(() => window.__pp.arc.state); ok(st === 'end', 'the reflection breaks: the trial ends · ' + st);
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
