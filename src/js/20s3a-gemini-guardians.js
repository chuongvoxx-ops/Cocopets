/* ---------- v468 GP: the Gemini Gate's machines on the GPU: Lux and Umbra, the six containment pillars, the sealed gate (GEMINI_GUARD) ----------
   Drawn with Raziel's own model painter (RAZIEL_GL.drawParts, 02f7): the guardians' heads ARE Raziel's redesigned heads ({ m: 'head' }:
   the skull, the articulated jaw, the throat furnace / the cryo turbine), his Mirror Crowns ('crownL' / 'crownR') as their rotating
   celestial containment rings, his containment rings ('ringL' / 'ringR'), his plasma sun and crystal planet ('sun' / 'planet') as the
   pillars' cores, his ice formations, shards and molten rocks ('spire', 'shard', 'ember') as frost and debris; the rest (the wall
   bastions, the articulated necks' vertebrae and pistons, the pillars' frames, the gate's ring, plates, pylons and sockets) are GLM
   meshes of this file built in Raziel's materials (600..612: ceramic armour, gold / platinum, dark titanium / cobalt machinery, conduits
   whose charge runs along them, crystal), passed to drawParts as { m: 'mesh' } (02f7 "v468 GP"). Each machine is ONE GL pass; its light
   (eyes, conduits, cores) is the FGFX painter's (NIDHOGG_MOVES.FGFX), its fire and ice Raziel's (RAZIEL_MOVES.FXP, kinds 450..479).
   Geometry is pure (solve*: no GL needed: the gate's rules take the mouths' floor points from it): model units, x forward, y the
   guardian's left, z up; a world tile is U model units across and U / SE along y (Raziel's camera: elevation 0.62).
   API: ok(), warm(), ready(), release(), gpuCount(), stats,
        solveGuardian(G) -> rig (model and world points), guardian(c, G, V) -> anchors | null (no GL: the caller draws its 2D),
        pillar(c, P, V) -> bool, gate(c, D, V) -> bool, proj(V, x, y, h) (world -> screen).
   V = { sx, sy, T (px per tile), t (seconds) }. */
