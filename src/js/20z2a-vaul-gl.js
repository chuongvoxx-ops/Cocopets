/* ---------- (v463 SA) VAUL THE MOURNING REFLECTION in three dimensions (Rift 04, section 2's boss: the Raised Gallery) ----------
   The 2D head of 20z2-rift-fiend-sepulchre-2.js rebuilt as a GPU model at Rift 03's bosses' fidelity, on SEP3 (20z1a): GLM meshes
   built once (in the loading screen's jobs, else on the first draw), posed every frame on the fight's own frame (the 2D file's head
   frame and spikes, reproduced here exactly: its gaze, its rear and recoil, its roll, its eight spikes wheeling, flaring, streaming in
   a rush, levelled in a volley, fallen round it), one composite drawImage; its materials GLM 560..568 (SA-SEP-MAT, 20k5uz) under the
   gallery's sun; the light of its moves on the shared FGFX painter (kinds 432..435, SA-FX in 20k6h); the Memory Loom a kept GLM
   picture. The fight keeps its acts, timings, shapes and damage; its warnings are light on the marble (no outlines, no numerals: a
   recorded mark's order is shown by one, two or three motes of light circling it). Without WebGL (or on a software rasteriser,
   unless window.__SEP_GL) the 2D head is drawn as before; without the painter its warnings and effects are the old 2D ones.
   The model: a hollow diamond slab as tall as a house, four bevelled bars of mirror-polished silver (the gallery's sky and marble in
   them), a gold inlay running round its face between two bands of the hours' runes that glow violet with its menace, the hollow
   backed with dark nacre; in it the eye, a lilac sphere with a violet iris of fibres and a slit pupil, silver lids that blink;
   eight long faceted spikes, silver and violet steel by turns, their edges lit; its echo a violet glass ghost of the head a moment
   behind it; three tentacles of violet and gold light curling beneath it (light). The Loom: a marble plinth, polished silver posts
   and beams with gold diamond finials, a violet crown stone, gold warp threads and the violet cloth woven with silver diamonds.
   Its fall: it crashes to the marble, its spikes fall round it, the bars spring open, the runes and the eye's light go out and the
   eye closes. */
