// The Crownstep Ascent (Capricorn gate): crumbling ice bridges, icicles, gusts, cairns, the crown
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 52, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora'] }); const { page, errors, shot, start, run, useObj, state } = T;
  await start('aurora', 'gate'); await run(2.5);
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; return { planks: mod.planks.length, cairns: mod.cairns.length, gusts: mod.gusts.length, goal: document.getElementById('arcGoal').textContent }; });
  console.log('  ', JSON.stringify(r)); ok(r.planks >= 16 && r.cairns === 3 && r.gusts >= 3, 'a cliff of crumbling planks, three cairns, gusts');
  await shot('aur-gate-a');
  // stand still on a plank: it shatters and you fall back
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, p = mod.planks[0]; D.me.x = (p.x0 + p.x1) / 2; D.me.y = p.ty + 0.5; const f0 = mod.S.falls; await new Promise(r => setTimeout(r, 1600)); return { falls: mod.S.falls - f0, gone: p.gone > 0 }; });
  ok(r.falls >= 1 && r.gone, 'a plank you stand still on shatters: you fall back ' + JSON.stringify(r));
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, p = mod.planks[0]; await new Promise(r => setTimeout(r, 5200)); return { back: p.gone === 0, tile: D.RIFT ? null : 0 }; });
  ok(r.back, 'the plank re-forms');
  // icicles fall on you
  r = await page.evaluate(async () => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; const n0 = mod.S.icN; await new Promise(r => setTimeout(r, 4000)); return mod.S.icN - n0; });
  ok(r >= 2, 'icicles keep falling onto shown circles ' + r);
  // light a cairn: falls now return there
  await useObj('cairn', 0); r = await page.evaluate(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { lit: mod.cairns[0].lit, last: mod.S.last.y, cy: mod.cairns[0].y }; });
  ok(r.lit && Math.abs(r.last - r.cy) < 1.5, 'cairn 1 lit: you return there');
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, G = mod.gusts[0], seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 8000 && seen.size < 3) { await new Promise(r => requestAnimationFrame(r)); seen.add(G.st); } return [...seen]; });
  ok(r.length === 3, 'gusts warn, then blow ' + r.join());
  await shot('aur-gate-b');
  // to the crown
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, O = D.M.marks.O[0]; D.me.x = O.x; D.me.y = O.y + 1.2; }); await run(1);
  r = await state(); ok(/Capricorn/i.test(r.goal) || r.banners.some(b => /CAPRICORN/.test(b)), 'the crown: Capricorn wakes · ' + r.goal);
  await shot('aur-gate-c');
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 20000 }).catch(() => {}); ok(await page.evaluate(() => window.__pp.arc.state) === 'end', 'the trial ends');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
