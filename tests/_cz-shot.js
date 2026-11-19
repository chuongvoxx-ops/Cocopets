// v422 CZ/HD: a still of the Abaddon fight with the thinner header and the closer camera (HTML=..., OUT=name)
const L = require('./_cb-lib');
(async () => {
  const T = await L.open({ gl: true, dpr: 1, real: true });
  try { await T.start(); await T.ev(`step(1); return 1;`); await T.fight();
    await T.ev(`hold(S.m.x + 1, S.m.y + 5); step(1.5, () => { hold(S.m.x + 1, S.m.y + 5); }); return 1;`);
    await T.shot('v422-CZ', process.env.OUT || 'fight'); console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } finally { await T.browser.close(); }
})();
