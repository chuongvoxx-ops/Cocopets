// (v450 MD) Moby Dick's studio sheet: the spirit whale on GLM (forced on the software rasteriser) in a turnaround and in the
// sequence's key poses, on a dark floor, at DPR 1 (DPR=3 for the phone's). usage: HTML=test-md.html node tests/_md-studio.js [out.png]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const dpr = +(process.env.DPR || 1), out = process.argv[2] || path.resolve(__dirname, '../shots/v450-MD/studio-dpr' + dpr + '.png');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: dpr });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (/Moby/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(h => { window.__NG_GL = 1; window.__MD_GL = 1; window.__MD_GLHQ = 1; window.__HERO = h; }, !!process.env.HERO);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 30000 });
  const info = await page.evaluate((dpr) => {
    const G = self.MOBY_GL; G.init(); const cv = document.createElement('canvas'); cv.width = 1200 * dpr; cv.height = 1200 * dpr; cv.style.cssText = 'position:fixed;left:0;top:0;width:1200px;height:1200px;z-index:99999'; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#0b1026'; c.fillRect(0, 0, 1200, 1200);
    const L = self.ELEM_IMPL ? null : null; void L;
    const cells = [], lib = window.__pp.ELEM_IMPL.water.ult.mobydick.lib, TU = lib.TUNE;
    const views = [['side', { yaw: 0 }], ['3/4', { yaw: -0.7 }], ['front', { yaw: Math.PI / 2 }], ['back 3/4', { yaw: Math.PI + 0.7 }], ['top roll', { yaw: 0, roll: -1.2 }], ['belly', { yaw: 0, roll: 2.2 }]];
    const S = { path: { yaw: 0, B: { x: -4.4, y: 0 } }, T: { x: 0, y: 0 }, O: { x: 0, y: 0 }, rollS: -1 };
    const seq = [['breach', TU.breach + 0.08], ['rising', TU.breach + 0.35], ['apex', TU.breach + (TU.impact - TU.breach) * 0.5], ['rolled', TU.breach + (TU.impact - TU.breach) * 0.66], ['falling', TU.breach + (TU.impact - TU.breach) * 0.85], ['slam', TU.impact + 0.08]];
    let ok = 0; const k = 26;
    if (window.__HERO) { c.fillStyle = '#0b1026'; c.fillRect(0, 0, 1200, 1200); G.pose(Object.assign({ x: 0.6, y: 0, z: 1.2, fin: 0.7, jaw: 0.18, arch: 0.15, fluke: 0.25 }, { yaw: -0.35, roll: -0.25 })); G.draw(c, { X0: 600, Y0: 420, k: 130, t: 2, glow: 0.7 });
      G.pose({ x: 0.6, y: 0, z: 1.2, fin: 0.9, yaw: 0.25, roll: -1.15, arch: 0.3, tail: 0.4, fluke: 0.3 }); G.draw(c, { X0: 600, Y0: 980, k: 95, t: 2, glow: 0.7 }); return { hero: true, stats: G.STATS }; }
    const cell = (i, j) => [40 + j * 380 + 190, 40 + i * 290 + 175];
    views.forEach(([nm, o], j) => { const [X0, Y0] = cell(Math.floor(j / 3), j % 3); G.pose(Object.assign({ x: 0.6, y: 0, z: 1.2, fin: 0.6 }, o)); if (G.draw(c, { X0, Y0, k, t: 2, glow: 0.6 })) ok++; c.fillStyle = '#9fb8ff'; c.font = '14px sans-serif'; c.fillText(nm, X0 - 170, Y0 - 150); });
    seq.forEach(([nm, t], j) => { const [X0, Y0] = cell(2 + Math.floor(j / 3), j % 3); const P = lib.poseAt(S, t); P.x += 0; G.pose(P); c.fillStyle = 'rgba(20,40,90,0.6)'; c.fillRect(X0 - 185, Y0 + 30, 370, 3); if (G.draw(c, { X0, Y0: Y0 + 30, k: k * 0.62, t: 2, clip: true, glow: 0.8, glow2: nm === 'slam' ? 0.6 : 0 })) ok++; c.fillStyle = '#9fb8ff'; c.font = '14px sans-serif'; c.fillText(nm, X0 - 170, Y0 - 150); });
    return { ok, nv: G.nv, ntri: G.ntri, stats: G.STATS };
  }, dpr);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 1200 } });
  console.log(JSON.stringify(info), errors.slice(0, 5)); await browser.close();
})();
