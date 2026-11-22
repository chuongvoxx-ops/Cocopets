/* ---------- (v450 SF) SNAKE FLAME: the serpent of living flame (Fire's six-star summon Ultimate; the move is 20k6k) ----------
   An original serpent, built for the user's brief: a long, continuous body behind a broad, angular head; sharp fangs, amber eyes
   and swept-back flame crests; dark volcanic plates with orange-gold fire running through their seams; pointed flame fins
   rippling along the spine toward the tail; a bright molten core showing beneath the darker surface (between the belly's scutes
   and at every joint).
   The model (tiles; z up from the floor; x east, y south; drawn with an orthographic camera whose floor is squashed by the game's
   GY 0.55, heights by ZK = sqrt(1 - GY^2), so its footprint lies exactly on the game's floor):
   - the body: NSL slices (34), each a short tube closed by ball ends (the next slice's end turns inside them: a bend opens no gap),
     built once per tier at its length and girth; vA.y the place along the body (the plates and the seams run on across slices),
     vA.z 1 mid-slice .. 0 at a joint (the core glows there). Girth: a neck, thickest a tenth of the way back, tapering to a point.
   - the head (unit size, scaled by the tier's girth): an angular skull lofted from an eight-cornered section (flat crown, angled
     cheeks, a hard jaw line), brow ridges over the eyes, two black horns swept back from each brow and a cheek spike, glowing
     nostrils, a molten palate; two upper fangs and a row of teeth; the lower jaw (its own mesh, hinged) with its teeth and fangs;
     two amber eyes (their own mesh: a slit pupil). The flame crests are membranes of fire trailing from the horns (their own
     mesh: see-through, flickering in the shader), three a side, five at Celestial.
   - the fins: one flame fin mesh, instanced along the spine (every other slice; every third under Fewer effects) and at the tail
     (a long tail flame), rippling in a wave that runs toward the tail.
   Rig: rig(P) takes the move's spine (P.pt(d): the point d tiles behind the head, relative to the coil's centre) and lays the slices
   along it (each from its two ends: head-ward x), the head on the first point turned along the neck, the jaw, the eyes, the crests,
   the fins; P carries the fire's strength (glow), white heat (glow2), the dissolve (spill), a girth factor (shrink), the jaw's
   opening, the head's pitch and a fade (pet / enemy warnings: the parts over them are drawn see-through). Anchors (eyes, mouth,
   head, snout, the spine) come back for the move's light.
   Drawing: GLM when usable (one pass; materials 490..494, the SF-MAT block in 20k5uz; parts below the floor discarded by GLM's clip
   plane, so the serpent pours out of its ring of embers); its pass sized to its on-screen box, cut to the canvas, held under the
   visual quality's pixel budget, its GL canvas kept. Without WebGL (or on a software rasteriser unless window.__SF_GL = 1;
   __SF_GL = 0 forces it off) a painted 2D serpent from the same rig: shaded volcanic segments, a molten seam line, the angular
   head with its eyes, fangs and crests, flame fins (simpler; never broken).
   Meshes are built in idle-time slices (warm), uploaded once, reused by every cast on a stage; release() frees the GPU buffers
   (the stage's end: a hook in 20b), and they upload again on the next draw. */
