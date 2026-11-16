/* ---------- Rift 1 · the Hall of Three Tides · east trial mini boss: VARKUL, THE CHAINBOUND (v391, worker B2) ----------
   A three-metre marine beast: a low seal-like body, a blunt crocodilian head, two enormous front flippers, worn bronze
   rings round its blue-black torso, and a short chain dragging a heavy brass bell clapper behind it. Drawn live on the GPU
   with GLM (20k5uz: materials 117..119 between the BEL-VARKUL-MAT markers), as the Bomb King and Ifrit are: rigid meshes
   built once and posed each frame, one composite image into the 2D frame. Where WebGL is missing or a software
   rasteriser (window.__VARKUL_GL = 1 forces the GPU there) it borrows an existing 2D boss picture, the old Belfry beast
   painter (DunBoss.P.uldroth), tinted blue-black: there is no separate 2D model.
   It fights in turn: BRINE BREATH (it rears, its throat glows coral for 1.7 s over a clearly marked frontal cone, then a
   jet of brine down the cone) and CLAPPER SWEEP (it braces on its flippers for 1.9 s while a half-ring in front of it is
   marked with one announced SAFE gap, then swings the chained clapper through it; behind it is always safe), each followed
   by a recovery window. No adds, no reward of its own. Tuned by the hall (about a quarter of Kharrox's effective health,
   else a level-10 fight of about 30 s).
   BELFRY_VARKUL.spawn(X, H, x, y, o) -> { m, tick(dt), ground(c, L), late(c, L), remove() }; .draw / .MODEL for tests. */
