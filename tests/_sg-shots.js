// v445 AG: the Gate of Scorpio's extra views: the 2D fallback (no GPU painter: window.__NG_GL = 0) and lowFx, in the courtyard
// and in the sanctum; a studio sheet of every picture (SCORPIO_PROPS); and the GPU painter's copies a frame (the PERF line's
// "GL copies n/frame") in the courtyard and in the sanctum (the stand-in, and the real SCORPIO_BOSS when it is built in).
// HTML=<test build> node tests/_sg-shots.js   (writes shots/v445-AG/{nogl,lowfx}-*-dprN.png, studio-dprN.png; DPR=3; ONLY=nogl,lowfx,studio,perf)
const { open } = require('./_sg-lib');
const DPR = +(process.env.DPR || 1), tag = DPR === 1 ? 'dpr1' : 'dpr' + DPR, ONLY = (process.env.ONLY || 'nogl,lowfx,studio,perf').split(',');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const copies = (M, n) => M(async n => { const P = window.PERF; for (let i = 0; i < 3; i++) await new Promise(r => requestAnimationFrame(r)); const a0 = P.cpAcc; for (let i = 0; i < n; i++) await new Promise(r => requestAnimationFrame(r)); return +((P.cpAcc - a0) / n).toFixed(2); }, n);
(async () => {
  for (const mode of ['nogl', 'lowfx']) { if (!ONLY.includes(mode)) continue;
    const T = await open({ dpr: DPR, lowFx: mode === 'lowfx' }); const { M, runG, goTo, until, errors } = T;
    await M(m => { window.__NG_GL = m === 'nogl' ? 0 : 1; window.__SG_BOSS = window.SCORPIO_GATE.STANDIN; }, mode);
    await T.start(); await until('m.R.mode === "play"', 0, 60);
    await goTo(21.0, 27.2); await runG(1.6); await T.shot('v445-AG', `${mode}-vigil-${tag}`);
    await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.solve()); await goTo(17.5, 27.0); await until('m.S.openT > 4.6', 0, 200); await T.shot('v445-AG', `${mode}-door-${tag}`);
    await until('m.S.phase === "open"', 0, 200); await goTo(17.5, 20.4); await until('m.S.phase === "boss"', 0, 60);
    await until('window.SCORPIO_GATE.STANDIN.S && window.SCORPIO_GATE.STANDIN.S.m', 0, 30); await M(() => { const m = window.SCORPIO_GATE.STANDIN.S.m; m.x = 28.0; m.y = 15.5; m.aggro = false; m.stunT = 999; });
    await goTo(17.5, 11.0); await runG(1.6); await T.shot('v445-AG', `${mode}-arena-${tag}`);
    ok(!errors.length, `${mode}: no page errors ` + errors.slice(0, 3).join(' | '));
    await M(() => window.__pp.closeArcade(true)); await T.browser.close(); }
  // the studio sheet: every picture on a dark ground
  if (ONLY.includes('studio')) { const T = await open({ dpr: DPR }); await T.page.setViewportSize({ width: 1200, height: 900 });
    await T.M(() => { const A = window.SCORPIO_PROPS; A.setBase(56); const cv = document.createElement('canvas'), k = window.devicePixelRatio || 1; cv.width = 1200 * k; cv.height = 900 * k; cv.style.cssText = 'position:fixed;left:0;top:0;width:1200px;height:900px;z-index:99999'; document.body.appendChild(cv); const c = cv.getContext('2d'); c.scale(k, k);
      const g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, '#1A0E1E'); g.addColorStop(1, '#2A1A22'); c.fillStyle = g; c.fillRect(0, 0, 1200, 900); const P = Math.round(56 * k), at = (n, v, x, y, o) => { const s = A.sprite(n, v, P); if (!s) return; o = o || {}; c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot); if (o.sx) c.scale(o.sx, 1); c.drawImage(s.cv, -s.ax / k, -s.ay / k, s.cv.width / k, s.cv.height / k); c.restore(); };
      for (const [n, v, x, y] of [['watch', 0, 70, 260], ['chime', 0, 170, 260], ['altar', 0, 260, 260], ['shard', 0, 260, 180], ['post', 0, 340, 260], ['pillar', 0, 420, 260], ['pillar', 1, 500, 260], ['pillar', 2, 590, 260], ['statue', 0, 680, 260], ['statue', 1, 790, 260], ['rock', 0, 900, 260], ['rock', 1, 980, 260], ['star', 0, 1080, 200], ['tseg', 0, 1060, 260], ['sting', 0, 1130, 260],
        ['crown', 0, 700, 640], ['col', 0, 520, 860], ['col', 1, 620, 860], ['col', 2, 740, 860], ['frag', 0, 860, 860], ['frag', 1, 930, 860], ['frag', 2, 980, 860]]) at(n, v, x, y);
      // the great door as the gate lays it: the leaves, the frame, the arms (closed), the tail coiled, the sting and the star
      const G = A.GEO, X0 = 230, Y0 = 840, T = 56; at('leaf', 'l', X0, Y0); at('leaf', 'r', X0, Y0); at('door', 0, X0, Y0); at('arm', 0, X0 - G.sh[0] * T, Y0 - G.sh[1] * T, { rot: -0.29 }); at('arm', 0, X0 + G.sh[0] * T, Y0 - G.sh[1] * T, { rot: 0.29, sx: -1 });
      const L = A.TAIL; let x = X0, y = Y0 - G.tail[1] * T, a = -Math.PI / 2 - 0.78; const pts = [[x, y]]; for (let i = 0; i < L.length; i++) { x += Math.cos(a) * L[i] * T; y += Math.sin(a) * L[i] * T; pts.push([x, y, a]); a += 0.62; }
      for (let i = 0; i < L.length; i++) { const p = pts[i], q = pts[i + 1], s = A.sprite('tseg', 0, Math.round(P * L[i] / 0.62)); if (!s) continue; c.save(); c.translate(p[0], p[1]); c.rotate(Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2); c.drawImage(s.cv, -s.ax / k, -s.ay / k, s.cv.width / k, s.cv.height / k); c.restore(); }
      { const p = pts[pts.length - 1], s = A.sprite('sting', 0, Math.round(P * 0.9)); if (s) { c.save(); c.translate(p[0], p[1]); c.rotate(a + Math.PI / 2); c.drawImage(s.cv, -s.ax / k, -s.ay / k, s.cv.width / k, s.cv.height / k); c.restore(); } const st = A.sprite('star', 0, Math.round(P * 0.8)); if (st) c.drawImage(st.cv, p[0] + Math.cos(a) * T * 0.62 - st.ax / k, p[1] + Math.sin(a) * T * 0.62 - st.ay / k, st.cv.width / k, st.cv.height / k); }
      const m = A.sprite('moon', 0, Math.round(40 * k)); if (m) c.drawImage(m.cv, 1080 - m.ax / k, 600 - m.ay / k, m.cv.width / k, m.cv.height / k); });
    await T.shot('v445-AG', `studio-${tag}`); ok(!T.errors.length, 'studio: no page errors ' + T.errors.slice(0, 2).join(' | ')); await T.browser.close(); }
  // the GPU painter's copies a frame: the courtyard, the sanctum with the stand-in and (when built in) with Asmodeus himself
  if (ONLY.includes('perf')) { const out = {};
    for (const who of ['standin', 'boss']) { const T = await open({ dpr: DPR }); const { M, runG, goTo, until } = T; const has = await M(() => typeof SCORPIO_BOSS !== 'undefined' && !!SCORPIO_BOSS); if (who === 'boss' && !has) { await T.browser.close(); continue; }
      await M(w => { window.__NG_GL = 1; if (w === 'standin') window.__SG_BOSS = window.SCORPIO_GATE.STANDIN; }, who); await T.start(); await until('m.R.mode === "play"', 0, 60);
      if (who === 'standin') { await goTo(21.0, 28.0); await runG(1.0); out.vigil = await copies(M, 20); }
      await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.solve()); await until('m.S.phase === "open"', 0, 200); await goTo(17.5, 20.4); await until('m.S.phase === "boss"', 0, 60); await goTo(17.5, 16.0); await runG(6.0);
      out['sanctum-' + who] = await copies(M, 20); await M(() => window.__pp.closeArcade(true)); await T.browser.close(); }
    console.log('GL copies a frame', JSON.stringify(out)); ok(Object.keys(out).length >= 2, 'perf: copies measured ' + JSON.stringify(out)); }
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