const SNAKEFLAME_GL = (() => {
  const TAU = Math.PI * 2;
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  /* ---- vectors, rotations (a rotation: its three columns x, y, z) ---- */
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => Math.sqrt(vdot(a, a)), vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], vlerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const M3 = (x, y, z) => ({ x, y, z });
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  const colsK = (R, a, b, c) => M3(vmul(R.x, a), vmul(R.y, b), vmul(R.z, c));
  function frameXZ(xd, zh) { const x = vnrm(xd); let y = vcross(zh, x); if (vlen(y) < 1e-6) y = vcross([0, 0, 1], x); if (vlen(y) < 1e-6) y = [0, 1, 0]; y = vnrm(y); return M3(x, y, vcross(x, y)); }
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  /* ---- the camera (the game's floor squash) and the light ---- */
  const GY = 0.55, ZK = Math.sqrt(1 - GY * GY), PX = [1, 0, 0], PY = [0, GY, -ZK], PD = [0, ZK, GY], UPW = [0, 0, 1];
  const LW = vnrm([-0.55, 0.42, 0.72]), SBW = vnrm([-0.3, 0.25, 0.92]), RIMW = vnrm([0.62, -0.62, 0.38]);
  const RIMC = [1.7, 0.72, 0.28], AMBC = [1.05, 0.98, 0.95], OUTC = [0.06, 0.016, 0.01], GLCAP = 1700;
  /* ---- the materials (20k5uz SF-MAT) ---- */
  const M_BODY = 490, M_HEAD = 491, M_MOUTH = 491.2, M_JAW = 491.4, M_FANG = 492, M_HORN = 492.3, M_EYE = 493, M_FLAME = 494;   // (variants below .5: GLM rounds the id)
  const NSL = 34, ZSQ = 0.88, HEADK = 1.22;   // (HEADK: the head's size to the girth: broad, a little wider than the neck)
  /* the girth along the body (u 0 the neck .. 1 the tail), x the tier's radius */
  const prof = u => (u < 0.12 ? 0.8 + 0.2 * sstep(0, 0.12, u) : 0.1 + 0.9 * Math.pow(Math.max(0, 1 - (u - 0.12) / 0.88), 1.1));

  /* ================= meshes ================= */
  const D = {};   // by tier key: { M (meshes), RM, SL, LB, ready, it, up }
  let SH = null;   // the shared meshes (head, jaw, eye, crest, fin): unit size
  function bsph(m) { let cx = 0, cy = 0, cz = 0; const n = m.nv; for (let i = 0; i < n; i++) { cx += m.pos[i * 3]; cy += m.pos[i * 3 + 1]; cz += m.pos[i * 3 + 2]; } cx /= n; cy /= n; cz /= n; let r = 0; for (let i = 0; i < n; i++) r = Math.max(r, Math.hypot(m.pos[i * 3] - cx, m.pos[i * 3 + 1] - cy, m.pos[i * 3 + 2] - cz)); m.bs = [cx, cy, cz, r]; return m; }
  const DQ = () => (lowFx() ? 0.65 : 1), qn = n => Math.max(4, Math.round(n * DQ()));
  /* a body slice j of NSL: a tube SL long (x: +SL/2 its head-ward end), ball ends of the girth at its two ends */
  function sliceMesh(j, SL, RM) {
    const B = GLM.builder(DQ()), u0 = j / NSL, u1 = (j + 1) / NSL, rA = RM * prof(u0), rB = RM * prof(u1), h = SL / 2, pr = [];
    for (let i = 0; i <= 3; i++) { const ph = 0.3 + (Math.PI / 2 - 0.3) * i / 3; pr.push([-h - rB * Math.cos(ph), rB * Math.sin(ph), u1, 0, 0.22 + 0.28 * Math.sin(ph)]); }
    for (let i = 1; i <= 3; i++) { const f = i / 4; pr.push([-h + SL * f, lerp(rB, rA, f), lerp(u1, u0, f), 1, 1 - Math.abs(f - 0.5) * 0.8]); }
    for (let i = 0; i <= 3; i++) { const ph = Math.PI / 2 - (Math.PI / 2 - 0.3) * i / 3; pr.push([h + rA * Math.cos(ph), rA * Math.sin(ph), u0, 2, 0.22 + 0.28 * Math.sin(ph)]); }
    const NP = pr.length - 1, at = u => pr[Math.max(0, Math.min(NP, Math.round(u * NP)))], NV = qn(24);
    B.surf((u, v) => { const p = at(u), a = v * TAU; return [p[0], Math.cos(a) * p[1], Math.sin(a) * p[1] * ZSQ]; }, NP, NV, () => M_BODY, { e: u => at(u)[2], a: u => at(u)[4] });
    const M = B.done();
    // exact normals (the grid's own differences would shade each slice's ends as a bead): the balls from their centres, the tube by its slope
    for (let jj = 0; jj <= NV; jj++) for (let i = 0; i <= NP; i++) { const k = (jj * (NP + 1) + i) * 3, a = jj / NV * TAU, p = pr[i]; let nx;
      if (p[3] === 0) nx = (p[0] + h) / Math.max(1e-4, p[1]); else if (p[3] === 2) nx = (p[0] - h) / Math.max(1e-4, p[1]); else nx = (rA - rB) / SL;
      const n = vnrm([nx, Math.cos(a), Math.sin(a) / ZSQ]); M.nrm[k] = n[0]; M.nrm[k + 1] = n[1]; M.nrm[k + 2] = n[2]; }
    return bsph(M);
  }
  /* the head (unit: a girth of 0.6 tiles): x forward from the neck joint, y left, z up */
  const HP = [[-0.15, 0.55, 0.34, -0.28], [0.2, 0.64, 0.44, -0.3], [0.6, 0.66, 0.46, -0.28], [1.0, 0.6, 0.4, -0.24], [1.35, 0.48, 0.3, -0.2], [1.65, 0.36, 0.22, -0.17], [1.85, 0.24, 0.15, -0.13], [1.97, 0.08, 0.06, -0.07]];
  const hp = x => { let i = 0; while (i < HP.length - 2 && HP[i + 1][0] < x) i++; const a = HP[i], b = HP[i + 1], u = cl((x - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; };
  // the section's eight corners (y in half widths, z in tops (+) or bottoms (-)): cheek, upper cheek, the crown's two edges, ..., the jaw line
  const SEC = [[1.0, 0.1, 1], [0.8, 0.85, 1], [0.34, 1.0, 1], [-0.34, 1.0, 1], [-0.8, 0.85, 1], [-1.0, 0.1, 1], [-0.78, 1.0, 0], [0.78, 1.0, 0], [1.0, 0.1, 1]];
  function secAt(v, w, top, bot, x) { const f = v * 8, i = Math.min(7, Math.floor(f)), u = f - i, A = SEC[i], Bq = SEC[i + 1];
    const z = (c, k) => (c[2] ? c[1] * k : c[1] * bot), y = lerp(A[0], Bq[0], u) * w; let zz = lerp(z(A, top), z(Bq, top), u);
    if (A[2] && Bq[2] && Math.abs(A[0]) < 0.5 && Math.abs(Bq[0]) < 0.5) zz += 0.035 * Math.exp(-Math.pow((x - 0.9) / 0.45, 2));   // (a low ridge down the crown)
    return [y, zz]; }
  function headMesh() {
    const B = GLM.builder(DQ()), NU = qn(20), X0 = HP[0][0], X1 = HP[HP.length - 1][0];
    B.surf((u, v) => { const x = lerp(X0, X1, u), [w, top, bot] = hp(x), s = secAt(v, w, top, bot, x); return [x, s[0], s[1]]; }, NU, 24, () => M_HEAD, { flip: true });
    // the back of the skull closed by a dome toward the neck
    B.ell([X0 + 0.02, 0, 0.03], [0.22, 0.54, 0.3], M_HEAD, { seg: qn(16), rings: 6, th0: 0, th1: Math.PI });
    // the palate: molten flesh just under the jaw line (shows when the jaw opens)
    B.surf((u, v) => { const x = lerp(0.15, 1.8, u), [w, , bot] = hp(x); return [x, (v - 0.5) * 2 * w * 0.74, bot - 0.006]; }, qn(10), 4, () => M_MOUTH, { flip: true });
    // brow ridges: angular plates over the eyes, raked back
    for (const sg of [-1, 1]) { B.push(vnrm([1, -sg * 0.22, 0.12]), vnrm([sg * 0.22, 1, 0]), [0, 0, 1], [1.0, sg * 0.45, 0.38]); B.box([0, 0, 0], [0.26, 0.1, 0.06], 0.03, M_HEAD); B.pop();
      B.push(vnrm([1, -sg * 0.5, 0.25]), vnrm([sg * 0.5, 1, 0]), [0, 0, 1], [0.66, sg * 0.56, 0.36]); B.box([0, 0, 0], [0.2, 0.07, 0.05], 0.025, M_HEAD); B.pop(); }
    // horns: two black horns swept back from each brow, a cheek spike
    for (const sg of [-1, 1]) {
      const H1 = [[1.02, sg * 0.42, 0.42], [0.5, sg * 0.6, 0.62], [-0.2, sg * 0.7, 0.78], [-0.75, sg * 0.66, 0.74]]; for (let i = 0; i < 3; i++) B.tube(H1[i], H1[i + 1], 0.1 - i * 0.028, 0.072 - i * 0.026, M_HORN, { seg: qn(8), cap0: 'round', cap1: i === 2 ? false : 'round' });
      B.spike(H1[3], [-1.12, sg * 0.58, 0.62], 0.02, M_HORN, { seg: 6 });
      const H2 = [[0.78, sg * 0.36, 0.44], [0.25, sg * 0.42, 0.66], [-0.3, sg * 0.4, 0.8]]; for (let i = 0; i < 2; i++) B.tube(H2[i], H2[i + 1], 0.06 - i * 0.02, 0.04 - i * 0.02, M_HORN, { seg: qn(7), cap0: 'round', cap1: 'round' });
      B.spike(H2[2], [-0.62, sg * 0.36, 0.86], 0.02, M_HORN, { seg: 6 });
      B.spike([0.5, sg * 0.64, 0.02], [-0.25, sg * 0.86, 0.06], 0.08, M_HORN, { seg: 6 }); B.spike([0.15, sg * 0.62, -0.08], [-0.4, sg * 0.78, -0.12], 0.06, M_HORN, { seg: 6 });
      B.ell([1.82, sg * 0.1, 0.13], [0.06, 0.034, 0.03], M_MOUTH, { seg: 8, rings: 4 });   // a nostril, glowing
      B.crystal([1.6, sg * 0.21, -0.12], [1.67, sg * 0.19, -0.52], 0.056, M_FANG, { n: 5, belly: 0.25, base: 0.9 });   // the upper fang
      for (let i = 0; i < 5; i++) { const x = 0.62 + i * 0.18, w = hp(x)[0] * 0.8; B.crystal([x, sg * w, -0.2], [x + 0.02, sg * w * 0.97, -0.33 - 0.03 * (i % 2)], 0.026, M_FANG, { n: 4, base: 0.9 }); } }
    return bsph(B.done());
  }
  /* the lower jaw: its hinge at the origin (head frame [0.3, 0, -0.18]), forward to 1.66 */
  function jawMesh() {
    const B = GLM.builder(DQ()), JL = 1.66, wj = x => 0.6 - 0.44 * Math.pow(x / JL, 1.3), dj = x => 0.2 - 0.1 * x / JL, xs = u => JL * u;
    B.surf((u, v) => { const x = xs(u), th = Math.PI + v * Math.PI, c = Math.cos(th), s = Math.sin(th), w = wj(x) * (u > 0.94 ? Math.sqrt(Math.max(0.02, 1 - Math.pow((u - 0.94) / 0.06, 2))) : 1);
      return [x, w * Math.sign(c) * Math.pow(Math.abs(c), 0.5), -dj(x) * Math.pow(Math.abs(s), 0.6)]; }, qn(14), qn(14), () => M_JAW, { flip: true });
    B.surf((u, v) => { const x = xs(u) * 0.985, w = wj(x) * 0.9 * (u > 0.94 ? Math.sqrt(Math.max(0.02, 1 - Math.pow((u - 0.94) / 0.06, 2))) : 1); return [x, (v - 0.5) * 2 * w, 0.004]; }, qn(10), 4, () => M_MOUTH, {});
    for (const sg of [-1, 1]) { for (let i = 0; i < 5; i++) { const x = 0.38 + i * 0.2, w = wj(x) * 0.86; B.crystal([x, sg * w, 0], [x - 0.01, sg * w * 0.96, 0.13 + 0.03 * (i % 2)], 0.026, M_FANG, { n: 4, base: 0.9 }); }
      B.crystal([1.44, sg * wj(1.44) * 0.8, 0], [1.42, sg * wj(1.44) * 0.72, 0.3], 0.045, M_FANG, { n: 5, base: 0.9 }); }
    B.spike([JL * 0.97, 0, -0.06], [JL + 0.18, 0, -0.16], 0.07, M_HORN, { seg: 6 });   // (a chin spike)
    return bsph(B.done());
  }
  function eyeMesh() { const B = GLM.builder(DQ()); B.sph([0, 0, 0], 0.15, M_EYE, qn(16)); return bsph(B.done()); }
  /* a flame membrane (crests): x along it (root line 0..0.55, the tip at 1.35 back and up), thin in y; vA.y root 0 .. tip 1, vA.z across */
  function crestMesh() { const B = GLM.builder(DQ()), tip = [1.6, 0, 0.55];
    B.surf((a, b) => { const r = [b * 0.8, 0, 0], p = vlerp(r, tip, Math.pow(a, 0.85)); return [p[0], 0.09 * Math.sin(Math.PI * a), p[2] + 0.34 * Math.sin(Math.PI * a) * (0.5 - Math.abs(b - 0.5))]; }, qn(10), 6, () => M_FLAME, { e: a => a, a: (a, b) => b });
    return bsph(B.done()); }
  /* a flame fin (the spine's, the tail's): its root along x from +0.35 (head-ward) to -0.35, its tip raked back to (-0.55, 0, 1.0), curling */
  function finMesh() { const B = GLM.builder(DQ()), tip = [-0.55, 0, 1.0];
    B.surf((a, b) => { const r = [0.45 - 0.9 * b, 0, 0], p = vlerp(r, tip, a); return [p[0] - 0.18 * a * a, 0.04 * Math.sin(Math.PI * a), p[2] + 0.06 * Math.sin(Math.PI * a)]; }, qn(8), 5, () => M_FLAME, { e: a => a, a: (a, b) => b });
    return bsph(B.done()); }
  /* the build, a generator so the idle time can do it a piece at a time */
  function* gen(key, dims) {
    if (!SH) { const S2 = {}; S2.head = headMesh(); yield; S2.jaw = jawMesh(); S2.eye = eyeMesh(); S2.crest = crestMesh(); S2.fin = finMesh(); yield; SH = S2; }
    const d = D[key], M = {}; for (let j = 0; j < NSL; j++) { M['sl' + j] = sliceMesh(j, dims.SL, dims.RM); if (j % 6 === 5) yield; }
    d.M = M; d.ready = true; }
  function data(key, dims) { let d = D[key]; if (d && dims && (Math.abs(d.SL - dims.SL) > 1e-6 || Math.abs(d.RM - dims.RM) > 1e-6)) { freeD(d); delete D[key]; d = null; }   // (the TUNE changed: rebuilt)
    if (!d) d = D[key] = { ready: false, up: false, it: null, SL: dims ? dims.SL : 0.5, RM: dims ? dims.RM : 0.6, M: null, ms: 0 }; return d; }
  function step(key, dims, ms) { const d = data(key, dims); if (d.ready) return true; if (typeof GLM === 'undefined') return false; d.it = d.it || gen(key, dims); const t0 = nowMs(), until = t0 + ms; while (!d.ready && nowMs() < until) d.it.next(); d.ms += nowMs() - t0; return d.ready; }

  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0;
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Snake Flame GL: ' + String(e && e.message || e)); } catch (e2) {} };
  function usable() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__SF_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
    if (GLM.soft && flag('__SF_GL') !== 1) return false;
    return true;
  }
  const each = f => { if (SH) for (const k in SH) f(SH[k]); for (const k in D) if (D[k].M) for (const m in D[k].M) f(D[k].M[m]); };
  /* (idle time) the meshes built, then one tiny pass that uploads them and compiles the shader's branches */
  let IDLE = 0;
  function warm(key, dims) {
    if (!usable()) return false; const d = data(key, dims); if ((d.ready && d.up) || IDLE) return true; IDLE = 1;
    const go = () => { const run = ms => { try { if (!step(key, dims, ms)) return go(); if (!d.up) upload(d); } catch (e) { fail(e); } IDLE = 0; };
      if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => run(dl.didTimeout ? 3 : Math.max(1, Math.min(8, dl.timeRemaining() - 1))), { timeout: 200 }); else setTimeout(() => run(3), 30); };
    go(); return true;
  }
  function upload(d) { if (d.up || !d.ready || !GLM.ok()) return; const items = [], z = new Float32Array([0.001, 0, 0]), y = new Float32Array([0, 0.001, 0]), x = new Float32Array([0, 0, 0.001]);
    const put = mesh => items.push({ mesh, R0: z, R1: y, R2: x, T: new Float32Array(3), alpha: 1, glow: 0, kind: 0, wear: 1 }); for (const k in SH) put(SH[k]); for (const k in d.M) put(d.M[k]);
    GLM.render(4, 4, { px: [1, 0, 0], py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 }, items); d.up = true; }
  /* the meshes for a cast, made now if the idle time has not (null: draw the 2D serpent) */
  function ensure(key, dims) { if (!usable()) return null; const d = data(key, dims); if (!d.ready) { try { step(key, dims, 1e9); } catch (e) { fail(e); return null; } } return d.ready ? d : null; }
  function freeD(d) { let n = 0; if (d && d.M) for (const k in d.M) { const m = d.M[k]; if (m.gl) { n++; if (typeof GLM !== 'undefined' && GLM.free) GLM.free(m); else m.gl = null; } } if (d) d.up = false; return n; }
  /* free every GPU buffer (the meshes stay: they upload again when next drawn) */
  function release() { let n = 0; if (SH) for (const k in SH) { const m = SH[k]; if (m.gl) { n++; if (typeof GLM !== 'undefined' && GLM.free) GLM.free(m); else m.gl = null; } } for (const k in D) n += freeD(D[k]); return n; }
  const gpuCount = () => { let n = 0; each(m => { if (m.gl) n++; }); return n; };

  /* ================= the rig ================= */
  /* P: { k tier 0..2, RM girth, LB length, t, pt(d) -> [x, y, z] (d tiles behind the head; relative to the coil's centre), glow, glow2,
     spill, shrink, jaw 0..1, pitch, fade(p) -> 0..1 (1 solid), fin (the fins' ripple 0..1) }. Returns { inst, A, spine } */
  function rig(P) {
    const out = { inst: [], A: {}, spine: [] }, k = P.k | 0, RM = P.RM, LB = P.LB, SL = LB / NSL, hs = RM / 0.6 * HEADK, sh = P.shrink == null ? 1 : P.shrink, t = P.t || 0, low = lowFx();
    const base = { glow: P.glow == null ? 1 : P.glow, glow2: P.glow2 || 0, spill: P.spill || 0, kind: k };
    const I = (part, R, o, ex) => { const it = Object.assign({ part, R, o, s: 1, al: 1, wear: 0.5, outline: true }, base, ex); out.inst.push(it); return it; };
    const fade = p => (P.fade ? P.fade(p) : 1), UP = [0, 0, 1];
    const pts = []; for (let j = 0; j <= NSL; j++) pts.push(P.pt(j * SL));
    const frames = [];
    for (let j = 0; j < NSL; j++) { const pa = pts[j], pb = pts[j + 1], ch = vsub(pa, pb), len = vlen(ch) || 1e-4, Fr = frameXZ(len > 1e-4 ? ch : [1, 0, 0], UP), c0 = vlerp(pa, pb, 0.5), r = RM * prof((j + 0.5) / NSL) * sh; frames.push(Fr);
      out.spine.push({ p: c0, r, F: Fr, u: (j + 0.5) / NSL });
      if (Math.max(pa[2], pb[2]) + r * 1.1 < -0.02) continue;   // (wholly below the floor: still in the ring)
      I('sl' + j, colsK(Fr, len / SL, sh, sh), c0, { al: fade(c0), wear: hash(j) }); }
    /* the head on the neck's first point, turned along it; its pitch; the jaw on its hinge; the eyes */
    const p0 = pts[0], Xh = vsub(p0, P.pt(0.6)), Fh = mm(frameXZ(vlen(Xh) > 1e-4 ? Xh : [1, 0, 0], UP), rotY(P.pitch || 0)), hk = hs * sh;
    const HQ = q => vadd(p0, mv(Fh, vmul(q, hk)));
    out.A.head = HQ([0.9, 0, 0.2]); out.A.snout = HQ([1.9, 0, 0.05]); out.A.mouth = HQ([1.45, 0, -0.26]); out.A.neck = p0; out.A.Fh = Fh; out.A.hk = hk;
    out.A.eyes = [HQ([1.04, 0.52, 0.22]), HQ([1.04, -0.52, 0.22])]; out.A.nost = [HQ([1.84, 0.1, 0.14]), HQ([1.84, -0.1, 0.14])];
    if (p0[2] + hk * 0.5 > -0.02) {
      const fa = fade(out.A.head);
      I('head', colsK(Fh, hk, hk, hk), p0, { al: fa, wear: 0.21 });
      I('jaw', colsK(mm(Fh, rotY(0.62 * cl(P.jaw || 0))), hk, hk, hk), HQ([0.3, 0, -0.18]), { al: fa, wear: 0.37 });
      for (const sg of [1, -1]) I('eye', colsK(mm(Fh, rotZ(sg * 1.05)), hk, hk, hk), HQ([1.0, sg * 0.5, 0.2]), { al: fa, outline: false, glow: base.glow * 1.1 });
      /* the flame crests trailing from the horns: three a side (five at Celestial), each fluttering on its own */
      const nC = k >= 2 ? 5 : 3, cK = k >= 2 ? 1.25 : k >= 1 ? 1.1 : 1;
      for (const sg of [1, -1]) for (let i = 0; i < nC; i++) { const fl = Math.sin(t * (7 + i) + i * 1.7 + (sg > 0 ? 0 : 1.1)) * 0.12, root = HQ([0.95 - i * (1.5 / nC), sg * (0.48 + 0.05 * i), 0.5 + 0.06 * i]);
        const Rc = mm(Fh, mm(rotZ(Math.PI + sg * (0.22 + 0.04 * i)), mm(rotX(-sg * (0.45 + 0.08 * i) + fl), rotY(-0.18 - 0.05 * i + fl * 0.5)))), s = hk * cK * (1.0 - 0.09 * i);
        I('crest', colsK(Rc, s, s, s), root, { al: Math.min(0.99, fa), outline: false, wear: hash(i * 7 + sg + 3), kind: Math.min(2, k + 0.5) }); }
    }
    /* the flame fins down the spine (every other slice; every third under Fewer effects), in a ripple running to the tail; the tail's flame */
    const stp = low ? 3 : 2, fK = (k >= 2 ? 1.18 : k >= 1 ? 1.08 : 1) * (P.fin == null ? 1 : P.fin);
    for (let j = 2; j < NSL - 2; j += stp) { const u = (j + 0.5) / NSL, s = out.spine[j], c0 = s.p, r = s.r; if (c0[2] + r < 0.05) continue;
      const F = s.F, sway = Math.sin(t * 5.2 - j * 0.55) * 0.22, rake = Math.sin(t * 3.1 - j * 0.4) * 0.12, hf = RM * (1.45 * Math.pow(1 - u, 0.6) + 0.35) * fK * sh;
      const b = vadd(c0, vmul(F.z, r * ZSQ * 0.82)), Rf = mm(F, mm(rotX(sway), rotY(rake)));
      I('fin', colsK(Rf, hf, hf, hf), b, { al: Math.min(0.99, fade(c0)), outline: false, wear: hash(j * 3 + 1) }); }
    { const a = pts[NSL], b2 = pts[NSL - 2]; if (a[2] > -0.1) { const Ft = frameXZ(vlen(vsub(b2, a)) > 1e-4 ? vsub(b2, a) : [1, 0, 0], UP), s = RM * 2.1 * fK * sh, sw = Math.sin(t * 4.4) * 0.3;
        I('fin', colsK(mm(Ft, mm(rotX(sw), rotY(0.95))), s, s, s), a, { al: Math.min(0.99, fade(a)), outline: false, wear: 0.77 }); out.A.tail = a; } }
    return out;
  }

  /* ================= drawing ================= */
  /* V: { X0, Y0 (the coil's centre on screen), k (px a tile) }: a model point to the screen */
  const toS = (V, p) => [V.X0 + p[0] * V.k, V.Y0 + (p[1] * GY - p[2] * ZK) * V.k];
  function visBox(c) { const m = c.getTransform ? c.getTransform() : null, cv = c.canvas; if (!m || !cv || !cv.width) return null; const det = m.a * m.d - m.b * m.c; if (Math.abs(det) < 1e-9) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [X, Y] of [[0, 0], [cv.width, 0], [0, cv.height], [cv.width, cv.height]]) { const dx = X - m.e, dy = Y - m.f, ux = (m.d * dx - m.c * dy) / det, uy = (-m.b * dx + m.a * dy) / det; x0 = Math.min(x0, ux); y0 = Math.min(y0, uy); x1 = Math.max(x1, ux); y1 = Math.max(y1, uy); }
    return [Math.floor(x0) - 2, Math.floor(y0) - 2, Math.ceil(x1) + 2, Math.ceil(y1) + 2]; }
  const PXB = [0.55e6, 0.38e6, 0.27e6, 0.27e6];   // (the pass's GL pixel budget in a fight by the visual quality: High, Balanced, Performance, its floor)
  const budget = () => { try { if (typeof GQ === 'undefined' || typeof arc === 'undefined' || !arc.game || arc.mode !== 'dungeon') return 1e12; return PXB[Math.max(0, Math.min(3, GQ.level() | 0))]; } catch (e) { return 1e12; } };
  const POOL = [], ITEMS = [], TRANS = []; let NPOOL = 0;
  const STATS = { ms: 0, n: 0, items: 0, W: 0, H: 0 };
  /* the serpent on the GPU: one pass. Returns false when it cannot (the 2D serpent then) */
  function drawGL(c, V, R, key, dims, o) {
    o = o || {}; const d = ensure(key, dims); if (!d || NOGL) return false;
    try {
      const k = V.k, X0 = V.X0, Y0 = V.Y0; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; ITEMS.length = 0; TRANS.length = 0; NPOOL = 0;
      for (const it of R.inst) { const mesh = d.M[it.part] || SH[it.part]; if (!mesh) continue; const al = it.al == null ? 1 : it.al; if (!(al > 0.004)) continue;
        const Rw = it.R, bc = mesh.bs, ck = Math.max(vlen(Rw.x), vlen(Rw.y), vlen(Rw.z)), w = vadd(it.o, mv(Rw, [bc[0], bc[1], bc[2]])), rr = bc[3] * ck * 1.05 * k, sx = X0 + vdot(w, PX) * k, sy = Y0 + vdot(w, PY) * k;
        if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr;
        const g = POOL[NPOOL] || (POOL[NPOOL] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); NPOOL++;
        g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i]; g.R1[i] = Rw.y[i]; g.R2[i] = Rw.z[i]; g.T[i] = it.o[i]; }
        g.alpha = al; g.glow = it.glow; g.glow2 = it.glow2; g.spill = it.spill; g.kind = it.kind; g.wear = it.wear; g.fx = 0; g.first = 0; g.cnt = 0; g.outline = it.outline !== false && !(it.spill > 0.001); g.d = vdot(it.o, PD);
        (al < 0.995 ? TRANS : ITEMS).push(g); }
      if (!(bx1 > bx0) || !(ITEMS.length + TRANS.length)) return true;
      TRANS.sort((p, q) => p.d - q.d); for (const g of TRANS) ITEMS.push(g);
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__SF_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (lowFx() ? 0.8 : 1) * (typeof GQ !== 'undefined' && GQ.animaK ? GQ.animaK() : 1);
      bx0 = Math.floor(bx0) - 3; by0 = Math.floor(by0) - 3; bx1 = Math.ceil(bx1) + 3; by1 = Math.ceil(by1) + 3;
      const vb = visBox(c); if (vb) { bx0 = Math.max(bx0, vb[0]); by0 = Math.max(by0, vb[1]); bx1 = Math.min(bx1, vb[2]); by1 = Math.min(by1, vb[3]); if (!(bx1 > bx0 + 1 && by1 > by0 + 1)) return true; }   // (only what is on the canvas)
      const bw = bx1 - bx0, bh = by1 - by0; let W = Math.ceil(bw * dev), H = Math.ceil(bh * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
      const bud = budget(); if (W * H > bud) { const q = Math.sqrt(bud / (W * H)); W = Math.max(2, Math.ceil(W * q)); H = Math.max(2, Math.ceil(H * q)); }
      const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (Y0 - by0) / bh], v: PD, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: lowFx(), rim: RIMC, amb: AMBC, t: (o.t || 0) % 600,
        outline: Math.max(0.8, 1.0 * (W / bw)), outlineCol: OUTC, outlineBias: 0.004, clip: [0, 1e-6], keep: 1 };
      const t0 = nowMs(), cvs = GLM.render(W, H, S, ITEMS); if (!cvs) return false;
      c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh);
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; STATS.items = ITEMS.length; STATS.W = W; STATS.H = H;
      return true;
    } catch (e) { fail(e); return false; }
  }
  /* ---- the painted serpent (no WebGL): the same rig ---- */
  let BALL = null;
  function ballSpr() { if (BALL) return BALL; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
    let gr = g.createRadialGradient(24, 22, 2, 32, 32, 31); gr.addColorStop(0, '#5A4A44'); gr.addColorStop(0.35, '#2A2122'); gr.addColorStop(0.85, '#140F11'); gr.addColorStop(0.97, '#3A1A10'); gr.addColorStop(1, 'rgba(40,16,10,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 31, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,140,40,0.55)'; g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i < 5; i++) { const a = i * 1.26 + 0.4; g.moveTo(32 + Math.cos(a) * 9, 34 + Math.sin(a) * 8); g.lineTo(32 + Math.cos(a + 0.3) * 24, 34 + Math.sin(a + 0.3) * 22); } g.stroke();
    return (BALL = cv); }
  function draw2D(c, V, R, o) {
    o = o || {}; const sp = R.spine, k = V.k, glow = o.glow == null ? 1 : o.glow, al0 = 1 - cl(o.spill || 0); if (!sp.length || al0 <= 0.01) return;
    const B = ballSpr(), list = [];
    for (let i = 0; i < sp.length; i++) { const s = sp[i]; if (s.p[2] + s.r < 0) continue; list.push(s); }
    list.sort((a, b) => a.p[1] - b.p[1]);   // (far first)
    c.save(); c.globalAlpha = al0;
    for (const s of list) { const q = toS(V, s.p), r = s.r * k; c.globalAlpha = al0 * (o.fade ? o.fade(s.p) : 1); c.drawImage(B, q[0] - r * 1.05, q[1] - r * 1.0, r * 2.1, r * 2.0 * (0.5 + 0.5 * ZK)); }
    // the molten seam down its flank and the fins: one glowing line, flame points
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = al0 * Math.min(1, 0.5 + 0.25 * glow); c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = 'rgba(255,120,30,0.55)'; c.lineWidth = Math.max(1.5, k * 0.12); c.beginPath(); sp.forEach((s, i) => { if (s.p[2] + s.r < 0) return; const q = toS(V, [s.p[0], s.p[1], s.p[2] - s.r * 0.35]); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke();
    c.fillStyle = 'rgba(255,170,60,0.7)'; c.beginPath(); for (let i = 2; i < sp.length - 2; i += 2) { const s = sp[i]; if (s.p[2] + s.r < 0.05) continue; const a = toS(V, [s.p[0], s.p[1], s.p[2] + s.r * 0.8]), h = s.r * k * (1.4 - s.u), sw = Math.sin((o.t || 0) * 5 - i * 0.55) * h * 0.25;
      c.moveTo(a[0] - h * 0.3, a[1]); c.lineTo(a[0] + sw - h * 0.35, a[1] - h); c.lineTo(a[0] + h * 0.3, a[1]); } c.fill();
    c.restore();
    // the head: an angular wedge in screen space from its own points, its eyes, fangs and crests
    const A = R.A; if (!A.Fh || A.neck[2] + A.hk * 0.5 < 0) return;
    const P = q => toS(V, vadd(A.neck, mv(A.Fh, vmul(q, A.hk))));
    c.save(); c.globalAlpha = al0 * (o.fade ? o.fade(A.head) : 1);
    const outl = [[-0.1, 0.6, 0.3], [0.6, 0.66, 0.42], [1.35, 0.48, 0.28], [1.97, 0, 0.06], [1.35, -0.48, 0.28], [0.6, -0.66, 0.42], [-0.1, -0.6, 0.3]].map(P);
    const g = c.createLinearGradient(outl[0][0], outl[1][1] - k * 0.4, outl[3][0], outl[3][1] + k * 0.3); g.addColorStop(0, '#3C302C'); g.addColorStop(0.6, '#1B1416'); g.addColorStop(1, '#0E0A0B');
    c.fillStyle = g; c.beginPath(); outl.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); c.fill(); c.strokeStyle = '#120A08'; c.lineWidth = Math.max(1, k * 0.04); c.stroke();
    c.fillStyle = '#F2E6CC'; for (const sg of [1, -1]) { const a = P([1.6, sg * 0.22, -0.12]), b = P([1.67, sg * 0.2, -0.52]), e = P([1.5, sg * 0.24, -0.12]); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(e[0], e[1]); c.fill(); }
    c.globalCompositeOperation = 'lighter';
    for (const e of A.eyes) { const q = toS(V, e), r = k * 0.1 * A.hk; c.fillStyle = 'rgba(255,190,60,0.95)'; c.beginPath(); c.arc(q[0], q[1], Math.max(1.5, r), 0, TAU); c.fill(); c.fillStyle = 'rgba(255,140,30,0.3)'; c.beginPath(); c.arc(q[0], q[1], Math.max(3, r * 1.8), 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,110,25,0.55)'; for (const sg of [1, -1]) for (let i = 0; i < 3; i++) { const a = P([0.9 - i * 0.5, sg * 0.5, 0.5]), b = P([-0.5 - i * 0.4, sg * (0.7 + 0.1 * i), 1.0 + 0.15 * i]), m2 = P([0.2 - i * 0.45, sg * 0.62, 0.62]); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m2[0], m2[1] - k * 0.2, b[0], b[1]); c.quadraticCurveTo(m2[0], m2[1] + k * 0.1, a[0], a[1]); c.fill(); }
    c.restore();
  }
  /* a studio portrait (tests, the contact sheets): the rig P drawn at screen (x, y) with T px a tile; o.d2: the 2D serpent */
  function studio(c, x, y, P, o) { o = o || {}; const key = o.key || ('t' + P.k), dims = { SL: P.LB / NSL, RM: P.RM }, R = rig(P), V = { X0: x, Y0: y, k: o.T || 30 };
    if (o.d2 || !drawGL(c, V, R, key, dims, { t: P.t })) { draw2D(c, V, R, { glow: P.glow, spill: P.spill, t: P.t }); return { R, gl: false }; } return { R, gl: true }; }
  return { usable, warm, ensure, step, release, gpuCount, rig, drawGL, draw2D, toS, studio, prof, NSL, GY, ZK, STATS, get off() { return NOGL; }, set noGL(v) { NOGL = !!v; } };
})();
if (typeof self !== 'undefined') self.SNAKEFLAME_GL = SNAKEFLAME_GL;
