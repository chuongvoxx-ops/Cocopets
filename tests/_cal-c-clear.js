// Rift 0 core: a level-1 starter bot clears each fight dungeon (stages 0, 3, 6): it walks to the nearest monster with the
// stick and taps it, never dodging (a careless player). The game is stepped by hand at 1/60 s, so the times are game
// time. Reports the clear time, the damage taken (god mode off; the bot is healed only when near death, and counted),
// the levels gained. HTML=test-calC.html node tests/_cal-c-clear.js [0 3 6]
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 1 }); const { page, start, errors } = T;
  const only = process.argv.slice(2).map(Number), stages = only.length ? only : [0, 3, 6];
  for (const st of stages) {
    await page.evaluate(() => { const P = window.__pp; P.st.dun.god = false; P.st.dlv = 1; P.st.dxp = 0; });
    await start('caldera', st);
    const r = await page.evaluate(async () => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, g = D.g, me = D.me, run = G.update, W = A.W, H = A.H; G.update = () => {};
      const tapW = (wx, wy) => { const X = Math.max(10, Math.min(W - 10, (wx - me.x) * 40 * g.zoom + W / 2)), Y = Math.max(10, Math.min(H - 10, (wy - me.y) * 40 * g.zoom + H / 2)); G.down(X, Y, 77); G.up(X, Y, 77); };
      const steer = (tx, ty, keep) => { const d = Math.hypot(tx - me.x, ty - me.y), sv = d > keep ? D.steerTo(tx, ty) : null, hx = 72, hy = H - 100; if (!sv) { if (D.stick.id === 88) G.up(hx, hy, 88); return; } if (D.stick.id !== 88) G.down(hx, hy, 88); G.move(hx + sv[0] * 44, hy + sv[1] * 44, 88); };
      const left = () => D.mons.filter(m => !m.dead && !m.boss).length + ((g.reserve && g.reserve.length) || 0);
      const lv0 = P.st.dlv, t0 = g.t, n0 = left(); let lastTap = -9, rescues = 0, minHp = 1, dmg = 0, prevHp = me.hp;
      for (let i = 0; i < 60 * 600 && left() > 0; i++) {
        let best = null, bd = 1e9; for (const m of D.mons) { if (m.dead || m.boss) continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; best = m; } }
        if (best) { steer(best.x, best.y, 2.0); if (g.t - lastTap > 0.12 && bd < 6) { lastTap = g.t; tapW(best.x, best.y); } }
        run(1 / 60);
        if (me.hp < prevHp) dmg += prevHp - me.hp; prevHp = me.hp; minHp = Math.min(minHp, me.hp / D.ST.hp);
        if (me.hp < D.ST.hp * 0.15 && !me.dead) { rescues++; me.hp = D.ST.hp; prevHp = me.hp; }
        if (me.dead) { me.dead = false; me.hp = D.ST.hp; rescues++; prevHp = me.hp; }
        if (i % 600 === 0) await new Promise(r => setTimeout(r, 0)); }
      G.update = run;
      return { secs: Math.round(g.t - t0), monsters: n0, left: left(), dmgTaken: Math.round(dmg), petMaxHp: Math.round(D.ST.hp), rescues, levels: P.st.dlv - lv0, lvl: P.st.dlv, kills: g.kills }; });
    console.log('dungeon', st, JSON.stringify(r));
  }
  console.log('errors', errors.length, errors.slice(0, 4)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})();
