// v420 GC: the old Oracle Shell (a build of git HEAD) for the before / after sheet: the shell, the clam open, the win.
// HTML=<path to the old build> DPR=1|3 node tests/_gc-before.js   -> shots/v420-GC/before-*.png
const { open } = require('./_gc-lib');
const DPR = +(process.env.DPR || 1), tag = DPR === 1 ? 'dpr1' : 'dpr' + DPR;
(async () => { const T = await open({ dpr: DPR }); const { M, run, goTo } = T; await T.start(); await run(4.5);
  const clam = await M(() => { const o = window.__pp.arc.game._dbg.RIFT.self.mod.clam; return { x: o.x, y: o.y }; });
  await goTo(clam.x, clam.y + 3.6); await run(0.6); await T.shot('v420-GC', 'before-chamber-' + tag);
  await goTo(clam.x, clam.y + 1.2); await M(async ([x, y]) => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; const t0 = performance.now(); while (performance.now() - t0 < 30000 && !(m.R.open && m.R.clamT >= 1 && m.R.choices.length)) { await new Promise(r => requestAnimationFrame(r)); D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; } }, [clam.x, clam.y + 1.2]); await run(0.3); await M(() => { const e = document.querySelector('.rift-riddle'); if (e) e.style.display = 'none'; }); await T.shot('v420-GC', 'before-clam-open-' + tag);
  await M(async () => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; for (let k = 0; k < 3; k++) { const Q = m.riddles[m.R.order[m.R.idx]]; m.answer(m.R.choices.indexOf(Q.a)); await new Promise(r => setTimeout(r, 900)); } });
  await run(1.2); await T.shot('v420-GC', 'before-win-' + tag);
  console.log('errors', T.errors.length); await T.browser.close(); })();
