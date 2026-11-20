/* ---------- v391 B4 · Rift 1, THE DROWNED BELFRY · BOSS 2: NHALU THE LANTERN EEL ----------
   An eight-metre eel of five thick curved segments tapering into a paddle tail: an indigo back that shows a wet oil-film
   sheen, a milk-white belly that light passes through, three large amber lantern bulbs down its spine, a blunt wedge of a
   head with a broad hinged jaw and two short whiskers (no teeth). It swims through the nave's shallow floor water with
   its back exposed (the water cuts its body at the waterline, a line of foam round it) and rests its head on the floor
   between attacks. The body flows: twenty short body slices are posed along one spine that follows the path the head
   swam (each point of the body passes where the head passed), with a travelling wave down it, banking into its turns.
   Drawn live on the GPU with GLM (20k5uz: materials 105..109 between the BEL-NHALU-MAT markers) as Ifrit and the Bomb
   King are: meshes built once, rigid parts posed each frame, one composite image. Where WebGL is missing or a software
   rasteriser (window.__NHALU_GL = 1 forces the GPU there: tests), the existing 2D Nhalu (DunBoss 'nhalu', the old Belfry
   boss's picture) is drawn along the same body, with the same fight (the user: no new simplified 2D model).
   THE NAVE (Belfry spec, Boss 2): 21 x 22 tiles, three lengthwise water lanes split by dry stone strips with drainage
   grooves; two sluice wheels flank the southern entrance. Ground painted once in world space (one picture: no tile
   seams; every tone a property of a world cell, the Caldera's v389 F rule); the water a live layer over it.
   THE FIGHT (two phases, cut at 50%):
     Lantern Hunt: a spinal bulb lights; its symbol (ring, triangle, diamond) is projected onto the next charged lane,
       with the lane's bright boundary and a countdown (2.75 s). Thunderwater then discharges along that lane (soft GPU
       electric water through the shared FGFX painter).
     Drain-and-Bite: it lines up in a lane; that lane is marked and one wheel is exposed. The pet goes to the wheel and
       uses it (0.75 s): the lane drains and the eel BEACHES for 8 s (its damage window). Ignored, the sluice seals and it
       bites down the lane (2.5 s line warning). While it waits it snaps at a pet that comes near its head (2.5 s).
     At 50%: two lanes charge in sequence (the second 1.5 s after the first): never three at once, so one lane is
       always safe; leave the first, then step into its spent water. Each drain also brings two bell leeches (the rift's
       MON 'leech') crawling to the exposed wheel: one that reaches it relocks it (and refills a drained lane).
   Its fall: it rears, its bulbs flare and burst one by one (BREAK_FX in glass), and it crashes down across the nave.
   BEL_NHALU = { MODEL, def, make, TUNE, TM }. FIEND_DEFS.belnhalu.stageMake = make (the rift's boss stage). */
