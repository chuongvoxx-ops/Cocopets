const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(([n, seed]) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(n, seed); }, [+process.argv[2] || 45, +process.argv[3] || 4545]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 });
  await page.waitForTimeout(500);
  const r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; const bad = D.mons.filter(m => !isFinite(m.x) || !isFinite(m.y)).map(m => [m.type, m.x, m.y, m.pack]); for (let k = 0; k < 4; k++) { for (const m of D.mons) if (!m.dead && !m.boss) D.hitMon(m, 1e12, {}); await new Promise(r => setTimeout(r, 300)); } const t0 = performance.now(); while (performance.now() - t0 < 5000) await new Promise(r => requestAnimationFrame(r)); const alive = D.mons.filter(m => !m.dead).map(m => [m.type, m.boss ? 'BOSS' : '', m.hp.toFixed(0), isFinite(m.x)]); return { bad, alive: alive.slice(0, 12), n: alive.length, cleared: D.g.cleared, bossN: D.g.bossN }; });
  console.log(JSON.stringify(r)); console.log('errors', errors.length, errors.slice(0, 2));
  await browser.close();
})();
