// Which canvas the probes draw on, and whether pattern fills cost the same on it, on the arcade's own canvas and on a fresh one.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const before = await page.evaluate(() => [...document.querySelectorAll('canvas')].map(c => ({ id: c.id, cls: c.className, w: c.width, h: c.height, shown: !!c.offsetParent })));
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => { window.__pp.arc.dunCap = 2; window.__pp.dun.startDungeon(n, 7); }, 6);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const r = await page.evaluate(() => {
    const list = [...document.querySelectorAll('canvas')].map(c => ({ id: c.id, cls: c.className, w: c.width, h: c.height, shown: !!c.offsetParent }));
    const mkTile = k => { const t = document.createElement('canvas'); t.width = t.height = 128 * k; const x = t.getContext('2d'); x.scale(k, k); x.fillStyle = '#1E4A47'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 26; i++) { x.strokeStyle = 'rgba(150,230,210,.2)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(i * 5, i * 4); x.quadraticCurveTo(i * 5 + 9, i * 4 - 4, i * 5 + 18, i * 4); x.stroke(); } return t; };
    const fresh = document.createElement('canvas'); fresh.width = 780; fresh.height = 1572;
    const out = {};
    for (const [name, cv] of [['first', document.querySelector('canvas')], ['arcCanvas', document.getElementById('arcCanvas')], ['fresh', fresh]]) {
      const c = cv.getContext('2d'); c.save(); c.setTransform(2, 0, 0, 2, 0, 0);
      const p2 = c.createPattern(mkTile(2), 'repeat');
      const fl = () => c.getImageData(0, 0, 1, 1), T = {}, N = 12;
      const time = (k, f) => { fl(); const t0 = performance.now(); f(); fl(); T[k] = (T[k] || 0) + performance.now() - t0; };
      for (let n = -2; n < N; n++) {
        const e = 123.37 + n * 1.1, f = 77.61 + n * 0.7;
        time('pinned', () => { p2.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, Math.round(e * 2) / 2, Math.round(f * 2) / 2])); c.fillStyle = p2; c.fillRect(0, 0, 390, 786); });
        if (n === -1) for (const k in T) T[k] = 0;
      }
      c.restore();
      out[name] = { id: cv.id, w: cv.width, h: cv.height, pinned: +(T.pinned / N).toFixed(2) };
    }
    return { list, out };
  });
  console.log('before', JSON.stringify(before));
  console.log('in game', JSON.stringify(r.list));
  console.log(JSON.stringify(r.out));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
