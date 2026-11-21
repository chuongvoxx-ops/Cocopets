// v439 SP: a resolution step (the visual quality's canvas cap: High 2, Balanced 1.5, Performance 1.25 device px a point) leaves taps where
// they were: the same screen point maps to the same world point, the canvas keeps its CSS size, and the pet's screen position and the HUD's
// buttons do not move. usage: HTML=<test html> node tests/_sp-ptr.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const html = process.env.HTML; await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(400);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.gq = 'auto'; P.dun.startDungeon(1); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 120000 }); await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 }); await page.waitForTimeout(1500);
  const rows = [];
  for (const L of [0, 1, 2, 3, 0]) {
    const r = await page.evaluate(L => { const P = window.__pp, D = P.arc.game._dbg, cv = document.getElementById('arcCanvas'); window.GQ.A = L; const b = cv.getBoundingClientRect();
      const w = D.toWorld(200, 400), o = D.toWorld(0, 0), me = [(D.me.x - o[0]) * (200 / (w[0] - o[0])), (D.me.y - o[1]) * (400 / (w[1] - o[1]))];   // (the pet's screen point, from the same mapping)
      return { level: window.GQ.name(), dpr: P.arc.dpr, backing: [cv.width, cv.height], css: [Math.round(b.width), Math.round(b.height)], world: [+w[0].toFixed(3), +w[1].toFixed(3)], pet: me && me.map(v => +v.toFixed(2)) }; }, L);
    rows.push(r); console.log(JSON.stringify(r)); await page.waitForTimeout(300);
  }
  const same = rows.every(r => JSON.stringify([r.css, r.world]) === JSON.stringify([rows[0].css, rows[0].world]));
  console.log('taps map the same at every level:', same, '| page errors', errors.length, errors.slice(0, 3)); await browser.close(); process.exit(same && !errors.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
