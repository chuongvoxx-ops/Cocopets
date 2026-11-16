// The Drowned Belfry (v391 B1, rebuilt; v392 B1: the Drowned Lower Church first): the chart of Gaia and the Rifts tab, the seven-stage list, then the Oracle Shell (the
// Cancer gate, open once the Belfry is sealed). The stages themselves: tests/_bel-b1-smoke.js (and the boss / hall workers'
// own tests). usage: node tests/rift-belfry.js   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 12, seals: ['belfry'] }); const { page, errors, shot, start, run, useObj, state } = T;
  // the chart and the tab
  let r = await page.evaluate(() => { const P = window.__pp; P.openMap(); const out = { rifts: document.querySelectorAll('.wm-rift').length, gates: document.querySelectorAll('.wm-gate').length, great: !!document.querySelector('.wm-great'), extras: document.querySelectorAll('.wm-extra').length, chips: document.querySelectorAll('.wt-chip').length }; document.querySelector('.wm-rift[data-id="belfry"]').click(); out.card = document.getElementById('mapCard').textContent.slice(0, 80); out.pair = !!document.querySelector('.wm-gate.pair[data-id="belfry"]'); document.querySelector('[data-wfilter="gate"]').click(); out.filter = document.getElementById('worldView').dataset.filter; P.dun.setMapTab('rift', true); out.cards = document.querySelectorAll('.rf-card:not(.rf-tower)').length; out.towers = document.querySelectorAll('.rf-card.rf-tower').length; out.note = (P.riftState().seals.belfry = 0, document.querySelector('[data-rift="sel"][data-id="belfry"]').click(), document.getElementById('riftInner').textContent.includes('Seven stages: the Drowned Lower Church')); P.riftState().seals.belfry = 1; return out; });
  console.log('  map', JSON.stringify(r));
  ok(r.rifts === 13 && r.gates === 12 && r.great && r.extras >= 12 && r.chips === 4, 'the chart of Gaia: thirteen rift landmarks (Rift 0 too), twelve gates, the Great Rift, the places on the roads, the filters');
  ok(/Drowned Belfry/.test(r.card) && r.pair && r.filter === 'gate' && r.cards === 14 && r.towers === 12 && r.note, 'tapping a rift opens its card and marks its gate; the filters; the Rifts tab lists the 14 rifts with 12 Tower blocks between them and the Belfry\'s seven stages');
  await shot('chart');
  const stages = await page.evaluate(() => window.__pp.RIFT_BY_ID.belfry.stages.map(s => (s.boss || s.name)).join(','));
  ok(stages === 'The Drowned Lower Church,The Hall of Three Tides,belkharrox,The Clapper Counterweights,belnhalu,The Rising Tide Walk,beluldroth', 'seven stages (v392): the Drowned Lower Church, the Hall of Three Tides, Kharrox, the Clapper Counterweights, Nhalu, the Rising Tide Walk, Uldroth (' + stages + ')');
  // the Oracle Shell: three riddles in a shuffled order, five shuffled answers each; a wrong answer starts all three again
  await start('belfry', 'gate'); await run(2);
  r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; return { hint: D.RIFT.hintObj() && D.RIFT.hintObj().kind, open: mod.R.open, n: mod.riddles.length }; });
  ok(r.hint === 'oracle' && !r.open && r.n === 3, 'the gate: the arrow points to the great clam, three riddles');
  await useObj('oracle', 0, 0.1); await page.evaluate(async () => { const G = window.__pp.arc.game._dbg, t0 = G.g.t; while (G.g.t - t0 < 1.3) await new Promise(r => requestAnimationFrame(r)); }); r = await page.evaluate(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { open: mod.R.open, q: document.querySelector('#riftRiddle .rr-q').textContent, ans: [...document.querySelectorAll('#riftRiddle .rr-ans')].map(b => b.textContent.slice(1)) }; });
  console.log('  riddle', JSON.stringify(r)); ok(r.open && r.ans.length === 5, 'at the clam the riddle card opens: a riddle and five answers');
  await shot('oracle');
  // the order and the answers shuffle: deal many times, the first riddle and the place of its answer both vary
  r = await page.evaluate(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod, R = mod.R, firsts = new Set(), spots = new Set(), orders = new Set(); for (let i = 0; i < 60; i++) { mod.deal(); firsts.add(R.order[0]); orders.add(R.order.join()); spots.add(R.choices.indexOf(mod.riddles[R.order[0]].a)); } return { firsts: firsts.size, orders: orders.size, spots: spots.size }; });
  console.log('  shuffle', JSON.stringify(r)); ok(r.firsts === 3 && r.orders >= 4 && r.spots >= 4, 'the riddles come in different orders and the right answer moves about');
  const pickAns = right => page.evaluate(async right => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod, R = mod.R, Q = mod.riddles[R.order[R.idx]]; const i = right ? R.choices.indexOf(Q.a) : R.choices.findIndex(a => a !== Q.a); document.querySelector(`#riftRiddle [data-ans="${i}"]`).click(); await new Promise(r => setTimeout(r, 1000)); return { idx: R.idx, solved: R.solved, done: window.__pp.arc.game._dbg.RIFT.done }; }, right);
  r = await pickAns(true); ok(r.solved === 1 && r.idx === 1, 'a right answer: on to the second riddle');
  r = await pickAns(false); ok(r.solved === 0 && r.idx === 0, 'a wrong answer: the clam snaps shut and all three begin again');
  await pickAns(true); await pickAns(true); r = await pickAns(true); await run(0.5); r = await state(); ok(r.done, 'three right in a row: Cancer wakes');
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 15000 }); await page.waitForTimeout(800);
  r = await page.evaluate(() => ({ gate: !!window.__pp.riftState().gates.belfry, anima: window.__pp.st.animas.have.cancer || 0 })); ok(r.gate && r.anima >= 1, 'the Cancer Anima is unlocked');
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
