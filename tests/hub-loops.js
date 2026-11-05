// Cocopets Town's loops (24d-hub-facilities): the farm plots in town (plant → grow → water → harvest to the pantry), the
// kitchen (cook → wait → collect), feeding in town (the pantry and st.food change as the room's bowl would), the scenic
// rewards (the lookout's find once, the hidden garden's daily pearl), the upgrades, and st.hub through serialize/sanitize.
// Drives HubFacilities with a stub core when the hub core (24a) is not in the build. Page: test-d.html (or test.html).
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  const file = [process.env.HTML, 'test-d.html', 'test.html'].filter(Boolean).map(f => path.resolve(__dirname, '..', f)).find(f => fs.existsSync(f));
  await page.goto('file://' + file);
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const out = {}, fails = [];
  const check = (name, ok, info) => { out[name] = ok ? 'ok' : 'FAIL'; if (info !== undefined) out[name + ':'] = info; if (!ok) fails.push(name); };

  // a fresh pet, a stub core (or the real one when the build has it), the facilities started
  const init = await page.evaluate(() => {
    const P = window.__pp; P.quickStart('Mayor'); P.st.coins = 5000; P.st.crystals = 1000; P.st.energy = 100; P.st.food = 40; P.st.joy = 40;
    const F = globalThis.HubFacilities, log = { toasts: [], hearts: 0, opened: [] };
    const stub = { pet: () => ({ x: P.st.hub.x, y: P.st.hub.y, lv: 0 }), party: () => [], toast: (m, ms) => { log.toasts.push(m); window.__pp_toast && window.__pp_toast(m, ms); }, prompt() {}, teleport(x, y) { P.st.hub.x = x; P.st.hub.y = y; },
      openHouse() { log.opened.push('house'); }, openOverlay: fn => fn(), onReturn() {}, emitHearts() { log.hearts++; }, say() {}, addEntity() {}, removeEntity() {}, blockers: () => [], walkable: () => true, openStage(k) { log.opened.push('stage:' + k); } };
    window.__hubLog = log;
    F.init(stub);
    const places = F.places(), ents = F.extraEntities();
    return { hub: !!P.st.hub, plots: P.st.hub.plots.length, places: places.length, ids: places.map(p => p.id), ents: ents.length, kinds: [...new Set(ents.map(e => e.kind))], prompts: places.map(p => p.prompt()).filter(Boolean).length };
  });
  check('init', init.hub && init.plots === 6 && init.places >= 30 && init.prompts === init.places, init);
  check('places cover every building', HUB_IDS().every(id => init.ids.includes(id)), HUB_IDS().filter(id => !init.ids.includes(id)));
  check('entities: plots, npcs', init.kinds.includes('plot') && init.kinds.includes('npc') && init.ents === 12, { ents: init.ents, kinds: init.kinds });

  // every place's draw runs on a canvas (no throws) and each door opens something
  const draw = await page.evaluate(() => {
    const F = globalThis.HubFacilities, cv = document.createElement('canvas'); cv.width = 400; cv.height = 300; const c = cv.getContext('2d');
    let n = 0; for (const e of F.extraEntities()) { e.draw(c, 200, 200, 1, 1.5, { fade: 1 }); e.draw(c, 200, 200, 1.3, 2.5, { fade: 0.4 }); n++; }
    F.update(0.016, 1); return n;
  });
  check('draw every entity', draw === 12, draw);
  const opens = await page.evaluate(async () => {
    const P = window.__pp, F = globalThis.HubFacilities, log = window.__hubLog, res = {};
    const byId = id => F.places().find(p => p.id === id);
    const tryOpen = async id => { log.opened.length = 0; byId(id).open(); await new Promise(r => setTimeout(r, 60)); const k = P.sheetKind; const o = log.opened.slice(-1)[0]; const mapOpen = P.mapOpen, tab = P.dun.tab; if (P.sheetKind) P.closeSheet(); if (P.mapOpen) P.closeMap(); return k || (mapOpen ? 'map:' + tab : null) || o || null; };
    for (const id of ['cottage', 'shed', 'dojo', 'altar', 'shrineL', 'shrineR', 'kitchen', 'stallD', 'workshop', 'gate', 'riftgate', 'flappy', 'maze', 'npc-ova', 'npc-moss', 'npc-sentinel', 'dummies', 'plot0']) res[id] = await tryOpen(id);
    // the npc sheet's buttons lead on
    byId('npc-ova').open(); await new Promise(r => setTimeout(r, 40)); document.querySelector('#sheet [data-hub="go"][data-k="summon"]').click(); await new Promise(r => setTimeout(r, 60)); res.ovaSummon = P.sheetKind; P.closeSheet();
    byId('npc-glim').open(); await new Promise(r => setTimeout(r, 40)); document.querySelector('#sheet [data-hub="go"][data-k="stones"]').click(); await new Promise(r => setTimeout(r, 60)); res.glimStones = P.sheetKind; P.closeSheet();
    byId('dojo').open(); await new Promise(r => setTimeout(r, 40)); document.querySelector('#sheet [data-hub="go"][data-k="team"]').click(); await new Promise(r => setTimeout(r, 60)); res.dojoTeam = P.sheetKind; P.closeSheet();
    byId('dojo').open(); await new Promise(r => setTimeout(r, 40)); document.querySelector('#sheet [data-hub="go"][data-k="cards"]').click(); await new Promise(r => setTimeout(r, 60)); res.dojoCards = P.sheetKind; P.closeSheet();
    byId('altar').open(); await new Promise(r => setTimeout(r, 40)); document.querySelector('#sheet [data-hub="go"][data-k="evolve"]').click(); await new Promise(r => setTimeout(r, 60)); res.altarEvolve = P.sheetKind; P.closeSheet();
    return res;
  });
  const want = { cottage: 'house', shed: 'hub-shed', dojo: 'hub-dojo', altar: 'hub-altar', shrineL: 'fusion', shrineR: 'animas', kitchen: 'hub-kitchen', stallD: 'shop', workshop: 'hub-work', gate: 'map:dungeon', riftgate: 'map:rift', flappy: 'stage:flappy', maze: 'stage:maze', 'npc-ova': 'hub-npc', 'npc-moss': 'hub-npc', 'npc-sentinel': 'hub-npc', dummies: 'cards', plot0: 'hub-plot', ovaSummon: 'summon', glimStones: 'lab', dojoTeam: 'team', dojoCards: 'cards', altarEvolve: 'card' };
  want.shrineL = opens.shrineL === 'crystals' ? 'crystals' : 'fusion';   // (openFusion sends a one-pet house to the crystal shop)
  const bad = Object.keys(want).filter(k => opens[k] !== want[k]).map(k => `${k}: ${opens[k]} (want ${want[k]})`);
  check('every place opens its screen', !bad.length, bad.length ? bad : Object.keys(want).length + ' places');

  // the farm: plant (coins), advance, water, advance, harvest → pantry
  const farm = await page.evaluate(async () => {
    const P = window.__pp, F = globalThis.HubFacilities, h = P.st.hub, log = window.__hubLog, res = {};
    const place = F.places().find(p => p.id === 'plot0');
    res.p0 = place.prompt(); const coins0 = P.st.coins;
    F._.plantPlot(0, 'sunberry'); res.coinsSpent = coins0 - P.st.coins; res.planted = h.plots[0].crop; res.p1 = place.prompt();
    F.advance(0.1); res.g1 = +h.plots[0].g.toFixed(2);
    place.open(); res.water = h.plots[0].water; res.p2 = place.prompt();   // watering
    F.advance(0.1); res.g2 = +h.plots[0].g.toFixed(2);                    // twice as fast now
    F.advance(0.5); res.p3 = place.prompt(); res.stage = F._.stageOf(h.plots[0]);
    const before = P.st.pantry.sunberry || 0; place.open(); res.pantry = (P.st.pantry.sunberry || 0) - before; res.cleared = !h.plots[0].crop; res.p4 = place.prompt();
    res.fx = F.extraEntities().filter(e => e.kind === 'fx').length; res.toast = log.toasts.slice(-1)[0];
    // seeds from the shed are used first
    F._.buySeeds('carrot', 2); res.seeds = h.seeds.carrot; const c2 = P.st.coins; F._.plantPlot(1, 'carrot'); res.seedUsed = h.seeds.carrot === 1 && P.st.coins === c2 && h.plots[1].crop === 'carrot';
    // the greenhouse: half again as fast
    F._.buyUpgrade('greenhouse'); res.gh = h.up.greenhouse; const g0 = h.plots[1].g; F.advance(0.2); res.ghGrow = +((h.plots[1].g - g0) / 0.2).toFixed(2); res.ghEnt = F.extraEntities().some(e => e.kind === 'greenhouse');
    // the room's farm keeps growing too
    return res;
  });
  check('plant costs seed coins', farm.coinsSpent === 20 && farm.planted === 'sunberry' && farm.p0 === 'Plant', farm);
  check('water doubles growth', farm.water && Math.abs(farm.g1 - 0.1) < 1e-6 && Math.abs(farm.g2 - 0.3) < 1e-6 && /^Sunberries · /.test(farm.p2));
  check('harvest to the pantry', farm.stage === 3 && farm.pantry === 3 && farm.cleared && farm.p4 === 'Plant' && farm.fx >= 1 && /pantry/.test(farm.toast));
  check('shed seeds used first', farm.seeds === 2 && farm.seedUsed);
  check('greenhouse speeds the farm', farm.gh === 1 && farm.ghGrow === 1.5 && farm.ghEnt);

  // the kitchen: cook jam from 3 sunberries, wait, collect an ambrosia
  const cook = await page.evaluate(async () => {
    const P = window.__pp, F = globalThis.HubFacilities, h = P.st.hub, res = {}, kitchen = F.places().find(p => p.id === 'kitchen');
    P.st.pantry.sunberry = 3; res.p0 = kitchen.prompt();
    F._.startCook('tart'); res.noIngredients = !h.cook;
    F._.startCook('jam'); res.cooking = h.cook && h.cook.recipe; res.sunLeft = P.st.pantry.sunberry || 0; res.p1 = kitchen.prompt();
    res.early = F._.collectCook(); res.ambEarly = P.st.pantry.ambrosia || 0;
    h.cook.at -= 31e3; F.update(0.016, 2); res.p2 = kitchen.prompt(); res.told = window.__hubLog.toasts.slice(-1)[0];
    res.collected = F._.collectCook(); res.amb = P.st.pantry.ambrosia || 0; res.done = !h.cook;
    // the sheet renders with a dish on the stove and lists the five recipes
    P.st.pantry.carrot = 2; P.st.pantry.sunberry = 1; F._.openKitchen(); res.rows = document.querySelectorAll('#sheet [data-hub="cook"]').length; res.stewOk = document.querySelector('#sheet [data-hub="cook"][data-k="stew"]').getAttribute('aria-disabled') !== 'true';
    document.querySelector('#sheet [data-hub="cook"][data-k="stew"]').click(); await new Promise(r => setTimeout(r, 50)); res.stewOn = h.cook && h.cook.recipe; res.collectBtn = !!document.querySelector('#sheet [data-hub="collect"]');
    h.cook.at -= 60e3; F._.openKitchen(); res.collectBtn2 = !!document.querySelector('#sheet [data-hub="collect"]'); document.querySelector('#sheet [data-hub="collect"]').click(); await new Promise(r => setTimeout(r, 50)); res.honey = P.st.pantry.honeycomb || 0; P.closeSheet();
    return res;
  });
  check('cooking takes the pantry and time', cook.noIngredients && cook.cooking === 'jam' && cook.sunLeft === 0 && /^Cooking · /.test(cook.p1) && cook.early === false && cook.ambEarly === 0);
  check('collect the dish', /^Collect/.test(cook.p2) && /ready at the kitchen/.test(cook.told) && cook.collected && cook.amb === 1 && cook.done);
  check('kitchen sheet cooks and collects', cook.rows === 5 && cook.stewOk && cook.stewOn === 'stew' && !cook.collectBtn && cook.collectBtn2 && cook.honey === 1, cook);

  // feeding in town changes st.food as the room's bowl does, and takes the pantry item
  const feed = await page.evaluate(() => {
    const P = window.__pp, F = globalThis.HubFacilities, log = window.__hubLog, res = {};
    P.st.food = 40; P.st.joy = 40; P.st.pantry.carrot = 2; const xp0 = P.st.xp, dxp0 = P.st.dxp || 0, dlv0 = P.st.dlv || 1, meals0 = P.st.meals, h0 = log.hearts, mul = P.st.dna.personality === 'foodie' ? 1.5 : 1;
    res.ok = F.onFeed('carrot'); res.food = P.st.food; res.joy = +P.st.joy.toFixed(2); res.wantJoy = 40 + 4 * mul; res.carrot = P.st.pantry.carrot; res.xp = P.st.xp - xp0; res.dxp = (P.st.dxp || 0) - dxp0; res.lvUp = (P.st.dlv || 1) > dlv0; res.meals = P.st.meals - meals0; res.hearts = log.hearts - h0; res.toast = log.toasts.slice(-1)[0];
    P.st.pantry.carrot = 0; delete P.st.pantry.carrot; res.none = F.onFeed('carrot'); res.foodSame = P.st.food;
    P.st.food = 95; P.st.pantry.sunberry = 1; res.full = F.onFeed('sunberry'); res.keptSun = P.st.pantry.sunberry;
    // a free snack: berries cost nothing and need no pantry
    P.st.food = 10; res.berries = F.onFeed('berries'); res.foodB = P.st.food;
    // the Feed tray over the hub routes a tap to onFeed
    P.st.pantry.sunberry = 2; F.openFeedTray(); const tile = document.querySelector('#trayInner [data-snack="sunberry"]'); res.tile = !!tile; const f0 = P.st.food;
    if (tile) { const ev = t => tile.dispatchEvent(new PointerEvent(t, { pointerId: 7, clientX: 50, clientY: 50, bubbles: true })); ev('pointerdown'); ev('pointerup'); tile.dispatchEvent(new MouseEvent('click', { bubbles: true })); }   // (a real tap ends in a click; the hub core or the tray hook feeds once)
    res.trayFed = P.st.food > f0 && P.st.pantry.sunberry === 1; res.trayClosed = document.querySelector('#tray').hidden;
    return res;
  });
  const near = (a, b) => Math.abs(a - b) < 0.5;   // (the pet's needs tick down a little while the page runs)
  check('onFeed changes stats like the room', feed.ok && near(feed.food, 66) && near(feed.joy, feed.wantJoy) && feed.carrot === 1 && feed.xp >= 24 && (feed.dxp === 28 || feed.lvUp) && feed.meals === 1 && feed.hearts >= 1 && /ate the carrots/.test(feed.toast), feed);
  check('onFeed refuses when empty or full', feed.none === false && near(feed.foodSame, feed.food) && feed.full === false && feed.keptSun === 1 && feed.berries === true && near(feed.foodB, 32));
  check('feed tray routes to onFeed', feed.tile && feed.trayFed && feed.trayClosed);

  // pet and play
  const care = await page.evaluate(async () => {
    const P = window.__pp, F = globalThis.HubFacilities, log = window.__hubLog, res = {}; const j0 = P.st.joy = 50, h0 = log.hearts;
    F.onPet(); res.joy = P.st.joy - j0; res.hearts = log.hearts - h0;
    F.onPlay(); await new Promise(r => setTimeout(r, 200)); res.house = log.opened.slice(-1)[0]; res.tray = !document.querySelector('#tray').hidden && !!document.querySelector('#trayInner [data-act]'); P.st.joy = 50; document.querySelector('#trayInner [data-close]').click();
    return res;
  });
  check('onPet / onPlay', care.joy === 2 && care.hearts === 1 && care.house === 'house' && care.tray, care);

  // the scenic spots: the lookout's decoration once, the hidden garden's pearl once a day, resting places
  const spots = await page.evaluate(() => {
    const P = window.__pp, F = globalThis.HubFacilities, h = P.st.hub, res = {}, by = id => F.places().find(p => p.id === id);
    const gift = F.LOOKOUT_GIFT; res.p0 = by('lookout').prompt(); by('lookout').open(); res.inv = P.st.inv[gift] || 0; res.found = h.found.lookout; res.p1 = by('lookout').prompt(); by('lookout').open(); res.inv2 = P.st.inv[gift] || 0;
    const pearls = P.st.pearls; by('hidden').open(); res.pearl = P.st.pearls - pearls; by('hidden').open(); res.pearl2 = P.st.pearls - pearls; res.day = h.pearlDay;
    by('reading').open(); res.rest = F.resting() && F.resting().kind; res.idle = F.petIdle({ x: 1690, y: 1860 }, { index: 1 }); res.idleFar = F.petIdle({ x: 300, y: 300 }, {});
    res.bench = F.petIdle({ x: 1180, y: 1060 }, { kind: 'bench', x: 1180, y: 1062 }); res.none = F.petIdle({ x: 0, y: 0 }, { kind: 'lanternpost' });
    by('dockend').open(); res.dock = F.resting().kind; by('hideaway').open(); res.hide = F.resting().kind;
    return res;
  });
  check('lookout rewards once', spots.p0 === 'Look out' && spots.inv === 1 && spots.found === 1 && spots.p1 === 'Enjoy the view' && spots.inv2 === 1, spots);
  check('hidden garden: a pearl a day', spots.pearl === 1 && spots.pearl2 === 1 && /^\d{4}-\d{2}-\d{2}$/.test(spots.day));
  check('resting spots and petIdle', spots.rest === 'sit' && spots.idle && spots.idle.kind === 'sit' && spots.idleFar === null && spots.bench && spots.bench.kind === 'sit' && spots.none === null && spots.dock === 'watch' && spots.hide === 'curl');

  // the workshop upgrades and flags
  const ups = await page.evaluate(() => {
    const P = window.__pp, F = globalThis.HubFacilities, h = P.st.hub, res = {};
    P.st.coins = 100; F._.buyUpgrade('porch'); res.poor = !h.up.porch; P.st.coins = 5000; F._.buyUpgrade('porch'); res.porch = h.up.porch; res.flag = F.flag('cottage'); res.noflag = F.flag('dojo');
    P.st.crystals = 1000; F._.buyUpgrade('shrine'); res.shrine = h.up.shrine && P.st.crystals === 700 && F.flag('shrineL') && F.flag('shrineR');
    F._.openWorkshop(); res.built = document.querySelectorAll('#sheet .mc-state.done').length; res.buyBtns = document.querySelectorAll('#sheet [data-hub="up"]').length; P.closeSheet();
    return res;
  });
  check('upgrades', ups.poor && ups.porch === 1 && ups.flag && !ups.noflag && ups.shrine && ups.built === 3 && ups.buyBtns === 2, ups);

  // st.hub round-trips through serialize/sanitize; an old save (no hub) gets defaults and copies its farm room's crops
  const save = await page.evaluate(() => {
    const P = window.__pp, h = P.st.hub, res = {};
    h.x = 777; h.y = 888; h.lv = 1; h.inside = true; h.cook = { recipe: 'pie', at: Date.now() }; h.plots[2] = { crop: 'pumpkin', g: 1.5, water: true }; h.seeds.starfruit = 3; h.found.lookout = 1;
    const o = P.serialize(), s = P.sanitize(JSON.parse(JSON.stringify(o)));
    const canon = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((a, kk) => (a[kk] = x[kk], a), {}) : x); res.round = canon(s.hub) === canon(h); if (!res.round) res.diff = [canon(s.hub), canon(h)];
    // bounds and junk
    const bad = JSON.parse(JSON.stringify(o)); bad.hub = { x: -50, y: 99999, lv: 9, plots: [{ crop: 'bogus', g: 5 }, { crop: 'carrot', g: -3, water: 'yes' }], cook: { recipe: 'nope', at: 1 }, up: { greenhouse: 1, bogus: 1 }, found: { 'x y': 1, lookout: 1 }, seeds: { carrot: 1e9, nope: 2 }, pearlDay: 'junk' };
    const b = P.sanitize(bad).hub; res.bounds = b.x === 0 && b.y === 2000 && b.lv === 2 && b.plots[0].crop === null && b.plots[1].crop === 'carrot' && b.plots[1].g === 0 && b.plots[1].water === true && b.cook === null && b.up.greenhouse === 1 && !b.up.bogus && !b.found['x y'] && b.found.lookout === 1 && b.seeds.carrot === 99 && !b.seeds.nope && b.pearlDay === '';
    // an old save: no hub at all, a farm room with crops
    const old = JSON.parse(JSON.stringify(o)); delete old.hub; old.house.rooms.push({ id: 'r9', type: 'farm', name: 'Farm', theme: 'meadow', items: [], plots: [{ crop: 'starfruit', g: 2, water: false }, { crop: null, g: 0, water: false }] });
    const so = P.sanitize(old); res.old = so.hub && so.hub.x === 1300 && so.hub.y === 1120 && so.hub.lv === 0 && so.hub.inside === false && so.hub.plots.length === 6 && so.hub.plots[0].crop === 'starfruit' && so.hub.plots[0].g === 2 && so.hub.cook === null && Object.keys(so.hub.up).length === 0;
    res.roomKept = so.house.rooms.find(r => r.type === 'farm').plots[0].crop === 'starfruit';
    // growFarm grows both the room's and the town's plots (the town's with the greenhouse's 1.5)
    globalThis.HubFacilities.advance(1); res.grow = Math.abs(h.plots[2].g - (1.5 + 2 * 1.5)) < 1e-6;
    return res;
  });
  check('st.hub round-trips', save.round, save);
  check('sanitize bounds st.hub', save.bounds);
  check('old save gets hub defaults + farm copy', save.old && save.roomKept);
  check('growFarm grows the town plots', save.grow);

  // the new recipes exist and point at real foods
  const recipeCheck = await page.evaluate(() => { const F = globalThis.HubFacilities; F._.openKitchen(); const names = [...document.querySelectorAll('#sheet .shop-row b')].map(b => b.textContent); window.__pp.closeSheet(); return names; });
  check('five recipes listed', ['Sunberry jam', 'Carrot stew', 'Pumpkin pie', 'Starfruit tart', 'Garden salad'].every(n => recipeCheck.includes(n)), recipeCheck);

  await page.waitForTimeout(300);
  check('no page errors', !errors.length, errors.slice(0, 5));
  console.log(JSON.stringify(out, null, 1));
  console.log(fails.length ? `FAILED: ${fails.join(', ')}` : 'ALL PASSED');
  await browser.close();
  process.exit(fails.length ? 1 : 0);
  function HUB_IDS() { return ['cottage', 'shed', 'dojo', 'shrineL', 'shrineR', 'altar', 'kitchen', 'stallD', 'workshop', 'gate', 'riftgate', 'flappy', 'maze', 'shooter', 'blocks', 'sling', 'platform', 'npc-ova', 'npc-marina', 'npc-glim', 'npc-pockets', 'npc-moss', 'npc-sentinel', 'plot0', 'plot5', 'lookout', 'hidden', 'reading', 'dockend', 'hideaway', 'dummies']; }
})();
