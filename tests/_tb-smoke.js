// v429 TB: smoke: the real gate to the boss, the intro, every power forced once (the pet held still 5 tiles south), Dominion, no page errors
// usage: HTML=test-tb.html node tests/_tb-smoke.js [gl]
const L = require('./_tb-lib');
(async () => {
  const T = await L.open({ gl: process.argv[2] === 'gl', god: false });
  try {
    console.log('gate ->', JSON.stringify(await T.start()));
    console.log('intro ->', await T.fight());
    const r = await T.ev(`const out = {}, m = S.m; me.hp = D.ST.hp; TB.test.hold(true);
      out.hp = m.hp; out.bar = S.barHP; out.mode = S.mode; out.boss = g.boss === m; out.dmg = m.dmg; out.petHp = D.ST.hp; out.at = [+m.x.toFixed(2), +m.y.toFixed(2)];
      for (const k of ['rush', 'crown', 'car', 'stamp', 'sw', 'dom']) { hold(m.x, m.y + 5); const h0 = g.dmgTaken; TB.test.force(k); const dur = k === 'dom' ? 10.5 : k === 'car' ? 8 : 5;
        step(dur, () => { if (k !== 'crown' && k !== 'sw') hold(m.x, m.y + 5); else if (k === 'sw') hold(m.x + 1, m.y + 2.6); me.hp = D.ST.hp; me.inv = 0; }); out[k] = Math.round(g.dmgTaken - h0); }
      out.stat = JSON.parse(JSON.stringify(S.stat)); out.fx = S.inst ? S.inst.fx.length : -1; out.mode2 = S.mode;
      return out;`);
    console.log(JSON.stringify(r));
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } catch (e) { console.log('ERR', String(e && e.stack || e).slice(0, 800)); console.log('errors', JSON.stringify(T.errors.slice(0, 5))); }
  finally { await T.browser.close(); }
})();
