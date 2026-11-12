/* ---------- Dark, the 12th Ultimate: Susano O, the model (worker M) ----------
   One persistent set of rigid parts and one rig for both forms: the towering dark samurai robot (a crested helmet,
   a broad chest with the pet's open gold-ribbed cockpit, crimson-roped shoulder drums carrying two fans of engraved
   blade wings, two ribbed thruster pods on articulated rail arms, one rear half-skirt, articulated arms and legs, a
   giant intact sword with a violet channel) and the blade-winged "Dark Messiah" spacecraft made by physically
   rearranging those same parts (see XF_STAGES and the rig's transformation).
   How it is drawn: every part is a signed-distance model, sphere-traced into a sprite with physically based shading
   (studio environment through Fresnel, a key light with soft self-shadows, a cool violet rim, occlusion, engraving,
   machining marks, worn edges, grime in the recesses) plus an emission layer (the violet cores, seams, eyes, the
   sword's channel, the blade edges). A part is baked lazily per VIEW: the camera's direction in the part's own frame,
   quantised (full parts: 22.5 deg in elevation, azimuth and roll; long parts - limbs, rails, pods, the sword, the
   wing blades - only by the view angle round their long axis), so any orientation the transformation reaches is
   drawable; a least-squares affine lays the nearest baked view onto the true projection. Baking runs in slices of
   about 1 ms (warm / warmPlan; it never starts a slice that would overrun).
   SUSANO_MODEL is the whole interface; see docs/DARK-SUSANOO-BRIEF.md (Notes, M). */
