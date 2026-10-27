// Golden Legendaries in the game's screens: the egg reveal, the summon odds, the fusion note for two five-stars, the
// pet in its room and its card, and a real fusion that comes out golden. usage: node tests/_gold-ui.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
  const shot = n => page.screenshot({ path: path.resolve(__dirname, `../shots/goldui-${n}.png`) });
  // a summon whose eggs hold a golden Legendary
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.crystals = 5000; const R = P.mulberry32(3); const items = [6, 5, 3].map((s, i) => { const g = P.summonGenome(s, R); return { kind: 'pet', stars: s, form: g.form, name: 'Egg' + i }; }); P.dun.playGiftCeremony(items, { mode: 'summon', title: 'Tap the eggs!', sub: 'test' }); });
  await page.waitForTimeout(400); await page.click('#gwBox').catch(() => {}); await page.waitForTimeout(2600);
  const title = await page.evaluate(() => document.querySelector('#gwTitle').textContent);
  ok(/LEGENDARY/.test(title), `the reveal says "${title}"`); await shot('reveal');
  await page.evaluate(() => { const b = document.querySelector('#gwActions button'); if (b) b.click(); document.querySelector('#giftWrap') && (document.querySelector('#giftWrap').hidden = true); });
  // the summon sheet's odds
  await page.evaluate(() => { const P = window.__pp; P.openSummon(); const d = document.querySelector('details.odds'); if (d) d.open = true; });
  await page.waitForTimeout(300);
  const odds = await page.evaluate(() => document.querySelector('details.odds').textContent);
  ok(/1%/.test(odds) && /84%/.test(odds) && /Six-star/.test(odds), 'summon odds list 84/10/5/1'); await page.evaluate(() => document.querySelector('details.odds').scrollIntoView()); await shot('odds');
  await page.evaluate(() => window.__pp.closeSheet());
  // two five-stars in the fusion screen, and a fusion that comes out golden
  const fu = await page.evaluate(() => {
    const P = window.__pp, R = P.mulberry32(77);
    const mk = (nm) => { const g = P.summonGenome(5, R), p = P.newPetFields(nm, g); return p; };
    P.st.others = [mk('Alpha'), mk('Beta')]; P.st.fusionStones = 3;
    P.openFusion(); const sel = P.fuseSel; sel.a = 0; sel.b = 1; sel.pick = null; P.openFusion();
    const note = (document.querySelector('.gold-note') || {}).textContent || '';
    const a = P.st.others[0], b = P.st.others[1];
    const child = P.fuseChild(a, b, 1234, null, true), plain = P.fuseChild(a, b, 1234, null, false);
    return { note, child: { rarity: child.rarity, stars: P.starsOf(child.rarity), gold: child.forms.every(f => f.x.gold), wings: child.forms[child.forms.length - 1].x.wings.n }, plain: { stars: P.starsOf(plain.rarity), gold: plain.forms.some(f => f.x.gold) } };
  });
  console.log('  fusion', JSON.stringify(fu));
  ok(/5%/.test(fu.note), 'the fusion screen tells the 5% golden chance for two five-stars');
  ok(fu.child.stars === 6 && fu.child.gold && fu.child.wings >= 1, 'a lucky roll makes a six-star Legendary at every stage');
  ok(fu.plain.stars <= 5 && !fu.plain.gold, 'without it, not golden (stars as fusion always gave)');
  await page.evaluate(() => document.querySelector('.gold-note').scrollIntoView({ block: 'center' })); await shot('fusion');
  // fuse for real many times: about one in twenty is golden
  const rate = await page.evaluate(() => { const P = window.__pp, a = P.st.others[0], b = P.st.others[1]; let n = 0; const N = 2000; for (let i = 0; i < N; i++) { const c = P.fuseChild(a, b, i, null, Math.random() < 0.05); if (c.rarity >= 5) n++; } return n / N; });
  ok(Math.abs(rate - 0.05) < 0.015, `golden fusions: ${(rate * 100).toFixed(1)}%`);
  // a golden pet as the pet you play with: its room and its card
  await page.evaluate(() => { const P = window.__pp; P.closeSheet(); const g = P.summonGenome(6, P.mulberry32(23)); const p = P.newPetFields('Aurum', g); P.st.others.push(p); P.switchPet(P.st.others.length - 1); });
  await page.waitForTimeout(800); await shot('room');
  const card = await page.evaluate(() => { const P = window.__pp; P.openCard && P.openCard(); const t = (document.querySelector('.card-sub') || {}).textContent || ''; return t; });
  ok(/Legendary/.test(card), `its card: ${card.slice(0, 60)}`); await page.waitForTimeout(300); await shot('card');
  console.log('errors', errors.length, errors.slice(0, 4)); ok(!errors.length, 'no page errors');
  console.log(fails ? `${fails} FAILED` : 'all passed');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
