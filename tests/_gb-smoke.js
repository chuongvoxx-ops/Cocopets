// v468 GB smoke: the gate reaches the boss, the intro plays, the fight runs ordinary attacks for a while, the pet's stats and
// the boss's numbers are printed. GL off (fast). HTML=test-gb.html node tests/_gb-smoke.js
const { open } = require('./_gb-lib');
(async () => {
  const H = await open({ lvl: +process.env.LVL || 40 }); let ok = true;
  try {
    const r = await H.start(); console.log('start', JSON.stringify(r));
    console.log('fight', await H.fight());
    const out = await H.ev(`const s = T.S, X = s.X, P0 = X.ST();
      const res = { mode: s.mode, phase: s.phase, hp: s.m.hp, petHp: P0.hp, petAtk: P0.atk, acts: {}, dmgIn: 0, haz: 0 };
      // the pet stands 6 tiles south of Raziel for 40 s, never dodging; count the attacks and the damage it takes (god off, health topped up)
      for (let i = 0; i < 40 * 30; i++) { const s2 = T.S; if (!s2 || s2.mode !== 'fight') break; if (me.hp < P0.hp * 0.5) me.hp = P0.hp; hold(s2.m.x, s2.m.y + 6); U.update(1 / 30); for (const A of s2.acts) if (A.t < 1 / 29) res.acts[A.kind] = (res.acts[A.kind] || 0) + 1; res.haz = Math.max(res.haz, s2.haz.length); }
      res.dmgIn = Math.round(T.S.stat.dmgIn); res.ordHits = T.S.stat.ordHits; res.fails = T.S.failN; res.mode2 = T.S.mode; return res;`);
    console.log('fight40', JSON.stringify(out));
    if (out.fails !== 0) { ok = false; console.log('FAIL: ordinary attacks broke a seal'); }
  } catch (e) { ok = false; console.log('ERR', e.message); }
  console.log('errors', JSON.stringify(H.errors.slice(0, 6)));
  await H.browser.close(); console.log(ok && !H.errors.length ? 'SMOKE OK' : 'SMOKE FAIL');
})();
