// Every leg type on a grown pet, including old saves with long and bird legs, after the stubby-legs change.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 500 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; if (!P.st) P.quickStart('Bot'); });
  const html = await page.evaluate(() => {
    const P = window.__pp, R = P.mulberry32(77), g = P.makeGenome(R), base = P.evolveLine(g.form, 6, R).pop();
    const types = ['nub', 'paw', 'stump', 'webbed', 'hoof', 'boots', 'tentacle', 'long', 'bird'];
    let h = '<div style="background:#F6EFE4;padding:10px;font:13px sans-serif;display:flex;gap:8px;align-items:flex-end">';
    types.forEach(t => { const f = JSON.parse(JSON.stringify(base)); f.legs = { t, len: 26, size: 1 }; const c = P.cleanForm ? P.cleanForm(f) : f; h += `<div style="width:150px;text-align:center"><div style="width:150px;height:150px">${P.petSVG(c, { eyes: 'normal', mouth: 'smile' })}</div>${t}${c.legs.t !== t ? ' → ' + c.legs.t : ''} · len ${c.legs.len}</div>`; });
    return h + '</div>';
  });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>:root{--pet-line:#2B2433}svg{width:100%;height:100%;overflow:visible}</style></head><body style="margin:0">${html}</body></html>`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/legs.png') });
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
