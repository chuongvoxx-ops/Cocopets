// v440 SQ: the exact merge of the painter's consecutive passes (20k6h FGFX run / layRun), proved on one page: v439's behaviour
// (window.__SQ_OFF = 1) and v440's alternating frame by frame (F frames a side: WebGL -> 2D copies a frame, composite Mpx, this machine's
// frame ms), and the same frame (clock, dice, Date.now held) drawn off / on / off (the control) compared pixel by pixel and saved
// side by side (off | on | diff x16, and a crop round the effect: off | on | diff x16).
// Scenarios (SCN, comma separated): base, ult:<sunflare|armageddon|deadscream|titan|worldshaking>[@t], anima:<aries|scorpio|taurus|cancer>[@t]
//   (the Anima summoned, then its departure ultimate played t s in), wind (five wind moves stacked).
// usage: HTML=<test html> node tests/_sq-merge.js   env: STAGE (3), RIFT (garden), N (20 of the brood), F (4), OUTDIR (shots/v440-SQ/merge),
//   OUT=file.json, MIX=0 (window.__SQ_MIX = 0: a run laid before a solid that would cover its light), DPR (3)
process.env.RIFT = process.env.RIFT || 'garden';
const { open } = require('./_pf-lib');
const fs = require('fs'), path = require('path');
const EL = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' };
const AT = { sunflare: 2.6, armageddon: 1.6, titan: 2.2, worldshaking: 1.2, deadscream: 2.0 };
(async () => {
  const flags = { __SM_GL: 1, __SM_GLHQ: 1, __AS_GL: 1, __AS_GLHQ: 1, __BL_GL: 1, __BL_GLHQ: 1, __AB_GL: 1, __AB_GLHQ: 1, __FXB: 0 /* (the cosmetic budget off: only the merge compared) */ }; if (process.env.MIX === '0') flags.__SQ_MIX = 0;
  const T = await open({ html: process.env.HTML, dpr: +(process.env.DPR || 3), rift: process.env.RIFT, flags }); const { page, errors, start, frames } = T;
  const F = +(process.env.F || 4), NM = +(process.env.N || 20), OUTD = path.resolve(__dirname, '..', process.env.OUTDIR || 'shots/v440-SQ/merge'); fs.mkdirSync(OUTD, { recursive: true });
  await page.evaluate(() => { const P = window.__pp; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.eq = 'aries'; P.st.animas.res = null; P.st.dlv = 33; });
  await start(+(process.env.STAGE || 3));
  const info = await page.evaluate(NM => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g; for (let k = 0; k < 90; k++) G.update(1 / 60);
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 6000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; let ok = true; for (let dx = -7; dx <= 8 && ok; dx++) for (let dy = -5; dy <= 5 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x - 1; me.y = best.y + 1; }
    D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still).forEach((m, i) => { if (i < NM) { const b = i / NM * 6.283, r = 2.0 + (i % 4) * 1.0; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 1.5 + Math.sin(b) * r * 0.75, hp: 1e9, maxhp: 1e9, aggro: true, spd: 0, atkCd: 99, dmg: 0 }); } });
    g.intro = 0; D.banners.length = 0; D.SKIP.fog = true; me.face = 1; for (let k = 0; k < 120; k++) { me.hp = D.ST.hp; G.update(1 / 60); }
    window.__SQHOLD = () => { me.hp = D.ST.hp; me.mp = 999; for (const m of D.mons) m.atkCd = 99; if (D.eshots) D.eshots.length = 0; };
    const RU = D.RULES; if (RU && RU.blocks && !RU.__po) { const b0 = RU.blocks; RU.blocks = k => k === 'noult' ? false : b0.call(RU, k); RU.__po = 1; }
    return { name: D.F.name, biome: D.F.biome, cv: [document.getElementById("arcCanvas").width, document.getElementById("arcCanvas").height] }; }, NM);
  console.log('==', JSON.stringify(info));
  const HOLD = ['window.__SQHOLD()'], out = { info, mix: process.env.MIX !== '0', scen: {} };
  await frames(3, { prof: false, hold: HOLD });   // (the painter's canvas watched, a frame's end seen: the merge armed)
  const same = name => page.evaluate(async name => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'), FG = self.NIDHOGG_MOVES.FGFX;
    const pn = performance.now.bind(performance), mr = Math.random, dn = Date.now, T0 = pn(), D0 = dn(); D.g.negT = 0; D.g.negF = 0; if (D.cam) D.cam.sm = 0;
    const draw = off => { window.__SQ_OFF = off; performance.now = () => T0; Date.now = () => D0; let s = 777; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; try { c.save(); G.draw(c); c.restore(); FG.frameEnd(); if (P.retro) P.retro.post(cv, c); } finally { performance.now = pn; Math.random = mr; Date.now = dn; } return c.getImageData(0, 0, cv.width, cv.height); };
    draw(1); const a = draw(1), b = draw(0), a0 = draw(1);   /* (a first draw discarded: what a draw sets up once, lazily (a particle's seed), would differ from every later one) */ window.__SQ_OFF = 0; let n8 = 0, n3 = 0, mx = 0, c8 = 0, cmx = 0; const d = new Uint8ClampedArray(a.data.length), w = cv.width, h = cv.height; let bx0 = w, by0 = h, bx1 = 0, by1 = 0;
    for (let i = 0; i < a.data.length; i += 4) { let m = 0, q = 0; for (let k = 0; k < 3; k++) { m = Math.max(m, Math.abs(a.data[i + k] - b.data[i + k])); q = Math.max(q, Math.abs(a.data[i + k] - a0.data[i + k])); } if (q > 8) c8++; if (q > cmx) cmx = q; if (m > 8) n8++; if (m > 3) n3++; if (m > mx) mx = m; const e = Math.min(255, m * 16); d[i] = e; d[i + 1] = e; d[i + 2] = e; d[i + 3] = 255;
      if (m > 2) { const p = i / 4, x = p % w, y = (p / w) | 0; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; } }
    const sh = document.createElement('canvas'); sh.width = w * 3 + 16; sh.height = h; const x = sh.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, sh.width, h); x.putImageData(a, 0, 0); x.putImageData(b, w + 8, 0); x.putImageData(new ImageData(d, w, h), w * 2 + 16, 0);
    /* (the crop: the middle of the screen, where the effects are, at full size) */
    const cw = Math.min(w, 520), chh = Math.min(h, 640), cx0 = Math.max(0, Math.min(w - cw, ((w - cw) / 2) | 0)), cy0 = Math.max(0, Math.min(h - chh, ((h - chh) * 0.42) | 0)); const cr = document.createElement('canvas'); cr.width = cw * 3 + 16; cr.height = chh; const y = cr.getContext('2d'); y.fillStyle = '#000'; y.fillRect(0, 0, cr.width, chh); y.drawImage(sh, cx0, cy0, cw, chh, 0, 0, cw, chh); y.drawImage(sh, w + 8 + cx0, cy0, cw, chh, cw + 8, 0, cw, chh); y.drawImage(sh, w * 2 + 16 + cx0, cy0, cw, chh, cw * 2 + 16, 0, cw, chh);
    return { px: a.data.length / 4, n3, n8, max: mx, ctrl8: c8, ctrlMax: cmx, diffBox: bx1 >= bx0 ? [bx0, by0, bx1, by1] : null, png: sh.toDataURL('image/png'), crop: cr.toDataURL('image/png') }; }, name);
  const ab = async () => { const on = [], off = []; for (let k = 0; k < F; k++) for (const o of k % 2 ? [0, 1] : [1, 0]) { await page.evaluate(o => { window.__SQ_OFF = o; }, o); const r = (await frames(1, { prof: false, hold: HOLD })).rows[0]; (o ? off : on).push(r); } await page.evaluate(() => { window.__SQ_OFF = 0; });
    const md = (L, k) => { const v = L.map(r => r[k] || 0).sort((a, b) => a - b); return v[v.length >> 1]; }, mn = (L, k) => L.reduce((a, r) => a + (r[k] || 0), 0) / L.length;
    const S = L => ({ ms: +md(L, 'tot').toFixed(0), copies: +(mn(L, 'diGLr') + mn(L, 'glmR')).toFixed(1), fg: +mn(L, 'diGLr').toFixed(1), glm: +mn(L, 'glmR').toFixed(1), layers: +mn(L, 'diGL').toFixed(1), compMpx: +(mn(L, 'diGLA') / 1e6).toFixed(2), glClears: +mn(L, 'glClear').toFixed(0), glDraws: +mn(L, 'glDraw').toFixed(0) });
    return { v439: S(off), v440: S(on) }; };
  const measure = async name => { await frames(2, { prof: false, hold: HOLD }); const s = await same(name); fs.writeFileSync(path.join(OUTD, `same-${name}.png`), Buffer.from(s.png.split(',')[1], 'base64')); fs.writeFileSync(path.join(OUTD, `crop-${name}.png`), Buffer.from(s.crop.split(',')[1], 'base64')); delete s.png; delete s.crop;
    const r = { same: s, ab: await ab() }; out.scen[name] = r; console.log(` ${name.padEnd(22)} copies ${r.ab.v439.copies} -> ${r.ab.v440.copies} (FGFX ${r.ab.v439.fg} -> ${r.ab.v440.fg}, GLM ${r.ab.v440.glm}; FGFX layers laid ${r.ab.v439.layers} -> ${r.ab.v440.layers}) · comp ${r.ab.v439.compMpx} -> ${r.ab.v440.compMpx} Mpx · ${r.ab.v439.ms} -> ${r.ab.v440.ms} ms · px >3: ${s.n3}, >8: ${s.n8}, max ${s.max} (control >8 ${s.ctrl8}, max ${s.ctrlMax})`); if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1)); return r; };
  const ev = (f, a) => page.evaluate(f, a);
  const reset = () => ev(() => { const G = window.__pp.arc.game, D = G._dbg; for (let k = 0; k < 60 * 14; k++) { window.__SQHOLD(); G.update(1 / 60); if (!D.ELEM || !D.ELEM.fx.length) break; } });
  const dismiss = () => ev(() => { const G = window.__pp.arc.game, D = G._dbg, AN = D.AN; if (!AN || !AN.S) return; AN.S.list.forEach(a => { a.life = 0.01; }); for (let k = 0; k < 60 * 25 && AN.S.list.length; k++) { window.__SQHOLD(); G.update(1 / 60); } if (AN.S.fx) AN.S.fx.length = 0; });
  for (const sc of (process.env.SCN || 'base,ult:sunflare').split(',')) {
    const [kind, rest] = sc.split(':'), [id, tS] = (rest || '').split('@');
    if (kind === 'base') await measure('base');
    else if (kind === 'ult') { const at = tS ? +tS : AT[id]; await ev(([u, el, at]) => { const P = window.__pp, G = P.arc.game, D = G._dbg; D.me.mp = 999; D.g.cdU = 0; D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[el]['ey_' + u], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); D.useUlt(); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; let k = 0; while (f && f.t < at && k++ < 1200) { window.__SQHOLD(); G.update(1 / 60); } }, [id, EL[id], at]);
      await measure(`${id}@${at}`); await reset(); }
    else if (kind === 'anima') { const at = tS ? +tS : 3; const r = await ev(([id, at]) => { const G = window.__pp.arc.game, D = G._dbg, AN = D.AN; if (!AN || !AN.kit) return 'no kit'; AN.kit.main.id = id; AN.kit.main.k = 3; AN.kit.res = null; AN.kit.resonance = null; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); const ok = AN.summon();
        for (let k = 0; k < 60 * 5.5; k++) { window.__SQHOLD(); G.update(1 / 60); } const a = AN.S.list[0]; if (!a) return { ok, none: true }; if (id === 'aries' && a.sm) { a.sm.ruin = 100; a.sm.cata = 6; } a.life = 0.01; for (let k = 0; k < 60 * at; k++) { window.__SQHOLD(); G.update(1 / 60); } return { ok, st: a.st, n: AN.S.list.length }; }, [id, at]);
      console.log('  anima', id, JSON.stringify(r)); await measure(`${id}-ult@${at}`); await dismiss(); }
    else if (kind === 'wind') { const cast = k => ev(k => { const P = window.__pp, G = P.arc.game, D = G._dbg; D.setKit('strong', Object.assign(P.elemAbility(P.ELEM_LIST.wind['ex_' + k], 'strong', P.st), { cost: 0, cd: 0, evo: 7 })); D.g.cdS = 0; D.me.mp = 999; D.useStrong('strong'); for (let i = 0; i < 30; i++) { window.__SQHOLD(); G.update(1 / 60); } }, k);
      for (const k of ['windblades', 'cyclone', 'gust', 'cyclone', 'gust']) await cast(k); await measure('wind'); await reset(); }
  }
  out.errors = errors; if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
  console.log('page errors', errors.length, errors.slice(0, 4)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
