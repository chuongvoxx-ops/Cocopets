/* ---------- Rift 1, the Drowned Belfry: BOSS 3, ULDROTH THE DROWNED HERALD (v391 worker B5) ----------
   The finale, on the exposed bell platform: a 32 m stone disc (arena radius 16) standing in the alien sea, a bronze bell
   hung from two drowned limestone piers off its northern edge, three refuge islands round its rim (south, north-west,
   north-east) that a brass valve on the floor raises out of the platform, open sky under a low ceiling of purple cloud.
   The body is an ORIGINAL design from the spec's words: a 7 m amphibious sea beast, a pear-shaped torso on four wide
   flippers, a short neck, a flattened anglerfish head (a massive lower jaw full of needle teeth, tiny eyes set far apart,
   one hooked emissive lure), three ribbed gill fins behind the head like a broken crown, slate-green wet skin, a pale grey
   underside, the throat glowing turquoise through three slits. No weapon, no clothing. His idle slowly inflates the
   throat and stirs the water round him.
   Drawn live on the GPU with GLM (20k5uz, materials 110..116 between the BEL-ULDROTH-MAT markers) as Ifrit and the Bomb
   King are: meshes built once, rigid parts posed each frame, one composite image into the 2D frame (mkView / glPass);
   where WebGL is missing or software the EXISTING 2D Uldroth (the old DunBoss painter for 'uldroth') with the same
   mechanics (window.__ULD_GL = 1 forces the GPU on a software rasteriser: tests). The sea is a GPU plane too (material 116): the open sea round the platform, and the same plane laid over the
   platform when it floods; it drains away downward at his fall.
   I   THE HERALD (100-70%): Jaw of the Deep (a long frontal cone that tracks, then locks: a torrent; his head hangs low
       after it), Undertow (the throat swells and the water drags the pet toward him, weak at first and stronger by the
       second, then a point-blank burst: run outward early; he gasps after it, the throat open).
   II  THE DROWNING BELL (70-35%): the bell tolls, the sea rises over the platform. One valve lights and its island is
       announced five seconds ahead; the pet turns the lit valve (a short Resonance, stand by it), the island rises, the pet
       climbs it and shelters there while the flood crests. He keeps up Jaw and Undertow between floods.
   III THE BROKEN BELL (below 35%): he crawls to the north edge and breaks the bell's support; the bell falls into the sea
       and the waves come: alternating half-arena waves (marked, the wave rolling in from the open edge), and bell leeches
       cling to the next valve: kill them, turn it, and the raised island is a refuge from every wave.
   Always one valid refuge (the unmarked half, or the raised island) and a walkable route; telegraphs 2.6-3 s with a bold
   boundary, a countdown and a symbol (jaws, a whirlpool, a wave, a bell), read on the pale stone.
   His fall: he slumps, the light leaves his throat; the sea drains downward off the platform and away below its rim, the
   bell (in the sea or on its yoke) sounds once, warm sunlight breaks through the clouds; then the rift's sealing (20m4,
   the Tide Sigil: B1 wires it; BEL_ULDROTH.onFall is there for its onFall).
   BEL_ULDROTH = { MODEL, def, make (the stage's module: BEL.bossMake.beluldroth / FIEND_DEFS.beluldroth.stageMake), ARENA,
   TUNE, test }. */
