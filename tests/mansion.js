// The mansion view: build rooms from lots, paint, rename, walk in, swap and remove; screenshots along the way.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  await page.waitForTimeout(400);
  const out = path.resolve(__dirname, '../shots'); fs.mkdirSync(out, { recursive: true });
  const fail = m => { console.log('FAIL', m); errors.push('assert: ' + m); };
  const q = (sel) => page.evaluate(s => { const el = document.querySelector(s); return el ? { hidden: el.hidden, text: el.innerText.slice(0, 200) } : null; }, sel);

  await page.evaluate(() => { const P = window.__pp; if (!P.st) P.quickStart('Mochi'); P.st.coins = 20000; const R = P.mulberry32(5), g = P.makeGenome(R), o = P.newPetFields('Biscuit', g); o.forms = P.evolveLine(g.form, 3, R); o.stage = 3; P.st.others.push(o); });
  // open from the House button
  await page.click('#btnHouse');
  await page.waitForTimeout(500);
  let r = await page.evaluate(() => ({ open: !document.querySelector('#mansion').hidden, rooms: document.querySelectorAll('.mn-room').length, lots: [...document.querySelectorAll('.mn-lot')].map(l => l.dataset.lot), pets: document.querySelectorAll('.mn-pet').length, title: document.querySelector('.mn-title').textContent }));
  console.log('opened', JSON.stringify(r));
  if (!r.open || r.rooms !== 2 || r.pets !== 2 || !r.lots.includes('indoor') || !r.lots.includes('ground')) fail('initial mansion ' + JSON.stringify(r));
  await page.screenshot({ path: path.join(out, 'mn-1-start.png') });

  // build from the indoor lot, then the ground lot, then more via the Build button
  const build = async (lot, type) => {
    if (lot) await page.click(`.mn-lot[data-lot="${lot}"]`); else await page.click('#mnBuild');
    await page.waitForTimeout(250);
    const ok = await page.evaluate(t => { const b = document.querySelector(`.build-card[data-type="${t}"]`); if (!b || b.disabled) return false; b.click(); return true; }, type);
    if (!ok) fail('no build card for ' + type + ' from ' + lot);
    await page.waitForTimeout(350);
  };
  await build('indoor', 'bedroom');
  r = await page.evaluate(() => ({ rooms: document.querySelectorAll('.mn-room').length, open: !document.querySelector('#mansion').hidden, sheet: document.querySelector('#sheetWrap').hidden, cur: window.__pp.st.house.cur, n: window.__pp.st.house.rooms.length }));
  if (!r.open || r.rooms !== 3 || !r.sheet || r.n !== 3) fail('build bedroom ' + JSON.stringify(r));
  await build('ground', 'garden');
  await build(null, 'kitchen');
  await build(null, 'farm');
  await build(null, 'playroom');
  await page.waitForTimeout(900);
  r = await page.evaluate(() => { const rows = [...document.querySelectorAll('.mn-floor-row')].map(row => [...row.children].map(c => c.classList.contains('mn-room') ? c.querySelector('.mn-name').textContent : c.classList.contains('mn-lot') ? '+' : '·')); return { rows, yard: [...document.querySelectorAll('.mn-yard > *')].map(e => e.classList.contains('mn-lot') ? '+' : e.querySelector('.mn-name').textContent), items: document.querySelectorAll('.mn-it').length, w: document.querySelector('.mn-scroll').scrollWidth, cw: document.querySelector('.mn-scroll').clientWidth, h: document.querySelector('.mn-scroll').scrollHeight, ch: document.querySelector('.mn-scroll').clientHeight }; });
  console.log('layout', JSON.stringify(r));
  if (r.rows.length !== 3 || r.rows[2].join() !== 'Living room,Shop' || r.rows[1].join() !== 'Bedroom,Kitchen' || r.rows[0].join() !== 'Playroom,+') fail('floor layout wrong ' + JSON.stringify(r.rows));
  if (r.yard.join() !== 'Garden,Farm,+') fail('yard wrong ' + r.yard.join());
  if (r.w > r.cw) fail('mansion scrolls sideways at 390px');
  await page.screenshot({ path: path.join(out, 'mn-2-built.png') });

  // paint and name
  await page.click('#mnPaint'); await page.waitForTimeout(250);
  await page.click('.swatch[data-id="lilac"]'); await page.waitForTimeout(200);
  await page.click('.swatch[data-id="teal"]'); await page.waitForTimeout(200);
  await page.fill('#houseRenameInput', 'Villa Mochi'); await page.press('#houseRenameInput', 'Enter'); await page.waitForTimeout(300);
  r = await page.evaluate(() => ({ paint: window.__pp.st.house.paint, roof: window.__pp.st.house.roof, name: window.__pp.st.house.name, title: document.querySelector('.mn-title').textContent, plaque: document.querySelector('.mn-plaque').textContent, sheet: document.querySelector('#sheetWrap').hidden }));
  console.log('paint', JSON.stringify(r));
  if (r.paint !== 'lilac' || r.roof !== 'teal' || r.title !== 'Villa Mochi' || r.plaque !== 'Villa Mochi' || !r.sheet) fail('paint/name');
  await page.screenshot({ path: path.join(out, 'mn-3-painted.png') });

  // select the kitchen (first tap selects, the bar shows it), then ⋯ opens the room sheet; swap it with the playroom, then remove it
  const idx = async t => page.evaluate(t => window.__pp.st.house.rooms.findIndex(x => x.type === t), t);
  let ki = await idx('kitchen');
  await page.click(`.mn-room[data-i="${ki}"]`); await page.waitForTimeout(300);
  r = await page.evaluate(() => ({ open: !document.querySelector('#mansion').hidden, bar: document.querySelector('.mn-bar-txt b').textContent, sel: document.querySelectorAll('.mn-room.sel').length }));
  if (!r.open || !/Kitchen/.test(r.bar) || r.sel !== 1) fail('select ' + JSON.stringify(r));
  await page.click('[data-act="more"]'); await page.waitForTimeout(300);
  r = await page.evaluate(() => ({ kind: window.__pp.sheetKind, cur: window.__pp.st.house.cur, title: document.querySelector('#sheetTitle').textContent }));
  if (r.kind !== 'house' || r.cur !== ki || r.title !== 'Kitchen') fail('room sheet ' + JSON.stringify(r));
  await page.screenshot({ path: path.join(out, 'mn-4-roomsheet.png') });
  await page.click('[data-go="room-move"][data-d="1"]'); await page.waitForTimeout(300);
  r = await page.evaluate(() => ({ order: window.__pp.st.house.rooms.map(x => x.type), cur: window.__pp.st.house.cur, row1: [...document.querySelectorAll('.mn-floor-row')][1] && [...document.querySelectorAll('.mn-floor-row')][1].innerText.replace(/\s+/g, ' ') }));
  console.log('swap', JSON.stringify(r));
  if (r.order.join() !== 'living,shop,bedroom,garden,playroom,farm,kitchen') fail('swap skipped outdoor rooms wrongly: ' + r.order.join());
  await page.click('#roomRemoveBtn'); await page.waitForTimeout(150); await page.click('#roomRemoveBtn'); await page.waitForTimeout(400);
  r = await page.evaluate(() => ({ n: window.__pp.st.house.rooms.length, rooms: document.querySelectorAll('.mn-room').length, open: !document.querySelector('#mansion').hidden, inv: window.__pp.st.inv }));
  console.log('removed', JSON.stringify(r));
  if (r.n !== 6 || r.rooms !== 6 || !r.open || !r.inv.fridge) fail('remove');

  // walk into the garden: first tap selects it, the second walks in; the mansion closes and the room switches
  const gi = await idx('garden');
  await page.click(`.mn-room[data-i="${gi}"]`); await page.waitForTimeout(300);
  await page.click(`.mn-room[data-i="${gi}"]`); await page.waitForTimeout(600);
  r = await page.evaluate(() => ({ open: !document.querySelector('#mansion').hidden, type: window.__pp.st.room.type, cls: document.body.className }));
  console.log('enter', JSON.stringify(r));
  if (r.open || r.type !== 'garden' || /in-mansion/.test(r.cls)) fail('enter room');
  await page.screenshot({ path: path.join(out, 'mn-5-garden.png') });

  // night look + desktop width + reload keeps paint and name
  await page.evaluate(() => { document.querySelector('#room').dataset.sky = 'night'; window.__pp.openHouse(); });
  await page.waitForTimeout(300);
  r = await page.evaluate(() => ({ kind: window.__pp.sheetKind, btn: !!document.querySelector('[data-go="mansion"]') }));
  if (r.kind !== 'house' || !r.btn) fail('room sheet from the room bar lacks the mansion button');
  await page.click('[data-go="mansion"]'); await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, 'mn-6-night.png') });
  await page.setViewportSize({ width: 1100, height: 760 }); await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, 'mn-7-desktop.png') });
  await page.setViewportSize({ width: 320, height: 640 }); await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, 'mn-8-narrow.png') });
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  r = await page.evaluate(() => !document.querySelector('#mansion').hidden);
  if (r) fail('escape did not close the mansion');
  await page.waitForTimeout(1200);
  await page.reload(); await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(800);
  r = await page.evaluate(() => { const h = window.__pp.st.house; return { paint: h.paint, roof: h.roof, name: h.name, n: h.rooms.length }; });
  console.log('reloaded', JSON.stringify(r));
  if (r.paint !== 'lilac' || r.roof !== 'teal' || r.name !== 'Villa Mochi' || r.n !== 6) fail('reload lost mansion state');

  console.log('errors:', errors.length, errors.slice(0, 8));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
