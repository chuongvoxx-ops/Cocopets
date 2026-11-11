/* ---------- Fire, the 11th Ultimate: Nidhogg, the model and its animation (worker B4; no gameplay yet) ----------
   A long crimson dragon fused with an infernal war machine, built on the user's concept art: a narrow predatory head
   with swept-back gunmetal horns and a crown of spikes, glowing eyes and a toothy jaw; an arched scaled neck; a body
   of living crimson scales under overlapping scarlet armour, a segmented belly lit from within, furnace vents with
   orange slats on the flanks, dark steel joints and pistons; wyvern wings (the forelimbs) on mechanical braces with
   round orange-lit hubs, four fingers with long claws and veined membranes that let red light through; clawed hind
   legs; a very long whip tail lined with red dorsal spikes, ending in a bladed spearhead with glowing seams; the pet's
   armoured seat behind the neck; and (Ultima) glowing traced outlines on its seams and silhouette and a thick glowing
   rune ring turning over it. The neck and tail are continuous swept strips and every chain is attached to the torso
   as drawn, so the body stays one connected creature at every heading, bank and turn rate.
   How it is drawn: the rigid pieces (torso, head, lower jaw, a neck segment, a tail segment, the tail blade, the foot)
   are signed-distance models, sphere-traced per heading (16) into sprites with physically based shading (a studio
   environment through Fresnel, a key light with soft self-shadows, a cool sky rim, occlusion, scales, scratches, worn
   edges, seams); the glowing parts also get an emission layer, drawn additively by the glow channels. Each piece is
   laid on screen by an affine map built from its own 3D axes, so one bake serves the body's heading, pitch and bank,
   every neck and tail segment's own direction and the jaw's opening. The bones (wing arms and fingers, claws, hubs,
   dorsal spikes, leg bones) are traced side-on once and laid along their 3D bones; the membranes are drawn each frame
   as panels between the projected bones, filled with a baked vein texture mapped per panel and lit by their normal.
   NIDHOGG_MODEL is the whole interface (see docs/FIRE-NIDHOGG-BRIEF.md): create / warm / draw / drawShadow / anchor,
   the pose channels, the clips (pose drivers) and a dev-only preview reached through the test hook. */
