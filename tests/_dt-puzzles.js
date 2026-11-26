// v433 DT: the puzzles keep their rules: the Echo Chamber and the Grub Mounds run as before with a few traps in their bowls
// (their own object kept, its methods wrapped in place; their pieces clear), the Sandstorm Flight gets none; no boss arena gets any.
// HTML=test-dt.html node tests/_dt-puzzles.js
const L = require('./_dt-lib.js'); const { results, ok } = L.reporter();
(async () => { const { browser, page, errors } = await L.open();
  for (const i of [1, 4, 2]) {   // v460 R3: the Sandstorm Flight, the Echo Chamber, Sarrukh (the Grub Mounds retired)
    await L.stage(page, i); await page.waitForTimeout(7000);
    const r = await page.evaluate(() => { const XH = window.__XH, D = window.__pp.arc.game._dbg, F = XH && XH.self && XH.self.dtraps; const mod = XH && XH.self && XH.self.mod;
      return { k: XH ? XH.k : null, kind: window.__pp.RIFT_BY_ID.dunes.stages[D.F.rift.stage].kind, name: D.F.rift.name, traps: F ? F.traps.length : 0, live: self.DUNE_TRAPS.stats.live, mode: mod && mod.R ? mod.R.mode : null, goal: mod && mod.goal ? mod.goal() : null, sameObj: !!(mod && mod.R && (mod.stones || mod.mounds || mod.ribs)) }; });
    console.log(JSON.stringify(r));
    if (r.kind === 'boss') ok(`stage ${i} ${r.name} (boss arena): no dune traps`, r.live === 0, r);
    else if (/Flight/.test(r.name)) ok(`stage ${i} ${r.name}: no dune traps (the pet flies)`, r.traps === 0 && r.live === 0 && !!r.mode, r);
    else ok(`stage ${i} ${r.name}: running as before (its own object, its goal), a few traps in its bowl`, r.traps >= 3 && r.mode === 'play' && typeof r.goal === 'string' && r.sameObj, r); }
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed · page errors: ${errors.length}`); if (errors.length) console.log(errors.slice(0, 6).join('\n'));
  await browser.close(); process.exit(errors.length || results.some(r => !r) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
