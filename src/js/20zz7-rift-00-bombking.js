/* ---------- RIFT 0 · THE BLACKFIRE CALDERA · BOSS 2: THE BOMB KING (worker B) ----------
   An enormous floating, living iron bomb: dark weathered plates riveted in rings round a central molten eye, engraved
   runes that tighten and glow in anger, heat-discoloured (straw to blue) edges, thin seams glowing from within, a crown
   of short forged projections round a thick ember-filled fuse. It breathes (the shell swells), its plates draw in round
   the eye, a deep heartbeat quickens before every explosion, and it hangs heavy in the air. No face, no mouth, no grin.
   Drawn live on the GPU with GLM (20k5uz: materials 85..89 between the CAL-BOMB-MAT markers), as Fenrir and Jaws are:
   rigid meshes built once and posed each frame (every shell plate is its own part, so venting really parts them), one
   composite image into the 2D frame; a 2D picture of the same rig where WebGL is missing or a software rasteriser.
   The fight (spec, Boss 2): ~40% shell reduction, removed while it vents; Royal Volley (three fireballs, a wide fan
   with gaps), Iron Orbit (a slow low ring with one generous opening), Furnace Vent (plates part ~5 s, it settles low);
   phase 2 Bomb Larvae (at most two grounded; a 6 s fuse: ~3 s to RETURN them by hitting them, then red DODGE; a
   returned bomb cracks the shell and staggers it ~4 s); phase 3 the 7 s Royal Detonation: return the supplied bomb into
   its exposed core or deal enough core damage (a long stagger), or reach the SAFE side of any of the three basalt blast
   shelters (it vents, shorter). No death explosion: the fuse burns out and the shell cracks into inert pieces over the
   way down.
   Arena (CAL.bossMake.calbomb, and the fiend's own carve/props): a broad round foundry floor, three permanent shelters.
   FIEND_DEFS.calbomb.MODEL / .make / .SHELTERS are exposed for tests. */