const BEL_ULDROTH = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const ease = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;   // (the game camera, as Ifrit's: orthographic, about 46 degrees above the floor)
  const VIS = 1.4;   // (one rig unit is 1.4 tiles: he stands some 7 tiles tall to the tips of his fins)

  /* ================= vectors and rotations (a rotation: its three columns) ================= */
  const hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => hyp3(a[0], a[1], a[2]);
  const vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vlerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const M3 = (x, y, z) => ({ x, y, z }), I3 = () => M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const mirY = R => M3(R.x, vmul(R.y, -1), R.z);   // (a part built for the left side, shown on the right)
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };   // (+a: x toward -z, a forward bow)
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  function frameXZ(xd, zh) { const x = vnrm(xd); let y = vcross(zh, x); if (vlen(y) < 1e-6) y = vcross([0, 0, 1], x); if (vlen(y) < 1e-6) y = [0, 1, 0]; y = vnrm(y); return M3(x, y, vcross(x, y)); }
  function ik2(S, T, a, b, pole) {
    const d0 = vsub(T, S), L = vlen(d0) || 1e-6, d = Math.max(Math.abs(a - b) + 1e-3, Math.min(a + b - 1e-4, L)), e = vmul(d0, 1 / L);
    let p = vsub(pole, vmul(e, vdot(pole, e))); if (vlen(p) < 1e-6) p = Math.abs(e[2]) < 0.9 ? vcross(e, [0, 0, 1]) : vcross(e, [1, 0, 0]); p = vnrm(p);
    const ca = (a * a + d * d - b * b) / (2 * a * d), sa = Math.sqrt(Math.max(0, 1 - ca * ca));
    return { E: vadd(S, vadd(vmul(e, a * ca), vmul(p, a * sa))), W: vadd(S, vmul(e, d)) };
  }
  const hash3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
  function vnoise(x, y, z) { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const h = (a, b, c) => hash3(xi + a, yi + b, zi + c), l1 = (b, c) => lerp(h(0, b, c), h(1, b, c), u), l2 = c => lerp(l1(0, c), l1(1, c), v); return lerp(l2(0), l2(1), w); }
  const fbm = (x, y, z) => vnoise(x, y, z) * 0.6 + vnoise(x * 2.1 + 5.1, y * 2.1 + 1.3, z * 2.1 + 7.7) * 0.4;
  function mulb(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ================= materials (GLM ids: the BEL-ULDROTH-MAT block) ================= */
  const M_SKIN = 110, M_MOUTH = 110.2, M_STONE = 110.3, M_BELLY = 111, M_THROAT = 112, M_LURE = 113, M_EYE = 113.3, M_BONE = 114, M_BRONZE = 114.3, M_FIN = 115, M_SEA = 116;

  /* ================= the rig's measures (rig units; the model is drawn VIS times this) ================= */
  const NECK = [0.78, 0, 3.78], HS = 0.84;   // (HS: the head's scale)                                // body frame: the head's joint (the top of the short neck)
  const SHO = s => [0.82, s * 1.18, 1.42], HIPJ = s => [-0.66, s * 1.1, 0.74];
  const LU = 0.95, LF = 0.86, LT = 0.74, LS = 0.7;           // front flipper: upper arm, forearm; rear: thigh, shank
  const JAWH = [0.04, 0, -0.12], THR = [0.02, 0, -0.56], LURE0 = [0.82, 0, 0.5];   // head frame: the jaw's hinge, the throat sac, the lure's root
  const FIN_AT = { finC: [[-0.46, 0, 0.34], 0, -0.42], finL: [[-0.26, 0.6, 0.26], 0.6, -0.3], finR: [[-0.26, -0.6, 0.26], -0.6, -0.3] };   // [root, roll out, pitch back]

  /* ================= meshes ================= */
  // the pear: [v, z, r, x of the axis]; the torso is widest low, the axis leaning forward into the short neck
  const BODY = [[0, 0.3, 0.2, 0.0], [0.05, 0.38, 0.95, 0.05], [0.16, 0.78, 1.55, 0.1], [0.3, 1.32, 1.72, 0.12], [0.48, 2.05, 1.52, 0.16], [0.64, 2.7, 1.18, 0.26], [0.79, 3.25, 0.86, 0.42], [0.91, 3.6, 0.66, 0.58], [1, 3.82, 0.58, 0.7]];
  function bodyAt(v) { let i = 0; while (i < BODY.length - 2 && BODY[i + 1][0] < v) i++; const a = BODY[i], b = BODY[i + 1], u = ease((v - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; }
  function bodyPt(ph, v, lift) { const [z, r, xo] = bodyAt(v), c = Math.cos(ph), s = Math.sin(ph), k = 1 + (fbm(ph * 1.7 + 3, v * 4.5, 1.3) - 0.5) * 0.08 + (lift || 0);
    const rx = r * (c > 0 ? 1.08 : 0.97), ry = r * 1.03; return [xo + c * rx * k, s * ry * k, z - (c > 0 ? 0.06 * Math.sin(v * Math.PI) * c : 0)]; }
  function bodyNrm(ph, v) { const e = 0.01, a = bodyPt(ph + e, v), b = bodyPt(ph - e, v), c = bodyPt(ph, Math.min(1, v + e)), d = bodyPt(ph, Math.max(0, v - e)); let n = vcross(vsub(a, b), vsub(c, d)); const p = bodyPt(ph, v); if (vdot(n, vsub(p, [bodyAt(v)[2], 0, p[2]])) < 0) n = vmul(n, -1); return vnrm(n); }
  /* a paddle: a broad flipper, x along it from the wrist, y across; two skins meeting at a thin scalloped rim, ridged by
     the bones of four digits */
  function paddle(B, L, W, th, q) {
    const half = u => W * 0.5 * Math.sin(Math.PI * Math.pow(u, 0.72)) * (1 - 0.12 * u) + 0.13 * (1 - u) * (1 - u);
    const pos = (u, v, top) => { const s = v * 2 - 1, sc = 1 - 0.07 * Math.max(0, Math.sin(u * 3.6 * Math.PI)) * Math.abs(s), y = s * half(u) * sc, x = u * L - 0.12 * Math.abs(s) * u * u,
      cz = th * (1 - s * s) * (1 - 0.65 * u) + 0.015, dig = top ? 0.045 * Math.pow(Math.cos(s * 2.0 * Math.PI) * 0.5 + 0.5, 4) * (1 - u) : 0; return [x, y, (top ? 1 : -1) * (cz + dig) + 0.08 * u * u]; };
    B.surf((u, v) => pos(u, v, true), q(16), q(12), () => M_SKIN, { e: (u, v) => Math.abs(v * 2 - 1) > 0.9 || u > 0.96 ? 1 : 0 });
    B.surf((u, v) => pos(u, v, false), q(12), q(8), () => M_BELLY, { flip: true });
    return B; }
  /* a gill fin: a fan of rays rising from a root along y (width wd), a corrugated membrane between them (the shader reads
     the edge weight as nearness to a ray), its top edge ragged and broken where rays have snapped */
  function finMesh(B, H, wd, nR, sd, q) {
    const brk = u => { let k = 1; for (let i = 0; i < 2; i++) { const c = hash3(sd, i, 3), w = 0.08 + 0.05 * hash3(sd, i, 5); if (hash3(sd, i, 7) < 0.75) k = Math.min(k, 1 - 0.38 * sstep(w, 0, Math.abs(u - c))); } return k * (0.92 + 0.08 * fbm(u * 9 + sd, sd, 2)); };
    const top = u => H * (0.6 + 0.4 * Math.sin(Math.PI * (0.12 + 0.76 * u))) * brk(u);
    const P = (u, v) => { const h = top(u) * v, y = (u - 0.5) * wd * (1 + 0.55 * v), x = -0.34 * h - 0.18 * v * v + 0.05 * Math.sin(u * (nR - 1) * TAU) * v; return [x, y, h]; };
    B.surf(P, q(nR * 5), q(9), () => M_FIN, { e: u => { const k = Math.abs(((u * (nR - 1)) % 1) - 0.5) * 2; return sstep(0.68, 1, k); } });
    for (let k = 0; k < nR; k++) { const u = k / (nR - 1), b0 = P(u, 0), t0 = P(u, 1), snapped = brk(u) < 0.8, tip = snapped ? vlerp(b0, t0, 0.92) : vlerp(b0, t0, 1.05);
      B.tube(b0, tip, 0.036, snapped ? 0.024 : 0.01, M_BONE, { seg: q(6), cap0: 'flat', cap1: snapped ? 'flat' : 'round' }); }
    return B; }

  let MESH = null, MESH_MS = 0;
  function buildMeshes() {
    const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(3, Math.round(n * DQ));
    const fin = (name, B) => { out[name] = B.done(); };
    /* ---- the torso: the pear, the pale underside down its front, warts and a low ridge of knobs down the back ---- */
    { const B = nb();
      B.surf((u, v) => bodyPt(u * TAU, Math.max(0.004, v)), q(40), q(24), (u, v) => { const c = Math.cos(u * TAU), j = (fbm(u * 9, v * 6, 4) - 0.5) * 0.25; return (c + j > 0.22 && v < 0.93) || v < 0.07 ? M_BELLY : M_SKIN; });
      const R = mulb(17);
      for (let i = 0; i < 46; i++) { const ph = Math.PI + (R() - 0.5) * 4.2, v = 0.14 + R() * 0.8; if (Math.cos(ph) > 0.15) continue; const p = bodyPt(ph, v, 0.0), n = bodyNrm(ph, v), r = 0.05 + R() * R() * 0.12;
        B.ell(vadd(p, vmul(n, r * 0.25)), [r, r, r * 0.7], M_SKIN, { seg: q(7), rings: q(4) }); }
      for (let i = 0; i < 9; i++) { const v = 0.3 + i * 0.075, p = bodyPt(Math.PI, v, 0.0), n = bodyNrm(Math.PI, v), r = 0.1 + 0.08 * Math.sin(Math.PI * (i + 1) / 10); B.ell(vadd(p, vmul(n, r * 0.35)), [r * 1.2, r * 0.8, r * 0.75], M_SKIN, { seg: q(8), rings: q(5) }); }
      // skin folds round the base of the neck
      for (let k = 0; k < 3; k++) { const v = 0.8 + k * 0.055; B.surf((u, w) => { const ph = Math.PI * 0.35 + u * Math.PI * 1.3, p = bodyPt(ph, v + w * 0.02, 0.02 + 0.03 * Math.sin(w * Math.PI)); return p; }, q(18), 2, () => M_SKIN); }
      fin('body', B); }
    /* ---- the throat sac (head frame about its centre): pale skin, three vertical slits of turquoise light, dark lips ---- */
    { const B = nb(); B.ell([0, 0, 0], [0.56, 0.66, 0.6], M_BELLY, { seg: q(22), rings: q(14) });
      for (const k of [-1, 0, 1]) { const ph = k * 0.42, c = Math.cos(ph), s = Math.sin(ph), p = [0.56 * c * 0.98, 0.66 * s * 0.98, -0.02];
        B.push([c, s, 0], [-s, c, 0], [0, 0, 1], p); B.ell([0, 0, 0], [0.05, 0.12, 0.46], M_SKIN, { seg: q(10), rings: q(8) }); B.ell([0.02, 0, 0], [0.05, 0.072, 0.41], M_THROAT, { seg: q(10), rings: q(8) }); B.pop(); }
      fin('throat', B); }
    /* ---- the head (frame: the neck's joint; x forward): a flat wide skull, the snout's rim of down-turned teeth, brow
       knobs over two tiny eyes set far apart at the skull's edges ---- */
    { const B = nb();
      B.ell([0.58, 0, 0.16], [0.98, 1.1, 0.42], M_SKIN, { seg: q(26), rings: q(14), mf: (x, y, z) => z < -0.35 ? M_BELLY : M_SKIN });
      B.ell([1.26, 0, 0.04], [0.42, 0.98, 0.21], M_SKIN, { seg: q(22), rings: q(9), mf: (x, y, z) => z < -0.2 ? M_BELLY : M_SKIN });
      B.ell([1.16, 0, -0.06], [0.42, 0.9, 0.1], M_MOUTH, { seg: q(18), rings: q(5) });   // (the roof of the mouth)
      for (const s of [-1, 1]) { B.ell([0.86, s * 0.86, 0.36], [0.27, 0.22, 0.13], M_SKIN, { seg: q(10), rings: q(6) }); B.sph([0.93, s * 0.99, 0.36], 0.075, M_EYE, q(10)); }
      const R = mulb(23); for (let i = 0; i < 20; i++) { const x = 0.1 + R() * 1.1, y = (R() - 0.5) * 1.6, z = 0.16 + 0.42 * Math.sqrt(Math.max(0, 1 - ((x - 0.58) / 0.98) ** 2 - (y / 1.1) ** 2)) - 0.02, r = 0.04 + R() * 0.07; B.ell([x, y, z], [r, r, r * 0.6], M_SKIN, { seg: q(6), rings: q(3) }); }
      for (let i = 0; i < 11; i++) { const a = -1.15 + i / 10 * 2.3, x = 1.26 + Math.cos(a) * 0.4, y = Math.sin(a) * 0.95, ln = 0.12 + 0.1 * Math.cos(a * 1.2); B.spike([x, y, -0.06], [x + 0.02, y * 0.96, -0.06 - ln], 0.032, M_BONE, { seg: 5 }); }
      fin('head', B); }
    /* ---- the jaw (frame: its hinge): a massive scoop jutting past the snout (an underbite), the mouth's floor, a row of
       long needle fangs standing up and out from its rim ---- */
    { const B = nb(); B.ell([1.0, 0, 0.0], [1.06, 1.16, 0.44], M_SKIN, { seg: q(26), rings: q(10), th0: Math.PI / 2, th1: Math.PI, mf: (x, y, z) => z < -0.55 ? M_BELLY : M_SKIN }); B.ell([1.0, 0, -0.03], [1.0, 1.1, 0.05], M_MOUTH, { seg: q(22), rings: q(6) });
      B.tor([1.0, 0, 0.0], 1.0, 0.05, M_SKIN, { seg: q(30), rseg: 5 });
      for (let i = 0; i < 13; i++) { const a = -1.45 + i / 12 * 2.9, x = 1.0 + Math.cos(a) * 1.0, y = Math.sin(a) * 1.1, ln = 0.2 + 0.24 * Math.pow(Math.cos(a * 0.9), 2) + (i % 2 ? 0.08 : 0); B.spike([x, y, 0.02], [x + Math.cos(a) * 0.12, y * 1.1, 0.02 + ln], 0.045, M_BONE, { seg: 5 }); }
      fin('jaw', B); }
    /* ---- the lure (frame: its root on the brow): a stalk rising, curving forward and hooking down to an emissive bulb ---- */
    { const B = nb(), Pt = u => { const a = [0, 0, 0], b = [0.05, 0, 1.0], c = [0.85, 0, 1.45], d = [1.1, 0, 0.92], w = 1 - u; return [0, 1, 2].map(j => w * w * w * a[j] + 3 * w * w * u * b[j] + 3 * w * u * u * c[j] + u * u * u * d[j]); };
      const N = 8; for (let i = 0; i < N; i++) B.tube(Pt(i / N), Pt((i + 1) / N), 0.07 - 0.035 * i / N, 0.07 - 0.035 * (i + 1) / N, M_SKIN, { seg: q(7), cap0: 'round', cap1: 'round' });
      B.sph([1.12, 0, 0.8], 0.17, M_LURE, q(14)); B.ell([1.12, 0, 0.97], [0.06, 0.05, 0.05], M_SKIN, { seg: q(7), rings: q(4) });
      B.spike([1.1, 0, 0.66], [1.0, 0, 0.5], 0.035, M_BONE, { seg: 5 }); B.spike([1.0, 0, 0.5], [1.12, 0, 0.42], 0.022, M_BONE, { seg: 5 });
      fin('lure', B); }
    /* ---- the gill fins: the tall middle one and the side pair (one shape, mirrored for the right) ---- */
    { const B = nb(); finMesh(B, 1.65, 0.9, 6, 3, q); fin('finC', B); }
    { const B = nb(); finMesh(B, 1.2, 0.72, 5, 8, q); fin('finS', B); }
    /* ---- the flippers: upper and lower limb (thick tubes of hide), the paddles (front broad, rear smaller) ---- */
    { const B = nb(); B.tube([0, 0, 0], [LU, 0, 0], 0.5, 0.4, M_SKIN, { seg: q(14), cap0: 'round', cap1: 'round' }); fin('uarm', B); }
    { const B = nb(); B.tube([0, 0, 0], [LF, 0, 0], 0.4, 0.3, M_SKIN, { seg: q(12), cap0: 'round', cap1: 'round' }); fin('farm', B); }
    { const B = nb(); paddle(B, 2.0, 1.55, 0.13, q); fin('padF', B); }
    { const B = nb(); B.tube([0, 0, 0], [LT, 0, 0], 0.46, 0.36, M_SKIN, { seg: q(12), cap0: 'round', cap1: 'round' }); fin('thigh', B); }
    { const B = nb(); B.tube([0, 0, 0], [LS, 0, 0], 0.36, 0.28, M_SKIN, { seg: q(12), cap0: 'round', cap1: 'round' }); fin('shin', B); }
    { const B = nb(); paddle(B, 1.6, 1.25, 0.11, q); fin('padB', B); }
    /* ---- the arena's pieces: an island (a drum of limestone, its top at z 0, a stair down toward the platform's middle;
       y radii stretched by 1 / GY so its top matches the circle on the floor), a valve, the bell, its piers and its yoke,
       the sea ---- */
    { const B = nb(), ri = ISL_R / VIS, ry = ri / GY, pts = []; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + 0.11; pts.push([Math.cos(a) * ri * (0.97 + 0.05 * hash3(i, 1, 2)), Math.sin(a) * ry * (0.97 + 0.05 * hash3(i, 2, 1))]); }
      B.prism(pts, -2.6, 0, M_STONE, { b: 0.05 });
      B.push([1, 0, 0], [0, 1 / GY, 0], [0, 0, 1], [0, 0, 0]); B.tor([0, 0, -0.16], ri * 0.99, 0.045, M_BRONZE, { seg: q(32), rseg: 5 }); B.tor([0, 0, -0.9], ri * 1.0, 0.05, M_BRONZE, { seg: q(32), rseg: 5 }); B.pop();
      // the stair: four broad steps down toward the platform's middle (+x of the frame)
      for (let k = 0; k < 4; k++) { const x0 = ri + 0.1 + k * 0.34, h = 0.25 * (k + 1); B.box([x0, 0, -h - 0.6], [0.2, 0.55 / GY, 0.6], 0.03, M_STONE); }
      fin('island', B); }
    { const B = nb(); B.box([0, 0, 0.22], [0.16, 0.16, 0.22], 0.04, M_STONE); B.tube([0, 0, 0.42], [0, 0, 0.62], 0.05, 0.05, M_BRONZE, { seg: q(8), cap0: 'flat', cap1: 'flat' });
      B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0.74]); B.tor([0, 0, 0], 0.34, 0.05, M_BRONZE, { seg: q(24), rseg: 6 }); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI; B.tube([Math.cos(a) * -0.32, Math.sin(a) * -0.32, 0], [Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0], 0.03, 0.03, M_BRONZE, { seg: 5, cap0: false, cap1: false }); } B.sph([0, 0, 0], 0.07, M_BRONZE, q(8)); B.pop();
      fin('valve', B); }
    { const B = nb();   // the bell: mouth down at z -2.5, its crown at 0 (the hang point); bands at the lip, the waist and the shoulder
      B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, -2.5]);
      B.lathe([[0.0, 1.0], [0.0, 1.22], [0.08, 1.27], [0.2, 1.2, M_BRONZE], [0.32, 1.08], [0.6, 0.94], [1.0, 0.86], [1.4, 0.82], [1.8, 0.8], [2.1, 0.78], [2.28, 0.7], [2.42, 0.5], [2.5, 0.2], [2.52, 0.0]], M_BRONZE, { seg: q(32), edge: j => (j === 2 || j === 3 || j === 7 || j === 10) ? 0.95 : 0.1 });
      B.lathe([[0.02, 1.0], [0.5, 0.86], [1.4, 0.74], [2.3, 0.6], [2.42, 0.0]], M_MOUTH, { seg: q(24) });
      B.pop(); B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0.18]); B.tor([0, 0, 0], 0.24, 0.07, M_BRONZE, { seg: q(16), rseg: 6 }); B.pop();
      B.sph([0, 0, -2.25], 0.22, M_BRONZE, q(10)); B.tube([0, 0, -0.2], [0, 0, -2.2], 0.06, 0.06, M_BRONZE, { seg: q(6) });   // (the clapper)
      fin('bell', B); }
    { const B = nb(); B.box([0, 0, 0.7], [0.62, 0.62, 3.7], 0.06, M_STONE); B.box([0, 0, 4.5], [0.74, 0.74, 0.18], 0.05, M_STONE); fin('pier', B); }
    { const B = nb(); B.box([1.35, 0, 0], [1.38, 0.24, 0.26], 0.05, M_BRONZE); for (const x of [0.4, 1.4, 2.4]) B.box([x, 0, 0], [0.06, 0.28, 0.3], 0.02, M_BRONZE); fin('yoke', B); }   // (half the yoke: x from the middle out)
    { const B = nb(), RS = SEA_R / SEA_U; B.surf((u, v) => { const r = RS * Math.max(0.003, v); return [Math.cos(u * TAU) * r, Math.sin(u * TAU) * r / GY, 0]; }, 64, 10, () => M_SEA, { a: (u, v) => 1 - sstep(0.78, 1, v) }); fin('sea', B); }
    return out;
  }

  /* ================= the pose =================
     channels (0..1 unless said): inflate (the throat sac swells, its light rises), jaw (the jaw drops), lunge (the neck
     thrown forward and down: the Jaw of the Deep), rear (the body tipped back on the rear flippers, head up: a roar, the
     bell's call), lift (the front flippers raised), slam (driven down), look (rad, the head's yaw), nod (rad), tilt, aim
     (rad, the body turned ahead of its heading), gait (phase) and gaitK (a crawl), sway, recoil (and recoilS), finFlare,
     lure (its light), glow (the throat's light), sink (rig units: down into the sea, the entrance), dead, sun, alpha */
  const CH = ['inflate', 'jaw', 'lunge', 'rear', 'lift', 'slam', 'look', 'nod', 'tilt', 'aim', 'gaitK', 'sway', 'recoil', 'finFlare', 'lure', 'glow', 'sink', 'dead', 'sun', 'lean'];
  function blankPose() { const P = { alpha: 1, gait: 0, recoilS: 1 }; for (const k of CH) P[k] = 0; P.glow = 0.55; P.lure = 0.7; return P; }
  function rig(P, t) {
    const inst = [], A = {}, dead = cl(P.dead || 0), live = 1 - dead, sun = cl(P.sun || 0);
    const I = (name, part, R, o, ex) => { const it = { name, part, R, o, s: 1, al: 1, glow: 0, glow2: 0, spill: sun, kind: 0, fx: dead }; if (ex) Object.assign(it, ex); inst.push(it); return it; };
    const br = Math.sin(t * 1.35) * live, inf = cl(P.inflate || 0), rear = P.rear || 0, lunge = P.lunge || 0, gk = P.gaitK || 0, gph = (P.gait || 0) * TAU, sw = P.sway || 0, lift = P.lift || 0, slam = P.slam || 0, rc = (P.recoil || 0) * (P.recoilS || 1);
    const thr = Math.max(0, P.glow == null ? 0.55 : P.glow) * (0.75 + 0.6 * inf) * live, lureG = Math.max(0, P.lure == null ? 0.7 : P.lure) * live;
    /* the body: tipped about the rear hips when it rears; a crawl's surge and roll */
    const pivot = [-0.65, 0, 0.45];
    const pitch = (P.lean || 0) - 0.48 * rear + 0.16 * lunge + 0.2 * slam - 0.14 * lift + 0.025 * br + 0.3 * dead + 0.05 * Math.sin(gph * 2) * gk;
    const roll = 0.06 * Math.sin(gph) * gk + 0.05 * sw + 0.08 * rc + 0.08 * dead;
    const yaw = (P.aim || 0) + 0.07 * Math.sin(gph) * gk - 0.12 * rc;
    const Rt = mm(rotZ(yaw), mm(rotX(roll), rotY(pitch))), Ry = rotZ(yaw);
    const P0 = vadd(vsub(pivot, mv(Rt, pivot)), [0.15 * lunge + 0.06 * Math.sin(gph * 2) * gk, 0.1 * sw, -(P.sink || 0) - 0.3 * dead - 0.1 * slam + 0.06 * lift]);
    const bs = 1 + 0.012 * br + 0.025 * inf, toB = p => vadd(P0, mv(Rt, vmul(p, bs)));
    I('body', 'body', Rt, P0, { s: bs, glow: thr });
    A.chest = toB([1.1, 0, 1.55]); A.belly = toB([0.6, 0, 0.9]); A.back = toB([-0.5, 0, 2.3]);
    /* the head on its short neck: thrown forward and down by the lunge, up by the rear */
    const look = P.look || 0, nod = (P.nod || 0) - pitch * 0.6 - 0.42 * rear + 0.55 * lunge + 0.04 * Math.sin(t * 0.7) * live + 0.42 * dead;
    const N = toB(vadd(NECK, [0.6 * lunge, 0, -0.8 * lunge + 0.03 * br - 0.25 * dead]));
    const Rh = mm(Rt, mm(rotZ(look), mm(rotX(P.tilt || 0), rotY(nod))));
    const hv = p => vadd(N, mv(Rh, vmul(p, HS)));
    I('head', 'head', Rh, N, { glow: thr, s: HS });
    const jaw = cl((P.jaw || 0) + 0.06 * Math.max(0, br)), Rj = mm(Rh, rotY(jaw * 0.78)), Jo = hv(JAWH);
    I('jaw', 'jaw', Rj, Jo, { glow: thr * (1 + 0.6 * jaw), s: HS });
    const ts = (1 + 0.42 * inf + 0.02 * br) * HS, To = hv(vadd(THR, [0.06 * inf, 0, -0.12 * inf]));
    I('throat', 'throat', mm(Rh, rotY(0.25)), To, { s: ts, glow: thr * (1 + 0.8 * inf) });
    const Rl = mm(Rh, mm(rotX(0.1 * Math.sin(t * 1.7) * live), rotY(-0.08 + 0.08 * Math.sin(t * 1.25) * live - 0.25 * rear + 0.35 * dead))), Lo = hv(LURE0);
    I('lure', 'lure', Rl, Lo, { glow: lureG, glow2: cl((P.lure || 0) - 0.9), s: HS });
    for (const name of ['finC', 'finL', 'finR']) { const [root, roll0, pit0] = FIN_AT[name], fl = P.finFlare || 0, side = Math.sign(roll0), i = name === 'finC' ? 0 : side > 0 ? 1 : 2;
      const Rf = mm(Rh, mm(rotX(roll0 * (1 + 0.5 * fl) + 0.05 * Math.sin(t * 2.1 + i) * live - side * 0.4 * dead), rotY(pit0 - 0.25 * fl + 0.04 * Math.sin(t * 1.7 + i * 2) * live + 0.5 * dead)));
      I(name, name === 'finC' ? 'finC' : 'finS', name === 'finR' ? mirY(Rf) : Rf, hv(root), { glow: thr, s: (1 + 0.08 * fl) * HS });
      A[name] = hv(vadd(root, [-0.4, 0, 1.4])); }
    A.head = hv([0.65, 0, 0.18]); A.mouth = vadd(Jo, mv(Rj, vmul([1.9, 0, 0.1], HS))); A.throat = To; A.lure = vadd(Lo, mv(Rl, vmul([1.12, 0, 0.8], HS))); A.neck = N;
    for (const s of [-1, 1]) A[s < 0 ? 'eyeR' : 'eyeL'] = hv([0.95, s * 0.99, 0.36]);
    /* the flippers: the front paddles planted forward and out, the rear ones back and out; a crawl lifts them in turn */
    for (const s of [-1, 1]) { const sn = s > 0 ? 'L' : 'R', ph = gph + (s > 0 ? 0 : Math.PI), S = toB(SHO(s));
      const base = [P0[0], P0[1], 0];
      let W = vadd(base, mv(Ry, [1.35 + 0.32 * Math.sin(ph) * gk, s * 1.85, 0.14 + 0.3 * Math.max(0, Math.cos(ph)) * gk]));
      W = vlerp(W, toB([1.6, s * 1.7, 2.5]), lift);
      W = vlerp(W, vadd(base, mv(Ry, [2.2, s * 1.5, 0.12])), slam);
      W = vlerp(W, toB([1.2, s * 2.25, 1.55]), rear * 0.75 * (1 - lift));
      W = vlerp(W, vadd(base, mv(Ry, [1.3, s * 2.7, 0.08])), dead);
      const J = ik2(S, W, LU, LF, mv(Rt, [-0.5, s * 1.0, 0.25]));
      I('uarm' + sn, 'uarm', frameXZ(vsub(J.E, S), [0, 0, 1]), S, { glow: thr });
      I('farm' + sn, 'farm', frameXZ(vsub(J.W, J.E), [0, 0, 1]), J.E, { glow: thr });
      const pd = vnrm(mv(Ry, [0.6, s * 0.8, 0])), Fp = mm(frameXZ(pd, [0, 0, 1]), rotY(-0.7 * lift * (1 - slam) - 0.35 * rear * (1 - lift) + 0.05 * slam));
      I('padF' + sn, 'padF', s < 0 ? mirY(Fp) : Fp, vsub(J.W, mv(Fp, [0.12, 0, 0])), { glow: thr });
      A['padF' + sn] = vadd(J.W, mv(Fp, [0.9, 0, 0])); A['sh' + sn] = S;
      const H = toB(HIPJ(s)), rph = ph + Math.PI;
      let K = vadd(base, mv(Ry, [-1.3 + 0.22 * Math.sin(rph) * gk, s * 1.7, 0.14 + 0.24 * Math.max(0, Math.cos(rph)) * gk]));
      K = vlerp(K, vadd(base, mv(Ry, [-1.55, s * 2.2, 0.1])), rear * 0.6 + dead * 0.4);
      const J2 = ik2(H, K, LT, LS, mv(Rt, [-0.2, s * 1.0, 0.7]));
      I('thigh' + sn, 'thigh', frameXZ(vsub(J2.E, H), [0, 0, 1]), H, { glow: thr });
      I('shin' + sn, 'shin', frameXZ(vsub(J2.W, J2.E), [0, 0, 1]), J2.E, { glow: thr });
      const rd = vnrm(mv(Ry, [-0.75, s * 0.66, 0])), Fr = frameXZ(rd, [0, 0, 1]);
      I('padB' + sn, 'padB', s < 0 ? mirY(Fr) : Fr, vsub(J2.W, mv(Fr, [0.1, 0, 0])), { glow: thr }); }
    A.top = hv([-0.7, 0, 1.9]);
    return { inst, A, P0, Rt, Rh, thr };
  }

  /* ================= drawing ================= */
  const CW = [0, VY, VZ], EXW = [1, 0, 0];
  const LW = vnrm([-0.45, 0.42, 0.78]), SBW = vnrm([-0.2, -0.38, 0.9]), RIMW = vnrm([0.4, -0.8, 0.45]), UPW = [0, 0, 1];
  /* the view of one draw: the model's frame -> the world (heading a, in the model's own angle) -> the screen */
  function mkView(x, y, z, a, o) {
    const T = o.T, sc = (o.scale || 1) * VIS, k = T * sc, Rh = rotZ(a), X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T;
    const toS = p => { const w = mv(Rh, p); return [X0 + w[0] * k, Y0 + (w[1] * GY - w[2] * ZK) * k]; };
    const toW = p => { const w = mv(Rh, p); return { x: x + w[0] * sc, y: y + w[1] * GY * sc, z: z + w[2] * sc }; };
    const depth = p => vdot(mv(Rh, p), CW);
    return { T, sc, k, Rh, toS, toW, depth, x, y, z, a };
  }
  const headOf = th => Math.atan2(Math.sin(th) / GY, Math.cos(th));
  const floorAng = a => Math.atan2(Math.sin(a) * GY, Math.cos(a));
  function toBody(wx, wy, x, y, a, sc) { sc = (sc || 1) * VIS; const dx = (wx - x) / sc, dy = (wy - y) / (GY * sc), c = Math.cos(a), s = Math.sin(a); return [dx * c + dy * s, -dx * s + dy * c]; }
  const PARTB = {};
  function bounds(name) { let b = PARTB[name]; if (b) return b; const M = MESH && MESH[name]; if (!M) return [[0, 0, 0], 1.5]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
    for (let i = 0; i < p.length; i += 3) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); }
    const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], r = hyp3(x1 - x0, y1 - y0, z1 - z0) / 2; return (PARTB[name] = [c, r]); }
  let NOGL = false, GLFAIL = 0, GLRETRY = 0, GLLAST = 0, GLMS = 0, GLN = 0, GLBOX = null; const GLI = [], GLJ = [], OCC = new Float32Array(48);
  const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
  const forced = () => typeof window !== 'undefined' && window.__ULD_GL === 1;
  const glOn = () => { if (NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || (typeof window !== 'undefined' && window.__ULD_GL === 0) || !GLM.ok()) return false; if (GLM.soft && !forced()) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Uldroth: meshes', e); return false; } } return true; };
  const GLCAP = 1700, RIMC = [0.55, 1.15, 1.1], AMBC = [1, 1, 1], OUTC = [0.012, 0.03, 0.04];
  /* one GPU pass: the parts in list (each { part, R, o, s, al, glow, glow2, spill, kind, fx, wear }) drawn into the box round them */
  function glPass(c, V, list, al0, o) {
    const k = V.k, X0 = V.toS([0, 0, 0]), PX = EXW, PY = [0, GY, -ZK], PD = CW;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { const [bc, br] = bounds(it.part), rr = br * it.s * 1.05 * k, w = mv(V.Rh, vadd(it.o, mv(it.R, vmul(bc, it.s)))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (o.view) { bx0 = Math.max(bx0, o.view[0]); by0 = Math.max(by0, o.view[1]); bx1 = Math.min(bx1, o.view[2]); by1 = Math.min(by1, o.view[3]); }
    if (!(bx1 > bx0) || !(by1 > by0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !(typeof window !== 'undefined' && window.__ULD_GLHQ), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.45 : 1) * (o.res || 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t: o.t || 0,
      outline: o.outline === 0 ? 0 : Math.max(1, 1.2 * (W / bw)), outlineCol: OUTC, clip: o.clip || null };
    if (o.occ && o.occ.length) { let n2 = 0; for (const [p, r] of o.occ) { if (n2 >= 12) break; const w = mv(V.Rh, p); OCC[n2 * 4] = w[0]; OCC[n2 * 4 + 1] = w[1]; OCC[n2 * 4 + 2] = w[2]; OCC[n2 * 4 + 3] = r; n2++; } S.occ = OCC; S.nocc = n2; }
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = MESH[it.part]; if (!mesh) continue; const al = al0 * (it.al == null ? 1 : it.al); if (!(al > 0.004)) continue; const Rw = mm(V.Rh, it.R), s2 = it.s || 1, Tt = mv(V.Rh, it.o);
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2; g.R1[i] = Rw.y[i] * s2; g.R2[i] = Rw.z[i] * s2; g.T[i] = Tt[i]; }
      g.alpha = al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = it.wear == null ? 1 : it.wear; g.fx = it.fx || 0; g.outline = it.outline; g.d = vdot(Tt, PD); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    if (o.into) { o.into(cvs, W, H, bx0, by0, bw, bh); } else c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh);
    GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++; GLBOX = [W, H]; return true;
  }
  /* ---- the last resort (no WebGL and no old 2D painter loaded): the rig as shaded capsules; the game draws the existing
     2D Uldroth instead (old2D, below) ---- */
  const C_SKIN = '#2E4740', C_SKIN2 = '#253A35', C_BELLY = '#9AA19C', C_THROAT = '#61D9D2', C_BONE = '#D8D2BC', C_FIN = '#355650';
  const FBC = {
    body: [[[0.12, 0, 0.75], [0.3, 0, 1.6], 1.55, C_SKIN], [[0.3, 0, 1.6], [0.65, 0, 3.0], 1.0, C_SKIN], [[0.5, 0, 0.75], [0.6, 0, 1.6], 1.25, C_BELLY]],
    throat: [[[0, 0, 0.05], [0, 0, -0.05], 0.62, C_BELLY], [[0.5, 0, 0.3], [0.5, 0, -0.3], 0.07, C_THROAT], [[0.47, 0.27, 0.3], [0.47, 0.27, -0.3], 0.06, C_THROAT], [[0.47, -0.27, 0.3], [0.47, -0.27, -0.3], 0.06, C_THROAT]],
    head: [[[0.1, -0.55, 0.16], [0.1, 0.55, 0.16], 0.45, C_SKIN], [[0.7, -0.6, 0.15], [0.7, 0.6, 0.15], 0.42, C_SKIN], [[1.3, -0.5, 0.04], [1.3, 0.5, 0.04], 0.22, C_SKIN2]],
    jaw: [[[0.4, -0.6, -0.1], [0.4, 0.6, -0.1], 0.36, C_SKIN2], [[1.3, -0.65, -0.1], [1.3, 0.65, -0.1], 0.36, C_SKIN2], [[1.8, -0.3, 0.05], [1.8, 0.3, 0.05], 0.18, C_BONE]],
    lure: [[[0, 0, 0], [0.05, 0, 1.0], 0.06, C_SKIN], [[0.05, 0, 1.0], [0.85, 0, 1.4], 0.05, C_SKIN], [[0.85, 0, 1.4], [1.1, 0, 0.95], 0.04, C_SKIN], [[1.12, 0, 0.8], [1.12, 0, 0.81], 0.17, C_THROAT]],
    finC: [[[-0.05, 0, 0.1], [-0.55, 0, 1.4], 0.32, C_FIN]], finS: [[[-0.05, 0, 0.1], [-0.42, 0, 1.0], 0.26, C_FIN]],
    uarm: [[[0, 0, 0], [LU, 0, 0], 0.42, C_SKIN]], farm: [[[0, 0, 0], [LF, 0, 0], 0.32, C_SKIN]], padF: [[[0.2, 0, 0.02], [1.3, 0, 0.06], 0.45, C_SKIN2]],
    thigh: [[[0, 0, 0], [LT, 0, 0], 0.38, C_SKIN]], shin: [[[0, 0, 0], [LS, 0, 0], 0.3, C_SKIN]], padB: [[[0.2, 0, 0.02], [1.05, 0, 0.05], 0.38, C_SKIN2]],
  };
  const FB = [];
  function drawFallback(c, V, list, al0, clipZ) {
    FB.length = 0; const k = V.k;
    for (const it of list) { const caps = FBC[it.part]; if (!caps || !((it.al == null ? 1 : it.al) > 0.01)) continue; const s2 = it.s || 1;
      for (const [a, b, r, col] of caps) { let A2 = vadd(it.o, mv(it.R, vmul(a, s2))), B2 = vadd(it.o, mv(it.R, vmul(b, s2))); if (clipZ != null && Math.max(A2[2], B2[2]) + r * s2 < clipZ) continue;
        FB.push({ d: (V.depth(A2) + V.depth(B2)) / 2, A: V.toS(A2), B: V.toS(B2), w: r * s2 * 2 * k, col, al: it.al == null ? 1 : it.al, glow: it.glow, dead: it.fx || 0 }); } }
    FB.sort((p, q) => p.d - q.d); c.save(); c.lineCap = 'round';
    for (const f of FB) { c.globalAlpha = al0 * f.al; const glowy = f.col === C_THROAT;
      if (!glowy) { c.strokeStyle = '#08100F'; c.lineWidth = f.w + 2.5; c.beginPath(); c.moveTo(f.A[0], f.A[1]); c.lineTo(f.B[0] + 0.01, f.B[1]); c.stroke(); }
      c.strokeStyle = glowy ? (f.dead > 0.5 ? '#2A3836' : f.col) : f.col; c.lineWidth = f.w; c.beginPath(); c.moveTo(f.A[0], f.A[1]); c.lineTo(f.B[0] + 0.01, f.B[1]); c.stroke();
      if (glowy && f.dead < 0.5) gl2(c, (f.A[0] + f.B[0]) / 2, (f.A[1] + f.B[1]) / 2, f.w * 1.6, '#61D9D2', 0.35 * Math.min(1.5, f.glow || 0.5));
      if (!glowy) { c.strokeStyle = 'rgba(200,255,240,.14)'; c.lineWidth = Math.max(1, f.w * 0.26); c.beginPath(); c.moveTo(f.A[0], f.A[1] - f.w * 0.24); c.lineTo(f.B[0] + 0.01, f.B[1] - f.w * 0.24); c.stroke(); } }
    c.restore();
  }
  /* the soft ground shadow: blobs under the parts, painted small and laid down at once */
  let SHC = null, BLOB = null;
  function drawShadow(c, V, list, al) {
    if (!BLOB) { BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const g = BLOB.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.45, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const proj = [];
    for (const it of list) { if (it.part === 'lure' || it.part.startsWith('fin')) continue; const [bc, br] = bounds(it.part), p = vadd(it.o, mv(it.R, vmul(bc, it.s || 1))), g = V.toS([p[0], p[1], 0]), h = Math.max(0, p[2]), rr = br * 0.55 * V.k * (1 + h * 0.08), w = (it.al == null ? 1 : it.al) / (1 + h * 0.18);
      x0 = Math.min(x0, g[0] - rr); x1 = Math.max(x1, g[0] + rr + h * 0.2 * V.k); y0 = Math.min(y0, g[1] - rr); y1 = Math.max(y1, g[1] + rr); proj.push([g[0] + h * 0.14 * V.k, g[1] + h * 0.04 * V.k, rr, w]); }
    if (!proj.length) return;
    const sc = 0.25, W = Math.max(8, Math.ceil((x1 - x0) * sc) + 4), H = Math.max(8, Math.ceil((y1 - y0) * sc) + 4);
    if (!SHC || SHC.width < W || SHC.height < H) { SHC = document.createElement('canvas'); SHC.width = Math.max(W, SHC ? SHC.width : 0); SHC.height = Math.max(H, SHC ? SHC.height : 0); }
    const g = SHC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, SHC.width, SHC.height);
    for (const [px, py, rr, w] of proj) { const r2 = rr * sc; g.globalAlpha = Math.min(1, 0.42 * w); g.drawImage(BLOB, (px - x0) * sc + 2 - r2, (py - y0) * sc + 2 - r2 * GY, r2 * 2, r2 * 2 * GY); }
    c.save(); c.globalAlpha = al * 0.55; c.imageSmoothingEnabled = true; c.drawImage(SHC, 0, 0, W, H, x0 - 2 / sc, y0 - 2 / sc, W / sc, H / sc); c.restore();
  }
  function occOf(R) { const A = R.A, o = [[vadd(R.P0, mv(R.Rt, [0.15, 0, 0.95])), 1.35], [vadd(R.P0, mv(R.Rt, [0.35, 0, 2.15])), 1.0], [A.head, 0.75], [A.throat, 0.5]];
    for (const sn of ['L', 'R']) { o.push([A['padF' + sn], 0.45]); o.push([A['sh' + sn], 0.42]); } return o; }
  /* draw(c, x, y, a, P, o): the model at world (x, y), heading a (the model's own angle), pose P; o = { T, sx, sy, t, scale,
     low, shadow, noGL, clipZ (tiles: nothing under the water's surface, a bright waterline above it) }. Returns the rig */
  let LAST = null;
  function draw(c, x, y, a, P, o) {
    o = o || {}; const t = o.t != null ? o.t : nowMs() / 1000, R = rig(P, t), V = mkView(x, y, 0, a, o), al0 = P.alpha == null ? 1 : P.alpha; LAST = { R, V };
    if (!(al0 > 0.01)) return R;
    const list = R.inst, clip = o.clipZ != null && o.clipZ > -5 ? [o.clipZ / (VIS * (o.scale || 1)), 0.035] : null;
    if (o.shadow !== false && !(o.clipZ > 0.25)) drawShadow(c, V, list, al0);
    if (!o.noGL && glOn()) { let ok = false; try { ok = glPass(c, V, list, al0, { t, low: o.low, occ: o.low ? null : occOf(R), clip }); } catch (e) { glFail(); if (typeof console !== 'undefined') console.warn('Uldroth: draw', e); ok = false; } if (ok) return R; }
    drawFallback(c, V, list, al0, clip ? clip[0] : null); return R;
  }
  /* a still piece (an island, a valve) rendered once at a size into a picture and laid down after; its key names the
     state that changes it. Returns false when it drew nothing (the caller paints its 2D picture) */
  const PROPC = new Map();
  function drawProp(c, part, x, y, a, o) {
    o = o || {}; if (!glOn()) return false; const T = o.T, m0 = c.getTransform ? c.getTransform() : null, dev = m0 ? Math.max(0.25, Math.hypot(m0.a, m0.b)) : 1, key = `${part}|${o.key || ''}|${Math.round(T * dev * 4)}|${o.scale || 1}|${(+a || 0).toFixed(2)}|${o.z || 0}`;
    let Pc = PROPC.get(key);
    if (!Pc) { const it = { part, R: I3(), o: [0, 0, 0], s: 1, al: 1, glow: o.glow || 0, glow2: o.glow2 || 0, spill: o.spill || 0, kind: o.kind || 0, fx: o.fx || 0, wear: o.wear };
      const V0 = mkView(0, 0, o.z || 0, a, { T, sx: v => v, sy: v => v, scale: o.scale });
      let pic = null; try { glPass(c, V0, [it], 1, { t: 0, low: o.low, outline: 1, clip: o.clip, into: (cvs, W, H, bx0, by0, bw, bh) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(cvs, 0, 0); pic = { cv, bx0, by0, bw, bh }; } }); } catch (e) { glFail(); }
      if (!pic) return false;
      Pc = pic; if (PROPC.size > 60) PROPC.clear(); PROPC.set(key, Pc); }
    c.drawImage(Pc.cv, 0, 0, Pc.cv.width, Pc.cv.height, o.sx(x) + Pc.bx0, o.sy(y) + Pc.by0, Pc.bw, Pc.bh); return true;
  }
  /* live pieces drawn in one pass of their own (the bell on its yoke, the sea) */
  function drawLive(c, list, x, y, z, a, o) { if (!glOn()) return false; const V = mkView(x, y, z, a, o); try { return glPass(c, V, list, 1, o); } catch (e) { glFail(); return false; } }
  function anchor(name) { if (!LAST) return null; const p = LAST.R.A[name]; return p ? LAST.V.toW(p) : null; }
  function anchorAt(name, x, y, a, P, sc, t) { const R = rig(P, t || 0), p = R.A[name]; if (!p) return null; const w = mv(rotZ(a), p), s2 = (sc || 1) * VIS; return { x: x + w[0] * s2, y: y + w[1] * GY * s2, z: w[2] * s2 }; }
  const MODEL = { draw, drawProp, drawLive, rig, anchor, anchorAt, blankPose, CH, headOf, floorAng, toBody, VIS, VIEW: { GY, ZK }, glOn,
    warm() { return glOn(); },
    __dbg: { get gl() { return glOn(); }, set noGL(v) { NOGL = !!v; }, get MESH() { return MESH; }, get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +GLMS.toFixed(2), frames: GLN, box: GLBOX, meshMs: +MESH_MS.toFixed(1), meshTris: MESH ? Object.values(MESH).reduce((a2, m) => a2 + (m ? m.ntri : 0), 0) : 0 }); } } };

  /* ================= the arena (world tiles; C = the platform's middle) ================= */
  const AR = 16, ISL_R = 2.25, ISL_D = 12.4, VALVE_D = 8.7, ISL_UP = 1.55, SEA_R = 26, SEA_U = 4;
  const ISL_A = [Math.PI / 2, Math.PI / 2 + TAU / 3, Math.PI / 2 + 2 * TAU / 3];   // (south, north-west, north-east)
  const URN_A = [0.35, Math.PI - 0.35, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62];
  const ARENA = { R: AR, ISL_R, ISL_UP,
    islands: C => ISL_A.map((a, i) => ({ i, a, x: C.x + Math.cos(a) * ISL_D, y: C.y + Math.sin(a) * ISL_D })),
    valves: C => ISL_A.map((a, i) => ({ i, x: C.x + Math.cos(a) * VALVE_D + Math.cos(a + Math.PI / 2) * 1.6, y: C.y + Math.sin(a) * VALVE_D + Math.sin(a + Math.PI / 2) * 1.6 })),
    bell: C => ({ x: C.x, y: C.y - AR - 2.4 }),
    urns: C => URN_A.map((a, i) => ({ i, x: C.x + Math.cos(a) * (AR - 1.6), y: C.y + Math.sin(a) * (AR - 1.6) })),
    start: C => ({ x: C.x + 0.5, y: C.y + AR - 3.4 }),
    lair: C => ({ x: C.x, y: C.y - 5.5 }),
    sea: C => ({ x: C.x + Math.cos(-Math.PI / 2 - 0.62) * (AR + 2.2), y: C.y + Math.sin(-Math.PI / 2 - 0.62) * (AR + 2.2) }) };
  let STAGE = null;
  const modOf = FX => (STAGE && FX && STAGE.g === FX.g ? STAGE.mod : null);

  /* ================= the fight ================= */
  const TQ = '#61D9D2', TQ_HI = '#C9FFF8', WARN = '#FF4D6D', SAFE = '#8FE0A6', GOLD = '#FFE37A', FOAM = '#E2F7F2', DEEP = '#123C52';
  const CYC = { 1: ['jaw', 'undertow'], 2: ['jaw', 'undertow', 'jaw'], 3: ['wave', 'jaw', 'wave', 'undertow'] };
  const TUNE = { hp: 28000 * 2, dmg: 21, bars: 9,   /* (hp: measured with level-10 bots (fresh random pets) at 85-145 dps: a median of about 4 minutes, 3 to 6 by the pet, with the bell, the surges and the waves) */
    jawTrack: 1.55, jawLock: 1.1, jawLen: 13.5, jawSp: 0.36, jawRec: 1.9,
    pullT: 2.8, pullR: 6.2, pullV0: 0.6, pullV1: 2.9, gasp: 2.5,
    bellEvery: 30, bellFirst: 3.5, bellCall: 5, bellRise: 7, bellHold: 2.6, bellEbb: 3.4, floodZ: 1.35, floodK: 0.42,
    surgeEvery: 27, surgeFirst: 2.5, surgeLen: 24, waveTele: 2.9, waveV: 10, leeches: 2, leechHp: 0.0045,
    urnHp: 0.006 };
  const sf = (FX, k, ...a) => { const s = FX.H && FX.H.sfx; if (s && s[k]) try { s[k](...a); } catch (e) { /* no sound */ } };
  /* the bell's voice: a deep struck note, its hum and a long shimmer (cracked once it has fallen) */
  function toll(FX, k, cracked) { if ((k == null ? 1 : k) >= 0.5 && FX.mem && FX.mem.fx) FX.mem.fx.push({ kind: 'toll', t: 0, life: 2.4, k: k == null ? 1 : k, cracked: !!cracked });   // v398 B5: the toll's shock, painted
    const s = FX.H && FX.H.sfx; if (!s || !s.note) return; k = k == null ? 1 : k; try { s.note(98, 3.2, 'sine', 0.34 * k); s.note(196 * (cracked ? 1.12 : 1.19), 2.6, 'sine', 0.15 * k, null, 0.01); s.note(98 * 2.76, 1.9, 'triangle', 0.07 * k, null, 0.02); s.note(98 * 5.4, 1.1, 'sine', 0.04 * k, null, 0.03); if (s.hiss) s.hiss(0.5, 0.06 * k, 600); } catch (e) { /* no sound */ } }
  const toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k);
  const hitstop = (FX, s) => { try { const g = FX.g; if (g) g.hitStop = Math.max(g.hitStop || 0, s); } catch (e) { /* none */ } };   // v398 B5: a short freeze on the heaviest blows
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const turnTo = (a, b, max) => a + Math.max(-max, Math.min(max, angTo(a, b)));
  const say = (FX, key, s, sub, col, dur) => { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub || '', col || TQ_HI, first ? (dur || 2.8) : 1.5, true); };
  const ST = FX => { try { return FX.H.ST ? FX.H.ST() : null; } catch (e) { return null; } };
  const sp = FX => (FX.S.lv >= 3 ? 1.12 : 1);
  const vis = p => ({ x: p.x, y: p.y - p.z * ZK });
  function anc(FX, m, name) { const M = FX.mem; return MODEL.anchorAt(name, m.x, m.y, MODEL.headOf(M.th), M.P, 1, M.bt || 0) || { x: m.x, y: m.y, z: 2 }; }
  /* the water: M.lvl is the sea's height over the platform (tiles; below 0 the platform stands clear of it) */
  const SEA0 = -0.55;
  function islandsOf(FX) { const M = FX.mem, mod = modOf(FX); if (mod && mod.isl) return (M.isl = mod.isl); if (!M.isl) M.isl = mkIslands(FX.C, true); return M.isl; }
  function mkIslands(C, own) { const I2 = ARENA.islands(C), V2 = ARENA.valves(C); return I2.map((p, i) => ({ i, a: p.a, x: p.x, y: p.y, vx: V2[i].x, vy: V2[i].y, up: 0, want: 0, lit: 0, mark: 0, turned: 0, spin: 0, ch: 0, own: !!own, used: false, obj: null, leeches: [] })); }
  const blocked = (FX, s) => s.leeches.some(l => l && !l.dead);
  const onTop = (s, x, y) => s.up > 0.85 && Math.hypot(x - s.x, y - s.y) < ISL_R - 0.25;
  function sheltered(FX, x, y) { for (const s of islandsOf(FX)) if (onTop(s, x, y)) return s; return null; }
  function useValve(FX, s) { const M = FX.mem; if (!(s.lit > 0.5) || s.want > 0.5) return false;
    if (blocked(FX, s)) { FX.H.text(s.vx, s.vy - 1.4, 'Leeches hold the valve!', '#C9B4FF', 14); sf(FX, 'wrong'); return false; }
    s.want = 1; s.turned = 1; M.stat.valves++; FX.H.text(s.vx, s.vy - 1.5, 'The island rises!', TQ_HI, 15); sf(FX, 'chime', 784, 0.7); toll(FX, 0.25);
    FX.H.ring(s.vx, s.vy, 0.3, 1.8, 0.5, TQ, 0.3); if (!lowFx()) for (let i = 0; i < 10; i++) { const a = Math.random() * TAU; FX.H.part({ kind: 'star', x: s.vx + Math.cos(a) * 0.4, y: s.vy - 0.6, vx: Math.cos(a) * 1.6, vy: -1.2 - Math.random(), life: 0.9, max: 0.9, size: 2, color: TQ_HI }); }
    return true; }
  function islandsTick(FX, m, dt) { const M = FX.mem, me = FX.me;
    for (const s of islandsOf(FX)) { const was = s.up; s.up = toward(s.up, s.want, dt, s.want > s.up ? 1.8 : 1.1); if (Math.abs(s.up - s.want) < 0.004) s.up = s.want;
      if (s.want > 0.5 && was < 0.15 && s.up >= 0.15) { FX.H.shake(lowFx() ? 2 : 5, 0.6); sf(FX, 'crash'); for (let i = 0; i < (lowFx() ? 4 : 10); i++) { const a = Math.random() * TAU; FX.H.part({ kind: 'smoke', x: s.x + Math.cos(a) * ISL_R, y: s.y + Math.sin(a) * ISL_R, vx: Math.cos(a) * 0.8, vy: -0.4, life: 1, max: 1, size: 0.8, color: '#B8C4BE' }); } }
      { const mv = Math.abs(s.up - s.want) > 0.015; s.sheet = toward(s.sheet || 0, mv ? 1 : 0, dt, mv ? 6 : 0.8); }   // v398 B5: water sheeting off a moving island (painted only)
      s.lit = toward(s.lit, s.litW ? 1 : 0, dt, 3); s.mark = toward(s.mark, s.markW ? 1 : 0, dt, 3); s.spin += dt * (s.turned ? 6 : 0); if (s.turned) { s.turned = Math.max(0, s.turned - dt * 0.8); }
      s.leeches = s.leeches.filter(l => l && !l.dead);
      if (s.own) { const d = Math.hypot(me.x - s.vx, me.y - s.vy), moving = Math.abs(me.vx || 0) + Math.abs(me.vy || 0) > 0.3; if (s.lit > 0.5 && s.want < 0.5 && d < 1.7 && !moving && !me.dead && !blocked(FX, s)) { s.ch += dt; if (s.ch >= 0.75) { s.ch = 0; useValve(FX, s); } } else s.ch = 0; } }
    // the pet climbs the stair onto a raised island: drawn standing on its top
    let z = 0; if (!me.dead && !me.leap && !me.swIn) for (const s of islandsOf(FX)) { const d = Math.hypot(me.x - s.x, me.y - s.y); if (d < ISL_R + 0.9 && s.up > 0.02) { const k = 1 - sstep(ISL_R - 0.3, ISL_R + 0.9, d); z = Math.max(z, s.up * ISL_UP * k); } }
    if (z > 0.01 || M.petZ > 0.01) { M.petZ = toward(M.petZ || 0, z, dt, 10); if (!me.leap && !me.swIn) me.z = M.petZ * ZK; if (M.petZ < 0.012) { M.petZ = 0; if (!me.leap && !me.swIn) me.z = 0; } } }
  /* ---------------- the flow: begin / end an act ---------------- */
  function begin(FX, m, kind) { const M = FX.mem; M.A = { kind, t: 0, phase: 'wind' }; m.actT = 0; M.stat[kind] = (M.stat[kind] || 0) + 1; }
  function endAct(FX, m, cut) { const M = FX.mem, A = M.A; if (A && A.tele) A.tele.done = true; M.A = null; M.idleT = FX.S.lv >= 3 ? 1.05 : FX.S.lv === 2 ? 1.25 : 1.45; if (cut) { FX.S.tele.length = 0; } }
  function walk(FX, m, tx, ty, spd, dt) { const M = FX.mem; M.aimTh = Math.atan2(ty - m.y, tx - m.x); const p = FX.clampArena({ x: tx, y: ty }, 3.2); FX.moveTo(m, p.x, p.y, spd, dt, { full: 2.2, stepK: 0.6, noFace: true }); M.walking = 1; }
  function face(FX, m, tx, ty) { FX.mem.aimTh = Math.atan2(ty - m.y, tx - m.x); }
  /* a telegraph of this fight: the engine's shape and strike, plus our own bold art (FX.S.tele entries with .art) */
  function mark(FX, o) { return FX.tele(Object.assign({ label: '', art: o.art || 'jaw' }, o)); }
  /* ---- the entrance: he heaves himself up out of the sea at the north edge and crawls onto the platform ---- */
  function riseTick(FX, m, dt) { const M = FX.mem, C = FX.C, L = ARENA.lair(C);
    if (m.actT < 0.3) return;
    if (m.actT < 3.4) { if (!M.rose) { M.rose = true; sf(FX, 'splash'); FX.H.shake(lowFx() ? 4 : 10, 1.4); toll(FX, 0.5); }
      if (!lowFx() && Math.random() < dt * 18) FX.H.part({ kind: 'smoke', x: m.x + FX.rnd(-2.4, 2.4), y: m.y - FX.rnd(0, 4), vx: FX.rnd(-0.4, 0.4), vy: 2 + Math.random() * 2, life: 0.9, max: 0.9, size: 0.6 + Math.random() * 0.5, color: Math.random() < 0.5 ? '#CFF6F2' : '#8FC8CC' });
      if (m.actT > 2.4 && !M.roared) { M.roared = true; sf(FX, 'hum'); FX.H.shake(lowFx() ? 3 : 8, 0.9); } return; }
    if (Math.hypot(m.x - C.x, m.y - C.y) > AR - 3.4) { const dx = L.x - m.x, dy = L.y - m.y, d = Math.hypot(dx, dy) || 1; m.x += dx / d * 1.6 * dt; m.y += dy / d * 1.6 * dt; M.aimTh = Math.atan2(dy, dx); M.walking = 1; } else walk(FX, m, L.x, L.y, 1.5, dt);
    if (Math.hypot(m.x - L.x, m.y - L.y) < 0.5 || m.actT > 8) { m.act = 'fight'; M.idleT = 0.8; say(FX, 'p1', 'THE DROWNED HERALD', 'Leave the cone of his jaws; run outward from the Undertow', TQ_HI, 3); } }
  /* ---- between blows: he crawls after the pet, turns to it, then picks the next ---- */
  function idleTick(FX, m, dt) { const M = FX.mem, me = FX.me, lv = FX.S.lv, d = Math.hypot(me.x - m.x, me.y - m.y);
    face(FX, m, me.x, me.y);
    M.stalk = d > 7 || (M.stalk && d > 5.6); if (M.stalk) walk(FX, m, me.x, me.y, lv >= 3 ? 2.1 : 1.7, dt);
    M.idleT -= dt * sp(FX); if (M.idleT > 0) return;
    if (lv === 2 && M.bellT <= 0 && !FX.S.tele.length) { begin(FX, m, 'bell'); return; }
    if (lv >= 3 && !M.broke) { begin(FX, m, 'break'); return; }
    const cyc = CYC[Math.min(3, lv)]; let kind = cyc[M.pick % cyc.length]; M.pick++;
    if (kind === 'undertow' && M.surge && M.surge.phase === 'waves' && M.surge.next < 3.5) kind = 'jaw';
    begin(FX, m, kind); }
  /* ---- Jaw of the Deep: the head sinks, the jaw opens, the long cone tracks the pet and then locks; a torrent; his head
     hangs low for a breath after it (the jaw and throat open to blows) ---- */
  function jawTick(FX, m, A, dt) { const M = FX.mem, me = FX.me, k = sp(FX), track = TUNE.jawTrack / k, lock = TUNE.jawLock / k;
    if (!A.tele) { A.a = Math.atan2(me.y - m.y, me.x - m.x); const o = mouthFloor(m, A.a); A.tele = mark(FX, { shape: 'cone', x: o.x, y: o.y, a: A.a, len: TUNE.jawLen, spread: TUNE.jawSp, t: track + lock, dmg: m.dmg * 1.25, art: 'jaw', col: WARN, fn: s => jawFire(FX, m, A, s) }); sf(FX, 'hum'); }
    const s = A.tele;
    if (A.phase === 'wind') { if (A.t < track) A.a = turnTo(A.a, Math.atan2(me.y - m.y, me.x - m.x), dt * 0.9); else if (!A.locked) { A.locked = true; s.locked = true; sf(FX, 'tick'); }
      M.aimTh = A.a; const o = mouthFloor(m, A.a); s.x = o.x; s.y = o.y; s.a = A.a;
      if (A.t >= track + lock) { A.phase = 'fire'; A.t = 0; } return false; }
    if (A.phase === 'fire') { if (A.t >= 0.75) { A.phase = 'rec'; A.t = 0; A.exposed = true; } return false; }
    if (A.phase === 'rec') { if (A.t >= TUNE.jawRec / Math.sqrt(k)) { A.phase = 'back'; A.t = 0; A.exposed = false; } return false; }
    return A.t >= 0.4; }
  function mouthFloor(m, a) { return { x: m.x + Math.cos(a) * 2.6, y: m.y + Math.sin(a) * 2.6 }; }
  function jawFire(FX, m, A, s) { const M = FX.mem; if (FX.inShape(s, FX.me.x, FX.me.y, FX.me.r)) M.stat.jawHit++; sf(FX, 'splash'); sf(FX, 'crash'); FX.H.shake(lowFx() ? 4 : 8, 0.45); hitstop(FX, 0.045);   // v398 B5 (was shake 9, 0.5)
    FX.hz({ shape: 'cone', x: s.x, y: s.y, a: s.a, len: TUNE.jawLen, spread: TUNE.jawSp, life: 0.7, dps: m.dmg * 0.5, tick: 0.25, col: TQ, draw() {} });
    M.fx.push({ kind: 'torrent', x: s.x, y: s.y, a: s.a, t: 0, life: 1.1 }); }
  /* ---- Undertow: the throat swells, the water round him drags the pet in (weak, then strong), then bursts point-blank;
     he gasps after it, the throat open ---- */
  function undertowTick(FX, m, A, dt) { const M = FX.mem, me = FX.me, k = sp(FX), T = TUNE.pullT / k;
    if (A.phase === 'wind') { face(FX, m, me.x, me.y); if (A.t >= 0.45) { A.phase = 'pull'; A.t = 0; A.tele = mark(FX, { shape: 'circle', x: m.x, y: m.y, r: TUNE.pullR, t: T, dmg: m.dmg * 1.4, art: 'pull', col: WARN, fn: s => { if (FX.inShape(s, FX.me.x, FX.me.y, FX.me.r)) M.stat.undertowHit++; burstFx(FX, m, s); } });
        say(FX, 'under', 'UNDERTOW', 'Run outward now, while the pull is weak', TQ_HI, 2.2); sf(FX, 'whoosh'); } return false; }
    if (A.phase === 'pull') { const u = cl(A.t / T), d = Math.hypot(me.x - m.x, me.y - m.y);
      if (!me.dead && d > 0.8 && d < 15 && !sheltered(FX, me.x, me.y)) { const v = lerp(TUNE.pullV0, TUNE.pullV1, Math.pow(u, 1.4)) * (d > 11 ? (15 - d) / 4 : 1); FX.push(-(me.x - m.x) / d * v * dt, -(me.y - m.y) / d * v * dt); }
      if (!lowFx() && Math.random() < dt * 14) { const a = Math.random() * TAU, r = 5 + Math.random() * 7; FX.H.part({ kind: 'smoke', x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r, vx: -Math.cos(a) * 4, vy: -Math.sin(a) * 4, life: 0.8, max: 0.8, size: 0.4, color: '#9FE8E0' }); }
      if (A.t >= T) { A.phase = 'gasp'; A.t = 0; A.exposed = true; } return false; }
    if (A.phase === 'gasp') { if (A.t >= TUNE.gasp / Math.sqrt(k)) { A.phase = 'back'; A.t = 0; A.exposed = false; } return false; }
    return A.t >= 0.4; }
  function burstFx(FX, m, s) { sf(FX, 'splash'); sf(FX, 'crash'); FX.H.shake(lowFx() ? 5 : 11, 0.55); hitstop(FX, 0.07);   // v398 B5: the burst is the GPU dome of water (drawFx); the engine's boom and ring are kept small, under it
    FX.H.boom(s.x, s.y, 1.4, TQ, '#FFFFFF', { n: lowFx() ? 6 : 12, shake: 0, smoke: 0 });
    FX.mem.fx.push({ kind: 'burst', x: s.x, y: s.y, r: s.r, t: 0, life: 0.9 }); }
  /* ---- the Drowning Bell (phase II): he rears and the bell tolls; one valve lights, its island announced 5 s ahead; the
     sea rises over the platform; the flood crests over everything but the raised island; it ebbs ---- */
  function bellTick(FX, m, A, dt) { const M = FX.mem, me = FX.me, C = FX.C, isl = islandsOf(FX);
    if (A.phase === 'wind') { A.phase = 'call'; A.t = 0; A.hit = false; A.safe = false;
      let pick = 0, best = -1; isl.forEach((s, i) => { if (i === M.lastIsl) return; const sc = 10 - Math.abs(Math.hypot(me.x - s.vx, me.y - s.vy) - 9) * 0.3 + Math.random() * 4; if (sc > best) { best = sc; pick = i; } });
      M.lastIsl = pick; A.i = pick; const s = isl[pick]; s.litW = true; s.markW = true; s.want = 0;
      M.stat.bells++; say(FX, 'bell', 'DROWNING BELL', 'Turn the lit valve, then climb the island it raises', TQ_HI, 3.2); toll(FX, 1); FX.H.flash(0.18, TQ); FX.H.shake(lowFx() ? 3 : 6, 1.0); M.bellSwing = 1; }   // v398 B5 (was flash 0.25, shake 8, 1.2)
    const s = isl[A.i];
    if (A.phase === 'call') { M.lvlW = lerp(SEA0, 0.25, cl(A.t / TUNE.bellCall)); if (A.t >= TUNE.bellCall) { A.phase = 'rise'; A.t = 0; say(FX, 'flood', 'THE SEA RISES', 'Shelter on the raised island', TQ_HI, 2.0); toll(FX, 0.7); M.bellSwing = 1; } return false; }
    if (A.phase === 'rise') { M.lvlW = lerp(0.25, TUNE.floodZ, ease(A.t / TUNE.bellRise)); if (Math.random() < dt * 4) FX.H.shake(2 + 4 * cl(A.t / TUNE.bellRise), 0.2);
      if (A.t >= TUNE.bellRise) { A.phase = 'crest'; A.t = 0; M.stat.floods++; FX.H.flash(0.22, FOAM); sf(FX, 'splash'); sf(FX, 'crash'); FX.H.shake(lowFx() ? 5 : 11, 1.1); hitstop(FX, 0.06); M.fx.push({ kind: 'crest', t: 0, life: 1.8 });   // v398 B5 (was flash 0.3, shake 14, 1.4)
        if (!me.dead) { if (sheltered(FX, me.x, me.y)) { A.safe = true; M.stat.floodSafe++; FX.H.text(me.x, me.y - 2.2, 'Sheltered!', SAFE, 16); sf(FX, 'chime', 1046, 0.6); }
          else { A.hit = true; M.stat.floodHit++; const s2 = ST(FX), mx = s2 ? s2.hp : 200; let d = mx * TUNE.floodK; if (me.hp >= mx * 0.97) d = Math.min(d, me.hp - 1); FX.H.hurtPet(d, m, { flood: true }); FX.H.text(me.x, me.y - 1.8, 'Swept by the flood!', WARN, 15); } } } return false; }
    if (A.phase === 'crest') { M.lvlW = TUNE.floodZ; if (A.t >= TUNE.bellHold) { A.phase = 'ebb'; A.t = 0; s.litW = false; s.markW = false; } return false; }
    if (A.phase === 'ebb') { M.lvlW = lerp(TUNE.floodZ, SEA0, ease(A.t / TUNE.bellEbb)); if (A.t >= TUNE.bellEbb) { s.want = 0; M.bellT = TUNE.bellEvery; return true; } return false; }
    return true; }
  /* ---- the bell breaks (phase III's opening): he crawls to the north edge, rears and smashes the yoke; the bell falls
     into the sea; the waves begin ---- */
  function breakTick(FX, m, A, dt) { const M = FX.mem, C = FX.C, B = ARENA.bell(C), at = { x: C.x, y: C.y - AR + 4.6 };
    if (A.phase === 'wind') { if (Math.hypot(m.x - at.x, m.y - at.y) > 0.6 && A.t < 7) { walk(FX, m, at.x, at.y, 2.4, dt); return false; } A.phase = 'rear'; A.t = 0; face(FX, m, B.x, B.y); say(FX, 'brk', 'THE BELL', 'He means to break its support', WARN, 1.8); sf(FX, 'hum'); return false; }
    face(FX, m, B.x, B.y);
    if (A.phase === 'rear') { if (A.t >= 1.4) { A.phase = 'smash'; A.t = 0; M.bellState = 'fall'; M.bellFallT = 0; M.broke = true; M.stat.broke = 1; FX.H.flash(0.35, '#FFFFFF'); FX.H.shake(lowFx() ? 7 : 16, 1.3); hitstop(FX, 0.12); sf(FX, 'crash'); toll(FX, 1.1, true); M.fx.push({ kind: 'smash', t: 0, life: 1.4 });   // v398 B5 (was shake 18, 1.6; no hitstop)
        if (typeof BREAK_FX !== 'undefined') try { BREAK_FX.burst(null, B.x - 2.4, B.y + 1.2, { paint: yokePaint, w: 3.2, h: 1.6, mat: 'stone', mix: 'wood', size: 3.2, key: 'beluld-yoke', from: { x: m.x, y: m.y } }); BREAK_FX.burst(null, B.x + 2.4, B.y + 1.2, { paint: yokePaint, w: 3.2, h: 1.6, mat: 'stone', mix: 'iron', size: 3.0, key: 'beluld-yoke', from: { x: m.x, y: m.y } }); } catch (e) { /* (the shared break effect) */ }
        FX.H.after(1.25, () => { sf(FX, 'splash'); sf(FX, 'crash'); FX.H.shake(lowFx() ? 5 : 12, 0.9); hitstop(FX, 0.05); M.fx.push({ kind: 'splash', x: B.x, y: B.y + 0.6, t: 0, life: 2.4 }); M.lvlW = 0.22; });   // v398 B5 (splash life 1.6 -> 2.4: the column falls back)
        say(FX, 'p3b', 'THE BELL FALLS', 'Waves sweep half the platform at a time. Leeches will hold the next valve', WARN, 3.2); } return false; }
    if (A.phase === 'smash') { if (A.t >= 2.0) { M.surgeT = TUNE.surgeFirst; return true; } return false; }
    return true; }
  /* ---- a half-arena wave (phase III): he slaps the water; one half is marked (alternating), and a wave rolls in over it
     from the open sea toward the middle; the raised island stands above it ---- */
  function waveTick(FX, m, A, dt) { const M = FX.mem, me = FX.me, C = FX.C, k = sp(FX);
    if (!A.tele) { const side = M.waveSide = -(M.waveSide || 1); A.side = side; A.W = TUNE.waveTele / Math.sqrt(k);
      A.tele = mark(FX, { shape: 'fn', x: C.x + side * AR * 0.5, y: C.y, side, t: A.W, dmg: 0, art: 'wave', col: WARN, test: (x, y, rr) => (x - C.x) * side > -rr && Math.hypot(x - C.x, y - C.y) < AR + rr && !sheltered(FX, x, y),
        fn: () => { M.waves.push({ side, t: 0, d: AR + 0.5, hit: false }); M.stat.waves++; sf(FX, 'whoosh'); sf(FX, 'splash'); FX.H.shake(lowFx() ? 2 : 5, 0.7); } });   // v398 B5: the wave's rumble
      sf(FX, 'hum'); }
    face(FX, m, me.x, me.y);
    if (A.phase === 'wind') { if (A.t >= A.W) { A.phase = 'roll'; A.t = 0; } return false; }
    return A.t >= 1.3; }
  function wavesTick(FX, m, dt) { const M = FX.mem, me = FX.me, C = FX.C;
    for (let i = M.waves.length - 1; i >= 0; i--) { const w = M.waves[i]; w.t += dt; const was = w.d; w.d -= TUNE.waveV * dt;
      // the front: a line parallel to the middle, at distance w.d from it on its side, moving in
      const px = (me.x - C.x) * w.side; if (!w.hit && !me.dead && px > -0.15 && px <= was + me.r && px >= w.d - me.r && Math.hypot(me.x - C.x, me.y - C.y) < AR + 1) { w.hit = true;
        if (sheltered(FX, me.x, me.y)) { M.stat.waveSafe++; FX.H.text(me.x, me.y - 2.2, 'Above the wave!', SAFE, 14); }
        else if (FX.H.hurtPet(m.dmg * 1.3, m, { wave: true })) { M.stat.waveHit++; me.push = { vx: -w.side * 7, vy: 0, t: 0.25 }; FX.H.text(me.x, me.y - 1.8, 'Wave!', WARN, 14); } }
      if (w.d < -0.4) M.waves.splice(i, 1); } }
  /* ---- the surge (phase III, alongside his blows): leeches cling to the next valve; its island is announced; once the
     leeches are dead the valve raises it; it stays up through the surge, then sinks ---- */
  function surgeTick(FX, m, dt) { const M = FX.mem, C = FX.C, isl = islandsOf(FX), me = FX.me;
    if (!M.broke || m.dead) return;
    if (!M.surge) { M.surgeT -= dt; if (M.surgeT > 0 || M.A && M.A.kind === 'break') return;
      let pick = 0, best = -1; isl.forEach((s, i) => { if (i === M.lastIsl) return; const sc = 10 - Math.abs(Math.hypot(me.x - s.vx, me.y - s.vy) - 8) * 0.3 + Math.random() * 3; if (sc > best) { best = sc; pick = i; } });
      M.lastIsl = pick; const s = isl[pick]; M.surge = { i: pick, t: 0, phase: 'waves' }; s.litW = true; s.markW = true; s.want = 0; M.stat.surges++;
      for (let k = 0; k < TUNE.leeches; k++) { const a = (k / TUNE.leeches) * TAU + 0.5, x = s.vx + Math.cos(a) * 0.95, y = s.vy + Math.sin(a) * 0.75; const l = spawnLeech(FX, x, y); if (l) { s.leeches.push(l); M.leeches.push(l); } }
      say(FX, 'surge', 'LEECHES ON THE VALVE', 'Kill them, turn the valve, climb the island', '#C9B4FF', 2.6); sf(FX, 'splash'); return; }
    const S2 = M.surge, s = isl[S2.i]; S2.t += dt; S2.next = Math.max(0, TUNE.surgeLen - S2.t);
    if (S2.t >= TUNE.surgeLen) { s.litW = false; s.markW = false; s.want = 0; for (const l of s.leeches) if (l && !l.dead) { l.dead = true; l.hp = 0; } s.leeches = []; M.surge = null; M.surgeT = TUNE.surgeEvery - TUNE.surgeLen; } }
  function spawnLeech(FX, x, y) { const M = FX.mem, X = STAGE && STAGE.g === FX.g ? STAGE.X : null, hp = Math.max(30, FX.m.maxhp * TUNE.leechHp); let l = null;
    try { if (X && typeof BEL !== 'undefined' && BEL.spawn) l = BEL.spawn(X, 'leech', x, y, { aggro: true }); } catch (e) { l = null; }
    if (!l) { try { l = FX.minion(typeof MON !== 'undefined' && MON.leech ? 'leech' : 'blob', x, y, { still: true }); } catch (e) { l = null; } }
    if (l) { l.hp = l.maxhp = hp; l.belValve = true; l.aggro = true; l.still = true; FX.H.ring(x, y, 0.2, 1.2, 0.4, '#B6A2F0', 0.25); }
    return l; }
  /* ---- the breakable sea-glass lanterns on the rim (BREAK_FX: coral and glass) ---- */
  function urnPaint(c, P) { const s = P; if (typeof window !== 'undefined' && window.BELPROPS && window.BELPROPS.draw(c, 'glassurn', 0, 0, 0, P)) return;   // v392 PR: a repainted sea-glass urn (20n9); the old 2D only where that is off
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, 0, s * 0.5, s * 0.18, 0, 0, TAU); c.fill();
    c.fillStyle = '#5E6E6A'; c.beginPath(); c.moveTo(-s * 0.32, 0); c.lineTo(-s * 0.22, -s * 0.5); c.lineTo(s * 0.22, -s * 0.5); c.lineTo(s * 0.32, 0); c.closePath(); c.fill();
    const g = c.createLinearGradient(-s * 0.3, 0, s * 0.3, 0); g.addColorStop(0, '#2F6F6A'); g.addColorStop(0.5, '#7FE3D6'); g.addColorStop(1, '#2A5C58'); c.fillStyle = g; c.beginPath(); c.ellipse(0, -s * 0.95, s * 0.3, s * 0.48, 0, 0, TAU); c.fill();
    c.strokeStyle = '#957943'; c.lineWidth = s * 0.06; for (const y of [-0.62, -0.95, -1.28]) { c.beginPath(); c.ellipse(0, s * y, s * 0.3 * Math.sqrt(1 - ((y + 0.95) / 0.48) ** 2), s * 0.06, 0, 0, TAU); c.stroke(); }
    c.fillStyle = '#E07A6A'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-s * 0.3 + i * s * 0.15, -s * 0.48 - (i % 2) * s * 0.06, s * 0.07, 0, TAU); c.fill(); }
    c.fillStyle = '#C9FFF8'; c.beginPath(); c.ellipse(-s * 0.08, -s * 1.1, s * 0.06, s * 0.14, 0.3, 0, TAU); c.fill(); }
  function yokePaint(c, P) { const s = P; c.fillStyle = '#4A3A22'; c.fillRect(-s * 1.4, -s * 1.2, s * 2.8, s * 0.5); c.fillStyle = '#957943'; for (const x of [-1, 0, 1]) c.fillRect(x * s - s * 0.08, -s * 1.25, s * 0.16, s * 0.6); c.fillStyle = '#B9BDAE'; c.fillRect(-s * 0.5, -s * 0.7, s * 1.0, s * 0.7); }
  function mkUrns(FX) { const M = FX.mem; M.urns = ARENA.urns(FX.C).map(p => { const u = { i: p.i, x: p.x, y: p.y, broken: false, obj: null };
    u.obj = FX.obj({ kind: 'belurn', x: p.x, y: p.y - 0.5, r: 0.7, hp: Math.max(20, FX.m.maxhp * TUNE.urnHp), optional: true, key: 'urn' + p.i, onHit: o => { o.flash = 0.12; sf(FX, 'tick'); },
      onKill: () => { u.broken = true; M.stat.urns++; if (typeof BREAK_FX !== 'undefined') try { BREAK_FX.burst(null, u.x, u.y, { paint: urnPaint, w: 1.0, h: 1.6, mat: 'coral', mix: 'glass', size: 1.6, key: 'beluld-urn' }); } catch (e) { /* (the shared break effect) */ }
        FX.H.drop('hp', u.x, u.y); if (Math.random() < 0.5) FX.H.drop('mp', u.x, u.y); sf(FX, 'crack'); } }); return u; }); }

  /* ---------------- the pose: each act's wanted pose, eased ---------------- */
  const RATE = { inflate: 2.2, jaw: 5, lunge: 5, rear: 2.6, lift: 4, slam: 9, look: 3, nod: 3, tilt: 2, aim: 3, gaitK: 4, sway: 2, recoil: 8, finFlare: 3, lure: 3, glow: 3, sink: 1.2, dead: 1.1, sun: 0.8, lean: 3 };
  function poseOf(FX, m, M) { const W = blankPose(), A = M.A, t = M.bt || 0, me = FX.me;
    // idle: the throat inflates slowly and sinks, the fins stir, the lure sways
    const breath = 0.5 + 0.5 * Math.sin(t * 1.4); W.inflate = 0.18 + 0.32 * breath * breath; W.glow = 0.5 + 0.25 * breath; W.lure = 0.8 + 0.2 * Math.sin(t * 2.3); W.sway = 0.3 * Math.sin(t * 0.6); W.finFlare = 0.12 * breath;
    W.gaitK = M.walking ? 1 : 0; W.gait = M.gait || 0;
    // the head turned toward the pet
    { const a = MODEL.headOf(M.th), tb = toBody(me.x, me.y, m.x, m.y, a); W.look = Math.max(-0.6, Math.min(0.6, Math.atan2(tb[1], tb[0]) * 0.5)); }
    if (m.act === 'enter' || m.act === 'rise') { const u = m.act === 'enter' ? 0 : cl((m.actT - 0.3) / 3.0); W.sink = 4.2 * (1 - ease(u)); W.rear = m.act === 'rise' && m.actT > 1.6 && m.actT < 3.6 ? 1 : 0; W.jaw = W.rear * 0.9; W.finFlare = W.rear; W.inflate = 0.4 + 0.6 * W.rear; W.lure = 1.2; }
    if (A) { const u = A.t;
      if (A.kind === 'jaw') { if (A.phase === 'wind') { const k2 = cl(u / (TUNE.jawTrack + TUNE.jawLock)); W.lunge = 0.25 + 0.25 * k2; W.jaw = 0.35 + 0.5 * k2; W.lure = 1.2 + 0.8 * k2; W.inflate = 0.5 + 0.4 * k2; W.finFlare = 0.6 * k2; W.look = 0; }
        else if (A.phase === 'fire') { W.lunge = 1; W.jaw = 1; W.lure = 1.6; W.inflate = 0.2; W.finFlare = 1; W.look = 0; }
        else if (A.phase === 'rec') { W.lunge = 0.7; W.jaw = 0.55; W.nod = 0.15; W.inflate = 0.1; W.lure = 0.5; }
        else { W.lunge = 0.2; } }
      else if (A.kind === 'undertow') { if (A.phase === 'wind' || A.phase === 'pull') { const k2 = A.phase === 'wind' ? cl(u / 0.45) * 0.3 : 0.3 + 0.7 * cl(u / TUNE.pullT); W.inflate = 0.5 + 0.5 * k2 + 0.35 * k2; W.jaw = 0.5 + 0.3 * k2; W.rear = 0.25 + 0.25 * k2; W.glow = 0.9 + 1.0 * k2; W.finFlare = k2; W.lure = 1.2; W.look = 0; }
        else if (A.phase === 'gasp') { W.inflate = 0.05; W.jaw = 0.85 * (1 - cl(u / TUNE.gasp) * 0.6); W.lunge = 0.35; W.nod = 0.2; W.glow = 1.3; W.lure = 0.4; W.finFlare = 0; } }
      else if (A.kind === 'bell') { const call = A.phase === 'call' || A.phase === 'rise'; W.rear = call ? 0.85 + 0.15 * Math.sin(t * 2) : 0.2; W.jaw = call ? 0.55 + 0.35 * Math.max(0, Math.sin(t * 1.3)) : 0.2; W.inflate = call ? 0.9 : 0.3; W.glow = call ? 1.35 : 0.7; W.finFlare = call ? 1 : 0.2; W.lure = 1.5; W.look = 0; W.nod = -0.15; }
      else if (A.kind === 'break') { if (A.phase === 'rear') { W.rear = 1; W.lift = ease(u / 1.4); W.jaw = 0.8; W.finFlare = 1; W.inflate = 0.9; W.glow = 1.3; } else if (A.phase === 'smash') { W.slam = 1; W.jaw = 0.5; W.lunge = 0.5; W.finFlare = 0.6; } W.look = 0; }
      else if (A.kind === 'wave') { if (A.phase === 'wind') { const k2 = cl(u / (A.W || 2.8)); W.lift = k2 < 0.7 ? ease(k2 / 0.7) : 1 - ease((k2 - 0.7) / 0.3); W.slam = k2 > 0.88 ? 1 : 0; W.rear = 0.3; W.finFlare = 0.8; W.jaw = 0.4; W.inflate = 0.6; } else { W.slam = u < 0.5 ? 1 : 0; W.lift = 0; } } }
    if (m.stunT > 0) { W.jaw = 0.7; W.nod = 0.25; W.inflate = 0; W.lunge = 0.3; }
    W.recoil = M.flinch || 0; W.recoilS = M.recoilS || 1; W.sun = M.sun || 0;
    if (m.dead) { Object.assign(W, { dead: 1, jaw: 0.5, inflate: 0, glow: 0, lure: 0, rear: 0, lift: 0, slam: 0, lunge: 0.4, finFlare: 0, gaitK: 0, look: 0.2, sway: 0 }); }
    return W; }
  function easePose(FX, m, dt) { const M = FX.mem, W = poseOf(FX, m, M), P = M.P;
    for (const k of CH) { const r = RATE[k] || 3; P[k] = toward(P[k], W[k] || 0, dt, r); }
    P.gait = W.gait; P.recoilS = W.recoilS; M.flinch = Math.max(0, (M.flinch || 0) - dt * 3.5); }
  function flinch(FX, m, k) { const M = FX.mem; if (!(M.flinch > 0.08)) M.recoilS = FX.me.x < m.x ? 1 : -1; M.flinch = Math.min(1, (M.flinch || 0) + k); }
  /* ---------------- hit proxies and weak points ---------------- */
  function partsOf(FX, m) { if (m.act === 'enter' || m.dead) return []; const ch = vis(anc(FX, m, 'chest')), hd = vis(anc(FX, m, 'head'));
    return [{ key: 'torso', dx: ch.x - m.x, dy: ch.y - m.y, r: 2.0 }, { key: 'base', dx: 0, dy: -0.6, r: 1.9 }, { key: 'head', dx: hd.x - m.x, dy: hd.y - m.y, r: 1.2 }]; }
  function weakPoints(FX, m, M) { const A = M.A; let k = 0;
    if (A && A.exposed) k = A.kind === 'undertow' ? 1.75 : 1.4; else if (A && A.kind === 'bell' && (A.phase === 'call' || A.phase === 'rise')) k = 1.35; else if (m.stunT > 0) k = 1.5;
    if (k > 0 && m.act === 'fight' && !m.dead) { const p = vis(anc(FX, m, 'throat')); FX.weak('throat', p.x, p.y + 0.6, 1.5, k, true); M.weakK = k; } else { FX.weak('throat', 0, 0, 0, 0, false); M.weakK = 0; } }
  /* ---------------- the fall: he slumps, the sea drains away downward, the bell sounds once, the sun breaks through ---------------- */
  function deadTick(FX, m, dt) { const M = FX.mem;
    if (M.deadT == null) { M.deadT = 0; M.A = null; FX.S.tele.length = 0; for (let i = FX.S.hz.length - 1; i >= 0; i--) if (FX.S.hz[i].dps) FX.S.hz.splice(i, 1); try { if (FX.H.eshots) FX.H.eshots.length = 0; } catch (e) { /* none */ }
      FX.weak('throat', 0, 0, 0, 0, false); FX.noParts(); M.waves.length = 0; M.surge = null; for (const s of islandsOf(FX)) { s.litW = false; s.markW = false; }
      for (const l of M.leeches) if (l && !l.dead) { l.dead = true; l.hp = 0; }
      M.corpse = { kind: 'corpse', x: m.x, y: m.y + 0.31 }; FX.S.props.push(M.corpse); M.flinch = 1; M.drainFrom = M.lvl; FX.H.text(m.x, m.y - 5, 'The light leaves his throat...', TQ_HI, 15); }
    M.deadT += dt; const u = M.deadT;
    // the sea drains downward: off the platform, then down the piers below its rim
    M.lvlW = lerp(Math.max(SEA0, M.drainFrom == null ? SEA0 : M.drainFrom), -3.2, ease(u / 3.4)); M.lvl = M.lvlW; M.drain = cl(u / 3.4);
    if (u > 1.2 && !M.tolled) { M.tolled = true; toll(FX, 1.2, M.broke); M.bellSwing = 1; FX.H.ring(ARENA.bell(FX.C).x, ARENA.bell(FX.C).y + 1.5, 0.5, 9, 1.2, GOLD, 0.25); }
    M.sun = cl((u - 1.6) / 2.6);
    if (!lowFx() && Math.random() < dt * 5 * (1 - cl(u / 4))) FX.H.part({ kind: 'smoke', x: m.x + FX.rnd(-2, 2), y: m.y - FX.rnd(0.5, 2.5), vx: FX.rnd(-0.3, 0.3), vy: -0.8, life: 1.4, max: 1.4, size: 1, color: '#BFD8D4' }); }
  function onFall(m) { /* (the sealing's onFall: the drain and the light are this fight's own, deadTick; nothing more is needed) */ }

  /* ================= the painting ================= */
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${Math.max(0, Math.min(1, a))})`; };
  const gl2 = (c, x, y, r, col, a) => { if (!(r > 0) || !(a > 0.003)) return; if (typeof glowSprite === 'function' && typeof blitSized === 'function') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); } else { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); } };
  const fg = () => { try { if (typeof window !== 'undefined' && (window.__ULD_FX === 0 || window.__BEL_GL === 0)) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const textAt = (c, s, x, y, size, col, ink) => { c.save(); c.font = `900 ${Math.round(Math.max(10, size))}px ${typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = Math.max(3, size * 0.22); c.strokeStyle = ink || 'rgba(4,14,20,.85)'; c.strokeText(s, x, y); c.fillStyle = col || '#FFFFFF'; c.fillText(s, x, y); c.restore(); };
  /* ---- the platform (painted once per zoom, world units centred on it): the Belfry's seamless world-space limestone
     (BEL.floorAt('belplat'), the v389 F technique) where B1's land is there, else our own slabs laid in rings; then the
     platform's own marks: the rim's black tidal stain and wet sheen, the brass compass ring, the island sockets, the
     valves' brass channels ---- */
  function paintFloor(c, A2) { const R = A2.R, rnd = A2.rnd, FX = A2.FX, C = FX ? FX.C : { x: 0, y: 0 };
    // the sea under the rim (the GPU sea lies over it; this is the 2D picture)
    let g = c.createRadialGradient(0, 0, R - 0.5, 0, 0, R + 1.6); g.addColorStop(0, '#1C4C60'); g.addColorStop(0.4, DEEP); g.addColorStop(1, '#0A2230'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.6, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.clip();
    let laid = false;
    if (typeof BEL !== 'undefined' && BEL.floorAt && FX) { try { const m0 = c.getTransform(), P = m0.a; c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
        for (let ty = Math.floor(C.y - R) - 1; ty <= Math.ceil(C.y + R); ty++) for (let tx = Math.floor(C.x - R) - 1; tx <= Math.ceil(C.x + R); tx++) { const lx = tx - C.x, ly = ty - C.y; if (Math.hypot(Math.max(Math.abs(lx + 0.5) - 0.5, 0), Math.max(Math.abs(ly + 0.5) - 0.5, 0)) > R + 0.2) continue;
          BEL.floorAt(c, 'belplat', tx, ty, P, m0.a * lx + m0.e, m0.d * ly + m0.f); }
        c.restore(); laid = true; } catch (e) { c.restore(); laid = false; } }
    if (!laid) { c.fillStyle = '#C6C8B9'; c.fillRect(-R, -R, R * 2, R * 2);
      // slabs in rings, each its own tone (a property of the slab, never of a tile), dark teal joints
      for (let r0 = 0, ring = 0; r0 < R; r0 += 1.65, ring++) { const r1 = Math.min(R, r0 + 1.65), n = Math.max(1, Math.round(TAU * (r0 + r1) / 2 / 1.9)), off = rnd() * TAU;
        for (let i = 0; i < n; i++) { const a0 = off + i / n * TAU, a1 = off + (i + 1) / n * TAU, h = rnd(), tone = 0.86 + h * 0.18;
          c.beginPath(); if (r0 < 0.01) c.arc(0, 0, r1, 0, TAU); else { c.arc(0, 0, r1, a0, a1); c.arc(0, 0, r0, a1, a0, true); c.closePath(); }
          c.fillStyle = `rgb(${Math.round(198 * tone)},${Math.round(200 * tone)},${Math.round(185 * tone)})`; c.fill(); c.strokeStyle = 'rgba(36,80,79,.75)'; c.lineWidth = 0.06; c.stroke();
          if (h > 0.8) { c.strokeStyle = 'rgba(20,30,32,.35)'; c.lineWidth = 0.03; c.beginPath(); const am = (a0 + a1) / 2, rm = (r0 + r1) / 2; c.moveTo(Math.cos(am) * rm, Math.sin(am) * rm); c.lineTo(Math.cos(am + 0.05) * (rm + 0.5), Math.sin(am + 0.05) * (rm + 0.5)); c.stroke(); } } } }
    // the black tidal stain toward the rim, wet and darkest at the very edge; algae streaks
    g = c.createRadialGradient(0, 0, R * 0.62, 0, 0, R); g.addColorStop(0, 'rgba(18,27,31,0)'); g.addColorStop(0.7, 'rgba(18,27,31,.32)'); g.addColorStop(0.92, 'rgba(18,27,31,.72)'); g.addColorStop(1, 'rgba(10,18,22,.92)'); c.fillStyle = g; c.fillRect(-R, -R, R * 2, R * 2);
    for (let i = 0; i < 40; i++) { const a = rnd() * TAU, d = R * (0.8 + rnd() * 0.2); c.strokeStyle = `rgba(60,110,80,${0.12 + rnd() * 0.15})`; c.lineWidth = 0.08 + rnd() * 0.12; c.beginPath(); c.moveTo(Math.cos(a) * d, Math.sin(a) * d); c.lineTo(Math.cos(a + 0.02) * (d - 0.6 - rnd()), Math.sin(a + 0.02) * (d - 0.6 - rnd())); c.stroke(); }
    // the brass compass ring and its tide marks
    c.strokeStyle = 'rgba(94,74,38,.9)'; c.lineWidth = 0.34; c.beginPath(); c.arc(0, 0, 5.2, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(217,179,95,.55)'; c.lineWidth = 0.12; c.beginPath(); c.arc(0, 0, 5.2, 0, TAU); c.stroke();
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, l = i % 6 === 0 ? 0.9 : i % 2 === 0 ? 0.5 : 0.3; c.strokeStyle = 'rgba(149,121,67,.85)'; c.lineWidth = i % 6 === 0 ? 0.14 : 0.07; c.beginPath(); c.moveTo(Math.cos(a) * 5.2, Math.sin(a) * 5.2); c.lineTo(Math.cos(a) * (5.2 - l), Math.sin(a) * (5.2 - l)); c.stroke(); }
    // the island sockets and the valves' brass channels (from each valve to its socket)
    for (const s of mkIslands({ x: 0, y: 0 })) {
      c.strokeStyle = 'rgba(149,121,67,.8)'; c.lineWidth = 0.26; c.beginPath(); c.moveTo(s.vx, s.vy); c.lineTo(s.x - Math.cos(s.a) * (ISL_R + 0.2), s.y - Math.sin(s.a) * (ISL_R + 0.2)); c.stroke(); c.strokeStyle = 'rgba(30,40,40,.5)'; c.lineWidth = 0.08; c.stroke();
      g = c.createRadialGradient(s.x, s.y, ISL_R * 0.6, s.x, s.y, ISL_R + 0.6); g.addColorStop(0, 'rgba(18,27,31,.0)'); g.addColorStop(0.75, 'rgba(18,27,31,.5)'); g.addColorStop(1, 'rgba(18,27,31,0)'); c.fillStyle = g; c.beginPath(); c.arc(s.x, s.y, ISL_R + 0.6, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(94,74,38,.95)'; c.lineWidth = 0.2; c.beginPath(); c.arc(s.x, s.y, ISL_R + 0.12, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(149,121,67,.85)'; c.beginPath(); c.arc(s.vx, s.vy, 0.55, 0, TAU); c.fill(); c.strokeStyle = 'rgba(40,30,16,.8)'; c.lineWidth = 0.06; c.stroke(); }
    c.restore();
    // the rim: a lip of worn blocks, foam where the sea meets it
    for (let i = 0; i < 72; i++) { const a0 = i / 72 * TAU, a1 = a0 + TAU / 72 * 0.9, r0 = R - 0.45, r1 = R + 0.05; c.beginPath(); c.arc(0, 0, r1, a0, a1); c.arc(0, 0, r0, a1, a0, true); c.closePath(); const sh = 150 + rnd() * 30; c.fillStyle = `rgb(${Math.round(sh)},${Math.round(sh + 4)},${Math.round(sh - 8)})`; c.fill(); c.strokeStyle = 'rgba(36,80,79,.8)'; c.lineWidth = 0.05; c.stroke(); }
  }
  /* ---- the far view: B1's sky (the sea plane, purple clouds, the moon, the tilted tower) or our own; warmer as the sun
     breaks through at the fall ---- */
  function paintSky(c, W, H, T, FX) { const M = (FX && FX.mem) || {}, sun = M.sun || 0;
    let done = false; if (typeof BEL !== 'undefined' && BEL.paintSky) { try { BEL.paintSky(c, W, H, T, { cam: FX ? { x: FX.C.x, y: FX.C.y } : { x: 0, y: 0 }, t: 12.5, calm: M.drain || 0 }); done = true; } catch (e) { done = false; } }
    if (!done) { let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120C24'); g.addColorStop(0.35, '#2E2148'); g.addColorStop(0.55, '#4A3866'); g.addColorStop(0.6, '#163A4E'); g.addColorStop(1, '#081C28'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const rnd = mulb(41); for (let i = 0; i < 22; i++) { const x = rnd() * W, y = H * (0.04 + rnd() * 0.4), r = W * (0.12 + rnd() * 0.18); g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(91,74,134,.42)'); g.addColorStop(0.6, 'rgba(60,46,96,.22)'); g.addColorStop(1, 'rgba(40,30,70,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
      gl2(c, W * 0.74, H * 0.14, W * 0.22, '#9FE8D8', 0.4); c.fillStyle = '#E8FFF8'; c.beginPath(); c.arc(W * 0.74, H * 0.14, W * 0.035, 0, TAU); c.fill();
      c.fillStyle = 'rgba(10,16,26,.9)'; c.beginPath(); c.moveTo(W * 0.12, H * 0.58); c.lineTo(W * 0.15, H * 0.3); c.lineTo(W * 0.2, H * 0.28); c.lineTo(W * 0.23, H * 0.58); c.closePath(); c.fill(); }
    if (sun > 0.01) { c.save(); const g = c.createLinearGradient(0, 0, W * 0.4, H); g.addColorStop(0, `rgba(255,214,150,${0.55 * sun})`); g.addColorStop(0.5, `rgba(255,170,110,${0.3 * sun})`); g.addColorStop(1, `rgba(255,200,140,${0.12 * sun})`); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, W, H);
      gl2(c, W * 0.2, H * 0.08, W * 0.5 * sun, '#FFD9A0', 0.6 * sun); c.restore(); } }
  /* ---- over the ground every frame: the sea (a GPU plane: the open sea outside the platform, and laid over the platform
     when it floods), the platform's side wall above the water, the idle's ripples; never over the platform otherwise ---- */
  function drawOverlay(c, FX, t, T) { const C = FX.C, M = FX.mem || {}, X0 = FX.sx(C.x), Y0 = FX.sy(C.y), R = C.R * T, cv = c.canvas, m0 = c.getTransform(), W = cv.width / (m0.a || 1), H = cv.height / (m0.d || 1), sx0 = -m0.e / (m0.a || 1), sy0 = -m0.f / (m0.d || 1);
    const lvl = M.lvl == null ? SEA0 : M.lvl, dz = lvl * ZK * T, sun = M.sun || 0, foam = M.foam || 0, view = [sx0 - 4, sy0 - 4, sx0 + W + 4, sy0 + H + 4];
    // the sea, drawn once (the GPU plane at the water's height) and laid down outside the platform's top, and over it when flooded
    let pic = null;
    if (!(typeof window !== 'undefined' && window.__ULD_SEA === 0) && glOn()) { const it = { part: 'sea', R: I3(), o: [0, 0, 0], s: 1, al: 1, glow: sun, glow2: 0.08 + 0.75 * foam, spill: 0, kind: 0, fx: 0 };
      try { glPass(c, mkView(C.x, C.y, lvl, 0, { T, sx: FX.sx, sy: FX.sy, scale: SEA_U / VIS }), [it], 1, { t, outline: 0, res: lowFx() ? 0.35 : 0.5, view, into: (cvs, w, h, bx0, by0, bw, bh) => { pic = { cvs, w, h, bx0, by0, bw, bh }; } }); } catch (e) { glFail(); pic = null; } }
    c.save(); c.beginPath(); c.rect(sx0 - 10, sy0 - 10, W + 20, H + 20); c.arc(X0, Y0, R - 0.5, 0, TAU, true); c.clip('evenodd');
    if (pic) c.drawImage(pic.cvs, 0, 0, pic.w, pic.h, pic.bx0, pic.by0, pic.bw, pic.bh);
    else { const g = c.createRadialGradient(X0, Y0 - dz, R, X0, Y0 - dz, R + T * 12); g.addColorStop(0, '#1A4C60'); g.addColorStop(0.3, DEEP); g.addColorStop(1, '#081C28'); c.fillStyle = g; c.fillRect(sx0 - 10, sy0 - 10, W + 20, H + 20);
      if (!lowFx()) { c.strokeStyle = 'rgba(160,230,230,.16)'; c.lineWidth = Math.max(1, T * 0.06); for (let i = 0; i < 4; i++) { const rr = R + T * (1.2 + i * 2.2 + (t * 0.6 + i) % 2.2); c.beginPath(); c.ellipse(X0, Y0 - dz, rr, rr, 0, 0, TAU); c.stroke(); } } }
    // the platform's side wall above the water (south side), stained black toward the waterline, foam at its foot
    if (lvl < -0.02) { const d = -dz; c.beginPath(); c.arc(X0, Y0 + d, R, 0, Math.PI); c.arc(X0, Y0, R, Math.PI, 0, true); c.closePath(); const g = c.createLinearGradient(0, Y0 + R * 0.5, 0, Y0 + R + d); g.addColorStop(0, '#9EA294'); g.addColorStop(0.45, '#4A5550'); g.addColorStop(1, '#121B1F'); c.fillStyle = g; c.fill();
      c.strokeStyle = 'rgba(36,80,79,.55)'; c.lineWidth = Math.max(1, T * 0.04); for (let k = 1; k < 3; k++) { c.beginPath(); c.ellipse(X0, Y0 + d * k / 3, R, R, 0, 0.05, Math.PI - 0.05); c.stroke(); }
      c.strokeStyle = `rgba(226,247,242,${0.5 + 0.2 * Math.sin(t * 2)})`; c.lineWidth = Math.max(1.5, T * 0.12); c.beginPath(); c.ellipse(X0, Y0 + d, R + T * 0.1, R + T * 0.1, 0, 0.02, Math.PI - 0.02); c.stroke(); }
    c.restore();
    // the flood over the platform: the same sea, translucent by its depth
    if (lvl > 0.02) { c.save(); c.beginPath(); c.arc(X0, Y0 - dz, R + T * 0.2, 0, TAU); c.clip(); const a = Math.min(0.85, 0.22 + lvl * 0.45);
      if (pic) { c.globalAlpha = a; c.drawImage(pic.cvs, 0, 0, pic.w, pic.h, pic.bx0, pic.by0, pic.bw, pic.bh); }
      else { c.fillStyle = rgba(DEEP, a); c.fillRect(X0 - R - T, Y0 - dz - R - T, (R + T) * 2, (R + T) * 2); c.strokeStyle = 'rgba(180,240,240,.22)'; c.lineWidth = Math.max(1, T * 0.05); for (let i = 0; i < 6; i++) { const y = Y0 - dz - R + ((t * T * 1.2 + i * R / 3) % (R * 2)); c.beginPath(); for (let x = X0 - R; x <= X0 + R; x += T) { const yy = y + Math.sin(x * 0.05 + t * 2 + i) * T * 0.2; x === X0 - R ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); } }
      c.globalAlpha = 1; if (!fg()) { c.strokeStyle = `rgba(226,247,242,${0.35 + 0.25 * Math.sin(t * 3)})`; c.lineWidth = Math.max(1.5, T * 0.1); c.beginPath(); c.arc(X0, Y0 - dz, R + T * 0.1, 0, TAU); c.stroke(); } c.restore(); }   // (v398 B5: on the GPU its rim is a soft foam line, groundFx)
  }
  /* ---- the props: islands and valves (GPU pictures kept by state), the bell on its piers (live), the corpse ---- */
  function drawPropArt(c, FX, p, X, Y, T, t) { const M = FX.mem || {}, o = { T, sx: FX.sx, sy: FX.sy }, lvl = M.lvl == null ? SEA0 : M.lvl, sun = M.sun || 0;
    if (p.kind === 'island') { const s = (islandsOf(FX) || [])[p.i]; if (!s) return; const up = Math.round(s.up * 20) / 20, h = 0.12 + up * (ISL_UP - 0.12), clipT = Math.max(0, lvl), lit = Math.round(s.mark * 4) / 4;
      if (s.mark > 0.05 && !lowFx()) gl2(c, FX.sx(s.x), FX.sy(s.y) - h * ZK * T, T * 3.4, TQ, 0.25 * s.mark);
      const ok = MODEL.drawProp(c, 'island', s.x, s.y, MODEL.headOf(s.a + Math.PI), Object.assign(o, { z: +h.toFixed(3), key: `i${up}|${Math.round(clipT * 12)}|${Math.round(sun * 4)}`, clip: [(clipT - h) / VIS, 0.03], spill: Math.round(sun * 4) / 4, wear: -0.25 }));
      if (!ok) islandArt(c, FX, s, T, h, clipT);
      return; }
    if (p.kind === 'valve') { const s = (islandsOf(FX) || [])[p.i]; if (!s) return; const X2 = FX.sx(s.vx), Y2 = FX.sy(s.vy), lit = Math.round(s.lit * 4) / 4, blk = blocked(FX, s);
      if (s.lit > 0.05) { gl2(c, X2, Y2 - T * 0.9, T * (1.8 + 0.4 * Math.sin(t * 5)), blk ? '#B6A2F0' : TQ, 0.45 * s.lit); }
      const ok = MODEL.drawProp(c, 'valve', s.vx, s.vy, 0, Object.assign(o, { key: `v${lit}|${Math.round(s.spin * 2) % 8}`, glow: lit * 1.4, scale: 1.25 }));
      if (!ok) valveArt(c, X2, Y2, T, s, t);
      if (s.lit > 0.3) { const k = s.lit, by = Y2 - T * 2.3 - Math.abs(Math.sin(t * 4)) * T * 0.2; c.save(); c.globalAlpha = k; textAt(c, blk ? 'LEECHES!' : s.want > 0.5 ? 'RAISED' : 'TURN', X2, by, T * 0.42, blk ? '#D9C8FF' : TQ_HI); c.restore(); }
      return; }
    if (p.kind === 'bell') { drawBell(c, FX, T, t); return; }
    if (p.kind === 'corpse' && FX.m) { const m = FX.m; if (!MODEL.glOn() && old2D(c, FX, m, M, FX.sx(m.x), FX.sy(m.y), T, t)) return; MODEL.draw(c, m.x, m.y, MODEL.headOf(M.th), M.P, { T, sx: FX.sx, sy: FX.sy, t: M.bt, clipZ: lvl > 0.05 ? lvl : null }); } }
  function islandArt(c, FX, s, T, h, clipT) { const X = FX.sx(s.x), Y = FX.sy(s.y), r = ISL_R * T, top = Y - h * ZK * T, base = Y - clipT * ZK * T;
    c.save(); c.fillStyle = '#596460'; c.beginPath(); c.ellipse(X, base, r, r, 0, 0, Math.PI); c.lineTo(X - r, top); c.ellipse(X, top, r, r, 0, Math.PI, 0, true); c.closePath(); c.fill();
    const g = c.createLinearGradient(0, top, 0, base); g.addColorStop(0, '#A9AE9F'); g.addColorStop(1, '#202B2E'); c.fillStyle = g; c.fill();
    c.fillStyle = '#C6C8B9'; c.beginPath(); c.ellipse(X, top, r, r, 0, 0, TAU); c.fill(); c.strokeStyle = '#957943'; c.lineWidth = Math.max(1.5, T * 0.1); c.stroke(); c.restore(); }
  function valveArt(c, X, Y, T, s, t) { c.save(); c.fillStyle = '#8A8E80'; c.fillRect(X - T * 0.2, Y - T * 0.6, T * 0.4, T * 0.6); c.translate(X, Y - T * 1.0); c.rotate(s.spin); c.strokeStyle = s.lit > 0.3 ? '#D9B35F' : '#957943'; c.lineWidth = Math.max(2, T * 0.09);
    c.beginPath(); c.arc(0, 0, T * 0.42, 0, TAU); c.stroke(); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI; c.beginPath(); c.moveTo(-Math.cos(a) * T * 0.42, -Math.sin(a) * T * 0.42); c.lineTo(Math.cos(a) * T * 0.42, Math.sin(a) * T * 0.42); c.stroke(); } c.restore(); }
  /* the bell on its yoke between two drowned piers, off the north edge; it swings when it tolls, and falls when he breaks it */
  function drawBell(c, FX, T, t) { const M = FX.mem || {}, C = FX.C, B = ARENA.bell(C), lvl = M.lvl == null ? SEA0 : M.lvl, sun = M.sun || 0, X = FX.sx(B.x), Y = FX.sy(B.y);
    { const cv = c.canvas, m0 = c.getTransform ? c.getTransform() : null; if (m0 && cv) { const W = cv.width / (m0.a || 1), H = cv.height / (m0.d || 1), sx0 = -m0.e / (m0.a || 1), sy0 = -m0.f / (m0.d || 1); if (X + T * 6 < sx0 || X - T * 6 > sx0 + W || Y - T * 9 > sy0 + H || Y + T * 3 < sy0) return; } }   // (off the screen: nothing to draw)
    const sw = (M.bellAmp || 0) * Math.sin(t * 2.4), fall = M.bellState === 'fall' ? ease(cl((M.bellFallT || 0) / 1.3)) : 0;
    const bz = lerp(4.3, -1.7, fall), tilt = fall * 0.7 + sw * 0.18, gone = M.bellState === 'fall';
    const clip = [Math.min(lvl, -0.1) / VIS - 0.02, 0.04], spill = Math.round(sun * 8) / 8;
    const list = [{ part: 'pier', R: I3(), o: [-2.6, 0, 0], s: 1, al: 1, spill, wear: 0.9 }, { part: 'pier', R: I3(), o: [2.6, 0, 0], s: 1, al: 1, spill, wear: 0.9 }];
    if (!gone) { list.push({ part: 'yoke', R: I3(), o: [0, 0, 4.6], s: 1, al: 1, spill }); list.push({ part: 'yoke', R: M3([-1, 0, 0], [0, -1, 0], [0, 0, 1]), o: [0, 0, 4.6], s: 1, al: 1, spill }); }
    else { const k = ease(cl((M.bellFallT || 0) / 0.9)); list.push({ part: 'yoke', R: rotY(-1.1 * k), o: [-2.6, 0, 4.6 - 0.2 * k], s: 1, al: 1, spill }); list.push({ part: 'yoke', R: mm(rotZ(Math.PI), rotY(-0.5 * k)), o: [2.6, 0, 4.6], s: 1, al: 1, spill }); }
    list.push({ part: 'bell', R: mm(rotX(tilt), rotY(fall * 0.4)), o: [0, 0, bz], s: 1, al: 1, glow: 0, spill });
    const ok = MODEL.drawLive(c, list, B.x, B.y, 0, 0, { T, sx: FX.sx, sy: FX.sy, t, clip, low: lowFx(), outline: 1 });
    if (!ok) { c.save(); c.fillStyle = '#7D847A'; for (const dx of [-2.6, 2.6]) c.fillRect(X + dx * T - T * 0.5, Y - T * 6, T * 1.0, T * 6); if (!gone) { c.fillStyle = '#5E4A26'; c.fillRect(X - T * 3.3, Y - T * 6.2, T * 6.6, T * 0.5); }
      const by = Y - bz * VIS * ZK * T; c.translate(X, by); c.rotate(tilt); const g = c.createLinearGradient(-T * 1.6, 0, T * 1.6, 0); g.addColorStop(0, '#4E3A1C'); g.addColorStop(0.45, '#B08A4A'); g.addColorStop(1, '#3A2A12'); c.fillStyle = g;
      c.beginPath(); c.moveTo(-T * 0.9, 0); c.quadraticCurveTo(-T * 1.1, T * 2.4, -T * 1.7, T * 3.4); c.lineTo(T * 1.7, T * 3.4); c.quadraticCurveTo(T * 1.1, T * 2.4, T * 0.9, 0); c.closePath(); c.fill(); c.restore(); } }
  /* ---- the boss: the model (clipped at the water when it floods), then its lights (the throat, the lure, the eyes) ---- */
  function demoMem(FX, m) { const M = FX.mem || (FX.mem = {}); if (!M.ok) { M.P = Object.assign(blankPose(), M.P || {}); if (M.th == null) M.th = Math.PI / 2 + 0.3; M.bt = M.bt || 2.0; M.fx = M.fx || []; M.demo = 1; } return M; }
  /* where the GPU cannot run (no WebGL, a software rasteriser): the EXISTING 2D Uldroth, the old DunBoss painter for 'uldroth'
     (20n), with the same fight and mechanics (the user: no new simplified fallback) */
  let OLD2D = null, OLDN = 0;
  function old2D(c, FX, m, M, X, Y, T, t) { if (typeof DunBoss === 'undefined' || !DunBoss.P || !DunBoss.P.uldroth) return false;
    const bk = (typeof BOSS_BY_ID !== 'undefined' && BOSS_BY_ID.uldroth) || (typeof BOSSES !== 'undefined' && BOSSES.find(b => b.id === 'uldroth')); if (!bk) return false;
    const A = M.A, P = M.P || {}, pm = OLD2D || (OLD2D = {}), r = T * 2.0, sink = (P.sink || 0) * VIS * ZK * T;
    Object.assign(pm, { bk, x: m.x, y: m.y, r: 2.6, face: Math.cos(M.th || 0) >= 0 ? 1 : -1, act: A && A.kind === 'jaw' && A.phase !== 'back' ? 'jaw' : A ? A.kind : 'move', actT: A ? A.t : 0, hp: m.hp, maxhp: m.maxhp, phase: m.phase || 1, flash: m.flash || 0, dead: false });
    c.save(); if ((P.dead || 0) > 0.5) c.globalAlpha *= 0.8;
    if (sink > 1) { c.beginPath(); c.rect(X - r * 4, Y - r * 5, r * 8, r * 5 + T * 0.4); c.clip(); }
    try { DunBoss.draw(c, pm, X, Y - r * 0.7 + sink, r, t, FX.me, FX.sx, FX.sy, T); } catch (e) { c.restore(); return false; }
    c.restore(); OLDN++; return true; }
  function paintBoss(c, FX, m, X, Y, T, t) { const started = FX.S && FX.S.started, M = started ? FX.mem : demoMem(FX, m); if (!M.P) return;
    if (!MODEL.glOn() && old2D(c, FX, m, M, X, Y, T, t)) return;
    const o = { T, sx: v => X + (v - m.x) * T, sy: v => Y + (v - m.y) * T, t: M.bt || t, clipZ: started && M.lvl > 0.05 ? M.lvl : (M.P.sink > 0.05 ? (started ? Math.min(M.lvl, 0) : SEA0) : null) };
    MODEL.draw(c, m.x, m.y, MODEL.headOf(M.th == null ? Math.PI / 2 : M.th), M.P, o);
    lights(c, Object.assign({}, FX, { sx: o.sx, sy: o.sy }), m, M, T); }
  function lights(c, FX, m, M, T) { const P = M.P, live = 1 - (P.dead || 0); if (live < 0.05) return;
    const a = MODEL.headOf(M.th == null ? Math.PI / 2 : M.th), at = n => { const q = MODEL.anchorAt(n, m.x, m.y, a, P, 1, M.bt || 0); return q ? [FX.sx(q.x), FX.sy(q.y) - q.z * ZK * T, q] : null; };
    const th = at('throat'), lu = at('lure'), inf = P.inflate || 0, g = (P.glow || 0.5) * live;
    if (th && !(M.lvl > th[2].z)) { gl2(c, th[0], th[1], T * (1.2 + 1.4 * inf) * Math.min(1.6, g + 0.3), TQ, (0.16 + 0.3 * inf) * Math.min(1.4, g)); gl2(c, th[0], th[1], T * 0.6, TQ_HI, 0.12 * inf * g); }
    if (lu) { const k = (P.lure || 0.7) * live; gl2(c, lu[0], lu[1], T * (1.1 + 0.5 * k), TQ, 0.35 * Math.min(1.4, k)); gl2(c, lu[0], lu[1], T * 0.35, '#FFFFFF', 0.4 * Math.min(1, k)); }
    if (!lowFx()) for (const n of ['eyeL', 'eyeR']) { const e = at(n); if (e) gl2(c, e[0], e[1], T * 0.22, TQ_HI, 0.35 * live); } }
  /* ---- our telegraph art (on the ground layer, under everything that stands): a dark wash and a bold double boundary
     that read on the pale stone, a symbol and a countdown; and the flood's whole-floor warning with the refuge island ---- */
  function symbol(c, kind, x, y, r, col) { c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
    const stroke = (w, s) => { c.lineWidth = w + Math.max(2, r * 0.18); c.strokeStyle = 'rgba(4,14,20,.85)'; c.stroke(); c.lineWidth = w; c.strokeStyle = s; c.stroke(); };
    c.fillStyle = 'rgba(4,14,20,.55)'; c.beginPath(); c.arc(0, 0, r * 1.15, 0, TAU); c.fill();
    if (kind === 'jaw') { c.beginPath(); c.moveTo(-r * 0.8, -r * 0.35); for (let i = 0; i < 4; i++) { c.lineTo(-r * 0.8 + (i + 0.5) * r * 0.4, r * 0.15); c.lineTo(-r * 0.8 + (i + 1) * r * 0.4, -r * 0.35); } stroke(r * 0.14, col);
      c.beginPath(); c.moveTo(-r * 0.8, r * 0.45); for (let i = 0; i < 4; i++) { c.lineTo(-r * 0.8 + (i + 0.5) * r * 0.4, -r * 0.05); c.lineTo(-r * 0.8 + (i + 1) * r * 0.4, r * 0.45); } stroke(r * 0.14, col); }
    else if (kind === 'pull') { c.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, a = u * TAU * 1.6, rr = r * 0.85 * (1 - u * 0.85); i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } stroke(r * 0.13, col); }
    else if (kind === 'wave') { for (const dy of [-0.3, 0.15]) { c.beginPath(); for (let i = 0; i <= 16; i++) { const u = i / 16, xx = -r * 0.85 + u * r * 1.7, yy = dy * r + Math.sin(u * TAU * 1.5) * r * 0.18; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } stroke(r * 0.13, col); } }
    else if (kind === 'bell') { c.beginPath(); c.moveTo(-r * 0.25, -r * 0.6); c.quadraticCurveTo(-r * 0.3, r * 0.1, -r * 0.65, r * 0.42); c.lineTo(r * 0.65, r * 0.42); c.quadraticCurveTo(r * 0.3, r * 0.1, r * 0.25, -r * 0.6); c.closePath(); stroke(r * 0.12, col); c.beginPath(); c.arc(0, r * 0.58, r * 0.12, 0, TAU); c.fillStyle = col; c.fill(); }
    else if (kind === 'safe') { c.beginPath(); c.moveTo(0, -r * 0.75); c.lineTo(r * 0.62, -r * 0.42); c.lineTo(r * 0.5, r * 0.3); c.lineTo(0, r * 0.75); c.lineTo(-r * 0.5, r * 0.3); c.lineTo(-r * 0.62, -r * 0.42); c.closePath(); stroke(r * 0.12, col); c.beginPath(); c.moveTo(-r * 0.28, 0); c.lineTo(-r * 0.05, r * 0.25); c.lineTo(r * 0.32, -r * 0.2); stroke(r * 0.12, col); }
    c.restore(); }
  function boldPath(c, FX, s, T) { const X = FX.sx(s.x), Y = FX.sy(s.y), C = FX.C; c.beginPath();
    if (s.shape === 'circle') c.arc(X, Y, s.r * T, 0, TAU);
    else if (s.shape === 'cone') { c.moveTo(X, Y); c.arc(X, Y, s.len * T, s.a - s.spread, s.a + s.spread); c.closePath(); }
    else if (s.art === 'wave') { const X0 = FX.sx(C.x), Y0 = FX.sy(C.y), R = C.R * T; if (s.side > 0) { c.moveTo(X0, Y0 - R); c.arc(X0, Y0, R, -Math.PI / 2, Math.PI / 2); } else { c.moveTo(X0, Y0 + R); c.arc(X0, Y0, R, Math.PI / 2, Math.PI * 1.5); } c.closePath();
      for (const q of islandsOf(FX)) if (q.up > 0.5 && (q.x - C.x) * s.side > -ISL_R) { c.moveTo(FX.sx(q.x) + (ISL_R - 0.25) * T, FX.sy(q.y)); c.arc(FX.sx(q.x), FX.sy(q.y), (ISL_R - 0.25) * T, 0, TAU, true); } } }
  function drawGroundArt(c, FX, T, t) { const M = FX.mem; if (!M || !M.ok) return; const C = FX.C;
    for (const s of FX.S.tele) { if (!s.art || s.done) continue; const u = cl(s.age / s.t), left = Math.max(0, s.t - s.age), pul = 0.5 + 0.5 * Math.sin(t * (8 + 10 * u)), col = s.col || WARN;
      c.save(); boldPath(c, FX, s, T); c.fillStyle = `rgba(30,6,14,${0.14 + 0.12 * u})`; c.fill('evenodd');
      c.lineJoin = 'round'; c.lineWidth = Math.max(3, T * 0.2); c.strokeStyle = 'rgba(8,10,16,.75)'; c.stroke(); c.lineWidth = Math.max(1.5, T * 0.09); c.strokeStyle = rgba(col, 0.75 + 0.25 * pul); c.stroke();
      // the strike filling from its source
      if (s.shape === 'cone') { c.beginPath(); const X = FX.sx(s.x), Y = FX.sy(s.y); c.moveTo(X, Y); c.arc(X, Y, s.len * T * u, s.a - s.spread, s.a + s.spread); c.closePath(); c.fillStyle = rgba(col, 0.12 + 0.12 * u); c.fill(); }
      else if (s.shape === 'circle') { c.beginPath(); c.arc(FX.sx(s.x), FX.sy(s.y), s.r * T * (1 - u), 0, TAU); c.lineWidth = Math.max(1.5, T * 0.08); c.strokeStyle = rgba(TQ_HI, 0.5 + 0.3 * pul); c.stroke(); }
      c.restore();
      let sx, sy; if (s.shape === 'cone') { sx = FX.sx(s.x + Math.cos(s.a) * s.len * 0.55); sy = FX.sy(s.y + Math.sin(s.a) * s.len * 0.55); } else if (s.art === 'wave') { sx = FX.sx(C.x + s.side * C.R * 0.55); sy = FX.sy(C.y + 2); } else { sx = FX.sx(s.x); sy = FX.sy(s.y) + s.r * T * 0.55; }
      const r = Math.max(14, T * 0.85); symbol(c, s.art, sx, sy, r, s.locked ? '#FFFFFF' : col); textAt(c, String(Math.max(1, Math.ceil(left))), sx, sy + r * 1.75, r * 0.95, '#FFFFFF');
      if (s.locked) textAt(c, 'LOCKED', sx, sy - r * 1.7, r * 0.55, '#FFD0D8'); }
    // the Undertow's pull: chevrons flowing inward on rings round him
    const A = M.A; if (A && A.kind === 'undertow' && A.phase === 'pull' && FX.m) { const m = FX.m, X = FX.sx(m.x), Y = FX.sy(m.y), u = cl(A.t / TUNE.pullT); c.save(); c.globalAlpha = 0.5 + 0.4 * u;
      for (let ring = 0; ring < 3; ring++) { const rr = ((TUNE.pullR + 7) - ((t * (1.5 + 3 * u) + ring * 2.3) % 7)) * T; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + ring * 0.2, x = X + Math.cos(a) * rr, y = Y + Math.sin(a) * rr; c.save(); c.translate(x, y); c.rotate(a + Math.PI); c.beginPath(); c.moveTo(-T * 0.22, -T * 0.25); c.lineTo(T * 0.18, 0); c.lineTo(-T * 0.22, T * 0.25); c.lineWidth = Math.max(2.5, T * 0.13); c.strokeStyle = 'rgba(4,14,20,.6)'; c.stroke(); c.lineWidth = Math.max(1.2, T * 0.06); c.strokeStyle = TQ_HI; c.stroke(); c.restore(); } } c.restore(); }
    // the flood's warning: the whole platform darkened, the refuge island cut out of it, the bell and its countdown
    if (A && A.kind === 'bell' && A.i != null && (A.phase === 'call' || A.phase === 'rise')) { const s = islandsOf(FX)[A.i], X0 = FX.sx(C.x), Y0 = FX.sy(C.y), R = C.R * T, left = A.phase === 'call' ? TUNE.bellCall - A.t + TUNE.bellRise : TUNE.bellRise - A.t, k = cl(A.t / 0.6 + (A.phase === 'rise' ? 1 : 0)), pul = 0.5 + 0.5 * Math.sin(t * (5 + 8 * (1 - left / 12)));
      c.save(); c.beginPath(); c.arc(X0, Y0, R - 1, 0, TAU); c.moveTo(FX.sx(s.x) + ISL_R * T, FX.sy(s.y)); c.arc(FX.sx(s.x), FX.sy(s.y), ISL_R * T, 0, TAU, true); c.fillStyle = `rgba(10,30,40,${(0.12 + 0.1 * pul) * k})`; c.fill('evenodd');
      c.lineWidth = Math.max(3, T * 0.18); c.strokeStyle = 'rgba(8,10,16,.6)'; c.beginPath(); c.arc(X0, Y0, R - 1, 0, TAU); c.stroke(); c.lineWidth = Math.max(1.5, T * 0.08); c.strokeStyle = rgba(WARN, (0.5 + 0.4 * pul) * k); c.stroke(); c.restore();
      const sx = X0, sy = Y0 + T * 2.6, r = Math.max(16, T * 1.0); symbol(c, 'bell', sx, sy, r, TQ_HI); textAt(c, String(Math.max(1, Math.ceil(left))), sx, sy + r * 1.8, r, '#FFFFFF'); textAt(c, 'FLOOD', sx, sy - r * 1.75, r * 0.5, TQ_HI); }
    // an announced island: its refuge ring (dashed until it rises), the safe symbol and, before the flood, the count
    for (const s of islandsOf(FX)) { if (s.mark < 0.03) continue; const X = FX.sx(s.x), Y = FX.sy(s.y) - (0.12 + s.up * (ISL_UP - 0.12)) * ZK * T, R = ISL_R * T, k = s.mark;
      c.save(); c.globalAlpha = k; c.lineWidth = Math.max(3, T * 0.2); c.strokeStyle = 'rgba(8,10,16,.6)'; c.beginPath(); c.arc(X, Y, R + T * 0.25, 0, TAU); c.stroke(); c.lineWidth = Math.max(2, T * 0.1); c.strokeStyle = rgba(SAFE, 0.7 + 0.3 * Math.sin(t * 5)); if (s.up < 0.85) c.setLineDash([T * 0.5, T * 0.3]); c.stroke(); c.setLineDash([]); c.restore(); } }
  /* ================= v398 B5: the water effects on the GPU (Nidhogg's FGFX painter), at the model's fidelity =================
     Two passes. On the ground (drawn with the sea, under everything that stands and under the telegraphs' art): the slow
     rings his breathing stirs, the whirlpool of the Undertow, the wake of the torrent, the burst's ring, the toll's ripple
     over the sea, the flood's foam lines and its rim, the islands' wash, the backwash behind a wave, the bell's rings in the
     sea. Over everything: the water gathering in his jaws, the torrent itself (a dark churning body, a bright core, side
     streams, tumbling chunks, foam on its edges, mist, the impact at its front), the dome of the burst, the toll's shock
     round the bell, the sheets of water off a moving island, a wave's rolling crest (body, face, curling lip, foam, mist),
     the bell's breaking (a framed cinematic: the blow's flash, the column of the splash), the drain pouring off the rim, the
     sun. Solid water bodies (dark teal) carry the shapes on the pale stone; foam and light are laid over them softly. lowFx
     keeps the shapes and drops the mist, the particles and half the foam. Where FGFX cannot run, the 2D picture (drawFx2D). */
  const WDEEP = '#1B5E70', WBODY = '#2C8C98', WLITE = '#5FCAD2', WCREST = '#9BE9E4', MIST = '#CDEDEA';
  const hs1 = i => { const h = Math.sin(i * 127.1 + 31.7) * 43758.5453; return h - Math.floor(h); };
  function bellZ(M) { const fall = M.bellState === 'fall' ? ease(cl((M.bellFallT || 0) / 1.3)) : 0; return (lerp(4.3, -1.7, fall) - 1.3) * VIS; }   // (the bell's waist, tiles over the platform)
  function groundFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !M.ok || !m) return; const F = fg(); if (!F) return;
    const lf = lowFx(), C = FX.C, Q = F.begin(c, null), lvl = M.lvl == null ? SEA0 : M.lvl, X0 = FX.sx(C.x), Y0 = FX.sy(C.y), R = C.R * T, A = M.A, GYs = 0.62;
    const wz = Math.max(0, lvl) * ZK * T;   // (where the water's surface shows over the platform)
    try {
      // his breathing: slow rings from his flanks
      if (!m.dead && m.act === 'fight' && !lf) { const ph = (M.bt || 0) * 0.45; for (let i = 0; i < 2; i++) { const u = (ph + i * 0.5) % 1; Q.ripple(FX.sx(m.x), FX.sy(m.y) - wz, T * (2.6 + u * 4.5), TQ, 0.3 * (1 - u), i + 3, GYs, 0.07); } }
      // the Undertow: a whirlpool, water streaking in along spirals, flecks of foam drawn to him
      if (A && A.kind === 'undertow' && (A.phase === 'wind' || A.phase === 'pull')) { const u = A.phase === 'wind' ? cl(A.t / 0.45) * 0.25 : 0.25 + 0.75 * cl(A.t / TUNE.pullT), X = FX.sx(m.x), Y = FX.sy(m.y) - wz, rr = (TUNE.pullR + 4.5) * T;
        Q.smoke(X, Y, rr * 0.6, 0.3 + 0.3 * u, 2, WDEEP, 0.3); Q.evortex(X, Y, rr, WBODY, 0.6 + 0.35 * u, 0.55 + 0.45 * u, 3, 1 + 2.5 * u, GYs); Q.evortex(X, Y, rr * 0.62, WLITE, 0.75, 0.45 + 0.45 * u, 4, 1.6 + 3 * u, GYs); Q.caustic(X, Y, rr * 0.8, TQ, 0.2 + 0.2 * u, 5, GYs);
        for (let i = 0; i < (lf ? 1 : 3); i++) { const v = (t * (0.35 + 0.6 * u) + i / 3) % 1, r2 = rr * (1 - 0.8 * v); Q.wring(X, Y, r2, r2 * GYs, t * (0.5 + u) + i, WBODY, (0.25 + 0.4 * u) * Math.sin(v * Math.PI), 2, 0.07, 5 + i, 2 + 2 * u); }
        const ns = lf ? 5 : 9; for (let i = 0; i < ns; i++) { const ph = (t * (0.3 + 0.8 * u) + i / ns) % 1, a0 = i / ns * TAU + t * (0.5 + 1.5 * u); let pv = null;
          for (let j = 0; j <= 3; j++) { const v = cl(ph + j * 0.075), r = rr * (1 - v) * 0.95 + T * 1.3, a = a0 + v * 2.6, p = [X + Math.cos(a) * r, Y + Math.sin(a) * r * GYs];
            if (pv) Q.wstream(pv[0], pv[1], p[0], p[1], T * (0.2 + 0.28 * v) * (0.6 + 0.6 * u), WBODY, (0.3 + 0.55 * u) * Math.sin(Math.min(1, v * 1.15) * Math.PI), i * 3 + j, 6, 0.9, 1.0); pv = p; } }
        if (!lf) for (let i = 0; i < 12; i++) { const v = (t * (0.35 + 0.9 * u) + i * 0.137) % 1, a = i * 2.39 + v * 3.2, r = rr * (1 - v) + T; Q.spray(X + Math.cos(a) * r, Y + Math.sin(a) * r * GYs, T * 0.42, FOAM, 0.35 * u * Math.sin(v * Math.PI), i + 20, 0.3, 0.6); } }
      for (const f of M.fx) { const u = f.t / f.life;
        if (f.kind === 'torrent') { const env = Math.min(1, f.t / 0.12) * (1 - sstep(0.6, 1, u)), reach = sstep(0, 0.35, f.t), ca = Math.cos(f.a), sa = Math.sin(f.a);
          for (let i = 0; i < (lf ? 3 : 5); i++) { const d = (0.18 + i * 0.18) * TUNE.jawLen * reach, x = FX.sx(f.x + ca * d), y = FX.sy(f.y + sa * d) - wz, w = (0.6 + d * Math.tan(TUNE.jawSp)) * T;
            Q.caustic(x, y, w * 1.1, TQ, 0.3 * env, i + 2, GYs); if (i % 2 === 0) Q.ripple(x, y, w * (0.8 + 0.6 * ((t * 2 + i * 0.3) % 1)), FOAM, 0.18 * env, i + 9, GYs, 0.05); }
          const fx2 = FX.sx(f.x + ca * TUNE.jawLen * reach * 0.95), fy2 = FX.sy(f.y + sa * TUNE.jawLen * reach * 0.95) - wz; Q.ripple(fx2, fy2, T * (1.5 + 3 * u), FOAM, 0.35 * env, 4, GYs, 0.06); }
        else if (f.kind === 'burst') { const X = FX.sx(f.x), Y = FX.sy(f.y) - wz, rr = f.r * T * (0.3 + 0.85 * ease(Math.min(1, u * 1.5))), env = Math.pow(1 - u, 1.3);
          Q.wring(X, Y, rr, rr * GYs, 0, WBODY, 0.5 * env, 2, 0.12, 4, 1); Q.ripple(X, Y, rr * 1.04, FOAM, 0.4 * env, 2, GYs, 0.07); Q.caustic(X, Y, rr * 0.9, TQ, 0.45 * env, 3, GYs); if (!lf) Q.ripple(X, Y, rr * 0.7, TQ_HI, 0.35 * env, 8, GYs, 0.05); }
        else if (f.kind === 'toll') { const B = ARENA.bell(C), X = FX.sx(B.x), Y = FX.sy(B.y + 0.8) - lvl * ZK * T, col = m.dead ? GOLD : TQ_HI;
          for (let i = 0; i < (lf ? 1 : 3); i++) { const v = u * 1.25 - i * 0.16; if (v <= 0 || v >= 1) continue; Q.ripple(X, Y, T * (2 + 26 * ease(v)), col, 0.4 * f.k * (1 - v), 12 + i, GYs, 0.035); } }
        else if (f.kind === 'crest') { const env = Math.sin(Math.min(1, u * 1.2) * Math.PI); for (let i = 0; i < (lf ? 1 : 3); i++) { const v = cl(u * 1.4 - i * 0.18); if (v <= 0 || v >= 1) continue; Q.ripple(X0, Y0 - wz, R * (0.15 + 0.9 * ease(v)), FOAM, 0.35 * env * (1 - v), 30 + i, 1, 0.045); } }
        else if (f.kind === 'splash') { const X = FX.sx(f.x), Y = FX.sy(f.y) - lvl * ZK * T; for (let i = 0; i < (lf ? 2 : 4); i++) { const v = cl(u * 1.3 - i * 0.13); if (v <= 0 || v >= 1) continue; Q.ripple(X, Y, T * (1.5 + 18 * ease(v)), i % 2 ? TQ : FOAM, 0.6 * (1 - v), 40 + i, GYs, 0.05); } Q.caustic(X, Y, T * (3 + 4 * u), TQ, 0.5 * (1 - u), 41, GYs); } }
      // the flood: its rim against the parapet, foam lines drawn in from the edge, light through it
      if (lvl > 0.02) { const Yw = Y0 - wz, k = cl(lvl / 0.35), rising = A && A.kind === 'bell' && A.phase === 'rise';
        Q.ripple(X0, Yw, R * 1.004, FOAM, 0.42 * k, 7, 1, 0.035); Q.ripple(X0, Yw, R * 0.985, TQ_HI, 0.18 * k, 8, 1, 0.025);
        for (let i = 0; i < (lf ? 2 : 4); i++) { const v = (t * (rising ? 0.1 : 0.05) + i / 4) % 1; Q.ripple(X0, Yw, R * (1 - 0.6 * v), FOAM, 0.2 * k * Math.sin(v * Math.PI), 11 + i, 1, 0.022); }
        if (!lf) Q.caustic(X0, Yw, R * 0.95, TQ, 0.2 * k, 9, 1);
        if (rising && !lf) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.floor(t * 1.5 + i) * 0.9, ph = (t * 1.5 + i * 0.37) % 1; Q.spray(X0 + Math.cos(a) * R * 0.99, Yw + Math.sin(a) * R * 0.99, T * 1.1, FOAM, 0.45 * Math.sin(ph * Math.PI), i + 60, ph, 0.6); } }
      // the islands: foam at their waterline, wash round a moving one
      for (const s2 of islandsOf(FX)) { if (s2.up < 0.02 && !(s2.sheet > 0.02)) continue; const h = 0.12 + s2.up * (ISL_UP - 0.12), zb = Math.max(0, lvl), X = FX.sx(s2.x), Y = FX.sy(s2.y) - zb * ZK * T;
        if (lvl > 0.02 && zb < h) Q.ripple(X, Y, ISL_R * T * 1.03, FOAM, 0.55, 50 + s2.i, 1, 0.07);
        if (s2.sheet > 0.02) { Q.ripple(X, Y, ISL_R * T * (1.05 + 0.35 * ((t * 1.4) % 1)), lvl > 0.02 ? FOAM : '#D8DCCF', 0.45 * s2.sheet, 53 + s2.i, 1, 0.06); Q.caustic(X, Y, ISL_R * T * 1.3, TQ, 0.25 * s2.sheet, 56 + s2.i, 1); } }
      // behind a wave: the backwash spreading over the stone it has crossed
      for (const w of M.waves) { const env = Math.min(1, w.t * 3) * (w.d < 0.5 ? cl((w.d + 0.6) / 1.1) : 1), d0 = Math.max(0, w.d); if (env < 0.02) continue;
        for (let j = 0; j < (lf ? 2 : 4); j++) { const dd = d0 + 1.2 + j * 2.6; if (dd > C.R - 0.5) break; const half = Math.sqrt(Math.max(0, C.R * C.R - dd * dd)); for (let i = -1; i <= 1; i++) { const x = FX.sx(C.x + w.side * dd), y = FX.sy(C.y + i * half * 0.55) - wz; Q.caustic(x, y, T * 2.2, TQ, 0.35 * env * (1 - j * 0.2), j * 3 + i + 70, GYs); } }
        const dd = d0 + 0.6, half = Math.sqrt(Math.max(0, C.R * C.R - dd * dd)); if (half > 0.5) Q.wstream(FX.sx(C.x + w.side * dd), FX.sy(C.y - half) - wz, FX.sx(C.x + w.side * dd), FX.sy(C.y + half) - wz, T * 0.9, WBODY, 0.35 * env, 77, 2, 0.6, 1.0); }
      // the drain: the last of the water sliding off the platform to its rim
      if (m.dead && M.deadT != null && M.deadT < 4.5 && !lf) { const k = sstep(0, 0.4, M.deadT) * (1 - sstep(2.6, 4.2, M.deadT)); for (let i = 0; i < 3; i++) { const v = (M.deadT * 0.35 + i / 3) % 1; Q.ripple(X0, Y0, R * (0.3 + 0.7 * v), FOAM, 0.25 * k * Math.sin(v * Math.PI), 80 + i, 1, 0.03); } }
    } finally { F.flush(c); } }
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !M.ok || !m) return; const F = fg(); if (!F) { drawFx2D(c, FX, T, t); return; }
    const lf = lowFx(), C = FX.C, Q = F.begin(c, null), lvl = M.lvl == null ? SEA0 : M.lvl, wz = Math.max(0, lvl) * ZK * T, A = M.A, GYs = 0.62;
    try {
      const a = MODEL.headOf(M.th), at = n => { const q = MODEL.anchorAt(n, m.x, m.y, a, M.P, 1, M.bt || 0); return q ? [FX.sx(q.x), FX.sy(q.y) - q.z * ZK * T, q.z] : null; };
      const P3 = (x, y, z) => [FX.sx(x), FX.sy(y) - (z || 0) * ZK * T];
      /* ---- Jaw of the Deep, the wind-up: water wells up in his jaws, the throat glows through its slits, droplets are drawn
         in; locked, a ring of light pulses at the mouth ---- */
      if (A && A.kind === 'jaw' && A.phase === 'wind' && !m.dead) { const k2 = cl(A.t / (TUNE.jawTrack + TUNE.jawLock)), mo = at('mouth'), th = at('throat');
        if (th) Q.glow(th[0], th[1], T * (1.6 + 1.6 * k2), TQ, 0.18 + 0.4 * k2);
        if (mo) { Q.glow(mo[0], mo[1], T * (1.0 + 1.8 * k2), TQ, 0.2 + 0.45 * k2); Q.wsphere(mo[0], mo[1], T * (0.25 + 0.6 * k2), WBODY, 0.45 + 0.45 * k2, 3, 2.6, 0.75, 1.0);
          if (!lf) { Q.bubbles(mo[0], mo[1] - T * 0.2, T * (0.6 + 0.9 * k2), T * (0.5 + 0.7 * k2), TQ_HI, 0.45 * k2, 4, 1.5);
            for (let i = 0; i < 9; i++) { const v = (t * 1.1 + i / 9) % 1, r = T * (3.4 * (1 - v) + 0.35), aa = i * 0.7 + t * 0.8; Q.spray(mo[0] + Math.cos(aa) * r, mo[1] + Math.sin(aa) * r * 0.7, T * 0.32, FOAM, 0.5 * k2 * Math.sin(v * Math.PI), i + 5, 0.2, 1); } }
          if (A.locked) Q.ripple(mo[0], mo[1], T * (0.9 + 1.6 * ((t * 2.5) % 1)), TQ_HI, 0.5 * (1 - (t * 2.5) % 1), 2, 1, 0.08); } }
      for (const f of M.fx) { const u = f.t / f.life;
        /* ---- the torrent: a deep churning body widening down the cone, a bright core, two side streams, tumbling chunks,
           foam along both edges, mist over it, and the impact at its front (it reaches its length in a third of a second) ---- */
        if (f.kind === 'torrent') { const env = Math.min(1, f.t / 0.1) * (1 - sstep(0.62, 1, u)), reach = sstep(0, 0.35, f.t), ca = Math.cos(f.a), sa = Math.sin(f.a), mo = at('mouth'), L = TUNE.jawLen * reach;
          const pt = (d, off, z) => { const px = -sa * off, py = ca * off; return P3(f.x + ca * d + px, f.y + sa * d + py, z); }, zAt = d => lerp(mo ? mo[2] : 2, 0.45, sstep(0, 3.5, d)) + Math.max(0, lvl), wAt = d => 0.55 + d * Math.tan(TUNE.jawSp) * 0.8;
          const N = lf ? 5 : 8, seg = (off, wk, col, al, dens, lite, sd) => { let pv = mo && off === 0 ? [mo[0], mo[1]] : pt(0.2, off * 0.2, zAt(0.2)); for (let i = 1; i <= N; i++) { const d = L * i / N, p = pt(d, off * wAt(d), zAt(d)); Q.wstream(pv[0], pv[1], p[0], p[1], wAt(d) * wk * T, col, al, sd + i * 0.31, 7, dens, lite); pv = p; } };
          for (let i = 1; i <= (lf ? 3 : 5); i++) { const d = L * (i - 0.4) / (lf ? 3 : 5), p = pt(d, 0, zAt(d) * 0.6); Q.smoke(p[0], p[1], wAt(d) * T * 1.05, 0.42 * env, i + 24, WDEEP, 0.35); }   // (the mass of the water: dark and soft, so the torrent reads on the pale stone)
          seg(0, 0.95, WDEEP, 0.85 * env, 1.0, 0.55, 1); if (!lf) { seg(-0.55, 0.42, WBODY, 0.7 * env, 0.85, 0.85, 7); seg(0.55, 0.42, WBODY, 0.7 * env, 0.85, 0.85, 13); } seg(0, 0.42, WLITE, 0.8 * env, 0.55, 1.25, 19);
          for (let i = 0; i < (lf ? 5 : 9); i++) { const k = (i / (lf ? 5 : 9) + f.t * 1.7) % 1, d = k * L, off = Math.sin(i * 2.3 + f.t * 6) * 0.35 * wAt(d), p = pt(d, off, zAt(d) + 0.3 * Math.sin(k * Math.PI)); Q.wsphere(p[0], p[1], wAt(d) * T * 0.42, '#3FB8C0', 0.6 * env * Math.sin(Math.min(1, k * 1.2) * Math.PI), i + 30, 2.2, 0.8, 1.0); }
          for (let i = 1; i <= (lf ? 4 : 8); i++) { const d = L * i / (lf ? 4 : 8); for (const sd2 of [-1, 1]) { const p = pt(d, sd2 * wAt(d) * 0.92, zAt(d) + 0.15); Q.spray(p[0], p[1], wAt(d) * T * 0.5, FOAM, 0.32 * env, i * 2 + (sd2 > 0 ? 1 : 0) + Math.floor(f.t * 8) * 0.13, 0.55, 0.8); } }
          const fr = pt(L * 0.97, 0, 0.5 + Math.max(0, lvl)); Q.spray(fr[0], fr[1] - T * 0.6, T * (1.8 + 1.4 * u), FOAM, 0.5 * env, 3 + Math.floor(f.t * 10) * 0.21, cl(u * 1.5), 0.8); Q.wsphere(fr[0], fr[1], T * 1.1 * env, WBODY, 0.55 * env, 9, 3, 0.8, 1);
          if (!lf) { for (let i = 0; i < 4; i++) { const d = L * (0.3 + i * 0.22), p = pt(d, 0, zAt(d) + 1.1 + 0.6 * u); Q.smoke(p[0], p[1], wAt(d) * T * 0.9, 0.18 * env, i + 40 + f.t, MIST, 0.7); } Q.smoke(fr[0], fr[1] - T * 1.6, T * (2.2 + 2 * u), 0.25 * env, 44, MIST, 0.7); }
          if (mo) { Q.glow(mo[0], mo[1], T * 2.4, TQ, 0.45 * env); Q.glow(mo[0], mo[1], T * 0.8, '#E8FFFC', 0.3 * env); } }
        /* ---- the burst: a dome of water heaving up round him and falling back, a crown of spray round its rim, a column of
           spray at its heart, mist rolling out ---- */
        else if (f.kind === 'burst') { const X = FX.sx(f.x), Y = FX.sy(f.y) - wz, rr = f.r * T * (0.3 + 0.8 * ease(Math.min(1, u * 1.5))), env = Math.pow(1 - u, 1.2), hk = Math.sin(Math.min(1, u * 1.3) * Math.PI);
          Q.wsphere(X, Y - rr * 0.32 * hk, rr * (0.55 + 0.1 * hk), WBODY, 0.38 * env, 2, 1.6, 0.45, 1.1); Q.glow(X, Y - T, rr * 0.9, TQ, 0.45 * env * (1 - u));
          const nc = lf ? 8 : 14; for (let i = 0; i < nc; i++) { const aa = i / nc * TAU + 0.3, x = X + Math.cos(aa) * rr, y = Y + Math.sin(aa) * rr * GYs, lift = T * (0.8 + 2.4 * hk) * (0.75 + 0.5 * hs1(i));
            Q.wsphere(x, y - lift * 0.4, T * (0.75 + 0.5 * hs1(i + 3)) * env, '#3FB8C0', 0.6 * env, i + 50, 2, 0.8, 1); Q.spray(x, y - lift, T * (1.0 + 0.8 * u), FOAM, 0.4 * env, i + 60 + Math.floor(f.t * 9) * 0.17, cl(u * 1.4), 0.9); }
          Q.spray(X, Y - T * (1.5 + 3.5 * hk), T * (1.6 + 1.6 * u), FOAM, 0.45 * env, 70, cl(u * 1.2), 1.1);
          if (!lf) for (let i = 0; i < 5; i++) { const aa = i / 5 * TAU + 1, r2 = rr * (0.8 + 0.5 * u); Q.smoke(X + Math.cos(aa) * r2, Y + Math.sin(aa) * r2 * GYs - T * 0.8, T * (1.6 + 1.4 * u), 0.2 * env, i + 80, MIST, 0.7); } }
        /* ---- the toll: a shock of sound round the bell (rings of light), the bell's lip flaring ---- */
        else if (f.kind === 'toll') { const B = ARENA.bell(C), bp = P3(B.x, B.y, bellZ(M)), col = m.dead ? GOLD : f.cracked ? '#FFD0D8' : TQ_HI;
          Q.glow(bp[0], bp[1], T * (3 + 2 * u), m.dead ? '#FFD9A0' : TQ, 0.5 * f.k * (1 - u));
          for (let i = 0; i < (lf ? 2 : 3); i++) { const v = u * 1.3 - i * 0.2; if (v <= 0 || v >= 1) continue; Q.ripple(bp[0], bp[1], T * (1.6 + 9 * ease(v)), col, 0.4 * f.k * (1 - v), 20 + i, 1, 0.04); } }
        /* ---- the bell's breaking: the blow's flash on the yoke, a shock ring, dust and splinters (BREAK_FX does the pieces) ---- */
        else if (f.kind === 'smash') { const B = ARENA.bell(C), yp = P3(B.x, B.y, 4.6 * VIS), env = 1 - u;
          Q.glow(yp[0], yp[1], T * (2.2 + 2 * u), '#FFF4E0', 0.45 * env * env); Q.ripple(yp[0], yp[1], T * (1.5 + 8 * ease(u)), '#FFE9D0', 0.4 * env, 90, 1, 0.04);
          if (!lf) for (let i = 0; i < 6; i++) { const aa = i / 6 * TAU, r2 = T * (1 + 4 * ease(u)); Q.smoke(yp[0] + Math.cos(aa) * r2, yp[1] + Math.sin(aa) * r2 * 0.6 + T * 2 * u, T * (1.2 + 1.5 * u), 0.3 * env, i + 92, '#B8B6A8', 0.5); } }
        /* ---- the bell into the sea: a tall column of water and its crown, chunks thrown up and falling back, mist ---- */
        else if (f.kind === 'splash') { const X = FX.sx(f.x), Y = FX.sy(f.y) - lvl * ZK * T, env = 1 - sstep(0.55, 1, u), up = Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5), fallK = sstep(0.35, 1, u);
          for (let j = 0; j < (lf ? 4 : 7); j++) { const k = j / 6, hgt = T * 9 * up * k * (1 - 0.55 * fallK), r2 = T * (1.9 - 1.1 * k) * (1 - 0.4 * fallK); Q.wsphere(X + Math.sin(j * 1.7 + u * 4) * T * 0.3, Y - hgt, r2, j < 3 ? WBODY : '#4FC0C8', 0.6 * env * (1 - 0.4 * k), j + 100, 2.5, 0.8, 1.05); Q.spray(X, Y - hgt, r2 * 1.3, FOAM, 0.5 * env, j + 110 + Math.floor(f.t * 7) * 0.2, cl(u * 1.3), 1); }
          const nc = lf ? 6 : 12; for (let i = 0; i < nc; i++) { const aa = i / nc * TAU, r2 = T * (1.5 + 5 * ease(u)), hh = T * 7 * u * (1 - u) * (0.7 + 0.6 * hs1(i)); Q.wsphere(X + Math.cos(aa) * r2, Y + Math.sin(aa) * r2 * GYs - hh, T * 0.7 * env, '#3FB8C0', 0.55 * env, i + 120, 2, 0.8, 1); Q.spray(X + Math.cos(aa) * r2, Y + Math.sin(aa) * r2 * GYs - hh, T * 1.1, FOAM, 0.55 * env, i + 130, cl(u * 1.5), 0.9); }
          Q.glow(X, Y - T * 4 * up, T * 6, TQ, 0.35 * env); if (!lf) for (let i = 0; i < 6; i++) { const aa = i / 6 * TAU + 0.4, r2 = T * (2.5 + 5 * u); Q.smoke(X + Math.cos(aa) * r2, Y + Math.sin(aa) * r2 * GYs - T * (2 + 2 * u), T * (2.5 + 2 * u), 0.28 * env, i + 140, MIST, 0.7); } }
        /* ---- the flood's crest: a surge of spray round the whole rim, white water rolling in ---- */
        else if (f.kind === 'crest') { const X0 = FX.sx(C.x), Y0 = FX.sy(C.y) - wz, R = C.R * T, env = Math.sin(Math.min(1, u * 1.2) * Math.PI), nc = lf ? 10 : 20;
          for (let i = 0; i < nc; i++) { const aa = i / nc * TAU, r2 = R * (1 - 0.35 * ease(u)); Q.spray(X0 + Math.cos(aa) * r2, Y0 + Math.sin(aa) * r2 - T * (0.6 + 1.6 * env), T * (1.4 + 0.8 * u), FOAM, 0.38 * env, i + 150, cl(u * 1.3), 0.8); if (!lf && i % 2 === 0) Q.wsphere(X0 + Math.cos(aa) * r2, Y0 + Math.sin(aa) * r2 - T * 0.5, T * 0.9 * env, WBODY, 0.45 * env, i + 170, 2, 0.8, 1); } } }
      /* ---- an island moving: sheets of water pouring off its sides, spray where they land, a drip of light at the top ---- */
      for (const s2 of islandsOf(FX)) { const k = s2.sheet || 0; if (k < 0.02) continue; const h = 0.12 + s2.up * (ISL_UP - 0.12), zb = Math.max(0, lvl) + 0.02; if (h - zb < 0.08) continue; const n = lf ? 4 : 7;
        for (let i = 0; i < n; i++) { const th = Math.PI * (0.1 + 0.8 * i / (n - 1)) + 0.05 * Math.sin(t * 3 + i), cx = s2.x + Math.cos(th) * ISL_R * 0.99, cy = s2.y + Math.sin(th) * ISL_R * 0.99, top = P3(cx, cy, h), bot = P3(cx, cy, zb), w = T * (0.22 + 0.12 * hs1(i + s2.i * 7)) * (0.7 + 0.3 * Math.abs(Math.sin(th)));
          Q.wstream(top[0], top[1], bot[0], bot[1], w, '#4FB8C4', 0.6 * k, i + s2.i * 10, 8, 0.55, 1.1); Q.spray(bot[0], bot[1], T * 0.75, FOAM, 0.5 * k, i + s2.i * 10 + Math.floor(t * 6) * 0.19, 0.5, 0.6);
          if (!lf && i % 2 === 0) Q.glow(top[0], top[1], T * 0.5, TQ_HI, 0.35 * k); }
        if (!lf) { const p = P3(s2.x, s2.y + ISL_R * 0.9, zb); Q.smoke(p[0], p[1] - T * 0.6, T * 2.2, 0.16 * k, 190 + s2.i, MIST, 0.7); } }
      /* ---- a wave: a rolling crest along the front (a dark body, its face, a curling lip leaning in the way it goes), foam on
         the lip and white water at its foot, mist over it ---- */
      for (const w of M.waves) { const Rr = C.R, d = Math.max(0, w.d), half = Math.sqrt(Math.max(0, Rr * Rr - d * d)), env = Math.min(1, w.t * 4) * (w.d < 0.5 ? cl((w.d + 0.6) / 1.1) : 1); if (half < 0.3 || env < 0.02) continue;
        const xw = C.x + w.side * d, y0w = C.y - half, n = Math.max(3, Math.ceil(half * 2 / (lf ? 1.5 : 1.0))), pts = [];
        for (let i = 0; i <= n; i++) { const yw = lerp(y0w, C.y + half, i / n), edge = Math.min(1, Math.min(i, n - i) / 2 + 0.25), hh = (1.5 + 0.35 * Math.sin(i * 1.7 + t * 5)) * (0.55 + 0.45 * env) * edge; pts.push({ yw, hh, edge }); }
        const S2 = (dx, yw, z) => P3(xw + dx, yw, z + Math.max(0, lvl));
        // (layers from behind to the front: the sheet of water following it, its dark mass, the body, the face, the curling lip;
        // every layer sinuous along the front, so it reads as a rolling wave and never as a bar)
        const wig = (yw, k) => Math.sin(yw * 0.9 + t * 2.4 + k) * 0.32 + Math.sin(yw * 2.3 - t * 3.1 + k * 2) * 0.12;
        const band = (dx, zk, wk, col, al, flow, dens, lite, sd, wigK) => { for (let i = 0; i < n; i++) { const p0 = pts[i], p1 = pts[i + 1], ek = (p0.edge + p1.edge) / 2, a0 = S2(w.side * dx + wig(p0.yw, sd) * wigK, p0.yw, p0.hh * zk), a1 = S2(w.side * dx + wig(p1.yw, sd) * wigK, p1.yw, p1.hh * zk);
          Q.wstream(a0[0], a0[1], a1[0], a1[1], T * wk * ek, col, al * env, sd + i * 0.7, flow, dens, lite); } };
        band(2.3, 0.05, 2.0, WBODY, 0.3, 2, 0.55, 0.8, 1, 0.5);
        for (let i = 0; i <= n; i += (lf ? 2 : 1)) { const p = pts[i], q = S2(w.side * 1.3 + wig(p.yw, 5) * 0.6, p.yw, p.hh * 0.25); Q.smoke(q[0], q[1], T * 1.7 * p.edge, 0.6 * env, i + 180, WDEEP, 0.3); }   // (the water's dark mass)
        band(0.75, 0.35, 1.5, WDEEP, 0.85, 2, 1.0, 0.5, 9, 0.8);
        band(0.25, 0.62, 0.95, WBODY, 0.85, 3, 0.85, 1.0, 17, 1.0);
        band(-0.2, 0.92, 0.5, WCREST, 0.6, 6, 0.6, 1.0, 23, 1.15);
        for (let i = 0; i <= n; i++) { const p = pts[i]; if (!lf || i % 2 === 0) { const q = S2(-w.side * 0.3 + wig(p.yw, 23) * 1.15, p.yw, p.hh * 0.98); Q.spray(q[0], q[1], T * 0.95 * p.edge, FOAM, 0.36 * env, i + 200 + Math.floor(t * 8) * 0.17, 0.45, 0.8); }
          if (i % 2 === 0) { const q = S2(-w.side * 0.6 + wig(p.yw, 3) * 0.8, p.yw, 0.05); Q.spray(q[0], q[1], T * 1.1 * p.edge, FOAM, 0.28 * env, i + 260 + Math.floor(t * 8) * 0.13, 0.7, 0.5); }
          if (!lf && i % 3 === 0) { const q = S2(w.side * 0.2, p.yw, p.hh * 1.35); Q.smoke(q[0], q[1], T * 1.4, 0.18 * env, i + 300, MIST, 0.7); } } }
      /* ---- the drain: the last of the sea pouring off the rim into the falling water, spray at its foot, mist ---- */
      if (m.dead && M.deadT != null && M.deadT < 5 && lvl < -0.25) { const k = sstep(0.1, 0.5, M.deadT) * (1 - sstep(3.2, 4.8, M.deadT)), n = lf ? 5 : 9;
        for (let i = 0; i < n; i++) { const th = Math.PI * (0.08 + 0.84 * i / (n - 1)), rx = C.x + Math.cos(th) * C.R, ry = C.y + Math.sin(th) * C.R, top = P3(rx, ry, 0.05), bot = P3(rx, ry, lvl), w = T * (0.3 + 0.2 * hs1(i + 7));
          Q.wstream(top[0], top[1], bot[0], bot[1], w, '#4FB8C4', 0.6 * k, i + 310, 8, 0.6, 1.1); Q.spray(bot[0], bot[1], T * 1.0, FOAM, 0.5 * k, i + 330 + Math.floor(t * 6) * 0.2, 0.6, 0.6);
          if (!lf && i % 2 === 0) Q.smoke(bot[0], bot[1] - T * 0.8, T * 1.8, 0.15 * k, i + 350, MIST, 0.7); } }
      /* ---- the sun breaking through at the fall: warm shafts, glints on the wet stone ---- */
      const sun = M.sun || 0; if (sun > 0.02) { const cv = c.canvas, m0 = c.getTransform(), W = cv.width / (m0.a || 1), H = cv.height / (m0.d || 1), sx0 = -m0.e / (m0.a || 1), sy0 = -m0.f / (m0.d || 1);
        for (let i = 0; i < (lf ? 2 : 4); i++) { const x = sx0 + W * (0.1 + i * 0.22), w2 = W * 0.12; Q.shafts(x - W * 0.2, sy0 - 20, x + W * 0.1, sy0 + H, w2, '#FFD9A0', 0.32 * sun, i); } Q.glow(sx0 + W * 0.15, sy0, W * 0.6, '#FFD9A0', 0.25 * sun);
        if (!lf) for (let i = 0; i < 10; i++) { const aa = hs1(i + 400) * TAU, rr = Math.sqrt(hs1(i + 410)) * (C.R - 1.5), tw = Math.max(0, Math.sin(t * 2.2 + i * 1.9)); if (tw < 0.2) continue; const p = P3(C.x + Math.cos(aa) * rr, C.y + Math.sin(aa) * rr, 0.05); Q.star(p[0], p[1], T * 0.5, 0.5 * sun * tw, '#FFF2D8'); } }
    } finally { F.flush(c); }
    // the bell's breaking framed as a cinematic: soft bars in from the top and bottom of the screen
    if (A && A.kind === 'break' && A.phase !== 'wind' && !lf) { const k = A.phase === 'rear' ? sstep(0, 0.5, A.t) : 1 - sstep(1.6, 2.0, A.t), cv = c.canvas; if (k > 0.01) { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); const H = cv.height, Wd = cv.width, bh = H * 0.1 * k;
        for (const top of [true, false]) { const g = c.createLinearGradient(0, top ? 0 : H, 0, top ? bh * 1.6 : H - bh * 1.6); g.addColorStop(0, 'rgba(2,6,10,.92)'); g.addColorStop(0.6, 'rgba(2,6,10,.75)'); g.addColorStop(1, 'rgba(2,6,10,0)'); c.fillStyle = g; c.fillRect(0, top ? 0 : H - bh * 1.6, Wd, bh * 1.6); }
        c.restore(); } } }
  /* ---- (the 2D picture of the effects, where Nidhogg's GPU painter cannot run: v391's, kept as it was) ---- */
  function drawFx2D(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !M.ok || !m) return; const lf = lowFx(), F = null, Q = null, C = FX.C;
    try {
      const a = MODEL.headOf(M.th), at = n => { const q = MODEL.anchorAt(n, m.x, m.y, a, M.P, 1, M.bt || 0); return q ? [FX.sx(q.x), FX.sy(q.y) - q.z * ZK * T] : null; };
      // the idle stirs the water round him: slow rings from his flanks (the throat's breath)
      if (!m.dead && !lf && m.act === 'fight') { const ph = (M.bt || 0) * 0.45; for (let i = 0; i < 2; i++) { const u = (ph + i * 0.5) % 1, X = FX.sx(m.x), Y = FX.sy(m.y), rr = T * (2.6 + u * 4.5);
          if (Q) Q.ripple(X, Y, rr, TQ, 0.35 * (1 - u), i + 3, 0.62, 0.08); else { c.save(); c.strokeStyle = rgba(FOAM, 0.3 * (1 - u)); c.lineWidth = Math.max(1, T * 0.08); c.beginPath(); c.ellipse(X, Y, rr, rr * 0.62, 0, 0, TAU); c.stroke(); c.restore(); } } }
      for (const f of M.fx) { const u = f.t / f.life;
        if (f.kind === 'torrent') { const env = Math.min(1, f.t / 0.12) * (1 - sstep(0.7, 1, u)), mo = at('mouth') || [FX.sx(f.x), FX.sy(f.y)];
          for (let i = 0; i < 12; i++) { const k = ((i / 12 + f.t * 1.6) % 1), d = k * TUNE.jawLen, w = 0.4 + d * Math.tan(TUNE.jawSp) * 0.85, x = FX.sx(f.x + Math.cos(f.a) * d), y = FX.sy(f.y + Math.sin(f.a) * d) - T * 0.4, j = sstep(0, 0.4, k), px = lerp(mo[0], x, j), py = lerp(mo[1], y, j);
            if (Q) { Q.wsphere(px, py, w * T * 0.8, '#3FB8C0', 0.55 * env, i, 1, 0.8, 0.9); Q.spray(px, py, w * T, FOAM, 0.4 * env, i, 0.6); } else { gl2(c, px, py, w * T, TQ, 0.5 * env); gl2(c, px, py, w * T * 0.4, '#FFFFFF', 0.35 * env * (1 - k)); } }
          if (Q) { const e = [FX.sx(f.x + Math.cos(f.a) * TUNE.jawLen * 0.9), FX.sy(f.y + Math.sin(f.a) * TUNE.jawLen * 0.9)]; Q.wstream(mo[0], mo[1], e[0], e[1], T * 1.6, '#3FB8C0', 0.6 * env, 3, 4, 0.85, 0.8); } }
        else if (f.kind === 'burst') { const X = FX.sx(f.x), Y = FX.sy(f.y), rr = f.r * T * (0.4 + 0.8 * ease(u)), env = 1 - u;
          if (Q) { Q.wring(X, Y, rr, rr * 0.62, 0, '#7FE8E0', 0.8 * env, 2, 0.08, 4, 1); Q.spray(X, Y - T, rr * 0.7, FOAM, 0.6 * env, 7, 1); Q.caustic(X, Y, rr, TQ, 0.4 * env, 2, 0.62); }
          else { c.save(); c.strokeStyle = rgba(FOAM, 0.8 * env); c.lineWidth = Math.max(2, T * 0.25 * env); c.beginPath(); c.ellipse(X, Y, rr, rr * 0.62, 0, 0, TAU); c.stroke(); c.restore(); gl2(c, X, Y - T, rr * 0.8, TQ, 0.4 * env); } }
        else if (f.kind === 'splash') { const X = FX.sx(f.x), Y = FX.sy(f.y), env = 1 - u;
          if (Q) { Q.spray(X, Y - T * 3 * ease(u), T * (3 + 5 * u), FOAM, 0.85 * env, 11, 1); Q.ripple(X, Y, T * (2 + 9 * u), TQ, 0.6 * env, 5, 0.62, 0.1); } else { gl2(c, X, Y - T * 2, T * (3 + 4 * u), FOAM, 0.6 * env); } }
        else if (f.kind === 'crest') { const X0 = FX.sx(C.x), Y0 = FX.sy(C.y), env = Math.sin(u * Math.PI); if (Q) Q.ripple(X0, Y0, C.R * T * (0.3 + u), FOAM, 0.6 * env, 8, 1, 0.06); else { c.save(); c.strokeStyle = rgba(FOAM, 0.5 * env); c.lineWidth = Math.max(2, T * 0.3); c.beginPath(); c.arc(X0, Y0, C.R * T * (0.3 + u), 0, TAU); c.stroke(); c.restore(); } } }
      // the waves: a wall of water rolling in from the open edge over the marked half
      for (const w of M.waves) { const R = C.R, d = Math.max(0, w.d), half = Math.sqrt(Math.max(0, R * R - d * d)), x = FX.sx(C.x + w.side * d), y0 = FX.sy(C.y - half), y1 = FX.sy(C.y + half), env = Math.min(1, w.t * 4) * (w.d < 0.5 ? cl((w.d + 0.6) / 1.1) : 1);
        if (half < 0.3) continue; const n = Math.max(3, Math.ceil((y1 - y0) / (T * 1.1)));
        for (let i = 0; i <= n; i++) { const y = lerp(y0, y1, i / n), h = T * (1.6 + 0.6 * Math.sin(i * 1.9 + t * 7));
          if (Q) { Q.wsphere(x, y - h * 0.5, T * 1.0, '#2E8E9A', 0.6 * env, i, 1, 0.8, 0.85); if (i % 2 === 0) Q.spray(x - w.side * T * 0.3, y - h, T * 1.3, FOAM, 0.55 * env, i, 0.5); }
          else { c.save(); c.globalAlpha = env; const g = c.createLinearGradient(x, y, x, y - h); g.addColorStop(0, 'rgba(18,60,82,.85)'); g.addColorStop(0.7, 'rgba(97,217,210,.75)'); g.addColorStop(1, 'rgba(226,247,242,.9)'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y - h * 0.5, T * 0.8, h * 0.6, 0, 0, TAU); c.fill(); c.restore(); } }
        if (Q) Q.wstream(x, y0, x, y1, T * 1.3, '#3FB8C0', 0.45 * env, 9, 2, 0.8, 0.7); }
      // the sun breaking through at the fall: warm shafts down across the platform
      const sun = M.sun || 0; if (sun > 0.02) { const cv = c.canvas, m0 = c.getTransform(), W = cv.width / (m0.a || 1), H = cv.height / (m0.d || 1), sx0 = -m0.e / (m0.a || 1), sy0 = -m0.f / (m0.d || 1);
        if (Q) { for (let i = 0; i < 4; i++) { const x = sx0 + W * (0.1 + i * 0.22), w = W * 0.12; Q.shafts(x - W * 0.2, sy0 - 20, x + W * 0.1, sy0 + H, w, '#FFD9A0', 0.35 * sun, i); } Q.glow(sx0 + W * 0.15, sy0, W * 0.6, '#FFD9A0', 0.25 * sun); }
        c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(sx0, sy0, sx0 + W * 0.5, sy0 + H); g.addColorStop(0, `rgba(255,205,140,${0.22 * sun})`); g.addColorStop(1, `rgba(255,170,100,${0.04 * sun})`); c.fillStyle = g; c.fillRect(sx0, sy0, W, H); c.restore(); }
    } finally { if (Q) F.flush(c); } }
  /* ---- the breakable lanterns (fiend objects) ---- */
  function drawObjArt(c, FX, o, X, Y, T, t) { if (o.kind !== 'belurn') return; c.save(); c.translate(X, Y + T * 0.5); urnPaint(c, T); c.restore(); gl2(c, X, Y - T * 0.45, T * 0.9, TQ, 0.25 + 0.1 * Math.sin(t * 3 + X)); }

  /* ================= the definition (the fiend engine's) ================= */
  const def = {
    arenaR: AR, firstAct: 'rise', ambient: null, floorDisc: true,
    carve(set, C) { /* the platform is the whole disc; islands, valves and the bell are drawn (not solid) */ },
    start(C) { return ARENA.start(C); },
    phaseNames: ['The Drowned Herald', 'The Drowning Bell', 'The Broken Bell'],
    props(C) { const out = []; ARENA.islands(C).forEach(s => out.push({ kind: 'island', i: s.i, x: s.x, y: s.y - 1.7 })); ARENA.valves(C).forEach((v, i) => out.push({ kind: 'valve', i, x: v.x, y: v.y })); const B = ARENA.bell(C); out.push({ kind: 'bell', x: B.x, y: C.y - AR + 0.4 }); return out; },
    artPoses: [
      { name: 'rising out of the sea', mem: { P: { sink: 2.2, rear: 0.8, jaw: 0.7, finFlare: 1, inflate: 0.6 } } },
      { name: 'the Herald: idle, the throat swelling', mem: { P: { inflate: 0.55, glow: 0.8 } } },
      { name: 'crawling', mem: { P: { gaitK: 1, gait: 0.25, inflate: 0.3 } } },
      { name: 'Jaw of the Deep: the cone tracks', mem: { P: { lunge: 0.45, jaw: 0.8, lure: 1.8, finFlare: 0.6, inflate: 0.8 } } },
      { name: 'Jaw of the Deep: the torrent', mem: { P: { lunge: 1, jaw: 1, lure: 1.6, finFlare: 1 } } },
      { name: 'Undertow: the pull', mem: { P: { inflate: 1, jaw: 0.75, rear: 0.45, glow: 1.9, finFlare: 1 } } },
      { name: 'Undertow: the gasp, the throat open', mem: { P: { inflate: 0.05, jaw: 0.85, lunge: 0.35, nod: 0.2, glow: 1.3 } } },
      { name: 'the Drowning Bell: he calls the sea', mem: { P: { rear: 1, jaw: 0.8, inflate: 0.9, glow: 1.4, finFlare: 1, lure: 1.5 } } },
      { name: 'breaking the bell: flippers raised', mem: { P: { rear: 1, lift: 1, jaw: 0.8, finFlare: 1, inflate: 0.9 } } },
      { name: 'the slam: a wave', mem: { P: { slam: 1, jaw: 0.5, lunge: 0.5 } } },
      { name: 'fallen: the light gone', mem: { P: { dead: 1, jaw: 0.5, lunge: 0.4, glow: 0, lure: 0 } } }],
    /* ---- the painting ---- */
    paintGround(c, A2) { paintFloor(c, A2); },
    sky(c, W, H, t, cam, T, FX) { paintSky(c, W, H, T, FX); },
    skyKey(FX) { const M = FX.mem || {}; return `${Math.round((M.sun || 0) * 6)}|${Math.round((M.drain || 0) * 4)}`; },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); if (FX.mem && FX.mem.ok) { groundFx(c, FX, T, t); drawGroundArt(c, FX, T, t); } },   // (v398 B5: the ground pass of the water effects)
    drawProp(c, FX, p, X, Y, T, t) { drawPropArt(c, FX, p, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { drawObjArt(c, FX, o, X, Y, T, t); },
    camFocus(FX, m) { const M = FX.mem; if (!M.ok) return null; const C = FX.C, me = FX.me;
      if (m.dead) return M.deadT != null && M.deadT < 5 ? { x: (m.x + C.x) / 2, y: m.y - 3, k: 0.7, zoom: 0.36 } : null;
      if (m.act === 'enter' || m.act === 'rise') return { x: m.x, y: m.y - 2.5, k: 0.85, zoom: 0.4 };
      if (M.A && M.A.kind === 'bell' && M.A.i != null) { const s = islandsOf(FX)[M.A.i]; return { x: (s.x + me.x) / 2, y: (s.y + me.y) / 2, k: 0.5, zoom: 0.34 }; }
      if (M.A && M.A.kind === 'break') { const B = ARENA.bell(FX.C), A = M.A;   // v398 B5: the bell's breaking as a short cinematic: framed, pushed in on the blow, following the bell into the sea
        if (A.phase === 'rear') return { x: (m.x + B.x) / 2, y: (m.y + B.y) / 2 - 2.5, k: 0.75, zoom: 0.38 + 0.03 * cl(A.t / 1.4) };
        if (A.phase === 'smash') return A.t < 1.25 ? { x: B.x, y: B.y - 3 + 2.4 * ease(A.t / 1.25), k: 0.85, zoom: 0.44 } : { x: B.x, y: B.y - 0.5, k: 0.8, zoom: 0.4 - 0.03 * cl((A.t - 1.25) / 0.75) };
        return { x: m.x, y: m.y - 4, k: 0.6, zoom: 0.36 }; }
      if (M.waves.length || (M.A && M.A.kind === 'wave')) return { x: (C.x + me.x) / 2, y: (C.y + me.y) / 2, k: 0.45, zoom: 0.34 };
      return { x: m.x, y: m.y - 3.2, k: 0.33, zoom: 0.4 }; },
    keep: null,
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.act = 'enter'; m.noTouch = true; m.touchK = 0; const L0 = ARENA.sea(C); m.x = L0.x; m.y = L0.y;
      Object.assign(M, { ok: 1, bt: 0, P: Object.assign(blankPose(), { sink: 4.2 }), th: Math.PI / 2, aimTh: Math.PI / 2, A: null, pick: 0, idleT: 0, seen: {}, fx: [], waves: [], leeches: [], lvl: SEA0, lvlW: SEA0, foam: 0, sun: 0, drain: 0,
        bellT: TUNE.bellFirst, broke: false, bellState: 'hang', bellAmp: 0, bellSwing: 0, surge: null, surgeT: 0, waveSide: 1, lastIsl: -1, petZ: 0,
        stat: { jaw: 0, jawHit: 0, undertow: 0, undertowHit: 0, bell: 0, bells: 0, floods: 0, floodSafe: 0, floodHit: 0, valves: 0, break: 0, broke: 0, wave: 0, waves: 0, waveHit: 0, waveSafe: 0, surges: 0, leechKills: 0, urns: 0, phase2At: null, phase3At: null, t0: null } });
      M.stat.t0 = FX.S.t; islandsOf(FX); mkUrns(FX);
      // (the stage may have been made by another hand: his health in TUNE.bars bars all the same)
      if (!(FX.F && FX.F.belUldHp) && FX.S.barHP > 0) { const hp = FX.S.barHP * TUNE.bars; if (Math.abs(hp - m.maxhp) > 1) { m.maxhp = m.hp = hp; } } },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; endAct(FX, m, true); M.flinch = 1;
      if (lv === 2) { M.stat.phase2At = FX.S.t; M.bellT = TUNE.bellFirst; say(FX, 'p2', 'THE DROWNING BELL', 'When the bell tolls: the lit valve, then its island', TQ_HI, 3.2); toll(FX, 0.8); M.pick = 0; }
      if (lv >= 3) { M.stat.phase3At = FX.S.t; for (const s of islandsOf(FX)) { s.litW = false; s.markW = false; s.want = 0; } M.lvlW = SEA0; say(FX, 'p3', 'THE BROKEN BELL', 'He turns on the bell itself', WARN, 2.6); M.pick = 0; FX.H.boom(m.x, m.y - 1, 2.5, TQ, '#FFFFFF', { n: 26, shake: 12, smoke: 6 }); sf(FX, 'crash'); } },
    ai(FX, m, dt) { const M = FX.mem; if (!M.ok) return; m.actT += dt; m.noTouch = true; M.walking = 0;
      if (m.act === 'rise') { riseTick(FX, m, dt); return; }
      if (!M.A) { idleTick(FX, m, dt); return; }
      const A = M.A; A.t += dt;
      const done = A.kind === 'jaw' ? jawTick(FX, m, A, dt) : A.kind === 'undertow' ? undertowTick(FX, m, A, dt) : A.kind === 'bell' ? bellTick(FX, m, A, dt) : A.kind === 'break' ? breakTick(FX, m, A, dt) : A.kind === 'wave' ? waveTick(FX, m, A, dt) : true;
      if (done) endAct(FX, m); },
    stunned(FX, m, dt) { m.noTouch = true; },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.ok) return; M.bt += dt;
      // the water and its foam, the bell's swing and fall
      M.lvl = toward(M.lvl, M.lvlW, dt, m.dead ? 6 : 1.6); M.foam = toward(M.foam, M.waves.length || (M.A && M.A.kind === 'bell' && M.A.phase !== 'call') ? 1 : 0, dt, 2);
      if (M.bellSwing > 0) { M.bellAmp = Math.min(1, (M.bellAmp || 0) + M.bellSwing); M.bellSwing = 0; } M.bellAmp = Math.max(0, (M.bellAmp || 0) - dt * 0.25);
      if (M.bellState === 'fall') M.bellFallT = (M.bellFallT || 0) + dt;
      for (let i = M.fx.length - 1; i >= 0; i--) { const f = M.fx[i]; f.t += dt; if (f.t >= f.life) M.fx.splice(i, 1); }
      islandsTick(FX, m, dt);
      if (m.dead) { deadTick(FX, m, dt); easePose(FX, m, dt); return; }
      if (FX.S.lv === 2 && !(M.A && M.A.kind === 'bell')) M.bellT -= dt;
      surgeTick(FX, m, dt); wavesTick(FX, m, dt);
      M.leeches = M.leeches.filter(l => { if (l && l.dead) { M.stat.leechKills++; return false; } return !!l; });
      // the heading turns slowly toward where he means to look; a crawl's gait
      M.th = turnTo(M.th, M.aimTh == null ? M.th : M.aimTh, dt * (M.A && M.A.kind === 'jaw' && M.A.locked ? 0 : 1.6)); if (M.walking) M.gait = (M.gait || 0) + dt * 0.55;
      { const d = (M.lastHp == null ? m.hp : M.lastHp) - m.hp; M.lastHp = m.hp; if (d > 0) { const key = M.weakK > 0 ? 'open' : 'closed'; M.stat.dmg = M.stat.dmg || {}; M.stat.dmg[key] = Math.round((M.stat.dmg[key] || 0) + d); } }
      weakPoints(FX, m, M); FX.parts(partsOf(FX, m));
      // he is crawled round, not through: the pet eased out from under him
      const me = FX.me; if (!me.dead && m.act !== 'enter') { const dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy), r0 = 2.5; if (d < r0 && d > 1e-4) FX.push(dx / d * (r0 - d) * 0.6, dy / d * (r0 - d) * 0.6); }
      // deep water slows the pet (off the islands)
      if (M.lvl > 0.55 && !sheltered(FX, me.x, me.y)) me.chill = Math.max(me.chill || 0, 0.15);
      if (!lowFx() && m.act !== 'enter' && Math.random() < dt * 3) { const l = anc(FX, m, 'lure'); FX.H.part({ kind: 'star', x: l.x + FX.rnd(-0.3, 0.3), y: l.y - l.z * ZK, vx: FX.rnd(-0.3, 0.3), vy: FX.rnd(-0.8, -0.3), life: 1.0, max: 1.0, size: 1.4, color: TQ_HI }); }
      easePose(FX, m, dt); },
    dmgK(FX, m, o) { flinch(FX, m, 0.05); let k = 0.62; if (m.stunT > 0) k = 0.75; return k * stackK(FX, o); },
    onWeakHit(FX) { const M = FX.mem; flinch(FX, FX.m, 0.12); M.stat.exposed = (M.stat.exposed || 0) + 1; stackK(FX, null); },
    draw(c, FX, m, X, Y, T, t) { c.globalAlpha = 1; Y += (m.z || 0) * T * 4; paintBoss(c, FX, m, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawFx(c, FX, T, t); },
  };
  function stackK(FX, o) { const M = FX.mem, t = FX.g.t; if (M.hitT !== t) { M.hitT = t; M.hitN = 0; } M.hitN++; return M.hitN > 1 && o && o.viaProxy ? 0.3 : 1; }

  /* ================= the stage (the rift's boss stage: BEL.bossMake.beluldroth) =================
     make(X, self, H): the platform's valves as the stage's objects (the pet stands at the lit one for 0.75 s: its
     Resonance turns it), the pointer to the lit valve and then its island; and his health set in absolute terms
     (TUNE.hp in TUNE.bars bars), whatever the rift's ease. The fight reaches it all through STAGE.mod = { C, isl, ARENA } */
  function make(X, self, H) {
    { const F = X.F; if (F && F.fiend && F.fiend.id === 'beluldroth' && !F.belUldHp && typeof BOSS_HP_MEAN !== 'undefined') { const FD = F.fiend, per = 20 * BOSS_HP_MEAN * F.hpMul * (1 + 0.3 * (F.loop || 0) + 0.5 * (FD.cycle || 0)) / (FD.baseBars || FD.bars), tot = per * FD.bars; if (tot > 0) { F.hpMul *= TUNE.hp / tot; F.belUldHp = true; } } }
    const FC = X.M && X.M.FC, C = FC ? { x: FC.x, y: FC.y, R: FC.R } : { x: X.M.MW / 2, y: X.M.MH / 2, R: AR };
    const isl = mkIslands(C, false), st0 = { g: X.g, X, mod: null, FX: null };
    for (const s of isl) s.obj = H.obj({ x: s.vx, y: s.vy, kind: 'belvalve', r: 1.0, h: 2.6, label: () => s.lit > 0.5 ? (blocked(st0.FX, s) ? 'Leeches hold the valve' : s.want > 0.5 ? 'The island is up' : 'Turn the valve') : '',
      use: () => { const FX = st0.FX; if (FX) useValve(FX, s); } });
    const mod = { C, isl, ARENA, BEL_ULDROTH: null,
      update(dt) { for (const s of isl) s.obj.busy = !(s.lit > 0.5 && s.want < 0.5 && !(st0.FX && blocked(st0.FX, s))); },
      hint() { const FX = st0.FX; if (!FX || !FX.m || FX.m.dead) return null; const me = X.me; for (const s of isl) { if (!(s.lit > 0.5)) continue; if (s.want < 0.5) { if (blocked(FX, s)) { const l = s.leeches.find(q => q && !q.dead); return l ? { x: l.x, y: l.y, h: 1.2, label: 'Leech' } : null; } return s.obj; } if (!onTop(s, me.x, me.y)) return { x: s.x, y: s.y - 0.2, h: ISL_UP + 0.8, label: 'Island' }; } return null; } };
    st0.mod = mod; STAGE = st0;
    return mod;
  }
  const _init = def.init; def.init = FX => { if (STAGE && STAGE.g === FX.g) STAGE.FX = FX; _init(FX); };
  def.force = (FX, k) => { const m = FX.m; endAct(FX, m, true); m.stunT = 0; begin(FX, m, k); };   // (tests: start an act now)
  def.make = make; def.bossMake = make; def.stageMake = make; def.MODEL = MODEL; def.TUNE = TUNE; def.ARENA = ARENA;
  return { MODEL, def, make, ARENA, TUNE, onFall, test: { begin, endAct, islandsOf, sheltered, useValve, blocked, onTop, toll, SEA0, get old2D() { return OLDN; } } };
})();
/* the tuning: Uldroth's health is TUNE.hp in TUNE.bars (9) bars and his blows about TUNE.dmg, whatever ease the rift gives its
   monsters: worked out, when his stage starts, from the floor his stage plays as (riftDef) and the rift's ease and scale */
