// v453 GP: which pictures the Garden paints while a stage plays (they should all be painted on the loading screen): over F frames of a
// scenario, every BELPROPS software-shading surface made (the painting pass of GARDEN_PROPS / GARDEN_TRAPS / the doors) by its caller.
// usage: HTML=test-gpa.html STAGE=3 CROWD=1 node tests/_gp-paints.js   env: F (60), ULT
process.env.RIFT = 'garden';
const { open } = require('./_pf-lib');
const EL = { sunflare: 'light', armageddon: 'fire' };
(async () => {
  const T = await open({ html: process.env.HTML || 'test-gpa.html', dpr: +(process.env.DPR || 3), rift: 'garden', flags: { __ORB_GL: 1, __GB_GL: 1, __GB_GLHQ: 1 } }); const { page, errors, start, frames } = T;
  await page.evaluate(gq => { window.__pp.st.gq = gq; }, process.env.GQ || 'balanced');
  if (process.env.OFF === '1') await page.evaluate(() => { window.__GP_OFF = 1; });
  const STAGE = +(process.env.STAGE || 3);
  await start(STAGE);
  await page.evaluate(crowd => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; for (let k = 0; k < 90; k++) G.update(1 / 60);
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);
    if (crowd) { const TR = window.GARDEN_TRAPS, Fs = TR ? TR.fields().filter(f => f.live) : [], L = Fs.length ? Fs[Fs.length - 1].traps : []; let best = null; for (const tp of L) { const n = L.filter(q => Math.hypot(q.x - tp.x, q.y - tp.y) < 6).length; if (!best || n > best.n) best = { tp, n }; }
      if (best) { const tp = best.tp; for (const [dx, dy] of [[0, 1.8], [1.6, 0.6], [-1.6, 0.6], [0, -1.8]]) if (W(tp.x + dx, tp.y + dy)) { me.x = tp.x + dx; me.y = tp.y + dy; break; } }
      D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still).slice(0, 16).forEach((m, i) => { const b = i / 16 * 6.283, r = 2.2 + (i % 3) * 1.1; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 3 + Math.sin(b) * r * 0.8, hp: 1e9, maxhp: 1e9, aggro: true }); }); }
    D.g.intro = 0; D.banners.length = 0; for (let k = 0; k < 120; k++) { me.hp = D.ST.hp; G.update(1 / 60); }
    const K = window.BELPROPS.kit, s0 = K.surface; window.__GPW = {}; window.__GPN = 0;
    K.surface = function () { const st = (new Error().stack || '').split('\n').slice(2, 7).map(l => (l.match(/at ([^ ]+) /) || [])[1] || '?').join(' < '); window.__GPW[st] = (window.__GPW[st] || 0) + 1; window.__GPN++; return s0.apply(this, arguments); };
    const pd = P.DunWorld.propSprite; window.__GPD = 0; }, !!process.env.CROWD);
  await frames(10, { prof: false });
  await page.evaluate(() => { window.__GPW = {}; window.__GPN = 0; window.__GP0 = Object.assign({}, window.GARDEN_PROPS.stats); });
  const F = +(process.env.F || 60); const r = await frames(F, { prof: false });
  const res = await page.evaluate(() => { const s = window.GARDEN_PROPS.stats, s0 = window.__GP0; return { surfaces: window.__GPN, by: window.__GPW, painted: s.painted - s0.painted, paintMs: +(s.paintMs - s0.paintMs).toFixed(0), released: s.released - s0.released, misses: s.misses - s0.misses, cached: s.cached }; });
  const broke = await page.evaluate(() => window.__pp.arc.game._dbg.propList.filter(p => p.broken).length);
  console.log(`stage ${STAGE}: ${F} frames: ${JSON.stringify(res, null, 1)}\nprops broken by now: ${broke}; worst frame ${Math.max(...r.rows.map(q => q.tot)).toFixed(0)} ms, median ${r.rows.map(q => q.tot).sort((a, b) => a - b)[F >> 1].toFixed(0)}`);
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})().catch(e => { console.error(e); process.exit(2); });
