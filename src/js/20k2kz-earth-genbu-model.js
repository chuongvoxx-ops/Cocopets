/* ---------- Genbu, the Earth turtle machine, on the GPU (lead, 2026-11-14): one connected part set, two forms ----------
   A gigantic mechanical turtle (beige sandstone armour, burnt-orange fittings and drill, dark steel machinery, polished
   piston rods, restrained amber light) that folds into Calamity's drilling vehicle: the same parts at every `xf` (0 the
   turtle, 1 the drill), moved through hinges, rails and arms, never added or removed.
   Origin: the ground under the body's centre; x forward, y left, z up; model units (one tile at scale 1 = VIS).
   Parts: 6 shell sections (front, mid, rear x left, right; spiked, carved, bevelled), the under-hull, the neck (3
   telescoping links), the head (armoured beak, amber eyes), 4 legs (armour, knee, piston, wide clawed foot), 4 track
   cassettes (one per leg, always there), the drill carriage (rails, arms, bearings, the motor), the drill bit (helical
   flutes, cutting teeth, a tapered point; one bit, it may fly off as Drill Cannon's projectile and come back), the
   cockpit (seat, controls, rails) on the rear chassis, the tail.
   Channels (blankPose): xf, walk (phase), walkK, crouch, roll, bank, pitch, drillSpin (phase), drillOff ([x,y,z] model
   units from its dock, null at home), drillYaw, drillPitch, drillGlow, glow, crumble, ground (a world height in model
   units below which nothing is drawn: burrowing), alpha.
   Materials: GLM ids 69-74 (Genbu's, see 20k5uz), 72 chrome, 73 amber. */
