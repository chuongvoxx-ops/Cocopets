// moving a save: Copy code on one device, Paste code on another: the pets, coins and progress come across
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const errs = [];
  const page = async () => { const ctx = await b.newContext({ viewport: { width: 393, height: 852 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html')); await p.waitForFunction(() => window.__pp); return p; };
  const A = await page(); await A.evaluate(() => { const P = window.__pp; P.quickStart('Mochi'); P.st.coins = 4321; P.st.dun.best = 37; P.openCard(); });
  await A.waitForTimeout(400); await A.click('[data-go="save-out"]'); await A.waitForTimeout(300);
  const code = await A.evaluate(() => document.getElementById('saveCode').value); ok(code.startsWith('COCOPETS1:') && code.length > 1000, 'Copy code gives a save code', code.length);
  const B = await page(); await B.evaluate(() => { const P = window.__pp; P.quickStart('Other'); P.st.coins = 5; P.openCard(); }); await B.waitForTimeout(400);
  await B.click('[data-go="save-in"]'); await B.fill('#saveCode', 'not a code'); await B.click('[data-go="save-load"]'); const bad1 = await B.evaluate(() => ({ msg: document.getElementById('saveMsg').textContent, name: window.__pp.st.name }));
  ok(bad1.name === 'Other' && /isn't a save code/.test(bad1.msg), 'a wrong code is refused and nothing changes', bad1);
  await B.fill('#saveCode', code); await B.click('[data-go="save-load"]'); await B.waitForTimeout(800);
  const r = await B.evaluate(() => { const s = window.__pp.st; return { name: s.name, coins: s.coins, best: s.dun.best, local: JSON.parse(localStorage.getItem('pocket-pet-v1') || '{}').name }; });
  ok(r.name === 'Mochi' && r.coins === 4321 && r.best === 37 && r.local === 'Mochi', 'Paste code brings the pet, coins and Tower progress across, and saves them here', r);
  ok(!errs.length, 'no page errors', errs.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); await b.close(); process.exit(bad ? 1 : 0); })();
