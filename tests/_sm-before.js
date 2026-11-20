// (v435 SM) "before" photos of the Aries Anima in a fight, for the before/after sheets: works on any build (the live one has no SAMAEL_MOVES).
// usage: HTML=<a build> node tests/_sm-before.js [form] [dpr] [tag]   -> shots/v435-SM/<tag>-*.png
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const K = +(process.argv[2] || 3), DPR = +(process.argv[3] || 1), tag = process.argv[4] || `before-k${K}-d${DPR}`;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { window.__NG_GL = 0; window.__SM_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-sm.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(({ K }) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = false; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = K); P.st.animas.eq = 'aries'; P.st.animas.res = null; P.openMap(); }, { K });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 }); await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  const ok = await page.evaluate(({ K }) => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; cancelAnimationFrame(P.arc.raf); P.arc.open = false;
    for (let k = 0; k < 60; k++) G.update(1 / 60); AN.kit.main.id = 'aries'; AN.kit.main.k = K; AN.kit.res = null; AN.kit.resonance = null; D.SKIP.fog = true; D.g.intro = 0;
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 6000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; let ok = true; for (let dx = -7; dx <= 8 && ok; dx++) for (let dy = -5; dy <= 5 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x - 2.5; me.y = best.y + 1.5; }
    const place = [[3.2, -0.6], [4.4, 0.4], [3.6, 1.4], [5.4, -1.0], [2.0, -1.8], [4.6, 2.2], [6.2, 0.8], [1.4, 2.0]];
    D.mons.filter(m => !m.boss).forEach((m, i) => { if (i < place.length) Object.assign(m, { dead: false, x: me.x + place[i][0], y: me.y + place[i][1], hp: 1e7, maxhp: 1e7, spd: 0, atkCd: 99, dmg: 0, aggro: true }); else Object.assign(m, { dead: true, x: me.x + 200, y: me.y + 200 }); });
    Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); window.__B = { G, D, P, step(s) { for (let k = 0; k < Math.round(s * 60); k++) { D.eshots.length = 0; for (const m of D.mons) m.atkCd = 99; G.update(1 / 60); } } }; return AN.summon(); }, { K });
  const shot = async (n, s) => { await page.evaluate(s => window.__B.step(s), s); await page.evaluate(() => { const { G, P } = window.__B; window.__NG_GL = 1; window.__SM_GL = 1; G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); window.__NG_GL = 0; window.__SM_GL = 0; }); await page.screenshot({ path: path.resolve(__dirname, '..', `shots/v435-SM/${tag}-${n}.png`), timeout: 300000 }); };
  console.log('summon', ok);
  await shot('1-summon', 2.2); await shot('2-fight', 2.5); await shot('3-fight', 2.5);
  await page.evaluate(() => { const { D } = window.__B; D.AN.S.list.forEach(a => { if (a.st === 'fight') a.life = 0.01; }); }); await shot('4-finale', 2.0); await shot('5-finale', 1.0);
  console.log('errors', errors.length, errors.slice(0, 3)); await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
