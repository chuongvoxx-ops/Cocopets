// Fusion: the child keeps the Normal, Strong and Ult chosen from its parents, through a save and reload.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5 }); const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const out = await page.evaluate(() => {
    const P = window.__pp; P.quickStart('Alpha'); P.st.fusionStones = 2; P.st.crystals = 999;
    // a five-star second parent with a signature kit
    const g = P.summonGenome(5, P.mulberry32(42)); const b = P.newPetFields('Beta', g); P.st.others.push(b);
    P.openFusion();
    const rows = document.querySelectorAll('.fab-row').length, opts = document.querySelectorAll('.fab-opt').length;
    const bStrong = document.querySelector('.fab-opt[data-slot="strong"][data-src="b"] b').textContent, bUlt = document.querySelector('.fab-opt[data-slot="ult"][data-src="b"] b').textContent, aNormal = document.querySelector('.fab-opt[data-slot="normal"][data-src="a"] b').textContent;
    document.querySelector('.fab-opt[data-slot="strong"][data-src="b"]').click();
    document.querySelector('.fab-opt[data-slot="ult"][data-src="b"]').click();
    document.querySelector('.fab-opt[data-slot="normal"][data-src="a"]').click();
    const on = [...document.querySelectorAll('.fab-opt.on')].map(x => x.dataset.slot + ':' + x.dataset.src);
    return { rows, opts, bStrong, bUlt, aNormal, on };
  });
  await page.screenshot({ path: path.resolve(__dirname, '../shots/fuse-inherit.png') });
  await page.evaluate(() => window.__pp.fusePets()); await page.waitForTimeout(4500);
  const child = await page.evaluate(() => { const P = window.__pp; const k = P.dun.petKit(P.st).kit; return { name: P.st.name, abOv: P.st.abOv, normal: k.normal.name, strong: k.strong.name, strongStar: k.strong.star, ult: k.ult.name, ultStar: k.ult.star }; });
  await page.evaluate(() => window.__pp.saveLocalNow && window.__pp.saveLocalNow());
  await page.reload(); await page.waitForFunction(() => window.__pp && window.__pp.st, null, { timeout: 15000 }); await page.waitForTimeout(500);
  const after = await page.evaluate(() => { const P = window.__pp; const k = P.dun.petKit(P.st).kit; return { name: P.st.name, strong: k.strong.name, ult: k.ult.name, normal: k.normal.name, abOv: P.st.abOv }; });
  console.log(JSON.stringify({ out, child, after }, null, 1));
  const ok = child.strong === out.bStrong && child.ult === out.bUlt && after.strong === out.bStrong && after.ult === out.bUlt;
  console.log(ok ? 'inherit OK' : 'INHERIT MISMATCH');
  console.log('errors:', errors.length); errors.slice(0, 6).forEach(e => console.log('  ', e));
  await browser.close();
  process.exit(errors.length || !ok ? 1 : 0);
})();
