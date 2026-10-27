const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const P = window.__pp; P.quickStart('Taro'); P.st.dlv = 40; P.st.dxp = 0; P.st.pantry = { ambrosia: 2 };
    // 200 boxes: how many hold ambrosia
    let n = 0; const rng = P.mulberry32(7); for (let i = 0; i < 200; i++) { const r = P.dun.rollGiftBox(rng, 0); if (r && r.ambrosia) n++; }
    P.openCard(P.st.uid); const el = document.querySelector('.feed-panel'); const txt = el && el.innerText;
    const b = el && el.querySelector('button[data-k="ambrosia"]'); const before = { lv: P.st.dlv, xp: P.st.dxp }; if (b) b.click();
    return { boxesWithAmbrosia: n, panel: txt && txt.slice(0, 120), before, after: { lv: P.st.dlv, xp: P.st.dxp }, need: 40 + 25 * 40 + 2 * 1600 };
  });
  console.log(JSON.stringify(r)); console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
