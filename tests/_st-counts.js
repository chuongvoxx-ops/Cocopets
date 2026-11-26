// v463 ST: traps per stage of Rift 04, before (the floor's own hazards and the Tower's traps) and after (+ the Sepulchre traps)
// on the same layout; window.__SEPT = 0 adds none; placement rules (plain floor, kept off the start, the way on, the packs, the
// hazards; a stage's pieces); the same layout gives the same traps; the kinds per land; none in the Beast, the Room That
// Remembers or the boss arenas.
// HTML=<test build> node tests/_st-counts.js
const L = require('./_st-lib.js'); const { results, ok } = L.reporter();
(async () => { const { browser, page, errors } = await L.open();
  const rows = [];
  for (const i of (process.env.STAGES || '0,1,4,5,7,9,2,8').split(',').map(Number)) {
    await page.evaluate(() => { window.__SEPT = 1; }); await L.stage(page, i, 5);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.M, XH = window.__XH, ST = self.SEP_TRAPS, F = XH.self.septraps || null;
      const T = F ? F.traps : [], kinds = {}; for (const t of T) { const k = t.kind + (t.bridge ? '@br' : ''); kinds[k] = (kinds[k] || 0) + 1; }
      let bad = 0, near = 99, gapBad = 0, pieces = 99; const start = M.start, MW = M.MW, G = M.G, puz = F && F.info.puzzle;
      for (const t of T) { if (Math.hypot(t.x - start.x, t.y - start.y) < (puz ? 3.3 : 4.4)) bad++; const tx = Math.floor(t.x), ty = Math.floor(t.y);
        if (!t.bridge && t.kind !== 'pend') { if (G[ty * MW + tx] !== 1 || M.props.has(ty * MW + tx)) gapBad++; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const k = (ty + dy) * MW + tx + dx; if (G[k] === 2 || G[k] === 0 && !M.props.has(k)) gapBad++; } }
        if (t.bridge && G[ty * MW + tx] !== 5) gapBad++;
        if (t.kind === 'column') for (let s = 1; s <= 2; s++) if (G[ty * MW + tx + t.dir * s] !== 1) gapBad++;
        for (const h of M.hazards || []) if (h.x != null) near = Math.min(near, Math.hypot(h.x - t.x, h.y - t.y)); for (const p of M.packs || []) if (Math.hypot(p.x - t.x, p.y - t.y) < 1.25) bad++;
        if (puz && M.marks) for (const ch in M.marks) for (const p of M.marks[ch]) pieces = Math.min(pieces, Math.hypot(p.x - t.x, p.y - t.y)); }
      if (!puz && M.rooms.length > 1) { let far = null, best = -1; for (const rm of M.rooms) { const cx = rm.x + rm.w / 2, cy = rm.y + rm.h / 2, d = Math.hypot(cx - start.x, cy - start.y); if (d > best) { best = d; far = { x: cx, y: cy }; } } for (const t of T) if (Math.hypot(t.x - far.x, t.y - far.y) < 2.5) bad++; }
      let same = null; if (F) { const eq = (A, B) => A.length === B.length && A.every((q, j) => q.kind === B[j].kind && Math.abs(q.x - B[j].x) < 1e-6 && Math.abs(q.y - B[j].y) < 1e-6);
        const pz = ST.PUZ[XH.X.F.rift.name], o = F.info.puzzle ? { sec: F.info.sec, n: 1, puzzle: true, count: pz.n, kinds: pz.kinds, mon: pz.mon, keep: pz.keep } : { sec: F.info.sec, n: F.info.n };
        const F2 = ST.place(XH.X, null, o); same = eq(F2.traps, T); F2.stop(); const FS = ST.fields(); FS.length = 0; FS.push(F); }
      return { stage: XH.k, name: XH.X.F.rift.name, biome: XH.X.F.biome, puz: !!puz, sec: F ? F.info.sec : null, hazards: (M.hazards || []).length, tower: (M.traps || []).length, sep: T.length, diag: F ? F.diag : null, kinds, bad, gapBad, nearHaz: +near.toFixed(2), pieces: +pieces.toFixed(2), same }; });
    rows.push(r); console.log(JSON.stringify(r)); }
  await page.evaluate(() => { window.__SEPT = 0; }); await L.stage(page, 0, 5);
  const offR = await page.evaluate(() => { const XH = window.__XH; return { sep: XH.self.septraps ? XH.self.septraps.traps.length : 0 }; });
  await page.evaluate(() => { window.__SEPT = 1; });
  console.log('\nstage                              before  after   (floor hazards + Tower traps -> + Sepulchre traps, one layout)');
  const LAND = { sepulchre: ['pend', 'clock', 'stall'], twoages: ['swap', 'column', 'lance'], borrowed: ['glass', 'vhand', 'rift'] };
  for (const a of rows) { const nb = a.hazards + a.tower, na = nb + a.sep;
    console.log(`${String(a.stage).padStart(2)} ${a.name.padEnd(30)} ${String(nb).padStart(5)}  ${String(na).padStart(5)}   sep ${a.sep} ${JSON.stringify(a.kinds)}`);
    if (a.name === 'The Borrowed Beast' || a.name === 'The Room That Remembers') { ok(`stage ${a.stage} ${a.name}: no traps (its pieces are placed by where you stand)`, a.sep === 0, a); continue; }
    if (a.puz) ok(`stage ${a.stage} ${a.name}: a few traps, off its pieces, the start and the way on; plain floor; the same layout gives the same traps`, a.sep >= 4 && a.bad === 0 && a.gapBad === 0 && a.pieces >= 1.55 && a.same === true, { sep: a.sep, pieces: a.pieces, bad: a.bad, gapBad: a.gapBad, same: a.same });
    else { ok(`stage ${a.stage} ${a.name}: clearly more traps`, a.sep >= 12 && a.sep >= nb, { before: nb, after: na, short: a.diag && a.diag.short.length });
      ok(`stage ${a.stage}: off the start, the way on and the packs; plain floor; off the hazards; the same layout gives the same traps`, a.bad === 0 && a.gapBad === 0 && a.same === true && a.nearHaz >= 1.2, { bad: a.bad, gapBad: a.gapBad, same: a.same, nearHaz: a.nearHaz }); }
    ok(`stage ${a.stage}: only its land's kinds (${a.biome})`, Object.keys(a.kinds).every(k => LAND[a.biome].includes(k.replace('@br', ''))), a.kinds); }
  ok('window.__SEPT = 0: no Sepulchre traps (the floor as before)', offR.sep === 0, offR);
  ok('every land shows all three of its kinds', Object.keys(LAND).every(b => LAND[b].every(k => rows.filter(r => r.biome === b).some(r => Object.keys(r.kinds).some(q => q.startsWith(k))))), {});
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed · page errors: ${errors.length}`); if (errors.length) console.log(errors.slice(0, 6).join('\n'));
  await browser.close(); process.exit(errors.length || results.some(r => !r) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
