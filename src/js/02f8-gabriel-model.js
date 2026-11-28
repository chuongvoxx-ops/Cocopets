/* ---------- (v475 GM) Gabriel, The Sacred Oracle: the Virgo Anima (Zodiac Anima No. 06) as a real 3D model on GLM ----------
   A biomechanical celestial chimera after the user's concept sheet (kept out of the repo): a colossal white-and-gold mechanical phoenix
   whose open chest holds the Heart of Eden, a heart-shaped crystal chamber in which the Bound Oracle floats, chained by the wrists, waist and
   lower body; behind it a halo of rotating rings carrying the Twelve Petals of Mercy.
   - the phoenix: an upright pearl-ceramic torso shingled in feather plates, open at the front round the heart; an S-neck of plated
     vertebrae; a crested head (white and gold facial armour, a hooked beak with a hinged mandible, rose-pink eyes, a forehead heart, a
     crest of swept-back metal feather-blades); two colossal wings (a gold shoulder mechanism, three armoured bones with gold actuators and
     joints, heart crystal nodes, layered feather-blades of white metal with rose-crystal blades among them, each blade on its own spring);
     two avian legs (feathered thighs, armoured shanks, gold talons) that fold in flight; a fan of segmented tail feathers and long silk
     ribbons (spline ribbons rebuilt every frame) ending in heart pendants.
   - the Heart of Eden: two gold arches tracing a heart (each in three articulated segments that separate), an inner rose-gold rail and
     struts, a faceted rose-quartz heart behind the oracle, two see-through crystal lobes in front that open like doors, chest armour plates
     round the rim that unfold like petals, gyroscopic containment rings, a lotus under the oracle, heart locks and rotating seals.
   - the Bound Oracle: its own hierarchy (a mechanical lower body rooted in the lotus, a slender porcelain torso with a heart crystal, a
     masked faceless head with a pink eye slit and forehead heart, a crown whose spikes unfold into a halo, two arms solved from named poses
     or raw angles with articulated fingers, ribbon hair); gold cuffs with heart locks on its wrists, waist and lower body, chains swinging
     to the arches, pink energy bindings.
   - the halo: a runed main ring, a rose-gold inner ring with heart studs, an outer filigree ring (L7), twelve sockets; the Twelve Petals
     (a white ceramic blade in a gold frame with a heart crystal and a gold root; two side vanes that unfold into a lotus petal), each
     placed by the moves (home in its slot or free in the world). Petals far from the body are drawn in their own small pass.
   Forms (k 1 base, 2 level 4, 3 level 7): The Bound Seraph, The Heart of Mercy, Eden Incarnate. Materials GLM 980..993 (20k5uz GB-MAT).
   Everything is procedural geometry built once in idle-time slices; posed every frame from the pose state S the moves own (api.md in the
   GM notes); the model keeps its springs on S._gb. Real-GPU WebGL only (window.__GB_GL = 1 / __NG_GL = 1 force it on a software
   rasteriser for the tests; __GB_GL = 0 turns it off): without it AnimaArt draws the 2D Gabriel (02f2 MODELS.virgo). */
