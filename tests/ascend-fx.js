// The Ascension ceremony: frames through the rite, closing it, and the second-Anima slot at Guardian.
// usage: node tests/ascend-fx.js [id]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const id = process.argv[2] || 'sagittarius';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.resolve(__dirname, `../shots/asc-${n}.png`) });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Taro'); P.st.dun.best = 12; P.st.crystals = 5000; P.st.gems = { citrine: 20, emerald: 20, sapphire: 20, amethyst: 20, quartz: 20, starstone: 10 }; P.st.stage = 4; });
  await page.waitForTimeout(500);
  await page.click('#animaBtn'); await page.waitForTimeout(400);
  await page.click(`[data-go="an-pick"][data-id="${id}"]`); await page.waitForTimeout(300);
  const locked = await page.evaluate(() => !!document.querySelector('.an-res.locked'));
  // ascend: watch the rite
  const t0 = Date.now();
  await page.click(`[data-go="an-asc"][data-id="${id}"]`);
  const at = async (ms, n) => { const w = ms - (Date.now() - t0); if (w > 0) await page.waitForTimeout(w); await shot(n); };
  await at(700, '1gather'); await at(1700, '2white'); await at(2280, '3burst'); await at(2700, '4reveal'); await at(4200, '5title');
  const mid = await page.evaluate(() => ({ ov: !!document.querySelector('.asc-ov'), k: window.__pp.st.animas.have }));
  await page.click('.asc-ov'); await page.waitForTimeout(600);
  const gone = await page.evaluate(() => !document.querySelector('.asc-ov'));
  // second ascension, skipping ahead with a tap
  await page.click(`[data-go="an-asc"][data-id="${id}"]`); await page.waitForTimeout(400);
  await page.click('.asc-ov'); await page.waitForTimeout(800); await shot('6skip');
  await page.waitForTimeout(1800); await page.click('.asc-ov'); await page.waitForTimeout(600);
  // Guardian: bind a second Anima (harmony), then the opposite sign (resonance)
  await page.evaluate(() => { window.__pp.st.stage = 5; }); await page.click(`[data-go="an-pick"][data-id="aries"]`); await page.waitForTimeout(300);
  await page.click(`[data-go="an-eq"][data-id="aries"]`).catch(() => {}); await page.waitForTimeout(300);
  await page.click(`[data-go="an-pick"][data-id="leo"]`); await page.waitForTimeout(300);
  await page.click(`[data-go="an-res"][data-id="leo"]`); await page.waitForTimeout(300);
  const harmony = await page.evaluate(() => { const P = window.__pp, K = P.animaKitFor(P.st); return { res: P.st.animas.res, kit: K && K.res && K.res.id, name: K && K.resonance && K.resonance.name }; });
  await page.evaluate(() => { const s = document.querySelector('.an-res'); if (s) s.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(200); await shot('7harmony');
  await page.click(`[data-go="an-pick"][data-id="libra"]`); await page.waitForTimeout(300);
  await page.click(`[data-go="an-unseal"][data-id="libra"]`).catch(() => {}); await page.waitForTimeout(500);
  if (await page.$('.asc-ov')) { await page.waitForTimeout(3000); await page.click('.asc-ov'); await page.waitForTimeout(600); }
  await page.click(`[data-go="an-res"][data-id="libra"]`); await page.waitForTimeout(300);
  const zodiac = await page.evaluate(() => { const P = window.__pp, K = P.animaKitFor(P.st); return { res: P.st.animas.res, name: K && K.resonance && K.resonance.name }; });
  await page.evaluate(() => { const s = document.querySelector('.an-res'); if (s) s.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(200); await shot('8zodiac');
  // binding the second as main swaps them
  await page.click(`[data-go="an-eq"][data-id="libra"]`); await page.waitForTimeout(300);
  const swap = await page.evaluate(() => ({ eq: window.__pp.st.animas.eq, res: window.__pp.st.animas.res }));
  console.log(JSON.stringify({ locked, mid, gone, harmony, zodiac, swap, crystals: await page.evaluate(() => window.__pp.st.crystals) }));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
