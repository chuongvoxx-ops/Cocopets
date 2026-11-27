// v468 GP: the Gemini gate (Rift 04's): CLASH OF THE TWINS replaced The Twin Reflection (the mirror boss is gone).
// A short smoke: the gate opens from the Rift UI, stage I starts (Lux awake, two Ice pillars), the test solve opens the gate,
// the pet walks in and the boss stage begins. The full trial: tests/_gp-flow.js; its drawing cost: tests/_gp-perf.js.
const { open } = require('./_gp-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({}); const { ev, errors } = T;
  try { await T.start();
    let r = await ev(`step(4); return { st: R.st, L: m.GU.L.st, up: m.PIL.filter(p => p.up).map(p => p.id).join(), old: !!(window.__pp.BOSSES.find(b => b.id === 'mirrorpet')) };`);
    ok(r.st === 's1' && r.up === 'I1,I2' && !r.old, 'Clash of the Twins begins (stage I), no mirror boss left ' + JSON.stringify(r));
    r = await ev(`m.solve(); step(16, () => heal()); const BA = GG.BA; for (let i = 0; i < 300 && S.phase !== 'boss' && S.phase !== 'won'; i++) { hold(BA.x, Math.max(BA.y + 6, 31 - i * 0.12)); heal(); U.update(1 / 30); } return { phase: S.phase };`);
    ok(r.phase === 'boss' || r.phase === 'won', 'the gate opens and the boss stage begins ' + JSON.stringify(r));
  } catch (e) { console.log('ERR', e.message); fails++; }
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  await T.browser.close(); console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
