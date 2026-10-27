// The pet on a Tower floor, close up: whether its picture is drawn from a canvas copy (and at what size), and a crop of
// the screen round it, enlarged, to compare its sharpness. usage: node tests/_pet-shot.js [floor]   env: HTML, TAG, CAP
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl = +(process.argv[2] || 120), tag = process.env.TAG || 'now';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 5);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(([n, cap]) => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(n, 7); }, [fl, +(process.env.CAP || 0)]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const info = await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, c = document.getElementById('arcCanvas').getContext('2d');
    for (let i = 0; i < 200; i++) { window.__run(1 / 60); D.me.hp = D.ST.hp; } for (let i = 0; i < 30; i++) { window.__run(1 / 60); D.me.hp = D.ST.hp; c.save(); G.draw(c); c.restore(); }
    const S = P.arc.sprites.normal, r = document.getElementById('arcCanvas').getBoundingClientRect(), T = D.FD ? D.FD.FX.Tz() : 0;
    return { ras: S.ras ? [S.ras.cv.width, S.ras.cv.height, +S.ras.k.toFixed(2)] : null, x: r.left + (D.FD ? D.FD.FX.sx(D.me.x) : r.width / 2), y: r.top + (D.FD ? D.FD.FX.sy(D.me.y) : r.height / 2) }; });
  console.log(JSON.stringify(info));
  await page.waitForTimeout(80);
  await page.screenshot({ path: path.resolve(__dirname, `../shots/pet-${tag}.png`), clip: { x: Math.max(0, info.x - 40), y: Math.max(0, info.y - 60), width: 80, height: 80 } });
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
