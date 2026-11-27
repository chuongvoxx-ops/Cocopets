// v469 GB: whole fights against Raziel as an ordinary gate boss, played by bots (GL off; game time stepped at 1/30 s).
//   fighter  strikes Raziel at the reference pace (the pet's attack every 0.32 s through the engine's hitMon: what a pet's normal
//            attacks do), keeps ~5 tiles off, steps out of every telegraphed blow (T.danger: what is lit), answers the two great
//            judgements (the sanctuary, the sectors), walks to a healing orb when hurt and safe;
//   still    the same strikes from 5 tiles south of Raziel, never moving, never answering a judgement.
// RUNS=fighter,still LVL=40 MAXT=3600 (game s) DPSK=1 (x the reference pace). Prints the outcome, the time, damage taken a minute,
// heals taken, the judgements seen / clean, the phases' times. HTML=test-gb.html node tests/_gb-tune.js
const { open } = require('./_gb-lib');
const RUNS = (process.env.RUNS || 'fighter,still').split(','), LVL = +process.env.LVL || 40, MAXT = +process.env.MAXT || 3600, DPSK = +process.env.DPSK || 1;
(async () => {
  const H = await open({ lvl: LVL }); let bad = 0; const chk = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  try {
    await H.start(); await H.fight();
    for (const R of RUNS) {
      const r = await H.ev(`
        const dt = 1 / 30, V = 4.0, smart = ${R === 'fighter'}, DPSK = ${DPSK};
        const walk = (x, y, v) => { const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); if (d < 1e-3) return; const k = Math.min(1, (v || V) * dt / d); me.x += dx * k; me.y += dy * k; me.vx = me.vy = 0; };
        const s0 = T.S; me.dead = false; me.inv = 0; if (!window.__gbWin0) window.__gbWin0 = s0.X.winStage; s0.X.winStage = () => { window.__gbWins = (window.__gbWins || 0) + 1; };
        GB.begin(s0.X, s0.H, s0.self, s0.A); const SS = T.S, P0 = SS.X.ST(), A = SS.A; me.hp = P0.hp; me.x = A.cx; me.y = A.cy + 6;
        let t = 0, hitT = 0, heals = 0, hp0 = 0, minHp = 1, out = 'timeout', ph = {}, deaths = 0;
        const B1 = (Mx) => { const D = Mx.data; if (D.phase !== 'wave') return false; const W = D.w, told = W.cancelAt == null || W.told; if (!told) { const f = D.san.find(q => q.el === 'fire'), i = f && D.san.find(q => q.el === 'ice' && Math.hypot(q.x - f.x, q.y - f.y) < 6); if (f && i) { walk((f.x + i.x) / 2, (f.y + i.y) / 2); return true; } return false; } if (T.S.prot === Mx.need) return false; let b = null, bd = 1e9; for (const q of D.san) if (q.el === Mx.need) { const d = Math.hypot(q.x - me.x, q.y - me.y); if (d < bd) { bd = d; b = q; } } if (b) { walk(b.x, b.y); return true; } return false; };
        const B2 = (Mx) => { const D = Mx.data; if (D.ex < 0) return false; const want = D.pats[D.order[D.ex]].s; if (want.includes(T.secOf(me.x, me.y)) && T.polar(me.x, me.y).r > 2.6) return true; let b = null, bd = 1e9; for (const i of want) { const q = T.secNear(i, me.x, me.y, 0.9); if (q.d < bd) { bd = q.d; b = q.p; } } if (b) { walk(b.x, b.y); return true; } return false; };
        const dodge = () => { if (!T.danger(me.x, me.y, 0.7)) return false; let best = null, bs = 1e9; for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283, rr = 1.2 + (k % 3) * 1.4, x = me.x + Math.cos(a) * rr, y = me.y + Math.sin(a) * rr; if (Math.hypot(x - A.cx, y - A.cy) > A.r - 0.8) continue; if (T.danger(x, y, 0.9)) continue; const sc = rr + Math.abs(Math.hypot(x - SS.m.x, y - SS.m.y) - 5) * 0.3; if (sc < bs) { bs = sc; best = { x, y }; } } if (best) { walk(best.x, best.y); return true; } return false; };
        while (t < ${MAXT}) { const s = T.S; if (!s) break; if (s.mode === 'dead' || s.mode === 'over') { out = 'win'; break; }
          if (me.dead) { deaths++; out = 'dead'; break; }
          if (s.phase && ph[s.phase] == null) ph[s.phase] = +t.toFixed(0);
          // its strikes on Raziel (the reference pace), whatever it is doing
          if (s.mode !== 'intro') { hitT -= dt; if (hitT <= 0) { hitT += 0.32; D.hitMon(s.m, P0.atk * DPSK, { noCrit: true, src: 'normal' }); } }
          if (smart) { let busy = false; if (s.mech) busy = (s.mech.id === 1 ? B1 : B2)(s.mech);
            if (!busy) busy = dodge();
            if (!busy && me.hp < P0.hp * 0.65) { let pk = null, pd = 1e9; for (const p of D.picks) if (!p.got && p.kind === 'hp') { const d = Math.hypot(p.x - me.x, p.y - me.y); if (d < pd && !T.danger(p.x, p.y, 0.6)) { pd = d; pk = p; } } if (pk) { walk(pk.x, pk.y); busy = true; } }
            if (!busy) { const dx = me.x - s.m.x, dy = me.y - s.m.y, d = Math.hypot(dx, dy) || 1; if (Math.abs(d - 5) > 0.6) walk(s.m.x + dx / d * 5, s.m.y + dy / d * 5, 2.5); } }
          else { me.x = s.m.x; me.y = s.m.y + 5; me.vx = me.vy = 0; }
          const h0 = me.hp; U.update(dt); t += dt; if (me.hp > h0 + 1) heals += me.hp - h0; minHp = Math.min(minHp, me.hp / P0.hp); }
        const st = T.S ? T.S.stat : {}; return { run: '${R}', lvl: ${LVL}, out, t: +t.toFixed(0), petHp: P0.hp, petAtk: P0.atk, hpLeft: T.S ? +(T.S.m.hp / T.S.m.maxhp).toFixed(3) : 0, dmgPerMin: Math.round((st.dmgIn || 0) / Math.max(1, t / 60)), dmgIn: Math.round(st.dmgIn || 0), heals: Math.round(heals), minHpK: +minHp.toFixed(2), big: st.big, miss: st.miss, clean: st.clean, phases: ph, maxHaz: st.maxHaz };`);
      console.log(JSON.stringify(r));
      if (R === 'fighter') chk(r.out === 'win', 'a fighting, dodging bot wins');
      if (R === 'still') chk(r.out === 'dead', 'a bot standing still loses');
    }
  } catch (e) { bad++; console.log('ERR', e.message); }
  console.log('errors', JSON.stringify(H.errors.slice(0, 6)));
  await H.browser.close(); console.log(bad || H.errors.length ? 'TUNE FAIL' : 'TUNE OK');
})();
