// The pet in parts on a Tower floor: frames as it walks (feet stepping, arms swinging), as it uses a Strong attack and
// its Ultimate (arms lifted), and a six-star's wings beating. usage: node tests/_rig-shots.js [seed] [six]   env: HTML, OUT
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const seed = +(process.argv[2] || 23), six = process.argv[3] !== '0', out = process.env.OUT || 'rig';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(([seed, six]) => {
    const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 60; P.st.dlv = 60;
    const g = six ? P.summonGenome(6, P.mulberry32(seed)) : P.summonGenome(4, P.mulberry32(seed)), line = P.evolveLine(g.form, 6, P.mulberry32(seed * 7)), p = P.newPetFields('Lumi', g); p.forms = line; p.stage = 6; for (let n = 2; n <= 6; n++) p.paid[n] = true; if (six) p.rarity = 5; p.dlv = 40;
    P.st.others = [p]; P.switchPet(0); P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(8, 1008);
  }, [seed, six]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 });
  const rigOK = await page.evaluate(() => { const S = window.__pp.arc.sprites; return !!(S && S.rig && S.rig.front && S.rig.front.normal) + ' arm ' + !!(S.rig && S.rig.arm) + ' foot ' + !!(S.rig && S.rig.foot) + ' wings ' + (S.rig && S.rig.legW ? S.rig.legW.length : S.rig && S.rig.wing ? 'plain' : 'none'); });
  console.log('rig', rigOK);
  const frame = async (name, steps, fn) => {
    await page.evaluate(([steps, fn]) => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, me = D.me, c = document.getElementById('arcCanvas').getContext('2d'), run = window.__run, H = A.H;
      for (let i = 0; i < steps; i++) { if (fn === 'walk') { const hx = 72, hy = H - 100; if (D.stick.id !== 88) G.down(hx, hy, 88); G.move(hx + 44, hy, 88); } run(1 / 60); me.hp = D.ST.hp; me.mp = 999; for (const m of D.mons) if (!m.dead && Math.hypot(m.x - me.x, m.y - me.y) < 6) m.x += 8; }
      c.save(); G.draw(c); c.restore(); }, [steps, fn]);
    const box = await page.evaluate(() => { const A = window.__pp.arc; return { x: 195 - 90, y: A.H / 2 + 60 - 120 + document.getElementById('arcCanvas').getBoundingClientRect().top, width: 180, height: 180 }; });
    await page.screenshot({ path: path.resolve(__dirname, `../shots/${out}-${name}.png`), clip: box });
  };
  await frame('still', 60, '');
  for (let i = 0; i < 4; i++) await frame('walk' + i, 7, 'walk');
  await page.evaluate(() => { const G = window.__pp.arc.game; G.up(72, window.__pp.arc.H - 100, 88); });
  await frame('settle', 30, '');
  await page.evaluate(() => window.__pp.arc.game._dbg.useStrong('strong'));
  await frame('strong', 12, '');
  await frame('pause', 60, '');
  await page.evaluate(() => window.__pp.arc.game._dbg.useUlt());
  await frame('ult', 30, '');
  console.log('errors', errors);
  await browser.close();
})();
