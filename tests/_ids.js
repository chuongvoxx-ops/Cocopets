const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); const g = P.summonGenome(6, P.mulberry32(100)), line = P.evolveLine(g.form, 7, P.mulberry32(700)), f = line[6];
    const mk = o => { P.petSVG(f, Object.assign({ static: true, frame: 'fit', lite: true, rig: true }, o)); return P.petSVG.rig; };
    const A = mk({ eyes: 'normal', mouth: 'smile' }), B = mk({ eyes: 'happy', mouth: 'open' }), C = mk({ eyes: 'dizzy', mouth: 'o' });
    const ids = s => [...new Set((s.match(/url\(#[^)]+\)/g) || []))];
    const defIds = s => [...new Set((s.match(/id="[^"]+"/g) || []))];
    return { defsA: defIds(A.defs), defsC: defIds(C.defs), frontA: ids(A.front), frontB: ids(B.front), frontC: ids(C.front), diff: C.front.length - A.front.length, cTail: C.front.slice(-1500) };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
