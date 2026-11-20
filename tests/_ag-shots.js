// v435 AG: the Gate of Aries's extra views: the 2D fallback (no GPU painter: window.__NG_GL = 0) and lowFx, in the yard
// mid-pour and on the altar; and a studio sheet of every picture (ARIES_PROPS) and the two engine props.
// HTML=test-ag.html node tests/_ag-shots.js   (writes shots/v435-AG/{nogl,lowfx}-*-dprN.png and studio-dprN.png; DPR=3)
const { open } = require('./_ag-lib');
const DPR = +(process.env.DPR || 1), tag = DPR === 1 ? 'dpr1' : 'dpr' + DPR;
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  for (const mode of ['nogl', 'lowfx']) {
    const T = await open({ dpr: DPR, lowFx: mode === 'lowfx' }); const { M, runG, goTo, until, errors } = T;
    await M(m => { window.__AG_FAST = 1.5; window.__NG_GL = m === 'nogl' ? 0 : 1; }, mode);
    await T.start(); await until('m.R.mode === "play" && !!m.yard', 0, 60);
    await M(() => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; m.flip('A'); m.pour(); }); await goTo(15.0, 27.3); await until('m.R.run && m.R.run.trail.length > 14', 0, 60); await T.shot('v435-AG', `${mode}-yard-${tag}`);
    await until('!m.R.run', 0, 60);
    await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.solve()); await until('m.S.phase === "open"', 0, 200); await goTo(16.5, 19.4); await until('m.S.phase === "boss"', 0, 60);
    await until('window.ARIES_GATE.STANDIN.S && window.ARIES_GATE.STANDIN.S.m', 0, 30); await M(() => { const m = window.ARIES_GATE.STANDIN.S.m; m.x = 27.5; m.y = 15.0; m.aggro = false; m.stunT = 999; });
    await goTo(16.5, 9.0); await runG(1.6); await T.shot('v435-AG', `${mode}-arena-${tag}`);
    ok(!errors.length, `${mode}: no page errors ` + errors.slice(0, 3).join(' | '));
    await M(() => window.__pp.closeArcade(true)); await T.browser.close(); }
  // the studio sheet
  const T = await open({ dpr: DPR }); await T.page.setViewportSize({ width: 1200, height: 900 });
  await T.M(() => { const A = window.ARIES_PROPS; A.setBase(56); const cv = document.createElement('canvas'), k = window.devicePixelRatio || 1; cv.width = 1200 * k; cv.height = 900 * k; cv.style.cssText = 'position:fixed;left:0;top:0;width:1200px;height:900px;z-index:99999'; document.body.appendChild(cv); const c = cv.getContext('2d'); c.scale(k, k);
    c.fillStyle = '#2A2224'; c.fillRect(0, 0, 1200, 900); const P = Math.round(56 * k), at = (n, v, x, y, P2) => { const s = A.sprite(n, v, P2 || P); if (s) c.drawImage(s.cv, x - s.ax / k * (P / (P2 || P)) * ((P2 || P) / P), y - s.ay / k, s.cv.width / k, s.cv.height / k); };
    for (const [n, v, x, y] of [['crucible', 0, 110, 280], ['furnace', 0, 300, 280], ['lever', 0, 430, 250], ['handle', 0, 430, 230], ['ramsw', 0, 530, 250], ['rhorns', 0, 530, 228], ['kiln', 0, 650, 280], ['trough', 0, 780, 250], ['brazier', 0, 880, 270], ['shard', 0, 980, 250], ['shard', 1, 1060, 250], ['shard', 2, 1130, 250], ['door', 0, 230, 640], ['hornarch', 0, 650, 640], ['spire', 0, 960, 640], ['spire', 1, 1040, 640], ['spire', 2, 1130, 640]]) at(n, v, x, y);
    at('leaf', 'l', 230, 640); at('leaf', 'r', 230, 640); at('bar', 0, 230, 640 - 1.85 * 56); at('door', 0, 230, 640);
    const DW = window.__pp.DunWorld; for (const [kk, v, x] of [['agpillar', 0, 380], ['agpillar', 1, 450], ['agruin', 0, 520], ['agruin', 1, 590], ['agruin', 2, 680], ['agruin', 3, 760]]) { c.save(); c.translate(x, 470); c.scale(1 / k, 1 / k); DW.PROPS[kk](c, P, v); c.restore(); }
    const cl = A.sprite('cliff', 0, Math.round(30 * k)), cl1 = A.sprite('cliff', 1, Math.round(30 * k)); c.drawImage(cl.cv, 0, 900 - cl.cv.height / k, cl.cv.width / k, cl.cv.height / k); c.drawImage(cl1.cv, cl.cv.width / k, 900 - cl1.cv.height / k, cl1.cv.width / k, cl1.cv.height / k);
    const e = A.sprite('eclipse', 0, Math.round(60 * k)); c.drawImage(e.cv, 1060 - e.ax / k * 0.6, 820 - e.ay / k * 0.6, e.cv.width / k * 0.6, e.cv.height / k * 0.6); });
  await T.shot('v435-AG', `studio-${tag}`); ok(!T.errors.length, 'studio: no page errors'); await T.browser.close();
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
