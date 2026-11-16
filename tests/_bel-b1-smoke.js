// v391 B1: the rebuilt Drowned Belfry: every stage loads with no page errors; the Clapper Counterweights solve; the Rising
// Tide Walk completes (and a surge sweeps you back); the sealing records the Tide Sigil and its necklace once; old saves map
// onto the new six stages. usage: HTML=test-bel1.html node tests/_bel-b1-smoke.js   env: SHOTS=1, ONLY=clap,tide,seal,mig,load
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
const ONLY = (process.env.ONLY || 'load,clap,tide,hall,seal,mig').split(',');
(async () => {
  const T = await open({ lvl: 14 }); const { page, errors, start, run, rs } = T;
  const info = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID.belfry; return { n: R.stages.length, kinds: R.stages.map(s => s.kind).join(','), names: R.stages.map(s => s.name).join(' | '), bosses: R.stages.map(s => s.boss || '').join(','), fiends: ['belkharrox', 'belnhalu', 'beluldroth'].map(id => !!window.__pp.FIEND_DEFS[id]) }; });
  console.log('stages', JSON.stringify(info));
  ok(info.n === 6 && /belkharrox,,belnhalu,,beluldroth$/.test(info.bosses.replace(/^,/, '')), 'six stages in the spec\'s order: hall, Kharrox, clappers, Nhalu, tide, Uldroth', info.bosses);
  const D = f => page.evaluate(f);
  const near = (kind, i) => page.evaluate(([kind, i]) => { const G = window.__pp.arc.game._dbg, o = G.RIFT.objs.filter(o => o.kind === kind)[i]; if (!o) return null; G.me.x = o.x + 0.55; G.me.y = o.y + 0.35; G.me.vx = G.me.vy = 0; o.used = false; o.ch = 0; return { x: o.x, y: o.y }; }, [kind, i]);
  // (game-time waits: the headless page runs slowly, so wall-clock waits pass too little game time)
  const gt = secs => page.evaluate(async secs => { const G = window.__pp.arc.game._dbg, t0 = G.g.t, w0 = performance.now(); while (G.g.t - t0 < secs && performance.now() - w0 < secs * 20000) { await new Promise(r => requestAnimationFrame(r)); if (G.me && !G.me.dead) { G.me.hp = G.ST.hp; G.me.mp = 999; } } }, secs);
  const use = async (kind, i) => { const r = await near(kind, i); await gt(1.0); await page.evaluate(() => { const G = window.__pp.arc.game._dbg; G.me.x += 3; }); await gt(0.1); return r; };
  const killBrood = () => page.evaluate(async () => { const G = window.__pp.arc.game._dbg; for (let k = 0; k < 3; k++) { for (const m of G.mons) if (!m.dead && !m.boss) { m.guardFn = null; G.hitMon(m, 1e9, { flat: true }); } await new Promise(r => setTimeout(r, 150)); } });
  const killGuard = () => page.evaluate(async () => { const G = window.__pp.arc.game._dbg; const m = G.mons.find(m => m.belGuard && !m.dead); if (!m) return false; m.aggro = true; G.hitMon(m, 1e12, { flat: true }); await new Promise(r => setTimeout(r, 300)); return m.dead; });
  const exitNow = async () => { await page.evaluate(() => { const G = window.__pp.arc.game._dbg, e = G.RIFT.exit; G.me.x = e.x; G.me.y = e.y; }); await gt(0.6); await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 25000 }); await page.waitForTimeout(500); };
  if (ONLY.includes('load')) for (let s = 0; s < info.n; s++) { const e0 = errors.length; await start('belfry', s); await gt(+(process.env.RUN || 3));
    const r = await D(() => { const G = window.__pp.arc.game._dbg; const A = G.RIFT.self.amb || {}; return { biome: G.F.biome, kind: G.F.rift.kind, fiend: !!G.F.fiend, objs: [...new Set(G.RIFT.objs.map(o => o.kind))].join(','), mons: G.mons.filter(m => !m.dead).map(m => m.type || (m.bk && m.bk.id)).join(','), goal: document.getElementById('arcGoal').textContent, glows: A.glows ? A.glows.length : -1, shallow: A.C ? A.C.shallow.length : -1, waves: A.C ? A.C.waves.length : -1, guard: !!(A.C && A.C.guard), props: (G.props || []).length }; });
    console.log(' ', s, JSON.stringify(r)); ok(errors.length === e0, `stage ${s} loads and runs with no page errors`, errors.slice(e0, e0 + 2)); }
  if (ONLY.includes('clap')) {
    await start('belfry', 2); let r = await D(() => { const G = window.__pp.arc.game._dbg, mod = G.RIFT.self.mod; return { claps: G.RIFT.objs.filter(o => o.kind === 'clapper').map(o => o.n).join(), pans: G.RIFT.objs.filter(o => o.kind === 'pan').length, leeches: G.mons.filter(m => m.type === 'leech' && m.belHold).length, pack: G.mons.filter(m => !m.dead && !m.boss && m.type !== 'leech').map(m => m.type).sort().join(), guard: !!G.mons.find(m => m.belGuard === 'cistern'), biome: G.F.biome }; });
    ok(r.claps === '1,2,3' && r.pans === 2 && r.leeches === 2 && r.pack === 'crawler,crawler,crawler,reeflantern' && r.guard && r.biome === 'belcistern', 'the cistern: clappers 1/2/3, two pans, two leeches on the rack, three crawlers and a lantern, the lift guardian', r);
    await use('clapper', 2); r = await D(() => window.__pp.arc.game._dbg.RIFT.self.mod.R.carrying); ok(!r, 'the three-ring clapper will not lift while the leeches hold it');
    await page.evaluate(() => { const G = window.__pp.arc.game._dbg; for (const m of G.mons) if (!m.dead && m.type === 'leech') G.hitMon(m, 1e9, { flat: true }); }); await gt(0.3);
    await use('clapper', 0); r = await D(() => { const R = window.__pp.arc.game._dbg.RIFT.self.mod.R; return R.carrying && R.carrying.n; }); ok(r === 1, 'standing at the one-ring clapper lifts it into the bubble', r);
    if (process.env.SHOTS) await page.screenshot({ path: 'shots/bel-b1-clap-carry.png' });
    await use('pan', 0); r = await D(() => { const R = window.__pp.arc.game._dbg.RIFT.self.mod.R; return { w: R.pans.map(P => P.w), c: !!R.carrying }; }); ok(r.w.join() === '1,0' && !r.c, 'set on the west pan: its needle reads one', r);
    await use('pan', 0); r = await D(() => { const R = window.__pp.arc.game._dbg.RIFT.self.mod.R; return { w: R.pans.map(P => P.w), c: R.carrying && R.carrying.n }; }); ok(r.w.join() === '0,0' && r.c === 1, 'a wrongly placed clapper comes back off into the bubble', r);
    await use('pan', 1); await use('clapper', 2); await use('pan', 0);
    r = await D(() => { const G = window.__pp.arc.game._dbg, R = G.RIFT.self.mod.R; return { w: R.pans.map(P => P.w), pair: R.finalPair ? R.finalPair.length : 0 }; }); await gt(1.2);
    r = await D(() => { const G = window.__pp.arc.game._dbg, R = G.RIFT.self.mod.R; return { w: R.pans.map(P => P.w), pair: R.finalPair ? R.finalPair.length : 0 }; }); ok(r.w.join() === '3,1' && r.pair === 2, 'the three alone on the west pan: it reads three and two crawlers climb from the drains', r);
    await use('clapper', 1); await use('pan', 1); r = await D(() => { const G = window.__pp.arc.game._dbg, R = G.RIFT.self.mod.R; return { w: R.pans.map(P => P.w), lift: R.liftOpen, goal: document.getElementById('arcGoal').textContent }; });
    ok(r.w.join() === '3,3' && !r.lift, 'both needles read three; the lift waits for the drain crawlers', r);
    if (process.env.SHOTS) await page.screenshot({ path: 'shots/bel-b1-clap-solved.png' });
    await killBrood(); await gt(0.6); r = await D(() => { const G = window.__pp.arc.game._dbg; return { lift: G.RIFT.self.mod.R.liftOpen, done: G.RIFT.done, goal: document.getElementById('arcGoal').textContent }; }); ok(r.lift && !r.done, 'the pair beaten: the lift unlocks, its guardian still bars it', r);
    ok(await killGuard(), 'the guardian falls'); await gt(2.5); r = await D(() => window.__pp.arc.game._dbg.RIFT.done); ok(r, 'the lift is open');
    await exitNow(); r = await rs(); ok(r.prog.belfry === 3, 'checkpoint: Nhalu (stage 4)', r.prog);
  }
  if (ONLY.includes('tide')) {
    await start('belfry', 4); let r = await D(() => { const G = window.__pp.arc.game._dbg, mod = G.RIFT.self.mod; return { valves: G.RIFT.objs.filter(o => o.kind === 'valve').length, legs: mod.legs.map(L => L.mons.map(m => m.type).sort().join('+')).join(' / '), phase: mod.R.phase, shelves: mod.legs.map(L => L.shelf.length) }; });
    ok(r.valves === 3 && r.legs === 'crawler+crawler / leech+reeflantern / crawler+crawler+crawler' && r.phase === 'wait' && r.shelves.every(n => n >= 6), 'three landings: two crawlers; a leech on the valve and a lantern; three crawlers; dry shelves; the tide waits for the line', r);
    await page.evaluate(() => { const G = window.__pp.arc.game._dbg; G.me.y -= 6; }); await gt(0.4); r = await D(() => window.__pp.arc.game._dbg.RIFT.self.mod.R); ok(r.phase === 'run' && r.timer > 14, 'crossing the tide line starts the first surge timer', { phase: r.phase, t: r.timer });
    // a surge caught below the line: swept back with damage
    r = await page.evaluate(async () => { const G = window.__pp.arc.game._dbg, R = G.RIFT.self.mod.R, h0 = G.me.hp; R.timer = 0.05; const t0 = G.g.t, w0 = performance.now(); while (G.g.t - t0 < 4.5 && performance.now() - w0 < 60000 && !R.swept) await new Promise(q => requestAnimationFrame(q)); return { swept: R.swept, hurt: G.me.hp < h0, phase: R.phase }; }); ok(r.swept === 1, 'a surge that catches the pet carries it back (with damage: the test pet is in god mode)', r);
    // a surge with the pet on a dry shelf: safe
    r = await page.evaluate(async () => { const G = window.__pp.arc.game._dbg, R = G.RIFT.self.mod.R, s = R.legs[0].shelf[0]; { const t1 = G.g.t; while (G.g.t - t1 < 3.6) await new Promise(q => requestAnimationFrame(q)); } G.me.x = s.tx + 0.5; G.me.y = s.ty + 0.5; G.me.vx = G.me.vy = 0; R.timer = 0.05; R.phase = 'run'; const sw = R.swept, t0 = G.g.t; while (G.g.t - t0 < 4) { await new Promise(q => requestAnimationFrame(q)); G.me.x = s.tx + 0.5; G.me.y = s.ty + 0.5; } return { swept: R.swept - sw }; }); ok(r.swept === 0, 'on a dry shelf the surge passes the pet by', r);
    if (process.env.SHOTS) { await page.evaluate(() => { const R = window.__pp.arc.game._dbg.RIFT.self.mod.R; R.timer = 3.2; R.phase = 'run'; }); await gt(0.5); await page.screenshot({ path: 'shots/bel-b1-tide-warn.png' }); }
    for (let i = 0; i < 3; i++) { await page.evaluate(i => { const G = window.__pp.arc.game._dbg, L = G.RIFT.self.mod.legs[i]; for (const m of L.mons) if (!m.dead) G.hitMon(m, 1e9, { flat: true }); }, i); await gt(0.3); await use('valve', i); }
    r = await D(() => { const G = window.__pp.arc.game._dbg, R = G.RIFT.self.mod.R; return { secured: R.secured, phase: R.phase, done: G.RIFT.done }; }); ok(r.secured === 3 && r.phase === 'done' && !r.done, 'three landings secured: the upper doors wait on their guardian', r);
    ok(await killGuard(), 'the guardian of the upper doors falls'); await gt(2.5); r = await D(() => window.__pp.arc.game._dbg.RIFT.done); ok(r, 'the tide walk is complete');
    await exitNow(); r = await rs(); ok(r.prog.belfry === 5, 'checkpoint: Uldroth (stage 6)', r.prog);
  }
  if (ONLY.includes('hall')) {
    await start('belfry', 0); const ph = await D(() => window.__pp.RIFT_BY_ID.belfry.stages[0].placeholder);
    if (ph) { let r; await killBrood(); await gt(2.6); r = await D(() => { const G = window.__pp.arc.game._dbg; return { done: G.RIFT.done, guard: !!G.mons.find(m => m.belGuard === 'hall' && !m.dead), r: G.RIFT.exit && G.RIFT.exit.r }; }); ok(r.done && r.guard && r.r < 0, 'the stand-in hall: the central door rises and its guardian comes out to hold it', r);
      ok(await killGuard(), 'the hall guardian falls'); await gt(2.6); r = await D(() => window.__pp.arc.game._dbg.RIFT.exit.r); ok(r > 0, 'the raised door opens', r); await exitNow(); r = await rs(); ok(r.prog.belfry === 1, 'checkpoint: Kharrox', r.prog); }
    else { // worker B2's hall: raise its door (its own tests cover the trials), then the section's guardian must come out to hold it
      const st0 = await D(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; try { mod.doorStart(); return 'ok'; } catch (e) { return String(e && e.message); } });
      await gt(10); let r = await D(() => { const G = window.__pp.arc.game._dbg; return { done: G.RIFT.done, guard: !!G.mons.find(m => m.belGuard === 'hall' && !m.dead), r: G.RIFT.exit && G.RIFT.exit.r }; });
      ok(st0 === 'ok' && r.done && r.guard && r.r < 0, 'the hall: the central door rises and Brinefang comes out to hold it', { st0, r });
      if (process.env.SHOTS) await page.screenshot({ path: 'shots/bel-b1-hall-guard.png' });
      ok(await killGuard(), 'the hall guardian falls'); await gt(2.6); r = await D(() => window.__pp.arc.game._dbg.RIFT.exit.r); ok(r > 0, 'the risen door opens', r); }
  }
  if (ONLY.includes('seal')) {
    const acc0 = await D(() => window.__pp.st.accs.filter(a => a.sp === 'tide').length);
    await start('belfry', 5); await gt(4); const fiend = await D(() => !!window.__pp.arc.game._dbg.F.fiend);
    const slay = () => page.evaluate(async () => { const G = window.__pp.arc.game._dbg, w0 = performance.now(); while (performance.now() - w0 < 90000) { const b = G.mons.find(m => m.boss && !m.dead && !m.belGuard); if (!b) break; b.aggro = true; b.under = false; b.locked = false; b.guardA = null; G.me.hp = G.ST.hp; G.hitMon(b, 1e13, { flat: true, pierce: true }); for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r)); } });
    await slay();
    const seen = await page.evaluate(async () => { const G = window.__pp.arc.game._dbg, s = new Set(), t0 = performance.now(); while (performance.now() - t0 < 150000) { await new Promise(r => requestAnimationFrame(r)); G.banners.forEach(b => s.add(b.s)); if (window.__pp.arc.state !== 'play') break; } return [...s]; });
    console.log('  seal', fiend ? '(3D Uldroth)' : '(stand-in)', JSON.stringify(seen)); await page.waitForTimeout(1500);
    let r = await D(() => ({ sealed: !!window.__pp.riftState().seals.belfry, gate: window.__pp.gateOpen('belfry'), prog: window.__pp.riftState().prog.belfry, tide: window.__pp.st.accs.filter(a => a.sp === 'tide').length, end: document.getElementById('arcPanel') ? document.getElementById('arcPanel').textContent.slice(0, 160) : '' }));
    ok(seen.includes('THE TIDE SIGIL') && r.sealed && r.gate && r.tide === acc0 + 1, 'the sealing: the Tide Sigil, the Belfry sealed, the Cancer gate open, the Tidecaller\'s Drop given', r);
    await start('belfry', 5); await gt(3); await slay();
    await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 150000 }); await page.waitForTimeout(1200);
    r = await D(() => ({ sealed: !!window.__pp.riftState().seals.belfry, tide: window.__pp.st.accs.filter(a => a.sp === 'tide').length, end: (document.querySelector('.dun-end h2') || {}).textContent }));
    ok(r.sealed && r.tide === acc0 + 1 && /Sealed again/.test(r.end || ''), 'sealing again: "Sealed again", no second necklace', r);
  }
  if (ONLY.includes('mig')) {
    const r = await page.evaluate(() => { const P = window.__pp, base = P.serialize(), out = {};
      const mk = (prog, sealed, ver) => { const o = JSON.parse(JSON.stringify(base)); o.rift = { seals: sealed ? { belfry: 1 } : {}, prog: prog == null ? {} : { belfry: prog }, gates: sealed ? { belfry: 1 } : {}, rlyeh: 0 }; if (ver) o.rift.ver = { belfry: ver }; const s = P.sanitize(o); return { prog: s.rift.prog.belfry, sealed: !!s.rift.seals.belfry, gate: !!s.rift.gates.belfry, ver: s.rift.ver.belfry }; };
      for (const p of [0, 1, 3, 4, 5, 6, 8, 9, 10, 12, 13]) out['old' + p] = mk(p, false).prog;
      out.sealed = mk(7, true); out.newer = mk(3, false, 2); out.none = mk(null, false); out.again = (() => { const o = JSON.parse(JSON.stringify(base)); o.rift = { seals: {}, prog: { belfry: 9 }, gates: {}, rlyeh: 0 }; const s1 = P.sanitize(o), s2 = P.sanitize(JSON.parse(JSON.stringify(s1))); return [s1.rift.prog.belfry, s2.rift.prog.belfry]; })();
      return out; });
    console.log('  mig', JSON.stringify(r));
    ok(r.old0 === 0 && r.old1 === 1 && r.old4 === 1 && r.old5 === 2 && r.old8 === 2 && r.old9 === 3 && r.old10 === 4 && r.old12 === 4 && r.old13 === 5, 'old checkpoints map to the nearest safe new stage (unfinished opening: the hall)');
    ok(r.sealed.sealed && r.sealed.gate && r.sealed.prog === 0 && r.sealed.ver === 2, 'a sealed Belfry stays sealed, its gate open', r.sealed);
    ok(r.newer.prog === 3 && r.again[0] === 3 && r.again[1] === 3 && r.none.ver === 2, 'a new save is left as it is; mapping happens once', { newer: r.newer, again: r.again });
  }
  console.log('errors', errors.length, errors.slice(0, 5)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