const VAUL_GL = (() => {
  const D3 = SEP3, K = GB_KIT, { TAU, cl, lerp, sstep, GY, ZK, CW, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv, mm, rotX, rotY, rotZ, rotAxis, frameXZ, hash, headOf } = K, lowFx = K.lowFx;
  const M_SILVER = 560, M_GOLD = 561, M_EYE = 562, M_LID = 563, M_SPK = 564, M_SPKV = 564.2, M_NACRE = 565, M_MARBLE = 566, M_CLOTH = 567, M_THREAD = 568;
  const VIOLET = '#8E6BD0', VIOLET_HI = '#C9B0FF', GOLD = '#B2965D', GOLD_HI = '#E8CF8E', SILVER_HI = '#E4EAF2';
  const HS = 2.5, ALT = 3.9, NS = 8, VIEW = [0, 0.7071, 0.7071], OUT = [[0.9, 0], [0, 1.05], [-0.9, 0], [0, -1.3]], INN = OUT.map(([f, u]) => [f * 0.6, u * 0.6 + 0.04]), TH = 0.42 / HS;
  const PL_A = [Math.PI / 2 - 1.2, Math.PI / 2 + 1.2, -Math.PI / 2], PL_D = 7.4, PL_R = 1.4, LOOM_R = 1.6, WEAVE = 0.75;
  const plateAt = (C, i) => [C.x + Math.cos(PL_A[i]) * PL_D, C.y + Math.sin(PL_A[i]) * PL_D], loomAt = C => [C.x, C.y + C.R - 1.8], loomFrame = C => [C.x, C.y + C.R - 3.9];
  const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, cross = vcross, dot = vdot, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const SH = D3.model('Vaul', buildMeshes);
  function buildMeshes() {
    const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(4, Math.round(n * DQ)), fin = (k, B) => { out[k] = B.done(); };
    /* the four bars of the diamond (its own frame: x across the face, y up it, z out of it toward the viewer), each its own mesh so
       the head can spring open; the nacre behind the hollow */
    for (let j = 0; j < 4; j++) { const B = nb(), k = (j + 1) % 4; B.prism([OUT[j], OUT[k], INN[k], INN[j]], -TH, TH, M_SILVER, { b: 0.035 }); fin('bar' + j, B); }
    { const B = nb(); B.prism(INN.map(([f, u]) => [f * 1.02, u * 1.02]), -TH * 0.9, -TH * 0.55, M_NACRE, { b: 0.0 }); fin('back', B); }
    { const B = nb(); B.sph([0, 0, 0], 1, M_EYE, q(28)); fin('eye', B); }
    { const B = nb(); B.ell([0, 0, 0], [1.08, 1.1, 1.08], M_LID, { seg: q(18), rings: q(7), th0: 0, th1: 1.62, ph0: -Math.PI / 2, ph1: Math.PI / 2, rim: true }); fin('lid', B); }
    { const B = nb(); B.ell([0, 0, 0], [1.08, 1.1, 1.08], M_LID, { seg: q(18), rings: q(5), th0: 1.95, th1: Math.PI, ph0: -Math.PI / 2, ph1: Math.PI / 2, rim: true }); fin('lidL', B); }
    /* a spike (along x, unit length: its point at 0.68, its heel at -0.32, a waist of four edges, two broad and two narrow): flat facets */
    for (const [name, m] of [['spikeS', M_SPK], ['spikeV', M_SPKV]]) { const B = nb(), w = 0.62 / 3.0, tip = [0.68, 0, 0], heel = [-0.32, 0, 0], W = [];
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, ww = k % 2 ? w * 0.45 : w; W.push([0.05, Math.cos(a) * ww, Math.sin(a) * ww]); }
      for (let k = 0; k < 4; k++) { const a = W[k], b = W[(k + 1) % 4]; B.facet([tip, a, b], m); B.facet([heel, b, a], m); }
      fin(name, B); }
    /* the Loom (its own frame: x east, y south, z up; its foot at 0): the plinth, the posts and beams, finials, the crown stone, the
       warp, the cloth (its height by its key: drawn as a kept picture) */
    { const B = nb(); B.box([0, 0, 0.32], [1.9, 0.55, 0.32], 0.06, M_MARBLE); B.box([0, 0, 0.5], [1.92, 0.57, 0.035], 0.0, M_GOLD);
      for (const sx of [-1, 1]) { B.box([sx * 1.3, 0, 2.3], [0.14, 0.14, 1.65], 0.04, M_SILVER); B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [sx * 1.3, 0, 4.2]); B.crystal([0, 0, 0], [0, 0, 0.55], 0.2, M_GOLD, { n: 4, belly: 0.4, base: 0.6 }); B.crystal([0, 0, 0], [0, 0, -0.25], 0.2, M_GOLD, { n: 4, belly: 0.5, base: 0.6, cap: false }); B.pop(); }
      B.box([0, 0, 3.95], [1.62, 0.2, 0.16], 0.05, M_SILVER); B.box([0, 0, 1.3], [1.4, 0.16, 0.11], 0.04, M_SILVER);
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 4.15]); B.crystal([0, 0, 0], [0, 0, 0.62], 0.26, M_SPKV, { n: 4, belly: 0.45 }); B.crystal([0, 0, 0], [0, 0, -0.3], 0.26, M_SPKV, { n: 4, belly: 0.5, cap: false }); B.pop();
      for (let j = 0; j <= 12; j++) { const x = lerp(-1.1, 1.1, j / 12); B.tube([x, 0.02, 1.4], [x, 0.02, 3.82], 0.018, 0.018, M_THREAD, { seg: 5, cap0: false, cap1: false }); }
      fin('loom', B); }
    for (let c2 = 0; c2 < 5; c2++) { const B = nb(), h = 0.55 + c2 * 0.22; B.surf((u, v) => [lerp(-1.12, 1.12, u), 0.05 + 0.02 * Math.sin(u * 40), 1.42 + v * h], q(20), 4, () => M_CLOTH, { e: u => u, a: (u, v) => v * h / 2.2 }); fin('cloth' + c2, B); }
    return out; }

  /* ================= the fight's side (20z2): its head frame and spikes, as the 2D computes them ================= */
  function headFrame(FX, m, M, at, ghost) { const bt = (M.bt || 0) - (ghost ? 0.5 : 0), slump = M.slump || 0, hs = m.hitSq || 0;
    const yaw = (M.hd == null ? Math.PI / 2 : M.hd) + (ghost ? -0.25 : 0) + Math.sin(bt * 0.7) * 0.12, pitch = -0.12 + (M.rear || 0) * 0.25 - (M.recoil || 0) * 0.2 - slump * 0.35 + Math.sin(bt * 1.3) * 0.06;
    const F = [Math.cos(yaw) * Math.cos(pitch), Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch)];
    const roll = Math.sin(bt * 1.1 + 0.5) * 0.12 + (M.turn || 0) * 0.6 + slump * 0.5 + hs * 0.15 + Math.cos(yaw) * 0.18;
    const s = HS * (1 + (M.roar || 0) * 0.07 + hs * 0.05 + Math.sin(bt * 1.6) * 0.015) * lerp(0.6, 1, M.unfold == null ? 1 : M.unfold) * (ghost ? 0.92 : 1), bob = Math.sin(bt * 1.4) * 0.22 * (1 - slump);
    const cen = [at.x - F[0] * hs * 0.3, at.y - F[1] * hs * 0.3, at.z + bob]; return { F, cen, s, yaw, pitch, roll }; }
  const headPos = (m, M) => ({ x: m.x, y: m.y, z: M.alt == null ? ALT : M.alt });
  function spikes(FX, m, M, H) { const bt = M.bt || 0, c = H.cen, slump = M.slump || 0, hs = m.hitSq || 0, R0 = (M.spR == null ? 3.4 : M.spR) + hs * 0.8 + (M.recoil || 0) * 0.3, tilt = 0.42 + Math.sin(bt * 0.5) * 0.14, rush = M.rushK || 0, out = [];
    const bx = -Math.cos(H.yaw), by = -Math.sin(H.yaw);
    for (let i = 0; i < NS; i++) { const a = (M.spA == null ? bt * 0.6 : M.spA) + i * TAU / NS, r = R0 + Math.sin(bt * 1.7 + i * 1.3) * 0.2, ct = Math.cos(tilt), st = Math.sin(tilt);
      let p = [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * ct, c[2] + Math.sin(a) * r * st * -1 + Math.sin(bt * 2 + i) * 0.18 - 0.3], ax = nrm([p[0] - c[0], p[1] - c[1], p[2] - c[2]]);
      if (rush > 0) { const k = rush, back = 2.2 + (i % 4) * 1.0, side = ((i % 2) * 2 - 1) * (0.9 + Math.floor(i / 2) % 2 * 0.8); const q = [c[0] + bx * back - by * side, c[1] + by * back + bx * side, c[2] + Math.sin(i * 2.3) * 0.9]; p = [lerp(p[0], q[0], k), lerp(p[1], q[1], k), lerp(p[2], q[2], k)]; ax = nrm([lerp(ax[0], bx, k), lerp(ax[1], by, k), lerp(ax[2], 0, k)]); }
      const v = M.vol && M.vol.find(q => q.i === i); if (v) { const d = [Math.cos(v.a), Math.sin(v.a), -0.12], ready = clamp(v.t / Math.max(0.2, v.wait * 0.8), 0, 1), e = ready * ready * (3 - 2 * ready), rp = [c[0] + d[0] * (HS * 1.4 + (i % 3) * 0.3), c[1] + d[1] * (HS * 1.4 + (i % 3) * 0.3), c[2] - 0.8];
        let q = [lerp(p[0], rp[0], e), lerp(p[1], rp[1], e), lerp(p[2], rp[2], e)]; const ft = v.t - v.wait; if (ft > 0) { const u = ft < v.fly ? Math.sin(ft / v.fly * Math.PI / 2) : Math.max(0, 1 - (ft - v.fly) / v.back), dist = u * v.len; q = [rp[0] + d[0] * dist, rp[1] + d[1] * dist, lerp(rp[2], 0.9, u)]; }
        p = q; ax = nrm([lerp(ax[0], d[0], e), lerp(ax[1], d[1], e), lerp(ax[2], d[2], e)]); }
      if (slump > 0) { const g = [m.x + Math.cos(a) * 4.4, m.y + Math.sin(a) * 3.8, 0.45], tg = nrm([-Math.sin(a), Math.cos(a), -0.25]); p = [lerp(p[0], g[0], slump), lerp(p[1], g[1], slump), lerp(p[2], g[2], slump)]; ax = nrm([lerp(ax[0], tg[0], slump), lerp(ax[1], tg[1], slump), lerp(ax[2], tg[2], slump)]); }
      const unf = M.unfold == null ? 1 : M.unfold; out.push({ i, p, ax, spin: (M.spin == null ? bt * 2 : M.spin) * (i % 2 ? 1 : -1) + i * 0.7, L: 3.0 * (1 + (M.flare || 0) * 0.12) * lerp(0.5, 1, unf), v: !!v }); }
    return out; }
  const toM = (p, m) => [p[0] - m.x, (p[1] - m.y) / GY, p[2] / ZK], dirM = d => nrm([d[0], d[1] / GY, d[2] / ZK]);
  function st3(FX) { const M = FX.mem; let S = M.g3; if (S) return S; S = M.g3 = { fx: [], R: null, Rt: -1, end: null }; return S; }
  /* the head in the model: its face turned mostly to the camera and partly to its gaze (as the 2D), rolled; the bars (sprung open by
     open), the nacre, the eye and its lids; ghost: the echo (violet glass) */
  function head(I, FX, m, M, H, ghost, al, A) { const yawM = headOf(H.yaw), F = nrm([Math.cos(yawM) * Math.cos(H.pitch), Math.sin(yawM) * Math.cos(H.pitch), Math.sin(H.pitch)]), Nf = nrm(vadd(vmul(F, 0.75), CW));
    let U0 = vsub([0, 0, 1], vmul(Nf, Nf[2])); U0 = nrm(U0); const X0 = cross(U0, Nf), cr = Math.cos(H.roll), sr = Math.sin(H.roll), U = nrm(vadd(vmul(U0, cr), vmul(X0, sr))), Xf = cross(U, Nf), R = M3(Xf, U, Nf);
    const c = toM(H.cen, m), s = H.s, slump = M.slump || 0, open = slump * 0.5 + (M.flare || 0) * 0.08, gk = ghost ? { kind: 9, al: al * 0.99, outline: false } : {};
    const glowR = (ghost ? 0 : 0.2 + (M.menace || 0) * 0.6 + (M.flare || 0) * 0.5 + (M.roar || 0) * 0.5) * (1 - slump * 0.6);
    for (let j = 0; j < 4; j++) { const k = (j + 1) % 4, mid = [(OUT[j][0] + OUT[k][0]) / 2, (OUT[j][1] + OUT[k][1]) / 2], ml = Math.hypot(mid[0], mid[1]) || 1, off = vadd(vmul(Xf, mid[0] / ml * open), vmul(U, mid[1] / ml * open));
      I('bar' + j, R, vadd(c, off), Object.assign({ s, glow: glowR, wear: 0.2 + j * 0.15 }, gk)); }
    I('back', R, c, Object.assign({ s, glow: 0.3 + (M.menace || 0) * 0.5 + slump * 0.5, wear: 0.5, outline: false }, gk));
    const me = FX.me || { x: m.x, y: m.y + 5 }, er = 0.34 * s * (1 + slump * 0.35 + (M.flare || 0) * 0.08), bt = (M.bt || 0) - (ghost ? 0.5 : 0), eb = Math.sin(bt * 2.2) * 0.08, ec = vadd(c, vadd(vmul(Nf, 0.08 * s), vmul(U, eb + 0.05 * s)));
    let gz; if (slump > 0.5 && !ghost) gz = nrm([Math.cos(bt * 5) * 0.6, Math.sin(bt * 5) * 0.5, 0.2]); else { const pet = toM([me.x, me.y, 0.6], m), tp = nrm(vsub(pet, ec)); gz = nrm(vadd(vadd(vmul(tp, ghost ? 0.4 : 0.8), vmul(Nf, 1.0)), vmul(CW, 0.7)));   /* (toward the pet, and turned to the view so the iris shows) */ if (ghost) gz = nrm(vadd(gz, vmul(Xf, 0.3))); }
    const Re = frameXZ(gz, U), blink = ghost ? 0 : Math.max(M.blink || 0, (m.hitSq || 0) * 0.6, A.close || 0);
    I('eye', Re, ec, Object.assign({ s: er, kind: slump > 0.5 ? 1 : 0, glow: ghost ? 0 : 0.4 + (M.menace || 0) * 0.5 + (M.flare || 0) * 0.6 + slump * 0.4, wear: 0.9 }, gk, ghost ? { kind: 9 } : {}));
    if (!ghost) { I('lid', mm(Re, rotY(lerp(-2.1, 0.6, cl(blink)))), ec, { s: er, wear: 0.55, outline: false }); I('lidL', mm(Re, rotY(lerp(0.85, -0.2, cl(blink)))), ec, { s: er, wear: 0.6, outline: false });
      A.eye = ec; A.cen = c; A.N = Nf; A.U = U; A.Xf = Xf; A.s = s; } }
  function rig(FX, m, t) { const M = FX.mem, S = st3(FX), E = S.end, inst = [], A = {}, occ = [];
    const dead = E ? sstep(0.8, 2.6, E.t) : 0, fl = m.flash > 0 && !E ? 1 : 0; A.close = E ? sstep(1.2, 2.4, E.t) : 0;
    const I = (part, R, o, ex) => { const it = { part, R, o, s: 1, al: 1, glow: 0, glow2: fl * 0.85, spill: 0, kind: 0, fx: dead * 0.85, wear: 0.5 }; if (ex) Object.assign(it, ex); inst.push(it); return it; };
    const H = headFrame(FX, m, M, headPos(m, M));
    // the echo: a violet glass head a moment behind it
    const hst = M.hist && M.hist.length ? M.hist[0] : null, ga = (M.unfold == null ? 1 : M.unfold) * (1 - (M.slump || 0)) * (m.act === 'enter' ? 0.5 : 1) * (E ? 0 : 1);
    if (ga > 0.03) { const at = hst ? { x: hst.x, y: hst.y, z: hst.z } : headPos(m, M), GHf = headFrame(FX, m, M, at, true); GHf.cen[0] -= Math.cos(GHf.yaw) * 1.1; GHf.cen[1] -= Math.sin(GHf.yaw) * 1.1; GHf.cen[2] += 0.5; head(I, FX, m, M, GHf, true, 0.75 * ga, {}); }
    head(I, FX, m, M, H, false, 1, A); occ.push([A.cen, 1.2 * A.s * 0.5]);
    // the spikes: each turning on its own length, its edges lit with its menace (the called ones blazing)
    const SP = spikes(FX, m, M, H), menace = (M.menace || 0) + (M.flare || 0) * 0.5; A.spikes = [];
    for (const sp of SP) { const p = toM(sp.p, m), ax = dirM(sp.ax), F0 = frameXZ(ax, Math.abs(ax[2]) > 0.95 ? [1, 0, 0] : [0, 0, 1]), R = mm(F0, rotX(sp.spin)); const tip = vadd(p, vmul(ax, sp.L * 0.68));
      I(sp.i % 2 ? 'spikeV' : 'spikeS', R, p, { s: sp.L, glow: Math.min(2.5, menace * 0.45 + (sp.v ? 1.4 : 0)) * (1 - (M.slump || 0) * 0.7), wear: hash(sp.i * 2.1) }); A.spikes.push({ p, tip, v: sp.v, i: sp.i }); }
    A.H = H; return { inst, A, occ }; }
  function rigNow(FX, m) { const M = FX.mem, S = st3(FX), key = (M.bt || 0) + (S.end ? S.end.t * 1000 : 0); if (S.R && S.Rt === key && S.Rm === m) return S.R; S.R = rig(FX, m, M.bt || 0); S.Rt = key; S.Rm = m; return S.R; }

  /* ================= drawing ================= */
  let LAST = null;
  function drawRig(c, R, V, o) { if (!R) return false; LAST = { R, V };
    if (o.shadow !== false) K.shadow(c, V, R.inst.filter(it => /^bar|^spike/.test(it.part) && !(it.kind > 8)), 0.75 * (o.alpha == null ? 1 : o.alpha), SH);
    let ok = false; try { ok = D3.glPass(c, V, R.inst, o.alpha == null ? 1 : o.alpha, { t: o.t || 0, flash: o.flash, light: 'gallery', occ: lowFx() ? null : R.occ }, SH); } catch (e) { SH.fail(); if (typeof console !== 'undefined') console.warn('Vaul: draw', e); ok = false; }
    return ok; }
  function drawBoss(c, FX, m, X, Y, T, t) { if (!SH.on()) return false; const R = rigNow(FX, m); if (!R) return false;
    const V = K.mkView(m.x, m.y, 0, 0, { T, sx: v => X + (v - m.x) * T, sy: v => Y + (v - m.y) * T }), al = m.act === 'enter' ? cl((FX.S.enterT || 0) / 1.2) : 1;
    return drawRig(c, R, V, { t: FX.mem.bt || t, flash: m.flash > 0 ? 1 : 0, alpha: al }); }
  const scr = (FX, m, p, T) => [FX.sx(m.x + p[0]), FX.sy(m.y + p[1] * GY) - p[2] * ZK * T];
  /* the Loom: a kept picture for its state (lit, holding, how far the cloth is woven) */
  function drawLoom(c, FX, p, X, Y, T, t) { if (!SH.on()) return false; const M = FX.mem || {}, k = M.copy, on = !!(k && k.snare > 0 && !k.held), held = !!(k && k.held), ch = clamp((M.chan || 0) / WEAVE, 0, 1), lv = Math.min(4, Math.round((held ? 0.5 : 0) * 4 + ch * 2 + 1)) - 0;
    const key = 'loom' + lv + (on || held ? 'L' : 'D'), pic = D3.pic(c, SH, key, T, () => [{ part: 'loom', R: I3(), o: [0, 0, 0], s: 1, glow: on || held ? 1.2 : 0.15, wear: 0.4 }, { part: 'cloth' + Math.min(4, lv), R: I3(), o: [0, 0, 0], s: 1, glow: on || held ? 0.8 : 0, wear: 0.3 }], 'gallery'); if (!pic) return false;
    c.save(); if (typeof glowSprite === 'function') { c.globalAlpha = 0.3; c.fillStyle = 'rgba(60,50,40,1)'; c.beginPath(); c.ellipse(X, Y + T * 0.15, T * 2.1, T * 0.55, 0, 0, TAU); c.fill(); c.globalAlpha = 1; } D3.blitPic(c, pic, X, Y); c.restore(); return true; }

  /* ================= its light (FGFX) ================= */
  /* the floor's light: the warnings (marks of the hours closing in, with their order in motes; lanes of light down the marble; the
     sweep's arc), the snare plates and the Loom's circle, the mirror's road, the head's and the spikes' soft shadows */
  function overlay(c, FX, t, T) { const M = FX.mem, m = FX.m, C = FX.C; if (!M || !m) return; const F = D3.fg(), marked = FX.S.tele.filter(s => s.sa);
    if (!F) { for (const s of marked) D3.tele2D(c, FX, s, T, t); return false; }
    const lf = lowFx(), Q = F.begin(c, null), k = M.copy;
    try {
      for (let i = 0; i < 3; i++) { const p = plateAt(C, i), lit = Math.max(M.plateLit ? M.plateLit[i] : 0, k && !k.held && !k.snare ? 0.35 + 0.15 * Math.sin(t * 3 + i) : 0.12); Q.quad(435, FX.sx(p[0]), FX.sy(p[1]), PL_R * T * 1.1, 0, 0, PL_R * T * 1.1, GOLD_HI, Math.min(1, lit), i * 3.1, k && k.snare > 0 && k.plate === i ? 1 : 0, 0); if (lit > 0.3) Q.glow(FX.sx(p[0]), FX.sy(p[1]), PL_R * T * 1.6, GOLD_HI, 0.25 * lit, GY); }
      { const L = loomAt(C), on = k && k.snare > 0 && !k.held, ch = clamp((M.chan || 0) / WEAVE, 0, 1); Q.quad(435, FX.sx(L[0]), FX.sy(L[1]), LOOM_R * T * 1.12, 0, 0, LOOM_R * T * 1.03, GOLD_HI, on ? 0.8 + 0.2 * Math.sin(t * 6) : (k && k.held ? 0.7 : 0.25), ch, 1); }
      if (k && !k.held && !k.snare && k.q.length > 1) { let px = k.x, py = k.y; for (let j = 1; j < k.q.length; j += 3) { const q = k.q[j], dx = q.x - px, dy = q.y - py, d = Math.hypot(dx, dy); if (d < 0.6) continue; D3.laneQ(Q, FX, 433, px, py, Math.atan2(dy, dx), d, 0.55, T, '#8E6BD0', 0.7, 0.45, 0); px = q.x; py = q.y; } }
      if (k && !k.fading) { Q.sshadow(FX.sx(k.x), FX.sy(k.y) + T * 0.15, T * 1.0, T * 0.4, 0.45 + 0.15 * Math.sin(t * 7), '#3A2A70'); Q.ring(FX.sx(k.x), FX.sy(k.y) + T * 0.15, T * 0.95, VIOLET_HI, 0.55 + 0.25 * Math.sin(t * 7), T * 0.12, 0.4); }
      for (const s of marked) tell(Q, FX, s, T, t, lf);
      if (SH.on()) { const R = rigNow(FX, m), h = R.A.cen; if (h) { const z = h[2] * ZK, kk = 1 / (1 + z * 0.12); Q.sshadow(FX.sx(m.x + h[0]), FX.sy(m.y + h[1] * GY), T * 3.6 * kk, T * 1.6 * kk, 0.32, '#2A2440'); }
        for (const sp of R.A.spikes) Q.sshadow(FX.sx(m.x + sp.p[0]), FX.sy(m.y + sp.p[1] * GY), T * 0.9, T * 0.38, 0.16 / (1 + sp.p[2] * 0.15), '#2A2440'); }
      for (const f of st3(FX).fx) if (f.kind === 'burst') { const u = cl(f.t / f.life); Q.glow(FX.sx(f.x), FX.sy(f.y), T * f.r * (1 + u), f.col, 0.3 * (1 - u), GY); if (!lf) Q.ripple(FX.sx(f.x), FX.sy(f.y), T * f.r * (0.5 + 1.4 * u), f.col, 0.4 * (1 - u), f.seed, GY, 0.1); }
    } finally { F.flush(c); } return true; }
  function tell(Q, FX, s, T, t, lf) { const u = cl(s.age / s.t), col = s.col || VIOLET_HI, sd = s.seed || 1, X = FX.sx(s.x), Y = FX.sy(s.y);
    if (s.geo === 'line') { if (s.done) return; D3.laneQ(Q, FX, 433, s.x, s.y, s.a, s.len, s.w, T, col, 0.9, u * 0.999, sd); Q.glow(X, Y, T * (1 + u), col, 0.1 + 0.2 * u); }
    else if (s.geo === 'circle') { if (s.done) return; const R = s.r * T * 1.15; Q.quad(432, X, Y, R, 0, 0, R, col, 0.95, u * 0.999, sd, s.ord != null ? +s.ord : 0); }
    else if (s.geo === 'cone') { if (s.done) return; const R = s.len * T; Q.quad(434, X, Y, R, 0, 0, R, col, 0.9, u * 0.999, Math.atan2(Math.sin(s.a), Math.cos(s.a)), s.spread); } }
  /* the upper light: the eye's light, the runes' glow, the spikes' points, the three tentacles of light, the shield and the threads
     of the mirror, the weave's ring over the pet, the bursts. Returns false without the painter */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !m) return false; const F = D3.fg(); if (!F) return false; const S = st3(FX), gl = SH.on(), lf = lowFx(), R = gl ? rigNow(FX, m) : null, E = S.end;
    const Q = F.begin(c, null);
    try {
      if (R && R.A.eye) { const e = scr(FX, m, R.A.eye, T), slump = M.slump || 0, gk = (0.25 + (M.menace || 0) * 0.3 + (M.flare || 0) * 0.5 + slump * 0.4) * (E ? 1 - sstep(0.8, 2.2, E.t) : 1);
        Q.glow(e[0], e[1], T * R.A.s * 1.2, VIOLET, Math.min(0.8, gk * 0.7)); if ((M.flare || 0) > 0.05) Q.glow(e[0], e[1], T * R.A.s * 0.7, VIOLET_HI, M.flare * 0.6);
        if (!E && (m.stunT > 0 || slump > 0.4)) for (let j = 0; j < 3; j++) { const a = (M.bt || t) * 3 + j * TAU / 3; Q.star(e[0] + Math.cos(a) * T * 2.2, e[1] - T * 2.6 + Math.sin(a) * T * 0.5, T * 0.28, 0.9, '#FFFFFF'); }
        const men = (M.menace || 0) + (M.flare || 0) * 0.5; if (!E) for (const sp of R.A.spikes) { const k2 = Math.min(0.8, men * 0.35 + (sp.v ? 0.6 : 0)); if (k2 > 0.05) { const q = scr(FX, m, sp.tip, T); Q.glow(q[0], q[1], T * 0.9, sp.i % 2 ? GOLD_HI : VIOLET_HI, k2); } } }
      if (!E) tentacles(Q, FX, m, M, T, t, lf);
      // the shield while the mirror walks: a shell of silver light round the head, facets glinting, a thread of violet back to the mirror
      const sk = M.shieldK || 0, k = M.copy; if (sk > 0.02 && !m.dead && R) { const hc = scr(FX, m, R.A.cen, T), rx = T * 4.6, ry = T * 4.1;
        Q.glow(hc[0], hc[1], rx, '#9E8AD8', sk * 0.12, ry / rx); Q.ring(hc[0], hc[1], rx, SILVER_HI, sk * (0.5 + 0.2 * Math.sin(t * 5)), T * 0.16, ry / rx);
        if (!lf) for (let j = 0; j < 7; j++) { const a = t * 0.6 + j * TAU / 7; Q.star(hc[0] + Math.cos(a) * rx, hc[1] + Math.sin(a) * ry, T * (0.2 + 0.08 * Math.sin(t * 4 + j)), sk * 0.8, '#FFFFFF'); }
        if (k && !k.fading) arcBeam(Q, hc[0], hc[1], FX.sx(k.x), FX.sy(k.y) - T * 0.7, T * 3, T * 0.08, VIOLET_HI, sk * 0.45, 8); }
      if (k && !k.fading) { const X = FX.sx(k.x), Y = FX.sy(k.y); Q.glow(X, Y - T * 0.7, T * 1.3, VIOLET, 0.45 + 0.15 * Math.sin(t * 6));
        if (k.snare > 0 || k.held) { for (let j = 0; j < 6; j++) { const a = j / 6 * TAU + t * 0.8, r0 = T * (k.held ? 0.7 : 1.1 + 0.15 * Math.sin(t * 9 + j)); arcBeam(Q, X + Math.cos(a) * r0, Y - T * 0.2 + Math.sin(a) * r0 * 0.4, X + Math.cos(a + 1) * T * 0.3, Y - T * 1.0 + Math.sin(a) * T * 0.3, T * 0.6, T * 0.05, GOLD_HI, 0.75, 4); }
          if (!k.held) { const u = clamp(k.snare / (FX.S.lv >= 2 ? 5 : 6), 0, 1); Q.quad(435, X, Y - T * 2.4, T * 0.55, 0, 0, T * 0.55, GOLD_HI, 0.9, u, 1); }
          if (k.held) { const L = loomFrame(FX.C), LX = FX.sx(L[0]), LY = FX.sy(L[1]) - T * 1.8; for (let j = 0; j < 3; j++) arcBeam(Q, LX + (j - 1) * T * 0.5, LY, X, Y - T * 0.9, T * 2.5, T * (0.07 - j * 0.015), j % 2 ? GOLD_HI : '#FFF4D0', 0.5 + 0.3 * Math.sin(t * 5 + j), 10); } } }
      const L = loomFrame(FX.C), on = k && k.snare > 0 && !k.held, ch = clamp((M.chan || 0) / WEAVE, 0, 1); { const LX = FX.sx(L[0]), LY = FX.sy(L[1]), top = LY - T * 4.15 * ZK, glow = on ? 0.6 + 0.3 * Math.sin(t * 6) : (k && k.held ? 0.8 : 0.15);
        Q.glow(LX, top, T * 0.9, VIOLET_HI, on || (k && k.held) ? 0.6 : 0.15); if (glow > 0.2) Q.glow(LX, LY - T * 1.8, T * 2.6, GOLD_HI, glow * 0.3);
        const sp = on && ch > 0 ? t * 9 : t * 0.9, sx = LX + Math.sin(sp) * T * 1.0, sy = LY - T * (1.42 + (0.55 + ch * 0.4)) * ZK; Q.star(sx, sy, T * 0.3, 0.7, GOLD_HI); Q.glow(sx, sy, T * 0.4, GOLD_HI, 0.35); }
      for (const f of S.fx) { const u = cl(f.t / f.life); if (f.kind !== 'burst') continue; const X = FX.sx(f.x), Y = FX.sy(f.y) - (f.z || 0) * T; Q.glow(X, Y, T * f.r * (0.8 + 0.8 * u), f.col, 0.5 * (1 - u)); Q.glow(X, Y, T * f.r * 0.35, '#FFFFFF', 0.55 * (1 - u) * (1 - u)); Q.ring(X, Y, T * f.r * (0.4 + 1.3 * u), f.col, 0.5 * (1 - u), T * 0.14);
        if (!lf) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + f.seed, d = T * f.r * (0.3 + 1.3 * u); Q.star(X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.8, T * 0.3, 0.8 * (1 - u), i % 2 ? '#FFFFFF' : f.col); } }
    } finally { F.flush(c); }
    weaveLabel(c, FX, T); return true; }
  /* a curved thread of light: from (x0, y0) to (x1, y1) bowed up by h, in n links (each feathered into the next) */
  function arcBeam(Q, x0, y0, x1, y1, h, w, col, al, n) { let px = x0, py = y0; const cy = Math.min(y0, y1) - h; for (let i = 1; i <= n; i++) { const u = i / n, x = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * (x0 + x1) / 2 + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * cy + u * u * y1; Q.rbeam(px, py, x, y, w, col, al, 1, 1); px = x; py = y; } }
  /* the three tentacles of light under the head (the 2D's own curls, rears and lashes): each a ribbon of light tapering to its tip, a
     white core down it, motes running down it, a bloom at its tip */
  function tentacles(Q, FX, m, M, T, t, lf) { if (m.dead) return; const H = headFrame(FX, m, M, headPos(m, M)), slump = M.slump || 0, bt = M.bt || t, unf = M.unfold == null ? 1 : M.unfold;
    const yawM = headOf(H.yaw), Fm = [Math.cos(yawM), Math.sin(yawM), 0], Nf = nrm(vadd(vmul(Fm, 0.75), CW)); let U0 = nrm(vsub([0, 0, 1], vmul(Nf, Nf[2])));
    const rootM = vsub(toM(H.cen, m), vmul(U0, H.s * 1.15)), root = [m.x + rootM[0], m.y + rootM[1] * GY, rootM[2] * ZK], NP = lf ? 10 : 16, sx = q => FX.sx(q[0]), sy = q => FX.sy(q[1]) - q[2] * T;
    for (let i = 0; i < 3; i++) { const Kk = M.lashK ? M.lashK[i] : 0, Wd = M.lashW ? M.lashW[i] : 0, A = M.lashA ? M.lashA[i] : 0, sw = M.sweepK || 0, col = i === 1 ? GOLD_HI : VIOLET_HI, core = i === 1 ? '#FFF6DA' : '#F4EEFF', P = [];
      const swA = (M.sweepA || 0) + (i - 1) * 0.45 + (1 - sw) * 0.9 - 0.45, lashA = sw > 0.02 ? swA : A, ext = Math.max(Kk, sw);
      for (let j = 0; j <= NP; j++) { const u = j / NP, th = i * TAU / 3 + Math.sin(bt * 0.3 + i) * 0.35 + u * (0.35 + Math.sin(bt * 0.6 + i) * 0.15) + Math.sin(bt * 1.6 - u * 3.2 + i * 2) * 0.22 * u, r = u * (5.2 + Math.sin(bt * 0.9 + i) * 0.5) * unf;
        let q = [root[0] + Math.cos(th) * r, root[1] + Math.sin(th) * r * 0.9, root[2] * (1 - Math.pow(u, 1.1) * 0.75) + Math.sin(bt * 1.8 - u * 4 + i) * 0.45 * u];
        if (Wd > 0) { const ca = Math.cos(A), sa = Math.sin(A), qq = [root[0] - ca * u * 1.6 + Math.sin(u * 9 + bt * 14) * 0.15 * u, root[1] - sa * u * 1.6, root[2] + u * 2.6 + Math.sin(u * 4 + bt * 6) * 0.3]; q = q.map((x, k) => lerp(x, qq[k], Wd)); }
        if (ext > 0) { const ca = Math.cos(lashA), sa = Math.sin(lashA), d = u * 10.5, wv = Math.sin(u * 10 - bt * 16) * 0.3 * (1 - u * 0.5), qq = [m.x + ca * d - sa * wv, m.y + sa * d + ca * wv, lerp(root[2], 0.35, Math.sqrt(u))]; q = q.map((x, k) => lerp(x, qq[k], Math.min(1, ext * 1.4))); }
        if (slump > 0) { const qq = [root[0] + Math.cos(th) * u * 3.6, root[1] + Math.sin(th) * u * 3, lerp(root[2], 0.1, Math.min(1, u * 3))]; q = q.map((x, k) => lerp(x, qq[k], slump)); }
        P.push([sx(q), sy(q)]); }
      const dim = (1 - slump * 0.6) * unf, bright = 1 + Wd * 0.4 + ext * 0.6;
      for (let j = 0; j < NP; j++) { const u = j / NP, u1 = (j + 1) / NP, a0 = 1 - u * 0.55, a1 = 1 - u1 * 0.55, w = T * (1.15 - u * 0.85);
        { const dx = (P[j + 1][0] - P[j][0]) / 2, dy = (P[j + 1][1] - P[j][1]) / 2, ll = Math.hypot(dx, dy) || 1, hw = w * 0.42; Q.quad(433, P[j][0] + dx, P[j][1] + dy, dx, dy, -dy / ll * hw, dx / ll * hw, col, 1, 2 + Math.min(1, 0.85 * dim * bright) * (0.55 + 0.45 * a0), 0, 0); }   // (its body laid over the bright marble, end to end)
        /* (the ribbon is laid over, end to end, its white core in it: no chain of added links, which would bead at their joints) */ }
      if (!lf) for (let k2 = 0; k2 < 4; k2++) { const u = (bt * 0.5 + k2 / 4 + i * 0.13) % 1, j = Math.min(NP - 1, Math.floor(u * NP)), e = u * NP - j; Q.star(lerp(P[j][0], P[j + 1][0], e), lerp(P[j][1], P[j + 1][1], e), T * 0.2, 0.8 * dim, core); }
      Q.glow(P[NP][0], P[NP][1], T * 0.9, col, 0.5 * dim * bright); } }
  /* the weave's ring over the pet and its word (as the 2D) */
  function weaveLabel(c, FX, T) { const M = FX.mem, k = M.copy; if (!((M.chan || 0) > 0.02 && k && k.snare > 0)) return; const me = FX.me, X = FX.sx(me.x), Y = FX.sy(me.y) - T * 2.2, u = clamp(M.chan / WEAVE, 0, 1);
    c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = Math.max(4, T * 0.2); c.beginPath(); c.arc(X, Y, T * 0.55, 0, TAU); c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(3, T * 0.14); c.beginPath(); c.arc(X, Y, T * 0.55, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke();
    c.font = `900 ${Math.round(T * 0.32)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText('WEAVING', X, Y - T * 0.95); c.fillText('WEAVING', X, Y - T * 0.95); c.restore(); }
  function loomWord(c, FX, X, Y, T) { const M = FX.mem || {}, k = M.copy, on = !!(k && k.snare > 0 && !k.held); if (!on) return; c.save(); c.font = `800 ${Math.round(T * 0.3)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; const s = 'WEAVE · stand here', y = Y - T * 4.5; c.strokeText(s, X, y); c.fillText(s, X, y); c.restore(); }

  /* ================= the motion, the fall ================= */
  function update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M || !(dt > 0)) return; const S = st3(FX);
    for (let i = S.fx.length - 1; i >= 0; i--) { const f = S.fx[i]; f.t += dt; if (f.t >= f.life) S.fx.splice(i, 1); }
    const E = S.end; if (!E) return; E.t += dt;
    if (E.t > 0.75 && !E.landed) { E.landed = true; FX.H.shake(lowFx() ? 6 : 12, 0.45); FX.H.sfx.crash(); FX.H.sfx.crack(); const R = rigNow(FX, m), c0 = R && R.A.cen ? R.A.cen : [0, 0, 1], x = m.x + c0[0], y = m.y + c0[1] * GY;
      if (D3.fg()) S.fx.push({ kind: 'burst', x, y, z: c0[2] * ZK, r: 2.6, col: VIOLET_HI, t: 0, life: 1.0, seed: 3 });
      for (let i = 0; i < (lowFx() ? 10 : 22); i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 4; FX.H.part({ kind: 'shard', x, y: y - c0[2] * ZK, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 2.5, g: 8, life: 0.8, max: 1, size: 3 + Math.random() * 3, rot: Math.random() * 3, vr: 8, color: i % 3 ? SILVER_HI : VIOLET_HI }); }
      FX.H.text(m.x, m.y - 4.5, 'Its reflection dims', VIOLET_HI, 15); } }
  function die(FX, m) { const S = st3(FX); if (S.end) return; S.end = { t: 0, landed: false }; FX.H.sfx.hum(); }
  function preload(P) { if (!P || !P.gl) return []; return [() => { SH.on(); }, () => { if (!SH.on()) return; const cv = document.createElement('canvas'); cv.width = cv.height = 16; const c = cv.getContext('2d');
    try { D3.glPass(c, K.mkView(0, 0, 0, 0, { T: 4, sx: v => 8 + v, sy: v => 8 + v }), Object.keys(SH.MESH).map((k2, i) => ({ part: k2, R: I3(), o: [0, 0, i * 0.01], s: 0.2 })), 1, { t: 0, light: 'gallery' }, SH); } catch (e) { /* (the 2D head) */ } cv.width = cv.height = 1; }]; }
  D3.onRelease(() => { LAST = null; });
  function studio(c, x, y, FX, m, o) { o = o || {}; if (!SH.on()) return null; const T = o.T || 30, R = rig(FX, m, FX.mem.bt || 2); const V = K.mkView(m.x, m.y, 0, 0, { T, sx: v => x + (v - m.x) * T, sy: v => y + (v - m.y) * T }); return drawRig(c, R, V, { t: FX.mem.bt || 2 }) ? R : null; }
  function studioLoom(c, x, y, T, lit, lv) { if (!SH.on()) return false; const V = K.mkView(0, 0, 0, 0, { T, sx: v => x + v * T, sy: v => y + v * T }); return D3.glPass(c, V, [{ part: 'loom', R: I3(), o: [0, 0, 0], s: 1, glow: lit ? 1.2 : 0.15, wear: 0.4 }, { part: 'cloth' + (lv || 1), R: I3(), o: [0, 0, 0], s: 1, glow: lit ? 0.8 : 0, wear: 0.3 }], 1, { t: 0, light: 'gallery' }, SH); }
  return { on: () => SH.on(), fx: () => !!D3.fg(), update, drawBoss, drawFx, overlay, drawLoom, loomWord, die, preload, studio, studioLoom, rig: rigNow,
    __dbg: { get gl() { return SH.on(); }, get glmCanvas() { const cv = typeof GLM !== 'undefined' && GLM.canvas; return cv ? cv.width * cv.height : 0; }, set noGL(v) { SH.NOGL = !!v; }, get MESH() { return SH.MESH; }, get last() { return LAST; }, get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +SH.ms.toFixed(2), frames: SH.n, box: SH.box, meshMs: +SH.meshMs.toFixed(1), meshTris: SH.tris }); } } };
})();

