// Fire Flan, the whole fight played by a scripted level-1 starter that uses the mechanics (no god mode): it lures the flan
// into a cooling zone by standing on that well's plate, wakes the crystal (standing still 0.75 s), strikes the brittle
// flan, breaks Crystal Breaker / Crystal Rush wind-ups on their glowing point, swats Cinderlings off the crystal, steps out
// of marked slams, sweeps and spit landings, and takes the Pressure Burst's safe gap. Reports the fight's length, its phases,
// brittle windows, the share of damage done brittle, crystals broken and the damage the pet took. Runs the game's logic
// directly (GL off, no drawing between steps): HTML=test-calF.html node tests/_cal-f-fight.js   env: RUNS=n, NOMECH=1 (only
// plain attacks: the hard-lock check), SKILL=0.5..1 (how quickly the bot reacts)
process.env.HTML = process.env.HTML || 'test-calF.html';
const L = require('./_cal-f-lib');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
(async () => {
  const T = await L.open({ gl: false });
  const { page, errors, ev } = T;
  const runs = +(process.env.RUNS || 1), out = [];
  for (let run = 0; run < runs; run++) {
    await page.evaluate(() => { for (const p of window.__pp.partyPets()) { p.dlv = 1; p.dxp = 0; } });
    await T.startFlan(); await T.wake();
    const r = await ev(`const nomech = arg[0], skill = arg[1], C = D.FD.S.C; let t = 0, hurt = 0, hp0 = me.hp, deaths = 0, phT = [0, 0, 0], dmgB = 0, dmgA = 0, hpPrev = b.hp, uses = 0, lastAct = null, acts = {}, fieldsT = 0;
      const tapAt = tgt => { if (!tgt) return; const d = Math.hypot(tgt.x - me.x, tgt.y - me.y) || 1; D.g.tapAim = { t: tgt, x: (tgt.x - me.x) / d, y: (tgt.y - me.y) / d, a: Math.atan2(tgt.y - me.y, tgt.x - me.x) }; D.g.tapBuf = 0.3; };
      const SPD = 4.2;
      const go = (x, y, dt) => { const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); if (d < 0.08) { me.vx = me.vy = 0; return true; } const v = Math.min(d, SPD * dt); D.X ? 0 : 0; me.x += dx / d * v; me.y += dy / d * v; me.vx = dx / d * SPD; me.vy = dy / d * SPD; const q = D.FD.FX.clampArena({ x: me.x, y: me.y }, 1.2); me.x = q.x; me.y = q.y; return false; };
      const inTele = () => { for (const s of D.FD.S.tele) { if (s.done) continue; if (D.FD.FX.inShape(s, me.x, me.y, me.r + 0.25)) return s; } for (const z of D.FD.S.hz) if (z.dps && D.FD.FX.inShape(z, me.x, me.y, me.r)) return z; return null; };
      const away = s => { if (s.shape === 'circle' || !s.shape) { const dx = me.x - s.x, dy = me.y - s.y, d = Math.hypot(dx, dy) || 1; return [s.x + dx / d * ((s.r || 1) + 1.2), s.y + dy / d * ((s.r || 1) + 1.2)]; }
        if (s.shape === 'cone') { const a = s.a + Math.PI; return [b.x + Math.cos(a) * 2.8, b.y + Math.sin(a) * 2.8]; }
        if (s.shape === 'line') { const nx = -Math.sin(s.a), ny = Math.cos(s.a), side = ((me.x - s.x) * nx + (me.y - s.y) * ny) >= 0 ? 1 : -1; return [me.x + nx * side * 2.5, me.y + ny * side * 2.5]; } return [me.x, me.y + 2]; };
      let react = 0, plan = null;
      const dt = 0.05; const tMax = 400;
      while (t < tMax && !b.dead && !D.g.won) {
        const U = window.__pp.arc.game; U.update(dt); t += dt; phT[FX.S.phase - 1] += dt;
        if (b.hp < hpPrev) { (M.brittle ? (dmgB += hpPrev - b.hp) : (dmgA += hpPrev - b.hp)); } hpPrev = b.hp;
        if (me.hp < hp0) hurt += hp0 - me.hp; if (me.dead || me.hp <= 1) { deaths++; me.dead = false; me.hp = D.ST.hp; } else if (me.hp < D.ST.hp * 0.35) { me.hp = D.ST.hp; } hp0 = me.hp; me.mp = 999;
        if (M.act && M.act.k !== lastAct) { acts[M.act.k] = (acts[M.act.k] || 0) + 1; } lastAct = M.act ? M.act.k : null;
        if (A.field) fieldsT += dt;
        react -= dt; if (react > 0) continue; react = 0.1 / skill;
        const W = A.wells, w = A.active(), Gp = M.act && M.act.grip, adds = D.mons.filter(m => m.type === 'cinderling' && !m.dead && !(m.born > 0));
        // the burst: get into its gap
        const wave = M.waves[0]; if (wave && !nomech) { const ga = wave.gap, R0 = Math.hypot(me.x - wave.x, me.y - wave.y), rr = Math.max(4, Math.min(9, R0)); go(wave.x + Math.cos(ga) * rr, wave.y + Math.sin(ga) * rr, dt * 2); continue; }
        // a marked strike under the pet: out of it
        const s = inTele(); if (s) { const [ax, ay] = away(s); go(ax, ay, dt * 2); if (nomech) tapAt(b); continue; }
        if (nomech) { const d = Math.hypot(b.x - me.x, b.y - me.y); if (d > 3.2) go(b.x, b.y + 2.6, dt * 2); tapAt(b); continue; }
        // an interrupt point: break it
        if (Gp && Gp.on) { const d = Math.hypot(Gp.x - me.x, Gp.y - me.y); if (d > 2.5) go(Gp.x, Gp.y + 1.2, dt * 2); const wk = D.mons.find(m => m.kind === 'weak' && !m.dead); tapAt(wk || b); continue; }
        // cinderlings at the active crystal: swat them
        if (w && adds.length) { const q = adds.sort((p, q2) => Math.hypot(p.x - w.x, p.y - w.y) - Math.hypot(q2.x - w.x, q2.y - w.y))[0]; if (Math.hypot(q.x - w.x, q.y - w.y) < 3.5 || M.brittle === false) { if (Math.hypot(q.x - me.x, q.y - me.y) > 2.2) go(q.x, q.y + 1, dt * 2); tapAt(q); continue; } }
        // brittle: hit it hard from close
        if (M.brittle) { const d = Math.hypot(b.x - me.x, b.y - me.y); if (d > 3.0) go(b.x, b.y + 2.6, dt * 2); tapAt(b); continue; }
        // a field running: stand past the zone so it walks in, striking it as it comes
        if (w) { const ax = w.zx - b.x, ay = w.zy - b.y, ad = Math.hypot(ax, ay) || 1, inZ = ad < w.zr; const tx = w.zx + ax / ad * 1.4, ty = w.zy + ay / ad * 1.4; if (!inZ) go(tx, ty, dt * 2); else if (Math.hypot(b.x - me.x, b.y - me.y) > 3) go(b.x + (me.x - b.x) * 0.5, b.y + (me.y - b.y) * 0.5, dt * 2); tapAt(adds[0] || b); continue; }
        // no field: pick the usable well whose zone is nearest the flan; stand on its plate until the flan is in the zone
        let best = null, bd = 1e9; for (const q of W) if (A.canUse(q.i)) { const d = Math.hypot(q.zx - b.x, q.zy - b.y) + Math.hypot(q.px - me.x, q.py - me.y) * 0.4; if (d < bd) { bd = d; best = q; } }
        if (best) { const onP = go(best.px, best.py, dt * 2); if (onP) { const inZ = Math.hypot(b.x - best.zx, b.y - best.zy) < best.zr + 0.3; if (!inZ) { tapAt(b); me.vx = me.vy = 0; } else { me.vx = me.vy = 0; } } else tapAt(adds[0] || b); continue; }
        // recharging: keep at range, chipping at it, and shake off the adds
        const d = Math.hypot(b.x - me.x, b.y - me.y); if (adds.length) tapAt(adds[0]); else tapAt(b); if (d < 3.5) { const a = Math.atan2(me.y - b.y, me.x - b.x); go(b.x + Math.cos(a) * 5, b.y + Math.sin(a) * 5, dt * 2); }
      }
      return { t: +t.toFixed(1), dead: b.dead, phT: phT.map(v => +v.toFixed(1)), brittle: M.stat.brittle, fields: M.stat.fields, fieldsT: +fieldsT.toFixed(1), dmgB: Math.round(dmgB), dmgA: Math.round(dmgA), shareB: +(dmgB / Math.max(1, dmgB + dmgA)).toFixed(2), maxhp: Math.round(b.maxhp), lv: (window.__pp.partyPets()[0] || {}).dlv, atk: D.ST.atk, hurt: Math.round(hurt), petHp: D.ST.hp, deaths, acts, interrupts: M.stat.interrupts, smashes: M.stat.smashes, breaks: M.stat.log.filter(e => e[0] === 'break').length, adds: M.stat.adds, burstHits: M.stat.burstHits, log: M.stat.log.slice(0, 30) };`, [!!process.env.NOMECH, +(process.env.SKILL || 1)]);
    console.log(JSON.stringify(r)); out.push(r);
    await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); });
  }
  const avg = out.reduce((s, r) => s + r.t, 0) / out.length;
  console.log('mean length', avg.toFixed(1), 's');
  if (!process.env.NOMECH) { ok(out.every(r => r.dead), 'the flan dies every run'); ok(avg > 90 && avg < 160, 'about two minutes with the mechanics', avg); ok(out.every(r => r.brittle >= 3), 'brittle windows are what kills it', out.map(r => r.brittle)); }
  else ok(true, 'plain attacks only: ' + out.map(r => r.t + 's' + (r.dead ? '' : ' (alive at ' + Math.round(100 * (1 - (r.dmgA + r.dmgB) / r.maxhp)) + '%)')).join(', '));
  const er = errors.filter(e => !/ERR_(TUNNEL|FILE_NOT|NAME)/.test(e)); console.log('errors', er.slice(0, 6)); ok(er.length === 0, 'no page errors');
  await T.browser.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
