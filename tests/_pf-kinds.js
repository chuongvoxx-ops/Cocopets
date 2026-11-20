// v430 PF: what an ultimate's GPU passes cost, kind by kind. One frame of the game is drawn with every FGFX pass captured
// (its quads, as the painter batched them); each pass is then replayed alone onto a scratch canvas of the game's size
// (timed with a sync), and again without each kind in turn: the time a kind adds, its quads and the area its quads cover
// (GL layer px; its overdraw is area / layer area).
// usage: HTML=test-pf.html STAGE=0 ULT=sunflare AT=2.6 node tests/_pf-kinds.js     env REP (replays a timing, 3)
const { open } = require('./_pf-lib');
(async () => {
  const T = await open({ html: process.env.HTML }); const { page, errors, start, frames } = T;
  await start(+(process.env.STAGE || 0));
  await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg; for (let k = 0; k < 120; k++) G.update(1 / 60); const me = D.me; D.mons.filter(m => !m.boss && !m.dead).slice(0, 16).forEach((m, i) => Object.assign(m, { x: me.x + Math.cos(i) * 3, y: me.y + 2 + Math.sin(i) * 2, hp: 1e9, maxhp: 1e9, aggro: true })); });
  await frames(30, { prof: false });   // (the ground's chunks painted)
  const U = process.env.ULT || 'sunflare';
  if (U !== 'none') await page.evaluate(([u, at]) => { const P = window.__pp, D = P.arc.game._dbg; const el = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' }[u]; D.me.mp = 999; D.g.cdU = 0; D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[el]['ey_' + u], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); D.useUlt(); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; let k = 0; while (f.t < at && k++ < 900) { D.me.hp = D.ST.hp; P.arc.game.update(1 / 60); } }, [U, +(process.env.AT || 2.6)]);
  await frames(2, { prof: false });
  const r = await page.evaluate(rep => {
    const P = window.__pp, A = P.arc, G = A.game, c = A.ctx || document.getElementById('arcCanvas').getContext('2d'), F = self.NIDHOGG_MOVES.FGFX, caps = [];
    const b0 = F.begin, f0 = F.flush; let Q = null;
    F.begin = function () { Q = b0.apply(this, arguments); return Q; };
    F.flush = function (cc) { if (Q) caps.push({ lit: Q.lit.slice(0, Q.nl * 12), smk: Q.smk.slice(0, Q.ns * 12), wlit: Q.wlit.slice(0, Q.nwl * 12), wsmk: Q.wsmk.slice(0, Q.nws * 12), T: cc.getTransform(), pet: Q.pet.slice(), W: Q.W, H: Q.Hh, who: (new Error().stack.split('\n')[2] || '').trim().slice(3, 60) }); return f0.apply(this, arguments); };
    c.save(); G.draw(c); c.restore(); F.begin = b0; F.flush = f0;
    const sc = document.createElement('canvas'); sc.width = c.canvas.width; sc.height = c.canvas.height; const x = sc.getContext('2d');
    const area = A12 => { const o = {}; for (let q = 0; q < A12.length / 72; q++) { const p = q * 72, k = Math.floor(A12[p + 4] + 0.001), tr = b => Math.abs((A12[b + 12] - A12[b]) * (A12[b + 25] - A12[b + 1]) - (A12[b + 13] - A12[b + 1]) * (A12[b + 24] - A12[b])) / 2, s = tr(p) + tr(p + 36);   /* (two triangles: a quad, or a piece of a v430 PF shape) */ (o[k] = o[k] || { n: 0, a: 0 }).n++; o[k].a += s; } return o; };
    const play = (cp, drop) => { const flt = A12 => { if (drop == null) return A12; const out = []; for (let q = 0; q < A12.length / 72; q++) if (Math.floor(A12[q * 72 + 4] + 0.001) !== drop) for (let i = 0; i < 72; i++) out.push(A12[q * 72 + i]); return Float32Array.from(out); };
      const best = []; for (let k = 0; k < rep; k++) { x.setTransform(cp.T); const q = F.begin(x, null); q.pet[0] = cp.pet[0]; q.pet[1] = cp.pet[1]; q.pet[2] = cp.pet[2];
        for (const [ka, kn, src] of [['lit', 'nl', flt(cp.lit)], ['smk', 'ns', flt(cp.smk)], ['wlit', 'nwl', flt(cp.wlit)], ['wsmk', 'nws', flt(cp.wsmk)]]) { if (q[ka].length < src.length) q[ka] = new Float32Array(src.length * 2); q[ka].set(src); q[kn] = src.length / 12; }
        x.getImageData(0, 0, 1, 1); const t = performance.now(); F.flush(x); x.getImageData(0, 0, 1, 1); best.push(performance.now() - t); }
      best.sort((a, b) => a - b); return best[best.length >> 1]; };
    const out = caps.map(cp => { const la = area(cp.lit), sa = area(cp.smk), all = play(cp), kinds = {};
      for (const [k, v] of Object.entries(la)) kinds['L' + k] = { n: v.n, px: Math.round(v.a), ovr: +(v.a / (cp.W * cp.H)).toFixed(2), ms: +(all - play(cp, +k)).toFixed(1) };
      for (const [k, v] of Object.entries(sa)) kinds['S' + k] = { n: v.n, px: Math.round(v.a), ovr: +(v.a / (cp.W * cp.H)).toFixed(2), ms: la[k] ? null : +(all - play(cp, +k)).toFixed(1) };
      return { who: cp.who, W: cp.W, H: cp.H, ms: +all.toFixed(1), lit: cp.lit.length / 72, smk: cp.smk.length / 72, kinds }; });
    return out;
  }, +(process.env.REP || 3));
  console.log(`${U} at ${process.env.AT || 2.6} s, stage ${process.env.STAGE || 0}: ${r.length} passes`);
  for (const p of r) { console.log(`  pass ${p.who}  ${p.ms} ms  lit ${p.lit} smoke ${p.smk}  layer ${p.W}x${p.H}`);
    for (const [k, v] of Object.entries(p.kinds).sort((a, b) => (b[1].ms || 0) - (a[1].ms || 0))) console.log(`     ${k.padEnd(5)} quads ${String(v.n).padStart(4)}  area ${String(v.px).padStart(8)} px (x${v.ovr} of the layer)  +${v.ms} ms`); }
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})().catch(e => { console.error(e); process.exit(2); });
