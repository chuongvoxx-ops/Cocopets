/* ---------- Rift 0, the first boss: FIRE FLAN (worker F) ----------
   A large, heavy jelly: translucent amber-red gel with black ash trapped in it, bubbles rising through it and a molten
   core that moves about inside. It fights in a circular basalt pit with three frost crystals in protective wells round
   its rim; each well has a marked cooling zone in front of it and an interaction plate beside it.
   The lesson (the spec's "lure, chill, defend, punish"):
     - Molten, the flan shrugs off about 80% of every blow ("Molten armour", muted hits).
     - Lead it into a marked cooling zone (it hunts the pet: a lure icon marks the pet), stand still on that well's plate
       (0.75 s) and the crystal opens a cold field for 12 s that slows the flan and chills it over 3 s.
     - Chilled through, it turns pale, frosted and cracked (its core plain to see through the shell): BRITTLE for up to 8 s,
       with no reduction at all (x1.25 in its last phase). Out of the cold (it leaves the field, the field ends or the
       crystal breaks) it keeps that state for 2 s more, then its armour returns.
     - Defend the crystal meanwhile: Crystal Breaker (a long wind-up, one heavy pseudopod stretched toward the crystal with
       a glowing interrupt point on it: three ordinary blows stop it) and, later, the Cinderlings chip it. A crystal takes
       three smashes and survives (100 integrity, 30 a smash); broken, it regrows in 10 s; a field ends with an 8 s
       recharge, one field at a time.
   Phase 1 Molten Mantle (100-70%): Jelly Slam, Magma Spit, Crystal Breaker (a generous delay before the first).
   Phase 2 Boiling Brood (70-35%): bubbling lobes; it sheds Cinderlings (two alive at most, they go for the active crystal
     and die quickly), and gains a slow, broad Body Sweep.
   Phase 3 Pressure Heart (35-0%): taller, clearer, its core blazing, steam venting from its fractures; Pressure Burst (an
     expanding ring with one broad safe gap) and Crystal Rush (a straight charge at the active crystal, its path marked
     early, its wind-up interruptible; it ends in the cooling zone).
   It dies collapsing into harmless glowing jelly and cooling obsidian fragments; the crystals are restored.
   The creature is a real 3D model drawn live on the GPU with GLM (20k5uz; its materials are ids 80..84 in GLM's shader):
   a deformable gel shell rebuilt each frame (wobble, squash, lobes, pseudopods, the collapse), the core, ash and bubbles
   inside it, obsidian shards; the frost crystals are GLM meshes too. Without WebGL (or on a software rasteriser) a 2D
   picture of the same pose is drawn. The arena maker is CAL.bossMake.calflan (also FIEND_DEFS.calflan.bossMake). */
