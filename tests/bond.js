// Bond from play: a mini-game played to the end (won or lost) is a whole bond level for the pet that played it, keeping
// its progress into the level; a cleared Tower floor is a third of a level for every pet in the party; a failed climb
// still gives a little. usage: node tests/bond.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const fails = []; const check = (ok, what) => { if (!ok) fails.push(what); };
  // a pet partway into bond level 6, and two more in its party at other levels
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 60; P.st.dun.god = true;
    let need = 140, x = 0; for (let L = 1; L < 6; L++) { x += need; need = 100 + 40 * (L + 1); } P.st.xp = x + 70;
    for (let i = 0; i < 2; i++) { const f = P.newPetFields('Mate' + i, P.makeGenome(P.mulberry32(i * 31 + 7))); f.xp = [300, 2600][i]; f.dlv = 30; P.st.others.push(f); }
    P.st.party = null; P.partyPets(); });
  const bond = () => page.evaluate(() => { const P = window.__pp, info = xp => { let L = 1, need = 140, x = xp; while (x >= need && L < 99) { x -= need; L++; need = 100 + 40 * L; } return { L, into: x, need }; }; return P.partyPets().map(p => Object.assign({ name: p.name, xp: p.xp }, info(p.xp))); });
  const stage = async (win) => {
    await page.evaluate(() => { const P = window.__pp; P.openMap(); P.startStage(1, 1); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(400);
    await page.evaluate(w => { const P = window.__pp; P.arcFinish(w, 3, 1500, w ? '' : 'Out of time'); }, win);
    await page.waitForTimeout(1200);
    const lines = await page.evaluate(() => [...document.querySelectorAll('#arcade .rewards li')].map(li => li.textContent));
    await page.evaluate(() => window.__pp.closeArcade(true)); await page.waitForTimeout(200);
    return lines;
  };
  const b0 = await bond();
  const winLines = await stage(true); const b1 = await bond();
  const near = (a, b) => Math.abs(a - b) < 1;   // bond also creeps up by tiny fractions while time passes
  check(b1[0].L === b0[0].L + 1 && near(b1[0].into, b0[0].into) && near(b1[0].xp - b0[0].xp, b0[0].need), 'a mini-game won is one whole bond level, progress kept');
  check(near(b1[1].xp, b0[1].xp) && near(b1[2].xp, b0[2].xp), 'a mini-game is the playing pet\'s alone');
  check(winLines.some(l => /\+1 bond level/.test(l)), 'the results say +1 bond level');
  const loseLines = await stage(false); const b2 = await bond();
  check(b2[0].L === b1[0].L + 1 && near(b2[0].xp - b1[0].xp, b1[0].need), 'a mini-game lost is still a whole bond level');
  check(loseLines.some(l => /\+1 bond level/.test(l)), 'the results say so when it is lost too');
  // a cleared Tower floor: a third of a level for each pet in the party
  const dun = async (win) => {
    await page.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 5); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(600);
    await page.evaluate(w => { const P = window.__pp; P.arcFinish(w, 0, 0, w ? '' : 'Knocked out', {}); }, win);
    await page.waitForTimeout(1400);
    const lines = await page.evaluate(() => [...document.querySelectorAll('#arcade .rewards li')].map(li => li.textContent));
    await page.evaluate(() => window.__pp.closeArcade(true)); await page.waitForTimeout(200);
    return lines;
  };
  const dLines = await dun(true); const b3 = await bond();
  const third = b2.map((b, i) => b3[i].xp - b.xp - Math.round(b.need / 3));
  check(third.every(d => Math.abs(d) < 1), 'a cleared floor gives each pet in the party a third of its level');
  check(dLines.some(l => /1\/3 bond level for each of the 3 pets/.test(l)), 'the results say a third of a level for each pet');
  const fLines = await dun(false); const b4 = await bond();
  check(near(b4[0].xp - b3[0].xp, 3) && near(b4[1].xp, b3[1].xp), 'a failed climb gives the lead a little and the party nothing');
  console.log(JSON.stringify({ b0, b1, b2, b3, b4, winLines, loseLines, dLines, fLines, third }));
  console.log(fails.length ? 'bond FAIL: ' + fails.join('; ') : 'bond OK');
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
