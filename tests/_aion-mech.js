const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 60; P.st.dlv = 80; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(40, 7));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(4500);
  // stage three, wait for Doomsday
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, m = D.g.boss; m.hp = m.maxhp * 0.3; });
  await page.waitForFunction(() => { const M = window.__pp.arc.game._dbg.FD.FX.mem; return M.doom; }, null, { timeout: 40000 });
  const r1 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, FD = D.FD, M = FD.FX.mem, m = D.g.boss, kn = FD.S.objs.find(o => o.kind === 'knot' && o.big && !o.dead), hp0 = m.hp; let n = 0; while (kn && !kn.dead && n < 400) { D.hitMon(kn, FD.S.barHP * 0.02, {}); n++; } return { shine: M.shine, hits: n, broke: !!(kn && kn.dead), hpDrop: Math.round(hp0 - m.hp), barHP: Math.round(FD.S.barHP) }; });
  await page.waitForTimeout(400);
  const r2 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, m = D.g.boss; return { doom: !!M.doom, stunT: +(m.stunT || 0).toFixed(1), exposeT: +M.exposeT.toFixed(1), wards: M.wards }; });
  // Entropy: laid on the pet, then cleansed by walking into a Lightward
  const r3 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem; M.entropy = 4; return { entropy: M.entropy }; });
  await page.waitForTimeout(300);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, C = FX.C, a = -Math.PI / 2 + Math.PI / 3; D.me.x = C.x + Math.cos(a) * 10.4; D.me.y = C.y + Math.sin(a) * 10.4; });
  await page.waitForTimeout(300);
  const r4 = await page.evaluate(() => ({ entropyAfter: window.__pp.arc.game._dbg.FD.FX.mem.entropy }));
  console.log(JSON.stringify({ r1, r2, r3, r4 })); console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})();
