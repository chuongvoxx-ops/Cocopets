// v391 B1, v394 B1: the rebuilt Drowned Belfry: every stage loads with no page errors; the three dungeons (exactly 150 / 180 /
// 200 brood, one leader to every pack, the live cap, a guardian gating each exit, ramped traps, their valve halls); the
// Clapper Counterweights solve; the sealing records the Tide Sigil and its necklace once; old saves map onto the eight stages.
// usage: HTML=test-bel4.html node tests/_bel-b1-smoke.js   env: SHOTS=1, ONLY=load,dun,gate,valve,clap,hall,seal,mig  DUNS=1,2,3
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
const ONLY = (process.env.ONLY || 'load,dun,gate,valve,clap,hall,seal,mig').split(',');   // (v395 B1: gate, D1's flooded gate hall)
(async () => {
  const T = await open({ lvl: 14 }); const { page, errors, start, run, rs } = T;
  if (process.env.GPU === '1') await page.evaluate(() => { window.__NG_GL = 1; });   // (v395 B1: shots with the GPU painter on swiftshader)
  const info = await page.evaluate(() => { const R = window.__pp.RIFT_BY_ID.belfry; return { n: R.stages.length, kinds: R.stages.map(s => s.kind).join(','), names: R.stages.map(s => s.name).join(' | '), bosses: R.stages.map(s => s.boss || '').join(','), fiends: ['belkharrox', 'belnhalu', 'beluldroth'].map(id => !!window.__pp.FIEND_DEFS[id]) }; });
  console.log('stages', JSON.stringify(info));
  const K = info.kinds.split(',');
  ok(info.n === 8 && info.bosses === ',,belkharrox,,,belnhalu,,beluldroth' && K[0] === 'fight' && K[3] === 'fight' && K[6] === 'fight' && K[4] === 'puzzle' && /^The Drowned Lower Church \| The Hall of Three Tides \| The Baptism Chamber \| The Bell Foundry Undercroft \| The Clapper Counterweights/.test(info.names) && / \| The Storm Galleries \| /.test(info.names), 'eight stages (v394): D1, the hall, Kharrox, D2, clappers, Nhalu, D3, Uldroth', info);
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
  // v394 B1: the three dungeons (riftFight floors): exact brood, one leader per pack, the live cap, the guardian gating the exit,
  // the valve halls, the ramped traps (worker B2's BEL_TRAPS), each its own land
  const DUNS = [{ s: 0, key: 'd1', n: 150, guard: 'Gloomfin the Abyssal', short: 'Gloomfin', valves: 3, traps: 15, land: 'belnave', gate: true }, { s: 3, key: 'd2', n: 180, guard: 'Clangrot the Undertoll', short: 'Clangrot', valves: 3, traps: 22, land: 'belfoundry' }, { s: 6, key: 'd3', n: 200, guard: 'Squallmaw the Stormdrowned', short: 'Squallmaw', valves: 4, traps: 30, land: 'belstorm' }];
  const ramp = [];
  if (ONLY.includes('dun')) for (const W of DUNS.filter((W, i) => (process.env.DUNS || '1,2,3').split(',').includes(String(i + 1)))) {
    await start('belfry', W.s); await gt(1.2);
    const seen = await page.evaluate(async () => { const G = window.__pp.arc.game._dbg, out = new Set(), t0 = G.g.t, w0 = performance.now(); while (G.g.t - t0 < 1.6 && performance.now() - w0 < 60000) { await new Promise(q => requestAnimationFrame(q)); (G.banners || []).forEach(b => out.add(b.s + ' / ' + b.sub)); } return [...out]; });
    ok(!seen.some(b => /Clear every monster/.test(b)) && (W.gate || seen.some(b => b.includes(W.guard))), `${W.key}: the opening banner names its objective`, seen);
    let r = await page.evaluate(key => { const G = window.__pp.arc.game._dbg, DS = window.BEL.dungeonCtx({ g: G.g }), all = G.mons.concat(G.g.reserve || []).filter(m => !m.dead && !m.boss && !m.optional), mine = all.filter(m => m.belDun === key), packs = new Map();
      for (const m of mine) { if (m.belValve != null) continue; if (!packs.has(m.pack)) packs.set(m.pack, []); packs.get(m.pack).push(m); }
      const lead = [...packs.values()].map(l => l.filter(m => m.calLeader).length), mini = G.mons.find(m => m.belGuard && !m.dead), BT = window.BEL_TRAPS || (self.BEL_TRAPS);
      const avg = t => { const l = mine.filter(m => m.type === t && !m.calLeader); return l.length ? Math.round(l.reduce((a, m) => a + m.maxhp, 0) / l.length) : 0; };
      return { n: all.length, mine: mine.length, total: G.g.total, others: all.filter(m => !['crawler', 'leech', 'reeflantern'].includes(m.type)).map(m => m.type).join(','), packs: packs.size, leadersOk: lead.every(k => k === 1), lead1: lead.filter(k => k !== 1).length,
        live: G.mons.filter(m => !m.dead && !m.boss).length, reserve: (G.g.reserve || []).length, cap: G.F.liveCap, biome: G.F.biome, kind: G.F.rift.kind, goal: document.getElementById('arcGoal').textContent,
        mini: mini ? { name: mini.bname, r: mini.r, gl: !!(mini.petgl || mini.gl || mini.evilGL || mini.calMini), hp: mini.maxhp, key: mini.belGuard } : null, done: G.RIFT.done, exitR: G.RIFT.exit && G.RIFT.exit.r,
        valves: DS ? DS.valveHalls.length : -1, vObjs: G.RIFT.objs.filter(o => o.kind === 'valve').length, leeches: DS ? DS.valveHalls.filter(V => V.leech && !V.leech.dead).length : -1,
        traps: DS && DS.traps ? DS.traps.traps.length : (BT ? -1 : null), trapKinds: DS && DS.traps ? [...new Set(DS.traps.traps.map(t => t.kind))].join(',') : '', hpCrawler: avg('crawler'), dmgCrawler: (mine.find(m => m.type === 'crawler' && !m.calLeader) || {}).dmg, events: G.F.events, gremlin: !!(G.M.gremlin) }; }, W.key);
    console.log('  ' + W.key, JSON.stringify(r)); ramp.push(r);
    ok(r.kind === 'fight' && r.biome === W.land, `${W.key}: a rolled dungeon floor (kind fight) in its own land (${W.land})`, { kind: r.kind, biome: r.biome });
    ok(r.n === W.n && r.mine === W.n && r.total === W.n && !r.others, `${W.key}: exactly ${W.n} brood (only the brood), the count set`, { n: r.n, mine: r.mine, total: r.total, others: r.others });
    ok(r.leadersOk && r.packs >= Math.floor(W.n / 7), `${W.key}: one leader to every pack (${r.packs} packs)`, { packs: r.packs, bad: r.lead1 });
    ok(r.cap === 36 && r.live <= 37 + 4 && r.reserve > 0, `${W.key}: the live cap holds the far packs back`, { live: r.live, reserve: r.reserve, cap: r.cap });
    ok(r.mini && r.mini.name === W.guard && r.mini.r >= 1.1 && !r.done && r.exitR < 0, `${W.key}: ${W.guard} guards the sealed exit`, { mini: r.mini, exitR: r.exitR });
    ok(r.valves === W.valves && r.vObjs === W.valves && r.leeches === W.valves, `${W.key}: ${W.valves} valve halls, each valve held by a leech`, { valves: r.valves, objs: r.vObjs, leeches: r.leeches });
    ok(r.traps === null || r.traps === W.traps, `${W.key}: ${W.traps} traps placed`, { traps: r.traps, kinds: r.trapKinds });
    ok((W.gate ? /^Drain the gate hall: turn the 3 valves \(0\/3\) · 150 brood left/ : new RegExp(`^${W.n} of ${W.n} brood left · ${W.short} at the gate`)).test(r.goal) && r.events === false && !r.gremlin, `${W.key}: the goal counts the brood and names the guardian; no events or gremlin`, r.goal);
    if (process.env.SHOTS) await page.screenshot({ path: `shots/bel-v394-${W.key}-start.png` });
    if (W.gate) continue;   // (v395 B1: D1's door waits on its gate valves and guardian: the 'gate' section)
    // every one of the brood down: the gate stays sealed while the guardian stands
    await page.evaluate(async () => { const G = window.__pp.arc.game._dbg; for (let k = 0; k < 4; k++) { const res = G.g.reserve || []; G.mons.push(...res.splice(0)); for (const m of G.mons) if (!m.dead && !m.boss) { m.guardFn = null; G.hitMon(m, 1e9, { flat: true }); } await new Promise(r => setTimeout(r, 200)); } });
    await gt(1); r = await D(() => { const G = window.__pp.arc.game._dbg; return { left: G.mons.filter(m => !m.dead && !m.boss && !m.optional).length + (G.g.reserve || []).length, done: G.RIFT.done, goal: document.getElementById('arcGoal').textContent, exitR: G.RIFT.exit.r }; });
    ok(r.left === 0 && !r.done && new RegExp(`Defeat ${W.short}`).test(r.goal) && r.exitR < 0, `${W.key}: all ${W.n} down: the gate stays sealed while ${W.short} stands`, r);
    ok(await killGuard(), `${W.short} falls`); await gt(2.6); r = await D(() => { const G = window.__pp.arc.game._dbg; return { done: G.RIFT.done, exitR: G.RIFT.exit.r }; }); ok(r.done && r.exitR > 0, `${W.key}: the gate opens`, r);
    await exitNow(); r = await rs(); ok(r.prog.belfry === W.s + 1, `${W.key}: checkpoint: stage ${W.s + 2}`, r.prog);
  }
  if (ramp.length === 3) ok(ramp[0].hpCrawler < ramp[1].hpCrawler && ramp[1].hpCrawler < ramp[2].hpCrawler && ramp[0].mini.hp < ramp[1].mini.hp && ramp[1].mini.hp < ramp[2].mini.hp && ramp[0].traps <= ramp[1].traps && ramp[1].traps <= ramp[2].traps, 'the ramp: the brood, the guardians and the traps grow from dungeon to dungeon', ramp.map(r => ({ hp: r.hpCrawler, dmg: r.dmgCrawler, g: r.mini && r.mini.hp, traps: r.traps })));
  if (ONLY.includes('gate')) {   // v395 B1: D1's flooded gate hall: three gate valves (each held by a leech) drain it; the guardian then wakes; its fall opens the door
    await start('belfry', 0); await gt(1.2);
    const GHs = f => page.evaluate(f => { const G = window.__pp.arc.game._dbg, DS = window.BEL.dungeonCtx({ g: G.g }), GH = DS.gate; return new Function('G', 'DS', 'GH', f)(G, DS, GH); }, f);
    const edge = () => GHs(`const FL = G.M.G[Math.floor(G.me.y) * G.M.MW + Math.floor(G.me.x)]; let best = null, bd = 1e9; for (let y = Math.floor(GH.y0) - 3; y <= GH.y1 + 3; y++) for (let x = Math.floor(GH.x0) - 3; x <= GH.x1 + 3; x++) { const px = x + 0.5, py = y + 0.5; if (px > GH.x0 - 1 && px < GH.x1 + 1 && py > GH.y0 - 1 && py < GH.y1 + 1) continue; if (G.M.G[y * G.M.MW + x] !== FL) continue; const d = Math.hypot(px - GH.cx, py - GH.cy); if (d < bd) { bd = d; best = { x: px, y: py }; } } G.me.x = best.x; G.me.y = best.y; G.me.vx = G.me.vy = 0; GH.last = { x: best.x, y: best.y }; return best;`);
    let r = await GHs(`const rooms = new Set(DS.valveHalls.map(V => V.room)); return { gate: !!GH, level: GH.level, turned: GH.turned, need: GH.need, valves: DS.valveHalls.length, rooms: rooms.size, notGate: !rooms.has(GH.room), hold: !!(DS.mini && DS.mini.calMini && DS.mini.calMini.hold), surge: DS.valveHalls.some(V => !V.region.off), goal: document.getElementById('arcGoal').textContent, banner: (G.banners || []).map(b => b.s).join('|'), brood: G.mons.filter(m => !m.dead && !m.boss && m.x > GH.x0 && m.x < GH.x1 && m.y > GH.y0 && m.y < GH.y1).length };`);
    console.log('  gate', JSON.stringify(r));
    ok(r.gate && r.level > 0.95 && r.need === 3 && r.valves === 3 && r.rooms === 3 && r.notGate && r.hold && !r.surge && r.brood === 0, 'D1: the gate hall stands flooded, the guardian asleep under it; three gate valves in three other rooms; no surge halls; no brood in the gate hall', r);
    ok(/^Drain the gate hall: turn the 3 valves \(0\/3\) · 150 brood left/.test(r.goal), 'D1: the goal is the valves (0/3), the brood shown as info', r.goal);
    { const seen = await page.evaluate(async () => { const G = window.__pp.arc.game._dbg, out = new Set(), t0 = G.g.t, w0 = performance.now(); while (G.g.t - t0 < 2.5 && performance.now() - w0 < 60000) { await new Promise(q => requestAnimationFrame(q)); (G.banners || []).forEach(b => out.add(b.s + ' / ' + b.sub)); } return [...out]; });
      ok(seen.some(b => /Drain the gate hall: turn 3 valves/.test(b)) && !seen.some(b => /Clear every monster/.test(b)), 'the opening banner: drain the gate hall', seen); }
    // the deep water cannot be crossed, nor the guardian harmed through it
    await edge(); await gt(0.3); if (process.env.SHOTS) { await gt(1.5); await page.screenshot({ path: 'shots/bel-v395-d1-gate-flooded.png' }); }
    r = await GHs(`G.me.x = GH.cx; G.me.y = GH.cy; return 0;`); await gt(0.4);
    r = await GHs(`return { x: G.me.x, y: G.me.y, inside: G.me.x > GH.x0 && G.me.x < GH.x1 && G.me.y > GH.y0 && G.me.y < GH.y1 };`); ok(!r.inside, 'the deep water turns the pet back (it cannot wade into the gate hall)', r);
    ok(!(await killGuard()), 'the guardian cannot be harmed under the water');
    const exitR0 = await D(() => window.__pp.arc.game._dbg.RIFT.exit.r); ok(exitR0 < 0, 'the door is shut', exitR0);
    // each valve needs its leech dead; each turn lowers the water a step
    const lv = [];
    for (let i = 0; i < 3; i++) {
      await use('valve', i); r = await GHs(`return { turned: GH.turned, on: DS.valveHalls[${i}].valve.on, leech: !!(DS.valveHalls[${i}].leech && !DS.valveHalls[${i}].leech.dead) };`);
      ok(r.leech && !r.on && r.turned === i, `valve ${i + 1}: the leech holds it, it will not turn`, r);
      await GHs(`G.hitMon(DS.valveHalls[${i}].leech, 1e9, { flat: true }); return 0;`); await gt(0.3);
      if (i === 0 && process.env.SHOTS) { await near('valve', 0); await page.evaluate(() => { for (const m of window.__pp.arc.game._dbg.mons) if (!m.belGuard) m.aggro = false; }); await gt(0.5); await page.screenshot({ path: 'shots/bel-v395-d1-valve-turn.png' }); await gt(0.6); await page.evaluate(() => { window.__pp.arc.game._dbg.me.x += 3; }); await gt(0.1); }
      else await use('valve', i);
      await gt(1.6); r = await GHs(`return { turned: GH.turned, level: +GH.level.toFixed(2), open: GH.open, goal: document.getElementById('arcGoal').textContent };`); lv.push(r.level);
      ok(r.turned === i + 1 && (i === 2 || (r.level < 1 - (i + 1) / 3 + 0.15 && !r.open)) && (i === 2 || new RegExp(`\\(${i + 1}/3\\)`).test(r.goal)), `valve ${i + 1}: the leech dead, the valve turns and the water drops a step (${i + 1}/3)`, r);
    }
    await gt(3); r = await GHs(`const m = DS.mini; return { open: GH.open, level: GH.level, hold: !!(m.calMini && m.calMini.hold), dead: m.dead, left: G.mons.filter(q => !q.dead && !q.boss && !q.optional).length + (G.g.reserve || []).length, goal: document.getElementById('arcGoal').textContent, done: G.RIFT.done };`);
    ok(r.open && r.level < 0.05 && !r.hold && !r.dead && !r.done && /^Defeat Gloomfin/.test(r.goal), 'at 3/3 the gate hall drains and Gloomfin is freed', r);
    await GHs(`const m = DS.mini; G.me.x = m.x; G.me.y = m.y + 4; G.me.vx = G.me.vy = 0; return 0;`); await gt(2.5);
    r = await GHs(`const m = DS.mini; return { aggro: !!m.aggro, inside: G.me.x > GH.x0 && G.me.x < GH.x1 && G.me.y > GH.y0 && G.me.y < GH.y1 };`); ok(r.aggro && r.inside, 'the pet walks into the drained hall and Gloomfin wakes and fights', r);
    if (process.env.SHOTS) await page.screenshot({ path: 'shots/bel-v395-d1-gate-drained.png' });
    ok(await killGuard(), 'Gloomfin falls'); await gt(2.6);
    r = await D(() => { const G = window.__pp.arc.game._dbg; return { done: G.RIFT.done, exitR: G.RIFT.exit.r, left: G.mons.filter(q => !q.dead && !q.boss && !q.optional).length + (G.g.reserve || []).length, goal: document.getElementById('arcGoal').textContent }; });
    ok(!r.done && r.left > 100 && /^Clear the brood/.test(r.goal), 'v396: with Gloomfin down but brood alive, the door stays shut', r);
    await D(() => { const G = window.__pp.arc.game._dbg; for (const q of G.mons) if (!q.dead && !q.boss && !q.optional) { q.hp = 0; q.dead = true; } if (G.g.reserve) G.g.reserve.length = 0; }); await gt(2.6);
    r = await D(() => { const G = window.__pp.arc.game._dbg; return { done: G.RIFT.done, exitR: G.RIFT.exit.r, left: G.mons.filter(q => !q.dead && !q.boss && !q.optional).length + (G.g.reserve || []).length, goal: document.getElementById('arcGoal').textContent }; });
    ok(r.done && r.exitR > 0 && r.left === 0, 'v396: the brood cleared too, the door opens', r);
    if (process.env.SHOTS) { await page.evaluate(() => { const G = window.__pp.arc.game._dbg, e = G.RIFT.exit; G.me.x = e.x; G.me.y = e.y + 2.6; }); await gt(1.2); await page.screenshot({ path: 'shots/bel-v395-d1-door-open.png' }); }
    await exitNow(); r = await rs(); ok(r.prog.belfry === 1, 'D1 cleared: checkpoint: the Hall of Three Tides', r.prog);
  }
  if (ONLY.includes('valve')) {   // v394 B1 (v395 B1: in D2; D1's valves are the gate's): a valve hall surges (the water rises, then a crest carries the pet back), its leech holds the valve, turning it drains the hall for good
    await start('belfry', 3); await gt(1);
    const VH = (i, f) => page.evaluate(([i, f]) => { const G = window.__pp.arc.game._dbg, DS = window.BEL.dungeonCtx({ g: G.g }), V = DS.valveHalls[i]; return new Function('G', 'DS', 'V', f)(G, DS, V); }, [i, f]);
    let r = await VH(0, `const r = V.room; return { tiles: V.tiles.length, w: r.w, h: r.h, locked: V.valve.locked, leech: !!(V.leech && !V.leech.dead), level: V.level, period: DS.D.period, inShallow: window.BEL.inShallow({ g: G.g }, V.cx, V.cy) };`);
    ok(r.tiles >= 12 && r.locked && r.leech, 'a valve hall: flooded floor, its refuge valve held by a leech', r);
    // the rise: the water climbs (no red, no countdown: the shallows deepen, turquoise lines on the walls)
    await VH(0, `const P = DS.D.period; V.t = P - 4.6; G.me.x = V.cx; G.me.y = V.cy; G.me.vx = G.me.vy = 0; for (const m of G.mons) if (!m.boss && !m.dead && m.belValve == null && Math.hypot(m.x - V.cx, m.y - V.cy) < 9) { m.guardFn = null; G.hitMon(m, 1e9, { flat: true }); }`);
    await gt(1.6); r = await VH(0, 'return { phase: V.phase, level: V.level };'); ok(r.phase === 'rise' && r.level > 0.2, 'the sea rises in the hall', r);
    if (process.env.SHOTS) await page.screenshot({ path: 'shots/bel-v394-d2-valve-rise.png' });
    // the crest: the pet standing in the hall is carried back toward its mouth
    r = await page.evaluate(async () => { const G = window.__pp.arc.game._dbg, V = window.BEL.dungeonCtx({ g: G.g }).valveHalls[0], P = window.BEL.dungeonCtx({ g: G.g }).D.period; V.t = P - 1.8; G.me.x = V.cx; G.me.y = V.cy; G.me.vx = G.me.vy = 0; G.me.dodge = 0; const t0 = G.g.t, w0 = performance.now(), s0 = V.sweeps; let seenCrest = false;
      while (G.g.t - t0 < 2.5 && performance.now() - w0 < 60000 && V.sweeps === s0) { await new Promise(q => requestAnimationFrame(q)); if (V.phase === 'crest') seenCrest = true; G.me.x = V.cx; G.me.y = V.cy; } return { sweeps: V.sweeps - s0, crest: seenCrest }; });
    ok(r.sweeps === 1 && r.crest, 'the crest sweeps the pet back', r);
    // the valve: the leech holds it; pull it off and turn the valve: the hall drains, the brood in it is beached, no more surges
    await use('valve', 0); r = await VH(0, 'return { drained: V.drained };'); ok(!r.drained, 'the leech on the valve stops the turn');
    await VH(0, 'G.hitMon(V.leech, 1e9, { flat: true }); const m = G.spawnMon ? null : null; window.__vm = (G.mons.find(q => !q.dead && !q.boss && q.x > V.room.x && q.x < V.room.x + V.room.w && q.y > V.room.y && q.y < V.room.y + V.room.h) || null); return 0;'); await gt(0.4);
    await use('valve', 0); await gt(0.2); r = await VH(0, 'return { drained: V.drained, on: V.valve.on, phase: V.phase, n: DS.drained, beached: G.mons.filter(m => m.belBeached).length };');
    ok(r.drained && r.on && r.n === 1, 'turning the valve drains the hall', r);
    if (process.env.SHOTS) await page.screenshot({ path: 'shots/bel-v394-d2-valve-drain.png' });
    r = await page.evaluate(async () => { const G = window.__pp.arc.game._dbg, V = window.BEL.dungeonCtx({ g: G.g }).valveHalls[0], P = window.BEL.dungeonCtx({ g: G.g }).D.period; const t0 = G.g.t; while (G.g.t - t0 < 2.6) await new Promise(q => requestAnimationFrame(q)); V.t = P - 1.8; const s0 = V.sweeps; G.me.x = V.cx; G.me.y = V.cy; const t1 = G.g.t; while (G.g.t - t1 < 2) { await new Promise(q => requestAnimationFrame(q)); G.me.x = V.cx; G.me.y = V.cy; } return { sweeps: V.sweeps - s0, off: !!V.region.off, level: V.level }; });
    ok(r.sweeps === 0 && r.off && r.level < 0.05, 'a drained hall: dry, and no more surges', r);
  }
  if (ONLY.includes('clap')) {
    await start('belfry', 4); let r = await D(() => { const G = window.__pp.arc.game._dbg, mod = G.RIFT.self.mod; return { claps: G.RIFT.objs.filter(o => o.kind === 'clapper').map(o => o.n).join(), pans: G.RIFT.objs.filter(o => o.kind === 'pan').length, leeches: G.mons.filter(m => m.type === 'leech' && m.belHold).length, pack: G.mons.filter(m => !m.dead && !m.boss && m.type !== 'leech').map(m => m.type).sort().join(), guard: !!G.mons.find(m => m.belGuard === 'cistern'), biome: G.F.biome }; });
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
    await exitNow(); r = await rs(); ok(r.prog.belfry === 5, 'checkpoint: Nhalu (stage 6)', r.prog);
  }
  if (ONLY.includes('hall')) {
    await start('belfry', 1); const ph = await D(() => window.__pp.RIFT_BY_ID.belfry.stages[1].placeholder);
    if (ph) { let r; await killBrood(); await gt(2.6); r = await D(() => { const G = window.__pp.arc.game._dbg; return { done: G.RIFT.done, guard: !!G.mons.find(m => m.belGuard === 'hall' && !m.dead), r: G.RIFT.exit && G.RIFT.exit.r }; }); ok(r.done && r.guard && r.r < 0, 'the stand-in hall: the central door rises and its guardian comes out to hold it', r);
      ok(await killGuard(), 'the hall guardian falls'); await gt(2.6); r = await D(() => window.__pp.arc.game._dbg.RIFT.exit.r); ok(r > 0, 'the raised door opens', r); await exitNow(); r = await rs(); ok(r.prog.belfry === 2, 'checkpoint: Kharrox', r.prog); }
    else { // worker B2's hall: raise its door (its own tests cover the trials), then the section's guardian must come out to hold it
      const st0 = await D(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; try { mod.doorStart(); return 'ok'; } catch (e) { return String(e && e.message); } });
      await gt(10); let r = await D(() => { const G = window.__pp.arc.game._dbg; return { done: G.RIFT.done, guard: !!G.mons.find(m => m.belGuard === 'hall' && !m.dead), r: G.RIFT.exit && G.RIFT.exit.r }; });
      ok(st0 === 'ok' && r.done && r.guard && r.r < 0, 'the hall: the central door rises and Brinefang comes out to hold it', { st0, r });
      if (process.env.SHOTS) await page.screenshot({ path: 'shots/bel-b1-hall-guard.png' });
      ok(await killGuard(), 'the hall guardian falls'); await gt(2.6); r = await D(() => window.__pp.arc.game._dbg.RIFT.exit.r); ok(r > 0, 'the risen door opens', r); }
  }
  if (ONLY.includes('seal')) {
    const acc0 = await D(() => window.__pp.st.accs.filter(a => a.sp === 'tide').length);
    await start('belfry', 7); await gt(4); const fiend = await D(() => !!window.__pp.arc.game._dbg.F.fiend);
    const slay = () => page.evaluate(async () => { const G = window.__pp.arc.game._dbg, w0 = performance.now(); while (performance.now() - w0 < 90000) { const b = G.mons.find(m => m.boss && !m.dead && !m.belGuard); if (!b) break; b.aggro = true; b.under = false; b.locked = false; b.guardA = null; G.me.hp = G.ST.hp; G.hitMon(b, 1e13, { flat: true, pierce: true }); for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r)); } });
    await slay();
    const seen = await page.evaluate(async () => { const G = window.__pp.arc.game._dbg, s = new Set(), t0 = performance.now(); while (performance.now() - t0 < 150000) { await new Promise(r => requestAnimationFrame(r)); G.banners.forEach(b => s.add(b.s)); if (window.__pp.arc.state !== 'play') break; } return [...s]; });
    console.log('  seal', fiend ? '(3D Uldroth)' : '(stand-in)', JSON.stringify(seen)); await page.waitForTimeout(1500);
    let r = await D(() => ({ sealed: !!window.__pp.riftState().seals.belfry, gate: window.__pp.gateOpen('belfry'), prog: window.__pp.riftState().prog.belfry, tide: window.__pp.st.accs.filter(a => a.sp === 'tide').length, end: document.getElementById('arcPanel') ? document.getElementById('arcPanel').textContent.slice(0, 160) : '' }));
    ok(seen.includes('THE TIDE SIGIL') && r.sealed && r.gate && r.tide === acc0 + 1, 'the sealing: the Tide Sigil, the Belfry sealed, the Cancer gate open, the Tidecaller\'s Drop given', r);
    await start('belfry', 7); await gt(3); await slay();
    await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 150000 }); await page.waitForTimeout(1200);
    r = await D(() => ({ sealed: !!window.__pp.riftState().seals.belfry, tide: window.__pp.st.accs.filter(a => a.sp === 'tide').length, end: (document.querySelector('.dun-end h2') || {}).textContent }));
    ok(r.sealed && r.tide === acc0 + 1 && /Sealed again/.test(r.end || ''), 'sealing again: "Sealed again", no second necklace', r);
  }
  if (ONLY.includes('mig')) {   // v394 B1: from the v392 seven-stage layout (ver 3), the v390 six (ver 2) and the old fourteen (no ver) to the eight (ver 4)
    const r = await page.evaluate(() => { const P = window.__pp, base = P.serialize(), out = {};
      const mk = (prog, sealed, ver, hall, bel) => { const o = JSON.parse(JSON.stringify(base)); o.rift = { seals: sealed ? { belfry: 1 } : {}, prog: prog == null ? {} : { belfry: prog }, gates: sealed ? { belfry: 1 } : {}, rlyeh: 0 }; if (ver) o.rift.ver = { belfry: ver }; if (hall) o.rift.hall = { belfry: hall }; if (bel) o.rift.bel = bel; const s = P.sanitize(o); return { prog: s.rift.prog.belfry, sealed: !!s.rift.seals.belfry, gate: !!s.rift.gates.belfry, ver: s.rift.ver.belfry, bel: s.rift.bel }; };
      out.v3 = [0, 1, 2, 3, 4, 5, 6].map(p => mk(p, false, 3).prog);
      out.v2 = [0, 1, 2, 3, 4, 5].map(p => mk(p, false, 2).prog);
      out.v2hall = mk(0, false, 2, { dep: 'E', earn: 'E' }).prog; out.v2hallNoProg = mk(null, false, 2, { dep: 'EW' }).prog;
      out.old = [0, 1, 4, 5, 8, 9, 10, 13].map(p => mk(p, false).prog);
      out.sealed3 = mk(5, true, 3); out.sealed2 = mk(3, true, 2); out.sealedOld = mk(7, true); out.v4 = mk(2, false, 4); out.none = mk(null, false); out.fresh = P.st.rift.ver.belfry;
      out.cp = mk(5, false, 3, null, { tide1: 2, hall2: 1 }).bel;
      out.again = (() => { const o = JSON.parse(JSON.stringify(base)); o.rift = { seals: {}, prog: { belfry: 3 }, gates: {}, rlyeh: 0, ver: { belfry: 2 } }; const s1 = P.sanitize(o), s2 = P.sanitize(JSON.parse(JSON.stringify(s1))); return [s1.rift.prog.belfry, s2.rift.prog.belfry]; })();
      return out; });
    console.log('  mig', JSON.stringify(r));
    ok(r.v3.join() === '0,1,2,3,5,6,7', 'a v392 checkpoint: church D1, hall, Kharrox, clappers to D2, Nhalu, tide to D3, Uldroth', r.v3);
    ok(r.v2.join() === '0,2,3,5,6,7', 'a v390 checkpoint maps through the seven to the eight', r.v2);
    ok(r.v2hall === 1 && r.v2hallNoProg === 1, 'a v390 save in the middle of the hall (crystals won) keeps its place in the hall', { a: r.v2hall, b: r.v2hallNoProg });
    ok(r.old.join() === '0,2,2,3,3,5,6,7', 'the old fourteen-stage checkpoints map to the nearest safe stage of the eight', r.old);
    ok(r.sealed3.sealed && r.sealed3.gate && r.sealed3.prog === 0 && r.sealed3.ver === 4 && r.sealed2.sealed && r.sealed2.gate && r.sealedOld.sealed && r.sealedOld.gate, 'a sealed Belfry stays sealed, its gate open', { a: r.sealed3, b: r.sealed2, c: r.sealedOld });
    ok(r.v4.prog === 2 && r.again[0] === 5 && r.again[1] === 5 && r.none.ver === 4 && r.fresh === 4 && !('tide1' in r.cp) && r.cp.hall2 === 1, 'a v394 save is left as it is; the move happens once; a new game starts at version 4; the tide walk\'s checkpoints go', { v4: r.v4, again: r.again, fresh: r.fresh, cp: r.cp });
  }
  console.log('errors', errors.length, errors.slice(0, 5)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
