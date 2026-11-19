// v423 GT: traps per fight stage of Rift 02, before (the floor's own thorn spikes and the Tower's traps) and after (+ the garden
// traps) on the same layout; window.__GT = 0 adds none; placement rules (plain floor, kept off the start, the way on, the
// packs, the thorns); the same layout gives the same traps; density and the mix rising section by section (on one layout).
// HTML=test-gt.html node tests/_gt-counts.js
const L = require('./_gt-lib.js'); const { results, ok } = L.reporter();
(async () => { const { browser, page, errors } = await L.open();
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); window.__gtBoot = 1; P.st.unlockAll = true; });
  const rows = [];
  for (const i of [0, 2, 4, 5, 9, 10]) {
    await page.evaluate(() => { window.__GT = 1; }); await L.stage(page, i);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.M, XH = window.__XH, GT = self.GARDEN_TRAPS, F = XH.X.rift ? XH.X.rift.self.gtraps : null;
      const T = F ? F.traps : [], kinds = {}; for (const t of T) { const k = t.kind + (t.bridge ? '@br' : ''); kinds[k] = (kinds[k] || 0) + 1; }
      let bad = 0, near = 99, gapBad = 0; const start = M.start, MW = M.MW, G = M.G;
      for (const t of T) { if (Math.hypot(t.x - start.x, t.y - start.y) < 4.4) bad++; const tx = Math.floor(t.x), ty = Math.floor(t.y);
        if (!t.bridge && t.kind !== 'whip' && t.kind !== 'trip') { if (G[ty * MW + tx] !== 1 || M.props.has(ty * MW + tx)) gapBad++; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const k = (ty + dy) * MW + tx + dx; if (G[k] === 2 || G[k] === 0 && !M.props.has(k)) gapBad++; } }
        if (t.bridge && t.kind !== 'whip' && t.kind !== 'trip' && G[ty * MW + tx] !== 5) gapBad++;
        for (const h of M.hazards) if (h.x != null) near = Math.min(near, Math.hypot(h.x - t.x, h.y - t.y)); for (const p of M.packs) if (Math.hypot(p.x - t.x, p.y - t.y) < 1.25) bad++; }
      const ex = (() => { let far = null, best = -1; for (const r of M.rooms) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2, d = Math.hypot(cx - start.x, cy - start.y); if (d > best) { best = d; far = { x: cx, y: cy }; } } return far; })();
      for (const t of T) if (Math.hypot(t.x - ex.x, t.y - ex.y) < 2.5) bad++;
      // the same layout again: the same traps; and the three sections' rules on this one layout
      let same = null, bySec = [], sameLive = null; if (F) { const eq = (A, B) => A.length === B.length && A.every((q, j) => q.kind === B[j].kind && Math.abs(q.x - B[j].x) < 1e-6 && Math.abs(q.y - B[j].y) < 1e-6); const F2 = GT.place(XH.X, null, { sec: F.info.sec, n: F.info.n }), F4 = GT.place(XH.X, null, { sec: F.info.sec, n: F.info.n }); same = eq(F2.traps, F4.traps); if (!same) window.__gtDiff = [F2.traps.map(t => t.kind + '@' + t.x.toFixed(2) + ',' + t.y.toFixed(2)).join(' '), F4.traps.map(t => t.kind + '@' + t.x.toFixed(2) + ',' + t.y.toFixed(2)).join(' ')]; if (GT.hashLayout(M) === F.info.hash && F2.info.fp === F.info.fp) { sameLive = eq(F2.traps, T); same = same && sameLive; if (!sameLive) window.__gtDiff = [F2.traps.map(t => t.kind + '@' + t.x.toFixed(2) + ',' + t.y.toFixed(2)).join(' '), T.map(t => t.kind + '@' + t.x.toFixed(2) + ',' + t.y.toFixed(2)).join(' '), F2.seed, F.seed, F2.diag, F.diag]; } F2.stop(); F4.stop();
        for (const sec of [1, 2, 3]) { const F3 = GT.place(XH.X, null, { sec, n: 1 }); bySec.push(F3.traps.length); F3.stop(); } const FS = GT.fields(); FS.length = 0; FS.push(F); }
      return { stage: XH.k, name: XH.X.F.rift.name, sec: F ? F.info.sec : null, thorns: M.hazards.length, tower: M.traps.length, garden: T.length, diag: F ? F.diag : null, kinds, bad, gapBad, nearThorn: +near.toFixed(2), same, sameLive, bySec, live: GT.stats.live, diff: window.__gtDiff || null, fpNow: F && GT.fields().length, fpSame: F ? null : null }; });
    rows.push(r); console.log(JSON.stringify(r)); }
  // window.__GT = 0: the floors as before (none added)
  await page.evaluate(() => { window.__GT = 0; }); await L.stage(page, 9);
  const offR = await page.evaluate(() => { const XH = window.__XH, M = window.__pp.arc.game._dbg.M; return { garden: XH.X.rift.self.gtraps ? XH.X.rift.self.gtraps.traps.length : 0, thorns: M.hazards.length, tower: M.traps.length }; });
  await page.evaluate(() => { window.__GT = 1; });
  console.log('\nstage                          before  after   (thorn spikes + Tower traps -> + garden traps, one layout)');
  for (const a of rows) { const nb = a.thorns + a.tower, na = nb + a.garden;
    console.log(`${String(a.stage).padStart(2)} S${a.sec} ${a.name.padEnd(27)} ${String(nb).padStart(5)}  ${String(na).padStart(5)}   garden ${a.garden} ${JSON.stringify(a.kinds)}`);
    ok(`stage ${a.stage} ${a.name}: clearly more traps`, a.garden >= 10 && a.garden >= nb * 0.55, { before: nb, after: na, short: a.diag && a.diag.short.length });
    ok(`stage ${a.stage}: off the start, the way on and the packs; plain floor; the same layout gives the same traps`, a.bad === 0 && a.gapBad === 0 && a.same === true && a.nearThorn >= 1.1, { bad: a.bad, gapBad: a.gapBad, same: a.same, sameLive: a.sameLive, nearThorn: a.nearThorn }); }
  ok('window.__GT = 0: no garden traps (the floor as before)', offR.garden === 0, offR);
  ok('density rises section by section (on the same layout, every stage: S1 < S2, S1 < S3, S3 >= S2 - 1 where the islands run out of room)', rows.every(r => r.bySec[0] < r.bySec[1] && r.bySec[0] < r.bySec[2] && r.bySec[2] >= r.bySec[1] - 1), rows.map(r => r.bySec));
  const avg = s => { const a = rows.filter(r => r.sec === s).map(r => r.garden); return a.reduce((x, y) => x + y, 0) / a.length; };
  console.log('(info) in the stages as played, the average per section (each floor rolled anew; tight floors cap S2 and S3 alike):', JSON.stringify({ s1: avg(1), s2: avg(2), s3: avg(3) }));
  ok('the mix widens: S1 no star-seeds or snares, S2 star-seeds, S3 snares', rows.filter(r => r.sec === 1).every(r => !Object.keys(r.kinds).some(k => /star|trip/.test(k))) && rows.filter(r => r.sec === 2).every(r => Object.keys(r.kinds).some(k => /star/.test(k))) && rows.filter(r => r.sec === 3).every(r => Object.keys(r.kinds).some(k => /trip/.test(k))), {});
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed · page errors: ${errors.length}`); if (errors.length) console.log(errors.slice(0, 6).join('\n'));
  await browser.close(); process.exit(errors.length || results.some(r => !r) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
