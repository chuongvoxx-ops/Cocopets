/* ---------- (v415 TI) Titan on the GPU: the golem as a real 3D model on GLM, and the 3D pieces of its effects ----------
   The golem (20k2j's design: ~120 convex rock solids on a rig of hips, chest, head, clavicles, arms, hands with jointed
   fingers, legs and feet) is built once per level tier into GLM meshes - every stone's faces as flat facets with worn edges,
   its fractures as thin strips that smoulder and light gold in an attack, the engraved Celestial markings, the eyes,
   raised moss cushions with small fern fronds on them, the jaw's seam - one merged mesh per bone (each stone's stretch of
   indices kept, so the crumble can throw them one by one), the Worldbreaker's gauntlet stones and core apart. It is posed
   live every frame from 20k2j's own rig and key poses (rising, walking, punch, backhand, slam, Worldbreaker, departure) and
   drawn by GLM (materials 140-146: rough stone with lumps, pits, fissures, lichen, worn edges and moss on what faces up; a
   charcoal core that smoulders between the plates; moss; ember fractures; white-green eyes; gauntlet basalt; amber
   crystal), at its 2D picture's screen size, with an ink outline; the rendered image is laid on the game canvas with the
   golem's own alpha, so a fade never shows its inside. Nothing below the floor is drawn while it rises or sinks.
   Effects' 3D pieces go to Genbu's G3D painter (20k2m: stone and dust in true 3D with a depth buffer): angular rocks, slabs,
   spires, dust billows, through a small pooled particle system (fxPool); the floor light and fractures go to the shared
   FGFX painter (Titan's kinds 88-91 in 20k6h). Real-GPU WebGL only (a software rasteriser: window.__NG_GL = 1 and
   __GB_GL = 1, as the tests set); window.__TTN_GL = 0 turns it off. Without it 20k2j keeps its 2D golem and effects.
   Preparation: warm(tier) builds the meshes in idle-time slices when a floor starts with Titan in a kit (no hitch on the
   cast) and uploads them with one tiny render. Memory: a tier's meshes ~25k vertices (~1 MB of buffers). */
