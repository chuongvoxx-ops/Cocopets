// v435 SB: smoke: the real gate to Samael, the intro, every power forced once (the pet held still 5 tiles south), a vent, the
// Cataclysm, the Wrath, no page errors. usage: HTML=test-sb.html node tests/_sb-smoke.js [gl]
const L = require('./_sb-lib');
(async () => {
  const T = await L.open({ gl: process.argv[2] === 'gl', god: false });
  try {
    const t0 = Date.now();
    console.log('gate ->', JSON.stringify(await T.start()), ((Date.now() - t0) / 1000).toFixed(0) + 's');
    console.log('intro ->', await T.fight());
    const r = await T.ev(`const out = {}, m = S.m; me.hp = D.ST.hp; SB.test.hold(true);
      out.hp = m.hp; out.bar = S.barHP; out.mode = S.mode; out.boss = g.boss === m; out.dmg = m.dmg; out.petHp = D.ST.hp; out.at = [+m.x.toFixed(2), +m.y.toFixed(2)];
      for (const k of ['charge', 'perd', 'over', 'impact', 'vent', 'roar']) { m.x = S.home.x; m.y = S.home.y; hold(m.x, m.y + 5); const h0 = g.dmgTaken; SB.test.force(k); const dur = k === 'over' ? 9 : 6;
        step(dur, () => { hold(m.x, m.y + 5); me.hp = D.ST.hp; me.inv = 0; }); out[k] = Math.round(g.dmgTaken - h0); out[k + 'Acts'] = S.acts.length; }
      out.ruin = S.ruin; SB.test.cataclysm(); out.cata = S.cata; step(1, () => { me.hp = D.ST.hp; });
      const h0 = g.dmgTaken; SB.test.force('wrath'); step(11, () => { hold(m.x + 3, m.y + 3); me.inv = 0; if (me.hp < 50) me.hp = D.ST.hp; }); out.wrath = Math.round(g.dmgTaken - h0); out.mode2 = S.mode;
      out.stat = JSON.parse(JSON.stringify(S.stat)); out.fx = S.inst ? S.inst.fx.length : -1;
      step(5); out.mode3 = SB.test.S && SB.test.S.mode; out.won = g.won;
      return out;`);
    console.log(JSON.stringify(r));
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } catch (e) { console.log('ERR', String(e && e.stack || e).slice(0, 800)); console.log('errors', JSON.stringify(T.errors.slice(0, 5))); }
  finally { await T.browser.close(); }
})();
