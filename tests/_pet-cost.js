// What the pet costs to draw in a Tower fight, frame after frame as it breathes (its squash changing every frame): the
// pet's picture as the game keeps it (an SVG image), and the same picture first copied once into a canvas, each drawn
// flushed and timed. usage: node tests/_pet-cost.js [floor]   env: HTML, CAP
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl = +(process.argv[2] || 120);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(([n, cap]) => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(n, 7); }, [fl, +(process.env.CAP || 0)]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const P = window.__pp, arc = P.arc, S = arc.sprites, s = S.normal, c = document.getElementById('arcCanvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1);
    const h = 30, k = h / S.bodyTop, [vx, vy, vw, vh] = s.vb, dpr = arc.dpr;
    // the same picture, copied once into a canvas at twice the size it is drawn at (on the screen's own sharpness)
    const cv = document.createElement('canvas'), kk = k * dpr * 2; cv.width = Math.ceil(vw * kk); cv.height = Math.ceil(vh * kk); cv.getContext('2d').drawImage(s.img, 0, 0, cv.width, cv.height);
    const one = (img, i) => { const br = Math.sin(i * 0.15) * 0.025; c.save(); c.translate(200, 400); c.scale(1 + br, 1 - br); c.drawImage(img, vx * k, vy * k, vw * k, vh * k); c.restore(); };
    const time = img => { fl(); let tot = 0; for (let i = 0; i < 120; i++) { const t0 = performance.now(); one(img, i); fl(); tot += performance.now() - t0; } return tot / 120; };
    const out = { svg: [], canvas: [] }; for (let rd = 0; rd < 3; rd++) { out.svg.push(time(s.img)); out.canvas.push(time(cv)); }
    const avg = a => +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3);
    return { svg: avg(out.svg), canvas: avg(out.canvas), img: s.img && s.img.constructor.name, px: [vw * k * dpr, vh * k * dpr].map(Math.round), cv: [cv.width, cv.height] };
  });
  console.log(JSON.stringify(r));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
