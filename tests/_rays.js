// The rays on a Tower floor, frozen in one frame: a monster's laser firing and locking, a laser fence on, a sweeping beam,
// laser shots and lightning. usage: node tests/_rays.js   env: HTML, OUT
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const out = process.env.OUT || 'rays';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { let a = 5; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 60; P.st.dlv = 60; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(81, 1081); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; window.__pp.beginPlay(); });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 });
  await page.waitForTimeout(500);
  await page.evaluate(() => { const A = window.__pp.arc, G = A.game, D = G._dbg, me = D.me; G.update = () => {};
    for (const m of D.mons) if (!m.dead && Math.hypot(m.x - me.x, m.y - me.y) < 12) { m.x += 40; }
    // a monster lasering across the view, another locking on
    const live = D.mons.filter(m => !m.dead);
    const m1 = live[0], m2 = live[1];
    if (m1) { m1.x = me.x - 3.5; m1.y = me.y - 3.2; m1.la = 0.75; m1.laser = { st: 'fire', len: 9 }; }
    if (m2) { m2.x = me.x + 3.5; m2.y = me.y - 4.5; m2.la = 2.2; m2.laser = { st: 'lock', len: 6 }; }
    // a fence, on
    D.traps.push({ kind: 'fence', x: me.x - 2.5, y: me.y - 1, x1: me.x - 2.5, y1: me.y + 2.4, t: 3.0, on: 1, st: 'idle' });
    // a sweep beam
    D.zones.push({ kind: 'sweep', x: me.x + 1, y: me.y + 4, a: -0.3, len: 6, w: 0.5, life: 1, max: 1.5, warm: 0.2, own: 'enemy' });
    // laser shots and lightning
    for (let i = 0; i < 3; i++) D.shots.push({ x: me.x + 1.5 + i * 0.8, y: me.y - 1 - i * 0.4, vx: 12, vy: -3, t: i * 0.2, life: 1, dmg: 0, r: 0.12, style: 'laser', el: 'prism' });
    if (D.X && D.X.zap) D.X.zap(me.x - 2, me.y - 1, me.x + 3, me.y + 1.5, '#FF3B4E', 4);
    const c = document.getElementById('arcCanvas').getContext('2d'); c.save(); G.draw(c); c.restore(); });
  const top = await page.evaluate(() => document.getElementById('arcCanvas').getBoundingClientRect().top);
  await page.screenshot({ path: path.resolve(__dirname, `../shots/${out}.png`), clip: { x: 0, y: top, width: 390, height: 600 } });
  console.log('errors', errors);
  await browser.close();
})();
