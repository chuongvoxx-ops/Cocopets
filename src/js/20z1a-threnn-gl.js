/* ---------- (v463 SA) SEP3: what Rift 04's bosses share on the GPU ----------
   On GB_KIT (20x2: the vectors, rotations, the game camera, the floor shadow, kept pictures), as Rift 03's DUNE3 (20y2), with the
   Sepulchre's own light: the Clockless Halls (a cool silver key from the upper left in the dark, the gold of the hours bounced from
   below, a violet rim) and the Hall in Two Ages' Raised Gallery (a high white sun, the open sky above and the ivory marble below, a
   violet rim), carried to the materials (GLM 550..569, the SA-SEP-MAT block in 20k5uz) as uAmb (the key's colour) and uRim. Also: a
   model's GL state (meshes built once on first use, failures counted: three in 20 s and the 2D art is drawn for the session;
   window.__SEP_GL = 1 forces the GPU on a software rasteriser for tests, 0 keeps it off), kept pictures of still things at a zoom,
   the warnings marked so the engine paints nothing of them (their picture is light on the floor, drawn by the boss's own overlay;
   an order number on a mark is kept as data, s.ord, not painted), and the letting go when a new stage is made (the pictures
   dropped, every mesh's GPU buffers freed: they upload again when drawn; the shared GLM canvas shrunk). */
