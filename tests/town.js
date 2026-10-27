// The world map, Pocket Town (walking, talking, buildings, the gate) and the Tower tab all open from the Adventure screen.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const out = {};
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Mayor'); P.st.energy = 100; P.st.dun.best = 17; P.st.crystals = 2500; for (let i = 0; i < 3; i++) { const g = P.makeGenome(P.mulberry32(i * 13 + 2)); P.st.others.push(P.newPetFields('Pal' + i, g)); } P.st.party = null; P.st.map.stars.w1s1 = 3; P.st.map.stars.w1s2 = 2; P.openMap(); });
  await page.waitForTimeout(500);
  out.tab0 = await page.evaluate(() => window.__pp.dun.tab);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/town-world.png') });
  // tap the town on the world map
  await page.evaluate(() => document.querySelector('[data-wm="town"]').click()); await page.waitForTimeout(1200);
  out.tab1 = await page.evaluate(() => window.__pp.dun.tab);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/town-1.png') });
  // walk to the elder and talk
  out.talk = await page.evaluate(async () => {
    const P = window.__pp, T = P.town(); const n = P.TOWN_NPCS.find(x => x.id === 'moss');
    P.townGoTo(n.x + 46, n.y + 8, { kind: 'npc', n });
    const t0 = performance.now(); while (T.goal && performance.now() - t0 < 6000) await new Promise(r => setTimeout(r, 50));
    await new Promise(r => setTimeout(r, 200));
    return { arrived: !T.goal, card: !document.querySelector('#mapCard').hidden, title: (document.querySelector('#mapCard h2') || {}).textContent, pet: [Math.round(T.pet.x), Math.round(T.pet.y)], followers: T.followers.length };
  });
  await page.screenshot({ path: path.resolve(__dirname, '../shots/town-talk.png') });
  // the summoner: her button opens the summon sheet
  out.summon = await page.evaluate(async () => {
    const P = window.__pp, T = P.town(); document.querySelector('#mapCard [data-mc="close"]').click(); const n = P.TOWN_NPCS.find(x => x.id === 'ova');
    P.townGoTo(n.x + 46, n.y + 8, { kind: 'npc', n });
    const t0 = performance.now(); while (T.goal && performance.now() - t0 < 8000) await new Promise(r => setTimeout(r, 50));
    await new Promise(r => setTimeout(r, 200));
    const b = document.querySelector('#mapCard [data-tc="summon"]'); if (b) b.click(); await new Promise(r => setTimeout(r, 300));
    return { btn: !!b, sheet: P.sheetKind };
  });
  await page.screenshot({ path: path.resolve(__dirname, '../shots/town-summon.png') });
  await page.evaluate(() => window.__pp.closeSheet());
  // a building: the hangar lists its stages, picking one shows the Play card
  out.building = await page.evaluate(async () => {
    const P = window.__pp, T = P.town(), b = P.TOWN_BUILDINGS[0];
    P.townGoTo(b.door[0], b.door[1] + 14, { kind: 'building', b });
    const t0 = performance.now(); while (T.goal && performance.now() - t0 < 9000) await new Promise(r => setTimeout(r, 50));
    await new Promise(r => setTimeout(r, 200));
    const stages = document.querySelectorAll('#mapCard .tstage').length, locked = document.querySelectorAll('#mapCard .tstage.locked').length;
    const s2 = document.querySelector('#mapCard .tstage[data-ts="2"]'); if (s2) s2.click(); await new Promise(r => setTimeout(r, 200));
    return { stages, locked, play: !!document.querySelector('#mapCard [data-mc="play"]'), h2: document.querySelector('#mapCard h2').textContent };
  });
  await page.screenshot({ path: path.resolve(__dirname, '../shots/town-building.png') });
  // play from here, win, come back to the town
  console.log(JSON.stringify(out));
  await page.evaluate(() => document.querySelector('#mapCard [data-mc="play"]').click());
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); }); await page.waitForTimeout(800);
  await page.evaluate(() => window.__pp.arcFinish(true, 999)); await page.waitForTimeout(900);
  await page.evaluate(() => window.__pp.closeArcade()); await page.waitForTimeout(600);
  out.back = await page.evaluate(() => ({ tab: window.__pp.dun.tab, mapOpen: window.__pp.mapOpen, townRunning: !!window.__pp.town() }));
  // the gate leads to the Tower tab
  out.gate = await page.evaluate(async () => {
    const P = window.__pp, T = P.town(); if (!T) return 'no town';
    P.townGoTo(P.TOWN_GATE.x - 50, P.TOWN_GATE.y + 10, { kind: 'gate' });
    const t0 = performance.now(); while (T.goal && performance.now() - t0 < 12000) await new Promise(r => setTimeout(r, 50));
    await new Promise(r => setTimeout(r, 200));
    const b = document.querySelector('#mapCard [data-tc="tower"]'); if (b) b.click(); await new Promise(r => setTimeout(r, 300));
    return { btn: !!b, tab: P.dun.tab };
  });
  await page.screenshot({ path: path.resolve(__dirname, '../shots/town-tower.png') });
  // keyboard walking in the town, night tint does not crash, world map again
  await page.evaluate(() => window.__pp.dun.setMapTab('town')); await page.waitForTimeout(300);
  const p0 = await page.evaluate(() => [window.__pp.town().pet.x, window.__pp.town().pet.y]);
  await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(500); await page.keyboard.up('ArrowLeft');
  const p1 = await page.evaluate(() => [window.__pp.town().pet.x, window.__pp.town().pet.y]);
  out.keys = { moved: p0[0] - p1[0] > 40 };
  await page.evaluate(() => window.__pp.dun.setMapTab('world')); await page.waitForTimeout(300);
  out.world = await page.evaluate(() => ({ spots: document.querySelectorAll('[data-wm]').length, canvas: !!document.querySelector('#worldCanvas canvas'), back: document.querySelector('#mapToWorld').hidden, townStopped: !window.__pp.town().raf }));
  console.log(JSON.stringify(out, null, 1));
  console.log('errors:', errors.length); errors.slice(0, 8).forEach(e => console.log('  ', e));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
