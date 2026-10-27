// How the camera's zoom and the arena's picture scale move through a Super Fiend fight (the game stepped at 60 per second
// and drawn every frame). usage: node tests/_zoom-track.js floor
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl = +(process.argv[2] || 10);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const r = await page.evaluate(() => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, g = D.g, c = document.getElementById('arcCanvas').getContext('2d'), out = [];
    for (let i = 0; i < 1500; i++) { window.__run(1 / 60); D.me.hp = D.ST.hp; c.save(); G.draw(c); c.restore(); const FD = D.FD; if (i % 30 === 0) out.push(`${(i / 60).toFixed(1)}s z ${g.zoom.toFixed(4)} T ${FD ? FD.FX.Tz().toFixed(2) : '-'} P ${FD && FD.S.arenaP ? FD.S.arenaP.toFixed(2) : '-'} boss ${g.boss ? g.boss.act : '-'} hold ${FD && FD.S.holdP ? FD.S.holdP.toFixed(2) : '-'}`); }
    return out;
  });
  console.log(r.join('\n'));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