const CALFLAN = (() => {
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, smooth = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k);
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const turnTo = (a, b, dt, w) => a + clamp(angTo(a, b), -w * dt, w * dt);
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`; };
  const glowAt = (c, x, y, r, col, a) => { if (!(r > 0) || !(a > 0.004)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  // the palette: the game's red-orange for every hostile warning, white-blue for the frost
  const WARN = '#FF5A2E', WARN_HI = '#FFB08A', LAVA = '#FF7A1E', LAVA_HI = '#FFD27A', AMBER = '#FF9A2E', EMBER = '#FF5A14';
  const FROST = '#9FD8FF', FROST_HI = '#EAF8FF', FROST_D = '#3E78AE', FROST_INK = '#0E2236', SAFE = '#8FFFD2';

  /* ================= the arena's geometry (tiles, about the arena's centre) ================= */
  const AR = 13.5, WELL_D = 12.0, ZONE_D = 8.0, ZONE_R = 2.9, PLATE_D = 10.2, PLATE_DA = 0.27;
  const WELL_A = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6];
  /* the tuning for a level-1 starter (the spec's ~2 minutes with the mechanics): the whole fight's health and the size of
     one plain blow, set by the stage whatever the rift's own scaling (Rf.ease, Rf.scale) does to its floor */
  const TUNE = { hp: 1400, dmg: 15 };
  const FIELD_T = 12, RECHARGE_T = 8, REGROW_T = 10, GRACE_T = 2, CHILL_T = 3, BRITTLE_T = 8, INTEG = 100, SMASH = 30, CHIP = 5;
  const wellGeo = (C, i) => { const a = WELL_A[i], c = Math.cos(a), s = Math.sin(a), pa = a + PLATE_DA;
    return { i, a, x: C.x + c * WELL_D, y: C.y + s * WELL_D, zx: C.x + c * ZONE_D, zy: C.y + s * ZONE_D, zr: ZONE_R, px: C.x + Math.cos(pa) * PLATE_D, py: C.y + Math.sin(pa) * PLATE_D }; };

  /* ================= the model (GLM) ================= */
  const MODEL = (() => {
    const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;
    const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k], vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const vnrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return { x: [c, s, 0], y: [-s, c, 0], z: [0, 0, 1] }; };
    const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
    const mm = (A, B) => ({ x: mv(A, B.x), y: mv(A, B.y), z: mv(A, B.z) });
    const rotAxis = (n, a) => { n = vnrm(n); const c = Math.cos(a), s = Math.sin(a), t = 1 - c, [x, y, z] = n; return { x: [t * x * x + c, t * x * y + s * z, t * x * z - s * y], y: [t * x * y - s * z, t * y * y + c, t * y * z + s * x], z: [t * x * z + s * y, t * y * z - s * x, t * z * z + c] }; };
    const CW = [0, VY, VZ], PXW = [1, 0, 0], PYW = [0, GY, -ZK];
    const LW = vnrm([-0.5, 0.3, 0.82]), SBW = vnrm([-0.2, -0.38, 0.9]), RIMW = vnrm([0.55, -0.72, 0.42]);
    const RIMC = [1.25, 0.62, 0.32], AMBC = [1.0, 0.92, 0.9], RIMF = [0.6, 0.85, 1.35];
    /* ---- the gel: a sphere grid (NU round, NV pole to pole) rewritten in place every frame ---- */
    const NU = 44, NV = 30;
    function mkGel() {
      const nv = (NU + 1) * (NV + 1), pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), att = new Float32Array(nv * 3), idx = new Uint16Array(NU * NV * 6);
      const ST = new Float32Array(NV + 1), CT = new Float32Array(NV + 1), CP = new Float32Array(NU + 1), SP = new Float32Array(NU + 1);
      for (let j = 0; j <= NV; j++) { const th = j / NV * Math.PI; ST[j] = Math.sin(th); CT[j] = Math.cos(th); }
      for (let i = 0; i <= NU; i++) { const ph = i / NU * TAU; CP[i] = Math.cos(ph); SP[i] = Math.sin(ph); }
      for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const k = (j * (NU + 1) + i) * 3; att[k] = 80; att[k + 1] = 0; att[k + 2] = 1 - j / NV; }
      let q = 0; for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = d; idx[q++] = a; idx[q++] = d; idx[q++] = b; }
      return { pos, nrm, att, idx, nv, ntri: NU * NV * 2, gl: null, ST, CT, CP, SP };
    }
    // the lobes of the boiling phase: fixed directions round the body (angle round, angle down from the top)
    const LOBES = [[0.4, 1.15], [1.75, 1.3], [3.0, 1.1], [4.2, 1.35], [5.4, 1.2]];
    /* the shape: everything the pose asks of the gel, in the body's frame (x forward, y left, z up; the origin on the
       floor under its middle). Writes the positions, then the normals from the grid */
    function deform(G, P) {
      const pos = G.pos, nrm = G.nrm, { ST, CT, CP, SP } = G, die = cl(P.die || 0), tall = cl(P.tall || 0);
      const H = (P.H || 1.85) * (1 + 0.26 * tall) * (1 - die) + 0.24 * die, Rw = (P.Rw || 1.62) * (1 - 0.08 * tall) * (1 - die) + 1.75 * die, zc = 0.56 * (1 - die) + 0.08 * die;
      const E = P.wob || 0, wt = P.wt || 0, a2 = 0.02 + 0.07 * E, a3 = 0.013 + 0.05 * E, rip = 0.045 * E, lobes = P.lobes || 0, lt = P.lobeT || 0, sx = P.sx || 1, sz = P.sz || 1, lean = P.lean || 0, side = P.side || 0;
      const pods = (P.pods || []).filter(p => p && p.L > 0.01).map(p => ({ L: p.L, w2: p.w * p.w, D: [Math.cos(p.el) * Math.cos(p.a), Math.cos(p.el) * Math.sin(p.a), Math.sin(p.el)], z0: zc + 0.25 }));
      const LD = LOBES.map(([ph, th]) => [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)]), LA = LOBES.map((_, k) => lobes * (0.15 + 0.09 * Math.sin(lt * (2.1 + k * 0.37) + k * 1.9)));
      const shv = (P.shiver || 0) * 0.025;
      let zmax = 0;
      for (let j = 0; j <= NV; j++) {
        // (a heavy drop: full shoulders and a softly flattened crown, the lower body sagging out over a flat foot)
        const st = ST[j], ct = CT[j], th = j / NV * Math.PI, bump = Math.exp(-((th - 2.0) * (th - 2.0)) / 0.22);
        const r0 = Rw * (ct >= 0 ? Math.pow(st, 0.82) : st) * (1 + 0.11 * bump), z0 = ct >= 0 ? zc + Math.pow(ct, 1.25) * (H - zc) : zc * (1 + ct);
        for (let i = 0; i <= NU; i++) {
          const k = (j * (NU + 1) + i) * 3, cp = CP[i], sp = SP[i], ph = i / NU * TAU;
          let dr = a2 * Math.sin(2 * ph + wt * 7.9 + 0.4) * st + a3 * Math.sin(3 * ph - wt * 12.3 + 1.1) * st * st + rip * Math.sin(5 * th - wt * 11) * st;
          if (lobes > 0.01) { const ux = st * cp, uy = st * sp; for (let q = 0; q < 5; q++) { const D = LD[q], ca = ux * D[0] + uy * D[1] + ct * D[2]; dr += LA[q] * Math.exp((ca - 1) / 0.17); } }
          if (shv) dr += shv * Math.sin(ph * 7 + wt * 60 + j);
          if (die > 0.02) dr += die * (0.09 * Math.sin(3 * ph + 1.3) + 0.06 * Math.sin(5 * ph + 0.4) + 0.04 * Math.sin(8 * ph + 2.2)) * st;
          let x = r0 * cp, y = r0 * sp, z = z0;
          x += x * dr; y += y * dr; z += (z - zc) * dr;
          for (const p of pods) { let ux = x, uy = y, uz = z - p.z0; const l = Math.hypot(ux, uy, uz) || 1; const ca = (ux * p.D[0] + uy * p.D[1] + uz * p.D[2]) / l, g = Math.exp((ca - 1) / p.w2); if (g > 0.002) { x += p.D[0] * p.L * g; y += p.D[1] * p.L * g; z += p.D[2] * p.L * g; } }
          if (z < 0) z = 0;
          const hk = z / H; x += lean * hk * hk; y += side * hk * hk;
          x *= sx; y *= sx; z *= sz; if (z > zmax) zmax = z;
          pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
        }
      }
      // normals from the grid (round the seam; the poles from their first ring)
      const at = (i, j) => (j * (NU + 1) + ((i + NU) % NU)) * 3;
      for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
        const k = (j * (NU + 1) + i) * 3; let nx, ny, nz;
        if (j === 0 || j === NV) { nx = 0; ny = 0; nz = j === 0 ? 1 : -1; }
        else { const a = at(i + 1, j), b = at(i - 1, j), c = at(i, j + 1), d = at(i, j - 1); const ux = pos[a] - pos[b], uy = pos[a + 1] - pos[b + 1], uz = pos[a + 2] - pos[b + 2], vx = pos[c] - pos[d], vy = pos[c + 1] - pos[d + 1], vz = pos[c + 2] - pos[d + 2];
          nx = vy * uz - vz * uy; ny = vz * ux - vx * uz; nz = vx * uy - vy * ux; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; }
        nrm[k] = nx; nrm[k + 1] = ny; nrm[k + 2] = nz;
      }
      G.H = H; G.Rw = Rw; G.zc = zc; G.zmax = zmax;
    }
    /* the body's warp for what floats inside it (the same lean and squash) */
    const warp = (G, P, p) => { const hk = p[2] / (G.H || 2); return [(p[0] + (P.lean || 0) * hk * hk) * (P.sx || 1), (p[1] + (P.side || 0) * hk * hk) * (P.sx || 1), p[2] * (P.sz || 1)]; };
    /* ---- the rigid meshes, built once ---- */
    let MESH = null;
    function build() {
      const q = lowFx() ? 0.6 : 1, out = {};
      out.gel = mkGel();
      { const B = GLM.builder(q); B.sph([0, 0, 0], 1, 81, 22); const c = B.done(), p = c.pos, nr = c.nrm;   // (a lumpy molten blob, not a ball)
        for (let i = 0; i < p.length; i += 3) { const x = p[i], y = p[i + 1], z = p[i + 2], k = 1 + 0.16 * Math.sin(x * 3.1 + y * 1.7) * Math.cos(z * 2.6 - x) + 0.08 * Math.sin(y * 5.3 + z * 4.1); p[i] = x * k; p[i + 1] = y * k * 0.92; p[i + 2] = z * k * 0.86; }
        for (let i = 0; i < nr.length; i += 3) { const l = Math.hypot(p[i], p[i + 1] / 0.85, p[i + 2] / 0.74) || 1; nr[i] = p[i] / l; nr[i + 1] = p[i + 1] / 0.85 / l; nr[i + 2] = p[i + 2] / 0.74 / l; }
        out.core = c; }
      out.bubble = GLM.builder(1).sph([0, 0, 0], 1, 83, 10).done();
      // ash: flat charcoal flakes scattered through a unit ball (a few still glowing at the edge)
      { const B = GLM.builder(1), R = mulberry32(911); for (let n = 0; n < 46; n++) { let p; do { p = [R() * 2 - 1, R() * 2 - 1, R() * 2 - 1]; } while (Math.hypot(p[0], p[1], p[2]) > 1); const s = 0.035 + R() * 0.055, a = R() * TAU, b = R() * TAU, u = [Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)], v = vnrm([u[1] * 0.3 - u[2], u[2] - u[0] * 0.3, u[0] - u[1]]), w = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
          const pts = []; const m5 = 5 + Math.floor(R() * 2); for (let k = 0; k < m5; k++) { const t = k / m5 * TAU, rr = s * (0.6 + R() * 0.6); pts.push(vadd(p, vadd(vmul(v, Math.cos(t) * rr), vmul(w, Math.sin(t) * rr * 0.7)))); } B.facet(pts, 82); }
        out.ash = B.done(); }
      // an obsidian shard: a blunt, broken chunk of black glass
      { const B = GLM.builder(1); B.crystal([-0.25, 0, 0.02], [0.42, 0.04, 0.14], 0.24, 84, { n: 5, seed: 3, belly: 0.45, base: 0.9, thin: 0.75, jit: 0.3 }); B.crystal([0.0, 0.06, 0.02], [-0.3, 0.26, 0.2], 0.17, 84, { n: 5, seed: 7, belly: 0.5, base: 0.9, thin: 0.7, jit: 0.35 }); out.shard = B.done(); }
      // a frost crystal cluster (84.3): a tall central blade and a ring of smaller ones leaning out; its broken stump
      { const B = GLM.builder(1), R = mulberry32(2207), M = 84.3; B.crystal([0, 0, -0.05], [0.04, -0.03, 2.25], 0.36, M, { n: 6, seed: 1, belly: 0.25, base: 0.75, jit: 0.12 });
        for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + R() * 0.4, lean = 0.42 + R() * 0.3, h = 0.85 + R() * 0.75, r = 0.16 + R() * 0.1, bx = Math.cos(a) * 0.22, by = Math.sin(a) * 0.22; B.crystal([bx, by, -0.05], [bx + Math.cos(a) * h * Math.sin(lean), by + Math.sin(a) * h * Math.sin(lean), h * Math.cos(lean)], r, M, { n: 5, seed: k + 3, belly: 0.3, base: 0.7 }); }
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.5, d = 0.5 + R() * 0.2, h = 0.3 + R() * 0.3; B.crystal([Math.cos(a) * d, Math.sin(a) * d, -0.05], [Math.cos(a) * (d + 0.25), Math.sin(a) * (d + 0.25), h], 0.09 + R() * 0.05, M, { n: 4, seed: k + 20 }); }
        out.frost = B.done(); }
      { const B = GLM.builder(1), R = mulberry32(77), M = 84.3; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + R(), d = 0.12 + R() * 0.25, h = 0.25 + R() * 0.35; B.crystal([Math.cos(a) * d, Math.sin(a) * d, -0.05], [Math.cos(a) * (d + 0.15) + (R() - 0.5) * 0.2, Math.sin(a) * (d + 0.15), h], 0.12 + R() * 0.08, M, { n: 5, seed: k + 40, belly: 0.6, base: 0.95, jit: 0.4 }); }
        out.stump = B.done(); }
      return out;
    }
    let NOGL = false, GLFAIL = 0, GLRETRY = 0, GLLAST = 0, GLMS = 0, GLN = 0;
    const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
    const forced = () => typeof window !== 'undefined' && (window.__CALFLAN_GL || window.__CAL_GL);
    const glOn = () => { if (NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !forced()) return false;
      if (!MESH) { try { MESH = build(); } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Fire Flan: meshes', e); return false; } } return true; };
    /* one view: the body frame (heading a) to the screen */
    function view(x, y, z, a, o) { const T = o.T, k = T * (o.scale || 1), Rh = rotZ(a), X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T;
      return { k, Rh, X0, Y0, toS: p => { const w = mv(Rh, p); return [X0 + w[0] * k, Y0 + (w[1] * GY - w[2] * ZK) * k]; } }; }
    const IT = []; let ITN = 0;
    const item = (mesh, R, s, T, o) => { const g = IT[ITN] || (IT[ITN] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); ITN++;
      const sx = Array.isArray(s) ? s : [s, s, s]; for (let i = 0; i < 3; i++) { g.R0[i] = R.x[i] * sx[0]; g.R1[i] = R.y[i] * sx[1]; g.R2[i] = R.z[i] * sx[2]; g.T[i] = T[i]; }
      g.mesh = mesh; g.alpha = o.alpha == null ? 1 : o.alpha; g.glow = o.glow || 0; g.glow2 = o.glow2 || 0; g.spill = o.spill || 0; g.kind = o.kind || 0; g.wear = o.wear == null ? 1 : o.wear; g.fx = o.fx || 0; return g; };
    const OCC = new Float32Array(48);
    /* render the items into GLM's canvas and lay it over the frame inside the box [x0, y0, x1, y1] (screen) */
    function glPass(c, V, items, box, occ) {
      const [bx0, by0, bx1, by1] = box; if (!(bx1 > bx0 && by1 > by0)) return false;
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !(typeof window !== 'undefined' && window.__CALFLAN_GLHQ), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.45 : 1);
      let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sc = Math.min(1, 1400 / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sc)); H = Math.max(2, Math.ceil(H * sc));
      const bw = bx1 - bx0, bh = by1 - by0, k = V.k;
      for (let i = 0; i < 48; i++) OCC[i] = 0; if (occ) for (let i = 0; i < occ.length; i++) OCC[i] = occ[i];
      const S = { px: PXW, py: PYW, pd: CW, cl: [2 * k / bw, 2 * (V.X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (V.Y0 - by0) / bh], v: CW, lk: LW, ls: SBW, lr: RIMW, up: [0, 0, 1], low: lowFx(), rim: occ ? RIMC : RIMF, amb: AMBC, t: nowMs() / 1000, occ: OCC, nocc: 0 };
      const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
      c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++; return true;
    }
    /* ---- the flan's state kept between frames: its bubbles ---- */
    function inst() { const R = mulberry32(5150), bub = []; for (let i = 0; i < 12; i++) bub.push({ x: 0, y: 0, z: 9, r: 0.05, v: 0, ph: R() * TAU, life: 0 }); return { bub, t: null, R }; }
    /* ---- the pose put together: the gel's shape, the core, the ash, the bubbles, the shards ---- */
    function rig(I, P, G, t) {
      const dt = I.t == null ? 0 : Math.max(0, Math.min(0.1, t - I.t)); I.t = t;
      deform(G, P);
      const die = cl(P.die || 0), tall = cl(P.tall || 0), H = G.H, zc = G.zc, Rw = G.Rw;
      const co = P.core || [0, 0, 0], cz = zc + (H - zc) * (0.3 + 0.08 * tall) * (1 - die);
      const core = warp(G, P, [co[0] * (1 - die), co[1] * (1 - die), Math.max(0.12, cz + co[2] * (1 - die))]), cr = (0.42 + 0.08 * tall) * (1 - 0.55 * die);
      // bubbles: born at the core, rising through the gel, gone at its top (none while it is chilled through)
      const frozen = (P.chill || 0) > 0.6 || die > 0.3;
      for (const b of I.bub) {
        const top = (zc + (H - zc) * Math.sqrt(Math.max(0, 1 - (b.x * b.x + b.y * b.y) / (Rw * Rw * 0.8)))) * 0.92;
        if (b.z > top || b.life <= 0) { if (frozen) { b.life = 0; b.z = 9; continue; } const a = I.R() * TAU, d = I.R() * 0.5 * Rw; b.x = co[0] + Math.cos(a) * d; b.y = co[1] + Math.sin(a) * d; b.z = Math.max(0.15, cz - 0.3 + I.R() * 0.4); b.r = 0.06 + I.R() * 0.11; b.v = 0.35 + I.R() * 0.45 + (tall ? 0.3 : 0); b.life = 1; }
        if (!frozen) { b.z += b.v * dt; b.x += Math.sin(t * 3 + b.ph) * 0.12 * dt; b.y += Math.cos(t * 2.3 + b.ph) * 0.1 * dt; }
      }
      return { core, cr, cz };
    }
    /* draw(c, x, y, z, heading, pose, o): o = { T, sx, sy, t }. The instance (o.I) keeps the bubbles */
    let LAST = null, LASTERR = null;
    function draw(c, x, y, z, a, P, o) {
      const t = o.t != null ? o.t : nowMs() / 1000, I = o.I || (o.I = inst()), al = P.alpha == null ? 1 : P.alpha; if (!(al > 0.01)) return;
      const gl = glOn(), V = view(x, y, z + (P.lift || 0), a, o), G = MESH ? MESH.gel : (draw.G || (draw.G = mkGel()));
      const R = rig(I, P, G, t); LAST = { V, G, R, P };
      if (o.rigOnly) return;   // (advance the bubbles only)
      let ok = false;
      if (gl) { try { ok = glFlan(c, V, P, R, I, al, t); } catch (e) { glFail(); ok = false; LASTERR = e; } }
      if (!ok) drawFallback(c, V, P, R, I, al);
    }
    function glFlan(c, V, P, R, I, al, t) {
      const G = MESH.gel, Rh = V.Rh, pos = G.pos, die = cl(P.die || 0), heat = P.heat == null ? 1 : P.heat;
      ITN = 0; const items = [];
      // the box: every vertex of the shell, seen
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const k = V.k;
      for (let i = 0; i < pos.length; i += 3) { const wx = Rh.x[0] * pos[i] + Rh.y[0] * pos[i + 1], wy = Rh.x[1] * pos[i] + Rh.y[1] * pos[i + 1], wz = pos[i + 2], sx = V.X0 + wx * k, sy = V.Y0 + (wy * GY - wz * ZK) * k; if (sx < x0) x0 = sx; if (sx > x1) x1 = sx; if (sy < y0) y0 = sy; if (sy > y1) y1 = sy; }
      // the shards of the death lie round it
      const sh = shardList(P, G); for (const s of sh) { const q = V.toS(s.p); x0 = Math.min(x0, q[0] - 0.6 * k); x1 = Math.max(x1, q[0] + 0.6 * k); y0 = Math.min(y0, q[1] - 0.6 * k); y1 = Math.max(y1, q[1] + 0.6 * k); }
      const pad = 3; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
      GLM.touchGeo(G);
      const Rc = mv(Rh, R.core), common = { glow: heat, glow2: P.chill || 0, spill: P.crack || 0, kind: die > 0.5 ? 4 : (P.phase || 1), wear: G.Rw * 0.92 * (P.sx || 1), fx: P.fx || 0 };
      // opaque first: the core, the ash, the shards
      if (R.cr > 0.02) { const pl = 1 + 0.06 * Math.sin(t * 3.1); items.push(item(MESH.core, mm(Rh, mm(rotAxis([0.3, 0.5, 1], t * 0.55), rotAxis([1, 0, 0.2], Math.sin(t * 0.7) * 0.6))), [R.cr * pl * 1.08, R.cr * pl, R.cr * pl * (1 - 0.06 * Math.sin(t * 2.2))], Rc, { alpha: 1, glow: heat * (1 - 0.6 * die) })); }
      const ashR = mm(Rh, rotAxis([0.2, 0.1, 1], t * 0.13)), as = [G.Rw * 0.62 * (P.sx || 1), G.Rw * 0.62 * (P.sx || 1), (G.H - G.zc) * 0.52 * (P.sz || 1)];
      if (die < 0.9) items.push(item(MESH.ash, ashR, as, mv(Rh, warp(G, P, [0, 0, G.zc + (G.H - G.zc) * 0.38])), { alpha: 1, glow: heat }));
      for (const s of sh) items.push(item(MESH.shard, mm(Rh, s.R), s.s, mv(Rh, s.p), { alpha: 1, glow: s.glow }));
      // then the bubbles, then the shell over all of it
      if (die < 0.5) for (const b of I.bub) if (b.life > 0 && b.z < 8) items.push(item(MESH.bubble, Rh, b.r, mv(Rh, warp(G, P, [b.x, b.y, b.z])), { alpha: 0.9, glow: heat }));
      items.push(Object.assign(item(G, Rh, 1, [0, 0, 0], common), { alpha: al > 0.995 ? 1 : al }));
      const occ = [Rc[0], Rc[1], Rc[2], Math.max(0.05, R.cr)];
      return glPass(c, V, items, [x0, y0, x1, y1], occ);
    }
    // the obsidian left when it dies: shards thrown out over the first second, then lying still, cooling
    const SHARDS = (() => { const R = mulberry32(4321), out = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + R() * 0.5, d = 1.5 + R() * 1.3; out.push({ a, d, rz: R() * TAU, tilt: (R() - 0.5) * 0.6, s: 0.7 + R() * 0.7, dl: R() * 0.25 }); } return out; })();
    function shardList(P, G) {
      const die = P.die || 0; if (die <= 0.02) return [];
      const u = smooth((die - 0.05) / 0.5), cool = cl(P.cool || 0), out = [];
      for (const s of SHARDS) { const v = smooth((u - s.dl) / (1 - s.dl)); if (v <= 0) continue; const d = s.d * v, hop = Math.sin(Math.PI * v) * 0.9;
        out.push({ p: [Math.cos(s.a) * d, Math.sin(s.a) * d, 0.04 + hop], R: mm(rotZ(s.rz + v * 3), rotAxis([1, 0, 0], s.tilt)), s: s.s * (0.4 + 0.6 * v), glow: 1 - cool }); }
      return out;
    }
    /* the 2D picture (no WebGL): the shell's outline from its own vertices, filled with the gel's light */
    function drawFallback(c, V, P, R, I, al) {
      const G = MESH ? MESH.gel : draw.G, pos = G.pos, Rh = V.Rh, k = V.k, cs = V.toS(R.core), NB = 40, best = new Array(NB).fill(null);
      for (let i = 0; i < pos.length; i += 3) { const p = [pos[i], pos[i + 1], pos[i + 2]], q = V.toS(p), dx = q[0] - cs[0], dy = q[1] - cs[1], d = dx * dx + dy * dy, b = Math.floor(((Math.atan2(dy, dx) / TAU) + 1) % 1 * NB); if (!best[b] || d > best[b][2]) best[b] = [q[0], q[1], d]; }
      const pts = best.filter(Boolean); if (pts.length < 6) return;
      const chill = P.chill || 0, die = P.die || 0, heat = P.heat == null ? 1 : P.heat, rr = G.Rw * k;
      c.save(); c.globalAlpha = al;
      const path = () => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); };
      const gr = c.createRadialGradient(cs[0], cs[1], rr * 0.1, cs[0], cs[1] - rr * 0.1, rr * 1.5); gr.addColorStop(0, rgba('#FFB347', 0.92)); gr.addColorStop(0.35, rgba('#E2540E', 0.85)); gr.addColorStop(0.75, rgba('#8A1A06', 0.82)); gr.addColorStop(1, rgba('#3A0802', 0.85));
      path(); c.fillStyle = gr; c.fill();
      c.save(); path(); c.clip();
      const R2 = mulberry32(17); for (let i = 0; i < 18; i++) { const x = cs[0] + (R2() - 0.5) * rr * 1.8, y = cs[1] + (R2() - 0.5) * rr * 1.4; c.fillStyle = 'rgba(20,10,8,.55)'; c.beginPath(); c.ellipse(x, y, rr * 0.04, rr * 0.025, R2() * 3, 0, TAU); c.fill(); }
      for (const b of I.bub) if (b.life > 0 && b.z < 8) { const q = V.toS(b.p || [b.x, b.y, b.z]); c.strokeStyle = 'rgba(255,220,160,.6)'; c.lineWidth = 1; c.beginPath(); c.arc(q[0], q[1], Math.max(1, b.r * k), 0, TAU); c.stroke(); }
      if (chill > 0.02) { c.fillStyle = rgba('#D8ECFF', 0.55 * chill); c.fillRect(cs[0] - rr * 3, cs[1] - rr * 3, rr * 6, rr * 6); c.strokeStyle = rgba('#FFB060', 0.8 * chill); c.lineWidth = Math.max(1, k * 0.03); const R3 = mulberry32(99); for (let i = 0; i < 9; i++) { let x = cs[0] + (R3() - 0.5) * rr * 1.6, y = cs[1] + (R3() - 0.5) * rr * 1.2; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (R3() - 0.5) * rr * 0.5; y += (R3() - 0.5) * rr * 0.5; c.lineTo(x, y); } c.stroke(); } }
      c.restore();
      glowAt(c, cs[0], cs[1], rr * 0.55 * (1 - 0.5 * die), '#FFD27A', 0.55 * heat);
      c.fillStyle = 'rgba(255,240,220,.35)'; c.beginPath(); c.ellipse(cs[0] - rr * 0.35, cs[1] - rr * 0.75, rr * 0.28, rr * 0.12, -0.4, 0, TAU); c.fill();
      for (const s of shardList(P, G)) { const q = V.toS(s.p); c.fillStyle = '#0B0A0E'; c.beginPath(); c.moveTo(q[0] - s.s * k * 0.3, q[1]); c.lineTo(q[0], q[1] - s.s * k * 0.25); c.lineTo(q[0] + s.s * k * 0.35, q[1] + 2); c.closePath(); c.fill(); c.strokeStyle = rgba(LAVA, 0.8 * s.glow); c.lineWidth = 1.2; c.stroke(); }
      c.restore();
    }
    /* the soft shadow on the ground and the warm light the core throws round it */
    function drawShadow(c, x, y, P, o) {
      const T = o.T, X = o.sx(x), Y = o.sy(y), die = P.die || 0, Rw = (P.Rw || 1.55) * (1 + 0.6 * die) * (P.sx || 1), lift = P.lift || 0;
      c.save(); c.globalAlpha = 0.5 / (1 + lift * 0.6); blitSized(c, shadeSprite('#05030A'), X - Rw * T * 1.25, Y - Rw * T * 0.5, Rw * T * 2.5, Rw * T * 1.0); c.restore();
      const heat = P.heat == null ? 1 : P.heat, chill = P.chill || 0;
      glowAt(c, X, Y + T * 0.1, Rw * T * 1.9, '#FF6A1E', (0.32 + 0.12 * Math.sin((o.t || 0) * 2.3)) * heat * (1 - 0.6 * chill) * (1 - 0.5 * die));
      if (chill > 0.05) glowAt(c, X, Y + T * 0.1, Rw * T * 1.6, '#9FD8FF', 0.25 * chill);
    }
    /* a frost crystal cluster (GLM; a 2D picture without it). Pc: { grow 0..1, glow 0..1, dmg 0..1, broken, t } */
    const CI = [], CCACHE = {};
    function drawCrystal(c, x, y, Pc, o) {
      const V = view(x, y, 0, Pc.a || 0, o), k = V.k;
      if (glOn()) { try {
        // (a crystal changes seldom: its picture is kept and made again only when its state, the zoom or the screen's
        // sharpness changes, so the three cost one copy each a frame)
        const m = c.getTransform ? c.getTransform() : null, dev = m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1, g = cl(Pc.grow == null ? 1 : Pc.grow);
        const key = `${Math.round(k * 8)}|${dev.toFixed(2)}|${Pc.broken ? 1 : 0}|${Math.round(g * 24)}|${Math.round((Pc.glow || 0) * 12)}|${Math.round((Pc.dmg || 0) * 10)}|${(Pc.a || 0).toFixed(2)}`;
        const id = Pc.id == null ? 'x' : Pc.id; let E = CCACHE[id]; if (!E) E = CCACHE[id] = { cv: document.createElement('canvas'), key: null };
        const bx = 1.5 * k, byT = 2.6 * k, byB = 0.9 * k;
        if (E.key !== key) {
          ITN = 0; CI.length = 0; const Rh = V.Rh;
          if (Pc.broken || g < 0.999) CI.push(item(MESH.stump, Rh, 1, [0, 0, 0], { alpha: 1, glow: 0.2, spill: 0.6 }));
          if (g > 0.02) CI.push(item(MESH.frost, Rh, [g * 0.9 + 0.1, g * 0.9 + 0.1, g], [0, 0, 0], { alpha: 1, glow: Pc.glow || 0, spill: Pc.dmg || 0 }));
          const W = Math.ceil(bx * 2 * dev), H = Math.ceil((byT + byB) * dev); E.cv.width = W; E.cv.height = H; const g2 = E.cv.getContext('2d'); g2.setTransform(dev, 0, 0, dev, 0, 0);
          const V2 = { k, Rh: V.Rh, X0: bx, Y0: byT, toS: V.toS };
          if (!glPass(g2, V2, CI, [0, 0, bx * 2, byT + byB], null)) throw new Error('glPass');
          E.key = key; E.k = dev; }
        c.drawImage(E.cv, 0, 0, E.cv.width, E.cv.height, V.X0 - bx, V.Y0 - byT, bx * 2, byT + byB); return; } catch (e) { glFail(); } }
      crystal2D(c, V.X0, V.Y0, k, Pc);
    }
    function crystal2D(c, X, Y, k, Pc) {
      const g = cl(Pc.grow == null ? 1 : Pc.grow), R = mulberry32(31), blades = [[0, 2.2, 0.34], [-0.55, 1.4, 0.2], [0.5, 1.5, 0.22], [-0.95, 0.9, 0.16], [0.9, 1.0, 0.16], [-0.25, 1.0, 0.18], [0.28, 1.1, 0.18]];
      c.save();
      for (const [bx, h0, w0] of blades) { const h = (Pc.broken || g < 0.05 ? 0.3 : h0 * g) * k, w = w0 * k, x = X + bx * k * 0.5, lean = bx * 0.25;
        c.beginPath(); c.moveTo(x - w, Y); c.lineTo(x - w * 0.8 + lean * h * 0.4, Y - h * 0.8); c.lineTo(x + lean * h * 0.5, Y - h); c.lineTo(x + w * 0.8 + lean * h * 0.4, Y - h * 0.8); c.lineTo(x + w, Y); c.closePath();
        const gr = c.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, '#EAF8FF'); gr.addColorStop(0.5, '#A8D6FF'); gr.addColorStop(1, '#4F86B8'); c.fillStyle = gr; c.fill(); c.strokeStyle = 'rgba(14,34,54,.7)'; c.lineWidth = 1; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(x + lean * h * 0.5, Y - h); c.lineTo(x, Y - h * 0.1); c.stroke(); R(); }
      if (Pc.glow > 0) glowAt(c, X, Y - k * 1.0, k * 1.6, '#9FD8FF', 0.5 * Pc.glow);
      c.restore();
    }
    return { draw, drawShadow, drawCrystal, deform, mkGel, glOn, inst, get LAST() { return LAST; }, get stats() { return { ms: +GLMS.toFixed(2), frames: GLN, gl: !!MESH && !NOGL, err: LASTERR ? String(LASTERR && LASTERR.stack || LASTERR).slice(0, 400) : null }; }, set noGL(v) { NOGL = !!v; }, VIEW: { GY, ZK } };
  })();
  // (a soft round shade: the game's own, if it has one)
  function shadeSprite(col) {
    const key = 'calflan-shade-' + col; if (shadeSprite[key]) return shadeSprite[key]; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, rgba(col, 1)); gr.addColorStop(0.5, rgba(col, 0.6)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (shadeSprite[key] = cv); }

  /* ================= the arena: the three wells, their fields, the crystals' integrity ================= */
  let CUR = null;   // (the live arena: set by the stage's maker, found again by the fiend through the game it runs in)
  function makeArena(C, g, o) {
    o = o || {};
    const wells = [0, 1, 2].map(i => Object.assign(wellGeo(C, i), { integ: INTEG, broken: false, regrowT: 0, grow: 1, flash: 0, hit: 0, shake: 0, chime: 0, glow: 0, plate: null, obj: null }));
    const A = { C, g, wells, field: null, cool: 0, fields: 0, firstAt: null, tickT: -1, t: 0, onField: null, onBreak: null, onBreakGone: null, fake: !!o.fake,
      active() { return A.field ? wells[A.field.i] : null; },
      state(w) { return w.broken ? 'broken' : A.field && A.field.i === w.i ? 'active' : A.cool > 0 ? 'recharge' : A.field ? 'busy' : 'ready'; },
      canUse(i) { const w = wells[i]; return !!w && !w.broken && !A.field && A.cool <= 0; },
      activate(i) { if (!A.canUse(i)) return false; const w = wells[i]; A.field = { i, t: 0, dur: FIELD_T }; A.fields++; w.chime = 1; w.flash = 1; if (A.onField) A.onField(w); return true; },
      endField(why) { const F = A.field; if (!F) return; A.field = null; A.cool = RECHARGE_T; A.lastEnd = why || 'time'; if (A.onEnd) A.onEnd(wells[F.i], A.lastEnd); },
      damage(i, amt, src) { const w = wells[i]; if (!w || w.broken) return false; w.integ = Math.max(0, w.integ - amt); w.hit = 1; w.shake = 1; if (w.integ <= 0) { w.broken = true; w.regrowT = REGROW_T; w.grow = 0; if (A.field && A.field.i === i) A.endField('broken'); if (A.onBreak) A.onBreak(w, src); } return true; },
      inZone(x, y, pad) { for (const w of wells) if (Math.hypot(x - w.zx, y - w.zy) < w.zr + (pad || 0)) return w.i; return -1; },
      restore() { A.field = null; A.cool = 0; for (const w of wells) { w.integ = INTEG; w.broken = false; w.regrowT = 0; w.grow = 1; w.flash = 1; } },
      tick(dt) { const gt = A.g ? A.g.t : A.t + dt; if (A.tickT === gt) return; A.tickT = gt; A.t += dt;
        if (A.field) { A.field.t += dt; if (A.field.t >= A.field.dur) A.endField('time'); }
        else if (A.cool > 0) A.cool = Math.max(0, A.cool - dt);
        for (const w of wells) { w.flash = decay(w.flash, dt, 1.2); w.hit = decay(w.hit, dt, 2.5); w.shake = decay(w.shake, dt, 4); w.chime = decay(w.chime, dt, 1.5);
          w.glow = toward(w.glow, A.field && A.field.i === w.i ? 1 : 0, dt, 3);
          if (w.broken) { w.regrowT -= dt; w.grow = cl(1 - w.regrowT / REGROW_T) * 0.85; if (w.regrowT <= 0) { w.broken = false; w.integ = INTEG; w.grow = 1; w.flash = 1; if (A.onRegrow) A.onRegrow(w); } }
          else if (!(A.field && A.field.i === w.i) && w.integ < INTEG) w.integ = Math.min(INTEG, w.integ + dt * 3);
          // (a plate becoming usable again is re-armed: the pet need not step off and back on after waiting out a recharge)
          if (w.plate) { const can = A.canUse(w.i); if (can && !w.could) { w.plate.used = false; w.plate.ch = 0; } w.could = can; w.plate.busy = !can; } } } };
    return A;
  }
  const arenaOf = FX => (CUR && FX.H && CUR.g === FX.H.g ? CUR : null);

  /* ================= 2D art: the snowflake emblem, the plates, the wells, the zones ================= */
  function snowflake(c, x, y, r, col, lw, under) {
    c.save(); c.translate(x, y); c.lineCap = 'round';
    for (const pass of under ? [0, 1] : [1]) { c.strokeStyle = pass ? col : (under === true ? 'rgba(6,14,24,.75)' : under); c.lineWidth = pass ? lw : lw + 2.4;
      c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); c.moveTo(0, 0); c.lineTo(ca * r, sa * r);
        for (const f of [0.45, 0.72]) { const bx = ca * r * f, by = sa * r * f, bl = r * (f < 0.5 ? 0.28 : 0.2); for (const s of [-1, 1]) { const b = a + s * 0.85; c.moveTo(bx, by); c.lineTo(bx + Math.cos(b) * bl, by + Math.sin(b) * bl); } } }
      c.stroke(); }
    c.restore();
  }
  // the interaction plate: a round slab of pale stone, a frost ring and the snowflake; lit when it can be used
  function plateArt(c, A, w, Xs, Ys, T, t) {
    const s = A.state(w), ready = s === 'ready', on = s === 'active', k = ready ? 0.65 + 0.35 * Math.sin(t * 3.2) : on ? 1 : 0.25;
    c.save();
    c.fillStyle = 'rgba(6,4,8,.45)'; c.beginPath(); c.ellipse(Xs + T * 0.05, Ys + T * 0.08, T * 0.92, T * 0.46, 0, 0, TAU); c.fill();
    c.fillStyle = '#3A4350'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.06, T * 0.86, T * 0.42, 0, 0, TAU); c.fill();
    const gr = c.createLinearGradient(0, Ys - T * 0.4, 0, Ys + T * 0.3); gr.addColorStop(0, '#9AA8B8'); gr.addColorStop(1, '#5A6676');
    c.fillStyle = gr; c.beginPath(); c.ellipse(Xs, Ys - T * 0.02, T * 0.84, T * 0.4, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(10,18,28,.8)'; c.lineWidth = Math.max(1.2, T * 0.04); c.stroke();
    c.strokeStyle = rgba(ready || on ? FROST_HI : '#C8D4E0', 0.5 + 0.5 * k); c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.ellipse(Xs, Ys - T * 0.02, T * 0.66, T * 0.31, 0, 0, TAU); c.stroke();
    c.save(); c.translate(Xs, Ys - T * 0.02); c.scale(1, 0.48); snowflake(c, 0, 0, T * 0.5, ready || on ? FROST_HI : '#D8E2EC', Math.max(1.5, T * 0.07), 'rgba(10,22,36,.6)'); c.restore();
    if (ready || on) glowAt(c, Xs, Ys - T * 0.05, T * 1.3, FROST, 0.35 * k);
    c.restore();
  }
  // a well: a basalt rim open toward the arena's middle, frost on its stones, the snowflake on its keystone
  function wellBack(c, A, w, X, Y, T, t) {
    const a = w.a + Math.PI, R = T * 1.45;
    c.save();
    c.fillStyle = 'rgba(4,8,14,.55)'; c.beginPath(); c.ellipse(X, Y, R * 1.05, R * 0.62, 0, 0, TAU); c.fill();
    const gr = c.createRadialGradient(X, Y, 0, X, Y, R); gr.addColorStop(0, rgba('#BFE6FF', 0.28 + 0.4 * w.glow)); gr.addColorStop(1, 'rgba(60,110,160,0)'); c.fillStyle = gr; c.beginPath(); c.ellipse(X, Y, R, R * 0.6, 0, 0, TAU); c.fill();
    // the stones of the back of the rim (those away from the arena's middle)
    stones(c, X, Y, T, a, true);
    c.restore();
  }
  function stones(c, X, Y, T, a, back) {
    const R = T * 1.45, n = 9;
    for (let i = 0; i < n; i++) { const u0 = -0.86 + i / n * 1.72, u1 = u0 + 1.72 / n * 0.92, am = a + Math.PI + (u0 + u1) / 2 * Math.PI, sy = Math.sin(am); if (back ? sy > 0.15 : sy <= 0.15) continue;
      const b0 = a + Math.PI + u0 * Math.PI, b1 = a + Math.PI + u1 * Math.PI, h = T * (back ? 0.75 : 0.55);
      const p = (b, r, z) => [X + Math.cos(b) * r, Y + Math.sin(b) * r * 0.6 - z];
      const q = [p(b0, R, 0), p(b1, R, 0), p(b1, R, h), p(b0, R, h)], top = [p(b0, R, h), p(b1, R, h), p(b1, R * 0.74, h), p(b0, R * 0.74, h)];
      c.beginPath(); q.forEach((v, j) => j ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1])); c.closePath(); c.fillStyle = shadeC('#3B3A44', back ? -0.25 : -0.05 + 0.1 * Math.cos(am)); c.fill(); c.strokeStyle = 'rgba(8,8,12,.85)'; c.lineWidth = Math.max(1, T * 0.035); c.stroke();
      c.beginPath(); top.forEach((v, j) => j ? c.lineTo(v[0], v[1]) : c.moveTo(v[0], v[1])); c.closePath(); c.fillStyle = '#6A7584'; c.fill(); c.stroke();
      // rime along the top
      c.strokeStyle = 'rgba(234,248,255,.75)'; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(top[0][0], top[0][1]); c.lineTo(top[1][0], top[1][1]); c.stroke(); }
  }
  function wellFront(c, A, w, X, Y, T, t) {
    const a = w.a + Math.PI; c.save(); stones(c, X, Y, T, a, false);
    // the keystone's snowflake, at the front lip toward the middle
    const kx = X + Math.cos(a) * T * 1.45, ky = Y + Math.sin(a) * T * 0.87 - T * 0.25; c.fillStyle = '#566170'; c.beginPath(); c.arc(kx, ky, T * 0.34, 0, TAU); c.fill(); c.strokeStyle = 'rgba(8,8,12,.85)'; c.lineWidth = Math.max(1, T * 0.04); c.stroke();
    snowflake(c, kx, ky, T * 0.26, FROST_HI, Math.max(1.2, T * 0.05), 'rgba(10,22,36,.7)'); c.restore();
  }
  function crystalObjDraw(c, FX, A, w, Xs, Ys, T, t) {
    const sh = w.shake > 0 ? Math.sin(t * 60) * w.shake * T * 0.06 : 0;
    wellBack(c, A, w, Xs, Ys, T, t);
    MODEL.drawCrystal(c, w.x + sh / T, w.y, { id: w.i, grow: w.broken ? w.grow : 1, broken: w.broken, glow: Math.max(w.glow, w.flash * 0.6), dmg: 1 - w.integ / INTEG, a: w.a + Math.PI / 2 }, { T, sx: FX ? FX.sx : null, sy: FX ? FX.sy : null, t });
    if (w.hit > 0) glowAt(c, Xs, Ys - T * 1.0, T * 1.6, '#FFFFFF', w.hit * 0.5);
    if (w.glow > 0.02) glowAt(c, Xs, Ys - T * 1.1, T * 2.4, FROST, 0.35 * w.glow);
    wellFront(c, A, w, Xs, Ys, T, t);
  }
  /* the ground layer: each cooling zone (always marked: a frost ring of snowflakes; alive while its field runs) */
  function drawZones(c, FX, A, T, t) {
    for (const w of A.wells) {
      const X = FX.sx(w.zx), Y = FX.sy(w.zy), r = w.zr * T, s = A.state(w), on = s === 'active', fk = on ? 1 - A.field.t / A.field.dur : 0;
      c.save();
      if (on) { const gr = c.createRadialGradient(X, Y, r * 0.1, X, Y, r); gr.addColorStop(0, rgba('#CFEFFF', 0.32)); gr.addColorStop(0.75, rgba('#8CCBFF', 0.22)); gr.addColorStop(1, rgba('#8CCBFF', 0)); c.fillStyle = gr; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill();
        // drifting frost: crystals of rime spinning slowly over the floor
        c.strokeStyle = 'rgba(234,248,255,.45)'; c.lineWidth = Math.max(1, T * 0.04); for (let i = 0; i < (lowFx() ? 4 : 9); i++) { const a = i / 9 * TAU + t * 0.35 * (i % 2 ? 1 : -1), d = r * (0.3 + 0.55 * ((i * 0.37) % 1)); snowflake(c, X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.9, T * 0.18, 'rgba(234,248,255,.55)', Math.max(1, T * 0.03)); }
        // the field's time, a ring that empties
        c.strokeStyle = 'rgba(6,14,24,.6)'; c.lineWidth = Math.max(3, T * 0.16); c.beginPath(); c.arc(X, Y, r + T * 0.12, 0, TAU); c.stroke();
        c.strokeStyle = FROST_HI; c.lineWidth = Math.max(2, T * 0.09); c.beginPath(); c.arc(X, Y, r + T * 0.12, -Math.PI / 2, -Math.PI / 2 + TAU * fk); c.stroke(); }
      // the marking, always: a dashed frost ring and six snowflakes round it
      c.setLineDash([T * 0.42, T * 0.26]); c.lineDashOffset = -t * T * 0.3; c.strokeStyle = rgba(on ? FROST_HI : '#A8D4F2', on ? 0.9 : 0.55); c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.stroke(); c.setLineDash([]);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + w.a; snowflake(c, X + Math.cos(a) * r, Y + Math.sin(a) * r, T * 0.2, rgba(on ? FROST_HI : '#BFE0F8', on ? 1 : 0.7), Math.max(1, T * 0.045), 'rgba(6,14,24,.6)'); }
      c.restore();
    }
  }
  /* the bars over a crystal, only when they matter: its integrity (hurt, or its field running), its regrowth, the recharge */
  function drawCrystalHud(c, FX, A, T, t) {
    for (const w of A.wells) {
      const s = A.state(w), X = FX.sx(w.x), Y = FX.sy(w.y) - T * 3.0, bw = T * 1.7, bh = Math.max(4, T * 0.14);
      const showInt = s === 'active' || (w.integ < INTEG - 0.5 && !w.broken), showRe = w.broken, showCool = !w.broken && s === 'recharge';
      if (!showInt && !showRe && !showCool) continue;
      c.save();
      const bar = (u, col, label) => { c.fillStyle = 'rgba(6,10,16,.7)'; c.fillRect(X - bw / 2 - 2, Y - 2, bw + 4, bh + 4); c.fillStyle = col; c.fillRect(X - bw / 2, Y, bw * cl(u), bh); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(X - bw / 2, Y, bw * cl(u), bh * 0.4);
        if (label) { c.font = `800 ${Math.max(9, Math.round(T * 0.28))}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.fillStyle = '#FFFFFF'; c.strokeText(label, X, Y - T * 0.12); c.fillText(label, X, Y - T * 0.12); } };
      if (showRe) bar(1 - w.regrowT / REGROW_T, '#8FB8D8', `Regrowing ${Math.ceil(w.regrowT)}s`);
      else if (showInt) { const u = w.integ / INTEG; bar(u, u > 0.5 ? FROST_HI : u > 0.25 ? '#FFD27A' : WARN, s === 'active' ? (w.hit > 0.3 ? 'PROTECT THE CRYSTAL' : 'Crystal') : 'Crystal'); }
      if (showCool) { const px = FX.sx(w.px), py = FX.sy(w.py) - T * 1.2, u = 1 - A.cool / RECHARGE_T; c.strokeStyle = 'rgba(6,10,16,.7)'; c.lineWidth = Math.max(4, T * 0.16); c.beginPath(); c.arc(px, py, T * 0.38, 0, TAU); c.stroke(); c.strokeStyle = FROST_HI; c.lineWidth = Math.max(2.5, T * 0.09); c.beginPath(); c.arc(px, py, T * 0.38, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke();
        c.font = `800 ${Math.max(9, Math.round(T * 0.26))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.fillStyle = '#FFFFFF'; const s2 = `${Math.ceil(A.cool)}`; c.strokeText(s2, px, py); c.fillText(s2, px, py); c.textBaseline = 'alphabetic'; }
      c.restore();
    }
  }

  /* ================= the stage's maker: CAL.bossMake.calflan(X, self, H) ================= */
  if (typeof DunWorld !== 'undefined' && DunWorld.PROPS && !DunWorld.PROPS.blank) DunWorld.PROPS.blank = () => {};
  function bossMake(X, self, H) {
    const C = X.M.FC || { x: X.M.MW / 2, y: X.M.MH / 2, R: AR }, A = makeArena(C, X.g);
    CUR = A;
    // the fight's health: the floor's health scale set so that the flan's bars hold TUNE.hp in all (the fiend engine reads
    // it next, when it is made)
    const F = X.F; if (F && F.fiend && F.fiend.id === 'calflan' && !F.calHp && typeof BOSS_HP_MEAN !== 'undefined') { const FD = F.fiend, per = 20 * BOSS_HP_MEAN * F.hpMul * (1 + 0.3 * (F.loop || 0) + 0.5 * (FD.cycle || 0)) / (FD.baseBars || FD.bars), tot = per * FD.bars; if (tot > 0) { F.hpMul *= TUNE.hp / tot; F.calHp = true; } }
    // the wells' stones are solid (carved by the fiend's arena); nothing of the wall art is drawn there
    for (const w of A.wells) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const tx = Math.floor(w.x) + dx, ty = Math.floor(w.y) + dy; if (tx >= 0 && ty >= 0 && tx < X.M.MW && ty < X.M.MH && X.M.G[ty * X.M.MW + tx] === T_SOLID && Math.hypot(tx + 0.5 - w.x, ty + 0.5 - w.y) < 1.6) X.M.props.set(ty * X.M.MW + tx, 'blank'); }
    for (const w of A.wells) {
      w.obj = H.obj({ x: w.x, y: w.y + 0.6, kind: 'calcrystal', r: 0.1, h: 3.2, label: '', draw(c, Xs, Ys, T) { crystalObjDraw(c, X, A, w, X.sx(w.x), X.sy(w.y), T, X.g.t); } });
      w.plate = H.obj({ x: w.px, y: w.py, kind: 'calplate', r: 0.75, h: 1.4, label: () => { const s = A.state(w); return s === 'ready' ? 'Frost crystal: stand still to wake it' : s === 'active' ? 'Cold field running' : s === 'broken' ? 'The crystal is regrowing' : s === 'recharge' ? `Recharging ${Math.ceil(A.cool)}s` : 'Another field is running'; },
        use() { if (A.activate(w.i)) { X.sfx.chime && X.sfx.chime(1046, 0.8); X.after && X.after(0.09, () => X.sfx.chime && X.sfx.chime(1568, 0.6)); } else X.sfx.wrong(); },
        draw(c, Xs, Ys, T) { plateArt(c, A, w, Xs, Ys, T, X.g.t); } });
    }
    const mod = { C, A, wells: A.wells,
      update(dt) { A.tick(dt); },
      // (the zones are painted by the fiend on the ground layer; the bars over everything)
      hint() { const m = X.g.boss; if (!m || m.dead || !X.g.boss.fiend) return null; const fx = FIEND_DEFS.calflan && FIEND_DEFS.calflan.hintFor; return fx ? fx(A, m) : null; },
    };
    return mod;
  }

  /* ================= the fight ================= */
  const def = {
    arenaR: AR, firstAct: 'prowl', artY: 0.62, ambient: 'embers', floorDisc: true, bossMake,
    carve(set, C) { for (let i = 0; i < 3; i++) { const w = wellGeo(C, i); for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const tx = Math.floor(w.x) + dx, ty = Math.floor(w.y) + dy; if (Math.hypot(tx + 0.5 - w.x, ty + 0.5 - w.y) < 1.25) set(tx, ty, T_SOLID); } } },
    start(C) { return { x: C.x + 0.5, y: C.y + AR - 3.2 }; },
    phaseNames: ['Molten Mantle', 'Boiling Brood', 'Pressure Heart'],
    props(C) { const hasCal = typeof CAL !== 'undefined' && CAL.ringProps && typeof DunWorld !== 'undefined' && DunWorld.PROPS;
      // (the caldera's shared ring of props when the core has it, kept clear of the wells)
      if (hasCal) { const list = CAL.ringProps({ x: C.x, y: C.y, R: AR }, { seed: 3301 }).filter(p => !WELL_A.some(w => Math.abs(angTo(w, Math.atan2(p.y - C.y, p.x - C.x))) < 0.24) && DunWorld.PROPS[p.kind]); if (list.length) return list; }
      const out = [], R = mulberry32(3301); for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + (R() - 0.5) * 0.12; if (WELL_A.some(w => Math.abs(angTo(w, a)) < 0.22)) continue; const back = Math.sin(a) < 0.2; out.push({ kind: R() < 0.45 ? 'blackcrystal' : 'column', i, s: back ? 0.9 + R() * 0.35 : 0.55 + R() * 0.2, v: Math.floor(R() * 9), x: C.x + Math.cos(a) * (AR + (back ? 1.5 : 0.9)), y: C.y + Math.sin(a) * (AR + (back ? 1.1 : 0.5)) }); } return out; },
    propKeep: { every: 20, box: p => [-2.2 * p.s, -5.6 * p.s, 2.2 * p.s, 0.8 * p.s] },
    drawProp(c, FX, p, X, Y, T) { if (typeof DunWorld !== 'undefined' && DunWorld.PROPS && DunWorld.PROPS[p.kind] && p.kind !== 'column') { c.translate(X, Y); DunWorld.PROPS[p.kind](c, T * p.s, p.v); return; } if (p.kind === 'column') basaltColumn(c, X, Y, T * p.s, p.v); else blackCrystal(c, X, Y, T * p.s, p.v, FX.S ? FX.S.t : 0); },
    paintGround(c, A2) { paintPit(c, A2); },
    sky(c, W, H, t, cam, T) { if (typeof CAL !== 'undefined' && CAL.paintSky) CAL.paintSky(c, W, H, T); else paintCaldera(c, W, H, T); },
    overlay(c, FX, t, T) { const M = FX.mem, A = (M && M.A) || arenaOf(FX); if (A) drawZones(c, FX, A, T, t); },
    init(FX) { const M = FX.mem, m = FX.m; m.noTouch = true; m.act = 'enter'; m.touchK = 0.8;
      const A = arenaOf(FX) || (CUR = makeArena(FX.C, FX.H.g, { fake: true })); M.A = A;
      if (FX.F && FX.F.calHp) m.dmg = TUNE.dmg;
      Object.assign(M, { bt: 0, hd: Math.PI / 2, P: { hd: Math.PI / 2, sx: 1, sz: 1, lift: 0, H: 1.85, Rw: 1.62, wob: 0.6, wt: 0, lean: 0, side: 0, pods: [{ L: 0, a: 0, el: 0, w: 0.5 }, { L: 0, a: 0, el: 1.1, w: 0.32 }], lobes: 0, lobeT: 0, tall: 0, chill: 0, crack: 0, heat: 1, die: 0, cool: 0, alpha: 1, fx: 0, core: [0, 0, 0], shiver: 0, phase: 1 },
        I: MODEL.inst(), hop: 0, hopV: 0, swell: 0, crouch: 0, land: 0, chill: 0, outT: 9, brittle: false, brittleT: 0, graceT: 0, crack: 0, heat: 1, glowK: 0, mute: 0, armT: 0, flashK: 0, act: null, last: null, lastBrk: -99, lastBurst: -99, lastShed: -99, lastRush: -99, shedQ: 0,
        cool: 2.6, seen: {}, end: null, coreV: [0, 0, 0], globs: [], waves: [], adds: [], ripples: 0, taught: 0, px: m.x, py: m.y, spd: 0,
        stat: { slams: 0, spits: 0, breakers: 0, interrupts: 0, smashes: 0, sweeps: 0, bursts: 0, burstHits: 0, rushes: 0, sheds: 0, adds: 0, brittle: 0, brittleDmg: 0, armDmg: 0, fields: 0, hitsArm: 0, hitsBrit: 0, log: [] } });
      A.onField = w => { M.stat.fields++; M.stat.log.push(['field', +FX.S.t.toFixed(1), w.i, +Math.hypot(FX.m.x - w.zx, FX.m.y - w.zy).toFixed(1)]); if (!M.seen.field) { M.seen.field = 1; FX.H.banner('PROTECT THE CRYSTAL', 'The cold field slows and chills it. Keep it in the ring, and guard the crystal', FROST_HI, 2.8, true); } FX.H.ring(w.zx, w.zy, 0.3, w.zr, 0.6, FROST_HI, 0.5); if (FX.S.lv >= 2 && M.adds.filter(a => !a.dead).length < 2) M.shedQ = Math.max(M.shedQ, 1); if (FX.S.lv >= 3 && !M.brittle) { M.rushQ = 1; M.cool = Math.min(M.cool, 0.7); } if (A.firstAt == null) A.firstAt = FX.S.t; M.fieldAt = FX.S.t; };
      A.onBreak = (w, src) => { FX.H.boom(w.x, w.y, 1.6, FROST, '#FFFFFF', { n: 22, shake: 8, smoke: 2 }); FX.H.text(w.x, w.y - 3, 'CRYSTAL BROKEN', FROST_HI, 15); FX.H.sfx.crash(); if (FX.H.sfx.chime) FX.H.sfx.chime(330, 0.6); M.stat.log.push(['break', +FX.S.t.toFixed(1), src || '']); };
      A.onEnd = (w, why) => { M.stat.log.push(['end', +FX.S.t.toFixed(1), why, +M.chill.toFixed(2)]); };
      A.onRegrow = w => { FX.H.text(w.x, w.y - 3, 'Regrown', FROST_HI, 13); if (FX.H.sfx.chime) FX.H.sfx.chime(880, 0.5); };
      // (the engine names its armour "Armoured!": here it is the flan's molten armour)
      if (!FX.H.__calText) { const t0 = FX.H.text; FX.H.__calText = true; FX.H.text = function (x, y, s, ...r) { return t0.call(this, x, y, s === 'Armoured!' ? 'Molten armour' : s, ...r); }; } },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; clearActs(FX, m, M); M.P.phase = lv; M.wob = 1.4; M.P.wob = 1.4;
      if (lv === 2) { M.shedQ = 2; FX.H.banner('BOILING BROOD', 'Its lobes boil and shed Cinderlings: they go for the active crystal', LAVA_HI, 2.8, true); }
      if (lv === 3) FX.H.banner('PRESSURE HEART', 'Steam escapes its fractures: watch for the burst\'s safe gap', LAVA_HI, 2.8, true); },
    ai(FX, m, dt) { aiStep(FX, m, dt); },
    stunned(FX, m, dt) { const M = FX.mem; M.P.wob = Math.max(M.P.wob, 0.8); FX.parts(bodyParts(m, M)); },
    update(FX, dt) { upd(FX, dt); },
    dmgK(FX, m, o) { const M = FX.mem; if (!M || !M.stat) return 1; if (M.end) return 1;
      if (M.brittle) { M.flashK = 1; M.P.wob = Math.min(1.6, M.P.wob + 0.25); M.stat.hitsBrit++; return FX.S.lv >= 3 ? 1.25 : 1; }
      M.mute = 1; M.P.wob = Math.min(1.0, M.P.wob + 0.06); M.stat.hitsArm++;
      if (FX.S.t - M.armT > 1.6 && !(o && o.dot)) { M.armT = FX.S.t; FX.H.text(m.x, m.y - 3.2, 'Molten armour', '#C9B8A8', 12); }
      return 0.2; },
    onWeakHit(FX, key, dmg) { const M = FX.mem; if (key !== 'grip' || !M.act || !M.act.grip) return; const G = M.act.grip, t = FX.S.t; if (t - G.lastHit < 0.1) return; G.lastHit = t; G.hits++; G.flash = 1; FX.H.sparks(G.x, G.y, '#FFE9A8', 6, 4);
      if (G.hits >= G.need) interrupt(FX, FX.m, M); },
    ending(FX, m) { const M = FX.mem; clearActs(FX, m, M); M.end = { t: 0 }; M.chill = 0; M.brittle = false; FX.weak('grip', 0, 0, 0, 0, false); FX.noParts(); if (M.A) M.A.restore(); for (const a of M.adds) if (!a.dead) a.hp = 0;
      FX.H.sfx.hum(); if (FX.H.sfx.hiss) FX.H.sfx.hiss(1.4, 0.2, 700);
      return { title: 'THE FLAN COOLS', sub: 'Fire Flan collapses into glowing jelly and black glass', col: LAVA_HI, delay: 4.8, bannerAt: 1.6, quiet: true }; },   // (quiet: no bursts over the body; it slumps, it does not explode)
    camFocus(FX, m) { const M = FX.mem, me = FX.me; if (!M || !M.stat || m.act === 'enter') return null; const x = m.x, y = m.y - 1.2, d = Math.hypot(x - me.x, y - me.y) || 1; return { x, y, k: Math.min(0.3, 3.2 / d), zoom: 0.74 }; },
    draw(c, FX, m, X, Y, T, t) { drawFlan(c, FX, m, T, t); },
    drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !M.stat) return; if (m && m.dead && M.end) drawFlan(c, FX, m, T, t); drawAir(c, FX, M, T, t); },
    // (tests: the model and GLM)
    get __dbg() { return { MODEL, GLM: typeof GLM !== 'undefined' ? GLM : null, CUR, TUNE }; },
    // (tests: start an act now)
    dbgStart(FX, k) { const M = FX.mem, m = FX.m; clearActs(FX, m, M); start(FX, m, M, k, M.A.active()); },
    // (the stage's hint pointer: the plate to stand on, or the point to strike)
    hintFor(A, m) { const M = FIGHT && FIGHT.mem; if (!M || !M.stat || M.end) return null; const G = M.act && M.act.grip; if (G && G.on) return { x: G.x, y: G.y, h: 0.6, label: 'Strike the glowing point' };
      if (!A.field && A.cool <= 0 && !M.brittle) { const i = A.inZone(m.x, m.y, 0.3); if (i >= 0 && A.canUse(i)) { const w = A.wells[i]; return { x: w.px, y: w.py, h: 1.0, label: 'Stand on the plate' }; } } return null; },
  };
  let FIGHT = null;

  /* ---- the body's hit proxies, following the gel ---- */
  function bodyParts(m, M) { const P = M.P, s = P.sx || 1, h = (P.H || 1.85) * (P.sz || 1) * (1 + 0.24 * (P.tall || 0)); return [{ key: 'body', dx: 0, dy: -h * 0.4, r: 1.55 * s }]; }   // (one proxy: two overlapping ones let a single shot land twice)
  function keepIn(FX, m) { const q = FX.clampArena(m, 2.0); m.x = q.x; m.y = q.y; }
  function say(FX, key, s, sub, col, dur) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = (M.seen[key] || 0) + 1; FX.H.banner(s, sub, col || WARN_HI, first ? (dur || 2.6) : 1.1, true); }
  function clearActs(FX, m, M) { const a = M.act; if (a) { for (const k of ['tele', 'tele2']) if (a[k]) a[k].t = 0; if (a.grip) FX.weak('grip', 0, 0, 0, 0, false); } M.act = null; m.act = 'prowl'; m.actT = 0; const P = M.P; P.pods[0].L = 0; P.pods[1].L = 0; }
  function endAct(FX, m, M, cool) { const a = M.act; if (a && a.grip) FX.weak('grip', 0, 0, 0, 0, false); M.last = a ? a.k : M.last; M.act = null; m.act = 'prowl'; m.actT = 0; M.cool = cool * (FX.S.lv >= 3 ? 0.8 : FX.S.lv >= 2 ? 0.9 : 1) * (M.brittle ? 1.6 : 1); }
  const lvOf = FX => FX.S.lv;

  /* ---- the mind ---- */
  function aiStep(FX, m, dt) {
    const M = FX.mem; FIGHT = FX; m.actT += dt; m.noTouch = true;
    if (M.end) return;
    if (!M.act) { prowl(FX, m, M, dt); M.cool -= dt; if (M.cool <= 0) choose(FX, m, M); }
    else { const k = M.act.k; ACT[k](FX, m, M, dt, M.act); }
    keepIn(FX, m);
    FX.parts(bodyParts(m, M));
  }
  // at rest it hunts the pet (its lure), in heavy hops; chilled it slows; brittle it can barely move
  function prowl(FX, m, M, dt) {
    const me = FX.me, d = FX.dist(m.x, m.y), a = FX.angPet(m.x, m.y); M.hdTo = a;
    const slow = M.brittle ? 0.06 : 1 - 0.72 * M.chill, want = d > 2.7 ? 1.55 * slow * FX.S.fast : 0;
    hopMove(FX, m, M, dt, Math.cos(a), Math.sin(a), want);
  }
  // hop: a squash, a heave forward, a landing that sets the gel shaking
  function hopMove(FX, m, M, dt, ux, uy, spd) {
    if (spd > 0.02) { M.hop += dt * (1.15 + spd * 0.25); const ph = M.hop % 1, f = Math.max(0, Math.sin(ph * TAU - 0.6)) * 2.1; FX.H.moveEnt ? FX.H.moveEnt(m, ux * spd * f * dt, uy * spd * f * dt, 1) : (m.x += ux * spd * f * dt, m.y += uy * spd * f * dt);
      const was = M.hopPh || 0; M.hopPh = ph; if (ph < was) { M.P.wob = Math.min(1.2, M.P.wob + 0.35); M.land = 1; if (!lowFx() && Math.random() < 0.7) dust(FX, m.x, m.y + 0.6, 0.9, 2); } M.spd = spd; }
    else { M.spd = 0; }
  }
  function dust(FX, x, y, r, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, life = 0.6 + Math.random() * 0.5; FX.H.part({ kind: 'smoke', x: x + Math.cos(a) * r * 0.6, y: y + Math.sin(a) * r * 0.3, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 0.5 - 0.5, drag: 1.2, life, max: life, size: 0.55, color: 'rgba(40,32,30,' }); } }
  function embers(FX, x, y, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 1 + Math.random() * 3, life = 0.5 + Math.random() * 0.6; FX.H.part({ kind: 'ember', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 1.5, drag: 0.8, life, max: life, size: 3 + Math.random() * 2, color: col || (Math.random() < 0.5 ? LAVA : LAVA_HI) }); } }
  /* what next: a crystal under the cold draws it; otherwise the pet's distance picks the attack */
  function choose(FX, m, M) {
    const lv = lvOf(FX), A = M.A, w = A.active(), d = FX.dist(m.x, m.y), t = FX.S.t, alive = M.adds.filter(a => !a.dead).length;
    const brkDelay = A.fields <= 1 ? 7.5 : 3.5, canBrk = w && !w.broken && M.fieldAt != null && t - M.fieldAt > brkDelay && t - M.lastBrk > 5.5;
    if (M.brittle) { if (canBrk) return start(FX, m, M, 'breaker', w); M.cool = 0.8; return; }
    // (phase 3: a cold field answered at once by a charge at its crystal)
    if (lv >= 3 && M.rushQ && w && !w.broken && Math.hypot(m.x - w.x, m.y - w.y) > 3.6) { M.rushQ = 0; return start(FX, m, M, 'rush', w); }
    M.rushQ = 0;
    if (lv >= 2 && M.shedQ > 0 && alive < 2) return start(FX, m, M, 'shed');
    const W = [];
    if (canBrk) W.push(['breaker', 3.2]);
    if (lv >= 3 && w && !w.broken && t - M.lastRush > 8 && Math.hypot(m.x - w.x, m.y - w.y) > 5.5 && Math.hypot(m.x - w.zx, m.y - w.zy) > w.zr) W.push(['rush', 4.2]);
    if (d < 7) W.push(['slam', 2]);
    W.push(['spit', d > 3.5 ? 1.6 : 0.5]);
    if (lv >= 2 && d < 5.5) W.push(['sweep', 1.7]);
    if (lv >= 3 && !w && alive === 0 && t - M.lastBurst > 13) W.push(['burst', 2.4]);
    if (lv >= 2 && alive < 2 && t - M.lastShed > 18) W.push(['shed', 1.2]);
    let sum = 0; for (const e of W) { if (e[0] === M.last) e[1] *= 0.3; sum += e[1]; }
    let r = Math.random() * sum, k = W[0][0]; for (const e of W) { r -= e[1]; if (r <= 0) { k = e[0]; break; } }
    start(FX, m, M, k, w);
  }
  function start(FX, m, M, k, w) { M.act = { k, u: 0, w: w || M.A.active() }; m.act = k; m.actT = 0; ACT[k](FX, m, M, 0, M.act, true); }
  /* an interrupt point: a glowing node on the stretched gel; enough blows on it stop the attack */
  function grip(FX, a, x, y, on) { const G = a.grip || (a.grip = { hits: 0, need: 3, lastHit: -9, flash: 0, on: false, x, y }); G.x = x; G.y = y; G.on = on; FX.weak('grip', x, y, 0.6, 0.2, on); return G; }
  function interrupt(FX, m, M) { const a = M.act; if (!a) return; FX.weak('grip', 0, 0, 0, 0, false); if (a.tele) a.tele.t = 0; if (a.tele2) a.tele2.t = 0; M.stat.interrupts++; M.stat.log.push(['interrupt', a.k, +FX.S.t.toFixed(1)]);
    FX.H.text(m.x, m.y - 3.4, 'Interrupted!', '#FFE9A8', 16); FX.H.sfx.thud(); FX.H.shake(6, 0.25); M.P.wob = 1.6; embers(FX, a.grip ? a.grip.x : m.x, a.grip ? a.grip.y : m.y, 10, '#FFE9A8');
    if (a.k === 'breaker') M.lastBrk = FX.S.t; if (a.k === 'rush') M.lastRush = FX.S.t;
    M.act = { k: 'reel', u: 0, from: a.k }; m.act = 'reel'; m.actT = 0; }
  const ACT = {
    /* Jelly Slam: it swells, then drops into a clearly marked circle */
    slam(FX, m, M, dt, a, init) {
      const P = M.P, WU = 1.75;
      if (init) { const me = FX.me, ang = FX.angPet(m.x, m.y), d = Math.min(6, FX.dist(m.x, m.y)), tgt = FX.clampArena({ x: m.x + Math.cos(ang) * d, y: m.y + Math.sin(ang) * d }, 2.4); a.tx = tgt.x; a.ty = tgt.y; a.x0 = m.x; a.y0 = m.y; M.hdTo = ang;
        a.tele = FX.tele({ shape: 'circle', x: a.tx, y: a.ty, r: 2.7, t: WU, dmg: 0, col: WARN, label: 'SLAM' }); M.stat.slams++; say(FX, 'slam', 'JELLY SLAM', 'It swells, then drops into the marked circle: step out', WARN_HI); FX.H.sfx.hum(); return; }
      a.u += dt; const u = a.u;
      M.swell = u < 1.25 ? smooth(u / 1.1) : 1 - smooth((u - 1.25) / 0.2);
      M.crouch = u > 1.15 && u < 1.4 ? Math.sin((u - 1.15) / 0.25 * Math.PI) : 0;
      if (u > 1.35 && u < WU) { const v = (u - 1.35) / (WU - 1.35); m.x = a.x0 + (a.tx - a.x0) * smooth(v); m.y = a.y0 + (a.ty - a.y0) * smooth(v); P.lift = Math.sin(v * Math.PI) * 1.7; P.sz = 1 + 0.18 * Math.sin(v * Math.PI); }
      if (u >= WU && !a.landed) { a.landed = true; P.lift = 0; m.x = a.tx; m.y = a.ty; M.land = 1.4; P.wob = 1.6; if (a.tele) a.tele.t = 0;
        FX.H.boom(a.tx, a.ty, 2.4, LAVA, LAVA_HI, { n: 20, shake: 12, smoke: 6 }); FX.H.ring(a.tx, a.ty, 0.3, 2.9, 0.4, LAVA_HI, 0.4); FX.H.sfx.thud(); FX.H.sfx.crash(); embers(FX, a.tx, a.ty, 14);
        const me = FX.me; if (Math.hypot(me.x - a.tx, me.y - a.ty) < 2.7 + me.r * 0.6 && !me.dodge) FX.hurt(m.dmg * 1.0); }
      if (u > WU + 0.8) endAct(FX, m, M, 2.2);
    },
    /* Magma Spit: one slow glob at where the pet was; a brief small hot patch where it lands */
    spit(FX, m, M, dt, a, init) {
      const P = M.P;
      if (init) { M.hdTo = FX.angPet(m.x, m.y); M.stat.spits++; say(FX, 'spit', 'MAGMA SPIT', 'A slow glob lands where you were: keep moving', WARN_HI); return; }
      a.u += dt; const u = a.u; M.hdTo = FX.angPet(m.x, m.y);
      const pod = P.pods[1]; pod.a = 0; pod.el = 0.75; pod.w = 0.5; pod.L = u < 1.0 ? smooth(u / 1.0) * 0.6 : Math.max(0, 0.6 - (u - 1.0) * 3); M.spitK = u < 1.0 ? smooth(u / 0.9) : Math.max(0, 1 - (u - 1.0) * 4);
      if (u >= 1.0 && !a.fired) { a.fired = true; const me = FX.me, tx = me.x, ty = me.y, sx = m.x + Math.cos(M.hd) * 0.8, sy = m.y + Math.sin(M.hd) * 0.8, fl = 1.25;
        const tl = FX.tele({ shape: 'circle', x: tx, y: ty, r: 1.15, t: fl, dmg: 0, col: WARN });
        M.globs.push({ x0: sx, y0: sy, z0: 2.3, tx, ty, t: 0, fl, tl }); FX.H.sfx.pop(); if (FX.H.sfx.hiss) FX.H.sfx.hiss(0.25, 0.12, 900); P.wob = Math.min(1.4, P.wob + 0.5); }
      if (u > 1.6) endAct(FX, m, M, 1.9);
    },
    /* Crystal Breaker: it turns on the active crystal, stretches one heavy pseudopod, and smashes it unless stopped */
    breaker(FX, m, M, dt, a, init) {
      const P = M.P, w = a.w, lv = lvOf(FX), WU = [2.9, 2.6, 2.4][lv - 1] * (M.brittle ? 1.15 : 1);
      if (!w || w.broken || M.A.active() !== w) { if (a.phase === 'wind') FX.weak('grip', 0, 0, 0, 0, false); endAct(FX, m, M, 1); return; }   // (its crystal's field is over: nothing to smash)
      const dx = w.x - m.x, dy = w.y - m.y, dist = Math.hypot(dx, dy), ang = Math.atan2(dy, dx); M.hdTo = ang;
      if (init) { a.phase = 'go'; M.stat.breakers++; M.lastBrk = FX.S.t; say(FX, 'breaker', 'CRYSTAL BREAKER', 'Strike the glowing point on its pseudopod to stop it!', WARN_HI, 3.0); FX.H.sfx.hum(); return; }
      a.u += dt;
      if (a.phase === 'go') { // close enough to reach (it walks into the cold to get there)
        if (dist > 6.6 && !M.brittle && a.u < 6) { hopMove(FX, m, M, dt, dx / dist, dy / dist, 1.6 * (1 - 0.7 * M.chill)); return; }
        if (dist > 7.2) { endAct(FX, m, M, 1); return; }   // (out of reach: it gives up)
        a.phase = 'wind'; a.u = 0; a.reach = Math.max(0.6, Math.min(5.4, dist - 1.25 - 0.25));
        a.tele = FX.tele({ shape: 'circle', x: w.x, y: w.y, r: 1.9, t: WU, dmg: 0, col: WARN }); }
      if (a.phase === 'wind') {
        const v = cl(a.u / WU), pod = P.pods[0]; pod.a = angTo(M.hd, ang); pod.w = 0.42; pod.L = a.reach * (0.25 + 0.5 * smooth(v / 0.6)); pod.el = 0.15 + 0.75 * smooth(v / 0.7);
        // the interrupt point: on the stretched gel, partway out
        const k = 1.0 + pod.L * 0.55, gx = m.x + Math.cos(ang) * k, gy = m.y + Math.sin(ang) * k; const G = grip(FX, a, gx, gy, v > 0.08); G.flash = decay(G.flash, dt, 4);
        M.coreTo = [Math.cos(pod.a) * 0.45, Math.sin(pod.a) * 0.45, 0.2];
        if (a.u >= WU) { a.phase = 'smash'; a.u = 0; FX.weak('grip', 0, 0, 0, 0, false); a.grip.on = false; if (a.tele) a.tele.t = 0; } return; }
      if (a.phase === 'smash') { const pod = P.pods[0], v = cl(a.u / 0.22); pod.L = a.reach * (0.75 + 0.3 * v); pod.el = 0.9 - 1.15 * v;
        if (v >= 1 && !a.hit) { a.hit = true; M.A.damage(w.i, SMASH, 'breaker'); M.stat.smashes++; M.stat.log.push(['smash', +FX.S.t.toFixed(1), w.integ]); FX.H.boom(w.x, w.y, 1.6, LAVA, FROST_HI, { n: 18, shake: 10, smoke: 3 }); FX.H.sfx.crash(); embers(FX, w.x, w.y, 10);
          const me = FX.me; if (Math.hypot(me.x - w.x, me.y - w.y) < 1.9 + me.r * 0.6 && !me.dodge) FX.hurt(m.dmg * 0.55); P.wob = 1.3; }
        if (a.u > 0.75) { pod.L = Math.max(0, pod.L - dt * 6); if (pod.L <= 0.05) endAct(FX, m, M, 2.0); } }
    },
    /* the stagger after an interrupt */
    reel(FX, m, M, dt, a) { a.u += dt; const P = M.P; P.pods[0].L = Math.max(0, P.pods[0].L - dt * 8); P.pods[1].L = Math.max(0, P.pods[1].L - dt * 8); P.wob = Math.max(P.wob, 0.9); M.shiverK = 0.6; if (a.u > 1.9) endAct(FX, m, M, 1.4); },
    /* Body Sweep (phase 2): a slow, broad sweep of a flattened lobe across its front */
    sweep(FX, m, M, dt, a, init) {
      const P = M.P, WU = 2.1;
      if (init) { a.ang = FX.angPet(m.x, m.y); a.side = Math.random() < 0.5 ? 1 : -1; M.hdTo = a.ang; a.tele = FX.tele({ shape: 'cone', x: m.x, y: m.y, a: a.ang, len: 5.4, spread: 1.0, t: WU, dmg: 0, col: WARN, label: 'SWEEP' }); M.stat.sweeps++; say(FX, 'sweep', 'BODY SWEEP', 'A slow, broad sweep in front of it: get behind it or out of reach', WARN_HI); FX.H.sfx.hum(); return; }
      a.u += dt; const u = a.u, pod = P.pods[0]; M.hdTo = a.ang; pod.w = 0.62; pod.el = -0.05;
      if (u < WU) { const v = smooth(u / WU); pod.a = angTo(M.hd, a.ang) + a.side * 1.25 * v; pod.L = 0.6 + 0.7 * v; }
      else { const v = cl((u - WU) / 0.38); pod.a = angTo(M.hd, a.ang) + a.side * 1.25 * (1 - 2 * v); pod.L = 2.6 * Math.sin(Math.PI * Math.min(1, v * 0.9 + 0.1)) + 0.4;
        if (!a.hit && v > 0.25) { a.hit = true; const me = FX.me, d = Math.hypot(me.x - m.x, me.y - m.y); if (d < 5.4 + me.r * 0.5 && Math.abs(angTo(a.ang, Math.atan2(me.y - m.y, me.x - m.x))) < 1.0 && !me.dodge) FX.hurt(m.dmg * 0.85); FX.H.sfx.splash(); P.wob = 1.3; if (a.tele) a.tele.t = 0; }
        if (v >= 1) { pod.L = Math.max(0, pod.L - dt * 5); if (u > WU + 1.1) endAct(FX, m, M, 2.0); } }
    },
    /* shedding Cinderlings (phase 2+): two lobes boil over and drop off, two alive at most */
    shed(FX, m, M, dt, a, init) {
      if (init) { M.stat.sheds++; M.lastShed = FX.S.t; M.shedQ = 0; say(FX, 'shed', 'CINDERLINGS', 'They go for the active crystal and chip it: they die quickly', WARN_HI); if (FX.H.sfx.hiss) FX.H.sfx.hiss(0.8, 0.14, 500); return; }
      a.u += dt; M.boil = 1;
      if (a.u > 1.1 && !a.done) { a.done = true; const n = 2 - M.adds.filter(q => !q.dead).length;
        for (let i = 0; i < n; i++) { const ang = M.hd + (i ? 1 : -1) * 1.3 + (Math.random() - 0.5) * 0.4, p = FX.clampArena({ x: m.x + Math.cos(ang) * 2.2, y: m.y + Math.sin(ang) * 1.8 }, 1.5);
          const ST = FX.H.ST ? FX.H.ST() : null, hp = Math.max(10, (ST && ST.atk ? ST.atk : 10) * 2.4);
          const q = FX.minion('cinderling', p.x, p.y, { hp, maxhp: hp, calArena: M.A, born: 0.5, cd: 1.2 }); q.maxhp = hp; M.adds.push(q); M.stat.adds++; embers(FX, p.x, p.y, 8); FX.H.ring(p.x, p.y, 0.2, 1.2, 0.3, LAVA_HI, 0.3); }
        FX.H.sfx.pop(); M.P.wob = 1.4; }
      if (a.u > 1.7) endAct(FX, m, M, 1.6);
    },
    /* Pressure Burst (phase 3): it swells, then a ring of scalding pressure rolls out across the floor, one broad gap safe */
    burst(FX, m, M, dt, a, init) {
      const WU = 2.7;
      if (init) { const ap = FX.angPet(m.x, m.y); a.gap = ap + (Math.random() - 0.5) * 2.2; a.gw = 0.52; M.lastBurst = FX.S.t; M.stat.bursts++;
        a.z = { kind: 'burst', x: m.x, y: m.y, gap: a.gap, gw: a.gw, u: 0, wu: WU, r: 0, hit: false, done: false }; M.waves.push(a.z);
        say(FX, 'burst', 'PRESSURE BURST', 'A ring of steam rolls out: stand in the bright SAFE gap', WARN_HI, 3.0); FX.H.sfx.hum(); if (FX.H.sfx.hiss) FX.H.sfx.hiss(2.4, 0.1, 1500); return; }
      a.u += dt; const z = a.z; z.x = m.x; z.y = m.y; z.u = a.u; M.swell = Math.min(1.3, a.u / WU * 1.3); M.glowK = a.u / WU;
      if (a.u >= WU && !z.go) { z.go = true; z.r = 1.6; M.swell = 0; M.land = 1.6; M.P.wob = 1.6; FX.H.shake(10, 0.4); FX.H.sfx.crash(); if (FX.H.sfx.hiss) FX.H.sfx.hiss(0.9, 0.3, 2400); }
      if (a.u > WU + 2.4) endAct(FX, m, M, 2.2);
    },
    /* Crystal Rush (phase 3): a straight charge at the active crystal; its path marked early, its wind-up interruptible */
    rush(FX, m, M, dt, a, init) {
      const P = M.P, w = a.w, WU = 2.3;
      if (!w) { endAct(FX, m, M, 1); return; }
      if (init) { const dx = w.zx - m.x, dy = w.zy - m.y, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx); a.ang = ang; a.len = Math.max(1, Math.hypot(w.x - m.x, w.y - m.y) - 2.2); a.x0 = m.x; a.y0 = m.y; M.hdTo = ang; M.lastRush = FX.S.t; M.stat.rushes++;
        a.ang = Math.atan2(w.y - m.y, w.x - m.x); a.tele = FX.tele({ shape: 'line', x: m.x, y: m.y, a: a.ang, len: a.len + 1.2, w: 2.8, t: WU, dmg: 0, col: WARN, label: 'RUSH' });
        say(FX, 'rush', 'CRYSTAL RUSH', 'It charges the crystal along the marked path: strike the glowing point, or let it charge into the cold', WARN_HI, 3.0); FX.H.sfx.hum(); return; }
      a.u += dt; M.hdTo = a.ang;
      if (!a.go) { const v = cl(a.u / WU); P.lean = -0.5 * smooth(v); M.crouchK = v; const gx = m.x + Math.cos(a.ang) * 1.35, gy = m.y + Math.sin(a.ang) * 1.35; const G = grip(FX, a, gx, gy, v > 0.08); G.flash = decay(G.flash, dt, 4);
        if (a.u >= WU) { a.go = true; a.u = 0; FX.weak('grip', 0, 0, 0, 0, false); a.grip.on = false; FX.H.sfx.crash(); } return; }
      const v = cl(a.u / 0.6), d = a.len * smooth(v); m.x = a.x0 + Math.cos(a.ang) * d; m.y = a.y0 + Math.sin(a.ang) * d; P.lean = 0.8 * Math.sin(Math.PI * v); P.lift = Math.sin(Math.PI * v) * 0.5;
      const me = FX.me; if (!a.hitPet && !me.dodge && Math.hypot(me.x - m.x, me.y - m.y) < 1.7 + me.r) { a.hitPet = true; FX.hurt(m.dmg * 0.9); }
      if (v >= 1 && !a.hit) { a.hit = true; if (a.tele) a.tele.t = 0; P.lift = 0; M.land = 1.5; P.wob = 1.6; if (!w.broken && Math.hypot(w.x - m.x, w.y - m.y) < 3.4) { M.A.damage(w.i, SMASH, 'rush'); M.stat.smashes++; FX.H.boom(w.x, w.y, 1.5, LAVA, FROST_HI, { n: 16, shake: 10, smoke: 3 }); } FX.H.sfx.thud(); embers(FX, m.x, m.y, 12); }
      if (a.u > 1.5) { P.lean = 0; endAct(FX, m, M, 2.0); }
    },
  };

  /* ---- each frame: the cold, the brittle window, the pose, the globs and the waves ---- */
  function upd(FX, dt) {
    const M = FX.mem, m = FX.m; if (!m || !M.stat) return; FIGHT = FX; M.bt += dt; const P = M.P, A = M.A, lv = lvOf(FX);
    if (A.fake || !A.g || A.tickT !== A.g.t) A.tick(dt);
    // the entrance: it rises out of a molten puddle
    if (m.act === 'enter') { const e = FX.S.enterT || 0; P.die = 1 - smooth((e - 0.2) / 1.9); P.wob = 1.2; if (e < 2 && Math.random() < dt * 10) embers(FX, m.x + FX.rnd(-1.5, 1.5), m.y + FX.rnd(-0.5, 0.8), 1); }
    else if (!M.end) P.die = toward(P.die, 0, dt, 6);
    if (!M.taught && m.act !== 'enter') { M.taught = 1; M.cool = 4.2; FX.H.banner('FIRE FLAN', 'Molten armour: blows barely hurt it. Lure it into a frost ring, then stand on that well\'s plate', LAVA_HI, 3.4, true); }
    // the cold: in the active field it chills over three seconds; chilled through it turns brittle
    if (!M.end && m.act !== 'enter') {
      const w = A.active(), inF = !!w && Math.hypot(m.x - w.zx, m.y - w.zy) < w.zr + 0.5;
      if (inF) { M.chill = Math.min(1, M.chill + dt / CHILL_T); M.outT = 0; } else { M.outT += dt; if (!M.brittle && M.outT > GRACE_T) M.chill = Math.max(0, M.chill - dt / 2.5); }
      if (!M.brittle && M.chill >= 1) { M.brittle = true; M.brittleT = BRITTLE_T; M.graceT = 0; M.stat.brittle++; M.stat.log.push(['brittle', +FX.S.t.toFixed(1)]); P.wob = 1.5; FX.H.sfx.crash(); if (FX.H.sfx.chime) { FX.H.sfx.chime(1318, 0.7); } FX.H.flash(0.25, FROST_HI);
        say(FX, 'brittle', 'BRITTLE!', `Its molten armour is gone: strike it now!${lv >= 3 ? ' (it takes even more)' : ''}`, FROST_HI, 2.4); embers(FX, m.x, m.y - 1, 10, FROST_HI);
        if (M.act && M.act.k !== 'breaker' && M.act.k !== 'reel') clearActs(FX, m, M); }
      if (M.brittle) { M.brittleT -= dt; M.graceT = inF ? 0 : M.graceT + dt; M.chill = 1;
        if (M.brittleT <= 0 || M.graceT >= GRACE_T) { M.brittle = false; M.chill = 0.35; M.outT = 0; FX.H.text(m.x, m.y - 3.4, 'Molten armour returns', LAVA_HI, 14); if (FX.H.sfx.hiss) FX.H.sfx.hiss(0.6, 0.18, 800); P.wob = 1.2; embers(FX, m.x, m.y - 1, 12); } }
    }
    // the pose
    M.hd = turnTo(M.hd, M.hdTo == null ? M.hd : M.hdTo, dt, M.act && (M.act.k === 'rush' || M.act.k === 'breaker') ? 3 : 1.6); P.hd = M.hd;
    P.wt += dt * (M.brittle ? 0.35 : 1 - 0.5 * M.chill); P.wob = decay(P.wob, dt, M.brittle ? 2.4 : 0.9); if (P.wob < 0.12) P.wob = 0.12;
    M.land = decay(M.land, dt, 3.2); M.swell = decay(M.swell, dt, 1.2); M.crouch = decay(M.crouch, dt, 4);
    const hopPh = M.spd > 0.02 ? M.hopPh || 0 : 0, hopK = M.spd > 0.02 ? Math.min(1, M.spd) : 0, hz = hopK * Math.max(0, Math.sin(hopPh * TAU - 0.6));
    const breath = Math.sin(M.bt * 1.7) * 0.025 * (1 - M.chill * 0.8);
    P.sz = 1 + breath + 0.16 * M.swell + 0.12 * hz - 0.24 * M.land - 0.18 * M.crouch - 0.1 * (M.crouchK || 0) - (hopK ? 0.1 * Math.max(0, -Math.sin(hopPh * TAU - 0.6)) : 0);
    P.sx = 1 - breath * 0.5 + 0.1 * M.swell - 0.05 * hz + 0.16 * M.land + 0.09 * M.crouch + 0.06 * (M.crouchK || 0);
    if (!(M.act && (M.act.k === 'slam' || M.act.k === 'rush'))) P.lift = hz * 0.32;
    if (!(M.act && M.act.k === 'rush')) P.lean = toward(P.lean, M.spd * 0.18, dt, 4);
    M.crouchK = decay(M.crouchK, dt, 2);
    P.lobes = toward(P.lobes, lv >= 2 ? 1 + (M.boil || 0) * 0.8 : 0, dt, 1.5); P.lobeT += dt * (1 + (M.boil || 0) * 3) * (1 - 0.8 * M.chill); M.boil = decay(M.boil, dt, 1);
    P.tall = toward(P.tall, lv >= 3 ? 1 : 0, dt, 1.2);
    P.chill = toward(P.chill, M.chill, dt, 6); P.crack = toward(P.crack, M.brittle ? 1 : 0, dt, 5);
    P.shiver = M.chill > 0.05 ? M.chill * (M.brittle ? 1 : 0.6) : (M.shiverK || 0); M.shiverK = decay(M.shiverK, dt, 1);
    M.glowK = decay(M.glowK, dt, 2); if (!M.act || M.act.k !== 'spit') M.spitK = decay(M.spitK, dt, 4); P.heat = (lv >= 3 ? 1.25 : 1) * (1 - 0.25 * M.chill) + 0.6 * M.glowK + 0.15 * Math.sin(M.bt * 2.3);
    // the pods ease back when nothing holds them
    if (!M.act || !['breaker', 'sweep'].includes(M.act.k)) P.pods[0].L = decay(P.pods[0].L, dt, 4);
    if (!M.act || M.act.k !== 'spit') P.pods[1].L = decay(P.pods[1].L, dt, 4);
    // the core drifts about inside (toward a pseudopod that strains)
    const wantC = M.coreTo || [Math.cos(M.bt * 0.7) * 0.32, Math.sin(M.bt * 0.9) * 0.28, Math.sin(M.bt * 1.1) * 0.16 - M.land * 0.25]; M.coreTo = null;
    for (let i = 0; i < 3; i++) { M.coreV[i] += ((wantC[i] - P.core[i]) * 9 - M.coreV[i] * 3.2) * dt; P.core[i] += M.coreV[i] * dt * (M.brittle ? 0.3 : 1); }
    // its hits: muted while armoured (a dull ripple), bright and shaking when brittle
    if (m.flash > 0) { if (M.brittle) P.fx = Math.max(P.fx, 0.9); else P.fx = Math.min(P.fx, -0.8); m.flash = M.brittle ? m.flash : 0; }
    P.fx = P.fx > 0 ? decay(P.fx, dt, 4) : -decay(-P.fx, dt, 4);
    // steam escaping its fractures (phase 3), and its own embers
    if (!M.end && m.act !== 'enter' && !lowFx()) {
      if (lv >= 3 && Math.random() < dt * 9) { const a = Math.random() * TAU, h = 0.6 + Math.random() * 1.6, life = 0.9 + Math.random() * 0.6; FX.H.part({ kind: 'steam', x: m.x + Math.cos(a) * 1.2, y: m.y + Math.sin(a) * 0.5 - h, vx: Math.cos(a) * 0.8, vy: -1.6 - Math.random(), drag: 0.6, life, max: life, size: 6 + Math.random() * 6 }); }
      if (Math.random() < dt * (M.brittle ? 1 : 2.5)) embers(FX, m.x + FX.rnd(-1, 1), m.y - 1.5 - Math.random(), 1, M.brittle ? FROST_HI : null);
      if (M.brittle && Math.random() < dt * 4) FX.H.part({ kind: 'snow', x: m.x + FX.rnd(-1.4, 1.4), y: m.y - FX.rnd(0, 2), vx: FX.rnd(-0.4, 0.4), vy: 0.4, drag: 0.2, life: 1.2, max: 1.2, size: 2.5, color: FROST_HI });
    }
    // the globs in flight, the hot patches they leave
    for (let i = M.globs.length - 1; i >= 0; i--) { const G = M.globs[i]; G.t += dt; if (G.t >= G.fl) { M.globs.splice(i, 1); if (G.tl) G.tl.t = 0; landGlob(FX, m, M, G); } }
    // the burst's waves
    for (let i = M.waves.length - 1; i >= 0; i--) { const z = M.waves[i]; if (z.go) { z.r += dt * 7.5; const me = FX.me, d = Math.hypot(me.x - z.x, me.y - z.y), inGap = Math.abs(angTo(z.gap, Math.atan2(me.y - z.y, me.x - z.x))) < z.gw;
        if (!z.hit && Math.abs(d - z.r) < 0.7 + me.r * 0.5) { if (!inGap && !me.dodge) { z.hit = true; FX.hurt(m.dmg * 0.95); M.stat.burstHits++; } }
        if (z.r > AR + 3) M.waves.splice(i, 1); } else if (!M.act || M.act.z !== z) M.waves.splice(i, 1); }
    M.adds = M.adds.filter(a => !a.dead);
    // death: the shell slumps into a glowing puddle and black glass, cooling
    if (M.end) { const E = M.end; E.t += dt; P.die = smooth(E.t / 2.2); P.cool = smooth((E.t - 1.4) / 3.2); P.heat = 1.1 * (1 - 0.8 * P.cool); P.wob = Math.max(P.wob, 1.2 * (1 - P.die)); P.chill = toward(P.chill, 0, dt, 2); P.crack = toward(P.crack, 0, dt, 2); P.lobes = toward(P.lobes, 0, dt, 2); P.pods[0].L = 0; P.pods[1].L = 0; P.sx = 1; P.sz = 1; P.lift = 0;
      if (E.t < 2.2 && Math.random() < dt * 12) embers(FX, m.x + FX.rnd(-2, 2), m.y + FX.rnd(-0.6, 0.8), 1); if (E.t > 1 && E.t < 4 && Math.random() < dt * 6) FX.H.part({ kind: 'steam', x: m.x + FX.rnd(-2.2, 2.2), y: m.y + FX.rnd(-0.5, 0.6), vx: 0, vy: -1.2, drag: 0.5, life: 1.2, max: 1.2, size: 7 }); }
  }
  function landGlob(FX, m, M, G) {
    FX.H.boom(G.tx, G.ty, 1.0, LAVA, LAVA_HI, { n: 10, shake: 3, smoke: 2 }); embers(FX, G.tx, G.ty, 8); if (FX.H.sfx.hiss) FX.H.sfx.hiss(0.5, 0.15, 700);
    const me = FX.me; if (Math.hypot(me.x - G.tx, me.y - G.ty) < 1.15 + me.r * 0.5 && !me.dodge) FX.hurt(m.dmg * 0.55);
    FX.hz({ x: G.tx, y: G.ty, r: 0.95, life: 3.0, tick: 0.4, dps: m.dmg * 0.22, col: LAVA, shape: 'circle', kind: 'patch', draw: hotPatch });
  }
  function hotPatch(c, z, FX, T, t) { const X = FX.sx(z.x), Y = FX.sy(z.y), r = z.r * T, f = Math.min(1, z.age / 0.25, (z.life - z.age) / 0.8);
    c.save(); c.globalAlpha = f; c.fillStyle = 'rgba(20,6,2,.55)'; c.beginPath(); c.ellipse(X, Y, r * 1.08, r * 0.9, 0, 0, TAU); c.fill();
    const g = c.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, rgba(LAVA_HI, 0.85)); g.addColorStop(0.45, rgba(LAVA, 0.7)); g.addColorStop(1, rgba('#7A1A04', 0)); c.fillStyle = g; c.beginPath(); c.ellipse(X, Y, r, r * 0.82, 0, 0, TAU); c.fill();
    c.strokeStyle = rgba(WARN, 0.7); c.lineWidth = Math.max(1.5, T * 0.06); c.setLineDash([T * 0.2, T * 0.14]); c.beginPath(); c.ellipse(X, Y, r * 1.05, r * 0.88, 0, 0, TAU); c.stroke(); c.setLineDash([]);
    glowAt(c, X, Y, r * 1.6, LAVA, 0.35 * f); c.restore(); }

  /* ---- the drawing of the flan itself: its shadow and light on the floor, the model, the interrupt point ---- */
  function drawFlan(c, FX, m, T, t) {
    const M = FX.mem; if (!M || !M.P) return; const P = M.P, o = M.drawO || (M.drawO = { T, sx: FX.sx, sy: FX.sy, t, I: M.I }); o.T = T; o.t = t; o.sx = FX.sx; o.sy = FX.sy;
    MODEL.drawShadow(c, m.x, m.y, P, o);
    MODEL.draw(c, m.x, m.y, 0, P.hd, P, o);
    // the heat it gives off: a soft light over its core (cooler and paler when chilled)
    const L = MODEL.LAST; if (L && L.R) { const q = L.V.toS(L.R.core), heat = P.heat == null ? 1 : P.heat, ch = P.chill || 0;
      glowAt(c, q[0], q[1], T * (1.2 + 0.5 * (P.tall || 0)) * (1 - 0.4 * (P.die || 0)), ch > 0.5 ? '#FFC890' : '#FF8A2A', (0.22 + 0.08 * Math.sin(t * 2.7)) * heat * (1 - 0.35 * ch));
      if (ch > 0.05) glowAt(c, q[0], q[1] + T * 0.2, T * 1.9, FROST, 0.18 * ch);
      // the magma gathering in the swell before a spit
      const sk = M.spitK || 0; if (sk > 0.02) { const G = L.G, sp = L.V.toS([Math.cos(0.75) * (G.Rw * 0.75 + 0.5), 0, G.zc + Math.sin(0.75) * (G.Rw * 0.75 + 0.5) + 0.3]); glowAt(c, sp[0], sp[1], T * (0.5 + 0.5 * sk), LAVA_HI, 0.6 * sk); glowAt(c, sp[0], sp[1], T * 0.22, '#FFF2C0', 0.8 * sk); } }
  }
  /* what floats over the fight: the globs, the burst's ring and safe gap, the interrupt point, the lure icon, the bars */
  function drawAir(c, FX, M, T, t) {
    const m = FX.m, A = M.A, me = FX.me;
    // the burst: the wave's area darkened, the safe gap a bright wedge with its label; then the rolling ring itself
    for (const z of M.waves) { const X = FX.sx(z.x), Y = FX.sy(z.y), R = (AR + 1) * T, g0 = z.gap - z.gw, g1 = z.gap + z.gw;
      c.save();
      if (!z.go) { const u = cl(z.u / z.wu); c.globalAlpha = 1; c.fillStyle = rgba('#2A0602', 0.3); c.beginPath(); c.arc(X, Y, R, g1, g0 + TAU); c.arc(X, Y, 1.6 * T, g0 + TAU, g1, true); c.closePath(); c.fill(); c.fillStyle = rgba(WARN, 0.08 + 0.12 * u + 0.05 * Math.sin(t * 9)); c.fill();
        // the danger's chevrons, rolling outward
        c.strokeStyle = rgba(WARN_HI, 0.35 + 0.3 * u); c.lineWidth = Math.max(1.5, T * 0.07); for (let i = 0; i < 16; i++) { const an = g1 + (i + 0.5) / 16 * (TAU - 2 * z.gw); for (let j = 0; j < 3; j++) { const rr = (2.6 + ((j * 3.4 + t * 2.5) % 10)) * T; if (rr > R) continue; const ca = Math.cos(an), sa = Math.sin(an), w2 = T * 0.3; c.beginPath(); c.moveTo(X + ca * rr - sa * w2, Y + sa * rr + ca * w2); c.lineTo(X + ca * (rr + T * 0.3), Y + sa * (rr + T * 0.3)); c.lineTo(X + ca * rr + sa * w2, Y + sa * rr - ca * w2); c.stroke(); } }
        c.globalAlpha = 1; c.strokeStyle = rgba(WARN, 0.6 + 0.4 * Math.sin(t * 14) * u); c.lineWidth = 2 + u * 2; c.beginPath(); c.arc(X, Y, Math.max(1.8 * T, R * u), g1, g0 + TAU); c.stroke();
        // the safe gap
        const sg = c.createRadialGradient(X, Y, 1.6 * T, X, Y, R); sg.addColorStop(0, rgba(SAFE, 0.42)); sg.addColorStop(1, rgba(SAFE, 0.12)); c.fillStyle = sg; c.beginPath(); c.moveTo(X + Math.cos(g0) * 1.6 * T, Y + Math.sin(g0) * 1.6 * T); c.arc(X, Y, R, g0, g1); c.arc(X, Y, 1.6 * T, g1, g0, true); c.closePath(); c.fill();
        c.strokeStyle = rgba(SAFE, 0.95); c.lineWidth = 2.5; c.setLineDash([T * 0.4, T * 0.25]); c.beginPath(); c.moveTo(X + Math.cos(g0) * 1.6 * T, Y + Math.sin(g0) * 1.6 * T); c.lineTo(X + Math.cos(g0) * R, Y + Math.sin(g0) * R); c.moveTo(X + Math.cos(g1) * 1.6 * T, Y + Math.sin(g1) * 1.6 * T); c.lineTo(X + Math.cos(g1) * R, Y + Math.sin(g1) * R); c.stroke(); c.setLineDash([]);
        const lx = X + Math.cos(z.gap) * R * 0.45, ly = Y + Math.sin(z.gap) * R * 0.45; c.font = `900 ${Math.round(T * 0.62)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,30,20,.75)'; c.strokeText('SAFE', lx, ly); c.fillStyle = '#FFFFFF'; c.fillText('SAFE', lx, ly); c.textBaseline = 'alphabetic'; }
      else { const r = z.r * T; for (const [w, a] of [[0.9, 0.18], [0.5, 0.3], [0.2, 0.75]]) { c.strokeStyle = rgba(w < 0.3 ? '#FFF2DA' : LAVA, a); c.lineWidth = w * T; c.beginPath(); c.arc(X, Y, r, g1, g0 + TAU); c.stroke(); }
        if (!lowFx()) for (let i = 0; i < 18; i++) { const a = g1 + (i + 0.5) / 18 * (TAU - 2 * z.gw); c.globalAlpha = 0.35; blitSized(c, puffSprite('rgba(240,232,220,'), X + Math.cos(a) * r - T * 0.6, Y + Math.sin(a) * r - T * 0.9, T * 1.2, T * 1.2); } }
      c.restore(); }
    // the globs: a molten ball on its arc, trailing smoke
    for (const G of M.globs) { const u = cl(G.t / G.fl), x = G.x0 + (G.tx - G.x0) * u, y = G.y0 + (G.ty - G.y0) * u, z = G.z0 * (1 - u) + Math.sin(Math.PI * u) * 3.2, X = FX.sx(x), Y = FX.sy(y) - z * T * 0.7, r = T * 0.36;
      c.save(); c.globalAlpha = 0.35; c.fillStyle = '#05030A'; c.beginPath(); c.ellipse(FX.sx(x), FX.sy(y), r, r * 0.4, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
      glowAt(c, X, Y, r * 3, LAVA, 0.55); const g = c.createRadialGradient(X - r * 0.3, Y - r * 0.3, 0, X, Y, r); g.addColorStop(0, '#FFF2C0'); g.addColorStop(0.4, LAVA_HI); g.addColorStop(0.8, EMBER); g.addColorStop(1, '#6A1004'); c.fillStyle = g; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill(); c.restore();
      if (!lowFx() && Math.random() < 0.5) FX.H.part({ kind: 'smoke', x, y: y - z * 0.7, vx: 0, vy: -0.3, drag: 1, life: 0.5, max: 0.5, size: 0.4, color: 'rgba(50,40,36,' }); }
    // the interrupt point: a pulsing white-gold node with a ring counting the blows still needed, and a label
    const a = M.act, G = a && a.grip; if (G && G.on && m && !m.dead) { const X = FX.sx(G.x), Y = FX.sy(G.y) - T * 1.6, p = 0.6 + 0.4 * Math.sin(t * 10), r = T * 0.42;
      c.save(); glowAt(c, X, Y, r * 3.2, '#FFE9A8', 0.45 + 0.3 * p + 0.4 * G.flash); c.fillStyle = 'rgba(40,10,0,.6)'; c.beginPath(); c.arc(X, Y, r * 1.05, 0, TAU); c.fill();
      const g = c.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, '#FFE9A8'); g.addColorStop(1, '#FF9A2E'); c.fillStyle = g; c.beginPath(); c.arc(X, Y, r * (0.75 + 0.15 * p), 0, TAU); c.fill();
      for (let i = 0; i < G.need; i++) { const a0 = -Math.PI / 2 + i / G.need * TAU + 0.12, a1 = a0 + TAU / G.need - 0.24; c.strokeStyle = i < G.hits ? '#FFFFFF' : 'rgba(255,233,168,.45)'; c.lineWidth = Math.max(2.5, T * 0.1); c.beginPath(); c.arc(X, Y, r * 1.45, a0, a1); c.stroke(); }
      c.font = `900 ${Math.max(10, Math.round(T * 0.3))}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.75)'; c.fillStyle = '#FFE9A8'; c.strokeText('HIT!', X, Y - r * 1.9); c.fillText('HIT!', X, Y - r * 1.9); c.restore(); }
    // the lure: the pet is what it hunts (an orange reticle under it, a small flame-eye mark over its head)
    if (m && !m.dead && !M.end && m.act !== 'enter' && !M.brittle && me && !me.dead) { const X = FX.sx(me.x), Y = FX.sy(me.y), r = T * 0.75, p = 0.5 + 0.5 * Math.sin(t * 4);
      c.save(); c.strokeStyle = rgba(AMBER, 0.55 + 0.25 * p); c.lineWidth = Math.max(1.5, T * 0.05); c.setLineDash([T * 0.18, T * 0.12]); c.lineDashOffset = t * T * 0.4; c.beginPath(); c.ellipse(X, Y + T * 0.1, r, r * 0.45, 0, 0, TAU); c.stroke(); c.setLineDash([]);
      for (let i = 0; i < 4; i++) { const an = i / 4 * TAU + Math.PI / 4; c.beginPath(); c.moveTo(X + Math.cos(an) * r * 0.85, Y + T * 0.1 + Math.sin(an) * r * 0.38); c.lineTo(X + Math.cos(an) * r * 1.2, Y + T * 0.1 + Math.sin(an) * r * 0.54); c.stroke(); }
      const iy = Y - T * 2.1 - Math.abs(Math.sin(t * 3)) * T * 0.12, ir = T * 0.26; c.fillStyle = 'rgba(30,8,2,.7)'; c.beginPath(); c.arc(X, iy, ir * 1.25, 0, TAU); c.fill(); c.strokeStyle = AMBER; c.lineWidth = Math.max(1.5, T * 0.05); c.stroke();
      c.fillStyle = LAVA_HI; c.beginPath(); c.moveTo(X, iy - ir * 0.95); c.quadraticCurveTo(X + ir * 0.7, iy - ir * 0.1, X + ir * 0.45, iy + ir * 0.5); c.quadraticCurveTo(X, iy + ir * 0.85, X - ir * 0.45, iy + ir * 0.5); c.quadraticCurveTo(X - ir * 0.7, iy - ir * 0.1, X, iy - ir * 0.95); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(X, iy + ir * 0.18, ir * 0.22, 0, TAU); c.fill();
      if ((M.seen.lureT = (M.seen.lureT || 0) + 1) < 600) { c.font = `800 ${Math.max(9, Math.round(T * 0.24))}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.fillStyle = LAVA_HI; c.strokeText('LURE', X, iy - ir * 1.6); c.fillText('LURE', X, iy - ir * 1.6); }
      // and, with a field running and the flan outside it, the way to lead it
      const w = A.active(); if (w && Math.hypot(m.x - w.zx, m.y - w.zy) > w.zr + 0.5) { c.strokeStyle = rgba(FROST_HI, 0.55); c.lineWidth = Math.max(1.5, T * 0.06); c.setLineDash([T * 0.25, T * 0.2]); c.lineDashOffset = -t * T; c.beginPath(); c.moveTo(FX.sx(m.x), FX.sy(m.y)); c.lineTo(FX.sx(w.zx), FX.sy(w.zy)); c.stroke(); c.setLineDash([]);
        c.font = `800 ${Math.max(9, Math.round(T * 0.3))}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.fillStyle = FROST_HI; c.strokeText('Lure it into the cold', FX.sx(w.zx), FX.sy(w.zy) - T * 0.3); c.fillText('Lure it into the cold', FX.sx(w.zx), FX.sy(w.zy) - T * 0.3); }
      c.restore(); }
    // (without a stage, the crystals are drawn here)
    if (A && A.fake) for (const w of A.wells) crystalObjDraw(c, FX, A, w, FX.sx(w.x), FX.sy(w.y), T, t);
    if (A) drawCrystalHud(c, FX, A, T, t);
    // the brittle window's clock over the flan
    if (M.brittle && m && !m.dead) { const X = FX.sx(m.x), Y = FX.sy(m.y) + T * 1.15, u = M.brittleT / BRITTLE_T; c.save(); c.font = `900 ${Math.max(10, Math.round(T * 0.34))}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,10,24,.75)'; c.fillStyle = FROST_HI; c.strokeText('BRITTLE', X, Y); c.fillText('BRITTLE', X, Y);
      c.fillStyle = 'rgba(0,10,24,.7)'; c.fillRect(X - T * 0.9, Y + T * 0.12, T * 1.8, Math.max(4, T * 0.12)); c.fillStyle = FROST_HI; c.fillRect(X - T * 0.9, Y + T * 0.12, T * 1.8 * cl(u), Math.max(4, T * 0.12)); c.restore(); }
  }

  /* ================= the pit, its backdrop and its standing scenery ================= */
  function paintPit(c, A2) {
    const R = A2.R, rnd = A2.rnd;
    // (the caldera's shared platform when the core has it; the wells' frost is ours, laid over it)
    if (typeof CAL !== 'undefined' && CAL.paintPlatform) { CAL.paintPlatform(c, R, rnd, { seams: 0.6 }); paintFrostMarks(c, rnd); return; }
    // the basalt disc: the tops of countless hexagonal columns, cooled and fitted tight, soot in the joints
    let g = c.createRadialGradient(0, 0, R * 0.1, 0, 0, R + 1.6); g.addColorStop(0, '#34302F'); g.addColorStop(0.65, '#2A2628'); g.addColorStop(0.9, '#1C191B'); g.addColorStop(1, 'rgba(20,16,18,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.6, 0, TAU); c.fill();
    const hx = 0.74, hy = hx * Math.sqrt(3) / 2;
    for (let row = -Math.ceil(R / hy) - 1; row <= Math.ceil(R / hy) + 1; row++) for (let col = -Math.ceil(R / hx) - 1; col <= Math.ceil(R / hx) + 1; col++) {
      const x = col * hx + (row & 1 ? hx / 2 : 0) + (rnd() - 0.5) * 0.08, y = row * hy + (rnd() - 0.5) * 0.08, d = Math.hypot(x, y); if (d > R - 0.35) continue;
      const r = hx * 0.56, sh = (rnd() - 0.5) * 0.16 - d / R * 0.08, base = shadeC('#2A2628', sh);
      c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6 + (rnd() - 0.5) * 0.25, rr = r * (0.84 + rnd() * 0.16); i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath();
      const gg = c.createLinearGradient(x - r, y - r, x + r, y + r); gg.addColorStop(0, shadeC(base, 0.06)); gg.addColorStop(1, shadeC(base, -0.1)); c.fillStyle = gg; c.fill();
      c.strokeStyle = 'rgba(6,4,6,.42)'; c.lineWidth = 0.045; c.stroke();
      if (rnd() < 0.3) { c.fillStyle = 'rgba(255,255,255,.035)'; c.beginPath(); c.arc(x - r * 0.2, y - r * 0.2, r * 0.45, 0, TAU); c.fill(); }
      if (rnd() < 0.25) { c.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x + (rnd() - 0.5) * r, y + (rnd() - 0.5) * r, 0.03 + rnd() * 0.04, 0, TAU); c.fill(); } }
    }
    // soot and ash drifts
    for (let i = 0; i < 70; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, r = 0.8 + rnd() * 2.2, x = Math.cos(a) * d, y = Math.sin(a) * d, gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, rnd() < 0.6 ? 'rgba(0,0,0,.28)' : 'rgba(180,170,165,.06)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); }
    // seams of cooled lava crust, a few still glowing deep down
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (let k = 0; k < 6; k++) { let a0 = rnd() * TAU, x = Math.cos(a0) * R * 0.98, y = Math.sin(a0) * R * 0.98, a = a0 + Math.PI + (rnd() - 0.5) * 0.7; const pts = []; for (let j = 0; j < 9; j++) { pts.push([x, y]); a += (rnd() - 0.5) * 0.6; x += Math.cos(a) * 0.9; y += Math.sin(a) * 0.9; }
      [[0.42, '#141012'], [0.22, '#2A1C18'], [0.08, 'rgba(255,90,20,.55)'], [0.03, 'rgba(255,210,140,.7)']].forEach(([w, col]) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke(); }); }
    paintFrostMarks(c, rnd);
    // the raised basalt lip round the pit, and the lava beyond it
    c.strokeStyle = '#141113'; c.lineWidth = 0.7; c.beginPath(); c.arc(0, 0, R - 0.05, 0, TAU); c.stroke(); c.strokeStyle = '#4A4446'; c.lineWidth = 0.18; c.beginPath(); c.arc(0, 0, R - 0.25, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,100,30,.5)'; c.lineWidth = 0.7; c.beginPath(); c.arc(0, 0, R + 0.75, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,220,140,.55)'; c.lineWidth = 0.14; c.stroke();
  }
  // the frost the wells breathe onto the floor: rime fanning out round each, and the cooling zone's engraved ring
  function paintFrostMarks(c, rnd) {
    for (let i = 0; i < 3; i++) { const w = wellGeo({ x: 0, y: 0 }, i);
      const fg = c.createRadialGradient(w.x, w.y, 0.5, w.x, w.y, 4.2); fg.addColorStop(0, 'rgba(200,232,255,.32)'); fg.addColorStop(1, 'rgba(160,210,255,0)'); c.fillStyle = fg; c.beginPath(); c.arc(w.x, w.y, 4.2, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(225,244,255,.35)'; c.lineWidth = 0.04; for (let k = 0; k < 26; k++) { let a = w.a + Math.PI + (rnd() - 0.5) * 2.4, x = w.x + Math.cos(a) * 1.3, y = w.y + Math.sin(a) * 1.3; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { a += (rnd() - 0.5) * 0.9; const L = 0.35 + rnd() * 0.3; x += Math.cos(a) * L; y += Math.sin(a) * L; c.lineTo(x, y); const b = a + (rnd() < 0.5 ? 0.8 : -0.8); c.lineTo(x + Math.cos(b) * 0.18, y + Math.sin(b) * 0.18); c.moveTo(x, y); } c.stroke(); }
      const zg = c.createRadialGradient(w.zx, w.zy, 0, w.zx, w.zy, w.zr); zg.addColorStop(0, 'rgba(150,200,240,.07)'); zg.addColorStop(1, 'rgba(150,200,240,.14)'); c.fillStyle = zg; c.beginPath(); c.arc(w.zx, w.zy, w.zr, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(10,20,30,.55)'; c.lineWidth = 0.16; c.beginPath(); c.arc(w.zx, w.zy, w.zr + 0.04, 0, TAU); c.stroke();
      // a path of frost-cut flagstones from the zone to the plate
      c.fillStyle = 'rgba(120,140,160,.22)'; for (let k = 0; k < 4; k++) { const u = (k + 0.5) / 4, x = w.zx + (w.px - w.zx) * u, y = w.zy + (w.py - w.zy) * u; c.beginPath(); c.ellipse(x, y, 0.32, 0.22, 0, 0, TAU); c.fill(); }
    }
  }
  function paintCaldera(c, W, H, T) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0C0708'); g.addColorStop(0.5, '#1A0C08'); g.addColorStop(1, '#3A1206'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(808);
    // the caldera's far walls: ragged basalt, lit from below
    c.fillStyle = '#090607'; c.beginPath(); c.moveTo(0, H * 0.32); for (let x = 0; x <= W; x += W / 24) c.lineTo(x, H * (0.18 + 0.12 * R())); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
    // lavafalls pouring down the walls
    for (let i = 0; i < 5; i++) { const x = W * (0.08 + i * 0.21 + (R() - 0.5) * 0.06), w = W * (0.012 + R() * 0.02), top = H * (0.2 + R() * 0.08);
      const lg = c.createLinearGradient(0, top, 0, H); lg.addColorStop(0, 'rgba(255,200,110,.85)'); lg.addColorStop(0.4, 'rgba(255,110,30,.75)'); lg.addColorStop(1, 'rgba(160,30,6,.5)'); c.fillStyle = lg; c.fillRect(x - w / 2, top, w, H - top);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; blitSized(c, glowSprite('#FF6A1E'), x - w * 6, top - w * 2, w * 12, H - top + w * 4); c.restore(); }
    // a glow from the lava sea below, ash on the air
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; blitSized(c, glowSprite('#FF5A14'), -W * 0.3, H * 0.55, W * 1.6, H * 0.9); c.restore();
    for (let i = 0; i < 9; i++) { const x = R() * W, y = H * (0.1 + R() * 0.4), r = 30 + R() * 60; c.globalAlpha = 0.35; blitSized(c, puffSprite('rgba(40,30,28,'), x - r, y - r, r * 2, r * 2); } c.globalAlpha = 1;
  }
  // a basalt column: a hexagonal prism, dark, its top catching the lava light
  function basaltColumn(c, X, Y, s, v) {
    const h = s * (2.2 + (v % 4) * 0.55), w = s * 0.62;
    c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(X + s * 0.2, Y + s * 0.05, w * 1.3, w * 0.45, 0, 0, TAU); c.fill();
    const faces = [[-1, -0.5, '#26222A'], [-0.5, 0.5, '#36313A'], [0.5, 1, '#1A171D']];
    for (const [a, b, col] of faces) { c.beginPath(); c.moveTo(X + a * w, Y - (a === -1 || a === 1 ? 0 : w * 0.25)); c.lineTo(X + b * w, Y - (b === -1 || b === 1 ? 0 : w * 0.25)); c.lineTo(X + b * w, Y - h - (b === -1 || b === 1 ? 0 : w * 0.25)); c.lineTo(X + a * w, Y - h - (a === -1 || a === 1 ? 0 : w * 0.25)); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1; c.stroke(); }
    c.beginPath(); c.moveTo(X - w, Y - h); c.lineTo(X - w * 0.5, Y - h - w * 0.25 - w * 0.22); c.lineTo(X + w * 0.5, Y - h - w * 0.25 - w * 0.22); c.lineTo(X + w, Y - h); c.lineTo(X + w * 0.5, Y - h + w * 0.22 - w * 0.25 + w * 0.25); c.lineTo(X - w * 0.5, Y - h + w * 0.22); c.closePath(); c.fillStyle = '#4A4248'; c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,110,40,.35)'; c.lineWidth = Math.max(1, s * 0.04); c.beginPath(); c.moveTo(X - w, Y - h * 0.4); c.lineTo(X - w, Y); c.stroke();
    c.restore();
  }
  // a cluster of black fire crystals: glossy black-violet blades, red-orange fractures glowing inside
  function blackCrystal(c, X, Y, s, v, t) {
    const R = mulberry32(100 + v), n = 4 + (v % 3);
    c.save(); c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(X, Y + s * 0.05, s * 0.9, s * 0.3, 0, 0, TAU); c.fill();
    for (let i = 0; i < n; i++) { const bx = (R() - 0.5) * s * 1.1, h = s * (0.9 + R() * 1.7) * (i === 0 ? 1.4 : 1), w = s * (0.14 + R() * 0.12), lean = (R() - 0.5) * 0.7 + bx / s * 0.4, x = X + bx, tx = x + lean * h * 0.4, ty = Y - h;
      c.beginPath(); c.moveTo(x - w, Y); c.lineTo(tx - w * 0.3, ty + h * 0.15); c.lineTo(tx, ty); c.lineTo(tx + w * 0.3, ty + h * 0.15); c.lineTo(x + w, Y); c.closePath();
      const gr = c.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, '#3A2A4A'); gr.addColorStop(0.45, '#120C18'); gr.addColorStop(1, '#050307'); c.fillStyle = gr; c.fill(); c.strokeStyle = 'rgba(0,0,0,.8)'; c.lineWidth = 1; c.stroke();
      c.strokeStyle = 'rgba(255,90,30,.75)'; c.lineWidth = Math.max(1, s * 0.03); c.beginPath(); c.moveTo(x + (tx - x) * 0.15, Y - h * 0.15); c.lineTo(x + (tx - x) * 0.5 + w * 0.2, Y - h * 0.5); c.lineTo(x + (tx - x) * 0.75 - w * 0.1, Y - h * 0.72); c.stroke();
      c.strokeStyle = 'rgba(200,170,255,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - w * 0.6, Y - h * 0.05); c.lineTo(tx - w * 0.2, ty + h * 0.12); c.stroke(); }
    glowAt(c, X, Y - s * 0.7, s * 1.3, '#FF5A14', 0.28);
    c.restore();
  }

  /* ================= the Cinderlings: little beads of molten gel it sheds ================= */
  if (typeof MON !== 'undefined' && !MON.cinderling) {
    MON.cinderling = { name: 'Cinderling', from: 999, hp: 40, spd: 1.75, r: 0.42, dmg: 7, xp: 6, coin: 0.3, color: '#FF7A1E', bio: [], tip: 'A small bead of molten gel shed by the Fire Flan, a crust of ash over its glow. It hops to the active frost crystal and chips it. One or two blows put it out.', kit: [] };
    const DA = DunArt; if (DA && DA.MP) { DA.EXT.cinderling = 1.9; DA.NF.cinderling = 6;
      DA.MP.cinderling = (c, r, ph, o) => { const hop = Math.abs(Math.sin(ph * TAU)), sq = 1 - 0.18 * (1 - hop), lift = hop * r * 0.4, chip = o.mode === 'chip';
        c.fillStyle = 'rgba(10,4,2,.35)'; c.beginPath(); c.ellipse(0, r * 0.62, r * 0.85, r * 0.26, 0, 0, TAU); c.fill();
        { const hg = c.createRadialGradient(0, r * 0.5, 0, 0, r * 0.5, r * 1.5); hg.addColorStop(0, 'rgba(255,120,30,.38)'); hg.addColorStop(1, 'rgba(255,90,20,0)'); c.fillStyle = hg; c.beginPath(); c.ellipse(0, r * 0.5, r * 1.5, r * 0.75, 0, 0, TAU); c.fill(); }
        c.save(); c.translate(0, r * 0.62 - lift); c.scale(1 / Math.sqrt(sq), sq);
        const g = c.createRadialGradient(-r * 0.25, -r * 0.85, r * 0.1, 0, -r * 0.6, r * 1.1); g.addColorStop(0, '#FFE6A0'); g.addColorStop(0.35, '#FF9A2E'); g.addColorStop(0.75, '#C2380A'); g.addColorStop(1, '#5A1204');
        c.beginPath(); c.moveTo(-r * 0.85, 0); c.bezierCurveTo(-r * 0.95, -r * 0.9, -r * 0.4, -r * 1.35, 0, -r * 1.35); c.bezierCurveTo(r * 0.45, -r * 1.35, r * 0.95, -r * 0.9, r * 0.85, 0); c.quadraticCurveTo(0, r * 0.12, -r * 0.85, 0); c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(40,8,2,.85)'; c.lineWidth = DA.lwOf(r) * 0.8; c.stroke();
        // its crust: dark ash plates over the glow, the glow showing in the cracks
        c.fillStyle = 'rgba(30,18,16,.85)'; for (const [x, y, w, h, a] of [[-0.35, -0.95, 0.32, 0.18, -0.4], [0.3, -1.05, 0.28, 0.15, 0.3], [0.05, -0.55, 0.36, 0.16, 0.1], [-0.55, -0.4, 0.2, 0.14, -0.8]]) { c.beginPath(); c.ellipse(x * r, y * r, w * r, h * r, a, 0, TAU); c.fill(); }
        c.fillStyle = 'rgba(255,250,230,.75)'; c.beginPath(); c.ellipse(-r * 0.3, -r * 1.12, r * 0.16, r * 0.08, -0.5, 0, TAU); c.fill();
        if (chip) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; blitSized(c, glowSprite('#FFB347'), -r, -r * 1.6, r * 2, r * 2); }
        c.restore(); }; }
    if (typeof DunAI !== 'undefined' && DunAI.mon) DunAI.mon.cinderling = (m, A, X) => {
      if (m.born > 0) { m.born -= A.dt; return; }
      const Ar = m.calArena, w = Ar && Ar.active && Ar.active();
      if (w && !w.broken) { const dx = w.x - m.x, dy = w.y - m.y, d = Math.hypot(dx, dy) || 1;
        if (d > 2.35) { X.moveEnt(m, dx / d * A.sp * A.dt, dy / d * A.sp * A.dt); m.face = dx >= 0 ? 1 : -1; m.mode = null; }
        else { m.mode = 'chip'; m.chipT = (m.chipT || 1.0) - A.dt; if (m.chipT <= 0) { m.chipT = 1.2; Ar.damage(w.i, CHIP, 'cinderling'); m.chips = (m.chips || 0) + 1; if (X.sparks) X.sparks(w.x, w.y - 1, '#BFE6FF', 4, 3); if (X.sfx && X.sfx.blip) X.sfx.blip(); } }
        return; }
      m.mode = null; A.steer(A.sp);
    };
  }

  return { def, bossMake, MODEL, makeArena, wellGeo, TUNE, CONST: { AR, WELL_D, ZONE_D, ZONE_R, PLATE_D, FIELD_T, RECHARGE_T, REGROW_T, GRACE_T, CHILL_T, BRITTLE_T, INTEG, SMASH, CHIP }, get cur() { return CUR; } };
})();
RiftFiend.define({ id: 'calflan', name: 'Fire Flan', title: 'The Molten Mantle', color: '#C2380A', glow: '#FF9A2E', accent: '#FFE9A8', biome: (typeof BIOMES !== 'undefined' && BIOMES.calderapit) ? 'calderapit' : 'volcano', r: 1.7, els: ['fire'], phases: 3, cuts: [1, 0.7, 0.35], hpK: 0.25, dmgK: 0.75 }, CALFLAN.def);
if (typeof CAL !== 'undefined') { CAL.bossMake = CAL.bossMake || {}; CAL.bossMake.calflan = CALFLAN.bossMake; }