const SEP3 = (() => {
  const K = GB_KIT, { TAU, vadd, vmul, vdot, mv, mm, GY } = K, nowMs = K.nowMs, lowFx = K.lowFx;
  const win = k => { try { return typeof window !== 'undefined' ? window[k] : undefined; } catch (e) { return undefined; } };
  const MODELS = [];
  function model(name, build) {
    const G = { name, MESH: null, PB: {}, NOGL: false, fails: 0, last: 0, retry: 0, ms: 0, n: 0, box: null, meshMs: 0,
      fail() { const t = nowMs(); if (t - G.last > 20000) G.fails = 0; G.last = t; G.fails++; if (G.fails >= 3) G.NOGL = true; else G.retry = t + 1500; },
      on() { if (G.NOGL || (G.retry && nowMs() < G.retry) || typeof GLM === 'undefined' || win('__SEP_GL') === 0 || !GLM.ok()) return false; if (GLM.soft && !win('__SEP_GL')) return false;
        if (!G.MESH) { try { const t0 = nowMs(); G.MESH = build(); G.meshMs = nowMs() - t0; } catch (e) { G.NOGL = true; if (typeof console !== 'undefined') console.warn(name + ': meshes', e); return false; } } return true; },
      bounds(part) { let b = G.PB[part]; if (b) return b; const M = G.MESH && G.MESH[part]; if (!M) return [[0, 0, 0], 1.6]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
        for (let i = 0; i < p.length; i += 3) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); }
        return (G.PB[part] = [[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) + (z1 - z0) * (z1 - z0)) / 2]); },
      get tris() { return G.MESH ? Object.values(G.MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0; } };
    MODELS.push(G); return G; }
  const vn3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  /* the lights (world: x east, y south, z up) */
  const LIGHT = { halls: { lk: vn3([-0.5, 0.32, 0.8]), ls: vn3([0.3, 0.2, 0.93]), lr: vn3([0.45, -0.82, 0.36]), key: [1.08, 1.1, 1.3], rim: [0.78, 0.55, 1.3] },
    gallery: { lk: vn3([-0.42, 0.42, 0.8]), ls: vn3([-0.2, 0.3, 0.93]), lr: vn3([0.5, -0.78, 0.38]), key: [1.72, 1.6, 1.38], rim: [1.05, 0.6, 1.65], outline: 1.6 } };   /* (v463 SA, Vaul's shading pass: a stronger sun, a violet rim, a heavier outline) */
  const UPW = [0, 0, 1], CW = K.CW, GLCAP = 1500, OUTC = [0.05, 0.04, 0.09], GLI = [], GLJ = [], OCC = new Float32Array(48);
  /* one GPU pass (as GB_KIT's, with the Sepulchre's light): parts ({ part, R, o, s, sc, al, glow, glow2, spill, kind, fx, wear, outline, dz })
     into the box round them; o: { t, light ('halls' | 'gallery'), occ, flash, outline, into } */
  function glPass(c, V, list, al0, o, G) {
    const k = V.k, PX = [1, 0, 0], PY = [0, GY, -K.ZK], PD = CW, X0 = [V.X0, V.Y0], LT = LIGHT[o.light] || LIGHT.halls;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { if (!G.MESH[it.part]) continue; const [bc, brr] = G.bounds(it.part), sc = it.sc || [1, 1, 1], s = it.s || 1, sm = s * Math.max(sc[0], sc[1], sc[2]), rr = brr * sm * 1.05 * k,
        lc = [bc[0] * sc[0] * s, bc[1] * sc[1] * s, bc[2] * sc[2] * s], w = mv(V.Rh, vadd(it.o, mv(it.R, lc))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !win('__SEP_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.45 : 1) * (o.res || 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: LT.lk, ls: LT.ls, lr: LT.lr, up: UPW, low: o.low != null ? o.low : lowFx(), rim: LT.rim, amb: LT.key, t: (o.t || 0) % 600,
      outline: o.outline === 0 ? 0 : Math.max(1, (LT.outline || 1.0) * (W / bw)), outlineCol: OUTC, keep: 1 /* (GLM keeps its canvas while the box wanders: no reallocation a frame) */ };
    if (o.occ && o.occ.length) { let n2 = 0; for (const [p, r] of o.occ) { if (n2 >= 12) break; const w = mv(V.Rh, p); OCC[n2 * 4] = w[0]; OCC[n2 * 4 + 1] = w[1]; OCC[n2 * 4 + 2] = w[2]; OCC[n2 * 4 + 3] = r; n2++; } S.occ = OCC; S.nocc = n2; }
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = G.MESH[it.part]; if (!mesh) continue; const al = al0 * (it.al == null ? 1 : it.al); if (!(al > 0.004)) continue; const Rw = mm(V.Rh, it.R), s2 = it.s || 1, sc = it.sc || [1, 1, 1], Tt = mv(V.Rh, it.o);
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2 * sc[0]; g.R1[i] = Rw.y[i] * s2 * sc[1]; g.R2[i] = Rw.z[i] * s2 * sc[2]; g.T[i] = Tt[i]; }
      g.alpha = al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = it.wear == null ? 0.5 : it.wear; g.fx = it.fx || 0; g.outline = it.outline; g.first = 0; g.cnt = 0; g.d = vdot(Tt, PD) + (it.dz || 0); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    if (o.into) o.into(cvs, W, H, bx0, by0, bw, bh); else { c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); if (o.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= Math.min(1, o.flash) * 0.3; c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); } }
    G.ms = G.ms * 0.9 + (nowMs() - t0) * 0.1; G.n++; G.box = [W, H]; return true;
  }
  /* still things kept as pictures at a zoom (key: what is drawn); dropped on release */
  const PICS = new Map();
  function pic(c, G, key, T, make, light) { const m0 = c.getTransform ? c.getTransform() : null, dev = m0 ? Math.max(0.25, Math.hypot(m0.a, m0.b)) : 1, qz = Math.round(Math.log(Math.max(1, T * dev)) * 10), Tq = Math.exp(qz / 10) / dev, k2 = G.name + '|' + key + '|' + qz;
    const P = PICS.get(k2); if (P) return { P, f: T / Tq }; if (!G.on()) return null;
    const V0 = K.mkView(0, 0, 0, 0, { T: Tq, sx: v => v, sy: v => v }); let out = null;
    try { glPass(c, V0, make(), 1, { t: 0, light, into: (cvs, W, H, bx0, by0, bw, bh) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(cvs, 0, 0); out = { cv, bx0, by0, bw, bh }; } }, G); } catch (e) { G.fail(); }
    if (!out) return null; if (PICS.size > 20) dropPics(); PICS.set(k2, out); return { P: out, f: T / Tq }; }
  function dropPics() { for (const P of PICS.values()) if (P && P.cv) P.cv.width = P.cv.height = 1; PICS.clear(); }
  function blitPic(c, p, X, Y) { const P = p.P, f = p.f; c.drawImage(P.cv, 0, 0, P.cv.width, P.cv.height, X + P.bx0 * f, Y + P.by0 * f, P.bw * f, P.bh * f); }
  /* the shared GPU painter (window.__SEP_FX = 0 keeps the 2D effects: tests) */
  const fg = () => { try { if (win('__SEP_FX') === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  /* a warning marked for light: the engine's own (its shape kept as geo for the strike, the same moment and damage), shape 'fn' so the
     engine paints nothing of it; an order label kept as s.ord (also when its tick rewrites it). Without the painter it stays the
     engine's own 2D warning. tele0: the fight's own FX.tele */
  function mark(FX, o, tele0) { if (!fg()) return tele0(o); const geo = o.shape; let s = null; if (o.label != null) { o.ord = o.label; delete o.label; }
    const tk = o.tick; if (tk) o.tick = (dt, q) => { tk(dt, q); if (q.label != null) { q.ord = q.label; q.label = null; } };
    s = tele0(Object.assign(o, { geo, shape: 'fn', sa: 1, seed: Math.random() * 40, test: (x, y, rr) => { s.shape = s.geo; const r = FX.inShape(s, x, y, rr); s.shape = 'fn'; return r; } })); return s; }
  /* a marked warning drawn as the engine drew it (the painter lost mid-fight) */
  const rgbaH = (h, a) => { const n = parseInt(h.slice(1, 7), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a)).toFixed(3)})`; };
  function tele2D(c, FX, s, T, t) { const u = Math.max(0, Math.min(1, s.age / s.t)), col = s.col || '#C9B0FF', X = FX.sx(s.x), Y = FX.sy(s.y), geo = s.geo;
    const path = grow => { c.beginPath();
      if (geo === 'circle') c.arc(X, Y, Math.max(0.1, s.r * T * grow), 0, TAU);
      else if (geo === 'line') { c.save(); c.translate(X, Y); c.rotate(s.a); c.rect(0, -s.w / 2 * T, s.len * T * grow, s.w * T); c.restore(); }
      else if (geo === 'cone') { c.moveTo(X, Y); c.arc(X, Y, s.len * T * grow, s.a - s.spread, s.a + s.spread); c.closePath(); }
      else if (geo === 'ring') { const r0 = s.r0 * T, r1 = s.r0 * T + (s.r1 - s.r0) * T * grow; if (s.gaps && s.gaps.length) { const gs = s.gaps.map(([a, w]) => [a - w, a + w]).sort((p, q) => p[0] - q[0]); for (let i = 0; i < gs.length; i++) { const b0 = gs[i][1], b1 = gs[(i + 1) % gs.length][0] + (i === gs.length - 1 ? TAU : 0); c.moveTo(X + Math.cos(b0) * r1, Y + Math.sin(b0) * r1); c.arc(X, Y, r1, b0, b1); c.arc(X, Y, r0, b1, b0, true); c.closePath(); } } else { c.arc(X, Y, r1, 0, TAU); c.moveTo(X + r0, Y); c.arc(X, Y, r0, 0, TAU, true); } } };
    if (s.done && !s.linger) return;
    c.save(); path(1); c.fillStyle = rgbaH('#0A0410', 0.13); c.fill('evenodd'); c.globalCompositeOperation = 'lighter';
    path(geo === 'ring' ? 1 : u); c.fillStyle = rgbaH(col, 0.04 + u * 0.1); c.fill('evenodd');
    path(1); c.lineWidth = 1.5 + u * 1.5; c.strokeStyle = rgbaH(col, 0.45 + 0.4 * Math.sin(t * 18) * u + u * 0.3); c.stroke(); c.restore();
    if (s.ord != null) { c.save(); c.font = `900 ${Math.round(T * 0.7)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText(String(s.ord), X, Y); c.fillText(String(s.ord), X, Y); c.restore(); } }
  /* letting go: when a new stage is made (BEL.releaseStale, 20n) the pictures are dropped and every mesh's GPU buffers freed (their
     arrays stay: they upload again when next drawn); each boss adds its own; the shared GLM canvas is given back too */
  const REL = [];
  function release() { dropPics(); for (const G of MODELS) if (G.MESH && typeof GLM !== 'undefined' && GLM.free) for (const k in G.MESH) if (G.MESH[k]) GLM.free(G.MESH[k]); for (const f of REL) try { f(); } catch (e) { /* (nothing to drop) */ }
    try { const cv = typeof GLM !== 'undefined' && GLM.canvas; if (cv && cv.width * cv.height > 4096) { cv.width = 64; cv.height = 64; } } catch (e) { /* (no canvas yet) */ } }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(release); } catch (e) { /* (no rift hook) */ }
  /* a fight's own helpers, wrapped onto its FX at its start: every warning marked for light, a hazard's 2D picture left out while the
     painter draws it (o.skip2D(z): true to leave it to the light) */
  function wrapFX(FX, o) { if (FX.__sep3) return; FX.__sep3 = 1; const t0 = FX.tele, h0 = FX.hz; FX.tele = q => mark(FX, q, t0);
    FX.hz = q => { const z = h0(q); if (z && z.draw && o && o.skipHz && o.skipHz(z)) { const d0 = z.draw; z.draw = (c, z2, F2, T, t) => { if (fg()) return; d0(c, z2, F2, T, t); }; } return z; }; }
  /* a light quad along a floor segment: from (x0, y0) along angle a for len, w wide (screen px from the fight's sx / sy) */
  function laneQ(Q, FX, kind, x, y, a, len, w, T, col, al, q0, q1) { const ca = Math.cos(a), sa = Math.sin(a), hl = len / 2 * T, hw = w / 2 * T; Q.quad(kind, FX.sx(x + ca * len / 2), FX.sy(y + sa * len / 2), ca * hl, sa * hl, -sa * hw, ca * hw, col, al, q0, q1, len / Math.max(0.1, w)); }
  return { K, LIGHT, model, glPass, pic, blitPic, dropPics, fg, mark, wrapFX, tele2D, rgbaH, laneQ, onRelease: f => REL.push(f), release, get picN() { return PICS.size; } };
})();

/* ---------- (v463 SA) THRENN THE SECOND EATER in three dimensions (Rift 04, section 1's boss: the Tomb Court) ----------
   The 2D centipede of 20z1-rift-fiend-sepulchre-1.js rebuilt as a GPU model at Rift 03's bosses' fidelity: GLM meshes built once (in
   the loading screen's jobs, else on the first draw), posed every frame on the fight's own body (the 2D file's thirteen eased points:
   its coil about the hourglass, laid down a lane in a rush, slumped on the flagstones), one composite drawImage; its materials GLM
   550..556 (SA-SEP-MAT, 20k5uz); the light of its moves on the shared FGFX painter (kinds 428..431, SA-FX in 20k6h). The fight keeps
   its acts, timings, shapes and damage; its warnings are light in the carved stone (no outlines, no countdown numbers). Without WebGL
   (or on a software rasteriser, unless window.__SEP_GL) the 2D centipede is drawn as before; without the painter its warnings and
   effects are the old 2D ones.
   The model (tiles; z up; x east, y south unforeshortened; the Belfry's orthographic camera): twelve body segments of blue-black
   polished stone flecked with mica and veined with gold dust, each under a keeled plate of blue-grey slate engraved with the rings of
   the hours (the six largest edged in old gold, riveted at their corners), joined by ribbed dark flesh; eight legs of jointed stone,
   gold-clawed, paddling at the air; two spines trailing from the tail, gold-beaded. Its head is a stone drum behind a clock face: a
   gold bezel, a domed glass over a pale enamel dial (crazed with age, hour bars and minute ticks), three thick blued-steel hands
   that tick with a jolt, the stopped one burning violet; two hooked claws under it. Its core is the hourglass it coils round: gold
   caps, three turning posts, a glass that catches the halls' light, gold sand running (violet, hanging, while a moment is borrowed).
   Its fall: it slumps out of the air onto the flagstones, the hands whirl backwards, the hourglass flares and shatters, the sand
   pours out over the stones and the light drains from it. */
