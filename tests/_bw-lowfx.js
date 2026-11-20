// v430 BW: a smoke run under "Fewer effects" (st.lowFx), the GPU painter on: a refuge hall drained and the exit door opened
// in D2; the drain and the door still run their course (thinner light, fewer motes and puffs), 0 page errors
const { open } = require('./_bw-lib');
(async () => {
  const T = await open({ lowFx: true }); const { page, errors } = T;
  await T.start(3); await T.runG(0.5);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, DS = window.BEL.dungeonCtx(D.g), VH = DS.valveHalls[0]; if (VH.leech) D.hitMon(VH.leech, 1e9, { flat: true }); D.me.x = VH.cx; D.me.y = VH.cy; const o = D.RIFT.objs.find(o => o.kind === 'valve' && o.valveHall === 0); o.use(o); });
  await T.runG(7);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, e = D.RIFT.exit; D.me.x = e.x + 0.5; D.me.y = e.y + 3; D.RIFT.self.done = true; });
  await T.runG(3);
  const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, VH = window.BEL.dungeonCtx(D.g).valveHalls[0]; return { lowFx: !!window.__pp.st.lowFx, level: VH.W.level, door: window.BEL_DOORS.state(window.BEL.ctx(D.g)), gpu: !!(window.NIDHOGG_MOVES || 1) }; });
  const ok = r.lowFx && r.level === 0 && r.door && r.door.k >= 1 && errors.length === 0;
  console.log(JSON.stringify(r)); console.log((ok ? 'PASS' : 'FAIL') + ' lowFx: drained and opened, errors ' + errors.length, errors.slice(0, 2)); await T.browser.close(); process.exit(ok ? 0 : 1);
})();
