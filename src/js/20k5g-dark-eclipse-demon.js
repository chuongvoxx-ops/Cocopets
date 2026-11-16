/* ---------- Final Eclipse: the demon knight in 3D (worker U1, v391) ----------
   An ORIGINAL winged demon knight for Dark's Final Eclipse (20k5g-dark-ult-6.js), drawn live on the GPU with GLM (20k5uz,
   materials 120..126 between the FE-DEMON-MAT markers) as Ifrit and Susano O are: meshes built once, rigid parts posed each
   frame, two moving meshes (the wing membranes and the tail) rewritten in place, one composite drawImage.
   The figure: very tall and lean; long thin limbs; long-fingered clawed hands (four fingers and a thumb, each finger two
   posed segments); a narrow waist under a broad ribcage and broad shoulders; a small head with two thin swept horns (a
   second, shorter pair at Celestial); digitigrade legs (thigh, shin, a long metatarsus, three clawed toes and a spur); a
   long whip of a tail ending in a barbed blade; two enormous membranous wings (about 2.7 x its height across: an arm of
   humerus and forearm, four long finger bones, a thumb claw; membrane panels between the fingers and down to the flank,
   scalloped and ragged along their free edges, with tears).
   The armour is dark rocky obsidian: faceted plates of volcanic glass (flat facets rising to an off-centre apex, their
   outlines bitten by conchoidal chips) over the shoulders, chest, belly, back, forearms, thighs and shins, their sides
   rough rocky breaks with violet magma glowing in the crevices; glossy near-black with a deep violet sheen; the body
   between the plates is dark corded sinew; the membranes dark and translucent, lit violet from behind.
   ECLIPSE_DEMON: { draw(c, x, y, z, a, P, o), POSES, blend, pose(name), rig, warm, anchorsOf, __dbg }. A 2D picture of
   the same rig is drawn when WebGL is missing (or on a software rasteriser, unless window.__FE_GL = 1). */
