// Does reading a canvas back (getImageData) every frame turn it into a software canvas? The same fills timed on a canvas
// flushed through a 1x1 relay (drawn into a tiny canvas that is read instead) and on one read back directly.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.setContent('<canvas id=a width=780 height=1600></canvas><canvas id=b width=780 height=1600></canvas>');
  const r = await page.evaluate(() => {
    const mkTile = k => { const t = document.createElement('canvas'); t.width = t.height = 128 * k; const x = t.getContext('2d'); x.scale(k, k); x.fillStyle = '#1E4A47'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 26; i++) { x.strokeStyle = 'rgba(150,230,210,.2)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(i * 5, i * 4); x.quadraticCurveTo(i * 5 + 9, i * 4 - 4, i * 5 + 18, i * 4); x.stroke(); } return t; };
    const relay = document.createElement('canvas'); relay.width = relay.height = 1; const rx = relay.getContext('2d', { willReadFrequently: true });
    const out = {};
    for (const [id, mode] of [['a', 'relay'], ['b', 'direct']]) {
      const cv = document.getElementById(id), c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0);
      const p2 = c.createPattern(mkTile(2), 'repeat'), p1 = c.createPattern(mkTile(1), 'repeat');
      const fl = mode === 'relay' ? () => { rx.drawImage(cv, 0, 0, 1, 1, 0, 0, 1, 1); rx.getImageData(0, 0, 1, 1); } : () => c.getImageData(0, 0, 1, 1);
      const T = {}, N = 60;
      const time = (k, f) => { fl(); const t0 = performance.now(); f(); fl(); T[k] = (T[k] || 0) + performance.now() - t0; };
      for (let n = 0; n < N; n++) {
        const e = 123.37 + n * 1.1, f = 77.61 + n * 0.7;
        time('pinned', () => { p2.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, Math.round(e * 2) / 2, Math.round(f * 2) / 2])); c.fillStyle = p2; c.fillRect(0, 0, 390, 800); });
        time('scaled', () => { p1.setTransform(new DOMMatrix([1, 0, 0, 1, e, f])); c.fillStyle = p1; c.fillRect(0, 0, 390, 800); });
        time('plain', () => { c.fillStyle = '#123'; c.fillRect(0, 0, 390, 800); });
        if (n === 9) { out[mode + ' (first 10)'] = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, +(v / 10).toFixed(2)])); for (const k in T) T[k] = 0; }
      }
      out[mode + ' (after)'] = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, +(v / (N - 10)).toFixed(2)]));
    }
    return out;
  });
  for (const k in r) console.log(k.padEnd(18), JSON.stringify(r[k]));
  await browser.close();
})();
