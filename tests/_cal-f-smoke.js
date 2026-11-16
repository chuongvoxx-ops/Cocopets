// Fire Flan smoke: the caldera's Fire Flan stage starts (worker C's rift, or a test-only one), the fight wakes, GLM's
// shader compiles with the flan's materials (ids 80..84) and the model draws on the GPU, no page errors.
// HTML=test-calF.html node tests/_cal-f-smoke.js   (SHOTS=1 for pictures in shots/calF)
process.env.HTML = process.env.HTML || 'test-calF.html';
const L = require('./_cal-f-lib');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
(async () => {
  const T = await L.open({ shots: !!process.env.SHOTS, god: true });
  const { errors, shot, ev } = T;
  const idx = await T.startFlan(); ok(idx >= 0, 'the Fire Flan stage', idx);
  let r = await ev(`return { fiend: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, R: D.FD && D.FD.S.C.R, objs: D.RIFT.objs.map(o => o.kind).filter(k => /^cal/.test(k)) };`);
  ok(r.fiend === 'Fire Flan' && r.phases === 3 && r.objs.length === 6, 'a three-phase fiend fight, three crystals and three plates', r);
  await shot('smoke-0-start');
  ok(!!(await T.wake()), 'it wakes');
  r = await ev(`S(0.5, () => { me.hp = D.ST.hp; }); await frame(); await frame(); const DB = window.__pp.FIEND_DEFS.calflan.__dbg; return { hp: Math.round(b.maxhp), dmg: +b.dmg.toFixed(1), petHp: D.ST.hp, atk: D.ST.atk, glm: DB.GLM && DB.GLM.stats, model: DB.MODEL.stats };`);
  console.log('  ', JSON.stringify(r));
  ok(r.hp === DB_HP(r) && r.dmg === 24, 'its tuning: 9600 health in all, blows of 24', r);
  ok(r.glm && !r.glm.failed && r.model.gl && !r.model.err, 'GLM compiles and the model draws on the GPU', r.model);
  await shot('smoke-1-awake');
  const er = errors.filter(e => !/ERR_(TUNNEL|FILE_NOT|NAME)/.test(e)); console.log('errors:', er.slice(0, 8));
  ok(er.length === 0, 'no page errors', er.length);
  await T.browser.close(); process.exit(bad ? 1 : 0);
  function DB_HP() { return 9600; }
})().catch(e => { console.error(e); process.exit(1); });
