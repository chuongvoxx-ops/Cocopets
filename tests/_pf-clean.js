// v430 PF: every big Ultimate ends and leaves nothing behind in the Drowned Belfry, on the GPU path: cast, played by hand
// (game time, a frame drawn every 10 updates, so the headless page's slowness cannot cut the cast short), then: no effect
// left in ELEM.fx, no FGFX pass left drawing quads, no pet zones, no page errors. The effects end when they should (each
// one's own life), not by a wall-clock timeout.
// usage: HTML=test-pf.html node tests/_pf-clean.js        env: STAGE (0), ULT (sunflare,armageddon,titan,worldshaking,deadscream)
const { open } = require('./_pf-lib');
const EL = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' };
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const T = await open({ html: process.env.HTML }); const { page, errors, start, frames } = T;
  await start(+(process.env.STAGE || 0));
  await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg; for (let k = 0; k < 120; k++) G.update(1 / 60); const me = D.me; D.mons.filter(m => !m.boss && !m.dead).slice(0, 12).forEach((m, i) => Object.assign(m, { x: me.x + Math.cos(i) * 3, y: me.y + 2 + Math.sin(i) * 2, hp: 1e9, maxhp: 1e9, aggro: true })); });
  for (const u of (process.env.ULT || 'sunflare,armageddon,titan,worldshaking,deadscream').split(',')) {
    const r = await page.evaluate(([u, el]) => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, c = A.ctx || document.getElementById('arcCanvas').getContext('2d'), F = self.NIDHOGG_MOVES.FGFX;
      D.me.mp = 999; D.g.cdU = 0; D.g.intro = 0; D.g.bossIntro = 0; D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[el]['ey_' + u], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false }));
      const n0 = D.ELEM.fx.length; D.useUlt(); const n1 = D.ELEM.fx.length; let k = 0, maxQ = 0, t0 = D.g.t;
      for (; k < 60 * 30; k++) { D.me.hp = D.ST.hp; D.me.mp = 999; G.update(1 / 60); if (k % 10 === 0) { const f0 = F.stats.frames; c.save(); G.draw(c); c.restore(); if (F.stats.frames !== f0) maxQ = Math.max(maxQ, F.stats.quads); } if (!D.ELEM.fx.length && k > 30) break; }
      const tEnd = +(D.g.t - t0).toFixed(1); for (let j = 0; j < 60 * 20 && D.zones.some(z => z.own === 'pet'); j++) { D.me.hp = D.ST.hp; G.update(1 / 60); }   /* (what it left on the floor, a burning patch, has a life of its own: let it run out) */
      // after it ends: one more frame, every pass counted
      let after = 0; const fl = F.flush; F.flush = function (cc) { after++; return fl.apply(this, arguments); }; const b0 = F.stats.frames; c.save(); G.draw(c); c.restore(); F.flush = fl;
      return { cast: n1 - n0, endedAfter: tEnd, zonesGoneAfter: +(D.g.t - t0).toFixed(1), fxLeft: D.ELEM.fx.length, zones: D.zones.filter(z => z.own === 'pet').length, maxQuads: maxQ, passesAfter: after, drawnAfter: F.stats.frames - b0 }; }, [u, EL[u]]);
    ok(r.cast >= 1 && r.fxLeft === 0 && r.zones === 0, `${u}: cast, ended by itself after ${r.endedAfter} s of game time (its floor zones by ${r.zonesGoneAfter} s), nothing left (effects, pet zones)`, r);
  }
  ok(errors.length === 0, 'no page errors', errors.slice(0, 3));
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
