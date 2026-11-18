/* ---------- Rift 1 · THE DROWNED BELFRY · BOSS 1: KHARROX THE BELLBACK (worker B3, v391) ----------
   A crab five metres across whose shell is an old bronze bell turned upside down: squat, chipped on one side, three thick
   engraved bands round its waist, a crack down its front through which a turquoise eye on a short stalk peers out. The
   creature's wet dark-blue body fills the bell's mouth and bulges out beneath it; six ivory two-jointed legs and two claws
   (the left twice the size of the right) come out from under it. It walks with a heavy rocking gait in two tripods, its
   shell swinging a moment after its legs.
   Drawn live on the GPU with GLM (20k5uz, materials 100..104 between the BEL-KHARROX-MAT markers) as Ifrit and the Bomb
   King are: rigid meshes built once (the bell in six shards, each with its own band pieces, so the bands really shiver and
   the bell really breaks), posed each frame, one composite drawImage; the Belfry's existing 2D Kharrox (DunBoss 'kharrox') without WebGL or on a
   software rasteriser (window.__BELK_GL = 1 forces the GPU there, tests), with the same mechanics.
   The fight (spec, Boss 1):
     BELL SWEEP     the great claw raised for 2.5 s (it tracks the pet for the first second, then locks), then a 120-degree
                    frontal sweep; the SAFE ground is behind the small claw, marked with a shield. A short recovery after,
                    its eye pushed out of the crack (a weak point).
     TOLLING SHELL  the bands shiver and light for 2.8 s, then a ring rolls out over the floor with ONE marked opening:
                    walk through it. A recovery after, the eye out.
     at 50%         two brine crawlers (the rift's own 'crawler') come up out of the water, then the ring comes again.
   Every warning: a bright boundary (dark under it, for the pale floor), a countdown and a symbol (a claw, a bell, a
   shield, OPEN), 2.5-2.8 s ahead. Its fall: the bell cracks open along its seams and shatters (BREAK_FX on the bell, its
   six shards thrown across the floor), the toll goes out of it, the body settles; the rift goes on (the Clapper
   Counterweights).
   Arena (the fiend's own paintGround / props, and the stage's make): a dry 24-metre baptism floor of limestone courses round
   a bronze-rimmed font, a bright stone kerb, a ring of shallow walkable water outside it, four low square pillars with
   sea-glass lamps (they do not block); breakable dressing (votive urns, coral, sea-glass lanterns, broken hand-bells) in the
   water and by the kerb, broken through BREAK_FX by blows, the sweep and the ring.
   Registered with RiftFiend.define (20t, loaded just before this file). FIEND_DEFS.belkharrox
   .stageMake is the boss stage's make(X, self, H); FIEND_DEFS.belkharrox.BELK the interface for tests. */
