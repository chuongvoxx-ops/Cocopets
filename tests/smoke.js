// Smoke battery before a publish: fresh intro, old-save migration, main screens at phone/narrow/desktop widths,
// the map, the dungeon lobby and every arcade game starting; the production file must not carry the test hook.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const prod = fs.readFileSync(path.resolve(__dirname, '../pocket-pet.html'), 'utf8');
  if (prod.includes('__pp')) { console.log('FAIL production contains the test hook'); process.exit(1); }
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const out = path.resolve(__dirname, '../shots'); fs.mkdirSync(out, { recursive: true });
  const fail = m => { console.log('FAIL', m); errors.push('assert: ' + m); };
  const url = 'file://' + path.resolve(__dirname, '../test.html');
  const mk = async (opts) => {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true }, opts || {}));
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
    return { ctx, page };
  };

  // 1. a fresh visitor sees the intro egg, no errors; production file loads too
  {
    const { ctx, page } = await mk();
    await page.goto(url); await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({ splash: !document.querySelector('#splash').hidden, intro: !document.querySelector('#intro').hidden, st: !!window.__pp.st }));
    if (!(r.splash || r.intro) || r.st) fail('fresh load should show the splash or intro: ' + JSON.stringify(r));
    await page.screenshot({ path: path.join(out, 'sm-intro.png') });
    await page.goto('file://' + path.resolve(__dirname, '../pocket-pet.html')); await page.waitForTimeout(1200);
    const r2 = await page.evaluate(() => ({ splash: !document.querySelector('#splash').hidden, intro: !document.querySelector('#intro').hidden, hook: typeof window.__pp }));
    if (!(r2.splash || r2.intro) || r2.hook !== 'undefined') fail('production load ' + JSON.stringify(r2));
    await ctx.close();
  }
  // 2. an older save (v8: no crystals, no house paint, pets without lineage) migrates and plays
  {
    const first = await mk();
    await first.page.goto(url); await first.page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await first.page.waitForTimeout(300);
    const oldSave = await first.page.evaluate(() => {
      const P = window.__pp; P.quickStart('Oldie'); const st = P.st;
      const R = P.mulberry32(31), g = P.makeGenome(R); st.forms = P.evolveLine(g.form, 6, R); st.stage = 6; st.dlv = 12; st.coins = 777; st.pearls = 3;
      const o = P.newPetFields('Pal', P.makeGenome(P.mulberry32(8))); st.others.push(o);
      const s = JSON.parse(JSON.stringify(Object.assign({}, st, { room: undefined })));
      delete s.crystals; delete s.fusionStones; delete s.fuseRolls; delete s.fusedFrom; delete s.gen; delete s.house.paint; delete s.house.roof; delete s.house.name; s.others.forEach(p => { delete p.fusedFrom; delete p.gen; });
      s.forms.forEach(f => { f.grow = 1.3; });   // the old, too-big late stages
      return JSON.stringify(s);
    });
    await first.ctx.close();
    // a fresh context that already holds the old save when the game boots
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
    await ctx.addInitScript(v => { try { localStorage.setItem('pocket-pet-v1', v); } catch (e) {} }, oldSave);
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.goto(url); await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(1500);
    const r = await page.evaluate(() => { const s = window.__pp.st; return s ? { name: s.name, crystals: s.crystals, stones: s.fusionStones, paint: s.house.paint, roof: s.house.roof, gen: s.gen, from: s.fusedFrom, others: s.others.length, stage: s.stage, grow: s.forms[5].grow, playing: document.querySelector('#app').classList.contains('playing'), hud: document.querySelector('#crystalNum').textContent } : null; });
    console.log('migrated', JSON.stringify(r));
    if (!r || r.crystals !== 0 || r.stones !== 0 || r.paint !== 'cream' || r.gen !== 0 || r.from !== null || r.others !== 1 || r.stage !== 6 || r.grow > 1.121 || !r.playing) fail('old save migration');
    await page.screenshot({ path: path.join(out, 'sm-room-390.png') });
    // card, pet strip with Fuse tile, crystal pill opens the shop
    await page.evaluate(() => window.__pp.openCard()); await page.waitForTimeout(300);
    const c = await page.evaluate(() => ({ fuse: !!document.querySelector('.ps-fuse'), text: document.querySelector('#sheet').innerText.slice(0, 80) }));
    if (!c.fuse) fail('Fuse tile missing on the card with two pets');
    await page.screenshot({ path: path.join(out, 'sm-card.png') });
    await page.evaluate(() => window.__pp.closeSheet());
    await page.click('#crystalPill'); await page.waitForTimeout(250);
    if ((await page.evaluate(() => window.__pp.sheetKind)) !== 'crystals') fail('crystal pill does not open the shop');
    await page.evaluate(() => window.__pp.closeSheet());
    // the map and the dungeon lobby
    await page.evaluate(() => window.__pp.openMap()); await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, 'sm-map.png') });
    await page.evaluate(() => window.__pp.dun.setMapTab('dungeon', true)); await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(out, 'sm-dungeon-tab.png') });
    await page.evaluate(() => window.__pp.closeMap());
    // narrow and desktop
    await page.setViewportSize({ width: 320, height: 640 }); await page.waitForTimeout(500);
    const nr = await page.evaluate(() => { const t = document.querySelector('#petName'); return { tag: t.scrollWidth <= t.clientWidth + 1, text: t.textContent, w: t.clientWidth }; });
    if (!nr.tag) fail('pet name truncated at 320px: ' + JSON.stringify(nr));
    await page.screenshot({ path: path.join(out, 'sm-room-320.png') });
    await page.setViewportSize({ width: 1100, height: 760 }); await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(out, 'sm-room-desktop.png') });
    await ctx.close();
  }
  // 3. every arcade game starts and runs a few seconds; the dungeon too
  {
    const { ctx, page } = await mk();
    await page.goto(url); await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
    await page.evaluate(() => { const P = window.__pp; P.quickStart('Zip'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 9; });
    for (let w = 1; w <= 6; w++) {
      const e0 = errors.length;
      await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.openMap(); P.dun.setMapTab('galaxy', true); });
      await page.evaluate(w => window.__pp.startStage(w, 1), w);
      try { await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 }); } catch (e) { fail('world ' + w + ' never ready'); continue; }
      await page.evaluate(() => window.__pp.beginPlay());
      await page.waitForTimeout(2500);
      // poke it
      await page.touchscreen.tap(195, 500); await page.waitForTimeout(800);
      const r = await page.evaluate(() => ({ state: window.__pp.arc.state, key: window.__pp.arc.key }));
      await page.screenshot({ path: path.join(out, `sm-game-${w}.png`) });
      console.log('game', w, JSON.stringify(r), 'errs', errors.length - e0);
      if (r.state !== 'play' && r.state !== 'over' && r.state !== 'won') fail('world ' + w + ' state ' + r.state);
    }
    await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.openMap(); P.dun.setMapTab('dungeon', true); });
    await page.evaluate(() => window.__pp.dun.startDungeon(2, 77));
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.screenshot({ path: path.join(out, 'sm-dun-ready.png') });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForTimeout(3000);
    await page.touchscreen.tap(195, 420); await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(out, 'sm-dun-play.png') });
    const d = await page.evaluate(() => ({ state: window.__pp.arc.state, mons: window.__pp.arc.game._dbg.mons.length }));
    console.log('dungeon', JSON.stringify(d));
    if (d.state !== 'play' || d.mons < 10) fail('dungeon start');
    await ctx.close();
  }
  console.log('errors:', errors.length, errors.slice(0, 10));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
