// Photographs the new summon: sign flash, magic circle, heaven beam, descent, landing; then roaming while the pet walks.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const id = process.argv[2] || 'leo', RES = process.argv[3] === 'res';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(({ RES }) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 99; if (RES) P.st.stage = 7; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 2); P.st.animas.eq = 'aries'; P.openMap(); P.dun.setMapTab('dungeon', true); }, { RES });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); const D = window.__pp.arc.game._dbg; D.g.intro = 0.2; D.SKIP.fog = true; });
  await page.waitForTimeout(600);
  await page.evaluate(({ id, RES }) => {
    const P = window.__pp, D = P.arc.game._dbg, me = D.me, AN = D.AN;
    AN.kit.main.id = id; AN.kit.main.k = 2;
    if (RES) { const o = P.ANIMAS[id].opp; AN.kit.res = { id: o, k: 2 }; AN.kit.resonance = P.pairResonance(id, o); } else { AN.kit.res = null; AN.kit.resonance = null; }
    D.mons.filter(m => !m.dead && !m.boss).forEach(m => { m.x = me.x + 40; m.y = me.y + 40; m.still = true; });
    Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] });
    AN.summon();
  }, { id, RES });
  const out = [];
  const snap = async (tag, ms) => { await page.waitForTimeout(ms); const f = `../shots/sfx-${id}-${tag}.png`; await page.screenshot({ path: path.resolve(__dirname, f) }); out.push(f); };
  await snap('a-sign', 150);
  await snap('b-circle', 450);
  await snap('c-beam', 330);
  await snap('d-descent', 260);
  await snap('e-land', 330);
  await snap('f-fight', 900);
  if (RES) { await snap('g-res', 900); }
  // walk the pet right for a while and sample where the Anima is
  const track = [];
  await page.evaluate(() => { const A = window.__pp.arc, G = A.game; G.down(72, A.H - 100, 88); G.move(72 + 44, A.H - 100, 88); });
  for (let i = 0; i < 12; i++) { await page.waitForTimeout(150); track.push(await page.evaluate(() => { const D = window.__pp.arc.game._dbg, me = D.me, a = D.AN.S.list[0]; return a ? [+(a.x - me.x).toFixed(2), +(a.y - me.y).toFixed(2), a.st, +a.lag.toFixed(1)] : null; })); }
  await snap('h-walk', 10);
  await page.evaluate(() => { const A = window.__pp.arc, G = A.game; G.up(72 + 44, A.H - 100, 88); });
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(250); track.push(await page.evaluate(() => { const D = window.__pp.arc.game._dbg, me = D.me, a = D.AN.S.list[0]; return a ? [+(a.x - me.x).toFixed(2), +(a.y - me.y).toFixed(2), a.st, +a.lag.toFixed(1)] : null; })); }
  await snap('i-idle', 10);
  console.log(JSON.stringify(track));
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
