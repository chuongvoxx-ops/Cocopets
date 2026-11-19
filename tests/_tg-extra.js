// v426 TG: the gate without the GPU painter (window.__TG_GL = 0: the pictures and floors stand, the stars and lines drawn in 2D as
// before) and with lowFx (the puzzle's and the door's light kept), mid-trace: shots nogl-mid-trace / lowfx-mid-trace, no page errors.
// HTML=test-tg.html DPR=1|3 node tests/_tg-extra.js
const { open } = require('./_tg-lib');
const DPR = +(process.env.DPR || 1), tag = DPR === 1 ? 'dpr1' : 'dpr' + DPR; let fails = 0;
(async () => { for (const kind of ['nogl', 'lowfx']) { const T = await open({ dpr: DPR, lowFx: kind === 'lowfx' }); const { M } = T;
  await T.page.evaluate(k => { window.__TG_NOBOSS = 1; if (k === 'nogl') window.__TG_GL = 0; }, kind); await T.start();
  await M(async () => { const m = window.__pp.arc.game._dbg.RIFT.self.mod; const t0 = performance.now(); while (performance.now() - t0 < 120000 && m.R.mode !== 'play') await new Promise(r => requestAnimationFrame(r)); for (const i of [0, 1, 2, 3, 0]) m.visit(i); });
  await T.goTo(15.2, 28.6); await T.run(1.0); await T.shot('v426-TG', `${kind}-mid-trace-${tag}`);
  const r = await M(() => ({ cached: window.TAURUS_PROPS.stats.cached, used: window.__pp.arc.game._dbg.RIFT.self.mod.R.used.size }));
  const good = r.cached >= 10 && r.used === 4 && !T.errors.length; if (!good) fails++; console.log((good ? 'ok   ' : 'FAIL ') + kind + ': the vault stands, the puzzle traces, no page errors ' + JSON.stringify(r) + ' ' + T.errors.slice(0, 2).join(' | '));
  await T.browser.close(); }
  console.log(fails ? fails + ' FAILED' : 'ALL OK'); process.exit(fails ? 1 : 0); })();
