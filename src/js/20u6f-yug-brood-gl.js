/* ---------- (v472 YM) YUG_BROOD: Rift 06's brood in three dimensions, its attacks on the GPU, its mini bosses as giant evil Cocopets ----------
   The user (2026-11-28): "proceed to rebuild /remake rift 6 from scratch on the gpu, using the 2d version as reference. All monsters,
   props got to me rebuild again in gpu. Monsters need to be light to draw so it won't overwhelm the machine but still look good on gpu."

   THE BROOD (20u6, 20u6b; the challenge stages (20u5) and the bosses' fights bring the same kinds). Each is its 2D drawing made a
   model: the same creature, silhouette, colours and signature parts. The spark mite: a ribbed gunmetal shell on six thin legs, the
   violet cell set in its back behind glass, a small head with two antenna prongs tipped in violet; charging, white current crackles
   at its prongs and the cell blazes; dashing, it pitches forward with its legs swept back. The hull wing: a lumpy rose fungal body
   under a ridged brain lobe whose glow turns teal, violet and amber, two rose membrane wings beating, two crab claws below. The coil
   sentry: a gunmetal saucer ringed with teal lights, three thruster legs glowing teal, a coil tower wound with three violet rings and
   a crackling ball on top (white and blazing while its beam is live). The charge cell: a bevelled canister with a dark glass window,
   violet current forking inside, amber and black stripes round its foot, a cap with two terminals. The war mech: two thick jointed
   legs with glowing knees and splayed feet, a hexagonal hull with a teal visor slit (hot orange while it aims and fires) and a striped
   belly plate, missile pods on its shoulders (their tubes glowing amber as the salvo goes), an arm cannon on its near side. The mech
   hound: a low angular steel body on four needle legs, a bright steel blade fin down its spine edged in violet, a visor slit for an
   eye (hot orange as it crouches to pounce). The engine egg: a tall leathery egg of plated hide, its crown's four seams glowing violet,
   then amber and parting as it cracks (shaking). The eggling: a round metal body, one amber eye in a dark ring, six needle legs, a
   curled segmented tail with a steel sting.
   GLM models (rigid parts built once, all opaque (a part seen through costs a program of its own the first time: one long hitch), materials 830..849 in the YM-YUG-MAT block of 20k5uz (sub-ids .1-.4 only: an id is rounded, so .5 would read as the next); a few hundred to ~2k triangles each),
   never drawn live: every frame the game needs is rendered ONCE into the monster sprite cache the 2D art already uses
   (DunArt.monSprite: type x size x frame x mode, an LRU of small canvases), as Rift 05's brood (20s6f, AUR_BROOD) is. Its painter
   (MP[type]) is wrapped: where the GPU can be used it renders the model posed for that frame and mode into the sprite's canvas (its
   contact shadow and soft lights laid in 2D once, inside the picture), else it paints the 2D art as before. A crowd costs what the 2D
   crowd cost: one drawImage a monster a frame, no GL per monster per frame. Models with a front (spark mite, war mech, mech hound,
   eggling) are baked facing each way ('<' in the mode, DunArt.FACED); the others are baked once and mirrored. Frames are rendered on
   the loading screen (Rf.preload); anything first seen in play within a budget (two pictures or 4 ms in any 14 ms), the rest painted
   in 2D for a moment and rendered again later. Pictures and meshes' GPU buffers are let go when a stage closes. Only in Rift 06's lands.
   THEIR ATTACKS: the brood's and the minis' tells (lanes, rings, cones), the coil sentries' beams of current (a crackling GPU beam from
   the ball on its coil to its partner; the 2D line is held back while the layer paints), the spark mites' dash streaks, the sentries'
   bolts, the hull wings' spore clouds, and the bursts (a hound's or an eggling's landing, an egg hatching, a tell striking) are painted
   on the GPU (FGFX kinds 590..596, YM-FX in 20k6h: added light, feathered, glow only; red tells made violet or amber: no red circles).
   Their numbers and timings are untouched: the AI is wrapped only to tag what it makes. The shots go in the engine's own GPU pass
   (b.paint); the rest in one pass of this layer's under the monsters, made only when something is showing. Where FGFX is not usable
   the engine draws them in 2D as before.
   THE MINI BOSSES (Arc, Coolant, Overload): giant evil Cocopets like every other rift's (EVIL_MINI, 20zz9: PetGL, its poses baked,
   v471), themed for the Engine by MINI_LOOK: grown from the rift's own mecha form (RiftEvil.form with mecha: gunmetal coat, a neon
   accent, glowing eyes, horns), armoured, tinted per land; their own moves, health and blows kept (EVIL_MINI.arm with keep).
   Without WebGL, on a software rasteriser (unless window.__YUB_GL = 1, tests), with window.__YUB_GL = 0 or after three failures in
   20 s, the 2D art is drawn exactly as before. window.__YUB_GLHQ = 1: full resolution on a software rasteriser (tests);
   window.__YUB_FX = 0: the attacks' GPU layer off. */
