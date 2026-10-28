// the welcome gift (5000 crystals + a treasure box + three gemstones + a free 10-egg summon, once) and the daily rewards calendar
// (100 crystals every third day, goodies between, 1000 crystals on the month's last day, a new month starts over)
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage({ viewport: { width: 393, height: 852 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'test.html')); await p.waitForFunction(() => window.__pp); await p.evaluate(() => window.__pp.quickStart('Bot')); await p.waitForTimeout(2000);
  const shut = () => p.evaluate(() => { document.getElementById('giftWrap').hidden = true; window.__pp.closeSheet(); });
  const S = () => p.evaluate(() => { const s = window.__pp.st; return { cr: s.crystals, coins: s.coins, gems: Object.values(s.gems).reduce((a, b) => a + b, 0), gift: !document.getElementById('giftWrap').hidden, title: document.getElementById('gwTitle').textContent, sheet: window.__pp.sheetKind, login: JSON.parse(JSON.stringify(s.login)), welcome: s.welcome }; });
  let r = await S(); ok(!r.gift && !r.sheet, 'a test save starts quiet (welcome and today seen)', r);
  // the welcome gift, for a new player
  await p.evaluate(() => { const s = window.__pp.st; s.welcome = 0; s.crystals = 0; s.gems = {}; }); await p.waitForTimeout(2000); r = await S();
  const ft = await p.evaluate(() => window.__pp.st.freeTen);
  ok(r.gift && /Welcome/.test(r.title) && r.cr >= 6000 && r.gems >= 6 && r.welcome === 1 && ft === 1, 'welcome: 5000 crystals, a treasure box (its own 1000 and 3 gems), 3 more gemstones and a free 10-egg summon', { cr: r.cr, gems: r.gems, title: r.title, ft });
  await shut(); await p.waitForTimeout(2000); r = await S(); ok(!r.gift || !/Welcome/.test(r.title), 'the welcome gift comes once', r.title);
  // the free summon: the summon screen opens to offer it; 10 eggs for no crystals
  ok(r.sheet === 'summon', 'the summon screen opens with the free summon', r.sheet);
  const btn = await p.evaluate(() => document.querySelector('[data-go="summon-10"]').textContent);
  ok(/Free/.test(btn), 'the 10-egg button reads Free', btn);
  const before = await p.evaluate(() => ({ cr: window.__pp.st.crystals, pets: window.__pp.st.others.length }));
  await p.click('[data-go="summon-10"]'); await p.waitForTimeout(500);
  const after = await p.evaluate(() => ({ cr: window.__pp.st.crystals, pets: window.__pp.st.others.length, ft: window.__pp.st.freeTen }));
  ok(after.cr === before.cr && after.pets === before.pets + 10 && after.ft === 0, 'the free summon: 10 pets, no crystals spent, used up', { before, after });
  await shut(); await p.waitForTimeout(1800); r = await S(); ok(r.sheet !== 'summon', 'no more free summon offered', r.sheet);
  await p.evaluate(() => window.__pp.openSummon && window.__pp.openSummon()); const btn2 = await p.evaluate(() => (document.querySelector('[data-go="summon-10"]') || {}).textContent || '');
  ok(!/Free/.test(btn2), 'afterwards 10 eggs cost crystals again', btn2);
  await shut();
  // the calendar: a new day opens it by itself; Collect gives day 1
  await p.evaluate(() => { window.__pp.st.login = { m: '', n: 0, last: '', seen: '' }; }); await p.waitForTimeout(2000); r = await S();
  ok(r.sheet === 'login', 'a new day: the calendar opens by itself', r.sheet);
  const cells = await p.evaluate(() => [...document.querySelectorAll('.lg-day')].map(d => d.textContent.replace(/\s+/g, ' ').trim()));
  const nd = await p.evaluate(() => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate());
  ok(cells.length === nd && /Day 3.*100/.test(cells[2]) && /Day 6.*100/.test(cells[5]) && new RegExp(`Day ${nd}.*1,?000`).test(cells[nd - 1]), 'the calendar: one cell a day, 100 crystals on days 3 and 6, 1000 on the last', [cells[0], cells[2], cells[nd - 1]]);
  const c0 = r.coins; await p.click('[data-go="login-claim"]'); await p.waitForTimeout(500); r = await S();
  ok(r.gift && /Day 1/.test(r.title) && r.coins === c0 + 200 && r.login.n === 1, 'day 1: 200 coins', { coins: r.coins - c0, n: r.login.n });
  await shut(); await p.waitForTimeout(1800); r = await S(); ok(!r.sheet, 'the same day: it does not open again', r.sheet);
  // day 2 (a gemstone) and day 3 (100 crystals) on the following days
  const nextDay = () => p.evaluate(() => { const L = window.__pp.st.login; L.last = '2000-01-01'; L.seen = '2000-01-01'; });
  await nextDay(); await p.waitForTimeout(2000); const g0 = (await S()).gems; await p.click('[data-go="login-claim"]'); await p.waitForTimeout(400); r = await S(); ok(r.gems === g0 + 1 && r.login.n === 2, 'day 2: a gemstone', { gems: r.gems - g0 }); await shut();
  await nextDay(); await p.waitForTimeout(2000); const k0 = (await S()).cr; await p.click('[data-go="login-claim"]'); await p.waitForTimeout(400); r = await S(); ok(r.cr === k0 + 100 && r.login.n === 3, 'day 3: 100 crystals', { cr: r.cr - k0 }); await shut();
  // the month's last day: 1000 crystals whatever the count
  await p.evaluate(() => { const d = new Date(); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12).getTime(), off = last - Date.now(), now0 = Date.now.bind(Date); Date.now = () => now0() + off; });
  await nextDay(); await p.waitForTimeout(2000); const f0 = (await S()).cr; await p.click('[data-go="login-claim"]'); await p.waitForTimeout(400); r = await S(); ok(r.cr === f0 + 1000 && /month/.test(r.title), "the month's last day: 1000 crystals", { cr: r.cr - f0, title: r.title }); await shut();
  // a new month starts over at day 1
  await p.evaluate(() => { const d = new Date(Date.now()); const nx = new Date(d.getFullYear(), d.getMonth() + 1, 2, 12).getTime(), off = nx - d.getTime(), n0 = Date.now; Date.now = () => n0() + off; });
  await nextDay(); await p.waitForTimeout(2000); await p.click('[data-go="login-claim"]'); await p.waitForTimeout(400); r = await S(); ok(r.login.n === 1 && /Day 1/.test(r.title), 'a new month: day 1 again', r.login);
  ok(!errs.length, 'no page errors', errs.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); await b.close(); process.exit(bad ? 1 : 0); })();
