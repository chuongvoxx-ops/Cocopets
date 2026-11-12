/* ---------- Ice, the 11th Ultimate: Fenrir, the model (worker M) ----------
   One persistent set of rigid parts and one rig for both forms: the heavy ice motorcycle (xf 0: two huge wide tyres
   on the ground, the wolf's head as the front fairing, the four legs folded into braces round the frame, the tail
   curled over the rear wheel as a great spiked cowl, the two long cannons along the sides) and the armoured
   crystalline wolf (xf 1: standing on four clawed legs, the two tyres lifted into the chest and the pelvis on their
   carrier arms, the head forward on its neck, the tail out behind, the cannons over the shoulders). The transformation
   moves the same parts on real pivots (see XF_STAGES and rig).
   Drawn live on the GPU with GLM (20k5uz), as Susano O is: real meshes, one material per triangle, physically based
   shading (polished silver armour, dark machinery, rough rubber, faceted translucent ice, cyan energy), one composite
   drawImage into the game canvas. Without WebGL (or on a software rasteriser) a simple low-detail picture of the same
   rig is drawn instead, so the Ultimate still plays.
   Frame: x forward, y to the right, z up; the origin on the floor under the middle of the frame. Units: tiles.
   FENRIR_MODEL is the whole interface; see docs/ICE-FENRIR-BRIEF.md (Notes, M). */
