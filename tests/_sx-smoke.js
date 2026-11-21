// v445 SB: smoke: the gate to Asmodeus, the intro, every power forced once (the pet held still 5 tiles south), the expose, the
// debt's seal, The Seventh Sin, the fall, no page errors. usage: HTML=<test page> node tests/_sx-smoke.js [gl]
const L = require('./_sx-lib');
(async () => {
  const T = await L.open({ gl: process.argv[2] === 'gl', god: false });
  try {
    const t0 = Date.now();
    console.log('gate ->', JSON.stringify(await T.start()), ((Date.now() - t0) / 1000).toFixed(0) + 's');
    console.log('intro ->', await T.fight());
    const r = await T.ev(`const out = {}, m = S.m; me.hp = D.ST.hp; SB.test.hold(true);
      out.hp = m.hp; out.bar = S.barHP; out.mode = S.mode; out.boss = g.boss === m; out.petHp = D.ST.hp; out.at = [+m.x.toFixed(2), +m.y.toFixed(2)]; out.AR = [SB.test.AR.cx, SB.test.AR.cy, SB.test.AR.rx, SB.test.AR.ry];
      for (const [k, ph] of [['perd', 1], ['rupt', 1], ['lab', 2], ['molt', 2], ['perd', 3], ['rupt', 3], ['lash', 1], ['expose', 1], ['roar', 2]]) { S.phase = ph; m.x = S.home.x; m.y = S.home.y; hold(m.x, m.y + (k === 'lash' ? 2.6 : 5)); const h0 = g.dmgTaken, d0 = S.stat.stacks; const A = SB.test.force(k); const dur = k === 'molt' ? 10 : k === 'lab' ? 12 : 9;
        step(dur, () => { hold(me.x, me.y); me.hp = D.ST.hp; me.inv = 0; }); out[k + ph] = { took: Math.round(g.dmgTaken - h0), stacks: S.stat.stacks - d0, acts: S.acts.length, parts: S.parts.length, web: !!S.web }; SB.test.cleanse(); }
      S.phase = 3; SB.test.addDebt(7); out.seal = !!S.seal; const h1 = g.dmgTaken; step(4, () => { me.hp = D.ST.hp; me.inv = 0; hold(me.x, me.y); }); out.sealHit = Math.round(g.dmgTaken - h1); out.debtAfter = S.debt;
      const h0 = g.dmgTaken; SB.test.force('sin'); out.refs = S.sin.refs.length; const q = S.sin.refs[0]; step(12, (t) => { if (t > 9.5) hold(q.x, q.y); else hold(me.x + 0.12 * Math.sin(t * 3), me.y); me.inv = 0; if (me.hp < 50) me.hp = D.ST.hp; }); out.sin = Math.round(g.dmgTaken - h0); out.mode2 = SB.test.S && SB.test.S.mode;
      out.stat = JSON.parse(JSON.stringify(SB.test.S ? SB.test.S.stat : {})); step(5); out.mode3 = SB.test.S && SB.test.S.mode; out.won = g.won; out.monsLeft = D.mons.filter(q => !q.dead && q.fobj).length;
      return out;`);
    console.log(JSON.stringify(r));
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } catch (e) { console.log('ERR', String(e && e.stack || e).slice(0, 800)); console.log('errors', JSON.stringify(T.errors.slice(0, 5))); }
  finally { await T.browser.close(); }
})();
