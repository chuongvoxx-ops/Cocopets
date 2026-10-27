// The Grand feast raises a pet twenty of its own levels, progress kept, whichever way it is eaten (the Feed tray at home,
// another pet from Team, and from the pause menu in the Tower), and never touches the Tower's floors. Every place that
// describes it says pet levels. usage: node tests/feast.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const fails = []; const check = (ok, what) => { if (!ok) fails.push(what); };
  const S = await page.evaluate(() => {
    const P = window.__pp; P.quickStart('Lead'); P.st.coins = 5000; P.st.crystals = 5000; P.st.energy = 100; P.st.dlv = 30; P.st.dxp = 120; P.st.food = 20;
    P.st.dun.best = 14; P.st.pantry.feast = 5;
    const f = P.newPetFields('Pal', P.makeGenome(P.mulberry32(21))); f.dlv = 7; f.dxp = 33; P.st.others.push(f);
    return { other: f.uid };
  });
  // 1. what the Shop says
  const sh = await page.evaluate(async () => {
    const P = window.__pp; P.shop.openShop('levels'); await new Promise(r => setTimeout(r, 250));
    const sheet = document.querySelector('.sheet') || document.body, rows = [...document.querySelectorAll('.shop-row')].map(r => r.textContent);
    const head = [...document.querySelectorAll('[data-shop-sec="levels"]')].map(e => e.textContent).join(' ');
    const feast = rows.find(t => /Grand feast/.test(t)) || ''; const txt = sheet.textContent; P.closeSheet(); return { head, feast, tower: /Tower levels?/.test(txt) };
  });
  check(/Food for pet levels/.test(sh.head), 'the Shop heading says pet levels: ' + sh.head);
  check(/Twenty pet levels at once/.test(sh.feast), 'the Shop says a grand feast is twenty pet levels: ' + sh.feast);
  check(!sh.tower, 'the Shop no longer says Tower levels');
  // 2. the pet you play eats one from the Feed tray
  await page.waitForTimeout(250);
  const F0 = await page.evaluate(async () => {
    const P = window.__pp; document.querySelector('#btnFeed').click(); await new Promise(r => setTimeout(r, 300));
    const sub = [...document.querySelectorAll('.tray-sub')].map(e => e.textContent).join(' | ');
    const tile = document.querySelector('.tile.snack[data-snack="feast"]'); if (!tile) return { txt: null, sub };
    const r = tile.getBoundingClientRect(); return { txt: tile.textContent, sub, x: r.x + r.width / 2, y: r.y + r.height / 2, L0: P.st.dlv, x0: P.st.dxp, best: P.st.dun.best };
  });
  check(F0.txt && /\+20 pet levels/.test(F0.txt), 'the Feed tray tile says +20 pet levels: ' + F0.txt);
  check(/pet levels and bond/.test(F0.sub) && !/Tower level/.test(F0.sub), 'the Feed tray says pet levels: ' + F0.sub);
  if (F0.x) await page.mouse.click(F0.x, F0.y);
  await page.waitForTimeout(7000);
  const F1 = await page.evaluate(() => ({ L: window.__pp.st.dlv, x: window.__pp.st.dxp, best: window.__pp.st.dun.best, toast: (document.querySelector('.toast') || {}).textContent || '' }));
  check(F1.L === F0.L0 + 20 && F1.x === F0.x0, `eaten from the Feed tray: twenty pet levels, progress kept (${F0.L0} → ${F1.L}, ${F0.x0} → ${F1.x} XP)`);
  check(F1.best === F0.best, 'the Tower floors are untouched (best ' + F0.best + ' → ' + F1.best + ')');
  // 3. another pet fed from Team
  const T = await page.evaluate(async (uid) => {
    const P = window.__pp, p = P.st.others.find(o => o.uid === uid); P.closeSheet && P.closeSheet();
    P.team.openTeam(uid); await new Promise(r => setTimeout(r, 250));
    const b = document.querySelector('[data-go="team-feed"][data-k="feast"]'); if (!b) return { btn: null };
    const L0 = p.dlv, x0 = p.dxp, best = P.st.dun.best, lbl = b.textContent; b.click();
    return { btn: lbl, L0, x0, L1: p.dlv, x1: p.dxp, best0: best, best1: P.st.dun.best };
  }, S.other);
  check(T.btn && /\+20 pet levels/.test(T.btn), 'the Team feed button says +20 pet levels: ' + T.btn);
  check(T.L1 === T.L0 + 20 && T.x1 === T.x0, `fed from Team: twenty pet levels, progress kept (${T.L0} → ${T.L1})`);
  check(T.best1 === T.best0, 'and the Tower floors are untouched');
  // 4. eaten in the Tower, from the pause menu
  await page.evaluate(() => { const P = window.__pp; P.closeSheet && P.closeSheet(); P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 7));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 15000 });
  const D = await page.evaluate(() => {
    const P = window.__pp, G = P.arc.game, L0 = P.st.dlv, x0 = P.st.dxp, best = P.st.dun.best, ok = G.feed('feast');
    return { ok, L0, x0, L1: P.st.dlv, x1: P.st.dxp, best0: best, best1: P.st.dun.best };
  });
  check(D.ok && D.L1 === D.L0 + 20 && D.x1 === D.x0, `eaten in the Tower: twenty pet levels, progress kept (${D.L0} → ${D.L1})`);
  check(D.best1 === D.best0, 'the floor reached is untouched');
  await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); });
  // 5. the gift box's odds and contents say pet levels too
  const gf = await page.evaluate(async () => { const P = window.__pp; P.dun.openGiftShop && P.dun.openGiftShop(); await new Promise(r => setTimeout(r, 300)); const t = (document.querySelector('.sheet') || document.body).innerHTML; P.closeSheet && P.closeSheet(); return { pet: /twenty pet levels/.test(t), tower: /Tower level/.test(t) }; });
  check(gf.pet && !gf.tower, 'the treasure box describes the grand feast as twenty pet levels');
  check(errors.length === 0, 'no page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'feast OK');
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