const BELK = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const ease = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const clamp2 = (v, a, b) => v < a ? a : v > b ? b : v;
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;   // (the game camera, as Ifrit's: orthographic, about 46 degrees above the floor)
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const turnTo = (a, b, max) => a + Math.max(-max, Math.min(max, angTo(a, b)));
  const toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k);

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
  const mT = A => M3([A.x[0], A.y[0], A.z[0]], [A.x[1], A.y[1], A.z[1]], [A.x[2], A.y[2], A.z[2]]);
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };   // (+a: x toward -z)
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  function rotAxis(n, a) { n = vnrm(n); const c = Math.cos(a), s = Math.sin(a), t = 1 - c, [x, y, z] = n;
    return M3([t * x * x + c, t * x * y + s * z, t * x * z - s * y], [t * x * y - s * z, t * y * y + c, t * y * z + s * x], [t * x * z + s * y, t * y * z - s * x, t * z * z + c]); }
  function mslerp(A, B, u) { if (u <= 0) return A; if (u >= 1) return B; const R = mm(B, mT(A)), tr = R.x[0] + R.y[1] + R.z[2], ang = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
    if (ang < 1e-5) return B; let ax = [R.y[2] - R.z[1], R.z[0] - R.x[2], R.x[1] - R.y[0]]; if (vlen(ax) < 1e-5) { ax = [Math.sqrt(Math.max(0, (R.x[0] + 1) / 2)), Math.sqrt(Math.max(0, (R.y[1] + 1) / 2)), Math.sqrt(Math.max(0, (R.z[2] + 1) / 2))]; if (R.x[1] < 0) ax[1] = -ax[1]; if (R.x[2] < 0) ax[2] = -ax[2]; }
    return mm(rotAxis(ax, ang * u), A); }
  function frameXZ(xd, zh) { const x = vnrm(xd); let y = vcross(zh, x); if (vlen(y) < 1e-6) y = vcross([0, 0, 1], x); if (vlen(y) < 1e-6) y = [0, 1, 0]; y = vnrm(y); return M3(x, y, vcross(x, y)); }
  /* two-bone reach from S toward T (bones a, b), the middle joint toward `pole` */
  function ik2(S, T, a, b, pole) {
    const d0 = vsub(T, S), L = vlen(d0) || 1e-6, d = Math.max(Math.abs(a - b) + 1e-3, Math.min(a + b - 1e-4, L)), e = vmul(d0, 1 / L);
    let p = vsub(pole, vmul(e, vdot(pole, e))); if (vlen(p) < 1e-6) p = Math.abs(e[2]) < 0.9 ? vcross(e, [0, 0, 1]) : vcross(e, [1, 0, 0]); p = vnrm(p);
    const ca = (a * a + d * d - b * b) / (2 * a * d), sa = Math.sqrt(Math.max(0, 1 - ca * ca));
    return { E: vadd(S, vadd(vmul(e, a * ca), vmul(p, a * sa))), W: vadd(S, vmul(e, d)) }; }
  const hash3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
  const hh = (a, b) => hash3(a, b, 0.37);

  /* ================= materials (GLM's ids: the BEL-KHARROX-MAT block) ================= */
  const M_BRZ = 100, M_BIN = 100.1, M_BAND = 100.2, M_CUT = 100.3, M_CHIT = 101, M_TIP = 101.2, M_FLESH = 102, M_STALK = 102.2, M_EYE = 103, M_LIME = 104, M_BARN = 104.1, M_WEED = 104.2;

  /* ================= the rig's measures (tiles; z up from the floor; x forward, y to its left) ================= */
  const BZ = 0.86;                      // the body's centre above the floor, standing
  const BH = 1.6, BELL_Z = 0.26;        // the bell's height (crown to lip), its crown above the body's centre
  const CRACK_A = 0.42, CHIP_A = -2.3;  // the crack (front left, the eye peers through it) and the chip (behind on the right), round the bell
  const NSH = 6;                        // the bell's shards (it breaks along their seams)
  const BANDS = [0.3, 0.52, 0.74], BAND_W = 0.095;   // the bands: centres and half-heights (fractions of BH)
  const LF = 1.38, LT = 1.7;            // a leg's femur and tibia
  const ARM = { LU: 0.95, LF: 1.05 };   // the big claw's arm; the small claw is SMALL times it all
  const SMALL = 0.52, STALK_L = 0.6, PALM = 1.35;   // (the claw itself drawn big: a crab's claw outweighs its arm)
  /* the bell's outer profile (s = height / BH, radius): a squat bell upside down, its crown sunk into the body, flaring up to
     a thick sound-bow lip */
  const PRO = [[0, 0.8], [0.08, 0.84], [0.2, 0.862], [0.38, 0.878], [0.52, 0.925], [0.65, 1.03], [0.77, 1.19], [0.87, 1.37], [0.94, 1.51], [1.0, 1.62]];
  function roOf(s) { s = cl(s); let i = 0; while (i < PRO.length - 2 && PRO[i + 1][0] < s) i++; const a = PRO[Math.max(0, i - 1)][1], b = PRO[i][1], c2 = PRO[i + 1][1], d = PRO[Math.min(PRO.length - 1, i + 2)][1], w = (s - PRO[i][0]) / (PRO[i + 1][0] - PRO[i][0]);
    return 0.5 * (2 * b + (-a + c2) * w + (2 * a - 5 * b + 4 * c2 - d) * w * w + (-a + 3 * b - 3 * c2 + d) * w * w * w); }
  const thOf = s => 0.1 + 0.09 * sstep(0.7, 0.93, s) - 0.035 * sstep(0.95, 1, s);
  const riOf = s => roOf(s) - thOf(s);
  const gapOf = h => 0.3 * Math.pow(cl((h / BH - 0.25) / 0.75), 0.8);   // the crack's half-width (radians), widest at the lip
  /* the chip out of the lip: the wall's top there, ragged */
  function capOf(phi) { const d = angTo(CHIP_A, phi), w = 0.62; if (Math.abs(d) >= w) return BH + 1; const k = Math.pow(1 - (d / w) * (d / w), 0.55), jag = 0.5 + 0.3 * Math.sin(phi * 43 + 1.3) + 0.2 * Math.sin(phi * 97); return BH - (0.22 + 0.08 * jag) * k; }
  /* the wall's section: the crown's underside, up the outside, over the lip, down the inside (into the flesh) */
  const WALL = (() => { const P = [];
    for (let i = 0; i <= 3; i++) { const r = 0.8 * i / 3; P.push({ side: 'b', s: 0, r, h: -0.05 * (1 - (r / 0.8) * (r / 0.8)) }); }
    for (let i = 1; i <= 18; i++) { const s = i / 18; P.push({ side: 'o', s, r: roOf(s), h: s * BH }); }
    for (let i = 1; i <= 3; i++) { const f = i / 4; P.push({ side: 't', s: 1, f, r: lerp(roOf(1), riOf(1), f), h: BH + 0.035 * Math.sin(Math.PI * f) }); }
    for (let i = 0; i <= 12; i++) { const s = 1 - 0.72 * i / 12; P.push({ side: 'i', s, r: riOf(s), h: s * BH }); }
    return P; })();
  function clampPt(p, cap) { if (p.h <= cap) return p; const s = cap / BH; if (p.side === 'o') return { r: roOf(s), h: cap, cut: 1 }; if (p.side === 'i') return { r: riOf(s), h: cap, cut: 1 }; return { r: lerp(roOf(s), riOf(s), p.f), h: cap, cut: 1 }; }
  /* the shards: their seams run crown to lip, ragged; seam 0 is the crack itself (open, widening to the lip) */
  const SH_BASE = Array.from({ length: NSH }, (_, k) => CRACK_A + k * TAU / NSH + (k ? (hash3(k, 3.1, 7) - 0.5) * 0.35 : 0));
  function bnd(k, h) { if (k >= NSH) return bnd(0, h) + TAU; const s = h / BH; return SH_BASE[k] + (k ? 0.085 * Math.sin(s * 5.1 + k * 2.3) + 0.04 * Math.sin(s * 13.7 + k * 5.1) : 0.025 * Math.sin(s * 17 + 1.1)); }
  function span(k, h) { const g = gapOf(Math.max(0, h)); return [bnd(k, h) + (k === 0 ? g : 0), bnd(k + 1, h) - (k + 1 === NSH ? g : 0)]; }
  // each shard's flight when the bell breaks: where it lands, how it tumbles
  const SHARDS = Array.from({ length: NSH }, (_, k) => { const sp = span(k, BH * 0.5), mid = (sp[0] + sp[1]) / 2;
    return { k, mid, a: mid + (hash3(k, 1.7, 2.9) - 0.5) * 0.7, d: 0.7 + hash3(k, 5.3, 1.1) * 1.4, up: 0.8 + hash3(k, 2.2, 8.8) * 1.3, flip: hash3(k, 9.9, 4.4) < 0.34, ax: vnrm([hash3(k, 1, 2) - 0.5, hash3(k, 3, 4) - 0.5, hash3(k, 5, 6) - 0.2]), delay: hash3(k, 4.4, 6.6) * 0.22 }; });
  const restR = S => mm(rotZ(S.a), mm(rotY(S.flip ? -(Math.PI / 2 - 0.37) : Math.PI / 2 - 0.37), rotZ(-S.mid)));
  for (const S of SHARDS) { const Rr = restR(S); let mn = 1e9; for (const h of [0, BH * 0.5, BH]) for (const da of [-0.4, 0, 0.4]) { const r = roOf(h / BH), p = mv(Rr, [Math.cos(S.mid + da) * r, Math.sin(S.mid + da) * r, h]); mn = Math.min(mn, p[2]); } S.restZ = -mn + 0.02; }
  /* the legs: three a side; their hips on the body (its frame), their feet's home on the floor (the model's frame) */
  const LEGS = []; [[0.68, 0.5, 2.45], [1.52, 1.5, 2.6], [2.38, 2.52, 2.45]].forEach(([ha, fa, fr], j) => { for (const s of [1, -1]) LEGS.push({ i: LEGS.length, side: s, pair: j, hip: [Math.cos(ha) * 0.92, s * Math.sin(ha) * 0.86, -0.06], home: [Math.cos(fa) * fr, s * Math.sin(fa) * fr], dir: [Math.cos(fa), s * Math.sin(fa)] }); });
  const TRIPOD = LEGS.map(L => (L.pair === 1 ? (L.side > 0 ? 1 : 0) : (L.side > 0 ? 0 : 1)));   // ([front left, middle right, back left] and the others)

  /* ================= meshes (built once) ================= */
  let MESH = null, MESH_MS = 0; const PARTB = {};
  /* a chitin segment along x (0..L): round, a little swollen; vA.y 1 at its joints; o.bend bows it in z; from o.tipU on a dark
     tip (vA.z falling to 0 at the point) */
  function seg(B, L, r0, r1, m, o) { o = o || {}; const nu = o.nu || 10, nv = o.nv || 10, bend = o.bend || 0, tipU = o.tipU == null ? 2 : o.tipU, sw = o.swell == null ? 1 : o.swell;
    B.surf((u, v) => { const a = v * TAU, r = lerp(r0, r1, u) * (1 + 0.12 * Math.sin(Math.PI * u) * sw), z = -bend * Math.sin(Math.PI * u * 0.9); return [u * L, Math.cos(a) * r * (o.sy || 1), Math.sin(a) * r + z]; }, nu, nv, u => u >= tipU ? (o.tipM || M_TIP) : m,
      { e: u => Math.max(sstep(0.14, 0, u), sstep(0.86, 1, u)), a: u => u >= tipU ? 1 - (u - tipU) / (1 - tipU) : 1 });
    return B; }
  /* a tapered tube along a curve P(u), radius r(u), squashed by sy across its frame's y */
  function ctube(B, P, r, m, o) { o = o || {}; const sy = o.sy || 1;
    const fr = u => { const a = P(Math.max(0, u - 0.01)), b = P(Math.min(1, u + 0.01)); return frameXZ(vsub(b, a), o.up || [0, 0, 1]); };
    B.surf((u, v) => { const F = fr(u), a = v * TAU, rr = r(u); return vadd(P(u), vadd(vmul(F.y, Math.cos(a) * rr * sy), vmul(F.z, Math.sin(a) * rr))); }, o.nu || 14, o.nv || 10, o.mf || (() => m), { e: o.e, a: o.a });
    return B; }
  function buildMeshes() {
    const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(3, Math.round(n * DQ)), fin = (k, B) => { out[k] = B.done(); };
    const NP = WALL.length, wp = v => WALL[Math.round(v * (NP - 1))];
    /* ---- the bell: six shards (the wall over the lip, the seams' cut faces) and each shard's band pieces ---- */
    for (let k = 0; k < NSH; k++) {
      const B = nb(), nu = q(9), at = (u, p) => { const hb = Math.max(0, p.h), sp = span(k, hb), phi = lerp(sp[0], sp[1], u), c2 = clampPt(p, capOf(phi)), r = c2.r * (1 + 0.006 * Math.sin(phi * 7 + c2.h * 3)); return { x: Math.cos(phi) * r, y: Math.sin(phi) * r, z: c2.h, cut: c2.cut }; };
      B.surf((u, v) => { const a = at(u, wp(v)); return [a.x, a.y, a.z]; }, nu, NP - 1, (u, v) => wp(v).side === 'i' ? M_BIN : M_BRZ,
        { e: (u, v) => { const p = wp(v), a = at(u, p); if (a.cut || p.side === 't') return 1; if (p.side === 'o') return 0.9 * sstep(0.88, 1, p.s); if (p.side === 'i') return 0.8 * sstep(0.92, 1, p.s); return 0.12; } });
      for (const sd of [0, 1]) { const crack = (sd === 0 && k === 0) || (sd === 1 && k === NSH - 1);
        B.surf((u, w) => { const s = lerp(0.3, 1, u), h = s * BH, phi = span(k, h)[sd], hc = Math.min(h, capOf(phi)), s2 = hc / BH, r = lerp(roOf(s2), riOf(s2), w); return [Math.cos(phi) * r, Math.sin(phi) * r, hc]; }, q(10), 1, () => crack ? M_BRZ : M_CUT, { e: () => crack ? 0.7 : 0.9 }); }
      fin('w' + k, B);
      const Bb = nb();
      for (const bc of BANDS) Bb.surf((u, v) => { const s = bc + (v - 0.5) * 2 * BAND_W, h = s * BH, sp = span(k, h), phi = lerp(sp[0], sp[1], u), hc = Math.min(h, capOf(phi) - 0.03), s2 = hc / BH, r = roOf(s2) + 0.004 + 0.075 * sstep(0, 0.22, v) * sstep(1, 0.78, v); return [Math.cos(phi) * r, Math.sin(phi) * r, hc]; }, q(9), q(6), () => M_BAND, { e: (u, v) => v });
      fin('b' + k, Bb); }
    /* ---- the flesh in the bell's mouth: a wet dome, a fringe of lappets tucked under the wall ---- */
    { const B = nb(); B.ell([0, 0, 0.6], [0.83, 0.83, 0.47], M_FLESH, { seg: q(24), rings: q(9), th1: Math.PI * 0.56 });
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + 0.2; B.sph([Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.66 + 0.03 * Math.sin(i * 2.3)], 0.1 + 0.03 * hash3(i, 2, 3), M_FLESH, q(8)); }
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.7, r = 0.35 + 0.12 * hash3(i, 5, 1); B.ell([Math.cos(a) * r, Math.sin(a) * r, 0.98], [0.16, 0.11, 0.05], M_FLESH, { seg: q(10), rings: q(5) }); }
      fin('flesh', B); }
    /* ---- the underside: the body under the bell, its front with the mouthparts, the sockets of the legs and claws ---- */
    { const B = nb(); B.ell([0, 0, 0], [1.08, 0.96, 0.42], M_FLESH, { seg: q(26), rings: q(12) });
      B.ell([0.72, 0, -0.04], [0.36, 0.64, 0.24], M_FLESH, { seg: q(16), rings: q(8) });
      for (const y of [-0.16, -0.05, 0.05, 0.16]) B.tube([0.98, y, -0.1], [1.16, y * 1.25, -0.3], 0.055, 0.025, M_STALK, { seg: q(7) });
      for (let i = 0; i < 4; i++) B.ell([-0.2 + i * 0.16, 0, -0.36 + i * 0.015], [0.1, 0.62 - i * 0.08, 0.06], M_FLESH, { seg: q(12), rings: q(5) });   // (the underside's segments)
      for (const L of LEGS) B.sph(L.hip, 0.23, M_CHIT, q(10));
      B.sph([0.72, 0.5, 0.0], 0.22, M_CHIT, q(10)); B.sph([0.78, -0.5, 0.0], 0.15, M_CHIT, q(10));
      fin('body', B); }
    /* ---- the eye on its stalk ---- */
    { const B = nb(); seg(B, STALK_L, 0.075, 0.062, M_STALK, { nu: q(6), nv: q(9), swell: 0.4 }); B.torX([STALK_L - 0.02, 0, 0], 0.11, 0.035, M_STALK, { seg: q(14), rseg: 5 }); fin('stalk', B); }
    { const B = nb(); B.sph([0, 0, 0], 0.165, M_EYE, q(20)); fin('eye', B); }
    /* ---- the legs: ivory, two joints, a few spines; the tibia bowed out, its tip dark ---- */
    { const B = nb(); seg(B, LF, 0.19, 0.155, M_CHIT, { nu: q(9), nv: q(10) }); B.sph([LF, 0, 0], 0.175, M_CHIT, q(10));
      for (const u of [0.35, 0.62]) B.spike([LF * u, 0, 0.15], [LF * u + 0.12, 0, 0.34], 0.05, M_TIP, { seg: 5 }); fin('femur', B); }
    { const B = nb(); seg(B, LT, 0.15, 0.035, M_CHIT, { nu: q(12), nv: q(10), bend: -0.1, tipU: 0.74, swell: 0.6 }); fin('tibia', B); }
    /* ---- the arms ---- */
    { const B = nb(); seg(B, ARM.LU, 0.21, 0.18, M_CHIT, { nu: q(8), nv: q(10) }); B.sph([ARM.LU, 0, 0], 0.2, M_CHIT, q(10)); for (const u of [0.3, 0.6]) B.spike([ARM.LU * u, 0, 0.13], [ARM.LU * u + 0.08, 0, 0.28], 0.045, M_TIP, { seg: 5 }); fin('uarm', B); }
    { const B = nb(); seg(B, ARM.LF, 0.2, 0.28, M_CHIT, { nu: q(9), nv: q(10), swell: 0.5 }); for (let i = 0; i < 5; i++) { const u = 0.2 + i * 0.15; B.sph([ARM.LF * u, (i % 2 ? 1 : -1) * 0.09, 0.15 + 0.03 * u], 0.045, M_CHIT, 6); } fin('farm', B); }
    /* ---- the claw (its frame: x out of the wrist, z its back): a heavy palm, the fixed finger with teeth; the moving
       finger a part of its own, hinged at the palm's top ---- */
    { const B = nb(); B.ell([0.52, 0, 0.02], [0.62, 0.36, 0.47], M_CHIT, { seg: q(20), rings: q(12) });
      for (let i = 0; i < 9; i++) { const a = hash3(i, 1.3, 2.7) * 1.6 - 0.8, u = 0.2 + hash3(i, 4.1, 0.3) * 0.65; B.sph([u, Math.sin(a) * 0.3, 0.36 + 0.1 * Math.cos(a) - 0.3 * (u - 0.5) * (u - 0.5)], 0.04 + 0.025 * hash3(i, 7, 7), M_CHIT, 6); }
      const PP = u => [0.92 + 1.0 * u, 0, -0.2 + 0.04 * u + 0.15 * u * u], rP = u => 0.21 * Math.pow(1 - u, 0.65) + 0.018;
      ctube(B, PP, rP, M_CHIT, { nu: q(14), nv: q(10), sy: 0.78, mf: u => u > 0.6 ? M_TIP : M_CHIT, e: u => sstep(0.1, 0, u) * 0.6, a: u => u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1 });
      for (let i = 0; i < 6; i++) { const u = 0.12 + i * 0.1, p = PP(u); B.sph([p[0], 0, p[2] + rP(u) * 0.85], 0.04 - i * 0.004, M_CHIT, 6); }
      fin('palm', B); }
    { const B = nb(); const PD = u => [1.0 * u, 0, -0.04 * u - 0.16 * u * u], rD = u => 0.175 * Math.pow(1 - u, 0.6) + 0.016;
      ctube(B, PD, rD, M_CHIT, { nu: q(13), nv: q(10), sy: 0.8, mf: u => u > 0.62 ? M_TIP : M_CHIT, e: u => sstep(0.12, 0, u), a: u => u > 0.62 ? 1 - (u - 0.62) / 0.38 : 1 });
      for (let i = 0; i < 5; i++) { const u = 0.15 + i * 0.11, p = PD(u); B.sph([p[0], 0, p[2] - rD(u) * 0.85], 0.035, M_CHIT, 6); }
      B.sph([0, 0, 0], 0.12, M_CHIT, q(8)); fin('dact', B); }
    /* ---- a low square pillar of limestone, barnacled at its foot, weed hanging off its cap, a sea-glass lamp caged in bronze ---- */
    { const B = nb(); B.box([0, 0, 0.07], [0.66, 0.66, 0.07], 0.03, M_LIME); B.box([0, 0, 0.66], [0.47, 0.47, 0.54], 0.06, M_LIME); B.box([0, 0, 1.25], [0.6, 0.6, 0.075], 0.04, M_LIME); B.box([0, 0, 1.36], [0.38, 0.38, 0.035], 0.02, M_LIME);
      const N4 = [[1, 0], [0, 1], [-1, 0], [0, -1]];
      for (let i = 0; i < 26; i++) { const n = N4[i % 4], tg = [-n[1], n[0]], t2 = hh(i, 1) * 0.84 - 0.42, z = 0.16 + Math.pow(hh(i, 3), 1.7) * 0.5, p = [n[0] * 0.47 + tg[0] * t2, n[1] * 0.47 + tg[1] * t2, z], r = 0.035 + hh(i, 5) * 0.035;
        B.tube(p, [p[0] + n[0] * r * 1.3, p[1] + n[1] * r * 1.3, z], r, r * 0.45, M_BARN, { seg: 6, cap0: false, cap1: 'flat' }); }
      for (let i = 0; i < 9; i++) { const n = N4[i % 4], tg = [-n[1], n[0]], t2 = hh(i, 9) * 1.0 - 0.5, L = 0.25 + hh(i, 11) * 0.35, p = [n[0] * 0.6 + tg[0] * t2, n[1] * 0.6 + tg[1] * t2, 1.18];
        B.tube(p, [p[0] + n[0] * 0.04, p[1] + n[1] * 0.04, 1.18 - L], 0.03, 0.012, M_WEED, { seg: 5 }); }
      B.sph([0, 0, 1.58], 0.17, M_EYE, q(12));
      for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) B.tube([sx * 0.15, sy * 0.15, 1.38], [sx * 0.08, sy * 0.08, 1.78], 0.022, 0.018, M_BRZ, { seg: 5 });
      B.ell([0, 0, 1.79], [0.12, 0.12, 0.05], M_BRZ, { seg: q(10), rings: 4 });
      fin('pillar', B); }
    return out;
  }
  function bounds(name) { let b = PARTB[name]; if (b) return b; const M = MESH && MESH[name]; if (!M) return [[0, 0, 0], 1.6]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
    for (let i = 0; i < p.length; i += 3) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); }
    const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], r = hyp3(x1 - x0, y1 - y0, z1 - z0) / 2; return (PARTB[name] = [c, r]); }

  /* ================= the pose ================= */
  /* P: feet ([x, y, lift] six, the model's frame; else home), crouch, drop (a tripod landing), roll, pitch, twist (the body),
     bellRoll, bellPitch, bellYaw (the shell's own lag over the body), lift (the big claw raised), sweep (0..1 its swing),
     slam (its end: driven down on the far side), openL, openR (the claws), guard (the small claw drawn back), toll (the
     bands shivering), tollGlow (their engraving lit), eyeOut (the eye pushed out of the crack), eyeLook (rad), eyeGlow, wet,
     jolt, dead (0..1), shatter (seconds since the bell broke), alpha */
  function blankPose() { return { crouch: 0, drop: 0, roll: 0, pitch: 0, twist: 0, bellRoll: 0, bellPitch: 0, bellYaw: 0, lift: 0, sweep: 0, slam: 0, openL: 0.15, openR: 0.1, guard: 0, toll: 0, tollGlow: 0.05, eyeOut: 0, eyeLook: 0, eyeGlow: 0.85, wet: 0.8, jolt: 0, dead: 0, shatter: 0, alpha: 1, feet: null }; }
  function flyPose(S, Bb, Rbl, u) { const Rr = restR(S), rest = [Math.cos(S.a) * (0.3 + S.d), Math.sin(S.a) * (0.3 + S.d), S.restZ], ue = ease(u);
    const o = vlerp(Bb, rest, Math.min(1, u * 1.05)); o[2] = lerp(Bb[2], rest[2], u * u) + Math.sin(Math.PI * Math.min(1, u)) * S.up;
    return { R: mm(rotAxis(S.ax, Math.sin(Math.PI * u) * 1.3), mslerp(Rbl, Rr, ue)), o }; }
  function rig(P, t) {
    const inst = [], A = {}, dead = cl(P.dead || 0), live = 1 - dead, wet = P.wet == null ? 0.8 : P.wet;
    const I = (name, part, R, o, ex) => { const it = { name, part, R, o, s: 1, al: 1, glow: 0, glow2: 0, spill: wet, kind: 0, fx: dead * 0.85, wear: 0.5 }; if (ex) Object.assign(it, ex); inst.push(it); return it; };
    const br = Math.sin(t * 1.1) * live, cr = cl(P.crouch || 0), lift = ease(cl(P.lift || 0)), sw = cl(P.sweep || 0), slam = ease(cl(P.slam || 0)), eg = (P.eyeGlow == null ? 0.85 : P.eyeGlow) * live;
    /* the body */
    const P0 = [0, 0, BZ - 0.3 * cr - 0.07 * (P.drop || 0) - 0.44 * ease(dead) + 0.015 * br];
    const Rb = mm(rotZ(P.twist || 0), mm(rotX((P.roll || 0) + 0.1 * dead), rotY((P.pitch || 0) + 0.06 * dead)));
    const toB = p => vadd(P0, mv(Rb, p));
    I('body', 'body', Rb, P0, { glow: eg * 0.6, wear: 0.31 });
    A.body = P0;
    /* the bell: its shards and their bands (the bands shiver with the toll), the flesh in its mouth, the eye in its crack */
    const Bb = toB([0, 0, BELL_Z]), Rbl = mm(Rb, mm(rotZ(P.bellYaw || 0), mm(rotX(P.bellRoll || 0), rotY(P.bellPitch || 0))));
    const toll = cl(P.toll || 0) * live, tg = (P.tollGlow || 0) * live, sh = P.shatter || 0, jolt = P.jolt || 0;
    for (const S of SHARDS) { const dm = [Math.cos(S.mid), Math.sin(S.mid), 0], vib = toll * 0.014 * Math.sin(t * 61 + S.k * 1.9) + jolt * 0.01 * Math.sin(t * 40 + S.k * 2.7), vb = toll * (0.04 * Math.sin(t * 47 + S.k * 2.3) + 0.012);
      let R = Rbl, o = vadd(Bb, mv(Rbl, vmul(dm, vib))), ob = vadd(Bb, mv(Rbl, vmul(dm, vb)));
      if (sh > 0) { const u = cl((sh - S.delay) / 0.8); if (u > 0) { const f = flyPose(S, Bb, Rbl, u); R = f.R; o = f.o; ob = f.o; } }
      I('w' + S.k, 'w' + S.k, R, o, { glow2: tg * 0.25, wear: 0.13 + S.k * 0.11 });
      I('b' + S.k, 'b' + S.k, R, ob, { glow2: tg, wear: 0.4 + S.k * 0.07 }); }
    I('flesh', 'flesh', Rbl, Bb, { glow: eg * 0.5, wear: 0.62 });
    A.bell = vadd(Bb, mv(Rbl, [0, 0, BH * 0.55])); A.bellTop = vadd(Bb, mv(Rbl, [0, 0, BH])); A.bellBase = Bb;
    for (let b = 0; b < 3; b++) A['band' + b] = vadd(Bb, mv(Rbl, [0, 0, BANDS[b] * BH]));
    { const out = cl(P.eyeOut || 0) * live, lk = P.eyeLook || 0, base = [Math.cos(CRACK_A) * (0.42 + 0.3 * out), Math.sin(CRACK_A) * (0.42 + 0.3 * out), 0.98 + 0.06 * out];
      const sdir = vnrm([Math.cos(CRACK_A + lk * 0.25), Math.sin(CRACK_A + lk * 0.25), 0.12 + 0.45 * out - 0.5 * dead]);
      I('stalk', 'stalk', mm(Rbl, frameXZ(sdir, [0, 0, 1])), vadd(Bb, mv(Rbl, base)), { wear: 0.8 });
      const ec = vadd(base, vmul(sdir, STALK_L + 0.06)), ed = vnrm([Math.cos(CRACK_A + lk * 0.85), Math.sin(CRACK_A + lk * 0.85), 0.05 - 0.3 * dead]), eo = vadd(Bb, mv(Rbl, ec));
      I('eye', 'eye', mm(Rbl, frameXZ(ed, [0, 0, 1])), eo, { glow: eg, wear: 0.9 });
      A.eye = eo; A.eyeDir = mv(Rbl, ed); }
    /* the legs: each from its hip to its foot on the floor, the knee up and out */
    for (const L of LEGS) { const hip = toB(L.hip), F = P.feet && P.feet[L.i];
      const out = 0.22 * cr + 0.38 * dead; let f = F ? [F[0], F[1], F[2] || 0] : [L.home[0], L.home[1], 0]; f = [f[0] + L.dir[0] * out, f[1] + L.dir[1] * out, f[2] + 0.02];
      const J = ik2(hip, f, LF, LT, [L.dir[0] * 0.55, L.dir[1] * 0.55, 1 - 0.6 * dead]), K = J.E, W = J.W;
      I('fe' + L.i, 'femur', frameXZ(vsub(K, hip), [0, 0, 1]), hip, { wear: 0.2 + L.i * 0.1 });
      I('ti' + L.i, 'tibia', frameXZ(vsub(W, K), [L.dir[0], L.dir[1], 0]), K, { wear: 0.25 + L.i * 0.1 });
      A['foot' + L.i] = W; A['knee' + L.i] = K; }
    /* the claws */
    for (const side of [1, -1]) { const big = side > 0, k = big ? 1 : SMALL, S = toB(big ? [0.72, 0.5, 0.0] : [0.78, -0.5, 0.0]); let h;
      if (big) { h = [1.55 + 0.04 * br, 0.95, -0.12]; h = vlerp(h, [1.25, 0.85, -0.42], cr); h = vlerp(h, [0.62, 1.2, 2.35], lift);
        if (sw > 0) { const al = lerp(1.3, -1.25, ease(sw)), hs = [Math.cos(al) * 2.05, Math.sin(al) * 2.05, -0.3 - 0.15 * Math.sin(Math.PI * sw)]; h = vlerp(h, hs, sstep(0, 0.1, sw) * (1 - slam)); }
        h = vlerp(h, [1.3, -1.35, -0.6], slam); h = vlerp(h, [1.6, 1.25, -0.72], dead); }
      else { h = [1.2, -0.68, -0.28 + 0.03 * br]; h = vlerp(h, [0.5, -1.05, 0.0], cl(P.guard || 0)); h = vlerp(h, [1.0, -0.6, -0.42], cr); h = vlerp(h, [1.25, -0.95, -0.74], dead); }
      const hw = toB(h), J = ik2(S, hw, ARM.LU * k, ARM.LF * k, mv(Rb, [-0.3, side * 0.8, -0.6])), E = J.E, W = J.W, ud = vsub(E, S), fd = vsub(W, E), up0 = mv(Rb, [0, 0, 1]);
      const sn = big ? 'L' : 'R', cgl = big ? cl((P.clawGlow || 0) / 1.4) * 1.4 * live : 0;   // (v398 B3: the great claw's light)
      I('ua' + sn, 'uarm', frameXZ(ud, up0), S, { s: k, wear: big ? 0.55 : 0.65 });
      I('fa' + sn, 'farm', frameXZ(fd, up0), E, { s: k, wear: big ? 0.58 : 0.68, glow2: cgl * 0.45 });
      const up = vadd(up0, mv(Rb, [-1.4 * (big ? lift : 0), 0, 0])), Rp = mm(frameXZ(fd, up), rotY(0.18 - (big ? 0.4 * lift : 0)));
      I('pa' + sn, 'palm', Rp, W, { s: k * PALM, wear: big ? 0.6 : 0.7, glow2: cgl });
      const open = cl(big ? P.openL || 0 : P.openR || 0) * (1 - dead * 0.7), Rd = mm(Rp, rotY(0.04 - 0.8 * open)), Do = vadd(W, mv(Rp, vmul([0.95, 0, 0.2], k * PALM)));
      I('da' + sn, 'dact', Rd, Do, { s: k * PALM, wear: big ? 0.63 : 0.73, glow2: cgl });
      A['claw' + sn] = vadd(W, mv(Rp, vmul([1.4, 0, 0], k * PALM))); A['wrist' + sn] = W; A['elbow' + sn] = E; }
    return { inst, A, P0, Rb, Bb, Rbl };
  }

  /* ================= drawing ================= */
  const CW = [0, VY, VZ], EXW = [1, 0, 0];
  const LW = vnrm([-0.5, 0.35, 0.8]), SBW = vnrm([-0.3, -0.35, 0.88]), RIMW = vnrm([0.45, -0.8, 0.42]), UPW = [0, 0, 1];
  function mkView(x, y, z, a, o) {
    const T = o.T, sc = o.scale || 1, k = T * sc, Rh = rotZ(a), X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T;
    const toS = p => { const w = mv(Rh, p); return [X0 + w[0] * k, Y0 + (w[1] * GY - w[2] * ZK) * k]; };
    const toW = p => { const w = mv(Rh, p); return { x: x + w[0] * sc, y: y + w[1] * GY * sc, z: z + w[2] * sc }; };
    const depth = p => vdot(mv(Rh, p), CW);
    return { T, sc, k, Rh, toS, toW, depth, x, y, z, a };
  }
  /* the floor angle <-> the model's heading (the model's y is foreshortened by GY on the floor) */
  const headOf = th => Math.atan2(Math.sin(th) / GY, Math.cos(th));
  const floorAng = a => Math.atan2(Math.sin(a) * GY, Math.cos(a));
  function toBody(wx, wy, x, y, a) { const dx = wx - x, dy = (wy - y) / GY, c = Math.cos(a), s = Math.sin(a); return [dx * c + dy * s, -dx * s + dy * c]; }
  let NOGL = false, GLFAIL = 0, GLRETRY = 0, GLLAST = 0, GLMS = 0, GLN = 0, GLBOX = null; const GLI = [], GLJ = [], OCC = new Float32Array(48);
  const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
  const glOn = () => { if (NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__BELK_GL)) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Kharrox: meshes', e); return false; } } return true; };
  const GLCAP = 1700, RIMC = [0.45, 1.25, 1.2], AMBC = [1, 1, 1], OUTC = [0.012, 0.035, 0.05];
  /* one GPU pass: the parts in list (each { part, R, o, s, al, glow, glow2, spill, kind, fx, wear }) drawn into the box round them */
  function glPass(c, V, list, al0, o) {
    const k = V.k, X0 = V.toS([0, 0, 0]), PX = EXW, PY = [0, GY, -ZK], PD = CW;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { const [bc, brr] = bounds(it.part), rr = brr * (it.s || 1) * 1.05 * k, w = mv(V.Rh, vadd(it.o, mv(it.R, vmul(bc, it.s || 1)))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !(typeof window !== 'undefined' && window.__BELK_GLHQ), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.45 : 1) * (o.res || 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t: (o.t || 0) % 600,
      outline: o.outline === 0 ? 0 : Math.max(1, 1.1 * (W / bw)), outlineCol: OUTC };
    if (o.occ && o.occ.length) { let n2 = 0; for (const [p, r] of o.occ) { if (n2 >= 12) break; const w = mv(V.Rh, p); OCC[n2 * 4] = w[0]; OCC[n2 * 4 + 1] = w[1]; OCC[n2 * 4 + 2] = w[2]; OCC[n2 * 4 + 3] = r; n2++; } S.occ = OCC; S.nocc = n2; }
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = MESH[it.part]; if (!mesh) continue; const al = al0 * (it.al == null ? 1 : it.al); if (!(al > 0.004)) continue; const Rw = mm(V.Rh, it.R), s2 = it.s || 1, Tt = mv(V.Rh, it.o);
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2; g.R1[i] = Rw.y[i] * s2; g.R2[i] = Rw.z[i] * s2; g.T[i] = Tt[i]; }
      g.alpha = al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = it.wear == null ? 0.5 : it.wear; g.fx = it.fx || 0; g.outline = it.outline; g.d = vdot(Tt, PD); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    if (o.into) o.into(cvs, W, H, bx0, by0, bw, bh); else c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh);
    GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++; GLBOX = [W, H]; return true;
  }
  /* the soft ground shadow: blobs under the parts, painted small and laid down at once */
  let SHC = null, BLOB = null;
  function drawShadow(c, V, list, al) {
    if (!BLOB) { BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const g = BLOB.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.45, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const proj = [];
    for (const it of list) { if (it.part === 'eye' || it.part === 'stalk' || it.part[0] === 'b' && it.part !== 'body') continue; const [bc, brr] = bounds(it.part), p = vadd(it.o, mv(it.R, vmul(bc, it.s || 1))), g = V.toS([p[0], p[1], 0]), h = Math.max(0, p[2]), rr = brr * 0.55 * V.k * (it.s || 1) * (1 + h * 0.08), w = (it.al == null ? 1 : it.al) / (1 + h * 0.18);
      x0 = Math.min(x0, g[0] - rr); x1 = Math.max(x1, g[0] + rr + h * 0.2 * V.k); y0 = Math.min(y0, g[1] - rr); y1 = Math.max(y1, g[1] + rr); proj.push([g[0] + h * 0.14 * V.k, g[1] + h * 0.05 * V.k, rr, w]); }
    if (!proj.length) return;
    const sc = 0.25, W = Math.max(8, Math.ceil((x1 - x0) * sc) + 4), H = Math.max(8, Math.ceil((y1 - y0) * sc) + 4);
    if (!SHC || SHC.width < W || SHC.height < H) { SHC = document.createElement('canvas'); SHC.width = Math.max(W, SHC ? SHC.width : 0); SHC.height = Math.max(H, SHC ? SHC.height : 0); }
    const g = SHC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, SHC.width, SHC.height);
    for (const [px, py, rr, w] of proj) { const r2 = rr * sc; g.globalAlpha = Math.min(1, 0.4 * w); g.drawImage(BLOB, (px - x0) * sc + 2 - r2, (py - y0) * sc + 2 - r2 * GY, r2 * 2, r2 * 2 * GY); }
    c.save(); c.globalAlpha = al * 0.55; c.imageSmoothingEnabled = true; c.drawImage(SHC, 0, 0, W, H, x0 - 2 / sc, y0 - 2 / sc, W / sc, H / sc); c.restore();
  }
  /* the occluders: spheres inside the big parts, posed with them */
  function occOf(R) { const A = R.A; return [[A.body, 0.9], [A.bell, 1.0], [vadd(A.bellBase, [0, 0, 0.35]), 0.85], [A.wristL, 0.42], [A.clawL, 0.35], [A.elbowL, 0.25]]; }
  /* draw(c, x, y, a, P, o): the model at world (x, y), heading a (the model's angle: headOf(floor angle)), pose P;
     o = { T, sx, sy, t, scale, low, shadow, noGL, R (a rig of this pose already made) }. Returns the rig */
  let LAST = null;
  function draw(c, x, y, a, P, o) {
    o = o || {}; const t = o.t != null ? o.t : nowMs() / 1000, R = o.R || rig(P, t), V = mkView(x, y, 0, a, o), al0 = P.alpha == null ? 1 : P.alpha; LAST = { R, V };
    if (!(al0 > 0.01)) return R;
    if (o.shadow !== false) drawShadow(c, V, R.inst, al0 * (1 - 0.6 * cl(P.dead || 0)));
    if (!o.noGL && glOn()) { let ok = false; try { ok = glPass(c, V, R.inst, al0, { t, low: o.low, occ: (o.low || lowFx()) ? null : occOf(R) }); } catch (e) { glFail(); if (typeof console !== 'undefined') console.warn('Kharrox: draw', e); ok = false; } if (ok) return R; }
    return null;   // (no GPU here: the caller paints the existing 2D Kharrox, DunBoss 'kharrox')
  }
  /* a still prop (a pillar) rendered once at a size into its own picture and laid down after */
  const PROPC = new Map();
  function drawProp(c, part, x, y, a, o) {
    o = o || {}; const T = o.T, m0 = c.getTransform ? c.getTransform() : null, dev = m0 ? Math.max(0.25, Math.hypot(m0.a, m0.b)) : 1, q = Math.round(Math.log(Math.max(1, T * dev)) * 14), Tq = Math.exp(q / 14) / dev, key = `${part}|${o.key || ''}|${q}|${(+a || 0).toFixed(2)}`;   // (zoom steps of ~7%: a gliding camera does not repaint it every frame)
    const it = { part, R: I3(), o: [0, 0, 0], s: 1, al: 1, glow: o.glow || 0, glow2: 0, spill: o.wet == null ? 0.5 : o.wet, kind: o.kind || 0, fx: 0, wear: o.seed || 0.3 };
    let Pc = PROPC.get(key);
    if (!Pc) { if (!glOn()) return false;
      const V0 = mkView(0, 0, 0, a, { T: Tq, sx: v => v, sy: v => v });
      let pic = null; try { glPass(c, V0, [it], 1, { t: 0, low: o.low, into: (cvs, W, H, bx0, by0, bw, bh) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(cvs, 0, 0); pic = { cv, bx0, by0, bw, bh }; } }); } catch (e) { glFail(); }
      if (!pic) return false; Pc = pic; if (PROPC.size > 24) PROPC.clear(); PROPC.set(key, Pc); }
    const f = T / Tq; c.drawImage(Pc.cv, 0, 0, Pc.cv.width, Pc.cv.height, o.sx(x) + Pc.bx0 * f, o.sy(y) + Pc.by0 * f, Pc.bw * f, Pc.bh * f); return true;
  }
  /* anchors: of the last draw, or of a rig made already, in the world (tiles; z above the floor) */
  function anchor(name) { if (!LAST) return null; const p = LAST.R.A[name]; return p ? LAST.V.toW(p) : null; }
  function anchorOf(R, name, x, y, a) { const p = R && R.A[name]; if (!p) return null; const w = mv(rotZ(a), p); return { x: x + w[0], y: y + w[1] * GY, z: w[2] }; }
  const MODEL = { draw, drawProp, rig, anchor, anchorOf, blankPose, headOf, floorAng, toBody, SHARDS, LEGS, TRIPOD, VIEW: { GY, ZK },
    warm() { return glOn(); },
    __dbg: { get gl() { return glOn(); }, set noGL(v) { NOGL = !!v; }, get MESH() { return MESH; }, get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +GLMS.toFixed(2), frames: GLN, box: GLBOX, meshMs: +MESH_MS.toFixed(1), meshTris: MESH ? Object.values(MESH).reduce((a2, m) => a2 + (m ? m.ntri : 0), 0) : 0 }); } } };

  /* ================= the arena ================= */
  const AR = 15, DRY_R = 12, KERB = 0.36, FONT = 3.4;
  const ARENA = { R: AR, DRY: DRY_R,
    pillars: C => [0, 1, 2, 3].map(i => { const a = Math.PI / 4 + i * Math.PI / 2; return { i, x: C.x + Math.cos(a) * 8.2, y: C.y + Math.sin(a) * 8.2 }; }),
    start: C => ({ x: C.x + 0.4, y: C.y + 8.4 }),
    lair: C => ({ x: C.x, y: C.y - 13.4 }),   // (it comes up out of the water at the north)
    deco: C => { const out = []; const kinds = ['urn', 'coral', 'lamp', 'coral', 'urn', 'lamp', 'coral', 'urn', 'lamp', 'coral'];
      kinds.forEach((kind, i) => { const a = (i + 0.5) / kinds.length * TAU + 0.18 + (hh(i, 41) - 0.5) * 0.25, r = 12.95 + hh(i, 43) * 1.2; out.push({ kind, v: i, x: C.x + Math.cos(a) * r, y: C.y + Math.sin(a) * r, wet: 1 }); });
      [0.3, 2.62, 4.42].forEach((a, i) => out.push({ kind: 'bellfrag', v: i, x: C.x + Math.cos(a) * 10.7, y: C.y + Math.sin(a) * 10.7, wet: 0 }));
      return out; } };
  let STAGE = null;
  /* (v398 B3) leaving the stage drops this file's pointers into it (STAGE holds the game, its fiend state and memory; LAST the
     last drawn rig and view), so a dead stage can be collected. The GLM meshes, shader, shadow and prop caches (MESH, PARTB,
     SHC, BLOB, PROPC) and the GL scratch pools (GLI, GLJ) hold no stage objects and stay for the next fight */
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(() => { STAGE = null; LAST = null; }); } catch (e) { /* (no Belfry hook: nothing to register) */ }
  const modOf = FX => (STAGE && FX && STAGE.g === FX.g ? STAGE.mod : null);

  /* ================= the fight ================= */
  const TQ = '#61D9D2', TQ_HI = '#BFFCF4', WARN = '#FF6A3A', WARN_HI = '#FFE2CC', SAFE = '#C8FFE8', SAFE_M = '#7FE8C0', SAFE_D = '#123A30';
  const TM = { swWind: 2.5, swTrack: 1.0, swStrike: 0.42, swRec: 1.8, swBack: 0.55, swLen: 6.8, swSpread: Math.PI / 3, swReach: 5.2,
    tollWind: 2.8, ringV: 5.2, ringW: 1.0, ringR0: 2.4, gap: 0.38, tollRec: 1.6, tollBack: 0.45, broodT: 2.3,
    idle: [1.5, 1.05], walk: 1.65, keep: [3.6, 4.7], step: 0.44, stepThr: 0.42, push: 2.25 };
  /* (the tuning: Kharrox is set in absolute terms for the rift's recommended level, 10: six bars (BEL_BOSS_K, the 6/7/9
     convention), blows of about TUNE.dmg, and every blow on it scaled (dmgK) so its whole health is worth effHp of the pet's
     own damage, which sets the fight's length (about 90 s for a level-10 pet using its skills); a rift may set Rf.belkHp) */
  const TUNE = { bars: 6, dmg: 15, effHp: 21000 * 4 /* v404: 4x, the user 2026-11-19 */, addHp: 1000,   /* (v391: measured, a level-10 bot with skills deals ~270 of its damage a second here) */ sweepK: 1.45, ringK: 1.15, closedK: 0.85, openK: 1.25, eyeK: 1.7, stunK: 1.1 };
  const CYC = { 1: ['sweep', 'toll', 'sweep', 'toll'], 2: ['sweep', 'toll', 'sweep', 'sweep', 'toll'] };
  const sf = (FX, k, ...a) => { const s = FX.H && FX.H.sfx; if (s && s[k]) try { s[k](...a); } catch (e) { /* no sound */ } };
  const say = (FX, key, s, sub, col, dur) => { const M = FX.mem, n = (+M.seen[key] || 0) + 1; M.seen[key] = n; if (n > 2) return; FX.H.banner(s, n === 1 ? sub || '' : '', col || TQ_HI, n === 1 ? (dur || 2.6) : 1.1, n === 1); };
  const riftOf = () => { try { if (RIFT_BY_ID.belfry && RIFT_BY_ID.belfry.stages && RIFT_BY_ID.belfry.stages.some(s => s.boss === 'belkharrox')) return RIFT_BY_ID.belfry; for (const R of RIFTS) if (R.stages && R.stages.some(s => s.boss === 'belkharrox')) return R; } catch (e) { /* none */ } return null; };
  const rigNow = (FX, m) => { const M = FX.mem; if (!M.R || M.Rt !== M.bt) { M.R = rig(M.P, M.bt || 0); M.Rt = M.bt; } return M.R; };
  const anc = (FX, m, name) => { const M = FX.mem; return anchorOf(rigNow(FX, m), name, m.x, m.y, headOf(M.th)) || { x: m.x, y: m.y, z: 1.5 }; };
  const vis = p => ({ x: p.x, y: p.y - p.z * ZK });   // (where a body point shows: the floor point a tap there lands on)

  const def = {
    arenaR: AR, firstAct: 'rise', ambient: 'motes', floorDisc: true,
    phaseNames: ['The Bellback', 'The Brood Answers'],
    carve(set, C) { /* the pillars stand on the floor without blocking it (orientation, not cover) */ },
    start(C) { return ARENA.start(C); },
    props(C) { return ARENA.pillars(C).map(p => ({ kind: 'pillar', i: p.i, x: p.x, y: p.y })); },
    paintGround(c, A) { paintFloor(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    drawProp(c, FX, p, X, Y, T, t) { drawPropArt(c, FX, p, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'beldeco' && o.deco) decoArt(c, o.deco, X, Y, T, t); },
    camFocus(FX, m) { return camFocus(FX, m); },
    artPoses: [
      { name: 'standing', mem: { P: {} } },
      { name: 'Bell Sweep: the great claw raised', mem: { P: { lift: 1, openL: 0.95, guard: 1, twist: -0.12, roll: 0.05 } } },
      { name: 'Bell Sweep: the swing', mem: { P: { sweep: 0.55, openL: 0.75, guard: 1, twist: 0.0 } } },
      { name: 'Tolling Shell: the bands ring', mem: { P: { crouch: 1, toll: 1, tollGlow: 1.6, eyeGlow: 1.4 } } },
      { name: 'recovering: the eye out of the crack', mem: { P: { slam: 1, sweep: 1, eyeOut: 1, eyeGlow: 1.4, twist: -0.3 } } },
      { name: 'fallen: the bell broken', mem: { P: { dead: 1, shatter: 3, eyeGlow: 0 } } }],
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C, L0 = ARENA.lair(C); m.x = L0.x; m.y = L0.y; m.noTouch = true; m.touchK = 0;
      Object.assign(M, { ok: 1, bt: 0, th: Math.PI / 2, P: Object.assign(blankPose(), { eyeGlow: 0.15, wet: 1 }), A: null, idleT: 0, pick: 0, seen: {}, fx: [], drops: [], trail: [], end: null, bell: { r: 0, vr: 0, p: 0, vp: 0, y: 0, vy: 0 }, brood: false, adds: [], deco: [], hitT: -1, hitN: 0, lastHp: m.hp, flinch: 0, spd: 0,
        stat: { sweeps: 0, sweepHit: 0, sweepSafe: 0, sweepOut: 0, tolls: 0, rings: 0, ringHit: 0, ringGap: 0, adds: 0, decoBroken: 0, exposed: 0, eyeHits: 0, phase2At: null, t0: FX.S.t, dmg: {} } });
      const Rf = riftOf(); M.effHp = (Rf && Rf.belkHp) || TUNE.effHp; M.amp = m.maxhp / M.effHp;
      locoInit(FX, m);
      if (STAGE && STAGE.g === FX.g) STAGE.FX = FX;
      for (const d of ARENA.deco(C)) { const o = FX.obj({ kind: 'beldeco', x: d.x, y: d.y, r: d.kind === 'coral' ? 0.55 : 0.48, hp: 1, deco: d, onKill: ob => breakDeco(FX, ob, null) }); M.deco.push(o); } },
    phase(FX, p) { const M = FX.mem, m = FX.m; if (!M.ok) return; endAct(FX, m, true); M.flinch = 1; M.P.jolt = 1;
      if (p >= 2 && !M.brood) { M.brood = true; M.stat.phase2At = +(FX.S.t - M.stat.t0).toFixed(1); begin(FX, m, 'brood'); } },
    ai(FX, m, dt) { const M = FX.mem; if (!M.ok) return; m.actT += dt; m.noTouch = true;
      if (m.act === 'rise') { riseTick(FX, m, dt); return; }
      if (!M.A) { idleTick(FX, m, dt); return; }
      const A = M.A; A.t += dt;
      const done = A.kind === 'sweep' ? sweepTick(FX, m, A, dt) : A.kind === 'toll' ? tollTick(FX, m, A, dt) : A.kind === 'brood' ? broodTick(FX, m, A, dt) : true;
      if (done) endAct(FX, m); },
    stunned(FX, m, dt) { m.noTouch = true; },
    update(FX, dt) { update(FX, dt); },
    dmgK(FX, m, o) { const M = FX.mem; if (!M || !M.ok) return 1; M.flinch = Math.min(1, (M.flinch || 0) + 0.06); M.P.jolt = Math.max(M.P.jolt || 0, 0.35);
      const A = M.A, k = A && A.exposed ? TUNE.openK : m.stunT > 0 ? TUNE.stunK : TUNE.closedK; return k * (M.amp || 1) * stackK(FX, o); },
    onWeakHit(FX) { const M = FX.mem; if (!M || !M.ok) return; M.flinch = 1; M.stat.eyeHits++; stackK(FX, null); if (Math.random() < 0.3) FX.H.text(FX.m.x, FX.m.y - 4.2, 'The eye!', TQ_HI, 13); },
    ending(FX, m) { const M = FX.mem; endAct(FX, m, true); FX.noParts(); FX.weak('eye', 0, 0, 0, 0, false); for (const z of FX.S.hz) if (z.belk) z.life = 0;
      M.end = { t: 0 }; if (!M.corpse) { M.corpse = { kind: 'corpse', x: m.x, y: m.y + 0.05 }; FX.S.props.push(M.corpse); }
      sf(FX, 'hum'); FX.H.shake(lowFx() ? 4 : 9, 0.8);
      return { title: 'KHARROX FALLS', sub: 'Its bell breaks open, and the toll goes out of the water', col: TQ_HI, delay: 6.2, bannerAt: 2.0, fanfareAt: 2.0, quiet: true, slow: 0.45 }; },
    draw(c, FX, m, X, Y, T, t) { c.globalAlpha = 1; Y += (m.z || 0) * T * 4; paintBoss(c, FX, m, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawFx(c, FX, T, t); },
  };
  /* one blow over the whole crab (a burst that takes in its body, its hit proxies and its eye at once) counts about once */
  function stackK(FX, o) { const M = FX.mem, t = FX.g.t; if (M.hitT !== t) { M.hitT = t; M.hitN = 0; } M.hitN++; return M.hitN > 1 && o && o.viaProxy ? 0.3 : 1; }

  /* ---- moving: two tripods stepping in turn; the heading heavy; the body surging while a tripod swings ---- */
  function homeOf(m, th, L, lead) { const a = headOf(th), c = Math.cos(a), sn = Math.sin(a), hx = L.home[0], hy = L.home[1]; return { x: m.x + (hx * c - hy * sn) + (lead ? lead.x : 0), y: m.y + (hx * sn + hy * c) * GY + (lead ? lead.y : 0) }; }
  function locoInit(FX, m) { const M = FX.mem, L = M.loco = { vx: 0, vy: 0, want: null, aim: M.th, feet: [], grp: 0, stepping: -1, st: 0, lastPlant: -9, drop: 0, n: 0 };
    for (const lg of LEGS) { const h = homeOf(m, M.th, lg); L.feet.push({ x: h.x, y: h.y, fx: h.x, fy: h.y, lift: 0 }); } return L; }
  const locoOf = (FX, m) => FX.mem.loco || locoInit(FX, m);
  function walk(FX, m, tx, ty, spd, stop) { locoOf(FX, m).want = { tx, ty, spd, stop: stop || 0 }; }
  function face(FX, m, tx, ty) { locoOf(FX, m).aim = Math.atan2(ty - m.y, tx - m.x); }
  function aimAt(FX, m, a) { locoOf(FX, m).aim = a; }
  function locoTick(FX, m, dt, lock) { const M = FX.mem, L = locoOf(FX, m), w = L.want; L.want = null; let dvx = 0, dvy = 0;
    if (w && !lock) { const dx = w.tx - m.x, dy = w.ty - m.y, dd = Math.hypot(dx, dy), d = dd - (w.stop || 0); if (d > 0.15 && dd > 1e-4) { const s = w.spd * Math.min(1, d / 1.0); dvx = dx / dd * s; dvy = dy / dd * s; } }
    const go = dvx || dvy; L.vx = toward(L.vx, dvx, dt, go ? 1.6 : 2.8); L.vy = toward(L.vy, dvy, dt, go ? 1.6 : 2.8);
    const u0 = L.stepping >= 0 ? cl(L.st / TM.step) : 0, surge = L.stepping >= 0 ? 0.45 + 1.1 * Math.sin(Math.PI * u0) : 0.45;
    if (!lock) { const x0 = m.x, y0 = m.y; FX.H.moveEnt(m, L.vx * surge * dt, L.vy * surge * dt, 1); FX.clampArena(m, 2.4); M.spd = Math.hypot(m.x - x0, m.y - y0) / Math.max(dt, 1e-4); M.th = turnTo(M.th, L.aim, dt * 1.15 * Math.min(1, 0.35 + Math.abs(angTo(M.th, L.aim)) * 1.2)); }
    else { L.vx = L.vy = 0; M.spd = 0; }
    L.drop = Math.max(0, L.drop - dt * 3);
    const lead = { x: L.vx * TM.step * 0.6, y: L.vy * TM.step * 0.6 };
    for (let i = 0; i < 6; i++) { const f = L.feet[i], h = homeOf(m, M.th, LEGS[i]); if (Math.hypot(f.x - h.x, f.y - h.y) > 3) { f.x = f.fx = h.x; f.y = f.fy = h.y; } }   // (a foot left far behind comes home at once)
    if (lock) return L;
    if (L.stepping >= 0) { L.st += dt; const u = cl(L.st / TM.step), e = ease(u);
      for (let i = 0; i < 6; i++) { if (TRIPOD[i] !== L.stepping) continue; const f = L.feet[i], h = homeOf(m, M.th, LEGS[i], lead); f.x = f.fx + (h.x - f.fx) * e; f.y = f.fy + (h.y - f.fy) * e; f.lift = Math.sin(Math.PI * u) * 0.42; }
      if (u >= 1) { for (let i = 0; i < 6; i++) if (TRIPOD[i] === L.stepping) L.feet[i].lift = 0; footfall(FX, m, L.stepping); L.lastPlant = M.bt; L.drop = 1; L.n++; L.grp = 1 - L.stepping; L.stepping = -1; } }
    else if (M.bt - L.lastPlant > 0.05) { const err = g => { let e = 0; for (let i = 0; i < 6; i++) { if (TRIPOD[i] !== g) continue; const f = L.feet[i], h = homeOf(m, M.th, LEGS[i], lead); e = Math.max(e, Math.hypot(f.x - h.x, f.y - h.y)); } return e; };
      const e0 = err(L.grp), moving = Math.hypot(L.vx, L.vy) > 0.3;
      if (e0 > TM.stepThr || (moving && e0 > 0.15)) { L.stepping = L.grp; L.st = 0; for (let i = 0; i < 6; i++) if (TRIPOD[i] === L.stepping) { L.feet[i].fx = L.feet[i].x; L.feet[i].fy = L.feet[i].y; } }
      else if (err(1 - L.grp) > TM.stepThr) L.grp = 1 - L.grp; }
    return L; }
  function footfall(FX, m, grp) { const M = FX.mem, C = FX.C, heavy = Math.min(1, 0.4 + (M.spd || 0) / 2.0); sf(FX, 'thud');
    M.bell.vr += (grp ? 1 : -1) * 0.7 * heavy; M.bell.vp += 0.35 * heavy;   // (the shell swings after the step)
    if (lowFx()) return; FX.H.shake(0.8 + 1.0 * heavy, 0.08);
    for (let i = 0; i < 6; i++) { if (TRIPOD[i] !== grp) continue; const f = M.loco.feet[i], inW = Math.hypot(f.x - C.x, f.y - C.y) > DRY_R + 0.15;
      if (inW) M.fx.push({ kind: 'splash', x: f.x, y: f.y, t: 0, life: 0.7, s: 0.55, seed: Math.random() * 50 });
      else for (let j = 0; j < 2; j++) { const a = Math.random() * TAU; FX.H.part({ kind: 'smoke', x: f.x + Math.cos(a) * 0.3, y: f.y + Math.sin(a) * 0.15, vx: Math.cos(a) * 0.7, vy: Math.sin(a) * 0.3 - 0.25, life: 0.8, max: 0.8, size: 0.4 + Math.random() * 0.3, color: Math.random() < 0.5 ? '#B8BCA8' : '#9AA394' }); } } }
  /* ---- the rise: up out of the water at the north, onto the floor, one toll ---- */
  function riseTick(FX, m, dt) { const M = FX.mem, C = FX.C, to = { x: C.x, y: C.y - 6.2 };
    walk(FX, m, to.x, to.y, 1.5, 0); face(FX, m, FX.me.x, FX.me.y);
    if (!lowFx() && Math.random() < dt * 6 && Math.hypot(m.x - C.x, m.y - C.y) > DRY_R - 1) M.fx.push({ kind: 'splash', x: m.x + FX.rnd(-1.8, 1.8), y: m.y + FX.rnd(-0.6, 0.8), t: 0, life: 0.8, s: 0.9, seed: Math.random() * 50 });
    if (Math.hypot(m.x - to.x, m.y - to.y) < 0.5 || m.actT > 8) { m.act = 'fight'; M.idleT = 0.8; M.fx.push({ kind: 'reso', t: 0, life: 1.3, big: 1 }); sf(FX, 'chime', 523, 0.5); sf(FX, 'chime', 392, 0.35); FX.H.shake(lowFx() ? 3 : 7, 0.5);
      say(FX, 'p1', 'KHARROX THE BELLBACK', 'Read its body: the raised claw sweeps the front; the ringing bell sends out a wave', TQ_HI, 3.0); } }
  /* ---- between blows: it faces the pet, keeps a few tiles off it (side-stepping like a crab when the pet is close) ---- */
  function idleTick(FX, m, dt) { const M = FX.mem, me = FX.me, d = Math.hypot(me.x - m.x, me.y - m.y), ph = Math.min(2, FX.S.phase);
    face(FX, m, me.x, me.y);
    if (d > TM.keep[1]) walk(FX, m, me.x, me.y, TM.walk, TM.keep[0] + 0.3);
    else if (d < TM.keep[0] - 0.8) { const a = Math.atan2(m.y - me.y, m.x - me.x) + 0.5 * (M.sideDir || (M.sideDir = Math.random() < 0.5 ? -1 : 1)); walk(FX, m, me.x + Math.cos(a) * TM.keep[0], me.y + Math.sin(a) * TM.keep[0], TM.walk * 0.8, 0); }
    M.idleT -= dt; if (M.idleT > 0) return;
    const cyc = CYC[ph], kind = cyc[M.pick % cyc.length]; M.pick++; begin(FX, m, kind); }
  function begin(FX, m, kind) { const M = FX.mem; M.A = { kind, t: 0, phase: kind === 'sweep' ? 'close' : 'wind' }; m.actT = 0; }
  function endAct(FX, m, cut) { const M = FX.mem, A = M.A; if (A) { if (A.tele) A.tele.done = true; if (A.warn) A.warn.life = 0; } M.A = null; M.idleT = TM.idle[Math.min(2, FX.S.phase) - 1]; M.sideDir = 0;
    if (cut) { for (const s of FX.S.tele) s.done = true; FX.S.tele.length = 0; for (const z of FX.S.hz) if (z.belk) z.life = 0; } }
  /* ---- BELL SWEEP: close in; the great claw up for 2.5 s (tracking the pet a second, then locked), a 120-degree sweep across
     the front; behind the small claw is safe; a recovery with the eye pushed out ---- */
  const bigSide = A => A.a + Math.PI / 2, safeAng = A => A.a - Math.PI / 2 - 0.62;   // (the floor angles of the big claw's side and of the SAFE ground)
  function inSweep(FX, A, x, y, pad) { return !!A.tele && FX.inShape({ shape: 'cone', x: A.tele.x, y: A.tele.y, a: A.a, len: TM.swLen, spread: TM.swSpread }, x, y, pad || 0); }
  function inSafe(FX, A, m, x, y) { const d = Math.hypot(x - m.x, y - m.y); return d > 2.2 && d < 7.2 && Math.abs(angTo(safeAng(A), Math.atan2(y - m.y, x - m.x))) < 0.66; }
  function safeSpot(FX, m, A) { const a = safeAng(A); return FX.clampArena({ x: m.x + Math.cos(a) * 3.9, y: m.y + Math.sin(a) * 3.9 }, 1.2); }
  function sweepTick(FX, m, A, dt) { const M = FX.mem, me = FX.me, ph = FX.S.phase;
    if (A.phase === 'close') { const d = Math.hypot(me.x - m.x, me.y - m.y); face(FX, m, me.x, me.y); if (d > TM.swReach && A.t < 2.6) { walk(FX, m, me.x, me.y, TM.walk * 1.1, TM.swReach - 1.0); return false; }
      A.phase = 'wind'; A.t = 0; A.a = Math.atan2(me.y - m.y, me.x - m.x); M.stat.sweeps++;
      // (v398 B3) the blow is resolved here exactly as the engine resolves a marked one (the same cone, moment, and 0.45 s grace
      // between blows), so the warning on the floor is this file's soft light alone, with no hard-edged engine shape over it
      const tele = A.tele = { shape: 'cone', x: m.x, y: m.y, a: A.a, len: TM.swLen, spread: TM.swSpread, t: TM.swWind + 0.16, age: 0, dmg: m.dmg * TUNE.sweepK, done: false };
      A.warn = FX.hz({ belk: 'warn', kind: 'belkSweepWarn', shape: 'fn', test: () => false, x: m.x, y: m.y, life: TM.swWind + TM.swStrike + 0.2, A, draw() { /* (painted with the floor's light: drawGroundFx) */ },
        update(dt2, z) { tele.age += dt2; if (tele.done || tele.age < tele.t) return; tele.done = true; const me2 = FX.me, S = FX.S; if (FX.inShape(tele, me2.x, me2.y, me2.r) && S.t - (S.lastTeleHit || -9) > 0.45) { if (FX.hurt(tele.dmg)) S.lastTeleHit = S.t; } sweepStrike(FX, m, A, tele); } });
      say(FX, 'sweep', 'BELL SWEEP', 'The great claw rises: get BEHIND THE SMALL CLAW', WARN_HI, 2.6); sf(FX, 'hum'); }
    if (A.phase === 'wind') { const tr = TM.swTrack * (ph >= 2 ? 0.85 : 1);
      if (A.t < tr) A.a = turnTo(A.a, Math.atan2(me.y - m.y, me.x - m.x), dt * 1.25); else if (!A.locked) { A.locked = true; sf(FX, 'tick'); }
      aimAt(FX, m, A.a); A.tele.a = A.a; A.tele.x = m.x; A.tele.y = m.y; A.warn.x = m.x; A.warn.y = m.y;
      const s = Math.ceil(TM.swWind - A.t); if (s !== A.lastS && s > 0) { A.lastS = s; if (A.t > 0.1) sf(FX, 'tick'); }
      if (A.t >= TM.swWind) { A.phase = 'strike'; A.t = 0; sf(FX, 'whoosh'); } return false; }
    if (A.phase === 'strike') { if (A.t >= TM.swStrike) { A.phase = 'rec'; A.t = 0; A.exposed = true; M.stat.exposed++; slamFx(FX, m); } return false; }
    if (A.phase === 'rec') { if (A.t >= TM.swRec) { A.phase = 'back'; A.t = 0; A.exposed = false; } return false; }
    return A.t >= TM.swBack; }
  /* (v398 B3) the claw driven down at the end of its sweep: a splash ring, spray, dust and broken stone, a short hitstop */
  function slamFx(FX, m) { const M = FX.mem, p = anc(FX, m, 'clawL'), lf = lowFx(); M.fx.push({ kind: 'slam', x: p.x, y: p.y, t: 0, life: 1.2, seed: Math.random() * 50, wet: Math.hypot(p.x - FX.C.x, p.y - FX.C.y) > DRY_R });
    FX.H.shake(lf ? 3 : 8, 0.3); hitstop(FX, 0.05); sf(FX, 'thud');
    for (let i = 0; i < (lf ? 4 : 10); i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 4; FX.H.part({ kind: 'shard', x: p.x, y: p.y - 0.2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 3, g: 12, life: 0.9, max: 0.9, size: 2.5 + Math.random() * 3, rot: Math.random() * 6, color: Math.random() < 0.5 ? '#C9CDBD' : '#8E9890' }); } }
  const hitstop = (FX, s) => { const g = FX.g; if (g) g.hitStop = Math.max(g.hitStop || 0, lowFx() ? s * 0.6 : s); };   // (v398 B3)
  function sweepStrike(FX, m, A, s) { const M = FX.mem, me = FX.me, hit = FX.inShape(s, me.x, me.y, me.r);
    if (hit) M.stat.sweepHit++; else if (inSafe(FX, A, m, me.x, me.y)) M.stat.sweepSafe++; else M.stat.sweepOut++;
    if (!hit && !M.seen.sweepOk && inSafe(FX, A, m, me.x, me.y)) { M.seen.sweepOk = 1; FX.H.text(me.x, me.y - 1.5, 'Behind the small claw!', SAFE, 14); }
    if (hit) FX.H.text(me.x, me.y - 1.5, 'Swept!', WARN_HI, 15);
    FX.H.shake(lowFx() ? 4 : 7, 0.25); if (hit) hitstop(FX, 0.07); sf(FX, 'crash'); M.bell.vy -= 1.2; M.P.jolt = 1;   // (v398 B3: the shake shared with the slam that follows; a hitstop when it lands)
    M.fx.push({ kind: 'sweep', x: m.x, y: m.y, a: s.a, t: 0, life: 0.75, seed: Math.random() * 50 });
    for (const o of M.deco) if (!o.dead && FX.inShape(s, o.x, o.y, 0.3)) breakDeco(FX, o, { x: m.x, y: m.y }); }
  /* ---- TOLLING SHELL: crouched, the bands shiver and light (2.8 s, the ring and its opening shown), then the ring rolls out ---- */
  function inGap(A, x, y) { return Math.abs(angTo(A.ga, Math.atan2(y - A.y, x - A.x))) < TM.gap * 0.85; }
  function gapSpot(FX, A, me) { const d = clamp2(Math.hypot(me.x - A.x, me.y - A.y), 3.2, 7); return FX.clampArena({ x: A.x + Math.cos(A.ga) * d, y: A.y + Math.sin(A.ga) * d }, 1.2); }
  function tollTick(FX, m, A, dt) { const M = FX.mem, me = FX.me;
    if (A.phase === 'wind') { if (!A.warn) { const pa = Math.atan2(me.y - m.y, me.x - m.x), side = Math.random() < 0.5 ? -1 : 1; A.ga = pa + side * (0.55 + Math.random() * 0.5); A.x = m.x; A.y = m.y; M.stat.tolls++;
        A.warn = FX.hz({ belk: 'warn', kind: 'belkTollWarn', shape: 'fn', test: () => false, x: m.x, y: m.y, life: TM.tollWind + 0.2, A, draw() { /* (v398 B3: painted with the floor's light) */ } });
        say(FX, 'toll', 'TOLLING SHELL', 'Its bands ring: a wave rolls out. Walk through the OPENING', TQ_HI, 2.8); sf(FX, 'hum'); }
      face(FX, m, me.x, me.y); A.x = m.x; A.y = m.y; A.warn.x = m.x; A.warn.y = m.y;
      if ((A.chT = (A.chT || 0) - dt) <= 0) { A.chT = 0.55 - 0.32 * (A.t / TM.tollWind); sf(FX, 'chime', 660 + 440 * A.t / TM.tollWind, 0.1); M.fx.push({ kind: 'reso', x: m.x, y: m.y, t: 0, life: 0.9 }); }
      if (!lowFx() || Math.random() < 0.4) lift(M, m.x, m.y, Math.random() < dt * (6 + 14 * A.t / TM.tollWind) ? 1 : 0, 1.8, 4.6, 1.1 + A.t / TM.tollWind);   // (v398 B3: the floor's water lifting as the bell rings)
      const s = Math.ceil(TM.tollWind - A.t); if (s !== A.lastS && s > 0) { A.lastS = s; if (A.t > 0.1) sf(FX, 'tick'); }
      if (A.t >= TM.tollWind) { A.phase = 'ring'; A.t = 0; release(FX, m, A); } return false; }
    if (A.phase === 'ring') { if (A.t >= 0.6) { A.phase = 'rec'; A.t = 0; A.exposed = true; M.stat.exposed++; } return false; }
    if (A.phase === 'rec') { if (A.t >= TM.tollRec) { A.phase = 'back'; A.t = 0; A.exposed = false; } return false; }
    return A.t >= TM.tollBack; }
  function release(FX, m, A) { const M = FX.mem, x = A.x, y = A.y, ga = A.ga, dmg = m.dmg * TUNE.ringK; M.stat.rings++;
    sf(FX, 'crash'); sf(FX, 'chime', 392, 0.5); sf(FX, 'chime', 196, 0.4); FX.H.shake(lowFx() ? 4 : 9, 0.45); hitstop(FX, 0.05); M.P.jolt = 1; M.bell.vp -= 0.8;   // (v398 B3: a hitstop)
    lift(M, x, y, lowFx() ? 8 : 22, 1.6, 4.2, 2.2);
    M.fx.push({ kind: 'toll', x, y, t: 0, life: 1.2 });
    FX.hz({ belk: 'ring', kind: 'belkRing', shape: 'fn', test: () => false, x, y, r: TM.ringR0, ga, life: (AR * 2 + 1 - TM.ringR0) / TM.ringV, hit: false, gapSeen: false,
      update(dt, z) { z.r += TM.ringV * dt; const me = FX.me, d = Math.hypot(me.x - x, me.y - y), a = Math.atan2(me.y - y, me.x - x);
        if (!z.hit && !me.dead && Math.abs(d - z.r) < TM.ringW / 2 + me.r * 0.6) { if (Math.abs(angTo(ga, a)) < TM.gap) { if (!z.gapSeen) { z.gapSeen = true; M.stat.ringGap++; FX.H.text(me.x, me.y - 1.4, 'Through the opening!', SAFE, 14); } }
          else if (FX.hurt(dmg)) { z.hit = true; M.stat.ringHit++; FX.H.text(me.x, me.y - 1.5, 'Tolled!', WARN_HI, 15); } }
        for (const o of M.deco) if (!o.dead && Math.abs(Math.hypot(o.x - x, o.y - y) - z.r) < TM.ringW * 0.7 && Math.abs(angTo(ga, Math.atan2(o.y - y, o.x - x))) >= TM.gap) breakDeco(FX, o, { x, y });
        const C = FX.C; if (Math.hypot(C.x - x, C.y - y) + AR < z.r) z.life = 0; },
      draw() { /* (v398 B3: painted with the floor's light: drawGroundFx) */ } }); }
  /* (v398 B3) droplets lifted off the floor by the bell's ring: n of them between r0 and r1 tiles round (x, y), rising at about v */
  function lift(M, x, y, n, r0, r1, v) { for (let i = 0; i < n && M.drops.length < 40; i++) { const a = Math.random() * TAU, r = r0 + Math.random() * (r1 - r0); M.drops.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z: 0, vz: v * (0.5 + Math.random() * 0.7), t: 0, life: 0.8 + Math.random() * 0.6 }); } }
  /* ---- at half health: two brine crawlers come up out of the water, then the ring comes again ---- */
  function broodTick(FX, m, A, dt) { const M = FX.mem, me = FX.me, C = FX.C;
    if (!A.said) { A.said = true; say(FX, 'brood', 'THE BROOD ANSWERS', 'Two brine crawlers come up out of the water, and the bell rings again', TQ_HI, 3.0); sf(FX, 'hum'); M.fx.push({ kind: 'reso', x: m.x, y: m.y, t: 0, life: 1.3, big: 1 });
      // (v398 B3) where they will come up (as before: either side of the pet, out in the water), and the summons: a column of the
      // bell's light, the water heaving at both places
      const base = Math.atan2(me.y - C.y, me.x - C.x); A.pts = [-1, 1].map(s => { const a = base + s * 0.85; return { x: C.x + Math.cos(a) * (DRY_R + 1.0), y: C.y + Math.sin(a) * (DRY_R + 1.0) }; });
      M.fx.push({ kind: 'summon', x: m.x, y: m.y, t: 0, life: TM.broodT, seed: 3 }); FX.H.shake(lowFx() ? 2 : 4, 0.6); }
    face(FX, m, me.x, me.y);
    if (!A.geysers && A.t > 0.15) { A.geysers = true; for (const q of A.pts) M.fx.push({ kind: 'geyser', x: q.x, y: q.y, t: 0, life: 1.9, seed: Math.random() * 50 }); sf(FX, 'bubble'); }
    if (!A.spawned && A.t > 0.8) { A.spawned = true; const type = typeof MON !== 'undefined' && MON.crawler ? 'crawler' : null; FX.H.shake(lowFx() ? 3 : 6, 0.35); hitstop(FX, 0.04);
      for (const q of A.pts) { const x = q.x, y = q.y;
        M.fx.push({ kind: 'splash', x, y, t: 0, life: 1.0, s: 1.3, seed: Math.random() * 50 }); if (!type) continue;
        const c2 = FX.minion(type, x, y, { belkAdd: true }); if (c2) { c2.dmg = Math.min(c2.dmg, m.dmg * 0.5); c2.maxhp = c2.hp = Math.min(c2.maxhp || c2.hp, TUNE.addHp); M.adds.push(c2);   /* (a small add wave: blows a half of Kharrox's, a few seconds' work each) */ M.stat.adds++; FX.H.text(x, y - 1.1, 'Brine crawler!', TQ_HI, 13); } }
      sf(FX, 'whoosh'); sf(FX, 'bubble'); }
    if (A.t >= TM.broodT) { begin(FX, m, 'toll'); return false; }
    return false; }

  /* ---- every frame: the body's motion and pose, the shell's lag, what can be struck, the fall ---- */
  const RATE = { clawGlow: 5, crouch: 4, lift: 3.2, slam: 7, openL: 6, openR: 9, guard: 4, toll: 5, tollGlow: 3, eyeOut: 4, eyeLook: 5, eyeGlow: 2.5, twist: 4, pitch: 4, roll: 6, dead: 1.4 };
  function poseOf(FX, m, M) { const W = { clawGlow: 0, crouch: 0, lift: 0, sweep: 0, slam: 0, openL: 0.15, openR: 0.1, guard: 0, toll: 0, tollGlow: 0.05, eyeOut: 0, eyeLook: 0, eyeGlow: 0.85, twist: 0, pitch: 0, roll: 0, dead: 0 }, A = M.A, t = M.bt, me = FX.me;
    W.openL = 0.15 + 0.14 * Math.max(0, Math.sin(t * 0.9)); W.openR = Math.sin(t * 2.3 + 1) > 0.86 ? 0.75 : 0.1;   // (the big claw opens and closes slowly; the small one snaps)
    W.eyeLook = clamp2(angTo(headOf(M.th), headOf(Math.atan2(me.y - m.y, me.x - m.x))), -1.2, 1.2);
    if (FX.S.phase >= 2) W.eyeGlow = 1.15;
    if (A && A.kind === 'sweep') { const ph = A.phase;
      if (ph === 'wind') { const u = cl(A.t / 0.8); W.lift = u; W.openL = 0.95; W.guard = 1; W.twist = -0.12 * u; W.pitch = -0.06 * u; W.roll = 0.05 * u; W.eyeGlow = 1.2; W.clawGlow = 0.35 + 0.95 * cl(A.t / TM.swWind); }
      else if (ph === 'strike') { W.clawGlow = 1.4; W.sweep = cl(A.t / TM.swStrike); W.lift = 1 - cl(A.t / 0.1); W.openL = 0.75; W.guard = 1; W.twist = lerp(0.25, -0.3, ease(W.sweep)); W.pitch = 0.05; }
      else if (ph === 'rec') { W.slam = 1; W.sweep = 1; W.openL = 0.3; W.guard = 0.5; W.twist = -0.3; W.pitch = 0.09; W.eyeOut = 1; W.eyeGlow = 1.45; } }
    if (A && A.kind === 'toll') { const ph = A.phase;
      if (ph === 'wind') { const u = cl(A.t / TM.tollWind); W.crouch = Math.min(1, A.t / 0.6); W.toll = 0.3 + 0.7 * u; W.tollGlow = 0.25 + 1.2 * u; W.openL = 0.05; W.openR = 0.05; W.eyeGlow = 1.0 + 0.5 * u; W.pitch = -0.04; }
      else if (ph === 'ring') { W.crouch = 1 - cl(A.t / 0.5) * 0.4; W.toll = 1; W.tollGlow = 1.9; W.pitch = 0.08; }
      else if (ph === 'rec') { const u = cl(A.t / TM.tollRec); W.crouch = 0.4; W.toll = 0.5 * (1 - u); W.tollGlow = 0.9 * (1 - u); W.eyeOut = 1; W.eyeGlow = 1.35; } }
    if (A && A.kind === 'brood') { W.clawGlow = 0.5; W.crouch = 0.3; W.lift = 0.55; W.openL = 1; W.openR = 1; W.toll = 0.6; W.tollGlow = 1.3; W.pitch = -0.12; W.eyeGlow = 1.5; }
    if (m.act === 'rise' || m.act === 'enter') W.eyeGlow = 0.2 + 0.7 * cl(m.actT / 3);
    const L = M.loco; if (L && L.stepping >= 0) { const k2 = Math.sin(Math.PI * cl(L.st / TM.step)); W.roll += (L.stepping ? -1 : 1) * 0.075 * k2; W.pitch += 0.025 * k2; }   // (the rocking gait: the weight rolls onto the planted tripod)
    if (M.flinch > 0) W.pitch -= 0.06 * M.flinch;
    if (M.end) { const E = M.end; W.dead = sstep(1.0, 2.2, E.t); W.toll = E.t < 1.25 ? 0.6 + 0.4 * E.t / 1.25 : 0; W.tollGlow = E.t < 1.25 ? 2.2 : 0; W.eyeGlow = lerp(1.3, 0, sstep(1.0, 3.2, E.t)); W.eyeOut = 0.4; W.crouch = 0.5; W.openL = 0.6; W.openR = 0.6; W.lift = 0; W.guard = 0; W.twist = 0; }
    return W; }
  function easePose(FX, m, dt) { const M = FX.mem, W = poseOf(FX, m, M), P = M.P;
    for (const k in RATE) P[k] = toward(P[k], W[k] == null ? 0 : W[k], dt, RATE[k]);
    P.sweep = W.sweep; P.slam = W.slam > P.slam ? toward(P.slam, W.slam, dt, 14) : toward(P.slam, W.slam, dt, 4);
    P.jolt = Math.max(0, (P.jolt || 0) - dt * 2.5); M.flinch = Math.max(0, (M.flinch || 0) - dt * 1.4);
    const L = M.loco; P.drop = L ? L.drop : 0;
    if (L) { const a = headOf(M.th); P.feet = P.feet || [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (let i = 0; i < 6; i++) { const f = L.feet[i], b = toBody(f.x, f.y, m.x, m.y, a); P.feet[i][0] = b[0]; P.feet[i][1] = b[1]; P.feet[i][2] = f.lift || 0; } }
    // the shell's lag: its own roll, pitch and twist chase the body's on a soft heavy spring, so it swings a moment after the legs
    const B = M.bell, k = 30, dmp = 4.4;
    B.vr += (k * (P.roll - B.r) - dmp * B.vr) * dt; B.r += B.vr * dt; B.vp += (k * (P.pitch - B.p) - dmp * B.vp) * dt; B.p += B.vp * dt; B.vy += (k * 0.8 * (P.twist - B.y) - dmp * B.vy) * dt; B.y += B.vy * dt;
    const acc = ((M.spd || 0) - (M.spd0 || 0)) / Math.max(dt, 1e-3); M.spd0 = M.spd || 0; B.vp -= clamp2(acc, -6, 6) * 0.02;
    const lim = 0.22; P.bellRoll = clamp2((B.r - P.roll) * 1.4, -lim, lim); P.bellPitch = clamp2((B.p - P.pitch) * 1.4, -lim, lim); P.bellYaw = clamp2((B.y - P.twist) * 1.2, -lim, lim);
    P.wet = 0.8 + 0.2 * Math.sin(M.bt * 0.3); }
  function update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.ok) return; M.bt += dt; const me = FX.me;
    for (let i = M.fx.length - 1; i >= 0; i--) { const f = M.fx[i]; f.t += dt; if (f.t >= f.life) M.fx.splice(i, 1); }
    for (let i = M.drops.length - 1; i >= 0; i--) { const d = M.drops[i]; d.t += dt; d.z += d.vz * dt; d.vz -= 0.6 * dt; if (d.t >= d.life) M.drops.splice(i, 1); }   // (v398 B3)
    while (M.trail.length && M.bt - M.trail[0].t > 0.52) M.trail.shift();
    if (M.end) { deadTick(FX, m, dt); easePose(FX, m, dt); M.R = null; return; }
    if (m.dead) return;
    locoTick(FX, m, dt, m.act === 'enter');
    easePose(FX, m, dt); M.R = null;
    { const A = M.A; if (A && A.kind === 'sweep' && (A.phase === 'strike' || (A.phase === 'rec' && A.t < 0.06))) { const p = anc(FX, m, 'clawL'); M.trail.push({ x: p.x, y: p.y, z: p.z, t: M.bt });   // (v398 B3: the claw's path, for its ribbon; sparks off its edge)
        if (!lowFx() || Math.random() < 0.35) FX.H.part({ kind: 'spark', x: p.x + FX.rnd(-0.3, 0.3), y: p.y - p.z * ZK, vx: FX.rnd(-2, 2), vy: FX.rnd(-3, -1), g: 9, drag: 0.4, life: 0.45, max: 0.45, size: 2.2, color: Math.random() < 0.5 ? '#FFF2DC' : '#BFFCF4' }); } }
    { const d = (M.lastHp == null ? m.hp : M.lastHp) - m.hp; M.lastHp = m.hp; if (d > 0) { const key = M.A && M.A.exposed ? 'open' : 'closed'; M.stat.dmg[key] = Math.round((M.stat.dmg[key] || 0) + d); } }
    if (m.act !== 'enter') {
      const bell = vis(anc(FX, m, 'bell')), cw = vis(anc(FX, m, 'clawL')), bd = vis(anc(FX, m, 'body'));
      FX.parts([{ key: 'bell', dx: bell.x - m.x, dy: bell.y - m.y, r: 1.7 }, { key: 'body', dx: bd.x - m.x, dy: bd.y - m.y + 0.2, r: 1.5 }, { key: 'claw', dx: cw.x - m.x, dy: cw.y - m.y, r: 0.95 }]);
      const A = M.A; if (A && A.exposed) { const e = vis(anc(FX, m, 'eye')); FX.weak('eye', e.x, e.y, 0.8, TUNE.eyeK * (M.amp || 1), true); } else FX.weak('eye', 0, 0, 0, 0, false);
      // it is walked round, not through: the pet eased out from under the bell
      if (!me.dead) { const dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy), r0 = TM.push; if (d < r0 && d > 1e-4) FX.push(dx / d * (r0 - d) * 0.6, dy / d * (r0 - d) * 0.6); }
      // drips off the bell, a bubble from the crack now and then
      if (!lowFx() && Math.random() < dt * 3) { const p = vis(anc(FX, m, 'bellTop')), a = Math.random() * TAU; FX.H.part({ kind: 'spark', x: p.x + Math.cos(a) * 1.3, y: p.y + Math.sin(a) * 0.4 + 0.3, vx: 0, vy: 1.5, g: 8, drag: 0.2, life: 0.6, max: 0.6, size: 1.6, color: '#BFF4F0' }); }
    }
    // the adds: forget the dead
    for (let i = M.adds.length - 1; i >= 0; i--) if (M.adds[i].dead) M.adds.splice(i, 1); }
  /* ---- the fall: it shudders, its bands scream, the bell breaks along its seams and the shards are thrown down; the body settles ---- */
  function deadTick(FX, m, dt) { const M = FX.mem, E = M.end; E.t += dt;
    if (E.t < 1.25) { M.P.jolt = 1; if (Math.random() < dt * 14) sf(FX, 'tick'); if (!E.dying) { E.dying = true; M.fx.push({ kind: 'dying', x: m.x, y: m.y, t: 0, life: 1.4, seed: 5 }); } if (!lowFx() && Math.random() < dt * 7) FX.H.shake(1.6, 0.1); }   // (v398 B3: the light breaking out of its seams, a rumble)
    if (E.t >= 1.25 && !E.broke) { E.broke = true; shatter(FX, m); }
    if (E.broke) { M.P.shatter = E.t - 1.25; for (const S of SHARDS) { const land = 1.25 + S.delay + 0.8; if (!E['l' + S.k] && E.t >= land) { E['l' + S.k] = 1; sf(FX, 'thud'); if (!lowFx()) FX.H.shake(2.5, 0.1); const p = anchorOf({ A: { p: [Math.cos(S.a) * (1.2 + S.d), Math.sin(S.a) * (1.2 + S.d), 0] } }, 'p', m.x, m.y, headOf(M.th)); if (p) M.fx.push({ kind: Math.hypot(p.x - FX.C.x, p.y - FX.C.y) > DRY_R ? 'splash' : 'dust', x: p.x, y: p.y, t: 0, life: 0.8, s: 0.8, seed: S.k * 7 }); } } }
    if (Math.random() < dt * 4 * (1 - cl(E.t / 5)) && !lowFx()) { const p = vis(anc(FX, m, 'body')); FX.H.part({ kind: 'smoke', x: p.x + FX.rnd(-1.4, 1.4), y: p.y + FX.rnd(-0.4, 0.4), vx: FX.rnd(-0.3, 0.3), vy: -0.8, life: 1.4, max: 1.4, size: 0.9, color: '#9FC8C8' }); } }
  function shatter(FX, m) { const M = FX.mem, me = FX.me, b = anc(FX, m, 'bellBase');
    if (typeof BREAK_FX !== 'undefined') try { BREAK_FX.burst(null, b.x, b.y + 0.05, { mat: 'iron', cols: ['#9A7440', '#4A3420', '#D8B070'], hot: TQ, size: 4.2, w: 3.4, h: 3.6, paint: (c2, P2) => bellPaint2D(c2, P2), key: 'belk-bell', from: { x: me.x, y: me.y }, mix: 'stone' }); } catch (e) { /* (the shared break effect) */ }
    M.fx.push({ kind: 'shatter', x: b.x, y: b.y, t: 0, life: 2.6, seed: 9 }); FX.H.flash(0.35, TQ_HI); FX.H.shake(lowFx() ? 6 : 15, 0.7); hitstop(FX, 0.12); lift(M, b.x, b.y, lowFx() ? 10 : 30, 0.8, 5, 3.2);   // (v398 B3: a hitstop, the water thrown up) sf(FX, 'crash'); sf(FX, 'chime', 523, 0.6); FX.H.after(0.25, () => sf(FX, 'chime', 392, 0.45)); FX.H.after(0.55, () => sf(FX, 'chime', 262, 0.35));
    FX.H.text(m.x, m.y - 4.2, 'The bell breaks!', TQ_HI, 16); }
  /* dressing broken by a blow, the sweep or the ring: BREAK_FX with its own picture */
  function breakDeco(FX, o, from) { if (o.broken) return; o.broken = true; o.dead = true; const M = FX.mem, d = o.deco; if (M && M.stat) M.stat.decoBroken++;
    const MAT = { urn: { mat: 'pottery', size: 1.2 }, coral: { mat: 'coral', size: 1.3 }, lamp: { mat: 'glass', size: 1.5, cols: ['#3FA8A2', '#0E3A3A', '#BFFCF4'], hot: TQ }, bellfrag: { mat: 'iron', size: 1.0, cols: ['#9A7440', '#4A3420', '#D8B070'] } }[d.kind] || { mat: 'stone', size: 1 };
    if (typeof BREAK_FX !== 'undefined') try { BREAK_FX.burst(null, o.x, o.y, Object.assign({ paint: (c2, P2) => decoArt(c2, d, 0, 0, P2, 0), key: 'belk-deco-' + d.kind + (d.v % 3), w: 1.6, h: 2.0, from: from || { x: FX.me.x, y: FX.me.y }, quiet: !!from }, MAT)); } catch (e) { /* (the shared break effect) */ }
    if (d.wet && M && M.fx) M.fx.push({ kind: 'splash', x: o.x, y: o.y, t: 0, life: 0.8, s: 0.8, seed: d.v * 3 }); }

  /* ---------- the camera: the pet, the crab, and the safe ground during a warning, together ---------- */
  function camFocus(FX, m) { const M = FX.mem, me = FX.me, H = FX.H; if (!M || !M.ok) return null;
    if (typeof window !== 'undefined' && window.__BELK_CAM) return { x: m.x + (window.__BELK_CAMX || 0), y: m.y - 1.8 + (window.__BELK_CAMY || 0), k: 1, zoom: window.__BELK_CAM };   // (tests: a close look)
    if (m.dead || M.end) { const u = M.end ? sstep(0, 1.3, M.end.t) - 0.5 * sstep(1.4, 3.2, M.end.t) : 0; return { x: m.x, y: m.y - 1.6, k: 0.75 + 0.15 * u, zoom: 0.55 + 0.17 * u }; }   // (v398 B3: in close as it breaks, easing back as the shards land)
    if (m.act === 'enter' || m.act === 'rise') return { x: lerp(me.x, m.x, 0.6), y: lerp(me.y, m.y, 0.6) - 1.5, k: 0.8, zoom: 0.44 };
    const pts = [[me.x, me.y], [m.x - 2.6, m.y - 3.4], [m.x + 2.6, m.y + 1.2]], A = M.A;
    if (A && A.kind === 'sweep' && A.phase === 'wind') { const s = safeSpot(FX, m, A); pts.push([s.x, s.y]); }
    if (A && A.kind === 'toll' && A.phase === 'wind' && A.ga != null) { const s = gapSpot(FX, A, me); pts.push([s.x, s.y]); }
    if (A && A.kind === 'brood' && A.pts) for (const q of A.pts) pts.push([q.x, q.y]);   // (v398 B3: the summons, framed)
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const W = H.W ? H.W() : 390, Hh = H.H ? H.H() : 844, TS = FX.Tz() / Math.max(0.05, (H.g && H.g.zoom) || 0.6);
    const zoom = Math.max(0.45, Math.min(0.72, (W - 40) / (TS * (x1 - x0 + 2.5)), (Hh - 320) / (TS * (y1 - y0 + 2.5))));
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 + 30 / (TS * zoom), k: 1, zoom }; }

  /* ================= the painting ================= */
  const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`; };
  const gl2 = (c, x, y, r, col, a) => { if (!(r > 0) || !(a > 0.003)) return; if (typeof glowSprite === 'function' && typeof blitSized === 'function') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); } };
  const fg = () => { try { if (typeof window !== 'undefined' && window.__BELK_FX === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const label = (c, s, x, y, size, col, edge) => { c.save(); c.font = `900 ${Math.round(size)}px ${typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = Math.max(3, size * 0.24); c.strokeStyle = edge || 'rgba(4,14,18,.9)'; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); c.restore(); };
  function shieldPath(c, x, y, s) { c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x + s * 0.85, y - s * 0.85, x + s * 0.8, y - s * 0.2); c.quadraticCurveTo(x + s * 0.65, y + s * 0.6, x, y + s); c.quadraticCurveTo(x - s * 0.65, y + s * 0.6, x - s * 0.8, y - s * 0.2); c.quadraticCurveTo(x - s * 0.85, y - s * 0.85, x, y - s); c.closePath(); }
  function clawGlyph(c, x, y, s, col, rot) { c.save(); c.translate(x, y); c.rotate(rot || 0); c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-s * 0.95, s * 0.35); c.quadraticCurveTo(-s * 0.2, s * 0.6, s * 0.3, s * 0.18); c.quadraticCurveTo(s * 1.0, -s * 0.12, s * 0.9, -s * 0.85); c.quadraticCurveTo(s * 0.55, -s * 0.38, s * 0.1, -s * 0.3); c.quadraticCurveTo(s * 0.5, -s * 0.72, s * 0.06, -s * 1.0); c.quadraticCurveTo(-s * 0.55, -s * 0.55, -s * 0.6, -s * 0.05); c.quadraticCurveTo(-s * 0.85, 0, -s * 0.95, s * 0.35); c.closePath();
    c.lineWidth = s * 0.32; c.strokeStyle = 'rgba(4,14,18,.85)'; c.stroke(); c.fillStyle = col; c.fill(); c.restore(); }
  function bellGlyph(c, x, y, s, col) { c.save(); c.translate(x, y); c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-s * 0.8, -s * 0.65); c.quadraticCurveTo(-s * 0.55, s * 0.15, -s * 0.32, s * 0.6); c.lineTo(s * 0.32, s * 0.6); c.quadraticCurveTo(s * 0.55, s * 0.15, s * 0.8, -s * 0.65); c.quadraticCurveTo(0, -s * 0.85, -s * 0.8, -s * 0.65); c.closePath();
    c.lineWidth = s * 0.3; c.strokeStyle = 'rgba(4,14,18,.85)'; c.stroke(); c.fillStyle = col; c.fill();
    c.strokeStyle = 'rgba(4,14,18,.7)'; c.lineWidth = s * 0.1; for (const yy of [-0.25, 0.05, 0.32]) { c.beginPath(); c.moveTo(-s * 0.6 + Math.abs(yy) * 0.2 * s, yy * s); c.lineTo(s * 0.6 - Math.abs(yy) * 0.2 * s, yy * s); c.stroke(); }
    for (const sg of [-1, 1]) { c.strokeStyle = col; c.lineWidth = s * 0.12; c.beginPath(); c.arc(sg * s * 1.05, -s * 0.1, s * 0.35, sg > 0 ? -0.9 : Math.PI - 0.9, sg > 0 ? 0.9 : Math.PI + 0.9); c.stroke(); }
    c.restore(); }
  function chevron(c, x, y, s, rot, col) { c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.moveTo(s * 0.6, 0); c.lineTo(-s * 0.3, -s * 0.55); c.lineTo(-s * 0.05, 0); c.lineTo(-s * 0.3, s * 0.55); c.closePath(); c.fillStyle = 'rgba(4,14,18,.7)'; c.save(); c.translate(1, 1.5); c.fill(); c.restore(); c.fillStyle = col; c.fill(); c.restore(); }
  function countdown(c, x, y, T, left, total, col) { const s = Math.max(1, Math.ceil(left - 1e-6)), fr = left - Math.floor(left), u = cl(1 - left / total), sz = T * (0.95 + 0.25 * fr);
    c.save(); c.lineCap = 'round'; c.fillStyle = 'rgba(4,14,18,.45)'; c.beginPath(); c.arc(x, y, T * 0.95, 0, TAU); c.fill(); c.strokeStyle = 'rgba(4,14,18,.75)'; c.lineWidth = T * 0.24; c.beginPath(); c.arc(x, y, T * 0.95, 0, TAU); c.stroke();
    c.strokeStyle = col; c.lineWidth = T * 0.12; c.beginPath(); c.arc(x, y, T * 0.95, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - u)); c.stroke(); c.restore();
    label(c, String(s), x, y + T * 0.04, sz, '#FFFFFF'); }
  function fanPath(c, X, Y, r0, r1, a0, a1) { c.beginPath(); c.arc(X, Y, r1, a0, a1); c.arc(X, Y, r0, a1, a0, true); c.closePath(); }

  /* ---- the floor (painted once per zoom, world units centred on the arena): water ring, kerb, limestone courses, the font ---- */
  function paintFloor(c, A2) { const R = A2.R, rnd = A2.rnd, D = DRY_R;
    // the water outside the kerb: shallow over sunken flags, deepening outward, caustic lace
    let g = c.createRadialGradient(0, 0, D, 0, 0, R + 1.5); g.addColorStop(0, '#4E9A9C'); g.addColorStop(0.12, '#2F7C84'); g.addColorStop(0.45, '#1B5466'); g.addColorStop(0.8, '#123C52'); g.addColorStop(1, '#0B2636');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(8,30,40,.32)'; c.lineWidth = 0.06; for (let rr = D + 1.0; rr < R + 1.4; rr += 1.3) { c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.stroke(); const n = Math.round(TAU * rr / 1.7), off = hh(rr * 7, 1) * TAU; for (let j = 0; j < n; j++) { const a = off + j / n * TAU; c.beginPath(); c.moveTo(Math.cos(a) * (rr - 1.3), Math.sin(a) * (rr - 1.3)); c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); c.stroke(); } }
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 300; i++) { const a = rnd() * TAU, d = D + 0.45 + rnd() * (R + 1 - D), x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.18 + rnd() * 0.45; c.strokeStyle = `rgba(140,230,225,${(0.05 + rnd() * 0.08).toFixed(3)})`; c.lineWidth = 0.035 + rnd() * 0.04; c.beginPath(); c.ellipse(x, y, r, r * (0.5 + rnd() * 0.4), rnd() * 3, 0, TAU); c.stroke(); } c.restore();
    // the dry floor: grout under limestone courses round the font, each stone its own (world-space) tone and light
    c.save(); c.beginPath(); c.arc(0, 0, D, 0, TAU); c.clip();
    c.fillStyle = '#8E9890'; c.fillRect(-D, -D, D * 2, D * 2);
    const SH = ['#CDD1C1', '#C5CAB9', '#BDC2B1', '#D4D6C7', '#C1C5B4', '#C9CBBB'];
    for (let ci = 0, r0 = FONT + 0.25; r0 < D; ci++) { const w = ci % 3 === 2 ? 0.95 : 1.3, r1 = Math.min(D, r0 + w), rm = (r0 + r1) / 2, n = Math.max(6, Math.round(TAU * rm / (1.4 + hh(ci, 3) * 0.4))), off = hh(ci, 7) * TAU;
      for (let j = 0; j < n; j++) { const a0 = off + j / n * TAU, a1 = off + (j + 1) / n * TAU, hv = hh(ci * 31 + j, 11), hv2 = hh(ci * 17 + j, 13), jg = 0.03 / rm;
        fanPath(c, 0, 0, r0 + 0.03, r1 - 0.03, a0 + jg, a1 - jg); c.fillStyle = SH[Math.floor(hv * SH.length)]; c.fill();
        const am = (a0 + a1) / 2, sx = Math.cos(am) * rm, sy = Math.sin(am) * rm, gg = c.createLinearGradient(sx - 0.8, sy - 0.8, sx + 0.8, sy + 0.8); gg.addColorStop(0, `rgba(255,255,248,${(0.1 + hv2 * 0.1).toFixed(3)})`); gg.addColorStop(1, `rgba(40,50,48,${(0.07 + hv * 0.07).toFixed(3)})`); c.fillStyle = gg; c.fill();
        if (hv2 > 0.84) { c.strokeStyle = 'rgba(70,78,74,.45)'; c.lineWidth = 0.035; c.beginPath(); let a = a0 + (a1 - a0) * 0.3, r = r0 + 0.1; c.moveTo(Math.cos(a) * r, Math.sin(a) * r); for (let k = 0; k < 4; k++) { a += (a1 - a0) * 0.12; r += (r1 - r0) * 0.22; c.lineTo(Math.cos(a + (hh(k, j) - 0.5) * 0.04) * r, Math.sin(a + (hh(k, j) - 0.5) * 0.04) * r); } c.stroke(); }
        if (hv > 0.9) { c.fillStyle = 'rgba(60,70,66,.3)'; c.beginPath(); c.arc(Math.cos(am + 0.05) * (r0 + 0.2), Math.sin(am + 0.05) * (r0 + 0.2), 0.09, 0, TAU); c.fill(); } }
      r0 = r1; }
    // the floor's age: worn pale round the font, damp and darkened toward the kerb, puddles with a sky in them
    g = c.createRadialGradient(0, 0, FONT, 0, 0, FONT + 3.5); g.addColorStop(0, 'rgba(255,255,245,.1)'); g.addColorStop(1, 'rgba(255,255,245,0)'); c.fillStyle = g; c.fillRect(-D, -D, D * 2, D * 2);
    g = c.createRadialGradient(0, 0, D - 2.8, 0, 0, D); g.addColorStop(0, 'rgba(30,52,56,0)'); g.addColorStop(0.7, 'rgba(30,52,56,.14)'); g.addColorStop(1, 'rgba(18,40,46,.42)'); c.fillStyle = g; c.fillRect(-D, -D, D * 2, D * 2);
    for (let i = 0; i < 14; i++) { const a = rnd() * TAU, d = D - 0.6 - rnd() * 2.6, x = Math.cos(a) * d, y = Math.sin(a) * d, rx = 0.4 + rnd() * 0.9, ry = rx * (0.4 + rnd() * 0.3), rot = rnd() * 3; c.fillStyle = 'rgba(34,62,70,.32)'; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); c.fillStyle = 'rgba(200,240,240,.16)'; c.beginPath(); c.ellipse(x - rx * 0.25, y - ry * 0.3, rx * 0.4, ry * 0.25, rot, 0, TAU); c.fill(); }
    for (let i = 0; i < 26; i++) { const a = rnd() * TAU, d = D - 0.25 - rnd() * 0.9, x = Math.cos(a) * d, y = Math.sin(a) * d; for (let k = 0; k < 5; k++) { c.fillStyle = 'rgba(225,225,214,.75)'; c.beginPath(); c.arc(x + (rnd() - 0.5) * 0.35, y + (rnd() - 0.5) * 0.35, 0.04 + rnd() * 0.05, 0, TAU); c.fill(); } }   // (barnacles near the water)
    // the font: a bronze rim round a mosaic of the tide (deep blue, sea teal and turquoise tesserae in a slow spiral wave)
    c.beginPath(); c.arc(0, 0, FONT, 0, TAU); c.fillStyle = '#1C4252'; c.fill();
    for (let r = 0.45; r < FONT - 0.12; r += 0.2) { const n = Math.round(TAU * r / 0.2); for (let j = 0; j < n; j++) { const a = j / n * TAU, w = Math.sin(a * 3 + r * 1.7), x = Math.cos(a) * r, y = Math.sin(a) * r, hv = hh(r * 13, j);
        c.fillStyle = w > 0.55 ? (hv > 0.5 ? '#58BDB6' : '#4AA9A6') : w < -0.45 ? '#133848' : Math.abs(w) < 0.12 ? '#B9C5B8' : (hv > 0.5 ? '#26687A' : '#2E7484'); c.save(); c.translate(x, y); c.rotate(a); c.fillRect(-0.085, -0.085, 0.17, 0.17); c.restore(); } }
    c.strokeStyle = '#3A2C18'; c.lineWidth = 0.3; c.beginPath(); c.arc(0, 0, FONT, 0, TAU); c.stroke(); c.strokeStyle = '#8A6A38'; c.lineWidth = 0.18; c.stroke(); c.strokeStyle = 'rgba(232,200,140,.55)'; c.lineWidth = 0.05; c.beginPath(); c.arc(-0.02, -0.03, FONT - 0.05, 0, TAU); c.stroke();
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; c.fillStyle = 'rgba(30,22,12,.6)'; c.beginPath(); c.arc(Math.cos(a) * FONT + 0.02, Math.sin(a) * FONT + 0.03, 0.06, 0, TAU); c.fill(); c.fillStyle = '#B8925A'; c.beginPath(); c.arc(Math.cos(a) * FONT, Math.sin(a) * FONT, 0.045, 0, TAU); c.fill(); }
    c.fillStyle = '#6A5230'; c.beginPath(); c.arc(0, 0, 0.42, 0, TAU); c.fill(); c.strokeStyle = '#C9A060'; c.lineWidth = 0.05; c.stroke(); c.strokeStyle = 'rgba(232,210,160,.7)'; c.lineWidth = 0.05; c.beginPath(); for (let i = 0; i <= 12; i++) { const x = -0.3 + i * 0.05, y = Math.sin(i * 0.9) * 0.08; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.restore();
    // the kerb: pale bright stone, its top lit, a turquoise inlay, brass studs, the water's foam along its foot
    c.beginPath(); c.arc(0, 0, D + KERB, 0, TAU); c.arc(0, 0, D - 0.04, 0, TAU, true); c.fillStyle = '#E8E7D8'; c.fill('evenodd');
    c.strokeStyle = 'rgba(120,128,118,.55)'; c.lineWidth = 0.04; const nk = Math.round(TAU * D / 1.1); for (let j = 0; j < nk; j++) { const a = j / nk * TAU; c.beginPath(); c.moveTo(Math.cos(a) * D, Math.sin(a) * D); c.lineTo(Math.cos(a) * (D + KERB), Math.sin(a) * (D + KERB)); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,250,.75)'; c.lineWidth = 0.06; c.beginPath(); c.arc(0, 0, D + 0.06, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(40,60,58,.5)'; c.lineWidth = 0.05; c.beginPath(); c.arc(0, 0, D - 0.02, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(97,217,210,.8)'; c.lineWidth = 0.05; c.beginPath(); c.arc(0, 0, D + 0.2, 0, TAU); c.stroke();
    for (let i = 0; i < 36; i++) { const a = (i + 0.5) / 36 * TAU; c.fillStyle = '#B8925A'; c.beginPath(); c.arc(Math.cos(a) * (D + 0.2), Math.sin(a) * (D + 0.2), 0.05, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(8,26,34,.6)'; c.lineWidth = 0.09; c.beginPath(); c.arc(0, 0, D + KERB, 0, TAU); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 90; i++) { const a = rnd() * TAU, d = D + KERB + 0.05 + rnd() * 0.3, l = 0.2 + rnd() * 0.6; c.strokeStyle = `rgba(230,250,250,${(0.12 + rnd() * 0.2).toFixed(3)})`; c.lineWidth = 0.04 + rnd() * 0.05; c.beginPath(); c.arc(0, 0, d, a, a + l / d); c.stroke(); } c.restore();
    // the pillars' footings: a little shade on the floor beside each
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, x = Math.cos(a) * 8.2 + 0.25, y = Math.sin(a) * 8.2 + 0.3, gg = c.createRadialGradient(x, y, 0.2, x, y, 1.3); gg.addColorStop(0, 'rgba(20,34,36,.35)'); gg.addColorStop(1, 'rgba(20,34,36,0)'); c.fillStyle = gg; c.fillRect(x - 1.4, y - 1.4, 2.8, 2.8); }
  }
  /* the night beyond: a purple cloud ceiling, a moon, the tilted tower with its house-sized bell, the sea (painted once, held) */
  function paintSky(c, W, H, T) {
    let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#140D26'); g.addColorStop(0.3, '#1E2246'); g.addColorStop(0.6, '#173A55'); g.addColorStop(1, '#07202C'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = typeof mulberry32 === 'function' ? mulberry32(9191) : Math.random, mx = W * 0.76, my = H * 0.1;
    gl2(c, mx, my, W * 0.32, '#9FE8D8', 0.35); c.fillStyle = 'rgba(232,255,246,.92)'; c.beginPath(); c.arc(mx, my, W * 0.034, 0, TAU); c.fill(); gl2(c, mx, my, W * 0.07, '#E8FFF8', 0.6);
    for (let i = 0; i < 26; i++) { const x = R() * W, y = H * (0.02 + R() * 0.3), rx = W * (0.12 + R() * 0.22), ry = rx * (0.18 + R() * 0.12), near = Math.max(0, 1 - Math.hypot(x - mx, y - my) / (W * 0.5)), gg = c.createRadialGradient(x, y, 1, x, y, rx);
      gg.addColorStop(0, `rgba(${Math.round(70 + 60 * near)},${Math.round(52 + 60 * near)},${Math.round(110 + 50 * near)},.42)`); gg.addColorStop(1, 'rgba(60,44,100,0)'); c.save(); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y); c.fillStyle = gg; c.fillRect(x - rx, y - rx, rx * 2, rx * 2); c.restore(); }
    // the sea under the cloud
    const hz = H * 0.58; g = c.createLinearGradient(0, hz, 0, H); g.addColorStop(0, '#123C52'); g.addColorStop(1, '#061820'); c.fillStyle = g; c.fillRect(0, hz, W, H - hz);
    c.lineCap = 'round'; for (let i = 0; i < 30; i++) { const y = hz + (H - hz) * Math.pow(R(), 0.7), x = R() * W, l = W * (0.04 + R() * 0.12); c.strokeStyle = `rgba(140,220,210,${(0.04 + R() * 0.08).toFixed(3)})`; c.lineWidth = 1 + R() * 2; c.beginPath(); c.moveTo(x - l, y); c.quadraticCurveTo(x, y - 3, x + l, y); c.stroke(); }
    // the tilted tower and its great bell, a few turquoise lights in it
    c.save(); c.translate(W * 0.17, hz + H * 0.02); c.rotate(-0.13); const tw = W * 0.13, th = H * 0.44;
    c.fillStyle = '#071822'; c.beginPath(); c.moveTo(-tw / 2, 0); c.lineTo(-tw * 0.44, -th); c.lineTo(0, -th - tw * 0.5); c.lineTo(tw * 0.44, -th); c.lineTo(tw / 2, 0); c.closePath(); c.fill();
    c.fillStyle = '#030B10'; c.beginPath(); c.moveTo(-tw * 0.3, -th * 0.55); c.lineTo(-tw * 0.3, -th * 0.8); c.quadraticCurveTo(0, -th * 0.95, tw * 0.3, -th * 0.8); c.lineTo(tw * 0.3, -th * 0.55); c.closePath(); c.fill();
    c.fillStyle = '#2A2418'; c.beginPath(); c.moveTo(-tw * 0.1, -th * 0.84); c.quadraticCurveTo(-tw * 0.2, -th * 0.66, -tw * 0.27, -th * 0.58); c.lineTo(tw * 0.27, -th * 0.58); c.quadraticCurveTo(tw * 0.2, -th * 0.66, tw * 0.1, -th * 0.84); c.closePath(); c.fill(); c.strokeStyle = 'rgba(97,217,210,.35)'; c.lineWidth = 1.5; c.stroke();
    for (let i = 0; i < 5; i++) gl2(c, (R() - 0.5) * tw * 0.7, -th * (0.15 + R() * 0.35), 4 + R() * 4, '#61D9D2', 0.6);
    c.restore(); }
  /* the water breathes: slow bright swells running round the ring, glints, the kerb's inlay pulsing */
  function drawOverlay(c, FX, t, T) { const C = FX.C, X0 = FX.sx(C.x), Y0 = FX.sy(C.y), lf = lowFx();
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (let i = 0; i < (lf ? 3 : 7); i++) { const a0 = i / 7 * TAU + t * (0.05 + 0.015 * i) * (i % 2 ? 1 : -1), rr = (DRY_R + 0.95 + (i % 3) * 0.7) * T; c.strokeStyle = `rgba(150,235,230,${(0.07 + 0.05 * Math.sin(t * 0.8 + i)).toFixed(3)})`; c.lineWidth = T * 0.16; c.beginPath(); c.arc(X0, Y0, rr, a0, a0 + 0.8); c.stroke(); }
    if (!lf) for (let i = 0; i < 16; i++) { const a = hh(i, 61) * TAU + t * 0.02, rr = (DRY_R + 0.7 + hh(i, 63) * 2.4) * T, k = Math.max(0, Math.sin(t * (1.3 + hh(i, 65)) + i * 2.1)); if (k > 0.75) gl2(c, X0 + Math.cos(a) * rr, Y0 + Math.sin(a) * rr, T * 0.35, '#DFFFFA', (k - 0.75) * 2); }
    c.strokeStyle = `rgba(97,217,210,${(0.12 + 0.08 * Math.sin(t * 1.2)).toFixed(3)})`; c.lineWidth = T * 0.12; c.beginPath(); c.arc(X0, Y0, (DRY_R + 0.2) * T, 0, TAU); c.stroke();
    c.restore();
    drawGroundFx(c, FX, t, T); }   // (v398 B3: the floor's light of the attacks, under everything standing)
  /* ---- the props: a pillar (the GPU picture, kept; or its 2D picture), its lamp's light; the fallen crab ---- */
  function drawPropArt(c, FX, p, X, Y, T, t) { const M = FX.mem || {};
    if (p.kind === 'corpse') { if (FX.m) paintBoss(c, FX, FX.m, FX.sx(FX.m.x), FX.sy(FX.m.y), T, t); return; }
    if (p.kind !== 'pillar') return; const me = FX.me, behind = me && Math.abs(me.x - p.x) < 1.0 && me.y < p.y && p.y - me.y < 1.9;
    c.save(); if (behind) c.globalAlpha = 0.5;
    const ok = MODEL.drawProp(c, 'pillar', p.x, p.y, 0, { T, sx: FX.sx, sy: FX.sy, glow: 1, kind: 1, wet: 0.6, seed: 0.3 + p.i * 0.17 });
    if (!ok) pillar2D(c, X, Y, T);
    c.restore();
    const ly = Y - 1.58 * ZK * T, k = 0.75 + 0.25 * Math.sin(t * 1.7 + p.i * 1.9); gl2(c, X, ly, T * 1.5, TQ, 0.35 * k); gl2(c, X, ly, T * 0.45, '#E8FFFA', 0.5 * k); void M; }
  function pillar2D(c, X, Y, T) { const w = 0.47 * T, h = 1.31 * ZK * T, d = w * GY;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(X + T * 0.1, Y + T * 0.08, w * 1.5, w * 0.7, 0, 0, TAU); c.fill();
    let g = c.createLinearGradient(X - w, 0, X + w, 0); g.addColorStop(0, '#DAD9CA'); g.addColorStop(0.6, '#BFC0B0'); g.addColorStop(1, '#8E9286'); c.fillStyle = g; c.fillRect(X - w, Y - h, w * 2, h);
    g = c.createLinearGradient(0, Y - h * 0.4, 0, Y); g.addColorStop(0, 'rgba(10,20,22,0)'); g.addColorStop(1, 'rgba(10,20,22,.85)'); c.fillStyle = g; c.fillRect(X - w, Y - h * 0.45, w * 2, h * 0.45);
    c.fillStyle = '#E4E3D4'; c.fillRect(X - w * 1.25, Y - h - d * 0.6, w * 2.5, d * 0.9); c.strokeStyle = 'rgba(30,40,40,.6)'; c.lineWidth = 1; c.strokeRect(X - w * 1.25, Y - h - d * 0.6, w * 2.5, d * 0.9);
    c.fillStyle = '#61D9D2'; c.beginPath(); c.arc(X, Y - h - T * 0.25, T * 0.14, 0, TAU); c.fill(); }
  /* ---- dressing (2D pictures, feet at (X, Y), T px a tile; BREAK_FX cuts its pieces from the same picture) ---- */
  function decoArt(c, d, X, Y, T, t) { c.save(); c.translate(X, Y); const s = T; c.lineJoin = 'round';
    if (d.wet) { c.fillStyle = 'rgba(6,30,40,.35)'; c.beginPath(); c.ellipse(0, 0, s * 0.6, s * 0.24, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(190,245,240,.45)'; c.lineWidth = Math.max(1, s * 0.03); c.beginPath(); c.ellipse(0, 0, s * (0.5 + 0.06 * Math.sin((t || 0) * 2 + d.v)), s * 0.2, 0, 0, TAU); c.stroke(); }
    else { c.fillStyle = 'rgba(10,20,22,.3)'; c.beginPath(); c.ellipse(s * 0.06, s * 0.03, s * 0.55, s * 0.2, 0, 0, TAU); c.fill(); }
    { const BP = typeof window !== 'undefined' && window.BELPROPS, k = { urn: ['urn', 1], coral: ['belcoral', 0.42], lamp: ['lamppost', 0.55], bellfrag: ['bellfrag', 1] }[d.kind] || ['bellfrag', 1];   // v392 PR: the repainted dressing (20n9), its lamp's light kept; the old 2D only where that is off
      if (BP && BP.draw(c, k[0], d.v % 4, d.kind === 'lamp' ? -s * 0.1 * k[1] : 0, 0, s, { s: k[1] })) { if (d.kind === 'lamp') gl2(c, 0, -s * 1.3, s * 0.9, TQ, 0.35 * (0.75 + 0.25 * Math.sin((t || 0) * 2.3 + d.v))); c.restore(); return; } }
    if (d.kind === 'urn') { const g = c.createLinearGradient(-s * 0.35, 0, s * 0.35, 0); g.addColorStop(0, '#8A4C34'); g.addColorStop(0.4, '#C9825B'); g.addColorStop(1, '#5E3222'); c.fillStyle = g;
      c.beginPath(); c.moveTo(-s * 0.13, -s * 1.02); c.quadraticCurveTo(-s * 0.16, -s * 0.85, -s * 0.34, -s * 0.66); c.quadraticCurveTo(-s * 0.44, -s * 0.3, -s * 0.2, -s * 0.05); c.lineTo(s * 0.2, -s * 0.05); c.quadraticCurveTo(s * 0.44, -s * 0.3, s * 0.34, -s * 0.66); c.quadraticCurveTo(s * 0.16, -s * 0.85, s * 0.13, -s * 1.02); c.closePath(); c.fill(); c.strokeStyle = 'rgba(40,16,10,.85)'; c.lineWidth = Math.max(1, s * 0.04); c.stroke();
      c.fillStyle = '#B06A48'; c.fillRect(-s * 0.17, -s * 1.08, s * 0.34, s * 0.08); c.strokeRect(-s * 0.17, -s * 1.08, s * 0.34, s * 0.08);
      c.strokeStyle = '#6A3A26'; c.lineWidth = Math.max(1.5, s * 0.05); for (const sg of [-1, 1]) { c.beginPath(); c.arc(sg * s * 0.27, -s * 0.84, s * 0.1, sg > 0 ? -1.4 : Math.PI - 1.4, sg > 0 ? 1.2 : Math.PI + 1.2); c.stroke(); }
      c.strokeStyle = 'rgba(240,220,190,.35)'; c.lineWidth = Math.max(1, s * 0.03); c.beginPath(); c.moveTo(-s * 0.3, -s * 0.48); c.quadraticCurveTo(0, -s * 0.42, s * 0.3, -s * 0.48); c.stroke();
      for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(232,230,220,.85)'; c.beginPath(); c.arc((hh(i, d.v) - 0.5) * s * 0.55, -s * (0.1 + hh(d.v, i) * 0.4), s * (0.025 + hh(i, 2) * 0.025), 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(255,240,220,.4)'; c.beginPath(); c.ellipse(-s * 0.15, -s * 0.6, s * 0.06, s * 0.16, 0.2, 0, TAU); c.fill(); }
    else if (d.kind === 'coral') { const br = (x0, y0, a, L, w, n) => { if (n <= 0 || L < s * 0.08) return; const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L; c.strokeStyle = 'rgba(60,40,50,.7)'; c.lineWidth = w + 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = n % 2 ? '#EADBD2' : '#F2C9C2'; c.lineWidth = w; c.stroke(); br(x1, y1, a - 0.45 - hh(n, d.v) * 0.2, L * 0.72, w * 0.72, n - 1); br(x1, y1, a + 0.4 + hh(d.v, n) * 0.2, L * 0.68, w * 0.7, n - 1); };
      c.lineCap = 'round'; br(0, -s * 0.02, -Math.PI / 2 - 0.2, s * 0.38, s * 0.14, 4); br(s * 0.12, -s * 0.02, -Math.PI / 2 + 0.35, s * 0.3, s * 0.11, 3); }
    else if (d.kind === 'lamp') { c.fillStyle = '#5A4424'; c.fillRect(-s * 0.06, -s * 1.0, s * 0.12, s * 1.0); c.strokeStyle = '#2A1E10'; c.lineWidth = Math.max(1, s * 0.03); c.strokeRect(-s * 0.06, -s * 1.0, s * 0.12, s * 1.0); c.fillStyle = '#8A6A38'; c.fillRect(-s * 0.16, -s * 1.05, s * 0.32, s * 0.07);
      const k = 0.75 + 0.25 * Math.sin((t || 0) * 2.3 + d.v); gl2(c, 0, -s * 1.3, s * 0.9, TQ, 0.35 * k); const g = c.createRadialGradient(-s * 0.06, -s * 1.36, 1, 0, -s * 1.3, s * 0.22); g.addColorStop(0, '#F0FFFC'); g.addColorStop(0.5, '#61D9D2'); g.addColorStop(1, '#1E6E6C'); c.fillStyle = g; c.beginPath(); c.arc(0, -s * 1.3, s * 0.22, 0, TAU); c.fill(); c.strokeStyle = '#3A2C18'; c.lineWidth = Math.max(1, s * 0.04); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.2, -s * 1.3); c.lineTo(s * 0.2, -s * 1.3); c.moveTo(0, -s * 1.52); c.lineTo(0, -s * 1.08); c.stroke(); }
    else { /* a broken hand-bell lying on its side, its clapper beside it */ c.save(); c.rotate(-0.35); const g = c.createLinearGradient(0, -s * 0.6, 0, 0); g.addColorStop(0, '#B08A50'); g.addColorStop(0.5, '#7A5A30'); g.addColorStop(1, '#3E2C16'); c.fillStyle = g;
      c.beginPath(); c.moveTo(-s * 0.45, -s * 0.05); c.quadraticCurveTo(-s * 0.4, -s * 0.5, -s * 0.05, -s * 0.62); c.quadraticCurveTo(s * 0.3, -s * 0.55, s * 0.4, -s * 0.15); c.lineTo(s * 0.18, -s * 0.22); c.lineTo(s * 0.08, -s * 0.08); c.lineTo(-s * 0.1, -s * 0.16); c.closePath(); c.fill(); c.strokeStyle = 'rgba(30,20,10,.85)'; c.lineWidth = Math.max(1, s * 0.04); c.stroke();
      c.fillStyle = 'rgba(80,150,120,.5)'; c.beginPath(); c.ellipse(-s * 0.15, -s * 0.38, s * 0.12, s * 0.06, -0.3, 0, TAU); c.fill(); c.strokeStyle = 'rgba(232,200,140,.6)'; c.lineWidth = Math.max(1, s * 0.03); c.beginPath(); c.moveTo(-s * 0.36, -s * 0.3); c.quadraticCurveTo(-s * 0.05, -s * 0.5, s * 0.3, -s * 0.32); c.stroke(); c.restore();
      c.fillStyle = '#4A3820'; c.beginPath(); c.ellipse(s * 0.42, -s * 0.06, s * 0.1, s * 0.07, 0, 0, TAU); c.fill(); }
    c.restore(); }
  /* the bell's own 2D picture (BREAK_FX cuts the shattering pieces from it): mouth up, bands, verdigris, the crack; feet at (0, 0) */
  function bellPaint2D(c, P) { const y0 = -(BZ + BELL_Z) * ZK * P, y1 = y0 - BH * ZK * P, r0 = 0.82 * P, r1 = 1.54 * P;
    const g = c.createLinearGradient(-r1, 0, r1, 0); g.addColorStop(0, '#2C2014'); g.addColorStop(0.35, '#9A7040'); g.addColorStop(0.55, '#B8884C'); g.addColorStop(0.8, '#5A3E22'); g.addColorStop(1, '#22180E'); c.fillStyle = g;
    c.beginPath(); c.moveTo(-r0, y0); c.bezierCurveTo(-r0 * 1.05, y0 + (y1 - y0) * 0.5, -r1 * 0.85, y1 + (y0 - y1) * 0.15, -r1, y1); c.lineTo(r1, y1); c.bezierCurveTo(r1 * 0.85, y1 + (y0 - y1) * 0.15, r0 * 1.05, y0 + (y1 - y0) * 0.5, r0, y0); c.ellipse(0, y0, r0, r0 * GY * 0.6, 0, 0, Math.PI); c.closePath(); c.fill(); c.strokeStyle = 'rgba(20,12,6,.9)'; c.lineWidth = Math.max(1, P * 0.05); c.stroke();
    for (const b of BANDS) { const y = lerp(y0, y1, b), r = roOf(b) * P; c.strokeStyle = 'rgba(20,12,6,.8)'; c.lineWidth = P * 0.14; c.beginPath(); c.ellipse(0, y, r, r * GY * 0.55, 0, 0, Math.PI); c.stroke(); c.strokeStyle = '#C9A060'; c.lineWidth = P * 0.07; c.stroke(); }
    c.fillStyle = 'rgba(80,150,120,.45)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse((hh(i, 1) - 0.5) * r1 * 1.4, lerp(y0, y1, hh(i, 2)), P * 0.25, P * 0.12, 0, 0, TAU); c.fill(); }
    c.fillStyle = '#0B1216'; c.beginPath(); c.ellipse(0, y1, r1 * 0.9, r1 * GY * 0.55 * 0.9, 0, 0, TAU); c.fill(); c.strokeStyle = '#D7B072'; c.lineWidth = P * 0.06; c.beginPath(); c.ellipse(0, y1, r1, r1 * GY * 0.55, 0, 0, TAU); c.stroke();
    c.strokeStyle = '#0A0806'; c.lineWidth = P * 0.08; c.beginPath(); c.moveTo(-r1 * 0.3, y1); c.lineTo(-r1 * 0.22, lerp(y1, y0, 0.3)); c.lineTo(-r1 * 0.3, lerp(y1, y0, 0.55)); c.lineTo(-r1 * 0.2, lerp(y1, y0, 0.72)); c.stroke(); }

  /* ==== (v398 B3) the effects at the model's fidelity: everything on the shared FGFX painter (soft, layered, no hard edges),
     in two passes a frame: the FLOOR'S LIGHT (drawn from the arena's overlay, under everything standing: the warnings, the
     ring, splash rings and ripples) and the UPPER pass (drawFx: the claw's light and ribbon, the bell's resonance, spray,
     droplets, the summons, the fall). Each pass: soft dark under-layers first (so the light reads on the pale stone), one GPU
     pass of light, the symbols and words last. Without the GPU painter each piece has a plain 2D stand-in. ==== */
  function kit(c, Q, T) { const lf = lowFx();
    const K = { Q, lf,
      glow(x, y, r, col, a, sy) { if (!(a > 0.004) || !(r > 0.5)) return; if (Q) Q.glow(x, y, r, col, a, sy); else gl2(c, x, y, r, col, a * 0.6); },
      ring(x, y, r, col, a, w, sy) { if (!(a > 0.004) || !(r > 0.5)) return; if (Q) Q.ring(x, y, r, col, a, w, sy); else { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = hexA(col, a * 0.6); c.lineWidth = Math.max(1, w); c.beginPath(); c.ellipse(x, y, r, r * (sy || 1), 0, 0, TAU); c.stroke(); c.restore(); } },
      beam(x0, y0, x1, y1, w, col, a, a0, a1) { if (!(a > 0.004)) return; a0 = a0 == null ? 1 : a0; a1 = a1 == null ? 1 : a1; if (Q) Q.rbeam(x0, y0, x1, y1, w, col, a, a0, a1); else { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, hexA(col, a * a0 * 0.55)); g.addColorStop(1, hexA(col, a * a1 * 0.55)); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = g; c.lineWidth = w * 1.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore(); } },
      ebeam(x0, y0, x1, y1, w, col, heat, a, seed) { if (!(a > 0.004)) return; if (Q) Q.ebeam(x0, y0, x1, y1, w, col, heat, a, seed, 3); else K.beam(x0, y0, x1, y1, w * 0.8, col, a); },
      spray(x, y, r, a, seed, col, spread) { if (!(a > 0.004)) return; if (Q) Q.spray(x, y, r, col || '#DFFBFF', a, seed, spread == null ? 0.5 : spread, 0.8); else gl2(c, x, y - r * 0.3, r, col || '#DFFBFF', a * 0.45); },
      ripple(x, y, r, col, a, seed, sy, th) { if (!(a > 0.004)) return; if (Q) Q.ripple(x, y, r, col, a, seed, sy, th); else K.ring(x, y, r, col, a * 0.6, Math.max(1, T * 0.06), sy); },
      wring(x, y, rx, ry, col, a, side, th, seed, spin) { if (!(a > 0.004) || !(rx > 1)) return; if (Q) Q.wring(x, y, rx, ry, 0, col, a, side, th, seed, spin); else { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = hexA(col, a * 0.55); c.lineWidth = Math.max(1, rx * (th || 0.06)); c.beginPath(); c.ellipse(x, y, rx * 0.8, ry * 0.8, 0, side === 0 ? Math.PI : 0, side === 1 ? Math.PI : TAU); c.stroke(); c.restore(); } },
      star(x, y, s, a, col) { if (!(a > 0.004)) return; if (Q) Q.star(x, y, s, a, col); else gl2(c, x, y, s * 0.6, col || '#FFF6D8', a * 0.7); },
      smoke(x, y, r, a, seed, col) { if (!(a > 0.004)) return; if (Q) Q.smoke(x, y, r, a, seed, col || '#B8BCA8', 0.5); else gl2(c, x, y, r, col || '#B8BCA8', a * 0.3); },
      bubbles(x, y, rx, ry, a, seed, rise) { if (Q && !lf && a > 0.004) Q.bubbles(x, y, rx, ry, '#9FE8FF', a, seed, rise); },
      shimmer(x, y, r, a, sy) { if (Q && !lf && a > 0.004) Q.shimmer(x, y, r, a, sy, '#BFFCF4'); },
      stream(x0, y0, x1, y1, w, a, seed) { if (!(a > 0.004)) return; if (Q) Q.wstream(x0, y0, x1, y1, w, '#7FD8E0', a, seed, 3); else K.beam(x0, y0, x1, y1, w, '#BFF4F0', a * 0.8); } };
    return K; }
  // a soft line: the same path stroked wide and faint, then narrower and stronger (an edge with no hard step)
  function softPath(c, path, layers) { for (const [w, col] of layers) { path(); c.lineWidth = Math.max(1, w); c.strokeStyle = col; c.stroke(); } }
  // links of light round an arc (screen centre X, Y, radius R, angles b0..b1); a link whose middle lies outside the arena is left out
  function arcLinks(K, FX, z, R, b0, b1, n, fn) { const X = FX.sx(z.x), Y = FX.sy(z.y), T = FX.Tz(), C = FX.C, st = (b1 - b0) / n;
    for (let i = 0; i < n; i++) { const p0 = b0 + st * (i - 0.13), p1 = b0 + st * (i + 1.13), pm = b0 + st * (i + 0.5);   // (each link overlapping its neighbours by the fifth its ends fade over: the chain sums to one, no beads) if (Math.hypot(z.x + Math.cos(pm) * R / T - C.x, z.y + Math.sin(pm) * R / T - C.y) > AR + 0.7) continue;
      fn(X + Math.cos(p0) * R, Y + Math.sin(p0) * R, X + Math.cos(p1) * R, Y + Math.sin(p1) * R, i); } }
  const GROUND = { sweep: 1, slam: 1, toll: 1, splash: 1, geyser: 1, shatter: 1, reso: 1 };
  function drawGroundFx(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !M.ok || !m || !M.fx) return; const hz = FX.S.hz, ws = hz.find(z => z.kind === 'belkSweepWarn'), wt = hz.find(z => z.kind === 'belkTollWarn'), rings = hz.filter(z => z.kind === 'belkRing'), gfx = M.fx.filter(f => GROUND[f.kind]);
    if (!ws && !wt && !rings.length && !gfx.length) return;
    const layer = (n, K) => { if (ws) sweepGround(c, FX, ws, T, t, K, n); if (wt) tollGround(c, FX, wt, T, t, K, n); for (const z of rings) ringGround(c, FX, z, T, t, K, n); };
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; layer(0, null);
    for (const f of gfx) if (f.kind === 'sweep') { const sp = TM.swSpread, u = cl(f.t / f.life), k0 = ease(Math.min(1, u * 1.6)), e = 1 - u, aa = f.a + sp - 2 * sp * k0, X = FX.sx(f.x), Y = FX.sy(f.y), R = T * 3.7, n = 8, st = (f.a + sp - aa) / n;   // (the swept ground's body under its light: steps of a soft warm shade, darkest at the head)
      if (k0 > 0.03) for (let i = 0; i < n; i++) for (const [w, al] of [[T * 2.2, 0.06], [T * 1.3, 0.1]]) { c.beginPath(); c.arc(X, Y, R, aa + st * i, aa + st * (i + 1.02)); c.lineCap = 'butt'; c.strokeStyle = `rgba(70,22,10,${(al * e * (1 - i / n)).toFixed(3)})`; c.lineWidth = w; c.stroke(); } }
    c.restore();
    const F = fg(), Q = F ? F.begin(c, null) : null, K = kit(c, Q, T);
    try { layer(1, K); for (const f of gfx) groundOne(FX, f, T, t, K); } finally { if (Q) F.flush(c); }
    c.save(); layer(2, null); c.restore(); }
  /* Bell Sweep's warning: the cone a soft warm wash deepening as the count runs out and filling from the big claw's side, its
     rim and edges glowing links of light, a glow running ahead across it the way the claw will go; the SAFE ground behind the
     small claw a soft mint lane; then the claw, the chevrons and the shield */
  function sweepGround(c, FX, z, T, t, K, layer) { const A = z.A; if (!A || (A.phase !== 'wind' && A.phase !== 'strike') || !FX.m || FX.m.dead) return;
    const X = FX.sx(z.x), Y = FX.sy(z.y), L = TM.swLen * T, sp = TM.swSpread, a0 = A.a - sp, a1 = A.a + sp, u = A.phase === 'wind' ? cl(A.t / TM.swWind) : 1, r0 = T * 1.5, pulse = 0.5 + 0.5 * Math.sin(t * (6 + 10 * u)), sa = safeAng(A), w = 0.62, s0 = 2.3 * T, s1 = 6.6 * T, af = a1 - 2 * sp * u;
    if (layer === 0) {
      let g = c.createRadialGradient(X, Y, r0 * 0.5, X, Y, L * 1.06); g.addColorStop(0, 'rgba(60,14,8,0)'); g.addColorStop(0.3, `rgba(60,14,8,${(0.24 + 0.1 * u).toFixed(3)})`); g.addColorStop(0.88, `rgba(60,14,8,${(0.34 + 0.12 * u).toFixed(3)})`); g.addColorStop(1, 'rgba(60,14,8,0)');
      fanPath(c, X, Y, r0 * 0.5, L * 1.06, a0, a1); c.fillStyle = g; c.fill();
      g = c.createRadialGradient(X, Y, r0, X, Y, L); g.addColorStop(0, hexA(WARN, 0)); g.addColorStop(0.2, hexA(WARN, 0.1 + 0.1 * u)); g.addColorStop(0.55, hexA(WARN, 0.2 + 0.18 * u)); g.addColorStop(0.95, hexA(WARN, 0.26 + 0.22 * u)); g.addColorStop(1, hexA(WARN, 0));
      fanPath(c, X, Y, r0, L, af, a1); c.fillStyle = g; c.fill();
      softPath(c, () => fanPath(c, X, Y, r0, L, a0, a1), [[T * 0.75, 'rgba(30,8,4,.06)'], [T * 0.45, 'rgba(30,8,4,.1)'], [T * 0.24, 'rgba(30,8,4,.16)']]);
      g = c.createRadialGradient(X, Y, s0 * 0.8, X, Y, s1 * 1.05); g.addColorStop(0, hexA(SAFE_M, 0)); g.addColorStop(0.35, hexA(SAFE_M, 0.2)); g.addColorStop(0.85, hexA(SAFE_M, 0.22)); g.addColorStop(1, hexA(SAFE_M, 0));
      fanPath(c, X, Y, s0 * 0.8, s1 * 1.05, sa - w, sa + w); c.fillStyle = g; c.fill();
      softPath(c, () => fanPath(c, X, Y, s0, s1, sa - w, sa + w), [[T * 0.5, 'rgba(4,30,22,.06)'], [T * 0.26, 'rgba(4,30,22,.12)']]); return; }
    if (layer === 1) { const n = K.lf ? 10 : 18, al = 0.5 + 0.4 * u * (0.7 + 0.3 * pulse);
      arcLinks(K, FX, z, L, a0, a1, n, (x0, y0, x1, y1, i) => { K.beam(x0, y0, x1, y1, T * 0.5, WARN, al * 0.35); K.ebeam(x0, y0, x1, y1, T * 0.16, WARN_HI, 0.75, al, i * 0.7 + 3); });
      for (const b of [a0, a1]) { K.beam(X + Math.cos(b) * r0, Y + Math.sin(b) * r0, X + Math.cos(b) * L, Y + Math.sin(b) * L, T * 0.45, WARN, 0.3 * al, 0.15, 1); K.beam(X + Math.cos(b) * r0, Y + Math.sin(b) * r0, X + Math.cos(b) * L, Y + Math.sin(b) * L, T * 0.14, WARN_HI, al, 0.2, 1); }
      K.beam(X + Math.cos(af) * r0, Y + Math.sin(af) * r0, X + Math.cos(af) * L, Y + Math.sin(af) * L, T * 0.7, WARN, 0.3 + 0.3 * u, 0.1, 0.9);   // (the front: where the sweep has reached in its count)
      arcLinks(K, FX, z, s1, sa - w, sa + w, K.lf ? 5 : 9, (x0, y0, x1, y1) => { K.beam(x0, y0, x1, y1, T * 0.42, SAFE_M, 0.3); K.beam(x0, y0, x1, y1, T * 0.15, SAFE, 0.7 + 0.25 * pulse); });
      for (const b of [sa - w, sa + w]) { const x0 = X + Math.cos(b) * s0, y0 = Y + Math.sin(b) * s0, x1 = X + Math.cos(b) * s1, y1 = Y + Math.sin(b) * s1; K.beam(x0, y0, x1, y1, T * 0.42, SAFE_M, 0.3, 0.3, 1); K.beam(x0, y0, x1, y1, T * 0.15, SAFE, 0.8, 0.3, 1); }
      K.glow(X + Math.cos(sa) * T * 4.3, Y + Math.sin(sa) * T * 4.3, T * 2.4, SAFE_M, 0.22 + 0.1 * pulse); return; }
    for (let i = 0; i < 5; i++) { const f = (i / 5 + t * 0.45) % 1, a = a1 - f * 2 * sp, rr = L * 0.84; chevron(c, X + Math.cos(a) * rr, Y + Math.sin(a) * rr, T * 0.32, a - Math.PI / 2, hexA(WARN_HI, (0.45 + 0.4 * u) * Math.sin(Math.PI * f))); }
    clawGlyph(c, X + Math.cos(A.a) * T * 4.1, Y + Math.sin(A.a) * T * 4.1, T * 0.62, WARN_HI, A.a);
    const sx = X + Math.cos(sa) * T * 4.3, sy = Y + Math.sin(sa) * T * 4.3, ss = T * 0.6; shieldPath(c, sx, sy, ss); c.fillStyle = hexA(SAFE_D, 0.85); c.fill(); c.lineWidth = Math.max(1.5, T * 0.07); c.strokeStyle = SAFE; c.stroke();
    c.strokeStyle = SAFE; c.lineWidth = Math.max(1.5, T * 0.08); c.lineCap = 'round'; c.beginPath(); c.moveTo(sx - ss * 0.35, sy); c.lineTo(sx - ss * 0.05, sy + ss * 0.3); c.lineTo(sx + ss * 0.4, sy - ss * 0.3); c.stroke();
    label(c, 'SAFE', sx, sy + ss * 1.6, T * 0.44, SAFE); }
  /* Tolling Shell's warning: the coming ring rippling out as soft light (the water stirring, refraction-like rings), the bell's
     inner ring bright, the OPENING a mint lane of light out of it; then OPEN, chevrons and the bell */
  function tollGround(c, FX, z, T, t, K, layer) { const A = z.A; if (!A || A.phase !== 'wind' || A.ga == null || !FX.m || FX.m.dead) return; const C = FX.C;
    const X = FX.sx(z.x), Y = FX.sy(z.y), u = cl(A.t / TM.tollWind), r0 = TM.ringR0 * T, rMax = Math.min((Math.hypot(z.x - C.x, z.y - C.y) + AR) * T, 16 * T), g0 = A.ga - TM.gap, g1 = A.ga + TM.gap, pulse = 0.5 + 0.5 * Math.sin(t * (5 + 10 * u));
    if (layer === 0) { softPath(c, () => { c.beginPath(); c.arc(X, Y, r0 + T * 0.3, g1, g0 + TAU); }, [[T * 0.7, 'rgba(30,8,4,.06)'], [T * 0.4, 'rgba(30,8,4,.1)'], [T * 0.22, 'rgba(30,8,4,.16)']]);
      const g = c.createRadialGradient(X, Y, r0 * 0.8, X, Y, rMax); g.addColorStop(0, hexA(SAFE_M, 0)); g.addColorStop(0.12, hexA(SAFE_M, 0.1 + 0.08 * u)); g.addColorStop(0.7, hexA(SAFE_M, 0.1 + 0.06 * u)); g.addColorStop(1, hexA(SAFE_M, 0)); fanPath(c, X, Y, r0 * 0.8, rMax, g0, g1); c.fillStyle = g; c.fill(); return; }
    if (layer === 1) { const n = K.lf ? 14 : 26;
      for (let i = 0; i < (K.lf ? 2 : 3); i++) { const f = (i / 3 + t * 0.35) % 1, rr = r0 + f * (rMax - r0), fa = Math.sin(Math.PI * f) * (0.25 + 0.4 * u); arcLinks(K, FX, z, rr, g1 + 0.04, g0 + TAU - 0.04, n, (x0, y0, x1, y1) => K.beam(x0, y0, x1, y1, T * 0.22, WARN, fa)); }
      arcLinks(K, FX, z, r0 + T * 0.3, g1 + 0.04, g0 + TAU - 0.04, n, (x0, y0, x1, y1, i) => { K.beam(x0, y0, x1, y1, T * 0.5, WARN, 0.25 + 0.25 * u); K.ebeam(x0, y0, x1, y1, T * 0.15, WARN_HI, 0.8, 0.6 + 0.35 * u * pulse, i * 0.9); });
      for (let i = 0; i < (K.lf ? 1 : 3); i++) { const f = (i / 3 + t * 0.5) % 1; K.ripple(X, Y, T * (1.6 + f * 3.4), '#DFFFFA', 0.3 * Math.sin(Math.PI * f) * (0.4 + 0.6 * u), i * 2.3, 1, 0.08); }   // (the water stirring round the bell: a refraction-like wavering)
      const ex = X + Math.cos(A.ga) * rMax, ey = Y + Math.sin(A.ga) * rMax, bx = X + Math.cos(A.ga) * r0, by = Y + Math.sin(A.ga) * r0;
      K.beam(bx, by, ex, ey, Math.max(T * 0.6, (rMax * 0.5) * Math.sin(TM.gap) * 0.9), SAFE_M, 0.22 + 0.12 * pulse, 0.9, 0.05); K.beam(bx, by, ex, ey, T * 0.2, SAFE, 0.55 + 0.3 * pulse, 1, 0.1);
      for (const b of [g0, g1]) K.beam(X + Math.cos(b) * r0, Y + Math.sin(b) * r0, X + Math.cos(b) * rMax, Y + Math.sin(b) * rMax, T * 0.12, SAFE, 0.45, 0.9, 0.05);
      K.glow(bx, by, T * 1.4, SAFE_M, 0.35 + 0.2 * pulse); return; }
    for (let i = 0; i < 4; i++) { const f = (i / 4 + t * 0.5) % 1, rr = r0 + T * 1.2 + f * T * 7.5; chevron(c, X + Math.cos(A.ga) * rr, Y + Math.sin(A.ga) * rr, T * 0.34, A.ga, hexA(SAFE, (0.5 + 0.45 * (1 - f)) * Math.sin(Math.PI * Math.min(1, f * 1.3)))); }
    label(c, 'OPEN', X + Math.cos(A.ga) * T * 5.2, Y + Math.sin(A.ga) * T * 5.2, T * 0.5, SAFE);
    bellGlyph(c, X + Math.cos(A.ga + Math.PI) * T * 3.4, Y + Math.sin(A.ga + Math.PI) * T * 3.4, T * 0.55, '#FFE9B8'); }
  /* the ring itself: a soft dark band under it, then layered light: a warm halo, a turquoise-white crest of energy, a bright
     leading edge; the opening glowing mint, a lane of light through it; its ends soft (no cut) */
  function ringGround(c, FX, z, T, t, K, layer) { const X = FX.sx(z.x), Y = FX.sy(z.y), r = z.r * T, w = TM.ringW * T; if (r < 2) return; const e = Math.min(0.2, (w * 0.5) / r), b0 = z.ga + TM.gap + e, b1 = z.ga - TM.gap + TAU - e;
    if (layer === 0) { const C = FX.C; c.save(); c.beginPath(); c.arc(FX.sx(C.x), FX.sy(C.y), (AR + 0.6) * T, 0, TAU); c.clip(); softPath(c, () => { c.beginPath(); c.arc(X, Y, r, b0, b1); }, [[w * 2.4, 'rgba(40,10,6,.07)'], [w * 1.6, 'rgba(40,10,6,.12)'], [w * 1.0, 'rgba(40,10,6,.2)']]); c.restore(); return; }
    if (layer === 1) { const n = Math.max(10, Math.min(K.lf ? 26 : 48, Math.round((b1 - b0) * r / (T * 0.9))));
      arcLinks(K, FX, z, r, b0, b1, n, (x0, y0, x1, y1, i) => { K.beam(x0, y0, x1, y1, w * 0.95, WARN, 0.5); K.ebeam(x0, y0, x1, y1, w * 0.36, TQ_HI, 0.85, 0.85, i * 0.6 + z.r, 3); });
      if (!K.lf) arcLinks(K, FX, z, r + w * 0.38, b0, b1, Math.round(n * 0.6), (x0, y0, x1, y1) => K.beam(x0, y0, x1, y1, w * 0.1, '#FFFFFF', 0.6));
      // the opening: mint light at its two ends, a lane of light out through it
      const pul = 0.75 + 0.25 * Math.sin(t * 8); for (const sg of [-1, 1]) { const a = z.ga + sg * TM.gap, x = X + Math.cos(a) * r, y = Y + Math.sin(a) * r; K.glow(x, y, w * 1.7, SAFE_M, 0.8 * pul); K.glow(x, y, w * 0.5, '#FFFFFF', 0.6); }
      const ia = z.ga, ri = Math.max(0, r - w * 2.2), ro = r + w * 2.2; K.beam(X + Math.cos(ia) * ri, Y + Math.sin(ia) * ri, X + Math.cos(ia) * r, Y + Math.sin(ia) * r, r * Math.sin(TM.gap) * 0.85, SAFE_M, 0.3 * pul, 0, 1); K.beam(X + Math.cos(ia) * r, Y + Math.sin(ia) * r, X + Math.cos(ia) * ro, Y + Math.sin(ia) * ro, r * Math.sin(TM.gap) * 0.85, SAFE_M, 0.3 * pul, 1, 0); return; }
    label(c, 'OPEN', X + Math.cos(z.ga) * r, Y + Math.sin(z.ga) * r, T * 0.42, SAFE); }
  /* the floor's part of a passing effect */
  function groundOne(FX, f, T, t, K) { const u = cl(f.t / f.life), X = FX.sx(f.x == null ? FX.m.x : f.x), Y = FX.sy(f.y == null ? FX.m.y : f.y);
    if (f.kind === 'sweep') { const sp = TM.swSpread, k0 = ease(Math.min(1, u * 1.6)), e = 1 - u, n = K.lf ? 6 : 12, aa = f.a + sp - 2 * sp * k0;   // (the swept ground: a streak of light along the claw's path, brightest at its head)
      if (k0 > 0.03) arcLinks(K, FX, f, T * 3.7, aa, f.a + sp, n, (x0, y0, x1, y1, i) => { const a0 = 1 - i / n, a1 = 1 - (i + 1) / n; K.beam(x0, y0, x1, y1, T * 1.2, WARN, 0.32 * e, a0, a1); K.beam(x0, y0, x1, y1, T * 0.4, '#FFF2E0', 0.6 * e, a0, a1); }); }
    else if (f.kind === 'slam') { for (let i = 0; i < (K.lf ? 2 : 3); i++) { const uu = cl(u * 1.4 - i * 0.12); K.ring(X, Y, T * (0.5 + uu * (2.6 + i)), i ? TQ_HI : '#FFFFFF', 0.6 * (1 - uu), T * (0.35 - i * 0.08), 1); } K.ripple(X, Y, T * (0.8 + u * 3.4), '#E8FFFA', 0.55 * (1 - u), f.seed, 1, 0.1); K.glow(X, Y, T * 2.2 * (1 - u * 0.5), '#FFF2E0', 0.4 * (1 - u)); if (f.wet) K.wring(X, Y, T * (1 + u * 2.6), T * (1 + u * 2.6), TQ_HI, 0.5 * (1 - u), 2, 0.08, f.seed, 1); }
    else if (f.kind === 'toll') { for (let i = 0; i < (K.lf ? 2 : 4); i++) { const uu = cl(u * 1.3 - i * 0.1); K.ring(X, Y, T * (1.5 + uu * (3 + i)), i % 2 ? TQ : '#E8FFFA', 0.38 * (1 - uu), T * (0.42 - i * 0.07), 1); } K.ripple(X, Y, T * (2 + u * 6), '#DFFFFA', 0.45 * (1 - u), 4.4, 1, 0.12); K.wring(X, Y, T * (2.2 + u * 4), T * (2.2 + u * 4), TQ, 0.4 * (1 - u), 2, 0.05, 2.2, 1.4); }
    else if (f.kind === 'reso') { K.ripple(X, Y, T * (1.8 + u * 2.4), '#DFFFFA', 0.28 * (1 - u) * (f.big ? 1.6 : 1), f.t * 3, 1, 0.08); }
    else if (f.kind === 'splash') { const s = f.s || 1; K.ripple(X, Y, T * s * (0.4 + u * 1.9), '#BFF4F0', 0.55 * (1 - u), f.seed, 0.6, 0.1); }
    else if (f.kind === 'geyser') { for (let i = 0; i < 2; i++) { const uu = cl(u * 1.2 - i * 0.2); K.ripple(X, Y, T * (0.6 + uu * 2.6), '#DFFFFA', 0.6 * (1 - uu), f.seed + i, 0.6, 0.12); } K.wring(X, Y, T * 1.4, T * 0.84, TQ_HI, 0.5 * Math.sin(Math.PI * u), 2, 0.1, f.seed, 2); }
    else if (f.kind === 'shatter') { for (let i = 0; i < (K.lf ? 2 : 4); i++) { const uu = cl(u * 1.15 - i * 0.14); K.ring(X, Y, T * (1 + uu * (6 + i * 2)), i % 2 ? TQ : '#E8FFFA', 0.6 * (1 - uu), T * 0.32, 1); } K.ripple(X, Y, T * (1.5 + u * 8), '#DFFFFA', 0.5 * (1 - u), 9.9, 1, 0.14); } }

  /* ---- the boss: the model, then its lights laid over (the eye, the bands' light, the photophores) ---- */
  function demoMem(FX, m) { const M = FX.mem || (FX.mem = {}); if (!M.ok) { M.P = Object.assign(blankPose(), M.P || {}); if (M.th == null) M.th = Math.PI / 2 + 0.3; M.bt = M.bt || 2.0; M.fx = M.fx || []; M.demo = 1; } return M; }
  function paintBoss(c, FX, m, X, Y, T, t) { const started = FX.S && FX.S.started && FX.mem && FX.mem.ok, M = started ? FX.mem : demoMem(FX, m); if (!M.P) return;
    const o = { T, sx: v => X + (v - m.x) * T, sy: v => Y + (v - m.y) * T, t: M.bt || t, R: started && M.R && M.Rt === M.bt ? M.R : null };
    if (!MODEL.__dbg.gl) { legacy2D(c, FX, m, M, X, Y, T, t); return; }
    const R = MODEL.draw(c, m.x, m.y, headOf(M.th == null ? Math.PI / 2 : M.th), M.P, o); if (!R) { legacy2D(c, FX, m, M, X, Y, T, t); return; } if (started) { M.R = R; M.Rt = M.bt; }
    lights(c, o, m, M, T, R); }
  /* without the GPU: the Belfry's existing 2D Kharrox (DunBoss 'kharrox', 20n), driven by this fight (its acts name the
     same poses: 'sweep' raises its big claw, 'toll' shivers its bands); the mechanics and warnings are the same */
  function legacy2D(c, FX, m, M, X, Y, T, t) { const B = typeof BOSSES !== 'undefined' ? BOSSES.find(q => q.id === 'kharrox') : null; if (!B || typeof DunBoss === 'undefined') return;
    const A = M.A, E = M.end, al = E ? 1 - cl((E.t - 1.25) * 2.5) : 1; if (al <= 0.01) return;
    const act = A ? (A.kind === 'sweep' ? (A.phase === 'wind' ? 'sweep' : 'swing') : A.kind === 'toll' ? (A.phase === 'wind' || A.phase === 'ring' ? 'toll' : 'rest') : A.kind) : 'idle';
    const q = M.px2d || (M.px2d = { bk: B, phase: 1 }); Object.assign(q, { x: m.x, y: m.y, act, actT: A ? A.t : 0, hp: m.hp, maxhp: m.maxhp, flash: m.flash || 0, under: false, glow: B.glow, r: 2.0 });
    const r = T * 2.0; c.save(); c.globalAlpha = al; c.fillStyle = 'rgba(6,20,26,.35)'; c.beginPath(); c.ellipse(X, Y, r * 1.25, r * 0.45, 0, 0, TAU); c.fill();
    try { DunBoss.draw(c, q, X, Y - r * 0.45, r, t, FX.me, FX.sx, FX.sy, T, true); } catch (e) { /* (nothing drawn) */ } c.restore(); }
  function lights(c, o, m, M, T, R) { const P = M.P, live = 1 - cl(P.dead || 0); if (!R) return; const a = headOf(M.th == null ? Math.PI / 2 : M.th), at = n => { const q = anchorOf(R, n, m.x, m.y, a); return q ? [o.sx(q.x), o.sy(q.y) - q.z * ZK * T] : null; };
    const e = at('eye'), eg = (P.eyeGlow || 0) * live; if (e && eg > 0.02) { gl2(c, e[0], e[1], T * (0.55 + 0.35 * eg), TQ, 0.35 * Math.min(1.5, eg)); gl2(c, e[0], e[1], T * 0.2, '#E8FFFA', 0.4 * Math.min(1.2, eg)); }
    const tg = (P.tollGlow || 0) * live; if (tg > 0.08 && !lowFx()) for (let b = 0; b < 3; b++) { const q = at('band' + b); if (q) gl2(c, q[0], q[1], T * (1.5 + 0.35 * b), TQ, 0.1 * tg); } }

  /* ---- (v398 B3) the effects over everything: the great claw's light and its ribbon of motion, the bell's resonance (soft
     rings round its bands, a shimmer), droplets lifting off the floor, the sweep's spray and sparks, the slam's burst, the
     summoning (a column of light out of the bell, geysers where the crawlers rise), the fall (rays out of the bell, then the
     shattering); then the countdowns and the arrows to safety ---- */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !M.ok || !m) return; const F = fg(), Q = F ? F.begin(c, null) : null, K = kit(c, Q, T), lf = K.lf, me = FX.me, P = M.P || {};
    try {
      const at = n => { const q = anc(FX, m, n); return [FX.sx(q.x), FX.sy(q.y) - q.z * ZK * T]; }, live = 1 - cl(P.dead || 0);
      // the great claw's tell: light gathering round it, a few motes circling it
      const cg = cl((P.clawGlow || 0) / 1.4) * live; if (cg > 0.04 && !m.dead) { const p = at('clawL'), pu = 0.85 + 0.15 * Math.sin(t * 14);
        K.glow(p[0], p[1], T * (1.1 + 1.5 * cg), WARN, 0.4 * cg * pu, 0.8); K.glow(p[0], p[1], T * (0.45 + 0.45 * cg), '#FFF2E0', 0.42 * cg * pu);
        if (!lf) for (let i = 0; i < 4; i++) { const a = t * (2.6 + 0.7 * i) + i * 1.6, rr = T * (0.65 + 0.28 * i) * (1.2 - 0.3 * cg); K.star(p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr * 0.6, T * 0.3 * (0.4 + cg), 0.55 * cg * (0.55 + 0.45 * Math.sin(t * 9 + i * 2)), '#FFE2CC'); } }
      // the claw's ribbon of motion: three layers (a wide soft white, turquoise, a thin hot core), fading with age, every link
      // ramped to its neighbours so the chain has no beads or steps
      const tr = M.trail; if (tr && tr.length > 1) { const pt = q => [FX.sx(q.x), FX.sy(q.y) - q.z * ZK * T], fo = q => { const a = cl((M.bt - q.t) / 0.52); return 1 - a * a * a; }, st = tr.length > 12 ? 2 : 1;
        ribbonUnder(c, tr.filter(q => fo(q) > 0.02).map(pt), T);   // (a soft deep-teal body under its light: added light alone is lost on the pale stone)
        for (let i = st; i < tr.length; i += st) { const q0 = tr[i - st], q1 = tr[i], a0 = fo(q0), a1 = fo(q1); if (a0 + a1 < 0.02) continue; const [x0, y0] = pt(q0), [x1, y1] = pt(q1);
          K.beam(x0, y0, x1, y1, T * 1.8, TQ, 0.42, a0 * a0, a1 * a1); K.beam(x0, y0, x1, y1, T * 0.95, TQ_HI, 0.6, a0, a1); K.beam(x0, y0, x1, y1, T * 0.3, '#FFFFFF', 0.95, a0, a1); } }
      // the bell's resonance while it gathers its toll (and while it calls its brood): soft rings round its bands, its light swelling
      const A = M.A, tg = cl(P.tollGlow || 0) * live; if (tg > 0.1 && !m.dead) { const b = at('bell'), k = 0.5 + 0.5 * Math.sin(t * 22);
        for (let i = 0; i < 3; i++) { const q = at('band' + i), rx = (roOf(BANDS[i]) + 0.12) * T * (1.25 + 0.08 * k), ry = rx * 0.42; K.wring(q[0], q[1], rx, ry, TQ_HI, 0.4 * tg * (0.7 + 0.3 * k), 1, 0.07, i * 2.1, 2); if (!lf) K.wring(q[0], q[1], rx * 1.15, ry * 1.15, TQ, 0.22 * tg, 0, 0.05, i * 3.7, -1.5); }
        K.glow(b[0], b[1], T * (2.4 + 0.4 * k), TQ, 0.16 * tg); K.shimmer(b[0], b[1], T * 2.6, 0.22 * tg, 0.8); }
      // droplets lifting off the floor (the toll's pull, the fall)
      for (const d of M.drops) { const u = d.t / d.life, al = Math.sin(Math.PI * cl(u)) * 0.8, x = FX.sx(d.x), y = FX.sy(d.y) - d.z * ZK * T; K.glow(x, y, T * 0.28, '#BFF4F0', al * 0.55); if (!lf) K.star(x, y, T * 0.16, al, '#F0FFFC'); }
      for (const f of M.fx) upperOne(c, FX, m, f, T, t, K, at);
      // the live ring's water: spray thrown up where it runs over the water, its crest catching the light on the stone
      for (const z of FX.S.hz) { if (z.kind !== 'belkRing') continue; const X = FX.sx(z.x), Y = FX.sy(z.y), n = lf ? 12 : 26, C = FX.C;
        for (let i = 0; i < n; i++) { const aa = z.ga + TM.gap + (i + 0.5) / n * (TAU - 2 * TM.gap), wx = z.x + Math.cos(aa) * z.r, wy = z.y + Math.sin(aa) * z.r, dC = Math.hypot(wx - C.x, wy - C.y); if (dC > AR + 0.6) continue;
          const x = X + Math.cos(aa) * z.r * T, y = Y + Math.sin(aa) * z.r * T; if (dC > DRY_R + 0.2) K.spray(x, y, T * 0.85, 0.6, i * 1.7 + z.r); else if (i % 2 === 0) K.glow(x, y - T * 0.2, T * 0.8, TQ_HI, 0.18); } }
    } finally { if (Q) F.flush(c); }
    // the countdowns over the warnings, and the arrow to safety when the pet is in harm's way
    const A = M.A, at = n => { const q = anc(FX, m, n); return [FX.sx(q.x), FX.sy(q.y) - q.z * ZK * T]; };
    if (A && A.kind === 'sweep' && A.phase === 'wind') { const cx = FX.sx(m.x + Math.cos(A.a) * 2.6), cy = FX.sy(m.y + Math.sin(A.a) * 2.6) - T * 2.6; countdown(c, cx, cy, T, TM.swWind - A.t, TM.swWind, WARN_HI);
      if (inSweep(FX, A, me.x, me.y, me.r)) arrowTo(c, FX, me, safeSpot(FX, m, A), T, 'BEHIND THE SMALL CLAW'); }
    if (A && A.kind === 'toll' && A.phase === 'wind') { const b = at('bellTop'); countdown(c, b[0], b[1] - T * 1.5, T, TM.tollWind - A.t, TM.tollWind, TQ_HI);
      if (!inGap(A, me.x, me.y)) arrowTo(c, FX, me, gapSpot(FX, A, me), T, 'TO THE OPENING'); } }
  /* (v398 B3) the ribbon's body: one smooth path through the claw's points, stroked soft and layered, fading toward its old end */
  function ribbonUnder(c, P, T) { if (P.length < 2) return; const A = P[0], B = P[P.length - 1]; if (Math.hypot(B[0] - A[0], B[1] - A[1]) < 2) return;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    for (const [w, al] of [[T * 1.9, 0.12], [T * 1.2, 0.2], [T * 0.6, 0.3]]) { const g = c.createLinearGradient(A[0], A[1], B[0], B[1]); g.addColorStop(0, 'rgba(8,52,62,0)'); g.addColorStop(0.55, `rgba(8,52,62,${(al * 0.6).toFixed(3)})`); g.addColorStop(1, `rgba(8,52,62,${al})`);
      c.beginPath(); c.moveTo(A[0], A[1]); for (let i = 1; i < P.length - 1; i++) c.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2); c.lineTo(B[0], B[1]); c.strokeStyle = g; c.lineWidth = w; c.stroke(); }
    c.restore(); }
  /* one passing effect's part above the floor */
  function upperOne(c, FX, m, f, T, t, K, at) { const u = cl(f.t / f.life), env = Math.sin(Math.PI * Math.min(1, u * 1.2)), lf = K.lf, X = FX.sx(f.x == null ? m.x : f.x), Y = FX.sy(f.y == null ? m.y : f.y);
    if (f.kind === 'reso') { const b = at('bell'), n = f.big ? 3 : 2; for (let i = 0; i < n; i++) { const uu = cl(u * 1.2 - i * 0.18); if (uu <= 0) continue; const rx = T * (1.6 + uu * (2.4 + i * 1.2)); K.wring(b[0], b[1], rx, rx * 0.42, TQ_HI, 0.5 * (1 - uu), 2, 0.06, i * 1.3 + 0.4, 1.5); } K.glow(b[0], b[1], T * 2.2, TQ, 0.22 * (1 - u)); }
    else if (f.kind === 'toll') { const b = at('bell'); K.glow(b[0], b[1], T * 3.4 * (1 - u * 0.4), TQ_HI, 0.6 * (1 - u)); K.glow(b[0], b[1], T * 1.2, '#FFFFFF', 0.5 * (1 - u) * (1 - u));
      for (let i = 0; i < (lf ? 1 : 3); i++) { const uu = cl(u * 1.4 - i * 0.15), rx = T * (1.8 + uu * (3 + i)); K.wring(b[0], b[1], rx, rx * 0.42, i ? TQ : '#E8FFFA', 0.6 * (1 - uu), 2, 0.07, i * 2.9, 2); }
      K.shimmer(b[0], b[1] + T * 0.5, T * 3.2 * (0.6 + u), 0.35 * (1 - u), 0.6); K.bubbles(X, Y - T * 0.6, T * 2.4, T * 1.3, 0.5 * (1 - u), 3.3, 1.2); }
    else if (f.kind === 'sweep') { const sp = TM.swSpread, k0 = Math.min(1, u * 1.6), aa = f.a + sp - 2 * sp * ease(k0);
      for (let i = 0; i < (lf ? 3 : 7); i++) { const k = i / 7, b = f.a + sp - 2 * sp * k0 * (1 - k * 0.25), rr = T * (3.3 + 1.8 * hh(i, f.seed)), x = X + Math.cos(b) * rr, y = Y + Math.sin(b) * rr; K.spray(x, y - T * 0.15, T * (0.85 + 0.45 * k), 0.7 * env * (1 - k * 0.5), f.seed + i, null, 0.65); }
      if (!lf) for (let i = 0; i < 8; i++) { const b = aa + (hh(i, f.seed + 1) - 0.5) * 0.5, rr = T * (3 + 2.4 * hh(f.seed, i)), lift = T * (0.4 + 1.6 * hh(i, 3)) * env; K.star(X + Math.cos(b) * rr, Y + Math.sin(b) * rr - lift, T * 0.28, 0.8 * env * (1 - u), i % 2 ? '#FFF2DC' : '#BFFCF4'); }
      K.glow(X + Math.cos(aa) * T * 3.6, Y + Math.sin(aa) * T * 3.6, T * (1.2 + u * 1.4), '#FFF2E0', 0.35 * (1 - u)); }
    else if (f.kind === 'slam') { const e = 1 - u; K.glow(X, Y - T * 0.3, T * (1.6 + u * 1.2), '#FFFFFF', 0.55 * e * e); K.glow(X, Y - T * 0.2, T * 2.6, WARN, 0.22 * e);
      for (let i = 0; i < (lf ? 2 : 5); i++) { const a = -Math.PI / 2 + (hh(i, f.seed) - 0.5) * 2.2; K.spray(X + Math.cos(a) * T * 0.6 * u, Y - T * (0.3 + 1.3 * u) * hh(i, 5), T * (0.8 + 0.6 * u), (f.wet ? 0.75 : 0.45) * e, f.seed + i * 3, f.wet ? null : '#E8E6D8', 0.8); }
      K.smoke(X, Y - T * (0.3 + 0.6 * u), T * (0.8 + 1.1 * u), 0.35 * e, f.seed, f.wet ? '#C8E6E4' : '#B8BCA8'); }
    else if (f.kind === 'splash') { const s = f.s || 1; K.spray(X, Y, T * s * (0.65 + u * 0.8), 0.75 * (1 - u), f.seed); }
    else if (f.kind === 'dust') { K.smoke(X, Y - T * 0.2, T * (0.6 + u), 0.4 * (1 - u), f.seed); }
    else if (f.kind === 'summon') { const b = at('bellTop'), up = sstep(0, 0.35, f.t), dn = 1 - sstep(f.life - 0.6, f.life, f.t), al = up * dn, H = T * (6 + 3 * up);
      K.beam(b[0], b[1], b[0], b[1] - H, T * (1.3 + 0.4 * Math.sin(t * 9)), TQ, 0.4 * al, 0.9, 0); K.beam(b[0], b[1], b[0], b[1] - H * 0.8, T * 0.45, '#F0FFFC', 0.7 * al, 1, 0);
      K.glow(b[0], b[1], T * 2.6, TQ_HI, 0.35 * al);
      for (let i = 0; i < (lf ? 1 : 3); i++) { const uu = (f.t * 0.9 + i / 3) % 1, rx = T * (1.6 + uu * 4); K.wring(b[0], b[1] - H * 0.3 * uu, rx, rx * 0.4, TQ_HI, 0.45 * al * (1 - uu), 2, 0.05, i * 1.9, 1.5); }
      K.shimmer(b[0], b[1] - T, T * 3, 0.25 * al, 1.2); }
    else if (f.kind === 'geyser') { const up = sstep(0, 0.25, f.t), dn = 1 - sstep(f.life * 0.55, f.life, f.t), h = T * (2.6 + 1.6 * up) * (0.4 + 0.6 * up), al = up * dn;
      K.stream(X, Y, X, Y - h, T * 0.7 * (0.6 + 0.4 * dn), 0.75 * al, f.seed); K.beam(X, Y, X, Y - h * 1.05, T * 0.55, '#E8FFFA', 0.6 * al, 1, 0.15); K.glow(X, Y - T * 0.3, T * 1.9, TQ_HI, 0.35 * al);   // (its white heart, so it reads over the water) K.spray(X, Y - h, T * 1.3, 0.7 * al, f.seed + 1, null, 0.9); K.spray(X, Y - T * 0.1, T * 1.1, 0.55 * al, f.seed + 2, null, 0.6);
      K.bubbles(X, Y - h * 0.5, T * 0.9, h * 0.55, 0.45 * al, f.seed, 1.6); K.glow(X, Y - h * 0.4, T * 1.6, TQ, 0.2 * al); }
    else if (f.kind === 'dying') { const b = at('bell'), g = sstep(0, 1, u), fl = 0.75 + 0.25 * Math.sin(t * 31);
      for (let i = 0; i < (lf ? 4 : 8); i++) { const a = i / 8 * TAU + 0.3 + 0.15 * Math.sin(t * 2 + i), L = T * (1.4 + 3.4 * g) * (0.7 + 0.3 * hh(i, 8)); K.beam(b[0], b[1], b[0] + Math.cos(a) * L, b[1] + Math.sin(a) * L * 0.7, T * (0.22 + 0.25 * g), TQ_HI, 0.55 * g * fl, 1, 0); }
      K.glow(b[0], b[1], T * (1.6 + 2.2 * g), TQ_HI, 0.5 * g); K.glow(b[0], b[1], T * 0.7, '#FFFFFF', 0.6 * g * fl); K.shimmer(b[0], b[1], T * 3.4, 0.35 * g, 0.8); }
    else if (f.kind === 'shatter') { const b = at('bellBase'), e = 1 - u, by = b[1] - T * 0.8;
      K.glow(b[0], by, T * (3 + 3 * u), TQ_HI, 0.75 * e); K.glow(b[0], by, T * 1.4, '#FFFFFF', 0.8 * e * e * e);
      for (let i = 0; i < (lf ? 5 : 12); i++) { const a = i / 12 * TAU + hh(i, 4) * 0.4, L = T * (2 + 7 * sstep(0, 0.45, u)) * (0.6 + 0.4 * hh(i, 6)); K.beam(b[0], by, b[0] + Math.cos(a) * L, by + Math.sin(a) * L * 0.65, T * 0.3 * (0.5 + e), i % 2 ? TQ_HI : '#FFFFFF', 0.6 * e, 1, 0); }
      for (let i = 0; i < (lf ? 1 : 3); i++) { const uu = cl(u * 1.5 - i * 0.12), rx = T * (2 + uu * (5 + 2 * i)); K.wring(b[0], by, rx, rx * 0.45, i % 2 ? TQ : '#E8FFFA', 0.55 * (1 - uu), 2, 0.06, i * 2.3 + 1, 2); }
      const cu = sstep(0, 0.2, f.t) * (1 - sstep(0.5, 1.6, f.t)); K.stream(b[0], b[1], b[0], b[1] - T * 5 * cu, T * 1.1, 0.6 * cu, 9.1); K.spray(b[0], b[1] - T * 5 * cu, T * 2, 0.65 * cu, 9.3, null, 1);
      K.bubbles(b[0], b[1] - T, T * 2.6, T * 2, 0.6 * e, 7.7, 1.4); K.smoke(b[0], b[1] - T * (0.5 + u), T * (1.5 + 2 * u), 0.35 * e, 9.9, '#C8E6E4'); } }
  function arrowTo(c, FX, me, p, T, txt) { const px = FX.sx(me.x), py = FX.sy(me.y) - T * 1.9, a = Math.atan2(p.y - me.y, p.x - me.x);
    c.save(); c.translate(px, py); c.rotate(a); c.fillStyle = hexA(SAFE, 0.92); c.strokeStyle = 'rgba(0,30,20,.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(T * 0.6, 0); c.lineTo(-T * 0.1, -T * 0.34); c.lineTo(-T * 0.1, -T * 0.13); c.lineTo(-T * 0.48, -T * 0.13); c.lineTo(-T * 0.48, T * 0.13); c.lineTo(-T * 0.1, T * 0.13); c.lineTo(-T * 0.1, T * 0.34); c.closePath(); c.fill(); c.stroke(); c.restore();
    label(c, txt, px, py - T * 0.62, T * 0.3, SAFE); }

  /* ================= the stage (the rift's boss stage: FIEND_DEFS.belkharrox.stageMake) ================= */
  /* make(X, self, H): the stage module: the arena's centre, and the pointer (the safe side in a Bell Sweep, the opening in a
     Tolling Shell) for the rift's hint arrow */
  function make(X, self, H) { const FC = X.M && X.M.FC, C = FC ? { x: FC.x, y: FC.y, R: FC.R } : { x: X.M.MW / 2, y: X.M.MH / 2, R: AR };
    const mod = { C, ARENA,
      hint() { const F = STAGE && STAGE.FX, M = F && F.mem; if (!M || !M.ok || !M.A || !F.m || F.m.dead) return null; const A = M.A, me = X.me;
        if (A.kind === 'sweep' && A.phase === 'wind' && inSweep(F, A, me.x, me.y, me.r)) return safeSpot(F, F.m, A);
        if (A.kind === 'toll' && A.phase === 'wind' && A.ga != null && !inGap(A, me.x, me.y)) return gapSpot(F, A, me);
        return null; } };
    STAGE = { g: X.g, X, mod, FX: null }; return mod; }
  def.make = make; def.MODEL = MODEL; def.TM = TM; def.TUNE = TUNE; def.ARENA = ARENA;
  // (tests: start an act now)
  def.force = (FX, k) => { const M = FX.mem, m = FX.m; endAct(FX, m, true); m.stunT = 0; if (m.act === 'rise' || m.act === 'enter') m.act = 'fight'; begin(FX, m, k); };
  return { MODEL, def, make, ARENA, TUNE, TM, test: { inSweep, inSafe, safeSpot, inGap, gapSpot, safeAng, bigSide, begin, endAct, modOf } };
})();
/* Kharrox's health and blows in absolute terms (the 6/7/9-bar convention: six bars), for the floor its stage plays as in
   whichever rift holds a 'belkharrox' boss stage (the Belfry; else a test rift); see CAL_BOSS_HPK (20zz6) */
