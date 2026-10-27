const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(async () => { const P = window.__pp; P.quickStart('Bot'); let worst = 0, touched = [];
    for (let i = 0; i < 24; i++) { const six = i % 2 === 0, sd = 300 + i * 17, sg = six ? 7 : 2 + (i % 6);
      const g = P.summonGenome(six ? 6 : 3 + (i % 3), P.mulberry32(sd)), line = P.evolveLine(g.form, sg, P.mulberry32(sd * 7)), f = line[sg - 1];
      const S = await P.loadSprites(f); S.rig = await P.loadRig(f); P.arc.sprites = S;
      const api = { snap: (h, o) => { const c = document.createElement('canvas').getContext('2d'); return P.arc.api ? null : null; } };
      for (const cast of [0, 0.3, 0.5, 0.8]) for (const ult of [false, true]) for (let w = 0; w < 16; w++) {
        const cv = document.createElement('canvas'); cv.width = 10; cv.height = 10; const c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0);
        // the dungeon's petSnap through drawPetSprite's api is not hooked; call via the arcade api if present
        const N = P.petSnap(60, { face: 'normal', pose: { walk: w, moving: true, t: w, cast, ult, wingPh: w / 16 * 6.283, wingAmp: 14 } }, 2);
        if (!N) continue; worst++; if (N.sx === 0 || N.sy === 0 || N.sx + N.sw >= N.cv.width || N.sy + N.sh >= N.cv.height) touched.push([i, cast, ult, w, N.sx, N.sy, N.sw, N.sh, N.cv.width, N.cv.height]); }
    }
    return touched.slice(0, 10).concat([['count', touched.length, 'snaps', worst]]); });
  console.log(JSON.stringify(r));
  await browser.close();
})();
