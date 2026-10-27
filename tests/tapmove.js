// Two-thumb controls: the left stick is the only way to move; a tap fires one attack toward it and never walks the pet;
// holding a finger does not keep firing; the stick never attacks on its own.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 99; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(1, 11));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForTimeout(2700);
  const pos = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { x: +D.me.x.toFixed(2), y: +D.me.y.toFixed(2), taps: D.g.taps }; });
  const moved = (a, b) => +Math.hypot(b.x - a.x, b.y - a.y).toFixed(2);
  const out = {};
  // 1. a tap on the floor on the right: one attack, no walking
  let p0 = await pos();
  await page.evaluate(() => { const A = window.__pp.arc, G = A.game; G.down(A.W / 2 + 110, A.H / 2 - 40, 5); G.up(A.W / 2 + 110, A.H / 2 - 40, 5); });
  await page.waitForTimeout(1200);
  let p1 = await pos(); out.tapFloor = { moved: moved(p0, p1), fired: p1.taps - p0.taps };
  // 2. holding a finger fires once, not on repeat
  p0 = await pos();
  await page.evaluate(() => { const A = window.__pp.arc; A.game.down(A.W / 2 + 120, A.H / 2, 6); });
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(120); await page.evaluate(i => { const A = window.__pp.arc; A.game.move(A.W / 2 + 120, A.H / 2 + i * 6, 6); }, i); }
  await page.evaluate(() => { const A = window.__pp.arc; A.game.up(A.W / 2 + 120, A.H / 2, 6); });
  p1 = await pos(); out.hold = { moved: moved(p0, p1), fired: p1.taps - p0.taps };
  // 3. a tap on a far monster: attacks toward it, stays put
  p0 = await pos();
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, A = window.__pp.arc, me = D.me; const m = D.mons.filter(m => !m.dead).sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y))[0]; m.still = true; const sx = A.W / 2 + (m.x - me.x) * 40 * D.g.zoom, sy = A.H / 2 + (m.y - me.y) * 40 * D.g.zoom; A.game.down(Math.max(5, Math.min(A.W - 5, sx)), Math.max(5, Math.min(A.H - 5, sy)), 7); A.game.up(sx, sy, 7); });
  await page.waitForTimeout(1500);
  p1 = await pos(); out.tapMonster = { moved: moved(p0, p1), fired: p1.taps - p0.taps };
  // 4. the stick moves the pet and never attacks by itself
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.mons.forEach(m => { m.still = true; }); });
  out.stick = [];
  for (const [dx, dy, tag] of [[0, -40, 'up'], [40, 0, 'right'], [0, 40, 'down'], [-40, 0, 'left']]) {
    const s0 = await pos();
    await page.evaluate(([dx, dy]) => { const A = window.__pp.arc, G = A.game, x = 72, y = A.H - 100; G.down(x, y, 9); G.move(x + dx * 0.5, y + dy * 0.5, 9); G.move(x + dx, y + dy, 9); }, [dx, dy]);
    await page.waitForTimeout(700);
    const held = await page.evaluate(() => window.__pp.arc.game._dbg.stick.id === 9);
    await page.evaluate(() => { const A = window.__pp.arc; A.game.up(72, A.H - 100, 9); });
    const s1 = await pos();
    out.stick.push({ tag, dx: +(s1.x - s0.x).toFixed(2), dy: +(s1.y - s0.y).toFixed(2), held, fired: s1.taps - s0.taps });
  }
  out.released = await page.evaluate(() => window.__pp.arc.game._dbg.stick.id === null);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/stick-rest.png') });
  await page.evaluate(() => { const A = window.__pp.arc, G = A.game; G.down(95, A.H - 120, 10); G.move(120, A.H - 152, 10); });
  await page.waitForTimeout(300); await page.screenshot({ path: path.resolve(__dirname, '../shots/stick-on.png') });
  await page.evaluate(() => { const A = window.__pp.arc; A.game.up(120, A.H - 152, 10); });
  const ok = out.tapFloor.moved < 0.3 && out.tapFloor.fired === 1 && out.hold.fired <= 1 && out.tapMonster.moved < 0.6 && out.tapMonster.fired === 1 && out.stick.every(s => s.held && s.fired === 0 && Math.hypot(s.dx, s.dy) > 0.5) && out.released;
  console.log(JSON.stringify(out));
  console.log('controls', ok ? 'OK' : 'FAIL');
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
