// v469 GB: Raziel's two great judgements (woven into its rotation), played by bots at a capped speed (VREF tiles/s), stepped at
// 1/FPS s (FPS=30 default; 60, 120, 12 to check frame-rate independence). For each: a bot that answers right (no heavy blow, an
// exposed window after it), a bot that stands still or answers wrong (heavy blows only: the fight goes on, nothing scored, the pet
// alive from full health). Also: Raziel can be struck all through a judgement, and the pattern deals are always reachable.
// ONLY=1,2. HTML=test-gb.html node tests/_gb-mech.js
const { open } = require('./_gb-lib');
const ONLY = (process.env.ONLY || '1,2').split(',').map(Number), FPS = +process.env.FPS || 30;
(async () => {
  const H = await open({ lvl: 40 }); const out = {}; let bad = 0;
  try {
    await H.start(); await H.fight();
    const BOT = `
      const dt = 1 / ${FPS}, V = TU.VREF;
      const reset = () => { const s = T.S; me.dead = false; me.inv = 0; GB.begin(s.X, s.H, s.self, s.A); T.skipIntro(); step(0.2, null, dt); T.noBig(true); const P0 = T.S.X.ST(); me.hp = P0.hp; return T.S; };
      const walkTo = (x, y) => { const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); if (d < 1e-3) return true; const k = Math.min(1, V * dt / d); me.x += dx * k; me.y += dy * k; me.vx = me.vy = 0; me.dodge = null; return d < 0.05; };
      const run = (id, brain) => { const s = T.S, Mx = T.start(id); let t = 0; const P0 = s.X.ST(), hp0 = me.hp, k0 = s.m.hp; let hitT = 0;
        while (t < 60 && T.S && T.S.mech === Mx) { brain(Mx, t); hitT -= dt; if (hitT <= 0) { hitT += 0.32; D.hitMon(T.S.m, P0.atk, { noCrit: true, src: 'normal' }); } U.update(dt); t += dt; }
        return { t: +t.toFixed(2), miss: Mx.miss, mode: T.S.mode, vuln: T.S.vuln ? +T.S.vuln.dur.toFixed(1) : 0, petLost: Math.round(hp0 - me.hp), petMax: P0.hp, dead: !!me.dead, bossTook: Math.round(k0 - T.S.m.hp) }; };
      const still = () => {};`;
    const B1 = `(Mx) => { const D = Mx.data; if (D.phase !== 'wave') return; const W = D.w, told = W.cancelAt == null || W.told; if (!told) { const f = D.san.find(s => s.el === 'fire'), i = f && D.san.find(s => s.el === 'ice' && Math.hypot(s.x - f.x, s.y - f.y) < 6); if (f && i) walkTo((f.x + i.x) / 2, (f.y + i.y) / 2); return; }
      if (T.S.prot === Mx.need) return; let b = null, bd = 1e9; for (const s of D.san) if (s.el === Mx.need) { const d = Math.hypot(s.x - me.x, s.y - me.y); if (d < bd) { bd = d; b = s; } } if (b) walkTo(b.x, b.y); }`;
    const W1 = `(Mx) => { const D = Mx.data; if (D.phase !== 'wave' || !(D.w.cancelAt == null || D.w.told)) return; let b = null, bd = 1e9; for (const s of D.san) if (s.el !== Mx.need) { const d = Math.hypot(s.x - me.x, s.y - me.y); if (d < bd) { bd = d; b = s; } } if (b) walkTo(b.x, b.y); }`;
    const B2 = `(Mx) => { const D = Mx.data; if (D.ex < 0) return; const want = D.pats[D.order[D.ex]].s; let b = null, bd = 1e9; for (const i of want) { const q = T.secNear(i, me.x, me.y, 0.9); if (q.d < bd) { bd = q.d; b = q.p; } } if (b) walkTo(b.x, b.y); }`;
    const W2 = `(Mx) => { const D = Mx.data; if (D.ex < 0) return; const want = D.pats[D.order[D.ex]].s; let s0 = 0; while (want.includes(s0)) s0++; const q = T.secNear(s0, me.x, me.y, 0.9); walkTo(q.p.x, q.p.y); }`;
    if (ONLY.includes(1)) { out.m1right = await H.ev(BOT + `reset(); return run(1, ${B1});`); out.m1still = await H.ev(BOT + `reset(); return run(1, still);`); out.m1wrong = await H.ev(BOT + `reset(); return run(1, ${W1});`); }
    if (ONLY.includes(2)) { out.m2right = await H.ev(BOT + `reset(); T.S.phase = 2; return run(2, ${B2});`); out.m2wrong = await H.ev(BOT + `reset(); T.S.phase = 2; return run(2, ${W2});`);
      out.m2deal = await H.ev(`let bad = 0, n = 300; for (let i = 0; i < n; i++) { const d = T.MI[2].deal(); if (d.tries < 0) bad++; } return { n, fallback: bad };`); }
    // the rotation: the judgements come back on their own (no test forcing), the boss struck throughout
    out.rotation = await H.ev(BOT + `reset(); T.noBig(false); const P0 = T.S.X.ST(); let t = 0, seen = []; let last = null; while (t < 150) { if (me.hp < P0.hp * 0.5) me.hp = P0.hp; hold(T.S.m.x, T.S.m.y + 5); U.update(dt); t += dt; const id = T.S.mech ? T.S.mech.id : null; if (id && id !== last) seen.push(id + '@' + t.toFixed(0)); last = id; if (t > 60 && T.S.phase < 2) T.setK(0.79); } return { seen: seen.join(' '), phase: T.S.phase, mode: T.S.mode };`);
    for (const k in out) console.log(k, JSON.stringify(out[k]));
    const chk = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
    if (out.m1right) chk(out.m1right.miss === 0 && out.m1right.vuln > 0 && out.m1right.bossTook > 0, 'M1 right: no blow, exposed after, Raziel struck through it');
    if (out.m1still) chk(out.m1still.miss === 3 && out.m1still.mode === 'fight' && !out.m1still.dead, 'M1 still: three heavy blows, the fight goes on');
    if (out.m1wrong) chk(out.m1wrong.miss === 3 && !out.m1wrong.dead, 'M1 wrong: three heavy blows');
    if (out.m2right) chk(out.m2right.miss === 0 && out.m2right.vuln > 0, 'M2 right: no blow, exposed after');
    if (out.m2wrong) chk(out.m2wrong.miss === 4 && out.m2wrong.mode === 'fight', 'M2 wrong: four heavy blows, the fight goes on');
    if (out.m2deal) chk(out.m2deal.fallback === 0, 'M2 deals reachable');
    if (out.rotation) chk(/^1@/.test(out.rotation.seen) && / 2@/.test(out.rotation.seen), 'both judgements come back in the rotation');
  } catch (e) { bad++; console.log('ERR', e.message); }
  console.log('errors', JSON.stringify(H.errors.slice(0, 6)));
  await H.browser.close(); console.log(bad || H.errors.length ? 'MECH FAIL' : 'MECH OK');
})();
