// Bomb King (Rift 0, worker B): the spec's numbers, one by one, on the real game (2D picture; game-time waits).
//   shell ~40% (and none while it vents), Furnace Vent ~5 s low; a larva: lands, ~3 s RETURN, then armed (hits do nothing),
//   bursts at ~6 s with its damage circle; a return cracks the shell and staggers ~4 s and never hurts the pet; the 7 s
//   detonation: a returnable bomb supplied within reach at its start, returning it breaks the charge (a long stagger),
//   enough core damage breaks it too, a SAFE side takes no damage, out in the open a heavy but survivable hit; the
//   shelters survive; from anywhere on the floor a SAFE side is reachable in the countdown.
// usage: HTML=test-calB.html node tests/_cal-b-mech.js
const { openCal } = require('./_cal-b-lib');
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s, x === undefined ? '' : JSON.stringify(x)); if (!c) fails++; };
(async () => {
  const T = await openCal({ gl: false }); const { errors, start, ev } = T;
  await start();
  await ev(`D.g.taps = 9; const go = clock(10); while (go() && b.act === 'enter') await frame();`);
  // (keep the King quiet between checks: no act of its own unless forced)
  const calm = `M.wait = 99; b.stunT = 0;`;
  const run = (secs, body) => ev(`const go = clock(arg); while (go()) { await frame(); ${body || ''} }`, secs);
  // 1. the shell, and its absence while it vents
  let r = await ev(`${calm} const k0 = DEF.dmgK(FX, b, {}) / M.amp; DEF.force(FX, 'vent'); const go = clock(1); while (go()) await frame(); const k1 = DEF.dmgK(FX, b, {}) / M.amp; let t = 0; const g0 = D.g.t; const go2 = clock(9); while (go2() && b.act === 'vent') await frame(); return { k0: +k0.toFixed(2), k1: +k1.toFixed(2), vent: +(D.g.t - g0 + 1).toFixed(1), zc: M.zcTo };`);
  ok(Math.abs(r.k0 - 0.6) < 0.01 && r.k1 === 1, 'shell: 40% less damage, none while it vents', r);
  ok(r.vent > 4.4 && r.vent < 6, 'Furnace Vent lasts about 5 s', r.vent);
  // 2. a larva: its timeline, a hit while armed does nothing, then it bursts; the damage circle hurts a pet inside it
  r = await ev(`${calm} M.bombs.forEach(q => { if (q.lm) q.lm.dead = true; }); M.bombs.length = 0; DEF.drop(FX); const q = M.bombs[M.bombs.length - 1]; const g0 = D.g.t; let land = -1, armed = -1, hitArmed = null, burst = -1, hp0 = 0, hurt = 0;
    const go = clock(10); while (go()) { await frame(); M.wait = 99; const t = D.g.t - g0;
      if (land < 0 && q.st === 'safe') land = t; if (armed < 0 && q.st === 'armed') { armed = t; D.hitMon(q.o || q.lm, 5, {}); hitArmed = q.st; me.x = q.x + 0.6; me.y = q.y; hp0 = me.hp = D.ST.hp; }
      if (armed >= 0 && q.st !== 'dead') { me.x = q.x + 0.6; me.y = q.y; me.vx = me.vy = 0; }
      if (q.st === 'dead') { burst = t; hurt = hp0 - me.hp; break; } }
    me.hp = D.ST.hp; return { land: +land.toFixed(2), safeFor: +(armed - land).toFixed(2), hitArmed, fuse: +(burst - land).toFixed(2), hurt: Math.round(hurt), petHp: D.ST.hp, explodes: M.stat.explodes };`);
  ok(r.land > 0.5 && r.land < 1.5, 'a larva drops and lands', r.land);
  ok(Math.abs(r.safeFor - 3) < 0.25 && r.hitArmed === 'armed', 'about 3 s to return it, then armed: a hit does not return it', r);
  ok(Math.abs(r.fuse - 6) < 0.3 && r.hurt > 0 && r.hurt < r.petHp * 0.25, 'it bursts at about 6 s and hurts a pet inside its circle (not much)', r);
  // 3. a return: it flies to the King, cracks the shell, staggers it ~4 s; the pet beside it takes nothing
  r = await ev(`${calm} M.bombs.forEach(q => { if (q.lm) q.lm.dead = true; }); M.bombs.length = 0; DEF.drop(FX); const q = M.bombs[M.bombs.length - 1]; const go = clock(3); while (go() && q.st !== 'safe') { await frame(); M.wait = 99; }
    me.x = q.x + 0.5; me.y = q.y; const hp0 = me.hp = D.ST.hp, s0 = M.stat.staggers, bh0 = b.hp; D.hitMon(q.o || q.lm, 3, {}); await frame(); await frame(); const flying = q.st; let st0 = -1, st1 = -1; const g0 = D.g.t;
    const go2 = clock(8); while (go2()) { await frame(); const t = D.g.t - g0; if (st0 < 0 && b.stunT > 0) st0 = t; if (st0 >= 0 && b.stunT <= 0) { st1 = t; break; } }
    return { flying, stagger: +(st1 - st0).toFixed(2), staggers: M.stat.staggers - s0, petLost: hp0 - me.hp, kingLost: Math.round(bh0 - b.hp), returns: M.stat.returns };`);
  ok(r.flying === 'fly' && r.staggers === 1, 'hitting a grounded bomb returns it into the King: the shell cracks', r);
  ok(r.stagger > 3.6 && r.stagger < 4.6, 'it staggers about 4 s', r.stagger);
  ok(r.petLost === 0, 'a returned bomb never hurts its sender', r.petLost);
  // 4. phase 3's detonation: a supplied bomb within reach at once; returning it breaks the charge (a long stagger)
  await ev(`b.hp = b.maxhp * 0.3; const go = clock(5); while (go()) { await frame(); me.hp = D.ST.hp; }`);
  const toCount = `{ M.bombs.forEach(q => { if (q.lm) q.lm.dead = true; }); M.bombs.length = 0; b.stunT = 0; DEF.force(FX, 'charge'); me.x = FX.C.x + 1; me.y = FX.C.y + 7; const go = clock(6); while (go() && !(M.ac && M.ac.phase === 'count')) { await frame(); me.hp = D.ST.hp; } const go1 = clock(0.9); while (go1()) { await frame(); me.hp = D.ST.hp; } }`;
  r = await ev(`${toCount} const q = M.sup; const d = q ? Math.hypot(q.x - me.x, q.y - me.y) : -1, inSh = q ? M.sh.some(s => DEF.SHELTERS.inRect(s, q.x, q.y, 0.5)) : null, zc = M.zc;
    if (q && (q.o || q.lm)) D.hitMon(q.o || q.lm, 3, {}); const g0 = D.g.t; let st0 = -1, st1 = -1; const go2 = clock(12); while (go2()) { await frame(); me.hp = D.ST.hp; const t = D.g.t - g0; if (st0 < 0 && b.stunT > 0) st0 = t; if (st0 >= 0 && b.stunT <= 0) { st1 = t; break; } }
    return { sup: !!q, st: q && q.st, d: +d.toFixed(1), inSh, zc: +zc.toFixed(1), intBomb: M.stat.intBomb, stagger: +(st1 - st0).toFixed(1) };`);
  ok(r.sup && r.d < 4.5 && r.d > 1 && !r.inSh, 'a detonation supplies a returnable bomb within reach, clear of the shelters', r);
  ok(r.zc > 3.6, 'the King rises for its countdown', r.zc);
  ok(r.intBomb >= 1 && r.stagger > 6 && r.stagger < 8, 'returning it into the core breaks the charge: a long stagger', r);
  // 5. enough core damage breaks it as well
  r = await ev(`${toCount} const need = M.ac.need, before = M.stat.intCore; let n = 0; const go2 = clock(6); while (go2() && M.stat.intCore === before) { await frame(); me.hp = D.ST.hp; D.hitMon(b, need / 8 / M.amp / 0.95, { flat: true }); n++; } return { need: Math.round(need), needPct: +(need / b.maxhp * 100).toFixed(1), broke: M.stat.intCore - before, stun: b.stunT > 5 };`);
  ok(r.broke === 1 && r.stun, 'enough core damage breaks the detonation too', r);
  // 6. the SAFE side takes nothing; the open floor a heavy, survivable hit; the shelters stand after
  r = await ev(`${toCount} M.sup && (M.sup.st = 'dead'); const sp = DEF.SHELTERS.safeSpot(FX.C, 1), s0 = M.stat.sheltered; const hp0 = D.ST.hp; let lost = 0;
    const go2 = clock(9); while (go2() && M.ac && M.ac.k === 'charge') { await frame(); me.x = sp.x; me.y = sp.y; me.vx = me.vy = 0; if (me.hp < hp0) lost += hp0 - me.hp; me.hp = hp0; }
    const shel = M.stat.sheltered - s0; ${toCount.replace("me.x = FX.C.x + 1; me.y = FX.C.y + 7;", "me.x = FX.C.x + 2; me.y = FX.C.y + 6;")} M.sup && (M.sup.st = 'dead'); let lost2 = 0;
    const go3 = clock(9); while (go3() && M.ac && M.ac.k === 'charge') { await frame(); me.x = FX.C.x + 2; me.y = FX.C.y + 6; me.vx = me.vy = 0; me.dodge = null; me.inv = 0; if (me.hp < hp0) lost2 += hp0 - me.hp; me.hp = hp0; }
    const tiles = M.sh.every(s => true); let solid = 0; for (const s of DEF.SHELTERS.list(FX.C)) for (let ty = Math.floor(s.y) - 3; ty <= Math.floor(s.y) + 3; ty++) for (let tx = Math.floor(s.x) - 3; tx <= Math.floor(s.x) + 3; tx++) if (DEF.SHELTERS.inRect(s, tx + 0.5, ty + 0.5, 0.08) && !D.walkAt(tx, ty)) solid++;
    return { shelLost: lost, sheltered: shel, openLost: Math.round(lost2), petHp: hp0, solid };`);
  ok(r.sheltered === 1 && r.shelLost === 0, 'on a SAFE side the blast does nothing', r);
  ok(r.openLost > 0 && r.openLost <= r.petHp * 0.55 + 0.5, 'out in the open: a heavy hit, never more than 55% of the pet', r);
  ok(r.solid >= 15, 'the three shelters still stand', r.solid);
  // 7. from anywhere on the floor, a SAFE side within the countdown at the pet's own speed (straight lines here)
  r = await ev(`const SH = DEF.SHELTERS, C = FX.C, spd = 4.3; let worst = 0, at = null; for (let a = 0; a < 64; a++) for (let rr = 0; rr <= 13.5; rr += 1.5) { const x = C.x + Math.cos(a / 64 * Math.PI * 2) * rr, y = C.y + Math.sin(a / 64 * Math.PI * 2) * rr; if (!D.walkAt(Math.floor(x), Math.floor(y))) continue; const n = SH.nearestShelter(C, x, y); if (n.d > worst) { worst = n.d; at = [+x.toFixed(1), +y.toFixed(1)]; } }
    return { worst: +worst.toFixed(1), at, spd, secs: +(worst / spd).toFixed(1) };`);
  ok(r.secs < 5.5, 'the nearest SAFE side is always reachable within the 7 s countdown', r);
  ok(errors.length === 0, 'no page errors', errors.slice(0, 5));
  console.log(fails ? `${fails} FAILED` : 'all ok');
  await T.browser.close(); process.exit(fails ? 1 : 0);
})();
