// Rift 0 core: after a dungeon is cleared its door opens and the rift still bleeds: three tears in cleared rooms (away from the
// door, never on the pet) brighten and let out small packs, at most eight alive from them; the goal says so; taking the door
// still ends the stage. Pictures (SHOTS on by default here) at phone size. HTML=test-calC.html node tests/_cal-c-tears.js [stage]
process.env.HTML = process.env.HTML || 'test.html';
const path = require('path');
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 1 }); const { page, start, errors } = T; const st = +(process.argv[2] || 0);
  const runG = (secs, o) => page.evaluate(async ([secs, o]) => { const D = window.__pp.arc.game._dbg, t0 = D.g.t; while (D.g.t - t0 < secs) { await new Promise(r => requestAnimationFrame(r)); if (!D.me.dead) D.me.hp = D.ST.hp; D.g.taps = 9; if (o && o.stay) { D.me.x = o.stay[0]; D.me.y = o.stay[1]; } } }, [secs, o || null]);
  const shot = n => page.screenshot({ path: path.resolve(__dirname, `../shots/cal-tears-${st}-${n}${process.env.GPU ? '-gpu' : ''}.png`) });
  await start('caldera', st); if (process.env.GPU) await page.evaluate(() => { window.__NG_GL = 1; });
  // clear the floor at once (the reserve too)
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of (D.g.reserve || [])) m.dead = true; D.g.reserve.length = 0; for (const m of D.mons) if (!m.dead && !m.boss) D.hitMon(m, 1e9, { flat: true }); });
  await runG(1.5);
  const a = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.RIFT.self.amb.C, ex = D.RIFT.exit, me = D.me; return { done: D.RIFT.done, tears: C.tears.map(t => ({ x: +t.x.toFixed(1), y: +t.y.toFixed(1), toExit: +Math.hypot(t.x - ex.x, t.y - ex.y).toFixed(1), toPet: +Math.hypot(t.x - me.x, t.y - me.y).toFixed(1) })), goal: document.getElementById('arcGoal').textContent }; });
  console.log('after clear', JSON.stringify(a));
  // stand a few tiles from the first tear and watch it brighten and pour
  const tr = a.tears[0]; const stay = [tr.x + 3.2, tr.y + 1.2];
  await page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg, w = D.RIFT.self.amb.C.X.walkPoint(x, y, null); D.me.x = w.x; D.me.y = w.y; window.__stay = [w.x, w.y]; }, stay);
  const st2 = await page.evaluate(() => window.__stay);
  const caught = await page.evaluate(async st2 => { const D = window.__pp.arc.game._dbg, C = D.RIFT.self.amb.C, t0 = D.g.t; while (D.g.t - t0 < 15) { await new Promise(r => requestAnimationFrame(r)); D.me.x = st2[0]; D.me.y = st2[1]; D.me.hp = D.ST.hp; if (C.tears[0].warn > 0.2 && C.tears[0].warn < 0.6) return true; } return false; }, st2);
  await shot('warn');
  await runG(1.6, { stay: st2 }); await shot('pour');
  // a long wait: the trickle and its cap
  let maxAlive = 0; for (let i = 0; i < (process.env.SHORT ? 1 : 6); i++) { await runG(4, { stay: st2 }); const n = await page.evaluate(() => window.__pp.arc.game._dbg.RIFT.self.amb.C.tearMons.filter(m => !m.dead).length); maxAlive = Math.max(maxAlive, n); }
  await shot('crowd');
  const b = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.RIFT.self.amb.C; return { spawned: C.tearSpawned || 0, alive: C.tearMons.filter(m => !m.dead).length, kinds: [...new Set(C.tearMons.map(m => m.type))].join(','), xp: Math.round(C.tearMons.reduce((s, m) => s + (m.xp || 0), 0)), goal: document.getElementById('arcGoal').textContent }; });
  console.log('trickle', JSON.stringify(b), 'caught warn', caught, 'max alive from tears', maxAlive);
  // leave by the door
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, e = D.RIFT.exit; D.me.x = e.x; D.me.y = e.y; });
  await runG(0.6); const won = await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 20000 }).then(() => true).catch(() => false);
  console.log('left by the door', won); console.log('errors', errors.length, errors.slice(0, 4)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})();
