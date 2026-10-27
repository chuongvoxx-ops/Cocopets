// one frame of Twin Tides with both rings well formed, to see the lie's broken ring
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => { window.__pp.dun.startDungeon(100, 7); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const out = await page.evaluate(() => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, run = window.__run; for (let i = 0; i < 1200 && !D.g.boss; i++) run(1 / 60);
    const FD = D.FD, FX = FD.FX, M = FX.mem, m = D.g.boss, me = D.me, C = FX.C, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d');
    const st = n => { for (let i = 0; i < n; i++) { run(1 / 60); me.hp = D.ST.hp; M.gap = 99; me.x = C.x + 1; me.y = C.y + 5; } };
    st(300); m.hp = m.maxhp * 0.66; st(420);
    M.job = null; M.lieFirst = false; M.sigCd = 99; M.cyc = 1; M.gap = 0; const shots = [];
    for (let i = 0; i < 150; i++) { run(1 / 60); me.hp = D.ST.hp; me.x = C.x + 1; me.y = C.y + 5; if (i === 30 || i === 90 || i === 120) { c.save(); G.draw(c); c.restore(); shots.push(cv.toDataURL('image/png')); } }
    return { shots, tides: M.tides.map(t => ({ real: t.real, r: +t.r.toFixed(1), x: +t.x.toFixed(1), y: +t.y.toFixed(1) })), job: M.job && M.job.name };
  });
  out.shots.forEach((u, i) => fs.writeFileSync(path.resolve(__dirname, `../shots/tt-${i}.png`), Buffer.from(u.split(',')[1], 'base64')));
  console.log(JSON.stringify({ tides: out.tides, job: out.job }), 'errors', errors.length);
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
