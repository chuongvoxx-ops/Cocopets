/* ---------- THE PALE INTELLECT, Superfiend of the Unspoken Dream ----------
   A colossal floating brain: two hemispheres pressed together along a glowing violet fissure, deep broad folds on a
   pearl-lavender skin that darkens to plum in the grooves, a moist porcelain sheen. Eight long smooth nerves hang from
   its underside with light running down them to the tips, and under it a small black opening ringed with petal folds
   turns slowly to find you. It floats in a round chamber hung inside an impossible cathedral; six obelisks stand round
   the floor, and beyond the edge the vault bends inward toward one vast, unmoving pupil. Its horror is that it
   understands you; its fight teaches rules that never lie, so its deceptions stay fair.
   I, the Listening Mind: Nerve Lash (light runs down two raised nerves, then they slam along marked lanes), Intrusive
   Thought (a mark follows you, locks, and erupts), Cerebral Tide (a ring rolls out with a wide gap, shown as it forms).
   Thought Conductor: two obelisks light; bait its thoughts onto them; each charged obelisk tethers to it, and the second
   closes the circuit: it is stunned, its hemispheres part, and the core shows.
   II, the Divided Dream: two brains, one a lie. The real one's attacks pool solid shadows and send bright pulses down its
   nerves; the false one's have broken outlines, no shadow, a hollow sound, and do no harm. False Awakening, Recurring
   Thought (a broken mark mends over seconds, then erupts again), Neural Stitch (nerves pinned to the floor make walls;
   one link flickers and opens), Twin Tides (both minds roll out a tide at once: the lie's ring is broken and its false
   gap opens where you stand; the real one's narrower gap lies well aside), Racing Thoughts (marks rush along your
   way: solid ones where you stand, the lie's broken ones where you run). Sever the Delusion: of three lit obelisks, find
   the one the real brain feeds; touch it, and the lie collapses and the real brain falls within reach. The wrong one
   only flares.
   III, the Mind That Dreams You: the cathedral is gone; a pale sky full of vast eyes slowly closing. Its fissure burns
   white, its nerves rise round it like the legs of an upturned spider. Premonition (three patterns shown, then struck in
   order), Unwanted Memory (a ghost walks back along the path you took), The Watching Sky (the eyes overhead open wide;
   three gazes drift after you, and one that holds you long enough fixes and strikes), Synaptic Collapse (alternate
   sectors struck, then the rest). The Unspoken Name: at the last it begins a long cast, four obelisks rising, each tied to two nerves;
   bait its eruptions onto them, and each one broken quiets it (fewer nerves, fewer eyes, its voice in pieces). Break all
   four and the core is bare for the end; let the cast finish and a wave sweeps everything. Beaten, its nerves curl in
   and it shrinks to a pearl of light; for a moment your shadow stays facing it. Then the shadow turns back. */
