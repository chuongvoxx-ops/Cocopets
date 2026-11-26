// v433 DT: traps per stage of Rift 03, before (the floor's sand spouts and the Tower's traps) and after (+ the dune traps) on
// the same layout; window.__DT = 0 adds none; placement rules (plain floor, kept off the start, the way on, the packs, the
// spouts; a puzzle's pieces); the same layout gives the same traps; density rising section by section; the kinds per land.
// HTML=test-dt.html node tests/_dt-counts.js
const L = require('./_dt-lib.js'); const { results, ok } = L.reporter();
(async () => { const { browser, page, errors } = await L.open();
  const rows = [];
  for (const i of (process.env.STAGES || '0,4,3,6')   /* v460 R3: the three dungeons and the Echo Chamber (the eight-stage route) */.split(',').map(Number)) {
    await page.evaluate(() => { window.__DT = 1; }); await L.stage(page, i);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.M, XH = window.__XH, DT = self.DUNE_TRAPS, F = XH.self.dtraps || null;
      const T = F ? F.traps : [], kinds = {}; for (const t of T) { const k = t.kind + (t.bridge ? '@br' : ''); kinds[k] = (kinds[k] || 0) + 1; }
      let bad = 0, near = 99, gapBad = 0, pieces = 99; const start = M.start, MW = M.MW, G = M.G, puz = XH.X.F.rift && F && F.info.puzzle;
      for (const t of T) { if (Math.hypot(t.x - start.x, t.y - start.y) < (puz ? 3.3 : 4.4)) bad++; const tx = Math.floor(t.x), ty = Math.floor(t.y);
        if (!t.bridge && t.kind !== 'tooth') { if (G[ty * MW + tx] !== 1 || M.props.has(ty * MW + tx)) gapBad++; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const k = (ty + dy) * MW + tx + dx; if (G[k] === 2 || G[k] === 0 && !M.props.has(k)) gapBad++; } }
        if (t.bridge && t.kind !== 'tooth' && G[ty * MW + tx] !== 5) gapBad++;
        for (const h of M.hazards || []) if (h.x != null) near = Math.min(near, Math.hypot(h.x - t.x, h.y - t.y)); for (const p of M.packs || []) if (Math.hypot(p.x - t.x, p.y - t.y) < 1.25) bad++;
        if (M.marks) for (const ch in M.marks) for (const p of M.marks[ch]) pieces = Math.min(pieces, Math.hypot(p.x - t.x, p.y - t.y)); }
      if (!puz && M.rooms.length > 1) { const ex = (() => { let far = null, best = -1; for (const r of M.rooms) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2, d = Math.hypot(cx - start.x, cy - start.y); if (d > best) { best = d; far = { x: cx, y: cy }; } } return far; })(); for (const t of T) if (Math.hypot(t.x - ex.x, t.y - ex.y) < 2.5) bad++; }
      let same = null, bySec = []; if (F) { const eq = (A, B) => A.length === B.length && A.every((q, j) => q.kind === B[j].kind && Math.abs(q.x - B[j].x) < 1e-6 && Math.abs(q.y - B[j].y) < 1e-6);
        const o = F.info.puzzle ? { sec: F.info.sec, n: 1, puzzle: true, count: T.length, kinds: DT.PUZ[XH.X.F.rift.name].kinds } : { sec: F.info.sec, n: F.info.n };
        const F2 = DT.place(XH.X, null, o), F4 = DT.place(XH.X, null, o); same = eq(F2.traps, F4.traps) && eq(F2.traps, T); F2.stop(); F4.stop();
        if (!F.info.puzzle) for (const sec of [1, 2, 3]) { const F3 = DT.place(XH.X, null, { sec, n: 1 }); bySec.push(F3.traps.length); F3.stop(); } const FS = DT.fields(); FS.length = 0; FS.push(F); }
      return { stage: XH.k, name: XH.X.F.rift.name, biome: XH.X.F.biome, puz: !!puz, sec: F ? F.info.sec : null, spouts: (M.hazards || []).length, tower: (M.traps || []).length, dune: T.length, diag: F ? F.diag : null, kinds, bad, gapBad, nearSpout: +near.toFixed(2), pieces: +pieces.toFixed(2), same, bySec, live: DT.stats.live }; });
    rows.push(r); console.log(JSON.stringify(r)); }
  // window.__DT = 0: the floors as before (none added)
  await page.evaluate(() => { window.__DT = 0; }); await L.stage(page, 3);
  const offR = await page.evaluate(() => { const XH = window.__XH; return { dune: XH.self.dtraps ? XH.self.dtraps.traps.length : 0 }; });
  await page.evaluate(() => { window.__DT = 1; });
  console.log('\nstage                            before  after   (sand spouts + Tower traps -> + dune traps, one layout)');
  const LAND = { 1: ['sink', 'tooth', 'res'], 2: ['vent', 'shard', 'mirage'], 3: ['hands', 'quick', 'gas'] };
  for (const a of rows) { const nb = a.spouts + a.tower, na = nb + a.dune;
    console.log(`${String(a.stage).padStart(2)} S${a.sec} ${a.name.padEnd(27)} ${String(nb).padStart(5)}  ${String(na).padStart(5)}   dune ${a.dune} ${JSON.stringify(a.kinds)}`);
    if (a.puz) ok(`stage ${a.stage} ${a.name} (puzzle): a few traps, off its pieces, the start and the way on; the same layout gives the same traps`, a.dune >= 3 && a.bad === 0 && a.gapBad === 0 && a.pieces >= 1.75 && a.same === true, { dune: a.dune, pieces: a.pieces, bad: a.bad, gapBad: a.gapBad, same: a.same });
    else { ok(`stage ${a.stage} ${a.name}: clearly more traps`, a.dune >= 10 && a.dune >= nb * 0.7, { before: nb, after: na, short: a.diag && a.diag.short.length });
      ok(`stage ${a.stage}: off the start, the way on and the packs; plain floor; off the sand spouts; the same layout gives the same traps`, a.bad === 0 && a.gapBad === 0 && a.same === true && a.nearSpout >= 1.2, { bad: a.bad, gapBad: a.gapBad, same: a.same, nearSpout: a.nearSpout }); }
    ok(`stage ${a.stage}: only its land's kinds (section ${a.sec})`, Object.keys(a.kinds).every(k => LAND[a.sec].includes(k.replace('@br', ''))), a.kinds); }
  ok('window.__DT = 0: no dune traps (the floor as before)', offR.dune === 0, offR);
  const fr = rows.filter(r => !r.puz);
  ok('density rises section by section (on the same layout, every fight stage: S1 < S2, S1 < S3, S3 >= S2 - 1 where the islands run out of room)', fr.every(r => r.bySec[0] < r.bySec[1] && r.bySec[0] < r.bySec[2] && r.bySec[2] >= r.bySec[1] - 1), fr.map(r => r.bySec));
  ok('every land shows all three of its kinds in its dungeon', [1, 2, 3].every(s => LAND[s].every(k => fr.filter(r => r.sec === s).some(r => Object.keys(r.kinds).some(q => q.startsWith(k))))), {});
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed · page errors: ${errors.length}`); if (errors.length) console.log(errors.slice(0, 6).join('\n'));
  await browser.close(); process.exit(errors.length || results.some(r => !r) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
