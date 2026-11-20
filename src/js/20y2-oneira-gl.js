/* ---------- (v433 DB) DUNE3: what Rift 03's second and third bosses share on the GPU ----------
   On GB_KIT (20x2: the Garden bosses' vectors, rotations, the game camera, the floor shadow, deforming and multi-copy meshes),
   with the dunes' own light: each pass of a model here is lit by the dusk under the jaw (a warm amber key from the upper left, a
   cyan rim from behind) or by the night of the Moonlit Dunes (a cool moon key, a blue rim), carried to the materials (GLM 360..389,
   the DB-DUNE-MAT block in 20k5uz) as uAmb (the key's colour) and uRim; a pass may be cut at the sand (S.clip: what is under it is
   not drawn, so a thing can rise out of the sand or sink into it). Also: a model's GL state (meshes built once on first use,
   failures counted: three in 20 s and the 2D art is drawn for the session; window.__DB_GL = 1 forces the GPU on a software
   rasteriser for tests, 0 keeps it off), kept pictures of still things at a zoom, the warnings marked so the engine paints
   nothing of them (their picture is light on the sand, drawn by the boss's own overlay), the rift's main-boss health factor, and
   the letting go when a new stage is made (the pictures dropped, the meshes' GPU buffers freed: they upload again when drawn). */
