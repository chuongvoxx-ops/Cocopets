// The Tower tab: the tower view, floor picking, the party picker and the reaction list.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Lead'); P.st.energy = 100; P.st.dun.best = 23; for (let i = 0; i < 4; i++) { const f = P.newPetFields('Pet' + i, P.makeGenome(P.mulberry32(i * 31 + 9))); f.dlv = 5 + i; P.st.others.push(f); } P.st.party = null; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.waitForTimeout(500);
  const out = await page.evaluate(() => { const fl = document.querySelectorAll('.tw-fl').length, sel = document.querySelector('.tw-fl.sel'), party = document.querySelectorAll('.pt-pet.on').length, tw = document.querySelector('#towerWrap'); return { floors: fl, sel: sel && sel.dataset.n, party, scrolled: tw.scrollTop > 100, tab: document.querySelector('#mapPlace').textContent.trim() }; });
  await page.screenshot({ path: path.resolve(__dirname, '../shots/tower-tab.png') });
  // pick floor 20 (a Super Fiend) in the tower
  await page.evaluate(() => document.querySelector('.tw-fl[data-n="20"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await page.waitForTimeout(300);
  out.hero = await page.evaluate(() => document.querySelector('.dun-hero h2').textContent);
  out.eyebrow = await page.evaluate(() => document.querySelector('.dun-hero .eyebrow').textContent);
  out.rec = await page.evaluate(() => (document.querySelector('.dun-rec') || {}).textContent || '');
  // a locked floor refuses
  await page.evaluate(() => document.querySelector('.tw-fl[data-n="60"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await page.waitForTimeout(200);
  out.stillSel = await page.evaluate(() => document.querySelector('.tw-fl.sel').dataset.n);
  // party: take one out, put another in, try a fifth
  const partyState = () => page.evaluate(() => ({ party: document.querySelectorAll('.pt-pet:not(.empty)').length, pocket: document.querySelectorAll('.dun-inner .pocket-grid .pk-pet').length }));
  out.before = await partyState();
  await page.evaluate(() => document.querySelectorAll('.pt-pet')[1].click()); await page.waitForTimeout(200);   // take one out
  out.afterOut = await partyState();
  await page.evaluate(() => document.querySelector('.dun-inner .pocket-grid .pk-pet').click()); await page.waitForTimeout(200);   // put one in
  out.after = await partyState();
  await page.evaluate(() => { const b = document.querySelector('.dun-inner .pocket-grid .pk-pet'); if (b) b.click(); }); await page.waitForTimeout(200);   // a fifth, if any is resting
  out.full = await partyState();
  await page.evaluate(() => document.querySelector('[data-dun="rxbook"]').click()); await page.waitForTimeout(200);
  out.rxRows = await page.evaluate(() => document.querySelectorAll('.rx-list li').length);
  await page.evaluate(() => { document.querySelector('.dun-party').scrollIntoView(); }); await page.waitForTimeout(200);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/tower-party.png') });
  console.log(JSON.stringify(out));
  const ok = out.floors === 120 && /Recommended level 40/.test(out.rec) && out.sel === '24' && out.party === 4 && out.scrolled && out.tab === 'Tower of Oblivion' && /Jorōgumo/.test(out.hero) && out.stillSel === '20' && out.before.party === 4 && out.afterOut.party === 3 && out.after.party === 4 && out.full.party === 4 && out.rxRows === 31;
  if (!ok) console.log('terms', JSON.stringify({ f: out.floors === 120, r: /Recommended level 40/.test(out.rec), sel: out.sel === '24', p: out.party === 4, sc: !!out.scrolled, tab: out.tab === 'Tower of Oblivion', h: /Jorōgumo/.test(out.hero), ss: out.stillSel === '20', b: out.before.party === 4, ao: out.afterOut.party === 3, a: out.after.party === 4, fu: out.full.party === 4, rx: out.rxRows === 31 }));
  console.log('tower', ok ? 'OK' : 'FAIL'); console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
