// The move stick under real touch input: it must never go dead while a thumb is down.
// usage: node tests/joystick.js     (HTML=name.html for a test build of your own)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Stick'); P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(2800);
  const cdp = await page.context().newCDPSession(page);
  const off = await page.evaluate(() => { const r = document.querySelector('.arcade canvas').getBoundingClientRect(); return [r.left, r.top]; });
  const pts = list => list.map(([id, x, y]) => ({ x: x + off[0], y: y + off[1], id }));
  const touch = (type, list) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts(list) });
  const frames = n => page.evaluate(n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const S = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { id: D.stick.id, x: D.me.x, y: D.me.y, ptr: window.__pp.arc.ptr.size }; });
  const H = await page.evaluate(() => window.__pp.arc.H), hx = 72, hy = H - 52 - 70;   // the stick's home
  const reset = async () => { try { await touch('touchEnd', []); } catch (e) {} await frames(4); await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.hp = D.ST.hp; D.me.dead = false; D.mons.forEach(m => { m.hp = 0; m.dead = true; }); D.g.cleared = true; D.g.slowT = 0;   /* (clearing the floor this way must not count as the player clearing it: that starts the boss's drop-in beside the pet 1.6 to 2.4 s later, with its slow motion, and the next reset then kills the boss, which wins the floor and stops all movement) */ if (!window.__home) window.__home = [D.me.x, D.me.y]; D.me.x = window.__home[0]; D.me.y = window.__home[1]; }); await frames(2); };
  await reset();

  // 1. a thumb drags: the pet moves
  { await touch('touchStart', [[1, hx, hy]]); await frames(2); await touch('touchMove', [[1, hx + 40, hy]]); const a = await S(); await frames(20); const b = await S();
    ok(b.id != null && b.x > a.x + 0.3, 'a thumb drag moves the pet', { a, b }); }
  // 2. a second finger taps on the left while the thumb holds: the stick stays with the thumb and still steers after the tap lifts
  { await touch('touchStart', [[1, hx + 40, hy], [2, 120, H * 0.45]]); await frames(3); await touch('touchMove', [[1, hx + 40, hy]]); await frames(3);
    const a = await S(); await touch('touchMove', [[1, hx, hy + 40]]); await frames(20); const b = await S();
    ok(b.id != null && b.y > a.y + 0.3, 'a second touch on the left never steals the stick from a held thumb', { a, b }); }
  await reset();
  // 3. a monster under the thumb at the stick pad: the stick is still taken
  { const t = await page.evaluate(([hx, hy]) => { const D = window.__pp.arc.game._dbg, [wx, wy] = D.toWorld(hx, hy); const m = D.mons.find(m => m.type) || D.mons[0]; if (!m) return null; m.dead = false; m.hp = 1e9; m.x = wx; m.y = wy; m.z = 0; m.under = false; m.falling = false; m.sleep = 99; return [wx, wy]; }, [hx, hy]);
    await touch('touchStart', [[3, hx, hy]]); await frames(2); await touch('touchMove', [[3, hx, hy - 40]]); const a = await S(); await frames(20); const b = await S();
    ok(t && b.id != null && b.y < a.y - 0.3, 'a monster under the thumb at the stick pad does not block the stick', { t, a, b }); }
  await reset();
  // 4. a resize mid-drag (a browser bar sliding) keeps the stick
  { await touch('touchStart', [[4, hx, hy]]); await frames(2); await touch('touchMove', [[4, hx + 40, hy]]); await frames(2);
    await page.evaluate(() => window.__pp.arc.game.resize()); await frames(2); const a = await S(); await touch('touchMove', [[4, hx + 80, hy]]); await frames(20); const b = await S();
    ok(b.id != null && b.x > a.x + 0.3, 'a resize mid-drag keeps the stick', { a, b }); }
  await reset();
  // 5. a thumb that went down while paused steers once play resumes
  { await page.evaluate(() => { window.__pp.arc.paused = true; }); await touch('touchStart', [[5, hx, hy]]); await frames(2);
    await page.evaluate(() => { window.__pp.arc.paused = false; }); await frames(2); await touch('touchMove', [[5, hx + 20, hy]]); await touch('touchMove', [[5, hx + 45, hy]]); const a = await S(); await frames(20); const b = await S();
    ok(b.id != null && b.x > a.x + 0.3, 'a thumb already down when a pause ends steers', { a, b }); }
  await reset();
  // 6. a thumb that went down during a cinematic steers when it ends
  { await page.evaluate(() => { const G = window.__pp.arc.game; G._down = G.down; G.down = () => {}; }); await touch('touchStart', [[6, hx, hy]]); await frames(2);
    await page.evaluate(() => { const G = window.__pp.arc.game; G.down = G._down; }); await touch('touchMove', [[6, hx, hy - 20]]); await touch('touchMove', [[6, hx, hy - 45]]); const a = await S(); await frames(20); const b = await S();
    ok(b.id != null && b.y < a.y - 0.3, 'a thumb whose touch-down the game did not take (a cinematic, say) steers as soon as it drags', { a, b }); }
  await reset();
  // 7. a quick tap on the left still attacks, once
  { const n0 = await page.evaluate(() => window.__pp.arc.game._dbg.g.tapFx || 0); await touch('touchStart', [[7, 150, H * 0.5]]); await frames(2); await touch('touchEnd', []); await frames(2);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { id: D.stick.id, tapFx: D.g.tapFx }; });
    ok(r.id == null && r.tapFx > 0, 'a quick tap on the left still attacks and leaves no stick held', r); }
  // 8. lifting every finger leaves nothing held
  { await touch('touchStart', [[8, hx, hy]]); await frames(2); await touch('touchEnd', []); await frames(3); const r = await S(); ok(r.id == null && r.ptr === 0, 'lifting every finger leaves nothing held', r); }
  ok(errors.length === 0, 'no page errors', errors.slice(0, 3));
  console.log(bad ? `FAILED ${bad}` : 'all passed');
  await browser.close(); process.exit(bad ? 1 : 0);
})();
