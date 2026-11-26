/* ---------- (v463 SK) KHYROS THE HOUND BEYOND THE ANGLES in three dimensions (Rift 04, the Sepulchre's last boss: the Final Sanctuary) ----------
   The 2D hound of 20z3-rift-fiend-sepulchre-3.js rebuilt as a GPU model at Rift 03's bosses' fidelity (Thul-Ammon, 20y3; Kharrox, 20t3),
   on GB_KIT (20x2: vectors, the game camera, multi-copy meshes) and DUNE3's pass (20y2: one GPU pass into the box round the model, the
   light by name: this file adds the void's own, 'sepvoid'). Meshes built once (the loading screen's jobs, the fiend's preload; else on the
   first draw) and posed every frame along the fight's own skeleton (the 2D file's build(): its rings, legs, jaw and spears, so the
   model stands exactly where its hit areas are); one composite drawImage. Materials GLM 570..579 (SK-KHYROS-MAT, 20k5uz); the light of
   its moves on the FGFX painter (kinds 436..443, SK-FX in 20k6h). The fight keeps its acts, timings, shapes and damage; its warnings are
   light on the stone (the engine paints nothing of them: no outlined lanes, cones or circles, no numbers: the order of the Hunt's lanes
   is told by beads of light). Without WebGL (or on a software rasteriser, unless window.__SK_GL) or without the painter, the 2D hound,
   its 2D effects and the 2D arena overlay are drawn as before.
   The model (tiles; z up from the stone; the 2D skeleton's floor and height read through the game camera, y / GY and z / ZK, so its
   projection is the 2D one). Reworked (the second pass): one dense sculpted body over the skeleton's fifteen rings (rewritten in
   place every frame: a hound's mass, shoulders and haunches, ribs down the lower flanks, the neck's cords, the jaw's muscles, the
   ridge kept sharp), its hide polished obsidian in staggered plates, each of two facets turned its own way about a crease, grooves
   between, bevels edged in silver, violet runes engraved in some and the belly bare dark muscle; chevron armour plates down the spine,
   over the shoulders and haunches and on the skull, black glass blades between them; muscled limbs with greaves; six recessed violet slits down each flank, burning in a wave from
   shoulder to waist (white-hot when it is wedged); eyes of white-violet light high on the long crocodilian skull; a hinged lower jaw
   with a violet-lit mouth and silver teeth that bare as it opens; four legs as chains of flattened prisms bent back on themselves, angular
   knuckles at the joints, three silver-edged triangular claws to a foot; three loose spearheads of black glass hovering in line behind
   it, their edges burning violet. Its afterimages are thin violet wireframes of it on the painter; its shadow a soft dark on the stone.
   The arena's living pieces: the silver ring's light (shimmering while it holds, barred violet when stolen, gold while an echo holds the
   plate), the lit alcoves, the Memory Loom (a gold frame strung with threads on a round dais) and the release plate as 3D pictures. */
