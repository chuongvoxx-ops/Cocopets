// The Team button by the health bars, mid-run (the Tower and the rifts): it pauses the run and opens the Team sheet over
// it; the party, abilities, accessories and levels can be changed; closing the sheet rebuilds the run's party with the
// changes (each pet keeping its share of health) and the run carries on. usage: node tests/run-team.js   env: SHOTS=1
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
  const shot = async n => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/run-team-${n}.png`) }); };
  const S = await page.evaluate(() => { const P = window.__pp; P.quickStart('Lead'); P.st.unlockAll = true; P.st.dlv = 30; P.st.dun.best = 30; P.st.energy = 100; P.st.dun.god = false;
    for (let i = 0; i < 4; i++) { const gn = P.makeGenome(P.mulberry32(i * 31 + 9)), f = P.newPetFields('Pet' + i, gn); f.dlv = 20 + i; P.st.others.push(f); }
    P.st.party = null; const party = P.partyPets(); return { party: party.map(p => p.uid), others: P.st.others.map(p => p.uid) }; });
  // a Tower floor
  await page.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(12, 4242); });
  await page.waitForFunction(() => window.__pp.arc.state === 'play' || window.__pp.arc.state === 'ready', null, { timeout: 30000 }); await page.evaluate(() => { if (window.__pp.arc.state === 'ready') window.__pp.beginPlay(); });
  await page.waitForFunction(() => window.__pp.arc.game && window.__pp.arc.game._dbg && window.__pp.arc.game._dbg.g.intro <= 0, null, { timeout: 30000 });
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.hp = Math.round(D.ST.hp * 0.5); return { n: D.party ? D.party.length : -1, hp: D.me.hp, max: D.ST.hp }; });
  await shot('hud');
  // tap the Team button (just right of the health box)
  const tap = await page.evaluate(() => { const cv = document.getElementById('arcCanvas'), rc = cv.getBoundingClientRect(), W = window.__pp.arc.W, x = rc.left + 10 + Math.min(150, W * 0.4) + 66, y = rc.top + 26; const e = t => new PointerEvent(t, { pointerId: 51, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, cancelable: true, buttons: 1 }); cv.dispatchEvent(e('pointerdown')); cv.dispatchEvent(new PointerEvent('pointerup', { pointerId: 51, pointerType: 'touch', clientX: x, clientY: y, bubbles: true })); const sw = document.getElementById('sheetWrap'); return { open: !sw.hidden, paused: window.__pp.arc.paused, title: (document.getElementById('sheetTitle') || {}).textContent, note: !!document.querySelector('.tm-run'), lead: !!document.querySelector('[data-go="team-lead"]'), z: getComputedStyle(sw).zIndex }; });
  console.log('  open', JSON.stringify(tap)); ok(tap.open && tap.paused && tap.title === 'Team' && tap.note && !tap.lead && +tap.z > 32, 'the Team button pauses the run and opens the Team sheet over it (no "Play as" mid-run)');
  const t0 = await page.evaluate(() => window.__pp.arc.game._dbg.g.t); await page.waitForTimeout(800); const t1 = await page.evaluate(() => window.__pp.arc.game._dbg.g.t); ok(Math.abs(t1 - t0) < 0.05, 'the run is frozen while the sheet is open');
  await shot('sheet');
  // change things: take the last party pet out, put a resting one in; level the played pet up five
  r = await page.evaluate(S => { const P = window.__pp; const party = P.partyPets(); const out = party[party.length - 1].uid, inn = S.others.find(u => !party.some(p => p.uid === u)); document.querySelector(`[data-go="team-pick"][data-uid="${out}"]`).click(); document.querySelector(`[data-go="team-party"][data-uid="${out}"]`).click(); document.querySelector(`[data-go="team-pick"][data-uid="${inn}"]`).click(); document.querySelector(`[data-go="team-party"][data-uid="${inn}"]`).click(); P.st.dlv = (P.st.dlv || 1) + 5; return { out, inn, party: P.partyPets().map(p => p.uid) }; }, S);
  ok(!r.party.includes(r.out) && r.party.includes(r.inn), 'in the sheet: one pet taken out of the party, a resting one put in');
  // close the sheet: the run carries on with the new party and the new level
  r = await page.evaluate(async ch => { document.querySelector('[data-sheet-close]').click(); await new Promise(r => setTimeout(r, 300)); const D = window.__pp.arc.game._dbg; const names = D.party.map(m => m.p.uid); return { paused: window.__pp.arc.paused, names, hasIn: names.includes(ch.inn), hasOut: names.includes(ch.out), hp: D.me.hp, max: D.ST.hp, body: document.body.classList.contains('run-team') }; }, r);
  console.log('  after', JSON.stringify(r)); ok(!r.paused && r.hasIn && !r.hasOut && !r.body, 'closed: the run carries on, its party rebuilt with the change');
  ok(Math.abs(r.hp / r.max - 0.5) < 0.03, `the played pet keeps its share of health with its new maximum (${r.hp}/${r.max})`);
  const t2 = await page.evaluate(() => window.__pp.arc.game._dbg.g.t); await page.waitForTimeout(600); const t3 = await page.evaluate(() => window.__pp.arc.game._dbg.g.t); ok(t3 - t2 > 0.3, 'the run is moving again');
  // the newcomer can be switched in and fights
  r = await page.evaluate(async uid => { const D = window.__pp.arc.game._dbg; await new Promise(r => setTimeout(r, 1500)); const i = D.party.findIndex(m => m.p.uid === uid); const okSw = D.helpers && D.helpers.switchTo ? D.helpers.switchTo(i) : null; return { i, okSw, sprites: !!D.party[i].sprites }; }, r.names.find(u => !S.party.includes(u)) || r.names[1]);
  ok(r.i >= 0 && r.sprites, 'the newcomer is in the party strip with its pictures');
  // and in a rift too: the button is there and works
  await page.evaluate(() => { const P = window.__pp; P.closeArcade(true); P.st.energy = 100; P.st.dun.best = Math.max(P.st.dun.best || 0, 10); P.openMap(); P.dun.setMapTab('rift', true); P.startRift('belfry', 0); });
  await page.waitForFunction(() => window.__pp.arc.state === 'play' || window.__pp.arc.state === 'ready', null, { timeout: 30000 }); await page.evaluate(() => { if (window.__pp.arc.state === 'ready') window.__pp.beginPlay(); });
  await page.waitForFunction(() => window.__pp.arc.game && window.__pp.arc.game._dbg && window.__pp.arc.game._dbg.g.intro <= 0, null, { timeout: 30000 });
  r = await page.evaluate(async () => { window.__pp.openRunTeam(); const a = { open: !document.getElementById('sheetWrap').hidden, paused: window.__pp.arc.paused }; document.querySelector('[data-sheet-close]').click(); await new Promise(r => setTimeout(r, 300)); a.after = window.__pp.arc.paused; return a; });
  ok(r.open && r.paused && !r.after, 'in a rift dungeon the Team sheet opens and the run carries on after');
  console.log('errors', errors.length, JSON.stringify(errors.slice(0, 3))); ok(errors.length === 0, 'no page errors');
  console.log(fails ? `${fails} FAILED` : 'all passed'); await browser.close(); process.exit(fails ? 1 : 0); })();