const NIDHOGG_MODEL = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const wrap = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  /* the camera (the game's): orthographic from 46 degrees up; a tile across is a tile on screen, GY toward the viewer, ZK of height */
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;
  const VIS = 1.25, HEADK = 3.0, TK = 1.7, WK = 1.36, LK = 1.6;   // (the head and the torso drawn this much larger than modelled)   // (the head drawn this much larger than modelled)   // the rig's units drawn at this many tiles
  const FIRE = '#FF7A1A', EMBER = '#FFB347', CORE = '#FFF4D8', CRIM = '#E0283F', RUNE = '#FF3A2A';

  /* ================= signed-distance modelling ================= */
  const M_SCALE = 0, M_ARMOR = 1, M_STEEL = 2, M_HORN = 3, M_BELLY = 4, M_SEAM = 5, M_VENT = 6, M_EYE = 7, M_TOOTH = 8, M_MOUTH = 9, M_TALON = 10, M_HUB = 11, M_DARK = 12, M_SEAT = 13, M_CLAW = 14, M_GOLD = 15, M_GEM = 16, M_IRIS = 17;
  const hyp = (a, b) => Math.sqrt(a * a + b * b), hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);
  const sph = (x, y, z, r) => Math.sqrt(x * x + y * y + z * z) - r;
  function ell(x, y, z, a, b, c) { const X = x / a, Y = y / b, Z = z / c, k0 = Math.sqrt(X * X + Y * Y + Z * Z); if (k0 < 1e-6) return -Math.min(a, b, c); const k1 = Math.sqrt(X * X / (a * a) + Y * Y / (b * b) + Z * Z / (c * c)); return k0 * (k0 - 1) / k1; }
  function cap(x, y, z, ax, ay, az, bx, by, bz, r1, r2) { const px = x - ax, py = y - ay, pz = z - az, dx = bx - ax, dy = by - ay, dz = bz - az; const h = cl((px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz)); return hyp3(px - dx * h, py - dy * h, pz - dz * h) - (r2 == null ? r1 : r1 + (r2 - r1) * h); }
  function rbox(x, y, z, bx, by, bz, r) { const qx = Math.abs(x) - bx + r, qy = Math.abs(y) - by + r, qz = Math.abs(z) - bz + r; return hyp3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r; }
  const smin = (a, b, k) => { const h = cl(0.5 + 0.5 * (b - a) / k); return b + (a - b) * h - k * h * (1 - h); };
  const torX = (x, y, z, R, r) => hyp(hyp(y, z) - R, x) - r;
  const fm = (a, m) => a - Math.floor(a / m) * m;
  /* the scene's accumulators in one typed array (no boxed numbers): Q[0] distance, Q[1] the nearest piece's distance */
  const Q = new Float64Array(6); let SM = 0;
  function add(d, m, k) { Q[0] = k ? smin(Q[0], d, k) : (d < Q[0] ? d : Q[0]); if (d < Q[1]) { Q[1] = d; SM = m; } }
  function carve(d, m) { if (-d > Q[0]) { Q[0] = -d; SM = m; Q[1] = -d; } }
  const far = (bd, k) => bd > Q[0] + (k || 0) + 0.02;
  const reset = m => { Q[0] = 1e9; Q[1] = 1e9; SM = m; };
  /* a cone: from (ax, ay, az) radius r1 to (bx, by, bz) radius ~0 (a spike or a horn) */
  const cone = (x, y, z, ax, ay, az, bx, by, bz, r1) => cap(x, y, z, ax, ay, az, bx, by, bz, r1, 0.004);

  /* ---- the torso (origin: the body's centre between the wing roots; x forward, y to its right, z up) ---- */
  const SEAT = { x: 0.42, z: 0.46 };
  const BELLY_X = [0.62, 0.46, 0.3, 0.14, -0.02, -0.18, -0.34, -0.5, -0.66, -0.82];
  function sdTorso(x, y, z) {
    reset(M_SCALE); const ay = Math.abs(y);
    // the deep chest, the long abdomen, the haunches
    let bd = smin(ell(x - 0.34, y, z - 0.02, 0.58, 0.46, 0.42), ell(x + 0.32, y, z + 0.02, 0.66, 0.38, 0.34), 0.16);
    bd = smin(bd, ell(x + 0.84, y, z + 0.0, 0.34, 0.31, 0.28), 0.12);
    bd = smin(bd, ell(x - 0.16, ay - 0.34, z - 0.24, 0.2, 0.16, 0.15), 0.1);   // (the wing shoulders)
    add(bd, M_SCALE);
    if (bd < 0.1) {
      // the segmented belly: plates lit from within, a glowing seam between each
      if (z < 0.02) { const bel = Math.max(bd - 0.022, z + 0.1 - 0.9 * ay * ay, ay - 0.36); if (bel < 0.03) { let sg = 1; for (let i = 0; i < BELLY_X.length; i++) { const d = Math.abs(x - BELLY_X[i]); if (d < sg) sg = d; }
        add(bel, M_BELLY); if (sg < 0.014 && bel < 0.01) carve(Math.max(sg - 0.012, -(bd + 0.03), -bel - 0.03), M_SEAM); } }
      // overlapping scarlet armour on the back and shoulders (each lame proud at its back edge), dark seams between
      if (z > 0.06) for (let i = 0; i < 6; i++) { const x1 = 0.66 - i * 0.26, x0 = x1 - 0.3; if (x < x0 - 0.02 || x > x1 + 0.02) continue; const u = cl((x1 - x) / 0.3);
        const mk = Math.max(x - x1, x0 - x, ay - (0.36 - 0.05 * Math.abs(i - 2)), 0.1 - z), lame = Math.max(bd - 0.03 - 0.022 * u, mk); add(lame, M_ARMOR); if (Math.abs(x - x0) < 0.016 && lame < 0.02) carve(Math.max(Math.abs(x - x0) - 0.01, -(bd + 0.005), ay - 0.2), M_SEAM); }
      // the flank vents: a steel housing with orange slats, both sides
      if (ay > 0.26 && x > -0.2 && x < 0.44) { const vb = rbox(x - 0.12, ay - 0.42, z - 0.02, 0.22, 0.06, 0.13, 0.03); if (vb < 0.05) { add(vb, M_STEEL); carve(Math.max(Math.abs(fm(x - 0.12, 0.075) - 0.0375) - 0.017, Math.abs(z - 0.02) - 0.1, Math.abs(x - 0.12) - 0.19, 0.45 - ay), M_VENT); } }
      // the dark mechanical tube along each flank, behind the vents
      add(cap(x, ay, z, -0.25, 0.34, -0.02, -0.85, 0.27, 0.0, 0.065), M_STEEL);
    }
    // the wing mounts: steel hubs with an orange-lit ring
    add(sph(x - 0.16, ay - 0.42, z - 0.3, 0.12), M_STEEL); add(torX(ay - 0.53, x - 0.16, z - 0.3, 0.085, 0.02), M_HUB);
    // the hip joints
    add(sph(x + 0.62, ay - 0.3, z + 0.2, 0.12), M_STEEL);
    // the rider's armoured seat behind the neck: a dark padded cup in a scarlet shell with a steel rim, a high back
    if (!far(sph(x - SEAT.x, y, z - SEAT.z - 0.06, 0.3))) {
      const shell = rbox(x - SEAT.x, y, z - SEAT.z + 0.02, 0.15, 0.17, 0.08, 0.06); add(shell, M_ARMOR);
      carve(rbox(x - SEAT.x - 0.01, y, z - SEAT.z - 0.06, 0.11, 0.12, 0.08, 0.05), M_SEAT);
      add(rbox(x - SEAT.x + 0.16, y, z - SEAT.z - 0.1, 0.035, 0.16, 0.13, 0.03), M_ARMOR); add(torX(x - SEAT.x + 0.2, y, z - SEAT.z - 0.02, 0.1, 0.018), M_STEEL);
    }
    // spike sockets along the spine behind the seat
    return 0;
  }
  /* ---- the neck's and the tail's skin: a tube along x seen from above (its back, +z, toward the viewer), periodic every
     PD so one period tiles seamlessly along a swept strip: a scarlet armour lame on top of each period (proud at its back
     edge, a glowing seam in the gap behind it), scales on the flanks, glowing belly plates under them; the tail also has
     steel side rails with a glowing seam ---- */
  const PD = 0.25, TL = 0.75, RT = 0.15;
  function sdTube(tail) { return (x, y, z) => {
    reset(M_SCALE); const ay = Math.abs(y), xm = fm(x, PD) - PD / 2, u = cl((PD / 2 - xm) / PD), r = hyp(y, z * 1.05), rr = r - RT;
    add(Math.max(rr, -x, x - TL), M_SCALE);
    if (rr < 0.07) {
      add(Math.max(rr - 0.028 - 0.02 * u, 0.045 - z, ay - (tail ? 0.105 : 0.115), Math.abs(xm) - PD / 2 + 0.007, -x, x - TL), M_ARMOR);
      add(Math.max(rr - 0.004, PD / 2 - 0.009 - Math.abs(xm), 0.035 - z, -x, x - TL), M_SEAM);
      if (tail) add(Math.max(rr - 0.012, Math.abs(z) - 0.028, 0.1 - ay, -x, x - TL), Math.abs(z) < 0.01 ? M_SEAM : M_STEEL);
      else add(Math.max(rr - 0.012, Math.abs(z + 0.02) - 0.026, 0.11 - ay, Math.abs(xm) - 0.085, -x, x - TL), M_ARMOR);
      add(Math.max(rr - 0.016, z + 0.055, ay - 0.13, -x, x - TL), Math.abs(xm + PD / 2 - 0.012) < 0.012 ? M_SEAM : M_BELLY);
    }
    return 0; }; }
  /* ---- the tail's bladed spearhead (origin: its base): a flat leaf blade with two back barbs and a glowing centre seam ---- */
  function sdTip(x, y, z) {
    reset(M_ARMOR); const ay = Math.abs(y);
    const w = x < 0.12 ? 0.05 + x * 0.9 : 0.16 * (1 - (x - 0.12) / 0.5);
    add(Math.max(ay - Math.max(0, w), Math.abs(z) - 0.035 + ay * 0.12, -x - 0.02, x - 0.62), M_ARMOR);
    add(cap(x, ay, z, 0.12, 0.12, 0, -0.08, 0.27, 0.0, 0.03, 0.004), M_ARMOR);
    add(cap(x, y, z, -0.1, 0, 0, 0.12, 0, 0, 0.07, 0.05), M_STEEL);
    if (ay < 0.02 && Math.abs(z) < 0.05) carve(Math.max(ay - 0.012, Math.abs(z) - 0.06, 0.06 - x, x - 0.5), M_SEAM);
    return 0;
  }
  /* ---- the head (origin: the neck joint; x forward, y right, z up): a long, narrow armoured snout of layered scarlet
     nasal plates (bevelled, seamed, each proud at its front edge) over scaled skin, a ridge of steel studs and small
     spikes down its top, flared nostrils with an ember glow, a gunmetal lip line over a row of teeth; heavy armoured
     brows rimmed in bronze and riveted, a crimson gem in a bronze bezel between them, recessed eyes (a glossy eyeball,
     a slit pupil in a radial gold iris, a glowing rim); riveted cheek plates; thick swept gunmetal horns with bronze
     bands; a crown and cheek frills of spikes ---- */
  const nrm0 = v => { const l = hyp3(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }, EYE = [0.21, 0.13, 0.04], EYER = 0.044, EYEG = nrm0([0.4, 0.78, 0.48]), EYEU = (() => { const u = [-0.2, -0.38, 0.9], d = u[0] * EYEG[0] + u[1] * EYEG[1] + u[2] * EYEG[2]; return nrm0([u[0] - EYEG[0] * d, u[1] - EYEG[1] * d, u[2] - EYEG[2] * d]); })();   // (eye centre, radius, gaze, the slit's up)
  const GEMC = [0.15, 0, 0.122];
  /* the distance to a segment and (in Q[5]) the parameter along it */
  function capH(x, y, z, ax, ay, az, bx, by, bz, r1, r2) { const px = x - ax, py = y - ay, pz = z - az, dx = bx - ax, dy = by - ay, dz = bz - az, h = cl((px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz)); Q[5] = h; return hyp3(px - dx * h, py - dy * h, pz - dz * h) - lerp(r1, r2, h); }
  /* a horn segment with bronze bands at the given parameters */
  function hornSeg(x, y, z, ax, ay, az, bx, by, bz, r1, r2, bands) { const d = capH(x, y, z, ax, ay, az, bx, by, bz, r1, r2), h = Q[5]; add(d, M_HORN, 0.012);
    if (d < 0.03) for (const hb of bands) add(Math.max(d - 0.011, Math.abs(h - hb) * hyp3(bx - ax, by - ay, bz - az) - 0.013), M_GOLD); }
  function sdHead(x, y, z) {
    reset(M_SCALE); const ay = Math.abs(y), h = cl((x - 0.05) / 0.6), zc = -0.03 - 0.03 * h;
    // the skull, and the snout's core: an angular wedge (a sloping top, flat flanks drawn in below, a chamfer between,
    // a flat underside) in scaled skin that shows between and under the plates
    add(ell(x + 0.02, y, z - 0.03, 0.22, 0.165, 0.15), M_SCALE);
    const wS = 0.122 - 0.062 * h, tS = 0.112 - 0.15 * h, bS = -0.085 + 0.01 * h;
    const smax = (a, b, k) => -smin(-a, -b, k);
    const sn = Math.max(smax(smax(smax(z - tS, (ay - wS + (z < zc ? (zc - z) * 0.35 : 0)) * 0.94, 0.03), (ay * 0.85 + z - (tS + wS * 0.6)) * 0.76, 0.025), bS - z, 0.02), x - 0.66, -0.02 - x); add(sn, M_SCALE, 0.03);
    // the layered nasal plates: four bands over the top and the chamfers, each rising toward its front edge, then a
    // step down to the next (a seam with a worn bevel)
    { const u = cl((x - 0.06) / 0.58), f = fm(u * 4 + 0.15, 1), t = 0.008 + 0.02 * f; add(Math.max(sn - t, zc + 0.03 - z, x - 0.645, 0.04 - x), M_ARMOR); }
    // the ridge down the top: steel studs, small swept spikes between them
    if (!far(Math.max(Math.abs(x - 0.36) - 0.32, ay - 0.04, -z))) for (let i = 0; i < 6; i++) { const xs = 0.13 + i * 0.085, hs = cl((xs - 0.05) / 0.6), zt = 0.112 - 0.15 * hs + 0.024;
      if (i & 1) add(cone(x, y, z, xs, 0, zt - 0.01, xs - 0.05, 0, zt + 0.045, 0.017), M_HORN); else add(sph(x - xs, y, z - zt + 0.004, 0.017), M_STEEL); }
    // the nostrils: a flared rim, an ember-lit hole
    add(ell(x - 0.6, ay - 0.042, z - 0.0, 0.05, 0.03, 0.028), M_ARMOR, 0.01);
    carve(sph(x - 0.635, ay - 0.044, z - 0.006, 0.016), M_VENT);
    // the lip line: a gunmetal trim along each side of the upper jaw; the teeth under it
    add(cap(x, ay, z, 0.06, 0.118, -0.075, 0.64, 0.055, -0.07, 0.015, 0.01), M_STEEL);
    if (z < -0.04 && x > 0.1) for (let i = 0; i < 7; i++) { const tx = 0.16 + i * 0.07, ty = 0.1 - i * 0.008, L = i === 6 ? 0.1 : 0.065; add(cone(x, ay, z, tx, ty, -0.08, tx + 0.012, ty - 0.004, -0.08 - L, 0.019), M_TOOTH); }
    // riveted cheek plates
    add(Math.max(ell(x - 0.05, ay - 0.13, z + 0.02, 0.14, 0.06, 0.08), ay - 0.172), M_ARMOR, 0.012);
    if (!far(sph(x - 0.06, ay - 0.18, z + 0.03, 0.12))) for (let i = 0; i < 3; i++) add(sph(x - (-0.03 + i * 0.06), ay - 0.172, z + 0.03 - i * 0.004, 0.0105), M_STEEL);
    // the eye: a recessed socket, the eyeball, a thin glowing rim round it
    { const qx = x - EYE[0], qy = ay - EYE[1], qz = z - EYE[2], de = hyp3(qx, qy, qz);
      if (de < 0.11) { carve(de - 0.056, M_DARK); const tt = qx * EYEG[0] + qy * EYEG[1] + qz * EYEG[2], rr = hyp3(qx - EYEG[0] * tt, qy - EYEG[1] * tt, qz - EYEG[2] * tt);
        add(hyp(rr - 0.053, tt - 0.012) - 0.007, M_SEAM); add(de - EYER, M_IRIS); } }
    // the heavy brows over the eyes: armoured, rimmed in bronze, riveted
    { const px = x - 0.19, py = ay - 0.1, pz = z - 0.132, cy = Math.cos(0.32), sy = Math.sin(0.32), qx = px * cy + py * sy, qy = -px * sy + py * cy, cp = Math.cos(0.3), sp = Math.sin(0.3), rx = qx * cp - pz * sp, rz = qx * sp + pz * cp;
      const tp = cl((rx + 0.06) / 0.22), d = Math.max(ell(rx, qy, rz, 0.155, 0.058 - 0.03 * tp, 0.038), -rz - 0.012); add(d, M_ARMOR, 0.012);   // (a tapered leaf of armour, flat underneath)
      add(Math.max(Math.abs(d + 0.004) - 0.009, -rz - 0.012, rz - 0.004, -qy), M_GOLD); }
    if (!far(sph(x - 0.19, ay - 0.105, z - 0.165, 0.1))) for (let i = 0; i < 3; i++) add(sph(x - (0.13 + i * 0.065), ay - (0.112 - i * 0.016), z - (0.18 - i * 0.008), 0.0095), M_STEEL);
    // the brow gem in its bronze bezel
    { const gx = x - GEMC[0], gy = y, gz = z - GEMC[2]; if (hyp3(gx, gy, gz) < 0.08) { add(hyp(hyp(gx * 0.8, gy) - 0.036, gz + 0.006) - 0.01, M_GOLD); add(Math.max((Math.abs(gx) * 0.75 + Math.abs(gy) + Math.abs(gz) * 1.6 - 0.04) * 0.5, sph(gx, gy, gz, 0.036)), M_GEM); } }
    // the horns: thick swept gunmetal with bronze bands; a lower horn
    hornSeg(x, ay, z, 0.02, 0.1, 0.12, -0.22, 0.165, 0.22, 0.068, 0.05, [0.35, 0.8]);
    hornSeg(x, ay, z, -0.22, 0.165, 0.22, -0.62, 0.16, 0.27, 0.05, 0.006, [0.25]);
    hornSeg(x, ay, z, -0.02, 0.13, 0.03, -0.34, 0.21, 0.07, 0.038, 0.004, [0.3]);
    // the crown and the cheek frills
    if (!far(sph(x + 0.2, y, z - 0.12, 0.46))) {
      for (let i = -4; i <= 4; i++) { const yy = i * 0.03, L = 0.38 - Math.abs(i) * 0.03; add(cone(x, y, z, -0.02, yy, 0.13, -0.02 - L * 0.85, yy * 2.2, 0.13 + L * 0.5, 0.026), M_ARMOR); }
      for (let i = 0; i < 4; i++) { const xx = 0.08 - i * 0.07; add(cone(x, ay, z, xx, 0.15, -0.03 - i * 0.01, xx - 0.3, 0.27 + i * 0.03, -0.05 - i * 0.02, 0.026), M_ARMOR); }
    }
    return 0;
  }
  /* ---- the lower jaw (origin: the hinge): deep and heavy, banded armour along its sides over scaled skin, a gunmetal lip
     line with teeth, a riveted chin plate, a frill of spikes under it, the glowing mouth ---- */
  function sdJaw(x, y, z) {
    reset(M_SCALE); const ay = Math.abs(y);
    const jd = Math.max(cap(x, y, z * 1.25, 0.0, 0, -0.02, 0.52, 0, -0.02, 0.11, 0.05) / 1.25, -x - 0.06); add(jd, M_SCALE);
    { const u = cl(x / 0.5), f = fm(u * 3 + 0.2, 1); add(Math.max(jd - 0.008 - 0.016 * f, z + 0.005, 0.02 - x, x - 0.5), M_ARMOR); }
    add(ell(x - 0.14, y, z + 0.075, 0.18, 0.09, 0.06), M_ARMOR, 0.01);
    if (!far(sph(x - 0.14, y, z + 0.12, 0.08))) for (const yy of [-0.05, 0, 0.05]) add(sph(x - 0.14, y - yy, z + 0.128, 0.0095), M_STEEL);
    add(cap(x, ay, z, 0.02, 0.085, 0.03, 0.5, 0.042, 0.028, 0.014, 0.01), M_STEEL);
    carve(Math.max(cap(x, y, z, 0.05, 0, 0.06, 0.48, 0, 0.03, 0.06, 0.028), -z), M_MOUTH);
    for (let i = 0; i < 6; i++) { const tx = 0.12 + i * 0.065, ty = 0.07 - i * 0.009; add(cone(x, ay, z, tx, ty, 0.025, tx - 0.008, ty, 0.12, 0.019), M_TOOTH); }
    for (let i = 0; i < 4; i++) { const xx = 0.05 + i * 0.07; add(cone(x, ay, z, xx, 0.06, -0.07, xx - 0.22, 0.12 + i * 0.02, -0.2, 0.022), M_ARMOR); }
    return 0;
  }
  /* ---- a hind foot (origin: the ankle; the toes forward and down): a pad, three toes, dark curved talons ---- */
  function sdFoot(x, y, z) {
    reset(M_SCALE);
    add(ell(x - 0.06, y, z + 0.04, 0.12, 0.09, 0.06), M_SCALE); add(sph(x, y, z, 0.06), M_STEEL);
    for (let i = 0; i < 3; i++) { const a = (i - 1) * 0.45, c = Math.cos(a), s = Math.sin(a); add(cap(x, y, z, 0.05 * c, 0.05 * s, -0.04, 0.17 * c, 0.17 * s, -0.06, 0.035, 0.028), M_SCALE); add(cap(x, y, z, 0.17 * c, 0.17 * s, -0.06, 0.27 * c, 0.27 * s, -0.13, 0.024, 0.004), M_TALON); }
    add(cap(x, y, z, -0.06, 0, -0.03, -0.17, 0, -0.1, 0.022, 0.004), M_TALON);
    return 0;
  }
  /* ---- the pieces laid along bones (traced side-on: x along the bone from 0 to L, y up on the sprite, z toward the viewer) ---- */
  function sdWbone(x, y, z) {   // a wing arm: shingled scarlet armour (each plate proud at its far end), a ridge of small spikes on top, a gunmetal brace and piston below
    reset(M_ARMOR); const r = hyp(y, z * 1.15), f = fm(x * 5, 1), rr = 0.072 - 0.018 * x + 0.016 * f;
    add(Math.max(r - rr, -x, x - 1), f > 0.9 ? M_DARK : M_ARMOR);
    add(Math.max(hyp(y + 0.075, z) - 0.026, 0.05 - x, x - 0.95), M_STEEL); add(Math.max(hyp(y + 0.075, z) - 0.036, 0.05 - x, x - 0.42), M_STEEL);
    for (let i = 0; i < 5; i++) { const sx = 0.12 + i * 0.2; add(cone(x, y, z, sx, 0.05, 0, sx - 0.09, 0.13, 0, 0.026), M_ARMOR); }
    return 0; }
  function sdWfing(x, y, z) { reset(M_ARMOR); const r = hyp(y, z); add(Math.max(r - (0.032 - 0.014 * x), -x, x - 1), M_STEEL); add(Math.max(r - (0.042 - 0.02 * x), Math.abs(fm(x, 0.25) - 0.12) - 0.07, -x, x - 0.92), M_ARMOR); return 0; }
  function sdClaw(x, y, z) { reset(M_CLAW); const by = 0.12 * x * x; add(Math.max(hyp(y + by, z * 1.4) / 1.2 - 0.05 * (1 - x) - 0.003, -x, x - 1), M_CLAW); return 0; }
  function sdHub(x, y, z) { reset(M_STEEL); add(sph(x, y, z, 0.1), M_STEEL); add(Math.max(hyp(x, y) - 0.085, Math.abs(z - 0.07) - 0.03), M_STEEL); carve(Math.max(Math.abs(hyp(x, y) - 0.055) - 0.016, 0.07 - z), M_HUB); add(sph(x, y, z - 0.085, 0.03), M_HUB); return 0; }
  function sdSpike(x, y, z) { reset(M_ARMOR); const by = 0.12 * x * x, r = (Math.abs(y + by) * 0.8 + Math.abs(z) * 1.7) / 1.5; add(Math.max(r - 0.1 * (1 - x) - 0.003, -x, x - 1), M_ARMOR); add(Math.max(hyp(y, z) - 0.07, -x, x - 0.06), M_DARK); return 0; }
  function sdThigh(x, y, z) { reset(M_SCALE); add(ell(x - 0.22, y, z, 0.26, 0.15, 0.15), M_SCALE); add(Math.max(ell(x - 0.24, y - 0.06, z, 0.22, 0.12, 0.13) - 0.01, -y), M_ARMOR); return 0; }
  function sdShin(x, y, z) { reset(M_SCALE); add(cap(x, y, z, 0, 0, 0, 0.4, 0, 0, 0.075, 0.055), M_SCALE); add(Math.max(hyp(y - 0.05, z) - 0.05, 0.05 - x, x - 0.33), M_STEEL); add(sph(x, y, z, 0.085), M_STEEL); return 0; }
  const PARTS = {
    torso: { f: sdTorso, c: [-0.12, 0, 0.04], R: 1.32, glow: true },
    head: { f: sdHead, c: [0.0, 0, 0.06], R: 0.74, glow: true },
    jaw: { f: sdJaw, c: [0.2, 0, -0.04], R: 0.42, glow: true },
    tip: { f: sdTip, c: [0.25, 0, 0], R: 0.42, glow: true },
    foot: { f: sdFoot, c: [0.08, 0, -0.04], R: 0.34 },
  };
  const NRAD = u => RT * lerp(2.95, 1.85, u), TRAD = u => RT * lerp(2.9, 0.75, Math.pow(u, 0.85));   // (the neck's and the tail's radius along them, base to tip)
  const PART_ORDER = ['torso', 'head', 'jaw', 'tip', 'foot'];
  const SEGS = { wbone: { f: sdWbone, L: 1, R: 0.15 }, wfing: { f: sdWfing, L: 1, R: 0.05 }, claw: { f: sdClaw, L: 1, R: 0.17 }, hub: { f: sdHub, L: 0, R: 0.13, ball: true }, spike: { f: sdSpike, L: 1, R: 0.14 }, thigh: { f: sdThigh, L: 0.46, R: 0.17 }, shin: { f: sdShin, L: 0.4, R: 0.1 }, ntube: { f: sdTube(false), L: TL, R: 0.24, tube: true }, ttube: { f: sdTube(true), L: TL, R: 0.24, tube: true } };
  const SEG_ORDER = Object.keys(SEGS).filter(k => k !== 'spike');   // (the dorsal spikes are drawn as 3D pyramids now: sdSpike is kept for reference, not baked)

  /* ================= shading ================= */
  const hsh = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
  function vnoise(x, y) { const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = hsh(i, j), b = hsh(i + 1, j), c2 = hsh(i, j + 1), d = hsh(i + 1, j + 1), su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); return lerp(lerp(a, b, su), lerp(c2, d, su), sv); }
  const nrm = v => { const l = hyp3(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const LW = nrm([-0.5, 0.25, 0.83]), SBW = nrm([-0.22, -0.42, 0.88]), RIMW = nrm([0.5, -0.78, 0.36]);
  const KEYC = [1.25, 1.12, 0.98], RIMC = [0.5, 0.66, 1.0], SKYC = [0.5, 0.55, 0.66], GNDC = [0.22, 0.12, 0.1];
  /* materials: albedo, F0 (reflectance), roughness, metal, emission [r, g, b] at rest (the glow layers add the rest) */
  const MATS = [
    { a: [0.16, 0.012, 0.03], f: [0.05, 0.035, 0.04], r: 0.42, m: 0 },       // living crimson scales
    { a: [0.17, 0.012, 0.022], f: [0.72, 0.085, 0.11], r: 0.3, m: 1 },         // scarlet armour
    { a: [0.07, 0.07, 0.08], f: [0.4, 0.41, 0.45], r: 0.32, m: 1 },        // dark steel
    { a: [0.12, 0.12, 0.13], f: [0.62, 0.63, 0.66], r: 0.22, m: 1 },       // silver-gunmetal horn
    { a: [0.85, 0.45, 0.12], f: [0.06, 0.05, 0.04], r: 0.34, m: 0, e: [0.35, 0.1, 0.0] },   // the belly plates (lit from within)
    { a: [0.1, 0.02, 0.0], f: [0, 0, 0], r: 1, m: 0, e: [0.9, 0.3, 0.04] },               // a glowing seam
    { a: [0.1, 0.02, 0.0], f: [0, 0, 0], r: 1, m: 0, e: [1.0, 0.42, 0.08] },              // a vent's fire
    { a: [1, 0.5, 0.1], f: [0, 0, 0], r: 1, m: 0, e: [1.6, 0.8, 0.2] },                   // an eye
    { a: [0.82, 0.74, 0.6], f: [0.06, 0.06, 0.05], r: 0.3, m: 0 },        // teeth
    { a: [0.3, 0.03, 0.02], f: [0, 0, 0], r: 1, m: 0, e: [0.9, 0.22, 0.04] },             // the mouth's fire
    { a: [0.05, 0.04, 0.045], f: [0.3, 0.3, 0.32], r: 0.2, m: 1 },        // dark talons
    { a: [0.2, 0.08, 0.02], f: [0, 0, 0], r: 1, m: 0, e: [1.0, 0.45, 0.1] },              // a hub's lit ring
    { a: [0.015, 0.01, 0.01], f: [0.04, 0.04, 0.04], r: 0.5, m: 0 },      // a dark recess
    { a: [0.12, 0.03, 0.03], f: [0.05, 0.04, 0.04], r: 0.55, m: 0 },      // the seat's padding
    { a: [0.18, 0.18, 0.2], f: [0.72, 0.73, 0.78], r: 0.16, m: 1 },       // silver claws
    { a: [0.25, 0.16, 0.05], f: [1.0, 0.7, 0.32], r: 0.27, m: 1 },        // bronze-gold trim
    { a: [0.4, 0.02, 0.03], f: [0.1, 0.04, 0.04], r: 0.05, m: 0, e: [0.85, 0.12, 0.05] },  // the brow gem (lit from within)
    { a: [0.9, 0.45, 0.06], f: [0.06, 0.06, 0.06], r: 0.05, m: 0, e: [1.0, 0.5, 0.1] },    // the eyeball (iris, pupil: shaded procedurally)
  ];
  const GLOWM = [0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1];   // (materials that feed the emission layer)
  const tone = v => { v = Math.max(0, v); return v * (1 + v / 6) / (1 + v); };
  function env(B, rx, ry, rz, rough) {
    const up = rx * B.UP[0] + ry * B.UP[1] + rz * B.UP[2];
    let e = up >= 0 ? 0.1 + 0.34 * Math.pow(up, 1.3) : 0.03 + 0.05 * (1 + up);
    const hz = (up - 0.1) / (0.035 + rough * 0.3); e += 0.4 * Math.exp(-hz * hz) / (1 + rough * 2);
    const w = 0.05 + rough * 0.32, sb = rx * B.SB[0] + ry * B.SB[1] + rz * B.SB[2]; if (sb > 1 - 3 * w) e += 3.2 * sstep(1 - 2.6 * w, 1 - 0.25 * w, sb) / (1 + rough * 2.5);
    const rr = rx * B.RIM[0] + ry * B.RIM[1] + rz * B.RIM[2]; Q[4] = rr > 0.5 - w ? 1.0 * sstep(0.62 - w * 1.5, 0.97 - w * 0.5, rr) / (1 + rough * 2) : 0;
    return e;
  }
  /* the shade of one point; E (if given) receives the emission alone for the glow layer */
  function shade(B, mat, x, y, z, nx, ny, nz, lap, ao, shd, o, E) {
    const M = MATS[mat]; let rough = M.r, ar = M.a[0], ag = M.a[1], ab = M.a[2], fr = M.f[0], fg = M.f[1], fb = M.f[2], cav = 0, wear = 0, er = 0, eg = 0, eb = 0;
    if (M.e) { er = M.e[0]; eg = M.e[1]; eb = M.e[2]; }
    if (mat === M_SCALE) {   // small overlapping scales: rows of half-discs, each domed, its rim dark, its tip catching light
      const S0 = 0.045, an = Math.abs(nz) > 0.6, u = (an ? x : x + z * 0.3) / S0, v = (an ? y : (Math.abs(ny) > Math.abs(nx) ? z : y) + x * 0.1) / S0, row = Math.floor(v), uu = u + (row & 1) * 0.5, col = Math.round(uu), du = uu - col, dv = v - row;
      const d = hyp(du, dv * 1.1); if (d > 0.5) cav += 0.75; else { const k = 0.85; nx += du * k * (an ? 1 : 0.5); ny += (an ? dv : 0) * k; nz += (an ? 0 : dv * k); if (dv > 0.3) { ar *= 1.25; ag *= 1.1; } }
      const wn = vnoise(x * 9 + 2, y * 9 + z * 5); ar *= 0.8 + 0.45 * wn; ag *= 0.7 + 0.6 * wn; rough *= 0.8 + 0.4 * wn;
    }
    if (mat === M_ARMOR || mat === M_STEEL || mat === M_HORN || mat === M_TALON) { const HJ = CUR_PART === 'head' || CUR_PART === 'jaw';
      const q = 12, dk = 0.08; nx += (vnoise(y * q, z * q) - 0.5) * dk; ny += (vnoise(z * q + 3, x * q) - 0.5) * dk; nz += (vnoise(x * q, y * q + 7) - 0.5) * dk;
      const wn = vnoise(x * 7 + y * 3, z * 7 - y * 5); rough = Math.min(0.7, rough * (0.7 + 0.7 * wn));
      // scratches and heat damage: bright streaks; darker scorched blotches
      const sc = Math.abs(fm(x * 15 + y * 9 + z * 5 + vnoise(x * 4, z * 4) * 2.5, 1) - 0.5); if (sc < 0.016 && hsh(Math.floor(x * 15 + y * 9 + z * 5), Math.floor(z * 6)) > 0.6) { wear += 0.6; rough *= 0.5; }
      if (mat === M_ARMOR) { const pl = HJ ? 0 : Math.abs(fm((x + y * 0.3) / 0.11, 1) - 0.5); if (pl > 0.44) { cav += (pl - 0.44) * 9; } else if (pl > 0.36) { wear += 0.35; }   // (fine plate lines: a dark seam, a worn bevel beside it)
        if (wn < 0.3) { const v = (0.3 - wn) * 3; fr *= 1 - 0.4 * v; fg *= 1 - 0.3 * v; rough = lerp(rough, 0.6, v); } }
    }
    if (mat === M_ARMOR || mat === M_GOLD) {   // hammered: small soft dents all over the metal
      const q = 38, dk = mat === M_GOLD ? 0.16 : 0.12; nx += (vnoise(y * q + 5, z * q) - 0.5) * dk; ny += (vnoise(z * q, x * q + 9) - 0.5) * dk; nz += (vnoise(x * q + 3, y * q) - 0.5) * dk;
      if (mat === M_GOLD) { const wn = vnoise(x * 9 + 4, y * 9 - z * 6); fr *= 0.8 + 0.3 * wn; fg *= 0.78 + 0.3 * wn; if (wn < 0.25) cav += (0.25 - wn) * 1.6; } }
    if (mat === M_GEM) { const fa = Math.abs(nx) + Math.abs(ny) * 0.8; er *= 0.55 + 0.9 * fa * fa; eg *= 0.5 + 0.9 * fa; }
    if (mat === M_IRIS) {   // the eyeball: a slit pupil in a radial gold iris, a dark limbal ring, dark red beyond; glossy
      const qx = x - EYE[0], qy = Math.abs(y) - EYE[1], qz = z - EYE[2], ql = hyp3(qx, qy, qz) || 1, gx = qx / ql, gy = qy / ql, gz = qz / ql, ct = gx * EYEG[0] + gy * EYEG[1] + gz * EYEG[2];
      const U = EYEU, s2 = gx * U[0] + gy * U[1] + gz * U[2], e1x = EYEG[1] * U[2] - EYEG[2] * U[1], e1y = EYEG[2] * U[0] - EYEG[0] * U[2], e1z = EYEG[0] * U[1] - EYEG[1] * U[0], s1 = gx * e1x + gy * e1y + gz * e1z;
      const ang = Math.atan2(s2, s1), rad = Math.sqrt(Math.max(0, 1 - ct * ct)), streak = 0.65 + 0.35 * Math.abs(Math.sin(ang * 9 + vnoise(ang * 4 + 3, rad * 8) * 3));
      if (ct > 0.42) { const pw = 0.055 + 0.03 * (1 - Math.abs(s2) / 0.9); if (Math.abs(s1) < pw && ct > 0.5) { ar = 0.02; ag = 0.01; ab = 0.01; er = 0.05; eg = 0.01; eb = 0; }
        else { const k2 = streak * (0.7 + 0.5 * rad); ar *= k2; ag *= k2 * (0.8 + 0.4 * rad); er *= k2 * 1.2; eg *= k2 * (0.7 + 0.6 * rad); if (ct < 0.55) { const v = (0.55 - ct) / 0.13; ar *= 1 - 0.6 * v; ag *= 1 - 0.7 * v; er *= 1 - 0.7 * v; eg *= 1 - 0.8 * v; } } }
      else { ar = 0.25; ag = 0.03; ab = 0.02; er = 0.25; eg = 0.04; eb = 0.0; } }
    if (mat === M_BELLY) { const g2 = vnoise(x * 14, y * 14 + z * 8); ar *= 0.8 + 0.3 * g2; ag *= 0.75 + 0.4 * g2; er *= 0.7 + 0.6 * g2; eg *= 0.7 + 0.6 * g2; }
    { const l = hyp3(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; }
    const edge = cl((lap - 8) / 26), crease = cl((-lap - 6) / 22); wear += edge * (mat === M_ARMOR ? 1 : 0.5);
    const grime = Math.min(0.85, crease * 0.55 + (1 - ao) * 0.35 + cav * 0.5);
    if (wear > 0 && (mat === M_ARMOR || mat === M_STEEL || mat === M_HORN || mat === M_GOLD)) { const v = Math.min(1, wear); fr = lerp(fr, 0.75, v * 0.55); fg = lerp(fg, 0.7, v * 0.55); fb = lerp(fb, 0.68, v * 0.55); rough *= 1 - v * 0.4; }
    const L = B.L, V = B.V, ndl = nx * L[0] + ny * L[1] + nz * L[2], ndv = Math.max(0.001, nx * V[0] + ny * V[1] + nz * V[2]);
    const wrapD = mat === M_SCALE || mat === M_BELLY ? Math.max(0, (ndl + 0.25) / 1.25) : Math.max(0, ndl), dif = wrapD * shd;
    const up = nx * B.UP[0] + ny * B.UP[1] + nz * B.UP[2], hm = 0.5 + 0.5 * up, amr = lerp(GNDC[0], SKYC[0], hm) * ao, amg = lerp(GNDC[1], SKYC[1], hm) * ao, amb = lerp(GNDC[2], SKYC[2], hm) * ao;
    const rx = 2 * ndv * nx - V[0], ry = 2 * ndv * ny - V[1], rz = 2 * ndv * nz - V[2], ev = env(B, rx, ry, rz, rough), ec = Q[4];
    const fk = Math.pow(1 - ndv, 5) * (1 - rough * 0.7), Fr = fr + (1 - fr) * fk, Fg = fg + (1 - fg) * fk, Fb = fb + (1 - fb) * fk;
    const Hh = B.Hh, nh = Math.max(0, nx * Hh[0] + ny * Hh[1] + nz * Hh[2]), pw = 2 / (rough * rough + 0.004), spec = Math.pow(nh, pw) * (pw + 2) / 8 * Math.max(0, ndl) * shd * 0.9;
    const aoS = Math.min(1, ao * (0.6 + 0.4 * shd) + 0.1) * (1 - cav * 0.6);
    const rimT = Math.pow(1 - ndv, 2.6) * Math.max(0, nx * B.RIM[0] + ny * B.RIM[1] + nz * B.RIM[2] + 0.35) * ao;
    let r, g, b;
    if (M.m) { r = ar * (dif * KEYC[0] * 0.7 + amr * 0.5) + Fr * (ev * aoS + spec * KEYC[0]) + ec * RIMC[0] * Fr * aoS * 0.6; g = ag * (dif * KEYC[1] * 0.7 + amg * 0.5) + Fg * (ev * aoS + spec * KEYC[1]) + ec * RIMC[1] * Fg * aoS * 0.6; b = ab * (dif * KEYC[2] * 0.7 + amb * 0.5) + Fb * (ev * aoS + spec * KEYC[2]) + ec * RIMC[2] * Fb * aoS * 0.6; }
    else { const sk = mat === M_SCALE ? 1.6 : mat === M_IRIS || mat === M_GEM ? 6 : 3; r = ar * (dif * KEYC[0] + amr) + Fr * (ev * aoS * 0.6 + spec * KEYC[0] * sk) + ec * RIMC[0] * 0.15; g = ag * (dif * KEYC[1] + amg) + Fg * (ev * aoS * 0.6 + spec * KEYC[1] * sk) + ec * RIMC[1] * 0.15; b = ab * (dif * KEYC[2] + amb) + Fb * (ev * aoS * 0.6 + spec * KEYC[2] * sk) + ec * RIMC[2] * 0.15;
      if (mat === M_SCALE) { const sss = Math.pow(1 - ndv, 2) * 0.25; r += sss * 0.9 * ao; g += sss * 0.08 * ao; b += sss * 0.06 * ao; } }
    r += rimT * RIMC[0] * 0.5; g += rimT * RIMC[1] * 0.5; b += rimT * RIMC[2] * 0.5;
    if (mat === M_EYE) { const k = Math.pow(ndv, 2); er *= 0.8 + 0.6 * k; eg *= 0.6 + 0.8 * k; eb *= 0.5 + k; }
    const gk = (1 - grime) * 1.05;
    o[0] = tone(r * gk + er * 0.55); o[1] = tone(g * gk + eg * 0.55); o[2] = tone(b * gk + eb * 0.55);
    if (E) { const ek = GLOWM[mat] ? 1 : 0; E[0] = tone(er * 1.6 * ek); E[1] = tone(eg * 1.6 * ek); E[2] = tone(eb * 1.6 * ek); }
  }

  /* ================= the bake ================= */
  const NB = 16;
  const BK = { k: 0, spr: {}, glow: {}, lo: {}, seg: {}, tube: {}, gen: null, genKey: '', queue: [], ms: 0, maxMs: 0, n: 0, st: '', bytes: 0, spikes: [] };
  for (const p of PART_ORDER) { BK.spr[p] = new Array(NB).fill(null); BK.glow[p] = new Array(NB).fill(null); BK.lo[p] = new Array(NB).fill(null); }
  const groundA = a => Math.atan2(Math.sin(a), GY * Math.cos(a));
  const bucketOf = ag => ((Math.round(ag / TAU * NB) % NB) + NB) % NB;
  function frameOf(b) {
    const ag = b / NB * TAU, ca = Math.cos(ag), sa = Math.sin(ag), toL = v => [v[0] * ca + v[1] * sa, -v[0] * sa + v[1] * ca, v[2]];
    const L = toL(LW), V = toL([0, VY, VZ]), h = nrm([L[0] + V[0], L[1] + V[1], L[2] + V[2]]);
    return { ag, ca, sa, L, V, SB: toL(SBW), RIM: toL(RIMW), UP: [0, 0, 1], Hh: h, D: [VY * sa, VY * ca, VZ] };
  }
  const SEGF = (() => { const V = [0, 0, 1], L = nrm([-0.3, 0.72, 0.62]); return { L, V, SB: nrm([-0.2, 0.55, 0.8]), RIM: nrm([0.5, 0.5, -0.7]), UP: nrm([0, 0.72, 0.69]), Hh: nrm([L[0], L[1], L[2] + 1]), D: [0, 0, 1], seg: true }; })();
  const GA = { hit: 0, t: 0, x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 0, mat: 0, ao: 0, sh: 0, lap: 0 }, NG = 12, AOS = [0.025, 0.06, 0.13, 0.25], AOW = [1, 0.7, 0.45, 0.3];
  function trace(B, f, cx0, cy0, cz0, R, u, v, G) {
    G.hit = 0; let ox, oy, oz; const D = B.D;
    if (B.seg) { ox = u; oy = -v; oz = 0; } else { const gx = u, gy = v / GY; ox = gx * B.ca + gy * B.sa; oy = -gx * B.sa + gy * B.ca; oz = 0; }
    const cx = cx0 - ox, cy = cy0 - oy, cz = cz0 - oz, tc = cx * D[0] + cy * D[1] + cz * D[2], d2 = cx * cx + cy * cy + cz * cz - tc * tc;
    if (d2 > R * R) return;
    const hw = Math.sqrt(R * R - d2); let t = tc + hw, hit = false, n = 0;
    while (t > tc - hw && n++ < 110) { f(ox + D[0] * t, oy + D[1] * t, oz + D[2] * t); const d = Q[0]; if (d < 0.0015) { hit = true; break; } t -= Math.max(d * 0.85, 0.002); }
    if (!hit) return;
    const x = ox + D[0] * t, y = oy + D[1] * t, z = oz + D[2] * t, e = 0.006;
    f(x, y, z); const f0 = Q[0], mat = SM; f(x + e, y, z); const fxp = Q[0]; f(x - e, y, z); const fxm = Q[0]; f(x, y + e, z); const fyp = Q[0]; f(x, y - e, z); const fym = Q[0]; f(x, y, z + e); const fzp = Q[0]; f(x, y, z - e); const fzm = Q[0];
    let nx = fxp - fxm, ny = fyp - fym, nz = fzp - fzm; const nl = hyp3(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const lap = (fxp + fxm + fyp + fym + fzp + fzm - 6 * f0) / (e * e) * 0.5;
    let ao = 1; for (let i = 0; i < 4; i++) { const s2 = AOS[i]; f(x + nx * s2, y + ny * s2, z + nz * s2); ao -= AOW[i] * Math.max(0, s2 - Q[0]) / s2 * 0.42; } ao = cl(ao);
    let sh = 1; const L = B.L; if (L[0] * nx + L[1] * ny + L[2] * nz > -0.1) { let tt = 0.02; for (let i = 0; i < 16 && tt < R * 1.6; i++) { f(x + nx * 0.005 + L[0] * tt, y + ny * 0.005 + L[1] * tt, z + nz * 0.005 + L[2] * tt); const h = Q[0]; if (h < 0.0012) { sh = 0; break; } sh = Math.min(sh, 7 * h / tt); tt += Math.max(0.014, h * 0.9); } sh = cl(sh); sh = sh * sh * (3 - 2 * sh); } else sh = 0;
    G.hit = 1; G.t = t; G.x = x; G.y = y; G.z = z; G.nx = nx; G.ny = ny; G.nz = nz; G.mat = mat; G.ao = ao; G.sh = sh; G.lap = lap;
  }
  let IMG = null, IMG2 = null; const SCR = {};
  function scratch(k, n, T) { const b = SCR[k]; if (b && b.length >= n) return b; return (SCR[k] = new T(Math.ceil(n * 1.25))); }
  const OUT = [0, 0, 0], EOUT = [0, 0, 0];
  /* bake one picture (and its emission layer when glow): a geometry pass on every other pixel, full-resolution shading
     from it (traced afresh where the samples disagree), silhouette and seams supersampled, a soft dark outline */
  function* bakeImg(B, f, c, R, k, glow, box, store) {
    const W = box.W, Hh = box.H, ox = box.ox, oy = box.oy, CW = (W >> 1) + 2, CH = (Hh >> 1) + 2; yield; const Gd = scratch('g', CW * CH * NG, Float32Array); let tY = nowMs();
    const put = (q, G) => { if (!G.hit) { Gd[q] = -1; return; } Gd[q] = G.mat; Gd[q + 1] = G.t; Gd[q + 2] = G.x; Gd[q + 3] = G.y; Gd[q + 4] = G.z; Gd[q + 5] = G.nx; Gd[q + 6] = G.ny; Gd[q + 7] = G.nz; Gd[q + 8] = G.ao; Gd[q + 9] = G.sh; Gd[q + 10] = G.lap; };
    BK.st = 'geo';
    for (let j = 0; j < CH; j++) { const v = (j * 2 + 0.5 - oy) / k; for (let i = 0; i < CW; i++) { trace(B, f, c[0], c[1], c[2], R, (i * 2 + 0.5 - ox) / k, v, GA); put((j * CW + i) * NG, GA); if (nowMs() - tY > 1.0) { yield; tY = nowMs(); } } }
    BK.st = 'shade'; yield; tY = nowMs();
    const NP = W * Hh, A = scratch('a', NP * 4, Float32Array).fill(0, 0, NP * 4), EA = glow ? scratch('e', NP * 3, Float32Array).fill(0, 0, NP * 3) : null, ID = scratch('i', NP, Int8Array).fill(-1, 0, NP), o = OUT, E = glow ? EOUT : null, w4 = [0, 0, 0, 0], ix = [0, 0, 0, 0];
    const putE = q => { if (EA) { EA[q * 3] = E[0]; EA[q * 3 + 1] = E[1]; EA[q * 3 + 2] = E[2]; } };
    for (let py = 0; py < Hh; py++) for (let px = 0; px < W; px++) {
      const i0 = px >> 1, j0 = py >> 1, fx = (px & 1) * 0.5, fy = (py & 1) * 0.5, q = py * W + px;
      ix[0] = (j0 * CW + i0) * NG; ix[1] = ix[0] + NG; ix[2] = ix[0] + CW * NG; ix[3] = ix[2] + NG; w4[0] = (1 - fx) * (1 - fy); w4[1] = fx * (1 - fy); w4[2] = (1 - fx) * fy; w4[3] = fx * fy;
      let ok = true, any = false; const m0 = Gd[ix[0]];
      for (let s = 0; s < 4; s++) { if (w4[s] === 0) continue; const qq = ix[s], m = Gd[qq]; if (m >= 0) any = true; if (m !== m0 || m < 0) { ok = false; continue; } if (Math.abs(Gd[qq + 1] - Gd[ix[0] + 1]) > 0.025 || Gd[qq + 5] * Gd[ix[0] + 5] + Gd[qq + 6] * Gd[ix[0] + 6] + Gd[qq + 7] * Gd[ix[0] + 7] < 0.88) ok = false; }
      if (ok && m0 >= 0) { let x = 0, y = 0, z = 0, nx = 0, ny = 0, nz = 0, ao = 0, sh = 0, lap = 0; for (let s = 0; s < 4; s++) { const w = w4[s]; if (w === 0) continue; const qq = ix[s]; x += Gd[qq + 2] * w; y += Gd[qq + 3] * w; z += Gd[qq + 4] * w; nx += Gd[qq + 5] * w; ny += Gd[qq + 6] * w; nz += Gd[qq + 7] * w; ao += Gd[qq + 8] * w; sh += Gd[qq + 9] * w; lap += Gd[qq + 10] * w; }
        const nl = hyp3(nx, ny, nz) || 1; shade(B, m0, x, y, z, nx / nl, ny / nl, nz / nl, lap, ao, sh, o, E); A[q * 4] = o[0]; A[q * 4 + 1] = o[1]; A[q * 4 + 2] = o[2]; A[q * 4 + 3] = 1; ID[q] = m0; putE(q); }
      else if (any) { trace(B, f, c[0], c[1], c[2], R, (px + 0.5 - ox) / k, (py + 0.5 - oy) / k, GA); if (GA.hit) { shade(B, GA.mat, GA.x, GA.y, GA.z, GA.nx, GA.ny, GA.nz, GA.lap, GA.ao, GA.sh, o, E); A[q * 4] = o[0]; A[q * 4 + 1] = o[1]; A[q * 4 + 2] = o[2]; A[q * 4 + 3] = 1; ID[q] = GA.mat; putE(q); } }
      if ((px & 3) === 3 && nowMs() - tY > 1.0) { yield; tY = nowMs(); } }
    BK.st = 'aa';
    for (let py = 0; py < Hh; py++) { for (let px = 0; px < W; px++) { const pi = py * W + px, id = ID[pi];
      if (!((px + 1 < W && ID[pi + 1] !== id) || (px > 0 && ID[pi - 1] !== id) || (py + 1 < Hh && ID[pi + W] !== id) || (py > 0 && ID[pi - W] !== id))) continue;
      let r = 0, g = 0, bb = 0, a = 0, e0 = 0, e1 = 0, e2 = 0; for (let si = 0; si < 4; si++) { trace(B, f, c[0], c[1], c[2], R, (px + 0.5 + (si & 1 ? 0.25 : -0.25) - ox) / k, (py + 0.5 + (si & 2 ? 0.25 : -0.25) - oy) / k, GA); if (!GA.hit) continue; shade(B, GA.mat, GA.x, GA.y, GA.z, GA.nx, GA.ny, GA.nz, GA.lap, GA.ao, GA.sh, o, E); r += o[0]; g += o[1]; bb += o[2]; a += 1; if (E) { e0 += E[0]; e1 += E[1]; e2 += E[2]; } }
      const q = pi * 4, a0 = A[q + 3], na = (a0 + a) / 5; if (na > 0) { A[q] = (A[q] * a0 + r) / 5 / na; A[q + 1] = (A[q + 1] * a0 + g) / 5 / na; A[q + 2] = (A[q + 2] * a0 + bb) / 5 / na; } A[q + 3] = na;
      if (EA) { const q3 = pi * 3; EA[q3] = (EA[q3] * a0 + e0) / 5; EA[q3 + 1] = (EA[q3 + 1] * a0 + e1) / 5; EA[q3 + 2] = (EA[q3 + 2] * a0 + e2) / 5; }
      if (nowMs() - tY > 1.0) { yield; tY = nowMs(); } } }
    BK.st = 'rim'; const rim = scratch('r', NP, Float32Array).fill(0, 0, NP);
    for (let py = 1; py < Hh - 1; py++) { if (nowMs() - tY > 1.0) { yield; tY = nowMs(); } for (let px = 1; px < W - 1; px++) { const pi = py * W + px; if (A[pi * 4 + 3] < 0.35) continue; const mn = Math.min(A[(pi - 1) * 4 + 3], A[(pi + 1) * 4 + 3], A[(pi - W) * 4 + 3], A[(pi + W) * 4 + 3]); if (mn < 0.3) rim[pi] = 1 - mn / 0.3; } }
    for (let i = 0; i < NP; i++) { if (!rim[i]) continue; const q = i * 4, k2 = rim[i] * 0.55; A[q] = lerp(A[q], 0.06, k2); A[q + 1] = lerp(A[q + 1], 0.02, k2); A[q + 2] = lerp(A[q + 2], 0.03, k2); }
    yield; tY = nowMs();
    BK.st = 'put'; let x0 = W, y0 = Hh, x1 = -1, y1 = -1; for (let py = 0; py < Hh; py++) { if (nowMs() - tY > 1.0) { yield; tY = nowMs(); } for (let px = 0; px < W; px++) if (A[(py * W + px) * 4 + 3] > 0.004) { if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; } }
    if (x1 < 0) { store({ cv: null, k }, null); return; }
    const w2 = x1 - x0 + 1, h2 = y1 - y0 + 1;
    const mk = (src) => { const cv = document.createElement('canvas'); cv.width = w2; cv.height = h2; const cx = cv.getContext('2d'); if (!IMG || IMG.width < w2 || IMG.height < h2) IMG = cx.createImageData(Math.max(w2, IMG ? IMG.width : 0) + 16, Math.max(h2, IMG ? IMG.height : 0) + 16); const Dd = IMG.data, IW = IMG.width;
      for (let py = 0; py < h2; py++) for (let px = 0; px < w2; px++) { const s = (py + y0) * W + px + x0, d = (py * IW + px) * 4; if (src === A) { Dd[d] = A[s * 4] * 255; Dd[d + 1] = A[s * 4 + 1] * 255; Dd[d + 2] = A[s * 4 + 2] * 255; Dd[d + 3] = A[s * 4 + 3] * 255; } else { const r = EA[s * 3], g = EA[s * 3 + 1], b = EA[s * 3 + 2], m = Math.max(r, g, b); Dd[d] = m > 0 ? r / m * 255 : 0; Dd[d + 1] = m > 0 ? g / m * 255 : 0; Dd[d + 2] = m > 0 ? b / m * 255 : 0; Dd[d + 3] = Math.min(1, m) * 255; } }
      cx.putImageData(IMG, 0, 0, 0, 0, w2, h2); BK.bytes += w2 * h2 * 4; return cv; };
    const cv = mk(A); yield; let ecv = EA ? mk(EA) : null;
    if (ecv) { const hc = document.createElement('canvas'); hc.width = Math.max(1, w2 >> 1); hc.height = Math.max(1, h2 >> 1); hc.getContext('2d').drawImage(ecv, 0, 0, hc.width, hc.height); BK.bytes -= w2 * h2 * 3; ecv = hc; }   // (the glow is soft: half resolution)
    store({ cv, x: x0 - ox, y: y0 - oy, k }, ecv ? { cv: ecv, x: (x0 - ox) / 2, y: (y0 - oy) / 2, k: k / 2, half: true, w2, h2 } : null);
  }
  const PSC = { torso: TK, head: HEADK, jaw: HEADK, tip: 2.0, foot: LK }, KCAP = 150, PCAP = { head: 270, jaw: 230 };   // (the head and jaw are drawn big and close: baked near their drawn scale)
  let CUR_PART = '';   // (the part being baked: one at a time; the head and jaw skip the generic plate lines)
  function bakePart(name, b, k0, lo) {
    CUR_PART = name;
    const P = PARTS[name], B = frameOf(b), c = P.c, R = P.R, k = Math.min((PCAP[name] || KCAP) * (lo ? 0.5 : 1), k0 * (PSC[name] || 1));
    const gx = c[0] * B.ca - c[1] * B.sa, gy = c[0] * B.sa + c[1] * B.ca, cu = gx, cvv = gy * GY - c[2] * ZK;
    const W = Math.ceil(2 * R * k) + 4, box = { W, H: W, ox: -(cu - R) * k + 2, oy: -(cvv - R) * k + 2 };
    return bakeImg(B, P.f, c, R, k, !lo && P.glow, box, (s, e) => { if (lo) BK.lo[name][b] = s; else { BK.spr[name][b] = s; BK.glow[name][b] = e; } });
  }
  const TUBEF = (() => { const V = [0, 0, 1], L = nrm([0.25, 0, 1]); return { L, V, SB: nrm([0.15, 0, 1]), RIM: [0, 0, -1], UP: [0, 0, 1], Hh: nrm([L[0], L[1], L[2] + 1]), D: [0, 0, 1], seg: true }; })();
  function bakeSeg(name, k0) {
    CUR_PART = name;
    const P = SEGS[name], R = P.R, L = P.L, c = [L / 2, 0, 0], RR = L / 2 + R + 0.02, k = P.tube ? Math.min(KCAP, Math.round(k0 * 2.4 / 8) * 8) : k0;
    const W = Math.ceil((L + 2 * R) * k) + 6, H = Math.ceil(2 * R * k) + 6, box = { W, H, ox: R * k + 3, oy: R * k + 3 };
    return bakeImg(P.tube ? TUBEF : SEGF, P.f, c, RR, k, !!P.tube, box, (s, e) => { s.L = L; s.R = R; BK.seg[name] = s;
      if (P.tube && s.cv) { const cut = (src, kk, half) => { const tw = Math.round(PD * kk), x0 = Math.round(-src.x + PD * kk), cy = -src.y, hh = Math.round(Math.min(cy, src.cv.height - cy)), cv = document.createElement('canvas'); cv.width = tw; cv.height = hh * 2; cv.getContext('2d').drawImage(src.cv, x0, Math.round(cy - hh), tw, hh * 2, 0, 0, tw, hh * 2); return { cv, w: tw, h: hh * 2, k: kk }; };
        const t = cut(s, k); t.g = e ? cut(e, k / 2) : null; BK.tube[name] = t; } });
  }

  /* ================= the painted pictures: the membrane (colour, veins, wrinkles; its transmitted light), runes ================= */
  let TX = null;
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h || w; return [cv, cv.getContext('2d')]; };
  function buildTex() {
    const S = {}, N = 256, R0 = (() => { let a = 1234567; return () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff; }; })();
    // veins: from the wrist corner (0, 0) out across the panel, wandering and forking; the membrane between them translucent
    const veins = [];
    const grow = (x, y, a, w, n, depth) => { const pts = [[x, y]]; for (let j = 0; j < n; j++) { a += (R0() - 0.5) * 0.55; const l = 9 + R0() * 7; x += Math.cos(a) * l; y += Math.sin(a) * l; pts.push([x, y]); if (depth > 0 && j > 1 && R0() < 0.22) grow(x, y, a + (R0() < 0.5 ? -1 : 1) * (0.5 + R0() * 0.5), w * 0.6, Math.floor(n * 0.6), depth - 1); } veins.push({ pts, w }); };
    for (let i = 0; i < 6; i++) grow(0, 0, 0.12 + i / 5 * 1.33 + (R0() - 0.5) * 0.15, 3.4, 30, 3);
    const path = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
    { const [cv, g] = mkc(N); const gr = g.createRadialGradient(0, 0, 10, 0, 0, N * 1.3); gr.addColorStop(0, '#3A050C'); gr.addColorStop(0.45, '#6A0C16'); gr.addColorStop(1, '#4A0810'); g.fillStyle = gr; g.fillRect(0, 0, N, N);
      for (let i = 0; i < 32; i++) { const x = R0() * N, y = R0() * N, r = 14 + R0() * 34, g2 = g.createRadialGradient(x, y, 0, x, y, r); g2.addColorStop(0, R0() < 0.5 ? 'rgba(150,30,30,.25)' : 'rgba(20,0,4,.25)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = g2; g.fillRect(x - r, y - r, r * 2, r * 2); }
      for (let i = 0; i < 320; i++) { const x = R0() * N, y = R0() * N, l = 5 + R0() * 14, a = Math.atan2(y, x) + Math.PI / 2 + (R0() - 0.5) * 0.5; g.strokeStyle = R0() < 0.6 ? 'rgba(0,0,0,.2)' : 'rgba(255,120,100,.07)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 2, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }   // (wrinkles across the veins)
      for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + R0() * 0.1})`; g.fillRect(R0() * N, R0() * N, 1.1, 1.1); }   // (pores)
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (const v of veins) { path(g, v.pts); g.strokeStyle = 'rgba(24,0,4,.75)'; g.lineWidth = v.w + 1.4; g.stroke(); path(g, v.pts); g.strokeStyle = 'rgba(150,34,30,.7)'; g.lineWidth = v.w * 0.45; g.stroke(); }
      S.mem = cv; }
    // the light coming through: warm between the veins, brightest away from the bones, the veins dark across it
    { const [cv, g] = mkc(N); g.fillStyle = '#000'; g.fillRect(0, 0, N, N); const gr = g.createRadialGradient(0, 0, 30, 0, 0, N * 1.25); gr.addColorStop(0, 'rgba(255,40,20,.08)'); gr.addColorStop(0.55, 'rgba(255,60,30,.5)'); gr.addColorStop(1, 'rgba(255,80,40,.3)'); g.fillStyle = gr; g.fillRect(0, 0, N, N);
      for (let i = 0; i < 46; i++) { const x = R0() * N, y = R0() * N, r = 12 + R0() * 30, g2 = g.createRadialGradient(x, y, 0, x, y, r); g2.addColorStop(0, 'rgba(255,90,40,.4)'); g2.addColorStop(1, 'rgba(255,40,20,0)'); g.fillStyle = g2; g.fillRect(x - r, y - r, r * 2, r * 2); }
      g.lineCap = 'round'; g.lineJoin = 'round'; for (const v of veins) { path(g, v.pts); g.strokeStyle = 'rgba(0,0,0,.9)'; g.lineWidth = v.w + 2.4; g.stroke(); }
      S.memGlow = cv; }
    // runes for the ring: a strip of angular glyphs
    { const [cv, g] = mkc(512, 32); g.strokeStyle = '#FFF'; g.lineWidth = 2.2; g.lineCap = 'round'; for (let i = 0; i < 16; i++) { const x0 = i * 32 + 6; g.beginPath(); const n = 3 + Math.floor(R0() * 3); let x = x0 + R0() * 18, y = 6 + R0() * 20; g.moveTo(x, y); for (let k = 0; k < n; k++) { x = x0 + R0() * 20; y = 5 + R0() * 22; g.lineTo(x, y); } g.stroke(); if (R0() < 0.5) { g.beginPath(); g.arc(x0 + 10, 16, 4, 0, TAU); g.stroke(); } } S.runes = cv; }
    // a soft dragon-shaped shadow piece; an ember
    { const [cv, g] = mkc(128, 64); const gr = g.createRadialGradient(64, 32, 4, 64, 32, 62); gr.addColorStop(0, 'rgba(10,4,4,.6)'); gr.addColorStop(0.6, 'rgba(10,4,4,.35)'); gr.addColorStop(1, 'rgba(10,4,4,0)'); g.save(); g.scale(1, 0.5); g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 64, 0, TAU); g.fill(); g.restore(); S.shadow = cv; }
    TX = S;
  }

  /* ================= the background baker ================= */
  function setScale(k) { k = Math.max(40, Math.min(120, Math.round(k * VIS / 8) * 8)); if (BK.k && k <= BK.k) return; BK.k = k; for (const p of PART_ORDER) { BK.spr[p].fill(null); BK.glow[p].fill(null); BK.lo[p].fill(null); } BK.seg = {}; BK.tube = {}; BK.bytes = 0; BK.gen = null; BK.genKey = ''; BK.queue = []; for (const s of SEG_ORDER) BK.queue.push('seg:' + s); for (let b = 0; b < NB; b++) for (const p of PART_ORDER) BK.queue.push(p + ':' + b); }
  function want(b, quick) { for (let i = PART_ORDER.length - 1; i >= 0; i--) { const p = PART_ORDER[i], key = p + ':' + b; if (BK.spr[p][b] || BK.genKey === key) continue; const j = BK.queue.indexOf(key); if (j >= 0) BK.queue.splice(j, 1); BK.queue.unshift(key); }
    if (quick) for (let i = PART_ORDER.length - 1; i >= 0; i--) { const p = PART_ORDER[i], key = 'lo:' + p + ':' + b; if (BK.spr[p][b] || BK.lo[p][b] || BK.genKey === key || BK.queue.indexOf(key) >= 0) continue; BK.queue.unshift(key); }
    for (let i = SEG_ORDER.length - 1; i >= 0; i--) { const key = 'seg:' + SEG_ORDER[i]; if (BK.seg[SEG_ORDER[i]] || BK.genKey === key) continue; const j = BK.queue.indexOf(key); if (j >= 0) BK.queue.splice(j, 1); BK.queue.unshift(key); } }
  const doneKey = key => { const a = key.split(':'); if (a[0] === 'seg') return !!BK.seg[a[1]]; if (a[0] === 'lo') return !!(BK.lo[a[1]][+a[2]] || BK.spr[a[1]][+a[2]]); return !!BK.spr[a[0]][+a[1]]; };
  /* bake for at most `ms` (slices of about 1 ms; none starts that would overrun); returns true when everything is baked */
  function bakeStep(ms) {
    const t0 = nowMs();
    if (!TX) { buildTex(); return false; }
    while (nowMs() - t0 < ms - 1.1) {
      if (!BK.gen) { while (BK.queue.length && doneKey(BK.queue[0])) BK.queue.shift(); if (!BK.queue.length || !BK.k) break; const key = BK.queue.shift(), a = key.split(':');
        BK.gen = a[0] === 'seg' ? bakeSeg(a[1], BK.k) : a[0] === 'lo' ? bakePart(a[1], +a[2], BK.k * 0.5, true) : bakePart(a[0], +a[1], BK.k); BK.genKey = key; }
      const st0 = BK.st, s0 = nowMs(), r = BK.gen.next(), d = nowMs() - s0; BK.ms += d; if (d > BK.maxMs) { BK.maxMs = d; BK.maxAt = BK.genKey + '/' + st0 + '>' + BK.st; } if (d > 6 && BK.spikes.length < 40) BK.spikes.push(BK.genKey + '/' + st0 + ' ' + d.toFixed(1));
      if (r.done) { BK.gen = null; BK.genKey = ''; BK.n++; }
    }
    return !BK.gen && !BK.queue.length && !!BK.k;
  }
  let IDLE = false;
  function idleBake() {
    if (IDLE || !(BK.gen || !TX || BK.queue.length)) return; IDLE = true;
    const go = () => { IDLE = false; idleBake(); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => { bakeStep(dl.didTimeout ? 2 : Math.max(1, Math.min(3, dl.timeRemaining() - 1))); go(); }, { timeout: 150 });
    else setTimeout(() => { bakeStep(2.5); go(); }, 40);
  }
  const segsReady = () => SEG_ORDER.every(s => BK.seg[s]);
  const readyB = b => !!TX && segsReady() && PART_ORDER.every(p => BK.spr[p][b]);
  const usableB = b => !!TX && segsReady() && PART_ORDER.every(p => BK.spr[p][b] || BK.lo[p][b]);

  /* ================= the pose ================= */
  /* the channels (all numbers; see the brief). flap is a phase (cycles), ringSpin an angle; the rest are amounts */
  const CH = ['flap', 'flapAmp', 'downFlex', 'spread', 'fold', 'finger', 'neckCurve', 'headYaw', 'headPitch', 'jaw', 'throat', 'pitch', 'bank', 'tailSwing', 'tailLift', 'legs', 'breath', 'vents', 'glow', 'spikes', 'trace', 'ring', 'ringSpin', 'core', 'alpha', 'heat'];
  const blankPose = () => { const o = {}; for (const k of CH) o[k] = 0; o.flapAmp = 0.8; o.breath = 1; o.alpha = 1; o.legs = 0.3; return o; };
  /* ---- 3D helpers ---- */
  const V3 = (x, y, z) => [x, y, z];
  const rX = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c]; };
  const rY = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c]; };
  const rZ = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]; };
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vlen = a => hyp3(a[0], a[1], a[2]), vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  /* the rig: body-local points (x forward, y right, z up) for this pose and time */
  function rig(P, t) {
    const R = {}, amp = P.flapAmp, ph = P.flap * TAU, br = Math.sin(t * 2.2) * 0.02 * P.breath;
    const bob = -0.07 * amp * Math.sin(ph) + br;
    R.bob = bob; R.torso = V3(0, 0, bob); R.seat = V3(SEAT.x * TK, 0, (SEAT.z + 0.03) * TK + bob); R.breath = br;
    // the neck: a curve from its base up and forward to the head, raised (curve > 0) or stretched (< 0), aimed by headYaw / headPitch
    const c = P.neckCurve, N0 = V3(0.86 * TK, 0, 0.14 * TK + bob), yaw = P.headYaw, hp = P.headPitch;
    const NL = 1.3, P1 = V3(N0[0] + (0.42 - 0.18 * c) * NL, Math.sin(yaw) * 0.3, N0[2] + (0.3 + 0.3 * c) * NL), P2 = V3(N0[0] + (1.0 - 0.32 * c - 0.15 * Math.abs(Math.sin(yaw))) * NL, Math.sin(yaw) * 0.75, N0[2] + (0.12 + 0.36 * c - 0.3 * hp) * NL + br * 2);
    const bez = u => { const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u; return V3(N0[0] * a + P1[0] * b + P2[0] * d, N0[1] * a + P1[1] * b + P2[1] * d, N0[2] * a + P1[2] * b + P2[2] * d); };
    R.neck = []; for (let i = 0; i <= 5; i++) R.neck.push(bez(i / 5));
    R.neckS = []; R.neckR = []; for (let i = 0; i <= 14; i++) { const u = i / 14; R.neckS.push(bez(-0.12 + u * 1.12)); R.neckR.push(NRAD(Math.max(0, u))); }   // (the neck's strip starts inside the chest)
    const hd = vnrm(vsub(P2, R.neck[4])); let hdir = rZ([hd[0], hd[1], 0], yaw * 0.4); const hl = hyp(hdir[0], hdir[1]) || 1; hdir = [hdir[0] / hl, hdir[1] / hl, 0];
    const pitchH = Math.atan2(-hd[2], hyp(hd[0], hd[1])) * 0.5 + hp * 0.9;   // (the head follows the neck's slope a little, and its own pitch)
    R.head = P2; R.headF = vnrm([hdir[0] * Math.cos(pitchH), hdir[1] * Math.cos(pitchH), -Math.sin(pitchH)]); R.headL = vnrm([-hdir[1], hdir[0], 0]);
    const HSc = HEADK; R.HS = HSc; const ja = P.jaw * 0.75; R.jawF = vnrm(vadd(vmul(R.headF, Math.cos(ja)), vmul(vcross(R.headL, R.headF), Math.sin(ja))));   // (opening: turned down about the head's lateral axis; L x F points down)
    R.hinge = vadd(P2, vadd(vmul(R.headF, -0.02 * HSc), V3(0, 0, -0.07 * HSc)));
    R.mouth = vadd(P2, vadd(vmul(R.headF, 0.42 * HSc), vmul(vadd(R.jawF, vmul(R.headF, -1)), 0.2 * HSc)));
    R.eyes = vadd(P2, vadd(vmul(R.headF, 0.2 * HSc), V3(0, 0, 0.05 * HSc)));
    // the tail: eleven links back from the haunches, swinging to counter the turns, a slow idle wave, a droop
    const T0 = V3(-1.02 * TK, 0, 0.0 + bob * 0.6); R.tail = [T0]; let p = T0, dir = V3(-1, 0, 0);
    for (let i = 1; i <= 16; i++) { const u = i / 16, sw = P.tailSwing * 0.32 * u + Math.sin(t * 1.7 - u * 3) * 0.1 * u + Math.sin(ph - u * 2.4) * 0.05 * amp * u, dz = -0.08 - 0.06 * u + P.tailLift * 0.12 + Math.sin(ph - u * 3) * 0.04 * amp;
      dir = vnrm([-1, sw, dz]); const L = (0.235 - 0.06 * u) * 1.3; p = vadd(p, vmul(dir, L)); R.tail.push(p); }
    R.tipDir = dir;
    // the tail's strip: the chain smoothed (Catmull-Rom, two samples a link), starting inside the haunches
    R.tailS = []; R.tailR = []; { const Tn = R.tail, n = Tn.length, at = i => Tn[Math.max(0, Math.min(n - 1, i))]; R.tailS.push(vadd(Tn[0], vmul(vnrm(vsub(Tn[0], Tn[1])), 0.3))); R.tailR.push(TRAD(0));
      for (let i = 0; i < n - 1; i++) for (let k = 0; k < 2; k++) { const t2 = k / 2, p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2), t3 = t2 * t2, t4 = t3 * t2; R.tailS.push([0, 1, 2].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t2 + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t3 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t4))); R.tailR.push(TRAD((i + t2) / (n - 1))); }
      R.tailS.push(Tn[n - 1]); R.tailR.push(TRAD(1)); }
    // the hind legs: hips, knees, ankles; tucked back under the tail (0) or reaching down (1)
    R.leg = []; for (const s of [-1, 1]) { const hip = V3(-0.62 * TK, 0.3 * TK * s, -0.2 * TK + bob), ank = V3(hip[0] + lerp(-0.42, 0.12, P.legs) * LK, (0.34 * TK + 0.06 * P.legs) * s, hip[2] + lerp(-0.1, -0.5, P.legs) * LK), kn = V3(hip[0] + lerp(0.05, 0.22, P.legs) * LK, (0.36 * TK) * s, hip[2] + lerp(-0.08, -0.22, P.legs) * LK); R.leg.push({ s, hip, kn, ank }); }
    // the wings: root, elbow, wrist, four fingers, the hip attachment; flapping, flexing, folding, spreading
    R.wing = [];
    const up = Math.max(0, Math.cos(ph)), phi = amp * 0.72 * Math.sin(ph), phi2 = amp * 0.5 * Math.sin(ph - 0.7), flex = (P.downFlex + amp * 0.45 * Math.max(0, -Math.cos(ph))) * 0.5;
    for (const s of [-1, 1]) {
      const root = V3(0.16 * TK, 0.44 * TK * s, 0.3 * TK + bob), f = P.fold, sp = P.spread;
      let hv = V3(-0.14 - 0.35 * f + 0.12 * sp, 0.72 * (1 - 0.3 * f), 0.14 - 0.12 * f + 0.1 * sp), fv = V3(0.3 - 0.5 * f + 0.12 * sp, 0.82 * (1 - 0.45 * f - 0.18 * up * amp), 0.02);
      hv[1] *= s; fv[1] *= s; hv = vmul(hv, WK); fv = vmul(fv, WK);
      const rot = v => rX(v, -phi * s), rot2 = v => rX(v, -(phi + phi2 * 0.6) * s);
      const elbow = vadd(root, rot(hv)), wrist = vadd(elbow, rot2(fv));
      const fing = [];
      const FA = [[0.42, 0.91, 1.3], [-0.2, 0.98, 1.32], [-0.68, 0.73, 1.2], [-0.97, 0.24, 1.0]];
      for (let i = 0; i < 4; i++) { let [fx, fy, L] = FA[i]; const fan = 1 + 0.25 * sp - 0.55 * f - 0.25 * up * amp; let a = Math.atan2(fx, fy) * fan - 0.4 * f; fx = Math.sin(a); fy = Math.cos(a); L *= 1 - 0.38 * f - 0.15 * up * amp;
        L *= WK; let v = V3(fx * L, fy * L * s, (-0.05 - flex * (0.2 + i * 0.05) + 0.12 * sp - P.finger * 0.18) * WK);
        v = rX(v, -(phi + phi2) * s * 1.0); fing.push(vadd(wrist, v)); }
      const hipA = V3(-0.75 * TK, 0.34 * TK * s, 0.06 * TK + bob);
      R.wing.push({ s, root, elbow, wrist, fing, hipA });
    }
    // the dorsal spikes: on the neck, the back and the tail; base, direction, length (the back's grow with `spikes`)
    R.spk = [];
    for (let i = 1; i < 14; i++) { const a = R.neckS[i], b = R.neckS[i + 1], d = vnrm(vsub(b, a)), u = i / 14, rr = R.neckR[i], sd = vnrm([-d[1], d[0], 0]);
      if (i % 2) R.spk.push({ p: vadd(a, V3(0, 0, rr * 0.85)), d: vnrm(vadd(vmul(d, -0.6), V3(0, 0, 0.8))), t: d, L: 0.28 + 0.18 * u, w: 1.5 + 0.4 * u, neck: true });
      if (u > 0.45 && i % 2 === 0) for (const s2 of [-1, 1]) R.spk.push({ p: vadd(a, vadd(vmul(sd, rr * 0.8 * s2), V3(0, 0, rr * 0.2))), d: vnrm(vadd(vadd(vmul(d, -0.75), vmul(sd, 0.5 * s2)), V3(0, 0, 0.25))), t: d, L: 0.22 + 0.3 * u, w: 1.0 + 0.4 * u, neck: true, frill: true }); }
    for (let i = 0; i < 6; i++) { const x = 0.24 - i * 0.22; R.spk.push({ p: V3(x * TK, 0, (0.4 - 0.035 * i) * TK + bob), d: vnrm(V3(-0.45, 0, 0.9)), t: V3(1, 0, 0), L: (0.42 - 0.02 * i) * (1 + 0.5 * P.spikes), w: 2.3, back: true }); }
    for (let i = 0; i < 15; i++) { const a = R.tail[i], b = R.tail[i + 1], d = vnrm(vsub(b, a)), u = i / 15; R.spk.push({ p: vadd(vmul(vadd(a, b), 0.5), V3(0, 0, TRAD(u + 0.03) * 0.85)), d: vnrm(vadd(vmul(d, 0.55), V3(0, 0, 0.83))), t: vmul(d, -1), L: 0.48 - 0.3 * u, w: 2.3 - 1.2 * u, tail: true }); }
    // anchors (body local)
    R.ring = V3(-0.15 * TK, 0, 0.55 * TK + 0.55 + bob); R.belly = V3(-0.05 * TK, 0, -0.38 * TK + bob); R.chest = V3(0.6 * TK, 0, 0.0 + bob);
    R.vents = [V3(0.12 * TK, -0.48 * TK, 0.02 * TK + bob), V3(0.12 * TK, 0.48 * TK, 0.02 * TK + bob)];
    return R;
  }

  /* ================= drawing ================= */
  /* the world frame of a pose: heading (yaw), pitch (nose down +) and bank (right wing down +); body local -> world offsets */
  function frameW(a, P) { const ca = Math.cos(a), sa = Math.sin(a), cp = Math.cos(P.pitch), sp = Math.sin(P.pitch), cb = Math.cos(P.bank), sb = Math.sin(P.bank);
    return v => { let x = v[0], y = v[1], z = v[2]; let y2 = y * cb + z * sb, z2 = -y * sb + z * cb; y = y2; z = z2;   // bank about x (+: the right wing drops)
      let x2 = x * cp + z * sp; z2 = -x * sp + z * cp; x = x2; z = z2;   // pitch about y (nose down +)
      return [x * ca - y * sa, x * sa + y * ca, z]; }; }
  /* a context for one draw: the world origin, the camera mapping, the tile size */
  function mkView(x, y, z, a, P, o) {
    const T = o.T, sx = o.sx, sy = o.sy, Wf = frameW(a, P), k = VIS * (o.scale || 1);
    const toW = v => { const w = Wf(v); return [x + w[0] * k, y + w[1] * k, z + w[2] * k]; };
    const toS = v => { const w = toW(v); return [sx(w[0]), sy(w[1]) - w[2] * ZK * T]; };
    const dirW = v => Wf(v);
    const depth = v => { const w = Wf(v); return w[1] * VY + w[2] * VZ; };
    return { T, k, toW, toS, dirW, depth, a, P, o };
  }
  /* screen projection of a world direction (per tile): x across, y down */
  const projD = d => [d[0], d[1] * GY - d[2] * ZK];
  /* the 2D map of a shell baked at bucket ab onto the piece's world axes F (forward), L (right) and U = F x L (up): the
     least-squares fit over the three axes, weighted by the piece's extent along each, so pitch and bank keep it in
     place (an exact 2-axis map would let raised parts drift) */
  function lsM(ab, Fw, Lw, w3) {
    const ca = Math.cos(ab), sa = Math.sin(ab), bf = projD([ca, sa, 0]), bl = projD([-sa, ca, 0]), bu = [0, -ZK], Uw = vcross(Fw, Lw), ft = projD(Fw), lt = projD(Lw), ut = projD(Uw);
    let a00 = 0, a01 = 0, a10 = 0, a11 = 0, b00 = 0, b01 = 0, b11 = 0;
    const acc = (t, bb, w) => { a00 += w * t[0] * bb[0]; a01 += w * t[0] * bb[1]; a10 += w * t[1] * bb[0]; a11 += w * t[1] * bb[1]; b00 += w * bb[0] * bb[0]; b01 += w * bb[0] * bb[1]; b11 += w * bb[1] * bb[1]; };
    acc(ft, bf, w3[0] * w3[0]); acc(lt, bl, w3[1] * w3[1]); acc(ut, bu, w3[2] * w3[2]);
    const det = b00 * b11 - b01 * b01 || 1e-9, i00 = b11 / det, i01 = -b01 / det, i11 = b00 / det;
    return [a00 * i00 + a01 * i01, a00 * i01 + a01 * i11, a10 * i00 + a11 * i01, a10 * i01 + a11 * i11];
  }
  function drawSpr(c, spr, M, X, Y, s, T, alpha, op) {
    if (!spr || !spr.cv || alpha <= 0.004) return; const kk = T / spr.k * s;
    c.save(); c.globalAlpha = alpha; if (op) c.globalCompositeOperation = op; c.transform(M[0], M[2], M[1], M[3], X, Y); c.drawImage(spr.cv, spr.x * kk, spr.y * kk, spr.cv.width * kk, spr.cv.height * kk); c.restore();
  }
  const sprOf = (name, b) => BK.spr[name][b] || BK.lo[name][b] || null;
  function nearestB(name, b) { for (let d = 0; d <= NB / 2; d++) for (const bb of [(b + d) % NB, (b - d + NB) % NB]) if (sprOf(name, bb)) return bb; return -1; }
  const LSX = -0.45, LSY = -0.89;
  function drawSegImg(c, spr, ax, ay, bx, by, kk, a) {
    const dx = bx - ax, dy = by - ay, len = hyp(dx, dy); if (len < 0.5 || !spr || !spr.cv) return; const phi = Math.atan2(dy, dx), sg = LSX * Math.sin(phi) - LSY * Math.cos(phi) < 0 ? -1 : 1;
    c.save(); c.globalAlpha = a; c.translate(ax, ay); c.rotate(phi); c.scale(len / (spr.L * spr.k), sg * kk); c.drawImage(spr.cv, spr.x, spr.y); c.restore();
  }
  /* a dorsal spike as a real four-sided pyramid: a fin-like diamond base (long along the chain, narrow across), the tip
     swept back; faces turned from the camera are skipped, the rest shaded by their true normal (key light from the
     upper left, a dark crimson root to a bright red face, a pale lit ridge). A few path fills each; no baked sprite. */
  const SPK_L = (() => { const l = [-0.42, -0.5, 0.76], n = Math.hypot(l[0], l[1], l[2]); return [l[0] / n, l[1] / n, l[2] / n]; })();
  function spike3(c, V, S2, off, al, tr, ghost) {
    const r = (S2.neck ? 0.048 : 0.06) * S2.w, d = S2.d, t0 = S2.t || [1, 0, 0], td = t0[0] * d[0] + t0[1] * d[1] + t0[2] * d[2];
    const f = vnrm(vsub(t0, vmul(d, td))), sd = vcross(d, f), p = S2.p, tip = vadd(p, vmul(d, S2.L));
    const C = [vadd(p, vmul(f, r * 1.7)), vadd(p, vmul(sd, r * 0.6)), vadd(p, vmul(f, -r * 1.2)), vadd(p, vmul(sd, -r * 0.6))];
    const so = q => { const s2 = V.toS(q); return [s2[0] + off[0], s2[1] + off[1]]; }, St = so(tip), Sc = C.map(so);
    c.save(); c.globalAlpha = al; c.lineJoin = 'round';
    for (let i = 0; i < 4; i++) { const a = C[i], b = C[(i + 1) & 3], n0 = vcross(vsub(b, a), vsub(tip, a)), cen = vmul(vadd(vadd(a, b), tip), 1 / 3);
      let n = vnrm(V.dirW(n0)); const out = vsub(cen, p); if (n0[0] * out[0] + n0[1] * out[1] + n0[2] * out[2] < 0) n = vmul(n, -1);
      if (n[1] * VY + n[2] * VZ <= 0.02) continue;   // (facing away)
      const lam = Math.max(0, n[0] * SPK_L[0] + n[1] * SPK_L[1] + n[2] * SPK_L[2]), k = 0.28 + 0.72 * lam, hl = Math.pow(lam, 12);
      const R0 = Math.min(255, 55 + 160 * k + 70 * hl) | 0, G0 = Math.min(255, 6 + 30 * k + 75 * hl) | 0, B0 = Math.min(255, 12 + 26 * k + 65 * hl) | 0;
      c.beginPath(); c.moveTo(Sc[i][0], Sc[i][1]); c.lineTo(Sc[(i + 1) & 3][0], Sc[(i + 1) & 3][1]); c.lineTo(St[0], St[1]); c.closePath();
      c.fillStyle = `rgb(${R0},${G0},${B0})`; c.fill(); }
    if (!ghost) { c.beginPath(); c.moveTo(Sc[0][0], Sc[0][1]); c.lineTo(St[0], St[1]); c.lineTo(Sc[2][0], Sc[2][1]); c.strokeStyle = 'rgba(40,4,8,0.55)'; c.lineWidth = Math.max(0.6, V.T * V.k * 0.012); c.stroke();
      if (tr > 0.02) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,${90 + 60 * tr | 0},40,${0.85 * tr})`; c.lineWidth = Math.max(1, V.T * V.k * 0.025); c.stroke(); } }
    c.restore();
  }
  /* the membrane between projected points (shifted by off): filled with the vein texture mapped by (W -> 0, A -> u, B -> v), lit by its normal */
  let MAT = null;
  function membrane(c, V, pts, W3, A3, B3, trail, P, alpha, off) {
    if (!TX) return; const T = V.T, so = p => { const q = V.toS(p); return [q[0] + off[0], q[1] + off[1]]; }, W = so(W3), A = so(A3), B = so(B3), S = pts.map(so);
    const path = () => { c.beginPath(); c.moveTo(S[0][0], S[0][1]); for (let i = 1; i < S.length; i++) { const tr = trail[i - 1]; if (tr) { const m = [(S[i - 1][0] + S[i][0]) / 2, (S[i - 1][1] + S[i][1]) / 2], cx = lerp(m[0], W[0], tr), cy = lerp(m[1], W[1], tr); c.quadraticCurveTo(cx, cy, S[i][0], S[i][1]); } else c.lineTo(S[i][0], S[i][1]); } c.closePath(); };
    const N = 256, ax = (A[0] - W[0]) / N, ay = (A[1] - W[1]) / N, bx = (B[0] - W[0]) / N, by = (B[1] - W[1]) / N;
    const wa = V.toW(A3), ww = V.toW(W3), wb = V.toW(B3); let n = vnrm(vcross(vsub(wa, ww), vsub(wb, ww))); if (n[2] < 0) n = vmul(n, -1);
    const dif = Math.max(0, n[0] * LW[0] + n[1] * LW[1] + n[2] * LW[2]), facing = n[1] * VY + n[2] * VZ;
    c.save(); c.globalAlpha = alpha;
    const setT = (pat) => { if (pat.setTransform) { if (!MAT && typeof DOMMatrix !== 'undefined') MAT = new DOMMatrix(); if (MAT) { MAT.a = ax; MAT.b = ay; MAT.c = bx; MAT.d = by; MAT.e = W[0]; MAT.f = W[1]; pat.setTransform(MAT); return true; } } return false; };
    path(); const pm = TX.memPat || (TX.memPat = c.createPattern(TX.mem, 'repeat')); if (setT(pm)) c.fillStyle = pm; else c.fillStyle = '#7A1018'; c.fill();
    { const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, gr = c.createLinearGradient(W[0], W[1], mx, my); gr.addColorStop(0, 'rgba(12,0,4,.55)'); gr.addColorStop(0.45, 'rgba(12,0,4,0)'); gr.addColorStop(0.85, 'rgba(12,0,4,0.08)'); gr.addColorStop(1, 'rgba(12,0,4,.4)'); c.fillStyle = gr; c.fill(); }
    const dk = cl(0.72 - dif * 0.7); if (dk > 0.02) { c.fillStyle = `rgba(14,2,6,${dk})`; c.fill(); }
    if (dif > 0.65) { c.fillStyle = `rgba(255,170,150,${(dif - 0.65) * 0.35})`; c.fill(); }
    const tr = cl(0.42 + 0.35 * (1 - Math.abs(facing)) + 0.5 * P.glow + 0.25 * P.vents); if (tr > 0.02 && TX.memGlow) { const pg = TX.memGlowPat || (TX.memGlowPat = c.createPattern(TX.memGlow, 'repeat')); if (setT(pg)) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * tr; c.fillStyle = pg; c.fill(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = alpha; } }
    c.lineWidth = Math.max(1, T * 0.025); c.strokeStyle = 'rgba(40,4,10,.85)'; c.stroke();
    c.restore();
  }
  /* a swept strip: the neck or the tail as one continuous tube along its samples (pts, radii rad), its seamless tile
     mapped slice by slice (no seams, no gaps, whatever the turn), shaded across by the key light, its belly and seams lit
     by glowA, its silhouette inked; traced in glowing light by `trace` */
  let SMAT = null;
  function strip(c, V, pts, rad, tile, off, glowA, trace, al, low) {
    if (!tile || !tile.cv) return; const T = V.T, sc = V.k, n = pts.length, S = new Array(n), N = new Array(n), Lp = new Array(n), Rp = new Array(n), U = new Array(n), kt = tile.k;
    for (let i = 0; i < n; i++) { const q = V.toS(pts[i]); S[i] = [q[0] + off[0], q[1] + off[1]]; }
    let pn = null; for (let i = 0; i < n; i++) { const a = S[Math.max(0, i - 1)], b = S[Math.min(n - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = hyp(tx, ty) || 1; tx /= l; ty /= l; let nx = -ty, ny = tx; if (pn && nx * pn[0] + ny * pn[1] < 0) { nx = -nx; ny = -ny; } pn = [nx, ny, tx, ty]; N[i] = pn; }
    const hwK = (tile.h / 2) / kt / RT * T * sc; U[0] = 0;
    for (let i = 0; i < n; i++) { const hw = rad[i] * hwK; Lp[i] = [S[i][0] + N[i][0] * hw, S[i][1] + N[i][1] * hw]; Rp[i] = [S[i][0] - N[i][0] * hw, S[i][1] - N[i][1] * hw]; if (i) { const d = vlen(vsub(pts[i], pts[i - 1])), rm = (rad[i] + rad[i - 1]) / 2; U[i] = U[i - 1] + d / (rm / RT) * kt; } }
    if (!SMAT && typeof DOMMatrix !== 'undefined') SMAT = new DOMMatrix(); if (!SMAT) return;
    const pat = tile.pat || (tile.pat = c.createPattern(tile.cv, 'repeat')), g = tile.g, gpat = g ? (g.pat || (g.pat = c.createPattern(g.cv, 'repeat'))) : null;
    if (!pat.setTransform) return;
    const LS0 = -0.47, LS1 = -0.88;
    c.save(); c.globalAlpha = al;
    for (let i = 0; i < n - 1; i++) {
      const L0 = Lp[i], L1 = Lp[i + 1], R0 = Rp[i], R1 = Rp[i + 1], du = (U[i + 1] - U[i]) || 1, tx = N[i + 1][2], ty = N[i + 1][3], ex = i < n - 2 ? 0.9 : 0;
      const ax = (L1[0] - L0[0]) / du, ay = (L1[1] - L0[1]) / du, bx = (R0[0] - L0[0]) / tile.h, by = (R0[1] - L0[1]) / tile.h;
      c.beginPath(); c.moveTo(L0[0], L0[1]); c.lineTo(L1[0] + tx * ex, L1[1] + ty * ex); c.lineTo(R1[0] + tx * ex, R1[1] + ty * ex); c.lineTo(R0[0], R0[1]); c.closePath();
      SMAT.a = ax; SMAT.b = ay; SMAT.c = bx; SMAT.d = by; SMAT.e = L0[0] - ax * U[i]; SMAT.f = L0[1] - ay * U[i]; pat.setTransform(SMAT); c.fillStyle = pat; c.fill();
      // shading across: the side turned to the key light brighter, the far side and both silhouettes darker
      const bL = N[i][0] * LS0 + N[i][1] * LS1, gr = c.createLinearGradient(L0[0], L0[1], R0[0], R0[1]);
      gr.addColorStop(0, `rgba(10,0,6,${0.42 - 0.22 * Math.max(0, bL)})`); gr.addColorStop(0.28, bL > 0 ? `rgba(255,190,170,${0.14 * bL})` : `rgba(10,0,6,${0.3 * -bL})`); gr.addColorStop(0.5, 'rgba(0,0,0,0)');
      gr.addColorStop(0.72, bL < 0 ? `rgba(255,190,170,${0.14 * -bL})` : `rgba(10,0,6,${0.3 * bL})`); gr.addColorStop(1, `rgba(10,0,6,${0.42 - 0.22 * Math.max(0, -bL)})`); c.fillStyle = gr; c.fill();
      if (gpat && glowA > 0.03) { const kr = kt / g.k; SMAT.a = ax * kr; SMAT.b = ay * kr; SMAT.c = (R0[0] - L0[0]) / g.h; SMAT.d = (R0[1] - L0[1]) / g.h; SMAT.e = L0[0] - ax * U[i]; SMAT.f = L0[1] - ay * U[i]; gpat.setTransform(SMAT); c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * Math.min(1, glowA); c.fillStyle = gpat; c.fill(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = al; }
    }
    // the silhouette: a soft ink line; traced in fire while charging
    const edge = (P2) => { c.beginPath(); c.moveTo(P2[0][0], P2[0][1]); for (let i = 1; i < n; i++) c.lineTo(P2[i][0], P2[i][1]); c.stroke(); };
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = 'rgba(30,2,8,.7)'; c.lineWidth = Math.max(1, T * 0.022); edge(Lp); edge(Rp);
    if (trace > 0.02) { c.globalCompositeOperation = 'lighter'; for (const [w, col, k2] of [[0.16, '#FF3A1A', 0.35], [0.07, '#FF8A3A', 0.75], [0.025, '#FFE2B0', 1]]) { c.lineWidth = Math.max(1, T * w * sc); c.strokeStyle = col; c.globalAlpha = al * trace * k2; edge(Lp); edge(Rp); } }
    c.restore();
  }
  const ITEMS = []; let NI = 0;
  const item = (d, fn) => { const I = ITEMS[NI] || (ITEMS[NI] = {}); NI++; I.d = d; I.fn = fn; return I; };
  let LAST = null;   // (the last drawn rig and view, for anchor())
  const W_TORSO = [1.1, 0.75, 0.7], W_HEAD = [0.6, 0.3, 0.3], W_SMALL = [0.4, 0.25, 0.2];
  /* draw the dragon at world (x, y), height z, heading a, in pose P. o: { T, sx, sy, pet(c, X, Y), t, scale, low } */
  function draw(c, x, y, z, a, P, o) {
    o = o || {}; const T = o.T, t = o.t != null ? o.t : nowMs() / 1000;
    const want0 = bucketOf(a); if (BK.k) { if (!readyB(want0)) want(want0, !usableB(want0)); }
    const R = rig(P, t), V = mkView(x, y, z, a, P, o); LAST = { R, V, x, y, z, a, P };
    if (!TX || !segsReady() || !(P.alpha > 0.01)) return;
    const al = P.alpha, sc = V.k, kseg = BK.seg.wbone ? T * sc / BK.seg.wbone.k : 0, low = o.low != null ? o.low : lowFx(), tr = cl(P.trace);
    NI = 0;
    /* a shell: crossfaded between the two nearest heading buckets (no popping as it turns), mapped by the least-squares
       affine; returns the map of the nearest bucket (for attaching children) */
    const shell = (name, p3, F, L, s, glowA, dOff, w3, traced) => {
      if (o.skip && o.skip.includes(name)) return null;
      const Fw = V.dirW(F), Lw = V.dirW(L), fb = Math.atan2(Fw[1], Fw[0]) / TAU * NB, f0 = Math.floor(fb), w = fb - f0, b0 = ((f0 % NB) + NB) % NB, b1 = (b0 + 1) % NB, sp = V.toS(p3);
      let B0 = sprOf(name, b0) ? b0 : nearestB(name, b0), B1 = sprOf(name, b1) ? b1 : -1; if (B0 < 0) return null; if (B1 === B0) B1 = -1;
      if (o.ghost && w >= 0.5 && B1 >= 0) { B0 = B1; B1 = -1; }   // (a ghost: the nearest bucket alone)
      const M0 = lsM(B0 / NB * TAU, Fw, Lw, w3), M1 = B1 >= 0 && !o.ghost ? lsM(B1 / NB * TAU, Fw, Lw, w3) : null, near = w < 0.5 || B1 < 0 ? [B0, M0] : [B1, M1];
      item(V.depth(p3) + (dOff || 0), () => {
        if (traced && tr > 0.02 && !o.ghost) { c.save(); c.shadowColor = `rgba(255,80,30,${0.95 * tr})`; c.shadowBlur = T * 0.45 * sc * tr; drawSpr(c, sprOf(name, B0), M0, sp[0], sp[1], sc * s, T, al); c.restore(); }
        drawSpr(c, sprOf(name, B0), M0, sp[0], sp[1], sc * s, T, al); if (M1) drawSpr(c, sprOf(name, B1), M1, sp[0], sp[1], sc * s, T, al * w);
        if (glowA > 0.01 && !o.ghost) { const g0 = BK.glow[name][B0], g1 = B1 >= 0 ? BK.glow[name][B1] : null, ga = al * Math.min(1, glowA); if (g0) drawSpr(c, g0, M0, sp[0], sp[1], sc * s, T, ga * (g1 ? 1 - w : 1), 'lighter'); if (g1) drawSpr(c, g1, M1, sp[0], sp[1], sc * s, T, ga * w, 'lighter'); } });
      return { b: near[0], M: near[1], S: sp, s };
    };
    const glowB = cl(0.38 + 0.62 * Math.max(P.glow, tr * 0.8)), throatG = cl(0.3 + Math.max(P.throat, P.glow * 0.9, tr * 0.7)), ventG = cl(0.5 + Math.max(P.vents, P.glow));
    // the torso; then every chain is attached where the drawn torso really puts its root (no drift, no gap)
    const Tm = shell('torso', R.torso, [1, 0, 0], [0, 1, 0], TK * (1 + R.breath * 0.6), Math.max(glowB, ventG * 0.9), 0, W_TORSO, true);
    const dTorso = V.depth(R.torso);
    const attach = p3 => { if (!Tm) return [0, 0]; const ab = Tm.b / NB * TAU, pp = projD(rZ(vsub(p3, R.torso), ab)), M = Tm.M, k2 = T * sc, X = Tm.S[0] + (M[0] * pp[0] + M[1] * pp[1]) * k2, Y = Tm.S[1] + (M[2] * pp[0] + M[3] * pp[1]) * k2, tS = V.toS(p3); return [X - tS[0], Y - tS[1]]; };
    const dN = attach(R.neckS[1]), dT = attach(R.tailS[1]), dW = R.wing.map(Wg => attach(Wg.root)), dH = R.leg.map(Lg => attach(Lg.hip));
    R.dN = dN; R.dT = dT; R.dW = dW;
    const so = (p3, d) => { const q = V.toS(p3); return [q[0] + d[0], q[1] + d[1]]; };
    // the neck and the tail: one continuous strip each, drawn under the torso (their roots disappear into it)
    const ntube = BK.tube.ntube, ttube = BK.tube.ttube;
    item(Math.min(V.depth(R.neckS[7]), dTorso - 0.02), () => strip(c, V, R.neckS, R.neckR, ntube, dN, o.ghost ? 0 : throatG * 0.9, o.ghost ? 0 : tr, al, low));
    item(Math.min(V.depth(R.tailS[8]), dTorso - 0.03), () => strip(c, V, R.tailS, R.tailR, ttube, dT, o.ghost ? 0 : glowB * 0.8, o.ghost ? 0 : tr, al, low));
    // the head and the lower jaw (on the neck's end, shifted with it)
    const Sh = so(R.head, dN), Sj = so(R.hinge, dN);
    { const hs = shell('head', R.head, R.headF, R.headL, HEADK, cl(0.4 + P.glow * 0.6 + P.core * 0.4 + tr * 0.5), 0.01, W_HEAD, true); if (hs) { hs.S[0] = Sh[0]; hs.S[1] = Sh[1]; } }
    { const js = shell('jaw', R.hinge, R.jawF, R.headL, HEADK, cl(0.2 + P.jaw * 0.6 + P.core + P.throat * 0.5), -0.005, W_SMALL, true); if (js) { js.S[0] = Sj[0]; js.S[1] = Sj[1]; } }
    // the blade at the tail's end
    { const d = R.tipDir, Ld = vnrm([-d[1], d[0], 0]), bl = shell('tip', R.tail[R.tail.length - 1], d, Ld, 2.0, cl(0.5 + P.glow * 0.5 + tr * 0.5), 0, W_SMALL, true); if (bl) { const q = so(R.tail[R.tail.length - 1], dT); bl.S[0] = q[0]; bl.S[1] = q[1]; } }
    // the hind legs
    R.leg.forEach((Lg, li) => { const d = dH[li], h = so(Lg.hip, d), k2 = so(Lg.kn, d), an = so(Lg.ank, d);
      item(V.depth(vmul(vadd(Lg.hip, Lg.kn), 0.5)), () => drawSegImg(c, BK.seg.thigh, h[0], h[1], k2[0], k2[1], kseg * LK * 1.15, al));
      item(V.depth(vmul(vadd(Lg.kn, Lg.ank), 0.5)) + 0.002, () => drawSegImg(c, BK.seg.shin, k2[0], k2[1], an[0], an[1], kseg * LK, al));
      const fd = vnrm(vadd(vsub(Lg.ank, Lg.kn), V3(0.6, 0, 0))), fs = shell('foot', Lg.ank, [fd[0], fd[1], 0], [-fd[1], fd[0], 0], LK, 0, 0.004, W_SMALL); if (fs) { fs.S[0] = an[0]; fs.S[1] = an[1]; } });
    // the dorsal spikes and the neck's frill (on their strip, shifted with it)
    // (true 3D pyramids, projected each frame: right at every heading, no flipping, fanning or sliding; see spike3)
    if (!o.ghost) for (const S2 of R.spk) { const d = S2.neck ? dN : S2.tail ? dT : attach(S2.p), a3 = S2.p, b3 = vadd(a3, vmul(S2.d, S2.L));
      item(V.depth(vmul(vadd(a3, b3), 0.5)) - 0.03, () => spike3(c, V, S2, d, al, tr, o.ghost)); }
    // the wings, attached at their roots: membranes, then the arm, the fingers, the claws and the hubs over them
    const hub = BK.seg.hub, kHub = hub ? T * sc / hub.k : 0, cl2 = BK.seg.claw, wf = BK.seg.wfing;
    R.wing.forEach((Wg, wi) => { const { root, elbow, wrist, fing, hipA } = Wg, F = fing, d = dW[wi];
      const panels = [[wrist, F[0], F[1], [0, 0.2]], [wrist, F[1], F[2], [0, 0.22]], [wrist, F[2], F[3], [0, 0.24]]];
      for (const [w3, a3, b3, trl] of panels) item(V.depth(vmul(vadd(vadd(w3, a3), b3), 1 / 3)) - 0.06, () => membrane(c, V, [w3, a3, b3], w3, a3, b3, trl, P, al, d));
      item(V.depth(vmul(vadd(vadd(wrist, F[3]), vadd(hipA, root)), 0.25)) - 0.06, () => membrane(c, V, [wrist, F[3], hipA, root, elbow], wrist, F[3], hipA, [0, 0.25, 0, 0, 0], P, al, d));
      const Sr = so(root, d), Se = so(elbow, d), Sw = so(wrist, d);
      item(V.depth(vmul(vadd(root, elbow), 0.5)) - 0.01, () => drawSegImg(c, BK.seg.wbone, Sr[0], Sr[1], Se[0], Se[1], kseg * 2.4, al));
      item(V.depth(vmul(vadd(elbow, wrist), 0.5)) - 0.01, () => drawSegImg(c, BK.seg.wbone, Se[0], Se[1], Sw[0], Sw[1], kseg * 2.0, al));
      for (let i = 0; i < 4; i++) { const tip = F[i], St = so(tip, d), dd = vnrm(vsub(tip, wrist)), cTip = vadd(tip, vmul(vnrm(vadd(dd, V3(0, 0, -0.35))), i === 0 ? 0.5 : 0.32)), Sc = so(cTip, d);
        item(V.depth(vmul(vadd(wrist, tip), 0.5)) - 0.015, () => { drawSegImg(c, wf, Sw[0], Sw[1], St[0], St[1], T * sc / wf.k * (2.0 - i * 0.15), al); drawSegImg(c, cl2, St[0], St[1], Sc[0], Sc[1], T * sc / cl2.k * (i === 0 ? 1.6 : 1.05), al); }); }
      { const dd = vnrm(vsub(wrist, elbow)), th = vadd(wrist, vmul(vnrm(vadd(dd, V3(0.4, 0, 0.25))), 0.42)), St = so(th, d); item(V.depth(wrist) + 0.005, () => drawSegImg(c, cl2, Sw[0], Sw[1], St[0], St[1], T * sc / cl2.k * 1.3, al)); }
      for (const [p3, r] of [[root, 1.6], [elbow, 1.35], [wrist, 1.25]]) { const S3 = so(p3, d); item(V.depth(p3) + 0.008, () => { c.save(); c.globalAlpha = al; c.translate(S3[0], S3[1]); c.scale(kHub * r, kHub * r); c.drawImage(hub.cv, hub.x, hub.y); c.restore(); }); } });
    // the ring over the back (Ultima): its far half behind, its near half in front
    if (P.ring > 0.01 && !o.ghost) { const rc = R.ring; item(V.depth(rc) - 0.9, () => drawRing(c, V, R, P, al, 0)); item(V.depth(rc) + 0.9, () => drawRing(c, V, R, P, al, 1)); }
    // sort and draw
    const L2 = ITEMS; for (let i = 1; i < NI; i++) { const it = L2[i]; let j = i - 1; while (j >= 0 && L2[j].d > it.d) { L2[j + 1] = L2[j]; j--; } L2[j + 1] = it; }
    for (let i = 0; i < NI; i++) L2[i].fn();
    if (o.ghost) return;   // (a motion-blur ghost: the body only)
    lights(c, V, R, P, al, low);
    if (P.heat > 0.03 && !low) { const tt = t * 3; c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const p3 = i < 3 ? R.neck[1 + i] : i < 5 ? R.torso : R.tail[(i - 4) * 4], s3 = V.toS(p3), ph2 = tt + i * 1.7, r = T * sc * (0.5 + 0.25 * Math.sin(ph2)); c.globalAlpha = al * P.heat * (0.12 + 0.06 * Math.sin(ph2 * 1.3));
      blitSized(c, glowSprite(i & 1 ? FIRE : '#FF4A1A'), s3[0] - r + Math.sin(ph2) * T * 0.15, s3[1] - r - T * 0.3 * ((tt * 0.4 + i * 0.3) % 1), r * 2, r * 2); } c.restore(); }
    // the rider last, upright, in clear view on its seat
    if (o.pet) { const s3 = V.toS(R.seat); o.pet(c, s3[0], s3[1]); }
  }
  function lights(c, V, R, P, al, low) {
    const T = V.T, sc = V.k, dN = R.dN || [0, 0], dW = R.dW || [[0, 0], [0, 0]], toS = (p3, d) => { const q = V.toS(p3); return [q[0] + d[0], q[1] + d[1]]; };   // (on the parts as drawn: shifted with their chains)
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const s of [-1, 1]) { const e = toS(vadd(R.eyes, vmul(R.headL, 0.108 * HEADK * s)), dN), r = T * sc * (0.07 + 0.06 * P.glow); c.globalAlpha = al * (0.45 + 0.4 * P.glow); blitSized(c, glowSprite(FIRE), e[0] - r, e[1] - r, r * 2, r * 2); c.globalAlpha = al; blitSized(c, glowSprite(CORE), e[0] - r * 0.3, e[1] - r * 0.3, r * 0.6, r * 0.6); }
    const m = toS(R.mouth, dN), mk = Math.max(P.jaw * 0.35, P.throat * 0.6, P.core);
    if (mk > 0.02) { const r = T * sc * (0.25 + 0.45 * P.core + 0.15 * P.throat); c.globalAlpha = al * Math.min(1, mk); blitSized(c, glowSprite(FIRE), m[0] - r, m[1] - r, r * 2, r * 2); if (P.core > 0.02) { const r2 = r * (0.35 + 0.15 * Math.sin(nowMs() / 60)); c.globalAlpha = al * P.core; blitSized(c, glowSprite(CORE), m[0] - r2, m[1] - r2, r2 * 2, r2 * 2); blitSized(c, glowSprite('#FFFFFF'), m[0] - r2 * 0.45, m[1] - r2 * 0.45, r2 * 0.9, r2 * 0.9); } }
    if (P.throat > 0.05) for (let i = 1; i < 5; i++) { const p = toS(vadd(R.neck[i], V3(0, 0, -0.1)), dN), r = T * sc * 0.22; c.globalAlpha = al * P.throat * 0.5; blitSized(c, glowSprite(FIRE), p[0] - r, p[1] - r, r * 2, r * 2); }
    if (!low) { const b = V.toS(R.belly), r = T * sc * (1.3 + 0.6 * P.glow); c.globalAlpha = al * (0.1 + P.glow * 0.3); blitSized(c, glowSprite('#FF4A1A'), b[0] - r, b[1] - r * 0.7, r * 2, r * 1.4); }
    R.wing.forEach((Wg, wi) => { for (const p3 of [Wg.root, Wg.elbow, Wg.wrist]) { const p = toS(p3, dW[wi] || [0, 0]), r = T * sc * (0.2 + 0.1 * P.glow); c.globalAlpha = al * (0.55 + 0.4 * P.glow); blitSized(c, glowSprite(FIRE), p[0] - r, p[1] - r, r * 2, r * 2); } });
    for (const vp of R.vents) { const p = V.toS(vp), r = T * sc * (0.28 + 0.3 * P.vents); c.globalAlpha = al * (0.3 + P.vents * 0.6); blitSized(c, glowSprite(EMBER), p[0] - r, p[1] - r, r * 2, r * 2); }
    c.restore();
  }
  /* the Ultima ring: concentric luminous bands over the back, runes on the outer band, floating angular segments; the
     inner bands counter-rotate. half: 0 the far half, 1 the near half */
  function drawRing(c, V, R, P, al, half) {
    const T = V.T, sc = V.k, ctr = V.toW(R.ring), C = V.toS(R.ring), vis = P.ring, spin = P.ringSpin, k = T * sc * 1.45;   // (the ring sized to the back it crowns)
    const ell = (rad, a0, a1, w, col, alpha) => { c.beginPath(); c.ellipse(C[0], C[1], rad * k, rad * k * GY, 0, a0, a1); c.lineWidth = w; c.strokeStyle = col; c.globalAlpha = alpha; c.stroke(); };
    const a0 = half ? 0 : Math.PI, a1 = half ? Math.PI : TAU;   // (the near half is the lower half of the ellipse)
    c.save(); c.globalCompositeOperation = 'lighter'; const A = al * vis;
    // thick bands, each three steady passes: a wide soft bloom, the body, a hot core (no time terms: no strobing)
    for (const [rad, w, alp] of [[1.45, 0.15, 0.4], [1.32, 0.06, 0.95], [1.08, 0.09, 0.65], [0.78, 0.05, 0.85]]) { ell(rad, a0, a1, T * w * 5.0 * sc, 'rgba(255,40,20,1)', A * alp * 0.12); ell(rad, a0, a1, T * w * 2.4 * sc, 'rgba(255,70,35,1)', A * alp * 0.35); ell(rad, a0, a1, Math.max(1.5, T * w * 1.1 * sc), 'rgba(255,130,80,1)', A * alp * 0.7); ell(rad, a0, a1, Math.max(1, T * w * 0.45 * sc), 'rgba(255,225,190,1)', A * alp); }
    // the runes round the outer band, turning; the inner band's ticks counter-turning
    if (TX && TX.runes) { const n = 24; for (let i = 0; i < n; i++) { const th = i / n * TAU + spin; const s = Math.sin(th); if ((half && s < 0) || (!half && s >= 0)) continue; const px = C[0] + Math.cos(th) * 1.2 * k, py = C[1] + s * 1.2 * k * GY, w = T * 0.2 * sc, h = T * 0.12 * sc;
      c.save(); c.translate(px, py); c.rotate(th + Math.PI / 2); c.scale(1, 0.6 + 0.4 * Math.abs(Math.cos(th))); c.globalAlpha = A * 0.9; c.drawImage(TX.runes, (i % 16) * 32, 0, 32, 32, -w / 2, -h / 2, w, h); c.restore(); } }
    for (let i = 0; i < 12; i++) { const th = i / 12 * TAU - spin * 1.6, s = Math.sin(th); if ((half && s < 0) || (!half && s >= 0)) continue; const r0 = 0.82, r1 = 0.98; c.beginPath(); c.moveTo(C[0] + Math.cos(th) * r0 * k, C[1] + s * r0 * k * GY); c.lineTo(C[0] + Math.cos(th + 0.06) * r1 * k, C[1] + Math.sin(th + 0.06) * r1 * k * GY); c.strokeStyle = 'rgba(255,170,120,1)'; c.lineWidth = Math.max(1.5, T * 0.045 * sc); c.globalAlpha = A * 0.85; c.stroke(); }
    // floating angular segments on the outside, and a trail of embers circling with the spin
    for (let i = 0; i < 6; i++) { const th = i / 6 * TAU + spin * 0.7, s = Math.sin(th); if ((half && s < 0) || (!half && s >= 0)) continue; const r = 1.62; c.beginPath(); c.ellipse(C[0], C[1], r * k, r * k * GY, 0, th, th + 0.32); c.lineWidth = Math.max(3, T * 0.16 * sc); c.strokeStyle = 'rgba(255,60,30,1)'; c.globalAlpha = A * 0.25; c.stroke(); c.lineWidth = Math.max(1.5, T * 0.07 * sc); c.strokeStyle = 'rgba(255,110,60,1)'; c.globalAlpha = A * 0.75; c.stroke(); }
    const sp2 = Math.min(1, Math.abs(P.ringSpinV || 0) / 2.4); if (sp2 > 0.05) for (let i = 0; i < 14; i++) { const th = spin * 1.3 + i * 0.09, s = Math.sin(th); if ((half && s < 0) || (!half && s >= 0)) continue; const px = C[0] + Math.cos(th) * 1.5 * k, py = C[1] + s * 1.5 * k * GY, r = T * 0.07 * sc * (1 - i / 14); c.globalAlpha = A * sp2 * (1 - i / 14); blitSized(c, glowSprite(EMBER), px - r, py - r, r * 2, r * 2); }
    c.restore(); void ctr;
  }
  /* the ground shadow: soft and smudgy (the user, 2026-11-11: "a blur in the shadow ... so you can't make out the little
     parts"): the dragon's silhouette (body, tail and the wings' current span) is drawn into a tiny canvas (about 56 px
     across), box-blurred there twice, and blitted up to size with smoothing, so only a soft dark smudge of the wings and
     body reaches the floor. Smaller and fainter with height. Cost: a few dozen tiny strokes and five small blits a frame */
  const SHB = { a: null, b: null };
  function shCanvas(k, w, h) { let cv = SHB[k]; if (!cv) { cv = SHB[k] = document.createElement('canvas'); } if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } else cv.getContext('2d').clearRect(0, 0, w, h); return cv; }
  function drawShadow(c, x, y, z, a, P, o) {
    if (!TX) return; const T = o.T, R = rig(P, o.t || 0), V = mkView(x, y, 0, a, P, o), k = 1 / (1 + Math.max(0, z) * 0.16), al = 0.42 * k * (P.alpha == null ? 1 : P.alpha);
    if (!(al > 0.01)) return;
    const S = p => { const w = V.toW(p); return [o.sx(w[0] + 0.25 * z), o.sy(w[1] + 0.12 * z)]; };   // (flattened on the floor, cast a little away from the key light)
    const wings = R.wing.map(Wg => [Wg.root, Wg.elbow, Wg.wrist, Wg.fing[0], Wg.fing[1], Wg.fing[2], Wg.fing[3], Wg.hipA].map(S)), chain = [R.head].concat(R.neck.slice().reverse(), [R.torso], R.tail).map(S);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const L of wings.concat([chain])) for (const p of L) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    const pad = T * VIS * 0.9 * (1 + z * 0.1); x0 -= pad; y0 -= pad; x1 += pad; y1 += pad; if (!(x1 > x0 && y1 > y0)) return;
    // the small canvas: about 40 px on its long side (the blur's softness scales with the shadow's size)
    const ds = Math.max(x1 - x0, y1 - y0) / 56, W = Math.max(4, Math.ceil((x1 - x0) / ds)), Hh = Math.max(4, Math.ceil((y1 - y0) / ds));
    const A = shCanvas('a', W, Hh), g = A.getContext('2d'); g.setTransform(1 / ds, 0, 0, 1 / ds, -x0 / ds, -y0 / ds);
    g.fillStyle = 'rgb(8,3,4)'; g.strokeStyle = 'rgb(8,3,4)'; g.lineCap = 'round'; g.lineJoin = 'round'; const wd = T * VIS * 0.12 * (1 + z * 0.08);
    g.globalAlpha = 0.75; for (const pts of wings) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.lineWidth = wd; g.fill(); g.stroke(); }
    g.globalAlpha = 1; for (let i = 1; i < chain.length; i++) { g.beginPath(); g.moveTo(chain[i - 1][0], chain[i - 1][1]); g.lineTo(chain[i][0], chain[i][1]); const u = i / chain.length; g.lineWidth = T * VIS * (i < 7 ? 0.32 : i === 7 ? 0.7 : 0.4 * (1 - u) + 0.08) + wd; g.stroke(); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    // two box-blur passes (A -> B -> A): the small parts melt into one soft smudge
    const B2 = shCanvas('b', W, Hh), gb = B2.getContext('2d');
    for (let pass = 0; pass < 2; pass++) { const src = pass ? B2 : A, dst = pass ? A : B2, gd = pass ? g : gb; if (pass) gd.clearRect(0, 0, W, Hh); const r = pass ? 1 : 1.5;
      gd.globalAlpha = 0.34; gd.drawImage(src, 0, 0); gd.globalAlpha = 0.22; gd.drawImage(src, -r, 0); gd.drawImage(src, r, 0); gd.drawImage(src, 0, -r); gd.drawImage(src, 0, r); gd.globalAlpha = 1; void dst; }
    c.save(); c.globalAlpha = al; c.imageSmoothingEnabled = true; c.drawImage(A, 0, 0, W, Hh, x0, y0, W * ds, Hh * ds); c.restore();
  }
  /* world anchors of the last drawn pose: mouth, belly, chest, wingL / wingR (roots), ventL / ventR, ring (centre over the
     back), seat, tail (the tip), head, eyes */
  function anchor(name) {
    if (!LAST) return null; const { R, V } = LAST, w = (p, d) => { const q = V.toW(p); return { x: q[0] + (d ? d[0] / V.T : 0), y: q[1] + (d ? d[1] / V.T : 0), z: q[2] }; };   // (with the chain's attach shift: on the part as drawn)
    const dN = R.dN, dT = R.dT, dW = R.dW || [];
    switch (name) { case 'mouth': return w(R.mouth, dN); case 'belly': return w(R.belly); case 'chest': return w(R.chest); case 'wingL': return w(R.wing[0].root, dW[0]); case 'wingR': return w(R.wing[1].root, dW[1]);
      case 'ventL': return w(R.vents[0]); case 'ventR': return w(R.vents[1]); case 'ring': return w(R.ring); case 'seat': return w(R.seat); case 'tail': return w(R.tail[R.tail.length - 1], dT); case 'tailTip': return w(vadd(R.tail[R.tail.length - 1], vmul(R.tipDir, 1.0)), dT);
      case 'head': return w(R.head, dN); case 'eyes': return w(R.eyes, dN); case 'wingTipL': return w(R.wing[0].fing[0], dW[0]); case 'wingTipR': return w(R.wing[1].fing[0], dW[1]); default: return w(R.torso); }
  }

  /* ================= the clips: pose drivers (t in seconds from the clip's start; they write P and return hints) =================
     each returns { dz (target height change, tiles), speed (forward, tiles/s, a hint), done } */
  const ease = u => u * u * (3 - 2 * u);
  const flapAt = (P, dt, rate, amp) => { P.flap = (P.flap + dt * rate) % 1; P.flapAmp += (amp - P.flapAmp) * Math.min(1, dt * 4); };
  const CLIPS = {
    hover: { dur: 3, run(P, t, dt) { flapAt(P, dt, 1.55, 0.95); P.pitch = -0.18; P.legs = 0.55; P.neckCurve = 0.55; P.spread = 0.2; P.fold = 0; P.tailSwing = Math.sin(t * 1.3) * 0.35; P.headYaw = Math.sin(t * 0.7) * 0.25; return { speed: 0 }; } },
    fly: { dur: 4, run(P, t, dt, ctx) { const turn = ctx && ctx.turn || Math.sin(t * 0.9) * 0.8; flapAt(P, dt, 1.25, 0.72); P.pitch = 0.04; P.legs = 0.3; P.neckCurve = -0.15; P.spread = 0; P.fold = 0; P.bank = turn * 0.5; P.tailSwing = -turn * 0.8; P.headYaw = turn * 0.3; return { speed: 5 }; } },
    climb: { dur: 2.4, run(P, t, dt) { flapAt(P, dt, 1.8, 1); P.pitch = -0.38; P.legs = 0.2; P.neckCurve = 0.3; P.bank = 0; P.tailSwing = Math.sin(t * 2) * 0.2; P.tailLift = -0.4; return { speed: 3, dz: 1.2 }; } },
    descend: { dur: 2.4, run(P, t, dt) { flapAt(P, dt, 0.35, 0.18); P.pitch = 0.28; P.legs = 0.1; P.neckCurve = -0.3; P.fold = 0.15; P.spread = 0.1; P.tailLift = 0.3; return { speed: 4, dz: -1.0 }; } },
    dive: { dur: 2.2, run(P, t, dt) {   // part-fold, neck forward, plunge; flare to brake; slam; push up
      if (t < 0.25) { const u = ease(t / 0.25); flapAt(P, dt, 1.4, 0.6 * (1 - u)); P.fold = 0.75 * u; P.pitch = 0.75 * u; P.neckCurve = -0.9 * u; P.headPitch = 0.5 * u; P.legs = 0; P.spread = 0; return { speed: 2, dz: 0 }; }
      if (t < 0.8) { flapAt(P, dt, 0.2, 0.05); P.fold = 0.8; P.pitch = 0.95; P.neckCurve = -1; P.headPitch = 0.6; P.tailLift = 0.6; P.tailSwing = Math.sin(t * 9) * 0.25; P.heat = 1; return { speed: 6, dz: -5.5 }; }
      if (t < 1.0) { const u = ease((t - 0.8) / 0.2); P.fold = 0.8 * (1 - u); P.spread = u; P.pitch = lerp(0.95, -0.45, u); P.legs = u; P.neckCurve = lerp(-1, 0.4, u); P.headPitch = lerp(0.6, 0.3, u); flapAt(P, dt, 0.5, 0.3); P.heat = 1 - u; return { speed: 1, dz: -1.5 }; }
      if (t < 1.15) { P.spread = 1; P.pitch = -0.3; P.legs = 1; P.flapAmp = 0.2; return { speed: 0, dz: 0, slam: t - dt < 1.0 }; }
      const u = ease(Math.min(1, (t - 1.15) / 1.0)); flapAt(P, dt, 1.9, 1.05); P.spread = 1 - u; P.pitch = lerp(-0.3, -0.15, u); P.legs = 1 - u * 0.6; P.neckCurve = lerp(0.4, 0.2, u); P.headPitch = 0.3 * (1 - u); P.tailLift = 0; return { speed: 1, dz: 2.5 * (1 - u) + 0.5 }; } },
    fireball: { dur: 1.6, run(P, t, dt, ctx) { const n = ctx && ctx.n || 3; flapAt(P, dt, 1.5, 0.85); P.pitch = -0.1; P.legs = 0.4; P.neckCurve = 0.3; const k = Math.floor(t / 0.42), u = (t % 0.42) / 0.42;   // (each shot: draw in, flare, release with recoil)
      if (k < n) { P.throat = u < 0.6 ? u / 0.6 : 1 - (u - 0.6) / 0.4; P.jaw = u < 0.55 ? u * 0.6 : u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3 * 0.8; P.headPitch = 0.45 + (u > 0.55 && u < 0.75 ? -0.25 : 0); P.neckCurve = 0.3 + (u > 0.55 && u < 0.8 ? 0.35 : 0); return { speed: 0, shot: u > 0.55 && (t - dt) % 0.42 / 0.42 <= 0.55 }; }
      P.throat = Math.max(0, P.throat - dt * 4); P.jaw = Math.max(0, P.jaw - dt * 3); P.headPitch *= 0.9; return { speed: 0 }; } },
    flare: { dur: 1.8, run(P, t, dt) { const u = t < 0.25 ? t / 0.25 : t < 1.2 ? 1 : 1 - (t - 1.2) / 0.6; flapAt(P, dt, 1.4, 0.8 - 0.4 * u); P.vents = cl(u); P.glow = 0.35 * cl(u); P.spread = 0.5 * u + (t > 0.25 && t < 0.45 ? 0.3 : 0); P.pitch = -0.12 - 0.12 * u; P.neckCurve = 0.4; P.legs = 0.4; P.tailSwing = Math.sin(t * 6) * 0.2 * u; return { speed: 0, burst: t > 0.25 && t < 1.2 }; } },
    ultima: { dur: 5.2, run(P, t, dt) {   // rise and spread; spikes extend; the ring appears and accelerates; the body lights; the mouth's core forms
      const u0 = ease(Math.min(1, t / 1.0)); flapAt(P, dt, 1.2 - 0.5 * u0, 1 - 0.35 * u0); P.spread = 0.85 * u0; P.pitch = -0.32 * u0; P.legs = 0.7 * u0; P.neckCurve = 0.6 * u0; P.headPitch = 0.25 * u0;
      P.trace = sstep(0.4, 2.2, t); P.ring = sstep(1.3, 2.0, t); P.ringSpinV = lerp(0.4, 3.2, sstep(1.5, 4.0, t)); P.ringSpin += dt * P.ringSpinV;
      P.glow = sstep(2.2, 3.4, t); P.vents = P.glow * 0.8; P.throat = sstep(3.0, 3.8, t); P.jaw = 0.4 * sstep(3.3, 4.0, t); P.core = sstep(3.4, 4.6, t);
      return { speed: 0, dz: t < 1.2 ? 1.5 : 0 }; } },
    beam: { dur: 2.6, run(P, t, dt) { P.ring = 1; P.ringSpinV = 3.2; P.ringSpin += dt * 3.2; P.trace = 1; P.glow = 1; P.vents = 1; P.core = 1; P.jaw = 1; P.throat = 1; P.headPitch = 0.95; P.neckCurve = 0.1; P.pitch = -0.4 + Math.sin(t * 37) * 0.015; P.spread = 1; P.legs = 1; P.tailLift = -0.5; flapAt(P, dt, 0.9, 0.55); return { speed: 0, beam: true, shake: 1 }; } },
    settle: { dur: 1.6, run(P, t, dt) { const u = ease(Math.min(1, t / 1.4)); P.ring = Math.max(0, 1 - u * 1.6); P.ringSpinV = 3.2 * (1 - u); P.ringSpin += dt * P.ringSpinV; P.trace = 1 - u; P.glow = 1 - u; P.vents = 1 - u; P.core = 0; P.jaw = Math.max(0, 1 - u * 2); P.throat = 0; P.headPitch = 0.2; P.spread = 0.3; flapAt(P, dt, 1.4, 0.85); P.pitch = -0.15; return { speed: 0, ringBreak: t < 0.6 }; } },
    summon: { dur: 3.4, run(P, t, dt) {   // the seal, the heat haze, the emergence (wings folded), the pet mounts, wings spread, a big downstroke rise
      P.alpha = sstep(0.5, 1.4, t); P.heat = 1 - sstep(1.2, 2.2, t); P.fold = 1 - sstep(1.6, 2.2, t); P.spread = sstep(1.7, 2.1, t) * (1 - sstep(2.4, 3.0, t)); P.legs = 1 - sstep(2.6, 3.3, t) * 0.7; P.pitch = -0.2 * sstep(1.8, 2.4, t); P.neckCurve = 0.6; P.glow = 0.4 * (1 - sstep(1.4, 2.6, t)); P.vents = P.glow;
      if (t < 2.1) { P.flapAmp = 0.1; P.flap = 0.25; } else flapAt(P, dt, 1.6, 1.15);
      return { speed: 0, dz: t > 2.1 ? 2.6 : 0, seal: t < 2.4, mount: t > 1.9 && t < 2.3 }; } },
    dismiss: { dur: 1.6, run(P, t, dt) { flapAt(P, dt, 1.6, 0.9); P.alpha = 1 - sstep(0.4, 1.4, t); P.glow = sstep(0, 0.4, t) * (1 - sstep(0.8, 1.4, t)); P.heat = 1; P.vents = P.glow; return { speed: 0, embers: t < 1.3 }; } },
  };
  /* steady relaxing toward a neutral flight pose (call each frame when no clip owns a channel) */
  function relax(P, dt) { const k = Math.min(1, dt * 3); for (const c2 of ['downFlex', 'spread', 'fold', 'finger', 'headYaw', 'headPitch', 'jaw', 'throat', 'pitch', 'bank', 'tailSwing', 'tailLift', 'legs', 'vents', 'glow', 'spikes', 'trace', 'ring', 'core', 'heat']) P[c2] += (0 - P[c2]) * k; P.alpha += (1 - P.alpha) * k; }

  /* ================= the dev preview (test builds only: reached through the test hook (nidhoggPreview there)) =================
     The dragon flies over the current Tower floor with the pet on its back. The stick steers; Dodge dives; Strong 1
     breathes fireballs, Strong 2 flares, the Ult runs the Ultima charge and the beam; J (Jump) climbs, and it cycles the
     clips by itself when left alone (opts.auto). No damage, no gameplay: it only draws. preview(false) ends it. */
  let PV = null;
  function preview(opts) {
    if (opts === false) { if (PV) PV.end(); return null; }
    if (typeof arc === 'undefined' || !arc.game || !arc.game._dbg || !arc.game._dbg.ELEM) return 'Start a Tower floor first (dun.startDungeon, beginPlay), then call nidhoggPreview().';
    if (PV) PV.end();
    opts = opts || {};
    const D = arc.game._dbg, H = D.ELEM.H, X = H.X, me = D.me, g = D.g, T0 = X.Tz(), dpr = (arc && arc.dpr) || 1;
    setScale(T0 * dpr / Math.max(0.6, g.zoom || 1));
    const P = blankPose(); P.alpha = 0;
    const S = PV = { P, x: me.x, y: me.y, z: 0, a: 0, vx: 0, vy: 0, clip: 'summon', ct: 0, auto: opts.auto !== false, cyc: 0, parts: [], ended: false, mx: 0, my: 0, autoT: 0, zT: 2.6 };
    const ORDER = ['hover', 'fly', 'climb', 'descend', 'dive', 'fireball', 'flare', 'ultima', 'beam', 'settle', 'fly', 'dismiss'];
    const play = (n) => { S.clip = n; S.ct = 0; };
    S.play = play; S.td = turnDriver({ a: 0 });
    const ember = (x, y, z, vx, vy, vz, life, col, s) => { if (S.parts.length > (lowFx() ? 60 : 160)) return; S.parts.push({ x, y, z, vx, vy, vz, life, max: life, col, s }); };
    S.veh = { get active() { return !S.ended; }, noJumpBtn: false, drive: (mx, my) => { S.mx = mx; S.my = my; }, dodge: () => play('dive'), jump: () => play('climb'), strong: slot => play(slot === 'strong2' ? 'flare' : 'fireball'), ult: () => play('ultima'),
      drawBtns: (c, o2) => { const B = o2.B, lab = (b, s) => { if (!b) return; c.save(); c.globalAlpha = 0.9; c.fillStyle = 'rgba(60,10,6,.75)'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill(); c.strokeStyle = '#FF7A1A'; c.lineWidth = 2.5; c.stroke(); c.restore(); if (typeof GFX !== 'undefined') GFX.labelS(c, s, b.x, b.y + 3, 10, 900, '#FFE0B0', 'rgba(0,0,0,.7)', 3); };
        lab(B.s && B.s[0], 'FIREBALL'); lab(B.s && B.s[1], 'FLARE'); lab(B.d, 'DIVE'); lab(B.u, 'ULTIMA'); if (typeof GFX !== 'undefined') GFX.labelS(c, 'NIDHOGG PREVIEW: ' + S.clip, arc.W / 2, 96, 13, 900, '#FFD2A0', 'rgba(0,0,0,.75)', 3); },
      onSwitch: () => S.end() };
    X.vehicle(S.veh);
    const F = H.add({ key: 'nidhogg-preview', life: 1e9, entY: me.y,
      update(dt) { if (S.ended) return; S.ct += dt; S.autoT += dt; if (!(g.zoomT > 0)) g.zoomP += (0.74 - g.zoomP) * Math.min(1, dt * 2); bakeStep(S.clip === 'summon' ? 4 : 2);
        const C = CLIPS[S.clip] || CLIPS.hover, TD = S.td, hint = C.run(P, S.ct, dt, { turn: TD.spin ? TD.spin.dir * 0.8 : 1e-4, n: 3 }) || {};
        // the flight: the stick steers (free over walls, gaps and water: no ground navigation); clips hint at speed and height
        const mag = Math.min(1, hyp(S.mx, S.my)), top = 6;
        // the heading: snap-spins (see turnDriver); the travel follows the stick exactly
        const tev = TD.step(dt, mag > 0.15 ? S.mx : 0, mag > 0.15 ? S.my : 0, P); S.a = TD.a; if (tev.spinStart) { const sfx = X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); }
        const mvA = mag > 0.15 ? TD.want : S.a, spd = mag > 0.15 ? top * mag : (hint.speed || 0) * (S.auto ? 0.4 : 0); S.vx += (Math.cos(mvA) * spd - S.vx) * Math.min(1, dt * 2); S.vy += (Math.sin(mvA) * spd - S.vy) * Math.min(1, dt * 2);
        S.x += S.vx * dt; S.y += S.vy * dt;
        if (hint.dz != null) S.z = Math.max(0.15, S.z + hint.dz * dt); else S.z += (S.zT - S.z) * Math.min(1, dt * 1.5);
        if (S.clip !== 'summon' && S.clip !== 'dive') S.z += (S.zT - S.z) * Math.min(1, dt * 0.8);
        if (S.clip === 'fly' && mag > 0.15) { P.pitch += (0.06 - P.pitch) * dt * 2; }
        if (C.dur && S.ct >= C.dur) { if (S.clip === 'dismiss') { S.end(); return; } if (S.auto && mag < 0.15) { S.cyc = (S.cyc + 1) % ORDER.length; play(ORDER[S.cyc]); } else play(mag > 0.15 ? 'fly' : 'hover'); }
        me.x = S.x; me.y = S.y; me.vx = S.vx; me.vy = S.vy; me.z = 0; if (Math.abs(Math.cos(S.a)) > 0.25) me.face = Math.cos(S.a) > 0 ? 1 : -1;
        // light effects: embers from the seal, the dive's heat, the slam, the flare's burst, the beam
        const R = LAST && LAST.R; const Q2 = lowFx() ? 0.4 : 1;
        if (hint.seal && Math.random() < dt * 40 * Q2) { const an = Math.random() * TAU, r = Math.random() * 2.2; ember(S.x + Math.cos(an) * r, S.y + Math.sin(an) * r * 0.8, 0.05, 0, 0, 1 + Math.random() * 2, 1 + Math.random(), Math.random() < 0.5 ? FIRE : EMBER, 0.12); }
        if (hint.slam) { for (let i = 0; i < 40 * Q2; i++) { const an = Math.random() * TAU, v = 2 + Math.random() * 4; ember(S.x, S.y, 0.1, Math.cos(an) * v, Math.sin(an) * v * GY, 1 + Math.random() * 2, 0.6 + Math.random() * 0.5, Math.random() < 0.5 ? FIRE : EMBER, 0.16); } if (X.shake) X.shake(5, 0.2); if (X.ring) X.ring(S.x, S.y, 0.3, 3, 0.45, FIRE, 0.3); }
        if (hint.burst && Math.random() < dt * 30 * Q2) { const an = Math.random() * TAU, v = 3 + Math.random() * 3; ember(S.x, S.y, S.z + 0.3, Math.cos(an) * v, Math.sin(an) * v * GY, Math.random() * 2 - 1.5, 0.7, Math.random() < 0.5 ? FIRE : CORE, 0.14); }
        if ((hint.embers || P.heat > 0.5) && Math.random() < dt * 25 * Q2) ember(S.x + (Math.random() - 0.5) * 3, S.y + (Math.random() - 0.5) * 2, S.z + Math.random(), 0, 0, 1 + Math.random(), 0.9, Math.random() < 0.5 ? FIRE : EMBER, 0.11);
        if (hint.ringBreak && R && Math.random() < dt * 60 * Q2) { const rc = anchor('ring'), an = Math.random() * TAU; ember(rc.x + Math.cos(an) * 1.3, rc.y + Math.sin(an) * 1.0, rc.z, Math.cos(an) * 1.5, Math.sin(an) * 1.2, Math.random(), 0.8, RUNE, 0.12); }
        S.beam = !!hint.beam; if (hint.shake && X.shake && Math.random() < dt * 6) X.shake(1.5, 0.1);
        for (let i = S.parts.length - 1; i >= 0; i--) { const p = S.parts[i]; p.life -= dt; if (p.life <= 0) { S.parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); p.vz -= dt * 1.5; p.vx *= 0.97; p.vy *= 0.97; }
        F.entY = S.y + 0.5; },
      drawUnder(c) { const T = X.Tz(); drawShadow(c, S.x, S.y, S.z, S.a, P, { T, sx: H.sx, sy: H.sy, t: g.t });
        if ((CLIPS[S.clip] === CLIPS.summon && S.ct < 2.6) && TX) { const u = Math.min(1, S.ct / 0.5) * (1 - sstep(2.0, 2.6, S.ct)), X0 = H.sx(S.x), Y0 = H.sy(S.y), r = T * 2.4; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = u * 0.85; c.translate(X0, Y0); c.scale(1, GY); c.rotate(S.ct * 0.8);
          for (const [rr, w] of [[1, 3], [0.82, 1.6], [0.6, 2.2]]) { c.beginPath(); c.arc(0, 0, r * rr, 0, TAU); c.strokeStyle = '#FF6A2A'; c.lineWidth = w * T * 0.03; c.stroke(); }
          for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6); c.lineTo(Math.cos(a + 2.094) * r * 0.6, Math.sin(a + 2.094) * r * 0.6); c.strokeStyle = '#FFB060'; c.lineWidth = T * 0.03; c.stroke(); }
          c.globalAlpha = u * 0.5; blitSized(c, glowSprite(FIRE), -r, -r, r * 2, r * 2); c.restore(); } },
      drawEnt(c) { const T = X.Tz();
        drawSpin(c, S.x, S.y, S.z, P, { T, sx: H.sx, sy: H.sy, t: g.t, pet: (cc, PX, PY) => { if (P.alpha > 0.3 && !(S.clip === 'summon' && S.ct < 2.0)) X.drawPetAt(cc, PX, PY, { maxH: 1.0 }); } }, S.td);
        if (S.clip === 'summon' && S.ct < 2.3 && S.ct > 1.0) { const s3 = anchor('seat'), u = sstep(1.9, 2.25, S.ct), PX = lerp(H.sx(S.x) + T * 1.6, H.sx(s3.x), u), PY = lerp(H.sy(S.y) + T * 0.8, H.sy(s3.y) - s3.z * ZK * T, u) - Math.sin(u * Math.PI) * T; X.drawPetAt(c, PX, PY, { maxH: 1.0 }); } },
      draw(c) { const T = X.Tz(); c.save(); c.globalCompositeOperation = 'lighter';
        if (S.beam) { const m = anchor('mouth'), gx = H.sx(m.x), gy = H.sy(m.y) - m.z * ZK * T, ex = H.sx(m.x + Math.cos(S.a) * 0.6), ey = H.sy(m.y + Math.sin(S.a) * 0.6); for (const [w, col, al2] of [[0.9, FIRE, 0.5], [0.45, EMBER, 0.8], [0.18, CORE, 1]]) { c.globalAlpha = al2 * (0.85 + 0.15 * Math.sin(g.t * 50)); c.strokeStyle = col; c.lineWidth = T * w; c.lineCap = 'round'; c.beginPath(); c.moveTo(gx, gy); c.lineTo(ex, ey); c.stroke(); } const r = T * 1.6; c.globalAlpha = 0.8; blitSized(c, glowSprite(FIRE), ex - r, ey - r * GY, r * 2, r * 2 * GY); }
        for (const p of S.parts) { const a = p.life / p.max, X0 = H.sx(p.x), Y0 = H.sy(p.y) - p.z * ZK * T, r = T * p.s; c.globalAlpha = a; blitSized(c, glowSprite(p.col), X0 - r, Y0 - r, r * 2, r * 2); }
        c.restore(); },
      onEnd() { if (!S.ended) S.end(); } });
    me.petAlt = F;
    S.end = () => { if (S.ended) return; S.ended = true; g.zoomP = 1; try { X.vehicle(null); } catch (e) { /* (hook) */ } if (me.petAlt === F) me.petAlt = null; F.life = 0; if (PV === S) PV = null; };
    S.fx = F; return S;
  }

  /* ================= snap turns ================= */
  /* turnDriver(opts): the heading driver for the gameplay core (and the dev preview). The dragon never slews slowly: it
     holds a steady heading, and any change of direction past `thresh` (default 24 deg) is a quick eased snap-spin
     (0.12 s for a small change up to 0.2 s for a reversal), with a bank kick, the head leading, a wing-flap burst and the
     tail whipping through and settling with a little overshoot. With `quant` (default on) the held heading sits exactly
     on one of the 16 baked headings, so at rest the body is one clean bake (no crossfade) and the spine and spikes are
     crisp; travel can still follow the stick exactly (use `want`, not `a`, for movement). Without `quant`, changes
     under the threshold drift at most `drift` rad/s (default 0.35).
       const D = NIDHOGG_MODEL.turnDriver({ a: startHeading });
       each frame, after the clip has run:  const ev = D.step(dt, stickX, stickY, pose);   // ev.spinStart: play a whoosh
       draw with D.a; NIDHOGG_MODEL.drawSpin(c, x, y, z, pose, o, D) draws the blur ghosts, the dragon and the swooshes.
     D.spin is null at rest, else { from, span, dir, t, dur }; D.u is the spin's progress (0..1). */
  function turnDriver(opts) {
    opts = opts || {}; const STEP = TAU / NB, quant = opts.quant !== false, thresh = opts.thresh || 0.42, drift = opts.drift || 0.35, dead = opts.dead || 0.2;
    const snap = a => quant ? wrap(Math.round(a / STEP) * STEP) : wrap(a);
    const D = { a: snap(opts.a || 0), want: opts.a || 0, spin: null, u: 0, tail: 0, tailV: 0, blur: 0, last: null, spins: 0,
      start(to) { const span = wrap(to - D.a); if (Math.abs(span) < 1e-4) return false; D.spin = { from: D.a, span, dir: span > 0 ? 1 : -1, t: 0, dur: 0.12 + 0.08 * Math.min(1, Math.abs(span) / Math.PI), to: wrap(to) }; D.spins++; return true; },
      /* the heading to face right now (a stick reading or any target angle) */
      step(dt, mx, my, P) { const ev = { spinStart: false }, mag = hyp(mx || 0, my || 0);
        if (mag > dead) D.want = Math.atan2(my, mx);
        if (D.spin) { const S = D.spin; S.t += dt; D.u = Math.min(1, S.t / S.dur); const e = D.u < 0.5 ? 4 * D.u * D.u * D.u : 1 - Math.pow(-2 * D.u + 2, 3) / 2;   // (ease in-out, cubic)
          D.a = wrap(S.from + S.span * e);
          if (D.u >= 1) { D.a = S.to; D.tailV = -S.dir * Math.min(1.2, Math.abs(S.span)) * 7; D.last = S; D.spin = null; D.u = 0; D.blur = 0.12; }
          else if (mag > dead && Math.abs(wrap(D.want - S.to)) > thresh * 1.5 && D.u > 0.5) { if (D.start(snap(D.want))) ev.spinStart = true; } }   // (retarget a spin that is mostly done)
        else if (mag > dead) { const off = wrap(D.want - D.a);
          if (Math.abs(off) > thresh) { if (D.start(snap(D.want))) ev.spinStart = true; }
          else if (!quant) D.a = wrap(D.a + Math.max(-drift * dt, Math.min(drift * dt, off))); }
        D.blur = Math.max(0, D.blur - dt);
        if (P) { const S = D.spin, k = S ? Math.sin(Math.PI * D.u) * Math.min(1, Math.abs(S.span) / 0.7) : 0;
          // bank kick into the spin; the head leads it; a quick flap burst; the tail whips through, then settles on a spring
          P.bank = S ? S.dir * 0.75 * k : P.bank * Math.max(0, 1 - dt * 10);
          if (S) { P.headYaw = S.dir * 0.55 * k; P.flap += dt * 2.6 * k; P.flapAmp = Math.max(P.flapAmp, 0.85 * k); D.tail = -S.dir * 1.25 * Math.sin(Math.PI * Math.pow(D.u, 0.75)) * Math.min(1, Math.abs(S.span) / 0.7); D.tailV = 0; }
          else { D.tailV += (-140 * D.tail - 11 * D.tailV) * dt; D.tail += D.tailV * dt; }
          P.tailSwing = P.tailSwing * 0.35 + D.tail; }
        if (ev.spinStart) D.blur = 0;
        return ev; },
      /* the headings of the blur ghosts (oldest first) with their alpha; empty at rest */
      ghosts(n) { const S = D.spin || (D.blur > 0 ? D.last : null); if (!S) return []; const out = [], u0 = D.spin ? D.u : 1, fade = D.spin ? 1 : D.blur / 0.12;
        for (let i = n; i >= 1; i--) { const u = Math.max(0, u0 - i * 0.16 / Math.max(0.5, S.dur / 0.16)); const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; out.push({ a: wrap(S.from + S.span * e), al: 0.42 * (1 - (i - 1) / n) * fade }); }
        return out; } };
    return D;
  }
  /* drawSpin: the dragon with its motion blur. Ghost copies along the spin arc first (body only: no lights, ring, halo
     or rider; low detail), then the dragon itself, then soft swoosh arcs off the wingtips. At rest it is just draw(). */
  function drawSpin(c, x, y, z, P, o, D) {
    const low = o.low != null ? o.low : lowFx(), G = D.ghosts(low ? 1 : 3), a = D.a;
    if (G.length && P.alpha > 0.05) { const al0 = P.alpha, o2 = Object.assign({}, o, { ghost: true, low: true, pet: null });
      for (const g2 of G) { if (Math.abs(wrap(g2.a - a)) < 0.03 || g2.al < 0.02) continue; P.alpha = al0 * g2.al; draw(c, x, y, z, g2.a, P, o2); } P.alpha = al0; }
    draw(c, x, y, z, a, P, o);
    const S = D.spin || (D.blur > 0 ? D.last : null); if (!S || !LAST || !(P.alpha > 0.05)) return;
    // the swooshes: each wingtip's path over the arc swept so far, as a tapering additive streak
    const R = LAST.R, T = o.T, u1 = D.spin ? D.u : 1, fade = (D.spin ? Math.sin(Math.PI * Math.min(1, D.u * 1.3)) : D.blur / 0.12) * P.alpha;
    if (fade < 0.03) return; const e = u => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, N = low ? 6 : 12;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const Wg of R.wing) { const tip = Wg.fing[0], pts = [];
      for (let i = 0; i <= N; i++) { const u = Math.max(0, u1 - 0.55 + 0.55 * i / N), h = wrap(S.from + S.span * e(u)), Wf = frameW(h, P), w = Wf(tip), k = VIS * (o.scale || 1); pts.push([o.sx(x + w[0] * k), o.sy(y + w[1] * k) - (z + w[2] * k) * ZK * T]); }
      for (let i = 1; i <= N; i++) { const f = i / N; c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.strokeStyle = `rgba(255,${110 + 90 * f | 0},${70 + 80 * f | 0},${0.16 * f * fade})`; c.lineWidth = T * (0.14 + 0.3 * f); c.stroke(); c.strokeStyle = `rgba(255,${200 + 40 * f | 0},${170 + 60 * f | 0},${0.4 * f * fade})`; c.lineWidth = T * (0.03 + 0.07 * f); c.stroke(); } }
    c.restore();
  }

  /* ================= the interface ================= */
  /* create(opts): an instance with its own pose (opts.T and dpr set the bake scale) */
  function create(opts) { opts = opts || {}; if (opts.T) setScale(opts.T * (opts.dpr || 1)); const P = blankPose(); return { pose: P, draw: (c, x, y, z, a, P2, o) => draw(c, x, y, z, a, P2 || P, o), drawShadow: (c, x, y, z, a, P2, o) => drawShadow(c, x, y, z, a, P2 || P, o), anchor, warm: ms => bakeStep(ms) }; }
  /* idle-time preparation: the scale from a tile size (px) and the device's pixel ratio, then baking in idle slices */
  function warmIdle(T, dpr) { if (T > 0) setScale(T * (dpr || 1)); idleBake(); }
  return { create, warm: ms => bakeStep(ms), warmIdle, draw, drawShadow, turnDriver, drawSpin, anchor, blankPose, CH, CLIPS, relax, preview, rig, VIS,
    __dbg: { BK, setScale, bakeStep, readyB, usableB, want, bucketOf, groundA, PARTS, SEGS, get TX() { return TX; }, frameOf, shade } };
})();
