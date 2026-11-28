/* ---------- (v474 LM) LIB_BROOD: Rift 07's brood in three dimensions, its attacks on the GPU, its mini bosses as giant evil Cocopets ----------
   The user (2026-11-28): "rebuild/remake rift 7 in gpu to the same graphical fidelity as rift 5 and 6. All props and monsters got to be
   remade, the monsters got to be light to draw on the gpu. You can use the 2d version as reference."

   THE BROOD (20zb, 20zb2; the challenge stages (20za) and the bosses' fights (20ze/20zf/20zg) bring the same kinds). Each is its 2D
   drawing made a model: the same creature, silhouette, colours and signature parts. The margin worm: a strip of parchment curled into a
   scroll on its edge, a burgundy spine down its middle and lines of script either side, its head running out along the floor to an
   ink-black nib of a mouth and a gold eye; unrolled ('block') it lies long and wavy on the floor, ready to snap ('dash': stretched). The
   ink stalker: a glossy blot of black-violet ink, lumpy and dripping, on four angular legs, one white eye with a small ink pupil, a
   puddle under it; flattened into a wide puddle before it dashes ('block'), stretched and leaning as it runs ('dash'). The false folio:
   a floating closed book, burgundy leather covers framed and cornered in gold, a gilt lozenge on the cover, the page block's fine
   leaves, a dark spine, two inked pages for fins beating at its sides; revealed ('block') its cover swings open on a written page with
   a violet sigil burning in it. The seraphling: a white robe hemmed in gold, a pale gold porcelain mask with one great eye (sky blue;
   amber as it calls the fire, 'block'), six white feathered wings in three pairs (raised as it casts), a halo of light. The halo guard:
   a platinum knight, a cuirass with a gold cross, pauldrons, a helm with a T-visor burning gold (white as it aims), a halo, folded
   wings rising behind, a gold spear held high, lowered to aim ('block') and thrust in the lunge ('dash'). The ophan wheel: two gold
   rings turning through each other, six eyes set in each, a hub of white-gold light (flaring, the eyes amber: 'block'). The teetering
   shelf: a tall bookcase of the land's wood (walnut and gold; white lacquer; ivory), four shelves of book blocks with gold bands, a
   gilded arched crown, rocked onto one corner, a ring of gold light on the floor round it and a gold medallion with an ink "!" over it.
   The loose page (Syllax's): a sheet folded down its middle like a moth, two inked halves beating, a burgundy spine, an ink eye with a
   gold pupil at its front; folded into a paper dart for its strike ('block', 'dash').
   GLM models (rigid parts built once, all opaque (a part seen through costs a program of its own the first time: one long hitch),
   materials 910..929 in the LM-LIB-MAT block of 20k5uz (sub-ids .1-.4 only: an id is rounded, so .5 would read as the next); a few
   hundred to ~2.5k triangles each), never drawn live: every frame the game needs is rendered ONCE into the monster sprite cache the 2D
   art already uses (DunArt.monSprite: type x size x frame x mode, an LRU of small canvases), as Rift 05's and 06's broods (20s6f, 20u6f)
   are. Its painter (MP[type]) is wrapped: where the GPU can be used it renders the model posed for that frame and mode into the
   sprite's canvas (its contact shadow and soft lights laid in 2D once, inside the picture), else it paints the 2D art as before. A
   crowd costs what the 2D crowd cost: one drawImage a monster a frame, no GL per monster per frame (Nhalex's horde of 50 included).
   Models with a front (margin worm, ink stalker, halo guard) are baked facing each way ('<' in the mode, DunArt.FACED); the others
   are baked once and mirrored. Frames are rendered on the loading screen (Rf.preload); anything first seen in play within a budget
   (two pictures or 4 ms in any 14 ms), the rest painted in 2D for a moment and rendered again later. Pictures and meshes' GPU buffers
   are let go when a stage closes. Only in Rift 07's lands (the Catalogue, the Silver Bindery, the Ascent: their boss arenas too).
   THEIR ATTACKS: the brood's and the minis' tells (lanes, rings, cones), the false folios' and Folio's page darts and the ophan wheels'
   beads of light (painted in the engine's own GPU pass: b.paint), the ink stalkers' and Blot's ink (the 'stall' patches they leave:
   wet ink pools; 20b leaves a 'stall' zone with a `drawn` hook to its maker), the dashes' streaks, the strikes' bursts (ink splashes
   and gold flashes), the teetering shelves' fall lines (shown when you come close: a soft gold band with chevrons drifting the way it
   falls), the seraphlings' holy fire (a column of white-gold light falling onto its circle: 20zb2's PILLARS, its 2D loop held back
   while this layer paints) and the false folios' glint (a twinkle of gold over a book still pretending to be loot) are painted on the
   GPU (FGFX kinds 640..647, LM-FX in 20k6h: laid over (the floors are parchment, white marble and cloud), feathered, glow only; the
   tells in the rift's own colours: ink violet, deep gold, burgundy, holy amber; no red circles). Their numbers and timings are
   untouched: the AI is wrapped only to tag what it makes. Where FGFX is not usable the engine draws them in 2D as before.
   THE MINI BOSSES (Quill, Blot, Folio): giant evil Cocopets like every other rift's (EVIL_MINI, 20zz9: PetGL, its poses baked, v471),
   themed for the Library by MINI_LOOK: Quill a sepia-ink coat with gold, feathered, plume tail and crystal horns; Blot an ink-black
   jelly body with violet, devil horns, a spade tail; Folio a burgundy coat with gold, feathered wings, ram horns, a ribbon tail (a
   bookmark); armoured, their own moves, health and blows kept (EVIL_MINI.arm with keep). Before, they were random Rift-touched pets.
   Without WebGL, on a software rasteriser (unless window.__LIB_GL = 1, tests), with window.__LIB_GL = 0 or after three failures in
   20 s, the 2D art is drawn exactly as before. window.__LIB_GLHQ = 1: full resolution on a software rasteriser (tests);
   window.__LIB_FX = 0: the attacks' GPU layer off; window.__LIB_NOBUDGET = 1: no baking budget in play (tests). */
