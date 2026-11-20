// v434 PO: what each piece of a Rift 03 frame costs, by leaving it out: frames alternate (piece out / everything in) in one
// page, so the machine's load falls on both alike; the median difference is the piece's cost. Test-only switches (the
// game's own flags, or a piece replaced by nothing in the page for the test).
// usage: HTML=test-po.html STAGE=0 node tests/_po-ablate.js   env: N (6 pairs), PIECES (all), CROWD=1, WALK=1, ULT, AT, DPR (2)
process.env.RIFT = 'dunes';
const { open } = require('./_pf-lib');
const EL = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' };
const PIECES = {
  vista: ['window.__po_v = window.__po_v || window.DUNE_SKY.vista; /* (the far view, its 2D and GPU) */ window.__PO_ABL_VISTA = 1', 'window.__PO_ABL_VISTA = 0'],
  vistaGL: ['window.__DSKY_GL = 0', 'delete window.__DSKY_GL'],
  propsGL: ['window.__DPP_GL = 0', 'delete window.__DPP_GL'],
  trapsGL: ['window.__DT_GL = 0', 'delete window.__DT_GL'],
  bossFX: ['window.__DB_FX = 0', 'delete window.__DB_FX'],
  overlay: ['window.__pp.arc.game._dbg.SKIP.overlay = true', 'window.__pp.arc.game._dbg.SKIP.overlay = false'],
  backdrop: ['window.__pp.arc.game._dbg.SKIP.backdrop = true', 'window.__pp.arc.game._dbg.SKIP.backdrop = false'],
  chunks: ['window.__pp.arc.game._dbg.SKIP.chunks = true', 'window.__pp.arc.game._dbg.SKIP.chunks = false'],
  lens: ['window.__po_rp = window.__pp.retro.post; window.__pp.retro.post = () => {}', 'if (window.__po_rp) window.__pp.retro.post = window.__po_rp'],
  allGL: ['window.__NG_GL = 0', 'window.__NG_GL = 1'],
};
(async () => {
  const T = await open({ html: process.env.HTML || 'test-po.html', dpr: +(process.env.DPR || 2), rift: 'dunes' }); const { page, errors, start, frames } = T;
  const STAGE = +(process.env.STAGE || 0), N = +(process.env.N || 6), boss = [3, 7, 11].includes(STAGE);
  await start(STAGE);
  await page.evaluate(() => { const S = window.DUNE_SKY; if (S && !S.__poAbl) { const v = S.vista; S.vista = function () { if (window.__PO_ABL_VISTA) return; return v.apply(this, arguments); }; S.__poAbl = 1; } });
  const info = await page.evaluate(([crowd, boss]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; for (let k = 0; k < 90; k++) G.update(1 / 60);
    if (crowd) D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still).slice(0, 16).forEach((m, i) => { const b = i / 16 * 6.283, r = 2.2 + (i % 3) * 1.1; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 3 + Math.sin(b) * r * 0.8, hp: 1e9, maxhp: 1e9, aggro: true }); });
    if (boss) { const b = D.mons.find(m => m.boss && !m.dead) || (D.M && D.M.bossAt); if (b) { me.x = b.x; me.y = b.y + 6; } }
    D.g.intro = 0; D.banners.length = 0; for (let k = 0; k < (boss ? 900 : 120); k++) { me.hp = D.ST.hp; G.update(1 / 60); } return { skip: !!D.SKIP }; }, [!!process.env.CROWD, boss]);
  if (!info.skip) console.log('(no D.SKIP: the overlay / backdrop / chunks switches do nothing)');
  await frames(12, { prof: false });
  if (process.env.ULT) { const u = process.env.ULT; await page.evaluate(([u, el, at]) => { const P = window.__pp, G = P.arc.game, D = G._dbg; D.me.mp = 999; D.g.cdU = 0; D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[el]['ey_' + u], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); D.useUlt(); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; let k = 0; while (f && f.t < at && k++ < 900) { D.me.hp = D.ST.hp; G.update(1 / 60); } }, [u, EL[u], +(process.env.AT || 1.5)]); await frames(2, { prof: false }); }
  const med = v => { v = v.slice().sort((a, b) => a - b); return v[v.length >> 1]; };
  const list = (process.env.PIECES || Object.keys(PIECES).join(',')).split(',');
  console.log(`stage ${STAGE} ${process.env.ULT || ''}: median frame ms, everything in vs the piece left out (${N} pairs, alternating)`);
  for (const k of list) { const [on, off] = PIECES[k]; const a = [], b = [];
    for (let i = 0; i < N; i++) for (const out of i % 2 ? [0, 1] : [1, 0]) { await page.evaluate(s => (0, eval)(s), out ? on : off); const r = (await frames(1, { prof: false, dt: 0.0001 })).rows[0]; (out ? b : a).push(r.tot); await page.evaluate(s => (0, eval)(s), off); }
    console.log(`  ${k.padEnd(9)} ${med(a).toFixed(0).padStart(5)} -> ${med(b).toFixed(0).padStart(5)}   costs ${(med(a) - med(b)).toFixed(0).padStart(5)} ms (${((med(a) - med(b)) / med(a) * 100).toFixed(0)}%)`); }
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})().catch(e => { console.error(e); process.exit(2); });
