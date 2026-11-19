// (v418 AB) Abaddon studio: renders the GPU model alone (turnarounds, forms, poses) on a plain night backdrop.
// usage: HTML=test-ab.html node tests/_ab-studio.js [out.png] [mode] [dpr]
//   mode: turn (front/side/back at k3 + the three forms), poses (shell, offensive, charging, eclipse, reaver, tide)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const OUT = process.argv[2] || 'shots/v418-AB/studio.png', MODE = process.argv[3] || 'turn', DPR = +(process.argv[4] || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const W = 1500, H = 900;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-ab.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 20000 });
  const r = await page.evaluate(({ MODE, W, H, DPR }) => {
    window.__AB_GL = 1; window.__AB_GLHQ = 1; const AB = window.ABADDON_GL;
    const cv = document.createElement('canvas'); cv.width = W * DPR; cv.height = H * DPR; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999`; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.scale(DPR, DPR);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05070F'); g.addColorStop(0.6, '#0C1430'); g.addColorStop(1, '#03050C'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const t0 = performance.now(); const ok = AB.ensure(); const tb = performance.now() - t0;
    const lab = (x, y, s) => { c.fillStyle = '#C9D4F2'; c.font = s.length > 14 ? '600 12px serif' : '600 15px serif'; c.textAlign = 'center'; c.fillText(s, x, y); };
    const cells = [];
    if (MODE === 'turn') {
      [[0, 'FRONT'], [Math.PI / 2, 'SIDE'], [Math.PI, 'BACK']].forEach(([yaw, n], i) => cells.push({ x: 195 + i * 300, y: 640, K: 23, k: 3, P: Object.assign(AB.idlePose(3, 0.7), { yaw }), n }));
      [1, 2, 3].forEach((k, i) => cells.push({ x: 1030 + i * 175, y: 560, K: [0, 14, 13, 12][k], k, P: AB.idlePose(k, 0.7), n: ['', 'SEALED MOONSHELL', 'CRESCENT WARDEN', 'ETERNAL MOONLIGHT'][k] }));
    } else if (MODE === 'trans') {
      c.fillStyle = '#FF2020'; for (let x = 0; x < W; x += 60) c.fillRect(x, 0, 20, H);
      const P = Object.assign(AB.idlePose(3, 2), { open: 1, spread: 0.8, align: 0.9, ringK: 4, heart: 2.7, heartOut: 1, heartGrow: 0.9, ringGlow: 1, glow: 0.3, heartPos: [0, 2.2, 12.2], alignAt: [0, 2.2, 12.2], k: 3 });
      AB.drawSea(c, [{ m: 'helix', X: 300, Y: 800, ph: 0, r: 200, h: 500, a: 0.8, i: 0 }], 1);
      cells.push({ x: 300, y: 760, K: 28, k: 3, P, n: 'after sea' });
      cells.push({ x: 900, y: 760, K: 28, k: 3, P: Object.assign({}, P), n: 'second' });
    } else if (MODE === 't9') {
      const P0 = (o) => Object.assign(AB.idlePose(3, 2), { open: 1, spread: 0.8, align: 0.9, ringK: 4, heart: 2.7, dark: 0, heartOut: 1, heartGrow: 0.9, ringGlow: 1, glow: 0.3, heartPos: [0, 2.2, 12.2], alignAt: [0, 2.2, 12.2], eye: 1, arm: [0, 1].map(() => ({ swing: 0.35, raise: 0.35, ext: 1, claw: -0.35, edge: 0 })), k: 3 }, o);
      cells.push({ x: 250, y: 700, K: 28, k: 3, P: P0({}), n: 'T9 full' }); cells.push({ x: 750, y: 700, K: 28, k: 3, P: P0({ heartGrow: 0 }), n: 'no grow' }); cells.push({ x: 1200, y: 700, K: 28, k: 3, P: P0({ heartOut: 0, align: 0 }), n: 'heart home' });
    } else {
      const mk = (o) => Object.assign(AB.idlePose(3, 1.3), o);
      const L = [
        ['DEFENSIVE (SHELL)', mk({ open: 0, fold: 1, heart: 1.2, seam: 0.8 })],
        ['OFFENSIVE (EXPANDED)', mk({ open: 1, spread: 0.35, arm: [{ swing: 0.25, raise: 0.25, ext: 0.9, claw: -0.35 }, { swing: 0.25, raise: 0.25, ext: 0.9, claw: -0.35 }], glow: 0.4 })],
        ['CHARGING (ULTIMATE)', mk({ open: 1, spread: 1, align: 0.7, ringK: 3, heart: 2, heartOut: 0.6, heartPos: [0, 1.6, 10.6], ringGlow: 1, glow: 0.6, arm: [{ swing: 0.35, raise: 0.35, ext: 1, claw: -0.35 }, { swing: 0.35, raise: 0.35, ext: 1, claw: -0.35 }] })],
        ['ECLIPSE (BLACK MOON)', mk({ open: 0.25, fold: 0.6, dark: 1, heart: 1.5, seam: 1 })],
      ];
      L.forEach(([n, P], i) => cells.push({ x: 190 + i * 370, y: 640, K: 32, k: 3, P, n }));
    }
    const res = [];
    for (const C of cells) { const t1 = performance.now(); const o = AB.draw(c, { X: C.x, Y: C.y, K: C.K, P: C.P, k: C.k }); res.push([C.n, !!o, Math.round(performance.now() - t1)]); lab(C.x, C.y + 60, C.n); }
    return { ok, tb: Math.round(tb), nv: AB.nv, res, stats: AB.STATS, gl: window.GLM && GLM.stats };
  }, { MODE, W, H, DPR });
  console.log(JSON.stringify(r));
  await page.screenshot({ path: path.resolve(__dirname, '..', OUT) });
  console.log('errors', errors.length, errors.slice(0, 6));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
