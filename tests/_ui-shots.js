// The menus changed in this update, photographed: the Tower tab's pet panel (evolution under the stats), the Team sheet
// (the Anima slot), and the Animas sheet with a second bound (its Unbind button on the first Anima's page).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 99; P.st.stage = 5; P.st.crystals = 4000; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.eq = 'capricorn'; P.st.animas.res = 'cancer';
    const f = P.newPetFields('Pal', P.makeGenome(P.mulberry32(21))); f.stage = 5; P.st.others.push(f); P.togglePartyPet && P.togglePartyPet(f.uid); });
  // 1. the Tower tab
  await page.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('dungeon', true); }); await page.waitForTimeout(500);
  await page.evaluate(() => { const el = document.querySelector('.dp-evobox'); if (el) el.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(300);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/ui-tower-evo.png') });
  const evo = await page.evaluate(() => { const el = document.querySelector('.dp-evobox'); return el ? el.textContent.replace(/\s+/g, ' ').trim() : null; });
  // 2. the Team sheet
  await page.evaluate(() => { const P = window.__pp; P.closeMap && P.closeMap(); P.team.openTeam(); }); await page.waitForTimeout(500);
  await page.evaluate(() => { const el = document.querySelector('.sheet .an-slot'); if (el) el.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(300);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/ui-team-anima.png') });
  const team = await page.evaluate(() => { const el = document.querySelector('.sheet .an-slot'); return el ? { text: el.textContent.replace(/\s+/g, ' ').trim(), go: el.dataset.go } : null; });
  // 3. the Animas sheet, on the first Anima's page
  await page.evaluate(() => { window.__pp.closeSheet(); window.__pp.openAnimas('capricorn'); }); await page.waitForTimeout(500);
  await page.evaluate(() => { const el = document.querySelector('.an-res'); if (el) el.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(300);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/ui-anima-unbind.png') });
  const unb = await page.evaluate(() => { const b = document.querySelector('.an-res .btn'); return b ? b.textContent.trim() : null; });
  await page.evaluate(() => { const b = document.querySelector('.an-res .btn'); if (b) b.click(); }); await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.__pp.st.animas.res);
  console.log(JSON.stringify({ evo, team, unb, resAfter: after }));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
