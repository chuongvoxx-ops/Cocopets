/* ---------- (v470 AM) AUR_BROOD: Rift 05's brood in three dimensions, its attacks on the GPU, its mini bosses as giant evil Cocopets ----------
   The user (2026-11-27): "Now proceed with remaking rift 5 in gpu on the same graphical fidelity as rift 02 and rift 03" and "Rebuild
   the bosses and normal monsters aswell in this dungeon on gpu, use the 2d drawings as reference."

   THE BROOD (rime scuttler, veil ray, frost lantern; the summit's yeti and ice golem; the Split Iceberg's great ice crystals). Each is
   its 2D drawing (20s6, 20s6c) made a model: the same creature, silhouette, colours and signature parts (the scuttler's faceted white
   shell on a navy underside, three navy legs and a green eye; the ray's pale diamond with its white cross ridges, green eye and two
   ribbon tails, one green and one ice; the lantern's dark core in a turning cage of ice bars; the yeti's shaggy white bulk, navy mask,
   heavy brow, green eyes, two fangs and curled ice horns, its long arms and navy hands; the golem's stacked bevelled ice slabs round a
   green diamond core, its head block with a slit of light and a cap of snow, its fists and shoulder spikes; the crystal's tall pale
   prisms over heaved slabs, aurora light in them). GLM models (rigid parts built once, materials 710..729 in the AM-AUR-MAT block of
   20k5uz), never drawn live: every frame the game needs is rendered ONCE into the monster sprite cache the 2D art already uses
   (DunArt.monSprite: type x size x frame x mode, an LRU of small canvases), as Rift 04's brood (20s7, SEP_BROOD) is. Its painter
   (MP[type]) is wrapped: where the GPU can be used it renders the model posed for that frame and mode into the sprite's canvas (its
   contact shadow and soft lights laid in 2D once, inside the picture), else it paints the 2D art as before. A crowd costs what the
   2D crowd cost: one drawImage a monster a frame. Models with a front (scuttler, ray, yeti) are baked facing each way ('<' in the
   mode, DunArt.FACED); the round or square-on ones (lantern, golem, crystal) are baked once and mirrored. Frames are rendered on the
   loading screen (Rf.preload); anything first seen in play within a budget (two pictures or 4 ms in any 14 ms), the rest painted in
   2D for a moment and rendered again later. Pictures and meshes' GPU buffers are let go when a stage closes. Only in Rift 05's lands.
   THEIR ATTACKS: the brood's and the minis' tells (lines, rings, cones), the veil rays' and Gale's wind lanes, their shots (the ice
   spike, the veil bolt, the lantern's frost orb, the yeti's snowball), the lantern's shield on the monsters near it (a ring of frost
   cells at their feet, a thread to the lantern) and the bursts (the golem's slam, the yeti's landing, the spike loosed, a crystal
   shattering, a tell striking) are painted on the GPU (FGFX kinds 530..535, AM-FX in 20k6h: laid over, feathered, glow only; the
   snow is near white, so added light alone would not show there). Their numbers and timings are untouched: the AI is wrapped only to
   tag what it makes. The shots go in the engine's own GPU pass (b.paint); the rest in one pass of this layer's under the monsters,
   made only when something is showing. Where FGFX is not usable the engine draws them in 2D as before (a tell's default red made ice).
   THE MINI BOSSES (Rime, Gale, Whiteout): giant evil Cocopets like every other rift's (EVIL_MINI, 20zz9: PetGL), themed for the
   Aurora by MINI_LOOK (as v469 did for the Sepulchre), their own moves, health and blows kept (EVIL_MINI.arm with keep).
   Without WebGL, on a software rasteriser (unless window.__AUB_GL = 1, tests), with window.__AUB_GL = 0 or after three failures in
   20 s, the 2D art is drawn exactly as before. window.__AUB_GLHQ = 1: full resolution on a software rasteriser (tests);
   window.__AUB_FX = 0: the attacks' GPU layer off. */
