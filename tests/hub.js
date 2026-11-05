// Cocopets Town (the hub core, 24a): the page boots into the town; the player can walk from spawn to every district
// without getting stuck; terraces block except at their ramps; the cottage opens the house and Outside returns; a
// mini-game door opens its stage card; a reload keeps the position; no page errors.
// usage: node tests/hub.js          HTML=test-a.html (a build of your own)     SHOTS=1 (screenshots into shots/hub-*.png)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  const url = 'file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html');
  await page.goto(url);
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  // a fresh game boots into the town
  const boot = await page.evaluate(() => { const P = window.__pp; P.quickStart('Hubby'); P.st.unlockAll = true; const HC = window.HubCore; return { on: HC.on, inHub: document.body.classList.contains('in-hub'), hubHidden: document.getElementById('hubWrap').hidden, stageVis: getComputedStyle(document.getElementById('stage')).visibility, hub: P.st.hub && { x: P.st.hub.x, y: P.st.hub.y, inside: P.st.hub.inside }, kits: { geo: !!window.HubGeo, land: !!window.HubLand, fac: !!window.HubFacilities } }; });
  ok(boot.on && boot.inHub && !boot.hubHidden && boot.stageVis === 'hidden', 'a new game opens in the town with the room hidden', boot);
  console.log('kits present', JSON.stringify(boot.kits));
  await page.waitForTimeout(600);
  // step game time: the frame loop runs on rAF; walking is driven by setting the goal and waiting for arrival
  const walkTo = async (x, y, maxS) => page.evaluate(async ([x, y, maxS]) => {
    const HC = window.HubCore; if (!HC.on) HC.enterHub(true); const h = HC.hub; HC.goTo(x, y, null);
    const t0 = performance.now(); let last = [h.pet.x, h.pet.y], stillFor = 0, lastT = t0;
    while (performance.now() - t0 < maxS * 1000) {
      await new Promise(r => requestAnimationFrame(r));
      if (!h.goal) break;
      const now = performance.now(); if (Math.hypot(h.pet.x - last[0], h.pet.y - last[1]) < 0.5) stillFor += now - lastT; else stillFor = 0; lastT = now; last = [h.pet.x, h.pet.y];
      if (stillFor > 1500) break;
    }
    return { x: Math.round(h.pet.x), y: Math.round(h.pet.y), lv: h.pet.lv, d: Math.round(Math.hypot(h.pet.x - x, h.pet.y - y)), goalLeft: !!h.goal, secs: +((performance.now() - t0) / 1000).toFixed(1) };
  }, [x, y, maxS]);
  // every district centre, one after another
  const DIST = await page.evaluate(() => { try { return Object.entries(window.HubCore.HUB.districts).map(([id, d]) => [id, d.x, d.y, d.lv]); } catch (e) { return null; } });
  ok(Array.isArray(DIST) && DIST.length >= 8, 'the layout exposes the districts', DIST && DIST.length);
  const route = [];
  if (DIST) for (const [id, x, y, lv] of DIST) { const r = await walkTo(x, y, 60); route.push({ id, ...r, lvOk: r.lv === lv }); if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/hub-${id}.png`) }); }
  route.forEach(r => console.log(`  ${r.id.padEnd(10)} → (${r.x},${r.y}) lv${r.lv} off by ${r.d}px in ${r.secs}s${r.goalLeft ? ' (gave up)' : ''}${r.lvOk ? '' : ' WRONG LEVEL'}`));
  ok(route.every(r => r.d <= 60 && !r.goalLeft), 'the player reaches every district centre (within 60 px) without getting stuck', route.filter(r => r.d > 60 || r.goalLeft).map(r => r.id));
  ok(route.every(r => r.lvOk), 'the player stands at each district\'s level when it arrives', route.filter(r => !r.lvOk).map(r => r.id + ':' + r.lv));
  // terraces: walking straight at the cottage cliff from the plaza side is blocked; the ramp lets you up
  const cliff = await page.evaluate(() => {
    const HC = window.HubCore, h = HC.hub; HC.api.teleport(700, 820); h.pet.lv = 0;
    const before = [h.pet.x, h.pet.y, h.pet.lv];
    let blocked = 0; for (let i = 0; i < 60; i++) { const y0 = h.pet.y; const moved = HC.walkable(h.pet.x, h.pet.y - 4, 0); if (moved) h.pet.y -= 4; else { blocked = 1; break; } }
    const atWall = [h.pet.x, Math.round(h.pet.y), h.pet.lv];
    const wallOk = HC.walkable(700, 740, 0), wallUp = HC.walkable(700, 740, 1), rampOk = HC.walkable(950, 825, 0) && !HC.walkable(950, 790, 0) && HC.walkable(950, 745, 1) && HC.walkable(950, 790, 0, HC.terrain(950, 825).ramp), insideUp = HC.walkable(950, 700, 1), insideDown = HC.walkable(950, 700, 0);
    const river = HC.walkable(1000, 1668, 0), bridge = HC.walkable(1300, 1668, 0), shallows = HC.terrain(1000, 1620);
    return { before, atWall, blocked, wallOk, wallUp, rampOk, insideUp, insideDown, river, bridge, shallows };
  });
  ok(cliff.blocked && !cliff.wallOk && cliff.wallUp && cliff.rampOk && cliff.insideUp && !cliff.insideDown, 'a cliff blocks a level-0 walker, the ramp is open at both levels, the terrace top is only for level 1', cliff);
  ok(!cliff.river && cliff.bridge && cliff.shallows.splash && !cliff.shallows.water, 'the river blocks except on a bridge; its edge is a splash zone', { river: cliff.river, bridge: cliff.bridge, shallows: cliff.shallows });
  // the cottage door opens the house; Outside returns to town
  await page.evaluate(() => { const HC = window.HubCore; HC.api.teleport(720, 600); });
  const house = await walkTo(720, 540, 20);
  await page.waitForTimeout(400);
  const inHouse = await page.evaluate(() => ({ on: window.HubCore.on, stageVis: getComputedStyle(document.getElementById('stage')).visibility, inside: window.__pp.st.hub.inside, outsideBtn: !document.getElementById('outsideBtn').hidden }));
  ok(!inHouse.on && inHouse.stageVis === 'visible' && inHouse.inside && inHouse.outsideBtn, 'walking into the cottage door shows the house with an Outside button', { house, inHouse });
  await page.click('#outsideBtn'); await page.waitForTimeout(300);
  const back = await page.evaluate(() => ({ on: window.HubCore.on, inside: window.__pp.st.hub.inside, x: Math.round(window.HubCore.hub.pet.x), y: Math.round(window.HubCore.hub.pet.y) }));
  ok(back.on && !back.inside && Math.abs(back.x - 720) < 30 && Math.abs(back.y - 540) < 30, 'Outside returns to the town at the door', back);
  // a mini-game door opens its stage card
  await page.evaluate(() => window.HubCore.api.teleport(920, 420));
  const game = await walkTo(860, 320, 20); await page.waitForTimeout(500);
  const card = await page.evaluate(() => { const P = window.__pp; const mc = document.getElementById('mapCard'); return { mapOpen: P.mapOpen, tab: P.dun.tab, cardShown: !mc.hidden, stages: mc.querySelectorAll('.tstage').length, title: (mc.querySelector('h2') || {}).textContent }; });
  ok(card.mapOpen && card.tab === 'world' && card.cardShown && card.stages >= 4, 'the observatory door opens the Star Blaster stage list', { game, card });
  await page.evaluate(() => window.__pp.closeMap()); await page.waitForTimeout(300);
  const resumed = await page.evaluate(() => window.HubCore.on && !document.getElementById('hubWrap').hidden);
  ok(resumed, 'closing the Adventure overlay resumes the town');
  // the dock's Adventure button and the old town tab both come back to the hub
  await page.evaluate(() => { window.__pp.openMap(); window.__pp.dun.setMapTab('town'); });
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => !window.__pp.mapOpen && window.HubCore.on), 'the retired town tab lands in the hub');
  // the prompt button appears beside a door and E uses it
  await page.evaluate(() => window.HubCore.api.teleport(2080, 850));
  await page.waitForTimeout(400);
  const prompt = await page.evaluate(() => { const b = document.querySelector('#hubUi .hub-prompt'); return b ? b.textContent.trim() : null; });
  ok(!!prompt, 'a prompt shows near the dojo door', prompt);
  // save and reload: the position comes back
  const saved = await page.evaluate(() => { const HC = window.HubCore; HC.api.teleport(1500, 1000); window.__pp.saveLocalNow(); return { x: window.__pp.st.hub.x, y: window.__pp.st.hub.y }; });
  await page.reload(); await page.waitForFunction(() => window.__pp && window.__pp.st && window.HubCore && window.HubCore.hub, null, { timeout: 15000 }); await page.waitForTimeout(600);
  const after = await page.evaluate(() => ({ on: window.HubCore.on, x: Math.round(window.HubCore.hub.pet.x), y: Math.round(window.HubCore.hub.pet.y), saved: { x: window.__pp.st.hub.x, y: window.__pp.st.hub.y } }));
  ok(after.on && Math.abs(after.x - saved.x) < 2 && Math.abs(after.y - saved.y) < 2, 'a reload returns the player to where they stood', { saved, after });
  // the house state survives too: save while indoors, reload lands indoors, Outside works
  await page.evaluate(() => { window.HubCore.enterHouse(); window.__pp.saveLocalNow(); });
  await page.reload(); await page.waitForFunction(() => window.__pp && window.__pp.st && window.HubCore && window.HubCore.hub, null, { timeout: 15000 }); await page.waitForTimeout(500);
  const indoors = await page.evaluate(() => ({ on: window.HubCore.on, inside: window.__pp.st.hub.inside, outsideBtn: !document.getElementById('outsideBtn').hidden }));
  ok(!indoors.on && indoors.inside && indoors.outsideBtn, 'a save made indoors reloads indoors with the Outside button', indoors);
  await page.click('#outsideBtn'); await page.waitForTimeout(300);
  // frame cost in town, with everything present on this build
  await page.evaluate(() => { if (!window.HubCore.on) window.HubCore.enterHub(true); window.HubCore.api.teleport(1300, 1000); });
  await page.waitForTimeout(3000); await page.evaluate(() => window.HubCore.resetStats()); await page.waitForTimeout(3000);
  const perf = await page.evaluate(() => window.HubCore.stats());
  console.log('frame ms (headless Chromium, swiftshader):', JSON.stringify({ avg: +perf.avg.toFixed(2), max: +perf.max.toFixed(1), frames: perf.frames, k: perf.k, view: perf.W + 'x' + perf.H }));
  if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, '../shots/hub-plaza.png') });
  ok(!errors.length, 'no page errors', errors.slice(0, 8));
  console.log(bad ? 'FAILED ' + bad : 'all passed'); await browser.close(); process.exit(bad ? 1 : 0);
})();
