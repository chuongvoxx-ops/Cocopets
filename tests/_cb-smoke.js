// v420 CB: smoke: the fight begins, the intro plays, every power fires, phases, the win; no page errors
const L = require('./_cb-lib');
(async () => {
  const T = await L.open({ gl: false, god: false });
  try {
    await T.start();
    console.log('intro ->', await T.fight());
    const r = await T.ev(`const out = {}, m = S.m; me.hp = D.ST.hp;
      out.hp = m.hp; out.bar = S.barHP; out.mode = S.mode; out.boss = g.boss === m; out.dmg = m.dmg;
      // each power forced in turn; the pet stood still 5 tiles south of it
      for (const k of ['rev', 'tide', 'car', 'ecl', 'sw']) { const h0 = g.dmgTaken; CB.test.force(k); if (k === 'sw') hold(m.x, m.y + 2.6); step(k === 'ecl' ? 4.6 : k === 'car' ? 2 : 4, () => { if (k !== 'sw' && k !== 'tide') hold(m.x, m.y + 4.5); me.hp = D.ST.hp; }); out[k] = Math.round(g.dmgTaken - h0); }
      out.stat = JSON.parse(JSON.stringify(S.stat));
      return out;`);
    console.log(JSON.stringify(r));
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } finally { await T.browser.close(); }
})();
