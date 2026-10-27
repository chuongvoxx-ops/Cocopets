// Big renders of a few pets to judge the art direction. usage: node tests/pet-closeup.js [seed]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const seed0 = +(process.argv[2] || 11);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 460 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const html = await page.evaluate((seed0) => {
    const P = window.__pp; if (!P.st) P.quickStart('Bot');
    let h = '<div style="display:flex;gap:10px;align-items:flex-end;background:linear-gradient(#F6EFE4,#E9DCC8);padding:10px;height:440px">';
    [[seed0, 1], [seed0, 4], [seed0 + 7919, 3], [seed0 + 7919, 7], [seed0 + 15838, 5]].forEach(([sd, stg]) => {
      const R = P.mulberry32(sd), g = P.makeGenome(R), line = P.evolveLine(g.form, stg, R), f = line[stg - 1];
      h += `<div style="width:230px;height:420px">${P.petSVG(f, { frame: 'fit', eyes: 'normal', mouth: 'smile' })}</div>`;
    });
    return h + '</div>';
  }, seed0);
  const p2 = await browser.newPage({ viewport: { width: 1200, height: 460 }, deviceScaleFactor: 1 });
  await p2.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>:root{--pet-line:#2B2433}body{margin:0}svg{width:100%;height:100%;overflow:visible}</style></head><body>${html}</body></html>`);
  await p2.waitForTimeout(200);
  await p2.screenshot({ path: path.resolve(__dirname, '../shots/pet-closeup.png') });
  console.log('saved');
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