const BEL_ULDROTH_K = kind => { try { const T = BEL_ULDROTH.TUNE, Rf = RIFT_BY_ID.belfry, E = ((Rf && Rf.ease) || 1) * ((Rf && Rf.scale) || 1);
  let n = 16; if (Rf && Rf.stages) { const i = Rf.stages.findIndex(s => s.boss === 'beluldroth'); if (i >= 0) n = Math.max(1, (Rf.lvl || 1) + (riftStagePos(Rf, i).sec - 1) * 3); }
  if (kind === 'hp') { const lo = n < 50 ? Math.min(1, Math.max(0, (n - 10) / 30)) : -1, hk = n >= 50 ? Math.min(1, (n - 50) / Math.max(10, TOWER_TOP - 50)) : -1, more = hk >= 0 ? Math.round(30 + 20 * hk) : Math.round(10 + 15 * lo); return (T.bars + 0.2) / (Math.round(n / 5) + 2 + more); }
  const F = floorDef(n), hit = n < 50 ? 1.3 : 1.5, lvK = 1 + (n / 10 - 1) * 0.06; return T.dmg / (15 * F.dmgMul * E * 1.25 * 1.1 * lvK * hit); } catch (e) { return 1; } };
RiftFiend.define({ id: 'beluldroth', name: 'Uldroth', title: 'the Drowned Herald', color: '#2E4740', glow: '#61D9D2', accent: '#C9FFF8', biome: typeof BIOMES !== 'undefined' && BIOMES.belplat ? 'belplat' : typeof BIOMES !== 'undefined' && BIOMES.belfry ? 'belfry' : 'swamp', r: 2.4, els: ['water', 'dark'], phases: 3, cuts: [1, 0.7, 0.35], belHard: 5,
  get hpK() { return BEL_ULDROTH_K('hp'); }, get dmgK() { return BEL_ULDROTH_K('dmg'); } }, BEL_ULDROTH.def);
FIEND_DEFS.beluldroth.ULDROTH = BEL_ULDROTH;
if (typeof BEL !== 'undefined') { BEL.bossMake = BEL.bossMake || {}; BEL.bossMake.beluldroth = BEL_ULDROTH.make; BEL.uldroth = BEL_ULDROTH; }