const BEL_NHALU = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const ease = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;   // (the game camera, as Ifrit's: orthographic, about 46 degrees above the floor)
  const hexA = (h, a) => { const n = parseInt(h.slice(1, 7), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`; };
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  /* ================= vectors and rotations (a rotation: its three columns) ================= */
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => Math.sqrt(vdot(a, a)), vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vlerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const M3 = (x, y, z) => ({ x, y, z }), I3 = () => M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };   // (+a: x toward -z, the nose down)
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  function rotAxis(n, a) { n = vnrm(n); const c = Math.cos(a), s = Math.sin(a), t = 1 - c, [x, y, z] = n;
    return M3([t * x * x + c, t * x * y + s * z, t * x * z - s * y], [t * x * y - s * z, t * y * y + c, t * y * z + s * x], [t * x * z + s * y, t * y * z - s * x, t * z * z + c]); }
  /* a frame with x along xd and z as near up (rolled by roll about x) as it can be */
  function frameX(xd, roll) { const x = vnrm(xd); let y = vcross([0, 0, 1], x); if (vlen(y) < 1e-5) y = [0, 1, 0]; y = vnrm(y); let z = vcross(x, y);
    if (roll) { const c = Math.cos(roll), s = Math.sin(roll), y2 = vadd(vmul(y, c), vmul(z, s)), z2 = vsub(vmul(z, c), vmul(y, s)); y = y2; z = z2; } return M3(x, y, z); }

  /* ================= materials (GLM ids: the BEL-NHALU-MAT block) =================
     105 skin (wet iridescent indigo back, milk-white subsurface belly by the part's own normal; the third attribute = the
         place along the body; edge = a segment joint's crease; uGlow = the bulbs' amber spill; uSpill = electric charge
         crawling over it; uGlow2 = dried out (beached); uFx = dead)
     106 fins and whiskers (a translucent membrane, its rays in edge)
     107 a lantern bulb (amber glass lit from within: uGlow its light; uKind its symbol 1 ring, 2 triangle, 3 diamond)
     108 the mouth's wet flesh (108.3 an eye: black glass)       109 a bulb's socket collar (dark nacre, its lip lit) */
  const M_SKIN = 105, M_FIN = 106, M_BULB = 107, M_FLESH = 108, M_EYE = 108.3, M_COLLAR = 109;

  /* ================= the measures (model units = tiles) =================
     The spine's s runs from the neck (0) to the root of the tail (BODY_L); the head lies forward of s = 0 */
  const HEAD_L = 1.55, SEG_N = 5, SEG_L = 1.18, BODY_L = SEG_N * SEG_L, SPS = 4, NSL = SEG_N * SPS, SL = SEG_L / SPS, TAIL_L = 1.6, LEN = HEAD_L + BODY_L + TAIL_L;
  const ZSQ = 0.94;   // (the body a little lower than it is wide)
  const BULB_S = [1.77, 2.95, 4.13], BULB_R = 0.27;   // (on the second, third and fourth segments)
  const RADP = [[-0.2, 0.45], [0.35, 0.52], [1.3, 0.56], [2.4, 0.54], [3.6, 0.47], [4.7, 0.37], [5.95, 0.23]];
  function radBase(s) { let i = 0; while (i < RADP.length - 2 && RADP[i + 1][0] < s) i++; const a = RADP[i], b = RADP[i + 1]; return lerp(a[1], b[1], ease((s - a[0]) / (b[0] - a[0]))); }
  function RAD(s) { const u = ((s % SEG_L) + SEG_L) % SEG_L / SEG_L, p = 1 - 0.085 * Math.pow(1 - Math.sin(Math.PI * u), 4); return radBase(s) * (s > 0.05 && s < BODY_L - 0.05 ? p : 1); }
  const crease = s => { let e = 0; for (let k = 1; k < SEG_N; k++) e = Math.max(e, 1 - sstep(0, 0.11, Math.abs(s - k * SEG_L))); return e; };
  const auxOf = s => cl((HEAD_L + s) / LEN);

  /* ================= the meshes (built once) ================= */
  let MESH = null, MESH_MS = 0; const BOUND = {};
  function bounds(name) { let b = BOUND[name]; if (b) return b; const M = MESH && MESH[name]; if (!M) return [[0, 0, 0], 1]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
    for (let i = 0; i < p.length; i += 3) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); }
    return (BOUND[name] = [[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2]); }
  function buildMeshes() {
    const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(4, Math.round(n * DQ));
    /* ---- the body slices: each a short tube of the body between s0 and s1 (x toward the head), its tail end closed by
       a full ball (so a bend opens no gap: the next slice's end turns inside it) and its head end by a smaller one ---- */
    for (let j = 0; j < NSL; j++) { const B = nb(), s0 = j * SL, s1 = (j + 1) * SL, sc = (s0 + s1) / 2, r0 = RAD(s0), r1 = RAD(s1), prof = [];
      for (let i = 0; i <= 2; i++) { const ph = 0.32 + (Math.PI / 2 - 0.32) * i / 2, rr = r0 * 0.9; prof.push([sc - s0 + rr * Math.cos(ph), rr * Math.sin(ph), s0]); }
      for (let i = 0; i <= 3; i++) { const s = s0 + SL * i / 3; prof.push([sc - s, RAD(s), s]); }
      for (let i = 1; i <= 3; i++) { const ph = Math.PI / 2 - (Math.PI / 2 - 0.3) * i / 3; prof.push([sc - s1 - r1 * Math.cos(ph), r1 * Math.sin(ph), s1]); }
      const NP = prof.length - 1, at = u => prof[Math.max(0, Math.min(NP, Math.round(u * NP)))];
      const v0 = B.nv, NV = q(22); B.surf((u, v) => { const p = at(u), a = v * TAU; return [p[0], Math.cos(a) * p[1], Math.sin(a) * p[1] * ZSQ]; }, NP, NV, () => M_SKIN, { e: u => crease(at(u)[2]), a: u => auxOf(at(u)[2]) });
      const M = B.done();
      // its normals made exactly (the grid's own differences shade each slice's ends as a rounded bead, ringing the body):
      // the tube by its radius and slope, the balls from their centres; the z of each scaled for the body's flattening
      for (let jj = 0; jj <= NV; jj++) for (let i = 0; i <= NP; i++) { const k = (v0 + jj * (NP + 1) + i) * 3, a = jj / NV * TAU, p = prof[i]; let nx;
        if (i < 3) nx = (p[0] - (sc - s0)) / Math.max(1e-4, p[1]); else if (i > 6) nx = (p[0] - (sc - s1)) / Math.max(1e-4, p[1]); else nx = (RAD(p[2] + 0.02) - RAD(p[2] - 0.02)) / 0.04;   // (a ball: from its centre; the tube: its radius's slope along s)
        const n = vnrm([nx, Math.cos(a), Math.sin(a) / ZSQ]); M.nrm[k] = n[0]; M.nrm[k + 1] = n[1]; M.nrm[k + 2] = n[2]; }
      out['sl' + j] = M; }
    /* ---- the head: a blunt wedge (x forward from the neck), its top sloping to a blunt snout, its underside flat (the
       upper jaw); the eyes small and set wide under a low brow ---- */
    { const B = nb(), HP = [[-0.16, 0.42, 0.4, 0.4], [0.12, 0.5, 0.44, 0.33], [0.45, 0.53, 0.42, 0.24], [0.85, 0.5, 0.35, 0.22], [1.18, 0.44, 0.26, 0.22], [1.4, 0.36, 0.18, 0.21], [1.5, 0.27, 0.12, 0.19], [1.555, 0.13, 0.06, 0.15], [1.57, 0.02, 0.02, 0.1]];
      const hp = x => { let i = 0; while (i < HP.length - 2 && HP[i + 1][0] < x) i++; const a = HP[i], b = HP[i + 1], u = cl((x - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; };
      const sp = (c, p) => Math.sign(c) * Math.pow(Math.abs(c), 2 / p);
      const pt = (x, th) => { const [w, ht, hb] = hp(x), c = Math.cos(th), s = Math.sin(th), brow = s > 0 ? 0.035 * Math.exp(-Math.pow((x - 0.95) / 0.22, 2)) * Math.pow(Math.abs(c), 0.5) : 0;
        return [x, w * sp(c, s > 0 ? 2.5 : 4.5), s > 0 ? ht * sp(s, 2.5) + brow : -hb * Math.pow(Math.abs(s), 2 / 4.5)]; };
      const xs = u => lerp(-0.16, 1.57, Math.pow(u, 0.85));
      B.surf((u, v) => pt(xs(u), v * TAU), q(22), q(26), () => M_SKIN, { flip: true, e: (u, v) => { const x = xs(u), s = Math.sin(v * TAU); return s < -0.2 && x > 0.3 ? 0.35 : 0; }, a: u => cl((HEAD_L - xs(u)) / LEN) });
      for (const sg of [-1, 1]) { B.sph([1.0, sg * 0.385, 0.13], 0.08, M_EYE, q(12)); B.ell([0.98, sg * 0.35, 0.215], [0.17, 0.07, 0.05], M_SKIN, { seg: q(10), rings: 5 }); }
      // the throat behind the jaw: dark wet flesh, seen when the jaw drops
      B.ell([0.42, 0, -0.2], [0.34, 0.3, 0.12], M_FLESH, { seg: q(14), rings: 6 });
      out.head = B.done(); }
    /* ---- the jaw: a broad blunt plate hinged under the head (frame: the hinge at its origin, x forward); its rounded
       underside is skin, its top the mouth's flesh ---- */
    { const B = nb(), JL = 1.36, wj = x => 0.47 - 0.13 * Math.pow(x / JL, 1.6), dj = x => 0.21 - 0.1 * (x / JL), xs = u => JL * Math.pow(u, 0.9);
      B.surf((u, v) => { const x = xs(u), th = Math.PI + v * Math.PI, c = Math.cos(th), s = Math.sin(th), w = wj(x) * (u > 0.93 ? Math.sqrt(Math.max(0.02, 1 - Math.pow((u - 0.93) / 0.07, 2))) : 1);
        return [x + (u > 0.93 ? 0.05 * (u - 0.93) / 0.07 : 0), w * Math.sign(c) * Math.pow(Math.abs(c), 0.6), -dj(x) * Math.pow(Math.abs(s), 0.45)]; }, q(16), q(14), () => M_SKIN, { flip: true, e: () => 0, a: u => cl((HEAD_L - 0.2 - xs(u)) / LEN) });
      B.surf((u, v) => { const x = xs(u) * 0.985, w = wj(x) * (u > 0.93 ? Math.sqrt(Math.max(0.02, 1 - Math.pow((u - 0.93) / 0.07, 2))) : 1); return [x, (v - 0.5) * 2 * w * 0.985, 0.004]; }, q(12), 4, () => M_FLESH, { e: (u, v) => Math.abs(v - 0.5) * 2 });
      out.jaw = B.done(); }
    /* ---- the whiskers: two short barbels from the snout's corners, curling out and down (one each side: no mirrored frame) ---- */
    for (const sg of [-1, 1]) { const B = nb(), P = u => [0.2 * u, sg * (0.1 * u + 0.34 * u * u), -0.24 * u * u + 0.04 * u]; let p = P(0);
      for (let i = 1; i <= 5; i++) { const qq = P(i / 5); B.tube(p, qq, 0.045 * (1 - (i - 1) / 5 * 0.7), 0.045 * (1 - i / 5 * 0.7), M_FIN, { seg: 7, cap0: 'round', cap1: 'round' }); p = qq; }
      out[sg < 0 ? 'whL' : 'whR'] = B.done(); }
    /* ---- the pectoral fins: small fans of membrane behind the head, angled back and down ---- */
    for (const sg of [-1, 1]) { const B = nb();
      B.surf((u, v) => { const a = lerp(-0.25, 0.85, v), r = 0.55 * Math.pow(u, 0.9) * (0.75 + 0.25 * Math.sin(Math.PI * v)); return [-Math.sin(a) * r * 0.9 - 0.05 * u, sg * (Math.cos(a) * r * 0.55 + 0.02), -Math.cos(a) * r * 0.35 - 0.04 * u]; }, q(6), q(10), () => M_FIN, { e: (u, v) => v, a: () => 0.2 });
      out[sg < 0 ? 'pfL' : 'pfR'] = B.done(); }
    /* ---- the tail: a short stem and a broad upright paddle of membrane (frame: x toward the head) ---- */
    { const B = nb(); B.tube([0.12, 0, 0], [-0.42, 0, 0.02], 0.235, 0.15, M_SKIN, { seg: q(16), cap0: 'round', cap1: 'round' });
      B.surf((u, v) => { const x = -0.25 - 1.3 * u, a = v * TAU, h = 0.62 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.7)), 0.8) + 0.05, w = 0.06 * (1 - u) + 0.015; return [x - 0.05 * Math.cos(a) * u, Math.sin(a) * w, Math.cos(a) * h + 0.03]; }, q(14), q(16), () => M_FIN, { flip: true, e: (u, v) => Math.abs(Math.cos(v * TAU)), a: u => cl((HEAD_L + BODY_L + u * TAIL_L) / LEN) });
      out.tail = B.done(); }
    /* ---- a lantern: the amber bulb, and its socket collar (a ridged ring of dark nacre on a short fleshy stalk) ---- */
    { const B = nb(); B.sph([0, 0, 0], BULB_R, M_BULB, q(22)); out.bulb = B.done(); }
    { const B = nb(); B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]);
      B.lathe([[-0.2, 0.23], [-0.08, 0.255], [-0.01, 0.27], [0.05, 0.265], [0.09, 0.235], [0.105, 0.2], [0.1, 0.17]], M_COLLAR, { seg: q(22), edge: j => j >= 4 ? 1 : j === 3 ? 0.5 : 0 }); B.pop();
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.2; B.ell([Math.cos(a) * 0.255, Math.sin(a) * 0.255, -0.02], [0.05, 0.05, 0.08], M_COLLAR, { seg: 7, rings: 4 }); }
      out.collar = B.done(); }
    return out;
  }

  /* ================= the rig: a spine (sample points every DS along s, model coordinates about the head's ground point)
     and a pose -> the parts =================
     P: pts [[x, y, z]...] (s = k * DS), roll(s) or roll array, yaw, pitch (the head on the neck), jaw 0..1, bulb [3]
     (each 0..2.5), sym [3], burst [3] (bool), chg (electric), dry, dead, fin (flap phase), clip (the water's level or
     null), alpha */
  const DS = 0.1, NSP = Math.ceil((BODY_L + 0.2) / DS) + 1;
  function spAt(P, s) { const f = Math.max(0, Math.min(NSP - 1.001, s / DS)), i = Math.floor(f), u = f - i, a = P.pts[i], b = P.pts[Math.min(NSP - 1, i + 1)]; return vlerp(a, b, u); }
  function rollAt(P, s) { const R = P.rolls; if (!R) return P.roll || 0; const f = Math.max(0, Math.min(NSP - 1.001, s / DS)), i = Math.floor(f); return lerp(R[i], R[Math.min(NSP - 1, i + 1)], f - i); }
  function frameAt(P, s) { const a = spAt(P, Math.max(0, s - 0.12)), b = spAt(P, s + 0.12); return frameX(vsub(a, b), rollAt(P, s)); }
  function rig(P, t) {
    const out = { inst: [], A: {} }, I = (part, R, o, x) => { out.inst.push(Object.assign({ part, R, o, s: 1, al: 1, glow: 0, glow2: 0, spill: 0, kind: 0, fx: 0 }, x || {})); };
    const dry = cl(P.dry || 0), chg = P.chg || 0, dead = cl(P.dead || 0), bl = P.bulb || [0.3, 0.3, 0.3];
    const spillAt = s => { let k = 0; for (let i = 0; i < 3; i++) if (!(P.burst && P.burst[i])) k += Math.min(2, bl[i]) * Math.exp(-Math.pow((s - BULB_S[i]) / 0.75, 2)); return k; };
    // the body slices
    for (let j = 0; j < NSL; j++) { const sc = (j + 0.5) * SL; I('sl' + j, frameAt(P, sc), spAt(P, sc), { glow: spillAt(sc), glow2: dry, spill: chg, fx: dead }); }
    // the head on the neck, the jaw on its hinge, the whiskers and the fins
    const F0 = frameAt(P, 0), Rh = mm(F0, mm(rotZ(P.yaw || 0), rotY(P.pitch || 0))), h0 = spAt(P, 0);
    I('head', Rh, h0, { glow: spillAt(0) * 0.6, glow2: dry, spill: chg, fx: dead });
    const hinge = vadd(h0, mv(Rh, [0.2, 0, -0.22])), Rj = mm(Rh, rotY(cl(P.jaw || 0) * 0.62));
    I('jaw', Rj, hinge, { glow2: dry, spill: chg * 0.6, fx: dead });
    for (const sg of [-1, 1]) { const sw = Math.sin(t * 2.3 + sg) * 0.18 + (P.jaw || 0) * 0.2, root = vadd(h0, mv(Rh, [1.36, sg * 0.3, -0.12])), Rw = mm(Rh, mm(rotZ(sg * sw), rotY(0.15 + 0.1 * Math.sin(t * 1.7 + sg * 2))));
      I(sg < 0 ? 'whL' : 'whR', Rw, root, { fx: dead, glow: 0.2 * spillAt(0) }); }
    { const Ff = frameAt(P, 0.42), r = RAD(0.42); for (const sg of [-1, 1]) { const fl = Math.sin((P.fin || 0) + (sg > 0 ? 1.4 : 0)) * 0.32, Rf = mm(Ff, rotX(-sg * (0.35 + fl))), root = vadd(spAt(P, 0.42), mv(Ff, [0, sg * r * 0.88, -r * 0.18]));
      I(sg < 0 ? 'pfL' : 'pfR', Rf, root, { fx: dead, glow: 0.3 * spillAt(0.4) }); } }
    { const Ft = mm(frameAt(P, BODY_L), rotZ(P.tailYaw || 0)); I('tail', Ft, spAt(P, BODY_L), { glow2: dry, spill: chg, fx: dead }); out.A.tail = vadd(spAt(P, BODY_L), mv(Ft, [-1.1, 0, 0.1])); }
    // the lanterns
    out.A.bulbs = [];
    for (let i = 0; i < 3; i++) { const s = BULB_S[i], F = frameAt(P, s), base = vadd(spAt(P, s), vmul(F.z, RAD(s) * ZSQ * 0.86)), g = bl[i], puls = 1 + 0.04 * Math.max(0, g - 0.6) * Math.sin(t * 9 + i);
      I('collar', F, base, { glow: P.burst && P.burst[i] ? 0 : g, fx: dead, kind: 0 });
      const c = vadd(base, vmul(F.z, 0.25)); out.A.bulbs.push(c);
      if (!(P.burst && P.burst[i])) I('bulb', F, c, { glow: g, kind: (P.sym && P.sym[i]) || i + 1, fx: dead * 0.85, s: puls }); }
    out.A.head = vadd(h0, mv(Rh, [0.85, 0, 0.12])); out.A.snout = vadd(h0, mv(Rh, [1.5, 0, -0.1])); out.A.mid = spAt(P, 2.9);
    out.occ = [[vadd(h0, mv(Rh, [0.6, 0, 0.05])), 0.42], [spAt(P, 0.7), RAD(0.7) * 0.86], [spAt(P, 1.9), RAD(1.9) * 0.86], [spAt(P, 3.1), RAD(3.1) * 0.86], [spAt(P, 4.3), RAD(4.3) * 0.86], [spAt(P, 5.4), RAD(5.4) * 0.86]];
    return out;
  }

  /* ================= drawing ================= */
  const CW = [0, VY, VZ], EXW = [1, 0, 0];
  const LW = vnrm([-0.42, 0.38, 0.82]), SBW = vnrm([-0.2, -0.38, 0.9]), RIMW = vnrm([0.45, -0.78, 0.42]), UPW = [0, 0, 1];
  /* the view of one draw: the model's frame (x east, y south unforeshortened, z up) -> the world -> the screen */
  function mkView(x, y, z, o) {
    const T = o.T, sc = o.scale || 1, k = T * sc, X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T, Rh = I3();
    const toS = p => [X0 + p[0] * k, Y0 + (p[1] * GY - p[2] * ZK) * k];
    const toW = p => ({ x: x + p[0] * sc, y: y + p[1] * GY * sc, z: z + p[2] * sc });
    const depth = p => vdot(p, CW);
    return { T, sc, k, Rh, toS, toW, depth, x, y, z };
  }
  let NOGL = false, GLFAIL = 0, GLRETRY = 0, GLLAST = 0, GLMS = 0, GLN = 0, GLBOX = null; const GLI = [], GLJ = [], OCC = new Float32Array(48);
  const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
  const glOn = () => { if (NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__NHALU_GL)) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Nhalu: meshes', e); return false; } } return true; };
  const GLCAP = 1700, RIMC = [0.55, 1.25, 1.2], AMBC = [1, 1, 1], OUTC = [0.012, 0.016, 0.04];
  function glPass(c, V, list, al0, o) {
    const k = V.k, X0 = V.toS([0, 0, 0]), PX = EXW, PY = [0, GY, -ZK], PD = CW;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { const [bc, br] = bounds(it.part), rr = br * it.s * 1.05 * k, w = vadd(it.o, mv(it.R, vmul(bc, it.s))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !(typeof window !== 'undefined' && window.__NHALU_GLHQ), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t: (o.t || 0) % 600,
      outline: o.outline === 0 ? 0 : Math.max(1, 1.15 * (W / bw)), outlineCol: OUTC };
    if (o.clip != null) S.clip = [o.clip, 0.055];
    if (o.occ && o.occ.length) { let n2 = 0; for (const [p, r] of o.occ) { if (n2 >= 12) break; OCC[n2 * 4] = p[0]; OCC[n2 * 4 + 1] = p[1]; OCC[n2 * 4 + 2] = p[2]; OCC[n2 * 4 + 3] = r; n2++; } S.occ = OCC; S.nocc = n2; }
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = MESH[it.part]; if (!mesh) continue; const al = al0 * (it.al == null ? 1 : it.al); if (!(al > 0.004)) continue; const s2 = it.s || 1, Tt = it.o;
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = it.R.x[i] * s2; g.R1[i] = it.R.y[i] * s2; g.R2[i] = it.R.z[i] * s2; g.T[i] = Tt[i]; }
      g.alpha = al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = 1; g.fx = it.fx || 0; g.d = vdot(Tt, PD); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh);
    GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++; GLBOX = [W, H]; return true;
  }
  /* the lane symbols: 1 a ring, 2 a triangle, 3 a diamond (the bulbs carry them too) */
  function symbolPath(c, kind, x, y, s) { c.beginPath();
    if (kind === 1) { c.arc(x, y, s * 0.82, 0, TAU); }
    else if (kind === 2) { for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i / 3 * TAU; i ? c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s * 1.02 + s * 0.12) : c.moveTo(x + Math.cos(a) * s, y + Math.sin(a) * s * 1.02 + s * 0.12); } c.closePath(); }
    else { c.moveTo(x, y - s); c.lineTo(x + s * 0.78, y); c.lineTo(x, y + s); c.lineTo(x - s * 0.78, y); c.closePath(); } }
  /* draw(c, x, y, P, o): the eel about the head's ground point (x, y); o = { T, sx, sy, t, noGL }. GPU only (the user: no
     new simplified 2D model); R.drawn says whether it drew, and where it did not, the fight draws the existing 2D Nhalu
     (DunBoss 'nhalu', the old Belfry boss's picture) with the same mechanics */
  let LAST = null;
  function draw(c, x, y, P, o) {
    o = o || {}; const t = o.t != null ? o.t : nowMs() / 1000, R = rig(P, t), V = mkView(x, y, 0, o), al0 = P.alpha == null ? 1 : P.alpha; LAST = { R, V }; R.drawn = false;
    if (!(al0 > 0.01)) { R.drawn = true; return R; }
    if (!o.noGL && glOn()) { try { R.drawn = glPass(c, V, R.inst, al0, { t, low: o.low, occ: lowFx() ? null : R.occ, clip: P.clip }); } catch (e) { glFail(); if (typeof console !== 'undefined') console.warn('Nhalu: draw', e); } }
    return R;
  }
  function anchor(name, i) { if (!LAST) return null; let p = LAST.R.A[name]; if (p && i != null) p = p[i]; return p ? LAST.V.toW(p) : null; }
  const MODEL = { draw, rig, anchor, symbolPath, RAD, BULB_S, BULB_R, BODY_L, HEAD_L, LEN, NSL, SL, DS, NSP, ZSQ,
    __dbg: { get gl() { return glOn(); }, set noGL(v) { NOGL = !!v; }, get MESH() { return MESH; }, get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +GLMS.toFixed(2), frames: GLN, box: GLBOX, meshMs: +MESH_MS.toFixed(1), meshTris: MESH ? Object.values(MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0 }); } } };

  /* =====================================================================================================================
     THE NAVE AND THE FIGHT
     ===================================================================================================================== */
  const ARENA_R = 16, NX = 10.5, NY = 11;   // the nave: C.x +- NX, C.y +- NY (tiles)
  const LX = [-7, 0, 7], LWW = 2.9, HW = 3.5;   // the lanes' centres, the water's half width, the danger's half width (over half of each strip)
  const WHEELS = [[-8.9, 9.6], [8.9, 9.6]];
  const WATER_Z = 0.21;
  const TUNE = { bars: 7, effHp: 12500 * 4 /* v404 */, leechHits: 5, leechDmg: 0.45, dmg: 24, thunder: 1.9, bite: 1.5, kSwim: 0.5, kRest: 0.72, kRear: 0.6, kBeach: 1.55 };
  const TM = { hunt: 2.75, gap: 1.5, disFx: 1.15, rest: [1.4, 1.1], swimT: 2.6, drainWait: [9.5, 10.5], beach: 8, recover: 1.3, bite: 2.5, biteLock: 1.0, biteEvery: 3.4, biteReach: 6.0, snap: 2.6, refillGrace: 1.4, leechSpd: 0.85, wheelR: 0.95, chan: 0.75 };
  const CYC = { 1: ['hunt', 'drain', 'hunt', 'hunt', 'drain'], 2: ['hunt2', 'drain', 'hunt2', 'hunt', 'drain'] };
  const AMBER = '#FFC857', AMBER_HI = '#FFE6A8', VOLT = '#9FE8FF', VOLT_HI = '#E6F8FF', TEAL = '#61D9D2', WARN = '#FF6A5A', LEECH = '#B6A2F0', INK = '#0A1420';
  const SYM_NAME = ['', 'RING', 'TRIANGLE', 'DIAMOND'];
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k);
  const sf = (FX, k, ...a) => { const s = FX.H && FX.H.sfx; if (s && s[k]) try { s[k](...a); } catch (e) { /* no sound */ } };
  const laneX = (C, i) => C.x + LX[i];
  const laneOf = (C, x) => { let b = 0, bd = 1e9; for (let i = 0; i < 3; i++) { const d = Math.abs(x - laneX(C, i)); if (d < bd) { bd = d; b = i; } } return b; };
  const inLane = (C, i, x, y, r) => Math.abs(x - laneX(C, i)) < HW + (r || 0) * 0.5 && y > C.y - NY - 0.5 && y < C.y + NY + 0.5;
  const inNave = (C, x, y, pad) => Math.abs(x - C.x) < NX - (pad || 0) && Math.abs(y - C.y) < NY - (pad || 0);
  let CUR = null;   // (the stage module made for this fight, found by its game)
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(() => { LAST = null; CUR = null; }); } catch (e) {}   // v404 IF: the dead stage let go when a new stage is made

  /* ---------- the painter's helpers ---------- */
  const glowAt = (c, x, y, r, col, a) => { if (!(r > 0) || !(a > 0.004) || typeof glowSprite !== 'function') return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col, edge) => { c.save(); c.font = `900 ${Math.round(size)}px ${typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = Math.max(3, size * 0.22); c.strokeStyle = edge || 'rgba(4,10,18,.88)'; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); c.restore(); };

  /* ---------- the ground: limestone flags in world space, three sunken water lanes, dry strips with drainage grooves ---------- */
  function paintGround(c, A) {
    const R = A.R, rnd = A.rnd, H = (x, y) => hash(x * 17.31 + y * 91.7 + 3.3);
    // beyond the nave: the drowned dark, column feet and a black tidal stain
    let g = c.createRadialGradient(0, 0, 4, 0, 0, R + 1.6); g.addColorStop(0, '#0E2C3A'); g.addColorStop(0.7, '#0B2230'); g.addColorStop(1, 'rgba(6,16,24,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.6, 0, TAU); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(97,217,210,.07)'; c.lineWidth = 0.06; for (let i = 0; i < 90; i++) { const a = rnd() * TAU, d = NX + 1 + rnd() * 5, x = Math.cos(a) * d, y = Math.sin(a) * d * 0.9; if (Math.abs(x) < NX + 0.6 && Math.abs(y) < NY + 0.6) continue; c.beginPath(); c.ellipse(x, y, 0.4 + rnd() * 0.7, 0.2 + rnd() * 0.3, rnd(), 0, TAU); c.stroke(); } c.restore();
    // the nave's floor: one flat ground first (the engine's per-tile shade is not used), then flags laid in world courses
    // (the Belfry's nave stone, BEL.LANDS.belnave, when the rift is loaded: every tone a property of a block, never a tile)
    const LD = (typeof BEL !== 'undefined' && BEL.LANDS && BEL.LANDS.belnave) || { base: '#5F7174', tones: ['#66787B', '#5C6E71', '#55676A', '#6C7D7F'], seam: '#163234', bw: 2.15, bh: 1.7, jit: 0.38 };
    c.fillStyle = LD.base; c.fillRect(-NX, -NY, NX * 2, NY * 2);
    const CH = LD.bh || 1.7, BW = LD.bw || 2.15;
    for (let row = 0, y = -NY; y < NY - 1e-3; row++, y += CH) { const off = (row % 2) * BW * 0.5 + H(row, 9) * 0.4, y1 = Math.min(NY, y + CH);
      for (let x = -NX - off - BW; x < NX; x += BW) { const k = H(Math.round((x + off) * 10), row), x0 = Math.max(-NX, x), x1 = Math.min(NX, x + BW); if (x1 <= x0) continue;
        c.fillStyle = LD.tones[Math.floor(k * LD.tones.length) % LD.tones.length]; c.fillRect(x0, y, x1 - x0, y1 - y);
        const gg = c.createLinearGradient(x0, y, x1, y1); gg.addColorStop(0, 'rgba(255,255,250,.07)'); gg.addColorStop(0.55, 'rgba(255,255,255,0)'); gg.addColorStop(1, `rgba(10,30,34,${(0.05 + H(row, k * 31) * 0.07).toFixed(3)})`); c.fillStyle = gg; c.fillRect(x0, y, x1 - x0, y1 - y);
        c.fillStyle = 'rgba(255,255,248,.13)'; c.fillRect(x0, y, x1 - x0, 0.04); c.fillRect(x0, y, 0.04, y1 - y); c.fillStyle = 'rgba(8,26,30,.16)'; c.fillRect(x0, y1 - 0.04, x1 - x0, 0.04); c.fillRect(x1 - 0.04, y, 0.04, y1 - y);
        if (k > 0.8) { c.strokeStyle = 'rgba(16,40,44,.4)'; c.lineWidth = 0.025; c.beginPath(); let px = x0 + (x1 - x0) * H(row, 5), py = y; c.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (H(row * 7 + j, k) - 0.5) * 0.5; py += CH * 0.25; c.lineTo(px, py); } c.stroke(); }
        for (let j = 0; j < 6; j++) { const sx2 = x0 + (x1 - x0) * H(row * 13 + j, k * 7), sy2 = y + CH * H(row * 17 + j, k * 3); c.fillStyle = j % 3 ? 'rgba(30,50,52,.22)' : 'rgba(255,255,250,.2)'; c.fillRect(sx2, sy2, 0.04, 0.04); }
        c.strokeStyle = LD.seam; c.lineWidth = 0.06; c.strokeRect(x0, y, x1 - x0, y1 - y); } }
    // soft world-space washes: wet sheen and teal algae, one blob per coarse cell
    for (let gy = -4; gy <= 4; gy++) for (let gx = -4; gx <= 4; gx++) { const kk = H(gx + 40, gy + 40); if (kk > 0.55) continue; const cx = gx * 2.8 + H(gx, gy) * 2, cy = gy * 2.8 + H(gy, gx) * 2, rr = 0.9 + H(gx * 3, gy) * 1.6, g2 = c.createRadialGradient(cx, cy, 0, cx, cy, rr);
      const col = kk < 0.25 ? '14,26,30' : kk < 0.42 ? '150,230,240' : '40,96,84', al = kk < 0.25 ? 0.18 : 0.1; g2.addColorStop(0, `rgba(${col},${al})`); g2.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g2; c.save(); c.beginPath(); c.rect(-NX, -NY, NX * 2, NY * 2); c.clip(); c.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); c.restore(); }
    // the lanes: the floor sunk a hand's depth, stained darker and green toward their kerbs (the water is laid live)
    for (let i = 0; i < 3; i++) { const x0 = LX[i] - LWW, x1 = LX[i] + LWW;
      c.fillStyle = 'rgba(30,58,64,.42)'; c.fillRect(x0, -NY, x1 - x0, NY * 2);
      let gl = c.createLinearGradient(x0, 0, x0 + 0.7, 0); gl.addColorStop(0, 'rgba(10,30,34,.55)'); gl.addColorStop(1, 'rgba(10,30,34,0)'); c.fillStyle = gl; c.fillRect(x0, -NY, 0.7, NY * 2);
      gl = c.createLinearGradient(x1, 0, x1 - 0.7, 0); gl.addColorStop(0, 'rgba(10,30,34,.55)'); gl.addColorStop(1, 'rgba(10,30,34,0)'); c.fillStyle = gl; c.fillRect(x1 - 0.7, -NY, 0.7, NY * 2);
      for (let k = 0; k < 26; k++) { const y = -NY + rnd() * NY * 2, x = rnd() < 0.5 ? x0 + rnd() * 0.5 : x1 - rnd() * 0.5; c.fillStyle = `rgba(60,${110 + rnd() * 40},90,${0.12 + rnd() * 0.12})`; c.beginPath(); c.ellipse(x, y, 0.2 + rnd() * 0.4, 0.15 + rnd() * 0.3, 0, 0, TAU); c.fill(); } }
    // the dry strips: raised kerbs with brass edges and a drainage groove down the middle, grated every few steps
    for (const sx of [-3.5, 3.5]) { c.fillStyle = '#B9BDAE'; c.fillRect(sx - 0.6, -NY, 1.2, NY * 2); for (let y = -NY; y < NY; y += 1.3) { c.fillStyle = `rgba(${200 + H(sx, y) * 20 | 0},${204 + H(y, sx) * 16 | 0},${188 + H(sx * 3, y) * 16 | 0},.9)`; c.fillRect(sx - 0.58, y + 0.03, 1.16, 1.24); c.strokeStyle = 'rgba(36,80,79,.5)'; c.lineWidth = 0.04; c.strokeRect(sx - 0.58, y + 0.03, 1.16, 1.24); }
      c.strokeStyle = 'rgba(149,121,67,.85)'; c.lineWidth = 0.07; for (const e of [-0.6, 0.6]) { c.beginPath(); c.moveTo(sx + e, -NY); c.lineTo(sx + e, NY); c.stroke(); }
      const gg = c.createLinearGradient(sx - 0.2, 0, sx + 0.2, 0); gg.addColorStop(0, '#22383C'); gg.addColorStop(0.5, '#0E2026'); gg.addColorStop(1, '#2C4246'); c.fillStyle = gg; c.fillRect(sx - 0.19, -NY, 0.38, NY * 2);
      for (let y = -NY + 1.2; y < NY - 0.5; y += 2.6) { c.fillStyle = '#6E5A34'; c.fillRect(sx - 0.28, y, 0.56, 0.62); c.fillStyle = '#0A161A'; for (let k = 0; k < 4; k++) c.fillRect(sx - 0.22, y + 0.07 + k * 0.14, 0.44, 0.07); } }
    // the outer kerbs and the walls' black tidal stain creeping onto the floor
    for (const sg of [-1, 1]) { const x = sg * NX; const gs = c.createLinearGradient(x, 0, x - sg * 1.4, 0); gs.addColorStop(0, 'rgba(8,14,16,.55)'); gs.addColorStop(1, 'rgba(8,14,16,0)'); c.fillStyle = gs; c.fillRect(Math.min(x, x - sg * 1.4), -NY, 1.4, NY * 2); }
    { const gs = c.createLinearGradient(0, -NY, 0, -NY + 1.6); gs.addColorStop(0, 'rgba(8,14,16,.6)'); gs.addColorStop(1, 'rgba(8,14,16,0)'); c.fillStyle = gs; c.fillRect(-NX, -NY, NX * 2, 1.6); }
    // the north: the deep basin the eel rises from, under the broken apse
    { const gb = c.createRadialGradient(0, -NY - 0.5, 0.5, 0, -NY - 0.5, 6); gb.addColorStop(0, '#071A24'); gb.addColorStop(0.6, 'rgba(10,36,50,.85)'); gb.addColorStop(1, 'rgba(10,36,50,0)'); c.fillStyle = gb; c.beginPath(); c.ellipse(0, -NY - 0.3, 9.5, 2.6, 0, 0, TAU); c.fill(); }
    // the south threshold: worn steps up to the entrance, and the two wheels' round plinths
    for (let k = 0; k < 3; k++) { c.fillStyle = `rgba(${200 - k * 12},${204 - k * 12},${190 - k * 12},.9)`; c.fillRect(-2.6 + k * 0.2, NY - 0.2 + k * 0.45, 5.2 - k * 0.4, 0.42); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-2.6 + k * 0.2, NY - 0.2 + k * 0.45 + 0.36, 5.2 - k * 0.4, 0.06); }
    for (const [wx, wy] of WHEELS) { const gp = c.createRadialGradient(wx - 0.3, wy - 0.3, 0.2, wx, wy, 1.25); gp.addColorStop(0, '#D6D9C8'); gp.addColorStop(1, '#8E9484'); c.fillStyle = gp; c.beginPath(); c.arc(wx, wy, 1.2, 0, TAU); c.fill(); c.strokeStyle = 'rgba(149,121,67,.9)'; c.lineWidth = 0.1; c.stroke();
      c.strokeStyle = 'rgba(40,70,72,.6)'; c.lineWidth = 0.05; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(wx + Math.cos(a) * 0.5, wy + Math.sin(a) * 0.5); c.lineTo(wx + Math.cos(a) * 1.15, wy + Math.sin(a) * 1.15); c.stroke(); } }
    // the nave's rim: the foot of the walls
    c.strokeStyle = '#0C1A20'; c.lineWidth = 0.3; c.strokeRect(-NX - 0.1, -NY - 0.1, NX * 2 + 0.2, NY * 2 + 0.2);
    c.strokeStyle = 'rgba(149,121,67,.55)'; c.lineWidth = 0.08; c.strokeRect(-NX + 0.08, -NY + 0.08, NX * 2 - 0.16, NY * 2 - 0.16);
  }
  /* the sky beyond: purple clouds low over a dark sea, the moon, the tilted bell tower far off */
  function paintSky(c, W, H, t, cam, T) {
    if (typeof BEL !== 'undefined' && BEL.paintSky) { try { BEL.paintSky(c, W, H, T, { cam, t: 12.5 }); return; } catch (e) { /* (its own below) */ } }
    if (typeof RiftFiend !== 'undefined' && RiftFiend.seaSky) RiftFiend.seaSky(c, W, H, 12.5, cam, T, { top: '#150C26', mid: '#1C1636', bot: '#071820', moon: '#BFE8F0',
      silhouette: (c2, W2, H2) => { const x = W2 * 0.22, y = H2 * 0.62, s = Math.min(W2, H2) * 0.32; c2.save(); c2.translate(x, y); c2.rotate(-0.12); c2.fillStyle = 'rgba(8,10,20,.92)'; c2.fillRect(-s * 0.16, -s * 1.3, s * 0.32, s * 1.4); c2.beginPath(); c2.moveTo(-s * 0.2, -s * 1.3); c2.lineTo(0, -s * 1.62); c2.lineTo(s * 0.2, -s * 1.3); c2.closePath(); c2.fill();
        c2.fillStyle = 'rgba(149,121,67,.55)'; c2.beginPath(); c2.moveTo(-s * 0.1, -s * 1.02); c2.quadraticCurveTo(-s * 0.1, -s * 1.2, 0, -s * 1.2); c2.quadraticCurveTo(s * 0.1, -s * 1.2, s * 0.1, -s * 1.02); c2.closePath(); c2.fill(); c2.restore(); } });
    else { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#150C26'); g.addColorStop(1, '#071820'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    const R = typeof mulberry32 === 'function' ? mulberry32(8181) : Math.random; c.save(); for (let i = 0; i < 9; i++) { const x = R() * W, y = H * (0.04 + R() * 0.22), w = W * (0.25 + R() * 0.35); const g = c.createRadialGradient(x, y, 2, x, y, w); g.addColorStop(0, 'rgba(70,40,110,.45)'); g.addColorStop(1, 'rgba(40,20,70,0)'); c.fillStyle = g; c.fillRect(x - w, y - w * 0.4, w * 2, w * 0.8); } c.restore();
  }
  /* the nave's columns (square, ivory blocks with dark teal seams, the bottom third stained black) and the north wall */
  function drawColumn(c, X, Y, T, p) { const w = T * 0.62, h = T * (3.3 + (p.v % 2) * 0.4), stain = h * 0.34;
    if (typeof window !== 'undefined' && window.BELPROPS && window.BELPROPS.draw(c, 'navecol', p.v % 4, X, Y, T)) { c.fillStyle = 'rgba(140,220,230,.18)'; c.beginPath(); c.ellipse(X, Y, w * 1.25, w * 0.4, 0, 0, TAU); c.fill(); return; }   // v392 PR: a repainted drum column (20n9); the old 2D only where that is off
    let g = c.createLinearGradient(X - w, 0, X + w, 0); g.addColorStop(0, '#E8E6D6'); g.addColorStop(0.55, '#C8CCBC'); g.addColorStop(1, '#8E9282'); c.fillStyle = g; c.fillRect(X - w, Y - h, w * 2, h);
    g = c.createLinearGradient(0, Y, 0, Y - stain); g.addColorStop(0, 'rgba(10,16,18,.92)'); g.addColorStop(0.7, 'rgba(10,16,18,.55)'); g.addColorStop(1, 'rgba(10,16,18,0)'); c.fillStyle = g; c.fillRect(X - w, Y - stain, w * 2, stain);
    c.strokeStyle = 'rgba(20,70,72,.55)'; c.lineWidth = Math.max(1, T * 0.04); for (let k = 1; k < 5; k++) { const y = Y - h * k / 5; c.beginPath(); c.moveTo(X - w, y); c.lineTo(X + w, y); c.stroke(); }
    c.fillStyle = '#F2F0E2'; c.fillRect(X - w * 1.12, Y - h - T * 0.18, w * 2.24, T * 0.2); c.fillStyle = 'rgba(149,121,67,.9)'; c.fillRect(X - w * 1.02, Y - h * 0.62, w * 2.04, T * 0.1);
    if (p.v % 3 === 0) { c.strokeStyle = 'rgba(97,217,210,.75)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.moveTo(X - w * 0.3, Y - h * 0.8); c.lineTo(X + w * 0.1, Y - h * 0.7); c.lineTo(X - w * 0.05, Y - h * 0.58); c.stroke(); glowAt(c, X, Y - h * 0.7, T * 0.6, TEAL, 0.25); }
    c.fillStyle = 'rgba(140,220,230,.18)'; c.beginPath(); c.ellipse(X, Y, w * 1.25, w * 0.4, 0, 0, TAU); c.fill(); }
  function drawNorthWall(c, X, Y, T, p) { const w = T * p.w / 2, h = T * 3.6;
    { const BP = typeof window !== 'undefined' && window.BELPROPS; if (BP && BP.has('wallseg')) { let ok = true; c.save(); c.beginPath(); c.rect(X - w, Y - h - T * 0.6, w * 2, h + T * 1.2); c.clip(); for (let x = X - w; x < X + w && ok; x += T * 4.8) ok = BP.draw(c, 'wallseg', 0, x, Y, T); c.restore(); if (ok) { glowAt(c, X - w * 0.15, Y - h * 0.75, T * 1.2, TEAL, 0.3); return; } } }   // v392 PR: the wall repainted in bays (20n9)
    const g = c.createLinearGradient(0, Y - h, 0, Y); g.addColorStop(0, '#DCDACA'); g.addColorStop(0.62, '#B2B6A6'); g.addColorStop(0.64, '#1A2226'); g.addColorStop(1, '#0A1014'); c.fillStyle = g; c.fillRect(X - w, Y - h, w * 2, h);
    c.strokeStyle = 'rgba(20,70,72,.6)'; c.lineWidth = Math.max(1, T * 0.04); for (let k = 1; k < 4; k++) { const y = Y - h + h * 0.62 * k / 4; c.beginPath(); c.moveTo(X - w, y); c.lineTo(X + w, y); c.stroke(); }
    for (let x = X - w + T * 1.9; x < X + w; x += T * 2.4) { c.beginPath(); c.moveTo(x, Y - h); c.lineTo(x, Y - h * 0.38); c.stroke(); }
    c.fillStyle = 'rgba(149,121,67,.9)'; for (let x = X - w + T * 1.2; x < X + w; x += T * 4.8) c.fillRect(x - T * 0.12, Y - h, T * 0.24, h * 0.66);
    c.strokeStyle = 'rgba(97,217,210,.8)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(X - w * 0.2, Y - h * 0.9); c.lineTo(X - w * 0.1, Y - h * 0.75); c.lineTo(X - w * 0.18, Y - h * 0.6); c.stroke(); glowAt(c, X - w * 0.15, Y - h * 0.75, T * 1.2, TEAL, 0.3);
    c.fillStyle = '#F0EEE0'; c.fillRect(X - w, Y - h - T * 0.2, w * 2, T * 0.22); }
  /* a sluice wheel on its plinth: brass spokes, a stone housing; exposed it glows; locked by a leech it is violet */
  function drawWheel(c, FX, p, X, Y, T, t) { const W2 = FX && FX.mem && FX.mem.wheels ? FX.mem.wheels[p.i] : null, ex = W2 && W2.exposed, lk = W2 && W2.locked, spin = W2 ? W2.spin : 0, r = T * 0.78;
    if (!(typeof window !== 'undefined' && window.BELPROPS && window.BELPROPS.draw(c, 'housing', 0, X, Y - r * 0.32, T))) { c.fillStyle = '#5E6458'; c.fillRect(X - r * 0.9, Y - r * 1.9, r * 1.8, r * 1.5); c.fillStyle = '#878D7E'; c.fillRect(X - r * 0.9, Y - r * 1.95, r * 1.8, r * 0.18); }   // v392 PR: a repainted stone housing
    if (ex) glowAt(c, X, Y - r * 1.25, r * (2.6 + 0.4 * Math.sin(t * 5)), lk ? LEECH : TEAL, lk ? 0.4 : 0.55);
    c.save(); c.translate(X, Y - r * 1.25); c.scale(1, 0.92); c.rotate(spin);
    c.strokeStyle = '#3A2E14'; c.lineWidth = Math.max(2, r * 0.22); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.strokeStyle = ex ? '#E0C27A' : '#957943'; c.lineWidth = Math.max(1.5, r * 0.15); c.stroke();
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.strokeStyle = '#3A2E14'; c.lineWidth = Math.max(1.5, r * 0.12); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke(); c.strokeStyle = ex ? '#D8B868' : '#8A7040'; c.lineWidth = Math.max(1, r * 0.07); c.stroke();
      c.fillStyle = '#C9A860'; c.beginPath(); c.arc(Math.cos(a) * r * 1.08, Math.sin(a) * r * 1.08, r * 0.09, 0, TAU); c.fill(); }
    c.fillStyle = '#C9A860'; c.beginPath(); c.arc(0, 0, r * 0.2, 0, TAU); c.fill(); c.restore();
    if (ex) { label(c, lk ? 'LEECHED' : 'DRAIN', X, Y - r * 2.6, T * 0.36, lk ? LEECH : '#DFFBF8'); const ch = W2.ch || 0; if (ch > 0) { c.save(); c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.arc(X, Y - r * 1.25, r * 1.3, 0, TAU); c.stroke(); c.strokeStyle = '#FFFFFF'; c.beginPath(); c.arc(X, Y - r * 1.25, r * 1.3, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, ch / TM.chan)); c.stroke(); c.restore(); } } }

  /* ---------- the breakables: sea-glass growths on the kerbs and brass lanterns on the strips (BREAK_FX) ---------- */
  function paintGlass(c, P) { if (typeof window !== 'undefined' && window.BELPROPS && window.BELPROPS.draw(c, 'seaglass', 0, 0, 0, P)) return;   // v392 PR: repainted (20n9), the shards cut from it
    const cols = ['#BFF4EC', '#8FDCD4', '#DFFFF8']; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.32, h = P * (0.55 + 0.35 * hash(i + 4)), w = P * 0.13, bx = (i - 2) * P * 0.12;
      c.save(); c.translate(bx, 0); c.rotate(a + Math.PI / 2); c.fillStyle = cols[i % 3]; c.strokeStyle = 'rgba(20,80,90,.8)'; c.lineWidth = Math.max(1, P * 0.025); c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w * 0.7, -h * 0.8); c.lineTo(0, -h); c.lineTo(w * 0.7, -h * 0.8); c.lineTo(w, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.moveTo(-w * 0.4, -h * 0.1); c.lineTo(-w * 0.3, -h * 0.7); c.lineTo(0, -h * 0.85); c.closePath(); c.fill(); c.restore(); } }
  function paintLamp(c, P) { if (typeof window !== 'undefined' && window.BELPROPS && window.BELPROPS.draw(c, 'lamppost', 0, P * 0.18, 0, P, { s: 0.42 })) return;   // v392 PR: repainted (20n9)
    c.fillStyle = '#4A3A1E'; c.fillRect(-P * 0.05, -P * 1.1, P * 0.1, P * 1.1); c.fillStyle = '#957943'; c.fillRect(-P * 0.2, -P * 1.4, P * 0.4, P * 0.36); c.fillStyle = '#BFF4EC'; c.fillRect(-P * 0.14, -P * 1.36, P * 0.28, P * 0.28); c.fillStyle = '#957943'; c.beginPath(); c.moveTo(-P * 0.24, -P * 1.4); c.lineTo(0, -P * 1.58); c.lineTo(P * 0.24, -P * 1.4); c.closePath(); c.fill(); c.fillStyle = '#6E5A34'; c.fillRect(-P * 0.22, -P * 0.06, P * 0.44, P * 0.08); }
  function paintBulb(c, P) { const r = P * 0.36, y = -P * 0.5, g = c.createRadialGradient(-r * 0.3, y - r * 0.3, r * 0.1, 0, y, r); g.addColorStop(0, '#FFF2C8'); g.addColorStop(0.5, '#FFB040'); g.addColorStop(1, '#7A3A08'); c.fillStyle = g; c.beginPath(); c.arc(0, y, r, 0, TAU); c.fill(); c.strokeStyle = 'rgba(40,20,10,.8)'; c.lineWidth = Math.max(1, P * 0.03); c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(-r * 0.35, y - r * 0.4, r * 0.25, r * 0.13, -0.5, 0, TAU); c.fill(); }
  const BREAKS = [{ kind: 'belglass', x: -10.0, y: -5.2 }, { kind: 'belglass', x: 10.0, y: -5.2 }, { kind: 'belglass', x: -10.0, y: 2.6 }, { kind: 'belglass', x: 10.0, y: 2.6 }, { kind: 'bellamp', x: -3.5, y: -8.2 }, { kind: 'bellamp', x: 3.5, y: -8.2 }];
  function breakObj(FX, o) { const M = FX.mem; if (M && M.end) return; const glass = o.kind === 'belglass'; if (M && M.stat) M.stat.broken++;
    if (typeof BREAK_FX !== 'undefined') try { BREAK_FX.burst(null, o.x, o.y, { paint: glass ? paintGlass : paintLamp, key: o.kind, w: glass ? 1.2 : 0.7, h: glass ? 1.0 : 1.6, mat: glass ? 'glass' : 'iron', mix: glass ? 'stone' : 'glass', size: glass ? 1.1 : 1.6, from: { x: FX.me.x, y: FX.me.y } }); } catch (e) { /* (the shared break effect) */ }
    else FX.H.sparks(o.x, o.y - 0.6, glass ? '#BFF4EC' : '#D8B868', 14, 5); }

  /* =========================== THE FIGHT =========================== */
  const def = {
    arenaR: ARENA_R, firstAct: 'swim', ambient: 'motes',
    phaseNames: ['Lantern Hunt', 'Twin Thunder'],
    carve(set, C) { for (let ty = Math.floor(C.y - ARENA_R) - 1; ty <= Math.ceil(C.y + ARENA_R) + 1; ty++) for (let tx = Math.floor(C.x - ARENA_R) - 1; tx <= Math.ceil(C.x + ARENA_R) + 1; tx++) if (!inNave(C, tx + 0.5, ty + 0.5, 0)) set(tx, ty, T_SOLID); },
    start(C) { return { x: C.x + 0.5, y: C.y + NY - 1.4 }; },
    props(C) { const out = [];
      for (let i = 0; i < 6; i++) for (const sg of [-1, 1]) out.push({ kind: 'column', v: i + (sg > 0 ? 6 : 0), x: C.x + sg * (NX + 1.0), y: C.y - NY + 1.6 + i * 3.9 });
      out.push({ kind: 'nwall', x: C.x, y: C.y - NY - 0.8, w: NX * 2 + 3 });
      WHEELS.forEach(([dx, dy], i) => out.push({ kind: 'wheel', i, x: C.x + dx, y: C.y + dy }));
      return out; },
    propKeep: { every: 30, only: p => p.kind !== 'wheel', box: p => p.kind === 'nwall' ? [-p.w / 2 - 0.5, -4.2, p.w / 2 + 0.5, 0.6] : [-1.2, -4.6, 1.2, 0.8] },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'column') drawColumn(c, X, Y, T, p); else if (p.kind === 'nwall') drawNorthWall(c, X, Y, T, p); else if (p.kind === 'wheel') drawWheel(c, FX, p, X, Y, T, t); },
    paintGround(c, A) { paintGround(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, t, cam, T); },
    overlay(c, FX, t, T) { overlay(c, FX, t, T); },
    init(FX) { const m = FX.m, M = FX.mem, C = FX.C; m.noTouch = true; m.touchK = 0; m.r = 1.0;
      const hx = C.x, hy = (C.y - NY - 2.5) / GY;
      Object.assign(M, { ok: 1, bt: 0, hx, hy, hd: Math.PI / 2, spd: 0, spdTo: 2.2, path: [], tgt: { x: C.x, y: (C.y - 3) / GY }, wph: 0, amp: 0.3, ampTo: 0.3, swimW: 4.5,
        rear: 0, rearTo: 0, pitch: 0.05, pitchTo: 0.05, yaw: 0, jaw: 0, jawTo: 0, fin: 0, roll: 0, rollTo: 0, zDrop: 0, zDropTo: 0, chg: 0, chgTo: 0, dry: 0, dead: 0, lunge: 0, lungeA: 0, lungeL: 0,
        bulbs: [0, 1, 2].map(i => ({ g: 0.3, gTo: 0.62, sym: i + 1, burst: false })), bulbI: 0,
        lanes: [0, 1, 2].map(i => ({ i, armed: null, fx: 0, wet: 1, wetTo: 1, arcs: [], arcT: 0, seed: i * 7.7 })),
        tele: [], wheels: WHEELS.map(([dx, dy], i) => ({ i, x: C.x + dx, y: C.y + dy, exposed: false, locked: false, ch: 0, used: false, spin: 0, spinV: 0 })),
        leeches: [], ac: null, cyc: 0, wait: 1.6, rest: false, swimming: true, idleT: 0, end: null, seen: {}, sp: null, wasStun: false, beach: null, hpPrev: m.hp, effHp: TUNE.effHp,
        stat: { hunts: 0, hunt2s: 0, armed: 0, discharges: 0, disHit: 0, maxArmed: 0, noSafe: 0, seqGap: [], drains: 0, exposed: 0, drained: 0, beached: 0, beachT: 0, deadline: 0, bites: 0, biteHit: 0, snaps: 0, leeches: 0, leechLock: 0, leechKill: 0, refill: 0, broken: 0, dmg: { swim: 0, rest: 0, rear: 0, beach: 0 }, phaseAt: [], lanesHit: [0, 0, 0] } });
      for (let k = 0; k < 120; k++) M.path.push({ x: hx, y: hy - k * 0.1 });
      m.x = hx; m.y = hy * GY;
      if (CUR && CUR.g === FX.H.g) { M.mod = CUR.mod; CUR.FX = FX; }
      M.effHp *= typeof BEL_FOE_BOSS_K === 'function' ? BEL_FOE_BOSS_K(FX) : 1;   /* v430 BD: the rift's main-boss health (x3 in the Belfry), on his effective health; his bars read as before */
      M.hpAmp = m.maxhp / M.effHp;
      M.breaks = BREAKS.map(b => { const o = FX.obj({ kind: b.kind, x: C.x + b.x, y: C.y + b.y, r: b.kind === 'belglass' ? 0.55 : 0.4, hp: b.kind === 'belglass' ? 90 : 60, onHit: q => { q.flash = 0.1; sf(FX, 'tick'); }, onKill: q => breakObj(FX, q) }); return o; });
      spine(FX, m, M, 0); },
    phase(FX, p) { const M = FX.mem, m = FX.m; M.stat.phaseAt.push([p, +FX.S.t.toFixed(1)]);
      if (!M.beach) clearActs(FX, m, M); M.cyc = 0; M.wait = 1.0;
      if (p === 2) M.p2 = { t: 0 };   // (v398 B4: the 50% moment: the lanterns flare in turn, the charge runs down its body, the nave flashes)
      if (p === 2) FX.H.banner('TWIN THUNDER', 'Two lanes charge in turn: leave the first, then step into its spent water', AMBER_HI, 3.2, true); },
    ai(FX, m, dt) { const M = FX.mem; if (!M.ok || M.end) return; m.actT += dt; m.noTouch = true;
      if (!M.ac) { idle(FX, m, M, dt); return; }
      actStep(FX, m, M, dt); },
    stunned(FX, m, dt) { const M = FX.mem; m.noTouch = true; if (!lowFx() && Math.random() < dt * 5 && M.sp) { const s = Math.random() * BODY_L, p = spW(m, M, s); FX.H.part({ kind: 'smoke', x: p.x + FX.rnd(-0.4, 0.4), y: p.y - 0.4, vx: FX.rnd(-0.3, 0.3), vy: -0.8, drag: 0.6, life: 0.9, max: 0.9, size: 0.45, color: 'rgba(220,240,245,' }); } },
    update(FX, dt) { update(FX, dt); },
    dmgK(FX, m, o) { const M = FX.mem; if (!M || !M.stat) return 1; const k = kNow(M); if (k < 0.6 && Math.random() < 0.05) FX.H.text(m.x, m.y - 1.8, 'Slick hide', '#CFE0F0', 12); return k * (M.hpAmp || 1) * stackK(FX, o); },
    ending(FX, m) { const M = FX.mem; clearActs(FX, m, M); for (const L of M.lanes) { L.armed = null; } M.tele.length = 0; for (const W2 of M.wheels) { W2.exposed = false; W2.locked = false; } killLeeches(FX, M); M.beach = null; M.end = { t: 0, burst: 0 }; FX.noParts(); sf(FX, 'hum');
      return { title: 'NHALU FALLS', sub: 'Its lanterns burst and the nave goes dark', col: AMBER, delay: 6.4, bannerAt: 3.1, quiet: true, slow: 0.35 }; },
    camFocus(FX, m) { return camFocus(FX, m); },
    draw(c, FX, m, X, Y, T, t) { drawEel(c, FX, m, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'belglass') { c.save(); c.translate(X, Y); paintGlass(c, T); c.restore(); glowAt(c, X, Y - T * 0.5, T * 0.9, '#8FE8E0', 0.18); } else if (o.kind === 'bellamp') { c.save(); c.translate(X, Y); paintLamp(c, T); c.restore(); glowAt(c, X, Y - T * 1.22, T * 0.8, TEAL, 0.35); } else if (o.kind === 'belleech') drawLeechFallback(c, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawFx(c, FX, T, t); },
  };

  /* ---------- the spine: the head's swum path, a travelling wave, the act's lift, lunge and roll ---------- */
  function pathSamples(M, n, ds) { const P = M.path, out = new Array(n); let i = 0, acc = 0, segL = P.length > 1 ? Math.hypot(P[1].x - P[0].x, P[1].y - P[0].y) : 0;
    for (let k = 0; k < n; k++) { const d = k * ds; while (i < P.length - 2 && acc + segL < d) { acc += segL; i++; segL = Math.hypot(P[i + 1].x - P[i].x, P[i + 1].y - P[i].y); }
      if (P.length < 2) { out[k] = { x: P[0].x - Math.cos(M.hd) * d, y: P[0].y - Math.sin(M.hd) * d }; continue; }
      const a = P[i], b = P[i + 1], u = (d - acc) / (segL || 1e-6); out[k] = { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }; }
    return out; }
  function spine(FX, m, M, dt) {
    const n = NSP, base = pathSamples(M, n, DS), pts = new Array(n), rolls = new Array(n), t = M.bt;
    const beachK = M.beach ? 1 : 0, deadK = M.end ? cl(M.end.t / 3) : 0;
    for (let k = 0; k < n; k++) { const s = k * DS, a = base[Math.max(0, k - 1)], b = base[Math.min(n - 1, k + 1)], tx = a.x - b.x, ty = a.y - b.y, tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl;
      const A = M.amp * (0.12 + 0.88 * Math.pow(s / BODY_L, 1.25)), w = Math.sin(s * 1.45 - M.wph) * A;
      let x = base[k].x - uy * w, y = base[k].y + ux * w;
      const fl = Math.max(0, 1 - s / 2.6); if (M.lunge > 0) { const L = M.lunge * M.lungeL * Math.pow(fl, 1.5); x += Math.cos(M.lungeA) * L; y += Math.sin(M.lungeA) * L; }
      let z = RAD(s) * ZSQ * lerp(0.8, 0.6, Math.max(beachK, deadK)) - M.zDrop * 0.2 + M.rear * 1.35 * fl * fl + (M.end ? M.end.lift || 0 : 0) * 1.6 * Math.pow(Math.max(0, 1 - s / 3.4), 1.5);
      pts[k] = [x, y, z]; }
    // the bank into each turn (from the path's curvature), and the roll of a body lying beached
    for (let k = 0; k < n; k++) { const a = pts[Math.max(0, k - 3)], b = pts[k], c2 = pts[Math.min(n - 1, k + 3)], cr = (b[0] - a[0]) * (c2[1] - b[1]) - (b[1] - a[1]) * (c2[0] - b[0]); rolls[k] = Math.max(-0.35, Math.min(0.35, -cr * 2.2)) + M.roll * (0.6 + 0.4 * Math.sin(k * 0.12 + t * 0.7)); }
    // relative to the head's ground point
    const h = pts[0], ox = h[0], oy = h[1];
    for (let k = 0; k < n; k++) { pts[k] = [pts[k][0] - ox, pts[k][1] - oy, pts[k][2]]; }
    M.sp = { pts, rolls, ox, oy };
    m.x = ox; m.y = oy * GY;
  }
  // a spine point s in the world: { x, y (the floor point under it), z, gy (where it shows, on the floor plane) }
  function spW(m, M, s) { const P = M.sp; if (!P) return { x: m.x, y: m.y, z: 0, gy: m.y }; const f = Math.max(0, Math.min(NSP - 1.001, s / DS)), i = Math.floor(f), u = f - i, a = P.pts[i], b = P.pts[Math.min(NSP - 1, i + 1)], p = vlerp(a, b, u);
    const x = m.x + p[0], y = m.y + p[1] * GY; return { x, y, z: p[2], gy: y - p[2] * ZK }; }
  // the head's forward direction on the floor (world, unit), and a point d ahead of the neck along it
  function fwdW(m, M) { const P = M.sp; if (!P) return { x: 0, y: 1 }; const a = P.pts[0], b = P.pts[3], dx = a[0] - b[0], dy = (a[1] - b[1]) * GY, l = Math.hypot(dx, dy) || 1; return { x: dx / l, y: dy / l }; }
  function headW(m, M, d) { const f = fwdW(m, M), p = spW(m, M, 0); return { x: p.x + f.x * d, y: p.y + f.y * d, z: p.z, gy: p.gy + f.y * d }; }

  /* ---------- locomotion: the head steers toward its target like a swimmer (a limited turn), the path recorded ---------- */
  function swimTick(FX, m, M, dt) {
    const C = FX.C, tg = M.tgt; let want = M.spdTo;
    if (tg) { const dx = tg.x - M.hx, dy = tg.y - M.hy, d = Math.hypot(dx, dy); if (d < 0.35) { want = 0; M.arrived = true; } else { M.arrived = false; const a = Math.atan2(dy, dx), tr = (M.turn || 2.4) * dt; M.hd += Math.max(-tr, Math.min(tr, angTo(M.hd, a))); want = Math.min(M.spdTo, 0.6 + d * 1.2); } }
    else want = 0;
    M.spd = toward(M.spd, want, dt, 2.2);
    const nx = M.hx + Math.cos(M.hd) * M.spd * dt, ny = M.hy + Math.sin(M.hd) * M.spd * dt;
    if (inNave(C, nx, ny * GY, 1.0) || m.act === 'enter') { M.hx = nx; M.hy = ny; } else { M.hd += 2.0 * dt; }
    const P0 = M.path[0]; if (!P0 || Math.hypot(M.hx - P0.x, M.hy - P0.y) > 0.06) { M.path.unshift({ x: M.hx, y: M.hy }); let L = 0; for (let i = 1; i < M.path.length; i++) { L += Math.hypot(M.path[i].x - M.path[i - 1].x, M.path[i].y - M.path[i - 1].y); if (L > BODY_L + 3) { M.path.length = i + 1; break; } } }
    else { M.path[0] = { x: M.hx, y: M.hy }; }
    // the wave runs down the body faster the faster it swims; it never quite stops
    M.wph += dt * (1.6 + M.spd * 1.9);
  }
  const W2T = (C, x, y) => ({ x, y: y / GY });   // a world floor point -> the swim plane (true lengths)
  function goTo(M, C, wx, wy, spd) { M.tgt = W2T(C, wx, wy); M.spdTo = spd || 2.4; M.arrived = false; }

  /* ---------- (v398 B4) the effects' own state: short-lived pieces in world space (splashes, steam, sparks, blooms, rings),
     ticked with the fight and drawn by the GPU layer; purely visual (no gameplay reads them). Capped, thinner under lowFx ---------- */
  function fxAdd(M, o) { if (!M.fxp) M.fxp = []; const cap = lowFx() ? 36 : 140; if (M.fxp.length >= cap) M.fxp.shift(); o.t = 0; o.sd = o.sd != null ? o.sd : Math.random() * 50; M.fxp.push(o); return o; }
  function fxTick(M, dt) { const P = M.fxp; if (!P) return; for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; q.t += dt; if (q.vx) q.x += q.vx * dt; if (q.vy) q.y += q.vy * dt; if (q.vz) q.z = (q.z || 0) + q.vz * dt; if (q.t >= q.life) P.splice(i, 1); } }
  const splash = (M, x, y, k, o) => fxAdd(M, Object.assign({ k: 'splash', x, y, life: 0.75, s: k || 1 }, o || {}));
  const steamAt = (M, x, y, k) => { if (!lowFx()) fxAdd(M, { k: 'steam', x, y, z: 0.2, vz: 0.55 + Math.random() * 0.3, vx: (Math.random() - 0.5) * 0.3, life: 2.2 + Math.random() * 0.8, s: k || 1 }); };
  const bloomAt = (M, x, y, z, r, col, a, life) => fxAdd(M, { k: 'bloom', x, y, z: z || 0, r, col, a, life: life || 0.3 });
  const ringAt = (M, x, y, r, col, a, life) => fxAdd(M, { k: 'ring', x, y, r, col, a, life: life || 0.6 });
  // a hitstop: the world held for a few hundredths of a second on the heaviest blows (the dungeon's own g.hitStop)
  const hitstop = (FX, s) => { const g = FX.g; if (!g || !(s > 0)) return; g.hitStop = Math.max(g.hitStop || 0, lowFx() ? s * 0.5 : s); };
  const shakeK = (FX, a, d) => FX.H.shake(lowFx() ? a * 0.45 : a, d);

  /* ---------- the acts ---------- */
  function kNow(M) { if (M.beach) return TUNE.kBeach; if (M.ac && (M.ac.k === 'hunt' || M.ac.k === 'hunt2')) return TUNE.kRear; if (M.rest) return TUNE.kRest; return TUNE.kSwim; }
  /* one blow over the long body (a burst taking in several of its hit proxies at once) counts about once: in a frame, the
     hits that come through a proxy after the first are worth 0.3 (as Ifrit's) */
  function stackK(FX, o) { const M = FX.mem, t = FX.g.t; if (M.hitT !== t) { M.hitT = t; M.hitN = 0; } M.hitN++; return M.hitN > 1 && o && o.viaProxy ? 0.3 : 1; }
  function say(FX, M, key, s, sub, col, life) { const n = (+M.seen[key] || 0) + 1; M.seen[key] = n; if (n > 2) return; FX.H.banner(s, n === 1 ? sub : '', col, n === 1 ? (life || 2.6) : 1.1, n === 1); }
  function idle(FX, m, M, dt) { const C = FX.C, me = FX.me;
    M.idleT += dt;
    if (!M.rest) { if (!M.idleTgt) { // a new place to swim to: a lane, some way from where it is, away from a pet too close
        let best = null, bs = -1e9; for (let k = 0; k < 8; k++) { const li = Math.floor(Math.random() * 3), x = laneX(C, li) + FX.rnd(-1.2, 1.2), y = C.y + FX.rnd(-NY + 2.5, NY - 4), d = Math.hypot(x - m.x, y - m.y), dp = Math.hypot(x - me.x, y - me.y), sc = Math.min(d, 9) + Math.min(dp, 6) * 0.6 + Math.random(); if (d > 3.5 && sc > bs) { bs = sc; best = { x, y }; } }
        M.idleTgt = best || { x: laneX(C, 1), y: C.y }; goTo(M, C, M.idleTgt.x, M.idleTgt.y, 2.6); M.swimT = 0; }
      M.swimT = (M.swimT || 0) + dt;
      if (M.arrived || M.swimT > TM.swimT) { M.rest = true; M.restT = TM.rest[FX.S.phase > 1 ? 1 : 0]; M.tgt = null; } }
    else { M.restT -= dt; M.pitchTo = 0.2; if (M.restT <= 0) { M.rest = false; M.idleTgt = null; choose(FX, m, M); } } }
  function choose(FX, m, M) { const P = FX.S.phase, list = CYC[P] || CYC[1]; const k = list[M.cyc % list.length]; M.cyc++; startAct(FX, m, M, k); }
  function startAct(FX, m, M, k, o) { const C = FX.C, me = FX.me; o = o || {}; M.ac = { k, t: 0, step: 0 }; m.act = k; m.actT = 0; M.rest = false; M.idleT = 0;
    if (k === 'hunt') { M.stat.hunts++; const L = o.lane != null ? o.lane : laneOf(C, me.x), b = M.bulbI++ % 3; M.ac.lanes = [L]; M.ac.bulbs = [b]; arm(FX, M, L, b, TM.hunt);
      say(FX, M, 'hunt', 'LANTERN HUNT', `A lantern lights and marks the next charged lane with its ${SYM_NAME[M.bulbs[b].sym].toLowerCase()}: move to another lane`, AMBER_HI); sf(FX, 'hum'); }
    else if (k === 'hunt2') { M.stat.hunt2s++; const A = o.lane != null ? o.lane : laneOf(C, me.x), d = me.x - laneX(C, A), B = A === 1 ? (d < 0 ? 0 : 2) : 1, b1 = M.bulbI++ % 3, b2 = M.bulbI++ % 3;
      M.ac.lanes = [A, B]; M.ac.bulbs = [b1, b2]; arm(FX, M, A, b1, TM.hunt); say(FX, M, 'hunt2', 'TWIN THUNDER', 'Two lanes in turn: leave the first, then step back into its spent water', AMBER_HI); sf(FX, 'hum'); }
    else if (k === 'drain') { M.stat.drains++; const L = o.lane != null ? o.lane : laneOf(C, m.x); M.ac.L = L; M.ac.step = 0; const lx = laneX(C, L);
      M.ac.wps = m.y > C.y ? [{ x: lx, y: C.y + NY - 3.2 }, { x: lx, y: C.y - 2.6 }] : [{ x: lx, y: C.y - NY + 3.2 }, { x: lx, y: C.y + 2.8 }]; if (laneOf(C, m.x) === L && Math.abs(m.x - lx) < 1.5) M.ac.wps.shift(); M.ac.wi = 0; goTo(M, C, M.ac.wps[0].x, M.ac.wps[0].y, 2.9); M.ac.wheel = L === 0 ? 0 : L === 2 ? 1 : (me.x < C.x ? 0 : 1); } }
  function endAct(FX, m, M) { M.ac = null; m.act = 'swim'; m.actT = 0; M.rearTo = 0; M.jawTo = 0; M.pitchTo = 0.05; M.lungeTo = 0; M.rest = false; M.idleTgt = null; M.tgt = null; }
  function clearActs(FX, m, M) { for (const L of M.lanes) L.armed = null; M.tele.length = 0; for (const W2 of M.wheels) { W2.exposed = false; W2.ch = 0; } M.ac = null; m.act = 'swim'; M.rearTo = 0; M.jawTo = 0; M.lunge = 0; M.rest = false; M.idleTgt = null; }
  function actStep(FX, m, M, dt) { const A = M.ac; A.t += dt;
    if (A.k === 'hunt' || A.k === 'hunt2') huntStep(FX, m, M, A, dt);
    else if (A.k === 'drain') drainStep(FX, m, M, A, dt);
    else endAct(FX, m, M); }
  /* Lantern Hunt: it slows in its lane and rears, the bulb flares, its symbol thrown onto the charged lane */
  function arm(FX, M, L, b, T) { const lane = M.lanes[L]; lane.armed = { t: 0, T, bulb: b, sym: M.bulbs[b].sym }; M.bulbs[b].gTo = 2.2; M.bulbs[b].flare = 0.8;   /* (v398 B4: its flare) */ M.stat.armed++; const n = M.lanes.filter(q => q.armed).length; M.stat.maxArmed = Math.max(M.stat.maxArmed, n); sf(FX, 'chime', 660 + 110 * b, 0.4); }
  function huntStep(FX, m, M, A, dt) { const C = FX.C, me = FX.me;
    M.rearTo = 0.55; M.pitchTo = -0.28; M.spdTo = 0.7;
    if (!M.tgt || M.arrived) { const y = m.y + (Math.random() < 0.5 ? -3 : 3); goTo(M, C, laneX(C, laneOf(C, m.x)), Math.max(C.y - NY + 3, Math.min(C.y + NY - 4, y)), 0.7); }
    if (A.k === 'hunt2' && A.step === 0 && A.t >= TM.gap) { A.step = 1; arm(FX, M, A.lanes[1], A.bulbs[1], TM.hunt); M.stat.seqGap.push(+(A.t).toFixed(2)); }
    const last = A.k === 'hunt2' ? TM.gap + TM.hunt : TM.hunt; if (A.t > last + 0.9) endAct(FX, m, M); }
  /* the discharge: Thunderwater along a whole lane (one strike, its light lingering a moment) */
  function discharge(FX, M, L) { const C = FX.C, me = FX.me, lane = M.lanes[L], a = lane.armed; lane.armed = null; lane.fx = TM.disFx; lane.arcT = 0; M.stat.discharges++; M.stat.lanesHit[L]++;
    if (a) M.bulbs[a.bulb].gTo = 0.62;
    let hit = false; if (lane.wet > 0.3 && inLane(C, L, me.x, me.y, me.r) && !me.dead) { if (FX.hurt(TUNE.dmg * TUNE.thunder)) { hit = true; M.stat.disHit++; FX.H.text(me.x, me.y - 1.4, 'Thunderwater!', VOLT_HI, 15); } }
    // (v398 B4) the strike's weight: a held beat and a hard shake when it catches the pet, a lighter one when it misses; a
    // short bloom over the lane, spray thrown up its length and steam rising off it afterwards (the GPU layer draws them)
    lane.flash = 0.24; lane.steamT = 0.25; lane.steamN = lowFx() ? 0 : 7; lane.seed = Math.random() * 40;
    if (hit) { hitstop(FX, 0.07); shakeK(FX, 9, 0.3); FX.H.flash(0.1, VOLT); } else shakeK(FX, 4.5, 0.22);
    for (let i = 0, n = lowFx() ? 3 : 7; i < n; i++) splash(M, laneX(C, L) + FX.rnd(-LWW * 0.85, LWW * 0.85), C.y - NY + 1 + (NY * 2 - 2) * (i + Math.random()) / n, 0.8 + Math.random() * 0.5, { col: VOLT, life: 0.6 + Math.random() * 0.3 });
    sf(FX, 'crash'); sf(FX, 'hiss', 0.5, 0.25, 2400);
    if (!lowFx()) for (let i = 0; i < 16; i++) FX.H.part({ kind: 'spark', x: laneX(C, L) + FX.rnd(-LWW, LWW), y: C.y + FX.rnd(-NY + 0.5, NY - 0.5), vx: FX.rnd(-2, 2), vy: FX.rnd(-3.5, -1), g: 6, drag: 0.5, life: 0.5, max: 0.5, size: 2.5, color: Math.random() < 0.5 ? VOLT_HI : VOLT }); }
  /* Drain-and-Bite: it swims into its lane and lies along it; the lane is marked, a wheel exposed; it snaps at a pet near
     its head; drained in time it beaches, else the sluice seals and it bites down the lane */
  function drainStep(FX, m, M, A, dt) { const C = FX.C, me = FX.me;
    if (A.step === 0) { M.spdTo = 2.9; if (M.arrived) { A.wi++; if (A.wi < A.wps.length) goTo(M, C, A.wps[A.wi].x, A.wps[A.wi].y, 2.4); else { A.step = 1; A.t = 0; A.dl = TM.drainWait[FX.S.phase > 1 ? 1 : 0]; M.tgt = null; const W2 = M.wheels[A.wheel]; W2.exposed = true; W2.ch = 0; M.stat.exposed++;
        say(FX, M, 'drain', 'DRAIN-AND-BITE', 'It lies along a marked lane. Go to the glowing WHEEL and use it to drain the lane: it will be beached!', '#BFF8F2', 3.0); sf(FX, 'thud');
        if (FX.S.phase > 1) spawnLeeches(FX, M, W2); A.biteT = 1.2; } } return; }
    if (A.step === 1) { // waiting for the drain: the head rests, it snaps at a pet that comes near
      M.pitchTo = 0.18; A.dl -= dt;
      if (!A.bite) { A.biteT -= dt; const hd = headW(m, M, 0.9), d = Math.hypot(me.x - hd.x, me.y - hd.y); if (A.biteT <= 0 && d < TM.biteReach && !me.dead) startBite(FX, m, M, A, false); }
      else biteStep(FX, m, M, A, dt);
      if (A.dl <= 0 && !A.bite) { const W2 = M.wheels[A.wheel]; W2.exposed = false; W2.ch = 0; M.stat.deadline++; FX.H.text(W2.x, W2.y - 2, 'The sluice seals', '#CFE0F0', 14); sf(FX, 'thud'); A.step = 3; A.t = 0; startBite(FX, m, M, A, true); }
      return; }
    if (A.step === 2) { // beached: the stun holds it; the update watches the refill
      return; }
    if (A.step === 3) { if (A.bite) biteStep(FX, m, M, A, dt); else endAct(FX, m, M); return; }
    if (A.step === 4) { M.pitchTo = 0; if (A.t > TM.recover) endAct(FX, m, M); } }
  /* a bite: a line from its head toward the pet (tracking for a second, then locked) for 2.5 s; then the head lunges */
  function startBite(FX, m, M, A, big) { const me = FX.me, hd = headW(m, M, 0.9); A.bite = { t: 0, big, a: Math.atan2(me.y - hd.y, me.x - hd.x), len: big ? 9 : 5.5, w: big ? 2.6 : 1.9 }; M.stat.bites++; M.jawTo = 0.35; sf(FX, 'hiss', 0.6, 0.2, 500);
    if (big) { const f = fwdW(m, M); A.bite.a = Math.atan2(f.y, f.x); } say(FX, M, big ? 'bigbite' : 'bite', big ? 'THE BITE' : 'SNAP', big ? 'The sluice sealed: it bites down its whole lane. Get clear of the line!' : 'Its jaw drops: step off the line', WARN, 2.0); }
  function biteStep(FX, m, M, A, dt) { const B = A.bite, me = FX.me, hd = headW(m, M, 0.9); B.t += dt; B.x = hd.x; B.y = hd.y;
    if (B.t < TM.biteLock && !B.big) { const want = Math.atan2(me.y - hd.y, me.x - hd.x); B.a += Math.max(-dt * 1.5, Math.min(dt * 1.5, angTo(B.a, want))); }
    M.jawTo = B.t < TM.bite ? 0.35 + 0.5 * cl(B.t / TM.bite) : 1;
    if (B.t >= TM.bite && !B.hit) { B.hit = true; M.lungeA = Math.atan2(Math.sin(B.a) / GY, Math.cos(B.a)); M.lungeL = Math.min(B.len, 4.2); M.lungeTo = 1; sf(FX, 'crash'); shakeK(FX, 7, 0.25);
      const s = { shape: 'line', x: B.x, y: B.y, a: B.a, len: B.len, w: B.w }; if (FX.inShape(s, me.x, me.y, me.r) && !me.dead) { if (FX.hurt(TUNE.dmg * TUNE.bite * (B.big ? 1.2 : 1))) { M.stat.biteHit++; FX.H.text(me.x, me.y - 1.4, 'Bitten!', WARN, 15); hitstop(FX, 0.06); } }
      { const L2 = Math.min(B.len, 4.2); splash(M, B.x + Math.cos(B.a) * L2, B.y + Math.sin(B.a) * L2, 1.3); splash(M, B.x + Math.cos(B.a) * L2 * 0.5, B.y + Math.sin(B.a) * L2 * 0.5, 0.8); ringAt(M, B.x + Math.cos(B.a) * L2, B.y + Math.sin(B.a) * L2, 2.2, '#CFF6FF', 0.5, 0.7); }   // (v398 B4: the jaw's splash)
      // its lunge breaks what stands in the line
      for (const o of M.breaks || []) if (!o.dead && FX.inShape(s, o.x, o.y, o.r)) { o.dead = true; breakObj(FX, o); }
      for (let i = 0; i < 10 && !lowFx(); i++) FX.H.part({ kind: 'smoke', x: B.x + Math.cos(B.a) * 3 + FX.rnd(-1, 1), y: B.y + Math.sin(B.a) * 3, vx: FX.rnd(-1.5, 1.5), vy: FX.rnd(-2.5, -0.8), drag: 0.8, life: 0.8, max: 0.8, size: 0.55, color: 'rgba(200,240,250,' }); }
    if (B.t >= TM.bite + 0.45) { M.lungeTo = 0; M.jawTo = 0; A.bite = null; A.biteT = TM.biteEvery; if (A.step === 3) endAct(FX, m, M); } }
  /* the wheel used: the marked lane drains, the eel beaches for 8 s */
  function useWheel(FX, W2) { const M = FX.mem, m = FX.m, A = M.ac; if (!A || A.k !== 'drain' || A.step !== 1 || !W2.exposed) return false;
    if (W2.locked) { FX.H.text(W2.x, W2.y - 2, 'A leech holds the wheel!', LEECH, 13); sf(FX, 'wrong'); return false; }
    const lane = M.lanes[A.L]; lane.wetTo = 0; lane.dr = { from: lane.wet, t: 0, dur: 2.8 }; /* v430 BW: the lane's water goes down over 2.8 s (eased), not in a blink */ W2.spinV = 9; W2.exposed = false; W2.drainedBy = true; M.stat.drained++; A.bite = null; M.lunge = 0; M.lungeTo = 0;
    A.step = 2; M.beach = { t: 0, L: A.L, wheel: W2.i }; m.stunT = TM.beach + 0.6; M.stat.beached++; M.jawTo = 0.6;
    FX.H.banner('BEACHED!', 'The lane drains away: strike while it gasps on the stones', '#BFF8F2', 2.2, true); sf(FX, 'hiss', 1.2, 0.35, 400); sf(FX, 'thud'); shakeK(FX, 7, 0.4);
    lane.vortex = 0.001; hitstop(FX, 0.08); M.thrash = 1;   // (v398 B4: the sluice's whirlpool opens; the eel's first heave)
    return true; }
  /* leeches: two crawl out of the grooves toward the exposed wheel; one that reaches it relocks it */
  function spawnLeeches(FX, M, W2) { const C = FX.C;
    for (const sg of [-1, 1]) { const x = C.x + sg * 3.5, y = C.y + 3.8; let lm = null;
      if (typeof MON !== 'undefined' && MON.leech) { try { lm = FX.minion('leech', x, y, { belLeech: true, optional: false }); } catch (e) { lm = null; } }
      const ST = FX.H.ST ? FX.H.ST() : null, hp = ST && ST.atk > 0 ? Math.max(40, Math.round(ST.atk * TUNE.leechHits)) : 150;   // (a few blows from the pet that meets them, whatever floor the stage plays as)
      if (!lm) lm = FX.obj({ kind: 'belleech', x, y, r: 0.45, hp });
      else { lm.hp = lm.maxhp = hp; lm.dmg = TUNE.dmg * TUNE.leechDmg; }
      M.leeches.push({ m: lm, st: 'crawl', W: W2.i }); M.stat.leeches++; FX.H.sparks(x, y - 0.3, LEECH, 8, 3); }
    say(FX, M, 'leech', 'BELL LEECHES', 'Two leeches crawl to the wheel to relock it: defeat them', LEECH, 2.4); }
  function killLeeches(FX, M) { for (const L of M.leeches) if (L.m && !L.m.dead) { L.m.hp = 0; L.m.dead = true; } M.leeches.length = 0; }
  function leechTick(FX, M, dt) { for (let i = M.leeches.length - 1; i >= 0; i--) { const L = M.leeches[i], lm = L.m, W2 = M.wheels[L.W];
      if (!lm || lm.dead || lm.hp <= 0) { M.leeches.splice(i, 1); M.stat.leechKill++; continue; }
      if (L.st === 'crawl') { const dx = W2.x - lm.x, dy = (W2.y - 0.2) - lm.y, d = Math.hypot(dx, dy); lm.face = dx >= 0 ? 1 : -1;
        if (d < TM.wheelR + 0.15) { L.st = 'cling'; M.stat.leechLock++; FX.H.text(W2.x, W2.y - 2.2, 'A leech relocks the wheel!', LEECH, 14); sf(FX, 'wrong'); }
        else { const v = TM.leechSpd * dt; if (FX.H.moveEnt) FX.H.moveEnt(lm, dx / d * v, dy / d * v, 1); else { lm.x += dx / d * v; lm.y += dy / d * v; } } }
      else { lm.x = toward(lm.x, W2.x + (i % 2 ? 0.45 : -0.45), dt, 4); lm.y = toward(lm.y, W2.y - 0.1, dt, 4); } }
    for (const W2 of M.wheels) W2.locked = M.leeches.some(L => L.W === W2.i && L.st === 'cling'); }
  function drawLeechFallback(c, X, Y, T, t) { const r = T * 0.42; c.save(); c.translate(X, Y); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, 0, r, r * 0.35, 0, 0, TAU); c.fill(); const g = c.createRadialGradient(-r * 0.3, -r * 1.1, r * 0.1, 0, -r * 0.8, r * 1.1); g.addColorStop(0, '#B79AE8'); g.addColorStop(1, '#4A2F7A'); c.fillStyle = g; c.beginPath(); c.moveTo(0, -r * 2.0 - Math.sin(t * 4) * r * 0.1); c.quadraticCurveTo(r * 1.1, -r * 0.6, 0, 0); c.quadraticCurveTo(-r * 1.1, -r * 0.6, 0, -r * 2.0); c.fill(); c.strokeStyle = '#957943'; c.lineWidth = Math.max(1.5, r * 0.15); c.beginPath(); c.ellipse(0, -r * 0.7, r * 0.5, r * 0.18, 0, 0, TAU); c.stroke(); c.restore(); }

  /* ---------- the wheels: used by standing beside one (0.75 s, still), as every rift interaction ---------- */
  function wheelTick(FX, M, dt) { const me = FX.me;
    for (const W2 of M.wheels) { W2.spin += W2.spinV * dt; W2.spinV = toward(W2.spinV, 0, dt, 0.6);
      const d = Math.hypot(me.x - W2.x, me.y - W2.y), moving = Math.abs(me.vx || 0) + Math.abs(me.vy || 0) > 0.3, near = d < TM.wheelR + (me.r || 0.35) + 0.3;
      if (!W2.exposed || me.dead) { W2.ch = 0; continue; }
      if (W2.used) { if (!near) W2.used = false; W2.ch = 0; continue; }
      if (near && !moving) { W2.ch += dt; if (W2.ch >= TM.chan) { W2.ch = 0; W2.used = true; useWheel(FX, W2); } } else W2.ch = 0; } }

  /* ---------- the update: the swim, the pose, the lanes, the beach, the leeches, what can be struck ---------- */
  function update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.ok) return; M.bt += dt; const C = FX.C, me = FX.me, t = M.bt;
    // the entrance: it rises out of the north basin and swims down the middle lane
    if (m.act === 'enter') { M.tgt = W2T(C, C.x, C.y - 2.5); M.spdTo = 2.6; }
    if (!M.end && !(m.stunT > 0 && M.beach)) swimTick(FX, m, M, dt); else if (M.end || M.beach) { M.spd = toward(M.spd, 0, dt, 3); M.wph += dt * (M.end ? 0.4 : 1.1); }
    // the beach: the stun holds it on the stones; a leech's relock refills the lane early; then the water returns
    if (M.beach) { const B = M.beach; B.t += dt; M.stat.beachT += dt; M.dry = toward(M.dry, 1, dt, 0.5);
      if (M.wheels[B.wheel].locked && !B.refill) { B.refill = true; m.stunT = Math.min(m.stunT, TM.refillGrace); M.stat.refill++; FX.H.text(m.x, m.y - 2, 'The lane refills!', LEECH, 14); }
      if (!(m.stunT > 0)) { M.lanes[B.L].wetTo = 1; M.lanes[B.L].inflow = 1.3; M.beach = null; if (M.ac && M.ac.k === 'drain') { M.ac.step = 4; M.ac.t = 0; } FX.H.text(m.x, m.y - 2, 'The water returns', '#BFF8F2', 13); sf(FX, 'hiss', 0.9, 0.25, 500); } }
    else M.dry = toward(M.dry, 0, dt, 0.8);
    // (v398 B4) beached it heaves: a thrash every half second or so throws spray off its flanks and slaps the tail (visual:
    // the roll and the tail's swing only, its body, and so what can be struck, stays where it lies)
    if (M.beach && !M.end) { M.thrashT = (M.thrashT || 0) - dt; if (M.thrashT <= 0) { M.thrashT = 0.42 + Math.random() * 0.4; M.thrash = 1; M.thrashS = Math.random() < 0.5 ? -1 : 1;
        const s = Math.random() < 0.4 ? BODY_L - 0.2 : Math.random() * BODY_L, p = spW(m, M, s); splash(M, p.x + FX.rnd(-0.5, 0.5), p.y + FX.rnd(-0.3, 0.3), 0.7 + Math.random() * 0.6, { col: '#CFF6FF', dry: true }); if (Math.random() < 0.5) sf(FX, 'thud'); } }
    M.thrash = Math.max(0, (M.thrash || 0) - dt * 2.6);
    for (const L of M.lanes) { if (L.flash > 0) L.flash = Math.max(0, L.flash - dt); if (L.vortex > 0) { L.vortex += dt; if (L.wetTo > 0.5 && L.wet > 0.6) L.vortex = 0; } if (L.inflow > 0) L.inflow = Math.max(0, L.inflow - dt);
      if (L.steamN > 0) { L.steamT -= dt; if (L.steamT <= 0) { L.steamT = 0.08 + Math.random() * 0.12; L.steamN--; steamAt(M, laneX(C, L.i) + FX.rnd(-LWW * 0.8, LWW * 0.8), C.y + FX.rnd(-NY + 1, NY - 1), 1 + Math.random() * 0.6); } } }
    for (const b of M.bulbs) if (b.flare > 0) b.flare = Math.max(0, b.flare - dt);
    if (M.p2) { M.p2.t += dt; const P2 = M.p2, tt = P2.t; for (let i = 0; i < 3; i++) if (!P2['b' + i] && tt >= 0.25 + i * 0.32) { P2['b' + i] = 1; M.bulbs[i].flare = 0.9; M.bulbs[i].g = Math.max(M.bulbs[i].g, 2.3); sf(FX, 'chime', 660 + 110 * i, 0.35); }
      if (!P2.bang && tt >= 1.25) { P2.bang = 1; shakeK(FX, 10, 0.45); hitstop(FX, 0.08); FX.H.flash(0.14, VOLT); sf(FX, 'crash'); }
      if (tt > 2.6) M.p2 = null; }
    fxTick(M, dt);
    // the lanes: telegraphs counting down, discharges, the water's level
    let armedN = 0; for (const L of M.lanes) { if (L.dr && L.wetTo < 0.5) { L.dr.t += dt; const u = Math.min(1, L.dr.t / L.dr.dur); L.wet = L.dr.from * (1 - (typeof BEL_DRAIN !== 'undefined' ? BEL_DRAIN.ease(u) : ease(u))); if (u >= 1) L.dr = null; } else { L.dr = null; L.wet = toward(L.wet, L.wetTo, dt, L.wetTo < L.wet ? 1.6 : 1.0); }   // v430 BW: a drain runs its eased course (the thunder in a lane reads this level); a refill as before if (L.fx > 0) L.fx = Math.max(0, L.fx - dt);
      if (L.armed && !M.end) { armedN++; L.armed.t += dt; if (L.armed.t >= L.armed.T) discharge(FX, M, L.i); } }
    if (armedN >= 3) M.stat.noSafe++;
    // the wheels and the leeches
    wheelTick(FX, M, dt); leechTick(FX, M, dt);
    // the pose eases toward what the acts ask
    const beached = !!M.beach, endK = M.end ? 1 : 0;
    M.rear = toward(M.rear, beached ? 0 : M.rearTo || 0, dt, 2.2); M.pitch = toward(M.pitch, beached ? 0.32 : M.end ? M.pitch : (M.rest && !M.ac ? 0.2 : M.pitchTo || 0.05), dt, 3); M.jaw = toward(M.jaw, beached ? 0.35 + 0.35 * Math.max(0, Math.sin(t * 2.6)) : M.jawTo || 0, dt, 6);
    M.lunge = toward(M.lunge, M.lungeTo || 0, dt, (M.lungeTo || 0) > M.lunge ? 14 : 3); M.roll = toward(M.roll, beached ? 0.55 + 0.32 * (M.thrash || 0) * (M.thrashS || 1) : endK * 0.7, dt, beached ? 6 : 1.5); M.amp = toward(M.amp, beached ? 0.12 : M.end ? 0.05 : M.rest ? 0.2 : 0.32, dt, 1.5);
    M.chg = toward(M.chg, M.lanes.some(L => L.armed) ? 0.5 : M.lanes.some(L => L.fx > 0.3) ? 1 : 0, dt, 4); M.fin += dt * (2 + M.spd * 2.5);
    for (const b of M.bulbs) { if (!M.ac && !M.lanes.some(L => L.armed)) b.gTo = beached ? 0.18 : 0.62 + 0.08 * Math.sin(t * 1.3 + b.sym); b.g = toward(b.g, M.end ? b.g : b.gTo, dt, b.gTo > b.g ? 6 : 2.5); }
    if (!M.end) { const want = Math.atan2(me.y - m.y, me.x - m.x) - M.hd; M.yaw = toward(M.yaw, beached ? Math.sin(t * 1.4) * 0.25 : Math.max(-0.5, Math.min(0.5, angTo(0, want))) * 0.5, dt, 2); }
    if (M.end) endTick(FX, m, M, dt);
    spine(FX, m, M, dt);
    // the damage window's share, for the tests
    if (m.hp < M.hpPrev) { const key = M.beach ? 'beach' : M.ac && (M.ac.k === 'hunt' || M.ac.k === 'hunt2') ? 'rear' : M.rest ? 'rest' : 'swim'; M.stat.dmg[key] = Math.round(M.stat.dmg[key] + (M.hpPrev - m.hp)); } M.hpPrev = m.hp;
    // what can be struck: the head, the three lantern segments and the tail (where they show on the floor)
    if (!M.end && m.act !== 'enter' && !m.dead) { const list = [], hd = headW(m, M, 0.75); list.push({ key: 'head', dx: hd.x - m.x, dy: hd.gy - m.y, r: 1.0 });
      for (let i = 0; i < 3; i++) { const p = spW(m, M, BULB_S[i]); list.push({ key: 'b' + i, dx: p.x - m.x, dy: p.gy - m.y, r: 0.95 }); }
      const tl = spW(m, M, BODY_L - 0.3); list.push({ key: 'tail', dx: tl.x - m.x, dy: tl.gy - m.y, r: 0.8 }); FX.parts(list); }
    // drips and ripples off its back, more when it thrashes
    if (!lowFx() && !M.end && Math.random() < dt * (beached ? 6 : 2 + M.spd)) { const p = spW(m, M, Math.random() * BODY_L); FX.H.part({ kind: 'spark', x: p.x + FX.rnd(-0.4, 0.4), y: p.gy, vx: FX.rnd(-0.6, 0.6), vy: FX.rnd(-1.8, -0.6), g: 6, drag: 0.4, life: 0.5, max: 0.5, size: 1.6, color: beached ? '#E8FBFF' : '#9FE8FF' }); } }
  /* its fall: it rears, the lanterns flare and burst one by one (glass), then it crashes down across the nave */
  function endTick(FX, m, M, dt) { const E = M.end, C = FX.C; E.t += dt;
    E.lift = E.t < 2.15 ? ease(E.t / 0.9) : lerp(1, -0.15, ease((E.t - 2.15) / 0.6));
    M.pitch = E.t < 2.15 ? toward(M.pitch, -0.5, dt, 3) : toward(M.pitch, 0.35, dt, 6); M.jawTo = E.t < 2.15 ? 1 : 0.2; M.chg = E.t < 2.2 ? 1.3 : toward(M.chg, 0, dt, 2);
    for (let i = 0; i < 3; i++) { const b = M.bulbs[i]; if (!b.burst) b.g = toward(b.g, 2.5, dt, 3); const at = 1.0 + i * 0.4; if (!b.burst && E.t >= at) { b.burst = true; E.burst++;
        const a = MODEL.anchor('bulbs', i) || { x: m.x, y: m.y, z: 1.2 }; burstBulb(FX, a); bloomAt(M, a.x, a.y, a.z, 3.2, AMBER, 0.9, 0.45); ringAt(M, a.x, a.y, 3.4, AMBER, 0.6, 0.7); hitstop(FX, 0.05); } }
    if (E.t >= 2.7 && !E.crash) { E.crash = true; sf(FX, 'crash'); sf(FX, 'thud'); FX.H.shake(lowFx() ? 6 : 16, 0.6); hitstop(FX, 0.1); const hd = spW(m, M, 0.5);
      for (let s = 0; s <= BODY_L; s += lowFx() ? 2 : 0.9) { const p = spW(m, M, s); splash(M, p.x, p.y, 1.1 + Math.random() * 0.5, { col: '#CFF6FF', life: 0.9 }); } ringAt(M, hd.x, hd.y, 7, '#CFF6FF', 0.55, 1.4); E.steamT = 0.4;   // (v398 B4: the crash's sheet of spray, the nave's ring)
      FX.H.ring(hd.x, hd.y, 0.4, 5, 0.8, '#CFF6FF', 0.45); for (let i = 0; i < (lowFx() ? 8 : 26); i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 5; FX.H.part({ kind: 'smoke', x: hd.x + Math.cos(a) * 0.8, y: hd.y + Math.sin(a) * 0.5, vx: Math.cos(a) * v * 0.6, vy: -2 - Math.random() * 3, drag: 0.9, life: 1.1, max: 1.1, size: 0.6 + Math.random() * 0.5, color: 'rgba(220,245,250,' }); } }
    if (E.crash && E.t < 6 && !lowFx()) { E.steamT -= dt; if (E.steamT <= 0) { E.steamT = 0.18 + Math.random() * 0.2; const p = spW(m, M, Math.random() * BODY_L); steamAt(M, p.x + FX.rnd(-0.4, 0.4), p.y, 0.9 + Math.random() * 0.5); } }   // (v398 B4: steam off the spent body)
    M.dead = sstep(2.6, 4.6, E.t); for (const L of M.lanes) L.wetTo = 1; }
  function burstBulb(FX, a) { const x = a.x, y = a.y; sf(FX, 'crash'); FX.H.flash(0.18, AMBER); shakeK(FX, 8, 0.25);
    if (typeof BREAK_FX !== 'undefined') try { BREAK_FX.burst(null, x, y, { paint: (c, P) => { c.save(); c.translate(0, -a.z * ZK * P + P * 0.5); paintBulb(c, P); c.restore(); }, key: 'nhalu-bulb-' + Math.round(a.z * 4), w: 1.0, h: 1.0 + a.z * ZK, mat: 'glass', hot: AMBER, size: 1.6, from: { x, y: y + 1.5 } }); } catch (e) { /* (the shared break effect) */ }
    FX.H.sparks(x, y - a.z * ZK, AMBER_HI, lowFx() ? 8 : 22, 7); FX.H.ring(x, y - a.z * ZK, 0.2, 2.2, 0.4, AMBER, 0.5); }

  /* ---------- the camera: the pet, the eel's head and body, the wheel in play ---------- */
  function camFocus(FX, m) { const M = FX.mem, me = FX.me, H = FX.H; if (!M || !M.ok) return null; if (typeof window !== 'undefined' && window.__NHALU_CAM) return window.__NHALU_CAM;   // (tests: a held view)
    if (m.act === 'enter') return { x: m.x, y: m.y - 0.5, k: 0.8, zoom: 0.46 };
    if (M.end) { const e = M.end.t; return e < 6 ? { x: m.x, y: m.y + (e < 2.4 ? 0.2 : 1), k: 0.85, zoom: e < 2.4 ? 0.48 + 0.08 * ease(e / 1.2) : 0.5 } : null; }   // (v398 B4: closer while it rears and its lanterns burst)
    if (M.p2 && M.p2.t < 2.0) { const mid = spW(m, M, 1.8); return { x: mid.x, y: mid.gy - 0.4, k: 0.85, zoom: 0.55 }; }   // (v398 B4: the 50% moment, framed on it)
    const hd = spW(m, M, 0), mid = spW(m, M, BODY_L * 0.5), pts = [[me.x, me.y], [hd.x, hd.gy - 0.8], [mid.x, mid.gy]];
    for (const W2 of M.wheels) if (W2.exposed) pts.push([W2.x, W2.y - 1.4]);
    if (M.lanes.some(L => L.armed)) pts.push([me.x + (me.x < FX.C.x ? 4 : -4), me.y]);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const W = H.W ? H.W() : 390, Hh = H.H ? H.H() : 844, TS = FX.Tz() / Math.max(0.05, FX.g.zoom || 0.6);
    const ck = (FX.g && FX.g.camK) || 1, zoom = Math.max(0.36 / ck, Math.min(0.62, (W - 40) / (TS * (x1 - x0 + 3) * ck), (Hh - 300) / (TS * (y1 - y0 + 3) * ck)));   // (v404 BF: as Kharrox's: the engine's g.camK (1.2) divided out of the fit, so the lanes in play stay on screen)
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 + 30 / (TS * zoom), k: 1, zoom }; }

  /* ---------- drawing ---------- */
  function poseOf(M) { const P = M.sp; return { pts: P.pts, rolls: P.rolls, yaw: M.yaw, pitch: M.pitch, jaw: M.jaw, bulb: M.bulbs.map(b => b.g), sym: M.bulbs.map(b => b.sym), burst: M.bulbs.map(b => b.burst), chg: M.chg, dry: M.dry, dead: M.dead, fin: M.fin,
      tailYaw: Math.sin(M.wph - BODY_L * 1.45) * 0.35 * (M.end ? 0.2 : 1) + (M.beach ? 0.55 * (M.thrash || 0) * (M.thrashS || 1) : 0), clip: M.beach || M.end && M.end.t > 2.3 ? null : WATER_Z, alpha: 1 }; }
  function drawEel(c, FX, m, T, t) { const M = FX.mem; if (!M || !M.ok || !M.sp) return; const R = MODEL.draw(c, m.x, m.y, poseOf(M), { T, sx: FX.sx, sy: FX.sy, t });
    M.bulbScr = R && R.A.bulbs ? R.A.bulbs.map(p => { const V = LAST.V; return V.toS(p); }) : null;
    if (!R || !R.drawn) drawOld2D(c, FX, m, M, T, t); }
  /* where the GPU cannot draw it: the existing 2D Nhalu (the old Belfry boss, DunBoss.P.nhalu), placed along the same
     body (its head where the head is, facing the way it swims), its lit bulb the one the hunt lit, its jaw open to bite */
  let OLD_B = null;
  function drawOld2D(c, FX, m, M, T, t) { if (typeof DunBoss === 'undefined' || !DunBoss.P || !DunBoss.P.nhalu) return;
    if (!OLD_B) OLD_B = (typeof BOSSES !== 'undefined' && BOSSES.find(q => q.id === 'nhalu')) || { id: 'nhalu', name: 'Nhalu', color: '#3B2F7A', glow: '#FFC857', r: 1.25 };
    const f = fwdW(m, M), dir = f.x >= 0 ? 1 : -1, hd = headW(m, M, 0.4), r = T * 2.1, lit = M.bulbs.findIndex(b => b.g > 1.2 && !b.burst), bite = !!(M.ac && M.ac.bite) || (M.beach && Math.sin(t * 2.6) > 0) || (M.end && M.end.t < 2.2);
    const P = Object.create(m); Object.assign(P, { bk: OLD_B, face: dir, bulb: lit, act: bite ? 'bite' : 'move', dead: false });
    const X = FX.sx(hd.x) - dir * r * 0.75, Y = FX.sy(hd.gy) - r * 0.1;
    c.save(); if (M.end) c.globalAlpha = 1 - 0.5 * cl(M.dead);
    try { DunBoss.draw(c, P, X, Y, r, t, FX.me, FX.sx, FX.sy, T, false); M.stat.old2d = (M.stat.old2d || 0) + 1; } catch (e) { /* (no picture this frame) */ }
    c.restore(); }
  /* the live layer over the painted floor: the lanes' water, the eel's shadow, the telegraphs (boundary, symbol, countdown) */
  let CAUS = null;
  function causticTile() { if (CAUS) return CAUS; const N = 96, cv = document.createElement('canvas'); cv.width = cv.height = N; const g = cv.getContext('2d'), im = g.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const u = x / N * TAU, v = y / N * TAU; let k = Math.sin(u * 2 + Math.sin(v * 3) * 1.2) + Math.sin(v * 2 + Math.sin(u * 3 + 1) * 1.3) + Math.sin((u + v) * 1 + Math.sin(u - v) * 0.8); k = Math.pow(Math.max(0, 1 - Math.abs(k) * 0.7), 3); const i = (y * N + x) * 4; im.data[i] = 150; im.data[i + 1] = 235; im.data[i + 2] = 240; im.data[i + 3] = Math.round(255 * k); }
    g.putImageData(im, 0, 0); CAUS = cv; return cv; }
  function overlay(c, FX, t, T) { const M = FX.mem, m = FX.m, C = FX.C; if (!M || !M.ok) return; const sx = FX.sx, sy = FX.sy, yN = sy(C.y - NY), yS = sy(C.y + NY);
    // the water in each lane: a translucent sheet over the sunk flags, slow caustic light drifting through it
    let pat = null; try { pat = c.createPattern(causticTile(), 'repeat'); } catch (e) { pat = null; }
    for (const L of M.lanes) { const x0 = sx(laneX(C, L.i) - LWW), x1 = sx(laneX(C, L.i) + LWW), wet = L.wet;
      if (wet < 0.98) { c.fillStyle = `rgba(40,54,58,${0.25 * (1 - wet)})`; c.fillRect(x0, yN, x1 - x0, yS - yN); }
      if (wet > 0.02) { const top = lerp(yS, yN, Math.min(1, wet * 1.05)); const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, `rgba(18,60,82,${0.55 * wet})`); g.addColorStop(0.5, `rgba(26,84,104,${0.42 * wet})`); g.addColorStop(1, `rgba(18,60,82,${0.55 * wet})`); c.fillStyle = g; c.fillRect(x0, top, x1 - x0, yS - top);
        if (pat && !lowFx() && pat.setTransform && typeof DOMMatrix !== 'undefined') { const k = T * 3.2 / 96; pat.setTransform(new DOMMatrix([k, 0, 0, k * GY, sx(C.x) + Math.sin(t * 0.13 + L.i) * T * 1.5 + t * T * 0.12, sy(C.y) + t * T * 0.3 + L.i * T])); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16 * wet; c.fillStyle = pat; c.fillRect(x0, top, x1 - x0, yS - top); c.restore(); }
        if (!fg()) { c.strokeStyle = `rgba(220,250,255,${0.35 * wet})`; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(x0, top); c.lineTo(x0, yS); c.moveTo(x1, top); c.lineTo(x1, yS); c.stroke(); } } }   // (v404 BF: on the GPU the water's edges are feathered light, tellsGPU)
    // its shadow under the water: soft and dark along the body
    if (M.sp && !(M.end && M.end.t > 5)) { c.save(); c.fillStyle = 'rgba(4,14,20,.3)'; for (let s = -0.6; s < BODY_L + 0.8; s += 0.55) { const p = spW(m, M, Math.max(0, s)), r = (s < 0 ? 0.5 : RAD(Math.min(s, BODY_L))) * T * 1.1; c.beginPath(); c.ellipse(sx(p.x) + T * 0.12, sy(p.y) + T * 0.06, r, r * 0.5, 0, 0, TAU); c.fill(); } c.restore(); }
    { const F = fg(); if (F) { tellsGPU(c, FX, M, T, t, F, m.dead && M.end); return; } }   // v404 BF: glow-only telegraphs on the GPU; the 2D below where the painter is not
    if (m.dead && M.end) return;
    // the lanes' warnings
    for (const L of M.lanes) if (L.armed) drawLaneWarn(c, FX, M, L, T, t);
    // the marked lane of a drain, and its countdown
    const A = M.ac; if (A && A.k === 'drain' && (A.step === 1 || A.step === 2)) drawDrainMark(c, FX, M, A, T, t);
    if (A && A.bite) drawBiteWarn(c, FX, A.bite, T, t); }
  /* v404 BF (the user: the lane edges, the countdown digits and the drain chevrons were still crisp 2D lines): the telegraphs on
     the GPU painter, glow-only and feathered. The lanes' water edges are soft light. Lantern Hunt's lane: its two edges a wide
     faint amber light over a thin bright core (feathered at the ends), quickening as the strike nears, and an amber tide of
     light rising up the lane over its wait, so the time reads without a number (the symbol is drawFx's symbol of light). The
     drain's lane: teal edges and chevrons of light running down to the sluice; the window to turn the wheel a row of small
     lights going out one by one. The bite: a soft red lane filling from the head, its sides and two chevrons of light closing
     on its end. No countdown digits; the words (MOVE LANE, DRAIN) stay. Without the painter, the 2D picture as before. */
  function tellsGPU(c, FX, M, T, t, F, ended) { const C = FX.C, me = FX.me, A = M.ac, sx = FX.sx, sy = FX.sy, yN = sy(C.y - NY), yS = sy(C.y + NY), words = [];
    const Q = F.begin(c, null);
    // a V of light (tip at x, y, arms back toward dir a, half-width s): the arms overlap past the tip, a glow over it (no bead)
    const vee = (x, y, a, s, col, al, w) => { const ca = Math.cos(a), sa = Math.sin(a); for (const sg of [-1, 1]) { const bx = x - ca * s + -sa * sg * s * 0.9, by = y - sa * s + ca * sg * s * 0.9, ex = (x - bx) * 0.12, ey = (y - by) * 0.12; Q.beam(bx, by, x + ex, y + ey, w * 2.6, col, al * 0.3); Q.beam(bx, by, x + ex, y + ey, w, col, al); } Q.glow(x, y, w * 2.2, col, al * 0.45); };
    try {
      // the water's edges in each lane: feathered light from its surface down to the sluice
      for (const L of M.lanes) { if (L.wet <= 0.02) continue; const x0 = sx(laneX(C, L.i) - LWW), x1 = sx(laneX(C, L.i) + LWW), top = lerp(yS, yN, Math.min(1, L.wet * 1.05));
        for (const x of [x0, x1]) { Q.beam(x, top, x, yS + T * 0.3, T * 0.42, '#BFEFFF', 0.1 * L.wet); Q.beam(x, top, x, yS + T * 0.2, T * 0.12, '#E6FBFF', 0.28 * L.wet); } }
      if (ended) return;
      // Lantern Hunt
      for (const L of M.lanes) { if (!L.armed) continue; const a = L.armed, u = cl(a.t / a.T), [x0, y0, x1, y1] = laneBox(FX, C, L.i), pul = 0.6 + 0.4 * Math.sin(t * (8 + 14 * u)), xc = (x0 + x1) / 2, hw = (x1 - x0) / 2, H = y1 - y0;
        for (const sd of [-1, 1]) { const x = xc + sd * (hw - T * 0.45); Q.beam(x, y0 - T * 0.8, x, y1 + T * 0.8, T * 1.5, AMBER, (0.3 + 0.3 * u) * pul); Q.beam(x, y0 - T * 0.6, x, y1 + T * 0.6, T * 0.32, AMBER_HI, (0.6 + 0.4 * u) * pul); }   // (on the water, just inside the kerbs: light on the pale kerb would not read)
        for (const y of [y0 + T * 0.4, y1 - T * 0.4]) Q.beam(x0 + T * 0.2, y, x1 - T * 0.2, y, T * 0.9, AMBER, (0.2 + 0.2 * u) * pul);
        const top = y1 - H * u, nb = 6; if (u > 0.03) { for (let k = 0; k < nb; k++) { const yy = lerp(y1, top, (k + 0.5) / nb), sq = (H * u / nb) * 0.8 / hw; Q.glow(xc, yy, hw * 1.0, AMBER, (0.14 + 0.16 * u) * (0.6 + 0.4 * (k + 1) / nb), sq); }
          Q.beam(x0 + T * 0.2, top, x1 - T * 0.2, top, T * 0.8, AMBER_HI, (0.45 + 0.4 * u) * pul); Q.glow(xc, top, hw * 0.9, AMBER, 0.2 + 0.2 * u, 0.35); }   // (the tide's leading edge)
        if (inLane(C, L.i, me.x, me.y, me.r)) words.push(['MOVE LANE', sx(me.x), sy(me.y) - T * 2.1, T * 0.42, AMBER_HI]); }
      // the drain: its lane's edges teal, chevrons of light running down toward the sluice, the window to turn the wheel
      if (A && A.k === 'drain' && (A.step === 1 || A.step === 2)) { const [x0, y0, x1, y1] = laneBox(FX, C, A.L), xa = sx(laneX(C, A.L) - LWW), xb = sx(laneX(C, A.L) + LWW), cx = (x0 + x1) / 2;
        for (const x of [xa, xb]) { Q.beam(x, y0 - T * 0.5, x, y1 + T * 0.5, T * 0.8, TEAL, 0.2); Q.beam(x, y0 - T * 0.3, x, y1 + T * 0.3, T * 0.2, '#BFF8F2', 0.5); }
        for (let k = 0; k < 6; k++) { const f = (k / 6 + t * 0.25) % 1, y = y0 + f * (y1 - y0); vee(cx, y, Math.PI / 2, T * 0.8, '#BFF8F2', 0.75 * Math.sin(Math.PI * f), T * 0.16); }
        if (A.step === 1) { const W2 = M.wheels[A.wheel], left = Math.max(0, A.dl), tot = TM.drainWait[FX.S.phase > 1 ? 1 : 0], n = Math.ceil(tot), px = sx(W2.x), py = sy(W2.y) - T * 2.75, gap = T * 0.42, col = left < 3 ? WARN : TEAL;
          for (let i = 0; i < n; i++) { const on = cl(left - i), x = px + (i - (n - 1) / 2) * gap; Q.glow(x, py, T * 0.24, col, 0.1 + 0.5 * on); if (on > 0) Q.glow(x, py, T * 0.1, '#FFFFFF', 0.55 * on); }
          words.push(['DRAIN', px, sy(W2.y) - T * 3.3, T * 0.42, left < 3 ? WARN : '#DFFBF8']); } }
      // the bite
      if (A && A.bite && !A.bite.hit) { const B = A.bite, X = sx(B.x), Y = sy(B.y), u = cl(B.t / TM.bite), L = B.len * T, w = B.w * T, ca = Math.cos(B.a), sa = Math.sin(B.a), nx = -sa, ny = ca, P = (d, o) => [X + ca * d + nx * o, Y + sa * d + ny * o], pul = 0.75 + 0.25 * Math.sin(t * 16);
        { const [ax, ay] = P(0, 0), [bx, by] = P(L * Math.max(0.05, u), 0); Q.beam(ax, ay, bx, by, w * 0.85, WARN, 0.1 + 0.16 * u); }
        { const [ax, ay] = P(0, 0), [bx, by] = P(L, 0); Q.beam(ax, ay, bx, by, w * 1.1, WARN, 0.06 + 0.05 * u); }
        for (const sg of [-1, 1]) { const [ax, ay] = P(-T * 0.2, sg * w / 2), [bx, by] = P(L + T * 0.2, sg * w / 2); Q.beam(ax, ay, bx, by, T * 0.7, WARN, (0.14 + 0.12 * u) * pul); Q.beam(ax, ay, bx, by, T * 0.18, '#FFB0A8', (0.4 + 0.35 * u) * pul); }
        for (const k of [0.55, 0.8]) { const [x, y] = P(L * k, 0); vee(x, y, B.a, w * 0.32, '#FFD0C8', 0.75 * pul, T * 0.15); } }
    } finally { F.flush(c); }
    for (const [s2, x, y, z, col] of words) label(c, s2, x, y, z, col); }
  function laneBox(FX, C, i) { return [FX.sx(laneX(C, i) - HW), FX.sy(C.y - NY), FX.sx(laneX(C, i) + HW), FX.sy(C.y + NY)]; }
  function drawLaneWarn(c, FX, M, L, T, t) { const C = FX.C, a = L.armed, u = cl(a.t / a.T), [x0, y0, x1, y1] = laneBox(FX, C, L.i), me = FX.me, left = Math.max(0, a.T - a.t);
    c.save();
    c.fillStyle = `rgba(10,20,40,${0.12 + 0.1 * u})`; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    c.globalCompositeOperation = 'lighter'; c.fillStyle = hexA(AMBER, 0.05 + 0.12 * u); c.fillRect(x0, y1 - (y1 - y0) * u, x1 - x0, (y1 - y0) * u);
    c.globalCompositeOperation = 'source-over';
    // the boundary: dark under bright (it reads on the pale floor), pulsing faster as the count runs out
    const pul = 0.6 + 0.4 * Math.sin(t * (8 + 14 * u)); c.lineJoin = 'round';
    c.strokeStyle = 'rgba(6,10,24,.75)'; c.lineWidth = Math.max(3, T * 0.16); c.strokeRect(x0, y0, x1 - x0, y1 - y0);
    c.strokeStyle = hexA(AMBER_HI, 0.6 + 0.4 * pul); c.lineWidth = Math.max(2, T * 0.08); c.setLineDash([T * 0.6, T * 0.3]); c.lineDashOffset = -t * T * 2; c.strokeRect(x0, y0, x1 - x0, y1 - y0); c.setLineDash([]);
    // the symbol, thrown onto the lane where the pet can see it (level with it, and up the lane), the count inside it
    const cx = (x0 + x1) / 2, ys = [Math.max(y0 + T * 2, Math.min(y1 - T * 2, FX.sy(me.y))), lerp(y0, y1, 0.22), lerp(y0, y1, 0.78)];
    for (let k = 0; k < ys.length; k++) { const y = ys[k], s = T * (k === 0 ? 1.35 : 1.0) * (1 + 0.08 * Math.sin(t * 6)); if (k > 0 && Math.abs(y - ys[0]) < T * 3) continue;
      glowAt(c, cx, y, s * 2.2, AMBER, 0.25 + 0.3 * u);
      c.save(); symbolPath(c, a.sym, cx, y, s); c.fillStyle = 'rgba(6,10,24,.45)'; c.fill(); c.strokeStyle = 'rgba(6,10,24,.8)'; c.lineWidth = Math.max(4, T * 0.22); c.stroke(); c.strokeStyle = AMBER_HI; c.lineWidth = Math.max(2, T * 0.11); c.stroke(); c.restore();
      if (k === 0) label(c, String(Math.max(1, Math.ceil(left))), cx, y + (a.sym === 2 ? s * 0.18 : 0), s * 0.95, '#FFFFFF', 'rgba(60,30,0,.9)'); }
    if (inLane(C, L.i, me.x, me.y, me.r)) label(c, 'MOVE LANE', FX.sx(me.x), FX.sy(me.y) - T * 2.1, T * 0.42, AMBER_HI);
    c.restore(); }
  function drawDrainMark(c, FX, M, A, T, t) { const C = FX.C, [x0, y0, x1, y1] = laneBox(FX, C, A.L), xa = FX.sx(laneX(C, A.L) - LWW), xb = FX.sx(laneX(C, A.L) + LWW);
    c.save(); c.lineJoin = 'round'; c.strokeStyle = 'rgba(6,10,24,.7)'; c.lineWidth = Math.max(3, T * 0.14); c.strokeRect(xa, y0, xb - xa, y1 - y0); c.strokeStyle = hexA(TEAL, 0.85); c.lineWidth = Math.max(2, T * 0.07); c.setLineDash([T * 0.25, T * 0.25]); c.strokeRect(xa, y0, xb - xa, y1 - y0); c.setLineDash([]);
    // chevrons running down the lane toward the sluice (shape, not colour alone)
    const cx = (x0 + x1) / 2; for (let k = 0; k < 6; k++) { const y = y0 + ((k / 6 + t * 0.25) % 1) * (y1 - y0), w = T * 0.8; c.strokeStyle = 'rgba(6,10,24,.55)'; c.lineWidth = Math.max(3, T * 0.16); c.beginPath(); c.moveTo(cx - w, y - w * 0.5); c.lineTo(cx, y); c.lineTo(cx + w, y - w * 0.5); c.stroke(); c.strokeStyle = hexA('#BFF8F2', 0.8); c.lineWidth = Math.max(1.5, T * 0.07); c.stroke(); }
    if (A.step === 1) { const W2 = M.wheels[A.wheel], left = Math.max(0, A.dl); label(c, `DRAIN ${Math.ceil(left)}`, FX.sx(W2.x), FX.sy(W2.y) - T * 3.3, T * 0.42, left < 3 ? WARN : '#DFFBF8'); }
    c.restore(); }
  function drawBiteWarn(c, FX, B, T, t) { const X = FX.sx(B.x), Y = FX.sy(B.y), u = cl(B.t / TM.bite); if (B.hit) return;
    c.save(); c.translate(X, Y); c.rotate(B.a); const L = B.len * T, w = B.w * T;
    c.fillStyle = `rgba(30,6,6,${0.16 + 0.1 * u})`; c.fillRect(0, -w / 2, L, w); c.globalCompositeOperation = 'lighter'; c.fillStyle = hexA(WARN, 0.06 + 0.16 * u); c.fillRect(0, -w / 2, L * u, w); c.globalCompositeOperation = 'source-over';
    c.strokeStyle = 'rgba(30,6,6,.75)'; c.lineWidth = Math.max(3, T * 0.14); c.strokeRect(0, -w / 2, L, w); c.strokeStyle = hexA('#FFB0A8', 0.7 + 0.3 * Math.sin(t * 16)); c.lineWidth = Math.max(2, T * 0.07); c.strokeRect(0, -w / 2, L, w);
    // a jaw mark: two chevrons closing on the line's end
    for (const k of [0.55, 0.8]) { const x = L * k, s = w * 0.32; c.strokeStyle = 'rgba(30,6,6,.8)'; c.lineWidth = Math.max(3, T * 0.15); c.beginPath(); c.moveTo(x - s, -s); c.lineTo(x, 0); c.lineTo(x - s, s); c.stroke(); c.strokeStyle = '#FFD0C8'; c.lineWidth = Math.max(1.5, T * 0.07); c.stroke(); }
    c.restore(); label(c, String(Math.max(1, Math.ceil(TM.bite - B.t))), X + Math.cos(B.a) * B.len * T * 0.35, Y + Math.sin(B.a) * B.len * T * 0.35, T * 0.7, '#FFFFFF', 'rgba(80,10,0,.9)'); }

  /* ---------- (v398 B4) the GPU layer, rebuilt to the model's standard: everything soft and layered, through the shared
     FGFX painter (light added, smoke and steam laid over), never the turbulent beam kinds:
       Lantern Hunt  the bulb flares (bloom, a sparkle, a ring of light); its symbol is laid on the lane as light (soft blooms
                     along its outline, caustic light inside) under a shaft of lantern light from the bulb; the lane's water
                     charges (caustics thickening, a blue sheen) as the count runs out.
       Thunderwater  a bloom flash over the lane; branching arcs crawling over the water (each a wide faint halo, a glow and a
                     thin white core, forks thinner), the caustics blazing, spray thrown up its length, sparks twinkling at the
                     arcs' ends, ripples, then steam rising off it.
       Drain-and-Bite  a whirlpool at the sluice (spiral arms, a spinning water ring, a dark eye, bubbles) as the water's edge
                     falls back with foam along it; beached, the eel thrashes in splashes; the refill floods back with a foam
                     front; the bite lands in spray.
       50%           the lanterns flare in turn, the charge crawls down its back, then a pulse runs through all three lanes.
       The fall      the charge crackles over it as it rears, each lantern bursts in an amber bloom and a ring, it crashes in a
                     sheet of spray with a ring across the nave, steam rises off the spent body.
     Where the painter is not, a 2D picture of the same (sprites and gradients). lowFx: fewer arcs, no forks, no steam. ---------- */
  const fg = () => { try { if (typeof window !== 'undefined' && window.__NHALU_FX === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  /* a branching arc from (x0, y0) to (x1, y1) (screen px): a trunk by midpoint displacement, a few forks off it -> polylines */
  function arcTree(x0, y0, x1, y1, amp, forks, R) { const out = [], trunk = [[x0, y0], [x1, y1]];
    for (let lv = 0; lv < 2; lv++) { for (let i = trunk.length - 1; i > 0; i--) { const a = trunk[i - 1], b = trunk[i], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, o = (R() - 0.5) * amp * Math.pow(0.55, lv); trunk.splice(i, 0, [(a[0] + b[0]) / 2 - dy / l * o, (a[1] + b[1]) / 2 + dx / l * o]); } }
    out.push({ pts: trunk, w: 1 });
    for (let f = 0; f < forks; f++) { const i = 2 + Math.floor(R() * (trunk.length - 4)), a = trunk[i], b = trunk[i + 1], an = Math.atan2(b[1] - a[1], b[0] - a[0]) + (R() < 0.5 ? -1 : 1) * (0.5 + R() * 0.5), L = Math.hypot(x1 - x0, y1 - y0) * (0.15 + R() * 0.15), pts = [a];
      for (let k = 1; k <= 3; k++) { const p = pts[k - 1]; pts.push([p[0] + Math.cos(an + (R() - 0.5) * 0.8) * L / 3, p[1] + Math.sin(an + (R() - 0.5) * 0.8) * L / 3]); } out.push({ pts, w: 0.55 }); }
    return out; }
  const rngOf = sd => { let x = Math.floor(sd * 9973) % 2147483647 || 7; return () => (x = x * 16807 % 2147483647) / 2147483647; };
  // one arc drawn in layers: a wide faint halo, a soft glow, a thin white core (Q: the painter; else the 2D picture)
  function drawArc(c, Q, A, T, a, lf) { for (const br of A) { const P = br.pts, w = br.w;
      if (Q) { for (let k = 0; k < P.length - 1; k++) { const [ax, ay] = P[k], [bx, by] = P[k + 1], ex = (bx - ax) * 0.28, ey = (by - ay) * 0.28, x0 = ax - (k ? ex : 0), y0 = ay - (k ? ey : 0), x1 = bx + (k < P.length - 2 ? ex : 0), y1 = by + (k < P.length - 2 ? ey : 0);   // (each link overlapping the next: the painter fades a light beam's ends, so links laid end to end would bead)
          if (!lf) Q.beam(x0, y0, x1, y1, T * 0.7 * w, VOLT, 0.22 * a); Q.beam(x0, y0, x1, y1, T * 0.26 * w, '#BFEFFF', 0.5 * a); Q.beam(x0, y0, x1, y1, T * 0.09 * w, '#FFFFFF', 0.95 * a); if (!lf && (k & 1)) Q.glow(bx, by, T * 0.6 * w, VOLT, 0.18 * a); }
        const e = P[P.length - 1]; Q.glow(e[0], e[1], T * 0.55 * w, VOLT, 0.3 * a); if (!lf && w === 1) Q.star(e[0], e[1], T * 0.35, 0.6 * a, VOLT_HI); }
      else { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; for (const [lw, col] of [[T * 0.4 * w, `rgba(120,210,255,${0.18 * a})`], [T * 0.14 * w, `rgba(190,240,255,${0.45 * a})`], [Math.max(1, T * 0.05 * w), `rgba(255,255,255,${0.85 * a})`]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } c.restore(); } } }
  // the lane's symbol laid on the water as light: soft blooms along its outline, caustic light inside it
  function symbolLight(Q, kind, x, y, s, a, t) { const pts = []; const N = 18;
    if (kind === 1) for (let i = 0; i < N; i++) { const an = i / N * TAU; pts.push([x + Math.cos(an) * s * 0.82, y + Math.sin(an) * s * 0.82]); }
    else { const V = kind === 2 ? [0, 1, 2].map(i => { const an = -Math.PI / 2 + i / 3 * TAU; return [x + Math.cos(an) * s, y + Math.sin(an) * s * 1.02 + s * 0.12]; }) : [[x, y - s], [x + s * 0.78, y], [x, y + s], [x - s * 0.78, y]];
      for (let i = 0; i < V.length; i++) { const A2 = V[i], B2 = V[(i + 1) % V.length], n = Math.round(N / V.length); for (let k = 0; k < n; k++) pts.push([lerp(A2[0], B2[0], k / n), lerp(A2[1], B2[1], k / n)]); } }
    for (let i = 0; i < pts.length; i++) { const fl = 0.8 + 0.2 * Math.sin(t * 7 + i * 1.3); Q.glow(pts[i][0], pts[i][1], s * 0.3, AMBER, 0.32 * a * fl); Q.glow(pts[i][0], pts[i][1], s * 0.12, AMBER_HI, 0.5 * a * fl); }
    Q.caustic(x, y, s * 0.95, AMBER, 0.4 * a, kind * 3.1, 1); Q.glow(x, y, s * 1.9, AMBER, 0.14 * a); }
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !M.ok || !m) return;
    if (m.dead && M.end) drawEel(c, FX, m, T, t);   // (the engine drops a dead monster from its list: the fallen eel is drawn here)
    const C = FX.C, lf = lowFx(), F = fg(), Q = F ? F.begin(c, null) : null, sx = FX.sx, sy = FX.sy;
    const glow2 = (x, y, r, col, a, sq) => { if (Q) Q.glow(x, y, r, col, a, sq); else glowAt(c, x, y, r, col, a); };
    try {
      for (const L of M.lanes) { const xc = sx(laneX(C, L.i)), hw = LWW * T, y0 = sy(C.y - NY), y1 = sy(C.y + NY), n = lf ? 3 : 6, seg = (y1 - y0) / n, sqz = (seg * 0.62) / hw;
        // ---- Lantern Hunt: the lane charging, the lantern's shaft of light, the symbol laid on the water as light ----
        if (L.armed) { const u = cl(L.armed.t / L.armed.T), fl = 0.8 + 0.2 * Math.sin(t * 19 + L.seed) * Math.sin(t * 7.3), a = (0.12 + 0.4 * u) * fl, ty = Math.max(y0 + T * 2, Math.min(y1 - T * 2, sy(FX.me.y))), sym = L.armed.sym, ss = T * 1.35;
          if (Q) { for (let k = 0; k < n; k++) { Q.caustic(xc, y0 + seg * (k + 0.5), hw * 1.05, '#7FD8FF', a * 1.25, L.seed + k, sqz); if (u > 0.45 && !lf) Q.glow(xc, y0 + seg * (k + 0.5), hw * 1.2, VOLT, 0.16 * (u - 0.45) / 0.55 * fl, sqz); }
            // the charge gathering on the surface: pinpricks of light winking on the water, more and brighter as the count runs out
            { const R = rngOf(Math.floor(t * 12) + L.i * 31), nt = Math.round((lf ? 3 : 9) * (0.3 + u)); for (let k = 0; k < nt; k++) { const px = xc + (R() - 0.5) * hw * 1.8, py = y0 + R() * (y1 - y0), tw = R(); Q.star(px, py, T * (0.18 + 0.22 * u) * (0.6 + tw), (0.35 + 0.5 * u) * tw, VOLT_HI); if (u > 0.6 && tw > 0.7 && !lf) Q.glow(px, py, T * 0.5, VOLT, 0.25 * u); } }
            { const sk = 1.6;   // (v404 BF: the symbol's light is the only symbol now (no 2D mark over it): brighter)
              symbolLight(Q, sym, xc, ty, ss, (0.55 + 0.45 * u) * sk, t); for (const yy of [lerp(y0, y1, 0.22), lerp(y0, y1, 0.78)]) if (Math.abs(yy - ty) > T * 3) symbolLight(Q, sym, xc, yy, T, (0.4 + 0.4 * u) * sk, t + 2); } }
          else { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(xc - hw, 0, xc + hw, 0); g.addColorStop(0, 'rgba(120,210,255,0)'); g.addColorStop(0.5, `rgba(120,210,255,${a * 0.5})`); g.addColorStop(1, 'rgba(120,210,255,0)'); c.fillStyle = g; c.fillRect(xc - hw, y0, hw * 2, y1 - y0); c.restore(); glowAt(c, xc, ty, ss * 2, AMBER, 0.3 + 0.3 * u); }
          const bs = M.bulbScr && M.bulbScr[L.armed.bulb]; if (bs) { if (Q) { Q.shafts(bs[0], bs[1], xc, ty, T * (0.9 + 0.5 * u), AMBER, 0.22 + 0.25 * u, L.seed); Q.glow(bs[0], bs[1], T * 1.2, AMBER_HI, 0.35 + 0.3 * u); }
            else { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(bs[0], bs[1], xc, ty); g.addColorStop(0, 'rgba(255,200,87,.45)'); g.addColorStop(1, 'rgba(255,200,87,0)'); c.strokeStyle = g; c.lineWidth = T * 0.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(bs[0], bs[1]); c.lineTo(xc, ty); c.stroke(); c.restore(); } } }
        // ---- Thunderwater ----
        if (L.fx > 0) { const f = L.fx / TM.disFx, e = 1 - f, ff = f * f, fl = 0.75 + 0.25 * Math.sin(t * 31 + L.seed);
          if (L.flash > 0) { const k = L.flash / 0.24, kk = k * k; glow2(xc, (y0 + y1) / 2, hw * 2.6, VOLT, 0.9 * kk, (y1 - y0) / (hw * 4.6)); glow2(xc, (y0 + y1) / 2, hw * 1.5, VOLT_HI, kk, (y1 - y0) / (hw * 2.6)); for (let j = 0; j < 4; j++) glow2(xc, lerp(y0, y1, (j + 0.5) / 4), hw * 1.3, '#FFFFFF', 0.45 * kk); }
          if (Q) { for (let k = 0; k < n; k++) { Q.caustic(xc, y0 + seg * (k + 0.5), hw * 1.15, VOLT_HI, (0.9 * f + 0.25 * ff) * fl, L.seed + k * 3 + t * 0.5, sqz); Q.glow(xc, y0 + seg * (k + 0.5), hw * 1.4, VOLT, 0.38 * ff, sqz * 1.1); } }
          else { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(xc - hw, 0, xc + hw, 0); g.addColorStop(0, 'rgba(160,230,255,0)'); g.addColorStop(0.5, `rgba(200,245,255,${0.55 * f})`); g.addColorStop(1, 'rgba(160,230,255,0)'); c.fillStyle = g; c.fillRect(xc - hw, y0, hw * 2, y1 - y0); c.restore(); }
          // the arcs: re-struck every 70 ms while the charge lasts, crawling across the water from kerb to kerb
          if (e < 0.75) { L.arcT = (L.arcT || 0) - 1 / 60; if (L.arcT <= 0 || !L.arcs || !L.arcs.length) { L.arcT = 0.07; L.arcs = []; const R = rngOf(t * 13.7 + L.seed), na = lf ? 3 : 6;
              for (let i = 0; i < na; i++) { const yy = y0 + (y1 - y0) * (i + R()) / na, dy = (R() - 0.5) * T * 1.6; L.arcs.push(arcTree(xc - hw * 0.95, yy, xc + hw * 0.95, yy + dy, T * 1.1, lf ? 0 : 2, R)); } }
            const aa = (1 - e / 0.75) * fl; for (const A of L.arcs) drawArc(c, Q, A, T, aa, lf); }
          if (Q && !lf) for (let k = 0; k < 4; k++) Q.ripple(xc + (hash(L.seed + k) - 0.5) * hw * 1.4, y0 + (y1 - y0) * hash(L.seed * 3 + k), T * (0.8 + 2.8 * e), VOLT, 0.45 * f, k, GY, 0.1); }
        // ---- the drain: a whirlpool at the sluice, the water's edge falling back in foam; the refill flooding in ----
        if (L.vortex > 0 && L.wet > 0.02) { const vx = xc, vy = sy(C.y + NY - 1.3), k = Math.min(1, L.vortex / 0.4) * Math.min(1, L.wet * 3), R2 = hw * 0.9;
          if (Q) { Q.wshade(vx, vy, R2 * 0.55, R2 * 0.55 * GY, '#06202A', 0.55 * k, 3, 0.7); Q.evortex(vx, vy, R2, '#7FE8F0', 0.55, 0.55 * k, 2.2, -3, GY); Q.wring(vx, vy, R2 * 0.95, R2 * 0.95 * GY, 0, '#CFF6FF', 0.6 * k, 2, 0.08, 1, -2.4); Q.wring(vx, vy, R2 * 0.6, R2 * 0.6 * GY, 0, '#9FE8FF', 0.45 * k, 2, 0.1, 2, -3.5); if (!lf) Q.bubbles(vx, vy - R2 * 0.2, R2 * 0.7, R2 * 0.5, '#CFF6FF', 0.5 * k, 4, 0.6); }
          else { glowAt(c, vx, vy, R2, '#7FE8F0', 0.35 * k); c.save(); c.strokeStyle = `rgba(220,250,255,${0.5 * k})`; c.lineWidth = Math.max(1, T * 0.06); for (let j = 0; j < 3; j++) { c.beginPath(); c.ellipse(vx, vy, R2 * (0.3 + 0.25 * j), R2 * (0.3 + 0.25 * j) * GY, 0, t * (3 - j) + j, t * (3 - j) + j + 3.6); c.stroke(); } c.restore(); }
          // the falling edge of the water (it drains toward the sluice in the south): foam along it
          const top = lerp(y1, y0, Math.min(1, L.wet * 1.05)); if (Q && L.wet < 0.97) for (let j = 0; j < (lf ? 2 : 4); j++) Q.spray(xc + (j / ((lf ? 2 : 4) - 1) - 0.5) * hw * 1.6, top, hw * 0.45, '#E2F7F2', 0.45 * k, j + L.seed, 0.4, GY); }
        if (L.inflow > 0) { const k = L.inflow / 1.3, top = lerp(y1, y0, Math.min(1, L.wet * 1.05)); if (Q && L.wet < 0.97) for (let j = 0; j < (lf ? 2 : 4); j++) Q.spray(xc + (j / ((lf ? 2 : 4) - 1) - 0.5) * hw * 1.6, top, hw * 0.5, '#E2F7F2', 0.55 * k, j + 9, 0.6, GY); } }
      // ---- the lanterns' own light: a warm bloom round each bulb, swelling as one is lit; a flare as it lights ----
      if (M.bulbScr) for (let i = 0; i < 3; i++) { const b = M.bulbs[i], p = M.bulbScr[i]; if (!p || b.burst) continue; const g = Math.min(2.5, b.g), r = T * (0.55 + 0.45 * g), a = 0.12 + 0.22 * Math.min(2, g);
        glow2(p[0], p[1], r, AMBER, a); if (g > 1) glow2(p[0], p[1], r * 0.45, AMBER_HI, 0.25 * (g - 1));
        if (b.flare > 0) { const k = b.flare / 0.9, e2 = 1 - k; glow2(p[0], p[1], T * (1.6 + 1.6 * e2), AMBER, 0.45 * k); if (Q) { Q.star(p[0], p[1], T * (0.9 + 0.6 * k), 0.9 * k, AMBER_HI); Q.ring(p[0], p[1], T * (0.6 + 2.6 * e2), AMBER, 0.5 * k, T * 0.2, 1); } } }
      // ---- the charge crawling over its body: while lanes are charged, in the 50% moment, as it rears to die ----
      const crawl = M.p2 && M.p2.t < 2.2 ? Math.sin(Math.PI * Math.min(1, M.p2.t / 2.2)) : M.end && M.end.t < 2.4 ? 1 - sstep(1.9, 2.4, M.end.t) : M.lanes.some(q => q.armed) ? 0.35 : 0;
      if (crawl > 0.02 && M.sp && (m.dead ? M.end : true)) { const R = rngOf(Math.floor(t * 14) + 3), na = lf ? 2 : 4;
        for (let i = 0; i < na; i++) { const s0 = R() * (BODY_L - 1.6), s1 = s0 + 0.9 + R() * 0.8, p0 = spW(m, M, s0), p1 = spW(m, M, s1), X0 = sx(p0.x), Y0 = sy(p0.gy) - RAD(s0) * ZSQ * ZK * T * 0.9, X1 = sx(p1.x), Y1 = sy(p1.gy) - RAD(s1) * ZSQ * ZK * T * 0.9;
          drawArc(c, Q, arcTree(X0, Y0, X1, Y1, T * 0.45, lf ? 0 : 1, R), T * 0.75, crawl * (0.6 + 0.4 * R()), lf); } }
      // ---- the 50% moment: a pulse running through all three lanes in turn ----
      if (M.p2 && M.p2.t > 1.15) { const e = M.p2.t - 1.15; for (const L of M.lanes) { const k = Math.max(0, 1 - Math.abs(e - L.i * 0.18 - 0.2) / 0.45); if (k <= 0) continue; const xc = sx(laneX(C, L.i)), hw = LWW * T, y0 = sy(C.y - NY), y1 = sy(C.y + NY);
          glow2(xc, (y0 + y1) / 2, hw * 1.8, VOLT, 0.35 * k, (y1 - y0) / (hw * 3.6)); if (Q) for (let j = 0; j < (lf ? 2 : 4); j++) Q.caustic(xc, lerp(y0, y1, (j + 0.5) / (lf ? 2 : 4)), hw * 1.1, VOLT_HI, 0.6 * k, j * 2.3 + L.i, ((y1 - y0) / (lf ? 2 : 4) * 0.62) / hw); } }
      // ---- the pieces: splashes, steam, blooms, rings ----
      if (M.fxp) for (const q of M.fxp) { const u = q.t / q.life, X = sx(q.x), Y = sy(q.y) - (q.z || 0) * ZK * T;
        if (q.k === 'splash') { const r = T * q.s * (0.9 + 1.3 * Math.sqrt(u)), a = Math.min(1, Math.sin(Math.PI * Math.min(1, u * 1.4)) * 1.3) * (1 - u * 0.7);
          if (Q) { Q.spray(X, Y - r * 0.35 * (1 - u), r, q.col || '#CFF6FF', 0.85 * a, q.sd, Math.min(1, u * 1.3), 0.85); if (!lf) Q.ripple(X, Y, T * q.s * (0.6 + 2.2 * u), q.col || '#CFF6FF', 0.45 * (1 - u), q.sd, GY, 0.12); if (q.col === VOLT && u < 0.4) Q.star(X, Y - r * 0.3, T * 0.4, 0.8 * (1 - u / 0.4), VOLT_HI); }
          else glowAt(c, X, Y - r * 0.2, r, '#DFF8FF', 0.35 * a); }
        else if (q.k === 'steam') { const a = Math.min(1, u * 4) * (1 - u) * 0.62, r = T * q.s * (0.6 + 1.3 * u); if (Q) Q.smoke(X, Y, r, a, q.sd, '#D8E6EA', 0.7); else glowAt(c, X, Y, r, '#C8D8DC', a * 0.5); }
        else if (q.k === 'bloom') { const a = q.a * (1 - u) * (1 - u); glow2(X, Y, T * q.r * (0.6 + 0.6 * u), q.col, a); if (u < 0.3) glow2(X, Y, T * q.r * 0.3, '#FFFFFF', a * 0.6); }
        else if (q.k === 'ring') { const e = 1 - Math.pow(1 - u, 2.2), a = q.a * (1 - u); if (Q) { Q.ewave(X, Y, T * q.r * (0.2 + 0.8 * e), q.col, 0.6, a, q.sd, GY, 0.14); if (!lf) Q.ripple(X, Y, T * q.r * (0.15 + 0.85 * e), q.col, a * 0.6, q.sd, GY, 0.1); } else glowAt(c, X, Y, T * q.r * e, q.col, a * 0.3); } }
      if (Q && !m.dead && !lf && M.sp && !M.beach) { const s = (t * 1.3) % BODY_L, p = spW(m, M, s); Q.ripple(sx(p.x), sy(p.y), T * (0.8 + (t * 2.1 % 1.6)), '#CFF6FF', 0.18, s, GY); }
    } finally { if (Q) { M.fxStat = { q: Math.round((Q.nl + Q.ns) / 6), f: ((M.fxStat && M.fxStat.f) || 0) + 1 }; F.flush(c); } } }   // (v398 B4: what it laid down, for the tests)

  /* ---------- the stage: the rift's boss stage make() (the module hint points at the wheel in play) ---------- */
  function make(X, self, H) { { const F = X.F; if (F && F.fiend && F.fiend.id === 'belnhalu') F.fiend.bars = TUNE.bars; }
    if (X.M && Array.isArray(X.M.stones)) X.M.stones.length = 0;   // (no power stones in the nave: the fight's length is the lanes', the wheels' and the pet's own)   // (seven bars, whatever floor the stage plays as: the user's count; the hpK getter aims for it too)
    const FC = X.M && X.M.FC, C = FC ? { x: FC.x, y: FC.y, R: FC.R } : { x: X.M.MW / 2, y: X.M.MH / 2, R: ARENA_R };
    const mod = { C,
      hint() { const F2 = CUR && CUR.FX, M = F2 && F2.mem; if (!M || !M.wheels) return null; const W2 = M.wheels.find(w => w.exposed && !w.locked); return W2 ? { x: W2.x, y: W2.y, h: 2.2, label: 'Drain the lane' } : null; },
      goal() { const F2 = CUR && CUR.FX, M = F2 && F2.mem; if (M && M.wheels && M.wheels.some(w => w.exposed)) return 'Use the glowing wheel: drain the marked lane'; return null; } };
    const g0 = mod.goal; mod.goal = () => g0() || self.goalText || 'Nhalu the Lantern Eel';
    CUR = { g: X.g, X, mod, self }; return mod; }
  // (tests: start an act now, in a lane; use a wheel; the lanes)
  def.force = (FX, k, o) => { const m = FX.m, M = FX.mem; clearActs(FX, m, M); m.stunT = 0; M.beach = null; startAct(FX, m, M, k, o); };
  def.useWheel = (FX, i) => useWheel(FX, FX.mem.wheels[i]);
  def.make = make; def.MODEL = MODEL; def.TM = TM; def.TUNE = TUNE; def.LANES = { LX, LWW, HW, NX, NY, WATER_Z, laneOf, inLane, laneX }; def.WHEELS = WHEELS;
  return { MODEL, def, make, TUNE, TM, LANES: def.LANES };
})();
/* (v391 B4) a Belfry boss's health in a set number of bars (as CAL_BOSS_HPK, for rift 'belfry'): hpK so the bars the rift
   gives this boss's stage (riftFiend: round((round(n/5) + 2 + more) * hpK)) come out at exactly that many. The stage's
   floor n = the rift's level + 3 per section before it (Nhalu, section 2 of a level-10 rift: 13) */
