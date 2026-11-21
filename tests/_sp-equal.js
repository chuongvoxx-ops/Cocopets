// v439 SP: the visual quality never touches the fight. In one page, mid-fight (the Garden, 20 of the brood round the pet, the pet's skill
// and Ultimate in play), the same frame drawn at High, Balanced, Performance, paced Performance and High again, each from the same point
// of the game's dice: the dice (Math.random) are drawn the same number of times while drawing at every level (so no level shifts the
// fight's random stream), and the game's state (every monster's position and HP, the pet's HP, MP, position, cooldowns, the clock, the
// effects, zones and shots in play) is the same before and after each draw. The update never reads the quality at all (only arc.dpr's
// canvas, FGFX's layer scale and the models' pass resolution do, all in drawing). usage: HTML=<test html> node tests/_sp-equal.js
process.env.RIFT = 'garden';
const { open } = require('./_pf-lib');
(async () => {
  const T = await open({ html: process.env.HTML, dpr: 3, rift: 'garden' }); const { page, start, errors } = T;
  await page.evaluate(() => { window.__pp.st.dlv = 33; });
  await start(3);
  const r = await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g, c = document.getElementById('arcCanvas').getContext('2d');
    for (let k = 0; k < 90; k++) G.update(1 / 60);
    D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still).slice(0, 20).forEach((m, i) => { const b = i / 20 * 6.283, r = 2.0 + (i % 4) * 1.0; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 1.5 + Math.sin(b) * r * 0.75, aggro: true }); });
    g.intro = 0; g.cdS = 0; me.mp = 999; D.useStrong('strong'); for (let k = 0; k < 40; k++) G.update(1 / 60); g.cdU = 0; me.mp = 999; D.useUlt(); for (let k = 0; k < 60; k++) G.update(1 / 60);
    const state = () => JSON.stringify({ m: D.mons.map(m => [m.dead ? 1 : 0, +m.x.toFixed(4), +m.y.toFixed(4), Math.round(m.hp)]), me: [Math.round(me.hp), Math.round(me.mp), +me.x.toFixed(4), +me.y.toFixed(4)], cd: [g.cdS, g.cdU, g.cdN].map(v => +(v || 0).toFixed(4)), t: +g.t.toFixed(4), fx: D.ELEM ? D.ELEM.fx.length : 0, zones: D.zones.length, shots: D.shots.length });
    c.save(); G.draw(c); c.restore();   // (one draw first: what a first draw makes once, lazily, is not the quality's doing)
    const mr = Math.random, rows = []; let n = 0, seed = 4242; const dice = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (const [gq, L] of [['high', 0], ['balanced', 1], ['perf', 2], ['auto', 3], ['high', 0]]) { P.arc.open = true; P.st.gq = gq; window.GQ.A = L; P.arc.open = false;   /* (open for the moment: GQ re-lays the canvas only in an open arcade) */
      const s0 = seed, st0 = state(); n = 0; Math.random = () => { n++; return dice(); }; try { c.save(); G.draw(c); c.restore(); } finally { Math.random = mr; } seed = s0;
      rows.push({ level: window.GQ.name(), canvas: c.canvas.width + 'x' + c.canvas.height, diceInDraw: n, stateUnchanged: state() === st0 }); }
    P.arc.open = true; P.st.gq = 'auto'; window.GQ.A = 0; P.arc.open = false;
    return { rows, sameDice: rows.every(x => x.diceInDraw === rows[0].diceInDraw), stateKept: rows.every(x => x.stateUnchanged) }; });
  console.log(JSON.stringify(r.rows));
  console.log('the dice drawn the same at every level:', r.sameDice, '| the game state untouched by drawing at any level:', r.stateKept, '| page errors', errors.length);
  await T.browser.close(); process.exit(r.sameDice && r.stateKept && !errors.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
