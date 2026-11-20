// (v433 DA) Sarrukh the Bloom Serpent: a studio of the GPU model (one GLM draw each, no game running): its art poses (the wake, the
// breach, surfaced to spit, forced up in bloom) and a few headings and blooms, over a plain sand floor; the Resonator Spire's cracking.
// -> shots/v433-DA/studio-*.png and studio-sheet.png.  usage: HTML=test-da.html node tests/_da-studio.js   env: DPR (1), ONLY (a name filter)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '../shots/v433-DA'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const p = await b.newPage({ viewport: { width: 640, height: 560 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (/Sarrukh|GLM/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-da.html')); await p.waitForFunction(() => window.__pp, null, { timeout: 300000 });
  const W = 600, H = 520, T = +(process.env.T || 24), dpr = +(process.env.DPR || 1), only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
  const shots = [
    ['surf-closed', { mem: { demo: 'surf', hd: 1.57, menace: 1, bloom: 0, wind: 0 }, y: 0.78 }],
    ['surf-swell', { mem: { demo: 'surf', hd: 1.57, menace: 1, jaw: 1, bloom: 0.45, wind: 0.8 }, y: 0.78 }],
    ['surf-side', { mem: { demo: 'surf', hd: 0.2, menace: 0.5, bloom: 0.2 }, y: 0.78 }],
    ['lie-bloom', { mem: { demo: 'lie', hd: 1.57, lie: 1, jaw: 1, bloom: 1 }, y: 0.62 }],
    ['arc', { mem: { demo: 'arc', hd: 1.0, arcProg: 4.2, bloom: 0.12 }, y: 0.62 }],
    ['arc-side', { mem: { demo: 'arc', hd: 0.05, arcProg: 6.5, bloom: 0.12 }, y: 0.6 }],
    ['under', { mem: { demo: 'under', hd: 0.3, menace: 0.6, spd: 6 }, y: 0.55 }],
    ['under-peek', { mem: { demo: 'under', hd: 1.2, peek: 0.9, bloom: 0.3, menace: 0.8 }, y: 0.6 }],
    ['head-closed', { mem: { demo: 'surf', hd: 1.0, menace: 0.6, bloom: 0, wind: 0 }, y: 0.9, T: 46 }],
    ['head-side', { mem: { demo: 'surf', hd: 0.05, menace: 0.6, bloom: 0.1, wind: 0 }, y: 0.9, T: 46 }],
    ['bloom-hero', { mem: { demo: 'surf', hd: 1.57, menace: 1, jaw: 1, bloom: 1, wind: 0 }, y: 1.08, T: 40 }],
    ['bloom-lie-hero', { mem: { demo: 'lie', hd: 1.3, lie: 1, jaw: 1, bloom: 1 }, y: 0.82, T: 40 }]];
  const urls = [];
  for (const [name, s] of shots) { if (only && !only.test(name)) continue;
    const t0 = Date.now();
    const url = await p.evaluate(([s, W, H, T, dpr]) => { window.__SAR_GL = 1; window.__SAR_GLHQ = 1; const MD = window.__pp.FIEND_DEFS.sarrukh.MODEL;
      const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#C99A58'); g.addColorStop(1, '#B6864A'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(110,70,25,.18)'; c.lineWidth = 1; for (let y = 0; y < H; y += (s.T || T)) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      const R = MD.studio(c, W * 0.5, H * s.y, s.mem, { T: s.T || T, t: 2 }); return R ? cv.toDataURL('image/png') : null; }, [s, W, H, T, dpr]);
    console.log(name, url ? 'ok' : 'NOT DRAWN', ((Date.now() - t0) / 1000).toFixed(1) + ' s');
    if (url) { const f = path.join(OUT, `studio-${name}.png`); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); urls.push(f + '=' + name); } }
  if (!only || only.test('spire')) { const url = await p.evaluate(([T]) => { const MD = window.__pp.FIEND_DEFS.sarrukh.MODEL, W = 600, H = 300; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'); c.fillStyle = '#C99A58'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 4; i++) MD.studioSpire(c, 75 + i * 150, H * 0.85, i, { T: T * 1.4, glow: i ? 0.4 : 1 }); return cv.toDataURL('image/png'); }, [T]);
    const f = path.join(OUT, 'studio-spires.png'); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); urls.push(f + '=spires: whole .. cracked'); }
  const st = await p.evaluate(() => window.__pp.FIEND_DEFS.sarrukh.MODEL.__dbg.glStats); console.log('gl', JSON.stringify(st));
  console.log('errors', errs.length, errs.slice(0, 3)); await b.close();
  if (urls.length) require('child_process').execFileSync('python3', [path.join(__dirname, '_da-sheet.py'), 'studio', ...urls], { stdio: 'inherit' });
})();
