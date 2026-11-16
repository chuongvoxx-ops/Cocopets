// Rift 0 (v390 M): the corrupted Cocopet at each dungeon's gate and the pack leaders, stages 0, 3 and 6.
// Checks: the mini boss stands by the gate (and is the far room's only guardian: no champion), every pack has exactly one
// leader at half the mini boss's health and blows, the gate stays sealed with the floor cleared until the mini boss falls,
// its fall opens the gate (and plays: the burst), an arrival-level bot beats it in about the target time with skills (and
// with plain attacks and dodging only), the tears bring a leader every other pour, no page errors.
// HTML=test-calM.html node tests/_cal-m-bosses.js [stage ...]     env: PLAIN=0 skips the plain-attack run
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
const LV = { 0: 2, 3: 7, 6: 10 };
(async () => {
  const T = await open({ lvl: 2 }); const { page, start, errors } = T;
  const only = process.argv.slice(2).map(Number), stages = only.length ? only : [0, 3, 6];
  // the bot, in the page: steps the game's own update (no drawing); keeps 2.5-3.5 tiles off, strikes, steps out of
  // marked attacks (and rolls when one is about to land on it), sidesteps shots; skills: Strong and Ult when ready
  const fight = (skills, secs) => page.evaluate(([skills, secs]) => { const P = window.__pp, D = P.arc.game._dbg, U = P.arc.game, me = D.me, G = D.RIFT.self.amb.C.guard, b = G.m, X = D.X;
    let t = 0, hurt = 0, hp0 = me.hp, saves = 0, react = 0, dmgDone = 0, hpPrev = b.hp; const dt = 0.05;
    const tapAt = q => { const d = Math.hypot(q.x - me.x, q.y - me.y) || 1; D.g.tapAim = { t: q, x: (q.x - me.x) / d, y: (q.y - me.y) / d, a: Math.atan2(q.y - me.y, q.x - me.x) }; D.g.tapBuf = 0.3; };
    const go = (x, y) => { const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); if (d < 0.08) return; const v = Math.min(d, 4.2 * dt * 2); X.moveEnt(me, dx / d * v, dy / d * v); };
    const inWarn = () => { for (const z of D.zones) { if (z.kind !== 'warn' || z.own === 'pet' || z.src !== b) continue; const zx = z.follow ? z.follow.x : z.x, zy = z.follow ? z.follow.y : z.y;
      if (z.shape === 'line') { const rx = me.x - zx, ry = me.y - zy, al = rx * Math.cos(z.a) + ry * Math.sin(z.a), of = Math.abs(-rx * Math.sin(z.a) + ry * Math.cos(z.a)); if (al > -0.6 && al < z.len + 0.6 && of < z.w / 2 + me.r + 0.3) return z; }
      else if (z.shape === 'cone') { const d = Math.hypot(me.x - zx, me.y - zy); let da = Math.atan2(me.y - zy, me.x - zx) - z.a; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; if (d < z.len + 0.6 && Math.abs(da) < z.spread + 0.35) return z; }
      else if (Math.hypot(me.x - zx, me.y - zy) < z.r + me.r + 0.35) return z; } return null; };
    const away = z => { const zx = z.follow ? z.follow.x : z.x, zy = z.follow ? z.follow.y : z.y; if (z.shape === 'line') { const nx = -Math.sin(z.a), ny = Math.cos(z.a), sd = ((me.x - zx) * nx + (me.y - zy) * ny) >= 0 ? 1 : -1; return [me.x + nx * sd * 2.6, me.y + ny * sd * 2.6]; }
      if (z.shape === 'cone') { const a = z.a + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1); return [zx + Math.cos(a) * 3.2, zy + Math.sin(a) * 3.2]; }
      const dx = me.x - zx, dy = me.y - zy, d = Math.hypot(dx, dy) || 1; return [zx + dx / d * (z.r + 1.4), zy + dy / d * (z.r + 1.4)]; };
    let plan = null;
    while (t < secs && !b.dead) { U.update(dt); t += dt;
      if (b.hp < hpPrev) dmgDone += hpPrev - b.hp; hpPrev = b.hp;
      if (me.hp < hp0) hurt += hp0 - me.hp; if (me.dead || me.hp < D.ST.hp * 0.15) { saves++; me.dead = false; me.hp = D.ST.hp; }   // (a near knock-out: under 15%, healed and counted; a real one would end the run) hp0 = me.hp; if (!skills) me.mp = Math.min(me.mp, 0);
      react -= dt; if (react > 0) { if (plan) go(plan[0], plan[1]); continue; } react = 0.1; plan = null;
      const z = inWarn(); if (z) { const left = z.life; if (left < 0.22 && !me.dodge && D.g.dodgeCd <= 0) D.dodge(); plan = away(z); go(plan[0], plan[1]); continue; }
      const sh = D.eshots.find(e => e.src === b && Math.hypot(e.x - me.x, e.y - me.y) < 1.6 && ((me.x - e.x) * e.vx + (me.y - e.y) * e.vy) > 0); if (sh) { const a = Math.atan2(sh.vy, sh.vx) + Math.PI / 2; plan = [me.x + Math.cos(a) * 1.5, me.y + Math.sin(a) * 1.5]; go(plan[0], plan[1]); continue; }
      const d = Math.hypot(b.x - me.x, b.y - me.y); if (d > 3.6) { plan = [b.x + (me.x - b.x) / d * 3, b.y + (me.y - b.y) / d * 3]; go(plan[0], plan[1]); } else if (d < 2.2) { plan = [b.x + (me.x - b.x) / d * 3, b.y + (me.y - b.y) / d * 3]; go(plan[0], plan[1]); }
      tapAt(b); if (skills) { try { D.useStrong(); } catch (e) {} try { D.useUlt(); } catch (e) {} } }
    return { t: +t.toFixed(1), dead: b.dead, hpLeft: Math.round(b.hp), dmgDone: Math.round(dmgDone), dps: +(dmgDone / Math.max(1, t)).toFixed(1), hurt: Math.round(hurt), petHp: D.ST.hp, atk: D.ST.atk, saves, acts: b.calMini.acts, phase: b.phase }; }, [skills, secs]);
  for (const st of stages) {
    const lv = LV[st]; console.log(`--- stage ${st} at level ${lv}`);
    const setup = async () => { await page.evaluate(lv => { const P = window.__pp; P.st.dlv = lv; for (const p of P.partyPets()) { p.dlv = lv; p.dxp = 0; } P.st.dun.god = false; }, lv); await start('caldera', st);
      await page.evaluate(() => { const U = window.__pp.arc.game; for (let i = 0; i < 20; i++) U.update(0.05); }); };
    await setup();
    const a = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.RIFT.self.amb.C, G = C.guard, m = G && G.m, ex = D.RIFT.exit; if (!m) return null;
      const all = D.mons.filter(q => !q.dead).concat(D.g.reserve || []), packs = {}; for (const q of all) { if (q.boss || q.calTear) continue; const p = q.pack; if (p == null || p < 0 || (p >= 1000 && p < 1400) || p >= 1900) continue; (packs[p] = packs[p] || []).push(q); }
      const counts = Object.values(packs).map(l => l.filter(q => q.calLeader).length), L = all.filter(q => q.calLeader);
      return { name: m.bname, species: m.evil.species, hp: m.maxhp, dmg: m.dmg, toGate: +Math.hypot(m.x - ex.x, m.y - ex.y).toFixed(2), aggro: m.aggro, champs: all.filter(q => q.pack === 1777).length, guardians: D.mons.filter(q => q.boss && !q.dead).length,
        packs: counts.length, oneEach: counts.every(n => n === 1), leaders: L.length, lhp: [...new Set(L.map(q => Math.round(q.maxhp)))], ldmg: [...new Set(L.map(q => +q.dmg.toFixed(2)))], ltypes: [...new Set(L.map(q => q.type))].join(','), goal: document.getElementById('arcGoal').textContent }; });
    console.log(JSON.stringify(a));
    ok(a && a.toGate < 4.6 && !a.aggro, `the mini boss (${a && a.name}, a corrupted ${a && a.species}) waits by the gate`, a && a.toGate);
    ok(a && a.champs === 0 && a.guardians === 1, 'no champion: the mini boss is the only guardian', a && { champs: a.champs, guardians: a.guardians });
    ok(a && a.oneEach && a.packs >= 10, `every pack has exactly one leader (${a && a.packs} packs)`, a && a.ltypes);
    ok(a && a.lhp.length === 1 && Math.abs(a.lhp[0] - a.hp / 2) < 2 && a.ldmg.length === 1 && Math.abs(a.ldmg[0] - a.dmg / 2) < 0.01, 'leaders: half its health and half its blows', a && { hp: a.hp, lhp: a.lhp, dmg: a.dmg, ldmg: a.ldmg });
    ok(a && /Defeat .* to open the gate/.test(a.goal), 'the goal names the guardian', a && a.goal);
    // the floor cleared, the guardian alive: the gate stays sealed
    const s = await page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg, U = P.arc.game; for (const m of (D.g.reserve || [])) m.dead = true; D.g.reserve.length = 0; for (const m of D.mons) if (!m.dead && !m.boss) D.hitMon(m, 1e9, { flat: true }); for (let i = 0; i < 40; i++) U.update(0.05); return { done: D.RIFT.done, goal: document.getElementById('arcGoal').textContent, left: D.mons.filter(m => !m.dead && !m.boss).length }; });
    ok(!s.done && s.left === 0 && /Defeat/.test(s.goal), 'floor clear but the guardian stands: the gate stays sealed', s);
    // the fight, with skills, from just outside its reach
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, G = D.RIFT.self.amb.C.guard, X = D.RIFT.self.amb.C.X; let best = null; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, p = X.walkPoint(G.home.x + Math.cos(a) * 5, G.home.y + Math.sin(a) * 5, null); if (p && Math.hypot(p.x - G.home.x, p.y - G.home.y) > 3.5 && D.X.los(p.x, p.y, G.home.x, G.home.y)) { best = p; break; } } best = best || X.walkPoint(G.home.x, G.home.y + 4, null); D.me.x = best.x; D.me.y = best.y; D.me.hp = D.ST.hp; D.me.mp = 0; });
    const f = await fight(true, 180); console.log('skills', JSON.stringify(f));
    ok(f.dead && f.t >= 30 && f.t <= 95, `with skills at level ${lv}: it falls in about 45-75 s (the pet's random kit moves it: 30-95 s accepted)`, { t: f.t, dps: f.dps, saves: f.saves, hurt: f.hurt, petHp: f.petHp });
    ok(f.acts && Object.keys(f.acts).length >= 3, 'it used its lunge, its ranged move and its signature', f.acts);
    // its fall: the burst plays and the gate opens
    const fa = await page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg, U = P.arc.game, G = D.RIFT.self.amb.C.guard; for (const m of D.mons) if (!m.dead && !m.boss) D.hitMon(m, 1e9, { flat: true }); for (let i = 0; i < 50; i++) U.update(0.05); return { fall: !!G.fall, burst: !!(G.fall && G.fall.burst), done: D.RIFT.done, goal: document.getElementById('arcGoal').textContent, banners: D.banners.map(b => b.s) }; });
    ok(fa.fall && fa.burst && fa.done, 'its fall plays (the burst) and opens the gate', fa);
    // the tears: a leader every other pour
    if (st === stages[0]) { const tr = await page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg, U = P.arc.game, C = D.RIFT.self.amb.C, ex = D.RIFT.exit; D.me.x = ex.x; D.me.y = ex.y + 2.5; const hold = [D.me.x, D.me.y]; D.RIFT.self.done = true;
        let t = 0; while (t < 40 && !(C.guard.tearLeaders >= 1)) { U.update(0.05); t += 0.05; D.me.x = hold[0]; D.me.y = hold[1]; D.me.hp = D.ST.hp; if (D.g.won) break; for (const q of C.tearMons) if (!q.dead && !q.calLeader) D.hitMon(q, 1e9, { flat: true }); } return { t: +t.toFixed(1), tears: C.tears.length, pours: C.tears.map(q => q.n), spawned: C.tearSpawned || 0, tearLeaders: C.guard.tearLeaders || 0 }; });
      ok(tr.tearLeaders >= 1 && tr.tearLeaders <= Math.ceil(tr.pours.reduce((s2, n) => s2 + n, 0) / 2), 'the tears bring a leader every other pour', tr); }
    // the API for other rifts: a water guardian anywhere, with a leader
    if (st === stages[0]) { const api = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, X = D.RIFT.self.amb.C.X, E = self.EVIL_MINI; if (!E) return null; const p = X.walkPoint(D.M.start.x + 2, D.M.start.y, null);
        const m = E.spawn(X, { x: p.x, y: p.y, seed: 7, el: 'water', lvl: 12, name: 'Brineclaw the Drowned', palette: { tint: '#123048' } }); const L = E.leader(X, X.spawnMon('cinderslug', p.x + 1.5, p.y, { rift: true, pack: 2500 }), { of: m });
        const ly = E.layer(X); const U = window.__pp.arc.game; for (let i = 0; i < 10; i++) { U.update(0.05); ly.update(0.05); }
        const r = { el: m.calMini.def.el, hp: m.maxhp, want: E.hpFor(12), dmg: m.dmg, volley: m.calMini.def.volley, sig: m.calMini.def.sig, lhp: L ? L.maxhp : null, guards: E.guards(X).length }; D.hitMon(m, 1e9, { flat: true }); for (let i = 0; i < 40; i++) { U.update(0.05); ly.update(0.05); } r.fell = !!E.guards(X).find(G => G.m === m).fall; return r; });
      ok(api && api.el === 'water' && api.hp === api.want && api.lhp === Math.round(api.hp / 2) && api.fell, 'EVIL_MINI.spawn / leader / layer: a water guardian with a leader, and its fall', api); }
    // with plain attacks and dodging only
    if (process.env.PLAIN !== '0') { await setup(); await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of (D.g.reserve || [])) m.dead = true; D.g.reserve.length = 0; for (const m of D.mons) if (!m.dead && !m.boss) D.hitMon(m, 1e9, { flat: true }); const G = D.RIFT.self.amb.C.guard, X = D.RIFT.self.amb.C.X, p = X.walkPoint(G.home.x, G.home.y + 4.5, null); D.me.x = p.x; D.me.y = p.y; D.me.hp = D.ST.hp; D.me.mp = 0; });
      const p = await fight(false, 300); console.log('plain', JSON.stringify(p));
      ok(p.dead && p.saves <= 1, `plain attacks and dodging beat it (at most one near knock-out) in ${p.t} s`, { t: p.t, saves: p.saves, hurt: p.hurt, petHp: p.petHp }); }
  }
  const er = errors.filter(e => !/ERR_(TUNNEL|FILE_NOT|NAME)/.test(e)); ok(er.length === 0, 'no page errors', er.slice(0, 4));
  console.log(bad ? 'FAILED ' + bad : 'all passed'); await T.browser.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