FIEND_DEFS.pale = (() => {
  const GK = GeoKit, TN = FiendToon, TAU = Math.PI * 2, R = 13, OR = 9.6, RR = 6.4, ZC = 5.0, Z3 = 5.5;
  const HA = 1.5, HBr = 2.75, HCr = 1.75, CX = 0.9, MK = Math.sqrt(1 - (CX / HA) * (CX / HA)), EY = HBr * MK, EZ = HCr * MK;
  const LAV = '#C9B4E6', PLUM = '#3A1840', VIO = '#B98CFF', PALE = '#F4EEFF', LILAC = '#DCC8FF', WARN = '#E87AFF', OPEN = '#B8FFE6', LIEC = '#CFE8FF';
  const { lerp, clamp01, ease } = GK, SE = GK.SE, CE = GK.CE, ALL = [0, 1, 2, 3, 4, 5, 6, 7];
  const sfx = FX => (FX.H && FX.H.sfx) || {};
  const tk = FX => (1 / FX.S.fast) * (FX.S.lv >= 3 ? 0.85 : 1);
  const chime = (FX, f, k) => { const S = sfx(FX); if (S.chime) S.chime(f, k); };
  const hollow = (FX, f) => { const S = sfx(FX); if (S.hollow) S.hollow(f); };
  const say = (FX, B, s, col) => FX.H.text(B.x, B.y - 8.4, s, col || LILAC, 13);
  const LS = (() => { const l = [-0.55, -0.82], d = Math.hypot(l[0], l[1]); return [l[0] / d, l[1] / d]; })();   // the key light, on screen
  // tests only: when on, each piece of the brain's painting is timed with the canvas flushed around it
  const PROF = { on: 0, acc: {}, t: 0, cmp: 0 };
  const pmark = (c, tag) => { if (!PROF.on) return; c.getImageData(0, 0, 1, 1); const n = performance.now(); if (tag) PROF.acc[tag] = (PROF.acc[tag] || 0) + n - PROF.t; PROF.t = n; };
  // (and the pieces of a redraw from the still picture, the brain painted as the game paints it)
  const cmark = (c, tag) => { if (!PROF.cmp) return; c.getImageData(0, 0, 1, 1); const n = performance.now(); if (tag) PROF.acc[tag] = (PROF.acc[tag] || 0) + n - PROF.t; PROF.t = n; };

  /* ---- a hemisphere: half of an ellipsoid, cut by its medial face (the plane x = 0 of its own frame, kept on the side
     x * side >= 0); the ellipsoid it is cut from sits at x = side * CX. A point on its outer surface, and the normal ---- */
  function hemiLocal(h, s, t) {
    const side = h ? 1 : -1, q = Math.sqrt(Math.max(0, 1 - s * s * 0.97)), a0 = HA * q > CX ? Math.asin(-CX / (HA * q)) : -Math.PI / 2, a = lerp(a0, Math.PI - a0, t);
    const p = [side * (CX + HA * q * Math.sin(a)), HBr * s, HCr * q * Math.cos(a)];
    return { p, n: GK.norm([(p[0] - side * CX) / (HA * HA), p[1] / (HBr * HBr), p[2] / (HCr * HCr)]) };
  }
  /* the folds: the zero lines of a band-limited noise over the outer surface (s front to back, t from the fissure over
     the side to the underside), found once by marching squares and kept as points and normals in the hemisphere's frame */
  function foldsOf(seed, h) {
    const Rn = mulberry32(seed), Wv = []; for (let i = 0; i < 10; i++) { const a = Rn() * TAU, f = 3.4 + Rn() * 3.4; Wv.push([Math.cos(a) * f, Math.sin(a) * f * 1.5, Rn() * TAU, 0.45 + Rn() * 0.7]); }
    // warped a little, so they meander like a brain's rather than ripple like water
    const F0 = (s, t) => Wv.reduce((v, [kx, ky, ph, am]) => v + am * Math.sin((kx * s + ky * t) * 4.3 + ph), 0), F = (s, t) => F0(s + 0.08 * Math.sin(t * 9 + s * 3), t + 0.06 * Math.sin(s * 10 + 1.3));
    const NX = 88, NY = 50, g = [], segs = [];
    for (let j = 0; j <= NY; j++) { g.push([]); for (let i = 0; i <= NX; i++) g[j].push(F(-1 + 2 * i / NX, j / NY)); }
    const P = (i, j) => [-1 + 2 * i / NX, j / NY], lerpP = (a, b, va, vb) => { const u = va / (va - vb); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; };
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const v = [g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i]], p = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], e = [];
      for (let k = 0; k < 4; k++) { const a = v[k], b = v[(k + 1) % 4]; if ((a > 0) !== (b > 0)) e.push(lerpP(p[k], p[(k + 1) % 4], a, b)); }
      if (e.length === 2) segs.push([e[0], e[1]]); else if (e.length === 4) { segs.push([e[0], e[1]]); segs.push([e[2], e[3]]); }
    }
    // the long grooves every brain has: one along its side, one down from its crown
    for (let k = 0; k < 24; k++) { const s0 = -0.75 + k / 24 * 1.3, s1 = s0 + 1.3 / 24; segs.push([[s0, 0.5 + Math.sin(s0 * 2) * 0.05], [s1, 0.5 + Math.sin(s1 * 2) * 0.05]]); }
    for (let k = 0; k < 12; k++) { const t0 = k / 12 * 0.48, t1 = t0 + 0.48 / 12; segs.push([[0.05 + t0 * 0.3, t0], [0.05 + t1 * 0.3, t1]]); }
    // the segments joined end to end into long grooves (each shared crossing of the grid becomes a joint), then thinned
    // of points that lie nearly in line, so each fold is one smooth stroke instead of a thousand separate dashes
    const key = p => Math.round(p[0] * 1e5) + ',' + Math.round(p[1] * 1e5), ends = new Map(), used = new Uint8Array(segs.length);
    segs.forEach((sg, i) => { for (const e of [0, 1]) { const k = key(sg[e]); if (!ends.has(k)) ends.set(k, []); ends.get(k).push(i); } });
    const other = (i, k) => { const sg = segs[i]; return key(sg[0]) === k ? sg[1] : sg[0]; };
    const walk = (chain, k) => { for (;;) { const nx = (ends.get(k) || []).find(j => !used[j]); if (nx == null) return; used[nx] = 1; const p = other(nx, k); chain.push(p); k = key(p); } };
    const chains = [];
    segs.forEach((sg, i) => { if (used[i]) return; used[i] = 1; const fw = [sg[0], sg[1]]; walk(fw, key(sg[1])); const bw = [sg[0]]; walk(bw, key(sg[0])); chains.push(bw.reverse().concat(fw.slice(1))); });
    // (a closed groove starts and ends at one point: its farthest point from there splits it first)
    const rdp = (P, tol) => { if (P.length < 3) return P; const a = P[0], b = P[P.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); let im = 0, dm = 0; for (let i = 1; i < P.length - 1; i++) { const d = L > 1e-7 ? Math.abs((P[i][0] - a[0]) * dy - (P[i][1] - a[1]) * dx) / L : Math.hypot(P[i][0] - a[0], P[i][1] - a[1]); if (d > dm) { dm = d; im = i; } } return dm > tol ? rdp(P.slice(0, im + 1), tol).slice(0, -1).concat(rdp(P.slice(im), tol)) : [a, b]; };
    // some stretches of groove hold light, the thought moving in them: chosen by a slow field, so they run in lengths
    const lit = q => Math.sin(q[0] * 4.3 + q[1] * 6.1 + h * 2) + Math.sin(q[0] * 2.1 - q[1] * 3.7 + h) > 1.15;
    return chains.map(ch => rdp(ch, 0.0035)).filter(ch => ch.length >= 2).map(ch => ch.map(q => Object.assign(hemiLocal(h, q[0], q[1]), { gl: lit(q) })));
  }
  const FOLDS = [foldsOf(71, 0), foldsOf(97, 1)];
  // points over each kept half, and round its medial face, whose outline on screen is the hemisphere's silhouette
  const HULL = [0, 1].map(h => { const side = h ? 1 : -1, P = []; for (let i = 0; i <= 14; i++) { const s = -1 + 2 * i / 14, q = Math.sqrt(Math.max(0, 1 - s * s)); for (let k = 0; k < 32; k++) { const a = k / 32 * TAU, x = side * (CX + HA * q * Math.sin(a)); if (x * side >= 0) P.push([x, HBr * s, HCr * q * Math.cos(a)]); } } for (let k = 0; k < 40; k++) { const th = k / 40 * TAU; P.push([0, EY * Math.cos(th), EZ * Math.sin(th)]); } return P; });
  const MED = Array.from({ length: 40 }, (_, k) => { const th = k / 40 * TAU; return [0, EY * Math.cos(th), EZ * Math.sin(th)]; });
  function hull(pts) {
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  }
  /* where a hemisphere's points land. In the brain's frame it is drawn apart by sp and rolled outward by ro about the
     foot of its medial face; the brain turns by Rm, scales by s and floats at z. All of it folds into screen = A p + b */
  function hemiMap(B, h, cm, T) {
    const side = h ? 1 : -1, s = B.s == null ? 1 : B.s, sp = B.sp || 0, ro = B.roll == null ? sp * 0.34 : B.roll;
    const Rm = GK.mm(GK.rz(B.yaw || 0), GK.rx(B.pitch || 0)), MH = GK.mm(Rm, GK.ry(side * ro)), piv = [0, 0, -EZ];
    const O = GK.add([0, 0, B.z], GK.mul(GK.mv(Rm, GK.add([side * sp / 2, 0, 0], piv)), s)), M2 = MH.map(v => v * s), Op = GK.sub(O, GK.mv(M2, piv));
    const A = [M2[0] * T, M2[1] * T, M2[2] * T, (M2[3] * SE - M2[6] * CE) * T, (M2[4] * SE - M2[7] * CE) * T, (M2[5] * SE - M2[8] * CE) * T], b0 = cm.X + Op[0] * T, b1 = cm.Y + (Op[1] * SE - Op[2] * CE) * T;
    const tr = v => [MH[0] * v[0] + MH[3] * v[1] + MH[6] * v[2], MH[1] * v[0] + MH[4] * v[1] + MH[7] * v[2], MH[2] * v[0] + MH[5] * v[1] + MH[8] * v[2]];
    return { side, MH, vH: tr(GK.V), lH: tr(GK.LD), P: p => [A[0] * p[0] + A[1] * p[1] + A[2] * p[2] + b0, A[3] * p[0] + A[4] * p[1] + A[5] * p[2] + b1] };
  }

  /* ---- painting the brain: B = { x, y (its anchor on the floor), z (height of its centre), s (scale), yaw, pitch, sp
     (parted), roll, fis (fissure light), white (the fissure burning white), ghost (a lie: a broken outline, no shadow),
     a (alpha), look [x, y], thinkK, tents [] } ---- */
  function drawBrain(c, P, B, T, t) {
    const s = B.s == null ? 1 : B.s, al = B.a == null ? 1 : B.a; if (al < 0.01) return null;
    const cm = GK.cam(P.sx(B.x), P.sy(B.y), T), Rm = GK.mm(GK.rz(B.yaw || 0), GK.rx(B.pitch || 0)), sp = B.sp || 0, ghost = B.ghost || 0, q = DunFiend.KIT.qq();
    const W = p => GK.add([0, 0, B.z], GK.mul(GK.mv(Rm, p), s)), Pw = p => cm.P(W(p)), pearl = clamp01((0.42 - s) / 0.34);
    c.save(); c.globalAlpha = al; pmark(c);
    // a lie glitches now and then, a shiver sideways
    if (ghost && Math.sin(t * 1.3 + B.bob * 3) > 0.95) c.translate(Math.sin(t * 61) * T * 0.3, 0);
    if (s > 0.05) {
      // the real thing lights the floor under it and throws a solid shadow there; a lie does neither
      if (!ghost) { c.save(); c.globalCompositeOperation = 'lighter'; c.translate(cm.X, cm.Y); c.scale(1, 0.5); c.globalAlpha = al * 0.32 * s; blitSized(c, glowSprite(VIO), -T * 6 * s, -T * 6 * s, T * 12 * s, T * 12 * s); c.restore(); GK.shadow(c, cm.X, cm.Y, T * 4.0 * s, T * 1.7 * s, B.z * 0.4, 0.85); } pmark(c, 'floor');
      if (B.tents) drawTents(c, P, B, cm, T, t, W, false); pmark(c, 'tentsBack');
      // the body (both halves, the fissure, the sense beneath, a lie's broken outline) is painted into a picture of its
      // own a few times a second and laid down every frame where the brain has floated to; a lie's picture is coarse
      if (PROF.on || B.live) drawBody(c, B, cm, Rm, Pw, T, t, s, sp, ghost, al, q);
      else bodyCached(c, B, cm, Rm, Pw, T, t, s, sp, ghost, al, q);
      pmark(c, 'body');
      if (sp > 0.15 || B.core) { const p = Pw([0, 0.2, -0.15]), k = Math.max(clamp01((sp - 0.15) / 0.8), B.core || 0); GK.glow(c, p[0], p[1], T * 3.6 * s * k, VIO, 0.7 * k); GK.glow(c, p[0], p[1], T * 1.4 * s * k, '#FFFFFF', 0.9 * k); c.save(); c.globalAlpha = al * k; c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(p[0], p[1], T * 0.42 * s, 0, TAU); c.fill(); c.restore(); }
      pmark(c, 'core');
      if (B.tents) drawTents(c, P, B, cm, T, t, W, true); pmark(c, 'tentsFront');
    }
    // at the very last it is only a pearl of light
    if (pearl > 0) { const p = Pw([0, 0, 0]), r = T * (0.3 + 0.35 * s); GK.glow(c, p[0], p[1], T * 3.4 * pearl, VIO, 0.55 * pearl); GK.glow(c, p[0], p[1], T * 1.4, '#FFFFFF', 0.8 * pearl); c.save(); c.globalAlpha = al * pearl; const gr = c.createRadialGradient(p[0] - r * 0.35, p[1] - r * 0.4, r * 0.1, p[0], p[1], r); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.6, '#F0E6FF'); gr.addColorStop(1, '#B8A0E0'); c.fillStyle = gr; c.beginPath(); c.arc(p[0], p[1], r, 0, TAU); c.fill(); c.restore(); }
    c.restore();
    return { cm, W, Pw };
  }
  // the body itself: the far half, the near half, the fissure between them, the sense beneath, and a lie's broken outline
  function drawBody(c, B, cm, Rm, Pw, T, t, s, sp, ghost, al, q) {
    const HM = [hemiMap(B, 0, cm, T), hemiMap(B, 1, cm, T)], near = GK.dot(GK.mv(Rm, [1, 0, 0]), GK.V) > 0 ? 1 : 0, out = [];
    [1 - near, near].forEach(h => { out[h] = drawHemi(c, B, h, HM[h], T, t, s, ghost, al, q); }); pmark(c, 'hemiRest');
    drawFissure(c, B, HM, T, t, s, sp); pmark(c, 'fissure');
    drawOrgan(c, B, Pw, T, t, s); pmark(c, 'organ');
    if (ghost) lieOutline(c, out, T, t, al);
    return HM;
  }
  /* the body's picture: redrawn twenty-four times a second for the real brain (at the screen's sharpness, up to twice) and
     twelve for a lie (at under half of it), never both in one frame; between redraws it is moved with the brain, so it
     floats as smoothly as ever. A changed zoom, size, quality or hit flash redraws it at once.
     Most of it does not change while the brain holds its shape on screen: the two halves with their folds, porcelain and
     sheen. Once its shape has held from one redraw to the next, those are painted into a still picture, and the thought
     light in each half's folds into a picture of its own, already hidden wherever something is painted over it (its
     sheen, its outline and gloss, the near half over the far one). A redraw then lays the still picture down, adds each
     half's light at its strength now, and paints only what moves: the fissure's pulse, the sense beneath, a lie's broken
     outline. It looks as it did when everything was painted each time; it costs a fraction. While its shape is changing
     (a zoom, its halves parting) the whole body is painted at each redraw, as before */
  let bodyRedrawT = -1;
  const GLOW_K = 1.15;   // (the thought light is kept at 1 / 1.15 of full, so its violet and white add up without clipping)
  function bodyCached(c, B, cm, Rm, Pw, T, t, s, sp, ghost, al, q) {
    const tr = c.getTransform ? c.getTransform() : null, dpr = Math.min(2, Math.max(1, tr ? Math.hypot(tr.a, tr.b) : 1)), k = dpr * (ghost ? 0.42 : 1), every = (ghost ? 1 / 12 : 1 / 24) * DunFiend.KIT.Q.ev;
    const C = B._bc || (B._bc = { cv: document.createElement('canvas'), t: -9 }), flash = DunFiend.KIT.Q.flash > 0 ? 1 : 0;
    const cx = cm.X, cy = cm.Y - B.z * CE * T;
    const stale = C.t < -1 || Math.abs(C.T - T) > T * 0.004 || Math.abs(C.s - s) > 0.004 || C.q !== q || C.k !== k || C.flash !== flash || t < C.t || Math.abs(C.sp - sp) > 0.25;
    const due = stale || (t - C.t >= every && bodyRedrawT !== t);
    if (due) {
      const S = B._bs || (B._bs = { w: 0 }), held = (A2) => A2.k === k && A2.q === q && Math.abs(A2.T - T) <= T * 1e-4 && Math.abs(A2.s - s) <= 1e-4 && Math.abs(A2.sp - sp) <= 1e-3;
      // its shape as it was at the last redraw, or as the still picture has it
      const still = S.w > 0 && held(S), steady = C.w > 0 && held(C);
      let ok = false;
      if (still || steady) {
        if (!still) makeStill(S, B, cm, Rm, Pw, T, t, s, sp, ghost, q, k, false);
        if (flash && !S.flOk && S.w > 0) makeStill(S, B, cm, Rm, Pw, T, t, s, sp, ghost, q, k, true);
        ok = S.w > 0 && S.w < 4096 && S.h < 4096 && compose(C, S, B, cm, Pw, T, t, s, sp, ghost, k, flash, cx, cy);
      }
      if (!ok) {
        // the picture's frame: round both halves (as they stand now) and the sense beneath, with room for outlines and glow
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const grow = p => { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; };
        [0, 1].forEach(h => { const HM = hemiMap(B, h, cm, T); for (const p of HULL[h]) grow(HM.P(p)); });
        const lk = B.look || [0, 1], o = Pw([lk[0] * 0.35, 1.0 + lk[1] * 0.25, -1.3]), rr = T * 0.75 * s * 1.2; grow([o[0] - rr, o[1] - rr]); grow([o[0] + rr, o[1] + rr]);
        const pad = T * 0.5 * s + 6; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
        const w = Math.ceil((x1 - x0) * k), h = Math.ceil((y1 - y0) * k);
        if (w > 1 && h > 1 && w < 4096 && h < 4096) {
          const g = canvasFor(C, w, h);
          g.setTransform(k, 0, 0, k, -x0 * k, -y0 * k);
          drawBody(g, B, cm, Rm, Pw, T, t, s, sp, ghost, 1, q);
          Object.assign(C, { x0, y0, w, h });
          ok = true;
        }
      }
      if (ok) { Object.assign(C, { t, T, s, q, k, flash, sp, cx, cy }); if (!stale) bodyRedrawT = t;
        // a lie's coarse picture is enlarged to the screen's sharpness once, when it is redrawn, rather than in every frame
        // it is laid down (an enlarged copy costs several plain ones)
        if (ghost) { const uw = Math.ceil(C.w * dpr / k), uh = Math.ceil(C.h * dpr / k), gu = canvasFor(C, uw, uh, 'up'); gu.imageSmoothingEnabled = true; cmark(gu); gu.drawImage(C.cv, 0, 0, C.w, C.h, 0, 0, C.w * dpr / k, C.h * dpr / k); cmark(gu, 'cUp'); Object.assign(C, { uw, uh, uk: dpr }); }
      }
    }
    if (!(C.w > 0)) { drawBody(c, B, cm, Rm, Pw, T, t, s, sp, ghost, al, q); return; }
    // laid down where the brain has floated to since
    c.save(); c.globalAlpha = al;
    if (ghost && C.up && C.uk === dpr) DunFiend.KIT.blit1(c, C.up, C.x0 + (cx - C.cx), C.y0 + (cy - C.cy), C.uk, C.uw, C.uh);
    else DunFiend.KIT.blit1(c, C.cv, C.x0 + (cx - C.cx), C.y0 + (cy - C.cy), C.k, C.w, C.h);
    c.restore();
  }
  // a kept picture's canvas, big enough (it is reused while it is not far too big), cleared, and its context
  function canvasFor(C, w, h, key) {
    const cv = C[key || 'cv'] || (C[key || 'cv'] = document.createElement('canvas'));
    if (cv.width < w || cv.height < h || cv.width > w * 1.6 || cv.height > h * 1.6) { cv.width = Math.ceil(w * 1.15); cv.height = Math.ceil(h * 1.15); }
    const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, cv.width, cv.height);
    return g;
  }
  /* the still picture of both halves (with flash: as a hit flash paints them), and for the real brain each half's
     thought light, in a frame that holds them and wherever the sense beneath can turn to */
  function makeStill(S, B, cm, Rm, Pw, T, t, s, sp, ghost, q, k, withFlash) {
    const KQ = DunFiend.KIT.Q, fl0 = KQ.flash, HM = [hemiMap(B, 0, cm, T), hemiMap(B, 1, cm, T)], near = GK.dot(GK.mv(Rm, [1, 0, 0]), GK.V) > 0 ? 1 : 0;
    if (!withFlash) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const grow = p => { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; };
      [0, 1].forEach(h => { for (const p of HULL[h]) grow(HM[h].P(p)); });
      const rr = T * 0.75 * s * 1.2; for (const lx of [-1, 1]) for (const ly of [-1, 1]) { const o = Pw([lx * 0.35, 1.0 + ly * 0.25, -1.3]); grow([o[0] - rr, o[1] - rr]); grow([o[0] + rr, o[1] + rr]); }
      const pad = T * 0.5 * s + 6; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
      const w = Math.ceil((x1 - x0) * k), h = Math.ceil((y1 - y0) * k);
      S.w = 0; S.flOk = false; if (!(w > 1 && h > 1 && w < 4096 && h < 4096)) return;
      Object.assign(S, { T, s, sp, q, k, x0, y0, w, h, cx: cm.X, cy: cm.Y - B.z * CE * T, near });
    }
    // (a flash picture made later is painted in the still picture's frame moved with the brain, so the two line up exactly)
    const g = canvasFor(S, S.w, S.h, withFlash ? 'fl' : 'cv'), keep = [{}, {}], dx = cm.X - S.cx, dy = cm.Y - B.z * CE * T - S.cy;
    g.setTransform(k, 0, 0, k, -(S.x0 + dx) * k, -(S.y0 + dy) * k);
    KQ.flash = withFlash ? 1 : 0;
    try { [1 - near, near].forEach(h => { drawHemi(g, B, h, HM[h], T, t, s, ghost, 1, q, 0, keep[h]); }); } finally { KQ.flash = fl0; }
    if (withFlash) { S.flOk = true; return; }
    S.pts = [keep[0].pts, keep[1].pts];
    if (!ghost) [0, 1].forEach(h => glowLayer(S, B, h, HM, T, s, q, k, keep, h === near ? null : near));
  }
  /* one half's thought light as it shows in the finished body: inside that half, under its sheen, its outline and its
     gloss (and its medial face), and, for the far half, under the whole near half */
  function glowLayer(S, B, h, HM, T, s, q, k, keep, over) {
    // (its picture only as big as the half it lies inside: the light never leaves it)
    const K = keep[h], pts = K.pts, bx = Math.max(0, Math.floor((K.box[0] - S.x0) * k) - 1), by = Math.max(0, Math.floor((K.box[1] - S.y0) * k) - 1), bw = Math.min(S.w, Math.ceil((K.box[2] - S.x0) * k) + 1) - bx, bh = Math.min(S.h, Math.ceil((K.box[3] - S.y0) * k) + 1) - by;
    S['gb' + h] = bw > 0 && bh > 0 ? [bx, by, bw, bh] : null; if (!S['gb' + h]) return;
    const g = canvasFor(S, bw, bh, 'gl' + h);
    g.setTransform(k, 0, 0, k, -S.x0 * k - bx, -S.y0 * k - by); g.lineCap = 'round'; g.lineJoin = 'round';
    g.save(); g.beginPath(); TN.poly(pts)(g); g.clip(); glowFolds(g, K.folds.glo, T, s, 0.6 / GLOW_K, 0.55 / GLOW_K); g.restore();
    g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1;
    if (q >= 1) { g.fillStyle = sheenOf(g, K.box); g.fillRect(K.box[0], K.box[1], K.box[2] - K.box[0], K.box[3] - K.box[1]); }
    const cover = (P, lw, fill) => { g.beginPath(); TN.poly(P)(g); if (fill) { g.fillStyle = '#000'; g.fill(); } g.lineWidth = lw; g.strokeStyle = '#000'; g.stroke(); };
    cover(pts, hemiLw(T), false); TN.spec(g, K.spec[0], K.spec[1], K.spec[2], -0.7, 0.8);
    if (K.med) cover(K.med, medLw(T), true);
    if (over != null) { const O = keep[over]; cover(O.pts, hemiLw(T), true); if (O.med) cover(O.med, medLw(T), true); }
  }
  // a redraw from the still picture: the halves laid down, their light added, then what moves painted over them
  function compose(C, S, B, cm, Pw, T, t, s, sp, ghost, k, flash, cx, cy) {
    const src = flash ? S.fl : S.cv; if (!src || !src.width) return false;
    const g = canvasFor(C, S.w, S.h), w = S.w, h = S.h; cmark(g); if (PROF.cmp) PROF.acc[ghost ? 'nLie' : 'nReal'] = (PROF.acc[ghost ? 'nLie' : 'nReal'] || 0) + 1;
    g.drawImage(src, 0, 0, w, h, 0, 0, w, h); cmark(g, 'cCopy');
    if (!ghost) { g.globalCompositeOperation = 'lighter';
      for (const hh of [0, 1]) { const think = thinkOf(B, hh, t); if (!(think > 0.02)) continue; let a = think * GLOW_K * (flash ? 0.84 : 1); const G2 = S['gl' + hh], gb = S['gb' + hh]; if (!G2 || !gb) continue; while (a > 0.002) { g.globalAlpha = Math.min(1, a); g.drawImage(G2, 0, 0, gb[2], gb[3], gb[0], gb[1], gb[2], gb[3]); a -= 1; } }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; } cmark(g, 'cGlow');
    // (the picture's frame is the still picture's, moved with the brain, so what moves lands exactly where it belongs)
    const x0 = S.x0 + (cx - S.cx), y0 = S.y0 + (cy - S.cy), HM = [hemiMap(B, 0, cm, T), hemiMap(B, 1, cm, T)];
    g.setTransform(k, 0, 0, k, -x0 * k, -y0 * k);
    drawFissure(g, B, HM, T, t, s, sp); cmark(g, 'cFissure'); drawOrgan(g, B, Pw, T, t, s); cmark(g, 'cOrgan');
    if (ghost) { g.setTransform(k, 0, 0, k, -S.x0 * k, -S.y0 * k); lieOutline(g, S.pts, T, t, 1); cmark(g, 'cOutline'); }
    Object.assign(C, { x0, y0, w, h });
    return true;
  }
  const hemiLw = T => Math.max(1.6, T * 0.075), medLw = T => Math.max(1.2, T * 0.05);
  const thinkOf = (B, h, t) => Math.max((0.5 + 0.5 * Math.sin(t * 1.7 + h * 2.1)) * 0.7, B.thinkK || 0);
  function sheenOf(g, b) { const gr = g.createLinearGradient(b[0], b[1], b[2], b[3]); gr.addColorStop(0, 'rgba(190,240,255,.16)'); gr.addColorStop(0.5, 'rgba(255,220,250,.05)'); gr.addColorStop(1, 'rgba(255,170,220,.14)'); return gr; }
  // a lie's outline, broken and flickering
  function lieOutline(c, out, T, t, al) { c.save(); c.globalAlpha = al * (0.55 + 0.3 * Math.sin(t * 17)); c.setLineDash([T * 0.5, T * 0.4]); c.lineDashOffset = -t * T * 2; c.strokeStyle = LIEC; c.lineWidth = 1.6; out.forEach(o => { if (!o) return; c.beginPath(); o.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke(); }); c.restore(); }
  /* a half of the brain. think: the strength of the thought light in its folds (left out: as it is now). keep: told the
     half's outline, frame, gloss, folds and medial face, for the still picture */
  function drawHemi(c, B, h, HM, T, t, s, ghost, al, q, think, keep) {
    const pts = hull(HULL[h].map(HM.P)); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    const w = x1 - x0, hh = y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, col = B.col || LAV, r = Math.max(w, hh) / 2, specAt = [cx - w * 0.14, cy - hh * 0.3];
    if (think == null) think = thinkOf(B, h, t);
    if (keep) Object.assign(keep, { pts, box: [x0, y0, x1, y1], spec: [specAt[0], specAt[1], r * 0.12], med: null });
    TN.shape(c, TN.poly(pts), { col, shade: GK.mixC(col, '#7A5AA6', 0.7), shade2: '#4E2E72', hi: '#F4EAFD', line: '#1E0C28', lw: hemiLw(T), r, d1: 0.1, d2: 0.22, lx: LS[0], ly: LS[1], spec: 0.8, specAt, specR: 0.12, force: true, alpha: al, glowCol: ghost ? null : '#8A4AE0', glowA: 0.32,
      inner: g => {
        pmark(g, 'shapeBands');
        if (q >= 2) { g.globalAlpha = al * 0.5; g.fillStyle = GK.pat('porcelain', 3.0 / 256 * T * s, cx, cy); g.fillRect(x0, y0, w, hh); g.globalAlpha = al; } pmark(g, 'porcelain');
        const F = drawFolds(g, h, HM, T, s, ghost, think); if (keep) keep.folds = F; pmark(g, 'folds');
        // the pearl: a cool-to-rose sheen across it
        if (q >= 1) { g.save(); g.fillStyle = sheenOf(g, [x0, y0, x1, y1]); g.fillRect(x0, y0, w, hh); g.restore(); } pmark(g, 'sheen');
      } });
    // its medial face, when the halves roll apart and it turns toward us
    const nw = [-HM.side * HM.MH[0], -HM.side * HM.MH[3], -HM.side * HM.MH[6]];
    if ((B.sp || 0) > 0.05 && GK.dot(nw, GK.V) > 0.03) { const mp = drawMedial(c, HM, T, t, s, al, B); if (keep) keep.med = mp; }
    return pts;
  }
  // the folds' lines on screen: each groove, its shaded wall, its lit lip, and the stretches that hold light
  function foldPaths(h, HM, T, s) {
    const deep = new Path2D(), dark = new Path2D(), hi = new Path2D(), glo = new Path2D(), ox = LS[0] * T * 0.08 * s, oy = LS[1] * T * 0.08 * s, v = HM.vH, l = HM.lH;
    for (const ch of FOLDS[h]) {
      let on = false, onH = false, onG = false;
      for (let i = 0; i < ch.length; i++) {
        const A = ch[i], n = A.n, vis = v[0] * n[0] + v[1] * n[1] + v[2] * n[2] >= 0.06;
        if (!vis) { on = onH = onG = false; continue; }
        const p = HM.P(A.p), x = p[0], y = p[1];
        if (on) { deep.lineTo(x, y); dark.lineTo(x + ox * 1.4, y + oy * 1.4); } else { deep.moveTo(x, y); dark.moveTo(x + ox * 1.4, y + oy * 1.4); on = true; }
        if (l[0] * n[0] + l[1] * n[1] + l[2] * n[2] > 0.1) { if (onH) hi.lineTo(x - ox, y - oy); else { hi.moveTo(x - ox, y - oy); onH = true; } } else onH = false;
        if (A.gl) { if (onG) glo.lineTo(x, y); else { glo.moveTo(x, y); onG = true; } } else onG = false;
      }
    }
    return { deep, dark, hi, glo };
  }
  function drawFolds(g, h, HM, T, s, ghost, think) {
    const F = foldPaths(h, HM, T, s);
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    // the shaded wall of each groove toward the light, the groove itself, its dark floor, and the lit lip opposite
    g.strokeStyle = 'rgba(70,30,100,.4)'; g.lineWidth = Math.max(2.4, T * 0.2 * s); g.stroke(F.dark);
    g.strokeStyle = ghost ? 'rgba(80,40,100,.5)' : 'rgba(96,52,126,.92)'; g.lineWidth = Math.max(2.2, T * 0.24 * s); g.stroke(F.deep);
    g.strokeStyle = PLUM; g.lineWidth = Math.max(1.2, T * 0.12 * s); g.stroke(F.deep);
    g.strokeStyle = '#14060E'; g.lineWidth = Math.max(0.6, T * 0.04 * s); g.stroke(F.deep);
    g.strokeStyle = 'rgba(250,240,255,.75)'; g.lineWidth = Math.max(0.7, T * 0.045 * s); g.stroke(F.hi);
    // thought moving in the deepest grooves: violet light that comes and goes
    if (!ghost && think > 0.02) glowFolds(g, F.glo, T, s, 0.6 * think, 0.55 * think);
    g.restore();
    return F;
  }
  function glowFolds(g, glo, T, s, a1, a2) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = GK.rgba(VIO, a1); g.lineWidth = Math.max(1.4, T * 0.11 * s); g.stroke(glo); g.strokeStyle = GK.rgba('#FFFFFF', a2); g.lineWidth = Math.max(0.6, T * 0.03 * s); g.stroke(glo); }
  function drawMedial(c, HM, T, t, s, al, B) {
    const pts = MED.map(HM.P), k = clamp01(((B.sp || 0) - 0.05) / 0.8);
    TN.shape(c, TN.poly(pts), { col: '#5E2E74', shade: '#3E1A52', shade2: '#260C34', hi: '#8E5EA8', line: '#14061C', lw: medLw(T), r: T * 1.8 * s, d1: 0.08, d2: 0.2, lx: LS[0], ly: LS[1], force: true, alpha: al,
      inner: g => { g.lineCap = 'round'; g.lineJoin = 'round';
        // its inner folds follow the rim, and the light of the core wells up from below
        [0.8, 0.58].forEach((f, n) => { g.beginPath(); for (let i = 2; i <= 18; i++) { const th = i / 20 * Math.PI, p = HM.P([0, EY * f * Math.cos(th), EZ * f * Math.sin(th) - EZ * 0.08 * n]); if (i > 2) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } g.strokeStyle = '#1E0828'; g.lineWidth = Math.max(1.5, T * 0.16 * s); g.stroke(); g.strokeStyle = 'rgba(200,160,230,.35)'; g.lineWidth = Math.max(0.6, T * 0.04 * s); g.stroke(); });
        const pc = HM.P([0, 0, -EZ * 0.55]), gr = g.createRadialGradient(pc[0], pc[1], 0, pc[0], pc[1], T * 2.6 * s); gr.addColorStop(0, GK.rgba(VIO, 0.75 * k)); gr.addColorStop(1, GK.rgba(VIO, 0)); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(pc[0] - T * 3 * s, pc[1] - T * 3 * s, T * 6 * s, T * 6 * s); g.globalCompositeOperation = 'source-over';
      } });
    return pts;
  }
  // the fissure: a tapering dark groove where the halves meet, violet light deep in it (white, at the last)
  function drawFissure(c, B, HM, T, t, s, sp) {
    const fade = 1 - clamp01(sp / 0.55); if (fade <= 0) return;
    const pts = []; for (let k = 0; k <= 20; k++) { const th = lerp(-0.7, 2.42, k / 20), lp = [0, EY * Math.cos(th), EZ * Math.sin(th)], a = HM[0].P(lp), b = HM[1].P(lp); pts.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); }
    const tp = u => Math.pow(Math.sin(Math.PI * clamp01(u)), 0.55), fc = GK.mixC(VIO, '#FFFFFF', B.white || 0), fk = (B.fis == null ? 0.7 : B.fis) * (0.75 + 0.25 * Math.sin(t * 3.3));
    c.save(); c.globalAlpha *= fade;
    c.beginPath(); TN.ribbon(pts, u => T * s * (0.3 + sp * 0.4) * tp(u) + 0.8)(c); c.fillStyle = '#14041A'; c.fill();
    c.globalCompositeOperation = 'lighter';
    c.beginPath(); TN.ribbon(pts, u => T * s * 0.75 * tp(u) + 0.5)(c); c.fillStyle = GK.rgba(fc, 0.22 * fk); c.fill();
    c.beginPath(); TN.ribbon(pts, u => T * s * 0.11 * tp(u) + 0.6)(c); c.fillStyle = GK.rgba(fc, 0.95 * fk); c.fill();
    c.restore();
  }
  // the sense beneath: a black opening ringed by petal folds, turned toward you, a glint deep in it
  function drawOrgan(c, B, Pw, T, t, s) {
    const lk = B.look || [0, 1], o = Pw([lk[0] * 0.35, 1.0 + lk[1] * 0.25, -1.3]), r = T * 0.75 * s, sway = Math.sin(t * 0.7) * 0.1;
    // the ring of petal folds: kept as pictures, one for each hundredth of a turn of its slow sway (each step under half a
    // pixel at its rim), laid on whole pixels; painted as it is in a hit flash, and for the tests
    if (!(PROF.on || DunFiend.KIT.Q.flash > 0) && petalRing(c, B, o, r, T, Math.round(sway * 100))) { c.save(); c.translate(o[0], o[1]); }
    else { c.save(); c.translate(o[0], o[1]); petals(c, r, T, sway); }
    const ex = lk[0] * r * 0.2, ey = lk[1] * r * 0.12; c.fillStyle = '#05020A'; c.beginPath(); c.ellipse(ex, ey, r * 0.55, r * 0.34, 0, 0, TAU); c.fill(); c.strokeStyle = '#3A1840'; c.lineWidth = 1.5; c.stroke();
    if (!B.ghost) { const gx = ex + lk[0] * r * 0.14, gy = ey + lk[1] * r * 0.08; GK.glow(c, gx, gy, r * 0.55, VIO, 0.55 + 0.25 * Math.sin(t * 2.3)); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(gx - r * 0.1, gy - r * 0.05, Math.max(1, r * 0.07), 0, TAU); c.fill(); }
    c.restore();
  }
  // the seven petal folds round the sense beneath, about its centre
  function petals(c, r, T, sway) {
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + sway, px = Math.cos(a) * r * 0.9, py = Math.sin(a) * r * 0.5; TN.shape(c, TN.ell(px, py, r * 0.62, r * 0.34, a), { col: '#9A6AB0', shade: '#6A3A80', hi: '#D8B8E8', line: '#24102E', lw: Math.max(1, T * 0.04), r: r * 0.6, d1: 0.12, d2: 0.3, force: true }); }
  }
  // the petals' picture for a step of the sway, laid with its centre at o (false: none can be made, paint them)
  function petalRing(c, B, o, r, T, key) {
    const tr = c.getTransform(), k = Math.hypot(tr.a, tr.b), q = DunFiend.KIT.qq(); if (!(k > 0.2) || tr.b || tr.c) return false;
    const P = B._pr || (B._pr = {}); if (P.r !== r || P.k !== k || P.q !== q) Object.assign(P, { r, k, q, pics: {} });
    let pic = P.pics[key];
    if (!pic) {
      const lw = Math.max(1, T * 0.04), hx = r * 1.52 + lw + 2, hy = r * 1.12 + lw + 2, w = Math.ceil(hx * 2 * k), h = Math.ceil(hy * 2 * k);
      if (w > 1024 || h > 1024) return false;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
      // (its centre on a whole pixel of the picture, so it lands on one of the screen)
      const cx = Math.round(w / 2), cy = Math.round(h / 2); g.setTransform(k, 0, 0, k, cx, cy); g.lineJoin = 'round'; g.lineCap = 'round';
      petals(g, r, T, key / 100); pic = P.pics[key] = { cv, cx, cy, w, h };
    }
    DunFiend.KIT.blit1(c, pic.cv, o[0] - pic.cx / k, o[1] - pic.cy / k, k, pic.w, pic.h);
    return true;
  }
  /* ---- the nerves: eight smooth tapering tubes from a ring round the sense beneath; each has a mode and moves its tip
     and the bend of it toward that mode's place, so they swing and trail as the brain moves ---- */
  const ROOTA = j => j / 8 * TAU + TAU / 16;
  function rootLocal(j) { const a = ROOTA(j); return [Math.cos(a) * 1.9, Math.sin(a) * 1.5 + 0.3, -HCr * 0.62]; }
  const FAN = [-15, -38, -142, -165, -118, -98, -82, -62].map(d => d * Math.PI / 180);   // where each rises to, legs up
  function tentTarget(B, N, t) {
    const j = N.j, a = ROOTA(j), ca = Math.cos(a), sa = Math.sin(a), s = B.s == null ? 1 : B.s, rl = rootLocal(j), r = [B.x + rl[0] * s, B.y + rl[1] * s * SE, B.z + rl[2] * s], A = N.arg || {}, sw = Math.sin(t * 0.8 + j * 1.7);
    switch (N.mode) {
      case 'raise': { const f = FAN[j] * 0.8 + (Math.cos(FAN[j]) > 0 ? 0.25 : -0.25), d = 4.4 * s, ty = B.y + sa * 0.8 * s, my = B.y + sa * 0.5 * s, fm = f + (Math.cos(f) > 0 ? 0.5 : -0.5);   // up and out beside it, where it can be seen
        return [[B.x + Math.cos(f) * d, ty, B.z + ((ty - B.y) - Math.sin(f) * d) / CE], [B.x + Math.cos(fm) * d * 0.7, my, B.z + ((my - B.y) - Math.sin(fm) * d * 0.7) / CE], 7]; }
      case 'slam': return [[A.x, A.y, 0.12], [lerp(r[0], A.x, 0.42), lerp(r[1], A.y, 0.42), 1.6], 24];
      case 'pin': return [[A.x, A.y, -0.3], [lerp(r[0], A.x, 0.5), lerp(r[1], A.y, 0.5), 2.8], 12];
      case 'reach': return [[A.x, A.y, A.z], [lerp(r[0], A.x, 0.5), lerp(r[1], A.y, 0.5), lerp(r[2], A.z, 0.5) + 1.4], 6];
      case 'spider': { const f = FAN[j] + 0.06 * sw, d = 6.2 * s, ty = B.y + sa * 1.0 * s, fm = f + (Math.cos(f) > 0 ? -0.35 : 0.35), my = B.y + sa * 0.6 * s;
        return [[B.x + Math.cos(f) * d, ty, B.z + ((ty - B.y) - Math.sin(f) * d) / CE], [B.x + Math.cos(fm) * d * 0.55, my, B.z + ((my - B.y) - Math.sin(fm) * d * 0.55) / CE], 4]; }
      case 'curl': return [[r[0] - ca * 0.3 * s, r[1] - sa * 0.2 * s, r[2] - 0.4 * s], [r[0] + ca * 0.9 * s, r[1] + sa * 0.5 * s, r[2] - 1.3 * s], 3];
      case 'limp': return [[r[0] + ca * 2.8, r[1] + sa * 2.0 + 0.4, 0.05], [r[0] + ca * 2.0, r[1] + sa * 1.4, 1.0], 3];
      default: return [[B.x + (ca * 3.3 + 0.3 * sw) * s, B.y + (sa * 2.3 + 0.5) * s + 0.25 * Math.cos(t * 0.6 + j), B.z - (3.5 - 0.25 * sw) * s], [B.x + ca * 3.0 * s, B.y + (sa * 2.1 + 0.3) * s, B.z - 1.3 * s], 3.5];
    }
  }
  function stepTents(B, dt, t, snapTo) {
    for (const N of B.tents) {
      const [tp, md, k] = tentTarget(B, N, t);
      if (!N.init || snapTo) { N.init = 1; N.tx = tp[0]; N.ty = tp[1]; N.tz = tp[2]; N.mx = md[0]; N.my = md[1]; N.mz = md[2]; }
      else { const u = Math.min(1, dt * k), v = Math.min(1, dt * k * 0.8); N.tx += (tp[0] - N.tx) * u; N.ty += (tp[1] - N.ty) * u; N.tz += (tp[2] - N.tz) * u; N.mx += (md[0] - N.mx) * v; N.my += (md[1] - N.my) * v; N.mz += (md[2] - N.mz) * v; }
      if (dt > 0) { for (let i = 0; i < N.pulses.length; i++) N.pulses[i] += dt * (N.pv || 1.3); if (N.pulses.length) N.pulses = N.pulses.filter(u => u < 1.05); N.dark += ((N.mode === 'limp' ? 1 : 0) - N.dark) * Math.min(1, dt * 3); }
    }
  }
  function drawTents(c, P, B, cm, T, t, W, front) {
    const s = B.s == null ? 1 : B.s, lw = Math.max(1.2, T * 0.05), wf = u => T * s * (0.6 * Math.pow(1 - u, 1.1) + 0.07), list = [];
    B.tents.forEach((N, j) => {
      // a nerve hangs behind the brain unless it is a front one low or far out in front
      const rl = rootLocal(j), inFront = rl[1] > 0.3 && (N.tz < B.z - 0.5 || N.ty > B.y + 3); if (inFront !== front || N.gone > 0.98) return;
      const r0 = cm.P(W(rl)), tip = GK.at(P, N.tx, N.ty, N.tz), mid = GK.at(P, N.mx, N.my, N.mz), pts = [];
      for (let k = 0; k <= 14; k++) { const u = k / 14, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u; pts.push([a * r0[0] + b * mid[0] + d * tip[0], a * r0[1] + b * mid[1] + d * tip[1]]); }
      const dark = N.dark || 0, k2 = (B.ghost ? 0.3 : 1) * (1 - dark), pul = [];
      if (dark < 0.6) for (const u of N.pulses) if (u >= 0 && u <= 1) pul.push(GK.pulseAt(pts, u));
      list.push({ pts, dark, k2, pul, al: (B.a == null ? 1 : B.a) * (1 - (N.gone || 0)) });
    });
    if (!list.length) return;
    const style = dark => { const col = GK.mixC(B.col || '#BFA6DE', '#3A3048', dark); return { col, shade: GK.mixC(col, '#6A4A90', 0.6), shade2: false, hi: '#F4ECFF', line: '#1E0C28', lw, d1: 0.12, d2: 0.3, lx: LS[0], ly: LS[1], force: true, glowCol: dark > 0.5 ? null : '#7A3AD0', glowA: 0.25 }; };
    // light running down a nerve toward the tip (bright for the real thing, faint for a lie)
    const pulses = e => { for (const p of e.pul) { GK.glow(c, p[0], p[1], T * 0.9 * e.k2, VIO, 0.85 * e.k2); GK.glow(c, p[0], p[1], T * 0.35 * e.k2, '#FFFFFF', e.k2); } };
    // (each nerve painted on its own: one path round several nerves far apart costs more to fill than each alone)
    for (const e of list) {
      const o = style(e.dark);
      c.save(); c.globalAlpha = e.al;
      // a lie's nerves are only flat shapes with an outline: no shading bands to paint, so the second brain costs little
      if (B.ghost) { c.beginPath(); TN.ribbon(e.pts, wf)(c); c.fillStyle = o.col; c.fill(); c.strokeStyle = '#1E0C28'; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); }
      // (its bands laid as strips inside its edges, so a nerve is a few fills and no clip: it is painted every frame)
      else TN.tubeLite(c, e.pts, wf, o);
      pulses(e); c.restore();
    }
  }

  /* ---- the brains and what they do between blows ---- */
  function mkBrain(x, y, o) { return Object.assign({ x, y, zb: ZC, z: ZC, zTo: ZC, s: 1, sp: 0, spTo: 0, fis: 0.75, white: 0, whiteTo: 0, ghost: 0, a: 1, aTo: 1, look: [0, 1], thinkK: 0, bob: Math.random() * TAU, pulseT: 1, tents: ALL.map(j => ({ j, mode: 'rest', arg: null, tx: 0, ty: 0, tz: 0, mx: 0, my: 0, mz: 0, init: 0, pulses: [], dark: 0, gone: 0 })) }, o || {}); }
  function setMode(B, js, mode, arg) { if (!B) return; (Array.isArray(js) ? js : [js]).forEach(j => { const N = B.tents[j]; N.mode = mode; N.arg = typeof arg === 'function' ? arg(j) : arg; }); }
  function pulse(B, js, n, gap) { if (!B) return; js.forEach(j => { const N = B.tents[j]; for (let i = 0; i < (n || 1); i++) N.pulses.push(-i * (gap || 0.2)); }); }
  // the nerves whose roots point nearest an angle
  function nearestTents(a, n, skip) { return ALL.filter(j => !(skip && skip.includes(j))).sort((p, q) => Math.abs(GK.angTo(ROOTA(p), a)) - Math.abs(GK.angTo(ROOTA(q), a))).slice(0, n); }
  const aimAt = (B, x, y) => Math.atan2(y - B.y, x - B.x);
  function stepBrain(FX, B, dt, t) {
    const me = FX.me;
    B.sp += (B.spTo - B.sp) * Math.min(1, dt * 2.6); B.a += ((B.aTo == null ? 1 : B.aTo) - B.a) * Math.min(1, dt * 2.2);
    B.zb += (B.zTo - B.zb) * Math.min(1, dt * 2.2); B.z = B.zb + 0.22 * Math.sin(t * 0.9 + B.bob); B.white += ((B.whiteTo || 0) - B.white) * Math.min(1, dt * 1.5);
    if (me) { const dx = me.x - B.x, dy = me.y - B.y, d = Math.hypot(dx, dy) || 1; B.look[0] += (dx / d - B.look[0]) * Math.min(1, dt * 3); B.look[1] += (dy / d - B.look[1]) * Math.min(1, dt * 3); }
    B.pulseT -= dt; if (B.pulseT <= 0) { B.pulseT = 0.3 + Math.random() * 0.5; const N = B.tents[Math.random() * 8 | 0]; if (N.mode !== 'limp') N.pulses.push(0); }
    B.thinkK = Math.max(0, (B.thinkK || 0) - dt * 0.4);
    stepTents(B, dt, t);
  }
  function moveBrains(FX, M, m, dt, t) {
    const C = FX.C, B = M.B, lv = FX.S.lv, F = M.F;
    let hx = C.x + Math.cos(t * 0.13) * 1.3, hy = C.y - 0.8 + Math.sin(t * 0.17) * 0.7;
    if (lv === 2) { M.orb += dt * 0.09; const ca = Math.cos(M.orb), sa = Math.sin(M.orb) * 0.7; hx = C.x + ca * 3.2; hy = C.y - 0.6 + sa * 3.2; if (F) { F.hx = C.x - ca * 3.2; F.hy = C.y - 0.6 - sa * 3.2; } }
    if (lv >= 3) { hx = C.x + Math.cos(t * 0.11) * 0.6; hy = C.y - 0.6 + Math.sin(t * 0.15) * 0.4; }
    if (!M.end) { const k = Math.min(1, dt * (M.trans ? 1.6 : 0.9)); B.x += (hx - B.x) * k; B.y += (hy - B.y) * k; }
    if (F) { const tx = F.merge ? B.x : F.hx, ty = F.merge ? B.y : F.hy, k = Math.min(1, dt * (F.merge ? 1.5 : 0.9)); if (tx != null) { F.x += (tx - F.x) * k; F.y += (ty - F.y) * k; } }
    m.x = B.x; m.y = B.y;
  }

  /* ---- the obelisks: six round the chamber, four more that rise for the Unspoken Name ---- */
  const OB_BASE = GK.block(1.05, 1.05, 0.3), OB_SHAFT = GK.block(0.7, 0.7, 2.9, 0.6), OB_CAP = GK.pyramid(4, 0.6, 0.95, { a0: Math.PI / 4 }), OBH = 7.35;
  const obAt = (C, i) => { if (i < 6) { const a = i / 6 * TAU + Math.PI / 6; return { x: C.x + Math.cos(a) * OR, y: C.y + Math.sin(a) * OR, a }; } const a = (i - 6) / 4 * TAU + Math.PI / 4; return { x: C.x + Math.cos(a) * RR, y: C.y + Math.sin(a) * RR, a }; };
  const makeObelisks = C => Array.from({ length: 10 }, (_, i) => Object.assign(obAt(C, i), { i, lit: 0, charge: 0, flash: 0, sink: i < 6 ? 0 : 1, sinkTo: i < 6 ? 0 : 1, bound: false, broken: false, crack: 0, tents: i >= 6 ? [2 * (i - 6), 2 * (i - 6) + 1] : null }));
  const capOf = o => [o.x, o.y, OBH - 0.5 - (o.sink || 0) * (OBH + 0.2)];
  function obMats(o) {
    const k = Math.max(o.lit || 0, o.charge || 0), hot = (o.charge || 0) > 0.5;
    return { stone: [{ c: ['#16101C', '#2A2232', '#4A4058'], tex: 'stone', texA: 0.95, texS: 3, gloss: 0.12, glint: '#C8B8E0', edge: k > 0.05 ? (hot ? '#FFFFFF' : VIO) : null, edgeA: 0.2 + 0.4 * k }],
      cap: [k > 0.05 ? { c: hot ? ['#9A7AE0', '#E8DCFF', '#FFFFFF'] : ['#4A2290', '#A070F0', '#EAD8FF'], tex: 'crystal', texA: 0.6, texS: 1.6, gloss: 0.9, glint: '#FFFFFF', edge: '#F4EEFF', edgeA: 0.5 } : { c: ['#1C1624', '#342C40', '#564C64'], tex: 'crystal', texA: 0.5, texS: 1.6, gloss: 0.6, glint: '#B8A8D0' }] };
  }
  // runes cut down a lit obelisk's faces: little eyes, crossed strokes, open rings, chevrons
  function runes(col, k, seed) {
    return (c2, i, fr) => { if (fr.ext < 1) return; const R2 = mulberry32(seed + i * 7), n = 5, cu = (fr.u0 + fr.u1) / 2, h = fr.v1 - fr.v0, w = 0.2;
      c2.globalCompositeOperation = 'lighter'; c2.strokeStyle = GK.rgba(col, 0.8 * k); c2.lineWidth = 0.07; c2.lineCap = 'round'; c2.lineJoin = 'round';
      for (let q = 0; q < n; q++) { const v = fr.v0 + (q + 0.7) / (n + 0.4) * h, kind = R2() * 4 | 0; c2.beginPath();
        if (kind === 0) { c2.moveTo(cu - w, v); c2.quadraticCurveTo(cu, v - w * 0.9, cu + w, v); c2.quadraticCurveTo(cu, v + w * 0.9, cu - w, v); c2.moveTo(cu + w * 0.25, v); c2.arc(cu, v, w * 0.25, 0, TAU); }
        else if (kind === 1) { c2.moveTo(cu, v - w); c2.lineTo(cu, v + w); c2.moveTo(cu - w * 0.7, v - w * 0.3); c2.lineTo(cu + w * 0.7, v + w * 0.3); }
        else if (kind === 2) c2.arc(cu, v, w * 0.6, 0.4, TAU - 0.4);
        else { c2.moveTo(cu - w, v + w * 0.6); c2.lineTo(cu, v - w); c2.lineTo(cu + w, v + w * 0.6); }
        c2.stroke(); }
      c2.globalCompositeOperation = 'source-over'; };
  }
  /* an obelisk's picture is kept, and only laid down each frame, until its light, its zoom or its state changes: the view
     is a fixed-angle one, so how it looks never depends on where the camera is. While it sinks or flashes it is painted
     as it is */
  function drawObelisk(c, FX, o, T, t) {
    const sink = o.sink || 0; if (sink > 0.995) return;
    const X = FX.sx(o.x), Y = FX.sy(o.y), me = FX.me, mx = FX.sx(me.x), my = FX.sy(me.y), hid = me.y < o.y && Math.abs(mx - X) < T * 1.4 && my > Y - T * OBH * CE && my < Y + T * 0.4, al = hid ? 0.38 : 1;
    const lit = Math.max(o.lit || 0, o.charge || 0), hot = (o.charge || 0) > 0.5;
    if (!PROF.on && sink <= 0.002 && !((o.flash || 0) > 0.01)) {
      const tr = c.getTransform ? c.getTransform() : null, k = Math.min(2, Math.max(1, tr ? Math.hypot(tr.a, tr.b) : 1)), q = DunFiend.KIT.qq();
      const key = Math.round(T * 8) + '|' + Math.round(lit * 12) + '|' + (hot ? 1 : 0) + '|' + (o.broken ? 1 : 0) + '|' + k + '|' + q;
      const ox = T * 2.3, oy = T * (OBH * CE + 1.8), bw = Math.ceil(ox * 2 * k), bh = Math.ceil((oy + T * 1.3) * k);
      if (o._ok !== key) {
        const C = o._oc || (o._oc = document.createElement('canvas')); if (C.width !== bw || C.height !== bh) { C.width = bw; C.height = bh; }
        const g = C.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, bw, bh); g.setTransform(k, 0, 0, k, 0, 0);
        paintObelisk(g, FX, o, T, ox, oy, 0, 1, lit, hot); o._ok = key;
      }
      c.save(); GK.shadow(c, X, Y + T * 0.15, T * 1.7, T * 0.75, 0, 0.5); c.globalAlpha *= al; DunFiend.KIT.blit1(c, o._oc, X - ox, Y - oy, k, bw, bh); c.restore();
      if (lit > 0.05) { c.save(); const p = GK.at(FX, o.x, o.y, 6.8); GK.glow(c, p[0], p[1], T * (1.6 + (hot ? 1 : 0)), hot ? '#FFFFFF' : VIO, 0.45 + 0.2 * Math.sin(t * 3 + o.i)); c.restore(); }
      return;
    }
    c.save();
    if (sink > 0.002) { c.beginPath(); c.rect(X - T * 3, Y - T * 12, T * 6, T * 12 + T * 0.3); c.clip(); }
    if (sink < 0.5) GK.shadow(c, X, Y + T * 0.15, T * 1.7, T * 0.75, 0, 0.5);
    paintObelisk(c, FX, o, T, X, Y, -sink * (OBH + 0.2), al, lit, hot);
    if (lit > 0.05) { const p = GK.at(FX, o.x, o.y, 6.8 - sink * (OBH + 0.2)); GK.glow(c, p[0], p[1], T * (1.6 + (o.flash || 0) * 2 + (hot ? 1 : 0)), hot ? '#FFFFFF' : VIO, 0.45 + 0.2 * Math.sin(t * 3 + o.i) + (o.flash || 0) * 0.4); }
    c.restore();
  }
  // its stone: base, shaft and cap, with runes down a lit one's faces and a crack down a broken one
  function paintObelisk(c, FX, o, T, X, Y, dz, al, lit, hot) {
    const cm = GK.cam(X, Y, T), R0 = GK.rz(o.a + Math.PI / 4), MT = obMats(o);
    c.save();
    GK.solid(c, cm, OB_BASE, { R: R0, t: [0, 0, 0.3 + dz] }, { mats: MT.stone, ink: '#08050C', lw: 0.05, alpha: al });
    GK.solid(c, cm, OB_SHAFT, { R: R0, t: [0, 0, 0.6 + 2.9 + dz] }, { mats: MT.stone, ink: '#08050C', lw: 0.05, alpha: al, flash: (o.flash || 0) * 0.5, face: lit > 0.05 ? runes(hot ? '#FFFFFF' : VIO, lit, o.i * 31 + 5) : null });
    GK.solid(c, cm, OB_CAP, { R: R0, t: [0, 0, 6.4 + dz] }, { mats: MT.cap, ink: '#08050C', lw: 0.05, alpha: al, flash: o.flash || 0 });
    // a bond broken: a crack of light gone dark down its face
    if (o.broken) { const a = cm.P([0, 0, 6.2 + dz]), b = cm.P([0.15, 0, 2.2 + dz]); c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0] + T * 0.2, (a[1] + b[1]) / 2); c.lineTo(b[0], b[1]); c.stroke(); }
    c.restore();
  }

  /* ---- thoughts: a mark that follows the pet, locks, and erupts. A lie's mark is broken, sounds hollow, does nothing ---- */
  function thought(FX, M, o) {
    const me = FX.me, th = Object.assign({ x: me.x, y: me.y, r: 2.2, t: 0, follow: 1.6, lock: 0.9, real: true, spin: Math.random() * TAU, chase: 3.2 }, o);
    M.thoughts.push(th); const S = sfx(FX); if (th.real) { if (S.note) S.note(740, 0.12, 'sine', 0.07, 980); } else hollow(FX, 520);
    if (th.from) { pulse(th.from, nearestTents(aimAt(th.from, th.x, th.y), 2), 2, 0.25); th.from.thinkK = 1; }
    return th;
  }
  function stepThoughts(FX, M, dt) {
    const me = FX.me;
    M.thoughts = M.thoughts.filter(th => {
      th.t += dt; th.spin += dt * 2.4;
      if (th.t < th.follow) { const k = Math.min(1, dt * th.chase); th.x += (me.x - th.x) * k; th.y += (me.y - th.y) * k; return true; }
      const S = sfx(FX); if (th.real) { if (S.note) S.note(1180, 0.08, 'square', 0.05); } else hollow(FX, 700);
      GK.warn(FX, { shape: 'circle', x: th.x, y: th.y, r: th.r, t: th.lock, dmg: th.real ? (th.dmg || FX.m.dmg * 1.6) : 0, solid: th.real, col: WARN, grow: true, fn: () => erupt(FX, M, th) });
      return false; });
  }
  function erupt(FX, M, th) {
    const x = th.x, y = th.y, S = sfx(FX);
    if (!th.real) { GK.vfx(M, { kind: 'pillar', x, y, r: th.r * 0.6, h: 5, col: '#8A84A8', life: 0.3 }); hollow(FX, 380); return; }
    GK.vfx(M, { kind: 'pillar', x, y, r: th.r * 0.8, h: 9, col: VIO, life: 0.55 }); FX.H.boom(x, y, th.r * 0.7, VIO, '#FFFFFF', { n: 14, shake: 7, smoke: 4 }); if (S.crack) S.crack();
    // a thought that breaks over a lit obelisk charges it; over a bound one, it breaks the bond
    for (const o of M.ob) { if (o.sink > 0.4) continue; if (Math.hypot(o.x - x, o.y - y) > th.r + 0.95) continue;
      if (th.charge && o.lit > 0.5 && o.charge < 0.5) chargeOb(FX, M, o);
      if (th.bind && o.bound) breakBond(FX, M, o); }
    if (th.recur) GK.warn(FX, { shape: 'circle', x, y, r: th.r, t: th.recur, dmg: FX.m.dmg * 1.5, fillin: true, col: WARN, fn: () => erupt(FX, M, { x, y, r: th.r, real: true }) });
  }
  function chargeOb(FX, M, o) { o.charge = 1; o.flash = 1; chime(FX, 990); FX.H.text(o.x, o.y - 7.6, 'Charged', PALE, 13); if (M.cond) M.cond.n++; }

  /* ---- I, the Listening Mind ---- */
  function laneEnd(B, a, L) { return [B.x + Math.cos(a) * L, B.y + Math.sin(a) * L]; }
  // Nerve Lash: light runs down two raised nerves, then they slam along marked lanes, one after the other
  function nerveLash(FX, m, o) {
    o = o || {}; const M = FX.mem, me = FX.me, real = o.real !== false, k = tk(FX), wind = 1.3 * k, D2 = 0.32 * k;
    let B, L1, L2;
    const strike = L => { if (real) { FX.H.shake(9, 0.3); GK.vfx(M, { kind: 'plane', x0: L.x0, y0: L.y0, x1: L.x1, y1: L.y1, h: 3, w: 0.8, col: VIO, life: 0.5 }); const S = sfx(FX); if (S.crack) S.crack(); } else { hollow(FX, 260); GK.vfx(M, { kind: 'plane', x0: L.x0, y0: L.y0, x1: L.x1, y1: L.y1, h: 1.6, col: '#8A84A8', life: 0.25 }); } };
    return GK.job([[0, () => { B = o.B || M.B; if (!B) return; const a1 = o.a != null ? o.a : aimAt(B, me.x, me.y), a2 = a1 + (o.side || (Math.random() < 0.5 ? 1 : -1)) * 1.15, [j1] = nearestTents(a1, 1), [j2] = nearestTents(a2, 1, [j1]);
        const lane = (a, j, lbl) => { const e = laneEnd(B, a, 9.5); return { a, j, x0: B.x + Math.cos(a) * 1.2, y0: B.y + Math.sin(a) * 1.2, x1: e[0], y1: e[1], lbl }; };
        L1 = lane(a1, j1, '1'); L2 = lane(a2, j2, '2'); setMode(B, [j1, j2], 'raise'); pulse(B, [j1, j2], 3, 0.22); B.thinkK = 1;
        if (real) chime(FX, 560); else hollow(FX, 560); if (o.text !== false) say(FX, B, 'Nerve Lash'); }],
      [0.35, () => { if (!L1) return; [L1, L2].forEach((L, i) => GK.warn(FX, { shape: 'band', x0: L.x0, y0: L.y0, x1: L.x1, y1: L.y1, hw: 0.95, t: wind - 0.35 + (i ? D2 : 0), dmg: real ? m.dmg * 1.5 : 0, solid: real, col: WARN, grow: 'len', label: real ? L.lbl : '', fn: () => strike(L) })); }],
      [wind - 0.14, () => { if (L1) setMode(B, L1.j, 'slam', { x: L1.x1, y: L1.y1 }); }],
      [wind - 0.14 + D2, () => { if (L2) setMode(B, L2.j, 'slam', { x: L2.x1, y: L2.y1 }); }],
      [wind + 1.0, () => { if (L1) setMode(B, [L1.j, L2.j], FX.S.lv >= 3 ? 'spider' : 'rest'); }]], wind + 1.35);
  }
  // Intrusive Thought: a mark follows the pet, locks, and erupts
  function intrusive(FX, m, o) {
    const M = FX.mem, k = tk(FX), f = 1.6 * k, l = 0.9 * k;
    return GK.job([[0, () => { thought(FX, M, { from: M.B, follow: f, lock: l, real: true, charge: !!M.cond }); say(FX, M.B, 'Intrusive Thought'); }]], f + l + 0.7);
  }
  // Cerebral Tide: a ring rolls out from under it with a wide gap; the gap is shown while the ring forms
  function tide(FX, m, o) {
    o = o || {}; const M = FX.mem, me = FX.me, k = tk(FX), form = 1.15 * k, v = 5.5 / k;
    return GK.job([[0, (F2, m2, J) => { const B = M.B, ap = aimAt(B, me.x, me.y), dp = Math.max(3, Math.hypot(me.x - B.x, me.y - B.y)), off = 0.55 + (1.4 + Math.random() * 1.1) / dp, ga = o.ga != null ? o.ga : ap + (Math.random() < 0.5 ? 1 : -1) * off;
        J.tide = { x: B.x, y: B.y, r: 1.5, w: 1.3, ga, gw: 0.55, t: 0, form, v, hit: 0, real: true, dmg: m.dmg * 1.5 }; M.tides.push(J.tide); chime(FX, 330); say(FX, B, 'Cerebral Tide'); setMode(B, ALL, 'raise'); B.thinkK = 1; }],
      [form, () => { setMode(M.B, ALL, 'rest'); const S = sfx(FX); if (S.whoosh) S.whoosh(); FX.H.shake(6, 0.3); }]], form + (R + 3) / v + 0.2);
  }
  function stepTides(FX, M, dt) {
    const me = FX.me;
    M.tides = M.tides.filter(T2 => { T2.t += dt; if (T2.t > T2.form) T2.r += T2.v * dt;
      if (T2.real && !T2.hit && T2.t > T2.form) { const d = Math.hypot(me.x - T2.x, me.y - T2.y), a = Math.atan2(me.y - T2.y, me.x - T2.x); if (Math.abs(d - T2.r) < T2.w / 2 + me.r * 0.6 && Math.abs(GK.angTo(T2.ga, a)) > T2.gw) { T2.hit = 1; GK.hurt(FX, T2.dmg); } }
      return T2.r < R + 3; });
  }
  // Thought Conductor: two obelisks light; each of its thoughts that breaks over one charges it; two close the circuit
  function conductor(FX, m, o) {
    o = o || {}; const M = FX.mem, k = tk(FX), every = 2.8 * k, i0 = o.ob ? o.ob[0] : Math.random() * 6 | 0, i1 = o.ob ? o.ob[1] : (i0 + 2 + (Math.random() < 0.5 ? 0 : 1)) % 6;
    [i0, i1].forEach(i => { const ob = M.ob[i]; ob.lit = 1; ob.flash = 1; ob.charge = 0; }); M.cond = { ob: [i0, i1], n: 0 };
    return GK.job([[0, (F2, m2, J) => { J.next = 1.3; FX.H.banner('THOUGHT CONDUCTOR', 'Two obelisks light. Lead its thoughts onto them.', VIO, 2.6, true); chime(FX, 440); }]], 18,
      { hold: true, tick: (F2, m2, J, dt) => {
        if (!M.cond) { J.hold = false; J.end = 0; return; }
        J.next -= dt; if (J.next <= 0 && J.t < 16) { J.next = every; thought(FX, M, { from: M.B, follow: 1.6 * k, lock: 0.9 * k, real: true, charge: true }); }
        if (M.cond.n >= 2) { closeCircuit(FX, M, m); J.hold = false; J.end = 0; return; }
        if (J.t >= 18) { M.cond.ob.forEach(i => { M.ob[i].lit = 0; M.ob[i].charge = 0; }); M.cond = null; say(FX, M.B, 'The thought passes'); J.hold = false; J.end = 0; }
      } });
  }
  function closeCircuit(FX, M, m) {
    const B = M.B; M.cond.ob.forEach(i => { M.ob[i].flash = 1; }); M.cond.closed = 1; m.stunT = 5; M.open = 5; B.spTo = 1.25; B.zTo = 4.2; M.thoughts = [];
    FX.H.banner('THE CIRCUIT CLOSES', 'Its mind lies open: strike the core', PALE, 2.2, true); FX.H.flash(0.4, VIO); FX.H.shake(12, 0.5);
    GK.vfx(M, { kind: 'flare', x: B.x, y: B.y, z: B.z, r: 4, col: VIO, life: 0.8 }); const S = sfx(FX); if (S.crash) S.crash();
  }

  /* ---- II, the Divided Dream ---- */
  // the first lie comes alone, to be read
  function lieAlone(FX, m) {
    const M = FX.mem, me = FX.me, k = tk(FX);
    return GK.job([[0.2, () => { const F = M.F; if (!F) return; const x = me.x, y = me.y; GK.warn(FX, { shape: 'circle', x, y, r: 2.6, t: 2.0 * k, dmg: 0, solid: false, col: WARN, grow: true, fn: () => erupt(FX, M, { x, y, r: 2.6, real: false }) });
        pulse(F, nearestTents(aimAt(F, x, y), 3), 2); hollow(FX, 600); FX.H.banner('A LIE', 'A broken outline, no shadow, a hollow sound: the false mind\'s blows do no harm', LIEC, 3.2, true); }]], 2.7 * k);
  }
  // False Awakening: a mark under the pet and another where it would run; one is real
  function falseAwakening(FX, m, o) {
    o = o || {}; const M = FX.mem, me = FX.me, C = FX.C, k = tk(FX), r = 2.4, tt = 1.55 * k, realOn = o.realOn == null ? Math.random() < 0.5 : !!o.realOn;
    return GK.job([[0, () => { let dx = me.x - C.x, dy = me.y - C.y, d = Math.hypot(dx, dy); if (d < 1) { const a = Math.random() * TAU; dx = Math.cos(a); dy = Math.sin(a); d = 1; } let ux = dx / d, uy = dy / d; if (d + 3.8 > R - 1) { ux = -ux; uy = -uy; }
        const A = [me.x, me.y], Bq = [me.x + ux * 3.8, me.y + uy * 3.8], Rp = realOn ? A : Bq, Fp = realOn ? Bq : A;
        GK.warn(FX, { shape: 'circle', x: Rp[0], y: Rp[1], r, t: tt, dmg: m.dmg * 1.6, col: WARN, grow: true, fn: () => erupt(FX, M, { x: Rp[0], y: Rp[1], r, real: true }) });
        pulse(M.B, nearestTents(aimAt(M.B, Rp[0], Rp[1]), 3), 3); chime(FX, 620);
        if (M.F && M.F.a > 0.3) { GK.warn(FX, { shape: 'circle', x: Fp[0], y: Fp[1], r, t: tt, dmg: 0, solid: false, col: WARN, grow: true, fn: () => erupt(FX, M, { x: Fp[0], y: Fp[1], r, real: false }) }); pulse(M.F, nearestTents(aimAt(M.F, Fp[0], Fp[1]), 3), 3); hollow(FX, 620); }
        say(FX, M.B, 'False Awakening'); }]], tt + 0.7);
  }
  // Recurring Thought: a real mark erupts, and where it broke a broken mark mends over seconds, then erupts again
  function recurring(FX, m, o) {
    const M = FX.mem, k = tk(FX), f = 1.4 * k, l = 0.85 * k;
    return GK.job([[0, () => { thought(FX, M, { from: M.B, follow: f, lock: l, real: true, recur: 3.0 * k }); if (M.F && M.F.a > 0.3) thought(FX, M, { from: M.F, follow: f * 0.7, lock: l, real: false, chase: 4.5 }); say(FX, M.B, 'Recurring Thought'); }]], f + l + 3.0 * k + 0.8);
  }
  // Neural Stitch: nerves pinned to the floor make a wall across the chamber; one link flickers and opens; the pet's
  // half is struck. The lie marks the other half
  function stitch(FX, m, o) {
    o = o || {}; const M = FX.mem, me = FX.me, C = FX.C, k = tk(FX), tOpen = 1.3 * k, tHit = 3.4 * k;
    let ap = Math.atan2(me.y - C.y, me.x - C.x); if (Math.hypot(me.x - C.x, me.y - C.y) < 1) ap = Math.random() * TAU;
    const phi = o.phi != null ? o.phi : ap + Math.PI / 2 + (Math.random() - 0.5) * 0.8, ux = Math.cos(phi), uy = Math.sin(phi), nx = -uy, ny = ux;
    const S = [-(R + 0.6), -7.4, -2.6, 2.6, 7.4, R + 0.6], pt = s => [C.x + ux * s, C.y + uy * s], links = [];
    for (let i = 0; i < 5; i++) { const a = pt(S[i]), b = pt(S[i + 1]); links.push({ x0: a[0], y0: a[1], x1: b[0], y1: b[1], off: 0, flick: 0 }); }
    const half = sd => { const a0 = Math.atan2(ny * sd, nx * sd), pts = []; for (let i = 0; i <= 16; i++) { const a = a0 - Math.PI / 2 + i / 16 * Math.PI; pts.push([C.x + Math.cos(a) * (R + 0.6), C.y + Math.sin(a) * (R + 0.6)]); } return pts; };
    let sd = 1, js = [], pins = [];
    return GK.job([[0, () => { sd = Math.sign((me.x - C.x) * nx + (me.y - C.y) * ny) || 1; let best = 0, bd = 1e9; links.forEach((L, i) => { const d = GK.segD(me.x, me.y, L.x0, L.y0, L.x1, L.y1); if (d < bd) { bd = d; best = i; } });
        M.stitch = { links, open: best, on: 0, exit: -1 }; pins = [1, 2, 3, 4].map(i => pt(S[i])); const used = [];
        pins.forEach(p => { const [j] = nearestTents(aimAt(M.B, p[0], p[1]), 1, used); used.push(j); js.push(j); setMode(M.B, j, 'pin', { x: p[0], y: p[1] }); });
        pulse(M.B, js, 2); chime(FX, 300); say(FX, M.B, 'Neural Stitch'); }],
      [0.5, () => { M.stitch.on = 1; FX.H.shake(8, 0.3); const S2 = sfx(FX); if (S2.thud) S2.thud();
        GK.warn(FX, { shape: 'poly', pts: half(sd), t: tHit - 0.5, dmg: m.dmg * 2.0, col: WARN, grow: true, fn: () => { FX.H.flash(0.25, VIO); FX.H.shake(12, 0.4); const S3 = sfx(FX); if (S3.crash) S3.crash(); } });
        if (M.F && M.F.a > 0.3) { GK.warn(FX, { shape: 'poly', pts: half(-sd), t: tHit - 0.5, dmg: 0, solid: false, col: WARN, grow: true }); hollow(FX, 300); } }],
      [0.6, () => { const L = links[M.stitch.open]; L.flick = 1; }],
      [tOpen, () => { const L = links[M.stitch.open]; L.off = 1; L.flick = 0; M.stitch.exit = M.stitch.open; const S2 = sfx(FX); if (S2.note) S2.note(220, 0.4, 'sawtooth', 0.1, 110); }],
      [tHit + 0.45, () => { M.stitch = null; setMode(M.B, js, 'rest'); }]], tHit + 0.8);
  }
  // Twin Tides: both minds roll a tide out from under them at once. The lie's is a broken ring that does nothing, its
  // false way through opening where the pet stands; the real one's gap lies well aside, narrower, and is the only way
  // through. (One real ring at a time: its soft band is the costliest thing on the floor to paint)
  function twinTides(FX, m, o) {
    o = o || {}; const M = FX.mem, me = FX.me, k = tk(FX), form = 1.15 * k, v = 5.5 / k;
    const mk = (B, real, ga) => { const T2 = { x: B.x, y: B.y, r: 1.5, w: 1.3, ga, gw: real ? 0.48 : 0.6, t: 0, form, v, hit: 0, real, dmg: real ? m.dmg * 1.5 : 0 }; M.tides.push(T2); return T2; };
    return GK.job([[0, () => { const B = M.B, F = M.F && M.F.a > 0.3 ? M.F : null, ap = aimAt(B, me.x, me.y), dp = Math.max(3, Math.hypot(me.x - B.x, me.y - B.y)), off = 0.6 + (1.7 + Math.random() * 1.2) / dp;
        mk(B, true, o.ga != null ? o.ga : ap + (Math.random() < 0.5 ? 1 : -1) * off); setMode(B, ALL, 'raise'); B.thinkK = 1; chime(FX, 330); say(FX, B, 'Twin Tides');
        if (F) { mk(F, false, aimAt(F, me.x, me.y)); setMode(F, ALL, 'raise'); pulse(F, ALL, 1); hollow(FX, 330); } }],
      [form, () => { setMode(M.B, ALL, 'rest'); if (M.F) setMode(M.F, ALL, 'rest'); const S = sfx(FX); if (S.whoosh) S.whoosh(); FX.H.shake(6, 0.3); }]], form + (R + 3) / v + 0.2);
  }
  /* Racing Thoughts: a rush of marks along the pet's way, under it and where it is running, in turn. The real mind's fall
     where it stands, solid; the lie's fall ahead of it, broken. With no lie left in the room, all of them are real, fewer */
  function racing(FX, m, o) {
    o = o || {}; const M = FX.mem, me = FX.me, C = FX.C, k = tk(FX), every = 0.36 * k, lock = 0.8 * k, r = 1.6, n = M.F && M.F.a > 0.3 ? 8 : 6;
    const ev = [[0, () => { say(FX, M.B, 'Racing Thoughts'); chime(FX, 740); M.B.thinkK = 1; }]];
    for (let i = 0; i < n; i++) ev.push([0.35 + i * every, () => {
      const F = M.F && M.F.a > 0.3 ? M.F : null, ahead = i % 2 === 1, lie = ahead && !!F, vx = me.vx || 0, vy = me.vy || 0, sp = Math.hypot(vx, vy);
      let x = me.x, y = me.y;
      if (ahead) { if (sp > 0.3) { const L = Math.min(2.6, sp * 0.55); x += vx / sp * L; y += vy / sp * L; } else { const a = Math.random() * TAU; x += Math.cos(a) * 1.8; y += Math.sin(a) * 1.8; } }
      const d = Math.hypot(x - C.x, y - C.y), lim = R - 0.8; if (d > lim) { x = C.x + (x - C.x) / d * lim; y = C.y + (y - C.y) / d * lim; }
      thought(FX, M, { from: lie ? F : M.B, x, y, r, follow: 0.05, chase: 0, lock, real: !lie, dmg: m.dmg * 1.4 });
    }]);
    return GK.job(ev, 0.35 + (n - 1) * every + 0.05 + lock + 0.7);
  }
  // both brains lash together: the real lanes and the lie's
  function both(FX, m, jobs) { return GK.job([], 0.05, { hold: true, subs: jobs, tick: (F2, m2, J, dt) => { J.subs = J.subs.filter(S2 => !GK.stepJob(FX, m, S2, dt)); if (!J.subs.length) J.hold = false; } }); }
  function doubleLash(FX, m) { const M = FX.mem; if (!(M.F && M.F.a > 0.3)) return nerveLash(FX, m, {}); return both(FX, m, [nerveLash(FX, m, {}), nerveLash(FX, m, { B: M.F, real: false, text: false })]); }
  // Sever the Delusion: three obelisks light; each brain feeds one; touch the one the real brain feeds
  function sever(FX, m, o) {
    o = o || {}; const M = FX.mem, me = FX.me, k = tk(FX), pick = o.ob || [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5).slice(0, 3);
    pick.forEach(i => { const ob = M.ob[i]; ob.lit = 1; ob.flash = 1; ob.charge = 0; }); M.sev = { ob: pick, real: pick[0], lie: pick[1], touched: {} };
    return GK.job([[0, (F2, m2, J) => { J.next = 2.4; J.pt = 0; const oR = M.ob[pick[0]], oL = M.ob[pick[1]], cR = capOf(oR), cL = capOf(oL);
        setMode(M.B, nearestTents(aimAt(M.B, oR.x, oR.y), 2), 'reach', { x: cR[0], y: cR[1], z: cR[2] }); if (M.F) setMode(M.F, nearestTents(aimAt(M.F, oL.x, oL.y), 2), 'reach', { x: cL[0], y: cL[1], z: cL[2] });
        FX.H.banner('SEVER THE DELUSION', 'Each mind feeds a lit obelisk. Touch the one the real brain feeds.', PALE, 3, true); chime(FX, 392); }]], 15,
      { hold: true, tick: (F2, m2, J, dt) => {
        const S2 = M.sev; if (!S2) { J.hold = false; J.end = 0; return; }
        J.pt -= dt; if (J.pt <= 0) { J.pt = 0.45; pulse(M.B, M.B.tents.filter(N => N.mode === 'reach').map(N => N.j), 1); if (M.F) pulse(M.F, M.F.tents.filter(N => N.mode === 'reach').map(N => N.j), 1); }
        J.next -= dt; if (J.next <= 0 && J.t < 13) { J.next = 3.2 * k; thought(FX, M, { from: M.B, follow: 1.4 * k, lock: 0.85 * k, real: true }); }
        for (const i of S2.ob) { const ob = M.ob[i]; if (S2.touched[i] || ob.lit < 0.5) continue; if (Math.hypot(me.x - ob.x, me.y - ob.y) < 1.9) { S2.touched[i] = 1; if (i === S2.real) { reveal(FX, M, m); J.hold = false; J.end = 0; return; } wrongTouch(FX, M, ob, i === S2.lie); } }
        if (J.t >= 15) { endSever(FX, M); say(FX, M.B, 'The delusion holds'); J.hold = false; J.end = 0; }
      } });
  }
  function wrongTouch(FX, M, ob, fed) {
    ob.lit = 0; ob.flash = 1; chime(FX, 220, 0.8); FX.H.text(ob.x, ob.y - 7.6, 'It only flares', LILAC, 13);
    GK.warn(FX, { shape: 'circle', x: ob.x, y: ob.y, r: 2.3, t: 0.8, dmg: FX.m.dmg * 1.1, col: WARN, grow: true, fn: () => erupt(FX, M, { x: ob.x, y: ob.y, r: 2.3, real: true }) });
    if (fed && M.F) setMode(M.F, M.F.tents.filter(N => N.mode === 'reach').map(N => N.j), 'rest');
  }
  function reveal(FX, M, m) {
    const B = M.B, F = M.F; endSever(FX, M);
    if (F) { F.aTo = 0; F.gone = 1; } M.lieBack = 6.4; M.thoughts = [];
    m.stunT = 6; M.open = 6; B.zTo = 2.6; B.spTo = 1.0;
    FX.H.banner('THE DELUSION IS SEVERED', 'The lie collapses; the real mind falls within reach', PALE, 2.4, true); FX.H.flash(0.4, PALE); FX.H.shake(14, 0.5); const S = sfx(FX); if (S.crash) S.crash();
  }
  function endSever(FX, M) { const S2 = M.sev; if (!S2) return; S2.ob.forEach(i => { M.ob[i].lit = 0; }); M.sev = null; setMode(M.B, ALL, 'rest'); if (M.F) setMode(M.F, ALL, 'rest'); }

  /* ---- III, the Mind That Dreams You ---- */
  const PATS = ['cross', 'diag', 'inner', 'outer'], PGLY = { cross: 'x', diag: 'xd', inner: 'dot', outer: 'ring' };
  function patZone(C, p) {
    const L = R + 0.6, hw = 1.7, band = a => ({ shape: 'band', x0: C.x - Math.cos(a) * L, y0: C.y - Math.sin(a) * L, x1: C.x + Math.cos(a) * L, y1: C.y + Math.sin(a) * L, hw });
    if (p === 'cross') return { shape: 'multi', parts: [band(0), band(Math.PI / 2)] };
    if (p === 'diag') return { shape: 'multi', parts: [band(Math.PI / 4), band(-Math.PI / 4)] };
    if (p === 'inner') return { shape: 'circle', x: C.x, y: C.y, r: 4.8 };
    return { shape: 'ring', x: C.x, y: C.y, r0: 6.6, r1: R + 0.8 };
  }
  // Premonition: three futures shown, then struck in that order
  function premonition(FX, m, o) {
    o = o || {}; const M = FX.mem, C = FX.C, k = tk(FX), seq = o.seq || PATS.slice().sort(() => Math.random() - 0.5).slice(0, 3), t0 = 1.9 * k, gap = 1.3 * k, wtOf = p => (p === 'inner' || p === 'outer' ? 1.25 : 0.95) * k;
    const ev = [[0, () => { M.pre = { seq, shown: 0, done: -1 }; FX.H.banner('PREMONITION', 'It shows you three futures. They come in that order.', PALE, 2.2, true); }]];
    seq.forEach((p, i) => ev.push([0.25 + i * 0.45, () => { M.pre.shown = i + 1; chime(FX, 660 + i * 120, 0.7); }]));
    // each strikes when its warning has run, in order
    seq.forEach((p, i) => ev.push([t0 + i * gap + 0.95 * k - wtOf(p), () => { M.pre.done = i; GK.warn(FX, Object.assign(patZone(C, p), { t: wtOf(p), dmg: m.dmg * 1.6, col: WARN, grow: true, label: String(i + 1), fn: () => strikePat(FX, M, p) })); }]));
    const tEnd = t0 + 2 * gap + 0.95 * k;
    ev.push([tEnd + 0.3, () => { M.pre = null; }]);
    return GK.job(ev, tEnd + 0.6);
  }
  function strikePat(FX, M, p) {
    const C = FX.C, S = sfx(FX); FX.H.shake(10, 0.35); if (S.crash) S.crash();
    if (p === 'cross' || p === 'diag') { const a0 = p === 'cross' ? 0 : Math.PI / 4; [a0, a0 + Math.PI / 2].forEach(a => GK.vfx(M, { kind: 'plane', x0: C.x - Math.cos(a) * R, y0: C.y - Math.sin(a) * R, x1: C.x + Math.cos(a) * R, y1: C.y + Math.sin(a) * R, h: 5, w: 1.7, col: VIO, life: 0.55 })); }
    else if (p === 'inner') GK.vfx(M, { kind: 'pillar', x: C.x, y: C.y, r: 4.8, h: 8, col: VIO, life: 0.6 });
    else FX.H.ring(C.x, C.y, 6.6, R, 0.5, VIO, 0.3);
  }
  // Unwanted Memory: the path the pet walked is shown, then a ghost walks it again, quicker, its trail burning
  function memory(FX, m, o) {
    const M = FX.mem, me = FX.me, k = tk(FX), show = 1.4 * k;
    let route = M.trail.slice(-32).map(p => [p[0], p[1]]); route.push([me.x, me.y]); if (route.length < 2) route = [[me.x, me.y], [me.x, me.y]];
    const dur = Math.max(0.6, (route.length - 1) * 0.1 / 1.6);
    return GK.job([[0, () => { M.ghost = { route, t: -show, dur, hit: 0, x: route[0][0], y: route[0][1] }; say(FX, M.B, 'Unwanted Memory'); chime(FX, 494); }]], show + dur + 1.9);
  }
  function stepGhost(FX, M, dt) {
    const G = M.ghost; if (!G) return; const me = FX.me, m = FX.m; G.t += dt;
    if (G.t > 0) {
      const n = G.route.length - 1, u = clamp01(G.t / G.dur), f = u * n, i = Math.min(n - 1, Math.floor(f)), e = f - i, p = G.route[i], q = G.route[i + 1]; G.x = lerp(p[0], q[0], e); G.y = lerp(p[1], q[1], e); G.seg = f;
      if (!G.hit) {
        // one blow at most, whether it lands or not
        if (u < 1 && Math.hypot(me.x - G.x, me.y - G.y) < 0.8 + me.r) { G.hit = 1; GK.hurt(FX, m.dmg * 1.5); }
        else for (let j = 0; j < Math.min(n, Math.floor(f)); j++) { const age = G.t - j / n * G.dur; if (age < 0 || age > 1.6) continue; const A = G.route[j], B2 = G.route[j + 1]; if (GK.segD(me.x, me.y, A[0], A[1], B2[0], B2[1]) < 0.5 + me.r * 0.5) { G.hit = 1; GK.hurt(FX, m.dmg * 1.0); break; } }
      }
    }
    if (G.t > G.dur + 1.8) M.ghost = null;
  }
  // Synaptic Collapse: eight sectors round it, struck in alternate sets
  function collapse(FX, m, o) {
    o = o || {}; const M = FX.mem, C = FX.C, k = tk(FX), rot = o.rot != null ? o.rot : Math.random() * TAU, tA = 1.4 * k, tB = 2.6 * k, sec = i => ({ shape: 'sector', x: C.x, y: C.y, a0: rot + i * Math.PI / 4, a1: rot + (i + 1) * Math.PI / 4, r0: 2.5, r1: R + 0.8 });
    const mid = i => { const a = rot + (i + 0.5) * Math.PI / 4; return { x: C.x + Math.cos(a) * 7, y: C.y + Math.sin(a) * 7 }; };
    const set = (ids, t, lbl) => GK.warn(FX, { shape: 'multi', parts: ids.map(sec), t, dmg: m.dmg * 1.6, col: WARN, grow: true, label: lbl, lx: mid(ids[0]).x, ly: mid(ids[0]).y, fn: () => { FX.H.shake(9, 0.3); const S = sfx(FX); if (S.crack) S.crack(); ids.forEach(i => { const p = mid(i); GK.vfx(M, { kind: 'pillar', x: p.x, y: p.y, r: 2.2, h: 7, col: VIO, life: 0.45 }); }); } });
    const slam = (ids, js) => ids.forEach((i, q) => setMode(M.B, js[q], 'slam', mid(i)));
    return GK.job([[0, () => { say(FX, M.B, 'Synaptic Collapse'); chime(FX, 349); set([0, 2, 4, 6], tA, '1'); set([1, 3, 5, 7], tB, '2'); }],
      [tA - 0.16, () => slam([0, 2, 4, 6], [0, 2, 4, 6])], [tA + 0.5, () => setMode(M.B, [0, 2, 4, 6], 'spider')],
      [tB - 0.16, () => slam([1, 3, 5, 7], [1, 3, 5, 7])], [tB + 0.5, () => setMode(M.B, [1, 3, 5, 7], 'spider')]], tB + 0.8);
  }
  /* The Watching Sky: its eyes overhead open wide, and three gazes fall to the floor and drift after the pet. One that
     holds the pet long enough fixes there (its ring fills round, then turns white, and the sky's light falls on it) and
     strikes a moment later; each strikes
     twice at most, and all of them close when the sky does */
  function watchers(FX, m, o) {
    o = o || {}; const M = FX.mem, me = FX.me, C = FX.C, k = tk(FX), dur = 7.2 * k;
    return GK.job([[0, () => { const a0 = o.a0 != null ? o.a0 : Math.random() * TAU;
        M.watch = { t: 0, gz: [0, 1, 2].map(i => { const a = a0 + i * TAU / 3; let x = me.x + Math.cos(a) * 6, y = me.y + Math.sin(a) * 6; const d = Math.hypot(x - C.x, y - C.y), lim = R - 1.8; if (d > lim) { x = C.x + (x - C.x) / d * lim; y = C.y + (y - C.y) / d * lim; } return { x, y, r: 1.9, hold: 0, lock: 0, lockT: 0, cool: 0, n: 0, open: 0, gone: 0, look: [0, 1], i }; }) };
        M.eyesTo = 1; say(FX, M.B, 'The Watching Sky'); chime(FX, 523, 0.8); hollow(FX, 260); M.B.thinkK = 1; pulse(M.B, ALL, 2, 0.3); }],
      [dur, () => { if (M.watch) M.watch.closing = 1; }]], dur + 0.8);
  }
  function stepWatch(FX, M, dt) {
    const W = M.watch; if (!W) return; const me = FX.me, C = FX.C, m = FX.m, k = tk(FX), v = 2.2 / k; W.t += dt;
    for (const g of W.gz) {
      g.open = Math.min(1, g.open + dt * 2.2);
      const dx = me.x - g.x, dy = me.y - g.y, d = Math.hypot(dx, dy) || 1e-6; g.look = [dx / d, dy / d];
      // (a strike whose warning was cleared away lets go of its fix)
      if (g.lock) { g.lockT += dt; if (g.lockT > 2) { g.lock = 0; g.hold = 0; g.cool = 0.6; } else continue; }
      if (W.closing || g.n >= 2) { g.gone = Math.min(1, g.gone + dt * 2.5); continue; }
      if (g.cool > 0) { g.cool -= dt; g.hold = Math.max(0, g.hold - dt * 2); continue; }
      if (g.open >= 1) { const st = Math.min(d, v * dt); g.x += dx / d * st; g.y += dy / d * st; }
      // (they keep apart from each other, and within the chamber)
      for (const h of W.gz) { if (h === g || h.gone > 0) continue; const ex = g.x - h.x, ey = g.y - h.y, e = Math.hypot(ex, ey) || 1e-6, need = g.r + h.r - 0.4; if (e < need) { const push = (need - e) * 0.5; g.x += ex / e * push; g.y += ey / e * push; } }
      const dc = Math.hypot(g.x - C.x, g.y - C.y), lim = R - 1.2; if (dc > lim) { g.x = C.x + (g.x - C.x) / dc * lim; g.y = C.y + (g.y - C.y) / dc * lim; }
      const inside = Math.hypot(me.x - g.x, me.y - g.y) < g.r + me.r * 0.4;
      g.hold = inside ? g.hold + dt / (0.7 * k) : Math.max(0, g.hold - dt / 0.9);
      if (g.hold >= 1) { g.hold = 1; g.lock = 1; g.lockT = 0; const S = sfx(FX); if (S.note) S.note(1180, 0.08, 'square', 0.05);
        GK.warn(FX, { shape: 'circle', x: g.x, y: g.y, r: g.r, t: 0.5 * k, dmg: m.dmg * 1.6, col: WARN, grow: true, fn: () => { g.lock = 0; g.hold = 0; g.cool = 1.2; g.n++;
          GK.vfx(M, { kind: 'pillar', x: g.x, y: g.y, r: g.r * 0.85, h: 11, col: PALE, life: 0.55 }); FX.H.boom(g.x, g.y, g.r * 0.6, PALE, '#FFFFFF', { n: 12, shake: 6, smoke: 2 }); const S2 = sfx(FX); if (S2.crack) S2.crack(); } }); }
    }
    W.gz = W.gz.filter(g => g.gone < 1); if (!W.gz.length) M.watch = null;
  }
  /* The Unspoken Name: a long cast; four obelisks rise, each bound to two nerves. Its thoughts that break over a bound
     obelisk break the bond: fewer nerves, fewer eyes, its voice in pieces. All four, and the core is bare */
  function unspokenName(FX, m, o) {
    o = o || {}; const M = FX.mem, k = tk(FX), castT = o.castT || 22, B = M.B;
    GK.clearWarns(FX); M.thoughts = []; M.tides = []; M.ghost = null; M.pre = null; M.watch = null;
    M.name = { t: 0, castT, broken: 0, next: 2.6, beat: 0, beatT: 0 }; M.eyesTo = 1;
    [6, 7, 8, 9].forEach(i => { const ob = M.ob[i]; ob.sinkTo = 0; ob.bound = false; ob.broken = false; ob.lit = 1; ob.flash = 1; });
    return GK.job([[0, () => { FX.H.banner('THE UNSPOKEN NAME', 'Four obelisks rise, each bound to two nerves. Lead its thoughts onto them.', PALE, 3.2, true); const S = sfx(FX); if (S.hum) S.hum(); }],
      [1.3, () => { [6, 7, 8, 9].forEach(i => { const ob = M.ob[i], cp = capOf(Object.assign({}, ob, { sink: 0 })); ob.bound = true; setMode(B, ob.tents, 'reach', { x: cp[0], y: cp[1], z: cp[2] }); pulse(B, ob.tents, 2); }); chime(FX, 247); }]], castT + 0.4,
      { hold: true, tick: (F2, m2, J, dt) => {
        const N2 = M.name; if (!N2 || M.bare) { J.hold = false; J.end = 0; return; }
        N2.t += dt;
        // its voice: a low drone, quieter and more broken with each bond lost
        N2.beatT -= dt; if (N2.beatT <= 0) { N2.beatT = 0.55; N2.beat++; const S = sfx(FX), nb = N2.broken; if (S.note && !(nb && N2.beat % (5 - nb) === 0)) S.note(82 + nb * 6, nb ? 0.32 : 0.5, 'sawtooth', 0.07 * (1 - nb * 0.2), 80 + nb * 6); }
        N2.next -= dt; if (N2.next <= 0 && N2.t > 1.6 && N2.t < castT - 1.2) { N2.next = 2.3 * k; thought(FX, M, { from: B, follow: 1.5 * k, lock: 0.85 * k, real: true, bind: true }); }
        if (N2.t >= castT) { wave(FX, M, m); J.hold = false; J.end = 0; }
      } });
  }
  function breakBond(FX, M, o) {
    const N2 = M.name; if (!N2) return; o.bound = false; o.broken = true; o.lit = 0; o.flash = 1; N2.broken++; setMode(M.B, o.tents, 'limp');
    FX.H.text(o.x, o.y - 8, N2.broken < 4 ? `A bond breaks (${N2.broken}/4)` : 'The last bond breaks', PALE, 14); chime(FX, 392 - N2.broken * 40, 0.7); FX.H.shake(8, 0.3);
    M.eyesTo = 1 - N2.broken / 4; if (N2.broken >= 4) bare(FX, M, FX.m);
  }
  function bare(FX, M, m) {
    const B = M.B; M.bare = true; M.name = null; M.thoughts = []; M.watch = null; GK.clearWarns(FX); if (M.job && M.job.name === 'unspokenName') M.job = null; m.stunT = 14; M.open = 14; B.spTo = 1.35; B.zTo = 3.2;
    [6, 7, 8, 9].forEach(i => { M.ob[i].sinkTo = 1; }); FX.H.banner('THE NAME GOES UNSPOKEN', 'Its core is bare: end it', PALE, 2.6, true); FX.H.flash(0.5, PALE); FX.H.shake(16, 0.6); const S = sfx(FX); if (S.crash) S.crash();
  }
  function wave(FX, M, m) {
    const C = FX.C, B = M.B; M.name = null; FX.H.flash(0.9, '#FFFFFF'); FX.H.shake(26, 0.9); GK.hurt(FX, m.dmg * 3.2); FX.H.ring(C.x, C.y, 0.5, R + 2, 0.8, PALE, 0.5);
    FX.H.banner('IT SPEAKS ITS NAME', 'The wave sweeps everything. The bonds will form again.', PALE, 2.4, true); const S = sfx(FX); if (S.crash) S.crash();
    [6, 7, 8, 9].forEach(i => { const ob = M.ob[i]; ob.sinkTo = 1; ob.bound = false; ob.broken = false; ob.lit = 0; }); setMode(B, ALL, 'spider'); B.tents.forEach(N => { N.dark = 0; }); M.nameCd = 6; M.eyesTo = 1;
  }

  /* ---- choosing ---- */
  function pickJob(FX, m, lv) {
    const M = FX.mem, i = M.cyc++, nm = (n, J) => { J.name = n; return J; };
    if (lv === 1) { if (M.sigCd <= 0) { M.sigCd = 24; return nm('conductor', conductor(FX, m)); } return [() => nm('nerveLash', nerveLash(FX, m)), () => nm('intrusive', intrusive(FX, m)), () => nm('tide', tide(FX, m))][i % 3](); }
    if (lv === 2) { if (M.lieFirst) { M.lieFirst = false; return nm('lie', lieAlone(FX, m)); } if (M.sigCd <= 0 && M.F && M.F.a > 0.5) { M.sigCd = 28; return nm('sever', sever(FX, m)); } return [() => nm('falseAwakening', falseAwakening(FX, m)), () => nm('twinTides', twinTides(FX, m)), () => nm('recurring', recurring(FX, m)), () => nm('stitch', stitch(FX, m)), () => nm('racing', racing(FX, m)), () => nm('doubleLash', doubleLash(FX, m))][i % 6](); }
    return [() => nm('premonition', premonition(FX, m)), () => nm('memory', memory(FX, m)), () => nm('watchers', watchers(FX, m)), () => nm('collapse', collapse(FX, m))][i % 4]();
  }
  function endJob(FX) { const M = FX.mem, lv = FX.S.lv; M.job = null; M.gap = lv >= 3 ? 0.9 : lv === 2 ? 1.1 : 1.35; }
  // when a window to strike closes
  function closeUp(FX, M) {
    const B = M.B, lv = FX.S.lv; B.spTo = 0; B.zTo = lv >= 3 ? Z3 : ZC;
    if (M.cond) { M.cond.ob.forEach(i => { M.ob[i].lit = 0; M.ob[i].charge = 0; }); M.cond = null; }
    if (M.bare) { M.bare = false; M.nameCd = 3; say(FX, B, 'It gathers its name again', PALE); setMode(B, ALL, 'spider'); }
  }
  // the hit proxies follow the painted body; the core is a weak point while it shows
  function bodyParts(FX, m) {
    const M = FX.mem, B = M.B; if (M.end || !B || m.dead) return; const s = B.s, zc = B.z * CE;
    FX.parts([{ key: 'b0', dx: 0, dy: -zc, r: 1.7 * s }, { key: 'b1', dx: -1.7 * s, dy: -zc + 0.2, r: 1.3 * s }, { key: 'b2', dx: 1.7 * s, dy: -zc + 0.2, r: 1.3 * s }]);
    if (M.open > 0 && (B.sp > 0.6 || M.bare)) FX.weak('core', B.x, B.y - (B.z + 0.1) * CE, 1.1, M.bare ? 3 : 2.4, true); else FX.weak('core', 0, 0, 0, 0, false);
  }
  // the lie stands in the room as a prop, so the pet passes in front of it and behind it
  function syncLie(FX, M) {
    const P = FX.S.props, i = P.findIndex(p => p.kind === 'paleLie'), want = !!(M.F && M.F.a > 0.01 && !M.end);
    if (want && i < 0) P.push({ kind: 'paleLie', x: M.F.x, y: M.F.y + 0.02 }); else if (!want && i >= 0) P.splice(i, 1);
    if (want) { const p = P.find(q => q.kind === 'paleLie'); p.x = M.F.x; p.y = M.F.y + 0.02; }
  }
  function ensure(M, m, C) {
    if (!M.B) {
      M.B = mkBrain(m.x, m.y); Object.assign(M, { F: null, thoughts: [], tides: [], trail: [], trailT: 0, vfx: [], orb: M.orb || 0, open: M.open || 0, nameCd: 0, eyes: M.eyes == null ? 1 : M.eyes, eyesTo: 1, skyK: M.skyK || 0, skyTo: M.skyK || 0 });
      if (M.pose) Object.assign(M.B, M.pose);
      if (M.tm) { if (typeof M.tm === 'string') setMode(M.B, ALL, M.tm); else for (const j in M.tm) setMode(M.B, +j, M.tm[j]); }
      if (M.darkT) M.darkT.forEach(j => { M.B.tents[j].dark = 1; });
    }
    if (!M.ob && C) M.ob = makeObelisks(C);
  }

  /* ---- the ground layer: obelisks' openings, the thoughts following, tides, the stitch, premonitions, a memory ---- */
  function drawThought(c, FX, th, T, t) {
    const X = FX.sx(th.x), Y = FX.sy(th.y), r = th.r * T, u = clamp01(th.t / th.follow);
    c.save(); c.lineCap = 'round';
    if (th.real) {
      // a pool of shadow under it, a solid ring and ticks closing in on it
      c.fillStyle = 'rgba(6,2,10,.3)'; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill();
      c.globalCompositeOperation = 'lighter'; c.fillStyle = GK.rgba(WARN, 0.1 + 0.06 * Math.sin(t * 10)); c.fill(); c.strokeStyle = GK.rgba(WARN, 0.85); c.lineWidth = 3.5; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.stroke(); c.strokeStyle = GK.rgba('#FFFFFF', 0.6); c.lineWidth = 1.2; c.stroke();
      c.strokeStyle = GK.rgba(WARN, 0.95); c.lineWidth = 4; for (let i = 0; i < 4; i++) { const a = th.spin + i * Math.PI / 2, r0 = r * (1.35 - 0.3 * u), r1 = r0 - r * 0.25; c.beginPath(); c.moveTo(X + Math.cos(a) * r0, Y + Math.sin(a) * r0); c.lineTo(X + Math.cos(a) * r1, Y + Math.sin(a) * r1); c.stroke(); }
    } else {
      // a lie: broken and flickering, nothing under it
      c.setLineDash([T * 0.42, T * 0.34]); c.lineDashOffset = -t * T * 1.4; c.strokeStyle = GK.rgba(WARN, 0.35 + 0.2 * Math.sin(t * 23 + th.x)); c.lineWidth = 2; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.stroke(); c.setLineDash([]);
    }
    // an eye at its heart, that has found you
    const w = T * 0.55, a = th.real ? 0.9 : 0.4; c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.fillStyle = 'rgba(250,244,255,.9)'; c.beginPath(); c.moveTo(X - w, Y); c.quadraticCurveTo(X, Y - w * 0.8, X + w, Y); c.quadraticCurveTo(X, Y + w * 0.8, X - w, Y); c.fill(); c.fillStyle = '#6A2AB0'; c.beginPath(); c.arc(X, Y, w * 0.36, 0, TAU); c.fill(); c.fillStyle = '#05020A'; c.beginPath(); c.arc(X, Y, w * 0.17, 0, TAU); c.fill();
    c.restore();
  }
  // a gaze of the sky on the floor: a pool of pale light, a ring that fills round as it holds you (white once it has
  // fixed), and an eye at its heart turned to you, that closes as the gaze goes
  function drawGaze(c, FX, g, T, t) {
    const X = FX.sx(g.x), Y = FX.sy(g.y), vis = g.open * (1 - g.gone), r = g.r * T; if (vis <= 0.01) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.32 * vis; blitSized(c, glowSprite('#F4EEFF'), X - r * 1.3, Y - r * 1.3, r * 2.6, r * 2.6);
    // (its rim a kept picture: a stroke round a circle this big costs several times as much as laying one down)
    c.globalAlpha = vis * (0.5 + 0.2 * Math.sin(t * 5 + g.i)); gazeRim(c, X, Y, r);
    if (g.hold > 0.01) { c.globalAlpha = vis; c.lineCap = 'round'; c.strokeStyle = g.lock ? '#FFFFFF' : GK.rgba(WARN, 0.55 + 0.45 * g.hold); c.lineWidth = 4; c.beginPath(); c.arc(X, Y, r, -Math.PI / 2, -Math.PI / 2 + TAU * g.hold); c.stroke(); }
    c.restore();
    const op = 1 - g.gone, w = T * 0.62 * (0.4 + 0.6 * g.open), lx = g.look[0] * w * 0.3, ly = g.look[1] * w * 0.2;
    c.save(); c.globalAlpha = 0.9 * vis; c.fillStyle = 'rgba(250,244,255,.92)'; c.beginPath(); c.moveTo(X - w, Y); c.quadraticCurveTo(X, Y - w * 0.8 * op, X + w, Y); c.quadraticCurveTo(X, Y + w * 0.8 * op, X - w, Y); c.fill();
    c.fillStyle = '#6A2AB0'; c.beginPath(); c.arc(X + lx, Y + ly, Math.max(0.5, w * 0.36 * op), 0, TAU); c.fill(); c.fillStyle = '#05020A'; c.beginPath(); c.arc(X + lx, Y + ly, Math.max(0.3, w * 0.17 * op), 0, TAU); c.fill(); c.restore();
  }
  const RIMS = new Map();
  function gazeRim(c, X, Y, r) {
    const tr = c.getTransform(), k = Math.hypot(tr.a, tr.b) || 1, key = Math.round(r * k * 4) + '|' + k;
    let e = RIMS.get(key);
    if (!e) { if (RIMS.size > 6) RIMS.clear(); const sz = Math.ceil((r + 3) * 2 * k), cv = document.createElement('canvas'); cv.width = cv.height = sz; const g = cv.getContext('2d'); g.setTransform(k, 0, 0, k, sz / 2, sz / 2); g.strokeStyle = PALE; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); e = { cv, sz }; RIMS.set(key, e); }
    DunFiend.KIT.blit1(c, e.cv, X - e.sz / 2 / k, Y - e.sz / 2 / k, k, e.sz, e.sz);
  }
  function drawTide(c, FX, T2, T, t) {
    const X = FX.sx(T2.x), Y = FX.sy(T2.y), forming = T2.t < T2.form, r = (T2.r + (forming ? Math.sin(t * 8) * 0.1 : 0)) * T, w = T2.w * T, g0 = T2.ga - T2.gw, g1 = T2.ga + T2.gw;
    // a lie's tide: a broken outline flickering over nothing, its gap as false as the rest of it
    if (!T2.real) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.setLineDash([T * 0.45, T * 0.35]); c.lineDashOffset = -t * T * 1.6; c.strokeStyle = GK.rgba(VIO, (forming ? 0.3 : 0.45) + 0.2 * Math.sin(t * 23 + T2.x)); c.lineWidth = 2;
      for (const rr of [r - w * 0.45, r + w * 0.45]) { if (rr < 1) continue; c.beginPath(); c.arc(X, Y, rr, g1, g0 + TAU); c.stroke(); } c.restore(); return; }
    c.save(); c.globalCompositeOperation = 'lighter';
    // a soft band of light, its sides fading rather than ending in a line and brightest at its rolling front; its ends stay
    // square, as the gap is the way through
    const k = forming ? 0.6 : 1, r0 = Math.max(1, r - w * 0.68), r1 = r + w * 0.68, gr = c.createRadialGradient(X, Y, r0, X, Y, r1);
    [[0, VIO, 0], [0.14, VIO, 0.14], [0.34, VIO, 0.34], [0.58, VIO, 0.46], [0.76, PALE, 0.5], [0.84, PALE, 0.78], [0.92, VIO, 0.22], [1, VIO, 0]].forEach(([u, col, a]) => gr.addColorStop(u, GK.rgba(col, a * k)));
    c.beginPath(); c.arc(X, Y, r1, g1, g0 + TAU); c.arc(X, Y, r0, g0 + TAU, g1, true); c.closePath(); c.fillStyle = gr; c.fill();
    // its gap, bright-edged; while it forms, the way the gap will travel is lit out to the edge
    c.strokeStyle = GK.rgba(OPEN, 0.9); c.lineWidth = 3; [g0, g1].forEach(a => { c.beginPath(); c.moveTo(X + Math.cos(a) * (r - w / 2), Y + Math.sin(a) * (r - w / 2)); c.lineTo(X + Math.cos(a) * (r + w / 2), Y + Math.sin(a) * (r + w / 2)); c.stroke(); });
    if (forming) { c.setLineDash([T * 0.3, T * 0.3]); c.lineDashOffset = -t * T; c.strokeStyle = GK.rgba(OPEN, 0.45 + 0.25 * Math.sin(t * 9)); c.lineWidth = 2; [g0, g1].forEach(a => { c.beginPath(); c.moveTo(X + Math.cos(a) * r, Y + Math.sin(a) * r); c.lineTo(X + Math.cos(a) * T * 12, Y + Math.sin(a) * T * 12); c.stroke(); }); c.setLineDash([]);
      c.globalCompositeOperation = 'source-over'; const lx = X + Math.cos(T2.ga) * T * 5, ly = Y + Math.sin(T2.ga) * T * 5; c.font = `900 ${Math.round(T * 0.55)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.65)'; c.strokeText('GAP', lx, ly); c.fillStyle = '#E8FFF6'; c.fillText('GAP', lx, ly); }
    c.restore();
  }
  function drawStitch(c, FX, S2, T, t) {
    c.save(); c.lineCap = 'round';
    S2.links.forEach((L, i) => { if (L.off) return; const a = S2.on ? (L.flick ? (Math.sin(t * 40) > 0 ? 1 : 0.25) : 1) : 0.4, A = [FX.sx(L.x0), FX.sy(L.y0)], Bq = [FX.sx(L.x1), FX.sy(L.y1)];
      c.globalAlpha = a; c.strokeStyle = 'rgba(20,6,26,.6)'; c.lineWidth = T * 0.5; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(Bq[0], Bq[1]); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = GK.rgba(VIO, 0.45); c.lineWidth = T * 0.36; c.stroke(); c.strokeStyle = GK.rgba(PALE, 0.9); c.lineWidth = Math.max(1.5, T * 0.07); c.stroke(); c.globalCompositeOperation = 'source-over'; });
    if (S2.exit >= 0) { const L = S2.links[S2.exit], mx = (L.x0 + L.x1) / 2, my = (L.y0 + L.y1) / 2, X = FX.sx(mx), Y = FX.sy(my); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter'; c.strokeStyle = GK.rgba(OPEN, 0.55 + 0.35 * Math.sin(t * 12)); c.lineWidth = 3; c.setLineDash([T * 0.35, T * 0.25]); c.beginPath(); c.moveTo(FX.sx(L.x0), FX.sy(L.y0)); c.lineTo(FX.sx(L.x1), FX.sy(L.y1)); c.stroke(); c.setLineDash([]);
      c.globalCompositeOperation = 'source-over'; c.font = `900 ${Math.round(T * 0.55)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.65)'; c.strokeText('WAY THROUGH', X, Y); c.fillStyle = '#E8FFF2'; c.fillText('WAY THROUGH', X, Y); }
    c.restore();
  }
  function drawFloor(c, FX, M, T, t) {
    const C = FX.C, me = FX.me;
    if (M.skyK > 0.01) { c.save(); c.globalAlpha = 0.1 * M.skyK; c.fillStyle = '#EEE6FA'; c.beginPath(); c.arc(FX.sx(C.x), FX.sy(C.y), (C.R + 0.6) * T, 0, TAU); c.fill(); c.restore(); }
    for (const o of M.ob) {
      const X = FX.sx(o.x), Y = FX.sy(o.y), lit = Math.max(o.lit || 0, o.charge || 0);
      // the slot a riser waits in, the opening a sunken obelisk left
      if (o.i >= 6 || o.sink > 0.02) { c.save(); c.translate(X, Y); c.rotate(o.a + Math.PI / 4); c.fillStyle = 'rgba(4,2,8,.75)'; c.fillRect(-T * 1.0, -T * 1.0, T * 2.0, T * 2.0); c.strokeStyle = o.i >= 6 && (o.sinkTo < 1 || o.sink < 0.98) ? GK.rgba(VIO, 0.7) : 'rgba(120,100,150,.35)'; c.lineWidth = 2; c.strokeRect(-T * 1.0, -T * 1.0, T * 2.0, T * 2.0); c.restore(); }
      if (lit > 0.05 && o.sink < 0.5) { c.save(); c.globalCompositeOperation = 'lighter'; c.translate(X, Y); c.scale(1, 0.6); c.globalAlpha = 0.45 * lit; blitSized(c, glowSprite((o.charge || 0) > 0.5 ? '#FFFFFF' : VIO), -T * 3, -T * 3, T * 6, T * 6); c.restore(); }
      // two shadows, as a second mind opens
      if (o.dbl && M.F && o.sink < 0.5) [M.B, M.F].forEach(Bq => { const a = Math.atan2(o.y - Bq.y, o.x - Bq.x), L = T * 6.5 * o.dbl, w = T * 0.8; c.save(); c.translate(X, Y); c.rotate(a); const gr = c.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, 'rgba(4,2,8,.55)'); gr.addColorStop(1, 'rgba(4,2,8,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(0, -w); c.lineTo(L, -w * 0.5); c.lineTo(L, w * 0.5); c.lineTo(0, w); c.closePath(); c.fill(); c.restore(); });
    }
    // Sever: the ring round each lit obelisk that a touch must reach
    if (M.sev) M.sev.ob.forEach(i => { const o = M.ob[i]; if (o.lit < 0.5) return; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = GK.rgba(PALE, 0.4 + 0.25 * Math.sin(t * 6 + i)); c.lineWidth = 2; c.setLineDash([T * 0.25, T * 0.2]); c.lineDashOffset = t * T; c.beginPath(); c.arc(FX.sx(o.x), FX.sy(o.y), T * 1.9, 0, TAU); c.stroke(); c.restore(); });
    for (const th of M.thoughts) drawThought(c, FX, th, T, t);
    for (const T2 of M.tides) if (!T2.real) drawTide(c, FX, T2, T, t);
    for (const T2 of M.tides) if (T2.real) drawTide(c, FX, T2, T, t);
    if (M.watch) for (const g of M.watch.gz) drawGaze(c, FX, g, T, t);
    if (M.stitch) drawStitch(c, FX, M.stitch, T, t);
    // premonitions: the futures yet to come, as broken outlines, numbered
    if (M.pre) M.pre.seq.forEach((p, i) => { if (i >= M.pre.shown || i <= M.pre.done) return; const z = patZone(C, p); c.save(); c.globalCompositeOperation = 'lighter'; c.setLineDash([T * 0.5, T * 0.35]); c.lineDashOffset = -t * T * (1 + i * 0.3); GK.zonePath(c, z, FX, T); c.strokeStyle = GK.rgba(i === M.pre.done + 1 ? PALE : VIO, 0.6 - i * 0.12); c.lineWidth = 2.5 - i * 0.4; c.stroke(); c.restore(); });
    // a memory: the route it will walk, then the trail it burns
    if (M.ghost) { const G = M.ghost, n = G.route.length - 1; c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.globalCompositeOperation = 'lighter';
      c.setLineDash([T * 0.3, T * 0.25]); c.lineDashOffset = t * T * 2; c.strokeStyle = GK.rgba(VIO, G.t < 0 ? 0.75 : 0.3); c.lineWidth = T * 0.22; c.beginPath(); G.route.forEach((p, i) => i ? c.lineTo(FX.sx(p[0]), FX.sy(p[1])) : c.moveTo(FX.sx(p[0]), FX.sy(p[1]))); c.stroke(); c.setLineDash([]);
      if (G.t > 0) for (let j = 0; j < Math.min(n, Math.floor(G.seg || 0)); j++) { const age = G.t - j / n * G.dur; if (age < 0 || age > 1.6) continue; const k = 1 - age / 1.6, A = G.route[j], B2 = G.route[j + 1]; c.strokeStyle = GK.rgba('#FFD8F8', 0.85 * k); c.lineWidth = T * (0.5 + 0.2 * Math.sin(t * 20 + j)); c.beginPath(); c.moveTo(FX.sx(A[0]), FX.sy(A[1])); c.lineTo(FX.sx(B2[0]), FX.sy(B2[1])); c.stroke(); c.strokeStyle = GK.rgba(VIO, 0.5 * k); c.lineWidth = T * 1.0; c.stroke(); }
      c.restore(); }
    // the end: the pet's shadow stays facing the pearl, then turns back
    if (M.end) { const E = M.end, B = M.B, pk = clamp01((E.t - 2.4) / 1.2) * (1 - clamp01((E.t - 6.6) / 1.2)); if (pk > 0) { const X = FX.sx(B.x), Y = FX.sy(B.y); c.save(); c.globalCompositeOperation = 'lighter'; c.translate(X, Y); c.scale(1, 0.62); c.globalAlpha = 0.4 * pk; blitSized(c, glowSprite('#E8DCFF'), -T * 13, -T * 13, T * 26, T * 26); c.restore(); } }
    if (M.end && M.end.sh) { const E = M.end, a = E.sh.a, k = E.sh.k, X = FX.sx(me.x), Y = FX.sy(me.y), L = T * 3.2, w = T * 0.62; c.save(); c.translate(X, Y); c.rotate(a); c.globalAlpha = k; const gr = c.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, 'rgba(4,1,8,.92)'); gr.addColorStop(1, 'rgba(4,1,8,.35)'); c.fillStyle = gr; c.beginPath(); c.ellipse(L * 0.48, 0, L * 0.52, w, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(L * 0.95, -w * 0.5, w * 0.36, 0, TAU); c.arc(L * 0.95, w * 0.5, w * 0.36, 0, TAU); c.fill(); c.restore(); }
  }
  /* ---- the air: light from its blows, tethers and feeding light, the ghost, the order of the futures, its name ---- */
  function beam(c, a, b, T, col, k, t, dashed) {
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    if (dashed) { c.setLineDash([T * 0.4, T * 0.5]); c.lineDashOffset = -t * T * 1.6; c.strokeStyle = GK.rgba(LIEC, (0.3 + 0.2 * Math.sin(t * 23)) * k); c.lineWidth = Math.max(1.5, T * 0.1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.restore(); return; }
    softRay(c, a[0], a[1], b[0], b[1], T * 1.1, col, 0.4 * k); softRay(c, a[0], a[1], b[0], b[1], Math.max(3, T * 0.42), col, k, 0.4);   // (soft light, no edge)
    for (let i = 0; i < 3; i++) { const u = (t * 0.9 + i / 3) % 1, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u); GK.glow(c, x, y, T * 0.7, col, 0.7 * k); }
    c.restore();
  }
  function drawAir(c, FX, M, T, t) {
    GK.drawVfx(c, FX, M, T);
    const B = M.B, under = Bq => GK.at(FX, Bq.x, Bq.y + 1.0 * SE, Bq.z - 1.2);
    // a charged obelisk tethers to it
    if (!M.end) for (const o of M.ob) { if ((o.charge || 0) > 0.5 && o.sink < 0.5) { const cp = capOf(o); beam(c, GK.at(FX, cp[0], cp[1], cp[2]), under(B), T, PALE, 1, t); } }
    // the feeds of Sever: the real mind's bright, the lie's broken
    if (M.sev) { const oR = M.ob[M.sev.real], oL = M.ob[M.sev.lie], cR = capOf(oR), cL = capOf(oL); if (oR.lit > 0.5) beam(c, under(B), GK.at(FX, cR[0], cR[1], cR[2]), T, VIO, 1, t); if (M.F && oL.lit > 0.5) beam(c, under(M.F), GK.at(FX, cL[0], cL[1], cL[2]), T, VIO, M.F.a, t, true); }
    // where a bound nerve holds an obelisk, a knot of light
    if (M.name) for (const i of [6, 7, 8, 9]) { const o = M.ob[i]; if (!o.bound) continue; const p = GK.at(FX, o.x, o.y, OBH - 0.5); GK.glow(c, p[0], p[1], T * (1.4 + 0.3 * Math.sin(t * 5 + i)), VIO, 0.7); GK.glow(c, p[0], p[1], T * 0.5, '#FFFFFF', 0.9); }
    // a gaze that has fixed on the pet: a shaft of the sky's light falls on it until it strikes (a soft column laid down
    // as a kept picture at its size: a gradient over as much of the screen would cost far more)
    if (M.watch && !M.end) for (const g of M.watch.gz) { const vis = g.open * (1 - g.gone); if (vis < 0.02 || !g.lock) continue; const X = FX.sx(g.x), Y = FX.sy(g.y), H = 14 * CE * T, wd = g.r * T * 0.9;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 * vis; blitSized(c, columnSprite(PALE), X - wd, Y - H, wd * 2, H); c.restore(); }
    // the memory's ghost: a pale wisp walking your way back
    if (M.ghost) { const G = M.ghost, p = GK.at(FX, G.x, G.y, 0.9), k = G.t < 0 ? 0.45 + 0.2 * Math.sin(t * 8) : 1; c.save(); c.globalAlpha = k * 0.85; const gr = c.createRadialGradient(p[0], p[1] - T * 0.2, T * 0.1, p[0], p[1], T * 1.1); gr.addColorStop(0, 'rgba(255,250,255,.95)'); gr.addColorStop(0.6, 'rgba(220,200,255,.55)'); gr.addColorStop(1, 'rgba(200,170,255,0)'); c.fillStyle = gr; c.beginPath(); c.ellipse(p[0], p[1], T * 0.75, T * 1.0, 0, 0, TAU); c.fill();
      c.fillStyle = '#2A0E40'; c.beginPath(); c.arc(p[0] - T * 0.22, p[1] - T * 0.25, T * 0.1, 0, TAU); c.arc(p[0] + T * 0.22, p[1] - T * 0.25, T * 0.1, 0, TAU); c.fill(); c.restore(); }
    const m = FX.m, Wd = FX.H.W ? FX.H.W() : c.canvas.width, Hd = FX.H.H ? FX.H.H() : c.canvas.height;
    // an obelisk that matters but lies out of view is pointed to from the edge of it
    if (!M.end && (M.cond || M.sev || M.name)) for (const o of M.ob) {
      const want = M.name ? o.bound : M.cond ? (o.lit > 0.5 && o.charge < 0.5) : (o.lit > 0.5); if (!want || o.sink > 0.6) continue;
      const p = GK.at(FX, o.x, o.y, 3.5), mg = 26, top = 150, bot = Hd - 220; if (p[0] > mg && p[0] < Wd - mg && p[1] > top && p[1] < bot) continue;
      const cx = Wd / 2, cy = (top + bot) / 2, dx = p[0] - cx, dy = p[1] - cy, k = Math.min((Wd / 2 - mg) / Math.max(1e-3, Math.abs(dx)), ((bot - top) / 2) / Math.max(1e-3, Math.abs(dy))), x = cx + dx * k, y = cy + dy * k, a = Math.atan2(dy, dx), pl = 0.75 + 0.25 * Math.sin(t * 7 + o.i);
      c.save(); c.translate(x, y); c.rotate(a); c.globalCompositeOperation = 'lighter'; c.globalAlpha = pl; blitSized(c, glowSprite(VIO), -18, -18, 36, 36); c.globalCompositeOperation = 'source-over'; c.fillStyle = PALE; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(11, 0); c.lineTo(-5, -8); c.lineTo(-2, 0); c.lineTo(-5, 8); c.closePath(); c.stroke(); c.fill(); c.restore();
    }
    // the futures in their order, kept in a row at the top of the view
    if (M.pre && !M.end) { const P2 = M.pre, n = P2.seq.length, y0 = 146, gw = 15, x0 = Wd / 2 - (n - 1) / 2 * gw * 2.3; c.save(); c.font = `900 9px ${arcFont}`; c.textAlign = 'right'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.strokeText('FUTURES', x0 - gw - 4, y0); c.fillStyle = '#FFFFFF'; c.fillText('FUTURES', x0 - gw - 4, y0); c.restore();
      for (let i = 0; i < n; i++) { const x = x0 + i * gw * 2.3; if (i >= P2.shown) { c.save(); c.globalAlpha = 0.35; c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y0 - gw); c.lineTo(x + gw, y0); c.lineTo(x, y0 + gw); c.lineTo(x - gw, y0); c.closePath(); c.stroke(); c.restore(); continue; } const act = i === P2.done + 1, done = i <= P2.done; GK.glyph(c, PGLY[P2.seq[i]], x, y0, gw * (act ? 1.15 : 1), act ? '#FFFFFF' : VIO, done ? 0.4 : 1); } }
    // the name being spoken: how far the cast has come, and the bonds left
    if (M.name && m && !m.dead) { const N2 = M.name, px = Wd / 2, py = 152, w = Math.min(190, Wd * 0.5); FiendBeast.meter(c, px, py, w, N2.t / N2.castT, PALE, 'THE UNSPOKEN NAME');
      for (let i = 0; i < 4; i++) { const x = px + (i - 1.5) * 16, y = py + 13, on = i >= N2.broken; c.save(); c.fillStyle = on ? VIO : 'rgba(255,255,255,.25)'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 5, y); c.lineTo(x, y + 5); c.lineTo(x - 5, y); c.closePath(); c.stroke(); c.fill(); c.restore(); } }
    if (M.end) drawBrain(c, FX, B, T, t);
  }

  /* ---- the end: its nerves curl in, it shrinks to a pearl; the pet's shadow stays facing it, then turns back ---- */
  function stepEnd(FX, M, dt) {
    const E = M.end, B = M.B, me = FX.me; E.t += dt;
    if (!E.set) { E.set = 1; setMode(B, ALL, 'curl'); B.spTo = 0; B.zTo = 3.8; B.whiteTo = 1; if (M.F) { M.F.aTo = 0; } M.eyesTo = 0; }
    B.s = lerp(1, 0.05, ease(clamp01((E.t - 0.9) / 2.3))); B.fis = 1;
    if (E.t > 3.2 && !E.pearl) { E.pearl = 1; chime(FX, 1318, 0.8); }
    if (E.t > 2.2) { const toward = Math.atan2(B.y - me.y, B.x - me.x); if (!E.sh) E.sh = { a: toward, k: 0 }; const u = ease(clamp01((E.t - 4.6) / 0.9)); E.sh.a = toward + Math.PI * u; E.sh.k = Math.min(1, (E.t - 2.2) / 0.5) * (1 - clamp01((E.t - 6.0) / 0.8)); }
    if (E.t > 6.4) B.aTo = 0;
  }

  /* ---- the dream round it: an impossible cathedral bending to one vast pupil; later, a pale sky full of closing eyes ---- */
  const EYES = (() => { const Rn = mulberry32(404), out = []; for (let i = 0; i < 12; i++) out.push({ x: 0.06 + Rn() * 0.88, y: 0.05 + Rn() * 0.6, r: 0.05 + Rn() * 0.08, d: 0.03 + Rn() * 0.06, rank: Rn(), rot: (Rn() - 0.5) * 0.3 }); out.sort((a, b) => a.r - b.r); return out; })();
  // the still parts of each sky are painted once, at the sky's own resolution, and laid down with a little parallax
  const skyCache = {};
  function cached(key, c, W2, H2, paint) {
    const k = Math.max(0.1, Math.abs(c.getTransform ? c.getTransform().a : 1)), mg = 0.06, w = Math.ceil(W2 * (1 + 2 * mg) * k), h = Math.ceil(H2 * (1 + 2 * mg) * k), id = w + 'x' + h;
    let e = skyCache[key]; if (!e || e.id !== id) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.scale(k, k); g.translate(W2 * mg, H2 * mg); paint(g, W2 * mg, H2 * mg); e = skyCache[key] = { id, cv, mg }; }
    return e;
  }
  function layDown(c, e, W2, H2, ox, oy) { const mx = W2 * e.mg, my = H2 * e.mg; c.drawImage(e.cv, -mx + Math.max(-mx, Math.min(mx, ox)), -my + Math.max(-my, Math.min(my, oy)), W2 + 2 * mx, H2 + 2 * my); }
  function cathedral(c, W2, H2, t, px, py) {
    layDown(c, cached('cathedral', c, W2, H2, (g, mx, my) => cathedralStill(g, W2, H2, mx, my)), W2, H2, -px * 0.02, -py * 0.015);
    c.fillStyle = 'rgba(210,180,255,.5)'; for (let i = 0; i < 46; i++) { const x = ((i * 137 + t * 6 - px * 0.1) % W2 + W2) % W2, y = ((i * 59 + t * (4 + i % 3)) % H2); c.fillRect(x, y, 1.3, 1.3); }
  }
  function cathedralStill(c, W2, H2, mx, my) {
    const t = 0, px = 0, py = 0; let g = c.createLinearGradient(0, 0, 0, H2); g.addColorStop(0, '#06030C'); g.addColorStop(0.5, '#140A22'); g.addColorStop(1, '#26122F'); c.fillStyle = g; c.fillRect(-mx, -my, W2 + 2 * mx, H2 + 2 * my);
    const ex = W2 * 0.5 - px * 0.015, ey = H2 * 0.18 - py * 0.015, er = Math.min(W2, H2) * 0.27;
    // the vault's ribs radiate from the pupil and fall away to the edges of the world, columns rising to meet them
    c.save(); c.lineCap = 'round';
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + 0.1, x1 = ex + Math.cos(a) * W2 * 1.1, y1 = ey + Math.sin(a) * H2 * 1.2 + H2 * 0.25, cxp = ex + Math.cos(a + 0.35) * er * 2.4, cyp = ey + Math.sin(a + 0.35) * er * 2.4;
      c.strokeStyle = '#0A0612'; c.lineWidth = 9 + (i % 3) * 3; c.beginPath(); c.moveTo(ex + Math.cos(a) * er * 1.05, ey + Math.sin(a) * er * 1.05); c.quadraticCurveTo(cxp, cyp, x1, y1); c.stroke(); c.strokeStyle = 'rgba(120,90,160,.22)'; c.lineWidth = 1.5; c.stroke(); }
    for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
      const bx = W2 / 2 + side * (W2 * 0.16 + i * W2 * 0.08) - px * (0.04 + i * 0.01), by = H2 * 1.05, tx = ex + side * er * (1.0 + i * 0.16), ty = ey + er * (0.25 + i * 0.07), cxp = bx - side * (14 + i * 9), cyp = H2 * (0.42 - i * 0.02), w = 12 + i * 6, pts = [];
      for (let k = 0; k <= 12; k++) { const u = k / 12, a2 = (1 - u) * (1 - u), b2 = 2 * u * (1 - u), d2 = u * u; pts.push([a2 * bx + b2 * cxp + d2 * tx, a2 * by + b2 * cyp + d2 * ty]); }
      c.beginPath(); TN.ribbon(pts, u => w * (1 - 0.78 * u))(c); c.fillStyle = i % 2 ? '#0B0713' : '#0E0918'; c.fill(); c.strokeStyle = 'rgba(110,80,150,.28)'; c.lineWidth = 1.2; c.stroke();
      // a lancet window glowing faintly in each
      const wp = pts[5]; c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(150,90,230,${0.12 + 0.06 * Math.sin(t * 0.7 + i + side)})`; c.beginPath(); c.moveTo(wp[0] - w * 0.18, wp[1] + w * 0.9); c.lineTo(wp[0] - w * 0.18, wp[1]); c.quadraticCurveTo(wp[0], wp[1] - w * 0.45, wp[0] + w * 0.18, wp[1]); c.lineTo(wp[0] + w * 0.18, wp[1] + w * 0.9); c.closePath(); c.fill(); c.restore();
    }
    c.restore();
    // the pupil: vast, wet, unmoving; a violet iris of fibres round it
    c.save(); c.translate(ex, ey);
    let gr = c.createRadialGradient(0, 0, er * 0.5, 0, 0, er * 1.05); gr.addColorStop(0, '#2A1046'); gr.addColorStop(0.7, '#5A2A8A'); gr.addColorStop(1, '#1A0A26'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, er, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(200,160,255,.25)'; c.lineWidth = 1.4; c.beginPath(); for (let i = 0; i < 96; i++) { const a = i / 96 * TAU + Math.sin(i * 7.3) * 0.04, r0 = er * 0.55, r1 = er * (0.86 + 0.1 * Math.sin(i * 3.1)); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a + 0.05) * r1, Math.sin(a + 0.05) * r1); } c.stroke();
    c.fillStyle = '#020104'; c.beginPath(); c.arc(0, 0, er * 0.54, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(10,4,16,.9)'; c.lineWidth = er * 0.06; c.beginPath(); c.arc(0, 0, er * 0.99, 0, TAU); c.stroke();
    c.globalCompositeOperation = 'lighter'; gr = c.createRadialGradient(0, 0, er * 0.9, 0, 0, er * 1.5); gr.addColorStop(0, 'rgba(150,90,230,.25)'); gr.addColorStop(1, 'rgba(150,90,230,0)'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, er * 1.5, 0, TAU); c.fill();
    c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-er * 0.28, -er * 0.3, er * 0.12, er * 0.07, -0.6, 0, TAU); c.fill();
    c.restore();
  }
  function skyEye(c, x, y, r, o, t, e, look) {
    c.save(); c.translate(x, y); c.rotate(e.rot); const h = r * 0.5 * o;
    c.fillStyle = 'rgba(150,120,190,.35)'; c.beginPath(); c.ellipse(0, r * 0.06, r * 1.25, r * 0.62, 0, 0, TAU); c.fill();
    if (o > 0.04) { c.save(); c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(0, -h * 2, r, 0); c.quadraticCurveTo(0, h * 2, -r, 0); c.closePath(); c.fillStyle = '#FBF8FF'; c.fill(); c.clip();
      const ix = look[0] * r * 0.25, iy = look[1] * r * 0.15; c.fillStyle = '#7A4AC0'; c.beginPath(); c.arc(ix, iy, r * 0.42, 0, TAU); c.fill(); c.fillStyle = '#4A2280'; c.beginPath(); c.arc(ix, iy, r * 0.3, 0, TAU); c.fill(); c.fillStyle = '#05020A'; c.beginPath(); c.arc(ix, iy, r * 0.17, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(ix - r * 0.12, iy - r * 0.1, r * 0.06, 0, TAU); c.fill();
      c.fillStyle = 'rgba(120,90,160,.3)'; c.fillRect(-r, -h * 2, r * 2, h * 0.8); c.restore(); }
    // the lids and lashes, meeting as it closes
    c.strokeStyle = '#6A5A88'; c.lineWidth = Math.max(1.2, r * 0.07); c.lineCap = 'round'; c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(0, -h * 2, r, 0); c.stroke(); c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(0, h * 2, r, 0); c.stroke();
    if (o < 0.5) { c.lineWidth = Math.max(1, r * 0.04); for (let i = 1; i < 7; i++) { const u = i / 7, lx = -r + u * r * 2, ly = (1 - Math.pow(2 * u - 1, 2)) * h; c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + (u - 0.5) * r * 0.2, ly + r * 0.16); c.stroke(); } }
    c.restore();
  }
  function paleSky(c, W2, H2, t, px, py, M) {
    layDown(c, cached('pale', c, W2, H2, (g, mx, my) => { const gr0 = g.createLinearGradient(0, 0, 0, H2); gr0.addColorStop(0, '#F2ECF8'); gr0.addColorStop(0.55, '#DCD0EA'); gr0.addColorStop(1, '#B8A6D0'); g.fillStyle = gr0; g.fillRect(-mx, -my, W2 + 2 * mx, H2 + 2 * my);
      g.globalAlpha = 0.5; for (let i = 0; i < 7; i++) { const y = H2 * (0.12 + i * 0.12), x = ((i * 211) % (W2 + 400)) - 200, gr = g.createRadialGradient(x, y, 10, x, y, 220); gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - 220, y - 120, 440, 240); } g.globalAlpha = 1; }), W2, H2, -px * 0.03, -py * 0.02);
    const open = M.eyes == null ? 1 : M.eyes, S = Math.min(W2, H2);
    EYES.forEach(e => { const x = e.x * W2 - px * e.d, y = e.y * H2 - py * e.d * 0.5, r = e.r * S, o = clamp01((open - e.rank * 0.85) / 0.15) * (0.92 + 0.08 * Math.sin(t * 0.6 + e.rank * 9)), dx = W2 / 2 - x, dy = H2 * 0.8 - y, d = Math.hypot(dx, dy) || 1; skyEye(c, x, y, r, o, t, e, [dx / d, dy / d]); });
  }

  return {
    arenaR: 13.5, firstAct: 'float', artY: 0.86, ambient: 'motes',
    // (its floor is a solid disc: the sky behind it is not copied in the rows it spans)
    floorDisc: true,
    // for the tests: its attacks, to be played one at a time
    _prof: PROF,
    _t: { nerveLash, intrusive, tide, conductor, lieAlone, falseAwakening, twinTides, recurring, stitch, racing, doubleLash, sever, premonition, memory, watchers, collapse, unspokenName, patZone, drawTide, drawGaze, drawAir, R, OR, RR, GK },
    drawBrain,
    artPoses: [{ name: 'I · the Listening Mind', mem: {} }, { name: 'Nerve Lash: raised', mem: { tm: { 1: 'raise', 2: 'raise' } } }, { name: 'the circuit closed: its core', mem: { pose: { sp: 1.25 } } },
      { name: 'II · the lie', mem: { pose: { ghost: 1, a: 0.8 } }, lv: 2 }, { name: 'III · legs up, its fissure white', mem: { pose: { white: 1, fis: 1 }, tm: 'spider' }, lv: 3 }, { name: 'the bonds broken', mem: { pose: { white: 1, fis: 1 }, tm: { 0: 'limp', 1: 'limp', 2: 'spider', 3: 'spider', 4: 'limp', 5: 'limp', 6: 'spider', 7: 'spider' }, darkT: [0, 1, 4, 5] }, lv: 3 },
      { name: 'the core bare', mem: { pose: { sp: 1.35, white: 1, fis: 1, z: 3.6 }, tm: 'spider' }, lv: 3 }, { name: 'curling in', mem: { pose: { s: 0.45, white: 1 }, tm: 'curl' } }, { name: 'a pearl', mem: { pose: { s: 0.06, white: 1 }, tm: 'curl' } }],
    phaseNames: ['The Listening Mind', 'The Divided Dream', 'The Mind That Dreams You'],
    props(C) { return Array.from({ length: 10 }, (_, i) => { const p = obAt(C, i); return { kind: 'paleOb', i, x: p.x, y: p.y + 0.55 }; }); },
    /* ---- the floor: a rose window laid in stone, two rings of pointed panes of dark violet glass round a carved closed eye ---- */
    paintGround(c, A) {
      const rnd = A.rnd, Rr = A.R;
      let g = c.createRadialGradient(0, 0, Rr - 0.6, 0, 0, Rr + 1.4); g.addColorStop(0, 'rgba(14,8,20,.9)'); g.addColorStop(1, 'rgba(14,8,20,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, Rr + 1.4, 0, TAU); c.fill();
      g = c.createRadialGradient(-2, -3, 1, 0, 0, Rr); g.addColorStop(0, '#3A3044'); g.addColorStop(1, '#201828'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, Rr, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.arc(0, 0, Rr, 0, TAU); c.clip(); c.globalAlpha = 0.9; c.fillStyle = GK.pat('stone', 3.4 / 256, 0, 0); c.fillRect(-Rr, -Rr, Rr * 2, Rr * 2); c.globalAlpha = 0.45; c.fillStyle = GK.pat('stain', 7 / 256, 3, 1); c.fillRect(-Rr, -Rr, Rr * 2, Rr * 2); c.restore();
      // a pointed pane: straight sides, an arch at its outer end
      const pane = (a0, a1, r0, r1) => { const am = (a0 + a1) / 2, rs = r1 - (r1 - r0) * 0.28; c.beginPath(); c.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0); c.lineTo(Math.cos(a0) * rs, Math.sin(a0) * rs); c.quadraticCurveTo(Math.cos(a0) * r1, Math.sin(a0) * r1, Math.cos(am) * r1, Math.sin(am) * r1); c.quadraticCurveTo(Math.cos(a1) * r1, Math.sin(a1) * r1, Math.cos(a1) * rs, Math.sin(a1) * rs); c.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0); c.arc(0, 0, r0, a1, a0, true); c.closePath(); };
      const glass = ['#140A20', '#1A0C2A', '#10081A', '#201032', '#170A24', '#261238'];
      [[12, 2.9, 6.1, 0.035], [24, 6.7, 10.4, 0.022]].forEach(([n, r0, r1, gp], ring) => { for (let i = 0; i < n; i++) { const a0 = i / n * TAU + gp, a1 = (i + 1) / n * TAU - gp, col = glass[(i * 7 + ring * 3) % glass.length];
        c.save(); pane(a0, a1, r0, r1); c.clip(); const am = (a0 + a1) / 2, gr = c.createRadialGradient(Math.cos(am) * (r0 + r1) / 2, Math.sin(am) * (r0 + r1) / 2, 0.2, Math.cos(am) * (r0 + r1) / 2, Math.sin(am) * (r0 + r1) / 2, (r1 - r0) * 0.8); gr.addColorStop(0, GK.mixC(col, '#8A60C0', 0.28)); gr.addColorStop(1, col); c.fillStyle = gr; c.fillRect(-Rr, -Rr, Rr * 2, Rr * 2);
        c.globalAlpha = 0.28; c.fillStyle = GK.pat('crystal', 2.4 / 256, i * 0.37, ring * 1.3); c.fillRect(-Rr, -Rr, Rr * 2, Rr * 2); c.globalAlpha = 1;
        // the leading that holds the glass, a streak of light across it
        c.strokeStyle = 'rgba(8,4,12,.85)'; c.lineWidth = 0.07; for (let k = 1; k < 3; k++) { const rr = r0 + (r1 - r0) * k / 3; c.beginPath(); c.arc(0, 0, rr, a0, a1); c.stroke(); } c.beginPath(); c.moveTo(Math.cos(am) * r0, Math.sin(am) * r0); c.lineTo(Math.cos(am) * r1, Math.sin(am) * r1); c.stroke();
        c.strokeStyle = 'rgba(255,240,255,.07)'; c.lineWidth = 0.12; c.beginPath(); c.moveTo(Math.cos(a0 + 0.02) * (r0 + 0.4), Math.sin(a0 + 0.02) * (r0 + 0.4)); c.lineTo(Math.cos(am) * (r1 - 0.6), Math.sin(am) * (r1 - 0.6)); c.stroke(); c.restore();
        pane(a0, a1, r0, r1); c.strokeStyle = '#3A3244'; c.lineWidth = 0.26; c.stroke(); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 0.08; c.stroke(); } });
      // the outer band of flagstones, and the low wall round the edge
      for (let k = 0; k < 32; k++) { const a0 = k / 32 * TAU + 0.01, a1 = (k + 1) / 32 * TAU - 0.01, tone = 52 + Math.floor(rnd() * 18); c.fillStyle = `rgba(${tone},${tone - 8},${tone + 10},.55)`; c.beginPath(); c.arc(0, 0, Rr - 0.7, a0, a1); c.arc(0, 0, 10.9, a1, a0, true); c.closePath(); c.fill(); c.strokeStyle = 'rgba(6,2,10,.7)'; c.lineWidth = 0.08; c.stroke(); }
      c.strokeStyle = '#463C52'; c.lineWidth = 0.6; c.beginPath(); c.arc(0, 0, Rr - 0.35, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 0.08; c.beginPath(); c.arc(0, 0, Rr - 0.6, 0, TAU); c.stroke();
      c.fillStyle = '#5A506A'; for (let k = 0; k < 64; k++) { const a = k / 64 * TAU; c.fillRect(Math.cos(a) * (Rr - 0.35) - 0.12, Math.sin(a) * (Rr - 0.35) - 0.12, 0.24, 0.24); }
      // the heart of the rose: a closed eye carved in a ring of dark stone, a thread of violet in the cut
      g = c.createRadialGradient(-0.5, -0.5, 0.2, 0, 0, 2.7); g.addColorStop(0, '#4A4054'); g.addColorStop(1, '#2A2232'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 2.7, 0, TAU); c.fill(); c.strokeStyle = '#0A0610'; c.lineWidth = 0.18; c.stroke();
      c.lineCap = 'round'; c.strokeStyle = 'rgba(0,0,0,.75)'; c.lineWidth = 0.16; c.beginPath(); c.moveTo(-1.7, 0); c.quadraticCurveTo(0, -1.0, 1.7, 0); c.quadraticCurveTo(0, 0.55, -1.7, 0); c.stroke();
      for (let i = 1; i < 8; i++) { const u = i / 8, x = -1.7 + u * 3.4, y = (1 - Math.pow(2 * u - 1, 2)) * 0.28; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (u - 0.5) * 0.4, y + 0.45); c.stroke(); }
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(185,140,255,.45)'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(-1.7, 0); c.quadraticCurveTo(0, 0.55, 1.7, 0); c.stroke(); c.globalCompositeOperation = 'source-over';
    },
    sky(c, W2, H2, t, cam, T, FX) {
      const M = (FX && FX.mem) || {}, k = clamp01(M.skyK || 0), px = cam ? (cam.x - 28) * T : 0, py = cam ? (cam.y - 28) * T : 0;
      if (k < 0.999) cathedral(c, W2, H2, t, px, py);
      if (k > 0.001) { c.save(); c.globalAlpha = k; paleSky(c, W2, H2, t, px, py, M); c.restore(); }
    },
    overlay(c, FX, t, T) { const M = FX.mem; if (!M.B || !M.ob) return; drawFloor(c, FX, M, T, t); },
    /* ---- the fight ---- */
    init(FX) {
      const M = FX.mem, m = FX.m, C = FX.C; m.x = C.x; m.y = C.y - 0.8; m.noTouch = true; m.r = 2.2;
      ensure(M, m, C); Object.assign(M, { cyc: 0, gap: 1.8, sigCd: 9, job: null, open: 0, orb: 0, nameCd: 0, lieFirst: false });
    },
    phase(FX, p, lv) {
      const M = FX.mem, B = M.B; M.job = null; GK.clearWarns(FX); M.thoughts = []; M.tides = []; M.stitch = null; M.pre = null; M.ghost = null; M.watch = null; M.cyc = 0; M.gap = 0.8; M.open = 0; FX.m.stunT = 0;
      if (M.cond) { M.cond.ob.forEach(i => { M.ob[i].lit = 0; M.ob[i].charge = 0; }); M.cond = null; }
      endSever(FX, M); B.spTo = 0; B.zTo = ZC; setMode(B, ALL, 'rest');
      if (lv === 2) { M.trans = { k: 'lie', t: 0 }; M.lieFirst = true; M.sigCd = 15; FX.H.banner('THE DIVIDED DREAM', 'Its obelisks cast two shadows. A second mind opens beside it.', VIO, 3, true); }
      if (lv === 3) { M.trans = { k: 'wake', t: 0 }; M.sigCd = 0; FX.H.banner('THE MIND THAT DREAMS YOU', 'The cathedral is gone. Its nerves rise.', PALE, 3, true); }
    },
    ai(FX, m, dt) {
      const M = FX.mem, lv = FX.S.lv; M.gap -= dt; M.sigCd -= dt;
      if (M.trans || M.end) return;
      if (lv === 3 && !M.name && !M.bare && M.nameCd <= 0 && m.hp <= m.maxhp * 0.15) { const J = unspokenName(FX, m); J.name = 'unspokenName'; M.job = J; return; }
      if (M.job) { if (GK.stepJob(FX, m, M.job, dt)) endJob(FX); }
      else if (M.gap <= 0) M.job = pickJob(FX, m, lv);
    },
    stunned(FX, m, dt) {},
    update(FX, dt) {
      const M = FX.mem, m = FX.m; if (!m) return; ensure(M, m, FX.C); const lv = FX.S.lv, t = FX.S.t, B = M.B, me = FX.me, frozen = FX.g && (FX.g.stopT > 0 || FX.g.cineT > 0);
      // the turns between its stages
      if (M.trans) { const T2 = M.trans; T2.t += dt;
        if (T2.k === 'lie') { if (!T2.set) { T2.set = 1; M.orb = Math.random() < 0.5 ? 0 : Math.PI; const ca = Math.cos(M.orb), sa = Math.sin(M.orb) * 0.7; M.F = mkBrain(FX.C.x - ca * 3.2, FX.C.y - 0.6 - sa * 3.2, { ghost: 1, a: 0, aTo: 0.8 }); M.ob.forEach(o => { if (o.i < 6) o.dbl = 0.01; }); hollow(FX, 330); }
          M.ob.forEach(o => { if (o.i < 6 && o.dbl) o.dbl = T2.t < 2.0 ? Math.min(1, T2.t / 0.8) : Math.max(0.01, 1 - (T2.t - 2.0) / 0.8); }); if (T2.t > 2.8) { M.trans = null; M.ob.forEach(o => { o.dbl = 0; }); } }
        if (T2.k === 'wake') { if (!T2.set) { T2.set = 1; if (M.F) { M.F.merge = 1; M.F.aTo = 0; } setMode(B, ALL, 'spider'); B.whiteTo = 1; B.fis = 1; B.zTo = Z3; M.skyTo = 1; M.ob.forEach(o => { if (o.i < 6) { o.sinkTo = 1; o.lit = 0; o.charge = 0; } }); const S = sfx(FX); if (S.hum) S.hum(); }
          if (T2.t > 2.6) { M.trans = null; M.F = null; } }
      }
      moveBrains(FX, M, m, dt, t);
      if (M.open > 0) { M.open -= dt; if (M.open <= 0) closeUp(FX, M); }
      M.nameCd -= dt;
      // the lie returns after it was severed
      if (M.lieBack > 0) { M.lieBack -= dt; if (M.lieBack <= 0 && lv === 2 && M.F) { M.F.aTo = 0.8; M.F.gone = 0; say(FX, M.F, 'The lie returns', LIEC); hollow(FX, 440); } }
      stepBrain(FX, B, dt, t); if (M.F) { stepBrain(FX, M.F, dt, t); if (M.F.gone && M.F.a < 0.02 && lv >= 3) M.F = null; }
      if (!frozen) { stepThoughts(FX, M, dt); stepTides(FX, M, dt); stepGhost(FX, M, dt); stepWatch(FX, M, dt); }
      GK.stepVfx(M, dt);
      // the obelisks rise and sink; standing, they bar the way
      const W = [];
      for (const o of M.ob) { o.sink += Math.sign(o.sinkTo - o.sink) * Math.min(Math.abs(o.sinkTo - o.sink), dt / 1.3); o.flash = Math.max(0, (o.flash || 0) - dt * 1.5); if (o.sink < 0.6) W.push({ x: o.x, y: o.y, r: 0.8 }); }
      if (M.stitch && M.stitch.on) M.stitch.links.forEach(L => { if (!L.off) W.push(L.w || (L.w = { x0: L.x0, y0: L.y0, x1: L.x1, y1: L.y1, hw: 0.3, sting: m.dmg * 0.4, cd: 0.9 })); });
      M.walls = W; GK.walls(FX, W);
      // the way the pet has walked, for Unwanted Memory
      M.trailT -= dt; if (M.trailT <= 0) { M.trailT = 0.1; M.trail.push([me.x, me.y]); if (M.trail.length > 36) M.trail.shift(); }
      // it will not fall before its name goes unspoken
      if (!M.bare && !M.end && !m.dead && m.hp < m.maxhp * 0.03) m.hp = m.maxhp * 0.03;
      // the sky: the cathedral fades for a pale sky; its eyes close as it weakens, open wide for the name, close bond by bond
      M.skyK += ((M.skyTo || 0) - M.skyK) * Math.min(1, dt * 0.8);
      if (lv >= 3 && !M.name && !M.end && !M.watch) M.eyesTo = 0.25 + 0.75 * clamp01((m.hp / m.maxhp - 0.12) / 0.23);
      M.eyes += ((M.eyesTo == null ? 1 : M.eyesTo) - M.eyes) * Math.min(1, dt * 1.2);
      syncLie(FX, M);
      if (M.end) stepEnd(FX, M, dt);
      bodyParts(FX, m);
    },
    camFocus(FX, m) { const M = FX.mem, B = M.B; if (!B) return null; if (M.end) return M.end.t < 8.5 ? { x: B.x, y: B.y - B.z * CE * 0.7, k: 0.7, zoom: 0.72 } : null; if (m.dead || m.act === 'enter') return null; if (FX.S.lv === 2 && M.F) return { x: FX.C.x, y: FX.C.y - ZC * CE * 0.8, k: 0.36, zoom: 0.6 }; return { x: B.x, y: B.y - B.z * CE * 0.8, k: 0.38, zoom: 0.62 }; },
    dmgK(FX, m, o) { const M = FX.mem; if (M.end) return 0; if (M.bare) return 2.2; if (M.name) return 0.15; if (M.open > 0) return 1.6; if (m.stunT > 0) return 1.3; return 0.65; },
    // it cannot die while its name may still be spoken
    holdOn(FX, m) { const M = FX.mem; if (M.end || M.bare) return false; m.hp = m.maxhp * 0.03; return true; },
    draw(c, FX, m, X, Y, T, t) { const M = FX.mem; if (M.end) return; ensure(M, m, FX.C); const B = M.B; if (B.tents.some(N => !N.init)) stepTents(B, 0, t); drawBrain(c, { sx: x => X + (x - m.x) * T, sy: y => Y + (y - m.y) * T, Tz: () => T }, B, T, t); },
    drawProp(c, FX, p, X, Y, T, t) {
      const M = FX.mem; if (!M.ob) M.ob = makeObelisks(FX.C);
      if (p.kind === 'paleOb') return drawObelisk(c, FX, M.ob[p.i], T, t);
      if (p.kind === 'paleLie' && M.F) drawBrain(c, FX, M.F, T, t);
    },
    drawFx(c, FX, T, t) { const M = FX.mem; if (!M.B || !M.ob) return; drawAir(c, FX, M, T, t); },
    ending(FX, m) {
      const M = FX.mem; ensure(M, m, FX.C); GK.clearWarns(FX); M.job = null; M.thoughts = []; M.tides = []; M.stitch = null; M.pre = null; M.ghost = null; M.watch = null; M.name = null; M.walls = []; endSever(FX, M); M.end = { t: 0 };
      M.ob.forEach(o => { if (o.i >= 6) o.sinkTo = 1; o.lit = 0; o.charge = 0; });
      return { title: 'THE PALE INTELLECT IS UNDREAMT', sub: 'For a moment your shadow stays facing it. Then it turns back.', col: '#E8DCFF', delay: 8, bannerAt: 5.4, fanfareAt: 5.4, quiet: true, slow: 0.4 };
    },
  };
})();
