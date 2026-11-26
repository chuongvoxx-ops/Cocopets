/* ---------- (v463 SM) SEP_BROOD: Rift 04's brood, its creatures and its two mini bosses in three dimensions, kept light ----------
   The user (2026-11-26): "Rebuilt everything on gpu including bosses and regular monsters. With the regular monsters make it so
   it's light and not heavy on the computer."

   THE BROOD AND THE CREATURES (second-eater, corner pup, mourning disc; the Borrowed Beast's tomb ram, lantern eye and slab mole;
   the Siege's tomb masons; section three's giant ice crystals). Each is a GLM model (rigid parts built once, materials 535..549
   in the SM-SEP-MAT block of 20k5uz), but it is never drawn live: every frame of it the game needs is rendered ONCE into the
   monster sprite cache the 2D art already uses (DunArt.monSprite: type x size x frame x mode, an LRU of small canvases). Its
   painter (MP[type]) is wrapped: when the GPU can be used here it renders the model posed for that frame and mode into the
   sprite's canvas (with its contact shadow and its soft lights laid in 2D once, inside the picture), else it paints the 2D art
   as before. So a crowd costs exactly what the 2D crowd cost: one drawImage a monster a frame, no GL pass, no GL copy. The hit
   flash is the cache's own (the frame whitened once, on first need, in 2D). Where the 2D art was mirrored to face left, the
   models that have a front (the pup, the ram, the mole, the mason) are baked facing each way (the mode carries '<', 20b's
   drawMon asks DunArt.FACED) so their light stays on the same side; the round ones (the hourglass, the ring, the lantern eye,
   the crystals) are baked once and mirrored as before. Their frames are rendered on the loading screen (Rf.preload: every
   type, size, mode and facing the stage shows); anything first seen in play is rendered within a budget (two pictures or 4 ms
   in any 14 ms), the rest painted in 2D for a moment and rendered again later. Every picture and every mesh's GPU buffers are
   let go when a stage closes or a new one is made. Only in Rift 04's three lands (anywhere else, e.g. Rift 05's aurora
   crystal reusing the ice crystal's painter, the 2D art stays).
   THE MINI BOSSES (Tock, Howl: "A Rift-touched Cocopet"). One on the field at a time, large, always moving: posed live, one GPU
   pass a frame while it is on screen (as the rift's bosses are), turning smoothly toward where it goes. Tock: a round pet of
   blue-black tomb stone and old gold, a stopped clock in its belly, clock hands for ears, an hourglass on its back. Howl: a
   squat hound-pet of black obsidian plates with violet seams, square ears, a spike of a tail, a gold collar.
   Without WebGL, on a software rasteriser (unless window.__SB_GL = 1, tests), with window.__SB_GL = 0 or after three failures
   in 20 s, the 2D art is drawn exactly as before. window.__SB_GLHQ = 1: full resolution on a software rasteriser (tests). */
