// Kharrox the Bellback (Belfry boss 1, worker B3, v391): the fight loads (2D fallback and GPU), its bars and health, both
// attacks fire with their telegraphs (2.5-3 s, the bright boundary, a countdown, a symbol), the safe side and the opening
// really protect, at 50% two brine crawlers come and the ring repeats, a level-10 bot that reads the telegraphs and uses
// its skills wins in about the target time (~90 s), the fall shatters the bell (BREAK_FX) and wins the stage, 0 page errors.
// usage: HTML=test-belB3.html node tests/_bel-b3-kharrox.js     env: GL=0 (2D only), TESTRIFT=1, MAXT=240, SKIP_BOT=1
const { openBel } = require('./_bel-b3-lib');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s, x === undefined ? '' : JSON.stringify(x)); if (!c) fails++; };
// the bot, in the page: steps the game's own update (no drawing); reads Kharrox's warnings and acts as a player would
const BOT = `const T = DEF.BELK.test, TM = DEF.TM, X = D.X, dt = 0.05;
  const go = (x, y) => { const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); if (d < 0.08) return; const v = Math.min(d, 4.4 * dt); X.moveEnt(me, dx / d * v, dy / d * v); };
  const tapAt = q => { const d = Math.hypot(q.x - me.x, q.y - me.y) || 1; D.g.tapAim = { t: q, x: (q.x - me.x) / d, y: (q.y - me.y) / d, a: Math.atan2(q.y - me.y, q.x - me.x), tap: true }; D.g.tapBuf = 0.3; };
  const plan = () => { const A = M.A, ring = FX.S.hz.find(z => z.kind === 'belkRing');
    if (ring) { const d = Math.hypot(me.x - ring.x, me.y - ring.y); if (ring.r < d + 1.6 && ring.r > d - 1.2 || ring.r < d) { const a = Math.atan2(me.y - ring.y, me.x - ring.x), da = Math.atan2(Math.sin(ring.ga - a), Math.cos(ring.ga - a)); if (Math.abs(da) > TM.gap * 0.6) { const dd = Math.max(3.4, d); return { x: ring.x + Math.cos(ring.ga) * dd, y: ring.y + Math.sin(ring.ga) * dd }; } return null; } }
    if (A && A.kind === 'toll' && A.phase === 'wind' && A.ga != null && !T.inGap(A, me.x, me.y)) return T.gapSpot(FX, A, me);
    if (A && A.kind === 'sweep' && (A.phase === 'wind' || A.phase === 'strike') && A.tele && !T.inSafe(FX, A, b, me.x, me.y)) return T.safeSpot(FX, b, A);
    return 'fight'; };`;