const SUSANO_MODEL = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const wrap = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;   // (the game camera: an orthographic view about 46 deg above the floor)
  const VIS = 1.1;   // the model is drawn this much larger than its rig's units (tiles); anchors include it
  const VIOLET = '#A55CFF', VDEEP = '#6A22FF', VCORE = '#F4E6FF', GOLDC = '#FFD27A';

  /* ================= vectors and rotations (a rotation: its three columns, the local axes in the parent frame) ================= */
  const hyp = (a, b) => Math.sqrt(a * a + b * b), hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);
  const V3 = (x, y, z) => [x, y, z];
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => hyp3(a[0], a[1], a[2]);
  const vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vlerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const nrm = vnrm;
  const M3 = (x, y, z) => ({ x, y, z });
  const I3 = () => M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };   // (+a: x toward -z; z toward +x)
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  function rotAxis(n, a) { n = vnrm(n); const c = Math.cos(a), s = Math.sin(a), t = 1 - c, [x, y, z] = n;
    return M3([t * x * x + c, t * x * y + s * z, t * x * z - s * y], [t * x * y - s * z, t * y * y + c, t * y * z + s * x], [t * x * z + s * y, t * y * z - s * x, t * z * z + c]); }
  /* an orthonormal frame with x along xd and z as near zh as it can be */
  function frameXZ(xd, zh) { const x = vnrm(xd); let y = vcross(zh, x); if (vlen(y) < 1e-6) y = vcross([0, 0, 1], x); if (vlen(y) < 1e-6) y = [0, 1, 0]; y = vnrm(y); return M3(x, y, vcross(x, y)); }
  /* a rotation that takes a to b (unit vectors) along the shortest arc, scaled by u */
  function rotTo(a, b, u) { const c = vcross(a, b), s = vlen(c), d = vdot(a, b); if (s < 1e-6) return d > 0 ? I3() : rotAxis(Math.abs(a[0]) < 0.9 ? vcross(a, [1, 0, 0]) : vcross(a, [0, 1, 0]), Math.PI * u); return rotAxis(c, Math.atan2(s, d) * u); }
  /* blend two rotations (by their x and z axes; good for the gentle blends the rig needs) */
  function mlerp(A, B, u) { if (u <= 0) return A; if (u >= 1) return B; const x = vnrm(vlerp(A.x, B.x, u)), z = vlerp(A.z, B.z, u); return frameXZ(x, vlen(z) > 1e-4 ? z : A.z); }
  /* a slerp-like blend for large turns: rotate A toward B about the axis of their relative rotation */
  function mslerp(A, B, u) { if (u <= 0) return A; if (u >= 1) return B; const R = mm(B, mT(A)), tr = R.x[0] + R.y[1] + R.z[2], ang = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
    if (ang < 1e-5) return B; let ax = [R.y[2] - R.z[1], R.z[0] - R.x[2], R.x[1] - R.y[0]]; if (vlen(ax) < 1e-5) { ax = [Math.sqrt(Math.max(0, (R.x[0] + 1) / 2)), Math.sqrt(Math.max(0, (R.y[1] + 1) / 2)), Math.sqrt(Math.max(0, (R.z[2] + 1) / 2))]; if (R.x[1] < 0) ax[1] = -ax[1]; if (R.x[2] < 0) ax[2] = -ax[2]; }
    return mm(rotAxis(ax, ang * u), A); }
  const mT = A => M3([A.x[0], A.y[0], A.z[0]], [A.x[1], A.y[1], A.z[1]], [A.x[2], A.y[2], A.z[2]]);

  /* ================= signed-distance modelling ================= */
  const M_OBS = 0, M_GUN = 1, M_SILV = 2, M_GOLD = 3, M_ROPE = 4, M_ENAM = 5, M_VIO = 6, M_DARK = 7, M_EYE = 8, M_BLADE = 9, M_CABLE = 10, M_STEEL = 11, M_VEDGE = 12, M_GRIP = 13;
  const sph = (x, y, z, r) => Math.sqrt(x * x + y * y + z * z) - r;
  function ell(x, y, z, a, b, c) { const X = x / a, Y = y / b, Z = z / c, k0 = Math.sqrt(X * X + Y * Y + Z * Z); if (k0 < 1e-6) return -Math.min(a, b, c); const k1 = Math.sqrt(X * X / (a * a) + Y * Y / (b * b) + Z * Z / (c * c)); return k0 * (k0 - 1) / k1; }
  function cap(x, y, z, ax, ay, az, bx, by, bz, r1, r2) { const px = x - ax, py = y - ay, pz = z - az, dx = bx - ax, dy = by - ay, dz = bz - az; const h = cl((px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz)); return hyp3(px - dx * h, py - dy * h, pz - dz * h) - (r2 == null ? r1 : r1 + (r2 - r1) * h); }
  function rbox(x, y, z, bx, by, bz, r) { const qx = Math.abs(x) - bx + r, qy = Math.abs(y) - by + r, qz = Math.abs(z) - bz + r; return hyp3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r; }
  function rbox2(x, y, bx, by, r) { const qx = Math.abs(x) - bx + r, qy = Math.abs(y) - by + r; return hyp(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r; }
  const smin = (a, b, k) => { const h = cl(0.5 + 0.5 * (b - a) / k); return b + (a - b) * h - k * h * (1 - h); };
  const smax = (a, b, k) => -smin(-a, -b, k);
  const torX = (x, y, z, R, r) => hyp(hyp(y, z) - R, x) - r, torY = (x, y, z, R, r) => hyp(hyp(x, z) - R, y) - r, torZ = (x, y, z, R, r) => hyp(hyp(x, y) - R, z) - r;
  const cone = (x, y, z, ax, ay, az, bx, by, bz, r1) => cap(x, y, z, ax, ay, az, bx, by, bz, r1, 0.004);
  const fm = (a, m) => a - Math.floor(a / m) * m;
  /* the accumulators in one typed array (no boxed numbers): Q[0] distance, Q[1] the nearest piece's distance */
  const Q = new Float64Array(8); let SM = 0;
  function add(d, m, k) { Q[0] = k ? smin(Q[0], d, k) : (d < Q[0] ? d : Q[0]); if (d < Q[1]) { Q[1] = d; SM = m; } }
  function carve(d, m) { if (-d > Q[0]) { Q[0] = -d; SM = m; Q[1] = -d; } }
  const far = (bd, k) => bd > Q[0] + (k || 0) + 0.02;
  const reset = m => { Q[0] = 1e9; Q[1] = 1e9; SM = m; };
  /* a plate's material: gold within `t` of its outline (2D distance e, negative inside), obsidian elsewhere */
  const trim = (e, t, m) => e > -t ? M_GOLD : (m == null ? M_OBS : m);
  const hsh = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
  const hsh3 = (i, j, k) => { const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return v - Math.floor(v); };
  function vnoise(x, y) { const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = hsh(i, j), b = hsh(i + 1, j), c2 = hsh(i, j + 1), d = hsh(i + 1, j + 1), su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); return lerp(lerp(a, b, su), lerp(c2, d, su), sv); }

  /* ---------------- the parts (each in its own frame; units: tiles) ---------------- */
  /* ---- the torso (origin: the spine joint at the waist; x front, y right, z up): a broad angular chest of layered
     obsidian, the open cockpit in its centre framed by gold ribs, a crest above it and a gold keel below with a crimson
     stone; segmented gunmetal abdomen lames, violet vents at the flanks; the shoulder sockets, the neck with a gold
     collar; on the back the spine plates with violet seams and the two rail-arm mounts; a crimson rope belt with a knot
     and two short tassels ---- */
  const K0 = [0.04, 0.48]; const K1 = [0.15, 0.26, 0.37]; const K2 = [0.1, 0.52]; const K3 = [0, 0.82];   // (constant lists for the loops in the shapes: no allocation per sample)
  const COCK = [0.4, 0, 0.64];
  const bnd = (x, y, z, cx, cy, cz, hx, hy, hz) => rbox(x - cx, y - cy, z - cz, hx, hy, hz, 0);   // (a group's bounding box: skip the group while it is farther than what we have)   // the cockpit's centre (torso frame)
  function sdTorso(x, y, z) {
    reset(M_OBS); const ay = Math.abs(y);
    const chest = rbox(x + 0.02, y, z - 0.72, 0.42, 0.68, 0.32, 0.15), yoke = rbox(x + 0.06, y, z - 0.92, 0.34, 0.84, 0.17, 0.12), waist = rbox(x, y, z - 0.25, 0.26, 0.25, 0.27, 0.1);
    let bd = smin(smin(chest, yoke, 0.08), waist, 0.12);
    // the chest's front planes: angled pectoral facets (a keel down the middle)
    bd = smax(bd, (x - 0.39) * 0.94 + ay * 0.28 - 0.06, 0.03);
    bd = smax(bd, (z - 1.14 + ay * 0.3) * 0.95, 0.05);   // (the yoke slopes down to the shoulders)
    add(bd, M_OBS);
    // a layered gorget rising round the neck, gold-edged
    if (!far(bnd(x, ay, z, 0, 0, 1.08, 0.36, 0.45, 0.12))) for (let i = 0; i < 2; i++) { const zz = 1.04 + 0.06 * i, g = Math.max(Math.abs(ell(x + 0.02, y, z - zz, 0.3 - 0.05 * i, 0.4 - 0.07 * i, 0.13)) - 0.028, -(z - zz + 0.02)); add(g, z - zz < 0.0 ? M_GOLD : M_OBS); }
    if (bd < 0.15) {
      // layered pectoral plates beside the cockpit, gold-edged; abdomen lames; the flank vents
      if (!far(bnd(x, ay, z, 0.36, 0.55, 0.76, 0.18, 0.35, 0.34))) for (let ip = 0; ip < 2; ip++) { const pz = ip ? 0.6 : 0.88, cy = ip ? 0.52 : 0.55, rw = ip ? 0.24 : 0.3, rh = ip ? 0.15 : 0.17;   // (domed pectoral plates, gold rimmed, a rivet row)
        const pe = ell(x - 0.24, ay - cy, z - pz, 0.2, rw, rh), d = Math.max(pe, 0.3 - x + (ay - cy) * 0.15); add(d, pe > -0.035 ? M_GOLD : M_OBS, 0.01);
        if (pe > -0.06 && pe < -0.04 && x > 0.33) add(sph(x - 0.4, ay - cy - (z - pz) * 0.2, z - pz, 0.016), M_STEEL); }
      if (!far(bnd(x, ay, z, 0.24, 0, 0.24, 0.06, 0.26, 0.16))) for (let i = 0; i < 3; i++) { const zc = 0.14 + i * 0.1, e = rbox2(y, z - zc, 0.24 - 0.03 * i, 0.04, 0.02), d = Math.max(e, Math.abs(x - 0.25 + i * 0.01) - 0.035); add(d, e > -0.014 ? M_GOLD : M_GUN); }
      if (ay > 0.15 && z > 0.12 && z < 0.5) carve(Math.max(Math.abs(fm(z, 0.075) - 0.0375) - 0.014, Math.abs(x - 0.02) - 0.15, 0.235 - ay, z - 0.48, 0.14 - z), M_VIO);
      // the back: spine plates (violet seams between), the rail-arm mounts (gold collars on steel sockets)
      if (!far(bnd(x, ay, z, -0.36, 0, 0.54, 0.05, 0.18, 0.4))) for (let i = 0; i < 4; i++) { const zc = 0.24 + i * 0.2, e = rbox2(y, z - zc, 0.17 - 0.02 * Math.abs(i - 1.5), 0.08, 0.03), d = Math.max(e, Math.abs(x + 0.36) - 0.035); add(d, trim(e, 0.016)); }
      if (x < -0.3 && ay < 0.05) carve(Math.max(ay - 0.022, -x - 0.42, Math.abs(z - 0.56) - 0.38), M_VIO);
    }
    // the reactor pack on the back: an armoured housing (gold-framed lames, a violet vent grille) carrying the two thruster
    // pods in steel sockets on its shoulders; the rail arms telescope out of it
    if (!far(bnd(x, ay, z, -0.55, 0, 0.82, 0.24, 0.56, 0.42))) {
      const hb = rbox(x + 0.52, y, z - 0.8, 0.2, 0.46 - 0.1 * cl((0.62 - z) / 0.3), 0.36, 0.1); add(hb, M_OBS, 0.04);
      add(Math.max(Math.abs(hb + 0.012) - 0.018, -(x + 0.62), z - 1.1), M_GOLD);   // (the gold frame round its back face)
      for (let i = 0; i < 3; i++) { const zc = 0.58 + 0.17 * i, e = rbox2(y, z - zc, 0.36 - 0.03 * i, 0.06, 0.03), d = Math.max(e, Math.abs(x + 0.73) - 0.03); add(d, trim(e, 0.014)); }
      if (x < -0.66 && ay < 0.2) carve(Math.max(Math.abs(fm(y + 0.2, 0.08) - 0.04) - 0.012, Math.abs(z - 1.02) - 0.06, -x - 0.76), M_VIO);
      for (let s2 = -1; s2 <= 1; s2 += 2) { const yy = y - s2 * 0.36; add(cap(x, yy, z, -0.6, 0, 0.92, -0.62, 0, 1.12, 0.17, 0.15), M_GUN); add(torZ(x + 0.62, yy, z - 1.12, 0.15, 0.03), M_GOLD); add(torZ(x + 0.61, yy, z - 1.0, 0.175, 0.022), M_GOLD); }
    }
    // the cockpit: an oval recess (dark), a violet cradle ring at its back, two gold control rings
    carve(ell(x - 0.46, y, z - COCK[2], 0.36, 0.29, 0.32), M_DARK);
    if (!far(bnd(x, ay, z, 0.22, 0, 0.6, 0.12, 0.26, 0.26))) { add(torX(x - 0.15, y, z - 0.62, 0.2, 0.02), M_VIO); add(torZ(x - 0.3, ay - 0.19, z - 0.48, 0.05, 0.013), M_GOLD); }
    // the gold ribs round the opening (three a side, stepping back), the crest above and the keel below
    if (!far(Math.max(Math.abs(x - 0.4) - 0.14, ay - 0.6, Math.abs(z - 0.66) - 0.52))) {
      for (let i = 0; i < 4; i++) { const ry = 0.3 + 0.07 * i, rz = 0.34 + 0.06 * i, x0 = 0.4 - 0.028 * i, q = hyp(y / ry, (z - COCK[2]) / rz), m = Math.min(ry, rz);
        const rib = Math.max(hyp((q - 1) * m, x - x0) - 0.038 + 0.004 * i, 0.06 - ay, (z - COCK[2]) - 0.27 - 0.03 * i); add(rib, M_GOLD, 0.012); }
      add(cap(x, y, z, 0.42, 0, 0.96, 0.44, 0, 1.12, 0.05, 0.008), M_GOLD);
      for (let s = -1; s <= 1; s += 2) add(cap(x, y, z, 0.42, 0, 0.97, 0.37, s * 0.22, 1.06, 0.034, 0.008), M_GOLD);
      add(Math.max(rbox2(y * 1.0, z - 0.26, 0.13 - (0.26 - z) * 0.3, 0.08, 0.012), Math.abs(x - 0.38) - 0.035), M_GOLD);
      add(sph(x - 0.41, y, z - 0.26, 0.04), M_ENAM);
    }
    // the shoulder sockets and the neck with its gold collar
    if (!far(bnd(x, ay, z, 0, 0.78, 0.86, 0.2, 0.2, 0.2))) add(sph(x, ay - 0.78, z - 0.86, 0.19), M_GUN);
    if (!far(bnd(x, ay, z, 0.03, 0, 1.09, 0.1, 0.1, 0.12))) add(cap(x, y, z, 0.03, 0, 0.98, 0.03, 0, 1.3, 0.1), M_GUN);
    // the crimson rope belt, its knot and two short tassels (clear of the legs)
    if (!far(bnd(x, ay, z, 0, 0, 0.07, 0.45, 0.42, 0.08))) { add(torZ(x, y, z - 0.07, 0.3, 0.045), M_ROPE); add(sph(x - 0.3, y, z - 0.05, 0.07), M_ROPE); }
    return 0;
  }
  /* ---- the pelvis (origin: its centre; the spine joint at z 0.2, the hips at y +-0.27, z -0.1): an obsidian block,
     a gold-framed front plate with a crimson diamond, steel hip joints in gold rings, side guards, the gold waist ring
     the skirt rides on ---- */
  function sdPelvis(x, y, z) {
    reset(M_OBS); const ay = Math.abs(y);
    add(rbox(x, y, z, 0.24, 0.34, 0.17, 0.08), M_OBS);
    { const e = rbox2(y, z + 0.04, 0.12 - (0.14 - z) * 0.1, 0.17, 0.035), d = Math.max(e, Math.abs(x - 0.21) - 0.035); add(d, trim(e, 0.025)); add(Math.max(Math.abs(y) + Math.abs(z + 0.03) - 0.06, Math.abs(x - 0.25) - 0.012), M_ENAM); }
    for (let s = -1; s <= 1; s += 2) { add(sph(x, y - s * 0.4, z + 0.1, 0.17), M_GUN); add(torY(x, y - s * 0.47, z + 0.1, 0.15, 0.028), M_GOLD); }
    { const e = rbox2(x, z + 0.01, 0.18, 0.13, 0.04), d = Math.max(e, Math.abs(ay - 0.4) - 0.035); add(d, trim(e, 0.022)); }
    add(torZ(x, y, z - 0.18, 0.25, 0.026), M_GOLD);
    add(cap(x, y, z, 0, 0, 0.1, 0, 0, 0.26, 0.11), M_GUN);
    return 0;
  }
  /* ---- the rear half-skirt (origin: its hinge at the back of the waist; it hangs along -z and wraps round the back of
     the hips about an axis 0.26 in front of the hinge): one substantial curved obsidian panel, a gold border, an
     engraved gold crescent, a violet seam; the steel hinge pin ---- */
  function sdSkirt(x, y, z) {
    reset(M_OBS);
    const px = x - 0.26, rr = hyp(px, y), th = Math.atan2(y, -px), Rs = 0.36 + 0.13 * cl(-z / 0.8), d0 = Math.abs(rr - Rs) - 0.034, lim = (Math.abs(th) - 1.2) * rr;
    const e = Math.max(lim, z + 0.8, z - 0.02), d = Math.max(d0, e);
    let m = e > -0.04 ? M_GOLD : M_OBS;
    if (m === M_OBS && rr > Rs) { const cz = z + 0.42, cr = hyp(th * 0.45, cz); if (Math.abs(cr - 0.15) < 0.014 && th * 0.45 > -0.06) m = M_GOLD; if (Math.abs(z + 0.66) < 0.012) m = M_VIO; }
    add(d, m);
    add(cap(x, y, z, 0, -0.2, 0, 0, 0.2, 0, 0.036), M_GUN);
    return 0;
  }
  /* ---- the helmet (origin: the neck joint): an obsidian bowl, a layered gunmetal faceplate with two narrow luminous
     eye slits, a gold brow band, a gold crest (two horns sweeping up and out, a central blade over a violet stone),
     side flaps and two neck-guard lames ---- */
  function sdHelmet(x, y, z) {
    reset(M_OBS); const ay = Math.abs(y);
    add(Math.max(ell(x + 0.02, y, z - 0.26, 0.24, 0.215, 0.22), -(z - 0.08)), M_OBS, 0.02);
    { const e = rbox2(ay * 1.0, z - 0.17, 0.12 - (0.24 - z) * 0.2, 0.1, 0.03), d = Math.max(e, Math.abs(x - 0.16 + ay * 0.35) - 0.04); add(d, e > -0.012 ? M_GOLD : M_GUN, 0.01); }
    for (let s = -1; s <= 1; s += 2) { const u = y - s * 0.065, v = z - 0.235 - s * u * 0.25; carve(Math.max(Math.abs(u) - 0.045, Math.abs(v) - 0.011, -(x - 0.17)), M_EYE); }
    add(cap(x, ay, z, 0.17, 0, 0.32, 0.12, 0.17, 0.3, 0.026, 0.022), M_GOLD);
    if (!far(Math.max(Math.abs(x - 0.12) - 0.12, ay - 0.3, Math.abs(z - 0.55) - 0.3))) {
      add(cap(x, ay, z, 0.17, 0.04, 0.33, 0.14, 0.14, 0.54, 0.036, 0.026), M_GOLD); add(cap(x, ay, z, 0.14, 0.14, 0.54, 0.05, 0.21, 0.79, 0.026, 0.005), M_GOLD);
      add(cap(x, y, z, 0.19, 0, 0.33, 0.17, 0, 0.52, 0.03, 0.004), M_GOLD); add(sph(x - 0.205, y, z - 0.33, 0.028), M_VIO);
    }
    { const e = rbox2(x + 0.03, z - 0.2, 0.09, 0.07, 0.02), d = Math.max(e, Math.abs(ay - 0.2) - 0.022); add(d, trim(e, 0.016)); }
    for (let i = 0; i < 2; i++) { const zz = 0.1 - 0.065 * i, sh = Math.max(Math.abs(ell(x + 0.04, y, z - zz, 0.23 + 0.03 * i, 0.22 + 0.03 * i, 0.09)) - 0.016, x - 0.04, -(z - zz + 0.06)); add(sh, z - zz < -0.035 ? M_GOLD : M_OBS); }
    return 0;
  }
  /* ---- a shoulder drum (origin: the shoulder socket; s: the side, w = outward): an obsidian drum on a lateral axis,
     gold rims, three crimson braided rope wraps, two layered pauldron lames over it, the wing-hub axle at the back ---- */
  function sdDrum(s) { return (x, y, z) => {
    reset(M_OBS); const w = y * s, r = hyp(x + 0.02, z - 0.04);
    add(Math.max(r - 0.4, Math.abs(w - 0.26) - 0.23), M_OBS, 0.0);
    for (let _K0 = 0; _K0 < K0.length; _K0++) { const wi = K0[_K0]; add(hyp(r - 0.4, w - wi) - 0.042, M_GOLD); }
    for (let _K1 = 0; _K1 < K1.length; _K1++) { const wi = K1[_K1]; add(hyp(r - 0.43, w - wi) - 0.058, M_ROPE); }
    if (!far(Math.max(r - 0.62, Math.abs(w - 0.3) - 0.5))) for (let i = 0; i < 3; i++) { const e = -(z - 0.14 - 0.09 * i), d = Math.max(Math.abs(ell(x + 0.02, w - 0.3, z - 0.02 - 0.07 * i, 0.58 - 0.06 * i, 0.46 - 0.05 * i, 0.55 - 0.07 * i)) - 0.034, e); add(d, e > -0.045 ? M_GOLD : M_OBS);
      { if (e < -0.03) add(Math.max(Math.abs(ell(x + 0.02, w - 0.3, z - 0.02 - 0.07 * i, 0.6 - 0.06 * i, 0.48 - 0.05 * i, 0.57 - 0.07 * i)) - 0.02, Math.abs(x + 0.02) - 0.035, e + 0.03), M_GOLD); }
      if (e > -0.075 && e < -0.045) { const an = Math.atan2(x + 0.02, w - 0.3), qa = Math.round(an / 0.4) * 0.4, rr = 0.5 - 0.06 * i; add(sph(x + 0.02 - Math.sin(qa) * rr, w - 0.3 - Math.cos(qa) * rr * 0.8, z - 0.14 - 0.09 * i + 0.06, 0.022), M_STEEL); } }
    add(cap(x, w, z, -0.24, 0.3, 0.1, -0.46, 0.36, 0.14, 0.09), M_GUN);
    add(sph(x - 0.3, w - 0.27, z + 0.3, 0.075), M_ROPE); add(cap(x, w, z, 0.3, 0.27, -0.33, 0.33, 0.29, -0.52, 0.03, 0.05), M_ROPE);
    return 0; }; }
  /* ---- a wing hub (origin: its centre; axis z): a gold-rimmed geared disk, gunmetal spokes, a violet core ---- */
  function sdHub(x, y, z) {
    reset(M_GUN); const r = hyp(x, y), an = Math.atan2(y, x);
    add(Math.max(r - 0.2 - (fm(an * 18 / TAU, 1) < 0.5 ? 0.018 : 0), Math.abs(z) - 0.04), M_GOLD);
    add(Math.max(r - 0.165, Math.abs(z) - 0.055), M_GUN);
    add(Math.max(r - 0.075, Math.abs(z - 0.03) - 0.04), M_VIO);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, c = Math.cos(a), sn = Math.sin(a); add(cap(x, y, z, c * 0.08, sn * 0.08, 0.06, c * 0.15, sn * 0.15, 0.06, 0.016), M_STEEL); }
    return 0;
  }
  /* ---- a wing blade (origin: its root on the hub; x out along the blade to the tip at 2.0; it curves toward +y; z its
     thickness): a gunmetal spar with a gold ring, then a curved engraved silver scimitar blade, lens-thick, its convex
     outer edge carrying a thin violet light, the tip hooked ---- */
  const BL = 2.0;
  const bladeC = x => 0.42 * Math.pow(cl(x / BL), 2.0);
  const bladeW = x => x < 0.28 ? 0 : x < 1.0 ? lerp(0.2, 0.5, Math.sqrt((x - 0.28) / 0.72)) : 0.5 * Math.pow(cl((BL - x) / (BL - 1.0)), 0.7);
  function sdBlade(x, y, z) {
    reset(M_BLADE);
    add(cap(x, y, z, -0.04, 0, 0, 0.36, 0, 0, 0.05, 0.04), M_GUN); add(torX(x - 0.14, y, z, 0.05, 0.016), M_GOLD); add(torX(x - 0.3, y, z, 0.045, 0.014), M_GOLD);
    if (x > 0.2 && x < BL + 0.05) {
      const w = bladeW(x), v = y - bladeC(x), wo = w * 0.62, wi = w * 0.38, mid = (wo - wi) / 2, hw = (wo + wi) / 2, q = cl(1 - Math.pow((v - mid) / Math.max(1e-3, hw), 2));
      const th = 0.004 + 0.034 * Math.sqrt(q) * (0.4 + 0.6 * cl(w / 0.12));
      const d = Math.max(Math.max(v - wo, -wi - v) * 0.8, Math.abs(z) - th, 0.26 - x, x - BL) * 0.75;
      add(d, v > wo - 0.035 && x > 0.4 ? M_VEDGE : v > wo - 0.065 || v < -wi + 0.03 ? M_SILV : M_BLADE);
    }
    return 0;
  }
  /* ---- the sword (origin: the grip's centre, between the hands; x along the blade to the tip at 3.12; y across the blade;
     z its thickness): a gold pommel, a crimson-wrapped grip, a sculpted gold guard with swept prongs and a crimson
     stone, a black-metal blade with silver bevelled edges and a recessed violet channel down both faces, gold
     filigree beside it ---- */
  const SW = { tip: 3.12, base: 0.22, grip1: 0, grip2: -0.24 };
  const swW = x => x < 2.55 ? lerp(0.175, 0.16, (x - SW.base) / (2.55 - SW.base)) : 0.16 * Math.pow(cl((SW.tip - x) / (SW.tip - 2.55)), 0.9);
  function sdSword(x, y, z) {
    reset(M_OBS); const ay = Math.abs(y), az = Math.abs(z);
    // pommel, grip, guard
    add(sph(x + 0.45, y, z, 0.072), M_GOLD); add(cap(x, y, z, -0.45, 0, 0, -0.36, 0, 0, 0.045, 0.05), M_GOLD);
    add(cap(x, y, z, -0.37, 0, 0, 0.08, 0, 0, 0.052, 0.056), M_GRIP);
    add(rbox(x - 0.14, y, z, 0.07, 0.15, 0.075, 0.035), M_GOLD);
    add(cap(x, ay, z, 0.13, 0.1, 0, 0.28, 0.3, 0, 0.055, 0.03), M_GOLD); add(cap(x, ay, z, 0.28, 0.3, 0, 0.44, 0.38, 0, 0.03, 0.006), M_GOLD);
    add(cap(x, ay, z, 0.13, 0.1, 0, 0.02, 0.26, 0, 0.038, 0.008), M_GOLD); add(cap(x, ay, z, 0.2, 0.06, 0, 0.36, 0.2, 0, 0.026, 0.004), M_GOLD);
    add(sph(x - 0.15, y, az - 0.07, 0.042), M_ENAM); add(torX(x - 0.07, y, z, 0.07, 0.02), M_GOLD);
    // the blade
    if (x > SW.base - 0.02) {
      const w = swW(x), th = az, bev = Math.max(0, ay - (w - 0.05)), tz = 0.046 - bev * 0.8;
      const d = Math.max(ay - w, th - Math.max(0.006, tz), SW.base - x, x - SW.tip) * 0.85;
      let m = ay > w - 0.05 ? M_SILV : M_OBS;
      if (m === M_OBS && x > 0.35 && x < 2.7) { if (ay < 0.036) m = M_VIO; else if (ay > 0.055 && ay < 0.08 && Math.abs(fm(x * 6, 1) - 0.5) < 0.42) m = M_GOLD; }
      add(d, m);
      if (x > 0.35 && x < 2.7) carve(Math.max(ay - 0.036, az - 0.03, 0.35 - x, x - 2.7), M_VIO);
      add(Math.max(rbox(x - 0.27, y, z, 0.05, w + 0.01, 0.05, 0.02), SW.base - 0.02 - x), M_GOLD);
    }
    return 0;
  }
  /* ---- an upper arm (origin: the shoulder; x to the elbow; z its outer side): massive. A gunmetal core, three
     overlapping obsidian sleeves (each flaring toward its lower edge, a gold rim with a rivet ring), exposed twin pistons
     and cables on the inner side, a big elbow joint in a gold ring with a violet core ---- */
  const LUA = 0.78, LFA = 0.72, LTH = 1.12, LSH = 1.1, XT = LTH / 0.76, XS = LSH / 0.76;   // (the legs: long and athletic; their plating is laid out on the old 0.76 and stretched)
  const RIVA = 0.5;   // (the rivet spacing round a ring, radians)
  function ringRivets(x, y, z, xr, R, m) { const an = Math.atan2(z, y), qa = Math.round(an / RIVA) * RIVA; add(sph(x - xr, y - R * Math.cos(qa), z - R * Math.sin(qa), 0.02), m == null ? M_STEEL : m); }
  function sdUarm(x, y, z) {
    reset(M_GUN); const r = hyp(y, z);
    add(cap(x, y, z, 0.02, 0, 0, LUA - 0.05, 0, 0, 0.15, 0.13), M_GUN);
    if (!far(Math.max(Math.abs(x - 0.37) - 0.38, r - 0.32))) for (let i = 0; i < 3; i++) { const x0 = 0.04 + i * 0.21, u = cl((x - x0) / 0.25), R0 = 0.245 + 0.035 * u - 0.012 * i;
      const d = Math.max(hyp(y * 1.04, z - 0.02) - R0, x0 - x, x - x0 - 0.25, -(z + 0.1)); add(d, x - x0 > 0.215 ? M_GOLD : M_OBS);
      if (Math.abs(x - x0 - 0.19) < 0.05 && z > -0.08) ringRivets(x, y, z - 0.02, x0 + 0.19, R0 + 0.025); }
    if (z < -0.04) { for (let s = -1; s <= 1; s += 2) { add(cap(x, y, z, 0.12, s * 0.07, -0.17, 0.66, s * 0.07, -0.15, 0.03), M_STEEL); add(cap(x, y, z, 0.1, s * 0.07, -0.17, 0.38, s * 0.07, -0.16, 0.045), M_GUN); } add(cap(x, y, z, 0.15, 0, -0.2, 0.6, 0, -0.19, 0.028), M_CABLE); }
    add(sph(x - LUA, y, z, 0.19), M_GUN); add(torX(x - LUA, y, z, 0.18, 0.035), M_GOLD); add(sph(x - LUA, y, z - 0.15, 0.05), M_VIO);
    return 0;
  }
  /* ---- a forearm gauntlet (origin: the elbow; x to the wrist; z outer): huge. Four ring plates flaring toward the fist,
     each gold-rimmed with rivets; a gold-framed armour ridge along the outer face with violet vents; the steel wrist ---- */
  function sdFarm(x, y, z) {
    reset(M_OBS);
    add(cap(x, y, z, 0.0, 0, 0, LFA, 0, 0, 0.15, 0.13), M_GUN);
    if (!far(Math.max(Math.abs(x - 0.36) - 0.4, hyp(y, z) - 0.38))) for (let i = 0; i < 4; i++) { const x0 = 0.04 + i * 0.16, u = cl((x - x0) / 0.18), Rr = 0.2 + 0.024 * i + 0.022 * u;
      const d = rbox(x - x0 - 0.09, y, z - 0.01, 0.09, Rr, Rr * 1.05, 0.065); add(d, x - x0 > 0.155 ? M_GOLD : M_OBS);
      if (Math.abs(x - x0 - 0.13) < 0.04) ringRivets(x, y * 0.97, z - 0.01, x0 + 0.13, Rr + 0.005); }
    { const e = rbox2(x - 0.38, y, 0.3, 0.11, 0.035), d = Math.max(e, Math.abs(z - 0.3) - 0.045); add(d, trim(e, 0.026)); }
    if (z > 0.26 && x > 0.16 && x < 0.6) carve(Math.max(Math.abs(fm(x, 0.085) - 0.0425) - 0.013, Math.abs(y) - 0.055, -(z - 0.335)), M_VIO);
    add(sph(x - LFA, y, z, 0.12), M_STEEL);
    return 0;
  }
  /* ---- a fist (origin: the grip's centre; the grip along x; the wrist at +z): a big armoured fist. A gold-trimmed back
     plate with rivets, four heavy finger segments curled round the grip with gold knuckle plates, a thumb, a cuff ---- */
  function sdHand(x, y, z) {
    reset(M_OBS); const r = hyp(y, z);
    { const e = rbox2(x, y, 0.11, 0.09, 0.035), d = Math.max(rbox(x, y, z - 0.095, 0.115, 0.095, 0.07, 0.035), -e - 0.0); add(d, e > -0.02 ? M_GOLD : M_OBS); }
    if (r < 0.19) for (let j = 0; j < 4; j++) { const xj = -0.08 + j * 0.053; add(Math.max(hyp(r - 0.084, x - xj) - 0.027, z - 0.075), M_GUN); add(Math.max(hyp(r - 0.084, x - xj) - 0.032, -(z - 0.05), Math.abs(y) - 0.105), M_GOLD); }
    add(cap(x, y, z, 0.11, 0.075, 0.07, 0.105, 0.095, -0.035, 0.034, 0.028), M_GUN);
    for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) add(sph(x + 0.07 - j * 0.14, y + 0.06 - k * 0.12, z - 0.168, 0.013), M_STEEL);
    add(cap(x, y, z, 0, 0, 0.12, 0, 0, 0.2, 0.075), M_GUN); add(torZ(x, y, z - 0.16, 0.078, 0.02), M_GOLD);
    carve(r - 0.052, M_DARK);
    return 0;
  }
  /* ---- a thigh (origin: the hip; x to the knee; z its front): massive. A gunmetal core, three layered obsidian lames
     (gold lower rims, rivet rings), gold-trimmed side panels, pistons and cables behind; the knee housing: a geared gold
     disk each side, a domed obsidian guard in front, a violet core ---- */
  function sdThigh(x, y, z) {
    x = x <= LTH ? x / XT : x - LTH + 0.76; const LTH0 = 0.76;
    reset(M_GUN); const ay = Math.abs(y), r = hyp(y, z);
    add(cap(x, y, z, 0.02, 0, 0, LTH0 - 0.05, 0, 0, 0.17, 0.15), M_GUN);
    if (!far(Math.max(Math.abs(x - 0.36) - 0.4, r - 0.4))) for (let i = 0; i < 3; i++) { const x0 = 0.0 + i * 0.22, u = cl((x - x0) / 0.27), R0 = 0.31 - 0.02 * i + 0.03 * u;
      const d = Math.max(hyp(y * 0.94, z - 0.02) - R0, x0 - x, x - x0 - 0.27, -(z + 0.12)); add(d, x - x0 > 0.24 ? M_GOLD : M_OBS);
      if (Math.abs(x - x0 - 0.21) < 0.05 && z > -0.1) ringRivets(x, y * 0.94, z - 0.02, x0 + 0.21, R0 + 0.025); }
    { const e = rbox2(x - 0.38, z + 0.02, 0.27, 0.16, 0.05), d = Math.max(e, Math.abs(ay - 0.33) - 0.035); add(d, trim(e, 0.026)); }
    if (z < -0.06) { for (let s = -1; s <= 1; s += 2) { add(cap(x, y, z, 0.1, s * 0.08, -0.2, 0.64, s * 0.08, -0.18, 0.032), M_STEEL); add(cap(x, y, z, 0.08, s * 0.08, -0.2, 0.34, s * 0.08, -0.19, 0.05), M_GUN); } }
    { const kx = x - LTH0; if (!far(sph(kx, y, z, 0.32))) {
      add(sph(kx, y, z, 0.2), M_GUN);
      const kr = hyp(kx, z), an = Math.atan2(z, kx); add(Math.max(kr - 0.21 - (fm(an * 12 / TAU, 1) < 0.5 ? 0.02 : 0), Math.abs(ay - 0.25) - 0.045), M_GOLD); add(Math.max(kr - 0.13, Math.abs(ay - 0.29) - 0.03), M_OBS);
      const sh = Math.max(Math.abs(ell(kx, y, z - 0.09, 0.22, 0.24, 0.16)) - 0.032, -(z - 0.05)); add(sh, z < 0.1 ? M_GOLD : M_OBS); add(sph(kx, y, z - 0.25, 0.045), M_VIO); } }
    return 0;
  }
  /* ---- a shin (origin: the knee; x to the ankle; z front): heavy. Two nested obsidian sleeves, a crimson enamel front
     plate in a gold frame, gold rims and side strips, violet vents behind, the ankle joint ---- */
  function sdShin(x, y, z) {
    x = x <= LSH ? x / XS : x - LSH + 0.76;
    reset(M_OBS); const ay = Math.abs(y);
    add(rbox(x - 0.3, y, z, 0.28, 0.24, 0.25, 0.085), Math.abs(x - 0.56) < 0.024 ? M_GOLD : M_OBS);
    add(rbox(x - 0.63, y, z + 0.01, 0.14, 0.21, 0.22, 0.07), Math.abs(x - 0.74) < 0.02 ? M_GOLD : M_OBS);
    { const e = rbox2(x - 0.32, y, 0.21, 0.135, 0.05), d = Math.max(e, Math.abs(z - 0.255) - 0.03); add(d, e > -0.03 ? M_GOLD : M_ENAM); }
    { const e = rbox2(x - 0.32, z, 0.24, 0.05, 0.02), d = Math.max(e, Math.abs(ay - 0.25) - 0.02); add(d, M_GOLD); }
    if (z < -0.18 && x > 0.12 && x < 0.5) carve(Math.max(Math.abs(fm(x, 0.08) - 0.04) - 0.013, Math.abs(y) - 0.07, z + 0.235), M_VIO);
    add(sph(x - 0.76, y, z, 0.12), M_STEEL); add(cap(x, y, z, 0.0, 0, 0, 0.12, 0, 0, 0.15), M_GUN);
    return 0;
  }
  /* ---- a foot (origin: the ankle; x forward; the sole at z -0.13): a big plated sabaton, three stepped toe plates with
     gold edges, a heel spur, an ankle guard, a violet hover vent under the sole ---- */
  function sdFoot(x, y, z) {
    reset(M_OBS);
    add(rbox(x - 0.08, y, z + 0.07, 0.24, 0.14, 0.065, 0.045), M_OBS);
    for (let i = 0; i < 3; i++) { const x0 = 0.14 + i * 0.09, d = Math.max(rbox(x - x0 - 0.05, y, z + 0.05 + i * 0.012, 0.06, 0.13 - 0.02 * i, 0.06 - 0.008 * i, 0.03), -(z + 0.13)); add(d, x - x0 > 0.085 ? M_GOLD : M_OBS); }
    add(cap(x, y, z, -0.1, 0, -0.06, -0.24, 0, -0.11, 0.05, 0.012), M_GUN);
    add(Math.max(Math.abs(ell(x - 0.0, y, z + 0.0, 0.15, 0.14, 0.1)) - 0.024, -(z + 0.02)), M_GOLD);
    carve(Math.max(rbox2(x - 0.08, y, 0.14, 0.06, 0.02), -(z + 0.12)), M_VIO);
    return 0;
  }
  /* ---- the chest hatch (origin: its hinge across the top of the cockpit; it hangs along -z when shut): an ornate
     shield-shaped cover, gently domed, a wide gold frame, an obsidian field engraved with gold filigree, a crimson stone
     in a gold boss, a violet slit, the hinge pin ---- */
  function sdHatch(x, y, z) {
    reset(M_OBS); const ay = Math.abs(y);
    // a heart-shaped shield: two lobes at the top, a point at the bottom; domed; a thick gold frame, an inner gold line
    const zc = z + 0.3, lobe = Math.min(hyp(ay - 0.14, zc - 0.12) - 0.2, 1e9), pt = (ay * 0.95 + (-zc - 0.02) * 0.62) - 0.25, body = Math.min(lobe, Math.max(pt, zc - 0.14));
    const e = Math.max(body, -zc - 0.42), dome = 0.06 * cl(1 - (y * y) / 0.12 - (zc * zc) / 0.16);
    const d = Math.max(e, Math.abs(x - dome * 0.6) - 0.035 - dome * 0.4);
    let m = e > -0.06 ? M_GOLD : Math.abs(e + 0.095) < 0.012 ? M_GOLD : M_OBS;
    if (m === M_OBS && x > 0.02) { const sc = Math.abs(Math.sin(ay * 26 + Math.cos(zc * 18) * 1.6) * 0.5 + Math.sin(zc * 30 + ay * 8) * 0.5); if (sc < 0.07) m = M_GOLD; }
    add(d, m);
    add(Math.max(hyp(y, zc + 0.02) - 0.085, Math.abs(x - 0.07) - 0.035), M_GOLD); add(sph(x - 0.1, y, zc + 0.02, 0.05), M_ENAM);
    for (let s2 = -1; s2 <= 1; s2 += 2) add(cap(x, y, z, 0.07, s2 * 0.06, zc - z + 0.1, 0.07, s2 * 0.2, zc - z + 0.18, 0.016, 0.006), M_GOLD);
    add(cap(x, y, z, 0, -0.18, 0, 0, 0.18, 0, 0.032), M_GUN);
    return 0;
  }
  /* ---- a thruster pod (origin: its rear, where the rail arm holds it; x to the nozzle at 0.95): a dark ribbed casing,
     antique-gold collars, a crimson band, a steel nozzle bell with a violet throat ---- */
  function sdPod(x, y, z) {
    reset(M_GUN); const r = hyp(y, z);
    add(Math.max(r - 0.155 + (fm(x, 0.06) < 0.018 ? 0.011 : 0), 0.04 - x, x - 0.66), M_GUN);
    for (let _K2 = 0; _K2 < K2.length; _K2++) { const xc = K2[_K2]; add(hyp(r - 0.16, x - xc) - 0.028, M_GOLD); }
    add(Math.max(Math.abs(r - 0.157) - 0.012, Math.abs(x - 0.31) - 0.035), M_ENAM);
    add(Math.max(Math.abs(r - (0.11 + (x - 0.64) * 0.45)) - 0.018, 0.64 - x, x - 0.8), M_STEEL);
    add(Math.max(r - 0.1, Math.abs(x - 0.69) - 0.03), M_VIO);
    add(sph(x - 0.04, y, z, 0.14), M_GUN); add(cap(x, y, z, -0.02, 0, 0, -0.08, 0, 0, 0.06), M_STEEL);
    return 0;
  }
  /* ---- a rail arm link (origin: one knuckle; x to the other at 0.82): a gunmetal box beam, a steel piston, knuckles ---- */
  const LRAIL = 0.82;
  function sdRail(x, y, z) {
    reset(M_GUN);
    { const b = rbox(x - LRAIL / 2, y, z, LRAIL / 2 - 0.04, 0.06, 0.08, 0.025); add(b, M_GUN); add(Math.max(Math.abs(b + 0.01) - 0.012, Math.abs(z) - 0.05), M_GOLD); }   // (an armoured beam, gold-edged flanks)
    add(cap(x, y, z, 0.12, 0.0, 0.1, LRAIL - 0.14, 0.0, 0.1, 0.024), M_STEEL);
    for (let _K3 = 0; _K3 < K3.length; _K3++) { const xc = K3[_K3];  add(sph(x - xc, y, z, 0.1), M_GUN); add(torY(x - xc, y, z, 0.1, 0.02), M_GOLD); }
    return 0;
  }
  /* ---- the sword cradle (origin: its hinge on the lower back; x out to the clamp at 0.6): a gunmetal arm, a gold fork ---- */
  const LCRD = 0.62;
  function sdCradle(x, y, z) {
    reset(M_GUN);
    add(rbox(x - 0.28, y, z, 0.27, 0.05, 0.045, 0.02), M_GUN); add(sph(x, y, z, 0.07), M_STEEL);
    for (let s = -1; s <= 1; s += 2) add(cap(x, y, z, 0.52, s * 0.06, 0, 0.66, s * 0.1, 0.0, 0.03, 0.015), M_GOLD);
    add(rbox(x - 0.55, y, z, 0.04, 0.09, 0.05, 0.015), M_GOLD);
    return 0;
  }
  /* ---- the pilot's cradle (origin: the seat; counter-rotates to stay upright): a gold frame, a crimson back ---- */
  function sdSeat(x, y, z) {
    reset(M_GOLD);
    add(rbox(x + 0.09, y, z - 0.13, 0.025, 0.12, 0.15, 0.03), M_ENAM);
    add(Math.max(Math.abs(rbox2(y, z - 0.13, 0.15, 0.18, 0.06)) - 0.018, Math.abs(x + 0.11) - 0.022), M_GOLD);
    add(rbox(x, y, z + 0.01, 0.09, 0.12, 0.02, 0.015), M_GOLD);
    return 0;
  }

  /* ---------------- the part table ----------------
     full: baked per view (elevation, azimuth, roll); c the image centre, R its bound, w the extents for the fit.
     axis: long parts baked side-on per view angle round x; x0..x1 their length, hw their radius round the axis. */
  const PARTS = {
    torso: { f: sdTorso, kind: 'full', c: [0, 0, 0.56], R: 1.12, glow: true, w: [0.9, 1.6, 1.15] },
    pelvis: { f: sdPelvis, kind: 'full', c: [0, 0, 0.0], R: 0.66, w: [0.5, 0.6, 0.4] },
    skirt: { f: sdSkirt, kind: 'full', c: [-0.14, 0, -0.38], R: 0.68, glow: true, w: [0.5, 0.9, 0.8] },
    helmet: { f: sdHelmet, kind: 'full', c: [0.03, 0, 0.42], R: 0.48, glow: true, w: [0.4, 0.45, 0.7] },
    drumL: { f: sdDrum(-1), kind: 'full', c: [-0.04, -0.28, 0.06], R: 0.72, w: [0.85, 0.55, 0.85] },
    drumR: { f: sdDrum(1), kind: 'full', c: [-0.04, 0.28, 0.06], R: 0.72, w: [0.85, 0.55, 0.85] },
    hub: { f: sdHub, kind: 'full', noRoll: true, c: [0, 0, 0.0], R: 0.25, glow: true, w: [0.4, 0.4, 0.1] },
    hand: { f: sdHand, kind: 'axis', x0: -0.17, x1: 0.17, hw: 0.25, w: [0.28, 0.24, 0.28] },
    hatch: { f: sdHatch, kind: 'full', c: [0.02, 0, -0.32], R: 0.42, glow: true, w: [0.1, 0.68, 0.72] },
    foot: { f: sdFoot, kind: 'full', c: [0.08, 0, -0.04], R: 0.38, glow: true, w: [0.5, 0.2, 0.2] },
    seat: { f: sdSeat, kind: 'full', c: [-0.04, 0, 0.12], R: 0.26, w: [0.2, 0.3, 0.35] },
    uarm: { f: sdUarm, kind: 'axis', x0: -0.15, x1: LUA + 0.22, hw: 0.33, glow: true, w: [LUA, 0.3, 0.3] },
    farm: { f: sdFarm, kind: 'axis', x0: -0.14, x1: LFA + 0.14, hw: 0.4, glow: true, w: [LFA, 0.25, 0.27] },
    thigh: { f: sdThigh, kind: 'axis', x0: -0.15, x1: LTH + 0.26, hw: 0.42, glow: true, w: [LTH, 0.36, 0.36] },
    shin: { f: sdShin, kind: 'axis', x0: -0.13, x1: LSH + 0.15, hw: 0.37, glow: true, w: [LSH, 0.28, 0.3] },
    pod: { f: sdPod, kind: 'axis', x0: -0.12, x1: 0.84, hw: 0.19, glow: true, w: [0.85, 0.32, 0.32] },
    rail: { f: sdRail, kind: 'axis', x0: -0.12, x1: LRAIL + 0.12, hw: 0.14, w: [LRAIL, 0.1, 0.12] },
    cradle: { f: sdCradle, kind: 'axis', x0: -0.09, x1: 0.7, hw: 0.13, w: [0.6, 0.2, 0.1] },
    sword: { f: sdSword, kind: 'axis', x0: -0.54, x1: SW.tip + 0.03, hw: 0.42, glow: true, w: [3.6, 0.55, 0.12] },
    blade: { f: sdBlade, kind: 'axis', x0: -0.1, x1: BL + 0.04, hw: 0.7, glow: true, w: [2.0, 0.6, 0.08] },
  };
  const PART_NAMES = Object.keys(PARTS);

  /* ================= the GPU meshes =================
     Every part as a real mesh in its own frame (the same frames and measures as its shape above): bevelled boxes,
     domes, tubes, tori, lathes, extruded outlines, swept surfaces. One material per triangle (a material change is a
     seam of doubled vertices). Built once, on first use (a few ms). */
  let MESH = null;
  function buildMeshes() {
    const G = M => M.done(), DQ = lowFx() ? 0.45 : 0.7, nb = () => GLM.builder(DQ);
    const out = {};
    const goldRing = (B, c, R, r, seg) => B.torX(c, R, r, M_GOLD, { seg: seg || 22, rseg: 6 });
    // ---- the torso ----
    { const B = nb();
      B.box([-0.02, 0, 0.7], [0.42, 0.62, 0.34], 0.15, M_OBS);
      for (const s of [-1, 1]) { B.push([1, 0, 0], [0, Math.cos(0.29), -s * Math.sin(0.29)], [0, s * Math.sin(0.29), Math.cos(0.29)], [-0.06, s * 0.42, 0.93]); B.box([0, 0, 0], [0.34, 0.44, 0.13], 0.11, M_OBS); B.pop(); }
      B.box([0, 0, 0.25], [0.26, 0.25, 0.27], 0.1, M_OBS);
      // the gorget round the neck: two gold-edged domed collars
      for (let i = 0; i < 2; i++) { const zz = 1.04 + 0.06 * i, r = [0.3 - 0.05 * i, 0.4 - 0.07 * i, 0.13]; B.ell([-0.02, 0, zz], r, M_OBS, { seg: 20, rings: 4, th0: 0, th1: 1.25 }); B.ell([-0.02, 0, zz], r, M_GOLD, { seg: 20, rings: 2, th0: 1.25, th1: 1.62 }); }
      // the pectoral domes beside the cockpit: obsidian with a gold rim
      for (const s of [-1, 1]) for (let ip = 0; ip < 2; ip++) { const pz = ip ? 0.6 : 0.88, cy = ip ? 0.52 : 0.55, rw = ip ? 0.24 : 0.3, rh = ip ? 0.15 : 0.17;
        B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0.26, s * cy, pz]); B.ell([0, 0, 0], [rw, rh, 0.2], M_OBS, { seg: 18, rings: 5, th0: 0, th1: 0.95 }); B.ell([0, 0, 0], [rw, rh, 0.2], M_GOLD, { seg: 18, rings: 1, th0: 0.95, th1: 1.2, cap: false }); B.pop(); }
      // abdomen lames (gunmetal, gold lower edge), flank vents
      for (let i = 0; i < 3; i++) { const zc = 0.14 + i * 0.1; B.box([0.25 - i * 0.01, 0, zc + 0.008], [0.035, 0.24 - 0.03 * i, 0.034], 0.014, M_GUN); B.box([0.252 - i * 0.01, 0, zc - 0.03], [0.034, 0.24 - 0.03 * i, 0.012], 0.008, M_GOLD); }
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) B.box([0.02, s * 0.252, 0.19 + i * 0.075], [0.15, 0.006, 0.014], 0.004, M_VIO);
      // the back: spine plates
      for (let i = 0; i < 4; i++) { const zc = 0.24 + i * 0.2, hy = 0.17 - 0.02 * Math.abs(i - 1.5); B.box([-0.36, 0, zc], [0.035, hy, 0.08], 0.03, M_GOLD); B.box([-0.372, 0, zc], [0.03, hy - 0.02, 0.064], 0.025, M_OBS); }
      // the reactor pack: housing, gold frame, lames, vent grille, the pod sockets
      B.box([-0.52, 0, 0.8], [0.2, 0.46, 0.36], 0.1, M_OBS);
      B.box([-0.705, 0, 1.14], [0.03, 0.42, 0.018], 0.012, M_GOLD); B.box([-0.705, 0, 0.46], [0.03, 0.36, 0.018], 0.012, M_GOLD);
      for (const s of [-1, 1]) B.box([-0.705, s * 0.44, 0.8], [0.03, 0.018, 0.34], 0.012, M_GOLD);
      for (let i = 0; i < 3; i++) { const zc = 0.58 + 0.17 * i, hy = 0.36 - 0.03 * i; B.box([-0.74, 0, zc], [0.03, hy, 0.06], 0.03, M_OBS); B.box([-0.742, 0, zc - 0.05], [0.028, hy, 0.012], 0.008, M_GOLD); }
      for (let i = 0; i < 5; i++) B.box([-0.755, -0.16 + i * 0.08, 1.02], [0.012, 0.012, 0.055], 0.004, M_VIO);
      for (const s of [-1, 1]) { B.tube([-0.6, s * 0.36, 0.9], [-0.62, s * 0.36, 1.12], 0.17, 0.15, M_GUN, { seg: 18, cap0: 'flat', cap1: 'flat' }); B.torZ([-0.62, s * 0.36, 1.12], 0.15, 0.03, M_GOLD, { seg: 20, rseg: 6 }); B.torZ([-0.61, s * 0.36, 1.0], 0.175, 0.022, M_GOLD, { seg: 20, rseg: 6 }); }
      // the cockpit: a dark oval recess, a violet cradle ring; the gold ribs round it, the crest above, the keel below
      B.ell([0.41, 0, 0.64], [0.06, 0.29, 0.32], M_DARK, { seg: 20, rings: 6 });
      B.torX([0.45, 0, 0.62], 0.2, 0.02, M_VIO, { seg: 20, rseg: 5 });
      for (let i = 0; i < 4; i++) { const ry = 0.3 + 0.07 * i, rz = 0.34 + 0.06 * i, x0 = 0.4 - 0.028 * i, tr = 0.038 - 0.004 * i, s0 = Math.min(0.99, (0.27 + 0.03 * i) / rz), a0 = Math.asin(s0);
        B.push([0, ry, 0], [0, 0, rz], [1, 0, 0], [x0, 0, 0.64]); B.tor([0, 0, 0], 1, tr / Math.min(ry, rz), M_GOLD, { seg: 30, rseg: 6, ph0: Math.PI - a0, ph1: Math.PI * 2 + a0 }); B.pop(); }
      B.tube([0.42, 0, 0.96], [0.44, 0, 1.12], 0.05, 0.008, M_GOLD, { seg: 10 });
      for (const s of [-1, 1]) B.tube([0.42, 0, 0.97], [0.37, s * 0.22, 1.06], 0.034, 0.008, M_GOLD, { seg: 8 });
      B.box([0.38, 0, 0.26], [0.035, 0.12, 0.08], 0.012, M_GOLD); B.sph([0.41, 0, 0.26], 0.04, M_ENAM, 10);
      // the shoulder sockets, the neck, the rope belt and its knot
      for (const s of [-1, 1]) B.sph([0, s * 0.78, 0.86], 0.19, M_GUN, 14);
      B.tube([0.03, 0, 0.98], [0.03, 0, 1.3], 0.1, 0.1, M_GUN, { seg: 14 });
      B.torZ([0, 0, 0.07], 0.3, 0.045, M_ROPE, { seg: 30, rseg: 7 }); B.sph([0.3, 0, 0.05], 0.07, M_ROPE, 10);
      out.torso = G(B); }
    // ---- the pelvis ----
    { const B = nb();
      B.box([0, 0, 0], [0.24, 0.34, 0.17], 0.08, M_OBS);
      B.box([0.21, 0, -0.04], [0.035, 0.13, 0.17], 0.035, M_GOLD); B.box([0.224, 0, -0.04], [0.03, 0.1, 0.14], 0.03, M_OBS);
      B.push([1, 0, 0], [0, Math.SQRT1_2, Math.SQRT1_2], [0, -Math.SQRT1_2, Math.SQRT1_2], [0.255, 0, -0.03]); B.box([0, 0, 0], [0.012, 0.042, 0.042], 0.008, M_ENAM); B.pop();
      for (const s of [-1, 1]) { B.sph([0, s * 0.4, -0.1], 0.17, M_GUN, 14); B.torY([0, s * 0.47, -0.1], 0.15, 0.028, M_GOLD, { seg: 20, rseg: 6 });
        B.box([0, s * 0.4, -0.01], [0.18, 0.035, 0.13], 0.04, M_GOLD); B.box([0, s * 0.414, -0.01], [0.155, 0.03, 0.105], 0.035, M_OBS); }
      B.torZ([0, 0, 0.18], 0.25, 0.026, M_GOLD, { seg: 26, rseg: 6 }); B.tube([0, 0, 0.1], [0, 0, 0.26], 0.11, 0.11, M_GUN, { seg: 14 });
      out.pelvis = G(B); }
    // ---- the rear half-skirt: a curved panel round an axis 0.26 in front of the hinge, a gold border, a violet seam ----
    { const B = nb(), rad = z => 0.36 + 0.13 * Math.min(1, Math.max(0, -z / 0.8)), Z = [0.02, -0.04, -0.04, -0.646, -0.646, -0.674, -0.674, -0.76, -0.76, -0.8], ZM = [M_GOLD, M_GOLD, M_OBS, M_OBS, M_VIO, M_VIO, M_OBS, M_OBS, M_GOLD, M_GOLD];
      const TH = [-1.2, -1.12, -1.12, 1.12, 1.12, 1.2], TM = [M_GOLD, M_GOLD, -1, -1, M_GOLD, M_GOLD];
      for (const side of [1, -1]) { const off = side * 0.034;
        for (let a = 0; a < TH.length - 1; a++) { if (TH[a] === TH[a + 1]) continue;
          for (let k = 0; k < Z.length - 1; k++) { if (Z[k] === Z[k + 1]) continue; const mat = TM[a] >= 0 ? TM[a] : ZM[k];
            B.surf((u, v) => { const th = TH[a] + (TH[a + 1] - TH[a]) * u, z = Z[k] + (Z[k + 1] - Z[k]) * v, r = rad(z) + off; return [0.26 - r * Math.cos(th), r * Math.sin(th), z]; }, TM[a] >= 0 ? 1 : 14, 2, () => mat, { flip: side < 0, e: (u, v) => TM[a] >= 0 || ZM[k] === M_GOLD ? 0.8 : 0 }); } } }
      for (const z of [0.02, -0.8]) B.surf((u, v) => { const th = -1.2 + 2.4 * u, r = rad(z) - 0.034 + 0.068 * v; return [0.26 - r * Math.cos(th), r * Math.sin(th), z]; }, 16, 1, () => M_GOLD, { flip: z < 0, e: () => 1 });
      for (const th of [-1.2, 1.2]) B.surf((u, v) => { const z = 0.02 - 0.82 * u, r = rad(z) - 0.034 + 0.068 * v; return [0.26 - r * Math.cos(th), r * Math.sin(th), z]; }, 4, 1, () => M_GOLD, { flip: th > 0, e: () => 1 });
      // the engraved crescent, raised in gold
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0]); for (let i = 0; i <= 10; i++) { const t = -1 + 2 * i / 10, th = t * 0.33, z = -0.42 + 0.15 * Math.cos(t * 1.4) - 0.0, r = rad(z) + 0.04; if (i) { const tp = -1 + 2 * (i - 1) / 10, thp = tp * 0.33, zp = -0.42 + 0.15 * Math.cos(tp * 1.4), rp = rad(zp) + 0.04; B.tube([0.26 - rp * Math.cos(thp), rp * Math.sin(thp), zp], [0.26 - r * Math.cos(th), r * Math.sin(th), z], 0.012, 0.012, M_GOLD, { seg: 5 }); } } B.pop();
      B.tube([0, -0.2, 0], [0, 0.2, 0], 0.036, 0.036, M_GUN, { seg: 10 });
      out.skirt = G(B); }
    // ---- the helmet ----
    { const B = nb();
      B.ell([-0.02, 0, 0.26], [0.24, 0.215, 0.22], M_OBS, { seg: 22, rings: 10, th0: 0, th1: 2.53, cap: true, capM: M_GUN });
      for (const s of [-1, 1]) { const a = s * 0.33; B.push([Math.cos(a), Math.sin(a), 0], [-Math.sin(a), Math.cos(a), 0], [0, 0, 1], [0.14, s * 0.06, 0.17]); B.box([0, 0, 0], [0.045, 0.075, 0.105], 0.03, M_GOLD); B.box([0.012, 0, 0], [0.04, 0.062, 0.09], 0.028, M_GUN); B.pop();
        B.push([1, 0, 0], [0, Math.cos(0.25), s * Math.sin(0.25)], [0, -s * Math.sin(0.25), Math.cos(0.25)], [0.205, s * 0.068, 0.235]); B.box([0, 0, 0], [0.012, 0.045, 0.011], 0.006, M_EYE); B.pop();
        B.tube([0.17, 0, 0.32], [0.12, s * 0.17, 0.3], 0.026, 0.022, M_GOLD, { seg: 8 });
        B.tube([0.17, s * 0.04, 0.33], [0.14, s * 0.14, 0.54], 0.036, 0.026, M_GOLD, { seg: 8 }); B.tube([0.14, s * 0.14, 0.54], [0.05, s * 0.21, 0.79], 0.026, 0.005, M_GOLD, { seg: 8 });
        B.box([-0.03, s * 0.2, 0.2], [0.09, 0.022, 0.07], 0.02, M_GOLD); B.box([-0.03, s * 0.208, 0.2], [0.075, 0.018, 0.055], 0.016, M_OBS); }
      B.tube([0.19, 0, 0.33], [0.17, 0, 0.52], 0.03, 0.004, M_GOLD, { seg: 8 }); B.sph([0.205, 0, 0.33], 0.028, M_VIO, 8);
      for (let i = 0; i < 2; i++) { const zz = 0.1 - 0.065 * i, r = [0.23 + 0.03 * i, 0.22 + 0.03 * i, 0.09]; B.ell([-0.04, 0, zz], r, M_OBS, { seg: 16, rings: 3, th0: 1.0, th1: 1.75, ph0: Math.PI * 0.45, ph1: Math.PI * 1.55 }); B.ell([-0.04, 0, zz], r, M_GOLD, { seg: 16, rings: 1, th0: 1.75, th1: 2.0, ph0: Math.PI * 0.45, ph1: Math.PI * 1.55 }); }
      out.helmet = G(B); }
    // ---- the shoulder drums (one each side: the rope knot hangs outward) ----
    for (const s of [-1, 1]) { const B = nb();
      B.tube([-0.02, s * 0.03, 0.04], [-0.02, s * 0.49, 0.04], 0.4, 0.4, M_OBS, { seg: 28, cap0: 'flat', cap1: 'flat', up: [0, 0, 1] });
      for (const wi of [0.04, 0.48]) B.torY([-0.02, s * wi, 0.04], 0.4, 0.042, M_GOLD, { seg: 30, rseg: 6 });
      for (const wi of [0.15, 0.26, 0.37]) B.torY([-0.02, s * wi, 0.04], 0.43, 0.058, M_ROPE, { seg: 30, rseg: 7 });
      for (let i = 0; i < 3; i++) { const c = [-0.02, s * 0.3, 0.02 + 0.07 * i], r = [0.58 - 0.06 * i, 0.46 - 0.05 * i, 0.55 - 0.07 * i], cut = 0.12 + 0.02 * i, t1 = Math.acos(Math.min(0.99, cut / r[2]));
        B.ell(c, r, M_OBS, { seg: 26, rings: 7, th0: 0, th1: t1 - 0.12 }); B.ell(c, [r[0] + 0.004, r[1] + 0.004, r[2] + 0.004], M_GOLD, { seg: 26, rings: 2, th0: t1 - 0.12, th1: t1, cap: true, capM: M_OBS });
        B.ell(c, [r[0] + 0.024, 0.04, r[2] + 0.024], M_GOLD, { seg: 4, rings: 8, th0: 0, th1: t1 - 0.05 }); }
      B.tube([-0.24, s * 0.3, 0.1], [-0.46, s * 0.36, 0.14], 0.09, 0.09, M_GUN, { seg: 12 });
      B.sph([0.3, s * 0.27, -0.3], 0.075, M_ROPE, 10); B.tube([0.3, s * 0.27, -0.33], [0.33, s * 0.29, -0.52], 0.03, 0.05, M_ROPE, { seg: 8, cap1: 'flat' });
      out[s < 0 ? 'drumL' : 'drumR'] = G(B); }
    // ---- a wing hub ----
    { const B = nb();
      B.tube([0, 0, -0.04], [0, 0, 0.04], 0.2, 0.2, M_GOLD, { seg: 30, cap0: 'flat', cap1: 'flat' });
      B.torZ([0, 0, 0], 0.2, 0.03, M_GOLD, { seg: 36, rseg: 5, teeth: 36, tooth: 0.016 });
      B.tube([0, 0, -0.055], [0, 0, 0.055], 0.165, 0.165, M_GUN, { seg: 26, cap0: 'flat', cap1: 'flat' });
      B.tube([0, 0, -0.01], [0, 0, 0.072], 0.075, 0.075, M_VIO, { seg: 16, cap0: 'flat', cap1: 'flat' });
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); B.tube([c * 0.08, sn * 0.08, 0.06], [c * 0.15, sn * 0.15, 0.06], 0.016, 0.016, M_STEEL, { seg: 6 }); }
      out.hub = G(B); }
    // ---- a wing blade: the spar, then the curved engraved scimitar, lens-thick, its outer edge violet ----
    { const B = nb(), BLc = BL;
      B.tube([-0.04, 0, 0], [0.36, 0, 0], 0.05, 0.04, M_GUN, { seg: 8 }); B.torX([0.14, 0, 0], 0.05, 0.016, M_GOLD, { seg: 10, rseg: 4 }); B.torX([0.3, 0, 0], 0.045, 0.014, M_GOLD, { seg: 10, rseg: 4 });
      // across the blade: knots (fraction from the inner edge -wi to the outer +wo) and their materials
      const KN = [[0, M_SILV], [0.1, M_SILV], [0.1, M_BLADE], [0.82, M_BLADE], [0.82, M_SILV], [0.9, M_SILV], [0.9, M_VEDGE], [1, M_VEDGE]];
      const pt = (x, f, sg) => { const w = bladeW(x), wo = w * 0.62, wi = w * 0.38, v = -wi + (wo + wi) * f, mid = (wo - wi) / 2, hw = Math.max(1e-3, (wo + wi) / 2), q = Math.max(0, 1 - Math.pow((v - mid) / hw, 2)), th = 0.004 + 0.034 * Math.sqrt(q) * (0.4 + 0.6 * Math.min(1, w / 0.12)); return [x, bladeC(x) + v, sg * th]; };
      const NX = 10, xs = u => 0.27 + (BLc - 0.27) * u;
      for (const sg of [1, -1]) for (let k = 0; k < KN.length - 1; k++) { if (KN[k][0] === KN[k + 1][0]) continue; const f0 = KN[k][0], f1 = KN[k + 1][0], mat = KN[k][1];
        B.surf((u, v) => pt(xs(u), f0 + (f1 - f0) * v, sg), NX, f1 - f0 > 0.3 ? 2 : 1, () => mat, { flip: sg < 0, e: () => mat === M_SILV ? 0.6 : 0 }); }
      out.blade = G(B); }
    // ---- the sword ----
    { const B = nb();
      B.sph([-0.45, 0, 0], 0.072, M_GOLD, 12); B.tube([-0.45, 0, 0], [-0.36, 0, 0], 0.045, 0.05, M_GOLD, { seg: 12 });
      B.tube([-0.37, 0, 0], [0.08, 0, 0], 0.052, 0.056, M_GRIP, { seg: 14, rings: 4 });
      B.box([0.14, 0, 0], [0.07, 0.15, 0.075], 0.035, M_GOLD);
      for (const s of [-1, 1]) { B.tube([0.13, s * 0.1, 0], [0.28, s * 0.3, 0], 0.055, 0.03, M_GOLD, { seg: 8 }); B.tube([0.28, s * 0.3, 0], [0.44, s * 0.38, 0], 0.03, 0.006, M_GOLD, { seg: 8 });
        B.tube([0.13, s * 0.1, 0], [0.02, s * 0.26, 0], 0.038, 0.008, M_GOLD, { seg: 7 }); B.tube([0.2, s * 0.06, 0], [0.36, s * 0.2, 0], 0.026, 0.004, M_GOLD, { seg: 6 });
        B.sph([0.15, 0, s * 0.07], 0.042, M_ENAM, 10); }
      B.torX([0.07, 0, 0], 0.07, 0.02, M_GOLD, { seg: 14, rseg: 5 });
      B.box([0.27, 0, 0], [0.05, 0.186, 0.05], 0.02, M_GOLD);
      // the blade: across it, from one edge to the other: silver bevel, black metal, gold filigree band, black, the violet channel (recessed)
      const ys = x => { const w = swW(x); return [[-w, M_SILV], [-(w - 0.05), M_SILV], [-(w - 0.05), M_OBS], [-0.08, M_OBS], [-0.08, M_GOLD], [-0.055, M_GOLD], [-0.055, M_OBS], [-0.036, M_OBS], [-0.036, M_VIO], [0.036, M_VIO], [0.036, M_OBS], [0.055, M_OBS], [0.055, M_GOLD], [0.08, M_GOLD], [0.08, M_OBS], [w - 0.05, M_OBS], [w - 0.05, M_SILV], [w, M_SILV]]; };
      const tz = (x, y) => { const w = swW(x), bev = Math.max(0, Math.abs(y) - (w - 0.05)); let t = Math.max(0.006, 0.046 - bev * 0.8); if (Math.abs(y) < 0.0361 && x > 0.35 && x < 2.7) t = 0.03; return t; };
      const NXs = 34, xs = u => SW.base + (SW.tip - SW.base) * u, NK = 18;
      for (const sg of [1, -1]) for (let k = 0; k < NK - 1; k++) { const mk = ys(1)[k][1]; if (ys(1)[k][0] === ys(1)[k + 1][0]) continue;
        B.surf((u, v) => { const x = xs(u), K = ys(x), y = K[k][0] + (K[k + 1][0] - K[k][0]) * v, inGap = x < 0.35 || x > 2.7; const m2 = (mk === M_VIO || mk === M_GOLD) && inGap; void m2; return [x, y, sg * tz(x, y)]; }, NXs, 1, () => mk, { flip: sg < 0, e: () => mk === M_SILV ? 0.7 : 0 }); }
      out.sword = G(B); }
    // ---- the upper arm ----
    { const B = nb();
      B.tube([0.02, 0, 0], [LUA - 0.05, 0, 0], 0.15, 0.13, M_GUN, { seg: 14 });
      for (let i = 0; i < 3; i++) { const x0 = 0.04 + i * 0.21, R0 = 0.245 - 0.012 * i;
        B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0.02]); B.lathe([[x0, R0 - 0.06, M_OBS], [x0, R0, M_OBS], [x0 + 0.215, R0 + 0.03, M_OBS], [x0 + 0.215, R0 + 0.03, M_GOLD], [x0 + 0.25, R0 + 0.035, M_GOLD], [x0 + 0.25, R0 - 0.04, M_GOLD]], M_OBS, { seg: 22, edge: j => j >= 3 ? 0.8 : 0 }); B.pop(); }
      for (const s of [-1, 1]) { B.tube([0.12, s * 0.07, -0.17], [0.66, s * 0.07, -0.15], 0.03, 0.03, M_STEEL, { seg: 8 }); B.tube([0.1, s * 0.07, -0.17], [0.38, s * 0.07, -0.16], 0.045, 0.045, M_GUN, { seg: 8 }); }
      B.tube([0.15, 0, -0.2], [0.6, 0, -0.19], 0.028, 0.028, M_CABLE, { seg: 6 });
      B.sph([LUA, 0, 0], 0.19, M_GUN, 14); goldRing(B, [LUA, 0, 0], 0.18, 0.035); B.sph([LUA, 0, -0.15], 0.05, M_VIO, 8);
      out.uarm = G(B); }
    // ---- the forearm gauntlet ----
    { const B = nb();
      B.tube([0, 0, 0], [LFA, 0, 0], 0.15, 0.13, M_GUN, { seg: 14 });
      for (let i = 0; i < 4; i++) { const x0 = 0.04 + i * 0.16, Rr = 0.2 + 0.024 * i + 0.011; B.box([x0 + 0.08, 0, 0.01], [0.08, Rr, Rr * 1.05], 0.065, M_OBS); B.box([x0 + 0.165, 0, 0.01], [0.012, Rr + 0.006, Rr * 1.05 + 0.006], 0.055, M_GOLD); }
      B.box([0.38, 0, 0.3], [0.3, 0.11, 0.045], 0.035, M_GOLD); B.box([0.38, 0, 0.318], [0.27, 0.085, 0.04], 0.03, M_OBS);
      for (let i = 0; i < 5; i++) B.box([0.17 + i * 0.085, 0, 0.358], [0.013, 0.055, 0.004], 0.003, M_VIO);
      B.sph([LFA, 0, 0], 0.12, M_STEEL, 12);
      out.farm = G(B); }
    // ---- the fist ----
    { const B = nb();
      B.box([0, 0, 0.09], [0.118, 0.098, 0.062], 0.03, M_GOLD); B.box([0, 0, 0.102], [0.1, 0.08, 0.066], 0.03, M_OBS);
      for (let j = 0; j < 4; j++) { const xj = -0.08 + j * 0.053; B.torX([xj, 0, 0], 0.084, 0.027, M_GUN, { seg: 16, rseg: 6 }); B.torX([xj, 0, 0], 0.086, 0.032, M_GOLD, { seg: 6, rseg: 6, ph0: 0.7, ph1: 2.45 }); }
      B.tube([0.11, 0.075, 0.07], [0.105, 0.095, -0.035], 0.034, 0.028, M_GUN, { seg: 8 });
      for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) B.sph([-0.07 + j * 0.14, -0.06 + k * 0.12, 0.168], 0.013, M_STEEL, 6);
      B.tube([0, 0, 0.12], [0, 0, 0.2], 0.075, 0.075, M_GUN, { seg: 12 }); B.torZ([0, 0, 0.16], 0.078, 0.02, M_GOLD, { seg: 16, rseg: 5 });
      out.hand = G(B); }
    // ---- the thigh (its plating laid out on 0.76, stretched to the long thigh) ----
    { const B = nb();
      B.tube([0.02, 0, 0], [LTH - 0.05, 0, 0], 0.17, 0.15, M_GUN, { seg: 14 });
      B.push([XT, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0]);
      for (let i = 0; i < 3; i++) { const x0 = i * 0.22, R0 = 0.31 - 0.02 * i;
        B.push([1, 0, 0], [0, 1.06, 0], [0, 0, 1], [0, 0, 0.02]); B.lathe([[x0, R0 - 0.07, M_OBS], [x0, R0, M_OBS], [x0 + 0.24, R0 + 0.027, M_OBS], [x0 + 0.24, R0 + 0.027, M_GOLD], [x0 + 0.27, R0 + 0.03, M_GOLD], [x0 + 0.27, R0 - 0.05, M_GOLD]], M_OBS, { seg: 24, edge: j => j >= 3 ? 0.8 : 0 }); B.pop(); }
      for (const s of [-1, 1]) { B.box([0.38, s * 0.33, -0.02], [0.27, 0.035, 0.16], 0.05, M_GOLD); B.box([0.38, s * 0.346, -0.02], [0.245, 0.03, 0.135], 0.045, M_OBS);
        B.tube([0.1, s * 0.08, -0.2], [0.64, s * 0.08, -0.18], 0.032, 0.032, M_STEEL, { seg: 8 }); B.tube([0.08, s * 0.08, -0.2], [0.34, s * 0.08, -0.19], 0.05, 0.05, M_GUN, { seg: 8 }); }
      B.pop();
      B.sph([LTH, 0, 0], 0.2, M_GUN, 14);
      for (const s of [-1, 1]) { B.push([1, 0, 0], [0, 0, 1], [0, -s, 0], [LTH, s * 0.25, 0]); B.tube([0, 0, -0.045], [0, 0, 0.045], 0.21, 0.21, M_GOLD, { seg: 24, cap0: 'flat', cap1: 'flat', up: [1, 0, 0] }); B.pop();
        B.torY([LTH, s * 0.25, 0], 0.205, 0.035, M_GOLD, { seg: 24, rseg: 5, teeth: 24, tooth: 0.018 });
        B.push([1, 0, 0], [0, 0, 1], [0, -s, 0], [LTH, s * 0.29, 0]); B.tube([0, 0, -0.03], [0, 0, 0.032], 0.13, 0.13, M_OBS, { seg: 18, cap0: 'flat', cap1: 'flat', up: [1, 0, 0] }); B.pop(); }
      B.ell([LTH, 0, 0.09], [0.24, 0.26, 0.18], M_OBS, { seg: 20, rings: 6, th0: 0, th1: 1.3 }); B.ell([LTH, 0, 0.09], [0.245, 0.265, 0.185], M_GOLD, { seg: 20, rings: 2, th0: 1.3, th1: 1.62, cap: true, capM: M_GUN });
      B.sph([LTH, 0, 0.27], 0.045, M_VIO, 8);
      out.thigh = G(B); }
    // ---- the shin (likewise stretched to the long shin) ----
    { const B = nb();
      B.push([XS, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, 0]);
      B.box([0.3, 0, 0], [0.28, 0.24, 0.25], 0.085, M_OBS); B.box([0.56, 0, 0], [0.024, 0.248, 0.258], 0.08, M_GOLD);
      B.box([0.63, 0, -0.01], [0.14, 0.21, 0.22], 0.07, M_OBS); B.box([0.74, 0, -0.01], [0.02, 0.216, 0.226], 0.065, M_GOLD);
      B.box([0.32, 0, 0.255], [0.21, 0.135, 0.03], 0.03, M_GOLD); B.box([0.32, 0, 0.268], [0.175, 0.1, 0.025], 0.02, M_ENAM);
      for (const s of [-1, 1]) B.box([0.32, s * 0.25, 0], [0.24, 0.02, 0.05], 0.015, M_GOLD);
      for (let i = 0; i < 5; i++) B.box([0.16 + i * 0.08, 0, -0.253], [0.013, 0.07, 0.006], 0.004, M_VIO);
      B.pop();
      B.sph([LSH, 0, 0], 0.12, M_STEEL, 12); B.tube([0, 0, 0], [0.12, 0, 0], 0.15, 0.15, M_GUN, { seg: 14 });
      out.shin = G(B); }
    // ---- the foot ----
    { const B = nb();
      B.box([0.08, 0, -0.07], [0.24, 0.14, 0.065], 0.045, M_OBS);
      for (let i = 0; i < 3; i++) { const x0 = 0.14 + i * 0.09; B.box([x0 + 0.045, 0, -0.05 - i * 0.012], [0.055, 0.13 - 0.02 * i, 0.06 - 0.008 * i], 0.03, M_OBS); B.box([x0 + 0.098, 0, -0.05 - i * 0.012], [0.014, 0.128 - 0.02 * i, 0.058 - 0.008 * i], 0.012, M_GOLD); }
      B.tube([-0.1, 0, -0.06], [-0.24, 0, -0.11], 0.05, 0.012, M_GUN, { seg: 8 });
      B.ell([0, 0, 0], [0.165, 0.155, 0.115], M_GOLD, { seg: 18, rings: 5, th0: 0, th1: 1.75 });
      B.box([0.08, 0, -0.136], [0.14, 0.06, 0.006], 0.004, M_VIO);
      out.foot = G(B); }
    // ---- the chest hatch: a heart-shaped shield, gold frame, obsidian field (filigree in the shader), crimson stone ----
    { const B = nb(), body = (y, zc) => { const ay = Math.abs(y), lobe = Math.hypot(ay - 0.14, zc - 0.12) - 0.2, pt = (ay * 0.95 + (-zc - 0.02) * 0.62) - 0.25; return Math.max(Math.min(lobe, Math.max(pt, zc - 0.14)), -zc - 0.42); };
      const outline = (ins) => { const pts = [], cy = 0, cz = -0.06; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, dy = Math.cos(a), dz = Math.sin(a); let lo = 0, hi = 0.6; for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (body(cy + dy * m, cz + dz * m) < -ins) lo = m; else hi = m; } pts.push([cy + dy * lo, cz + dz * lo - 0.3]); } return pts; };
      B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0, 0]);
      B.prism(outline(0), -0.035, 0.035, M_GOLD, { b: 0.018 });
      B.prism(outline(0.06), 0.0, 0.058, M_OBS, { b: 0.012 });
      B.prism(outline(0.105), 0.0, 0.07, M_GOLD, { b: 0.01 }); B.prism(outline(0.12), 0.0, 0.078, M_OBS, { b: 0.012 });
      B.pop();
      B.tube([0.04, 0, -0.32], [0.11, 0, -0.32], 0.085, 0.085, M_GOLD, { seg: 18, cap0: 'flat', cap1: 'flat' }); B.sph([0.12, 0, -0.32], 0.05, M_ENAM, 12);
      for (const s2 of [-1, 1]) B.tube([0.09, s2 * 0.06, -0.2], [0.09, s2 * 0.2, -0.12], 0.016, 0.006, M_GOLD, { seg: 6 });
      B.tube([0, -0.18, 0], [0, 0.18, 0], 0.032, 0.032, M_GUN, { seg: 10 });
      out.hatch = G(B); }
    // ---- a thruster pod ----
    { const B = nb(), pr = [];
      for (let x = 0.04; x <= 0.66 + 1e-6; x += 0.03) pr.push([x, Math.round((x - 0.04) / 0.03) % 2 ? 0.144 : 0.155, M_GUN]);
      B.lathe(pr, M_GUN, { seg: 18 }); for (const xc of [0.1, 0.52]) goldRing(B, [xc, 0, 0], 0.16, 0.028, 20);
      B.tube([0.275, 0, 0], [0.345, 0, 0], 0.169, 0.169, M_ENAM, { seg: 20, cap0: 'flat', cap1: 'flat' });
      B.lathe([[0.62, 0.1, M_STEEL], [0.64, 0.12, M_STEEL], [0.8, 0.19, M_STEEL], [0.8, 0.17, M_STEEL], [0.66, 0.1, M_STEEL]], M_STEEL, { seg: 20, edge: j => j === 2 ? 1 : 0 });
      B.tube([0.66, 0, 0], [0.72, 0, 0], 0.1, 0.1, M_VIO, { seg: 16, cap0: 'flat', cap1: 'flat' });
      B.sph([0.04, 0, 0], 0.14, M_GUN, 14); B.tube([-0.02, 0, 0], [-0.08, 0, 0], 0.06, 0.06, M_STEEL, { seg: 10 });
      out.pod = G(B); }
    // ---- a rail arm link ----
    { const B = nb();
      B.box([LRAIL / 2, 0, 0], [LRAIL / 2 - 0.04, 0.06, 0.08], 0.025, M_GUN);
      for (const s of [-1, 1]) B.box([LRAIL / 2, s * 0.062, 0], [LRAIL / 2 - 0.08, 0.004, 0.035], 0.003, M_GOLD);
      B.tube([0.12, 0, 0.1], [LRAIL - 0.14, 0, 0.1], 0.024, 0.024, M_STEEL, { seg: 8 });
      for (const xc of [0, LRAIL]) { B.sph([xc, 0, 0], 0.1, M_GUN, 12); B.torY([xc, 0, 0], 0.1, 0.02, M_GOLD, { seg: 16, rseg: 5 }); }
      out.rail = G(B); }
    // ---- the sword cradle ----
    { const B = nb();
      B.box([0.28, 0, 0], [0.27, 0.05, 0.045], 0.02, M_GUN); B.sph([0, 0, 0], 0.07, M_STEEL, 10);
      for (const s of [-1, 1]) B.tube([0.52, s * 0.06, 0], [0.66, s * 0.1, 0], 0.03, 0.015, M_GOLD, { seg: 7 });
      B.box([0.55, 0, 0], [0.04, 0.09, 0.05], 0.015, M_GOLD);
      out.cradle = G(B); }
    // ---- the pilot's seat ----
    { const B = nb();
      B.box([-0.09, 0, 0.13], [0.025, 0.12, 0.15], 0.03, M_ENAM);
      B.box([-0.11, 0, 0.31], [0.022, 0.15, 0.018], 0.01, M_GOLD); B.box([-0.11, 0, -0.05], [0.022, 0.15, 0.018], 0.01, M_GOLD);
      for (const s of [-1, 1]) B.box([-0.11, s * 0.15, 0.13], [0.022, 0.018, 0.18], 0.01, M_GOLD);
      B.box([0, 0, -0.01], [0.09, 0.12, 0.02], 0.015, M_GOLD);
      out.seat = G(B); }
    out.drum = null;
    return out;
  }

  /* ================= materials, shading ================= */
  const CW = [0, VY, VZ], EXW = [1, 0, 0], EYW = vcross(CW, EXW);   // the camera: toward the viewer; screen right; screen down
  const LW = nrm([-0.5, 0.3, 0.82]), SBW = nrm([-0.2, -0.38, 0.9]), RIMW = nrm([0.55, -0.72, 0.42]), UPW = [0, 0, 1];
  const KEYC = [1.5, 1.42, 1.36], RIMC = [0.8, 0.55, 1.45], SKYC = [0.66, 0.64, 0.8], GNDC = [0.22, 0.16, 0.26];
  /* albedo, F0, roughness, metal, emission */
  const MATS = [
    { a: [0.03, 0.026, 0.038], f: [0.17, 0.16, 0.21], r: 0.27, m: 1 },        // obsidian lacquer (dark metal under a clear coat)
    { a: [0.12, 0.12, 0.13], f: [0.55, 0.56, 0.6], r: 0.3, m: 1 },         // gunmetal (brushed)
    { a: [0.3, 0.3, 0.32], f: [0.95, 0.95, 0.98], r: 0.16, m: 1 },            // polished silver
    { a: [0.55, 0.38, 0.1], f: [1.0, 0.78, 0.36], r: 0.22, m: 1 },         // aged gold
    { a: [0.62, 0.05, 0.08], f: [0.06, 0.05, 0.05], r: 0.55, m: 0 },        // crimson braided rope
    { a: [0.32, 0.012, 0.035], f: [0.07, 0.06, 0.06], r: 0.12, m: 0 },      // crimson enamel / stone
    { a: [0.15, 0.04, 0.3], f: [0, 0, 0], r: 1, m: 0, e: [0.85, 0.32, 1.7] },     // violet energy
    { a: [0.012, 0.01, 0.016], f: [0.03, 0.03, 0.04], r: 0.6, m: 0 },        // a dark recess
    { a: [0.5, 0.3, 0.8], f: [0, 0, 0], r: 1, m: 0, e: [1.2, 0.85, 1.7] },        // the eyes
    { a: [0.5, 0.5, 0.55], f: [0.86, 0.86, 0.92], r: 0.3, m: 1 },           // engraved blade silver
    { a: [0.025, 0.022, 0.03], f: [0.05, 0.05, 0.06], r: 0.55, m: 0 },      // cable
    { a: [0.2, 0.2, 0.22], f: [0.7, 0.72, 0.77], r: 0.14, m: 1 },           // bright steel
    { a: [0.5, 0.35, 0.8], f: [0.7, 0.6, 0.85], r: 0.12, m: 1, e: [0.65, 0.25, 1.3] },  // the blade's violet edge
    { a: [0.4, 0.03, 0.05], f: [0.05, 0.04, 0.04], r: 0.5, m: 0 },          // crimson grip wrap
  ];
  const GLOWM = MATS.map(M => !!M.e);
  const tone = v => { v = Math.max(0, v); return v * (1 + v / 6) / (1 + v); };
  function env(B, rx, ry, rz, rough) {
    const up = rx * B.UP[0] + ry * B.UP[1] + rz * B.UP[2];
    let e = up >= 0 ? 0.18 + 0.48 * Math.pow(up, 1.2) : 0.13 + 0.06 * (1 + up);
    const hz = (up - 0.1) / (0.035 + rough * 0.3); e += 0.55 * Math.exp(-hz * hz) / (1 + rough * 2);
    const w = 0.05 + rough * 0.32, sb = rx * B.SB[0] + ry * B.SB[1] + rz * B.SB[2]; if (sb > 1 - 3 * w) e += 3.3 * sstep(1 - 2.6 * w, 1 - 0.25 * w, sb) / (1 + rough * 2.5);
    const rr = rx * B.RIM[0] + ry * B.RIM[1] + rz * B.RIM[2]; Q[4] = rr > 0.5 - w ? sstep(0.62 - w * 1.5, 0.97 - w * 0.5, rr) / (1 + rough * 2) : 0;
    return e;
  }
  let CUR_PART = '';
  /* the shade of one surface point (local frame B); E (if given) receives the emission for the glow layer */
  function shade(B, mat, x, y, z, nx, ny, nz, lap, ao, shd, o, E) {
    const M = MATS[mat]; let rough = M.r, ar = M.a[0], ag = M.a[1], ab = M.a[2], fr = M.f[0], fg = M.f[1], fb = M.f[2], cav = 0, wear = 0, er = 0, eg = 0, eb = 0;
    if (M.e) { er = M.e[0]; eg = M.e[1]; eb = M.e[2]; }
    if (mat === M_DARK) { const k = 0.6 + 0.4 * ao; o[0] = 0.016 * k; o[1] = 0.012 * k; o[2] = 0.024 * k; if (E) { E[0] = 0; E[1] = 0; E[2] = 0; } return; }
    if (mat === M_VIO || mat === M_EYE) { const ndv = Math.max(0, nx * B.V[0] + ny * B.V[1] + nz * B.V[2]), k = 0.55 + 0.6 * ndv * ndv, fl = 0.85 + 0.3 * vnoise(x * 30 + y * 7, z * 30);
      o[0] = tone(er * k * fl * 0.75); o[1] = tone(eg * k * fl * 0.75); o[2] = tone(eb * k * fl * 0.75); if (E) { E[0] = tone(er * 1.5 * k); E[1] = tone(eg * 1.5 * k); E[2] = tone(eb * 1.5 * k); } return; }
    const metal = M.m === 1;
    if (metal) {   // machining marks and dents (normal detail; the silhouette stays geometry)
      const q = 13, dk = mat === M_SILV || mat === M_BLADE ? 0.04 : 0.07; nx += (vnoise(y * q, z * q) - 0.5) * dk; ny += (vnoise(z * q + 3, x * q) - 0.5) * dk; nz += (vnoise(x * q, y * q + 7) - 0.5) * dk;
      // fine scratches: bright smoother streaks in two grains
      const s1 = Math.abs(fm(x * 13 + y * 8 + z * 5 + vnoise(x * 4, z * 4) * 2.5, 1) - 0.5), s2 = Math.abs(fm(x * -7 + y * 11 + z * 9 + vnoise(y * 4, x * 4) * 2.5, 1) - 0.5);
      if ((s1 < 0.014 && hsh(Math.floor(x * 13 + y * 8 + z * 5), Math.floor(z * 6)) > 0.62) || (s2 < 0.011 && hsh(Math.floor(y * 11 - x * 7), Math.floor(x * 5)) > 0.72)) { wear += 0.5; rough *= 0.55; }
    }
    if (mat === M_OBS) {   // black lacquer: a faint violet sheen; bevelled panels with dark seams and corner rivets (projected along the facing axis); worn patches
      const wn = vnoise(x * 6 + 3, y * 6 + z * 4); rough = Math.min(0.5, rough * (0.75 + 0.6 * wn)); fb *= 1 + 0.12 * wn;
      if (CUR_PART !== 'sword' && CUR_PART !== 'hatch') { const anx = Math.abs(nx), any = Math.abs(ny), anz = Math.abs(nz); let u, v, tu, tv;
        if (anz >= anx && anz >= any) { u = x; v = y; tu = 0; tv = 1; } else if (any >= anx) { u = x; v = z; tu = 0; tv = 2; } else { u = y; v = z; tu = 1; tv = 2; }
        const SU = 0.34, SV = 0.23, row = Math.floor(v / SV), fu = fm(u / SU + (row & 1) * 0.5, 1), fv = fm(v / SV, 1), du = Math.min(fu, 1 - fu) * SU, dv = Math.min(fv, 1 - fv) * SV, dm = Math.min(du, dv);
        if (dm < 0.008) cav += (1 - dm / 0.008) * 0.8;
        else if (dm < 0.022) { const k = (0.022 - dm) / 0.014 * 0.35, su = du < dv ? (fu < 0.5 ? 1 : -1) : 0, sv = du < dv ? 0 : (fv < 0.5 ? 1 : -1); const T0 = [0, 0, 0]; T0[tu] += su * k; T0[tv] += sv * k; nx += T0[0]; ny += T0[1]; nz += T0[2]; }
        const rd = hyp(du - 0.03, dv - 0.03); if (rd < 0.012 && hsh(Math.floor(u / SU * 2 + 0.5), Math.floor(v / SV * 2 + 0.5)) > 0.45) { const k = 1 - rd / 0.011; nx += (anx === Math.max(anx, any, anz) ? 0 : 0.3) * k; nz += 0.4 * k; fr = 0.85; fg = 0.85; fb = 0.9; rough = 0.18; cav = Math.max(0, cav - 0.3); if (rd > 0.008) cav += 0.4; } }
      const sc = vnoise(x * 44 + z * 21, y * 44 - z * 13); if (sc > 0.82) { wear += (sc - 0.82) * 2.2; }
    }
    if (mat === M_GUN) { const s2 = Math.abs(fm((x + z * 0.6) * 46 + vnoise(y * 9, x * 9) * 3, 1) - 0.5); if (s2 < 0.12) rough *= 0.6; else rough *= 1.08;   // (brushed grain)
      const pit = vnoise(x * 60 + z * 25, y * 60 - z * 19); if (pit > 0.8) cav += (pit - 0.8) * 2; }
    if (mat === M_GOLD) {   // aged gold: engraved vine scrolls, tarnish in the hollows
      const q = 26, u = x * q + Math.sin(z * q * 0.5) * 1.2, v = (y + z) * q * 0.7, sc = Math.abs(Math.sin(u) * 0.5 + Math.sin(v * 0.8 + Math.cos(u * 0.5) * 1.6) * 0.5);
      if (sc < 0.08) { cav += (0.08 - sc) * 7; rough = Math.min(0.6, rough + 0.15); }
      const wn = vnoise(x * 16, y * 16 + z * 9); rough *= 0.7 + 0.8 * wn; if (wn < 0.3) { fr *= 0.8; fg *= 0.72; fb *= 0.66; }
      const q2 = 40; nx += (vnoise(y * q2 + 5, z * q2) - 0.5) * 0.12; ny += (vnoise(z * q2, x * q2 + 9) - 0.5) * 0.12; nz += (vnoise(x * q2 + 3, y * q2) - 0.5) * 0.12;
    }
    if (mat === M_BLADE && CUR_PART === 'blade') {   // the wing blades' engraving: two scrolling vines across a band, a border line, little spirals
      const w = bladeW(x), v = y - bladeC(x), mid = w * 0.12, hw = w * 0.5, vv = (v - mid) / Math.max(0.02, hw);
      if (Math.abs(vv) < 0.75 && x > 0.4 && x < BL - 0.25) { const ph = x * 13, c1 = Math.abs(vv - 0.45 * Math.sin(ph)), c2 = Math.abs(vv + 0.45 * Math.sin(ph)), cc = hyp(fm(x * 13 / Math.PI, 1) - 0.5, vv * 0.6);
        if (Math.min(c1, c2) < 0.075 || Math.abs(cc - 0.16) < 0.03) { cav += 0.55; rough = 0.35; fr *= 0.55; fg *= 0.55; fb *= 0.6; nx += (vv > 0 ? 0.25 : -0.25); } }
      if (Math.abs(Math.abs(vv) - 0.85) < 0.04 && x > 0.4) cav += 0.35;
    }
    if (mat === M_BLADE && CUR_PART !== 'blade') { const sc = Math.abs(Math.sin(x * 22) * 0.5 + Math.sin(y * 30 + Math.cos(x * 11) * 2) * 0.5); if (sc < 0.06) cav += 0.4; }
    if (mat === M_ROPE) {   // a braid: two crossing helical grooves, fibres along the strands
      const a = (x * 1.3 + y + z * 0.7) * 52, b = (x * 0.7 - y * 1.1 + z * 1.2) * 52, f1 = Math.sin(a), f2 = Math.sin(b);
      nx += f1 * 0.35; ny += f2 * 0.35; nz += (f1 - f2) * 0.2; if (Math.abs(f1) < 0.2 || Math.abs(f2) < 0.2) cav += 0.35; const fb2 = vnoise(x * 120 + y * 40, z * 120); ar *= 0.8 + 0.4 * fb2;
    }
    if (mat === M_GRIP) { const an = Math.atan2(z, y), f1 = fm(x * 16 + an * 1.3, 1), f2 = fm(x * 16 - an * 1.3, 1); if (Math.min(f1, 1 - f1) < 0.1 || Math.min(f2, 1 - f2) < 0.1) cav += 0.6; else { nx += (f1 - 0.5) * 0.4; } }
    if (mat === M_ENAM) { const g = vnoise(x * 20, y * 20 + z * 10); ar *= 0.8 + 0.4 * g; }
    { const l = hyp3(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; }
    const edge = cl((lap - 7) / 22), crease = cl((-lap - 6) / 22); wear += edge * (mat === M_OBS ? 1.1 : mat === M_GOLD ? 0.9 : 0.5);
    const grime = Math.min(0.85, crease * 0.55 + (1 - ao) * 0.32 + cav * 0.5);
    if (wear > 0 && metal) { const v = Math.min(1, wear); if (mat === M_OBS) { fr = lerp(fr, 0.9, v * 0.75); fg = lerp(fg, 0.9, v * 0.75); fb = lerp(fb, 0.95, v * 0.75); rough = lerp(rough, 0.14, v); } else { fr = lerp(fr, 1.0, v * 0.45); fg = lerp(fg, mat === M_GOLD ? 0.92 : 0.95, v * 0.45); fb = lerp(fb, mat === M_GOLD ? 0.62 : 0.98, v * 0.45); } rough *= 1 - v * 0.4; }
    const L = B.L, V = B.V, ndl = nx * L[0] + ny * L[1] + nz * L[2], ndv = Math.max(0.001, nx * V[0] + ny * V[1] + nz * V[2]);
    const dif = (mat === M_ROPE ? Math.max(0, (ndl + 0.25) / 1.25) : Math.max(0, ndl)) * shd;
    const up = nx * B.UP[0] + ny * B.UP[1] + nz * B.UP[2], hm = 0.5 + 0.5 * up, amr = lerp(GNDC[0], SKYC[0], hm) * ao, amg = lerp(GNDC[1], SKYC[1], hm) * ao, amb = lerp(GNDC[2], SKYC[2], hm) * ao;
    const rx = 2 * ndv * nx - V[0], ry = 2 * ndv * ny - V[1], rz = 2 * ndv * nz - V[2], ev = env(B, rx, ry, rz, rough), ec = Q[4];
    const fk = Math.pow(1 - ndv, 5) * (1 - rough * 0.7), Fr = fr + (1 - fr) * fk, Fg = fg + (1 - fg) * fk, Fb = fb + (1 - fb) * fk;
    const Hh = B.Hh, nh = Math.max(0, nx * Hh[0] + ny * Hh[1] + nz * Hh[2]), pw = 2 / (rough * rough + 0.004), spec = Math.pow(nh, pw) * (pw + 2) / 8 * Math.max(0, ndl) * shd * 0.9;
    const aoS = Math.min(1, ao * (0.6 + 0.4 * shd) + 0.1) * (1 - cav * 0.6);
    const rimT = Math.pow(1 - ndv, 2.6) * Math.max(0, nx * B.RIM[0] + ny * B.RIM[1] + nz * B.RIM[2] + 0.35) * ao;
    let r, g, b;
    if (metal) { r = ar * (dif * KEYC[0] * 0.7 + amr * 0.5) + Fr * (ev * aoS + spec * KEYC[0]) + ec * RIMC[0] * Fr * aoS * 0.7; g = ag * (dif * KEYC[1] * 0.7 + amg * 0.5) + Fg * (ev * aoS + spec * KEYC[1]) + ec * RIMC[1] * Fg * aoS * 0.7; b = ab * (dif * KEYC[2] * 0.7 + amb * 0.5) + Fb * (ev * aoS + spec * KEYC[2]) + ec * RIMC[2] * Fb * aoS * 0.7; }
    else { const sk = mat === M_ENAM ? 5 : 2.5; r = ar * (dif * KEYC[0] + amr) + Fr * (ev * aoS * 0.6 + spec * KEYC[0] * sk) + ec * RIMC[0] * 0.15; g = ag * (dif * KEYC[1] + amg) + Fg * (ev * aoS * 0.6 + spec * KEYC[1] * sk) + ec * RIMC[1] * 0.15; b = ab * (dif * KEYC[2] + amb) + Fb * (ev * aoS * 0.6 + spec * KEYC[2] * sk) + ec * RIMC[2] * 0.15; }
    r += rimT * RIMC[0] * 0.45; g += rimT * RIMC[1] * 0.45; b += rimT * RIMC[2] * 0.45;
    if (mat === M_OBS || mat === M_ENAM) {   // a lacquer clear-coat: a sharp reflection of the studio (soft box, horizon, rim) and a tight key highlight over the metal
      const ccF = 0.04 + 0.96 * Math.pow(1 - ndv, 5), ccE = env(B, rx, ry, rz, 0.03), ccS = Math.pow(nh, 900) * 120 * Math.max(0, ndl) * shd, kk = (0.55 * ccF * (ccE + Q[4] * 0.8) * aoS + 0.025 * ccS) * (mat === M_ENAM ? 1.2 : 1);
      r += kk * 0.95; g += kk * 0.93; b += kk * 1.05; }
    const gk = (1 - grime) * 1.05;
    o[0] = tone(r * gk + er * 0.5); o[1] = tone(g * gk + eg * 0.5); o[2] = tone(b * gk + eb * 0.5);
    if (E) { const ek = GLOWM[mat] ? 1 : 0; E[0] = tone(er * 1.5 * ek); E[1] = tone(eg * 1.5 * ek); E[2] = tone(eb * 1.5 * ek); }
  }

  /* ================= views: the camera in a part's frame, quantised into bake keys ================= */
  const STEP = TAU / 16, TH0 = Math.asin(VZ);   // (an upright part, seen from the game camera, sits exactly on the elevation grid)
  const CAM0 = { C: CW, EX: EXW, EY: EYW };
  /* a studio camera: elevation and azimuth (degrees) about the model (studio views only; the game's is CAM0) */
  function camAt(el, az) { const e = el * Math.PI / 180, a = az * Math.PI / 180, C = [Math.cos(e) * Math.sin(a), Math.cos(e) * Math.cos(a), Math.sin(e)], EX = vnrm(vcross([0, 0, 1], C).map(v => -v)); const ex = vlen(EX) > 1e-4 ? EX : [1, 0, 0]; return { C, EX: ex, EY: vcross(C, ex) }; }
  const camIn = (Rw, K) => { K = K || CAM0; return { D: [vdot(Rw.x, K.C), vdot(Rw.y, K.C), vdot(Rw.z, K.C)], EX: [vdot(Rw.x, K.EX), vdot(Rw.y, K.EX), vdot(Rw.z, K.EX)], EY: [vdot(Rw.x, K.EY), vdot(Rw.y, K.EY), vdot(Rw.z, K.EY)] }; };
  /* the reference "down" for a full part's view (the part's -z across the view; its -x near the poles) */
  function refDown(D) { let r = Math.abs(D[2]) < 0.92 ? vsub([0, 0, -1], vmul(D, -D[2])) : vsub([-1, 0, 0], vmul(D, -D[0])); return vnrm(r); }
  /* the key of a view (and the exact camera axes in the part's frame) */
  function viewKey(P, cam) {
    const D = cam.D;
    if (P.kind === 'axis') { const qi = (((Math.round(Math.atan2(D[2], D[1]) / STEP)) % 16) + 16) % 16; return 'a' + qi; }
    const th = Math.asin(Math.max(-1, Math.min(1, D[2]))); let ti = Math.round((th - TH0) / STEP), thq = TH0 + ti * STEP; if (thq > Math.PI / 2 - 0.02) { thq = Math.PI / 2; } if (thq < -Math.PI / 2 + 0.02) { thq = -Math.PI / 2; }
    const pole = Math.abs(thq) > 1.5;
    const pi = pole ? 0 : (((Math.round(Math.atan2(D[1], D[0]) / STEP)) % 16) + 16) % 16;
    let ri = 0;
    if (!P.noRoll) { const Dq = dirOf(thq, pi * STEP), ref = refDown(Dq), ref2 = vcross(Dq, ref), ey = cam.EY; ri = (((Math.round(Math.atan2(vdot(ey, ref2), vdot(ey, ref)) / STEP)) % 16) + 16) % 16; }
    return 'f' + ti + '.' + pi + '.' + ri;
  }
  const dirOf = (th, ph) => [Math.cos(th) * Math.cos(ph), Math.cos(th) * Math.sin(ph), Math.sin(th)];
  /* the bake frame of a key: the image axes EX (right), EY (down) and D (toward the viewer), all in the part's frame,
     with the world's lights carried into it (they keep their place relative to the camera) */
  function frameOfKey(P, vk) {
    let EX, EY, D;
    if (vk[0] === 'a') { const a = +vk.slice(1) * STEP; D = [0, Math.cos(a), Math.sin(a)]; EX = [1, 0, 0]; EY = vcross(D, EX); }
    else { const p = vk.slice(1).split('.').map(Number), ti = p[0]; let th = TH0 + ti * STEP; th = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, th)); D = dirOf(th, p[1] * STEP); const ref = refDown(D), ref2 = vcross(D, ref), r = p[2] * STEP; EY = vnrm(vadd(vmul(ref, Math.cos(r)), vmul(ref2, Math.sin(r)))); EX = vcross(EY, D); }
    const toL = w => { const a = vdot(w, EXW), b = vdot(w, EYW), c = vdot(w, CW); return [a * EX[0] + b * EY[0] + c * D[0], a * EX[1] + b * EY[1] + c * D[1], a * EX[2] + b * EY[2] + c * D[2]]; };
    const L = toL(LW), V = D;
    return { EX, EY, D, L, V, SB: toL(SBW), RIM: toL(RIMW), UP: toL(UPW), Hh: vnrm(vadd(L, V)), axis: vk[0] === 'a', o: P.kind === 'axis' ? [0, 0, 0] : P.c, R: P.kind === 'axis' ? P.hw : P.R };
  }

  /* ================= the bake ================= */
  const GA = { hit: 0, t: 0, x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 0, mat: 0, ao: 0, sh: 0, lap: 0 }, NG = 12, AOS = [0.02, 0.05, 0.11, 0.22], AOW = [1, 0.7, 0.45, 0.3];
  /* one ray: image point (u, v) (units, from the frame's origin), marched along -D through the part's bound */
  let NTR = 0, FASTB = false;   // (FASTB: the quick pictures: no occlusion or shadow marches)
  function trace(B, f, u, v, G) {
    G.hit = 0; NTR++; const R = B.R, d2 = B.axis ? v * v : u * u + v * v; if (d2 > R * R) return;
    const EX = B.EX, EY = B.EY, D = B.D, o = B.o, ox = o[0] + u * EX[0] + v * EY[0], oy = o[1] + u * EX[1] + v * EY[1], oz = o[2] + u * EX[2] + v * EY[2];
    const hw = Math.sqrt(R * R - d2); let t = hw, hit = false, n = 0;
    while (t > -hw && n++ < 80) { f(ox + D[0] * t, oy + D[1] * t, oz + D[2] * t); const d = Q[0]; if (d < 0.0012) { hit = true; break; } t -= Math.max(d * 0.85, 0.0018); }
    if (!hit) return;
    const x = ox + D[0] * t, y = oy + D[1] * t, z = oz + D[2] * t, e = 0.004;
    f(x, y, z); const f0 = Q[0], mat = SM; f(x + e, y, z); const fxp = Q[0]; f(x - e, y, z); const fxm = Q[0]; f(x, y + e, z); const fyp = Q[0]; f(x, y - e, z); const fym = Q[0]; f(x, y, z + e); const fzp = Q[0]; f(x, y, z - e); const fzm = Q[0];
    let nx = fxp - fxm, ny = fyp - fym, nz = fzp - fzm; const nl = hyp3(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const lap = (fxp + fxm + fyp + fym + fzp + fzm - 6 * f0) / (e * e) * 0.35;
    let ao = 1; if (FASTB) ao = 0.82; else for (let i = 1; i < 4; i++) { const s2 = AOS[i]; f(x + nx * s2, y + ny * s2, z + nz * s2); ao -= AOW[i] * Math.max(0, s2 - Q[0]) / s2 * 0.42; } ao = cl(ao);
    let sh = 1; const L = B.L; if (FASTB) sh = 1; else if (L[0] * nx + L[1] * ny + L[2] * nz > -0.1) { let tt = 0.015; for (let i = 0; i < 11 && tt < 1.2; i++) { f(x + nx * 0.004 + L[0] * tt, y + ny * 0.004 + L[1] * tt, z + nz * 0.004 + L[2] * tt); const h = Q[0]; if (h < 0.001) { sh = 0; break; } sh = Math.min(sh, 7 * h / tt); tt += Math.max(0.02, h * 0.95); } sh = cl(sh); sh = sh * sh * (3 - 2 * sh); } else sh = 0;
    G.hit = 1; G.t = t; G.x = x; G.y = y; G.z = z; G.nx = nx; G.ny = ny; G.nz = nz; G.mat = mat; G.ao = ao; G.sh = sh; G.lap = lap;
  }
  let IMG = null; const SCR = {};
  function scratch(k, n, T) { const b = SCR[k]; if (b && b.length >= n) return b; return (SCR[k] = new T(Math.ceil(n * 1.25))); }
  const OUT = [0, 0, 0], EOUT = [0, 0, 0];
  const BK = { pri: new Map(), prn: 0, k: 0, spr: new Map(), byPart: {}, gen: null, genKey: '', queue: [], qset: new Set(), ms: 0, maxMs: 0, maxAt: '', n: 0, st: '', bytes: 0, spikes: [] };
  /* bake one picture (and its emission layer): geometry on every other pixel, full-resolution shading from it (traced
     afresh where the samples disagree), silhouette and material seams supersampled, a soft dark outline */
  function* bakeImg(B, f, k, glow, box, store, fast) {
    const W = box.W, Hh = box.H, ox = box.ox, oy = box.oy, CW2 = (W >> 1) + 2, CH = (Hh >> 1) + 2; yield; const Gd = scratch('g', CW2 * CH * NG, Float32Array); let tY = nowMs();
    const put = (q, G) => { if (!G.hit) { Gd[q] = -1; return; } Gd[q] = G.mat; Gd[q + 1] = G.t; Gd[q + 2] = G.x; Gd[q + 3] = G.y; Gd[q + 4] = G.z; Gd[q + 5] = G.nx; Gd[q + 6] = G.ny; Gd[q + 7] = G.nz; Gd[q + 8] = G.ao; Gd[q + 9] = G.sh; Gd[q + 10] = G.lap; };
    BK.st = 'geo';
    for (let j = 0; j < CH; j++) { const v = (j * 2 + 0.5 - oy) / k; for (let i = 0; i < CW2; i++) { trace(B, f, (i * 2 + 0.5 - ox) / k, v, GA); put((j * CW2 + i) * NG, GA); if (nowMs() - tY > 0.5) { yield; tY = nowMs(); } } }
    BK.st = 'shade'; yield; tY = nowMs();
    const NP = W * Hh, A = scratch('a', NP * 4, Float32Array).fill(0, 0, NP * 4), EA = glow ? scratch('e', NP * 3, Float32Array).fill(0, 0, NP * 3) : null, ID = scratch('i', NP, Int8Array).fill(-1, 0, NP), o = OUT, E = glow ? EOUT : null, w4 = [0, 0, 0, 0], ix = [0, 0, 0, 0];
    const putE = q => { if (EA) { EA[q * 3] = E[0]; EA[q * 3 + 1] = E[1]; EA[q * 3 + 2] = E[2]; } };
    for (let py = 0; py < Hh; py++) for (let px = 0; px < W; px++) {
      const i0 = px >> 1, j0 = py >> 1, fx = (px & 1) * 0.5, fy = (py & 1) * 0.5, q = py * W + px;
      ix[0] = (j0 * CW2 + i0) * NG; ix[1] = ix[0] + NG; ix[2] = ix[0] + CW2 * NG; ix[3] = ix[2] + NG; w4[0] = (1 - fx) * (1 - fy); w4[1] = fx * (1 - fy); w4[2] = (1 - fx) * fy; w4[3] = fx * fy;
      let ok = true, any = false; const m0 = Gd[ix[0]];
      for (let s = 0; s < 4; s++) { if (w4[s] === 0) continue; const qq = ix[s], m = Gd[qq]; if (m >= 0) any = true; if (m !== m0 || m < 0) { ok = false; continue; } if (Math.abs(Gd[qq + 1] - Gd[ix[0] + 1]) > 0.02 || Gd[qq + 5] * Gd[ix[0] + 5] + Gd[qq + 6] * Gd[ix[0] + 6] + Gd[qq + 7] * Gd[ix[0] + 7] < 0.9) ok = false; }
      if (ok && m0 >= 0) { let x = 0, y = 0, z = 0, nx = 0, ny = 0, nz = 0, ao = 0, sh = 0, lap = 0; for (let s = 0; s < 4; s++) { const w = w4[s]; if (w === 0) continue; const qq = ix[s]; x += Gd[qq + 2] * w; y += Gd[qq + 3] * w; z += Gd[qq + 4] * w; nx += Gd[qq + 5] * w; ny += Gd[qq + 6] * w; nz += Gd[qq + 7] * w; ao += Gd[qq + 8] * w; sh += Gd[qq + 9] * w; lap += Gd[qq + 10] * w; }
        const nl = hyp3(nx, ny, nz) || 1; shade(B, m0, x, y, z, nx / nl, ny / nl, nz / nl, lap, ao, sh, o, E); A[q * 4] = o[0]; A[q * 4 + 1] = o[1]; A[q * 4 + 2] = o[2]; A[q * 4 + 3] = 1; ID[q] = m0; putE(q); }
      else if (any && fast) { let bs = -1, bw = -1; for (let s2 = 0; s2 < 4; s2++) if (w4[s2] > bw && Gd[ix[s2]] >= 0) { bw = w4[s2]; bs = ix[s2]; } if (bw >= 0.25) { const qq = bs; shade(B, Gd[qq], Gd[qq + 2], Gd[qq + 3], Gd[qq + 4], Gd[qq + 5], Gd[qq + 6], Gd[qq + 7], Gd[qq + 10], Gd[qq + 8], Gd[qq + 9], o, E); A[q * 4] = o[0]; A[q * 4 + 1] = o[1]; A[q * 4 + 2] = o[2]; A[q * 4 + 3] = 1; ID[q] = Gd[qq]; } }   // (quick: the nearest sample's surface, no new ray)
      else if (any) { trace(B, f, (px + 0.5 - ox) / k, (py + 0.5 - oy) / k, GA); if (GA.hit) { shade(B, GA.mat, GA.x, GA.y, GA.z, GA.nx, GA.ny, GA.nz, GA.lap, GA.ao, GA.sh, o, E); A[q * 4] = o[0]; A[q * 4 + 1] = o[1]; A[q * 4 + 2] = o[2]; A[q * 4 + 3] = 1; ID[q] = GA.mat; putE(q); } }
      if (nowMs() - tY > 0.5) { yield; tY = nowMs(); } }
    BK.st = 'aa';
    if (!fast) for (let py = 0; py < Hh; py++) { for (let px = 0; px < W; px++) { const pi = py * W + px, id = ID[pi];
      if (!((px + 1 < W && ID[pi + 1] !== id) || (px > 0 && ID[pi - 1] !== id) || (py + 1 < Hh && ID[pi + W] !== id) || (py > 0 && ID[pi - W] !== id))) continue;
      let r = 0, g = 0, bb = 0, a = 0, e0 = 0, e1 = 0, e2 = 0; for (let si = 0; si < 4; si++) { if (si && nowMs() - tY > 0.5) { yield; tY = nowMs(); } trace(B, f, (px + 0.5 + (si & 1 ? 0.25 : -0.25) - ox) / k, (py + 0.5 + (si & 2 ? 0.25 : -0.25) - oy) / k, GA); if (!GA.hit) continue; shade(B, GA.mat, GA.x, GA.y, GA.z, GA.nx, GA.ny, GA.nz, GA.lap, GA.ao, GA.sh, o, E); r += o[0]; g += o[1]; bb += o[2]; a += 1; if (E) { e0 += E[0]; e1 += E[1]; e2 += E[2]; } }
      const q = pi * 4, a0 = A[q + 3], na = (a0 + a) / 5; if (na > 0) { A[q] = (A[q] * a0 + r) / 5 / na; A[q + 1] = (A[q + 1] * a0 + g) / 5 / na; A[q + 2] = (A[q + 2] * a0 + bb) / 5 / na; } A[q + 3] = na;
      if (EA) { const q3 = pi * 3; EA[q3] = (EA[q3] * a0 + e0) / 5; EA[q3 + 1] = (EA[q3 + 1] * a0 + e1) / 5; EA[q3 + 2] = (EA[q3 + 2] * a0 + e2) / 5; }
      if (nowMs() - tY > 0.5) { yield; tY = nowMs(); } } }
    BK.st = 'rim'; const rim = scratch('r', NP, Float32Array).fill(0, 0, NP);
    for (let py = 1; py < Hh - 1; py++) { if (nowMs() - tY > 0.5) { yield; tY = nowMs(); } for (let px = 1; px < W - 1; px++) { const pi = py * W + px; if (A[pi * 4 + 3] < 0.35) continue; const mn = Math.min(A[(pi - 1) * 4 + 3], A[(pi + 1) * 4 + 3], A[(pi - W) * 4 + 3], A[(pi + W) * 4 + 3]); if (mn < 0.3) rim[pi] = 1 - mn / 0.3; } }
    for (let i = 0; i < NP; i++) { if (!rim[i]) continue; const q = i * 4, k2 = rim[i] * 0.5; A[q] = lerp(A[q], 0.03, k2); A[q + 1] = lerp(A[q + 1], 0.02, k2); A[q + 2] = lerp(A[q + 2], 0.05, k2); }
    yield; tY = nowMs();
    BK.st = 'put'; let x0 = W, y0 = Hh, x1 = -1, y1 = -1; for (let py = 0; py < Hh; py++) { if (nowMs() - tY > 0.5) { yield; tY = nowMs(); } for (let px = 0; px < W; px++) if (A[(py * W + px) * 4 + 3] > 0.004) { if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; } }
    if (x1 < 0) { store({ cv: null, k }, null); return; }
    const w2 = x1 - x0 + 1, h2 = y1 - y0 + 1;
    const mk = (src) => { const cv = document.createElement('canvas'); cv.width = w2; cv.height = h2; const cx = cv.getContext('2d'); if (!IMG || IMG.width < w2 || IMG.height < h2) IMG = cx.createImageData(Math.max(w2, IMG ? IMG.width : 0) + 16, Math.max(h2, IMG ? IMG.height : 0) + 16); const Dd = IMG.data, IW = IMG.width;
      for (let py = 0; py < h2; py++) for (let px = 0; px < w2; px++) { const s = (py + y0) * W + px + x0, d = (py * IW + px) * 4; if (src === A) { Dd[d] = A[s * 4] * 255; Dd[d + 1] = A[s * 4 + 1] * 255; Dd[d + 2] = A[s * 4 + 2] * 255; Dd[d + 3] = A[s * 4 + 3] * 255; } else { const r = EA[s * 3], g = EA[s * 3 + 1], b = EA[s * 3 + 2], m = Math.max(r, g, b); Dd[d] = m > 0 ? r / m * 255 : 0; Dd[d + 1] = m > 0 ? g / m * 255 : 0; Dd[d + 2] = m > 0 ? b / m * 255 : 0; Dd[d + 3] = Math.min(1, m) * 255; } }
      cx.putImageData(IMG, 0, 0, 0, 0, w2, h2); BK.bytes += w2 * h2 * 4; return cv; };
    const cv = mk(A); yield; let ecv = null;
    if (EA) { let any = false; for (let i = 0; i < NP * 3 && !any; i += 3) if (EA[i] + EA[i + 1] + EA[i + 2] > 0.02) any = true;
      if (any) { const full = mk(EA), hc = document.createElement('canvas'); hc.width = Math.max(1, w2 >> 1); hc.height = Math.max(1, h2 >> 1); hc.getContext('2d').drawImage(full, 0, 0, hc.width, hc.height); BK.bytes -= w2 * h2 * 3; ecv = hc; } }   // (the glow is soft: half resolution)
    store({ cv, x: x0 - ox, y: y0 - oy, k }, ecv ? { cv: ecv, x: (x0 - ox) / 2, y: (y0 - oy) / 2, k: k / 2 } : null);
  }
  const KCAP = 96, KQ = 30, PSC = { hand: 1.15, hub: 1.0, helmet: 1.1 };
  /* bake one part at one view key */
  function bakeKey(key, k0, lo) {
    const [name, vk] = key.split('|'), P = PARTS[name]; CUR_PART = name === 'drumL' || name === 'drumR' ? 'drum' : name;
    const B = frameOfKey(P, vk), k = lo ? Math.max(12, Math.min(KQ, k0 * 0.45) * (PSC[name] || 1)) : Math.max(12, Math.min(KCAP, k0 * (PSC[name] || 1)));
    let box; if (P.kind === 'axis') { const W = Math.ceil((P.x1 - P.x0) * k) + 6, H = Math.ceil(2 * P.hw * k) + 6; box = { W, H, ox: -P.x0 * k + 3, oy: P.hw * k + 3 }; }
    else { const W = Math.ceil(2 * P.R * k) + 6; box = { W, H: W, ox: P.R * k + 3, oy: P.R * k + 3 }; }
    return bakeImg(B, P.f, k, !lo && !!P.glow, box, (s, e) => { s.gl = e; s.F = B; s.lo = !!lo; const prev = BK.spr.get(key); if (prev && !prev.lo && lo) return; BK.spr.set(key, s);
      const L2 = BK.byPart[name] || (BK.byPart[name] = []); const j = L2.findIndex(r => r.vk === vk); if (j >= 0) L2[j].s = s; else L2.push({ vk, F: B, s }); }, lo);
  }
  /* the background baker: bake for at most ms (in slices of about 1 ms; none starts that would overrun); true when idle */
  function bakeStep(ms) {
    const t0 = nowMs();
    if (!TX) { buildTex(); return false; }
    while (nowMs() - t0 < Math.max(ms * 0.6, ms - 1.5)) {
      if (!BK.gen) { while (BK.queue.length && doneKey(BK.queue[0])) BK.qset.delete(BK.queue.shift()); if (!BK.queue.length || !BK.k) break; const key = BK.queue.shift(); BK.qset.delete(key);
        const lo = key.endsWith('#lo'); BK.gen = bakeKey(lo ? key.slice(0, -3) : key, BK.k, lo); BK.genKey = key; }
      const st0 = BK.st, s0 = nowMs(); FASTB = BK.genKey.endsWith('#lo'); const r = BK.gen.next(); FASTB = false; const d = nowMs() - s0; BK.ms += d; if (d > BK.maxMs) { BK.maxMs = d; BK.maxAt = BK.genKey + '/' + st0 + '>' + BK.st; } if (d > 6 && BK.spikes.length < 40) BK.spikes.push(BK.genKey + '/' + st0 + ' ' + d.toFixed(1));
      if (r.done) { BK.gen = null; BK.genKey = ''; BK.n++; }
    }
    return !BK.gen && !BK.queue.length && !!BK.k;
  }
  const doneKey = key => { if (key.endsWith('#lo')) { const s = BK.spr.get(key.slice(0, -3)); return !!s; } const s = BK.spr.get(key); return !!(s && !s.lo); };
  /* ask for a key: front (now) or back (later) of the queue */
  function want(key, front) { if (BK.qset.has(key) || BK.genKey === key || doneKey(key)) return; BK.qset.add(key); if (front) BK.queue.unshift(key); else BK.queue.push(key); }   // (O(1) when already queued: draw calls this for every part every frame)
  /* the bake scale (device px per tile at the scale it will be drawn); a larger one restarts the bake */
  function setScale(k) { k *= VIS; k = Math.max(32, Math.min(KCAP, Math.round(k / 8) * 8)); if (!BK.k) { BK.k = k; return; } if (k <= BK.k * 1.25) return;
    // (a larger scale keeps every picture already made - each carries its own scale, so a frame may mix them - and asks again for the sharp ones)
    BK.k = k; for (const sp of BK.spr.values()) sp.lo = true; }

  /* ================= painted bits: soft sprites for the shadow and the thruster plumes ================= */
  let TX = null;
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h || w; return [cv, cv.getContext('2d')]; };
  function buildTex() {
    const S = {};
    { const [cv, g] = mkc(64); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.45, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); S.blob = cv; }
    // a plume: a soft violet flame along +x (its root at the left), a white-violet core
    { const [cv, g] = mkc(128, 48); const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, 'rgba(200,150,255,1)'); gr.addColorStop(0.25, 'rgba(150,80,255,.8)'); gr.addColorStop(0.7, 'rgba(90,30,220,.3)'); gr.addColorStop(1, 'rgba(60,10,160,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, 8); g.quadraticCurveTo(70, 4, 128, 24); g.quadraticCurveTo(70, 44, 0, 40); g.closePath(); g.fill();
      const g2 = g.createLinearGradient(0, 0, 70, 0); g2.addColorStop(0, 'rgba(255,245,255,1)'); g2.addColorStop(1, 'rgba(220,180,255,0)'); g.fillStyle = g2; g.beginPath(); g.moveTo(0, 17); g.quadraticCurveTo(40, 16, 70, 24); g.quadraticCurveTo(40, 32, 0, 31); g.closePath(); g.fill();
      const [c2, g3] = mkc(128, 48); g3.filter = 'blur(3px)'; g3.drawImage(cv, 0, 0); S.plume = g3.filter === 'blur(3px)' ? c2 : cv; }
    TX = S;
  }

  /* ================= the rig ================= */
  /* the transformation, in order (xf from 0 to 1); stages overlap only where their clearance allows */
  const XF_STAGES = {
    lift: [0.0, 0.1],        // 1. brace the pet, draw the fans in; the thrusters lift the robot
    dock: [0.05, 0.25],      // 2. the arms carry the sword over the right shoulder and down the back into the cradle, which unfolds to clamp it
    open: [0.22, 0.33],      // 3. the rear half-skirt hinges up clear of the legs and rides its waist ring round to the front
    pitch: [0.3, 0.5],       // 4. the body pitches into flight (turning about so the head leads); the cockpit cradle counter-rotates
    stow: [0.42, 0.57],      // 5. the helmet folds into the prow below the cockpit; the arms pack along the hull, hands on the hilt
    wings: [0.53, 0.69],     // 6. the blade fans, now in the flight plane, sweep their blades aft
    booms: [0.61, 0.77],     // 7. the hips trail the legs aft, the knees fold, the shins nest under the thighs, the feet turn flat
    thrust: [0.71, 0.87],    // 8. the pods swing out and aft on their rail arms and latch along the booms, nozzles aft
    close: [0.85, 0.95],     // 9. the skirt lowers onto the rear as the dorsal cowling; the locks close
    level: [0.95, 1.0],      // 10. hold, level, hand over
  };
  /* the named poses (as xf values) */
  /* the start of each stage in xf, in order, and 1 (for a core that times the stages: xf = lerp(B[i], B[i+1], stageU)) */
  const XF_BOUNDS = Object.values(XF_STAGES).map(r => r[0]).concat([1]);
  const POSES = { robot: 0, clearance: 0.33, pitched: 0.5, stowed: 0.57, winged: 0.69, boomed: 0.77, thrusted: 0.87, airship: 1 };
  function stagesAt(xf) { const o = {}; for (const k in XF_STAGES) { const [a, b] = XF_STAGES[k]; o[k] = sstep(a, b, xf); } return o; }
  const ease = u => u * u * (3 - 2 * u);
  /* the sword's holds, in the torso frame: grip point G, blade axis A, the flat's normal hint Z; two hands or one; the torso's
     own bend, twist and crouch that go with them (so the hands always reach the grips and the strikes reach the floor) */
  function swordHold(name, u, arc) {
    const e = ease(cl(u)), ak = Math.max(0.5, Math.min(1.6, arc == null ? 1 : arc));
    switch (name) {
      case 'sweep': { const ph = lerp(0.21 + 1.51 * Math.min(ak, 1.2), 0.21 - 1.51 * Math.min(ak, 1.08), e), rr = lerp(0.56, 0.46, e) * (1 + 0.12 * (ak - 1)), G = [0.52 + 0.2 * e + rr * Math.cos(ph), lerp(0.24, 0.34, e) + rr * Math.sin(ph), 0.14], A = vnrm([Math.cos(ph), Math.sin(ph), -0.12]);
        return { G, A, Z: [0, 0, 1], two: false, pitch: 0.08, twist: lerp(0.5, -0.55, e), crouch: 0.12, fold: 0.55 }; }
      case 'overhead': { const ta = lerp(1.85, -0.5, e), tg = lerp(1.2, -0.3, e), G = [0.3 + 0.68 * Math.cos(tg), 0.06, 0.92 + 0.68 * Math.sin(tg)], A = [Math.cos(ta), 0, Math.sin(ta)];
        return { G, A, Z: [0, 1, 0], two: true, pitch: lerp(-0.22, 0.38, e), twist: 0, crouch: lerp(0, 0.36, e) }; }
      case 'pointDown': case 'impale': case 'down': { const G = [0.62, 0.06, lerp(1.45, 1.1, e)], A = vnrm([0.08, 0, -1]);
        return { G, A, Z: [1, 0, 0], two: true, pitch: lerp(0.05, 0.2, e), twist: 0, crouch: lerp(0.02, 0.4, e), noFwd: 1 }; }
      default: return { G: [0.36, 0.98, -0.28], A: vnrm([0.55, 0.5, -0.68]), Z: [0, 0, 1], two: false, pitch: -0.04, twist: 0.1, crouch: 0 };   // rest: the sword held out and down at the right side, the chest open
    }
  }
  /* the sword's way to its cradle on the back (torso frame): over the right shoulder, behind, down; blade up */
  const DOCK = [{ G: [0.78, 0.62, 0.62], A: vnrm([0.4, 0.15, 1]), Z: [1, 0, 0] }, { G: [0.4, 0.3, 1.95], A: [0, 0, 1], Z: [1, 0, 0] }, { G: [-0.86, 0.05, 1.62], A: [0, 0, 1], Z: [-1, 0, 0] }, { G: [-0.98, 0, 0.55], A: [0, 0, 1], Z: [-1, 0, 0] }];
  const SHOULDER = s => [0, s * 1.06, 0.62], HIP = s => [0, s * 0.4, -0.1], RAILM = s => [-0.6, s * 0.22, 0.98], CRADLE_H = [-0.48, 0, 0.88], SEAT = [0.27, 0, 0.4], NECK = [0.03, 0, 1.27], DRUM = s => [0, s * 0.78, 0.86], HUB = s => [-0.52, s * 1.2, 1.0];
  const FAN_N = s => vnrm([-1, s * 0.28, 0.12]);
  const BLADE_R = [-8, 15, 38, 61, 84, 107, 130].map(d => d * Math.PI / 180), BLADE_A = [72, 86, 100, 114, 128, 142, 156].map(d => d * Math.PI / 180), BLADE_LEN = [2.0, 2.3, 2.5, 2.6, 2.5, 2.3, 2.0];
  /* assembly order for the summon: the cockpit first, then the frame, the limbs, the armour, the wings, the helmet, the sword */
  const ASM = { torso: 0, seat: 0, hatch: 0, pelvis: 0.1, drumL: 0.2, drumR: 0.2, uarmL: 0.28, uarmR: 0.28, farmL: 0.33, farmR: 0.33, handL: 0.38, handR: 0.38, thighL: 0.3, thighR: 0.3, shinL: 0.35, shinR: 0.35, footL: 0.4, footR: 0.4, skirt: 0.46, cradle: 0.46,
    rail1L: 0.48, rail2L: 0.5, rail1R: 0.48, rail2R: 0.5, podL: 0.52, podR: 0.52, hubL: 0.56, hubR: 0.56, helmet: 0.7, sword: 0.76 };
  /* two-bone reach: from S toward T with bones a, b; the elbow toward `pole`. Returns the elbow, the reached end and any shortfall */
  function ik2(S, T, a, b, pole) {
    const d0 = vsub(T, S), L = vlen(d0) || 1e-6, d = Math.max(Math.abs(a - b) + 1e-3, Math.min(a + b - 1e-4, L)), e = vmul(d0, 1 / L);
    let p = vsub(pole, vmul(e, vdot(pole, e))); if (vlen(p) < 1e-6) p = Math.abs(e[2]) < 0.9 ? vcross(e, [0, 0, 1]) : vcross(e, [1, 0, 0]); p = vnrm(p);
    const ca = (a * a + d * d - b * b) / (2 * a * d), sa = Math.sqrt(Math.max(0, 1 - ca * ca));
    return { E: vadd(S, vadd(vmul(e, a * ca), vmul(p, a * sa))), W: vadd(S, vmul(e, d)), short: Math.max(0, L - d) };
  }
  const bez3 = (a, c, d, b, u) => { const v = 1 - u; return vadd(vadd(vmul(a, v * v * v), vmul(c, 3 * v * v * u)), vadd(vmul(d, 3 * v * u * u), vmul(b, u * u * u))); };
  const bez = (a, c, b, u) => vadd(vadd(vmul(a, (1 - u) * (1 - u)), vmul(c, 2 * (1 - u) * u)), vmul(b, u * u));
  /* the rig: every part's place and orientation (body frame: x forward, y right, z up, the robot's ground at z 0) and the anchors */
  function rig(P, t) {
    t = t || 0; const xf = P.form >= 1 ? 1 : cl(P.xf || 0), S = stagesAt(xf), robotK = 1 - S.lift, air = S.pitch;
    const out = { inst: [], A: {}, S, xf, short: 0 };
    const hold = swordHold(P.sword, P.swordU || 0, P.swordArc), rest = swordHold('rest', 0), hk = cl(P.swordK == null ? 1 : P.swordK) * robotK;
    // the body: the spine joint as the pivot (the transformation pitches the body about it, turning about so the head leads)
    const crouch = ((P.crouch || 0) * 0.3 + lerp(rest.crouch, hold.crouch, hk) + 0.1 * cl(P.recoil || 0)) * robotK;
    const bob = Math.sin(t * 1.7) * 0.025 * (1 - 0.6 * air) + Math.sin(t * 2.3) * 0.02 * air;
    const pivot = [0, 0, 2.72 + 0.33 * S.lift - crouch + bob];   // (standing tall on the long legs, hovering; the airship at its old height)
    const Rx = mm(rotZ(Math.PI * S.pitch), rotY(-Math.PI / 2 * S.pitch));
    const lean = (P.lean || 0) * 0.22 * (1 - air), bank = (P.bank || 0) * lerp(0.28, 0.6, air), roll = (P.roll || 0) * air, noseP = (P.pitch || 0) * 0.45 * air;
    const Rbody = mm(mm(rotX(bank + roll), rotY(lean + noseP)), Rx);
    const rec = cl(P.recoil || 0), tPitch = ((P.pitch || 0) * 0.5 * (1 - air) + lerp(rest.pitch, hold.pitch, hk) - 0.22 * rec) * robotK, tTwist = ((P.twist || 0) + lerp(rest.twist, hold.twist, hk)) * robotK;
    const hipY = Math.max(-0.4, Math.min(0.4, P.hipYaw || 0)) * robotK, Rt = mm(Rbody, mm(rotZ(tTwist), rotY(tPitch))), Rp = hipY ? mm(Rbody, rotZ(hipY)) : Rbody;
    const toT = p => vadd(pivot, mv(Rt, p)), dirT = v => mv(Rt, v);
    const pelO = vadd(pivot, mv(Rbody, [0, 0, -0.2])), toP = p => vadd(pelO, mv(Rp, p));
    const I = (name, part, R, o, s, dep) => { const it = { name, part, R, o, s: s || 1, al: 1, dep: dep || 0 }; out.inst.push(it); return it; };
    // the torso, the pilot's cradle (upright whatever the torso does), the pelvis
    I('torso', 'torso', Rt, pivot);
    // the chest hatch: hinged across the top of the cockpit; it swings down and shuts over the pilot (1), or up and forward clear (0)
    const hatchK = P.hatch != null ? cl(P.hatch) : sstep(0.82, 1, P.assemble == null ? 1 : P.assemble);
    { const hi = I('hatch', 'hatch', mm(Rt, rotY(-2.1 * (1 - ease(hatchK)))), toT([0.47, 0, 0.97]), 1, 0.03); hi.isHatch = true; } out.hatch = hatchK;
    const seatP = toT(SEAT); I('seat', 'seat', mm(rotX(bank * 0.15), I3()), seatP, 1, 0.02);
    I('pelvis', 'pelvis', Rp, pelO);
    // the helmet: folds forward and down into the prow recess (face forward, crest down) in stage 5
    const Rh = mm(Rt, rotY(-Math.PI / 2 * S.stow)), neck = toT(vadd(NECK, [-0.13 * S.stow, 0, -0.08 * S.stow]));
    I('helmet', 'helmet', Rh, neck, 1.22);
    // the shoulder drums, the wing hubs and their blades
    for (const s of [-1, 1]) { const sd = s < 0 ? 'L' : 'R';
      I('drum' + sd, 'drum' + sd, Rt, toT(DRUM(s)));
      const n = FAN_N(s), e1 = vnrm(vsub([0, 0, 1], vmul(n, n[2]))); let e2 = vcross(n, e1); if (e2[1] * s < 0) e2 = vmul(e2, -1);
      const spread = cl(P.wingSpread != null ? P.wingSpread : P.wing != null ? P.wing : 1), fold = cl(Math.max(P.wingFold || 0, (hold.fold || 0) * hk, 0.3 * S.lift * (1 - S.wings))), hubC = HUB(s), hubW = toT(hubC);
      const thMid = lerp(80, 104, S.wings) * Math.PI / 180, sway = Math.max(-0.6, Math.min(0.6, (s < 0 ? P.wingSwayL : P.wingSwayR) || 0)) * lerp(1, 0.5, S.wings);
      for (let i = 0; i < 7; i++) {
        let th = lerp(BLADE_R[i], BLADE_A[i], S.wings); th = lerp(thMid, th, spread * (1 - 0.55 * fold) * lerp(0.82, 1, 1 - S.lift + S.wings)) + sway * (0.45 + 0.1 * i);
        const d = vadd(vmul(e1, Math.cos(th)), vmul(e2, Math.sin(th))), zb = vmul(n, s), Rb = M3(dirT(d), dirT(vcross(zb, d)), dirT(zb));
        const it = I('blade' + sd + i, 'blade', Rb, toT(vadd(hubC, vmul(d, 0.1))), BLADE_LEN[i] / BL * lerp(1, 1.12, S.wings), -0.01 * i); it.fan = s; it.bi = i;
      }
      const hubSpin = lerp(BLADE_R[0], BLADE_A[0], S.wings) * 1.0, hx = vadd(vmul(e1, Math.cos(hubSpin)), vmul(e2, Math.sin(hubSpin)));
      I('hub' + sd, 'hub', M3(dirT(hx), dirT(vcross(n, hx)), dirT(n)), hubW, 1, 0.03);
      out.A['wingRoot' + sd] = hubW;
    }
    // the sword: a hold (robot), its way to the cradle (stage 2), then fixed in the cradle (torso frame)
    let G, A, Z, two;
    { const h = { G: vlerp(rest.G, hold.G, hk), A: vnrm(vlerp(rest.A, hold.A, hk)), Z: vlerp(rest.Z, hold.Z, hk) }; two = hk > 0.5 ? hold.two : rest.two;
      const u = S.dock;
      if (u <= 0) { G = h.G; A = h.A; Z = h.Z; }
      else { const pts = [h, DOCK[0], DOCK[1], DOCK[2], DOCK[3]], f = Math.min(3.999, u * 4), i = Math.floor(f), w = ease(f - i), a0 = pts[i], a1 = pts[i + 1];
        G = vlerp(a0.G, a1.G, w); const F0 = frameXZ(a0.A, a0.Z), F1 = frameXZ(a1.A, a1.Z), F = mslerp(F0, F1, w); A = F.x; Z = F.z; two = u > 0.9; } }   // (the left hand lets go for the carry and regrips once the cradle holds the blade)
    const Fs = frameXZ(A, Z), swO = toT(G), swR = M3(dirT(Fs.x), dirT(Fs.y), dirT(Fs.z));
    I('sword', 'sword', swR, swO, 1, 0.0);
    const aw = swR.x, gripR = swO, gripL = vadd(swO, vmul(aw, SW.grip2));
    // the cradle: folded down the back (robot), unfolding back to clamp the blade's base (late in stage 2)
    { const ph = Math.PI / 2 * sstep(0.55, 0.95, S.dock), xc = [-Math.sin(ph), 0, -Math.cos(ph)]; I('cradle', 'cradle', frameXZ(dirT(xc), dirT([0, 1, 0])), toT(CRADLE_H)); }
    // the arms: each hand on its grip (or the free left hand at the hip); two-bone reach from the shoulder to the wrist
    for (const s of [-1, 1]) { const sd = s < 0 ? 'L' : 'R', Sh = toT(SHOULDER(s));
      let grip, hx, free = false;
      if (s > 0 || two) { grip = s > 0 ? gripR : gripL; hx = aw; }
      else { free = true; grip = toT([0.18, -1.98, 0.22]); hx = dirT([0.25, -1, -0.15]); }   // (the free arm flung out wide)
      let wz = vsub(Sh, grip); wz = vsub(wz, vmul(hx, vdot(wz, hx))); wz = vlen(wz) > 1e-5 ? vnrm(wz) : dirT([0, 0, 1]);
      const wrist = vadd(grip, vmul(wz, 0.3));
      const carry = Math.sin(Math.PI * cl(S.dock * 1.15)) * (s > 0 ? 1 : 0.4);
      const pole = vnrm(vlerp(vlerp(dirT(two && !free ? [-0.15, s * 1, -0.45] : free ? [-0.45, s * 0.2, -1] : [-0.5, s * 0.85, -0.6]), dirT([0.9, s * 0.5, 0.6]), carry), dirT([0.25, s * 1.0, 0.35]), S.stow));
      const k = ik2(Sh, wrist, LUA, LFA, pole); out.short = Math.max(out.short, free ? 0 : k.short);
      const out2 = dirT([0, s, 0]);
      I('uarm' + sd, 'uarm', frameXZ(vsub(k.E, Sh), out2), Sh);
      I('farm' + sd, 'farm', frameXZ(vsub(k.W, k.E), out2), k.E);
      I('hand' + sd, 'hand', frameXZ(hx, wz), grip, 1.75, 0.01);
      out.A['hand' + sd] = grip;
    }
    // the legs: robot (reaching the floor, a gentle gait), hanging (lifted), folded into booms (airship)
    const ga = P.gaitAmp || 0, gp = P.gait || 0, hover = 0.12;
    for (const s of [-1, 1]) { const sd = s < 0 ? 'L' : 'R', Hl = HIP(s), Hw = toP(Hl), lat = mv(Rp, [0, 1, 0]);
      // the hovering stance: the left leg extended down and back, its foot pointed; the right knee raised forward; a slow,
      // light flutter (the gait's phase) and the legs trailing with momentum (legSwing) - gliding flight, not walking
      const ph = gp + (s > 0 ? 0 : Math.PI), flut = Math.sin(ph) * ga;
      let lsw = Math.max(-1, Math.min(1, P.legSwing || 0)) * robotK; if (lsw > 0) lsw *= 1 - hk * (hold.noFwd || 0);
      const st = s < 0 ? [-0.34, -0.12, -2.1] : [0.3, 0.06, -1.52], plant = cl(crouch / 0.4);   // (a crouching hold plants both feet a little)
      const off = [lerp(st[0], s < 0 ? -0.2 : 0.2, plant * 0.6) + 0.1 * flut + (lsw < 0 ? 0.42 : 0.16) * lsw, st[1] * (1 - plant * 0.5) + s * 0.03 * Math.abs(lsw), lerp(st[2], -1.7, plant * 0.6) + 0.05 * Math.cos(ph) * ga + (lsw < 0 ? 0.22 : 0.06) * Math.abs(lsw)];
      const ankT = vadd(Hw, mv(Rp, off)); void hover;
      const k = ik2(Hw, ankT, LTH, LSH, [1, 0, 0.25]);
      const toPl = v => { const Rq = mT(Rp); return mv(Rq, v); };
      const tR = vnrm(toPl(vsub(k.E, Hw))), sR = vnrm(toPl(vsub(k.W, k.E)));
      const kapR = Math.atan2(vdot(vcross(tR, sR), [0, 1, 0]), vdot(tR, sR));
      const tH = vnrm([0.1, s * 0.07, -1]), tA = vnrm([-0.04, s * 0.22, -1]);
      let tdir = vnrm(vlerp(tR, tH, S.lift)); tdir = vnrm(vlerp(tdir, tA, S.booms));
      const kap = lerp(lerp(kapR, -0.3, S.lift), 2.82, S.booms);
      const sdir = mv(rotAxis([0, 1, 0], kap), tdir), knee = vadd(Hl, vmul(tdir, LTH)), ank = vadd(knee, vmul(sdir, LSH));
      const Tw = mv(Rp, tdir), Sw = mv(Rp, sdir), Kw = toP(knee), Aw = toP(ank);
      I('thigh' + sd, 'thigh', frameXZ(Tw, mv(Rp, [1, 0, 0])), Hw);
      I('shin' + sd, 'shin', frameXZ(Sw, mv(Rp, mv(rotAxis([0, 1, 0], kap), [1, 0, 0]))), Kw);
      // the foot: level on the floor (robot), toes down (hanging), turned flat outward as a stabiliser (airship)
      const fR = s < 0 ? frameXZ(mv(Rp, [0.42, 0, -1]), mv(Rp, [1, 0, 0.42])) : frameXZ(mv(Rp, [1, 0, -0.5 + 0.1 * flut]), mv(Rp, [0.5, 0, 1])), fH = frameXZ(mv(Rp, [0.5, 0, -1]), mv(Rp, [1, 0, 0.3])), fA = frameXZ(mv(Rp, [-1, s * 0.3, 0.1]), mv(Rp, [0, s, 0]));
      const Rf = mslerp(mslerp(fR, fH, S.lift), fA, S.booms);
      I('foot' + sd, 'foot', Rf, Aw, 1.45);
      out.A['foot' + sd] = vadd(Aw, mv(Rf, [0.1, 0, -0.19]));
      void lat;
    }
    // the thruster pods on their rail arms: behind the shoulders, nozzles up (robot); swung out and aft along the booms (airship)
    for (const s of [-1, 1]) { const sd = s < 0 ? 'L' : 'R', u = ease(S.thrust), pre = 0;
      const rR = [-0.6, s * 0.38, 1.08], aR = vnrm([-0.18, s * 0.26, 1]), rA = [-0.28, s * 1.18, -0.42], aA = vnrm([0.03, -s * 0.03, -1]), ctl = [-1.08, s * 0.95, 1.15], ctl2 = [-1.15, s * 1.6, 0.4];
      // (first a clearance pose in stage 1: up and out over the hubs, opening the space behind the head for the sword)
      const r1 = [-0.66, s * 0.82, 1.75], a1 = vnrm([0.02, s * 0.5, 1]), u1 = ease(S.lift), r0 = vlerp(rR, r1, u1), F0 = mslerp(frameXZ(aR, [0, s, 0]), frameXZ(a1, [0, s, 0]), u1);
      const rp = bez3(r0, ctl, ctl2, rA, u), Fm = frameXZ(vnrm([-0.35, s, -0.35]), [1, 0, 0]), ur = sstep(0, 0.55, u), F = ur < 0.5 ? mslerp(F0, Fm, ur * 2) : mslerp(Fm, frameXZ(aA, [0, s, 0]), ur * 2 - 1); void pre;   // (nozzles turned out, then aft, early; then down the side)
      const Rpod = M3(dirT(F.x), dirT(F.y), dirT(F.z)), pO = toT(rp);
      I('pod' + sd, 'pod', Rpod, pO, 1.3);
      const m = toT(RAILM(s)), knuckle = vadd(pO, vmul(Rpod.x, -0.1)), pole = vnrm(vlerp(dirT([-0.9, s * 0.2, -0.4]), dirT([-0.8, s * 0.6, 0.2]), u));
      const rs = lerp(0.3, 1, sstep(0, 0.6, Math.max(u1, u)));   // (the rails telescope: stowed in the pack (robot), drawn out to carry the pods)
      const k = ik2(m, knuckle, LRAIL * rs, LRAIL * rs, pole);
      I('rail1' + sd, 'rail', frameXZ(vsub(k.E, m), pole), m, rs);
      I('rail2' + sd, 'rail', frameXZ(vsub(k.W, k.E), pole), k.E, rs);
      out.A['thruster' + sd] = vadd(pO, vmul(Rpod.x, 1.04)); out.A['thrusterDir' + sd] = Rpod.x;
    }
    // the rear half-skirt: hinged at the back of the waist; lifts clear, rides the waist ring round to the front, lowers as the dorsal cowling
    { const lift = 1.45 * S.open - 1.2 * S.close, ring = Math.PI * sstep(0.35, 1, S.open);
      const Rs = mm(Rp, mm(rotZ(ring), rotY(lift))); I('skirt', 'skirt', Rs, toP(mv(rotZ(ring), [-0.24, 0, 0.12]))); }
    // the summon: each part slides in from away from the cockpit and fades up, in order (the cockpit first, the sword last)
    const asm = P.assemble == null ? 1 : cl(P.assemble);
    if (asm < 1) { const ctr = toT(COCK); for (const it of out.inst) { const nm = it.name.replace(/[0-6]$/, ''), d0 = ASM[nm] != null ? ASM[nm] : ASM[it.name.replace(/[LR][0-6]?$/, '')] != null ? ASM[it.name.replace(/[LR][0-6]?$/, '')] : 0.6;
        const d = it.part === 'blade' ? 0.58 + 0.03 * (it.bi || 0) : d0, a = sstep(d, d + 0.24, asm); it.al = a; if (a >= 1) continue;
        let dir = vsub(it.o, ctr); dir = vlen(dir) > 0.05 ? vnrm(dir) : [0, 0, -1]; if (it.name === 'torso' || it.name === 'seat') dir = [0, 0, -1];
        it.o = vadd(it.o, vadd(vmul(dir, (1 - a) * 1.4), [0, 0, (it.name === 'sword' ? 1.2 : 0.25) * (1 - a)])); } }
    // anchors (body frame)
    const AA = out.A; AA.cockpit = toT(COCK); AA.seat = seatP; AA.pivot = pivot; AA.center = toT([0, 0, 0.5]);
    AA.hilt = swO; AA.swordBase = vadd(swO, vmul(aw, SW.base)); AA.swordTip = vadd(swO, vmul(aw, SW.tip)); AA.swordChannel = vadd(swO, vmul(aw, 1.5));
    AA.swordEdgeA = vadd(vadd(swO, vmul(aw, 2.6)), vmul(swR.y, 0.16)); AA.swordEdgeB = vadd(vadd(swO, vmul(aw, 2.6)), vmul(swR.y, -0.16)); AA.swordDir = aw; AA.swordFlat = swR.z;
    AA.helm = vadd(neck, mv(Rh, [0.07, 0, 0.37])); AA.feet = vmul(vadd(AA.footL, AA.footR), 0.5);
    AA.up = mv(Rt, [0, 0, 1]); AA.forward = mv(Rbody, [1, 0, 0]);
    out.Rt = Rt; out.Rbody = Rbody; out.pivot = pivot;
    return out;
  }

  /* ================= drawing ================= */
  /* the view of one draw: body frame -> world (heading a), the game's ground (y scaled by GY), the screen */
  function mkView(x, y, z, a, o) {
    const T = o.T, sc = (o.scale || 1) * VIS, k = T * sc, Rh = rotZ(a), X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T, K = o.cam ? camAt(o.cam[0], o.cam[1]) : null;
    const toS = K ? p => { const w = mv(Rh, p); return [X0 + vdot(w, K.EX) * k, Y0 + vdot(w, K.EY) * k]; } : p => { const w = mv(Rh, p); return [X0 + w[0] * k, Y0 + (w[1] * GY - w[2] * ZK) * k]; };
    const toW = p => { const w = mv(Rh, p); return { x: x + w[0] * sc, y: y + w[1] * GY * sc, z: z + w[2] * sc }; };
    const depth = p => vdot(mv(Rh, p), K ? K.C : CW);
    return { T, sc, k, Rh, toS, toW, depth, x, y, z, a, K };
  }
  /* the least-squares 2x2 map from a baked view's image to the true projection (weights: the part's extents) */
  function fitM(F, cam, w) {
    let a00 = 0, a01 = 0, a11 = 0, b00 = 0, b01 = 0, b10 = 0, b11 = 0;
    for (let i = 0; i < 3; i++) { const bx = F.EX[i], by = F.EY[i], sx = cam.EX[i], sy = cam.EY[i], wi = w[i] * w[i]; a00 += wi * bx * bx; a01 += wi * bx * by; a11 += wi * by * by; b00 += wi * sx * bx; b01 += wi * sx * by; b10 += wi * sy * bx; b11 += wi * sy * by; }
    const det = a00 * a11 - a01 * a01 || 1e-9, i00 = a11 / det, i01 = -a01 / det, i11 = a00 / det;
    return [b00 * i00 + b01 * i01, b00 * i01 + b01 * i11, b10 * i00 + b11 * i01, b10 * i01 + b11 * i11];
  }
  /* a part's view at a heading: its key and the camera in its frame */
  const STATE = new Map(), FADE = 0.12;
  let LAST = null, NI = 0, OK = null; const ITEMS = [], MISS = [];
  /* the picture a part draws from for a camera: its own view (sharp or quick); else, for a full part, the same view at
     another roll (the same image turned in its plane: exact in shape); else none */
  function pick(Pt, part, cam) {
    const vk = viewKey(Pt, cam), key = part + '|' + vk; let spr = BK.spr.get(key);
    if (spr) return { spr, key, F: spr.F };
    if (Pt.kind !== 'axis' && !Pt.noRoll) { const pre = key.slice(0, key.lastIndexOf('.') + 1), ri = +vk.slice(vk.lastIndexOf('.') + 1);
      for (let d = 1; d <= 8; d++) for (const r2 of [ri + d, ri - d]) { const k2 = pre + (((r2 % 16) + 16) % 16), s2 = BK.spr.get(k2); if (s2) return { spr: s2, key: k2, F: s2.F, alt: key }; } }
    return { spr: null, key };
  }
  /* is the whole pose drawable, coherently, at heading a (every visible part from its own view)? collects the missing keys */
  function coherent(R, a, K, miss) { const Rh = rotZ(a); let ok = true;
    for (const it of R.inst) { if (!(it.al > 0.004)) continue; const Pt = PARTS[it.part], p = pick(Pt, it.part, camIn(mm(Rh, it.R), K)); if (!p.spr) { if (miss) miss.push(p.key); if (it.al < 0.999) continue; ok = false; if (!miss) return false; } else if (p.alt && miss) want(p.alt + '#lo'); }   // (a part still fading in during the summon may wait for its view; it just appears a moment later)
    return ok; }
  const item = (d, fn) => { const I2 = ITEMS[NI] || (ITEMS[NI] = {}); NI++; I2.d = d; I2.fn = fn; };
  function blit(c, spr, M, S0, f, al, op) { if (!spr || !spr.cv) return; const g = f / spr.k; c.save(); c.globalAlpha = al; if (op) c.globalCompositeOperation = op;
    c.transform(M[0] * g, M[2] * g, M[1] * g, M[3] * g, S0[0] + (M[0] * spr.x + M[1] * spr.y) * g, S0[1] + (M[2] * spr.x + M[3] * spr.y) * g); c.drawImage(spr.cv, 0, 0); c.restore(); }
  /* draw(c, x, y, z, heading, pose, o): o = { T, sx, sy, t, scale, low, pet(c, X, Y), sync (ms) }.
     Every part of a frame is drawn from its own view of one camera, never a stand-in view of another angle: a part's
     missing view is baked now (quick, within a hard cap); failing that the whole model is drawn at the nearest heading
     at which every part is ready; failing that the last whole frame is held (moved to where the model now is). */
  function drawSprite(c, x, y, z, a, P, o) {
    o = o || {}; const t = o.t != null ? o.t : nowMs() / 1000; let R = rig(P, t);
    if (!TX) buildTex(); if (!(P.alpha > 0.01) || !BK.k) { LAST = { R, V: mkView(x, y, z, a, o), P }; return; }
    const K = o.cam ? camAt(o.cam[0], o.cam[1]) : null; let a2 = a, frozen = false;
    MISS.length = 0;
    const whole = coherent(R, a, K, MISS);
    for (let i = MISS.length - 1; i >= 0; i--) want(MISS[i] + '#lo', true);
    if (!whole) {
      const cap = o.sync != null ? o.sync : !OK ? 12 : BK.held ? 8 : 4; if (cap > 0) bakeStep(cap + 1.5);
      if (!coherent(R, a, K, null)) { let found = false;
        for (let d = 1; d <= 3 && !found; d++) for (const sg of [1, -1]) { const a3 = a + sg * d * STEP; if (coherent(R, a3, K, null)) { a2 = a3; found = true; break; } }
        if (!found) { if (!OK) { const V0 = mkView(x, y, z, a, o); LAST = { R, V: V0, P }; if (o.pet && !(R.hatch >= 0.98)) { const s3 = V0.toS(R.A.seat); o.pet(c, s3[0], s3[1]); } return; }
          R = OK.R; a2 = OK.a; frozen = true; }   // (the last whole frame, held where the model now is, until its views are ready)
      }
    }
    if (!frozen) OK = { R, a: a2, t }; BK.frozen = frozen; BK.held = frozen || a2 !== a;
    const V = mkView(x, y, z, a2, o); LAST = { R, V, P }; BK.drawnOff = a2 - a;
    const al0 = P.alpha == null ? 1 : P.alpha, low = o.low != null ? o.low : lowFx(), glowK = cl(0.35 + 0.65 * (P.glow == null ? 0.5 : P.glow)), chK = cl(0.25 + 0.75 * (P.channel || 0));
    NI = 0;
    const shut = R.hatch >= 0.98; let hatchItem = null;
    for (const it of R.inst) {
      if (!(it.al > 0.004)) continue;
      const Pt = PARTS[it.part], Rw = mm(V.Rh, it.R), cam = camIn(Rw, V.K), p = pick(Pt, it.part, cam); if (!p.spr) continue;
      if (p.spr.lo || p.alt) want(p.alt || p.key);
      const spr = p.spr, F = p.F, usedKey = p.key;
      const M = fitM(F, cam, Pt.w), oimg = Pt.kind === 'axis' ? [0, 0, 0] : Pt.c, base = vadd(it.o, mv(it.R, vmul(oimg, it.s))), S0 = V.toS(base), f = V.k * it.s;
      // a change of view fades over FADE seconds (the new picture under the old one fading out)
      let st2 = STATE.get(it.name);
      if (!st2) { st2 = { key: usedKey, spr, F, prev: null, pF: null, t0: -9 }; STATE.set(it.name, st2); }
      else if (st2.key !== usedKey || st2.spr !== spr) { if (t - st2.t0 > 0.03 && Math.abs(t - st2.t0) < 5 && st2.key !== usedKey) { st2.prev = st2.spr; st2.pF = st2.F; st2.t0 = t; } else if (st2.key !== usedKey) st2.prev = null; st2.key = usedKey; st2.spr = spr; st2.F = F; }
      const fadeU = st2.prev ? (t - st2.t0) / FADE : 1, prev = fadeU < 1 && fadeU >= 0 ? st2.prev : null, pM = prev ? fitM(st2.pF, cam, Pt.w) : null;
      const al = al0 * it.al, gk = it.part === 'sword' ? chK : it.part === 'pod' ? cl(0.3 + 0.7 * (P.thrust == null ? 0.4 : P.thrust)) : glowK, dep = V.depth(vadd(it.o, mv(it.R, vmul(Pt.kind === 'axis' ? [(Pt.x0 + Pt.x1) / 2, 0, 0] : Pt.c, it.s)))) + it.dep;
      const fnI = () => { blit(c, spr, M, S0, f, al); if (prev) blit(c, prev, pM, S0, f, al * (1 - fadeU)); if (spr.gl && gk > 0.02 && !low || (spr.gl && it.part === 'sword')) blit(c, spr.gl, M, S0, f, al * gk, 'lighter'); };
      if (it.isHatch && !shut) hatchItem = fnI; else item(dep, fnI);
    }
    const L2 = ITEMS; for (let i = 1; i < NI; i++) { const it = L2[i]; let j = i - 1; while (j >= 0 && L2[j].d > it.d) { L2[j + 1] = L2[j]; j--; } L2[j + 1] = it; }
    for (let i = 0; i < NI; i++) L2[i].fn();
    lights(c, V, R, P, al0, low, t);
    // the pilot: drawn (upright) only while the hatch is open, the hatch then over it; once shut, the pet is inside, unseen
    if (o.pet && !shut) { const s3 = V.toS(R.A.seat); o.pet(c, s3[0], s3[1]); }
    if (hatchItem) hatchItem();
  }

  /* ================= drawing on the GPU =================
     The posed meshes rendered live into one WebGL canvas sized to the model's bounds on screen (device pixels, capped),
     laid into the game canvas as one image; the plumes and glows, the pet and the shadow stay 2D. With no WebGL (or a
     lost context) the pictures above are drawn instead. */
  let NOGL = false, GLMS = 0, GLR = 0, GLD = 0, GLN = 0; const GLI = [], GLJ = [];
  // (a software rasteriser - a browser with no usable GPU - would take a large part of a second a frame: the pictures are
  //  drawn there instead, unless asked: window.__SUSANO_GL = 1, for tests and studio renders)
  const glOn = () => { if (NOGL || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__SUSANO_GL)) return false; if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; return false; } } return true; };
  let MESH_MS = 0;
  const KIND = { blade: 1, sword: 2, hatch: 3, hub: 2, seat: 2 };
  const meshOf = it => MESH[it.part === 'drumL' || it.part === 'drumR' ? it.part : it.part];
  const GLCAP = 1600;
  function glPass(c, V, R, P, o, list, al0) {
    const k = V.k, K = V.K, PX = K ? K.EX : EXW, PY = K ? K.EY : [0, GY, -ZK], PD = K ? K.C : CW, X0 = V.toS([0, 0, 0]);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { const Pt = PARTS[it.part], cc = Pt.kind === 'axis' ? [(Pt.x0 + Pt.x1) / 2, 0, 0] : Pt.c, rr = (Pt.kind === 'axis' ? Math.hypot((Pt.x1 - Pt.x0) / 2, Pt.hw) : Pt.R) * it.s * 1.04 * k, w = mv(V.Rh, vadd(it.o, mv(it.R, vmul(cc, it.s)))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return;
    const m = c.getTransform ? c.getTransform() : null, dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (GLM.soft && !(typeof window !== 'undefined' && window.__SUSANO_GLHQ) ? 0.4 : 1);   // (a software rasteriser draws it at reduced resolution)
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sc = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sc)); H = Math.max(2, Math.ceil(H * sc));
    const bw = bx1 - bx0, bh = by1 - by0, tl = w => { const a = vdot(w, EXW), b = vdot(w, EYW), cc = vdot(w, CW); return K ? vadd(vadd(vmul(K.EX, a), vmul(K.EY, b)), vmul(K.C, cc)) : w; };
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: tl(LW), ls: tl(SBW), lr: tl(RIMW), up: tl(UPW), low: o.low != null ? o.low : lowFx() };
    const glowK = cl(0.35 + 0.65 * (P.glow == null ? 0.5 : P.glow)), chK = cl(0.25 + 0.75 * (P.channel || 0)), thK = cl(0.3 + 0.7 * (P.thrust == null ? 0.4 : P.thrust));
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const Rw = mm(V.Rh, it.R), s2 = it.s, T = mv(V.Rh, it.o), al = al0 * it.al;
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = meshOf(it); if (!g.mesh) continue; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2; g.R1[i] = Rw.y[i] * s2; g.R2[i] = Rw.z[i] * s2; g.T[i] = T[i]; }
      g.alpha = al; g.glow = it.part === 'sword' ? chK : it.part === 'pod' ? thK : glowK; g.kind = KIND[it.part] || 0; g.wear = 1; g.d = vdot(T, PD); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return; const t1 = nowMs();
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); const t2 = nowMs(); GLMS = GLMS * 0.9 + (t2 - t0) * 0.1; GLR = GLR * 0.9 + (t1 - t0) * 0.1; GLD = GLD * 0.9 + (t2 - t1) * 0.1; GLN++;
    BK.glBox = [W, H];
  }
  function drawGL(c, x, y, z, a, P, o) {
    o = o || {}; const t = o.t != null ? o.t : nowMs() / 1000, R = rig(P, t), V = mkView(x, y, z, a, o); LAST = { R, V, P };
    if (!(P.alpha > 0.01)) return;
    const al0 = P.alpha == null ? 1 : P.alpha, low = o.low != null ? o.low : lowFx(), shut = R.hatch >= 0.98;
    const vis = R.inst.filter(it => it.al > 0.004), body = shut || !o.pet ? vis : vis.filter(it => !it.isHatch), hatch = shut || !o.pet ? null : vis.filter(it => it.isHatch);
    glPass(c, V, R, P, o, body, al0);
    lights(c, V, R, P, al0, low, t);
    if (o.pet && !shut) { const s3 = V.toS(R.A.seat); o.pet(c, s3[0], s3[1]); }
    if (hatch && hatch.length) glPass(c, V, R, P, o, hatch, al0);
  }
  /* draw(c, x, y, z, heading, pose, o): live on the GPU when it can; else the baked pictures */
  function draw(c, x, y, z, a, P, o) { if (glOn()) { try { return drawGL(c, x, y, z, a, P, o); } catch (e) { NOGL = true; } } return drawSprite(c, x, y, z, a, P, o); }
  /* the live lights: the thruster plumes (and the robot's hover glow under its feet), the eyes, the cockpit core, the sword's
     channel and the charge at its point */
  function lights(c, V, R, P, al, low, t) {
    const A = R.A, k = V.k, th = cl(P.thrust == null ? 0.4 : P.thrust); c.save(); c.globalCompositeOperation = 'lighter';
    for (const sd of ['L', 'R']) { const n0 = A['thruster' + sd], d = A['thrusterDir' + sd], p0 = V.toS(n0), p1 = V.toS(vadd(n0, vmul(d, 0.6 + 0.9 * th))), dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = hyp(dx, dy), fl = 0.85 + 0.15 * Math.sin(t * 37 + (sd === 'L' ? 0 : 2));
      if (len > 1 && TX && TX.plume) { c.save(); c.globalAlpha = al * (0.35 + 0.65 * th) * fl; c.translate(p0[0], p0[1]); c.rotate(Math.atan2(dy, dx)); const w = k * (0.24 + 0.1 * th); c.drawImage(TX.plume, 0, -w / 2, Math.max(len, k * 0.25), w); c.restore(); }
      const r = k * (0.16 + 0.12 * th); c.globalAlpha = al * (0.5 + 0.4 * th); blitSized(c, glowSprite(VIOLET), p0[0] - r, p0[1] - r, r * 2, r * 2); }
    const ground = 1 - R.S.lift;
    if (ground > 0.05 && !low) for (const sd of ['L', 'R']) { const f = V.toS(A['foot' + sd]), r = k * 0.32; c.globalAlpha = al * ground * (0.25 + 0.2 * th); blitSized(c, glowSprite(VDEEP), f[0] - r, f[1] - r * 0.5, r * 2, r); }
    { const h = V.toS(A.helm), r = k * (0.09 + 0.05 * (P.glow || 0)); c.globalAlpha = al * 0.6; blitSized(c, glowSprite(VIOLET), h[0] - r, h[1] - r, r * 2, r * 2); }
    { const cp = V.toS(A.cockpit), r = k * (0.32 + 0.08 * Math.sin(t * 2.2)); c.globalAlpha = al * (0.16 + 0.2 * (P.glow || 0)); blitSized(c, glowSprite(VDEEP), cp[0] - r, cp[1] - r, r * 2, r * 2); }
    const ch = cl(P.channel || 0); if (ch > 0.02) for (let i = 0; i < 6; i++) { const p = V.toS(vadd(A.hilt, vmul(A.swordDir, 0.45 + i * 0.42))), r = k * (0.16 + 0.1 * ch); c.globalAlpha = al * ch * 0.45; blitSized(c, glowSprite(VIOLET), p[0] - r, p[1] - r, r * 2, r * 2); }
    const cg = cl(P.charge || 0); if (cg > 0.02) { const p = V.toS(A.swordTip), r = k * (0.2 + 0.55 * cg) * (0.92 + 0.08 * Math.sin(t * 20)); c.globalAlpha = al * cg; blitSized(c, glowSprite(VIOLET), p[0] - r, p[1] - r, r * 2, r * 2); c.globalAlpha = al * cg * 0.9; blitSized(c, glowSprite(VCORE), p[0] - r * 0.4, p[1] - r * 0.4, r * 0.8, r * 0.8); }
    c.restore();
  }
  /* the ground shadow: soft and blurred (soft blobs under the body, the limbs, the fans and the sword, painted at low
     resolution and laid down at once), fainter and wider with height */
  let SHC = null;
  function drawShadow(c, x, y, z, a, P, o) {
    if (!TX) buildTex(); const R = rig(P, o.t || 0), V = mkView(x, y, 0, a, o), al = (P.alpha == null ? 1 : P.alpha);
    const pts = []; const addP = (p, r, w) => pts.push([p, r, w == null ? 1 : w]);
    for (const it of R.inst) { const Pt = PARTS[it.part]; if (Pt.kind === 'axis') { const n = it.part === 'sword' ? 4 : it.part === 'blade' ? 2 : 1; for (let i = 0; i < n; i++) { const u = Pt.x0 + (Pt.x1 - Pt.x0) * (i + 0.5) / n; addP(vadd(it.o, mv(it.R, [u * it.s, 0, 0])), Pt.hw * (it.part === 'blade' ? 0.7 : 1.2) * it.s, it.al); } }
      else addP(vadd(it.o, mv(it.R, Pt.c)), Pt.R * 0.75, it.al); }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const proj = pts.map(([p, r, w]) => { const g = V.toS([p[0], p[1], 0]), h = Math.max(0, p[2] + z); const rr = r * V.k * (1 + h * 0.12) * 1.25; x0 = Math.min(x0, g[0] - rr); x1 = Math.max(x1, g[0] + rr); y0 = Math.min(y0, g[1] - rr); y1 = Math.max(y1, g[1] + rr); return [g[0] + h * 0.22 * V.k, g[1] + h * 0.1 * V.k, rr, w / (1 + h * 0.25)]; });
    const sc = 0.25, W = Math.max(8, Math.ceil((x1 - x0) * sc) + 4), H = Math.max(8, Math.ceil((y1 - y0) * sc) + 4);
    if (!SHC || SHC.width < W || SHC.height < H) { SHC = document.createElement('canvas'); SHC.width = Math.max(W, SHC ? SHC.width : 0); SHC.height = Math.max(H, SHC ? SHC.height : 0); }
    const g = SHC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    for (const [px, py, rr, w] of proj) { const r2 = rr * sc; g.globalAlpha = Math.min(1, 0.55 * w); g.drawImage(TX.blob, (px - x0) * sc + 2 - r2, (py - y0) * sc + 2 - r2 * GY, r2 * 2, r2 * 2 * GY); }
    c.save(); c.globalAlpha = al * 0.42 / (1 + Math.max(0, z) * 0.2); c.imageSmoothingEnabled = true; c.drawImage(SHC, 0, 0, W, H, x0 - 2 / sc, y0 - 2 / sc, W / sc, H / sc); c.restore();
  }

  /* ================= anchors ================= */
  /* anchor(name) -> world { x, y, z } (game tiles; y on the game's ground) for the last draw; anchorDir(name) -> a unit direction (world) */
  function anchor(name) { if (!LAST) return null; const p = LAST.R.A[name]; if (!p) return null; return LAST.V.toW(p); }
  function anchorDir(name) { if (!LAST) return null; const p = LAST.R.A[name]; if (!p) return null; const w = mv(LAST.V.Rh, p); return { x: w[0], y: w[1] * GY, z: w[2] }; }
  const ANCHORS = ['swordTip', 'swordBase', 'swordChannel', 'swordEdgeA', 'swordEdgeB', 'hilt', 'handL', 'handR', 'cockpit', 'seat', 'thrusterL', 'thrusterR', 'wingRootL', 'wingRootR', 'helm', 'feet', 'footL', 'footR', 'center', 'pivot'];
  const DIRS = ['swordDir', 'swordFlat', 'thrusterDirL', 'thrusterDirR', 'up', 'forward'];

  /* ================= bake planning ================= */
  /* the keys a pose needs at a heading */
  function keysFor(P, a, set, camv) { const R = rig(P, 0), Rh = rotZ(a), K = camv ? camAt(camv[0], camv[1]) : null; for (const it of R.inst) { const Pt = PARTS[it.part], cam = camIn(mm(Rh, it.R), K); set.add(it.part + '|' + viewKey(Pt, cam)); } return set; }
  const HEADINGS = Array.from({ length: 16 }, (_, i) => i * STEP);
  const poseOf = (o) => Object.assign(blankPose(), o);
  /* the poses each form is drawn in besides its base (the sword's holds and the body's lean and bank): their quick views
     follow the base set (A's moves add more; a view a frame lacks is baked then, or the frame waits on a whole one) */
  function plannedPoses(form) {
    if (form === 'airship') return [poseOf({ form: 1, bank: 0.8 }), poseOf({ form: 1, bank: -0.8 }), poseOf({ form: 1, pitch: 0.6 })];
    return [poseOf({ sword: 'sweep', swordU: 0 }), poseOf({ sword: 'sweep', swordU: 0.5 }), poseOf({ sword: 'sweep', swordU: 1 }), poseOf({ sword: 'overhead', swordU: 0 }), poseOf({ sword: 'overhead', swordU: 1 }), poseOf({ sword: 'down', swordU: 1 }), poseOf({ lean: 0.8 }), poseOf({ bank: 0.8 }), poseOf({ bank: -0.8 })];
  }
  /* warmPlan({ form: 'robot' | 'airship' | 'xform' | 'all', heading, lo }): order the bake queue so that whole, coherent
     sets come first: the quick pictures of the base pose at the heading, then at the other headings (every 45 degrees
     first, then between), the transformation's at the heading, the planned poses'; then the sharp ones in the same
     order. Returns { pending, total }. */
  function warmPlan(o) {
    if (glOn()) return { pending: 0, total: 0 };
    o = o || {}; const form = o.form || 'robot', a0 = o.heading || 0, b0 = Math.round(a0 / STEP);
    const order = [0, 2, -2, 4, -4, 6, -6, 8, 1, -1, 3, -3, 5, -5, 7, -7].map(d => (((b0 + d) % 16) + 16) % 16);
    const forms = form === 'all' ? ['robot', 'airship', 'xform'] : [form];
    const keys = [], seen = new Set(), push = k => { if (!seen.has(k)) { seen.add(k); keys.push(k); } };
    const tiers = o.lo === false ? [''] : ['#lo', ''];
    for (const tier of tiers) {
      for (const fm2 of forms) {
        if (fm2 === 'xform') { const s = new Set(); for (let i = 0; i <= 24; i++) keysFor(poseOf({ xf: i / 24 }), b0 * STEP, s); for (const k of s) push(k + tier); continue; }
        const base = poseOf(fm2 === 'airship' ? { form: 1 } : {});
        for (const bi of order) for (const k of keysFor(base, bi * STEP, new Set())) push(k + tier);
      }
      for (const fm2 of forms) { if (fm2 === 'xform') continue; const ps = plannedPoses(fm2); for (const bi of order.slice(0, 8)) { const s = new Set(); for (const p of ps) keysFor(p, bi * STEP, s); for (const k of s) push(k + tier); } }
    }
    let pending = 0; const fresh = [];
    for (const k of keys) { if (doneKey(k)) continue; pending++; if (!BK.qset.has(k) && BK.genKey !== k) { BK.qset.add(k); fresh.push(k); } }
    // every quick picture of every plan before any sharp one; within a tier, in the order planned (a later plan's after an
    // earlier's); the views a frame asked for stay in front
    for (const k of keys) if (!BK.pri.has(k)) BK.pri.set(k, (k.endsWith('#lo') ? 0 : 1e7) + BK.prn++);
    BK.queue.push(...fresh); const pri = BK.pri; BK.queue.sort((p, q) => (pri.has(p) ? pri.get(p) : -1) - (pri.has(q) ? pri.get(q) : -1));
    return { pending, total: keys.length };
  }
  /* is a form drawable (every part of its base pose baked, sharp or quick) at a heading? */
  function ready(form, a, sharp) { if (glOn()) return true; if (!BK.k) return false; const s = keysFor(poseOf(form === 'airship' ? { form: 1 } : {}), Math.round((a || 0) / STEP) * STEP, new Set()); for (const k of s) { const sp = BK.spr.get(k); if (!sp || (sharp && sp.lo)) return false; } return true; }
  let IDLE = false;
  function idleBake() { if (IDLE || !(BK.gen || !TX || BK.queue.length)) return; IDLE = true; const go = () => { IDLE = false; idleBake(); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => { bakeStep(dl.didTimeout ? 2 : Math.max(1, Math.min(3, dl.timeRemaining() - 1))); go(); }, { timeout: 150 });
    else setTimeout(() => { bakeStep(2.5); go(); }, 40); }

  /* ================= pose channels ================= */
  const CH = ['form', 'xf', 'assemble', 'alpha', 'gait', 'gaitAmp', 'lean', 'bank', 'crouch', 'pitch', 'twist', 'roll', 'swordU', 'swordK', 'wingSpread', 'wingFold', 'thrust', 'glow', 'channel', 'charge', 'hatch', 'legSwing', 'wingSwayL', 'wingSwayR', 'hipYaw', 'swordArc'];
  function blankPose() { return { form: 0, xf: 0, assemble: 1, alpha: 1, gait: 0, gaitAmp: 0, lean: 0, bank: 0, crouch: 0, pitch: 0, twist: 0, roll: 0, sword: 'rest', swordU: 0, swordK: 1, wingSpread: 1, wingFold: 0, thrust: 0.4, glow: 0.5, channel: 0.3, charge: 0, legSwing: 0, wingSwayL: 0, wingSwayR: 0, hipYaw: 0, swordArc: 1 }; }
  const NEUTRAL = blankPose();
  /* relax(P, dt): ease the body channels toward neutral (not form, xf, sword or assemble) */
  function relax(P, dt) { const k = Math.min(1, dt * 6); for (const c2 of ['lean', 'bank', 'crouch', 'pitch', 'twist', 'gaitAmp', 'wingFold', 'charge', 'legSwing', 'wingSwayL', 'wingSwayR', 'hipYaw']) if (P[c2] != null) P[c2] += (NEUTRAL[c2] - P[c2]) * k; for (const c2 of ['wingSpread', 'thrust', 'glow', 'channel']) P[c2] += (NEUTRAL[c2] - P[c2]) * k * 0.5; }

  /* ================= clearance (the rig's collision check: each part as spheres; the closest approach of parts that are not joined) ================= */
  const JOINED = [['torso', 'pelvis'], ['torso', 'seat'], ['torso', 'hatch'], ['seat', 'hatch'], ['torso', 'helmet'], ['torso', 'drum'], ['torso', 'uarm'], ['torso', 'rail1'], ['torso', 'cradle'], ['drum', 'uarm'], ['drum', 'hub'], ['hub', 'blade'], ['blade', 'blade'], ['uarm', 'farm'], ['farm', 'hand'], ['hand', 'sword'], ['cradle', 'sword'], ['pelvis', 'thigh'], ['thigh', 'shin'], ['shin', 'foot'], ['pelvis', 'skirt'], ['rail1', 'rail2'], ['rail2', 'pod'], ['torso', 'hand'], ['hand', 'hand'], ['farm', 'sword'], ['torso', 'skirt'], ['thigh', 'skirt'], ['drum', 'helmet']];
  const SPH = { torso: [[0, 0, 0.3, 0.3], [0, 0, 0.7, 0.42], [0.05, 0.3, 0.9, 0.24], [0.05, -0.3, 0.9, 0.24]], pelvis: [[0, 0, 0, 0.26]], skirt: [[-0.12, 0, -0.3, 0.2], [-0.1, 0.25, -0.5, 0.18], [-0.1, -0.25, -0.5, 0.18]], helmet: [[0.02, 0, 0.25, 0.2], [0.1, 0.15, 0.6, 0.06], [0.1, -0.15, 0.6, 0.06]],
    drumL: [[-0.02, -0.28, 0.04, 0.44]], drumR: [[-0.02, 0.28, 0.04, 0.44]], hub: [[0, 0, 0, 0.18]], hand: [[0, 0, 0.06, 0.1]], foot: [[0.1, 0, -0.06, 0.12]], seat: [[-0.05, 0, 0.12, 0.1]] };
  const axisSph = (Pt, n, r) => { const o = []; for (let i = 0; i < n; i++) o.push([Pt.x0 + 0.08 + (Pt.x1 - Pt.x0 - 0.16) * (i + 0.5) / n, 0, 0, r]); return o; };
  const ASPH = { uarm: axisSph(PARTS.uarm, 3, 0.17), farm: axisSph(PARTS.farm, 3, 0.19), thigh: axisSph(PARTS.thigh, 3, 0.24), shin: axisSph(PARTS.shin, 3, 0.2), pod: axisSph(PARTS.pod, 4, 0.16), rail: axisSph(PARTS.rail, 3, 0.07), cradle: axisSph(PARTS.cradle, 2, 0.05), sword: axisSph(PARTS.sword, 14, 0.07) };
  const base = n => n.replace(/[LR][0-6]?$/, '').replace(/[0-6]$/, '');
  function clearance(P) {
    const R = rig(P, 0), S2 = [];
    for (const it of R.inst) { const nb = base(it.name), list = it.part === 'blade' ? [0.45, 0.9, 1.35, 1.8].map(u => [u, bladeC(u) + bladeW(u) * 0.12, 0, 0.09]) : SPH[it.part] || ASPH[it.part] || ASPH[nb] || []; for (const s of list) S2.push({ n: it.name, b: nb === 'rail' ? it.name.slice(0, 5) : nb, p: vadd(it.o, mv(it.R, vmul([s[0], s[1], s[2]], it.s))), r: s[3] * (it.part === 'blade' ? 1 : it.s), side: /L/.test(it.name.slice(-2)) ? -1 : /R/.test(it.name.slice(-2)) ? 1 : 0 }); }
    const isJ = (a, b) => JOINED.some(([p, q]) => (a.b.startsWith(p) && b.b.startsWith(q)) || (a.b.startsWith(q) && b.b.startsWith(p)));
    let worst = { d: 9, a: '', b: '' };
    for (let i = 0; i < S2.length; i++) for (let j = i + 1; j < S2.length; j++) { const a = S2[i], b = S2[j]; if (a.n === b.n) continue; if (isJ(a, b) && (a.side === b.side || !a.side || !b.side || a.b === b.b)) continue; const d = vlen(vsub(a.p, b.p)) - a.r - b.r; if (d < worst.d) worst = { d, a: a.n, b: b.n }; }
    return { min: worst.d, a: worst.a, b: worst.b, reachShort: R.short, floor: Math.min(...R.inst.filter(it => it.part !== 'sword').map(it => it.o[2])) };
  }

  /* ================= the interface ================= */
  /* create({ T, dpr }): an instance with its own pose */
  function create(opts) { opts = opts || {}; if (opts.T) setScale(opts.T * (opts.dpr || 1) * (opts.scale || 1)); const P = blankPose();
    return { pose: P, draw: (c, x, y, z, a, P2, o) => draw(c, x, y, z, a, P2 || P, o), drawShadow: (c, x, y, z, a, P2, o) => drawShadow(c, x, y, z, a, P2 || P, o), anchor, anchorDir, warm: ms => bakeStep(ms) }; }
  function warmIdle(T, dpr) { if (glOn()) return; if (T > 0) setScale(T * (dpr || 1)); idleBake(); }
  return { create, warm: ms => glOn() ? true : bakeStep(ms), warmIdle, warmPlan, ready, setScale, draw, drawShadow, anchor, anchorDir, ANCHORS, DIRS, blankPose, relax, CH, XF_STAGES, XF_BOUNDS, POSES, VIS, stagesAt, rig, clearance, SWORD: SW, VIEW: { GY, ZK },
    __dbg: { get GLM() { return typeof GLM !== "undefined" ? GLM : null; }, get gl() { return glOn(); }, set noGL(v) { NOGL = !!v; }, get glStats() { const st2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, st2, { ms: +GLMS.toFixed(2), renderMs: +GLR.toFixed(2), copyMs: +GLD.toFixed(2), frames: GLN, box: BK.glBox, meshMs: +MESH_MS.toFixed(1), meshTris: MESH ? Object.values(MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0 }); }, get MESH() { return MESH; }, drawSprite, get NTR() { return NTR; }, BK, PARTS, bakeStep, keysFor, viewKey, camIn, frameOfKey, want, get TX() { return TX; }, swordHold } };

})();
