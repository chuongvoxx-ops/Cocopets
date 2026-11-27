// v468 GB: whole encounters, from the door sealing to the reward, played by bots (GL off; stepped at 1/30 s unless FPS=..).
// RUNS=perfect,f1,f2,f3,f4,f5,f6,skip  (fK: mechanic K failed once, every other one passed; skip: every blow a million: no mechanic may be
// skipped). Ordinary combat is shortened: the bot's blows on Raziel's body are BOOST x the pet's attack every 0.32 s (the mechanics'
// own work, the cores' health, is struck at the reference pace, x1). The pet's health is topped up below 45% (ordinary blows are not
// what this measures; the count is printed). Checks: six results, at most one failure, phases in order, the victory only after all six,
// X.winStage -> the Gemini Anima unlocked once (a second win does not add it again), GPU buffers 0 after.
const { open } = require('./_gb-lib');
const RUNS = (process.env.RUNS || 'perfect,f1,f2,f3,f4,f5,f6,skip').split(','), FPS = +process.env.FPS || 30, BOOST = +process.env.BOOST || 40;
(async () => {
  const H = await open({ lvl: 40 }); let bad = 0; const chk = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  try {
    await H.start(); await H.fight();
    const BOTS = `
      const dt = 1 / ${FPS}, V = TU.VREF;
      const walkTo = (x, y) => { const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); if (d < 1e-3) return true; const k = Math.min(1, V * dt / d); me.x += dx * k; me.y += dy * k; me.vx = me.vy = 0; me.dodge = null; return d < 0.05; };
      const still = () => {};
      const B1 = (Mx) => { const D = Mx.data; if (D.phase !== 'wave') return; const W = D.w, told = W.cancelAt == null || W.told; if (!told) { const f = D.san.find(s => s.el === 'fire'), i = f && D.san.find(s => s.el === 'ice' && Math.hypot(s.x - f.x, s.y - f.y) < 6); if (f && i) walkTo((f.x + i.x) / 2, (f.y + i.y) / 2); return; } if (T.S.prot === Mx.need) return; let b = null, bd = 1e9; for (const s of D.san) if (s.el === Mx.need) { const d = Math.hypot(s.x - me.x, s.y - me.y); if (d < bd) { bd = d; b = s; } } if (b) walkTo(b.x, b.y); };
      const B2 = (Mx) => { const D = Mx.data; if (D.ex < 0) return; const want = D.pats[D.order[D.ex]].s; let b = null, bd = 1e9; for (const i of want) { const q = T.secNear(i, me.x, me.y, 0.9); if (q.d < bd) { bd = q.d; b = q.p; } } if (b) walkTo(b.x, b.y); };
      const F2 = (Mx) => { const D = Mx.data; if (D.ex < 0) return; const want = D.pats[D.order[D.ex]].s; let s0 = 0; while (want.includes(s0)) s0++; const q = T.secNear(s0, me.x, me.y, 0.9); walkTo(q.p.x, q.p.y); };
      const hit = (m, d) => { const h0 = m.hp; D.hitMon(m, d, { noCrit: true, src: 'normal' }); return h0 - m.hp; };
      const B3 = (smart) => (Mx) => { const Dm = Mx.data; if (Dm.phase !== 'exec') return; T.S.__hitT = (T.S.__hitT || 0) - dt; if (T.S.__hitT > 0) return; T.S.__hitT += 0.32; const L = Dm.cores.filter(c => !c.dead && c.P); if (!L.length) return; const c = smart ? L.sort((a, b) => b.pct - a.pct)[0] : (L.find(q => q.side === 'L') || L[0]); hit(c.P.m, T.S.X.ST().atk); };
      const B4 = (good) => (Mx) => { const Dm = Mx.data, A = Dm.ph[Dm.cur]; if (!A || A.st === 'dormant' || A.st === 'done') return;
        if (A.st === 'captured') { const a = A.cap, c0 = T.S.A, dx = c0.cx - a.x, dy = c0.cy - a.y, d = Math.hypot(dx, dy) || 1, sx2 = -dy / d, sy2 = dx / d, sg = ((me.x - a.x) * sx2 + (me.y - a.y) * sy2) >= 0 ? 1 : -1; walkTo(a.x + dx / d * 4.5 + sx2 * sg * 2.5, a.y + dy / d * 4.5 + sy2 * sg * 2.5); return; }
        const an = T.GEO.anchors.filter(q => good ? q.el !== A.el : q.el === A.el).sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y))[0];
        const ux = an.x - A.x, uy = an.y - A.y, ul = Math.hypot(ux, uy) || 1, c = T.S.A; let tx = an.x + ux / ul * 2.2, ty = an.y + uy / ul * 2.2; const k = Math.hypot(tx - c.cx, ty - c.cy); if (k > T.AR.R - 0.6) { tx = c.cx + (tx - c.cx) * (T.AR.R - 0.6) / k; ty = c.cy + (ty - c.cy) * (T.AR.R - 0.6) / k; }
        if (Math.hypot(me.x - A.x, me.y - A.y) < 2.2 && Math.hypot(me.x - an.x, me.y - an.y) > 3) { const px = me.x - A.x, py = me.y - A.y, pl = Math.hypot(px, py) || 1; walkTo(me.x + px / pl * 3 + (tx - me.x) * 0.3, me.y + py / pl * 3 + (ty - me.y) * 0.3); } else walkTo(tx, ty); };
      const B5 = (lead) => (Mx) => { const Dm = Mx.data, t = Mx.t, cur = Dm.sph.find(s => s.st === 'come'); if (!cur) return; const M0 = cur.mir; if (t >= cur.tA - lead) walkTo(M0.x, M0.y); else walkTo(M0.x, M0.y + 3.2); };
      const B6 = (Mx) => { const Dm = Mx.data, c0 = T.S.A, R = T.AR.R; if (Dm.stage === 1) { const B = Dm.beams; if (B.safe == null) return; const pa = Math.atan2(me.y - c0.cy, me.x - c0.cx), cand = [B.safe, B.safe + Math.PI].sort((p, q) => Math.abs(Math.atan2(Math.sin(p - pa), Math.cos(p - pa))) - Math.abs(Math.atan2(Math.sin(q - pa), Math.cos(q - pa))))[0]; walkTo(c0.cx + Math.cos(cand) * 4.5, c0.cy + Math.sin(cand) * 4.5); return; }
        if (Dm.stage === 2 && Dm.fi >= 0) { const F = Dm.forms[Dm.fi]; let b = null, bd = 1e9; for (const id of F.safe) { const q = T.cellNear(id, me.x, me.y); if (q.d < bd) { bd = q.d; b = q.p; } } if (b) walkTo(b.x, b.y); return; }
        if (Dm.stage === 3) { let w = null, wt = 1e9; for (const h of T.S.haz) { if (h.vis !== 'gapring' || h.hit) continue; const dd = Math.hypot(me.x - h.x, me.y - h.y), R0 = h.t > h.tell ? h.R || h.r0 : h.r0; if (R0 > dd + 0.5) continue; const eta = (h.tell - h.t) + (dd - R0) / (h.r1 - h.r0) * h.act; if (eta < wt) { wt = eta; w = h; } } if (w) { const dd = Math.max(3, Math.hypot(me.x - w.x, me.y - w.y)); let tx = w.x + Math.cos(w.gap) * dd, ty = w.y + Math.sin(w.gap) * dd; const k = Math.hypot(tx - c0.cx, ty - c0.cy); if (k > R - 1) { tx = c0.cx + (tx - c0.cx) * (R - 1) / k; ty = c0.cy + (ty - c0.cy) * (R - 1) / k; } walkTo(tx, ty); } return; }
        if (Dm.stage === 4 && Dm.frags) { const F = Dm.frags; const tgt = !Dm.got.F && !Dm.got.I ? (Math.hypot(F.F.x - me.x, F.F.y - me.y) < Math.hypot(F.I.x - me.x, F.I.y - me.y) ? F.F : F.I) : !Dm.got.F ? F.F : !Dm.got.I ? F.I : { x: c0.cx, y: c0.cy }; walkTo(tgt.x, tgt.y); } };
      const GOOD = [null, B1, B2, B3(true), B4(true), B5(1.5), B6], BAD = [null, still, F2, B3(false), B4(false), B5(3.0), still];`;
    for (const R of RUNS) {
      const failK = /^f\d$/.test(R) ? +R[1] : 0, last = R === RUNS[RUNS.length - 1];
      const r = await H.ev(BOTS + `
        const failK = ${failK}, boost = ${R === 'skip' ? 1e6 : BOOST}; const s0 = T.S; me.dead = false; me.inv = 0; const RS = P.riftState(); RS.gates.sepulchre = 0; delete P.st.animas.have.gemini;
        if (!window.__gbWin0) window.__gbWin0 = s0.X.winStage; s0.X.winStage = ${last} ? window.__gbWin0 : () => { window.__gbWins = (window.__gbWins || 0) + 1; };
        GB.begin(s0.X, s0.H, s0.self, s0.A); const SS = T.S, P0 = SS.X.ST(); me.hp = P0.hp;  let t = 0, hitT = 0, refills = 0, seq = [], lastMode = '', phases = [], won = false, deadAt = null, mechOrder = [];
        while (t < 3600) { const s = T.S; if (!s) break; const mode = s.mode; if (mode !== lastMode) { seq.push(mode + '@' + t.toFixed(1)); lastMode = mode; } if (phases[phases.length - 1] !== s.phase) phases.push(s.phase);
          if (mode === 'mech' && s.mech) { const id = s.mech.id; if (mechOrder[mechOrder.length - 1] !== id) mechOrder.push(id); (failK === id ? BAD[id] : GOOD[id])(s.mech, t); }
          if (mode === 'fight' && !me.dead) { hitT -= dt; if (hitT <= 0) { hitT += 0.32; D.hitMon(s.m, P0.atk * boost, { noCrit: true, src: 'normal' }); } hold(s.m.x, s.m.y + 5.5); }
          if (mode === 'dead' && deadAt == null) deadAt = t;
          if (me.hp < P0.hp * 0.45 && !me.dead && mode !== 'paradox') { me.hp = P0.hp; refills++; }
          if (me.dead && mode !== 'paradox') { me.dead = false; me.hp = P0.hp; refills += 10; }
          U.update(dt); t += dt; if (s.mode === 'over') { won = true; break; } }
        if (${last}) step(3.5, null, dt);
        const S2 = SS; return { t: +t.toFixed(1), res: S2.res.slice(1), failN: S2.failN, fails: S2.stat.fails, seq: seq.slice(0, 40).join(' '), phases: phases.join(''), mechOrder: mechOrder.join(''), revive: S2.stat.revive, lockSaves: S2.stat.lockSaves, refills, deadAt: deadAt == null ? null : +deadAt.toFixed(1), won, mode: S2.mode,
          have: P.st.animas.have.gemini || 0, gate: RS.gates.sepulchre || 0, gpu: typeof RAZIEL_GL !== 'undefined' ? RAZIEL_GL.gpuCount() : -1, maxHaz: S2.stat.maxHaz, dmgIn: Math.round(S2.stat.dmgIn), mechT: Object.keys(S2.stat.mechT).map(k => k + ':' + (S2.stat.mechT[k].end - S2.stat.mechT[k].start).toFixed(1)).join(' ') };`);
      console.log(R, JSON.stringify(r));
      const exp = failK ? 1 : 0;
      chk(r.res.every(x => x === 'pass' || x === 'fail') && r.res.filter(x => x === 'fail').length === exp && r.failN === exp, R + ': six results, ' + exp + ' failure(s)');
      chk(r.phases === '12345', R + ': phases in order');
      chk(r.mechOrder === '123456', R + ': mechanics in order');
      chk(r.won && r.deadAt != null, R + ': the victory');
    }
    // the reward through the gate's own finish (X.winStage -> 21b gateFinish): give it its real time
    await H.page.waitForTimeout(2500);
    const rw = await H.M(() => { const P = window.__pp, RS = P.riftState(); return { gate: RS.gates.sepulchre || 0, have: P.st.animas.have.gemini || 0, arc: P.arc.state }; });
    console.log('reward', JSON.stringify(rw)); chk(rw.gate === 1 && rw.have >= 1, 'the Gemini Anima unlocked by the gate');
    // a repeat completion: no second unlock (the gate's own finish: 'Trial completed again', the lesser crystals)
    { const c0 = await H.M(() => ({ cr: window.__pp.st.crystals || 0, have: window.__pp.st.animas.have.gemini })); await H.M(() => { window.__GB_NOBOSS = 1; window.__pp.arc.paused = false; });
      await H.start({ noBoss: true }); await H.ev(`step(5, null, 1 / 30); return 1;`); await H.page.waitForTimeout(2500);
      const c1 = await H.M(() => ({ cr: window.__pp.st.crystals || 0, have: window.__pp.st.animas.have.gemini, gate: window.__pp.riftState().gates.sepulchre, panel: (document.querySelector('.dun-end h2') || {}).textContent || '' }));
      console.log('repeat', JSON.stringify({ c0, c1 })); chk(c1.have === c0.have && c1.cr - c0.cr <= 30, 'a repeat win adds no second unlock'); }
  } catch (e) { bad++; console.log('ERR', e.message); }
  console.log('errors', JSON.stringify(H.errors.slice(0, 6)));
  await H.browser.close(); console.log(bad || H.errors.length ? 'FULL FAIL' : 'FULL OK');
})();