const GENBU_MODEL = (() => {
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, u) => { const t = cl((u - a) / (b - a)); return t * t * (3 - 2 * t); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => hyp3(a[0], a[1], a[2]);
  const vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const M3 = (x, y, z) => ({ x, y, z }), I3 = () => M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };   // (+a: the nose down)
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  const MIR = M3([1, 0, 0], [0, -1, 0], [0, 0, 1]);   // (the left side's parts are the right side's meshes, mirrored)
  const mir = R => mm(MIR, mm(R, MIR));
  const hsh = x => { const v = Math.sin(x * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

  /* the game camera (as the other models) */
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195, VIS = 1.0;
  const M_SAND = 69, M_ORG = 70, M_STL = 71, M_CHR = 72, M_AMB = 73, M_TRK = 74, M_BORE = 7;

  /* ================= the shape ================= */
  const SA = 1.95, SB = 1.55, SC = 1.2, H0 = 1.18;   // the shell dome: semi-axes and the rim's height in the turtle
  const XSEC = [[-SA * 0.97, -0.62], [-0.58, 0.58], [0.62, SA * 0.97]];   // the three rows of sections (rear, mid, front)
  const dome = (x, th, k) => { const f = Math.sqrt(Math.max(0, 1 - (x / SA) * (x / SA))), kk = k || 1; return [x, SB * f * Math.cos(th) * kk, H0 + SC * f * Math.sin(th) * kk]; };   // th 0 the rim (right side, +y), PI/2 the crown
  const HIP = [[0.98, 1.02], [-1.02, 1.02]];   // the hips (x, |y|) of the front and rear legs, under the rim
  const LEG_L = 1.12, NECK0 = [1.72, 0, 0.98], NECK_L = 0.32, NLINK = 3;
  const DOCK0 = [0.72, 0, 3.13], DOCK1 = [2.3, 0, 0.78];   // the drill's mount: on the carriage over the shell (turtle), low at the bow on the centreline, the housing tucked against the front shell's nose (drill form)
  const DRIVE1 = [1.93, 0, 1.58], RAM_A = [-0.42, 0.565, 0.12], RAM_B = [-0.95, 0.475, -0.22], RAM_LC = 0.55, RAM_LR = 0.6;   // (the drive's bay inside the hull in drill form, body frame: the motor under the crown behind the neck recess; the rams' eyes on the housing and the motor, their cylinder and rod lengths)
  const SEAT0 = [-1.42, 0, 2.18];   // the cockpit's floor on the rear chassis
  const DRILL_L = 2.6, DRILL_R = 0.6;

  /* ================= meshes ================= */
  let MESH = null, MESH_MS = 0;
  function buildMeshes() {
    const q = lowFx() ? 0.7 : 1, n = v => Math.max(4, Math.round(v * q)), M = {};
    const spikeOn = (B, p, nrm, h, r) => { const b = vadd(p, vmul(nrm, -0.03)); B.spike(b, vadd(p, vmul(nrm, h)), r, M_ORG, { seg: 8 }); B.tube(vadd(p, vmul(nrm, -0.02)), vadd(p, vmul(nrm, 0.05)), r * 1.25, r * 1.1, M_STL, { seg: 10, cap0: false, cap1: 'flat' }); };
    /* (the triangle budget, 2026-11-14: about 97k triangles a frame at full detail and 51k on lowFx, from 189k and 125k -
       shell sections, legs and tracks count 2x and 4x, so their small parts were trimmed first; hidden faces left out
       (the frame's top under the main plate, the upper foot tiers' undersides, the collars' feet, the track's guide
       horns); small bevels kept only where they read; lowFx draws bevels under 0.04 sharp. A rivet is a low dome - a hexagonal cap with smooth normals, 6 triangles drawn - when
       the surface's normal is known, else a hexagonal bipyramid (12); at the game camera either is a 2-4 px chrome dot) */
    const LO = lowFx(), nz = z => { const a = Math.abs(z[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], x = vnrm(vcross(a, z)); return [x, vcross(z, x), z]; };
    const riv = (B, p, r, nrm) => { if (nrm) { const F = nz(vnrm(nrm)); B.push(F[0], F[1], F[2], p); B.ell([0, 0, 0], [r, r, r], M_CHR, { seg: 6, rings: 1, th1: Math.PI / 2 }); B.pop(); } else B.ell(p, [r, r, r], M_CHR, { seg: 6, rings: 2 / q }); };
    const rivets = (B, pts, r, nrm) => { for (const p of pts) riv(B, p, r || 0.03, nrm); };
    const GB = () => { const B = GLM.builder(q); if (LO) { const bx = B.box; B.box = (c, h, b, m, mf) => bx(c, h, b < 0.04 ? 0 : b, m, mf); } return B; };   // (lowFx: small bevels - 108 triangles a box - drawn as sharp boxes, 12)
    const vent = (B, p, nrm, dir, L, W, nl) => { B.along(p, dir, nrm); B.box([0, 0, -0.012], [L, W, 0.02], 0, M_STL); for (let i = 0; i < nl; i++) B.box([lerp(-L * 0.75, L * 0.75, nl > 1 ? i / (nl - 1) : 0.5), 0, 0.006], [0.012, W * 0.8, 0.014], 0.004, M_ORG); B.pop(); };
    /* ---- the shell (modeller C, 2026-11-14). Built on the dome's own surface frame: shS(x, th, h) is the dome point
       lifted h along its true normal (so every plate has the same real thickness, the ends included), shInv a point
       back to (x, th). A plate (shSlab) is an outline in (x, th) inset in 3D (per-edge distances, true mitres), a wall
       from h0, a 45-degree chamfer, a flat top; its creases kept crisp by doubled rows, its foot in shade (ao), its edges
       worn (edge: chips in the shader). A section: a steel underlay (the dark gap round it), a thick orange frame, the
       beige main plate, stepped sub-plates and a raised medallion with a carved glyph, rivet rows, the heavy orange rim
       band (steel brackets, amber slots), clamps across its gaps, big orange spikes on octagonal steel collars. */
    const shN = (x, th) => { const p = dome(x, th, 1); return vnrm([x / (SA * SA), p[1] / (SB * SB), (p[2] - H0) / (SC * SC)]); };
    const shS = (x, th, h) => { const p = dome(x, th, 1); return h ? vadd(p, vmul(shN(x, th), h)) : p; };
    const shInv = p => [Math.max(-SA * 0.999, Math.min(SA * 0.999, p[0])), Math.atan2((p[2] - H0) / SC, p[1] / SB)];
    const shPer = (poly, step) => { const out = [], np = poly.length; for (let i = 0; i < np; i++) { const a = poly[i], b = poly[(i + 1) % np], L = vlen(vsub(shS(a[0], a[1], 0), shS(b[0], b[1], 0))), k = Math.max(1, Math.ceil(L / step));
      for (let j = 0; j < k; j++) out.push({ p: [lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)], ea: j ? i : (i + np - 1) % np, eb: i }); } return out; };   // (a polygon's perimeter, cut to ~step; each point knows the edges before and after it)
    const shIn = (per, dE) => { const np = per.length, P3 = per.map(e => shS(e.p[0], e.p[1], 0)); let c = [0, 0, 0]; for (const p of P3) c = vadd(c, p); c = vmul(c, 1 / np);
      return per.map((e, i) => { const qq = P3[i], N = shN(e.p[0], e.p[1]), io = t => { const v = vnrm(vcross(N, t)); return vdot(v, vsub(c, qq)) < 0 ? vmul(v, -1) : v; }, n1 = io(vsub(qq, P3[(i + np - 1) % np])), n2 = io(vsub(P3[(i + 1) % np], qq));
        const d1 = dE[e.ea], d2 = dE[e.eb], cc = vdot(n1, n2), den = 1 - cc * cc; let off = den < 1e-3 ? vmul(vnrm(vadd(n1, n2)), (d1 + d2) / 2) : vadd(vmul(n1, (d1 - cc * d2) / den), vmul(n2, (d2 - cc * d1) / den));
        const lo = vlen(off), mx = 2.2 * Math.max(d1, d2, 1e-6); if (lo > mx) off = vmul(off, mx / lo); return shInv(vadd(qq, off)); }); };   // (each point moved in by its edges' distances, in the surface)
    const shSlab = (B, per, dE, h0, h1, bv, m, inn) => { const add = k => dE.map(d => d + k), R0 = shIn(per, dE), R1 = shIn(per, add(bv)), R2 = shIn(per, add(bv + 0.035)), np = per.length; let cx = 0, ct = 0; for (const p of R2) { cx += p[0]; ct += p[1]; } cx /= np; ct /= np;
      const rows = [[R0, h0, 0.2, 0.42], [R0, h1 - bv, 0.66, 0.92], [R0, h1 - bv, 0.74, 0.92], [R1, h1, 0.8, 1], [R1, h1, 0.62, 1], [R2, h1, 0, 1]];
      for (const t of inn || [0.7, 0.4, 0.14, 0.003]) rows.push([R2.map(p => [lerp(cx, p[0], t), lerp(ct, p[1], t)]), h1, 0, 1]);
      const NR = rows.length - 1, row = v => rows[Math.round(v * NR)];
      B.surf((u, v) => { const r = row(v), p = r[0][Math.round(u * np) % np]; return shS(p[0], p[1], r[1]); }, np, NR, () => m, { e: (u, v) => row(v)[2], a: (u, v) => row(v)[3] }); };
    const shFrame = (x, th, h) => { const p = shS(x, th, h), N = shN(x, th), tx = vnrm(vsub(shS(x + 0.01, th, h), p)); return [tx, vcross(N, tx), N, p]; };   // (x along the dome, y up the meridian, z out)
    const shSpike = (B, x, th, hb, H, r) => { const p = shS(x, th, hb), d = vnrm(vadd(shN(x, th), [0, 0, 0.65])); H *= 1.15; r *= 1.15; B.along(p, d);
      B.lathe([[-0.08, r * 1.3], [0.02, r * 1.3], [0.045, r * 1.17], [0.075, r * 1.13], [0.075, r * 1.04]], M_STL, { seg: 8, edge: j => (j === 1 || j === 2 ? 0.85 : 0.2) });   // (the steel collar: octagonal, chamfered; its foot open, inside the plates)
      B.lathe([[0.075, r * 1.06], [0.075, r], [0.11, r * 0.985], [H * 0.55, r * 0.46], [H * 0.86, r * 0.13], [H, 0.004]], M_ORG, { seg: n(10), edge: j => [0, 0.5, 0.5, 0.2, 0.75, 1][j] });   // (the cone, its worn tip)
      if (!LO) B.torX([0.13, 0, 0], r * 0.975, 0.013, M_STL, { seg: n(10), rseg: 4 });
      if (!LO) for (let i = 0; i < 3; i++) { const a = (i + 0.5) / 3 * TAU, ca = Math.cos(a), sa = Math.sin(a); riv(B, [0.03, ca * r * 1.2, sa * r * 1.2], 0.016, [0.6, 0.8 * ca, 0.8 * sa]); }
      B.pop(); };
    const shGlyph = (B, x, th, h, s) => { const [tx, ty, N, c] = shFrame(x, th, h + 0.004), w = 0.016, at2 = (a, b) => { const Q = vadd(c, vadd(vmul(tx, a * s), vmul(ty, -b * s))), t2 = shInv(Q); return shS(t2[0], t2[1], h + 0.004); };   // (a carved stepped-chevron glyph: grooves laid on the plate, material 69.3 = the groove)
      const lines = [[[-1, -0.55], [-0.62, -0.55], [-0.62, -0.18], [-0.24, -0.18], [-0.24, 0.2], [0, 0.42], [0.24, 0.2], [0.24, -0.18], [0.62, -0.18], [0.62, -0.55], [1, -0.55]], [[-0.4, -0.55], [0, -0.2], [0.4, -0.55]], [[-0.62, -0.78], [0.62, -0.78]], [[-0.05, 0.62], [0.05, 0.62]]];
      for (const L of lines) for (let i = 0; i + 1 < L.length; i++) { const a = L[i], b = L[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ox = -dy / l * w / s, oy = dx / l * w / s, ex = dx / l * w / s, ey = dy / l * w / s;
        B.surf((u, v) => { const t = u; return at2(lerp(a[0] - ex, b[0] + ex, t) + (v - 0.5) * 2 * ox, lerp(a[1] - ey, b[1] + ey, t) + (v - 0.5) * 2 * oy); }, Math.max(1, Math.round(l * s / 0.08)), 1, () => M_SAND + 0.3, { e: () => 0, a: () => 0.7 }); } };
    const shSkirt = (B, x0, x1) => { const pA = Math.acos(Math.max(-1, Math.min(1, x1 / SA))), pB = Math.acos(Math.max(-1, Math.min(1, x0 / SA))), NS = n(Math.max(6, Math.ceil((pB - pA) * 12))), rim = ph => { const c = Math.cos(ph), s = Math.sin(ph); return { o: [SA * c, SB * s, H0], nP: vnrm([c / SA, s / SB, 0]), t: vnrm([SA * s, -SB * c, 0]) }; };   // (the heavy orange rim band along the rim ellipse, x1 to x0; t points forward)
      const prof = [[-0.03, 0.03, 0.3, 0.5], [0.11, 0.03, 0.9, 0.95], [0.11, 0.03, 0.9, 0.95], [0.135, 0.006, 0.7, 1], [0.135, 0.006, 0.6, 1], [0.135, -0.15, 0.6, 1], [0.135, -0.15, 0.6, 1], [0.112, -0.175, 0.9, 0.8], [0.112, -0.175, 0.9, 0.8], [-0.02, -0.175, 0.3, 0.45]], NP = prof.length - 1;
      const at3 = (ph, pr) => { const R = rim(ph); return vadd(R.o, vadd(vmul(R.nP, pr[0]), [0, 0, pr[1]])); };
      B.surf((u, v) => at3(lerp(pA, pB, u), prof[Math.round(v * NP)]), NS, NP, () => M_ORG, { e: (u, v) => prof[Math.round(v * NP)][2], a: (u, v) => prof[Math.round(v * NP)][3] });
      for (const ph of [pA, pB]) B.facet(prof.map(pr => at3(ph, pr)), M_ORG);   // (its ends)
      const L = (pB - pA) * 1.7, nb = Math.max(2, Math.round(L / 0.3));
      for (let i = 0; i <= nb * 2; i++) { const ph = lerp(pA, pB, (i + 0.5) / (nb * 2 + 1)), R = rim(ph); B.push(R.t, R.nP, [0, 0, 1], vadd(R.o, vmul(R.nP, 0.135)));
        if (i % 2 === 0) { B.box([0, 0.012, -0.072], [0.036, 0.024, 0.118], 0, M_STL); if (!LO) rivets(B, [[0, 0.036, -0.01], [0, 0.036, -0.135]], 0.017, [0, 1, 0]); B.box([0, -0.02, -0.2], [0.03, 0.05, 0.03], 0, M_STL); }   // (a steel bracket clamped over the band)
        else { B.box([0, 0.004, -0.074], [0.085, 0.01, 0.03], 0, M_STL); B.box([0, 0.009, -0.074], [0.068, 0.008, 0.014], 0, M_AMB); if (!LO) rivets(B, [[-0.12, 0.004, -0.074], [0.12, 0.004, -0.074]], 0.013, [0, 1, 0]); }   // (an amber light slot in a steel bezel; rivets)
        B.pop(); } };
    // a section (right side) of x0..x1: lay.subs the stepped sub-plates and lay.med the medallion (outlines in the section's own u (x0..x1), v (rim..crown), each vertex's third value 1 when the edge from it runs along the section's border), lay.sp the spikes [u, v, height, radius], lay.next: a neighbour beyond x1 (clamps across that gap)
    const section = (x0, x1, lay) => { const B = GB(), stp = LO ? 0.27 : 0.18, TB = Math.PI / 2 - 0.022, X = u => lerp(x0, x1, u), TH = v => lerp(0, TB, v);
      const P = pts => shPer(pts.map(([u, v, k]) => [X(u), TH(v), k]), stp), dEof = (pts, a, b) => pts.map(p => a + b * p[2]);
      B.surf((u, v) => shS(lerp(Math.max(-SA * 0.985, x0 - 0.045), Math.min(SA * 0.985, x1 + 0.045), u), lerp(0, Math.PI / 2, v), -0.03), n(8), n(8), () => M_STL, { a: () => 0.22 });   // (the steel underlay: the dark gap round the plate)
      const out = [[0, 0, 1], [1, 0, 1], [1, 0.9, 1], [0.94, 1, 1], [0.06, 1, 1], [0, 0.9, 1]], pOut = P(out);
      shSlab(B, pOut, dEof(out, 0.025, 0), -0.035, 0.08, 0.035, M_ORG, [0.8]);   // (the thick orange frame: open inside, under the main plate)
      shSlab(B, pOut, dEof(out, 0.165, 0), 0.04, 0.135, 0.042, M_SAND, LO ? [0.5, 0.003] : [0.6, 0.003]);   // (the beige main plate: seen only round its border and in the grooves)
      for (const sb of lay.subs) shSlab(B, P(sb), dEof(sb, 0.032, 0.19), 0.09, 0.172, 0.03, M_SAND, [0.5, 0.003]);   // (the stepped sub-plates, grooves between)
      shSlab(B, P(lay.med), dEof(lay.med, 0, 0), 0.14, 0.205, 0.024, M_SAND, LO ? [0.003] : [0.5, 0.003]);   // (the raised medallion)
      { let cu = 0, cv = 0; for (const p of lay.med) { cu += p[0]; cv += p[1]; } cu /= lay.med.length; cv /= lay.med.length; shGlyph(B, X(cu), TH(cv), 0.205, lay.gs || 0.17); }
      { const pR = shPer(out.map(([u, v, k]) => [X(u), TH(v), k]), 0.11 / q), rv = shIn(pR, pR.map(() => 0.105)); for (let i = 0; i < rv.length; i++) if (i % (LO ? 3 : 2) === 0) riv(B, shS(rv[i][0], rv[i][1], 0.08), 0.02, shN(rv[i][0], rv[i][1])); }   // (rivet rows round the frame)
      shSkirt(B, x0 + 0.035, x1 - 0.035);
      for (const s of lay.sp) shSpike(B, X(s[0]), TH(s[1]), 0.15, s[2], s[3]);
      if (lay.next) for (const v of [0.12, 0.45, 0.78]) { const F = shFrame(x1 + 0.02, TH(v), 0.045); B.push(F[0], F[1], F[2], F[3]); B.box([0, 0, 0], [0.085, 0.06, 0.032], 0.014, M_STL); rivets(B, [[-0.055, 0, 0.03], [0.055, 0, 0.03]], 0.017, [0, 0, 1]); B.pop(); }   // (steel clamps across the gap to the next section)
      for (const u of [0.22, 0.78]) { const F = shFrame(X(u), Math.PI / 2 - 0.035, 0.045); B.push(F[0], F[1], F[2], F[3]); B.box([0, -0.012, 0], [0.06, 0.05, 0.03], 0.012, M_STL); riv(B, [0, -0.012, 0.028], 0.016, [0, 0, 1]); B.pop(); }   // (clamps over the spine seam: the mirrored half completes each)
      return B.done(); };
    M.secR = section(XSEC[0][0], XSEC[0][1], { next: 1, gs: 0.15,
      subs: [[[0.12, 0, 1], [0.5, 0, 0], [0.5, 0.3, 0], [0.12, 0.3, 0]], [[0.5, 0, 1], [1, 0, 1], [1, 0.3, 0], [0.5, 0.3, 0]], [[0.15, 0.3, 0], [1, 0.3, 1], [1, 1, 1], [0.38, 1, 0], [0.15, 0.55, 0]]],
      med: [[0.4, 0.45, 0], [0.82, 0.45, 0], [0.9, 0.62, 0], [0.82, 0.8, 0], [0.4, 0.8, 0], [0.32, 0.62, 0]],
      sp: [[0.72, 0.43, 0.52, 0.15], [0.36, 0.4, 0.42, 0.13], [0.6, 0.15, 0.28, 0.1], [0.2, 0.62, 0.3, 0.1], [0.08, 0.3, 0.22, 0.08]] });   // (the upper spikes kept below the carriage's flank rails)
    M.secM = section(XSEC[1][0], XSEC[1][1], { next: 1, gs: 0.19,
      subs: [[[0, 0, 1], [0.34, 0, 0], [0.34, 0.3, 0], [0, 0.3, 1]], [[0.34, 0, 1], [0.66, 0, 0], [0.66, 0.3, 0], [0.34, 0.3, 0]], [[0.66, 0, 1], [1, 0, 1], [1, 0.3, 0], [0.66, 0.3, 0]], [[0, 0.3, 0], [1, 0.3, 1], [1, 0.84, 1], [0.84, 1, 1], [0.16, 1, 1], [0, 0.84, 1]]],
      med: [[0.3, 0.44, 0], [0.7, 0.44, 0], [0.82, 0.6, 0], [0.7, 0.77, 0], [0.3, 0.77, 0], [0.18, 0.6, 0]],
      sp: [[0.25, 0.45, 0.56, 0.155], [0.75, 0.44, 0.5, 0.15], [0.5, 0.2, 0.42, 0.13], [0.06, 0.14, 0.24, 0.085], [0.94, 0.14, 0.24, 0.085]] });
    M.secF = section(XSEC[2][0], XSEC[2][1], { next: 0, gs: 0.15,
      subs: [[[0, 0, 1], [0.5, 0, 0], [0.5, 0.3, 0], [0, 0.3, 1]], [[0.5, 0, 1], [0.88, 0, 0], [0.88, 0.3, 0], [0.5, 0.3, 0]], [[0, 0.3, 0], [0.85, 0.3, 0], [0.85, 0.55, 0], [0.62, 1, 1], [0, 1, 1]]],
      med: [[0.18, 0.45, 0], [0.6, 0.45, 0], [0.68, 0.62, 0], [0.6, 0.8, 0], [0.18, 0.8, 0], [0.1, 0.62, 0]],
      sp: [[0.3, 0.44, 0.52, 0.15], [0.64, 0.3, 0.42, 0.13], [0.24, 0.15, 0.28, 0.1]] });
    { const B = GB(), ZC = H0 - 0.24, zb = (x, y) => ZC - 0.5 * Math.sqrt(Math.max(0, 1 - (x / (SA * 0.92)) ** 2 - (y / (SB * 0.84)) ** 2));   // ---- the under-hull (modeller C): the dark steel core, the steel structural ring under the rim (open at the neck), machinery bays between the legs (an orange beam, a sill, ribs, amber vents behind steel slats, hydraulic lines), belly armour, the hip sockets' collars, the neck's recess (a steel well in a riveted orange collar), the tail's housing and exhaust vents, the cockpit's pillar and its saddle
      B.ell([0, 0, ZC], [SA * 0.92, SB * 0.84, 0.5], M_STL, { seg: n(20), rings: n(8) });
      B.surf((u, v) => { const a = lerp(0.3, TAU - 0.3, u), j = Math.round(v * 4), r = [0.972, 0.982, 0.982, 0.95, 0.93][j], z = [H0 + 0.02, H0 - 0.02, H0 - 0.25, H0 - 0.3, H0 - 0.3][j]; return [SA * r * Math.cos(a), SB * r * Math.sin(a), z]; }, n(48), 4, () => M_STL, { e: (u, v) => [0.3, 0.9, 0.9, 0.5, 0.2][Math.round(v * 4)], a: (u, v) => (v > 0.8 ? 0.55 : 1) });   // (the structural ring)
      for (const sy of [1, -1]) { const Y = y => sy * y;
        B.box([0, Y(1.3), 0.965], [0.6, 0.075, 0.045], 0.02, M_ORG); B.box([0, Y(1.22), 0.6], [0.63, 0.1, 0.055], 0.025, M_STL);   // (the mid bay: the beam under the band, the sill)
        for (const x of [-0.52, -0.175, 0.175, 0.52]) { B.box([x, Y(1.28), 0.78], [0.032, 0.075, 0.17], 0.014, M_STL); rivets(B, [[x, Y(1.352), 0.66], [x, Y(1.352), 0.9]], 0.017, [0, sy, 0]); }   // (the ribs)
        for (const x of [-0.347, 0, 0.347]) { B.box([x, Y(1.19), 0.84], [0.13, 0.012, 0.08], 0, M_AMB); for (let k = 0; k < 4; k++) B.box([x, Y(1.235), 0.773 + k * 0.044], [0.135, 0.03, 0.009], 0, M_STL); }   // (vents: amber glow behind steel slats)
        B.tube([-0.66, Y(1.335), 0.69], [0.66, Y(1.335), 0.69], 0.022, 0.022, M_STL, { seg: 6, cap0: 'flat', cap1: 'flat' }); B.tube([-0.66, Y(1.35), 0.725], [0.66, Y(1.35), 0.725], 0.014, 0.014, M_CHR, { seg: 6, cap0: 'flat', cap1: 'flat' });   // (hydraulic lines)
        for (const x of [-1.0, -0.34, 0.34, 1.0]) { const z = zb(x, 0.44) - 0.02; B.box([x, Y(0.44), z], [0.29, 0.37, 0.04], 0, M_SAND); B.box([x, Y(0.44), z - 0.03], [0.315, 0.395, 0.022], 0, M_ORG); B.box([x, Y(0.44), z - 0.056], [0.18, 0.02, 0.008], 0, M_AMB); }   // (belly armour, a light strip under each: facing the ground, never seen from above, so unbevelled)
        for (const x of [-0.34, 0.34]) { const c6 = Math.cos(0.6), s6 = Math.sin(0.6); B.push([1, 0, 0], [0, c6, sy * s6], [0, -sy * s6, c6], [x, Y(1.0), 0.55]); B.box([0, 0, 0], [0.3, 0.2, 0.035], 0, M_SAND); B.box([0, 0, -0.03], [0.32, 0.22, 0.02], 0, M_ORG); B.pop(); }   // (the sloped flank plates, under the hull)
        for (const hp of HIP) { B.ell([hp[0], Y(hp[1]), LEG_L], [0.3, 0.26, 0.3], M_STL, { seg: n(8), rings: 4 }); B.torY([hp[0], Y(hp[1] + 0.2), LEG_L], 0.37, 0.05, M_ORG, { seg: n(16), rseg: 4 }); B.torY([hp[0], Y(hp[1] + 0.16), LEG_L], 0.43, 0.03, M_STL, { seg: n(16), rseg: 4 }); }   // (the hip sockets: a steel cup, an orange collar, a steel flange)
        B.box([1.72, Y(0.58), NECK0[2] - 0.05], [0.16, 0.06, 0.2], 0.03, M_STL); B.box([1.8, Y(0.645), NECK0[2] - 0.02], [0.05, 0.012, 0.035], 0, M_AMB);   // (the neck's side housings, a running light)
        B.box([-1.62, Y(0.5), 0.86], [0.14, 0.1, 0.12], 0.03, M_STL); B.box([-1.66, Y(0.6), 0.86], [0.09, 0.01, 0.08], 0.005, M_AMB); for (let k = 0; k < 3; k++) B.box([-1.66, Y(0.62), 0.81 + k * 0.05], [0.1, 0.02, 0.01], 0, M_STL);   // (the rear exhaust vents)
        B.box([-1.42, Y(0.27), 1.78], [0.17, 0.018, 0.3], 0, M_ORG); B.tube([-1.2, Y(0.2), 1.42], [-1.3, Y(0.2), 2.08], 0.03, 0.03, M_STL, { seg: 6, cap0: 'flat', cap1: 'flat' }); B.tube([-1.24, Y(0.2), 1.62], [-1.3, Y(0.2), 2.06], 0.018, 0.018, M_CHR, { seg: 6, cap0: 'flat', cap1: 'flat' }); }   // (the pillar's side plates and struts)
      { const NZ = NECK0[2]; B.tube([1.5, 0, NZ], [1.9, 0, NZ], 0.44, 0.46, M_STL, { seg: n(20), cap0: 'flat', cap1: false }); B.torX([1.9, 0, NZ], 0.47, 0.065, M_ORG, { seg: n(22), rseg: 5 }); B.torX([1.945, 0, NZ], 0.43, 0.025, M_STL, { seg: n(18), rseg: 4 });
        for (let k = 0; k < 10; k += LO ? 2 : 1) { const a = (k + 0.5) / 10 * TAU; riv(B, [1.95, Math.cos(a) * 0.47, NZ + Math.sin(a) * 0.47], 0.02, [1, 0, 0]); } }   // (the neck's recess)
      { const TZ = H0 - 0.22; B.tube([-1.6, 0, TZ], [-1.86, 0, TZ], 0.28, 0.3, M_STL, { seg: n(16), cap0: 'flat', cap1: false }); B.torX([-1.84, 0, TZ], 0.3, 0.055, M_ORG, { seg: n(16), rseg: 4 }); }   // (the tail's housing)
      B.box([-1.42, 0, 1.75], [0.22, 0.26, 0.4], 0.05, M_STL); B.box([-1.42, 0, 2.14], [0.3, 0.3, 0.025], 0, M_ORG);   // (the cockpit's pillar, its saddle under the deck: inside the cockpit's plinth, so unbevelled and unriveted)
      M.hull = B.done(); }
    /* ---- the neck, the head, the jaw and the legs (head & legs modeller): their helpers ----
       sup: a signed power (superelliptic, boxy-round sections); crs: a Catmull-Rom row through a table (smooth lofts);
       surfO: a surface whose facing follows an outward hint; shingle: an armour plate lying on a body P(u, a, k) (k the
       radial scale about the section's centre) over u0..u1, a0..a1, its face rising from ka (at u0) to kb (at u1) - so the
       plates overlap in visible steps - with orange trim round its border and edge bands down to kin */
    const sup = (t, p) => (t < 0 ? -1 : 1) * Math.pow(Math.abs(t), p);
    const crs = (T, u) => { const nn = T.length - 1, f = Math.min(nn - 1e-6, Math.max(0, u * nn)), i = Math.floor(f), t = f - i, g = j => T[Math.max(0, Math.min(nn, j))], a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2), t2 = t * t, t3 = t2 * t;
      return b.map((_, k) => 0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t3)); };
    const surfO = (B, pos, nu, nv, mf, ef, hint) => { const du = vsub(pos(0.52, 0.5), pos(0.48, 0.5)), dv = vsub(pos(0.5, 0.52), pos(0.5, 0.48)); B.surf(pos, nu, nv, mf, { e: ef, flip: vdot(vcross(du, dv), hint) < 0 }); };
    const shingle = (B, P, u0, u1, a0, a1, kin, ka, kb, nu, nv, mFace, mTrim) => { const U = u => lerp(u0, u1, u), An = v => lerp(a0, a1, v), K = u => lerp(ka, kb, u), mx = Math.max(nu, nv);
      B.surf((u, v) => P(U(u), An(v), K(u)), nu, nv, (u, v) => (Math.min(u, 1 - u) < 0.5 / nu || Math.min(v, 1 - v) < 0.5 / nv ? mTrim : mFace), { e: (u, v) => { const d = Math.min(u, 1 - u, v, 1 - v); return d < 0.5 / mx ? 1 : d < 1.5 / mx ? 0.45 : 0; } });
      const ed = (pos, nn, hint) => surfO(B, pos, nn, 1, () => mTrim, (s, t) => (t < 0.5 ? 1 : 0.4), hint), e = 1e-3, am = (a0 + a1) / 2, um = (u0 + u1) / 2, dU = u => vsub(P(u + e, am, 1), P(u - e, am, 1)), dA = a => vsub(P(um, a + e, 1), P(um, a - e, 1));
      ed((s, t) => P(u0, An(s), lerp(ka, kin, t)), nv, vmul(dU(u0), -1)); ed((s, t) => P(u1, An(s), lerp(kb, kin, t)), nv, dU(u1));
      ed((s, t) => P(U(s), a0, lerp(K(s), kin, t)), nu, vmul(dA(a0), -1)); ed((s, t) => P(U(s), a1, lerp(K(s), kin, t)), nu, dA(a1)); };
    for (let j = 0; j < NLINK; j++) { const B = GB(), r = 0.345 - j * 0.045, L = NECK_L, NS = n(16), PC = (x, a, k) => [x, k * r * Math.sin(a), k * r * Math.cos(a)];   // ---- a neck link along +x (telescoping: each nests in the one behind it): a ribbed dark steel sleeve, a thick orange collar at its mouth, a chrome wiper ring at its tail, a beige armour saddle on top (orange trim, rivets), an amber slot each side, hoses underneath
      B.lathe([[-0.02, r * 0.84], [0.0, r * 0.95], [0.03, r * 0.99], [L - 0.08, r], [L - 0.08, r, M_ORG], [L - 0.07, r * 1.09, M_ORG], [L - 0.014, r * 1.09, M_ORG], [L, r * 1.02, M_ORG], [L, r * 0.84, M_ORG]], M_STL, { seg: NS, edge: k => (k >= 5 && k <= 7 ? 0.9 : 0) });
      for (const x of [0.075, 0.13]) B.torX([x, 0, 0], r * 0.995, 0.011, M_STL, { seg: NS, rseg: 4 });   // (the ribs)
      B.torX([0.012, 0, 0], r * 0.97, 0.016, M_CHR, { seg: NS, rseg: 4 });   // (the wiper ring)
      shingle(B, PC, 0.035, L - 0.09, -1.1, 1.1, 0.99, 1.1, 1.065, n(5), n(12), M_SAND, M_ORG);   // (the saddle, its back edge proud)
      for (const [x, a, k] of [[0.06, -0.85, 1.1], [0.06, 0.85, 1.1], [0.06, 0, 1.105], [L - 0.12, -0.85, 1.07], [L - 0.12, 0.85, 1.07]]) riv(B, PC(x, a, k), 0.014, [0, Math.sin(a), Math.cos(a)]);
      for (const sd of [1, -1]) { B.box([L * 0.48, sd * r, -r * 0.2], [0.045, 0.014, 0.016], 0.006, M_AMB); B.tube(PC(0.02, sd * 2.45, 1.06), PC(L - 0.085, sd * 2.45, 1.06), 0.021, 0.021, M_STL, { seg: 6, cap0: 'flat', cap1: 'flat' }); }
      M['neck' + j] = B.done(); }
    { const B = GB(), lo = lowFx();   // ---- the head (origin: the back of the skull, in the last neck link's collar; x to the beak, z up; ~0.95 long, 0.6 wide): a broad superelliptic skull (a steel throat), three layered beige armour plates over it with orange trim and rivets, a heavy brow over each deep-set amber eye (a steel socket, an orange bezel), cheek plates, the jaw's hinge bosses, vents, and a strong hooked upper beak (beige, an orange ridge plate, a steel hook with a chrome edge) curving down over the jaw
      const SK = [[-0.07, 0.1, 0.09, -0.09], [0.03, 0.22, 0.21, -0.18], [0.13, 0.275, 0.26, -0.2], [0.23, 0.29, 0.275, -0.19], [0.33, 0.285, 0.26, -0.16], [0.43, 0.25, 0.22, -0.12], [0.53, 0.18, 0.16, -0.08], [0.63, 0.07, 0.08, -0.04]];   // (x evenly spaced: half width, top, bottom)
      const ux = x => (x + 0.07) / 0.7, PS = (u, a, k) => { const s = crs(SK, u), zc = (s[2] + s[3]) / 2, hh = (s[2] - s[3]) / 2; return [s[0], k * s[1] * sup(Math.sin(a), 0.62), zc + k * hh * sup(Math.cos(a), 0.62)]; };   // (a 0 the crown, +PI/2 the +y side)
      B.surf((u, v) => PS(u, lerp(-Math.PI, Math.PI, v), 1), n(12), n(22), (u, v) => (Math.cos(lerp(-Math.PI, Math.PI, v)) < -0.55 ? M_STL : M_SAND), {});
      shingle(B, PS, ux(-0.03), ux(0.18), -1.3, 1.3, 1.0, 1.035, 1.085, n(5), n(14), M_SAND, M_ORG);   // (the rear plate; each plate's front edge stands proud of the next)
      shingle(B, PS, ux(0.13), ux(0.34), -1.27, 1.27, 1.0, 1.03, 1.08, n(5), n(14), M_SAND, M_ORG);
      shingle(B, PS, ux(0.29), ux(0.5), -1.12, 1.12, 1.0, 1.03, 1.075, n(5), n(12), M_SAND, M_ORG);   // (the forehead plate)
      if (!lo) for (const [x, k] of [[0.175, 1.09], [0.335, 1.085], [0.495, 1.08]]) for (const a of [-0.75, -0.25, 0.25, 0.75]) riv(B, PS(ux(x - 0.012), a, k - 0.005), 0.012, [0, Math.sin(a), Math.cos(a)]);
      for (const sd of [1, -1]) { const A0 = sd > 0 ? 1.25 : -2.1, A1 = sd > 0 ? 2.1 : -1.25;
        shingle(B, PS, ux(0.02), ux(0.3), A0, A1, 1.0, 1.085, 1.035, n(5), n(6), M_SAND, M_ORG);   // (a cheek plate, its back edge proud)
        if (!lo) for (const a of [1.4, 1.7, 1.95]) riv(B, PS(ux(0.05), sd * a, 1.085), 0.012, [0, sd * Math.sin(a), Math.cos(a)]);
        // the brow: a tapered plate over an orange underlayer, sloping down forward and drooping outward over the eye
        const ol = [[-0.13, -0.06], [0.1, -0.065], [0.155, -0.01], [0.11, 0.07], [-0.1, 0.075]].map(p => [p[0], sd * p[1]]); if (sd < 0) ol.reverse();
        B.along([0.38, sd * 0.275, 0.175], [1, 0, -0.3], [0, sd * 0.65, 1]); B.prism(ol.map(p => [p[0] * 1.25, p[1] * 1.35]), -0.05, -0.008, M_ORG, { b: 0.012 }); B.prism(ol.map(p => [p[0] * 1.12, p[1] * 1.18]), -0.014, 0.036, M_SAND, { b: 0.015 });
        if (!lo) rivets(B, [[-0.07, sd * 0.02, 0.034], [0.06, sd * 0.01, 0.034]], 0.011, [0, 0, 1]); B.pop();
        // the eye: a dark steel socket, the amber lens set back inside an orange bezel and the socket's rim
        B.ell([0.39, sd * 0.25, 0.05], [0.098, 0.045, 0.08], M_STL, { seg: n(12), rings: n(6) }); B.ell([0.392, sd * 0.268, 0.05], [0.064, 0.03, 0.054], M_AMB, { seg: n(12), rings: n(7) });
        B.torY([0.392, sd * 0.294, 0.05], 0.071, 0.013, M_ORG, { seg: n(14), rseg: 4 }); B.torY([0.392, sd * 0.284, 0.05], 0.088, 0.012, M_STL, { seg: n(14), rseg: 4 });
        // the jaw's hinge boss (a chrome pin), a vent on the rear plate
        B.tube([0.18, sd * 0.19, -0.15], [0.18, sd * 0.285, -0.15], 0.055, 0.055, M_STL, { seg: n(14), cap0: false, cap1: 'flat' }); B.tube([0.18, sd * 0.28, -0.15], [0.18, sd * 0.302, -0.15], 0.03, 0.026, M_CHR, { seg: 10, cap0: false, cap1: 'flat' });
        vent(B, [0.07, sd * 0.15, 0.245], [0, sd * 0.4, 1], [1, 0, -0.1], 0.045, 0.026, 3); }
      // the upper beak: a swept section along a cubic centre line from the snout over and down into the hook (its top a ridge, its underside the cutting edge)
      const bz = u => { const P0 = [0.42, 0.06], P1 = [0.7, 0.085], P2 = [0.885, 0.02], P3 = [0.85, -0.18], w = 1 - u, b0 = w * w * w, b1 = 3 * w * w * u, b2 = 3 * w * u * u, b3 = u * u * u, d0 = 3 * w * w, d1 = 6 * w * u, d2 = 3 * u * u;
        const t = [d0 * (P1[0] - P0[0]) + d1 * (P2[0] - P1[0]) + d2 * (P3[0] - P2[0]), d0 * (P1[1] - P0[1]) + d1 * (P2[1] - P1[1]) + d2 * (P3[1] - P2[1])], l = Math.hypot(t[0], t[1]) || 1;
        return [[b0 * P0[0] + b1 * P1[0] + b2 * P2[0] + b3 * P3[0], b0 * P0[1] + b1 * P1[1] + b2 * P2[1] + b3 * P3[1]], [t[0] / l, t[1] / l]]; };
      const BK = (u, a, k) => { const [c, t] = bz(u), w = 0.205 * Math.pow(1 - u, 0.75) + 0.008, h = 0.145 * Math.pow(1 - u, 0.65) + 0.008, ca = Math.cos(a), yy = k * w * sup(Math.sin(a), 0.7) * (ca > 0 ? 1 - 0.42 * ca * ca : 1), hh = k * h * (ca > 0 ? sup(ca, 0.8) : 0.55 * sup(ca, 0.5));
        return [c[0] - t[1] * hh, yy, c[1] + t[0] * hh]; };
      B.surf((u, v) => BK(u, lerp(-Math.PI, Math.PI, v), 1), n(16), n(20), (u, v) => { const ca = Math.cos(lerp(-Math.PI, Math.PI, v)); return u > 0.93 ? M_CHR : u > 0.7 ? M_STL : ca > 0.86 || u < 0.05 ? M_ORG : M_SAND; }, { e: (u, v) => { const ca = Math.cos(lerp(-Math.PI, Math.PI, v)); return u > 0.68 ? 0.7 : ca > 0.86 ? 0.8 : ca < -0.2 && ca > -0.7 ? 0.6 : 0; } });
      for (const sd of [1, -1]) B.sph(BK(0.2, sd * 0.55, 1.0), 0.017, M_STL, 6);   // (the nostrils)
      M.head = B.done(); }
    { const B = GB(), lo = lowFx();   // ---- the lower beak (the jaw; origin its hinge under the cheeks, x forward): a deep beige scoop of armour (side plates, an orange chin) narrowing to a steel cutting edge and a chrome tip tucked inside the upper beak's hook; jaw 0..1 opens it (about y)
      const JW = [[-0.06, 0.14, 0.06, -0.06], [0.04, 0.215, 0.085, -0.1], [0.14, 0.215, 0.095, -0.13], [0.24, 0.19, 0.105, -0.135], [0.34, 0.15, 0.11, -0.12], [0.44, 0.105, 0.11, -0.1], [0.54, 0.06, 0.095, -0.06], [0.64, 0.012, 0.07, 0.0]];
      const uj = x => (x + 0.06) / 0.7, PJ = (u, a, k) => { const s = crs(JW, u), zc = (s[2] + s[3]) / 2, hh = (s[2] - s[3]) / 2, ca = Math.cos(a); return [s[0], k * s[1] * sup(Math.sin(a), 0.6), zc + k * hh * sup(ca, ca > 0 ? 0.3 : 0.7)]; };
      B.surf((u, v) => PJ(u, lerp(-Math.PI, Math.PI, v), 1), n(12), n(20), (u, v) => { const ca = Math.cos(lerp(-Math.PI, Math.PI, v)); return u > 0.9 ? M_CHR : ca > 0.5 || u > 0.74 ? M_STL : ca < -0.72 ? M_ORG : M_SAND; }, { e: (u, v) => { const ca = Math.cos(lerp(-Math.PI, Math.PI, v)); return ca > 0.2 && ca < 0.6 ? 0.9 : u > 0.74 ? 0.6 : 0; } });
      for (const sd of [1, -1]) { shingle(B, PJ, uj(0.06), uj(0.48), sd > 0 ? 1.35 : -2.45, sd > 0 ? 2.45 : -1.35, 1.0, 1.03, 1.075, n(5), n(6), M_SAND, M_ORG); if (!lo) for (const a of [1.6, 2.2]) riv(B, PJ(uj(0.45), sd * a, 1.08), 0.011, [0, sd * Math.sin(a), Math.cos(a)]); }
      M.jaw = B.done(); }
    { const B = GB(), lo = lowFx();   // ---- a leg (the +y side's, mirrored for -y; origin the hip, the sole at z -LEG_L, +y outward - the track cassette rides outside it from y 0.41, so nothing here passes y 0.4): a heavy hip ball and outer hub (orange ring, chrome cap, a bolt circle), a rounded thigh column in two layered beige plates (orange trim, rivets), the knee drum with an amber ring under an armoured knee cop, the shin column in two more plates flaring into the boot, two hydraulic pistons outside (steel sleeves, orange collars, chrome rods, clevis lugs), and the wide foot - tilted 6 degrees against the rest splay so its sole lies flat - a steel sole, stepped orange and beige tiers, four armoured knuckles and four large curved steel claws with chrome tips
      B.ell([0, 0, -0.04], [0.32, 0.3, 0.32], M_STL, { seg: n(10), rings: n(6) });
      B.tube([0, 0.12, -0.13], [0, 0.372, -0.13], 0.25, 0.25, M_STL, { seg: n(18), cap0: false, cap1: 'flat' }); B.torY([0, 0.372, -0.13], 0.215, 0.026, M_ORG, { seg: n(18), rseg: 4 }); B.tube([0, 0.368, -0.13], [0, 0.398, -0.13], 0.11, 0.09, M_CHR, { seg: n(12), cap0: false, cap1: 'flat' });
      if (!lo) for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * TAU; riv(B, [Math.cos(a) * 0.16, 0.372, -0.13 + Math.sin(a) * 0.16], 0.016, [0, 1, 0]); }
      // the thigh and the shin: superelliptic columns (rows: z, half x, half y, centre x, centre y; capped small at the joints), each in two layered plates over the front and the outer side
      const TH = [[-0.14, 0.33, 0.24, 0.02, 0.02], [-0.28, 0.42, 0.28, 0.04, 0.03], [-0.43, 0.41, 0.28, 0.06, 0.03], [-0.58, 0.33, 0.24, 0.06, 0.03], [-0.62, 0.15, 0.12, 0.06, 0.03]];   // (deep front to back: the plates show either side of the cassette)
      const SH = [[-0.6, 0.15, 0.12, 0.05, 0.03], [-0.65, 0.32, 0.24, 0.04, 0.03], [-0.74, 0.36, 0.26, 0.04, 0.02], [-0.84, 0.41, 0.29, 0.05, 0.0], [-0.94, 0.45, 0.315, 0.06, -0.02]];
      const colm = T => (u, a, k) => { const s = crs(T, u); return [s[3] + k * s[1] * sup(Math.cos(a), 0.6), s[4] + k * s[2] * sup(Math.sin(a), 0.6), s[0]]; }, PT = colm(TH), PH = colm(SH);   // (a 0 the front, +PI/2 the outer side)
      for (const P of [PT, PH]) B.surf((u, v) => P(u, lerp(-Math.PI, Math.PI, v), 1), n(6), n(12), () => M_STL, {});   // (the columns: their front and outer side under the plates, the rest towards the hull)
      shingle(B, PT, 0.12, 0.42, -0.75, 2.45, 1.0, 1.03, 1.085, n(4), n(12), M_SAND, M_ORG); shingle(B, PT, 0.36, 0.72, -0.7, 2.4, 1.0, 1.03, 1.08, n(4), n(12), M_SAND, M_ORG);   // (the thigh plates: the upper one's lower edge proud)
      shingle(B, PH, 0.3, 0.62, -0.8, 2.4, 1.0, 1.03, 1.08, n(4), n(12), M_SAND, M_ORG); shingle(B, PH, 0.55, 0.95, -0.8, 2.4, 1.0, 1.03, 1.085, n(4), n(12), M_SAND, M_ORG);   // (the shin plates)
      if (!lo) for (const [P, u, k, as] of [[PT, 0.405, 1.09, [0.0, 0.8, 1.6, 2.2]], [PT, 0.705, 1.085, [0.0, 0.8, 2.2]], [PH, 0.935, 1.09, [-0.3, 0.6, 2.2]]]) for (const a of as) riv(B, P(u, a, k), 0.014, [Math.cos(a), Math.sin(a), 0]);
      // the knee: a steel drum on the joint's axis, an orange ring, a chrome hub; the knee cop (beige over an orange rim) in front, a steel boss on its front-outer face with the amber ring (seen beside the cassette)
      B.tube([0.05, -0.26, -0.62], [0.05, 0.34, -0.62], 0.19, 0.19, M_STL, { seg: n(14), cap0: 'flat', cap1: 'flat' }); B.torY([0.05, 0.34, -0.62], 0.16, 0.026, M_ORG, { seg: n(14), rseg: 4 });
      B.tube([0.05, 0.33, -0.62], [0.05, 0.384, -0.62], 0.062, 0.05, M_CHR, { seg: 12, cap0: false, cap1: 'flat' });
      B.ell([0.33, 0.1, -0.61], [0.17, 0.27, 0.2], M_ORG, { seg: n(12), rings: n(6) }); B.ell([0.355, 0.1, -0.6], [0.16, 0.245, 0.175], M_SAND, { seg: n(14), rings: n(7) }); if (!lo) rivets(B, [[0.508, 0.1, -0.52], [0.508, 0.1, -0.68]], 0.014, [1, 0, 0]);
      { const d = vnrm([0.72, 0.69, 0]); B.along([0.47, 0.268, -0.61], d); B.tube([-0.03, 0, 0], [0.035, 0, 0], 0.105, 0.1, M_STL, { seg: n(12), cap0: false, cap1: 'flat' }); B.torX([0.036, 0, 0], 0.078, 0.019, M_AMB, { seg: n(14), rseg: 4 }); B.torX([0.03, 0, 0], 0.104, 0.014, M_ORG, { seg: n(14), rseg: 4 });
        B.tube([0.03, 0, 0], [0.055, 0, 0], 0.045, 0.035, M_CHR, { seg: 10, cap0: false, cap1: 'flat' }); B.pop(); }
      // the pistons (front-outer, rear-outer): a steel sleeve, an orange collar, a chrome rod; a clevis lug on a bracket at each end
      const piston = (a, b, r) => { const d = vsub(b, a), m1 = vadd(a, vmul(d, 0.55)); B.tube(a, m1, r, r, M_STL, { seg: n(10), cap0: 'flat', cap1: 'flat' }); B.tube(vadd(a, vmul(d, 0.5)), vadd(a, vmul(d, 0.56)), r * 1.25, r * 1.25, M_ORG, { seg: n(10), cap0: 'flat', cap1: 'flat' }); B.tube(m1, b, r * 0.55, r * 0.55, M_CHR, { seg: n(10), cap0: false, cap1: 'flat' });
        for (const e of [a, b]) { B.box(e, [0.045, 0.05, 0.045], 0, M_STL); B.box(vadd(e, [-Math.sign(e[0]) * 0.07, -0.03, 0]), [0.06, 0.03, 0.028], 0, M_STL); B.tube(vadd(e, [0, -0.062, 0]), vadd(e, [0, 0.062, 0]), 0.018, 0.018, M_CHR, { seg: 8, cap0: 'flat', cap1: 'flat' }); } };
      piston([0.56, 0.29, -0.22], [0.6, 0.29, -0.8], 0.068); piston([-0.5, 0.22, -0.2], [-0.48, 0.22, -0.84], 0.062);
      // the foot (its own frame at the ankle, tilted -6 degrees about x; the sole at zs)
      { const c6 = Math.cos(6 * DEG), s6 = Math.sin(6 * DEG), zs = -(LEG_L - 0.9); B.push([1, 0, 0], [0, c6, -s6], [0, s6, c6], [0, 0, -0.9]);
        const oval = (cx, cy, rx, ry, p, nn) => { const o = [], N = n(nn || 20); for (let i = 0; i < N; i++) { const a = i / N * TAU; o.push([cx + rx * sup(Math.cos(a), p), cy + ry * sup(Math.sin(a), p)]); } return o; };
        B.prism(oval(0.08, -0.02, 0.6, 0.405, 0.45), zs, zs + 0.04, M_STL, { b: 0.012, back: !LO }); B.prism(oval(0.07, -0.02, 0.575, 0.39, 0.5), zs + 0.04, zs + 0.1, M_ORG, { b: 0.02, back: false });
        B.prism(oval(0.05, -0.02, 0.52, 0.36, 0.55, 16), zs + 0.1, zs + 0.17, M_SAND, { b: 0.025, back: false }); B.prism(oval(0.04, -0.02, 0.47, 0.33, 0.6, 16), zs + 0.17, zs + 0.23, M_SAND, { b: 0.022, back: false });   // (the upper tiers' undersides lie inside the tier below: not built)
        B.box([-0.55, -0.02, zs + 0.08], [0.06, 0.2, 0.07], 0.03, M_STL); B.box([-0.57, -0.02, zs + 0.16], [0.045, 0.17, 0.022], 0, M_ORG);   // (the heel guard)
        if (!lo) rivets(B, oval(0.05, -0.02, 0.46, 0.305, 0.55).filter((p, i) => i % 5 === 3).map(p => [p[0], p[1], zs + 0.17]), 0.014, [0, 0, 1]);
        for (const yy of [-0.29, -0.1, 0.09, 0.27]) {
          B.ell([0.46, yy, -0.1], [0.13, 0.09, 0.085], M_ORG, { seg: n(8), rings: 2, th1: Math.PI * 0.62 }); B.ell([0.48, yy, -0.085], [0.12, 0.078, 0.075], M_SAND, { seg: n(10), rings: 4, th1: Math.PI * 0.6 });   // (the knuckle: beige over orange)
          const C = t => { const w = 1 - t; return [w * w * 0.46 + 2 * w * t * 0.78 + t * t * 0.9, w * w * -0.1 + 2 * w * t * -0.06 + t * t * (zs + 0.006)]; }, CT = t => { const a = C(Math.max(0, t - 0.01)), b = C(Math.min(1, t + 0.01)), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
          B.surf((u, v) => { const c = C(u), t = CT(u), r = 0.085 * Math.pow(1 - u, 0.85) + 0.002, a = v * TAU, cn = Math.cos(a) * r, sn = Math.sin(a) * r * 0.78; return [c[0] - t[1] * cn, yy + sn, c[1] + t[0] * cn]; }, n(7), n(8), u => (u > 0.74 ? M_CHR : M_STL), { e: u => (u > 0.6 ? 0.6 : 0.2) }); }   // (a claw: swept, curving down to its point on the ground)
        B.pop(); }
      M.leg = B.done(); }
    { const B = GB();   // ---- a track cassette (modeller C; its own frame: long along x, the loop in the x-z plane, centred, +y the outer side): a chunky loop of iron shoes (a grouser, a guide horn, link pins each), a toothed drive sprocket at the front and a flanged idler at the back with amber hub lights, double road wheels, return rollers, a steel inner frame and axles, an armoured orange side cover (beige insert, amber slot, rivets) on steel arms
      B.push([0.82, 0, 0], [0, 0.82, 0], [0, 0, 0.82], [0, 0, 0]); const NT = n(30), a = 0.42, rr = 0.2, loop = s => { const L1 = 2 * a, L2 = Math.PI * rr, P2 = 2 * L1 + 2 * L2, d = ((s % 1) + 1) % 1 * P2;
        if (d < L1) return [[-a + d, 0, rr], [0, 0, 1]]; if (d < L1 + L2) { const t = (d - L1) / rr; return [[a + Math.sin(t) * rr, 0, Math.cos(t) * rr], [Math.sin(t), 0, Math.cos(t)]]; }
        if (d < 2 * L1 + L2) { const e = d - L1 - L2; return [[a - e, 0, -rr], [0, 0, -1]]; } const t = (d - 2 * L1 - L2) / rr; return [[-a - Math.sin(t) * rr, 0, -Math.cos(t) * rr], [-Math.sin(t), 0, -Math.cos(t)]]; };
      for (let i = 0; i < NT; i++) { const [p, nr] = loop(i / NT), F = frameOfN(nr); B.push(F[0], F[1], F[2], vadd(p, vmul(nr, 0.032)));
        B.box([0, 0, 0], [0.043, 0.125, 0.017], 0, M_TRK); B.box([0.004, 0, 0.026], [0.012, 0.12, 0.012], 0, M_TRK);   // (the shoe and its grouser: sharp-edged, 24 triangles a shoe; the guide horns - on the loop's inner face, between the wheels, never seen - and the link pins between the shoes, a pixel at the game camera, are left out)
        B.pop(); }
      const hub = x => { B.tube([x, 0.085, 0], [x, 0.15, 0], 0.075, 0.068, M_STL, { seg: n(12), cap0: false, cap1: 'flat' }); B.tube([x, 0.15, 0], [x, 0.163, 0], 0.052, 0.046, M_AMB, { seg: n(12), cap0: false, cap1: 'flat' }); B.torY([x, 0.153, 0], 0.064, 0.013, M_ORG, { seg: n(12), rseg: 4 }); };   // (a hub: a steel boss, an amber light in an orange bezel)
      B.tube([a, -0.09, 0], [a, 0.09, 0], 0.15, 0.15, M_STL, { seg: n(14), cap0: 'flat', cap1: 'flat' }); B.torY([a, 0.072, 0], 0.172, 0.022, M_STL, LO ? { seg: 24, rseg: 4, teeth: 12, tooth: 0.032 } : { seg: 40, rseg: 4, teeth: 20, tooth: 0.032 }); B.torY([a, -0.072, 0], 0.19, 0.022, M_STL, { seg: n(20), rseg: 4 }); hub(a);   // (the drive sprocket, toothed; its inner ring, behind the outer one and inside the loop, a plain flange)
      B.tube([-a, -0.085, 0], [-a, 0.085, 0], 0.165, 0.165, M_STL, { seg: n(14), cap0: 'flat', cap1: 'flat' }); for (const sy of [1, -1]) B.torY([-a, sy * 0.075, 0], 0.17, 0.02, M_STL, { seg: n(16), rseg: 4 }); hub(-a);   // (the idler, flanged)
      for (const x of [-0.2, 0, 0.2]) { for (const sy of [1, -1]) B.tube([x, sy * 0.035, -0.127], [x, sy * 0.1, -0.127], 0.088, 0.088, M_STL, { seg: n(sy > 0 ? 10 : 8), cap0: 'flat', cap1: 'flat' }); B.tube([x, -0.13, -0.127], [x, 0.112, -0.127], 0.026, 0.026, M_CHR, { seg: 6, cap0: 'flat', cap1: 'flat' }); }   // (the double road wheels on their axles)
      for (const x of [-0.18, 0.18]) for (const sy of [1, -1]) B.tube([x, sy * 0.035, 0.175], [x, sy * 0.095, 0.175], 0.04, 0.04, M_STL, { seg: n(8), cap0: 'flat', cap1: 'flat' });   // (the return rollers)
      B.box([0, -0.128, -0.01], [a, 0.012, 0.1], 0.01, M_STL);   // (the inner frame)
      { B.push([1, 0, 0], [0, 0, -1], [0, 1, 0], [0, 0, 0]); const oc = [[-0.26, -0.07], [0.26, -0.07], [0.31, -0.02], [0.31, 0.12], [0.26, 0.17], [-0.26, 0.17], [-0.31, 0.12], [-0.31, -0.02]].map(([x, z]) => [x, -z]), ins = [[-0.2, -0.03], [0.2, -0.03], [0.24, 0.01], [0.24, 0.1], [0.2, 0.135], [-0.2, 0.135], [-0.24, 0.1], [-0.24, 0.01]].map(([x, z]) => [x, -z]);
        B.prism(oc, 0.112, 0.158, M_ORG, { b: 0.012 }); B.prism(ins, 0.15, 0.172, M_SAND, { b: 0.008 }); B.pop(); }   // (the armoured side cover, its beige insert)
      B.box([0, 0.174, 0.055], [0.115, 0.004, 0.022], 0.003, M_STL); B.box([0, 0.177, 0.055], [0.1, 0.004, 0.011], 0.003, M_AMB);   // (an amber slot)
      for (const [x, z] of [[-0.28, -0.04], [0.28, -0.04], [-0.28, 0.14], [0.28, 0.14], [0, -0.055], [0, 0.155]]) riv(B, [x, 0.158, z], 0.014, [0, 1, 0]);
      for (const sx of [1, -1]) B.box([sx * 0.365, 0.135, 0.0], [0.07, 0.018, 0.03], 0.01, M_STL);   // (the arms to the hubs)
      B.pop(); M.track = B.done(); }
    { let B = GB();   // ---- the drill carriage, in two articulated parts on the same frame (origin: the drill's dock, on the bit's axis; x forward; the bit's root sits at +0.25). `carriage`: the bearing housing (dark steel rings with glowing amber gaps, the burnt-orange bearing collar, bolt rings, the socket the bit docks into, a closed back with the drive's amber coupling port), the cradle, twin heavy rails with orange slider housings, end stops and a rack, hydraulic support arms (orange brackets, steel cylinders, chrome rods), the ram lugs, armoured feed cables, bolts. `drive` (behind the housing in turtle form; lifted onto the housing's top in drill form, so nothing passes through the front shell): the coupling shaft and its flange, the motor block (beige casing in orange straps, vented grille, amber coil windows, the coil cage at the back, exhausts), its cables and ram lugs. `ramC`/`ramR`: the two telescoping rams between them (a cylinder from the housing, a rod from the motor)
      const fct = (pts, m, c) => { let nx = 0, ny = 0, nz = 0, cx = 0, cy = 0, cz = 0; const N = pts.length; for (let i = 0; i < N; i++) { const a = pts[i], b = pts[(i + 1) % N]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); cx += a[0] / N; cy += a[1] / N; cz += a[2] / N; } B.facet((cx - c[0]) * nx + (cy - c[1]) * ny + (cz - c[2]) * nz < 0 ? pts.slice().reverse() : pts, m); };
      const ringSeg = (xa, xb, r0, ra, rb, p0, p1, m, nph) => { const b = 0.022, PR = [[xa, r0], [xa, ra - b], [xa + b * 0.3, ra - b * 0.3], [xa + b, ra], [xb - b, rb], [xb - b * 0.3, rb - b * 0.3], [xb, rb - b], [xb, r0]], EG = [0.2, 0.5, 0.9, 0.5, 0.5, 0.9, 0.5, 0.2];   // (an annular sector round x, bevelled, its ends closed)
        B.surf((u, v) => { const p = PR[Math.round(v * 7)], ph = lerp(p0, p1, u); return [p[0], p[1] * Math.cos(ph), p[1] * Math.sin(ph)]; }, nph, 7, () => m, { e: (u, v) => EG[Math.round(v * 7)] });
        const pm = (p0 + p1) / 2, cc = [(xa + xb) / 2, (r0 + ra) / 2 * Math.cos(pm), (r0 + ra) / 2 * Math.sin(pm)]; for (const ph of [p0, p1]) fct(PR.map(p => [p[0], p[1] * Math.cos(ph), p[1] * Math.sin(ph)]), m, cc); };
      const sweep = (path, r, m, nu, nv) => { const F = []; let N0 = null; for (let j = 0; j <= nv; j++) { const t = j / nv, p = path(t), T = vnrm(vsub(path(Math.min(1, t + 0.002)), path(Math.max(0, t - 0.002)))), rf = N0 || (Math.abs(T[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]), N = vnrm(vsub(rf, vmul(T, vdot(rf, T)))); N0 = N; F.push([p, N, vcross(T, N)]); }
        B.surf((u, v) => { const f = F[Math.round(v * nv)], c = Math.cos(u * TAU) * r, s = Math.sin(u * TAU) * r; return [f[0][0] + f[1][0] * c + f[2][0] * s, f[0][1] + f[1][1] * c + f[2][1] * s, f[0][2] + f[1][2] * c + f[2][2] * s]; }, nu, nv, () => m); return F; };
      const crp = pts => { const P = [pts[0], ...pts, pts[pts.length - 1]], ns = pts.length - 1; return t => { const g = Math.min(ns - 1e-9, Math.max(0, t * ns)), i = Math.floor(g), u = g - i, a = P[i], b = P[i + 1], c = P[i + 2], d = P[i + 3], u2 = u * u, u3 = u2 * u; return [0, 1, 2].map(k => 0.5 * (2 * b[k] + (c[k] - a[k]) * u + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * u2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * u3)); }; };
      const radial = (a, f) => { const c = Math.cos(a), s = Math.sin(a); B.push([1, 0, 0], [0, c, s], [0, -s, c], [0, 0, 0]); f(); B.pop(); };   // (a frame turned round x: y radial, z along the turn)
      // the bearing housing (a lathe: [x, r, material, edge wear])
      const BH = [[-0.66, 0.001, M_CHR], [-0.66, 0.09, M_CHR], [-0.66, 0.09, M_AMB], [-0.66, 0.2, M_AMB], [-0.66, 0.2], [-0.66, 0.46], [-0.63, 0.51, 0, 0.8], [-0.6, 0.53, 0, 0.8], [-0.47, 0.53, 0, 0.8], [-0.45, 0.5], [-0.45, 0.5, M_AMB], [-0.45, 0.47, M_AMB], [-0.4, 0.47, M_AMB], [-0.4, 0.5, M_AMB], [-0.4, 0.5], [-0.38, 0.555, 0, 0.8], [-0.2, 0.555, 0, 0.8], [-0.18, 0.51],
        [-0.18, 0.51, M_AMB], [-0.18, 0.485, M_AMB], [-0.13, 0.485, M_AMB], [-0.13, 0.52, M_AMB], [-0.13, 0.52, M_ORG], [-0.11, 0.6, M_ORG, 0.6], [-0.08, 0.625, M_ORG, 0.45], [0.17, 0.625, M_ORG, 0.45], [0.2, 0.61, M_ORG, 0.7], [0.23, 0.575, M_ORG, 0.6], [0.23, 0.55, M_ORG], [0.23, 0.55], [0.05, 0.55], [0.05, 0.3], [0.05, 0.3, M_AMB], [0.05, 0.14, M_AMB], [0.05, 0.14, M_CHR], [0.05, 0.001, M_CHR]];
      B.lathe(BH.map(p => [p[0], p[1], p[2] || M_STL]), M_STL, { seg: n(24), edge: j => BH[j][3] || 0 });
      B.torX([0.232, 0, 0], 0.551, 0.009, M_AMB, { seg: n(24), rseg: 4 });   // (the amber gap round the bit)
      for (let k = 0; k < 16; k += LO ? 2 : 1) radial(k / 16 * TAU + 0.1, () => B.tube([0.23, 0.59, 0], [0.252, 0.59, 0], 0.017, 0.017, M_CHR, { seg: 6, cap0: false, cap1: 'flat' }));   // (the collar's bolt ring)
      for (let k = 0; k < 14; k += LO ? 2 : 1) radial(k / 14 * TAU, () => B.tube([-0.29, 0.55, 0], [-0.29, 0.577, 0], 0.02, 0.02, M_CHR, { seg: 6, cap0: false, cap1: 'flat' }));   // (ring B's bolts)
      for (let k = 0; k < 6; k++) radial(k / 6 * TAU + Math.PI / 6, () => { B.box([0.045, 0.64, 0], [0.12, 0.024, 0.03], 0, M_ORG); B.tube([0.045, 0.66, 0], [0.045, 0.672, 0], 0.014, 0.014, M_CHR, { seg: 6, cap0: false, cap1: 'flat' }); });   // (the collar's ribs)
      // the cradle under the housing, the cross beams to the rails
      ringSeg(-0.42, -0.16, 0.54, 0.61, 0.61, Math.PI * 1.18, Math.PI * 1.82, M_STL, n(9));
      B.box([-0.29, 0, -0.665], [0.11, 0.83, 0.045], 0.02, M_STL); B.box([-0.29, 0, -0.6], [0.08, 0.26, 0.04], 0.02, M_STL);
      // the rails (one a side): a steel I-beam with a polished running strip, a rack, orange feet, end stops with amber lamps; the slider housings; the hydraulic arms
      for (const sd of [1, -1]) { const y = sd * 0.8;
        B.box([-0.16, y, -0.67], [0.62, 0.045, 0.045], 0.015, M_STL); B.box([-0.16, y, -0.618], [0.6, 0.028, 0.01], 0.006, M_CHR); B.box([-0.16, y, -0.712], [0.62, 0.08, 0.013], 0.006, M_STL);
        const NR = n(12); for (let i = 0; i < NR; i++) B.box([lerp(-0.72, 0.38, i / (NR - 1)), y - sd * 0.054, -0.655], [0.013, 0.012, 0.022], 0, M_STL);
        for (const x of [-0.66, 0.26]) { B.box([x, y, -0.735], [0.075, 0.105, 0.016], 0, M_ORG); rivets(B, [[x - 0.05, y + 0.075, -0.719], [x + 0.05, y - 0.075, -0.719]], 0.012, [0, 0, 1]); }
        for (const x of [-0.8, 0.5]) { B.box([x, y, -0.645], [0.045, 0.075, 0.07], 0.02, M_ORG); B.box([x + Math.sign(x) * 0.047, y, -0.635], [0.006, 0.04, 0.018], 0.004, M_AMB); }
        for (const x of [-0.3, -0.64]) { B.box([x, y, -0.6], [0.17, 0.088, 0.072], 0.034, M_ORG); B.box([x, y, -0.522], [0.12, 0.06, 0.01], 0.006, M_STL); B.box([x, y + sd * 0.09, -0.6], [0.05, 0.004, 0.012], 0.003, M_AMB);
          rivets(B, LO ? [[x - 0.12, y + sd * 0.088, -0.6], [x + 0.12, y + sd * 0.088, -0.6]] : [[x - 0.12, y + sd * 0.088, -0.57], [x + 0.12, y + sd * 0.088, -0.57], [x - 0.12, y + sd * 0.088, -0.63], [x + 0.12, y + sd * 0.088, -0.63]], 0.012, [0, sd, 0]); }
        const pin = (p, L) => B.tube([p[0], p[1] - L, p[2]], [p[0], p[1] + L, p[2]], 0.026, 0.026, M_CHR, { seg: 8, cap0: 'flat', cap1: 'flat' });
        const beam = (a, b, w, h, m) => { const d = vsub(b, a), L = vlen(d); B.along(a, d); B.box([L / 2, 0, 0], [L / 2 + w * 0.6, w, h], Math.min(w, h) * 0.45, m); B.pop(); };
        const ram = (a, b, r) => { const m = vadd(a, vmul(vsub(b, a), 0.58)); B.tube(a, m, r, r, M_STL, { seg: 10, cap0: 'flat', cap1: 'flat' }); B.tube(vadd(a, vmul(vsub(b, a), 0.5)), m, r * 1.18, r * 1.18, M_ORG, { seg: 10, cap0: 'flat', cap1: 'flat' }); B.tube(m, b, r * 0.52, r * 0.52, M_CHR, { seg: 8, cap0: false, cap1: 'round' }); };
        // the front bracket arm (slider to the collar), its ram (the rear slider to ring B), the lug for the drive's ram on ring B, a feed cable from the housing down to the rear slider
        const f0 = [-0.24, y, -0.53], f1 = [-0.02, sd * 0.6, -0.2]; beam(f0, f1, 0.045, 0.05, M_ORG); B.box([f1[0], sd * 0.62, f1[2]], [0.06, 0.03, 0.06], 0.02, M_STL); pin(f0, 0.1); pin(f1, 0.06);
        const r0 = [-0.5, sd * 0.84, -0.55], r1 = [-0.3, sd * 0.53, -0.24]; B.box([r0[0], sd * 0.84, r0[2]], [0.05, 0.03, 0.05], 0.02, M_ORG); ram(r0, r1, 0.042); pin(r0, 0.05); B.box([r1[0], sd * 0.52, r1[2]], [0.045, 0.03, 0.045], 0.018, M_STL);
        B.box([RAM_A[0], sd * (RAM_A[1] - 0.01), RAM_A[2]], [0.05, 0.03, 0.05], 0.02, M_ORG); pin([RAM_A[0], sd * RAM_A[1], RAM_A[2]], 0.055);
        const F = sweep(crp([[-0.22, sd * 0.36, 0.42], [-0.36, sd * 0.56, 0.36], [-0.56, sd * 0.74, 0.0], [-0.62, sd * 0.8, -0.3], [-0.64, sd * 0.8, -0.51]]), 0.03, M_TRK, 6, n(10));
        for (const f of [F[0], F[F.length - 1]]) { const T = vcross(f[1], f[2]); B.tube(vadd(f[0], vmul(T, -0.03)), vadd(f[0], vmul(T, 0.03)), 0.044, 0.044, M_ORG, { seg: 8, cap0: 'flat', cap1: 'flat' }); } }
      M.carriage = B.done(); B = GB();   // ---- (the drive)
      // the coupling shaft (it mates with the housing's back in turtle form), its flange with the amber port
      B.tube([-0.86, 0, 0], [-0.67, 0, 0], 0.27, 0.27, M_STL, { seg: n(18), cap0: false, cap1: false }); B.torX([-0.79, 0, 0], 0.285, 0.03, M_ORG, { seg: n(20), rseg: 5 }); B.torX([-0.71, 0, 0], 0.276, 0.014, M_CHR, { seg: n(20), rseg: 4 });
      B.lathe([[-0.7, 0.3], [-0.68, 0.3], [-0.665, 0.285], [-0.665, 0.18], [-0.665, 0.18, M_AMB], [-0.665, 0.08, M_AMB], [-0.665, 0.08, M_CHR], [-0.665, 0.001, M_CHR]], M_STL, { seg: n(18) });
      // the motor block: the beige casing in orange straps, the top plate and its grille, side vents, amber coil windows, bolts
      B.box([-1.18, 0, -0.02], [0.33, 0.42, 0.36], 0.08, M_SAND);
      for (const x of [-0.86, -1.5]) B.box([x, 0, -0.02], [0.035, 0.445, 0.385], 0.022, M_ORG);
      B.box([-1.18, 0, 0.35], [0.3, 0.39, 0.025], 0.015, M_ORG); vent(B, [-1.18, 0, 0.378], [0, 0, 1], [1, 0, 0], 0.2, 0.27, 7);
      for (const sd of [1, -1]) { vent(B, [-1.18, sd * 0.424, 0.12], [0, sd, 0], [1, 0, 0], 0.22, 0.12, 6);
        B.box([-1.18, sd * 0.418, -0.19], [0.22, 0.012, 0.09], 0.006, M_STL); for (let i = 0; i < 8; i++) B.box([lerp(-1.36, -1.0, i / 7), sd * 0.425, -0.19], [0.013, 0.006, 0.072], 0.004, M_AMB); for (const z of [-0.23, -0.15]) B.tube([-1.4, sd * 0.437, z], [-0.96, sd * 0.437, z], 0.008, 0.008, M_CHR, { seg: 5, cap0: 'flat', cap1: 'flat' });
        const rv = []; for (const x of [-0.86, -1.5]) for (const z of [-0.3, -0.02, 0.26]) rv.push([x, sd * 0.445, z]); rivets(B, rv, 0.016, [0, sd, 0]);
        B.tube([-1.42, sd * 0.28, 0.36], [-1.42, sd * 0.28, 0.56], 0.04, 0.036, M_STL, { seg: 10, cap0: false, cap1: false }); B.torZ([-1.42, sd * 0.28, 0.54], 0.04, 0.012, M_CHR, { seg: 10, rseg: 4 }); B.torZ([-1.42, sd * 0.28, 0.42], 0.044, 0.01, M_ORG, { seg: 10, rseg: 4 }); }   // (the exhausts)
      // the coil cage at the back: three amber coils between steel bars, a chrome boss
      B.tube([-1.52, 0, 0], [-1.69, 0, 0], 0.3, 0.27, M_STL, { seg: n(18), cap0: false, cap1: 'flat' });
      for (const x of [-1.56, -1.605, -1.65]) B.torX([x, 0, 0], 0.3 - 0.03 * (-1.52 - x) / 0.17 + 0.004, 0.016, M_AMB, { seg: n(20), rseg: 4 });
      for (let k = 0; k < 8; k++) radial(k / 8 * TAU + 0.2, () => B.box([-1.605, 0.3, 0], [0.085, 0.022, 0.022], 0, M_STL));
      B.tube([-1.69, 0, 0], [-1.74, 0, 0], 0.1, 0.08, M_CHR, { seg: 12, cap0: false, cap1: 'flat' });
      // the armoured cables from the motor's top round into the coupling (track iron: ribbed), orange cuffs at their ends; the ram lugs on the motor's sides
      for (const sd of [1, -1]) { for (const [yo, r] of [[0.3, 0.032], [0.15, 0.026]]) { const e1 = [-0.79, sd * yo * 0.62, Math.sqrt(0.27 * 0.27 - yo * yo * 0.384) + 0.005];
          const F = sweep(crp([[-1.0, sd * yo, 0.375], [-0.94, sd * yo, 0.5], [-0.83, sd * yo * 0.8, 0.46], e1]), r, M_TRK, LO ? 4 : 6, n(8));
          for (const f of [F[0], F[F.length - 1]]) { const T = vcross(f[1], f[2]); B.tube(vadd(f[0], vmul(T, -0.025)), vadd(f[0], vmul(T, 0.025)), r * 1.45, r * 1.45, M_ORG, { seg: 8, cap0: 'flat', cap1: 'flat' }); } }
        B.box([RAM_B[0], sd * (RAM_B[1] - 0.01), RAM_B[2]], [0.05, 0.03, 0.05], 0.02, M_ORG); B.tube([RAM_B[0], sd * (RAM_B[1] - 0.04), RAM_B[2]], [RAM_B[0], sd * (RAM_B[1] + 0.05), RAM_B[2]], 0.026, 0.026, M_CHR, { seg: 8, cap0: 'flat', cap1: 'flat' }); }
      M.drive = B.done(); B = GB();   // ---- (a ram's cylinder, from its eye at the origin along +x: steel, an orange collar, a chrome gland)
      B.tube([0, -0.04, 0], [0, 0.04, 0], 0.05, 0.05, M_STL, { seg: 10, cap0: 'flat', cap1: 'flat' }); B.tube([0.03, 0, 0], [RAM_LC, 0, 0], 0.045, 0.045, M_STL, { seg: 10, cap0: 'flat', cap1: 'flat' });
      B.tube([RAM_LC - 0.1, 0, 0], [RAM_LC - 0.01, 0, 0], 0.055, 0.055, M_ORG, { seg: 10, cap0: 'flat', cap1: 'flat' }); B.torX([RAM_LC, 0, 0], 0.03, 0.009, M_CHR, { seg: 10, rseg: 4 });
      M.ramC = B.done(); B = GB();   // ---- (a ram's rod, from its eye at the origin along +x: polished chrome)
      B.tube([0, -0.035, 0], [0, 0.035, 0], 0.04, 0.04, M_STL, { seg: 10, cap0: 'flat', cap1: 'flat' }); B.tube([0.03, 0, 0], [RAM_LR, 0, 0], 0.024, 0.024, M_CHR, { seg: 8, cap0: 'flat', cap1: 'round' });
      M.ramR = B.done(); }
    { const B = GB();   // ---- the drill bit (from its root, +x; one piece, it turns about x): the steel hub drum (it turns in the carriage's bearing; a chrome boss and an amber coupling ring behind), two bands of segmented burnt-orange ring plates, a tapered core (burnt orange, shaded between the turns), ONE thick burnt-orange helical flute (a solid blade swept round the core: thick at its root, thinner and raked back at its bevelled rim, its pitch tightening toward the tip: rotation reads as the spiral running back), hard steel saw teeth along the rim (chrome cutting faces, every fifth a bigger lead tooth), a twisted three-lobed steel point; edge wear on every rim and bevel
      const fct = (pts, m, c) => { let nx = 0, ny = 0, nz = 0, cx = 0, cy = 0, cz = 0; const N = pts.length; for (let i = 0; i < N; i++) { const a = pts[i], b = pts[(i + 1) % N]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); cx += a[0] / N; cy += a[1] / N; cz += a[2] / N; } B.facet((cx - c[0]) * nx + (cy - c[1]) * ny + (cz - c[2]) * nz < 0 ? pts.slice().reverse() : pts, m); };
      const ringSeg = (xa, xb, r0, ra, rb, p0, p1, m, nph) => { const b = 0.022, PR = [[xa, r0], [xa, ra - b], [xa + b * 0.3, ra - b * 0.3], [xa + b, ra], [xb - b, rb], [xb - b * 0.3, rb - b * 0.3], [xb, rb - b], [xb, r0]], EG = [0.2, 0.5, 0.9, 0.5, 0.5, 0.9, 0.5, 0.2];
        B.surf((u, v) => { const p = PR[Math.round(v * 7)], ph = lerp(p0, p1, u); return [p[0], p[1] * Math.cos(ph), p[1] * Math.sin(ph)]; }, nph, 7, () => m, { e: (u, v) => EG[Math.round(v * 7)] });
        const pm = (p0 + p1) / 2, cc = [(xa + xb) / 2, (r0 + ra) / 2 * Math.cos(pm), (r0 + ra) / 2 * Math.sin(pm)]; for (const ph of [p0, p1]) fct(PR.map(p => [p[0], p[1] * Math.cos(ph), p[1] * Math.sin(ph)]), m, cc); };
      const X0 = 0.34, X1 = 2.12, ct = x => cl((x - X0) / (X1 - X0)), RO = x => lerp(0.6, 0.2, Math.pow(ct(x), 0.92)), RC = x => lerp(0.29, 0.1, ct(x));
      // the hub drum and the core
      const core = [[-0.16, 0.001, M_CHR], [-0.16, 0.13, M_CHR], [-0.13, 0.155, M_CHR], [-0.13, 0.155], [-0.13, 0.44], [-0.1, 0.505], [-0.06, 0.53], [0.35, 0.53], [0.37, 0.5], [0.38, RC(0.38)]];
      B.lathe(core, M_STL, { seg: n(28), edge: j => (j === 5 || j === 6 || j === 8 ? 0.8 : 0) });
      B.surf((u, v) => { const x = lerp(0.37, 2.18, v), r = RC(x) - 0.004, a = u * TAU; return [x, r * Math.cos(a), r * Math.sin(a)]; }, n(24), n(12), () => M_ORG, { a: () => 0.5 });   // (the core between the turns: burnt orange in the flute's shade)
      B.torX([-0.135, 0, 0], 0.3, 0.018, M_AMB, { seg: n(20), rseg: 4 });   // (the coupling's amber ring, seen when the bit is away)
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; B.tube([-0.135, 0.4 * Math.cos(a), 0.4 * Math.sin(a)], [-0.155, 0.4 * Math.cos(a), 0.4 * Math.sin(a)], 0.022, 0.022, M_CHR, { seg: 6, cap0: false, cap1: 'flat' }); }
      // two bands of segmented ring plates near the base, a bolt in each
      const NB = n(11); for (const [xa, xb, off] of [[0.005, 0.155, 0], [0.185, 0.335, 0.5]]) for (let k = 0; k < NB; k++) { const p0 = (k + off) / NB * TAU + 0.025, p1 = (k + 1 + off) / NB * TAU - 0.025, pm = (p0 + p1) / 2;
        ringSeg(xa, xb, 0.5, 0.605, 0.605, p0, p1, M_ORG, LO ? 2 : 3); B.tube([(xa + xb) / 2, 0.6 * Math.cos(pm), 0.6 * Math.sin(pm)], [(xa + xb) / 2, 0.616 * Math.cos(pm), 0.616 * Math.sin(pm)], 0.017, 0.017, M_CHR, { seg: 6, cap0: false, cap1: 'flat' }); }
      // the flute: u along the helix, v round its cross-section (the back face out from the root, the bevelled rim, the front face back in); the profile [radius, x]
      const aOf = s => 0.4 + TAU * (3.45 * s + 0.75 * s * s), FX0 = 0.36, FX1 = 2.1, NSU = n(124), JI = LO ? [0, 1, 2, 3, 5, 6, 8, 9, 10, 11] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], NV = JI.length - 1;   // (lowFx: the rim's rounding rows left out)
      const PE = [0, 0, 0.1, 0.55, 0.85, 0.72, 0.72, 0.85, 0.55, 0.1, 0, 0], PA = [0.45, 0.6, 0.86, 1, 1, 1, 1, 1, 1, 0.86, 0.6, 0.45];
      const prof = s => { const x = lerp(FX0, FX1, s), t = ct(x), rc = RC(x), end = 1 - sstep(0.84, 1, s), h = (RO(x) - rc) * end + 0.004, ro = rc + h, pt = (FX1 - FX0) / (3.45 + 1.5 * s), tr = pt * 0.9 * (0.35 + 0.65 * end), tt = pt * 0.5 * (0.45 + 0.55 * end), bv = tt * 0.3, rk = 0.4 * sstep(0, 0.07, s);
        return [[rc - 0.035, -tr / 2 - 0.012], [rc + 0.05 * h + 0.012, -tr / 2], [rc + 0.5 * h, -(tr + tt) / 4], [ro - bv, -tt / 2], [ro - bv * 0.25, -tt / 2 + bv * 0.55], [ro, -tt / 2 + bv], [ro, tt / 2 - bv], [ro - bv * 0.25, tt / 2 - bv * 0.55], [ro - bv, tt / 2], [rc + 0.5 * h, (tr + tt) / 4], [rc + 0.05 * h + 0.012, tr / 2], [rc - 0.035, tr / 2 + 0.012]].map(([r, w]) => [r, x + w - rk * Math.max(0, r - rc)]); };
      const FP = [], FA = []; for (let i = 0; i <= NSU; i++) { FP.push(prof(i / NSU)); FA.push(aOf(i / NSU)); }
      const fpt = (i, j) => { const p = FP[i][JI[j]], a = FA[i]; return [p[1], p[0] * Math.cos(a), p[0] * Math.sin(a)]; };
      B.surf((u, v) => fpt(Math.round(u * NSU), Math.round(v * NV)), NSU, NV, () => M_ORG, { e: (u, v) => PE[JI[Math.round(v * NV)]], a: (u, v) => PA[JI[Math.round(v * NV)]] });
      { const pts = []; for (let j = 0; j <= NV; j++) pts.push(fpt(0, j)); fct(pts, M_ORG, fpt(3, 5)); }   // (the flute's start, closed)
      // the saw teeth on the rim: a wedge each (T round the turn, A along x, R out), the chrome cutting face leading
      { let s = 0.02, k = 0; const sp = 0.155 / q; while (s < 0.86) { const p = prof(s), a = aOf(s), x = (p[5][1] + p[6][1]) / 2, ro = p[5][0], t = ct(x), big = k % 5 === 0 ? 1.3 : 1;
          const Rr = [0, Math.cos(a), Math.sin(a)], Tt = [0, -Math.sin(a), Math.cos(a)], O = [x, (ro - 0.012) * Rr[1], (ro - 0.012) * Rr[2]], L = (tq, aq, rq) => [O[0] + aq, O[1] + Tt[1] * tq + Rr[1] * rq, O[2] + Tt[2] * tq + Rr[2] * rq];
          const tw = (0.036 + 0.026 * (1 - t)) * big, th = (0.075 + 0.07 * (1 - t)) * big, d = (p[6][1] - p[5][1]) / 2 + 0.006, ln = th * 0.35;
          const b0 = L(-tw, -d, 0), b1 = L(tw, -d, 0), b2 = L(tw, d, 0), b3 = L(-tw, d, 0), t0 = L(tw + ln, -d * 0.7, th), t1 = L(tw + ln, d * 0.7, th), c = L(tw * 0.3, 0, th * 0.35);
          fct([b1, b2, t1, t0], M_CHR, c); fct([b3, b0, t0, t1], M_STL, c); fct([b0, b1, t0], M_STL, c); fct([b2, b3, t1], M_STL, c);
          s += sp / (ro * TAU * (3.45 + 1.5 * s)); k++; } }
      // the point: a twisted three-lobed steel cone, chrome on its ridges, its back closed
      { const PX0 = 2.0, PX1 = DRILL_L + 0.14, aE = aOf(1), NU = n(24), NVp = n(12), Rp = v => (v < 0.1 ? lerp(0.13, 0.215, sstep(0, 0.1, v)) : 0.215 * Math.pow((1 - v) / 0.9, 0.9) + 0.002), lb = (u, v) => Math.cos(3 * (u * TAU - aE - v * TAU * 0.8));
        B.surf((u, v) => { const r = Rp(v) * (v < 0.1 ? 1 : 0.8 + 0.2 * lb(u, v)), ph = u * TAU; return [lerp(PX0, PX1, v), r * Math.cos(ph), r * Math.sin(ph)]; }, NU, NVp, (u, v) => (v > 0.1 && lb(u, v) > 0.3 ? M_CHR : M_STL), { e: (u, v) => (v > 0.1 && lb(u, v) > 0.85 ? 0.6 : 0) });
        B.lathe([[PX0, 0.001], [PX0, 0.135]], M_STL, { seg: n(16) }); B.torX([PX0 + 0.075, 0, 0], 0.215, 0.016, M_ORG, { seg: n(20), rseg: 4 }); }
      M.drill = B.done(); }
    { const B = GB();   // ---- the cockpit (origin: its floor; x forward): a raised armoured platform (a bevelled plinth, beige armour sides, an orange lip, amber running lamps), the steel deck, the padded orange seat on its pedestal (cushion, bolsters, a leaning back of two pads and a headrest in a steel frame), twin control levers, a slanted console with amber lights and a dial, the protective chrome rail hoop and its posts, side armour panels, the antenna and a beacon
      const crp = pts => { const P = [pts[0], ...pts, pts[pts.length - 1]], ns = pts.length - 1; return t => { const g = Math.min(ns - 1e-9, Math.max(0, t * ns)), i = Math.floor(g), u = g - i, a = P[i], b = P[i + 1], c = P[i + 2], d = P[i + 3], u2 = u * u, u3 = u2 * u; return [0, 1, 2].map(k => 0.5 * (2 * b[k] + (c[k] - a[k]) * u + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * u2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * u3)); }; };
      const sweep = (path, r, m, nu, nv) => { const F = []; let N0 = null; for (let j = 0; j <= nv; j++) { const t = j / nv, p = path(t), T = vnrm(vsub(path(Math.min(1, t + 0.002)), path(Math.max(0, t - 0.002)))), rf = N0 || (Math.abs(T[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]), N = vnrm(vsub(rf, vmul(T, vdot(rf, T)))); N0 = N; F.push([p, N, vcross(T, N)]); }
        B.surf((u, v) => { const f = F[Math.round(v * nv)], c = Math.cos(u * TAU) * r, s = Math.sin(u * TAU) * r; return [f[0][0] + f[1][0] * c + f[2][0] * s, f[0][1] + f[1][1] * c + f[2][1] * s, f[0][2] + f[1][2] * c + f[2][2] * s]; }, nu, nv, () => m); };
      B.box([0, 0, -0.18], [0.4, 0.35, 0.14], 0.07, M_SAND); B.box([0, 0, -0.035], [0.415, 0.365, 0.03], 0.02, M_ORG); B.box([0, 0, -0.315], [0.42, 0.37, 0.03], 0.02, M_ORG);   // (the plinth: beige armour between orange lips)
      for (const sd of [1, -1]) { B.box([0.4, sd * 0.15, -0.16], [0.008, 0.05, 0.014], 0.004, M_AMB); rivets(B, [[0.4, sd * 0.25, -0.2], [0.4, sd * 0.25, -0.12]], 0.013, [1, 0, 0]); riv(B, [-0.4, sd * 0.22, -0.16], 0.013, [-1, 0, 0]); }
      B.box([0, 0, 0.012], [0.37, 0.32, 0.018], 0.01, M_STL); for (let i = 0; i < 5; i++) B.box([lerp(-0.3, 0.3, i / 4), 0, 0.032], [0.008, 0.26, 0.004], 0.003, M_STL);   // (the deck, its tread ribs)
      rivets(B, [[0.34, 0.29, 0.03], [0.34, -0.29, 0.03], [-0.34, 0.29, 0.03], [-0.34, -0.29, 0.03]], 0.014, [0, 0, 1]);
      // the seat
      B.tube([-0.08, 0, 0.03], [-0.08, 0, 0.1], 0.07, 0.06, M_STL, { seg: 12, cap0: false, cap1: 'flat' }); B.torZ([-0.08, 0, 0.05], 0.072, 0.01, M_CHR, { seg: 12, rseg: 4 });
      B.box([-0.08, 0, 0.11], [0.16, 0.185, 0.016], 0.01, M_STL); B.box([-0.07, 0, 0.152], [0.14, 0.15, 0.04], 0.034, M_ORG);
      for (const sd of [1, -1]) B.box([-0.08, sd * 0.17, 0.185], [0.13, 0.026, 0.052], 0.022, M_ORG);
      { const R = rotY(-14 * DEG); B.push(R.x, R.y, R.z, [-0.235, 0, 0.12]); B.box([-0.02, 0, 0.27], [0.022, 0.18, 0.27], 0.016, M_STL); B.box([0.025, 0, 0.13], [0.032, 0.152, 0.1], 0.03, M_ORG); B.box([0.025, 0, 0.345], [0.032, 0.152, 0.095], 0.03, M_ORG); B.box([0.02, 0, 0.55], [0.034, 0.095, 0.05], 0.03, M_ORG);
        rivets(B, [[-0.02, 0.165, 0.05], [-0.02, -0.165, 0.05], [-0.02, 0.165, 0.5], [-0.02, -0.165, 0.5]], 0.012); B.pop(); }
      // the levers and the console
      for (const sd of [1, -1]) { B.sph([0.14, sd * 0.11, 0.04], 0.032, M_STL, 8); B.tube([0.14, sd * 0.11, 0.05], [0.1, sd * 0.12, 0.27], 0.012, 0.011, M_CHR, { seg: 6, cap0: false, cap1: false }); B.sph([0.1, sd * 0.12, 0.285], 0.028, sd > 0 ? M_ORG : M_AMB, 8); }
      B.box([0.28, 0, 0.08], [0.05, 0.16, 0.06], 0.02, M_STL);
      { const R = rotY(-32 * DEG); B.push(R.x, R.y, R.z, [0.29, 0, 0.17]); B.box([0, 0, 0], [0.07, 0.2, 0.05], 0.022, M_STL); B.box([0, 0, 0.046], [0.06, 0.19, 0.006], 0.004, M_ORG);
        for (const y of [-0.13, -0.08, 0.08, 0.13]) B.box([-0.022, y, 0.056], [0.012, 0.014, 0.006], 0.004, M_AMB); B.box([0.03, 0, 0.056], [0.008, 0.1, 0.004], 0.003, M_AMB); B.torZ([-0.015, 0, 0.056], 0.034, 0.007, M_CHR, { seg: 14, rseg: 4 }); B.sph([-0.015, 0, 0.054], 0.022, M_AMB, 8); B.pop(); }
      // the protective rails: a chrome hoop round the front and sides, posts, a lower rail a side
      sweep(crp([[-0.34, 0.31, 0.03], [-0.34, 0.31, 0.33], [-0.3, 0.32, 0.41], [0.0, 0.33, 0.43], [0.28, 0.31, 0.43], [0.36, 0.2, 0.43], [0.375, 0, 0.43], [0.36, -0.2, 0.43], [0.28, -0.31, 0.43], [0.0, -0.33, 0.43], [-0.3, -0.32, 0.41], [-0.34, -0.31, 0.33], [-0.34, -0.31, 0.03]]), 0.019, M_CHR, LO ? 4 : 6, n(44));
      for (const sd of [1, -1]) { for (const [x, y] of [[0.3, 0.3], [0.0, 0.33]]) { B.tube([x, sd * y, 0.03], [x, sd * y, 0.43], 0.016, 0.016, M_CHR, { seg: 8, cap0: false, cap1: false }); B.box([x, sd * y, 0.045], [0.03, 0.03, 0.015], 0, M_STL); }
        B.tube([-0.34, sd * 0.31, 0.24], [0.3, sd * 0.3, 0.24], 0.013, 0.013, M_CHR, { seg: 8, cap0: false, cap1: false });
        B.box([-0.02, sd * 0.338, 0.13], [0.3, 0.012, 0.09], 0.01, M_SAND); B.box([-0.02, sd * 0.34, 0.215], [0.3, 0.016, 0.012], 0.006, M_ORG); rivets(B, [[-0.26, sd * 0.35, 0.13], [0.22, sd * 0.35, 0.13]], 0.011, [0, sd, 0]); }
      // the antenna and the beacon
      B.box([-0.32, -0.25, 0.07], [0.035, 0.035, 0.04], 0.012, M_STL); B.tube([-0.32, -0.25, 0.1], [-0.35, -0.27, 0.98], 0.012, 0.005, M_STL, { seg: 6, cap0: false, cap1: false }); B.sph([-0.35, -0.27, 0.99], 0.024, M_AMB, 8);
      B.tube([-0.338, -0.31, 0.7], [-0.337, -0.2, 0.7], 0.006, 0.006, M_CHR, { seg: 5 }); B.tube([-0.31, -0.18, 0.1], [-0.32, -0.19, 0.6], 0.007, 0.004, M_CHR, { seg: 5, cap0: false });
      B.tube([-0.32, 0.25, 0.04], [-0.32, 0.25, 0.16], 0.02, 0.02, M_STL, { seg: 8, cap0: false, cap1: 'flat' }); B.ell([-0.32, 0.25, 0.185], [0.03, 0.03, 0.035], M_AMB, { seg: 10, rings: 6 }); B.torZ([-0.32, 0.25, 0.19], 0.032, 0.006, M_STL, { seg: 10, rseg: 4 });
      M.cockpit = B.done(); }
    { const B = GB();   // ---- the tail (from its root, -x): a short armoured tail of four layered beige plates (each overlapping the next like shingles, flared at its trailing edge, an orange trim there), a dark steel core and belly, orange spikes along its top and flanks, a cluster of spikes at its tip
      const ringSeg = (xa, xb, r0, ra, rb, p0, p1, m, nph) => { const b = 0.022, PR = [[xa, r0], [xa, ra - b], [xa + b * 0.3, ra - b * 0.3], [xa + b, ra], [xb - b, rb], [xb - b * 0.3, rb - b * 0.3], [xb, rb - b], [xb, r0]], EG = [0.2, 0.5, 0.9, 0.5, 0.5, 0.9, 0.5, 0.2];
        B.surf((u, v) => { const p = PR[Math.round(v * 7)], ph = lerp(p0, p1, u); return [p[0], p[1] * Math.cos(ph), p[1] * Math.sin(ph)]; }, nph, 7, () => m, { e: (u, v) => EG[Math.round(v * 7)] }); };
      B.tube([0.06, 0, 0], [-0.74, 0, -0.06], 0.2, 0.05, M_STL, { seg: n(14), cap0: false, cap1: 'round', rings: 3 });
      B.ell([-0.3, 0, -0.07], [0.34, 0.12, 0.08], M_STL, { seg: n(12), rings: n(6) });   // (the belly)
      const up = Math.PI / 2;
      for (let k = 0; k < 4; k++) { const xb = 0.04 - k * 0.16, xa = xb - 0.22, r = 0.255 - k * 0.045, zc = -k * 0.016; B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, zc]);
        ringSeg(xa, xb, r * 0.6, r * 1.12, r, up - 1.95, up + 1.95, M_SAND, n(9)); ringSeg(xa - 0.006, xa + 0.04, r * 0.9, r * 1.14, r * 1.13, up - 1.97, up + 1.97, M_ORG, n(9));
        const sx = (xa + xb) / 2, pTop = [sx, 0, r * 1.07]; spikeOn(B, pTop, vnrm([-0.35, 0, 1]), 0.22 - k * 0.035, 0.065 - k * 0.008);
        if (k > 0 && k < 3) for (const sd of [1, -1]) { const a = up + sd * 1.15, p = [sx - 0.02, r * 1.06 * Math.cos(a), r * 1.06 * Math.sin(a)]; spikeOn(B, p, vnrm([-0.3, Math.cos(a), Math.sin(a)]), 0.11, 0.035); }
        for (const a of [up - 1.5, up + 1.5]) riv(B, [xb - 0.03, r * Math.cos(a), r * Math.sin(a)], 0.014, [0, Math.cos(a), Math.sin(a)]); B.pop(); }
      for (const [dy, dz] of [[0, 0.5], [0.45, -0.1], [-0.45, -0.1]]) spikeOn(B, [-0.72, dy * 0.06, -0.06 + dz * 0.06], vnrm([-1, dy, dz]), 0.17, 0.045);
      M.tail = B.done(); }
    return M;
  }
  function frameOfN(nr) { const z = vnrm(nr), y = [0, 1, 0], x = vcross(y, z); return [x, y, z]; }
  /* each part's bounding box (centre, half sizes) in its own frame: the screen bounds, the 2D picture and the extent checks */
  const PARTS = { secR: { c: [-1.3, 0.8, 1.72], h: [0.79, 0.84, 0.77], col: '#C8B08A' }, secM: { c: [0.02, 0.96, 1.8], h: [0.7, 0.99, 0.86], col: '#C8B08A' }, secF: { c: [1.3, 0.82, 1.72], h: [0.76, 0.86, 0.77], col: '#C8B08A' },
    hull: { c: [0, 0, 1.29], h: [1.97, 1.52, 0.9], col: '#2E2B2A' }, head: { c: [0.42, 0, 0.04], h: [0.51, 0.36, 0.26], col: '#C8B08A' }, leg: { c: [0.14, -0.02, -0.44], h: [0.77, 0.42, 0.72], col: '#C8B08A' },
    track: { c: [0, 0.02, 0], h: [0.57, 0.13, 0.22], col: '#2B2622' }, carriage: { c: [-0.15, 0, -0.04], h: [0.71, 0.92, 0.72], col: '#B0612E' }, drive: { c: [-1.2, 0, 0.08], h: [0.55, 0.53, 0.49], col: '#C8B08A' }, ramC: { c: [RAM_LC / 2, 0, 0], h: [RAM_LC / 2 + 0.03, 0.06, 0.06], col: '#3A3330' }, ramR: { c: [RAM_LR / 2, 0, 0], h: [RAM_LR / 2 + 0.03, 0.04, 0.04], col: '#B8B8BC' }, drill: { c: [1.29, 0, 0], h: [1.47, 0.7, 0.7], col: '#A4501F' },
    jaw: { c: [0.31, 0, -0.01], h: [0.38, 0.23, 0.14], col: '#C8B08A' }, cockpit: { c: [0, 0, 0.34], h: [0.43, 0.38, 0.68], col: '#3A3330' }, tail: { c: [-0.4, 0, 0.14], h: [0.47, 0.3, 0.34], col: '#C8B08A' } };
  for (let j = 0; j < NLINK; j++) PARTS['neck' + j] = { c: [NECK_L / 2 - 0.01, 0, 0.01], h: [NECK_L / 2 + 0.01, 0.39 - j * 0.05, 0.4 - j * 0.05], col: '#3A3330' };
  for (const k in PARTS) PARTS[k].R = vlen(PARTS[k].h) + vlen(PARTS[k].c) * 0;

  /* ================= the rig ================= */
  function rig(P) {
    const xf = cl(P.xf || 0), roll = cl(P.roll || 0), cr = cl(P.crouch || 0), crm = cl(P.crumble || 0), list = [], A = {};
    // the sequence (spec): brace and open (0-0.1), head and tail in (0.08-0.32), legs fold while the tracks swing down (0.22-0.6), the weight onto the tracks (0.48-0.7), the carriage forward and down its rails (0.55-0.86), lock, the shell closes (0.84-1)
    const sBr = sstep(0, 0.1, xf), sHd = Math.max(sstep(0.08, 0.32, xf), sstep(0, 0.35, roll)), sLg = sstep(0.22, 0.6, xf), sLow = sstep(0.48, 0.7, xf), sCar = sstep(0.55, 0.86, xf), sCls = sstep(0.84, 1, xf), sLock = sstep(0.82, 0.88, xf);
    const sRl = sstep(0.1, 0.6, roll);   // (Shell Roll: everything in, the shell down on the ground)
    const wk = (P.walkK || 0) * (1 - sLg) * (1 - sRl), wph = P.walk || 0;
    const bob = 0.05 * wk * Math.abs(Math.sin(wph)), drop = lerp(0, 0.56, sLow) + 0.62 * sRl + 0.3 * cr * (1 - sRl) - bob + 0.04 * sBr * (1 - sLow);
    const Bm = mm(rotY(P.pitch || 0), rotX(P.bank || 0)), body = [0, 0, -drop], at = p => mv(Bm, vadd(p, body)), put = (part, o, R, s, al, ex) => list.push(Object.assign({ part, o: at(o), R: mm(Bm, R), s: s == null ? 1 : s, al: al == null ? 1 : al }, ex || {}));
    // the hull and the six shell sections, hinged on the spine (so the crown seam never parts): brace lifts them, swings the rims out and spreads the rows (clearances); closed (drill) the rims stay swung out a little over the track pods, the crown held where the cockpit and carriage sit
    put('hull', [0, 0, 0], I3());
    const secs = [['secR', 0], ['secM', 1], ['secF', 2]];
    for (const [nm, i] of secs) for (const sd of [1, -1]) { const opn = sBr * (1 - sCls), a = 0.04 * opn + 0.05 * sCls, hinge = [0, 0, H0 + SC], Rh = rotX(sd * a), o = vadd(hinge, mv(Rh, vmul(hinge, -1)));
      put(nm, vadd(o, [(i - 1) * 0.045 * opn, 0, 0.03 * opn]), sd > 0 ? Rh : mm(Rh, MIR)); }
    A.shellTop = at([0, 0, H0 + SC]); A.center = at([0, 0, H0]); A.belly = at([0, 0, H0 - 0.7]);
    // the neck and the head: telescoping out of the front recess and rising forward, the head held a little nose-down (a slow nod while walking); in, the links collapse into one another and the head draws back into the recess under the rim (below the drill's mount in drill form)
    { const ext = 1 - sHd, nod = 5 * Math.sin(wph * 0.5) * wk * ext, dir = mv(rotY((lerp(6, -20, ext) + nod) * DEG), [1, 0, 0]), Rn = M3(dir, [0, 1, 0], vcross(dir, [0, 1, 0])); let p = vadd(NECK0, [0, 0, 0]);
      for (let j = 0; j < NLINK; j++) { put('neck' + j, p, Rn); p = vadd(p, vmul(dir, NECK_L * lerp(0.2, 0.86, ext))); }
      const hs = lerp(0.95, 1.15, ext), hd = mv(rotY((lerp(14, 8, ext) - 0.6 * nod) * DEG), [1, 0, 0]), Rhd = M3(hd, [0, 1, 0], vcross(hd, [0, 1, 0])), hp = vadd(p, vmul(dir, -0.4 * (1 - ext))), hpt = v => vadd(hp, mv(Rhd, vmul(v, hs)));
      put('head', hp, Rhd, hs); put('jaw', hpt([0.18, 0, -0.15]), mm(Rhd, rotY(cl(P.jaw || 0) * 30 * DEG)), hs);   // (the jaw about its hinge under the cheeks)
      A.head = at(hpt([0.34, 0, 0.08])); A.beak = at(hpt([0.9, 0, -0.12])); A.eyeL = at(hpt([0.4, 0.29, 0.055])); A.eyeR = at(hpt([0.4, -0.29, 0.055])); A.headIn = sHd; }
    // the legs and their track cassettes: four units always present
    for (let i = 0; i < 4; i++) { const front = i < 2, sd = i % 2 ? -1 : 1, hx = HIP[front ? 0 : 1][0];   // (built for the +y side, then mirrored for -y)
      const ph = wph + (i === 0 || i === 3 ? 0 : Math.PI), swing = 0.32 * wk * Math.sin(ph), lift = 0.12 * wk * Math.max(0, Math.cos(ph));
      const splay = (6 + 10 * cr) * DEG * (1 - sLg) * (1 - sRl), fold = (sLg * 74 + sRl * (1 - sLg) * 62) * DEG;   // (folded inward about the hip: down and in beside the hull)
      const R = mm(rotX(splay - fold), rotY(-swing)), hipR = [hx, HIP[0][1], LEG_L + lift + 0.16 * sRl];
      const Y = v => [v[0], sd * v[1], v[2]], Rw = sd > 0 ? R : mm(MIR, R);
      put('leg', Y(hipR), Rw, lerp(1, 0.84, sRl)); A['foot' + i] = at(Y(vadd(hipR, mv(R, [0.08, -0.02, -LEG_L])))); A['claw' + i] = at(Y(vadd(hipR, mv(R, [0.9, -0.01, -LEG_L]))));   // (the sole's centre; the claws' points)
      // the cassette: on the leg's outer side, upright along the shin (turtle); swung down flat into ground contact beside the hull (drill: two pods a side)
      const tT = vadd(hipR, mv(R, [0.0, 0.52, -0.6])), tD = [hx * 0.8, 1.42, 0.225 + drop], u = sstep(0.3, 1, sLg), tp = [lerp(tT[0], tD[0], u), lerp(tT[1], tD[1], u), lerp(tT[2], tD[2], u)];
      const Rt = mm(rotX((splay - fold * 0.4) * (1 - u)), rotY(lerp(90, 0, u) * DEG)), Rtw = sd > 0 ? Rt : mm(MIR, Rt);
      put('track', Y(tp), Rtw, lerp(1, 0.86, sRl * (1 - sLg))); A['track' + i] = at(Y(vadd(tp, [0, 0, -0.25]))); }
    // the drill carriage and the bit: over the shell on its rails (turtle), forward and down to the bow on the centreline (drill); in Shell Roll pulled back and low into the shell's lee
    // (the path: the carriage runs forward over the crown, lifted a little clear of the front spikes, lowers straight down just past the nose, then slides back to tuck the housing against the nose as the shell closes. The drive (the motor block) rides along behind it, then on the way down slides into its bay inside the hull (DRIVE1, body frame) and fades out as it passes the shell: hidden in drill form. dive: burrowing, the carriage sinks down its forward sockets, nose down, under the floor cut with the hull)
    { const ux = sstep(0, 0.55, sCar), uz = sstep(0.42, 1, sCar), hop = 0.3 * Math.sin(Math.PI * cl(sCar / 0.62)), dive = sCar * sstep(0.15, 0.9, P.ground || 0), clr = 0.56;
      const dk = [lerp(DOCK0[0], DOCK1[0] + clr, ux) - clr * sCls, 0, lerp(DOCK0[2], DOCK1[2] + drop, uz) + hop - 0.38 * sRl * (1 - sCar) - 0.55 * dive], dkr = vadd(dk, [-0.35 * sRl * (1 - sCar), 0, 0]), tilt = (-6 * (1 - ux) + 10 * dive) * DEG, Rc = rotY(tilt);
      const din = sstep(0.05, 0.75, uz), dal = 1 - sstep(0, 0.6, uz), dvp = [lerp(dkr[0], DRIVE1[0], din), 0, lerp(dkr[2], DRIVE1[2], din)];
      put('carriage', dkr, Rc); put('drive', dvp, Rc, 1, dal); A.dock = at(dkr); A.motor = at(vadd(dvp, mv(Rc, [-1.18, 0, 0.2]))); A.lock = sLock;
      for (const sd of [1, -1]) { const pa = vadd(dkr, mv(Rc, [RAM_A[0], sd * RAM_A[1], RAM_A[2]])), pb = vadd(dvp, mv(Rc, [RAM_B[0], sd * RAM_B[1], RAM_B[2]])), X = vnrm(vsub(pb, pa)), Yr = mv(Rc, [0, 1, 0]), Y = vnrm(vsub(Yr, vmul(X, vdot(X, Yr))));
        put('ramC', pa, M3(X, Y, vcross(X, Y)), 1, dal); put('ramR', pb, M3(vmul(X, -1), Y, vcross(vmul(X, -1), Y)), 1, dal); }
      const off = P.drillOff, home = !off, Rd = mm(Rc, mm(rotZ(P.drillYaw || 0), mm(rotY(-(P.drillPitch || 0)), rotX(P.drillSpin || 0))));
      const bp = home ? vadd(dkr, mv(Rc, [0.25, 0, 0])) : vadd(vadd(dkr, mv(Rc, [0.25, 0, 0])), off);
      const mat = P.drillMat == null ? 1 : cl(P.drillMat), me = mat * mat * (3 - 2 * mat);   /* (v336: a new bit materialising on the carriage: it grows in from a third of its size and fades up, glowing) */
      if (home) put('drill', bp, Rd, lerp(0.3, 1, me), me, { glow2: Math.max(cl(P.drillGlow || 0), 1 - me) });
      else { const Rf = mm(rotZ(P.drillYaw || 0), mm(rotY(-(P.drillPitch || 0)), rotX(P.drillSpin || 0)));   /* (v336: a bit out in the field (lodged in the ground) is placed free of the body's sway: its offset from the dock and its own yaw and pitch only) */
        list.push({ part: 'drill', o: vadd(at(dkr), vadd(mv(Rc, [0.25, 0, 0]), off)), R: Rf, s: 1, al: 1, glow2: cl(P.drillGlow || 0) }); }
      A.drillBase = at(bp); A.drillTip = at(vadd(bp, mv(Rd, [DRILL_L + 0.14, 0, 0]))); A.drillHome = home ? 1 : 0; }
    // the cockpit: on the rear chassis pillar; upright in both forms
    { const o = vadd(SEAT0, [0, 0, 0]); put('cockpit', o, I3()); A.seat = at(vadd(o, [-0.06, 0, 0.22])); A.cockpit = at(o); }
    // the tail: out behind (turtle), folded up into the rear structure (drill, roll)
    { const tf = Math.max(sstep(0.08, 0.32, xf), sRl), R = rotY(lerp(10, -75, tf) * DEG); put('tail', [-SA * 0.94, 0, H0 - 0.22 + 0.1 * tf], R, lerp(1, 0.8, tf)); A.tail = at([-SA - 0.4, 0, H0 - 0.25]); }
    A.front = at([SA + 0.4, 0, 0.1]); A.up = at([0, 0, 1]); A.ground = -drop;
    // the crumble (ending): every part slumps, settles and breaks apart a little; alpha fades through the last third
    if (crm > 0) for (let i = 0; i < list.length; i++) { const it = list[i], h = hsh(i * 3.7 + 1), h2 = hsh(i * 9.1 + 4), d = vnrm([h - 0.5, h2 - 0.5, 0.15]), u = crm * crm;
      it.o = vadd(it.o, [d[0] * 0.5 * u, d[1] * 0.5 * u, -Math.min(it.o[2], 0.9 * u)]); it.R = mm(rotX((h - 0.5) * 0.5 * u), mm(rotY((h2 - 0.5) * 0.5 * u), it.R)); it.al *= 1 - sstep(0.62, 1, crm); it.dust = crm; }
    return { list, A };
  }

  /* ================= the view and the draws (as Jaws') ================= */
  const CW = [0, VY, VZ], EXW = [1, 0, 0], EYW = vcross(CW, EXW);
  const LW = vnrm([-0.5, 0.3, 0.82]), SBW = vnrm([-0.2, -0.38, 0.9]), RIMW = vnrm([0.55, -0.72, 0.42]), UPW = [0, 0, 1];
  function camAt(el, az) { const e = el * DEG, a = az * DEG, C = [Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e)], EX = vnrm(vcross([0, 0, 1], C).map(v => -v)); const ex = vlen(EX) > 1e-4 ? EX : [1, 0, 0]; return { C, EX: ex, EY: vcross(C, ex) }; }
  function mkView(x, y, z, a, o) {
    const T = o.T, sc = (o.scale || 1) * VIS, k = T * sc, Rh = rotZ(a), X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T, K = o.cam ? camAt(o.cam[0], o.cam[1]) : null;
    const toS = K ? p => { const w = mv(Rh, p); return [X0 + vdot(w, K.EX) * k, Y0 + vdot(w, K.EY) * k]; } : p => { const w = mv(Rh, p); return [X0 + w[0] * k, Y0 + (w[1] * GY - w[2] * ZK) * k]; };
    const toW = p => { const w = mv(Rh, p); return { x: x + w[0] * sc, y: y + w[1] * GY * sc, z: z + w[2] * sc }; };
    return { T, sc, k, Rh, toS, toW, depth: p => vdot(mv(Rh, p), K ? K.C : CW), x, y, z, a, K };
  }
  let LAST = null, NOGL = false, GLFAIL = 0, GLRETRY = 0, GLMS = 0, GLN = 0; const GLI = [], GLJ = [];
  let GLLAST = 0; const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
  const glOn = () => { if (NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__GENBU_GL)) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Genbu: meshes', e); return false; } } return true; };
  const GLCAP = 1600, RIMC = [0.55, 0.48, 0.42], AMBC = [0.95, 0.88, 0.8];
  /* soft amber light: the eyes, the slots, the drill's bearings when it spins up; a faint warm aura when powered */
  const HL = [], AMB = '#FFB347';
  function halos(c, V, R, P, al0) {
    if (typeof GLM === 'undefined' || !GLM.halos) return; const A = R.A, k = V.k, g = cl(P.glow == null ? 0.5 : P.glow) * al0 * (1 - cl(P.crumble || 0)), dg = cl(P.drillGlow || 0); HL.length = 0; if (g < 0.02 && dg < 0.02) return;
    const add = (p, r, a, col) => { if (!p) return; const q = V.toS(p); HL.push({ x: q[0], y: q[1], r: r * k, a: Math.min(0.9, a), col: col || AMB }); };
    if (A.headIn < 0.9) { add(A.eyeL, 0.22, 0.5 * g); add(A.eyeR, 0.22, 0.5 * g); }
    if (dg > 0.02) { add(A.dock, 1.0, 0.35 * dg); add(A.drillBase, 0.7, 0.3 * dg); }
    GLM.halos(c, HL);
  }
  function glPass(c, V, P, o, list, al0) {
    const k = V.k, K = V.K, PX = K ? K.EX : EXW, PY = K ? K.EY : [0, GY, -ZK], PD = K ? K.C : CW, X0 = V.toS([0, 0, 0]);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { const Pt = PARTS[it.part], rr = Pt.R * it.s * 1.05 * k, w = mv(V.Rh, vadd(it.o, mv(it.R, vmul(Pt.c, it.s)))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !(typeof window !== 'undefined' && window.__GENBU_GLHQ), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.4 : 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sc = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sc)); H = Math.max(2, Math.ceil(H * sc));
    const bw = bx1 - bx0, bh = by1 - by0, tl = w => { const a = vdot(w, EXW), b = vdot(w, EYW), cc = vdot(w, CW); return K ? vadd(vadd(vmul(K.EX, a), vmul(K.EY, b)), vmul(K.C, cc)) : w; };
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: tl(LW), ls: tl(SBW), lr: tl(RIMW), up: tl(UPW), low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t: nowMs() / 1000, outline: Math.max(1, 1.4 * (W / bw) * (o.outlineK || 1)), clip: P.ground != null ? [P.ground, 0.0001] : null };   // (ground: burrowing, nothing below it is drawn)
    const gl0 = cl(P.glow == null ? 0.5 : P.glow) * (1 - cl(P.crumble || 0));
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = MESH[it.part]; if (!mesh || !(it.al > 0.004) || !(it.s > 0.002)) continue; const Rw = mm(V.Rh, it.R), s2 = it.s, T = mv(V.Rh, it.o), al = al0 * it.al;
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2; g.R1[i] = Rw.y[i] * s2; g.R2[i] = Rw.z[i] * s2; g.T[i] = T[i]; }
      g.alpha = al; g.glow = it.part === 'drill' || it.part === 'carriage' ? Math.max(gl0, cl(P.drillGlow || 0)) : gl0; g.kind = 0; g.wear = 0.8; g.fx = 0; g.glow2 = it.glow2 || 0; g.spill = 0; g.d = vdot(T, PD); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++;
  }
  /* the 2D picture (no usable GPU): each part's box, as seen, far to near, in its colour with a dark line */
  function hull2(P) { P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } lo.pop(); up.pop(); return lo.concat(up); }
  function drawFallback(c, V, R, al0, P) {
    const L = R.list.map(it => ({ it, d: V.depth(vadd(it.o, mv(it.R, PARTS[it.part].c))) })).sort((a, b) => a.d - b.d), k = V.k; c.save(); c.lineJoin = 'round';
    for (const { it } of L) { const Pt = PARTS[it.part], pts = []; for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push(V.toS(vadd(it.o, mv(it.R, vmul([Pt.c[0] + sx * Pt.h[0] * 0.85, Pt.c[1] + sy * Pt.h[1] * 0.85, Pt.c[2] + sz * Pt.h[2] * 0.85], it.s)))));
      const H = hull2(pts); if (H.length < 3) continue; c.globalAlpha = al0 * it.al; c.beginPath(); c.moveTo(H[0][0], H[0][1]); for (let i = 1; i < H.length; i++) c.lineTo(H[i][0], H[i][1]); c.closePath(); c.fillStyle = Pt.col; c.fill(); c.strokeStyle = '#241A12'; c.lineWidth = Math.max(1, 0.03 * k); c.stroke(); }
    c.restore();
  }
  function draw(c, x, y, z, a, P, o) {
    o = o || {}; const V = mkView(x, y, z, a, o), R = rig(P); LAST = { V, R };
    const al0 = cl(P.alpha == null ? 1 : P.alpha); if (al0 < 0.01) return;
    if (glOn()) { try { glPass(c, V, P, o, R.list, al0); halos(c, V, R, P, al0); return; } catch (e) { glFail(); if (typeof console !== 'undefined') console.warn('Genbu: GL draw', e); } }
    if (P.ground != null && !V.K) { const yg = o.sy(y) - (z + P.ground * V.sc) * ZK * V.T; c.save(); c.beginPath(); c.rect(-1e5, -1e5, 2e5, 1e5 + yg); c.clip(); drawFallback(c, V, R, al0, P); c.restore(); return; }
    drawFallback(c, V, R, al0, P);
  }
  function drawShadow(c, x, y, z, a, P, o) {
    o = o || {}; const T = o.T, k = T * (o.scale || 1) * VIS, al = cl(P.alpha == null ? 1 : P.alpha) * 0.36 * (1 - cl(P.crumble || 0) * 0.6) / (1 + Math.max(0, z) * 0.2); if (al < 0.01) return;
    const X0 = o.sx(x), Y0 = o.sy(y); c.save(); c.globalAlpha = al; c.translate(X0, Y0); c.rotate(Math.atan2(Math.sin(a) * GY, Math.cos(a))); c.scale(1, 0.62);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 2.6 * k); g.addColorStop(0, 'rgba(24,14,6,0.9)'); g.addColorStop(0.6, 'rgba(24,14,6,0.4)'); g.addColorStop(1, 'rgba(24,14,6,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 2.6 * k, 0, TAU); c.fill(); c.restore();
  }
  function anchor(name) { if (!LAST) return null; const p = LAST.R.A[name]; if (!p || !Array.isArray(p)) return null; return LAST.V.toW(p); }
  function anchorAt(name, x, y, z, a, P, o) { const R = rig(P), p = R.A[name]; if (!p || !Array.isArray(p)) return null; const sc = ((o && o.scale) || 1) * VIS, w = mv(rotZ(a), p); return { x: x + w[0] * sc, y: y + w[1] * GY * sc, z: z + w[2] * sc }; }
  function blankPose() { return { xf: 0, walk: 0, walkK: 0, crouch: 0, roll: 0, bank: 0, pitch: 0, drillSpin: 0, drillOff: null, drillYaw: 0, drillPitch: 0, drillGlow: 0, drillMat: 1, jaw: 0, glow: 0.5, crumble: 0, ground: null, alpha: 1 }; }
  function create() { const P = blankPose(); return { pose: P, draw: (c, x, y, z, a, P2, o) => draw(c, x, y, z, a, P2 || P, o), drawShadow: (c, x, y, z, a, P2, o) => drawShadow(c, x, y, z, a, P2 || P, o) }; }
  const COUNTS = { sections: 6, legs: 4, tracks: 4, neck: NLINK, drill: 1 };
  const SIZE = { len: (SA * 2 + 1.6) * VIS, lenDrill: (DOCK1[0] + DRILL_L + 0.14 + SA) * VIS, wid: (SB * 2 + 0.7) * VIS, h: (DOCK0[2] + DRILL_R) * VIS, hDrill: 1.9 * VIS, r: 2.6 * VIS, drillL: DRILL_L * VIS };
  return { create, warm: () => { glOn(); return true; }, warmIdle: () => { glOn(); }, ready: () => true, draw, drawShadow, anchor, anchorAt, rigOf: P => rig(Object.assign(blankPose(), P || {})), blankPose, SIZE, PARTS, COUNTS,
    __dbg: { get MESH() { return MESH; } }, get gl() { return glOn(); }, get stats() { return { ms: GLMS, n: GLN, meshMs: MESH_MS }; } };
})();
if (typeof self !== 'undefined') self.GENBU_MODEL = GENBU_MODEL;
