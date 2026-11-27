// v469 GB: the whole encounter to its reward, fast: Raziel struck at BOOST x the reference pace (default 10) so the fight runs through
// all five phases in a few game minutes; the judgements answered by bots; the pet's health topped up below 45% (survival is
// tests/_gb-tune.js's). Checks: phases 1..5 in order, both judgements in the rotation, the defeat cinematic, X.winStage -> 21b's
// gateFinish: the Gemini Anima unlocked (RS.gates.sepulchre, st.animas.have.gemini); a repeat win adds no second unlock; GPU
// buffers 0 after. FPS=30. HTML=test-gb.html node tests/_gb-full.js
const { open } = require('./_gb-lib');
const FPS = +process.env.FPS || 30, BOOST = +process.env.BOOST || 10;
(async () => {
  const H = await open({ lvl: 40 }); let bad = 0; const chk = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  try {
    await H.start(); await H.fight();
    const r = await H.ev(`
      const dt = 1 / ${FPS}, V = TU.VREF, walk = (x, y) => { const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); if (d < 1e-3) return; const k = Math.min(1, V * dt / d); me.x += dx * k; me.y += dy * k; me.vx = me.vy = 0; };
      const B1 = (Mx) => { const D = Mx.data; if (D.phase !== 'wave') return; const W = D.w, told = W.cancelAt == null || W.told; if (!told) { const f = D.san.find(q => q.el === 'fire'), i = f && D.san.find(q => q.el === 'ice' && Math.hypot(q.x - f.x, q.y - f.y) < 6); if (f && i) walk((f.x + i.x) / 2, (f.y + i.y) / 2); return; } if (T.S.prot === Mx.need) return; let b = null, bd = 1e9; for (const q of D.san) if (q.el === Mx.need) { const d = Math.hypot(q.x - me.x, q.y - me.y); if (d < bd) { bd = d; b = q; } } if (b) walk(b.x, b.y); };
      const B2 = (Mx) => { const D = Mx.data; if (D.ex < 0) return; const want = D.pats[D.order[D.ex]].s; let b = null, bd = 1e9; for (const i of want) { const q = T.secNear(i, me.x, me.y, 0.9); if (q.d < bd) { bd = q.d; b = q.p; } } if (b) walk(b.x, b.y); };
      const RS = P.riftState(); RS.gates.sepulchre = 0; delete P.st.animas.have.gemini; const s0 = T.S; me.dead = false; GB.begin(s0.X, s0.H, s0.self, s0.A); const SS = T.S, P0 = SS.X.ST(); me.hp = P0.hp;
      let t = 0, hitT = 0, phases = [], bigs = [], last = null, deadAt = null;
      while (t < 1800) { const s = T.S; if (!s) break; if (phases[phases.length - 1] !== s.phase) phases.push(s.phase); const id = s.mech ? s.mech.id : null; if (id && id !== last) bigs.push(id); last = id;
        if (s.mech) (s.mech.id === 1 ? B1 : B2)(s.mech); else if (s.mode === 'fight') hold(s.m.x, s.m.y + 5.5);
        if (s.mode !== 'intro' && s.mode !== 'dead') { hitT -= dt; if (hitT <= 0) { hitT += 0.32; D.hitMon(s.m, P0.atk * ${BOOST}, { noCrit: true, src: 'normal' }); } }
        if (s.mode === 'dead' && deadAt == null) deadAt = t; if (me.hp < P0.hp * 0.45) me.hp = P0.hp; if (me.dead) { me.dead = false; me.hp = P0.hp; }
        U.update(dt); t += dt; if (s.mode === 'over') break; }
      step(3.5, null, dt);
      return { t: +t.toFixed(1), phases: phases.join(''), bigs: bigs.join(''), deadAt: deadAt == null ? null : +deadAt.toFixed(1), miss: SS.stat.miss, clean: SS.stat.clean, gpu: RAZIEL_GL.gpuCount() };`);
    console.log('fight', JSON.stringify(r));
    chk(r.phases === '12345', 'phases in order'); chk(/1/.test(r.bigs) && /2/.test(r.bigs), 'both judgements in the rotation'); chk(r.deadAt != null, 'the defeat'); chk(r.gpu === 0, 'GPU buffers 0 after');
    await H.page.waitForTimeout(2500);
    const rw = await H.M(() => { const P = window.__pp, RS = P.riftState(); return { gate: RS.gates.sepulchre || 0, have: P.st.animas.have.gemini || 0, arc: P.arc.state }; });
    console.log('reward', JSON.stringify(rw)); chk(rw.gate === 1 && rw.have >= 1, 'the Gemini Anima unlocked by the gate');
    { const c0 = await H.M(() => ({ cr: window.__pp.st.crystals || 0, have: window.__pp.st.animas.have.gemini })); await H.M(() => { window.__GB_NOBOSS = 1; window.__pp.arc.paused = false; });
      await H.start({ noBoss: true }); await H.ev(`step(5, null, 1 / 30); return 1;`); await H.page.waitForTimeout(2500);
      const c1 = await H.M(() => ({ cr: window.__pp.st.crystals || 0, have: window.__pp.st.animas.have.gemini, panel: (document.querySelector('.dun-end h2') || {}).textContent || '' }));
      console.log('repeat', JSON.stringify({ c0, c1 })); chk(c1.have === c0.have && c1.cr - c0.cr <= 30, 'a repeat win adds no second unlock'); }
  } catch (e) { bad++; console.log('ERR', e.message); }
  console.log('errors', JSON.stringify(H.errors.slice(0, 6)));
  await H.browser.close(); console.log(bad || H.errors.length ? 'FULL FAIL' : 'FULL OK');
})();
