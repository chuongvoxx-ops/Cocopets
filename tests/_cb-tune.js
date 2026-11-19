// v420 CB: Abaddon measured against Uldroth (20t5), the same way for both: a level-30 bot pet held still at DIST tiles south of
// the boss (never dodging, never sheltering), a steady stream of raw hits into the boss (RAW every 0.25 s, D.hitMon, no crits),
// the game stepped at DT. Reports the time to kill and the damage taken per minute (ordinary blows, and the scripted shelter
// blows apart: Uldroth's flood, the Ninth Tide). usage: HTML=test-cb.html node tests/_cb-tune.js [dist] [raw] [dt]
const UL = require('./_bel-b5-lib'), CB = require('./_cb-lib');
const DIST = +(process.argv[2] || 4), RAW = +(process.argv[3] || 300), DT = 1 / (+(process.argv[4] || 30));
const RUN = `const raw = arg.raw, dist = arg.dist, dt = arg.dt; const out = { t: 0, hits: 0, ord: 0, shel: 0, nOrd: 0, nShel: 0, max: 0, blows: {} };
  let acc = 0, last = g.dmgTaken, lastShel = SHEL(); const bb = BOSS(); out.hp = bb.maxhp;
  while (out.t < 1500 && !bb.dead) { const H0 = g.dmgTaken; U.update(dt); out.t += dt; acc += dt;
    if (!me.dead) { me.hp = 1e6; hold(bb.x, bb.y + dist); }
    while (acc >= 0.25) { acc -= 0.25; if (!bb.dead && bb.act !== "enter") { D.hitMon(bb, raw, { noCrit: true, noText: true }); out.hits++; } }
    const d = g.dmgTaken - H0, sc = SHEL(); if (d > 0) { if (sc !== lastShel) { out.shel += d; out.nShel++; } else { out.ord += d; out.nOrd++; out.max = Math.max(out.max, d); const k = Math.round(d / 10) * 10; out.blows[k] = (out.blows[k] || 0) + 1; } } lastShel = sc; }
  out.dead = bb.dead; out.ordPerMin = out.ord / out.t * 60; out.meanBlow = out.ord / Math.max(1, out.nOrd); return out;`;
(async () => {
  const res = {};
  { const T = await UL.open({ gl: false, lvl: 30 }); try { await T.startUld(); await T.wake();
      res.uld = await T.ev(`const BOSS = () => D.g.boss, g = D.g, SHEL = () => (M && M.stat ? M.stat.floodHit : 0); ${RUN}`, { raw: RAW, dist: DIST, dt: DT });
      res.uldErr = T.errors.slice(0, 3); } finally { await T.browser.close(); } }
  { const T = await CB.open({ gl: false, lvl: 30 }); try { await T.start(); await T.fight();
      res.ab = await T.ev(`const BOSS = () => S.m, SHEL = () => S.stat.t9Hit; ${RUN.replace('const raw', 'const raw0 = 0; const raw')}`, { raw: RAW, dist: DIST, dt: DT });
      res.abStat = await T.ev(`return CB.test.S ? CB.test.S.stat : null;`); res.abErr = T.errors.slice(0, 3); } finally { await T.browser.close(); } }
  const f = o => o && `t ${o.t.toFixed(1)}s dead ${o.dead} hp ${o.hp} | ordinary ${Math.round(o.ord)} (${o.nOrd} blows, mean ${Math.round(o.meanBlow)}, max ${Math.round(o.max)}) ${Math.round(o.ordPerMin)}/min | shelter ${Math.round(o.shel)} (${o.nShel})`;
  console.log(`DIST ${DIST} RAW ${RAW} dt 1/${Math.round(1 / DT)}`);
  console.log('Uldroth ', f(res.uld)); console.log('Abaddon ', f(res.ab));
  if (res.uld && res.ab) console.log(`ratio: time to kill ${(res.ab.t / res.uld.t).toFixed(3)}  ordinary/min ${(res.ab.ordPerMin / res.uld.ordPerMin).toFixed(3)}  mean blow ${(res.ab.meanBlow / res.uld.meanBlow).toFixed(3)}`);
  console.log('blows U', JSON.stringify(res.uld && res.uld.blows), '\nblows A', JSON.stringify(res.ab && res.ab.blows));
  console.log('Abaddon stat', JSON.stringify(res.abStat)); console.log('errors', JSON.stringify([res.uldErr, res.abErr]));
})();
