// v433 DT: a look at Rift 03's stages (tiles, rooms, hazards, traps) — a probe, no checks
const L = require('./_dt-lib.js');
(async () => { const { browser, page, errors } = await L.open();
  for (const i of (process.env.STAGES || '0,1,4,5,6,8,9,10').split(',').map(Number)) { await L.stage(page, i);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.M, XH = window.__XH, cnt = {}; for (const v of M.G) cnt[v] = (cnt[v] || 0) + 1;
      return { k: XH && XH.k, name: XH && XH.X.F.rift.name, biome: XH && XH.X.F.biome, MW: M.MW, MH: M.MH, tiles: cnt, rooms: (M.rooms || []).length, props: M.props ? M.props.size : 0, packs: (M.packs || []).length, hazards: (M.hazards || []).map(h => h.kind + (h.area ? '*' : '')).join(','), traps: (M.traps || []).length, trapKinds: (M.traps || []).map(t => t.kind).join(','), shrines: (M.shrines || []).length, marks: M.marks ? Object.keys(M.marks).join('') : '', start: M.start, T: XH.X.Tz(), objs: XH.X.rift && XH.X.rift.objs ? XH.X.rift.objs.length : null, dmgMul: XH.X.F.dmgMul, hp: XH.X.ST().hp, mod: XH.X.F.rift && XH.X.F.rift.mod }; });
    console.log(JSON.stringify(r)); }
  console.log('errors', errors.length, errors.slice(0, 3)); await browser.close(); })().catch(e => { console.error(e); process.exit(2); });
