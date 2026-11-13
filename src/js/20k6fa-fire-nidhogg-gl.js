/* ---------- Nidhogg on the GPU (worker M, 2026-11-13): the dragon as real 3D meshes, drawn by GLM in one pass ----------
   The same design as the 2D model in 20k6f (its silhouette, proportions, palette and parts), rebuilt as meshes with real
   forms and layered detail: the torso traced from the 2D model's own shape in crimson scales under six overlapping
   scarlet lames, a segmented belly lit from within, flank vents, tubes and pistons, the wing mounts, the armoured seat;
   the head (scaled skull, wedge snout under four layered nasal plates, a ridge of studs and spikes, ember nostrils, lip
   lines, teeth, riveted cheeks, recessed glowing eyes with slit pupils, armoured bronze-trimmed brows, the brow gem,
   swept gunmetal horns with bronze bands, the crown and cheek frills); the jaw; the bladed tail tip; the neck and tail as
   swept tubes (scales, shingled armour lames with glowing seams, lit belly plates, steel tail rails); 34 dorsal spikes;
   veined membranes lit through; the wing arms, fingers, silver claws and hubs; the legs and talons.
   Posed from NIDHOGG_MODEL's own rig (20k6f calls draw() here first and falls back to its 2D sprites): every pose
   channel, clip and anchor is the 2D model's. Materials: GLM ids 38-48 (Nidhogg's), plus 2 (silver), 3 (bronze), 17
   (the seat's quilted leather). Cost: one GLM pass of 16 items (each one draw call and its outline); the moving parts are
   a handful of dynamic meshes rewritten each frame (about 17k vertices). */