const ECLIPSE_DEMON = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const SE = Math.sin(0.62), CE = Math.cos(0.62);   // (GeoKit's camera: orthographic, 0.62 rad above the floor)

  /* ================= vectors and rotations (a rotation: its three columns) ================= */
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  const vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vlerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const M3 = (x, y, z) => ({ x, y, z }), I3 = () => M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };   // (+a: x toward -z, a forward bow)
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  function rotV(v, ax, a) { const k = vnrm(ax), c = Math.cos(a), s = Math.sin(a), d = vdot(k, v), x = vcross(k, v); return [v[0] * c + x[0] * s + k[0] * d * (1 - c), v[1] * c + x[1] * s + k[1] * d * (1 - c), v[2] * c + x[2] * s + k[2] * d * (1 - c)]; }
  function frameXZ(xd, zh) { const x = vnrm(xd); let y = vcross(zh, x); if (vlen(y) < 1e-6) y = vcross([0, 0, 1], x); if (vlen(y) < 1e-6) y = [0, 1, 0]; y = vnrm(y); return M3(x, y, vcross(x, y)); }
  /* two-bone reach from S toward T (bones a, b), the middle joint toward `pole` */
  function ik2(S, T, a, b, pole) {
    const d0 = vsub(T, S), L = vlen(d0) || 1e-6, d = Math.max(Math.abs(a - b) + 1e-3, Math.min(a + b - 1e-4, L)), e = vmul(d0, 1 / L);
    let p = vsub(pole, vmul(e, vdot(pole, e))); if (vlen(p) < 1e-6) p = Math.abs(e[2]) < 0.9 ? vcross(e, [0, 0, 1]) : vcross(e, [1, 0, 0]); p = vnrm(p);
    const ca = (a * a + d * d - b * b) / (2 * a * d), sa = Math.sqrt(Math.max(0, 1 - ca * ca));
    return { E: vadd(S, vadd(vmul(e, a * ca), vmul(p, a * sa))), W: vadd(S, vmul(e, d)) };
  }
  const hash3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
  function vnoise(x, y, z) { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const h = (a, b, c) => hash3(xi + a, yi + b, zi + c), l1 = (b, c) => lerp(h(0, b, c), h(1, b, c), u), l2 = c => lerp(l1(0, c), l1(1, c), v); return lerp(l2(0), l2(1), w); }
  const fbm = (x, y, z) => vnoise(x, y, z) * 0.55 + vnoise(x * 2.07 + 5.1, y * 2.07 + 1.3, z * 2.07 + 7.7) * 0.3 + vnoise(x * 4.3 + 2.2, y * 4.3 + 9.4, z * 4.3 + 3.3) * 0.15;

  /* ================= materials (GLM's FE-DEMON-MAT block) ================= */
  const M_GLASS = 120, M_BREAK = 121, M_SINEW = 122, M_HORN = 123, M_MEMB = 124, M_WBONE = 125, M_LIGHT = 126;

  /* ================= the measures (model units; drawn at `scale` tiles each) =================
     The pelvis is the root (0, 0, 0); standing it is 1.42 above the toes, the crown 1.3 above it: 2.75 tall, the wings
     about 7.4 across when spread. x forward, y its left (+) / right, z up */
  const LT = 0.6, LS = 0.62, LM = 0.42;                        // thigh, shin, metatarsus
  const LU = 0.7, LF = 0.68;                                   // upper arm, forearm (to the wrist)
  const SH = s => [-0.02, s * 0.44, 0.86], HIP = s => [0.0, s * 0.13, -0.05];
  const NECK = [0.02, 0, 0.96], HEADC = [0.075, 0, 1.17];
  const WROOT = s => [-0.15, s * 0.13, 0.8];
  const WHU = 0.82, WFA = 1.22, WFL = [2.05, 1.88, 1.62, 1.3];  // the wing's humerus, forearm and finger bones
  const TAILN = 24, TAILL = 2.5, TAIL0 = [-0.12, 0, -0.05];

  /* ================= meshes ================= */
  /* the trunk: v 0 (the pelvis's top) .. 1 (the neck's root), phi round it (0 forward, + toward its left): [v, z, half
     width, front depth, back depth]: a narrow waist, a deep broad ribcage, broad shoulders */
  const TV = [[0, 0.0, 0.15, 0.115, 0.11], [0.15, 0.15, 0.115, 0.095, 0.095], [0.3, 0.3, 0.13, 0.105, 0.105], [0.48, 0.48, 0.22, 0.15, 0.135], [0.64, 0.64, 0.3, 0.17, 0.15], [0.78, 0.78, 0.37, 0.165, 0.15], [0.88, 0.88, 0.33, 0.135, 0.13], [0.95, 0.94, 0.18, 0.1, 0.1], [1, 0.98, 0.075, 0.068, 0.068]];
  const sePow = (c, p) => Math.sign(c) * Math.pow(Math.abs(c), 2 / p);
  function tvAt(v) { let i = 0; while (i < TV.length - 2 && TV[i + 1][0] < v) i++; const a = TV[i], b = TV[i + 1], u = sstep(0, 1, (v - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u), lerp(a[4], b[4], u)]; }
  function trunkPt(ph, v, lift) { const [z, yw, xf, xb] = tvAt(v), c = Math.cos(ph), s = Math.sin(ph), k = 1 + (lift || 0) + (fbm(ph * 2.1 + 3, v * 5, 1.7) - 0.5) * 0.05;
    const pec = 0.05 * sstep(0.55, 0.72, v) * (1 - sstep(0.82, 0.92, v)) * Math.max(0, c);   // (the chest swells forward)
    return [sePow(c, 2.4) * (c > 0 ? xf + pec : xb) * k, sePow(s, 2.4) * yw * k, z]; }
  function trunkNrm(ph, v) { const e = 0.01, a = trunkPt(ph + e, v), b = trunkPt(ph - e, v), c = trunkPt(ph, Math.min(1, v + e)), d = trunkPt(ph, Math.max(0, v - e)); let n = vcross(vsub(a, b), vsub(c, d)); const p = trunkPt(ph, v); if (vdot(n, [p[0], p[1], 0]) < 0) n = vmul(n, -1); return vnrm(n); }
  const TS = (p0, p1, v0, v1, lift) => (s, t) => { const ph = lerp(p0, p1, (s + 1) / 2), v = lerp(v0, v1, (t + 1) / 2); return [trunkPt(ph, v, lift || 0.02), trunkNrm(ph, v)]; };
  /* surface patches for the plates, s and t in [-1, 1]: round the x axis (a limb; angle 0 = +z, the limb's outer face) and on a sphere */
  const cylS = (x0, x1, a0, a1, r0, r1) => (s, t) => { const v = (t + 1) / 2, x = lerp(x0, x1, v), a = lerp(a0, a1, (s + 1) / 2), r = lerp(r0, r1, v); return [[x, Math.sin(a) * r, Math.cos(a) * r], [0, Math.sin(a), Math.cos(a)]]; };
  const sphS = (c, r, t0, t1, p0, p1, sq) => (s, t) => { const th = lerp(t0, t1, (t + 1) / 2), p = lerp(p0, p1, (s + 1) / 2), n = [Math.sin(th) * Math.cos(p), Math.sin(th) * Math.sin(p), Math.cos(th)], q = sq || [1, 1, 1]; return [[c[0] + n[0] * r * q[0], c[1] + n[1] * r * q[1], c[2] + n[2] * r * q[2]], vnrm([n[0] / q[0], n[1] / q[1], n[2] / q[2]])]; };
  const flatS = (o, ux, uy, nz) => (s, t) => [vadd(o, vadd(vmul(ux, s), vmul(uy, t))), nz];
  /* a chipped outline: the corners (s, t), each edge bitten by shallow conchoidal chips (scallops between chip points) */
  function chipped(corners, seed, bite) {
    const n = corners.length, out = []; let cx = 0, cy = 0; for (const p of corners) { cx += p[0] / n; cy += p[1] / n; }
    for (let i = 0; i < n; i++) { const A = corners[i], B = corners[(i + 1) % n], L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1e-6; let nx = (B[1] - A[1]) / L, ny = -(B[0] - A[0]) / L; const mx = (A[0] + B[0]) / 2 - cx, my = (A[1] + B[1]) / 2 - cy; if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; }
      const m = Math.max(2, Math.round(L * 2.4)); out.push(A);
      for (let k = 1; k < m; k++) { const u = (k + (hash3(seed, i, k) - 0.5) * 0.5) / m, d = (0.35 + 0.65 * hash3(seed + 3, i, k)) * bite * L / m; out.push([lerp(A[0], B[0], u) - nx * d, lerp(A[1], B[1], u) - ny * d]); } }
    return out; }
  /* a flat facet as a 1 x 1 surface patch (its first edge shrunk to almost nothing at the apex): one normal, the edge
     weight 0 at the apex .. 1 at the rim; facing `out` */
  function facet(B, ap, p, q, m, out, eFn) {
    const sp = vmul(vsub(q, p), 0.0015), du = vsub(q, p), dv = vsub(vlerp(p, q, 0.5), ap), flip = vdot(vcross(du, dv), out) < 0;
    B.surf((u, v) => vlerp(vadd(ap, vmul(sp, u - 0.5)), vlerp(p, q, u), v), 1, 1, () => m, { e: eFn || ((u, v) => v), flip }); }
  /* a slab of obsidian on a surface S(s, t) -> [point, normal]: its outline `ol` (chipped), thickness th, its face cut
     into flat facets rising to an apex at `ap` ([s, t]) rd above the face; its sides rough breaks (M_BREAK) */
  function slab(B, S, ol, th, rd, ap) {
    const n = ol.length, top = [], bot = []; ap = ap || [0.12, -0.1];
    for (const [s, t] of ol) { const [p, nn] = S(s, t); top.push(vadd(p, vmul(nn, th))); bot.push(vsub(p, vmul(nn, th * 0.4))); }
    const [pa, na] = S(ap[0], ap[1]), apex = vadd(pa, vmul(na, th + rd * 1.6)); let cen = [0, 0, 0]; for (const p of top) cen = vadd(cen, vmul(p, 1 / n));
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; facet(B, apex, top[i], top[j], M_GLASS, na); }
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, mid = vlerp(top[i], top[j], 0.5); B.surf((u, v) => vlerp(vlerp(bot[i], bot[j], u), vlerp(top[i], top[j], u), v), 1, 1, () => M_BREAK, { e: () => 1, flip: vdot(vcross(vsub(bot[j], bot[i]), vsub(top[i], bot[i])), vsub(mid, cen)) < 0 }); }
    return B; }
  /* a plate from a few corners on a patch: chipped, thickness, ridge height and apex */
  const plate = (B, S, corners, seed, th, rd, ap, bite) => slab(B, S, chipped(corners, seed, bite == null ? 0.16 : bite), th, rd, ap);
  /* a muscle: a corded tube along x from 0 to L, radius r(u), flattened by sq across z */
  function muscle(B, L, r, o) { o = o || {}; const nu = o.nu || 10, nv = o.nv || 12, sd = o.seed || 0, sq = o.sq || 1;
    B.surf((u, v) => { const a = v * TAU, rr = r(u) * (1 + (fbm(u * 3.1 + sd, Math.cos(a) * 1.3 + sd, Math.sin(a) * 1.3) - 0.5) * 0.14); return [u * L, Math.cos(a) * rr, Math.sin(a) * rr * sq]; }, nu, nv, () => o.m || M_SINEW, { flip: true }); return B; }
  /* a horn or claw along a curve: P(u) its spine, r(u) its radius, k shallow ridges; vA.z 1 at the root .. 0 at the tip */
  function horn(B, P, r, m, o) { o = o || {}; const nu = o.nu || 14, k = o.k || 6, sd = o.seed || 0;
    const fr = u => { const a = P(Math.max(0, u - 0.01)), b = P(Math.min(1, u + 0.01)); return frameXZ(vsub(b, a), o.up || [0, 0, 1]); };
    B.surf((u, v) => { const F = fr(u), a = v * TAU, fa = (a * k / TAU) % 1, rid = 1 - Math.abs(fa - 0.5) * 2, rr = r(u) * (0.9 + 0.14 * rid + (fbm(u * 6 + sd, v * 5, sd) - 0.5) * 0.12); const p = P(u); return vadd(p, vadd(vmul(F.y, Math.cos(a) * rr), vmul(F.z, Math.sin(a) * rr))); },
      nu, k * 2, () => m, { e: () => 0, a: u => 1 - u }); return B; }
  const bez3 = (a, b, c, d) => u => { const w = 1 - u; return [0, 1, 2].map(i => w * w * w * a[i] + 3 * w * w * u * b[i] + 3 * w * u * u * c[i] + u * u * u * d[i]); };

  let MESH = null, MESH_MS = 0;
  function buildMeshes() {
    const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(3, Math.round(n * DQ));
    const fin = (name, B) => { out[name] = B.done(); };
    /* ---- the pelvis: a narrow block of sinew under hanging faulds of glass ---- */
    { const B = nb(); B.ell([0, 0, -0.01], [0.13, 0.17, 0.12], M_SINEW, { seg: q(16), rings: q(9) });
      plate(B, sphS([0.0, 0, 0.0], 0.15, 1.35, 2.35, -0.65, 0.65, [1.05, 1.1, 1]), [[-1, -1], [1, -1], [0.8, 0.7], [0, 1], [-0.8, 0.7]], 11, 0.022, 0.03, [0, -0.2]);
      for (const s of [-1, 1]) plate(B, sphS([0.0, 0, 0.0], 0.16, 1.2, 2.25, s * Math.PI / 2 - 0.75, s * Math.PI / 2 + 0.75, [1, 1.05, 1]), [[-1, -1], [1, -1], [0.9, 0.6], [0.1, 1], [-0.9, 0.5]], 13 + s, 0.02, 0.028, [0.1, -0.1]);
      B.sph(TAIL0, 0.07, M_SINEW, q(10)); fin('pelvis', B); }
    /* ---- the trunk: corded sinew, glass over the chest, the belly (three narrow plates on the waist), the flanks and the
       back between the wings, a yoke over each shoulder; the neck ---- */
    { const B = nb(); B.surf((u, v) => trunkPt(u * TAU, v), q(30), q(22), () => M_SINEW, { flip: true });
      B.at([0.02, 0, 0.93]); B.tube([0, 0, 0], [0.04, 0, 0.17], 0.068, 0.055, M_SINEW, { seg: q(12), cap0: false, cap1: 'round' }); B.pop();
      for (const s of [-1, 1]) {
        plate(B, TS(s > 0 ? 0.06 : -1.15, s > 0 ? 1.15 : -0.06, 0.6, 0.87, 0.05), s > 0 ? [[-1, -0.6], [0.2, -1], [1, -0.3], [0.9, 1], [-0.7, 0.9]] : [[1, -0.6], [-0.2, -1], [-1, -0.3], [-0.9, 1], [0.7, 0.9]], 20 + s, 0.026, 0.04, [s * 0.1, 0.05]);   // (the pectorals)
        plate(B, TS(s * 1.25, s * 2.0, 0.42, 0.68, 0.03), [[-1, -0.8], [1, -1], [1, 0.8], [-0.6, 1]], 24 + s, 0.02, 0.025, [0, 0]);   // (the flank)
        plate(B, TS(s > 0 ? 0.9 : -2.05, s > 0 ? 2.05 : -0.9, 0.83, 0.97, 0.06), [[-1, -1], [1, -0.8], [0.8, 1], [-0.9, 0.9]], 27 + s, 0.024, 0.035, [0, 0.2]);   // (the yoke over the shoulder)
        plate(B, TS(s > 0 ? Math.PI - 1.05 : Math.PI + 0.1, s > 0 ? Math.PI - 0.1 : Math.PI + 1.05, 0.5, 0.78, 0.04), [[-1, -1], [1, -0.9], [0.9, 1], [-1, 0.8]], 30 + s, 0.024, 0.03, [0, 0]); }   // (the back plates beside the spine)
      [[0.43, 0.56, 0.5], [0.3, 0.43, 0.42], [0.17, 0.3, 0.38]].forEach(([v0, v1, w], i) => plate(B, TS(-w * 1.6, w * 1.6, v0, v1, 0.04 + i * 0.01), [[-1, -0.9], [1, -0.9], [0.85, 1], [-0.85, 1]], 40 + i, 0.02, 0.022, [0, 0.1], 0.12));   // (the belly: narrow plates down the waist)
      plate(B, TS(-0.32, 0.32, 0.56, 0.74, 0.07), [[-1, -1], [1, -1], [0.6, 1], [-0.6, 1]], 44, 0.022, 0.03, [0, 0]);   // (the sternum)
      for (let i = 0; i < 4; i++) B.crystal(trunkPt(Math.PI, 0.36 + i * 0.13, 0.02), vadd(trunkPt(Math.PI, 0.36 + i * 0.13, 0.02), [-0.13 + i * 0.01, 0, 0.09 - i * 0.01]), 0.03 - i * 0.003, M_GLASS, { n: 5, belly: 0.25, seed: 50 + i, thin: 0.45, jit: 0.25 });   // (a low ridge of glass down the spine)
      for (const s of [-1, 1]) B.sph(WROOT(s), 0.07, M_SINEW, q(10));
      fin('torso', B); }
    /* ---- the head: small; a skull of sinew under a faceted mask of glass, two eye slits of light, two thin swept horns
       (Celestial: a second, shorter pair below them) ---- */
    for (const cel of [0, 1]) { const B = nb();
      B.ell([0, 0, 0], [0.085, 0.074, 0.092], M_SINEW, { seg: q(14), rings: q(9) });
      B.ell([0.04, 0, -0.06], [0.06, 0.05, 0.045], M_SINEW, { seg: q(12), rings: q(6) });   // (the jaw)
      plate(B, sphS([0.0, 0, 0.0], 0.088, 0.25, 1.95, -1.05, 1.05, [1.02, 0.9, 1.05]), [[-1, -1], [-0.3, -0.75], [0.3, -0.75], [1, -1], [1, 0.4], [0.5, 1], [-0.5, 1], [-1, 0.4]], 60, 0.012, 0.016, [0, 0.05], 0.1);   // (the mask)
      plate(B, sphS([0.0, 0, 0.0], 0.09, 0.0, 0.8, -2.6, 2.6, [1, 0.95, 1.05]), [[-1, -1], [1, -1], [0.9, 1], [-0.9, 1]], 61, 0.012, 0.018, [0, 0], 0.1);   // (the crown)
      for (const s of [-1, 1]) { B.push([0.95, s * 0.3, -0.05], [-s * 0.3, 0.95, 0.08], [0, 0, 1], [0.085, s * 0.032, 0.012]); B.box([0, 0, 0], [0.008, 0.021, 0.006], 0.004, M_LIGHT); B.pop();
        const P = bez3([-0.01, s * 0.045, 0.06], [-0.07, s * 0.11, 0.12], [-0.2, s * 0.14, 0.14], [-0.33, s * 0.12, 0.25]);
        horn(B, P, u => 0.026 * Math.pow(1 - u, 0.75) + 0.003, M_HORN, { nu: q(16), seed: 3 + s });
        if (cel) { const P2 = bez3([-0.03, s * 0.07, 0.0], [-0.09, s * 0.12, 0.0], [-0.17, s * 0.13, -0.04], [-0.24, s * 0.1, -0.02]); horn(B, P2, u => 0.018 * Math.pow(1 - u, 0.75) + 0.002, M_HORN, { nu: q(12), seed: 7 + s }); } }
      fin(cel ? 'head7' : 'head', B); }
    /* ---- the arms: lean corded sinew; a great pauldron (two layered slabs) on the upper arm's outer face, a vambrace of
       two slabs and two glass spurs on the forearm's outer face ---- */
    { const B = nb(); B.sph([0, 0, 0], 0.056, M_SINEW, q(12)); muscle(B, LU, u => 0.055 + 0.012 * Math.sin(u * Math.PI) - 0.012 * u, { seed: 1, nu: q(9), nv: q(12) }); B.sph([LU, 0, 0], 0.04, M_SINEW, q(10));
      plate(B, sphS([0.03, 0, 0.0], 0.14, 0.1, 1.6, -1.75, 1.75, [1.15, 1.15, 1]), [[-1, -1], [0, -0.85], [1, -1], [1, 0.5], [0.4, 1], [-0.4, 1], [-1, 0.5]], 70, 0.03, 0.045, [0.05, -0.25]);
      plate(B, sphS([0.11, 0, -0.01], 0.12, 0.7, 1.55, -1.4, 1.4, [1.05, 1.1, 1]), [[-1, -1], [1, -1], [0.9, 1], [-0.9, 1]], 71, 0.025, 0.03, [0, 0]);
      plate(B, cylS(0.2, 0.46, -0.9, 0.9, 0.066, 0.06), [[-1, -1], [1, -1], [0.8, 1], [-0.8, 1]], 72, 0.016, 0.02, [0, 0]);
      fin('uarm', B); }
    { const B = nb(); muscle(B, LF, u => 0.048 + 0.008 * Math.sin(u * Math.PI * 0.8) - 0.016 * u, { seed: 2, nu: q(9), nv: q(12) }); B.sph([LF, 0, 0], 0.034, M_SINEW, q(10));
      plate(B, cylS(0.05, 0.38, -1.3, 1.25, 0.058, 0.052), [[-1, -1], [1, -1], [1, 1], [-1, 0.8]], 80, 0.02, 0.025, [0.1, 0]);
      plate(B, cylS(0.32, 0.64, -1.2, 1.15, 0.05, 0.042), [[-1, -1], [1, -0.8], [0.9, 1], [-0.9, 1]], 81, 0.018, 0.022, [0, 0]);
      B.crystal([0.14, 0, 0.07], [0.04, 0, 0.19], 0.022, M_GLASS, { n: 5, belly: 0.3, seed: 83, thin: 0.5 }); B.crystal([0.34, 0, 0.065], [0.26, 0, 0.16], 0.017, M_GLASS, { n: 5, belly: 0.3, seed: 84, thin: 0.5 });
      fin('farm', B); }
    /* the hand (frame: x out of the wrist, z its back, y across): a narrow palm under a glass knuckle plate; the fingers
       are their own parts (two segments, the second ending in a long claw); the thumb by side (it sits at -s y) */
    { const B = nb(); B.box([0.055, 0, 0], [0.058, 0.045, 0.016], 0.012, M_SINEW); B.sph([0, 0, 0], 0.03, M_SINEW, q(8));
      plate(B, flatS([0.06, 0, 0.016], [0, 0.048, 0], [0.05, 0, 0], [0, 0, 1]), [[-1, -1], [1, -1], [1, 1], [-1, 1]], 90, 0.008, 0.01, [0, 0.2], 0.1); fin('palm', B); }
    { const B = nb(); B.tube([0, 0, 0], [0.11, 0, 0], 0.014, 0.012, M_SINEW, { seg: q(8), cap0: 'round', cap1: 'round' }); fin('fp', B); }
    { const B = nb(); B.tube([0, 0, 0], [0.085, 0, 0], 0.012, 0.01, M_SINEW, { seg: q(8), cap0: 'round', cap1: false });
      horn(B, bez3([0.08, 0, 0], [0.12, 0, 0], [0.15, 0, -0.012], [0.165, 0, -0.035]), u => 0.011 * Math.pow(1 - u, 0.8) + 0.001, M_HORN, { nu: q(8), k: 4, seed: 91, up: [0, 0, 1] }); fin('fd', B); }
    for (const s of [-1, 1]) { const B = nb(), b = [0.025, -s * 0.04, -0.008], m = [0.075, -s * 0.085, -0.025]; B.tube(b, m, 0.014, 0.012, M_SINEW, { seg: q(8) });
      horn(B, bez3(m, vadd(m, [0.04, -s * 0.02, -0.005]), vadd(m, [0.07, -s * 0.02, -0.02]), vadd(m, [0.08, -s * 0.012, -0.045])), u => 0.011 * Math.pow(1 - u, 0.8) + 0.001, M_HORN, { nu: q(8), k: 4, seed: 92 + s }); fin(s < 0 ? 'thumbL' : 'thumbR', B); }
    /* ---- the legs (digitigrade): thigh and shin of sinew under glass, a long metatarsus, three clawed toes and a spur ---- */
    { const B = nb(); B.sph([0, 0, 0], 0.075, M_SINEW, q(12)); muscle(B, LT, u => 0.075 - 0.025 * u + 0.012 * Math.sin(u * Math.PI), { seed: 3, nu: q(9), nv: q(12) });
      plate(B, cylS(0.06, 0.42, -1.2, 1.2, 0.082, 0.072), [[-1, -1], [1, -1], [0.9, 1], [-0.8, 0.9]], 100, 0.024, 0.03, [0, -0.1]);
      plate(B, cylS(0.36, 0.56, -0.9, 0.9, 0.066, 0.058), [[-1, -1], [1, -1], [0.7, 1], [-0.7, 1]], 101, 0.018, 0.02, [0, 0]); fin('thigh', B); }
    { const B = nb(); B.sph([0, 0, 0], 0.046, M_SINEW, q(10)); muscle(B, LS, u => 0.05 - 0.018 * u + 0.008 * Math.sin(u * Math.PI * 0.7), { seed: 4, nu: q(9), nv: q(12) }); B.sph([LS, 0, 0], 0.034, M_SINEW, q(8));
      plate(B, sphS([0.0, 0, 0.01], 0.07, 0.0, 1.35, -1.6, 1.6), [[-1, -1], [1, -1], [0.8, 1], [-0.8, 1]], 110, 0.018, 0.025, [0, -0.2]);   // (the knee cap)
      plate(B, cylS(0.12, 0.55, -1.15, 1.15, 0.056, 0.044), [[-1, -1], [1, -1], [0.85, 1], [-0.85, 1]], 111, 0.018, 0.022, [0, 0]);
      B.crystal([0.03, 0, 0.06], [-0.05, 0, 0.17], 0.02, M_GLASS, { n: 5, belly: 0.3, seed: 112, thin: 0.5 }); fin('shin', B); }
    { const B = nb(); B.tube([0, 0, 0], [LM, 0, 0], 0.034, 0.026, M_SINEW, { seg: q(10), cap0: 'round', cap1: 'round' });
      plate(B, cylS(0.04, 0.3, -1.0, 1.0, 0.036, 0.03), [[-1, -1], [1, -1], [0.8, 1], [-0.8, 1]], 120, 0.012, 0.014, [0, 0], 0.1);
      for (const y of [-0.032, 0, 0.032]) { const b = [LM, y, 0.005], m = vadd(b, [0.03, y * 0.5, 0.1]); B.tube(b, m, 0.017, 0.014, M_SINEW, { seg: q(7) });
        horn(B, bez3(m, vadd(m, [0.01, y * 0.2, 0.05]), vadd(m, [0.04, y * 0.2, 0.08]), vadd(m, [0.085, y * 0.25, 0.075])), u => 0.014 * Math.pow(1 - u, 0.8) + 0.001, M_HORN, { nu: q(8), k: 4, seed: 121 + y * 50 }); }
      horn(B, bez3([0.06, 0, -0.025], [0.06, 0, -0.06], [0.04, 0, -0.09], [0.0, 0, -0.11]), u => 0.012 * Math.pow(1 - u, 0.8) + 0.001, M_HORN, { nu: q(7), k: 4, seed: 125 });   // (the spur behind the hock)
      fin('meta', B); }
    /* ---- the wing's bones (frame: x along the bone, z its leading face): the humerus, the forearm with the wrist's
       knuckle, a thumb claw and a glass spur; the four finger bones ---- */
    { const B = nb(); B.sph([0, 0, 0], 0.05, M_WBONE, q(10)); B.tube([0, 0, 0], [WHU, 0, 0], 0.042, 0.03, M_WBONE, { seg: q(10), cap0: false, cap1: false }); B.sph([WHU, 0, 0], 0.044, M_WBONE, q(10));
      plate(B, cylS(0.06, 0.5, -1.2, 1.2, 0.046, 0.04), [[-1, -1], [1, -1], [0.8, 1], [-0.8, 1]], 130, 0.016, 0.02, [0, 0]); fin('wh', B); }
    { const B = nb(); B.tube([0, 0, 0], [WFA, 0, 0], 0.032, 0.024, M_WBONE, { seg: q(10), cap0: false, cap1: false }); B.sph([WFA, 0, 0], 0.042, M_WBONE, q(10));
      const tb = [WFA, 0, 0.02], tm = vadd(tb, [0.04, 0, 0.09]); B.tube(tb, tm, 0.02, 0.016, M_WBONE, { seg: q(7) });
      horn(B, bez3(tm, vadd(tm, [0.02, 0, 0.06]), vadd(tm, [0.06, 0, 0.09]), vadd(tm, [0.11, 0, 0.08])), u => 0.017 * Math.pow(1 - u, 0.8) + 0.001, M_HORN, { nu: q(8), k: 4, seed: 131 });
      B.crystal([WFA - 0.03, 0, -0.02], [WFA - 0.17, 0, -0.1], 0.022, M_GLASS, { n: 5, belly: 0.3, seed: 132, thin: 0.5 });
      plate(B, cylS(0.1, 0.62, -1.0, 1.0, 0.036, 0.03), [[-1, -1], [1, -1], [0.8, 1], [-0.8, 1]], 133, 0.012, 0.016, [0, 0]); fin('wf', B); }
    WFL.forEach((L, i) => { const B = nb(); B.sph([0, 0, 0], 0.03, M_WBONE, q(8)); B.tube([0, 0, 0], [L, 0, 0], 0.022 - i * 0.002, 0.006, M_WBONE, { seg: q(7), cap0: false, cap1: 'round' }); fin('wd' + i, B); });
    /* ---- the tail's glass: small plates along its back, the barbed blade at its tip (frame: x along the tail) ---- */
    { const B = nb(); plate(B, flatS([0, 0, 0.0], [0.07, 0, 0], [0, 0.04, 0], [0, 0, 1]), [[-1, -1], [1, -0.6], [1, 0.6], [-1, 1]], 140, 0.014, 0.02, [0.2, 0], 0.12); fin('tplate', B); }
    { const B = nb(); B.sph([0, 0, 0], 0.03, M_SINEW, q(8));
      B.crystal([0.0, 0, 0], [0.36, 0, 0], 0.07, M_GLASS, { n: 6, belly: 0.3, base: 0.5, seed: 150, thin: 0.32, up: [0, 0, 1] });
      for (const s of [-1, 1]) B.crystal([0.08, s * 0.03, 0], [-0.06, s * 0.16, 0.0], 0.035, M_GLASS, { n: 5, belly: 0.3, base: 0.6, seed: 151 + s, thin: 0.4, up: [0, 0, 1] });
      fin('barb', B); }
    /* ---- the moving meshes, made once for their topology (rewritten in place each frame) ---- */
    const sk = skel(POSES.hover, 0, POSES.hover);
    for (const s of [-1, 1]) out[s < 0 ? 'memL' : 'memR'] = membrane(sk, s, null);
    out.tail = tailMesh(sk, null);
    return out;
  }

  /* ================= the poses =================
     lean (rad, a forward bow), nod (the head down +), look (the head's yaw), hand ([x, y, z] where the right hand reaches, torso
     frame; the left mirrored), hdir (its fingers' way), hback (the back of the hand's way), curl (the fingers 0 open .. 1
     clawed), fan (their spread), leg ([hip, knee, hock, splay] angles), wFold (0 spread .. 1 folded), wEl (the wings'
     elevation, rad), wSw (swept back), wFan (the fingers fanned), wBeat (the hover's wingbeat, rad), tailC (its curl), tailA
     (its sway), glow (the seams' light), chg (the charge: every seam flares), sph (the sphere's light from above) */
  const POSES = {
    fall:    { lean: 0.12, nod: 0.3, look: 0, hand: [0.2, 0.3, 0.12], hdir: [0.3, 0.1, -1], hback: [0, 1, 0], curl: 0.75, fan: 0.2, leg: [0.12, 0.35, 0.3, 0.05], wFold: 1, wEl: 0.15, wSw: 0.3, wFan: 0, wBeat: 0, tailC: -0.6, tailA: 0.4, glow: 0.4, chg: 0, sph: 0.6 },
    open:    { lean: 0.05, nod: 0.05, look: 0, hand: [0.05, 0.85, 0.7], hdir: [0.2, 0.7, 0.2], hback: [0, 0.2, 1], curl: 0.45, fan: 0.8, leg: [0.4, 0.95, 0.75, 0.12], wFold: 0, wEl: 1.05, wSw: 0.42, wFan: 0.75, wBeat: 0, tailC: -0.2, tailA: 0.6, glow: 0.5, chg: 0, sph: 0.5 },
    beat:    { lean: 0.2, nod: 0.25, look: 0, hand: [0.15, 0.9, 0.2], hdir: [0.3, 0.6, -0.5], hback: [0, 0.3, 1], curl: 0.5, fan: 0.9, leg: [0.62, 1.25, 0.95, 0.16], wFold: 0, wEl: -0.85, wSw: 0.08, wFan: 1, wBeat: 0, tailC: 0.5, tailA: 0.5, glow: 0.55, chg: 0, sph: 0.4 },
    hover:   { lean: 0.1, nod: 0.18, look: 0, hand: [0.42, 0.5, 0.16], hdir: [0.75, 0.25, -0.45], hback: [0, 1, 0.4], curl: 0.6, fan: 0.6, leg: [0.5, 1.25, 1.0, 0.12], wFold: 0, wEl: 0.2, wSw: 0.32, wFan: 0.8, wBeat: 0.5, tailC: 0.35, tailA: 1, glow: 0.5, chg: 0, sph: 0.5 },
    raise:   { lean: -0.12, nod: -0.5, look: 0, hand: [0.14, 0.3, 2.02], hdir: [0.1, 0.55, 0.6], hback: [0, 0, -1], curl: 0.3, fan: 1, leg: [0.32, 1.05, 0.9, 0.16], wFold: 0, wEl: 0.42, wSw: 0.28, wFan: 0.9, wBeat: 0.38, tailC: 0.6, tailA: 1.1, glow: 0.8, chg: 0.6, sph: 1.0 },
    brace:   { lean: -0.32, nod: -0.55, look: 0, hand: [-0.05, 0.34, 2.12], hdir: [-0.2, 0.4, 0.85], hback: [0.5, 0, -1], curl: 0.45, fan: 1, leg: [0.18, 0.85, 0.75, 0.2], wFold: 0, wEl: 0.85, wSw: 0.15, wFan: 1, wBeat: 0.1, tailC: 0.9, tailA: 0.6, glow: 1.0, chg: 1.0, sph: 1.3 },
    throw:   { lean: 0.58, nod: 0.45, look: 0, hand: [0.85, 0.26, 0.05], hdir: [0.8, 0.1, -0.6], hback: [-0.5, 0, 1], curl: 0.35, fan: 0.9, leg: [0.78, 1.45, 1.05, 0.14], wFold: 0, wEl: -0.65, wSw: -0.05, wFan: 1, wBeat: 0, tailC: -0.3, tailA: 0.4, glow: 0.9, chg: 0.6, sph: 0.6 },
    gather:  { lean: -0.18, nod: -0.35, look: 0, hand: [0.22, 0.78, 1.25], hdir: [0.2, 0.8, 0.45], hback: [0, 0.3, -1], curl: 0.15, fan: 1, leg: [0.22, 0.75, 0.65, 0.22], wFold: 0, wEl: 0.95, wSw: 0.2, wFan: 1, wBeat: 0.12, tailC: 0.8, tailA: 0.8, glow: 1.3, chg: 1.3, sph: 0.4 },
  };
  const PKEYS = Object.keys(POSES.hover);
  function blend(a, b, u) { const o = {}; for (const k of PKEYS) { const A = a[k], B = b[k]; o[k] = Array.isArray(A) ? A.map((v, i) => lerp(v, B[i], u)) : lerp(A, B, u); } return o; }
  const pose = name => Object.assign({}, POSES[name] || POSES.hover);

  /* ================= the skeleton: every joint and bone frame for a pose at time t (model space) ================= */
  const WRATE = 0.85;   // (the hover's wingbeats a second)
  const FOLD_DIR = { hum: [-0.55, 0.36, 0.76], fa: [-0.28, 0.2, -0.94] };
  const SPREAD = { hum: [0.74, 0.62], fa: [0.95, 0.28], fing: [14, -17, -46, -76] };
  function skel(P, t, PL) {
    PL = PL || P; const S = {};
    const br = Math.sin(t * 1.4), br2 = Math.sin(t * 0.83 + 1.3);
    /* the body: the pelvis tilts a little with the lean, the torso bows */
    const Rp = mm(rotZ(0.03 * br2), rotY(P.lean * 0.45 + 0.03 * br)), Rt = mm(rotZ(0.04 * br2), mm(rotX(0.02 * Math.sin(t * 0.7)), rotY(P.lean + 0.025 * br)));
    const ts = 1 + 0.012 * br, toT = p => mv(Rt, vmul(p, ts)), toP = p => mv(Rp, p);
    S.Rp = Rp; S.Rt = Rt; S.toT = toT; S.toP = toP;
    /* the head */
    const Hc = toT(HEADC), Rh = mm(Rt, mm(rotZ(P.look + 0.05 * Math.sin(t * 0.55)), rotY(P.nod - P.lean * 0.5 + 0.03 * br2)));
    S.head = { R: Rh, o: Hc }; S.neck = toT(NECK);
    /* the arms: reach (two bones) toward the hand's target, the elbows out and back; the hand's frame from its fingers' way
       and its back; the fingers curl at both joints (rotY bends toward the palm) */
    S.arms = {};
    for (const s of [-1, 1]) { const sh = toT(SH(s)), h = P.hand, tgt = toT([h[0] + 0.03 * Math.sin(t * 1.1 + s), s * h[1], h[2] + 0.025 * br]);
      const J = ik2(sh, tgt, LU, LF, mv(Rt, [-0.75, s * 0.45, -0.6])), E = J.E, W = J.W;
      const ud = vsub(E, sh), fd = vsub(W, E), out = mv(Rt, [0, s, 0]);
      const hd = vnrm(mv(Rt, [P.hdir[0], s * P.hdir[1], P.hdir[2]])), hb = mv(Rt, [P.hback[0], s * P.hback[1], P.hback[2]]);
      const Rhand = frameXZ(vnrm(vlerp(vnrm(fd), hd, 0.85)), hb);
      const fingers = [], curl = cl(P.curl + 0.08 * Math.sin(t * 1.9 + s)), fan = P.fan;
      [-0.042, -0.014, 0.014, 0.042].forEach((y, i) => { const yy = y, sp = (i - 1.5) * 0.14 * fan, Rf = mm(Rhand, mm(rotZ(sp), rotY(curl * (0.65 + 0.05 * i)))), b = vadd(W, mv(Rhand, [0.112, yy, 0.0])), Rd = mm(Rf, rotY(curl * 0.95)), m = vadd(b, mv(Rf, [0.11, 0, 0]));
        fingers.push({ b, Rf, m, Rd, tip: vadd(m, mv(Rd, [0.16, 0, -0.03])) }); });
      S.arms[s] = { sh, E, W, Ru: frameXZ(ud, vadd(out, mv(Rt, [0, 0, 0.35]))), Rf: frameXZ(fd, vadd(out, mv(Rt, [-0.3, 0, 0.3]))), Rhand, fingers, palm: vadd(W, mv(Rhand, [0.06, 0, -0.03])) }; }
    /* the legs: angles in the pelvis's plane, a little splay */
    S.legs = {};
    for (const s of [-1, 1]) { const [a1, a2, a3, spl] = P.leg, sw = 0.05 * Math.sin(t * 1.3 + s * 1.7), A1 = a1 + sw, A2 = A1 - a2 - 0.04 * Math.sin(t * 1.3 + s), A3 = A2 + a3;
      const hp = toP(HIP(s)), d1 = toP(vnrm([Math.sin(A1), s * spl, -Math.cos(A1)])), d2 = toP(vnrm([Math.sin(A2), s * spl * 0.4, -Math.cos(A2)])), d3 = toP(vnrm([Math.sin(A3), s * spl * 0.2, -Math.cos(A3)]));
      const K = vadd(hp, vmul(d1, LT)), An = vadd(K, vmul(d2, LS)), Ft = vadd(An, vmul(d3, LM)), fw = toP([1, 0, 0]);
      S.legs[s] = { hp, K, An, Ft, R1: frameXZ(d1, fw), R2: frameXZ(d2, fw), R3: frameXZ(d3, fw) }; }
    /* the wings: spread directions in the wing's plane (out, up) raised by the elevation about the body's forward axis,
       folded directions down the back; the hand lags the arm (its elevation from the lagging pose); the upstroke half
       folds them */
    S.wings = {};
    const ph = TAU * WRATE * t, flap = P.wBeat * Math.sin(ph), flapL = PL.wBeat * Math.sin(ph - TAU * WRATE * 0.1);
    const el = P.wEl + flap, elH = PL.wEl + flapL, bend = cl((elH - el) * 1.1 + 0.5) * 2 - 1;
    const fold = cl(P.wFold + 0.3 * P.wBeat * Math.max(0, Math.cos(ph)) * (1 - P.wFold));
    for (const s of [-1, 1]) { const sw = P.wSw, O = [-Math.sin(sw), s * Math.cos(sw), 0], U = [0, 0, 1], F = [1, 0, 0];
      const pl = (a, b) => vadd(vmul(O, a), vmul(U, b)), fl = (v, e) => rotV(v, F, s * e);
      const hum = vnrm(vlerp(fl(vnrm(pl(SPREAD.hum[0], SPREAD.hum[1])), el), [FOLD_DIR.hum[0], s * FOLD_DIR.hum[1], FOLD_DIR.hum[2]], fold));
      const fa = vnrm(vlerp(fl(vnrm(pl(SPREAD.fa[0], SPREAD.fa[1])), el + 0.45 * bend), [FOLD_DIR.fa[0], s * FOLD_DIR.fa[1], FOLD_DIR.fa[2]], fold));
      const R0 = WROOT(s), E = vadd(R0, vmul(hum, WHU)), W = vadd(E, vmul(fa, WFA)), fing = [];
      SPREAD.fing.forEach((deg, i) => { const ang = lerp(-38, deg, P.wFan) * Math.PI / 180 + 0.08 * Math.sin(t * 1.2 + i), dsp = fl(vnrm(pl(Math.cos(ang), Math.sin(ang))), el + 0.85 * bend), dfo = [-0.3 - 0.05 * i, s * (0.12 + 0.04 * i), -0.95];
        fing.push(vnrm(vlerp(dsp, dfo, fold))); });
      // (to model space through the torso)
      const r0 = toT(R0), e0 = toT(E), w0 = toT(W), tips = fing.map((d, i) => toT(vadd(W, vmul(d, WFL[i])))), lead = mv(Rt, F);
      S.wings[s] = { r0, E: e0, W: w0, tips, dirs: fing.map(d => mv(Rt, d)), Rh: frameXZ(vsub(e0, r0), lead), Rf: frameXZ(vsub(w0, e0), lead), cup: 0.06 + 0.1 * Math.max(0, -(el - elH) * 2), fold, lead, back: mv(Rt, [-1, 0, 0]) }; }
    /* the tail: a chain from the pelvis, each link turned a little more: a slow wave travels down it (pitch and yaw), the
       end curls; its frames carried along (parallel transport) */
    { const N = TAILN, Lk = TAILL / N, pts = [toP(TAIL0)], c0 = P.tailC, A = P.tailA; let d = toP(vnrm([-0.55, 0, -0.84])), up = toP([0, 0, 1]);
      for (let i = 1; i <= N; i++) { const u = i / N, kp = 0.085 * c0 * Math.pow(u, 1.4) * 2 + 0.06 * A * Math.sin(t * 1.9 - u * 4.2) * (0.4 + u), ky = 0.07 * A * Math.sin(t * 1.3 - u * 3.4 + 0.8) * (0.3 + u);
        const side = vnrm(vcross(d, up)); d = vnrm(rotV(rotV(d, side, kp), up, ky)); up = vnrm(vsub(up, vmul(d, vdot(up, d)))); pts.push(vadd(pts[i - 1], vmul(d, Lk))); }
      S.tail = pts; S.tailDir = d; S.tailUp = up; }
    S.chest = toT([0.12, 0, 0.66]); S.core = toT([0.16, 0, 0.62]); S.pelvis = [0, 0, 0];
    return S;
  }

  /* ================= the moving meshes ================= */
  /* a wing's membrane: panel 0 from the arm (root, elbow, wrist, last finger) down to the flank, its free edge scalloped;
     panels 1..3 between the fingers, each free edge scalloped and torn. vA.y = across (v), vA.z = 1 - along (u); the panel
     in the material id's tenths. M given: its positions and normals rewritten */
  const RAG = (v, sd) => 0.05 * fbm(v * 6.3 + sd, sd * 1.7, 0.5) + 0.1 * Math.pow(Math.max(0, Math.sin(v * Math.PI * 3 + sd * 2.1)), 10);
  function membrane(S, s, M) {
    const W = S.wings[s], DQ = lowFx() ? 0.6 : 1, B = GLM.builder(DQ), nu = Math.max(4, Math.round(10 * DQ)), nv = Math.max(3, Math.round(6 * DQ));
    const hip = S.toP([-0.03, s * 0.16, -0.14]), arm = [W.r0, W.E, W.W, W.tips[3]], AL = [0]; for (let i = 1; i < 4; i++) AL.push(AL[i - 1] + vlen(vsub(arm[i], arm[i - 1])));
    const armAt = u => { const d = u * AL[3]; let i = 0; while (i < 2 && AL[i + 1] < d) i++; return vlerp(arm[i], arm[i + 1], (d - AL[i]) / Math.max(1e-6, AL[i + 1] - AL[i])); };
    const cup = vmul(W.back, W.cup);
    B.surf((u, v) => { const a = armAt(u), e = vlerp(hip, W.tips[3], u), ee = vlerp(e, a, 0.2 * Math.sin(Math.PI * u) + RAG(u, 3 + s) * 0.6 * u); return vadd(vlerp(a, ee, v), vmul(cup, Math.sin(Math.PI * v) * Math.sin(Math.PI * Math.min(1, u * 1.3)))); }, nu, nv, () => M_MEMB, { e: (u, v) => v, a: u => 1 - u });
    for (let k = 0; k < 3; k++) { const ta = W.tips[k], tb = W.tips[k + 1];
      B.surf((u, v) => { const m = 1 - 0.22 * Math.sin(Math.PI * v) - RAG(v, k * 5 + s); const uu = u * m, a = vlerp(W.W, ta, uu), b = vlerp(W.W, tb, uu); return vadd(vlerp(a, b, v), vmul(cup, Math.sin(Math.PI * v) * uu * 0.8)); }, Math.max(3, nu - 2), nv, () => M_MEMB + 0.1 * (k + 1), { e: (u, v) => v, a: u => 1 - u }); }
    const D = B.done(); if (!M) return D; if (D.pos.length !== M.pos.length) { Object.assign(M, D); M.gl = null; return M; }   /* (Fewer effects switched: a new topology, uploaded afresh) */
    M.pos.set(D.pos); M.nrm.set(D.nrm); if (typeof GLM !== 'undefined') GLM.touchGeo(M); return M; }
  /* the tail: a tube along the chain (parallel-transported frames), thinning to the barb */
  function tailMesh(S, M) {
    const DQ = lowFx() ? 0.6 : 1, B = GLM.builder(DQ), P = S.tail, N = P.length - 1, nv = Math.max(5, Math.round(9 * DQ)), fr = []; let up = S.toP([0, 0, 1]);
    for (let i = 0; i <= N; i++) { const d = vnrm(vsub(P[Math.min(N, i + 1)], P[Math.max(0, i - 1)])); up = vnrm(vsub(up, vmul(d, vdot(up, d)))); fr.push([d, up, vcross(d, up)]); }
    B.surf((u, v) => { const i = Math.round(u * N), F = fr[i], a = v * TAU, r = 0.06 * Math.pow(1 - u, 0.85) + 0.012 + 0.006 * Math.sin(u * 40) * (1 - u); return vadd(P[i], vadd(vmul(F[1], Math.cos(a) * r), vmul(F[2], Math.sin(a) * r))); }, N, nv, () => M_SINEW, { flip: true });
    const D = B.done(); if (!M) return D; if (D.pos.length !== M.pos.length) { Object.assign(M, D); M.gl = null; return M; }   /* (Fewer effects switched: a new topology, uploaded afresh) */
    M.pos.set(D.pos); M.nrm.set(D.nrm); if (typeof GLM !== 'undefined') GLM.touchGeo(M); return M; }

  /* ================= the rig: every part posed (model space) ================= */
  function rig(P, t, o) {
    o = o || {}; const S = skel(P, t, o.lagP), inst = [], ev = o.ev || 1, glow = P.glow, chg = P.chg, sph = P.sph, fx = o.dis || 0;
    const I = (part, R, org, ex) => { const it = { part, R, o: org, s: 1, al: 1, glow, glow2: chg, spill: sph, fx, kind: 0, seed: 1 }; if (ex) Object.assign(it, ex); inst.push(it); return it; };
    I('pelvis', S.Rp, [0, 0, 0], { seed: 1.1 }); I('torso', S.Rt, [0, 0, 0], { kind: 1, seed: 1.3 });
    I(ev >= 7 ? 'head7' : 'head', S.head.R, S.head.o, { seed: 1.7 });
    for (const s of [-1, 1]) { const A = S.arms[s];
      I('uarm', A.Ru, A.sh, { seed: 2 + s * 0.1 }); I('farm', A.Rf, A.E, { seed: 2.3 + s * 0.1 }); I('palm', A.Rhand, A.W, { seed: 2.6, grp: 'hand' + s });
      I(s < 0 ? 'thumbL' : 'thumbR', A.Rhand, A.W, { seed: 2.7, grp: 'hand' + s });
      for (const f of A.fingers) { I('fp', f.Rf, f.b, { seed: 2.8, grp: 'hand' + s }); I('fd', f.Rd, f.m, { seed: 2.9, grp: 'hand' + s }); }
      const L = S.legs[s]; I('thigh', L.R1, L.hp, { seed: 3 + s * 0.1 }); I('shin', L.R2, L.K, { seed: 3.3 }); I('meta', L.R3, L.An, { seed: 3.6 });
      const Wg = S.wings[s]; I('wh', Wg.Rh, Wg.r0, { seed: 4 }); I('wf', Wg.Rf, Wg.E, { seed: 4.2 });
      Wg.dirs.forEach((d, i) => I('wd' + i, frameXZ(d, Wg.lead), Wg.W, { seed: 4.4, grp: 'wdig' }));
      I(s < 0 ? 'memL' : 'memR', I3(), [0, 0, 0], { al: 0.99, outline: false, seed: 5 + s, dyn: 1, cen: vlerp(Wg.W, vlerp(Wg.r0, Wg.tips[2], 0.5), 0.5) }); }
    I('tail', I3(), [0, 0, 0], { seed: 6, dyn: 1, cen: S.tail[12], grp: 'tailx' });
    for (let k = 3; k < TAILN - 2; k += 3) { const i = k, d = vnrm(vsub(S.tail[i + 1], S.tail[i - 1])), up = vnrm(vsub(S.toP([0, 0, 1]), vmul(d, vdot(S.toP([0, 0, 1]), d)))), r = 0.06 * Math.pow(1 - i / TAILN, 0.85) + 0.012; I('tplate', frameXZ(d, up), vadd(S.tail[i], vmul(up, r * 0.75)), { s: 0.55 + 0.6 * (1 - i / TAILN), seed: 6.2, grp: 'tailx' }); }
    I('barb', frameXZ(S.tailDir, S.tailUp), S.tail[TAILN], { seed: 6.2, grp: 'tailx' });
    /* anchors (model space) */
    const A = { head: S.head.o, chest: S.chest, core: S.core, pelvis: [0, 0, 0], tailTip: S.tail[TAILN], top: vadd(S.head.o, mv(S.head.R, [0, 0, 0.15])) };
    for (const s of [-1, 1]) { const sn = s < 0 ? 'L' : 'R', a = S.arms[s], w = S.wings[s], l = S.legs[s]; A['hand' + sn] = a.palm; A['wrist' + sn] = a.W; A['elbow' + sn] = a.E; A['sh' + sn] = a.sh; A['claws' + sn] = a.fingers.map(f => f.tip);
      A['wing' + sn] = [w.r0, w.E, w.W].concat(w.tips); A['foot' + sn] = l.Ft; A['knee' + sn] = l.K; }
    // every point the figure reaches (for its picture's box and the ash it sheds)
    const pts = [A.top, A.head, A.chest, A.pelvis].concat(S.tail.filter((p, i) => i % 3 === 0), [S.tail[TAILN]]);
    for (const s of [-1, 1]) { const a = S.arms[s], w = S.wings[s], l = S.legs[s]; pts.push(a.sh, a.E, a.W, ...a.fingers.map(f => f.tip), w.r0, w.E, w.W, ...w.tips, l.hp, l.K, l.An, l.Ft, vadd(l.Ft, mv(l.R3, [0.06, 0, 0.16]))); }
    return { inst, A, S, pts };
  }

  /* ================= drawing ================= */
  const PD = [0, CE, SE], PX = [1, 0, 0], PY = [0, SE, -CE];
  const LW = vnrm([-0.5, 0.55, 0.7]), SBW = vnrm([-0.2, 0.3, 0.95]), RIMW = vnrm([0.35, -0.85, 0.45]), UPW = [0, 0, 1];
  /* the view of one draw: model -> world (heading a about z) -> screen; (x, y) its floor point, z the pelvis's height (tiles) */
  function mkView(x, y, z, a, o) {
    const T = o.T, sc = o.scale || 1, k = T * sc, Rh = rotZ(a), X0 = o.sx(x), Y0 = o.sy(y) - z * CE * T;
    const toS = p => { const w = mv(Rh, p); return [X0 + w[0] * k, Y0 + (w[1] * SE - w[2] * CE) * k]; };
    const toW = p => { const w = mv(Rh, p); return { x: x + w[0] * sc, y: y + w[1] * sc, z: z + w[2] * sc }; };
    const depth = p => vdot(mv(Rh, p), PD);
    return { T, sc, k, Rh, toS, toW, depth, X0, Y0, x, y, z, a };
  }
  let NOGL = false, GLFAIL = 0, GLRETRY = 0, GLLAST = 0, GLMS = 0, GLN = 0, GLBOX = null; const GLI = [], GLJ = [], OCC = new Float32Array(48);
  const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
  const flag = () => { try { return typeof window !== 'undefined' ? window.__FE_GL : null; } catch (e) { return null; } };
  const glOn = () => { const f = flag(); if (f === 0 || NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && f !== 1) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Final Eclipse demon: meshes', e); return false; } } return true; };
  const GLCAP = 1500, RIMC = [0.75, 0.42, 1.5], AMBC = [1, 1, 1], OUTC = [0.02, 0.008, 0.035];
  /* (fewer draw calls) small rigid parts that move together are merged into one mesh, posed on the CPU each frame: each
     hand with its fingers, the wings' finger bones, the tail with its plates and barb. A group's topology is made from its
     first frame's parts (always the same parts in the same order) */
  function makeGroup(list) { let nv = 0, ni = 0; for (const it of list) { const m = MESH[it.part]; nv += m.nv; ni += m.idx.length; }
    const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), att = new Float32Array(nv * 3), idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni); let v0 = 0, i0 = 0;
    for (const it of list) { const m = MESH[it.part]; att.set(m.att, v0 * 3); for (let i = 0; i < m.idx.length; i++) idx[i0 + i] = m.idx[i] + v0; v0 += m.nv; i0 += m.idx.length; }
    return { pos, nrm, att, idx, nv, ntri: ni / 3, gl: null, grp: true }; }
  function fillGroup(G, list) { let o = 0; const P = G.pos, N = G.nrm;
    for (const it of list) { const m = MESH[it.part], R = it.R, s = it.s || 1, T = it.o, mp = m.pos, mn = m.nrm;
      for (let i = 0; i < m.nv * 3; i += 3, o += 3) { const x = mp[i] * s, y = mp[i + 1] * s, z = mp[i + 2] * s, a = mn[i], b = mn[i + 1], c = mn[i + 2];
        P[o] = T[0] + R.x[0] * x + R.y[0] * y + R.z[0] * z; P[o + 1] = T[1] + R.x[1] * x + R.y[1] * y + R.z[1] * z; P[o + 2] = T[2] + R.x[2] * x + R.y[2] * y + R.z[2] * z;
        N[o] = R.x[0] * a + R.y[0] * b + R.z[0] * c; N[o + 1] = R.x[1] * a + R.y[1] * b + R.z[1] * c; N[o + 2] = R.x[2] * a + R.y[2] * b + R.z[2] * c; } }
    if (typeof GLM !== 'undefined') GLM.touchGeo(G); }
  function glList(R) { const out = [], groups = {}; for (const it of R.inst) { if (it.grp) (groups[it.grp] = groups[it.grp] || []).push(it); else out.push(it); }
    for (const k in groups) { const L = groups[k], key = 'g:' + k; let G = MESH[key]; if (!G || G.nv !== L.reduce((n, it) => n + MESH[it.part].nv, 0)) G = MESH[key] = makeGroup(L); fillGroup(G, L); const f = L[0];
      out.push({ part: key, R: I3(), o: [0, 0, 0], s: 1, al: 1, glow: f.glow, glow2: f.glow2, spill: f.spill, fx: f.fx, kind: 0, seed: f.seed, cen: L[Math.floor(L.length / 2)].o }); }
    return out; }
  /* one GPU pass: the parts drawn into the box round the figure's points */
  function glPass(c, V, R, al0, o) {
    const k = V.k; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const p of R.pts) { const q = V.toS(p); if (q[0] < bx0) bx0 = q[0]; if (q[0] > bx1) bx1 = q[0]; if (q[1] < by0) by0 = q[1]; if (q[1] > by1) by1 = q[1]; }
    const mg = 0.22 * k; bx0 -= mg; by0 -= mg; bx1 += mg; by1 += mg; if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, f = flag(), soft = GLM.soft && !(typeof window !== 'undefined' && window.__FE_GLHQ), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (o.res || 1); void f;
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0, X0 = V.X0, Y0 = V.Y0;
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (Y0 - by0) / bh], v: PD, lk: mv(V.Rh, LW), ls: SBW, lr: mv(V.Rh, RIMW), up: UPW, low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t: o.t || 0,
      outline: o.outline === 0 ? 0 : Math.max(1, 1.1 * (W / bw)), outlineCol: OUTC };
    S.lk = vnrm([-0.5, 0.55, 0.7]); S.lr = vnrm([0.3, -0.75, 0.6]);   // (the lights stay put in the world as the figure turns)
    if (o.occ && o.occ.length) { let n2 = 0; for (const [p, r] of o.occ) { if (n2 >= 12) break; const w = mv(V.Rh, p); OCC[n2 * 4] = w[0]; OCC[n2 * 4 + 1] = w[1]; OCC[n2 * 4 + 2] = w[2]; OCC[n2 * 4 + 3] = r; n2++; } S.occ = OCC; S.nocc = n2; }
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of glList(R)) { const mesh = MESH[it.part]; if (!mesh) continue; const al = al0 * (it.al == null ? 1 : it.al); if (!(al > 0.004)) continue; const Rw = mm(V.Rh, it.R), s2 = it.s || 1, Tt = mv(V.Rh, it.o);
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2; g.R1[i] = Rw.y[i] * s2; g.R2[i] = Rw.z[i] * s2; g.T[i] = Tt[i]; }
      g.alpha = al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = it.seed || 1; g.fx = it.fx || 0; g.outline = it.outline; g.d = it.cen ? vdot(mv(V.Rh, it.cen), PD) : vdot(Tt, PD); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh);
    GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++; GLBOX = [W, H]; return true;
  }
  /* ---- the 2D picture (no WebGL): the same rig as shaded capsules, plates and membranes, far to near ---- */
  const C_SIN = '#1B1424', C_GL = '#0D0A12', C_GLH = '#3A3050', C_VIO = '#A55CFF', C_MEM = 'rgba(22,12,34,0.82)';
  const FBC = {   // per part: capsules [a, b, r, kind] in its own frame (kind 0 sinew, 1 glass)
    pelvis: [[[0, -0.1, 0], [0, 0.1, 0], 0.13, 0], [[0.06, 0, -0.06], [0.08, 0, -0.18], 0.08, 1]],
    torso: [[[0, 0, 0.05], [0, 0, 0.35], 0.11, 0], [[0.02, 0, 0.45], [0.02, 0, 0.8], 0.2, 0], [[0.02, -0.28, 0.8], [0.02, 0.28, 0.8], 0.12, 1], [[0.08, 0, 0.55], [0.1, 0, 0.78], 0.15, 1], [[0.02, 0, 0.9], [0.05, 0, 1.08], 0.06, 0]],
    head: [[[0, 0, -0.02], [0.05, 0, 0.0], 0.085, 1], [[-0.02, 0.05, 0.07], [-0.33, 0.12, 0.25], 0.018, 1], [[-0.02, -0.05, 0.07], [-0.33, -0.12, 0.25], 0.018, 1]],
    uarm: [[[0, 0, 0], [LU, 0, 0], 0.055, 0], [[0.02, 0, 0.03], [0.18, 0, 0.02], 0.12, 1]], farm: [[[0, 0, 0], [LF, 0, 0], 0.045, 0], [[0.06, 0, 0.03], [0.55, 0, 0.03], 0.045, 1]],
    palm: [[[0, 0, 0], [0.11, 0, 0], 0.04, 0]], fp: [[[0, 0, 0], [0.11, 0, 0], 0.014, 0]], fd: [[[0, 0, 0], [0.16, 0, -0.035], 0.011, 1]], thumbL: [], thumbR: [],
    thigh: [[[0, 0, 0], [LT, 0, 0], 0.07, 0], [[0.06, 0, 0.05], [0.45, 0, 0.05], 0.07, 1]], shin: [[[0, 0, 0], [LS, 0, 0], 0.048, 0], [[0.1, 0, 0.04], [0.55, 0, 0.04], 0.045, 1]], meta: [[[0, 0, 0], [LM, 0, 0], 0.03, 0], [[LM, 0, 0], [LM + 0.08, 0, 0.16], 0.015, 1]],
    wh: [[[0, 0, 0], [WHU, 0, 0], 0.04, 0]], wf: [[[0, 0, 0], [WFA, 0, 0], 0.03, 0]], wd0: [[[0, 0, 0], [WFL[0], 0, 0], 0.016, 0]], wd1: [[[0, 0, 0], [WFL[1], 0, 0], 0.015, 0]], wd2: [[[0, 0, 0], [WFL[2], 0, 0], 0.014, 0]], wd3: [[[0, 0, 0], [WFL[3], 0, 0], 0.013, 0]],
    tplate: [], barb: [[[0, 0, 0], [0.34, 0, 0], 0.045, 1]], head7: null };
  FBC.head7 = FBC.head;
  const FB = [];
  function drawFallback(c, V, R, al0) {
    FB.length = 0; const k = V.k, S = R.S;
    for (const it of R.inst) { const caps = FBC[it.part]; if (!caps || it.dyn) continue; const s2 = it.s || 1;
      for (const [a, b, r, kd] of caps) { const A2 = vadd(it.o, mv(it.R, vmul(a, s2))), B2 = vadd(it.o, mv(it.R, vmul(b, s2))); FB.push({ d: (V.depth(A2) + V.depth(B2)) / 2, A: V.toS(A2), B: V.toS(B2), w: r * s2 * 2 * k, kd }); } }
    // the tail as a chain of capsules thinning
    for (let i = 0; i < TAILN; i++) { const a = S.tail[i], b = S.tail[i + 1]; FB.push({ d: (V.depth(a) + V.depth(b)) / 2, A: V.toS(a), B: V.toS(b), w: (0.06 * Math.pow(1 - i / TAILN, 0.85) + 0.012) * 2 * k, kd: 0 }); }
    // the membranes: filled fans (far first by their own depth)
    for (const s of [-1, 1]) { const W = S.wings[s], hip = S.toP([-0.03, s * 0.16, -0.14]), poly = [W.r0, W.E, W.W, W.tips[0], W.tips[1], W.tips[2], W.tips[3], hip];
      FB.push({ d: V.depth(W.W) - 0.4, mem: poly.map(V.toS), al: 1 }); }
    FB.sort((p, q) => p.d - q.d); c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    for (const f of FB) { c.globalAlpha = al0;
      if (f.mem) { const P = f.mem; c.beginPath(); c.moveTo(P[0][0], P[0][1]); c.lineTo(P[1][0], P[1][1]); c.lineTo(P[2][0], P[2][1]);
          for (let i = 3; i < P.length; i++) { const a = P[i - 1], b = P[i]; if (i === 3) { c.lineTo(b[0], b[1]); continue; } const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, cx = (P[2][0] + mx * 3) / 4, cy = (P[2][1] + my * 3) / 4; c.quadraticCurveTo(cx, cy, b[0], b[1]); }
          c.closePath(); c.fillStyle = C_MEM; c.fill(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(165,92,255,0.18)'; c.lineWidth = Math.max(1, k * 0.03); c.stroke(); c.globalCompositeOperation = 'source-over';
          c.strokeStyle = '#120C1A'; c.lineWidth = Math.max(1.2, k * 0.03); c.beginPath(); for (let i = 3; i < 7; i++) { c.moveTo(P[2][0], P[2][1]); c.lineTo(P[i][0], P[i][1]); } c.moveTo(P[0][0], P[0][1]); c.lineTo(P[1][0], P[1][1]); c.lineTo(P[2][0], P[2][1]); c.stroke(); continue; }
      c.strokeStyle = '#050308'; c.lineWidth = f.w + 2; c.beginPath(); c.moveTo(f.A[0], f.A[1]); c.lineTo(f.B[0] + 0.01, f.B[1]); c.stroke();
      c.strokeStyle = f.kd ? C_GL : C_SIN; c.lineWidth = f.w; c.stroke();
      c.strokeStyle = f.kd ? 'rgba(160,140,200,0.32)' : 'rgba(120,80,170,0.22)'; c.lineWidth = Math.max(1, f.w * 0.25); c.beginPath(); c.moveTo(f.A[0] - f.w * 0.15, f.A[1] - f.w * 0.22); c.lineTo(f.B[0] - f.w * 0.15 + 0.01, f.B[1] - f.w * 0.22); c.stroke();
      if (f.kd) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(165,92,255,0.22)'; c.lineWidth = Math.max(1, f.w * 0.12); c.beginPath(); c.moveTo(f.A[0], f.A[1] + f.w * 0.3); c.lineTo(f.B[0] + 0.01, f.B[1] + f.w * 0.3); c.stroke(); c.globalCompositeOperation = 'source-over'; } }
    // the eyes
    const H = S.head; for (const s of [-1, 1]) { const p = V.toS(vadd(H.o, mv(H.R, [0.09, s * 0.032, 0.012]))); c.globalCompositeOperation = 'lighter'; c.globalAlpha = al0 * 0.9; if (typeof blitSized === 'function' && typeof glowSprite === 'function') blitSized(c, glowSprite(C_VIO), p[0] - k * 0.06, p[1] - k * 0.06, k * 0.12, k * 0.12); }
    c.restore();
  }
  /* the occluders: spheres inside the big parts (each part darkened where the others overhang it) */
  function occOf(R) { const A = R.A; return [[vlerp(A.pelvis, A.chest, 0.3), 0.14], [A.chest, 0.22], [A.head, 0.09], [A.shL, 0.08], [A.shR, 0.08], [vlerp(A.elbowL, A.wristL, 0.5), 0.05], [vlerp(A.elbowR, A.wristR, 0.5), 0.05], [A.kneeL, 0.07], [A.kneeR, 0.07]]; }
  /* draw(c, x, y, z, a, P, o): the figure with its pelvis at height z (tiles) over the floor point (x, y), heading a (its
     model x to the world: pi/2 faces the camera), pose P. o = { T, sx, sy, t, scale, low, noGL, alpha, lagP, ev, dis }.
     Returns { R, V, S (screen anchors), gl } */
  let LAST = null;
  function draw(c, x, y, z, a, P, o) {
    o = o || {}; const t = o.t != null ? o.t : nowMs() / 1000, V = mkView(x, y, z, a, o), al0 = o.alpha == null ? 1 : o.alpha;
    const on = !o.noGL && glOn();
    const R = rig(P, t, o);
    if (on) { try { for (const s of [-1, 1]) membrane(R.S, s, MESH[s < 0 ? 'memL' : 'memR']); tailMesh(R.S, MESH.tail); } catch (e) { glFail(); } }
    const out = { R, V, gl: false, S: anchorsOf(R, V) }; LAST = out;
    if (!(al0 > 0.01)) return out;
    if (on) { let ok = false; try { ok = glPass(c, V, R, al0, { t, low: o.low, occ: o.low ? null : occOf(R) }); } catch (e) { glFail(); if (typeof console !== 'undefined') console.warn('Final Eclipse demon: draw', e); ok = false; } if (ok) { out.gl = true; return out; } }
    drawFallback(c, V, R, al0); return out;
  }
  /* the anchors on screen */
  function anchorsOf(R, V) { const o = {}; for (const k in R.A) { const v = R.A[k]; o[k] = Array.isArray(v[0]) ? v.map(V.toS) : V.toS(v); } o.pts = R.pts.map(V.toS); return o; }
  return { draw, rig, POSES, blend, pose, anchorsOf, mkView, warm() { return glOn(); }, get last() { return LAST; }, DIMS: { WHU, WFA, WFL, TAILL, LT, LS, LM },
    __dbg: { get gl() { return glOn(); }, set noGL(v) { NOGL = !!v; }, get MESH() { return MESH; }, skel, get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +GLMS.toFixed(2), frames: GLN, box: GLBOX, meshMs: +MESH_MS.toFixed(1), meshTris: MESH ? Object.values(MESH).reduce((a2, m) => a2 + (m ? m.ntri : 0), 0) : 0 }); } } };
})();
