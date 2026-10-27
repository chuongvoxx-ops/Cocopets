// the level-10 gift: three eggs of three to five stars, once; a full house keeps the rest owed till there is room
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage({ viewport: { width: 393, height: 852 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'test.html')); await p.waitForFunction(() => window.__pp); await p.evaluate(() => window.__pp.quickStart('Bot')); await p.waitForTimeout(2500);
  const S = () => p.evaluate(() => { const s = window.__pp.st; return { pets: 1 + s.others.length, owed: s.lv10Owed, given: s.lv10Eggs, gift: !document.getElementById('giftWrap').hidden, title: document.getElementById('gwTitle').textContent }; });
  let r = await S(); ok(r.pets === 1 && !r.gift && !r.given, 'below level 10: no gift', r);
  await p.evaluate(() => { window.__pp.st.dlv = 10; }); await p.waitForTimeout(2200); r = await S();
  ok(r.gift && r.pets === 4 && r.owed === 0 && /Level 10/.test(r.title), 'level 10 at home: the egg ceremony, three new pets', r);
  await p.evaluate(() => { document.getElementById('giftWrap').hidden = true; }); await p.evaluate(() => { window.__pp.st.dlv = 12; }); await p.waitForTimeout(2200); r = await S();
  ok(!r.gift && r.pets === 4, 'given once: no second gift at a higher level', r);
  // a fresh save with a nearly full house
  await p.evaluate(() => { const P = window.__pp; P.quickStart('Full'); const s = P.st; while (1 + s.others.length < 49) s.others.push(JSON.parse(JSON.stringify(s.others[0] || P.packPet()))); s.dlv = 10; }); await p.waitForTimeout(2600); r = await S();
  ok(r.gift && r.pets === 50 && r.owed === 2, 'one place free: one egg now, two owed', r);
  await p.evaluate(() => { document.getElementById('giftWrap').hidden = true; window.__pp.st.others.splice(0, 3); }); await p.waitForTimeout(2200); r = await S();
  ok(r.gift && r.owed === 0, 'room made: the two owed eggs hatch', r);
  ok(!errs.length, 'no page errors', errs.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); await b.close(); process.exit(bad ? 1 : 0); })();
