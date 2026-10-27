// The pet and its copies alone: drawn the old way (pet in parts + each copy a still picture) and the new way (the pet in
// parts once into a picture, the pet and each copy laid down from it). usage: node tests/_clone-cost.js [seed] [six]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const seed = +(process.argv[2] || 23), six = process.argv[3] !== '0';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(([seed, six]) => {
    const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 60; P.st.dlv = 60;
    const g = six ? P.summonGenome(6, P.mulberry32(seed)) : P.summonGenome(4, P.mulberry32(seed)), sg = six ? 7 : 6, line = P.evolveLine(g.form, sg, P.mulberry32(seed * 7)), p = P.newPetFields('Lumi', g); p.forms = line; p.stage = sg; for (let n = 2; n <= sg; n++) p.paid[n] = true; if (six) p.rarity = 5; p.dlv = 40;
    P.st.others = [p]; P.switchPet(0); P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(8, 1008);
  }, [seed, six]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const A = window.__pp.arc, api = A.api || A.game && A.game._api, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'), h = 60, out = {};
    const pose = t => ({ walk: t * 9, moving: true, t, cast: 0, ult: false, wingPh: t * 8, wingAmp: 14 });
    const run = (label, n, fresh) => { const ts = []; for (let rep = 0; rep < 3; rep++) for (let i = 0; i < 200; i++) { const t = i / 60, P0 = pose(t); const t0 = performance.now(); c.save();
      if (fresh) { const S = api.petSnap(c, h, { face: 'normal', pose: P0 }); api.pet(c, 195, 400, h, { snap: S }); for (let k = 0; k < n; k++) { c.globalAlpha = 0.6; api.pet(c, 80 + k * 70, 400, h * 0.88, { snap: S, flip: true }); } }
      else { api.pet(c, 195, 400, h, { rig: true, pose: P0, face: 'normal' }); for (let k = 0; k < n; k++) { c.globalAlpha = 0.6; api.pet(c, 80 + k * 70, 400, h * 0.88, { face: 'happy', flip: true }); } }
      c.restore(); c.getImageData(0, 0, 1, 1); ts.push(performance.now() - t0); }
      ts.sort((a, b) => a - b); out[label] = +ts[ts.length >> 1].toFixed(2); };
    for (const n of [0, 2, 4]) { run('old ' + n + ' copies (still)', n, false); run('new ' + n + ' copies (moving)', n, true); }
    return out;
  });
  console.log(six ? 'six-star' : 'ordinary', JSON.stringify(r, null, 1));
  await browser.close();
})();
