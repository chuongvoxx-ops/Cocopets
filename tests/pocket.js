// Fifty pets: the party of four lives in the house, the rest rest in the pocket dimension; same-kind groups merge in one go.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5 });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const out = {};
  out.fill = await page.evaluate(() => { const P = window.__pp; P.quickStart('Lead'); P.st.crystals = 5000; P.st.fusionStones = 20; for (let i = 0; i < 60; i++) { if (1 + P.st.others.length >= 50) break; const g = P.summonGenome(i % 4 === 0 ? 4 : 3, P.mulberry32(i * 17 + 3)); P.st.others.push(P.newPetFields('P' + i, g)); } P.st.party = null; P.partyPets(); P.buildCompanions(); return { pets: 1 + P.st.others.length, comps: P.comps.length, party: P.partyPets().length }; });
  // the card strip and pocket sheet
  await page.evaluate(() => window.__pp.openCard()); await page.waitForTimeout(400);
  out.strip = await page.evaluate(() => ({ tiles: document.querySelectorAll('.pet-strip .ps-pet').length, pocketBtn: !!document.querySelector('[data-go="pocket"]') }));
  await page.screenshot({ path: path.resolve(__dirname, '../shots/pocket-card.png') });
  await page.evaluate(() => window.__pp.openPocket()); await page.waitForTimeout(400);
  out.pocket = await page.evaluate(() => ({ tiles: document.querySelectorAll('.pocket-grid .pk-pet').length, badges: document.querySelectorAll('.pk-badge').length, sheetH: document.querySelector('.sheet').scrollHeight }));
  await page.screenshot({ path: path.resolve(__dirname, '../shots/pocket-sheet.png') });
  // switching to a resting pet brings it into the party
  out.sw = await page.evaluate(() => { const P = window.__pp; const b = document.querySelector('.pk-pet:not(.on)[data-go="pet-sw"]'); const i = +b.dataset.i, name = P.st.others[i].name; b.click(); return { name, now: P.st.name, inParty: P.partyPets().includes(P.st), party: P.partyPets().length, comps: P.comps.length }; });
  // the Tower party section stays short
  await page.evaluate(() => { const P = window.__pp; P.closeSheet(); P.openMap(); P.dun.setMapTab('dungeon', true); }); await page.waitForTimeout(500);
  out.tower = await page.evaluate(() => { const g = document.querySelector('.party-grid'); const pg = document.querySelectorAll('.dun-inner .pocket-grid'); return { slots: g.querySelectorAll('.pt-pet').length, pocketGrids: pg.length, pocketH: pg[0] && pg[0].getBoundingClientRect().height, pageH: document.querySelector('#dunInner').scrollHeight }; });
  await page.evaluate(() => document.querySelector('.dun-party') && document.querySelector('.dun-party').scrollIntoView()); await page.waitForTimeout(200);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/pocket-tower.png') });
  // same-kind merge: groups listed, merge-all folds a whole group into one pet
  await page.evaluate(() => { window.__pp.closeMap(); window.__pp.openFusion(); }); await page.waitForTimeout(400);
  out.groups = await page.evaluate(() => [...document.querySelectorAll('.sk-row')].slice(0, 4).map(r => r.querySelector('.sk-kind').textContent.replace(/\s+/g, ' ').trim()));
  await page.screenshot({ path: path.resolve(__dirname, '../shots/pocket-fusion.png') });
  out.merge = await page.evaluate(async () => { const P = window.__pp; const row = [...document.querySelectorAll('.sk-row')].find(r => r.querySelector('[data-go="fuse-all"]')); if (!row) return 'no group of 3'; const n = +row.querySelector('.sk-kind b').textContent.replace('× ', ''); const before = 1 + P.st.others.length, stones = P.st.fusionStones; row.querySelector('[data-go="fuse-all"]').click(); await new Promise(r => setTimeout(r, 200)); const go = document.querySelector('[data-go="fuse-all-go"]'); if (!go) return 'no confirm'; go.click(); await new Promise(r => setTimeout(r, 2200)); window.__shotNow = true; await new Promise(r => setTimeout(r, 4500)); return { n, before, after: 1 + P.st.others.length, stonesUsed: stones - P.st.fusionStones, ok: 1 + P.st.others.length === before - (n - 1) }; });
  console.log(JSON.stringify(out, null, 1));
  // merging a group costs two Fusion Stones for three to six pets, three for seven or more
  if (out.merge && out.merge.n) { const want = out.merge.n <= 2 ? 1 : out.merge.n <= 6 ? 2 : 3; if (out.merge.stonesUsed !== want) errors.push(`merging ${out.merge.n} pets used ${out.merge.stonesUsed} stones, wanted ${want}`); }
  console.log('errors:', errors.length); errors.slice(0, 6).forEach(e => console.log('  ', e));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
