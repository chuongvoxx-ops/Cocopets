// v443 SB: the saw traps, loot boxes and spike plates (20n9f-trap-art.js) - shared test helpers (dev only).
// open({ html, dpr }) -> { page, errors, go(spec), focus(what, i), frames(n), copies(n), shot(file, clip), browser }
//   spec: 'rift:<id>:<stage>' or 'tower:<floor>[:seed]'; what: 'saw' | 'pot:<kind>' | 'haz:<family or kind>' | 'trap:<kind>'
//   focus puts the pet a little below the thing (the monsters frozen and sent far away, the fog cleared round it) and
//   returns its screen spot; copies(n) draws n frames and returns the WebGL -> 2D copies of each (as the PERF readout counts).
const { open: pfOpen } = require('./_pf-lib');
async function open(o) {
  o = o || {};
  const T = await pfOpen({ html: o.html || process.env.HTML, dpr: o.dpr || +(process.env.DPR || 2), rift: 'garden', flags: Object.assign({ __FXB: 0 }, o.flags || {}) });
  const { page, errors, frames } = T;
  const go = async spec => {
    const [k, a, b] = spec.split(':');
    await page.evaluate(([k, a, b]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; const w = document.getElementById('giftWrap'); if (w) w.hidden = true;
      Math.random = (q => () => { q = (q * 16807) % 2147483647; return (q - 1) / 2147483646; })(1234);   /* (the same floor on every build) */
      if (k === 'rift') { try { P.riftState().prog[a] = +b; } catch (e) {} P.openMap(); P.dun.setMapTab('rift', true); P.startRift(a, +b); }
      else { P.st.dun.best = Math.max(P.st.dun.best || 0, +a + 1); P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(+a, +(b || 7)); } }, [k, a, b]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1800000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; Math.random = (s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(4242); });
    return page.evaluate(() => { const D = window.__pp.arc.game._dbg, cnt = (L, f) => { const o = {}; for (const x of L || []) { const k = f(x); o[k] = (o[k] || 0) + 1; } return o; };
      return { name: D.F.name, biome: D.F.biome, traps: cnt(D.traps, t => t.kind), pots: cnt(D.pots, p => p.kind), haz: cnt(D.hazards, h => h.kind) }; });
  };
  const focus = (what, i, dy) => page.evaluate(([what, i, dy]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g;
    const [k, s] = what.split(':'); let L = [];
    if (k === 'saw' || k === 'trap') L = D.traps.filter(t => t.kind === (s || 'saw'));
    else if (k === 'pot') L = D.pots.filter(p => !p.broken && (!s || p.kind === s));
    else if (k === 'haz') L = D.hazards.filter(h => !h.area && (!s || h.kind === s || (h.fam || '') === s || (s === 'spikes' && /spikes|thorns/.test(h.kind))));
    const o = L[(i | 0) % Math.max(1, L.length)]; if (!o) return null;
    const cx = o.x0 != null ? (o.x0 + o.x1) / 2 : o.x, cy = o.y0 != null ? (o.y0 + o.y1) / 2 : o.y;
    for (const m of D.mons) if (!m.boss) { m.x = cx + 300; m.y = cy + 300; m.spd = 0; m.atkCd = 99; m.aggro = false; m.hp = m.maxhp = 1e9; }
    g.intro = 0; D.banners.length = 0; D.SKIP.fog = true; if (D.eshots) D.eshots.length = 0;
    /* the pet a little below and to the side, on floor it can stand on */
    let best = null; for (let r = 1.6; r < 5 && !best; r += 0.4) for (let a = 0; a < 6.283 && !best; a += 0.4) { const x = cx + Math.cos(a) * r, y = cy + (dy == null ? 1.2 : dy) + Math.sin(a) * r * 0.6; if (D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.4, 0)) best = { x, y }; }
    if (best) { me.x = best.x; me.y = best.y; }
    me.vx = me.vy = 0; for (let n = 0; n < 40; n++) { me.hp = D.ST.hp; G.update(1 / 60); me.x = best ? best.x : me.x; me.y = best ? best.y : me.y; }
    if (D.cam) { D.cam.x = cx; D.cam.y = cy + 0.4; }
    return { x: cx, y: cy, kind: o.kind, n: L.length }; }, [what, i, dy]);
  /* n frames: the copies each (diGLr, as the PERF line's "GL copies n/frame"), the painter's passes, the frame ms */
  const copies = async (n, hold) => { const r = await frames(n || 6, { prof: false, hold: hold || [] }); return r.rows.map(x => ({ copies: x.diGLr + x.glmR, fg: x.fgFlush, ms: +x.tot.toFixed(1) })); };
  const shot = async (file, clip) => { const buf = await page.screenshot(clip ? { clip } : {}); require('fs').writeFileSync(file, buf); };
  return Object.assign(T, { go, focus, copies, shot });
}
module.exports = { open };
