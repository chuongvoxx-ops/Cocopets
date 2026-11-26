/* ---------- (v450 MD) Moby Dick, the six-star Water summon: the spirit whale as a real 3D model on GLM ----------
   An original colossal spirit whale with a sperm whale's silhouette: a broad, blunt, rounded box of a forehead (about a third of
   its length), a long narrow lower jaw slung under it with a row of teeth each side, small eyes low on the head behind the mouth's
   corner under a soft brow, a thick body deepest behind the head, paddle-shaped pectoral fins, a low dorsal hump and a ridge of
   knuckles down a laterally flattened tail stock, and enormous swept, notched flukes.
   - One continuous skinned mesh (built once, in idle time): the body is 46 rings of 29 vertices round a spine (superellipse
     sections, boxy at the head, round behind it, flattened at the tail stock; the hump and the knuckles raised on the back), the
     jaw, teeth, eyes and brows, fins and flukes ride the same mesh as groups. Every vertex keeps its place in its ring's frame
     (or its group's), so a pose is a spine: frames integrated head to tail from curvature channels (the head stays rigid, the
     bend grows toward the tail), the jaw hinged, the fins swung, the flukes pitched and flexed (each fluke vertex turned by its own
     share of the flex: a soft, continuous bend). One GLM pass, one draw call (and its outline); the positions and normals are
     rewritten in place each frame (GLM.touchGeo), the attributes uploaded once.
   - Materials GLM 495..499 (20k5uz MD-MAT): pearl white and pale silver above, deep blue-violet shadows and belly, slow-drifting
     star fields and constellation lines glowing inside it, luminous contour lines (the flanks' lateral lines, the head's case,
     the dorsal ridge), a pearly fresnel edge, translucent glowing fin and fluke edges, expressive eyes (a glowing iris ring and a
     catchlight), ivory teeth; uFx dissolves it into foam (a noise front edged white), uGlow2 the slam's flash. A thin luminous
     blue outline (S.outline), and the waterline: S.clip cuts it at the surface with a bright band where it breaks the water.
   - The view: the game's floor is drawn top-down (a tile a square), so the model uses an oblique projection that keeps the floor
     plane exactly as the game's (screen x = x, screen y = y - 0.9 z, in tiles): the whale lying on the floor covers on screen
     exactly the ground it covers in the game (its slam's footprint matches what is seen).
   MOBY_GL: usable(), warm(), ready(), step(ms), release() (frees the GPU buffers; returns how many), gpuCount(), pose(P) (poses
   the mesh and returns its anchors in tiles from the origin), draw(c, o) (the GPU picture), draw2D(c, o) (the painted picture
   from the same posed mesh when WebGL is missing: a shaded silhouette, fins, flukes, eye, lines and stars), dims, STATS.
   Real-GPU WebGL only (window.__MD_GL = 1 or __NG_GL = 1 force it on a software rasteriser for the tests; __MD_GL = 0 turns it off). */
