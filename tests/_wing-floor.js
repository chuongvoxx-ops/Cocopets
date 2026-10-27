// how low each six-star wing kind reaches against the floor (y 0 at the feet), stage by stage, over many pets
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); const out = {};
    for (const w of ['angel', 'dragon', 'butterfly', 'dragonfly']) for (const sg of [1, 4, 7]) { let lo = -1e9, hi = 1e9;
      for (let i = 0; i < 30; i++) { const g = P.summonGenome(6, P.mulberry32(500 + i * 7)), line = P.evolveLine(g.form, 7, P.mulberry32(3500 + i * 49)), f = JSON.parse(JSON.stringify(line[sg - 1]));
        f.x.leg = Object.assign({}, f.x.leg, { w, v: (i % 5) / 4, n7: i % 2 ? 3 : 4 }); P.legendStage(f, sg); P.petSVG(f, { static: true, frame: 'fit', split: true });
        const S = P.petSVG.split && P.petSVG.split.SP; if (!S) continue; for (const W of S.wings) { lo = Math.max(lo, W.bb[3]); hi = Math.min(hi, W.bb[1]); } }
      out[w + sg] = [Math.round(hi), Math.round(lo)]; }
    return out; });
  console.log(JSON.stringify(r));
  await browser.close();
})();
