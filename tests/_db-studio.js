// (v433 DB) Oneira and Thul-Ammon: studio portraits of the GPU models (one GLM draw each, no game running) over a plain sand floor.
// -> shots/v433-DB/studio-<boss>-*.png and a sheet.  usage: HTML=test-db.html BOSS=oneira|thulammon node tests/_db-studio.js   env: DPR (1), ONLY (a name)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '../shots/v433-DB'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const p = await b.newPage({ viewport: { width: 600, height: 520 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (/Oneira|Thul|GLM|DUNE3/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-db.html')); await p.waitForFunction(() => window.__pp, null, { timeout: 300000 });
  const dpr = +(process.env.DPR || 1), W = 560, H = 480;
  for (const boss of (process.env.BOSS || 'oneira,thulammon').split(',')) {
  const shots = [];
  if (boss === 'oneira') {
    for (let i = 0; i < 4; i++) shots.push([`turn-${i}`, { a: i / 4 * Math.PI * 2 + 0.4, over: { pet: [3, 7, 0.4] }, T: 62 }]);
    shots.push(['aim', { a: 1.2, over: { menace: 1, pores: 1.2, seam: 1, deep: 1.1, mglow: 0.4, aim: 1, pet: [2, 7, 0.4] }, T: 62 }], ['tip', { a: 0.6, over: { pitch: 0.42, hc: 5.2, pet: [2, 7, 0.4] }, T: 50 }], ['slump', { a: 1.0, over: { hc: 1.55, roll: 1.22, ext: 2.15, droop: 0.76, dizzy: 1, deep: 0.9, mglow: 0.6, slump: 1 }, T: 62 }], ['stone', { stone: true, lit: 1, ck: 1, T: 60 }], ['close', { a: 0.9, over: { pet: [2, 7, 0.4], menace: 0.5, pores: 0.9 }, T: 100, low: 1 }]);
  } else {
    shots.push(['front', { a: 0, over: {}, T: 26 }], ['wind', { a: 0, over: { menace: 1, demoWind: 1 }, T: 26 }], ['reach', { a: 0, over: { menace: 1, demoReach: 1 }, T: 26 }], ['sink', { a: 0, over: { sink: 1, dizzy: 1 }, T: 26 }], ['close', { a: 0, over: { menace: 0.6 }, T: 48, close: 1 }], ['anchor', { anchor: true, ck: 1, T: 70 }]);
  }
  const only = process.env.ONLY; const urls = [];
  for (const [name, s] of shots) { if (only && name !== only) continue;
    const t0 = Date.now();
    const url = await p.evaluate(([s, W, H, dpr, boss]) => { window.__DB_GL = 1; window.__DB_GLHQ = 1; const MD = window.__pp.FIEND_DEFS[boss].MODEL;
      const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, boss === 'oneira' ? '#D9B06A' : '#6F7A9A'); g.addColorStop(1, boss === 'oneira' ? '#B98C4C' : '#3E4664'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(80,50,20,.15)'; c.lineWidth = 1; for (let y = 0; y < H; y += s.T) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      let R = null; const T = s.T;
      if (s.stone) R = MD.studioStone(c, W * 0.5, H * 0.78, s.lit, s.ck, T);
      else if (s.anchor) R = MD.studioAnchor(c, W * 0.5, H * 0.7, s.ck, T);
      else R = MD.studio(c, W * (s.low ? 0.42 : 0.5), H * (boss === 'oneira' ? (s.low ? 1.25 : 0.97) : (s.close ? 0.8 : 0.62)), s.a, s.over, { T });
      return R ? cv.toDataURL('image/png') : null; }, [s, W, H, dpr, boss]);
    console.log(name, url ? 'ok' : 'NOT DRAWN', ((Date.now() - t0) / 1000).toFixed(1) + ' s');
    if (url) { const f = path.join(OUT, `studio-${boss}-${name}.png`); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); urls.push(f); } }
  const st = await p.evaluate(boss => { const MD = window.__pp.FIEND_DEFS[boss].MODEL; return MD.__dbg.glStats; }, boss); console.log('gl', JSON.stringify(st));
  if (urls.length > 1) require('child_process').execFileSync('python3', [path.join(__dirname, '_db-sheet.py'), path.join(OUT, `studio-${boss}-sheet.png`), ...urls], { stdio: 'inherit' }); }
  console.log('errors', errs.length, errs.slice(0, 4)); await b.close();
})();