const THRENN_GL = (() => {
  const D3 = SEP3, K = GB_KIT, { TAU, cl, lerp, sstep, ease, GY, ZK, CW, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv, mm, rotX, rotY, rotZ, rotAxis, frameXZ, hash, headOf } = K, lowFx = K.lowFx;
  const M_STONE = 550, M_FLESH = 550.2, M_LEG = 550.4, M_PLATE = 551, M_PLATE2 = 551.2, M_GOLD = 552, M_GOLD2 = 552.2, M_DIAL = 553, M_HAND = 554, M_GLASS = 555, M_SAND = 556, M_SANDF = 556.2;
  const VIOLET = '#8E6BD0', VIOLET_HI = '#C9B0FF', GOLD = '#B2965D', GOLD_HI = '#E8CF8E', SILVER_HI = '#E4EAF2';
  const N = 13, WK = [1, 0.74, 0.86, 1.0, 1.1, 1.18, 1.22, 1.2, 1.12, 1.0, 0.88, 0.75, 0.6], BIG = i => i >= 3 && i <= 8, LEGS = [3, 5, 7, 9];
  const FR = 0.86, HL = [0.48, 0.66, 0.78], HW = [0.2, 0.16, 0.12];   // (the face's radius, its hands' lengths and widths, of the face)
  const HH = 1.1 / ZK, WR = 0.62;   // (the hourglass: half its height (as tall on the screen as the 2D's), its bulbs' radius)
  const bulbR = z => { const u = Math.min(1, Math.abs(z) / HH); return WR * (0.1 + 0.86 * Math.pow(sstep(0.0, 0.62, u), 0.85)) * (1 - 0.14 * sstep(0.78, 1, u)); };
  const SH = D3.model('Threnn', buildMeshes);
  function buildMeshes() {
    const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(4, Math.round(n * DQ)), fin = (k, B) => { out[k] = B.done(); };
    const toZ = B => B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]);   // (a lathe about the frame's x set upright: its axis z)
    /* ---- a body segment (x toward the head, y across, z up; girth w): its stone, its keeled slate plate (two halves meeting in a
       ridge), the big ones' gold rim under the slate and rivets at its corners ---- */
    for (let i = 1; i < N; i++) { const B = nb(), w = WK[i], big = BIG(i), L2 = big ? 0.36 : 0.3, Wd = (big ? 0.5 : 0.4) * w, zt = 0.3 * w;
      B.ell([0, 0, 0], [0.47, 0.47 * w, 0.37 * w], M_STONE, { seg: q(18), rings: q(10) });
      const hexa = (l, wd) => [[l, 0.0], [l * 0.82, wd], [-l * 0.86, wd], [-l, 0.0]];
      for (const sg of [-1, 1]) { const th = -0.2 * sg; B.push([1, 0, 0], [0, Math.cos(th), Math.sin(th)], [0, -Math.sin(th), Math.cos(th)], [0, 0, zt]);   // (each half tipped down from the ridge, its outline on its own side)
        B.prism(hexa(L2, Wd).map(p => [p[0], p[1] * sg]), -0.05, 0.05, big ? M_PLATE : M_PLATE2, { b: 0.025 }); B.pop(); }
      if (big) { B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, zt - 0.06]); B.prism([[L2 * 1.06, 0], [L2 * 0.88, Wd * 1.05], [-L2 * 0.92, Wd * 1.05], [-L2 * 1.06, 0], [-L2 * 0.92, -Wd * 1.05], [L2 * 0.88, -Wd * 1.05]], -0.03, 0.03, M_GOLD, { b: 0.012 }); B.pop();
        for (const [x, y] of [[L2 * 0.7, Wd * 0.72], [-L2 * 0.72, Wd * 0.72], [L2 * 0.7, -Wd * 0.72], [-L2 * 0.72, -Wd * 0.72]]) B.sph([x, y, zt + 0.06 - Math.abs(y) * 0.2], 0.045, M_GOLD2, 6); }
      fin('seg' + i, B); }
    /* the dark ribbed flesh between segments, and the legs' and spines' bones: open tubes along x 0..1 of radius 1 (scaled on the pose);
       a joint's knob; a claw (a gold cone along x 0..1) */
    // (untapered: a part scaled unevenly keeps true normals only where they are square to its length; the flesh's ribs are in its material)
    { const B = nb(); B.tube([0, 0, 0], [1, 0, 0], 1, 1, M_FLESH, { seg: q(14), cap0: false, cap1: false, rings: 4 }); fin('link', B); }
    { const B = nb(); B.tube([0, 0, 0], [1, 0, 0], 1, 1, M_LEG, { seg: q(10), cap0: false, cap1: false, rings: 3 }); fin('bone', B); }
    { const B = nb(); B.sph([0, 0, 0], 1, M_LEG, q(10)); fin('knob', B); }
    { const B = nb(); B.sph([0, 0, 0], 1, M_GOLD2, q(8)); fin('bead', B); }
    { const B = nb(); B.tube([0, 0, 0], [1, 0, 0], 0.3, 0.01, M_GOLD, { seg: q(7), cap0: 'flat', cap1: false }); fin('claw', B); }   // (scaled evenly by its length)
    /* ---- the face (its own frame: z out of the dial, y up the face): the stone drum behind, the gold bezel and its inner ring, the
       enamel dial (a shallow dome), the hands' pin; the glass over the dial (drawn as glass) ---- */
    { const B = nb(); toZ(B); B.lathe([[-0.62, 0], [-0.62, 0.62], [-0.56, 0.86], [-0.4, 0.97], [-0.06, 1.0], [0.0, 0.98]], M_STONE, { seg: q(30) }); B.pop();
      B.tor([0, 0, 0.02], 0.95, 0.075, M_GOLD2, { seg: q(40), rseg: q(8) }); B.tor([0, 0, 0.035], 0.875, 0.028, M_GOLD, { seg: q(40), rseg: 6 });
      toZ(B); B.lathe([[0.012, FR * 0.995], [0.035, FR * 0.6], [0.048, 0.0]], M_DIAL, { seg: q(40) }); B.pop();
      B.sph([0, 0, 0.16], 0.1, M_GOLD2, q(10));
      // four gold lugs on the bezel at the quarters, and ridges of the drum's back (a winding crown at its top)
      for (let j = 0; j < 4; j++) { const a = j * TAU / 4 + TAU / 8; B.sph([Math.cos(a) * 0.97, Math.sin(a) * 0.97, 0.02], 0.07, M_GOLD2, 6); }
      B.tube([0, 1.0, -0.25], [0, 1.18, -0.25], 0.09, 0.09, M_GOLD, { seg: q(10) });
      fin('face', B); }
    { const B = nb(); toZ(B); B.lathe([[0.05, FR * 0.99], [0.12, FR * 0.7], [0.16, 0.0]], M_GLASS, { seg: q(36) }); B.pop(); fin('cover', B); }
    /* the hands (along +x from the pin, in the face's plane, z its thickness): a blade, a lozenge near its tip, a counterweight */
    for (let k = 0; k < 3; k++) { const B = nb(), Lh = HL[k] * FR, w = HW[k] * FR * 0.5, t0 = -0.16 * FR;
      B.prism([[t0, 0], [t0 + 0.04, w * 0.9], [Lh * 0.62, w * 0.75], [Lh * 0.74, w * 1.35], [Lh, 0], [Lh * 0.74, -w * 1.35], [Lh * 0.62, -w * 0.75], [t0 + 0.04, -w * 0.9]], -0.02, 0.02, M_HAND, { b: 0.008 });
      B.sph([t0, 0, 0], w * 1.25, M_HAND, 8); fin('hand' + k, B); }
    /* a claw under the face: a hooked stone finger, a gold tip (its frame: x down the claw's first reach, it hooks toward -y) */
    { const B = nb(), P = [[0, 0, 0], [0.55, 0.1, 0], [0.95, -0.12, 0], [1.15, -0.45, 0]]; for (let i = 0; i < 3; i++) B.tube(P[i], P[i + 1], 0.16 - i * 0.045, 0.12 - i * 0.04, M_STONE, { seg: q(9), cap0: 'round', cap1: 'round' });
      B.spike(P[3], [1.2, -0.66, 0], 0.05, M_GOLD2, { seg: 6 }); fin('hook', B); }
    /* ---- the hourglass (upright about z, centred): its caps, three posts (turning), the glass, the sand (cut to its levels in the
       material), a disc for the sand's surface, a thread of running sand ---- */
    { const B = nb(); for (const sg of [-1, 1]) { const z0 = sg * HH * 0.95; toZ(B); B.lathe([[z0, 0], [z0, WR * 1.06], [z0 + sg * 0.05, WR * 1.13], [z0 + sg * 0.11, WR * 1.1], [z0 + sg * 0.14, WR * 0.85], [z0 + sg * 0.17, WR * 0.5], [z0 + sg * 0.18, 0]], M_GOLD, { seg: q(30) }); B.pop();
        B.tor([0, 0, z0 + sg * 0.07], WR * 1.12, 0.03, M_GOLD2, { seg: q(30), rseg: 5 }); B.sph([0, 0, z0 + sg * 0.2], 0.08, M_GOLD2, 8); }
      fin('caps', B); }
    { const B = nb(); for (let j = 0; j < 3; j++) { const a = j * TAU / 3, x = Math.cos(a) * WR * 1.0, y = Math.sin(a) * WR * 1.0; B.tube([x, y, -HH * 0.95], [x, y, HH * 0.95], 0.05, 0.05, M_GOLD, { seg: q(8), cap0: false, cap1: false, rings: 1 });
        for (const z of [-0.62, 0, 0.62]) B.sph([x, y, z * HH], 0.075, M_GOLD2, 7); } fin('posts', B); }
    const prof = (k, n) => { const P = []; for (let i = 0; i <= n; i++) { const z = -HH * 0.95 + HH * 1.9 * i / n; P.push([z, bulbR(z) * k]); } P[0][1] = 0; P[n][1] = 0; return P; };
    { const B = nb(); toZ(B); B.lathe(prof(1, q(28)), M_GLASS, { seg: q(30) }); B.pop(); fin('glass', B); }
    { const B = nb(); toZ(B); B.lathe(prof(0.9, q(24)), M_SAND, { seg: q(24) }); B.pop(); fin('sand', B); }
    { const B = nb(); toZ(B); B.lathe([[0, 0], [0.03, 0.6], [0.0, 1.0]], M_SANDF, { seg: q(20) }); B.pop(); fin('sandTop', B); }
    { const B = nb(); B.tube([0, 0, 0], [0, 0, -1], 1, 1, M_SANDF, { seg: 6, cap0: false, cap1: false }); fin('stream', B); }
    return out; }

  /* ================= the fight's side (20z1): its memory, the pose of this moment ================= */
  const toM = (p, m) => [p[0] - m.x, (p[1] - m.y) / GY, p[2] / ZK];
  const easeH = u => u >= 1 ? 1 : 1 - Math.pow(1 - u, 3) + Math.sin(u * Math.PI) * 0.22;
  const handA = H => H.u >= 1 ? H.a : H.from + (H.a - H.from) * easeH(H.u);
  function st3(FX) { const M = FX.mem; let S = M.g3; if (S) return S; S = M.g3 = { fx: [], R: null, Rt: -1, end: null }; return S; }
  /* the rig: the parts of this moment, in the model's frame about (m.x, m.y) */
  function rig(FX, m, t) {
    const M = FX.mem, S = st3(FX), E = S.end, inst = [], A = {}, occ = [], shad = [];
    if (!M.segs) return null;
    const dead = E ? sstep(1.6, 3.4, E.t) : 0, fl = m.flash > 0 && !E ? 1 : 0, bt = M.bt || t, menace = M.menace || 0, open = M.open || 0, slump = M.slump || 0, roar = M.roar || 0, hs = m.hitSq || 0;
    const I = (part, R, o, ex) => { const it = { part, R, o, s: 1, al: 1, glow: 0, glow2: fl * 0.85, spill: 0, kind: 0, fx: dead * 0.85, wear: 0.5 }; if (ex) Object.assign(it, ex); inst.push(it); return it; };
    const P = M.segs.map(p => toM(p, m)); A.P = P;
    const upz = [0, 0, 1], veinG = 0.15 + menace * 0.35 + open * 0.5 + roar * 0.4;
    const frames = []; for (let i = 0; i < N; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)]; frames.push(frameXZ(vsub(a, b), upz)); }
    /* ---- the body: segments, the flesh between them, legs, the tail's spines ---- */
    for (let i = 1; i < N; i++) { const p = P[i], F = frames[i], w = WK[i];
      I('seg' + i, F, p, { glow: veinG, wear: hash(i * 3.7) });
      const pr = P[i - 1], d = vsub(pr, p), L = vlen(d); if (L > 0.05) { const Fl = frameXZ(d, upz), rr = 0.33 * Math.min(w, WK[i - 1] || w); I('link', Fl, p, { sc: [L, rr, rr * 0.86], wear: hash(i * 5.1) }); }
      if (i % 3 === 0) occ.push([p, 0.4 * w]); if (i % 2 === 1) shad.push(i);
      if (LEGS.includes(i)) for (const s of [-1, 1]) { const ph = (M.legPh || t * 3) - i * 0.9 + (s > 0 ? 0 : Math.PI), sw = Math.sin(ph), lift = Math.max(0, Math.cos(ph)) * 0.2, spread = 1.15 + slump * 0.45;
        const root = vadd(p, vadd(vmul(F.y, s * 0.36 * w), [0, 0, -0.12])), foot = vadd(vadd(p, vadd(vmul(F.y, s * spread * w), vmul(F.x, sw * 0.32))), [0, 0, 0]); foot[2] = Math.max(0.08, p[2] - 1.1 + lift * 1.6 + slump * 0.55);
        const knee = vadd(vmul(vadd(root, foot), 0.5), vadd(vmul(F.y, s * 0.38), [0, 0, 0.5 - slump * 0.15]));
        bone(I, root, knee, 0.12, 0.8, 'bone', hash(i + s)); I('knob', I3(), knee, { s: 0.11, wear: 0.3 }); bone(I, knee, foot, 0.095, 0.7, 'bone', hash(i - s));
        const dl = vnrm(vsub(foot, knee)), dc = vnrm(vadd(dl, [0, 0, -0.5])); I('claw', frameXZ(dc, [1, 0, 0]), foot, { s: 0.26, wear: 0.4 }); }
      if (i === N - 1) for (const s of [-1, 1]) { const sw = Math.sin(bt * 2.4 + s) * 0.25, q1 = vadd(p, vadd(vmul(F.x, -0.55), vadd(vmul(F.y, s * 0.18), [0, 0, 0.12]))), q2 = vadd(p, vadd(vmul(F.x, -1.05), vadd(vmul(F.y, s * 0.38 + sw), [0, 0, 0.32 + sw * 0.3]))), q3 = vadd(p, vadd(vmul(F.x, -1.5), vadd(vmul(F.y, s * 0.6 + sw * 1.4), [0, 0, 0.48])));
        bone(I, p, q1, 0.13, 0.75, 'bone', 0.2); bone(I, q1, q2, 0.1, 0.7, 'bone', 0.4); bone(I, q2, q3, 0.07, 0.6, 'bone', 0.6); I('bead', I3(), q3, { s: 0.07, glow: veinG, wear: 0.5 }); } }
    /* ---- the head: the neck from the first segment, the face turned mostly to the camera and partly to its heading; the hands; the
       claws under it, spread when it means to bite ---- */
    { const h = P[0], hd = M.hd == null ? Math.PI / 2 : M.hd, hdir = [Math.cos(headOf(hd)), Math.sin(headOf(hd)), 0], lie = slump;
      let Nf = vnrm(vadd(vmul(hdir, 0.55), vmul(CW, 1.0))); Nf = vnrm(vadd(vmul(Nf, 1 - lie * 0.75), vmul([0, 0.3, 1], lie * 0.75)));
      const me = FX.me || { x: m.x, y: m.y + 5 }, look = Math.max(-0.18, Math.min(0.18, (me.x - M.segs[0][0]) * 0.03)), rot = -(look + Math.sin(bt * 1.1) * 0.05 - hs * 0.25 + (M.recoil || 0) * 0.1);
      const upH = Math.abs(Nf[2]) > 0.97 ? [0, -1, 0] : upz; let U = vnrm(vsub(upH, vmul(Nf, vdot(upH, Nf)))); const Xl = vcross(U, Nf); U = vnrm(vadd(vmul(U, Math.cos(rot)), vmul(Xl, Math.sin(rot))));
      const Rf = M3(vcross(U, Nf), U, Nf), right = vcross(Nf, U), sc = (1 + roar * 0.08 - hs * 0.06) * FR / 0.86;
      const back = vsub(h, vmul(Nf, 0.45 * sc)), p1 = P[1], dn = vsub(back, p1), Ln = vlen(dn); if (Ln > 0.05) I('link', frameXZ(dn, upz), p1, { sc: [Ln, 0.4, 0.34], wear: 0.7 });
      I('face', Rf, h, { s: sc, glow: M.fzK || 0, wear: 0.33 }); I('cover', Rf, h, { s: sc, al: 0.99 * (1 - (E ? sstep(1.2, 1.5, E.t) : 0)), kind: 0, outline: false, wear: 0.6 });
      const fz = M.fz, fzK = M.fzK || 0, hands = M.hands || [];
      for (let k = 0; k < 3; k++) { const Hh = hands[k]; if (!Hh) continue; const a = handA(Hh) + (hs * 0.3 * Math.sin(t * 60 + k)), dir = vnrm(vadd(vmul(right, Math.sin(a)), vmul(U, Math.cos(a)))), Rh = M3(dir, vcross(Nf, dir), Nf);
        I('hand' + k, Rh, vadd(h, vmul(Nf, (0.075 + k * 0.018) * sc)), { s: sc, glow: fz === k ? fzK * 1.4 : 0, wear: 0.2 + k * 0.2 }); A['hand' + k] = vadd(h, vmul(dir, HL[k] * FR * sc * 0.92)); }
      A.face = h; A.faceN = Nf; A.faceR = FR * sc;
      for (const s of [-1, 1]) { const sp = 0.25 + menace * 0.45 + Math.sin(bt * 3 + s) * 0.05, base = vadd(h, vadd(vmul(right, s * 0.5 * sc), vadd(vmul(U, -0.5 * sc), vmul(Nf, -0.2 * sc)))), dirC = vnrm(vadd(vmul(U, -1), vmul(right, s * (0.2 + sp * 0.6))));
        const zC = vnrm(vcross(dirC, vnrm(vadd(vmul(right, s), vmul(U, -0.15))))), yC = vcross(zC, dirC); I('hook', M3(dirC, yC, zC), base, { s: 0.72 * sc, wear: 0.5 + s * 0.2 }); }   // (its hook curls in, toward the face's middle)
      occ.push([vsub(h, vmul(Nf, 0.3)), 0.7 * sc]); }
    /* ---- the hourglass: flipped about the view's axis as the 2D turns it, its posts turning about it, the sand at its levels ---- */
    { const alt = M.alt == null ? 1.3 : M.alt, C = [0, 0, alt / ZK], flip = (M.flip || 0) + Math.sin(bt * 0.8) * 0.05 + slump * 0.5, Rc = rotAxis(CW, flip), held = !!(M.bm && M.bm.launched && !M.bm.released), sand = M.sand == null ? 0.3 : M.sand;
      const brk = E ? sstep(1.15, 1.3, E.t) : 0, ck = M.cracked || 0, glowC = 0.25 + menace * 0.3 + open * 1.1 + slump * 0.35 + roar * 0.4;
      I('caps', Rc, C, { glow: open * 0.9 + roar * 0.3, wear: 0.4 }); I('posts', mm(Rc, rotZ(M.coreRot || 0)), C, { glow: open * 0.6, wear: 0.6 });
      const top = 1 - sand, zT = top > 0.02 ? HH * (0.1 + 0.72 * top) : -1, zB = -HH * (0.9 - 0.72 * sand) * (1 - brk) - HH * 0.95 * brk;
      I('sand', Rc, C, { kind: zT * (1 - brk) - brk, spill: zB, glow: glowC * 0.6, wear: held ? 1 : 0, outline: false });
      if (zT > 0) I('sandTop', Rc, vadd(C, mv(Rc, [0, 0, zT])), { sc: [bulbR(zT) * 0.88, bulbR(zT) * 0.88, 1.5], glow: glowC * 0.6, wear: held ? 1 : 0, outline: false });
      if (zB > -HH * 0.93) I('sandTop', Rc, vadd(C, mv(Rc, [0, 0, zB])), { sc: [bulbR(zB) * 0.88, bulbR(zB) * 0.88, 1.5], glow: glowC * 0.6, wear: held ? 1 : 0, outline: false });
      if (!held && !(m.stunT > 0) && zT > 0 && !E) I('stream', Rc, C, { sc: [0.022, 0.022, Math.max(0.01, -zB)], glow: glowC, wear: 0, outline: false });
      if (brk < 1) I('glass', Rc, C, { al: 0.99, kind: Math.max(ck, brk), fx: 0, outline: false, wear: 0.5 });
      A.core = C; A.held = held; A.glowC = glowC; occ.push([C, WR * 1.05]); }
    return { inst, A, occ, shad }; }
  function bone(I, a, b, r, k, part, wear) { const d = vsub(b, a), L = vlen(d); if (L < 1e-3) return; I(part, frameXZ(d, Math.abs(d[2]) / L > 0.95 ? [1, 0, 0] : [0, 0, 1]), a, { sc: [L, r, r], wear }); }
  function rigNow(FX, m) { const M = FX.mem, S = st3(FX), key = (M.bt || 0) + (S.end ? S.end.t * 1000 : 0); if (S.R && S.Rt === key && S.Rm === m) return S.R; S.R = rig(FX, m, M.bt || 0); S.Rt = key; S.Rm = m; return S.R; }

  /* ================= drawing ================= */
  let LAST = null;
  function drawRig(c, R, V, o) { if (!R) return false; LAST = { R, V };
    if (o.shadow !== false) K.shadow(c, V, R.inst.filter(it => /^seg/.test(it.part) || it.part === 'caps'), 0.8 * (o.alpha == null ? 1 : o.alpha), SH);
    let ok = false; try { ok = D3.glPass(c, V, R.inst, o.alpha == null ? 1 : o.alpha, { t: o.t || 0, flash: o.flash, light: 'halls', occ: lowFx() ? null : R.occ }, SH); } catch (e) { SH.fail(); if (typeof console !== 'undefined') console.warn('Threnn: draw', e); ok = false; }
    return ok; }
  function drawBoss(c, FX, m, X, Y, T, t) { if (!SH.on()) return false; const R = rigNow(FX, m); if (!R) return false;
    const V = K.mkView(m.x, m.y, 0, 0, { T, sx: v => X + (v - m.x) * T, sy: v => Y + (v - m.y) * T }), al = m.act === 'enter' ? cl((FX.S.enterT || 0) / 1.2) : 1;
    return drawRig(c, R, V, { t: FX.mem.bt || t, flash: m.flash > 0 ? 1 : 0, alpha: al }); }
  const scr = (FX, m, p, T) => [FX.sx(m.x + p[0]), FX.sy(m.y + p[1] * GY) - p[2] * ZK * T];   // (a model point -> the screen)

  /* ================= its light (FGFX) ================= */
  const LANES_O = 4.5, LW = 3.0, CS = 13;
  /* the floor's light (under everything standing): the warnings (a lane marked: violet light poured down the carved channel; the
     Hour Toll's ring of gold, its two gaps lit; a second-eater's call), the imprints lying in their lanes, the borrowed seconds'
     paths, the core's gold pooled on the stones, the lanes' inlay catching it */
  function overlay(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !m) return; const F = D3.fg(), marked = FX.S.tele.filter(s => s.sa);
    if (!F) { for (const s of marked) D3.tele2D(c, FX, s, T, t); return; }
    const lf = lowFx(), Q = F.begin(c, null), C = FX.C;
    try {
      // the court's gold inlay catching the core's light: a soft pool under it, light running along the nearest lane's lips
      if (!m.dead || st3(FX).end) { const R = SH.on() ? rigNow(FX, m) : null, alt = M.alt == null ? 1.3 : M.alt, gk = (0.18 + (M.open || 0) * 0.35 + (M.menace || 0) * 0.1) * (st3(FX).end ? 1 - sstep(1.5, 3.5, st3(FX).end.t) : 1);
        Q.glow(FX.sx(m.x), FX.sy(m.y) + T * 0.2, T * (2.6 + alt * 0.4), GOLD_HI, gk, GY); if (R) for (const i of R.shad) { const p = R.A.P[i]; Q.sshadow(FX.sx(m.x + p[0]), FX.sy(m.y + p[1] * GY) + T * 0.1, T * 0.8 * WK[i], T * 0.4 * WK[i], 0.25 / (1 + p[2] * 0.25), '#05060C'); } }
      if (!lf) for (let i = 0; i < 4; i++) { const v = i < 2, o = (i % 2 ? 1 : -1) * LANES_O, ph = (t * 0.07 + i * 0.27) % 1; for (const sg of [-1, 1]) { const off = o + sg * LW / 2; const x0 = v ? C.x + off : C.x - CS + 0.5, y0 = v ? C.y - CS + 0.5 : C.y + off, a = v ? Math.PI / 2 : 0, along = (CS * 2 - 1) * ph;
          const X = FX.sx(x0 + (v ? 0 : along)), Y = FX.sy(y0 + (v ? along : 0)); Q.glow(X, Y, T * 1.4, GOLD_HI, 0.12 * Math.sin(Math.PI * ph)); } }
      for (const s of marked) tell(Q, FX, s, T, t, lf);
      for (const z of FX.S.hz) if (z.kind === 'imprint') imprint(Q, FX, z, T, t);
      for (const o of M.orbs || []) if (o.state === 'held' || o.state === 'fly') { const u = o.tele ? cl(o.tele.age / o.tele.t) : 0; D3.laneQ(Q, FX, 431, o.x, o.y, o.a, Math.max(0.5, o.len - 0.3), 0.9, T, VIOLET_HI, 0.85, 0.35 + 0.65 * u, o.spin || 1); Q.sshadow(FX.sx(o.x), FX.sy(o.y), T * 0.28, T * 0.11, 0.3, '#05060C'); }
      for (const f of st3(FX).fx) if (f.kind === 'spill') { const u = cl(f.t / f.life); Q.glow(FX.sx(f.x), FX.sy(f.y), T * (1 + 2.5 * Math.sqrt(u)), GOLD_HI, 0.35 * (1 - u), GY); if (!lf) Q.smoke(FX.sx(f.x), FX.sy(f.y) - T * 0.2, T * (0.8 + 1.6 * u), 0.3 * (1 - u), f.seed, '#B08A40'); }
    } finally { F.flush(c); } }
  function tell(Q, FX, s, T, t, lf) { const u = cl(s.age / s.t), col = s.col || VIOLET_HI, sd = s.seed || 1;
    if (s.geo === 'line') { if (s.done || s.ghost) return; if (s.w <= 1.0) return;   // (a borrowed second's path is its own light; an imprint's bite is the imprint's)
      D3.laneQ(Q, FX, 428, s.x, s.y, s.a, s.len, s.w, T, col, 0.9, u * 0.999, sd); Q.glow(FX.sx(s.x), FX.sy(s.y), T * (1 + u), col, 0.1 + 0.25 * u); }
    else if (s.geo === 'ring') { const X = FX.sx(s.x), Y = FX.sy(s.y), R = s.r1 * T * 1.04, g = s.gaps && s.gaps.length > 1 ? s.gaps : [[0, 0.4], [Math.PI, 0.4]], wa = a => Math.atan2(Math.sin(a), Math.cos(a));
      if (!s.done) Q.quad(429, X, Y, R, 0, 0, R, col, 0.35 + 0.55 * u, s.r0 / (s.r1 * 1.04), wa(g[0][0]), wa(g[1][0]) + 4); }
    else if (s.geo === 'circle') { if (s.done) return; const X = FX.sx(s.x), Y = FX.sy(s.y), R = s.r * T * 1.15; Q.quad(431, X, Y, R, 0, 0, R, col, 0.9, 2 + u * 0.999, sd, 0); } }
  /* an imprint lying in its lane: the afterimages of the body brightening as its bite nears, the lane's lips burning away as it runs */
  function imprint(Q, FX, z, T, t) { const s = z.tele, u = s ? cl(s.age / s.t) : 1, fade = Math.min(1, z.age / 0.25, (z.life - z.age) / 0.3); if (!(fade > 0.01)) return;
    D3.laneQ(Q, FX, 428, z.x, z.y, z.a, z.len, z.w, T, VIOLET_HI, fade, 2 + u * 0.999, (z.dir || 1) > 0 ? 3.3 : 7.1); if (u > 0.85) Q.glow(FX.sx(z.x + Math.cos(z.a) * z.len / 2), FX.sy(z.y + Math.sin(z.a) * z.len / 2), T * z.len * 0.4, VIOLET, 0.12 * fade * (0.6 + 0.4 * Math.sin(t * 30))); }
  /* the upper light (over everything): the hourglass's light (gold; violet while a moment is held; ablaze when bare), the stopped
     hand's burning tip and the violet ring of the face, the afterimages of a rush, the borrowed seconds, the toll's lash, its fall.
     Returns false without the painter (the 2D effects are drawn instead) */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !m) return false; const F = D3.fg(); if (!F) return false; const S = st3(FX), gl = SH.on(), lf = lowFx(), R = gl ? rigNow(FX, m) : null;
    const Q = F.begin(c, null);
    try {
      const E = S.end, live = !E;
      if (R) { const C = scr(FX, m, R.A.core, T), held = R.A.held, open = M.open || 0, dk = E ? 1 - sstep(1.4, 2.6, E.t) : 1, gc = held || (M.menace || 0) > 0.6 ? VIOLET : GOLD_HI;
        Q.glow(C[0], C[1], T * 2.0, gc, Math.min(0.9, R.A.glowC * 0.45) * dk * (0.85 + 0.15 * Math.sin(t * 5)));
        if (open > 0.05) { Q.glow(C[0], C[1], T * 1.1, '#FFF4D0', open * 0.55); Q.quad(430, C[0], C[1], T * 1.7, 0, 0, T * 1.7, GOLD_HI, open * 0.8, (M.coreRot || 0) * 0.5, 0, 5); }
        const fzK = M.fzK || 0; if (fzK > 0.03 && M.fz != null && R.A['hand' + M.fz]) { const h = scr(FX, m, R.A['hand' + M.fz], T), fc = scr(FX, m, R.A.face, T); Q.glow(h[0], h[1], T * 0.9, VIOLET_HI, fzK * 0.6); Q.glow(fc[0], fc[1], T * 2.2, VIOLET, fzK * (0.3 + 0.12 * Math.sin(t * 10)));
          if (!lf) Q.ring(fc[0], fc[1], R.A.faceR * T * (1.2 + 0.06 * Math.sin(t * 8)), VIOLET_HI, fzK * 0.55, T * 0.12); }
        if (live && (m.stunT > 0 || (M.slump || 0) > 0.5)) { const fc = scr(FX, m, R.A.face, T); for (let i = 0; i < 3; i++) { const a = (M.bt || t) * 3 + i * TAU / 3; Q.star(fc[0] + Math.cos(a) * T * 1.3, fc[1] - T * 1.1 + Math.sin(a) * T * 0.3, T * 0.26, 0.9, '#FFFFFF'); } } }
      // the afterimages of a rush: streaks of violet from the body to the head where it was
      for (const s of M.smear || []) { const u = s.t / 0.45, a = (1 - u) * 0.4, X = FX.sx(s.x), Y = FX.sy(s.y) - s.z * T, HX = FX.sx(s.hx), HY = FX.sy(s.hy) - s.hz * T; Q.rbeam(X - Math.cos(s.a) * T * 2, Y - Math.sin(s.a) * T * 2, HX, HY, T * 0.42, VIOLET_HI, a, 0.2, 1); Q.glow(HX, HY, T * 0.8, VIOLET_HI, a * 0.8); }
      // the borrowed seconds: little dials of light (hanging: their ticks going dark round them as the moment runs; loosed: streaking)
      for (const o of M.orbs || []) { const fade = o.state === 'done' ? Math.max(0, 1 - o.t / 0.3) : 1; if (fade <= 0) continue; const X = FX.sx(o.x), Yz = FX.sy(o.y) - o.z * T, r = T * 0.36;
        if (o.state === 'go') { for (let k = 1; k <= 3; k++) Q.rbeam(X, Yz, X - Math.cos(o.a) * T * k * 0.5, Yz - Math.sin(o.a) * T * k * 0.5, r * (1.0 - k * 0.2), VIOLET_HI, 0.35 * fade, 1, 0); }
        const u = o.tele ? cl(o.tele.age / o.tele.t) : 0, ha = o.state === 'go' ? (o.spin || 0) + o.t * 14 : (o.spin || 0);
        Q.glow(X, Yz, r * 3, VIOLET, (o.state === 'held' ? 0.4 + 0.25 * u : 0.5) * fade); Q.quad(430, X, Yz, r * 1.9, 0, 0, r * 1.9, VIOLET_HI, fade, ha, o.state === 'held' ? u : 0, o.state === 'go' ? 1 : 0); }
      if ((M.lash || 0) > 0.02) { const X = FX.sx(m.x), Y = FX.sy(m.y); Q.ring(X, Y - T * 0.6, T * (1.5 + 3.5 * (1 - M.lash)), GOLD_HI, 0.5 * M.lash, T * 0.3); }
      if ((M.roar || 0) > 0.05 && R) { const C = scr(FX, m, R.A.core, T); Q.glow(C[0], C[1], T * 4, VIOLET, 0.22 * M.roar); }
      for (const f of S.fx) { const u = cl(f.t / f.life);
        if (f.kind === 'flare' && R) { const C = scr(FX, m, R.A.core, T), g = sstep(0, 1, u); Q.glow(C[0], C[1], T * (1.5 + 2.5 * g), GOLD_HI, 0.5 * g); Q.glow(C[0], C[1], T * 0.8, '#FFFFFF', 0.55 * g * (0.75 + 0.25 * Math.sin(t * 31)));
          for (let i = 0; i < (lf ? 4 : 8); i++) { const a = i / 8 * TAU + 0.15 * Math.sin(t * 2 + i), Lr = T * (1.2 + 2.6 * g) * (0.7 + 0.3 * hash(i * 1.7)); Q.rbeam(C[0], C[1], C[0] + Math.cos(a) * Lr, C[1] + Math.sin(a) * Lr * 0.85, T * (0.18 + 0.2 * g), GOLD_HI, 0.5 * g, 1, 0); } }
        else if (f.kind === 'burst') { const X = FX.sx(f.x), Y = FX.sy(f.y) - (f.z || 0) * T; Q.glow(X, Y, T * f.r * (0.8 + 0.8 * u), f.col, 0.55 * (1 - u)); Q.glow(X, Y, T * f.r * 0.4, '#FFFFFF', 0.6 * (1 - u) * (1 - u)); Q.ring(X, Y, T * f.r * (0.4 + 1.4 * u), f.col, 0.5 * (1 - u), T * 0.14);
          if (!lf) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + f.seed, d = T * f.r * (0.3 + 1.3 * u); Q.star(X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.8, T * 0.3, 0.8 * (1 - u), i % 2 ? '#FFFFFF' : f.col); } } }
    } finally { F.flush(c); }
    coreLabel(c, FX, T); return true; }
  /* the bare core's word and its two arcs (as the 2D draws them: how near it is to cracking, how long it stays bare) */
  function coreLabel(c, FX, T) { const M = FX.mem, m = FX.m, co = M.coreObj; if (!(co && !co.dead && M.expose > 0)) return; const R = SH.on() ? rigNow(FX, m) : null, p = R ? scr(FX, m, R.A.core, T) : [FX.sx(m.x), FX.sy(m.y) - M.alt * T], X = p[0], Y = p[1], f = cl(co.hp / co.maxhp), w = M.expose / (M.exposeMax || 1);
    c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = Math.max(3, T * 0.14); c.beginPath(); c.arc(X, Y, T * 1.5, 0, TAU); c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(2, T * 0.09); c.beginPath(); c.arc(X, Y, T * 1.5, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke();
    c.strokeStyle = D3.rgbaH(SILVER_HI, 0.7); c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.arc(X, Y, T * 1.7, -Math.PI / 2, -Math.PI / 2 + TAU * w); c.stroke();
    c.font = `800 ${Math.round(T * 0.3)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)'; c.fillStyle = '#FFFFFF'; c.strokeText('CORE · crack it', X, Y - T * 2.0); c.fillText('CORE · crack it', X, Y - T * 2.0); c.restore(); }

  /* ================= the motion, the fall ================= */
  function update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M || !(dt > 0)) return; const S = st3(FX);
    for (let i = S.fx.length - 1; i >= 0; i--) { const f = S.fx[i]; f.t += dt; if (f.t >= f.life) S.fx.splice(i, 1); }
    const E = S.end; if (!E) return; E.t += dt;
    if (E.t >= 1.2 && !E.broke) { E.broke = true; const R = rigNow(FX, m), c0 = R ? R.A.core : [0, 0, 1.3 / ZK], x = m.x + c0[0], y = m.y + c0[1] * GY, z = c0[2] * ZK;
      FX.H.sfx.crack(); FX.H.sfx.crash(); FX.H.shake(lowFx() ? 5 : 11, 0.45); FX.H.flash(0.25, GOLD_HI); const g = FX.g; if (g) g.hitStop = Math.max(g.hitStop || 0, lowFx() ? 0.06 : 0.1);
      if (D3.fg()) { S.fx.push({ kind: 'burst', x, y, z, r: 2.2, col: GOLD_HI, t: 0, life: 0.9, seed: 2 }); S.fx.push({ kind: 'spill', x, y: y + 0.3, t: 0, life: 2.6, seed: 5 }); }
      for (let k = 0; k < (lowFx() ? 10 : 22); k++) FX.H.part({ kind: 'shard', x, y: y - z, vx: FX.rnd(-5, 5), vy: FX.rnd(-6, -1), g: 9, life: 0.9, max: 0.9, size: 3 + Math.random() * 3, rot: Math.random() * 3, vr: 8, color: k % 3 ? SILVER_HI : GOLD_HI });
      for (let k = 0; k < (lowFx() ? 8 : 18); k++) FX.H.part({ kind: 'sand', x: x + FX.rnd(-0.4, 0.4), y: y - z * 0.5, vx: FX.rnd(-1.5, 1.5), vy: FX.rnd(0.5, 2.5), g: 9, life: 0.8, max: 0.8, size: 2, color: GOLD_HI });
      FX.H.text(m.x, m.y - 3.6, 'Its last hour runs out', GOLD_HI, 15); } }
  function die(FX, m) { const S = st3(FX); if (S.end) return; S.end = { t: 0, broke: false }; if (D3.fg()) S.fx.push({ kind: 'flare', t: 0, life: 1.25, seed: 1 }); FX.H.sfx.hum(); FX.H.shake(lowFx() ? 3 : 6, 0.6); }
  /* the loading screen's jobs: the meshes, one frame off-screen (the program and the buffers ready before the fight) */
  function preload(P) { if (!P || !P.gl) return []; return [() => { SH.on(); }, () => { if (!SH.on()) return; const cv = document.createElement('canvas'); cv.width = cv.height = 16; const c = cv.getContext('2d');
    try { D3.glPass(c, K.mkView(0, 0, 0, 0, { T: 4, sx: v => 8 + v, sy: v => 8 + v }), Object.keys(SH.MESH).map((k2, i) => ({ part: k2, R: I3(), o: [0, 0, i * 0.01], s: 0.2 })), 1, { t: 0, light: 'halls' }, SH); } catch (e) { /* (the 2D centipede) */ } cv.width = cv.height = 1; }]; }
  D3.onRelease(() => { LAST = null; });
  /* a studio portrait (tests): the model alone at screen (x, y) for a memory (the 2D's own posing run on it: see the hook's studio) */
  function studio(c, x, y, FX, m, o) { o = o || {}; if (!SH.on()) return null; const T = o.T || 40, R = rig(FX, m, FX.mem.bt || 2); if (!R) return null; const V = K.mkView(m.x, m.y, 0, 0, { T, sx: v => x + (v - m.x) * T, sy: v => y + (v - m.y) * T });
    return drawRig(c, R, V, { t: FX.mem.bt || 2 }) ? R : null; }
  return { on: () => SH.on(), fx: () => !!D3.fg(), update, drawBoss, drawFx, overlay, die, preload, studio, rig: rigNow,
    __dbg: { get gl() { return SH.on(); }, get glmCanvas() { const cv = typeof GLM !== 'undefined' && GLM.canvas; return cv ? cv.width * cv.height : 0; }, set noGL(v) { SH.NOGL = !!v; }, get MESH() { return SH.MESH; }, get last() { return LAST; }, get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +SH.ms.toFixed(2), frames: SH.n, box: SH.box, meshMs: +SH.meshMs.toFixed(1), meshTris: SH.tris }); } } };
})();

/* ---------- (v463 SA) the hooks: Threnn's definition (20z1) drawn on the GPU where it can be ----------
   Wrapped here at load (20z1 loads first), so the 2D file keeps only its health hook: the model in draw (its kept 2D picture only
   without it), the floor's light (overlay), the upper light (drawFx), its warnings marked for light and its imprints left to the light
   (its FX wrapped at init), the loading screen's jobs, and its fall (ending: it slumps onto the flagstones, the hourglass shatters;
   a husk prop keeps it drawn after the kill). The 2D centipede and its 2D effects are untouched for the fallback. */
(function hookThrenn() { try {
  const D = typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.threnn; if (!D || D.__sa3) return; D.__sa3 = 1; const G = THRENN_GL, glOn = () => G.on(), fxOn = () => G.fx();
  const o = { init: D.init, update: D.update, draw: D.draw, drawFx: D.drawFx, keep: D.keep };
  D.init = function (FX) { SEP3.wrapFX(FX, { skipHz: z => z.kind === 'imprint' }); FX.mem.g3 = null; return o.init.call(this, FX); };
  D.update = function (FX, dt) { const M = FX.mem, m = FX.m, S = M && M.g3, E = S && S.end;
    if (E && m) { if (E.t > 2.6) { G.update(FX, dt); return; } const s0 = m.stunT; m.stunT = 1; try { o.update.call(this, FX, dt); } finally { m.stunT = s0; } M.alt = Math.max(0.55, (M.alt || 1) - dt * 0.6); G.update(FX, dt); return; }
    o.update.call(this, FX, dt); G.update(FX, dt); };
  Object.defineProperty(D, 'keep', { configurable: true, get() { return glOn() ? null : o.keep; } });
  D.draw = function (c, FX, m, X, Y, T, t, step) { if (glOn() && G.drawBoss(c, FX, m, X, Y + (m.z || 0) * T * 4, T, t)) return; return o.draw.call(this, c, FX, m, X, Y, T, t, step); };
  D.overlay = function (c, FX, t, T) { if (FX.m) G.overlay(c, FX, t, T); };
  D.drawFx = function (c, FX, T, t) { if (G.drawFx(c, FX, T, t)) return; return o.drawFx.call(this, c, FX, T, t); };
  D.preload = function (P) { return G.preload(P); };
  D.ending = function (FX, m) { if (!glOn()) return null; const M = FX.mem; FX.noParts(); FX.weak('core', 0, 0, 0, 0, false); FX.S.tele.length = 0; M.orbs = []; M.bite = null; M.bm = null; M.fzOn = false; m.stunT = 0;
    for (let i = FX.S.hz.length - 1; i >= 0; i--) if (FX.S.hz[i].kind === 'imprint') FX.S.hz.splice(i, 1);
    if (!M.husk) { M.husk = { kind: 'thrennHusk', x: m.x, y: m.y + 0.05 }; FX.S.props.push(M.husk); } G.die(FX, m);
    return { title: 'THRENN FALLS OUT OF TIME', sub: 'Its hourglass shatters, and the sand runs out over the stones', col: '#E8CF8E', delay: 4.4, bannerAt: 1.3, fanfareAt: 1.3, quiet: true, slow: 0.5 }; };
  D.drawProp = function (c, FX, p, X, Y, T, t) { const m = FX.m; if (p.kind !== 'thrennHusk' || !m || !glOn()) return; G.drawBoss(c, FX, m, FX.sx(m.x), FX.sy(m.y), T, t); };
  D.MODEL = G;
} catch (e) { if (typeof console !== 'undefined') console.warn('Threnn GL hook', e); } })();
