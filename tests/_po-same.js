// v434 PO: the same-page A/B for Rift 03, as tests/_pf-same.js did for the Belfry. One page, one game state; the v434 PO changes
// switched off (window.__PO_OFF = 1: exactly v433's painter boxes, GLM canvas sizing, Thul-Ammon's arm rebuild and dune view)
// and on. (1) The same frame (the clock, the dice and Date.now held) drawn with them off, on, and off again (the control: what
// drawing twice changes by itself), compared pixel by pixel and saved side by side (off | on | difference x16). (2) The cost:
// frames alternating off / on in the same page (the machine's load falls on both alike), medians, with the counters.
// usage: HTML=test-po.html STAGE=0 node tests/_po-same.js   env: ULT (none | sunflare,armageddon,titan,worldshaking,deadscream),
//        AT (seconds into each cast, comma list), N (timed frames per side, 8), CROWD=1, OUTDIR (shots/v434-PO), TAG (file prefix)
process.env.RIFT = 'dunes';
const { open } = require('./_pf-lib');
const fs = require('fs'), path = require('path');
const EL = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' };
(async () => {
  const T = await open({ html: process.env.HTML || 'test-po.html', rift: 'dunes' }); const { page, errors, start, frames } = T;
  const STAGE = +(process.env.STAGE || 0), ULTS = (process.env.ULT || 'none').split(','), ATS = (process.env.AT || '').split(',').map(Number), N = +(process.env.N || 8), boss = [3, 7, 11].includes(STAGE), TAG = process.env.TAG || ('s' + STAGE);
  const OUT = path.resolve(__dirname, '..', process.env.OUTDIR || 'shots/v434-PO'); fs.mkdirSync(OUT, { recursive: true });
  await start(STAGE);
  await page.evaluate(([crowd, boss]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; for (let k = 0; k < 90; k++) G.update(1 / 60);
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);
    if (crowd) { const TR = window.DUNE_TRAPS, Fs = TR ? TR.fields() : [], L = Fs.length ? Fs[Fs.length - 1].traps : []; let best = null; for (const tp of L) { const n = L.filter(q => Math.hypot(q.x - tp.x, q.y - tp.y) < 6).length; if (!best || n > best.n) best = { tp, n }; }
      if (best) { const tp = best.tp; for (const [dx, dy] of [[0, 1.8], [1.6, 0.6], [-1.6, 0.6], [0, -1.8]]) if (W(tp.x + dx, tp.y + dy)) { me.x = tp.x + dx; me.y = tp.y + dy; break; } }
      D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still).slice(0, 16).forEach((m, i) => { const b = i / 16 * 6.283, r = 2.2 + (i % 3) * 1.1; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 3 + Math.sin(b) * r * 0.8, hp: 1e9, maxhp: 1e9, aggro: true }); }); }
    if (boss) { const b = D.mons.find(m => m.boss && !m.dead) || (D.M && D.M.bossAt); if (b) { me.x = b.x; me.y = b.y + 6; } }
    D.g.intro = 0; D.banners.length = 0; for (let k = 0; k < (boss ? 900 : 120); k++) { me.hp = D.ST.hp; G.update(1 / 60); } }, [!!process.env.CROWD, boss]);
  await frames(20, { prof: false });   // (the ground's chunks and the pictures painted)
  const same = async name => {
    const r = await page.evaluate(async () => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, c = A.ctx || document.getElementById('arcCanvas').getContext('2d'), cv = c.canvas;
      const pn = performance.now.bind(performance), mr = Math.random, dn = Date.now, T0 = pn(), D0 = dn(); D.g.negT = 0; D.g.negF = 0; if (D.cam) D.cam.sm = 0;
      const draw = off => { window.__PO_OFF = off; performance.now = () => T0; Date.now = () => D0; let s = 777; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; try { c.save(); G.draw(c); c.restore(); } finally { performance.now = pn; Math.random = mr; Date.now = dn; } return c.getImageData(0, 0, cv.width, cv.height); };
      const a = draw(1), b = draw(0), a0 = draw(1); window.__PO_OFF = 0; let n2 = 0, n8 = 0, mx = 0, sum = 0, c8 = 0, cmx = 0; const d = new Uint8ClampedArray(a.data.length);
      for (let i = 0; i < a.data.length; i += 4) { let m = 0; for (let k = 0; k < 3; k++) m = Math.max(m, Math.abs(a0.data[i + k] - a.data[i + k])); if (m > 8) c8++; if (m > cmx) cmx = m; }
      for (let i = 0; i < a.data.length; i += 4) { let m = 0; for (let k = 0; k < 3; k++) { const v = Math.abs(a.data[i + k] - b.data[i + k]); if (v > m) m = v; } sum += m; if (m > 2) n2++; if (m > 8) n8++; if (m > mx) mx = m; const e = Math.min(255, m * 16); d[i] = e; d[i + 1] = e; d[i + 2] = e; d[i + 3] = 255; }
      const sheet = document.createElement('canvas'), w = cv.width, h = cv.height; sheet.width = w * 3 + 16; sheet.height = h; const x = sheet.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, sheet.width, h);
      x.putImageData(a, 0, 0); x.putImageData(b, w + 8, 0); x.putImageData(new ImageData(d, w, h), w * 2 + 16, 0);
      return { px: a.data.length / 4, n2, n8, max: mx, ctrl8: c8, ctrlMax: cmx, mean: +(sum / (a.data.length / 4)).toFixed(4), png: sheet.toDataURL('image/png') }; });
    fs.writeFileSync(path.join(OUT, `same-${name}.png`), Buffer.from(r.png.split(',')[1], 'base64')); delete r.png; return r; };
  const ab = async () => { const on = [], off = [];
    await page.evaluate(() => { window.__POS = () => { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F ? [F.stats.copyPx || 0, F.stats.resz || 0] : [0, 0]; }; });
    for (let k = 0; k < N; k++) for (const o of k % 2 ? [0, 1] : [1, 0]) { await page.evaluate(o => { window.__PO_OFF = o; window.__pos0 = window.__POS(); }, o); const r = (await frames(1, { prof: false })).rows[0]; const s = await page.evaluate(() => { const q = window.__POS(); return [q[0] - window.__pos0[0], q[1] - window.__pos0[1]]; }); r.copyPx = s[0]; r.fgResz = s[1]; (o ? off : on).push(r); }
    await page.evaluate(() => { window.__PO_OFF = 0; });
    const med = (L, k) => { const v = L.map(r => r[k]).sort((a, b) => a - b); return +v[v.length >> 1].toFixed(2); }, mean = (L, k) => +(L.reduce((a, r) => a + (r[k] || 0), 0) / L.length).toFixed(2);
    const S = L => ({ tot: med(L, 'tot'), draw: med(L, 'draw'), upd: med(L, 'upd'), fgMs: med(L, 'fgMs'), diGLms: med(L, 'diGLms'), glmMs: med(L, 'glmMs'), glm: mean(L, 'glmN'), resize: mean(L, 'cvResize'), glmResize: mean(L, 'cvResizeGLM'), layers: mean(L, 'fgLayers'), fgResz: mean(L, 'fgResz'), copyMpx: +(mean(L, 'copyPx') / 1e6).toFixed(2), fill: +(mean(L, 'fgFill') / 1e6).toFixed(3), fillV: +(mean(L, 'fgFillV') / 1e6).toFixed(3), compMpx: +(mean(L, 'diGLA') / 1e6).toFixed(2), comp: mean(L, 'fgComp'), flushes: mean(L, 'fgFlush'), quads: mean(L, 'fgQuads'), diMpx: +(mean(L, 'diA') / 1e6).toFixed(2), heapKB: +(mean(L, 'heap') / 1e3).toFixed(0), grad: mean(L, 'grad'), cvNew: mean(L, 'cvNew') });
    return { v433: S(off), v434: S(on) }; };
  const res = {};
  res.base = { same: await same(`${TAG}-base`), ab: await ab() }; console.log('base', JSON.stringify(res.base));
  for (let i = 0; i < ULTS.length; i++) { const u = ULTS[i]; if (u === 'none') continue;
    const at = ATS[i] || { sunflare: 2.6, armageddon: 1.6, titan: 2.2, worldshaking: 1.2, deadscream: 2.0 }[u];
    await page.evaluate(([u, el, at]) => { const P = window.__pp, G = P.arc.game, D = G._dbg; D.me.mp = 999; D.g.cdU = 0; D.g.intro = 0; const RU = D.RULES; if (RU && RU.blocks && !RU.__po) { const b0 = RU.blocks; RU.blocks = k => k === 'noult' ? false : b0.call(RU, k); RU.__po = 1; } D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[el]['ey_' + u], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); D.useUlt(); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; if (!f) throw new Error('the Ultimate did not fire: ' + u); let k = 0; while (f && f.t < at && k++ < 900) { D.me.hp = D.ST.hp; G.update(1 / 60); } }, [u, EL[u], at]);
    res[u] = { same: await same(`${TAG}-${u}`), ab: await ab() }; console.log(u, JSON.stringify(res[u]));
    await page.evaluate(() => { const G = window.__pp.arc.game, D = G._dbg; for (let k = 0; k < 60 * 14; k++) { D.me.hp = D.ST.hp; G.update(1 / 60); if (!D.ELEM || !D.ELEM.fx.length) break; } if (D.helpers) D.helpers.length = 0; });
  }
  fs.writeFileSync(path.join(OUT, `same-${TAG}.json`), JSON.stringify(res, null, 1));
  console.log('page errors', errors.length, errors.slice(0, 4)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
