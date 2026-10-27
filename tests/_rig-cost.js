// What drawing the pet costs: the whole picture against the pet in parts, at the size the Tower draws it (on a canvas
// like the screen), each draw flushed; ordinary pet and Celestial six-star. usage: node tests/_rig-cost.js   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [six, sd] of [[false, 8], [true, 23]]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
    await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
    await page.evaluate(([seed, six]) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 60;
      const g = six ? P.summonGenome(6, P.mulberry32(seed)) : P.summonGenome(4, P.mulberry32(seed)), line = P.evolveLine(g.form, 7, P.mulberry32(seed * 7)), p = P.newPetFields('L', g); p.forms = line; p.stage = 7; for (let n = 2; n <= 7; n++) p.paid[n] = true; if (six) p.rarity = 5;
      P.st.others = [p]; P.switchPet(0); P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(8, 1008); }, [sd, six]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
    const r = await page.evaluate(() => {
      const P = window.__pp, cv = document.createElement('canvas'); cv.width = 780; cv.height = 1300; const c = cv.getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1);
      const run = (opts, n) => { const out = []; for (let i = 0; i < n; i++) { c.setTransform(2, 0, 0, 2, 0, 0); c.clearRect(0, 0, 390, 650); fl(); const t0 = performance.now(); c.save(); P.arc.api.pet(c, 195, 360, 62, Object.assign({ sx: 1 + Math.sin(i) * 0.04, sy: 1 - Math.sin(i) * 0.04 }, opts(i))); c.restore(); fl(); out.push(performance.now() - t0); } out.sort((a, b) => a - b); return +out[out.length >> 1].toFixed(2); };
      for (let i = 0; i < 20; i++) { run(() => ({}), 2); run(i2 => ({ rig: true, pose: { walk: i2 * 0.3, moving: true, wingPh: i2 * 0.2, wingAmp: 14 } }), 2); }
      const R = P.arc.sprites.rig, PR = i => ({ rig: true, pose: { walk: i * 0.3, moving: true, wingPh: i * 0.2, wingAmp: 14, t: i / 60 } });
      const out = { whole: run(() => ({}), 200), parts: run(PR, 200) };
      const keep = Object.assign({}, R);
      R.legW = null; R.wing = null; out.noWings = run(PR, 200);
      R.arm = null; R.foot = null; out.backFront = run(PR, 200);
      R.back = null; out.frontOnly = run(PR, 200);
      Object.assign(R, keep); R.back = null; R.foot = null; R.arm = null; R.front = { normal: null }; out.wingsOnly = run(i => Object.assign(PR(i), {}), 1) && 0; Object.assign(R, keep);
      if (R.legW) { out.wingSizes = R.legW.map(w => w.ras ? w.ras.cv.width + 'x' + w.ras.cv.height : (w.img ? 'img' : '-')).join(' '); out.wingsStill = run(i => ({ rig: true, pose: { walk: 0, moving: false, wingPh: Math.PI / 2 + 0.3, wingAmp: 0, t: 0 } }), 200); }
      const fr = R.front.normal; out.dbg = { nw: fr.img.naturalWidth, nh: fr.img.naturalHeight, ras: fr.ras ? [fr.ras.cv.width, fr.ras.cv.height, +fr.ras.k.toFixed(2)] : null, vb: fr.vb.map(v => +v.toFixed(1)), whole: P.arc.sprites.normal.ras ? [P.arc.sprites.normal.ras.cv.width, P.arc.sprites.normal.ras.cv.height] : null, wvb: P.arc.sprites.normal.vb };
      return out;
    });
    console.log(six ? 'six-star' : 'ordinary', JSON.stringify(r));
    await page.close();
  }
  await browser.close();
})();
