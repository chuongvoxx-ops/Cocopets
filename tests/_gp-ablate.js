// v453 GP (from v434 PO's _po-ablate.js): what each piece of a Garden frame costs, by leaving it out: frames alternate (piece out /
// everything in) in one page, so the machine's load falls on both alike; the median difference is the piece's cost. Test-only
// switches (the game's own flags, or a piece replaced by nothing in the page for the test).
// usage: HTML=test-gp.html STAGE=3 node tests/_gp-ablate.js   env: N (6 pairs), PIECES (all), CROWD=1, DPR (3), GQ (balanced), OFF=1
process.env.RIFT = process.env.RIFT || 'garden';
const { open } = require('./_pf-lib');
// (each: [leave it out, put it back]; the Garden's light passes reached through the stage's everyStage object, RIFT's gpp)
const L = `window.__pp.arc.game._dbg.RIFT`;
const PIECES = {
  backdrop: ['window.__pp.arc.game._dbg.SKIP.backdrop = true', 'window.__pp.arc.game._dbg.SKIP.backdrop = false'],
  chunks: ['window.__pp.arc.game._dbg.SKIP.chunks = true', 'window.__pp.arc.game._dbg.SKIP.chunks = false'],
  overlay: ['window.__pp.arc.game._dbg.SKIP.overlay = true', 'window.__pp.arc.game._dbg.SKIP.overlay = false'],
  lightGround: ['window.__GPA_LG = 1', 'window.__GPA_LG = 0'],
  lightOver: ['window.__GPA_LO = 1', 'window.__GPA_LO = 0'],
  traps: ['window.__GT_ABL = 1', 'window.__GT_ABL = 0'],
  allGL: ['window.__NG_GL = 0; window.__GG_GL = 0', 'window.__NG_GL = 1; delete window.__GG_GL'],
};
(async () => {
  const T = await open({ html: process.env.HTML || 'test-gp.html', dpr: +(process.env.DPR || 3), rift: process.env.RIFT, flags: { __ORB_GL: 1, __GB_GL: 1, __GB_GLHQ: 1 } }); const { page, errors, start, frames } = T;
  await page.evaluate(([gq, off]) => { window.__pp.st.gq = gq; if (off) window.__GP_OFF = 1; }, [process.env.GQ || 'balanced', process.env.OFF === '1']);
  const STAGE = +(process.env.STAGE || 0), N = +(process.env.N || 6), boss = process.env.RIFT === 'garden' ? [2, 5, 8].includes(STAGE) : STAGE === 7;
  await start(STAGE);
  const info = await page.evaluate(([crowd, boss]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; for (let k = 0; k < 90; k++) G.update(1 / 60);
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);
    if (crowd) { const TR = window.GARDEN_TRAPS, Fs = TR ? TR.fields().filter(f => f.live) : [], L = Fs.length ? Fs[Fs.length - 1].traps : []; let best = null; for (const tp of L) { const n = L.filter(q => Math.hypot(q.x - tp.x, q.y - tp.y) < 6).length; if (!best || n > best.n) best = { tp, n }; }
      if (best) { const tp = best.tp; for (const [dx, dy] of [[0, 1.8], [1.6, 0.6], [-1.6, 0.6], [0, -1.8]]) if (W(tp.x + dx, tp.y + dy)) { me.x = tp.x + dx; me.y = tp.y + dy; break; } }
      D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still).slice(0, 16).forEach((m, i) => { const b = i / 16 * 6.283, r = 2.2 + (i % 3) * 1.1; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 3 + Math.sin(b) * r * 0.8, hp: 1e9, maxhp: 1e9, aggro: true }); }); }
    if (boss) { const b = D.mons.find(m => m.boss && !m.dead) || (D.M && D.M.bossAt); if (b) { me.x = b.x; me.y = b.y + 6; if (D.wakeBoss && !D.FD) try { D.wakeBoss(); } catch (e) {} } }
    D.g.intro = 0; D.g.bossIntro = 0; D.banners.length = 0; for (let k = 0; k < (boss ? 900 : 120); k++) { me.hp = D.ST.hp; G.update(1 / 60); }
    // (the switches: the Garden's light passes, its traps, props, monsters and door left out for a frame)
    const R = D.RIFT, wrap = (o, k, flag) => { if (!o || !o[k] || o[k].__gpa) return; const f = o[k]; o[k] = function () { if (window[flag]) return; return f.apply(this, arguments); }; o[k].__gpa = 1; };
    // (the everyStage object: found by its gpp, wherever the rift keeps it)
    let es = null; try { es = (R.amb && R.amb.gpp ? R.amb : null) || (R.self && R.self.amb && R.self.amb.gpp ? R.self.amb : null); if (!es) for (const k of Object.keys(R)) { const v = R[k]; if (v && typeof v === 'object' && v.gpp) es = v; } } catch (e) {}
    const lt = es && es.gpp; if (lt) { wrap(lt, 'drawGround', '__GPA_LG'); wrap(lt, 'drawOver', '__GPA_LO'); }
    if (window.GARDEN_TRAPS) for (const F of window.GARDEN_TRAPS.fields()) { wrap(F, 'drawGround', '__GT_ABL'); wrap(F, 'drawOver', '__GT_ABL'); }
    return { skip: !!D.SKIP, lights: !!lt, riftKeys: R ? Object.keys(R).slice(0, 30) : null, seenA: window.GARDEN_PROPS && window.GARDEN_PROPS.stats.seenA }; }, [!!process.env.CROWD, boss]);
  console.log(JSON.stringify(info));
  await frames(40, { prof: false });
  const med = v => { v = v.slice().sort((a, b) => a - b); return v[v.length >> 1]; };
  const list = (process.env.PIECES || Object.keys(PIECES).join(',')).split(',');
  console.log(`stage ${STAGE}: median frame ms, everything in vs the piece left out (${N} pairs, alternating)`);
  for (const k of list) { const [on, off] = PIECES[k]; const a = [], b = [];
    for (let i = 0; i < N; i++) for (const out of i % 2 ? [0, 1] : [1, 0]) { await page.evaluate(s => (0, eval)(s), out ? on : off); const r = (await frames(1, { prof: false, dt: 0.0001 })).rows[0]; (out ? b : a).push(r.tot); await page.evaluate(s => (0, eval)(s), off); }
    console.log(`  ${k.padEnd(12)} ${med(a).toFixed(0).padStart(5)} -> ${med(b).toFixed(0).padStart(5)}   costs ${(med(a) - med(b)).toFixed(0).padStart(5)} ms (${((med(a) - med(b)) / med(a) * 100).toFixed(0)}%)`); }
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})().catch(e => { console.error(e); process.exit(2); });