(async () => {
  const GL = process.env.GL !== '0';
  const T = await openBel({ gl: false }); const { page, errors, ev } = T;   // (the fight runs on the fast path; the GPU is checked on its own below)
  await T.start();
  // ---- 1. it loads: the GPU path (or the 2D fallback), the bars, the health ----
  await ev(`const go = clock(5); while (go() && (b.act === 'enter')) await frame();`);
  const info = await ev(`return { rift: window.__BELRIFT, n: D.F.n, bars: D.F.fiend.bars, barHP: Math.round(D.FD.barHP), hp: Math.round(b.maxhp), dmg: +b.dmg.toFixed(2), amp: +M.amp.toFixed(4), petHp: D.ST.hp, atk: D.ST.atk, lvl: D.ST.L, gl: DEF.MODEL.__dbg.gl, act: b.act, deco: M.deco.length, props: FX.S.props.length };`);
  console.log('setup', JSON.stringify(info));
  ok(info.bars === 6, 'six bars (the 6/7/9 convention)', info.bars);
  ok(info.hp > 0 && Math.abs(info.hp / info.barHP - 6) < 0.05, 'its health is six whole bars', [info.hp, info.barHP]);
  ok(info.gl === false, 'without the GPU: the existing 2D Kharrox (DunBoss kharrox) draws', info.gl);
  if (GL) { const g = await ev(`window.__BELK_GL = 1; window.__NG_GL = 1; const f0 = DEF.MODEL.__dbg.glStats.frames || 0; await frame(); await frame(); await frame(); const s = DEF.MODEL.__dbg.glStats; window.__BELK_GL = 0; window.__NG_GL = 0; return { on: DEF.MODEL.__dbg.gl || s.frames > f0, frames: s.frames - f0, tris: s.meshTris, failed: s.failed, lost: s.lost };`);
    ok(g.frames >= 2 && !g.failed && !g.lost && g.tris > 10000, 'on the GPU: the GLM model renders (meshes built, frames drawn)', g); }
  ok(info.deco >= 10 && info.props >= 4, 'the arena: four pillars and the breakable dressing', [info.props, info.deco]);
  const rise = await ev(`const go = clock(14); while (go() && b.act !== 'fight') await frame(); return { act: b.act, y: +(b.y - FX.C.y).toFixed(1), st: DEF.MODEL.__dbg.glStats };`);
  ok(rise.act === 'fight', 'it comes up out of the water onto the floor', rise);
  // ---- 2. Bell Sweep: the tell (claw up 2.5 s, the cone, SAFE behind the small claw); the safe side protects, the front is hit ----
  const sweep = await ev(`D.st && 0; DEF.force(FX, 'sweep'); me.x = b.x; me.y = b.y + 4.0; let tele = null, warn = null, lift = 0; const go = clock(3.2); while (go() && !(M.A && M.A.tele)) await frame();
    const A = M.A; tele = A && A.tele; warn = FX.S.hz.find(z => z.kind === 'belkSweepWarn'); const t0 = D.g.t; let hp0 = me.hp, hurt = 0;
    // stand behind the small claw once it locks
    const go2 = clock(4.5); while (go2() && M.A === A && A.phase !== 'rec') { await frame(); lift = Math.max(lift, M.P.lift); if (A.locked) { const s = DEF.BELK.test.safeSpot(FX, b, A); me.x = s.x; me.y = s.y; } me.vx = me.vy = 0; if (me.hp < hp0) hurt += hp0 - me.hp; hp0 = me.hp; }
    return { tele: !!tele, shape: tele && tele.shape, spread: tele && +(tele.spread * 2 * 180 / Math.PI).toFixed(0), t: tele && +tele.t.toFixed(2), warn: !!warn, lift: +lift.toFixed(2), took: +(D.g.t - t0).toFixed(2), hurt, safe: M.stat.sweepSafe, hit: M.stat.sweepHit, exposed: A.exposed, phase: A.phase };`);
  console.log('sweep', JSON.stringify(sweep));
  ok(sweep.tele && sweep.shape === 'cone' && sweep.spread === 120, 'Bell Sweep: a 120-degree frontal cone', sweep);
  ok(sweep.t >= 2.5 && sweep.t <= 3 && sweep.warn && sweep.lift > 0.9, 'its tell: the big claw raised 2.5-3 s, with the marked warning', [sweep.t, sweep.lift]);
  ok(sweep.safe >= 1 && sweep.hurt === 0, 'behind the small claw is safe', [sweep.safe, sweep.hurt]);
  ok(sweep.phase === 'rec' && sweep.exposed, 'a recovery after, its eye out (a weak point)', sweep.phase);
  const sweepHit = await ev(`DEF.force(FX, 'sweep'); const go = clock(4); let hp0 = me.hp, hurt = 0; const A0 = () => M.A; while (go() && !(M.A && M.A.phase === 'rec')) { await frame(); const A = M.A; if (A && A.tele) { me.x = b.x + Math.cos(A.a) * 3.2; me.y = b.y + Math.sin(A.a) * 3.2; me.vx = me.vy = 0; } if (me.hp < hp0) hurt += hp0 - me.hp; hp0 = me.hp; } me.hp = D.ST.hp; return { hit: M.stat.sweepHit, hurt: Math.round(hurt), petHp: D.ST.hp };`);
  ok(sweepHit.hit >= 1 && sweepHit.hurt > 0, 'standing in front of it, the sweep lands', sweepHit);
  // ---- 3. Tolling Shell: the bands ring 2.8 s; a widening ring with one opening; the opening protects, the rest is hit ----
  const toll = await ev(`DEF.force(FX, 'toll'); let warn = null, tg = 0, toll = 0; const t0 = D.g.t; const go = clock(4); let ring = null;
    while (go() && !(ring = FX.S.hz.find(z => z.kind === 'belkRing'))) { await frame(); warn = warn || FX.S.hz.find(z => z.kind === 'belkTollWarn'); tg = Math.max(tg, M.P.tollGlow); toll = Math.max(toll, M.P.toll); const A = M.A; if (A && A.ga != null) { const s = DEF.BELK.test.gapSpot(FX, A, me); me.x = s.x; me.y = s.y; me.vx = me.vy = 0; } }
    const took = D.g.t - t0; let hp0 = me.hp, hurt = 0; const go2 = clock(3); while (go2() && FX.S.hz.includes(ring)) { await frame(); me.vx = me.vy = 0; if (me.hp < hp0) hurt += hp0 - me.hp; hp0 = me.hp; }
    return { warn: !!warn, ring: !!ring, took: +took.toFixed(2), tg: +tg.toFixed(2), toll: +toll.toFixed(2), gap: M.stat.ringGap, hurt, hits: M.stat.ringHit };`);
  console.log('toll', JSON.stringify(toll));
  ok(toll.warn && toll.ring && toll.took >= 2.5 && toll.took <= 3.1, 'Tolling Shell: a 2.5-3 s marked tell, then the ring', toll);
  ok(toll.tg > 1 && toll.toll > 0.8, 'its bands shiver and light before the ring', [toll.toll, toll.tg]);
  ok(toll.gap >= 1 && toll.hurt === 0, 'walking through the opening is safe', [toll.gap, toll.hurt]);
  const tollHit = await ev(`DEF.force(FX, 'toll'); const go = clock(6); let hp0 = me.hp, hurt = 0, seen = false; while (go()) { await frame(); const A = M.A; if (A && A.ga != null) { const a = A.ga + Math.PI; me.x = A.x + Math.cos(a) * 5; me.y = A.y + Math.sin(a) * 5; me.vx = me.vy = 0; } if (me.hp < hp0) hurt += hp0 - me.hp; hp0 = me.hp; if (FX.S.hz.some(z => z.kind === 'belkRing')) seen = true; else if (seen) break; } me.hp = D.ST.hp; return { hits: M.stat.ringHit, hurt: Math.round(hurt) };`);
  ok(tollHit.hits >= 1 && tollHit.hurt > 0, 'away from the opening, the ring lands', tollHit);
  // ---- 4. 50%: two brine crawlers out of the water, then the ring again ----
  const brood = await ev(`b.hp = b.maxhp * 0.49; const go = clock(9); let sawBrood = false, tollAfter = false; while (go()) { await frame(); me.hp = D.ST.hp; if (M.A && M.A.kind === 'brood') sawBrood = true; if (sawBrood && M.A && M.A.kind === 'toll') { tollAfter = true; break; } }
    const adds = D.mons.filter(q => !q.dead && q.belkAdd); return { phase: FX.S.phase, sawBrood, tollAfter, addHp: adds.map(q => Math.round(q.maxhp)), addDmg: adds.map(q => +q.dmg.toFixed(1)), adds: adds.length, types: adds.map(q => q.type), stat: M.stat.adds };`);
  console.log('brood', JSON.stringify(brood));
  ok(brood.phase === 2 && brood.sawBrood && brood.adds === 2 && brood.types.every(t => t === 'crawler'), 'at 50%: two brine crawlers', brood);
  ok(brood.tollAfter, 'then the ring comes again', brood.tollAfter);
  await ev(`for (const q of D.mons) if (q.belkAdd && !q.dead) D.hitMon(q, 1e9, { flat: true }); const go = clock(3); while (go()) await frame();`);
  // ---- 5. reachable: the pet's own attacks land from melee range and from range ----
  const reach = await ev(`const h0 = b.hp; me.x = b.x + 2.6; me.y = b.y + 0.4; let go = clock(2.5); while (go()) { await frame(); me.hp = D.ST.hp; const d = Math.hypot(b.x - me.x, b.y - me.y) || 1; D.g.tapAim = { t: b, x: (b.x - me.x) / d, y: (b.y - me.y) / d, a: Math.atan2(b.y - me.y, b.x - me.x), tap: true }; D.g.tapBuf = 0.3; }
    const near = h0 - b.hp, h1 = b.hp; me.x = b.x; me.y = b.y + 6.5; go = clock(2.5); while (go()) { await frame(); me.hp = D.ST.hp; const d = Math.hypot(b.x - me.x, b.y - me.y) || 1; D.g.tapAim = { t: b, x: (b.x - me.x) / d, y: (b.y - me.y) / d, a: Math.atan2(b.y - me.y, b.x - me.x), tap: true }; D.g.tapBuf = 0.3; try { D.useStrong(); } catch (e) {} }
    return { near: Math.round(near), far: Math.round(h1 - b.hp), parts: Object.keys(FX.S.partsMap || {}).filter(k => FX.S.partsMap[k]) };`);
  ok(reach.near > 0 && reach.far > 0 && reach.parts.length >= 3, 'reachable: blows land up close and from range; hit proxies on the bell, the body and the claw', reach);
  // ---- 6. the bot: a level-10 pet from full health, skills, reading every warning ----
  if (!process.env.SKIP_BOT) {
    const bot = await ev(BOT + `b.hp = b.maxhp; M.lastHp = b.hp; M.brood = false; FX.S.phase = 1; b.phase = 1; FX.S.lv = 1; DEF.BELK.test.endAct(FX, b, true); for (const k in M.stat) if (typeof M.stat[k] === 'number') M.stat[k] = 0; M.stat.dmg = {};
      me.x = b.x; me.y = b.y + 4; me.hp = D.ST.hp; let t = 0, hurt = 0, src = {}, hp0 = me.hp, saves = 0, dealt = 0, hpPrev = b.hp, react = 0, tgt = null; const MAXT = arg.maxT;
      while (t < MAXT && !b.dead) { U.update(dt); t += dt; if (b.hp < hpPrev) dealt += hpPrev - b.hp; hpPrev = b.hp;
        if (me.hp < hp0) { hurt += hp0 - me.hp; const k = D.mons.some(q => q.belkAdd && !q.dead) ? 'adds' : M.A ? M.A.kind + ':' + M.A.phase : 'idle'; src[k] = Math.round((src[k] || 0) + hp0 - me.hp); } if (me.dead || me.hp < D.ST.hp * 0.2) { saves++; me.dead = false; me.hp = D.ST.hp; } hp0 = me.hp;
        react -= dt; if (react <= 0) { react = 0.12; tgt = plan(); }
        if (tgt && tgt !== 'fight') go(tgt.x, tgt.y);
        else { const add = D.mons.find(q => q.belkAdd && !q.dead && Math.hypot(q.x - me.x, q.y - me.y) < 5); const foe = add || b, d = Math.hypot(foe.x - me.x, foe.y - me.y), want = add ? 1.2 : 3.0; if (d > want + 0.5) go(foe.x + (me.x - foe.x) / d * want, foe.y + (me.y - foe.y) / d * want); else if (d < want - 0.6) go(foe.x + (me.x - foe.x) / d * want, foe.y + (me.y - foe.y) / d * want); }
        const weak = FX.S.weak && FX.S.weak.eye && !FX.S.weak.eye.dead ? FX.S.weak.eye : null, add2 = D.mons.find(q => q.belkAdd && !q.dead && Math.hypot(q.x - me.x, q.y - me.y) < 3);
        tapAt(add2 || weak || b); try { D.useStrong(); } catch (e) {} try { D.useUlt(); } catch (e) {} }
      return { dead: b.dead, t: +t.toFixed(1), dealt: Math.round(dealt), hurt: Math.round(hurt), petHp: D.ST.hp, saves, src, hurtPerMin: +(hurt / Math.max(1, t) * 60).toFixed(1), stat: M.stat, phase2At: M.stat.phase2At };`, { maxT: +(process.env.MAXT || 240) });
    const s = bot.stat; delete bot.stat; console.log('bot', JSON.stringify(bot)); console.log('stat', JSON.stringify(s));
    ok(bot.dead, `a level-10 bot wins in ${bot.t} s of game time (target ~90 s)`, bot.t);
    ok(bot.t >= 60 && bot.t <= 135, 'in roughly the target time (60-135 s)', bot.t);
    ok(s.sweeps >= 2 && s.tolls >= 2 && s.adds === 2, 'both attacks and the add wave came', [s.sweeps, s.tolls, s.adds]);
    ok(bot.saves <= 2, 'a careful pet survives it (at most two near-deaths topped up)', bot.saves);
  } else await ev(`D.hitMon(b, 1e12, { flat: true, pierce: true });`);
  // ---- 7. the fall: the bell shatters (BREAK_FX), the stage is won ----
  if (!(await ev(`return b.dead;`))) await ev(`D.hitMon(b, 1e12, { flat: true, pierce: true });`);
  const fall = await ev(`const bf = self.BREAK_FX || (typeof BREAK_FX !== 'undefined' ? BREAK_FX : null); let maxSh = 0; for (let i = 0; i < 80; i++) { U.update(0.05); maxSh = Math.max(maxSh, M.P.shatter || 0); } await frame();
    return { end: !!M.end, shatter: +maxSh.toFixed(2), dead: +M.P.dead.toFixed(2), won: D.g.won, fx: bf && bf.stats ? bf.stats() : null, corpse: FX.S.props.some(p => p.kind === 'corpse'), hz: FX.S.hz.filter(z => z.belk).length };`);
  console.log('fall', JSON.stringify(fall));
  ok(fall.end && fall.shatter > 0.8 && fall.dead > 0.9, 'its fall: the bell breaks, the body settles', fall);
  ok(fall.won && fall.hz === 0, 'the stage is won, its hazards cleared', [fall.won, fall.hz]);
  const end = await ev(`const go = clock(9); while (go() && window.__pp.arc.state === 'play') await frame(); return window.__pp.arc.state;`);
  ok(end === 'end', 'the rift moves on (the stage ends)', end);
  ok(errors.length === 0, 'no page errors', errors.slice(0, 5));
  console.log(fails ? `${fails} FAILED` : 'all ok');
  await T.browser.close(); process.exit(fails ? 1 : 0);
})();
