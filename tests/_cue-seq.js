// The astral cues frame by frame: summon an Anima (with a second one for Harmony), end its fight, and photograph the
// awakening every quarter second. usage: node tests/_cue-seq.js id [harmony|res]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const id = process.argv[2] || 'leo', MODE = process.argv[3] || '', K = 2;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(({ K }) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 99; P.st.stage = 7; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = K); P.st.animas.eq = 'aries'; P.openMap(); P.dun.setMapTab('dungeon', true); }, { K });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); const D = window.__pp.arc.game._dbg; D.g.intro = 0.2; D.SKIP.fog = true; });
  await page.waitForTimeout(600);
  const ok = await page.evaluate(({ id, K, MODE }) => {
    const P = window.__pp, D = P.arc.game._dbg, me = D.me, AN = D.AN;
    AN.kit.main.id = id; AN.kit.main.k = K;
    if (MODE) { const o = MODE === 'harmony' ? P.ANIMA_ORDER[(P.ANIMA_ORDER.indexOf(id) + 1) % 12] : P.ANIMAS[id].opp; AN.kit.res = { id: o, k: K }; AN.kit.resonance = P.pairResonance(id, o); } else AN.kit.res = null;
    D.mons.filter(m => !m.dead && !m.boss).slice(0, 7).forEach((m, i) => { const p = D.X.walkPoint(me.x + 2.5 + (i % 3) * 1.3, me.y - 2 + i * 0.8, { r: m.r, mv: 0 }); m.x = p.x; m.y = p.y; m.still = true; m.aggro = true; m.hp = m.maxhp = 1e6; });
    Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] });
    return AN.summon() ? 'ok' : 'refused';
  }, { id, K, MODE });
  console.log('summon', ok);
  const shots = [];
  for (let i = 0; i < 6; i++) { await page.waitForTimeout(250); const f = `shots/cue-${id}${MODE ? '-' + MODE : ''}-land${i}.png`; await page.screenshot({ path: path.resolve(__dirname, '..', f) }); shots.push(f); }
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.AN.S.list.forEach(a => { if (a.st === 'fight') a.life = 0.01; }); });
  for (let i = 0; i < 10; i++) { await page.waitForTimeout(250); const cues = await page.evaluate(() => (window.__pp.arc.game._dbg.AN.S.cues || []).map(q => q.name + '@' + q.t.toFixed(2) + (q.sign ? '+sign' : ''))); const f = `shots/cue-${id}${MODE ? '-' + MODE : ''}-aw${i}.png`; await page.screenshot({ path: path.resolve(__dirname, '..', f) }); shots.push(f); console.log(i, JSON.stringify(cues)); }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
