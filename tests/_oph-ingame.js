// Bahamut summoned in the Tower, photographed as it turns round (the game loop held and stepped by hand).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 60; P.st.animas.have.ophiuchus = 3; P.st.animas.eq = 'ophiuchus'; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(13, 5); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); const D = window.__pp.arc.game._dbg; D.g.intro = 0.2; D.SKIP.fog = true; });
  await page.waitForTimeout(800);
  await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg; window.__hold = G.update; G.update = () => {}; D.mons.forEach(m => { if (!m.boss) { m.still = true; m.aggro = false; } }); D.AN.S.gauge = 1; D.AN.summon(); for (let i = 0; i < 60 * 4; i++) { window.__hold(1 / 60); D.me.hp = D.ST.hp; } const a = D.AN.S.list[0]; a.life = 99; window.__a = a; });
  const shots = [];
  for (const [k, fk] of [[0, 1], [1, 0.55], [2, 0.12], [3, -0.4], [4, -1]]) {
    // the turn is held at each moment of it: the Anima's own facing is set after every step
    await page.evaluate(([k, fk]) => { const G = window.__pp.arc.game, D = G._dbg, a = window.__a; for (let i = 0; i < 3; i++) { window.__hold(1 / 60); D.me.hp = D.ST.hp; a.fk = fk; a.face = fk >= 0 ? 1 : -1; } }, [k, fk]);
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => { const a = window.__a, D = window.__pp.arc.game._dbg; const w0 = D.toWorld(0, 0), w1 = D.toWorld(1, 1), kx = 1 / (w1[0] - w0[0]), ky = 1 / (w1[1] - w0[1]); return { fk: +a.fk.toFixed(2), face: a.face, x: a.x, y: a.y, sx: (a.x - w0[0]) * kx, sy: (a.y - w0[1]) * ky }; });
    const clip = { x: Math.max(0, r.sx - 120), y: Math.max(0, r.sy - 190), width: 240, height: 240 };
    await page.screenshot({ path: path.resolve(__dirname, `../shots/_ophg-${k}.png`), clip }); shots.push(r.fk);
  }
  console.log('fk', shots.join(' '), 'errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
