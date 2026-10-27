// what each six-star wing kind costs to draw in the Tower (the pet in parts, wings beating), Celestial, in ms per draw
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(async () => { const P = window.__pp; P.quickStart('Bot'); const out = {};
    const cv = document.createElement('canvas'); cv.width = 780; cv.height = 900; document.body.appendChild(cv); const c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0);
    for (const w of ['angel', 'dragon', 'butterfly', 'dragonfly', 'crystal']) { const ts = [];
      for (const sd of [23, 31, 47]) { const g = P.summonGenome(6, P.mulberry32(sd)), line = P.evolveLine(g.form, 7, P.mulberry32(sd * 7)), f = JSON.parse(JSON.stringify(line[6]));
        f.x.leg = Object.assign({}, f.x.leg, { w, n7: 4, v: 0.5 }); P.legendStage(f, 7);
        const S = await P.loadSprites(f); S.rig = await P.makeRig(f); P.arc.sprites = S;
        for (let i = 0; i < 80; i++) P.drawPetSprite(c, 195, 300, 60, { rig: true, pose: { walk: i * 0.3, moving: true, t: i / 60, wingPh: i * 0.25, wingAmp: 14 } });   // (warm: the beat's frames made)
        for (let i = 0; i < 240; i++) { const t0 = performance.now(); P.drawPetSprite(c, 195, 300, 60, { rig: true, pose: { walk: i * 0.3, moving: true, t: i / 60, wingPh: i * 0.25, wingAmp: 14 } }); c.getImageData(0, 0, 1, 1); ts.push(performance.now() - t0); } }
      ts.sort((a, b) => a - b); out[w] = +ts[ts.length >> 1].toFixed(2); }
    return out; });
  console.log('Tower pet draw (median ms):', JSON.stringify(r));
  await browser.close();
})();
