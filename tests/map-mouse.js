// the world map with a mouse: a click on a place opens its card; a drag pans without opening anything
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'test.html')); await p.waitForFunction(() => window.__pp);
  await p.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.openMap(); P.dun.setMapTab('world', true); }); await p.waitForTimeout(800);
  const spot = await p.evaluate(() => { const el = [...document.querySelectorAll('.wm-spot[data-wm="rift"]')].find(e => { const r = e.getBoundingClientRect(); return r.width && r.top > 120 && r.bottom < 700 && r.left > 20 && r.right < 1260; }); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, id: el.dataset.id }; });
  ok(!!spot, 'a rift is on screen to click', spot);
  if (spot) { await p.mouse.click(spot.x, spot.y); await p.waitForTimeout(300); const card = await p.evaluate(() => { const c = document.getElementById('mapCard'); return { shown: !c.hidden, text: c.textContent.slice(0, 60) }; }); ok(card.shown, 'a mouse click on it opens its card', card); }
  await p.evaluate(() => { document.getElementById('mapCard').hidden = true; }); const t0 = await p.evaluate(() => document.getElementById('worldPan').style.transform);
  if (spot) { await p.mouse.move(spot.x, spot.y); await p.mouse.down(); await p.mouse.move(spot.x + 120, spot.y + 60, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(300); }
  const after = await p.evaluate(() => ({ t: document.getElementById('worldPan').style.transform, card: !document.getElementById('mapCard').hidden }));
  ok(after.t !== t0 && !after.card, 'a drag pans the map and opens nothing', after);
  const tw = await p.evaluate(() => { const el = document.querySelector('.wm-spot[data-wm="tower"]'); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  // and a phone's tap still opens a place
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true }); const q = await ctx.newPage(); q.on('pageerror', e => errs.push(e.message));
  await q.goto('file://' + path.resolve(__dirname, '..', 'test.html')); await q.waitForFunction(() => window.__pp); await q.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.openMap(); P.dun.setMapTab('world', true); }); await q.waitForTimeout(800);
  const s2 = await q.evaluate(() => { const el = [...document.querySelectorAll('.wm-spot[data-wm="rift"], .wm-spot[data-wm="gate"], .wm-spot[data-wm="extra"]')].find(e => { const r = e.getBoundingClientRect(); return r.width && r.top > 120 && r.bottom < 760 && r.left > 10 && r.right < 383; }); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  if (s2) { await q.touchscreen.tap(s2.x, s2.y); await q.waitForTimeout(300); } ok(!!s2 && await q.evaluate(() => !document.getElementById('mapCard').hidden), 'a phone tap on a place opens its card', s2);
  ok(!errs.length, 'no page errors', errs.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); await b.close(); process.exit(bad ? 1 : 0); })();
