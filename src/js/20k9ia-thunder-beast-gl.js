/* ---------- the Beast Machine on the GPU (worker M, 2026-11-13): the machine as real 3D meshes, drawn by GLM in one pass ----------
   The same design as the core's baked 2D machine (20k9i): its rig, its parts and proportions, its palette. Rebuilt as
   meshes with real volume and layered detail: the torso traced from the 2D model's own shape (weathered bronze under a
   gold-rimmed chest plate of hex plates, back lames, flank plates, the dark steel belly frame, violet cables and pistons
   under it, the neck with its gold collar, the hip joints), the open rider's seat (tufted crimson leather in a gold
   frame, twin levers with jewel tips, the crimson crest gem in front); the long dragon head (a broad skull, a banded
   wedge snout with gold trims and crest, the heavy gold-rimmed brow with its diamond, recessed glowing eyes, gold horn
   crests, cheek plates, the steel jaw and teeth); the shoulder domes (rusty bronze on a gold band, a raised hex cluster
   rimmed in gold, the lower lame, a faceted gem, a gold spike, the joint under it); the arms (ribbed upper arms, massive
   ringed forearms with gold bands and a gem, the elbow joints, pistons), the hands (a gold cuff, a hex-plated back with
   its gem, fingers of bronze segments, gold talons); the legs and splayed clawed feet; the cannon housings (dark bronze,
   gold straps, red vents, trunnions, a gem) and six thick barrels with gold bands and deep bores.
   Posed by the core's own rig (S.R, from rig(S)); every pose channel and anchor is the core's. The construction uses the
   core's buildOff (per part alpha, offset, scale), or a `build` 0..1 when drawn alone (the same timeline).
   The core calls draw() from drawMachine (a small hook, see docs/THUNDER-BEAST-BRIEF.md); the 2D sprites stay its fallback.
   Materials: GLM ids 49-57 (the Beast's), 47 (crimson gems), 2 (silver), 7 (the bores). Cost: one GLM pass of about 27
   items (each a draw call and its outline); the cables and pistons are small dynamic meshes. */
