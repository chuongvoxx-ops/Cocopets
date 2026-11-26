// v459 GP2: how much of each GPU painter layer's box its quads really occupy (measured before changing the painter). For every FGFX
// pass of a frame (by its caller), each layer (solid, light): the box laid today (v430 PF's boxOf: the quads' bounds + 3 px) and the
// boxes of the occupied parts (a grid of CELL layer px: cells touching a triangle's bounds + 3 px; 8-connected groups; their bounds,
// merged while any two overlap). usage: HTML=<abs or repo path> STAGE=3 CROWD=1 node tests/_gp2-occ.js   env: RIFT (garden) N (3) CELL (16) ULT
process.env.RIFT = process.env.RIFT || 'garden';
const { open } = require('./_pf-lib');
const EL = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' };
(async () => {
  const T = await open({ html: process.env.HTML, dpr: +(process.env.DPR || 3), rift: process.env.RIFT, flags: { __ORB_GL: 1, __GB_GL: 1, __GB_GLHQ: 1 } }); const { page, errors, start, frames } = T;
  await page.evaluate(gq => { window.__pp.st.gq = gq; }, process.env.GQ || 'balanced');
  const STAGE = +(process.env.STAGE || 3), boss = process.env.RIFT === 'garden' ? [2, 5, 8].includes(STAGE) : STAGE === 7; await start(STAGE);
  await page.evaluate(([crowd, boss]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; for (let k = 0; k < 90; k++) G.update(1 / 60);
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);
    if (crowd) { const TR = window.GARDEN_TRAPS, Fs = TR && D.F.rift && D.F.rift.id === 'garden' ? TR.fields().filter(f => f.live) : [], L = Fs.length ? Fs[Fs.length - 1].traps : []; let best = null; for (const tp of L) { const n = L.filter(q => Math.hypot(q.x - tp.x, q.y - tp.y) < 6).length; if (!best || n > best.n) best = { tp, n }; }
      if (best) { const tp = best.tp; for (const [dx, dy] of [[0, 1.8], [1.6, 0.6], [-1.6, 0.6], [0, -1.8]]) if (W(tp.x + dx, tp.y + dy)) { me.x = tp.x + dx; me.y = tp.y + dy; break; } }
      D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still).slice(0, 16).forEach((m, i) => { const b = i / 16 * 6.283, r = 2.2 + (i % 3) * 1.1; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 3 + Math.sin(b) * r * 0.8, hp: 1e9, maxhp: 1e9, aggro: true }); }); }
    if (boss) { const b = D.mons.find(m => m.boss && !m.dead) || (D.M && D.M.bossAt); if (b) { me.x = b.x; me.y = b.y + 6; if (D.wakeBoss && !D.FD) try { D.wakeBoss(); } catch (e) {} } }
    D.g.intro = 0; D.g.bossIntro = 0; D.banners.length = 0; for (let k = 0; k < (boss ? 900 : 120); k++) { me.hp = D.ST.hp; G.update(1 / 60); } }, [!!process.env.CROWD, boss]);
  await frames(16, { prof: false });
  if (process.env.ULT) { const u = process.env.ULT; await page.evaluate(([u, el]) => { const P = window.__pp, G = P.arc.game, D = G._dbg; D.me.mp = 999; D.g.cdU = 0; D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[el]['ey_' + u], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); D.useUlt(); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; let k = 0; while (f && f.t < 2 && k++ < 900) { D.me.hp = D.ST.hp; G.update(1 / 60); } }, [u, EL[u]]); await frames(2, { prof: false }); }
  const res = await page.evaluate(([N, CELL]) => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, c = A.ctx || document.getElementById('arcCanvas').getContext('2d'), F = self.NIDHOGG_MOVES.FGFX;
    const b0 = F.begin, f0 = F.flush; let Qc = null; const out = {};
    const who = () => { const L = (new Error().stack || '').split('\n').slice(3, 5).map(l => (l.match(/at ([^ ]+) /) || [])[1] || '?'); return L.join(' < '); };
    function occ(Ar, n, W, H) { if (!n) return null; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let o = 0; o < n * 12; o += 12) { const x = Ar[o], y = Ar[o + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      x0 = Math.max(0, Math.floor(x0) - 3); y0 = Math.max(0, Math.floor(y0) - 3); x1 = Math.min(W, Math.ceil(x1) + 3); y1 = Math.min(H, Math.ceil(y1) + 3); if (!(x1 > x0 && y1 > y0)) return null;
      const cw = Math.ceil((x1 - x0) / CELL), ch = Math.ceil((y1 - y0) / CELL), M = new Uint8Array(cw * ch);
      for (let o = 0; o < n * 12; o += 36) { let a0 = 1e9, b0 = 1e9, a1 = -1e9, b1 = -1e9; for (let v = 0; v < 3; v++) { const x = Ar[o + v * 12], y = Ar[o + v * 12 + 1]; if (x < a0) a0 = x; if (x > a1) a1 = x; if (y < b0) b0 = y; if (y > b1) b1 = y; }
        const i0 = Math.max(0, Math.floor((a0 - 3 - x0) / CELL)), i1 = Math.min(cw - 1, Math.floor((a1 + 3 - x0) / CELL)), j0 = Math.max(0, Math.floor((b0 - 3 - y0) / CELL)), j1 = Math.min(ch - 1, Math.floor((b1 + 3 - y0) / CELL));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) M[j * cw + i] = 1; }
      const lab = new Int32Array(cw * ch).fill(-1), B = []; for (let k = 0; k < cw * ch; k++) { if (!M[k] || lab[k] >= 0) continue; const st = [k]; lab[k] = B.length; const b = [1e9, 1e9, -1, -1];
        while (st.length) { const q = st.pop(), i = q % cw, j = (q / cw) | 0; if (i < b[0]) b[0] = i; if (j < b[1]) b[1] = j; if (i > b[2]) b[2] = i; if (j > b[3]) b[3] = j; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= cw || jj >= ch) continue; const r = jj * cw + ii; if (M[r] && lab[r] < 0) { lab[r] = lab[k]; st.push(r); } } } B.push(b); }
      let merged = true; while (merged) { merged = false; for (let i = 0; i < B.length && !merged; i++) for (let j = i + 1; j < B.length && !merged; j++) { const p = B[i], q = B[j]; if (p[0] <= q[2] && q[0] <= p[2] && p[1] <= q[3] && q[1] <= p[3]) { B[i] = [Math.min(p[0], q[0]), Math.min(p[1], q[1]), Math.max(p[2], q[2]), Math.max(p[3], q[3])]; B.splice(j, 1); merged = true; } } }
      let a = 0; for (const b of B) a += (Math.min(x1, x0 + (b[2] + 1) * CELL) - (x0 + b[0] * CELL)) * (Math.min(y1, y0 + (b[3] + 1) * CELL) - (y0 + b[1] * CELL));
      let cells = 0; for (let k = 0; k < cw * ch; k++) cells += M[k]; return { box: (x1 - x0) * (y1 - y0), parts: a, n: B.length, cells: cells * CELL * CELL, layer: W * H }; }
    F.begin = function () { Qc = b0.apply(this, arguments); return Qc; };
    F.flush = function () { if (Qc) { const k = who(), e = out[k] || (out[k] = { n: 0, l: [0, 0, 0, 0, 0], s: [0, 0, 0, 0, 0] }); e.n++; for (const [key, Ar, nn] of [['l', Qc.lit, Qc.nl], ['s', Qc.smk, Qc.ns]]) { const r = occ(Ar, nn, Qc.W, Qc.Hh); if (r) { e[key][0] += r.box; e[key][1] += r.parts; e[key][2] += r.n; e[key][3] += r.cells; e[key][4] = r.layer; } } } return f0.apply(this, arguments); };
    for (let i = 0; i < N; i++) { D.me.hp = D.ST.hp; G.update(1 / 60); c.save(); G.draw(c); c.restore(); if (F.frameEnd) F.frameEnd(); }
    F.begin = b0; F.flush = f0;
    return Object.entries(out).map(([k, e]) => [k, e.n / N, ...e.l.map((v, i) => i === 4 ? v : v / N), ...e.s.map((v, i) => i === 4 ? v : v / N)]); }, [+(process.env.N || 3), +(process.env.CELL || 16)]);
  let tb = 0, tp = 0; console.log(`stage ${STAGE} ${process.env.CROWD ? 'crowd' : ''} ${process.env.ULT || ''}: per frame, layer px (light | solid): box laid today -> the occupied parts' boxes (how many), the occupied cells`);
  for (const [k, n, lb, lp, ln, lc, L, sb, sp, sn, sc] of res.sort((a, b) => b[2] - a[2])) { tb += lb + sb; tp += lp + sp; console.log(`  ${n.toFixed(1)}x ${k.slice(0, 70).padEnd(70)} light ${(lb / 1e3).toFixed(0).padStart(4)}k -> ${(lp / 1e3).toFixed(0).padStart(4)}k (${ln.toFixed(1)}) cells ${(lc / 1e3).toFixed(0)}k | solid ${(sb / 1e3).toFixed(0)}k -> ${(sp / 1e3).toFixed(0)}k (${sn.toFixed(1)})   [layer ${(L / 1e3).toFixed(0)}k]`); }
  console.log(`  total laid ${(tb / 1e3).toFixed(0)}k layer px -> ${(tp / 1e3).toFixed(0)}k (${(100 * (1 - tp / Math.max(1, tb))).toFixed(0)}% less)`);
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})().catch(e => { console.error(e); process.exit(2); });
