// A burst of shots through the summon, each labelled with the cinematic time.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const id = process.argv[2] || 'leo', K = +(process.argv[3] || 2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.eq = 'aries'; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); const D = window.__pp.arc.game._dbg; D.g.intro = 0.2; D.SKIP.fog = true; });
  await page.waitForTimeout(600);
  await page.evaluate(({ id, K }) => { const P = window.__pp, D = P.arc.game._dbg, me = D.me, AN = D.AN; AN.kit.main.id = id; AN.kit.main.k = K; AN.kit.res = null; AN.kit.resonance = null; D.mons.filter(m => !m.dead && !m.boss).forEach(m => { m.x = me.x + 40; m.y = me.y + 40; m.still = true; }); Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); AN.summon(); }, { id, K });
  const frames = [];
  for (let i = 0; i < 14; i++) {
    const t = await page.evaluate(() => { const AN = window.__pp.arc.game._dbg.AN; return AN.S.cine ? AN.S.cine.t.toFixed(2) : 'end'; });
    const f = path.resolve(__dirname, `../shots/burst-${id}-${i}.jpg`); await page.screenshot({ path: f, type: 'jpeg', quality: 70, clip: { x: 60, y: 120, width: 270, height: 420 } }); frames.push([f, t]);
  }
  console.log(JSON.stringify(frames.map(f => f[1])));
  require('fs').writeFileSync(path.resolve(__dirname, `../shots/burst-${id}.json`), JSON.stringify(frames));
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