const BEAST_GL = (() => {
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u;
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => hyp3(a[0], a[1], a[2]);
  const vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const P3 = p => [p.x, p.y, p.z];
  const backOut = u => { const s = 2.2; u -= 1; return u * u * ((s + 1) * u + s) + 1; };
  /* the core's constants (20k9i) */
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195, VIS = 1.15, HS = 1.12, HK = 1.32;
  const HEADX = 1.08;   // (the head drawn a little larger than the 2D model's, as the 2D sprite reads)
  const SEAT = { x: -0.04, z: 0.5 }, TBACK = [-0.86, -0.5, -0.56, -0.24], TFLANK = [0.05, 0.42, 0.03, -0.34, 0.1, 0.042, -0.74, -0.3, 0.03];
  const M_WB = 49, M_PB = 50, M_GO = 51, M_ST = 52, M_LE = 54, M_CA = 55, M_EM = 56, M_DB = 57, M_VENT = 67, M_GEM = 68, M_SIL = 2, M_BORE = 7;

  /* ================= shapes ================= */
  function ell(x, y, z, a, b, c) { const k0 = hyp3(x / a, y / b, z / c); if (k0 < 1e-6) return -Math.min(a, b, c); const k1 = hyp3(x / (a * a), y / (b * b), z / (c * c)); return k0 * (k0 - 1) / k1; }
  function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
  /* the torso's base volume (the 2D model's): the rounded body, the deep chest, the haunches, the shoulder yokes */
  function bodySD(x, y, z) { const ay = Math.abs(y); let bd = smin(ell(x + 0.02, y, z, 0.74, 0.58, 0.46), ell(x - 0.42, y, z + 0.12, 0.42, 0.54, 0.42), 0.14);
    bd = smin(bd, ell(x + 0.58, y, z + 0.06, 0.42, 0.5, 0.38), 0.12); return smin(bd, ell(x - 0.3, ay - 0.58, z - 0.22, 0.3, 0.32, 0.26), 0.12); }
  const ZC = 0.0;   // (the sections' centre height)
  function bodyR(x, ph) { const dy = Math.sin(ph), dz = Math.cos(ph); if (bodySD(x, 0, ZC) >= 0) return 0; let a = 0, b = 1.0; for (let i = 0; i < 15; i++) { const m = (a + b) / 2; if (bodySD(x, dy * m, ZC + dz * m) < 0) a = m; else b = m; } return (a + b) / 2; }
  const RTX = 84, RTP = 72; let RTAB = null, RXA = 0, RXB = 0;
  function rTab(x, ph) { if (!RTAB) { RXA = -1.3; RXB = 1.2; while (bodySD(RXA, 0, ZC) >= 0) RXA += 0.004; while (bodySD(RXB, 0, ZC) >= 0) RXB -= 0.004; RTAB = new Float32Array((RTX + 1) * (RTP + 1));
      for (let i = 0; i <= RTX; i++) for (let j = 0; j <= RTP; j++) RTAB[i * (RTP + 1) + j] = bodyR(lerp(RXA, RXB, i / RTX), j / RTP * TAU); }
    const fx = cl((x - RXA) / (RXB - RXA)) * RTX, i = Math.min(RTX - 1, Math.floor(fx)), u = fx - i, fp = ((ph % TAU) + TAU) % TAU / TAU * RTP, j = Math.min(RTP - 1, Math.floor(fp)), v = fp - j, at = (a, b) => RTAB[a * (RTP + 1) + b];
    return lerp(lerp(at(i, j), at(i, j + 1), v), lerp(at(i + 1, j), at(i + 1, j + 1), v), u); }

  /* ================= meshes ================= */
  let MESH = null, MESH_MS = 0;
  function buildMeshes() {
    const q = lowFx() ? 0.7 : 1, M = {}, nq = v => Math.max(4, Math.round(v * q));
    const spikeAt = (B, a, b, r, m) => B.spike(a, b, r, m, { seg: 7 });
    const ring = (B, c, d, R, r, m) => { B.along(c, d); B.torX([0, 0, 0], R, r, m, { seg: 20, rseg: 6 }); B.pop(); };
    const frameOf = (o, x, zh) => { const X = vnrm(x); let Z = vsub(zh, vmul(X, vdot(zh, X))); if (vlen(Z) < 1e-4) Z = Math.abs(X[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]; Z = vnrm(vsub(Z, vmul(X, vdot(Z, X)))); const Y = vcross(Z, X); return [X, Y, Z, o]; };
    const pushF = (B, F, s) => { s = s || [1, 1, 1]; return B.push(vmul(F[0], s[0]), vmul(F[1], s[1]), vmul(F[2], s[2]), F[3]); };
    // a faceted crimson gem (centre c, facing N, radius r, depth h) in a gold bezel
    const gem = (B, c, N, r, h, bez) => { const F = frameOf(c, N, Math.abs(vnrm(N)[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]), at = (u, a, b) => vadd(vadd(vadd(c, vmul(F[0], u)), vmul(F[1], a)), vmul(F[2], b)), P6 = [];
      for (let i = 0; i < 6; i++) { const t = i / 6 * TAU; P6.push(at(h * 0.25, Math.cos(t) * r, Math.sin(t) * r)); } const tip = at(h, 0, 0), bot = at(-h * 0.4, 0, 0), tab = []; for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6 * TAU; tab.push(at(h * 0.8, Math.cos(t) * r * 0.5, Math.sin(t) * r * 0.5)); }
      for (let i = 0; i < 6; i++) { const a = P6[i], b = P6[(i + 1) % 6], ta = tab[i], tb = tab[(i + 5) % 6]; B.facet([a, b, ta], M_GEM); B.facet([a, ta, tb], M_GEM); B.facet([ta, tip, tab[(i + 5) % 6]], M_GEM); B.facet([b, a, bot], M_GEM); }
      if (bez !== false) { pushF(B, [F[1], F[2], F[0], at(h * 0.1, 0, 0)]); B.tor([0, 0, 0], r * 1.08, r * 0.2, M_GO, { seg: 18, rseg: 5 }); B.pop(); } };
    // an armour patch on the torso: a surf over x0..x1, phi a0..a1 (0 up, + right), raised by `lift`, tucked at its rims, a gold rim when gold
    const T = { r: rTab, p: (x, ph, off) => { const r = rTab(x, ph) + (off || 0); return [x, Math.sin(ph) * r, ZC + Math.cos(ph) * r]; } };
    const patch = (B, x0, x1, a0, a1, lift, mat, rimGold, NU, NV) => { NU = NU || 12; NV = NV || 8;
      const pf = (u, v) => { const ins = Math.min(u, 1 - u) * NU, inv = Math.min(v, 1 - v) * NV, k = Math.min(1, Math.min(ins, inv) * 0.9); return T.p(lerp(x0, x1, v), lerp(a0, a1, u), 0.004 + lift * k); };
      B.surf(pf, NU, NV, (u, v) => (rimGold && (u < 1.5 / NU || u > 1 - 1.5 / NU || v < 1.5 / NV || v > 1 - 1.5 / NV) ? M_GO : mat), { flip: true, e: (u, v) => (u < 0.5 / NU || u > 1 - 0.5 / NU || v < 0.5 / NV || v > 1 - 0.5 / NV ? 1 : 0) }); };
    // the phi range on the torso where |y| < ylim and z > zmin (at section x)
    const phiTop = (x, ylim) => { const r = rTab(x, Math.PI / 2) || 0.4; return Math.min(1.25, Math.asin(Math.min(0.98, ylim / r))); };

    // ---- the torso (origin R.torso, the 2D model's units)
    { const B = GLM.builder(q); rTab(0, 0); const NX = nq(40), NP = nq(40), xs = v => RXA + (RXB - RXA) * (1 - Math.cos(Math.PI * v)) / 2;
      B.surf((u, v) => T.p(xs(v), u * TAU), NP, NX, () => M_WB, { flip: true });
      // the chest plate over the head (x 0.22..0.86, z > -0.02, |y| < 0.46), gold-rimmed, raised hex plates
      { const pm = phiTop(0.55, 0.46); patch(B, 0.24, 0.84, -pm, pm, 0.05, M_PB, true, 16, 10); }
      // the back lames and the flank plates
      for (let i = 0; i < 4; i += 2) { const x0 = TBACK[i], x1 = TBACK[i + 1], pm = phiTop((x0 + x1) / 2, 0.44); patch(B, x0, x1, -pm, pm, 0.05, M_PB, true, 14, 7); }
      for (let i = 0; i < 9; i += 3) { const x0 = TFLANK[i], x1 = TFLANK[i + 1], o = TFLANK[i + 2]; for (const s of [-1, 1]) { const a0 = Math.PI / 2 - 0.55, a1 = Math.PI / 2 + 0.45; patch(B, x0, x1, s > 0 ? a0 : -a1, s > 0 ? a1 : -a0, o + 0.02, M_PB, true, 10, 7); } }
      // the dark steel belly frame
      B.ell([0.02, 0, -0.3], [0.6, 0.42, 0.2], M_ST, { seg: 22, rings: 10 });
      for (const xx of [-0.3, 0.05, 0.38]) B.box([xx, 0, -0.42], [0.03, 0.36, 0.05], 0.015, M_ST);
      // the open rider's seat: a gold plinth, a tufted crimson saddle and backrest in a gold frame, twin levers with jewel tips, small gold boxes
      B.box([SEAT.x, 0, SEAT.z - 0.06], [0.24, 0.27, 0.05], 0.03, M_GO);
      B.box([SEAT.x, 0, SEAT.z], [0.17, 0.21, 0.055], 0.045, M_LE);
      B.box([SEAT.x - 0.19, 0, SEAT.z + 0.16], [0.05, 0.2, 0.17], 0.045, M_LE);
      B.box([SEAT.x - 0.235, 0, SEAT.z + 0.15], [0.03, 0.235, 0.215], 0.03, M_GO);
      for (const s of [-1, 1]) { B.tube([SEAT.x + 0.15, 0.17 * s, SEAT.z + 0.02], [SEAT.x + 0.21, 0.17 * s, SEAT.z + 0.17 - 0.0], 0.022, 0.02, M_ST, { seg: 8 }); B.sph([SEAT.x + 0.215, 0.17 * s, SEAT.z + 0.19], 0.04, M_GEM, 10);
        B.box([SEAT.x + 0.18, 0.17 * s, SEAT.z], [0.035, 0.035, 0.03], 0.01, M_GO); }
      // the crest gem in front of the seat, the rear gem
      gem(B, [0.36, 0, 0.47], [0.55, 0, 0.84], 0.05, 0.045); gem(B, [-0.98, 0, 0.0], [-1, 0, 0.2], 0.06, 0.05);
      // the neck (dark steel, a gold collar) and the hip joints
      B.tube([0.5, 0, -0.02], [0.72, 0, -0.1], 0.17, 0.17, M_ST, { seg: 16 }); ring(B, [0.62, 0, -0.06], [1, 0, -0.35], 0.17, 0.035, M_GO);
      for (const s of [-1, 1]) { B.sph([-0.48, 0.42 * s, -0.3], 0.15, M_ST, 14); ring(B, [-0.48, 0.5 * s, -0.3], [0, s, 0], 0.13, 0.025, M_GO);
        // under the body: ribbed violet cables looping to the arms and legs, steel pistons
        const C = (a, b, r, m) => B.tube([a[0], a[1] * s, a[2]], [b[0], b[1] * s, b[2]], r, r, m, { seg: 8 });
        C([0.42, 0.28, -0.3], [0.05, 0.42, -0.5], 0.05, M_CA); C([0.05, 0.42, -0.5], [-0.42, 0.36, -0.38], 0.05, M_CA); C([0.25, 0.12, -0.38], [-0.15, 0.16, -0.5], 0.04, M_CA); C([0.3, 0.55, -0.1], [0.18, 0.62, -0.32], 0.045, M_CA);
        C([0.36, 0.5, -0.28], [0.0, 0.5, -0.36], 0.055, M_ST); C([0.0, 0.5, -0.36], [-0.3, 0.48, -0.36], 0.03, M_SIL);
        // rivets along the flank plates' tops
        for (let i = 0; i < 6; i++) { const x = lerp(-0.7, 0.4, i / 5); B.sph(T.p(x, s * (Math.PI / 2 - 0.62), 0.03), 0.018, M_GO, 6); } }
      M.torso = B.done(); }

    // ---- the head (origin R.neck, drawn at HS): a broad armoured skull, a banded wedge snout, the heavy brow, recessed eyes, horn crests, cheek plates, the steel jaw
    { const B = GLM.builder(q);
      B.ell([0.04, 0, 0.02], [0.28, 0.27, 0.2], M_WB, { seg: 22, rings: 14 });
      // the snout section at x (0..0.62): a flat top sloping down, converging flanks, bevelled ridges, a flat underside; off raises it
      const sec = (x, th, off) => { const u = cl((x - 0.08) / 0.5), tp = 0.12 - 0.36 * u, sw = 0.25 - 0.17 * u, bt = -0.2 - 0.06 * u, zm = (tp + bt) / 2, hz = (tp - bt) / 2, c = Math.cos(th), s = Math.sin(th);
        let y = sw * Math.sign(c) * Math.pow(Math.abs(c), 0.5), z = zm + hz * Math.sign(s) * Math.pow(Math.abs(s), 0.55); const ex = Math.abs(y) * 0.55 + z - tp; if (ex > 0) { z -= ex * 0.6; y -= Math.sign(y) * ex * 0.4 / 0.55; }
        const o = off || 0, l = Math.hypot(y, z - zm) || 1; return [x, y + y / l * o, z + (z - zm) / l * o]; };
      const NS = nq(22), NT = nq(24), XS1 = 0.62;
      B.surf((u, v) => { const x = lerp(0.0, XS1 + 0.04, v); if (x <= XS1) return sec(x, u * TAU); const k = Math.sqrt(Math.max(0, 1 - (x - XS1) / 0.04)), p = sec(XS1, u * TAU), zm = ((0.12 - 0.36 * 1.08) + (-0.2 - 0.06 * 1.08)) / 2; return [x, p[1] * k, zm + (p[2] - zm) * k]; }, NT, NS, () => M_WB);
      // the overlapping bands along the snout (3), each stepping up toward its front edge
      for (let kb = 0; kb < 3; kb++) { const u0 = Math.max(0, (kb - 0.35) / 3.2), u1 = Math.min(1, (kb + 0.65) / 3.2), x0 = 0.08 + u0 * 0.5 + 0.005, x1 = 0.08 + u1 * 0.5 - 0.005, NU = 16, NV = 6;
        B.surf((u, v) => { const ins = Math.min(u, 1 - u) * NU, inv = Math.min(v, 1 - v) * NV, k = Math.min(1, Math.min(ins, inv) * 0.9); return sec(lerp(x0, x1, v), lerp(-0.25, Math.PI + 0.25, u), 0.003 + (0.008 + 0.018 * v) * k); }, NU, NV, (u, v) => (u < 1.5 / NU || u > 1 - 1.5 / NU ? M_GO : M_PB), { e: (u, v) => (u < 0.5 / NU || u > 1 - 0.5 / NU || v < 0.5 / NV || v > 1 - 0.5 / NV ? 1 : 0) }); }
      B.tube([0.12, 0, 0.15], [0.55, 0, -0.06], 0.03, 0.012, M_GO, { seg: 8 });   // (the gold crest down the snout)
      for (const s of [-1, 1]) {
        B.spike([0.15, 0.205 * s, 0.065], [0.6, 0.075 * s, -0.19], 0.03, M_GO, { seg: 7 });   // (the gold blades along the snout's top edges: tapered to a sharp point)
        { const Ne = vnrm([0.6, 0.62 * s, 0.48]), Fe = frameOf([0.3, 0.14 * s, 0.015], Ne, [0, 0, 1]); pushF(B, Fe); B.torX([0.006, 0, 0], 0.053, 0.008, M_GO, { seg: 22, rseg: 5 }); B.ell([0.0, 0, 0], [0.03, 0.051, 0.051], M_EM, { seg: 20, rings: 12 }); B.pop(); }   // (the eye: a round glowing lens, domed, set flush in a thin gold bezel)

        // the gold horn crests sweeping back over the skull
        const hp = [[0.2, 0.17 * s, 0.08], [0.07, 0.23 * s, 0.16], [-0.06, 0.27 * s, 0.22], [-0.23, 0.265 * s, 0.3], [-0.4, 0.24 * s, 0.36]], hr = [0.06, 0.052, 0.042, 0.026, 0.007];
        for (let i = 0; i < 2; i++) B.tube(hp[i], hp[i + 1], hr[i], hr[i + 1], M_GO, { seg: 10, cap0: 'round', cap1: 'round' }); B.spike(hp[2], vadd(hp[4], vmul(vsub(hp[4], hp[3]), 0.35)), hr[2], M_GO, { seg: 8 });   // (the horn: thick at the skull, then a long sharp tapered point)
        B.ell([0.06, 0.22 * s, -0.08], [0.17, 0.07, 0.11], M_PB, { seg: 14, rings: 8 }); B.sph([0.06, 0.29 * s, -0.08], 0.018, M_GO, 6);   // (the cheek plates, a stud)
        for (let i = 0; i < 5; i++) { const tx = 0.18 + i * 0.075, ty = 0.15 - i * 0.022, tz = -0.18 - i * 0.025; spikeAt(B, [tx, ty * s, tz], [tx + 0.012, ty * s, tz - 0.085 + i * 0.008], 0.026, M_SIL); }   // (teeth)
        B.sph([0.58, 0.06 * s, -0.16], 0.032, M_GEM, 8); }
      // the heavy brow: an angular plate tilted forward, gold-rimmed, the crimson diamond on it
      { const c = Math.cos(0.3), sn = Math.sin(0.3), X = [c, 0, sn], Z = [-sn, 0, c]; B.push(X, [0, 1, 0], Z, [0.15, 0, 0.1]); B.ell([0, 0, 0], [0.19, 0.235, 0.075], M_GO, { seg: 22, rings: 8, th1: Math.PI / 2 + 0.25, cap: true }); B.ell([0.004, 0, 0.008], [0.175, 0.22, 0.072], M_WB, { seg: 22, rings: 8, th1: Math.PI / 2, cap: true }); B.pop(); }   // (the heavy brow: a rounded armoured ridge, a gold rim showing round its edge)
      gem(B, [0.27, 0, 0.165], [0.55, 0, 0.84], 0.062, 0.05);
      // the steel jaw
      B.tube([0.04, 0, -0.16], [0.5, 0, -0.28], 0.12, 0.06, M_ST, { seg: 14 });
      M.head = B.done(); }

    // ---- a shoulder dome (side s; origin R.sd; w = y * s outward)
    M.shield = {}; for (const s of [-1, 1]) { const B = GLM.builder(q), W = (x, w, z) => [x, w * s, z];
      const thCut = Math.acos(-0.22 / 0.46);
      B.surf((u, v) => { const th = v * thCut, ph = u * TAU; return W(0.5 * Math.sin(th) * Math.cos(ph), 0.04 + 0.46 * Math.sin(th) * Math.sin(ph), -0.02 + 0.46 * Math.cos(th)); }, nq(36), nq(16), () => M_WB, { flip: s > 0 });
      // the gold band round its foot
      B.surf((u, v) => { const ph = u * TAU, z = lerp(-0.24, -0.1, v), k = Math.sqrt(Math.max(0, 1 - ((z + 0.02) / 0.46) ** 2)) + 0.05; return W(0.5 * k * Math.cos(ph), 0.04 + 0.46 * k * Math.sin(ph), z); }, nq(36), 3, () => M_GO, { flip: s < 0, e: (u, v) => (v < 0.2 || v > 0.8 ? 1 : 0) });
      // the raised hex cluster on its top, a gold rim round it
      { const cx = 0.1, cw = 0.14, R0 = 0.23; B.surf((u, v) => { const ph = u * TAU, r = R0 * Math.min(1, v * 1.08), x = cx + Math.cos(ph) * r, w = cw + Math.sin(ph) * r, zz = 0.46 * Math.sqrt(Math.max(0, 1 - (x / 0.5) ** 2 - ((w - 0.04) / 0.46) ** 2)) - 0.02, lift = v < 0.92 ? 0.045 : 0.045 * (1 - (v - 0.92) / 0.08) + 0.004; const nr = vnrm([x / 0.25, (w - 0.04) / 0.21, (zz + 0.02) / 0.21]); return W(x + nr[0] * lift, w + nr[1] * lift, zz + nr[2] * lift); }, nq(30), 8, () => M_PB, { flip: s > 0, e: (u, v) => (v > 0.9 ? 1 : 0) });
        const rp = []; for (let i = 0; i <= 24; i++) { const ph = i / 24 * TAU, x = cx + Math.cos(ph) * R0 * 1.02, w = cw + Math.sin(ph) * R0 * 1.02, zz = 0.46 * Math.sqrt(Math.max(0, 1 - (x / 0.5) ** 2 - ((w - 0.04) / 0.46) ** 2)) - 0.02 + 0.02; rp.push(W(x, w, zz)); }
        for (let i = 0; i < 24; i++) B.tube(rp[i], rp[i + 1], 0.024, 0.024, M_GO, { seg: 6, cap0: 'round', cap1: 'round' }); }
      // the lower lame under the band
      B.surf((u, v) => { const ph = u * TAU, z = lerp(-0.4, -0.2, v), k = Math.sqrt(Math.max(0, 1 - ((z + 0.26) / 0.18) ** 2)); return W(0.49 * k * Math.cos(ph), 0.07 + 0.45 * k * Math.sin(ph), z); }, nq(36), 6, () => M_PB, { flip: s < 0, e: (u, v) => (v > 0.85 ? 1 : 0) });
      gem(B, W(0.36, 0.3, -0.02), W(0.72, 0.6, 0.35), 0.07, 0.06);
      spikeAt(B, W(-0.08, 0.24, 0.32), W(-0.15, 0.32, 0.56), 0.07, M_GO);
      B.sph(W(0, -0.06, -0.16), 0.24, M_ST, 16);
      M.shield[s] = B.done(); }

    // ---- a cannon battery's housing (origin R.mt): a dark bronze block, gold straps, red vents, trunnions, a gem
    { const B = GLM.builder(q);
      B.box([-0.02, 0, -0.03], [0.2, 0.37, 0.14], 0.06, M_DB);
      B.box([0.0, 0, -0.03], [0.04, 0.385, 0.155], 0.02, M_GO); B.box([-0.02, 0, -0.15], [0.215, 0.385, 0.03], 0.02, M_GO);
      for (const s of [-1, 1]) { B.box([-0.06, 0.372 * s, -0.04], [0.1, 0.004, 0.055], 0, M_VENT); for (let i = 0; i < 4; i++) B.box([-0.135 + i * 0.05, 0.38 * s, -0.04], [0.009, 0.008, 0.06], 0.003, M_DB);
        B.tube([0, 0.36 * s, 0], [0, 0.44 * s, 0], 0.075, 0.075, M_ST, { seg: 14, cap0: false, cap1: 'flat' }); ring(B, [0, 0.39 * s, 0], [0, 1, 0], 0.075, 0.018, M_GO); }
      gem(B, [0.2, 0, 0.02], [1, 0, 0.15], 0.045, 0.04);
      M.housing = B.done(); }

    // ---- a hand (origin R.wr, drawn at HK)
    { const B = GLM.builder(q);
      B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0.01, 0, 0]); B.tor([0, 0, 0], 0.2, 0.04, M_GO, { seg: 24, rseg: 7 }); B.pop();
      B.ell([0.15, 0, -0.03], [0.2, 0.25, 0.11], M_PB, { seg: 20, rings: 8, th1: Math.PI / 2 + 0.45, cap: true });
      B.ell([0.15, 0, -0.03], [0.205, 0.255, 0.112], M_GO, { seg: 20, rings: 2, th0: Math.PI / 2 + 0.3, th1: Math.PI / 2 + 0.45 });
      B.ell([0.14, 0, -0.1], [0.17, 0.21, 0.08], M_ST, { seg: 16, rings: 8 });
      B.tube([0.28, -0.2, -0.15], [0.28, 0.2, -0.15], 0.07, 0.07, M_ST, { seg: 12 });
      gem(B, [0.16, 0, 0.08], [0.3, 0, 1], 0.055, 0.045);
      for (const a of [-0.55, -0.18, 0.18, 0.55]) { const k = Math.abs(a) < 0.3 ? 1.1 : 0.95, x0 = 0.27 + 0.03 * Math.cos(a * 2), y0 = 0.2 * Math.sin(a) / 0.55;
        B.push([Math.cos(a), Math.sin(a), 0], [-Math.sin(a), Math.cos(a), 0], [0, 0, 1], [x0, y0, 0]);
        const fz = fx => -0.14 - 0.18 * fx;
        B.box([0.075 * k, 0, fz(0.075 * k)], [0.075 * k, 0.07 * k, 0.065 * k], 0.03, M_PB); B.box([0.21 * k, 0, fz(0.21 * k) - 0.005], [0.055 * k, 0.064 * k, 0.058 * k], 0.026, M_PB);
        B.tube([0.15 * k - 0.03, 0, fz(0.15 * k)], [0.15 * k + 0.03, 0, fz(0.15 * k)], 0.045 * k, 0.045 * k, M_ST, { seg: 10 });
        B.tube([0.25 * k, 0, -0.18], [0.38 * k, 0, -0.2], 0.068 * k, 0.045 * k, M_GO, { seg: 10 }); spikeAt(B, [0.38 * k, 0, -0.2], [0.47 * k, 0, -0.3], 0.045 * k, M_GO);
        B.pop(); }
      M.hand = B.done(); }

    // ---- a rear foot (origin R.an): a pad, the ankle with a gold ring, three splayed toes with gold talons, a spur
    { const B = GLM.builder(q);
      B.ell([0.06, 0, -0.06], [0.2, 0.17, 0.09], M_PB, { seg: 16, rings: 8 }); B.sph([0, 0, 0], 0.1, M_ST, 12); B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]); B.tor([0, 0, 0], 0.1, 0.03, M_GO, { seg: 18, rseg: 6 }); B.pop();
      for (const a of [-0.55, 0, 0.55]) { const c = Math.cos(a), s = Math.sin(a); B.tube([0.1 * c, 0.1 * s, -0.08], [0.27 * c, 0.27 * s, -0.1], 0.05, 0.05, M_PB, { seg: 10 }); B.sph([0.27 * c, 0.27 * s, -0.1], 0.04, M_ST, 8); spikeAt(B, [0.27 * c, 0.27 * s, -0.1], [0.4 * c, 0.4 * s, -0.16], 0.038, M_GO); }
      spikeAt(B, [-0.08, 0, -0.05], [-0.22, 0, -0.14], 0.04, M_GO);
      M.foot = B.done(); }

    // ---- the bones (along +x from their joint, their own length; the rig's lengths are fixed: upper arm 0.6, forearm 0.86, thigh and shin 0.42)
    { const B = GLM.builder(q);   // the upper arm: a steel core, a bronze plate sleeve, gold rings, steel ribs
      B.tube([0, 0, 0], [0.6, 0, 0], 0.11, 0.11, M_ST, { seg: 14 }); B.ell([0.32, 0, 0], [0.24, 0.16, 0.16], M_PB, { seg: 16, rings: 10 });
      ring(B, [0.1, 0, 0], [1, 0, 0], 0.15, 0.03, M_GO); ring(B, [0.53, 0, 0], [1, 0, 0], 0.14, 0.03, M_GO); for (let i = 0; i < 5; i++) ring(B, [0.06 + i * 0.1, 0, 0], [1, 0, 0], 0.12, 0.02, M_ST);
      M.uarm = B.done(); }
    { const B = GLM.builder(q);   // the forearm: the elbow joint (a steel ball, a gold ring), a steel core, four overlapping bronze rings with gold lips, a wrist band, a gem, a piston under it
      B.sph([0, 0, 0], 0.2, M_ST, 16); B.push([0.94, 0.34, 0], [-0.34, 0.94, 0], [0, 0, 1], [0, 0, 0]); B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0, 0]); B.tor([0, 0, 0], 0.19, 0.027, M_GO, { seg: 22, rseg: 6 }); B.pop(); B.pop();
      B.tube([0, 0, 0], [0.72, 0, 0], 0.2, 0.2, M_BORE, { seg: 14 }); B.tube([0.7, 0, 0], [0.86, 0, 0], 0.17, 0.17, M_SIL, { seg: 16 });
      for (let i = 0; i < 4; i++) { const x0 = 0.1 + i * 0.165, x1 = x0 + 0.145, ra = 0.245 + 0.025 * i, rb = ra + 0.045, rr = u => ra + (rb - ra) * u;
        B.lathe([[x0, 0.13], [x0 + 0.004, rb - 0.01], [x1 - 0.035, rb - 0.006], [x1 - 0.035, rb, M_GO], [x1 - 0.004, rb + 0.004, M_GO], [x1, rb - 0.03, M_GO]], M_PB, { seg: 22 }); }
      ring(B, [0.8, 0, 0], [1, 0, 0], 0.3, 0.05, M_GO);
      { B.push([0, 1, 0], [1, 0, 0], [0, 0, -1], [0.44, 0, 0.31]); B.tube([0, 0, -0.03], [0, 0, 0.03], 0.08, 0.08, M_GO, { seg: 14, cap0: 'flat', cap1: 'flat' }); B.pop(); B.sph([0.44, 0, 0.32], 0.055, M_GEM, 10); }
      B.tube([0.02, 0, -0.18], [0.55, 0, -0.24], 0.035, 0.035, M_SIL, { seg: 8 }); B.tube([0.02, 0, -0.18], [0.3, 0, -0.21], 0.05, 0.05, M_ST, { seg: 10 });
      M.farm = B.done(); }
    { const B = GLM.builder(q); B.tube([0, 0, 0], [0.42, 0, 0], 0.1, 0.1, M_ST, { seg: 12 }); B.ell([0.2, 0, 0], [0.24, 0.17, 0.17], M_PB, { seg: 16, rings: 10 }); ring(B, [0.36, 0, 0], [1, 0, 0], 0.13, 0.03, M_GO); M.thigh = B.done(); }
    { const B = GLM.builder(q); B.sph([0, 0, 0], 0.13, M_ST, 12); B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0, 0]); B.tor([0, 0, 0], 0.125, 0.02, M_GO, { seg: 18, rseg: 5 }); B.pop();
      B.tube([0, 0, 0], [0.42, 0, 0], 0.08, 0.07, M_ST, { seg: 12 }); B.ell([0.18, 0, 0.05], [0.2, 0.11, 0.12], M_PB, { seg: 14, rings: 8 }); ring(B, [0.33, 0, 0], [1, 0, 0], 0.09, 0.025, M_GO); M.shin = B.done(); }
    { const B = GLM.builder(q);   // a barrel (0.78 long): a breech collar, gold bands, a heavy muzzle ring, a deep bore
      B.lathe([[0, 0], [0, 0.132], [0.2, 0.132], [0.2, 0.102], [0.5, 0.098], [0.66, 0.096], [0.66, 0.124], [0.78, 0.124], [0.78, 0.124], [0.782, 0.112], [0.782, 0.104, M_GO], [0.781, 0.092, M_GO], [0.78, 0.084], [0.78, 0.078, M_BORE], [0.45, 0.078, M_BORE], [0.45, 0, M_BORE]], M_DB, { seg: 18 });
      ring(B, [0.21, 0, 0], [1, 0, 0], 0.104, 0.02, M_GO); ring(B, [0.45, 0, 0], [1, 0, 0], 0.104, 0.02, M_GO); ring(B, [0.66, 0, 0], [1, 0, 0], 0.12, 0.016, M_GO); 
      M.barrel = B.done(); }
    // ---- the pistons (a polished rod in a ribbed sleeve; unit length, stretched) and the cables (dynamic)
    { const B = GLM.builder(q); B.tube([0, 0, 0], [1, 0, 0], 0.042, 0.042, M_SIL, { seg: 8 }); const rod = B.done();
      const B2 = GLM.builder(q); B2.tube([0, 0, 0], [0.45, 0, 0], 0.08, 0.08, M_SIL, { seg: 12 }); ring(B2, [0.42, 0, 0], [1, 0, 0], 0.08, 0.018, M_GO); for (let i = 0; i < 4; i++) ring(B2, [0.06 + i * 0.08, 0, 0], [1, 0, 0], 0.081, 0.011, M_ST); const sl = B2.done();
      M.pist = kit([rod, sl, rod, sl]); }
    M.cables = cableMesh();
    return M;
  }
  /* a kit: templates moved on the CPU into one mesh (see Nidhogg's) */
  function kit(list) {
    let nv = 0, ni = 0; for (const t of list) { nv += t.nv; ni += t.idx.length; }
    const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), att = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni), at = [];
    let v0 = 0, i0 = 0; for (const t of list) { att.set(t.att, v0 * 3); for (let i = 0; i < t.idx.length; i++) idx[i0 + i] = t.idx[i] + v0; at.push(v0); v0 += t.nv; i0 += t.idx.length; }
    const mesh = { pos, nrm, att, idx, nv, ntri: ni / 3, gl: null };
    return { mesh, place(i, o, X, Y, Z) { const t = list[i], b = at[i] * 3, P0 = t.pos, N0 = t.nrm, cx = vcross(Y, Z), cy = vcross(Z, X), cz = vcross(X, Y);
      for (let j = 0, n = t.nv * 3; j < n; j += 3) { const x = P0[j], y = P0[j + 1], z = P0[j + 2]; pos[b + j] = o[0] + X[0] * x + Y[0] * y + Z[0] * z; pos[b + j + 1] = o[1] + X[1] * x + Y[1] * y + Z[1] * z; pos[b + j + 2] = o[2] + X[2] * x + Y[2] * y + Z[2] * z;
        const a = N0[j], bb = N0[j + 1], c = N0[j + 2], nx = cx[0] * a + cy[0] * bb + cz[0] * c, ny = cx[1] * a + cy[1] * bb + cz[1] * c, nz = cx[2] * a + cy[2] * bb + cz[2] * c, l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nrm[b + j] = nx / l; nrm[b + j + 1] = ny / l; nrm[b + j + 2] = nz / l; } } };
  }
  /* the four cables (two per side): quadratic curves sagging between their ends, ribbed tubes; vA.y = along (for the ribs and the running charge) */
  const CN = 14, CS = 8;
  function cableMesh() { const per = (CS + 1) * (CN + 1), n = per * 4, idx = [];
    for (let g = 0; g < 4; g++) for (let j = 0; j < CN; j++) for (let i = 0; i < CS; i++) { const a = g * per + j * (CS + 1) + i; idx.push(a, a + 1, a + CS + 2, a, a + CS + 2, a + CS + 1); }
    return { pos: new Float32Array(n * 3), nrm: new Float32Array(n * 3), att: new Float32Array(n * 3), idx: new Uint16Array(idx), nv: n, ntri: idx.length / 3, gl: null, per }; }
  function updCable(Mm, g, a, b, sag, r, ph) {
    const per = Mm.per, mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 - sag], P = Mm.pos, N = Mm.nrm, A = Mm.att, len = vlen(vsub(b, a));
    const at = u => { const k0 = (1 - u) * (1 - u), k1 = 2 * u * (1 - u), k2 = u * u; return [a[0] * k0 + mid[0] * k1 + b[0] * k2, a[1] * k0 + mid[1] * k1 + b[1] * k2, a[2] * k0 + mid[2] * k1 + b[2] * k2]; };
    for (let j = 0; j <= CN; j++) { const u = j / CN, p = at(u), t = vnrm(vsub(at(Math.min(1, u + 0.02)), at(Math.max(0, u - 0.02)))); let sd = vcross([0, 0, 1], t); if (vlen(sd) < 0.2) sd = vcross([1, 0, 0], t); sd = vnrm(sd); const up = vcross(t, sd);
      for (let i = 0; i <= CS; i++) { const q = i / CS * TAU + ph, c = Math.cos(q), s = Math.sin(q), nn = [up[0] * c + sd[0] * s, up[1] * c + sd[1] * s, up[2] * c + sd[2] * s], o = (g * per + j * (CS + 1) + i) * 3;
        P[o] = p[0] + nn[0] * r; P[o + 1] = p[1] + nn[1] * r; P[o + 2] = p[2] + nn[2] * r; N[o] = nn[0]; N[o + 1] = nn[1]; N[o + 2] = nn[2]; A[o] = M_CA; A[o + 1] = u * len * 2.5; A[o + 2] = i / CS; } }
  }

  /* ================= the construction (the core's buildOff, from a 0..1 `build` when drawn alone) ================= */
  function buildAt(t, name, side) {
    const o = { a: 1, dx: 0, dy: 0, dz: 0, sc: 1 }, s = side || 0, pop = (t0, d) => cl((t - t0) / d);
    if (name === 'torso' || name === 'cable') { const u = pop(0.32, 0.22); o.a = u; o.dz = -0.45 * (1 - backOut(u)); }
    else if (name === 'leg') { const u = pop(0.44, 0.18); o.a = u; o.dz = -0.3 * (1 - backOut(u)); }
    else if (name === 'arm') { const t0 = s > 0 ? 0.55 : 0.7, u = pop(t0, 0.22); o.a = cl(u * 4); const f = 1 - u; o.dz = f * f * 2.8 - (u > 0.75 && u < 1 ? Math.sin((u - 0.75) / 0.25 * Math.PI) * 0.12 : 0); }
    else if (name === 'head') { const u = pop(0.8, 0.26), e = backOut(u); o.a = cl(u * 5); o.dy = (1 - e) * 1.1; o.dz = (1 - e) * 0.7; o.dx = -(1 - e) * 0.5; }
    else if (name === 'shield') { const u = pop(0.95, 0.14), e = backOut(u); o.a = cl(u * 6); o.dy = s * (1 - e) * 0.5; o.dz = (1 - e) * 0.55; o.sc = lerp(0.72, 1, e); }
    else if (name === 'cannon') { o.a = cl(pop(1.04, 0.06)); }
    return o;
  }

  /* ================= the pass ================= */
  const nrm = v => vnrm(v), LW = nrm([-0.55, 0.22, 0.8]), SBW = nrm([-0.22, -0.42, 0.88]), RIMW = nrm([0.5, -0.78, 0.36]), UPW = [0, 0, 1], CW = [0, VY, VZ], PXW = [1, 0, 0], PYW = [0, GY, -ZK];
  const RIMC = [0.62, 0.8, 1.15], AMBC = [0.82, 0.74, 0.68], OUTC = [0.05, 0.03, 0.02], GLCAP = 1600, CYAN = '#5FE4FF';
  const OCC = new Float32Array(48); let NOGL = false, GLFAIL = 0, GLRETRY = 0, GLLAST = 0, GLMS = 0, GLN = 0, LASTN = 0, LASTTRI = 0, LASTCALLS = 0; const GLI = [], GLJ = [];
  const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
  function on() {
    if (NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__BEAST_GL)) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Beast: meshes', e); return false; } }
    return true;
  }
  /* draw the machine of state S (S.R its posed rig, S.ag its drawn heading, S.beast its place, S.P its pose) at tile size T.
     o: { vis (alpha), ghost, off(name, side) (the core's buildOff), build (0..1, when there is no off), rattle (radians, the torso's while it is put together) }.
     Returns false when nothing was drawn (the caller then draws its 2D picture) */
  function draw(c, S, T, o) {
    o = o || {}; const R = S.R, bm = S.beast, P = S.P || {}, vis = o.vis == null ? 1 : o.vis; if (!(vis > 0.004)) return true;
    const off = o.off || (o.build != null && o.build < 1 ? (n, s) => buildAt(o.build * 1.4, n, s) : null), O = (n, s) => (off ? off(n, s) : null);
    const oT = O('torso') || { a: 1, dz: 0 }, oL = O('leg') || { a: 1, dz: 0 }, oH = O('head') || { a: 1, dx: 0, dy: 0, dz: 0 }, oC = O('cannon') || { a: 1 };
    const sh3 = (p, q) => q ? [p.x + (q.dx || 0), p.y + (q.dy || 0), p.z + (q.dz || 0)] : P3(p);
    const t = (S.g && S.g.t != null) ? S.g.t : nowMs() / 1000, lit = S.lit == null ? 1 : S.lit, gl = cl((0.35 + 0.12 * Math.sin(t * 2.6)) * lit + (P.glow || 0) * 0.8), chg = cl(P.charge || 0);
    const ag = S.ag, ca = Math.cos(ag), sa = Math.sin(ag), sc = (bm.scale || 1) * VIS, k = T * sc, X0 = S.H.sx(bm.x), Y0 = S.H.sy(bm.y) - (bm.z || 0) * ZK * T;
    const rot = v => [v[0] * ca - v[1] * sa, v[0] * sa + v[1] * ca, v[2]];
    const items = [];   // [mesh, origin (body), axes (body, scaled), alpha, glow, kind]
    const I3 = s2 => [[s2, 0, 0], [0, s2, 0], [0, 0, s2]];
    const along = (a, b, L, up) => { const X = vnrm(vsub(b, a)); let Z = vsub(up, vmul(X, vdot(up, X))); if (vlen(Z) < 1e-4) Z = vcross(X, [0, 1, 0]); Z = vnrm(Z); return [X, vcross(Z, X), Z]; };
    { const rt = o.rattle || 0, cr = Math.cos(rt), sr = Math.sin(rt); items.push([MESH.torso, sh3(R.torso, oT), [[cr, sr, 0], [-sr, cr, 0], [0, 0, 1]], oT.a, gl, 1]); }
    items.push([MESH.head, sh3(R.neck, oH), I3(HS * HEADX), oH.a, gl, 0]);
    for (const s of [-1, 1]) { const L = s < 0, sx = L ? 'L' : 'R', oA = O('arm', s) || { a: 1, dz: 0 }, oS = O('shield', s) || { a: 1, dy: 0, dz: 0, sc: 1 };
      const sh = P3(R['sh' + sx]), el = vadd(P3(R['el' + sx]), [0, 0, (oA.dz || 0) * 0.5]), wr = sh3(R['wr' + sx], oA), hp = sh3(R['hp' + sx], oL), kn = sh3(R['kn' + sx], oL), an = sh3(R['an' + sx], oL), sd = R['sd' + sx];
      items.push([MESH.shield[s], sh3(sd, oS), I3(oS.sc || 1), oS.a, gl, 2]);
      items.push([MESH.uarm, sh, along(sh, el, 0.6, [0, 0, 1]), oA.a, gl, 0]);
      items.push([MESH.farm, el, along(el, wr, 0.86, [0, -s * 0.3, 1]), oA.a, gl, 0]);
      items.push([MESH.hand, wr, I3(HK), oA.a, gl, 1]);
      items.push([MESH.thigh, hp, along(hp, kn, 0.42, [0, 0, 1]), oL.a, gl, 0]);
      items.push([MESH.shin, kn, along(kn, an, 0.42, [1, 0, 0]), oL.a, gl, 0]);
      items.push([MESH.foot, an, I3(1), oL.a, gl, 0]);
      const mt = R['mt' + sx], B = R['b' + sx];
      items.push([MESH.housing, sh3(mt, oS), I3(1), oS.a, gl, 0]);
      if (oC.a > 0.01) for (let i = 0; i < 3; i++) { const a = P3(B[i].a), b = P3(B[i].b); items.push([MESH.barrel, a, along(a, b, 0.78, [0, 0, 1]), oC.a, gl, 0]); }
      // the piston (rod and sleeve) and the two cables of this side
      { const pp = [el[0], el[1] + s * 0.3, el[2] + 0.06], qq = [lerp(el[0], wr[0], 0.9), lerp(el[1], wr[1], 0.9) + s * 0.36, lerp(el[2], wr[2], 0.9) + 0.02], d = vsub(qq, pp), len = vlen(d) || 1e-3, F = along(pp, qq, 1, [0, 0, 1]), j = L ? 0 : 2, sl = Math.min(len * 0.62, 0.45) / 0.45;
        MESH.pist.place(j, pp, vmul(F[0], len), F[1], F[2]); MESH.pist.place(j + 1, pp, vmul(F[0], sl), F[1], F[2]); }
      { const g = L ? 0 : 2, tz = (oT.dz || 0), wob = 0.05 * Math.sin(t * 3 + s), gait = (S.gk || 0) * 0.05 * Math.sin((S.gph || 0) * TAU * 2), ok = oA.a * oT.a > 0.3 ? 1 : 0;
        updCable(MESH.cables, g, [R.torso.x + 0.38, s * 0.55, R.torso.z - 0.2 + tz], vadd(el, [0, s * 0.2, -0.05]), (0.32 + wob + gait) * 0.6, 0.068 * ok, 0);
        updCable(MESH.cables, g + 1, [lerp(el[0], sh[0], 0.3), el[1] + s * 0.22, el[2] + 0.12], vadd(vadd(el, vmul(vsub(wr, el), 0.75)), [0, s * 0.33, 0.1]), (0.18 + wob + gait) * 0.4, 0.062 * ok, 0); } }
    items.push([MESH.pist.mesh, [0, 0, 0], I3(1), 1, gl, 7]); items.push([MESH.cables, [0, 0, 0], I3(1), oT.a, gl, 6]);
    for (const m of [MESH.pist.mesh, MESH.cables]) if (m.gl) GLM.touchGeo(m);
    // the screen box: each item's bounding sphere
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; const RAD = new Map([[MESH.torso, 1.25], [MESH.head, 0.75 * HS], [MESH.hand, 0.65 * HK], [MESH.foot, 0.45], [MESH.housing, 0.5], [MESH.uarm, 0.8], [MESH.farm, 1.0], [MESH.thigh, 0.6], [MESH.shin, 0.6], [MESH.barrel, 0.9]]);
    const box = (p, r) => { const w = rot(p), x = X0 + w[0] * k, y = Y0 + (w[1] * GY - w[2] * ZK) * k, rr = r * k; if (x - rr < bx0) bx0 = x - rr; if (x + rr > bx1) bx1 = x + rr; if (y - rr < by0) by0 = y - rr; if (y + rr > by1) by1 = y + rr; };
    for (const it of items) { const r = RAD.get(it[0]); if (r) box(it[1], r); else if (it[0] === MESH.shield[-1] || it[0] === MESH.shield[1]) box(it[1], 0.75); }
    box([R.torso.x, 0, R.torso.z - 0.5], 1.6);
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !(typeof window !== 'undefined' && window.__BEAST_GLHQ), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.4 : 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const Sv = { px: PXW, py: PYW, pd: CW, cl: [2 * k / bw, 2 * (X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (Y0 - by0) / bh], v: CW, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t,
      outline: o.ghost ? 0 : Math.max(1, 1.35 * (W / bw)), outlineCol: OUTC };
    // the occluders (spheres inside the big parts, posed with them): each part darkened where the others overhang it, and shadowed from the key light
    { let m2 = 0; const O = OCC, put = (p, r) => { if (m2 >= 12) return; const w = rot(p); O[m2 * 4] = w[0]; O[m2 * 4 + 1] = w[1]; O[m2 * 4 + 2] = w[2]; O[m2 * 4 + 3] = r; m2++; }, T0 = P3(R.torso);
      put(vadd(T0, [0.0, 0, 0.0]), 0.5); put(vadd(T0, [0.42, 0, -0.1]), 0.4); put(vadd(T0, [-0.56, 0, -0.04]), 0.34);
      put(vadd(P3(R.neck), [0.2 * HS * HEADX, 0, -0.03]), 0.3);
      for (const sx of ['L', 'R']) { const sd = P3(R['sd' + sx]), sg = sx === 'L' ? -1 : 1; put(vadd(sd, [0, 0.04 * sg, -0.02]), 0.42); put(P3(R['mt' + sx]), 0.27);
        const sh = P3(R['sh' + sx]), el = P3(R['el' + sx]), wr = P3(R['wr' + sx]); put(vmul(vadd(sh, el), 0.5), 0.15); put(vadd(el, vmul(vsub(wr, el), 0.45)), 0.26); }
      Sv.occ = O; Sv.nocc = m2; }
    let n = 0; const L2 = GLJ; L2.length = 0;
    for (const it of items) { const [mesh, org, ax, a, glow, kind] = it, al = vis * a; if (!(al > 0.004)) continue;
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      const A0 = rot(ax[0]), A1 = rot(ax[1]), A2 = rot(ax[2]), Tt = rot(org); for (let i = 0; i < 3; i++) { g.R0[i] = A0[i]; g.R1[i] = A1[i]; g.R2[i] = A2[i]; g.T[i] = Tt[i]; }
      g.mesh = mesh; g.alpha = al; g.glow = glow; g.glow2 = chg; g.spill = 0; g.kind = kind; g.wear = 0.7; g.fx = 0; g.outline = undefined; g.d = Tt[1] * VY + Tt[2] * VZ; L2.push(g); }
    L2.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    LASTI = items; LASTR = R;
    const t1 = nowMs(), cvs = GLM.render(W, H, Sv, L2); if (!cvs) return false;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); GLMS = GLMS * 0.9 + (nowMs() - t1) * 0.1; GLN++; LASTN = L2.length; const st0 = GLM.stats; LASTTRI = st0.tris; LASTCALLS = st0.calls;
    // the bores glow when the batteries tilt, brace or fire (cyan halos at the muzzles turned toward the camera)
    if (!o.ghost && GLM.halos && oC.a > 0.3) { const HL = []; for (const s of [-1, 1]) { const L = s < 0, B = R[L ? 'bL' : 'bR'], D = R[L ? 'dL' : 'dR'], g2 = Math.max((P.cannonTilt || 0) * 0.6, L ? (P.recoilL || 0) : (P.recoilR || 0), chg * 0.5), fw = D.x * sa * VY + D.y * ca * VY + D.z * VZ;
        if (g2 > 0.03 && fw > 0.02) for (let i = 0; i < 3; i++) { const w = rot(P3(B[i].b)); HL.push({ x: X0 + w[0] * k, y: Y0 + (w[1] * GY - w[2] * ZK) * k, r: 0.16 * k, a: g2 * vis * Math.min(1, fw * 2) * 0.8, col: CYAN }); } }
      if (HL.length) GLM.halos(c, HL); }
    return true;
  }
  /* (H's checks) the last drawn pose, body-local (tiles at scale 1): the farthest point of any part from the body's origin, the lowest point (the floor is z 0),
     and the seated rider's view: the nearest any part comes to the ray from the seat toward the camera (the rider is never covered while this stays above its radius) */
  let LASTI = null, LASTR = null;
  function extent(ag) { if (!LASTI) return null; ag = ag || 0; let mx = 0, zmin = 1e9, ray = 1e9, rayBy = ''; const seat = [LASTR.seat.x, LASTR.seat.y, LASTR.seat.z + 0.2], ca = Math.cos(ag), sa = Math.sin(ag), Vb = vnrm([VY * sa, VY * ca, VZ]);
    const names = new Map([[MESH.torso, 'torso'], [MESH.head, 'head'], [MESH.shield[-1], 'shield'], [MESH.shield[1], 'shield'], [MESH.uarm, 'uarm'], [MESH.farm, 'farm'], [MESH.hand, 'hand'], [MESH.thigh, 'thigh'], [MESH.shin, 'shin'], [MESH.foot, 'foot'], [MESH.housing, 'housing'], [MESH.barrel, 'barrel']]);
    for (const it of LASTI) { const [mesh, org, ax, a] = it; if (!(a > 0.5) || !names.has(mesh)) continue; const P0 = mesh.pos;
      for (let i = 0; i < mesh.nv * 3; i += 6) { const x = P0[i], y = P0[i + 1], z = P0[i + 2], p = [org[0] + ax[0][0] * x + ax[1][0] * y + ax[2][0] * z, org[1] + ax[0][1] * x + ax[1][1] * y + ax[2][1] * z, org[2] + ax[0][2] * x + ax[1][2] * y + ax[2][2] * z];
        const r = Math.hypot(p[0], p[1], p[2]); if (r > mx) mx = r; if (p[2] < zmin) zmin = p[2];
        const d = vsub(p, seat), tt = vdot(d, Vb); if (tt > 0.15 && mesh !== MESH.torso) { const dd = vlen(vsub(d, vmul(Vb, tt))); if (dd < ray) { ray = dd; rayBy = names.get(mesh); } } } }
    return { max: +(mx * VIS).toFixed(2), floor: +(zmin * VIS).toFixed(2), riderClear: +(ray * VIS).toFixed(2), riderBy: rayBy }; }
  const COUNTS = () => { if (!MESH) return null; const o = {}; for (const kk of ['torso', 'head', 'housing', 'hand', 'foot', 'uarm', 'farm', 'thigh', 'shin', 'barrel']) o[kk] = MESH[kk].ntri; o.shield = MESH.shield[1].ntri; o.pist = MESH.pist.mesh.ntri; o.cables = MESH.cables.ntri;
    o.total = o.torso + o.head + 2 * (o.shield + o.housing + o.hand + o.foot + o.uarm + o.farm + o.thigh + o.shin) + 6 * o.barrel + o.pist + o.cables; o.items = 27; return o; };
  return { on, draw, fail: glFail, buildAt, COUNTS, get stats() { return { ms: GLMS, n: GLN, items: LASTN, tris: LASTTRI, calls: LASTCALLS, meshMs: MESH_MS }; }, get NOGL() { return NOGL; },
    __dbg: { get MESH() { return MESH; }, bodySD, rTab, extent } };
})();
