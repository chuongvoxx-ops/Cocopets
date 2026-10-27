// Bahamut in motion in the real fight: frames a moment apart in stage I and stage IV, cropped round the gyroscope.
// usage: node tests/_inf-live.js [dt=0.3] [frames=8]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const DT = +(process.argv[2] || 0.3), NF = +(process.argv[3] || 8);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(120, 7));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
  await page.evaluate(() => { window.__pp.arc.paused = true; const G = window.__pp.arc.game; for (let i = 0; i < 60 * 6; i++) G.update(1 / 60); });
  const CLEAR = `if (M.job && M.job.stop) M.job.stop(FX, M.job); M.job = null; FD.S.hz.forEach(z => { if (z.bw) z.life = 0; }); M.gap = 99; M.sealCd = 99; M.sancCd = 99; M.recCd = 99; M.expose = 0; me.x = C.x; me.y = C.y + 8.5;`;
  const run = (code, secs) => page.evaluate(([code, secs]) => { const G = window.__pp.arc.game, D = G._dbg, FD = D.FD, FX = FD.FX, M = FX.mem, C = FX.C, me = D.me, m = D.g.boss; new Function('G', 'D', 'FD', 'FX', 'M', 'C', 'me', 'm', code)(G, D, FD, FX, M, C, me, m); for (let k = 0; k < Math.round(secs * 60); k++) { G.update(1 / 60); me.hp = D.ST.hp; me.x = C.x; me.y = C.y + 8.5; } return { lv: FD.S.lv, bt: +M.bt.toFixed(2), froll: +(M.froll || 0).toFixed(2), fyaw: +(M.fyaw || 0).toFixed(2), tum: M.rings.map(r => +r.tumble.toFixed(2)) }; }, [code, secs]);
  const shots = [];
  for (const [tag, setup, settle] of [['I', CLEAR, 1.0], ['IV', CLEAR + 'm.hp = m.maxhp * 0.24;', 7]]) {
    await run(setup, settle); await run(CLEAR, 0.5);
    for (let f = 0; f < NF; f++) {
      const r = await run(CLEAR, f ? DT : 0);
      await page.waitForTimeout(120);
      const box = await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg, FX = D.FD.FX; return { x: FX.sx(D.g.boss.x), y: FX.sy(D.g.boss.y) }; });
      const file = path.resolve(__dirname, `../shots/live-${tag}-${f}.png`);
      await page.screenshot({ path: file, clip: { x: 0, y: Math.max(0, Math.min(844 - 420, box.y - 300)), width: 390, height: 420 } });
      shots.push(file); console.log(tag, f, JSON.stringify(r));
    }
  }
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
