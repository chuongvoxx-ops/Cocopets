// The pet in parts drawn large on a canvas of its own, posed: standing, four steps of a walk, a Strong attack, an
// Ultimate, and its wings at both ends of a beat. usage: node tests/_rig-poses.js [seed] [six] [stage]   env: HTML, OUT
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const seed = +(process.argv[2] || 23), six = process.argv[3] !== '0', sg = +(process.argv[4] || 6), out = process.env.OUT || 'poses';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 300 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(([seed, six, sg]) => {
    const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 60; P.st.dlv = 60;
    const g = six ? P.summonGenome(6, P.mulberry32(seed)) : P.summonGenome(4, P.mulberry32(seed)), line = P.evolveLine(g.form, sg, P.mulberry32(seed * 7)), p = P.newPetFields('Lumi', g); p.forms = line; p.stage = sg; for (let n = 2; n <= sg; n++) p.paid[n] = true; if (six) p.rarity = 5; p.dlv = 40;
    P.st.others = [p]; P.switchPet(0); P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(8, 1008);
  }, [seed, six, sg]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
  const r = await page.evaluate(() => {
    const P = window.__pp, A = P.arc, cv = document.createElement('canvas'); cv.width = 1400; cv.height = 300; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#3C6B45'; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.fillStyle = '#3C6B45'; c.fillRect(0, 0, 1400, 300);
    const poses = [['still', {}], ['walk a', { walk: 0.5, moving: true }], ['walk b', { walk: 2.0, moving: true }], ['walk c', { walk: 3.6, moving: true }], ['walk d', { walk: 5.2, moving: true }],
      ['strong', { cast: 0.4 }], ['ult', { cast: 0.45, ult: true }], ['wings up', { wingPh: 1.6, wingAmp: 14 }], ['wings down', { wingPh: 4.7, wingAmp: 14 }]];
    poses.forEach(([nm, pose], i) => { const x = 80 + i * 150; c.save(); P.arc.api.pet(c, x, 240, 110, { rig: true, pose: Object.assign({ t: 0 }, pose) }); c.restore(); c.fillStyle = '#FFF'; c.font = '14px sans-serif'; c.textAlign = 'center'; c.fillText(nm, x, 290); });
    return !!(A.sprites && A.sprites.rig);
  });
  console.log('rig', r);
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.resolve(__dirname, `../shots/${out}.png`) });
  console.log('errors', errors);
  await browser.close();
})();