function BEL_BOSS_HPK(id, bars, dflt) { try { let n = 13; const Rf = typeof RIFT_BY_ID !== 'undefined' ? RIFT_BY_ID.belfry : null; if (Rf && Rf.stages) { const i = Rf.stages.findIndex(s => s.boss === id); if (i >= 0) n = Math.max(1, (Rf.lvl || 1) + (riftStagePos(Rf, i).sec - 1) * 3); }
  const lo = n < 50 ? Math.min(1, Math.max(0, (n - 10) / 30)) : -1, hk = n >= 50 ? Math.min(1, (n - 50) / Math.max(10, TOWER_TOP - 50)) : -1, more = hk >= 0 ? Math.round(30 + 20 * hk) : Math.round(10 + 15 * lo);
  return (bars + 0.2) / (Math.round(n / 5) + 2 + more); } catch (e) { return dflt; } }
/* (registered as RiftFiend.define does: this file loads before 20t, so it writes the roster itself) */
RIFT_FIENDS.belnhalu = { id: 'belnhalu', name: 'Nhalu', title: 'The Lantern Eel', color: '#1E1A4A', glow: '#FFC857', accent: '#9FE8FF', biome: typeof BIOMES !== 'undefined' && BIOMES.belnave ? 'belnave' : typeof BIOMES !== 'undefined' && BIOMES.belfry ? 'belfry' : 'swamp', r: 1.0, els: ['water', 'dark'], phases: 2, cuts: [1, 0.5], belHard: 5,
  get hpK() { return BEL_BOSS_HPK('belnhalu', 7, 0.42); }, dmgK: 1 };
FIEND_DEFS.belnhalu = BEL_NHALU.def;
FIEND_DEFS.belnhalu.stageMake = BEL_NHALU.make; FIEND_DEFS.belnhalu.bossMake = BEL_NHALU.make; FIEND_DEFS.belnhalu.NHALU = BEL_NHALU;
if (typeof BEL !== 'undefined') { BEL.bossMake = BEL.bossMake || {}; BEL.bossMake.belnhalu = BEL_NHALU.make; BEL.nhalu = BEL_NHALU; }