const TITAN_GPU = (() => {
  const TAU = Math.PI * 2, GK = GeoKit, SE = GK.SE, CE = GK.CE;
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const { add, sub, mul, dot, cross, norm, mm, mv } = GK;
  const WS = 0.1;   // GLM world units a model unit (keeps the golem inside GLM's depth range)
  const MT = { ST: 140, CORE: 141, MOSS: 142, VEIN: 143, EYE: 144, GNT: 145, CRY: 146, LEAF: 22 };
  const LIB = () => { try { const t = ELEM_IMPL.earth.ult.titan; return t && t.lib; } catch (e) { return null; } };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rngOf = s => { let x = (Math.floor(s * 1000) >>> 0) || 7; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; };
  const cols = R => [[R[0], R[3], R[6]], [R[1], R[4], R[7]], [R[2], R[5], R[8]]];
  const frameZ = nz => { nz = norm(nz); const a = Math.abs(nz[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], x = norm(cross(a, nz)); return [x, cross(nz, x), nz]; };

  /* ================= the meshes ================= */
  // a fracture or a marking: a strip along a polyline lying on a face (n its normal), w wide, tapering at its ends
  function strip(B, pts, n, w, mat) {
    const N = pts.length; if (N < 2) return; const cum = [0]; for (let i = 1; i < N; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const side = pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)]; return norm(cross(n, norm(sub(b, a)))); }), lift = mul(n, 0.05);
    const at = u => Math.max(0, Math.min(N - 1, Math.round(u * (N - 1))));
    B.surf((u, v) => { const i = at(u), tp = Math.min(1, Math.min(i, N - 1 - i) * 0.45 + 0.4); return add(add(pts[i], lift), mul(side[i], (v - 0.5) * w * tp)); }, N - 1, 1, () => mat, { e: u => cum[at(u)], a: (u, v) => v });
  }
  // a raised moss cushion on a face (p its place, n the face's normal, s its size)
  function clump(B, p, n, s, rnd) {
    const F = frameZ(n); B.push(F[0], F[1], F[2], p);
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + rnd() * 0.8, d = k ? (0.4 + 0.5 * rnd()) * s : 0, r = (0.45 + 0.25 * rnd()) * s * (k ? 0.8 : 1.05); B.ell([Math.cos(a) * d, Math.sin(a) * d, -0.06 * s], [r, r * (0.85 + 0.2 * rnd()), r * 0.62], MT.MOSS + 0.2, { seg: 9, rings: 4, th1: Math.PI * 0.6 }); }
    B.pop();
  }
  // small fern fronds and grass on a cushion: thin curved blades in the leaf material (along 0 root .. 1 tip, across 0..1)
  function tuft(B, p, n, s, rnd) {
    const F = frameZ(n); B.push(F[0], F[1], F[2], p); const nb = 4 + Math.floor(rnd() * 3);
    for (let k = 0; k < nb; k++) { const a = rnd() * TAU, L = (1.0 + 0.8 * rnd()) * s, lean = 0.3 + 0.55 * rnd(), w = 0.17 * s * (0.8 + 0.5 * rnd()), dx = Math.cos(a), dy = Math.sin(a);
      B.surf((u, v) => { const h = u * L, out = lean * h + 0.3 * h * h / L, sw = (v - 0.5) * 2 * w * Math.sin(Math.PI * Math.min(1, u * 0.95 + 0.05)); return [dx * out - dy * sw, dy * out + dx * sw, 0.25 * s + h * (1 - 0.3 * lean * u)]; }, 4, 2, () => MT.LEAF, { e: u => u, a: (u, v) => v }); }
    B.pop();
  }
  // one stone's mesh: its faces, fractures, markings, seams, cushions; in its bone's frame (inBone) or its own
  function partMesh(Pt, q, inBone, tier) {
    const B = GLM.builder(q), m = Pt.m, R = Pt.R, C = cols(R), rnd = rngOf(Pt.sid * 1.37 + 3);
    if (inBone) B.push(C[0], C[1], C[2], Pt.t);
    const base = Pt.mat === 'dark' ? MT.CORE : Pt.mat === 'gaunt' ? MT.GNT : Pt.mat === 'crys' ? MT.CRY : MT.ST + (Pt.sid & 1 ? 0.2 : 0);
    for (let i = 0; i < m.f.length; i++) B.facet(m.f[i].map(k => m.v[k]), Pt.moss && Pt.moss[i] ? MT.MOSS : base);
    for (const cr of Pt.cr || []) strip(B, cr.pts, m.fn[cr.fi], cr.br ? 0.34 : 0.5, MT.VEIN);
    for (const en of Pt.en || []) strip(B, en.pts, m.fn[en.fi], 0.2, MT.VEIN + 0.3);
    for (const L of Pt.seam || []) strip(B, L, [1, 0, 0], 0.24, MT.CORE);
    for (const c of Pt.cl || []) { clump(B, c.p, m.fn[c.fi], c.s * 1.05, rnd); if (rnd() < 0.75) tuft(B, c.p, m.fn[c.fi], c.s * 0.9, rnd); }
    if (inBone) B.pop();
    return B.done();
  }
  // meshes merged into one (index stretches kept)
  function merge(list) {
    let nv = 0, ni = 0; for (const m of list) { nv += m.nv; ni += m.idx.length; }
    const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), att = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni), rg = [];
    let v0 = 0, i0 = 0; for (const m of list) { pos.set(m.pos, v0 * 3); nrm.set(m.nrm, v0 * 3); att.set(m.att, v0 * 3); for (let i = 0; i < m.idx.length; i++) idx[i0 + i] = m.idx[i] + v0; rg.push([i0, m.idx.length]); v0 += m.nv; i0 += m.idx.length; }
    return { mesh: { pos, nrm, att, idx, nv, ntri: ni / 3, gl: null }, rg };
  }
  const HO = [1.5, 0, 0.35], EYEX = 0.85;   // the head's place forward of its bone (model units)
  const REGION = b => /^(clav)/.test(b) ? 'sh' : /^(ua|fa)/.test(b) ? 'arm' : /^(hand|f\d|t\d)/.test(b) ? 'fist' : /^(th|sh|ft)/.test(b) ? 'leg' : 'chest';
  const TIERS = {};
  function* gen(tier) {
    const L = LIB(), Mdl = L.model(tier), q = lowFx() ? 0.7 : 1, byBone = {}, D = TIERS[tier];
    for (const Pt of Mdl.parts) {
      if (Pt.lazy) { Pt.fin(); yield; }
      if (Pt.ey) { D.eyesP = Pt.eyesP; const B = GLM.builder(q); for (const e of Pt.eyesP) { B.ell([e[0] + 0.45, e[1], e[2]], [0.48, 0.66, 0.5], MT.CORE, { seg: 10, rings: 6 }); B.ell([e[0] + EYEX, e[1], e[2] - 0.04], [0.3, 0.34, 0.28], MT.EYE, { seg: 10, rings: 6 }); }   // (a dark socket, the light set out to the brow's edge, so it shows from above)
        (byBone[Pt.b] = byBone[Pt.b] || []).push({ Pt, mesh: B.done(), c: Pt.eyesP[0].map((v, i) => (v + Pt.eyesP[1][i]) / 2), r: 1.2, eye: 1 }); continue; }
      if (Pt.core) { D.cores.push(Pt); continue; }
      if (Pt.gaunt) { D.gnt.push({ Pt, mesh: partMesh(Pt, q, false, tier) }); yield; continue; }
      const mesh = partMesh(Pt, q, true, tier), c = add(Pt.t, mv(Pt.R, Pt.m.cen));
      (byBone[Pt.b] = byBone[Pt.b] || []).push({ Pt, mesh, c, r: Pt.m.rad * 1.15 }); yield;
    }
    for (const b in byBone) {
      const L2 = byBone[b], { mesh, rg } = merge(L2.map(e => e.mesh));
      if (b === 'head') { for (let i = 0; i < mesh.pos.length; i += 3) { mesh.pos[i] += HO[0]; mesh.pos[i + 1] += HO[1]; mesh.pos[i + 2] += HO[2]; } for (const e of L2) e.c = add(e.c, HO); }   // (the head set forward of the breast plates: the 2D picture only paints it over them)
      let cx = 0, cy = 0, cz = 0; for (const e of L2) { cx += e.c[0]; cy += e.c[1]; cz += e.c[2]; } const cen = [cx / L2.length, cy / L2.length, cz / L2.length]; let r = 0; for (const e of L2) r = Math.max(r, Math.hypot(e.c[0] - cen[0], e.c[1] - cen[1], e.c[2] - cen[2]) + e.r);
      D.bones.push({ b, mesh, cen, r, reg: REGION(b), parts: L2.map((e, i) => ({ Pt: e.Pt, first: rg[i][0], cnt: rg[i][1], c: e.c, r: e.r, eye: e.eye })) }); yield;
    }
    { const B = GLM.builder(q); B.ell([0, 0, 0], [1, 1, 1], MT.CRY, { seg: 14, rings: 9 }); D.coreMesh = B.done(); }
    D.nv = D.bones.reduce((s, e) => s + e.mesh.nv, 0) + D.gnt.reduce((s, e) => s + e.mesh.nv, 0);
    D.ready = true; D.msBuilt = nowMs();
  }
  function tierData(tier) { return TIERS[tier] || (TIERS[tier] = { tier, bones: [], gnt: [], cores: [], ready: false, up: false, it: null, ms: 0 }); }
  /* build a slice (ms) of a tier's meshes */
  function step(tier, ms) { const D = tierData(tier); if (D.ready) return true; if (!LIB() || typeof GLM === 'undefined') return false; D.it = D.it || gen(tier); const t0 = nowMs(), until = t0 + ms; while (!D.ready && nowMs() < until) D.it.next(); D.ms += nowMs() - t0; return D.ready; }

  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0;
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Titan GL: ' + String(e && e.message || e)); } catch (e2) {} };
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  function usable() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__TTN_GL') === 0 || !LIB() || typeof GLM === 'undefined' || !GLM.ok()) return false;
    try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX, G = self.GENBU_MOVES && self.GENBU_MOVES.G3D; if (!F || !F.usable() || !G || !G.usable()) return false; } catch (e) { return false; }
    if (GLM.soft && !(flag('__TTN_GL') === 1 || flag('__NG_GL') === 1)) return false;
    return true;
  }
  /* idle-time preparation (a floor starting with Titan in a kit): the meshes in small slices, then one tiny render uploads them */
  let IDLE = {};
  function warm(tier) {
    if (!usable()) return false; const D = tierData(tier); if (D.up || IDLE[tier]) return true; IDLE[tier] = 1;
    const go = () => { const run = ms => { try { if (!step(tier, ms)) return go(); if (!D.up) upload(D); } catch (e) { fail(e); } IDLE[tier] = 0; };
      if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => run(dl.didTimeout ? 2 : Math.max(1, Math.min(6, dl.timeRemaining() - 1))), { timeout: 150 }); else setTimeout(() => run(2), 30); };
    go(); return true;
  }
  function upload(D) { if (D.up || !D.ready || !GLM.ok()) return; const items = []; const I = [1, 0, 0], Z = [0, 0, 0];
    const it = mesh => ({ mesh, R0: new Float32Array([0.001, 0, 0]), R1: new Float32Array([0, 0.001, 0]), R2: new Float32Array([0, 0, 0.001]), T: new Float32Array(Z), alpha: 1, glow: 0, kind: 0, wear: 1 });
    for (const b of D.bones) items.push(it(b.mesh)); for (const g of D.gnt) items.push(it(g.mesh)); items.push(it(D.coreMesh));
    GLM.render(4, 4, { px: I, py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 }, items); D.up = true; }

  /* ================= drawing the golem ================= */
  const LW = GK.LD, SBW = norm([-0.2, -0.38, 0.9]), RIMW = norm([0.55, -0.72, 0.42]), PXW = [1, 0, 0], PYW = [0, SE, -CE], PDW = [0, CE, SE], UPW = [0, 0, 1];
  const RIMC = [0.85, 0.72, 0.55], AMBC = [1.38, 1.32, 1.24], OUTC = [0.09, 0.07, 0.055], GLCAP = 1500;
  const POOL = [], ITEMS = []; let NP = 0;
  const item = () => { const g = POOL[NP] || (POOL[NP] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); NP++; return g; };
  const setIt = (g, mesh, R, T, s, glow, o) => { g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = R[i * 3] * s; g.R1[i] = R[i * 3 + 1] * s; g.R2[i] = R[i * 3 + 2] * s; g.T[i] = T[i]; } g.alpha = 1; g.glow = glow; g.glow2 = o ? o.glow2 || 0 : 0; g.spill = o ? o.spill || 0 : 0; g.kind = 0; g.wear = 1; g.fx = 0; g.first = o && o.first || 0; g.cnt = o && o.cnt || 0; g.outline = true; ITEMS.push(g); };
  const STATS = { ms: 0, n: 0, items: 0, W: 0, H: 0 };
  /* o: X, Y (the feet on screen), K (px a model unit), yaw, P (a pose), tier, glow {chest, sh, arm, fist, leg, gaunt}, eye, gaunt, gbreak,
     sink (model units down), scale, clip (nothing below the floor), crumble (s since it began, or < 0), alpha, ink. Returns the
     screen points the effects need ({ fistL, fistR, footL, footR, chest, head, eyes, bb }) or null when it cannot draw */
  function drawGolem(c, o) {
    const D = TIERS[o.tier]; if (!D || !D.ready || NOGL) return null;
    try {
      const L = LIB(), B = L.rig(o.P, L.D0), Rh = GK.rz(o.yaw || 0), s = (o.scale || 1), sw = WS * s, zs = -(o.sink || 0), k = o.K / WS, X0 = o.X, Y0 = o.Y, gl = o.glow || {}, tier = o.tier, spill = tier >= 3 ? 1 : 0;
      const W3 = p => { const w = mv(Rh, p); return [w[0] * sw, w[1] * sw, (w[2] + zs) * sw]; };   // model -> GLM world
      const SX = w => X0 + w[0] * k, SY = w => Y0 + (w[1] * SE - w[2] * CE) * k;
      ITEMS.length = 0; NP = 0; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      const box = (w, r) => { const x = SX(w), y = SY(w), rr = r * k; if (x - rr < bx0) bx0 = x - rr; if (x + rr > bx1) bx1 = x + rr; if (y - rr < by0) by0 = y - rr; if (y + rr > by1) by1 = y + rr; };
      const cr = o.crumble == null ? -1 : o.crumble;
      for (const bn of D.bones) {
        const b = B[bn.b]; if (!b) continue; const Rw = mm(Rh, b.R), Tw = W3(b.t), glow = gl[bn.reg] || 0, g2 = bn.b === 'head' ? (o.eye == null ? 1 : o.eye) : 0;
        if (cr < 0) { setIt(item(), bn.mesh, Rw, Tw, sw, glow, { glow2: g2, spill }); box(W3(add(b.t, mv(b.R, bn.cen))), bn.r * sw); continue; }
        // the crumble: each stone of the bone drops, drifts and tumbles to the floor, then the rubble sinks
        for (const p of bn.parts) { const Pt = p.Pt, u = cl((cr - (Pt.cd || 0)) / 0.85), e = u * u, pm = add(b.t, mv(b.R, p.c)), wc = mv(Rh, pm); wc[2] += zs;
          const out = norm([wc[0] + 1e-3, wc[1], 0]), ex = 1 - Math.pow(1 - u, 2), rest = Math.max(0.4, (Pt.rest || 1));
          const bnc = u >= 1 ? Math.sin(cl((cr - (Pt.cd || 0) - 0.85) / 0.3) * Math.PI) * 0.6 * (1 - cl((cr - (Pt.cd || 0) - 0.85) / 0.3)) : 0;
          const pz = lerp(wc[2], rest, e) + bnc - 3.2 * sstep(1.0, 1.6, cr), px = wc[0] + ((Pt.cdx || 0) * 0.45 + out[0] * 2.2) * ex, py = wc[1] + ((Pt.cdy || 0) * 0.45 + out[1] * 2.2) * ex;
          const Rc = GK.axisR(Pt.cax || [1, 0, 0], (Pt.cang || 0.5) * 1.7 * ex), Rw2 = mm(Rc, Rw), off = mv(Rw2, p.c), T = [(px - off[0]) * sw, (py - off[1]) * sw, (pz - off[2]) * sw];
          setIt(item(), bn.mesh, Rw2, T, sw, 0, { glow2: p.eye ? (o.eye || 0) : 0, first: p.first, cnt: p.cnt }); box([px * sw, py * sw, pz * sw], p.r * sw); }
      }
      // the gauntlets: rocks lifted from the floor, spiralling in, tumbling, locking round the fists; thrown off when they break; the cores
      const gA = o.gaunt || 0, gB = o.gbreak || 0;
      if (gA > 0.001 && gB <= 1.2) {
        for (const G of D.gnt) { const Pt = G.Pt, gk = cl((gA - Pt.gi * 0.45) / 0.55); if (gk <= 0.001) continue; const b = B[Pt.b]; let Rm = mm(b.R, Pt.R), tm = add(b.t, mv(b.R, Pt.t));
          if (gk < 1) { const e = 1 - Math.pow(1 - gk, 2.2), sa = Pt.gi * TAU + (Pt.b === 'handL' ? 0 : Math.PI), r0 = 12 + 6 * Pt.gi, p0 = [Math.cos(sa + (1 - e) * 2.5) * r0 * (1 - e), Math.sin(sa + (1 - e) * 2.5) * r0 * (1 - e), 0];
            tm = add(GK.lerp3([p0[0], p0[1], 0.6], tm, e), [0, 0, Math.sin(e * Math.PI) * 4]); Rm = mm(Rm, GK.axisR([1, 0.4, 0.2], (1 - e) * 5)); }
          if (gB > 0) { const d = mv(b.R, Pt.gd), u = gB; tm = add(tm, [d[0] * u * 7, d[1] * u * 7, d[2] * u * 4 + u * 5 - u * u * 18]); Rm = mm(Rm, GK.axisR([0.3, 1, 0.5], u * 4)); if (tm[2] < 0.5) tm[2] = 0.5; }
          setIt(item(), G.mesh, mm(Rh, Rm), W3(tm), sw, Math.max(gl.gaunt || 0, (gl.fist || 0) * 0.6), { spill }); box(W3(tm), (Pt.m ? Pt.m.rad : 1.5) * sw); }
        for (const Pt of D.cores) { const gk = cl((gA - 0) / 0.55), b = B[Pt.b], r = Pt.rr * (0.4 + 0.6 * gk) * (gB > 0 ? Math.max(0, 1 - gB * 1.5) : 1) * 0.8; if (r < 0.05) continue; const tm = add(b.t, mv(b.R, Pt.t));
          setIt(item(), D.coreMesh, mm(Rh, b.R), W3(tm), sw * r, 0.5 + (gl.gaunt || 0)); ITEMS[ITEMS.length - 1].outline = false; box(W3(tm), r * sw); }
      }
      if (!(bx1 > bx0) || !ITEMS.length) return null;
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__TTN_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1);
      bx0 = Math.floor(bx0) - 2; by0 = Math.floor(by0) - 2; bx1 = Math.ceil(bx1) + 2; by1 = Math.ceil(by1) + 2;
      let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sc = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sc)); H = Math.max(2, Math.ceil(H * sc));
      const bw = bx1 - bx0, bh = by1 - by0, low = lowFx();
      const S = { px: PXW, py: PYW, pd: PDW, cl: [2 * k / bw, 2 * (X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (Y0 - by0) / bh], v: PDW, lk: LW, ls: SBW, lr: RIMW, up: UPW, low, rim: RIMC, amb: AMBC, t: nowMs() / 1000 % 1000,
        outline: o.ink === false ? 0 : Math.max(0.75, 0.8 * (W / bw)), outlineCol: OUTC, outlineBias: 0.0028, clip: o.clip || cr >= 0 ? [(typeof o.clip === 'number' ? o.clip : -0.15) * WS, 0.0001] : null };
      for (const g of ITEMS) g.alpha = 1;
      const t0 = nowMs(), cvs = GLM.render(W, H, S, ITEMS); if (!cvs) return null;
      const al = o.alpha == null ? 1 : o.alpha; if (al > 0.004) { c.save(); c.globalAlpha = Math.min(1, al); c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); }
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; STATS.items = ITEMS.length; STATS.W = W; STATS.H = H;
      // the points the effects need, on the screen
      const P2 = p => { const w = W3(p); return [SX(w), SY(w)]; }, out = { bb: [bx0, by0, bx1, by1], eyes: [] };
      for (const sd of ['L', 'R']) { const h = B['hand' + sd], fp = add(h.t, mv(h.R, [0, 0, -3.8])); out['fist' + sd] = P2(fp); out['foot' + sd] = P2(B['ft' + sd].t); }
      out.head = P2(add(B.head.t, mv(B.head.R, HO))); out.chest = P2(add(B.chest.t, mv(B.chest.R, [3, 0, 6.5])));
      if (cr < 0) { const hd = B.head, Rw = mm(Rh, hd.R), fw = Rw[3] * PDW[1] + Rw[6] * PDW[2], f = cl((fw + 0.2) / 0.45); for (const e of D.eyesP || []) { const q = P2(add(hd.t, mv(hd.R, add(e, [HO[0] + EYEX, HO[1], HO[2]])))); out.eyes.push([q[0], q[1], f]); } }
      return out;
    } catch (e) { fail(e); return null; }
  }

  /* ================= the effects' 3D pieces (Genbu's G3D) ================= */
  const tpl = (V, F, cz) => ({ V: new Float32Array(V), F: new Uint16Array(F), cz: cz || 0 });
  // an angular boulder: an icosahedron, each corner pushed in or out, flattened a little
  const ICO = (() => { const t = (1 + Math.sqrt(5)) / 2, V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
    const F = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1]; return { V, F }; })();
  const ROCKS = []; for (let t = 0; t < 8; t++) { const V = []; ICO.V.forEach((p, i) => { const r = 0.72 + 0.5 * R1(t * 13.1 + i * 1.7); V.push(p[0] * r * (1 + 0.25 * R1(t + 0.3)), p[1] * r, p[2] * r * (0.62 + 0.25 * R1(t + 0.7))); }); ROCKS.push(tpl(V, ICO.F)); }
  // a slab of the floor: a thick plate, its top edges chamfered, corners jittered (x by y by z ~ 1 x 0.7 x 0.22)
  const SLABS = []; for (let t = 0; t < 6; t++) { const V = [], j = i => 0.85 + 0.3 * R1(t * 7.3 + i);
    for (const [z, k] of [[-0.22, 1], [0.12, 1], [0.22, 0.82]]) for (const [x, y] of [[-1, -0.7], [1, -0.7], [1, 0.7], [-1, 0.7]]) V.push(x * k * j(V.length), y * k * j(V.length + 1), z + 0.05 * (R1(t + V.length) - 0.5));
    const F = [0, 2, 1, 0, 3, 2, 8, 9, 10, 8, 10, 11]; for (let i = 0; i < 4; i++) { const a = i, b = (i + 1) % 4; F.push(a, b, 4 + b, a, 4 + b, 4 + a, 4 + a, 4 + b, 8 + b, 4 + a, 8 + b, 8 + a); } SLABS.push(tpl(V, F)); }
  // a spire: a ragged five-sided prism from under the floor to a broken point (z -0.3 .. 1)
  const SPIRES = []; for (let t = 0; t < 6; t++) { const V = [], F = [];
    for (const [z, k] of [[-0.3, 1], [0.55, 0.78], [0.86, 0.42]]) for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3 * (R1(t * 5 + i) - 0.5), r = k * (0.8 + 0.35 * R1(t * 9 + i + z)); V.push(Math.cos(a) * r, Math.sin(a) * r, z + 0.06 * (R1(t + i * 2 + z) - 0.5)); }
    V.push(0.15 * (R1(t + 1.1) - 0.5), 0.15 * (R1(t + 1.3) - 0.5), 1);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) { const a = r * 5 + i, b = r * 5 + (i + 1) % 5; F.push(a, b, b + 5, a, b + 5, a + 5); } for (let i = 0; i < 5; i++) F.push(10 + i, 10 + (i + 1) % 5, 15); SPIRES.push(tpl(V, F, 0.3)); }
  const TPL = { ROCKS, SLABS, SPIRES };
  const GREYS = ['#8C867C', '#77716A', '#6A645C', '#9C958A', '#5E5952'], MOSSC = '#6C7748', DUST = '#9E9282', DUSTL = '#B8AC98', GOLD = '#F2B73A', HONEY = '#FFCF5C', PALE = '#FFE9B8';
  /* a pooled particle system for one cast: 0 a rock (tumbling, bouncing, settling), 1 a dust billow, 2 a spark (light), 3 a slab;
     positions in world tiles (x, y as the game's; z up, tiles of height) */
  function fxPool() {
    const P = [], FREE = [], CAPS = [[120, 50], [56, 24], [160, 70], [40, 18]], NK = [0, 0, 0, 0];
    function add(k, x, y, z, vx, vy, vz, life, s, o) { if (NK[k] >= CAPS[k][lowFx() ? 1 : 0]) return null; const p = FREE.pop() || {}; NK[k]++;
      p.k = k; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.s = s; p.age = 0; p.g = k === 1 ? -0.3 : k === 2 ? 4 : 13; p.drag = k === 1 ? 2.0 : k === 2 ? 1.2 : 0.25; p.grow = k === 1 ? 1.1 : 0; p.bounce = 0.3; p.peak = 0.52;
      p.seed = Math.random() * 50; p.tpl = (Math.random() * 8) | 0; p.rx = Math.random() * TAU; p.ry = Math.random() * TAU; p.rz = Math.random() * TAU; p.wx = (Math.random() - 0.5) * 14; p.wy = (Math.random() - 0.5) * 14; p.wz = (Math.random() - 0.5) * 9;
      p.col = k === 1 ? DUST : k === 2 ? GOLD : GREYS[(Math.random() * GREYS.length) | 0]; p.heat = 0.25; p.warm = 0; p.fixed = 0; p.rest = 0; p.sq = 0.8;
      if (o) for (const q in o) p[q] = o[q]; P.push(p); return p; }
    function step(dt) {
      for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.age += dt; p.life -= dt; if (p.life <= 0) { P.splice(i, 1); NK[p.k]--; FREE.push(p); continue; }
        if (p.fixed) continue; const dr = Math.exp(-p.drag * dt); p.vx *= dr; p.vy *= dr; if (p.k !== 1) p.vz *= dr; else p.vz = p.vz * dr - p.g * dt * 0.2;
        if (p.k !== 1) p.vz -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.k === 0 || p.k === 3) { p.rx += p.wx * dt; p.ry += p.wy * dt; p.rz += p.wz * dt; const fl = p.s * 0.35; if (p.z < fl && p.vz < 0) { p.z = fl; p.vz = -p.vz * p.bounce; p.vx *= 0.55; p.vy *= 0.55; p.wx *= 0.5; p.wy *= 0.5; p.wz *= 0.5; if (Math.abs(p.vz) < 0.6) { p.vz = 0; p.rest = 1; } } }
        else if (p.k === 2 && p.z < 0) { p.z = 0; p.vz = -p.vz * 0.25; } else if (p.k === 1 && p.z < 0) p.z = 0; }
    }
    // the 3D pieces (G3D): back (true: only those farther than the line y0, for the layer under the monsters) or all
    function g3d(Q, yCut, front) {
      for (const p of P) { if (p.k === 2) continue; if (yCut != null && ((p.y > yCut) !== !!front)) continue; const u = 1 - p.life / p.max;
        if (p.k === 0) { const fo = Math.min(1, p.life / 0.35) * Math.min(1, p.age / 0.04); Q.mesh(ROCKS[p.tpl & 7], p.x, p.y, p.z, p.s, p.s, p.s * p.sq, Q.rot(p.rz, p.ry, p.rx), Q.K.stone, p.col, fo, { heat: p.heat, seed: p.seed, warm: p.warm * (1 - u) }); }
        else if (p.k === 3) { const fo = Math.min(1, p.life / 0.4); Q.mesh(SLABS[p.tpl % 6], p.x, p.y, p.z, p.s, p.s, p.s, Q.rot(p.rz, p.ry, p.rx), Q.K.stone, p.col, fo, { heat: p.heat, seed: p.seed, warm: p.warm * (1 - u) }); }
        else { const fi = sstep(0, 0.14, p.age); Q.sphere(p.x, p.y, p.z, p.s * (1 + p.grow * u), Q.K.dust, p.col, p.peak * fi * Math.pow(1 - u, 1.4), { amp: 0.4, seed: p.seed, flow: 0.6, sz: p.sq, lod: Q.low ? 7 : 9, warm: p.warm * (1 - u) }); } }
    }
    // the sparks (FGFX): a point of light with a short streak along its motion
    function fg(Q, H, ZT, T) {
      for (const p of P) { if (p.k !== 2) continue; const u = 1 - p.life / p.max, a = (1 - u) * Math.min(1, p.age / 0.05), X = H.sx(p.x), Y = H.sy(p.y) - p.z * ZT, r = T * p.s;
        const vx = p.vx * T, vy = p.vy * T - p.vz * ZT, sp = Math.hypot(vx, vy); if (sp > T * 0.8) Q.beam(X - vx * 0.035, Y - vy * 0.035, X, Y, r * 0.5, p.col, a * 0.7);
        Q.glow(X, Y, r * 2.4, p.col, a * 0.45); Q.star(X, Y, r * 0.9, a * 0.9, PALE); }
    }
    return { add, step, g3d, fg, P, count: () => P.length, clear() { while (P.length) { const p = P.pop(); NK[p.k]--; FREE.push(p); } } };
  }

  return { usable, warm, step, ready: tier => !!(TIERS[tier] && TIERS[tier].ready), drawGolem, fxPool, TPL, WS, STATS, TIERS, COL: { GREYS, MOSSC, DUST, DUSTL, GOLD, HONEY, PALE }, get off() { return NOGL; }, get impl() { try { return ELEM_IMPL.earth.ult.titan; } catch (e) { return null; } } };
})();
if (typeof self !== 'undefined') self.TITAN_GPU = TITAN_GPU;