const KHY_GL = (() => {
  const K = GB_KIT, D3 = DUNE3, { TAU, cl, lerp, sstep, GY, ZK, vadd, vsub, vmul, vdot, vnrm, vcross, I3, frameXZ } = K, lowFx = K.lowFx, nowMs = K.nowMs;
  const win = k => { try { return typeof window !== 'undefined' ? window[k] : undefined; } catch (e) { return undefined; } };
  const VIOLET = '#8E6BD0', VIOLET_HI = '#C9B0FF', WHITE_V = '#F4ECFF', SILVER_HI = '#E4EAF2', GOLD = '#B2965D', GOLD_HI = '#E8CF8E', ROSE = '#FF6FB0', SHADE = '#06030C';
  const M_PLATE = 570, M_ARMOR = 570.2, M_LEG = 570.4, M_LIMB = 570.3, M_SLIT = 571, M_EYE = 572, M_MOUTH = 573, M_SILVER = 574, M_CLAW = 574.2, M_SPEAR = 575, M_GOLD = 577, M_THREAD = 577.2, M_STONE = 578, M_INLAY = 578.2;
  /* the void's light: a cold violet-white key from the upper left, a violet rim from behind and below (the stone's bounce) */
  D3.LIGHT.sepvoid = { lk: vnrm([-0.5, 0.3, 0.81]), ls: vnrm([0.32, 0.2, 0.92]), lr: vnrm([0.4, -0.85, 0.25]), key: [1.75, 1.66, 1.98], rim: [1.15, 0.78, 1.95] };
  const RIG = () => { try { return typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.khyros ? FIEND_DEFS.khyros.RIG : null; } catch (e) { return null; } };
  /* the model's GL state (as DUNE3.model, its own switch: window.__SK_GL = 1 forces the GPU on a software rasteriser, 0 keeps it off) */
  const KG = { name: 'Khyros', MESH: null, PB: {}, NOGL: false, fails: 0, last: 0, retry: 0, ms: 0, n: 0, box: null, meshMs: 0,
    fail() { const t = nowMs(); if (t - KG.last > 20000) KG.fails = 0; KG.last = t; KG.fails++; if (KG.fails >= 3) KG.NOGL = true; else KG.retry = t + 1500; },
    on() { if (KG.NOGL || (KG.retry && nowMs() < KG.retry) || typeof GLM === 'undefined' || win('__SK_GL') === 0 || !GLM.ok() || !RIG()) return false; if (GLM.soft && !win('__SK_GL')) return false;
      if (!KG.MESH) { try { const t0 = nowMs(); KG.MESH = buildMeshes(); KG.meshMs = nowMs() - t0; } catch (e) { KG.NOGL = true; if (typeof console !== 'undefined') console.warn('Khyros: meshes', e); return false; } } return true; },
    bounds(part) { let b = KG.PB[part]; if (b) return b; const M = KG.MESH && KG.MESH[part]; if (!M) return [[0, 0, 0], 1.6]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
      for (let i = 0; i < p.length; i += 3) { const x = p[i], y = p[i + 1], z = p[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      return (KG.PB[part] = [[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) + (z1 - z0) * (z1 - z0)) / 2]); },
    get tris() { return KG.MESH ? Object.values(KG.MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0; } };
  const fg = () => { try { if (win('__SK_FX') === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const gpu = () => KG.on() && !!fg();   // (the whole GPU path: the model and its light; else the 2D one, whole)

  /* ================= the meshes ================= */
  const NR = 15, NU = 64, NV = 36, NPL = 24, NFN = 10, LEGW = [0.42, 0.3, 0.2, 0.12], MASS = 1.28, VS = 1.6, UPV = 3.9, TNU = 22, TNV = 10;   // (VS: the model drawn 1.6x the 2D skeleton, scaled about its head (UPV along it): the head stays where the fight puts it)   // (the body's grid; the armour plates and blades; the legs' widths; the body's fullness over the 2D one)
  const sq = x => x * x, crv = (a, b, c, d, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  /* a mesh of loose quads (4 vertices each, flat), its positions and normals rewritten every frame; att set once */
  function quadMesh(nq) { const nv = nq * 4, idx = new Uint16Array(nq * 6); for (let q = 0; q < nq; q++) { const b = q * 4, o = q * 6; idx[o] = b; idx[o + 1] = b + 1; idx[o + 2] = b + 2; idx[o + 3] = b; idx[o + 4] = b + 2; idx[o + 5] = b + 3; }
    return { pos: new Float32Array(nv * 3), nrm: new Float32Array(nv * 3), att: new Float32Array(nv * 3), idx, nv, ntri: nq * 2, gl: null }; }
  function attQ(M, q, m, e4, a4) { for (let v = 0; v < 4; v++) { const o = (q * 4 + v) * 3; M.att[o] = m; M.att[o + 1] = e4[v]; M.att[o + 2] = a4[v]; } }
  // a quad's corners (model space) and its flat normal, turned away from ref
  function putQ(M, q, a, b, c, d, ref) { const P = M.pos, N = M.nrm, d1 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], d2 = [d[0] - b[0], d[1] - b[1], d[2] - b[2]];
    let nx = d1[1] * d2[2] - d1[2] * d2[1], ny = d1[2] * d2[0] - d1[0] * d2[2], nz = d1[0] * d2[1] - d1[1] * d2[0]; const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= l; ny /= l; nz /= l;
    if (ref) { const cx = (a[0] + b[0] + c[0] + d[0]) / 4 - ref[0], cy = (a[1] + b[1] + c[1] + d[1]) / 4 - ref[1], cz = (a[2] + b[2] + c[2] + d[2]) / 4 - ref[2]; if (nx * cx + ny * cy + nz * cz < 0) { nx = -nx; ny = -ny; nz = -nz; } }
    const o = q * 12; let k = o; for (const p of [a, b, c, d]) { P[k] = p[0]; P[k + 1] = p[1]; P[k + 2] = p[2]; N[k] = nx; N[k + 1] = ny; N[k + 2] = nz; k += 3; } }
  function buildMeshes() {
    const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {};
    /* the body (v463 SK rework): one dense sculpted surface over the skeleton's rings, rewritten in place every frame (nu along it, nv
       round it): the hound's mass under the armour, shoulders, haunches, ribs and neck cords; its plates, bevels, silver edging and runes
       drawn by its material from where a point is on it (vA.y round it 0..1 from the ridge, vA.z the ring / 15 along it) */
    { const B = nb(), nu = lowFx() ? 40 : NU, nv = lowFx() ? 24 : NV; B.surf((u, v) => [u, v, 0], nu, nv, () => M_PLATE, { e: (u, v) => v, a: u => u * (NR - 1) / 15 }); out.body = B.done(); out.body.nu = nu; out.body.nv = nv; }
    /* the slits (12) and the eyes (2): thin quads laid on the flanks and the skull (e across, aux the slit's index + along it) */
    { const M = quadMesh(14); for (let i = 0; i < 12; i++) { const s = i % 6; attQ(M, i, M_SLIT, [0, 1, 1, 0], [s, s, s + 0.98, s + 0.98]); } for (let i = 12; i < 14; i++) attQ(M, i, M_EYE, [0, 1, 1, 0], [0, 0, 0.98, 0.98]); out.lights = M; }
    /* the lower jaw: three intervals of a wedge (two outer faces, the mouth's roof 573) */
    { const M = quadMesh(9); for (let k = 0; k < 3; k++) { const a0 = 0.6 + k / 15, a1 = 0.6 + (k + 1) / 15; attQ(M, k * 3, M_PLATE, [0, 1, 1, 0], [1 + a0, 1 + a0, 1 + a1, 1 + a1]); attQ(M, k * 3 + 1, M_PLATE, [0, 1, 1, 0], [4 + a0, 4 + a0, 4 + a1, 4 + a1]); attQ(M, k * 3 + 2, M_MOUTH, [0, 1, 1, 0], [a0, a0, a1, a1]); } out.jaw = M; }
    /* the teeth: one small three-sided silver fang (along -z from its root), many copies placed every frame */
    { const B = nb(); B.tube([0, 0, 0], [0, 0, -1], 1, 0.02, M_SILVER, { seg: 3, cap0: 'flat', cap1: false, edge: 0.8 }); out.teeth = K.multi(B.done(), 24); }
    /* the legs' segments: muscled limbs along x 0..1 (a broad, flattened section, angular toward its edges, a muscle's swell on the
       upper ones), their greaves drawn by the material (570.3: vA.y round, vA.z along) */
    const BS = (RIG() || {}).BS || 0.85, LW = LEGW.map(k => k * BS), sgp = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e);
    for (let i = 0; i < 3; i++) { const B = nb(); B.surf((u, v) => { const x = -0.07 + u * 1.14, xc = cl(x), w = lerp(LW[i], LW[i + 1], xc) * (1 + [0.38, 0.24, 0.1][i] * Math.exp(-sq((x - [0.34, 0.3, 0.3][i]) / 0.24))) * (1 - 0.35 * sq(Math.max(0, Math.abs(x - 0.5) - 0.5) / 0.07)), a = v * TAU;
        return [x, sgp(Math.cos(a), 0.75) * w, sgp(Math.sin(a), 0.85) * w * 0.62]; }, 18, 14, () => M_LIMB, { e: (u, v) => v, a: u => 0.04 + i * 0.32 + u * 0.28, flip: true }); out['seg' + i] = B.done(); }
    /* an armour plate: a chevron of obsidian pointing to the snout (x toward the tail, z out of the hide), a raised crease down its middle,
       bevelled sides; its facets' rims silver. Many copies laid over the body every frame */
    { const B = nb(), O = [[-0.55, 0], [-0.12, 0.5], [0.5, 0.4], [0.32, 0], [0.5, -0.4], [-0.12, -0.5]], hT = 0.17, top = O.map(([x, y]) => [x * 0.9, y * 0.86, hT]), bot = O.map(([x, y]) => [x, y, 0]), Fr = [-0.52, 0, 0.27], Br = [0.3, 0, 0.25];
      B.facet([Fr, top[1], top[2], Br], M_ARMOR); B.facet([Fr, Br, top[4], top[5]], M_ARMOR); top[0] = Fr; top[3] = Br;
      for (let j = 0; j < 6; j++) { const j1 = (j + 1) % 6; B.facet([top[j], top[j1], bot[j1], bot[j]], M_ARMOR); } out.plates = K.multi(B.done(), NPL); }
    /* a knuckle: an angular octahedron (radius 1) */
    { const B = nb(), V = [[1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0]]; for (let j = 0; j < 4; j++) { const a = V[j], b = V[(j + 1) % 4]; B.facet([a, b, [0, 0, 0.9]], M_LEG); B.facet([b, a, [0, 0, -0.9]], M_LEG); } out.knuckle = B.done(); }
    /* the tail: a tube rewritten every frame along its curve (sagging, swaying), its plates drawn by the material (vA.z below 0) */
    { const B = nb(); B.surf((u, v) => [u, v, 0], TNU, TNV, () => M_PLATE, { e: (u, v) => v, a: u => -u * 2.4 / 15 }); out.tail = B.done(); }
    /* a horn blade: a curved four-faced blade of black glass along x (its edges burning violet) */
    { const B = nb(); B.crystal([0, 0, 0], [1, 0, 0], 0.17, M_SPEAR, { n: 4, thin: 0.5, bend: 0.32, belly: 0.2, base: 0.75, seed: 1.3 }); out.horn = B.done(); }
    /* a paw: a heavy pad and four big hooked claws, silver along their edges (x forward) */
    { const B = nb(); B.ell([0.06 * BS, 0, 0.08 * BS], [0.34 * BS, 0.27 * BS, 0.13 * BS], M_LEG, { seg: 12, rings: 6 }); B.ell([-0.12 * BS, 0, 0.16 * BS], [0.22 * BS, 0.2 * BS, 0.14 * BS], M_LEG, { seg: 10, rings: 5 });
      for (const a of [-0.6, -0.2, 0.2, 0.6]) { const ln = (Math.abs(a) < 0.3 ? 0.66 : 0.54) * BS, ca = Math.cos(a), sa = Math.sin(a), bw = 0.11 * BS, h = 0.12 * BS, x0 = 0.26 * BS, b0 = [x0 * ca, x0 * sa, 0.05 * BS], tip = [b0[0] + ca * ln, b0[1] + sa * ln, -0.04 * BS], l1 = [b0[0] + sa * bw, b0[1] - ca * bw, 0.02 * BS], l2 = [b0[0] - sa * bw, b0[1] + ca * bw, 0.02 * BS], top = [b0[0] + ca * ln * 0.25, b0[1] + sa * ln * 0.25, h];
        B.facet([l1, tip, top], M_CLAW); B.facet([tip, l2, top], M_CLAW); B.facet([l2, l1, top], M_CLAW); B.facet([l1, l2, tip], M_CLAW); } out.paw = B.done(); }
    /* (the old three-claw foot) */
    { const B = nb(); for (const k of [-1, 0, 1]) { const a = k * 0.45, ln = (k ? 0.5 : 0.62) * BS, ca = Math.cos(a), sa = Math.sin(a), bw = 0.085 * BS, h = 0.07 * BS, tip = [ca * ln, sa * ln, 0], l1 = [sa * bw, -ca * bw, 0], l2 = [-sa * bw, ca * bw, 0], top = [ca * 0.08 * BS, sa * 0.08 * BS, h];
        B.facet([l1, tip, top], M_CLAW); B.facet([tip, l2, top], M_CLAW); B.facet([l2, l1, top], M_CLAW); } out.claws = B.done(); }
    /* a dorsal blade: a thin swept-back fin of black glass along the ridge (x tail-ward, z up; many copies placed every frame) */
    { const B = nb(), Af = [-0.32, 0, 0], Bk = [0.34, 0, 0], Tp = [0.5, 0, 1], M1 = [0, 0.07, 0.06], M2 = [0, -0.07, 0.06]; B.facet([Af, M1, Tp], M_SPEAR); B.facet([M1, Bk, Tp], M_SPEAR); B.facet([Af, Tp, M2], M_SPEAR); B.facet([M2, Tp, Bk], M_SPEAR); out.fins = K.multi(B.done(), NFN); }
    /* a spearhead: a four-sided bipyramid along x (back -0.38 .. tip 0.62 of its length; scaled along x by its length) */
    { const B = nb(), w = 0.17 * BS, h = 0.12 * BS, R = [[0.05, 0, h], [0.05, w, 0], [0.05, 0, -h], [0.05, -w, 0]], tip = [0.62, 0, 0], back = [-0.38, 0, 0];
      for (let j = 0; j < 4; j++) { const a = R[j], b = R[(j + 1) % 4]; B.facet([a, b, tip], M_SPEAR); B.facet([b, a, back], M_SPEAR); } out.spear = B.done(); }
    /* the Memory Loom: a round dais of violet stone rimmed in gold, an upright gold frame (two posts, a top bar, a cross bar), five threads */
    { const B = nb(); B.push([0, 0, 1], [1.05, 0, 0], [0, 0.72, 0]); B.lathe([[0, 0, M_STONE], [0, 0.92, M_STONE], [0.1, 0.96, M_STONE], [0.1, 0.96, M_GOLD], [0.14, 1.0, M_GOLD], [0.16, 0.9, M_GOLD], [0.16, 0.9, M_STONE], [0.17, 0.5, M_STONE], [0.17, 0.5, M_INLAY], [0.175, 0.44, M_INLAY], [0.175, 0.44, M_STONE], [0.18, 0, M_STONE]], M_STONE, { seg: 40 }); B.pop();
      const fh = 1.5 / ZK, fw = 0.75, pz = 0.17;
      for (const sx of [-1, 1]) { B.box([sx * fw, 0, pz + fh / 2], [0.07, 0.07, fh / 2], 0.02, M_GOLD); B.box([sx * fw, 0, pz + fh + 0.06], [0.11, 0.11, 0.06], 0.02, M_GOLD); B.ell([sx * fw, 0, pz + fh + 0.2], [0.07, 0.07, 0.1], M_GOLD, { seg: 10, rings: 6 }); }
      B.box([0, 0, pz + fh], [fw + 0.05, 0.05, 0.045], 0.015, M_GOLD); B.box([0, 0, pz + fh * 0.25], [fw + 0.03, 0.05, 0.04], 0.015, M_GOLD);
      for (let i = 1; i < 6; i++) { const x = -fw + i * fw / 3; B.tube([x, 0, pz + fh * 0.25], [x, 0, pz + fh], 0.018, 0.018, M_THREAD, { seg: 5, cap0: false, cap1: false }); }
      out.loom = B.done(); }
    /* the release plate: a low disc of violet stone, a gold rim, a silver inner ring, an hourglass inlaid in gold */
    { const B = nb(); B.push([0, 0, 1], [0.9, 0, 0], [0, 0.63, 0]); B.lathe([[0, 0, M_STONE], [0, 0.98, M_STONE], [0.06, 1.0, M_STONE], [0.06, 1.0, M_GOLD], [0.1, 0.97, M_GOLD], [0.1, 0.9, M_GOLD], [0.1, 0.9, M_STONE], [0.1, 0.62, M_STONE], [0.1, 0.62, M_INLAY], [0.112, 0.58, M_INLAY], [0.1, 0.54, M_INLAY], [0.1, 0.54, M_STONE], [0.11, 0, M_STONE]], M_STONE, { seg: 40 }); B.pop();
      for (const sy of [-1, 1]) B.facet([[-0.22, sy * 0.3, 0.115], [0.22, sy * 0.3, 0.115], [0.04, sy * 0.03, 0.115], [-0.04, sy * 0.03, 0.115]][sy < 0 ? 'slice' : 'reverse'](), M_GOLD);
      out.plate = B.done(); }
    return out; }

  /* ================= the rig: the 2D skeleton (20z3's build) read into model space ================= */
  let LAST = null;
  const RM = Array.from({ length: NR }, () => Array.from({ length: 6 }, () => [0, 0, 0])), AX = Array.from({ length: NR }, () => [0, 0, 0]), CP = Array.from({ length: NR }, () => Array.from({ length: 6 }, () => [[0, 0, 0], [0, 0, 0]]));
  const SP_L = [0.78, 0.72, 1.0];
  /* the armour's places on the body: [ring, round (0 the ridge, 0.25 the + flank), length, width (of the body there), height] */
  const PLATES = [[1.3, 0, 0.62, 0.62, 0.32], [2.1, 0, 0.66, 0.66, 0.34], [2.9, 0, 0.6, 0.6, 0.3], [3.7, 0, 0.55, 0.55, 0.28], [4.5, 0, 0.6, 0.6, 0.3], [5.3, 0, 0.66, 0.66, 0.34], [6.1, 0, 0.7, 0.7, 0.36], [6.9, 0, 0.66, 0.64, 0.34], [7.7, 0, 0.56, 0.55, 0.3],
    [6.6, 0.16, 0.95, 0.85, 0.4], [6.6, 0.84, 0.95, 0.85, 0.4], [5.9, 0.2, 0.8, 0.7, 0.34], [5.9, 0.8, 0.8, 0.7, 0.34], [2.0, 0.17, 0.9, 0.8, 0.38], [2.0, 0.83, 0.9, 0.8, 0.38], [1.35, 0.21, 0.7, 0.62, 0.3], [1.35, 0.79, 0.7, 0.62, 0.3],
    [9.9, 0, 0.42, 0.72, 0.24], [10.7, 0, 0.44, 0.72, 0.24], [11.5, 0, 0.42, 0.66, 0.22], [12.3, 0, 0.36, 0.6, 0.18], [10.35, 0.19, 0.5, 0.6, 0.22], [10.35, 0.81, 0.5, 0.6, 0.22], [8.5, 0, 0.5, 0.6, 0.26]];
  const FINS = [[1.7, 0.95], [2.5, 1.05], [3.3, 0.9], [4.1, 0.85], [4.9, 0.95], [5.7, 1.1], [6.5, 1.15], [7.3, 0.95], [11.1, 0.55], [11.9, 0.45]];
  /* the surface over the rings: a ring at any place f along (Catmull-Rom through the 15), a point at any place round it (v 0..1 from the
     ridge: between the ring's six points, rounded toward the flanks and keel, the ridge kept sharp), pushed out by the body's mass and its
     muscles (shoulders, haunches, ribs down the lower flanks, the neck's cords, the jaw's muscles) */
  const RP = Array.from({ length: 6 }, () => [0, 0, 0]), RA = [0, 0, 0], SP = [0, 0, 0], ROUND = [0.3, 0.62, 0.5, 0.5, 0.62, 0.3]; let GB = null, GAX = null, RW = 0;
  function ringAt(f) { const k = Math.max(0, Math.min(NR - 2, Math.floor(f))), t = f - k, k0 = Math.max(0, k - 1), k3 = Math.min(NR - 1, k + 2);
    for (let c = 0; c < 3; c++) { RA[c] = crv(AX[k0][c], AX[k][c], AX[k + 1][c], AX[k3][c], t); for (let j = 0; j < 6; j++) RP[j][c] = crv(RM[k0][j][c], RM[k][j][c], RM[k + 1][j][c], RM[k3][j][c], t); }
    let w = 0; for (let j = 0; j < 6; j++) w += Math.hypot(RP[j][0] - RA[0], RP[j][1] - RA[1], RP[j][2] - RA[2]); RW = w / 6; }
  const gs = (x, s2) => Math.exp(-x * x / (s2 * s2));
  function muscle(f, v) { const c2 = Math.cos(v * TAU), sw = sq(Math.sin(v * TAU)), lo = Math.max(0, 0.3 - c2), tail = cl(f / 1.2);
    return tail * (0.16 * gs(f - 6.3, 0.9) * sw * (0.65 + 0.35 * Math.max(0, c2)) + 0.17 * gs(f - 1.9, 0.8) * sw + 0.05 * gs(f - 5.3, 1.3) * Math.pow(0.5 + 0.5 * Math.cos((f - 4.4) * TAU / 0.6), 3) * sw * lo
      + 0.055 * gs(f - 8.6, 0.6) * sq(0.5 + 0.5 * Math.cos(v * TAU * 4)) + 0.09 * gs(f - 10.3, 0.5) * sw * lo + 0.04 * gs(f - 3.5, 1.2) * sq(0.5 + 0.5 * Math.cos(v * TAU * 3)) * sw); }
  /* the hound's lines over the 2D skeleton's: a big wedge skull, a broad blunt muzzle, a deep chest, a tucked waist, powerful haunches */
  let BSV = 1;
  function prof(f, v) { const c2 = Math.cos(v * TAU), sw = sq(Math.sin(v * TAU)), top = sq(Math.max(0, c2)), keel = sq(Math.max(0, -c2)), skull = gs(f - 10.5, 1.0), muz = sstep(11.4, 13.4, f), chest = gs(f - 6.2, 1.1), waist = gs(f - 3.9, 0.75), haunch = gs(f - 1.8, 0.85);
    const lat = 1 + 0.55 * skull + 0.3 * muz * (1 - skull) - 0.2 * waist + 0.2 * haunch + 0.08 * chest, tp = 1 + 0.32 * skull - 0.15 * muz + 0.12 * haunch + 0.06 * chest, kl = 1 + 0.45 * chest - 0.32 * waist - 0.12 * skull + 0.05 * haunch;
    return 1 + (lat - 1) * sw + (tp - 1) * top + (kl - 1) * keel; }
  function aroundAt(f, v, out) { const x = v * 6, j0 = Math.min(5, Math.floor(x)), w = x - j0, p0 = RP[(j0 + 5) % 6], p1 = RP[j0], p2 = RP[(j0 + 1) % 6], p3 = RP[(j0 + 2) % 6], rd = ROUND[j0];
    for (let c = 0; c < 3; c++) { const li = p1[c] + (p2[c] - p1[c]) * w; out[c] = li + (crv(p0[c], p1[c], p2[c], p3[c], w) - li) * rd; }
    const dx = out[0] - RA[0], dy = out[1] - RA[1], dz = out[2] - RA[2], d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6, r = d * MASS * prof(f, v) + RW * muscle(f, v) + 0.07 * BSV * sstep(12.2, 14, f);
    out[0] = RA[0] + dx / d * r; out[1] = RA[1] + dy / d * r; out[2] = RA[2] + dz / d * r; return out; }
  /* a place on the body: its point, its outward normal, its tangent toward the snout, the body's half-width there */
  function surfFrame(f, v) { const S2 = (ff, vv) => { ringAt(ff); return aroundAt(ff, ((vv % 1) + 1) % 1, [0, 0, 0]); }, p = S2(f, v), pu = vsub(S2(Math.min(NR - 1, f + 0.05), v), S2(Math.max(0, f - 0.05), v)), pv = vsub(S2(f, v + 0.01), S2(f, v - 0.01));
    ringAt(f); let n = vnrm(vcross(pu, pv)); if (vdot(n, vsub(p, RA)) < 0) n = vmul(n, -1); return { p, n, t: vnrm(pu), w: RW }; }
  /* P: the 2D pose (poseOf); mx, my the boss's floor point; S the spears' states ([{ st, t, from }] or null); o: { flash, dead } */
  /* the skeleton drawn VS times its size about its head: the head (where the lanes stop it, where it bites) stays put, the body behind it */
  function scaleBd(Bd, P, BS0) { const c0 = P.x + Math.cos(P.th) * UPV * BS0, c1 = P.y + Math.sin(P.th) * UPV * BS0, sp = p => { p[0] = c0 + (p[0] - c0) * VS; p[1] = c1 + (p[1] - c1) * VS; p[2] *= VS; };
    for (const R of Bd.rings) R.forEach(sp); Bd.axes.forEach(sp); for (const L of Bd.legs) L.pts.forEach(sp); for (const S2 of Bd.spears) { sp(S2.p); S2.L *= VS; } for (const J of Bd.jr) J.forEach(sp); return Bd; }
  const scaleFrom = (p, x, y, th, BS0) => { const c0 = x + Math.cos(th) * UPV * BS0, c1 = y + Math.sin(th) * UPV * BS0; return [c0 + (p[0] - c0) * VS, c1 + (p[1] - c1) * VS, p[2] * VS]; };
  function rig(P, mx, my, S, o) {
    const R0 = RIG(), BS0 = R0.BS, BS = BS0 * VS, P2 = Object.assign({}, P, { jaw: Math.max(P.jaw || 0, 0.2) }), Bd = scaleBd(R0.build(P2), P, BS0), inst = [], A = { slits: [], eyes: [], spears: [] }; BSV = BS;   // (the jaw never quite shut: its teeth show)
    const mp = p => [p[0] - mx, (p[1] - my) / GY, p[2] / ZK], md = d => vnrm([d[0], d[1] / GY, d[2] / ZK]);
    const fl = o && o.flash ? 1 : 0, dead = o && o.dead || 0, slitK = Math.max(P.stuck || 0, o && o.slitK || 0), menace = o && o.menace || 0;
    const I = (part, R, oo, ex) => { const it = { part, R, o: oo, s: 1, al: 1, glow: 0, glow2: fl * 0.85, spill: 0, kind: 0, fx: dead, wear: 0.5 }; if (ex) Object.assign(it, ex); inst.push(it); return it; };
    const M = KG.MESH;
    // the body: the rings into model space, then the dense surface over them (its mass, its muscles), its normals from the grid
    for (let k = 0; k < NR; k++) { const Rk = Bd.rings[k]; for (let j = 0; j < 6; j++) { const p = Rk[j], q = RM[k][j]; q[0] = p[0] - mx; q[1] = (p[1] - my) / GY; q[2] = p[2] / ZK; } const a = Bd.axes[k]; AX[k][0] = a[0] - mx; AX[k][1] = (a[1] - my) / GY; AX[k][2] = a[2] / ZK; }
    const BM = M.body, nu = BM.nu, nv = BM.nv, W1 = nu + 1, need = (nu + 1) * (nv + 1) * 3; if (!GB || GB.length < need) { GB = new Float64Array(need); GAX = new Float64Array((nu + 1) * 3); }
    for (let i = 0; i <= nu; i++) { const f = i / nu * (NR - 1); ringAt(f); GAX[i * 3] = RA[0]; GAX[i * 3 + 1] = RA[1]; GAX[i * 3 + 2] = RA[2]; for (let j = 0; j <= nv; j++) { aroundAt(f, j / nv, SP); const o = (j * W1 + i) * 3; GB[o] = SP[0]; GB[o + 1] = SP[1]; GB[o + 2] = SP[2]; } }
    { const P2 = BM.pos, N2 = BM.nrm, at = (i, j) => (j * W1 + Math.max(0, Math.min(nu, i))) * 3;
      for (let j = 0; j <= nv; j++) { const jm = j > 0 ? j - 1 : nv - 1, jp = j < nv ? j + 1 : 1; for (let i = 0; i <= nu; i++) { const q = at(i, j), a = at(i + 1, j), b = at(i - 1, j), c2 = at(i, jp), d = at(i, jm);
        const u0 = GB[a] - GB[b], u1 = GB[a + 1] - GB[b + 1], u2 = GB[a + 2] - GB[b + 2], v0 = GB[c2] - GB[d], v1 = GB[c2 + 1] - GB[d + 1], v2 = GB[c2 + 2] - GB[d + 2];
        let n0 = u1 * v2 - u2 * v1, n1 = u2 * v0 - u0 * v2, n2 = u0 * v1 - u1 * v0; const l = Math.sqrt(n0 * n0 + n1 * n1 + n2 * n2) || 1, ox = GB[q] - GAX[i * 3], oy = GB[q + 1] - GAX[i * 3 + 1], oz = GB[q + 2] - GAX[i * 3 + 2], sg = n0 * ox + n1 * oy + n2 * oz < 0 ? -1 / l : 1 / l;
        P2[q] = GB[q]; P2[q + 1] = GB[q + 1]; P2[q + 2] = GB[q + 2]; N2[q] = n0 * sg; N2[q + 1] = n1 * sg; N2[q + 2] = n2 * sg; } } }
    GLM.touchGeo(BM); KG.PB.body = null; I('body', I3(), [0, 0, 0], { glow: menace, kind: slitK, wear: 0.31 });
    // the slits: six down each flank, from the shoulder to the waist (where the 2D file lays them), laid on the body; the eyes on the skull
    const L = M.lights; let q = 0; const toW = p => [p[0] + mx, p[1] * GY + my, p[2] * ZK];
    for (const sd of [1, -1]) for (let i = 0; i < 6; i++) { const f = 6.85 - i * 0.42, vT = sd > 0 ? 1.15 / 6 : 4.85 / 6, vB = sd > 0 ? 1.9 / 6 : 4.1 / 6, T0 = surfFrame(f, vT), B0 = surfFrame(f - 0.18, vB), hw = (0.07 + slitK * 0.04) * BS;
      const t2 = vadd(T0.p, vmul(T0.n, 0.03)), b2 = vadd(B0.p, vmul(B0.n, 0.03)), ax = T0.t; putQ(L, q++, vadd(t2, vmul(ax, -hw)), vadd(t2, vmul(ax, hw)), vadd(b2, vmul(ax, hw)), vadd(b2, vmul(ax, -hw)), vsub(T0.p, vmul(T0.n, 1)));
      const mw = toW(vmul(vadd(t2, b2), 0.5)); A.slits.push([mw[0], mw[1], mw[2], sd, i]); }
    for (const sd of [1, -1]) { const v = sd > 0 ? 0.95 / 6 : 5.05 / 6, E0 = surfFrame(10.55, v), E1 = surfFrame(11.25, v), bn = vnrm(vcross(E0.n, E0.t)), hw = 0.06 * BS, e0 = vadd(E0.p, vmul(E0.n, 0.035)), e1 = vadd(E1.p, vmul(E1.n, 0.035));
      putQ(L, q++, vsub(e0, vmul(bn, hw)), vadd(e0, vmul(bn, hw)), vadd(e1, vmul(bn, hw * 0.6)), vsub(e1, vmul(bn, hw * 0.6)), vsub(E0.p, E0.n)); const w = toW(vmul(vadd(e0, e1), 0.5)); A.eyes.push([w[0], w[1], w[2], sd]); }
    GLM.touchGeo(L); KG.PB.lights = null; I('lights', I3(), [0, 0, 0], { glow: menace, kind: slitK, wear: 0.4, outline: false });
    // the armour: chevron plates down the spine, over the shoulders and haunches, on the skull and the cheeks; black glass blades between
    { const PM = M.plates; let n = 0; for (const [f, v, lk, wk, hk] of PLATES) { if (n >= NPL) break; const F = surfFrame(f, v), wd = Math.max(0.25, F.w) * wk; K.place(PM, n++, { x: vmul(F.t, -1), y: vcross(F.n, vmul(F.t, -1)), z: F.n }, vadd(F.p, vmul(F.n, -0.02)), [lk * BS, wd, hk * BS]); }
      for (let i = n; i < NPL; i++) K.hide(PM, i); K.commit(PM); KG.PB.plates = null; I('plates', I3(), [0, 0, 0], { glow: menace, kind: slitK, wear: 0.47 }); }
    { const FM = M.fins; FINS.forEach(([f, hk], i) => { const F = surfFrame(f, 0), h = Math.max(0.14, F.w * hk) * (1 + 0.08 * Math.sin((P.bt || 0) * 3.4 - i * 0.7) * (P.stuck || 0)); K.place(FM, i, { x: vmul(F.t, -1), y: vcross(F.n, vmul(F.t, -1)), z: F.n }, vadd(F.p, vmul(F.n, 0.1 * BS)), [(f > 9 ? 0.34 : 0.5) * BS, 1, h]); });
      K.commit(FM); KG.PB.fins = null; I('fins', I3(), [0, 0, 0], { glow: 0.5 + menace * 0.6, wear: 0.55, outline: false }); }
    // the jaw
    const lp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u], jr = Bd.jr.map((sec, k) => sec.map(p => { const q2 = mp(p), c0 = AX[10 + k]; return vadd(c0, vmul(vsub(q2, c0), MASS * 1.3)); }));   // (the jaw as full as the skull)
    { const J = M.jaw; for (let k = 0; k < 3; k++) { const Aq = jr[k], Bq = jr[k + 1], ref = vmul(vadd(vadd(Aq[1], Bq[1]), vadd(Aq[0], Aq[2])), 0.25), refM = vmul(vadd(Aq[1], Bq[1]), 0.5); putQ(J, k * 3, Aq[0], Bq[0], Bq[1], Aq[1], ref); putQ(J, k * 3 + 1, Aq[1], Bq[1], Bq[2], Aq[2], ref); putQ(J, k * 3 + 2, Aq[2], Bq[2], Bq[0], Aq[0], refM); }
      GLM.touchGeo(J); KG.PB.jaw = null; I('jaw', I3(), [0, 0, 0], { glow: P.jaw || 0, wear: 0.33 });
      A.mouth = Bd.jr[1][1].slice(); A.mouth[0] = (Bd.jr[1][1][0] + Bd.jr[2][1][0]) / 2; A.mouth[1] = (Bd.jr[1][1][1] + Bd.jr[2][1][1]) / 2; A.mouth[2] = (Bd.jr[1][1][2] + Bd.jr[2][1][2]) / 2 + 0.1 * BS; }
    // the teeth: down the upper jaw's edges (bared as it opens) and up from the lower's
    { const TM = M.teeth, ln = 0.22 * BS * Math.min(1, (P2.jaw || 0) * 1.6), w = 0.055 * BS; let n = 0;
      if (ln > 0.015) { for (const v of [2 / 6, 4 / 6]) for (let k = 10; k < 14; k++) for (const e of [0.25, 0.75]) { const F = surfFrame(k + e, v); K.place(TM, n++, I3(), vadd(F.p, vmul(F.n, -0.02)), [w, w * 1.3, ln / ZK]); }
        for (const jj of [0, 2]) for (let k = 0; k < 3; k++) for (const e of [0.3, 0.8]) { if (n >= 24) break; const p = lp(jr[k][jj], jr[k + 1][jj], e); K.place(TM, n++, I3(), p, [w * 0.8, w, -ln * 0.6 / ZK]); } }
      for (let i = n; i < 24; i++) K.hide(TM, i); K.commit(TM); KG.PB.teeth = null; if (n) I('teeth', I3(), [0, 0, 0], { wear: 0.7, outline: false }); }

    // the legs: their joint chains (shoulder or hip, two knees, the foot), prisms between, knuckles at the bends, claws at the foot
    const fwm = md(Bd.fw);
    for (const Lg of Bd.legs) { const pts = Lg.pts.map(mp), side = vnrm(vcross(fwm, [0, 0, 1])), sv = vmul(side, Lg.sd);
      for (let i = 0; i < 3; i++) { const a = pts[i], b = pts[i + 1], d = vsub(b, a), len = Math.sqrt(vdot(d, d)) || 1e-3; const tk = VS * (Lg.front ? [1.25, 1.2, 1.15][i] : [1.4, 1.12, 1.05][i]); I('seg' + i, frameXZ(d, sv), a, { sc: [len, tk, tk], wear: 0.2 + i * 0.1 + (Lg.front ? 0.3 : 0) }); }
      for (let i = 1; i < 4; i++) { const r = LEGW[i] * BS * (i < 3 ? 1.3 : 1.15) * (Lg.front ? 1.15 : 1.1); I('knuckle', frameXZ(vsub(pts[Math.min(3, i + 1)], pts[i - 1]), sv), pts[i], { s: r, sc: [1, 1, 1.2], wear: 0.6 }); }
      I('paw', frameXZ(fwm, [0, 0, 1]), pts[3], { s: VS * (Lg.front ? 1.2 : 1.05), wear: 0.8 }); }
    // the tail: out of the haunches, sagging then lifting, swaying with the gait; a blade at its end
    { const TM = M.tail, b0 = lp(AX[1], AX[0], 0.6), back = vnrm(vsub(AX[0], AX[2])), side = vnrm(vcross(back, [0, 0, 1])), TL = 3.4 * BS, ph = (P.gait || 0) * 0.5 + (P.bt || 0) * 1.7, R1 = 0.55 * Math.max(0.12, (ringAt(1), RW)) * MASS, Pt = [], Tn = [];
      for (let i = 0; i <= TNU; i++) { const s2 = i / TNU, sway = Math.sin(ph - s2 * 2.6) * 0.32 * s2 * (1 - 0.6 * (P.lunge || 0)), lift = (0.12 * s2 - 0.42 * s2 * s2 + (P.lunge || 0) * 0.2 * s2) * TL / ZK * 0.5 + (P.stuck || 0) * Math.sin((P.bt || 0) * 9 + s2 * 4) * 0.15 * s2;
        Pt.push([b0[0] + back[0] * s2 * TL + side[0] * sway * TL * 0.3, b0[1] + back[1] * s2 * TL + side[1] * sway * TL * 0.3, b0[2] + back[2] * s2 * TL + lift]); }
      for (let i = 0; i <= TNU; i++) Tn.push(vnrm(vsub(Pt[Math.min(TNU, i + 1)], Pt[Math.max(0, i - 1)])));
      const P3 = TM.pos, N3 = TM.nrm, W2 = TNU + 1;
      for (let j = 0; j <= TNV; j++) for (let i = 0; i <= TNU; i++) { const s2 = i / TNU, t3 = Tn[i], y3 = vnrm(vcross([0, 0, 1], t3)), z3 = vcross(t3, y3), a = j / TNV * TAU, r = R1 * (1 - 0.84 * s2) * (1 + 0.06 * Math.cos(s2 * 30)), cy = Math.cos(a) * r, sz = Math.sin(a) * r * 0.8, o3 = (j * W2 + i) * 3;
        P3[o3] = Pt[i][0] + y3[0] * cy + z3[0] * sz; P3[o3 + 1] = Pt[i][1] + y3[1] * cy + z3[1] * sz; P3[o3 + 2] = Pt[i][2] + y3[2] * cy + z3[2] * sz; const nn = vnrm([y3[0] * Math.cos(a) + z3[0] * Math.sin(a), y3[1] * Math.cos(a) + z3[1] * Math.sin(a), y3[2] * Math.cos(a) + z3[2] * Math.sin(a)]); N3[o3] = nn[0]; N3[o3 + 1] = nn[1]; N3[o3 + 2] = nn[2]; }
      GLM.touchGeo(TM); KG.PB.tail = null; I('tail', I3(), [0, 0, 0], { glow: menace, kind: slitK, wear: 0.36 });
      I('spear', frameXZ(Tn[TNU], [0, 0, 1]), vadd(Pt[TNU], vmul(Tn[TNU], 0.3 * BS)), { sc: [1.25 * BS, VS * 1.25, VS * 1.25], glow: 0.9 + menace * 0.5, wear: 0.9 }); }
    // the horn blades: a great swept-back pair off the back of the skull, a smaller pair before them (the ears)
    for (const [f, v, ln, wd, up] of [[10.0, 0.08, 1.75, 1.15, 0.62], [10.0, 0.92, 1.75, 1.15, 0.62], [9.55, 0.16, 1.0, 0.9, 0.45], [9.55, 0.84, 1.0, 0.9, 0.45]]) { const F = surfFrame(f, v), dir = vnrm(vadd(vadd(vmul(F.t, -1), vmul(F.n, up)), [0, 0, 0.35]));
      I('horn', frameXZ(dir, vmul(vcross(F.t, [0, 0, 1]), v < 0.5 ? 1 : -1)), vadd(F.p, vmul(F.n, -0.05)), { sc: [ln * BS, wd * VS, wd * VS], glow: 0.5 + menace * 0.7, wear: 0.2 + v }); }
    // the spears: hovering in line behind it (or drawn back to it after a throw)
    for (let i = 0; i < 3; i++) { const s = S && S[i]; if (s && (s.st === 'fly' || s.st === 'stuck')) continue; let sp = Bd.spears[i], p = sp.p;
      if (s && s.st === 'back' && s.from) { const u = cl(s.t / 0.55), e = u * u * (3 - 2 * u); p = [lerp(s.from[0], sp.p[0], e), lerp(s.from[1], sp.p[1], e), lerp(s.from[2], sp.p[2], e)]; }
      const glow = 0.5 + 0.5 * Math.sin((P.bt || 0) * 2.4 - i * 1.05); I('spear', frameXZ(md(sp.d), [0, 0, 1]), mp(p), { sc: [sp.L, VS, VS], glow: 0.6 + 0.6 * glow, wear: 0.15 + i * 0.3 }); A.spears.push([p[0], p[1], p[2], glow, i]); }
    A.head = Bd.rings[10][0]; A.bd = Bd; return { inst, A }; }
  /* the spears in the air (thrown to their rings, or stuck where they fell), as the 2D file arcs them */
  function airSpears(M, mx, my, BS) { const list = [], md = d => vnrm([d[0], d[1] / GY, d[2] / ZK]), th = M.hd == null ? Math.PI / 2 : M.hd;
    for (let i = 0; i < 3; i++) { const s = M.spears && M.spears[i]; if (!s || (s.st !== 'fly' && s.st !== 'stuck')) continue; let p, d;
      if (s.st === 'fly') { const fr = s.fromK === s.from && s.fromV ? s.fromV : (s.fromK = s.from, s.fromV = scaleFrom(s.from, mx, my, th, BS)), at = u => { const e = u * u; return [lerp(fr[0], s.to[0], e), lerp(fr[1], s.to[1], e), lerp(fr[2], 0.3, e) + Math.sin(u * Math.PI) * 3.2 + (1 - u) * 0.5]; }; const u = cl(s.t / s.dur), a = at(u), b = at(Math.min(1, u + 0.04)); p = a; d = vnrm([b[0] - a[0], b[1] - a[1], b[2] - a[2] + (u > 0.96 ? -0.5 : 0)]); }
      else { p = [s.x, s.y, 0.45]; d = vnrm([0, 0.25, -0.97]); }
      list.push({ part: 'spear', R: frameXZ(md(d), [0, 0, 1]), o: [p[0] - mx, (p[1] - my) / GY, p[2] / ZK], sc: [SP_L[i] * BS * VS, VS, VS], glow: 1.2, wear: 0.15 + i * 0.3, w: p }); }
    return list; }

  /* ================= drawing ================= */
  /* one GPU pass (as DUNE3's, with the void's light and its own outline: a thin violet-silver line round the model, so the black hound
     stands off the dark stone). The picture is drawn at the canvas's own resolution; only on a software rasteriser forced on for tests
     (window.__SK_GL) is it drawn at 0.45 (window.__SK_GLHQ = 1: full) */
  const KCAP = 1500, OUTK = [0.3, 0.22, 0.56], KGI = [], KGJ = [], CWV = K.CW;
  function kPass(c, V, list, al0, o) {
    const k = V.k, PX = [1, 0, 0], PY = [0, GY, -K.ZK], X0 = V.X0, Y0 = V.Y0, LT = D3.LIGHT.sepvoid; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { if (!KG.MESH[it.part]) continue; const [bc, brr] = KG.bounds(it.part), sc = it.sc || [1, 1, 1], s2 = it.s || 1, rr = brr * s2 * Math.max(sc[0], sc[1], sc[2]) * 1.05 * k, lc = [bc[0] * sc[0] * s2, bc[1] * sc[1] * s2, bc[2] * sc[2] * s2], w = K.mv(V.Rh, vadd(it.o, K.mv(it.R, lc))), sx = X0 + vdot(w, PX) * k, sy = Y0 + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return false; bx0 -= 3; by0 -= 3; bx1 += 3; by1 += 3;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !win('__SK_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.45 : 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, KCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = { px: PX, py: PY, pd: CWV, cl: [2 * k / bw, 2 * (X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (Y0 - by0) / bh], v: CWV, lk: LT.lk, ls: LT.ls, lr: LT.lr, up: [0, 0, 1], low: lowFx(), rim: LT.rim, amb: LT.key, t: (o.t || 0) % 600,
      outline: o.outline === 0 ? 0 : Math.max(1, 1.1 * (W / bw)), outlineCol: o.outlineCol || OUTK, keep: 1 };
    let n = 0; const items = KGJ; items.length = 0;
    for (const it of list) { const mesh = KG.MESH[it.part]; if (!mesh) continue; const al = al0 * (it.al == null ? 1 : it.al); if (!(al > 0.004)) continue; const Rw = K.mm(V.Rh, it.R), s2 = it.s || 1, sc = it.sc || [1, 1, 1], Tt = K.mv(V.Rh, it.o);
      const g = KGI[n] || (KGI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2 * sc[0]; g.R1[i] = Rw.y[i] * s2 * sc[1]; g.R2[i] = Rw.z[i] * s2 * sc[2]; g.T[i] = Tt[i]; }
      g.alpha = al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = it.wear == null ? 0.5 : it.wear; g.fx = it.fx || 0; g.outline = it.outline; g.first = 0; g.cnt = 0; g.d = vdot(Tt, CWV); items.push(g); }
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); if (o.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= Math.min(1, o.flash) * 0.3; c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); }
    KG.ms = KG.ms * 0.9 + (nowMs() - t0) * 0.1; KG.n++; KG.box = [W, H]; return true; }
  function passOf(c, V, list, o) { let ok = false; try { ok = kPass(c, V, list, 1, o); } catch (e) { KG.fail(); if (typeof console !== 'undefined') console.warn('Khyros: draw', e); ok = false; } return ok; }
  function st3(FX) { const M = FX.mem; return M.k3 || (M.k3 = { R: null, Rt: -1, fx: [] }); }
  function rigNow(FX, m) { const M = FX.mem, S = st3(FX), R0 = RIG(); if (S.R && S.Rt === M.bt && S.Rx === m.x && S.Ry === m.y) return S.R;
    const P = R0.poseOf(m, M); S.R = rig(P, m.x, m.y, M.spears, { flash: m.flash > 0, slitK: M.slitK || 0, menace: M.menace || 0 }); S.Rt = M.bt; S.Rx = m.x; S.Ry = m.y; S.P = P; LAST = S.R; return S.R; }
  /* the boss: the model laid down at 1 - fade (assembling out of the angles, or stepping back into them) */
  function drawBoss(c, FX, m, X, Y, T, t) { if (!gpu()) return false; const M = FX.mem || {}, a = 1 - cl(M.fade || 0); if (a < 0.03) return true;
    KG.used = true; const R = rigNow(FX, m), V = K.mkView(m.x, m.y, 0, 0, { T, sx: v => X + (v - m.x) * T, sy: v => Y + (v - m.y) * T }); c.save(); c.globalAlpha *= a;
    const ok = passOf(c, V, R.inst, { t: M.bt || t, flash: m.flash > 0 ? 1 : 0, occ: null }); c.restore(); return ok; }
  const scr = (FX, T, p) => [FX.sx(p[0]), FX.sy(p[1]) - p[2] * T];

  /* ---- the floor's light (the overlay, under everything standing): the ring, the alcoves, the loom and the plate, the marks of the
     past, the warnings, its shadow ---- */
  function overlay(c, FX, t, T) { const M = FX.mem, m = FX.m, C = FX.C; if (!M || !M.loom) return false; const F = fg(); const marked = FX.S.tele.filter(s => s.khy);
    if (!F || !KG.on()) { if (!marked.length) return false; for (const s of marked) tele2D(c, FX, s, T, t); return false; }   // (the 2D overlay as before; warnings marked before the painter was lost drawn as the engine drew them)
    const R0 = RIG(), SR = R0.SR, HS = R0.HS, CS = R0.CS, lf = lowFx(), S = st3(FX), sk = M.sanK == null ? 1 : M.sanK, gk = M.goldK || 0, X0 = FX.sx(C.x), Y0 = FX.sy(C.y), r = SR * T;
    const Lm = M.loom, Pl = M.plate, live = Lm.st !== 'idle', held = Lm.st === 'hold';
    // the still pieces first (3D pictures): the loom on its dais, the plate
    const lx = FX.sx(Lm.x), ly = FX.sy(Lm.y), px = FX.sx(Pl.x), py = FX.sy(Pl.y);
    const pL = D3.pic(c, KG, 'loom' + (live ? 1 : 0), T, () => [{ part: 'loom', R: I3(), o: [0, 0, 0], s: 1, glow: live ? 1 : 0.15, wear: 0.4 }], 'sepvoid', null), pP = D3.pic(c, KG, 'plate' + (held ? 2 : live ? 1 : 0), T, () => [{ part: 'plate', R: I3(), o: [0, 0, 0], s: 1, glow: held ? 1.4 : live ? 0.6 : 0.1, wear: 0.6 }], 'sepvoid', null);
    const ck = 1 - sk, full = ck > 0.02 || gk > 0.02, Q = F.begin(c, null);
    try {
      // its shadow on the stone: a soft dark along its keel, under its feet
      if (FX.m && !m.dead) { const a = 1 - cl(M.fade || 0); if (a > 0.05) { const R = rigNow(FX, m), Bd = R.A.bd; for (let k = 1; k < 13; k += 2) { const p = Bd.rings[k][3], w = Math.max(0.5, Math.hypot(Bd.rings[k][1][0] - Bd.rings[k][5][0], Bd.rings[k][1][1] - Bd.rings[k][5][1])) * T * 0.9; Q.quad(9, FX.sx(p[0]) + T * 0.25, FX.sy(p[1]) + T * 0.1, w, 0, 0, w * 0.75, SHADE, 0.5 * a, 0, 3 + k); }
        for (const k of [2, 6, 10]) { const p = Bd.rings[k][3]; Q.glow(FX.sx(p[0]), FX.sy(p[1]) + T * 0.4, T * 3.0, VIOLET, 0.16 * a); }   // (a violet pool of the void's light about it on the stone: it stands off the dark floor)
        if (!lf) for (const L of Bd.legs) { const f = L.pts[3]; Q.quad(9, FX.sx(f[0]), FX.sy(f[1]), T * 0.6, 0, 0, T * 0.4, SHADE, 0.45 * a * (1 - Math.min(1, L.lift * 1.5)), 0, 11); } } }
      // the ring: silver shimmer while it holds, violet bars when stolen, gold while held
      if (ck > 0.02) { Q.quad(9, X0, Y0, r * 1.02, 0, 0, r * 1.02, '#0E0620', 0.6 * ck, 0, 5); Q.quad(9, X0, Y0, r * 0.8, 0, 0, r * 0.8, '#08030F', 0.45 * ck, 0, 9); }
      if (full) Q.quad(438, X0, Y0, r * 1.06, 0, 0, r * 1.06, SILVER_HI, 1, sk, ck, gk); else Q.shape(438, X0, Y0, r * 1.06, 0, 0, r * 1.06, SILVER_HI, 1, sk, ck, gk, 0.8, 1);
      if (M.heldT > 0) Q.shape(442, X0, Y0, r * 1.14, 0, 0, r * 1.14, GOLD_HI, 1, cl(M.heldT / 8), 3, 1, 0.9, 1);
      // the lit alcoves: violet light welling out of the corner, the angle's brackets burning
      for (let i = 0; i < 4; i++) { const k = M.lit[i]; if (k < 0.02) continue; const [sx, sy] = CS[i], X = FX.sx(C.x + sx * (HS - 1.2)), Y = FX.sy(C.y + sy * (HS - 1.2)), R2 = T * 3.4; Q.quad(437, X, Y, R2, 0, 0, R2, VIOLET_HI, k, i, 7 + i * 3, 0); }
      // the loom's dais and the plate (their light)
      if (live) { Q.quad(442, lx, ly, T * 1.5, 0, 0, T * 0.75, GOLD_HI, 0.9, Lm.st === 'rec' ? 1 : 0.5, 2, 0); Q.glow(lx, ly - T * 1.1, T * 2.0, GOLD_HI, 0.18 + (Lm.st === 'rec' ? 0.25 : 0) + 0.06 * Math.sin(t * 4)); }
      if (live || held) Q.quad(442, px, py, T * 1.4, 0, 0, T * 0.7, GOLD_HI, 1, held ? 1 : 0.45, 4, 0);
      // the path being woven, and the echo walking it
      if ((Lm.st === 'rec' || Lm.st === 'echo') && Lm.path.length > 1) { const P = Lm.path, n = P.length, st = Math.max(1, Math.floor(n / 28)); let pr = null; for (let i = 0; i < n; i += st) { const q2 = [FX.sx(P[i][1]), FX.sy(P[i][2])]; if (pr) Q.beam(pr[0], pr[1], q2[0], q2[1], T * 0.09, GOLD_HI, 0.7); pr = q2; } const lq = [FX.sx(P[n - 1][1]), FX.sy(P[n - 1][2])]; if (pr) Q.beam(pr[0], pr[1], lq[0], lq[1], T * 0.09, GOLD_HI, 0.7); }
      if ((Lm.st === 'echo' || held) && !Lm.echo.dead) { const X = FX.sx(Lm.echo.x), Y = FX.sy(Lm.echo.y); Q.glow(X, Y - T * 0.7, T * 1.6, GOLD_HI, 0.45); Q.ring(X, Y, T * 0.65, GOLD_HI, 0.6, T * 0.08, 0.5); }
      // the marks of the past: a ghost-ring each where the pet stood, its place in the order told by beads of light
      for (const mk of M.marks) { if (mk.hitDone) continue; Q.quad(441, FX.sx(mk.x), FX.sy(mk.y), T * 1.25, 0, 0, T * 0.8, mk.inside ? ROSE : VIOLET_HI, 1, 0.75 + 0.25 * Math.sin(t * 6 + mk.n), mk.n * 3.7, mk.n); }
      // the warnings
      for (const s of marked) tell(Q, FX, s, T, t);
      // the lunge's lane, after it fires: the lane burning out
      for (const f of S.fx) fxFloor(Q, FX, f, T, t, lf);
    } finally { F.flush(c); }
    if (pL) D3.blitPic(c, pL, lx, ly); if (pP) D3.blitPic(c, pP, px, py);
    // the labels (as the 2D overlay's)
    const near = Math.hypot(FX.me.x - Lm.x, FX.me.y - Lm.y) < 4.5, nearP = Math.hypot(FX.me.x - Pl.x, FX.me.y - Pl.y) < 4.5, fh = T * 1.5;
    c.save(); c.font = `800 ${Math.round(T * 0.26)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF';
    if (live && near) { const s = Lm.st === 'ready' ? 'MEMORY LOOM · stand on it' : Lm.st === 'rec' ? 'RECORDING' : 'MEMORY LOOM'; c.strokeText(s, lx, ly - fh - T * 0.35); c.fillText(s, lx, ly - fh - T * 0.35); }
    if (live && nearP && !held) { c.strokeText('RELEASE PLATE', px, py - T * 0.75); c.fillText('RELEASE PLATE', px, py - T * 0.75); }
    if (ck > 0.3) { c.globalAlpha = ck; c.font = `900 ${Math.round(T * 0.42)}px ${arcFont}`; c.textBaseline = 'middle'; c.strokeText('CLOSED', X0, Y0 - r * 0.35); c.fillStyle = VIOLET_HI; c.fillText('CLOSED', X0, Y0 - r * 0.35); }
    if (Lm.st === 'ready' && Lm.ch > 0) { c.globalAlpha = 1; c.strokeStyle = GOLD_HI; c.lineWidth = 3; c.beginPath(); c.arc(lx, ly - fh * 0.6, T * 0.5, -Math.PI / 2, -Math.PI / 2 + TAU * cl(Lm.ch)); c.stroke(); }
    c.restore(); return true; }
  /* a warning's light: Angle Stalk's lanes (436: the corner's chevrons running out along it; the Hunt's order in beads), Angled Jaw's cone
     (439), the spears' marks (440) */
  function tell(Q, FX, s, T, t) { const u = cl(s.age / s.t), sd = s.seed || 1, X = FX.sx(s.x), Y = FX.sy(s.y), col = s.col || VIOLET_HI;
    if (s.geo === 'line') { const ca = Math.cos(s.a), sa = Math.sin(s.a), hl = s.len / 2 * T, hw = s.w / 2 * T * 1.15; Q.quad(436, FX.sx(s.x + ca * s.len / 2), FX.sy(s.y + sa * s.len / 2), ca * hl, sa * hl, -sa * hw, ca * hw, col, 1, u * 0.999, (s.ord || 0) * 100 + (sd % 40), s.len / s.w); }
    else if (s.geo === 'cone') { const R = s.len * T, ca = Math.cos(s.a), sa = Math.sin(s.a); Q.quad(439, X, Y, ca * R, sa * R, -sa * R, ca * R, col, 1, u * 0.999, sd, s.spread); }
    else if (s.geo === 'circle') { const R = s.r * T * 1.15; Q.quad(440, X, Y, R, 0, 0, R, col, 1, u * 0.999, sd, 0); } }
  function fxFloor(Q, FX, f, T, t, lf) { const u = cl(f.t / f.life);
    if (f.kind === 'lane') { const ca = Math.cos(f.a), sa = Math.sin(f.a), hl = f.len / 2 * T, hw = f.w / 2 * T * 1.15; Q.quad(436, FX.sx(f.x + ca * f.len / 2), FX.sy(f.y + sa * f.len / 2), ca * hl, sa * hl, -sa * hw, ca * hw, VIOLET_HI, 1, 1 + 0.999 * (1 - u), f.seed, f.len / f.w); }
    else if (f.kind === 'cone') { const R = f.len * T, ca = Math.cos(f.a), sa = Math.sin(f.a); Q.quad(439, FX.sx(f.x), FX.sy(f.y), ca * R, sa * R, -sa * R, ca * R, VIOLET_HI, 1, 1 + 0.999 * u, f.seed, f.spread); }
    else if (f.kind === 'ring') { const R = f.r * T * 1.15; Q.quad(440, FX.sx(f.x), FX.sy(f.y), R, 0, 0, R, VIOLET_HI, 1, 1 + 0.999 * u, f.seed, 0); if (!lf) Q.ripple(FX.sx(f.x), FX.sy(f.y), T * f.r * (0.6 + 1.6 * u), VIOLET_HI, 0.35 * (1 - u), f.seed, GY, 0.1); }
    else if (f.kind === 'rim') { const X = FX.sx(f.x), Y = FX.sy(f.y); Q.glow(X, Y, T * 2.2 * (0.6 + u), SILVER_HI, 0.4 * (1 - u)); Q.ring(X, Y, T * (0.4 + 2.2 * u), SILVER_HI, 0.55 * (1 - u), T * 0.12); }
    else if (f.kind === 'crash') { const X = FX.sx(f.x), Y = FX.sy(f.y); Q.glow(X, Y, T * 2.6 * (0.5 + u), VIOLET, 0.45 * (1 - u)); Q.ring(X, Y, T * (0.5 + 2.6 * u), VIOLET_HI, 0.5 * (1 - u), T * 0.16); if (!lf) Q.ripple(X, Y, T * (0.8 + 2.4 * u), VIOLET_HI, 0.35 * (1 - u), f.seed, GY, 0.1); } }
  /* a marked warning drawn as the engine drew it (the painter lost mid-fight) */
  function tele2D(c, FX, s, T, t) { if (s.done && !s.linger) return; const u = cl(s.age / s.t), col = s.col || VIOLET_HI, X = FX.sx(s.x), Y = FX.sy(s.y), geo = s.geo;
    const path = grow => { c.beginPath(); if (geo === 'circle') c.arc(X, Y, Math.max(0.1, s.r * T * grow), 0, TAU); else if (geo === 'line') { c.save(); c.translate(X, Y); c.rotate(s.a); c.rect(0, -s.w / 2 * T, s.len * T * grow, s.w * T); c.restore(); } else if (geo === 'cone') { c.moveTo(X, Y); c.arc(X, Y, s.len * T * grow, s.a - s.spread, s.a + s.spread); c.closePath(); } };
    c.save(); path(1); c.fillStyle = D3.rgbaH('#0A0410', 0.13); c.fill(); c.globalCompositeOperation = 'lighter'; path(u); c.fillStyle = D3.rgbaH(col, 0.04 + u * 0.1); c.fill(); path(1); c.lineWidth = 1.5 + u * 1.5; c.strokeStyle = D3.rgbaH(col, 0.45 + 0.4 * Math.sin(t * 18) * u + u * 0.3); c.stroke(); c.restore(); }

  /* ---- the upper light (over everything): the lunge's wake, the wireframes it sheds, the spears in the air (one GPU pass), the slits',
     eyes' and mouth's bloom, the dazed stars, the loom's count over the pet ---- */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !m) return false; const F = fg(); if (!F || !KG.on()) return false; const lf = lowFx(), R0 = RIG(), BS = R0.BS, TIP = R0.TIP;
    // the spears in the air: one pass
    const air = airSpears(M, m.x, m.y, BS); if (air.length) { const V = K.mkView(m.x, m.y, 0, 0, { T, sx: FX.sx, sy: FX.sy }); passOf(c, V, air, { t: M.bt || t }); }
    const Q = F.begin(c, null);
    try {
      // the lunge's wake: from the alcove to the head
      if (M.lg) { const G = M.lg, L = G.L, hx = m.x + L.dx * TIP, hy = m.y + L.dy * TIP, x0 = L.K[0], y0 = L.K[1], len = Math.hypot(hx - x0, hy - y0); if (len > 0.3) { const ca = L.dx, sa = L.dy, w = 2.0, cx = FX.sx((x0 + hx) / 2), cy = FX.sy((y0 + hy) / 2) - T * 1.1; Q.quad(443, cx, cy, ca * len / 2 * T, sa * len / 2 * T, -sa * w / 2 * T, ca * w / 2 * T, VIOLET_HI, 1, 1, (G.seed || (G.seed = Math.random() * 40)), len / w); Q.glow(FX.sx(hx), FX.sy(hy) - T * 1.0, T * 2.2, VIOLET, 0.35); } }
      // the wireframes it sheds: its edges, as thin violet light
      const gh = M.ghosts || [], step = lf ? 2 : 1;
      for (let gi = 0; gi < gh.length; gi += step) { const G = gh[gi], k = G.life / G.max, a = 0.55 * k * k; if (a < 0.02) continue; const W = G.w || (G.w = wireOf(G.P, lf)), w = Math.max(0.7, T * 0.03);
        for (let i = 0; i < W.length; i += 6) Q.beam(FX.sx(W[i]), FX.sy(W[i + 1]) - W[i + 2] * T, FX.sx(W[i + 3]), FX.sy(W[i + 4]) - W[i + 5] * T, w, VIOLET_HI, a); }
      // its own light: the slits' bloom (a wave down the flank, white when wedged), the eyes, the lit mouth, the spears' glow
      if (!m.dead && M.fade < 0.97) { const R = rigNow(FX, m), A = R.A, al = 1 - cl(M.fade || 0), menace = M.menace || 0, slitK = Math.max(M.slitK || 0, M.stuck || 0), bt = M.bt || t, cf = Math.cos(M.hd || 0);
        for (const s of A.slits) { if (cf * s[3] < -0.35) continue; const pul = 0.35 + 0.65 * Math.max(0, Math.sin(bt * 3.4 - s[4] * 0.75)) * (0.6 + menace * 0.4) + slitK * 0.6, p = scr(FX, T, s); Q.glow(p[0], p[1], T * (0.85 + slitK * 0.5), slitK > 0.3 ? WHITE_V : VIOLET, al * Math.min(1, pul * 0.6)); }
        for (const e of A.eyes) { if (cf * e[3] < -0.6) continue; const p = scr(FX, T, e); Q.glow(p[0], p[1], T * 0.6, VIOLET_HI, al * (0.35 + menace * 0.4)); Q.star(p[0], p[1], T * 0.22, al * (0.5 + menace * 0.4), WHITE_V); }
        const jaw = Math.max(M.jaw || 0, (M.roar || 0) * 0.9); if (jaw > 0.25) { const p = scr(FX, T, A.mouth); Q.glow(p[0], p[1], T * 1.0, VIOLET, al * (jaw - 0.25) * 0.9); }
        for (const s of A.spears) { const p = scr(FX, T, s); Q.glow(p[0], p[1], T * 0.75, VIOLET, al * (0.25 + 0.3 * s[3])); }
        if ((M.roar || 0) > 0.05 || (M.howl || 0) > 0.05) { const p = scr(FX, T, A.head); Q.glow(p[0], p[1], T * 4.5, VIOLET, 0.2 * Math.max(M.roar || 0, M.howl || 0) * al); }
        if ((M.stuck || 0) > 0.4) { const hp = scr(FX, T, [A.head[0], A.head[1], A.head[2] + 0.6 * BS]); for (let i = 0; i < 3; i++) { const a = bt * 3.2 + i * TAU / 3; Q.star(hp[0] + Math.cos(a) * T * 0.9, hp[1] + Math.sin(a) * T * 0.3, T * 0.3, 0.9, WHITE_V); } } }
      for (const s of air) { const p = scr(FX, T, s.w); Q.glow(p[0], p[1], T * 0.9, VIOLET, 0.35); }
      // the loom's count over the pet while it records (a gold ring running out)
      const Lm = M.loom; if (Lm && Lm.st === 'rec') { const X = FX.sx(FX.me.x), Y = FX.sy(FX.me.y) - T * 2.1; Q.shape(442, X, Y, T * 0.55, 0, 0, T * 0.55, GOLD_HI, 1, 1 - cl(Lm.t / 3.6), 3, 1, 0.55, 1); Q.glow(X, Y, T * 0.5, GOLD_HI, 0.35 + 0.2 * Math.sin(t * 9)); }
    } finally { F.flush(c); } return true; }
  /* a wireframe: the long edges of the hull (its ridge, shoulders, flanks, keel), a few of its rings, the legs, the spears' shafts; as
     segments in the world (x, y, height) */
  function wireOf(P, lf) { const B = scaleBd(RIG().build(P), P, RIG().BS), out = [], seg = (a, b) => out.push(a[0], a[1], a[2], b[0], b[1], b[2]), R = B.rings;
    for (const j of lf ? [0, 2, 4] : [0, 1, 2, 3, 4, 5]) for (let k = 0; k < R.length - 1; k++) seg(R[k][j], R[k + 1][j]);
    for (const k of lf ? [6] : [2, 6, 9, 12]) for (let j = 0; j < 6; j++) seg(R[k][j], R[k][(j + 1) % 6]);
    for (const L of B.legs) for (let i = 0; i < 3; i++) seg(L.pts[i], L.pts[i + 1]);
    if (!lf) for (const sp of B.spears) seg(vadd(sp.p, vmul(sp.d, -sp.L * 0.38)), vadd(sp.p, vmul(sp.d, sp.L * 0.62)));
    return new Float32Array(out); }

  /* ================= the fight's side ================= */
  /* a warning marked for light: the engine's own (its shape kept as geo for the strike, the same moment and damage), shape 'fn' so the
     engine paints nothing of it (and its label, the Hunt's order, kept as ord: told in beads of light). Its strike leaves light on the
     floor (the lane burning out, the cone's slash, the spear's crater). Without the GPU path it stays the engine's own */
  function mark(FX, o) { if (!gpu()) return FX.tele(o); const geo = o.shape; let s = null; const ord = o.label ? +o.label || 0 : 0; if (o.label) delete o.label; const fn = o.fn;
    s = FX.tele(Object.assign(o, { geo, ord, khy: 1, shape: 'fn', seed: Math.random() * 40, test: (x, y, rr) => { s.shape = s.geo; const r = FX.inShape(s, x, y, rr); s.shape = 'fn'; return r; },
      fn: q => { const S = st3(FX), sd = Math.random() * 40; if (geo === 'line') S.fx.push({ kind: 'lane', x: q.x, y: q.y, a: q.a, len: q.len, w: q.w, t: 0, life: 0.55, seed: sd }); else if (geo === 'cone') S.fx.push({ kind: 'cone', x: q.x, y: q.y, a: q.a, len: q.len, spread: q.spread, t: 0, life: 0.45, seed: sd }); else if (geo === 'circle') S.fx.push({ kind: 'ring', x: q.x, y: q.y, r: q.r, t: 0, life: 0.6, seed: sd }); if (fn) return fn(q); } })); return s; }
  /* the lunge's end on the floor (the silver turning it, or the angle taking it) */
  function lungeEnd(FX, x, y, kind) { if (!gpu()) return; st3(FX).fx.push({ kind: kind === 'rim' ? 'rim' : 'crash', x, y, t: 0, life: kind === 'rim' ? 0.5 : 0.65, seed: Math.random() * 40 }); }
  function update(FX, dt) { const S = st3(FX); for (let i = S.fx.length - 1; i >= 0; i--) { const f = S.fx[i]; f.t += dt; if (f.t >= f.life) S.fx.splice(i, 1); } }
  function init(FX) { FX.mem.k3 = null; }
  /* the loading screen's jobs: the meshes, a first frame (the shader compiled, the buffers up) */
  function preload(P) { if (!P || !P.gl) return []; return [() => { KG.on(); }, () => { if (!KG.on()) return; const cv = document.createElement('canvas'); cv.width = cv.height = 16; const c = cv.getContext('2d'); try { studio(c, 8, 8, {}, { T: 3 }); } catch (e) { /* (the 2D hound) */ } cv.width = cv.height = 1; }]; }
  /* letting go when a new stage is made (DUNE3's release frees every GL buffer it knows; these are ours) */
  function release() { LAST = null; if (KG.MESH && typeof GLM !== 'undefined' && GLM.free) for (const k in KG.MESH) if (KG.MESH[k]) GLM.free(KG.MESH[k]); }
  D3.onRelease(release);
  /* and when the dungeon game closes (its destroy) after a fight with it: its buffers freed and the kept pictures given back at once */
  try { const GD = typeof GAMES !== 'undefined' && GAMES.dungeon; if (GD && GD.create && !GD.__skRel) { const c0 = GD.create; GD.__skRel = 1; GD.create = function () { const api = c0.apply(this, arguments); if (api && typeof api.destroy === 'function') { const d0 = api.destroy; api.destroy = function () { if (KG.used) { KG.used = false; try { release(); D3.dropPics(); } catch (e) { /* (nothing to drop) */ } } return d0.apply(this, arguments); }; } return api; }; } } catch (e) { /* (no dungeon game) */ }
  /* a studio portrait (tests): the hound in a pose (the 2D file's demo memory, its fields over a quiet one), at the origin */
  function studio(c, x, y, over, o) { const R0 = RIG(); if (!R0 || !KG.on()) return null; o = o || {}; const T0 = o.T || 30, m = { x: 0, y: 0, hitSq: 0, flash: 0 };
    const M = Object.assign({ hd: Math.PI / 2, look: 0, crouch: 0, lunge: 0, jaw: 0, roar: 0, recoil: 0, stuck: 0, howl: 0, gait: 1.3, spdK: 0, lean: 0, bt: 1.3, menace: 0.4, slitK: 0 }, over || {});
    const P = R0.poseOf(m, M), R = rig(P, 0, 0, null, { slitK: M.slitK, menace: M.menace }), V = K.mkView(0, 0, 0, 0, { T: T0, sx: v => x + v * T0, sy: v => y + v * T0 }); LAST = R;
    return passOf(c, V, R.inst, { t: M.bt }) ? R : null; }
  function studioPiece(c, x, y, part, glow, T0) { if (!KG.on()) return false; const V = K.mkView(0, 0, 0, 0, { T: T0, sx: v => x + v * T0, sy: v => y + v * T0 }); return passOf(c, V, [{ part, R: I3(), o: [0, 0, 0], s: 1, glow, wear: 0.4 }], { t: 0 }); }
  const memMB = () => { let b = 0; if (KG.MESH) for (const k in KG.MESH) { const M = KG.MESH[k]; if (M) b += M.pos.byteLength * 2 + M.att.byteLength + M.idx.byteLength; } return +(b / 1048576).toFixed(2); };
  return { VS, UP: UPV, vs: () => (gpu() ? VS : 1), on: () => gpu(), gl: () => KG.on(), fx: () => !!fg(), mark, lungeEnd, init, update, drawBoss, drawFx, overlay, preload, release, studio, studioPiece,
    __dbg: { get gl() { return KG.on(); }, set noGL(v) { KG.NOGL = !!v; }, get MESH() { return KG.MESH; }, get last() { return LAST; }, get mem() { return { meshMB: memMB(), uploaded: KG.MESH ? Object.values(KG.MESH).filter(M => M && M.gl).length : 0, pics: D3.picN }; },
      get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +KG.ms.toFixed(2), frames: KG.n, box: KG.box, meshMs: +KG.meshMs.toFixed(1), meshTris: KG.tris }); } } };
})();