const LIB_BROOD = (() => {
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
  const LANDS = { catalogue: 1, binding: 1, archive: 1 };
  const LB0 = typeof LIB !== 'undefined' ? LIB : { GOLD: '#CFAD62', GOLD_HI: '#F2DC9A', VIOLET: '#8A5BD0', VIOLET_HI: '#CDB4FF', PARCH_HI: '#F4EAD2', BURG: '#6B324F', BURG_HI: '#9A4A72' };
  const { GOLD, GOLD_HI, VIOLET, VIOLET_HI, PARCH_HI, BURG, BURG_HI } = LB0;
  /* the lights (world: x east, y south toward the viewer, z up): each land's key colour (uAmb) and rim (uRim) */
  const LIGHT = {
    catalogue: { lk: vnrm([-0.5, 0.4, 0.78]), ls: vnrm([0.3, 0.25, 0.92]), lr: vnrm([0.55, -0.75, 0.38]), key: [1.42, 1.27, 1.06], rim: [0.95, 0.62, 1.4] },
    binding: { lk: vnrm([-0.45, 0.35, 0.82]), ls: vnrm([0.25, 0.3, 0.92]), lr: vnrm([0.5, -0.8, 0.35]), key: [1.27, 1.31, 1.42], rim: [0.82, 0.92, 1.42] },
    archive: { lk: vnrm([-0.4, 0.45, 0.8]), ls: vnrm([0.3, 0.25, 0.9]), lr: vnrm([-0.5, -0.75, 0.42]), key: [1.5, 1.44, 1.3], rim: [1.45, 1.18, 0.66] } };
  const OUTC = [0.08, 0.055, 0.09], UPW = [0, 0, 1], GLCAP = 1400, GLI = [], GLJ = [];
  /* the materials (LM-LIB-MAT, 20k5uz) */
  const PAPER = 910, PARCH_OLD = 910.1, PAGES = 910.2, SCRIPT = 910.3, STRIP = 910.4, LIT = 911, LEATHER = 912, SPINE = 912.1, GILT = 913, GILT_PALE = 913.1, GILT_OLD = 913.2,
    INK = 914, ENAMEL = 914.1, PUPIL = 914.2, WOOD = 915, WOOD_BACK = 915.1, BOOKS = 916, PLAT = 917, PLAT_D = 917.1, FEATHER = 918, FEATHER_S = 918.1, ROBE = 919, MASK = 919.1, EYE = 920;
  /* ---- a model's GL state: meshes built once on first use (lowFx: fewer segments), failures counted ---- */
  let FAILS = 0, FAILT = 0, NOGL = false;
  function failed() { const t = nowMs(); if (t - FAILT > 20000) FAILS = 0; FAILT = t; if (++FAILS >= 3) NOGL = true; }
  function glBase() { if (NOGL || win('__LIB_GL') === 0 || typeof GLM === 'undefined') return false; try { if (!GLM.ok()) return false; if (GLM.soft && win('__LIB_GL') !== 1) return false; } catch (e) { return false; } return true; }
  const MODELS = [];
  function model(name, build) {
    const G = { name, MESH: null, PB: {}, ms: 0, n: 0, meshMs: 0,
      on() { if (!glBase()) return false; if (!G.MESH) { try { const t0 = nowMs(); G.MESH = build(lowFx() ? 0.65 : 1); G.meshMs = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('LIB_BROOD ' + name + ': meshes', e); return false; } } return true; },
      bounds(part) { let b = G.PB[part]; if (b) return b; const M = G.MESH && G.MESH[part]; if (!M) return [[-1, -1, -1], [1, 1, 1]]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
        for (let i = 0; i < p.length; i += 3) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1]; if (p[i + 2] < z0) z0 = p[i + 2]; if (p[i + 2] > z1) z1 = p[i + 2]; }
        return (G.PB[part] = [[x0, y0, z0], [x1, y1, z1]]); },
      get tris() { return G.MESH ? Object.values(G.MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0; } };
    MODELS.push(G); return G; }
  /* ---- one GPU pass: parts ({ part, R, o, s, sc, al, glow, glow2, spill, kind, fx, wear, outline }) in model units, the view
     V { k (px a unit), Rh (the heading), X0, Y0 (where the model's origin falls) } on c; o: { light, t, outline, res } ---- */
  function glPass(c, V, list, o, G) {
    const k = V.k, PX = [1, 0, 0], PY = [0, GY, -ZK], PD = CW, LT = LIGHT[o.light] || LIGHT.catalogue;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { if (!G.MESH[it.part]) continue; const [lo, hi] = G.bounds(it.part), sc = it.sc || [1, 1, 1], s = it.s || 1;
      for (let q = 0; q < 8; q++) { const lc = [(q & 1 ? hi[0] : lo[0]) * sc[0] * s, (q & 2 ? hi[1] : lo[1]) * sc[1] * s, (q & 4 ? hi[2] : lo[2]) * sc[2] * s], w = mv(V.Rh, vadd(it.o, mv(it.R, lc))), sx = V.X0 + w[0] * k, sy = V.Y0 + (w[1] * GY - w[2] * ZK) * k;
        if (sx < bx0) bx0 = sx; if (sx > bx1) bx1 = sx; if (sy < by0) by0 = sy; if (sy > by1) by1 = sy; } }
    { const pad = 2 + k * 0.03; bx0 -= pad; by0 -= pad; bx1 += pad; by1 += pad; }
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !win('__LIB_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (o.res || 1);
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
  function blob(c, x, y, rx2, ry2, a) { if (!BLOB) { BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const g = BLOB.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(20,10,22,1)'); gr.addColorStop(0.5, 'rgba(20,10,22,.6)'); gr.addColorStop(1, 'rgba(20,10,22,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    c.save(); c.globalAlpha = a; c.drawImage(BLOB, x - rx2, y - ry2, rx2 * 2, ry2 * 2); c.restore(); }
  /* a two-point leg: hip to foot with the knee lifted toward `out` (a unit vector), lengths l1, l2 */
  function knee(h, f, l1, l2, out) { const d = vsub(f, h), L = Math.min(l1 + l2 - 1e-3, Math.max(1e-3, vlen(d))), u = vnrm(d), a = (l1 * l1 - l2 * l2 + L * L) / (2 * L), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    let w = vsub(out, vmul(u, vdot(out, u))); w = vlen(w) < 1e-5 ? [0, 0, 1] : vnrm(w); return vadd(vadd(h, vmul(u, a)), vmul(w, hh)); }
  const NS = (n, q) => Math.max(4, Math.round(n * q));
  /* a feather blade along +x (length len, its vane widest past the middle, a little curved back, cupped); edge = u along, occlusion =
     v across (for the barbs) */
  const blade = (B, len, m, q, curl) => B.surf((u, v) => { const w = len * 0.12 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + u * 1.0)), 0.7) + 0.012, y = (v - 0.5) * 2 * w; return [len * u, y, -(curl || 0.12) * len * u * u + Math.abs(v - 0.5) * w * 0.35]; }, NS(9, q), 2, () => m, { e: u => u, a: (u, v) => v });

  /* ======================= the models ======================= */
  const DEF = {};
  /* ---- the margin worm: a parchment strip curled on its edge into a scroll (the spiral in the x-z plane, its width across y), its head
     running out along the floor to an ink nib and a gold eye; unrolled ('block') it lies long on the floor in slow waves; 'dash' stretched */
  const WW = 0.27;
  const curlAt = u => { if (u <= 0.8) { const s = u / 0.8, a = -Math.PI / 2 - (1 - s) * TAU * 1.7, rr = 0.12 + 0.78 * s; return [Math.cos(a) * rr, 0.93 + Math.sin(a) * rr]; } const s = (u - 0.8) / 0.2; return [s * 0.62, 0.03 + s * s * 0.1]; };
  const flatAt = (u, f) => { const x = -1.42 + u * 2.84, pz = f / 3 * TAU, cu = u < 0.14 ? (0.14 - u) / 0.14 : 0, z = 0.05 + 0.065 * (1 + Math.sin(u * TAU * 1.25 - pz)) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, u * 1.05))); return [x + cu * 0.08, z + cu * cu * 0.32]; };
  const NIB = [[0, -0.07], [0.34, 0.02], [0, 0.13]];
  DEF.marginworm = { ext: 2.3, nf: 6, faced: true, head: 0.24, modes: ['', 'block', 'dash'], foot: 0.75,
    G: model('marginworm', q => { const out = {}, Bd = () => GLM.builder(q), taper = u => (u > 0.9 ? 1 - (u - 0.9) * 3.5 : 1);
      out.curl = Bd().surf((u, v) => { const [x, z] = curlAt(u); return [x, (v - 0.5) * 2 * WW * taper(u), z]; }, NS(60, q), 2, () => STRIP, { e: u => u, a: (u, v) => v }).done();
      for (let f = 0; f < 3; f++) out['flat' + f] = Bd().surf((u, v) => { const [x, z] = flatAt(u, f); return [x, (v - 0.5) * 2 * WW * (u > 0.92 ? 1 - (u - 0.92) * 4.5 : 1), z + (v - 0.5) * 0.08]; }, NS(44, q), 2, () => STRIP, { e: u => u, a: (u, v) => v }).done();
      out.nib = (() => { const B = Bd(); B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); B.prism(NIB, -0.13, 0.13, INK, { b: 0.025 }); B.pop(); return B.done(); })();
      out.eye = Bd().sph([0, 0, 0], 0.07, LIT, 10).done();
      return out; }),
    pose(ph, md) { const stt = md === 'block' || md === 'dash', dash = md === 'dash', L = [], k = Math.sin(ph * TAU);
      if (!stt) { const wob = k * 0.08, R = ry(wob), br = 1 + 0.035 * Math.sin(ph * TAU * 2), sc = [br, 1, br], np = at3(R, [0.58 * br, 0, 0.09 * br]), ep = at3(R, [0.44 * br, 0, 0.135 * br]);
        L.push(P('curl', [0, 0, 0], R, { sc, wear: 0.3 }), P('nib', np, R, { wear: 0.5 }), P('eye', ep, I3(), { kind: 0, glow: 1.2 + 0.3 * Math.sin(ph * TAU * 3), outline: false }));
        return { parts: L, halos: [[ep, 0.32, GOLD_HI, 0.45]], shadow: [0.95, 0.3, 0.28] }; }
      const f = Math.floor(ph * 6) % 3, sx = dash ? 1.12 : 1, o = [dash ? 0.12 : 0, 0, 0], [xe, ze] = flatAt(1, f), np = vadd(o, [xe * sx - 0.04, 0, ze * (dash ? 0.8 : 1) - 0.02]), ep = vadd(np, [-0.12, 0, 0.07]);
      L.push(P('flat' + f, o, I3(), { sc: [sx, dash ? 0.92 : 1, dash ? 0.8 : 1], wear: 0.3 }), P('nib', np, ry(-0.1), { wear: 0.5 }), P('eye', ep, I3(), { kind: 0, glow: 1.6, outline: false }));
      return { parts: L, halos: [[ep, 0.36, GOLD_HI, 0.6]], shadow: [1.55, 0.3, 0.28] }; } };

  /* ---- the ink stalker: a glossy lumpy blot of ink on four angular legs, one white eye with a small ink pupil, a puddle under it;
     'block' flattened into a wide puddle (legs folded under), 'dash' stretched and leaning, legs swept ---- */
  const STALK_LEGS = [[0.42, 1, 0], [0.42, -1, 0.5], [-0.4, 1, 0.5], [-0.4, -1, 0]];
  DEF.inkstalker = { ext: 2.0, nf: 6, faced: true, head: 0.5, modes: ['', 'block', 'dash'], foot: 0.75,
    G: model('inkstalker', q => { const out = {}, Bd = () => GLM.builder(q);
      out.body = (() => { const B = Bd(); B.ell([0, 0, 0], [0.8, 0.66, 0.46], INK, { seg: 20, rings: 10 }); [[0.3, 0.28, 0.18, 0.24], [-0.32, 0.3, 0.12, 0.22], [0.12, -0.36, 0.14, 0.24], [-0.42, -0.22, 0.1, 0.22], [0.0, 0.02, 0.3, 0.3], [-0.58, 0.02, 0.02, 0.2], [0.5, 0.0, 0.08, 0.2]].forEach(([x, y, z, r]) => B.sph([x, y, z], r, INK, 9));
        for (const [x, y] of [[0.25, 0.3], [-0.3, -0.32], [-0.1, 0.42]]) B.tube([x, y, -0.25], [x * 1.05, y * 1.05, -0.5], 0.085, 0.03, INK, { seg: 6 }); return B.done(); })();
      out.pool = Bd().ell([0, 0, 0], [1, 0.85, 0.03], INK, { seg: 20, rings: 3 }).done();
      out.eye = Bd().sph([0, 0, 0], 1, EYE, 14).done();
      out.thigh = Bd().tube([0, 0, 0], [0.46, 0, 0], 0.07, 0.05, INK, { seg: 7 }).done();
      out.shin = Bd().tube([0, 0, 0], [0.56, 0, 0], 0.05, 0.016, INK, { seg: 7, cap1: 'flat' }).done();
      return out; }),
    pose(ph, md) { const flat = md === 'block', dash = md === 'dash', g = dash ? 3 : 1, run = Math.sin(ph * TAU * g), L = [];
      if (flat) { const bo = [0, 0, 0.17], w = 1 + 0.04 * Math.sin(ph * TAU * 2), ep = [0.5, 0, 0.36];
        L.push(P('pool', [0, 0, 0.012], I3(), { s: 1.45 * w, wear: 0.6 }), P('body', bo, I3(), { sc: [1.38 * w, 1.3 * w, 0.42], wear: 0.4 }), P('eye', ep, frameXZ([1, 0, 0.9], [0, 0, 1]), { s: 0.21, sc: [1, 1, 0.7], kind: 3, wear: 0.2 }));
        return { parts: L, halos: [[ep, 0.3, VIOLET_HI, 0.25]], shadow: [1.45, 0.45, 0.3] }; }
      const bz = 0.62 + Math.abs(Math.cos(ph * TAU * g)) * 0.05, lean = dash ? 0.16 : run * 0.03, BR = ry(lean), bo = [dash ? 0.12 : 0, 0, bz], w = 1 + 0.03 * Math.sin(ph * TAU * 2);
      L.push(P('pool', [0, 0, 0.012], I3(), { s: 0.62, wear: 0.6 }), P('body', bo, BR, { sc: dash ? [1.18, 0.9, 0.85] : [w, w, 1 / w], wear: 0.4 }));
      const ep = vadd(bo, at3(BR, [dash ? 0.78 : 0.64, 0, 0.2])); L.push(P('eye', ep, mm(BR, frameXZ([1, 0, 0.55], [0, 0, 1])), { s: 0.19, kind: 3, wear: 0.2 }));
      for (const [lx, sy, off] of STALK_LEGS) { const hip = vadd(bo, at3(BR, [lx, sy * 0.38, -0.08])), u = (ph * g + off) * TAU, sw = Math.sin(u);
        const foot = [lx * 1.25 + (dash ? -0.22 : 0) + sw * (dash ? 0.3 : 0.2), sy * 0.78, Math.max(0, Math.cos(u)) * (dash ? 0.12 : 0.08)], kn = knee(hip, foot, 0.46, 0.56, vnrm([lx * 0.3, sy, 1.5]));
        L.push(bone('thigh', hip, kn, { wear: 0.3 }), bone('shin', kn, foot, { wear: 0.6 })); }
      return { parts: L, halos: [[ep, 0.32, VIOLET_HI, 0.22]], shadow: [1.0, 0.32, 0.3] }; } };

  /* ---- the false folio: a floating closed book (burgundy covers framed and cornered in gold, a gilt lozenge, the page block, a dark
     spine), two inked pages beating at its sides for fins; 'block' its cover swung open on a written page, a violet sigil burning ---- */
  const BK = { H: 0.62, W: 1.0, CX: 0.175, CT: 0.035 };
  DEF.falsefolio = { ext: 2.2, nf: 6, faced: false, yaw: Math.PI / 2 - 0.45, modes: ['', 'block'], foot: 1.1,
    G: model('falsefolio', q => { const out = {}, Bd = () => GLM.builder(q), { H, W, CT } = BK;
      // the front cover in its hinge's frame (the spine edge at the origin, the cover running +y), with its gold frame, corners and lozenge
      out.front = (() => { const B = Bd(); B.box([0, W / 2, 0], [CT, W / 2, H], 0.02, LEATHER);
        for (const zz of [-1, 1]) B.box([CT + 0.008, W / 2 + 0.03, zz * (H - 0.1)], [0.012, W / 2 - 0.12, 0.022], 0.008, GILT);
        B.box([CT + 0.008, W - 0.1, 0], [0.012, 0.022, H - 0.12], 0.008, GILT); B.box([CT + 0.008, 0.16, 0], [0.012, 0.022, H - 0.12], 0.008, GILT);
        for (const zz of [-1, 1]) B.box([0.005, W - 0.05, zz * (H - 0.05)], [CT + 0.012, 0.07, 0.07], 0.02, GILT);
        B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [CT + 0.01, W * 0.56, 0]); B.prism([[0, -0.2], [0.13, 0], [0, 0.2], [-0.13, 0]], 0, 0.03, GILT, { b: 0.012 }); B.pop(); return B.done(); })();
      out.back = Bd().box([0, 0, 0], [CT, W / 2, H], 0.02, LEATHER).done();
      out.pages = (() => { const B = Bd(); B.box([0, 0.03, 0], [BK.CX - CT, W / 2 - 0.05, H - 0.045], 0.015, PAGES); B.box([0, 0.03, H - 0.048], [BK.CX - CT - 0.01, W / 2 - 0.06, 0.006], 0, GILT_PALE); return B.done(); })();
      out.spine = (() => { const B = Bd(); B.tube([0, 0, -H], [0, 0, H], BK.CX + 0.02, BK.CX + 0.02, SPINE, { seg: 14, cap0: 'flat', cap1: 'flat' }); for (const zz of [-0.36, 0, 0.36]) B.tor([0, 0, zz * H * 1.4], BK.CX + 0.03, 0.018, GILT, { seg: 14, rseg: 4 }); return B.done(); })();
      out.face = (() => { const B = Bd(); B.surf((u, v) => [0, (u - 0.5) * (W - 0.14), (v - 0.5) * 2 * (H - 0.08)], 3, 3, () => SCRIPT, { e: u => u, a: (u, v) => 1 - v }); return B.done(); })();
      out.sigil = (() => { const B = Bd(); B.ell([0, 0, 0], [0.02, 0.2, 0.11], LIT, { seg: 16, rings: 5 }); B.ell([0.01, 0, 0], [0.025, 0.06, 0.06], LIT, { seg: 10, rings: 4 }); return B.done(); })();
      out.leaf = Bd().surf((u, v) => [Math.sin(u * Math.PI) * 0.05, u * (W - 0.12), (v - 0.5) * 2 * (H - 0.09)], 6, 2, () => SCRIPT, { e: u => u, a: (u, v) => 1 - v }).done();
      // a fin: an inked page from the book's side, its root at the origin spanning +y (sd -1: -y), its tip lifted
      const fin = sd => Bd().surf((u, v) => { const h = 0.56 * (1 - 0.55 * u); return [-0.16 * u * u + (v - 0.5) * h * 0.75, sd * u * 0.9, (v - 0.5) * h * 0.6 + 0.3 * u * u]; }, NS(8, q), 3, () => SCRIPT, { e: (u, v) => (sd > 0 ? u : 1 - u), a: (u, v) => 1 - v, flip: sd < 0 }).done();
      out.finR = fin(1); out.finL = fin(-1);
      return out; }),
    pose(ph, md) { const op = md === 'block' ? 1 : 0, bob = Math.sin(ph * TAU) * 0.12, fl = Math.sin(ph * TAU * 2), c = [0, 0, 2.25 + bob], L = [], { W, CX } = BK;
      const BR = mm(rx(Math.sin(ph * TAU) * 0.04), ry(-0.08 - op * 0.06)), at = p => vadd(c, at3(BR, p));
      L.push(P('back', at([-CX, 0, 0]), BR, { wear: 0.4 }), P('pages', at([0, 0, 0]), BR, { wear: 0.3 }), P('spine', at([0, -W / 2, 0]), BR, { wear: 0.5 }));
      const hg = mm(BR, rz(-op * 1.95)); L.push(P('front', at([CX, -W / 2, 0]), hg, { wear: 0.45, kind: 0, glow: op ? 0 : 0.6 + 0.6 * Math.max(0, Math.sin(ph * TAU * 1.5)) }));
      if (op) { L.push(P('face', at([CX - BK.CT + 0.004, 0.03, 0]), BR, { wear: 0.2 }), P('sigil', at([CX - BK.CT + 0.02, 0.05, 0.02]), BR, { kind: 1, glow: 1.6 + 0.4 * Math.sin(ph * TAU * 3), outline: false }));
        for (let i = 0; i < 2; i++) L.push(P('leaf', at([CX - 0.05, -W / 2 + 0.06, 0]), mm(BR, rz(-0.45 - i * 0.55 - 0.12 * Math.sin(ph * TAU + i))), { wear: 0.25 + i * 0.3 })); }
      const fa = 0.15 + fl * 0.42; for (const sd of [1, -1]) L.push(P(sd > 0 ? 'finR' : 'finL', at([-0.06, sd * (W / 2 + (sd < 0 ? CX : 0.0)), 0.05]), mm(BR, rx(sd * fa)), { wear: sd > 0 ? 0.35 : 0.7 }));
      const hz = op ? [[at([CX + 0.1, 0.05, 0.02]), 0.9, VIOLET, 0.55], [at([CX + 0.1, 0.05, 0.02]), 0.4, VIOLET_HI, 0.5]] : [[at([CX + 0.05, W * 0.06, 0]), 0.45, GOLD_HI, 0.12 + 0.3 * Math.max(0, Math.sin(ph * TAU * 1.5))]];
      return { parts: L, halos: hz, shadow: [0.72, 0.22, 0.22] }; } };

  /* ---- the seraphling: a white robe hemmed in gold, a pale gold porcelain mask with one great eye, six white feathered wings in three
     pairs, a halo; 'block' (calling the fire): wings raised, the eye amber, a glow round it ---- */
  const SER_PAIRS = [[0.46, 1.45, 0], [-0.06, 1.12, 1], [-0.56, 0.8, 2]];
  DEF.seraphling = { ext: 2.45, nf: 6, faced: false, yaw: Math.PI / 2 - 0.12, modes: ['', 'block'], foot: 1.15,
    G: model('seraphling', q => { const out = {}, Bd = () => GLM.builder(q);
      out.robe = (() => { const B = Bd(); B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]); B.lathe([[1.22, 0], [1.24, 0.5], [1.45, 0.47], [1.7, 0.4], [1.95, 0.31], [2.12, 0.22], [2.2, 0.05], [2.2, 0]], ROBE, { seg: 22 }); B.pop(); B.tor([0, 0, 1.26], 0.5, 0.04, GILT_PALE, { seg: 22, rseg: 5 }); B.tor([0, 0, 2.08], 0.25, 0.035, GILT_PALE, { seg: 16, rseg: 4 }); return B.done(); })();
      out.head = Bd().sph([0, 0, 0], 0.48, MASK, 18).done();
      out.eye = Bd().sph([0, 0, 0], 1, EYE, 16).done();
      out.halo = Bd().tor([0, 0, 0], 0.4, 0.05, LIT, { seg: 26, rseg: 5 }).done();
      out.b0 = blade(Bd(), 1.45, FEATHER, q, 0.1).done(); out.b1 = blade(Bd(), 1.12, FEATHER, q, 0.1).done(); out.b2 = blade(Bd(), 0.8, FEATHER, q, 0.1).done();
      return out; }),
    pose(ph, md) { const cast = md === 'block' ? 1 : 0, bob = Math.sin(ph * TAU) * 0.12, fl = Math.sin(ph * TAU * 2) * 0.16, zc = bob, L = [];
      L.push(P('robe', [0, 0, zc], I3(), { wear: 0.4 }), P('head', [0, 0, 2.52 + zc], I3(), { wear: 0.3 }));
      const ep = [0.34, 0, 2.72 + zc]; L.push(P('eye', ep, ry(-0.7), { s: 0.36, sc: [0.4, 1, 0.56], kind: cast ? 1 : 0, glow: cast ? 1.4 : 0.25, wear: 0.2 }));
      const hp = [0, 0, 3.22 + zc]; L.push(P('halo', hp, rx(0.12), { kind: 2, glow: 1.1 + cast * 0.8 + 0.15 * Math.sin(ph * TAU * 3), outline: false }));
      for (const [e0, , bi] of SER_PAIRS) for (const sd of [1, -1]) { const root = [-0.2, sd * 0.22, 2.12 + zc], e = e0 + fl * (1 - bi * 0.25) + cast * 0.5;
        for (let j = 0; j < 4; j++) { const ej = e + (j - 1.5) * 0.16, d = [-0.28 - j * 0.04, sd * Math.cos(ej), Math.sin(ej)]; L.push(P('b' + bi, vadd(root, [-j * 0.02, 0, 0]), frameXZ(d, [1, 0, 0.9]), { s: 1 - j * 0.1, wear: 0.2 + j * 0.15 + (sd > 0 ? 0 : 0.4) })); } }
      const hz = [[hp, 0.7, GOLD_HI, 0.4 + cast * 0.35], [ep, 0.35, cast ? '#FFB04A' : '#BFD4FF', 0.25 + cast * 0.4]]; if (cast) hz.push([[0, 0, 2.3 + zc], 1.7, '#FFE9A8', 0.45]);
      return { parts: L, halos: hz, shadow: [0.62, 0.2, 0.2] }; } };

  /* ---- the halo guard: a platinum knight (cuirass with a gold cross, pauldrons, greaves, a helm with a burning gold T-visor, a halo),
     folded wings rising behind, a gold spear: held high, lowered to aim ('block'), thrust in the lunge ('dash') ---- */
  DEF.haloguard = { ext: 3.15, nf: 6, faced: true, head: 0.32, modes: ['', 'block', 'dash'], foot: 0.85,
    G: model('haloguard', q => { const out = {}, Bd = () => GLM.builder(q);
      out.leg = (() => { const B = Bd(); B.tube([0, 0, 0], [0.86, 0, 0], 0.12, 0.1, PLAT_D, { seg: 10 }); B.tor([0.42, 0, 0], 0.125, 0.025, GILT, { seg: 12, rseg: 4 }); return B.done(); })();
      out.foot = Bd().box([0.07, 0, 0.05], [0.16, 0.1, 0.05], 0.03, PLAT_D).done();
      out.skirt = (() => { const B = Bd(); B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]); B.lathe([[-0.22, 0.26], [-0.2, 0.36], [0.0, 0.42], [0.06, 0.4], [0.06, 0.3]], PLAT, { seg: 18 }); B.pop(); return B.done(); })();
      out.torso = (() => { const B = Bd(); B.ell([0, 0, 0], [0.4, 0.52, 0.56], PLAT, { seg: 14, rings: 8 }); B.box([0.39, 0, 0.02], [0.03, 0.05, 0.32], 0.015, GILT); B.box([0.37, 0, 0.12], [0.03, 0.26, 0.05], 0.015, GILT); B.tor([0, 0, -0.42], 0.3, 0.04, GILT, { seg: 18, rseg: 4 }); return B.done(); })();
      out.pauld = Bd().ell([0, 0, 0], [0.2, 0.2, 0.16], PLAT, { seg: 10, rings: 5, th1: Math.PI * 0.62, cap: true }).done();
      out.arm = Bd().tube([0, 0, 0], [0.42, 0, 0], 0.085, 0.075, PLAT_D, { seg: 8 }).done();
      out.helm = (() => { const B = Bd(); B.ell([0, 0, 0], [0.3, 0.27, 0.34], PLAT, { seg: 14, rings: 8 }); B.tor([0, 0, -0.26], 0.2, 0.03, GILT, { seg: 16, rseg: 4 }); B.box([0.02, 0, 0.3], [0.2, 0.025, 0.07], 0.02, GILT); return B.done(); })();
      out.visor = (() => { const B = Bd(); B.box([0, 0, 0.05], [0.03, 0.18, 0.032], 0.012, LIT); B.box([0.005, 0, -0.04], [0.03, 0.032, 0.11], 0.012, LIT); return B.done(); })();
      out.halo = Bd().tor([0, 0, 0], 0.34, 0.045, LIT, { seg: 24, rseg: 5 }).done();
      out.w0 = blade(Bd(), 1.35, FEATHER_S, q, 0.08).done(); out.w1 = blade(Bd(), 1.1, FEATHER_S, q, 0.08).done();
      out.spear = (() => { const B = Bd(); B.tube([-0.6, 0, 0], [1.38, 0, 0], 0.045, 0.04, GILT, { seg: 8 }); B.torX([1.38, 0, 0], 0.07, 0.03, GILT, { seg: 10, rseg: 4 }); B.spike([1.4, 0, 0], [1.85, 0, 0], 0.1, PLAT, { seg: 6 }); B.sph([-0.63, 0, 0], 0.07, GILT, 8); return B.done(); })();
      return out; }),
    pose(ph, md) { const aim = md === 'block' ? 1 : 0, lunge = md === 'dash' ? 1 : 0, stp = Math.sin(ph * TAU), L = [];
      const lean = lunge ? 0.22 : aim ? 0.08 : stp * 0.02, BR = ry(lean), hip = [lunge ? 0.18 : 0, 0, 0.98 + Math.abs(Math.cos(ph * TAU)) * 0.03 * (1 - aim - lunge)];
      for (const sy of [1, -1]) { const h = vadd(hip, [0, sy * 0.2, -0.04]), f = [hip[0] + (lunge ? (sy > 0 ? 0.42 : -0.32) : aim ? (sy > 0 ? 0.18 : -0.12) : stp * sy * 0.17), sy * 0.24, Math.max(0, -stp * sy) * 0.08 * (1 - aim - lunge)];
        L.push(bone('leg', h, f, { wear: 0.4 }), P('foot', f, rz(sy * 0.08), { wear: 0.5 })); }
      L.push(P('skirt', hip, BR, { wear: 0.5 }));
      const to = vadd(hip, at3(BR, [0, 0, 0.6])); L.push(P('torso', to, BR, { wear: 0.4 }));
      for (const sy of [1, -1]) L.push(P('pauld', vadd(to, at3(BR, [0, sy * 0.52, 0.32])), BR, { wear: 0.5 + sy * 0.1 }));
      const hd = vadd(to, at3(BR, [0.03, 0, 0.96])), HR = mm(BR, ry(aim || lunge ? 0.08 : 0)); L.push(P('helm', hd, HR, { wear: 0.35 }), P('visor', vadd(hd, at3(HR, [0.285, 0, 0])), HR, { kind: aim || lunge ? 3 : 0, glow: 1.2 + (aim + lunge) * 0.9, outline: false }));
      const hp = vadd(hd, [0, 0, 0.56]); L.push(P('halo', hp, rx(0.1), { kind: 2, glow: 1.1 + 0.15 * Math.sin(ph * TAU * 2), outline: false }));
      for (const sd of [1, -1]) { const root = vadd(to, at3(BR, [-0.28, sd * 0.2, 0.3])); for (let j = 0; j < 3; j++) { const e = 1.2 - j * 0.22 + (lunge ? -0.15 : 0), d = mv(BR, [-0.32 - j * 0.06, sd * Math.cos(e) * 0.55, Math.sin(e)]); L.push(P(j ? 'w1' : 'w0', root, frameXZ(d, [1, 0, 0]), { s: 1 - j * 0.12, wear: 0.25 + j * 0.2 + (sd > 0 ? 0 : 0.4) })); } }
      // the far arm hangs; the near arm (+y) holds the spear
      { const sh = vadd(to, at3(BR, [0, -0.58, 0.26])); L.push(bone('arm', sh, vadd(sh, at3(BR, [0.08, -0.04, -0.42])), { wear: 0.4 })); }
      const sh = vadd(to, at3(BR, [0.04, 0.6, 0.26])), hand = vadd(sh, at3(BR, [0.3 + lunge * 0.36 + aim * 0.06, 0.08, -0.22 + (aim + lunge) * 0.08])), d = aim || lunge ? [1, 0, 0.1] : [Math.cos(1.25), 0, Math.sin(1.25)];
      L.push(bone('arm', sh, hand, { wear: 0.5 }), P('spear', hand, mm(BR, frameXZ(d, [0, 0, 1])), { wear: 0.5 }));
      const tip = vadd(hand, at3(mm(BR, frameXZ(d, [0, 0, 1])), [1.75, 0, 0])), hz = [[vadd(hd, at3(HR, [0.3, 0, 0])), 0.42, GOLD_HI, 0.45 + (aim + lunge) * 0.4], [hp, 0.6, GOLD_HI, 0.4]];
      if (aim || lunge) hz.push([tip, 0.45, '#FFFFFF', 0.35 + lunge * 0.3]);
      return { parts: L, halos: hz, shadow: [0.85, 0.28, 0.3] }; } };

  /* ---- the ophan wheel: two gold rings turning through each other, six eyes set in each (a sixth of a turn a loop, so the frames run
     on seamlessly), a hub of white-gold light; 'block' flaring: the eyes amber, the hub white ---- */
  const OPH_YAW = 0.35, OPH_V = (() => { const c = Math.cos(-OPH_YAW), s = Math.sin(-OPH_YAW); return vnrm([c * CW[0] - s * CW[1], s * CW[0] + c * CW[1], CW[2]]); })();
  DEF.ophanwheel = { ext: 2.25, nf: 6, faced: false, yaw: OPH_YAW, modes: ['', 'block'], foot: 1.1,
    G: model('ophanwheel', q => { const out = {}, Bd = () => GLM.builder(q);
      out.ring = (() => { const B = Bd(); B.tor([0, 0, 0], 0.9, 0.1, GILT, { seg: 32, rseg: 6 }); B.tor([0, 0, 0], 0.9, 0.035, GILT_PALE, { seg: 32, rseg: 4, ph0: 0, ph1: TAU }); return B.done(); })();
      out.eye = Bd().sph([0, 0, 0], 1, EYE, 12).done();
      out.socket = Bd().tor([0, 0, 0], 1.0, 0.22, GILT_OLD, { seg: 12, rseg: 4 }).done();
      out.hub = (() => { const B = Bd(); B.sph([0, 0, 0], 0.26, LIT, 14); return B.done(); })();
      out.cage = (() => { const B = Bd(); B.tor([0, 0, 0], 0.33, 0.028, GILT, { seg: 18, rseg: 4 }); B.torX([0, 0, 0], 0.33, 0.028, GILT, { seg: 18, rseg: 4 }); return B.done(); })();
      return out; }),
    pose(ph, md) { const fl = md === 'block' ? 1 : 0, spin = ph * TAU / 6, bob = Math.sin(ph * TAU) * 0.1, c = [0, 0, 2.15 + bob], L = [];
      const RA = mm(mm(rx(0.32), rx(Math.PI / 2)), rz(spin)), RB = mm(mm(rz(0.25), ry(Math.PI / 2)), rz(-spin));
      L.push(P('ring', c, RA, { wear: 0.4, kind: 0, glow: 0.3 + fl * 0.9 }), P('ring', c, RB, { wear: 0.7, kind: 0, glow: 0.3 + fl * 0.9 }), P('hub', c, I3(), { kind: fl ? 3 : 2, glow: 1.3 + fl * 1.2 + 0.15 * Math.sin(ph * TAU * 3), outline: false }), P('cage', c, mm(rz(spin * 2), rx(0.5)), { wear: 0.5 }));
      for (const R of [RA, RB]) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, nrm = at3(R, [Math.cos(a), Math.sin(a), 0]), p = vadd(c, vmul(nrm, 0.95)), f = vnrm(vadd(vmul(nrm, 0.55), vmul(OPH_V, 0.85)));
        // (the eye looks along its frame's x; its socket ring (round z) is turned to put z along the same way)
        const pp = vcross(f, [0, 0, 1]), side = vlen(pp) > 1e-4 ? vnrm(pp) : [1, 0, 0];
        L.push(P('eye', p, frameXZ(f, [0, 0, 1]), { s: 0.17, kind: fl ? 1 : 0, glow: 0.15 + fl * 1.0, wear: 0.2 + i * 0.1 }), P('socket', p, frameXZ(side, f), { s: 0.17, wear: 0.3 })); }
      return { parts: L, halos: [[c, 1.35, '#FFE9A8', 0.38 + fl * 0.35], [c, 0.55, '#FFFFFF', 0.3 + fl * 0.4]], shadow: [0.8, 0.24, 0.22] }; } };

  /* ---- the teetering shelf: a tall bookcase of the land's wood (uKind: 0 walnut, 1 white lacquer, 2 ivory), four shelves of book
     blocks with gold bands, a gilded arched crown, rocked onto one corner; a ring of gold light on the floor, a gold medallion with an
     ink "!" over it ---- */
  const TS = { HW: 1.31, D: 0.46, Z0: 0.24, Z1: 6.74, ROWS: 4 };
  const themeK = col => { try { const T = LB0.THEMES; if (T && col === T.silver.wood) return 1; if (T && col === T.holy.wood) return 2; } catch (e) { /* */ } return 0; };
  DEF.tottershelf = { ext: 6.9, nf: 1, faced: false, yaw: Math.PI / 2 - 0.22, modes: [''], foot: 0.8,
    G: model('tottershelf', q => { const out = {}, Bd = () => GLM.builder(q), { HW, D, Z0, Z1, ROWS } = TS, rh = (Z1 - Z0) / ROWS;
      let sd = 7; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      out.case = (() => { const B = Bd();
        for (const s of [-1, 1]) B.box([0, s * (HW - 0.1), (Z0 + Z1) / 2], [D, 0.11, (Z1 - Z0) / 2 + 0.12], 0.03, WOOD);
        B.box([0, 0, Z1 + 0.08], [D + 0.02, HW + 0.02, 0.1], 0.03, WOOD); B.box([0.02, 0, Z0 / 2], [D + 0.04, HW + 0.06, Z0 / 2], 0.03, WOOD);
        B.box([-D + 0.05, 0, (Z0 + Z1) / 2], [0.04, HW - 0.12, (Z1 - Z0) / 2], 0, WOOD_BACK);
        for (let i = 0; i < ROWS; i++) { const zb = Z0 + rh * i; if (i) B.box([0.0, 0, zb], [D - 0.04, HW - 0.15, 0.055], 0.02, WOOD);
          let y = -(HW - 0.24); while (y < HW - 0.3) { const w = Math.min(HW - 0.24 - y, 0.26 + R() * 0.3), hgt = rh * (0.66 + R() * 0.26), sub = Math.floor(R() * 5) / 10, x0 = -0.02;
            if (R() < 0.14 && HW - 0.24 - y > 0.6) { const lw = Math.min(0.62, HW - 0.24 - y), lh = rh * 0.24; B.box([x0, y + lw / 2, zb + 0.06 + lh / 2], [D - 0.12, lw / 2 - 0.01, lh / 2], 0, BOOKS + sub); B.box([D - 0.1, y + lw / 2, zb + 0.06 + lh * 0.5], [0.008, lw / 2 - 0.02, 0.018], 0, GILT); y += lw + 0.02; continue; }
            B.box([x0, y + w / 2, zb + 0.06 + hgt / 2], [D - 0.12, w / 2 - 0.008, hgt / 2], 0, BOOKS + sub);
            for (const bf of [0.78]) B.box([D - 0.1, y + w / 2, zb + 0.06 + hgt * bf], [0.008, w / 2 - 0.02, Math.max(0.018, hgt * 0.025)], 0, GILT); y += w + 0.02; } }
        // the crown: an arched pediment of the wood, a gilt arch along its face, a gold finial
        B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0, Z1 + 0.16]); const arch = []; for (let i = 0; i <= 10; i++) { const y = -1.45 + 2.9 * i / 10; arch.push([y, 0.06 + 0.72 * (1 - Math.pow(y / 1.45, 2))]); } arch.push([1.45, -0.02], [-1.45, -0.02]);
        B.prism(arch, -D - 0.02, D + 0.02, WOOD, { b: 0.03 }); B.pop();
        let pv = null; for (let i = 0; i <= 10; i++) { const y = -1.3 + 2.6 * i / 10, p = [D + 0.04, y, Z1 + 0.16 + 0.04 + 0.6 * (1 - Math.pow(y / 1.45, 2))]; if (pv) B.tube(pv, p, 0.045, 0.045, GILT, { seg: 6, cap0: i === 1 ? 'round' : false, cap1: i === 10 ? 'round' : false }); pv = p; }
        B.sph([D + 0.02, 0, Z1 + 1.0], 0.13, GILT_PALE, 12); return B.done(); })();
      out.ring = Bd().tor([0, 0, 0], 1.55, 0.05, LIT, { seg: 40, rseg: 4 }).done();
      out.mark = (() => { const B = Bd(); B.push([0, 0, 1], [0, 1, 0], [-1, 0, 0], [0, 0, 0]); B.lathe([[-0.06, 0], [-0.06, 0.4], [-0.02, 0.45], [0.04, 0.42], [0.06, 0.3], [0.06, 0]], GILT, { seg: 26 }); B.pop();
        B.box([0.07, 0, 0.08], [0.02, 0.065, 0.17], 0.02, INK); B.sph([0.075, 0, -0.2], 0.07, INK, 10); return B.done(); })();
      return out; }),
    pose(ph, md, o) { const th = themeK(o && o.color), lean = 0.1, piv = [0, TS.HW, 0], R = rx(lean), oc = vadd(piv, at3(R, vmul(piv, -1))), mp = [0, -0.4, 8.6];
      return { parts: [P('case', oc, R, { kind: th, wear: 0.4 }), P('ring', [0, 0, 0.03], I3(), { kind: 0, glow: 1.0, outline: false }), P('mark', mp, ry(-0.6), { wear: 0.4, kind: 0, glow: 0.4 })],
        halos: [[mp, 0.95, GOLD_HI, 0.5], [[0, 0, 0.05], 2.0, GOLD_HI, 0.22]], shadow: [1.6, 0.45, 0.34] }; } };

  /* ---- the loose page (Syllax's): a sheet folded down its middle like a moth, two inked halves beating, a burgundy spine, an ink eye with
     a gold pupil at its front; 'block' / 'dash' folded into a paper dart ---- */
  DEF.loosepage = { ext: 2.25, nf: 6, faced: false, yaw: Math.PI / 2 - 0.2, modes: ['', 'block', 'dash'], foot: 0.95,
    G: model('loosepage', q => { const out = {}, Bd = () => GLM.builder(q);
      const half = sd => Bd().surf((u, v) => [0.32 - 0.64 * v + u * (0.18 - 0.12 * v), sd * u * (1.0 + 0.08 * (1 - v)), 0.1 * u * u], NS(6, q), 4, () => SCRIPT, { e: (u, v) => 1 - v, a: u => u, flip: sd < 0 }).done();
      out.wingR = half(1); out.wingL = half(-1);
      out.spine = Bd().box([0, 0, 0], [0.34, 0.055, 0.03], 0.02, LEATHER).done();
      out.eye = (() => { const B = Bd(); B.sph([0, 0, 0], 0.15, INK, 12); return B.done(); })();
      out.pupil = Bd().sph([0, 0, 0], 0.055, LIT, 8).done();
      const dart = sd => Bd().surf((u, v) => [1.15 - 2.0 * u, sd * v * 0.62 * u, -0.17 * (1 - v) * u + 0.02], NS(7, q), 2, () => PAPER, { flip: sd < 0 }).done();
      out.dartR = dart(1); out.dartL = dart(-1);
      return out; }),
    pose(ph, md) { const dart = md === 'block' || md === 'dash', bob = Math.sin(ph * TAU) * 0.14, zc = 2.0 + bob, L = [];
      if (dart) { const R = mm(rz(-(Math.PI / 2 - 0.2) + 0.5), ry(-0.12 + (md === 'dash' ? 0.05 : 0))), o = [md === 'dash' ? 0.15 : 0, 0, zc - 0.1], ep = vadd(o, at3(R, [0.62, 0, 0.06]));
        L.push(P('dartR', o, R, { wear: 0.3 }), P('dartL', o, R, { wear: 0.6 }), P('eye', ep, I3(), { s: 0.7, wear: 0.3 }), P('pupil', vadd(ep, [0.06, 0.02, 0.06]), I3(), { s: 0.8, kind: 0, glow: 1.4, outline: false }));
        return { parts: L, halos: [[ep, 0.3, GOLD_HI, 0.4]], shadow: [0.75, 0.22, 0.22] }; }
      const fl = Math.sin(ph * TAU * 2), fa = 0.3 + fl * 0.45, c = [0, 0, zc], R = mm(rz(Math.PI), ry(-0.4));
      L.push(P('spine', c, R, { wear: 0.4 }));
      for (const sd of [1, -1]) L.push(P(sd > 0 ? 'wingR' : 'wingL', c, mm(R, rx(sd * fa)), { wear: sd > 0 ? 0.3 : 0.65 }));
      const ep = vadd(c, at3(R, [0.38, 0, 0.06])); L.push(P('eye', ep, I3(), { wear: 0.3 }), P('pupil', vadd(ep, [0.1, 0.04, 0.08]), I3(), { kind: 0, glow: 1.4, outline: false }));
      return { parts: L, halos: [[ep, 0.32, GOLD_HI, 0.4]], shadow: [0.72, 0.22, 0.22] }; } };
  const TYPES = Object.keys(DEF);

  /* ======================= baking a sprite frame ======================= */
  let CUR_BIO = null, ACT = null, ACTT = -1e9;
  const gameDbg = () => { try { const D = typeof arc !== 'undefined' && arc && arc.game && arc.game._dbg; return D || null; } catch (e) { return null; } };
  const gameBio = () => { const D = gameDbg(); try { return D && D.F ? D.F.biome : null; } catch (e) { return null; } };
  const bio = () => CUR_BIO || gameBio() || 'catalogue';
  function active() { const t = nowMs(); if (t - ACTT < 250 && ACT != null) return ACT; ACTT = t; const b = CUR_BIO || gameBio(); ACT = (!b || !!LANDS[b]) && glBase(); return ACT; }
  const ST = { baked: 0, ms: 0, prov: 0, over: {}, lazy: 0, fx: { passes: 0, quads: 0, shots: 0, tells: 0, pools: 0, dashes: 0, bursts: 0, pillars: 0, falls: 0, glints: 0, ms: 0 }, mini: 0 };
  const BW = { t: -1e9, n: 0, ms: 0 }, PROV = [];
  const playing = () => typeof arc !== 'undefined' && arc && arc.state === 'play';
  function budget() { const t = nowMs(); if (t - BW.t > 14) { BW.t = t; BW.n = 0; BW.ms = 0; flushProv(); } return !playing() || win('__LIB_NOBUDGET') === 1 || (BW.n < 2 && BW.ms < 4); }
  let PRAF = 0;
  function provTick() { if (PRAF || typeof requestAnimationFrame !== 'function') return; const f = () => { PRAF = 0; if (!PROV.length) return; if (nowMs() - BW.t > 14) { BW.t = nowMs(); BW.n = 0; BW.ms = 0; flushProv(); } if (PROV.length) PRAF = requestAnimationFrame(f); }; PRAF = requestAnimationFrame(f); }
  function flushProv() { const MC = DunArt.monCache; for (let i = 0; i < 2 && PROV.length; i++) { const k = PROV.shift(); if (MC) { MC.delete(k); MC.delete(k + '|f'); } } }
  /* (20b's drawMon asks DunArt.FACED whether a type has its own left-facing frames; taken over on first use, its answer kept for every
     type not ours) */
  function ensureFaced() { const f0 = DunArt.FACED; if (f0 && f0.__lib) return; const f = t => { const D = DEF[t]; if (D) return !!(D.faced && active()); return !!(f0 && f0(t)); }; f.__lib = 1; DunArt.FACED = f; }
  /* render type's frame ph in mode md0 ('<' at its end: facing left) into the sprite canvas c (its origin the sprite's centre; r the
     body radius in its pixels). False: not done (the caller paints the 2D art) */
  function bake(c, type, r, ph, o) {
    const D = DEF[type], md0 = (o && o.mode) || '', left = md0.charCodeAt(md0.length - 1) === 60, md1 = left ? md0.slice(0, -1) : md0, md = D && D.modes.includes(md1) ? md1 : '';
    if (!D || !active() || !D.G.on()) return false;
    ensureFaced();
    if (!budget()) { ST.prov++; provTick(); PROV.push(type + '|' + Math.max(4, Math.round(r)) + '|' + Math.floor(((ph % 1) + 1) % 1 * ((DunArt.NF && DunArt.NF[type]) || 4)) + '|' + (o && o.color) + '|' + md0); return false; }
    const t0 = nowMs(); let ok = false;
    try { const Ps = D.pose(ph, md, o), head = D.faced ? (left ? Math.PI - (D.head || 0.4) : (D.head || 0.4)) : (D.yaw || 0), V = { k: r, Rh: rz(head), X0: 0, Y0: D.foot * r }, sh = Ps.shadow;
      if (sh) blob(c, 0, V.Y0, sh[0] * r * 1.05, sh[1] * r * 1.05, sh[2]);
      ok = glPass(c, V, Ps.parts, { light: LANDS[bio()] ? bio() : 'catalogue', t: ph * 10, res: lowFx() ? 0.8 : 1, outline: 1.1 }, D.G);
      if (ok) { halos(c, V, Ps.halos); const half = c.canvas ? c.canvas.width / 2 : 0, b = D.G.box; if (half && b) { const ov = Math.max(-b[0], b[2], -b[1], b[3]) / half; if (ov > (ST.over[type] || 0)) ST.over[type] = +ov.toFixed(2); } }
    } catch (e) { failed(); if (typeof console !== 'undefined') console.warn('LIB_BROOD bake ' + type, e); ok = false; }
    const dt = nowMs() - t0; BW.n++; BW.ms += dt; ST.ms += dt; if (ok) { ST.baked++; if (playing()) ST.lazy++; }
    return ok;
  }
  /* the painters wrapped; the sprites' room (EXT) and frame counts (NF) the models' own while the GPU is used (the 2D art's otherwise).
     The loose page's painter is made later (20ze, after this file): wrapped when it exists (on the next tick and at every preload) */
  const { MP, EXT, NF } = DunArt, ORIG = {};
  function wrapType(t) { if (ORIG[t]) return true; const p0 = MP[t]; if (typeof p0 !== 'function') return false; const e0 = EXT[t] || 1.6; ORIG[t] = { p0, e0 };
    MP[t] = function (c, r, ph, o) { if (bake(c, t, r, ph, o)) return; const md = (o && o.mode) || '';
      if (md.charCodeAt(md.length - 1) === 60) { c.save(); c.scale(-1, 1); p0(c, r, ph, Object.assign({}, o, { mode: md.slice(0, -1) })); c.restore(); return; }
      return p0(c, r, ph, o); };
    try { Object.defineProperty(EXT, t, { get: () => (active() ? DEF[t].ext : ORIG[t].e0), set: v => { ORIG[t].e0 = v; }, configurable: true, enumerable: true }); } catch (e) { /* (kept as it was) */ }
    const n0 = NF[t] || 4; ORIG[t].n0 = n0; if (DEF[t].nf && DEF[t].nf !== n0) { try { Object.defineProperty(NF, t, { get: () => (active() ? DEF[t].nf : ORIG[t].n0), set: v => { ORIG[t].n0 = v; }, configurable: true, enumerable: true }); } catch (e) { NF[t] = DEF[t].nf; } }
    return true; }
  const lateWrap = () => { for (const t of TYPES) wrapType(t); };
  lateWrap(); if (typeof setTimeout === 'function') setTimeout(lateWrap, 0);
  ensureFaced();

  /* ======================= their attacks on the GPU (FGFX kinds 640..647, laid over) ======================= */
  const FGX = () => { try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const fxOn = () => win('__LIB_FX') !== 0 && win('__DUN_GL') !== 0 && !!FGX();
  /* each land's colours for them: deep enough to read on parchment, marble and cloud */
  const PAL = { catalogue: { ink: '#2E2244', violet: '#6A40C4', gold: '#A8721C', burg: '#7A2050', holy: '#C47414', bead: '#E0A030', glint: '#FFE6A0' },
    binding: { ink: '#262240', violet: '#5E4CC0', gold: '#8C7036', burg: '#6A2A5A', holy: '#B47420', bead: '#D8A040', glint: '#FFFFFF' },
    archive: { ink: '#3A2E5A', violet: '#7656D6', gold: '#B87C10', burg: '#8A3060', holy: '#CC8208', bead: '#E09A20', glint: '#FFF2C0' } };
  const pal = () => PAL[bio()] || PAL.catalogue;
  const hexRGB0 = h => { const s = String(h || '').replace('#', ''); if (s.length < 6) return [255, 255, 255]; return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; };
  const KNOWN = { '#F4EAD2': 'ink', '#F2DC9A': 'gold', '#CFAD62': 'gold', '#FFE9A8': 'gold', '#FFF1B8': 'gold', '#E2B64A': 'gold', '#8A5BD0': 'violet', '#CDB4FF': 'violet', '#9A4A72': 'burg', '#6B324F': 'burg', '#FFB23F': 'holy', '#FF4D6D': 'violet', '#FF5A4A': 'holy' };
  function tellKey(c0) { const k = KNOWN[String(c0 || '').toUpperCase()]; if (k) return k; const [r, g, b] = hexRGB0(c0); if (r > 225 && g > 215 && b > 190) return 'ink'; if (r > 200 && g > 140 && b < 140) return 'gold'; if (b > r && b > g) return 'violet'; if (r > g + 60 && b > g) return 'burg'; return 'violet'; }
  const tellCol = c0 => pal()[tellKey(c0)];
  /* what the AI makes, tagged: a shot gets its painter, a tell (and an ink patch) its 'drawn' hook (the engine leaves it to this layer
     while the layer paints), the default red tells made violet for the 2D too (no red circles) */
  const LAY = { g: null, ft: -1e9, zones: null, tells: [], pools: [], bursts: [], dash: new Map(), seen: new WeakSet(), shelves: null, pillars: false };
  const DRAWN = () => !!LAY.g && Math.abs(LAY.ft - LAY.g.t) < 0.3;
  const SHOT = { falsefolio: 'dart', ophanwheel: 'bead', foliopet: 'dart' }, STREAK = { marginworm: 1, inkstalker: 1, haloguard: 1, loosepage: 1 };
  function paintShot(Q, X, Y, r, T, b) { const p = pal(); ST.fx.shots++; const sd = (b.lmSd = b.lmSd || Math.random() * 40);
    if (b.lmk === 'bead') { const R = r * 3.0; Q.quad(643, X, Y, R, 0, 0, R, p.bead, 1, 1, sd); return true; }
    const a = Math.atan2(b.vy || 0, b.vx || 1), R = r * 3.2, ca = Math.cos(a), sa = Math.sin(a); Q.quad(643, X, Y, ca * R, sa * R, -sa * R * 0.75, ca * R * 0.75, p.violet, 1, 0, sd); return true; }
  function tagPool(q) { if (!q || q.kind !== 'stall' || q.lmPool) return; q.lmPool = 1; q.lmSd = Math.random() * 40; q.drawn = DRAWN; LAY.pools.push(q); }
  function tagZone(z, t) { if (!z || LAY.seen.has(z)) return; LAY.seen.add(z);
    if (z.kind === 'stall' && z.own === 'enemy') { tagPool(z); return; }
    if (z.kind === 'warn' && z.own !== 'pet' && !z.drawn) { z.drawn = DRAWN; if (!z.color || z.color === '#FF4D6D') z.color = VIOLET_HI; z.lmSd = Math.random() * 40; LAY.tells.push(z);
      // (a tell's blow may leave ink behind it: Blot's pools)
      if (typeof z.fn === 'function') { const f0 = z.fn; z.fn = function () { const Z = LAY.zones, n0 = Z ? Z.length : 0; const r = f0.apply(this, arguments); try { if (Z) for (let i = n0; i < Z.length; i++) tagPool(Z[i]); } catch (e) { /* (only the picture) */ } return r; }; } } }
  function tagNew(t, m, X, E, ne, Z, nz) {
    if (E && E.length > ne) for (let i = ne; i < E.length; i++) { const b = E[i]; if (!b || b.paint || b.mine || b.lmk) continue; const k = SHOT[t]; if (!k) continue; b.lmk = k; b.paint = paintShot; }
    if (Z) { LAY.zones = Z; if (Z.length > nz) for (let i = nz; i < Z.length; i++) tagZone(Z[i], t); }
  }
  const burst = (x, y, R, mode, col, max) => { if (LAY.bursts.length < 32) LAY.bursts.push({ x, y, R, mode, col, t: 0, max: max || 0.5, sd: Math.random() * 40 }); };
  { const { mon, boss } = DunAI;
    const wrapAI = (tab, t) => { const f0 = tab[t]; if (typeof f0 !== 'function' || f0.__lib) return;
      const w = function (m, A, X) { const E = X && X.eshots, Z = X && X.zones, ne = E ? E.length : 0, nz = Z ? Z.length : 0;
        const r = f0.apply(this, arguments);
        try { tagNew(t, m, X, E, ne, Z, nz); } catch (e) { /* (only the pictures) */ }
        return r; };
      w.__lib = 1; w.toString = () => String(f0); tab[t] = w; };
    for (const t of ['marginworm', 'inkstalker', 'falsefolio', 'seraphling', 'haloguard', 'ophanwheel']) wrapAI(mon, t);
    for (const t of ['quillpet', 'blotpet', 'foliopet']) wrapAI(boss, t);
    // (the loose page's AI comes with its painter, later)
    const late = () => wrapAI(mon, 'loosepage'); late(); if (typeof setTimeout === 'function') setTimeout(late, 0); LAY.lateAI = late; }
  // a teetering shelf toppling: gold flashes and ink splashes along its fall (the engine's own booms and the crush kept)
  try { const C0 = MON.tottershelf, d0 = C0 && C0.onDeath; if (C0 && d0) C0.onDeath = function (m, X) { try { if (fxOn() && X && X.me) { const a = Math.atan2(m.y - X.me.y, m.x - X.me.x); for (let i = 1; i <= 4; i++) { const u = i / 4 * 5.2; burst(m.x + Math.cos(a) * u, m.y + Math.sin(a) * u, 1.1 + i * 0.12, i % 2 ? 1 : 0, i % 2 ? 'gold' : 'ink', 0.55); } } } catch (e) { /* */ } return d0.apply(this, arguments); }; } catch (e) { /* (no shelf) */ }
  const FALL = 5.2, FALLW = 1.7;
  /* the layer: one GPU pass under the monsters (tells, ink, streaks, bursts, fall lines), one over them (holy fire, glints), each made
     only when something shows */
  function fxLayer(X) {
    LAY.g = X.g; LAY.ft = -1e9; LAY.tells.length = 0; LAY.pools.length = 0; LAY.bursts.length = 0; LAY.dash.clear(); LAY.zones = null;
    const live = z => z.life > 0 && (!LAY.zones || LAY.zones.indexOf(z) >= 0);
    const PL = () => (typeof LIB !== 'undefined' && Array.isArray(LIB.PILLARS) ? LIB.PILLARS : null);
    return {
      update(dt) { const on = fxOn(); try { trim(); } catch (e) { /* */ } LAY.pillars = on;
        if (!LAY.zones && X.zones) LAY.zones = X.zones;
        for (let i = LAY.tells.length - 1; i >= 0; i--) { const z = LAY.tells[i]; if (live(z)) continue; LAY.tells.splice(i, 1);
          // (its strike: the same shape flaring out where it was)
          if (on && LAY.bursts.length < 32) LAY.bursts.push({ strike: z.shape || 'ring', x: z.x, y: z.y, a: z.a || 0, len: z.len || 0, w: z.w || 0, spread: z.spread || 0, R: z.r || 1, col: tellCol(z.color), t: 0, max: 0.35, sd: z.lmSd || 0 }); }
        for (let i = LAY.pools.length - 1; i >= 0; i--) if (!live(LAY.pools[i])) LAY.pools.splice(i, 1);
        for (let i = LAY.bursts.length - 1; i >= 0; i--) { const b = LAY.bursts[i]; b.t += dt; if (b.t >= b.max) LAY.bursts.splice(i, 1); }
        // (a dash: where it set off, for its streak)
        for (const m of X.mons) { if (!STREAK[m.type]) continue; const D = LAY.dash.get(m); if (!m.dead && m.dashT > 0) { if (!D) LAY.dash.set(m, { x: m.x, y: m.y, t: 0 }); else D.t = 0; } else if (D) { D.t += dt; if (D.t > 0.25 || m.dead) LAY.dash.delete(m); else { D.ex = D.ex == null ? m.x : D.ex; D.ey = D.ey == null ? m.y : D.ey; } } } },
      drawGround(c) { if (!fxOn()) return; const g = X.g, tq = nowMs(); LAY.ft = g.t;
        const near = []; if (LAY.shelves && LAY.shelves.X === X) for (const m of LAY.shelves.list) if (!m.dead && Math.hypot(X.me.x - m.x, X.me.y - m.y) <= 5.5) near.push(m);
        if (!LAY.tells.length && !LAY.pools.length && !LAY.bursts.length && !LAY.dash.size && !near.length) return;
        const F = FGX(); if (!F) return; let Q = null; try { Q = F.begin(c, null); } catch (e) { Q = null; } if (!Q) return;
        const T = X.Tz(), p = pal(), n0 = (Q.nl || 0) + (Q.ns || 0);
        const lane = (ax, ay, a, len, w, col, q0, sd) => { const dx = Math.cos(a), dy = Math.sin(a), L2 = len * T / 2, W2 = Math.max(0.5, w) * T * 0.62; Q.quad(640, ax + dx * L2, ay + dy * L2, dx * L2, dy * L2, -dy * W2, dx * W2, col, 1, q0, sd, len / Math.max(0.3, w)); };
        try {
          let px = 1e9, py = 1e9; for (const z of LAY.pools) { if (Math.abs(z.x - px) + Math.abs(z.y - py) < 0.3) continue; px = z.x; py = z.y; const s = Math.max(0, Math.min(1, z.life / 0.6, (z.max - z.life) / 0.2 + 0.15)), R = z.r * T * 1.15;   /* (a trail's patches laid 0.07 s apart: one picture for a run of them that overlap) */ Q.quad(644, X.sx(z.x), X.sy(z.y), R, 0, 0, R * 0.78, p.ink, 1, s, z.lmSd || 0); ST.fx.pools++; }
          for (const m of near) { const a = Math.atan2(m.y - X.me.y, m.x - X.me.x), s = Math.min(1, (5.5 - Math.hypot(X.me.x - m.x, X.me.y - m.y)) / 1.2 + 0.3) * (0.8 + 0.2 * Math.sin(g.t * 6)); lane(X.sx(m.x), X.sy(m.y), a, FALL, FALLW, p.gold, 2 + s, m.x * 3.7 + m.y); ST.fx.falls++; }
          for (const z of LAY.tells) { const u = z.max ? Math.max(0, Math.min(1, 1 - z.life / z.max)) : 0.5, col = tellCol(z.color), Xs = X.sx(z.x), Ys = X.sy(z.y); ST.fx.tells++;
            if (z.shape === 'line') lane(Xs, Ys, z.a, z.len, z.w, col, u, z.lmSd);
            else if (z.shape === 'cone') { const R = z.len * T * 1.06; Q.quad(642, Xs, Ys, R, 0, 0, R, col, 1, u, z.a, z.spread); }
            else { const R = z.r * T * 1.1; Q.quad(641, Xs, Ys, R, 0, 0, R, col, 1, u, z.lmSd); } }
          for (const [m, D] of LAY.dash) { const ex = D.ex != null ? D.ex : m.x, ey = D.ey != null ? D.ey : m.y, s = D.ex != null ? Math.max(0, 1 - D.t / 0.25) : 1, dl = Math.hypot(ex - D.x, ey - D.y); if (dl < 0.3) continue;
            const ax = X.sx(D.x), ay = X.sy(D.y) - T * 0.3, bx = X.sx(ex), by = X.sy(ey) - T * 0.3, hx = (bx - ax) / 2, hy = (by - ay) / 2, l = Math.hypot(hx, hy) || 1, w = T * 0.42;
            Q.quad(647, ax + hx, ay + hy, hx, hy, -hy / l * w, hx / l * w, m.type === 'inkstalker' ? p.ink : m.type === 'haloguard' ? p.gold : p.violet, 1, 0.85 * s, D.x * 7.3); ST.fx.dashes++; }
          for (const b of LAY.bursts) { const k = Math.min(1, b.t / b.max), Xs = X.sx(b.x), Ys = X.sy(b.y); ST.fx.bursts++;
            if (b.strike === 'line') lane(Xs, Ys, b.a, b.len, b.w, b.col, 1 + k, b.sd);
            else if (b.strike === 'cone') { const R = b.len * T * 1.06; Q.quad(642, Xs, Ys, R, 0, 0, R, b.col, 1, 1 + k, b.a, b.spread); }
            else if (b.strike) { const R = b.R * T * 1.1; Q.quad(641, Xs, Ys, R, 0, 0, R, b.col, 1, 1 + k, b.sd); }
            else { const R = b.R * T; Q.quad(645, Xs, Ys, R, 0, 0, R * 0.75, p[b.col] || b.col, 1, k, b.sd, b.mode || 0); } }
        } catch (e) { /* (the pass still closes) */ }
        ST.fx.quads += Math.round(((Q.nl || 0) + (Q.ns || 0) - n0) / 6); ST.fx.passes++;
        try { F.flush(c); } catch (e) { /* */ } ST.fx.ms += nowMs() - tq; },
      drawOver(c) { if (!fxOn()) return; const PLs = PL(), gl = []; for (const m of X.mons) if (!m.dead && m.type === 'falsefolio' && m.disguised) gl.push(m);
        if (!(PLs && PLs.length) && !gl.length) return; const F = FGX(); if (!F) return; let Q = null; try { Q = F.begin(c, null); } catch (e) { Q = null; } if (!Q) return;
        const T = X.Tz(), p = pal(), t = X.g.t, Hh = X.H ? X.H() : 900, n0 = (Q.nl || 0) + (Q.ns || 0), tq = nowMs();
        try {
          if (PLs) for (const q of PLs) { const Xs = X.sx(q.x), Ys = X.sy(q.y), top = Ys - Math.min(Hh * 0.8, T * 9), h2 = (Ys - top) / 2, w = q.r * T * 1.25; Q.quad(646, Xs, top + h2 + T * 0.15, w, 0, 0, h2 + T * 0.3, p.holy, 1, Math.min(1, q.t / q.life), q.x * 3.1 + q.y); ST.fx.pillars++; }
          for (const m of gl) { const k = Math.max(0, Math.sin(t * TAU * 0.75 + m.x)), R = m.r * T * (0.9 + 0.5 * k), Xs = X.sx(m.x) + m.r * T * 0.3, Ys = X.sy(m.y) - (m.z || 0) * T - m.r * T * 1.0; if (k < 0.05) continue; Q.quad(647, Xs, Ys, R, 0, 0, R, p.glint, 1, 2 + k, m.x); ST.fx.glints++; }
        } catch (e) { /* */ }
        ST.fx.quads += Math.round(((Q.nl || 0) + (Q.ns || 0) - n0) / 6); ST.fx.passes++; try { F.flush(c); } catch (e) { /* */ } ST.fx.ms += nowMs() - tq; } };
  }
  /* the holy fire's 2D column held back while this layer paints it (20zb2 asks LIB.pillarsGL) */
  try { if (typeof LIB !== 'undefined') LIB.pillarsGL = () => !!LAY.pillars && !!LAY.g && fxOn(); } catch (e) { /* */ }
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.library; if (Rf) { const es0 = Rf.everyStage;
    Rf.everyStage = function (X, self2, H) { const a = (typeof es0 === 'function' ? es0.apply(this, arguments) : null) || {}; let L = null; try { L = fxLayer(X); } catch (e) { L = null; } if (!L) return a;
      return Object.assign({}, a, { update(dt) { if (a.update) a.update(dt); L.update(dt); }, drawGround(c) { if (a.drawGround) a.drawGround(c); L.drawGround(c); }, drawOver(c) { if (a.drawOver) a.drawOver(c); L.drawOver(c); } }); }; } } catch (e) { /* (no rift) */ }

  /* ======================= the mini bosses: giant evil Cocopets, themed for the Library ======================= *
     (v469/v470/v472's way, 20s7 / 20s6f / 20u6f): riftFight (20m) takes the mini's look from Rf.miniEvil instead of a random
     Rift-touched pet, and its stage arms it as the far gate's guardian (EVIL_MINI.arm, keep: its own moves (20zb), health and blows),
     drawn, woken and felled by EVIL_MINI's layer on the GPU (PetGL, its poses baked: v471). The stage's teetering shelves' fall lines
     are this layer's too while it paints (the 2D lines held back). */
  const MINI_LOOK = {
    quillpet: { name: 'Quill the Gilded Nib', short: 'Quill', el: 'crystal', seed: 7121, sub: 'A Rift-touched Cocopet writes in the reading galleries', hint: { tail: 'feather', horns: 'crystal', fur: 'feather', ears: 'feather', armor: true },
      palette: { tint: '#4E3C2C', tintK: 0.74, pal: { sec: GOLD_HI, cheek: '#3A2818' }, col: GOLD_HI, glow: GOLD, core: '#FFF6DA' } },
    blotpet: { name: 'Blot the Spilled Ink', short: 'Blot', el: 'dark', seed: 7243, sub: 'A Rift-touched Cocopet seeps through the silver presses', hint: { fur: 'slime', horns: 'devil', tail: 'spade', armor: true },
      palette: { tint: '#1C1830', tintK: 0.88, pal: { sec: VIOLET_HI, cheek: '#2A1A40' }, col: VIOLET_HI, glow: VIOLET, core: '#F0E8FF' } },
    foliopet: { name: 'Folio the Last Page', short: 'Folio', el: 'dark', seed: 7369, sub: 'A Rift-touched Cocopet keeps the gilded stacks', hint: { wings: 'feather', horns: 'ram', tail: 'ribbon', armor: true },
      palette: { tint: '#5A2440', tintK: 0.76, pal: { sec: GOLD_HI, cheek: '#3A1424' }, col: GOLD_HI, glow: GOLD, core: '#FFF4E0' } } };
  const EMI = () => { try { return (typeof self !== 'undefined' && self.EVIL_MINI) || null; } catch (e) { return null; } };
  const SPECS = {};
  function miniSpec(id, B) { if (SPECS[id]) return SPECS[id]; const E = EMI(), L = MINI_LOOK[id]; if (!E || !E.specOf || !L) return null;
    return (SPECS[id] = E.specOf(Object.assign({}, L, { hp: (B && B.hp) || 1, dmg: (B && B.dmg) || 1, r: (B && B.r) || 1.3, spd: (B && B.spd) || 1.8 }))); }
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.library; if (Rf) {
    const me0 = Rf.miniEvil; Rf.miniEvil = id => { if (MINI_LOOK[id]) { try { const E = EMI(), d = miniSpec(id, BOSSES.find(b => b.id === id)); if (E && d) return E.evilOf(d); } catch (e) { /* (a random one) */ } } return me0 ? me0(id) : null; };
    for (const S of Rf.stages) { if (S.kind !== 'fight' || S.__libArm) continue; S.__libArm = 1; const ex0 = S.extra;
      S.extra = (X, self2, H) => { const xm = (ex0 ? ex0(X, self2, H) : null) || {};
        // (the teetering shelves' fall lines: this layer's while it paints)
        if (Array.isArray(xm.list) && typeof xm.drawGround === 'function') { const dg0 = xm.drawGround; LAY.shelves = { X, list: xm.list }; xm.drawGround = c => { if (fxOn() && LAY.g === X.g) return; dg0(c); }; }
        const E = EMI(); if (!MINI_LOOK[S.mini] || !E || !E.arm || !E.layer) return xm;
        const m = X.mons.find(q => q && q.boss && q.lesser && !q.dead && q.bk && q.bk.id === S.mini && !q.calMini), d = m && miniSpec(S.mini, m.bk); if (!m || !d) return xm;
        let gm = null; try { E.arm(X, m, Object.assign({}, d, { r: m.evK ? m.r / m.evK : m.r }), { keep: true, home: { x: m.x, y: m.y }, sub: d.sub || MINI_LOOK[S.mini].sub, wakeR: 9.5 }); m.bname = d.name; gm = E.layer(X); ST.mini++; } catch (e) { if (typeof console !== 'undefined') console.warn('LIB_BROOD mini', e); return xm; }
        return Object.assign(xm, { update: (u0 => dt => { if (u0) u0(dt); gm.update(dt); })(xm.update), drawGround: (g0 => c => { if (g0) g0(c); gm.drawGround(c); })(xm.drawGround), drawOver: (o0 => c => { if (o0) o0(c); gm.drawOver(c); })(xm.drawOver) }); }; } } } catch (e) { /* (no rift) */ }

  /* ======================= warming on the loading screen, and letting go ======================= */
  const KEEP = new Set(TYPES);
  const BOSS_TYPES = { syllax: ['loosepage', 'marginworm'], vellum: ['inkstalker', 'marginworm'], nhalex: ['marginworm', 'inkstalker', 'falsefolio'] };
  const LAND_TYPES = { catalogue: ['marginworm', 'inkstalker', 'falsefolio'], binding: ['marginworm', 'inkstalker', 'falsefolio'], archive: ['seraphling', 'haloguard', 'ophanwheel', 'falsefolio', 'inkstalker', 'marginworm'] };
  function preload(Pp) {
    try { CUR_BIO = Pp && Pp.F && Pp.F.biome || null; ACTT = -1e9; } catch (e) { CUR_BIO = null; }
    lateWrap(); if (LAY.lateAI) LAY.lateAI();
    if (!active()) return [];
    ensureFaced();
    const want = new Map(), add = (t, rpx, col) => { if (!DEF[t] || !(rpx > 0) || !MON[t]) return; const key = t + '|' + Math.max(4, Math.round(rpx)) + '|' + (col || MON[t].color); if (!want.has(key)) want.set(key, [t, rpx, col || MON[t].color]); };
    for (const m of (Pp.mons || []).concat(Pp.reserve || [])) if (m && !m.dead && !m.boss && !m.fiend && DEF[m.type]) add(m.type, m.r * Pp.T * Pp.k, m.color);
    const S = Pp.S, more = S ? (S.kind === 'boss' ? BOSS_TYPES[S.boss] || [] : S.kind === 'fight' ? [] : LAND_TYPES[CUR_BIO] || []) : [];
    for (const t of more) if (typeof Pp.monPx === 'function') add(t, Pp.monPx(t));
    const jobs = [];
    jobs.push(() => { for (const t of new Set([...want.values()].map(w => w[0]))) DEF[t].G.on(); });
    for (const [t, rpx, col] of want.values()) { const D = DEF[t], nf = D.nf || 4; for (const md of D.modes) for (const lf of D.faced ? [false, true] : [false]) jobs.push(() => { for (let f = 0; f < nf; f++) DunArt.monSprite(t, rpx, (f + 0.5) / nf, col, lf ? md + '<' : md, false); }); }
    // (the attacks' GPU kinds compiled with the rest: one quad of each, drawn off screen)
    jobs.push(() => { const F = FGX(); if (!F || typeof document === 'undefined') return; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'); let Q = null; try { Q = F.begin(x, null); } catch (e) { Q = null; } if (!Q) return; for (let k = 640; k <= 647; k++) Q.quad(k, 32, 32, 20, 0, 0, 20, '#6A40C4', 0.6, 0.5, 1, 2); try { F.flush(x); } catch (e) { /* */ } });
    return jobs;
  }
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.library; if (Rf) { const p0 = Rf.preload; Rf.preload = function (Pp) { let a = null; if (typeof p0 === 'function') { try { a = p0.apply(this, arguments); } catch (e) { a = null; } } let b = []; try { b = preload(Pp); } catch (e) { b = []; } return (Array.isArray(a) ? a : []).concat(b); }; } } catch (e) { /* (no rift) */ }
  function mem() { const MC = DunArt.monCache, by = {}; let px = 0, n = 0; if (MC) for (const [k, s] of MC) { const t = k.slice(0, k.indexOf('|')); if (!KEEP.has(t) || !s || !s.cv) continue; const p = s.cv.width * s.cv.height; px += p; n++; by[t] = (by[t] || 0) + p; }
    const MB = {}; for (const t in by) MB[t] = +(by[t] * 4 / 1048576).toFixed(2); return { n, px, MB: +(px * 4 / 1048576).toFixed(2), by: MB }; }
  /* (a cap on the pictures held, as the other broods': past it the least recently used of ours are let go (rendered again when next
     drawn, within the budget). Checked once a second) */
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
    LAY.g = null; LAY.tells.length = 0; LAY.pools.length = 0; LAY.bursts.length = 0; LAY.dash.clear(); LAY.zones = null; LAY.shelves = null; LAY.pillars = false; }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(release); } catch (e) { /* (no rift hook) */ }
  try { const GD = typeof GAMES !== 'undefined' && GAMES.dungeon; if (GD && GD.create && !GD.__libRel) { const c0 = GD.create; GD.__libRel = 1; GD.create = function () { const api = c0.apply(this, arguments); if (api && typeof api.destroy === 'function') { const d0 = api.destroy; api.destroy = function () { try { release(); } catch (e) { /* (nothing held) */ } return d0.apply(this, arguments); }; } return api; }; } } catch (e) { /* (no dungeon) */ }
  return { DEF, MINI_LOOK, miniSpec, TYPES, LIGHT, PAL, bake, preload, release, mem, active, fxOn, lateWrap, get gpuBuffers() { return gpuBuffers(); },
    get stats() { return Object.assign({ prov: PROV.length, models: MODELS.map(G => ({ name: G.name, tris: G.tris, meshMs: +G.meshMs.toFixed(1), passMs: +G.ms.toFixed(2), n: G.n })), released: REL_N, trimmed: TRIMMED, bio: bio(), tells: LAY.tells.length, pools: LAY.pools.length, bursts: LAY.bursts.length, dashes: LAY.dash.size, wrapped: Object.keys(ORIG) }, ST); },
    get bio() { return bio(); }, set bio(v) { CUR_BIO = v; ACTT = -1e9; }, env: () => ({ DunArt, MON, BIOMES }) };
})();
if (typeof window !== 'undefined') window.LIB_BROOD = LIB_BROOD;
