// v460 R3: shots of Rift 03's new route in the menus: the rift's card with its eight-stage strip (a mid-run checkpoint), the
// ready screen of Dungeon 2 (its label), the end panel after Boss 1 (its next button). DPR (1|3) -> shots/v460-R3/route-*-d<DPR>.png
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const DPR = +(process.env.DPR || 1), OUT = path.resolve(__dirname, '../shots/v460-R3'); fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-r3.html')); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { localStorage.clear(); const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 32; P.riftState().seals.belfry = 1; P.riftState().seals.garden = 1; P.riftState().prog.dunes = 3; P.st.dun.best = 120; P.openMap(); P.dun.setMapTab('rift', true); const b = document.querySelector('[data-rift="sel"][data-id="dunes"]'); if (b) b.click(); });
  await page.waitForTimeout(800); const shot = n => page.screenshot({ path: path.join(OUT, `route-${n}-d${DPR}.png`) });
  await page.evaluate(() => { const h = document.querySelector('.rf-hero'); if (h) h.scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(300); await shot('card');
  await page.evaluate(() => document.querySelector('[data-rift="enter"]').click()); await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 120000 }); await page.waitForTimeout(600); await shot('ready-dungeon2');
  await page.evaluate(() => { const P = window.__pp; P.closeArcade(true); P.startRift('dunes', 2); }); await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 120000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < 60000 && !(D.g.boss && D.g.boss.act !== 'enter')) { await new Promise(r => requestAnimationFrame(r)); if (D.M.bossAt) { D.me.x = D.M.bossAt.x; D.me.y = D.M.bossAt.y + 4; } } const b = D.g.boss; for (let k = 0; k < 40 && b && !b.dead && window.__pp.arc.state === 'play'; k++) { b.under = false; b.stunT = 0; D.hitMon(b, 1e12, { pierce: true }); await new Promise(r => setTimeout(r, 250)); } });
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 60000 }); await page.waitForTimeout(1500); await shot('end-boss1');
  console.log('page errors', errors.length, errors.slice(0, 3)); await browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
