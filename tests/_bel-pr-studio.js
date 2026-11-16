// v392 PR: every repainted Belfry prop on one sheet (no game running): shots/bel-pr-studio.png, and the painting cost.
// usage: HTML=test-calPR.html node tests/_bel-pr-studio.js [P]   (P px per tile, default 94: a phone at DPR 2)
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage({ viewport: { width: 1600, height: 1200 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html')); await p.waitForFunction(() => window.BELPROPS && window.__pp, null, { timeout: 120000, polling: 500 }); p.setDefaultTimeout(300000);
  const P = +(process.argv[2] || 94);
  const r = await p.evaluate(P => { const BP = window.BELPROPS, list = [['belcolumn', 0], ['belcolumn', 1], ['belstump', 1], ['belbench', 0], ['belfall', 0], ['belrib', 0], ['belbell', 0], ['belbell', 1], ['belmould', 0], ['belrail', 1], ['belcoral', 0], ['bellamp', 0], ['belarch', 0], ['belhalf', 0], ['belhalf', 1], ['belpipe', 0],
      ['socket', 'E21'], ['socket', 'W41'], ['socket', 'N00'], ['crystal', 'E'], ['crystal', 'W'], ['crystal', 'N'], ['pedestal', 0], ['plinth', 0], ['pit', 0], ['drain', 0], ['drainS', 0], ['cage', 'b'], ['cage', 'f'], ['hungbell', 'c'], ['alcove', 0], ['medal', 'E2'], ['medal', 'W1'], ['plaque', 0], ['rib', 0], ['pylon', 0], ['gpillar', 0], ['leaf', 0], ['doorframe', 0], ['housing', 0], ['navecol', 1], ['dais', 0]].concat((BP.extra || []));
    const out = [], times = []; const cv = document.createElement('canvas'); cv.width = 3600; cv.height = 2600; const c = cv.getContext('2d'); c.fillStyle = '#2E5F64'; c.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < 40; i++) for (let j = 0; j < 30; j++) { c.fillStyle = (i + j) % 2 ? '#2A585D' : '#30636A'; c.fillRect(i * 94, j * 94, 94, 94); }
    let x = 20, y = 30, rowH = 0; for (const [n, v] of list) { const t0 = performance.now(); let s = null; try { s = BP.sprite(n, v, P); } catch (e) { out.push(n + ' ERR ' + e.message); continue; } times.push([n + ':' + v, +(performance.now() - t0).toFixed(1)]); if (!s) { out.push(n + ' null'); continue; }
      const w = s.cv.width, h = s.cv.height, sc = n === 'dais' ? 0.5 : 1; if (x + w * sc > cv.width - 20) { x = 20; y += rowH + 30; rowH = 0; } c.drawImage(s.cv, x, y, w * sc, h * sc); c.fillStyle = '#fff'; c.font = '20px sans-serif'; c.fillText(n + ' ' + v, x, y - 6); x += w * sc + 24; rowH = Math.max(rowH, h * sc); }
    document.body.innerHTML = ''; document.body.style.margin = '0'; document.body.appendChild(cv); cv.style.width = '1600px'; return { out, times, total: times.reduce((a, t) => a + t[1], 0).toFixed(0) }; }, P);
  console.log(JSON.stringify(r.out), '\npaint ms', r.total, JSON.stringify(r.times));
  await p.setViewportSize({ width: 1600, height: 1160 }); await p.screenshot({ path: path.resolve(__dirname, '../shots/bel-pr-studio.png') }); console.log('errors', errs.length, errs.slice(0, 5)); await b.close();
})();
