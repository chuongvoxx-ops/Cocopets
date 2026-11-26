// v453 GP: how much of the screen the Garden's void really shows (the seen part: void, wall and bridge tiles and the map's edge, one
// tile more), against the box the engine paints it in (the box round every gap on the screen), over N spots a stage: the pet put
// on random walkable tiles, the camera settled, one frame drawn. usage: HTML=test-gpa.html node tests/_gp-seen.js  env: STAGES (0,1,3,4,6,7) N (30)
process.env.RIFT = 'garden';
const { open } = require('./_pf-lib');
(async () => {
  const T = await open({ html: process.env.HTML || 'test-gpa.html', dpr: +(process.env.DPR || 3), rift: 'garden' }); const { page, errors, start } = T;
  await page.evaluate(() => { window.__pp.st.gq = 'balanced'; });
  const out = {};
  for (const s of (process.env.STAGES || '0,1,3,4,6,7').split(',').map(Number)) {
    await start(s);
    const r = await page.evaluate(N => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, me = D.me, c = A.ctx || document.getElementById('arcCanvas').getContext('2d'), GP = window.GARDEN_PROPS, M = D.M;
      let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; const res = [];
      for (let i = 0; i < N * 20 && res.length < N; i++) { const x = Math.floor(rnd() * M.MW) + 0.5, y = Math.floor(rnd() * M.MH) + 0.5; if (!D.walkAt(Math.floor(x), Math.floor(y))) continue;
        me.x = x; me.y = y; for (let k = 0; k < 90; k++) { me.hp = D.ST.hp; G.update(1 / 60); } GP.stats.seenA = null; c.save(); G.draw(c); c.restore(); res.push(GP.stats.seenA); }
      const v = res.filter(a => a != null), m = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
      return { spots: res.length, withVoid: v.length, meanSeen: m && +m.toFixed(3), under85: v.filter(a => a <= 0.85).length, dist: v.slice().sort((a, b) => a - b).map(a => +a.toFixed(2)) }; }, +(process.env.N || 30));
    console.log('stage', s, JSON.stringify(r)); out[s] = r;
  }
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})().catch(e => { console.error(e); process.exit(2); });
