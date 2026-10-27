// Bahamut's rings painted with their quads batched by colour and one by one, over many poses: how different they look
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 700, height: 700 } });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const P = window.__pp, D = P.FIEND_DEFS.bahamut, K = P.DunFiend.KIT, T = 30, out = [];
    const cv = document.createElement('canvas'); cv.width = cv.height = 700; const c = cv.getContext('2d');
    const shots = [];
    for (let i = 0; i < 12; i++) {
      const mem = { dbgOnly: 'gyro', lv: 4, art: 1 }, m = { x: 0, y: 0, r: 3, face: 1, phase: 4, t: 1, dmg: 10, act: 'circle' };
      const FX = { K, mem, m, S: { phase: 4, lv: 4, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {} }, H: { part() {}, text() {} }, me: { x: 0, y: 5 }, C: { x: 0, y: 0, R: 14.5 }, sx: v => v * T, sy: v => v * T, Tz: () => T, rnd: (a, b) => a + Math.random() * (b - a) };
      D.draw(c, FX, m, 350, 450, T, 1); // set up
      const run = nb => { mem.noBatch = nb; mem.rings.forEach((S, k) => { S.tumble = 0.6 + k * 0.9 + i * 0.53; S.spin = 0.4 + k + i * 0.3; }); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#101024'; c.fillRect(0, 0, 700, 700); D.draw(c, FX, m, 350, 450, T, 1); return c.getImageData(0, 0, 700, 700).data; };
      const a = run(false), b = run(true); let diff = 0, big = 0; for (let j = 0; j < a.length; j += 4) { const d = Math.max(Math.abs(a[j] - b[j]), Math.abs(a[j + 1] - b[j + 1]), Math.abs(a[j + 2] - b[j + 2])); diff += d; if (d > 60) big++; }
      out.push({ i, mean: +(diff / (a.length / 4)).toFixed(3), big });
      if (i === 5) { run(false); shots.push(cv.toDataURL('image/png')); run(true); shots.push(cv.toDataURL('image/png')); }
    }
    return { out, shots };
  });
  console.log(JSON.stringify(r.out));
  r.shots.forEach((u, i) => require('fs').writeFileSync(path.resolve(__dirname, `../shots/ring-batch-${i ? 'one' : 'batched'}.png`), Buffer.from(u.split(',')[1], 'base64')));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
