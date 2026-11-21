// v443 SB: the studio sheet of every picture (20n9f TRAP_ART): each light (row) x each picture (column) on a floor-dark
// ground, the blades also turned, the plates with their spikes up; and the paint time of each. Dev only.
// usage: HTML=<test html> node tests/_sbx-studio.js   env: OUT (shots/v443-SB/studio.png), P (px a tile, 64), LIGHTS (comma list)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const page = await b.newPage({ viewport: { width: 400, height: 400 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html')); await page.waitForFunction(() => window.__pp && window.TRAP_ART, null, { timeout: 600000 });
  const r = await page.evaluate(([P, LS]) => { const A = window.TRAP_ART, lights = LS ? LS.split(',') : Object.keys(A.LT), t0 = performance.now(), ms = {};
    const cols = [['chest', 0], ['crate', 0], ['xbarrel', 0], ['barrel', 0], ['pot', 0], ['urn', 0], ['blade', 0], ['blade', 1], ['plate', 'spikes'], ['plate', 'icespikes'], ['plate', 'thorns'], ['rail', '3.00h'], ['rail', '2.00v']];
    const CW = P * 1.5, RH = P * 1.9, W = Math.ceil(CW * (cols.length + 3.2)), H = Math.ceil(RH * lights.length + 30), cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    c.fillStyle = '#1C1A22'; c.fillRect(0, 0, W, H); c.font = '12px sans-serif'; c.fillStyle = '#DDD';
    cols.forEach(([n, v], i) => c.fillText(n + (v ? ' ' + v : ''), 90 + i * CW, 14));
    lights.forEach((L, j) => { const y0 = 24 + j * RH; c.fillStyle = j % 2 ? '#2A2630' : '#24212A'; c.fillRect(0, y0, W, RH); c.fillStyle = '#EEE'; c.fillText(L, 6, y0 + 16);
      cols.forEach(([n, v], i) => { const t = performance.now(), s = A.pic(n, v, P, L); ms[n] = (ms[n] || 0) + performance.now() - t; if (!s) return; const x = 90 + i * CW + CW * 0.5, y = y0 + RH * 0.72;
        if (n === 'rail') { const k = /h$/.test(v) ? 0.42 : 0.42; c.drawImage(s.cv, x - CW * 0.45, y0 + 8, s.cv.width * k, s.cv.height * k); return; }
        if (n === 'blade') { const y2 = y0 + RH * 0.45; c.save(); c.translate(x, y2); if (v === 1) c.rotate(0.6); c.drawImage(s.cv, -s.ax, -s.ay); const sd = A.pic('sheen', 1, P, L), sh = A.pic('sheen', 0, P, L); c.rotate(v === 1 ? -0.6 : 0); c.drawImage(sd.cv, -sd.ax, -sd.ay); c.restore(); return; }   // (as in play: the slot's shade, no sheen)
        if (n === 'plate') { const y2 = y0 + RH * 0.5; c.drawImage(s.cv, x - s.ax, y2 - s.ay); const pn = A.pic('pins', v, P, L); for (let k = -1; k <= 1; k++) c.drawImage(pn.cv, x - pn.ax, y2 + k * P * 0.24 - pn.ay); return; }
        c.drawImage(s.cv, x - s.ax, y - s.ay); });
      // the rail with its blade on it (horizontal), at the end of the row
      const rl = A.pic('rail', '3.00h', P, L), bl = A.pic('blade', 1, P, L); if (rl && bl) { const x = 90 + cols.length * CW + 10, y = y0 + RH * 0.7; c.drawImage(rl.cv, x - rl.ax * 0.6 + P * 0.6, y - rl.ay * 0.6, rl.cv.width * 0.6, rl.cv.height * 0.6); c.save(); c.beginPath(); c.rect(x, y - P, P * 3, P * 0.98); c.clip(); c.translate(x + P * 0.6 + P * 0.9, y - P * 0.13); c.scale(0.6, 0.6); c.drawImage(bl.cv, -bl.ax, -bl.ay); c.restore(); } });
    return { png: cv.toDataURL('image/png'), ms: Object.fromEntries(Object.entries(ms).map(([k, v]) => [k, +(v / lights.length).toFixed(1)])), total: +(performance.now() - t0).toFixed(0), stats: A.stats }; }, [+(process.env.P || 64), process.env.LIGHTS || '']);
  const out = path.resolve(__dirname, '..', process.env.OUT || 'shots/v443-SB/studio.png'); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, Buffer.from(r.png.split(',')[1], 'base64'));
  console.log('sheet', out, 'paint ms per light', JSON.stringify(r.ms), 'total', r.total, 'cached', r.stats.cached, 'px', r.stats.px); console.log('page errors', errors.length, errors.slice(0, 3)); await b.close();
})().catch(e => { console.error(e); process.exit(2); });
