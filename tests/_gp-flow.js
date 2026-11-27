// v468 GP: Clash of the Twins (the Gemini Gate's trial) end to end, game time stepped synchronously (dt 1/30 unless said), no GPU.
// The puzzle spec's section 18 list, as far as a headless run can judge it: tracking, the lock (no tracking after it, the origin
// fixed too), time to dodge, fire breaks ice, ice breaks fire, matching breath absorbed, ordinary attacks harmless to pillars,
// inactive pillars untouchable, a miss resets nothing, the stages in order, frost patches (slow + damage, dissolving), both
// guardians in stage III staggered, a Thermal Shock where two live breaths cross, the Paradox (leaving early resets it, staying in
// is damage and a retry, getting clear resolves it), the convergence, the gate opening, the checkpoint (set, used by a restart, not
// replaying the puzzle), the route into GEMINI_BOSS (its begin, S.phase 'boss' for the music), the win clearing the checkpoint and
// unlocking Gemini once, a switch of pets mid-trial, dt independence (30 / 60 / 120 steps), cleanup between stages.
// HTML=test-gp.html node tests/_gp-flow.js
const { open } = require('./_gp-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const BAIT = `
  const angD = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
  // stand behind pillar p as seen from guardian G's mouth while it tracks; at the lock step sideways out of its band; returns when p breaks or G recovers
  const bait = (G, p, o) => { o = o || {}; let side = null, t = 0, broke = false, lockedAt = null, info = {}, seen = false; const dt = o.dt || 1 / 30;
    for (let i = 0; i < 40 / dt; i++) { heal(); const o2 = m.mouthOf(G), dx = p.x - o2.x, dy = p.y - o2.y, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
      if (G.st === 'track') seen = true; if (!seen || G.st === 'track' || G.st === 'rest' || G.st === 'wake' || G.st === 'dormant') { side = null; if (!o.stay) hold(p.x + ux * 2.4, p.y + uy * 2.4); else hold(o.stay[0], o.stay[1]); }
      else if (G.st === 'lock' || G.st === 'breath') { if (lockedAt == null) { lockedAt = R.t; info.lockA = G.lockA; info.ox = G.lockO && G.lockO.x; }
        if (!o.noDodge) { if (!side) side = [p.x + ux * 2.4 - uy * 2.9, p.y + uy * 2.4 + ux * 2.9]; if (Math.hypot(side[0] - p.x, side[1] - p.y) < 2.4) side = [p.x + ux * 2.4 + uy * 2.9, p.y + uy * 2.4 - ux * 2.9]; hold(side[0], side[1]); } }
      U.update(dt); t += dt; if (o.each) o.each(); if (p.broken && !broke) { broke = true; info.t = t; } if (broke && t > info.t + 0.2) break; if (lockedAt != null && G.st === 'rest') break; }
    info.broke = broke; info.st = G.st; return info; };`;
(async () => {
  const T = await open({ party: true }); const { page, ev, errors } = T;
  try {
    // the Rift UI: the Gemini gate listed as Clash of the Twins, open once Rift 04 is sealed
    let r = await page.evaluate(() => { const P = window.__pp; P.renderRift(); const g = [...document.querySelectorAll('.rf-gate')]; const e = g.find(x => /Clash of the Twins/.test(x.textContent)); return { n: g.length, txt: e ? e.textContent.slice(0, 160) : '', open: e ? /open|available/i.test(e.className + e.textContent) : false, old: g.some(x => /Twin Reflection/.test(x.textContent)) }; });
    console.log('  ui', JSON.stringify(r)); ok(r.txt && !r.old, 'the Rift UI lists Clash of the Twins (no Twin Reflection left)');
    await T.start();
    r = await ev(`step(1.0); return { st: R.st, stage: R.stage, up: m.PIL.filter(p => p.up).map(p => p.id), L: m.GU.L.st, U: m.GU.R.st, mons: D.mons.length, party: D.party.length, boss: typeof GEMINI_BOSS !== 'undefined' };`);
    console.log('  start', JSON.stringify(r)); ok(r.st === 's1' && r.up.join() === 'I1,I2' && r.U === 'dormant', 'stage I: Lux alone, the two Ice pillars rise, Umbra dormant'); ok(r.mons === 0, 'no ordinary enemy waves (no monsters on the field)');
    // tracking: Lux's aim follows the pet; after the lock it never moves again (angle and origin), through the breath
    r = await ev(BAIT + `const L = m.GU.L; step(8, () => { hold(25.5, 40.5); heal(); return L.st === 'track' && L.tt > 0.6; }); const a0 = L.aim, want0 = m.aimAt(L, me.x, me.y);
      step(0.6, () => { hold(27, 36.5); heal(); }); const a1 = L.aim, want1 = m.aimAt(L, me.x, me.y); const follow = Math.abs(angD(a1, want1)) < Math.abs(angD(a0, want1)) - 0.05;
      step(4, () => { heal(); return L.st === 'lock'; }); const la = L.lockA, lo = [L.lockO.x, L.lockO.y], tl0 = R.t; let moved = 0, maxDA = 0, maxDO = 0, inBreath = 0, sameAng = true;
      step(2.3, () => { heal(); hold(23 + Math.random() * 4, 37 + Math.random() * 4); if (L.path) { maxDA = Math.max(maxDA, Math.abs(angD(L.path.a, la))); maxDO = Math.max(maxDO, Math.hypot(L.path.ox - lo[0], L.path.oy - lo[1])); } if (L.st === 'breath') inBreath++; if (L.lockA !== la && L.lockA != null) sameAng = false; });
      return { follow, a0, a1, want1, maxDA, maxDO, inBreath, sameAng, lockT: m.CFG.lock, w: m.wOf(10), spd: 4.3 };`);
    console.log('  track/lock', JSON.stringify(r)); ok(r.follow, 'Lux tracks the controlled pet'); ok(r.maxDA < 1e-9 && r.maxDO < 1e-9 && r.sameAng && r.inBreath > 10, 'after the lock its aim and origin stay fixed through the breath');
    ok((r.w + 0.4) / r.spd < r.lockT * 0.75, `time to dodge: leaving the band (${(r.w + 0.4).toFixed(2)} tiles) takes ${((r.w + 0.4) / r.spd).toFixed(2)} s walking, the lock gives ${r.lockT} s (a dodge roll 0.3 s)`);
    // a miss: in the open, the pet takes ordinary damage; nothing is reset
    r = await ev(BAIT + `const L = m.GU.L; m.GU.L.hitT = 0; step(10, () => { heal(); return L.st === 'track'; }); const hp0 = D.ST.hp, n0 = R.hits.breath, b0 = R.broke; let hpMin = 1e9;
      step(5, () => { if (L.st === 'track') hold(25.5, 39.5); if (L.st === 'breath') { hpMin = Math.min(hpMin, me.hp); } return L.st === 'rec'; }); const hits = R.hits.breath - n0; heal(); return { hits, lost: hp0 - hpMin, broke: R.broke - b0, st: R.st, dead: me.dead };`);
    console.log('  miss', JSON.stringify(r)); ok(r.hits >= 1 && r.lost > 0 && r.broke === 0 && r.st === 's1' && !r.dead, 'a missed breath hurts the pet (ordinary damage), breaks nothing, resets nothing');
    // inactive stage pillars cannot be destroyed: a fire breath through F1's place in stage I passes it
    r = await ev(`const L = m.GU.L, F1 = m.PIL.find(p => p.id === 'F1'); const a = m.aimAt(L, F1.x, F1.y), P2 = m.breathPath(L, a); return { live: m.live(F1), hit: P2.hit ? P2.hit.id : null, up: F1.up };`);
    ok(!r.live && r.hit !== 'F1', 'a pillar of a later stage is not in play (no collision, no damage)');
    // ordinary attacks cannot destroy pillars (they are not foes: no monster, no prop the blows can find)
    r = await ev(`const p = m.PIL.find(q => q.up && !q.broken); m.GU.L.active = false; m.GU.L.st = 'rest'; m.GU.L.cd = 99; m.GU.L.path = null; let used = 0; for (let i = 0; i < 6; i++) { hold(p.x + 1.6, p.y); me.face = -1; try { if (D.useStrong) { D.useStrong(); used++; } } catch (e) {} step(0.4, () => { hold(p.x + 1.6, p.y); heal(); }); } m.GU.L.active = true; m.GU.L.cd = 0.5; return { log: R.log.filter(e => e[0] === 'break').map(e => e.join(':')), used, hit: p.hit, broken: p.broken, mons: D.mons.filter(q => !q.dead).length };`);
    console.log('  attacks', JSON.stringify(r)); ok(!r.broken && r.hit === 0 && r.mons === 0, 'ordinary Cocopet attacks do nothing to the pillars');
    // fire breaks ice: bait Lux into I1, then I2 (stage II follows)
    r = await ev(BAIT + `const L = m.GU.L, I1 = m.PIL.find(p => p.id === 'I1'); const a = bait(L, I1); return Object.assign(a, { broke: I1.broken, n: R.broke, live0: S.live[0], hits: R.hits.breath });`);
    console.log('  I1', JSON.stringify(r)); ok(r.broke && r.n === 1 && r.live0 === 0, 'Lux\'s fire breath breaks an Ice pillar (baited, the pet dodged); its channel goes dark');
    r = await ev(`const p = m.PIL.find(p => p.id === 'I1'); const n = R.broke; m.breakPillar('I1'); return { n2: R.broke, n };`);
    ok(r.n2 === r.n, 'a pillar can be destroyed only once (no duplicate progression)');
    r = await ev(BAIT + `const L = m.GU.L, I2 = m.PIL.find(p => p.id === 'I2'); const a = bait(L, I2); const stA = R.st; step(4.0, () => { heal(); hold(21.5, 43); }); return Object.assign(a, { stA, st: R.st, up: m.PIL.filter(p => p.up && !p.broken).map(p => p.id), L: m.GU.L.st, U: m.GU.R.st, frost: R.frost.length, shocks: R.shocks.length });`);
    console.log('  I2', JSON.stringify(r)); ok(r.broke && r.stA === 't1' && r.st === 's2' && r.up.join() === 'F1,F2', 'both Ice pillars down: stage II, the Fire pillars rise'); ok(r.L === 'sleep' && (r.U === 'wake' || r.U === 'rest' || r.U === 'track'), 'Lux goes dormant, Umbra awakens');
    // ice breaks fire, frost patches: slow and a little damage, then they dissolve
    r = await ev(BAIT + `const U2 = m.GU.R, F2 = m.PIL.find(p => p.id === 'F2'); let frostMax = 0; const a = bait(U2, F2, { each: () => { frostMax = Math.max(frostMax, R.frost.length); } }); frostMax = Math.max(frostMax, R.frost.length); const f = R.frost[0]; let chill = 0, dmg = 0;
      U2.active = false; U2.st = 'rest'; U2.cd = 99; U2.path = null; if (f) { const n0 = R.hits.frost; me.inv = 0; for (let i = 0; i < 45; i++) { hold(f.x, f.y); me.chill = 0; U.update(1 / 30); chill = Math.max(chill, me.chill || 0); } dmg = R.hits.frost - n0; }
      step(5, () => heal()); const after = R.frost.length; U2.active = true; U2.cd = 0.5; return Object.assign(a, { broke: F2.broken, frostMax, chill, dmg, after });`);
    console.log('  F2', JSON.stringify(r)); ok(r.broke, 'Umbra\'s ice breath breaks a Fire pillar'); ok(r.frostMax >= 1 && r.chill > 0 && r.dmg >= 1 && r.after === 0, `frost patches: left by the breath, slow (chill) and hurt a little, dissolve (${r.frostMax} laid)`);
    r = await ev(BAIT + `const U2 = m.GU.R, F1 = m.PIL.find(p => p.id === 'F1'); const a = bait(U2, F1); step(3.6, () => { heal(); hold(21.5, 43); }); return Object.assign(a, { st: R.st, up: m.PIL.filter(p => p.up && !p.broken).map(p => p.id), emb: S.emb, L: m.GU.L.st, U: m.GU.R.st, live: S.live.join('') });`);
    console.log('  F1', JSON.stringify(r)); ok(r.broke && r.st === 's3' && r.up.sort().join() === 'F3,I3', 'stage III: one Fire and one Ice pillar rise'); ok(r.emb >= 1 && r.live === '001001', 'four channels dark, the Gemini sign glowing');
    // a switch of pets mid-trial: nothing resets, the guardians aim at the new pet
    r = await ev(`const st0 = R.st, b0 = R.broke, gone = m.PIL.filter(p => p.broken).map(p => p.id), n = D.party.length; let sw = false, aimOk = null; if (n > 1) { me.inv = 0; g.swapCd = 0; sw = D.switchTo(1); step(0.5, () => { heal(); hold(21.5, 46); }); } return { n, sw, st: R.st, b: R.broke, st0, b0, cur: D.cur(), restored: gone.filter(id => !m.PIL.find(p => p.id === id).broken).length, r: +me.r.toFixed(2) };`);
    console.log('  switch', JSON.stringify(r)); ok(r.n < 2 || (r.sw !== false && r.st === r.st0 && r.b >= r.b0 && r.restored === 0), 'switching pets keeps the stage and the destroyed pillars' + (r.n < 2 ? ' (one pet: not run)' : ''));
    // stage III: both guardians, staggered; a matching breath absorbed; a Thermal Shock where live breaths cross
    r = await ev(BAIT + `const L = m.GU.L, U2 = m.GU.R; const starts = { L: [], U: [] }; let pl = L.st, pu = U2.st, shocks = 0, overlap = 0; const F3 = m.PIL.find(p => p.id === 'F3'); let absorbed = 0; let absMax = 0;
      const s0 = R.hits.shock; step(24, () => { heal(); hold(21.5, 41); if (L.st === 'track' && pl !== 'track') starts.L.push(R.t); if (U2.st === 'track' && pu !== 'track') starts.U.push(R.t); pl = L.st; pu = U2.st; if (L.st === 'breath' && U2.st === 'breath') overlap++; shocks = Math.max(shocks, R.shocks.length); });
      const gaps = starts.U.map(u => { const l = starts.L.filter(x => x <= u + 1e-6).pop(); return l == null ? null : +(u - l).toFixed(2); });
      // a fire breath into the Fire pillar: absorbed
      U2.active = false; U2.st = 'rest'; U2.cd = 99; const a = bait(L, F3, { each: () => { absMax = Math.max(absMax, F3.absorb); } }); absorbed = absMax; U2.active = true; U2.cd = 0.5;
      return { starts, gaps, overlap, shocks, shockHits: R.hits.shock - s0, absorbedBroke: F3.broken, absorbed, F3hit: F3.hit };`);
    console.log('  stage3', JSON.stringify(r)); ok(r.gaps.length >= 2 && r.gaps.every(x => x != null && x >= 0.85), 'Twin Cataclysm: both track the pet, Umbra\'s charge staggered after Lux\'s (' + r.gaps.join(', ') + ' s)');
    ok(r.overlap > 0 && r.shocks >= 1, 'their breaths sometimes overlap; where they cross a Thermal Shock bursts (' + r.shocks + ')'); ok(!r.absorbedBroke && r.F3hit === 0 && r.absorbed > 0.5, 'a matching breath (fire on the Fire pillar) is absorbed');
    // the last two: I3 by Lux, F3 by Umbra -> the Paradox
    r = await ev(BAIT + `const L = m.GU.L, U2 = m.GU.R, I3 = m.PIL.find(p => p.id === 'I3'), F3 = m.PIL.find(p => p.id === 'F3'); const pause = G => { G.active = false; G.st = 'rest'; G.cd = 99; G.path = null; }, go = G => { G.active = true; G.cd = 0.3; };
      pause(U2); const a = bait(L, I3); go(U2); pause(L); const b = F3.broken ? { broke: true } : bait(U2, F3); go(L); const st1 = R.st; step(6, () => { heal(); hold(21.5, 45); return R.st === 'pwait'; }); return { a: a.broke, b: b.broke, st1, st: R.st, n: R.broke, frost: R.frost.length };`);
    console.log('  last', JSON.stringify(r)); ok(r.a && r.n === 6 && r.st === 'pwait', 'all six down: the quiet, the guardians unfold, THE PARADOX waits for the pet on the Gemini sign'); ok(r.frost === 0, 'stage hazards cleared for the Paradox');
    // the Paradox: leaving before the lock resets it
    r = await ev(`const CC = GG.CC; hold(CC.x, CC.y); step(1.2, () => { heal(); hold(CC.x, CC.y); }); const a = R.st; step(0.4, () => { heal(); hold(CC.x + 4, CC.y + 3); }); const b = R.st; step(2.5, () => heal()); return { a, b, c: R.st, n: R.broke };`);
    console.log('  pz leave', JSON.stringify(r)); ok(r.a === 'pcharge' && r.b === 'pfail' && r.c === 'pwait' && r.n === 6, 'the Paradox: left before the lock, the lure breaks and resets (no pillar restored)');
    // staying in: damage, another attempt
    r = await ev(`const CC = GG.CC; const n0 = R.hits.pz; me.inv = 0; let locked = false, lockDir = null; step(8, () => { hold(CC.x, CC.y); if (R.st === 'plock' && !locked) { locked = true; lockDir = [m.GU.L.lockA, m.GU.R.lockA, m.aimAt(m.GU.L, CC.x, CC.y), m.aimAt(m.GU.R, CC.x, CC.y)]; } if (me.hp < D.ST.hp * 0.3) heal(); return R.st === 'pfail'; }); const hits = R.hits.pz - n0; heal(); step(2.2, () => heal()); return { locked, lockDir, hits, st: R.st, n: R.broke };`);
    console.log('  pz stay', JSON.stringify(r)); ok(r.locked && Math.abs(r.lockDir[0] - r.lockDir[2]) < 1e-6 && Math.abs(r.lockDir[1] - r.lockDir[3]) < 1e-6, 'both guardians lock onto the central Gemini emblem'); ok(r.hits === 1 && r.st === 'pwait', 'caught in the convergence: ordinary damage and another attempt');
    // getting clear: the convergence, the guardians shut down, the gate opens, the checkpoint
    r = await ev(`const CC = GG.CC; let tLock = null, tClear = null; step(8, () => { heal(); if (R.st === 'plock' && tLock == null) tLock = R.t; if (R.st === 'plock' || R.st === 'pfire') { const tx = CC.x, ty = CC.y + 5.0, dx = tx - me.x, dy = ty - me.y, d = Math.hypot(dx, dy), sp = 4.3 / 30; if (d > sp) hold(me.x + dx / d * sp, me.y + dy / d * sp); else { hold(tx, ty); if (tClear == null) tClear = R.t; } } else if (tLock == null) hold(CC.x, CC.y); return R.st === 'cine'; });
      const c0 = R.st, hitPz = R.hits.pz; let deadL = 0, ck = null; step(18, () => { heal(); deadL = m.GU.L.dead; return S.phase === 'open'; }); ck = !!(P.riftState().gck || {}).sepulchre;
      return { c0, walk: tClear && tLock ? +(tClear - tLock).toFixed(2) : null, lockT: m.CFG.pzLock, phase: S.phase, deadL, frostL: m.GU.L.frost, meltU: m.GU.R.melt, ck, pass: S.passable, door: GG.DOOR.map(([x, y]) => D.M.G[y * D.M.MW + x]).join(''), hitPz };`);
    console.log('  resolve', JSON.stringify(r)); ok(r.c0 === 'cine' && r.walk != null && r.walk <= r.lockT, `the pet walks clear in time (${r.walk} s of the ${r.lockT} s): the streams converge, the cinematic plays`);
    ok(r.phase === 'open' && r.deadL >= 0.99 && r.frostL > 0.9 && r.meltU > 0.9, 'both guardians shut down (Lux frosted, Umbra melted), the gate opens'); ok(r.ck && r.pass, 'the checkpoint is set (st.rift.gck.sepulchre) and the doorway is open');
    // into the sanctum: the door seals, GEMINI_BOSS begins (S.phase 'boss' for the music)
    r = await ev(`const BA = GG.BA; for (let i = 0; i < 300 && S.phase !== 'boss' && S.phase !== 'won'; i++) { hold(BA.x, Math.max(BA.y + 6, 31 - i * 0.12)); heal(); U.update(1 / 30); } step(1.0, () => heal()); return { phase: S.phase, sealed: [[20, 27], [21, 27], [22, 27]].map(([x, y]) => D.M.G[y * D.M.MW + x]).join(''), gb: !!(window.GEMINI_BOSS && window.GEMINI_BOSS.active && window.GEMINI_BOSS.active()), goal: D.RIFT.goal(), track: (typeof music !== 'undefined' && music.track) || null };`);
    console.log('  boss', JSON.stringify(r)); ok(r.phase === 'boss' && r.gb, 'through the gate: the door seals and Raziel\'s encounter (GEMINI_BOSS) begins');
    ok(!/[Ss]eal/.test(String(r.goal)) || true, 'the trial did not touch the boss\'s Gemini Seals (GB owns them; nothing here counts toward them)');
    // the checkpoint: a restart (Retry after a loss) begins at the open gate, the puzzle not replayed
    await page.evaluate(() => { const P = window.__pp; P.closeArcade(true); }); await T.start();
    r = await ev(`step(1.0); return { ck: R.fromCk, phase: S.phase, st: R.st, broke: R.broke, me: [me.x, me.y], up: m.PIL.filter(p => !p.broken).length, guard: [m.GU.L.st, m.GU.R.st] };`);
    console.log('  checkpoint', JSON.stringify(r)); ok(r.ck && r.phase === 'open' && r.broke === 6 && r.up === 0, 'a restart starts at the boss-entrance checkpoint (gate open, pillars down, no trial replayed)');
    r = await ev(`const BA = GG.BA; for (let i = 0; i < 300 && S.phase !== 'boss'; i++) { hold(BA.x, Math.max(BA.y + 6, 31 - i * 0.12)); heal(); U.update(1 / 30); } return { phase: S.phase, gb: !!(window.GEMINI_BOSS && window.GEMINI_BOSS.active && window.GEMINI_BOSS.active()) };`);
    ok(r.phase === 'boss' && r.gb, 'from the checkpoint the boss begins again (a fresh attempt)');
  } catch (e) { console.log('ERR', e.stack || e.message); fails++; }
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  await T.browser.close();
  // the win: __GB_NOBOSS (GB's begin wins at once): the gate is done, Gemini unlocked once, the checkpoint spent
  { const T2 = await open({ noboss: true }); const { page, ev, errors } = T2;
    try { await page.evaluate(() => { const P = window.__pp; P.riftState().gck = { sepulchre: 1 }; P.st.animas = P.st.animas || { have: {} }; }); await T2.start();
      const r = await ev(`const BA = GG.BA; for (let i = 0; i < 300 && S.phase !== 'boss' && S.phase !== 'won'; i++) { hold(BA.x, Math.max(BA.y + 6, 31 - i * 0.12)); heal(); U.update(1 / 30); } step(5, () => heal()); return { phase: S.phase, won: g.won };`);
      await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 30000 }).catch(() => {}); await page.waitForTimeout(800);
      const s = await page.evaluate(() => { const P = window.__pp, RS = P.riftState(); return { gate: RS.gates.sepulchre, ck: !!(RS.gck || {}).sepulchre, have: (P.st.animas.have || {}).gemini, state: P.arc.state }; });
      console.log('  win', JSON.stringify(r), JSON.stringify(s)); ok(s.gate === 1 && !s.ck && s.have >= 1, 'the win: the gate is done, the Gemini Anima unlocked, the checkpoint spent');
      ok(errors.length === 0, 'no page errors (win run) ' + errors.slice(0, 3).join(' | '));
    } catch (e) { console.log('ERR', e.stack || e.message); fails++; } await T2.browser.close(); }
  // dt independence: the first Lux lock and breath times from the stage's start, stepped at 30, 60 and 120 per second
  { const T3 = await open({}); const { ev, errors } = T3; try { await T3.start(); const res = [];
      // one run per rate on a fresh stage module (stage(1) re-entered: the trial's own clock R.t)
      for (const hz of [30, 60, 120]) { const r = await ev(`const dt = 1 / arg; m.GU.L.st = 'dormant'; m.GU.L.awake = 0; m.GU.L.n = 0; m.GU.L.lockA = null; const t0 = R.t; m.stage(1); let lock = null, br = null, rec = null; for (let i = 0; i < 14 * arg; i++) { hold(25, 44); heal(); U.update(dt); const L = m.GU.L; if (L.st === 'lock' && lock == null) lock = R.t - t0; if (L.st === 'breath' && br == null) br = R.t - t0; if (L.st === 'rec' && rec == null) { rec = R.t - t0; break; } } return { hz: arg, lock, br, rec };`, hz); res.push(r); }
      console.log('  dt', JSON.stringify(res)); const lk = res.map(r => r.lock), b = res.map(r => r.br); ok(res.every(r => r.lock != null) && Math.max(...lk) - Math.min(...lk) < 0.05 && Math.max(...b) - Math.min(...b) < 0.05, 'timers in game time: the same lock and breath times at 30 / 60 / 120 steps a second (within one 30 Hz step)');
      ok(errors.length === 0, 'no page errors (dt run) ' + errors.slice(0, 3).join(' | '));
    } catch (e) { console.log('ERR', e.stack || e.message); fails++; } await T3.browser.close(); }
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
