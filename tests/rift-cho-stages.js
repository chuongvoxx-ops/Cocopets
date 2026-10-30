// The Choir Before Creation's three challenges: the Silent Score (1), the Breathworks (4), the Held Note (7)
// HTML=test-chos.html node tests/rift-cho-stages.js   (SHOTS=1 for pictures). Game-time waits: the headless page runs at ~5 fps.
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s + (x === undefined ? '' : ' ' + JSON.stringify(x))); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 98, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon', 'basilica', 'colours'] }); const { page, errors, start, exitStage, goal } = T;
  const shot = async n => { await page.evaluate(() => { const p = document.getElementById('arcPanel'); if (p && window.__pp.arc.state === 'play') p.style.display = 'none'; }); await T.shot(n); await page.evaluate(() => { const p = document.getElementById('arcPanel'); if (p) p.style.display = ''; }); };
  const M = (f, a) => page.evaluate(f, a);
  let r;
  // __w(secs, each, until): wait that many seconds of GAME time (health kept full), calling each() per frame, stopping early on until()
  const setupW = () => M(() => { window.__w = async (secs, each, until) => { const D = window.__pp.arc.game._dbg, g0 = D.g.t; let f = 0; while (D.g.t - g0 < secs && !(until && until())) { await new Promise(r => requestAnimationFrame(r)); f++; if (D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } if (each) each(); } return f; };
    // stand beside an object (by kind and index) until it is used
    window.__use = async (kind, i) => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.filter(q => q.kind === kind)[i || 0]; o.used = false; o.ch = 0; let used = false; const u0 = o.use; o.use = q => { used = true; u0(q); };
      await window.__w(3, () => { D.me.x = o.x + 0.15; D.me.y = o.y + o.r + 0.3; D.me.vx = D.me.vy = 0; }, () => used); o.use = u0; await window.__w(0.2, () => { D.me.x = o.x + 0.2; D.me.y = o.y + o.r + 2.6; }); return used; };
    window.__kill = list => { const D = window.__pp.arc.game._dbg; for (const m of list) if (!m.dead) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } }; });
  const runG = secs => M(s => window.__w(s), secs);

  /* ======================= THE SILENT SCORE ======================= */
  await start('choir', 1); await setupW(); await runG(2);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, mw = D.M.MW; const P = mod.pads; let minGap = 1e9, maxRun = 0; for (const a of P) for (const b of P) if (a !== b) { const gap = Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r; minGap = Math.min(minGap, gap); maxRun = Math.max(maxRun, gap / 4.3); }
    const W = mod.SC_REST + mod.SC_BRIGHT; return { window: W, pads: P.length, syms: new Set(P.map(p => p.sym)).size, r: P[0].r, tab: Math.hypot(P[0].x - mod.tab.x, P[0].y - mod.tab.y), minGap: +minGap.toFixed(2), maxRun: +maxRun.toFixed(2), orders: mod.S.orders, gate: D.M.marks.d.every(p => D.M.G[p.ty * mw + p.tx] === 0), exit: !!D.RIFT.exit, mons: D.mons.filter(m => !m.dead).map(m => m.type + ':' + m.rmark).sort().join(','), lit: P.filter(p => p.hi).length, tgt: P.indexOf(mod.target()) }; });
  ok(r.pads === 4 && r.syms === 4 && r.r >= 1.3 && Math.abs(r.tab - 5) < 0.6 && r.gate && !r.exit, 'the Silent Score: four broad pads (distinct symbols) round the suspended tablet, the horn gate shut', r);
  ok(r.minGap > 1.5 && r.maxRun < 2 && r.maxRun * 2 < r.window, 'the pads are apart, but the longest run between two (at running speed) is under the two-second shine and half the rest-and-shine window', { minGap: r.minGap, maxRun: r.maxRun, window: r.window });
  ok(r.mons === 'bellmite:b,bellmite:b,bellmite:b', 'three bell mites guard the tablet', r.mons);
  ok(r.orders[0].length === 3 && new Set(r.orders[0]).size === 3 && r.orders[0].join() !== r.orders[1].join() && r.lit === 1 && r.tgt === r.orders[0][0], 'the tablet shows a three-symbol order; only the current note\'s pad is lit', r);
  ok(/note 1\/3: step on the lit pad/.test(await goal()), 'the goal says to step on the lit pad', await goal());
  // keep the mites quiet while the notes are checked (they are killed later)
  await M(() => { const D = window.__pp.arc.game._dbg; for (const m of D.RIFT.self.mod.guards1) { m.aggro = false; m.x = D.RIFT.self.mod.tab.x + (Math.random() - 0.5); m.y = D.RIFT.self.mod.tab.y - 7.5; } });
  // step on a pad (a few frames on it), then back to the tablet in the middle
  const stepOn = (i, secs) => M(async ([i, secs]) => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, p = mod.pads[i]; await window.__w(secs || 0.5, () => { D.me.x = p.x; D.me.y = p.y; D.me.vx = D.me.vy = 0; }); await window.__w(0.35, () => { D.me.x = mod.tab.x; D.me.y = mod.tab.y; }); return { step: mod.S.step, ph: mod.S.ph, played: mod.S.played.slice(), resets: mod.S.resets.slice(), hits: mod.S.hits }; }, [i, secs]);
  const order = r.orders;
  r = await stepOn(order[0][0]); ok(r.step === 1 && r.hits === 1, 'phrase 1: the first note is played on its pad', r);
  await shot('cho-score-p1');
  const wrongI = [0, 1, 2, 3].find(i => i !== order[0][0] && i !== order[0][1]);
  r = await stepOn(wrongI); ok(r.step === 0 && r.resets[0] === 1 && !r.played[0], 'a wrong note resets the phrase to its first note', r);
  r = await stepOn(order[0][0]); r = await stepOn(order[0][0]); ok(r.step === 1 && r.resets[0] === 1, 'stepping back on the pad just played is no note at all (no reset)', r);
  r = await stepOn(order[0][1]); r = await stepOn(order[0][2]); ok(r.played[0] && r.ph === 0, 'phrase 1 played in order', r);
  ok(/defeat the 3 bell mites/.test(await goal()), 'the tablet waits for its mites', await goal());
  await runG(0.6); await shot('cho-score-guarded');
  await M(() => window.__kill(window.__pp.arc.game._dbg.RIFT.self.mod.guards1)); await runG(1.2);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; for (const m of mod.guards2) if (m.type === 'hushmoth') m.cd = 1e6; return { ph: mod.S.ph, playing: mod.S.playing, g2: mod.guards2.map(m => m.type).sort().join(','), played: mod.S.played.slice(), tgt: mod.pads.indexOf(mod.target()), mode: mod.S.mode }; });
  ok(r.ph === 1 && r.playing && r.g2 === 'hushmoth,pipeeel,pipeeel' && r.played[0] && r.tgt === order[1][0], 'mites down: the tablet turns to phrase 2, guarded by two eels and a hush moth', r);
  // the eels go (their volleys would only add noise); the moth stays for its own test
  await M(() => window.__kill(window.__pp.arc.game._dbg.RIFT.self.mod.guards2.filter(m => m.type === 'pipeeel')));
  // the shine: rest, then a two-second countdown border; a missed shine rests and shines again
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, t = mod.target(), off = { x: mod.tab.x, y: mod.tab.y }; const seq = []; await window.__w(4, () => { D.me.x = off.x; D.me.y = off.y; }, () => S.mode === 'rest'); let lastMode = S.mode, brightAt = -1, restAgainAt = -1, maxCount = 0; const g0 = D.g.t;
    await window.__w(7, () => { D.me.x = off.x; D.me.y = off.y; if (S.mode !== lastMode) { seq.push([S.mode, +(D.g.t - g0).toFixed(2)]); lastMode = S.mode; } if (t.count) maxCount = Math.max(maxCount, t.count.max); if (S.mode === 'bright' && brightAt < 0) brightAt = D.g.t - g0; if (brightAt >= 0 && S.mode === 'rest' && restAgainAt < 0) restAgainAt = D.g.t - g0; }, () => restAgainAt >= 0);
    return { seq, brightFor: +(restAgainAt - brightAt).toFixed(2), maxCount, misses: S.misses, step: S.step }; });
  ok(r.maxCount === 2 && r.brightFor > 1.6 && r.brightFor < 2.8 && r.misses >= 1 && r.step === 0, 'phrase 2: the note rests, then shines for two seconds with a countdown border; a missed shine just rests again (no reset)', r);
  // stepping on it while it rests is no note; standing there, it plays the moment it shines
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, t = mod.target(); await window.__w(4, () => { D.me.x = mod.tab.x; D.me.y = mod.tab.y; }, () => S.mode === 'rest' && S.restT > 0.9); const rest0 = S.mode; let onDuringRest = -1, hitAt = -1, wasBright = false;
    await window.__w(5, () => { D.me.x = t.x; D.me.y = t.y; D.me.vx = D.me.vy = 0; if (S.mode === 'rest' && t.on && mod.target() === t) onDuringRest = Math.max(onDuringRest, S.step); if (S.mode === 'bright') wasBright = true; }, () => { if (S.step >= 1) { hitAt = 1; return true; } return false; });
    await window.__w(0.3, () => { D.me.x = mod.tab.x; D.me.y = mod.tab.y; }); return { rest0, onDuringRest, step: S.step, resets: S.resets.slice(), hitAt }; });
  ok(r.rest0 === 'rest' && r.onDuringRest === 0 && r.step === 1 && r.resets[1] === 0, 'standing on the note while it rests plays nothing; when it shines it plays (no reset)', r);
  await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; await window.__w(3, null, () => S.mode === 'bright'); }); await shot('cho-score-p2-shine');
  // a wrong note in phrase 2 resets only phrase 2
  const wrong2 = [0, 1, 2, 3].find(i => i !== order[1][0] && i !== order[1][1]);
  r = await stepOn(wrong2, 0.4); ok(r.step === 0 && r.resets[1] === 1 && r.played[0], 'a wrong note in phrase 2 resets phrase 2 only (phrase 1 stays played)', r);
  // the hush moth: it settles on the lit pad and silences it (no note while it holds), until a hit frees it
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, CHO = D.RIFT.self.amb.CHO, t = mod.target(), m = mod.guards2.find(q => q.type === 'hushmoth'); m.cd = 0; m.x = t.x + 2.5; m.y = t.y - 1; let silAt = -1;
    await window.__w(10, () => { D.me.x = mod.tab.x; D.me.y = mod.tab.y; }, () => { if (CHO.silenced(t)) { silAt = 1; return true; } return false; });
    const g1 = document.getElementById('arcGoal').textContent, hint = D.RIFT.hintObj(); const step0 = S.step; let brightWhile = false;
    await window.__w(4, () => { D.me.x = t.x; D.me.y = t.y; if (S.mode === 'bright') brightWhile = true; });
    const step1 = S.step, still = CHO.silenced(t);
    return { silAt, g1, hintMoth: !!hint && hint.label === 'HIT THE MOTH', step0, step1, still, silences: m.silences || 0 }; });
  ok(r.silAt > 0 && r.silences >= 1 && /hush moth silences a pad: hit the moth/.test(r.g1) && r.hintMoth, 'the hush moth settles on the lit pad and silences it; the goal and the pointer name the moth', r);
  ok(r.step1 === r.step0 && r.still, 'while the pad is hushed, standing on it plays nothing', r);
  await shot('cho-score-hushed');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, CHO = D.RIFT.self.amb.CHO, t = mod.target(), m = mod.guards2.find(q => q.type === 'hushmoth'); D.hitMon(m, 5, { flat: true }); let freed = false;
    await window.__w(2, () => { D.me.x = mod.tab.x + 2; D.me.y = mod.tab.y; }, () => { freed = !CHO.silenced(t); return freed; });
    const ints = m.interrupts || 0; window.__kill([m]); return { freed, ints }; });
  ok(r.freed && r.ints === 1, 'a hit interrupts the moth: the pad is free', r);
  // play phrase 2 through: stand on each note until it shines
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; for (let k = 0; k < 3 && !S.played[1]; k++) { const want = S.step + 1, t = mod.target(); await window.__w(6, () => { D.me.x = t.x; D.me.y = t.y; D.me.vx = D.me.vy = 0; }, () => S.step >= want || S.played[1]); await window.__w(0.3, () => { D.me.x = mod.tab.x; D.me.y = mod.tab.y; }); }
    await window.__w(1.5); const mw = D.M.MW; return { played: S.played.slice(), done: D.RIFT.done, exit: !!D.RIFT.exit, gate: D.M.marks.d.every(p => D.M.G[p.ty * mw + p.tx] === 1), goal: document.getElementById('arcGoal').textContent }; });
  ok(r.played[1] && r.done && r.exit && r.gate, 'both phrases played and the guards down: the horn gate opens to Tammor', r);
  await runG(1); await shot('cho-score-done'); await exitStage();

  /* ======================= THE BREATHWORKS ======================= */
  await start('choir', 4); await setupW(); await runG(3);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; return { horns: mod.horns.map(h => h.sym), shutters: mod.shutters.length, drain: S.drainOpen, shut: S.shut.slice(), blocked: S.blocked, nested: S.nested, moth: mod.moth.type, packets: S.packets.length, ends: [...new Set(S.packets.map(q => q.end))], fill: mod.horns.map(h => h.fill), vents: S.vents, mons: mod.gallery.map(m => m.type).sort().join(','), exit: !!D.RIFT.exit }; });
  ok(r.horns.length === 3 && new Set(r.horns).size === 3 && r.shutters === 2 && r.drain && !r.shut[0] && !r.shut[1] && r.blocked && r.nested && r.moth === 'hushmoth' && !r.exit, 'the Breathworks: three horns (distinct symbols), two shutters to the drains, the waste drain open, a hush moth nested in the blocked centre', r);
  ok(r.packets > 0 && r.ends.join() === 'drain' && r.vents > 0 && r.fill.every(f => f === 0), 'light packets show the air running into the open waste drain; no horn fills', r);
  ok(r.mons === 'bellmite,bellmite,bellmite,pipeeel,pipeeel', 'two pipe eels and three bell mites hold the gallery', r.mons);
  ok(/close it/.test(await goal()), 'the goal says to close the waste drain', await goal());
  await shot('cho-bw-start');
  await M(() => window.__kill(window.__pp.arc.game._dbg.RIFT.self.mod.gallery));
  r = await M(async () => { const used = await window.__use('drainlever'); const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, v0 = S.vents; await window.__w(2.5); return { used, drain: S.drainOpen, routes: mod.routes().map(q => q.end).join(), fill: mod.horns.map(h => +h.fill.toFixed(2)), vented: S.vents - v0, ends: [...new Set(S.packets.map(q => q.end))].sort().join() }; });
  ok(r.used && !r.drain && r.routes === 'vent,stuck,vent' && r.fill.every(f => f === 0) && r.vented > 0, 'the drain shut: the air runs up the conduits but the wrong shutters vent it and the blockage stops it (harmless)', r);
  r = await M(async () => { const used = await window.__use('shutter', 0); const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; await window.__w(2.5); const f1 = mod.horns[0].fill;
    // change it back freely: the air vents again, the stored pressure stays
    await window.__use('shutter', 0); const back = S.shut[0]; const f2 = mod.horns[0].fill; await window.__w(2); const f3 = mod.horns[0].fill;
    await window.__use('shutter', 0); return { used, f1: +f1.toFixed(2), back, f2: +f2.toFixed(2), f3: +f3.toFixed(2), shut: S.shut.slice(), recv: mod.horns.map(h => h.recv) }; });
  ok(r.used && r.f1 > 0.1 && !r.back && Math.abs(r.f3 - r.f2) < 0.01 && r.f3 > 0.1 && r.shut[0], 'the west shutter slid to its horn fills its gauge; slid back it vents and the stored pressure stays', r);
  await runG(0.5); await shot('cho-bw-west');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; const tried = await window.__use('blockage'); const stillBlocked = S.blocked;
    D.hitMon(mod.moth, 5, { flat: true }); await window.__w(0.5); const nested = S.nested; const used = await window.__use('blockage'); await window.__w(2); return { stillBlocked, nested, used, blocked: S.blocked, cleared: S.cleared, recvC: mod.horns[1].recv, fillC: +mod.horns[1].fill.toFixed(2), mothAggro: mod.moth.aggro }; });
  ok(r.stillBlocked && !r.nested && r.used && !r.blocked && r.cleared && r.recvC && r.fillC > 0.05, 'the blockage stays while the moth nests; a hit drives the moth out, and the cleared centre conduit carries air to its horn', r);
  await M(() => window.__kill([window.__pp.arc.game._dbg.RIFT.self.mod.moth]));
  // the east shutter: now every horn breathes; at two-thirds pressure two mites make for the shutters, and one knocks it
  r = await M(async () => { await window.__use('shutter', 1); const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, h1 = mod.horns[1]; const all = mod.routes().map(q => q.end).join();
    await window.__w(20, () => { D.me.x = h1.x; D.me.y = h1.y + 2.5; }, () => S.lateSent); const late = mod.late.map(m => ({ t: m.type, go: m.goFor ? m.goFor.i : -1 })); const g1 = document.getElementById('arcGoal').textContent;
    await window.__w(25, () => { D.me.x = h1.x; D.me.y = h1.y + 2.5; }, () => S.knocked > 0); return { all, late, g1, knocked: S.knocked, shut: S.shut.slice(), fill: mod.horns.map(h => +h.fill.toFixed(2)) }; });
  ok(r.all === 'horn,horn,horn', 'drain shut, both shutters to the horns and the centre clear: the air reaches all three horns', r.all);
  ok(r.late.length === 2 && r.late.every(m => m.t === 'bellmite') && new Set(r.late.map(m => m.go)).size === 2 && /makes for the/.test(r.g1), 'at two-thirds pressure two mites make for the two shutters', r);
  ok(r.knocked >= 1 && r.shut.includes(false), 'a mite that reaches its shutter knocks it to the drain', r);
  await shot('cho-bw-knock');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; window.__kill(mod.late); for (let i = 0; i < 2; i++) if (!S.shut[i]) await window.__use('shutter', i);
    await window.__w(30, () => { D.me.x = mod.horns[1].x; D.me.y = mod.horns[1].y + 2.5; }, () => D.RIFT.done && D.RIFT.exit); await window.__w(1);
    const E = D.M.marks.E[0]; let bridge = 0; for (let y = E.ty + 3; y < E.ty + 8; y++) if (D.walkAt(E.tx, y)) bridge++;
    return { full: mod.horns.map(h => h.full), noted: S.noted, done: D.RIFT.done, exit: !!D.RIFT.exit, bridge }; });
  ok(r.full.every(Boolean) && r.noted && r.done && r.exit && r.bridge >= 5, 'all three gauges full and the gallery clear: the combined note unfolds the bridge to Veyra\'s platform', r);
  await M(async () => { const D = window.__pp.arc.game._dbg, E = D.M.marks.E[0]; await window.__w(1.2, () => { D.me.x = E.x; D.me.y = E.y + 7.5; }); }); await shot('cho-bw-done'); await exitStage();

  /* ======================= THE HELD NOTE ======================= */
  await start('choir', 7); await setupW(); await runG(1.5);
  r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, mw = D.M.MW; return { need: mod.pad.need, latch: mod.pad.latch, r: mod.pad.r, horns: mod.horns.length, lat: mod.latT.every(t => D.M.G[t.ty * mw + t.tx] === 0), wave: mod.S.wave, exit: !!D.RIFT.exit }; });
  ok(r.need === 30 && r.latch === 2 && r.r >= 2 && r.horns === 4 && r.lat && !r.exit, 'the Held Note: a wide charge pad (30 s, a 2 s latch), four horns on the rim, the gold lattice shut', r);
  // the first wave, alone
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; await window.__w(6, null, () => S.wave >= 1); const w = S.waveMons.map(m => m.type).sort().join(','); for (const m of S.waveMons) { m.aggro = false; m.x = mod.pad.x - 13; m.y = mod.pad.y; } await window.__w(5, () => { for (const m of S.waveMons) { m.x = mod.pad.x - 13; m.y = mod.pad.y; m.aggro = false; } }); return { wave: S.wave, w, live: D.mons.filter(m => !m.dead).length }; });
  ok(r.wave === 1 && r.w === 'bellmite,bellmite,bellmite' && r.live === 3, 'wave 1: three bell mites, and no other wave while it stands', r);
  // charge with pauses: on it charges; off, the latch trickles 2 s, then it pauses (never erased)
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, p = mod.pad; S.coneT = 99; const off = { x: p.x + 5, y: p.y + 1 }; const pin = () => { for (const m of S.waveMons) { m.x = p.x - 13; m.y = p.y; m.aggro = false; } };
    const c0 = p.charge; await window.__w(3, () => { pin(); D.me.x = p.x; D.me.y = p.y; }); const on3 = p.charge - c0; const g1 = document.getElementById('arcGoal').textContent;
    await window.__w(1, () => { pin(); D.me.x = off.x; D.me.y = off.y; }); const latched = p.charging, l1 = p.charge; const g2 = document.getElementById('arcGoal').textContent;
    await window.__w(2.5, () => { pin(); D.me.x = off.x; D.me.y = off.y; }); const paused = p.charge; await window.__w(2, () => { pin(); D.me.x = off.x; D.me.y = off.y; }); const still = p.charge;
    return { on3: +on3.toFixed(2), latched, l1: +l1.toFixed(2), paused: +paused.toFixed(2), still: +still.toFixed(2), g1, g2 }; });
  ok(r.on3 > 2.5 && r.on3 < 3.5 && /holding/.test(r.g1), 'standing on the pad charges it', r);
  ok(r.latched && /latched/.test(r.g2) && Math.abs(r.paused - (r.on3 + 2)) < 0.4 && r.still === r.paused, 'stepping off: the latch trickles 2 s more, then the charge pauses (never erased)', r);
  await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, p = mod.pad; await window.__w(1, () => { D.me.x = p.x; D.me.y = p.y; for (const m of mod.S.waveMons) { m.x = p.x - 13; m.y = p.y; m.aggro = false; } }); }); await shot('cho-held-charge');
  // the cone: a numbered preview from a rim horn aimed at the pad; step off, it strikes, step back
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, p = mod.pad, CHO = D.RIFT.self.amb.CHO, X = D.RIFT.self.amb.C.X; S.coneT = 0.5; const pin = () => { for (const m of S.waveMons) { m.x = p.x - 13; m.y = p.y; m.aggro = false; } };
    await window.__w(3, () => { pin(); D.me.x = p.x; D.me.y = p.y; }, () => S.coneP); const b = S.coneP; if (!b) return { b: null }; const info = { shape: b.shape, n: b.n, lead: +b.lead.toFixed(2), covers: CHO.inBeat(p.x, p.y, b), coversEdge: CHO.inBeat(p.x + 1.5, p.y + 1, b), g: document.getElementById('arcGoal').textContent, hornWarn: mod.horns.some(h => h.warn > 0.5) };
    return info; });
  ok(r.shape === 'cone' && r.n === 1 && r.lead >= 2.4 && r.covers && r.coversEdge && /horn aims at the pad: step off/.test(r.g) && r.hornWarn, 'a rim horn aims a broad numbered cone (previewed with a countdown) over the whole pad; the goal says to step off', r);
  await runG(0.4); await shot('cho-held-cone');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, p = mod.pad, CHO = D.RIFT.self.amb.CHO, b = S.coneP; const pin = () => { for (const m of S.waveMons) { m.x = p.x - 13; m.y = p.y; m.aggro = false; } };
    // a safe spot: out of the cone, beside the pad
    let safe = null; for (const rr of [3.6, 4.4, 5.2, 6]) for (let a = 0; a < 16 && !safe; a++) { const x = p.x + Math.cos(a / 16 * 6.283) * rr, y = p.y + Math.sin(a / 16 * 6.283) * rr; if (!CHO.inBeat(x, y, b, 0.8) && D.walkAt(Math.floor(x), Math.floor(y))) safe = { x, y }; }
    const h0 = S.coneHits, c0 = p.charge; await window.__w(4, () => { pin(); D.me.x = safe.x; D.me.y = safe.y; }, () => b.fired); await window.__w(0.4, () => { pin(); D.me.x = safe.x; D.me.y = safe.y; }); const c1 = p.charge;
    await window.__w(1.5, () => { pin(); D.me.x = p.x; D.me.y = p.y; }); return { safe: !!safe, fired: b.fired, hits: S.coneHits - h0, kept: c1 >= c0, back: p.charge > c1 + 1 }; });
  ok(r.safe && r.fired && r.hits === 0 && r.kept && r.back, 'stepping aside the cone strikes the empty pad, the charge is kept, and back on the pad it charges again', r);
  // wave 1 down: wave 2 (two eels and a mite), alone; then wave 3 with the moth
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; S.coneT = 99; window.__kill(S.waveMons); await window.__w(8, null, () => S.wave >= 2); const w2 = S.waveMons.map(m => m.type).sort().join(','), live2 = D.mons.filter(m => !m.dead).length;
    window.__kill(S.waveMons); await window.__w(8, null, () => S.wave >= 3); const w3 = S.waveMons.map(m => m.type).sort().join(','); return { w2, live2, w3, wave: S.wave }; });
  ok(r.w2 === 'bellmite,pipeeel,pipeeel' && r.live2 === 3, 'wave 2: two pipe eels and a mite, alone', r);
  ok(r.wave === 3 && r.w3 === 'bellmite,bellmite,hushmoth', 'wave 3: a hush moth and two mites', r);
  // the moth hushes the pad: no charge while it holds; a hit interrupts it and the charge resumes
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, p = mod.pad, CHO = D.RIFT.self.amb.CHO, m = S.waveMons.find(q => q.type === 'hushmoth'); S.coneT = 99; for (const q of S.waveMons) if (q !== m) { q.aggro = false; q.x = p.x + 13; q.y = p.y; }
    m.cd = 0; m.x = p.x + 3; m.y = p.y - 2; let sil = false; await window.__w(10, () => { D.me.x = p.x; D.me.y = p.y; for (const q of S.waveMons) if (q !== m) { q.x = p.x + 13; q.y = p.y; q.aggro = false; } }, () => (sil = CHO.silenced(p)));
    const c0 = p.charge, g1 = document.getElementById('arcGoal').textContent, hint = D.RIFT.hintObj(); await window.__w(2.5, () => { D.me.x = p.x; D.me.y = p.y; }); const c1 = p.charge;
    return { sil, c0: +c0.toFixed(2), c1: +c1.toFixed(2), g1, hint: hint && hint.label }; });
  ok(r.sil && Math.abs(r.c1 - r.c0) < 0.05 && /hush moth silences the pad: hit it/.test(r.g1) && r.hint === 'HIT THE MOTH', 'the moth hushes the pad: standing on it no longer charges; the goal and pointer name the moth', r);
  await shot('cho-held-hushed');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, p = mod.pad, CHO = D.RIFT.self.amb.CHO, m = S.waveMons.find(q => q.type === 'hushmoth'); D.hitMon(m, 5, { flat: true }); await window.__w(0.6, () => { D.me.x = p.x; D.me.y = p.y; }); const freed = !CHO.silenced(p), c0 = p.charge; await window.__w(1.5, () => { D.me.x = p.x; D.me.y = p.y; }); return { freed, ints: m.interrupts || 0, gain: +(p.charge - c0).toFixed(2) }; });
  ok(r.freed && r.ints === 1 && r.gain > 1, 'a hit interrupts the moth and the charge resumes', r);
  // fill the ring (stepping off for every cone), then the last wave falls: the bells lift the lattice
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, p = mod.pad, CHO = D.RIFT.self.amb.CHO; S.coneT = 2; const c0 = S.cones, h0 = S.coneHits; const side = { x: p.x, y: p.y + 4.2 };
    for (const q of S.waveMons) if (q.type !== 'hushmoth') { q.aggro = false; } window.__kill(S.waveMons.filter(q => q.type === 'hushmoth'));
    await window.__w(45, () => { for (const q of S.waveMons) { q.x = p.x + 13; q.y = p.y; q.aggro = false; } const b = S.coneP && !S.coneP.fired ? S.coneP : null; let at = { x: p.x, y: p.y }; if (b) { at = null; for (const rr of [3.6, 4.4, 5.2, 6]) for (let a = 0; a < 16 && !at; a++) { const x = p.x + Math.cos(a / 16 * 6.283) * rr, y = p.y + Math.sin(a / 16 * 6.283) * rr; if (!CHO.inBeat(x, y, b, 0.8) && D.walkAt(Math.floor(x), Math.floor(y))) at = { x, y }; } at = at || side; } D.me.x = at.x; D.me.y = at.y; }, () => p.full);
    const fullEarly = p.full, doneEarly = D.RIFT.done, g1 = document.getElementById('arcGoal').textContent; window.__kill(S.waveMons); await window.__w(4, null, () => D.RIFT.done); await window.__w(1.5); const mw = D.M.MW;
    return { fullEarly, doneEarly, g1, cones: S.cones - c0, hits: S.coneHits - h0, done: D.RIFT.done, exit: !!D.RIFT.exit, lat: mod.latT.every(t => D.M.G[t.ty * mw + t.tx] === 1), charge: p.charge }; });
  ok(r.fullEarly && !r.doneEarly && /defeat the waves/.test(r.g1), 'the ring fills while the last wave still stands: not done yet', r);
  ok(r.cones >= 1 && r.hits === 0, 'cones kept coming while charging, each dodged by stepping off', r);
  ok(r.done && r.exit && r.lat, 'ring full and all three waves down: the bells lift the gold lattice to the Resonating Bowl', r);
  await shot('cho-held-done'); await exitStage();

  ok(!errors.length, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
