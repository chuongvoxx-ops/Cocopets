const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 420 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const info = await page.evaluate(() => {
    const P = window.__pp; P.quickStart('Z'); const out = [];
    let html = '<div id="gz" style="position:fixed;inset:0;z-index:99999;background:#3A2E4E;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:8px">';
    for (const sd of [11, 23, 47]) { const g = P.summonGenome(6, P.mulberry32(sd)), line = P.evolveLine(g.form, 7, P.mulberry32(sd * 7)); [0, 6].forEach(i => { html += `<div style="height:400px">${P.petSVG(line[i], { frame: 'fit' })}</div>`; out.push([sd, i + 1, line[i].x.wings && line[i].x.wings.t, line[i].arms.t, line[i].ears.t]); }); }
    document.body.insertAdjacentHTML('beforeend', html + '</div>'); document.querySelectorAll('#gz svg').forEach(s => { s.style.width = '100%'; s.style.height = '100%'; });
    return out;
  });
  console.log(JSON.stringify(info));
  await page.waitForTimeout(300); await page.screenshot({ path: path.resolve(__dirname, '../shots/gold-zoom.png') });
  await browser.close();
})();