const SEP_BROOD = (() => {
  /* (the game camera and the small vector kit, as GB_KIT's (20x2, which loads after this file)) */
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
  const LANDS = { sepulchre: 1, twoages: 1, borrowed: 1 };
  /* the lights (world: x east, y south toward the viewer, z up): each land's key colour (uAmb) and rim (uRim) */
  const LIGHT = {
    sepulchre: { lk: vnrm([-0.55, 0.35, 0.76]), ls: vnrm([0.3, 0.2, 0.93]), lr: vnrm([0.55, -0.78, 0.3]), key: [1.42, 1.18, 0.82], rim: [0.62, 0.78, 1.25] },
    twoages: { lk: vnrm([-0.45, 0.4, 0.8]), ls: vnrm([0.25, 0.3, 0.92]), lr: vnrm([0.5, -0.8, 0.35]), key: [1.6, 1.55, 1.45], rim: [1.25, 1.02, 0.62] },
    borrowed: { lk: vnrm([-0.5, 0.3, 0.8]), ls: vnrm([0.3, 0.25, 0.9]), lr: vnrm([-0.45, -0.8, 0.38]), key: [1.12, 1.0, 1.42], rim: [0.98, 0.6, 1.55] } };
  const OUTC = [0.05, 0.035, 0.08], UPW = [0, 0, 1], GLCAP = 1400, GLI = [], GLJ = [];
  /* ---- a model's GL state: meshes built once on first use (lowFx: fewer segments), failures counted ---- */
  let FAILS = 0, FAILT = 0, NOGL = false;
  function failed() { const t = nowMs(); if (t - FAILT > 20000) FAILS = 0; FAILT = t; if (++FAILS >= 3) NOGL = true; }
  function glBase() { if (NOGL || win('__SB_GL') === 0 || typeof GLM === 'undefined') return false; try { if (!GLM.ok()) return false; if (GLM.soft && win('__SB_GL') !== 1) return false; } catch (e) { return false; } return true; }
  const MODELS = [];
  function model(name, build) {
    const G = { name, MESH: null, PB: {}, ms: 0, n: 0, meshMs: 0,
      on() { if (!glBase()) return false; if (!G.MESH) { try { const t0 = nowMs(); G.MESH = build(lowFx() ? 0.65 : 1); G.meshMs = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('SEP_BROOD ' + name + ': meshes', e); return false; } } return true; },
      bounds(part) { let b = G.PB[part]; if (b) return b; const M = G.MESH && G.MESH[part]; if (!M) return [[-1, -1, -1], [1, 1, 1]]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
        for (let i = 0; i < p.length; i += 3) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1]; if (p[i + 2] < z0) z0 = p[i + 2]; if (p[i + 2] > z1) z1 = p[i + 2]; }
        return (G.PB[part] = [[x0, y0, z0], [x1, y1, z1]]); },   // (its box in its own frame: the posed corners give the picture's box)
      get tris() { return G.MESH ? Object.values(G.MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0; } };
    MODELS.push(G); return G; }
  /* ---- one GPU pass: parts ({ part, R, o, s, sc, al, glow, glow2, spill, kind, fx, wear, outline }) in model units, the view
     V { k (px a unit), Rh (the heading), X0, Y0 (where the model's origin falls) } on c; o: { light, t, outline, res } ---- */
  function glPass(c, V, list, o, G) {
    const k = V.k, PX = [1, 0, 0], PY = [0, GY, -ZK], PD = CW, LT = LIGHT[o.light] || LIGHT.sepulchre;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { if (!G.MESH[it.part]) continue; const [lo, hi] = G.bounds(it.part), sc = it.sc || [1, 1, 1], s = it.s || 1;
      for (let q = 0; q < 8; q++) { const lc = [(q & 1 ? hi[0] : lo[0]) * sc[0] * s, (q & 2 ? hi[1] : lo[1]) * sc[1] * s, (q & 4 ? hi[2] : lo[2]) * sc[2] * s], w = mv(V.Rh, vadd(it.o, mv(it.R, lc))), sx = V.X0 + w[0] * k, sy = V.Y0 + (w[1] * GY - w[2] * ZK) * k;
        if (sx < bx0) bx0 = sx; if (sx > bx1) bx1 = sx; if (sy < by0) by0 = sy; if (sy > by1) by1 = sy; } }
    { const pad = 2 + k * 0.03; bx0 -= pad; by0 -= pad; bx1 += pad; by1 += pad; }   // (the outline and the soft edge)
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !win('__SB_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (o.res || 1);
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
  const rz = rotZ, ry = rotY, rx = rotX;
  const at3 = (R, p) => mv(R, p);
  /* the halo sprites laid in once, inside the picture: [model point, radius (units), colour, strength] */
  const proj = (V, p) => { const w = mv(V.Rh, p); return [V.X0 + w[0] * V.k, V.Y0 + (w[1] * GY - w[2] * ZK) * V.k]; };
  function halos(c, V, list) { if (!list || !list.length || typeof glowSprite !== 'function') return; c.save(); c.globalCompositeOperation = 'lighter';
    for (const [p, r, col, a] of list) { if (!(a > 0.01)) continue; const [x, y] = proj(V, p), R = r * V.k; c.globalAlpha = Math.min(1, a); c.drawImage(glowSprite(col), x - R, y - R, R * 2, R * 2); } c.restore(); }
  let BLOB = null;
  function blob(c, x, y, rx, ry, a) { if (!BLOB) { BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const g = BLOB.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    c.save(); c.globalAlpha = a; c.drawImage(BLOB, x - rx, y - ry, rx * 2, ry * 2); c.restore(); }
  const VIO = '#C9B0FF', VIOD = '#8E6BD0', GOLDH = '#E8CF8E', ICE = '#BFEFFF';
  /* a fin, a blade, a plate: an outline in the x-z plane (x out, z up), thickness th across y */
  const plate = (B, pts, th, m, b) => { B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); B.prism(pts, -th, th, m, { b: b == null ? Math.min(0.03, th * 0.5) : b }); B.pop(); return B; };
  const upLathe = (B, prof, m, o) => { B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]); B.lathe(prof, m, o); B.pop(); return B; };

  /* ======================= the models ======================= */
  const FACE_V = rotX(Math.atan2(CW[2], CW[1]));   // (a ring or an eye turned up to face the viewer: what faced the south (+y) now faces the camera)
  const DEF = {};
  /* ---- the second-eater: a floating silver hourglass, a dark sphere at its waist ringed violet, four hooked fins; it turns ---- */
  DEF.seceater = { ext: 1.8, nf: 6, faced: false, modes: ['', 'block'], foot: 0.85,
    G: model('seceater', q => { const out = {}, Bd = () => GLM.builder(q);
      out.glass = upLathe(Bd(), [[-1.12, 0.06], [-1.08, 0.44], [-0.95, 0.48], [-0.66, 0.41], [-0.36, 0.25], [-0.17, 0.13], [0, 0.1], [0.17, 0.13], [0.36, 0.25], [0.66, 0.41], [0.95, 0.48], [1.08, 0.44], [1.12, 0.06]], 536, { seg: 26 }).done();
      out.cap = (() => { const B = Bd(); B.tube([0, 0, -0.05], [0, 0, 0.05], 0.56, 0.56, 537, { seg: 30, cap0: 'flat', cap1: 'flat' }); B.torZ([0, 0, 0.05], 0.56, 0.03, 537.1, { seg: 30 }); B.torZ([0, 0, -0.05], 0.56, 0.03, 537.1, { seg: 30 }); B.sph([0, 0, 0.1], 0.09, 537.1, 10); return B.done(); })();
      out.post = (() => { const B = Bd(); B.tube([0, 0, -1.12], [0, 0, 1.12], 0.04, 0.04, 535, { seg: 8, cap0: 'flat', cap1: 'flat' }); B.sph([0, 0, 0], 0.075, 535.1, 8); B.sph([0, 0, 0.5], 0.055, 535.1, 8); B.sph([0, 0, -0.5], 0.055, 535.1, 8); return B.done(); })();
      out.core = GLM.builder(q).sph([0, 0, 0], 0.33, 539, 16).done();
      out.band = GLM.builder(q).torZ([0, 0, 0], 0.335, 0.04, 540, { seg: 26 }).done();
      out.fin = plate(Bd(), [[0.26, 0.06], [0.52, 0.2], [0.82, 0.16], [1.02, -0.06], [1.06, -0.38], [0.93, -0.22], [0.74, -0.12], [0.46, -0.1], [0.28, -0.08]], 0.035, 535.1).done();
      return out; }),
    pose(ph, md) { const sp = ph * TAU / 4, bob = Math.sin(ph * TAU) * 0.1, zc = 1.7 + bob, blk = md === 'block' ? 1 : 0, R = rz(sp), o = [0, 0, zc], L = [];
      L.push(P('core', o, R, { glow: 0.3 + blk, wear: 0.2 }), P('band', o, R, { glow: 0.5 + 1.4 * blk, kind: 0, outline: false }));
      for (let i = 0; i < 4; i++) { const a = sp + i * TAU / 4; L.push(P('post', vadd(o, [Math.cos(a) * 0.52, Math.sin(a) * 0.52, 0]), rz(a), { wear: 0.1 + i * 0.2 })); }
      for (let i = 0; i < 4; i++) { const a = sp + i * TAU / 4 + TAU / 8, fl = Math.sin(ph * TAU) * 0.08 - blk * 0.35; L.push(P('fin', o, mm(rz(a), ry(fl)), { wear: 0.3 + i * 0.13 })); }
      L.push(P('cap', vadd(o, [0, 0, 1.16]), R, { wear: 0.6 }), P('cap', vadd(o, [0, 0, -1.16]), mm(R, rx(Math.PI)), { wear: 0.8 }));
      L.push(P('glass', o, R, { al: 0.97, glow: blk * 0.6 }));
      return { parts: L, halos: [[o, 0.62, blk ? VIO : VIOD, blk ? 0.95 : 0.45], [[0, 0, zc + 0.5], 0.5, '#E4EAF2', 0.14]], shadow: [0.62, 0.22, 0.26] }; } };

  /* ---- the corner pup: a lean black hound of obsidian wedges, violet seams and slashes, a vertical violet slit of a mouth ---- */
  const PUP_LEGS = [[0.42, 0.17, 0], [0.42, -0.17, 0.5], [-0.6, 0.17, 0.5], [-0.6, -0.17, 0]];
  DEF.cornerpup = { ext: 1.85, nf: 6, faced: true, modes: ['', 'block', 'lunge'], foot: 0.85, head: 0.42,
    G: model('cornerpup', q => { const out = {}, Bd = () => GLM.builder(q);
      out.torso = plate(Bd(), [[-0.92, 0.0], [-0.86, 0.36], [-0.2, 0.5], [0.52, 0.56], [0.74, 0.2], [0.62, -0.08], [-0.1, -0.12]], 0.22, 539.2, 0.05).done();
      out.chest = plate(Bd(), [[0.15, -0.1], [0.5, 0.3], [0.82, 0.12], [0.7, -0.28], [0.35, -0.3]], 0.25, 539, 0.05).done();
      out.head = (() => { const B = Bd(); plate(B, [[-0.16, 0.16], [0.12, 0.3], [1.0, -0.06], [0.96, -0.17], [0.1, -0.38], [-0.18, -0.12]], 0.2, 539, 0.045);
        B.spike([0.0, 0.12, 0.2], [0.06, 0.17, 0.75], 0.1, 539, { seg: 4 }); B.spike([0.0, -0.12, 0.2], [0.06, -0.17, 0.75], 0.1, 539, { seg: 4 }); return B.done(); })();
      out.slit = GLM.builder(q).box([0, 0, 0], [0.02, 0.025, 0.12], 0.01, 540).done();
      out.eye = GLM.builder(q).sph([0, 0, 0], 0.06, 541, 10).done();
      out.thigh = GLM.builder(q).tube([0, 0, 0], [0.5, 0, 0], 0.09, 0.065, 539, { seg: 6 }).done();
      out.shin = GLM.builder(q).tube([0, 0, 0], [0.55, 0, 0], 0.065, 0.03, 539, { seg: 6, cap1: 'flat' }).done();
      out.tail = GLM.builder(q).spike([0, 0, 0], [0.95, 0, 0], 0.09, 539, { seg: 4 }).done();
      return out; }),
    pose(ph, md) { const run = Math.sin(ph * TAU), crouch = md === 'block' ? 1 : 0, lunge = md === 'lunge' ? 1 : 0, L = [];
      const bz = 1.0 - crouch * 0.24 + lunge * 0.12 + (lunge || crouch ? 0 : Math.abs(Math.cos(ph * TAU)) * 0.06), pitch = lunge * -0.12 + crouch * 0.08, BR = ry(pitch), bo = [0, 0, bz];
      L.push(P('torso', bo, BR, { glow: 0.3 + crouch * 0.6 + lunge * 0.8, wear: 0.4 }), P('chest', bo, BR, { glow: 0.3 + crouch * 0.6, wear: 0.7 }));
      const hp = vadd(bo, at3(BR, [0.62, 0, 0.5 - crouch * 0.14])), HR = mm(BR, ry(0.12 + crouch * 0.3 - lunge * 0.15));
      L.push(P('head', hp, HR, { glow: 0.4 + crouch * 0.8, wear: 0.55 }), P('slit', vadd(hp, at3(HR, [0.66, 0, -0.13])), HR, { kind: 0, glow: 0.8 + crouch * 1.2 + lunge, outline: false }));
      for (const sy of [1, -1]) L.push(P('eye', vadd(hp, at3(HR, [0.34, 0.15 * sy, 0.06])), HR, { kind: 0, glow: 0.6 + crouch, outline: false }));
      for (const [lx, ly, off] of PUP_LEGS) { const front = lx > 0, sw = lunge ? (front ? 0.95 : -0.95) : crouch ? (front ? 0.35 : -0.25) : Math.sin((ph + off) * TAU) * 0.55, kn = lunge ? 0.15 : crouch ? 1.1 : 0.5 + 0.35 * Math.max(0, Math.cos((ph + off) * TAU));
        const hip = vadd(bo, at3(BR, [lx, ly, 0.02])), a1 = -Math.PI / 2 + sw - (front ? 0.1 : -0.15), d1 = [Math.cos(a1), 0, Math.sin(a1)], k1 = vadd(hip, vmul(d1, 0.5)), a2 = a1 + (front ? -kn : kn), d2 = [Math.cos(a2), 0, Math.sin(a2)], f1 = vadd(k1, vmul(d2, 0.55));
        L.push(bone('thigh', hip, k1, { wear: 0.2 }), bone('shin', k1, f1, { wear: 0.6 })); }
      const tb = vadd(bo, at3(BR, [-0.86, 0, 0.3])), ta = 0.42 - crouch * 0.25 + lunge * -0.2 + run * 0.06; L.push(P('tail', tb, mm(BR, ry(-(Math.PI - ta))), { glow: 0.4 }));
      const mouth = vadd(hp, at3(HR, [0.7, 0, -0.13]));
      return { parts: L, halos: [[mouth, 0.3, VIOD, 0.55 + crouch * 0.45 + lunge * 0.3], [vadd(bo, [0, 0, 0.3]), 0.9, VIOD, 0.08 + crouch * 0.12]], shadow: [1.0, 0.3, 0.3] }; } };

  /* ---- the mourning disc: an upright cracked gold ring, a small eye hung at its centre; it mourns violet ---- */
  DEF.mourndisc = { ext: 1.45, nf: 6, faced: false, modes: ['', 'block'], foot: 0.85,
    G: model('mourndisc', q => { const out = {}, Bd = () => GLM.builder(q);
      out.ring = Bd().torY([0, 0, 0], 0.78, 0.155, 537.2, { seg: 44, rseg: 10 }).done();
      out.arc = Bd().torY([0, 0, 0], 0.97, 0.03, 537.1, { seg: 18, ph0: 5.0, ph1: 6.1 }).done();
      out.inner = Bd().torY([0, 0, 0], 0.6, 0.028, 535, { seg: 36 }).done();
      out.hang = (() => { const B = Bd(); B.tube([0, 0, 0.27], [0, 0, 0.64], 0.022, 0.022, 537.1, { seg: 6 }); B.torX([0, 0, 0.27], 0.05, 0.016, 537.1, { seg: 10 }); return B.done(); })();
      out.eye = Bd().sph([0, 0, 0], 0.25, 541, 18).done();
      out.lid = Bd().ell([0, 0, 0], [0.27, 0.27, 0.27], 539, { seg: 18, rings: 6, th0: 0, th1: 1.15 }).done();
      out.tear = (() => { const B = Bd(); B.ell([0, 0, 0], [0.045, 0.045, 0.09], 540, { seg: 8, rings: 6 }); return B.done(); })();
      return out; }),
    pose(ph, md) { const mourn = md === 'block' ? 1 : 0, bob = Math.sin(ph * TAU) * 0.09, zc = 1.62 + bob, roll = Math.sin(ph * TAU) * 0.16, yaw = Math.sin(ph * TAU + 1) * 0.22, R = mm(FACE_V, mm(rz(yaw), ry(roll))), o = [0, 0, zc], L = [];
      L.push(P('ring', o, R, { glow: mourn * 1.2, wear: 0.4 }), P('arc', o, R, { wear: 0.8 }), P('inner', o, R, { wear: 0.2 }), P('hang', o, R));
      const gz = Math.sin(ph * TAU * 2) * 0.25, ER = mm(FACE_V, mm(rz(Math.PI / 2 + gz * 0.8), ry(-0.1 + mourn * 0.25)));
      L.push(P('eye', o, ER, { kind: mourn ? 0 : 1, glow: 0.4 + mourn, spill: mourn * 0.4, outline: false }), P('lid', o, mm(FACE_V, mm(rz(Math.PI / 2), ry(-0.75 + mourn * 0.45))), { wear: 0.5 }));
      if (mourn) L.push(P('tear', vadd(o, mv(FACE_V, [0.05, 0.27, -0.3])), FACE_V, { kind: 0, glow: 1.4, outline: false }));
      return { parts: L, halos: mourn ? [[o, 1.3, VIOD, 0.5], [o, 0.45, VIO, 0.5]] : [[o, 0.9, GOLDH, 0.12]], shadow: [0.55, 0.2, 0.22] }; } };

  /* ---- the tomb ram: a blocky grey stone body, curled bone horns tipped with amber crystal ---- */
  /* (a horn's centreline: from the top of the head it curls back and down round a centre beside it, u 0 .. 1) */
  const hornC = (sy, u) => { const a = 1.3 + u * 4.4, R = 0.3 * (1 - 0.45 * u); return [-0.04 + Math.cos(a) * R, sy * (0.3 + 0.16 * u), 0.1 + Math.sin(a) * R]; };
  DEF.tombram = { ext: 1.8, nf: 6, faced: true, modes: ['', 'block', 'lunge', 'daze'], foot: 0.85, head: 0.35,
    G: model('tombram', q => { const out = {}, Bd = () => GLM.builder(q);
      out.body = (() => { const B = Bd(); B.box([0, 0, 0], [0.72, 0.42, 0.36], 0.2, 538.1); B.box([-0.06, 0, 0.3], [0.56, 0.36, 0.1], 0.08, 538.1); B.box([0.3, 0, 0.02], [0.07, 0.43, 0.33], 0.04, 537); return B.done(); })();
      out.head = (() => { const B = Bd(); B.box([0.12, 0, 0], [0.3, 0.27, 0.28], 0.11, 538.1); B.box([0.42, 0, -0.1], [0.12, 0.19, 0.16], 0.07, 538.1);
        const horn = sy => B.surf((u, v) => { const c0 = hornC(sy, u), a = 1.3 + u * 4.4, T0 = vnrm([-Math.sin(a), 0, Math.cos(a)]), N1 = [0, 1, 0], N2 = vcross(T0, N1), tr = 0.12 * (1 - 0.6 * u), ph = v * TAU;
          return vadd(c0, vadd(vmul(N1, Math.cos(ph) * tr), vmul(N2, Math.sin(ph) * tr))); }, 22, 8, () => 543.1, { e: () => 0, a: u => u, flip: sy < 0 });
        horn(1); horn(-1); return B.done(); })();
      out.tip = GLM.builder(q).crystal([0, 0, 0], [0.22, 0, 0], 0.07, 542, { n: 5 }).done();
      out.eye = GLM.builder(q).sph([0, 0, 0], 0.06, 541, 8).done();
      out.leg = GLM.builder(q).box([0, 0, -0.24], [0.09, 0.09, 0.26], 0.03, 538.1).done();
      return out; }),
    hornTip(sy) { return hornC(sy, 1); },
    pose(ph, md) { const run = Math.sin(ph * TAU), low = md === 'block' || md === 'lunge' ? 1 : 0, lun = md === 'lunge' ? 1 : 0, daze = md === 'daze' ? 1 : 0, L = [];
      const bz = 0.62 + (low ? -0.05 : Math.abs(Math.cos(ph * TAU)) * 0.03), BR = ry(lun * -0.05 + daze * Math.sin(ph * TAU) * 0.06), bo = [0, 0, bz];
      L.push(P('body', bo, BR, { wear: 0.3 }));
      const hp = vadd(bo, at3(BR, [0.72, 0, 0.12 - low * 0.18])), HR = mm(BR, mm(ry(low * 0.55 - 0.05), rx(daze * Math.sin(ph * TAU * 2) * 0.2)));
      L.push(P('head', hp, HR, { wear: 0.6 }));
      for (const sy of [1, -1]) { L.push(P('eye', vadd(hp, at3(HR, [0.4, 0.18 * sy, 0.08])), HR, { kind: low ? 3 : 2, glow: 0.5 + low, outline: false }));
        const tp = vadd(hp, at3(HR, hornC(sy, 1))); L.push(P('tip', tp, mm(HR, frameXZ([0.55, 0.15 * sy, 0.83], [0, 1, 0])), { glow: 0.4 + low * 0.8 })); }
      [[0.48, 0.25, 0], [0.48, -0.25, 0.5], [-0.5, 0.25, 0.5], [-0.5, -0.25, 0]].forEach(([lx, ly, off]) => { const sw = lun ? (lx > 0 ? 0.55 : -0.55) : low ? 0.1 : Math.sin((ph + off) * TAU) * 0.35; L.push(P('leg', vadd(bo, at3(BR, [lx, ly, -0.2])), mm(BR, ry(-sw)), { wear: 0.5 })); });
      const hz = [];
      if (daze) for (let i = 0; i < 3; i++) { const a = ph * TAU + i * 2.1; hz.push([vadd(hp, [Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.75]), 0.14, '#FFE37A', 0.9]); }
      for (const sy of [1, -1]) hz.push([vadd(hp, at3(HR, hornC(sy, 1))), 0.22, '#FFC86A', 0.35 + low * 0.4]);
      return { parts: L, halos: hz, shadow: [1.05, 0.3, 0.32] }; } };

  /* ---- the lantern eye: a dark iron cage round one huge blue eye; the cage turns slowly ---- */
  DEF.tombeye = { ext: 1.55, nf: 6, faced: false, modes: ['', 'block'], foot: 0.85,
    G: model('tombeye', q => { const out = {}, Bd = () => GLM.builder(q);
      out.eye = Bd().sph([0, 0, 0], 0.7, 541, 26).done();
      out.hoop = Bd().torX([0, 0, 0], 0.8, 0.042, 547, { seg: 36, rseg: 6 }).done();
      out.belt = Bd().torZ([0, 0, 0], 0.8, 0.05, 547, { seg: 36, rseg: 6 }).done();
      out.cap = (() => { const B = Bd(); B.box([0, 0, 0.84], [0.2, 0.2, 0.07], 0.03, 547); B.torX([0, 0, 1.02], 0.11, 0.025, 547, { seg: 14 }); B.spike([0, 0, -0.8], [0, 0, -1.12], 0.08, 547, { seg: 6 }); return B.done(); })();
      return out; }),
    pose(ph, md) { const narrow = md === 'block' ? 1 : 0, bob = Math.sin(ph * TAU) * 0.1, zc = 1.62 + bob, sp = ph * TAU / 8, o = [0, 0, zc], L = [];
      L.push(P('eye', o, mm(FACE_V, mm(rz(Math.PI / 2 + Math.sin(ph * TAU) * 0.12), ry(-0.05))), { kind: 1, glow: 0.4 + narrow * 0.9, spill: narrow, outline: false }));
      for (let i = 0; i < 4; i++) L.push(P('hoop', o, rz(sp + i * Math.PI / 4), { wear: 0.2 + i * 0.2 }));
      L.push(P('belt', o, rz(sp), { wear: 0.9 }), P('cap', o, rz(sp)));
      return { parts: L, halos: [[o, 1.25, '#7FD3F2', narrow ? 0.85 : 0.4]], shadow: [0.6, 0.2, 0.22] }; } };

  /* ---- the slab mole: a heavy brown velvet digger, a pink snout, spade claws of pale bone ---- */
  DEF.tombmole = { ext: 1.75, nf: 4, faced: true, modes: ['', 'rise', 'up'], foot: 0.85, head: 0.35, keep2D: md => md === 'dug',
    G: model('tombmole', q => { const out = {}, Bd = () => GLM.builder(q);
      out.body = Bd().ell([0, 0, 0], [0.82, 0.72, 0.7], 544, { seg: 22, rings: 14 }).done();
      out.snout = (() => { const B = Bd(); B.ell([0, 0, 0], [0.32, 0.25, 0.2], 545, { seg: 14, rings: 8 }); B.sph([0.3, 0, 0.02], 0.08, 545, 8); return B.done(); })();
      out.claw = plate(Bd(), [[0, -0.12], [0.18, -0.16], [0.42, -0.08], [0.5, 0.06], [0.36, 0.14], [0.12, 0.14], [-0.02, 0.06]], 0.04, 543, 0.02).done();
      out.bead = Bd().sph([0, 0, 0], 0.055, 549, 8).done();
      out.foot = Bd().ell([0, 0, 0], [0.18, 0.12, 0.08], 545, { seg: 10, rings: 6 }).done();
      return out; }),
    pose(ph, md) { const wad = Math.sin(ph * TAU), sink = md === 'rise' ? 0.32 : 0, bz = 0.72 - sink, BR = rx(wad * 0.08), bo = [0, 0, bz], L = [];
      L.push(P('body', bo, BR, { wear: 0.3 }), P('snout', vadd(bo, at3(BR, [0.7, 0, 0.18])), BR));
      for (const sy of [1, -1]) { L.push(P('bead', vadd(bo, at3(BR, [0.56, 0.22 * sy, 0.42])), BR, { outline: false }));
        L.push(P('claw', vadd(bo, at3(BR, [0.45, 0.62 * sy, -0.2])), mm(rz(sy * 0.55 + wad * 0.15 * sy), ry(0.25)), { wear: 0.4 }));
        if (!sink) L.push(P('foot', [-0.3 + wad * sy * 0.1, 0.4 * sy, 0.06], rz(0))); }
      return { parts: L, halos: sink ? [[[0, 0, 0.1], 0.9, '#B8A890', 0.35]] : [], shadow: [0.95, 0.3, 0.32] }; } };

  /* ---- the tomb mason: a small round grey stone mason in a dark hood, gold eyes, a gold hammer that glows ---- */
  DEF.tombmason = { ext: 1.95, nf: 6, faced: true, modes: ['', 'block'], foot: 0.85, head: 0.3,
    G: model('tombmason', q => { const out = {}, Bd = () => GLM.builder(q);
      out.body = Bd().ell([0, 0, 0], [0.52, 0.48, 0.46], 538.1, { seg: 20, rings: 12 }).done();
      out.headM = Bd().sph([0, 0, 0], 0.36, 538.1, 16).done();
      out.hood = (() => { const B = Bd(); B.push([0.8, 0, 0.6], [0, 1, 0], [-0.6, 0, 0.8], [0, 0, 0]); B.ell([0, 0, 0], [0.42, 0.42, 0.42], 538.2, { seg: 18, rings: 8, th0: 0, th1: 1.45 }); B.pop(); B.spike([-0.2, 0, 0.26], [-0.42, 0, 0.44], 0.09, 538.2, { seg: 6 }); B.torZ([0, 0, -0.3], 0.34, 0.05, 538.2, { seg: 18 }); return B.done(); })();
      out.eye = Bd().sph([0, 0, 0], 0.065, 540, 8).done();
      out.foot = Bd().ell([0, 0, 0], [0.2, 0.13, 0.1], 547, { seg: 10, rings: 6 }).done();
      out.hammer = (() => { const B = Bd(); B.tube([0, 0, 0], [0, 0, 0.82], 0.04, 0.035, 544.1, { seg: 6 }); B.box([0, 0, 0.92], [0.26, 0.12, 0.13], 0.04, 537); return B.done(); })();
      return out; }),
    pose(ph, md) { const run = Math.sin(ph * TAU), mend = md === 'block' ? 1 : 0, bz = 0.5 + (mend ? 0 : Math.abs(Math.cos(ph * TAU)) * 0.06), bo = [0, 0, bz], BR = ry(mend * 0.15), L = [];
      const hp = vadd(bo, at3(BR, [0.05, 0, 0.66])), HR = mm(BR, ry(mend * 0.25));
      L.push(P('body', bo, BR, { wear: 0.4 }), P('headM', hp, HR, { wear: 0.5 }), P('hood', hp, HR, { wear: 0.6 }));
      for (const sy of [1, -1]) { L.push(P('eye', vadd(hp, at3(HR, [0.32, 0.12 * sy, 0.0])), HR, { kind: 1, glow: 1.0 + mend * 0.6, outline: false })); L.push(P('foot', [0.1 + run * sy * 0.14, 0.28 * sy, 0.08], I3(), { wear: 0.3 })); }
      const ha = mend ? -1.9 + Math.sin(ph * TAU * 2) * 0.9 : -0.6 + run * 0.2, hb = vadd(bo, [0.4, 0.46, 0.1]), MR = mm(rz(0.3), ry(Math.PI / 2 + ha));
      L.push(P('hammer', hb, MR, { glow: 0.6 + mend * 0.8, wear: 0.7 }));
      const hh = vadd(hb, at3(MR, [0, 0, 0.92]));
      return { parts: L, halos: [[hh, 0.55, GOLDH, mend ? 0.95 : 0.55]], shadow: [0.7, 0.22, 0.3] }; } };

  /* ---- the giant ice crystal: tall pale prisms burst up through the violet stair stone, heaved slabs round its foot ---- */
  const SHARDS = [[-1.05, 1.15, -0.62, 0.22], [1.08, 1.3, 0.6, 0.24], [-0.6, 2.0, -0.28, 0.33], [0.55, 2.3, 0.22, 0.36], [0, 3.0, 0.02, 0.44], [1.35, 0.7, 0.95, 0.15], [-1.4, 0.65, -1.0, 0.14]];
  const SLABS = [[-1.25, 0.2, -0.5, 0.42], [1.2, 0.25, 0.45, 0.45], [-0.55, 0.55, -0.15, 0.4], [0.5, 0.6, 0.2, 0.42], [0, -0.5, 0, 0.36], [-0.8, -0.4, 0.3, 0.3], [0.85, -0.35, -0.35, 0.32]];
  DEF.icecrystal = { ext: 2.7, nf: 1, faced: false, modes: ['', 'hit'], foot: 0.72,
    G: model('icecrystal', q => { const B = GLM.builder(q);
      SHARDS.forEach(([x, h, a, w], i) => { const hh = h * 1.32, b = [x * 0.95, (i % 3 - 1) * 0.18, -0.05], tip = vadd(b, [Math.sin(a) * hh, (i % 2 ? 0.12 : -0.1) * hh, Math.cos(a) * hh]); B.crystal(b, tip, w * 0.95, 546, { n: 6, belly: 0.72, base: 0.85, seed: i + 1, up: [0, 1, 0] }); });
      SLABS.forEach(([x, y, a, w], i) => { B.push(...(() => { const R = mm(rz(a), rx(0.25 * (i % 2 ? 1 : -1))); return [R.x, R.y, R.z, [x, y, 0.06]]; })()); B.box([0, 0, 0], [w, w * 0.55, 0.09], 0.035, 538.3); B.pop(); });
      return { all: B.done() }; }),
    pose(ph, md) { const hit = md === 'hit' ? 1 : 0;
      return { parts: [P('all', [0, 0, 0], I3(), { glow: 0.35 + hit, glow2: hit * 0.5, wear: 0.4 })], halos: [[[0, 0, 1.6], 1.7, ICE, 0.38], [[0, 0, 1.4], 1.4, '#FFFFFF', hit * 0.6]], shadow: [1.55, 0.5, 0.42] }; } };
  const TYPES = Object.keys(DEF);

  /* ======================= baking a sprite frame ======================= */
  let CUR_BIO = null, ACT = null, ACTT = -1e9;
  const gameBio = () => { try { const D = typeof arc !== 'undefined' && arc && arc.game && arc.game._dbg; return D && D.F ? D.F.biome : null; } catch (e) { return null; } };
  const bio = () => CUR_BIO || gameBio() || 'sepulchre';
  /* the GPU may be used for the brood here and now (Rift 04's lands; checked four times a second) */
  function active() { const t = nowMs(); if (t - ACTT < 250 && ACT != null) return ACT; ACTT = t; const b = CUR_BIO || gameBio(); ACT = (!b || !!LANDS[b]) && glBase(); return ACT; }
  const ST = { baked: 0, ms: 0, prov: 0, over: {}, lazy: 0 };   // (over: the widest a model's picture reached, as a share of its sprite's half: over 1 it is cut)
  const BW = { t: -1e9, n: 0, ms: 0 }, PROV = [];
  const playing = () => typeof arc !== 'undefined' && arc && arc.state === 'play';
  function budget() { const t = nowMs(); if (t - BW.t > 14) { BW.t = t; BW.n = 0; BW.ms = 0; flushProv(); } return !playing() || win('__SB_NOBUDGET') === 1 || (BW.n < 2 && BW.ms < 4); }
  /* (the frames painted in 2D for a moment are let go, two every 14 ms, by a tick of their own while any are left, so each is rendered
     again the next time it is drawn even when nothing else is missing) */
  let PRAF = 0;
  function provTick() { if (PRAF || typeof requestAnimationFrame !== 'function') return; const f = () => { PRAF = 0; if (!PROV.length) return; if (nowMs() - BW.t > 14) { BW.t = nowMs(); BW.n = 0; BW.ms = 0; flushProv(); } if (PROV.length) PRAF = requestAnimationFrame(f); }; PRAF = requestAnimationFrame(f); }
  function flushProv() { const MC = DunArt.monCache; for (let i = 0; i < 2 && PROV.length; i++) { const k = PROV.shift(); if (MC) { MC.delete(k); MC.delete(k + '|f'); } } }
  /* render type's frame ph in mode md0 ('<' at its end: facing left) into the sprite canvas c (its origin the sprite's centre;
     r the body radius in its pixels). False: not done (the caller paints the 2D art) */
  function bake(c, type, r, ph, o) {
    const D = DEF[type], md0 = (o && o.mode) || '', left = md0.charCodeAt(md0.length - 1) === 60, md = left ? md0.slice(0, -1) : md0;
    if (!D || (D.keep2D && D.keep2D(md)) || !active() || !D.G.on()) return false;
    if (!budget()) { ST.prov++; provTick(); PROV.push(type + '|' + r + '|' + Math.round(ph * ((DunArt.NF && DunArt.NF[type]) || 4)) + '|' + (o && o.color) + '|' + md0); return false; }
    const t0 = nowMs(); let ok = false;
    try { const Ps = D.pose(ph, md), head = D.faced ? (left ? Math.PI - (D.head || 0.4) : (D.head || 0.4)) : 0, V = { k: r, Rh: rz(head), X0: 0, Y0: D.foot * r }, sh = Ps.shadow;
      if (sh) blob(c, 0, V.Y0, sh[0] * r * 1.05, sh[1] * r * 1.05, sh[2]);
      ok = glPass(c, V, Ps.parts, { light: LANDS[bio()] ? bio() : 'sepulchre', t: ph * 10, res: lowFx() ? 0.8 : 1, outline: 1.1 }, D.G);
      if (ok) { halos(c, V, Ps.halos); const half = c.canvas ? c.canvas.width / 2 : 0, b = D.G.box; if (half && b) { const ov = Math.max(-b[0], b[2], -b[1], b[3]) / half; if (ov > (ST.over[type] || 0)) ST.over[type] = +ov.toFixed(2); } }
    } catch (e) { failed(); if (typeof console !== 'undefined') console.warn('SEP_BROOD bake ' + type, e); ok = false; }
    const dt = nowMs() - t0; BW.n++; BW.ms += dt; ST.ms += dt; if (ok) { ST.baked++; if (playing()) ST.lazy++; }
    return ok;
  }
  /* the painters wrapped; the sprites' room (EXT) the models' own while the GPU is used (the 2D art's otherwise) */
  const { MP, EXT, NF } = DunArt, ORIG = {};
  for (const t of TYPES) { const p0 = MP[t]; if (typeof p0 !== 'function') continue; const e0 = EXT[t] || 1.6; ORIG[t] = { p0, e0 };
    MP[t] = function (c, r, ph, o) { if (bake(c, t, r, ph, o)) return; const md = (o && o.mode) || '';
      if (md.charCodeAt(md.length - 1) === 60) { c.save(); c.scale(-1, 1); p0(c, r, ph, Object.assign({}, o, { mode: md.slice(0, -1) })); c.restore(); return; }
      return p0(c, r, ph, o); };
    try { Object.defineProperty(EXT, t, { get: () => (active() ? DEF[t].ext : e0), set: v => { ORIG[t].e0 = v; }, configurable: true, enumerable: true }); } catch (e) { /* (kept as it was) */ }
    if (DEF[t].nf && NF[t] !== DEF[t].nf) NF[t] = DEF[t].nf; }
  /* 20b's drawMon: does this type have its own left-facing frames (not the right-facing one mirrored)? */
  DunArt.FACED = t => { const D = DEF[t]; return !!(D && D.faced && active()); };

  /* ======================= the mini bosses, posed live ======================= */
  const MINI = {};
  MINI.hourpet = { k: 1.02, G: model('tock', q => { const out = {}, Bd = () => GLM.builder(q);
      out.body = Bd().ell([0, 0, 0], [0.86, 0.8, 0.88], 538.4, { seg: 26, rings: 16 }).done();
      out.headM = (() => { const B = Bd(); B.ell([0, 0, 0], [0.95, 0.92, 0.86], 538.4, { seg: 26, rings: 16 }); B.box([0.72, 0, 0.36], [0.1, 0.5, 0.06], 0.04, 537); return B.done(); })();
      out.ear = (() => { const B = Bd(); plate(B, [[-0.08, 0], [0.08, 0], [0.05, 0.6], [0, 0.82], [-0.05, 0.6]], 0.03, 537.1, 0.015); B.sph([0, 0, 0], 0.09, 537.1, 8); return B.done(); })();
      out.eye = Bd().sph([0, 0, 0], 0.21, 541, 14).done();
      out.dial = (() => { const B = Bd(); B.tube([-0.04, 0, 0], [0.04, 0, 0], 1.0, 1.0, 548, { seg: 32, cap0: 'flat', cap1: 'flat' }); B.torX([0.04, 0, 0], 1.0, 0.07, 537.1, { seg: 32 }); return B.done(); })();
      out.hand = Bd().box([0.06, 0, 0.3], [0.02, 0.04, 0.32], 0.01, 537.1).done();
      out.arm = Bd().tube([0, 0, 0], [0.6, 0, 0], 0.16, 0.14, 538.4, { seg: 10 }).done();
      out.paw = Bd().sph([0, 0, 0], 0.2, 537, 12).done();
      out.leg = Bd().ell([0, 0, 0], [0.28, 0.24, 0.2], 538.4, { seg: 14, rings: 8 }).done();
      out.glass = upLathe(Bd(), [[-0.5, 0.05], [-0.46, 0.3], [-0.25, 0.24], [-0.07, 0.07], [0.07, 0.07], [0.25, 0.24], [0.46, 0.3], [0.5, 0.05]], 536, { seg: 20 }).done();
      out.gcap = Bd().tube([0, 0, -0.05], [0, 0, 0.05], 0.36, 0.36, 537, { seg: 22, cap0: 'flat', cap1: 'flat' }).done();
      out.sand = Bd().sph([0, 0, 0], 0.14, 540, 10).done();
      return out; }),
    pose(m, t) { const W = m._sbW || 0, mv0 = m._sbMv || 0, act = m.act || '', T = m.actT || 0, cast = act === 'stop' ? Math.min(1, T * 3) * (T < 1.0 ? 1 : Math.max(0, 1 - (T - 1) * 4)) : 0, tick = act === 'tick' ? 1 : 0;
      const step = Math.sin(W) * mv0, bz = 0.95 + Math.abs(Math.cos(W)) * 0.08 * mv0 + Math.sin(t * 2.2) * 0.03, bo = [0, 0, bz], BR = ry(0.05 * mv0 + tick * Math.sin(T * 11) * 0.04), L = [];
      L.push(P('body', bo, BR, { wear: 0.3 }));
      const dg = vadd(bo, at3(BR, [0.72, 0, 0.12])), DR = mm(BR, ry(-0.6)); L.push(P('dial', dg, DR, { s: 0.56, glow: 0.3 + cast * 1.5 + tick * 0.6, wear: 0.5 }));
      const hA = tick ? -Math.floor(T / 0.55) * 0.52 : 0.4; L.push(P('hand', vadd(dg, at3(DR, [0.03, 0, 0])), mm(DR, rx(hA)), { s: 0.5 }), P('hand', vadd(dg, at3(DR, [0.03, 0, 0])), mm(DR, rx(2.2)), { s: 0.38 }));
      const hp = vadd(bo, [0.1, 0, 1.55]), HR = mm(BR, ry(-0.06 + cast * -0.12)); L.push(P('headM', hp, HR, { wear: 0.6 }));
      for (const sy of [1, -1]) { L.push(P('eye', vadd(hp, at3(HR, [0.74, 0.34 * sy, 0.14])), mm(HR, ry(-0.35)), { kind: 2, glow: 0.9 + cast + tick * 0.5, spill: 0.3, outline: false }));
        L.push(P('ear', vadd(hp, at3(HR, [-0.05, 0.5 * sy, 0.62])), mm(HR, rx(-sy * 0.45)), { wear: 0.4 }));
        const sh = vadd(bo, at3(BR, [0.1, 0.78 * sy, 0.25])), lift = cast ? 2.7 : tick ? 1.9 : 0.3 + Math.sin(W + (sy > 0 ? 0 : Math.PI)) * 0.4 * mv0, AR = mm(rz(sy * (cast ? 0.6 : 0.25)), ry(-lift));
        L.push(P('arm', sh, mm(AR, ry(Math.PI / 2 - 0.2)), { wear: 0.5 }), P('paw', vadd(sh, at3(mm(AR, ry(Math.PI / 2 - 0.2)), [0.66, 0, 0])), I3(), { glow: cast }));
        L.push(P('leg', [0.12 + step * 0.22 * sy, 0.42 * sy, 0.16 + Math.max(0, step * sy) * 0.12], I3(), { wear: 0.7 })); }
      const gb = vadd(bo, at3(BR, [-0.85, 0, 0.55])), GR = mm(BR, ry(-0.35)); L.push(P('gcap', vadd(gb, at3(GR, [0, 0, 0.5])), GR), P('gcap', vadd(gb, at3(GR, [0, 0, -0.5])), GR), P('sand', vadd(gb, at3(GR, [0, 0, 0.2])), GR, { kind: 1, glow: 0.8 + cast, outline: false }), P('glass', gb, GR, { al: 0.97 }));
      return { parts: L, halos: [[vadd(dg, [0.2, 0, 0]), 0.9, GOLDH, 0.18 + cast * 0.6 + tick * 0.25], [vadd(gb, [0, 0, 0.2]), 0.5, GOLDH, 0.35]] }; } };
  MINI.kennelpet = { k: 0.95, G: model('howl', q => { const out = {}, Bd = () => GLM.builder(q);
      out.torso = plate(Bd(), [[-1.0, 0.0], [-0.95, 0.55], [-0.2, 0.72], [0.6, 0.82], [0.92, 0.35], [0.8, -0.1], [-0.1, -0.2]], 0.48, 539.2, 0.07).done();
      out.head = (() => { const B = Bd(); plate(B, [[-0.2, 0.25], [0.2, 0.45], [1.0, 0.05], [0.98, -0.12], [0.15, -0.42], [-0.22, -0.15]], 0.36, 539, 0.06); return B.done(); })();
      out.ear = plate(Bd(), [[-0.16, 0], [0.16, 0], [0.18, 0.45], [-0.14, 0.5]], 0.05, 539, 0.025).done();
      out.eye = Bd().sph([0, 0, 0], 0.11, 541, 12).done();
      out.slit = Bd().box([0, 0, 0], [0.03, 0.05, 0.2], 0.015, 540).done();
      out.collar = (() => { const B = Bd(); B.torX([0, 0, 0], 0.5, 0.07, 537, { seg: 28 }); B.box([0, 0, -0.56], [0.03, 0.1, 0.1], 0.02, 537.1); return B.done(); })();
      out.thigh = Bd().tube([0, 0, 0], [0.62, 0, 0], 0.17, 0.12, 539, { seg: 7 }).done();
      out.shin = Bd().tube([0, 0, 0], [0.66, 0, 0], 0.12, 0.07, 539, { seg: 7, cap1: 'flat' }).done();
      out.tail = Bd().spike([0, 0, 0], [1.3, 0, 0], 0.15, 539, { seg: 4 }).done();
      out.ridge = (() => { const B = Bd(); [[-0.75, 0.62, 0.22], [-0.35, 0.74, 0.28], [0.05, 0.82, 0.32], [0.42, 0.88, 0.3]].forEach(([x, z, h]) => B.spike([x, 0, z - 0.06], [x - 0.12, 0, z + h], 0.1, 539, { seg: 4 })); return B.done(); })();   // (a row of short spines down its back: what shows when it turns away)
      return out; }),
    pose(m, t) { const W = m._sbW || 0, mv0 = m._sbMv || 0, act = m.act || '', T = m.actT || 0, crouch = act === 'lunge' && T < 0.8 ? Math.min(1, T * 4) : 0, dash = act === 'lunge' && T >= 0.8 && T < 1.35 ? 1 : 0, howl = act === 'call' ? Math.min(1, T * 4) * (T < 0.9 ? 1 : Math.max(0, 1 - (T - 0.9) * 3)) : 0;
      const bz = 1.15 - crouch * 0.3 + dash * 0.12 + Math.abs(Math.cos(W)) * 0.07 * mv0, pitch = dash * -0.12 + crouch * 0.1 - howl * 0.18, BR = ry(pitch), bo = [0, 0, bz], L = [];
      L.push(P('torso', bo, BR, { glow: 0.7 + crouch * 0.9 + dash, wear: 0.4 }), P('ridge', bo, BR, { glow: 0.9 + crouch + howl, wear: 0.6 }));
      const hp = vadd(bo, at3(BR, [0.82, 0, 0.75 - crouch * 0.2])), HR = mm(BR, ry(0.1 + crouch * 0.35 - dash * 0.2 - howl * 0.75));
      L.push(P('head', hp, HR, { glow: 0.3 + crouch, wear: 0.6 }), P('collar', vadd(bo, at3(BR, [0.72, 0, 0.45])), mm(BR, ry(0.5)), { wear: 0.3 }));
      L.push(P('slit', vadd(hp, at3(HR, [0.88, 0, -0.16])), HR, { kind: 0, glow: 0.9 + crouch * 1.4 + howl * 1.5, outline: false }));
      for (const sy of [1, -1]) { L.push(P('eye', vadd(hp, at3(HR, [0.52, 0.27 * sy, 0.12])), HR, { kind: 0, glow: 0.9 + crouch, spill: 0.5, outline: false }));
        L.push(P('ear', vadd(hp, at3(HR, [-0.02, 0.22 * sy, 0.34])), mm(HR, rx(-sy * 0.3)), { wear: 0.4 })); }
      [[0.6, 0.33, 0], [0.6, -0.33, 0.5], [-0.72, 0.33, 0.5], [-0.72, -0.33, 0]].forEach(([lx, ly, off]) => { const front = lx > 0, sw = dash ? (front ? 1.0 : -1.0) : crouch ? (front ? 0.3 : -0.3) : Math.sin(W + off * TAU) * 0.6 * mv0, kn = dash ? 0.15 : crouch ? 1.2 : 0.45 + 0.3 * mv0 * Math.max(0, Math.cos(W + off * TAU));
        const hip = vadd(bo, at3(BR, [lx, ly, 0.05])), a1 = -Math.PI / 2 + sw - (front ? 0.1 : -0.15), k1 = vadd(hip, vmul([Math.cos(a1), 0, Math.sin(a1)], 0.62)), a2 = a1 + (front ? -kn : kn), f1 = vadd(k1, vmul([Math.cos(a2), 0, Math.sin(a2)], 0.66));
        L.push(bone('thigh', hip, k1, { wear: 0.2 }), bone('shin', k1, f1, { wear: 0.6 })); });
      L.push(P('tail', vadd(bo, at3(BR, [-0.92, 0, 0.45])), mm(BR, ry(-(Math.PI - 0.5 + crouch * 0.3 - dash * 0.25) + Math.sin(t * 3) * 0.05)), { glow: 0.5 }));
      return { parts: L, halos: [[vadd(hp, at3(HR, [0.95, 0, -0.16])), 0.5, VIOD, 0.5 + crouch * 0.4 + howl * 0.5]] }; } };
  /* drawn in RiftEvil.draw's place (20m3) when the GPU can be used: true when it drew */
  function drawMini(c, m, X, Y, r, t, me) {
    const D = MINI[m.bk && m.bk.id]; if (!D || m.under || !active() || !D.G.on()) return false;
    const vx = m._sbx != null ? m.x - m._sbx : 0, vy = m._sby != null ? m.y - m._sby : 0, sp = Math.hypot(vx, vy); m._sbx = m.x; m._sby = m.y;
    const moving = sp > 0.003 && m.act !== 'sleep' && !(m.stunT > 0 && m.act === 'stunned');
    m._sbMv = (m._sbMv || 0) + ((moving ? 1 : 0) - (m._sbMv || 0)) * 0.15; m._sbW = (m._sbW || 0) + (moving ? Math.min(0.35, 0.12 + sp * 2.2) : 0.02);
    // the heading: toward where it goes, or the pet; turned smoothly (a little toward the viewer, so its face shows)
    let want = moving ? Math.atan2(vy, vx) : (me ? Math.atan2(me.y - m.y, me.x - m.x) : 0); if (m.act === 'lunge' && m.ca != null) want = m.ca;
    if (m._sbYaw == null) m._sbYaw = want; let d = want - m._sbYaw; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; m._sbYaw += d * 0.18;
    const yaw = m._sbYaw + (m.stunT > 0 && m.act === 'stunned' ? Math.sin(t * 5) * 0.25 : 0), k = r * (D.k || 1), foot = Y + r * 0.75, Ps = D.pose(m, t);
    const V = { k, Rh: rz(yaw), X0: X, Y0: foot };
    // the rift's smoke and a dark pool under it (as the Rift-touched have), then the model, then its soft lights
    c.save(); const sm = typeof glowSprite === 'function' ? glowSprite('#1A0A2A') : null; if (sm) { c.globalAlpha = 0.55; c.drawImage(sm, X - r * 1.9, foot - r * 0.9, r * 3.8, r * 1.5); } c.restore();
    blob(c, X, foot, r * 1.05, r * 0.36, 0.42);
    const fl = m.flash > 0 ? 0.6 : 0; if (fl) for (const it of Ps.parts) it.glow2 = fl;
    if (m.act === 'sleep') for (const it of Ps.parts) it.al = (it.al == null ? 1 : it.al) * 0.999;
    let ok = false; try { ok = glPass(c, V, Ps.parts, { light: LANDS[bio()] ? bio() : 'sepulchre', t, outline: 1.2 }, D.G); } catch (e) { failed(); ok = false; }
    if (!ok) return false;
    halos(c, V, Ps.halos);
    if (m.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22; if (typeof blitSized === 'function') blitSized(c, glowSprite('#FFFFFF'), X - r * 1.3, foot - r * 2.6, r * 2.6, r * 2.6); c.restore(); }
    ST.mini++; return true;
  }
  ST.mini = 0;
  try { if (typeof RiftEvil !== 'undefined' && RiftEvil && !RiftEvil.__sbMini) { const d0 = RiftEvil.draw; RiftEvil.draw = function (c, m, X, Y, r, t, me) { if (m && m.bk && MINI[m.bk.id]) { try { if (drawMini(c, m, X, Y, r, t, me)) return true; } catch (e) { failed(); } } return d0.apply(this, arguments); }; RiftEvil.__sbMini = 1; } } catch (e) { /* (no Rift-touched) */ }

  /* ======================= warming on the loading screen, and letting go ======================= */
  const KEEP = new Set(TYPES);
  /* Rf.preload (20b preloadMore): every frame the stage's brood will show, at its sizes, in each mode and facing */
  const STAGE_TYPES = { 'The Memory Loom': ['cornerpup', 'seceater', 'mourndisc'], 'The Borrowed Beast': ['tombram', 'tombeye', 'tombmole'], 'The Three Lying Guardians': ['tombmason'], 'The Three Statues': ['tombmason'], 'Borrowed Pursuit': ['cornerpup', 'seceater', 'mourndisc'], 'The Corner Kennels': ['icecrystal'] };
  function preload(Pp) {
    try { CUR_BIO = Pp && Pp.F && Pp.F.biome || null; ACTT = -1e9; } catch (e) { CUR_BIO = null; }
    if (!active()) return [];
    const want = new Map(), add = (t, rpx, col) => { if (!DEF[t] || !(rpx > 0) || !MON[t]) return; const key = t + '|' + Math.max(4, Math.round(rpx)) + '|' + (col || MON[t].color); if (!want.has(key)) want.set(key, [t, rpx, col || MON[t].color]); };
    for (const m of (Pp.mons || []).concat(Pp.reserve || [])) if (m && !m.dead && !m.boss && !m.fiend && DEF[m.type]) add(m.type, m.r * Pp.T * Pp.k, m.color);
    const nm = Pp.S && (Pp.S.name || Pp.S.goal); for (const t of STAGE_TYPES[nm] || []) add(t, Pp.monPx(t));
    const jobs = [];
    jobs.push(() => { for (const t of new Set([...want.values()].map(w => w[0]))) DEF[t].G.on(); });   // (the meshes, and GLM's program, made first)
    for (const [t, rpx, col] of want.values()) { const D = DEF[t], nf = D.nf || 4; for (const md of D.modes) for (const lf of D.faced ? [false, true] : [false]) jobs.push(() => { for (let f = 0; f < nf; f++) DunArt.monSprite(t, rpx, (f + 0.5) / nf, col, lf ? md + '<' : md, false); }); }
    return jobs;
  }
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.sepulchre; if (Rf) { const p0 = Rf.preload; Rf.preload = function (Pp) { let a = null; if (typeof p0 === 'function') { try { a = p0.apply(this, arguments); } catch (e) { a = null; } } let b = []; try { b = preload(Pp); } catch (e) { b = []; } return (Array.isArray(a) ? a : []).concat(b); }; } } catch (e) { /* (no rift) */ }
  /* the pictures held now (MB at 4 bytes a pixel), by type */
  function mem() { const MC = DunArt.monCache, by = {}; let px = 0, n = 0; if (MC) for (const [k, s] of MC) { const t = k.slice(0, k.indexOf('|')); if (!KEEP.has(t) || !s || !s.cv) continue; const p = s.cv.width * s.cv.height; px += p; n++; by[t] = (by[t] || 0) + p; }
    const MB = {}; for (const t in by) MB[t] = +(by[t] * 4 / 1048576).toFixed(2); return { n, px, MB: +(px * 4 / 1048576).toFixed(2), by: MB }; }
  function gpuBuffers() { let n = 0; for (const G of MODELS) if (G.MESH) for (const k in G.MESH) if (G.MESH[k] && G.MESH[k].gl) n++; return n; }
  let REL_N = 0;
  function release() { const MC = DunArt.monCache; if (MC) for (const k of [...MC.keys()]) { const t = k.slice(0, k.indexOf('|')); if (!KEEP.has(t)) continue; const s = MC.get(k); MC.delete(k); if (s && s.cv && s.cv.width > 1) { s.cv.width = 1; s.cv.height = 1; } }
    for (const G of MODELS) if (G.MESH && typeof GLM !== 'undefined' && GLM.free) for (const k in G.MESH) if (G.MESH[k]) GLM.free(G.MESH[k]);
    PROV.length = 0; if (PRAF && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(PRAF); PRAF = 0; CUR_BIO = null; ACT = null; ACTT = -1e9; REL_N++; }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(release); } catch (e) { /* (no rift hook) */ }
  try { const GD = typeof GAMES !== 'undefined' && GAMES.dungeon; if (GD && GD.create && !GD.__sbRel) { const c0 = GD.create; GD.__sbRel = 1; GD.create = function () { const api = c0.apply(this, arguments); if (api && typeof api.destroy === 'function') { const d0 = api.destroy; api.destroy = function () { try { release(); } catch (e) { /* (nothing held) */ } return d0.apply(this, arguments); }; } return api; }; } } catch (e) { /* (no dungeon) */ }
  return { DEF, MINI, TYPES, LIGHT, bake, drawMini, preload, release, mem, active, get gpuBuffers() { return gpuBuffers(); }, get stats() { return Object.assign({ prov: PROV.length, models: MODELS.map(G => ({ name: G.name, tris: G.tris, meshMs: +G.meshMs.toFixed(1), passMs: +G.ms.toFixed(2), n: G.n })), released: REL_N, bio: bio() }, ST); }, get bio() { return bio(); }, set bio(v) { CUR_BIO = v; ACTT = -1e9; }, env: () => ({ DunArt, MON, BIOMES }) };
})();
if (typeof window !== 'undefined') window.SEP_BROOD = SEP_BROOD;
