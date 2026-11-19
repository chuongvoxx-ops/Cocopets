// v420 CB: one quick still (GPU on) to look at the boss
const L = require('./_cb-lib');
(async () => {
  const T = await L.open({ gl: true, dpr: +(process.env.DPR || 1), plain: !!process.env.PLAIN }); T.page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 300)); });
  try {
    await T.start(); const t0 = Date.now();
    await T.ev(`step(3.0); return 1;`); await T.shot('v420-CB', 'probe-intro'); console.log('shot1', Date.now() - t0);
    await T.fight(); await T.ev(`hold(S.m.x + 1, S.m.y + 5); step(1.0, () => { hold(S.m.x + 1, S.m.y + 5); }); CB.test.force('rev'); step(0.9, () => { hold(S.m.x + 1, S.m.y + 5); }); return 1;`);
    await T.shot('v420-CB', 'probe-rev'); console.log('shot2', Date.now() - t0);
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } finally { await T.browser.close(); }
})();
