// v420 CB: the fight drawn without the GPU painter (its cel model, the 2D tells) and with lowFx: frames drawn through every power, no errors
const L = require('./_cb-lib');
(async () => { for (const o of [{ gl: false, tag: 'nogpu' }, { gl: true, lowFx: true, tag: 'lowfx' }]) {
  const T = await L.open(Object.assign({ dpr: 1 }, o)); let warn = 0; T.page.on('console', m => { if (/Abaddon boss draw/.test(m.text())) warn++; });
  try { await T.start(); await T.fight(); await T.ev(`CB.test.hold(true); return 1;`);
    for (const k of ['rev', 'tide', 'car', 'ecl', 't9']) { await T.ev(`const m = S.m; hold(m.x + 1, m.y + 5); CB.test.force(arg); step(k2(arg)); me.hp = D.ST.hp; return 1; function k2(a) { return a === 't9' ? 2.5 : 0.8; }`, k); await T.shot('v420-CB', `cb-${o.tag}-${k}`); await T.ev(`step(8, () => { me.hp = D.ST.hp; }); return 1;`); }
    console.log(o.tag, 'draw warnings', warn, 'errors', JSON.stringify(T.errors.slice(0, 3)));
  } catch (e) { console.log(o.tag, 'ERR', String(e).slice(0, 300)); } await T.browser.close(); } })();
