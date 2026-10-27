// The Shop room at home: its button and its fixtures open the Shop; everything is for sale there (crystals, boxes and eggs
// as test purchases, Fusion Stones, the special foods, pantry food and drinks); buying spends the right money and fills
// the pantry; crystals and stones bought there come back to it; the new foods do what they say for any pet (from Team
// and the Feed tray); every treasure box holds a bond treat; the Tower drops them; they survive a save.
// usage: node tests/shop.js
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
    const P = window.__pp; P.quickStart('Lead'); P.st.coins = 5000; P.st.crystals = 700; P.st.energy = 100; P.st.dlv = 10;
    for (let i = 0; i < 2; i++) { const f = P.newPetFields('Pal' + i, P.makeGenome(P.mulberry32(i * 17 + 3))); f.dlv = [12, 40][i]; f.xp = [500, 3000][i]; P.st.others.push(f); }
    return { others: P.st.others.map(p => p.uid), rooms: P.st.house.rooms.map(r => r.type) };
  });
  // 1. the shop room: its button shows there (and only there), and its fixtures can be tapped
  const shopAt = S.rooms.indexOf('shop');
  check(shopAt >= 0, 'every house has a shop room');
  const btn0 = await page.evaluate(() => !document.querySelector('#shopBtn').hidden);
  await page.evaluate(i => window.__pp.switchRoom(i), shopAt); await page.waitForTimeout(600);
  const room = await page.evaluate(() => { const b = document.querySelector('#shopBtn'), r = b.getBoundingClientRect(); const fx = [...document.querySelectorAll('.decor.labtap')].map(d => getComputedStyle(d).pointerEvents); return { vis: !b.hidden && r.width > 60, fx }; });
  check(!btn0 && room.vis, 'the Open the Shop button shows in the shop room, not elsewhere');
  check(room.fx.length >= 4 && room.fx.every(v => v === 'auto'), 'the shop fixtures can be tapped (' + room.fx.length + ')');
  await page.screenshot({ path: path.resolve(__dirname, '../shots/shop-room.png') });
  // tapping the counter opens the Shop
  const counter = await page.evaluate(() => { const d = [...document.querySelectorAll('.decor.labtap')].find(e => /counter/i.test(e.getAttribute('aria-label') || e.dataset.id || e.className) ) || [...document.querySelectorAll('.decor.labtap')][0]; const r = d.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.6 }; });
  await page.touchscreen.tap(counter.x, counter.y); await page.waitForTimeout(400);
  const k1 = await page.evaluate(() => window.__pp.sheetKind);
  check(k1 === 'shop' || k1 === 'crystals' || k1 === 'gift', 'tapping a fixture opens a shop (' + k1 + ')');
  await page.evaluate(() => window.__pp.closeSheet()); await page.waitForTimeout(200);
  await page.click('#shopBtn'); await page.waitForTimeout(400);
  const sh = await page.evaluate(() => ({ kind: window.__pp.sheetKind, txt: document.querySelector('#sheet').textContent.replace(/\s+/g, ' '), rows: [...document.querySelectorAll('.shop-row')].map(r => r.querySelector('b').textContent) }));
  check(sh.kind === 'shop', 'the button opens the Shop');
  check(/5,?000 crystals/.test(sh.txt) && /\$10\.00 · test purchase/.test(sh.txt), 'the Shop sells 5000 crystals for $10 as a test purchase');
  check(/Treasure box/.test(sh.txt) && /Mystery egg/.test(sh.txt) && /Fusion Stone/.test(sh.txt), 'and treasure boxes, eggs and Fusion Stones');
  check(['Ambrosia', 'Moon honeycomb', 'Grand feast', 'Heart tart', 'Kindred sundae', 'Carrots', 'Star soda'].every(n => sh.rows.includes(n)), 'and every food: ' + sh.rows.join(', '));
  await page.screenshot({ path: path.resolve(__dirname, '../shots/shop-sheet.png') });
  await page.evaluate(() => { const el = document.querySelector('[data-shop-sec="levels"]'); el.scrollIntoView(); }); await page.waitForTimeout(200);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/shop-food.png') });
  // 2. buying food: coins for most, crystals for the feast; refusing when short
  const buy = (k, n) => page.evaluate(([k, n]) => { const b = document.querySelector(`[data-go="shop-buy"][data-k="${k}"][data-n="${n}"]`); b.click(); const P = window.__pp; return { coins: P.st.coins, crystals: P.st.crystals, have: P.st.pantry[k] || 0, sheet: P.sheetKind }; }, [k, n]);
  const b1 = await buy('hearttart', 5); check(b1.coins === 5000 - 2000 && b1.have === 5 && b1.sheet === 'shop', 'five heart tarts cost 2000 coins and land in the pantry');
  const b2 = await buy('honeycomb', 1); check(b2.coins === 3000 - 250 && b2.have === 1, 'moon honeycomb costs 250 coins');
  const b3 = await buy('feast', 1); check(b3.crystals === 100 && b3.have === 1, 'a grand feast costs 600 crystals');
  const b4 = await buy('feast', 1); check(b4.crystals === 100 && b4.have === 1, 'without the crystals the feast is refused');
  const b5 = await buy('sundae', 1); check(b5.have === 1 && b5.coins === 2750 - 600, 'a kindred sundae costs 600 coins');
  // 3. crystals bought from the Shop come back to the Shop, and so does a Fusion Stone
  await page.evaluate(() => document.querySelector('[data-go="crystal-buy"]').click()); await page.waitForTimeout(250);
  const cf = await page.evaluate(() => ({ kind: window.__pp.sheetKind, back: document.querySelector('[data-go="crystal-confirm"]') && [...document.querySelectorAll('#sheet [data-go]')].map(b => b.dataset.go) }));
  check(cf.kind === 'crystals' && cf.back && cf.back.includes('shop'), 'the crystal confirmation goes back to the Shop');
  await page.evaluate(() => document.querySelector('[data-go="crystal-confirm"]').click()); await page.waitForTimeout(300);
  const c2 = await page.evaluate(() => ({ c: window.__pp.st.crystals, kind: window.__pp.sheetKind }));
  check(c2.c === 5100 && c2.kind === 'shop', 'the test purchase adds 5000 crystals and returns to the Shop');
  await page.evaluate(() => document.querySelector('[data-go="stone-buy"]').click()); await page.waitForTimeout(300);
  const s2 = await page.evaluate(() => ({ c: window.__pp.st.crystals, s: window.__pp.st.fusionStones, kind: window.__pp.sheetKind }));
  check(s2.c === 4600 && s2.s === 1 && s2.kind === 'shop', 'a Fusion Stone costs 500 crystals and the Shop stays open');
  // 4. feeding another pet from Team: half a level, twenty levels, two and three bond levels
  const T = await page.evaluate(async (uid) => {
    const P = window.__pp, A = P.shop, p = P.st.others.find(o => o.uid === uid);
    P.team.openTeam(uid); await new Promise(r => setTimeout(r, 200));
    const feed = k => { const b = document.querySelector(`[data-go="team-feed"][data-k="${k}"]`); if (!b) return 'no button'; b.click(); return null; };
    const L0 = p.dlv, x0 = p.dxp || 0, need0 = A.dunXpNeed(L0), half = A.foodXP('honeycomb', p);
    const e1 = feed('honeycomb'); const after1 = { L: p.dlv, x: p.dxp };
    const L1 = p.dlv, x1 = p.dxp; const e2 = feed('feast'); const after2 = { L: p.dlv, x: p.dxp };
    const B0 = A.bondInfo(p.xp); const e3 = feed('hearttart'); const B1 = A.bondInfo(p.xp); const e4 = feed('sundae'); const B2 = A.bondInfo(p.xp);
    const has = !!document.querySelector('.tm-feed');
    return { has, e: [e1, e2, e3, e4], L0, x0, need0, half, after1, L1, x1, after2, B0, B1, B2, pantry: Object.assign({}, P.st.pantry) };
  }, S.others[0]);
  check(T.has && T.e.every(e => !e), 'Team has a feed panel with the new foods: ' + T.e.join(','));
  check(T.half === Math.ceil(T.need0 / 2) && (T.after1.L > T.L0 || T.after1.x === T.x0 + T.half), 'moon honeycomb is half of the next level');
  check(T.after2.L === T.L1 + 20 && T.after2.x === T.x1, 'a grand feast is twenty levels, progress kept');
  check(T.B1.level === T.B0.level + 2 && Math.abs(T.B1.into - T.B0.into) < 1 && T.B2.level === T.B0.level + 5 && Math.abs(T.B2.into - T.B0.into) < 1, 'a heart tart is two bond levels and a kindred sundae three, progress kept');
  await page.screenshot({ path: path.resolve(__dirname, '../shots/shop-team-feed.png') });
  // 5. the pet you play eats a heart tart from the Feed tray: two bond levels
  await page.evaluate(() => window.__pp.closeSheet()); await page.waitForTimeout(200);
  const F0 = await page.evaluate(async () => {
    const P = window.__pp, A = P.shop; P.st.food = 20; const b0 = A.bondInfo(P.st.xp).level;
    document.querySelector('#btnFeed').click(); await new Promise(r => setTimeout(r, 300));
    const tile = document.querySelector('.tile.snack[data-snack="hearttart"]'); if (!tile) return { b0, txt: null };
    const r = tile.getBoundingClientRect(); return { b0, txt: tile.textContent, x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (F0.x) await page.mouse.click(F0.x, F0.y);
  await page.waitForTimeout(7000);
  const F = await page.evaluate(b => ({ b0: b.b0, b1: window.__pp.shop.bondInfo(window.__pp.st.xp).level, txt: b.txt }), F0);
  check(F.txt && /\+2 bond levels/.test(F.txt), 'the Feed tray lists the heart tart: ' + F.txt);
  check(F.b1 >= F.b0 + 2, `eating it gives the pet you play two bond levels (${F.b0} → ${F.b1})`);
  // 6. treasure boxes always hold a bond treat; the Tower drops the new foods; the pantry survives a save
  const G = await page.evaluate(() => {
    const P = window.__pp, A = P.shop; let treats = 0, lv = 0; const R = P.mulberry32(77);
    for (let i = 0; i < 200; i++) { const r = (P.dun.rollGiftBox || P.rollGiftBox)(R, 0); if (r.treat === 'hearttart' || r.treat === 'sundae') treats++; if (r.lvFood) lv++; }
    const before = Object.assign({}, P.st.pantry), out = (P.dun.applyGiftBox || P.applyGiftBox)((P.dun.rollGiftBox || P.rollGiftBox)(P.mulberry32(5), 0)), got = out.filter(o => o.kind === 'food').map(o => o.crop);
    const drops = A.FOOD_DROPS.map(d => d[0]), boss = A.BOSS_FOOD.map(d => d[0]);
    const saved = P.sanitize(JSON.parse(JSON.stringify(P.serialize ? P.serialize() : P.st)));
    return { treats, lv, got, drops, boss, keep: ['hearttart', 'sundae', 'honeycomb', 'feast'].map(k => [k, (P.st.pantry[k] || 0), saved && saved.pantry ? saved.pantry[k] || 0 : -1]) };
  });
  check(G.treats === 200 && G.lv > 20 && G.lv < 90, `every box has a bond treat (${G.treats}/200), some a level food (${G.lv})`);
  check(G.got.some(k => k === 'hearttart' || k === 'sundae'), 'opening a box puts its treat in the pantry: ' + G.got.join(','));
  check(['hearttart', 'sundae', 'honeycomb'].every(k => G.drops.includes(k)) && ['hearttart', 'sundae', 'honeycomb', 'feast'].every(k => G.boss.includes(k)), 'monsters and bosses drop the new foods');
  check(G.keep.every(([k, a, b]) => a === b), 'the new foods survive a save: ' + JSON.stringify(G.keep));
  console.log(JSON.stringify({ room, sh: sh.rows, b1, b2, b3, b4, b5, c2, s2, T, F, G }));
  console.log(fails.length ? 'shop FAIL: ' + fails.join('; ') : 'shop OK');
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