const FENRIR_MODEL = (() => {
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const ease = u => u * u * (3 - 2 * u);
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;   // (the game camera: orthographic, about 46 degrees above the floor)
  const VIS = 1.06;   // the model is drawn this much of its rig's units, so the motorcycle is as long as the Sports Car (3.24 tiles); anchors include it

  /* ================= vectors and rotations (a rotation: its three columns) ================= */
  const hyp = (a, b) => Math.sqrt(a * a + b * b), hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => hyp3(a[0], a[1], a[2]);
  const vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vlerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const M3 = (x, y, z) => ({ x, y, z }), I3 = () => M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const mT = A => M3([A.x[0], A.y[0], A.z[0]], [A.x[1], A.y[1], A.z[1]], [A.x[2], A.y[2], A.z[2]]);
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };   // (+a: x toward -z, the nose down; a wheel rolling forward)
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  function rotAxis(n, a) { n = vnrm(n); const c = Math.cos(a), s = Math.sin(a), t = 1 - c, [x, y, z] = n;
    return M3([t * x * x + c, t * x * y + s * z, t * x * z - s * y], [t * x * y - s * z, t * y * y + c, t * y * z + s * x], [t * x * z + s * y, t * y * z - s * x, t * z * z + c]); }
  /* an orthonormal frame with x along xd and z as near zh as it can be */
  function frameXZ(xd, zh) { const x = vnrm(xd); let y = vcross(zh, x); if (vlen(y) < 1e-6) y = vcross([0, 0, 1], x); if (vlen(y) < 1e-6) y = [0, 1, 0]; y = vnrm(y); return M3(x, y, vcross(x, y)); }
  /* a slerp-like blend of two rotations (about the axis of their relative rotation) */
  function mslerp(A, B, u) { if (u <= 0) return A; if (u >= 1) return B; const R = mm(B, mT(A)), tr = R.x[0] + R.y[1] + R.z[2], ang = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
    if (ang < 1e-5) return B; let ax = [R.y[2] - R.z[1], R.z[0] - R.x[2], R.x[1] - R.y[0]]; if (vlen(ax) < 1e-5) { ax = [Math.sqrt(Math.max(0, (R.x[0] + 1) / 2)), Math.sqrt(Math.max(0, (R.y[1] + 1) / 2)), Math.sqrt(Math.max(0, (R.z[2] + 1) / 2))]; if (R.x[1] < 0) ax[1] = -ax[1]; if (R.x[2] < 0) ax[2] = -ax[2]; }
    return mm(rotAxis(ax, ang * u), A); }
  /* two-bone reach from S toward T (bones a, b), the middle joint toward `pole` */
  function ik2(S, T, a, b, pole) {
    const d0 = vsub(T, S), L = vlen(d0) || 1e-6, d = Math.max(Math.abs(a - b) + 1e-3, Math.min(a + b - 1e-4, L)), e = vmul(d0, 1 / L);
    let p = vsub(pole, vmul(e, vdot(pole, e))); if (vlen(p) < 1e-6) p = Math.abs(e[2]) < 0.9 ? vcross(e, [0, 0, 1]) : vcross(e, [1, 0, 0]); p = vnrm(p);
    const ca = (a * a + d * d - b * b) / (2 * a * d), sa = Math.sqrt(Math.max(0, 1 - ca * ca));
    return { E: vadd(S, vadd(vmul(e, a * ca), vmul(p, a * sa))), W: vadd(S, vmul(e, d)), short: Math.max(0, L - d) };
  }
  const dirXZ = a => [Math.cos(a), 0, Math.sin(a)];   // a direction in the side plane: the angle from forward, toward up

  /* ================= materials (GLM's ids) ================= */
  const M_GUN = 1, M_SILV = 2, M_DARK = 7, M_STEEL = 11, M_ICE = 14, M_RUB = 15, M_CYAN = 16, M_LEATH = 17, M_MECH = 18, M_ARM = 19, M_ENG = 20, M_HEAT = 21;

  /* ================= the rig's measures ================= */
  const FX = 1.04;                                  // the frame's plating is laid out short and stretched this much along its length
  const WR = 0.5, WW = 0.21, WS = 1.16;            // a tyre: radius, half width (the mesh's own); the wheels and their arches are drawn WS times that
  const CZ0 = 0.7, LIFT = 0.7;                   // the frame's middle above the floor (motorcycle); how far the wolf stands above that
  const LARM = 0.608;                              // a wheel's carrier arm (pivot to hub)
  const PIVF = [0.5, 0, 0.34], PIVR = [-0.46, 0, 0.3];          // the carrier arms' pivots on the frame (its own frame)
  const AF0 = Math.atan2(-0.46, 0.4), AF1 = Math.atan2(-0.55, 0.26);          // the front arm's angle: motorcycle (the hub at 1.22, -0.12), wolf (1.02, -0.24)
  const AR0 = Math.atan2(-0.42, -0.44), AR1 = Math.atan2(-0.54, -0.28);         // the rear arm's: motorcycle (-1.22, -0.12), wolf (-1.0, -0.29)
  const LU = 0.7, LL = 0.7, LH = 0.32, LPAW = 0.3, LS = 0.93;   // a leg: upper, lower, paw (the meshes' own lengths); the legs are drawn LS times that
  const SHO = s => [0.56, s * 0.56, 0.22], HIPJ = s => [-0.58, s * 0.56, 0.2];   // the shoulders and hips on the frame
  const HS = 1.35, LNECK = 0.4, NECK0 = [0.88, 0, 0.6];        // the neck: two links from the frame's front top
  const HEADB = [0.86, 0, 0.8], HEADW = [1.62, 0, 0.34];          // the head's joint, frame coordinates: motorcycle (the fairing), wolf
  const SEAT = [-0.15, 0, 0.57];                   // the saddle's top
  const MANEF = [0.5, 0, 0.62], MANER = [-0.58, 0, 0.58], TAIL0 = [-0.9, 0, 0.68];
  const NTAIL = 6, LTAIL = 0.3;
  const TAILB = [64, 46, 26, 6, -16, -38].map(d => d * DEG), TAILW = [-10, -24, -32, -30, -16, 0].map(d => d * DEG);   // each link's angle above straight back
  const CBOSS = s => [0.12, s * 0.3, 0.32], LCM = 0.62;            // a cannon's mount: its boss on the frame, the arm's length
  const CDB = s => vnrm([-0.3, s * 0.82, -0.62]), CDW = s => vnrm([0.72, s * 0.08, 0.7]), CDM = s => vnrm([0.1, s * 1, 0.1]);   // the arm's direction: motorcycle, wolf, the way between (outboard)
  const LBAR = 1.95;                                // a cannon's barrel, trunnion to muzzle

  /* ================= the meshes (each in its own frame; built once, on first use) ================= */
  let MESH = null, MESH_MS = 0;
  function buildMeshes() {
    const DQ = lowFx() ? 0.5 : 0.75, nb = () => GLM.builder(DQ), out = {};
    // a plate cut from a side profile (points in the x-z plane), 2 hw thick across y, bevelled
    const plate = (B, pts, yc, hw, m, b) => { B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); B.prism(pts, -(yc + hw), -(yc - hw), m, { b: b == null ? 0.012 : b }); B.pop(); };
    // an angular hull lofted through cross-sections [x, half width, top z, bottom z, chamfer]
    const loft = (B, secs, m, o) => { const n = secs.length - 1; B.surf((u, v) => { const f = Math.min(n - 1e-6, u * n), i = Math.floor(f), w = f - i, a = secs[i], b = secs[i + 1], x = lerp(a[0], b[0], w), hw = lerp(a[1], b[1], w), zt = lerp(a[2], b[2], w), zb = lerp(a[3], b[3], w), c = Math.min(lerp(a[4], b[4], w), hw * 0.9, (zt - zb) * 0.45);
      const ring = [[hw - c, zt], [hw, zt - c], [hw, zb + c], [hw - c, zb], [-(hw - c), zb], [-hw, zb + c], [-hw, zt - c], [-(hw - c), zt], [hw - c, zt]], g = Math.min(7.9999, v * 8), j = Math.floor(g), t = g - j; return [x, lerp(ring[j][0], ring[j + 1][0], t), lerp(ring[j][1], ring[j + 1][1], t)]; }, n * ((o && o.sub) || 1), 8, () => m, { flip: true, e: (u, v) => { const g = (v * 8) % 2; return g > 0.9 && g < 1.1 ? 0 : 0.35; } }); };
    const disc = (B, c, ax, r, h, m, seg) => B.tube(vsub(c, vmul(ax, h)), vadd(c, vmul(ax, h)), r, r, m, { seg: seg || 16, cap0: 'flat', cap1: 'flat' });
    const Y = [0, 1, 0];
    // a blade of ice: a broad faceted plate (a diamond section, its flat faces toward `up`), root a, along d for L, w wide, swept by bend
    const blade = (B, a, d, L, w, up, bend, seed) => B.crystal(a, vadd(a, vmul(vnrm(d), L)), w, M_ICE, { n: 4, rot: 0, thin: 0.24, belly: 0.36, base: 0.55, jit: 0.1, bend: bend || 0, seed: seed || 0, up });
    // ---- a wheel (origin: the hub; the axle along y): a huge wide tyre with deep block tread, a dished silver rim, big drilled
    //      brake discs, cyan-lit hub rings, five forged spokes a side ----
    { const B = nb();
      B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0, 0]);
      B.lathe([[-WW, 0.3, M_RUB], [-WW, 0.42, M_RUB], [-WW * 0.86, 0.468, M_RUB], [-WW * 0.5, 0.48, M_RUB], [WW * 0.5, 0.48, M_RUB], [WW * 0.86, 0.468, M_RUB], [WW, 0.42, M_RUB], [WW, 0.3, M_RUB]], M_RUB, { seg: 36 });
      B.lathe([[-WW * 0.97, 0.31, M_ARM], [-WW * 0.82, 0.275, M_ARM], [-0.07, 0.22, M_ARM], [0.07, 0.22, M_ARM], [WW * 0.82, 0.275, M_ARM], [WW * 0.97, 0.31, M_ARM]], M_ARM, { seg: 30 });
      for (const s of [-1, 1]) { B.torX([s * WW * 0.99, 0, 0], 0.318, 0.022, M_ENG, { seg: 32, rseg: 5 }); B.torX([s * WW * 0.99, 0, 0], 0.355, 0.012, M_ARM, { seg: 32, rseg: 4 });
        B.tube([s * 0.125, 0, 0], [s * 0.148, 0, 0], 0.255, 0.255, M_STEEL, { seg: 28, cap0: 'flat', cap1: 'flat' }); B.torX([s * 0.15, 0, 0], 0.2, 0.012, M_ENG, { seg: 24, rseg: 4 });
        for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; B.tube([s * 0.146, Math.cos(a) * 0.228, Math.sin(a) * 0.228], [s * 0.152, Math.cos(a) * 0.228, Math.sin(a) * 0.228], 0.016, 0.016, M_DARK, { seg: 5, cap0: 'flat', cap1: 'flat' }); }   // (the disc's drilled holes)
        B.tube([s * 0.1, 0, 0], [s * (WW + 0.02), 0, 0], 0.1, 0.08, M_GUN, { seg: 16, cap0: 'flat', cap1: 'flat' }); B.tube([s * (WW + 0.016), 0, 0], [s * (WW + 0.04), 0, 0], 0.055, 0.055, M_ENG, { seg: 12, cap0: 'flat', cap1: 'flat' });
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; B.sph([s * (WW + 0.02), Math.cos(a) * 0.078, Math.sin(a) * 0.078], 0.012, M_STEEL, 5); }
        for (let i = 0; i < 5; i++) { const a = (i + (s > 0 ? 0 : 0.5)) / 5 * TAU, c = Math.cos(a), sn = Math.sin(a); B.tube([s * 0.15, c * 0.09, sn * 0.09], [s * 0.18, c * 0.29, sn * 0.29], 0.036, 0.026, M_ARM, { seg: 6 }); } }
      B.pop();
      const NT = 20; for (let i = 0; i < NT; i++) for (let r = -1; r <= 1; r++) { const a = (i + (r ? 0.5 : 0)) / NT * TAU, c = Math.cos(a), sn = Math.sin(a), rr = r ? 0.48 : 0.492;
        B.push([c, 0, sn], [0, 1, 0], [-sn, 0, c], [c * rr, r * 0.122, sn * rr]); B.box([0, 0, 0], [0.03, 0.052, 0.056], 0, M_RUB); B.pop(); }
      for (let i = 0; i < NT; i++) for (const s of [-1, 1]) { const a = (i + 0.25) / NT * TAU, c = Math.cos(a), sn = Math.sin(a); B.push([c, 0, sn], [0, 1, 0], [-sn, 0, c], [c * 0.445, s * 0.186, sn * 0.445]); B.box([0, 0, 0], [0.035, 0.012, 0.04], 0, M_RUB); B.pop(); }   // (the shoulder lugs)
      // polish: raised lettering-style ribs round each sidewall, turbine vanes between the spokes, a bolt circle on the rim
      for (const s of [-1, 1]) { for (let i = 0; i < 28; i++) { if (i % 7 > 4) continue; const a = i / 28 * TAU, c = Math.cos(a), sn = Math.sin(a); B.push([c, 0, sn], [0, 1, 0], [-sn, 0, c], [c * 0.385, s * (WW + 0.002), sn * 0.385]); B.box([0, 0, 0], [0.022, 0.006, 0.012], 0, M_RUB); B.pop(); }
        for (let i = 0; i < 10; i++) { const a = (i + 0.5) / 10 * TAU, c = Math.cos(a), sn = Math.sin(a); B.push([c, 0, sn], [0, 1, 0], [-sn, 0, c], [c * 0.2, s * 0.165, sn * 0.2]); B.box([0, 0, 0], [0.07, 0.004, 0.012], 0, M_GUN); B.pop(); }
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; B.sph([Math.cos(a) * 0.3, s * (WW * 0.9), Math.sin(a) * 0.3], 0.009, M_STEEL, 5); } }
      out.wheel = B.done(); }
    // ---- the frame (origin: its middle): the engine with its cyan reactor discs, the spine, the black saddle, the tank armour,
    //      the pivots' bosses, pipes, belly ice ----
    { const B = nb();
      B.push([FX, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0]);
      B.box([0, 0, -0.02], [0.18, 0.17, 0.2], 0.05, M_MECH);
      for (let i = 0; i < 4; i++) B.box([-0.12 + i * 0.08, 0, 0.19], [0.022, 0.15, 0.03], 0.008, M_GUN);   // (the engine's cooling fins)
      B.tube([-0.58, 0, 0.44], [0.6, 0, 0.46], 0.055, 0.055, M_GUN, { seg: 10 });                             // (the spine)
      B.tube([-0.5, 0, 0.42], [-0.16, 0, 0.12], 0.04, 0.04, M_GUN, { seg: 8 }); B.tube([0.55, 0, 0.42], [0.16, 0, 0.14], 0.04, 0.04, M_GUN, { seg: 8 });
      // the saddle: a low black seat with a raised back
      loft(B, [[-0.5, 0.1, 0.62, 0.48, 0.03], [-0.42, 0.15, 0.61, 0.47, 0.04], [-0.28, 0.17, 0.555, 0.47, 0.04], [-0.05, 0.16, 0.55, 0.47, 0.04], [0.12, 0.11, 0.575, 0.47, 0.035], [0.2, 0.05, 0.58, 0.48, 0.02]], M_LEATH, { sub: 2 });
      B.box([-0.15, 0, 0.47], [0.36, 0.175, 0.018], 0.01, M_ARM);
      // the tank armour ahead of it, the side armour with cyan slits
      loft(B, [[0.16, 0.1, 0.6, 0.46, 0.04], [0.3, 0.15, 0.63, 0.44, 0.05], [0.48, 0.13, 0.6, 0.42, 0.05], [0.6, 0.07, 0.54, 0.42, 0.03]], M_ARM, { sub: 2 });
      for (const s of [-1, 1]) { plate(B, [[-0.34, 0.3], [0.3, 0.34], [0.38, 0.2], [0.24, 0.02], [-0.2, -0.02], [-0.4, 0.14]], s * 0.2, 0.02, M_ARM, 0.012);
        for (let i = 0; i < 3; i++) plate(B, [[-0.2 + i * 0.09, 0.26], [-0.15 + i * 0.09, 0.26], [-0.19 + i * 0.09, 0.14], [-0.24 + i * 0.09, 0.14]], s * 0.222, 0.004, M_ENG, 0);
        // pipes and cables along the flanks
        B.tube([0.16, s * 0.15, -0.14], [0.5, s * 0.17, 0.06], 0.028, 0.028, M_STEEL, { seg: 6 }); B.tube([-0.16, s * 0.15, -0.14], [-0.46, s * 0.17, 0.02], 0.028, 0.028, M_STEEL, { seg: 6 });
        B.tube([-0.3, s * 0.1, 0.36], [0.3, s * 0.1, 0.38], 0.02, 0.02, M_DARK, { seg: 5 });
        // belly ice: shards under the engine, swept back
        B.crystal([0.12, s * 0.1, -0.2], [-0.34, s * 0.16, -0.3], 0.07, M_ICE, { n: 5, thin: 0.77, seed: 1 + s }); B.crystal([0.2, s * 0.06, -0.2], [0.5, s * 0.1, -0.3], 0.05, M_ICE, { n: 4, thin: 0.6, seed: 3 + s }); }
      B.crystal([0, 0, -0.2], [-0.42, 0, -0.34], 0.08, M_ICE, { n: 5, thin: 0.72, seed: 7 });
      // the ribcage: five silver ribs a side from the spine down round the flanks; the spine's lames fore and aft of the saddle
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const x0 = -0.3 + i * 0.15; B.surf((u, v) => { const a = u * 1.75, y = s * (0.05 + 0.25 * Math.sin(a)), z = 0.4 - 0.5 * (1 - Math.cos(a)) * 0.9; return [x0 + (v - 0.5) * 0.085 - 0.06 * u, y, z]; }, 6, 1, () => M_ARM, { flip: s > 0, e: (u, v) => 0.6 });
        B.sph([x0 - 0.03, s * 0.29, 0.03], 0.012, M_STEEL, 5); }
      for (let i = 0; i < 3; i++) { loft(B, [[0.2 + i * 0.13, 0.085, 0.67 - i * 0.012, 0.6, 0.02], [0.34 + i * 0.13, 0.07, 0.655 - i * 0.012, 0.59, 0.02]], M_ARM, { sub: 1 }); loft(B, [[-0.72 + i * 0.1, 0.1, 0.58 + i * 0.012, 0.5, 0.02], [-0.6 + i * 0.1, 0.085, 0.6 + i * 0.012, 0.5, 0.02]], M_ARM, { sub: 1 }); }
      // twin exhausts each side, swept back and up, dark-throated; a cyan vent strip along the tank
      for (const s of [-1, 1]) { for (let i = 0; i < 2; i++) { const z0 = -0.14 + i * 0.09; B.tube([-0.1, s * 0.2, z0], [-0.5, s * 0.25, z0 + 0.1], 0.036, 0.04, M_STEEL, { seg: 8 }); B.tube([-0.5, s * 0.25, z0 + 0.1], [-0.66, s * 0.27, z0 + 0.18], 0.04, 0.05, M_HEAT, { seg: 8, cap1: 'flat', capM: M_DARK }); B.torX([-0.5, s * 0.25, z0 + 0.1], 0.042, 0.01, M_ENG, { seg: 8, rseg: 4 }); }
        B.box([0.36, s * 0.142, 0.54], [0.1, 0.004, 0.012], 0, M_ENG); }
      B.pop();
      for (const s of [-1, 1]) { disc(B, [0, s * 0.18, -0.02], Y, 0.15, 0.025, M_ARM, 22); disc(B, [0, s * 0.2, -0.02], Y, 0.085, 0.022, M_ENG, 16); B.torY([0, s * 0.205, -0.02], 0.118, 0.016, M_STEEL, { seg: 20, rseg: 5 });
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; B.sph([Math.cos(a) * 0.135, s * 0.207, -0.02 + Math.sin(a) * 0.135], 0.013, M_STEEL, 6); } }
      // the bosses: shoulders, hips, the wheel arms' pivots, the cannon mounts (steel), each on a strut from the spine
      for (const s of [-1, 1]) for (const [p, r, yy] of [[SHO(1), 0.1, 0.44], [HIPJ(1), 0.1, 0.44], [PIVF, 0.085, 0.2], [PIVR, 0.085, 0.2], [CBOSS(1), 0.07, 0.25]]) { disc(B, [p[0], s * yy, p[2]], Y, r, 0.06, M_STEEL, 14); B.tube([p[0], s * (yy - 0.04), p[2]], [p[0] * 0.8, s * 0.1, 0.4], 0.05, 0.055, M_MECH, { seg: 7 }); }
      // the waist: twin pistons and a cable each side between the chest and the pelvis
      for (const s of [-1, 1]) { B.tube([-0.66, s * 0.16, 0.2], [0.7, s * 0.16, 0.24], 0.026, 0.026, M_STEEL, { seg: 6 }); B.tube([-0.66, s * 0.16, 0.2], [-0.1, s * 0.16, 0.22], 0.04, 0.04, M_GUN, { seg: 7 }); B.tube([-0.7, s * 0.12, 0.02], [0.72, s * 0.12, 0.06], 0.02, 0.02, M_DARK, { seg: 5 }); }
      out.chassis = B.done(); }
    // ---- a wheel's arch (origin: the hub; centred straight up, its prow forward): armour over the top of the tyre only, never
    //      across the wheel's face. Four stepped silver lames from the prow (a deep shell curving down ahead of the tyre: the
    //      wolf's chest; turned about over the rear wheel, its rump) to the tail end, a narrow riveted rim each side with cyan
    //      slits, a keel fin, ice blades swept back along the top ----
    { const B = nb(), HW = 0.26;
      for (let i = 0; i < 4; i++) { const a0 = (2 + i * 37) * DEG, a1 = (2 + (i + 1) * 37 + 5) * DEG, R0 = 0.63 - 0.02 * i;
        B.surf((u, v) => { const a = lerp(a0, a1, u), y = lerp(-HW, HW, v), r = R0 - 0.04 * Math.pow(Math.abs(y) / HW, 3); return [Math.cos(a) * r, y, Math.sin(a) * r]; }, 6, 4, () => M_ARM, { e: (u, v) => (v < 0.02 || v > 0.98 || u < 0.03 || u > 0.97) ? 1 : 0 });
        B.surf((u, v) => { const y = lerp(-HW, HW, u), r = lerp(R0 - 0.06, R0, v); return [Math.cos(a1) * r, y, Math.sin(a1) * r]; }, 2, 1, () => M_ARM, { e: () => 1 });
        for (const s of [-1, 1]) { B.surf((u, v) => { const a = lerp(a0, a1, u), r = lerp(R0 - 0.035, R0 - 0.11, v); return [Math.cos(a) * r, s * (HW - 0.015 * v), Math.sin(a) * r]; }, 5, 1, () => M_ARM, { flip: s < 0, e: (u, v) => v > 0.8 ? 1 : 0.2 });
          const am = (a0 + a1) / 2, d = dirXZ(am + 0.5 * Math.PI + 0.3); B.push(d, [0, 1, 0], vcross(d, [0, 1, 0]), [Math.cos(am) * (R0 - 0.07), s * (HW + 0.004), Math.sin(am) * (R0 - 0.07)]); B.box([0, 0, 0], [0.07, 0.005, 0.012], 0, M_ENG); B.pop();
          for (let j = 0; j < 3; j++) { const ar = lerp(a0, a1, (j + 0.5) / 3); B.sph([Math.cos(ar) * (R0 - 0.035), s * (HW - 0.002), Math.sin(ar) * (R0 - 0.035)], 0.012, M_STEEL, 5); } } }
      // the prow: a keel plate and two cheek plates ahead of the tyre
      plate(B, [[0.6, 0.12], [0.76, 0.02], [0.7, -0.2], [0.6, -0.1]], 0, 0.05, M_ARM, 0.015);
      for (const s of [-1, 1]) { plate(B, [[0.5, 0.34], [0.7, 0.16], [0.66, -0.06], [0.56, 0.06]], s * 0.2, 0.03, M_ARM, 0.012); B.box([0.615, s * 0.234, 0.14], [0.012, 0.004, 0.07], 0, M_ENG);
        for (let i = 0; i < 2; i++) { const a = (112 - i * 40) * DEG, p = [Math.cos(a) * 0.63, s * 0.11, Math.sin(a) * 0.63]; blade(B, p, [Math.cos(a + 1.05), s * 0.12, Math.sin(a + 1.05)], 0.36 - 0.06 * i, 0.1, [0, s, 0.4], -0.08, i + s); } }
      plate(B, [[-0.36, 0.56], [0.0, 0.7], [0.4, 0.55], [0.0, 0.62]], 0, 0.03, M_ARM, 0.012);
      { const a = 152 * DEG, p = [Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6], t = [-Math.sin(a), 0, Math.cos(a)]; B.spike(vadd(p, vmul(t, -0.04)), vadd(p, vmul(t, 0.26)), 0.12, M_ARM, { seg: 5 }); }
      // the detail: two raised rails round the arch, a seam across each lame, bolts
      for (let i = 0; i < 4; i++) { const a0 = (4 + i * 37) * DEG, a1 = (2 + (i + 1) * 37 + 3) * DEG, R0 = 0.63 - 0.02 * i + 0.006;
        for (const s of [-1, 1]) for (let j = 0; j < 5; j++) { const p = lerp(a0, a1, j / 5), q = lerp(a0, a1, (j + 1) / 5); B.tube([Math.cos(p) * R0, s * 0.11, Math.sin(p) * R0], [Math.cos(q) * R0, s * 0.11, Math.sin(q) * R0], 0.011, 0.011, M_SILV, { seg: 5, cap0: j === 0 ? 'round' : false, cap1: j === 4 ? 'round' : false }); }
        for (let j = 1; j < 3; j++) { const a = lerp(a0, a1, j / 3), d = dirXZ(a + 0.5 * Math.PI); B.push(d, [0, 1, 0], vcross(d, [0, 1, 0]), [Math.cos(a) * (R0 - 0.004), 0, Math.sin(a) * (R0 - 0.004)]); B.box([0, 0, 0], [0.005, 0.09, 0.004], 0, M_DARK); for (const s of [-1, 1]) B.box([0, s * 0.18, 0], [0.005, 0.045, 0.004], 0, M_DARK); B.pop(); }
        for (const s of [-1, 1]) for (let j = 0; j < 2; j++) { const a = lerp(a0, a1, 0.25 + j * 0.5); B.sph([Math.cos(a) * (R0 - 0.006), s * 0.17, Math.sin(a) * (R0 - 0.006)], 0.011, M_STEEL, 5); } }
      out.fender = B.done(); }
    // ---- a wheel's carrier arm (origin: its pivot on the frame; x to the hub): a forged silver arm, a steel stanchion, the axle clamp ----
    { const B = nb();
      plate(B, [[-0.05, 0.05], [0.2, 0.06], [LARM + 0.06, 0.045], [LARM + 0.07, -0.045], [0.2, -0.05], [-0.05, -0.05]], 0, 0.03, M_ARM, 0.012);
      B.tube([0.04, 0.036, 0], [LARM - 0.06, 0.036, 0], 0.03, 0.03, M_STEEL, { seg: 8 }); disc(B, [LARM, 0.01, 0], Y, 0.085, 0.04, M_GUN, 14); disc(B, [LARM, 0.05, 0], Y, 0.045, 0.012, M_ENG, 10); disc(B, [0, 0.01, 0], Y, 0.07, 0.04, M_GUN, 12);
      B.box([0.3, 0.034, 0.0], [0.05, 0.006, 0.018], 0, M_ENG);
      B.tube([0.04, -0.036, 0], [LARM - 0.06, -0.036, 0], 0.03, 0.03, M_STEEL, { seg: 8 }); for (let i = 0; i < 3; i++) for (const s of [-1, 1]) B.torX([0.16 + i * 0.16, s * 0.036, 0], 0.031, 0.007, M_GUN, { seg: 8, rseg: 4 });
      for (let i = 0; i < 4; i++) for (const k of [-1, 1]) B.sph([0.1 + i * 0.13, 0.03, k * 0.04], 0.008, M_STEEL, 5); B.tube([0.06, 0, 0.055], [LARM - 0.1, 0, 0.05], 0.012, 0.012, M_MECH, { seg: 5 });
      // polish: a brake caliper over the disc, a toothed ring at the pivot, a drive chain's run
      B.box([LARM - 0.2, 0.0, 0.12], [0.07, 0.05, 0.045], 0.015, M_GUN); B.box([LARM - 0.2, 0.052, 0.12], [0.04, 0.004, 0.02], 0, M_ENG); for (const k of [-1, 1]) B.sph([LARM - 0.2 + k * 0.045, 0.05, 0.145], 0.011, M_STEEL, 5);
      B.torY([0, 0.045, 0], 0.075, 0.012, M_STEEL, { seg: 18, rseg: 4, teeth: 12, tooth: 0.014 });
      for (let i = 0; i < 9; i++) B.box([0.08 + i * 0.055, 0.046, -0.058], [0.02, 0.008, 0.009], 0.003, i % 2 ? M_STEEL : M_GUN);
      out.arm = B.done(); }
    // ---- an upper leg (origin: the shoulder or hip; x to the elbow; y outward on the right side): a big cyan-cored joint
    //      disc, a dark core with a piston, layered silver armour, an ice shard along the back ----
    { const B = nb();
      B.push([1, 0, 0], [0, 2.1, 0], [0, 0, 1.85], [0, 0, 0]);
      B.tube([0.03, 0, 0], [LU - 0.04, 0, 0], 0.065, 0.055, M_MECH, { seg: 9 });
      for (const s of [-1, 1]) { disc(B, [0, s * 0.07, 0], Y, 0.12, 0.03, M_ARM, 20); disc(B, [0, s * 0.1, 0], Y, 0.06, 0.014, M_ENG, 14); B.torY([0, s * 0.102, 0], 0.088, 0.014, M_STEEL, { seg: 16, rseg: 4 });
        plate(B, [[0.1, 0.1], [0.5, 0.085], [0.64, 0.02], [0.6, -0.07], [0.14, -0.09]], s * 0.075, 0.02, M_ARM, 0.012);
        B.box([0.36, s * 0.097, 0.0], [0.11, 0.004, 0.014], 0, M_ENG);
        disc(B, [LU, s * 0.06, 0], Y, 0.085, 0.025, M_STEEL, 12); disc(B, [LU, s * 0.088, 0], Y, 0.04, 0.008, M_ENG, 8); }
      plate(B, [[0.08, 0.13], [0.52, 0.11], [0.62, 0.06], [0.1, 0.07]], 0, 0.07, M_ARM, 0.015);
      B.tube([0.12, 0, -0.085], [0.6, 0, -0.07], 0.022, 0.022, M_STEEL, { seg: 6 }); B.tube([0.1, 0, -0.085], [0.36, 0, -0.08], 0.034, 0.034, M_GUN, { seg: 6 });
      B.crystal([0.14, 0, -0.06], [0.5, 0, -0.26], 0.06, M_ICE, { n: 4, thin: 0.72, seed: 2 });
      B.sph([LU, 0, 0], 0.085, M_GUN, 10);
      B.pop();
      for (const s of [-1, 1]) { B.torY([0, s * 0.2, 0], 0.13, 0.014, M_STEEL, { seg: 20, rseg: 4, teeth: 14, tooth: 0.016 }); for (let i = 0; i < 5; i++) B.sph([0.2 + i * 0.09, s * 0.19, 0.105], 0.009, M_STEEL, 5); }
      out.legU = B.done(); }
    // ---- a lower leg (origin: the elbow or hock; x to the ankle): slimmer; a silver shin, twin steel rods, a cyan strip ----
    { const B = nb();
      B.push([1, 0, 0], [0, 2.0, 0], [0, 0, 2.0], [0, 0, 0]);
      B.tube([0.03, 0, 0], [LL - 0.03, 0, 0], 0.05, 0.042, M_MECH, { seg: 8 });
      loft(B, [[0.06, 0.05, 0.095, 0.02, 0.02], [0.2, 0.075, 0.105, 0.0, 0.025], [0.5, 0.06, 0.085, 0.0, 0.02], [0.66, 0.035, 0.06, 0.0, 0.015]], M_ARM, { sub: 2 });
      for (const s of [-1, 1]) { B.tube([0.05, s * 0.04, -0.055], [0.64, s * 0.035, -0.045], 0.016, 0.016, M_STEEL, { seg: 5 }); B.box([0.34, s * 0.071, 0.05], [0.12, 0.003, 0.012], 0, M_ENG); }
      B.crystal([0.12, 0, -0.04], [0.4, 0, -0.2], 0.045, M_ICE, { n: 4, thin: 0.72, seed: 5 });
      B.sph([LL, 0, 0], 0.07, M_GUN, 9); B.torY([LL, 0, 0], 0.07, 0.016, M_STEEL, { seg: 12, rseg: 4 });
      B.pop();
      out.legL = B.done(); }
    // ---- a hock (origin: the lower leg's end; x to the ankle, LH long): the third segment of the leg, an armoured link with a
    //      piston behind and a cyan-capped joint ----
    { const B = nb();
      B.tube([0.02, 0, 0], [LH - 0.02, 0, 0], 0.07, 0.065, M_MECH, { seg: 9 });
      loft(B, [[0.02, 0.085, 0.11, -0.02, 0.03], [0.16, 0.1, 0.12, -0.03, 0.035], [0.3, 0.085, 0.1, -0.02, 0.03]], M_ARM, { sub: 2 });
      B.tube([0.03, 0, -0.085], [0.29, 0, -0.08], 0.024, 0.024, M_STEEL, { seg: 6 }); B.tube([0.02, 0, -0.085], [0.16, 0, -0.082], 0.036, 0.036, M_GUN, { seg: 6 });
      for (const s of [-1, 1]) { B.box([0.16, s * 0.102, 0.05], [0.07, 0.004, 0.014], 0, M_ENG); disc(B, [LH, s * 0.09, 0], Y, 0.07, 0.014, M_STEEL, 12); disc(B, [LH, s * 0.106, 0], Y, 0.036, 0.006, M_ENG, 8); }
      B.sph([LH, 0, 0], 0.095, M_GUN, 10); B.spike([0.04, 0, -0.03], [-0.12, 0, -0.2], 0.05, M_ARM, { seg: 5 });
      out.hock = B.done(); }
    // ---- a paw (origin: the ankle; x forward along the toes; z up): a broad armoured foot, four thick toes with knuckles, big
    //      curved steel claws, a heel spur, a cyan pad light ----
    { const B = nb();
      loft(B, [[-0.07, 0.08, 0.075, -0.06, 0.025], [0.06, 0.15, 0.065, -0.08, 0.035], [0.2, 0.17, 0.03, -0.085, 0.03]], M_ARM, { sub: 2 });
      loft(B, [[-0.02, 0.07, 0.1, 0.06, 0.02], [0.12, 0.1, 0.085, 0.05, 0.02]], M_SILV, { sub: 1 });
      for (let i = 0; i < 4; i++) { const y0 = -0.126 + i * 0.084, sp = (i - 1.5) * 0.03;
        B.tube([0.17, y0, -0.03], [0.3, y0 + sp, -0.035], 0.046, 0.042, M_ARM, { seg: 7 }); B.sph([0.3, y0 + sp, -0.035], 0.047, M_GUN, 7);
        B.tube([0.3, y0 + sp, -0.035], [0.39, y0 + sp * 1.6, -0.05], 0.042, 0.036, M_ARM, { seg: 7 });
        B.tube([0.38, y0 + sp * 1.6, -0.04], [0.48, y0 + sp * 2.1, -0.045], 0.04, 0.03, M_STEEL, { seg: 6, cap1: false }); B.spike([0.47, y0 + sp * 2.1, -0.045], [0.6, y0 + sp * 2.7, -0.14], 0.032, M_STEEL, { seg: 5 }); }   // (a claw: curving down to its point)
      B.spike([-0.05, 0, -0.02], [-0.2, 0, -0.1], 0.045, M_STEEL, { seg: 5 });
      disc(B, [0, 0.11, 0], Y, 0.05, 0.008, M_ENG, 8); disc(B, [0, -0.11, 0], Y, 0.05, 0.008, M_ENG, 8);
      out.paw = B.done(); }
    // ---- the head (origin: the back of the skull, on the neck; x to the nose; z up): a broad armoured cranium, a stop down to
    //      a long tapered muzzle with a dark nose, a brow ridge over each narrow cyan eye, cheek plates, tall ears swept back,
    //      an upper lip with fangs, a crest of ice from the brow ----
    { const B = nb();
      B.push([1, 0, 0], [0, 1.22, 0], [0, 0, 1.1], [0, 0, 0]);
      loft(B, [[-0.06, 0.11, 0.12, -0.09, 0.05], [0.06, 0.185, 0.185, -0.11, 0.065], [0.2, 0.19, 0.18, -0.1, 0.06], [0.3, 0.15, 0.13, -0.085, 0.05], [0.36, 0.1, 0.07, -0.07, 0.035]], M_ARM, { sub: 2 });                       // (the cranium)
      loft(B, [[0.3, 0.095, 0.075, -0.07, 0.03], [0.5, 0.082, 0.05, -0.062, 0.028], [0.7, 0.065, 0.028, -0.05, 0.022], [0.8, 0.045, 0.012, -0.04, 0.016]], M_ARM, { sub: 2 });                                                  // (the muzzle)
      loft(B, [[0.3, 0.045, 0.1, 0.06, 0.015], [0.55, 0.035, 0.068, 0.04, 0.012], [0.76, 0.022, 0.032, 0.01, 0.008]], M_SILV, { sub: 1 });                                                                                 // (its ridge)
      B.box([0.805, 0, -0.008], [0.026, 0.045, 0.028], 0.014, M_DARK);                                                                                                                                                  // (the nose)
      for (const s of [-1, 1]) { B.box([0.6, s * 0.084, -0.02], [0.16, 0.004, 0.008], 0, M_CYAN); B.sph([0.72, s * 0.05, 0.02], 0.012, M_DARK, 5); }                                                                    // (a light along the lip; a nostril)
      for (const s of [-1, 1]) {
        plate(B, [[0.17, 0.135], [0.37, 0.08], [0.34, 0.055], [0.19, 0.095]], s * 0.15, 0.016, M_CYAN, 0);                                 // (an eye: a narrow slanted slit)
        plate(B, [[0.1, 0.17], [0.4, 0.085], [0.44, 0.11], [0.14, 0.215]], s * 0.14, 0.04, M_ARM, 0.012);                                 // (the brow over it)
        plate(B, [[0.0, 0.05], [0.3, 0.0], [0.26, -0.11], [0.02, -0.12], [-0.08, -0.03]], s * 0.172, 0.016, M_ARM, 0.01);               // (the cheek armour)
        B.box([0.14, s * 0.19, -0.04], [0.07, 0.003, 0.012], 0, M_CYAN);
        // an ear: tall, pointed, swept back
        B.crystal([0.06, s * 0.12, 0.14], [-0.22, s * 0.2, 0.56], 0.095, M_ARM, { n: 4, thin: 0.67, seed: 2, belly: 0.25, up: [0, s, 0] }); B.crystal([0.03, s * 0.115, 0.14], [-0.1, s * 0.18, 0.36], 0.04, M_ICE, { n: 3, thin: 0.72, seed: 4 });
        for (let i = 0; i < 4; i++) B.spike([0.44 + i * 0.07, s * (0.068 - i * 0.008), -0.04], [0.45 + i * 0.07, s * (0.066 - i * 0.008), -0.085 - (i === 3 ? 0.03 : 0)], 0.014, M_SILV, { seg: 4 });   // (fangs)
        // the crest: shards swept back from the brow and the cheeks
        blade(B, [0.08, s * 0.1, 0.12], [-1, s * 0.5, 0.42], 0.32, 0.09, [0, s, 0.8], -0.08, 1 + s); blade(B, [0.0, s * 0.16, 0.0], [-1, s * 0.7, 0.05], 0.3, 0.085, [0, s * 0.3, 1], -0.06, 5 + s);
        }
      blade(B, [0.16, 0, 0.15], [-1, 0, 0.5], 0.38, 0.11, [0, 1, 0], -0.1, 3);
      // the detail: the jaw's hinge, rivets along the cheek, vents and a side plate on the muzzle, the canines, cables under the skull, panel seams
      for (const s of [-1, 1]) {
        B.tube([0.02, s * 0.15, -0.065], [0.02, s * 0.192, -0.065], 0.045, 0.04, M_GUN, { seg: 12, cap0: 'flat', cap1: 'flat' }); B.tube([0.02, s * 0.19, -0.065], [0.02, s * 0.198, -0.065], 0.02, 0.02, M_CYAN, { seg: 8, cap0: 'flat', cap1: 'flat' });
        for (let i = 0; i < 5; i++) B.sph([0.07 + i * 0.045, s * 0.19, -0.1 + i * 0.002], 0.008, M_STEEL, 5);
        plate(B, [[0.31, 0.03], [0.56, 0.012], [0.54, -0.04], [0.31, -0.055]], s * 0.1, 0.012, M_SILV, 0.006);
        for (let i = 0; i < 3; i++) B.box([0.37 + i * 0.055, s * 0.108, -0.012], [0.016, 0.003, 0.022], 0, M_DARK);
        B.spike([0.7, s * 0.04, -0.035], [0.71, s * 0.036, -0.12], 0.017, M_SILV, { seg: 6 }); B.spike([0.36, s * 0.08, -0.05], [0.365, s * 0.078, -0.1], 0.014, M_SILV, { seg: 5 });
        B.tube([-0.04, s * 0.06, -0.08], [0.26, s * 0.05, -0.075], 0.016, 0.014, M_MECH, { seg: 6 }); B.tube([-0.04, s * 0.1, -0.06], [0.1, s * 0.12, -0.1], 0.012, 0.012, M_STEEL, { seg: 5 });
        B.box([0.2, s * 0.08, 0.176], [0.1, 0.004, 0.004], 0, M_DARK); B.box([0.1, s * 0.186, 0.02], [0.004, 0.004, 0.06], 0, M_DARK);
        for (let i = 0; i < 3; i++) B.sph([0.16 + i * 0.09, s * (0.165 - i * 0.022), 0.19 - i * 0.03], 0.007, M_STEEL, 5); }
      for (const s of [-1, 1]) { plate(B, [[0.13, 0.15], [0.4, 0.07], [0.4, 0.045], [0.15, 0.08]], s * 0.156, 0.02, M_GUN, 0.008);                       // (an eye's housing under the slit)
        for (let i = 0; i < 6; i++) B.spike([0.4 + i * 0.05, s * (0.072 - i * 0.006), -0.045], [0.402 + i * 0.05, s * (0.071 - i * 0.006), -0.07], 0.009, M_SILV, { seg: 4 });   // (the small teeth between the fangs)
        plate(B, [[0.02, 0.03], [0.24, -0.01], [0.2, -0.09], [0.04, -0.09]], s * 0.19, 0.008, M_SILV, 0.006); B.box([0.12, s * 0.2, -0.03], [0.06, 0.003, 0.006], 0, M_CYAN); }
      B.box([0.12, 0, 0.19], [0.1, 0.012, 0.006], 0.004, M_SILV); for (let i = 0; i < 4; i++) B.box([0.36 + i * 0.1, 0, 0.098 - i * 0.02], [0.006, 0.03 - i * 0.004, 0.004], 0, M_DARK);
      B.pop();
      out.head = B.done(); }
    // ---- the lower jaw (origin: its hinge under the cheeks; x forward) ----
    { const B = nb();
      loft(B, [[0.0, 0.11, 0.0, -0.06, 0.025], [0.2, 0.085, -0.005, -0.055, 0.02], [0.42, 0.055, -0.01, -0.045, 0.015], [0.5, 0.035, -0.012, -0.035, 0.01]], M_GUN, { sub: 1 });
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) B.spike([0.24 + i * 0.08, s * (0.06 - i * 0.008), -0.01], [0.245 + i * 0.08, s * (0.058 - i * 0.008), 0.03], 0.012, M_SILV, { seg: 4 });
      for (const s of [-1, 1]) { B.tube([0.02, s * 0.1, -0.03], [0.4, s * 0.05, -0.04], 0.012, 0.01, M_STEEL, { seg: 6 }); B.box([0.16, s * 0.094, -0.03], [0.07, 0.003, 0.008], 0, M_CYAN);
        for (let i = 0; i < 3; i++) B.sph([0.06 + i * 0.1, s * (0.1 - i * 0.014), -0.012], 0.007, M_STEEL, 5); B.spike([0.44, s * 0.03, -0.01], [0.45, s * 0.028, 0.05], 0.014, M_SILV, { seg: 5 }); }
      B.box([0.24, 0, -0.062], [0.14, 0.02, 0.004], 0.003, M_SILV);
      out.jaw = B.done(); }
    // ---- a neck link (origin: its joint; x to the next): a dark armoured vertebra, silver lames, cyan seams, ice on top ----
    { const B = nb();
      B.tube([0, 0, 0], [LNECK, 0, 0], 0.11, 0.1, M_MECH, { seg: 12 }); B.sph([0, 0, 0], 0.125, M_GUN, 10);
      loft(B, [[0.03, 0.12, 0.15, 0.02, 0.04], [0.2, 0.135, 0.16, 0.0, 0.045], [0.4, 0.11, 0.14, 0.02, 0.04]], M_ARM, { sub: 2 });
      for (const s of [-1, 1]) { B.box([0.2, s * 0.137, 0.07], [0.12, 0.003, 0.012], 0, M_CYAN); B.tube([0.02, s * 0.07, -0.09], [0.38, s * 0.065, -0.085], 0.02, 0.02, M_STEEL, { seg: 5 });
        blade(B, [0.24, s * 0.09, 0.12], [-1, s * 0.5, 0.55], 0.34, 0.1, [0, s, 0.8], -0.08, 4 + s); }
      blade(B, [0.3, 0, 0.14], [-1, 0, 0.62], 0.46, 0.13, [0, 1, 0], -0.1, 2);
      for (let i = 0; i < 3; i++) B.torX([0.08 + i * 0.12, 0, -0.02], 0.112, 0.012, M_STEEL, { seg: 12, rseg: 4 });
      for (const s of [-1, 1]) { B.tube([0.0, s * 0.11, -0.03], [0.4, s * 0.1, -0.03], 0.016, 0.016, M_MECH, { seg: 6 }); for (let i = 0; i < 4; i++) B.sph([0.06 + i * 0.09, s * 0.14, 0.11], 0.008, M_STEEL, 5);
        B.box([0.2, s * 0.1, 0.165], [0.14, 0.004, 0.004], 0, M_DARK); }
      out.neck = B.done(); }
    // ---- a tail link (origin: its joint; x to the next, away from the body; z the outer side): a silver vertebra plate, a
    //      steel joint, long ice blades fanning out and back ----
    { const B = nb();
      B.tube([0, 0, 0], [LTAIL, 0, 0], 0.07, 0.065, M_MECH, { seg: 9 }); B.sph([0, 0, 0], 0.08, M_GUN, 9);
      loft(B, [[0.0, 0.085, 0.1, 0.0, 0.03], [0.14, 0.1, 0.11, -0.01, 0.035], [0.27, 0.075, 0.09, 0.0, 0.03]], M_ARM, { sub: 2 });
      blade(B, [0.02, 0, 0.08], [0.8, 0, 0.5], 1.0, 0.24, [0, 1, 0], 0.12, 1); blade(B, [0.1, 0, 0.06], [0.9, 0, 0.16], 0.66, 0.17, [0, 0.4, 1], 0.05, 4);
      for (const s of [-1, 1]) { 
        plate(B, [[0.02, 0.06], [0.22, 0.05], [0.3, -0.02], [0.24, -0.07], [0.02, -0.05]], s * 0.085, 0.012, M_ARM, 0.008); B.box([0.13, s * 0.099, 0.0], [0.06, 0.003, 0.01], 0, M_CYAN); }
      for (let i = 0; i < 2; i++) B.torX([0.1 + i * 0.14, 0, -0.01], 0.072, 0.01, M_STEEL, { seg: 10, rseg: 4 });
      for (const s of [-1, 1]) { B.tube([0.0, s * 0.05, -0.055], [LTAIL, s * 0.045, -0.05], 0.012, 0.012, M_MECH, { seg: 5 }); for (let i = 0; i < 3; i++) B.sph([0.06 + i * 0.08, s * 0.1, 0.045], 0.007, M_STEEL, 5); }
      B.box([0.14, 0, 0.113], [0.1, 0.012, 0.004], 0.003, M_SILV);
      out.tail = B.done(); }
    // ---- the fore mane (origin: its hinge behind the neck): the crest over the shoulders. Layered blades of ice, swept up and
    //      back from a silver saddle plate: a tall centre row, two rows a side leaning out ----
    { const B = nb();
      plate(B, [[-0.02, 0.0], [0.18, 0.02], [0.22, 0.09], [-0.2, 0.12], [-0.24, 0.03]], 0, 0.17, M_ARM, 0.015); disc(B, [0, 0, 0], Y, 0.055, 0.19, M_STEEL, 10);
      for (const [x0, L, w, el] of [[0.14, 0.46, 0.15, 44], [0.02, 0.64, 0.18, 54], [-0.12, 0.54, 0.16, 68]]) blade(B, [x0, 0, 0.06], [-Math.cos(el * DEG), 0, Math.sin(el * DEG)], L, w, [0, 1, 0], -0.1, x0 * 7);
      for (const s of [-1, 1]) for (const [x0, y0, L, w, el, out2] of [[0.1, 0.1, 0.44, 0.14, 46, 0.3], [-0.06, 0.12, 0.52, 0.15, 60, 0.36], [0.04, 0.2, 0.36, 0.12, 40, 0.6]]) blade(B, [x0, s * y0, 0.06], [-Math.cos(el * DEG), s * out2 * 0.6, Math.sin(el * DEG)], L, w, [0, s, 0.5 + out2], -0.1, x0 * 5 + y0 * 9 + s);
      out.maneF = B.done(); }
    // ---- the rear crest (origin: its hinge behind the saddle): the haunches' armour and its long layered blades ----
    { const B = nb();
      plate(B, [[0.06, 0.0], [0.12, 0.07], [-0.3, 0.14], [-0.44, 0.07], [-0.3, -0.02]], 0, 0.2, M_ARM, 0.015); disc(B, [0, 0, 0], Y, 0.055, 0.22, M_STEEL, 10);
      for (const [x0, L, w, el] of [[-0.04, 0.7, 0.19, 36], [-0.2, 0.92, 0.22, 26], [-0.34, 0.8, 0.2, 14]]) blade(B, [x0, 0, 0.08], [-Math.cos(el * DEG), 0, Math.sin(el * DEG)], L, w, [0, 1, 0], -0.1, x0 * 7);
      for (const s of [-1, 1]) { for (const [x0, y0, L, w, el, out2] of [[-0.1, 0.14, 0.64, 0.17, 28, 0.35], [-0.28, 0.2, 0.6, 0.16, 14, 0.7]]) blade(B, [x0, s * y0, 0.08], [-Math.cos(el * DEG), s * out2 * 0.6, Math.sin(el * DEG)], L, w, [0, s, 0.5 + out2], -0.1, x0 * 5 + y0 * 9 + s);
        B.box([-0.16, s * 0.202, 0.07], [0.1, 0.004, 0.014], 0, M_CYAN); for (let i = 0; i < 4; i++) B.sph([-0.3 + i * 0.1, s * 0.2, 0.11], 0.011, M_STEEL, 5); }
      out.maneR = B.done(); }
    // ---- a cannon's breech (origin: its trunnion; x forward): a dark receiver in silver armour, the cartridge drum, cyan cells ----
    { const B = nb();
      B.push([1, 0, 0], [0, 1.3, 0], [0, 0, 1.3], [0, 0, 0]);
      B.box([-0.06, 0, 0], [0.2, 0.06, 0.07], 0.02, M_MECH); loft(B, [[-0.24, 0.07, 0.085, 0.02, 0.02], [-0.04, 0.075, 0.095, 0.03, 0.025], [0.16, 0.06, 0.08, 0.03, 0.02]], M_ARM, { sub: 1 });
      B.tube([-0.2, 0, -0.1], [-0.02, 0, -0.1], 0.06, 0.06, M_GUN, { seg: 12, cap0: 'flat', cap1: 'flat' }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; B.tube([-0.2, Math.cos(a) * 0.038, -0.1 + Math.sin(a) * 0.038], [-0.215, Math.cos(a) * 0.038, -0.1 + Math.sin(a) * 0.038], 0.014, 0.014, M_CYAN, { seg: 5, cap0: 'flat', cap1: 'flat' }); }
      B.tube([0.12, 0, 0], [0.3, 0, 0], 0.05, 0.042, M_GUN, { seg: 10, cap1: 'flat' }); B.torX([0.2, 0, 0], 0.05, 0.012, M_STEEL, { seg: 12, rseg: 4 });
      for (const s of [-1, 1]) { B.box([-0.06, s * 0.062, 0.02], [0.1, 0.003, 0.012], 0, M_CYAN); disc(B, [0, s * 0.07, 0], Y, 0.045, 0.012, M_STEEL, 10); }
      B.box([-0.27, 0, 0.0], [0.03, 0.045, 0.055], 0.012, M_GUN);
      B.pop();
      out.cannon = B.done(); }
    // ---- a cannon's barrel (origin: the trunnion; x to the muzzle at LBAR; it slides back in recoil): long and thin, a jacket,
    //      a muzzle brake with a cyan ring ----
    { const B = nb();
      B.push([1, 0, 0], [0, 1.6, 0], [0, 0, 1.6], [0, 0, 0]);
      B.tube([0.1, 0, 0], [LBAR - 0.04, 0, 0], 0.026, 0.024, M_STEEL, { seg: 10, cap0: 'flat', cap1: 'flat' });
      B.tube([0.28, 0, 0], [0.62, 0, 0], 0.036, 0.034, M_GUN, { seg: 10, cap0: 'flat', cap1: 'flat' }); for (let i = 0; i < 3; i++) B.torX([0.34 + i * 0.1, 0, 0], 0.037, 0.008, M_STEEL, { seg: 10, rseg: 4 });
      B.lathe([[LBAR - 0.2, 0.026, M_ARM], [LBAR - 0.18, 0.048, M_ARM], [LBAR - 0.04, 0.052, M_ARM], [LBAR, 0.04, M_ARM], [LBAR, 0.02, M_DARK], [LBAR - 0.1, 0.02, M_DARK]], M_ARM, { seg: 12 });
      B.torX([LBAR - 0.11, 0, 0], 0.052, 0.01, M_CYAN, { seg: 14, rseg: 4 }); B.torX([LBAR - 0.55, 0, 0], 0.03, 0.008, M_ARM, { seg: 10, rseg: 4 });
      for (let i = 0; i < 6; i++) B.torX([0.78 + i * 0.16, 0, 0], 0.028, 0.006, i % 2 ? M_ARM : M_GUN, { seg: 10, rseg: 4 });
      B.tube([0.3, 0, -0.045], [1.3, 0, -0.04], 0.009, 0.009, M_MECH, { seg: 5 }); for (let i = 0; i < 4; i++) B.box([0.4 + i * 0.28, 0, -0.03], [0.012, 0.008, 0.016], 0, M_GUN);
      for (let i = 0; i < 4; i++) { const a = i * 0.5 * Math.PI + 0.25 * Math.PI; B.box([LBAR - 0.11, Math.cos(a) * 0.052, Math.sin(a) * 0.052], [0.05, 0.007, 0.007], 0.003, M_DARK); }
      for (const s of [-1, 1]) B.box([0.45, s * 0.036, 0], [0.12, 0.003, 0.006], 0, M_CYAN);
      B.pop();
      out.barrel = B.done(); }
    // ---- a cannon's mount arm (origin: its boss on the frame; x to the trunnion) ----
    { const B = nb();
      plate(B, [[-0.04, 0.04], [LCM + 0.04, 0.03], [LCM + 0.04, -0.03], [-0.04, -0.04]], 0, 0.022, M_ARM, 0.01); B.tube([0.05, 0.03, 0], [LCM - 0.05, 0.03, 0], 0.018, 0.018, M_STEEL, { seg: 6 });
      disc(B, [0, 0, 0], Y, 0.06, 0.035, M_GUN, 10); disc(B, [LCM, 0, 0], Y, 0.05, 0.035, M_GUN, 10); B.box([LCM * 0.5, -0.024, 0], [0.1, 0.003, 0.012], 0, M_CYAN);
      out.cmount = B.done(); }
    // ---- a piston's sleeve and its rod (origin: an end; x along it; 0.34 long each: they telescope) ----
    { const B = nb(); B.tube([0, 0, 0], [0.34, 0, 0], 0.036, 0.036, M_GUN, { seg: 8, cap1: 'flat' }); B.sph([0, 0, 0], 0.045, M_STEEL, 7); B.torX([0.32, 0, 0], 0.036, 0.008, M_ENG, { seg: 10, rseg: 4 }); out.pistonA = B.done(); }
    { const B = nb(); B.tube([0, 0, 0], [0.34, 0, 0], 0.02, 0.02, M_STEEL, { seg: 7 }); B.sph([0, 0, 0], 0.04, M_STEEL, 7); out.pistonB = B.done(); }
    return out;
  }

  /* ================= the parts: bounds (for the picture's box), a low-detail stand-in (capsules [a, b, radius, colour];
     discs for the tyres) for the 2D fallback, the shadow and the clearance sweep ================= */
  const C_S = '#C6CFDC', C_D = '#262A33', C_I = '#2C6BE6', C_R = '#14161A', C_C = '#5FE9FF', C_G = '#6B7482';
  const PARTS = {
    wheel: { c: [0, 0, 0], R: 0.58, disc: WR, cap: [] },
    chassis: { c: [0, 0, 0.2], R: 0.95, cap: [[[-0.15, 0, 0], [0.15, 0, 0], 0.2, C_D], [[-0.58, 0, 0.45], [0.6, 0, 0.47], 0.07, C_G], [[-0.44, 0, 0.53], [0.1, 0, 0.53], 0.13, C_R], [[0.22, 0, 0.53], [0.52, 0, 0.5], 0.12, C_S]] },
    fender: { c: [0.1, 0, 0.3], R: 0.92, cap: [[[-0.4, 0, 0.4], [0, 0, 0.57], 0.06, C_S], [[0, 0, 0.57], [0.4, 0, 0.4], 0.06, C_S]] },
    arm: { c: [LARM / 2, 0, 0], R: 0.45, cap: [[[0, 0, 0], [LARM, 0, 0], 0.045, C_S]] },
    legU: { c: [LU / 2, 0, 0], R: 0.56, cap: [[[0, 0, 0], [LU, 0, 0], 0.13, C_S]] },
    legL: { c: [LL / 2, 0, 0], R: 0.5, cap: [[[0, 0, 0], [LL, 0, 0], 0.1, C_S]] },
    hock: { c: [LH / 2, 0, 0], R: 0.34, cap: [[[0, 0, 0], [LH, 0, 0], 0.09, C_S]] },
    paw: { c: [0.2, 0, -0.03], R: 0.48, cap: [[[0, 0, -0.01], [0.4, 0, -0.04], 0.11, C_S]] },
    head: { c: [0.2, 0, 0.1], R: 0.76, cap: [[[0.02, 0, 0.03], [0.28, 0, 0.03], 0.16, C_S], [[0.3, 0, 0.0], [0.7, 0, -0.01], 0.07, C_S], [[0, 0, 0.16], [-0.3, 0, 0.36], 0.07, C_I]] },
    jaw: { c: [0.25, 0, -0.03], R: 0.3, cap: [[[0.02, 0, -0.03], [0.45, 0, -0.03], 0.04, C_G]] },
    neck: { c: [0.1, 0, 0.2], R: 0.72, cap: [[[0, 0, 0], [LNECK, 0, 0], 0.13, C_S], [[0.2, 0, 0.15], [-0.15, 0, 0.42], 0.06, C_I]] },
    tail: { c: [0.45, 0, 0.25], R: 1.0, cap: [[[0, 0, 0], [LTAIL, 0, 0], 0.085, C_S], [[0.06, 0, 0.08], [0.55, 0, 0.44], 0.06, C_I]] },
    maneF: { c: [-0.2, 0, 0.35], R: 0.86, cap: [[[0.05, 0, 0.08], [-0.35, 0, 0.5], 0.1, C_I], [[-0.05, 0.12, 0.08], [-0.3, 0.2, 0.36], 0.07, C_I], [[-0.05, -0.12, 0.08], [-0.3, -0.2, 0.36], 0.07, C_I]] },
    maneR: { c: [-0.5, 0, 0.25], R: 0.98, cap: [[[-0.1, 0, 0.08], [-0.75, 0, 0.36], 0.1, C_I], [[-0.12, 0.15, 0.08], [-0.6, 0.3, 0.26], 0.07, C_I], [[-0.12, -0.15, 0.08], [-0.6, -0.3, 0.26], 0.07, C_I]] },
    cannon: { c: [-0.02, 0, -0.02], R: 0.36, cap: [[[-0.22, 0, 0], [0.2, 0, 0], 0.08, C_D]] },
    barrel: { c: [LBAR / 2 + 0.05, 0, 0], R: 1.0, cap: [[[0.1, 0, 0], [LBAR, 0, 0], 0.045, C_G]] },
    cmount: { c: [LCM / 2, 0, 0], R: 0.36, cap: [[[0, 0, 0], [LCM, 0, 0], 0.03, C_S]] },
    pistonA: { c: [0.17, 0, 0], R: 0.2, cap: [[[0, 0, 0], [0.34, 0, 0], 0.035, C_G]] },
    pistonB: { c: [0.17, 0, 0], R: 0.2, cap: [[[0, 0, 0], [0.34, 0, 0], 0.02, C_G]] },
  };

  /* ================= the transformation: motorcycle (xf 0) to wolf (xf 1), in order; it runs either way =================
     Stages overlap only where their paths are clear (see clearance). */
  const XF_STAGES = {
    open: [0.0, 0.14],      // 1. the locks open: the crests lift clear, the cannon arms swing outboard off the flanks
    cannons: [0.04, 0.3],   // 2. the cannons ride their mount arms out and up from beside the front wheel to over the shoulders
    legs: [0.26, 0.56],     // 3. the four legs unfold from the frame, out and down; the paws take the floor
    lift: [0.44, 0.8],      // 4. the legs straighten and lift the frame; the pet's saddle rises with it, level
    wheels: [0.5, 0.86],    // 5. the two wheels swing in and up on their carrier arms, into the chest and the pelvis
    head: [0.54, 0.9],      // 6. the neck unfolds; the fairing goes forward and becomes the wolf's head
    tail: [0.58, 0.96],     // 7. the cowl uncurls from over the rear wheel and streams out as the tail
    lock: [0.92, 1.0],      // 8. the joints lock
  };
  const XF_BOUNDS = Object.values(XF_STAGES).map(r => r[0]).concat([1]);
  function stagesAt(xf) { const o = {}; for (const k in XF_STAGES) { const [a, b] = XF_STAGES[k]; o[k] = sstep(a, b, xf); } return o; }

  /* ================= the rig: every part's place and orientation (the model's frame), and the anchors ================= */
  function rig(P, t) {
    t = t || 0; const xf = cl(P.xf || 0), S = stagesAt(xf), wolf = S.lift, out = { inst: [], A: {}, S, xf };
    const I = (name, part, R, o, s, al) => { const it = { name, part, R, o, s: s || 1, al: al == null ? 1 : al }; out.inst.push(it); return it; };
    const ra = cl(P.gaitK != null ? P.gaitK : P.runAmp || 0) * S.legs, run = P.gait != null ? P.gait * TAU : P.run || 0, mane = cl(P.mane || 0), tlift = cl(P.tailLift || 0), pist = cl(P.piston || 0), susp = Math.max(-1, Math.min(1, P.susp || 0)), crouch = cl(P.crouch || 0), curl = cl(P.curl || 0) * wolf, lock = cl(P.pawLock || 0) * wolf;
    // the frame: its height (the legs lift it), the run's bob and rock, crouching, the suspension's dip
    const bob = ra * wolf * 0.06 * Math.sin(run * 2 + 0.6), rock = ra * wolf * 0.07 * Math.sin(run + 1.2);
    const Cz = CZ0 + LIFT * wolf - 0.05 * susp * (1 - wolf) - (0.26 * crouch + 0.2 * lock + 0.05 * pist) * wolf - (0.05 * crouch + 0.04 * cl(P.drift || 0)) * (1 - wolf) + bob;
    const C = [0, 0, Cz], Rc = rotY(rock + 0.1 * crouch * wolf - 0.04 * susp * (1 - wolf)), toC = p => vadd(C, mv(Rc, p)), dC = v => mv(Rc, v);
    I('chassis', 'chassis', Rc, C);
    out.A.seat = toC(SEAT); out.A.center = toC([0, 0, 0.1]);
    // the wheels on their carrier arms (real pivots); the motorcycle's steering turns the front one; the suspension works the arms
    const spinF = P.wheelF != null ? P.wheelF : P.wheelSpin || 0, spinR = P.wheelR != null ? P.wheelR : P.wheelSpin || 0, steer = Math.max(-1, Math.min(1, P.steer || 0)) * 0.5 * (1 - S.wheels);
    const aF = lerp(AF0, AF1, ease(S.wheels)) + 0.09 * susp * (1 - wolf), aR = lerp(AR0, AR1, ease(S.wheels)) - 0.09 * susp * (1 - wolf);
    const hubF = vadd(toC(PIVF), dC(vmul(dirXZ(aF), LARM))), hubR = vadd(toC(PIVR), dC(vmul(dirXZ(aR), LARM)));
    const Rst = rotZ(steer);
    I('wheelF', 'wheel', mm(mm(Rc, Rst), rotY(spinF)), hubF, WS); I('wheelR', 'wheel', mm(Rc, rotY(spinR)), hubR, WS);
    for (const s of [-1, 1]) { const sd = s < 0 ? 'L' : 'R'; I('armF' + sd, 'arm', mm(Rc, rotY(-aF)), toC([PIVF[0], s * 0.275, PIVF[2]])); I('armR' + sd, 'arm', mm(Rc, rotY(-aR)), toC([PIVR[0], s * 0.275, PIVR[2]])); }
    // the wheels' armour: over the top and back of each tyre (motorcycle); the chest's and the haunches' armour (wolf)
    I('fenderF', 'fender', mm(mm(Rc, Rst), rotY(-lerp(34, 0, S.wheels) * DEG)), hubF, WS); I('fenderR', 'fender', mm(mm(Rc, rotZ(Math.PI)), rotY(-lerp(18, -4, S.wheels) * DEG)), hubR, WS);   // (the rear one turned about: its prow is the rump)
    out.A.wheelF = hubF; out.A.wheelR = hubR;
    // pistons: the front suspension (frame to hub), the rear shock
    const piston = (nm, a, b) => { const d = vsub(b, a), L = vlen(d), F = frameXZ(d, [0, 0, 1]), k = Math.max(0.55, Math.min(1.9, L / 0.6)); I(nm + 'a', 'pistonA', F, a, k); I(nm + 'b', 'pistonB', frameXZ(vmul(d, -1), [0, 0, 1]), b, k); };
    for (const s of [-1, 1]) { const sd = s < 0 ? 'L' : 'R'; piston('shockF' + sd, toC(vlerp([0.82, s * 0.3, 0.72], [0.66, s * 0.3, 0.6], S.head)), vadd(hubF, dC([-0.02, s * 0.3, 0.1]))); piston('shockR' + sd, toC([-0.26, s * 0.3, 0.4]), vadd(hubR, dC([0.08, s * 0.3, 0.1]))); }
    // the legs: folded into braces round the frame (motorcycle); out and down onto the floor (wolf), running, crouching, locking, curling
    const PH = { FL: 0, FR: 2.2, RL: Math.PI + 0.5, RR: Math.PI + 2.7 };
    for (const f of [1, -1]) for (const s of [-1, 1]) { const key = (f > 0 ? 'F' : 'R') + (s < 0 ? 'L' : 'R'), J = toC(f > 0 ? SHO(s) : HIPJ(s));
      // folded: the ankle low beside the frame, the paw along it (the front leg's elbow by the front hub, the rear's by the rear hub)
      const aB = toC(f > 0 ? [0.4, s * 0.6, -0.47] : [-0.67, s * 0.6, -0.45]), poleB = dC(f > 0 ? [1, 0, -0.3] : [-1, 0, -0.35]), hvB = dC(f > 0 ? [0.3, 0, 0.1] : [0.14, 0, 0.27]);
      // standing: the paws on the floor ahead of the shoulders and behind the hips; the hock rises up and back from each
      const ph = run + PH[key], stride = 0.46 * ra, up = Math.max(0, Math.sin(ph)) * 0.34 * ra;
      const aW = [(f > 0 ? 0.92 : -1.12) + stride * Math.cos(ph) + (f > 0 ? 0.16 : -0.14) * lock, s * (0.74 + 0.16 * lock), 0.19 + up], hvW = [f > 0 ? -0.1 : -0.22, 0, 0.27];
      // (the front pair unfolds first, the rear pair a beat later: their upper legs pass each other clear; curled, they fold again)
      const u0 = S.legs, u = cl(f > 0 ? u0 * 1.3 : u0 * 1.3 - 0.3) * (1 - ease(curl)), eu = ease(u), mid = Math.sin(Math.PI * u), tk = ease(cl(P.tuck || 0)) * eu, ank = vlerp(vadd(vlerp(aB, aW, eu), [0, s * 0.2 * mid, 0.1 * mid]), toC(f > 0 ? [0.98, s * 0.7, -0.56] : [-0.72, s * 0.7, -0.62]), tk);   // (tuck: the legs drawn up under the body for a leap)
      const hv = vmul(vnrm(vlerp(hvB, hvW, eu)), LH * LS), top = vadd(ank, hv);
      const poleW = dC(f > 0 ? [-1, 0, 0.1] : [1, 0, 0.35]), pole = vnrm(vadd(vlerp(poleB, poleW, eu), dC([0, s * 1.1 * mid, -0.3 * mid])));   // (the elbow swings round the outside, never through the frame)
      const k = ik2(J, top, LU * LS, LL * LS, pole), yo = dC([0, 1, 0]);
      I('legU' + key, 'legU', frameXZ(vsub(k.E, J), vcross(vsub(k.E, J), yo)), J, LS);
      I('legL' + key, 'legL', frameXZ(vsub(k.W, k.E), vcross(vsub(k.W, k.E), yo)), k.E, LS);
      I('hock' + key, 'hock', frameXZ(vsub(ank, k.W), vcross(vsub(ank, k.W), yo)), k.W, LS);
      // the paw: flat on the floor, toes forward (wolf; toes down in the air); along the frame, claws tucked (motorcycle)
      const pB = frameXZ(dC([f > 0 ? -1 : 1, 0, 0.04]), dC([0, 0, 1])), pW = frameXZ([1, 0, -0.7 * up], [0, 0, 1]), pT = frameXZ(dC(f > 0 ? [0.55, 0, -0.85] : [0.7, 0, -0.7]), dC([0, 0, 1]));
      I('paw' + key, 'paw', tk > 0.001 ? mslerp(mslerp(pB, pW, eu), pT, tk) : mslerp(pB, pW, eu), ank, lerp(1.0, 1.25, eu));
      out.A['paw' + key] = vadd(ank, [0.12, 0, -0.1]);
    }
    // the neck and the head: the fairing over the front wheel, turning with the steering (motorcycle); forward and up (wolf)
    const hu = ease(S.head), hy = (P.head || 0) * hu + steer * (1 - hu), hp = (P.headPitch || 0) * hu;
    let hj = vlerp(HEADB, HEADW, hu); if (curl > 0) hj = vlerp(hj, [1.5, 0, 0.3], ease(curl));
    const Hj = toC(hj), Rh = mm(Rc, mm(rotZ(hy), rotY(lerp(0.12, 0.3, hu) - hp + 1.15 * ease(curl))));
    I('head', 'head', Rh, Hj, HS); I('jaw', 'jaw', mm(Rh, rotY(0.05 + 0.5 * cl(P.jaw || 0))), vadd(Hj, mv(Rh, vmul([0.2, 0, -0.085], HS))), HS);
    { const N0 = toC(NECK0), kN = ik2(N0, vadd(Hj, mv(Rh, [-0.03, 0, -0.04])), LNECK * 1.2, LNECK * 1.2, dC(vlerp([-1, 0, 0.15], [0.2, 0, 1], hu))), yo = dC([0, 1, 0]);
      I('neck1', 'neck', frameXZ(vsub(kN.E, N0), vcross(vsub(kN.E, N0), yo)), N0, 1.5); I('neck2', 'neck', frameXZ(vsub(kN.W, kN.E), vcross(vsub(kN.W, kN.E), yo)), kN.E, 1.35); }
    out.A.head = vadd(Hj, mv(Rh, vmul([0.3, 0, 0.05], HS))); out.A.mouth = vadd(Hj, mv(Rh, vmul([0.66, 0, -0.04], HS))); out.A.eyeL = vadd(Hj, mv(Rh, vmul([0.29, -0.145, 0.1], HS))); out.A.eyeR = vadd(Hj, mv(Rh, vmul([0.29, 0.145, 0.1], HS))); out.A.headDir = Rh.x;
    // the crests on their hinges: the fore mane stands over the shoulders (wolf) and lies back as the tank's fairing (motorcycle);
    // the rear crest stands tall as the cowl's top (motorcycle) and lies along the haunches (wolf); both lift to unlock
    const op = Math.sin(Math.PI * S.open) * 0.25 + 0.22 * Math.max(mane, curl);
    I('maneF', 'maneF', mm(Rc, rotY(-(lerp(-0.3, 0.12, hu) + op))), toC(MANEF), lerp(1.0, 1.3, hu)); I('maneR', 'maneR', mm(Rc, rotY(-(lerp(0.36, -0.2, ease(S.tail)) + op))), toC(MANER), lerp(1.15, 0.85, ease(S.tail)));
    // the tail: curled up and over the rear wheel as the spiked cowl (motorcycle); streaming out behind, swaying (wolf); curled under
    { let p = toC(TAIL0); const tu = ease(S.tail), sway = (P.tail || 0) * (0.3 + 0.7 * tu); let yaw = 0;
      for (let i = 0; i < NTAIL; i++) { const a = lerp(TAILB[i], TAILW[i], tu) + tlift * tu * (0.1 + 0.07 * i) - ease(curl) * (0.2 + 0.2 * i) + 0.05 * Math.sin(t * 2.1 - i * 0.7) * tu; yaw += sway * 0.16;
        const d = dC(mv(rotZ(yaw), [-Math.cos(a), 0, Math.sin(a)])), sc = 1 - 0.07 * i; I('tail' + i, 'tail', frameXZ(d, vcross(d, dC(mv(rotZ(yaw), [0, -1, 0])))), p, sc); p = vadd(p, vmul(d, LTAIL * sc)); }
      out.A.tailTip = p; }
    // the cannons on their mount arms: low along the flanks, the barrels out past the front wheel (motorcycle); over the shoulders
    // (wolf); each arm swings out and round, clear of the legs; recoil slides the barrel; a small pitch to aim
    for (const s of [-1, 1]) { const sd = s < 0 ? 'L' : 'R', u = S.cannons * (1 - ease(curl)), o1 = Math.sin(Math.PI * Math.max(S.open * 0.5, u)) * 0.0;
      const d = u < 0.5 ? vnrm(vlerp(CDB(s), CDM(s), ease(u * 2))) : vnrm(vlerp(CDM(s), CDW(s), ease(u * 2 - 1))); void o1;
      const boss = toC(CBOSS(s)), dW = dC(d), tr = vadd(boss, vmul(dW, LCM));
      I('cmount' + sd, 'cmount', frameXZ(dW, dC([1, 0, 0])), boss);
      const cp = (P.cannonPitch || 0) + 0.02, Rk = mm(Rc, rotY(-cp)), rec = cl(s < 0 ? P.recoilL || 0 : P.recoilR || 0);
      I('cannon' + sd, 'cannon', Rk, tr); I('barrel' + sd, 'barrel', Rk, vadd(tr, vmul(Rk.x, -0.3 * rec)));
      out.A['muzzle' + sd] = vadd(tr, vmul(Rk.x, LBAR - 0.3 * rec)); out.A['breech' + sd] = vadd(tr, vmul(Rk.x, -0.12)); out.A.cannonDir = Rk.x; }
    // the whole body: the pitch about its middle (a backflip, a somersault, the Spinning Wheel), the lean about the floor line
    const pitch = (P.pitch || 0) + (P.flip || 0), lean = P.lean || 0, Pc = [0, 0, Cz - 0.05];
    out.A.forward = [1, 0, 0]; out.A.up = [0, 0, 1];
    if (pitch || lean) { const Rp = rotY(-pitch), Rl = rotX(lean), Rw = mm(Rl, Rp), tw = p => mv(Rl, vadd(Pc, mv(Rp, vsub(p, Pc))));
      for (const it of out.inst) { it.o = tw(it.o); it.R = mm(Rw, it.R); }
      for (const k in out.A) out.A[k] = /Dir$|^forward$|^up$/.test(k) ? mv(Rw, out.A[k]) : tw(out.A[k]); }
    out.Cz = Cz;
    return out;
  }

  /* ================= drawing ================= */
  const CW = [0, VY, VZ], EXW = [1, 0, 0], EYW = vcross(CW, EXW);
  const LW = vnrm([-0.5, 0.3, 0.82]), SBW = vnrm([-0.2, -0.38, 0.9]), RIMW = vnrm([0.55, -0.72, 0.42]), UPW = [0, 0, 1];
  function camAt(el, az) { const e = el * DEG, a = az * DEG, C = [Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e)], EX = vnrm(vcross([0, 0, 1], C).map(v => -v)); const ex = vlen(EX) > 1e-4 ? EX : [1, 0, 0]; return { C, EX: ex, EY: vcross(C, ex) }; }
  /* the view of one draw: the model's frame -> the world (heading a) -> the screen */
  function mkView(x, y, z, a, o) {
    const T = o.T, sc = (o.scale || 1) * VIS, k = T * sc, Rh = rotZ(a), X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T, K = o.cam ? camAt(o.cam[0], o.cam[1]) : null;
    const toS = K ? p => { const w = mv(Rh, p); return [X0 + vdot(w, K.EX) * k, Y0 + vdot(w, K.EY) * k]; } : p => { const w = mv(Rh, p); return [X0 + w[0] * k, Y0 + (w[1] * GY - w[2] * ZK) * k]; };
    const toW = p => { const w = mv(Rh, p); return { x: x + w[0] * sc, y: y + w[1] * GY * sc, z: z + w[2] * sc }; };
    const depth = p => vdot(mv(Rh, p), K ? K.C : CW);
    return { T, sc, k, Rh, toS, toW, depth, x, y, z, a, K };
  }
  let LAST = null, NOGL = false, GLMS = 0, GLN = 0, GLBOX = null; const GLI = [], GLJ = [];
  // (a software rasteriser - a browser with no usable GPU - takes a large part of a second a frame: the low-detail picture is
  //  drawn there instead, unless asked for: window.__FENRIR_GL = 1, for tests and studio renders)
  const glOn = () => { if (NOGL || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__FENRIR_GL)) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Fenrir: meshes', e); return false; } } return true; };
  const GLCAP = 1600, RIMC = [0.3, 0.85, 1.5], AMBC = [0.82, 0.95, 1.22];
  function glPass(c, V, P, o, list, al0) {
    const k = V.k, K = V.K, PX = K ? K.EX : EXW, PY = K ? K.EY : [0, GY, -ZK], PD = K ? K.C : CW, X0 = V.toS([0, 0, 0]);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { const Pt = PARTS[it.part], rr = Pt.R * it.s * 1.04 * k, w = mv(V.Rh, vadd(it.o, mv(it.R, vmul(Pt.c, it.s)))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return;
    const m = c.getTransform ? c.getTransform() : null, dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (GLM.soft && !(typeof window !== 'undefined' && window.__FENRIR_GLHQ) ? 0.4 : 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sc = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sc)); H = Math.max(2, Math.ceil(H * sc));
    const bw = bx1 - bx0, bh = by1 - by0, tl = w => { const a = vdot(w, EXW), b = vdot(w, EYW), cc = vdot(w, CW); return K ? vadd(vadd(vmul(K.EX, a), vmul(K.EY, b)), vmul(K.C, cc)) : w; };
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: tl(LW), ls: tl(SBW), lr: tl(RIMW), up: tl(UPW), low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC };
    const cg2 = cgOf(P) * PULSE, glowK = cl(0.3 + 0.7 * (P.glow == null ? 0.5 : P.glow)), bg = cl(P.barrel || 0), fx = cl(P.crack || 0);
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = MESH[it.part]; if (!mesh) continue; const Rw = mm(V.Rh, it.R), s2 = it.s, T = mv(V.Rh, it.o), al = al0 * it.al;
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2; g.R1[i] = Rw.y[i] * s2; g.R2[i] = Rw.z[i] * s2; g.T[i] = T[i]; }
      g.alpha = al; g.glow = it.part === 'barrel' || it.part === 'cannon' ? Math.max(glowK, bg) : glowK; g.kind = 0; g.wear = 1; g.fx = fx; g.glow2 = cg2; g.spill = glowK; g.d = vdot(T, PD); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++; GLBOX = [W, H];
  }
  /* the low-detail picture (no WebGL): the same rig as shaded capsules and discs, far to near */
  const FB = [];
  function drawFallback(c, V, R, al0) {
    FB.length = 0; const k = V.k;
    for (const it of R.inst) { const Pt = PARTS[it.part]; if (!(it.al > 0.01)) continue;
      if (Pt.disc) { const ctr = it.o, ax = it.R.y, e1 = it.R.x, e2 = it.R.z; FB.push({ d: V.depth(ctr), disc: 1, ctr, ax, e1, e2, r: Pt.disc * it.s, al: it.al }); continue; }
      for (const [a, b, r, col] of Pt.cap) { const A = vadd(it.o, mv(it.R, vmul(a, it.s))), B = vadd(it.o, mv(it.R, vmul(b, it.s))); FB.push({ d: (V.depth(A) + V.depth(B)) / 2, A: V.toS(A), B: V.toS(B), w: r * it.s * 2 * k, col, al: it.al }); } }
    FB.sort((p, q) => p.d - q.d); c.save(); c.lineCap = 'round';
    for (const f of FB) { c.globalAlpha = al0 * f.al;
      if (f.disc) { for (const [rr, col, off] of [[f.r, C_R, 0], [f.r * 0.68, C_C, 0.2], [f.r * 0.6, C_G, 0.2], [f.r * 0.2, C_C, 0.21]]) for (const sg of off ? [-1, 1] : [0]) { c.beginPath(); for (let i = 0; i <= 18; i++) { const a = i / 18 * TAU, p = V.toS(vadd(vadd(f.ctr, vmul(f.ax, sg * off)), vadd(vmul(f.e1, Math.cos(a) * rr), vmul(f.e2, Math.sin(a) * rr)))); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); } c.closePath(); if (!off) { c.strokeStyle = C_R; c.lineWidth = WW * 2 * k * 0.9; c.lineJoin = 'round'; c.stroke(); } c.fillStyle = col; c.fill(); } continue; }
      c.strokeStyle = '#0B0E14'; c.lineWidth = f.w + 2; c.beginPath(); c.moveTo(f.A[0], f.A[1]); c.lineTo(f.B[0] + 0.01, f.B[1]); c.stroke();
      c.strokeStyle = f.col; c.lineWidth = f.w; c.beginPath(); c.moveTo(f.A[0], f.A[1]); c.lineTo(f.B[0] + 0.01, f.B[1]); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = Math.max(1, f.w * 0.3); c.beginPath(); c.moveTo(f.A[0], f.A[1] - f.w * 0.22); c.lineTo(f.B[0] + 0.01, f.B[1] - f.w * 0.22); c.stroke(); }
    c.restore();
  }
  /* the live 2D lights over the picture: the hubs' and the reactor's cyan, the eyes, the muzzles' charge */
  let PULSE = 1;                                   // the crystals' slow breathing (set per draw)
  const cgOf = P => Math.max(0, Math.min(2, P.crystalGlow == null ? 1 : P.crystalGlow));
  function lights(c, V, R, P, al, low) {
    if (typeof glowSprite !== 'function' || typeof blitSized !== 'function') return; const A = R.A, k = V.k, g = cl(P.glow == null ? 0.5 : P.glow), bg = cl(P.barrel || 0);
    c.save(); c.globalCompositeOperation = 'lighter'; const blob = (p, r, a2, col) => { const q = V.toS(p), rr = r * k; c.globalAlpha = al * a2; blitSized(c, glowSprite(col || '#58E4FF'), q[0] - rr, q[1] - rr, rr * 2, rr * 2); };
    const ENG = '#6A4DFF', ICE = '#3FA8FF', cg = cgOf(P) * PULSE;
    // the engine's halo (a deep violet-blue): the reactor, both hubs; the crystals' (a brighter azure): each crest, the tail's links, the head
    blob(A.center, 0.34, 0.2 + 0.2 * g, ENG); if (!low) { blob(A.wheelF, 0.46, 0.16 + 0.18 * g, ENG); blob(A.wheelR, 0.46, 0.16 + 0.18 * g, ENG); blob(A.center, 0.8, 0.07 + 0.06 * g, ENG); }
    if (cg > 0.02) for (const it of R.inst) { const pt = it.part; if (it.al < 0.5 || (pt !== 'tail' && pt !== 'maneF' && pt !== 'maneR' && pt !== 'head' && pt !== 'neck')) continue; if (low && pt !== 'maneF' && pt !== 'tail') continue;
      const Pt = PARTS[pt], q = vadd(it.o, mv(it.R, vmul(pt === 'tail' ? [0.5, 0, 0.3] : pt === 'head' ? [-0.05, 0, 0.3] : Pt.c, it.s))); blob(q, (pt === 'tail' ? 0.62 : pt === 'neck' ? 0.4 : 0.7) * it.s, (pt === 'tail' || pt === 'neck' ? 0.1 : 0.16) * cg, ICE); }
    blob(A.eyeL, 0.09, 0.5 + 0.3 * g); blob(A.eyeR, 0.09, 0.5 + 0.3 * g);
    if (bg > 0.02) for (const sd of ['L', 'R']) { blob(A['muzzle' + sd], 0.14 + 0.2 * bg, bg * 0.9); blob(A['muzzle' + sd], 0.07 + 0.08 * bg, bg, '#EAFBFF'); blob(A['breech' + sd], 0.16, bg * 0.5); }
    c.restore();
  }
  /* draw(c, x, y, z, heading, pose, o): o = { T, sx, sy, t, scale, low, pet(c, X, Y), cam }.
     The pet (o.pet, at the saddle) is drawn over the body; whatever of the machine stands nearer the camera than the rider
     (the cannons, the head or the crests, by the heading) is then drawn over the pet. */
  function draw(c, x, y, z, a, P, o) {
    o = o || {}; const t = o.t != null ? o.t : nowMs() / 1000, R = rig(P, t), V = mkView(x, y, z, a, o); LAST = { R, V, P }; PULSE = 0.8 + 0.2 * Math.sin(t * 1.7);
    const al0 = P.alpha == null ? 1 : P.alpha; if (!(al0 > 0.01)) return;
    const low = o.low != null ? o.low : lowFx(), vis = R.inst.filter(it => it.al > 0.004);
    if (glOn()) { let ok = true;
      try { if (o.pet) { const ds = V.depth(vadd(R.A.seat, [0, 0, 0.3])), over = it => /^(cannon|barrel|cmount|head|jaw|maneF|maneR|neck)/.test(it.name) && V.depth(vadd(it.o, mv(it.R, vmul(PARTS[it.part].c, it.s)))) > ds + 0.12;
          const front = vis.filter(over); glPass(c, V, P, o, front.length ? vis.filter(it => !over(it)) : vis, al0); lights(c, V, R, P, al0, low);
          const s3 = V.toS(R.A.seat); o.pet(c, s3[0], s3[1]); if (front.length) glPass(c, V, P, o, front, al0); }
        else { glPass(c, V, P, o, vis, al0); lights(c, V, R, P, al0, low); } } catch (e) { NOGL = true; ok = false; }
      if (ok) return; }
    drawFallback(c, V, R, al0); lights(c, V, R, P, al0, low); if (o.pet) { const s3 = V.toS(R.A.seat); o.pet(c, s3[0], s3[1]); }
  }
  /* the ground shadow: soft blurred blobs under the parts, painted small and laid down at once; fainter with height */
  let SHC = null, BLOB = null;
  function drawShadow(c, x, y, z, a, P, o) {
    o = o || {}; const R = rig(P, o.t || 0), V = mkView(x, y, 0, a, o), al = (P.alpha == null ? 1 : P.alpha); if (!(al > 0.01)) return;
    if (!BLOB) { BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const g = BLOB.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.45, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    const pts = []; for (const it of R.inst) { if (/^(piston|shock|jaw|cmount|arm)/.test(it.name)) continue; const Pt = PARTS[it.part], p = vadd(it.o, mv(it.R, vmul(Pt.c, it.s))); pts.push([p, Pt.R * 0.62 * it.s, it.al]); }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const proj = pts.map(([p, r, w]) => { const g = V.toS([p[0], p[1], 0]), h = Math.max(0, p[2] + z), rr = r * V.k * (1 + h * 0.1) * 1.2; x0 = Math.min(x0, g[0] - rr); x1 = Math.max(x1, g[0] + rr); y0 = Math.min(y0, g[1] - rr); y1 = Math.max(y1, g[1] + rr); return [g[0] + h * 0.16 * V.k, g[1] + h * 0.08 * V.k, rr, w / (1 + h * 0.3)]; });
    const sc = 0.25, W = Math.max(8, Math.ceil((x1 - x0) * sc) + 4), H = Math.max(8, Math.ceil((y1 - y0) * sc) + 4);
    if (!SHC || SHC.width < W || SHC.height < H) { const w0 = SHC ? SHC.width : 0, h0 = SHC ? SHC.height : 0; SHC = document.createElement('canvas'); SHC.width = Math.max(W, w0); SHC.height = Math.max(H, h0); }
    const g = SHC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    for (const [px, py, rr, w] of proj) { const r2 = rr * sc; g.globalAlpha = Math.min(1, 0.5 * w); g.drawImage(BLOB, (px - x0) * sc + 2 - r2, (py - y0) * sc + 2 - r2 * GY, r2 * 2, r2 * 2 * GY); }
    c.save(); c.globalAlpha = al * 0.45 / (1 + Math.max(0, z) * 0.25); c.imageSmoothingEnabled = true; c.drawImage(SHC, 0, 0, W, H, x0 - 2 / sc, y0 - 2 / sc, W / sc, H / sc); c.restore();
  }

  /* ================= anchors (for the last draw, or for a pose: anchorAt) ================= */
  const ANCHORS = ['seat', 'center', 'muzzleL', 'muzzleR', 'breechL', 'breechR', 'wheelF', 'wheelR', 'pawFL', 'pawFR', 'pawRL', 'pawRR', 'head', 'mouth', 'eyeL', 'eyeR', 'tailTip'];
  const DIRS = ['cannonDir', 'headDir', 'forward', 'up'];
  /* anchor(name) -> world { x, y, z } (tiles; y on the game's floor) for the last draw; anchorDir(name) -> a unit direction */
  function anchor(name) { if (!LAST) return null; const p = LAST.R.A[name]; if (!p) return null; return LAST.V.toW(p); }
  function anchorDir(name) { if (!LAST) return null; const p = LAST.R.A[name]; if (!p) return null; const w = mv(LAST.V.Rh, p); return { x: w[0], y: w[1] * GY, z: w[2] }; }
  /* anchorAt(name, x, y, z, heading, pose): the same without a draw (for logic that runs before the frame is drawn) */
  function anchorAt(name, x, y, z, a, P, o) { const R = rig(P, 0), p = R.A[name]; if (!p) return null; const sc = ((o && o.scale) || 1) * VIS, w = mv(rotZ(a), p); return DIRS.includes(name) ? { x: w[0], y: w[1] * GY, z: w[2] } : { x: x + w[0] * sc, y: y + w[1] * GY * sc, z: z + w[2] * sc }; }

  /* ================= pose channels ================= */
  /* The names are the ones A's animation layer writes (20k8n). Angles in radians.
     xf 0 motorcycle .. 1 wolf; alpha; wheelF / wheelR: each wheel's rolled angle; steer -1..1 (motorcycle: the front wheel
     and the fairing turn); lean: the body's roll about the floor line, + to its left; pitch: the nose up (+), about the
     middle; flip: whole turns about the middle, added to pitch (+ a backflip, - a forward somersault); susp -1..1 (the
     motorcycle's suspension compressing); gait: the run's phase in strides (turns), gaitK 0..1 its amplitude (wolf);
     crouch 0..1; curl 0..1 (the wolf tucked into a ring: the Spinning Wheel); pawLock 0..1 (paws spread and planted),
     piston 0..1 (the frame pressed down on them); recoilL / recoilR 0..1 (a barrel slid back); cannonPitch (the cannons'
     elevation); load 0..1, barrel 0..1 (the chambers' and the barrels' glow); tail (sway), tailLift 0..1; mane 0..1 (the
     crests flared); head (yaw), headPitch; jaw 0..1; glow 0..1 (the cyan channels); crack 0..1 (frost cracking over
     everything, before the exit); drift 0..1 (a lower stance). */
  const CH = ['xf', 'alpha', 'wheelF', 'wheelR', 'steer', 'lean', 'pitch', 'flip', 'susp', 'gait', 'gaitK', 'crouch', 'curl', 'pawLock', 'piston', 'recoilL', 'recoilR', 'cannonPitch', 'load', 'barrel', 'tail', 'tailLift', 'mane', 'head', 'headPitch', 'jaw', 'glow', 'crack', 'drift', 'crystalGlow', 'tuck'];
  function blankPose() { return { xf: 0, alpha: 1, wheelF: 0, wheelR: 0, steer: 0, lean: 0, pitch: 0, flip: 0, susp: 0, gait: 0, gaitK: 0, crouch: 0, curl: 0, pawLock: 0, piston: 0, recoilL: 0, recoilR: 0, cannonPitch: 0, load: 0, barrel: 0, tail: 0, tailLift: 0, mane: 0, head: 0, headPitch: 0, jaw: 0, glow: 0.5, crack: 0, drift: 0, crystalGlow: 1, tuck: 0 }; }
  /* relax(P, dt): ease the body channels toward neutral (not xf, alpha, the wheels, the gait's phase or the cracks) */
  function relax(P, dt) { const k = Math.min(1, dt * 6); for (const c2 of ['steer', 'lean', 'pitch', 'susp', 'gaitK', 'crouch', 'curl', 'pawLock', 'piston', 'recoilL', 'recoilR', 'cannonPitch', 'load', 'barrel', 'tail', 'tailLift', 'mane', 'head', 'headPitch', 'jaw', 'drift']) if (P[c2]) P[c2] += (0 - P[c2]) * k; }

  /* ================= the clearance sweep: the least gap between parts that are not joined (their stand-ins as spheres) ================= */
  const JOINED = [['jaw', 'neck'], ['tail', 'fender'], ['chassis', ''], ['arm', 'wheel'], ['arm', 'fender'], ['fender', 'wheel'], ['legU', 'legL'], ['legL', 'hock'], ['hock', 'paw'], ['legL', 'paw'], ['arm', 'legU'], ['neck', 'neck'], ['neck', 'head'], ['head', 'jaw'], ['neck', 'maneF'], ['neck', 'fender'], ['head', 'maneF'], ['tail', 'tail'], ['tail', 'maneR'], ['cmount', 'cannon'], ['cmount', 'barrel'], ['cannon', 'barrel'], ['maneF', 'maneR']];
  function clearance(P) {
    const R = rig(P, 0), S2 = [];
    for (const it of R.inst) { const Pt = PARTS[it.part], b = it.part; if (b === 'pistonA' || b === 'pistonB') continue;
      if (Pt.disc) { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; S2.push({ n: it.name, b, p: vadd(it.o, vadd(vmul(it.R.x, Math.cos(a) * 0.33), vmul(it.R.z, Math.sin(a) * 0.33))), r: 0.17 }); } S2.push({ n: it.name, b, p: it.o, r: 0.2 }); continue; }
      for (const [a, b2, r, col] of Pt.cap) { if (col === C_I) continue; const A = vadd(it.o, mv(it.R, vmul(a, it.s))), B = vadd(it.o, mv(it.R, vmul(b2, it.s))), n = Math.max(1, Math.ceil(vlen(vsub(B, A)) / (r * it.s * 1.6))); for (let i = 0; i <= n; i++) S2.push({ n: it.name, b, p: vlerp(A, B, i / n), r: r * it.s * 0.9 }); } }
    const isJ = (a, b) => JOINED.some(([p, q]) => (a.b === p && (q === '' || b.b === q)) || (b.b === p && (q === '' || a.b === q)));
    let worst = { d: 9, a: '', b: '' }, floor = 9;
    for (let i = 0; i < S2.length; i++) { const a = S2[i]; if (a.b === 'paw' || a.b === 'wheel') floor = Math.min(floor, a.p[2] - a.r); for (let j = i + 1; j < S2.length; j++) { const b = S2[j]; if (a.n === b.n || isJ(a, b)) continue; const d = vlen(vsub(a.p, b.p)) - a.r - b.r; if (d < worst.d) worst = { d, a: a.n, b: b.n }; } }
    return { min: worst.d, a: worst.a, b: worst.b, floor };
  }

  /* ================= the interface ================= */
  /* create(): an instance with its own pose */
  function create() { const P = blankPose(); return { pose: P, draw: (c, x, y, z, a, P2, o) => draw(c, x, y, z, a, P2 || P, o), drawShadow: (c, x, y, z, a, P2, o) => drawShadow(c, x, y, z, a, P2 || P, o), anchor, anchorDir }; }
  /* warm(ms): build the meshes ahead of the first frame (true when there is nothing left to prepare) */
  function warm() { glOn(); return true; }
  /* the drawn sizes, tiles (anchors and these include VIS): the motorcycle's and the wolf's length, width and height, for hit radii */
  const SIZE = { bike: { len: 3.1 * VIS, wid: 1.7 * VIS, hgt: 2.1 * VIS, r: 1.3 * VIS }, wolf: { len: 4.6 * VIS, wid: 1.8 * VIS, hgt: 2.3 * VIS, r: 1.6 * VIS }, seatZ: [(CZ0 + SEAT[2]) * VIS, (CZ0 + LIFT + SEAT[2]) * VIS] };
  return { create, warm, warmIdle: () => { glOn(); }, warmPlan: () => ({ pending: 0, total: 0 }), ready: () => true, draw, drawShadow, anchor, anchorDir, anchorAt, ANCHORS, DIRS, blankPose, relax, CH, XF_STAGES, XF_BOUNDS, stagesAt, rig, clearance, VIS, SIZE, VIEW: { GY, ZK },
    __dbg: { get gl() { return glOn(); }, set noGL(v) { NOGL = !!v; }, get GLM() { return typeof GLM !== 'undefined' ? GLM : null; }, get MESH() { return MESH; }, PARTS,
      get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +GLMS.toFixed(2), frames: GLN, box: GLBOX, meshMs: +MESH_MS.toFixed(1), meshTris: MESH ? Object.values(MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0 }); } } };
})();