const CALBOMB = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const ease = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;   // (the game camera: orthographic, about 46 degrees above the floor)
  const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };

  /* ================= vectors and rotations (a rotation: its three columns) ================= */
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => Math.sqrt(vdot(a, a)), vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vlerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const M3 = (x, y, z) => ({ x, y, z }), I3 = () => M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const mT = A => M3([A.x[0], A.y[0], A.z[0]], [A.x[1], A.y[1], A.z[1]], [A.x[2], A.y[2], A.z[2]]);
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };   // (+a: x toward -z, the eye looking down)
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  function rotAxis(n, a) { n = vnrm(n); const c = Math.cos(a), s = Math.sin(a), t = 1 - c, [x, y, z] = n;
    return M3([t * x * x + c, t * x * y + s * z, t * x * z - s * y], [t * x * y - s * z, t * y * y + c, t * y * z + s * x], [t * x * z + s * y, t * y * z - s * x, t * z * z + c]); }
  function mslerp(A, B, u) { if (u <= 0) return A; if (u >= 1) return B; const R = mm(B, mT(A)), tr = R.x[0] + R.y[1] + R.z[2], ang = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
    if (ang < 1e-5) return B; let ax = [R.y[2] - R.z[1], R.z[0] - R.x[2], R.x[1] - R.y[0]]; if (vlen(ax) < 1e-5) { ax = [Math.sqrt(Math.max(0, (R.x[0] + 1) / 2)), Math.sqrt(Math.max(0, (R.y[1] + 1) / 2)), Math.sqrt(Math.max(0, (R.z[2] + 1) / 2))]; if (R.x[1] < 0) ax[1] = -ax[1]; if (R.x[2] < 0) ax[2] = -ax[2]; }
    return mm(rotAxis(ax, ang * u), A); }
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  /* =====================================================================================================================
     THE MODEL. Frame: x the eye's axis (forward), y left, z up; the origin the bomb's centre; the shell's radius 1.
     The plates lie in rings round the eye axis (polar angle from +x): an iris of six round the eye, then eight, ten and
     seven, and a back cap. Each ring's plate is one mesh made in the plate's own frame (its centre on +z, so the
     shader's L.xy are the plate's face for the runes), instanced round the axis.
     ===================================================================================================================== */
  const MODEL = (() => {
    const M_PLATE = 85, M_SIDE = 85.3, M_CORE = 86, M_IRON = 87, M_INNER = 87.3, M_TEMPER = 87.6, M_FUSE = 88, M_EMBER = 89;
    const RO = 1.0, RI = 0.925, RC = 0.86;
    const RINGS = [{ n: 6, t0: 0.36, t1: 0.84, rot: 0.0 }, { n: 8, t0: 0.862, t1: 1.45, rot: 0.2 }, { n: 10, t0: 1.472, t1: 2.09, rot: 0.0 }, { n: 7, t0: 2.112, t1: 2.71, rot: 0.3 }];
    const BACK0 = 2.732;
    const dirE = (th, ph) => [Math.cos(th), Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph)];
    const ringBasis = R => { const thc = (R.t0 + R.t1) / 2, z = dirE(thc, 0), y = [0, 0, 1], x = vcross(y, z); return M3(x, y, z); };
    // the plates (instances): ring, index, azimuth, a seed; their resting place on the floor once the shell has cracked
    const PLATES = [];
    RINGS.forEach((R, k) => { for (let i = 0; i < R.n; i++) { const ph = (i + R.rot) / R.n * TAU, sd = hash(k * 31 + i * 7 + 3); PLATES.push({ k, i, ph, sd, B: ringBasis(R), name: `p${k}_${i}`,
      fall: { d: 0.3 + hash(k * 13 + i * 5) * 1.0, a: ph + (hash(i * 3 + k) - 0.5) * 0.6, yaw: hash(i + k * 9) * TAU, flip: hash(i * 7 + k * 2) < 0.18, tilt: (hash(i * 11 + k) - 0.5) * 0.5, delay: hash(i * 5 + k * 17) * 0.35 } }); } });
    const FUSE_N = 6;
    // the fuse's line: out of the crown's bowl, up and bending forward
    const FUSE_PTS = [[0.0, 0, 1.0], [0.0, 0, 1.2], [-0.05, 0.04, 1.37], [-0.14, 0.1, 1.48], [-0.27, 0.15, 1.53], [-0.39, 0.19, 1.5], [-0.47, 0.21, 1.42]];
    const fuseAt = u => { const f = cl(u) * (FUSE_PTS.length - 1), i = Math.min(FUSE_PTS.length - 2, Math.floor(f)), w = f - i, a = FUSE_PTS[Math.max(0, i - 1)], b = FUSE_PTS[i], c = FUSE_PTS[i + 1], d = FUSE_PTS[Math.min(FUSE_PTS.length - 1, i + 2)];
      const cr = (p0, p1, p2, p3) => 0.5 * ((2 * p1) + (-p0 + p2) * w + (2 * p0 - 5 * p1 + 4 * p2 - p3) * w * w + (-p0 + 3 * p1 - 3 * p2 + p3) * w * w * w); return [0, 1, 2].map(j => cr(a[j], b[j], c[j], d[j])); };

    /* ---------------- the meshes (built once) ---------------- */
    let MESH = null, MESH_MS = 0; const BOUND = {};
    function bounds(M) { let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; for (let i = 0; i < M.pos.length; i += 3) { const x = M.pos[i], y = M.pos[i + 1], z = M.pos[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]; let r = 0; for (let i = 0; i < M.pos.length; i += 3) r = Math.max(r, Math.hypot(M.pos[i] - c[0], M.pos[i + 1] - c[1], M.pos[i + 2] - c[2])); return { c, R: r }; }
    function buildMeshes() {
      const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {};
      // ---- a ring's plate: a pillowed patch of the shell, its edges rolled, cut sides, an inner face, a rivet border ----
      RINGS.forEach((R, k) => { const B = nb(), Bs = ringBasis(R), toL = p => [vdot(p, Bs.x), vdot(p, Bs.y), vdot(p, Bs.z)];
        const dph = TAU / R.n, gap = 0.02, th0 = R.t0, th1 = R.t1;
        const half = th => Math.max(0.05, dph / 2 - gap / (2 * Math.sin(th)));
        const de = (u, v) => Math.min(u, 1 - u, v, 1 - v) * 2;   // 0 at the border, 1 in the middle
        const rad = (u, v, r) => { const d = de(u, v), roll = 1 - sstep(0, 0.22, d); return r + (r > 0.96 ? 0.016 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v) - 0.022 * roll * roll : 0); };
        const at = (u, v, r) => { const th = th0 + (th1 - th0) * u, ph = (v - 0.5) * 2 * half(th); return toL(vmul(dirE(th, ph), rad(u, v, r))); };
        const nu = Math.max(6, Math.round(12 * DQ)), nv = Math.max(6, Math.round((k === 0 ? 8 : 11) * DQ));
        B.surf((u, v) => at(u, v, RO), nu, nv, () => M_PLATE, { flip: false, e: (u, v) => 1 - sstep(0.0, 0.4, de(u, v)) });
        B.surf((u, v) => at(u, v, RI), nu, nv, () => M_INNER, { flip: true, e: () => 0 });
        // the cut sides (four strips between the outer and inner faces)
        const side = (f, n) => B.surf((s, w) => { const p = f(s); return at(p[0], p[1], lerp(RO, RI, w)); }, n, 1, () => M_SIDE, { e: (s, w) => w < 0.5 ? 1 : 0.4 });
        side(s => [0, s], nv); side(s => [1, 1 - s], nv); side(s => [1 - s, 0], nu); side(s => [s, 1], nu);
        // rivets along the border
        const riv = (u, v) => { const p = at(u, v, RO + 0.004); B.sph(p, 0.019, M_IRON, 6); };
        const L1 = (th1 - th0), nR = Math.max(3, Math.round(L1 / 0.11));
        for (let i = 0; i <= nR; i++) { const u = 0.07 + 0.86 * i / nR; riv(u, 0.075 / (half(th0 + L1 * u) * 2 * Math.sin(th0 + L1 * u)) * 0.9); riv(u, 1 - 0.075 / (half(th0 + L1 * u) * 2 * Math.sin(th0 + L1 * u)) * 0.9); }
        for (const u of [0.06, 0.94]) { const th = th0 + L1 * u, wv = half(th) * 2 * Math.sin(th), n = Math.max(1, Math.round(wv / 0.11)); for (let i = 1; i < n; i++) riv(u, i / n); }
        // the iris plates carry a raised forged lip toward the eye
        if (k === 0) B.surf((s, w) => { const th = th0 + 0.02, ph = (s - 0.5) * 2 * half(th) * 0.92, rr = RO + 0.012 + 0.03 * Math.sin(w * Math.PI); return toL(vmul(dirE(th + w * 0.07, ph), rr)); }, 8, 4, () => M_TEMPER, { e: (s, w) => 0.8 });
        out['r' + k] = B.done(); });
      // ---- the back cap ----
      { const B = nb(); B.surf((u, v) => vmul(dirE(lerp(BACK0, Math.PI, u), v * TAU), RO - 0.015 * u), 6, 24, () => M_PLATE, { flip: true, e: (u) => u < 0.15 ? 1 - u / 0.15 : 0 });
        for (let i = 0; i < 16; i++) { const p = vmul(dirE(BACK0 + 0.06, i / 16 * TAU), RO + 0.003); B.sph(p, 0.02, M_IRON, 6); }
        out.back = B.done(); }
      // ---- the molten core and the eye ----
      { const B = nb(); B.sph([0, 0, 0], RC, M_CORE, 30); out.core = B.done(); }
      { const B = nb(); B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0, 0]);
        B.ell([0, 0, 0.78], [0.3, 0.3, 0.2], M_CORE, { th0: 0, th1: Math.PI / 2, seg: 30, rings: 10 }); B.pop(); out.eye = B.done(); }
      { const B = nb(); B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0, 0]);
        B.tor([0, 0, 0.925], 0.322, 0.036, M_TEMPER, { seg: 32, rseg: 7 }); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; B.sph([Math.cos(a) * 0.356, Math.sin(a) * 0.356, 0.915], 0.017, M_IRON, 6); }
        B.pop(); out.socket = B.done(); }
      // ---- the crown: a forged collar on top, a riveted band, eight short blunt projections round a bowl of embers ----
      { const B = nb(); B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]);   // (the lathe's axis up)
        B.lathe([[0.79, 0.64], [0.84, 0.6], [0.9, 0.53], [0.97, 0.48], [1.03, 0.455], [1.07, 0.47], [1.1, 0.5], [1.14, 0.5], [1.165, 0.47], [1.16, 0.4], [1.12, 0.34], [1.09, 0.3, M_IRON], [1.09, 0.3, M_EMBER], [1.08, 0.18], [1.075, 0.0]], M_IRON, { seg: 32, edge: j => (j === 6 || j === 7 || j === 8) ? 0.9 : j < 2 ? 0.6 : 0.2 });
        B.tor([0.955, 0, 0], 0.49, 0.026, M_IRON, { seg: 32, rseg: 6 });
        B.pop();
        // (the band and its rivets, in the model frame)
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; B.sph([Math.cos(a) * 0.512, Math.sin(a) * 0.512, 0.955], 0.017, M_IRON, 6); }
        for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU, ca = Math.cos(a), sa = Math.sin(a), h = i % 2 ? 0.2 : 0.27, lean = 0.4;
          const base = [ca * 0.47, sa * 0.47, 1.1], tip = [ca * (0.47 + h * Math.sin(lean)), sa * (0.47 + h * Math.sin(lean)), 1.1 + h * Math.cos(lean)];
          B.tube(base, tip, 0.072, 0.03, M_IRON, { seg: 4, cap0: 'flat', cap1: 'flat', edge: 0.6, mf: u => u > 0.55 ? M_TEMPER : M_IRON }); }
        // embers heaped in the bowl
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, r = 0.08 + hash(i) * 0.18; B.sph([Math.cos(a) * r, Math.sin(a) * r, 1.09 + hash(i + 9) * 0.02], 0.045 + hash(i + 4) * 0.03, M_EMBER, 6); }
        out.crown = B.done(); }
      // ---- the fuse: six braided pieces (each hidden as it burns), around the curve; vA.y round it, vA.z along it ----
      for (let j = 0; j < FUSE_N; j++) { const B = nb(), u0 = j / FUSE_N, u1 = (j + 1) / FUSE_N;
        B.surf((u, v) => { const s = lerp(u0, u1, u), p = fuseAt(s), q = fuseAt(Math.min(1, s + 0.01)), p0 = fuseAt(Math.max(0, s - 0.01)), t = vnrm(vsub(q, p0)), a = vnrm(vcross(t, [0, 1, 0])), b = vcross(t, a), r = 0.072 * (1 - 0.18 * s) * (1 + 0.06 * Math.sin(v * TAU * 3 + s * 60)), ph = v * TAU;
          return vadd(p, vadd(vmul(a, Math.cos(ph) * r), vmul(b, Math.sin(ph) * r))); }, 6, 12, () => M_FUSE, { flip: true, e: (u, v) => v, a: u => lerp(u0, u1, u) });
        out['fuse' + j] = B.done(); }
      { const B = nb(); B.sph([0, 0, 0], 0.075, M_EMBER, 10); out.fusetip = B.done(); }
      for (const k in out) BOUND[k] = bounds(out[k]);
      return out;
    }

    /* ---------------- the rig: the pose -> the parts in the model frame ----------------
       P: open 0..1 (the plates parted: 0.6 a vent, 1 the furnace of phase 3), breath 0..1, beat 0..1 (the heartbeat's
       kick), iris 0..1 (the iris plates drawn in round the eye), glow (the core's heat), rune 0..1 (anger), heat 0..1 (the
       edges' temper colour), fuse 0..1 (left of it), fuseLit 0..1, pitch, roll, crack 0..1 (dead: the shell fallen
       apart), zc (the centre's height above the floor, model units, for the fallen pieces), dark 0..1 (inert), jolt
       (a struck shake), look (the eye's glance, radians) */
    const inst = [];
    function rig(P, t) {
      const out = { inst: [], A: {} }, I = (part, R, o, s, x) => { out.inst.push(Object.assign({ part, R, o, s: s == null ? 1 : s, al: 1, glow: 1, rune: 0, seed: 0, kind: 0 }, x || {})); };
      const open = cl(P.open || 0), br = P.breath || 0, bt = P.beat || 0, crack = cl(P.crack || 0), dark = cl(P.dark || 0), zc = P.zc == null ? 1.2 : P.zc;
      const glow = Math.max(0, (P.glow == null ? 0.7 : P.glow) * (1 - dark * 0.92)), rune = cl(P.rune || 0) * (1 - dark), heat = P.heat == null ? 0.6 : P.heat;
      const Rb = mm(rotZ(P.look || 0), mm(rotY(P.pitch || 0), rotX(P.roll || 0)));
      const sc = 1 + 0.016 * br + 0.012 * bt, sepB = 0.006 + 0.014 * br + 0.016 * bt + 0.3 * ease(open) + 0.012 * (P.jolt || 0);
      const fallU = p => cl((crack - p.fall.delay * 0.6) / 0.7);
      // the plates
      for (const p of PLATES) {
        const R = RINGS[p.k], iris = p.k === 0 ? (P.iris || 0) * 0.13 - open * 0.12 : 0, jit = hash(p.sd * 91 + 1);
        let Rm = mm(rotX(p.ph), mm(rotZ(-iris), p.B));
        // parted: each plate goes its own way a little (more out, a small tilt about its own tangent)
        const sep = sepB * (0.85 + 0.35 * jit) + (P.jolt || 0) * 0.02 * Math.sin(t * 40 + p.sd * 20);
        if (open > 0.01) Rm = mm(rotAxis(Rm.y, (jit - 0.5) * 0.22 * open), Rm);
        let R2 = mm(Rb, Rm), o = vmul(R2.z, sep);
        if (crack > 0) { const u = fallU(p); if (u > 0) { const f = p.fall, dW = [Math.cos(f.a), Math.sin(f.a) * 0.9, 0], rest = [dW[0] * (RO + f.d), dW[1] * (RO + f.d), -zc + 0.05], up = 0.5 + 0.5 * f.d;
          const Rf = mm(rotZ(f.yaw), mm(rotX(f.tilt), f.flip ? rotX(Math.PI) : I3())); const ue = u * u;
          o = vlerp(vadd(o, vmul(R2.z, u * 0.4)), rest, ue); o[2] += Math.sin(Math.PI * Math.min(1, u * 1.1)) * up * (1 - ue * 0.3) * (u < 0.9 ? 1 : 0.4); R2 = mslerp(R2, mm(Rf, M3([1, 0, 0], [0, 1, 0], [0, 0, 1])), ease(u)); } }
        I(p.name, R2, vmul(o, 1), sc, { mesh: 'r' + p.k, glow, rune: rune * (0.85 + 0.3 * jit), seed: p.sd, heat: heat * (1 - dark * 0.75) });
      }
      // the back cap
      { let Rm = Rb, o = vmul(mv(Rb, [-1, 0, 0]), sepB * 0.8); if (crack > 0) { const u = cl((crack - 0.2) / 0.7); o = vlerp(o, [-RO - 0.9, 0.2, -zc + 0.05], u * u); o[2] += Math.sin(Math.PI * u) * 0.8; Rm = mslerp(Rb, mm(rotY(Math.PI / 2), I3()), ease(u)); } I('back', Rm, o, sc, { mesh: 'back', glow, rune, seed: 0.37, heat }); }
      // the core: it swells with the breath and the beat, pulses as a furnace when open; dead it settles, dark slag
      { const cs = (1 + 0.02 * br + 0.03 * bt + 0.04 * open * Math.sin(t * 5.2)) * (1 - 0.12 * crack); const o = [0, 0, -crack * crack * (zc - 0.75)]; I('core', Rb, o, cs, { mesh: 'core', glow: glow * (1 + 0.35 * open) + 0.25 * bt, seed: 0 }); out.A.core = o; }
      // the eye: a molten lens in its forged socket, at the front of the iris
      { const ex = sepB * 0.4 + 0.02 * bt, Re = Rb; let o = vmul(mv(Re, [1, 0, 0]), ex - crack * 0.1); if (crack > 0) o = vadd(o, [0, 0, -crack * crack * (zc - 0.75)]);
        if (crack < 0.5) { I('eye', Re, o, 1 - crack * 0.4, { mesh: 'eye', glow: glow * 1.15 + 0.3 * rune, rune, kind: 1, seed: 0 }); I('socket', Re, o, 1, { mesh: 'socket', glow, seed: 0.61, heat }); }
        out.A.eye = vadd(o, mv(Re, [0.98, 0, 0])); }
      // the crown and the fuse: they ride on the top plates as the shell parts
      { const top = mv(Rb, [0, 0, 1]); let o = vmul(top, sepB * 0.9 + 0.01 * br), Rc = Rb;
        if (crack > 0) { const u = cl((crack - 0.1) / 0.8); o = vlerp(o, [0.3, -1.4, -zc - 0.9], u * u); o[2] += Math.sin(Math.PI * u) * 0.9; Rc = mslerp(Rb, mm(rotX(1.35), mm(rotZ(0.6), I3())), ease(u)); }
        I('crown', Rc, o, 1, { mesh: 'crown', glow: glow * 0.9 * (1 - crack), seed: 0.22, heat });
        const left = cl(P.fuse == null ? 1 : P.fuse), n = left * FUSE_N, lit = cl(P.fuseLit == null ? 1 : P.fuseLit);
        for (let j = 0; j < FUSE_N; j++) { if (j >= Math.ceil(n - 1e-6)) break; I('fuse' + j, Rc, o, 1, { mesh: 'fuse' + j, glow: (0.15 + 0.85 * lit) * (j >= n - 1.5 ? 1.2 : 0.35) * (1 - dark), seed: j * 0.1 }); }
        const tipL = fuseAt(left), tipW = vadd(o, mv(Rc, tipL));
        if (left > 0.02 && lit > 0.02 && crack < 0.4) I('fusetip', Rc, vadd(o, mv(Rc, tipL)), 0.8 + 0.4 * lit + 0.25 * Math.sin(t * 23), { mesh: 'fusetip', glow: 0.6 + lit * 1.1, seed: 0 });
        out.A.fuseTip = tipW; out.A.fuseDir = vnrm(mv(Rc, vsub(fuseAt(Math.min(1, left + 0.05)), fuseAt(Math.max(0, left - 0.05))))); out.A.crown = vadd(o, mv(Rc, [0, 0, 1.1])); }
      out.A.center = [0, 0, 0]; out.A.bottom = mv(Rb, [0, 0, -1]);
      // the 'fusetip' part is placed at its own spot: give it an identity mesh frame
      return out;
    }

    /* ---------------- drawing ---------------- */
    const CW = [0, VY, VZ], EXW = [1, 0, 0], EYW = vcross(CW, EXW);
    const LW = vnrm([-0.55, 0.25, 0.8]), SBW = vnrm([-0.25, -0.35, 0.9]), RIMW = vnrm([0.6, -0.7, 0.35]), UPW = [0, 0, 1];
    function mkView(x, y, z, a, o) {
      const T = o.T, sc = o.scale || 1, k = T * sc, Rh = rotZ(a), X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T;
      const toS = p => { const w = mv(Rh, p); return [X0 + w[0] * k, Y0 + (w[1] * GY - w[2] * ZK) * k]; };
      const toW = p => { const w = mv(Rh, p); return { x: x + w[0] * sc, y: y + w[1] * GY * sc, z: z + w[2] * sc }; };
      const depth = p => vdot(mv(Rh, p), CW);
      return { T, sc, k, Rh, toS, toW, depth, x, y, z, a };
    }
    let LAST = null, NOGL = false, GLFAIL = 0, GLRETRY = 0, GLMS = 0, GLN = 0, GLBOX = null, GLLAST = 0; const GLI = [], GLJ = [];
    const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
    const glOn = () => { if (NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__CALBOMB_GL)) return false;
      if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Bomb King: meshes', e); return false; } } return true; };
    const GLCAP = 1500, RIMC = [1.45, 0.6, 0.24], AMBC = [1.0, 0.9, 0.86];
    function glPass(c, V, P, list, al0, t) {
      const k = V.k, PX = EXW, PY = [0, GY, -ZK], PD = CW, X0 = V.toS([0, 0, 0]);
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      for (const it of list) { const Bd = BOUND[it.mesh]; if (!Bd) continue; const rr = Bd.R * it.s * 1.04 * k, w = mv(V.Rh, vadd(it.o, mv(it.R, vmul(Bd.c, it.s)))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
        if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
      if (!(bx1 > bx0)) return;
      const m = c.getTransform ? c.getTransform() : null, dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (GLM.soft && !(typeof window !== 'undefined' && window.__CALBOMB_GLHQ) ? 0.4 : 1);
      let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sk = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sk)); H = Math.max(2, Math.ceil(H * sk));
      const bw = bx1 - bx0, bh = by1 - by0;
      const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: lowFx(), rim: RIMC, amb: AMBC, t: t % 600 };
      let n = 0; const items = GLJ; items.length = 0;
      for (const it of list) { const mesh = MESH[it.mesh]; if (!mesh) continue; const Rw = mm(V.Rh, it.R), s2 = it.s, T = mv(V.Rh, it.o);
        const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
        g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2; g.R1[i] = Rw.y[i] * s2; g.R2[i] = Rw.z[i] * s2; g.T[i] = T[i]; }
        g.alpha = al0 * it.al; g.glow = it.glow; g.glow2 = it.rune || 0; g.spill = it.heat == null ? 0.6 : it.heat; g.wear = it.seed || 0; g.kind = it.kind || 0; g.fx = 0; g.d = vdot(T, PD); items.push(g); }
      items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
      const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return;
      c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++; GLBOX = [W, H];
    }
    /* the 2D picture (no WebGL): the same rig, each plate a flat-lit facet, far to near, over the core's glow */
    const IRON = [[14, 12, 12], [34, 30, 28], [62, 56, 50]];
    function plateOutline(k) { const R = RINGS[k], Bs = ringBasis(R), dph = TAU / R.n, gap = 0.02, half = th => Math.max(0.05, dph / 2 - gap / (2 * Math.sin(th))), toL = p => [vdot(p, Bs.x), vdot(p, Bs.y), vdot(p, Bs.z)], pts = [];
      const at = (u, v) => { const th = R.t0 + (R.t1 - R.t0) * u, ph = (v - 0.5) * 2 * half(th); return toL(vmul(dirE(th, ph), RO)); };
      for (let i = 0; i <= 4; i++) pts.push(at(i / 4, 0)); for (let i = 1; i <= 4; i++) pts.push(at(1, i / 4)); for (let i = 1; i <= 4; i++) pts.push(at(1 - i / 4, 1)); for (let i = 1; i < 4; i++) pts.push(at(0, 1 - i / 4)); return pts; }
    let OUTL = null; const FB = [];
    function drawFallback(c, V, R, P, al0, t) {
      if (!OUTL) OUTL = RINGS.map((_, k) => plateOutline(k));
      const k = V.k, glow = Math.max(0, P.glow == null ? 0.7 : P.glow) * (1 - cl(P.dark || 0) * 0.9), rune = cl(P.rune || 0), Lw = mv(mT(V.Rh), LW), Cw = mv(mT(V.Rh), CW);
      c.save(); c.globalAlpha = al0;
      // the core behind everything
      const core = R.inst.find(i => i.part === 'core'), cp = V.toS(core ? core.o : [0, 0, 0]), cr = RC * k * (core ? core.s : 1);
      { const g = c.createRadialGradient(cp[0] - cr * 0.2, cp[1] - cr * 0.25, cr * 0.1, cp[0], cp[1], cr); const gk = Math.min(1, glow); g.addColorStop(0, `rgb(${Math.round(40 + 215 * gk)},${Math.round(30 + 190 * gk)},${Math.round(25 + 65 * gk)})`); g.addColorStop(0.55, `rgb(${Math.round(30 + 210 * gk)},${Math.round(22 + 70 * gk)},${Math.round(18 + 4 * gk)})`); g.addColorStop(1, `rgb(${Math.round(16 + 54 * gk)},${Math.round(12 + 0 * gk)},${Math.round(10 - 6 * gk)})`); c.fillStyle = g; c.beginPath(); c.arc(cp[0], cp[1], cr, 0, TAU); c.fill(); }
      FB.length = 0;
      for (const it of R.inst) { const kk = it.mesh && it.mesh[0] === 'r' ? +it.mesh[1] : -1; if (kk < 0) continue;
        const nW = it.R.z, face = vdot(nW, Cw); if (face < -0.05 && !(P.crack > 0)) continue;
        const pts = OUTL[kk].map(p => V.toS(vadd(it.o, mv(it.R, vmul(p, it.s))))), ctr = vadd(it.o, mv(it.R, [0, 0, RO]));
        FB.push({ d: V.depth(ctr), pts, li: Math.max(0, vdot(nW, Lw)), face, seed: it.seed, rune: it.rune, ctr: V.toS(ctr) }); }
      const back = R.inst.find(i => i.part === 'back');
      FB.sort((p, q) => p.d - q.d);
      for (const f of FB) { const sh = 0.35 + 0.65 * f.li, ci = sh > 0.7 ? 2 : sh > 0.45 ? 1 : 0, base = IRON[ci], u = (sh - [0, 0.45, 0.7][ci]) / 0.35, col = base.map((v, i) => Math.round(v * (0.75 + 0.5 * u) + (f.seed - 0.5) * 10));
        c.beginPath(); f.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
        c.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`; c.fill(); c.lineJoin = 'round'; c.strokeStyle = `rgba(150,${Math.round(110 + 30 * f.li)},150,${0.18 + 0.2 * f.li})`; c.lineWidth = Math.max(1, k * 0.03); c.stroke();   // (the blued edge)
        if (f.rune > 0.05 || glow > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,${Math.round(110 + 80 * f.rune)},40,${0.12 + 0.55 * f.rune})`; c.lineWidth = Math.max(1, k * 0.018); const s = k * 0.07, x = f.ctr[0], y = f.ctr[1]; c.beginPath(); c.moveTo(x, y - s); c.lineTo(x, y + s); c.moveTo(x - s * 0.6, y - s * 0.3); c.lineTo(x + s * 0.6, y + s * 0.4); c.stroke(); c.restore(); } }
      // the eye, the crown, the fuse
      const eye = R.inst.find(i => i.part === 'eye'); if (eye) { const ep = V.toS(vadd(eye.o, mv(eye.R, [0.92, 0, 0]))), er = 0.25 * k * eye.s, fw = vdot(eye.R.x, Cw);
        if (fw > -0.2) { c.save(); c.translate(ep[0], ep[1]); c.scale(1, 0.4 + 0.6 * Math.max(0, fw)); const g = c.createRadialGradient(0, 0, 0, 0, 0, er); g.addColorStop(0, '#FFF6D8'); g.addColorStop(0.4, '#FFB040'); g.addColorStop(1, '#C02A08'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, er, 0, TAU); c.fill(); c.strokeStyle = '#3A3230'; c.lineWidth = Math.max(1.5, k * 0.05); c.stroke(); c.restore(); } }
      const crown = R.inst.find(i => i.part === 'crown'); if (crown) { const cc = V.toS(vadd(crown.o, mv(crown.R, [0, 0, 1.05]))), cr2 = 0.5 * k; c.fillStyle = '#2A2523'; c.beginPath(); c.ellipse(cc[0], cc[1], cr2, cr2 * 0.45, 0, 0, TAU); c.fill(); c.strokeStyle = '#7A6A58'; c.lineWidth = Math.max(1, k * 0.03); c.stroke();
        for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU, b0 = V.toS(vadd(crown.o, mv(crown.R, [Math.cos(a) * 0.47, Math.sin(a) * 0.47, 1.1]))), b1 = V.toS(vadd(crown.o, mv(crown.R, [Math.cos(a) * 0.56, Math.sin(a) * 0.56, 1.3 - (i % 2) * 0.05]))); c.strokeStyle = '#3A3230'; c.lineWidth = Math.max(2, k * 0.07); c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.stroke(); }
        c.fillStyle = `rgba(255,120,30,${0.5 + 0.4 * glow})`; c.beginPath(); c.ellipse(cc[0], cc[1] - k * 0.02, cr2 * 0.55, cr2 * 0.22, 0, 0, TAU); c.fill();
        const fz = R.inst.filter(i => /^fuse\d/.test(i.part)); if (fz.length) { c.strokeStyle = '#4A3828'; c.lineWidth = Math.max(2, k * 0.13); c.lineCap = 'round'; c.beginPath(); const p0 = V.toS(vadd(crown.o, mv(crown.R, FUSE_PTS[0]))); c.moveTo(p0[0], p0[1]); const n = fz.length; for (let i = 1; i <= 10; i++) { const p = V.toS(vadd(crown.o, mv(crown.R, fuseAt(i / 10 * n / FUSE_N)))); c.lineTo(p[0], p[1]); } c.stroke(); } }
      c.restore();
    }
    /* the live 2D lights over the picture: the fuse's flame, the core's halo through parted plates, the eye's glow */
    function lights(c, V, R, P, al, t) {
      if (typeof glowSprite !== 'function' || typeof blitSized !== 'function') return; const k = V.k, A = R.A, glow = Math.max(0, (P.glow == null ? 0.7 : P.glow) * (1 - cl(P.dark || 0))), open = cl(P.open || 0), lit = cl(P.fuseLit == null ? 1 : P.fuseLit) * (1 - cl(P.crack || 0) * 2);
      c.save(); c.globalCompositeOperation = 'lighter'; const blob = (p, r, a2, col) => { if (!(a2 > 0.003)) return; const q = V.toS(p), rr = r * k; c.globalAlpha = Math.min(1, al * a2); blitSized(c, glowSprite(col), q[0] - rr, q[1] - rr, rr * 2, rr * 2); };
      if (open > 0.02) { blob(A.core, 1.5 + 0.4 * open, (0.12 + 0.25 * open) * Math.min(1.4, glow), '#FF7A2E'); blob(A.core, 0.9, 0.25 * open * Math.min(1.4, glow), '#FFD27A'); }
      blob(A.eye, 0.5, 0.18 + 0.2 * Math.min(1.2, glow) + 0.15 * cl(P.rune || 0), '#FF8A3A'); blob(A.eye, 0.22, 0.35 * Math.min(1.2, glow), '#FFE6A8');
      if (lit > 0.02 && cl(P.fuse == null ? 1 : P.fuse) > 0.02) { const fl = 0.75 + 0.25 * Math.sin(t * 31) * Math.sin(t * 17.3); blob(A.fuseTip, 0.42 * fl, 0.55 * lit, '#FF9A3A'); blob(A.fuseTip, 0.16, 0.9 * lit, '#FFF2C8');
        // a tongue of flame, licking up from the tip
        const q = V.toS(A.fuseTip); c.globalAlpha = al * 0.8 * lit; const h = k * (0.22 + 0.08 * Math.sin(t * 19)), w = k * 0.07; const g = c.createLinearGradient(q[0], q[1], q[0], q[1] - h); g.addColorStop(0, 'rgba(255,230,160,.95)'); g.addColorStop(0.5, 'rgba(255,140,40,.7)'); g.addColorStop(1, 'rgba(255,60,10,0)'); c.fillStyle = g;
        c.beginPath(); c.moveTo(q[0] - w, q[1]); c.quadraticCurveTo(q[0] - w * 0.8 + Math.sin(t * 13) * w * 0.5, q[1] - h * 0.6, q[0] + Math.sin(t * 9) * w, q[1] - h); c.quadraticCurveTo(q[0] + w * 0.8, q[1] - h * 0.5, q[0] + w, q[1]); c.closePath(); c.fill(); }
      c.restore();
    }
    /* draw(c, x, y, z, heading, pose, o): o = { T, sx, sy, t, scale } (x, y the ground point under its centre, z the
       centre's height, tiles) */
    function draw(c, x, y, z, a, P, o) {
      o = o || {}; const t = o.t != null ? o.t : nowMs() / 1000, R = rig(P, t), V = mkView(x, y, z, a, o); LAST = { R, V, P };
      const al0 = P.alpha == null ? 1 : P.alpha; if (!(al0 > 0.01)) return;
      if (glOn() && !o.flat) { let ok = true; try { glPass(c, V, P, R.inst, al0, t); } catch (e) { glFail(); ok = false; if (typeof console !== 'undefined') console.warn('Bomb King GL', e); } if (ok) { lights(c, V, R, P, al0, t); return; } }
      drawFallback(c, V, R, P, al0, t); lights(c, V, R, P, al0, t);
    }
    /* the ground beneath: a soft shadow (fainter and wider the higher it hangs) and the warm light its heat throws down */
    let BLOB = null;
    function drawShadow(c, x, y, z, P, o) {
      const T = o.T, sc = o.scale || 1, X = o.sx(x), Y = o.sy(y), h = Math.max(0, z / sc - 1), r = sc * T * (1.05 + h * 0.12), al = (P.alpha == null ? 1 : P.alpha);
      if (!BLOB) { BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const g = BLOB.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
      c.save(); c.globalAlpha = al * 0.62 / (1 + h * 0.35); c.drawImage(BLOB, X - r, Y - r * GY * 0.8, r * 2, r * 2 * GY * 0.8); c.restore();
      const glow = Math.max(0, (P.glow == null ? 0.7 : P.glow) * (1 - cl(P.dark || 0))), open = cl(P.open || 0);
      if (typeof glowSprite === 'function' && glow > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * Math.min(0.5, (0.1 + 0.22 * open) * glow / (1 + h * 0.5)); const rr = r * (1.1 + 0.3 * open); blitSized(c, glowSprite('#FF6A1E'), X - rr, Y - rr * 0.5, rr * 2, rr); c.restore(); }
    }
    function anchor(name) { if (!LAST) return null; const p = LAST.R.A[name]; if (!p) return null; return LAST.V.toW(p); }
    function blankPose() { return { open: 0, breath: 0, beat: 0, iris: 0, glow: 0.75, rune: 0.1, heat: 0.6, fuse: 1, fuseLit: 1, pitch: -0.12, roll: 0, look: 0, crack: 0, zc: 1.2, dark: 0, jolt: 0, alpha: 1 }; }
    return { draw, drawShadow, rig, anchor, blankPose, warm: () => { glOn(); return true; }, PLATES, RINGS, FUSE_N,
      __dbg: { get gl() { return glOn(); }, set noGL(v) { NOGL = !!v; }, get MESH() { return MESH; }, BOUND, get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +GLMS.toFixed(2), frames: GLN, box: GLBOX, meshMs: +MESH_MS.toFixed(1), meshTris: MESH ? Object.values(MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0 }); } } };
  })();

  return { MODEL, TAU, cl, lerp, sstep, ease, hash, hexA, GY, ZK, lowFx };
})();