var GEMINI_GUARD = (() => {
  const TAU = Math.PI * 2, PI = Math.PI, EL = 0.62, SE = Math.sin(EL), CE = Math.cos(EL), U = 0.95;   // (U: tiles per model unit)
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const hh = (a, b) => { let n = (a * 374761393 + b * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const MT = { CER: 600, MET: 601, TI: 602, CH: 603, EYE: 604, PL: 605, CRY: 606, RUNE: 608, LIT: 609, MOU: 610, FANG: 611 };
  const HAS_W = typeof window !== 'undefined', flag = n => (HAS_W ? window[n] : undefined);
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const RZ = () => (typeof RAZIEL_GL !== 'undefined' && RAZIEL_GL) || null;
  const FXP = () => (typeof RAZIEL_MOVES !== 'undefined' && RAZIEL_MOVES && RAZIEL_MOVES.FXP) || null;
  const FG = () => { try { if (flag('__GG_GL') === 0 || flag('__DUN_GL') === 0) return null; const F = HAS_W && window.NIDHOGG_MOVES && window.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const STATS = { passes: 0, items: 0, meshes: 0, built: 0, freed: 0 };
  // ---- 3x3 (row-major) and vectors ----
  const mm = (A, B) => { const R = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return R; };
  const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
  const ry = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
  const rz = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
  const mv = (R, v) => [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const len = a => Math.hypot(a[0], a[1], a[2]), norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // a frame whose x is along d (z as near up as it can be), scaled by sx along x: columns x, y, z -> row-major
  const frameX = (d, up, sx) => { const x = norm(d); let y = cross(up || [0, 0, 1], x); if (len(y) < 1e-4) y = cross([0, 1, 0], x); y = norm(y); const z = cross(x, y), k = sx || 1; return [x[0] * k, y[0], z[0], x[1] * k, y[1], z[1], x[2] * k, y[2], z[2]]; };
  const frameZ = (d, sc) => { const z = norm(d); let x = cross([0, 1, 0], z); if (len(x) < 1e-4) x = cross([1, 0, 0], z); x = norm(x); const y = cross(z, x), k = sc || 1; return [x[0] * k, y[0] * k, z[0] * k, x[1] * k, y[1] * k, z[1] * k, x[2] * k, y[2] * k, z[2] * k]; };
  const bez = (P, u) => { const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u; return [0, 1, 2].map(i => a * P[0][i] + b * P[1][i] + c * P[2][i] + d * P[3][i]); };
  const bezD = (P, u) => { const v = 1 - u, a = -3 * v * v, b = 3 * v * v - 6 * u * v, c = 6 * u * v - 3 * u * u, d = 3 * u * u; return [0, 1, 2].map(i => a * P[0][i] + b * P[1][i] + c * P[2][i] + d * P[3][i]); };

  function ok() { if (flag('__GG_GL') === 0) return false; const R = RZ(); try { return !!(R && R.usable() && typeof GLM !== 'undefined' && GLM.ok()); } catch (e) { return false; } }

  /* ======================= the meshes (model units; built once, in Raziel's materials) ======================= */
  let M = null;
  function build() {
    if (M) return M; if (typeof GLM === 'undefined' || !GLM.builder) return null;
    const q = lowFx() ? 0.7 : 1, mk = f => { const B = GLM.builder(q); f(B); STATS.meshes++; return B.done(); };
    const latheZ = (B, prof, seg, c) => { B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], c || [0, 0, 0]); B.lathe(prof, prof[0][2], { seg: seg || 18, edge: j => prof[j][3] || 0 }); B.pop(); };
    // a conduit along a polyline (603: its aux runs 0 .. 1 along it, so the charge's front travels it)
    const conduit = (B, pts, r, a0, a1) => { const n = pts.length; B.surf((u, v) => { const f = u * (n - 1), i = Math.min(n - 2, Math.floor(f)), w = f - i, p = add(mul(pts[i], 1 - w), mul(pts[i + 1], w)), T = norm(sub(pts[i + 1], pts[i])); let X = cross(T, [0, 0, 1]); if (len(X) < 1e-3) X = cross(T, [1, 0, 0]); X = norm(X); const Y = cross(T, X), ph = v * TAU; return add(p, add(mul(X, Math.cos(ph) * r), mul(Y, Math.sin(ph) * r))); }, Math.max(4, (n - 1) * 4), 6, () => MT.CH, { flip: true, e: () => 0.2, a: u => lerp(a0 == null ? 0 : a0, a1 == null ? 1 : a1, u) }); };
    M = {};
    /* the wall bastion a guardian's neck emerges from: a ribbed plinth, armoured blocks stepping up into the temple wall, the heavy
       collar of the neck's socket (its recess lit by the element), pistons and conduits on its face (x toward the chamber) */
    M.housing = mk(B => {
      B.box([-1.7, 0, 0.9], [1.5, 2.7, 0.9], 0.16, MT.TI + 0.2);
      B.box([-1.95, 0, 2.75], [1.25, 2.3, 1.05], 0.22, MT.CER);
      B.box([-2.3, 0, 4.45], [0.95, 1.8, 0.75], 0.24, MT.CER + 0.3);
      B.box([-0.55, 0, 1.85], [0.18, 2.5, 0.12], 0.05, MT.MET);
      B.box([-0.75, 0, 3.85], [0.16, 2.1, 0.1], 0.05, MT.MET + 0.2);
      for (const sg of [-1, 1]) { B.box([-0.95, sg * 2.45, 2.9], [0.55, 0.28, 1.6], 0.12, MT.CER + 0.2); B.box([-0.7, sg * 2.62, 2.9], [0.18, 0.08, 1.35], 0.04, MT.MET);
        B.tube([-0.35, sg * 1.75, 0.4], [0.25, sg * 1.15, 2.55], 0.17, 0.15, MT.MET, { seg: 10 }); B.tube([-0.45, sg * 1.8, 0.2], [-0.3, sg * 1.75, 0.95], 0.26, 0.26, MT.TI, { seg: 10, cap1: 'flat' });
        conduit(B, [[-0.42, sg * 2.2, 0.25], [-0.36, sg * 2.1, 1.7], [-0.2, sg * 1.45, 2.85], [0.02, sg * 0.95, 3.35]], 0.085); }
      B.torX([0.15, 0, 3.4], 0.98, 0.24, MT.MET, { seg: 30, rseg: 8 }); B.torX([-0.2, 0, 3.4], 1.2, 0.13, MT.MET + 0.2, { seg: 30, rseg: 6 });
      B.tube([-0.9, 0, 3.4], [0.1, 0, 3.4], 0.86, 0.82, MT.TI + 0.3, { seg: 22, cap0: 'flat' });
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; B.box([0.2, Math.cos(a) * 1.0, 3.4 + Math.sin(a) * 1.0], [0.16, 0.09, 0.09], 0.03, MT.TI); }
      B.crystal([-2.3, 0, 5.1], [-2.3, 0, 6.3], 0.32, MT.CRY + 0.2, { n: 5, seed: 2 });
    });
    // the solar / cryogenic wheel set into the bastion's face: a toothed ring and its spokes (axis z), turned as it runs
    M.wheel = mk(B => { B.tor([0, 0, 0], 1.75, 0.13, MT.MET, { seg: 48, rseg: 6, teeth: 28, tooth: 0.13 }); B.tor([0, 0, 0], 1.3, 0.07, MT.RUNE, { seg: 40, rseg: 4 }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; B.tube([Math.cos(a) * 0.35, Math.sin(a) * 0.35, 0], [Math.cos(a) * 1.65, Math.sin(a) * 1.65, 0], 0.07, 0.05, MT.TI, { seg: 6 }); } B.sph([0, 0, 0], 0.36, MT.CRY + 0.2, 10); });
    /* a neck vertebra (x 0 .. 1 along the neck): a ribbed core, a collar, a dorsal armour plate with a crest blade, side plates,
       actuator rods and a conduit underneath */
    M.vert = mk(B => {
      B.tube([0.02, 0, 0], [0.98, 0, 0], 0.37, 0.33, MT.TI + 0.2, { seg: 14 });
      B.torX([0.16, 0, 0], 0.45, 0.1, MT.MET, { seg: 20, rseg: 6 });
      B.ell([0.52, 0, 0.2], [0.5, 0.42, 0.26], MT.CER, { seg: 14, rings: 7 });
      B.spike([0.5, 0, 0.42], [0.18, 0, 0.92], 0.09, MT.FANG);
      for (const sg of [-1, 1]) { B.box([0.55, sg * 0.39, -0.02], [0.3, 0.06, 0.2], 0.04, MT.CER + 0.2); B.tube([0.1, sg * 0.28, -0.24], [0.92, sg * 0.28, -0.26], 0.05, 0.05, MT.MET, { seg: 6 }); }
      conduit(B, [[0, 0, -0.36], [0.5, 0, -0.38], [1, 0, -0.36]], 0.07);
    });
    // a piston (x 0 .. 1, scaled to its length)
    M.piston = mk(B => { B.tube([0, 0, 0], [0.55, 0, 0], 0.13, 0.13, MT.TI, { seg: 10, cap0: 'flat' }); B.tube([0.5, 0, 0], [1, 0, 0], 0.075, 0.075, MT.MET, { seg: 8, cap1: 'round' }); });
    // an armour panel (unfolds at The Paradox, breaks away at the end)
    M.panel = mk(B => { B.box([0, 0, 0], [0.55, 0.08, 0.42], 0.06, MT.CER + 0.3); B.box([0, 0.06, 0.38], [0.5, 0.05, 0.05], 0.02, MT.MET); B.box([0.48, 0.05, 0], [0.05, 0.05, 0.36], 0.02, MT.MET); });
    /* a containment pillar: the reinforced base (an octagonal lathe), four posts (each its own: they fall apart), the cap with its finial */
    M.pbase = mk(B => { latheZ(B, [[0, 1.42, MT.TI], [0.22, 1.42, MT.TI, 1], [0.28, 1.3, MT.MET, 1], [0.48, 1.24, MT.CER + 0.3], [0.56, 1.16, MT.MET, 1], [0.7, 1.02, MT.CER], [0.82, 0.92, MT.MET, 1], [0.86, 0.5, MT.TI + 0.3], [0.88, 0.0, MT.TI + 0.3]], 8);
      for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU; B.box([Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0.38], [0.1, 0.1, 0.12], 0.03, MT.MET); } });
    M.ppost = mk(B => { B.box([0, 0, 1.45], [0.14, 0.17, 1.45], 0.05, MT.MET); B.box([-0.12, 0, 1.45], [0.04, 0.12, 1.2], 0.02, MT.CER + 0.3); conduit(B, [[-0.17, 0, 0.1], [-0.17, 0, 2.8]], 0.045); B.box([0, 0, 1.5], [0.24, 0.22, 0.12], 0.04, MT.TI); B.box([0, 0, 0.1], [0.22, 0.24, 0.12], 0.04, MT.TI); });
    M.pcap = mk(B => { B.tor([0, 0, 0], 1.12, 0.15, MT.MET, { seg: 32, rseg: 6 }); B.tor([0, 0, 0.13], 0.9, 0.08, MT.CER, { seg: 28, rseg: 5 }); for (let i = 0; i < 4; i++) { const a = (i + 0.5) / 4 * TAU; B.tube([Math.cos(a) * 1.0, Math.sin(a) * 1.0, 0.05], [Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0.55], 0.06, 0.05, MT.MET, { seg: 6 }); }
      B.tube([0, 0, 0.4], [0, 0, 0.75], 0.24, 0.12, MT.TI, { seg: 10 }); B.crystal([0, 0, 0.65], [0, 0, 1.45], 0.17, MT.CRY + 0.2, { n: 5, seed: 7 }); });
    /* the Gemini Gate: its great ring standing on the chamber's north rim (axis y, toward the viewer), an armour plate (twelve round it,
       sliding apart as it opens), the two pylons (gold west, platinum east), the base and its six sockets */
    M.gring = mk(B => { B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]);
      B.tor([0, 0, 0], 2.75, 0.34, MT.MET, { seg: 64, rseg: 10 }); B.tor([0, 0, 0], 2.36, 0.12, MT.CER, { seg: 56, rseg: 6 }); B.tor([0, 0, 0], 2.18, 0.06, MT.RUNE, { seg: 56, rseg: 4 }); B.tor([0, 0, 0], 3.15, 0.1, MT.TI, { seg: 64, rseg: 5, teeth: 36, tooth: 0.12 }); B.pop(); });
    M.gplate = mk(B => { B.box([0, 0, 0], [0.62, 0.3, 0.36], 0.1, MT.CER + 0.3); B.box([0, 0.02, 0.33], [0.58, 0.28, 0.05], 0.03, MT.MET); B.box([0, -0.28, 0], [0.5, 0.04, 0.3], 0.02, MT.TI + 0.2); });
    M.gpylon = mk(B => { B.box([0, 0, 0.5], [0.75, 0.75, 0.5], 0.14, MT.TI + 0.2); B.box([0, 0, 2.6], [0.5, 0.5, 1.6], 0.14, MT.CER); B.box([0, 0.45, 2.6], [0.38, 0.06, 1.35], 0.03, MT.CER + 0.3); B.box([0, 0, 4.3], [0.62, 0.62, 0.18], 0.06, MT.MET); B.box([0, 0, 1.05], [0.62, 0.62, 0.1], 0.04, MT.MET);
      conduit(B, [[0.3, 0.52, 1.1], [0.3, 0.52, 4.1]], 0.05); conduit(B, [[-0.3, 0.52, 1.1], [-0.3, 0.52, 4.1]], 0.05); B.crystal([0, 0, 4.4], [0, 0, 5.6], 0.3, MT.CRY + 0.2, { n: 6, seed: 4 }); });
    M.gbase = mk(B => { B.box([0, 0, 0.18], [4.4, 1.05, 0.18], 0.1, MT.TI + 0.2); B.box([0, 0.15, 0.45], [3.5, 0.75, 0.12], 0.08, MT.CER); B.box([0, 0.85, 0.36], [3.6, 0.06, 0.05], 0.02, MT.MET); });
    M.socket = mk(B => { latheZ(B, [[0, 0.3, MT.MET], [0.12, 0.32, MT.MET, 1], [0.18, 0.22, MT.TI], [0.2, 0.0, MT.TI]], 10); B.sph([0, 0, 0.32], 0.2, MT.CRY + 0.2, 10); });
    STATS.built++; return M;
  }
  function release() { if (!M) return; for (const k in M) { try { if (typeof GLM !== 'undefined' && GLM.free) GLM.free(M[k]); } catch (e) {} } STATS.freed++; M = null; }
  function gpuCount() { if (!M) return 0; let n = 0; for (const k in M) if (M[k] && M[k].gl) n++; return n; }
  /* warm(): Raziel's meshes and program, this file's meshes built and drawn once into a small canvas (so every buffer is uploaded and the
     program is ready before the trial: no hitch on the first frame a machine is seen) */
  let PRE = null;
  function warm() { const R = RZ(); try { if (R && R.warm) R.warm(); } catch (e) {} if (!ok()) return false; try { build(); } catch (e) { return false; }
    try { if (typeof document !== 'undefined' && R.ready && R.ready()) { PRE = PRE || document.createElement('canvas'); PRE.width = PRE.height = 96; const c = PRE.getContext('2d'), L = [];
        for (const k in M) L.push({ m: 'mesh', mesh: M[k], X: 48, Y: 60, z: 300, s: 6, R: rz(0), a: 1, side: 'L', r: 40 }); L.push({ m: 'head', X: 48, Y: 48, z: 300, s: 6, R: rz(0), a: 1, side: 'R', k: 3, jaw: 0.5 }); R.drawParts(c, L, { res: 0.5 }); PRE.width = PRE.height = 1; } } catch (e) {}
    return true; }

  /* ======================= the guardian's rig (pure) =======================
     G: { side 'L' | 'R', mx, my (the bastion's floor point, world tiles), base (heading of its face: 0 east, PI west), yaw (the head's
     heading, world model angle), pitch (down +), reach 0..1.6 (how far the neck extends into the chamber), lift (head height offset),
     jaw 0..1, charge 0..1, recoil 0..1, awake 0..1, tremble 0..1, unfold 0..1, dead 0..1, ring (spin speed), t } */
  const HEADK = 1.32;   // (the head drawn larger than its neck: the skull is Raziel's at 1.32x the guardian's unit)
  function solveGuardian(G) {
    const B = G.base || 0, RB = rz(B), aw = cl(G.awake == null ? 1 : G.awake), dead = cl(G.dead || 0), t = G.t || 0, tr = (G.tremble || 0);
    const reach = G.reach || 0, lift = G.lift || 0;
    // the head's origin (its neck joint), local: forward of the collar, rising; dormant it sinks and draws back
    const sleep = 1 - aw * (1 - dead * 0.85);
    const shake = tr > 0 ? [Math.sin(t * 37) * 0.08 * tr, Math.sin(t * 29 + 1) * 0.08 * tr, Math.sin(t * 41 + 2) * 0.06 * tr] : [0, 0, 0];
    let yawL = (G.yaw == null ? B : G.yaw) - B; yawL = Math.atan2(Math.sin(yawL), Math.cos(yawL)); yawL = Math.max(-1.05, Math.min(1.05, yawL)) * (1 - sleep * 0.7);
    const fwd = [Math.cos(yawL), Math.sin(yawL), 0];
    const H = add(add([4.0 + reach * 2.2 - sleep * 1.4 - (G.recoil || 0) * 0.5, 0, 5.0 + lift - sleep * 1.2 + reach * 0.2], mul(fwd, 0.5 + reach * 0.8)), shake); H[1] *= 0.9;
    const pitch = Math.max(-0.1, Math.min(0.42, G.pitch == null ? 0.25 : G.pitch)) * (1 - sleep) + sleep * 0.55 - (G.recoil || 0) * 0.3;
    const Rh = mm(rz(yawL), ry(pitch));
    const C0 = [0.35, 0, 3.4], hb = sub(H, mul(mv(Rh, [1, 0, 0]), 0.35));
    const NP = [C0, add(C0, [1.5, 0, 1.6 - sleep * 0.8]), add(sub(hb, mul(mv(Rh, [1, 0, 0]), 1.5)), [0, 0, 0.9 - sleep * 0.5]), hb];
    const N = 7, verts = [];
    for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N, p0 = bez(NP, u0), p1 = bez(NP, u1); verts.push({ p: p0, d: sub(p1, p0), u: (i + 0.5) / N }); }
    const mouthL = add(H, mv(Rh, mul([2.85, 0, -0.32 - 0.15 * (G.jaw || 0)], HEADK))), eyeA = add(H, mv(Rh, mul([1.0, 0.96, 0.45], HEADK))), eyeB = add(H, mv(Rh, mul([1.0, -0.96, 0.45], HEADK))), throat = add(H, mv(Rh, mul([0.4, 0, -0.3], HEADK)));
    const crownC = bez(NP, 0.72), crownD = bezD(NP, 0.72);
    const W = p => { const q = mv(RB, p); return { x: G.mx + q[0] * U, y: G.my + q[1] * SE * U, h: q[2] * U, q }; };   // local model -> world tiles (h height)
    const mo = W(mouthL), fw = mv(RB, mv(Rh, [1, 0, 0]));
    return { RB, Rh, H, hb, NP, verts, mouthL, eyeA, eyeB, throat, crownC, crownD, W, yawL, pitch, sleep,
      mouth: { x: mo.x, y: mo.y, h: mo.h, q: mo.q, dx: fw[0], dy: fw[1] * SE }, head: W(H), throatW: W(throat) };
  }
  // world -> screen (and a depth: larger nearer) in the pass's own frame
  const proj = (V, x, y, h) => ({ X: V.sx(x), Y: V.sy(y) - CE * V.T * (h || 0), z: V.T * (CE / SE * y + SE * (h || 0)) });

  /* ======================= drawing ======================= */
  const L_EYE = '#FFC060', R_EYE = '#8FE8FF', L_HOT = '#FF8A2A', R_HOT = '#3FA8FF';
  function pass(c, list, o) { const R = RZ(); if (!R || !list.length) return false; STATS.passes++; STATS.items += list.length; try { return !!R.drawParts(c, list, o || {}); } catch (e) { return false; } }
  /* a guardian: one GL pass (the bastion, its wheel, the neck, pistons, panels, the crown ring, the head) then its light */
  function guardian(c, G, V) {
    if (!ok() || !build()) return null; const rig = solveGuardian(G), s = V.T * U, t = V.t || 0, side = G.side === 'R' ? 'R' : 'L', fire = side === 'L', B0 = V.sx(G.mx), Y0 = V.sy(G.my), zr = V.T * CE / SE * G.my;
    const P = q => { const w = mv(rig.RB, q); return [B0 + s * w[0], Y0 + s * (SE * w[1] - CE * w[2]), 300 + s * (CE * w[1] + SE * w[2])]; };
    const RW = R => mm(rig.RB, R), aw = cl(G.awake == null ? 1 : G.awake), dead = cl(G.dead || 0), ch = cl(G.charge || 0), unf = cl(G.unfold || 0), ring = G.ring == null ? 1 : G.ring, L = [];
    const al = G.alpha == null ? 1 : G.alpha;
    const put = (m, q, R, sc, o) => { const p = P(q); L.push(Object.assign({ m, X: p[0], Y: p[1], z: p[2], s: s * (sc || 1), R: RW(R), a: al, side }, o || {})); };
    put('mesh', [0, 0, 0], rz(0), 1, { mesh: M.housing, g: 0.25 + 0.4 * aw * (1 - dead), g2: ch * 0.8, kind: 0, r: s * 6.5 });
    put('mesh', [-1.0, 0, 3.4], mm(ry(PI / 2), rz(t * 0.35 * ring * aw * (fire ? 1 : -1))), 0.85, { mesh: M.wheel, g: 0.3 + 0.5 * aw, r: s * 2 });
    // the neck: each vertebra along the curve, scaled to its stretch, lit as the charge runs from the bastion to the jaw
    for (const v of rig.verts) put('mesh', v.p, frameX(v.d, [0, 0, 1], len(v.d)), 1, { mesh: M.vert, g: 0.2 + 0.3 * aw, g2: ch, kind: v.u, r: s * 1.4 });
    // pistons from the bastion to the second and fourth vertebrae (the actuators that swing the neck)
    for (const sg of [-1, 1]) for (const k of [1, 3]) { const a = [0.1, sg * 1.2, 2.55 - k * 0.2], b = add(rig.verts[k].p, [0, sg * 0.32, -0.15]), d = sub(b, a); put('mesh', a, frameX(d, [0, 0, 1], len(d)), 1, { mesh: M.piston, g: 0.1, r: s * 3 }); }
    // the armour panels round the head's base: closed over the neck, unfolding at The Paradox, falling away at the end
    for (let i = 0; i < 4; i++) { const sg = i % 2 ? 1 : -1, up = i < 2 ? 1 : -1, v = rig.verts[5], fall = dead > 0.4 && (i === 1 || i === 2) ? ss(0.4, 1, dead) : 0;
      const off = [0.1, sg * (0.55 + 0.5 * unf), up * (0.25 + 0.35 * unf) - fall * 2.6], Rp = mm(frameX(v.d, [0, 0, 1], 1), mm(rx(sg * (0.4 + 0.9 * unf) + fall * 2), rz(fall * 0.8 * sg)));
      put('mesh', add(v.p, off), Rp, 0.9, { mesh: M.panel, g: 0.1, g2: ch * 0.5, a: al * (1 - ss(0.8, 1, fall)), r: s * 1.2 }); }
    // the celestial containment ring round the neck (Raziel's Mirror Crown), spinning with its rate
    { const sp = t * (0.8 + 2.4 * ring) * aw * (1 - ss(0.6, 1, dead)); put(fire ? 'crownL' : 'crownR', rig.crownC, frameZ(rig.crownD, 1), 1.05, { t: sp, g: 0.3 + 0.7 * aw * (1 - dead) + ch * 0.6, h: unf * 0.6 }); }
    put(fire ? 'ringL' : 'ringR', [0.15, 0, 3.4], mm(ry(PI / 2), rz(-t * 0.6 * ring * aw)), 1.15, { g: 0.2 + 0.4 * aw });
    // the head (Raziel's skull and jaw): its glow the eyes and seams, its g2 the charge (Lux's seams white-hot, frost over Umbra)
    { const p = P(rig.H); L.push({ m: 'head', X: p[0], Y: p[1], z: p[2], s: s * HEADK, R: RW(rig.Rh), a: al, side, k: 3, jaw: cl(G.jaw == null ? 0.18 : G.jaw), g: (0.2 + 0.8 * aw) * (1 - dead * 0.9), g2: Math.max(ch, G.frost || 0) }); }
    // the frost that covers the fire guardian at the end (Umbra's ice formations on it), the shards torn from the ice one
    if (fire && (G.frost || 0) > 0.02) { const f = G.frost; for (let i = 0; i < 5; i++) { const q = i < 3 ? bez(rig.NP, 0.35 + i * 0.25) : add(rig.H, mv(rig.Rh, [0.9 + (i - 3) * 0.9, (i % 2 ? 0.5 : -0.5), 0.6])), p = P(q); L.push({ m: 'spire', X: p[0], Y: p[1], z: p[2] + 2, s: s * 0.32, yaw: i * 1.7, a: al, side: 'R', g: 0.5, h: cl(f * 1.4 - i * 0.12) }); } }
    const drew = pass(c, L, { res: G.res });
    const eyes = [P(rig.eyeA), P(rig.eyeB)], mouth = P(rig.mouthL), throat = P(rig.throat), head = P(rig.H);
    const A = { eyes, mouth: { X: mouth[0], Y: mouth[1], x: rig.mouth.x, y: rig.mouth.y, h: rig.mouth.h }, throat: { X: throat[0], Y: throat[1] }, head: { X: head[0], Y: head[1] }, crown: (() => { const p = P(rig.crownC); return { X: p[0], Y: p[1] }; })(), collar: (() => { const p = P([0.35, 0, 3.4]); return { X: p[0], Y: p[1] }; })(), drew, rig, s };
    if (!V.defer) lights(c, G, A, V); return A;
  }
  // a guardian's own light (FGFX): its eyes, the conduits' charge, the throat; the wheel's hub; dormant it is dark
  function lights(c, G, A, V, Q0) {
    const F = G.noLight ? null : FG(); if (!F || !A) return; const fire = G.side !== 'R', aw = cl(G.awake == null ? 1 : G.awake), dead = cl(G.dead || 0), ch = cl(G.charge || 0), T = V.T, lk = cl(G.lockFlash || 0), lf = lowFx(), al = G.alpha == null ? 1 : G.alpha;
    try { if (!Q0) F.flush(c); const Q = Q0 || F.begin(c, null), X2 = FXP(), eye = fire ? L_EYE : R_EYE, hot = fire ? L_HOT : R_HOT, ek = (0.25 + 0.75 * aw) * (1 - dead) * al;
      for (const e of A.eyes) { Q.glow(e[0], e[1], T * (0.34 + 0.25 * ch + 0.9 * lk), eye, Math.min(1, (0.5 + 0.4 * ch + 0.6 * lk) * ek)); Q.glow(e[0], e[1], T * 0.12, '#FFFFFF', 0.7 * ek); }
      if (ek > 0.05) Q.glow(A.collar.X, A.collar.Y, T * 1.3, hot, (0.12 + 0.3 * ch) * ek);
      if (ch > 0.02 && X2) { X2.charge(Q, A.mouth.X, A.mouth.Y, T * (0.45 + 0.6 * ch), fire ? 'L' : 'R', ch, Math.min(1, 0.4 + ch) * al, fire ? 1 : 2); Q.glow(A.throat.X, A.throat.Y, T * 0.9, hot, 0.3 * ch * al); if (!fire && !lf) Q.smoke(A.head.X - T * 0.3, A.head.Y - T * 0.2, T * (0.6 + 0.6 * ch), 0.22 * ch * al, 3, '#CFEFFF', 0.5); if (fire && !lf) Q.shimmer(A.mouth.X, A.mouth.Y - T * 0.3, T * 0.9, 0.25 * ch * al, 0.8, '#FFA640'); }
      if (G.erupt > 0.01) { const k = G.erupt; Q.glow(A.collar.X, A.collar.Y, T * 2.2, fire ? '#FF3A2A' : '#2A6AFF', 0.5 * k); Q.glow(A.crown.X, A.crown.Y, T * 1.6, '#FFFFFF', 0.35 * k); if (X2 && !lf) { X2.embers(Q, A.collar.X, A.collar.Y - T, T * 2.2, (V.t * 0.4) % 1, 0.8 * k, 3, 0.8); X2.snow(Q, A.head.X, A.head.Y, T * 1.8, (V.t * 0.3) % 1, 0.6 * k, 5, 0.7, 0.9); } }
      if (!fire && (G.melt || 0) > 0.02 && X2) { const m = G.melt; X2.fireField(Q, A.head.X, A.head.Y + T * 0.3, T * 1.0, 1, 0.45 * m, 7, 0.6, 0.4); X2.embers(Q, A.head.X, A.head.Y, T * 1.3, (V.t * 0.25) % 1, 0.5 * m, 11, 0.5); }
      if (!Q0) { F.flush(c); F.begin(c, null); } } catch (e) {}
  }

  /* ======================= a pillar =======================
     P: { x, y (floor, world), el 'fire' | 'ice', rise 0..1, hit 0..1 (the opposing breath's work on it: melting / freezing, cracks),
     absorb 0..1 (a matching breath drunk in), fall 0..1 (the collapse), seed, t } */
  const POST_A = [0.25, 0.75, 1.25, 1.75].map(k => k * PI);
  function pillar(c, P, V) {
    if (!ok() || !build()) return false; const s = V.T * U, t = V.t || 0, fire = P.el === 'fire', side = fire ? 'L' : 'R', rise = cl(P.rise == null ? 1 : P.rise), hit = cl(P.hit || 0), fall = cl(P.fall || 0), ab = cl(P.absorb || 0), sd = P.seed || 0;
    if (rise < 0.01) return true; const b = proj(V, P.x, P.y, 0), sink = (1 - ss(0, 1, rise)) * 4.4, L = [];
    const Pq = q => [b.X + s * q[0], b.Y + s * (SE * q[1] - CE * (q[2] - sink)), 300 + s * (CE * q[1] + SE * (q[2] - sink))];
    const g0 = 0.35 + 0.5 * (1 - hit) * (1 - fall) + ab * 0.8, wob = hit * (0.25 + 0.5 * Math.sin(t * 23 + sd)), flt = fall;
    const pa = P.alpha == null ? 1 : P.alpha, put = (m, q, R, sc, o) => { const p = Pq(q), e = Object.assign({ m, X: p[0], Y: p[1], z: p[2], s: s * (sc || 1), R, a: 1, side }, o || {}); e.a *= pa; L.push(e); };
    // the base stays (its rubble at the end); the posts lean out and fall, the cap drops, the core bursts
    put('mesh', [0, 0, 0], rz(sd), 1, { mesh: M.pbase, g: g0 * 0.6, g2: fire ? 0 : hit * 0.6, r: s * 2.2 });
    for (let i = 0; i < 4; i++) { const a = POST_A[i] + sd, k = ss(i * 0.08, 0.55 + i * 0.08, flt), out = [Math.cos(a), Math.sin(a), 0], Rf = mm(rz(a), ry(k * (1.35 + 0.2 * hh(i, sd * 7)))), drop = k * k * 0.3;
      if (k > 0.97) continue; put('mesh', add(mul(out, 1.08 + k * 0.4), [0, 0, 0.82 - drop]), Rf, 1, { mesh: M.ppost, g: g0, g2: hit * 0.8, kind: 0.5, a: 1 - ss(0.8, 0.97, k), r: s * 3.4 }); }
    { const k = ss(0, 0.5, flt), z = 3.72 - k * k * 3.2 + (P.jolt || 0) * 0.15; if (k < 0.98) put('mesh', [k * 0.6, k * 0.2, z], mm(rz(t * 0.15 + sd), rx(k * 1.2)), 1, { mesh: M.pcap, g: g0, a: 1 - ss(0.7, 0.98, k), r: s * 2 }); }
    // the core: Raziel's plasma sun (fire) or crystal planet (ice), its rings: steady, destabilising as the opposing breath works on it
    { const coreK = 1 - ss(0.05, 0.35, flt), z = 2.25 + Math.sin(t * 1.3 + sd) * 0.05; if (coreK > 0.02) { const jit = wob * (hh(Math.floor(t * 18), sd * 3 + 1) - 0.5) * 0.4;
        put(fire ? 'sun' : 'planet', [jit, 0, z], rz(0), 0.5 * (1 + 0.25 * ab - 0.25 * hit) * coreK, { t: t * (1 + 4 * hit) + sd + wob * 3, g: fire ? (1.2 - 0.9 * hit + ab * 0.6) : (0.6 + 0.8 * hit + ab * 0.4), a: 1 }); } }
    // frost seizing a fire pillar (ice formations climbing it), crystals at an ice pillar's foot
    if (fire && hit > 0.05) for (let i = 0; i < 4; i++) { const a = POST_A[i] + sd + 0.4; put('spire', [Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0.5 + 0.9 * (i % 2)], rz(a), 0.28 + 0.12 * hit, { yaw: a, side: 'R', g: 0.5, h: cl(hit * 1.6 - i * 0.15), a: 1 - ss(0.3, 0.8, flt) }); }
    if (!fire) for (let i = 0; i < 3; i++) { const a = sd * 3 + i * 2.1; put('spire', [Math.cos(a) * 1.35, Math.sin(a) * 1.35, 0.1], rz(a), 0.3, { yaw: a, side: 'R', g: 0.4, h: 0.7 * (1 - hit * 0.6) * (1 - ss(0.2, 0.7, flt)) }); }
    // the debris: frozen mechanical fragments, molten and crystalline pieces, thrown out and falling (one pass with the rest)
    if (flt > 0.02) { const n = lowFx() ? 7 : 12; for (let i = 0; i < n; i++) { const a = hh(i, sd * 13) * TAU, v = 1.2 + hh(i, sd * 17) * 2.2, up = 2.2 + hh(i, sd * 19) * 2.5, u = flt * 1.4, z0 = 1.2 + hh(i, 3) * 2.2;
        const z = Math.max(0.12, z0 + up * u - 4.6 * u * u), r = v * u, ice = fire ? i % 3 !== 0 : i % 2 === 0; put(ice ? 'shard' : 'ember', [Math.cos(a) * r, Math.sin(a) * r, z], mm(rz(a + u * 5), rx(u * 4 + i)), (ice ? 0.32 : 0.26) * (0.7 + hh(i, 5) * 0.6), { yaw: a + u * 5, tilt: u * 4 + i, side: 'R', g: ice ? 0.6 : 1.2 * (1 - flt), a: 1 - ss(0.75, 1, flt) }); } }
    return pass(c, L, { res: P.res });
  }

  /* the rubble of the collapsed pillars (their broken bases and a few fragments lying round them), every one in ONE pass under the floor's
     objects (low enough not to hide the pet): list = [{ x, y, el, seed }] */
  function rubble(c, list, V) {
    if (!ok() || !build() || !list.length) return false; const s = V.T * U, L = [];
    for (const P of list) { const b = proj(V, P.x, P.y, 0), side = P.el === 'fire' ? 'L' : 'R', sd = P.seed || 0, Pq = q => [b.X + s * q[0], b.Y + s * (SE * q[1] - CE * q[2]), 300 + s * (CE * q[1] + SE * q[2])], put = (m, q, R, sc, o) => { const p = Pq(q); L.push(Object.assign({ m, X: p[0], Y: p[1], z: p[2], s: s * (sc || 1), R, a: 1, side }, o || {})); };
      put('mesh', [0, 0, 0], rz(sd), 1, { mesh: M.pbase, g: 0.15, r: s * 2.2 });
      for (let i = 0; i < 5; i++) { const a = hh(i, sd * 13) * TAU, r = 1.5 + hh(i, sd * 17) * 1.4, ice = P.el === 'fire' ? i % 2 === 0 : i % 3 === 0; put(ice ? 'shard' : 'ember', [Math.cos(a) * r, Math.sin(a) * r, 0.12], mm(rz(a), rx(1.4 + i)), (ice ? 0.3 : 0.24) * (0.7 + hh(i, 5) * 0.6), { side: 'R', g: ice ? 0.4 : 0.15 }); }
      for (let i = 0; i < 2; i++) { const a = POST_A[i * 2] + sd + 0.3; put('mesh', [Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0.18], mm(rz(a), ry(PI / 2 - 0.08)), 1, { mesh: M.ppost, g: 0.1, r: s * 3.4 }); } }
    return pass(c, L, { res: V.res });
  }

  /* ======================= the gate =======================
     D: { x, y (the base's floor centre), live: [6 bools] (its sockets: ice 0..2 west, fire 3..5 east), open 0..1, glow 0..2, spin, alpha, t } */
  function gate(c, D, V) {
    if (!ok() || !build()) return false; const s = V.T * U, t = V.t || 0, op = cl(D.open || 0), b = proj(V, D.x, D.y, 0), al = D.alpha == null ? 1 : D.alpha, L = [];
    const Pq = q => [b.X + s * q[0], b.Y + s * (SE * q[1] - CE * q[2]), 300 + s * (CE * q[1] + SE * q[2])];
    const put = (m, q, R, sc, o) => { const p = Pq(q); L.push(Object.assign({ m, X: p[0], Y: p[1], z: p[2], s: s * (sc || 1), R, a: al, side: 'B' }, o || {})); };
    const RC = 3.35, ry0 = rx(-PI / 2);   // (the ring's centre height; rx(-PI/2): a part's z axis turned to face the viewer, its y up)
    put('mesh', [0, 0, 0], rz(0), 1, { mesh: M.gbase, g: 0.3, r: s * 5 });
    for (const sg of [-1, 1]) put('mesh', [sg * 3.75, 0.1, 0.35], rz(0), 1, { mesh: M.gpylon, side: sg < 0 ? 'L' : 'R', g: 0.3 + 0.5 * (D.glow || 0), r: s * 6 });
    put('mesh', [0, 0, RC], rz(0), 1, { mesh: M.gring, g: 0.25 + 0.4 * (D.glow || 0), r: s * 4 });
    // the inner rings: Raziel's two Mirror Crowns, gold and platinum, turning against each other (faster as it opens)
    const sp = t * (0.2 + 1.6 * op);
    put('crownL', [0, 0.05, RC], mm(ry0, rz(sp)), 1.55, { side: 'L', t: sp, g: 0.4 + 0.8 * op, h: op * 0.5 });
    put('crownR', [0, 0.12, RC], mm(ry0, rz(-sp * 1.3)), 1.15, { side: 'R', t: -sp, g: 0.4 + 0.8 * op, h: op * 0.4 });
    // twelve armour plates round the ring: closed they lock over its rim; opening they slide out and swing apart
    for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU, k = ss(i % 2 ? 0.05 : 0.15, i % 2 ? 0.7 : 0.85, op), r = 2.95 + k * 1.25, sdd = Math.cos(a) < 0 ? 'L' : 'R';
      put('mesh', [Math.cos(a) * r, 0.15 + k * 0.3, RC + Math.sin(a) * r], mm(ry(-a + PI / 2), rx(k * 0.6 * (i % 2 ? 1 : -1))), 1, { mesh: M.gplate, side: sdd, g: 0.15, r: s * 1.2 }); }
    // the six sockets on the base's face: fire west, ice east (each lit while its pillar still feeds the seal)
    for (let i = 0; i < 6; i++) { const x = (i < 3 ? -1 : 1) * (1.0 + (i % 3) * 0.9); put('mesh', [x, 0.95, 0.5], rz(0), 0.9, { mesh: M.socket, side: i < 3 ? 'R' : 'L', g: D.live && D.live[i] ? 1.4 : 0.05, r: s }); }
    const drew = pass(c, L, { res: D.res });
    D.anc = { cc: Pq([0, 0, RC]), socks: [0, 1, 2, 3, 4, 5].map(i => Pq([(i < 3 ? -1 : 1) * (1.0 + (i % 3) * 0.9), 0.95, 0.85])), s, sp, op, al };
    if (!V.defer) gateLights(c, D, V);
    return drew;
  }
  // the gate's light: the sockets, the seal's heart (the Gemini sign) and, open, the portal (into the caller's FGFX batch Q0 when given)
  function gateLights(c, D, V, Q0) { const F = FG(), A = D.anc; if (!F || !A) return; const { cc, s, sp, op, al } = A;
    { try { if (!Q0) F.flush(c); const Q = Q0 || F.begin(c, null), X2 = FXP(), T = V.T;
        for (let i = 0; i < 6; i++) { if (!(D.live && D.live[i])) continue; const p = A.socks[i]; Q.glow(p[0], p[1], T * 0.6, i < 3 ? R_HOT : L_HOT, 0.55 * al); }
        const g = D.glow || 0; if (X2) { X2.seal(Q, cc[0], cc[1], s * 2.05, 'L', 1, sp * 0.3, (0.25 + 0.45 * g) * (1 - op * 0.6) * al, CE); X2.seal(Q, cc[0], cc[1], s * 1.6, 'R', 1, -sp * 0.4, (0.2 + 0.4 * g) * (1 - op * 0.6) * al, CE); }
        if (op > 0.02) { Q.glow(cc[0], cc[1], s * 2.4 * op, '#E8F4FF', 0.55 * op * al, CE); Q.glow(cc[0], cc[1], s * 1.2 * op, '#FFFFFF', 0.6 * op * al, CE); if (!lowFx()) Q.shimmer(cc[0], cc[1], s * 2.0 * op, 0.25 * op * al, CE, '#CFE8FF'); }
        if (!Q0) { F.flush(c); F.begin(c, null); } } catch (e) {} }
  }
  return { ok, warm, ready: () => !!M, release, gpuCount, build, solveGuardian, guardian, pillar, gate, rubble, lights, gateLights, proj, STATS, U, SE, CE, HEADK };
})();
if (typeof self !== 'undefined') self.GEMINI_GUARD = GEMINI_GUARD;
