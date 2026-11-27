// v468 GB: the critical mechanics, played by bots at a capped speed (VREF tiles/s, the pet's validated pace), stepped at 1/30 s
// (FPS=60 or 120 to step finer). For each mechanic: a bot that does it right (must PASS), a bot that stands still or does it wrong
// (must FAIL, once, the seal shattering, the pet alive), and at the end two failures in a row (Absolute Paradox, the party wiped).
// ONLY=1,2 runs those mechanics. HTML=test-gb.html node tests/_gb-mech.js
const { open } = require('./_gb-lib');
const ONLY = (process.env.ONLY || '1,2,3,4,5,6').split(',').map(Number), FPS = +process.env.FPS || 30;
(async () => {
  const H = await open({ lvl: 40 }); const out = {}; let bad = 0;
  try {
    await H.start(); await H.fight();
    const BOT = `
      const dt = 1 / ${FPS}, V = TU.VREF;
      const reset = () => { const s = T.S; me.dead = false; me.inv = 0; GB.begin(s.X, s.H, s.self, s.A); T.skipIntro(); step(0.2, null, dt); const P0 = T.S.X.ST(); me.hp = P0.hp; return T.S; };
      const walkTo = (x, y) => { const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); if (d < 1e-3) return true; const k = Math.min(1, V * dt / d); me.x += dx * k; me.y += dy * k; me.vx = me.vy = 0; me.dodge = null; return d < 0.05; };
      const run = (id, brain, secs) => { const s = T.S; T.start(id); let t = 0, n = 0; const P0 = s.X.ST(); let hpMin = me.hp;
        while (t < (secs || 120) && T.S && T.S.res[id] == null && T.S.mode !== 'paradox') { const Mx = T.S.mech; if (Mx) brain(Mx, t); if (me.hp < P0.hp * 0.3 && T.S.failN === 0) me.hp = P0.hp; U.update(dt); t += dt; n++; hpMin = Math.min(hpMin, me.hp); }
        return { res: T.S ? T.S.res[id] : null, fails: T.S ? T.S.failN : -1, mode: T.S ? T.S.mode : null, t: +t.toFixed(2), hp: Math.round(me.hp), petMax: P0.hp, dead: !!me.dead, stat: T.S ? T.S.stat.fails : null }; };
      const still = () => {};`;
    const B1 = `(Mx) => { const D = Mx.data; if (D.phase !== 'wave') return; const W = D.w, told = W.cancelAt == null || W.told; if (!told) { const mid = D.san.filter(s => s.el === 'fire').map(f => { const i = D.san.find(s => s.el === 'ice' && Math.hypot(s.x - f.x, s.y - f.y) < 6); return i ? { x: (f.x + i.x) / 2, y: (f.y + i.y) / 2 } : null; }).filter(Boolean); if (mid[0]) walkTo(mid[0].x, mid[0].y); return; }
      if (T.S.prot === Mx.need) return; let b = null, bd = 1e9; for (const s of D.san) if (s.el === Mx.need) { const d = Math.hypot(s.x - me.x, s.y - me.y); if (d < bd) { bd = d; b = s; } } if (b) walkTo(b.x, b.y); }`;
    const B2 = `(Mx) => { const D = Mx.data; if (D.ex < 0) return; const want = D.pats[D.order[D.ex]].s; let b = null, bd = 1e9; for (const i of want) { const q = T.secNear(i, me.x, me.y, 0.9); if (q.d < bd) { bd = q.d; b = q.p; } } if (b) walkTo(b.x, b.y); }`;
    const W2 = `(Mx) => { const D = Mx.data; if (D.ex < 0) return; const want = D.pats[D.order[D.ex]].s; let s0 = 0; while (want.includes(s0)) s0++; const q = T.secNear(s0, me.x, me.y, 0.9); walkTo(q.p.x, q.p.y); }`;
    // 3: a bot that strikes the healthier core at the reference pace (the pet's attack every 0.32 s, through the engine's hitMon), or only one core
    const B3 = (smart) => `(Mx) => { const D = Mx.data; if (D.phase !== 'exec') return; T.S.__hitT = (T.S.__hitT || 0) - dt; if (T.S.__hitT > 0) return; T.S.__hitT += 0.32; const P0 = T.S.X.ST(); const L = D.cores.filter(c => !c.dead && c.P);
      if (!L.length) return; const c = ${smart} ? L.sort((a, b) => b.pct - a.pct)[0] : (L.find(q => q.side === 'L') || L[0]); D.__dmg = (D.__dmg || 0) + D_hit(c.P.m, P0.atk); }`;
    const H3 = `const D_hit = (m, d) => { const h0 = m.hp; D.hitMon(m, d, { noCrit: true, src: 'normal' }); return h0 - m.hp; };`;
    // 4: lead the active phantom through the far side of an anchor of the opposing element (or of its own, to fail), then run clear
    const B4 = (good) => `(Mx) => { const D = Mx.data, A = D.ph[D.cur]; if (!A || A.st === 'dormant' || A.st === 'done') return; const ok = ${good};
      if (A.st === 'captured') { const a = A.cap, c0 = T.S.A, dx = c0.cx - a.x, dy = c0.cy - a.y, d = Math.hypot(dx, dy) || 1, sx2 = -dy / d, sy2 = dx / d, sg = ((me.x - a.x) * sx2 + (me.y - a.y) * sy2) >= 0 ? 1 : -1; walkTo(a.x + dx / d * 4.5 + sx2 * sg * 2.5, a.y + dy / d * 4.5 + sy2 * sg * 2.5); return; }
      const an = T.GEO.anchors.filter(q => ok ? q.el !== A.el : q.el === A.el).sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y))[0];
      const ux = an.x - A.x, uy = an.y - A.y, ul = Math.hypot(ux, uy) || 1, tx = an.x + ux / ul * 2.2, ty = an.y + uy / ul * 2.2, c = T.S.A; const q = Math.hypot(tx - c.cx, ty - c.cy) > T.AR.R - 0.6 ? { x: c.cx + (tx - c.cx) * (T.AR.R - 0.6) / Math.hypot(tx - c.cx, ty - c.cy), y: c.cy + (ty - c.cy) * (T.AR.R - 0.6) / Math.hypot(tx - c.cx, ty - c.cy) } : { x: tx, y: ty };
      if (Math.hypot(me.x - A.x, me.y - A.y) < 2.2 && Math.hypot(me.x - an.x, me.y - an.y) > 3) { const px = me.x - A.x, py = me.y - A.y, pl = Math.hypot(px, py) || 1; walkTo(me.x + px / pl * 3 + (q.x - me.x) * 0.3, me.y + py / pl * 3 + (q.y - me.y) * 0.3); } else walkTo(q.x, q.y); }`;
    // 5: to the mirror, wait outside its ring, step in so the 0.75 s hold ends inside the window (or far too early, to fail)
    const B5 = (lead) => `(Mx) => { const D = Mx.data, t = Mx.t, cur = D.sph.find(s => s.st === 'come'); if (!cur) return; const M0 = cur.mir, go = t >= cur.tA - ${lead}; if (go) walkTo(M0.x, M0.y); else { const p = { x: M0.x, y: M0.y + 3.2 }; walkTo(p.x, p.y); } }`;
    // 6: the beams' wider corridor, the white cells, each wave's gap, the fragments and the sanctuary
    const B6 = `(Mx) => { const D = Mx.data, c0 = T.S.A, R = T.AR.R; if (D.stage === 1) { const B = D.beams; if (B.safe == null) return; const pa = Math.atan2(me.y - c0.cy, me.x - c0.cx), cand = [B.safe, B.safe + Math.PI].sort((p, q) => Math.abs(Math.atan2(Math.sin(p - pa), Math.cos(p - pa))) - Math.abs(Math.atan2(Math.sin(q - pa), Math.cos(q - pa))))[0]; walkTo(c0.cx + Math.cos(cand) * 4.5, c0.cy + Math.sin(cand) * 4.5); return; }
      if (D.stage === 2 && D.fi >= 0) { const F = D.forms[D.fi]; let b = null, bd = 1e9; for (const id of F.safe) { const q = T.cellNear(id, me.x, me.y); if (q.d < bd) { bd = q.d; b = q.p; } } if (b) walkTo(b.x, b.y); return; }
      if (D.stage === 3) { let w = null, wt = 1e9; for (const h of T.S.haz) { if (h.vis !== 'gapring' || h.hit) continue; const dd = Math.hypot(me.x - h.x, me.y - h.y), R0 = h.t > h.tell ? h.R || h.r0 : h.r0; if (R0 > dd + 0.5) continue; const eta = (h.tell - h.t) + (dd - R0) / (h.r1 - h.r0) * h.act; if (eta < wt) { wt = eta; w = h; } } if (w) { const dd = Math.max(3, Math.hypot(me.x - w.x, me.y - w.y)); let tx = w.x + Math.cos(w.gap) * dd, ty = w.y + Math.sin(w.gap) * dd; const k = Math.hypot(tx - c0.cx, ty - c0.cy); if (k > R - 1) { tx = c0.cx + (tx - c0.cx) * (R - 1) / k; ty = c0.cy + (ty - c0.cy) * (R - 1) / k; } walkTo(tx, ty); } return; }
      if (D.stage === 4 && D.frags) { const F = D.frags; const tgt = !D.got.F && !D.got.I ? (Math.hypot(F.F.x - me.x, F.F.y - me.y) < Math.hypot(F.I.x - me.x, F.I.y - me.y) ? F.F : F.I) : !D.got.F ? F.F : !D.got.I ? F.I : { x: c0.cx, y: c0.cy }; walkTo(tgt.x, tgt.y); } }`;
    if (ONLY.includes(6)) { out.m6pass = await H.ev(BOT + `reset(); const r = run(6, ${B6}, 160); r.stats = T.S.mech ? null : (T.S.__m6 || null); r.vuln = T.S.vuln ? +T.S.vuln.dur.toFixed(1) : 0; r.finalWin = T.S.finalWin; return r;`);
      out.m6still = await H.ev(BOT + `reset(); const good = ${B6}; const r = run(6, (Mx, t) => { if (T.S.failN) good(Mx, t); }, 160); r.vuln = T.S.vuln ? +T.S.vuln.dur.toFixed(1) : 0; return r;`); }
    if (ONLY.includes(3)) { out.m3pass = await H.ev(BOT + H3 + `reset(); for (let i = 1; i < 3; i++) { T.start(i); T.resolve(i); } T.S.vuln = null; const r = run(3, ${B3(true)}); r.cores = T.S.stat.mechT[3]; return r;`);
      out.m3fail = await H.ev(BOT + H3 + `reset(); return run(3, ${B3(false)});`); }
    if (ONLY.includes(4)) { out.m4pass = await H.ev(BOT + `reset(); return run(4, ${B4('true')});`); out.m4fail = await H.ev(BOT + `reset(); return run(4, ${B4('false')});`); out.m4still = await H.ev(BOT + `reset(); return run(4, still);`); }
    if (ONLY.includes(5)) { out.m5pass = await H.ev(BOT + `reset(); return run(5, ${B5(1.5)});`); out.m5early = await H.ev(BOT + `reset(); return run(5, ${B5(3.0)});`); out.m5still = await H.ev(BOT + `reset(); return run(5, still);`); }
    if (ONLY.includes(1)) { out.m1pass = await H.ev(BOT + `reset(); return run(1, ${B1});`); out.m1fail = await H.ev(BOT + `reset(); return run(1, still);`); }
    if (ONLY.includes(2)) { out.m2pass = await H.ev(BOT + `reset(); T.start(1); T.resolve(1); return run(2, ${B2});`); out.m2fail = await H.ev(BOT + `reset(); return run(2, ${W2});`);
      out.m2deal = await H.ev(`let worst = 0, bad = 0, n = 300; for (let i = 0; i < n; i++) { const d = T.MI[2].deal ? T.MI[2].deal() : null; if (!d) break; if (d.tries < 0) bad++; } return { n, fallback: bad };`); }
    // the second failure: Absolute Paradox, the wipe through the engine
    if (ONLY.includes(1) && ONLY.includes(2)) out.paradox = await H.ev(BOT + `reset(); const a = run(1, still); const b = run(2, ${W2}); const s = T.S; let t = 0; while (t < 8 && T.S && T.S.mode === 'paradox') { U.update(dt); t += dt; }
      return { a: a.res, b: b.mode, failN: s.failN, paradoxAt: s.stat.paradoxAt, wipedAfter: +t.toFixed(2), petDead: !!me.dead, over: !!g.over, party: (D.X && D.X.party ? 0 : 0) };`);
    for (const k in out) console.log(k, JSON.stringify(out[k]));
    const chk = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
    if (out.m1pass) chk(out.m1pass.res === 'pass' && out.m1pass.fails === 0, 'M1 bot should pass');
    if (out.m1fail) chk(out.m1fail.res === 'fail' && out.m1fail.fails === 1 && !out.m1fail.dead, 'M1 still should fail once, alive');
    if (out.m2pass) chk(out.m2pass.res === 'pass' && out.m2pass.fails === 0, 'M2 bot should pass');
    if (out.m2fail) chk(out.m2fail.res === 'fail' && out.m2fail.fails === 1 && !out.m2fail.dead, 'M2 wrong should fail once, alive');
    if (out.m3pass) chk(out.m3pass.res === 'pass' && out.m3pass.fails === 0, 'M3 balanced bot should pass');
    if (out.m3fail) chk(out.m3fail.res === 'fail' && out.m3fail.fails === 1, 'M3 one-core bot should fail once');
    if (out.m4pass) chk(out.m4pass.res === 'pass' && out.m4pass.fails === 0, 'M4 kiting bot should pass');
    if (out.m4fail) chk(out.m4fail.res === 'fail' && out.m4fail.fails === 1, 'M4 wrong-anchor bot should fail once');
    if (out.m4still) chk(out.m4still.res === 'fail' && out.m4still.fails === 1, 'M4 still bot should fail once (time)');
    if (out.m5pass) chk(out.m5pass.res === 'pass' && out.m5pass.fails === 0, 'M5 timed bot should pass');
    if (out.m5early) chk(out.m5early.res === 'fail' && out.m5early.fails === 1, 'M5 early bot should fail once');
    if (out.m5still) chk(out.m5still.res === 'fail' && out.m5still.fails === 1, 'M5 still bot should fail once');
    if (out.m6pass) chk(out.m6pass.res === 'pass' && out.m6pass.fails === 0 && out.m6pass.vuln >= 14, 'M6 bot should pass and open the final window');
    if (out.m6still) chk(out.m6still.res === 'fail' && out.m6still.fails === 1 && !out.m6still.dead, 'M6 still should fail once and continue');
    if (out.paradox) chk(out.paradox.failN === 2 && out.paradox.petDead, 'two failures: Absolute Paradox wipes the party');
  } catch (e) { bad++; console.log('ERR', e.message); }
  console.log('errors', JSON.stringify(H.errors.slice(0, 6)));
  await H.browser.close(); console.log(bad || H.errors.length ? 'MECH FAIL' : 'MECH OK');
})();
