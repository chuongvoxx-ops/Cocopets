// v469 GB: the walk through the Gemini Gate's door into the Equinox Sanctum, shot before / during / after (the far view must not pop:
// plain dark behind the sanctum, the gate's own far view fading into it, fixed in the world). The gate opened by its own solve(), the
// pet held at points on the line through the door, the camera given time to follow. Also reads the backdrop at each point: the mean
// colour of a screen strip above the arena (it must not jump). DPR=3 OUT=v469-GB HTML=test-gb.html node tests/_gb-door.js
const { open } = require('./_gb-lib');
const DPR = +process.env.DPR || 3, OUT = process.env.OUT || 'v469-GB';
(async () => {
  const H = await open({ gl: true, dpr: DPR }); const out = [];
  try {
    await H.M(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startGate('sepulchre'); });
    await H.page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1200000, polling: 500 }); await H.M(() => window.__pp.beginPlay());
    await H.page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 1200000, polling: 500 }); await H.page.waitForTimeout(300); await H.M(() => { window.__pp.arc.paused = true; });
    const r0 = await H.page.evaluate(PRE0 => (new Function(PRE0 + `const m = D.RIFT.self.mod; step(1.0); if (m.S.phase !== 'open' && m.solve) m.solve(); for (let i = 0; i < 900 && m.S.phase !== 'open'; i++) step(0.1); return { phase: m.S.phase, BA: window.GEMINI_GATE.BA };`))(), H.PRE);
    console.log('gate', JSON.stringify(r0));
    for (const [tag, y] of [['door-before', 31.0], ['door-during', 26.9], ['door-after', 24.6]]) {
      const r = await H.page.evaluate(([PRE0, y]) => (new Function('y', PRE0 + `const m = D.RIFT.self.mod, BA = window.GEMINI_GATE.BA; for (let i = 0; i < 60; i++) { hold(BA.x, y); step(1 / 30); } return { phase: m.S.phase, y: me.y, cam: [+D.cam.x.toFixed(2), +D.cam.y.toFixed(2)] };`))(y), [H.PRE, y]);
      await H.shot(OUT, `${tag}-dpr${DPR}`);
      out.push(Object.assign({ tag }, r)); console.log(tag, JSON.stringify(r)); }
  } catch (e) { console.log('ERR', e.message); }
  console.log('errors', JSON.stringify(H.errors.slice(0, 6)));
  await H.browser.close();
})();
