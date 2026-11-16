// Nhalu (B4): a studio portrait of the GLM eel (one GPU draw each, no game running): a curved swim pose in shallow water
// and a beached pose, over a plain floor -> shots/bel-b4-studio-*.png. usage: node tests/_bel-b4-studio.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 640, height: 420 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-belB4.html')); await p.waitForFunction(() => window.__pp, null, { timeout: 300000 });
  for (const pose of (process.env.POSES || 'swim,beached').split(',')) {
    const url = await p.evaluate(pose => { window.__NHALU_GL = 1; window.__NHALU_GLHQ = 1; const MD = window.__pp.FIEND_DEFS.belnhalu.NHALU.MODEL, W = 640, H = 420, T = 52;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2A4A52'); g.addColorStop(1, '#1A3238'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(16,40,44,.6)'; c.lineWidth = 2; for (let y = 0; y < H; y += T * 1.2) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      const beached = pose === 'beached', pts = [], rolls = [];
      for (let k = 0; k < MD.NSP; k++) { const s = k * MD.DS; pts.push([-s * 0.92, Math.sin(s * 0.9 + 0.4) * 1.1 - 0.45, MD.RAD(s) * MD.ZSQ * (beached ? 0.6 : 0.8)]); rolls.push(beached ? 0.55 : 0); }
      const P = { pts, rolls, yaw: 0.15, pitch: beached ? 0.3 : 0.1, jaw: beached ? 0.6 : 0.25, bulb: beached ? [0.18, 0.18, 0.18] : [0.62, 2.1, 0.62], sym: [1, 2, 3], burst: [0, 0, 0], chg: beached ? 0 : 0.3, dry: beached ? 0.8 : 0, dead: 0, fin: 1, tailYaw: 0.25, clip: beached ? null : 0.21 };
      const R = MD.draw(c, W * 0.72, H * 0.45, P, { T, sx: x => x, sy: y => y, t: 3.3 }); return R.drawn ? cv.toDataURL('image/png') : null; }, pose);
    if (url) require('fs').writeFileSync(path.resolve(__dirname, `../shots/bel-b4-studio-${pose}.png`), Buffer.from(url.split(',')[1], 'base64')); console.log(pose, url ? 'ok' : 'not drawn'); }
  console.log('errors', errs.slice(0, 3)); await b.close(); })();
