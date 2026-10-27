// The Raincatcher Array (Aquarius gate): catch falling stars on their rings, carry up to three, deliver by colour,
// stay out from under red debris; three dishes of four
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 62, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth'] }); const { page, errors, shot, start, run } = T;
  await start('yuggoth', 'gate'); await run(3);
  let r = await page.evaluate(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { dishes: mod.dishes.length, drops: mod.S.drops.length }; });
  ok(r.dishes === 3 && r.drops >= 1, 'three receiver dishes; stars begin to fall ' + JSON.stringify(r)); await shot('yug-gate-a');
  // catch: stand on the next good star's ring
  const catchOne = () => page.evaluate(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; const t0 = performance.now(); let q = null; while (performance.now() - t0 < 8000) { q = S.drops.find(d => !d.bad && !d.done); if (q) break; await new Promise(r => requestAnimationFrame(r)); } if (!q) return null; const n0 = S.carry.length; while (!q.done) { D.me.x = q.x; D.me.y = q.y; await new Promise(r => requestAnimationFrame(r)); } await new Promise(r => requestAnimationFrame(r)); return { got: S.carry.length - n0, col: q.C.k }; });
  r = await catchOne(); ok(r && r.got === 1, 'standing in a star\'s ring as it lands: caught ' + JSON.stringify(r));
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, s2 = S.carry[0], d = mod.dishes.find(q => q.C === s2.C); D.me.x = d.x; D.me.y = d.y + 0.5; await new Promise(r => setTimeout(r, 200)); return { n: d.n, carry: S.carry.length }; });
  ok(r.n === 1 && r.carry === 0, 'walking into the dish of its colour delivers it');
  // debris hurts
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; S.drops.push({ x: D.me.x, y: D.me.y, bad: true, C: null, t: 0, fall: 0.5, r: 1.15 }); const b0 = S.burnt; D.me.dodge = null; await new Promise(r => setTimeout(r, 800)); return S.burnt - b0; });
  ok(r === 1, 'red debris hurts if you are under it');
  // stars dim out if held too long
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S, mod = D.RIFT.self.mod; S.carry.push({ C: mod.dishes[0].C, life: 0.3 }); D.me.x = 11.5; D.me.y = 9; await new Promise(r => setTimeout(r, 600)); return S.carry.length; });
  ok(r === 0, 'a carried star goes out if not delivered in time');
  // fill everything
  await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; for (const d of mod.dishes) { d.n = 3; mod.S.carry = [{ C: d.C, life: 10 }]; D.me.x = d.x; D.me.y = d.y + 0.4; await new Promise(r => setTimeout(r, 250)); } });
  r = await T.state(); ok(/Aquarius/i.test(r.goal) || r.banners.some(b => /AQUARIUS/.test(b)), 'three dishes full: Aquarius wakes · ' + r.goal); await shot('yug-gate-b');
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 20000 }).catch(() => {}); ok(await page.evaluate(() => window.__pp.arc.state) === 'end', 'the trial ends');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
