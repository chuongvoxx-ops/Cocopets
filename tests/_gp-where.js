// v453 GP (from v434 PO's _po-where.js): where a Garden (or Belfry: RIFT=belfry) frame's area goes, by the page's caller (mapped back to src/js): every 2D drawImage / fillRect
// (its destination area in device px, its composite op), every FGFX pass (its caller, its quads' GPU fill by kind, its
// composite area), every GLM pass. Averaged over N frames of a scenario (as tests/_po-frame.js sets them up).
// usage: HTML=test-po.html STAGE=0 node tests/_po-where.js   env: N (4), ULT (cast first), AT, CROWD=1, WALK=1, DPR (2)
process.env.RIFT = process.env.RIFT || 'garden';
const { open } = require('./_pf-lib');
const fs = require('fs'), path = require('path');
const EL = { sunflare: 'light', armageddon: 'fire', titan: 'earth', worldshaking: 'earth', deadscream: 'dark' };
(async () => {
  const html = process.env.HTML || 'test-gp.html', T = await open({ html, dpr: +(process.env.DPR || 3), rift: process.env.RIFT, flags: { __ORB_GL: 1, __GB_GL: 1, __GB_GLHQ: 1 } }); await T.page.evaluate(gq => { window.__pp.st.gq = gq; if (window.__GPOFF0) {} }, process.env.GQ || 'balanced'); if (process.env.OFF === '1') await T.page.evaluate(() => { window.__GP_OFF = 1; }); const { page, errors, start, frames } = T;
  const STAGE = +(process.env.STAGE || 0), N = +(process.env.N || 4);
  await start(STAGE);
  await page.evaluate(([crowd, boss]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; for (let k = 0; k < 90; k++) G.update(1 / 60);
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);
    if (crowd) { const TR = window.GARDEN_TRAPS, Fs = TR ? TR.fields().filter(f => f.live) : [], L = Fs.length ? Fs[Fs.length - 1].traps : []; let best = null; for (const tp of L) { const n = L.filter(q => Math.hypot(q.x - tp.x, q.y - tp.y) < 6).length; if (!best || n > best.n) best = { tp, n }; }
      if (best) { const tp = best.tp; for (const [dx, dy] of [[0, 1.8], [1.6, 0.6], [-1.6, 0.6], [0, -1.8]]) if (W(tp.x + dx, tp.y + dy)) { me.x = tp.x + dx; me.y = tp.y + dy; break; } }
      D.mons.filter(m => !m.boss && !m.dead && !m.fiend && !m.fobj && !m.still).slice(0, 16).forEach((m, i) => { const b = i / 16 * 6.283, r = 2.2 + (i % 3) * 1.1; Object.assign(m, { x: me.x + Math.cos(b) * r, y: me.y + 3 + Math.sin(b) * r * 0.8, hp: 1e9, maxhp: 1e9, aggro: true }); }); }
    if (boss) { const b = D.mons.find(m => m.boss && !m.dead) || (D.M && D.M.bossAt); if (b) { me.x = b.x; me.y = b.y + 6; if (D.wakeBoss && !D.FD) try { D.wakeBoss(); } catch (e) {} } }
    D.g.intro = 0; D.g.bossIntro = 0; D.banners.length = 0; for (let k = 0; k < (boss ? 900 : 120); k++) { me.hp = D.ST.hp; G.update(1 / 60); } }, [!!process.env.CROWD, !!process.env.BOSS]);
  await frames(20, { prof: false });
  if (process.env.ULT) { const u = process.env.ULT; await page.evaluate(([u, el, at]) => { const P = window.__pp, G = P.arc.game, D = G._dbg; D.me.mp = 999; D.g.cdU = 0; D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[el]['ey_' + u], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7, sig: false })); D.useUlt(); const f = D.ELEM.fx[D.ELEM.fx.length - 1]; let k = 0; while (f && f.t < at && k++ < 900) { D.me.hp = D.ST.hp; G.update(1 / 60); } }, [u, EL[u], +(process.env.AT || { sunflare: 2.6, armageddon: 1.6, titan: 2.2, worldshaking: 1.2, deadscream: 2.0 }[u])]);
    await frames(2, { prof: false }); }
  const res = await page.evaluate(N => {
    const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, c = A.ctx || document.getElementById('arcCanvas').getContext('2d'), cv = c.canvas, F = self.NIDHOGG_MOVES.FGFX;
    const by = {}, fg = {}, glm = {}; const who = (d) => { const L = (new Error().stack || '').split('\n').slice(d, d + 2).map(l => { const m = l.match(/at ([^ ]+) .*:(\d+):\d+\)?$/) || l.match(/at .*:(\d+):\d+\)?$/); return m ? (m.length > 2 ? m[1] + ':' + m[2] : '?:' + m[1]) : '?'; }); return L.join(' < '); };
    const P2s = CanvasRenderingContext2D.prototype;
    const sc = x => { const m = x.getTransform(); return Math.abs(m.a * m.d - m.b * m.c); };
    /* (the visible part: the destination's device box inside the canvas and inside the current rectangular clip, followed through save/restore) */
    let clipR = [0, 0, cv.width, cv.height], lastRect = null; const stack = [];
    const devBox = (x, y, w, h, m) => { const P4 = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([u, v]) => [m.a * u + m.c * v + m.e, m.b * u + m.d * v + m.f]); return [Math.min(...P4.map(p => p[0])), Math.min(...P4.map(p => p[1])), Math.max(...P4.map(p => p[0])), Math.max(...P4.map(p => p[1]))]; };
    const isect = (a, b) => [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])], areaOf = r => Math.max(0, r[2] - r[0]) * Math.max(0, r[3] - r[1]);
    const osv = P2s.save, ors = P2s.restore, orc = P2s.rect, ocl = P2s.clip, obp = P2s.beginPath;
    P2s.save = function () { if (this === c) stack.push(clipR); return osv.apply(this, arguments); }; P2s.restore = function () { if (this === c && stack.length) clipR = stack.pop(); return ors.apply(this, arguments); };
    P2s.beginPath = function () { if (this === c) lastRect = null; return obp.apply(this, arguments); }; P2s.rect = function (x, y, w, h) { if (this === c) { const b = devBox(x, y, w, h, this.getTransform()); lastRect = lastRect ? [Math.min(lastRect[0], b[0]), Math.min(lastRect[1], b[1]), Math.max(lastRect[2], b[2]), Math.max(lastRect[3], b[3])] : b; } return orc.apply(this, arguments); };
    P2s.clip = function () { if (this === c && lastRect) clipR = isect(clipR, lastRect); return ocl.apply(this, arguments); };
    const P2 = CanvasRenderingContext2D.prototype, odi = P2.drawImage, ofr = P2.fillRect, ofl = P2.fill;
    let on = false; const SEQ = []; let n2d = 0;
    P2.drawImage = function (s) { if (on && this === c && !s.__pfGL) n2d++; if (on && this === c) { const a = arguments, n = a.length, w = n >= 9 ? a[7] : n >= 5 ? a[3] : s.width, h = n >= 9 ? a[8] : n >= 5 ? a[4] : s.height, Ar = Math.abs(w * h) * sc(this); const k = (s.__pfGL ? 'GL:' + s.__pfGL + ' ' : '') + who(3) + (this.globalCompositeOperation !== 'source-over' ? ' [' + this.globalCompositeOperation + ']' : ''); const b = by[k] || (by[k] = { n: 0, A: 0, src: 0, V: 0 }); b.n++; b.A += Ar; b.src += (s.width || 0) * (s.height || 0); const dx = n >= 9 ? a[5] : a[1], dy = n >= 9 ? a[6] : a[2]; b.V += areaOf(isect(devBox(dx, dy, w, h, this.getTransform()), clipR)); } return odi.apply(this, arguments); };
    P2.fillRect = function (x, y, w, h) { if (on && this === c) n2d++; if (on && this === c) { const k = 'fillRect ' + who(3) + (this.globalCompositeOperation !== 'source-over' ? ' [' + this.globalCompositeOperation + ']' : ''); const b = by[k] || (by[k] = { n: 0, A: 0, src: 0, V: 0 }); b.n++; b.A += Math.abs(w * h) * sc(this); b.V += areaOf(isect(devBox(x, y, w, h, this.getTransform()), clipR)); } return ofr.apply(this, arguments); };
    const b0 = F.begin, f0 = F.flush; let Qc = null;
    /* (each triangle's area inside the layer and the 2D clip (scaled to the layer): the pixels the GPU actually shades) */
    const clipPoly = (P, R) => { for (const [ax, lim, sg] of [[0, R[0], 1], [0, R[2], -1], [1, R[1], 1], [1, R[3], -1]]) { const out = []; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], ip = (p[ax] - lim) * sg >= 0, iq = (q[ax] - lim) * sg >= 0; if (ip) out.push(p); if (ip !== iq) { const t = (lim - p[ax]) / (q[ax] - p[ax]); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); } } P = out; if (!P.length) return 0; } let A = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; A += p[0] * q[1] - q[0] * p[1]; } return Math.abs(A) / 2; };
    const tri = (A12, n, R) => { const o = {}; for (let q = 0; q < n * 12; q += 36) { const k = Math.floor(A12[q + 4] + 0.001), s = clipPoly([[A12[q], A12[q + 1]], [A12[q + 12], A12[q + 13]], [A12[q + 24], A12[q + 25]]], R); o[k] = (o[k] || 0) + s; } return o; };
    F.begin = function () { Qc = b0.apply(this, arguments); return Qc; };
    F.flush = function (cc) { if (on && Qc) { if (SEQ.length < 60) SEQ.push([n2d, who(3).split(' < ')[1] || '', Qc.nl / 6 | 0, Qc.ns / 6 | 0]); n2d = 0; const k = who(3), e = fg[k] || (fg[k] = { n: 0, kinds: {}, comp: 0 }); e.n++; const kx = Qc.W / cv.width, R = [clipR[0] * kx, clipR[1] * kx, clipR[2] * kx, clipR[3] * kx], RL = [0, 0, Qc.W, Qc.Hh]; for (const [ka, kn] of [['lit', 'nl'], ['smk', 'ns'], ['wlit', 'nwl'], ['wsmk', 'nws']]) { const t = tri(Qc[ka], Qc[kn], RL), t2 = tri(Qc[ka], Qc[kn], R); for (const kk in t) { e.kinds[ka[0] + kk] = (e.kinds[ka[0] + kk] || 0) + t[kk]; e.vis = (e.vis || 0) + t2[kk]; } } const d0 = window.__PFC.diGLA; window.__PFC.on = true; const r = f0.apply(this, arguments); e.comp += window.__PFC.diGLA - d0; window.__PFC.on = false; return r; } return f0.apply(this, arguments); };
    for (let i = 0; i < N; i++) { D.me.hp = D.ST.hp; G.update(1 / 60); on = true; c.save(); G.draw(c); c.restore(); on = false; }
    P2.drawImage = odi; P2.fillRect = ofr; F.begin = b0; F.flush = f0; P2s.save = osv; P2s.restore = ors; P2s.rect = orc; P2s.clip = ocl; P2s.beginPath = obp;
    const L = Object.entries(by).map(([k, v]) => [k, v.n / N, v.V / N / 1e6, v.src / N / 1e6, v.A / N / 1e6]).sort((a, b) => b[2] - a[2]);
    const FG = Object.entries(fg).map(([k, v]) => { const tot = Object.values(v.kinds).reduce((a, b) => a + b, 0); return [k, v.n / N, tot / N / 1e6, v.comp / N / 1e6, (v.vis || 0) / N / 1e6, Object.entries(v.kinds).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([kk, a]) => kk + ':' + (a / N / 1e6).toFixed(2)).join(' ')]; }).sort((a, b) => b[2] - a[2]);
    return { cv: [cv.width, cv.height], L, FG, SEQ: SEQ.slice(0, Math.ceil(SEQ.length / N)) };
  }, N);
  const lines = fs.readFileSync(path.resolve(__dirname, '..', html), 'utf8').split('\n'), srcs = fs.readdirSync(path.resolve(__dirname, '../src/js')).map(f => [f, fs.readFileSync(path.resolve(__dirname, '../src/js', f), 'utf8').split('\n')]);
  const mapLn = s => s.replace(/:(\d+)/g, (m, ln) => { const text = (lines[+ln - 1] || '').trim(); if (text.length < 20) return m; for (const [f, L] of srcs) { const i = L.findIndex(x => x.trim() === text); if (i >= 0) return ':' + f.replace(/\.js$/, '').slice(0, 22) + '#' + (i + 1); } return m; });
  console.log(`stage ${STAGE} ${process.env.ULT || ''} canvas ${res.cv.join('x')} (${(res.cv[0] * res.cv[1] / 1e6).toFixed(2)} Mpx): per frame`);
  console.log('2D draws (count, visible dest Mpx (in canvas and clip), source Mpx, whole dest Mpx):'); let tot = 0; for (const [k, n, a, s] of res.L) { tot += a; } for (const [k, n, a, s, w] of res.L.slice(0, +(process.env.TOP || 22))) console.log(`  ${n.toFixed(1).padStart(6)} ${a.toFixed(2).padStart(7)} ${s.toFixed(2).padStart(6)} ${w.toFixed(2).padStart(7)}  ${mapLn(k)}`); console.log('  total visible dest Mpx', tot.toFixed(2));
  console.log('FGFX passes (count, GPU fill Mpx inside the layer, of it inside the 2D clip, composite Mpx (canvas px), fill by kind (l light, s solid)):'); for (const [k, n, f, cp, vis, ks] of res.FG) console.log(`  ${n.toFixed(1).padStart(4)} ${f.toFixed(2).padStart(6)} ${vis.toFixed(2).padStart(6)} ${cp.toFixed(2).padStart(6)}  ${mapLn(k)}   ${ks}`);
  console.log('pass order in a frame [2D draws on the game canvas since the last pass, caller, light quads, solid quads]:'); for (const q of res.SEQ) console.log('   ', q[0], mapLn(q[1]), q[2], q[3]);
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close();
})().catch(e => { console.error(e); process.exit(2); });