const GABRIEL_GL = (() => {
  const { sin, cos, max, min, pow, hypot, ceil, floor, abs, round, exp, atan2, sqrt, sign } = Math, TAU = Math.PI * 2, EL = 0.62, SE = sin(EL), CE = cos(EL), PI = Math.PI;
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => hypot(a[0], a[1], a[2]), norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const hash = n => { const s = sin(n * 127.1 + 311.7) * 43758.5453; return s - floor(s); };
  const se = (c, p) => sign(c) * pow(abs(c), 2 / p);
  const RH = RAZIEL_GL.H, { plate, strip, sweep, latheZ, gem, bring, f1, f2, fa, ik, visBox, hold, bz, axisR, frameZ, colsR, mm, mv, rx, ry, rz, scl3 } = RH;
  const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1], MY = [1, 0, 0, 0, -1, 0, 0, 0, 1], WS = 0.1;
  const MT = { CER: 980, GOLD: 981, PLAT: 982, QTZ: 983, CH: 984, EYE: 985, FTH: 986, POR: 987, RIB: 988, LIT: 989, RUNE: 990, CLAW: 991, MOTE: 993, ceramic: 980, gold: 981, roseGold: 981.2, platinum: 982, quartz: 983, quartzShell: 983.3, conduit: 984, blade: 986, crystalBlade: 986.2, petal: 986.3, porcelain: 987, ribbon: 988, light: 989, rune: 990 };
  const { CER, GOLD, PLAT, QTZ, CH, EYE, FTH, POR, RIB, LIT, RUNE, CLAW, MOTE } = MT;
  const num = (v, d) => (v == null || !isFinite(v) ? d : +v);

  /* ================= the heart curve, and the mesh helpers of its own ================= */
  /* the heart outline: t 0 the cleft (top middle), t PI the point; [across, up] for a heart 1 wide */
  const hrt = t => { const s = sin(t); return [0.5 * s * s * s, (13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t)) / 32 * 1.18]; };
  const heart2 = n => { const P = []; for (let i = 0; i < n; i++) P.push(hrt(i / n * TAU)); return P; };
  /* a faceted heart crystal (frame: y across, z up, x its depth): an outline ring at the girdle, a smaller ring and a point on each face */
  function heartGem(B, r, m, th, n) {
    n = n || 20; const O = [], I0 = [], I1 = []; for (let i = 0; i < n; i++) { const p = hrt((i + 0.5) / n * TAU); O.push([0, p[0] * r, p[1] * r]); I0.push([th * 0.62, p[0] * r * 0.55, p[1] * r * 0.55 + 0.04 * r]); I1.push([-th * 0.62, p[0] * r * 0.55, p[1] * r * 0.55 + 0.04 * r]); }
    const c0 = [th, 0, -0.02 * r], c1 = [-th, 0, -0.02 * r];
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; B.facet([O[i], O[j], I0[j], I0[i]], m); B.facet([I0[i], I0[j], c0], m); B.facet([O[j], O[i], I1[i], I1[j]], m); B.facet([I1[j], I1[i], c1], m); }
  }
  /* a bevelled rail (a rectangle w across x d deep, chamfered) swept along a polyline whose plane normal is nrm; o.w(u) its width along */
  function rail(B, pts, w, d, m, o) {
    o = o || {}; const n = pts.length, N0 = o.nrm || [1, 0, 0], b = min(w, d) * 0.3;
    const pr = [[-d, -w + b], [-d + b, -w], [d - b, -w], [d, -w + b], [d, w - b], [d - b, w], [-d + b, w], [-d, w - b], [-d, -w + b]];
    B.surf((u, v) => { const i = round(u * (n - 1)), p = pts[i], T = norm(sub(pts[min(n - 1, i + 1)], pts[max(0, i - 1)])), S = norm(cross(T, N0)), N = cross(S, T), q = pr[round(v * 8)], ww = o.w ? o.w(u) : 1;
      return add(p, add(mul(N, q[0] * ww), mul(S, q[1] * ww))); }, n - 1, 8, () => m, { e: (u, v) => (round(v * 8) % 2 ? 0.2 : 1), a: u => u });
  }
  /* a feather plate: a cupped shell along a cubic, pointed at its end */
  const fplate = (B, c, nrm, W, m, o) => { o = o || {}; plate(B, { c, nrm, w: u => W * pow(sin(PI * (0.06 + 0.86 * u)), 0.45) * (1 - 0.55 * sstep(0.55, 1, u)) + 0.01, cup: o.cup == null ? -0.35 : o.cup, th: o.th || 0.09, nu: o.nu || 7, nv: 2, mat: m, under: CER + 0.2, rimMat: o.rim || GOLD, trim0: 0.74, endTrim: 2 }); };

  /* ================= the anatomy (model units; x forward, y across (+y screen left when it faces the viewer), z up; the floor at z 0) ================= */
  const HEIGHT = [0, 31, 32, 33], FACE0 = 1.62, YAWLIM = 0.75;
  /* the torso, upright: sections along z (z, half width, half depth, centre x) */
  const TB = [[7.2, 1.317, 1.19, -0.72], [8.6, 2.79, 2.17, -0.48], [10.4, 3.488, 2.59, -0.36], [12.8, 4.107, 2.87, -0.24], [15.4, 4.65, 3.08, -0.18], [17.8, 4.728, 2.94, -0.3], [19.6, 3.952, 2.52, -0.48], [20.9, 2.403, 1.82, -0.42], [21.7, 1.55, 1.33, -0.3]];
  function tb(z) { if (z <= TB[0][0]) return TB[0].slice(1); for (let i = 1; i < TB.length; i++) if (z <= TB[i][0]) { const a = TB[i - 1], b = TB[i], u = sstep(a[0], b[0], z); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; } return TB[TB.length - 1].slice(1); }
  const torP = (z, ph, o) => { const [w, d, xc] = tb(z), k = o || 0; return [xc + (d + k) * se(cos(ph), 2.4), (w + k) * se(sin(ph), 2.4), z]; };
  const phiA = z => 1.0 * sstep(9.8, 11.2, z) * (1 - sstep(18.9, 20.3, z));   // (the open front of the chest)
  /* the Heart of Eden: its outline in the plane x = HX, centre (0, HZ), HW wide */
  const HX = 2.7, HZ = 15.6, HW = 11.0, HC = [1.7, 0, 15.0];
  const hP = (t, s, x) => { const p = hrt(t); return [x == null ? HX : x, p[0] * HW * (s || 1), HZ + p[1] * HW * (s || 1)]; };
  const SEGT = [[0, 0.95], [0.95, 2.0], [2.0, PI]];
  /* the oracle: its pelvis at rest (body frame), its sizes */
  const OPEL = [1.45, 0, 11.0], OSH = [0.05, 0.58, 2.35], OL1 = 1.25, OL2 = 1.15, OHAND = 0.62, OHEAD = [0.02, 0, 3.2];
  /* the neck, the head's rest, the wings, the legs, the tail, the halo */
  const NROOT = [0.1, 0, 20.8], HREST = [1.7, 0, 26.4], NNV = [0, 11, 12, 13];
  const WROOT = [-0.7, 4.1, 19.8], WLEN = [[0, 0, 0], [5.4, 7.0, 6.2], [5.7, 7.4, 6.6], [6.0, 7.8, 7.0]];
  const HIP = [0.1, 2.6, 8.6], LF1 = 3.2, LF2 = 3.6, LTA = 3.4;
  const TROOT = [-2.4, 0, 8.6], NTF = [0, 5, 7, 9], NTR = [0, 2, 4, 6], NHR = [0, 4, 6, 8];
  const HALO = [-3.6, 0, 24.2], HALR = [0, 8.2, 8.9, 9.6];

  let D = null, DL = null;
  function* gen(qq, OUT) {
    const q = qq * (lowFx() ? 0.75 : 1), LOQ = qq < 0.6, M = {}, Q = n => max(3, round(n * q));
    const mk = f => { const B = GLM.builder(q); f(B); return B.done(); };
    const K3 = f => [null, mk(B => f(B, 1)), mk(B => f(B, 2)), mk(B => f(B, 3))];
    /* ---- the torso: the shell (open in front round the heart), its pink-lit lining, the shingled feather plates ---- */
    M.torso = mk(B => {
      const z0 = TB[0][0], z1 = TB[TB.length - 1][0];
      B.surf((u, v) => { const z = lerp(z0, z1, u), a = phiA(z); return torP(z, lerp(a, TAU - a, v)); }, Q(24), Q(34), () => CER + 0.2, { flip: true, e: (u, v) => sstep(0.94, 1, abs(v * 2 - 1)) * (phiA(lerp(z0, z1, u)) > 0.1 ? 1 : 0) });
      B.surf((u, v) => { const z = lerp(9.9, 20.0, u), a = phiA(z) + 0.04; return torP(z, lerp(a, TAU - a, v), -0.25); }, Q(14), Q(24), () => PLAT + 0.3, {});
      const NJ = LOQ ? 4 : 6;
      for (const s of [1, -1]) for (let r = 0; r < 7; r++) for (let j = 0; j < NJ; j++) {
        const z = 20.4 - r * 1.62, a0 = max(phiA(z), phiA(z - 1.2)) + 0.32, ph = s * (a0 + (j + 0.5 * (r % 2)) * (PI - a0) / NJ), p0 = torP(z + 0.9, ph, 0.05), p1 = torP(z + 0.1, ph, 0.18), p2 = torP(z - 0.7, ph, 0.2), p3 = torP(z - 1.45, ph, 0.12);
        fplate(B, [p0, p1, p2, p3], norm([cos(ph), sin(ph), 0.2]), 0.72 - 0.03 * r, CER + ((j + r) % 3 ? 0 : 0.3), { nu: Q(6) }); }
      for (let j = 0; j < 7; j++) { const ph = (j - 3) * 0.3, p0 = torP(10.6, ph, 0.05), p3 = torP(7.8, ph, 0.12); fplate(B, [p0, lerp3(p0, p3, 0.33), lerp3(p0, p3, 0.66), p3].map((p, i) => add(p, [0.15 * sin(PI * i / 3), 0, 0])), [cos(ph), sin(ph), 0], 0.6, CER + (j % 2 ? 0.3 : 0), { nu: Q(6) }); }
      for (let j = 0; j < 10; j++) { const ph = j / 10 * TAU + 0.31, p0 = torP(21.9, ph, -0.1), p3 = torP(20.1, ph, 0.35); fplate(B, [p0, lerp3(p0, p3, 0.33), lerp3(p0, p3, 0.66), p3], norm([cos(ph), sin(ph), 0.5]), 0.62, CER, { nu: Q(5) }); }
      // the dorsal ridge and the wing mechanism's housing on the back; the heart's mount round the opening (a gold lip)
      { const pts = []; for (let i = 0; i <= 16; i++) pts.push(torP(lerp(21.0, 8.2, i / 16), PI, 0.05)); sweep(B, pts, u => 0.2 - 0.08 * u, GOLD, Q(8), 0.6); }
      for (let j = 0; j < 7; j++) { const z = 19.8 - j * 1.6, p = torP(z, PI, 0.08); B.crystal(add(p, [0.1, 0, 0.3]), add(p, [-0.9, 0, -0.9]), 0.22, CER, { n: 4, thin: 0.3, up: [0, 1, 0] }); }
      for (const s of [1, -1]) { B.push([0, 0, 1], [1, 0, 0], [0, s, 0], [WROOT[0] - 0.2, s * (WROOT[1] - 0.6), WROOT[2] - 0.4]); bring(B, 0.95, 0.15, 0.14, 0.05, GOLD, Q(32), null, null, PLAT); B.pop(); B.ell([WROOT[0] - 0.3, s * (WROOT[1] - 0.75), WROOT[2] - 0.5], [1.1, 0.7, 0.9], PLAT + 0.2, { seg: Q(14), rings: Q(7) }); }
      { const pts = []; for (let i = 0; i <= 40; i++) { const z = lerp(10.2, 20.0, i / 40), a = phiA(z); if (a < 0.2) continue; pts.push(torP(z, a, 0.02)); } if (pts.length > 2) for (const s of [1, -1]) sweep(B, pts.map(p => [p[0], s * p[1], p[2]]), () => 0.12, GOLD, Q(6), 0.7); }
      // the hips' feather trousers' mounts and the tail's socket
      B.push([-0.6, 0, -0.8], [0, 1, 0], [0.8, 0, -0.6], add(TROOT, [0.35, 0, 0.3])); B.lathe([[0, 0.85, PLAT], [0.2, 0.95, GOLD, 1], [0.38, 0.88, GOLD, 1], [0.6, 0.7, PLAT + 0.2]], PLAT, { seg: Q(18), edge: j => (j === 1 || j === 2 ? 1 : 0) }); B.pop();
    }); yield;
    /* ---- the Heart of Eden ---- */
    // the arches: each half (+y) in three segments; the main gold rail, the inner rose-gold rail, struts, a conduit on its face; L4+
    // filigree scrolls and rose-crystal spines outward
    M.arch = [null, 1, 2, 3].map(k => k && SEGT.map(([t0, t1], si) => mk(B => {
      const n = Q(18), P = [], P2 = []; for (let i = 0; i <= n; i++) { const t = lerp(t0, t1, i / n); P.push(hP(t)); P2.push(hP(t, 0.9, HX - 0.12)); }
      rail(B, P, 0.26, 0.34, GOLD); rail(B, P2, 0.1, 0.13, GOLD + 0.2);
      strip(B, P.map(p => add(p, [0.36, 0, 0])), () => [1, 0, 0], 0.13, CH, 0.0);
      for (let i = 1; i < n; i += 2) { const a = P[i], b = P2[i], m = lerp3(a, b, 0.5), d = sub(a, b); B.push(norm(d), [1, 0, 0], norm(cross(norm(d), [1, 0, 0])), m); B.box([0, 0, 0], [len(d) * 0.5, 0.06, 0.05], 0.02, GOLD); B.pop(); }
      for (let i = 2; i < n; i += k >= 2 ? 2 : 3) { const t = lerp(t0, t1, i / n), p = hP(t), c = hP(t, 1.07), o = norm(sub(c, p)), sp = []; for (let j = 0; j <= 10; j++) { const a = j / 10 * 4.2, rr = 0.42 * (1 - j / 12); sp.push(add(add(p, mul(o, 0.25 + rr * (1 - cos(a)) * 0.9)), mul(norm(cross(o, [1, 0, 0])), rr * sin(a)))); } sweep(B, sp, u => 0.06 * (1 - 0.6 * u), GOLD, Q(5), 0.6); }
      for (let i = 1; i < n; i += (k >= 3 ? 2 : k >= 2 ? 3 : 5)) { const t = lerp(t0, t1, i / n), p = hP(t), o = norm(sub(hP(t, 1.1), p)); B.crystal(add(p, mul(o, 0.2)), add(p, mul(o, 0.75 + 0.35 * hash(i + si * 7 + k))), 0.1, QTZ, { n: 4, thin: 0.5, up: [1, 0, 0], seed: i }); }
    })));
    // the rose-quartz heart behind the oracle; (L4+) a see-through layer before it; the lobes that close the front (see-through), hinged
    M.hback = [null, 1, 2, 3].map(k => k && mk(B => {
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0.1, 0, HZ]); heartGem(B, HW * 0.84, QTZ, 0.55, Q(26)); B.pop();
      if (k >= 2) { B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0.4, 0, HZ]); heartGem(B, HW * 0.9, QTZ + 0.3, 0.3, Q(26)); B.pop(); }
      if (k >= 3) for (let i = 0; i < 14; i++) { const t = (i + 0.5) / 14 * TAU, p = hP(t, 0.9, -0.9), o = norm(sub(hP(t, 1.2, -1.4), p)); B.crystal(p, add(p, mul(o, 1.3 + 0.5 * hash(i))), 0.2, QTZ, { n: 5, thin: 0.6, up: [1, 0, 0], seed: i }); }
    }));
    M.hlobe = mk(B => B.surf((u, v) => { const t = lerp(0.12, 2.25, u), r = lerp(0.3, 0.96, v), p = hP(t, r, 0), dm = sin(PI * v) * sin(PI * u); return [HX + 0.14 + 0.45 * dm, p[1], p[2]]; }, Q(14), Q(6), () => QTZ + 0.3, { e: (u, v) => sstep(0.8, 1, max(abs(u * 2 - 1), v)) }));
    // the chest armour round the rim (one plate; posed round it, unfolding like petals)
    M.hglow = mk(B => B.ell([0, 0, 0], [1, 1, 1], LIT, { seg: Q(18), rings: Q(9) }));
    M.cplate = mk(B => { fplate(B, [[0, 0, 0], [0.1, 0, 0.6], [0.05, 0, 1.25], [-0.15, 0, 1.9]], [1, 0, 0.1], 0.5, CER + 0.3, { nu: Q(7), th: 0.1 }); strip(B, [[0.08, 0, 0.1], [0.12, 0, 0.6], [0.1, 0, 1.1], [0.02, 0, 1.5]], () => [1, 0, 0], 0.07, CH, 0.06); });
    // containment rings (radius 1): a gold ring with heart studs, a runed band, a rose-gold gyre
    M.cring = [mk(B => { bring(B, 1, 0.022, 0.03, 0.01, GOLD, Q(40)); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; B.push([0, 0, 1], [cos(a), sin(a), 0], [-sin(a), cos(a), 0], [cos(a), sin(a), 0]); heartGem(B, 0.09, QTZ + 0.2, 0.04, 8); B.pop(); } }),
      mk(B => { bring(B, 1, 0.03, 0.02, 0.01, RUNE, Q(44)); }), mk(B => { bring(B, 1, 0.016, 0.025, 0.008, GOLD + 0.2, Q(40)); B.tor([0, 0, 0], 1.05, 0.007, GOLD, { seg: Q(40), rseg: 4, teeth: 24, tooth: 0.02 }); })];
    // the lotus (radius ~1.1): two rings of cupped petals white to pink round a gold seed pod
    M.lotus = mk(B => {
      for (const [n, rr, tilt, L, off] of [[8, 0.32, 1.05, 1.05, 0], [8, 0.22, 0.55, 0.85, 0.39], [LOQ ? 0 : 6, 0.12, 0.25, 0.6, 0.2]]) for (let i = 0; i < n; i++) { const a = i / n * TAU + off, d = [cos(a), sin(a), 0], b = add(mul(d, rr), [0, 0, 0.05]), tp = add(b, add(mul(d, sin(tilt) * L), [0, 0, cos(tilt) * L]));
        plate(B, { c: [b, lerp3(b, tp, 0.35), add(lerp3(b, tp, 0.7), mul(d, 0.08)), tp], nrm: norm(add(mul(d, cos(tilt)), [0, 0, -sin(tilt)])).map(v => -v), w: u => 0.26 * L * pow(sin(PI * (0.08 + 0.84 * u)), 0.7) * (1 - 0.5 * sstep(0.7, 1, u)) + 0.005, cup: 0.5, th: 0.04, nu: Q(6), nv: 3, mat: FTH + 0.3, under: FTH + 0.3, rimMat: FTH + 0.3, trim0: 0.9 }); }
      latheZ(B, [[-0.1, 0.0, GOLD], [-0.1, 0.25, GOLD, 1], [0.08, 0.3, GOLD, 1], [0.12, 0.18, GOLD + 0.2]], GOLD, Q(14));
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; B.tube([0, 0, 0.1], [cos(a) * 0.12, sin(a) * 0.12, 0.32], 0.02, 0.012, GOLD, { seg: 4 }); }
    });
    // a heart lock (unit ~0.5 tall): a gold heart frame round a rose-quartz heart, a shackle over it
    M.hlock = mk(B => { const O = heart2(Q(22)).map(p => [0.05, p[0] * 0.5, p[1] * 0.5 + 0.03]); O.push(O[0]); rail(B, O, 0.045, 0.06, GOLD); heartGem(B, 0.4, QTZ + 0.2, 0.08, 12); B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0.27]); B.tor([0, 0, 0], 0.12, 0.025, GOLD, { seg: Q(12), rseg: 4, ph0: 0, ph1: PI }); B.pop(); });
    // a chain link (oval, 0.3 long along x) and a rotating seal (a runed disc ring round a heart)
    M.link = mk(B => { B.push([1, 0, 0], [0, 1, 0], [0, 0, 1.5]); B.torX([0, 0, 0], 0.12, 0.042, GOLD, { seg: Q(10), rseg: 4 }); B.pop(); });
    M.seal = mk(B => { B.push([0, 0, 1], [0, 1, 0], [-1, 0, 0]); bring(B, 0.3, 0.07, 0.04, 0.015, RUNE, Q(22)); B.tor([0, 0, 0], 0.38, 0.02, GOLD, { seg: Q(22), rseg: 4, teeth: 12, tooth: 0.04 }); B.pop(); B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0.03, 0, 0]); heartGem(B, 0.32, QTZ + 0.2, 0.06, 10); B.pop(); });
    // a cuff (one half, round the z axis, radius 1): a gold band with a rose-gold rim; the heart lock sits on it
    M.cuff = mk(B => { bring(B, 1, 0.12, 0.28, 0.05, GOLD, Q(20), -PI / 2, PI / 2, PLAT); B.tor([0, 0, 0.26], 1.06, 0.03, GOLD + 0.2, { seg: Q(16), rseg: 4, ph0: -PI / 2, ph1: PI / 2 }); B.tor([0, 0, -0.26], 1.06, 0.03, GOLD + 0.2, { seg: Q(16), rseg: 4, ph0: -PI / 2, ph1: PI / 2 }); });
    yield;
    /* ---- the Bound Oracle (its own frame: the pelvis at 0, z up, x its front) ---- */
    M.orLow = K3((B, k) => { B.push([1, 0, 0], [0, 1, 0], [0, 0, 0.68]);
      latheZ(B, [[-2.3, 0.08, GOLD], [-2.1, 0.24, GOLD, 1], [-1.5, 0.3, PLAT + 0.2], [-0.9, 0.38, PLAT + 0.2], [-0.3, 0.42, GOLD, 1], [0.05, 0.36, PLAT]], PLAT, Q(16));
      for (let r = 0; r < 3; r++) for (let i = 0; i < (LOQ ? 5 : 7); i++) { const a = (i + 0.5 * r) / (LOQ ? 5 : 7) * TAU, d = [cos(a), sin(a), 0], z = -0.15 - r * 0.62;
        fplate(B, [add(mul(d, 0.42 - 0.04 * r), [0, 0, z]), add(mul(d, 0.5 - 0.04 * r), [0, 0, z - 0.25]), add(mul(d, 0.5 - 0.05 * r), [0, 0, z - 0.55]), add(mul(d, 0.42 - 0.05 * r), [0, 0, z - 0.85])], d, 0.3 + 0.03 * k, POR, { nu: Q(5), cup: -0.6, th: 0.05, rim: GOLD + 0.2 }); }
      for (let i = 0; i < 5 + k; i++) { const a = i / (5 + k) * TAU + 0.3, pts = []; for (let j = 0; j <= 8; j++) { const u = j / 8; pts.push([cos(a) * (0.12 + 0.75 * u * u), sin(a) * (0.12 + 0.75 * u * u), -2.1 - 0.9 * u + 0.35 * u * u]); } sweep(B, pts, u => 0.06 * (1 - 0.7 * u), GOLD, Q(5), 0.5); }
      if (k >= 3) for (const s of [1, -1]) B.crystal([0.1, s * 0.35, -0.5], [0.05, s * 0.75, -1.6], 0.12, QTZ, { n: 4, thin: 0.5, up: [1, 0, 0] });
      B.pop(); });
    M.orTorso = K3((B, k) => {
      latheZ(B, [[-0.05, 0.32, POR], [0.4, 0.27, POR], [0.9, 0.3, POR], [1.5, 0.42, POR], [2.0, 0.44, POR], [2.35, 0.3, POR], [2.6, 0.12, POR]], POR, Q(18));
      B.push([1, 0, 0], [0, 1.25, 0], [0, 0, 1]); B.ell([0.06, 0, 1.75], [0.36, 0.38, 0.52], POR, { seg: Q(16), rings: Q(8) }); B.pop();
      plate(B, { c: [[0.36, 0, 2.3], [0.46, 0, 1.9], [0.44, 0, 1.4], [0.3, 0, 0.95]], nrm: [1, 0, 0], w: u => 0.33 * (1 - 0.4 * u), cup: -0.7, th: 0.05, nu: Q(6), nv: 3, mat: POR, under: POR, rimMat: GOLD + 0.2, trim0: 0.8 });
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0.5, 0, 1.78]); heartGem(B, 0.3, QTZ + 0.2, 0.08, 12); B.pop();
      B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0.1]); B.tor([0, 0, 0], 0.33, 0.04, GOLD + 0.2, { seg: Q(18), rseg: 4 }); B.pop();
      for (const s of [1, -1]) { B.ell([0.03, s * OSH[1], OSH[2]], [0.15, 0.15, 0.15], GOLD + 0.2, { seg: Q(10), rings: Q(5) }); plate(B, { c: [[0.1, s * 0.25, 2.5], [0.05, s * 0.55, 2.58], [0.0, s * 0.78, 2.45], [-0.05, s * 0.85, 2.2]], nrm: [0.2, s * 0.3, 1], w: u => 0.2 + 0.04 * k, cup: -0.5, th: 0.05, nu: Q(5), nv: 2, mat: POR, under: POR, rimMat: GOLD + 0.2, trim0: 0.75 });
        if (k >= 3) for (let i = 0; i < 3; i++) B.crystal([-0.05, s * (0.62 + i * 0.1), 2.55 - i * 0.12], [-0.25, s * (1.05 + i * 0.25), 3.1 - i * 0.25], 0.06, GOLD, { n: 4, thin: 0.4, up: [1, 0, 0] });
        const pts = []; for (let i = 0; i <= 6; i++) pts.push([0.38 - 0.02 * i, s * (0.12 + 0.03 * i), 2.2 - i * 0.3]); strip(B, pts, () => norm([1, s * 0.3, 0]), 0.05, CH, 0.03); }
      latheZ(B, [[2.55, 0.12, POR], [2.95, 0.1, POR], [3.05, 0.13, GOLD + 0.2, 1]], POR, Q(10));
    });
    M.orHead = K3((B, k) => {
      B.ell([0, 0, 0], [0.36, 0.31, 0.45], POR, { seg: Q(20), rings: Q(12) });
      B.ell([0.02, 0, 0.02], [0.35, 0.315, 0.44], GOLD + 0.2, { seg: Q(16), rings: Q(8), th0: 0, th1: PI, ph0: PI * 0.62, ph1: PI * 1.38 });   // (a rose-gold hood over the back of the head)
      B.box([0.32, 0, 0.05], [0.05, 0.22, 0.03], 0.012, POR + 0.2);
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0.34, 0, 0.27]); heartGem(B, 0.14, QTZ + 0.2, 0.05, 10); B.pop();
      for (const s of [1, -1]) { const pts = []; for (let i = 0; i <= 6; i++) pts.push([0.28 - 0.02 * i, s * (0.12 + 0.03 * i), 0.13 - 0.06 * i]); strip(B, pts, () => norm([1, s * 0.4, 0]), 0.02, GOLD, 0.01); }
      B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0.3]); bring(B, 0.32, 0.03, 0.05, 0.015, GOLD, Q(22)); B.pop();
      if (k >= 2) for (const s of [1, -1]) B.crystal([0.0, s * 0.3, 0.0], [-0.15, s * 0.55, 0.35], 0.06, GOLD + 0.2, { n: 4, thin: 0.4, up: [1, 0, 0] });
    });
    M.crownSp = mk(B => { B.crystal([0, 0, 0], [0, 0, 0.7], 0.08, GOLD, { n: 4, thin: 0.45, belly: 0.3, base: 0.7, up: [1, 0, 0] }); B.crystal([0.03, 0, 0.12], [0.03, 0, 0.34], 0.04, QTZ + 0.2, { n: 4, thin: 0.6, up: [1, 0, 0] }); });
    M.orUA = mk(B => { latheZ(B, [[0, 0.12, GOLD + 0.2], [0.1, 0.13, POR], [0.8, 0.12, POR], [1.3, 0.1, POR], [1.45, 0.11, GOLD + 0.2, 1]], POR, Q(12)); plate(B, { c: [[0.12, 0, 0.1], [0.16, 0, 0.5], [0.14, 0, 0.9], [0.1, 0, 1.2]], nrm: [1, 0, 0], w: () => 0.1, cup: -0.8, th: 0.03, nu: 4, nv: 2, mat: POR, under: POR, rimMat: GOLD + 0.2, trim0: 0.7 }); });
    M.orFA = mk(B => { latheZ(B, [[0, 0.1, GOLD + 0.2], [0.1, 0.11, POR], [0.7, 0.1, POR], [1.05, 0.13, GOLD, 1], [1.3, 0.12, GOLD], [1.4, 0.08, GOLD + 0.2]], POR, Q(12)); const pts = []; for (let i = 0; i <= 5; i++) pts.push([0.1, 0, 0.1 + i * 0.18]); strip(B, pts, () => [1, 0, 0], 0.035, CH, 0.015); });
    M.orPalm = mk(B => { B.box([0.2, 0, 0], [0.2, 0.15, 0.05], 0.04, POR); B.box([0.2, 0, 0.05], [0.12, 0.08, 0.012], 0.01, GOLD + 0.2); });
    M.orPh = mk(B => { B.tube([0, 0, 0], [1, 0, 0], 0.32, 0.28, POR, { seg: Q(6), cap0: 'round', cap1: 'round' }); });
    yield;
    /* ---- the phoenix's neck vertebra (unit long along +z; +x its throat side) and its head (x forward along the beak, z up) ---- */
    M.nvert = K3((B, k) => {
      latheZ(B, [[-0.08, 0.7, PLAT], [0.0, 0.78, PLAT + 0.2], [0.6, 0.78, PLAT + 0.2], [0.7, 0.9, GOLD, 1], [0.84, 0.9, GOLD, 1], [0.92, 0.75, PLAT], [1.1, 0.7, PLAT]], PLAT, Q(16));
      for (const [a, w, m] of [[PI, 0.95, CER], [PI - 1.0, 0.8, CER + 0.3], [PI + 1.0, 0.8, CER + 0.3], [PI - 1.95, 0.7, CER], [PI + 1.95, 0.7, CER], [0, 0.62, CER + 0.3]]) { const d = [cos(a), sin(a), 0];
        fplate(B, [add(mul(d, 0.8), [0, 0, 1.0]), add(mul(d, 1.05), [0, 0, 0.65]), add(mul(d, 1.12), [0, 0, 0.2]), add(mul(d, 1.02), [0, 0, -0.3])], d, w, m, { nu: Q(5), cup: -0.7, th: 0.1 }); }
      const pts = []; for (let i = 0; i <= 6; i++) pts.push([0.88, 0, i / 6]); strip(B, pts, () => [1, 0, 0], 0.22, CH, 0.04);
      B.crystal([-0.9, 0, 0.6], [-1.75 - 0.15 * k, 0, 0.15], 0.2, CER, { n: 4, thin: 0.3, up: [0, 1, 0] });
      if (k >= 2) for (const s of [1, -1]) B.crystal([-0.55, s * 0.85, 0.6], [-1.05, s * 1.35, 0.1], 0.1, GOLD, { n: 4, thin: 0.4, up: [0, s, 0] });
    });
    // the skull: a smooth ovoid with a domed brow; white facial armour plates rimmed in gold; the eyes; the forehead heart; the hooked upper
    // beak (white to gold); the crest's sockets. The mandible separately (hinged at [0.35, 0, -0.25])
    M.pskull = K3((B, k) => {
      B.ell([-0.15, 0, 0.18], [0.72, 0.52, 0.56], CER + 0.2, { seg: Q(18), rings: Q(10) });
      B.surf((u, v) => { const a = v * TAU, x = lerp(-0.3, 0.95, u), w = lerp(0.5, 0.33, u * u), h = lerp(0.52, 0.34, u); return [x, w * cos(a) * (1 - 0.15 * max(0, -sin(a))), 0.14 + h * sin(a) * (sin(a) > 0 ? 1 : 0.75) - 0.06 * u]; }, Q(12), Q(14), () => CER, { a: u => u });
      const bk = (u, a) => { const x = 0.8 + 1.9 * u, hk = sstep(0.5, 1, u), w = lerp(0.3, 0.025, pow(u, 0.75)), h = lerp(0.36, 0.04, pow(u, 0.85)), zc = 0.12 - 0.12 * u * u - 1.05 * hk * hk; return [x - 0.35 * hk * hk, w * cos(a), zc + h * max(-0.4, sin(a)) * (sin(a) > 0 ? 1 : 0.6)]; };
      B.surf((u, v) => bk(u, v * TAU), Q(14), Q(12), u => CLAW + 0.2, { e: (u, v) => sstep(0.3, 1, u) * 0.6, a: u => u });
      for (const s of [1, -1]) {
        // the facial armour: three layered plates from the beak's root back over the cheek, a brow plate over the eye
        for (let j = 0; j < 3; j++) fplate(B, [[0.9 - j * 0.32, s * (0.36 + 0.06 * j), 0.28 - j * 0.12], [0.55 - j * 0.32, s * (0.58 + 0.06 * j), 0.2 - j * 0.1], [0.1 - j * 0.3, s * (0.7 + 0.05 * j), 0.05 - j * 0.1], [-0.45 - j * 0.3, s * (0.66 + 0.03 * j), -0.15 - j * 0.12]], [0.1, s, 0.25], 0.12 - 0.015 * j, j === 1 ? CER + 0.3 : CER, { nu: Q(6), th: 0.05 });
        fplate(B, [[1.0, s * 0.22, 0.52], [0.62, s * 0.42, 0.56], [0.1, s * 0.5, 0.62], [-0.6, s * 0.42, 0.78]], [0.3, s * 0.3, 1], 0.1, CER, { nu: Q(6), th: 0.05, cup: -0.5 });
        B.ell([0.55, s * 0.4, 0.34], [0.22, 0.08, 0.1], PLAT + 0.3, { seg: Q(10), rings: Q(5) });
        B.push(norm([1, s * 0.5, 0.1]), norm([-s * 0.5, 1, 0]), [0, 0, 1], [0.6, s * 0.43, 0.35]); B.ell([0, 0, 0], [0.2, 0.05, 0.075], EYE, { seg: Q(12), rings: Q(5) }); B.pop();
        const pts = []; for (let i = 0; i <= 7; i++) pts.push([0.8 - i * 0.2, s * (0.6 + 0.02 * i), 0.0 - 0.05 * i]); strip(B, pts, () => norm([0, s, 0.2]), 0.05, GOLD, 0.03);
        for (let i = 0; i < 2 + k; i++) B.crystal([-0.2 - 0.25 * i, s * 0.62, -0.25 - 0.1 * i], [-1.0 - 0.3 * i, s * (0.82 + 0.1 * i), -0.75 - 0.25 * i], 0.11, CER, { n: 4, thin: 0.35, up: [0, s, 0], seed: i });
      }
      B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0.95, 0, 0.58]); heartGem(B, 0.3, QTZ + 0.2, 0.07, 12); B.pop();
      plate(B, { c: [[1.1, 0, 0.45], [0.7, 0, 0.82], [0.1, 0, 0.98], [-0.5, 0, 0.9]], nrm: [0.3, 0, 1], w: () => 0.2, cup: -0.5, th: 0.06, nu: Q(7), nv: 2, mat: CER + 0.3, under: CER + 0.2, rimMat: GOLD, trim0: 0.72, endTrim: 2 });
    });
    M.pjaw = mk(B => { B.surf((u, v) => { const a = v * TAU, x = 0.5 + 1.55 * u, w = lerp(0.26, 0.03, pow(u, 0.85)), h = lerp(0.13, 0.03, u); return [x, w * cos(a), -0.08 - 0.22 * u * u + h * sin(a)]; }, Q(12), Q(10), () => CLAW + 0.2, { a: u => u }); });
    // a crest blade (unit long along +z, broad across y): white metal, a gold spine, a rose-crystal edge
    M.crest = mk(B => { B.surf((u, v) => { const q = v * 2 - 1, w = 0.16 * pow(sin(PI * min(1, 0.08 + u)), 0.6) * (1 - 0.7 * u) + 0.01; return [0.03 * (1 - q * q) * (1 - u), q * w, u]; }, Q(10), 4, () => FTH, { e: (u, v) => v, a: u => u }); B.surf((u, v) => { const q = v * 2 - 1, w = 0.16 * pow(sin(PI * min(1, 0.08 + u)), 0.6) * (1 - 0.7 * u) + 0.01; return [-0.03 * (1 - q * q) * (1 - u), q * w, u]; }, Q(10), 4, () => FTH, { e: (u, v) => v, a: u => u, flip: true }); });
    yield;
    /* ---- the wings: the shoulder mechanism, an armoured bone (unit long along +z, +y its top), a joint, the feather-blades (unit long along
       +z, unit wide across y, thin in x: white metal / rose crystal), the heart node ---- */
    M.wsh = mk(B => {
      B.ell([0, 0, 0], [0.75, 0.75, 0.75], PLAT + 0.2, { seg: Q(14), rings: Q(7) }); bring(B, 0.85, 0.12, 0.14, 0.04, GOLD, Q(30), null, null, PLAT);
      B.push([0, 0, 1], [1, 0, 0], [0, 1, 0]); bring(B, 0.7, 0.1, 0.12, 0.03, RUNE, Q(26)); B.pop();
      fplate(B, [[0.6, 0.3, 0.9], [0.2, 0.75, 0.8], [-0.4, 1.0, 0.4], [-0.9, 0.95, -0.2]], [0.2, 0.5, 1], 0.6, CER + 0.3, { nu: Q(7), th: 0.12 });
      fplate(B, [[0.5, 0.1, 1.1], [0.0, 0.5, 1.2], [-0.6, 0.8, 0.9], [-1.1, 0.8, 0.3]], [0, 0.4, 1], 0.45, CER, { nu: Q(7), th: 0.1 });
      for (let i = 0; i < 3; i++) B.tube([0.3 - i * 0.35, -0.3, -0.3], [0.5 - i * 0.3, 0.9, 0.4 - i * 0.1], 0.07, 0.05, GOLD, { seg: Q(6) });
    });
    M.wbone = K3((B, k) => {
      latheZ(B, [[0, 0.4, PLAT], [0.06, 0.46, GOLD, 1], [0.14, 0.4, PLAT + 0.2], [0.85, 0.3, PLAT + 0.2], [0.92, 0.36, GOLD, 1], [1.0, 0.3, PLAT]], PLAT, Q(12));
      fplate(B, [[0, 0.32, 0.05], [0.05, 0.48, 0.35], [0.03, 0.45, 0.65], [0, 0.32, 0.95]], [0, 1, 0], 0.42, CER + 0.3, { nu: Q(6), th: 0.07, cup: -0.8 });
      B.tube([0.36, 0.0, 0.12], [0.36, 0.05, 0.85], 0.08, 0.08, GOLD, { seg: Q(6) }); B.tube([0.36, 0.0, 0.12], [0.36, 0.0, 0.55], 0.12, 0.12, PLAT + 0.2, { seg: Q(6) });
      const pts = []; for (let i = 0; i <= 6; i++) pts.push([-0.31, 0, 0.1 + i * 0.13]); strip(B, pts, () => [-1, 0, 0], 0.1, CH, 0.02);
      if (k >= 3) for (let i = 0; i < 2; i++) B.crystal([0, 0.4, 0.3 + i * 0.35], [0, 0.85, 0.1 + i * 0.35], 0.06, GOLD, { n: 4, thin: 0.4, up: [1, 0, 0] });
    });
    M.wjoint = mk(B => { B.ell([0, 0, 0], [0.55, 0.55, 0.55], GOLD, { seg: Q(14), rings: Q(7) }); B.push([1, 0, 0], [0, 0, 1], [0, -1, 0]); bring(B, 0.6, 0.08, 0.2, 0.03, GOLD + 0.2, Q(24), null, null, PLAT); B.pop(); });
    const blade = (B, m, rib) => { const W = u => 0.5 * pow(sin(PI * min(1, 0.02 + pow(u, 0.82) * 0.98)), 0.62) + 0.008, X = (u, v) => 0.05 * (1 - pow(abs(v * 2 - 1), 1.6)) * (1 - 0.55 * u) + (rib ? 0.035 * pow(max(0, 1 - abs(v * 2 - 1) * 5), 2) : 0), bw = u => 0.09 * sin(PI * u);
      for (const sg of [1, -1]) B.surf((u, v) => { const q = v * 2 - 1; return [sg * X(u, v) + bw(u) + 0.05 * q * q, q * W(u), u]; }, Q(12), Q(6), () => m, { e: (u, v) => v, a: u => u, flip: sg < 0 }); };
    M.wfil = mk(B => { latheZ(B, [[0, 0.05, GOLD], [0.02, 0.09, GOLD, 1], [0.98, 0.09, GOLD, 1], [1, 0.05, GOLD]], GOLD, Q(8)); for (let i = 0; i < 6; i++) { const z0 = 0.08 + i * 0.16, sp = []; for (let j = 0; j <= 8; j++) { const a = j / 8 * 4.4, r = 0.07 * (1 - j / 11); sp.push([0.06 + r * sin(a), 0.08 + r * (1 - cos(a)), z0 + r * 0.9 * (1 - cos(a * 0.5))]); } sweep(B, sp, u => 0.016 * (1 - 0.5 * u), GOLD, 4, 0.6); } });
    M.fth = mk(B => blade(B, FTH, 1)); M.fthc = mk(B => blade(B, FTH + 0.2, 0));
    M.wnode = mk(B => { const O = heart2(Q(22)).map(p => [0.08, p[0] * 1.1, p[1] * 1.1 + 0.06]); O.push(O[0]); rail(B, O, 0.07, 0.09, GOLD); heartGem(B, 0.95, QTZ + 0.2, 0.2, 14); for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6 * TAU, p = hrt(t); B.crystal([0, p[0] * 1.1, p[1] * 1.1 + 0.06], [0, p[0] * 1.6, p[1] * 1.6 + 0.06], 0.06, GOLD, { n: 4, thin: 0.5, up: [1, 0, 0] }); } });
    yield;
    /* ---- the legs: a feathered thigh, an armoured shank (unit along +z), the ankle, the tarsus, a toe phalanx (unit along +x), a talon ---- */
    M.thigh = mk(B => { B.ell([0, 0, 0], [1.2, 1.0, 1.5], CER + 0.2, { seg: Q(12), rings: Q(8) }); for (let i = 0; i < (LOQ ? 7 : 11); i++) { const a = i / (LOQ ? 7 : 11) * TAU, d = [cos(a), sin(a), 0]; fplate(B, [add(mul(d, 0.9), [0, 0, 1.3]), add(mul(d, 1.2), [0, 0, 0.5]), add(mul(d, 1.25), [0, 0, -0.4]), add(mul(d, 1.05), [0, 0, -1.6])], d, 0.62, i % 3 ? CER : CER + 0.3, { nu: Q(5) }); } });
    M.shank = mk(B => { latheZ(B, [[0, 0.32, GOLD], [0.1, 0.3, PLAT + 0.2], [0.9, 0.22, PLAT + 0.2], [1.0, 0.25, GOLD, 1]], PLAT, Q(10)); for (let i = 0; i < 4; i++) fplate(B, [[0.2, 0, 0.05 + i * 0.24], [0.3, 0, 0.15 + i * 0.24], [0.3, 0, 0.27 + i * 0.24], [0.24, 0, 0.36 + i * 0.24]], [1, 0, 0], 0.26, CER, { nu: 3, th: 0.04, cup: -0.8 }); });
    M.tars = mk(B => { latheZ(B, [[0, 0.3, GOLD, 1], [0.08, 0.24, GOLD], [0.15, 0.2, PLAT + 0.2], [0.9, 0.17, PLAT + 0.2], [1.0, 0.24, GOLD, 1]], PLAT, Q(10)); for (let i = 0; i < 6; i++) B.box([0.17, 0, 0.18 + i * 0.13], [0.06, 0.18 - i * 0.008, 0.05], 0.02, i % 2 ? GOLD : GOLD + 0.2); });
    M.toe = mk(B => { B.tube([0, 0, 0], [1, 0, 0], 0.17, 0.14, GOLD, { seg: Q(7), cap0: 'round', cap1: 'round' }); B.box([0.5, 0, 0.12], [0.35, 0.09, 0.04], 0.02, GOLD + 0.2); });
    M.claw = mk(B => { B.crystal([0, 0, 0], [0.75, 0, -0.45], 0.13, CLAW, { n: 5, thin: 0.6, belly: 0.25, base: 0.9, bend: -0.25, up: [0, 1, 0] }); });
    /* ---- the tail: a feather segment (unit long along +z, blade across y), its last (a rose-crystal tip), the ribbons' heart pendant ---- */
    M.tseg = mk(B => blade(B, FTH, 1));
    M.ttip = mk(B => blade(B, FTH + 0.2, 0));
    yield;
    /* ---- the halo (radius 1, round its z axis: the halo's plane), the sockets, the inner and outer rings; the petal (along +z, 4.6 long) ---- */
    M.halo = K3((B, k) => {
      bring(B, 1, 0.032, 0.03, 0.012, RUNE, Q(96), null, null, GOLD); B.tor([0, 0, 0.032], 0.965, 0.008, GOLD + 0.2, { seg: Q(96), rseg: 4 }); B.tor([0, 0, 0.032], 1.035, 0.008, GOLD + 0.2, { seg: Q(96), rseg: 4 });
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, d = [cos(a), sin(a), 0], p = mul(d, 1.04); B.push(d, [-d[1], d[0], 0], [0, 0, 1], p); latheZ(B, [[-0.03, 0.035, GOLD], [0.02, 0.05, GOLD, 1], [0.05, 0.03, GOLD + 0.2]], GOLD, Q(10)); B.pop();
        const a2 = a + PI / 12, d2 = [cos(a2), sin(a2), 0]; B.push([0, 0, 1], d2, [-d2[1], d2[0], 0], mul(d2, 1.0)); heartGem(B, 0.05 + 0.01 * k, QTZ + 0.2, 0.012, 8); B.pop(); }
    });
    M.haloIn = mk(B => { bring(B, 1, 0.018, 0.02, 0.008, GOLD + 0.2, Q(80)); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; B.push([0, 0, 1], [cos(a), sin(a), 0], [-sin(a), cos(a), 0], [cos(a), sin(a), 0]); heartGem(B, 0.035, i % 2 ? GOLD : QTZ + 0.2, 0.01, 8); B.pop(); } });
    M.haloOut = mk(B => { B.tor([0, 0, 0], 1, 0.008, GOLD, { seg: Q(96), rseg: 4 }); for (let i = 0; i < 36; i++) { const a = i / 36 * TAU, a2 = a + TAU / 36, P = []; for (let j = 0; j <= 8; j++) { const u = j / 8, aa = lerp(a, a2, u), rr = 1 + 0.045 * sin(PI * u); P.push([cos(aa) * rr, sin(aa) * rr, 0]); } sweep(B, P, () => 0.006, GOLD, 4, 0.6); } });
    M.pcore = K3((B, k) => {
      const Lp = 4.6, W = u => 0.62 * pow(sin(PI * min(1, 0.04 + u * 0.98)), 0.7) * (1 - 0.3 * u) + 0.01;
      plate(B, { c: [[0, 0, 0.5], [0, 0, 0.5 + Lp * 0.33], [0, 0, 0.5 + Lp * 0.66], [0, 0, 0.5 + Lp]].map(p => [p[0], p[1], p[2] - 0.5 * 0]), nrm: [1, 0, 0], w: u => W(u), cup: -0.15, th: 0.12, nu: Q(14), nv: 3, mat: CER + 0.3, under: CER, rimMat: GOLD, trim0: 0.82, endTrim: 2 });
      sweep(B, [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => [0.075, 0, 0.6 + i / 8 * (Lp - 0.4)]), u => 0.05 * (1 - 0.6 * u), GOLD, Q(5), 0.6);
      for (const s of [1, -1]) { const pts = []; for (let i = 0; i <= 8; i++) { const u = 0.08 + i / 8 * 0.8; pts.push([0.07, s * W(u) * 0.55, 0.5 + u * Lp]); } strip(B, pts, () => [1, 0, 0], 0.06, CH, 0.01); }
      const O = heart2(Q(20)).map(p => [0.1, p[0] * 0.8, p[1] * 0.8 + 1.45]); O.push(O[0]); rail(B, O, 0.05, 0.07, GOLD); B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [0.04, 0, 1.45]); heartGem(B, 0.68, QTZ + 0.2, 0.16, 14); B.pop();
      latheZ(B, [[-0.05, 0.08, GOLD], [0.15, 0.2, GOLD, 1], [0.35, 0.16, PLAT + 0.2], [0.55, 0.22, GOLD, 1], [0.7, 0.1, GOLD]], GOLD, Q(10));
      for (const s of [1, -1]) B.crystal([0, s * 0.12, 0.45], [0, s * 0.45, 0.05], 0.06, GOLD, { n: 4, thin: 0.5, up: [1, 0, 0] });
      if (k >= 2) for (const s of [1, -1]) for (let i = 0; i < 3; i++) B.crystal([0, s * W(0.45 + i * 0.15) * 0.9, 0.5 + (0.45 + i * 0.15) * Lp], [0, s * (W(0.45 + i * 0.15) + 0.28), 0.5 + (0.38 + i * 0.15) * Lp], 0.05, QTZ, { n: 4, thin: 0.5, up: [1, 0, 0] });
      if (k >= 3) for (const s of [1, -1]) { const sp = []; for (let j = 0; j <= 10; j++) { const a = j / 10 * 4.5, rr = 0.3 * (1 - j / 13); sp.push([0.08, s * (0.25 + rr * (1 - cos(a))), 2.4 + rr * sin(a) * 1.4]); } sweep(B, sp, u => 0.03 * (1 - 0.5 * u), GOLD, 4, 0.6); }
    });
    M.pvane = mk(B => { const Lp = 3.9; plate(B, { c: [[0, 0.08, 0.9], [0, 0.4, 0.9 + Lp * 0.3], [0, 0.45, 0.9 + Lp * 0.66], [0, 0.12, 0.9 + Lp]], nrm: [1, 0, 0], w: u => 0.42 * pow(sin(PI * min(1, 0.05 + u)), 0.6) * (1 - 0.3 * u) + 0.01, cup: 0.2, th: 0.06, nu: Q(10), nv: 3, mat: FTH + 0.3, under: FTH + 0.3, rimMat: GOLD + 0.2, trim0: 0.85 }); });
    /* ---- effect parts (drawParts): a heart, the celestial heart, a lily ---- */
    M.heart = M.hlock;
    M.heartBig = mk(B => { for (let i = 0; i < 3; i++) { B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], [-0.25 * i, 0, 0]); heartGem(B, 6 * (1 - 0.16 * i), i ? QTZ + 0.3 : QTZ + 0.2, 1.1 - 0.25 * i, Q(26)); B.pop(); } const O = heart2(Q(40)).map(p => [0.2, p[0] * 6.6, p[1] * 6.6 + 0.5]); O.push(O[0]); rail(B, O, 0.2, 0.3, GOLD); });
    M.lily = mk(B => { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + (i % 2) * 0.1, d = [cos(a), sin(a), 0], tp = add(mul(d, 1.1), [0, 0, 0.9 + 0.2 * (i % 2)]); plate(B, { c: [mul(d, 0.08), add(mul(d, 0.35), [0, 0, 0.55]), add(mul(d, 0.8), [0, 0, 1.05]), tp], nrm: norm([-d[0], -d[1], 0.4]), w: u => 0.22 * pow(sin(PI * (0.05 + 0.9 * u)), 0.7) + 0.005, cup: 0.4, th: 0.03, nu: Q(7), nv: 3, mat: FTH + 0.3, under: FTH + 0.3, rimMat: FTH + 0.3, trim0: 0.95 }); }
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; B.tube([0, 0, 0.1], [cos(a) * 0.25, sin(a) * 0.25, 0.9], 0.015, 0.01, GOLD, { seg: 4 }); B.ell([cos(a) * 0.25, sin(a) * 0.25, 0.92], [0.04, 0.04, 0.07], GOLD + 0.2, { seg: 6, rings: 3 }); } });
    /* ---- the ribbons: strips rewritten every frame (silk: opaque pink satin; light: see-through energy) ---- */
    const NRS = LOQ ? 16 : 26;
    const ribbon = m => mk(B => B.surf((u, v) => [u, v, 0], NRS, 2, () => m, { e: (u, v) => v, a: u => u }));
    M.ribS = []; for (let i = 0; i < 16; i++) M.ribS.push(ribbon(RIB + 0.2));
    M.ribE = []; for (let i = 0; i < 12; i++) M.ribE.push(ribbon(RIB));
    M.ribN = NRS;
    yield;
    const bsph = m => { if (!m.pos) return; let cx = 0, cy = 0, cz = 0; const n = m.nv; for (let i = 0; i < n; i++) { cx += m.pos[i * 3]; cy += m.pos[i * 3 + 1]; cz += m.pos[i * 3 + 2]; } cx /= n; cy /= n; cz /= n; let r = 0; for (let i = 0; i < n; i++) r = max(r, hypot(m.pos[i * 3] - cx, m.pos[i * 3 + 1] - cy, m.pos[i * 3 + 2] - cz)); m.bs = [cx, cy, cz, r]; };
    eachOf(M, bsph);
    OUT.M = M; let nv = 0, nt = 0; eachOf(M, m => { nv += m.nv; nt += m.ntri; }); OUT.nv = nv; OUT.nt = nt; OUT.ready = true;
  }
  function eachOf(M, f) { for (const k in M) { const v = M[k]; if (Array.isArray(v)) v.forEach(m => { if (Array.isArray(m)) m.forEach(m2 => { if (m2 && m2.pos) f(m2); }); else if (m && m.pos) f(m); }); else if (v && v.pos) f(v); } }
  const LODPX = 560, OUTL = new Set(['torso', 'pskull', 'wbone', 'wsh', 'arch', 'thigh', 'orHead', 'orTorso', 'pcore', 'halo']);
  function data(lo) { if (lo) return DL || (DL = { ready: false, up: false, it: null, q: 0.45 }); return D || (D = { ready: false, up: false, it: null, q: 1 }); }
  function step(ms, lo) { const d = data(lo); if (d.ready) return true; if (typeof GLM === 'undefined') return false; d.it = d.it || gen(d.q, d); const until = nowMs() + ms; while (!d.ready && nowMs() < until) d.it.next(); return d.ready; }
  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0; const OWN = new Set();
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Gabriel GL: ' + String(e && e.message || e)); } catch (e2) {} };
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  function usable() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__GB_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
    return !(GLM.soft && !(flag('__GB_GL') === 1 || flag('__NG_GL') === 1));
  }
  let IDLE = 0;
  function warm() {
    if (!usable()) return false; const a = data(true), b = data(false); if ((a.up && b.up) || IDLE) return true; IDLE = 1;
    const go = () => { const run = ms => { try { const lo = !a.up; if (!step(ms, lo)) return go(); upload(lo); if (!(a.up && b.up)) return go(); } catch (e) { fail(e); } IDLE = 0; };
      if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => run(dl.didTimeout ? 3 : max(1, min(8, dl.timeRemaining() - 1))), { timeout: 200 }); else setTimeout(() => run(3), 30); };
    go(); return true;
  }
  /* (prewarming: one tiny pass with every mesh, in each shader path, uploads the buffers and compiles the program before the summon) */
  function upload(lo) { const d = data(lo); if (d.up || !d.ready || !GLM.ok()) return; const items = [];
    eachOf(d.M, mesh => { for (const fx of [0, 1]) items.push({ mesh, R0: new Float32Array([0.001, 0, 0]), R1: new Float32Array([0, 0.001, 0]), R2: new Float32Array([0, 0, 0.001]), T: new Float32Array(3), alpha: 1, glow: 0, kind: 0, wear: 0, fx }); });
    GLM.render(4, 4, { px: [1, 0, 0], py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 }, items); d.up = true; }
  function ensure(lo) { if (!usable()) return false; const d = data(lo); if (!d.ready) { try { step(1e9, lo); } catch (e) { fail(e); return false; } } return d.ready; }
  function release() { let n = 0; const fr = m => { if (m.gl) { n++; if (typeof GLM !== 'undefined' && GLM.free) GLM.free(m); else m.gl = null; } }; for (const d of [D, DL]) { if (!d || !d.M) continue; eachOf(d.M, fr); d.up = false; } OWN.forEach(fr); return n; }
  const gpuCount = () => { let n = 0; for (const d of [D, DL]) if (d && d.M) eachOf(d.M, m => { if (m.gl) n++; }); OWN.forEach(m => { if (m.gl) n++; }); return n; };

  /* ================= the pose ================= */
  const kOf = S => { const e = S && S.evo != null ? S.evo : 1; return e >= 7 ? 3 : e >= 4 ? 2 : 1; };
  function idle(evo, t) { const P = []; for (let i = 0; i < 12; i++) P.push({ home: 1, x: 0, y: 0, z: 0, ang: null, roll: 0, open: 0, glow: 0, s: 1 });
    return { t: t || 0, evo: evo || 1, lowFx: false, face: FACE0, fly: 0, legsFold: null, bank: 0, speed: 0, glide: 0, dive: 0, wing: 1, wingBeat: null, beat: 0, wingShape: 'full', wingMix: 1, glow: 0,
      aim: null, neck: { yaw: 0, pitch: 0 }, head: { yaw: 0, pitch: 0 }, beakOpen: 0, cry: 0, tailSwish: 0, tailSpread: 0, heartPulse: null, heartOpen: 0, heartSplit: 0, ringSpin: 1, heartGlow: 0,
      orPose: 'rest', orPoseMix: 1, orSide: 'R', orArmL: null, orArmR: null, orHandL: null, orHandR: null, orHead: { yaw: 0, pitch: 0, roll: 0 }, orTorso: { lean: 0, twist: 0, bend: 0 },
      orStruggle: 0, orGlow: 0, orRise: 0, orRiseH: null, restraintsOpen: 0, wristOpen: 0, crownOpen: 0, ribbons: 0.5, haloSpin: null, haloScale: 1, haloTilt: 0, haloGlow: 0, petals: P, enter: 1, dissolve: 0, alpha: 1 }; }
  const WSHAPE = { fold: [1.25, -0.35, 1.7, -0.75, 1.75, -1.25, 0.15], full: [0.1, 1.1, -0.02, 1.2, -0.28, 1.05, 1], heart: [0.05, 1.05, -0.35, 0.95, -1.05, 0.15, 0.85], attack: [-0.35, 0.35, -0.55, 0.2, -0.45, -0.05, 0.9], ult: [0.08, 1.1, 0.0, 1.25, -0.2, 1.2, 1.15] };
  const GEST = { rest: [0.35, 0.3, 0.25, 0.3, 0.1], open: [0.05, 0.05, 0.05, 0.1, 0.4], prayer: [0.02, 0.02, 0.02, 0.15, 0], point: [1.3, 1.4, 1.0, 0.9, 0.1], cast: [0.75, 0.6, 0.4, 0.5, 0.3], fist: [1.5, 1.6, 1.2, 1.0, 0] };
  /* the named poses: each arm's wrist target (oracle frame, the +y arm; mirrored for -y), the elbow's pole, the palm's facing, the gesture, the head's pitch */
  const OPOSE = { rest: null, pray: { w: [0.62, 0.07, 1.95], p: [-0.3, 1, -1], pf: [0, -1, 0.2], g: 'prayer', hp: -0.45 }, open: { w: [1.25, 1.35, 1.85], p: [0, 1, -1], pf: [0.5, 0, 1], g: 'open', hp: -0.15 },
    raise2: { w: [0.35, 0.72, 5.05], p: [0.3, 1, 0], pf: [0.6, 0.3, 0], g: 'open', hp: 0.35 }, spread: { w: [0.35, 3.45, 2.55], p: [0, 0, -1], pf: [1, 0.3, 0], g: 'open', hp: 0.08 }, cast: { w: [1.95, 0.75, 2.6], p: [0, 1, -0.5], pf: [1, 0, 0.2], g: 'cast', hp: 0 },
    clasp: { w: [0.72, 0.05, 2.55], p: [-0.3, 1, -1], pf: [0, -1, 0], g: 'prayer', hp: 0.15 }, raise1: { w: [0.3, 0.95, 5.15], p: [0.3, 1, 0], pf: [0.8, 0, 0], g: 'point', hp: 0.3 } };

  /* ================= the solver: every part's place, and the anchors (put(mesh, ix, R, T, sc, op, ordW) receives the parts) ================= */
  const LW = norm([-0.45, 0.42, 0.8]), SBW = norm([-0.3, -0.2, 0.92]), RIMW = norm([0.65, -0.62, 0.42]), PXW = [1, 0, 0], PYW = [0, SE, -CE], PDW = [0, CE, SE], UPW = [0, 0, 1];
  const RIMC = [1.25, 0.82, 1.05], AMBC = [1.05, 1.0, 1.04], OUTC = [0.06, 0.03, 0.06], GLCAP = 1600;
  const RBN = []; let NRB = 0, NRE = 0;   // (the ribbons this pass: their centrelines)
  function solve0(S, X0, Y0, size, opts, put, spec, lod) {
    opts = opts || {}; const k = kOf(S), K = size / HEIGHT[k], tile = opts.tile || size / 2.6, still = !!opts.still, low = !!(S.lowFx || lowFx() || opts.low);
    let st = S._gb || (S._gb = {}); const t = num(S.t, 0); let dt = st.t == null || still ? 0 : t - st.t; if (!(dt >= 0) || dt > 0.5) { if (st.t != null && !still) { S._gb = st = {}; } dt = 0; } dt = min(dt, 0.1);
    const snap = still || st.t == null; st.t = t; NRB = 0; NRE = 0; RBN.length = 0;
    const out = st.out || (st.out = { feet: [{}, {}], petals: [], slots: [], tailTips: [], eyes: [[0, 0], [0, 0]] }); const zT = 1 / (CE * K) * tile, yT = tile / (SE * K), xT = tile / K;
    const ent = cl(num(S.enter, 1)), dis = cl(num(S.dissolve, 0)), lv = 1 - dis * 0.8, evE = n => sstep(n[0], n[1], ent);
    /* ---- the heading, flight ---- */
    const flyT = S.flyTiles != null ? max(0, num(S.flyTiles, 0)) * zT : max(0, num(S.fly, 0)) * 0.55 * HEIGHT[k], fly = f2(st, 'fly', flyT, 4, 0.9, dt, snap), air = f1(st, 'air', sstep(0.3, 2.5, fly), 3.2, dt, snap), flyV = f1(st, 'flyV', dt > 0 && st.fly0 != null ? (fly - st.fly0) / dt : 0, 6, dt, snap); st.fly0 = fly;
    const toff = cl(flyV * 0.22) * air, land = cl(-flyV * 0.26) * (1 - sstep(2.5, 7, fly)) * sstep(0, 0.8, fly);
    const glide = f1(st, 'gl', cl(num(S.glide, 0)) * air, 3, dt, snap), spd = f1(st, 'spd', cl(num(S.speed, 0)) * air, 3, dt, snap), dive = f2(st, 'dive', max(-1, min(1, num(S.dive, 0))) * air, 4, 0.8, dt, snap);
    const face = num(S.face, FACE0); let yawT = atan2(sin(face) / SE, cos(face));
    if (!S.faceFree) { const lim = lerp(YAWLIM, 1.3, air); yawT = PI / 2 + max(-lim, min(lim, angD(yawT, PI / 2))); }
    const yaw = fa(st, 'yaw', yawT, 4, dt, snap), yr = st.yaw0 == null || !dt ? 0 : angD(yaw, st.yaw0) / dt; st.yaw0 = yaw; const yrs = f1(st, 'yr', yr, 8, dt, snap);
    /* the wingbeat: GA's phase, else our own (a fast downstroke over 42% of the cycle) */
    const ownB = S.wingPhase == null, beatA = f1(st, 'beatA', cl(max(num(S.wingBeat, 0), num(S.beat, 0), air * (1 - glide * 0.9) * (0.55 + 0.4 * toff))), 4, dt, snap);
    const bph = ownB ? (st.bph = (st.bph || 0) + dt * (0.55 + 0.35 * toff + 0.2 * spd) * TAU) : num(S.wingPhase, 0), bq = ((bph / TAU) % 1 + 1) % 1, bw = bq < 0.42 ? 0.5 * bq / 0.42 : 0.5 + 0.5 * (bq - 0.42) / 0.58, flap = cos(TAU * bw) * beatA;
    const kick = f2(st, 'kick', cl(num(S.wingKick, 0)), 9, 0.5, dt, snap), heave = -sin(TAU * bw) * beatA * 0.6 + kick * 0.4;
    const bank = f2(st, 'bank', max(-1, min(1, num(S.bank, 0) * 0.45 + air * max(-0.5, min(0.5, -yrs * 0.3)))), 4, 0.75, dt, snap);
    const brth = sin(t * 1.2) * lv, pitch = air * (0.3 * spd + 0.4 * dive - 0.12 * (1 - spd) - 0.25 * toff - 0.2 * land) + 0.02 * brth;
    const lift = fly + air * (0.35 * sin(t * 1.5) + heave) + (1 - evE([0.3, 0.6])) * -2 + 0.06 * brth;
    const BODYC = [0, 0, 14], Mb = mm(rx(bank), ry(pitch + num(S.viewPitch, 0))), tbo = [0, 0, lift];
    const BP = p => add(add(mv(Mb, sub(p, BODYC)), BODYC), tbo), BR = R => mm(Mb, R);
    const Rroot = rz(yaw), W3 = p => { const q2 = mv(Rroot, p); return [q2[0] * WS, q2[1] * WS, q2[2] * WS]; };
    const kk = K / WS, SX = w => X0 + w[0] * kk, SY = w => Y0 + (w[1] * SE - w[2] * CE) * kk, scr = p => { const w = W3(p); return [SX(w), SY(w)]; };
    const scrO = (p, o2) => { const s2 = scr(p); o2.x = s2[0]; o2.y = s2[1]; return o2; };
    const Ry0 = rz(-yaw), w2b = p => mv(Ry0, p), b2w = p => mv(Rroot, p);   // (world-aligned model units <-> body frame)
    const tiles = p => { const w = b2w(p); return [w[0] / xT, w[1] / yT, w[2] / zT]; };
        /* ---- the torso ---- */
    put('torso', null, Mb, BP([0, 0, 0]), 1, { d0: 0.5 }, [0.35, 0.55]);
    out.body = scrO(BP([0, 0, 15]), out.body || {}); out.body.r = 8 * K; out.shadow = scrO([0.3, 0, 0], out.shadow || {}); out.shadow.r = 6.5 * K * (1 - 0.4 * air); out.flyH = fly / zT;
    /* ---- the Heart of Eden ---- */
    const hpul = S.heartPulse == null ? pow(max(0, sin(t * 6.9)), 8) * 0.6 + pow(max(0, sin(t * 6.9 - 0.9)), 10) * 0.35 : cl(num(S.heartPulse, 0));
    const hOpen = f2(st, 'hOp', cl(num(S.heartOpen, 0)), 5, 0.75, dt, snap), hSpl = f2(st, 'hSp', cl(num(S.heartSplit, 0)), 5, 0.7, dt, snap), hGl = num(S.heartGlow, 0) + hpul * 0.6;
    const rsp = st.rsp = (st.rsp || 0) + dt * (0.6 + 0.4 * hpul) * max(0, num(S.ringSpin, 1));
    if (!spec) {
      const hs = 1 + 0.025 * hpul;
      for (let si = 0; si < 3; si++) { const tm = (SEGT[si][0] + SEGT[si][1]) / 2, c = hP(tm); for (const sg of [1, -1]) { const pv = [c[0], sg * c[1], c[2]], o = norm([0.25, pv[1], pv[2] - HZ + 0.8]), off = mul(o, hSpl * (1.1 + 0.3 * si)), rr = axisR([0, -o[2], o[1]], hSpl * 0.12 * (si - 1) * sg);
        const R0 = mm(rr, mm(sg > 0 ? I3 : MY, scl3(1, hs, hs))); put('arch', [k, si], BR(R0), BP(sub(add(pv, off), mv(R0, c))), 1, { d0: 0.88, glow: hGl * 0.3, g2: S.glow || 0, kind: si * 0.3 }, [0.08, 0.25]); } }
      put('hback', k, Mb, BP([0, 0, 0]), 1, { d0: 0.95, glow: 0.9 + hGl, g2: hpul }, [0.0, 0.15]);
      put('hglow', null, BR(scl3(0.5, HW * 0.36, HW * 0.4)), BP([HX - 1.7, 0, HZ - 0.9]), 1, { d0: 0.96, glow: 0.6 + hGl, alpha: 0.55 + 0.3 * hpul, noInk: 1 }, [0.0, 0.15]);
      for (const sg of [1, -1]) { const a = hOpen * 1.45, pc = [HX + 0.2, HW * 0.47, HZ + 1.6], piv = [pc[0], sg * pc[1], pc[2]], R0 = mm(rz(sg * a), sg > 0 ? I3 : MY); put('hlobe', null, BR(R0), BP(sub(piv, mv(R0, pc))), 1, { alpha: 0.98, d0: 0.8, glow: 0.3 + hGl * 0.5 }, [0.1, 0.3]); }
      // the chest plates round the rim (fewer in the game's LOD), unfolding like petals
      const NCP = lod ? 12 : 18;
      for (let i = 0; i < NCP * 2; i++) { const r2 = i >= NCP, t2 = 0.25 + ((i % NCP) + (r2 ? 1 : 0.5)) / NCP * (TAU - 0.5), sR = r2 ? 1.12 : 1.04, xR = r2 ? HX - 0.6 : HX - 0.25, p = hP(t2, sR, xR), p2 = hP(t2 + 0.02, sR, xR), tg = norm(sub(p2, p)), o = norm([0, p[1], p[2] - HZ]), nW = norm([1, 0, 0]);
        const op = hOpen * (0.9 + 0.2 * hash(i)) + hSpl * 0.3, d = norm(add(mul(o, cos(0.5 + op)), mul(nW, sin(0.5 + op) * 0.9))), xA = norm(cross(tg, d)), R0 = colsR(xA, tg, d);
        put('cplate', null, BR(mm(R0, scl3(1, r2 ? 1.6 : 1.35, (r2 ? 1.55 : 1.25) + 0.2 * (k - 1)))), BP(add(p, mul(o, 0.25 * hSpl))), 1, { d0: 0.45 }, [0.38, 0.55]); }
      // the containment rings round the oracle (gyroscopic: each its own axis, faster when attacking)
      for (let i = 0; i < k + 1; i++) { const r = [3.6, 4.05, 4.5, 4.95][i], ax = mm(rz(0.6 * i + rsp * 0.2 * (i % 2 ? -1 : 1)), rx(0.3 + 0.22 * i + sin(rsp * 0.5 + i) * 0.12)), Rr = mm(ax, rz(rsp * (1.1 + 0.4 * i) * (i % 2 ? -1 : 1)));
        put('cring', i % 3, BR(mm(Rr, scl3(r))), BP(add(HC, [-0.2, 0, -0.9 + 0.7 * i])), 1, { d0: 0.82, glow: 0.3 + hGl * 0.4, kind: i }, [0.1 + 0.03 * i, 0.25]); }
      out.lotus = scrO(BP([1.5, 0, 9.3]), out.lotus || {}); out.heart = scrO(BP(HC), out.heart || {}); out.heart.r = HW * 0.45 * K * (dis > 0.85 ? 1 - sstep(0.85, 1, dis) * 0.85 : 1);
    }
    /* ---- the Bound Oracle ---- */
    const rise = f2(st, 'rise', cl(num(S.orRise, 0)), 2.6, 0.85, dt, snap), resO = f2(st, 'resO', cl(num(S.restraintsOpen, 0)), 4, 0.8, dt, snap), wrO = max(resO, f2(st, 'wrO', cl(num(S.wristOpen, 0)), 5, 0.75, dt, snap));
    const strg = cl(num(S.orStruggle, 0)), orGl = num(S.orGlow, 0), ribK = cl(num(S.ribbons, 0.5));
    const riseH = S.orRiseH == null ? 24 : max(24, num(S.orRiseH, 1.2) * zT), osc = 1.72 * (1 + 0.3 * sstep(0.2, 1, rise));
    const OP = add(OPEL, [2.2 * sin(PI * min(1, rise * 1.4)) * (1 - rise * 0.5) + 2.6 * sstep(0.5, 1, rise), 0, riseH * sstep(0.05, 1, rise)]);
    const tor = S.orTorso || {}, oLean = num(tor.lean, 0) + strg * 0.05 * sin(t * 7.3), oTw = num(tor.twist, 0) + strg * 0.08 * sin(t * 5.1), oBend = num(tor.bend, 0) + 0.025 * sin(t * 0.9) * lv;
    const MoR = mm(rz(oTw), mm(ry(-oLean), rx(oBend))), Mo = BR(mm(MoR, scl3(osc))), OPw = BP(OP);
    const OB = p => add(OPw, mv(Mo, p));   // (oracle frame -> body frame, posed)
    if (!spec) {
      put('orLow', k, Mo, OPw, 1, { d0: 0.62, glow: orGl * 0.3 }, [0.15, 0.3]);
      put('orTorso', k, Mo, OPw, 1, { d0: 0.64, glow: orGl * 0.3 }, [0.15, 0.3]);
      put('lotus', null, BR(scl3(1.45 + 0.1 * k)), BP([1.5, 0, 8.9]), 1, { d0: 0.75, glow: 0.3 + hGl * 0.3 }, [0.05, 0.2]);
      // the head: its own turn (+ yaw toward its left: screen right when facing the viewer)
      const pz = OPOSE[S.orPose] ? S.orPose : 'rest', PW = { pray: S.orPray, raise2: S.orRaise, spread: S.orSpread, raise1: S.orCast, open: S.orOpen, cast: S.orDirect, clasp: S.orClasp };
      for (const kz in OPOSE) f1(st, 'pm_' + kz, max(kz === pz ? cl(num(S.orPoseMix, 1)) : 0, cl(num(PW[kz], 0))), 6, dt, snap);
      const oSide = S.orCastSide || S.orSide || 'R';
      const pmix = kz => st['pm_' + kz] || 0;
      let hpA = 0; for (const kz in OPOSE) if (OPOSE[kz]) hpA += OPOSE[kz].hp * pmix(kz);
      const oh = S.orHead || {}, ohY = -num(oh.yaw, 0) + strg * 0.15 * sin(t * 3.3) + 0.04 * sin(t * 0.7) * lv, ohP = num(oh.pitch, 0) + hpA, ohR = num(oh.roll, 0);
      const Rh = mm(Mo, mm(rz(ohY), mm(ry(-ohP), rx(ohR)))), HDP = OB(OHEAD);
      put('orHead', k, Rh, HDP, 1, { d0: 0.66, glow: orGl, g2: orGl }, [0.18, 0.3]);
      out.orHead = scrO(HDP, out.orHead || {}); out.mask = scrO(add(HDP, mv(Rh, [0.35, 0, 0.04])), out.mask || {}); out.oracle = scrO(OB([0.2, 0, 1.75]), out.oracle || {});
      // the crown: spikes round the brow; opening, they swing back into a ring behind the head
      const cOp = f2(st, 'cOp', cl(num(S.crownOpen, 0)), 4, 0.8, dt, snap), ncs = 5 + 2 * k, crA = st.crA = (st.crA || 0) + dt * 0.5 * cOp;
      for (let i = 0; i < ncs; i++) { const u = ncs > 1 ? i / (ncs - 1) : 0.5, a0 = lerp(-1.25, 1.25, u), L0 = (0.55 + 0.45 * cos(a0 * 1.1) + 0.12 * (k - 1)) * 1.3, aR = i / ncs * TAU + crA;
        const base = lerp3([0.22 * cos(a0), 0.3 * sin(a0), 0.36], [-0.32, 0.58 * sin(aR), 0.12 + 0.58 * cos(aR)], cOp), dir = norm(lerp3([0.25 * cos(a0), 0.55 * sin(a0), 1], [0, sin(aR), cos(aR)], cOp));
        const R0 = frameZ(dir, [1, 0, 0]); put('crownSp', null, mm(Rh, mm(R0, scl3(1, 1, L0 * (1 + 0.4 * cOp)))), add(HDP, mv(Rh, base)), 1, { d0: 0.66, glow: 0.2 + orGl * 0.5 + cOp * 0.6 }, [0.2, 0.32]); }
      out.crown = scrO(add(HDP, mv(Rh, lerp3([0, 0, 0.75], [-0.32, 0, 0.12], cOp))), out.crown || {}); out.crown.r = (0.5 + 0.6 * cOp) * K * osc;
      // the arms: the named pose's IK, the raw angles over it, the struggle's tug
      const raw = (A, sg) => { A = A || {}; const up = num(A.up != null ? A.up : A.sh, -0.12), fw = num(A.fwd, 0.08), el = num(A.el, 0.15), d1 = [sin(fw) * cos(up), sg * cos(fw) * cos(up), sin(up)], ax = norm(cross(d1, [1, 0, 0])), d2 = mv(axisR(mul(ax, sg), el * sg), d1);
        const sh = [OSH[0], sg * OSH[1], OSH[2]], E = add(sh, mul(d1, OL1)), Wp = add(E, mul(d2, OL2)); return { W: Wp, P: sub(E, lerp3(sh, Wp, 0.5)), pf: mv(axisR(d2, num(A.tw, 0) * sg), [1, 0, 0.15]) }; };
      const CUF = [];
      for (const sg of [1, -1]) { const Ls = sg > 0 ? 'R' : 'L', sh = [OSH[0], sg * OSH[1], OSH[2]];
        let W = null, Pp = null, pf = null, gw = 0, gk = null; const base = raw(null, sg); W = base.W; Pp = base.P; pf = base.pf;
        for (const kz in OPOSE) { const o = OPOSE[kz], m2 = pmix(kz); if (!o || m2 < 0.001) continue; let w = o.w, pp = o.p, fo = o.pf;
          if (kz === 'raise1' && (oSide === 'R') !== (sg > 0)) { w = [0.6, 1.6, 1.35]; pp = [0, 1, -1]; fo = [1, 0, 0]; }
          W = lerp3(W, [w[0], sg * w[1], w[2]], m2); Pp = lerp3(Pp, [pp[0], sg * pp[1], pp[2]], m2); pf = lerp3(pf, [fo[0], sg * fo[1], fo[2]], m2); if (m2 > gw) { gw = m2; gk = kz === 'raise1' && (oSide === 'R') !== (sg > 0) ? 'rest' : o.g; } }
        const A = sg > 0 ? S.orArmR : S.orArmL; if (A) { const r2 = raw(A, sg), am = cl(num(S.orArmMix, 1)); W = lerp3(W, r2.W, am); Pp = lerp3(Pp, r2.P, am); pf = lerp3(pf, r2.pf, am); }
        if (strg > 0) W = add(W, [0, sg * strg * 0.12 * (0.5 + 0.5 * sin(t * 9 + sg)), -strg * 0.05]);
        const sm = st['ow' + sg] = st['ow' + sg] && !snap ? lerp3(st['ow' + sg], W, 1 - exp(-dt * 14)) : W; W = sm;
        const r = ik(sh, W, OL1, OL2, Pp), E = r.K, Wq = r.A, d1 = norm(sub(E, sh)), d2 = norm(sub(Wq, E));
        put('orUA', null, mm(Mo, mm(frameZ(d1, [1, 0, 0]), scl3(1, 1, OL1 / 1.45))), OB(sh), 1, { d0: 0.64 }, [0.18, 0.32]);
        put('orFA', null, mm(Mo, mm(frameZ(d2, [1, 0, 0]), scl3(1, 1, OL2 / 1.4))), OB(E), 1, { d0: 0.64 }, [0.18, 0.32]);
        // the hand: x along it, z the palm's facing; fingers (index..little) and the thumb, curled by the gesture
        const hz = norm(sub(pf, mul(d2, dot(pf, d2)))), hy = cross(hz, d2), RH0 = colsR(d2, hy, hz), Hm = mm(Mo, RH0);
        const HD = (sg > 0 ? S.orHandR : S.orHandL) || {}, gN = HD.g || gk || 'rest', G = GEST[gN] || GEST.rest, opn = cl(num(HD.open, gN === 'open' ? 1 : 0));
        const gst = st['g' + sg] || (st['g' + sg] = G.slice()); for (let j = 0; j < 5; j++) gst[j] = snap ? G[j] : lerp(gst[j], lerp(G[j], GEST.open[j], opn * 0.6), 1 - exp(-dt * 10));
        put('orPalm', null, Hm, OB(Wq), 1, { d0: 0.64 }, [0.2, 0.32]);
        const nPh = lod ? 1 : 3;
        for (let f = 0; f < 5; f++) { const th = f === 4, rootP = th ? [0.1, sg * 0.14, 0.02] : [0.4, sg * (1.5 - f) * 0.085, 0], cu = th ? gst[3] : gst[min(2, f)] * (1 + 0.1 * (f - 1)), spr = sg * gst[4] * (1.5 - f) * 0.35;
          const R1 = th ? mm(rz(sg * 0.9), ry(-0.3)) : rz(spr), P1 = mv(Hm, rootP), Lph = th ? [0.2, 0.17] : [0.2, 0.15, 0.12];
          let Pc = add(OB(Wq), P1), Rc = mm(Hm, R1);
          for (let j = 0; j < (th ? (lod ? 1 : 2) : nPh); j++) { const Lj = Lph[j] * (th ? 1 : f === 3 ? 0.82 : f === 0 ? 0.92 : 1) * (lod && !th ? 2.3 : 1); Rc = mm(Rc, ry(-cu * (j ? 0.9 : 0.7)));
            put('orPh', null, mm(Rc, scl3(Lj, 0.11, 0.11)), Pc, 1, { d0: 0.64 }, [0.2, 0.32]); Pc = add(Pc, mul(mv(Rc, [1, 0, 0]), Lj)); } }
        out['hand' + Ls] = scrO(add(OB(Wq), mv(Hm, [0.35, 0, 0])), out['hand' + Ls] || {});
        // the wrist cuff (two halves that unfold) and its heart lock; the chain to the arch; the binding of light
        const cuR = frameZ(d2, [0, 0, 1]), cuC = OB(add(Wq, mul(d2, -0.18))); CUF[sg > 0 ? 1 : 0] = cuC;
        for (const h of [0, 1]) put('cuff', null, mm(Mo, mm(cuR, mm(rz(h * PI + (h ? 1 : -1) * wrO * 0.9), scl3(0.17, 0.17, 0.5)))), cuC, 1, { d0: 0.6, glow: 0.1 }, [0.25, 0.38]);
        put('hlock', null, mm(Mo, scl3(0.55)), add(cuC, mv(Mo, mv(cuR, [0.2, 0, 0]))), 1, { d0: 0.6, glow: 0.3 + hGl * 0.3 }, [0.25, 0.38]);
        chain(cuC, BP(hP(0.95 + 0.42 * 1, 1.0, HX - 0.15).map((v, i) => i === 1 ? v * sg : v)), 9, 0.35, 'cw' + sg, true);
        if (k >= 2) chain(cuC, BP(hP(2.0, 1.0, HX - 0.15).map((v, i) => i === 1 ? v * sg : v)), 8, 0.6, 'cw2' + sg, true);
      }
      // the waist and lower cuffs and their chains to the arches' lower segments; the seals at the anchors
      const WAI = OB([0, 0, 0.2]), LOW = OB([0, 0, -1.4]);
      put('cuff', null, mm(Mo, mm(rz(-PI / 2 - resO * 0.8), scl3(0.42, 0.42, 0.4))), WAI, 1, { d0: 0.6 }, [0.25, 0.38]); put('cuff', null, mm(Mo, mm(rz(PI / 2 + resO * 0.8), scl3(0.42, 0.42, 0.4))), WAI, 1, { d0: 0.6 }, [0.25, 0.38]);
      put('cuff', null, mm(Mo, mm(rz(-PI / 2 - resO * 0.8), scl3(0.47, 0.47, 0.32))), LOW, 1, { d0: 0.6 }, [0.25, 0.38]); put('cuff', null, mm(Mo, mm(rz(PI / 2 + resO * 0.8), scl3(0.47, 0.47, 0.32))), LOW, 1, { d0: 0.6 }, [0.25, 0.38]);
      put('hlock', null, mm(Mo, scl3(0.8)), OB([0.47, 0, 0.15]), 1, { d0: 0.6, glow: 0.3 + hGl * 0.3 }, [0.25, 0.38]);
      for (const sg of [1, -1]) { const aW = BP([HX - 0.15, sg * hP(2.35)[1], hP(2.35)[2]]), aL = BP([HX - 0.15, sg * hP(2.75)[1], hP(2.75)[2]]);
        chain(add(WAI, mv(Mo, [0, sg * 0.4, 0])), aW, 8, 0.4, 'cwa' + sg, false); chain(add(LOW, mv(Mo, [0, sg * 0.45, 0])), aL, 6, 0.3, 'clo' + sg, false);
        if (!lod) for (const [tt, ii] of [[1.37, 0], [2.35, 1], [2.75, 2], [2.0, 3]]) { if (ii === 3 && k < 2) continue; const p = hP(tt, 1.0, HX + 0.18); put('seal', null, BR(rx(sg * (rsp * 1.5 + ii))), BP([p[0], sg * p[1], p[2]]), 1, { d0: 0.85, glow: 0.4 + hGl * 0.4, kind: ii }, [0.2, 0.35]); } }
      // the ribbons: the hair and veil from the back of its head (more and longer by form, longer when unbound); the bindings of light from
      // the cuffs (stretching into ribbons as the restraints open); the threads that keep the risen oracle joined to the heart
      const nhr = (lod ? max(3, NHR[k] - 2) : NHR[k]) - (low ? 2 : 0);
      for (let i = 0; i < nhr; i++) { const sg = i % 2 ? -1 : 1, j = floor(i / 2), L = (3.2 + 1.1 * j + 1.4 * ribK + 2.5 * rise) * osc, root = add(HDP, mv(Rh, [-0.28, sg * (0.12 + 0.05 * j), 0.18 - 0.08 * j]));
        const dirO = norm(mv(Mo, [-0.35 - 0.1 * j, sg * (0.75 + 0.15 * j), -0.55 + 0.12 * j])), wv = 0.35 + 0.15 * ribK;
        ribbonPath(root, u => add(mul(dirO, L * u), mv(Mo, [0, sg * L * 0.15 * u * u, -L * 0.25 * u * u + sin(u * 5.5 - t * 1.8 + i) * wv * u])), 0.16 * osc, u => 1 - 0.55 * u, true, 'hr' + i, 0.66, 0.15 + orGl * 0.2);
      }
      for (const sg of [1, -1]) { const a = CUF[sg > 0 ? 1 : 0], anc = BP(hP(1.25, 1.0, HX - 0.1).map((v, i) => i === 1 ? v * sg : v));
        const L2 = 1 + resO * 2.2;
        ribbonPath(a, u => add(mul(sub(anc, a), u * L2 * (1 - resO * 0.6)), [sin(u * 7 - t * 3.1 + sg) * 0.18 * (1 + 2 * resO) * sin(PI * u), sg * resO * 1.6 * u * u, resO * (sin(u * 4 - t * 1.4) * 1.2 - 2.0 * u * u)]), 0.09 + 0.08 * resO, u => 1 - 0.4 * u, false, 'bd' + sg, 0.6, 0.6 + hGl * 0.4); }
      if (rise > 0.02) for (let i = 0; i < 4; i++) { const sg = i % 2 ? -1 : 1, a = BP(add(HC, [0.6, sg * 0.4 * i, 0])), b = OB([0, sg * 0.25 * (i >> 1), -2.0]);
        ribbonPath(a, u => add(mul(sub(b, a), u), [sin(u * 6 - t * 2.4 + i * 1.7) * 0.6 * sin(PI * u), sg * sin(PI * u) * (0.8 + 0.6 * i), 0]), 0.2 * rise, () => 1, false, 'rs' + i, 0.6, 0.8); }
    }
    out.handL = out.handL || { x: 0, y: 0 }; out.handR = out.handR || { x: 0, y: 0 };
    /* ---- the neck (a spline of vertebrae from the shoulders to the head) and the head ---- */
    const cry = f2(st, 'cry', cl(num(S.cry, 0)), 6, 0.6, dt, snap), nk = typeof S.neck === 'object' && S.neck || { pitch: num(S.neck, 0) * 0.25 }, hd = S.head || { yaw: num(S.headYaw, 0), pitch: num(S.headPitch, 0) }, AIM = S.aim || S.look;
    let aimY = 0, aimP = 0; if (AIM && S.x != null && S.y != null) { const dx = (num(AIM.x, 0) - S.x) * xT, dy = (num(AIM.y, 0) - S.y) * yT, b = w2b([dx, dy, -18]); aimY = atan2(b[1], max(0.3, b[0])); aimP = atan2(b[2] + 4, hypot(b[0], b[1])) * 0.6; }
    else { aimY = -0.8 + 0.35 * hold(t, 3.1, 1.7) * lv; aimP = 0.08 * hold(t, 2.3, 4.1) * lv; }
    const hYaw = f1(st, 'hY', max(-1.5, min(1.5, aimY - num(hd.yaw, 0))), 5, dt, snap), hPit = f1(st, 'hP', max(-0.9, min(1.0, aimP + num(hd.pitch, 0) + cry * 0.9)), 6, dt, snap);
    const nY = -num(nk.yaw, 0) + hYaw * 0.3, nP = num(nk.pitch, 0) + cry * 0.15;
    const hTarget = add(NROOT, mv(mm(rz(nY), ry(-nP)), sub(add(HREST, [-cry * 0.9, 0, cry * 0.8 + 0.15 * (k - 1)]), NROOT)));
    const hW = BP(hTarget), hlag = st.hl && !snap ? lerp3(st.hl, hW, 1 - exp(-dt * 12)) : hW; st.hl = hlag;
    const Rhd = BR(mm(rz(hYaw), ry(-hPit))), hx = mv(Rhd, [1, 0, 0]), r0 = BP(NROOT), up0 = mv(Mb, [0, 0, 1]);
    const NC = [r0, add(r0, mul(up0, 2.6)), sub(hlag, add(mul(hx, 2.2), mul(up0, 0.8))), hlag];
    const nn = lod ? NNV[k] - 3 : NNV[k];
    for (let i = 0; i < nn; i++) { const u0 = i / nn, u1 = (i + 1) / nn, a = bz(NC, u0), b = bz(NC, u1), d = sub(b, a), dn = norm(d), fw = norm(sub(hx, mul(dn, dot(hx, dn)))), R0 = colsR(fw, cross(dn, fw), dn), rr = lerp(1.75, 1.1, u0);
      put('nvert', k, mm(R0, scl3(rr, rr, len(d))), a, 1, { d0: 0.5 + 0.01 * i, g2: S.glow || 0, kind: u0 }, [0.5, 0.65]); }
    const bko = f1(st, 'bk', cl(num(S.beakOpen, 0) + cry * 0.8), 14, dt, snap), hsc = 2.3 + 0.06 * k;
    put('pskull', k, mm(Rhd, scl3(hsc)), hlag, 1, { d0: 0.52, glow: 0.3 }, [0.52, 0.66]);
    const hin = [0.35, 0, -0.18], Rj = ry(bko * 0.6); put('pjaw', null, mm(Rhd, mm(scl3(hsc), Rj)), add(hlag, mv(Rhd, mul(sub(hin, mv(Rj, hin)), hsc))), 1, { d0: 0.52 }, [0.52, 0.66]);
    const ncr = (lod ? 5 : 7) + k;
    for (let i = 0; i < ncr; i++) { const u = i / (ncr - 1), sd = u * 2 - 1, fl = cry * 0.5 + 0.06 * sin(t * 2 + i) * lv, L = (1.3 + 0.8 * (1 - abs(sd)) + 0.15 * k) * (1 + 0.15 * cry), dirC = norm([-1, sd * (0.5 + fl), 0.25 + 0.35 * (1 - abs(sd)) + fl]);
      put('crest', null, mm(Rhd, mm(frameZ(dirC, [0, 0, 1]), scl3(hsc, 2.2 * hsc, L * hsc))), add(hlag, mv(Rhd, [-0.2, sd * 0.25, 0.75])), 1, { d0: 0.5, g2: S.glow || 0 }, [0.55, 0.68]); }
    out.head = scrO(hlag, out.head || {}); const btip = add(hlag, mv(Rhd, [2.35 * hsc, 0, -0.62 * hsc])), bs1 = scr(btip), bs0 = scr(add(hlag, mv(Rhd, [1.2, 0, -0.1]))), bl = hypot(bs1[0] - bs0[0], bs1[1] - bs0[1]) || 1;
    out.beak = { x: bs1[0], y: bs1[1], dx: (bs1[0] - bs0[0]) / bl, dy: (bs1[1] - bs0[1]) / bl };
    for (let s = 0; s < 2; s++) { const e = scr(add(hlag, mv(Rhd, [0.6 * hsc, (s ? -0.45 : 0.45) * hsc, 0.35 * hsc]))); out.eyes[s][0] = e[0]; out.eyes[s][1] = e[1]; }
    /* ---- the wings ---- */
    const wsh = S.wingShape && WSHAPE[S.wingShape] ? S.wingShape : 'full', wSp = f1(st, 'wsp', cl(num(S.wing, 0.8)), 4, dt, snap), wMix = cl(num(S.wingMix, 1));
    const shp = st.wshp || (st.wshp = WSHAPE[wsh].slice()); for (let i = 0; i < 7; i++) shp[i] = snap ? lerp(WSHAPE.full[i], WSHAPE[wsh][i], wMix) : lerp(shp[i], lerp(WSHAPE.full[i], WSHAPE[wsh][i], wMix), 1 - exp(-dt * 5));
    const glw = cl(max(num(S.glow, 0), num(S.wingPulse, 0))), WL = WLEN[k], wE = evE([0.75, 0.97]), fold = (1 - wSp) * (1 - wSp * 0.5);
    for (const sg of [1, -1]) { const Ls = sg > 0 ? 'R' : 'L';
      const A = (i, j) => lerp(shp[i], WSHAPE.fold[i], fold) + j, fl2 = flap;
      const hSw = A(0, -0.1 * kick), hEl = A(1, 0.55 * fl2 - 0.4 * kick + 0.15 * land - 0.05 * dive), fSw = A(2, 0.1 * glide), fEl = A(3, 0.4 * flap - 0.3 * kick - 0.25 * glide + 0.1 * land), nSw = A(4, 0.15 * dive), nEl = A(5, 0.3 * cos(TAU * bw - 0.6) * beatA - 0.2 * kick + 0.3 * land);
      const dirW = (swp, el) => mv(Mb, [-cos(el) * sin(swp), sg * cos(el) * cos(swp), sin(el)]), wsc = 0.35 + 0.65 * wE;
      const W0 = BP([WROOT[0], sg * WROOT[1], WROOT[2]]), dh = dirW(hSw, hEl), E = add(W0, mul(dh, WL[0] * wsc)), df = dirW(fSw, fEl), Wr = add(E, mul(df, WL[1] * wsc)), dn = dirW(nSw, nEl), Tp = add(Wr, mul(dn, WL[2] * wsc));
      const up0b = mv(Mb, [0, 0, 1]), bk0 = mv(Mb, [-1, 0, 0]), bF = d2 => { let yn = sub(up0b, mul(d2, dot(up0b, d2))); if (len(yn) < 0.05) yn = sub(bk0, mul(d2, dot(bk0, d2))); yn = norm(yn); return [mul(norm(cross(yn, d2)), sg), yn, d2]; };
      { const [bx, by, bzz] = bF(dh); put('wsh', null, mm(colsR(bx, by, bzz), scl3(1.4)), W0, 1, { d0: 0.3 }, [0.74, 0.9]); }
      const bone = (a, d2, L2, ord) => { const [bx, by] = bF(d2); put('wbone', k, colsR(mul(bx, 1.5), mul(by, 1.5), mul(d2, L2)), a, 1, { d0: 0.3, g2: glw }, ord); };
      bone(W0, dh, WL[0] * wsc, [0.76, 0.92]); bone(E, df, WL[1] * wsc, [0.78, 0.94]); bone(Wr, dn, WL[2] * 0.7 * wsc, [0.8, 0.95]);
      put('wjoint', null, mm(BR(I3), scl3(1.1)), E, 1, { d0: 0.3 }, [0.78, 0.94]); put('wjoint', null, BR(I3), Wr, 1, { d0: 0.3 }, [0.8, 0.95]);
      { const [bx, by] = bF(df), fx = mul(bx, -1), nd = add(E, add(mul(df, WL[1] * 0.3 * wsc), add(mul(by, 0.4), mul(fx, 0.45)))); put('wnode', null, mm(colsR(fx, cross(by, fx), by), scl3(0.9 + 0.1 * k)), nd, 1, { d0: 0.35, glow: 0.4 + glw + hGl * 0.3, g2: glw }, [0.8, 0.95]);
        out['wingNode' + Ls] = scrO(nd, out['wingNode' + Ls] || {}); if (k >= 2) { const [bx2, by2] = bF(dn), fx2 = mul(bx2, -1), nd2 = add(Wr, add(mul(dn, WL[2] * 0.25 * wsc), add(mul(by2, 0.3), mul(fx2, 0.4)))); put('wnode', null, mm(colsR(fx2, cross(by2, fx2), by2), scl3(0.6)), nd2, 1, { d0: 0.35, glow: 0.4 + glw }, [0.82, 0.96]); } }
      // the feather-blades in rows (as the concept's wing: marginal, lesser and greater coverts overlapping toward the front, the secondaries,
      // the long primaries with rose-crystal blades among them, L4+ an outer row of crystal blades behind); each placed by its arc length
      // along the three bones, fanned from the trailing edge toward the tip, on its own spring (the downstroke bends it), pink energy
      // running root to tip (glow)
      const bfS = st['bf' + sg] || (st['bf' + sg] = new Float32Array(96)), bvS = st['bv' + sg] || (st['bv' + sg] = new Float32Array(96)), drive = flap * 0.5 + kick * 0.6 + yrs * 0.04 * sg + 0.1 * spd;
      const L0 = WL[0] * wsc, L1 = WL[1] * wsc, L2 = WL[2] * wsc, LT = L0 + L1 + L2, cF = mv(Mb, [1, 0, 0]);
      const onB = s0 => { const d0 = s0 * LT; return d0 < L0 ? [add(W0, mul(dh, d0)), dh] : d0 < L0 + L1 ? [add(E, mul(df, d0 - L0)), df] : [add(Wr, mul(dn, min(L2, d0 - L0 - L1))), dn]; };
      let tipP = Tp, jj = 0;
      const row = (cnt, s0, s1, Lf, fan0, fan1, off, wd, crys) => {
        for (let i = 0; i < cnt; i++) { const u = cnt > 1 ? i / (cnt - 1) : 0, [P0, bd] = onB(lerp(s0, s1, u));
          let trl = add(add(mul(up0b, -0.6), mul(bk0, 0.2)), mul(mv(Mb, [0, sg, 0]), 1.0)); trl = norm(sub(trl, mul(bd, dot(trl, bd)))); let nW = norm(cross(bd, trl)); if (dot(nW, cF) < 0) nW = mul(nW, -1);
          const fan = lerp(lerp(fan0, fan1, pow(u, 1.2)) * shp[6], 0.15 + 0.85 * u, fold * 0.85), bdir = norm(add(mul(trl, cos(fan)), mul(bd, sin(fan))));
          const j = jj++; if (dt > 0) { bvS[j] += ((drive * (0.5 + u) - bfS[j]) * (55 + 25 * hash(j)) - bvS[j] * (6 + 3 * u)) * dt; bfS[j] += bvS[j] * dt; } else if (snap) { bfS[j] = 0; bvS[j] = 0; }
          const wide = norm(cross(bdir, nW)), Rb = axisR(wide, bfS[j] + 0.03 * sin(t * 1.7 + j) * lv), zA = mv(Rb, bdir), xA = mv(Rb, nW), yA = cross(zA, xA);
          const Lb = Lf(u) * (0.45 + 0.55 * wE), cr = crys === 1 || (crys > 1 && i % crys === 1);
          put(cr ? 'fthc' : 'fth', null, colsR(mul(xA, 1.5), mul(yA, wd * (0.85 + 0.15 * sin(PI * u))), mul(zA, Lb)), add(P0, mul(nW, off)), 1, { d0: 0.08 + 0.002 * j, g2: glw, kind: u, glow: cr ? 0.5 + glw : glw * 0.3 }, [0.82 + 0.12 * u, 1]);
          if (s1 >= 0.999 && i === cnt - 1 && off === 0) tipP = add(P0, mul(zA, Lb)); } };
      const kL = 1 + 0.07 * (k - 1), q2 = (n, lo) => max(lo, round(n * (lod ? 0.62 : 1) - (low ? 2 : 0)));
      if (k >= 2) row(q2([0, 0, 5, 7][k], 2), 0.7, 1.0, u => (13 + 5 * u) * kL, 0.55, 1.5, -0.18, 2.8, 1);
      row(q2([0, 10, 12, 14][k], 5), 0.62, 1.0, u => (11.5 + 5.5 * sin(PI * min(1, 0.25 + u * 0.75))) * kL, 0.3, 1.45, 0, 4.6, 3);
      row(q2([0, 9, 11, 13][k], 4), 0.26, 0.66, u => (8.5 + 3 * u) * kL, -0.1, 0.35, 0.16, 4.6, 4);
      row(q2([0, 8, 10, 12][k], 4), 0.16, 0.96, u => (5.4 + 1.4 * sin(PI * u)) * kL, 0.15, 0.95, 0.34, 3.6, 0);
      row(q2([0, 8, 10, 12][k], 3), 0.07, 0.92, u => (3.4 + 0.8 * sin(PI * u)) * kL, 0.25, 1.05, 0.52, 3.0, 0);
      if (!low) row(q2([0, 8, 10, 12][k], 3), 0.02, 0.9, u => (2.1 + 0.4 * sin(PI * u)) * kL, 0.4, 1.15, 0.7, 2.3, 0);
      // gold filigree along the leading edge of each bone
      for (const [a3, d3, L3] of [[W0, dh, L0], [E, df, L1], [Wr, dn, L2 * 0.8]]) { const [bx, by] = bF(d3); let nn = norm(cross(d3, by)); if (dot(nn, cF) < 0) nn = mul(nn, -1); put('wfil', null, colsR(mul(nn, 1.2), mul(by, 1.2), mul(d3, L3)), add(add(a3, mul(by, 0.55)), mul(nn, 0.9)), 1, { d0: 0.3, glow: 0.15 + glw * 0.3 }, [0.78, 0.95]); }
      out['wingTip' + Ls] = scrO(tipP, out['wingTip' + Ls] || {}); out['wingRoot' + Ls] = scrO(W0, out['wingRoot' + Ls] || {}); }
    /* ---- the legs: two-bone IK hip -> ankle, the tarsus to the foot, toes and talons; folded in flight ---- */
    const lfT = S.legsFold == null ? sstep(0.6, 3, fly) * (1 - 0.7 * land) : cl(num(S.legsFold, 0)), lfo = f1(st, 'lf', lfT, 5, dt, snap);
    for (const sg of [1, -1]) { const Ls = sg > 0 ? 'R' : 'L', hip = BP([HIP[0], sg * HIP[1], HIP[2]]);
      const ftW = BP(lerp3([0.9, sg * 2.7, 0.35], [-1.8 - 0.8 * spd, sg * 2.0, 5.6], lfo)), ankW = BP(lerp3([-0.4, sg * 2.75, 3.9], [-0.6, sg * 2.2, 6.9], lfo));
      if (air < 0.2) { const dz = ftW[2] - 0.3; ftW[2] = 0.3; ankW[2] -= dz * 0.6; }
      const r = ik(hip, ankW, LF1, LF2, mv(Mb, [1, sg * 0.15, 0])), Kn = r.K, An = r.A;
      put('thigh', null, mm(frameZ(norm(sub(hip, Kn)), mv(Mb, [1, 0, 0])), scl3(1.9, 1.8, 1.45)), lerp3(hip, Kn, 0.42), 1, { d0: 0.4 }, [0.5, 0.62]);
      const sh2 = norm(sub(An, Kn)); put('shank', null, mm(frameZ(sh2, [1, 0, 0]), scl3(3.2, 3.2, len(sub(An, Kn)))), Kn, 1, { d0: 0.4 }, [0.5, 0.62]);
      const td = norm(sub(ftW, An)); put('tars', null, mm(frameZ(td, mv(Mb, [1, 0, 0])), scl3(3.3, 3.3, LTA)), An, 1, { d0: 0.4 }, [0.52, 0.62]);
      put('wjoint', null, scl3(1.05), An, 1, { d0: 0.4 }, [0.52, 0.62]); put('wjoint', null, scl3(0.95), Kn, 1, { d0: 0.4 }, [0.52, 0.62]);
      const ft = add(An, mul(td, LTA)), fwd = mv(Mb, [1, 0, 0]), curl = 0.15 + 1.0 * lfo + 0.1 * sin(t) * (1 - lfo) * 0;
      for (let f = 0; f < 4; f++) { const back = f === 3, a = back ? PI : (f - 1) * 0.45 * (1 - 0.5 * lfo), dirT = norm(mv(Mb, [cos(a), sg * sin(a) * 1 - 0 * sg, 0])), L1 = back ? 1.15 : f === 1 ? 1.75 : 1.5;
        let P = ft, Rt = colsR(dirT, norm(cross([0, 0, 1], dirT)), [0, 0, 1]); for (let j = 0; j < (lod ? 1 : 2); j++) { const L2 = lod ? 1.8 : j ? 0.8 : 1; Rt = mm(Rt, ry(curl * (j ? 0.7 : 0.4) + (j ? 0.25 : 0.12))); put('toe', null, mm(Rt, scl3(L1 * L2, 2.2, 2.2)), P, 1, { d0: 0.4 }, [0.55, 0.64]); P = add(P, mul(mv(Rt, [1, 0, 0]), L1 * L2)); }
        put('claw', null, mm(Rt, scl3(2.4)), P, 1, { d0: 0.4 }, [0.56, 0.65]); }
      const fo = out['feet' + Ls] = scrO(ft, out['feet' + Ls] || {}); fo.down = lift < 0.3 && lfo < 0.2; out.feet[sg > 0 ? 1 : 0] = fo; }
    /* ---- the tail: segmented feathers fanned down and back (a lag spring each: inertia, the swish), the silk ribbons in long S-curves ---- */
    const sw = f2(st, 'tsw', max(-1, min(1, num(S.tailSwish, 0) - yrs * 0.12)), 3, 0.6, dt, snap), tsp = f1(st, 'tsp', cl(num(S.tailSpread, 0)), 4, dt, snap), tlag = f2(st, 'tlag', max(-1, min(1, flyV * 0.04)), 5, 0.5, dt, snap);
    const ntf = lod ? NTF[k] - 2 : NTF[k], TR = BP(TROOT); out.tailTips.length = 0; let tipT = TR;
    for (let i = 0; i < ntf; i++) { const u = ntf > 1 ? i / (ntf - 1) : 0.5, sd = u * 2 - 1, spread = (0.7 + 0.4 * tsp) * sd, nsg = lod ? 2 : 5, L = (3.7 - 0.7 * abs(sd)) * (1 + 0.1 * k) * 5 / nsg;
      let P = add(TR, mv(Mb, [0, sd * 0.4, 0])), d = norm(mv(Mb, [-0.55 - 0.7 * spd, sin(spread) * 1.15, -1.0 + 0.55 * spd]));
      for (let j0 = 0; j0 < nsg; j0++) { const j = j0 * 4 / nsg, bend = (0.13 + 0.07 * j) * 4 / nsg + sw * 0.18 * (j + 1) * 0.5 + tlag * 0.25 * j + 0.06 * sin(t * 1.4 - j * 0.7 + i) * lv, side = sw * 0.15 * j + spread * 0.08;
        d = norm(add(d, mv(Mb, [-bend * 0.5, side, bend * 0.3]))); const wn = norm(cross(d, mv(Mb, [1, 0, 0]))), xn = norm(cross(wn, d));
        put(j0 === nsg - 1 ? 'ttip' : 'tseg', null, colsR(mul(xn, 1.4), mul(wn, 1.6 - 0.2 * j), mul(d, L * 1.08)), P, 1, { d0: 0.2 + 0.02 * i, g2: glw, kind: j / nsg }, [0.55, 0.7]); P = add(P, mul(d, L)); }
      if (i === ((ntf - 1) >> 1)) tipT = P; }
    out.tailTip = scrO(tipT, out.tailTip || {});
    const ntr = (lod ? max(2, NTR[k] - 2) : NTR[k]) - (low ? 1 : 0);
    for (let i = 0; i < ntr; i++) { const sg = i % 2 ? -1 : 1, j = i >> 1, L = (25 + 4 * k - 4 * j) * (1 + 0.1 * spd), root = add(TR, mv(Mb, [-0.3, sg * 0.3, -0.2 - 0.3 * j]));
      const drop = TROOT[2] + lift * (1 - air * 0.7) - 0.7 - 0.3 * j;
      const end = ribbonPath(root, u => { const a = mv(Mb, [-L * (0.2 + 0.06 * j) * u - 4 * spd * u + L * 0.09 * sin(u * TAU + j), sg * L * (0.58 * u + 0.1 * sin(u * PI * 1.7 + j * 0.6)) * (0.8 + 0.25 * j), -(drop - 1.2) * sstep(0, 0.5, u) + (2.6 - 0.4 * j) * sin(PI * sstep(0.35, 1, u)) * 0.8]); return add(a, [0, sin(u * 5 - t * 1.6 + i * 1.3) * 0.7 * u, sin(u * 6 - t * 1.3 + i) * 0.6 * u + sw * 1.5 * u]); }, 0.95 - 0.1 * j, u => 0.18 + 0.82 * sin(PI * min(1, 0.1 + u * 0.95)), true, 'tr' + i, 0.25, 0.2 + glw * 0.6);
      out.tailTips.push(scrO(end, out.tailTips[i] || {}));
      if (j === 0 && !spec) put('hlock', null, BR(mm(rz(sg * 0.9), scl3(1.6))), add(end, [0, 0, -0.3]), 1, { d0: 0.3, glow: 0.4 + hGl * 0.3 }, [0.6, 0.72]); }
    /* ---- the halo and the Twelve Petals ---- */
    if (!spec) {
      const hsP = st.hsp = (st.hsp || 0) + dt * 0.12 * num(S.haloSpin, 1), hspin = S.haloAng == null ? hsP : num(S.haloAng, 0), hSc = num(S.haloScale, 1) * (0.6 + 0.4 * evE([0.62, 0.8])), HR = HALR[k] * hSc, hGlo = num(S.haloGlow, 0);
      const Rhl = BR(mm(mm(ry(-PI / 2 + num(S.haloTilt, 0)), I3), rz(0))), hc = BP(HALO), hpl = (a, r) => add(hc, mv(Rhl, [cos(a) * r, sin(a) * r, 0]));
      const Rhalo = a => mm(Rhl, rz(a));   // (the halo's frame: z its normal (forward), x up at angle 0)
      put('halo', k, mm(Rhalo(hspin), scl3(HR)), hc, 1, { d0: 0.3, glow: 0.3 + hGlo, kind: hspin }, [0.62, 0.8]);
      if (k >= 2) put('haloIn', null, mm(Rhalo(-hspin * 0.6), scl3(HR * 0.86)), add(hc, mv(Rhl, [0, 0, -0.1])), 1, { d0: 0.3, glow: 0.3 + hGlo }, [0.62, 0.8]);
      if (k >= 3) put('haloOut', null, mm(Rhalo(hspin * 0.35), scl3(HR * 1.1)), add(hc, mv(Rhl, [0, 0, -0.15])), 1, { d0: 0.3, glow: 0.2 + hGlo }, [0.64, 0.82]);
      const hs0 = scr(hc), hs1 = scr(hpl(0, HR)), hs2 = scr(hpl(PI / 2, HR)); out.halo = { x: hs0[0], y: hs0[1], r: hypot(hs2[0] - hs0[0], hs2[1] - hs0[1]), ry: hypot(hs1[0] - hs0[0], hs1[1] - hs0[1]), ang: hspin };
      const PS = S.petals || [], pE = evE([0.65, 0.82]);
      for (let i = 0; i < 12; i++) { const p = PS[i] || {}, home = cl(p.free != null ? 1 - num(p.free, 0) : p.home == null ? 1 : num(p.home, 1)), aS = i / 12 * TAU + hspin, slotP = hpl(aS, HR + 0.25), slotD = norm(sub(hpl(aS, HR + 1), hc));
        const sl = out.slots[i] || (out.slots[i] = {}), sw2 = tiles(slotP), ss = scr(slotP), ss2 = scr(add(slotP, slotD)); sl.wx = sw2[0]; sl.wy = sw2[1]; sl.wz = sw2[2]; { const dt2 = tiles(add(slotP, slotD)); const l2 = hypot(dt2[0] - sw2[0], dt2[1] - sw2[1], dt2[2] - sw2[2]) || 1; sl.dx = (dt2[0] - sw2[0]) / l2; sl.dy = (dt2[1] - sw2[1]) / l2; sl.dz = (dt2[2] - sw2[2]) / l2; } sl.ang = atan2(ss2[0] - ss[0], -(ss2[1] - ss[1]));
        // its free place: tile offsets -> world-aligned model units -> the body frame (X0, Y0 is the floor under the body: no lift)
        const fp = w2b([num(p.x, 0) * xT, num(p.y, 0) * yT, num(p.z, 0) * zT]);
        let fdir; if (p.dir) fdir = norm(w2b([num(p.dir[0], 0) * xT, num(p.dir[1], 0) * yT, num(p.dir[2], 0) * zT])); else if (p.ang != null) { const a = num(p.ang, 0); fdir = norm(w2b([sin(a), -SE * cos(a), CE * cos(a)])); } else fdir = slotD;
        const Pp = lerp3(fp, slotP, home), Dd = norm(lerp3(fdir, slotD, home)), opn = cl(num(p.open, 0)), sc = num(p.scale != null ? p.scale : p.s, 1) * (0.55 + 0.45 * pE) * (k >= 3 ? 1.38 : 1.28), gl3 = num(p.glow, 0);
        // the broad face toward the camera as far as it can (or the halo's forward at home), then its roll
        const hN = mv(Rhl, [0, 0, -1]), fv0 = lerp3(w2b([0, CE, SE]), hN, home * 0.6), fN = norm(sub(fv0, mul(Dd, dot(fv0, Dd)))), Rr = axisR(Dd, num(p.roll, 0)), xA = mv(Rr, fN), yA = cross(Dd, xA), R0 = colsR(xA, yA, Dd);
        const grp = home < 0.5 ? 1 : 0, op = { d0: 0.3 + 0.02 * i, glow: 0.25 + gl3 + hGlo * 0.3, g2: gl3 * 0.5, kind: i, grp };
        put('pcore', k, mm(R0, scl3(sc)), Pp, 1, op, [0.66 + 0.012 * i, 0.82]);
        if (!lod || opn > 0.04) for (const vs of [1, -1]) put('pvane', null, mm(R0, mm(vs > 0 ? I3 : MY, mm(rz(opn * 0.55 - 0.08), scl3(sc, sc * (1 + 0.6 * opn), sc)))), add(Pp, mv(R0, [(-0.07 + 0.12 * opn) * sc, vs * (0.08 + 0.32 * opn) * sc, 0])), 1, op, [0.66 + 0.012 * i, 0.82]);
        const po = out.petals[i] || (out.petals[i] = {}), s0 = scr(Pp), s1 = scr(add(Pp, mul(Dd, 4.6 * sc))), ti = tiles(Pp);
        po.x = (s0[0] + s1[0]) / 2; po.y = (s0[1] + s1[1]) / 2; po.tx = s1[0]; po.ty = s1[1]; po.ang = atan2(s1[0] - s0[0], -(s1[1] - s0[1])); po.r = hypot(s1[0] - s0[0], s1[1] - s0[1]) / 2; po.wx = ti[0]; po.wy = ti[1]; po.wz = ti[2]; po.home = home; }
    }
    out.unit = K; out.tile = tile; out.yaw = yaw; out.k = k; out.lod = !!lod;
    return out;
    /* a chain of n links between a and b (sagging; a spring per chain swings it; slack when the restraints open: it falls from the cuff) */
    function chain(a, b, n, sag, key, wrist) {
      const rel = wrist ? wrO : resO; if (rel > 0.98 && lod) return; if (lod) n = ceil(n / 2); const ch = st[key] || (st[key] = { v: 0, x: 0 }); if (dt > 0) { ch.v += ((-ch.x) * 40 - ch.v * 3 + (flap * 2 + strg * 6 * sin(t * 11 + n)) ) * dt; ch.x += ch.v * dt; }
      const a2 = lerp3(a, add(b, mul(norm(sub(a, b)), 0.6)), sstep(0.3, 1, rel)), d = norm(sub(b, a2)), side = norm(cross(d, [0, 0, 1]));
      for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, p = add(lerp3(a2, b, u), add([0, 0, -(sag + rel * 1.4) * 4 * u * (1 - u)], mul(side, ch.x * 0.4 * sin(PI * u)))), u2 = min(1, u + 0.5 / n), p2 = add(lerp3(a2, b, u2), [0, 0, -(sag + rel * 1.4) * 4 * u2 * (1 - u2)]), dd = norm(sub(p2, p));
        const lk = min(lod ? 3.2 : 1.6, len(sub(b, a2)) / n / 0.28);
        put('link', null, mm(frameZ(dd, [0, 0, 1]), mm(rz(i % 2 ? PI / 2 : 0), scl3(1, 1, lk))), p, 1, { d0: 0.6, glow: 0.05 + 0.3 * rel }, [0.28, 0.4]); }
    }
    /* a ribbon: root, a path f(u) (offsets from the root, body frame), width w, its taper, silk or light; returns its end */
    function ribbonPath(root, f, w, taper, silk, key, d0, glow) {
      const pool = silk ? 'ribS' : 'ribE', ix = silk ? NRB++ : NRE++; const lagS = st[key] || (st[key] = { x: 0, y: 0 }); if (dt > 0) { lagS.x += (-(flyV * 0.08 + yrs * 0.5) - lagS.x) * min(1, dt * 3); }
      RBN.push({ pool, ix, root, f, w, taper, lag: lagS.x, view: w2b([0, CE, SE]) });
      put(pool, ix, I3, [0, 0, 0], 1, { d0, glow, alpha: 0.99, rib: RBN.length - 1, noInk: 1 }, [0.55, 0.75]);
      return add(root, f(1));
    }
  }
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; };
  /* rewrite a ribbon's strip along its path (body frame), facing the viewer as much as it can */
  function buildRibbon(mesh, R, N) {
    const P = mesh.pos, Nr = mesh.nrm; let cx = 0, cy = 0, cz = 0, rr = 0; const pts = [];
    for (let i = 0; i <= N; i++) { const u = i / N, o = R.f(u); pts.push(add(R.root, add(o, [0, R.lag * 3 * u * u, 0]))); }
    for (let i = 0; i <= N; i++) { const p = pts[i], T = norm(sub(pts[min(N, i + 1)], pts[max(0, i - 1)])); let sd = cross(T, R.view); if (len(sd) < 1e-4) sd = cross(T, [0, 0, 1]); sd = norm(sd); const nn = cross(sd, T), w = R.w * R.taper(i / N);
      for (let j = 0; j <= 2; j++) { const q = (j - 1) * w, vi = (j * (N + 1) + i) * 3, x = p[0] + sd[0] * q + nn[0] * (j === 1 ? 0.04 : 0), y = p[1] + sd[1] * q + nn[1] * (j === 1 ? 0.04 : 0), z = p[2] + sd[2] * q + nn[2] * (j === 1 ? 0.04 : 0);
        P[vi] = x; P[vi + 1] = y; P[vi + 2] = z; Nr[vi] = nn[0]; Nr[vi + 1] = nn[1]; Nr[vi + 2] = nn[2]; cx += x; cy += y; cz += z; } }
    const n = (N + 1) * 3; cx /= n; cy /= n; cz /= n; for (let i = 0; i < n; i++) rr = max(rr, hypot(P[i * 3] - cx, P[i * 3 + 1] - cy, P[i * 3 + 2] - cz)); mesh.bs = [cx, cy, cz, rr];
    if (mesh.gl && GLM.touchGeo) GLM.touchGeo(mesh);
  }

  /* ================= drawing ================= */
  const POOL = [], ITEMS = [], TRANS = []; let NP = 0;
  const item = () => { const g = POOL[NP] || (POOL[NP] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); NP++; return g; };
  const STATS = { ms: 0, n: 0, items: 0, W: 0, H: 0, calls: 0, tris: 0, passes: 0 }, RES = { k: 1 };
  const PXB = [[0.6e6, 0.42e6, 0.3e6, 0.3e6], [0.42e6, 0.3e6, 0.2e6, 0.2e6], [0.35e6, 0.25e6, 0.18e6, 0.18e6]];
  const hq = () => { if (lowFx()) return false; try { return typeof GQ === 'undefined' || !GQ.level || GQ.level() === 0; } catch (e) { return true; } };
  const budget = j => { if (hq()) return j === 2 ? 0.7e6 : 1.6e6; try { if (typeof GQ === 'undefined' || typeof arc === 'undefined' || !arc.game || arc.mode !== 'dungeon') return 1e12; return PXB[j][max(0, min(3, GQ.level() | 0))]; } catch (e) { return 1e12; } };
  const OCC = new Float32Array(48);
  /* one GL image of a group of items laid on the canvas (box in canvas units) */
  function blit(c, items, box, Sv0, bud, opts, comp) {
    let [rx0, ry0, rx1, ry1] = box; const vb = visBox(c); if (vb) { rx0 = max(rx0, vb[0]); ry0 = max(ry0, vb[1]); rx1 = min(rx1, vb[2]); ry1 = min(ry1, vb[3]); } if (!(rx1 > rx0 + 1 && ry1 > ry0 + 1) || !items.length) return true;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__GB_GLHQ'), dev = (m ? max(0.25, hypot(m.a, m.b)) : 1) * (soft ? 0.5 : RES.k) * (typeof GQ !== 'undefined' && GQ.animaK ? GQ.animaK() : 1) * (opts.res || 1);
    const bw = rx1 - rx0, bh = ry1 - ry0; let W = ceil(bw * dev), H = ceil(bh * dev); const scl = min(1, GLCAP / max(W, H)); W = max(2, ceil(W * scl)); H = max(2, ceil(H * scl));
    if (W * H > bud) { const q = sqrt(bud / (W * H)); W = max(2, ceil(W * q)); H = max(2, ceil(H * q)); }
    const x = Sv0.X, y = Sv0.Y, kk = Sv0.kk; const Sv = Object.assign({}, Sv0.base, { cl: Sv0.cl ? Sv0.cl(bw, bh, rx0, ry0) : [2 * kk / bw, 2 * (x - rx0) / bw - 1, -2 * kk / bh, 1 - 2 * (y - ry0) / bh], outline: Sv0.base.outline ? max(0.6, 0.7 * (W / bw)) : 0 });
    const cvs = GLM.render(W, H, Sv, items); if (!cvs) return false; STATS.passes++; STATS.calls += GLM.stats ? GLM.stats.calls : 0; STATS.tris += GLM.stats ? round(GLM.stats.tris) : 0; STATS.W = W; STATS.H = H;
    const alp = opts.alpha == null ? 1 : opts.alpha; if (alp > 0.004) { c.save(); c.globalAlpha = min(1, alp); if (comp) c.globalCompositeOperation = comp; c.drawImage(cvs, 0, 0, W, H, rx0, ry0, bw, bh); c.restore(); } return true;
  }
  /* (batching: the small parts drawn many times a frame (feather-blades, petals, links, fingers, plates, vertebrae...) are merged per mesh
     into one dynamic mesh each frame (their vertices posed on the CPU): one draw call per mesh instead of one per copy) */
  const NOB = new Set(['torso', 'hback', 'hglow', 'halo', 'haloIn', 'haloOut', 'cring', 'seal', 'wsh', 'hlobe', 'ribS', 'ribE']), BQ = new Map(), BM = new Map(), BL = [];
  function batchMesh(L) { let q = BM.get(L.src); if (!q) BM.set(L.src, q = [null, null, null, null]); let bm = q[L.slot]; if (bm && bm.cap >= L.n) return bm;
    if (bm) { OWN.delete(bm); if (typeof GLM !== 'undefined' && GLM.free) GLM.free(bm); }
    const s0 = L.src, nv = s0.nv, ni = s0.idx.length, cap = ceil(L.n * 1.25) + 2, tot = nv * cap, idx = tot > 65535 ? new Uint32Array(ni * cap) : new Uint16Array(ni * cap), att = new Float32Array(tot * 3);
    for (let c = 0; c < cap; c++) { att.set(s0.att, c * nv * 3); for (let i = 0; i < ni; i++) idx[c * ni + i] = s0.idx[i] + c * nv; }
    bm = q[L.slot] = { pos: new Float32Array(tot * 3), nrm: new Float32Array(tot * 3), att, idx, nv: tot, ntri: ni * cap / 3, gl: null, cap }; OWN.add(bm); return bm; }
  function fillBatch(bm, L) { const s0 = L.src, nv = s0.nv, P = s0.pos, N = s0.nrm, BPo = bm.pos, BNo = bm.nrm; let o = 0;
    for (let e = 0; e < L.n; e++) { const R = L.E[e].R, T = L.E[e].T; for (let v = 0, i3 = 0; v < nv; v++, i3 += 3) { const x = P[i3], y = P[i3 + 1], z = P[i3 + 2], a = N[i3], b = N[i3 + 1], c = N[i3 + 2];
      BPo[o] = R[0] * x + R[1] * y + R[2] * z + T[0]; BPo[o + 1] = R[3] * x + R[4] * y + R[5] * z + T[1]; BPo[o + 2] = R[6] * x + R[7] * y + R[8] * z + T[2];
      BNo[o] = R[0] * a + R[1] * b + R[2] * c; BNo[o + 1] = R[3] * a + R[4] * b + R[5] * c; BNo[o + 2] = R[6] * a + R[7] * b + R[8] * c; o += 3; } }
    if (bm.gl && GLM.touchGeo) GLM.touchGeo(bm); }
  /* render the posed parts; spec: the spectral white phoenix */
  function pass(c, S, x, y, size, opts, spec) {
    if (NOGL) return null; opts = opts || {};
    const tf0 = c.getTransform ? c.getTransform() : null, dpx = size * (tf0 ? hypot(tf0.a, tf0.b) : 1), hqN = hq(), st0 = S._gb || null; let lod = opts.lod != null ? !!opts.lod : spec ? true : !opts.full && !hqN && dpx < LODPX;
    if (opts.lod == null && !spec && !opts.full && st0) { if (st0.lodSel != null && st0.lodHq === hqN) lod = st0.lodSel; else { st0.lodSel = lod; st0.lodHq = hqN; } }
    if (!ensure(lod) && !(data(!lod).ready)) return null; const DS = data(lod).ready ? data(lod) : data(!lod), lodM = DS === DL;
    try {
      const M = DS.M, k = kOf(S), K = size / HEIGHT[k], kk = K / WS, sw = WS, dis = cl(num(S.dissolve, 0)), low = !!(S.lowFx || lowFx() || opts.low), fxS = spec ? 1 : 0, fadeS = cl(num(opts.fade, 0)), emg = opts.emerge == null ? 0 : cl(opts.emerge);
      ITEMS.length = 0; TRANS.length = 0; NP = 0; for (const L of BL) L.n = 0; BL.length = 0; const BX = [[1e9, 1e9, -1e9, -1e9], [1e9, 1e9, -1e9, -1e9]];
      const HID = opts.hide ? new Set(opts.hide) : null; let yawC = 0, ent = 1;
      const put = (nm, ix, R, T, sc, op, ordW) => {
        if (HID && HID.has(nm)) return null; let mesh = M[nm]; if (!mesh) return null; if (ix != null) mesh = Array.isArray(ix) ? mesh[ix[0]][ix[1]] : mesh[ix]; if (!mesh) return null;
        sc = sc || 1; let ga = 0, al = op.alpha == null ? 1 : op.alpha;
        if (ent < 0.999 && ordW) { const a = sstep(ordW[0], ordW[1], ent); if (a < 0.02) return null; const dir = sub(T, [0, 0, 15]), ax = norm([hash(T[0] * 3.1 + T[2]) - 0.5, hash(T[1] * 5.7 + 1) - 0.5, 0.7]);
          T = add(T, add(mul(dir, (1 - a) * 0.4), [0, 0, (1 - a) * 2])); R = mm(axisR(ax, (1 - a) * 1.4), R); sc *= 0.4 + 0.6 * a; ga = (1 - a) * 2.4; }
        if (fxS && emg > 0) { al *= cl(1.2 - emg * (1 - cl((T[2] - 4) / 14)) * 1.2); if (al < 0.02) return null; }
        const Rm = mm(rz(yawC), R), Tw = mv(rz(yawC), T), z = sw * sc, d0 = op.d0 != null ? op.d0 : 0.4, dd = dis > 0 ? cl((dis - d0 * 0.75) / 0.3) : 0, grp = op.grp || 0, spl = max(dd, fxS ? fadeS : 0), aF = fxS ? min(al, 0.99) : al;
        let g = null;
        if (op.rib == null && !NOB.has(nm) && mesh.nv <= 4000 && !opts.noBatch) { const slot = grp * 2 + (aF < 0.995 ? 1 : 0); let q = BQ.get(mesh); if (!q) BQ.set(mesh, q = [null, null, null, null]); const L = q[slot] || (q[slot] = { src: mesh, n: 0, E: [], nm, slot });
          if (!L.n) { L.gl = 0; L.g2 = 0; L.sp = 0; L.kind = op.kind || 0; L.al = 1; L.ink = true; L.dz = 0; BL.push(L); }
          const e = L.E[L.n] || (L.E[L.n] = { R: new Float64Array(9), T: new Float64Array(3) }); L.n++; for (let i = 0; i < 9; i++) e.R[i] = Rm[i] * sc; e.T[0] = Tw[0]; e.T[1] = Tw[1]; e.T[2] = Tw[2];
          L.gl = max(L.gl, (op.glow || 0) + ga); L.g2 = max(L.g2, op.g2 || 0); L.sp += spl; L.al = min(L.al, aF); L.ink = L.ink && !op.noInk; L.dz += Tw[0] * PDW[0] + Tw[1] * PDW[1] + Tw[2] * PDW[2]; }
        else { g = item(); for (let i = 0; i < 3; i++) { g.R0[i] = Rm[i * 3] * z; g.R1[i] = Rm[i * 3 + 1] * z; g.R2[i] = Rm[i * 3 + 2] * z; g.T[i] = Tw[i] * sw; }
          g.mesh = mesh; g.glow = (op.glow || 0) + ga; g.glow2 = op.g2 || 0; g.spill = spl; g.kind = op.kind || 0; g.wear = 0; g.fx = fxS; g.first = 0; g.cnt = 0; g.rib = op.rib; g.sd = null;
          g.alpha = aF; g.outline = !op.noInk && !(g.spill > 0.001) && !fxS && al > 0.995 && (!lodM || OUTL.has(nm)); g.grp = grp; (g.alpha < 0.995 ? TRANS : ITEMS).push(g);
          if (g.rib != null) { const Rb = RBN[g.rib]; buildRibbon(mesh, Rb, M.ribN); } }
        if (mesh.bs) { const bs = mesh.bs, c3 = add(T, mv(R, mul(bs, sc))), skk = max(hypot(R[0], R[3], R[6]), hypot(R[1], R[4], R[7]), hypot(R[2], R[5], R[8])), w = mv(rz(yawC), c3), rr = (bs[3] * sc * skk * 1.03 + 0.05) * K, X = x + w[0] * K, Y = y + (w[1] * SE - w[2] * CE) * K, B2 = BX[grp];
          if (X - rr < B2[0]) B2[0] = X - rr; if (X + rr > B2[2]) B2[2] = X + rr; if (Y - rr < B2[1]) B2[1] = Y - rr; if (Y + rr > B2[3]) B2[3] = Y + rr; }
        return g; };
      const st1 = S._gb; yawC = st1 && st1.yaw != null ? st1.yaw : 0; ent = cl(num(S.enter, 1));
      let first = true; const put2 = (nm, ix, R, T, sc, op, ordW) => { if (first) { first = false; yawC = S._gb && S._gb.yaw != null ? S._gb.yaw : yawC; } return put(nm, ix, R, T, sc, op, ordW); };
      // (the ribbons are rewritten as they are put: the solver has queued their paths in RIB before each put)
      const out = solve0(S, x, y, size, opts, put2, spec, lodM); out.lod = lodM;
      for (const L of BL) { const bm = batchMesh(L); fillBatch(bm, L); const g = item(); g.R0[0] = sw; g.R0[1] = 0; g.R0[2] = 0; g.R1[0] = 0; g.R1[1] = sw; g.R1[2] = 0; g.R2[0] = 0; g.R2[1] = 0; g.R2[2] = sw; g.T[0] = g.T[1] = g.T[2] = 0;
        g.mesh = bm; g.cnt = L.n * L.src.idx.length; g.first = 0; g.glow = L.gl; g.glow2 = L.g2; g.spill = L.sp / L.n; g.kind = L.kind; g.wear = 0; g.fx = fxS; g.rib = null; g.alpha = L.al; g.sd = L.dz / L.n * sw;
        g.outline = L.ink && !(g.spill > 0.001) && !fxS && L.al > 0.995 && (!lodM || OUTL.has(L.nm)); g.grp = L.slot >> 1; (g.alpha < 0.995 ? TRANS : ITEMS).push(g); L.n = 0; }
      BL.length = 0;
      if (!(ITEMS.length + TRANS.length)) return out;
      // (petals far from the body go to their own pass: a petal inside the body's box stays in it)
      const B0 = BX[0];
      const ITB = [], ITF = []; let fx0 = 1e9, fy0 = 1e9, fx1 = -1e9, fy1 = -1e9;
      ITEMS.sort((a, b) => a.mesh.nv - b.mesh.nv); const dzOf = g => (g.sd != null ? g.sd : g.T[0] * PDW[0] + g.T[1] * PDW[1] + g.T[2] * PDW[2]); TRANS.sort((a, b) => dzOf(a) - dzOf(b));
      for (const g of ITEMS.concat(TRANS)) (g.grp ? ITF : ITB).push(g);
      if (BX[1][2] > BX[1][0]) { const b1 = BX[1]; if (b1[0] >= B0[0] - 4 && b1[2] <= B0[2] + 4 && b1[1] >= B0[1] - 4 && b1[3] <= B0[3] + 4) { for (const g of ITF) ITB.push(g); ITF.length = 0; } else { fx0 = b1[0]; fy0 = b1[1]; fx1 = b1[2]; fy1 = b1[3]; } }
      // the occluders: spheres in the torso, the oracle, the head
      let no = 0; const oc = (p, r) => { if (no >= 12 || !p) return; const w = mv(rz(yawC), p); OCC[no * 4] = w[0] * sw; OCC[no * 4 + 1] = w[1] * sw; OCC[no * 4 + 2] = w[2] * sw; OCC[no * 4 + 3] = r * sw; no++; };
      if (!low && !fxS && st1) { const lf = st1.fly || 0; oc([-1.0, 0, 13 + lf], 3.2); oc([-0.9, 0, 17.5 + lf], 3.3); oc([-0.6, 0, 9.8 + lf], 2.4); if (st1.hl) oc(add(st1.hl, [0, 0, 0.1]), 0.75); }
      const base = { px: PXW, py: PYW, pd: PDW, v: PDW, lk: LW, ls: SBW, lr: RIMW, up: UPW, low, rim: RIMC, amb: AMBC, t: nowMs() / 1000 % 1000, keep: 2, outline: opts.ink === false || low || fxS ? 0 : 1, outlineCol: OUTC, outlineBias: 0.0025, clip: null, occ: no ? OCC : null, nocc: no };
      const Sv0 = { X: x, Y: y, kk, base }, t0 = nowMs(); STATS.passes = 0; STATS.calls = 0; STATS.tris = 0;
      const comp = fxS ? (opts.comp || 'lighter') : null;
      if (ITB.length) { const b = BX[0]; if (!blit(c, ITB, [floor(b[0]) - 3, floor(b[1]) - 3, ceil(b[2]) + 3, ceil(b[3]) + 3], Sv0, budget(fxS ? 2 : 0), Object.assign({}, opts, { alpha: (opts.alpha == null ? 1 : opts.alpha) * (S.alpha == null ? 1 : cl(S.alpha)) }), comp)) return null; }
      if (ITF.length) { Sv0.base = Object.assign({}, base, { occ: null, nocc: 0 }); blit(c, ITF, [floor(fx0) - 3, floor(fy0) - 3, ceil(fx1) + 3, ceil(fy1) + 3], Sv0, budget(1), Object.assign({}, opts, { alpha: (opts.alpha == null ? 1 : opts.alpha) * (S.alpha == null ? 1 : cl(S.alpha)) }), comp); }
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; if (!GLM.soft && STATS.n > 20) RES.k = STATS.ms > 7 ? max(0.6, RES.k - 0.02) : STATS.ms < 3.5 ? min(1, RES.k + 0.01) : RES.k; STATS.items = ITEMS.length + TRANS.length; STATS.batches = ITEMS.reduce((n, g) => n + (g.cnt ? 1 : 0), 0) + TRANS.reduce((n, g) => n + (g.cnt ? 1 : 0), 0);
      out.bb = [BX[0][0], BX[0][1], BX[0][2], BX[0][3]];
      return out;
    } catch (e) { fail(e); return null; }
  }
  const NOPUT = () => null;
  function solve(x, y, size, S, opts) { try { return solve0(S, x, y, size, opts || {}, NOPUT, null, !!(opts && opts.lod)); } catch (e) { return null; } }
  function draw(c, x, y, size, S, opts) { if (!S || !usable()) return null; return pass(c, S, x, y, size, opts || {}, null); }
  function drawSpectral(c, x, y, size, S, opts) { if (!S || !usable()) return null; const S2 = S._sp || (S._sp = {}); for (const k2 in S) if (k2 !== '_gb' && k2 !== '_sp') S2[k2] = S[k2]; if (S.legsFold == null) S2.legsFold = 1; return pass(c, S2, x, y, size, opts || {}, true); }
  const anchors = S => (S && S._gb && S._gb.out) || null;
  const STILLS = {};
  function drawAnima(c, k, x, y, size, t, o) {
    o = o || {}; if (!usable()) return false;
    const ip = o.inst && o.inst.gbS; let S = ip;
    if (!S) { const key = 'k' + k; S = STILLS[key] || (STILLS[key] = idle(k === 3 ? 7 : k === 2 ? 4 : 1, 0)); S.t = t || 0; S.face = FACE0 + (o.flip ? -0.3 : 0); }
    const r = pass(c, S, x, y, size, { alpha: o.alpha == null ? 1 : o.alpha, still: !ip && !o.live, tile: o.tile, full: !ip }, null);
    if (o.inst && ip) o.inst.gbOut = r;
    if (r && !ip && o.light !== false && size >= 60) lights(c, r, S, o.alpha == null ? 1 : o.alpha);
    return !!r;
  }
  /* the model's own glows on the shared GPU painter: the halo's light, the heart's pulse, the eyes, the mask's slit */
  function lights(c, r, S, al) {
    try { const N = typeof self !== 'undefined' && self.NIDHOGG_MOVES, F = N && N.FGFX; if (!F || !F.usable() || !r || !r.heart) return false; al = al == null ? 1 : al;
      const hp = S && S.heartPulse != null ? cl(S.heartPulse) : 0.5;
      F.flush(c); const Q = F.begin(c, null);
      if (r.halo) Q.glow(r.halo.x, r.halo.y, r.halo.r * 1.25, '#FFB6DA', 0.16 * al);
      Q.glow(r.heart.x, r.heart.y, r.heart.r * 3.2, '#FF6FB5', (0.34 + 0.2 * hp) * al); if (r.wingNodeL && r.wingNodeR) { Q.glow(r.wingNodeL.x, r.wingNodeL.y, r.unit * 2.2, '#FF7EC0', 0.4 * al); Q.glow(r.wingNodeR.x, r.wingNodeR.y, r.unit * 2.2, '#FF7EC0', 0.4 * al); } Q.glow(r.heart.x, r.heart.y, r.heart.r * 0.9, '#FFE6F3', (0.3 + 0.2 * hp) * al);
      if (r.eyes) for (const e of r.eyes) Q.glow(e[0], e[1], r.unit * 0.45, '#FF7EC0', 0.6 * al);
      if (r.mask) Q.glow(r.mask.x, r.mask.y, r.unit * 0.6, '#FF9BD2', 0.45 * al);
      F.flush(c); F.begin(c, null); return true; } catch (e) { return false; }
  }
  /* effect meshes in screen space (one GLM pass) */
  const SV = [0, 0, 1], SUP = [0, -1, 0], SLK = norm([-0.45, -0.7, 0.55]), SLS = norm([-0.2, -0.85, 0.5]), SLR = norm([0.65, 0.45, -0.2]), PX2 = [1, 0, 0], PY2 = [0, 1, 0], PD2 = [0, 0, 1], CAM = [1, 0, 0, 0, SE, -CE, 0, CE, SE];
  function drawParts(c, list, o) {
    if (NOGL || !list || !list.length || !usable()) return false; o = o || {}; if (!ensure(true) && !data(false).ready) return false; const d = o.full && data(false).ready ? data(false) : data(true).ready ? data(true) : data(false);
    try { ITEMS.length = 0; TRANS.length = 0; NP = 0; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const M = d.M;
      const box = (x, y, r) => { x0 = min(x0, x - r); y0 = min(y0, y - r); x1 = max(x1, x + r); y1 = max(y1, y + r); };
      const putP = (mesh, R, T, e, kind) => { if (!mesh) return; const g = item(), al = e.a == null ? 1 : e.a; for (let i = 0; i < 3; i++) { g.R0[i] = R[i * 3] * 0.01; g.R1[i] = R[i * 3 + 1] * 0.01; g.R2[i] = R[i * 3 + 2] * 0.01; g.T[i] = T[i] * 0.01; }
        g.mesh = mesh; g.alpha = al; g.glow = e.g || 0; g.glow2 = e.g2 || 0; g.spill = e.sp || 0; g.kind = kind == null ? e.kind || 0 : kind; g.wear = 0; g.fx = e.fx || 0; g.first = 0; g.cnt = 0; g.outline = e.ink !== false && al > 0.995 && !g.spill; (al < 0.995 ? TRANS : ITEMS).push(g); };
      for (const e of list) {
        const s = e.s, al = e.a == null ? 1 : e.a; if (!(al > 0.01) || !(s > 0.05)) continue;
        const Rb = mm(CAM, e.R || mm(rz(e.yaw || 0), mm(rx(e.tilt || 0), ry(e.roll || 0)))), zz = e.z == null ? e.Y : e.z, R = sc => Rb.map(v => v * s * sc), T = [e.X, e.Y, zz];
        if (e.m === 'mesh') { if (e.mesh) { putP(e.mesh, R(1), T, e); box(e.X, e.Y, e.r || s * 3); } continue; }
        if (e.m === 'petal') { const op = cl(e.o || 0); putP(M.pcore[3], R(1), T, e); for (const vs of [1, -1]) putP(M.pvane, mm(Rb, mm(ry(0), mm(axisR([0, 0, 1], vs * (0.12 + op * 1.25)), scl3(1, vs * (1 + 0.5 * op), 1)))).map(v => v * s), add(T, mv(Rb, [-0.08 + op * 0.3, vs * 0.35, 0]).map(v => v * s)), e); box(e.X, e.Y, s * 5.5); continue; }
        if (e.m === 'ring') { putP(M.cring[(e.kind | 0) % 3], mm(Rb, rz((e.t || 0) * 0.8)).map(v => v * s), T, e, 0); box(e.X, e.Y, s * 1.2); continue; }
        const mesh = { heart: M.hlock, heartBig: M.heartBig, lotus: M.lotus, lily: M.lily, feather: M.fth }[e.m]; if (!mesh) continue;
        putP(mesh, e.m === 'feather' ? R(1).map((v, i) => v * (i % 3 === 2 ? 3 : i % 3 === 1 ? 1.2 : 1.4)) : R(e.m === 'heart' ? 4 : 1), T, e); box(e.X, e.Y, s * ({ heart: 1.4, heartBig: 8, lotus: 2.2, lily: 1.8, feather: 3.2 }[e.m]));
      }
      if (!(x1 > x0) || !(ITEMS.length + TRANS.length)) return false; for (const g of TRANS) ITEMS.push(g);
      const base = { px: PX2, py: PY2, pd: PD2, v: SV, lk: SLK, ls: SLS, lr: SLR, up: SUP, low: lowFx(), rim: RIMC, amb: AMBC, t: nowMs() / 1000 % 1000, outline: lowFx() || o.ink === false ? 0 : 1, outlineCol: OUTC, outlineBias: 0.002, keep: 2 };
      return blit(c, ITEMS.slice(), [floor(x0) - 2, floor(y0) - 2, ceil(x1) + 2, ceil(y1) + 2], { base, cl: (bw, bh, X0, Y0) => [200 / bw, -2 * X0 / bw - 1, -200 / bh, 1 + 2 * Y0 / bh] }, budget(1), { alpha: o.alpha, res: o.res || (lowFx() ? 0.6 : 0.85) }, o.comp);
    } catch (e) { fail(e); return false; }
  }
  const own = m => { if (m) OWN.add(m); return m; };
  if (typeof window !== 'undefined') setTimeout(() => { try { warm(); } catch (e) {} }, 2600);   // (prepared at load, in idle time)
  return { hq, ok: usable, usable, warm, ensure, step, ready: () => !!(D && D.ready) || !!(DL && DL.ready), LODPX, draw, solve, anchors, drawSpectral, drawParts, drawAnima, lights, free: release, release, gpuCount, own, idle, idlePose: idle,
    H: { heart2, heartGem, rail, plate, sweep, bring, hrt }, HEIGHT, FACE0, YAWLIM, MT, WS, STATS, RES, get nv() { return D ? D.nv : 0; }, get nt() { return D ? D.nt : 0; }, get ntL() { return DL ? DL.nt : 0; }, get off() { return NOGL; }, meshes: lo => { const d = lo ? DL : D; return (d && d.M) || null; } };
})();
if (typeof self !== 'undefined') self.GABRIEL_GL = GABRIEL_GL;