const AUR_BROOD = (() => {
  const TAU = Math.PI * 2, GY = 0.72, ZK = 0.695, CW = [0, 0.6945, 0.7195], nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => Math.sqrt(vdot(a, a)), vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const M3 = (x, y, z) => ({ x, y, z }), mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]], mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); }, rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); }, rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  function frameXZ(xd, zh) { const x = vnrm(xd); let y = vcross(zh, x); if (vlen(y) < 1e-6) y = vcross([0, 0, 1], x); if (vlen(y) < 1e-6) y = [0, 1, 0]; y = vnrm(y); return M3(x, y, vcross(x, y)); }
  const win = k => { try { return typeof window !== 'undefined' ? window[k] : undefined; } catch (e) { return undefined; } };
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const I3 = () => ({ x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] });
  const LANDS = { glacier: 1, observatory: 1, whiteout: 1 };
  const A0 = typeof AUR !== 'undefined' ? AUR : { ICE: '#86B7D0', ICE_HI: '#CFE8F4', GREEN: '#78D7B2', GREEN_HI: '#B8F5DA', NAVY: '#172C4D' };
  const { ICE_HI, GREEN, GREEN_HI } = A0;
  /* the lights (world: x east, y south toward the viewer, z up): each land's key colour (uAmb) and rim (uRim) */
  const LIGHT = {
    glacier: { lk: vnrm([-0.5, 0.35, 0.8]), ls: vnrm([0.3, 0.2, 0.93]), lr: vnrm([0.55, -0.75, 0.35]), key: [1.22, 1.32, 1.5], rim: [0.5, 1.2, 0.92] },
    observatory: { lk: vnrm([-0.45, 0.3, 0.84]), ls: vnrm([0.25, 0.3, 0.92]), lr: vnrm([0.5, -0.8, 0.35]), key: [1.08, 1.18, 1.38], rim: [0.55, 1.4, 1.02] },
    whiteout: { lk: vnrm([-0.5, 0.4, 0.78]), ls: vnrm([0.3, 0.25, 0.9]), lr: vnrm([-0.5, -0.75, 0.4]), key: [1.5, 1.48, 1.44], rim: [1.3, 0.98, 0.62] } };
  const OUTC = [0.07, 0.08, 0.16], UPW = [0, 0, 1], GLCAP = 1400, GLI = [], GLJ = [];
  /* ---- a model's GL state: meshes built once on first use (lowFx: fewer segments), failures counted ---- */
  let FAILS = 0, FAILT = 0, NOGL = false;
  function failed() { const t = nowMs(); if (t - FAILT > 20000) FAILS = 0; FAILT = t; if (++FAILS >= 3) NOGL = true; }
  function glBase() { if (NOGL || win('__AUB_GL') === 0 || typeof GLM === 'undefined') return false; try { if (!GLM.ok()) return false; if (GLM.soft && win('__AUB_GL') !== 1) return false; } catch (e) { return false; } return true; }
  const MODELS = [];
  function model(name, build) {
    const G = { name, MESH: null, PB: {}, ms: 0, n: 0, meshMs: 0,
      on() { if (!glBase()) return false; if (!G.MESH) { try { const t0 = nowMs(); G.MESH = build(lowFx() ? 0.65 : 1); G.meshMs = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('AUR_BROOD ' + name + ': meshes', e); return false; } } return true; },
      bounds(part) { let b = G.PB[part]; if (b) return b; const M = G.MESH && G.MESH[part]; if (!M) return [[-1, -1, -1], [1, 1, 1]]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
        for (let i = 0; i < p.length; i += 3) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1]; if (p[i + 2] < z0) z0 = p[i + 2]; if (p[i + 2] > z1) z1 = p[i + 2]; }
        return (G.PB[part] = [[x0, y0, z0], [x1, y1, z1]]); },
      get tris() { return G.MESH ? Object.values(G.MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0; } };
    MODELS.push(G); return G; }
  /* ---- one GPU pass: parts ({ part, R, o, s, sc, al, glow, glow2, spill, kind, fx, wear, outline }) in model units, the view
     V { k (px a unit), Rh (the heading), X0, Y0 (where the model's origin falls) } on c; o: { light, t, outline, res } ---- */
  function glPass(c, V, list, o, G) {
    const k = V.k, PX = [1, 0, 0], PY = [0, GY, -ZK], PD = CW, LT = LIGHT[o.light] || LIGHT.glacier;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { if (!G.MESH[it.part]) continue; const [lo, hi] = G.bounds(it.part), sc = it.sc || [1, 1, 1], s = it.s || 1;
      for (let q = 0; q < 8; q++) { const lc = [(q & 1 ? hi[0] : lo[0]) * sc[0] * s, (q & 2 ? hi[1] : lo[1]) * sc[1] * s, (q & 4 ? hi[2] : lo[2]) * sc[2] * s], w = mv(V.Rh, vadd(it.o, mv(it.R, lc))), sx = V.X0 + w[0] * k, sy = V.Y0 + (w[1] * GY - w[2] * ZK) * k;
        if (sx < bx0) bx0 = sx; if (sx > bx1) bx1 = sx; if (sy < by0) by0 = sy; if (sy > by1) by1 = sy; } }
    { const pad = 2 + k * 0.03; bx0 -= pad; by0 -= pad; bx1 += pad; by1 += pad; }
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !win('__AUB_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (o.res || 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (V.X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (V.Y0 - by0) / bh], v: PD, lk: LT.lk, ls: LT.ls, lr: LT.lr, up: UPW, low: lowFx(), rim: LT.rim, amb: LT.key, t: (o.t || 0) % 600,
      outline: o.outline === 0 ? 0 : Math.max(1, (o.outline || 1.1) * (W / bw)), outlineCol: OUTC, keep: 1 };
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = G.MESH[it.part]; if (!mesh) continue; const al = it.al == null ? 1 : it.al; if (!(al > 0.004)) continue; const Rw = mm(V.Rh, it.R), s2 = it.s || 1, sc = it.sc || [1, 1, 1], Tt = mv(V.Rh, it.o);
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2 * sc[0]; g.R1[i] = Rw.y[i] * s2 * sc[1]; g.R2[i] = Rw.z[i] * s2 * sc[2]; g.T[i] = Tt[i]; }
      g.alpha = al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = it.wear == null ? 0.37 : it.wear; g.fx = it.fx || 0; g.outline = it.outline; g.first = 0; g.cnt = 0; g.d = vdot(Tt, PD); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); G.box = [bx0, by0, bx1, by1];
    G.ms = G.ms * 0.9 + (nowMs() - t0) * 0.1; G.n++; return true;
  }
  /* ---- pose helpers (model units: the body radius r is 1; z up, the model's front +x) ---- */
  const P = (part, o, R, ex) => Object.assign({ part, o, R: R || I3() }, ex || {});
  const bone = (part, a, b, ex) => P(part, a, frameXZ(vsub(b, a), [0, 0, 1]), ex);
  const rz = rotZ, ry = rotY, rx = rotX, at3 = (R, p) => mv(R, p);
  const proj = (V, p) => { const w = mv(V.Rh, p); return [V.X0 + w[0] * V.k, V.Y0 + (w[1] * GY - w[2] * ZK) * V.k]; };
  function halos(c, V, list) { if (!list || !list.length || typeof glowSprite !== 'function') return; c.save(); c.globalCompositeOperation = 'lighter';
    for (const [p, r, col, a] of list) { if (!(a > 0.01)) continue; const [x, y] = proj(V, p), R = r * V.k; c.globalAlpha = Math.min(1, a); c.drawImage(glowSprite(col), x - R, y - R, R * 2, R * 2); } c.restore(); }
  let BLOB = null;
  function blob(c, x, y, rx2, ry2, a) { if (!BLOB) { BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const g = BLOB.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(8,18,40,1)'); gr.addColorStop(0.5, 'rgba(8,18,40,.6)'); gr.addColorStop(1, 'rgba(8,18,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    c.save(); c.globalAlpha = a; c.drawImage(BLOB, x - rx2, y - ry2, rx2 * 2, ry2 * 2); c.restore(); }
  /* a two-point leg: hip to foot with the knee lifted toward `out` (a unit vector), lengths l1, l2 */
  function knee(h, f, l1, l2, out) { const d = vsub(f, h), L = Math.min(l1 + l2 - 1e-3, Math.max(1e-3, vlen(d))), u = vnrm(d), a = (l1 * l1 - l2 * l2 + L * L) / (2 * L), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    let w = vsub(out, vmul(u, vdot(out, u))); w = vlen(w) < 1e-5 ? [0, 0, 1] : vnrm(w); return vadd(vadd(h, vmul(u, a)), vmul(w, hh)); }

  /* ======================= the models ======================= */
  const FACE_V = rotX(Math.atan2(CW[2], CW[1]));   // (what faced the south (+y) now faces the camera)
  const DEF = {};
  /* ---- the rime scuttler: a faceted white shell (lit facets white, ice-blue, pale) over a navy oval underside, three navy legs
     (two behind, one long one in front that plants when it braces), a green eye at the shell's front ---- */
  function shellFacets(B, n, rx2, ry2, z0, k1, z1, apex, mat) {
    const r0 = [], r1 = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, j = 1 + 0.06 * Math.sin(i * 2.3); r0.push([Math.cos(a) * rx2 * j, Math.sin(a) * ry2 * j, z0]); const b = (i + 0.5) / n * TAU; r1.push([Math.cos(b) * rx2 * k1 + apex[0] * 0.35, Math.sin(b) * ry2 * k1, z1 + 0.04 * Math.cos(i * 1.7)]); }
    for (let i = 0; i < n; i++) { const j = (i + 1) % n;
      B.facet([r0[i], r0[j], r1[i]], mat(i, 0)); B.facet([r1[i], r0[j], r1[j]], mat(i, 1)); B.facet([r1[i], r1[j], apex], mat(i, 2)); }
    return B; }
  const SC_LEGS = [[-0.32, 0.42, 0], [-0.32, -0.42, 0.5], [0.42, 0, 0.25]];
  DEF.rimescuttler = { ext: 2.0, nf: 6, faced: true, modes: ['', 'block'], foot: 0.86, head: 0.5,
    G: model('rimescuttler', q => { const out = {}, Bd = () => GLM.builder(q);
      out.under = Bd().ell([0, 0, 0], [0.86, 0.7, 0.28], 711, { seg: 24, rings: 10 }).done();
      out.shell = shellFacets(Bd(), 5, 0.94, 0.78, 0, 0.52, 0.5, [0.12, 0, 0.9], (i, l) => { const a = (i + 0.5) / 5 * TAU, lx = Math.cos(a), ly = Math.sin(a); return l === 2 ? (lx < 0 ? 710.2 : ly > 0 ? 710 : 710.1) : l === 1 ? (lx < -0.3 ? 710.2 : 710.1) : (lx < 0 ? 710 : 710.1); }).done();
      out.eye = Bd().sph([0, 0, 0], 0.11, 712, 12).done();
      out.thigh = Bd().tube([0, 0, 0], [0.5, 0, 0], 0.075, 0.058, 711, { seg: 8 }).done();
      out.shin = Bd().tube([0, 0, 0], [0.62, 0, 0], 0.058, 0.022, 711, { seg: 8, cap1: 'flat' }).done();
      out.mand = (() => { const B = Bd(); B.spike([0, 0.1, 0], [0.24, 0.05, -0.08], 0.05, 711, { seg: 5 }); B.spike([0, -0.1, 0], [0.24, -0.05, -0.08], 0.05, 711, { seg: 5 }); return B.done(); })();
      return out; }),
    pose(ph, md) { const run = Math.sin(ph * TAU), brace = md === 'block' ? 1 : 0, L = [];
      const bz = 0.8 + (brace ? 0.1 : Math.abs(Math.cos(ph * TAU)) * 0.04), BR = ry(brace ? -0.16 : run * 0.03), bo = [0, 0, bz];
      L.push(P('under', bo, BR, { wear: 0.3 }), P('shell', vadd(bo, at3(BR, [0, 0, 0.16])), BR, { glow: brace * 0.8, wear: 0.5 }));
      const ep = vadd(bo, at3(BR, [0.8, 0.02, 0.2])); L.push(P('eye', ep, BR, { kind: 0, glow: 0.9 + brace * 1.2, outline: false }), P('mand', vadd(bo, at3(BR, [0.74, 0, 0.02])), BR, { wear: 0.6 }));
      for (const [lx, ly, off] of SC_LEGS) { const front = lx > 0, hip = vadd(bo, at3(BR, [lx * 0.8, ly * 0.8, -0.05])), sw = Math.sin((ph + off) * TAU);
        const foot = front ? (brace ? [1.25, 0, 0] : [0.92 + sw * 0.12, 0, 0]) : [lx * 2.4 - sw * 0.16, ly * 1.55, 0], lift = front || brace ? 0 : Math.max(0, Math.cos((ph + off) * TAU)) * 0.1;
        foot[2] = lift; const kn = knee(hip, foot, 0.5, 0.62, vnrm([front ? 0.5 : lx, ly, 1.1])); L.push(bone('thigh', hip, kn, { wear: 0.2 }), bone('shin', kn, foot, { wear: 0.6 })); }
      return { parts: L, halos: [[ep, 0.32, GREEN, 0.45 + brace * 0.4], [vadd(ep, [0.25, 0, 0]), 0.6, ICE_HI, brace * 0.75]], shadow: [1.02, 0.32, 0.3] }; } };

  /* ---- the veil ray: a pale blue diamond kite (four facets meeting at its middle: the white cross ridges), a bright green eye, two
     ribbon tails trailing from its back point (one green, one ice), fluttering ---- */
  const RAY_TILT = rotX(Math.atan2(CW[2], CW[1]) * 0.78), RAY = { f: [0.88, 0, 0], u: [0, 0, 0.72], b: [-0.46, 0, 0], d: [0, 0, -0.56], af: [0.06, 0.2, 0.03], ab: [0.06, -0.1, 0.02] };
  function rayTail(B, sd, ph, calm) { const N = 22, fl = (1 - calm * 0.7);
    const c = u => { const w = Math.sin(u * Math.PI * 1.4 - ph * TAU * 2) * u * 0.24 * fl; return [-0.36 - u * 1.5, -0.03 * u, sd * (0.1 + 0.24 * u) + w - u * 0.38]; };
    B.surf((u, v) => { const p = c(u), p2 = c(Math.min(1, u + 0.02)), p1 = c(Math.max(0, u - 0.02)), t = vnrm(vsub(p2, p1)), nrm = vnrm(vcross(t, [0, 1, 0])), w = 0.085 * (1 - 0.65 * u), tw = Math.sin(u * 5 + ph * TAU) * 0.35;
      return vadd(p, vadd(vmul(nrm, (v - 0.5) * 2 * w * Math.cos(tw)), [0, (v - 0.5) * 2 * w * Math.sin(tw), 0])); }, N, 2, () => (sd < 0 ? 713.1 : 713.2), { e: () => 0 });
    return B; }
  DEF.veilray = { ext: 2.4, nf: 6, faced: false, yaw: 0.3, modes: ['', 'block'], foot: 0.86,
    G: model('veilray', q => { const out = {}, Bd = () => GLM.builder(q), R = RAY;
      out.body = (() => { const B = Bd(), rim = [R.f, R.u, R.b, R.d]; for (let i = 0; i < 4; i++) { const a = rim[i], b = rim[(i + 1) % 4]; B.facet([a, b, R.af], 713); B.facet([b, a, R.ab], 713); } return B.done(); })();
      out.ridge = (() => { const B = Bd(), rd = 0.016; for (const p of [R.f, R.u, R.b, R.d]) B.tube(R.af, p, rd * 1.2, rd * 0.6, 710.2, { seg: 5 }); return B.done(); })();
      out.eye = Bd().sph([0, 0, 0], 0.13, 712, 14).done();
      for (let f = 0; f < 6; f++) for (const md of [0, 1]) { out['tg' + f + md] = rayTail(Bd(), -1, (f + 0.5) / 6, md).done(); out['ti' + f + md] = rayTail(Bd(), 1, (f + 0.5) / 6, md).done(); }
      return out; }),
    pose(ph, md) { const blk = md === 'block' ? 1 : 0, bob = Math.sin(ph * TAU) * 0.14, fl = Math.sin(ph * TAU * 2), zc = 2.0 + bob, o = [0, 0, zc], L = [];
      const BR = mm(RAY_TILT, mm(ry(blk * 0.18 + fl * 0.03), rx(fl * 0.05))), fi = Math.min(5, Math.floor(ph * 6));
      L.push(P('body', o, BR, { glow: 0.25 + blk * 0.5, wear: 0.4 }), P('ridge', o, BR, { glow: 0.3, outline: false }));
      const ep = vadd(o, at3(BR, vadd(RAY.af, [0, 0.03, 0]))); L.push(P('eye', ep, BR, { kind: 0, glow: 1.0 + blk * 1.3, outline: false }));
      L.push(P('tg' + fi + blk, o, BR, { glow: 0.3 + blk * 0.5, wear: 0.3 }), P('ti' + fi + blk, o, BR, { glow: 0.25 + blk * 0.4, wear: 0.6 }));
      return { parts: L, halos: [[ep, 0.42, GREEN, 0.5 + blk * 0.45], [o, 1.0, ICE_HI, 0.12 + blk * 0.1]], shadow: [0.82, 0.24, 0.18] }; } };

  /* ---- the frost lantern: a dark core of black glass with green light swirling in it, held in a turning cage of clear ice bars (a
     cube seen along its long diagonal: a hexagon with three bars meeting at its middle), frost crystals at its corners ---- */
  const CUBE_TO_VIEW = (() => { const d = vnrm([1, 1, 1]), e1 = vnrm(vcross([0, 0, 1], d)), e3 = vcross(d, e1); return M3([e1[0], d[0], e3[0]], [e1[1], d[1], e3[1]], [e1[2], d[2], e3[2]]); })();   // (maps the cube's (1,1,1) to +y)
  DEF.frostlantern = { ext: 2.2, nf: 6, faced: false, modes: [''], foot: 0.86,
    G: model('frostlantern', q => { const out = {}, Bd = () => GLM.builder(q), a = 0.52;
      out.core = Bd().sph([0, 0, 0], 0.37, 715, 20).done();
      out.cage = (() => { const B = Bd(), V = []; for (let i = 0; i < 8; i++) V.push([(i & 1 ? 1 : -1) * a, (i & 2 ? 1 : -1) * a, (i & 4 ? 1 : -1) * a]);
        for (let i = 0; i < 8; i++) for (const bt of [1, 2, 4]) { if (i & bt) continue; const j = i | bt; B.tube(V[i], V[j], 0.034, 0.034, 714.1, { seg: 6, cap0: false, cap1: false }); }
        V.forEach((p, i) => { const d = vnrm(p); B.crystal(vmul(d, 0.8), vmul(d, 1.0), 0.05, 714, { n: 5, seed: i + 2, belly: 0.4 }); });
        return B.done(); })();
      return out; }),
    pose(ph) { const k = 0.5 + 0.5 * Math.sin(ph * TAU), bob = Math.sin(ph * TAU) * 0.15, zc = 1.85 + bob, o = [0, 0, zc], R = mm(FACE_V, mm(ry(ph * TAU / 3), CUBE_TO_VIEW));
      return { parts: [P('core', o, I3(), { glow: 0.18 + 0.22 * k, wear: 0.3 }), P('cage', o, R, { glow: 0.3 + 0.3 * k, wear: 0.6 })],
        halos: [[o, 1.55, ICE_HI, 0.2 + 0.14 * k], [o, 0.5, GREEN, 0.45 + 0.3 * k]], shadow: [0.55, 0.18, 0.2] }; } };

  /* ---- the yeti: a hulking body of shaggy white fur (locks hanging round its edge), short thick legs, long arms to its navy hands, a
     navy mask with a heavy white brow, two green eyes, a wide dark mouth with two blunt white fangs, two curled horns of pale ice ---- */
  function hornLine(sd, u) { const p0 = -2.25, p1 = 2.05, ph = p0 + (p1 - p0) * u, Rr = 0.42 * (1 - 0.4 * u), R0 = 0.42, base = [0.32, sd * 0.36, 2.02], C = [base[0], base[1] - sd * R0 * Math.cos(p0), base[2] - R0 * Math.sin(p0)];
    return [C[0] - 0.14 * u, C[1] + sd * Rr * Math.cos(ph), C[2] + Rr * Math.sin(ph)]; }
  DEF.yeti = { ext: 2.45, nf: 6, faced: true, modes: ['', 'air', 'throw'], foot: 0.9, head: 1.12,
    G: model('yeti', q => { const out = {}, Bd = () => GLM.builder(q);
      out.body = (() => { const B = Bd(); B.ell([0, 0, 1.24], [0.6, 0.74, 0.98], 716, { seg: 26, rings: 16 });
        for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + 0.1, zz = 0.42 + 0.12 * Math.sin(i * 2.1), cx = Math.cos(a) * 0.56, cy = Math.sin(a) * 0.72;
          B.tube([cx * 0.96, cy * 0.96, zz + 0.12], [cx * 1.06, cy * 1.05, zz - 0.1 - 0.05 * (i % 3)], 0.15, 0.04, 716, { seg: 7, cap1: 'round' }); }
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.26, zz = 1.15 + 0.35 * Math.sin(i * 2.7), cx = Math.cos(a) * 0.6, cy = Math.sin(a) * 0.78;
          B.tube([cx * 0.94, cy * 0.94, zz + 0.1], [cx * 1.08, cy * 1.08, zz - 0.12], 0.12, 0.03, 716, { seg: 6, cap1: 'round' }); }
        return B.done(); })();
      out.mask = Bd().ell([0, 0, 0], [0.26, 0.46, 0.38], 711.1, { seg: 20, rings: 12 }).done();
      out.brow = (() => { const B = Bd(); B.ell([0, 0, 0], [0.16, 0.5, 0.11], 716, { seg: 18, rings: 8 }); for (let i = 0; i < 5; i++) { const y = (i - 2) * 0.2; B.tube([0.06, y, 0.02], [0.14, y * 1.05, -0.12], 0.07, 0.015, 716, { seg: 6, cap1: false }); } return B.done(); })();
      out.eye = Bd().ell([0, 0, 0], [0.06, 0.09, 0.06], 712, { seg: 12, rings: 6 }).done();
      out.mouth = Bd().ell([0, 0, 0], [0.08, 0.23, 0.085], 715, { seg: 14, rings: 6 }).done();
      out.fang = Bd().spike([0, 0, 0], [0.01, 0, -0.17], 0.052, 721, { seg: 6 }).done();
      for (const sd of [1, -1]) out['horn' + (sd > 0 ? 'R' : 'L')] = Bd().surf((u, v) => { const c0 = hornLine(sd, u), c1 = hornLine(sd, Math.min(1, u + 0.01)), cm = hornLine(sd, Math.max(0, u - 0.01)), T0 = vnrm(vsub(c1, cm)), N1 = vnrm(vcross(T0, [1, 0, 0])), N2 = vcross(T0, N1), tr = 0.12 * (1 - 0.82 * u) + 0.007, a = v * TAU;
        return vadd(c0, vadd(vmul(N1, Math.cos(a) * tr), vmul(N2, Math.sin(a) * tr))); }, 26, 10, () => 722, { e: () => 0, a: u => u, flip: sd < 0 }).done();
      out.arm = (() => { const B = Bd(); B.tube([0, 0, 0], [0, 0, -0.8], 0.25, 0.21, 716, { seg: 16 }); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; B.ell([Math.cos(a) * 0.2, Math.sin(a) * 0.2, -0.62], [0.1, 0.1, 0.2], 716, { seg: 8, rings: 5 }); } return B.done(); })();
      out.armB = (() => { const B = Bd(); B.tube([0, 0, 0], [0, 0, -0.78], 0.23, 0.2, 716.1, { seg: 14 }); return B.done(); })();
      out.hand = (() => { const B = Bd(); B.ell([0, 0, 0], [0.2, 0.18, 0.15], 711.1, { seg: 14, rings: 8 }); for (let i = 0; i < 3; i++) B.ell([0.14, (i - 1) * 0.09, -0.08], [0.07, 0.05, 0.06], 711.1, { seg: 8, rings: 5 }); return B.done(); })();
      out.leg = (() => { const B = Bd(); B.tube([0, 0, 0], [0, 0, -0.48], 0.27, 0.25, 716.1, { seg: 14 }); B.ell([0.06, 0, -0.5], [0.3, 0.24, 0.12], 716.1, { seg: 14, rings: 6 }); return B.done(); })();
      out.ball = Bd().sph([0, 0, 0], 0.3, 720, 16).done();
      return out; }),
    pose(ph, md) { const run = Math.sin(ph * TAU), air = md === 'air' ? 1 : 0, thr = md === 'throw' ? 1 : 0, L = [];
      const bz = (air ? 0.12 : 0) + Math.abs(Math.cos(ph * TAU)) * 0.05 * (1 - air), BR = ry(air ? -0.1 : thr ? -0.12 : run * 0.03), bo = [0, 0, bz];
      L.push(P('body', bo, BR, { wear: 0.35 }));
      const fp = vadd(bo, at3(BR, [0.45, 0, 1.62])); L.push(P('mask', fp, BR, { wear: 0.5 }), P('brow', vadd(bo, at3(BR, [0.55, 0, 1.98])), BR, { wear: 0.7 }));
      for (const sy of [1, -1]) { L.push(P('eye', vadd(fp, at3(BR, [0.24, 0.16 * sy, 0.1])), BR, { kind: 0, glow: 1.2 + thr * 0.6, outline: false }), P('fang', vadd(fp, at3(BR, [0.25, 0.09 * sy, -0.12])), BR, { wear: 0.4, outline: false })); }
      L.push(P('mouth', vadd(fp, at3(BR, [0.22, 0, -0.15])), BR, { glow: 0, wear: 0.2, outline: false, sc: [1, 1, 1 + thr * 0.6 + air * 0.6] }));
      L.push(P('hornR', bo, BR, { wear: 0.3 }), P('hornL', bo, BR, { wear: 0.7 }));
      // legs (short, thick), arms: the near one (+y) over the body, the far one behind; raised in the leap, the near one overhead to throw
      for (const sy of [1, -1]) { const sw = air ? 0.35 : Math.sin(ph * TAU + (sy > 0 ? 0 : Math.PI)) * 0.3; L.push(P('leg', vadd(bo, [sw * 0.25, 0.4 * sy, 0.55]), ry(-sw * 0.5), { wear: 0.4 })); }
      for (const sy of [1, -1]) { const near = sy > 0, sh = vadd(bo, at3(BR, [0.04, 0.78 * sy, 1.62])), swing = air ? -2.3 : thr && near ? -2.85 : (near ? -run : run) * 0.32 - (thr ? 0.4 : 0), out2 = air ? 0.55 : thr && near ? 0.15 : 0.12;
        const AR = mm(BR, mm(rx(sy * out2), ry(swing))), hand = vadd(sh, at3(AR, [0, 0, -0.92]));
        L.push(P(near ? 'arm' : 'armB', sh, AR, { wear: near ? 0.5 : 0.8 }), P('hand', hand, AR, { wear: 0.3 }));
        if (thr && near) L.push(P('ball', vadd(hand, at3(AR, [0.05, 0, -0.18])), I3(), { wear: 0.5 })); }
      const hz = [[vadd(fp, at3(BR, [0.24, 0, 0.08])), 0.45, GREEN, 0.32 + thr * 0.2]];
      return { parts: L, halos: hz, shadow: [1.08, 0.34, 0.3] }; } };

  /* ---- the ice golem: legs and hips of block ice, a broad chest of bevelled slabs meeting in a ridge round a green diamond core in a
     dark socket, a small head block with a slit of light and a cap of snow, great fists, crystal spikes from its shoulders and back ---- */
  const GOLEM_SPIKES = [[-0.15, -0.56, 2.48, -0.55, 0.85, 0.13], [-0.22, -0.28, 2.62, -0.2, 0.62, 0.1], [-0.12, 0.56, 2.48, 0.5, 0.95, 0.14], [-0.2, 0.86, 2.2, 1.0, 0.56, 0.1], [-0.25, -0.88, 2.15, -1.05, 0.52, 0.09], [-0.42, 0.1, 2.3, 0.1, 0.7, 0.11]];
  DEF.icegolem = { ext: 3.0, nf: 6, faced: false, yaw: 1.2, modes: ['', 'block', 'cracked', 'blockc'], foot: 0.95,
    G: model('icegolem', q => { const out = {}, Bd = () => GLM.builder(q);
      out.leg = Bd().box([0, 0, -0.4], [0.2, 0.21, 0.4], 0.06, 718.1).done();
      out.legR = Bd().box([0, 0, -0.4], [0.2, 0.21, 0.4], 0.06, 718).done();
      out.hips = Bd().box([0, 0, 0], [0.3, 0.55, 0.16], 0.07, 718.1).done();
      out.chest = (() => { const B = Bd(); B.box([-0.06, 0, 0], [0.34, 0.74, 0.74], 0.12, 718);
        for (const sy of [1, -1]) { B.push(...(() => { const R = rz(sy * 0.24); return [R.x, R.y, R.z, [0.3, sy * 0.37, 0.02]]; })()); B.box([0, 0, 0], [0.09, 0.37, 0.7], 0.06, sy > 0 ? 718.2 : 718); B.pop(); }
        return B.done(); })();
      out.socket = Bd().ell([0, 0, 0], [0.08, 0.3, 0.42], 715, { seg: 4, rings: 2 }).done();
      out.gem = Bd().ell([0, 0, 0], [0.09, 0.16, 0.23], 712, { seg: 4, rings: 2 }).done();
      out.head = Bd().box([0, 0, 0], [0.25, 0.3, 0.22], 0.07, 718).done();
      out.slit = Bd().box([0, 0, 0], [0.02, 0.18, 0.035], 0.01, 712).done();
      out.cap = Bd().ell([0, 0, 0], [0.27, 0.32, 0.07], 720, { seg: 18, rings: 6, th0: 0, th1: Math.PI / 2, cap: true }).done();
      out.upper = Bd().box([0, 0, -0.4], [0.16, 0.16, 0.42], 0.05, 718.1).done();
      out.fist = Bd().box([0, 0, 0], [0.27, 0.25, 0.25], 0.08, 718.2).done();
      out.fistB = Bd().box([0, 0, 0], [0.27, 0.25, 0.25], 0.08, 718.1).done();
      out.spikes = (() => { const B = Bd(); GOLEM_SPIKES.forEach(([x, y, z, dy, h, w], i) => B.crystal([x, y, z], [x - 0.12, y + dy * 0.45, z + h * 1.3], w, 714, { n: 5, seed: i + 3, belly: 0.3 })); return B.done(); })();
      return out; }),
    pose(ph, md) { const run = Math.sin(ph * TAU), up = md === 'block' || md === 'blockc' ? 1 : 0, cr = md === 'cracked' || md === 'blockc' ? 1 : 0, L = [];
      const bz = Math.abs(Math.cos(ph * TAU)) * 0.04 * (1 - up), sway = run * 0.03 * (1 - up), BR = mm(rz(sway), ry(up * -0.06)), bo = [0, 0, bz];
      for (const sy of [1, -1]) { const k = (sy > 0 ? run : -run) * 0.14 * (1 - up); L.push(P(sy > 0 ? 'legR' : 'leg', [k, 0.36 * sy, 0.82], ry(-k * 0.6), { wear: 0.3 + 0.3 * sy })); }
      L.push(P('hips', vadd(bo, [0, 0, 0.98]), BR, { wear: 0.5 }), P('chest', vadd(bo, at3(BR, [0, 0, 1.86])), BR, { wear: 0.6, spill: cr, glow: cr * 0.6 }), P('spikes', bo, BR, { wear: 0.45, glow: 0.2 + cr * 0.4 }));
      const cp = vadd(bo, at3(BR, [0.4, 0, 1.78])); L.push(P('socket', cp, BR, { glow: 0.2 + cr * 0.6, outline: false }), P('gem', vadd(cp, at3(BR, [0.04, 0, 0])), BR, { kind: cr ? 3 : 0, glow: 1.0 + cr * 1.2, outline: false }));
      const hp = vadd(bo, at3(BR, [0.02, 0, 2.86])); L.push(P('head', hp, BR, { wear: 0.4 }), P('slit', vadd(hp, at3(BR, [0.26, 0, 0.03])), BR, { kind: 0, glow: 1.3, outline: false }), P('cap', vadd(hp, at3(BR, [0, 0, 0.2])), BR, { wear: 0.5 }));
      for (const sy of [1, -1]) { const sh = vadd(bo, at3(BR, [0, 0.98 * sy, 2.4])), swing = up ? -2.75 : (sy > 0 ? run : -run) * 0.18, AR = mm(BR, mm(rx(sy * (up ? 0.12 : 0.1)), ry(swing)));
        L.push(P('upper', sh, AR, { wear: 0.4 + 0.2 * sy })); const fp = vadd(sh, at3(AR, [0.02, 0, -0.98])); L.push(P(sy > 0 ? 'fist' : 'fistB', fp, AR, { wear: 0.6, glow: up * 0.3 })); }
      const hz = [[cp, 0.55 + cr * 0.45, GREEN, 0.55 + cr * 0.4 + 0.12 * Math.sin(ph * TAU * 2)], [vadd(hp, at3(BR, [0.3, 0, 0.03])), 0.3, GREEN, 0.4]];
      if (up) for (const sy of [1, -1]) hz.push([vadd(bo, at3(BR, [0.1, 1.0 * sy, 3.5])), 0.55, ICE_HI, 0.45]);
      return { parts: L, halos: hz, shadow: [1.15, 0.36, 0.32] }; } };

  /* ---- the great ice crystal (the Split Iceberg's four): tall pale prisms burst up through the glacier, heaved slabs of dark rock
     with snow on them round its foot, the aurora's green light rising in the tallest ---- */
  const SHARDS = [[-1.05, 1.15, -0.62, 0.22], [1.08, 1.3, 0.6, 0.24], [-0.6, 2.0, -0.28, 0.33], [0.55, 2.3, 0.22, 0.36], [0, 3.0, 0.02, 0.44], [1.35, 0.7, 0.95, 0.15], [-1.4, 0.65, -1.0, 0.14]];
  const SLABS = [[-1.25, 0.2, -0.5, 0.42], [1.2, 0.25, 0.45, 0.45], [-0.55, 0.55, -0.15, 0.4], [0.5, 0.6, 0.2, 0.42], [0, -0.5, 0, 0.36], [-0.8, -0.4, 0.3, 0.3], [0.85, -0.35, -0.35, 0.32]];
  DEF.aurcrystal = { ext: 3.0, nf: 1, faced: false, modes: [''], foot: 0.72,
    G: model('aurcrystal', q => { const B = GLM.builder(q), C = GLM.builder(q);
      SHARDS.forEach(([x, h, a, w], i) => { const hh = h * 1.32, b = [x * 0.95, (i % 3 - 1) * 0.18, -0.05], tip = vadd(b, [Math.sin(a) * hh, (i % 2 ? 0.12 : -0.1) * hh, Math.cos(a) * hh]); B.crystal(b, tip, w * 0.95, 714, { n: 6, belly: 0.72, base: 0.85, seed: i + 1, up: [0, 1, 0] }); });
      SLABS.forEach(([x, y, a, w], i) => { const R = mm(rz(a), rx(0.25 * (i % 2 ? 1 : -1))); C.push(R.x, R.y, R.z, [x, y, 0.06]); C.box([0, 0, 0], [w, w * 0.55, 0.1], 0.04, 723); C.pop(); });
      return { ice: B.done(), rock: C.done() }; }),
    pose() { return { parts: [P('ice', [0, 0, 0], I3(), { glow: 0.55, wear: 0.4 }), P('rock', [0, 0, 0], I3(), { wear: 0.6 })], halos: [[[0, 0, 1.6], 1.7, ICE_HI, 0.32], [[0, 0, 3.3], 0.9, GREEN, 0.42]], shadow: [1.55, 0.5, 0.4] }; } };
  const TYPES = Object.keys(DEF);

  /* ======================= baking a sprite frame ======================= */
  let CUR_BIO = null, ACT = null, ACTT = -1e9;
  const gameDbg = () => { try { const D = typeof arc !== 'undefined' && arc && arc.game && arc.game._dbg; return D || null; } catch (e) { return null; } };
  const gameBio = () => { const D = gameDbg(); try { return D && D.F ? D.F.biome : null; } catch (e) { return null; } };
  const bio = () => CUR_BIO || gameBio() || 'glacier';
  function active() { const t = nowMs(); if (t - ACTT < 250 && ACT != null) return ACT; ACTT = t; const b = CUR_BIO || gameBio(); ACT = (!b || !!LANDS[b]) && glBase(); return ACT; }
  const ST = { baked: 0, ms: 0, prov: 0, over: {}, lazy: 0, fx: { passes: 0, quads: 0, shots: 0, tells: 0, lanes: 0, bursts: 0, shields: 0 }, mini: 0 };
  const BW = { t: -1e9, n: 0, ms: 0 }, PROV = [];
  const playing = () => typeof arc !== 'undefined' && arc && arc.state === 'play';
  function budget() { const t = nowMs(); if (t - BW.t > 14) { BW.t = t; BW.n = 0; BW.ms = 0; flushProv(); } return !playing() || win('__AUB_NOBUDGET') === 1 || (BW.n < 2 && BW.ms < 4); }
  let PRAF = 0;
  function provTick() { if (PRAF || typeof requestAnimationFrame !== 'function') return; const f = () => { PRAF = 0; if (!PROV.length) return; if (nowMs() - BW.t > 14) { BW.t = nowMs(); BW.n = 0; BW.ms = 0; flushProv(); } if (PROV.length) PRAF = requestAnimationFrame(f); }; PRAF = requestAnimationFrame(f); }
  function flushProv() { const MC = DunArt.monCache; for (let i = 0; i < 2 && PROV.length; i++) { const k = PROV.shift(); if (MC) { MC.delete(k); MC.delete(k + '|f'); } } }
  /* (20b's drawMon asks DunArt.FACED whether a type has its own left-facing frames; Rift 04's file sets it after this one loads, so it is
     taken over on first use, its answer kept for every type not ours) */
  function ensureFaced() { const f0 = DunArt.FACED; if (f0 && f0.__aub) return; const f = t => { const D = DEF[t]; if (D) return !!(D.faced && active()); return !!(f0 && f0(t)); }; f.__aub = 1; DunArt.FACED = f; }
  /* render type's frame ph in mode md0 ('<' at its end: facing left) into the sprite canvas c (its origin the sprite's centre; r the
     body radius in its pixels). False: not done (the caller paints the 2D art) */
  function bake(c, type, r, ph, o) {
    const D = DEF[type], md0 = (o && o.mode) || '', left = md0.charCodeAt(md0.length - 1) === 60, md1 = left ? md0.slice(0, -1) : md0, md = D && D.modes.includes(md1) ? md1 : '';
    if (!D || !active() || !D.G.on()) return false;
    ensureFaced();
    if (!budget()) { ST.prov++; provTick(); PROV.push(type + '|' + Math.max(4, Math.round(r)) + '|' + Math.floor(((ph % 1) + 1) % 1 * ((DunArt.NF && DunArt.NF[type]) || 4)) + '|' + (o && o.color) + '|' + md0); return false; }
    const t0 = nowMs(); let ok = false;
    try { const Ps = D.pose(ph, md), head = D.faced ? (left ? Math.PI - (D.head || 0.4) : (D.head || 0.4)) : (D.yaw || 0), V = { k: r, Rh: rz(head), X0: 0, Y0: D.foot * r }, sh = Ps.shadow;
      if (sh) blob(c, 0, V.Y0, sh[0] * r * 1.05, sh[1] * r * 1.05, sh[2]);
      ok = glPass(c, V, Ps.parts, { light: LANDS[bio()] ? bio() : 'glacier', t: ph * 10, res: lowFx() ? 0.8 : 1, outline: 1.1 }, D.G);
      if (ok) { halos(c, V, Ps.halos); const half = c.canvas ? c.canvas.width / 2 : 0, b = D.G.box; if (half && b) { const ov = Math.max(-b[0], b[2], -b[1], b[3]) / half; if (ov > (ST.over[type] || 0)) ST.over[type] = +ov.toFixed(2); } }
    } catch (e) { failed(); if (typeof console !== 'undefined') console.warn('AUR_BROOD bake ' + type, e); ok = false; }
    const dt = nowMs() - t0; BW.n++; BW.ms += dt; ST.ms += dt; if (ok) { ST.baked++; if (playing()) ST.lazy++; }
    return ok;
  }
  /* the painters wrapped; the sprites' room (EXT) the models' own while the GPU is used (the 2D art's otherwise) */
  const { MP, EXT, NF } = DunArt, ORIG = {};
  for (const t of TYPES) { const p0 = MP[t]; if (typeof p0 !== 'function') continue; const e0 = EXT[t] || 1.6; ORIG[t] = { p0, e0 };
    MP[t] = function (c, r, ph, o) { if (bake(c, t, r, ph, o)) return; const md = (o && o.mode) || '';
      if (md.charCodeAt(md.length - 1) === 60) { c.save(); c.scale(-1, 1); p0(c, r, ph, Object.assign({}, o, { mode: md.slice(0, -1) })); c.restore(); return; }
      return p0(c, r, ph, o); };
    try { Object.defineProperty(EXT, t, { get: () => (active() ? DEF[t].ext : ORIG[t].e0), set: v => { ORIG[t].e0 = v; }, configurable: true, enumerable: true }); } catch (e) { /* (kept as it was) */ }
    if (DEF[t].nf && NF[t] !== DEF[t].nf) NF[t] = DEF[t].nf; }
  ensureFaced();

  /* ======================= their attacks on the GPU (FGFX kinds 530..535, laid over) ======================= */
  const FGX = () => { try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const fxOn = () => win('__AUB_FX') !== 0 && win('__DUN_GL') !== 0 && !!FGX();
  /* each land's colours for them: deeper on the white snow (the Split Iceberg, the Whiteout), paler on the Observatory's dark stone */
  const PAL = { glacier: { ice: '#3F7FBF', green: '#2FA07A', warm: '#D9822B', snow: '#5E8CB8' }, observatory: { ice: '#9AD2F2', green: '#7FE3BC', warm: '#FFB866', snow: '#DCEBF5' }, whiteout: { ice: '#4C86BE', green: '#33A27C', warm: '#D07A22', snow: '#6E96BC' } };
  const pal = () => PAL[bio()] || PAL.glacier;
  const hexRGB0 = h => { const s = String(h || '').replace('#', ''); if (s.length < 6) return [255, 255, 255]; return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; };
  function tellCol(c0) { const p = pal(), [r, g, b] = hexRGB0(c0); if (g > r + 20 && g > b) return p.green; if (r > b + 30) return p.warm; return p.ice; }
  /* what the AI makes, tagged: a shot gets its painter, a tell its 'drawn' hook (the engine leaves it to this layer while the layer paints) */
  const LAY = { g: null, ft: -1e9, zones: null, tells: [], lanes: [], bursts: [], seen: new WeakSet() };
  const DRAWN = () => !!LAY.g && Math.abs(LAY.ft - LAY.g.t) < 0.3;
  const SHOT = { rimescuttler: 'dart', veilray: 'veil', frostlantern: 'frost', yeti: 'snow' };
  function paintShot(Q, X, Y, r, T, b) { const p = pal(), a = Math.atan2(b.vy, b.vx), dx = Math.cos(a), dy = Math.sin(a), st2 = b.amk; ST.fx.shots++;
    if (st2 === 'dart') { const L = r * 3.3, W = r * 1.3; Q.quad(533, X - dx * r * 0.5, Y - dy * r * 0.5, dx * L, dy * L, -dy * W, dx * W, p.ice, 1, 0.9); return true; }
    const R = r * (st2 === 'snow' ? 1.75 : 1.85); Q.quad(534, X, Y, R, 0, 0, R, st2 === 'veil' ? p.green : st2 === 'snow' ? p.snow : p.ice, 1, st2 === 'snow' ? 0 : st2 === 'frost' ? 1 : 2, (b.amSd = b.amSd || Math.random() * 40)); return true; }
  function tagNew(t, m, X, E, ne, Z, nz) {
    if (E && E.length > ne) for (let i = ne; i < E.length; i++) { const b = E[i]; if (!b || b.paint || b.mine || b.amk) continue; const k = SHOT[t]; if (!k) continue; b.amk = k; b.paint = paintShot; }
    if (Z) { LAY.zones = Z; if (Z.length > nz) for (let i = nz; i < Z.length; i++) { const z = Z[i]; if (!z || LAY.seen.has(z)) continue; LAY.seen.add(z);
      if (z.kind === 'warn' && z.own !== 'pet' && !z.drawn) { z.drawn = DRAWN; if (!z.color || z.color === '#FF4D6D') z.color = ICE_HI; z.amSd = Math.random() * 40; LAY.tells.push(z); }
      else if (z.kind === 'windlane') { z.amSd = Math.random() * 40; LAY.lanes.push(z); } } }
  }
  const burst = (x, y, R, col, max) => { if (LAY.bursts.length < 24) LAY.bursts.push({ x, y, R, col, t: 0, max: max || 0.6, sd: Math.random() * 40 }); };
  { const { mon, boss } = DunAI;
    const wrapAI = (tab, t) => { const f0 = tab[t]; if (typeof f0 !== 'function' || f0.__aub) return;
      const w = function (m, A, X) { const E = X && X.eshots, Z = X && X.zones, ne = E ? E.length : 0, nz = Z ? Z.length : 0, b0 = m.braceT, h0 = !!m.hop, s0 = m.slamT;
        const r = f0.apply(this, arguments);
        try { tagNew(t, m, X, E, ne, Z, nz);
          if (t === 'rimescuttler' && b0 > 0 && !(m.braceT > 0)) burst(m.x + Math.cos(m.ba || 0) * 0.6, m.y + Math.sin(m.ba || 0) * 0.6 - 0.1, 0.7, 'ice', 0.35);
          else if (t === 'yeti' && h0 && !m.hop) burst(m.x, m.y, 1.7, 'ice', 0.6);
          else if (t === 'icegolem' && s0 > 0 && !(m.slamT > 0)) burst(m.x, m.y, 2.9, 'ice', 0.7); } catch (e) { /* (only the pictures) */ }
        return r; };
      w.__aub = 1; w.toString = () => String(f0); tab[t] = w; };
    for (const t of ['rimescuttler', 'veilray', 'frostlantern', 'yeti', 'icegolem']) wrapAI(mon, t);
    for (const t of ['rimepet', 'galepet', 'whitepet']) wrapAI(boss, t); }
  try { const C0 = MON.aurcrystal, d0 = C0 && C0.onDeath; if (C0 && d0) C0.onDeath = function (m) { try { burst(m.x, m.y, 3.4, 'ice', 0.8); } catch (e) { /* */ } return d0.apply(this, arguments); }; } catch (e) { /* (no crystal) */ }
  /* the layer: one GPU pass under the monsters, only while something shows */
  function fxLayer(X) {
    LAY.g = X.g; LAY.ft = -1e9; LAY.tells.length = 0; LAY.lanes.length = 0; LAY.bursts.length = 0; LAY.zones = null;
    const live = z => z.life > 0 && (!LAY.zones || LAY.zones.indexOf(z) >= 0);
    return {
      update(dt) { const on = fxOn(); try { trim(); } catch (e) { /* */ }
        for (let i = LAY.tells.length - 1; i >= 0; i--) { const z = LAY.tells[i]; if (live(z)) continue; LAY.tells.splice(i, 1);
          // (its strike: the same shape flaring out where it was)
          if (on && LAY.bursts.length < 24) LAY.bursts.push({ strike: z.shape || 'ring', x: z.x, y: z.y, a: z.a || 0, len: z.len || 0, w: z.w || 0, spread: z.spread || 0, R: z.r || 1, col: tellCol(z.color), t: 0, max: 0.35, sd: z.amSd || 0 }); }
        for (let i = LAY.lanes.length - 1; i >= 0; i--) { const z = LAY.lanes[i]; if (!live(z)) { LAY.lanes.splice(i, 1); continue; } z.kind = on ? 'aurwind' : 'windlane'; }
        for (let i = LAY.bursts.length - 1; i >= 0; i--) { const b = LAY.bursts[i]; b.t += dt; if (b.t >= b.max) LAY.bursts.splice(i, 1); } },
      drawGround(c) { if (!fxOn()) return; const g = X.g; LAY.ft = g.t;
        const lan = [], shd = []; for (const m of X.mons) { if (m.dead) continue; if (m.type === 'frostlantern') lan.push(m); else if (m.lanternT > 0 && !m.boss && shd.length < 14) shd.push(m); }
        if (!LAY.tells.length && !LAY.lanes.length && !LAY.bursts.length && !shd.length) return;
        const F = FGX(); if (!F) return; let Q = null; try { Q = F.begin(c, null); } catch (e) { Q = null; } if (!Q) return;
        const T = X.Tz(), p = pal(), n0 = (Q.nl || 0) + (Q.ns || 0);
        try {
          for (const z of LAY.lanes) { const s = Math.max(0, Math.min(1, z.life / 0.4, (z.max - z.life) / 0.3)), dx = Math.cos(z.a), dy = Math.sin(z.a), L2 = z.len * T / 2, W2 = z.w * T * 0.6, X0 = X.sx(z.x), Y0 = X.sy(z.y);
            Q.quad(530, X0 + dx * L2, Y0 + dy * L2, dx * L2, dy * L2, -dy * W2, dx * W2, p.green === PAL.observatory.green ? '#C8F5E6' : '#6FB9D8', 0.95, 2 + s, z.amSd || 0, z.len / Math.max(0.3, z.w)); ST.fx.lanes++; }
          for (const z of LAY.tells) { const u = z.max ? Math.max(0, Math.min(1, 1 - z.life / z.max)) : 0.5, col = tellCol(z.color), Xs = X.sx(z.x), Ys = X.sy(z.y); ST.fx.tells++;
            if (z.shape === 'line') { const dx = Math.cos(z.a), dy = Math.sin(z.a), L2 = z.len * T / 2, W2 = Math.max(0.5, z.w) * T * 0.62; Q.quad(530, Xs + dx * L2, Ys + dy * L2, dx * L2, dy * L2, -dy * W2, dx * W2, col, 1, u, z.amSd, z.len / Math.max(0.3, z.w)); }
            else if (z.shape === 'cone') { const R = z.len * T * 1.06; Q.quad(532, Xs, Ys, R, 0, 0, R, col, 1, u, z.a, z.spread); }
            else { const R = z.r * T * 1.1; Q.quad(531, Xs, Ys, R, 0, 0, R, col, 1, u, z.amSd); } }
          for (const m of shd) { const s = Math.min(1, m.lanternT / 0.3), Xs = X.sx(m.x), Ys = X.sy(m.y) + m.r * T * 0.6, R = m.r * T * 1.55; Q.quad(535, Xs, Ys, R, 0, 0, R * 0.62, p.ice, 0.9, s * (0.8 + 0.2 * Math.sin(g.t * 3 + m.x)), m.x); ST.fx.shields++;
            let best = null, bd = 9; for (const L0 of lan) { const d = Math.hypot(L0.x - m.x, L0.y - m.y); if (d < bd) { bd = d; best = L0; } }
            if (best && bd > 0.6) { const x0 = X.sx(best.x), y0 = X.sy(best.y) + best.r * T * 0.6, dx = (Xs - x0) / 2, dy = (Ys - y0) / 2, l = Math.hypot(dx, dy) || 1, w = T * 0.16; Q.quad(535, x0 + dx, y0 + dy, dx, dy, -dy / l * w, dx / l * w, p.ice, 0.8, 2 + s, best.x * 3.1); } }
          for (const b of LAY.bursts) { const k = Math.min(1, b.t / b.max), Xs = X.sx(b.x), Ys = X.sy(b.y); ST.fx.bursts++;
            if (b.strike === 'line') { const dx = Math.cos(b.a), dy = Math.sin(b.a), L2 = b.len * T / 2, W2 = Math.max(0.5, b.w) * T * 0.62; Q.quad(530, Xs + dx * L2, Ys + dy * L2, dx * L2, dy * L2, -dy * W2, dx * W2, b.col, 1, 1 + k, b.sd, b.len / Math.max(0.3, b.w)); }
            else if (b.strike === 'cone') { const R = b.len * T * 1.06; Q.quad(532, Xs, Ys, R, 0, 0, R, b.col, 1, 1 + k, b.a, b.spread); }
            else if (b.strike) { const R = b.R * T * 1.1; Q.quad(531, Xs, Ys, R, 0, 0, R, b.col, 1, 1 + k, b.sd); }
            else { const R = b.R * T; Q.quad(535, Xs, Ys, R, 0, 0, R * 0.75, b.col === 'ice' ? p.ice : b.col, 1, 1 + k, b.sd); } }
        } catch (e) { /* (the pass still closes) */ }
        ST.fx.quads += Math.round(((Q.nl || 0) + (Q.ns || 0) - n0) / 6); ST.fx.passes++;
        try { F.flush(c); } catch (e) { /* */ } } };
  }
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.aurora; if (Rf) { const es0 = Rf.everyStage;
    Rf.everyStage = function (X, self2, H) { const a = (typeof es0 === 'function' ? es0.apply(this, arguments) : null) || {}; let L = null; try { L = fxLayer(X); } catch (e) { L = null; } if (!L) return a;
      return Object.assign({}, a, { update(dt) { if (a.update) a.update(dt); L.update(dt); }, drawGround(c) { if (a.drawGround) a.drawGround(c); L.drawGround(c); }, drawOver(c) { if (a.drawOver) a.drawOver(c); } }); }; } } catch (e) { /* (no rift) */ }

  /* ======================= the mini bosses: giant evil Cocopets, themed for the Aurora ======================= *
     (v469's way for the Sepulchre, 20s7): riftFight (20m) takes the mini's look from Rf.miniEvil instead of a random Rift-touched one,
     and its stage arms it as the far gate's guardian (EVIL_MINI.arm, keep: its own moves (20s6), health and blows), drawn, woken and
     felled by EVIL_MINI's layer on the GPU (PetGL). Rime: a frost-slate coat, ice crystal horns, tail and wings, a shaggy coat; Gale: a
     storm-navy coat with aurora green, devil horns, bat wings and a crystal tail; Whiteout: a pale blizzard coat with amber, ram horns,
     crystal wings, shaggy. */
  const MINI_LOOK = {
    rimepet: { name: 'Rime the Splitting Ice', short: 'Rime', el: 'frost', seed: 5051, sub: 'A Rift-touched Cocopet holds the split iceberg', hint: { horns: 'crystal', tail: 'crystal', wings: 'crystal', fur: 'shaggy' },
      palette: { tint: '#243A56', tintK: 0.82, pal: { sec: ICE_HI, cheek: '#1C3048' }, col: ICE_HI, glow: '#7FC8F2', core: '#FFFFFF' } },
    galepet: { name: 'Gale the Aurora Wind', short: 'Gale', el: 'frost', seed: 7219, sub: 'A Rift-touched Cocopet rides the observatory winds', hint: { horns: 'devil', wings: 'bat', tail: 'crystal' },
      palette: { tint: '#18263A', tintK: 0.86, pal: { sec: GREEN_HI, cheek: '#163028' }, col: GREEN_HI, glow: GREEN, core: '#EFFFF8' } },
    whitepet: { name: 'Whiteout the Last Cold', short: 'Whiteout', el: 'frost', seed: 3307, sub: 'A Rift-touched Cocopet keeps the summit', hint: { horns: 'ram', wings: 'crystal', fur: 'shaggy' },
      palette: { tint: '#6A7C92', tintK: 0.7, pal: { sec: '#FFB35C', cheek: '#4A3A30' }, col: '#FFD08A', glow: '#FFB35C', core: '#FFF4E0' } } };
  const EMI = () => { try { return (typeof self !== 'undefined' && self.EVIL_MINI) || null; } catch (e) { return null; } };
  const SPECS = {};
  function miniSpec(id, B) { if (SPECS[id]) return SPECS[id]; const E = EMI(), L = MINI_LOOK[id]; if (!E || !E.specOf || !L) return null;
    return (SPECS[id] = E.specOf(Object.assign({}, L, { hp: (B && B.hp) || 1, dmg: (B && B.dmg) || 1, r: (B && B.r) || 1.3, spd: (B && B.spd) || 1.8 }))); }
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.aurora; if (Rf) {
    const me0 = Rf.miniEvil; Rf.miniEvil = id => { if (MINI_LOOK[id]) { try { const E = EMI(), d = miniSpec(id, BOSSES.find(b => b.id === id)); if (E && d) return E.evilOf(d); } catch (e) { /* (a random one) */ } } return me0 ? me0(id) : null; };
    for (const S of Rf.stages) { if (S.kind !== 'fight' || !MINI_LOOK[S.mini] || S.__aubArm) continue; S.__aubArm = 1; const ex0 = S.extra;
      S.extra = (X, self2, H) => { const xm = (ex0 ? ex0(X, self2, H) : null) || {}, E = EMI(); if (!E || !E.arm || !E.layer) return xm;
        const m = X.mons.find(q => q && q.boss && q.lesser && !q.dead && q.bk && q.bk.id === S.mini && !q.calMini), d = m && miniSpec(S.mini, m.bk); if (!m || !d) return xm;
        let gm = null; try { E.arm(X, m, Object.assign({}, d, { r: m.evK ? m.r / m.evK : m.r }), { keep: true, home: { x: m.x, y: m.y }, sub: d.sub || MINI_LOOK[S.mini].sub, wakeR: 9.5 }); m.bname = d.name; gm = E.layer(X); ST.mini++; } catch (e) { if (typeof console !== 'undefined') console.warn('AUR_BROOD mini', e); return xm; }
        return Object.assign({}, xm, { update(dt) { if (xm.update) xm.update(dt); gm.update(dt); }, drawGround(c) { if (xm.drawGround) xm.drawGround(c); gm.drawGround(c); }, drawOver(c) { if (xm.drawOver) xm.drawOver(c); gm.drawOver(c); } }); }; } } } catch (e) { /* (no rift) */ }

  /* ======================= warming on the loading screen, and letting go ======================= */
  const KEEP = new Set(TYPES);
  const BOSS_TYPES = { thul: ['veilray', 'rimescuttler'], nivora: ['veilray', 'frostlantern', 'rimescuttler'], ahuul: ['rimescuttler', 'yeti', 'veilray', 'icegolem', 'frostlantern'] };
  function preload(Pp) {
    try { CUR_BIO = Pp && Pp.F && Pp.F.biome || null; ACTT = -1e9; } catch (e) { CUR_BIO = null; }
    if (!active()) return [];
    ensureFaced();
    const want = new Map(), add = (t, rpx, col) => { if (!DEF[t] || !(rpx > 0) || !MON[t]) return; const key = t + '|' + Math.max(4, Math.round(rpx)) + '|' + (col || MON[t].color); if (!want.has(key)) want.set(key, [t, rpx, col || MON[t].color]); };
    for (const m of (Pp.mons || []).concat(Pp.reserve || [])) if (m && !m.dead && !m.boss && !m.fiend && DEF[m.type]) add(m.type, m.r * Pp.T * Pp.k, m.color);
    const S = Pp.S, more = S ? (S.kind === 'boss' ? BOSS_TYPES[S.boss] || [] : S.kind === 'fight' ? [] : ['rimescuttler', 'veilray', 'frostlantern']) : [];
    for (const t of more) add(t, Pp.monPx(t));
    const jobs = [];
    jobs.push(() => { for (const t of new Set([...want.values()].map(w => w[0]))) DEF[t].G.on(); });
    for (const [t, rpx, col] of want.values()) { const D = DEF[t], nf = D.nf || 4; for (const md of D.modes) for (const lf of D.faced ? [false, true] : [false]) jobs.push(() => { for (let f = 0; f < nf; f++) DunArt.monSprite(t, rpx, (f + 0.5) / nf, col, lf ? md + '<' : md, false); }); }
    // (the attacks' GPU kinds compiled with the rest: one quad of each, drawn off screen)
    jobs.push(() => { const F = FGX(); if (!F || typeof document === 'undefined') return; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'); let Q = null; try { Q = F.begin(x, null); } catch (e) { Q = null; } if (!Q) return; for (let k = 530; k <= 535; k++) Q.quad(k, 32, 32, 20, 0, 0, 20, '#4F8FC8', 0.6, 0.5, 1, 2); try { F.flush(x); } catch (e) { /* */ } });
    return jobs;
  }
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.aurora; if (Rf) { const p0 = Rf.preload; Rf.preload = function (Pp) { let a = null; if (typeof p0 === 'function') { try { a = p0.apply(this, arguments); } catch (e) { a = null; } } let b = []; try { b = preload(Pp); } catch (e) { b = []; } return (Array.isArray(a) ? a : []).concat(b); }; } } catch (e) { /* (no rift) */ }
  function mem() { const MC = DunArt.monCache, by = {}; let px = 0, n = 0; if (MC) for (const [k, s] of MC) { const t = k.slice(0, k.indexOf('|')); if (!KEEP.has(t) || !s || !s.cv) continue; const p = s.cv.width * s.cv.height; px += p; n++; by[t] = (by[t] || 0) + p; }
    const MB = {}; for (const t in by) MB[t] = +(by[t] * 4 / 1048576).toFixed(2); return { n, px, MB: +(px * 4 / 1048576).toFixed(2), by: MB }; }
  /* (a cap on the pictures held: the cache is the 2D art's own LRU (760 entries), but a model baked facing each way in every mode at
     each size it is drawn (a monster, an elite, a pack leader, the hit flash) holds more of them than the 2D art did; past the cap the
     least recently used of ours are let go (rendered again when next drawn, within the budget). Checked once a second) */
  const CAP_PX = () => (lowFx() ? 2.6e6 : 4.6e6);
  let TRIM_T = -1e9, TRIMMED = 0;
  function trim() { const t = nowMs(); if (t - TRIM_T < 1000) return; TRIM_T = t; const MC = DunArt.monCache; if (!MC) return; let px = 0; const mine = [];
    for (const [k, s] of MC) { const ty = k.slice(0, k.indexOf('|')); if (!KEEP.has(ty) || !s || !s.cv) continue; px += s.cv.width * s.cv.height; mine.push(k); }
    const cap = CAP_PX(); if (px <= cap) return; for (const k of mine) { if (px <= cap * 0.75) break; const s = MC.get(k); MC.delete(k); if (s && s.cv) { px -= s.cv.width * s.cv.height; s.cv.width = 1; s.cv.height = 1; } TRIMMED++; } }
  function gpuBuffers() { let n = 0; for (const G of MODELS) if (G.MESH) for (const k in G.MESH) if (G.MESH[k] && G.MESH[k].gl) n++; return n; }
  let REL_N = 0;
  function release() { const MC = DunArt.monCache; if (MC) for (const k of [...MC.keys()]) { const t = k.slice(0, k.indexOf('|')); if (!KEEP.has(t)) continue; const s = MC.get(k); MC.delete(k); if (s && s.cv && s.cv.width > 1) { s.cv.width = 1; s.cv.height = 1; } }
    for (const G of MODELS) if (G.MESH && typeof GLM !== 'undefined' && GLM.free) for (const k in G.MESH) if (G.MESH[k]) GLM.free(G.MESH[k]);
    PROV.length = 0; if (PRAF && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(PRAF); PRAF = 0; CUR_BIO = null; ACT = null; ACTT = -1e9; REL_N++;
    LAY.g = null; LAY.tells.length = 0; LAY.lanes.length = 0; LAY.bursts.length = 0; LAY.zones = null; }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(release); } catch (e) { /* (no rift hook) */ }
  try { const GD = typeof GAMES !== 'undefined' && GAMES.dungeon; if (GD && GD.create && !GD.__aubRel) { const c0 = GD.create; GD.__aubRel = 1; GD.create = function () { const api = c0.apply(this, arguments); if (api && typeof api.destroy === 'function') { const d0 = api.destroy; api.destroy = function () { try { release(); } catch (e) { /* (nothing held) */ } return d0.apply(this, arguments); }; } return api; }; } } catch (e) { /* (no dungeon) */ }
  return { DEF, MINI_LOOK, miniSpec, TYPES, LIGHT, PAL, bake, preload, release, mem, active, fxOn, get gpuBuffers() { return gpuBuffers(); },
    get stats() { return Object.assign({ prov: PROV.length, models: MODELS.map(G => ({ name: G.name, tris: G.tris, meshMs: +G.meshMs.toFixed(1), passMs: +G.ms.toFixed(2), n: G.n })), released: REL_N, trimmed: TRIMMED, bio: bio(), tells: LAY.tells.length, lanes: LAY.lanes.length, bursts: LAY.bursts.length }, ST); },
    get bio() { return bio(); }, set bio(v) { CUR_BIO = v; ACTT = -1e9; }, env: () => ({ DunArt, MON, BIOMES }) };
})();
if (typeof window !== 'undefined') window.AUR_BROOD = AUR_BROOD;
