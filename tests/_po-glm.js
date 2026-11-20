// v434 PO: what a Rift 03 boss's GLM pass costs, piece by piece. The boss fight up (awake, a few seconds of its acts), then
// each GLM.render of a frame timed with the GL work finished (a 1-pixel read), with its size, items, triangles and the
// share of the box its model covers; and the same render replayed (same items, same uniforms) as variants: without the
// outline hulls, at half size (fragment-bound part), the opaque items drawn near to far.
// usage: HTML=test-po.html STAGE=11 node tests/_po-glm.js   env: N (3), DPR (2)
process.env.RIFT = 'dunes';
const { open } = require('./_pf-lib');
(async () => {
  const T = await open({ html: process.env.HTML || 'test-po.html', dpr: +(process.env.DPR || 2), rift: 'dunes' }); const { page, errors, start, frames } = T;
  await start(+(process.env.STAGE || 11));
  await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; const b = D.mons.find(m => m.boss && !m.dead) || (D.M && D.M.bossAt); if (b) { me.x = b.x; me.y = b.y + 6; } D.g.intro = 0; for (let k = 0; k < 900; k++) { me.hp = D.ST.hp; G.update(1 / 60); } });
  if (process.env.ULT) { const u = process.env.ULT, el = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' }[u]; await page.evaluate(([u, el, at]) => { const P = window.__pp, G = P.arc.game, D = G._dbg; D.me.mp = 999; D.g.cdU = 0; const bs = D.mons.find(m => m.boss && !m.dead); if (bs) { D.me.x = bs.x + 0.5; D.me.y = bs.y + 3.2; } D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[el]['ey_' + u], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); D.useUlt(); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; let k = 0; while (f && f.t < at && k++ < 900) { D.me.hp = D.ST.hp; G.update(1 / 60); } }, [u, el, +(process.env.AT || 1.6)]); }   // (v434 PO: an Ultimate cast first)
  await frames(6, { prof: false }); if (process.env.ITEMS) await page.evaluate(() => { window.__ITEMS = 1; });
  const r = await page.evaluate(N => {
    const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, c = A.ctx || document.getElementById('arcCanvas').getContext('2d'), GLM = P.FIEND_DEFS.calflan.__dbg.GLM;
    const R0 = GLM.render, gl = GLM.canvas.getContext('webgl2') || GLM.canvas.getContext('webgl'), fin = () => { const px = new Uint8Array(4); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
    const out = []; let cap = [];
    GLM.render = function (W, H, S, items) { const it2 = items.map(i => Object.assign({}, i)); fin(); const t = performance.now(); const cv = R0.apply(this, arguments); fin(); const ms = performance.now() - t;
      // (the share of the box the model covers: alpha read back)
      const px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); let cov = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 8) cov++;
      cap.push({ W, H, S: Object.assign({}, S), items: it2, ms, cov: cov / (W * H), tris: GLM.stats.tris, calls: GLM.stats.calls }); return cv; };
    for (let i = 0; i < N; i++) { D.me.hp = D.ST.hp; G.update(1 / 60); c.save(); G.draw(c); c.restore(); }
    GLM.render = R0;
    const T = (f, n) => { const v = []; for (let k = 0; k < n; k++) { fin(); const t = performance.now(); f(); fin(); v.push(performance.now() - t); } v.sort((a, b) => a - b); return +v[v.length >> 1].toFixed(1); };
    for (const q of cap.slice(-3)) { const res = { W: q.W, H: q.H, Mpx: +(q.W * q.H / 1e6).toFixed(2), cover: +q.cov.toFixed(2), items: q.items.length, opaque: q.items.filter(i => i.alpha > 0.995).length, tris: q.tris, calls: q.calls, ms: +q.ms.toFixed(1) };
      res.again = T(() => R0(q.W, q.H, q.S, q.items), 3);
      res.noOutline = T(() => R0(q.W, q.H, Object.assign({}, q.S, { outline: 0 }), q.items), 3);
      res.half = T(() => R0(Math.ceil(q.W / 2), Math.ceil(q.H / 2), Object.assign({}, q.S, { outline: q.S.outline / 2 }), q.items), 3);
      res.empty = T(() => R0(q.W, q.H, q.S, []), 3);
      res.halfItems = T(() => R0(q.W, q.H, q.S, q.items.slice(0, q.items.length >> 1)), 3);
      res.tiny = T(() => R0(8, 8, Object.assign({}, q.S, { outline: 0 }), q.items), 3);
      const near = q.items.slice().sort((a, b) => (a.alpha > 0.995 ? 0 : 1) - (b.alpha > 0.995 ? 0 : 1) || (a.alpha > 0.995 ? b.d - a.d : a.d - b.d));
      res.dDesc = T(() => R0(q.W, q.H, q.S, near), 3);
      const far = q.items.slice().sort((a, b) => (a.alpha > 0.995 ? 0 : 1) - (b.alpha > 0.995 ? 0 : 1) || (a.d - b.d));
      res.dAsc = T(() => R0(q.W, q.H, q.S, far), 3);
      res.low = T(() => R0(q.W, q.H, Object.assign({}, q.S, { low: 1 }), q.items), 3);
      if (window.__ITEMS) { const base = T(() => R0(q.W, q.H, q.S, []), 3); res.per = q.items.map((it, i) => { const ms = T(() => R0(q.W, q.H, q.S, [it]), 3) - base; const px = new Uint8Array(q.W * q.H * 4); gl.readPixels(0, 0, q.W, q.H, gl.RGBA, gl.UNSIGNED_BYTE, px); let cv = 0; for (let j = 3; j < px.length; j += 4) if (px[j] > 8) cv++; return [i, it.mesh && (it.mesh.name || it.mesh.id) || '?', it.mesh ? it.mesh.ntri : 0, +ms.toFixed(1), +(cv / 1e3).toFixed(0) + 'k px', it.cnt || 0]; }).sort((a, b) => b[3] - a[3]).slice(0, 14); }
      out.push(res); }
    return out; }, +(process.env.N || 3));
  for (const q of r) console.log(JSON.stringify(q));
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})().catch(e => { console.error(e); process.exit(2); });