/* =====================================================================================================================
   THE ARENA AND THE FIGHT
   The Bomb King's floor is a fiend arena (genFiendArena: a 30-tile disc); its three basalt blast shelters are carved
   into it (solid tiles, drawn as bound basalt columns), each with a SAFE side marked on the floor beyond it (an
   annular wedge in the shelter's shadow as seen from the arena's centre, where the King rises to detonate).
   ===================================================================================================================== */
const CALBOMB_FIGHT = (() => {
  const { MODEL, TAU, cl, lerp, sstep, ease, hash, hexA, ZK } = CALBOMB;
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const SCALE = 2.3, ZH = 3.3, ZV = 2.45, ZR = 5.7, ZS = 2.4, ZE = 12;   // the model's tiles per unit; its centre's heights: hovering, venting, risen to detonate, staggered, before it enters
  const WARN = '#FF5A2A', WARN_HI = '#FFC09A', SAFE = '#C8FFE8', SAFE_M = '#7FE8C0', SAFE_D = '#123A30', EMBER = '#FF7A2E', GOLD = '#FFD27A', HOT = '#FFE6A8', INK = '#120A08';
  const ARENA_R = 15, SH_R = 9.2, SH_HL = 1.75, SH_HD = 0.62, SH_ANG = [Math.PI * 1.5, Math.PI / 6, Math.PI * 5 / 6];
  const SAFE_A = Math.atan2(SH_HL * 0.92, SH_R), SAFE_R0 = SH_R + SH_HD + 0.2, SAFE_R1 = SH_R + 4.4;
  // the fight's timings (seconds) and measures (tiles)
  const TM = { volleyWind: 1.9, volleyLock: 1.0, volleyV: 6.0, volleyR: 0.42, spread: 0.6, orbitWind: 2.3, orbitV: 3.0, orbitW: 0.9, orbitGap: 0.62, vent: [5.2, 5.0, 4.6], ventShort: 3.6,
    fall: 1.1, fuse: 6, safe: 3, larvaR: 2.3, fly: 0.6, stagger: 4, longStagger: 7, charge: 7, hover: [1.7, 1.35, 1.15], coreNeed: 0.025 * 46000 / 161000 };   // (v389: the core window asks what it did in v388, in the pet's damage)
  const DMG = { ball: 0.95, orbit: 1.15, larva: 1.1, blast: 3.6, blastCap: 0.55 };
  // its health as a level-1 starter feels it: the bars the engine gives a fiend of floor 1 are far more than a starter can
  // spend in two and a half minutes, so every blow is scaled (in dmgK) to make its whole health worth EFF_HP of the pet's
  // damage (the bars still drain as they should). A rift may set Rf.calBombHp to change it
  const EFF_HP = 161000;   // (v389: 7 bars, each as big as v388's 2: x3.5; the user)   // (v388: doubled at the user's request)   // (QA v386: was 12000, for a level-1 pet; the pet arrives here at about level 8)
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const toward = (v, want, dt, k) => v + (want - v) * Math.min(1, dt * k);
  const shelterList = C => SH_ANG.map((a, i) => ({ i, a, x: C.x + Math.cos(a) * SH_R, y: C.y + Math.sin(a) * SH_R, tx: -Math.sin(a), ty: Math.cos(a), nx: Math.cos(a), ny: Math.sin(a) }));
  const inRect = (s, x, y, pad) => { const dx = x - s.x, dy = y - s.y, u = dx * s.tx + dy * s.ty, v = dx * s.nx + dy * s.ny; return Math.abs(u) < SH_HL + (pad || 0) && Math.abs(v) < SH_HD + (pad || 0); };
  const safeOf = (C, x, y) => { const d = Math.hypot(x - C.x, y - C.y), a = Math.atan2(y - C.y, x - C.x); if (d < SAFE_R0 || d > SAFE_R1) return -1; for (let i = 0; i < SH_ANG.length; i++) if (Math.abs(angTo(SH_ANG[i], a)) < SAFE_A * (0.55 + 0.45 * (d - SAFE_R0) / (SAFE_R1 - SAFE_R0) + 0.45)) return i; return -1; };
  const safeSpot = (C, i) => { const a = SH_ANG[i], r = SH_R + SH_HD + 1.7; return { x: C.x + Math.cos(a) * r, y: C.y + Math.sin(a) * r }; };
  const nearestShelter = (C, x, y) => { let b = 0, bd = 1e9; for (let i = 0; i < SH_ANG.length; i++) { const p = safeSpot(C, i), d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; b = i; } } return { i: b, d: bd, p: safeSpot(C, b) }; };
  const shelterTiles = (C, s) => { const out = []; for (let ty = Math.floor(s.y) - 3; ty <= Math.floor(s.y) + 3; ty++) for (let tx = Math.floor(s.x) - 3; tx <= Math.floor(s.x) + 3; tx++) if (inRect(s, tx + 0.5, ty + 0.5, 0.08)) out.push([tx, ty]); return out; };
  // (the stage module made for this fight, found by its game)
  let CUR = null;

  /* ---------- the painter's helpers ---------- */
  const glowAt = (c, x, y, r, col, a) => { if (!(r > 0) || !(a > 0.004) || typeof glowSprite !== 'function') return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col, edge) => { c.save(); c.font = `900 ${Math.round(size)}px ${typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = Math.max(3, size * 0.22); c.strokeStyle = edge || 'rgba(10,4,2,.85)'; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); c.restore(); };
  // a shield glyph (the SAFE mark: shape, not colour alone)
  function shieldPath(c, x, y, s) { c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x + s * 0.85, y - s * 0.85, x + s * 0.8, y - s * 0.2); c.quadraticCurveTo(x + s * 0.65, y + s * 0.6, x, y + s); c.quadraticCurveTo(x - s * 0.65, y + s * 0.6, x - s * 0.8, y - s * 0.2); c.quadraticCurveTo(x - s * 0.85, y - s * 0.85, x, y - s); c.closePath(); }
  // a bomb glyph (the warning mark on a fuse circle)
  function bombGlyph(c, x, y, s, col) { c.save(); c.fillStyle = col; c.beginPath(); c.arc(x, y + s * 0.15, s * 0.62, 0, TAU); c.fill(); c.fillRect(x - s * 0.18, y - s * 0.65, s * 0.36, s * 0.3); c.strokeStyle = col; c.lineWidth = Math.max(1, s * 0.12); c.beginPath(); c.moveTo(x, y - s * 0.62); c.quadraticCurveTo(x + s * 0.3, y - s * 0.95, x + s * 0.55, y - s * 0.8); c.stroke(); c.restore(); }

  /* ---------- the ground: a foundry floor of riveted iron plates over the caldera, a rune ring, grates over lava ---------- */
  function paintGround(c, A) {
    const R = A.R, rnd = A.rnd;
    // the lava under it all, seen past the rim
    let g = c.createRadialGradient(0, 0, R - 1, 0, 0, R + 1.6); g.addColorStop(0, '#3A0E04'); g.addColorStop(0.5, '#B83A0A'); g.addColorStop(0.75, '#5A1A06'); g.addColorStop(1, 'rgba(30,8,3,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.6, 0, TAU); c.fill();
    // the floor
    g = c.createRadialGradient(-R * 0.25, -R * 0.3, 1, 0, 0, R); g.addColorStop(0, '#2C2522'); g.addColorStop(0.65, '#221C1A'); g.addColorStop(1, '#161110'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.05, 0, TAU); c.fill();
    // plates: rings of radial segments, each its own shade, bevelled, with a rivet row
    const rings = [[4.6, 7.8, 10], [7.8, 11.2, 16], [11.2, R - 0.1, 22]];
    for (const [r0, r1, n] of rings) { const off = rnd() * TAU;
      for (let i = 0; i < n; i++) { const a0 = off + i / n * TAU + 0.004, a1 = off + (i + 1) / n * TAU - 0.004, k = rnd();
        c.beginPath(); c.arc(0, 0, r1 - 0.03, a0, a1); c.arc(0, 0, r0 + 0.03, a1, a0, true); c.closePath();
        c.fillStyle = `rgba(${48 + k * 22},${40 + k * 16},${36 + k * 12},.55)`; c.fill();
        c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 0.07; c.stroke();
        c.save(); c.clip(); c.strokeStyle = 'rgba(255,220,190,.06)'; c.lineWidth = 0.12; c.beginPath(); c.arc(0, 0, r1 - 0.12, a0, a1); c.stroke(); c.restore();
        for (let j = 0; j < 5; j++) { const a = lerp(a0, a1, (j + 0.5) / 5); for (const rr of [r0 + 0.22, r1 - 0.22]) { const x = Math.cos(a) * rr, y = Math.sin(a) * rr; c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.arc(x + 0.02, y + 0.03, 0.07, 0, TAU); c.fill(); c.fillStyle = 'rgba(150,130,115,.5)'; c.beginPath(); c.arc(x - 0.01, y - 0.01, 0.05, 0, TAU); c.fill(); } } } }
    // the dais: a great ring of engraved runes round the King's place
    c.beginPath(); c.arc(0, 0, 4.6, 0, TAU); c.fillStyle = 'rgba(26,20,18,.9)'; c.fill();
    for (const [r, w, a] of [[4.45, 0.16, 0.45], [3.7, 0.08, 0.4], [2.2, 0.1, 0.4], [1.2, 0.06, 0.35]]) { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.strokeStyle = `rgba(0,0,0,${a + 0.2})`; c.lineWidth = w + 0.06; c.stroke(); c.strokeStyle = `rgba(190,120,70,${a * 0.5})`; c.lineWidth = w * 0.5; c.stroke(); }
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, x = Math.cos(a) * 4.08, y = Math.sin(a) * 4.08; c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.strokeStyle = 'rgba(0,0,0,.65)'; c.lineWidth = 0.09; c.beginPath(); const h = 0.24, sx = i % 2 ? 1 : -1; c.moveTo(0, -h); c.lineTo(0, h); c.moveTo(0, -h * 0.2); c.lineTo(sx * h * 0.6, -h * 0.75); if (i % 3) { c.moveTo(-h * 0.45, h * 0.6); c.lineTo(h * 0.45, h * 0.6); } c.stroke(); c.strokeStyle = 'rgba(255,150,70,.18)'; c.lineWidth = 0.035; c.stroke(); c.restore(); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.26; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 0.08; c.beginPath(); c.moveTo(Math.cos(a) * 1.2, Math.sin(a) * 1.2); c.lineTo(Math.cos(a) * 3.7, Math.sin(a) * 3.7); c.stroke(); }
    // grates over the lava at the rim, between the shelters
    for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * TAU + Math.PI / 6 - 0.15, w = 0.3, r0 = R - 2.4, r1 = R - 0.5;
      c.save(); c.beginPath(); c.arc(0, 0, r1, a - w, a + w); c.arc(0, 0, r0, a + w, a - w, true); c.closePath(); c.fillStyle = '#100604'; c.fill(); c.clip();
      const gg = c.createRadialGradient(Math.cos(a) * (r0 + r1) / 2, Math.sin(a) * (r0 + r1) / 2, 0.2, Math.cos(a) * (r0 + r1) / 2, Math.sin(a) * (r0 + r1) / 2, 2.2); gg.addColorStop(0, 'rgba(255,140,40,.85)'); gg.addColorStop(0.6, 'rgba(190,50,10,.5)'); gg.addColorStop(1, 'rgba(60,10,4,.2)'); c.fillStyle = gg; c.fillRect(-R, -R, R * 2, R * 2);
      c.strokeStyle = '#1A1210'; c.lineWidth = 0.13; for (let k = 0; k <= 9; k++) { const aa = a - w + k / 9 * 2 * w; c.beginPath(); c.moveTo(Math.cos(aa) * r0, Math.sin(aa) * r0); c.lineTo(Math.cos(aa) * r1, Math.sin(aa) * r1); c.stroke(); }
      for (const rr of [r0 + 0.6, r0 + 1.3]) { c.beginPath(); c.arc(0, 0, rr, a - w, a + w); c.stroke(); } c.restore();
      c.beginPath(); c.arc(0, 0, r1, a - w, a + w); c.arc(0, 0, r0, a + w, a - w, true); c.closePath(); c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = 0.14; c.stroke(); }
    // soot, slag and scorch
    for (let i = 0; i < 90; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (R - 0.6), x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.3 + rnd() * 1.6, gg = c.createRadialGradient(x, y, 0, x, y, r), dark = rnd() < 0.7; gg.addColorStop(0, dark ? 'rgba(0,0,0,.28)' : 'rgba(150,70,30,.12)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 16; i++) { let x = (rnd() - 0.5) * R * 1.6, y = (rnd() - 0.5) * R * 1.6; if (Math.hypot(x, y) > R - 1) continue; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (rnd() - 0.5) * 1.2; y += (rnd() - 0.5) * 1.2; c.lineTo(x, y); } c.stroke(); }
    // the rim: a heavy forged lip
    c.beginPath(); c.arc(0, 0, R, 0, TAU); c.strokeStyle = '#0C0807'; c.lineWidth = 0.42; c.stroke(); c.strokeStyle = 'rgba(160,110,80,.35)'; c.lineWidth = 0.1; c.beginPath(); c.arc(-0.03, -0.05, R - 0.12, 0, TAU); c.stroke();
    for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; c.fillStyle = 'rgba(140,110,90,.5)'; c.beginPath(); c.arc(Math.cos(a) * (R - 0.02), Math.sin(a) * (R - 0.02), 0.07, 0, TAU); c.fill(); }
    // the shelters' footings: scorched aprons, and the SAFE side's worn floor (its live marking is painted over it)
    for (const s of shelterList({ x: 0, y: 0 })) { const gg = c.createRadialGradient(s.x, s.y, 0.5, s.x, s.y, 3.2); gg.addColorStop(0, 'rgba(0,0,0,.4)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(s.x - 3.5, s.y - 3.5, 7, 7); }
  }
  /* the cavern beyond: a dark vault, distant lavafalls, the glow of the caldera below (painted once, held still) */
  function paintSky(c, W, H, t, cam, T) {
    let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#080404'); g.addColorStop(0.45, '#1A0805'); g.addColorStop(1, '#3A1206'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(4242);
    for (let i = 0; i < 7; i++) { const x = W * (0.06 + i * 0.15 + (R() - 0.5) * 0.06), w = 5 + R() * 9, y0 = H * (0.05 + R() * 0.15); g = c.createLinearGradient(0, y0, 0, H); g.addColorStop(0, 'rgba(255,170,60,0)'); g.addColorStop(0.15, 'rgba(255,140,40,.55)'); g.addColorStop(1, 'rgba(200,50,10,.25)'); c.fillStyle = g; c.fillRect(x - w / 2, y0, w, H - y0);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25; if (typeof glowSprite === 'function') blitSized(c, glowSprite('#FF6A1E'), x - w * 4, H * 0.72, w * 8, H * 0.4); c.restore(); }
    for (let i = 0; i < 14; i++) { const x = R() * W, w = 30 + R() * 70, h = H * (0.2 + R() * 0.45); c.fillStyle = `rgba(10,5,4,${0.55 + R() * 0.35})`; c.beginPath(); c.moveTo(x - w, H); c.lineTo(x - w * 0.3, H - h); c.lineTo(x + w * 0.2, H - h * (0.85 + R() * 0.2)); c.lineTo(x + w, H); c.closePath(); c.fill(); }
    g = c.createLinearGradient(0, H * 0.6, 0, H); g.addColorStop(0, 'rgba(255,90,20,0)'); g.addColorStop(1, 'rgba(255,90,20,.18)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  /* a shelter: bound basalt columns (one to each solid tile, hexagonal tops), an iron blast plate strapped across the face
     toward the King, its SAFE side's shield sigil cut into the top */
  function drawShelter(c, FX, p, T, t) {
    const cols = p.cols.slice().sort((a, b) => a.y - b.y), s = p.s;
    for (const q of cols) { const X = FX.sx(q.x), Y = FX.sy(q.y), h = q.h * T * ZK, r = T * 0.56;
      const P = (i, cy, k) => { const a = i / 6 * TAU + q.rot; return [X + Math.cos(a) * r * (k || 1), cy + Math.sin(a) * r * (k || 1) * 0.62]; };
      const hex = (cy, k) => { c.beginPath(); for (let i = 0; i < 6; i++) { const p2 = P(i, cy, k); i ? c.lineTo(p2[0], p2[1]) : c.moveTo(p2[0], p2[1]); } c.closePath(); };
      // its faceted sides: the faces turned toward the camera, each lit by how it faces the key light (from the upper left)
      for (let i = 0; i < 6; i++) { const am = (i + 0.5) / 6 * TAU + q.rot; if (Math.sin(am) < -0.05) continue; const a = P(i, Y - h), b2 = P(i + 1, Y - h), lit = 0.5 - 0.5 * Math.cos(am + 0.5), v = Math.round(22 + 40 * (1 - lit) * (1 - lit) + 10 * hash(q.x * 3 + i));
        c.fillStyle = `rgb(${v + 4},${v},${v - 2})`; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.lineTo(b2[0], b2[1] + h); c.lineTo(a[0], a[1] + h); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = Math.max(1, T * 0.02); c.stroke(); }
      // cooling cracks across the front, a faint ember in one
      c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.moveTo(X - r * 0.8, Y - h * 0.35 + r * 0.3); c.lineTo(X - r * 0.1, Y - h * 0.42 + r * 0.45); c.lineTo(X + r * 0.6, Y - h * 0.3 + r * 0.35); c.stroke();
      if (q.ember) { c.strokeStyle = `rgba(255,${Math.round(110 + 40 * Math.sin(t * 2 + q.x))},40,.6)`; c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.moveTo(X - r * 0.5, Y - h * 0.62 + r * 0.4); c.lineTo(X + r * 0.15, Y - h * 0.7 + r * 0.5); c.stroke(); }
      // its top: weathered, lit
      hex(Y - h, 1); c.fillStyle = '#4C423D'; c.fill(); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = Math.max(1, T * 0.03); c.stroke();
      hex(Y - h - T * 0.01, 0.6); c.fillStyle = 'rgba(255,230,210,.07)'; c.fill(); }
    // the iron band strapped round the cluster and the blast plate on its face toward the King
    const fr = cols[0], bk = cols[cols.length - 1];
    { const u0 = -SH_HL, u1 = SH_HL, hb = 0.55 * T * ZK, P = (u, v) => [FX.sx(s.x + s.tx * u + s.nx * v), FX.sy(s.y + s.ty * u + s.ny * v)];
      const a = P(u0, -SH_HD - 0.05), b = P(u1, -SH_HD - 0.05), hh = Math.min(...cols.map(q => q.h)) * T * ZK * 0.8;
      c.fillStyle = '#231C1A'; c.beginPath(); c.moveTo(a[0], a[1] - hb); c.lineTo(b[0], b[1] - hb); c.lineTo(b[0], b[1] - hh); c.lineTo(a[0], a[1] - hh); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(200,150,110,.35)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(a[0], a[1] - hh); c.lineTo(b[0], b[1] - hh); c.stroke();
      c.fillStyle = 'rgba(150,120,100,.6)'; for (let i = 0; i <= 4; i++) { const u = i / 4, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u); c.beginPath(); c.arc(x, y - hb - (hh - hb) * 0.15, Math.max(1.2, T * 0.05), 0, TAU); c.arc(x, y - hh + (hh - hb) * 0.15, Math.max(1.2, T * 0.05), 0, TAU); c.fill(); } }
    void fr; void bk;
  }
  /* the props past the rim: basalt columns banded in iron with braziers, and forge machinery (pressure vessels) */
  function drawRimProp(c, FX, p, X, Y, T) {
    const s = T * (p.big ? 1.25 : 1);
    if (p.kind === 'vessel') { const w = s * 0.9, h = s * 2.4; let g = c.createLinearGradient(X - w, 0, X + w, 0); g.addColorStop(0, '#1A1412'); g.addColorStop(0.35, '#3A302C'); g.addColorStop(1, '#0C0908'); c.fillStyle = g;
      c.beginPath(); c.moveTo(X - w, Y); c.lineTo(X - w, Y - h); c.quadraticCurveTo(X, Y - h - w * 0.9, X + w, Y - h); c.lineTo(X + w, Y); c.ellipse(X, Y, w, w * 0.4, 0, 0, Math.PI); c.closePath(); c.fill();
      c.strokeStyle = '#4A3C34'; c.lineWidth = Math.max(1.5, s * 0.08); for (const k of [0.25, 0.6, 0.92]) { c.beginPath(); c.ellipse(X, Y - h * k, w, w * 0.4, 0, 0, Math.PI); c.stroke(); }
      c.fillStyle = 'rgba(255,120,40,.7)'; c.beginPath(); c.arc(X + w * 0.2, Y - h * 0.45, s * 0.12, 0, TAU); c.fill(); glowAt(c, X + w * 0.2, Y - h * 0.45, s * 0.5, '#FF6A1E', 0.4); return; }
    const w = s * 0.62, h = s * (2.6 + (p.v % 3) * 0.5); let g = c.createLinearGradient(X - w, 0, X + w, 0); g.addColorStop(0, '#221C1A'); g.addColorStop(0.4, '#3A322E'); g.addColorStop(1, '#0D0A09'); c.fillStyle = g;
    c.beginPath(); c.moveTo(X - w, Y); c.lineTo(X - w * 0.92, Y - h); c.lineTo(X + w * 0.92, Y - h); c.lineTo(X + w, Y); c.closePath(); c.fill();
    c.fillStyle = '#4A403C'; c.beginPath(); c.ellipse(X, Y - h, w * 0.92, w * 0.5, 0, 0, TAU); c.fill();
    c.strokeStyle = '#5A4436'; c.lineWidth = Math.max(1.5, s * 0.1); for (const k of [0.3, 0.75]) { c.beginPath(); c.moveTo(X - w, Y - h * k); c.lineTo(X + w, Y - h * k); c.stroke(); }
    if (p.v % 2 === 0) { c.fillStyle = '#1A1210'; c.beginPath(); c.ellipse(X, Y - h - s * 0.05, w * 0.7, w * 0.32, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,150,50,.85)'; c.beginPath(); c.ellipse(X, Y - h - s * 0.1, w * 0.5, w * 0.2, 0, 0, TAU); c.fill(); glowAt(c, X, Y - h - s * 0.3, s * 1.1, '#FF7A2E', 0.45); }
  }
  // the fire on a brazier flickers live
  function drawRimLive(c, FX, p, X, Y, T, t) { if (p.kind === 'vessel' || p.v % 2) return; const s = T * (p.big ? 1.25 : 1), h = s * (2.6 + (p.v % 3) * 0.5), w = s * 0.62, f = 0.7 + 0.3 * Math.sin(t * 9 + p.v) * Math.sin(t * 5.3 + p.v * 2);
    c.save(); const g = c.createLinearGradient(0, Y - h, 0, Y - h - s * 0.9 * f); g.addColorStop(0, 'rgba(255,220,140,.9)'); g.addColorStop(0.5, 'rgba(255,120,30,.6)'); g.addColorStop(1, 'rgba(255,60,10,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(X - w * 0.45, Y - h - s * 0.08); c.quadraticCurveTo(X - w * 0.2, Y - h - s * 0.6 * f, X + Math.sin(t * 7 + p.v) * w * 0.2, Y - h - s * 0.95 * f); c.quadraticCurveTo(X + w * 0.25, Y - h - s * 0.5 * f, X + w * 0.45, Y - h - s * 0.08); c.closePath(); c.fill(); c.restore(); }

  /* ---------- the larva bombs: small levitating iron bombs on four stubby feet, a glowing seam, a short fuse ---------- */
  function drawLarva(c, X, Y, T, o) {
    const r = T * 0.42, k = o.k == null ? 1 : o.k, flash = o.flash || 0, t = o.t || 0, h = (o.z || 0) * T * ZK;
    c.save(); c.translate(X, Y - h);
    if (!o.air) { c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(0, h + r * 0.15, r * 1.05, r * 0.38, 0, 0, TAU); c.fill(); }
    // feet
    c.fillStyle = '#16100E'; for (const [dx, dy] of [[-0.75, 0.35], [0.75, 0.35], [-0.42, 0.6], [0.42, 0.6]]) { c.beginPath(); c.ellipse(dx * r, dy * r - (o.air ? r * 0.1 : 0), r * 0.2, r * 0.12, 0, 0, TAU); c.fill(); }
    // the body
    const g = c.createRadialGradient(-r * 0.35, -r * 0.55, r * 0.1, 0, -r * 0.3, r * 1.1); g.addColorStop(0, '#6A5E58'); g.addColorStop(0.35, '#2E2624'); g.addColorStop(1, '#0A0706'); c.fillStyle = g; c.beginPath(); c.arc(0, -r * 0.35, r, 0, TAU); c.fill();
    // the seam round its middle and two plate seams, lit from within (red when armed)
    const hot = flash > 0.5 ? '#FF3A1A' : '#FF8A3A'; c.strokeStyle = hot; c.lineWidth = Math.max(1, r * 0.1); c.beginPath(); c.ellipse(0, -r * 0.3, r * 0.98, r * 0.32, 0, 0.05, Math.PI - 0.05); c.stroke();
    c.lineWidth = Math.max(1, r * 0.06); c.beginPath(); c.moveTo(-r * 0.2, -r * 1.3); c.quadraticCurveTo(-r * 0.45, -r * 0.6, -r * 0.3, -r * 0.05); c.moveTo(r * 0.45, -r * 1.2); c.quadraticCurveTo(r * 0.62, -r * 0.6, r * 0.5, -r * 0.1); c.stroke();
    glowAt(c, 0, -r * 0.3, r * (1.4 + flash * 1.2), flash > 0.5 ? '#FF2A10' : '#FF7A2E', 0.25 + 0.4 * flash);
    // the rim of the blued edge and a highlight
    c.strokeStyle = 'rgba(120,150,200,.35)'; c.lineWidth = Math.max(1, r * 0.07); c.beginPath(); c.arc(0, -r * 0.35, r * 0.95, -2.6, -1.0); c.stroke();
    c.fillStyle = 'rgba(255,240,220,.35)'; c.beginPath(); c.ellipse(-r * 0.4, -r * 0.82, r * 0.22, r * 0.12, -0.6, 0, TAU); c.fill();
    // the fuse stub and its spark
    c.strokeStyle = '#3A2A1E'; c.lineWidth = Math.max(1.5, r * 0.16); c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -r * 1.3); c.quadraticCurveTo(r * 0.1, -r * 1.65, r * 0.38, -r * 1.7); c.stroke();
    if (k > 0) { const f = 0.7 + 0.3 * Math.sin(t * 37); glowAt(c, r * 0.38, -r * 1.72, r * 0.6 * f, '#FFB040', 0.8); glowAt(c, r * 0.38, -r * 1.72, r * 0.22, '#FFFFFF', 0.9); }
    if (flash > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = flash * 0.55; c.fillStyle = '#FF4A20'; c.beginPath(); c.arc(0, -r * 0.35, r, 0, TAU); c.fill(); }
    c.restore();
  }

  /* =========================== THE FIGHT =========================== */
  const def = {
    arenaR: ARENA_R, firstAct: 'hover', ambient: 'embers', artY: 0.66,
    phaseNames: ['The Living Furnace', 'Royal Procession', 'Royal Detonation'],
    carve(set, C) { for (const s of shelterList(C)) for (const [tx, ty] of shelterTiles(C, s)) set(tx, ty, T_SOLID); },
    start(C) { return { x: C.x + 0.5, y: C.y + C.R - 2.6 }; },
    props(C) { const out = [];
      shelterList(C).forEach(s => { const cols = shelterTiles(C, s).map(([tx, ty], j) => ({ x: tx + 0.5 + (hash(tx * 5 + ty) - 0.5) * 0.3, y: ty + 0.5 + (hash(ty * 7 + tx) - 0.5) * 0.25, h: 0.95 + hash(tx * 7 + ty * 13) * 0.85, rot: hash(tx + ty * 3) * 1.0, ember: hash(tx * 3 + ty) < 0.35 })); out.push({ kind: 'shelter', i: s.i, x: s.x, y: s.y + SH_HD * Math.max(0, s.ny) + 0.3, s, cols }); });
      const R = mulberry32(777); for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * TAU, back = Math.sin(a) < 0.2; if (!back) continue; out.push({ kind: i % 4 === 1 ? 'vessel' : 'pillar', v: i, big: back, x: C.x + Math.cos(a) * (C.R + (back ? 1.6 : 1.0)), y: C.y + Math.sin(a) * (C.R + (back ? 1.2 : 0.7)) }); void R; }
      return out; },
    propKeep: { every: 30, only: p => p.kind !== 'shelter', box: p => [-1.6, -4.8, 1.6, 0.8] },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'shelter') { const me = FX.me, s = p.s, dx = me.x - s.x, dy = me.y - s.y, v = dx * s.nx + dy * s.ny, u = dx * s.tx + dy * s.ty, behind = me.y < p.y && Math.abs(u) < SH_HL + 1.2 && Math.hypot(dx, dy) < 4.5;
        c.save(); if (behind) c.globalAlpha = 0.55; drawShelter(c, FX, p, T, t); c.restore(); void v; return; } drawRimProp(c, FX, p, X, Y, T); },
    drawPropLive(c, FX, p, X, Y, T, t) { if (p.kind !== 'shelter') drawRimLive(c, FX, p, X, Y, T, t); },
    paintGround(c, A) { paintGround(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, t, cam, T); },
    overlay(c, FX, t, T) { overlay(c, FX, t, T); },
    init(FX) { const m = FX.m, M = FX.mem; m.noTouch = true; m.r = 2.6;
      Object.assign(M, { hd: Math.PI / 2, zc: ZE, zcTo: ZH, open: 0, openTo: 0, glow: 0.15, glowTo: 0.75, rune: 0, runeTo: 0.1, iris: 1, irisTo: 0, beat: 0, hbPh: 0, hbRate: 0.75, hbTo: 0.75, br: 0, bt: 0, jolt: 0, fuse: 1, fuseLit: 0, crack: 0, dark: 0, look: 0, pitch: -0.1,
        cyc: 0, wait: 2.2, ac: null, bombs: [], coreHit: 0, end: null, seen: {}, wasStun: false, stunKind: null, exposed: false, hpPrev: m.hp, passage: 0, sh: shelterList(FX.C),
        stat: { volleys: 0, balls: 0, ballHit: 0, orbits: 0, orbitHit: 0, orbitShel: 0, vents: 0, larvae: 0, returns: 0, retSup: 0, explodes: 0, larvaHit: 0, staggers: 0, charges: 0, intBomb: 0, intCore: 0, blasts: 0, sheltered: 0, blastHit: 0, dmgShell: 0, dmgOpen: 0, phaseAt: [], log: [] } });
      if (CUR && CUR.g === FX.H.g) { M.X = CUR.X; M.mod = CUR.mod; CUR.FX = FX; }
      if (useCal(M)) { const prev = CAL.onBombHit; if (!(prev && prev.calBomb)) { const f = (X, tg, fl) => { const F2 = CUR && CUR.FX, M2 = F2 && F2.mem; if (F2 && tg && tg === F2.m && !tg.dead && M2 && M2.stat) { for (const q of M2.bombs) if (q.cal && q.st === 'fly') q.st = 'dead'; bombHits(F2, tg, M2, { cal: true, sup: M2.lastRetSup }); return true; } return prev ? prev(X, tg, fl) : false; }; f.calBomb = true; CAL.onBombHit = f; } }
      const Rf = FX.F && FX.F.rift && typeof RIFT_BY_ID !== 'undefined' ? RIFT_BY_ID[FX.F.rift.id] : null; M.effHp = (Rf && Rf.calBombHp) || EFF_HP; M.amp = m.maxhp / M.effHp; },
    phase(FX, p) { const M = FX.mem, m = FX.m; clearActs(FX, m, M); m.stunT = 0; M.cyc = 0; M.wait = 0.6; M.jolt = 1; M.stat.phaseAt.push([p, +FX.S.t.toFixed(1)]);
      if (p === 2) { M.runeTo = 0.75; FX.H.banner('ROYAL PROCESSION', 'Its runes brighten. Bomb larvae descend: hit a grounded bomb to RETURN it', GOLD, 3.0, true); }
      if (p === 3) { M.runeTo = 1; FX.H.banner('ROYAL DETONATION', 'Its plates pull apart. When it rises and counts down: return the bomb into its core, strike the core, or take SHELTER', WARN_HI, 3.2, true); } },
    ai(FX, m, dt) { const M = FX.mem; m.actT += dt; m.noTouch = true;
      if (m.act === 'hover' || !M.ac) { hover(FX, m, M, dt); M.wait -= dt; if (M.wait <= 0) choose(FX, m, M); }
      else actStep(FX, m, M, dt); },
    stunned(FX, m, dt) { const M = FX.mem; m.noTouch = true; if (Math.random() < dt * 6) { const a = Math.random() * TAU, cg = coreG(m, M); FX.H.part({ kind: 'spark', x: cg.x + Math.cos(a) * 1.4, y: cg.y + Math.sin(a) * 1.0, vx: Math.cos(a) * 2, vy: -1.5 + Math.sin(a), drag: 0.8, life: 0.6, max: 0.6, size: 3, color: Math.random() < 0.5 ? HOT : EMBER }); } },
    update(FX, dt) { update(FX, dt); },
    dmgK(FX, m, o) { const M = FX.mem; if (!M || !M.stat) return 1; M.jolt = Math.max(M.jolt, 0.35);
      const open = M.exposed; if (!open && Math.random() < 0.06) FX.H.text(m.x, m.y - M.zc * ZK - SCALE - 0.4, 'Iron shell', '#CFC2B8', 12);
      return (open ? 1 : 0.6) * (M.amp || 1); },
    ending(FX, m) { const M = FX.mem; clearActs(FX, m, M); for (const b of M.bombs) killBomb(FX, M, b, true); M.bombs.length = 0; M.end = { t: 0 }; FX.noParts(); FX.H.sfx.hum();
      return { title: 'THE BOMB KING FALLS', sub: 'Its fuse gutters out and its shell cracks open over the way down', col: GOLD, delay: 6.2, bannerAt: 2.4, quiet: true, slow: 0.4 }; },
    camFocus(FX, m) { return camFocus(FX, m); },
    draw(c, FX, m, X, Y, T, t) { drawKing(c, FX, m, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'calbomb' && o.B) drawGroundBomb(c, FX, o.B, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawFx(c, FX, T, t); },
  };

  /* ---------- the stage's link ---------- */
  const coreG = (m, M) => ({ x: m.x, y: m.y - M.zc * ZK });   // the core's point on the ground plane (where it is drawn)
  function stat(M, k, n) { M.stat[k] = (M.stat[k] || 0) + (n == null ? 1 : n); }
  // (QA v386: each callout teaches once (a big banner with its line), is named once more as a small title (a small banner never
  //  cuts a big one short), then stays quiet: the marks on the ground and the heartbeat carry it from there)
  function say(FX, M, key, s, sub, col, life) { const n = (+M.seen[key] || 0) + 1; M.seen[key] = n; if (n > 2) return; FX.H.banner(s, n === 1 ? sub : '', col, n === 1 ? (life || 2.6) : 1.1, n === 1); }
  function heartbeat(FX, M) { const sf = FX.H.sfx; if (!sf || !sf.note) return; const r = M.hbRate, v = Math.min(0.5, 0.18 + 0.12 * r); sf.note(52 + r * 4, 0.16, 'sine', v, 38); sf.note(46 + r * 4, 0.14, 'sine', v * 0.7, 34, 0.17); }

  /* ---------- the acts ---------- */
  const CYCLE = { 1: ['volley', 'orbit', 'volley', 'vent'], 2: ['larvae', 'volley', 'orbit', 'vent'], 3: ['charge', 'volley', 'larvae', 'orbit', 'vent'] };
  function choose(FX, m, M) { const P = FX.S.phase, list = CYCLE[P] || CYCLE[1]; let k = list[M.cyc % list.length]; M.cyc++;
    if (k === 'larvae' && liveBombs(M) >= 2) k = 'volley';
    startAct(FX, m, M, k); }
  function startAct(FX, m, M, k) { M.ac = { k, t: 0, step: 0 }; m.act = k; m.actT = 0;
    if (k === 'volley') { stat(M, 'volleys'); say(FX, M, 'volley', 'ROYAL VOLLEY', 'Three fireballs in a wide fan: step into a GAP between the lanes', WARN_HI); M.hbTo = 1.6; }
    else if (k === 'orbit') { stat(M, 'orbits'); say(FX, M, 'orbit', 'IRON ORBIT', 'A slow ring of molten iron rolls out: meet it at the OPENING', WARN_HI); M.hbTo = 1.5; }
    else if (k === 'vent') { stat(M, 'vents'); M.ac.dur = TM.vent[FX.S.phase - 1] || 5; say(FX, M, 'vent', 'FURNACE VENT', 'Its plates part and it sinks low: strike the glowing core!', GOLD); FX.H.sfx.hiss && FX.H.sfx.hiss(0.9, 0.25, 700); M.hbTo = 0.6; }
    else if (k === 'ventShort') { m.act = 'vent'; stat(M, 'vents'); M.ac.k = 'vent'; M.ac.dur = TM.ventShort; FX.H.sfx.hiss && FX.H.sfx.hiss(0.7, 0.22, 700); M.hbTo = 0.6; }
    else if (k === 'larvae') { M.hbTo = 1.3; }
    else if (k === 'charge') { stat(M, 'charges'); M.ac.phase = 'move'; M.hbTo = 1.2; } }
  function endAct(FX, m, M, wait) { M.ac = null; m.act = 'hover'; m.actT = 0; M.wait = wait == null ? (TM.hover[FX.S.phase - 1] || 1.4) : wait; M.openTo = 0; M.exposed = false; M.hbTo = 0.75; M.irisTo = 0; }
  function clearActs(FX, m, M) { if (M.sup) { killBomb(FX, M, M.sup, true); M.sup = null; }
    M.ac = null; m.act = 'hover'; m.actT = 0; M.wait = 1; M.openTo = 0; M.exposed = false; M.zcTo = ZH; M.hbTo = 0.75; }
  /* between acts it drifts heavily, keeping a few tiles from the pet, turning its eye to follow */
  function hover(FX, m, M, dt) { const me = FX.me, C = FX.C, d = Math.hypot(me.x - m.x, me.y - m.y), a = Math.atan2(me.y - m.y, me.x - m.x);
    let tx = m.x, ty = m.y; if (d < 6) { tx = m.x - Math.cos(a) * 2; ty = m.y - Math.sin(a) * 2; } else if (d > 9) { tx = m.x + Math.cos(a) * 2; ty = m.y + Math.sin(a) * 2; }
    const q = FX.clampArena({ x: tx, y: ty }, 5.5); moveSlow(m, q.x, q.y, 1.1, dt); M.zcTo = ZH; void C; }
  function moveSlow(m, tx, ty, v, dt) { const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); if (d < 0.02) return d; const s = Math.min(v * dt, d); m.x += dx / d * s; m.y += dy / d * s; return d - s; }
  function actStep(FX, m, M, dt) { const A = M.ac; A.t += dt;
    switch (A.k) {
      case 'volley': volleyStep(FX, m, M, A, dt); break;
      case 'orbit': orbitStep(FX, m, M, A, dt); break;
      case 'vent': ventStep(FX, m, M, A, dt); break;
      case 'larvae': larvaeStep(FX, m, M, A, dt); break;
      case 'charge': chargeStep(FX, m, M, A, dt); break;
      default: endAct(FX, m, M); } }
  // the mouth of its fire: the eye, at the front of the body, toward a
  const muzzle = (m, M, a) => ({ x: m.x + Math.cos(a) * SCALE * 0.75, y: m.y + Math.sin(a) * SCALE * 0.55 });
  /* ---- Royal Volley: three lanes shown, tracking for a second then locked; three fireballs in a wide fan ---- */
  function volleyStep(FX, m, M, A, dt) { const me = FX.me;
    if (A.step === 0) { A.step = 1; A.a = Math.atan2(me.y - m.y, me.x - m.x); A.o = muzzle(m, M, A.a); A.lanes = [-1, 0, 1]; FX.H.sfx.hum(); }
    if (A.step === 1) { M.irisTo = 1; M.hd = A.a;
      if (A.t < TM.volleyLock) { const want = Math.atan2(me.y - m.y, me.x - m.x); A.a += Math.max(-dt * 1.4, Math.min(dt * 1.4, angTo(A.a, want))); } A.o = muzzle(m, M, A.a);
      if (A.t >= TM.volleyWind) { A.step = 2; A.lanes = null; const o = A.o; for (let k = -1; k <= 1; k++) FX.H.eshot(o.x, o.y, A.a + k * TM.spread, TM.volleyV * (FX.S.phase >= 3 ? 1.12 : 1), { dmg: m.dmg * DMG.ball, r: TM.volleyR, color: EMBER, core: HOT, style: 'fire', life: 4, calFire: true, src: m });
        stat(M, 'balls', 3); M.jolt = 0.8; M.beat = 1; FX.H.shake(5, 0.2); FX.H.sfx.crash(); for (let i = 0; i < 8; i++) FX.H.part({ kind: 'smoke', x: o.x, y: o.y - 0.5, vx: Math.cos(A.a) * 2 + (Math.random() - 0.5) * 2, vy: Math.sin(A.a) * 2 - 1, drag: 1, life: 0.8, max: 0.8, size: 0.6, color: '#3A2A22' }); } }
    if (A.step === 2 && A.t > TM.volleyWind + 0.9) endAct(FX, m, M); }
  /* ---- Iron Orbit: the ring and its opening shown, then a slow low ring of molten iron rolling outward ---- */
  function orbitStep(FX, m, M, A, dt) { const me = FX.me;
    if (A.step === 0) { A.step = 1; const pa = Math.atan2(me.y - m.y, me.x - m.x), side = Math.random() < 0.5 ? -1 : 1; A.ga = pa + side * (0.85 + Math.random() * 0.45); A.x = m.x; A.y = m.y;
      M.zcTo = ZH - 0.5; FX.H.sfx.hum(); }
    if (A.step === 1) { M.jolt = Math.max(M.jolt, 0.25); A.x = m.x; A.y = m.y;
      if (A.t >= TM.orbitWind) { A.step = 2; spawnOrbit(FX, m, M, A); M.beat = 1; FX.H.shake(6, 0.3); FX.H.sfx.thud(); } }
    if (A.step === 2 && A.t > TM.orbitWind + 1.4) endAct(FX, m, M); }
  function blockedByShelter(FX, M, x0, y0, x1, y1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.3); for (let i = 1; i < n; i++) { const u = i / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u); for (const s of M.sh) if (inRect(s, x, y, 0.1)) return true; } return false; }
  function spawnOrbit(FX, m, M, A) { const x = A.x, y = A.y, ga = A.ga, dmg = m.dmg * DMG.orbit;
    FX.hz({ kind: 'orbit', shape: 'fn', test: () => false, x, y, r: 1.6, ga, life: (ARENA_R + 2) / TM.orbitV, hit: false,
      update(dt, z) { z.r += TM.orbitV * dt; const me = FX.me, d = Math.hypot(me.x - x, me.y - y), a = Math.atan2(me.y - y, me.x - x);
        if (!z.hit && Math.abs(d - z.r) < TM.orbitW / 2 + me.r * 0.6) { if (Math.abs(angTo(ga, a)) < TM.orbitGap) return; if (blockedByShelter(FX, M, x, y, me.x, me.y)) { if (!z.shel) { z.shel = true; stat(M, 'orbitShel'); } return; }
          if (FX.hurt(dmg)) { z.hit = true; stat(M, 'orbitHit'); FX.H.text(me.x, me.y - 1.5, 'Iron Orbit!', WARN_HI, 14); } }
        if (Math.random() < dt * 30 && !lowFx()) { const aa = ga + TM.orbitGap + Math.random() * (TAU - 2 * TM.orbitGap); FX.H.part({ kind: 'ember', x: x + Math.cos(aa) * z.r, y: y + Math.sin(aa) * z.r, vx: Math.cos(aa) * 1.5, vy: -1.6, life: 0.5, max: 0.5, size: 3, color: '#FFB060' }); } },
      draw(c, z, FX2, T, t) { drawOrbit(c, FX, z, T, t); } }); }
  /* ---- Furnace Vent: the plates part, the core shows, it settles low; no shell while it lasts ---- */
  function ventStep(FX, m, M, A, dt) { M.openTo = 0.62; M.zcTo = ZV; M.exposed = true; M.glowTo2 = 1.35;
    if (Math.random() < dt * 10 && !lowFx()) { const a = Math.random() * TAU, cg = coreG(m, M); FX.H.part({ kind: 'smoke', x: cg.x + Math.cos(a) * 1.8, y: cg.y + Math.sin(a) * 1.2, vx: Math.cos(a) * 1.5, vy: -2, drag: 0.6, life: 1.1, max: 1.1, size: 0.7, color: 'rgba(255,220,200,' }); }
    if (A.t >= A.dur) { FX.H.sfx.thud(); endAct(FX, m, M); } }
  /* ---- Bomb Larvae: two (at most two grounded) drop from the crown to the floor near the pet ---- */
  function liveBombs(M) { return M.bombs.filter(b => !b.sup && (b.st === 'fall' || b.st === 'safe' || b.st === 'armed')).length; }
  function landSpot(FX, m, M, others) { const me = FX.me, C = FX.C;
    for (let k = 0; k < 60; k++) { const a = Math.random() * TAU, d = 2.4 + Math.random() * 2.2, x = me.x + Math.cos(a) * d, y = me.y + Math.sin(a) * d;
      if (Math.hypot(x - C.x, y - C.y) > ARENA_R - 2) continue; if (Math.hypot(x - m.x, y - m.y) < 3.6) continue; if (M.sh.some(s => inRect(s, x, y, 0.9))) continue; if (others.some(o => Math.hypot((o.lx == null ? o.x : o.lx) - x, (o.ly == null ? o.y : o.ly) - y) < 2.2)) continue; return { x, y }; }
    const a = Math.atan2(m.y - me.y, m.x - me.x); return FX.clampArena({ x: me.x + Math.cos(a + 1.2) * 3, y: me.y + Math.sin(a + 1.2) * 3 }, 2); }
  /* the bombs are the foundry's own (CAL.dropBomb: the same cue, words and hit-to-return rule as its lesson) whenever the
     core is running; this file's own copy of that rule stands in only where it is not (an arena run on its own) */
  const useCal = M => typeof CAL !== 'undefined' && CAL.dropBomb && CAL.returnBomb && M.X && M.X.rift;
  function dropBomb(FX, m, M, o) { const at = landSpot(FX, m, M, M.bombs.filter(b => b.st !== 'dead')), cg = coreG(m, M);
    if (useCal(M)) { const sup = !!(o && o.sup), lm = CAL.dropBomb(M.X, at.x, at.y, { fuse: sup ? 600 : TM.fuse, safe: sup ? 599 : TM.safe, dmg: m.dmg * DMG.larva, r: TM.larvaR, target: m, cap: sup ? null : 2 });
      if (!lm) return null; lm.calKing = true; const b = { cal: true, lm, st: 'fall', t: 0, ft: 0, x: lm.x, y: lm.y, lx: lm.x, ly: lm.y, sup }; M.bombs.push(b); return b; }
    const b = Object.assign({ st: 'fall', t: 0, ft: 0, x: m.x, y: m.y, sx: m.x, sy: m.y, lx: at.x, ly: at.y, z0: M.zc + SCALE * 0.9, z: M.zc + SCALE * 0.9, fall: TM.fall, sup: false }, o || {}); M.bombs.push(b); void cg; return b; }
  function larvaeStep(FX, m, M, A, dt) { M.zcTo = ZH + 0.5; M.irisTo = 0.6; M.jolt = Math.max(M.jolt, 0.2);
    if (A.step === 0 && A.t > 0.7) { A.step = 1; const n = Math.max(0, 2 - liveBombs(M)); for (let i = 0; i < n; i++) FX.H.after(i * 0.35, () => { if (!m.dead && M.stat) { dropBomb(FX, m, M); stat(M, 'larvae'); FX.H.sfx.blip && FX.H.sfx.blip(); } });
      if (n) say(FX, M, 'larvae', 'BOMB LARVAE', 'RETURN THE BOMB: hit it while it shows RETURN. When it flashes red, get clear!', GOLD, 3.0); }
    if (A.t > 1.9) endAct(FX, m, M); }
  /* ---- Royal Detonation: to the middle, up, plates apart; seven seconds; a supplied bomb; three answers ---- */
  function chargeStep(FX, m, M, A, dt) { const C = FX.C;
    if (A.phase === 'move') { const left = moveSlow(m, C.x, C.y, 4.5, dt); M.zcTo = ZH + 0.6; if (left < 0.1 || A.t > 2.6) { A.phase = 'count'; A.t = 0; A.hp0 = m.hp; M.coreHit = 0; A.need = m.maxhp * TM.coreNeed;
        FX.noParts(); M.exposed = true; M.sup = dropBomb(FX, m, M, { sup: true, fall: 0.7 }); FX.H.banner('ROYAL DETONATION', 'RETURN THE BOMB into its core · or strike the core · or TAKE SHELTER behind a basalt wall', WARN_HI, 2.8, true); FX.H.sfx.hum(); A.lastS = 8; }
      return; }
    if (A.phase === 'count') { M.zcTo = ZR; M.openTo = 1; M.glowTo2 = 1.7; M.rune = 1; M.irisTo = 1; M.exposed = true; M.hbTo = 1.2 + 2.6 * (A.t / TM.charge);
      const s = Math.ceil(TM.charge - A.t); if (s !== A.lastS && s > 0) { A.lastS = s; if (FX.H.sfx.note) FX.H.sfx.note(330 + (7 - s) * 40, 0.12, 'square', 0.12); }
      const dealt = A.hp0 - m.hp; A.dealt = dealt;
      if (dealt >= A.need) { interrupt(FX, m, M, 'core'); return; }
      if (A.t >= TM.charge) blast(FX, m, M, A); } }
  function interrupt(FX, m, M, how) { const A = M.ac; if (A) A.done = true; if (M.sup) { killBomb(FX, M, M.sup, true); M.sup = null; } stat(M, how === 'bomb' ? 'intBomb' : 'intCore'); stat(M, 'staggers');
    M.ac = null; m.act = 'hover'; M.wait = 0.8; m.stunT = TM.longStagger; M.stunKind = 'broken'; M.jolt = 1; M.beat = 1; M.zcTo = ZS; M.openTo = 0.75; M.exposed = true;
    FX.H.banner('THE DETONATION IS BROKEN', how === 'bomb' ? 'Its own bomb, right into the core! It reels: strike now!' : 'You battered the core: it reels! Strike now!', GOLD, 2.4, true); FX.H.flash(0.3, GOLD); FX.H.shake(10, 0.4); FX.H.sfx.crash(); const cg = coreG(m, M); FX.H.ring(cg.x, cg.y, 0.5, 5, 0.6, GOLD, 0.3); }
  function blast(FX, m, M, A) { const me = FX.me, C = FX.C, si = safeOf(C, me.x, me.y); stat(M, 'blasts'); A.done = true; if (M.sup) { killBomb(FX, M, M.sup, true); M.sup = null; }
    FX.H.flash(0.75, '#FFE0B0'); FX.H.shake(22, 0.9); FX.H.sfx.crash(); FX.H.sfx.thud(); for (let i = 0; i < 4; i++) FX.H.ring(C.x, C.y, 1 + i, ARENA_R + 2, 0.7 + i * 0.12, i % 2 ? EMBER : HOT, 0.6);
    for (let i = 0; i < 40; i++) { const a = Math.random() * TAU, d = Math.random() * ARENA_R; FX.H.part({ kind: 'ember', x: C.x + Math.cos(a) * d, y: C.y + Math.sin(a) * d, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6 - 2, life: 0.8, max: 0.8, size: 4, color: Math.random() < 0.5 ? HOT : EMBER }); }
    if (si >= 0) { stat(M, 'sheltered'); FX.H.text(me.x, me.y - 1.6, 'SHELTERED!', SAFE, 18); }
    else { const ST = FX.H.ST ? FX.H.ST() : null, cap = ST ? ST.hp * DMG.blastCap : 1e9; if (FX.hurt(Math.min(m.dmg * DMG.blast, cap))) { stat(M, 'blastHit'); FX.H.text(me.x, me.y - 1.6, 'Caught in the blast!', WARN_HI, 16); } }
    M.ac = null; startAct(FX, m, M, 'ventShort'); M.zcTo = ZV + 0.3; }
  /* a returned bomb lands in the King: it bursts on its core; the shell cracks and it staggers (in a detonation, the charge breaks) */
  function bombHits(FX, m, M, b) { const cg = coreG(m, M); if (!b.cal) FX.H.boom(cg.x, cg.y + 0.2, 1.8, EMBER, '#FFFFFF', { n: 22, shake: 9, smoke: 4 }); FX.H.ring(cg.x, cg.y, 0.4, 3.2, 0.4, HOT, 0.25);
    stat(M, 'returns'); if (b.sup) stat(M, 'retSup');
    if (FX.H.hitMon) FX.H.hitMon(m, m.maxhp * 0.02, { flat: true, pierce: true, noCrit: true });
    if (M.ac && M.ac.k === 'charge' && M.ac.phase === 'count') { interrupt(FX, m, M, 'bomb'); return; }
    if (m.dead) return;
    M.ac = null; m.act = 'hover'; M.wait = 0.8; m.stunT = Math.max(m.stunT || 0, TM.stagger); M.stunKind = 'crack'; stat(M, 'staggers'); M.jolt = 1; M.beat = 1; M.zcTo = ZS + 0.3; M.openTo = 0.45; M.exposed = true;
    const n = (+M.seen.crack || 0) + 1; M.seen.crack = n; if (n <= 2) FX.H.banner('SHELL CRACKED!', n === 1 ? 'Its own bomb cracked the shell: it staggers. Strike the core!' : '', GOLD, n === 1 ? 2.2 : 1.0, n === 1); FX.H.sfx.crash(); }   // (QA v386: as say())

  /* ---------- the bombs: falling, grounded (RETURN, then armed), returned in flight, bursting ---------- */
  function land(FX, M, b) { b.st = b.sup ? 'supplied' : 'safe'; b.ft = 0; FX.H.boom(b.x, b.y, 0.7, '#8A6A50', '#FFD0A0', { n: 8, shake: 3, smoke: 3 }); FX.H.sfx.thud();
    const o = FX.obj({ x: b.x, y: b.y, r: 0.95, hp: 1e9, kind: 'calbomb', B: b, onHit(ob) { ob.hp = ob.maxhp; hitBomb(FX, M, b); } }); b.o = o;
    if (!b.sup && !M.seen.ret) { M.seen.ret = true; FX.H.banner('RETURN THE BOMB', 'Hit it with any attack while it shows RETURN: it flies back into the King', GOLD, 2.6, true); } }
  function hitBomb(FX, M, b) { const m = FX.m; if (!m || m.dead) return;
    if (b.st === 'safe' || b.st === 'supplied') { b.st = 'fly'; b.t = 0; b.fx = b.x; b.fy = b.y; if (b.o) { b.o.dead = true; b.o = null; } FX.H.sfx.whoosh(); FX.H.text(b.x, b.y - 1.1, 'Returned!', GOLD, 15); return; }
    if (b.st === 'armed' && Math.random() < 0.4) FX.H.text(b.x, b.y - 1.0, 'Too hot: get clear!', WARN_HI, 12); }
  function killBomb(FX, M, b, fizzle) { if (b.lm && !b.lm.dead) { b.lm.dead = true; if (b.lm.cal) b.lm.cal.st = 'gone'; } if (b.o) { b.o.dead = true; b.o = null; } if (fizzle && (b.st === 'safe' || b.st === 'supplied' || b.st === 'armed' || b.st === 'fall')) { for (let i = 0; i < 6; i++) FX.H.part({ kind: 'smoke', x: b.x, y: b.y - 0.3, vx: (Math.random() - 0.5) * 2, vy: -1.5, drag: 1, life: 0.9, max: 0.9, size: 0.5, color: '#3A302A' }); } b.st = 'dead'; }
  function bombsTick(FX, m, M, dt) { const me = FX.me;
    for (const b of M.bombs) { b.t += dt;
      if (b.cal) { const L = b.lm.cal || {}, was = b.st; b.x = b.lm.x; b.y = b.lm.y;
        b.st = L.st === 'hover' || L.st === 'land' ? 'fall' : L.st === 'safe' ? (b.sup ? 'supplied' : 'safe') : L.st === 'red' ? 'armed' : L.st === 'returned' ? 'fly' : 'dead';
        if (b.lm.dead && L.st !== 'returned' && L.st !== 'boom') b.st = 'dead'; b.ft = L.st === 'safe' ? L.t : L.st === 'red' ? TM.safe + L.t : 0;
        if (b.st === 'safe' && was === 'fall' && !M.seen.ret) { M.seen.ret = true; FX.H.banner('RETURN THE BOMB', 'Hit it with any attack while its ring is green: it flies back into the King', GOLD, 2.6, true); }
        if (b.st === 'fly' && was !== 'fly') M.lastRetSup = b.sup;
        if (L.st === 'boom' && was !== 'dead') { stat(M, 'explodes'); if (Math.hypot(me.x - b.x, me.y - b.y) < TM.larvaR + me.r * 0.5) stat(M, 'larvaHit'); }
        if (b.st === 'fly' && b.t > 4) b.st = 'dead'; if (b.st === 'fly' && b.lm.dead && !b.flyT) b.flyT = b.t; if (b.flyT && b.t - b.flyT > 2) b.st = 'dead';
        continue; }
      if (b.st === 'fall') { const u = cl(b.t / b.fall); b.x = lerp(b.sx, b.lx, u); b.y = lerp(b.sy, b.ly, u); b.z = lerp(b.z0, 0, u * u) + Math.sin(Math.PI * u) * 1.2; if (u >= 1) { b.x = b.lx; b.y = b.ly; land(FX, M, b); } }
      else if (b.st === 'safe' || b.st === 'armed') { b.ft += dt; if (b.st === 'safe' && b.ft >= TM.safe) { b.st = 'armed'; FX.H.sfx.blip && FX.H.sfx.blip(); }
        if (b.st === 'armed' && Math.floor(b.ft * (b.ft > 5 ? 8 : 4)) !== b.tick) { b.tick = Math.floor(b.ft * (b.ft > 5 ? 8 : 4)); if (FX.H.sfx.note) FX.H.sfx.note(880, 0.05, 'square', 0.06); }
        if (b.ft >= TM.fuse) { stat(M, 'explodes'); FX.H.boom(b.x, b.y, TM.larvaR, EMBER, '#FFFFFF', { n: 26, shake: 9, smoke: 6 }); if (Math.hypot(me.x - b.x, me.y - b.y) < TM.larvaR + me.r * 0.4) { if (FX.hurt(m.dmg * DMG.larva)) { stat(M, 'larvaHit'); FX.H.text(me.x, me.y - 1.5, 'Bomb!', WARN_HI, 15); } } killBomb(FX, M, b, false); } }
      else if (b.st === 'supplied') { b.ft += dt; }
      else if (b.st === 'fly') { const u = cl(b.t / TM.fly), cg = { x: m.x, y: m.y + 0.2, z: M.zc }; b.x = lerp(b.fx, cg.x, u); b.y = lerp(b.fy, cg.y, u); b.z = lerp(0.3, cg.z, u) + Math.sin(Math.PI * u) * 1.6;
        if (Math.random() < 0.6) FX.H.part({ kind: 'spark', x: b.x, y: b.y - b.z * ZK, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, drag: 2, life: 0.3, max: 0.3, size: 2.5, color: HOT });
        if (u >= 1) { b.st = 'dead'; if (!m.dead) bombHits(FX, m, M, b); } } }
    for (let i = M.bombs.length - 1; i >= 0; i--) if (M.bombs[i].st === 'dead') M.bombs.splice(i, 1);
    if (M.sup && M.sup.st === 'dead') M.sup = null; }

  /* ---------- every frame: the body's life, the bombs, the weak point, the ending ---------- */
  function update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.stat) return; M.bt += dt; const t = M.bt, me = FX.me, stun = m.stunT > 0 && !m.dead;
    // the entrance: it comes down out of the dark, the fuse catches, its eye opens
    if (m.act === 'enter') { const e = FX.S.enterT || 0; M.zc = lerp(ZE, ZH, ease(e / 2.6)) + (e > 2.2 && e < 3 ? Math.sin((e - 2.2) * 9) * 0.15 * (3 - e) : 0); M.fuseLit = sstep(1.0, 1.6, e); M.glow = 0.15 + 0.6 * sstep(1.2, 2.6, e); M.iris = 1 - sstep(1.8, 2.8, e);
      if (e > 2.3 && !M.landed) { M.landed = true; FX.H.shake(10, 0.4); FX.H.sfx.thud(); } }
    if (!stun && M.wasStun) { M.wasStun = false; M.stunKind = null; M.exposed = false; M.openTo = 0; M.zcTo = ZH; FX.H.text(m.x, m.y - M.zc * ZK - SCALE - 0.5, 'It seals its shell', '#CFC2B8', 13); FX.H.sfx.thud(); }
    if (stun) { M.wasStun = true; M.exposed = true; if (M.stunKind === 'broken') { M.zcTo = ZS; M.openTo = 0.75; } else { M.zcTo = ZS + 0.3; M.openTo = 0.45; } }
    // the ending: the fuse burns down to nothing; then the shell cracks and falls in pieces, no blast; the floor opens below
    if (M.end) { const E = M.end; E.t += dt; M.fuse = Math.max(0, M.fuse - dt * 0.6); M.fuseLit = M.fuse > 0.02 ? 1 : toward(M.fuseLit, 0, dt, 4); M.glowTo = lerp(0.8, 0.02, sstep(1.6, 3.6, E.t)); M.dark = sstep(2.0, 4.0, E.t); M.openTo = 0; M.exposed = false;
      M.crack = sstep(1.9, 3.3, E.t); M.zcTo = lerp(ZV, ZS, sstep(0.3, 1.6, E.t)); M.passage = sstep(2.6, 4.2, E.t);
      if (E.t > 1.9 && !E.cracked) { E.cracked = true; FX.H.sfx.crack && FX.H.sfx.crack(); FX.H.shake(6, 0.3); }
      if (E.t > 2.8 && !E.thud) { E.thud = true; FX.H.sfx.thud(); FX.H.shake(5, 0.25); for (let i = 0; i < 14; i++) { const a = Math.random() * TAU, d = 2 + Math.random() * 3; FX.H.part({ kind: 'smoke', x: m.x + Math.cos(a) * d, y: m.y + Math.sin(a) * d * 0.8, vx: Math.cos(a), vy: -0.8, drag: 0.8, life: 1.4, max: 1.4, size: 0.8, color: '#2A2220' }); } }
      if (M.fuse > 0 && Math.random() < dt * 20) { const tip = MODEL.anchor('fuseTip'); if (tip) FX.H.part({ kind: 'smoke', x: tip.x, y: tip.y - tip.z * ZK, vx: (Math.random() - 0.5) * 0.6, vy: -1.4, drag: 0.5, life: 1, max: 1, size: 0.35, color: '#4A403A' }); } }
    // the heartbeat quickens before every blast; it breathes slowly, the shell swelling
    M.hbRate = toward(M.hbRate, Math.max(M.hbTo, M.bombs.some(q => q.st === 'armed') ? 1.9 : 0), dt, 1.5); M.hbPh += dt * M.hbRate; if (M.hbPh >= 1 && !M.end) { M.hbPh -= 1; M.beat = 1; if (M.hbRate > 1.05 || (M.hbN = (M.hbN || 0) + 1) % 3 === 0) heartbeat(FX, M); }
    M.beat = Math.max(0, M.beat - dt * 3.2); M.jolt = Math.max(0, M.jolt - dt * 2.5); M.br = 0.5 + 0.5 * Math.sin(t * 1.1);
    // the pose eases toward what the acts ask
    M.zc = m.act === 'enter' ? M.zc : toward(M.zc, M.zcTo, dt, M.zcTo > M.zc ? 1.3 : 2.4);
    const oT = Math.max(M.openTo, FX.S.phase >= 3 && !M.end ? 0.26 + 0.06 * Math.sin(t * 2.3) : 0);   // (phase 3: its plates stay pulled apart, the furnace pulsing between them)
    M.open = toward(M.open, oT, dt, oT > M.open ? 3.5 : 2.2); M.iris = toward(M.iris, M.irisTo, dt, 4);
    const angry = cl((FX.S.phase - 1) * 0.4 + (M.ac && (M.ac.k === 'volley' || M.ac.k === 'charge') ? 0.5 : 0));
    M.rune = toward(M.rune, Math.max(M.runeTo || 0, angry), dt, 3);
    if (!M.end && m.act !== 'enter') M.glowTo = 0.75 + 0.2 * (FX.S.phase - 1) + (M.glowTo2 || 0) * 0.5; M.glowTo2 = 0;
    M.glow = toward(M.glow, M.glowTo, dt, 3);
    if (!M.end && m.act !== 'enter') M.fuse = 0.25 + 0.75 * cl(m.hp / m.maxhp);   // (its fuse shortens as it weakens)
    // it turns its eye toward the pet (heavily), and leans to look down at it
    if (!M.end && !stun && m.act !== 'enter') { const want = Math.atan2(me.y - m.y, me.x - m.x); M.hd += Math.max(-dt * 0.9, Math.min(dt * 0.9, angTo(M.hd, want))); }
    M.pitch = toward(M.pitch, M.end ? 0.15 : stun ? 0.25 : -0.12 + 0.1 * cl(1 - M.zc / ZR), dt, 2);
    // the bombs
    bombsTick(FX, m, M, dt);
    // what can be struck: the body (its plates), and the core while it is open; in a detonation, only the core
    if (!M.end && m.act !== 'enter') { const charging = M.ac && M.ac.k === 'charge' && M.ac.phase === 'count';
      const cg = coreG(m, M), list = charging ? [] : [{ key: 'body', dx: 0, dy: -M.zc * ZK * 0.95, r: SCALE * 0.85 }]; if (M.exposed) list.push({ key: 'core', dx: 0, dy: cg.y + 0.4 - m.y, r: 1.5 });
      const PM = FX.S.partsMap; if (charging && PM && PM.body) { PM.body.dead = true; PM.body = null; } if (!M.exposed && PM && PM.core) { PM.core.dead = true; PM.core = null; }
      if (list.length) FX.parts(list); if (FX.S.partsMap && FX.S.partsMap.core) FX.S.partsMap.core.isCore = true; }
    // the shell's share of the damage, for the tests
    if (m.hp < M.hpPrev) stat(M, M.exposed ? 'dmgOpen' : 'dmgShell', M.hpPrev - m.hp); M.hpPrev = m.hp;
    if (!M.end && !lowFx() && Math.random() < dt * 3) { const tip = MODEL.anchor('fuseTip'); if (tip) FX.H.part({ kind: 'spark', x: tip.x + (Math.random() - 0.5) * 0.2, y: tip.y - tip.z * ZK, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2, g: 6, drag: 0.5, life: 0.5, max: 0.5, size: 2, color: Math.random() < 0.5 ? HOT : '#FFB040' }); } }

  /* ---------- the camera: the King, the pet, every bomb on the floor and the nearest shelter, together ---------- */
  function camFocus(FX, m) { const M = FX.mem, me = FX.me, H = FX.H; if (!M || !M.stat) return null; if (m.act === 'enter') return { x: lerp(me.x, m.x, 0.7), y: lerp(me.y, m.y - M.zc * ZK, 0.6), k: 1, zoom: 0.5 };
    const pts = [[me.x, me.y], [m.x - SCALE, m.y - M.zc * ZK - SCALE * 1.15], [m.x + SCALE, m.y + 0.6]];
    if (M.end) return { x: m.x, y: m.y - 1.5, k: 0.85, zoom: 0.62 };
    for (const b of M.bombs) if (b.st !== 'dead' && b.st !== 'fly') pts.push([b.x, b.y]);
    const ns = nearestShelter(FX.C, me.x, me.y), s = M.sh[ns.i]; pts.push([s.x, s.y - 1.2]); if (M.ac && M.ac.k === 'charge') pts.push([ns.p.x, ns.p.y]);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const W = H.W ? H.W() : 390, Hh = H.H ? H.H() : 844, TS = FX.Tz() / Math.max(0.05, H.g.zoom || 0.66);
    const zoom = Math.max(0.42, Math.min(0.68, (W - 40) / (TS * (x1 - x0 + 2)), (Hh - 330) / (TS * (y1 - y0 + 2))));
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 + 40 / (TS * zoom), k: 1, zoom }; }

  /* ---------- drawing ---------- */
  function poseOf(M, t) { return { open: M.open, breath: M.br, beat: M.beat, iris: M.iris, glow: M.glow, rune: M.rune, heat: 0.55 + 0.35 * M.rune, fuse: M.fuse, fuseLit: M.fuseLit, pitch: M.pitch, roll: Math.sin(t * 0.7) * 0.025, look: 0, crack: M.crack, zc: M.zc / SCALE, dark: M.dark, jolt: M.jolt, alpha: 1 }; }
  function drawKing(c, FX, m, T, t) { const M = FX.mem; if (!M || !M.stat) return; const P = poseOf(M, t); P.zc = M.zc / SCALE;
    // a gentle bob, heavy: a slow sink and a short lift on each beat
    const bob = M.end ? 0 : Math.sin(t * 1.1) * 0.08 + M.beat * 0.05 - M.jolt * 0.04;
    MODEL.draw(c, m.x, m.y, M.zc + bob, M.hd, P, { T, sx: FX.sx, sy: FX.sy, t, scale: SCALE }); }
  function overlay(c, FX, t, T) { const M = FX.mem, m = FX.m, C = FX.C;
    // the lava beneath the grates breathes
    const k = 0.5 + 0.5 * Math.sin(t * 0.9); for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * TAU + Math.PI / 6 - 0.15, r = ARENA_R - 1.45; glowAt(c, FX.sx(C.x + Math.cos(a) * r), FX.sy(C.y + Math.sin(a) * r), T * (2.2 + 0.4 * k), '#FF5A14', 0.16 + 0.1 * k); }
    // the acts' telegraphs, painted on the floor: a volley's three lanes and its gaps; an orbit's ring and its opening
    if (M && M.stat && m && !m.dead && M.ac) { const A = M.ac;
      if (A.k === 'volley' && A.lanes && A.o) drawLanes(c, FX, A, T, t);
      if (A.k === 'orbit' && A.step === 1) drawOrbitWarn(c, FX, A, T, t); }
    // the shelters' SAFE sides
    const charging = !!(M && M.ac && M.ac.k === 'charge'), meSafe = M && M.stat ? safeOf(C, FX.me.x, FX.me.y) : -1;
    for (let i = 0; i < SH_ANG.length; i++) drawSafe(c, FX, C, i, T, t, charging, meSafe === i);
    if (!M || !M.stat || !m) return;
    // the King's shadow and the heat it throws on the floor
    if (!M.end || M.crack < 0.9) MODEL.drawShadow(c, m.x, m.y, M.zc, { glow: M.glow, open: M.open, dark: M.dark, alpha: 1 - M.crack * 0.8 }, { T, sx: FX.sx, sy: FX.sy, scale: SCALE });
    // a detonation's countdown ring on the floor round it
    if (charging && M.ac.phase === 'count') { const u = cl(M.ac.t / TM.charge), X = FX.sx(m.x), Y = FX.sy(m.y), r = T * (SCALE + 1.4); c.save(); c.lineCap = 'round';
      c.strokeStyle = 'rgba(20,6,2,.6)'; c.lineWidth = T * 0.5; c.beginPath(); c.ellipse(X, Y, r, r * 0.72, 0, 0, TAU); c.stroke();
      c.strokeStyle = hexA(WARN, 0.85); c.lineWidth = T * 0.28; c.beginPath(); c.ellipse(X, Y, r, r * 0.72, 0, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - u)); c.stroke(); c.restore(); }
    // the bombs' fuse circles: a faint ring while it can be returned, a red damage circle once armed
    for (const b of M.bombs) { if (b.cal || (b.st !== 'safe' && b.st !== 'armed' && b.st !== 'fall')) continue; const X = FX.sx(b.st === 'fall' ? b.lx : b.x), Y = FX.sy(b.st === 'fall' ? b.ly : b.y), R = TM.larvaR * T, armed = b.st === 'armed', fl = armed ? 0.5 + 0.5 * Math.sin(t * (b.ft > 5 ? 30 : 16)) : 0;
      c.save(); c.beginPath(); c.arc(X, Y, R, 0, TAU); c.fillStyle = armed ? `rgba(255,60,20,${0.1 + 0.16 * fl})` : b.st === 'fall' ? 'rgba(255,90,40,.05)' : 'rgba(255,90,40,.06)'; c.fill();
      c.setLineDash(armed ? [] : [T * 0.3, T * 0.22]); c.strokeStyle = armed ? hexA(WARN, 0.7 + 0.3 * fl) : 'rgba(255,140,90,.45)'; c.lineWidth = Math.max(2, T * (armed ? 0.1 : 0.06)); c.stroke(); c.setLineDash([]); c.restore(); }
    // the way down, once the shell has cracked open over it
    if (M.passage > 0) drawPassage(c, FX, m, T, t, M.passage); }
  function drawSafe(c, FX, C, i, T, t, charging, here) { const a = SH_ANG[i], X = FX.sx(C.x), Y = FX.sy(C.y), k = charging ? 0.6 + 0.4 * Math.sin(t * 6) : 0.3;
    const w0 = SAFE_A * 0.55, w1 = SAFE_A * 1.0;   // (the wedge widens outward, as the shelter's shadow does)
    c.save(); c.beginPath(); c.moveTo(X + Math.cos(a - w0) * SAFE_R0 * T, Y + Math.sin(a - w0) * SAFE_R0 * T); c.lineTo(X + Math.cos(a - w1) * SAFE_R1 * T, Y + Math.sin(a - w1) * SAFE_R1 * T); c.arc(X, Y, SAFE_R1 * T, a - w1, a + w1); c.lineTo(X + Math.cos(a + w0) * SAFE_R0 * T, Y + Math.sin(a + w0) * SAFE_R0 * T); c.arc(X, Y, SAFE_R0 * T, a + w0, a - w0, true); c.closePath();
    c.fillStyle = hexA(SAFE_M, (charging ? 0.14 : 0.05) + (here ? 0.12 : 0)); c.fill(); c.setLineDash([T * 0.35, T * 0.2]); c.strokeStyle = hexA(SAFE, 0.25 + 0.5 * k); c.lineWidth = Math.max(1.5, T * 0.07); c.stroke(); c.setLineDash([]);
    // hatching, and the shield sigil with its word
    c.clip(); c.strokeStyle = hexA(SAFE, 0.06 + 0.1 * k); c.lineWidth = Math.max(1, T * 0.04); const cx = X + Math.cos(a) * (SAFE_R0 + SAFE_R1) / 2 * T, cy = Y + Math.sin(a) * (SAFE_R0 + SAFE_R1) / 2 * T; for (let j = -8; j <= 8; j++) { c.beginPath(); c.moveTo(cx + j * T * 0.6 - T * 4, cy - T * 4); c.lineTo(cx + j * T * 0.6 + T * 4, cy + T * 4); c.stroke(); } c.restore();
    const sx = X + Math.cos(a) * (SAFE_R0 + 1.5) * T, sy = Y + Math.sin(a) * (SAFE_R0 + 1.5) * T, s = T * (charging ? 0.62 : 0.48);
    c.save(); shieldPath(c, sx, sy, s); c.fillStyle = hexA(SAFE_D, charging ? 0.8 : 0.5); c.fill(); c.lineWidth = Math.max(1.5, T * 0.06); c.strokeStyle = hexA(SAFE, 0.5 + 0.5 * k); c.stroke();
    c.strokeStyle = hexA(SAFE, 0.6 + 0.4 * k); c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.moveTo(sx - s * 0.35, sy); c.lineTo(sx - s * 0.05, sy + s * 0.3); c.lineTo(sx + s * 0.4, sy - s * 0.3); c.stroke(); c.restore();
    if (charging) label(c, 'SAFE', sx, sy + s * 1.55, T * 0.42, SAFE); }
  function drawPassage(c, FX, m, T, t, k) { const X = FX.sx(m.x), Y = FX.sy(m.y), rx = T * 2.1 * k, ry = rx * 0.62; if (rx < 1) return;
    c.save(); let g = c.createRadialGradient(X, Y, 1, X, Y, rx); g.addColorStop(0, '#000000'); g.addColorStop(0.75, '#0A0403'); g.addColorStop(1, 'rgba(40,14,6,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(X, Y, rx * 1.15, ry * 1.15, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(X, Y, rx, ry, 0, 0, TAU); c.clip();
    for (let i = 0; i < 6; i++) { const yy = Y - ry + (i + 0.6) * ry * 0.3, ww = rx * (0.9 - i * 0.1); c.fillStyle = `rgba(${70 - i * 9},${48 - i * 6},${40 - i * 5},1)`; c.fillRect(X - ww * 0.5, yy, ww, ry * 0.16); }
    g = c.createLinearGradient(0, Y - ry, 0, Y + ry); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,90,20,.35)'); c.fillStyle = g; c.fillRect(X - rx, Y - ry, rx * 2, ry * 2); c.restore();
    glowAt(c, X, Y + ry * 0.5, rx * 0.9, '#FF5A14', 0.25 * k); }
  function drawLanes(c, FX, A, T, t) { const u = cl(A.t / TM.volleyWind), X = FX.sx(A.o.x), Y = FX.sy(A.o.y), L = 15 * T, w = (TM.volleyR + 0.18) * T, locked = A.t >= TM.volleyLock;
    c.save(); c.translate(X, Y);
    for (const k of A.lanes) { const a = A.a + k * TM.spread; c.save(); c.rotate(a);
      c.fillStyle = 'rgba(24,6,2,.32)'; c.fillRect(T * 0.6, -w * 1.25, L, w * 2.5);
      const g = c.createLinearGradient(T * 0.6, 0, L, 0); g.addColorStop(0, hexA(WARN, 0.18 + 0.32 * u)); g.addColorStop(1, hexA(WARN, 0.02)); c.fillStyle = g; c.fillRect(T * 0.6, -w, L * (0.25 + 0.75 * u), w * 2);
      c.strokeStyle = hexA(WARN_HI, 0.35 + 0.45 * u * (locked ? 0.8 + 0.2 * Math.sin(t * 20) : 1)); c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.moveTo(T * 0.6, -w); c.lineTo(L, -w); c.moveTo(T * 0.6, w); c.lineTo(L, w); c.stroke();
      // chevrons running outward along it
      c.fillStyle = hexA(WARN_HI, 0.5 + 0.4 * u); for (let i = 0; i < 6; i++) { const x = T * 1.2 + ((i / 6 + t * 0.6) % 1) * (L - T * 1.6); c.beginPath(); c.moveTo(x + w * 0.6, 0); c.lineTo(x - w * 0.2, -w * 0.6); c.lineTo(x, 0); c.lineTo(x - w * 0.2, w * 0.6); c.closePath(); c.fill(); }
      c.restore(); }
    // the gaps between the lanes: safe ground, marked
    for (const k of [-0.5, 0.5]) { const a = A.a + k * TM.spread; c.save(); c.rotate(a); c.setLineDash([T * 0.18, T * 0.24]); c.strokeStyle = hexA(SAFE, 0.35 + 0.3 * u); c.lineWidth = Math.max(1.2, T * 0.05); c.beginPath(); c.moveTo(T * 2.4, 0); c.lineTo(T * 9, 0); c.stroke(); c.restore(); }
    c.restore(); }
  function drawOrbitWarn(c, FX, A, T, t) { const u = cl(A.t / TM.orbitWind), X = FX.sx(A.x), Y = FX.sy(A.y), r0 = 1.6 * T, r1 = (ARENA_R + 0.5) * T, g0 = A.ga - TM.orbitGap, g1 = A.ga + TM.orbitGap;
    c.save();
    // the ring's path, rippling outward, red-orange; heavier as it comes
    for (let i = 0; i < 4; i++) { const rr = r0 + ((i / 4 + t * 0.35) % 1) * (r1 - r0); c.strokeStyle = hexA(WARN, (0.12 + 0.3 * u) * (1 - (rr - r0) / (r1 - r0) * 0.6)); c.lineWidth = Math.max(2, T * 0.12); c.beginPath(); c.arc(X, Y, rr, g1, g0 + TAU); c.stroke(); }
    c.strokeStyle = hexA(WARN_HI, 0.5 + 0.4 * u); c.lineWidth = Math.max(2, T * 0.14); c.beginPath(); c.arc(X, Y, r0 + T * 0.4, g1, g0 + TAU); c.stroke();
    // the opening: a mint wedge from the King to the rim, its edges dashed
    c.beginPath(); c.moveTo(X + Math.cos(g0) * r0, Y + Math.sin(g0) * r0); c.arc(X, Y, r1, g0, g1); c.lineTo(X + Math.cos(g1) * r0, Y + Math.sin(g1) * r0); c.arc(X, Y, r0, g1, g0, true); c.closePath();
    c.fillStyle = hexA(SAFE_M, 0.08 + 0.1 * u); c.fill(); c.setLineDash([T * 0.3, T * 0.2]); c.strokeStyle = hexA(SAFE, 0.5 + 0.3 * u); c.lineWidth = Math.max(1.5, T * 0.06); c.stroke(); c.setLineDash([]);
    const lx = X + Math.cos(A.ga) * T * 5, ly = Y + Math.sin(A.ga) * T * 5; label(c, 'OPEN', lx, ly, T * 0.45, SAFE); c.restore(); }
  function drawOrbit(c, FX, z, T, t) { const X = FX.sx(z.x), Y = FX.sy(z.y), r = z.r * T, w = TM.orbitW * T, a0 = z.ga + TM.orbitGap, a1 = z.ga - TM.orbitGap + TAU; if (r < 2) return;
    c.save(); c.lineCap = 'butt';
    c.strokeStyle = 'rgba(20,6,2,.55)'; c.lineWidth = w * 1.5; c.beginPath(); c.arc(X, Y, r, a0, a1); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,90,20,.55)'; c.lineWidth = w; c.stroke(); c.strokeStyle = 'rgba(255,200,120,.6)'; c.lineWidth = w * 0.35; c.stroke(); c.globalCompositeOperation = 'source-over';
    // the iron: heavy balls rolling round it
    const n = Math.max(6, Math.floor((a1 - a0) * z.r / 1.1)); for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i + ((t * 0.6) % 1)) / (n + 1), x = X + Math.cos(a) * r, y = Y + Math.sin(a) * r, rr = w * 0.42;
      const g = c.createRadialGradient(x - rr * 0.3, y - rr * 0.5, rr * 0.1, x, y, rr); g.addColorStop(0, '#6A5A50'); g.addColorStop(0.5, '#2A201C'); g.addColorStop(1, '#0A0605'); c.fillStyle = g; c.beginPath(); c.arc(x, y - rr * 0.3, rr, 0, TAU); c.fill(); }
    // the opening, plainly marked
    for (const sgn of [-1, 1]) { const a = z.ga + sgn * TM.orbitGap, x = X + Math.cos(a) * r, y = Y + Math.sin(a) * r; c.fillStyle = hexA(SAFE, 0.8); c.beginPath(); c.arc(x, y, w * 0.25, 0, TAU); c.fill(); }
    label(c, 'OPEN', X + Math.cos(z.ga) * r, Y + Math.sin(z.ga) * r, T * 0.38, SAFE); c.restore(); }
  function drawGroundBomb(c, FX, b, X, Y, T, t) { const armed = b.st === 'armed', fl = armed ? (Math.sin(t * (b.ft > 5 ? 30 : 16)) > 0 ? 1 : 0.2) : 0;
    drawLarva(c, X, Y, T, { t, flash: fl, k: 1 });
    // the shrinking timer round it and its cue: RETURN (gold, a return arrow) or DODGE (red, a warning bomb)
    const R = T * 0.95, u = b.sup ? 0 : cl(b.ft / TM.fuse); c.save(); c.lineCap = 'round';
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = Math.max(3, T * 0.16); c.beginPath(); c.arc(X, Y - T * 0.15, R, 0, TAU); c.stroke();
    c.strokeStyle = armed ? hexA(WARN, 0.95) : hexA(GOLD, 0.95); c.lineWidth = Math.max(2, T * 0.1); c.beginPath(); c.arc(X, Y - T * 0.15, R, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - u)); c.stroke();
    if (!b.sup && !armed) { const us = u * TM.fuse / TM.safe; c.strokeStyle = hexA(SAFE, 0.8); c.lineWidth = Math.max(1.5, T * 0.05); c.beginPath(); c.arc(X, Y - T * 0.15, R + T * 0.18, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - us)); c.stroke(); }
    c.restore();
    const ly = Y - T * 1.75, pulse = 0.85 + 0.15 * Math.sin(t * 8);
    if (armed) { bombGlyph(c, X - T * 0.95, ly, T * 0.32, WARN_HI); label(c, 'DODGE!', X + T * 0.2, ly, T * 0.42 * pulse, '#FFD0C0', 'rgba(120,10,0,.9)'); }
    else { label(c, 'RETURN', X + T * 0.18, ly, T * 0.42 * pulse, GOLD); c.save(); c.strokeStyle = GOLD; c.lineWidth = Math.max(2, T * 0.07); c.lineCap = 'round'; const ax = X - T * 1.05, ay = ly; c.beginPath(); c.arc(ax, ay, T * 0.2, Math.PI * 0.9, Math.PI * 2.2); c.stroke(); c.beginPath(); c.moveTo(ax + T * 0.17, ay + T * 0.02); c.lineTo(ax + T * 0.26, ay - T * 0.14); c.lineTo(ax + T * 0.06, ay - T * 0.1); c.stroke(); c.restore(); } }
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !M.stat || !m) return; const me = FX.me;
    // the dead King is drawn here, over the floor it lies on (the engine drops a dead monster from its list)
    if (m.dead && M.end) drawKing(c, FX, m, T, t);
    // the volley's fire: a flame streaming behind each ball (the engine draws the ball itself over it)
    for (const b of FX.H.eshots || []) { if (!b.calFire) continue; const X = FX.sx(b.x), Y = FX.sy(b.y), v = Math.hypot(b.vx, b.vy) || 1, ux = -b.vx / v, uy = -b.vy / v, L = T * 1.5, r = b.r * T;
      c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(X, Y, X + ux * L, Y + uy * L); g.addColorStop(0, 'rgba(255,200,110,.75)'); g.addColorStop(0.4, 'rgba(255,100,30,.45)'); g.addColorStop(1, 'rgba(255,40,10,0)'); c.fillStyle = g;
      c.beginPath(); c.moveTo(X - uy * r * 1.05, Y + ux * r * 1.05); c.quadraticCurveTo(X + ux * L * 0.5 - uy * r * (0.8 + 0.3 * Math.sin(t * 20)), Y + uy * L * 0.5 + ux * r * 0.8, X + ux * L, Y + uy * L); c.quadraticCurveTo(X + ux * L * 0.5 + uy * r * 0.8, Y + uy * L * 0.5 - ux * r * (0.8 + 0.3 * Math.sin(t * 17)), X + uy * r * 1.05, Y - ux * r * 1.05); c.closePath(); c.fill(); c.restore();
      glowAt(c, X, Y, r * 4, '#FF6A1E', 0.35); }
    // falling and returning bombs (in the air), with the aim guide to the King for those that can be returned
    for (const b of M.bombs) { if (b.cal) continue; if (b.st === 'fall' || b.st === 'fly') { const X = FX.sx(b.x), Y = FX.sy(b.y); if (b.st === 'fall') { c.save(); c.fillStyle = 'rgba(0,0,0,.35)'; const k = 1 - cl(b.z / 8); c.beginPath(); c.ellipse(X, Y, T * 0.5 * (0.4 + 0.6 * k), T * 0.2 * (0.4 + 0.6 * k), 0, 0, TAU); c.fill(); c.restore(); }
        drawLarva(c, X, Y, T, { t, z: b.z, air: true, k: 1 }); if (b.st === 'fly') glowAt(c, X, Y - b.z * ZK * T, T * 0.9, '#FFC060', 0.5); }
      else if ((b.st === 'safe' || b.st === 'supplied') && !m.dead) { const X = FX.sx(b.x), Y = FX.sy(b.y) - T * 0.5, cg = coreG(m, M), TX = FX.sx(cg.x), TY = FX.sy(cg.y), mx = (X + TX) / 2, my = Math.min(Y, TY) - T * 2.2;
        c.save(); c.setLineDash([T * 0.22, T * 0.2]); c.lineDashOffset = -t * T * 1.4; c.strokeStyle = hexA(GOLD, 0.55); c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.moveTo(X, Y); c.quadraticCurveTo(mx, my, TX, TY); c.stroke(); c.setLineDash([]); c.restore(); } }
    // the core, when open: a reticle over it (the weak point) so any attack knows where to go
    if (M.exposed && !m.dead && !M.end) { const cg = coreG(m, M), X = FX.sx(cg.x), Y = FX.sy(cg.y), r = T * (1.0 + 0.08 * Math.sin(t * 7)); c.save(); c.strokeStyle = hexA(GOLD, 0.75); c.lineWidth = Math.max(2, T * 0.07);
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + t * 0.8; c.beginPath(); c.arc(X, Y, r, a + 0.25, a + TAU / 4 - 0.25); c.stroke(); } c.restore(); }
    // the detonation's count, over it
    if (M.ac && M.ac.k === 'charge' && M.ac.phase === 'count' && !m.dead) { const s = Math.max(1, Math.ceil(TM.charge - M.ac.t)), fr = (TM.charge - M.ac.t) % 1, X = FX.sx(m.x), Y = FX.sy(m.y) - (M.zc + SCALE * 1.55) * ZK * T, sz = T * (1.25 + 0.35 * fr);
      glowAt(c, X, Y, sz * 1.6, '#FF4A14', 0.35 + 0.3 * fr); label(c, String(s), X, Y, sz, '#FFF0E0', 'rgba(140,20,0,.9)');
      const need = M.ac.need || 1, got = cl((M.ac.dealt || 0) / need); if (got > 0.01) { const w = T * 2.6, y2 = Y + sz * 0.75; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(X - w / 2, y2, w, T * 0.18); c.fillStyle = GOLD; c.fillRect(X - w / 2, y2, w * got, T * 0.18); }
      // an arrow from the pet toward its nearest SAFE side, when it is not there yet
      const C = FX.C, si = safeOf(C, me.x, me.y); if (si < 0) { const ns = nearestShelter(C, me.x, me.y), px = FX.sx(me.x), py = FX.sy(me.y) - T * 1.8, a = Math.atan2((ns.p.y - me.y) * 1, ns.p.x - me.x); c.save(); c.translate(px, py); c.rotate(a); c.fillStyle = hexA(SAFE, 0.9); c.strokeStyle = 'rgba(0,30,20,.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(T * 0.55, 0); c.lineTo(-T * 0.1, -T * 0.32); c.lineTo(-T * 0.1, -T * 0.12); c.lineTo(-T * 0.45, -T * 0.12); c.lineTo(-T * 0.45, T * 0.12); c.lineTo(-T * 0.1, T * 0.12); c.lineTo(-T * 0.1, T * 0.32); c.closePath(); c.fill(); c.stroke(); c.restore(); label(c, 'TAKE SHELTER', px, py - T * 0.6, T * 0.32, SAFE); } } }

  /* ---------- the stage: CAL.bossMake.calbomb (the rift's boss stage make()) ---------- */
  function make(X, self, H) { const C = X.M.FC || { x: X.M.MW / 2, y: X.M.MH / 2, R: ARENA_R };
    const mod = { C, shelters: shelterList(C), safeOf: (x, y) => safeOf(C, x, y), SAFE_A, SAFE_R0, SAFE_R1,
      hint() { const F = CUR && CUR.FX, M = F && F.mem; if (!M || !M.ac || M.ac.k !== 'charge' || M.ac.phase !== 'count') return null; if (M.sup && M.sup.st === 'supplied') return { x: M.sup.x, y: M.sup.y }; const me = X.me; if (safeOf(C, me.x, me.y) >= 0) return null; return nearestShelter(C, me.x, me.y).p; } };
    CUR = { g: X.g, X, mod, self }; return mod; }
  // (tests: start an act now, drop a larva)
  def.force = (FX, k) => { const m = FX.m, M = FX.mem; clearActs(FX, m, M); m.stunT = 0; startAct(FX, m, M, k); };
  def.drop = FX => { dropBomb(FX, FX.m, FX.mem); stat(FX.mem, 'larvae'); };
  def.make = make; def.MODEL = MODEL; def.SHELTERS = { list: shelterList, safeOf, safeSpot, nearestShelter, inRect, SH_ANG, SH_R, SH_HL, SH_HD, SAFE_A, SAFE_R0, SAFE_R1 }; def.TM = TM; def.DMG = DMG; def.SCALE = SCALE; def.Z = { ZH, ZV, ZR, ZS };
  return { def, make };
})();
RiftFiend.define({ id: 'calbomb', get hpK() { return typeof CAL_BOSS_HPK === 'function' ? CAL_BOSS_HPK('calbomb', 7, 1 / 6) : 1 / 6; }, dmgK: 0.48,   /* (QA v386: blows 0.3 -> 0.48: the pet arrives at about level 8, HP ~180) */ name: 'Bomb King', title: 'Sovereign of the Runebound Foundry', color: '#2A2420', glow: '#FF7A2E', accent: '#FFD27A', biome: typeof BIOMES !== 'undefined' && BIOMES.calderapit ? 'calderapit' : 'volcano', r: 3.0, els: ['fire', 'earth'], phases: 3, cuts: [1, 0.7, 0.35] }, CALBOMB_FIGHT.def);
// (the core's stage hook: CAL.bossMake.calbomb builds the arena's module; guarded, since the core may load without it)
if (typeof CAL !== 'undefined') { if (!CAL.bossMake) CAL.bossMake = {}; CAL.bossMake.calbomb = CALBOMB_FIGHT.make; }
