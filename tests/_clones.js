// Copies of the pet (Mirror Twins / Shadow Army / Mirror Image) on a Tower floor: frames as the pet walks, and what the
// floor's drawing costs with none, 2 and 4 copies out. usage: node tests/_clones.js [seed] [six]   env: HTML, OUT, SHOTS=1
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const seed = +(process.argv[2] || 23), six = process.argv[3] !== '0', out = process.env.OUT || 'clone';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { let a = 5; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(([seed, six]) => {
    const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 60; P.st.dlv = 60;
    const g = six ? P.summonGenome(6, P.mulberry32(seed)) : P.summonGenome(4, P.mulberry32(seed)), sg = six ? 7 : 6, line = P.evolveLine(g.form, sg, P.mulberry32(seed * 7)), p = P.newPetFields('Lumi', g); p.forms = line; p.stage = sg; for (let n = 2; n <= sg; n++) p.paid[n] = true; if (six) p.rarity = 5; p.dlv = 40;
    P.st.others = [p]; P.switchPet(0); P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(8, 1008);
  }, [seed, six]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const setClones = n => page.evaluate(n => { const D = window.__pp.arc.game._dbg, me = D.me; D.helpers.length = 0; const ss = n === 2 ? [-1, 1] : [-2, -1, 1, 2]; for (let i = 0; i < n; i++) D.helpers.push({ kind: 'clone', x: me.x + ss[i] * 1.3, y: me.y + 0.2, s: ss[i], t: 999, fireT: 999, color: '#BFE6FF' }); }, n);
  const step = (steps, walk) => page.evaluate(([steps, walk]) => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, me = D.me, run = window.__run, H = A.H;
    for (let i = 0; i < steps; i++) { if (walk) { const hx = 72, hy = H - 100; if (D.stick.id !== 88) G.down(hx, hy, 88); G.move(hx + 44, hy, 88); } else if (D.stick.id === 88) G.up(72, H - 100, 88); run(1 / 60); me.hp = D.ST.hp; me.mp = 999; for (const h of D.helpers) { h.t = 999; h.fireT = 999; } for (const m of D.mons) if (!m.dead && Math.hypot(m.x - me.x, m.y - me.y) < 8) m.x += 10; } }, [steps, walk]);
  if (process.env.SHOTS) {
    await setClones(2); await step(40, false);
    const shot = async name => { await page.evaluate(() => { const c = document.getElementById('arcCanvas').getContext('2d'); c.save(); window.__pp.arc.game.draw(c); c.restore(); });
      const box = await page.evaluate(() => { const A = window.__pp.arc; return { x: 0, y: A.H / 2 - 80 + document.getElementById('arcCanvas').getBoundingClientRect().top, width: 390, height: 230 }; });
      await page.screenshot({ path: path.resolve(__dirname, `../shots/${out}-${name}.png`), clip: box }); };
    for (let i = 0; i < 4; i++) { await step(6, true); await shot('walk' + i); }
    await step(20, false); await page.evaluate(() => window.__pp.arc.game._dbg.useUlt()); await step(14, false); await shot('ult');
  }
  // cost of a frame's drawing (the game's own draw, run back to back), with 0, 2 and 4 copies out, walking
  for (const n of [0, 2, 4, 0, 2, 4]) {
    await setClones(n); await step(30, true);
    const ms = await page.evaluate(() => { const A = window.__pp.arc, G = A.game, c = document.getElementById('arcCanvas').getContext('2d'), run = window.__run, D = G._dbg; const ts = [];
      for (let i = 0; i < 120; i++) { run(1 / 60); for (const h of D.helpers) { h.t = 999; h.fireT = 999; } D.me.hp = D.ST.hp; const t0 = performance.now(); c.save(); G.draw(c); c.restore(); c.getImageData(0, 0, 1, 1); ts.push(performance.now() - t0); }
      ts.sort((a, b) => a - b); return [ts[60], ts[108]].map(v => +v.toFixed(2)); });
    console.log('copies', n, 'draw median / p90 ms', ms.join(' / '));
  }
  console.log('errors', errors);
  await browser.close();
})();
