// Strong slots by stage and the Celestial ult: lobby, cards sheet and in-game buttons.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Taro'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 99; P.st.cards = { fireball: 2, meteor: 1, chain: 1, megabeam: 1 }; });
  for (const stage of [1, 4, 5, 7]) {
    const r = await page.evaluate(stage => { const P = window.__pp; P.st.stage = stage; const K = P.dun.petKit(P.st); return Object.fromEntries(Object.entries(K.kit).map(([k, a]) => [k, a.name + (a.tier ? ' [T2]' : '')])); }, stage);
    console.log('stage', stage, JSON.stringify(r));
  }
  // equip cards into the strong slots, including moving one between slots
  const deck = await page.evaluate(() => { const P = window.__pp; P.st.stage = 5; P.st.deck = { strong: 'fireball', strong2: 'fireball' }; const K = P.dun.petKit(P.st); return { strong: K.kit.strong.name, strong2: K.kit.strong2.name, strong3: K.kit.strong3 }; });
  console.log('dedupe', JSON.stringify(deck));
  // lobby and cards sheet
  await page.evaluate(() => { const P = window.__pp; P.st.stage = 7; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.renderDungeon(); });
  await page.waitForTimeout(500); await page.screenshot({ path: path.resolve(__dirname, '../shots/slots-lobby.png') });
  await page.evaluate(() => window.__pp.dun.openCards('strong2')); await page.waitForTimeout(400);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/slots-cards.png') });
  await page.evaluate(() => window.__pp.closeSheet());
  // in game: two strong buttons (tiered '+' from stage 5) + Ult+
  await page.evaluate(() => window.__pp.dun.startDungeon(1, 3));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); });
  await page.waitForTimeout(2600);
  const used = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.mp = 999; const out = []; ['strong', 'strong2'].forEach(k => { const before = D.g[{ strong: 'cdS', strong2: 'cdS2' }[k]]; D.useStrong(k); out.push([k, D.KIT[k] && D.KIT[k].name, D.KIT[k] && D.KIT[k].tier, before, +D.g[{ strong: 'cdS', strong2: 'cdS2' }[k]].toFixed(2)]); }); return { out, ult: D.KIT.ult.name, tier: D.KIT.ult.tier }; });
  console.log('used', JSON.stringify(used));
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/slots-game.png') });
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