const YUG_BROOD = (() => {
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
  const LANDS = { wreckfield: 1, coolant: 1, engineheart: 1 };
  const Y0P = typeof YUG !== 'undefined' ? YUG : { VIOLET: '#C452FF', VIOLET_HI: '#E8B8FF', TEAL: '#3FE0C8', TEAL_HI: '#B8FFF2', AMBER: '#FFB23F', FLESH: '#7A3A6E', FUNGUS: '#E88AC0' };
  const { VIOLET, VIOLET_HI, TEAL, TEAL_HI, AMBER, FUNGUS } = Y0P;
  /* the lights (world: x east, y south toward the viewer, z up): each land's key colour (uAmb) and rim (uRim) */
  const LIGHT = {
    wreckfield: { lk: vnrm([-0.5, 0.4, 0.78]), ls: vnrm([0.3, 0.25, 0.92]), lr: vnrm([0.55, -0.75, 0.38]), key: [1.3, 1.28, 1.4], rim: [1.0, 0.55, 1.4] },
    coolant: { lk: vnrm([-0.45, 0.35, 0.82]), ls: vnrm([0.25, 0.3, 0.92]), lr: vnrm([0.5, -0.8, 0.35]), key: [1.16, 1.34, 1.34], rim: [0.38, 1.35, 1.18] },
    engineheart: { lk: vnrm([-0.5, 0.4, 0.78]), ls: vnrm([0.3, 0.25, 0.9]), lr: vnrm([-0.5, -0.75, 0.42]), key: [1.42, 1.16, 1.22], rim: [1.45, 0.7, 0.95] } };
  const OUTC = [0.05, 0.04, 0.08], UPW = [0, 0, 1], GLCAP = 1400, GLI = [], GLJ = [];
  /* ---- a model's GL state: meshes built once on first use (lowFx: fewer segments), failures counted ---- */
  let FAILS = 0, FAILT = 0, NOGL = false;
  function failed() { const t = nowMs(); if (t - FAILT > 20000) FAILS = 0; FAILT = t; if (++FAILS >= 3) NOGL = true; }
  function glBase() { if (NOGL || win('__YUB_GL') === 0 || typeof GLM === 'undefined') return false; try { if (!GLM.ok()) return false; if (GLM.soft && win('__YUB_GL') !== 1) return false; } catch (e) { return false; } return true; }
  const MODELS = [];
  function model(name, build) {
    const G = { name, MESH: null, PB: {}, ms: 0, n: 0, meshMs: 0,
      on() { if (!glBase()) return false; if (!G.MESH) { try { const t0 = nowMs(); G.MESH = build(lowFx() ? 0.65 : 1); G.meshMs = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('YUG_BROOD ' + name + ': meshes', e); return false; } } return true; },
      bounds(part) { let b = G.PB[part]; if (b) return b; const M = G.MESH && G.MESH[part]; if (!M) return [[-1, -1, -1], [1, 1, 1]]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
        for (let i = 0; i < p.length; i += 3) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1]; if (p[i + 2] < z0) z0 = p[i + 2]; if (p[i + 2] > z1) z1 = p[i + 2]; }
        return (G.PB[part] = [[x0, y0, z0], [x1, y1, z1]]); },
      get tris() { return G.MESH ? Object.values(G.MESH).reduce((a, m) => a + (m ? m.ntri : 0), 0) : 0; } };
    MODELS.push(G); return G; }
  /* ---- one GPU pass: parts ({ part, R, o, s, sc, al, glow, glow2, spill, kind, fx, wear, outline }) in model units, the view
     V { k (px a unit), Rh (the heading), X0, Y0 (where the model's origin falls) } on c; o: { light, t, outline, res } ---- */
  function glPass(c, V, list, o, G) {
    const k = V.k, PX = [1, 0, 0], PY = [0, GY, -ZK], PD = CW, LT = LIGHT[o.light] || LIGHT.wreckfield;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { if (!G.MESH[it.part]) continue; const [lo, hi] = G.bounds(it.part), sc = it.sc || [1, 1, 1], s = it.s || 1;
      for (let q = 0; q < 8; q++) { const lc = [(q & 1 ? hi[0] : lo[0]) * sc[0] * s, (q & 2 ? hi[1] : lo[1]) * sc[1] * s, (q & 4 ? hi[2] : lo[2]) * sc[2] * s], w = mv(V.Rh, vadd(it.o, mv(it.R, lc))), sx = V.X0 + w[0] * k, sy = V.Y0 + (w[1] * GY - w[2] * ZK) * k;
        if (sx < bx0) bx0 = sx; if (sx > bx1) bx1 = sx; if (sy < by0) by0 = sy; if (sy > by1) by1 = sy; } }
    { const pad = 2 + k * 0.03; bx0 -= pad; by0 -= pad; bx1 += pad; by1 += pad; }
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !win('__YUB_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (o.res || 1);
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
  function blob(c, x, y, rx2, ry2, a) { if (!BLOB) { BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const g = BLOB.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(6,2,14,1)'); gr.addColorStop(0.5, 'rgba(6,2,14,.6)'); gr.addColorStop(1, 'rgba(6,2,14,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    c.save(); c.globalAlpha = a; c.drawImage(BLOB, x - rx2, y - ry2, rx2 * 2, ry2 * 2); c.restore(); }
  /* a two-point leg: hip to foot with the knee lifted toward `out` (a unit vector), lengths l1, l2 */
  function knee(h, f, l1, l2, out) { const d = vsub(f, h), L = Math.min(l1 + l2 - 1e-3, Math.max(1e-3, vlen(d))), u = vnrm(d), a = (l1 * l1 - l2 * l2 + L * L) / (2 * L), hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    let w = vsub(out, vmul(u, vdot(out, u))); w = vlen(w) < 1e-5 ? [0, 0, 1] : vnrm(w); return vadd(vadd(h, vmul(u, a)), vmul(w, hh)); }
  /* a crackle of current: a zigzag polyline of thin bright tubes between a and b (n kinks, seeded) */
  function zap(B, a, b, n, amp, seed, m, rr) { let p = a; const d = vsub(b, a), side = vnrm(vcross(d, [0.3, 0.2, 1])), up2 = vnrm(vcross(side, d));
    for (let i = 1; i <= n; i++) { const u = i / n, j = i < n ? Math.sin(seed * 7.1 + i * 2.9) * amp : 0, j2 = i < n ? Math.cos(seed * 3.3 + i * 4.1) * amp * 0.6 : 0, q = vadd(vadd(a, vmul(d, u)), vadd(vmul(side, j), vmul(up2, j2))); B.tube(p, q, rr, rr * 0.8, m, { seg: 5 }); p = q; }
    return B; }

  /* ======================= the models ======================= */
  const DEF = {};
  /* ---- the spark mite: a ribbed gunmetal shell over a dark belly on six thin legs, the violet cell behind glass in its back framed in
     black, a small head with two antenna prongs tipped in violet; charging ('block'): white current at its prongs, the cell blazing;
     dashing ('dash'): pitched forward, legs swept back ---- */
  const MITE_LEGS = [[0.45, 0], [0, 0.33], [-0.45, 0.66]];
  DEF.sparkmite = { ext: 2.05, nf: 6, faced: true, head: 0.5, modes: ['', 'block', 'dash'], foot: 0.8,
    G: model('sparkmite', q => { const out = {}, Bd = () => GLM.builder(q);
      out.shell = Bd().ell([0, 0, 0], [0.9, 0.64, 0.42], 830.4, { seg: 20, rings: 10, th0: 0, th1: Math.PI * 0.62 }).done();
      out.belly = Bd().ell([0, 0, 0], [0.82, 0.56, 0.22], 838, { seg: 16, rings: 6 }).done();
      out.frame = Bd().box([0, 0, 0], [0.32, 0.4, 0.06], 0.04, 830.3).done();
      out.cell = Bd().box([0, 0, 0], [0.26, 0.33, 0.06], 0.05, 832).done();
      out.head = Bd().ell([0, 0, 0], [0.28, 0.38, 0.24], 830.1, { seg: 14, rings: 8 }).done();
      out.prong = Bd().tube([0, 0, 0], [0.42, 0, 0], 0.04, 0.026, 838, { seg: 6 }).done();
      out.tip = Bd().sph([0, 0, 0], 0.085, 831, 10).done();
      out.thigh = Bd().tube([0, 0, 0], [0.36, 0, 0], 0.055, 0.04, 838, { seg: 6 }).done();
      out.shin = Bd().tube([0, 0, 0], [0.42, 0, 0], 0.04, 0.014, 838, { seg: 6, cap1: 'flat' }).done();
      out.zap = (() => { const B = Bd(); zap(B, [0, 0, 0], [0.34, 0.16, 0.36], 4, 0.06, 2, 831, 0.016); zap(B, [0, 0, 0], [0.3, -0.08, -0.26], 3, 0.05, 5, 831, 0.014); zap(B, [0, 0, 0], [-0.08, 0.3, 0.2], 2, 0.05, 7, 831, 0.012); return B.done(); })();
      return out; }),
    pose(ph, md) { const run = Math.sin(ph * TAU), chg = md === 'block' ? 1 : 0, dash = md === 'dash' ? 1 : 0, L = [];
      const bz = 0.62 + (dash ? -0.08 : Math.abs(Math.cos(ph * TAU)) * 0.04) + chg * 0.04, BR = ry(dash ? 0.18 : chg ? -0.1 : run * 0.03), bo = [0, 0, bz], k = chg || dash ? 1 : 0.5 + 0.3 * Math.sin(ph * TAU * 3);
      L.push(P('belly', vadd(bo, at3(BR, [0, 0, -0.12])), BR, { wear: 0.3 }), P('shell', bo, BR, { wear: 0.5, glow: k * 0.4 }));
      const cp = vadd(bo, at3(BR, [-0.08, 0, 0.42])); L.push(P('frame', vadd(cp, at3(BR, [0, 0, -0.02])), BR, { wear: 0.6 }), P('cell', cp, BR, { kind: 0, glow: 0.6 + k * 1.6, outline: false }));
      const hp = vadd(bo, at3(BR, [0.78, 0, 0.02])); L.push(P('head', hp, BR, { wear: 0.4 }));
      for (const sy of [1, -1]) { const a = vadd(hp, at3(BR, [0.12, sy * 0.13, 0.12])), R2 = mm(BR, mm(rz(sy * 0.55), ry(-0.55 - chg * 0.15))), tp = vadd(a, at3(R2, [0.42, 0, 0])); L.push(P('prong', a, R2, { wear: 0.5 }), P('tip', tp, I3(), { kind: chg ? 3 : 0, glow: 1.0 + k * 1.2, outline: false }));
        if (chg || dash) L.push(P('zap', tp, mm(BR, rz(sy * 0.6 + ph * 2.0)), { kind: 3, glow: (chg ? 1.6 : 1.1) + 0.6 * Math.sin(ph * TAU * 5), outline: false })); }
      for (const [lx, off] of MITE_LEGS) for (const sy of [1, -1]) { const hip = vadd(bo, at3(BR, [lx * 0.8, sy * 0.4, -0.1])), sw = Math.sin((ph + off + (sy > 0 ? 0 : 0.5)) * TAU);
        const foot = dash ? [lx * 0.8 - 0.45, sy * 0.78, 0.02] : [lx * 0.9 + sw * 0.14, sy * 0.82, Math.max(0, Math.cos((ph + off + (sy > 0 ? 0 : 0.5)) * TAU)) * 0.08];
        const kn = knee(hip, foot, 0.36, 0.42, vnrm([0, sy, 1.2])); L.push(bone('thigh', hip, kn, { wear: 0.3 }), bone('shin', kn, foot, { wear: 0.6 })); }
      const hz = [[cp, 0.75, VIOLET, 0.35 + k * 0.45], [vadd(hp, at3(BR, [0.4, 0, 0.4])), 0.5, VIOLET_HI, 0.2 + chg * 0.5]];
      if (chg) hz.push([vadd(hp, at3(BR, [0.6, 0, 0.55])), 0.85, '#FFFFFF', 0.45]);
      return { parts: L, halos: hz, shadow: [1.0, 0.32, 0.32] }; } };

  /* ---- the hull wing: a lumpy rose fungal body under a ridged brain lobe (its glow turning teal, violet, amber), two rose membrane
     wings beating, two crab claws below. It flies: its body high over its shadow. Faces the viewer (not faced: mirrored) ---- */
  const LOBE_K = [1, 0, 2], LOBE_HUE = [VIOLET, TEAL, AMBER];
  DEF.hullwing = { ext: 2.2, nf: 6, faced: false, yaw: Math.PI / 2 - 0.35, modes: [''], foot: 1.2,
    G: model('hullwing', q => { const out = {}, Bd = () => GLM.builder(q);
      out.body = (() => { const B = Bd(); B.ell([0, 0, 0], [0.48, 0.5, 0.6], 833, { seg: 18, rings: 10 }); [[0.3, 0.22, 0.15, 0.16], [0.28, -0.25, -0.05, 0.14], [-0.2, 0.3, -0.12, 0.15], [-0.25, -0.2, 0.2, 0.13], [0.1, 0.05, -0.4, 0.16]].forEach(([x, y, z, r]) => B.sph([x, y, z], r, 833, 8)); return B.done(); })();
      out.lobe = (() => { const B = Bd(); B.ell([0, 0, 0], [0.38, 0.46, 0.32], 833.1, { seg: 18, rings: 10 }); B.ell([0.04, 0.2, 0.06], [0.28, 0.2, 0.26], 833.1, { seg: 12, rings: 6 }); B.ell([0.04, -0.2, 0.06], [0.28, 0.2, 0.26], 833.1, { seg: 12, rings: 6 }); return B.done(); })();
      // a wing (in its own frame: the root at the origin, spanning +y (sd -1: -y), its spar along the top, the membrane hanging below it,
      // scalloped, cupped back a little): it faces the viewer as the 2D wing does
      const wing = sd => { const B = Bd(), span = 1.5, spar = u => [-0.05 - 0.12 * u * u, sd * u * span, 0.18 + Math.sin(u * Math.PI * 0.8) * 0.36 - u * u * 0.3];
        B.surf((u, v) => { const p = spar(u), ch = (0.95 - 0.5 * u) * (1 - 0.75 * u * u) * (1 - 0.12 * Math.sin(u * Math.PI * 3) * v), q = vadd(p, [-0.18 * v * (1 - u) - 0.06 * Math.sin(v * Math.PI), 0, -v * ch]); return [q[0], q[1] - sd * v * 0.12 * (1 - u), q[2]]; }, 12, 5, () => 834, { e: (u, v) => (v > 0.9 ? 1 : 0), flip: sd < 0 });
        for (let i = 0; i < 6; i++) { const u0 = i / 6, u1 = (i + 1) / 6; B.tube(spar(u0), spar(u1), 0.05 * (1 - u0 * 0.6), 0.05 * (1 - u1 * 0.6), 833.2, { seg: 6, cap0: i === 0 ? 'round' : false, cap1: i === 5 ? 'round' : false }); }
        for (const u of [0.35, 0.7]) { const a = spar(u); B.tube(a, vadd(a, [-0.08, -sd * 0.12, -(0.95 - 0.5 * u) * (1 - 0.75 * u * u) * 0.85]), 0.022, 0.01, 833.2, { seg: 5 }); }
        return B.done(); };
      out.wing = wing(1); out.wingL = wing(-1);
      out.arm = Bd().tube([0, 0, 0], [0, 0, -0.48], 0.07, 0.06, 833.2, { seg: 8 }).done();
      out.claw = (() => { const B = Bd(); B.ell([0, 0, -0.1], [0.12, 0.1, 0.16], 833.2, { seg: 10, rings: 6 }); B.spike([0.02, 0.05, -0.18], [0.14, 0.12, -0.42], 0.06, 833.2, { seg: 6 }); B.spike([0.02, -0.05, -0.18], [0.1, -0.1, -0.38], 0.05, 833.2, { seg: 6 }); return B.done(); })();
      return out; }),
    pose(ph) { const fl = Math.sin(ph * TAU * 2), bob = Math.sin(ph * TAU) * 0.15, zc = 2.05 + bob, o = [0, 0, zc], L = [], fi = Math.min(5, Math.floor(ph * 6)), hk = LOBE_K[Math.floor(ph * 3) % 3];
      L.push(P('body', o, ry(0.08), { wear: 0.4 }));
      const lp = vadd(o, [0.06, 0, 0.7]); L.push(P('lobe', lp, ry(-0.15), { kind: hk, glow: 0.32 + 0.15 * Math.sin(ph * TAU * 3), wear: 0.5 }));
      for (const sy of [1, -1]) { const root = vadd(o, [-0.12, sy * 0.36, 0.3]), fa = -0.1 - fl * 0.5; L.push(P(sy > 0 ? 'wing' : 'wingL', root, rx(sy * fa), { wear: sy > 0 ? 0.3 : 0.7, glow: 0.1 }));
        const sh = vadd(o, [0.2, sy * 0.24, -0.25]), R2 = mm(rx(-sy * 0.35), ry(-0.3 + 0.08 * Math.sin(ph * TAU + sy))), cl = vadd(sh, at3(R2, [0, 0, -0.48])); L.push(P('arm', sh, R2, { wear: 0.5 }), P('claw', cl, mm(R2, rz(sy * 0.3)), { wear: 0.4 + 0.2 * sy })); }
      const hue = LOBE_HUE[hk];
      return { parts: L, halos: [[lp, 0.78, hue, 0.5], [o, 1.2, FUNGUS, 0.1]], shadow: [0.72, 0.22, 0.2] }; } };

  /* ---- the coil sentry: a gunmetal saucer ringed with teal lights, three thruster legs glowing teal, a coil tower wound with three
     violet rings and a ball on top (white, blazing and crackling while its beam is live: 'block'). It flies ---- */
  const SENTRY_ZC = 2.25, SENTRY_BALL = 1.32;
  DEF.coilsentry = { ext: 2.4, nf: 6, faced: false, yaw: 0.4, modes: ['', 'block'], foot: 1.2,
    G: model('coilsentry', q => { const out = {}, Bd = () => GLM.builder(q);
      out.disc = (() => { const B = Bd(); B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]); B.lathe([[-0.2, 0, 830.3], [-0.19, 0.42, 830.3], [-0.1, 0.78, 830.3], [0.0, 0.86, 839], [0.08, 0.8, 839], [0.14, 0.55, 839], [0.17, 0.25, 839], [0.18, 0, 839]], 839, { seg: 22 }); B.pop();
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; B.sph([Math.cos(a) * 0.86, Math.sin(a) * 0.86, 0.0], 0.06, 831, 6); } return B.done(); })();
      out.leg = Bd().tube([0, 0, 0], [0.32, 0, -0.42], 0.06, 0.045, 838, { seg: 6 }).done();
      out.nozzle = Bd().sph([0, 0, 0], 0.085, 831, 8).done();
      out.tower = (() => { const B = Bd(); B.tube([0, 0, 0.12], [0, 0, 1.15], 0.12, 0.1, 830.3, { seg: 10 }); B.tor([0, 0, 1.15], 0.13, 0.04, 830.2, { seg: 12, rseg: 5 }); return B.done(); })();
      out.ring = Bd().tor([0, 0, 0], 0.25, 0.035, 831, { seg: 18, rseg: 5 }).done();
      out.ball = Bd().sph([0, 0, 0], 0.2, 831, 14).done();
      out.zap = (() => { const B = Bd(); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; zap(B, [Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0], [Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.12 * (i % 2 ? 1 : -1)], 3, 0.06, i + 1, 831, 0.014); } return B.done(); })();
      return out; }),
    pose(ph, md) { const on = md === 'block' ? 1 : 0, bob = Math.sin(ph * TAU) * 0.15, o = [0, 0, SENTRY_ZC + bob], L = [], tl = Math.sin(ph * TAU) * 0.05;
      const BR = mm(rx(tl), ry(-tl * 0.6));
      L.push(P('disc', o, BR, { kind: 1, glow: 0.9, wear: 0.4 }), P('tower', o, BR, { wear: 0.6 }));
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5, R2 = mm(BR, rz(a)), hip = vadd(o, at3(R2, [0.42, 0, -0.14])), nz = vadd(hip, at3(R2, [0.32, 0, -0.42])); L.push(P('leg', hip, R2, { wear: 0.5 }), P('nozzle', nz, I3(), { kind: 1, glow: 1.0 + 0.3 * Math.sin(ph * TAU * 2 + i), outline: false })); }
      for (let i = 0; i < 3; i++) { const w = 0.5 + 0.5 * Math.sin((ph * 3 - i * 0.33) * TAU); L.push(P('ring', vadd(o, at3(BR, [0, 0, 0.42 + i * 0.25])), BR, { kind: 0, glow: 0.6 + w * 0.8 + on * 0.8, outline: false })); }
      const bp = vadd(o, at3(BR, [0, 0, SENTRY_BALL])); L.push(P('ball', bp, I3(), { kind: on ? 3 : 0, glow: 1.1 + on * 1.5 + 0.2 * Math.sin(ph * TAU * 4), outline: false }));
      if (on) L.push(P('zap', bp, rz(ph * TAU), { kind: 3, glow: 1.8, outline: false }));
      const hz = [[bp, 0.62 + on * 0.5, VIOLET, 0.55 + on * 0.35]]; for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5; hz.push([vadd(o, at3(mm(BR, rz(a)), [0.74, 0, -0.58])), 0.32, TEAL, 0.5]); }
      if (on) hz.push([bp, 1.2, '#FFFFFF', 0.25]);
      return { parts: L, halos: hz, shadow: [0.7, 0.2, 0.2] }; } };

  /* ---- the charge cell (the Torn Hull's): a bevelled gunmetal canister, a dark glass window with violet current forking inside, amber
     and black stripes round its foot, a cap with two terminals. Its glow pulses ---- */
  DEF.chargecell = { ext: 1.75, nf: 4, faced: false, yaw: Math.PI / 2 - 0.5, modes: [''], foot: 0.7,
    G: model('chargecell', q => { const out = {}, Bd = () => GLM.builder(q);
      out.can = (() => { const B = Bd(); B.box([0, 0, 1.12], [0.44, 0.58, 1.02], 0.13, 830.1); B.box([0, 0, 2.2], [0.3, 0.4, 0.1], 0.05, 830.2); for (const y of [-0.2, 0.2]) B.tube([0, y, 2.28], [0, y, 2.42], 0.06, 0.06, 830.3, { seg: 8, cap1: 'flat' }); return B.done(); })();
      out.band = Bd().box([0, 0, 0.3], [0.47, 0.61, 0.13], 0.04, 837).done();
      out.frame = Bd().box([0.43, 0, 1.28], [0.035, 0.42, 0.62], 0.03, 830.3).done();
      out.win = Bd().box([0.455, 0, 1.28], [0.025, 0.34, 0.53], 0.02, 832).done();
      out.bolt = (() => { const B = Bd(); zap(B, [0.49, -0.18, 1.72], [0.49, 0.16, 0.85], 5, 0.07, 3, 831, 0.018); zap(B, [0.49, 0.05, 1.4], [0.49, 0.25, 1.05], 2, 0.05, 7, 831, 0.012); return B.done(); })();
      return out; }),
    pose(ph) { const k = 0.5 + 0.5 * Math.sin(ph * TAU * 2);
      return { parts: [P('can', [0, 0, 0], I3(), { wear: 0.5 }), P('band', [0, 0, 0], I3(), { wear: 0.6 }), P('frame', [0, 0, 0], I3(), { wear: 0.4 }), P('win', [0, 0, 0], I3(), { kind: 0, glow: 0.7 + k * 1.2, outline: false }), P('bolt', [0, 0, 0], I3(), { kind: 3, glow: 0.8 + 1.4 * k, outline: false })],
        halos: [[[0.5, 0, 1.28], 1.15, VIOLET, 0.3 + 0.3 * k], [[0, 0, 2.4], 0.4, VIOLET_HI, 0.2 + 0.2 * k]], shadow: [0.78, 0.26, 0.34] }; } };

  /* ---- the war mech: two thick jointed legs (glowing knees, splayed feet), a hexagonal hull with a teal visor slit (hot orange as it
     aims, 'block', and fires, 'fire') and a striped belly plate, missile pods on its shoulders (four tubes each, glowing amber in the
     salvo), an arm cannon on its near side (its muzzle lit as it aims) ---- */
  const HULL6 = [[-0.86, 0.12], [-0.78, 0.5], [-0.42, 0.68], [0.42, 0.68], [0.78, 0.5], [0.86, 0.12], [0.62, -0.56], [-0.62, -0.56]];
  DEF.warmech = { ext: 2.2, nf: 6, faced: true, head: 0.85, modes: ['', 'block', 'fire'], foot: 1.0,
    G: model('warmech', q => { const out = {}, Bd = () => GLM.builder(q);
      out.hull = (() => { const B = Bd(); B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], [0, 0, 0]); B.prism(HULL6.map(([y, z]) => [y, z]), -0.44, 0.44, 830.2, { b: 0.07 }); B.pop(); B.box([-0.48, 0, 0.05], [0.06, 0.6, 0.45], 0.04, 830.1); return B.done(); })();
      out.visor = Bd().box([0, 0, 0], [0.04, 0.46, 0.09], 0.025, 831).done();
      out.scan = Bd().box([0, 0, 0], [0.045, 0.12, 0.06], 0.02, 831).done();
      out.belly = Bd().box([0, 0, 0], [0.035, 0.56, 0.1], 0.02, 837).done();
      out.pod = (() => { const B = Bd(); B.box([0, 0, 0], [0.3, 0.27, 0.23], 0.06, 830.1); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) B.tube([0.22, (i - 0.5) * 0.24, (j - 0.5) * 0.2], [0.33, (i - 0.5) * 0.24, (j - 0.5) * 0.2], 0.07, 0.07, 830.3, { seg: 8, cap1: 'flat' }); return B.done(); })();
      out.podglow = (() => { const B = Bd(); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) B.sph([0.335, (i - 0.5) * 0.24, (j - 0.5) * 0.2], 0.05, 831, 8); return B.done(); })();
      out.thigh = Bd().tube([0, 0, 0], [0.72, 0, 0], 0.2, 0.16, 830.2, { seg: 12 }).done();
      out.shin = Bd().tube([0, 0, 0], [0.78, 0, 0], 0.16, 0.13, 830, { seg: 12 }).done();
      out.kneeJ = Bd().sph([0, 0, 0], 0.17, 830.3, 12).done();
      out.kneeL = Bd().tor([0, 0, 0], 0.17, 0.03, 831, { seg: 14, rseg: 4 }).done();
      out.foot = (() => { const B = Bd(); B.box([0.08, 0, 0.07], [0.32, 0.2, 0.07], 0.04, 830.1); B.box([0.3, 0, 0.05], [0.1, 0.24, 0.05], 0.03, 830.3); return B.done(); })();
      out.hip = Bd().box([0, 0, 0], [0.26, 0.7, 0.14], 0.06, 830.3).done();
      out.cannon = (() => { const B = Bd(); B.box([0.12, 0, 0], [0.3, 0.13, 0.14], 0.05, 830.1); B.tube([0.4, 0, 0], [1.0, 0, 0], 0.09, 0.08, 830.2, { seg: 10, cap1: 'flat' }); B.torX([0.62, 0, 0], 0.09, 0.025, 830.3, { seg: 10, rseg: 4 }); return B.done(); })();
      out.muzzle = Bd().sph([0, 0, 0], 0.085, 831, 10).done();
      out.shoulder = Bd().sph([0, 0, 0], 0.17, 830.3, 10).done();
      return out; }),
    pose(ph, md) { const run = Math.sin(ph * TAU), aim = md === 'block' ? 1 : 0, fire = md === 'fire' ? 1 : 0, L = [];
      const bz = 1.45 + Math.abs(Math.cos(ph * TAU)) * 0.05 * (1 - aim), lean = aim ? 0.1 : fire ? -0.08 : run * 0.02, BR = mm(rz(run * 0.04 * (1 - aim)), ry(lean)), bo = [fire ? -0.06 : 0, 0, bz];
      const ho = vadd(bo, at3(BR, [0, 0, 0.62])); L.push(P('hull', ho, BR, { wear: 0.5 }), P('hip', vadd(bo, at3(BR, [0, 0, 0])), BR, { wear: 0.4 }));
      const vk = aim || fire ? 4 : 1; L.push(P('visor', vadd(ho, at3(BR, [0.47, 0, 0.3])), BR, { kind: vk, glow: 1.0 + (aim + fire) * 0.8, outline: false }), P('scan', vadd(ho, at3(BR, [0.49, (Math.sin(ph * TAU) * 0.5) * 0.62, 0.3])), BR, { kind: aim || fire ? 3 : 1, glow: 1.6, outline: false }));
      L.push(P('belly', vadd(ho, at3(BR, [0.45, 0, -0.32])), mm(BR, ry(0.25)), { wear: 0.4 }));
      for (const sy of [1, -1]) { const pp = vadd(ho, at3(BR, [-0.05, sy * 1.0, 0.62])); L.push(P('pod', pp, BR, { wear: 0.4 + sy * 0.2 }), P('podglow', pp, BR, { kind: 2, glow: fire ? 2.2 : 0.05, outline: false })); }
      // the arm cannon on the near side (+y), level, pointing ahead; its muzzle lit as it aims
      const sh = vadd(ho, at3(BR, [0.05, 0.98, 0.2])), CR = mm(BR, ry(aim ? -0.04 : 0.02 + run * 0.03)), mz = vadd(sh, at3(CR, [1.02 - fire * 0.12, 0, 0]));
      L.push(P('shoulder', sh, BR, { wear: 0.5 }), P('cannon', vadd(sh, at3(CR, [-fire * 0.12, 0, 0])), CR, { wear: 0.5 }), P('muzzle', mz, I3(), { kind: 4, glow: aim ? 1.8 : fire ? 2.6 : 0.05, outline: false }));
      for (const sy of [1, -1]) { const sw = aim || fire ? 0 : Math.sin(ph * TAU + (sy > 0 ? 0 : Math.PI)), hip = vadd(bo, at3(BR, [0, sy * 0.46, -0.06])), foot = [sw * 0.32, sy * 0.58, Math.max(0, -Math.cos(ph * TAU + (sy > 0 ? 0 : Math.PI))) * 0.12 * (aim || fire ? 0 : 1)];
        const kn = knee(hip, foot, 0.72, 0.78, vnrm([1, sy * 0.4, 0.2])); L.push(bone('thigh', hip, kn, { wear: 0.4 }), bone('shin', kn, foot, { wear: 0.6 }), P('kneeJ', kn, BR, { wear: 0.5 }), P('kneeL', kn, mm(BR, rx(Math.PI / 2)), { kind: vk, glow: 0.9, outline: false }), P('foot', foot, rz(sy * 0.12), { wear: 0.5 })); }
      const hz = [[vadd(ho, at3(BR, [0.5, 0, 0.3])), 0.6, aim || fire ? '#FF8A3A' : TEAL, 0.5]];
      if (aim) hz.push([mz, 0.6, '#FF8A3A', 0.75]); if (fire) { hz.push([mz, 0.8, '#FFD08A', 0.6]); for (const sy of [1, -1]) hz.push([vadd(ho, at3(BR, [0.3, sy * 1.0, 0.62])), 0.5, AMBER, 0.7]); }
      return { parts: L, halos: hz, shadow: [1.15, 0.36, 0.36] }; } };

  /* ---- the mech hound: a low angular steel body on four needle legs, a bright steel blade fin down its spine edged in violet, a visor
     slit for an eye (hot orange as it crouches to pounce: 'block') ---- */
  const HOUND_BODY = [[-0.85, 0.22], [-0.6, 0.62], [0.45, 0.64], [0.95, 0.38], [1.0, 0.12], [0.55, -0.02], [-0.6, 0.0]];
  const HOUND_FIN = [[-0.55, 0.6], [-0.2, 1.3], [0.02, 0.62], [0.14, 1.02], [0.34, 0.62]];
  DEF.mechhound = { ext: 1.7, nf: 6, faced: true, head: 0.5, modes: ['', 'block'], foot: 0.84,
    G: model('mechhound', q => { const out = {}, Bd = () => GLM.builder(q);
      out.body = (() => { const B = Bd(); B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); B.prism(HOUND_BODY, -0.27, 0.27, 830.2, { b: 0.06 }); B.pop(); return B.done(); })();
      out.fin = (() => { const B = Bd(); B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0]); B.prism(HOUND_FIN, -0.04, 0.04, 836.1, { b: 0.015 }); B.pop(); B.tube([-0.5, 0, 0.68], [-0.22, 0, 1.25], 0.022, 0.012, 831, { seg: 5 }); return B.done(); })();
      out.eye = Bd().box([0, 0, 0], [0.16, 0.29, 0.035], 0.015, 831).done();
      out.thigh = Bd().tube([0, 0, 0], [0.48, 0, 0], 0.07, 0.05, 836, { seg: 7 }).done();
      out.shin = Bd().tube([0, 0, 0], [0.56, 0, 0], 0.05, 0.014, 838, { seg: 7, cap1: 'flat' }).done();
      out.joint = Bd().sph([0, 0, 0], 0.07, 830.3, 8).done();
      out.tail = Bd().spike([0, 0, 0], [-0.45, 0, 0.18], 0.06, 836.1, { seg: 6 }).done();
      return out; }),
    pose(ph, md) { const run = Math.sin(ph * TAU), cr = md === 'block' ? 1 : 0, L = [];
      const bz = 0.82 - cr * 0.2 + Math.abs(Math.cos(ph * TAU)) * 0.05 * (1 - cr), BR = ry(cr ? 0.1 : run * 0.04), bo = [0, 0, bz];
      L.push(P('body', bo, BR, { wear: 0.5 }), P('fin', bo, BR, { kind: 0, glow: 0.9 + cr * 0.6, wear: 0.4 }), P('tail', vadd(bo, at3(BR, [-0.8, 0, 0.3])), mm(BR, ry(-0.2 + run * 0.15)), { wear: 0.4 }));
      const ep = vadd(bo, at3(BR, [0.76, 0, 0.3])); L.push(P('eye', ep, mm(BR, ry(-0.45)), { kind: cr ? 4 : 0, glow: 1.4 + cr * 0.8, outline: false }));
      for (const [lx, sy, off] of [[0.55, 1, 0], [0.55, -1, 0.5], [-0.5, 1, 0.5], [-0.5, -1, 0]]) { const hip = vadd(bo, at3(BR, [lx, sy * 0.22, 0.12])), sw = Math.sin((ph * 1.5 + off) * TAU), back = lx < 0 ? 1 : -1;
        const foot = cr ? [lx * 1.05 + (lx > 0 ? 0.15 : -0.1), sy * 0.34, 0] : [lx + sw * 0.25, sy * 0.3, Math.max(0, Math.cos((ph * 1.5 + off) * TAU)) * 0.08];
        const kn = knee(hip, foot, 0.48, 0.56, vnrm([back * 0.9, sy * 0.15, 0.4])); L.push(bone('thigh', hip, kn, { wear: 0.4 }), P('joint', kn, BR, { wear: 0.5 }), bone('shin', kn, foot, { wear: 0.6 })); }
      return { parts: L, halos: [[ep, 0.45, cr ? '#FF8A3A' : VIOLET_HI, 0.6 + cr * 0.2], [vadd(bo, at3(BR, [-0.3, 0, 1.0])), 0.5, VIOLET, 0.2]], shadow: [1.0, 0.3, 0.3] }; } };

  /* ---- the engine egg: a tall leathery egg of plated hide, its crown's four seams glowing violet; cracking ('block'): amber, parting,
     shaking ---- */
  const EGG = [[0, 0], [0.03, 0.46], [0.22, 0.7], [0.6, 0.82], [1.0, 0.84], [1.45, 0.76], [1.9, 0.56], [2.2, 0.32], [2.36, 0.08], [2.38, 0]];
  DEF.mechegg = { ext: 2.0, nf: 6, faced: false, yaw: 0.3, modes: ['', 'block'], foot: 0.78,
    G: model('mechegg', q => { const out = {}, Bd = () => GLM.builder(q);
      out.egg = (() => { const B = Bd(); B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]); B.lathe(EGG.map(([z, r]) => [z, r]), 835, { seg: 24 }); B.pop(); return B.done(); })();
      out.root = (() => { const B = Bd(); B.tor([0, 0, 0.1], 0.6, 0.09, 836, { seg: 20, rseg: 6 }); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3; B.tube([Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.12], [Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0.0], 0.08, 0.04, 836, { seg: 6 }); } return B.done(); })();
      return out; }),
    pose(ph, md) { const op = md === 'block' ? 1 : 0, sh = op ? Math.sin(ph * TAU * 6) * 0.05 : 0, br = 0.35 + 0.15 * Math.sin(ph * TAU);
      return { parts: [P('egg', [sh, 0, 0], rx(sh * 0.6), { kind: 0, glow: br + op * 0.6, spill: op, wear: 0.5 }), P('root', [0, 0, 0], I3(), { wear: 0.6 })],
        halos: [[[sh, 0, 2.15], 0.95, op ? AMBER : VIOLET, op ? 0.75 : 0.22 + 0.1 * Math.sin(ph * TAU)]], shadow: [0.95, 0.3, 0.38] }; } };

  /* ---- the eggling: a round metal body, one amber eye in a dark ring, six needle legs, a curled segmented tail with a steel sting ---- */
  const TAIL = [[-0.52, 0, 0.92, 0.16], [-0.78, 0, 1.12, 0.145], [-0.92, 0, 1.4, 0.13], [-0.9, 0, 1.68, 0.115], [-0.74, 0, 1.88, 0.1]];
  DEF.eggling = { ext: 1.85, nf: 6, faced: true, head: 0.45, modes: [''], foot: 0.85,
    G: model('eggling', q => { const out = {}, Bd = () => GLM.builder(q);
      out.body = Bd().ell([0, 0, 0], [0.58, 0.5, 0.42], 830.2, { seg: 18, rings: 10 }).done();
      out.eye = Bd().sph([0, 0, 0], 0.15, 831, 12).done();
      out.ring = Bd().tor([0, 0, 0], 0.17, 0.045, 830.3, { seg: 14, rseg: 5 }).done();
      out.thigh = Bd().tube([0, 0, 0], [0.36, 0, 0], 0.045, 0.032, 838, { seg: 6 }).done();
      out.shin = Bd().tube([0, 0, 0], [0.42, 0, 0], 0.032, 0.01, 838, { seg: 6, cap1: 'flat' }).done();
      out.tail = (() => { const B = Bd(); TAIL.forEach(([x, y, z, r]) => B.sph([x, y, z], r, 830.1, 10)); B.spike([-0.74, 0, 1.88], [-0.48, 0, 1.98], 0.07, 836.1, { seg: 6 }); return B.done(); })();
      return out; }),
    pose(ph) { const run = Math.sin(ph * TAU * 2), bz = 0.72 + Math.abs(Math.cos(ph * TAU * 2)) * 0.05, BR = ry(run * 0.05), bo = [0, 0, bz], L = [];
      L.push(P('body', bo, BR, { wear: 0.5 }), P('tail', vadd(bo, [0, 0, -0.72]), mm(BR, ry(run * 0.06)), { wear: 0.4 }));
      const ep = vadd(bo, at3(BR, [0.5, 0, 0.12])); L.push(P('ring', ep, mm(BR, ry(Math.PI / 2 - 0.25)), { wear: 0.5 }), P('eye', vadd(ep, at3(BR, [0.02, 0, 0])), I3(), { kind: 2, glow: 1.3 + 0.2 * Math.sin(ph * TAU * 3), outline: false }));
      for (let i = 0; i < 3; i++) for (const sy of [1, -1]) { const lx = (i - 1) * 0.34, hip = vadd(bo, at3(BR, [lx, sy * 0.34, -0.12])), off = i * 0.33 + (sy > 0 ? 0 : 0.5), sw = Math.sin((ph * 2 + off) * TAU);
        const foot = [lx * 1.25 + sw * 0.14, sy * 0.78, Math.max(0, Math.cos((ph * 2 + off) * TAU)) * 0.07], kn = knee(hip, foot, 0.36, 0.42, vnrm([0, sy, 1.3])); L.push(bone('thigh', hip, kn, { wear: 0.3 }), bone('shin', kn, foot, { wear: 0.6 })); }
      return { parts: L, halos: [[ep, 0.5, AMBER, 0.6]], shadow: [0.9, 0.28, 0.3] }; } };
  const TYPES = Object.keys(DEF);

  /* ======================= baking a sprite frame ======================= */
  let CUR_BIO = null, ACT = null, ACTT = -1e9;
  const gameDbg = () => { try { const D = typeof arc !== 'undefined' && arc && arc.game && arc.game._dbg; return D || null; } catch (e) { return null; } };
  const gameBio = () => { const D = gameDbg(); try { return D && D.F ? D.F.biome : null; } catch (e) { return null; } };
  const bio = () => CUR_BIO || gameBio() || 'wreckfield';
  function active() { const t = nowMs(); if (t - ACTT < 250 && ACT != null) return ACT; ACTT = t; const b = CUR_BIO || gameBio(); ACT = (!b || !!LANDS[b]) && glBase(); return ACT; }
  const ST = { baked: 0, ms: 0, prov: 0, over: {}, lazy: 0, fx: { passes: 0, quads: 0, shots: 0, tells: 0, beams: 0, dashes: 0, spores: 0, bursts: 0, ms: 0 }, mini: 0 };
  const BW = { t: -1e9, n: 0, ms: 0 }, PROV = [];
  const playing = () => typeof arc !== 'undefined' && arc && arc.state === 'play';
  function budget() { const t = nowMs(); if (t - BW.t > 14) { BW.t = t; BW.n = 0; BW.ms = 0; flushProv(); } return !playing() || win('__YUB_NOBUDGET') === 1 || (BW.n < 2 && BW.ms < 4); }
  let PRAF = 0;
  function provTick() { if (PRAF || typeof requestAnimationFrame !== 'function') return; const f = () => { PRAF = 0; if (!PROV.length) return; if (nowMs() - BW.t > 14) { BW.t = nowMs(); BW.n = 0; BW.ms = 0; flushProv(); } if (PROV.length) PRAF = requestAnimationFrame(f); }; PRAF = requestAnimationFrame(f); }
  function flushProv() { const MC = DunArt.monCache; for (let i = 0; i < 2 && PROV.length; i++) { const k = PROV.shift(); if (MC) { MC.delete(k); MC.delete(k + '|f'); } } }
  /* (20b's drawMon asks DunArt.FACED whether a type has its own left-facing frames; taken over on first use, its answer kept for every
     type not ours) */
  function ensureFaced() { const f0 = DunArt.FACED; if (f0 && f0.__yub) return; const f = t => { const D = DEF[t]; if (D) return !!(D.faced && active()); return !!(f0 && f0(t)); }; f.__yub = 1; DunArt.FACED = f; }
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
      ok = glPass(c, V, Ps.parts, { light: LANDS[bio()] ? bio() : 'wreckfield', t: ph * 10, res: lowFx() ? 0.8 : 1, outline: 1.1 }, D.G);
      if (ok) { halos(c, V, Ps.halos); const half = c.canvas ? c.canvas.width / 2 : 0, b = D.G.box; if (half && b) { const ov = Math.max(-b[0], b[2], -b[1], b[3]) / half; if (ov > (ST.over[type] || 0)) ST.over[type] = +ov.toFixed(2); } }
    } catch (e) { failed(); if (typeof console !== 'undefined') console.warn('YUG_BROOD bake ' + type, e); ok = false; }
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
    const n0 = NF[t] || 4; ORIG[t].n0 = n0; if (DEF[t].nf && DEF[t].nf !== n0) { try { Object.defineProperty(NF, t, { get: () => (active() ? DEF[t].nf : ORIG[t].n0), set: v => { ORIG[t].n0 = v; }, configurable: true, enumerable: true }); } catch (e) { NF[t] = DEF[t].nf; } } }
  ensureFaced();

  /* ======================= their attacks on the GPU (FGFX kinds 590..596, added light) ======================= */
  const FGX = () => { try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const fxOn = () => win('__YUB_FX') !== 0 && win('__DUN_GL') !== 0 && !!FGX();
  /* each land's colours for them */
  const PAL = { wreckfield: { volt: '#C060FF', hot: '#FFAA3A', cool: '#3FE0C8', spore: '#F07AC0' }, coolant: { volt: '#B47CFF', hot: '#FFB23F', cool: '#5FF0DA', spore: '#F088C8' }, engineheart: { volt: '#D070FF', hot: '#FFB850', cool: '#58E8D0', spore: '#FF86C4' } };
  const pal = () => PAL[bio()] || PAL.wreckfield;
  const hexRGB0 = h => { const s = String(h || '').replace('#', ''); if (s.length < 6) return [255, 255, 255]; return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; };
  const KNOWN = { [VIOLET]: 'volt', [VIOLET_HI]: 'volt', [AMBER]: 'hot', [TEAL]: 'cool', [TEAL_HI]: 'cool', [FUNGUS]: 'spore', '#FF5A4A': 'hot', '#FF4D6D': 'volt' };
  function tellKey(c0) { const k = KNOWN[String(c0 || '').toUpperCase()] || KNOWN[c0]; if (k) return k; const [r, g, b] = hexRGB0(c0); if (g > r && g >= b - 10) return 'cool'; if (r > 200 && g > 130 && b < 120) return 'hot'; if (r > 200 && b > 130 && g < 170) return r > b + 20 ? 'spore' : 'volt'; return 'volt'; }
  const tellCol = c0 => pal()[tellKey(c0)];
  /* what the AI makes, tagged: a shot gets its painter, a tell its 'drawn' hook (the engine leaves it to this layer while the layer
     paints), the red ones made violet or amber for the 2D too (no red circles) */
  const LAY = { g: null, ft: -1e9, zones: null, tells: [], spores: [], bursts: [], dash: new Map(), seen: new WeakSet() };
  const DRAWN = () => !!LAY.g && Math.abs(LAY.ft - LAY.g.t) < 0.3;
  const SHOT = { coilsentry: 'bolt' };
  function paintShot(Q, X, Y, r, T, b) { const p = pal(); ST.fx.shots++; const R = r * 2.6; Q.quad(594, X, Y, R, 0, 0, R, p.volt, 1, 0, (b.ymSd = b.ymSd || Math.random() * 40)); return true; }
  function tagZone(z, t) { if (!z || LAY.seen.has(z)) return; LAY.seen.add(z);
    if (z.kind === 'warn' && z.own !== 'pet' && !z.drawn) { z.drawn = DRAWN; if (!z.color || z.color === '#FF4D6D') z.color = VIOLET_HI; else if (z.color === '#FF5A4A') z.color = AMBER; z.ymSd = Math.random() * 40; LAY.tells.push(z);
      if (t === 'hullwing' && typeof z.fn === 'function') { const f0 = z.fn; z.fn = function () { const Z = LAY.zones, n0 = Z ? Z.length : 0; const r = f0.apply(this, arguments); try { if (Z) for (let i = n0; i < Z.length; i++) { const q = Z[i]; if (q && q.kind === 'poison' && !q.ymSpore) { q.ymSpore = 1; q.ymSd = Math.random() * 40; LAY.spores.push(q); if (fxOn()) q.kind = 'yugspore'; } } } catch (e) { /* (only the picture) */ } return r; }; } } }
  function tagNew(t, m, X, E, ne, Z, nz) {
    if (E && E.length > ne) for (let i = ne; i < E.length; i++) { const b = E[i]; if (!b || b.paint || b.mine || b.ymk) continue; const k = SHOT[t]; if (!k) continue; b.ymk = k; b.paint = paintShot; }
    if (Z) { LAY.zones = Z; if (Z.length > nz) for (let i = nz; i < Z.length; i++) tagZone(Z[i], t); }
  }
  const burst = (x, y, R, col, max) => { if (LAY.bursts.length < 24) LAY.bursts.push({ x, y, R, col, t: 0, max: max || 0.55, sd: Math.random() * 40 }); };
  { const { mon, boss } = DunAI;
    const wrapAI = (tab, t) => { const f0 = tab[t]; if (typeof f0 !== 'function' || f0.__yub) return;
      const w = function (m, A, X) { const E = X && X.eshots, Z = X && X.zones, ne = E ? E.length : 0, nz = Z ? Z.length : 0, h0 = !!m.hop;
        const r = f0.apply(this, arguments);
        try { tagNew(t, m, X, E, ne, Z, nz);
          if ((t === 'mechhound' || t === 'eggling') && h0 && !m.hop) burst(m.x, m.y, t === 'mechhound' ? 1.5 : 0.9, 'volt', 0.5); } catch (e) { /* (only the pictures) */ }
        return r; };
      w.__yub = 1; w.toString = () => String(f0); tab[t] = w; };
    for (const t of ['sparkmite', 'hullwing', 'coilsentry', 'warmech', 'mechhound', 'eggling', 'mechegg']) wrapAI(mon, t);
    for (const t of ['arcpet', 'coolpet', 'corepet']) wrapAI(boss, t); }
  try { const C0 = MON.mechegg, d0 = C0 && C0.onDeath; if (C0 && d0) C0.onDeath = function (m) { try { burst(m.x, m.y - 0.2, 2.2, 'hot', 0.7); } catch (e) { /* */ } return d0.apply(this, arguments); }; } catch (e) { /* (no egg) */ }
  /* the layer: one GPU pass under the monsters, only while something shows */
  const SENTRY_UP = DEF.coilsentry.foot - (SENTRY_ZC + SENTRY_BALL) * ZK;   // (the sentry's ball above its spot, in its radii on screen)
  function fxLayer(X) {
    LAY.g = X.g; LAY.ft = -1e9; LAY.tells.length = 0; LAY.spores.length = 0; LAY.bursts.length = 0; LAY.dash.clear(); LAY.zones = null;
    const live = z => z.life > 0 && (!LAY.zones || LAY.zones.indexOf(z) >= 0);
    return {
      update(dt) { const on = fxOn(); try { trim(); } catch (e) { /* */ }
        for (let i = LAY.tells.length - 1; i >= 0; i--) { const z = LAY.tells[i]; if (live(z)) continue; LAY.tells.splice(i, 1);
          // (its strike: the same shape flaring out where it was)
          if (on && LAY.bursts.length < 24) LAY.bursts.push({ strike: z.shape || 'ring', x: z.x, y: z.y, a: z.a || 0, len: z.len || 0, w: z.w || 0, spread: z.spread || 0, R: z.r || 1, col: tellCol(z.color), t: 0, max: 0.35, sd: z.ymSd || 0 }); }
        for (let i = LAY.spores.length - 1; i >= 0; i--) { const z = LAY.spores[i]; if (!live(z)) { LAY.spores.splice(i, 1); continue; } z.kind = on ? 'yugspore' : 'poison'; }
        for (let i = LAY.bursts.length - 1; i >= 0; i--) { const b = LAY.bursts[i]; b.t += dt; if (b.t >= b.max) LAY.bursts.splice(i, 1); }
        // (a spark mite's dash: where it set off, for its streak)
        for (const m of X.mons) { if (m.type !== 'sparkmite') continue; const D = LAY.dash.get(m); if (!m.dead && m.dashT > 0) { if (!D) LAY.dash.set(m, { x: m.x, y: m.y, t: 0 }); else D.t = 0; } else if (D) { D.t += dt; if (D.t > 0.25 || m.dead) LAY.dash.delete(m); else { D.ex = D.ex == null ? m.x : D.ex; D.ey = D.ey == null ? m.y : D.ey; } } } },
      drawGround(c) { if (!fxOn()) return; const g = X.g, tq = nowMs(); LAY.ft = g.t;
        const links = []; for (const m of X.mons) { const L0 = m.link; if (m.dead || !L0 || !L0.to || L0.to.dead || m.type !== 'coilsentry') continue; if (L0.t < L0.max - 0.8) links.push(m); }
        if (!LAY.tells.length && !LAY.spores.length && !LAY.bursts.length && !links.length && !LAY.dash.size) return;
        const F = FGX(); if (!F) return; let Q = null; try { Q = F.begin(c, null); } catch (e) { Q = null; } if (!Q) return;
        const T = X.Tz(), p = pal(), n0 = (Q.nl || 0) + (Q.ns || 0);
        const beam = (ax, ay, bx, by, w, col, s, sd) => { const dx = (bx - ax) / 2, dy = (by - ay) / 2, l = Math.hypot(dx, dy) || 1; Q.quad(593, ax + dx, ay + dy, dx, dy, -dy / l * w, dx / l * w, col, 1, s, sd, l * 2 / Math.max(4, w * 2)); };
        try {
          for (const z of LAY.spores) { const s = Math.max(0, Math.min(1, z.life / 0.6, (z.max - z.life) / 0.3)), R = z.r * T * 1.12; Q.quad(596, X.sx(z.x), X.sy(z.y), R, 0, 0, R * 0.78, p.spore, 0.9, s, z.ymSd || 0); ST.fx.spores++; }
          for (const z of LAY.tells) { const u = z.max ? Math.max(0, Math.min(1, 1 - z.life / z.max)) : 0.5, col = tellCol(z.color), Xs = X.sx(z.x), Ys = X.sy(z.y); ST.fx.tells++;
            if (z.shape === 'line') { const dx = Math.cos(z.a), dy = Math.sin(z.a), L2 = z.len * T / 2, W2 = Math.max(0.5, z.w) * T * 0.62; Q.quad(590, Xs + dx * L2, Ys + dy * L2, dx * L2, dy * L2, -dy * W2, dx * W2, col, 1, u, z.ymSd, z.len / Math.max(0.3, z.w)); }
            else if (z.shape === 'cone') { const R = z.len * T * 1.06; Q.quad(592, Xs, Ys, R, 0, 0, R, col, 1, u, z.a, z.spread); }
            else { const R = z.r * T * 1.1; Q.quad(591, Xs, Ys, R, 0, 0, R, col, 1, u, z.ymSd); } }
          for (const m of links) { const q = m.link.to, rr = m.r * T, ax = X.sx(m.x), ay = X.sy(m.y) - (m.z || 0) * T + SENTRY_UP * rr, bx = X.sx(q.x), by = X.sy(q.y) - ((q.z || 0) + (q.r || 0.5) * 0.9) * T;
            beam(ax, ay, bx, by, T * 0.34, p.volt, 1, m.x * 3.1 + q.y); ST.fx.beams++; }
          for (const [m, D] of LAY.dash) { const ex = D.ex != null ? D.ex : m.x, ey = D.ey != null ? D.ey : m.y, s = D.ex != null ? Math.max(0, 1 - D.t / 0.25) : 1; if (Math.hypot(ex - D.x, ey - D.y) < 0.3) continue;
            beam(X.sx(D.x), X.sy(D.y) - T * 0.25, X.sx(ex), X.sy(ey) - T * 0.25, T * 0.28, p.volt, 0.9 * s, D.x * 7.3); ST.fx.dashes++; }
          for (const b of LAY.bursts) { const k = Math.min(1, b.t / b.max), Xs = X.sx(b.x), Ys = X.sy(b.y); ST.fx.bursts++;
            if (b.strike === 'line') { const dx = Math.cos(b.a), dy = Math.sin(b.a), L2 = b.len * T / 2, W2 = Math.max(0.5, b.w) * T * 0.62; Q.quad(590, Xs + dx * L2, Ys + dy * L2, dx * L2, dy * L2, -dy * W2, dx * W2, b.col, 1, 1 + k, b.sd, b.len / Math.max(0.3, b.w)); }
            else if (b.strike === 'cone') { const R = b.len * T * 1.06; Q.quad(592, Xs, Ys, R, 0, 0, R, b.col, 1, 1 + k, b.a, b.spread); }
            else if (b.strike) { const R = b.R * T * 1.1; Q.quad(591, Xs, Ys, R, 0, 0, R, b.col, 1, 1 + k, b.sd); }
            else { const R = b.R * T; Q.quad(595, Xs, Ys, R, 0, 0, R * 0.75, p[b.col] || b.col, 1, k, b.sd); } }
        } catch (e) { /* (the pass still closes) */ }
        ST.fx.quads += Math.round(((Q.nl || 0) + (Q.ns || 0) - n0) / 6); ST.fx.passes++;
        try { F.flush(c); } catch (e) { /* */ } ST.fx.ms += nowMs() - tq; } };
  }
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.yuggoth; if (Rf) { const es0 = Rf.everyStage;
    Rf.everyStage = function (X, self2, H) { const a = (typeof es0 === 'function' ? es0.apply(this, arguments) : null) || {}; let L = null; try { L = fxLayer(X); } catch (e) { L = null; } if (!L) return a;
      return Object.assign({}, a, { update(dt) { if (a.update) a.update(dt); L.update(dt); },
        // (the sentries' beams are this layer's while it paints: the 2D line under them held back for that call)
        drawGround(c) { if (a.drawGround) { const held = []; if (fxOn()) for (const m of X.mons) if (m.link && m.type === 'coilsentry') { held.push([m, m.link]); m.link = null; } try { a.drawGround(c); } finally { for (const [m, l] of held) m.link = l; } } L.drawGround(c); },
        drawOver(c) { if (a.drawOver) a.drawOver(c); } }); }; } } catch (e) { /* (no rift) */ }

  /* ======================= the mini bosses: giant evil Cocopets, themed for the Engine ======================= *
     (v469/v470's way, 20s7 / 20s6f): riftFight (20m) takes the mini's look from Rf.miniEvil instead of a random Rift-touched mecha,
     and its stage arms it as the far gate's guardian (EVIL_MINI.arm, keep: its own moves (20u6), health and blows), drawn, woken and
     felled by EVIL_MINI's layer on the GPU (PetGL, its poses baked: v471). Grown from the rift's mecha form (RiftEvil.form, mecha:
     gunmetal plating colours, a neon accent, glowing eyes, horns), armoured. Arc: a gunmetal coat with violet current, crystal horns
     and tail; Coolant: a deep teal coat, fin ears and a fish tail; Overload: a flesh-and-iron coat with amber, ram horns, flame arms and
     tail. */
  const MINI_LOOK = {
    arcpet: { name: 'Arc the Live Wire', short: 'Arc', el: 'crystal', seed: 6113, acc: VIOLET_HI, sub: 'A Rift-touched Cocopet holds the torn hull', hint: { horns: 'crystal', tail: 'crystal', armor: true },
      palette: { tint: '#2A2F3E', tintK: 0.78, pal: { sec: VIOLET_HI, cheek: '#2A1A40' }, col: VIOLET_HI, glow: VIOLET, core: '#FFFFFF' } },
    coolpet: { name: 'Coolant the Cold Seep', short: 'Coolant', el: 'water', seed: 6247, acc: TEAL_HI, sub: 'A Rift-touched Cocopet keeps the coolant vaults', hint: { ears: 'fin', tail: 'fish', armor: true },
      palette: { tint: '#1C3A40', tintK: 0.8, pal: { sec: TEAL_HI, cheek: '#123A36' }, col: TEAL_HI, glow: TEAL, core: '#E8FFFB' } },
    corepet: { name: 'Overload the Burning Core', short: 'Overload', el: 'fire', seed: 6389, acc: AMBER, sub: 'A Rift-touched Cocopet guards the engine heart', hint: { horns: 'ram', arms: 'flame', tail: 'flame', armor: true },
      palette: { tint: '#5A2A4E', tintK: 0.74, pal: { sec: AMBER, cheek: '#4A2018' }, col: '#FFD08A', glow: AMBER, core: '#FFF4E0' } } };
  const EMI = () => { try { return (typeof self !== 'undefined' && self.EVIL_MINI) || null; } catch (e) { return null; } };
  const SPECS = {};
  function miniSpec(id, B) { if (SPECS[id]) return SPECS[id]; const E = EMI(), L = MINI_LOOK[id]; if (!E || !E.specOf || !L) return null;
    let form = null; try { form = typeof RiftEvil !== 'undefined' && RiftEvil.form ? RiftEvil.form(L.seed, { mecha: true, acc: L.acc }).form : null; if (form) form.seed = L.seed; } catch (e) { form = null; }
    return (SPECS[id] = E.specOf(Object.assign({}, L, { form, hp: (B && B.hp) || 1, dmg: (B && B.dmg) || 1, r: (B && B.r) || 1.3, spd: (B && B.spd) || 1.8 }))); }
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.yuggoth; if (Rf) {
    const me0 = Rf.miniEvil; Rf.miniEvil = id => { if (MINI_LOOK[id]) { try { const E = EMI(), d = miniSpec(id, BOSSES.find(b => b.id === id)); if (E && d) return E.evilOf(d); } catch (e) { /* (a random one) */ } } return me0 ? me0(id) : null; };
    for (const S of Rf.stages) { if (S.kind !== 'fight' || !MINI_LOOK[S.mini] || S.__yubArm) continue; S.__yubArm = 1; const ex0 = S.extra;
      S.extra = (X, self2, H) => { const xm = (ex0 ? ex0(X, self2, H) : null) || {}, E = EMI(); if (!E || !E.arm || !E.layer) return xm;
        const m = X.mons.find(q => q && q.boss && q.lesser && !q.dead && q.bk && q.bk.id === S.mini && !q.calMini), d = m && miniSpec(S.mini, m.bk); if (!m || !d) return xm;
        let gm = null; try { E.arm(X, m, Object.assign({}, d, { r: m.evK ? m.r / m.evK : m.r }), { keep: true, home: { x: m.x, y: m.y }, sub: d.sub || MINI_LOOK[S.mini].sub, wakeR: 9.5 }); m.bname = d.name; gm = E.layer(X); ST.mini++; } catch (e) { if (typeof console !== 'undefined') console.warn('YUG_BROOD mini', e); return xm; }
        return Object.assign({}, xm, { update(dt) { if (xm.update) xm.update(dt); gm.update(dt); }, drawGround(c) { if (xm.drawGround) xm.drawGround(c); gm.drawGround(c); }, drawOver(c) { if (xm.drawOver) xm.drawOver(c); gm.drawOver(c); } }); }; } } } catch (e) { /* (no rift) */ }

  /* ======================= warming on the loading screen, and letting go ======================= */
  const KEEP = new Set(TYPES);
  const BOSS_TYPES = { khaal: ['sparkmite', 'hullwing', 'coilsentry', 'chargecell'], ixvorra: ['sparkmite', 'coilsentry'], nyarzhul: ['sparkmite', 'coilsentry', 'hullwing'] };
  function preload(Pp) {
    try { CUR_BIO = Pp && Pp.F && Pp.F.biome || null; ACTT = -1e9; } catch (e) { CUR_BIO = null; }
    if (!active()) return [];
    ensureFaced();
    const want = new Map(), add = (t, rpx, col) => { if (!DEF[t] || !(rpx > 0) || !MON[t]) return; const key = t + '|' + Math.max(4, Math.round(rpx)) + '|' + (col || MON[t].color); if (!want.has(key)) want.set(key, [t, rpx, col || MON[t].color]); };
    for (const m of (Pp.mons || []).concat(Pp.reserve || [])) if (m && !m.dead && !m.boss && !m.fiend && DEF[m.type]) add(m.type, m.r * Pp.T * Pp.k, m.color);
    const S = Pp.S, more = S ? (S.kind === 'boss' ? BOSS_TYPES[S.boss] || [] : S.kind === 'fight' ? [] : ['sparkmite', 'hullwing', 'coilsentry']) : [];
    if ((Pp.mons || []).some(m => m && m.type === 'mechegg')) more.push('eggling');
    for (const t of more) add(t, Pp.monPx(t));
    const jobs = [];
    jobs.push(() => { for (const t of new Set([...want.values()].map(w => w[0]))) DEF[t].G.on(); });
    for (const [t, rpx, col] of want.values()) { const D = DEF[t], nf = D.nf || 4; for (const md of D.modes) for (const lf of D.faced ? [false, true] : [false]) jobs.push(() => { for (let f = 0; f < nf; f++) DunArt.monSprite(t, rpx, (f + 0.5) / nf, col, lf ? md + '<' : md, false); }); }
    // (the attacks' GPU kinds compiled with the rest: one quad of each, drawn off screen)
    jobs.push(() => { const F = FGX(); if (!F || typeof document === 'undefined') return; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'); let Q = null; try { Q = F.begin(x, null); } catch (e) { Q = null; } if (!Q) return; for (let k = 590; k <= 596; k++) Q.quad(k, 32, 32, 20, 0, 0, 20, '#C060FF', 0.6, 0.5, 1, 2); try { F.flush(x); } catch (e) { /* */ } });
    return jobs;
  }
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.yuggoth; if (Rf) { const p0 = Rf.preload; Rf.preload = function (Pp) { let a = null; if (typeof p0 === 'function') { try { a = p0.apply(this, arguments); } catch (e) { a = null; } } let b = []; try { b = preload(Pp); } catch (e) { b = []; } return (Array.isArray(a) ? a : []).concat(b); }; } } catch (e) { /* (no rift) */ }
  function mem() { const MC = DunArt.monCache, by = {}; let px = 0, n = 0; if (MC) for (const [k, s] of MC) { const t = k.slice(0, k.indexOf('|')); if (!KEEP.has(t) || !s || !s.cv) continue; const p = s.cv.width * s.cv.height; px += p; n++; by[t] = (by[t] || 0) + p; }
    const MB = {}; for (const t in by) MB[t] = +(by[t] * 4 / 1048576).toFixed(2); return { n, px, MB: +(px * 4 / 1048576).toFixed(2), by: MB }; }
  /* (a cap on the pictures held, as AUR_BROOD's: past it the least recently used of ours are let go (rendered again when next drawn,
     within the budget). Checked once a second) */
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
    LAY.g = null; LAY.tells.length = 0; LAY.spores.length = 0; LAY.bursts.length = 0; LAY.dash.clear(); LAY.zones = null; }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(release); } catch (e) { /* (no rift hook) */ }
  try { const GD = typeof GAMES !== 'undefined' && GAMES.dungeon; if (GD && GD.create && !GD.__yubRel) { const c0 = GD.create; GD.__yubRel = 1; GD.create = function () { const api = c0.apply(this, arguments); if (api && typeof api.destroy === 'function') { const d0 = api.destroy; api.destroy = function () { try { release(); } catch (e) { /* (nothing held) */ } return d0.apply(this, arguments); }; } return api; }; } } catch (e) { /* (no dungeon) */ }
  return { DEF, MINI_LOOK, miniSpec, TYPES, LIGHT, PAL, bake, preload, release, mem, active, fxOn, get gpuBuffers() { return gpuBuffers(); },
    get stats() { return Object.assign({ prov: PROV.length, models: MODELS.map(G => ({ name: G.name, tris: G.tris, meshMs: +G.meshMs.toFixed(1), passMs: +G.ms.toFixed(2), n: G.n })), released: REL_N, trimmed: TRIMMED, bio: bio(), tells: LAY.tells.length, spores: LAY.spores.length, bursts: LAY.bursts.length, dashes: LAY.dash.size }, ST); },
    get bio() { return bio(); }, set bio(v) { CUR_BIO = v; ACTT = -1e9; }, env: () => ({ DunArt, MON, BIOMES }) };
})();
if (typeof window !== 'undefined') window.YUG_BROOD = YUG_BROOD;