var BELFRY_VARKUL = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, ease = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;   // (the game camera: orthographic, about 46 degrees above the floor)
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => Math.sqrt(vdot(a, a)), vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const M3 = (x, y, z) => ({ x, y, z }), I3 = () => M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };   // (+a: x toward -z: the nose down)
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const CORAL = '#FF7F6A', CORAL_HI = '#FFD3C4', BRINE = '#7FE6E0';

  /* =====================================================================================================================
     THE MODEL. Frame: x forward (the head), y left, z up; the origin on the floor under the chest; one unit = one tile.
     ===================================================================================================================== */
  const MODEL = (() => {
    const M_HIDE = 117, M_BELLY = 117.3, M_BRONZE = 118, M_BRASS = 118.2, M_IVORY = 118.4, M_GLOW = 119;
    const BODY = { c: [-0.2, 0, 0.62], r: [1.3, 0.8, 0.58] };
    const bodyR = x => { const u = (x - BODY.c[0]) / BODY.r[0], k = Math.sqrt(Math.max(0, 1 - u * u)); return [BODY.r[1] * k, BODY.r[2] * k]; };
    const RINGS = [0.45, -0.1, -0.65];
    let MESH = null, MESH_MS = 0; const BOUND = {};
    function bounds(M) { let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; for (let i = 0; i < M.pos.length; i += 3) { const x = M.pos[i], y = M.pos[i + 1], z = M.pos[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]; let r = 0; for (let i = 0; i < M.pos.length; i += 3) r = Math.max(r, Math.hypot(M.pos[i] - c[0], M.pos[i + 1] - c[1], M.pos[i + 2] - c[2])); return { c, R: r }; }
    function build() { const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {};
      // the torso: a long, low seal's body, the belly paler; a ridge of hide along the back; the tail tapering to a fluke
      { const B = nb(); B.ell(BODY.c, BODY.r, M_HIDE, { seg: 30, rings: 18, mf: (x, y, z) => z < -0.45 ? M_BELLY : M_HIDE });
        B.ell([0.55, 0, 0.62], [0.55, 0.62, 0.48], M_HIDE, { seg: 24, rings: 12, mf: (x, y, z) => z < -0.5 ? M_BELLY : M_HIDE });   // (the heavy chest and shoulders)
        B.tube([-1.25, 0, 0.5], [-2.15, 0, 0.2], 0.4, 0.1, M_HIDE, { seg: 14, rings: 3, cap0: false });
        B.ell([-2.3, 0, 0.16], [0.28, 0.42, 0.06], M_HIDE, { seg: 16, rings: 6 });
        for (let i = 0; i < 7; i++) { const x = 0.6 - i * 0.33, rr = bodyR(x); B.sph([x, 0, BODY.c[2] + rr[1] * 0.98], 0.06 - i * 0.004, M_HIDE, 6); }
        out.body = B.done(); }
      // the worn bronze rings round the torso (each an ellipse round the body's cross-section), studded
      { const B = nb(); for (const x of RINGS) { const rr = bodyR(x); B.push([1, 0, 0], [0, rr[0] + 0.035, 0], [0, 0, rr[1] + 0.035], [x, 0, BODY.c[2]]); B.torX([0, 0, 0], 1.0, 0.075, M_BRONZE, { seg: 30, rseg: 7 }); B.pop();
          for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; B.sph([x, Math.cos(a) * (rr[0] + 0.08), BODY.c[2] + Math.sin(a) * (rr[1] + 0.08)], 0.035, M_BRONZE, 5); } }
        B.tor([-0.65, 0, BODY.c[2] + bodyR(-0.65)[1] + 0.12], 0.1, 0.035, M_BRASS, { seg: 12, rseg: 5 });   // (the chain's shackle on the back ring)
        out.rings = B.done(); }
      // the head (its own frame: the neck joint at the origin): a blunt crocodilian skull and snout, heavy brows, nostrils
      { const B = nb(); B.ell([0.32, 0, 0.06], [0.46, 0.38, 0.3], M_HIDE, { seg: 22, rings: 12 });
        B.ell([0.86, 0, -0.02], [0.58, 0.28, 0.16], M_HIDE, { seg: 20, rings: 10, mf: (x, y, z) => z < -0.6 ? M_BELLY : M_HIDE });
        for (const sd of [-1, 1]) { B.ell([0.42, sd * 0.24, 0.24], [0.16, 0.1, 0.07], M_HIDE, { seg: 10, rings: 5 }); B.sph([1.33, sd * 0.09, 0.08], 0.045, M_HIDE, 6); }
        for (let i = 0; i < 7; i++) { const x = 0.55 + i * 0.12; for (const sd of [-1, 1]) B.spike([x, sd * (0.25 - i * 0.012), -0.1], [x + 0.01, sd * (0.26 - i * 0.012), -0.24], 0.032, M_IVORY, { seg: 5 }); }
        out.head = B.done(); }
      { const B = nb(); for (const sd of [-1, 1]) B.ell([0.45, sd * 0.25, 0.25], [0.06, 0.05, 0.045], M_GLOW, { seg: 10, rings: 6 }); out.eyes = B.done(); }
      // the lower jaw (its hinge at the origin) and the coral throat beneath the head
      { const B = nb(); B.ell([0.48, 0, -0.05], [0.62, 0.26, 0.1], M_HIDE, { seg: 18, rings: 8, mf: (x, y, z) => z > 0.2 ? M_HIDE : M_BELLY });
        for (let i = 0; i < 6; i++) { const x = 0.28 + i * 0.13; for (const sd of [-1, 1]) B.spike([x, sd * (0.2 - i * 0.012), 0.02], [x + 0.01, sd * (0.2 - i * 0.012), 0.15], 0.028, M_IVORY, { seg: 5 }); }
        out.jaw = B.done(); }
      { const B = nb(); B.ell([0, 0, 0], [0.36, 0.3, 0.2], M_GLOW, { seg: 18, rings: 10 }); out.throat = B.done(); }
      // the great front flippers (shoulder at the origin, reaching out along +x), and the small hind ones
      const flip = (L, W, T2) => { const B = nb(); B.tube([0, 0, 0], [0.36, 0, -0.08], 0.2, 0.15, M_HIDE, { seg: 12 });
        B.surf((u, v) => { const x = 0.3 + u * L, hw = W * Math.sin(Math.PI * Math.min(1, 0.2 + u * 0.95)) * (1 - 0.25 * u), y = (v - 0.5) * 2 * hw, z = -0.1 - u * 0.12 + T2 * Math.cos((v - 0.5) * Math.PI) * (1 - u * 0.6); return [x, y, z]; }, 10, 8, () => M_HIDE, { e: (u, v) => Math.abs(v - 0.5) * 2 });
        B.surf((u, v) => { const x = 0.3 + u * L, hw = W * Math.sin(Math.PI * Math.min(1, 0.2 + u * 0.95)) * (1 - 0.25 * u), y = (v - 0.5) * 2 * hw, z = -0.1 - u * 0.12 - T2 * 0.6 * Math.cos((v - 0.5) * Math.PI) * (1 - u * 0.6); return [x, y, z]; }, 10, 8, () => M_BELLY, { flip: true, e: (u, v) => Math.abs(v - 0.5) * 2 });
        for (let i = 0; i < 3; i++) B.spike([0.3 + L * 0.94, (i - 1) * W * 0.32, -0.2], [0.42 + L, (i - 1) * W * 0.4, -0.24], 0.04, M_IVORY, { seg: 5 });
        return B.done(); };
      out.flip = flip(1.0, 0.36, 0.08); out.hflip = flip(0.55, 0.22, 0.05);
      // a chain link, and the heavy brass bell clapper (a tapered shaft swelling to a ball, an eye at its end)
      { const B = nb(); B.push([1, 0, 0], [0, 1, 0], [0, 0, 1.4], [0, 0, 0]); B.tor([0, 0, 0], 0.1, 0.034, M_BRASS, { seg: 12, rseg: 5 }); B.pop(); out.link = B.done(); }
      { const B = nb(); B.lathe([[0, 0.05], [0.06, 0.09], [0.12, 0.1], [0.5, 0.15], [0.78, 0.2], [0.9, 0.27], [1.02, 0.3], [1.14, 0.27], [1.24, 0.17], [1.28, 0.0]], M_BRASS, { seg: 20, edge: j => j === 6 ? 0.9 : j === 2 ? 0.6 : 0.2 }); B.torX([-0.04, 0, 0], 0.09, 0.03, M_BRASS, { seg: 10, rseg: 5 });
        for (const x of [0.5, 0.92]) B.torX([x, 0, 0], x > 0.8 ? 0.25 : 0.155, 0.025, M_BRONZE, { seg: 18, rseg: 5 }); out.clapper = B.done(); }
      for (const k in out) BOUND[k] = bounds(out[k]);
      return out; }

    /* the rig: P = { t, walk (0..1 phase speed), rear 0..1 (head up), jaw 0..1, throat 0..1 (glow), brace 0..1, breath, swing
       (null, or the clapper's angle round it in the body frame), drag (the clapper's trailing point, model frame), eye,
       hit (a flinch), dead 0..1 } -> parts */
    function rig(P) { const out = { inst: [], A: {} }, I = (mesh, R, o, s, x) => out.inst.push(Object.assign({ mesh, R, o, s: s == null ? 1 : s, al: 1, glow: 1, glow2: 0, seed: 0, kind: 0, fx: P.dead || 0 }, x || {}));
      const t = P.t || 0, br = P.brace || 0, dead = P.dead || 0, wk = P.walk || 0, wph = t * 5.2;
      const bob = Math.sin(wph * 2) * 0.05 * wk + Math.sin(t * 1.6) * 0.015, lower = br * 0.12 + dead * 0.35, pitch = -0.04 * Math.sin(wph * 2) * wk + br * 0.05 + dead * 0.08, roll = Math.sin(wph) * 0.04 * wk + dead * 0.25;
      const Rb = mm(rotX(roll), rotY(pitch)), ob = [0, 0, bob - lower], breath = 1 + 0.025 * Math.sin(t * 1.6) + 0.04 * (P.throat || 0);
      I('body', Rb, ob, 1, { seed: 0.1 }); I('rings', Rb, ob, 1, { seed: 0.4 });
      // the neck and head: rearing up before the breath, lowered into the jet, swaying while it waits
      const neck = vadd(ob, mv(Rb, [0.95, 0, 0.72])), rear = P.rear || 0, hy = Math.sin(t * 0.9) * 0.08 * (1 - rear), hp = -0.55 * rear + 0.15 * (P.jaw || 0) + 0.1 * dead + (P.hit || 0) * -0.15;
      const Rh = mm(Rb, mm(rotZ(hy), rotY(hp))); I('head', Rh, neck, 1, { seed: 0.2 }); I('eyes', Rh, neck, 1, { kind: 1, glow: (P.eye == null ? 0.6 : P.eye) * (1 - dead) });
      const hinge = vadd(neck, mv(Rh, [0.3, 0, -0.12])), Rj = mm(Rh, rotY(0.62 * (P.jaw || 0) + 0.04 * Math.sin(t * 1.3))); I('jaw', Rj, hinge, 1, { seed: 0.3 });
      I('throat', mm(Rh, M3([breath, 0, 0], [0, breath, 0], [0, 0, breath])), vadd(neck, mv(Rh, [0.22, 0, -0.24])), 1, { glow2: P.throat || 0, kind: 0 });
      out.A.mouth = vadd(neck, mv(Rh, [1.35, 0, -0.08])); out.A.throat = vadd(neck, mv(Rh, [0.22, 0, -0.3])); out.A.eyeL = vadd(neck, mv(Rh, [0.48, 0.25, 0.25])); out.A.eyeR = vadd(neck, mv(Rh, [0.48, -0.25, 0.25]));
      // the flippers: rowing when it moves, spread wide and planted when it braces
      for (const sd of [1, -1]) { const sw = Math.sin(wph + (sd > 0 ? 0 : Math.PI)) * wk, yaw = sd * (0.75 + br * 0.55 - sw * 0.35), dip = 0.25 + br * 0.15 + sw * 0.18 - dead * 0.2;
        const sh = vadd(ob, mv(Rb, [0.5, sd * 0.62, 0.34])), Rf = mm(rotZ(yaw), mm(rotY(dip), sd < 0 ? M3([1, 0, 0], [0, -1, 0], [0, 0, 1]) : I3()));
        I('flip', Rf, sh, 1, { seed: sd > 0 ? 0.5 : 0.6, mir: sd < 0 });
        const hs = vadd(ob, mv(Rb, [-1.15, sd * 0.42, 0.25])), Rh2 = mm(rotZ(sd * (2.5 + sw * 0.25)), rotY(0.2)); I('hflip', mm(Rh2, sd < 0 ? I3() : M3([1, 0, 0], [0, -1, 0], [0, 0, 1])), hs, 1, { seed: 0.7, mir: sd > 0 }); }
      // the chain from the back ring's shackle to the clapper: a sagging curve of links
      const anchor = vadd(ob, mv(Rb, [-0.65, 0, BODY.c[2] + bodyR(-0.65)[1] + 0.12])); let cp, cdir;
      if (P.swing != null) { const a = P.swing, R0 = 3.0; cp = [Math.cos(a) * R0, Math.sin(a) * R0, 0.55]; cdir = [Math.cos(a), Math.sin(a), 0]; }
      else { cp = P.drag || [-2.7, 0.3, 0.2]; cdir = vnrm(vsub(cp, anchor)); }
      const tail = vsub(cp, vmul(cdir, 0.04)), n = 9, sag = P.swing != null ? 0.12 : 0.35;
      for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, p = vadd(vadd(vmul(anchor, 1 - u), vmul(tail, u)), [0, 0, -Math.sin(Math.PI * u) * sag]), u2 = Math.min(1, u + 0.05), p2 = vadd(vadd(vmul(anchor, 1 - u2), vmul(tail, u2)), [0, 0, -Math.sin(Math.PI * u2) * sag]), d = vnrm(vsub(p2, p)), up = i % 2 ? [0, 0, 1] : vnrm(vcross(d, [0, 0, 1])), y = vnrm(vcross(up, d)), z = vcross(d, y);
        I('link', M3(d, y, z), p, 1, { seed: 0.8 + i * 0.01 }); }
      { const x = cdir, y = vnrm(vcross([0, 0, 1], x)), z = vcross(x, y); I('clapper', M3(x, y, z), cp, 1, { seed: 0.9 }); out.A.clapper = vadd(cp, vmul(cdir, 1.0)); }
      out.A.center = vadd(ob, [0, 0, 0.6]); out.A.anchor = anchor;
      return out; }

    /* ---------------- drawing ---------------- */
    const CW = [0, VY, VZ], EXW = [1, 0, 0];
    const LW = vnrm([-0.5, 0.35, 0.8]), SBW = vnrm([-0.2, -0.4, 0.9]), RIMW = vnrm([0.55, -0.75, 0.35]), UPW = [0, 0, 1];
    function mkView(x, y, z, a, o) { const T = o.T, sc = o.scale || 1, k = T * sc, Rh = rotZ(a), X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T;
      return { T, sc, k, Rh, toS: p => { const w = mv(Rh, p); return [X0 + w[0] * k, Y0 + (w[1] * GY - w[2] * ZK) * k]; }, toW: p => { const w = mv(Rh, p); return { x: x + w[0] * sc, y: y + w[1] * GY * sc, z: z + w[2] * sc }; }, depth: p => vdot(mv(Rh, p), CW), x, y, z, a }; }
    let LAST = null, NOGL = false, GLFAIL = 0, GLRETRY = 0, GLMS = 0, GLN = 0, GLBOX = null, GLLAST = 0; const GLI = [], GLJ = [];
    const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
    const glOn = () => { if (NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || !GLM.ok()) return false; if (typeof window !== 'undefined' && window.__VARKUL_GL === 0) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__VARKUL_GL)) return false;
      if (!MESH) { try { const t0 = nowMs(); MESH = build(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Varkul: meshes', e); return false; } } return true; };
    const GLCAP = 1400, RIMC = [0.55, 1.15, 1.2], AMBC = [0.85, 0.95, 1.05];
    function glPass(c, V, list, al0, t) {
      const k = V.k, PX = EXW, PY = [0, GY, -ZK], PD = CW, X0 = V.toS([0, 0, 0]);
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      for (const it of list) { const Bd = BOUND[it.mesh]; if (!Bd) continue; const rr = Bd.R * it.s * 1.04 * k, w = mv(V.Rh, vadd(it.o, mv(it.R, vmul(Bd.c, it.s)))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
        if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
      if (!(bx1 > bx0)) return;
      const m = c.getTransform ? c.getTransform() : null, dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (GLM.soft && !(typeof window !== 'undefined' && window.__VARKUL_GLHQ) ? 0.45 : 1);
      let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sk = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sk)); H = Math.max(2, Math.ceil(H * sk));
      const bw = bx1 - bx0, bh = by1 - by0;
      const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: lowFx(), rim: RIMC, amb: AMBC, t: t % 600 };
      let n = 0; const items = GLJ; items.length = 0;
      for (const it of list) { const mesh = MESH[it.mesh]; if (!mesh) continue; const Rw = mm(V.Rh, it.R), s2 = it.s, T = mv(V.Rh, it.o);
        const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
        g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2; g.R1[i] = Rw.y[i] * s2; g.R2[i] = Rw.z[i] * s2; g.T[i] = T[i]; }
        g.alpha = al0 * it.al; g.glow = it.glow; g.glow2 = it.glow2 || 0; g.spill = 0; g.wear = it.seed || 0; g.kind = it.kind || 0; g.fx = it.fx || 0; g.d = vdot(T, PD); items.push(g); }
      items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
      const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return;
      c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++; GLBOX = [W, H]; }
    /* the live 2D lights over the picture: the throat's coral glow, the eyes */
    function lights(c, V, R, P, al) { if (typeof glowSprite !== 'function') return; const k = V.k, A = R.A, dead = P.dead || 0;
      c.save(); c.globalCompositeOperation = 'lighter'; const blob = (p, r, a2, col) => { if (!(a2 > 0.003)) return; const q = V.toS(p), rr = r * k; c.globalAlpha = Math.min(1, al * a2); blitSized(c, glowSprite(col), q[0] - rr, q[1] - rr, rr * 2, rr * 2); };
      const th = (P.throat || 0) * (1 - dead); blob(A.throat, 0.7 + 0.6 * th, 0.15 + 0.6 * th, CORAL); blob(A.throat, 0.3, 0.5 * th, CORAL_HI);
      blob(A.eyeL, 0.25, 0.4 * (1 - dead), CORAL); blob(A.eyeR, 0.25, 0.4 * (1 - dead), CORAL); c.restore(); }
    function draw(c, x, y, z, a, P, o) { o = o || {}; const t = P.t || 0, R = rig(P), V = mkView(x, y, z, a, o); LAST = { R, V, P }; const al0 = P.alpha == null ? 1 : P.alpha; if (!(al0 > 0.01)) return;
      if (glOn() && !o.flat) { let ok = true; try { glPass(c, V, R.inst, al0, t); } catch (e) { glFail(); ok = false; if (typeof console !== 'undefined') console.warn('Varkul GL', e); } if (ok) { lights(c, V, R, P, al0); return true; } }
      return false; }   // (no GPU: the caller lays down an existing 2D boss picture instead; no 2D model of its own)
    let BLOB = null;
    function drawShadow(c, x, y, a, o, al) { const T = o.T, X = o.sx(x), Y = o.sy(y); if (!BLOB) { BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const g = BLOB.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.55, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
      c.save(); c.globalAlpha = 0.55 * (al == null ? 1 : al); c.translate(X - Math.cos(a) * T * 0.3, Y); c.scale(1, GY * 0.62); c.rotate(a); c.drawImage(BLOB, -T * 2.1, -T * 1.0, T * 4.2, T * 2.0); c.restore(); }
    const anchor = name => { if (!LAST) return null; const p = LAST.R.A[name]; return p ? LAST.V.toW(p) : null; };
    return { draw, drawShadow, rig, anchor, build: () => glOn(), RINGS, __dbg: { get gl() { return glOn(); }, set noGL(v) { NOGL = !!v; }, get MESH() { return MESH; }, BOUND, get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +GLMS.toFixed(2), frames: GLN, box: GLBOX, meshMs: +MESH_MS.toFixed(1), meshTris: MESH ? Object.values(MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0 }); } } };
  })();

  /* ======================= the fight ======================= */
  const ROSTER = { id: 'varkul', rift: true, art: 'varkul3d', name: 'Varkul, the Chainbound', title: 'The Sunken Muster\'s master', hp: 4000, dmg: 14, r: 1.25, spd: 1.6, color: '#16222E', glow: '#3A6E78', biome: 'belfry', el: 'bubble' };
  if (typeof BOSSES !== 'undefined' && !BOSSES.some(b => b.id === 'varkul')) BOSSES.push(ROSTER);
  if (typeof DunBoss !== 'undefined' && DunBoss.REACH) DunBoss.REACH.varkul3d = 3;
  const BREATH = { len: 5.6, half: 0.5, wind: 1.7, jet: 1.0 }, SWEEP = { r0: 1.0, r1: 4.6, from: -1.85, to: 1.85, gap: 0.62, wind: 1.9, swing: 0.95 }, REC = 1.6;
  const angN = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  // (the engine's lesser-boss turn calls this every frame: DunAI.boss[B.ai || B.id])
  if (typeof DunAI !== 'undefined' && DunAI.boss) DunAI.boss.varkul = function (m, A, X) { const V = m.vk; if (V && V.turn) V.turn(m, A, X); };

  /* spawn the fight: o = { hp, from: { x, y } (where it crawls out from) } */
  function spawn(X, H, x, y, o) { o = o || {};
    const m = X.lesserBoss(x, y, 1, '', ROSTER); m.bname = ROSTER.name; m.maxhp = m.hp = Math.max(50, o.hp || m.hp); m.phase = 0; m.aggro = true; m.act = 'emerge'; m.x = o.from ? o.from.x : x; m.y = o.from ? o.from.y : y; m.hd = Math.PI / 2; m.r = 1.25; m.varkul = true;
    const g = X.g, me = X.me, V = { m, act: 'emerge', t: 0, next: 'breath', hd: Math.PI / 2, lockA: 0, gapA: 0, swing: null, hitDone: false, drag: [-2.7, 0.3, 0.2], dead: 0, flinch: 0, fl0: 0, pose: { t: 0 }, jetT: 0, stats: { breaths: 0, sweeps: 0, hits: 0, dodged: 0 } }; m.vk = V;
    const dest = { x, y };
    const dmgK = () => X.ST().hp;
    // the pet's place in its frame: distance, and angle from its heading
    const rel = () => { const dx = me.x - m.x, dy = me.y - m.y; return { d: Math.hypot(dx, dy), a: angN(Math.atan2(dy, dx) - V.hd) }; };
    V.turn = (mm2, A2, X2) => { const dt = A2.dt; V.t += dt; m.act = V.act;   // (custom acts: the engine's contact damage never applies)
      const hit = (m.flash || 0) > V.fl0 + 0.01; V.fl0 = m.flash || 0; if (hit) V.flinch = 0.25; V.flinch = Math.max(0, V.flinch - dt);
      const r = rel(), turnTo = (a, sp) => { const d = angN(a - V.hd); V.hd = angN(V.hd + Math.max(-sp * dt, Math.min(sp * dt, d))); };
      if (V.act === 'emerge') { const dx = dest.x - m.x, dy = dest.y - m.y, d = Math.hypot(dx, dy); if (d > 0.05) { const s = Math.min(d, 1.6 * dt); m.x += dx / d * s; m.y += dy / d * s; } if (V.t > 1.6) { V.act = 'stalk'; V.t = 0; m.aggro = true; X.banner('VARKUL, THE CHAINBOUND', 'Watch its throat, and the clapper behind it', CORAL, 2.4, true); } return; }
      if (V.act === 'stalk') { turnTo(Math.atan2(me.y - m.y, me.x - m.x), 2.2); if (r.d > 3.0) { const s = A2.sp * dt; X.moveEnt(m, Math.cos(V.hd) * s, Math.sin(V.hd) * s); V.moving = 1; } else V.moving = 0;
        if (V.t > 0.9 && Math.abs(r.a) < 0.5) { if (V.next === 'breath') { V.act = 'breathW'; V.lockA = V.hd; V.stats.breaths++; } else { V.act = 'sweepW'; V.stats.sweeps++; const s = Math.random() < 0.5 ? -1 : 1; V.gapA = s * (0.55 + Math.random() * 0.75); } V.t = 0; V.hitDone = false; if (X.sfx.hollow) X.sfx.hollow(V.act === 'breathW' ? 160 : 110); } return; }
      V.moving = 0;
      if (V.act === 'breathW') { if (V.t < 0.5) { turnTo(Math.atan2(me.y - m.y, me.x - m.x), 2.0); V.lockA = V.hd; } if (V.t >= BREATH.wind) { V.act = 'breath'; V.t = 0; V.jetT = 0; if (X.sfx.hiss) X.sfx.hiss(1.0, 0.35, 700); X.shake(3, 0.3); } return; }
      if (V.act === 'breath') { V.jetT += dt; if (!V.hitDone && V.t > 0.1) { const rr = rel(); if (rr.d < BREATH.len + (me.r || 0.35) && Math.abs(angN(Math.atan2(me.y - m.y, me.x - m.x) - V.lockA)) < BREATH.half && rr.d > 0.4) { V.hitDone = true; if (X.hurtPet(dmgK() * 0.2, m)) V.stats.hits++; else V.stats.dodged++; } }
        if (V.t >= BREATH.jet) { V.act = 'rec'; V.t = 0; V.next = 'sweep'; } return; }
      if (V.act === 'sweepW') { if (V.t >= SWEEP.wind) { V.act = 'sweep'; V.t = 0; V.prevS = SWEEP.from; if (X.sfx.whoosh) X.sfx.whoosh(); } return; }
      if (V.act === 'sweep') { const u = ease(V.t / SWEEP.swing), s = lerp(SWEEP.from, SWEEP.to, u); V.swing = s;
        if (!V.hitDone) { const rr = rel(), inGap = Math.abs(angN(rr.a - V.gapA)) < SWEEP.gap / 2; const lo = Math.min(V.prevS, s) - 0.08, hi = Math.max(V.prevS, s) + 0.08;
          if (rr.d > SWEEP.r0 - 0.3 && rr.d < SWEEP.r1 + (me.r || 0.35) && rr.a >= lo && rr.a <= hi && !inGap) { V.hitDone = true; if (X.hurtPet(dmgK() * 0.26, m)) { V.stats.hits++; X.push && X.push(Math.atan2(me.y - m.y, me.x - m.x), 1.2); } else V.stats.dodged++; } }
        V.prevS = s; if (V.t >= SWEEP.swing) { V.act = 'rec'; V.t = 0; V.next = 'breath'; V.swing = null; X.shake(4, 0.25); if (X.sfx.thud) X.sfx.thud(); } return; }
      if (V.act === 'rec') { if (V.t >= REC) { V.act = 'stalk'; V.t = 0; } } };
    /* its drawing: an object standing at its feet, the GPU model */
    const obj = H.obj({ x: m.x, y: m.y + 0.31, kind: 'varkul', r: 0.1, label: '', draw(c) { if (V.gone) return; const T = X.Tz(), t = X.g.t, P = pose(t); if (!(P.alpha > 0.01)) return;
      MODEL.drawShadow(c, m.x, m.y, V.hd, { T, sx: X.sx, sy: X.sy }, P.alpha); if (MODEL.draw(c, m.x, m.y, 0, V.hd, P, { T, sx: X.sx, sy: X.sy, scale: 1 })) return;
      // (no GPU here: an existing 2D boss picture stands in, the old Belfry beast's painter, tinted to the hide and the coral throat)
      try { if (!V.fake) { V.fake = Object.create(m); V.fake.bk = Object.assign({}, ROSTER, { id: 'uldroth', art: 'uldroth', color: '#1E2C3C' }); }
        const F2 = V.fake; F2.face = Math.cos(V.hd) >= 0 ? 1 : -1; F2.act = V.act === 'breath' || V.act === 'breathW' ? 'jaw' : V.act; F2.actT = V.t; c.save(); c.globalAlpha = P.alpha;
        DunBoss.draw(c, F2, X.sx(m.x), X.sy(m.y) - T * 0.6, m.r * T, t, me, X.sx, X.sy, T, true); c.restore(); } catch (e) {} } });
    function pose(t) { const P = V.pose, a = V.act, u = V.t; P.t = t; P.walk = V.moving ? 1 : V.act === 'emerge' ? 1 : 0; P.dead = V.dead; P.alpha = 1 - cl((V.dead - 0.6) / 0.4); P.hit = V.flinch * 2;
      P.rear = a === 'breathW' ? ease(u / 0.6) : a === 'breath' ? 1 - ease(u / 0.25) * 0.85 : a === 'rec' && V.next === 'sweep' ? 0.15 * (1 - u / REC) : 0;
      P.throat = a === 'breathW' ? cl(u / BREATH.wind) : a === 'breath' ? 1 - u / BREATH.jet * 0.6 : 0; P.jaw = a === 'breath' ? 1 : a === 'breathW' ? 0.25 * cl(u / BREATH.wind) : a === 'rec' ? 0.25 * (1 - u / REC) : 0.05;
      P.brace = a === 'sweepW' ? ease(u / 0.5) : a === 'sweep' ? 1 : a === 'rec' && V.next === 'breath' ? 1 - ease(u / 0.6) : 0; P.eye = 0.6 + 0.4 * (P.throat || 0) + (a === 'sweepW' ? 0.4 : 0);
      P.swing = a === 'sweep' ? V.swing : a === 'sweepW' ? lerp(Math.PI * 0.95, SWEEP.from, ease((u - 0.9) / 1.0)) * (u > 0.9 ? 1 : 0) + (u <= 0.9 ? Math.PI * 0.95 + Math.sin(u * 7) * 0.15 : 0) : null;
      // (behind, the clapper drags after it: a point that follows the shackle at the chain's length)
      if (P.swing == null) { const back = [-2.7 - Math.sin(t * 0.7) * 0.15, 0.3 * Math.sin(t * 0.5), 0.2]; for (let i = 0; i < 3; i++) V.drag[i] += (back[i] - V.drag[i]) * 0.08; P.drag = V.drag; }
      else { V.drag = [Math.cos(P.swing) * 3, Math.sin(P.swing) * 3, 0.2]; }
      return P; }
    /* the telegraphs on the floor: a bright boundary, a countdown and a symbol with the colour */
    function ground(c, L) { if (V.gone || m.dead) return; const T = X.Tz(), t = X.g.t, Xs = X.sx(m.x), Ys = X.sy(m.y), a = V.act;
      if (a === 'breathW' || a === 'breath') { const u = a === 'breathW' ? cl(V.t / BREATH.wind) : 1, A0 = V.lockA - BREATH.half, A1 = V.lockA + BREATH.half, R = BREATH.len * T;
        c.save(); c.beginPath(); c.moveTo(Xs, Ys); c.arc(Xs, Ys, R, A0, A1); c.closePath(); c.fillStyle = hexA(CORAL, a === 'breath' ? 0.35 : 0.12 + 0.12 * u); c.fill(); c.strokeStyle = 'rgba(20,6,6,.6)'; c.lineWidth = T * 0.14; c.stroke(); c.strokeStyle = a === 'breath' ? '#FFFFFF' : hexA(CORAL_HI, 0.7 + 0.3 * Math.sin(t * 10)); c.lineWidth = T * 0.07; c.stroke();
        if (a === 'breathW') { c.beginPath(); c.moveTo(Xs, Ys); c.arc(Xs, Ys, R * u, A0, A1); c.closePath(); c.fillStyle = hexA(CORAL, 0.22); c.fill();
          const mx = Xs + Math.cos(V.lockA) * R * 0.6, my = Ys + Math.sin(V.lockA) * R * 0.6; c.font = `900 ${Math.round(T * 0.55)}px ${typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(30,6,6,.8)'; const s = (BREATH.wind - V.t).toFixed(1); c.strokeText(s, mx, my); c.fillStyle = '#FFFFFF'; c.fillText(s, mx, my);
          c.strokeStyle = '#FFFFFF'; c.lineWidth = T * 0.06; for (let i = 0; i < 3; i++) { const rr = R * (0.3 + i * 0.12); c.beginPath(); c.arc(Xs, Ys, rr, V.lockA - 0.12, V.lockA + 0.12); c.stroke(); } }
        c.restore(); L.q(Q => { Q.glow(Xs + Math.cos(V.lockA) * R * 0.5, Ys + Math.sin(V.lockA) * R * 0.5, R * 0.55, CORAL, a === 'breath' ? 0.4 : 0.15 * u); }); }
      if (a === 'sweepW' || a === 'sweep') { const u = a === 'sweepW' ? cl(V.t / SWEEP.wind) : 1, R0 = SWEEP.r0 * T, R1 = SWEEP.r1 * T, g0 = V.hd + V.gapA - SWEEP.gap / 2, g1 = V.hd + V.gapA + SWEEP.gap / 2;
        const seg = (a0, a1, fill, edge) => { if (a1 <= a0) return; c.beginPath(); c.arc(Xs, Ys, R1, a0, a1); c.arc(Xs, Ys, R0, a1, a0, true); c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = 'rgba(20,10,4,.6)'; c.lineWidth = T * 0.12; c.stroke(); c.strokeStyle = edge; c.lineWidth = T * 0.06; c.stroke(); };
        c.save(); const fA = hexA('#FFB347', a === 'sweep' ? 0.32 : 0.12 + 0.14 * u), eA = a === 'sweep' ? '#FFFFFF' : hexA('#FFE0A0', 0.7 + 0.3 * Math.sin(t * 10));
        seg(V.hd + SWEEP.from, g0, fA, eA); seg(g1, V.hd + SWEEP.to, fA, eA);
        // the announced safe opening: a green gap with a SAFE mark
        c.beginPath(); c.arc(Xs, Ys, R1, g0, g1); c.arc(Xs, Ys, R0, g1, g0, true); c.closePath(); c.fillStyle = 'rgba(120,255,190,.18)'; c.fill(); c.strokeStyle = '#9FFFC8'; c.lineWidth = T * 0.07; c.setLineDash([T * 0.25, T * 0.15]); c.stroke(); c.setLineDash([]);
        const ga = V.hd + V.gapA, gx = Xs + Math.cos(ga) * (R0 + R1) / 2, gy = Ys + Math.sin(ga) * (R0 + R1) / 2, fnt = typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'; c.font = `900 ${Math.round(T * 0.32)}px ${fnt}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,30,20,.8)'; c.strokeText('SAFE', gx, gy); c.fillStyle = '#CFFFE4'; c.fillText('SAFE', gx, gy);
        if (a === 'sweepW') { const s = (SWEEP.wind - V.t).toFixed(1), fx = Xs + Math.cos(V.hd + 0.9 * Math.sign(-V.gapA || 1)) * (R0 + R1) / 2, fy = Ys + Math.sin(V.hd + 0.9 * Math.sign(-V.gapA || 1)) * (R0 + R1) / 2; c.font = `900 ${Math.round(T * 0.5)}px ${fnt}`; c.lineWidth = 4; c.strokeStyle = 'rgba(30,14,4,.8)'; c.strokeText(s, fx, fy); c.fillStyle = '#FFFFFF'; c.fillText(s, fx, fy); }
        else { const sa = V.hd + V.swing; c.strokeStyle = '#FFFFFF'; c.lineWidth = T * 0.16; c.beginPath(); c.moveTo(Xs + Math.cos(sa) * R0, Ys + Math.sin(sa) * R0); c.lineTo(Xs + Math.cos(sa) * R1, Ys + Math.sin(sa) * R1); c.stroke(); }
        c.restore(); } }
    /* the brine jet over everything (GPU: a coral-lit stream of water and spray; 2D: soft sprites) */
    function late(c, L) { if (V.gone || m.dead || V.act !== 'breath') return; const T = X.Tz(), mo = MODEL.anchor('mouth'); const x0 = mo ? X.sx(mo.x) : X.sx(m.x), y0 = mo ? X.sy(mo.y) - mo.z * ZK * T : X.sy(m.y) - T; const u = cl(V.jetT / 0.25) * (1 - cl((V.jetT - BREATH.jet + 0.2) / 0.2)), R = BREATH.len * T * (0.4 + 0.6 * cl(V.jetT / 0.3));
      for (const da of [-0.32, -0.16, 0, 0.16, 0.32]) { const a = V.lockA + da, x1 = x0 + Math.cos(a) * R, y1 = y0 + Math.sin(a) * R * GY + T * 0.6; L.q(Q => { Q.wstream(x0, y0, x1, y1, T * (0.35 + Math.abs(da) * 0.4), BRINE, 0.55 * u, da * 9 + 1, 6, 0.6, 0.9); Q.spray(x1, y1, T * 0.9, '#E8FFFC', 0.45 * u, da * 7, 1, 0.6); }, c2 => { c2.globalCompositeOperation = 'lighter'; c2.globalAlpha = 0.4 * u; c2.strokeStyle = BRINE; c2.lineWidth = T * 0.4; c2.lineCap = 'round'; c2.beginPath(); c2.moveTo(x0, y0); c2.lineTo(x1, y1); c2.stroke(); }); }
      L.q(Q => Q.glow(x0, y0, T * 1.1, CORAL, 0.6 * u)); }
    function tick(dt) { obj.x = m.x; obj.y = m.y + 0.31; if (m.dead && !V.gone) { if (!V.died) { V.died = true; V.act = 'down'; X.banner('VARKUL FALLS', 'The chain goes slack; the coral cage flickers', CORAL, 2.4, true); } V.dead = Math.min(1, V.dead + dt / 1.6); if (V.dead >= 1) V.gone = true; } }
    function remove() { if (!m.dead) { m.dead = true; m.hp = 0; } V.gone = true; }
    return { m, V, tick, ground, late, remove, obj };
  }
  return { spawn, MODEL, ROSTER, BREATH, SWEEP };
})();
try { self.BELFRY_VARKUL = BELFRY_VARKUL; } catch (e) {}
