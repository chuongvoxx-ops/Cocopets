// (v423 GO) Orrubel the Seed-Mother: a studio turnaround of the GPU model (one GLM draw each, no game running): eight headings
// standing, then its poses (the crown parted, rearing, peeled open with the eye bared, the fall) over a plain moss floor.
// -> shots/v423-GO/studio-*.png and studio-sheet.png (one sheet).  usage: HTML=test-go.html node tests/_go-studio.js   env: DPR (1)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '../shots/v423-GO'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const p = await b.newPage({ viewport: { width: 600, height: 480 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (/Orrubel|GLM/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-go.html')); await p.waitForFunction(() => window.__pp, null, { timeout: 300000 });
  const W = 560, H = 460, T = 46, dpr = +(process.env.DPR || 1);
  const shots = [];
  for (let i = 0; i < 8; i++) shots.push([`turn-${i}`, { a: i / 8 * Math.PI * 2, over: {} }]);
  shots.push(['parted', { a: -0.5, over: { part: 1, glow: 1.2 } }], ['rear', { a: 1.2, over: { pitch: 0.55, z: 0.6, part: 0.4, glow: 0.6 } }], ['open', { a: 1.3, over: { open: 1, eyeK: 1, glow: 1.4, look: [0.3, -0.2] } }], ['dig', { a: 0.6, over: { z: -0.2, rootGlow: 1.3, spill: 0.8 } }],
    ['fallen', { a: -0.3, over: { dead: 1, shed: 3, wither: 1, sink: 0.85, eyeK: 1, blink: 1, glow: 0, from: 'F' } }]);
  const urls = [];
  for (const [name, s] of shots) {
    const t0 = Date.now();
    const url = await p.evaluate(([s, W, H, T, dpr]) => { window.__ORB_GL = 1; window.__ORB_GLHQ = 1; const MD = window.__pp.FIEND_DEFS.orrubel.MODEL;
      const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3A2449'); g.addColorStop(1, '#22132C'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(134,201,178,.12)'; c.lineWidth = 1; for (let y = 0; y < H; y += T) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      const over = Object.assign({}, s.over);
      if (over.from === 'F') { // the fallen petals: their frames at the burst, from a standing rig
        const P0 = Object.assign(MD.blankPose(), { part: 0.6 }); const cv2 = document.createElement('canvas'); cv2.width = cv2.height = 8; const R = MD.studio(cv2.getContext('2d'), 4, 4, s.a, P0, { T: 2, shadow: false });
        over.from = R ? [0, 1, 2, 3, 4, 5].map(i => { const q = R.A['petA' + i]; return { RA: q.RA, oA: q.oA, RB: q.RB }; }) : null;
        over.eggs = [0, 1, 2, 3, 4, 5, 6].map(i => { const a = i / 7 * Math.PI * 2 + 0.3; return { free: true, x: Math.cos(a) * 2.7, y: Math.sin(a) * 2.7, z: 0.36, stalk: 0 }; }); }
      const R = MD.studio(c, W * 0.5, H * 0.74, s.a, over, { T }); return R ? cv.toDataURL('image/png') : null; }, [s, W, H, T, dpr]);
    console.log(name, url ? 'ok' : 'NOT DRAWN', ((Date.now() - t0) / 1000).toFixed(1) + ' s');
    if (url) { const f = path.join(OUT, `studio-${name}.png`); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); urls.push([name, f]); }
  }
  const st = await p.evaluate(() => { const MD = window.__pp.FIEND_DEFS.orrubel.MODEL; return MD.__dbg.glStats; }); console.log('gl', JSON.stringify(st));
  console.log('errors', errs.length, errs.slice(0, 3)); await b.close();
  if (urls.length) require('child_process').execFileSync('python3', [path.join(__dirname, '_go-sheet.py'), 'studio', ...urls.map(u => u[1])], { stdio: 'inherit' });
})();
