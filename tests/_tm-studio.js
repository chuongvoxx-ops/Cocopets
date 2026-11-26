// (v451 TM, v454 TM2) Tiamat's studio sheet: the lightning dragon on GLM (forced on the software rasteriser) in a turnaround and in the sequence's
// key poses (forming, hovering, roaring with the charge running up, the charge in its jaws, folding, diving, the impact's break-up),
// on a dark floor and on a pale one, at DPR 1 (DPR=3 for the phone's). NOGL=1: the painted fallback from the same poses.
// usage: HTML=test-tm.html [DPR=1] [NOGL=1] [HERO=1] node tests/_tm-studio.js [out.png]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const dpr = +(process.env.DPR || 1), nogl = process.env.NOGL === '1', hero = process.env.HERO === '1';
  const out = process.argv[2] || path.resolve(__dirname, '../shots/' + (process.env.SHOTDIR || 'v454-TM2') + '/' + (hero ? 'studio-hero' : 'studio') + (nogl ? '-2d' : '') + '-dpr' + dpr + '.png');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: dpr });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (/Tiamat|GLM/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => { window.__NG_GL = 1; window.__TM_GL = 1; window.__TM_GLHQ = 1; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 30000 });
  const info = await page.evaluate(([dpr, nogl, hero]) => {
    const G = self.TIAMAT_GL; G.init(); const cv = document.createElement('canvas'); cv.width = 1200 * dpr; cv.height = 1200 * dpr; cv.style.cssText = 'position:fixed;left:0;top:0;width:1200px;height:1200px;z-index:99999'; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#0d1022'; c.fillRect(0, 0, 1200, 1200);
    const lib = window.__pp.ELEM_IMPL.thunder.ult.tiamat.lib, TU = lib.TUNE, S = { yaw: 0.4, H: { x: 0, y: 0, z: 0 }, Rimp: { x: 0, y: 0, z: 0.5 } };
    const form = t => Math.max(0, Math.min(1.5, (t - TU.form0) / (TU.form1 - TU.form0) * 1.5)), charge = t => (t < TU.charge0 ? 0 : t < TU.charge1 ? 0.02 + 1.03 * (t - TU.charge0) / (TU.charge1 - TU.charge0) : 1.15);
    let ok = 0; const drawP = (P, X0, Y0, k, o) => { P.x = P.x || 0; P.y = P.y || 0; P.z = P.z == null ? 0 : P.z; G.pose(P); const oo = Object.assign({ X0, Y0, k, t: 3, glow: 1 }, o || {}); if (!nogl && G.draw(c, oo)) ok++; else { G.draw2D(c, oo); } };
    const label = (s, x, y) => { c.fillStyle = '#9fb8ff'; c.font = '14px sans-serif'; c.fillText(s, x, y); };
    if (hero) { const P = lib.poseAt(S, 1.0); P.x = 0; P.y = 0; P.z = 0; P.yaw = Math.PI - 0.12; drawP(P, 640, 400, 110, { jaw: P.jaw }); const P2 = lib.poseAt(S, 2.0); P2.x = P2.y = 0; P2.z = 0; P2.yaw = 0.4; drawP(P2, 620, 920, 85, { charge: charge(2.0), glow: 1.3, jaw: P2.jaw }); return { ok, nv: G.nv, ntri: G.ntri, stats: G.STATS }; }
    const cell = (i, j) => [40 + j * 380 + 190, 30 + i * 290 + 175];
    // row 0..1: a turnaround of the hovering pose (wings spread)
    const views = [['in game (profile, 3/4)', 0.4], ['side', 0], ['back 3/4', -Math.PI / 2 + 0.6], ['in game (pale floor)', 0.4], ['front 3/4', Math.PI / 2 - 0.5], ['other side', Math.PI]];
    views.forEach(([nm, yaw], j) => { const [X0, Y0] = cell(Math.floor(j / 3), j % 3); if (j === 3) { c.fillStyle = '#7d8aa6'; c.fillRect(X0 - 190, Y0 - 175, 380, 290); }
      const P = lib.poseAt(S, 1.0); P.yaw = yaw; P.x = 0; P.y = 0; P.z = 0; drawP(P, X0, Y0, 34, { form: 2 }); label(nm, X0 - 180, Y0 - 155); });
    // rows 2..3: the sequence's key poses
    const seq = [['forming', 0.95], ['roar (charge in the tail)', 1.6], ['roar (charge at the chest)', 1.85], ['charge in the jaws', 2.15], ['folding', 2.4], ['diving', 2.72]];
    seq.forEach(([nm, t], j) => { const [X0, Y0] = cell(2 + Math.floor(j / 3), j % 3); const P = lib.poseAt(S, t); P.x = 0; P.y = 0; P.z = 0; drawP(P, X0, Y0, 34, { form: form(t), charge: charge(t), glow: 1 + 0.6 * Math.min(1, charge(t)), jaw: P.jaw }); label(nm, X0 - 180, Y0 - 155); });
    return { ok, nv: G.nv, ntri: G.ntri, stats: G.STATS };
  }, [dpr, nogl, hero]);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 1200 } });
  console.log(out, JSON.stringify(info), errors.slice(0, 5)); await browser.close();
})();
