// v430 BW: the Belfry's water drains over time and the doors open with their mass, the gameplay following both.
//  A  D2's refuge hall: the level sampled every frame against game time (no jump at the turn, falling smoothly, eased, ending
//     at 0 in about its configured time), a re-trigger ignored, a pause holding it, the wake (inShallow) and the beaching
//     following the real water (the rim before the sump), the drained hall's shallows gone at the end
//  B  D1's gate hall: each valve a step down over seconds; the pet held off only where it is still deep; the guardian wakes
//     when it is drained
//  C  the exit doors: shut until the stage is done (and the exit does nothing then), then the lock, then the leaves; the
//     exit still ends the stage; the lift's grille follows the lift's own unlock; riftGate drawn by the stage's door
// HTML=test-bw.html node tests/_bw-mech.js   (prints PASS/FAIL lines and a summary)
const { open } = require('./_bw-lib');
(async () => {
  const fails = [], ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const T = await open({ noGpu: true }); const { page, errors } = T;
  // ---------------- A ----------------
  await T.start(3); await T.runG(0.4);
  const a0 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, BEL = window.BEL, DS = BEL.dungeonCtx(D.g), VH = DS.valveHalls[0], W = VH.W, r = VH.room;
    for (const m of D.mons) if (!m.dead && !m.boss && m.x > r.x - 2 && m.x < r.x + r.w + 2 && m.y > r.y - 2 && m.y < r.y + r.h + 2) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); }
    if (VH.leech) D.hitMon(VH.leech, 1e9, { flat: true });
    // a rim tile (the floor highest) and the sump's tile: two crawlers parked on them (held still)
    let rim = VH.tiles[0], hi = -1; for (const t of VH.tiles) { const e = W.elev(t.tx + 0.5, t.ty + 0.5); if (e > hi) { hi = e; rim = t; } }
    const P = [{ x: rim.tx + 0.5, y: rim.ty + 0.5 }, { x: VH.sump.x, y: VH.sump.y }], made = [];
    for (const p of P) { const m = BEL.spawn(D.X || D.g.X, 'crawler', p.x, p.y, { pack: 990, count: false }); if (m) { m.x = p.x; m.y = p.y; m.holds = true; m.aggro = false; m.__bw = made.length; made.push(m); } }
    window.__bwA = { P, made };
    return { has: !!W, level: W.level, wetRim: BEL.inShallow(D.X || D.g.X, P[0].x, P[0].y), wetSump: BEL.inShallow(D.X || D.g.X, P[1].x, P[1].y), mons: made.length, dur: window.BEL_DRAIN.durFor(VH.tiles.length, 'shallow'), tiles: VH.tiles.length }; });
  ok(a0.has && a0.level === 1 && a0.wetRim && a0.wetSump, `A hall water full before the valve (level ${a0.level}, wet rim ${a0.wetRim}, sump ${a0.wetSump}; ${a0.tiles} tiles, drain ${a0.dur.toFixed(2)} s)`);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'valve' && o.valveHall === 0); o.use(o); o.use(o); o.on = false; o.use(o); o.on = true; });   // (a re-trigger, even with the valve forced back, starts from the current level: no jump)
  // pause in the middle of it
  const s1 = await T.runG(1.2, `const DS = BEL.dungeonCtx(D.g), V = DS.valveHalls[0], X = D.X || D.g.X, A = window.__bwA; return [D.g.t, V.W.level, BEL.inShallow(X, A.P[0].x, A.P[0].y), BEL.inShallow(X, A.P[1].x, A.P[1].y), A.made.map(m => m.belBeachV === 0 ? 1 : 0).join('')];`);
  const paused = await T.pause(true); await page.waitForTimeout(300); const lvP = await page.evaluate(() => window.BEL.dungeonCtx(window.__pp.arc.game._dbg.g).valveHalls[0].W.level); await page.waitForTimeout(1500); const lvP2 = await page.evaluate(() => window.BEL.dungeonCtx(window.__pp.arc.game._dbg.g).valveHalls[0].W.level); await T.pause(false);
  ok(!paused || Math.abs(lvP2 - lvP) < 1e-6, `A a paused game holds the level (${lvP.toFixed(4)} -> ${lvP2.toFixed(4)}, paused ${paused})`);
  const s2 = await T.runG(14, `const DS = BEL.dungeonCtx(D.g), V = DS.valveHalls[0], X = D.X || D.g.X, A = window.__bwA; return [D.g.t, V.W.level, BEL.inShallow(X, A.P[0].x, A.P[0].y), BEL.inShallow(X, A.P[1].x, A.P[1].y), A.made.map(m => m.belBeachV === 0 ? 1 : 0).join('')];`);
  const S = s1.concat(s2).filter((v, i, a) => !i || v[0] !== a[i - 1][0]), st = await page.evaluate(() => { const VH = window.BEL.dungeonCtx(window.__pp.arc.game._dbg.g).valveHalls[0]; return { starts: VH.W.stat.starts, done: VH.W.done, off: !!VH.region.off, dur: VH.W.dur, loot: VH.loot ? VH.loot.length : -1 }; });
  const tS = S[0][0], first = S[0][1]; let mono = true, maxDrop = 0, tEnd = null, tRimDry = null, tSumpDry = null, bRim = null, bSump = null;
  for (let i = 1; i < S.length; i++) { const d = S[i - 1][1] - S[i][1], dt = S[i][0] - S[i - 1][0]; if (d < -1e-6) mono = false; if (dt > 0) maxDrop = Math.max(maxDrop, d / dt * (1 / 60)); if (tEnd == null && S[i][1] <= 0) tEnd = S[i][0];
    if (tRimDry == null && !S[i][2]) tRimDry = S[i][0]; if (tSumpDry == null && !S[i][3]) tSumpDry = S[i][0]; if (bRim == null && S[i][4][0] === '1') bRim = S[i][0]; if (bSump == null && S[i][4][1] === '1') bSump = S[i][0]; }
  const at = f => { const tt = tS + st.dur * f; let best = S[0]; for (const s of S) if (Math.abs(s[0] - tt) < Math.abs(best[0] - tt)) best = s; return +best[1].toFixed(3); };
  const q = [0.1, 0.25, 0.5, 0.75, 0.9].map(at);
  console.log('A samples', S.length, 'levels at 10/25/50/75/90% of the drain:', q.join(' '), '| t(level 0)', tEnd && (tEnd - tS).toFixed(2), 'of', st.dur.toFixed(2), 's');
  ok(first > 0.97, `A no jump at the turn (first sampled level ${first.toFixed(3)})`);
  ok(mono, 'A the level only falls');
  ok(q[0] > q[1] && q[1] > q[2] && q[2] > q[3] && q[3] > q[4] && q[2] > 0.15 && q[2] < 0.85, `A it falls through the drain (${q.join(' > ')})`);
  ok(q[0] > 0.9 && 1 - q[0] < (q[1] - q[2]), `A an eased start (10%: ${q[0]}, the middle falls faster)`);
  ok(tEnd != null && Math.abs((tEnd - tS) - st.dur) < 0.35 && st.dur >= 4 && st.dur <= 7, `A reaches 0 at its configured time (${tEnd && (tEnd - tS).toFixed(2)} s of ${st.dur.toFixed(2)} s)`);
  ok(maxDrop < 0.02, `A smooth: at most ${(maxDrop * 100).toFixed(2)}% of the water per 1/60 s`);
  ok(st.starts <= 2, `A a re-trigger (the valve forced back and turned again) carried on from the level it found (${st.starts} starts, no jump: the level only fell)`);
  ok(tRimDry != null && tSumpDry != null && tRimDry < tSumpDry, `A the wake follows the water: the rim dry at ${tRimDry && (tRimDry - tS).toFixed(2)} s, the sump at ${tSumpDry && (tSumpDry - tS).toFixed(2)} s`);
  ok(bRim != null && bSump != null && bRim < bSump && bRim <= tRimDry + 0.1, `A the brood is beached where the water leaves it: rim ${bRim && (bRim - tS).toFixed(2)} s, sump ${bSump && (bSump - tS).toFixed(2)} s`);
  ok(st.loot === 0, `A what the floor held came up as it was revealed (${st.loot} left)`);
  await T.runG(9); const end = await page.evaluate(() => { const VH = window.BEL.dungeonCtx(window.__pp.arc.game._dbg.g).valveHalls[0]; return { done: VH.W.done, off: !!VH.region.off }; });
  ok(end.done && end.off, `A after it dries, the hall's shallows are gone as before (done ${end.done}, off ${end.off})`);
  // ---------------- C (std door) on the same stage ----------------
  const c0 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = window.BEL.ctx(D.g), e = D.RIFT.exit; D.me.x = e.x; D.me.y = e.y + 0.3; return { st: window.BEL_DOORS.state(C), done: D.RIFT.done, e: { x: e.x, y: e.y, r: e.r } }; });
  await T.runG(1.2); const c1 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { st: window.BEL_DOORS.state(window.BEL.ctx(D.g)), state: window.__pp.arc.state, claims: window.BEL_DOORS.stats.claims }; });
  ok(c0.st && c0.st.kind === 'std' && c1.st.k === 0 && c1.state === 'play', `C std door shut while the stage is not done; the pet on the exit stays (${JSON.stringify(c1.st)}, ${c1.state})`);
  ok(c1.claims > 0, `C the exit is drawn as the stage's door (${c1.claims} frames)`);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.x -= 3.5; D.me.y += 3; });
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.RIFT.self.done = true; });
  const ds = await T.runG(3.6, `const s = window.BEL_DOORS.state(BEL.ctx(D.g)); return [D.g.t, s.lock, s.k, s.kE];`);
  const tL = ds.find(s => s[1] >= 1), tK0 = ds.find(s => s[2] > 0), tK1 = ds.find(s => s[2] >= 1);
  ok(tL && tK0 && tK1 && tL[0] <= tK0[0] && tK1[0] - ds[0][0] > 1.8, `C std: the lock (${tL && (tL[0] - ds[0][0]).toFixed(2)} s), then the leaves (${tK0 && (tK0[0] - ds[0][0]).toFixed(2)} .. ${tK1 && (tK1[0] - ds[0][0]).toFixed(2)} s)`);
  const kq = ds.filter(s => s[2] > 0 && s[2] < 1); ok(kq.length > 3 && kq[1][3] - kq[0][3] < kq[Math.floor(kq.length / 2)][3] - kq[Math.floor(kq.length / 2) - 1][3] + 1e-3, 'C std: the leaves start slowly (their mass)');
  const held = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, e = D.RIFT.exit; D.me.x = e.x; D.me.y = e.y; for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r)); return { r: e.r, d: Math.hypot(D.me.x - e.x, D.me.y - e.y), state: window.__pp.arc.state }; });
  ok(held.r < 0 && held.d > 1 && held.state === 'play', `C progression unchanged: the door open, its guardian still standing holds the way (exit r ${held.r}, pet put back ${held.d.toFixed(2)})`);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, DS = window.BEL.dungeonCtx(D.g); if (DS.mini && !DS.mini.dead) { DS.mini.guardFn = null; DS.mini.under = false; D.hitMon(DS.mini, 1e12, { flat: true }); } for (const m of D.mons) if (!m.dead && !m.boss) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } });
  await T.runG(0.5); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, e = D.RIFT.exit; D.me.x = e.x; D.me.y = e.y; });
  let won = false; try { await page.waitForFunction(() => window.__pp.arc.state === 'end' || window.__pp.arc.game._dbg.g.won, null, { timeout: 20000 }); won = true; } catch (e) {}
  ok(won, 'C the open door\'s exit still ends the stage');
  // ---------------- C (the lift) ----------------
  await T.start(4); await T.runG(0.6);
  const l0 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = window.BEL.ctx(D.g); return { st: window.BEL_DOORS.state(C), want: C.doorWant ? C.doorWant() : null }; });
  ok(l0.st && l0.st.kind === 'lift' && l0.want === false && l0.st.k === 0, `C lift shut until the pans balance (${JSON.stringify(l0)})`);
  // the lift unlocked the stage's own way: the leeches off the rack, the pans at three and three, the drain pair beaten
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && m.belHold) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } }); await T.runG(0.3);
  await page.evaluate(() => { const O = window.__pp.arc.game._dbg.RIFT.objs, cl = n => O.find(o => o.kind === 'clapper' && o.n === n), pan = i => O.find(o => o.kind === 'pan' && o.i === i); const c3 = cl(3); c3.use(c3); pan(0).use(); const c1 = cl(1); c1.use(c1); pan(1).use(); const c2 = cl(2); c2.use(c2); pan(1).use(); });
  await T.runG(1.3); await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && m.pack === 530) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } });
  const ls = await T.runG(3.6, `const s = window.BEL_DOORS.state(BEL.ctx(D.g)), C = BEL.ctx(D.g); return [D.g.t, s.lock, s.k, C.doorWant() ? 1 : 0];`);
  ok(ls.length && ls[ls.length - 1][2] >= 1 && ls[0][2] < 0.05 && ls[ls.length - 1][3] === 1, `C lift: its grille rises when the pans balance and the lift unlocks (k ${ls[0][2]} -> ${ls[ls.length - 1][2]})`);
  const l1 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { done: D.RIFT.done, r: D.RIFT.exit.r }; });
  ok(!l1.done, `C lift: the grille is not the stage's progress (stage done ${l1.done}: the guardian still holds it)`);
  // ---------------- C (boss entrance) ----------------
  await T.start(6); await T.runG(0.6);
  const b0 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.RIFT.self.done = true; return window.BEL_DOORS.state(window.BEL.ctx(D.g)); });
  const bs = await T.runG(5, `const s = window.BEL_DOORS.state(BEL.ctx(D.g)); return [D.g.t, s.lock, s.k];`);
  const bL = bs.find(s => s[1] >= 1), bK = bs.find(s => s[2] >= 1);
  ok(b0 && b0.kind === 'boss' && bL && bK && bL[0] - bs[0][0] > 1.2 && bK[0] - bs[0][0] > 3.5, `C boss entrance: the bolts and lock (${bL && (bL[0] - bs[0][0]).toFixed(2)} s), then the leaves (${bK && (bK[0] - bs[0][0]).toFixed(2)} s)`);
  // ---------------- B ----------------
  await T.start(0); await T.runG(0.6);
  const g0 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, DS = window.BEL.dungeonCtx(D.g), GH = DS.gate; for (const VH of DS.valveHalls) if (VH.leech) D.hitMon(VH.leech, 1e9, { flat: true }); return { has: !!GH.W, level: GH.W.level, x0: GH.x0, y0: GH.y0, x1: GH.x1, y1: GH.y1, cx: GH.cx, cy: GH.cy }; });
  ok(g0.has && g0.level === 1, 'B the gate hall full');
  const tryAt = (x, y) => page.evaluate(async ([x, y]) => { const D = window.__pp.arc.game._dbg, GH = window.BEL.dungeonCtx(D.g).gate; GH.last = { x: GH.x0 - 1.2, y: (GH.y0 + GH.y1) / 2 }; D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; for (let i = 0; i < 4; i++) await new Promise(r => requestAnimationFrame(r)); return { x: D.me.x, y: D.me.y, depth: GH.W.depth(x, y) }; }, [x, y]);
  // a rim spot (highest floor) and the middle
  const rim = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, GH = window.BEL.dungeonCtx(D.g).gate; let b = null, hi = -1; for (const t of GH.reg.tiles) { const x = t.tx + 0.5, y = t.ty + 0.5, e = GH.W.elev(x, y); if (e > hi && !D.blocked(x, y)) { hi = e; b = { x, y }; } } return b; });
  const r1 = await tryAt(rim.x, rim.y); ok(Math.hypot(r1.x - rim.x, r1.y - rim.y) > 0.5, `B full: the pet cannot wade in even at the rim (depth ${r1.depth.toFixed(3)})`);
  const turn = i => page.evaluate(i => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.filter(o => o.kind === 'valve')[i]; o.locked = false; o.use(o); }, i);
  await turn(0); const gs1 = await T.runG(1.0, `const GH = BEL.dungeonCtx(D.g).gate; return [D.g.t, GH.W.level];`); await T.runG(4.2);
  await turn(1); await T.runG(5.2);
  const lv2 = await page.evaluate(() => window.BEL.dungeonCtx(window.__pp.arc.game._dbg.g).gate.W.level);
  ok(gs1.length > 3 && gs1[0][1] > 0.95 && gs1[gs1.length - 1][1] < gs1[0][1] && gs1[gs1.length - 1][1] > 0.67, `B a valve lowers it a step over seconds (${gs1[0][1].toFixed(3)} -> ${gs1[gs1.length - 1][1].toFixed(3)} in the first second)`);
  ok(Math.abs(lv2 - 1 / 3) < 0.02, `B two valves: a third left (${lv2.toFixed(3)})`);
  const r2 = await tryAt(rim.x, rim.y); ok(Math.hypot(r2.x - rim.x, r2.y - rim.y) < 0.2, `B the rim the water has left can be walked (depth ${r2.depth.toFixed(3)})`);
  const mid = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, GH = window.BEL.dungeonCtx(D.g).gate; return { x: GH.sump.x + 0.6, y: GH.sump.y + 0.6 }; });
  const r3 = await tryAt(mid.x, mid.y); ok(Math.hypot(r3.x - mid.x, r3.y - mid.y) > 0.5, `B the deep middle still holds it off (depth ${r3.depth.toFixed(3)})`);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, GH = window.BEL.dungeonCtx(D.g).gate; D.me.x = GH.x0 - 1.5; D.me.y = GH.cy; });
  await turn(2); const gs3 = await T.runG(3, `const DS = BEL.dungeonCtx(D.g), GH = DS.gate; return [D.g.t, GH.W.level, GH.open ? 1 : 0, DS.mini && DS.mini.belSubmerged ? 1 : 0];`);
  ok(!gs3[gs3.length - 1][2] && gs3[gs3.length - 1][3] === 1, 'B the guardian sleeps while the water is still going down');
  await T.runG(8); const g4 = await page.evaluate(() => { const DS = window.BEL.dungeonCtx(window.__pp.arc.game._dbg.g), GH = DS.gate; return { open: GH.open, level: GH.W.level, sub: DS.mini ? !!DS.mini.belSubmerged : null, dur: GH.W.dur }; });
  ok(g4.open && g4.level === 0 && g4.sub === false, `B drained (over ${g4.dur.toFixed(2)} s): the gate hall opens and its guardian wakes`);
  ok(errors.length === 0, `0 page errors (${errors.length}) ${errors.slice(0, 2).join(' | ')}`);
  console.log(fails.length ? `SUMMARY ${fails.length} FAIL` : 'SUMMARY ALL PASS'); await T.browser.close(); process.exit(fails.length ? 1 : 0);
})();
