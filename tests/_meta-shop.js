// v460 META: the shop packages. Exact quantities and prices; a stone pack as one saved transaction; insufficient funds;
// a repeated press processed once; crystal packs with no store currency configured (no USD or AUD invented, nothing
// sold); the development-only mock checkout: cancelled, failed, success, a duplicate callback, unverified and mock-off
// results, and the ledger through a save and reload. usage: HTML=test-meta.html node tests/_meta-shop.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const HTML = process.env.HTML || 'test.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', HTML));
  await page.waitForFunction(() => window.__pp, null, { timeout: 20000 }); await page.waitForTimeout(300);
  const fails = [], passes = []; const ok = (c, what, info) => { (c ? passes : fails).push(what + (c || info === undefined ? '' : ' :: ' + JSON.stringify(info))); };
  const LS = () => page.evaluate(() => JSON.parse(localStorage.getItem('pocket-pet-v1')));

  const cfg = await page.evaluate(() => { const P = window.__pp, M = P.meta; P.quickStart('Buyer'); P.st.lv10Eggs = 1; P.closeSheet(); return { stones: M.STONE_PACKS, crystals: M.CRYSTAL_PACKS, cur: M.STORE_CFG.currency }; });
  ok(JSON.stringify(cfg.stones.map(p => [p.stones, p.cost])) === '[[10,1000],[20,1500]]', 'stone packs: 10 for 1,000 crystals, 20 for 1,500', cfg.stones);
  ok(JSON.stringify(cfg.crystals.map(p => [p.crystals, p.price])) === '[[5000,10],[20000,20]]' && cfg.cur === null, 'crystal packs: 5,000 for 10, 20,000 for 20 (store currency: none configured)', cfg.crystals);

  // 1. the Shop shows the packs: crystal prices only in a configured currency; here "Checkout not set up", no $ / USD / AUD
  const ui = await page.evaluate(() => { const P = window.__pp; P.shop.openShop(); const t = s => [...document.querySelectorAll(s)].map(e => e.textContent.trim());
    return { stone: t('.stone-packs .pack'), crystal: t('.crystal-packs .pack'), note: (document.querySelector('.pay-setup') || {}).textContent || '', dis: [...document.querySelectorAll('.crystal-packs .pack')].map(b => b.getAttribute('aria-disabled')) }; });
  ok(ui.stone.length === 2 && /10 Fusion Stones.*1,000 crystals/.test(ui.stone[0]) && /20 Fusion Stones.*1,500 crystals/.test(ui.stone[1]), 'the Shop lists both stone packs with their crystal prices', ui.stone);
  ok(ui.crystal.length === 2 && ui.crystal.every(s => /Checkout not set up/.test(s) && !/\$|USD|AUD/.test(s)) && /5,000 crystals/.test(ui.crystal[0]) && /20,000 crystals/.test(ui.crystal[1]) && ui.dis.every(d => d === 'true'), 'crystal packs: "Checkout not set up", no currency invented, unavailable', ui.crystal);
  ok(/Checkout setup required/.test(ui.note) && /store's currency/.test(ui.note), 'the setup requirement is spelled out', ui.note);

  // 2. a configured currency formats the price (and is never assumed otherwise)
  const fmt = await page.evaluate(() => { const M = window.__pp.meta; M.STORE_CFG.currency = 'EUR'; const a = M.storePrice(10); M.STORE_CFG.currency = 'xx'; const b = M.storePrice(10); M.STORE_CFG.currency = null; const c = M.storePrice(20); return { a, b, c }; });
  ok(fmt.a.ok && /€/.test(fmt.a.text) && /10/.test(fmt.a.text) && !fmt.b.ok && !fmt.c.ok && fmt.c.text === 'Checkout not set up', 'storePrice: EUR → formatted; invalid or none → setup needed', fmt);

  // 3. a stone pack: balance checked, crystals taken, stones given, saved, as one step
  const b1 = await page.evaluate(() => { const P = window.__pp, M = P.meta; P.st.crystals = 2600; P.st.fusionStones = 3; const r = M.buyStonePack('fs10', 'tok-a'); return { r, cr: P.st.crystals, fs: P.st.fusionStones }; });
  const s1 = await LS();
  ok(b1.r.ok && b1.cr === 1600 && b1.fs === 13 && s1.crystals === 1600 && s1.fusionStones === 13, '10 stones: 2,600 → 1,600 crystals, 3 → 13 stones, saved at once', { b1, saved: [s1.crystals, s1.fusionStones] });
  const b2 = await page.evaluate(() => { const P = window.__pp, M = P.meta; const r = M.buyStonePack('fs10', 'tok-a'); return { r, cr: P.st.crystals, fs: P.st.fusionStones }; });
  ok(!b2.r.ok && b2.r.why === 'duplicate' && b2.cr === 1600 && b2.fs === 13, 'the same press processed twice: the second does nothing', b2);
  const b3 = await page.evaluate(() => { const P = window.__pp, M = P.meta; const r = M.buyStonePack('fs20', 'tok-b'); return { r, cr: P.st.crystals, fs: P.st.fusionStones }; });
  ok(b3.r.ok && b3.cr === 100 && b3.fs === 33, '20 stones: 1,600 → 100 crystals, 13 → 33 stones', b3);
  const b4 = await page.evaluate(() => { const P = window.__pp, M = P.meta; const r = M.buyStonePack('fs10', 'tok-c'); return { r, cr: P.st.crystals, fs: P.st.fusionStones, toast: (document.querySelector('#toast') || {}).textContent }; });
  ok(!b4.r.ok && b4.r.why === 'funds' && b4.cr === 100 && b4.fs === 33 && /Not enough crystals: 10 Fusion Stones cost 1,000 crystals and you have 100 \(900 short\)/.test(b4.toast), 'insufficient funds: nothing changes, a clear message', b4);
  // a real double tap on the button (two clicks on the drawn button before it redraws): once
  const b5 = await page.evaluate(() => { const P = window.__pp; P.st.crystals = 5000; P.st.fusionStones = 0; P.shop.openShop(); const btn = document.querySelector('.stone-packs [data-id="fs10"]'); btn.click(); btn.click(); return { cr: P.st.crystals, fs: P.st.fusionStones }; });
  ok(b5.cr === 4000 && b5.fs === 10, 'two clicks on one drawn pack button: charged once', b5);
  const cap = await page.evaluate(() => { const P = window.__pp, M = P.meta; P.st.crystals = 5000; P.st.fusionStones = 990; const r = M.buyStonePack('fs20', 'tok-d'); const o = { r, cr: P.st.crystals, fs: P.st.fusionStones }; P.st.fusionStones = 10; return o; });
  ok(!cap.r.ok && cap.r.why === 'cap' && cap.cr === 5000 && cap.fs === 990, 'no stones lost at the 999 cap: refused before charging', cap);

  // 4. crystal packs with checkout not set up and the mock off: an explanation, nothing added
  const c0 = await page.evaluate(() => { const P = window.__pp, M = P.meta; P.st.devPay = false; P.st.crystals = 0; M.crystalPackTap('cr5k'); return { cr: P.st.crystals, sheet: P.sheetKind, txt: document.querySelector('#sheet').textContent }; });
  ok(c0.cr === 0 && c0.sheet === 'crystals' && /Checkout is not set up in this build/.test(c0.txt) && /Nothing was charged and no crystals were added/.test(c0.txt), 'mock off: tapping a crystal pack explains the missing checkout, adds nothing', c0);

  // 5. the development-only mock: cancelled and failed add nothing; success adds once; a repeated callback is ignored
  const m1 = await page.evaluate(() => { const P = window.__pp, M = P.meta; P.st.devPay = true; P.st.crystals = 0; P.st.payTx = [];
    M.crystalPackTap('cr5k'); const lbl = document.querySelector('.mock-banner').textContent; const r1 = M.mockPay('cancelled'), a1 = P.st.crystals;
    M.crystalPackTap('cr5k'); const r2 = M.mockPay('failed'), a2 = P.st.crystals;
    M.crystalPackTap('cr5k'); const r3 = M.mockPay('success'), a3 = P.st.crystals, r4 = M.mockPay('dup'), a4 = P.st.crystals;
    const log = [...document.querySelectorAll('.mock-log li')].map(l => l.textContent);
    M.crystalPackTap('cr20k'); const r5 = M.mockPay('success'), a5 = P.st.crystals;
    return { lbl, r: [r1, r2, r3, r4, r5], a: [a1, a2, a3, a4, a5], ledger: P.st.payTx.map(t => [t.p, t.m]), log }; });
  ok(/DEVELOPMENT-ONLY MOCK/.test(m1.lbl) && /No payment provider, no money/.test(m1.lbl), 'the mock is clearly labelled development-only, no money', m1.lbl);
  ok(JSON.stringify(m1.r) === JSON.stringify(['cancelled', 'failed', 'ok', 'duplicate', 'ok']) && JSON.stringify(m1.a) === JSON.stringify([0, 0, 5000, 5000, 25000]), 'cancel: 0; failure: 0; success: +5,000; duplicate callback: ignored; 20,000 pack: +20,000', m1);
  ok(JSON.stringify(m1.ledger) === JSON.stringify([['cr5k', 1], ['cr20k', 1]]) && m1.log.some(l => /Duplicate callback: ignored/.test(l)), 'the ledger holds one entry per granted transaction, marked mock', m1.ledger);
  const m2 = await page.evaluate(() => { const P = window.__pp, M = P.meta, C = M.Checkout; const t = C.begin('cr5k'); const u = C.complete({ id: t.id, pack: 'cr5k', status: 'success', verified: false, mock: true }), a = P.st.crystals;
    const stranger = C.complete({ id: 'mock_never_begun', pack: 'cr5k', status: 'success', verified: true, mock: true });
    P.st.devPay = false; const off = C.complete({ id: t.id, pack: 'cr5k', status: 'success', verified: true, mock: true }); P.st.devPay = true;
    const wrongPack = C.complete({ id: t.id, pack: 'cr20k', status: 'success', verified: true, mock: true });
    return { u: u.why, a, stranger: stranger.why, off: off.why, wrongPack: wrongPack.why, after: P.st.crystals, id: P.st.payTx[0].id }; });
  ok(m2.u === 'unverified' && m2.stranger === 'unknown' && m2.off === 'mock-off' && m2.wrongPack === 'unknown' && m2.after === 25000, 'unverified, unknown, mock-off and wrong-pack results grant nothing', m2);
  // the ledger survives a save and a reload, so a replayed callback after a reload is still a duplicate
  await page.evaluate(() => window.__pp.saveLocalNow()); await page.reload(); await page.waitForFunction(() => window.__pp && window.__pp.st, null, { timeout: 20000 }); await page.waitForTimeout(500);
  const m3 = await page.evaluate(id => { const P = window.__pp, C = P.meta.Checkout; const r = C.complete({ id, pack: 'cr5k', status: 'success', verified: true, mock: true }); return { why: r.why, cr: P.st.crystals, n: P.st.payTx.length }; }, m2.id);
  ok(m3.why === 'duplicate' && m3.cr === 25000 && m3.n === 2, 'after a reload the same transaction id is still refused', m3);

  console.log(passes.map(p => 'PASS ' + p).join('\n'));
  console.log(fails.map(p => 'FAIL ' + p).join('\n'));
  console.log(`${passes.length} passed, ${fails.length} failed; page errors: ${errors.length}`); errors.slice(0, 6).forEach(e => console.log('  ', e));
  await browser.close();
  process.exit(fails.length || errors.length ? 1 : 0);
})();
