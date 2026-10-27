// New life frames: blink, follow-through lag both ways, idle fidgets, landing squash, turn squash.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const only = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : null, K = +(process.argv[3] || 2), px = 110;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(({ only, K, px }) => {
    const P = window.__pp, ids = only || P.ANIMA_ORDER, cw = px * 1.25, ch = px * 1.3;
    const cols = [['rest', {}], ['blink½', { blink: 0.25 }], ['blink', { blink: 0.5 }], ['lag−', { lag: -9 }], ['lag+', { lag: 9 }], ['hop', { t: 4.6 * 0 + 0.47, idle: 0 }], ['look', { idle: 2 }], ['land', { sq: 0.5 }], ['fall', { fall: 1 }], ['flipLag', { flip: true, lag: 9 }]];
    const cv = document.createElement('canvas'); cv.width = cw * cols.length * 2; cv.height = ch * ids.length * 2; const c = cv.getContext('2d'); c.scale(2, 2);
    c.fillStyle = '#1A1838'; c.fillRect(0, 0, cw * cols.length, ch * ids.length);
    const SEED = { aries: 0.3, taurus: 2.1, gemini: 1.2, cancer: 3.3, leo: 0.9, virgo: 2.7, libra: 1.6, scorpio: 3.9, sagittarius: 0.5, capricorn: 2.4, aquarius: 1.9, pisces: 3.1 };
    ids.forEach((id, row) => {
      cols.forEach(([lab, o], i) => {
        const x = i * cw, y = row * ch;
        c.fillStyle = (i + row) % 2 ? '#22204A' : '#1E1C42'; c.fillRect(x, y, cw, ch);
        let t = 1.3;
        if (o.idle != null) { // find a time inside the fidget window for that kind
          for (let n = 0; n < 40; n++) { const tt = n * 4.6 + 0.47 - SEED[id]; if (tt < 0) continue; if ((n + SEED[id] | 0) % 4 === o.idle && Math.floor((tt + SEED[id]) / 4.6) === n) { t = tt; break; } }
        }
        P.AnimaArt.draw(c, id, K, x + cw / 2, y + ch * 0.86, px * 0.62, t, Object.assign({ mv: 0, aura: false }, o));
        c.fillStyle = '#FFF'; c.font = '10px sans-serif'; c.fillText(lab, x + 4, y + 12);
      });
    });
    return cv.toDataURL('image/jpeg', 0.85);
  }, { only, K, px });
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/anima-life2.jpg'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
