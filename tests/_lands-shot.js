// look at rift 3's three lands: node tests/_lands-shot.js (SHOTS=1)
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 32, seals: ['belfry', 'garden'] }); const { page, errors, shot, start, run } = T;
  for (const st of [0, 5, 8, 4, 9]) {
    await start('dunes', st); await run(3.5);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { biome: D.F.biome, dark: D.F.dark, name: D.F.rift.name, types: [...new Set(D.mons.map(m => m.type))].join(','), n: D.mons.length }; });
    console.log(st, JSON.stringify(r)); await shot('land-' + st);
    if (st === 8) { // walk into the skeletons: let them act a while
      await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; const s = D.mons.filter(m => m.type === 'skelwar' || m.type === 'skelarcher').slice(0, 3); s.forEach((m, i) => { m.x = D.me.x + 1.6 + i * 1.2; m.y = D.me.y + (i - 1) * 0.8; m.aggro = true; }); D.me.hp = 1e9; await new Promise(r => setTimeout(r, 1400)); });
      await shot('land-8-skel');
      const p = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; const m = D.mons.find(q => q.type === 'skelwar' && !q.dead); D.hitMon(m, m.hp + 10, { flat: true }); await new Promise(r => setTimeout(r, 300)); const a = { pile: m.pile, dead: m.dead, mode: m.mode }; await new Promise(r => setTimeout(r, 3800)); return Object.assign(a, { rose: m.rose, pile2: m.pile, dead2: m.dead }); });
      console.log('pile', JSON.stringify(p)); await shot('land-8-after');
    }
  }
  console.log('errors', errors.length, errors.slice(0, 4)); process.exit(0);
})();
