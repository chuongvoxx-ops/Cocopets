// v460 META: the Pets & Team hub and double-tap to play as. One sheet, three areas sharing one state (the pet shown,
// the party); every old way in opens its area; double-tap (touch) and double-click (mouse) switch the played pet through
// the normal switch with the party's size kept; single taps inspect; taps on two pets, slow taps and scrolls do not
// switch; fusion pickers never switch; in a paused run, a knocked-out pet cannot lead and a party pet leads on closing.
// usage: HTML=test-meta.html node tests/_meta-hub.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const HTML = process.env.HTML || 'test.html';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const fails = [], passes = []; const ok = (c, what, info) => { (c ? passes : fails).push(what + (c || info === undefined ? '' : ' :: ' + JSON.stringify(info))); };
  const errors = [];
  const open = async touch => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: touch });
    page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
    await page.goto('file://' + path.resolve(__dirname, '..', HTML));
    await page.waitForFunction(() => window.__pp, null, { timeout: 90000 }); await page.waitForTimeout(300);
    const S = await page.evaluate(() => { const P = window.__pp; P.quickStart('Lead'); P.st.lv10Eggs = 1; P.st.unlockAll = true; P.st.dlv = 30; P.st.dun.best = 30; P.st.energy = 100; P.st.dun.god = true;
      for (let i = 0; i < 9; i++) { const f = P.newPetFields('Pet' + i, P.makeGenome(P.mulberry32(i * 31 + 9))); f.dlv = 20 + i; P.st.others.push(f); }
      P.st.party = null; P.partyPets(); P.closeSheet(); return { lead: P.st.uid, others: P.st.others.map(p => p.uid), party: P.partyPets().map(p => p.uid) }; });
    await page.waitForTimeout(300);
    return { page, S };
  };
  const rectOf = (page, sel) => page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
  // taps with the input's own timestamps (CDP), so a slow test machine's redraws between them do not stretch the gaps:
  // pts = [{x, y, at}] (at: seconds after the first)
  const taps = async (page, pts) => { const cdp = await page.context().newCDPSession(page), t0 = Date.now() / 1000;
    for (const q of pts) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: q.x, y: q.y }], timestamp: t0 + q.at }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], timestamp: t0 + q.at + 0.04 }); }
    await cdp.detach(); await page.waitForTimeout(600); };
  const state = page => page.evaluate(() => { const P = window.__pp; return { lead: P.st.uid, sel: P.team.teamUid, area: P.meta.hubArea, kind: P.sheetKind, party: P.partyPets().map(p => p.uid) }; });

  // ---- touch ----
  const { page, S } = await open(true);
  const dock = await page.evaluate(() => { const t = document.querySelector('#btnTeam'), c = document.querySelector('#btnCard'), r = t.getBoundingClientRect(); return { txt: t.textContent.trim(), label: t.getAttribute('aria-label'), vis: r.width > 30, card: c.hidden }; });
  ok(dock.vis && dock.txt === 'Pets' && dock.label === 'Pets and Team' && dock.card, 'the dock has one Pets (Pets and Team) button; the old Card button is gone', dock);
  await page.click('#btnTeam'); await page.waitForTimeout(400);
  const h1 = await page.evaluate(() => ({ title: document.querySelector('#sheetTitle').textContent, tabs: [...document.querySelectorAll('.hub-tab')].map(t => t.textContent.trim() + (t.getAttribute('aria-selected') === 'true' ? '*' : '')), slots: document.querySelectorAll('.party-grid .pt-pet.on').length, grid: document.querySelectorAll('.team-grid .pk-pet').length, abilities: document.querySelectorAll('.dp-slots .dslot').length, you: document.querySelectorAll('.team-grid .pk-you').length }));
  ok(h1.title === 'Pets & Team' && JSON.stringify(h1.tabs) === JSON.stringify(['Team*', 'Pet card', 'Collection']) && h1.slots === 4 && h1.grid === 10 && h1.abilities >= 3 && h1.you === 1, 'Team area: the party of four, the abilities, the whole collection with the played pet marked YOU', h1);
  // old links: the name tag opens the Pet card area on the played pet; the pocket opens the Collection
  await page.evaluate(() => window.__pp.closeSheet()); await page.click('#tagBtn'); await page.waitForTimeout(400);
  const h2 = await page.evaluate(() => ({ area: window.__pp.meta.hubArea, name: (document.querySelector('.hub-card .hc-name') || {}).textContent, settings: !!document.querySelector('[data-go="sound"]') && !!document.querySelector('[data-go="dev"]'), evo: !!document.querySelector('.hub-card .evo-track') }));
  ok(h2.area === 'card' && h2.name === 'Lead' && h2.settings && h2.evo, 'the name tag opens the Pet card area on the pet you play, with its evolution line and the settings', h2);
  await page.evaluate(() => window.__pp.meta.openPocket()); await page.waitForTimeout(300);
  ok((await state(page)).area === 'pets', 'the old pocket link opens the Collection area');
  await page.evaluate(() => { window.__pp.shop.openShop(); document.querySelector('#sheet [data-go="team"]').click(); }); await page.waitForTimeout(300);
  ok((await state(page)).kind === 'team' && (await state(page)).area === 'team', 'the Shop\'s Pets & Team link opens the hub');

  // shared state: inspect a resting pet in the Collection (single tap), see its card, rename it, put it in the party
  const rest = S.others.find(u => !S.party.includes(u));
  await page.evaluate(() => window.__pp.meta.hubSetArea('pets')); await page.waitForTimeout(250);
  let r = await rectOf(page, `.team-grid [data-uid="${rest}"]`); await page.touchscreen.tap(r.x, r.y); await page.waitForTimeout(600);
  let s = await state(page);
  ok(s.sel === rest && s.lead === S.lead, 'a single tap inspects (selects) the pet and does not switch', s);
  await page.evaluate(() => document.querySelector('[data-go="hub-tab"][data-a="card"]').click()); await page.waitForTimeout(300);
  const nm = await page.evaluate(rest => { const P = window.__pp; const name0 = document.querySelector('.hub-card .hc-name').textContent; const i = document.querySelector('#renameInput'); i.value = 'Renamed'; document.querySelector('#renameForm').requestSubmit(); return { name0, now: P.st.others.find(p => p.uid === rest).name, lead: P.st.name }; }, rest);
  ok(/^Pet\d$/.test(nm.name0) && nm.now === 'Renamed' && nm.lead === 'Lead', 'the Pet card area shows the inspected pet and renames that pet', nm);
  await page.evaluate(() => document.querySelector('[data-go="hub-tab"][data-a="team"]').click()); await page.waitForTimeout(300);
  const tm = await page.evaluate(rest => { const P = window.__pp; const sel = P.team.teamUid; const outU = P.partyPets()[3].uid; P.team.teamToggleParty(outU); P.team.teamToggleParty(rest); return { sel, inParty: P.partyPets().some(p => p.uid === rest), size: P.partyPets().length, strip: [...document.querySelectorAll('.party-grid .pt-pet.on')].map(e => e.dataset.uid) }; }, rest);
  ok(tm.sel === rest && tm.inParty && tm.size === 4 && tm.strip.includes(rest), 'the same pet is shown in the Team area; party changes show in the strip at once', tm);
  await page.evaluate(() => window.__pp.meta.hubSetArea('pets')); await page.waitForTimeout(250);
  const stripPets = await page.evaluate(() => [...document.querySelectorAll('.party-grid .pt-pet.on')].map(e => e.dataset.uid));
  ok(JSON.stringify(stripPets) === JSON.stringify(tm.strip), 'the Collection area shows the same party', { stripPets, strip: tm.strip });
  // fuse from the hub: the inspected pet in the first slot
  const fz = await page.evaluate(rest => { document.querySelector(`[data-go="hub-fuse"][data-uid="${rest}"]`).click(); const P = window.__pp; const a = P.meta.fuseSel.a; return { kind: P.sheetKind, a: a < 0 ? P.st.uid : P.st.others[a].uid }; }, rest);
  ok(fz.kind === 'fusion' && fz.a === rest, '"Fuse" from the hub opens fusion with that pet chosen', fz);
  // fusion pickers: a double tap on a parent tile never switches the played pet
  r = await rectOf(page, `[data-go="fuse-pick"][data-slot="b"][data-i="2"]`);
  await taps(page, [{ x: r.x, y: r.y, at: 0 }, { x: r.x, y: r.y, at: 0.12 }]);
  ok((await state(page)).lead === S.lead, 'double-tapping a fusion picker tile chooses a parent, never switches');
  await page.evaluate(() => window.__pp.meta.openHub('pets')); await page.waitForTimeout(300);

  // double-tap in the Collection: plays as that pet, the party keeps four, the old lead stays in it
  const tgt = S.others.find(u => u !== rest && !S.party.includes(u) && u !== tm.strip[3]) || S.others[6];
  const party0 = (await state(page)).party;
  r = await rectOf(page, `.team-grid [data-uid="${tgt}"]`);
  await taps(page, [{ x: r.x, y: r.y, at: 0 }, { x: r.x, y: r.y, at: 0.16 }]);
  s = await state(page);
  const lead1 = await page.evaluate(() => ({ name: window.__pp.st.name, you: (document.querySelector('.team-grid .pk-pet.cur') || {}).dataset ? document.querySelector('.team-grid .pk-pet .pk-you').closest('.pk-pet').dataset.uid : null, hud: document.querySelector('#petName').textContent }));
  ok(s.lead === tgt && s.party.length === 4 && s.party.includes(S.lead) && s.area === 'pets' && lead1.you === tgt && lead1.hud === lead1.name, 'double-tap: that pet is played (HUD, YOU mark), the party keeps four with the old lead in it', { s, lead1, party0 });
  // two taps on two different pets: no switch
  const a2 = S.others.find(u => u !== tgt && u !== S.lead), b2 = S.lead;
  r = await rectOf(page, `.team-grid [data-uid="${a2}"]`); const r2 = await page.evaluate(u => { const b = document.querySelector(`.team-grid [data-uid="${u}"]`).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, b2);
  await taps(page, [{ x: r.x, y: r.y, at: 0 }, { x: r2.x, y: r2.y, at: 0.12 }]);
  s = await state(page); ok(s.lead === tgt && s.sel === b2, 'taps on two different pets inside the window: inspect the second, no switch', s);
  // slow taps (450 ms apart): no switch
  r = await rectOf(page, `.team-grid [data-uid="${a2}"]`); await taps(page, [{ x: r.x, y: r.y, at: 0 }, { x: r.x, y: r.y, at: 0.45 }]);
  s = await state(page); ok(s.lead === tgt && s.sel === a2, 'two taps 450 ms apart (window 300 ms): no switch', s);
  // a drag (a scroll) between two taps on the same pet: no switch. First the finger moving 30 px (pointer events as a
  // touch scroll gives them), then a real scroll gesture over the grid, each followed at once by a tap
  r = await rectOf(page, `.team-grid [data-uid="${a2}"]`);
  { const cdp = await page.context().newCDPSession(page), t0 = Date.now() / 1000, T = (type, dt, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts, timestamp: t0 + dt });
    await T('touchStart', 0, [{ x: r.x, y: r.y }]); await T('touchEnd', 0.04, []);                                   // tap
    await T('touchStart', 0.08, [{ x: r.x, y: r.y }]); for (let k = 1; k <= 4; k++) await T('touchMove', 0.08 + k * 0.012, [{ x: r.x, y: r.y - k * 10 }]); await T('touchEnd', 0.14, []);   // a 40 px drag
    await T('touchStart', 0.2, [{ x: r.x, y: r.y }]); await T('touchEnd', 0.24, []);                                 // tap, 200 ms after the first
    await cdp.detach(); await page.waitForTimeout(600); }
  s = await state(page); ok(s.lead === tgt, 'tap, a 40 px drag, tap on the same pet within 300 ms: no switch (the drag is a scroll, not a tap)', s);
  // a real touch scroll that starts on a pet: the sheet scrolls, nothing is inspected or switched
  { const sel0 = (await state(page)).sel;
    const q = await page.evaluate(() => { const sh = document.querySelector('#sheet'), max = sh.scrollHeight - sh.clientHeight; sh.scrollTop = max; const t = [...document.querySelectorAll('.team-grid .pk-pet')].find(e => { const r = e.getBoundingClientRect(); return r.top > 200 && r.bottom < 830; }); if (!t) return { none: true, max }; const b = t.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, top: sh.scrollTop, max }; });
    const cdp = await page.context().newCDPSession(page), t0 = Date.now() / 1000, T = (type, dt, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts, timestamp: t0 + dt });
    await T('touchStart', 0, [{ x: q.x, y: q.y }]); for (let k = 1; k <= 12; k++) { await T('touchMove', k * 0.016, [{ x: q.x, y: q.y + k * 14 }]); } await T('touchEnd', 0.21, []); await cdp.detach(); await page.waitForTimeout(600);
    const top1 = await page.evaluate(() => document.querySelector('#sheet').scrollTop); s = await state(page);
    ok(q.max > 100 && top1 !== q.top && s.sel === sel0 && s.lead === tgt && s.kind === 'team', 'a touch scroll starting on a pet scrolls the sheet and neither inspects nor switches', { q, top1, s, sel0 }); }
  // party strip double-tap (Team area)
  await page.evaluate(() => window.__pp.meta.hubSetArea('team')); await page.waitForTimeout(400);
  const pIn = (await state(page)).party.find(u => u !== tgt);
  r = await rectOf(page, `.party-grid [data-dbl="${pIn}"]`); await taps(page, [{ x: r.x, y: r.y, at: 0 }, { x: r.x, y: r.y, at: 0.15 }]);
  s = await state(page); ok(s.lead === pIn && s.party.length === 4 && s.party.includes(tgt), 'double-tap on a party slot: that member is played, the party keeps its four', s);
  const cfg = await page.evaluate(() => window.__pp.meta.HUB_DBL); ok(cfg.ms === 300 && cfg.slop === 10, 'the double-tap window is a setting (300 ms, 10 px)', cfg);

  // ---- in a paused run: knocked-out pets cannot lead; a party pet leads on closing ----
  await page.evaluate(() => { const P = window.__pp; P.closeSheet(); P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(12, 4242); });
  let runOK = true;
  try {
    await page.waitForFunction(() => window.__pp.arc.state === 'play' || window.__pp.arc.state === 'ready', null, { timeout: 60000 }); await page.evaluate(() => { if (window.__pp.arc.state === 'ready') window.__pp.beginPlay(); });
    await page.waitForFunction(() => window.__pp.arc.game && window.__pp.arc.game._dbg && window.__pp.arc.game._dbg.g.intro <= 0, null, { timeout: 60000 });
  } catch (e) { runOK = false; }
  if (runOK) {
    const rr = await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg; P.openRunTeam(); const ps = G.partyState(); const down = ps.find(m => !m.cur), up = ps.find(m => !m.cur && m !== down);
      D.party[ps.indexOf(down)].down = true;
      const a = P.meta.hubPlayAs(down.uid), q1 = P.meta.runLeadUid; const b = P.meta.hubPlayAs(up.uid), q2 = P.meta.runLeadUid; const home = P.st.uid;
      P.closeSheet(); return { a, q1, b, q2, up: up.uid, home }; });
    await page.waitForTimeout(800);
    const after = await page.evaluate(() => { const P = window.__pp; return { cur: P.arc.game.partyState().find(m => m.cur).uid, home: P.st.uid, paused: P.arc.paused }; });
    ok(rr.a === false && rr.q1 === null, 'in a run: a knocked-out pet cannot be chosen to lead', rr);
    ok(rr.b === true && rr.q2 === rr.up && after.cur === rr.up && after.home === rr.home && !after.paused, 'in a run: a party pet chosen by double-tap leads once the sheet closes (the run\'s own switch; home unchanged)', { rr, after });
    await page.evaluate(() => { try { window.__pp.closeArcade(); } catch (e) {} });
  } else ok(false, 'the Tower run for the in-run checks did not start');
  await page.close();

  // ---- mouse: double-click ----
  const M = await open(false);
  await M.page.evaluate(() => window.__pp.meta.openHub('pets')); await M.page.waitForTimeout(400);
  const t2 = M.S.others[5];
  r = await rectOf(M.page, `.team-grid [data-uid="${t2}"]`); await M.page.mouse.dblclick(r.x, r.y, { delay: 40 }); await M.page.waitForTimeout(700);
  s = await state(M.page); ok(s.lead === t2 && s.party.length === 4, 'desktop: a double-click plays as that pet', s);
  r = await rectOf(M.page, `.team-grid [data-uid="${M.S.others[6]}"]`); await M.page.mouse.click(r.x, r.y); await M.page.waitForTimeout(500);
  s = await state(M.page); ok(s.lead === t2 && s.sel === M.S.others[6], 'desktop: a single click inspects only', s);
  await M.page.close();

  console.log(passes.map(p => 'PASS ' + p).join('\n'));
  console.log(fails.map(p => 'FAIL ' + p).join('\n'));
  console.log(`${passes.length} passed, ${fails.length} failed; page errors: ${errors.length}`); errors.slice(0, 6).forEach(e => console.log('  ', e));
  await browser.close();
  process.exit(fails.length || errors.length ? 1 : 0);
})();