/* ---------- (v463 SA) the hooks: Vaul's definition (20z2) drawn on the GPU where it can be (wrapped at load, as Threnn's) ---------- */
(function hookVaul() { try {
  const D = typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.vaul; if (!D || D.__sa3) return; D.__sa3 = 1; const G = VAUL_GL, glOn = () => G.on();
  const o = { init: D.init, update: D.update, draw: D.draw, drawFx: D.drawFx, overlay: D.overlay, drawProp: D.drawProp, keep: D.keep };
  D.init = function (FX) { SEP3.wrapFX(FX); FX.mem.g3 = null; return o.init.call(this, FX); };
  D.update = function (FX, dt) { const M = FX.mem, m = FX.m, S = M && M.g3, E = S && S.end;
    if (E && m) { if (E.t > 2.8) { G.update(FX, dt); return; } o.update.call(this, FX, dt); M.slump = Math.min(1, (M.slump || 0) + dt * 2.2); M.alt = Math.max(1.0, (M.alt || ALT0) - dt * 6); M.menace = 0; M.flare = 0; M.vol = []; G.update(FX, dt); return; }
    o.update.call(this, FX, dt); G.update(FX, dt); };
  const ALT0 = 3.9;
  Object.defineProperty(D, 'keep', { configurable: true, get() { return glOn() ? null : o.keep; } });
  D.draw = function (c, FX, m, X, Y, T, t, step) { if (glOn() && G.drawBoss(c, FX, m, X, Y, T, t)) return; return o.draw.call(this, c, FX, m, X, Y, T, t, step); };
  D.overlay = function (c, FX, t, T) { if (FX.m && G.overlay(c, FX, t, T)) return; return o.overlay.call(this, c, FX, t, T); };
  D.drawFx = function (c, FX, T, t) { if (G.drawFx(c, FX, T, t)) return; return o.drawFx.call(this, c, FX, T, t); };
  D.drawProp = function (c, FX, p, X, Y, T, t) { if (p.kind === 'vaulHusk') { const m = FX.m; if (m && glOn()) G.drawBoss(c, FX, m, FX.sx(m.x), FX.sy(m.y), T, t); return; }
    if (p.kind === 'loom' && glOn() && G.drawLoom(c, FX, p, X, Y, T, t)) { G.loomWord(c, FX, X, Y, T); return; } return o.drawProp.call(this, c, FX, p, X, Y, T, t); };
  D.preload = function (P) { return G.preload(P); };
  D.ending = function (FX, m) { if (!glOn()) return null; const M = FX.mem; FX.noParts(); FX.weak('eye', 0, 0, 0, 0, false); FX.S.tele.length = 0; M.vol = []; M.rec = null; M.gl = null; m.stunT = 0;
    if (M.copy) { if (M.copy.zone) M.copy.zone.life = Math.min(M.copy.zone.life, 0.3); M.copy = null; }
    if (!M.husk) { M.husk = { kind: 'vaulHusk', x: m.x, y: m.y + 0.05 }; FX.S.props.push(M.husk); } G.die(FX, m);
    return { title: 'VAUL FALLS DARK', sub: 'The diamond strikes the marble, and its eye closes', col: '#C9B0FF', delay: 4.4, bannerAt: 1.3, fanfareAt: 1.3, quiet: true, slow: 0.5 }; };
  D.MODEL = G;
} catch (e) { if (typeof console !== 'undefined') console.warn('Vaul GL hook', e); } })();