function BEL_BOSS_K(id, kind) { try { const T = BELK.TUNE; let Rf = RIFT_BY_ID.belfry, i = Rf && Rf.stages ? Rf.stages.findIndex(s => s.boss === id) : -1;
  if (i < 0) for (const R of RIFTS) { const j = R.stages ? R.stages.findIndex(s => s.boss === id) : -1; if (j >= 0) { Rf = R; i = j; break; } }
  const n = i >= 0 ? Math.max(1, (Rf.lvl || 1) + (riftStagePos(Rf, i).sec - 1) * 3) : 10, E = i >= 0 ? ((Rf.ease || 1) * (Rf.scale || 1)) : 1;
  if (kind === 'hp') { const lo = n < 50 ? Math.min(1, Math.max(0, (n - 10) / 30)) : -1, hk = n >= 50 ? Math.min(1, (n - 50) / Math.max(10, TOWER_TOP - 50)) : -1, more = hk >= 0 ? Math.round(30 + 20 * hk) : Math.round(10 + 15 * lo); return (T.bars + 0.2) / (Math.round(n / 5) + 2 + more); }
  const F = floorDef(n), hit = n < 50 ? 1.3 : 1.5, lvK = 1 + (n / 10 - 1) * 0.06; return T.dmg / (15 * F.dmgMul * E * 1.25 * 1.1 * lvK * hit); } catch (e) { return kind === 'hp' ? 0.4 : 0.5; } }
/* the roster */
(() => { const entry = { id: 'belkharrox', name: 'Kharrox', title: 'The Bellback', color: '#2A3A44', glow: '#61D9D2', accent: '#E8C68A', biome: typeof BIOMES === 'undefined' ? 'swamp' : BIOMES.belbapt ? 'belbapt' : BIOMES.belfry ? 'belfry' : 'swamp', r: 2.4, els: ['water', 'dark'], phases: 2, cuts: [1, 0.5], belHard: 5,
    get hpK() { return BEL_BOSS_K('belkharrox', 'hp'); }, get dmgK() { return BEL_BOSS_K('belkharrox', 'dmg'); } };
  RiftFiend.define(entry, BELK.def); BELK.def.stageMake = BELK.make; BELK.def.bossMake = BELK.make;   /* (the Belfry's bossStage() looks for bossMake) */ BELK.def.BELK = BELK; })();