const MOBY_GL = (() => {
  const TAU = Math.PI * 2;
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  /* 3x3 rotations, row-major (M v: the columns are the frame's axes) */
  const mm = (A, B) => { const R = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return R; };
  const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
  const ry = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };   // (+a: the x axis turned down)
  const rz = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
  const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  /* ================= the measures (tiles) =================
     s runs along the body, 0 the snout's face .. 1 the flukes' root; the model's x points forward, y to its left, z up; the root
     (the origin a pose places) is the spine's point at s 0.40, its centre of mass just behind the head */
  const LEN = 5.8, S0 = 0.4, NMAIN = 40, NV = 28, CAPL = 0.02;   // (v455 MD2: 6.6 -> 5.8 tiles, so the whole leap, dive and tail-slap fit a phone's view round the aim)
  const xOf = s => LEN * (S0 - s);
  // the sections: s, half width, height above the spine, depth below it, the superellipse's exponent (boxy head, round body)
  const PROF = [[0.00, 0.078, 0.084, 0.034, 2.9], [0.02, 0.094, 0.102, 0.052, 3.2], [0.06, 0.104, 0.114, 0.07, 3.2], [0.14, 0.11, 0.118, 0.086, 3.1],
    [0.24, 0.112, 0.113, 0.098, 3.0], [0.32, 0.116, 0.104, 0.112, 2.6], [0.40, 0.121, 0.098, 0.122, 2.3], [0.50, 0.114, 0.096, 0.119, 2.1], [0.60, 0.098, 0.098, 0.101, 2.0],
    [0.68, 0.080, 0.084, 0.083, 2.0], [0.76, 0.060, 0.071, 0.064, 2.0], [0.84, 0.042, 0.059, 0.048, 2.0], [0.92, 0.028, 0.047, 0.036, 2.0], [1.00, 0.020, 0.031, 0.024, 2.0]];
  function prof(s) {   // Catmull-Rom through the table: [w, hT, hB, n] (x LEN for the first three)
    s = Math.max(0, Math.min(1, s)); let i = 0; while (i < PROF.length - 2 && PROF[i + 1][0] < s) i++;
    const p0 = PROF[Math.max(0, i - 1)], p1 = PROF[i], p2 = PROF[i + 1], p3 = PROF[Math.min(PROF.length - 1, i + 2)], u = (s - p1[0]) / (p2[0] - p1[0] || 1), u2 = u * u, u3 = u2 * u, out = [];
    for (let k = 1; k <= 4; k++) out.push(0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u3));
    out[0] *= LEN; out[1] *= LEN; out[2] *= LEN; return out;
  }
  // the back's relief: the dorsal hump and the knuckles behind it (added to the top of a section, fading round its sides)
  const relief = s => LEN * (0.022 * Math.exp(-(((s - 0.63) / 0.036) ** 2)) + [0.705, 0.75, 0.795, 0.84].reduce((a, k, j) => a + (0.0085 - j * 0.0012) * Math.exp(-(((s - k) / 0.012) ** 2)), 0));
  // a section's point at angle ph (0 the back, pi/2 its left, pi the belly) and scale k
  function secPt(P, s, ph, k) { const c = Math.cos(ph), sn = Math.sin(ph), e = 2 / P[3], y = P[0] * Math.sign(sn) * Math.pow(Math.abs(sn), e), z = (c >= 0 ? P[1] + relief(s) * Math.pow(c, 3) : P[2]) * Math.sign(c) * Math.pow(Math.abs(c), e); return [y * k, z * k]; }
  const HINGE_S = 0.275, EYE_S = 0.25, FIN_S = 0.35;
  const ringAt = s => Math.round(s * NMAIN);
  const DIMS = { LEN, S0, xOf, prof, HINGE_S, EYE_S, FIN_S, NMAIN };

  /* ================= the mesh (built once) ================= */
  const MAT = { SKIN: 495, FIN: 496, EYE: 497, TOOTH: 498, MOUTH: 499 };
  let D = null;
  function build() {
    const P = [], N = [], A = [], I = [], FR = [], GR = [], FK = [];   // (rest positions and normals in the frame's coordinates, attributes, indices, frame ring, group, the fluke's flex share)
    const vtx = (p, n, m, e, ax, fr, gr, fk) => { P.push(p[0], p[1], p[2]); const l = Math.hypot(n[0], n[1], n[2]) || 1; N.push(n[0] / l, n[1] / l, n[2] / l); A.push(m, e, ax); FR.push(fr); GR.push(gr || 0); FK.push(fk || 0); return P.length / 3 - 1; };
    /* a surface of rows x cols vertices, normals from the grid (in the space at() gives), turned to face out (ref: a vector
       pointing outward at that vertex); loc (optional) moves a point from that space into its frame's (the body's rings) */
    const grid = (rows, cols, at, mat, e, ax, fr, gr, fk, closeCols, ref, loc) => {
      const base = P.length / 3, Gp = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) Gp.push(at(j, i));
      const g = (j, i) => Gp[Math.max(0, Math.min(rows - 1, j)) * cols + (closeCols ? ((i % (cols - 1)) + (cols - 1)) % (cols - 1) : Math.max(0, Math.min(cols - 1, i)))];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = g(j + 1, i), b = g(j - 1, i), c = g(j, i + 1), d = g(j, i - 1), du = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dv = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
        let n = [du[1] * dv[2] - du[2] * dv[1], du[2] * dv[0] - du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0]]; const p = g(j, i), rf = ref(j, i, p);
        if (Math.hypot(n[0], n[1], n[2]) < 1e-9) n = rf.slice(); else if (n[0] * rf[0] + n[1] * rf[1] + n[2] * rf[2] < 0) n = [-n[0], -n[1], -n[2]];
        vtx(loc ? loc(p, j, i) : p, n, typeof mat === 'function' ? mat(j, i) : mat, e(j, i), ax(j, i), typeof fr === 'function' ? fr(j, i) : fr, gr, fk ? fk(j, i) : 0); }
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) { const a = base + j * cols + i; I.push(a, a + 1, a + cols + 1, a, a + cols + 1, a + cols); }
      return base; };
    /* the body: the snout's rounded face (cap rings on ring 0), the 41 main rings, the tail's end cap (on ring 40) */
    const RS = [];   // each row: [frame ring, s, scale, x offset from the frame]
    for (let j = 0; j < 5; j++) { const al = j / 5 * Math.PI / 2; RS.push([0, 0, Math.max(0.0005, Math.sin(al)), LEN * CAPL * Math.cos(al)]); }
    for (let i = 0; i <= NMAIN; i++) RS.push([i, i / NMAIN, 1, 0]);
    RS.push([NMAIN, 1, 0.65, -LEN * 0.008], [NMAIN, 1, 0.0005, -LEN * 0.012]);
    const PR = RS.map(r => prof(r[1]));
    // (the normals are found in the straight rest body, where each ring stands at its own place along x; each point is then kept in its ring's frame)
    grid(RS.length, NV + 1, (j, i) => { const r = RS[j], ph = i / NV * TAU, q = secPt(PR[j], r[1], ph, r[2]); return [xOf(r[0] / NMAIN) + r[3], q[0], q[1]]; }, MAT.SKIN, (j, i) => i / NV, (j, i) => Math.max(0, RS[j][1]), (j, i) => RS[j][0], 0, null, true,
      (j, i, p) => [p[0] - xOf(RS[j][0] / NMAIN), p[1], p[2]], (p, j) => [p[0] - xOf(RS[j][0] / NMAIN), p[1], p[2]]);
    const nBody = P.length / 3;
    /* the jaw: a long narrow tapering rod slung under the head from the hinge (ring at HINGE_S) forward, its top the mouth (dark
       violet) with a row of ivory teeth each side; group 1, its points in the hinge's own frame */
    const fj = ringAt(HINGE_S), sj = fj / NMAIN, LJ = (sj - 0.035) * LEN, hz0 = -prof(sj)[2] * 0.86, NJ = 16, NJV = 16;
    const jawC = a => { const s = sj - a * LJ / LEN, hb = prof(s)[2]; return [a * LJ, 0, -hb * 0.86 - hz0]; };   // (its centre line: under the head's bottom line; relative to the hinge)
    const jw = a => LEN * 0.033 * (1 - 0.38 * a) * (a > 0.93 ? Math.sqrt(Math.max(0.0004, 1 - ((a - 0.93) / 0.07) ** 2)) : 1), jh = a => LEN * 0.021 * (1 - 0.3 * a) * (a > 0.93 ? Math.sqrt(Math.max(0.0004, 1 - ((a - 0.93) / 0.07) ** 2)) : 1);
    grid(NJ + 1, NJV + 1, (j, i) => { const a = j / NJ, c = jawC(a), ph = i / NJV * TAU, cs = Math.cos(ph), sn = Math.sin(ph), e = 2 / 2.4; return [c[0], jw(a) * Math.sign(sn) * Math.pow(Math.abs(sn), e), c[2] + jh(a) * Math.sign(cs) * Math.pow(Math.abs(cs), e)]; },
      (j, i) => (Math.cos(i / NJV * TAU) > 0.55 ? MAT.MOUTH : MAT.SKIN), (j, i) => 0.5 - 0.18 * Math.cos(i / NJV * TAU), (j, i) => sj - j / NJ * LJ / LEN, fj, 1, null, true, (j, i, p) => { const c = jawC(j / NJ); return [j === NJ ? 1 : 0, p[1] - c[1], p[2] - c[2]]; },
      p => [p[0], p[1], p[2] + hz0]);
    for (const sd of [1, -1]) for (let k = 0; k < 11; k++) {   // the teeth: cones on the jaw's top edge, leaning out a little
      const a = 0.14 + k * 0.072, c = jawC(a), b = [c[0], sd * jw(a) * 0.62, c[2] + hz0 + jh(a) * 0.82], tip = [b[0] + LEN * 0.002, b[1] + sd * LEN * 0.003, b[2] + LEN * (0.013 - k * 0.0004)], r0 = LEN * 0.0055 * (1 - k * 0.03), n0 = P.length / 3;
      vtx(tip, [0, sd * 0.3, 1], MAT.TOOTH, 1, 0, fj, 1);
      for (let q = 0; q < 6; q++) { const ph = q / 6 * TAU, d = [Math.cos(ph), Math.sin(ph), 0]; vtx([b[0] + d[0] * r0, b[1] + d[1] * r0, b[2]], [d[0], d[1], 0.4], MAT.TOOTH, 0.2, 0, fj, 1); }
      for (let q = 0; q < 6; q++) I.push(n0, n0 + 1 + q, n0 + 1 + (q + 1) % 6);
    }
    /* the eyes (group 0 on the ring at EYE_S): small dark spheres low on the head; vA.y 0 at the pupil's middle .. 1 behind it; a soft
       brow of skin over each */
    const fe = ringAt(EYE_S), se = fe / NMAIN, Pe = prof(se), RE = LEN * 0.019;
    for (const sd of [1, -1]) {
      const ec = [LEN * 0.004, sd * Pe[0] * 0.93, -LEN * 0.03], ax = norm([0.28, sd, -0.12]);
      const u = norm([ax[1], -ax[0], 0]), v = [ax[1] * u[2] - ax[2] * u[1], ax[2] * u[0] - ax[0] * u[2], ax[0] * u[1] - ax[1] * u[0]];
      grid(9, 13, (j, i) => { const th = j / 8 * Math.PI, ph = i / 12 * TAU, ct = Math.cos(th), stt = Math.sin(th), cp = Math.cos(ph), sp = Math.sin(ph);
        return [ec[0] + RE * (ax[0] * ct + (u[0] * cp + v[0] * sp) * stt), ec[1] + RE * (ax[1] * ct + (u[1] * cp + v[1] * sp) * stt), ec[2] + RE * (ax[2] * ct + (u[2] * cp + v[2] * sp) * stt)]; },
        MAT.EYE, (j, i) => j / 8, () => 0, fe, 0, null, true, (j, i, p) => [p[0] - ec[0], p[1] - ec[1], p[2] - ec[2]]);
      const bc = [ec[0] + LEN * 0.004, ec[1] - sd * RE * 0.2, ec[2] + RE * 1.05], br = [RE * 2.2, RE * 0.9, RE * 0.75];   // (the brow: a low ridge of skin above the eye)
      grid(7, 11, (j, i) => { const th = j / 6 * Math.PI, ph = i / 10 * TAU; return [bc[0] + br[0] * Math.sin(th) * Math.cos(ph), bc[1] + br[1] * Math.sin(th) * Math.sin(ph), bc[2] + br[2] * Math.cos(th)]; }, MAT.SKIN, () => 0.3, () => se, fe, 0, null, true, (j, i, p) => [p[0] - bc[0], p[1] - bc[1], p[2] - bc[2]]);
    }
    /* the pectoral fins (groups 2 left, 3 right, on the ring at FIN_S): paddles built pointing back along -x, flat across z,
       thin across y; vA.y the edge (0 the middle .. 1 the rim), vA.z along */
    const ff = ringAt(FIN_S), sf = ff / NMAIN, Pf = prof(sf), LF = LEN * 0.125, WF = LEN * 0.038, TF = LEN * 0.009, NFA = 10, NFB = 8;
    const finPiv = sd => [0, sd * Pf[0] * 0.8, -Pf[2] * 0.5];
    for (const sd of [1, -1]) { const pv = finPiv(sd);
      for (const face of [1, -1]) grid(NFA + 1, NFB + 1, (j, i) => { const a = j / NFA, b = i / NFB * 2 - 1, hw = WF * Math.sqrt(Math.max(0, Math.sin(Math.PI * (0.06 + 0.94 * a)))) * (1 - 0.25 * a), th = TF * (1 - b * b) * (1 - 0.75 * a) + 0.0004;
        return [pv[0] - a * LF, pv[1] + sd * face * th, pv[2] + b * hw + a * a * LF * 0.05]; }, MAT.FIN, (j, i) => Math.max(j / NFA, Math.abs(i / NFB * 2 - 1)), (j, i) => j / NFA, ff, sd > 0 ? 2 : 3, null, false, () => [0, sd * face, 0]);
    }
    /* the flukes (group 4 on the last ring): swept-back lobes with a notch in the middle of the trailing edge; span along y, chord
       along -x, a lens of thickness; each vertex's flex share (FK) grows with its distance behind the root */
    const YF = LEN * 0.205, NFS = 16, NFC = 8;   // (v455 MD2: broader, more expansive flukes: span 0.155 -> 0.205 of the length each side, chord 0.078 -> 0.096)
    const le = y => -LEN * (0.004 + 0.074 * Math.pow(Math.abs(y) / YF, 1.6)), chord = y => LEN * 0.096 * Math.pow(Math.max(0, 1 - (y / YF) ** 2), 0.45) + LEN * 0.004, notch = y => LEN * 0.034 * Math.exp(-((y / (YF * 0.12)) ** 2));
    for (const face of [1, -1]) grid(NFS * 2 + 1, NFC + 1, (j, i) => { const y = (j / NFS - 1) * YF, b = i / NFC, x0 = le(y), x1 = x0 - Math.max(LEN * 0.004, chord(y) - notch(y)), x = lerp(x0, x1, b), th = LEN * 0.014 * Math.pow(Math.max(0, 1 - (y / YF) ** 2), 0.7) * 4 * b * (1 - b) * (b < 0.5 ? 1 : 0.85) + 0.0005;
      return [x, y, face * th + LEN * 0.004 * (1 - (y / YF) ** 2)]; }, MAT.FIN, (j, i) => Math.max(Math.abs(j / NFS - 1), Math.abs(i / NFC * 2 - 1)), (j, i) => Math.abs(j / NFS - 1), NMAIN, 4, (j, i) => { const y = (j / NFS - 1) * YF, b = i / NFC, x = lerp(le(y), le(y) - chord(y), b); return Math.min(1.6, -x / (LEN * 0.1)); }, false, () => [0, 0, face]);
    const nv = P.length / 3;
    const M = { pos: new Float32Array(nv * 3), nrm: new Float32Array(nv * 3), att: new Float32Array(A), idx: nv > 65535 ? new Uint32Array(I) : new Uint16Array(I), nv, ntri: I.length / 3, gl: null };
    D = { M, RP: new Float32Array(P), RN: new Float32Array(N), FR: new Int16Array(FR), GR: new Uint8Array(GR), FK: new Float32Array(FK), nBody, nv, rows: RS.length, RS, pivF: [finPiv(1), finPiv(-1)], fj, fe, ff, ready: true, up: false, msBuilt: 0,
      W: new Float32Array(nv * 3), ringP: new Float32Array((NMAIN + 1) * 3), ringR: new Float32Array((NMAIN + 1) * 9) };
    return D;
  }
  function data() { if (!D) { const t0 = nowMs(); build(); D.msBuilt = nowMs() - t0; } return D; }

  /* ================= the pose =================
     P: { x, y, z (the root, tiles from the drawing's origin; z up), yaw (heading in the floor's plane, 0 = +x), pitch (+ the nose
     up), roll (+ the left flank turned up), arch (the body's bend in its own vertical plane: + the tail up), tail (the tail
     stock's extra bend), side (a bend to its right, +), swim, swimF (a travelling wave toward the tail: amplitude, phase),
     fluke (the flukes' pitch, + up), flex (their bend), fin (0 tucked .. 1 spread), flap (the fins' beat, rad), jaw (open, rad) }.
     Returns the anchors (tiles from the origin): the spine's points, the snout, the eyes, the fin and fluke tips, the head's top */
  const A = (s, a, b) => sstep(a, b, s), MF = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  function curv(P, s) {
    const body = A(s, 0.3, 0.5), tl = A(s, 0.58, 0.86), wv = P.swim ? P.swim * Math.sin(TAU * (1.15 * s - (P.swimF || 0))) * A(s, 0.32, 0.62) * (0.4 + s) : 0;
    const kv = P.kv ? P.kv[Math.min(NMAIN - 1, Math.max(0, Math.floor(s * NMAIN)))] || 0 : 0;   // (v455 MD2: a bend of its own per segment, rad per unit of s: the rig's path and the tail stock's flexion)
    const ks = P.ks ? P.ks[Math.min(NMAIN - 1, Math.max(0, Math.floor(s * NMAIN)))] || 0 : 0;   // (v455 MD2: and a sideways one, + to its right: the approach's curving course)
    return [(P.arch || 0) * body + (P.tail || 0) * tl + wv + kv, (P.side || 0) * body + (P.sway || 0) * tl + ks];
  }
  function pose(P) {
    const d = data(), RP = d.RP, RN = d.RN, FR = d.FR, GR = d.GR, FK = d.FK, W = d.W, NW = d.M.nrm, ringP = d.ringP, ringR = d.ringR;
    const R0 = mm(rz(P.yaw || 0), mm(ry(-(P.pitch || 0)), rx(P.roll || 0)));
    const i0 = Math.round(S0 * NMAIN), ds = 1 / NMAIN;
    const setR = (i, R, p) => { for (let k = 0; k < 9; k++) ringR[i * 9 + k] = R[k]; ringP[i * 3] = p[0]; ringP[i * 3 + 1] = p[1]; ringP[i * 3 + 2] = p[2]; };
    setR(i0, R0, [P.x || 0, P.y || 0, P.z || 0]);
    // toward the tail, then toward the head: each step turns by the curvature at its middle
    let R = R0, p = [P.x || 0, P.y || 0, P.z || 0];
    for (let i = i0; i < NMAIN; i++) { const k = curv(P, (i + 0.5) * ds), Rh = mm(R, mm(ry(k[0] * ds * 0.5), rz(-k[1] * ds * 0.5))), st = LEN * ds; p = [p[0] - Rh[0] * st, p[1] - Rh[3] * st, p[2] - Rh[6] * st]; R = mm(R, mm(ry(k[0] * ds), rz(-k[1] * ds))); setR(i + 1, R, p); }
    R = R0; p = [P.x || 0, P.y || 0, P.z || 0];
    for (let i = i0; i > 0; i--) { const k = curv(P, (i - 0.5) * ds), Rh = mm(R, mm(rz(k[1] * ds * 0.5), ry(-k[0] * ds * 0.5))), st = LEN * ds; p = [p[0] + Rh[0] * st, p[1] + Rh[3] * st, p[2] + Rh[6] * st]; R = mm(R, mm(rz(k[1] * ds), ry(-k[0] * ds))); setR(i - 1, R, p); }
    // the groups' own turns (in their ring's frame, about their pivots)
    const Gj = ry(P.jaw || 0), piv = [null, [0, 0, 0], d.pivF[0], d.pivF[1], [0, 0, 0]];
    // (a fin points back from its pivot: turned out (z), drooped (y: - its tip down) and rolled about its own length (x); the right one mirrored)
    const fs = cl(P.fin == null ? 0.5 : P.fin), fl = P.flap || 0, yo = 0.22 + 0.7 * fs, dr = 0.5 - 0.32 * fs + fl, ro = 0.25 + 0.45 * fs, GfL = mm(rz(-yo), mm(ry(-dr), rx(ro))), GfR = mm(rz(yo), mm(ry(-dr), rx(-ro)));
    const G = [I3, Gj, GfL, GfR, null], fa = P.fluke || 0, fx = P.flex || 0, hz0 = -prof(d.fj / NMAIN)[2] * 0.86, spr = 1 + 0.14 * cl(P.spread || 0);   // (v455 MD2: spread, the flukes opened wider for the slap's anticipation)
    const pj = [0, 0, hz0];   // (the jaw's hinge in its ring's frame)
    for (let v = 0, n = d.nv; v < n; v++) {
      const o = v * 3, f = FR[v], g = GR[v]; let x = RP[o], y = RP[o + 1], z = RP[o + 2], a = RN[o], b = RN[o + 1], c = RN[o + 2];
      if (g) {
        let M; if (g === 4) { const an = fa + fx * FK[v], cs = Math.cos(an), sn = Math.sin(an); MF[0] = cs; MF[2] = sn; MF[6] = -sn; MF[8] = cs; M = MF; y *= spr; } else M = G[g];   // (a fluke vertex: its own pitch, no allocation)
        const pv = g === 1 ? pj : piv[g], X0 = x - pv[0], Y0 = y - pv[1], Z0 = z - pv[2];
        x = pv[0] + M[0] * X0 + M[1] * Y0 + M[2] * Z0; y = pv[1] + M[3] * X0 + M[4] * Y0 + M[5] * Z0; z = pv[2] + M[6] * X0 + M[7] * Y0 + M[8] * Z0;
        const a2 = M[0] * a + M[1] * b + M[2] * c, b2 = M[3] * a + M[4] * b + M[5] * c, c2 = M[6] * a + M[7] * b + M[8] * c; a = a2; b = b2; c = c2;
      }
      const q = f * 9, Rq = ringR, P3 = f * 3;
      W[o] = ringP[P3] + Rq[q] * x + Rq[q + 1] * y + Rq[q + 2] * z; W[o + 1] = ringP[P3 + 1] + Rq[q + 3] * x + Rq[q + 4] * y + Rq[q + 5] * z; W[o + 2] = ringP[P3 + 2] + Rq[q + 6] * x + Rq[q + 7] * y + Rq[q + 8] * z;
      NW[o] = Rq[q] * a + Rq[q + 1] * b + Rq[q + 2] * c; NW[o + 1] = Rq[q + 3] * a + Rq[q + 4] * b + Rq[q + 5] * c; NW[o + 2] = Rq[q + 6] * a + Rq[q + 7] * b + Rq[q + 8] * c;
    }
    return anchors();
  }
  const rp = i => [D.ringP[i * 3], D.ringP[i * 3 + 1], D.ringP[i * 3 + 2]];
  const wv = v => [D.W[v * 3], D.W[v * 3 + 1], D.W[v * 3 + 2]];
  let ANC = null;
  function anchors() {
    const d = D, out = { spine: [], snout: null, head: null, eyes: [], fins: [], flukes: [], belly: [], back: [] };
    for (let i = 0; i <= NMAIN; i += 2) { const s = i / NMAIN, Pq = prof(s), R = d.ringR, q = i * 9; out.spine.push({ s, p: rp(i), r: Math.max(Pq[0], (Pq[1] + Pq[2]) / 2), up: [R[q + 2], R[q + 5], R[q + 8]], side: [R[q + 1], R[q + 4], R[q + 7]], fwd: [R[q], R[q + 3], R[q + 6]] }); }
    const R0 = d.ringR, p0 = rp(0); out.snout = [p0[0] + R0[0] * LEN * CAPL, p0[1] + R0[3] * LEN * CAPL, p0[2] + R0[6] * LEN * CAPL];
    const ih = ringAt(0.14), Ph = prof(0.14), q = ih * 9, ph = rp(ih); out.head = [ph[0] + R0[q + 2] * Ph[1], ph[1] + R0[q + 5] * Ph[1], ph[2] + R0[q + 8] * Ph[1]];
    // the eyes: the first vertex of each eye's grid is its pupil's middle (the pole)
    let v = d.nBody, cnt = 0; void v; void cnt;
    out.eyes = EYEV.map(i => wv(i)); out.fins = FINV.map(i => wv(i)); out.flukes = FLKV.map(i => wv(i));
    ANC = out; return out;
  }
  /* (v455 MD2) the posed flukes: their lowest point (z) and their middle (x, y, z: the mean of their vertices), tiles from the origin
     (the tail-slap's contact: when the flukes' underside reaches the water) */
  function flukeLow() { const d = D; if (!d) return null; let zm = 1e9, sx = 0, sy = 0, sz = 0, n = 0;
    for (let v = d.nBody; v < d.nv; v++) { if (d.GR[v] !== 4) continue; const z = d.W[v * 3 + 2]; if (z < zm) zm = z; sx += d.W[v * 3]; sy += d.W[v * 3 + 1]; sz += z; n++; }
    return n ? { z: zm, x: sx / n, y: sy / n, zc: sz / n } : null; }
  // the vertex indices of the anchors that ride groups (found once the mesh exists)
  let EYEV = [], FINV = [], FLKV = [];
  function findAnchors() {
    const d = D, M = d.M.att, n = d.nv; EYEV = []; FINV = []; FLKV = [];
    for (let v = 0; v < n; v++) { const m = M[v * 3], e = M[v * 3 + 1]; if (m === MAT.EYE && e === 0 && EYEV.length < 2 && (EYEV.length === 0 || Math.abs(d.RP[v * 3 + 1] - d.RP[EYEV[0] * 3 + 1]) > 0.1)) EYEV.push(v); }
    // the fin tips: the vertex furthest from its pivot in each fin group; the fluke tips: the furthest left and right
    let b2 = [-1, -1], d2 = [0, 0], fL = -1, fR = -1, yL = -1e9, yR = 1e9;
    for (let v = 0; v < n; v++) { const g = d.GR[v]; if (g === 2 || g === 3) { const k = g - 2, pv = d.pivF[k], dd = Math.hypot(d.RP[v * 3] - pv[0], d.RP[v * 3 + 1] - pv[1], d.RP[v * 3 + 2] - pv[2]); if (dd > d2[k]) { d2[k] = dd; b2[k] = v; } }
      if (g === 4) { const y = d.RP[v * 3 + 1]; if (y > yL) { yL = y; fL = v; } if (y < yR) { yR = y; fR = v; } } }
    FINV = b2.filter(i => i >= 0); FLKV = [fL, fR].filter(i => i >= 0);
  }

  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0;
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Moby Dick GL: ' + String(e && e.message || e)); } catch (e2) {} };
  function usable() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__MD_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
    if (GLM.soft && !(flag('__MD_GL') === 1 || flag('__NG_GL') === 1)) return false;
    return true;
  }
  /* idle-time preparation: the mesh (a few ms) and one tiny pass that uploads it and compiles the materials' branch */
  let IDLE = 0;
  function warm() {
    if (IDLE) return true; const d0 = D; if (d0 && d0.up) return true; IDLE = 1;
    const run = () => { IDLE = 0; try { const d = data(); if (!EYEV.length) findAnchors(); if (usable() && !d.up) { pose({}); prewarm(); } } catch (e) { fail(e); } };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 400 }); else setTimeout(run, 60);
    return true;
  }
  function prewarm() { const d = data(); if (d.up || !GLM.ok()) return; const it = item(); it.R0.set([0.001, 0, 0]); it.R1.set([0, 0.001, 0]); it.R2.set([0, 0, 0.001]); it.T.fill(0);
    GLM.render(4, 4, { px: [1, 0, 0], py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 }, [it]); d.up = true; }
  function step() { data(); if (!EYEV.length) findAnchors(); return true; }
  function release() { if (!D || !D.M || !D.M.gl) { if (D) D.up = false; return 0; } if (typeof GLM !== 'undefined' && GLM.free) GLM.free(D.M); else D.M.gl = null; D.up = false; return 1; }
  const gpuCount = () => (D && D.M && D.M.gl ? 1 : 0);
  const IT = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) };
  const item = () => { IT.mesh = data().M; IT.alpha = 1; IT.glow = 0; IT.glow2 = 0; IT.spill = 0; IT.kind = 0; IT.wear = 1; IT.fx = 0; IT.first = 0; IT.cnt = 0; IT.outline = true; return IT; };

  /* ================= drawing =================
     o: { X0, Y0 (the origin's screen point), k (px a tile), alpha, glow (the markings), glow2 (the flash), dis (the dissolve 0..1),
     t (seconds, the stars' drift), clip (true: cut at the water's surface), res (a resolution factor) } */
  const CZ = 0.9, GS = 0.25, VV = norm([0, CZ, 1]), LK = norm([-0.55, 0.12, 0.82]), LS = norm([-0.2, 0.25, 0.95]), LR = norm([0.5, -0.75, 0.45]);
  const SIDEY = 0.12, VS = norm([0, 1, SIDEY]);   // (v455 MD2: the studio's side view: seen from the side, a little from above)
  const RIMC = [0.55, 0.85, 1.45], AMBC = [1, 1, 1], OUTC = [0.32, 0.52, 0.98], GLCAP = 1600;
  const PXB = [0.5e6, 0.36e6, 0.26e6, 0.26e6];
  const budget = () => { try { if (typeof GQ === 'undefined' || typeof arc === 'undefined' || !arc.game || arc.mode !== 'dungeon') return 1e12; return PXB[Math.max(0, Math.min(3, GQ.level() | 0))]; } catch (e) { return 1e12; } };
  function visBox(c) { const m = c.getTransform ? c.getTransform() : null, cv = c.canvas; if (!m || !cv || !cv.width) return null; const det = m.a * m.d - m.b * m.c; if (Math.abs(det) < 1e-9) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [X, Y] of [[0, 0], [cv.width, 0], [0, cv.height], [cv.width, cv.height]]) { const dx = X - m.e, dy = Y - m.f, ux = (m.d * dx - m.c * dy) / det, uy = (-m.b * dx + m.a * dy) / det; x0 = Math.min(x0, ux); y0 = Math.min(y0, uy); x1 = Math.max(x1, ux); y1 = Math.max(y1, uy); }
    return [Math.floor(x0) - 2, Math.floor(y0) - 2, Math.ceil(x1) + 2, Math.ceil(y1) + 2]; }
  const STATS = { ms: 0, n: 0, W: 0, H: 0, px: 0, tris: 0 };
  const RES = { k: 1 };
  /* the posed mesh's box on the screen (z under the water clipped to the surface when o.clip) */
  function box(o) { const d = D, W = d.W, n = d.nv, k = o.k; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const qy = o.side ? SIDEY : 1, qz = o.side ? 1 : CZ;   // (v455 MD2: o.side, a studio's side view)
    for (let v = 0; v < n; v += 2) { const z = o.clip ? Math.max(0, W[v * 3 + 2]) : W[v * 3 + 2], X = o.X0 + W[v * 3] * k, Y = o.Y0 + (W[v * 3 + 1] * qy - z * qz) * k; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; }
    return [x0, y0, x1, y1]; }
  function draw(c, o) {
    const d = data(); if (!usable()) return false;
    try {
      const Mh = d.M, n3 = d.nv * 3, W = d.W, pos = Mh.pos; for (let i = 0; i < n3; i++) pos[i] = W[i] * GS;
      if (Mh.gl) GLM.touchGeo(Mh);
      let [bx0, by0, bx1, by1] = box(o); const mg = o.k * 0.35; bx0 = Math.floor(bx0 - mg); by0 = Math.floor(by0 - mg); bx1 = Math.ceil(bx1 + mg); by1 = Math.ceil(by1 + mg);
      let rx0 = bx0, ry0 = by0, rx1 = bx1, ry1 = by1; const vb = visBox(c); if (vb) { rx0 = Math.max(rx0, vb[0]); ry0 = Math.max(ry0, vb[1]); rx1 = Math.min(rx1, vb[2]); ry1 = Math.min(ry1, vb[3]); if (!(rx1 > rx0 + 1 && ry1 > ry0 + 1)) return true; }
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__MD_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : RES.k) * (o.res || 1) * (typeof GQ !== 'undefined' ? GQ.animaK() : 1);
      let Wp = Math.ceil((rx1 - rx0) * dev), Hp = Math.ceil((ry1 - ry0) * dev); const scl = Math.min(1, GLCAP / Math.max(Wp, Hp)); Wp = Math.max(2, Math.ceil(Wp * scl)); Hp = Math.max(2, Math.ceil(Hp * scl));
      const bud = budget(); if (Wp * Hp > bud) { const q = Math.sqrt(bud / (Wp * Hp)); Wp = Math.max(2, Math.ceil(Wp * q)); Hp = Math.max(2, Math.ceil(Hp * q)); }
      const bw = rx1 - rx0, bh = ry1 - ry0, kk = o.k / GS, low = lowFx();
      const S = { px: [1, 0, 0], py: o.side ? [0, SIDEY, -1] : [0, 1, -CZ], pd: o.side ? VS : VV, cl: [2 * kk / bw, 2 * (o.X0 - rx0) / bw - 1, -2 * kk / bh, 1 - 2 * (o.Y0 - ry0) / bh], v: o.side ? VS : VV, lk: LK, ls: LS, lr: LR, up: [0, 0, 1], low, rim: RIMC, amb: AMBC, t: o.t || 0,
        outline: low || (o.dis || 0) > 0.01 ? 0 : Math.max(0.6, 0.8 * (Wp / bw)), outlineCol: OUTC, outlineBias: 0.003, clip: o.clip ? [0, 0.012] : null, keep: true };
      const it = item(); it.R0.set([1, 0, 0]); it.R1.set([0, 1, 0]); it.R2.set([0, 0, 1]); it.T.fill(0); it.glow = o.glow || 0; it.glow2 = o.glow2 || 0; it.fx = o.dis || 0; it.wear = o.seed || 1;
      const t0 = nowMs(), cvs = GLM.render(Wp, Hp, S, [it]); if (!cvs) return false;
      const al = o.alpha == null ? 1 : o.alpha; if (al > 0.004) { c.save(); c.globalAlpha = Math.min(1, al); c.drawImage(cvs, 0, 0, Wp, Hp, rx0, ry0, bw, bh); c.restore(); }
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; STATS.W = Wp; STATS.H = Hp; STATS.px = Wp * Hp; STATS.tris = Mh.ntri;
      if (!GLM.soft && STATS.n > 20) RES.k = STATS.ms > 6 ? Math.max(0.65, RES.k - 0.02) : STATS.ms < 3 ? Math.min(1, RES.k + 0.01) : RES.k;
      return true;
    } catch (e) { fail(e); return false; }
  }
  /* ---- the painted picture (no WebGL): from the same posed mesh. The body's outline from each ring's two extremes across the spine's
     direction on the screen (under the water: held at the surface), a vertical pearl-to-violet gradient, the lateral line, a few stars;
     the fins and flukes as shaded polygons; the eye; a luminous edge ---- */
  const scr = (o, p) => [o.X0 + p[0] * o.k, o.Y0 + (p[1] - (o.clip ? Math.max(0, p[2]) : p[2]) * CZ) * o.k];
  function draw2D(c, o) {
    const d = data(), W = d.W, k = o.k, al = (o.alpha == null ? 1 : o.alpha) * (1 - cl((o.dis || 0) * 1.1)); if (!(al > 0.01)) return true;
    const rows = d.rows, cols = NV + 1, L = [], Rr = [];
    // (v455 MD2) cut at the water: only the longest run of sections whose spine is above the surface (the rest is under it)
    let j0 = 0, j1 = rows - 1; if (o.clip) { let bs = -1, bl = 0, cs = -1; for (let j = 0; j <= rows; j++) { const up = j < rows && rp(d.RS[j][0])[2] > -0.04; if (up && cs < 0) cs = j; if (!up && cs >= 0) { if (j - cs > bl) { bl = j - cs; bs = cs; } cs = -1; } } if (bl < 2) return true; j0 = bs; j1 = bs + bl - 1; }
    for (let j = j0; j <= j1; j++) { const f = d.RS[j][0], i2 = Math.min(NMAIN, f + 1), i1 = Math.max(0, f - 1), a = scr(o, rp(i1)), b = scr(o, rp(i2)); let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const nx = -dy, ny = dx;
      let lo = 1e9, hi = -1e9, pl = null, ph = null; for (let i = 0; i < cols - 1; i++) { const v = j * cols + i, q = scr(o, [W[v * 3], W[v * 3 + 1], W[v * 3 + 2]]), s = q[0] * nx + q[1] * ny; if (s < lo) { lo = s; pl = q; } if (s > hi) { hi = s; ph = q; } }
      L.push(pl); Rr.push(ph); }
    let y0 = 1e9, y1 = -1e9; for (const q of L.concat(Rr)) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    const poly = pts => { c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); };
    const grp = (g, ord) => { const pts = []; for (let v = d.nBody; v < d.nv; v++) if (d.GR[v] === g) pts.push(scr(o, [W[v * 3], W[v * 3 + 1], W[v * 3 + 2]])); if (pts.length < 3) return null; if (o.clip) { let zs = 0, n = 0; for (let v = d.nBody; v < d.nv; v++) if (d.GR[v] === g) { zs += W[v * 3 + 2]; n++; } if (zs / n < 0) return null; }   /* (v455 MD2: a fin or the flukes under the water: not drawn) */ const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length, cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;
      pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cr = (o2, a2, b2) => (a2[0] - o2[0]) * (b2[1] - o2[1]) - (a2[1] - o2[1]) * (b2[0] - o2[0]), lo2 = [], up2 = [];   // (the convex hull: monotone chain)
      for (const q of pts) { while (lo2.length >= 2 && cr(lo2[lo2.length - 2], lo2[lo2.length - 1], q) <= 0) lo2.pop(); lo2.push(q); }
      for (let i = pts.length - 1; i >= 0; i--) { const q = pts[i]; while (up2.length >= 2 && cr(up2[up2.length - 2], up2[up2.length - 1], q) <= 0) up2.pop(); up2.push(q); }
      void cx; void cy; void ord; return lo2.slice(0, -1).concat(up2.slice(0, -1)); };
    c.save(); c.globalAlpha = al; c.lineJoin = 'round'; c.lineCap = 'round';
    const shade = (pts, top, mid, bot) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, bot); poly(pts); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(120,170,255,0.9)'; c.lineWidth = Math.max(1, k * 0.045); c.stroke(); };
    const fins = [grp(2), grp(3)], fl = grp(4);
    // far fin first (the one whose tip is higher on the screen is behind)
    if (fl) shade(fl, '#EEF2FF', '#A9B4DA', '#3A3582');
    if (fins[0] && fins[1]) { const f0 = fins[0], f1 = fins[1], back = f0.reduce((a, q) => a + q[1], 0) / f0.length < f1.reduce((a, q) => a + q[1], 0) / f1.length ? 0 : 1; shade(fins[back], '#E6ECFF', '#9AA6D2', '#33307A'); }
    const body = L.concat(Rr.slice().reverse()); shade(body, '#F7F9FF', '#B9C3E4', '#2E2A72');
    // a belly of blue-violet: the lower outline's band
    c.save(); poly(body); c.clip(); c.globalCompositeOperation = 'source-atop';
    c.strokeStyle = 'rgba(40,34,120,0.35)'; c.lineWidth = k * 0.5; c.beginPath(); Rr.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(150,215,255,0.55)'; c.lineWidth = Math.max(1, k * 0.05); c.beginPath(); L.forEach((q, i) => { const r = Rr[i], u = 0.45; const x = lerp(q[0], r[0], u), y = lerp(q[1], r[1], u); if (i < 8) return; i === 8 ? c.moveTo(x, y) : c.lineTo(x, y); }); c.stroke();
    if (typeof glowSprite === 'function' && typeof blitSized === 'function') for (let i = 0; i < 18 && L.length > 4; i++) { const j = Math.min(L.length - 1, (j0 > 0 ? 0 : 6) + Math.floor((i * 7.13) % Math.max(1, L.length - 10))), u = 0.2 + ((i * 3.7) % 1) * 0.6, q = L[j], r = Rr[j], x = lerp(q[0], r[0], u), y = lerp(q[1], r[1], u), s = k * (0.12 + 0.06 * Math.sin((o.t || 0) * 2 + i)); blitSized(c, glowSprite('#BFE6FF'), x - s, y - s, s * 2, s * 2); }
    c.restore();
    if (fins[0] && fins[1]) { const f0 = fins[0], f1 = fins[1], front = f0.reduce((a, q) => a + q[1], 0) / f0.length < f1.reduce((a, q) => a + q[1], 0) / f1.length ? 1 : 0; shade(fins[front], '#E6ECFF', '#9AA6D2', '#33307A'); }
    // the eyes and the luminous edge
    for (const v of EYEV) { if (o.clip && W[v * 3 + 2] < 0) continue; const q = scr(o, [W[v * 3], W[v * 3 + 1], W[v * 3 + 2]]); c.fillStyle = '#0B1240'; c.beginPath(); c.arc(q[0], q[1], Math.max(1.2, k * 0.09), 0, TAU); c.fill(); c.fillStyle = '#9FE8FF'; c.beginPath(); c.arc(q[0] - k * 0.025, q[1] - k * 0.03, Math.max(0.6, k * 0.03), 0, TAU); c.fill(); }
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * 0.35; c.strokeStyle = '#9FD8FF'; c.lineWidth = Math.max(1.5, k * 0.12); poly(body); c.stroke();
    c.restore(); return true;
  }
  const ready = () => !!(D && D.ready);
  return { usable, warm, ready, step, release, gpuCount, pose, draw, draw2D, scr, flukeLow, get anchors() { return ANC; }, DIMS, MAT, STATS, RES, CZ, get nv() { return D ? D.nv : 0; }, get ntri() { return D ? D.M.ntri : 0; }, get off() { return NOGL; }, get glm() { return typeof GLM !== 'undefined' ? GLM : null; },
    init() { data(); if (!EYEV.length) findAnchors(); return D; } };
})();
if (typeof self !== 'undefined') self.MOBY_GL = MOBY_GL;