const NIDHOGG_GL = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u;
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const hyp = (a, b) => Math.sqrt(a * a + b * b), hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => hyp3(a[0], a[1], a[2]);
  const vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  /* the 2D model's constants (20k6f): the camera, the drawn scales of the pieces, the tube's period */
  const ZK = 0.695, VY = 0.6945, VZ = 0.7195, VIS = 1.25, HEADK = 3.0, TK = 1.7, LK = 1.6, RT = 0.15, PD = 0.25;
  const SEAT = { x: 0.42, z: 0.46 }, BELLY_X = [0.62, 0.46, 0.3, 0.14, -0.02, -0.18, -0.34, -0.5, -0.66, -0.82];
  /* materials */
  const M_SC = 38, M_AR = 39, M_ST = 40, M_HO = 41, M_BE = 42, M_FI = 43, M_EYE = 44, M_TO = 45, M_TA = 46, M_GEM = 47, M_MEM = 48, M_SIL = 2, M_GOLD = 3, M_LEA = 17;

  /* ================= the torso's shape (the 2D model's signed distance, its base volume) ================= */
  function ell(x, y, z, a, b, c) { const k0 = hyp3(x / a, y / b, z / c); if (k0 < 1e-6) return -Math.min(a, b, c); const k1 = hyp3(x / (a * a), y / (b * b), z / (c * c)); return k0 * (k0 - 1) / k1; }
  function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
  function bodySD(x, y, z) { const ay = Math.abs(y);
    let bd = smin(ell(x - 0.34, y, z - 0.02, 0.58, 0.46, 0.42), ell(x + 0.32, y, z + 0.02, 0.66, 0.38, 0.34), 0.16);
    bd = smin(bd, ell(x + 0.84, y, z, 0.34, 0.31, 0.28), 0.12); return smin(bd, ell(x - 0.16, ay - 0.34, z - 0.24, 0.2, 0.16, 0.15), 0.1); }
  /* the body's radius at section x in the direction phi (0 up, + toward the right): bisected along the ray (the shape is star-shaped about its axis) */
  function bodyR(x, ph) { const dy = Math.sin(ph), dz = Math.cos(ph); if (bodySD(x, 0, 0) >= 0) return 0; let a = 0, b = 0.8;
    for (let i = 0; i < 15; i++) { const m = (a + b) / 2; if (bodySD(x, dy * m, dz * m) < 0) a = m; else b = m; } return (a + b) / 2; }
  /* a table of it (x across the body, phi round it), read bilinearly: the torso's surface and everything laid on it */
  const RTX = 96, RTP = 72; let RTAB = null, RXA = 0, RXB = 0;
  function rTab(x, ph) { if (!RTAB) { RXA = -1.3; RXB = 1.0; while (bodySD(RXA, 0, 0) >= 0) RXA += 0.004; while (bodySD(RXB, 0, 0) >= 0) RXB -= 0.004; RTAB = new Float32Array((RTX + 1) * (RTP + 1));
      for (let i = 0; i <= RTX; i++) for (let j = 0; j <= RTP; j++) RTAB[i * (RTP + 1) + j] = bodyR(lerp(RXA, RXB, i / RTX), j / RTP * TAU); }
    const fx = cl((x - RXA) / (RXB - RXA)) * RTX, i = Math.min(RTX - 1, Math.floor(fx)), u = fx - i; let fp = ((ph % TAU) + TAU) % TAU / TAU * RTP; const j = Math.min(RTP - 1, Math.floor(fp)), v = fp - j, at = (a, b) => RTAB[a * (RTP + 1) + b];
    return lerp(lerp(at(i, j), at(i, j + 1), v), lerp(at(i + 1, j), at(i + 1, j + 1), v), u); }

  /* ================= meshes ================= */
  let MESH = null, MESH_MS = 0;
  const EYE = [0.21, 0.13, 0.04], EYER = 0.05, GEMC = [0.15, 0, 0.122];
  function buildMeshes() {
    const q = lowFx() ? 0.7 : 1, M = {};
    const nq = v => Math.max(4, Math.round(v * q));
    const spikeAt = (B, a, b, r, m) => B.spike(a, b, r, m, { seg: 6 });
    const chain = (B, pts, r0, r1, m, seg) => { const n = pts.length - 1; for (let i = 0; i < n; i++) B.tube(pts[i], pts[i + 1], lerp(r0, r1, i / n), lerp(r0, r1, (i + 1) / n), m, { seg: seg || 10, cap0: 'round', cap1: i === n - 1 && r1 < 0.01 ? 'flat' : 'round' }); };
    const bez = (a, b, c, n) => { const o = []; for (let i = 0; i <= n; i++) { const u = i / n, k0 = (1 - u) * (1 - u), k1 = 2 * u * (1 - u), k2 = u * u; o.push([a[0] * k0 + b[0] * k1 + c[0] * k2, a[1] * k0 + b[1] * k1 + c[1] * k2, a[2] * k0 + b[2] * k1 + c[2] * k2]); } return o; };
    const band = (B, c, d, R, r, m) => { B.along(c, d); B.torX([0, 0, 0], R, r, m, { seg: 18, rseg: 6 }); B.pop(); };
    const frameOf = (o, x, zh) => { const X = vnrm(x); let Z = vsub(zh, vmul(X, vdot(zh, X))); Z = vnrm(Z); const Y = vcross(Z, X); return [X, Y, Z, o]; };
    const pushF = (B, F, s) => { s = s || [1, 1, 1]; return B.push(vmul(F[0], s[0]), vmul(F[1], s[1]), vmul(F[2], s[2]), F[3]); };

    // ---- the torso (the 2D model's units; drawn at TK): traced from the shape, then layered with armour, belly plates, vents, mounts and the seat
    { const B = GLM.builder(q), NX = nq(40), NP = nq(36);
      rTab(0, 0); const xa = RXA, xb = RXB, xs = v => xa + (xb - xa) * (1 - Math.cos(Math.PI * v)) / 2, rAt = rTab;
      const surfP = (x, ph, off) => { const r = rAt(x, ph) + (off || 0); return [x, Math.sin(ph) * r, Math.cos(ph) * r]; };
      B.surf((u, v) => surfP(xs(v), u * TAU), NP, NX, () => M_SC, { flip: true });
      // the belly: ten plates between the seams, each raised a little, its rim (a glowing seam) marked by the edge weight
      const BX = BELLY_X.slice().sort((a, b) => a - b);
      for (let i = 0; i + 1 < BX.length; i++) { const x0 = BX[i] + 0.008, x1 = BX[i + 1] - 0.008, NU = 12, NV = 4;
        const pf = (u, v) => { const ins = Math.min(u, 1 - u) * NU, inv = Math.min(v, 1 - v) * NV, k = Math.min(1, Math.min(ins, inv) * 0.9); return surfP(lerp(x0, x1, v), Math.PI + lerp(-1.08, 1.08, u), 0.006 + 0.016 * k); };
        B.surf(pf, NU, NV, () => M_BE, { flip: true, e: (u, v) => (u < 0.5 / NU || u > 1 - 0.5 / NU || v < 0.5 / NV || v > 1 - 0.5 / NV ? 1 : 0) }); }
      // the furnace seams: a glowing line along each side where the belly plates meet the scales, and a ring round the chest
      for (const sg of [-1, 1]) { const pts = []; for (let i = 0; i <= 14; i++) pts.push(surfP(lerp(-0.86, 0.7, i / 14), Math.PI + sg * 1.13, 0.008)); for (let i = 0; i < 14; i++) B.tube(pts[i], pts[i + 1], 0.013, 0.013, M_FI, { seg: 6, cap0: 'round', cap1: 'round' }); }
      { const pts = []; for (let i = 0; i <= 16; i++) pts.push(surfP(0.66, Math.PI + lerp(-1.75, 1.75, i / 16), 0.01)); for (let i = 0; i < 16; i++) B.tube(pts[i], pts[i + 1], 0.016, 0.016, M_FI, { seg: 6, cap0: 'round', cap1: 'round' }); }
      // six overlapping scarlet lames over the back and shoulders, each proud at its back edge, a panel line round its rim, three rivets at its front
      for (let i = 0; i < 6; i++) { const x1 = 0.66 - i * 0.26, x0 = x1 - 0.3, ylim = 0.36 - 0.05 * Math.abs(i - 2), ry = rAt((x0 + x1) / 2, Math.PI / 2) || 0.3, pm = Math.min(1.2, Math.asin(Math.min(0.98, ylim / ry))), NU = 14, NV = 7;
        const pf = (u, v) => { const x = lerp(x1, x0, v), uu = (x1 - x) / 0.3, ins = Math.min(u, 1 - u) * NU, inv = Math.min(v, 1 - v) * NV, k = Math.min(1, Math.min(ins, inv) * 0.85); return surfP(x, lerp(-pm, pm, u), 0.004 + (0.026 + 0.022 * uu) * k); };
        B.surf(pf, NU, NV, () => M_AR, { e: (u, v) => (u < 0.5 / NU || u > 1 - 0.5 / NU || v < 0.5 / NV || v > 1 - 0.5 / NV ? 1 : u < 1.5 / NU || u > 1 - 1.5 / NU || v < 1.5 / NV || v > 1 - 1.5 / NV ? 0.5 : 0) });
        for (const ph of [-pm * 0.6, 0, pm * 0.6]) B.sph(surfP(x1 - 0.035, ph, 0.032), 0.012, M_ST, 6); }
      for (const s of [-1, 1]) {
        // the flank vents: a steel housing, a recessed glowing panel, five louvres across it
        B.box([0.12, 0.43 * s, 0.02], [0.22, 0.06, 0.13], 0.03, M_ST);
        B.box([0.12, 0.488 * s, 0.02], [0.18, 0.006, 0.095], 0, M_FI);
        for (let j = 0; j < 5; j++) B.box([0.12 + (j - 2) * 0.075, 0.497 * s, 0.02], [0.013, 0.008, 0.1], 0.004, M_ST);
        // the dark mechanical tube along each flank, behind the vents, with collars
        B.tube([-0.25, 0.34 * s, -0.02], [-0.85, 0.27 * s, 0.0], 0.065, 0.06, M_ST, { seg: 12 });
        for (const u of [0.2, 0.55, 0.9]) band(B, [lerp(-0.25, -0.85, u), lerp(0.34, 0.27, u) * s, lerp(-0.02, 0, u)], [-0.6, -0.07 * s, 0.02], 0.068, 0.012, M_ST);
        // the wing mount: a steel ball, an orange-lit ring round it; a piston down from it to the vent's housing
        B.sph([0.16, 0.42 * s, 0.3], 0.12, M_ST, 14); B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0.16, 0.53 * s, 0.3]); B.tor([0, 0, 0], 0.085, 0.02, M_FI, { seg: 22, rseg: 6 }); B.pop();
        B.tube([0.06, 0.4 * s, 0.24], [0.04, 0.45 * s, 0.1], 0.03, 0.028, M_ST, { seg: 8 }); B.tube([0.04, 0.45 * s, 0.1], [0.02, 0.47 * s, -0.02], 0.016, 0.016, M_SIL, { seg: 8 });
        // the hip joint
        B.sph([-0.62, 0.3 * s, -0.2], 0.12, M_ST, 14); B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [-0.62, 0.41 * s, -0.2]); B.tor([0, 0, 0], 0.07, 0.016, M_FI, { seg: 18, rseg: 6 }); B.pop();
      }
      // the rider's armoured seat behind the neck: a scarlet shell, a raised rim round a padded cup, a high padded back, a steel hoop behind it
      B.box([SEAT.x, 0, SEAT.z - 0.02], [0.15, 0.17, 0.08], 0.05, M_AR);
      B.box([SEAT.x + 0.14, 0, SEAT.z + 0.07], [0.014, 0.16, 0.02], 0.01, M_AR); for (const s of [-1, 1]) B.box([SEAT.x, 0.158 * s, SEAT.z + 0.07], [0.15, 0.014, 0.02], 0.01, M_AR);
      B.box([SEAT.x - 0.01, 0, SEAT.z + 0.062], [0.12, 0.14, 0.012], 0.01, M_LEA);
      B.box([SEAT.x - 0.165, 0, SEAT.z + 0.13], [0.035, 0.16, 0.13], 0.03, M_AR); B.box([SEAT.x - 0.128, 0, SEAT.z + 0.15], [0.006, 0.12, 0.09], 0.004, M_LEA);
      B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [SEAT.x - 0.22, 0, SEAT.z + 0.04]); B.tor([0, 0, 0], 0.11, 0.018, M_ST, { seg: 20, rseg: 6, ph0: 0, ph1: Math.PI }); B.pop();
      M.torso = B.done(); }

    // ---- the head (origin the neck joint; x forward, y right, z up; drawn at HEADK)
    { const B = GLM.builder(q);
      B.ell([-0.02, 0, 0.03], [0.22, 0.165, 0.15], M_SC, { seg: 22, rings: 14 });
      // the snout: an angular wedge (a sloping top, flanks drawn in below, chamfers, a flat underside)
      const sec = (x, th, off) => { const h = cl((x - 0.05) / 0.6), zc = -0.03 - 0.03 * h, wS = 0.122 - 0.062 * h, tS = 0.112 - 0.15 * h, bS = -0.085 + 0.01 * h, zm = (tS + bS) / 2, hz = (tS - bS) / 2, c = Math.cos(th), s = Math.sin(th);
        let y = wS * Math.sign(c) * Math.pow(Math.abs(c), 0.55), z = zm + hz * Math.sign(s) * Math.pow(Math.abs(s), 0.6);
        const ex = Math.abs(y) * 0.85 + z - (tS + wS * 0.6); if (ex > 0) { z -= ex * 0.55; y -= Math.sign(y) * ex * 0.45 / 0.85; }
        if (z < zc) y *= Math.max(0.55, 1 - (zc - z) * 0.35 / Math.max(0.03, wS));
        const o = off || 0, l = hyp(y, z - zm) || 1; return [x, y + y / l * o, z + (z - zm) / l * o]; };
      const XS0 = -0.02, XS1 = 0.66, NS = nq(22), NT = nq(24);
      B.surf((u, v) => { const x = lerp(XS0, XS1 + 0.035, v), k = x > XS1 ? 1 - (x - XS1) / 0.035 : 1, p = sec(Math.min(x, XS1), u * TAU), h = cl((XS1 - 0.05) / 0.6), zm = ((0.112 - 0.15 * h) + (-0.085 + 0.01 * h)) / 2; return x > XS1 ? [x, p[1] * Math.sqrt(Math.max(0, k)), zm + (p[2] - zm) * Math.sqrt(Math.max(0, k))] : p; }, NT, NS, () => M_SC);
      // four layered nasal plates over the top and the chamfers, each rising toward its front edge, then a step down to the next
      for (let kp = 0; kp < 4; kp++) { const u0 = Math.max(0, (kp - 0.15) / 4), u1 = Math.min(1, (kp + 0.85) / 4), x0 = 0.06 + u0 * 0.58 + 0.004, x1 = 0.06 + u1 * 0.58 - 0.004, NU = 14, NV = 6;
        B.surf((u, v) => { const x = lerp(x0, x1, v), f = v, ins = Math.min(u, 1 - u) * NU, inv = Math.min(v, 1 - v) * NV, k = Math.min(1, Math.min(ins, inv) * 0.9); return sec(x, lerp(0.42, Math.PI - 0.42, u), 0.002 + (0.008 + 0.02 * f) * k); }, NU, NV, () => M_AR,
          { e: (u, v) => (u < 0.5 / NU || u > 1 - 0.5 / NU || v < 0.5 / NV || v > 1 - 0.5 / NV ? 1 : 0) }); }
      // the ridge down the top: steel studs, small swept horn spikes between them
      for (let i = 0; i < 6; i++) { const xs = 0.13 + i * 0.085, hs = cl((xs - 0.05) / 0.6), zt = 0.112 - 0.15 * hs + 0.03;
        if (i & 1) spikeAt(B, [xs, 0, zt - 0.012], [xs - 0.05, 0, zt + 0.045], 0.018, M_HO); else B.sph([xs, 0, zt - 0.004], 0.018, M_ST, 8); }
      for (const s of [-1, 1]) {
        // the nostrils: a flared rim, an ember glow inside
        B.ell([0.6, 0.042 * s, 0.0], [0.05, 0.03, 0.028], M_AR, { seg: 12, rings: 8 }); B.ell([0.648, 0.046 * s, -0.002], [0.006, 0.015, 0.013], M_FI, { seg: 10, rings: 6 });
        // the lip line, the upper teeth under it
        B.tube([0.06, 0.118 * s, -0.075], [0.64, 0.055 * s, -0.07], 0.015, 0.01, M_ST, { seg: 8 });
        for (let i = 0; i < 7; i++) { const tx = 0.16 + i * 0.07, ty = 0.1 - i * 0.008, L = i === 6 ? 0.1 : 0.065; spikeAt(B, [tx, ty * s, -0.07], [tx + 0.012, (ty - 0.004) * s, -0.08 - L], 0.019, M_TO); }
        // riveted cheek plates
        B.ell([0.05, 0.13 * s, -0.02], [0.14, 0.05, 0.08], M_AR, { seg: 14, rings: 8 }); for (let i = 0; i < 3; i++) B.sph([-0.03 + i * 0.06, 0.177 * s, 0.03 - i * 0.004], 0.011, M_ST, 6);
        // the eye: a dark recessed socket, a molten eyeball, a slit pupil, a thin glowing rim
        const E = [EYE[0], EYE[1] * s, EYE[2]], G = vnrm([0.4, 0.78 * s, 0.48]), U0 = [-0.2, -0.38 * s, 0.9], Uu = vnrm(vsub(U0, vmul(G, vdot(U0, G))));
        B.sph(vsub(E, vmul(G, 0.014)), 0.062, M_TA, 12); B.sph(E, EYER, M_EYE, 14);
        { const Fp = frameOf(vadd(E, vmul(G, 0.044)), G, Uu); pushF(B, Fp); B.ell([0, 0, 0], [0.009, 0.008, 0.034], M_TA, { seg: 8, rings: 6 }); B.pop(); }
        { const Fr = frameOf(vadd(E, vmul(G, 0.014)), Uu, G); pushF(B, Fr); B.tor([0, 0, 0], 0.058, 0.009, M_FI, { seg: 20, rseg: 4 }); B.pop(); }
        // the heavy brow: a tapered leaf of armour, flat underneath, rimmed in bronze, riveted
        { const cy = Math.cos(0.32), sy = Math.sin(0.32), cp = Math.cos(0.3), sp = Math.sin(0.3), X = [cp * cy, cp * sy * s, -sp], Y0 = [-sy, cy * s, 0], Z = vnrm(vcross(X, Y0)), Y = vcross(Z, X), F = [X, Y, Z, [0.19, 0.1 * s, 0.132]];
          pushF(B, F); B.ell([0, 0, -0.004], [0.165, 0.054, 0.016], M_GOLD, { seg: 14, rings: 4, th0: Math.PI / 2 - 0.15, th1: Math.PI / 2 + 0.15 }); B.ell([0, 0, 0], [0.155, 0.05, 0.038], M_AR, { seg: 16, rings: 6, th1: Math.PI / 2, cap: true }); B.pop(); }
        for (let i = 0; i < 3; i++) B.sph([0.13 + i * 0.065, (0.112 - i * 0.016) * s, 0.172 - i * 0.008], 0.0095, M_ST, 6);
        // the horns: thick swept gunmetal with bronze bands; a lower horn
        { const P = bez([0.02, 0.1 * s, 0.12], [-0.22, 0.17 * s, 0.22], [-0.62, 0.16 * s, 0.27], nq(8)); chain(B, P, 0.068, 0.006, M_HO, 10);
          for (const [i, R] of [[1, 0.068], [2, 0.062], [4, 0.05], [6, 0.034]]) band(B, P[i], vsub(P[i + 1], P[i - 1]), R, 0.016, M_GOLD); }
        { const P = bez([-0.02, 0.13 * s, 0.03], [-0.18, 0.19 * s, 0.03], [-0.34, 0.21 * s, 0.07], nq(5)); chain(B, P, 0.038, 0.004, M_HO, 8); band(B, P[1], vsub(P[2], P[0]), 0.036, 0.011, M_GOLD); band(B, P[3], vsub(P[4], P[2]), 0.022, 0.01, M_GOLD); }
        // the cheek frill
        for (let i = 0; i < 4; i++) { const xx = 0.08 - i * 0.07; spikeAt(B, [xx, 0.15 * s, -0.03 - i * 0.01], [xx - 0.3, (0.27 + i * 0.03) * s, -0.05 - i * 0.02], 0.026, M_AR); }
      }
      // the crown of spikes
      for (let i = -4; i <= 4; i++) { const yy = i * 0.03, L = 0.38 - Math.abs(i) * 0.03; spikeAt(B, [-0.02, yy, 0.12], [-0.02 - L * 0.85, yy * 2.2, 0.13 + L * 0.5], 0.026, M_AR); }
      // the brow gem in its bronze bezel
      B.push([1.25, 0, 0], [0, 1, 0], [0, 0, 1], [GEMC[0], 0, GEMC[2] - 0.006]); B.tor([0, 0, 0], 0.036, 0.01, M_GOLD, { seg: 18, rseg: 5 }); B.pop();
      { const g = GEMC, P6 = [[g[0] + 0.053, 0, g[2]], [g[0], 0.04, g[2]], [g[0] - 0.053, 0, g[2]], [g[0], -0.04, g[2]]], T6 = [g[0], 0, g[2] + 0.026], D6 = [g[0], 0, g[2] - 0.02];
        for (let i = 0; i < 4; i++) { const a = P6[i], b = P6[(i + 1) % 4]; B.facet([a, b, T6], M_GEM); B.facet([b, a, D6], M_GEM); } }
      M.head = B.done(); }

    // ---- the lower jaw (origin the hinge; drawn at HEADK)
    { const B = GLM.builder(q), rJ = x => lerp(0.11, 0.05, cl(x / 0.52));
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 0.8], [0, 0, -0.02]); B.tube([0, 0, 0], [0.52, 0, 0], 0.11, 0.05, M_SC, { seg: 16, rings: 4 }); B.pop();
      for (let k = 0; k < 3; k++) { const x0 = Math.max(0.02, (k - 0.2) / 3 * 0.5), x1 = Math.min(0.5, (k + 0.8) / 3 * 0.5), NU = 14, NV = 5;
        B.surf((u, v) => { const x = lerp(x0, x1, v), th = lerp(-Math.PI + 0.35, -0.35, u), ins = Math.min(u, 1 - u) * NU, inv = Math.min(v, 1 - v) * NV, kk = Math.min(1, Math.min(ins, inv) * 0.9), r = rJ(x) + 0.004 + (0.008 + 0.016 * v) * kk; return [x, Math.cos(th) * r, -0.02 + Math.sin(th) * r * 0.8]; }, NU, NV, () => M_AR,
          { e: (u, v) => (u < 0.5 / NU || u > 1 - 0.5 / NU || v < 0.5 / NV || v > 1 - 0.5 / NV ? 1 : 0) }); }
      B.ell([0.14, 0, -0.075], [0.18, 0.08, 0.05], M_AR, { seg: 16, rings: 8 }); for (const yy of [-0.05, 0, 0.05]) B.sph([0.14, yy, -0.122], 0.0095, M_ST, 6);
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 0.35], [0, 0, 0.045]); B.tube([0.05, 0, 0], [0.48, 0, -0.04], 0.06, 0.028, M_FI, { seg: 12 }); B.pop();
      for (const s of [-1, 1]) { B.tube([0.02, 0.085 * s, 0.03], [0.5, 0.042 * s, 0.028], 0.014, 0.01, M_ST, { seg: 8 });
        for (let i = 0; i < 6; i++) { const tx = 0.12 + i * 0.065, ty = 0.07 - i * 0.009; spikeAt(B, [tx, ty * s, 0.02], [tx - 0.008, ty * s, 0.12], 0.019, M_TO); }
        for (let i = 0; i < 4; i++) { const xx = 0.05 + i * 0.07; spikeAt(B, [xx, 0.06 * s, -0.07], [xx - 0.22, (0.12 + i * 0.02) * s, -0.2], 0.022, M_AR); } }
      M.jaw = B.done(); }

    // ---- the tail's bladed spearhead (origin its base; drawn at 2.0): a flat leaf blade, two back barbs, a steel collar, a glowing centre seam
    { const B = GLM.builder(q), pts = [[-0.02, 0.03], [0.05, 0.1], [0.12, 0.158], [0.22, 0.13], [0.36, 0.085], [0.5, 0.038], [0.62, 0], [0.5, -0.038], [0.36, -0.085], [0.22, -0.13], [0.12, -0.158], [0.05, -0.1], [-0.02, -0.03]];
      B.prism(pts, -0.035, 0.035, M_AR, { b: 0.014 });
      B.box([0.28, 0, 0], [0.22, 0.008, 0.037], 0, M_FI);
      for (const s of [-1, 1]) spikeAt(B, [0.12, 0.12 * s, 0], [-0.08, 0.27 * s, 0], 0.032, M_AR);
      B.tube([-0.12, 0, 0], [0.12, 0, 0], 0.07, 0.05, M_ST, { seg: 14 }); band(B, [0.02, 0, 0], [1, 0, 0], 0.066, 0.012, M_FI);
      M.tip = B.done(); }

    // ---- kit templates (moved on the CPU into the wing and leg kits). Bones and claws run along x from 0 to 1 (stretched to their length); their sections are in the 2D model's units (scaled by the bone's width)
    const T = {};
    { const B = GLM.builder(q);   // a wing arm: shingled scarlet armour, each plate proud at its far end; a ridge of small spikes on top; a gunmetal brace and piston below
      B.tube([0, 0, 0], [1, 0, 0], 0.056, 0.04, M_ST, { seg: 12 });
      for (let j = 0; j < 5; j++) { const x0 = j * 0.2, x1 = x0 + 0.2, r = x => 0.072 - 0.018 * x;
        B.lathe([[x0 + 0.004, r(x0) * 0.78], [x0 + 0.02, r(x0) + 0.002], [x1 - 0.03, r(x1) + 0.016], [x1 - 0.008, r(x1) + 0.014], [x1 - 0.002, r(x1) * 0.8]], M_AR, { seg: 14 }); }
      for (let i = 0; i < 5; i++) { const sx = 0.12 + i * 0.2; spikeAt(B, [sx, 0, 0.05], [sx - 0.09, 0, 0.13], 0.024, M_AR); }
      B.tube([0.05, 0, -0.075], [0.95, 0, -0.075], 0.022, 0.022, M_ST, { seg: 8 }); B.tube([0.05, 0, -0.075], [0.42, 0, -0.075], 0.034, 0.034, M_ST, { seg: 10 });
      for (const x of [0.05, 0.95]) B.tube([x, 0, -0.075], [x, 0, -0.02], 0.016, 0.016, M_SIL, { seg: 6 });
      T.wbone = B.done(); }
    { const B = GLM.builder(q);   // a finger: a steel rod with four armour sleeves
      B.tube([0, 0, 0], [1, 0, 0], 0.032, 0.018, M_ST, { seg: 8 });
      for (const [x0, x1] of [[0.05, 0.19], [0.3, 0.44], [0.55, 0.69], [0.8, 0.92]]) { const r = x => 0.042 - 0.02 * x; B.lathe([[x0, r(x0) * 0.7], [x0 + 0.01, r(x0)], [x1 - 0.01, r(x1) + 0.004], [x1, r(x1) * 0.7]], M_AR, { seg: 10 }); }
      T.wfing = B.done(); }
    { const B = GLM.builder(q), N = 8;   // a claw: a long curved silver hook, curling down
      B.surf((u, v) => { const x = v, r = (0.05 * (1 - x) + 0.003) * 1.2, ph = u * TAU; return [x, Math.sin(ph) * r / 1.4, -0.12 * x * x + Math.cos(ph) * r]; }, 8, N, () => M_SIL, { flip: true });
      B.sph([0, 0, 0], 0.062, M_SIL, 8);
      T.claw = B.done(); }
    { const B = GLM.builder(q);   // a hub (the 2D model's units; drawn at its joint's size): a steel ball, a disc, a recessed orange ring, a glowing cap; its face along z
      B.sph([0, 0, 0], 0.1, M_ST, 12); B.tube([0, 0, 0.04], [0, 0, 0.1], 0.085, 0.085, M_ST, { seg: 18, cap0: false, cap1: 'flat' }); B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0.1]); B.tor([0, 0, 0], 0.055, 0.016, M_FI, { seg: 18, rseg: 5 }); B.pop();
      B.sph([0, 0, 0.098], 0.03, M_FI, 8);
      T.hub = B.done(); }
    { const B = GLM.builder(q);   // the thigh (unit length along x; sections in tiles): a scaled ellipsoid under an armour dome
      B.ell([0.48, 0, 0], [0.56, 0.27, 0.27], M_SC, { seg: 16, rings: 10 }); B.ell([0.5, 0, 0.05], [0.47, 0.25, 0.27], M_AR, { seg: 16, rings: 6, th1: Math.PI / 2, cap: true });
      T.thigh = B.done(); }
    { const B = GLM.builder(q);   // the shin (unit length; sections in tiles): a scaled limb with a steel piston on its front
      B.tube([0, 0, 0], [1, 0, 0], 0.12, 0.088, M_SC, { seg: 12 }); B.tube([0.12, 0, 0.085], [0.82, 0, 0.075], 0.045, 0.04, M_ST, { seg: 8 }); B.tube([0.1, 0, 0.085], [0.95, 0, 0.07], 0.022, 0.022, M_SIL, { seg: 6 });
      T.shin = B.done(); }
    { const B = GLM.builder(q); B.sph([0, 0, 0], 0.085, M_ST, 10); B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]); B.tor([0, 0, 0], 0.075, 0.012, M_FI, { seg: 16, rseg: 4 }); B.pop(); T.knee = B.done(); }   // a knee (the 2D model's units, drawn at LK)
    { const B = GLM.builder(q);   // a hind foot (origin the ankle; toes forward and down; drawn at LK): a pad, three toes, dark curved talons, a back talon
      B.ell([0.06, 0, -0.04], [0.12, 0.09, 0.06], M_SC, { seg: 12, rings: 8 }); B.sph([0, 0, 0], 0.06, M_ST, 10);
      for (let i = 0; i < 3; i++) { const a = (i - 1) * 0.45, c = Math.cos(a), s = Math.sin(a); B.tube([0.05 * c, 0.05 * s, -0.04], [0.17 * c, 0.17 * s, -0.06], 0.035, 0.028, M_SC, { seg: 8 });
        chain(B, bez([0.17 * c, 0.17 * s, -0.06], [0.25 * c, 0.25 * s, -0.06], [0.27 * c, 0.27 * s, -0.14], 3), 0.026, 0.003, M_TA, 6); }
      chain(B, bez([-0.06, 0, -0.03], [-0.14, 0, -0.04], [-0.17, 0, -0.11], 3), 0.022, 0.003, M_TA, 6);
      T.foot = B.done(); }
    M.T = T;

    // ---- the kits: rigid templates moved on the CPU into one mesh each (one draw call for a wing's 14 pieces, a leg's 4)
    M.wingKit = [0, 1].map(() => kit([T.wbone, T.wbone, T.wfing, T.wfing, T.wfing, T.wfing, T.claw, T.claw, T.claw, T.claw, T.claw, T.hub, T.hub, T.hub]));
    M.legKit = [0, 1].map(() => kit([T.thigh, T.shin, T.knee, T.foot]));
    // ---- the dynamic meshes: the neck and tail (skin, lames, belly, rails), the dorsal spikes, the membranes
    M.dyn = mkDyn();
    return M;
  }

  /* ---- a kit: templates concatenated into one mesh; place(i, o, X, Y, Z) moves template i to origin o with axes X, Y, Z (not unit: stretched), its normals by the cofactors */
  function kit(list) {
    let nv = 0, ni = 0; for (const t of list) { nv += t.nv; ni += t.idx.length; }
    const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), att = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni), at = [];
    let v0 = 0, i0 = 0; for (const t of list) { att.set(t.att, v0 * 3); for (let i = 0; i < t.idx.length; i++) idx[i0 + i] = t.idx[i] + v0; at.push(v0); v0 += t.nv; i0 += t.idx.length; }
    const mesh = { pos, nrm, att, idx, nv, ntri: ni / 3, gl: null };
    return { mesh, list, at, place(i, o, X, Y, Z) { const t = list[i], b = at[i] * 3, P0 = t.pos, N0 = t.nrm, cx = vcross(Y, Z), cy = vcross(Z, X), cz = vcross(X, Y);
      for (let j = 0, n = t.nv * 3; j < n; j += 3) { const x = P0[j], y = P0[j + 1], z = P0[j + 2]; pos[b + j] = o[0] + X[0] * x + Y[0] * y + Z[0] * z; pos[b + j + 1] = o[1] + X[1] * x + Y[1] * y + Z[1] * z; pos[b + j + 2] = o[2] + X[2] * x + Y[2] * y + Z[2] * z;
        const a = N0[j], bb = N0[j + 1], c = N0[j + 2], nx = cx[0] * a + cy[0] * bb + cz[0] * c, ny = cx[1] * a + cy[1] * bb + cz[1] * c, nz = cx[2] * a + cy[2] * bb + cz[2] * c, l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nrm[b + j] = nx / l; nrm[b + j + 1] = ny / l; nrm[b + j + 2] = nz / l; } } };
  }

  /* ---- the dynamic meshes: fixed vertex counts, positions and normals rewritten each frame (body-local, the rig's units) ---- */
  const TORSO_Y = 0.88;   // (the torso drawn a little narrower than modelled: as slim as the 2D sprite reads)
  const KR_NECK = 0.8, KR_TAIL = 0.6;   // (the drawn neck's and tail's thickness, of the rig's radius: as thick as the 2D strips look)
  const NSUB = 4, TSUB = 3, NPH = 16, NLAME = 6, TLAME = 22, LR = 8, LC = 9, NSPK = 40, MU = 32, MV = 7;
  const N_NECK = 14 * NSUB + 1, N_TAIL = 33 * TSUB + 1;   // (the rig gives 15 neck samples, 34 tail samples)
  function grid(nu, nv, nGrids) {   // a mesh of nGrids grids of (nu + 1) x (nv + 1) vertices
    const per = (nu + 1) * (nv + 1), nvT = per * nGrids, idx = [];
    for (let g = 0; g < nGrids; g++) for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = g * per + j * (nu + 1) + i; idx.push(a, a + 1, a + nu + 2, a, a + nu + 2, a + nu + 1); }
    return { pos: new Float32Array(nvT * 3), nrm: new Float32Array(nvT * 3), att: new Float32Array(nvT * 3), idx: nvT > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), nv: nvT, ntri: idx.length / 3, gl: null, nu, nvv: nv, per };
  }
  function mkDyn() {
    const D = {};
    D.skinN = grid(NPH, N_NECK - 1, 1); D.skinT = grid(NPH, N_TAIL - 1, 1);
    D.bellyN = grid(6, N_NECK - 1, 1); D.bellyT = grid(6, N_TAIL - 1, 1);
    D.lames = grid(LC - 1, LR - 1, NLAME + TLAME);
    D.rails = grid(4, N_TAIL - 1, 2);
    D.mem = grid(MU, MV, 2);
    { const n = NSPK * 28, idx = []; for (let s = 0; s < NSPK; s++) { const b = s * 28; for (let f = 0; f < 4; f++) { const q = b + f * 4; idx.push(q, q + 1, q + 2, q, q + 2, q + 3); } for (let f = 0; f < 4; f++) { const q = b + 16 + f * 3; idx.push(q, q + 1, q + 2); } }
      D.spikes = { pos: new Float32Array(n * 3), nrm: new Float32Array(n * 3), att: new Float32Array(n * 3), idx: new Uint16Array(idx), nv: n, ntri: idx.length / 3, gl: null }; }
    return D;
  }
  /* the normals of a grid from its positions (central differences; n = d/dv x d/du, outward for the tubes) */
  function gridNormals(G, g, flip) {
    const nu = G.nu, nv = G.nvv, per = G.per, P = G.pos, N = G.nrm, b0 = g * per, at = (i, j) => (b0 + Math.max(0, Math.min(nv, j)) * (nu + 1) + Math.max(0, Math.min(nu, i))) * 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const a = at(i + 1, j), b = at(i - 1, j), c = at(i, j + 1), d = at(i, j - 1);
      const ux = P[a] - P[b], uy = P[a + 1] - P[b + 1], uz = P[a + 2] - P[b + 2], vx = P[c] - P[d], vy = P[c + 1] - P[d + 1], vz = P[c + 2] - P[d + 2];
      let nx = vy * uz - vz * uy, ny = vz * ux - vx * uz, nz = vx * uy - vy * ux; const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1, k = (flip ? -1 : 1) / l, o = at(i, j); N[o] = nx * k; N[o + 1] = ny * k; N[o + 2] = nz * k; }
  }

  /* ---- a chain (the neck or the tail) resampled densely: points, frames (t along, rt right, up), radius, and s (along, in armour periods) ---- */
  function chainOf(pts, rad, sub, C, kr) {
    const n0 = pts.length, n = (n0 - 1) * sub + 1; if (!C.p) { C.p = []; C.t = []; C.rt = []; C.up = []; C.r = new Float64Array(n); C.s = new Float64Array(n); C.n = n; }
    const at = i => pts[Math.max(0, Math.min(n0 - 1, i))];
    for (let i = 0; i < n0 - 1; i++) for (let k = 0; k < sub; k++) { const t = k / sub, p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2), t2 = t * t, t3 = t2 * t, j = i * sub + k;
      C.p[j] = [0, 1, 2].map(c => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)); C.r[j] = lerp(rad[i], rad[i + 1], t); }
    C.p[n - 1] = pts[n0 - 1].slice(); C.r[n - 1] = rad[n0 - 1];
    let prev = null;
    for (let j = 0; j < n; j++) { const t = vnrm(vsub(C.p[Math.min(n - 1, j + 1)], C.p[Math.max(0, j - 1)])); let rt = vcross([0, 0, 1], t); const l = vlen(rt);
      if (l < 0.3 && prev) { rt = vsub(prev, vmul(t, vdot(prev, t))); } rt = vnrm(rt); if (prev && vdot(rt, prev) < 0 && l < 0.3) rt = vmul(rt, -1);
      C.t[j] = t; C.rt[j] = rt; C.up[j] = vcross(t, rt); prev = rt; }
    C.s[0] = 0; for (let j = 1; j < n; j++) { const d = vlen(vsub(C.p[j], C.p[j - 1])), rm = (C.r[j] + C.r[j - 1]) / 2; C.s[j] = C.s[j - 1] + d / (rm / RT) / PD; }
    for (let j = 0; j < n; j++) C.r[j] *= kr;   // (the periods follow the rig's radius, as the 2D strip's tile does; the tube is drawn at kr of it)
    return C;
  }
  /* a ring point of a chain at index j (or a sample S), angle ph (0 the top, + toward the right), radius factor f */
  const ringPt = (p, up, rt, r, ph, f) => { const a = r * f * Math.cos(ph) / 1.05, b = r * f * Math.sin(ph); return [p[0] + up[0] * a + rt[0] * b, p[1] + up[1] * a + rt[1] * b, p[2] + up[2] * a + rt[2] * b]; };
  function sampleAt(C, s) { const n = C.n; if (s <= 0) return { p: C.p[0], t: C.t[0], rt: C.rt[0], up: C.up[0], r: C.r[0] }; if (s >= C.s[n - 1]) return { p: C.p[n - 1], t: C.t[n - 1], rt: C.rt[n - 1], up: C.up[n - 1], r: C.r[n - 1] };
    let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (C.s[m] <= s) lo = m; else hi = m; } const u = (s - C.s[lo]) / ((C.s[hi] - C.s[lo]) || 1), L3 = (a, b) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
    return { p: L3(C.p[lo], C.p[hi]), t: vnrm(L3(C.t[lo], C.t[hi])), rt: vnrm(L3(C.rt[lo], C.rt[hi])), up: vnrm(L3(C.up[lo], C.up[hi])), r: lerp(C.r[lo], C.r[hi], u) }; }
  const CN = {}, CT = {};
  const setV = (G, v, p, e, a, m) => { const o = v * 3; G.pos[o] = p[0]; G.pos[o + 1] = p[1]; G.pos[o + 2] = p[2]; G.att[o] = m; G.att[o + 1] = e; G.att[o + 2] = a; };
  function updTubes(D, R) {
    const N = chainOf(R.neckS, R.neckR, NSUB, CN, KR_NECK), Tl = chainOf(R.tailS, R.tailR, TSUB, CT, KR_TAIL);
    // the skin: scales all round, the glowing seams between the lames along the top (the shader, from s)
    for (const [G, C] of [[D.skinN, N], [D.skinT, Tl]]) { for (let j = 0; j < C.n; j++) for (let i = 0; i <= NPH; i++) setV(G, j * (NPH + 1) + i, ringPt(C.p[j], C.up[j], C.rt[j], C.r[j], i / NPH * TAU, 1), C.s[j], i / NPH, M_SC); gridNormals(G, 0, false); }
    // the belly bands (lit plates under the neck and the tail)
    for (const [G, C] of [[D.bellyN, N], [D.bellyT, Tl]]) { for (let j = 0; j < C.n; j++) for (let i = 0; i <= 6; i++) { const ph = Math.PI + lerp(-1.0, 1.0, i / 6), f = i === 0 || i === 6 ? 1.0 : i === 1 || i === 5 ? 1.08 : 1.107; setV(G, j * 7 + i, ringPt(C.p[j], C.up[j], C.rt[j], C.r[j], ph, f), C.s[j], ph / TAU, M_BE); } gridNormals(G, 0, false); }
    // the tail's steel side rails, a glowing seam down their middle
    { const G = D.rails, F = [1.0, 1.07, 1.09, 1.07, 1.0], E = [0, 0.5, 1, 0.5, 0]; for (let g = 0; g < 2; g++) { const c0 = g ? Math.PI / 2 : -Math.PI / 2; for (let j = 0; j < Tl.n; j++) for (let i = 0; i <= 4; i++) setV(G, g * G.per + j * 5 + i, ringPt(Tl.p[j], Tl.up[j], Tl.rt[j], Tl.r[j], c0 + lerp(-0.2, 0.2, i / 4), F[i]), E[i], 1, M_ST); gridNormals(G, g, false); } }
    // the lames: one shingle of scarlet armour each period along the top, thickest at its start (the step faces the body), tucked at its rims; past the chain's end they fold away to nothing
    { const G = D.lames, DS = [0, 0.025, 0.1, 0.3, 0.55, 0.8, 0.93, 0.965], FF = [1.03, 1.3, 1.31, 1.28, 1.25, 1.21, 1.19, 1.06];
      let g = 0; for (const [C, K] of [[N, NLAME], [Tl, TLAME]]) { const sT = C.s[C.n - 1]; for (let k = 0; k < K; k++, g++) { const live = k + 0.5 < sT;
        for (let j = 0; j < LR; j++) { const S = sampleAt(C, Math.min(sT, k + DS[j])); for (let i = 0; i < LC; i++) { const ph = lerp(-0.95, 0.95, i / (LC - 1)), w = i === 0 || i === LC - 1 ? 0 : i === 1 || i === LC - 2 ? 0.85 : 1, f = live ? 1.03 + (FF[j] - 1.03) * w : 0.2;
          const e = j === 0 || j === LR - 1 || i === 0 || i === LC - 1 ? 1 : j === 1 || j === LR - 2 || i === 1 || i === LC - 2 ? 0.5 : 0; setV(G, g * G.per + j * LC + i, ringPt(S.p, S.up, S.rt, S.r, ph, f), e, 1, M_AR); } }
        gridNormals(G, g, false); } } }
    return { N, Tl };
  }
  /* the dorsal spikes: four-sided, a fin-like diamond base, bowed a little forward then swept back to a sharp tip; flat faces, the front and back ridges marked */
  function updSpikes(D, R) {
    const G = D.spikes, P = G.pos, Nn = G.nrm, A = G.att; let v = 0; const put = (p, n, e, a) => { const o = v * 3; P[o] = p[0]; P[o + 1] = p[1]; P[o + 2] = p[2]; Nn[o] = n[0]; Nn[o + 1] = n[1]; Nn[o + 2] = n[2]; A[o] = M_AR; A[o + 1] = e; A[o + 2] = a; v++; };
    const L = R.spk; for (let s = 0; s < NSPK; s++) { const S2 = L[s];
      if (!S2) { for (let k = 0; k < 28; k++) put([0, 0, 0], [0, 0, 1], 0, 1); continue; }
      const r = (S2.neck ? 0.048 : 0.06) * S2.w, d = S2.d, t0 = S2.t || [1, 0, 0], f = vnrm(vsub(t0, vmul(d, vdot(t0, d)))), sd = vcross(d, f), Ls = S2.L;
      let p0 = S2.p; if (S2.neck || S2.tail) { const C = S2.neck ? CN : CT; let bj = 0, bd = 1e9; for (let j = 0; j < C.n; j += 2) { const q = C.p[j], dd = (q[0] - p0[0]) ** 2 + (q[1] - p0[1]) ** 2 + (q[2] - p0[2]) ** 2; if (dd < bd) { bd = dd; bj = j; } }
        const q = C.p[bj], off = vsub(p0, q), rr = C.r[bj] * (S2.frill ? 1.0 : 1.22), dir = S2.frill ? vnrm(vsub(off, vmul(C.t[bj], vdot(off, C.t[bj])))) : C.up[bj]; p0 = vadd(q, vmul(dir, rr)); }   // (on the tube as drawn: the top of the lames, or its side for the frill)
      const base = vsub(p0, vmul(d, 0.05 * Ls));
      const ring = (c, k) => [vadd(c, vmul(f, r * 1.7 * k)), vadd(c, vmul(sd, r * 0.6 * k)), vadd(c, vmul(f, -r * 1.2 * k)), vadd(c, vmul(sd, -r * 0.6 * k))];
      const C0 = ring(base, 1), mid = vadd(vadd(p0, vmul(d, 0.42 * Ls)), vmul(f, 0.05 * Ls)), C1 = ring(mid, 0.5), tip = vadd(p0, vmul(d, Ls)), E = [1, 0.25, 1, 0.25];
      for (let i = 0; i < 4; i++) { const j = (i + 1) & 3, a = C0[i], b = C0[j], c = C1[j], dd = C1[i]; let n = vnrm(vcross(vsub(b, a), vsub(dd, a))); const cen = vmul(vadd(vadd(a, b), vadd(c, dd)), 0.25); if (vdot(n, vsub(cen, mid)) < 0 && vdot(n, vsub(cen, base)) < 0) n = vmul(n, -1);
        put(a, n, E[i], 0.4); put(b, n, E[j], 0.4); put(c, n, E[j], 0.75); put(dd, n, E[i], 0.75); }
      for (let i = 0; i < 4; i++) { const j = (i + 1) & 3, a = C1[i], b = C1[j]; let n = vnrm(vcross(vsub(b, a), vsub(tip, a))); const cen = vmul(vadd(vadd(a, b), tip), 1 / 3); if (vdot(n, vsub(cen, mid)) < 0) n = vmul(n, -1);
        put(a, n, E[i], 0.75); put(b, n, E[j], 0.75); put(tip, n, 1, 1); } }
  }
  /* the wing's upper-surface normal (the plane of the arm) */
  function wingN(Wg) { const n = vcross(vsub(Wg.elbow, Wg.root), vsub(Wg.wrist, Wg.root)), l = vlen(n); return l > 1e-5 ? vmul(n, -Wg.s / l) : [0, 0, 1]; }
  /* the membranes: one grid per wing, across the panels (wrist to the fingers' scalloped trailing edge, then the inner panel from the arm to the hip) and out from the arm to the edge */
  function updMem(D, R, P) {
    const G = D.mem;
    R.wing.forEach((Wg, g) => { const F = Wg.fing, nW = wingN(Wg), TR = [0.27, 0.29, 0.31, 0.28], bil = 0.07 + 0.05 * (P.spread || 0) + 0.14 * (P.billow || 0);
      for (let i = 0; i <= MU; i++) { const uu = i / MU * 4, k = Math.min(3, Math.floor(uu)), t = uu - k, a = k < 3 ? F[k] : F[3], b = k < 3 ? F[k + 1] : Wg.hipA;
        const inner = k < 3 ? Wg.wrist : t < 0.5 ? vadd(Wg.wrist, vmul(vsub(Wg.elbow, Wg.wrist), t * 2)) : vadd(Wg.elbow, vmul(vsub(Wg.root, Wg.elbow), t * 2 - 1));
        const m = vadd(a, vmul(vsub(b, a), t)), outer = vadd(m, vmul(vsub(inner, m), TR[k] * Math.sin(Math.PI * t)));
        for (let j = 0; j <= MV; j++) { const v = j / MV, p = vadd(vadd(inner, vmul(vsub(outer, inner), v)), vmul(nW, bil * Math.sin(Math.PI * v) * Math.sin(Math.PI * t) * (k < 3 ? 1 : 0.6))); setV(G, g * G.per + j * (MU + 1) + i, p, uu, v, M_MEM); } }
      gridNormals(G, g, false); });
  }
  /* the kits: the wing arms, fingers, claws and hubs; the legs */
  function updKits(M, R) {
    const frameB = (a, b, up, w) => { const X = vsub(b, a), Xn = vnrm(X); let Z = vsub(up, vmul(Xn, vdot(up, Xn))); Z = vlen(Z) < 1e-4 ? vnrm(vcross(Xn, [0, 1, 0])) : vnrm(Z); const Y = vcross(Z, Xn); return [X, vmul(Y, w), vmul(Z, w)]; };
    R.wing.forEach((Wg, wi) => { const K = M.wingKit[wi], nW = wingN(Wg), F = Wg.fing;
      let f = frameB(Wg.root, Wg.elbow, nW, 2.75); K.place(0, Wg.root, f[0], f[1], f[2]); f = frameB(Wg.elbow, Wg.wrist, nW, 2.3); K.place(1, Wg.elbow, f[0], f[1], f[2]);
      for (let i = 0; i < 4; i++) { f = frameB(Wg.wrist, F[i], nW, 2.3 - i * 0.17); K.place(2 + i, Wg.wrist, f[0], f[1], f[2]);
        const dd = vnrm(vsub(F[i], Wg.wrist)), cT = vadd(F[i], vmul(vnrm(vadd(dd, vmul(nW, -0.35))), i === 0 ? 0.5 : 0.32)); f = frameB(F[i], cT, nW, i === 0 ? 1.6 : 1.05); K.place(6 + i, F[i], f[0], f[1], f[2]); }
      { const dd = vnrm(vsub(Wg.wrist, Wg.elbow)), th = vadd(Wg.wrist, vmul(vnrm(vadd(dd, [0.4, 0, 0.25])), 0.42)); f = frameB(Wg.wrist, th, nW, 1.3); K.place(10, Wg.wrist, f[0], f[1], f[2]); }
      [[Wg.root, 1.6], [Wg.elbow, 1.35], [Wg.wrist, 1.25]].forEach(([p, r], h) => { const Z = nW, X0 = vcross([0, 1, 0], Z), X = vlen(X0) > 1e-3 ? vnrm(X0) : [1, 0, 0], Y = vcross(Z, X); K.place(11 + h, p, vmul(X, r), vmul(Y, r), vmul(Z, r)); }); });
    R.leg.forEach((Lg, li) => { const K = M.legKit[li], out = [0, Lg.s, 0.6];
      let f = frameB(Lg.hip, Lg.kn, vnrm(out), 1); K.place(0, Lg.hip, f[0], f[1], f[2]); f = frameB(Lg.kn, Lg.ank, [0.6, 0, 0.8], 1); K.place(1, Lg.kn, f[0], f[1], f[2]);
      K.place(2, Lg.kn, [LK, 0, 0], [0, LK, 0], [0, 0, LK]);
      const fd = vnrm(vadd(vsub(Lg.ank, Lg.kn), [0.6, 0, 0])), X = vnrm([fd[0], fd[1], 0]), Y = [-X[1], X[0], 0]; K.place(3, Lg.ank, vmul(X, LK), vmul(Y, LK), [0, 0, LK]); });
  }

  /* ================= the pass ================= */
  const LW = vnrm([-0.5, 0.25, 0.83]), SBW = vnrm([-0.22, -0.42, 0.88]), RIMW = vnrm([0.5, -0.78, 0.36]), UPW = [0, 0, 1], VW = [0, VY, VZ], PXW = [1, 0, 0], PYW = [0, 1, -ZK];
  const RIMC = [1.25, 1.3, 1.75], AMBC = [1.6, 1.42, 1.36], OUTC = [0.06, 0.006, 0.012], GLCAP = 1600;
  let NOGL = false, GLMS = 0, GLN = 0, LASTN = 0, LASTTRI = 0, LASTCALLS = 0, LASTUP = 0; const GLI = [], GLJ = [];
  function on() {
    if (NOGL || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__NIDHOGG_GL)) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Nidhogg: meshes', e); return false; } }
    return true;
  }
  /* a frame's columns: body-local to world (heading, pitch, bank), from 20k6f's frameW */
  const colsOf = Wf => [Wf([1, 0, 0]), Wf([0, 1, 0]), Wf([0, 0, 1])];
  const mul = (C, v) => [C[0][0] * v[0] + C[1][0] * v[1] + C[2][0] * v[2], C[0][1] * v[0] + C[1][1] * v[1] + C[2][1] * v[2], C[0][2] * v[0] + C[1][2] * v[1] + C[2][2] * v[2]];
  /* draw the body (and the spin's ghosts) for rig R in view V: one GLM pass, one image. Returns false if nothing was drawn */
  function draw(c, R, V, P, o, Wf, ghosts, frameW) {
    LASTR = R; const t0 = nowMs(), D = MESH.dyn, tr = cl(P.trace || 0), al0 = P.alpha == null ? 1 : P.alpha, low = o.low != null ? o.low : lowFx();
    // the moving geometry
    updTubes(D, R); updSpikes(D, R); updMem(D, R, P); updKits(MESH, R);
    for (const m of [D.skinN, D.skinT, D.bellyN, D.bellyT, D.lames, D.rails, D.spikes, D.mem, MESH.wingKit[0].mesh, MESH.wingKit[1].mesh, MESH.legKit[0].mesh, MESH.legKit[1].mesh]) { if (m.gl) GLM.touchGeo(m); }
    LASTUP = nowMs() - t0;
    const glowB = cl(0.38 + 0.62 * Math.max(P.glow || 0, tr * 0.8)), throatG = cl(0.3 + Math.max(P.throat || 0, (P.glow || 0) * 0.9, tr * 0.7)), ventG = cl(0.5 + Math.max(P.vents || 0, P.glow || 0));
    const hk = R.HS || HEADK, U = vcross(R.headF, R.headL), JU = vcross(R.jawF, R.headL), td = R.tipDir, tL = vnrm([-td[1], td[0], 0]), tU = vcross(td, tL), tk = TK * (1 + (R.breath || 0) * 0.6);
    // the pieces: [mesh, origin, axes (body-local, scaled), glow, kind, ghosted, no outline]
    const parts = [
      [MESH.torso, R.torso, [[tk, 0, 0], [0, tk * TORSO_Y, 0], [0, 0, tk]], Math.max(glowB, ventG * 0.9), 0, true],
      [MESH.head, R.head, [vmul(R.headF, hk), vmul(R.headL, hk), vmul(U, hk)], cl(0.4 + (P.glow || 0) * 0.6 + (P.core || 0) * 0.4 + tr * 0.5), 0, true],
      [MESH.jaw, R.hinge, [vmul(R.jawF, hk), vmul(R.headL, hk), vmul(JU, hk)], cl(0.2 + (P.jaw || 0) * 0.6 + (P.core || 0) + (P.throat || 0) * 0.5), 0, false],
      [MESH.tip, R.tail[R.tail.length - 1], [vmul(td, 2.0), vmul(tL, 2.0), vmul(tU, 2.0)], cl(0.5 + (P.glow || 0) * 0.5 + tr * 0.5), 0, false],
      [D.skinN, null, null, glowB, 6, true], [D.skinT, null, null, glowB, 6, true], [D.bellyN, null, null, throatG * 0.9, 6, false], [D.bellyT, null, null, glowB * 0.8, 6, false], [D.lames, null, null, glowB, 7, true], [D.rails, null, null, glowB * 0.8, 7, false],
      [D.spikes, null, null, glowB, 7, false], [D.mem, null, null, cl(0.15 + 0.6 * (P.glow || 0) + 0.3 * (P.vents || 0) + 0.4 * tr), 7, true, true],
      [MESH.wingKit[0].mesh, null, null, glowB, 7, false], [MESH.wingKit[1].mesh, null, null, glowB, 7, false], [MESH.legKit[0].mesh, null, null, glowB, 7, false], [MESH.legKit[1].mesh, null, null, glowB, 7, false]];
    // the frames: the body's, then each ghost's (body only, translucent)
    const frames = [{ C: colsOf(Wf), al: al0, main: true }]; if (ghosts && frameW) for (const g of ghosts) frames.push({ C: colsOf(frameW(g.a, P)), al: al0 * g.al, main: false });
    // the screen box: the rig's points with a margin each
    const k = V.k * V.T, X0 = V.toS([0, 0, 0]); let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    const pts = [[R.torso, 1.25 * TK], [R.head, 0.75 * hk], [R.hinge, 0.6 * hk], [R.tail[R.tail.length - 1], 1.4]];
    for (let i = 0; i < R.neckS.length; i += 2) pts.push([R.neckS[i], R.neckR[i] * 1.4 + 0.6]); for (let i = 0; i < R.tailS.length; i += 2) pts.push([R.tailS[i], R.tailR[i] * 1.4 + 0.55]);
    for (const Wg of R.wing) { pts.push([Wg.root, 0.4], [Wg.elbow, 0.4], [Wg.wrist, 0.6], [Wg.hipA, 0.3]); for (const f of Wg.fing) pts.push([f, 0.6]); } for (const Lg of R.leg) pts.push([Lg.kn, 0.4], [Lg.ank, 0.6]);
    for (const F of frames) for (const [p, r] of pts) { const w = mul(F.C, p), sx = X0[0] + w[0] * k, sy = X0[1] + (w[1] - w[2] * ZK) * k, rr = r * k; if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !(typeof window !== 'undefined' && window.__NIDHOGG_GLHQ), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.4 : 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sc = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sc)); H = Math.max(2, Math.ceil(H * sc));
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = { px: PXW, py: PYW, pd: VW, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: VW, lk: LW, ls: SBW, lr: RIMW, up: UPW, low, rim: RIMC, amb: AMBC, t: nowMs() / 1000,
      outline: Math.max(1, 1.35 * (W / bw) * (1 + 0.7 * tr) * (o.outlineK || 1)), outlineCol: tr > 0.01 ? [lerp(OUTC[0], 1.0, tr * 0.85), lerp(OUTC[1], 0.4, tr * 0.85), lerp(OUTC[2], 0.1, tr * 0.85)] : OUTC };
    let n = 0; const items = GLJ; items.length = 0;
    for (const F of frames) { if (!(F.al > 0.004)) continue;
      for (const pt of parts) { const [mesh, org, ax, glow, kind, ghostOK, noOut] = pt; if (!F.main && !ghostOK) continue;
        const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
        const A0 = ax ? mul(F.C, ax[0]) : F.C[0], A1 = ax ? mul(F.C, ax[1]) : F.C[1], A2 = ax ? mul(F.C, ax[2]) : F.C[2], Tt = org ? mul(F.C, org) : [0, 0, 0];
        for (let i = 0; i < 3; i++) { g.R0[i] = A0[i]; g.R1[i] = A1[i]; g.R2[i] = A2[i]; g.T[i] = Tt[i]; }
        g.mesh = mesh; g.alpha = F.al; g.glow = glow; g.glow2 = F.main ? tr : 0; g.spill = 0; g.kind = kind; g.wear = 0.7; g.fx = 0; g.outline = noOut || !F.main ? false : undefined; g.d = Tt[1] * VY + Tt[2] * VZ; items.push(g); } }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t1 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); GLMS = GLMS * 0.9 + (nowMs() - t1) * 0.1; GLN++; LASTN = items.length;
    const st0 = GLM.stats; LASTTRI = st0.tris; LASTCALLS = st0.calls;
    // the warm accents' soft halos: the chest ring and the belly seams (the eyes, hubs and vents have theirs in 20k6f's lights)
    if (GLM.halos && !low) { const HL = [], A = cl(0.45 + 0.55 * glowB) * al0, tw = (o.t != null ? o.t : nowMs() / 1000);
      for (const sg of [-1, 1]) for (const xx of [-0.6, -0.15, 0.3, 0.66]) { const p = vadd(R.torso, [xx * tk, sg * 0.36 * tk * TORSO_Y, -0.22 * tk]), s2 = V.toS(p), fl = 0.85 + 0.15 * Math.sin(tw * 3.1 + xx * 7 + sg); HL.push({ x: s2[0], y: s2[1], r: 0.36 * k, a: 0.09 * A * fl, col: '#FF6A1A' }); }
      GLM.halos(c, HL); }
    // the trace: soft fire halos along the silhouette (the neck, the tail, the wing edges)
    if (tr > 0.02 && GLM.halos && !low) { const HL = [], add = (p, r, a) => { const s2 = V.toS(p); HL.push({ x: s2[0], y: s2[1], r: r * k * 0.7, a: a * 0.45 * tr * al0, col: '#FF6A2A' }); };
      for (let i = 0; i < R.neckS.length; i += 3) add(R.neckS[i], 0.9, 0.22); for (let i = 0; i < R.tailS.length; i += 4) add(R.tailS[i], 0.8, 0.18); for (const Wg of R.wing) for (const f of Wg.fing) add(f, 0.7, 0.2); add(R.torso, 2.2, 0.16);
      GLM.halos(c, HL); }
    return true;
  }
  /* (H's checks) the last drawn pose's extents, body-local (tiles at scale 1): each part's farthest point from the body's origin, and how near anything but the torso comes to the seat */
  let LASTR = null;
  function extent() { if (!MESH || !LASTR) return null; const R = LASTR, out = {}, seat = R.seat; let seatMin = 1e9, seatBy = '';
    const scan = (name, pos, n, f) => { let m = 0; for (let i = 0; i < n * 3; i += 3) { const p = f ? f(pos[i], pos[i + 1], pos[i + 2]) : [pos[i], pos[i + 1], pos[i + 2]], r = Math.hypot(p[0], p[1], p[2]); if (r > m) m = r; const ds = Math.hypot(p[0] - seat[0], p[1] - seat[1], p[2] - seat[2]); if (ds < seatMin) { seatMin = ds; seatBy = name; } } out[name] = +(m * VIS).toFixed(2); };
    const rig = (o, A) => (x, y, z) => [o[0] + A[0][0] * x + A[1][0] * y + A[2][0] * z, o[1] + A[0][1] * x + A[1][1] * y + A[2][1] * z, o[2] + A[0][2] * x + A[1][2] * y + A[2][2] * z];
    const hk = R.HS || HEADK, U = vcross(R.headF, R.headL), JU = vcross(R.jawF, R.headL), td = R.tipDir, tL = vnrm([-td[1], td[0], 0]);
    scan('head', MESH.head.pos, MESH.head.nv, rig(R.head, [vmul(R.headF, hk), vmul(R.headL, hk), vmul(U, hk)])); scan('jaw', MESH.jaw.pos, MESH.jaw.nv, rig(R.hinge, [vmul(R.jawF, hk), vmul(R.headL, hk), vmul(JU, hk)]));
    scan('tip', MESH.tip.pos, MESH.tip.nv, rig(R.tail[R.tail.length - 1], [vmul(td, 2), vmul(tL, 2), vmul(vcross(td, tL), 2)]));
    const D = MESH.dyn; for (const k of ['skinN', 'skinT', 'lames', 'spikes', 'mem']) scan(k, D[k].pos, D[k].nv); scan('wingL', MESH.wingKit[0].mesh.pos, MESH.wingKit[0].mesh.nv); scan('wingR', MESH.wingKit[1].mesh.pos, MESH.wingKit[1].mesh.nv); scan('legs', MESH.legKit[0].mesh.pos, MESH.legKit[0].mesh.nv);
    // the wings against the head (a sphere round it) and the tail (its tube): the nearest gap, tiles (negative: through it)
    let wHead = 1e9, wTail = 1e9; const hc = vadd(R.head, vmul(R.headF, 0.3 * hk)), hr = 0.42 * hk;
    for (const W of [MESH.wingKit[0].mesh, MESH.wingKit[1].mesh, D.mem]) { const P0 = W.pos; for (let i = 0; i < W.nv * 3; i += 9) { const x = P0[i], y = P0[i + 1], z = P0[i + 2];
      wHead = Math.min(wHead, Math.hypot(x - hc[0], y - hc[1], z - hc[2]) - hr);
      for (let j = 6; j < CT.n; j += 3) { const q = CT.p[j]; wTail = Math.min(wTail, Math.hypot(x - q[0], y - q[1], z - q[2]) - CT.r[j] * 1.3); } } }
    let mx = 0; for (const k in out) mx = Math.max(mx, out[k]); return { max: mx, parts: out, seatClear: +(seatMin * VIS).toFixed(3), seatBy, wingHead: +(wHead * VIS).toFixed(2), wingTail: +(wTail * VIS).toFixed(2) }; }
  const COUNTS = () => { if (!MESH) return null; const o = {}; for (const kk of ['torso', 'head', 'jaw', 'tip']) o[kk] = MESH[kk].ntri; for (const kk in MESH.dyn) o[kk] = MESH.dyn[kk].ntri; o.wingKit = MESH.wingKit[0].mesh.ntri; o.legKit = MESH.legKit[0].mesh.ntri; let s = 0; for (const kk in o) s += (kk === 'wingKit' || kk === 'legKit' ? 2 : 1) * o[kk]; o.total = s; o.items = 16; return o; };
  return { on, draw, COUNTS, get stats() { return { sN: CN.s ? CN.s[CN.n - 1] : 0, sT: CT.s ? CT.s[CT.n - 1] : 0, ms: GLMS, n: GLN, items: LASTN, tris: LASTTRI, calls: LASTCALLS, upMs: LASTUP, meshMs: MESH_MS, gl2: typeof GLM !== 'undefined' ? GLM.stats.gl2 : null }; }, get NOGL() { return NOGL; }, set NOGL(v) { NOGL = v; },
    __dbg: { get MESH() { return MESH; }, bodySD, bodyR, chainOf, extent } };
})();