const DUNE3 = (() => {
  const K = GB_KIT, { TAU, vadd, vsub, vmul, vdot, vnrm, mv, mm, frameXZ, GY } = K, nowMs = K.nowMs, lowFx = K.lowFx;
  const win = k => { try { return typeof window !== 'undefined' ? window[k] : undefined; } catch (e) { return undefined; } };
  const MODELS = [];
  function model(name, build) {
    const G = { name, MESH: null, PB: {}, NOGL: false, fails: 0, last: 0, retry: 0, ms: 0, n: 0, box: null, meshMs: 0,
      fail() { const t = nowMs(); if (t - G.last > 20000) G.fails = 0; G.last = t; G.fails++; if (G.fails >= 3) G.NOGL = true; else G.retry = t + 1500; },
      on() { if (G.NOGL || (G.retry && nowMs() < G.retry) || typeof GLM === 'undefined' || win('__DB_GL') === 0 || !GLM.ok()) return false; if (GLM.soft && !win('__DB_GL')) return false;
        if (!G.MESH) { try { const t0 = nowMs(); G.MESH = build(); G.meshMs = nowMs() - t0; } catch (e) { G.NOGL = true; if (typeof console !== 'undefined') console.warn(name + ': meshes', e); return false; } } return true; },
      bounds(part) { let b = G.PB[part]; if (b) return b; const M = G.MESH && G.MESH[part]; if (!M) return [[0, 0, 0], 1.6]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
        for (let i = 0; i < p.length; i += 3) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); }
        return (G.PB[part] = [[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) + (z1 - z0) * (z1 - z0)) / 2]); },
      get tris() { return G.MESH ? Object.values(G.MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0; } };
    MODELS.push(G); return G; }
  /* the lights (world: x east, y south, z up) */
  const LIGHT = { dusk: { lk: vnrm([-0.55, 0.28, 0.79]), ls: vnrm([0.3, 0.15, 0.94]), lr: vnrm([0.5, -0.8, 0.33]), key: [1.34, 1.1, 0.84], rim: [0.42, 0.95, 1.05] },
    night: { lk: vnrm([-0.5, 0.2, 0.84]), ls: vnrm([0.35, 0.25, 0.9]), lr: vnrm([-0.35, -0.85, 0.38]), key: [0.92, 0.98, 1.22], rim: [0.5, 0.72, 1.2] } };
  const UPW = [0, 0, 1], CW = K.CW, GLCAP = 1500, OUTC = [0.06, 0.035, 0.07], GLI = [], GLJ = [], OCC = new Float32Array(48);
  /* one GPU pass (as GB_KIT's, with the dunes' light): parts ({ part, R, o, s, sc, al, glow, glow2, spill, kind, fx, wear, outline, dz })
     into the box round them; o: { t, light ('dusk' | 'night'), clip (the sand's level: nothing under it), occ, flash, outline, into } */
  function glPass(c, V, list, al0, o, G) {
    const k = V.k, PX = [1, 0, 0], PY = [0, GY, -K.ZK], PD = CW, X0 = [V.X0, V.Y0], LT = LIGHT[o.light] || LIGHT.dusk;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { if (!G.MESH[it.part]) continue; const [bc, brr] = G.bounds(it.part), sc = it.sc || [1, 1, 1], s = it.s || 1, sm = s * Math.max(sc[0], sc[1], sc[2]), rr = brr * sm * 1.05 * k,
        lc = [bc[0] * sc[0] * s, bc[1] * sc[1] * s, bc[2] * sc[2] * s], w = mv(V.Rh, vadd(it.o, mv(it.R, lc))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return false;
    if (o.clip != null) { const yc = X0[1] - (o.clip - 0.05) * K.ZK * k; if (by1 > yc + 6 * k) by1 = Math.max(by0 + 2, yc + 6 * k); }   // (below the sand nothing shows lower than the far rim of what stands on it)
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !win('__DB_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.45 : 1) * (o.res || 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: LT.lk, ls: LT.ls, lr: LT.lr, up: UPW, low: o.low != null ? o.low : lowFx(), rim: LT.rim, amb: LT.key, t: (o.t || 0) % 600,
      outline: o.outline === 0 ? 0 : Math.max(1, 1.0 * (W / bw)), outlineCol: OUTC };
    if (o.clip != null) S.clip = [o.clip, 1e-6];
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
  /* a tube along a curve P(u) (u 0..1), its radius r(u, around); vA.y = e(u, v), vA.z = a(u, v) (default: u) */
  function tubeC(B, P, r, m, nu, nv, o) { o = o || {}; const up = o.up || [0, 0, 1], fr = u => frameXZ(vsub(P(Math.min(1, u + 0.01)), P(Math.max(0, u - 0.01))), up);
    B.surf((u, v) => { const F = fr(u), a = v * TAU, rr = r(u, a); return vadd(P(u), vadd(vmul(F.y, Math.cos(a) * rr), vmul(F.z, Math.sin(a) * rr))); }, nu, nv, o.mf || (() => m), { e: o.e || (() => 0), a: o.a || (u => u), flip: true });
    return B; }
  /* still things kept as pictures at a zoom (key: what is drawn); dropped on release */
  const PICS = new Map();
  function pic(c, G, key, T, make, light, clip) { const m0 = c.getTransform ? c.getTransform() : null, dev = m0 ? Math.max(0.25, Math.hypot(m0.a, m0.b)) : 1, qz = Math.round(Math.log(Math.max(1, T * dev)) * 10), Tq = Math.exp(qz / 10) / dev, k2 = G.name + '|' + key + '|' + qz;
    const P = PICS.get(k2); if (P) return { P, f: T / Tq }; if (!G.on()) return null;
    const V0 = K.mkView(0, 0, 0, 0, { T: Tq, sx: v => v, sy: v => v }); let out = null;
    try { glPass(c, V0, make(), 1, { t: 0, light, clip, into: (cvs, W, H, bx0, by0, bw, bh) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(cvs, 0, 0); out = { cv, bx0, by0, bw, bh }; } }, G); } catch (e) { G.fail(); }
    if (!out) return null; if (PICS.size > 20) dropPics(); PICS.set(k2, out); return { P: out, f: T / Tq }; }
  function dropPics() { for (const P of PICS.values()) if (P && P.cv) P.cv.width = P.cv.height = 1; PICS.clear(); }
  function blitPic(c, p, X, Y) { const P = p.P, f = p.f; c.drawImage(P.cv, 0, 0, P.cv.width, P.cv.height, X + P.bx0 * f, Y + P.by0 * f, P.bw * f, P.bh * f); }
  /* the shared GPU painter (window.__DB_FX = 0 keeps the 2D effects: tests) */
  const fg = () => { try { if (win('__DB_FX') === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  /* a warning marked for light: the engine's own (its shape kept as geo for the strike, the same moment and damage), shape 'fn' so the
     engine paints nothing of it. Without the painter it stays the engine's own 2D warning */
  function mark(FX, o) { if (!fg()) return FX.tele(o); const geo = o.shape; let s = null;
    s = FX.tele(Object.assign(o, { geo, shape: 'fn', seed: Math.random() * 40, test: (x, y, rr) => { s.shape = s.geo; const r = FX.inShape(s, x, y, rr); s.shape = 'fn'; return r; } })); return s; }
  /* a marked warning drawn as the engine drew it (the painter lost mid-fight) */
  const rgbaH = (h, a) => { const n = parseInt(h.slice(1, 7), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a)).toFixed(3)})`; };
  function tele2D(c, FX, s, T, t) { const u = Math.max(0, Math.min(1, s.age / s.t)), col = s.col || '#62BFC9', X = FX.sx(s.x), Y = FX.sy(s.y), geo = s.geo;
    const path = grow => { c.beginPath();
      if (geo === 'circle') c.arc(X, Y, Math.max(0.1, s.r * T * grow), 0, TAU);
      else if (geo === 'line') { c.save(); c.translate(X, Y); c.rotate(s.a); c.rect(0, -s.w / 2 * T, s.len * T * grow, s.w * T); c.restore(); }
      else if (geo === 'ring') { const r0 = s.r0 * T, r1 = s.r0 * T + (s.r1 - s.r0) * T * grow; if (s.gaps && s.gaps.length) { const gs = s.gaps.map(([a, w]) => [a - w, a + w]).sort((p, q) => p[0] - q[0]); for (let i = 0; i < gs.length; i++) { const b0 = gs[i][1], b1 = gs[(i + 1) % gs.length][0] + (i === gs.length - 1 ? TAU : 0); c.moveTo(X + Math.cos(b0) * r1, Y + Math.sin(b0) * r1); c.arc(X, Y, r1, b0, b1); c.arc(X, Y, r0, b1, b0, true); c.closePath(); } } else { c.arc(X, Y, r1, 0, TAU); c.moveTo(X + r0, Y); c.arc(X, Y, r0, 0, TAU, true); } } };
    if (s.done && !s.linger) return;
    c.save(); path(1); c.fillStyle = rgbaH('#0A0410', 0.13); c.fill('evenodd'); c.globalCompositeOperation = 'lighter';
    path(geo === 'ring' ? 1 : u); c.fillStyle = rgbaH(col, 0.04 + u * 0.1); c.fill('evenodd');
    path(1); c.lineWidth = 1.5 + u * 1.5; c.strokeStyle = rgbaH(col, 0.45 + 0.4 * Math.sin(t * 18) * u + u * 0.3); c.stroke(); c.restore(); }
  /* the rift's main-boss health factor (riftDef's F.rift.foeK.boss; 1 elsewhere) */
  const bossK = FX => { const F = FX && FX.F && FX.F.rift && FX.F.rift.foeK; return F && F.boss > 0 ? F.boss : 1; };
  /* letting go: when a new stage is made (BEL.releaseStale, 20n) the pictures are dropped and every mesh's GPU buffers freed (their
     arrays stay: they upload again when next drawn); each boss adds its own (its pointer to the last fight) */
  const REL = [];
  function release() { dropPics(); for (const G of MODELS) if (G.MESH && typeof GLM !== 'undefined' && GLM.free) for (const k in G.MESH) if (G.MESH[k]) GLM.free(G.MESH[k]); for (const f of REL) try { f(); } catch (e) { /* (nothing to drop) */ } }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(release); } catch (e) { /* (no rift hook) */ }
  return { K, LIGHT, model, glPass, tubeC, pic, blitPic, dropPics, fg, mark, tele2D, bossK, rgbaH, onRelease: f => REL.push(f), release, get picN() { return PICS.size; } };
})();

/* ---------- (v433 DB) ONEIRA THE LISTENING SHELL in three dimensions (Rift 03, section 2's boss: The Whorl) ----------
   The 2D shell of 20y-rift-fiend-dunes-2.js rebuilt as a GPU model at the Drowned Belfry's fidelity: GLM meshes built once (in the
   loading screen's jobs, else on the first draw), posed every frame with secondary motion, one composite drawImage; its materials
   GLM 360..364 (DB-DUNE-MAT, 20k5uz), the light of its moves on the shared FGFX painter (kinds 264..267, DB-FX in 20k6h). The fight
   keeps its acts, timings, shapes and damage; its warnings are light on the sand (no outlines, no numbers). Without WebGL (or on a
   software rasteriser, unless window.__DB_GL) the 2D shell is drawn as before; without the painter its effects are the old 2D ones.
   The model (tiles, z up from the sand, x the way its opening faces): a planispiral shell the height of a house, its coil a
   logarithmic spiral (2.7x a turn), each whorl wrapping the one before so only the last shows, its keel ribbed, bleached bone
   flame-banded with basalt and grown in fine lines; a row of resonance pores down its keel and flanks that pulse cyan with every
   echo, the seam between its whorls humming before it calls; a flared lip of polished bone round the opening and dark nacre deep in
   it that glows; out of the opening a soft wet mantle, eight short feelers round its lower rim, and five eyes on stalks (each two
   segments and a knuckle, the eye lidded and blinking in turn), swaying, gathering forward to aim, splaying in a roar, flinching
   on a blow, drooping onto the sand when it is deafened. It drifts and bobs, banks into its turns, tips back before a slam and
   comes down squashing, lies on its side with the mantle lolling out when deafened. The echo stones are basalt slabs with an
   ammonite fossil in the face that lights cyan. */
const ONEIRA_GL = (() => {
  const D3 = DUNE3, K = GB_KIT, { TAU, cl, lerp, sstep, ease, GY, ZK, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv, mm, rotX, rotY, rotZ, frameXZ, hash, angTo, headOf } = K, lowFx = K.lowFx;
  const M_SHELL = 360, M_PORE = 360.2, M_LIP = 360.4, M_DEEP = 360.3, M_FLESH = 361, M_STALK = 361.2, M_LID = 361.4, M_EYE = 362, M_BASALT = 363, M_FOSSIL = 363.2, M_SAND = 364;
  const CYAN = '#62BFC9', CYAN_HI = '#C8F6F8', AQUA = '#8FF6FF', BONE = '#E7D9B1', BONE_HI = '#FBF4E0', OCHRE = '#CDA15E', OCHRE_HI = '#EBC98A', DUST = '#8A6A44';
  /* the coil: a logarithmic spiral in the x-z plane (its axis y), the opening at its foot facing +x */
  const R0 = 2.15, GR = 2.7, BB = Math.log(GR) / TAU, KR = 0.47, KW = 0.62, TURNS = 1.8, THA = -Math.PI / 2, TH0 = THA - TURNS * TAU;
  const rOf = th => R0 * Math.exp(BB * (th - THA));
  const TA = vnrm([1, 0, -BB]), NA = [0, 0, -1], A0 = [0, 0, -R0], AH = KR * R0, AW = KW * R0, LOW = R0 * (1 + KR);
  const NE = 5, NC = 16;
  const SH = D3.model('Oneira', buildMeshes);
  /* the ribs (v433 DB, second pass): primary ribs (NR a turn) sweeping forward toward the keel, a secondary rib intercalated between each
     pair on the outer flank (so each rib seems to fork as it nears the keel), two rows of tubercles on the primaries (ventrolateral and
     umbilical), a keel down the venter; returned as the outward swell of the whorl (of its size) and the crest's height 0..1 */
  const NR = 13, ribPh = (th, a) => th * NR + 0.42 * a * a;
  function ribAt(th, ph) { const a = Math.abs(ph), s = ribPh(th, a), fl = sstep(0.06, 0.3, a) * sstep(2.55, 2.0, a), pr = Math.pow(0.5 + 0.5 * Math.cos(s), 7) * fl, sc2 = Math.pow(0.5 + 0.5 * Math.cos(s + Math.PI), 7) * sstep(1.3, 0.75, a) * fl * 0.8;
    const tub = pr * pr * (0.13 * Math.exp(-sq((a - 0.95) / 0.15)) + 0.09 * Math.exp(-sq((a - 1.95) / 0.16))), keel = 0.1 * Math.exp(-sq(a / 0.1)) * (0.85 + 0.15 * Math.cos(s * 2));
    const crest = Math.max(pr, sc2); return { d: 0.11 * crest + tub + keel, crest: Math.min(1, crest + tub * 8 + keel * 6), s }; }
  const sq = x => x * x;
  function buildMeshes() {
    const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(3, Math.round(n * DQ)), fin = (k, B) => { out[k] = B.done(); };
    /* ---- the shell: the coil, its ribs, tubercles and keel in the geometry (vA.y the crest's height, vA.z the band's phase along the
       ribs), flaring a little at the opening; glowing pores set in sockets on the ventrolateral tubercles ---- */
    { const B = nb();
      B.surf((u, v) => { const th = TH0 + (THA - TH0) * u, r = rOf(th), ph = (v - 0.5) * TAU, R = ribAt(th, ph), fl = 1 + 0.07 * sstep(0.975, 1, u), d = (1 + R.d * sstep(0.1, 0.35, u)) * fl, rr = r * (1 + KR * Math.cos(ph) * d); return [rr * Math.cos(th), KW * r * Math.sin(ph) * d, rr * Math.sin(th)]; },
        q(360), q(40), () => M_SHELL, { e: (u, v) => ribAt(TH0 + (THA - TH0) * u, (v - 0.5) * TAU).crest, a: (u, v) => ribAt(TH0 + (THA - TH0) * u, (v - 0.5) * TAU).s / TAU / 3, flip: true });
      for (let j = 0; j < 40; j++) { const a0 = 0.95, th = (TAU * j - 0.42 * a0 * a0) / NR; if (th > THA - 0.35 || th < THA - TAU * 0.95 || j % 2) continue;
        for (const sg of [1, -1]) { const ph = sg * a0, r = rOf(th), R = ribAt(th, ph), d = 1 + R.d, rr = r * (1 + KR * Math.cos(ph) * d), p = [rr * Math.cos(th), KW * r * Math.sin(ph) * d, rr * Math.sin(th)];
          const n = vnrm([Math.cos(th) * Math.cos(ph) / KR, Math.sin(ph) / KW, Math.sin(th) * Math.cos(ph) / KR]), k = 0.55 + 0.45 * r / R0, z2 = vnrm(vcross(n, [0, 1, 0])), y2 = vcross(n, z2);
          B.push(z2, y2, n, p); B.tor([0, 0, 0.01], 0.1 * k, 0.04 * k, M_BASALT, { seg: q(12), rseg: 5 }); B.sph([0, 0, -0.01], 0.075 * k, M_PORE, q(8)); B.pop(); } }
      fin('shell', B); }
    /* the lip: a flared collar of polished bone round the opening, scalloped at its edge, a rolled rim on it (vA.y its inner side) */
    { const B = nb(), ot = ph => vnrm(vadd(vmul(NA, Math.cos(ph) / AH), [0, Math.sin(ph) / AW, 0])), ring = (ph, k) => vadd(vadd(A0, vmul(NA, AH * Math.cos(ph) * k)), [0, AW * Math.sin(ph) * k, 0]);
      const scal = ph => 0.07 * (0.5 + 0.5 * Math.cos(ph * 11)), FL = (ph, v) => vadd(vadd(ring(ph, 1.0 + 0.2 * v), vmul(ot(ph), scal(ph) * v)), vmul(TA, -0.05 + 0.26 * v - 0.08 * v * v));
      B.surf((u, v) => FL(u * TAU, v), q(66), q(4), () => M_LIP, { e: (u, v) => 1 - v, a: u => u });
      B.surf((u, v) => { const ph = u * TAU, ps = v * TAU, P0 = FL(ph, 1), tr = 0.075 + 0.02 * Math.cos(ph * 11); return vadd(P0, vadd(vmul(ot(ph), Math.cos(ps) * tr), vmul(TA, Math.sin(ps) * tr))); }, q(66), q(6), () => M_LIP, { e: (u, v) => Math.max(0, -Math.cos(v * TAU)), a: u => u });
      fin('lip', B); }
    /* the opening's depths: a dish of dark nacre set back in it (vA.y how deep) */
    { const B = nb(); B.surf((u, v) => { const rho = u, ph = v * TAU; return vadd(vadd(A0, vmul(TA, -0.75 * (1 - rho * rho))), vadd(vmul(NA, AH * Math.cos(ph) * rho * 0.99), [0, AW * Math.sin(ph) * rho * 0.99, 0])); }, q(6), q(28), () => M_DEEP, { e: u => 1 - u, a: u => u });
      fin('deep', B); }
    /* the mantle (its own frame: x out of the opening): a soft lumpy body, a hood of folds over it, rounded at its snout (vA.y its folds) */
    { const B = nb(); B.surf((u, v) => { const x = -0.35 + 1.55 * u, ph = v * TAU, sw = Math.sqrt(Math.max(0, 1 - Math.pow(u, 2.4))) * (1 + 0.07 * Math.sin(u * 9.4)), lump = 1 + 0.07 * Math.sin(ph * 5 + u * 5) * sstep(0.15, 0.5, u) + 0.04 * Math.sin(ph * 9 - u * 7) + 0.05 * Math.pow(Math.max(0, Math.sin(ph)), 3) * Math.sin(u * 22);
        return [x, Math.cos(ph) * AW * 0.86 * sw * lump, Math.sin(ph) * AH * 0.82 * sw * lump * (Math.sin(ph) < 0 ? 0.78 : 1)]; }, q(24), q(24), () => M_FLESH, { e: (u, v) => sstep(0.3, 1, -Math.sin(v * TAU * 5 + u * 5)), a: u => u, flip: true });
      fin('mantle', B); }
    /* a palp (unit length along x, curling down and in at its tip; vA.z along it), ringed */
    { const B = nb(); D3.tubeC(B, u => [u * 0.85, 0, -0.32 * u * u + 0.05 * Math.sin(u * 5)], u => (0.075 * (1 - u) + 0.014) * (1 - 0.15 * Math.pow(0.5 + 0.5 * Math.cos(u * TAU * 7), 4)), M_STALK, q(12), q(7), { e: u => Math.pow(0.5 + 0.5 * Math.cos(u * TAU * 7), 4), a: u => u }); fin('palp', B); }
    /* an eye stalk (unit length along x; vA.z along it): six swollen segments, tapering; a knuckle; the eye; its lids */
    { const B = nb(); B.surf((u, v) => { const ph = v * TAU, seg = Math.pow(0.5 + 0.5 * Math.cos(u * TAU * 6), 3), r = (0.17 - 0.07 * u) * (0.86 + 0.16 * (1 - seg)); return [u, Math.cos(ph) * r, Math.sin(ph) * r]; }, q(36), q(10), () => M_STALK, { e: u => Math.pow(0.5 + 0.5 * Math.cos(u * TAU * 6), 3), a: u => u, flip: true });
      fin('stalk', B); }
    { const B = nb(); B.sph([0, 0, 0], 0.17, M_FLESH, q(12)); fin('knob', B); }
    { const B = nb(); B.sph([0, 0, 0], 1, M_EYE, q(26)); fin('eye', B); }
    { const B = nb(); B.ell([0, 0, 0], [1.1, 1.12, 1.1], M_LID, { seg: q(16), rings: q(7), th0: 0, th1: 1.62, ph0: -Math.PI / 2, ph1: Math.PI / 2, rim: true }); fin('lid', B); }
    { const B = nb(); B.ell([0, 0, 0], [1.08, 1.1, 1.08], M_LID, { seg: q(16), rings: q(5), th0: 1.95, th1: Math.PI, ph0: -Math.PI / 2, ph1: Math.PI / 2, rim: true }); fin('lidL', B); }
    /* an echo stone: a standing slab of basalt (its face to the south), an ammonite fossil set in its face, rubble and sand at its foot */
    { const B = nb(), pts = [[-0.85, 0], [-0.82, 1.3], [-0.38, 2.15], [0.36, 2.06], [0.86, 1.05], [0.82, 0]];
      B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); B.prism(pts, -0.3, 0.3, M_BASALT, { b: 0.07 }); B.pop();
      D3.tubeC(B, u => { const th = u * 3.1 * TAU, rr = 0.06 + th * 0.027; return [-0.04 + Math.cos(th) * rr, 0.31, 1.12 + Math.sin(th) * rr]; }, u => 0.03 + 0.05 * u, M_FOSSIL, q(60), q(6), { up: [0, 1, 0] });
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.4, d = 0.95 + 0.25 * hash(i * 3.1), k = 0.16 + 0.1 * hash(i * 7.7); B.ell([Math.cos(a) * d, Math.sin(a) * d * 0.7, 0.04], [k * 1.3, k, k * 0.8], M_BASALT, { seg: 7, rings: 4 }); }
      B.ell([0, 0, -0.02], [1.35, 0.8, 0.26], M_SAND, { seg: q(18), rings: q(5), th1: Math.PI / 2 + 0.15 });
      fin('stone', B); }
    return out; }

  /* ================= the rig ================= */
  /* P: a (heading), hc (the coil's centre above the sand), pitch (+ tips back), roll, sq ([x, y, z] a blow's or a landing's squash),
     sc (breath), ext (the mantle out of the opening), droop, br, eyes ([{ d0, d1, L1, L2, er, blink, glow }]), pet (model point),
     dizzy, pores, seam, deep, mglow, cir (the feelers' sway phase), flash, dead, alpha */
  function blankPose() { return { a: 0, hc: LOW + 0.3, pitch: 0, roll: 0, sq: [1, 1, 1], sc: 1.08, ext: 1.1, droop: 0.12, br: 0, eyes: null, pet: [6, 0, 0.4], dizzy: 0, pores: 0.3, seam: 0, deep: 0.4, mglow: 0, cir: 0, flash: 0, dead: 0, alpha: 1 }; }
  function defEyes(P, aim, roar, menace, slump, hs) { const out = [];
    for (let i = 0; i < NE; i++) { const f = (i - 2) / 2, spr = (0.9 - aim * 0.45 + roar * 0.4) * (1 - slump * 0.3), Lk = 1.75 * (0.95 + 0.25 * Math.abs(f) + menace * 0.3 + roar * 0.3 - hs * 0.35) * (1 - slump * 0.2);
      out.push({ d0: vnrm([0.25 + 0.2 * aim - slump * 0.1, f * 0.6 * spr, 1 - slump * 1.25]), d1: vnrm([0.7 + 0.5 * aim, f * 0.9 * spr, 0.55 - slump * 1.1]), L1: 0.6 * Lk, L2: 0.5 * Lk, er: (i === 2 ? 0.44 : 0.36) * (1 + roar * 0.1), blink: 0, glow: 0.35 + menace * 0.9 + roar }); }
    return out; }
  function rig(P, t) {
    const inst = [], A = {}, dead = cl(P.dead || 0), fl = P.flash || 0;
    const I = (part, R, o, ex) => { const it = { part, R, o, s: 1, al: 1, glow: 0, glow2: fl * 0.85, spill: 0, kind: 0, fx: dead * 0.8, wear: 0.5 }; if (ex) Object.assign(it, ex); inst.push(it); return it; };
    const C = [0, 0, P.hc], Rb = mm(rotX(P.roll || 0), rotY(-(P.pitch || 0))), sq = P.sq || [1, 1, 1], sc = P.sc || 1, SQ = [sq[0] * sc, sq[1] * sc, sq[2] * sc];
    const toB = p => vadd(C, mv(Rb, [p[0] * SQ[0], p[1] * SQ[1], p[2] * SQ[2]]));
    I('shell', Rb, C, { sc: SQ, glow: P.pores, spill: P.seam, wear: 0.31 }); I('lip', Rb, C, { sc: SQ, wear: 0.62 }); I('deep', Rb, C, { sc: SQ, glow: P.deep, wear: 0.4, outline: false });
    A.shell = C; A.mouth = toB(vadd(A0, vmul(TA, 0.8))); A.top = toB([0, 0, 1.6]);
    // the mantle out of the opening, drooping toward the sand (deafened, lolling out onto it; never under it)
    const ext = P.ext || 1, mo = toB(vadd(A0, vmul(TA, -0.12))), d0 = mv(Rb, TA), upB = mv(Rb, [0, 0, 1]);
    let dr = P.droop || 0, dmW = null, Rm = null;
    for (let k = 0; k < 4; k++) { dmW = vnrm(vadd(vmul(d0, Math.cos(dr)), [0, 0, -Math.sin(dr)])); Rm = frameXZ(dmW, upB); const tz = mo[2] + dmW[2] * 1.15 * ext - 0.55 * Math.abs(Rm.z[2]); if (tz > 0.3 || dr <= 0) break; dr = Math.max(0, dr - 0.25); }
    const br = P.br || 0; I('mantle', Rm, mo, { sc: [ext, 1 + 0.03 * br, 1 + 0.03 * br], glow: P.mglow || 0, wear: 0.45 });
    const toM = p => vadd(mo, mv(Rm, [p[0] * ext, p[1], p[2]]));
    A.mantle = toM([1.0, 0, 0.1]);
    // the feelers round its lower rim, swaying
    const cir = P.cir || 0;
    // a fringe of palps round the mantle's rim (a ring low and to the sides, a shorter ring under the hood), each curling and swaying
    for (let k = 0; k < NC; k++) { const ring = k < 11 ? 0 : 1, kk = ring ? k - 11 : k, n2 = ring ? 5 : 11, ang = ring ? Math.PI / 2 + (kk / (n2 - 1) - 0.5) * 2.0 : -Math.PI / 2 + (kk / (n2 - 1) - 0.5) * 3.6, rt = toM([ring ? 0.32 : 0.16, Math.cos(ang) * AW * (ring ? 0.55 : 0.74), Math.sin(ang) * AH * (ring ? 0.62 : 0.66)]), ot = mv(Rm, [0, Math.cos(ang), Math.sin(ang)]), sw = Math.sin(cir * 2.3 + k * 1.7) * 0.35;
      const dir = vnrm(vadd(vadd(vmul(dmW, 0.85), vmul(ot, ring ? 0.35 : 0.6)), [0, 0, (ring ? 0.1 : -0.25) + sw * 0.4 - dead * 0.5])), L = (ring ? 0.7 : 1.05 + 0.3 * hash(k * 2.3)) * (1 - 0.3 * dead);
      I('palp', frameXZ(vadd(dir, vmul(mv(Rm, [0, 1, 0]), sw * 0.3)), vadd(ot, [0, 0, 0.3])), rt, { s: L, glow: (P.mglow || 0) * 0.8, wear: 0.05 + k * 0.07 }); }
    // the eyes on their stalks: two segments and a knuckle, the eye at the end, its lid
    const E5 = P.eyes || defEyes(P, 0, 0, 0, 0, 0);
    for (let i = 0; i < NE; i++) { const E = E5[i], f = (i - 2) / 2, root = toM([0.62 + 0.12 * (1 - Math.abs(f)), f * 0.62, AH * 0.58]), J = vadd(root, vmul(E.d0, E.L1)), X = vadd(J, vmul(E.d1, E.L2));
      I('stalk', frameXZ(E.d0, [0, 0, 1]), root, { sc: [E.L1 + 0.04, 1, 1], glow: E.glow * 0.3, wear: 0.1 + i * 0.17 });
      I('knob', I3(), J, { s: 0.72, wear: 0.3 + i * 0.1 });
      I('stalk', frameXZ(E.d1, [0, 0, 1]), J, { sc: [E.L2 + 0.04, 0.62, 0.62], glow: E.glow, wear: 0.2 + i * 0.17 });
      const gz = P.dizzy ? vnrm([Math.cos(t * 6 + i) * 0.5 + 0.3, Math.sin(t * 6 + i * 1.7) * 0.8, Math.cos(t * 5.3 + i) * 0.5]) : vnrm(vadd(vnrm(vsub(P.pet || [6, 0, 0.4], X)), vmul(mv(rotZ(-(P.a || 0)), [0, 0.6945, 0.7195]), 0.5))), Re = frameXZ(gz, [0, 0, 1]);   // (turned a little toward the view)
      I('eye', Re, X, { s: E.er, kind: P.dizzy || 0, glow: E.glow, wear: 0.9 });
      I('lid', mm(Re, rotY(lerp(-2.1, 0.6, cl(E.blink)))), X, { s: E.er, wear: 0.55, outline: false }); I('lidL', mm(Re, rotY(lerp(0.85, -0.2, cl(E.blink)))), X, { s: E.er, wear: 0.6, outline: false });
      A['eye' + i] = X; }
    return { inst, A, Rb }; }

  /* ================= drawing ================= */
  let LAST = null;
  function drawModel(c, x, y, P, o) { if (!SH.on()) return null; const t = o.t || 0, R = o.R || rig(P, t), V = K.mkView(x, y, 0, P.a || 0, o); LAST = { R, V };
    if (o.shadow !== false) K.shadow(c, V, R.inst.filter(it => it.part === 'shell' || it.part === 'mantle'), 0.85 * (1 - 0.5 * cl(P.dead || 0)) * (P.alpha == null ? 1 : P.alpha), SH);
    let ok = false; try { ok = D3.glPass(c, V, R.inst, P.alpha == null ? 1 : P.alpha, { t, flash: o.flash, light: 'dusk', occ: lowFx() ? null : [[R.A.shell, 2.1]] }, SH); } catch (e) { SH.fail(); if (typeof console !== 'undefined') console.warn('Oneira: draw', e); ok = false; }
    return ok ? R : null; }
  const anchorOf = (R, name, x, y, a) => { const p = R && R.A[name]; if (!p) return null; const w = mv(rotZ(a), p); return { x: x + w[0], y: y + w[1] * GY, z: w[2] }; };
  const vis = p => ({ x: p.x, y: p.y - p.z * ZK });   // (where a body point shows: the floor point a tap there lands on)
  const toBody = (wx, wy, x, y, a) => { const dx = wx - x, dy = (wy - y) / GY, c = Math.cos(a), s = Math.sin(a); return [dx * c + dy * s, -dx * s + dy * c]; };

  /* ================= the fight's side: its memory (M.g3), the pose of this moment, the secondary motion ================= */
  function st3(FX, m) { const M = FX.mem; let S = M.g3; if (S) return S; S = M.g3 = { P: blankPose(), eyes: Array.from({ length: NE }, () => ({ oy: 0, oz: 0, vy: 0, vz: 0 })), fx: [], lean: 0, rock: 0, hdA: null, side: 1, vr: 0, pvx: 0, pvy: 0, hs0: 0, slamOn: false, pulse: 0, lastE: null, R: null, Rt: -1, cir: 0 }; return S; }
  function init(FX) { FX.mem.g3 = null; st3(FX, FX.m); }
  const apOf = M => (M.ap == null ? Math.PI / 2 : M.ap);
  /* the way the model faces: the 2D shell turns its opening round in the picture's plane; in three dimensions the coil is kept broadside
     to the view (its opening to the east or the west, turned up to 0.8 rad toward the view or away), changing side as the pet crosses */
  const wrapA0 = a => Math.atan2(Math.sin(a), Math.cos(a));
  function faceOf(M, S, dt) { const ap = apOf(M), c = Math.cos(ap); if (c > 0.3) S.side = 1; else if (c < -0.3) S.side = -1;
    const want = S.side > 0 ? clamp(wrapA0(ap), -0.8, 0.8) : Math.PI + clamp(wrapA0(ap - Math.PI), -0.8, 0.8);
    if (S.hdA == null || !(dt > 0)) S.hdA = want; else { let d = wrapA0(want - S.hdA); S.hdA = wrapA0(S.hdA + d * Math.min(1, dt * 3.5)); } return S.hdA; }
  const hdOf = FX => { const S = st3(FX, FX.m); return headOf(S.hdA == null ? faceOf(FX.mem, S, 0) : S.hdA); };
  function poseOf(FX, m) { const M = FX.mem, S = st3(FX, m), P = S.P, me = FX.me || { x: m.x, y: m.y + 5 }, bt = M.bt || 0;
    const slump = M.slump || 0, alt = M.alt == null ? 2.4 : M.alt, tip = M.tip || 0, hs = m.hitSq || 0, roar = M.roar || 0, menace = M.menace || 0, aim = M.aim || 0, recoil = M.recoil || 0, br = Math.sin(bt * 1.4), ent = m.act === 'enter';
    const bob = Math.sin(bt * 1.7) * 0.12 * (1 - slump), slam = M.slamK > 0 ? DuneFiend.snap(cl((M.slamT || 0) / 0.6)) : 0, sl = ease(slump);
    P.a = headOf(S.hdA == null ? faceOf(M, S, 0) : S.hdA);
    P.hc = lerp(Math.max(LOW + 0.06, (alt + bob) / ZK), 1.55, sl);
    P.pitch = tip * 0.42 - slam * 0.14 + recoil * 0.12 + S.lean + hs * 0.06 - roar * 0.08;
    P.roll = (M.roll || 0) * 1.4 + S.rock + sl * 1.22 + Math.sin(bt * 0.9) * 0.03 * (1 - slump);
    P.sq = [1 + 0.07 * hs + 0.05 * slam, 1 + 0.07 * hs + 0.03 * slam, 1 - 0.11 * hs - 0.08 * slam]; P.sc = 1.08 + br * 0.012 + roar * 0.05;
    P.ext = 1.08 + slump * 1.15 + br * 0.04 + menace * 0.14 - recoil * 0.3; P.droop = Math.max(0, 0.14 + slump * 0.62 - tip * 0.12); P.br = br;
    P.mglow = Math.max(menace * 0.35, slump * 0.6, roar * 0.5) * (0.8 + 0.2 * Math.sin(bt * 6));
    P.pores = 0.16 + S.pulse * 0.95 + menace * 0.45 + roar * 1.0 + slump * 0.2; P.seam = menace * 0.85 + roar * 0.9; P.deep = 0.3 + menace * 0.5 + roar * 0.7 + slump * 0.45;
    P.dizzy = (m.stunT > 0 || slump > 0.5) ? 1 : 0; P.flash = m.flash > 0 ? 1 : 0; P.cir = S.cir; P.dead = 0; P.alpha = 1;
    const pb = toBody(me.x, me.y, m.x, m.y, P.a); P.pet = [pb[0], pb[1], 0.45];
    const E5 = defEyes(P, aim, roar, menace, slump, hs), lkA = clamp(Math.atan2(pb[1], pb[0]), -1.1, 1.1);
    for (let i = 0; i < NE; i++) { const E = E5[i], Sp = S.eyes[i], sw = Math.sin(bt * 2.1 + i * 1.3) * 0.12 + Math.sin(bt * 5.3 + i) * 0.03, ca = Math.cos(lkA * (0.6 + 0.4 * aim)), sa = Math.sin(lkA * (0.6 + 0.4 * aim));
      const d1 = E.d1, x1 = d1[0] * ca - d1[1] * sa, y1 = d1[0] * sa + d1[1] * ca; E.d1 = vnrm([x1, y1 + sw + Sp.oy, d1[2] + Sp.oz]); E.d0 = vnrm([E.d0[0], E.d0[1] + sw * 0.4 + Sp.oy * 0.4, E.d0[2] + Sp.oz * 0.3]);
      E.blink = Math.max(M.blinks ? M.blinks[i] || 0 : 0, hs * 0.7, slump * 0.4); }
    P.eyes = E5;
    if (ent) P.mglow = Math.max(P.mglow, roar);
    // its fall: it drops out of the air onto the sand, rolls onto its side, the mantle lolls out, its light drains and the eyes close
    const E = S.end; if (E) { const u = E.t, dr = Math.pow(cl(u / 0.85), 2), rl = ease(cl((u - 0.55) / 0.9)), fd = sstep(0.9, 2.8, u);
      P.hc = lerp(P.hc, 1.5, dr); P.roll = lerp(P.roll, 1.25, rl) + (u > 0.85 && u < 1.4 ? Math.sin((u - 0.85) * 22) * 0.06 * (1.4 - u) : 0); P.pitch *= 1 - rl;
      P.ext = lerp(P.ext, 1.9, rl); P.droop = lerp(P.droop, 0.8, rl); P.dead = fd; P.pores *= 1 - fd; P.seam = 0; P.deep *= 1 - fd; P.mglow *= 1 - fd; P.dizzy = 0;
      for (const Ey of P.eyes) { Ey.blink = Math.max(Ey.blink, sstep(1.2, 2.4, u)); Ey.d0 = vnrm(vadd(Ey.d0, [0, 0, -1.4 * rl])); Ey.d1 = vnrm(vadd(Ey.d1, [0, 0, -1.6 * rl])); Ey.glow *= 1 - fd; } }
    return P; }
  function rigNow(FX, m) { const M = FX.mem, S = st3(FX, m); if (S.R && S.Rt === M.bt) return S.R; S.R = rig(poseOf(FX, m), M.bt || 0); S.Rt = M.bt; return S.R; }
  const anc = (FX, m, n) => anchorOf(rigNow(FX, m), n, m.x, m.y, hdOf(FX)) || { x: m.x, y: m.y, z: 3 };
  /* (the fight's queries on the GPU path) the hit proxies where the model shows, the bared mantle, the opening */
  function parts(FX, m) { const s = vis(anc(FX, m, 'shell')), o = vis(anc(FX, m, 'mouth')); return [{ key: 'shell', dx: s.x - m.x, dy: s.y - m.y, r: 2.6 }, { key: 'mouth', dx: o.x - m.x, dy: o.y - m.y, r: 1.3 }]; }
  function mantleAt(FX, m) { const p = vis(anc(FX, m, 'mantle')); return [p.x, p.y]; }
  function mouthAt(FX, m) { const p = anc(FX, m, 'mouth'); return [p.x, p.y, p.z * ZK]; }

  /* the motion, each frame: it leans into its starts and banks into its turns, the stalks swing on springs (the body's motion, a blow,
     a landing kick them), the feelers sway, the pores pulse with every echo; a slam's landing throws up dust */
  function update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M || !(dt > 0)) return; const S = st3(FX, m), a = headOf(faceOf(M, S, dt));
    for (let i = S.fx.length - 1; i >= 0; i--) { const f = S.fx[i]; f.t += dt; if (f.t >= f.life) S.fx.splice(i, 1); }
    const ax = ((M.vx || 0) - S.pvx) / dt, ay = ((M.vy || 0) - S.pvy) / dt, c = Math.cos(a), s = Math.sin(a); S.pvx = M.vx || 0; S.pvy = M.vy || 0;
    const fa = clamp(ax * c + ay / GY * s, -40, 40), sa = clamp(-ax * s + ay / GY * c, -40, 40);
    S.lean = toward(S.lean, clamp(-fa * 0.012, -0.2, 0.2), dt, 4); S.vr += (-30 * S.rock - 4 * S.vr + sa * 0.01) * dt; S.rock = clamp(S.rock + S.vr * dt, -0.25, 0.25);
    const hs = m.hitSq || 0, kick = hs > 0.9 && S.hs0 <= 0.9; S.hs0 = hs;
    const land = M.slamK > 0 && (M.slamT || 0) < 0.1 && !S.slamOn; if (M.slamK > 0) { if (land) S.slamOn = true; } else S.slamOn = false;
    if (land) { S.vr += (Math.random() - 0.5) * 2; if (D3.fg() && !lowFx()) S.fx.push({ kind: 'dust', x: m.x, y: m.y + 0.6, t: 0, life: 1.0, r: 4, seed: Math.random() * 40 }); }
    for (let i = 0; i < NE; i++) { const E = S.eyes[i]; if (kick) { E.vz += 2.5 + Math.random(); E.vy += (Math.random() - 0.5) * 3; } if (land) { E.vz -= 3 + Math.random() * 2; }
      E.vy += (-28 * E.oy - 3.2 * E.vy + sa * 0.015) * dt; E.vz += (-28 * E.oz - 3.2 * E.vz - fa * 0.01) * dt; E.oy = clamp(E.oy + E.vy * dt, -0.7, 0.7); E.oz = clamp(E.oz + E.vz * dt, -0.7, 0.7); }
    S.cir += dt * (1.2 + (M.menace || 0) * 1.5 + Math.min(2, Math.hypot(M.vx || 0, M.vy || 0) * 0.3));
    if (S.end) { S.end.t += dt; if (S.end.t > 0.85 && !S.end.landed) { S.end.landed = true; FX.H.shake(lowFx() ? 5 : 10, 0.4); FX.H.sfx.thud(); if (D3.fg()) S.fx.push({ kind: 'dust', x: m.x, y: m.y + 0.6, t: 0, life: 1.4, r: 4.5, seed: 3 }); DuneFiend.sand(FX, m.x, m.y + 0.5, 14, 1.6); } }
    const le = M.echoes && M.echoes.length ? M.echoes[M.echoes.length - 1] : null; if (le && le !== S.lastE) { S.lastE = le; S.pulse = 1; } S.pulse = Math.max(0, S.pulse - dt * 1.6); }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k);

  /* ================= its light (FGFX) ================= */
  const fxOn = () => !!D3.fg();
  /* the floor's light (under everything standing): the warnings (Echo Call's rings gathering at the shell and rolling out, Shell Slam's
     ring with its two openings lit cyan, the Grub Chorus's churning sand, the Listening Beam's lane), the echoes pulsing over the sand
     from under it, the lit stones' rings, the slam's crest and dust, the bursts' light on the sand */
  function overlay(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !m) return; const F = D3.fg(), marked = FX.S.tele.filter(s => s.geo);
    if (!F) { for (const s of marked) D3.tele2D(c, FX, s, T, t); return; }
    const S = st3(FX, m), lf = lowFx(), Q = F.begin(c, null);
    try {
      for (const s of marked) tell(Q, FX, s, T, t, lf);
      for (const s of M.beams || []) beamLane(Q, FX, s, T, t);
      // the echoes pulsing from under the shell
      if (!m.dead) { const X = FX.sx(m.x), Y = FX.sy(m.y); for (const e of M.echoes || []) { const u = e.t / 2.2; if (u >= 1) continue; Q.ripple(X, Y, T * (0.8 + u * 7), CYAN, 0.32 * (1 - u) * (1 - u), 3.1 + (e.sd || (e.sd = Math.random() * 30)), GY, 0.08); } }
      // the lit stones: rings of sound round their feet
      for (const h of M.stones || []) { const o = h.obj; if (!o || o.dead || !(o.lit > 0)) continue; const X = FX.sx(o.x), Y = FX.sy(o.y), k = Math.min(1, o.lit / 0.5); Q.glow(X, Y, T * 1.6, CYAN, 0.22 * k);
        if (!lf) for (let i = 0; i < 3; i++) { const u = (t * 0.8 + i / 3) % 1; Q.ripple(X, Y, T * (0.9 + u * 1.6), CYAN_HI, 0.45 * (1 - u) * k, i * 2.1 + o.idx, GY, 0.1); } }
      for (const f of S.fx) floorFx(Q, FX, f, T, t, lf);
    } finally { F.flush(c); } }
  function tell(Q, FX, s, T, t, lf) { const X = FX.sx(s.x), Y = FX.sy(s.y), u = cl(s.age / s.t), sd = s.seed || 1, col = s.col || CYAN;
    if (s.orb === 'echo') { if (!s.done) { const R = s.r1 * T * 1.06; Q.quad(264, X, Y, R, 0, 0, R, col, 0.8, s.r0 / (s.r1 * 1.06), sd, u * 0.999); Q.glow(X, Y, T * (1.2 + u), col, 0.12 + 0.2 * u); }
      else { const R = s.r1 * T * 1.06, k = 1 - sstep(FX.C.R - 1, FX.C.R + 3, s.r1); Q.quad(264, X, Y, R, 0, 0, R, col, 1, s.r0 / (s.r1 * 1.06), sd, 1 + 0.999 * k); } }
    else if (s.orb === 'slam') { const R = s.r1 * T * 1.06, g = s.gaps && s.gaps.length > 1 ? s.gaps : [[0, 0.4], [Math.PI, 0.4]], pul = 0.5 + 0.5 * Math.sin(t * (6 + 10 * u));
      Q.quad(265, X, Y, R, 0, 0, R, BONE_HI, 0.28 + 0.4 * u * (0.75 + 0.25 * pul), s.r0 / (s.r1 * 1.06), wrapA(g[0][0]), wrapA(g[1][0]) + 4);
      if (!lf) for (const [ga] of g) { const mr = (s.r0 + s.r1) / 2 * T, ca = Math.cos(ga), sa = Math.sin(ga); for (let k = 0; k < 3; k++) { const ph = (k / 3 + t * 0.6) % 1, rr = (s.r0 + 0.4 + ph * (s.r1 - s.r0)) * T; vee(Q, X + ca * rr, Y + sa * rr, ga, T * 0.3, AQUA, 0.7 * Math.sin(Math.PI * ph)); } Q.glow(X + ca * mr, Y + sa * mr, T * 1.3, AQUA, 0.15 + 0.12 * pul); } }
    else if (s.orb === 'call') { const R = s.r * T * 1.18; Q.quad(267, X, Y, R, 0, 0, R, col, 0.9, u * 0.999, sd, sd > 20 ? 1 : -1); } }
  const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
  function vee(Q, x, y, a, s, col, al) { if (!(al > 0.01)) return; const ca = Math.cos(a), sa = Math.sin(a); for (const sg of [-1, 1]) Q.rbeam(x - ca * s - sa * sg * s * 0.9, y - sa * s + ca * sg * s * 0.9, x, y, s * 0.26, col, al, 0.15, 1); }
  /* the Listening Beam on the sand: its lane while it aims (a thread of light with pulses running out along it), then where the beam lies */
  function beamLane(Q, FX, s, T, t) { const len = s.len, ca = Math.cos(s.a), sa = Math.sin(s.a), X = FX.sx(s.x + ca * len / 2), Y = FX.sy(s.y + sa * len / 2), hl = len / 2 * T, hw = s.w / 2 * T * 1.15, asp = len / s.w;
    if (!s.done) { const u = cl(s.age / s.t); Q.quad(266, X, Y, ca * hl, sa * hl, -sa * hw, ca * hw, CYAN_HI, 1, u * 0.999, s.seed || (s.seed = Math.random() * 40), asp); }
    else { const k = 1 - sstep(s.t + (s.linger || 3) - 0.35, s.t + (s.linger || 3), s.age); Q.quad(266, X, Y, ca * hl, sa * hl, -sa * hw, ca * hw, CYAN, 0.6, 1 + 0.999 * k, s.seed || 1, asp); Q.glow(FX.sx(s.x + ca * len), FX.sy(s.y + sa * len), T * 1.5, CYAN, 0.25 * k); } }
  function floorFx(Q, FX, f, T, t, lf) { const u = cl(f.t / f.life), X = FX.sx(f.x), Y = FX.sy(f.y);
    if (f.kind === 'slamw') { const v = cl(u / 0.7), rc = (f.r0 + (f.r1 - f.r0) * ease(v)) * T; if (v < 1) Q.quad(265, X, Y, rc / 0.86, 0, 0, rc / 0.86, BONE_HI, 1 - v * 0.6, 0.5, f.g1, f.g2 + 14);
      if (!lf) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + f.seed, gap = Math.abs(angTo(a, f.g1)) < 0.42 || Math.abs(angTo(a, f.g2)) < 0.42; if (gap) continue; Q.smoke(X + Math.cos(a) * rc * 0.9, Y + Math.sin(a) * rc * 0.9, T * (0.7 + 0.8 * u), 0.32 * (1 - u), f.seed + i, DUST); }
      Q.glow(X, Y, T * (2.5 + 2 * u), BONE_HI, 0.3 * (1 - u)); }
    else if (f.kind === 'churn') { const R = f.r * T * 1.18; Q.quad(267, X, Y, R, 0, 0, R, f.col, 1, 1 + u * 0.999, f.seed, 1); if (!lf) Q.smoke(X, Y - T * 0.2, T * (0.8 + 0.8 * u), 0.3 * (1 - u), f.seed, DUST); }
    else if (f.kind === 'dust') { Q.smoke(X, Y, T * f.r * (0.5 + 0.6 * u), 0.3 * (1 - u), f.seed, DUST); if (!lf) Q.ripple(X, Y, T * f.r * (0.6 + 0.8 * u), OCHRE_HI, 0.25 * (1 - u), f.seed, GY, 0.12); }
    else if (f.kind === 'burst') { Q.glow(X, Y, T * f.r * (1.1 + u), f.col, 0.28 * (1 - u)); if (!lf) Q.ripple(X, Y, T * f.r * (0.5 + 1.4 * u), f.col, 0.4 * (1 - u), f.seed, GY, 0.1); } }
  /* the upper light (over everything): the beams pouring from the opening, the opening's and the eyes' light, the roar, the bursts,
     the stars of a deafened shell. Returns false without the painter (the 2D effects are drawn instead) */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !m) return false; const F = D3.fg(); if (!F) return false; const S = st3(FX, m), gl = SH.on(), lf = lowFx();
    const scr = p => [FX.sx(p.x), FX.sy(p.y) - p.z * ZK * T], mouth = () => { if (gl) return scr(anc(FX, m, 'mouth')); return [FX.sx(m.x), FX.sy(m.y) - (M.alt || 2.4) * T]; };
    const Q = F.begin(c, null);
    try {
      const mo = mouth(), menace = M.menace || 0, roar = M.roar || 0, slump = M.slump || 0;
      for (const s of M.beams || []) { const ex = FX.sx(s.x + Math.cos(s.a) * s.len), ey = FX.sy(s.y + Math.sin(s.a) * s.len);
        if (!s.done) { const u = cl(s.age / s.t); Q.rbeam(mo[0], mo[1], ex, ey, T * 0.12, CYAN_HI, 0.25 + 0.35 * u, 1, 0.2); Q.glow(mo[0], mo[1], T * (0.8 + 0.8 * u), CYAN, 0.25 + 0.3 * u); }
        else { const k = 1 - sstep(s.t + (s.linger || 3) - 0.35, s.t + (s.linger || 3), s.age), fl = 0.85 + 0.15 * Math.sin(t * 29 + (s.seed || 0));
          Q.ebeam(mo[0], mo[1], ex, ey, T * s.w * 0.5, CYAN, 0.45, 0.55 * k * fl, s.seed || 0, 4); Q.rbeam(mo[0], mo[1], ex, ey, T * 0.16, CYAN_HI, 0.5 * k, 1, 0.5); Q.glow(mo[0], mo[1], T * 1.6, CYAN_HI, 0.4 * k); Q.glow(ex, ey, T * 1.8, CYAN, 0.3 * k);
          if (!lf) for (let i = 0; i < 4; i++) { const u = (t * 1.6 + i / 4) % 1; Q.ring(lerp(mo[0], ex, u), lerp(mo[1], ey, u), T * (0.25 + u * 0.7), CYAN_HI, 0.5 * (1 - u) * k, T * 0.08, 0.5); } } }
      if (!m.dead) { const dk = 0.18 + menace * 0.3 + roar * 0.45 + slump * 0.25; Q.glow(mo[0], mo[1], T * (1.1 + 0.6 * roar), CYAN, dk * (0.85 + 0.15 * Math.sin(t * 5)));
        if (gl && (menace > 0.05 || roar > 0.05)) for (let i = 0; i < NE; i++) { const e = scr(anc(FX, m, 'eye' + i)); Q.glow(e[0], e[1], T * 0.75, CYAN, Math.max(menace, roar) * (0.35 + 0.15 * Math.sin(t * 13 + i))); }
        if (roar > 0.02) { const s0 = gl ? scr(anc(FX, m, 'shell')) : [FX.sx(m.x), FX.sy(m.y) - (M.alt || 2.4) * T]; Q.glow(s0[0], s0[1], T * 4.5, CYAN, 0.24 * roar); }
        if (m.stunT > 0 || slump > 0.5) { const s0 = gl ? scr(anc(FX, m, 'top')) : [FX.sx(m.x), FX.sy(m.y) - 4 * T]; for (let i = 0; i < 3; i++) { const a = (M.bt || t) * 3 + i * TAU / 3; Q.star(s0[0] + Math.cos(a) * T * 1.8, s0[1] - T * 0.8 + Math.sin(a) * T * 0.4, T * 0.32, 0.9, '#FFFFFF'); } } }
      for (const f of S.fx) { if (f.kind !== 'burst' && f.kind !== 'cry') continue; const u = cl(f.t / f.life), X = FX.sx(f.x), Y = FX.sy(f.y) - (f.z || 0) * T;
        if (f.kind === 'burst') { Q.glow(X, Y, T * f.r * (0.8 + 0.6 * u), f.col, 0.5 * (1 - u)); Q.glow(X, Y, T * f.r * 0.35, '#FFFFFF', 0.55 * (1 - u) * (1 - u)); Q.ring(X, Y, T * f.r * (0.4 + 1.2 * u), f.col, 0.5 * (1 - u), T * 0.12);
          if (!lf) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + f.seed, d = T * f.r * (0.3 + 1.1 * u); Q.star(X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.8, T * 0.28, 0.8 * (1 - u), i % 2 ? '#FFFFFF' : f.col); } }
        else { const s0 = gl ? scr(anc(FX, m, 'mouth')) : [X, Y]; Q.ring(s0[0], s0[1], T * (0.6 + 7 * u), CYAN_HI, 0.55 * (1 - u), T * 0.18, 0.55); Q.glow(s0[0], s0[1], T * (2 + 2 * u), CYAN, 0.35 * (1 - u)); } }
    } finally { F.flush(c); } return true; }

  /* ================= the API for the fight (20y-rift-fiend-dunes-2.js) ================= */
  function drawBoss(c, FX, m, X, Y, T, t) { if (!SH.on()) return false; const M = FX.mem; st3(FX, m); const R = rigNow(FX, m), P = M.g3.P;
    let al = 1; if (m.act === 'enter') al = clamp((FX.S.enterT || 0) / 1.2, 0, 1); P.alpha = al;
    return !!drawModel(c, m.x, m.y, P, { T, sx: v => X + (v - m.x) * T, sy: v => Y + (v - m.y) * T, t: M.bt || t, R, flash: m.flash > 0 ? 1 : 0 }); }
  /* a burst of light (in place of the engine's boom): its light on the sand and over everything, a few sparks, the shake */
  function burst(FX, x, y, r, col, o) { o = o || {}; const S = st3(FX, FX.m); S.fx.push({ kind: 'burst', x, y, z: o.z == null ? 0.6 : o.z, r, col, t: 0, life: 0.55 + r * 0.12, seed: Math.random() * 40 });
    if (o.n !== 0) FX.H.sparks(x, y - (o.z == null ? 0.6 : o.z), col, Math.round((o.n || 14) * 0.5), r * 5); FX.H.shake(o.shake || r * 3, 0.22); }
  function slamFx(FX, s) { const S = st3(FX, FX.m), g = s.gaps && s.gaps.length > 1 ? s.gaps : [[0, 0.4], [Math.PI, 0.4]]; S.fx.push({ kind: 'slamw', x: s.x, y: s.y, r0: s.r0, r1: s.r1, g1: wrapA(g[0][0]), g2: wrapA(g[1][0]), t: 0, life: 0.7, seed: Math.random() * 40 }); }
  function churn(FX, s, type) { const S = st3(FX, FX.m); S.fx.push({ kind: 'churn', x: s.x, y: s.y, r: s.r || 1.3, col: type === 'manta' ? CYAN : OCHRE_HI, t: 0, life: 0.7, seed: Math.random() * 40 }); }
  function die(FX, m) { const S = st3(FX, m); if (S.end) return; S.end = { t: 0, landed: false }; FX.H.sfx.hum(); }
  function cry(FX) { const S = st3(FX, FX.m), m = FX.m; S.fx.push({ kind: 'cry', x: m.x, y: m.y, t: 0, life: 1.1, seed: 1 }); }
  /* an echo stone: its picture kept for each state (lit or dark, how cracked), a glow and its label over it */
  function drawStone(c, FX, o, X, Y, T, t) { if (!SH.on()) return false; const lit = o.lit > 0, ck = Math.min(2, Math.floor((1 - o.hp / o.maxhp) * 3)), v = o.idx % 2, key = (lit ? 'L' : 'D') + ck + v;
    const p = D3.pic(c, SH, key, T, () => [{ part: 'stone', R: rotZ(0.3 * (v - 0.5)), o: [0, 0, 0], s: 1, glow: lit ? 1.2 : 0.06, kind: ck / 2, wear: 0.3 + v * 0.4 }], 'dusk'); if (!p) return false;
    const k = lit ? 0.7 + 0.3 * Math.sin(t * 5 + o.idx) : 0.2 + 0.1 * Math.sin(t * 1.5 + o.idx);
    if (typeof glowSprite === 'function') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (lit ? 0.55 : 0.12) * k; blitSized(c, glowSprite(CYAN), X - T * 1.8, Y - T * 2.9, T * 3.6, T * 3.6); c.restore(); }
    c.save(); if (o.flash > 0) c.filter = 'brightness(1.6)'; D3.blitPic(c, p, X, Y); c.restore();
    if (lit) { c.save(); c.font = `800 ${Math.round(T * 0.26)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText('LIT · crack it', X, Y - T * 2.75); c.fillText('LIT · crack it', X, Y - T * 2.75); c.restore(); }
    return true; }
  /* the loading screen's jobs: the meshes, one frame off-screen (the program and buffers ready), the stone's pictures */
  function preload(P) { if (!P || !P.gl) return []; return [() => { SH.on(); }, () => { if (!SH.on()) return; const cv = document.createElement('canvas'); cv.width = cv.height = 16; const c = cv.getContext('2d'); try { drawModel(c, 0, 0, blankPose(), { T: 4, sx: v => 8 + v, sy: v => 8 + v, t: 0, shadow: false }); } catch (e) { /* (the 2D shell) */ } cv.width = cv.height = 1; }]; }
  D3.onRelease(() => { LAST = null; });
  /* a studio portrait (tests): the model alone at screen (x, y), its heading a, the pose's fields over the blank one */
  function studio(c, x, y, a, over, o) { const P = Object.assign(blankPose(), over || {}); P.a = a; const T0 = (o && o.T) || 40; return drawModel(c, 0, 0, P, Object.assign({ T: T0, sx: v => x + v * T0, sy: v => y + v * T0, t: (over && over.t) || 2 }, o || {})); }
  function studioStone(c, x, y, lit, ck, T0) { const V = K.mkView(0, 0, 0, 0, { T: T0, sx: v => x + v * T0, sy: v => y + v * T0 }); if (!SH.on()) return false; return D3.glPass(c, V, [{ part: 'stone', R: I3(), o: [0, 0, 0], s: 1, glow: lit ? 1.2 : 0.06, kind: ck / 2, wear: 0.4 }], 1, { t: 0, light: 'dusk' }, SH); }
  return { on: () => SH.on(), fx: fxOn, mark: D3.mark, init, update, drawBoss, drawFx, overlay, drawStone, parts, mantleAt, mouthAt, burst, slamFx, churn, cry, die, preload, studio, studioStone, blankPose, defEyes,
    __dbg: { get gl() { return SH.on(); }, set noGL(v) { SH.NOGL = !!v; }, get MESH() { return SH.MESH; }, get last() { return LAST; }, get pics() { return D3.picN; }, get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +SH.ms.toFixed(2), frames: SH.n, box: SH.box, meshMs: +SH.meshMs.toFixed(1), meshTris: SH.tris }); } } };
})();
