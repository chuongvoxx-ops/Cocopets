/* ---------- Lightning, reworked: Butterfly Tempest, Worldsplitter (the ninth and tenth Ultimates) ----------
   Butterfly Tempest: razor-winged lightning butterflies, each four wing lobes (two forewings, two hindwings) drawn from
   pictures made once (a translucent violet-to-ice membrane, branching white veins, a razor white leading edge with sparkles;
   three vein variants flicker between them), flapping with the hindwings a beat behind, banking into turns and folding back
   into narrow blades to strike. They spiral up round the pet, peel off at the monsters (flutter, bank, accelerate, strike),
   reform past them and gather: at Hatchling 6 that merge into one great butterfly for a finishing pass; at Adept 12 in
   braided pairs, the great one shadowed by a second wing outline; at Celestial 24 in four waves whose returning trails draw
   the outline of an enormous butterfly in the air before its body appears, its wings open in two stages on branching veins,
   and one wingbeat launches it through the monsters trailing violet streamers; it breaks into slowly turning wing fragments.
   Worldsplitter: the pet strikes the floor and a needle-thin violet fault races forward through the monsters (pulses moving
   beneath it), branching (2 short side branches, 4 alternating at Adept, 6 sweeping at Celestial, where light first races
   along every path). It ignites from the pet outward: each segment erupts into a vertical sheet of lightning (cached sheet
   pictures stretched over each segment: white-hot at the leading edge, softening to translucent violet and collapsing into
   sparks), a bolt riding the front, arcs leaping across the opening, fragments lifting along its sides; twin sheets on the
   main fault from Adept. At the far end a crest (at Celestial a colossal forked crest that folds forward in a final
   discharge); the fault then fades (at Celestial it seals from the far end back toward the pet), leaving floating sparks and
   fading violet traces only. Nothing is drawn over the pet (its body is cut out of every draw). */
(() => {
  const U = ELEM_IMPL.thunder.ult, TAU = Math.PI * 2, P = TK.P;
  let H, K;
  const cl = u => Math.max(0, Math.min(1, u)), lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, eo = u => { u = cl(u); return 1 - (1 - u) * (1 - u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const bz = (a, b, c2, u) => { const v = 1 - u; return v * v * a + 2 * v * u * b + u * u * c2; };
  const wrap = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  /* clip the rest of this draw to everything except the pet's body */
  function petHole(c, T) { const me = H.me, x = H.sx(me.x), y = H.sy(me.y) - T * 0.46; c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(x, y, T * 0.62, T * 0.72, 0, 0, TAU); c.clip('evenodd'); }
  /* how far along angle a from (x, y) the floor stays open, up to max tiles */
  function reach(x, y, a, max, r) { let L = 0.5; while (L < max && !H.X.blocked(x + Math.cos(a) * (L + 0.3), y + Math.sin(a) * (L + 0.3), r || 0.3, 0)) L += 0.25; return L; }

  /* ================= the butterfly ================= */
  /* a wing lobe in unit coordinates: u runs out from the root (0) to the tip (1), v across it (negative = the leading edge);
     a start point then (control, end) pairs of quadratic curves */
  const LOBE = { fore: [[0, -0.08], [0.42, -0.6], [1, -0.16], [0.86, 0.3], [0.42, 0.4], [0.14, 0.34], [0, 0.1]],
    hind: [[0, -0.1], [0.3, -0.6], [0.74, -0.42], [1.0, -0.2], [0.92, 0.12], [1.06, 0.4], [1.12, 0.62], [0.58, 0.4], [0, 0.12]] };
  const LP = {};
  function lobePts(kind) { if (LP[kind]) return LP[kind]; const q = LOBE[kind], o = [q[0]]; for (let i = 1; i + 1 < q.length; i += 2) { const p0 = q[i - 1], cc = q[i], p1 = q[i + 1]; for (let k = 1; k <= 8; k++) { const u = k / 8; o.push([bz(p0[0], cc[0], p1[0], u), bz(p0[1], cc[1], p1[1], u)]); } } return (LP[kind] = o); }
  const SS = 110, SB = 250, padOf = mode => (mode === 's' ? 10 : 20), sizeOf = mode => (mode === 's' ? SS : SB);
  /* a lobe's picture, made once: mode 's' small, 'b' big with branching veins and gold on the leading edge, 'p' big plain */
  function lobeSpr(kind, vari, mode) {
    const S = sizeOf(mode), pad = padOf(mode), w = Math.ceil(S * 1.2 + pad * 2), hh = Math.ceil(S * 1.36 + pad * 2);
    return fxSprite('tu5lobe|' + kind + vari + mode, w, hh, g => {
      const ox = pad, oy = hh / 2, pts = lobePts(kind), M = p => [ox + p[0] * S, oy + p[1] * S], big = mode !== 's';
      const shape = () => { g.beginPath(); pts.forEach((p, i) => { const q = M(p); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); };
      // the translucent membrane: deep violet at the root through violet and blue to an icy tip
      shape(); let gr = g.createLinearGradient(ox, oy, ox + S, oy - S * 0.1); gr.addColorStop(0, H.rgba(P.deep, 0.85)); gr.addColorStop(0.35, H.rgba(P.violet, 0.62)); gr.addColorStop(0.72, H.rgba(P.blue, 0.42)); gr.addColorStop(1, H.rgba(P.cyan, 0.5)); g.fillStyle = gr; g.fill();
      g.save(); shape(); g.clip(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
      // a sheen under the leading edge and a soft glow at the root (volume)
      gr = g.createLinearGradient(ox, oy - S * 0.55, ox, oy + S * 0.45); gr.addColorStop(0, H.rgba(P.cyan, 0.42)); gr.addColorStop(0.45, H.rgba(P.cyan, 0)); g.fillStyle = gr; g.fillRect(0, 0, w, hh);
      blitSized(g, glowSprite(P.violet), ox - S * 0.4, oy - S * 0.4, S * 0.8, S * 0.8);
      if (mode !== 'p') {
        // the electrical veins: a main vein to the tip, branches to the edge (the big ones branch again)
        const vein = (x0, y0, x1, y1, s, wd, jit) => { const pp = K.path(x0, y0, x1, y1, s, jit, Math.max(4, Math.round(Math.hypot(x1 - x0, y1 - y0) / (S * 0.07)))); g.strokeStyle = H.rgba(P.cyan, 0.5); K.line(g, pp, wd * 2.8); g.strokeStyle = H.rgba(P.white, 0.92); K.line(g, pp, wd); return pp; };
        const root = M([0.03, 0]), tip = M(kind === 'fore' ? [0.93, -0.13] : [0.86, 0.0]), wm = S * (big ? 0.011 : 0.016), mv = vein(root[0], root[1], tip[0], tip[1], 11 + vari * 17, wm * 1.4, S * 0.05);
        if (kind === 'hind') { const tl = M([1.05, 0.52]); vein(root[0], root[1] + S * 0.04, tl[0], tl[1], 5 + vari * 23, wm, S * 0.05); }
        const step = big ? 3 : 5;
        for (let i = step; i < pts.length - 2; i += step) { const e = M(pts[i]), mid = mv[Math.min(mv.length - 1, Math.max(1, Math.round((mv.length - 1) * (0.2 + 0.6 * R1(i * 3.7 + vari * 1.3)))))], sv = vein(mid[0], mid[1], lerp(e[0], mid[0], 0.05), lerp(e[1], mid[1], 0.05), i * 5 + vari * 31, wm * 0.85, S * 0.04);
          if (big) for (const dj of [-1, 1]) { const e2 = M(pts[Math.max(0, Math.min(pts.length - 1, i + dj))]), m2 = sv[Math.max(1, sv.length >> 1)]; vein(m2[0], m2[1], lerp(e2[0], m2[0], 0.08), lerp(e2[1], m2[1], 0.08), i * 7 + dj * 3 + vari * 11, wm * 0.5, S * 0.025); } }
        for (let i = 0; i < (big ? 9 : 4); i++) { const q = mv[1 + Math.floor(R1(i * 2.3 + vari) * (mv.length - 2))], r = S * (0.03 + 0.03 * R1(i + vari * 5)); blitSized(g, glowSprite(P.white), q[0] - r, q[1] - r, r * 2, r * 2); }
      }
      g.restore();
      // the edge: a cyan glow and a fine white line, then the razor leading edge (gold-lit on the big ones), then sparkles
      g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round'; g.lineCap = 'round';
      shape(); g.strokeStyle = H.rgba(P.cyan, 0.45); g.lineWidth = S * 0.06; g.stroke(); g.strokeStyle = H.rgba(P.white, 0.8); g.lineWidth = Math.max(1.2, S * 0.014); g.stroke();
      g.beginPath(); for (let i = 0; i <= 8; i++) { const q = M(pts[i]); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } if (big) { g.strokeStyle = H.rgba(P.gold, 0.75); g.lineWidth = S * 0.032; g.stroke(); } g.strokeStyle = P.white; g.lineWidth = S * 0.024; g.stroke();
      for (let i = 2; i < pts.length - 1; i += big ? 3 : 4) { const q = M(pts[i]), r = S * (0.045 + 0.04 * R1(i + vari * 7)); blitSized(g, glowSprite(big && i % 6 === 2 ? P.gold : P.white), q[0] - r, q[1] - r, r * 2, r * 2); g.strokeStyle = H.rgba(P.white, 0.9); g.lineWidth = Math.max(1, S * 0.008); g.beginPath(); g.moveTo(q[0] - r * 0.9, q[1]); g.lineTo(q[0] + r * 0.9, q[1]); g.moveTo(q[0], q[1] - r * 0.9); g.lineTo(q[0], q[1] + r * 0.9); g.stroke(); }
    });
  }
  /* a lobe's pose in the body frame (x forward): its angle out from the body, its length and width */
  function lobePose(kind, sz, fold, open) { return kind === 'fore' ? [lerp(1.0, 2.62, fold), sz * (1 + 0.32 * fold) * open, sz * 0.66 * (1 - 0.62 * fold)] : [lerp(2.0, 2.92, fold), sz * 0.82 * (1 + 0.15 * fold) * open, sz * 0.6 * (1 - 0.66 * fold)]; }
  function drawLobe(c, kind, vari, mode, ang, len, wid, fy, a) { if (a <= 0.01 || len < 1) return; const s = lobeSpr(kind, vari, mode), S = sizeOf(mode); c.save(); c.scale(1, fy); c.rotate(ang); c.scale(len / S, wid / S); c.globalAlpha = Math.min(1, a); c.drawImage(s, -padOf(mode), -s.height / 2); c.restore(); }
  /* a point of a lobe (unit p) in screen px about the butterfly's centre: the same transform drawLobe uses, turned by hd */
  function lobeXY(kind, side, p, sz, hd, fl, fold, open) { const [ang, len, wid] = lobePose(kind, sz, fold, open), x = p[0] * len, y = p[1] * wid, ca = Math.cos(ang), sa = Math.sin(ang), bx = x * ca - y * sa, by = (x * sa + y * ca) * side * fl, ch = Math.cos(hd), sh = Math.sin(hd); return [bx * ch - by * sh, bx * sh + by * ch]; }
  /* a lightning butterfly at screen (x, y), sz px a forewing, heading hd; fl / flH the forewing / hindwing spread (flap),
     fold 0..1 sweeps the wings back into blades; o: { mode, bank, open, vari } */
  function bfly(c, x, y, sz, hd, fl, flH, fold, a, o) {
    if (a <= 0.01 || sz < 1) return; o = o || {}; const mode = o.mode || 's', bank = o.bank || 0, open = o.open == null ? 1 : o.open, vari = o.vari || 0;
    K.glow(c, x, y, sz * 1.7, P.violet, 0.3 * a);
    c.save(); c.translate(x, y); c.rotate(hd);
    const f1 = lerp(fl, 0.95, fold), f2 = lerp(flH, 0.95, fold), hp = lobePose('hind', sz, fold, open), fp = lobePose('fore', sz, fold, open);
    for (const s of [1, -1]) { const bk = 1 - s * bank * 0.4; drawLobe(c, 'hind', vari, mode, hp[0], hp[1], hp[2], s * f2 * bk, a); drawLobe(c, 'fore', vari, mode, fp[0], fp[1], fp[2], s * f1 * bk, a); }
    // the body: a white-hot thorax in a cyan glow, antennae
    c.globalCompositeOperation = 'lighter'; K.glow(c, sz * 0.05, 0, sz * 0.6, P.cyan, 0.55 * a); K.glow(c, sz * 0.08, 0, sz * 0.26, P.white, 0.9 * a);
    c.globalAlpha = Math.min(1, a); c.lineCap = 'round'; c.strokeStyle = P.ice; c.lineWidth = Math.max(1.2, sz * (mode === 's' ? 0.13 : 0.07)); c.beginPath(); c.moveTo(-sz * 0.46, 0); c.lineTo(sz * 0.22, 0); c.stroke(); c.strokeStyle = P.white; c.lineWidth = Math.max(0.8, sz * (mode === 's' ? 0.06 : 0.025)); c.stroke(); if (mode !== 's') for (let k = 0; k < 4; k++) K.glow(c, -sz * (0.4 - k * 0.15), 0, sz * 0.1, k % 2 ? P.cyan : P.violet, 0.8 * a);
    c.strokeStyle = H.rgba(P.ice, 0.85); c.lineWidth = Math.max(0.6, sz * 0.03); c.beginPath(); c.moveTo(sz * 0.2, 0); c.quadraticCurveTo(sz * 0.45, sz * 0.04, sz * 0.58, sz * 0.24); c.moveTo(sz * 0.2, 0); c.quadraticCurveTo(sz * 0.45, -sz * 0.04, sz * 0.58, -sz * 0.24); c.stroke();
    if (fold > 0.3) { c.globalAlpha = Math.min(1, a * fold); c.strokeStyle = P.white; c.lineWidth = Math.max(1, sz * 0.05); for (const s of [1, -1]) { c.beginPath(); c.moveTo(sz * 0.1, 0); c.lineTo(Math.cos(fp[0]) * fp[1] * 0.95, s * Math.sin(fp[0]) * fp[1] * 0.95 * f1); c.stroke(); } }
    c.restore();
  }
  /* the outline of a butterfly's four lobes (the second wing outline; the drawn silhouette) */
  function outline(c, x, y, sz, hd, fl, fold, open, a, col) {
    if (a <= 0.01) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.beginPath();
    for (const s of [1, -1]) for (const kind of ['fore', 'hind']) { lobePts(kind).forEach((p, i) => { const q = lobeXY(kind, s, p, sz, hd, fl, fold, open); i ? c.lineTo(x + q[0], y + q[1]) : c.moveTo(x + q[0], y + q[1]); }); c.closePath(); }
    c.globalAlpha = Math.min(1, a); c.strokeStyle = H.rgba(col || P.violet, 0.4); c.lineWidth = Math.max(2, sz * 0.09); c.stroke(); c.strokeStyle = H.rgba(P.cyan, 0.6); c.lineWidth = Math.max(1.2, sz * 0.03); c.stroke(); c.strokeStyle = H.rgba(P.white, 0.7); c.lineWidth = Math.max(0.7, sz * 0.012); c.stroke(); c.restore();
  }
  /* a fading trail through screen points: violet haze, cyan body, a white head */
  function trail(c, pts, w, a) {
    if (pts.length < 2 || a <= 0.01) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    const run = (i0, lw, col, al) => { c.globalAlpha = al; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(pts[i0][0], pts[i0][1]); for (let i = i0 + 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); };
    const h2 = Math.floor(pts.length / 2); run(0, w * 1.1, P.violet, 0.3 * a); run(h2, w * 0.5, P.cyan, 0.6 * a); run(Math.max(0, pts.length - 4), w * 0.22, P.white, 0.9 * a); c.restore();
  }

  // LI-U09 Butterfly Tempest
  U.butterfly = (C, h) => {
    H = h; K = TK.bind(H); const me = H.me, ev = K.evo(C), L4 = ev >= 4, L7 = ev >= 7, DK = C.base * C.K * K.evoK(C);
    const N = L7 ? 24 : L4 ? [12, 16, 20][ev - 4] : [6, 8, 10][ev - 1], SZ = L7 ? 0.4 : 0.44, DA = L7 ? 0.5 : 0.55, HV = 0.7, RET = 0.45, TRD = 0.4;
    const ring = H.sortNear(me.x, me.y).filter(m => Math.hypot(m.x - me.x, m.y - me.y) < 8.5).slice(0, 8);
    let cx = C.tx, cy = C.ty; { const nr = ring.filter(m => Math.hypot(m.x - C.tx, m.y - C.ty) < 3.4); if (nr.length) { cx = nr.reduce((s, m) => s + m.x, 0) / nr.length; cy = nr.reduce((s, m) => s + m.y, 0) / nr.length; } }
    if (Math.hypot(cx - me.x, cy - me.y) < 1.5) { cx = me.x + Math.cos(C.a) * 3.5; cy = me.y + Math.sin(C.a) * 3.5; }
    const a = Math.atan2(cy - me.y, cx - me.x), dx = Math.cos(a), dy = Math.sin(a), cd = Math.hypot(cx - me.x, cy - me.y);
    const tg = ring.length ? ring : [0, 1, 2, 3].map(k => ({ fake: true, x: cx + Math.cos(a + (k - 1.5) * 0.9) * 1.2, y: cy + Math.sin(a + (k - 1.5) * 0.9) * 1.2 })), nt = tg.length;
    const bs = [];
    for (let i = 0; i < N; i++) {
      let tr, ti, braid = 0, bank;
      if (L7) { const w = Math.floor(i / 6), j = i % 6; tr = 0.52 + w * 0.32 + j * 0.03; ti = (j + w * 2) % nt; bank = (j % 2 ? 1 : -1) * (0.7 + 0.3 * (w % 2)); }
      else if (L4) { const p = i >> 1; tr = 0.5 + p * (0.95 / (N / 2 - 1 || 1)); ti = p % nt; braid = i % 2 ? 1 : -1; bank = braid * 0.55; }
      else { tr = 0.5 + i * (0.95 / (N - 1)); ti = i % nt; bank = i % 2 ? 0.8 : -0.8; }
      bs.push({ i, tb: 0.02 + i / N * (L7 ? 0.45 : 0.4), tr, ti, braid, bank, th0: i * 2.39996, hist: [], hd: -Math.PI / 2, ph: i * 1.7, bk: 0, A: null, hit: false, born: false, vari: i % 3 });
    }
    const teMax = Math.max(...bs.map(b => b.tr)) + DA;
    const M = { x: me.x + (cx - me.x) * 0.42, y: me.y + (cy - me.y) * 0.42, z: 1.7 };
    // Celestial: the enormous butterfly the returning trails draw, in the air between the pet and the monsters
    const GS = 2.1, G = { x: me.x + dx * Math.min(2.2, cd * 0.5), y: me.y + dy * Math.min(2.2, cd * 0.5), z: 2.7 }, chunks = [];
    if (L7) { for (const s of [1, -1]) for (const kind of ['fore', 'hind']) { const pts = lobePts(kind).map(p => lobeXY(kind, s, p, GS, -Math.PI / 2, 1, 0, 1)), n = pts.length - 1; for (let k = 0; k < 6; k++) chunks.push(pts.slice(Math.round(k / 6 * n), Math.round((k + 1) / 6 * n) + 1)); } bs.forEach((b, i) => { b.seg = chunks[(i * 5) % 24]; b.ts = b.tr + DA + RET; }); }
    const TM = teMax + 0.5, TF = TM + 0.55, DP = 0.6, TB = L7 ? Math.max(...bs.map(b => b.ts)) + TRD + 0.05 : 0, TL = TB + 0.95, DL = 0.45;
    const END = L7 ? TL + DL + 1.5 : TF + DP + 1.0, GSZ = L7 ? GS : L4 ? 1.35 : 1.1;
    const giant = { hist: [], ghost: [], hd: -Math.PI / 2, ph: 0, hit: false, frag: false, A: null };
    const frags = [], slashes = [];
    H.X.banner('BUTTERFLY TEMPEST', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.8;
    const spiral = (b, t) => { const u = cl((t - b.tb) / 0.9), th = b.th0 + (t - b.tb) * 3.3, r = 0.4 + 1.0 * sm(u); return { x: me.x + Math.cos(th) * r, y: me.y + Math.sin(th) * r * 0.78, z: 0.35 + 1.45 * eo(u) + 0.12 * Math.sin(t * 6 + b.i), fold: 0, fq: 9, a: cl((t - b.tb) / 0.15), sc: lerp(0.3, 1, eo((t - b.tb) / 0.35)) }; };
    /* a strike path: flutter (slow), bank (the curve), accelerate, strike (folded) at v = HV, reform past the target */
    const strike = (S, v, braid) => {
      if (v < HV) { const w = v / HV, s = w < 0.35 ? 0.3 * w : 0.105 + 0.895 * Math.pow((w - 0.35) / 0.65, 1.6); let x = bz(S.A.x, S.C1.x, S.P.x, s), y = bz(S.A.y, S.C1.y, S.P.y, s); if (braid) { const o = braid * 0.5 * Math.sin(s * TAU); x += S.nx * o; y += S.ny * o; } return { x, y, z: lerp(S.A.z, 0.5, Math.pow(s, 1.3)), fold: sm((s - 0.4) / 0.4), fq: w < 0.4 ? 14 : 6 }; }
      const w = (v - HV) / (1 - HV), e = eo(w); return { x: lerp(S.P.x, S.Q.x, e), y: lerp(S.P.y, S.Q.y, e), z: 0.5 + 0.6 * e, fold: 1 - sm((w - 0.15) / 0.6), fq: 10 };
    };
    const plan = (A, Pp, bank, out) => { const ddx = Pp.x - A.x, ddy = Pp.y - A.y, d = Math.hypot(ddx, ddy) || 1, nx = -ddy / d, ny = ddx / d, C1 = { x: A.x + ddx * 0.35 + nx * d * 0.5 * bank, y: A.y + ddy * 0.35 + ny * d * 0.5 * bank }, ix = Pp.x - C1.x, iy = Pp.y - C1.y, il = Math.hypot(ix, iy) || 1; return { A, C1, P: { x: Pp.x, y: Pp.y }, Q: { x: Pp.x + ix / il * out, y: Pp.y + iy / il * out }, nx, ny }; };
    const slot = (b, t) => { const ph = b.i / N * TAU + t * 1.6, r = 0.8 + 0.15 * Math.sin(ph * 3), k = t > TM ? eo((t - TM) / 0.3) : 0; return { x: M.x + Math.cos(ph) * r * (1 - k), y: M.y + Math.sin(ph) * r * 0.6 * (1 - k), z: M.z + 0.3 * Math.sin(ph * 2 + t) * (1 - k) }; };
    const toW = q => ({ x: G.x + q[0], y: G.y, z: G.z - q[1] });
    function bpos(b, t) {
      if (t < b.tb) return null;
      if (t < b.tr || !b.A) return spiral(b, t);
      const v = (t - b.tr) / DA; if (v < 1) return Object.assign(strike(b.S, v, b.braid), { a: 1, sc: 1 });
      const te = b.tr + DA, Q = b.S.Q, Qz = 1.1;
      if (!L7) { const s = slot(b, t), w = cl((t - te) / RET), e = H.ease.io(w), k = t > TM ? cl((t - TM) / 0.3) : 0, mx = (Q.x + s.x) / 2 - b.S.nx * b.bank * 0.8, my = (Q.y + s.y) / 2 - b.S.ny * b.bank * 0.8;
        if (k >= 1) return null; return { x: bz(Q.x, mx, s.x, e), y: bz(Q.y, my, s.y, e), z: bz(Qz, Math.max(Qz, s.z) + 0.6, s.z, e), fold: 0, fq: 7, a: 1 - k * k, sc: 1 - 0.6 * k }; }
      const st = toW(b.seg[0]);
      if (t < b.ts) { const w = H.ease.io(cl((t - te) / RET)), mx = (Q.x + st.x) / 2 - b.S.nx * b.bank, my = (Q.y + st.y) / 2 - b.S.ny * b.bank; return { x: bz(Q.x, mx, st.x, w), y: bz(Q.y, my, st.y, w), z: bz(Qz, (Qz + st.z) / 2 + 0.8, st.z, w), fold: 0, fq: 8, a: 1, sc: 1 }; }
      const pr = (t - b.ts) / TRD; if (pr > 1.25) return null;
      const n = b.seg.length - 1, f = Math.min(1, pr) * n, k = Math.min(n - 1, Math.floor(f)), u = f - k, q = [lerp(b.seg[k][0], b.seg[k + 1][0], u), lerp(b.seg[k][1], b.seg[k + 1][1], u)], wpt = toW(q);
      return { x: wpt.x, y: wpt.y, z: wpt.z, fold: 0.3, fq: 12, a: 1 - cl((pr - 1) / 0.25), sc: 1 - 0.4 * cl(pr - 0.6) };
    }
    /* the great butterfly: L1/L4 the merged one at M with a finishing pass; L7 the enormous one at G with its launch */
    function gpos(t) {
      if (!L7) { if (t < TM + 0.12) return null; const k = eo((t - TM - 0.12) / 0.35);
        if (t < TF) return { x: M.x, y: M.y, z: M.z + 0.12 * Math.sin(t * 3), sc: k, a: k, fold: 0, fq: 4, open: 1 };
        const v = (t - TF) / DP; if (v < 1) return Object.assign(strike(giant.S, v, 0), { a: 1, sc: 1, open: 1 });
        const w = (t - TF - DP) / 0.4; if (w > 1) return null; return { x: giant.S.Q.x, y: giant.S.Q.y, z: 1.1 + w * 0.5, fold: 0, fq: 3, a: 1 - w, sc: 1 + 0.2 * w, open: 1 }; }
      if (t < TB) return null; const o1 = eo((t - TB - 0.05) / 0.25), o2 = eo((t - TB - 0.35) / 0.3), bt = cl((t - TB - 0.7) / 0.25);
      let fl = lerp(0.3, 0.7, o1) + 0.3 * o2; if (bt > 0 && bt < 1) fl *= 1 - 0.85 * Math.sin(Math.min(1, bt * 1.6) * Math.PI) + (bt > 0.6 ? 0.15 * Math.sin((bt - 0.6) / 0.4 * Math.PI) : 0);
      const base = { sc: 1, open: lerp(0.15, 0.62, o1) + 0.38 * o2, fl, veins: o2, a: cl((t - TB) / 0.15) };
      if (t < TL) return Object.assign(base, { x: G.x, y: G.y, z: G.z + 0.08 * Math.sin(t * 2.5), fold: 0, fixHd: true });
      const v = (t - TL) / DL; if (v < 1) { const s = Math.pow(v, 1.7), S = giant.S; return Object.assign(base, { x: bz(S.A.x, S.C1.x, S.P.x, s), y: bz(S.A.y, S.C1.y, S.P.y, s), z: lerp(G.z, 0.8, s), fold: 0.45 * sm(v / 0.4), fl: 0.95, veins: 1 }); }
      const w = (t - TL - DL) / 0.35; if (w > 1) return null; return Object.assign(base, { x: giant.S.P.x, y: giant.S.P.y, z: 0.8 + 0.3 * w, fold: 0.45 * (1 - w), fl: 0.95, a: 1 - w, veins: 1 });
    }
    const scr = (p, T) => [H.sx(p.x), H.sy(p.y) - p.z * T];
    const hitAt = (b, x, y) => { const m = tg[b.ti]; H.hitArea(x, y, 0.95, DK * 7 / N, C.dmgO({ kb: 1, stun: m && m.boss ? 0.1 : 0.15 })); K.sparks(x, y - 0.5, 8, 6); K.motes(x, y - 0.5, 3); H.X.light(x, y, 1.6, 0.14); slashes.push({ x, y, z: 0.5, hd: b.hd, t0: 0 }); if (b.i % 3 === 0) H.X.sfx.crack(); };
    const spawnFrags = (p, sz, n) => { for (let i = 0; i < H.n(n); i++) { const b = Math.random() * TAU, r = Math.random() * sz * 0.9; frags.push({ x: p.x + Math.cos(b) * r, y: p.y + Math.sin(b) * r * 0.3, z: p.z + Math.sin(b) * r * 0.7, vx: Math.cos(b) * (0.4 + Math.random() * 0.6), vy: (Math.random() - 0.5) * 0.3, vz: 0.2 + Math.random() * 0.4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 2.2, kind: i % 2 ? 'fore' : 'hind', vari: i % 3, sz: sz * (0.18 + Math.random() * 0.22), life: 1.1 + Math.random() * 0.4, max: 1.5 }); } };
    H.add({ life: END,
      update(dt, f) { const t = f.t;
        if (t < 1.4) K.aura(me.x, me.y, 0.5, dt, 14, 0.8);
        for (const b of bs) {
          if (!b.born && t >= b.tb) { b.born = true; K.motes(me.x, me.y - 0.6, 3, { color: [P.violet, P.ice, P.violet], v: 1.2 }); H.glowAt(me.x, me.y - 0.9, 0.5, 0.25, P.violet, 0.6); }
          if (!b.A && t >= b.tr) { const sp = spiral(b, b.tr), m = tg[b.ti], live = m && !m.fake && !m.dead; b.A = sp; b.S = plan(sp, { x: live || m.fake ? m.x : cx, y: live || m.fake ? m.y : cy }, b.bank, 1.7); if (b.i % 2 === 0) H.X.sfx.whoosh(); }
          if (b.A && !b.hit && t >= b.tr + DA * HV) { b.hit = true; hitAt(b, b.S.P.x, b.S.P.y); }
          const p = bpos(b, t); b.p = p; if (!p) continue;
          b.ph += dt * p.fq * TAU * (1 - p.fold * 0.8);
          if (t >= b.tr) { b.hist.push([p.x, p.y, p.z]); if (b.hist.length > (L7 ? 16 : 12)) b.hist.shift(); if (Math.random() < 0.35 * H.Q()) H.P({ kind: 'spark', x: p.x, y: p.y - p.z, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5, life: 0.3, max: 0.3, size: 1.6, color: Math.random() < 0.5 ? P.violet : P.ice }); }
        }
        // the great butterfly
        if (!giant.S && (L7 ? t >= TL : t >= TF)) { const A = L7 ? { x: G.x, y: G.y, z: G.z } : { x: M.x, y: M.y, z: M.z }; giant.S = plan(A, L7 ? { x: cx + dx * 2.8, y: cy + dy * 2.8 } : { x: cx, y: cy }, L7 ? 0.15 : 0.5, 2.4); H.X.sfx.whoosh(); if (L7) { H.X.shake(6, 0.2); K.sparks(G.x, G.y - G.z, 16, 7); H.X.ring(G.x, G.y, 0.3, 3.2, 0.4, P.violet, 0.4); } }
        if (!L7 && !giant.merged && t >= TM + 0.25) { giant.merged = true; H.X.flash(0.08, P.ice); H.glowAt(M.x, M.y - M.z, 2.4, 0.4, P.cyan, 0.8); K.sparks(M.x, M.y - M.z, 18, 6); K.motes(M.x, M.y - M.z, 8); H.X.sfx.crack(); }
        if (L7 && !giant.body && t >= TB) { giant.body = true; H.glowAt(G.x, G.y - G.z, 2.6, 0.5, P.white, 0.7); K.motes(G.x, G.y - G.z, 10); H.X.sfx.hum(); }
        if (L7 && !giant.beat && t >= TB + 0.78) { giant.beat = true; H.X.sfx.whoosh(); H.X.shake(5, 0.2); K.motes(G.x, G.y - G.z, 14, { v: 3.5 }); }
        const hitT = L7 ? TL + DL * 0.62 : TF + DP * HV;
        if (giant.S && !giant.hit && t >= hitT) { giant.hit = true; const S = giant.S, w = L7 ? 2.6 : L4 ? 2.0 : 1.7, dmg = DK * (L7 ? 6.5 : 6);
          const ax = L7 ? S.A.x : M.x, ay = L7 ? S.A.y : M.y, ex = S.Q.x, ey = S.Q.y, la = Math.atan2(ey - ay, ex - ax), ll = Math.hypot(ex - ax, ey - ay);
          const hit = new Set(); for (const m of H.living()) { const rx = m.x - ax, ry = m.y - ay, al = rx * Math.cos(la) + ry * Math.sin(la), of = Math.abs(-rx * Math.sin(la) + ry * Math.cos(la)); if ((al > -m.r && al < ll + m.r && of < w / 2 + m.r) || Math.hypot(m.x - cx, m.y - cy) < 1.6 + m.r) hit.add(m); }
          for (const m of hit) { H.X.hitMon(m, dmg, C.dmgO({ kb: 3, stun: m.boss ? 0.6 : 0.6 })); K.sparks(m.x, m.y - 0.5, 8, 7); }
          K.zapAt(cx, cy, 2.2); K.goldSparks(cx, cy - 0.6, 12, 7); H.X.flash(L7 ? 0.14 : 0.1, P.ice); H.X.shake(L7 ? 12 : 8, 0.3); H.X.hitstop(0.05); H.X.sfx.crash(); slashes.push({ x: cx, y: cy, z: 0.6, hd: giant.hd, t0: 0, big: true }); }
        const gp = gpos(t); giant.p = gp;
        if (gp) { giant.ph += dt * TAU * (gp.fq || 3) * (1 - (gp.fold || 0)); giant.ghost.push([gp.x, gp.y, gp.z, giant.hd, gp.fl == null ? null : gp.fl, giant.ph, gp.fold, gp.sc, gp.open]); if (giant.ghost.length > 6) giant.ghost.shift();
          if ((L7 && t >= TL) || (!L7 && t >= TF)) { giant.hist.push([gp.x, gp.y, gp.z]); if (giant.hist.length > 18) giant.hist.shift(); }
          if (Math.random() < 0.6 * H.Q()) K.aura(gp.x, gp.y, GSZ * 0.6, dt, 22, gp.z); if (!(giant.lt > t)) { giant.lt = t + 0.1; H.X.light(gp.x, gp.y - gp.z * 0.5, GSZ * 1.8, 0.25); } }
        if (!(f.lt > t)) { f.lt = t + 0.12; let n = 0; for (const b of bs) if (b.p && b.A && t < b.tr + DA && n < 8) { n++; H.X.light(b.p.x, b.p.y - b.p.z * 0.5, 1.3, 0.22); } if (t < (L7 ? 1.9 : 1.6)) H.X.light(me.x, me.y - 0.8, 2.2, 0.22); }
        const fragT = L7 ? TL + DL : TF + DP; if (!giant.frag && t >= fragT && giant.S) { giant.frag = true; const q = giant.S.Q; spawnFrags({ x: L7 ? giant.S.P.x : q.x, y: L7 ? giant.S.P.y : q.y, z: L7 ? 0.9 : 1.1 }, GSZ, L7 ? 26 : L4 ? 14 : 10); K.motes(q.x, q.y - 1, 10); }
        for (let i = frags.length - 1; i >= 0; i--) { const q = frags[i]; q.life -= dt; if (q.life <= 0) { frags.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vx *= 1 - dt * 0.8; q.vz -= dt * 0.35; q.rot += q.vr * dt; if (Math.random() < 0.08 * H.Q()) H.P({ kind: 'spark', x: q.x, y: q.y - q.z, vx: 0, vy: 0.4, life: 0.4, max: 0.4, size: 1.4, color: P.ice }); }
        for (let i = slashes.length - 1; i >= 0; i--) { slashes[i].t0 += dt; if (slashes[i].t0 > 0.35) slashes.splice(i, 1); }
      },
      drawUnder(c, f, X, Y, T) { const t = f.t;
        for (const b of bs) { const p = b.p; if (!p || p.a <= 0.02) continue; K.floorLight(c, H.sx(p.x), H.sy(p.y), T * 0.55, 0.2 * p.a / (1 + p.z * 0.4), P.violet); }
        const gp = giant.p; if (gp) K.floorLight(c, H.sx(gp.x), H.sy(gp.y), T * GSZ * 1.4, 0.3 * gp.a, P.blue);
        for (const s of slashes) K.floorLight(c, H.sx(s.x), H.sy(s.y), T * (s.big ? 2.6 : 1.1), 0.5 * (1 - s.t0 / 0.35), P.cyan);
      },
      draw(c, f, X, Y, T, gt) { const t = f.t; c.save(); petHole(c, T);
        // trails
        for (const b of bs) { if (!b.p || b.hist.length < 2) continue; const pts = b.hist.map(q => [H.sx(q[0]), H.sy(q[1]) - q[2] * T]); const atk = b.A && t < b.tr + DA; trail(c, atk ? pts : pts.slice(-7), T * SZ * (atk ? 0.55 : 0.4), b.p.a * (atk ? 1 : 0.4)); }
        // Celestial: the silhouette the returning trails draw
        if (L7) { const oa = 1 - sm((t - TB - 0.35) / 0.45); if (oa > 0.01) { const gs = scr(G, T); c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); let any = false;
            for (const b of bs) { if (t < b.ts) continue; const pr = Math.min(1, (t - b.ts) / TRD), n = b.seg.length - 1, fk = pr * n, k = Math.floor(fk); c.moveTo(gs[0] + b.seg[0][0] * T, gs[1] + b.seg[0][1] * T); for (let j = 1; j <= Math.min(n, k); j++) c.lineTo(gs[0] + b.seg[j][0] * T, gs[1] + b.seg[j][1] * T); if (k < n) { const u = fk - k; c.lineTo(gs[0] + lerp(b.seg[k][0], b.seg[k + 1][0], u) * T, gs[1] + lerp(b.seg[k][1], b.seg[k + 1][1], u) * T); } any = true; }
            if (any) { c.globalAlpha = oa; c.strokeStyle = H.rgba(P.violet, 0.5); c.lineWidth = T * 0.22; c.stroke(); c.strokeStyle = H.rgba(P.cyan, 0.75); c.lineWidth = T * 0.07; c.stroke(); c.strokeStyle = P.white; c.lineWidth = Math.max(1, T * 0.025); c.stroke(); }
            c.restore(); } }
        // the butterflies
        for (const b of bs) { const p = b.p; if (!p || p.a <= 0.01) continue; const s = scr(p, T), q = bpos(b, t - 0.03), s0 = q ? scr(q, T) : s, vx = s[0] - s0[0], vy = s[1] - s0[1], sp = Math.hypot(vx, vy);
          const want = sp > T * 0.03 ? Math.atan2(vy, vx) : -Math.PI / 2, dh = wrap(want - b.hd); b.hd += dh * 0.35; b.bk = lerp(b.bk, Math.max(-1, Math.min(1, dh * 2.5)), 0.3);
          const fl = 0.18 + 0.82 * (0.5 + 0.5 * Math.cos(b.ph)), flH = 0.18 + 0.82 * (0.5 + 0.5 * Math.cos(b.ph - 0.8));
          bfly(c, s[0], s[1], T * SZ * p.sc, b.hd, fl, flH, p.fold, p.a, { bank: b.bk, vari: (b.vari + Math.floor(gt * 12)) % 3 }); }
        // the great butterfly
        const gp = giant.p; if (gp) { const s = scr(gp, T), q = gpos(t - 0.03), s0 = q ? scr(q, T) : s, vx = s[0] - s0[0], vy = s[1] - s0[1], sp = Math.hypot(vx, vy), sz = T * GSZ * gp.sc;
          const want = gp.fixHd || sp < T * 0.04 ? -Math.PI / 2 : Math.atan2(vy, vx); giant.hd += wrap(want - giant.hd) * 0.3;
          const fl = gp.fl != null ? gp.fl : 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(giant.ph)), flH = gp.fl != null ? Math.max(0.12, gp.fl * 0.97) : 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(giant.ph - 0.7));
          // long violet streamers behind its flight
          if (giant.hist.length > 2) { const pts = giant.hist.map(h2 => [H.sx(h2[0]), H.sy(h2[1]) - h2[2] * T]); for (let j = -1; j <= 1; j++) { const sh = pts.map((p2, k) => { const p1 = pts[Math.max(0, k - 1)], p3 = pts[Math.min(pts.length - 1, k + 1)], ddx = p3[0] - p1[0], ddy = p3[1] - p1[1], dl = Math.hypot(ddx, ddy) || 1, u = k / (pts.length - 1), o = j * sz * 0.45 * (0.4 + 0.6 * u) + Math.sin(gt * 7 + k * 0.7 + j) * sz * 0.08 * (1 - u); return [p2[0] - ddy / dl * o, p2[1] + ddx / dl * o]; }); trail(c, sh, sz * (j ? 0.18 : 0.3), gp.a); } }
          // Adept on: a second translucent wing outline that follows its movements, a beat behind
          if (L4 && giant.ghost.length > 4) { const g0 = giant.ghost[0], gs2 = [H.sx(g0[0]), H.sy(g0[1]) - g0[2] * T], gfl = g0[4] != null ? g0[4] : 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(g0[5])); outline(c, gs2[0], gs2[1], T * GSZ * g0[7] * 1.14, g0[3], gfl, g0[6] || 0, g0[8] || 1, 0.55 * gp.a, P.violet); }
          const vs = gp.veins == null ? 1 : gp.veins;
          if (L7 && vs < 1) bfly(c, s[0], s[1], sz, giant.hd, fl, flH, gp.fold, gp.a * (1 - vs) * 0.95, { mode: 'p', open: gp.open, vari: 0 });
          bfly(c, s[0], s[1], sz, giant.hd, fl, flH, gp.fold, gp.a * vs, { mode: 'b', open: gp.open, vari: Math.floor(gt * 10) % 2 });
          // its veins come alive with lightning as the wings open
          if (L7 && vs > 0.2 && t < TL + DL) for (const sd of [1, -1]) for (const kind of ['fore', 'hind']) { const r0 = lobeXY(kind, sd, [0.06, 0], sz, giant.hd, fl, gp.fold, gp.open), r1 = lobeXY(kind, sd, kind === 'fore' ? [0.9, -0.13] : [0.84, 0.02], sz, giant.hd, kind === 'fore' ? fl : flH, gp.fold, gp.open); K.arc(c, s[0] + r0[0], s[1] + r0[1], s[0] + r1[0], s[1] + r1[1], K.seed(gt, sd * 3 + (kind === 'fore' ? 1 : 2), 16), Math.max(1.2, T * 0.05), 0.75 * vs * gp.a, { forks: 2, jit: sz * 0.08 }); }
          if (L7 && t < TB + 0.4) { const k = 1 - cl((t - TB) / 0.4); K.glow(c, s[0], s[1], sz * 0.7, P.cyan, 0.45 * k); }
        }
        // the slash where a blade passed
        for (const sl of slashes) { const u = sl.t0 / 0.35, s = [H.sx(sl.x), H.sy(sl.y) - sl.z * T], L = T * (sl.big ? 2.6 : 0.9) * (0.6 + 0.6 * eo(u * 2)), ca = Math.cos(sl.hd), sa = Math.sin(sl.hd); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.globalAlpha = 1 - u; c.strokeStyle = P.violet; c.lineWidth = T * (sl.big ? 0.4 : 0.16); c.beginPath(); c.moveTo(s[0] - ca * L, s[1] - sa * L); c.lineTo(s[0] + ca * L, s[1] + sa * L); c.stroke(); c.strokeStyle = P.cyan; c.lineWidth = T * (sl.big ? 0.14 : 0.06); c.stroke(); c.strokeStyle = P.white; c.lineWidth = Math.max(1, T * 0.025); c.stroke(); c.restore(); K.glow(c, s[0], s[1], T * (sl.big ? 1.6 : 0.6), P.white, 0.7 * (1 - u)); }
        // the slowly turning luminous wing fragments
        for (const q of frags) { const a2 = Math.min(1, q.life / 0.6) * Math.min(1, (q.max - q.life) / 0.1 + 0.3), px = H.sx(q.x), py = H.sy(q.y) - q.z * T, sz = T * q.sz; K.glow(c, px, py, sz * 1.2, P.violet, 0.4 * a2); c.save(); c.translate(px, py); c.rotate(q.rot); c.globalCompositeOperation = 'lighter'; drawLobe(c, q.kind, q.vari, 's', 0, sz, sz * 0.62, 0.55 + 0.45 * Math.cos(gt * 2 + q.rot), a2); c.restore(); }
        c.restore();
      } });
  };

  /* ================= the fault ================= */
  /* a vertical sheet of lightning, made once (row 0 = the floor seam): a bright base fading up, with streaks of differing height */
  function sheetSpr(col, v) {
    return fxSprite('tu5sheet|' + col + v, 64, 128, g => {
      const C0 = col === 'w' ? P.white : col === 'c' ? P.cyan : P.violet, C1 = col === 'w' ? P.ice : col === 'c' ? P.blue : P.deep, gr = g.createLinearGradient(0, 0, 0, 128);
      // the translucent body: bright at the floor seam, thinning upward
      gr.addColorStop(0, H.rgba(C0, 0.7)); gr.addColorStop(0.08, H.rgba(C0, 0.36)); gr.addColorStop(0.5, H.rgba(C1, 0.16)); gr.addColorStop(0.85, H.rgba(C1, 0.05)); gr.addColorStop(1, H.rgba(C1, 0)); g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
      g.globalCompositeOperation = 'lighter';
      // soft vertical folds of differing height (an aurora-like drape)
      for (let i = 0; i < 8; i++) { const x = (i + 0.5) * 8 + (R1(i * 5.3 + v) - 0.5) * 6, hh = 128 * (0.45 + 0.55 * R1(i * 7.7 + v * 13.1 + (col === 'v' ? 3 : 0))), g2 = g.createLinearGradient(0, 0, 0, hh); g2.addColorStop(0, H.rgba(C0, 0.45)); g2.addColorStop(0.75, H.rgba(C0, 0.18)); g2.addColorStop(1, H.rgba(C0, 0)); g.fillStyle = g2; g.fillRect(x - 2.5, 0, 5, hh); }
      // electric filaments climbing the sheet
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (let k = 0; k < 4; k++) { let x = 6 + R1(k * 9.1 + v * 3.3) * 52; const top = 128 * (0.55 + 0.45 * R1(k + v * 2.1)), pts = [[x, 0]]; for (let y = 10; y < top; y += 10) { x += (R1(k * 5 + y + v) - 0.5) * 12; pts.push([x, y]); }
        g.strokeStyle = H.rgba(C0, 0.5); g.lineWidth = 3; g.beginPath(); pts.forEach((p2, i) => (i ? g.lineTo(p2[0], p2[1]) : g.moveTo(p2[0], p2[1]))); g.stroke(); g.strokeStyle = H.rgba(P.white, col === 'v' ? 0.5 : 0.9); g.lineWidth = 1; g.stroke(); }
      g.fillStyle = H.rgba(P.white, col === 'v' ? 0.35 : 0.95); g.fillRect(0, 0, 64, 3);
    });
  }
  /* a sheet over the parallelogram whose base runs (ax, ay) -> (bx, by) and whose top is offset by (tx, ty), screen px */
  function sheet(c, ax, ay, bx, by, tx, ty, spr, a) { if (a <= 0.01) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.transform(bx - ax, by - ay, tx, ty, ax, ay); c.drawImage(spr, 0, 0, 1.06, 1); c.restore(); }
  /* a polyline of screen points up to distance dmax along it (ds: each point's distance) */
  function upTo(c, sp, ds, dmax, d0) { d0 = d0 || 0; let started = false; for (let k = 0; k < sp.length; k++) { if (ds[k] < d0) { if (k + 1 < sp.length && ds[k + 1] > d0) { const u = (d0 - ds[k]) / (ds[k + 1] - ds[k]); c.moveTo(lerp(sp[k][0], sp[k + 1][0], u), lerp(sp[k][1], sp[k + 1][1], u)); started = true; } continue; } if (ds[k] <= dmax) { started ? c.lineTo(sp[k][0], sp[k][1]) : c.moveTo(sp[k][0], sp[k][1]); started = true; } else { if (started && k > 0) { const u = (dmax - ds[k - 1]) / (ds[k] - ds[k - 1]); c.lineTo(lerp(sp[k - 1][0], sp[k][0], u), lerp(sp[k - 1][1], sp[k][1], u)); } break; } } }

  // LI-U10 Worldsplitter
  U.worldsplitter = (C, h) => {
    H = h; K = TK.bind(H); const me = H.me, ev = K.evo(C), L4 = ev >= 4, L7 = ev >= 7, DK = C.base * C.K * K.evoK(C), q6 = (ev - 1) / 6;
    let a = Math.hypot(C.tx - me.x, C.ty - me.y) > 1 ? Math.atan2(C.ty - me.y, C.tx - me.x) : C.a; const dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
    const x0 = me.x + dx * 0.55, y0 = me.y + dy * 0.55, td = Math.hypot(C.tx - me.x, C.ty - me.y), L = Math.max(3, reach(x0, y0, a, Math.min(lerp(7, 10, q6), Math.max(6, td + 3.2)), 0.25));
    const NB = K.evoN(C, 2, 6), LB = lerp(1.6, 3.4, q6), HM = lerp(2.4, 3.4, q6), T0 = 0.1, VG = L / 0.42, IG = L7 ? 1.12 : L4 ? 0.85 : 0.75, VM = L / 0.85, tEnd = IG + L / VM, SL = 0.8, SW = L4 ? 0.2 : 0;
    const paths = [];
    { const n = Math.max(4, Math.round(L / 0.32)), pts = []; let off = 0; for (let k = 0; k <= n; k++) { const d = L * k / n; if (k > 0) off = off * 0.55 + (Math.random() - 0.5) * 0.34; if (k === 0) off = 0; pts.push({ x: x0 + dx * d + px * off, y: y0 + dy * d + py * off, d }); }
      paths.push({ main: true, pts, hit: new Set(), last: 0, dmg: DK * 6, hm: HM, tw: SW }); }
    const mp = paths[0].pts, nm = mp.length - 1;
    for (let j = 0; j < NB; j++) {
      const uj = NB === 2 ? [0.42, 0.68][j] : 0.22 + 0.66 * (j + 0.5) / NB, ji = Math.round(uj * nm), side = j % 2 ? 1 : -1, st = mp[ji]; let b = a + side * (L7 ? 1.05 : 0.75), x = st.x, y = st.y, d = 0; const lb = LB * (0.85 + 0.3 * Math.random()), pts = [{ x, y, d: 0 }];
      while (d < lb) { b += (Math.random() - 0.5) * 0.35 - side * (L7 ? 0.3 : 0.12) * 0.3; const nx = x + Math.cos(b) * 0.3, ny = y + Math.sin(b) * 0.3; if (H.X.blocked(nx, ny, 0.2, 0)) break; x = nx; y = ny; d += 0.3; pts.push({ x, y, d }); }
      if (pts.length >= 3) paths.push({ main: false, ji, side, pts, hit: new Set(), last: 0, dmg: DK * 4 / NB, hm: HM * 0.72, tw: 0 });
    }
    // the timing of every point: when the crack reaches it, when (Celestial) light races under it, when it ignites, when it seals
    const VS = L / 0.75, TS0 = tEnd + 0.95;
    for (const p of paths) { const base = p.main ? null : mp[p.ji]; p.lb = p.pts[p.pts.length - 1].d;
      for (const q of p.pts) { if (p.main) { q.tc = T0 + q.d / VG; q.tr = 0.62 + q.d / (L / 0.3); q.ti = IG + q.d / VM; q.ts = TS0 + (L - q.d) / VS; } else { q.tc = base.tc + q.d / (VG * 0.75); q.tr = base.tr + q.d / (L / 0.3); q.ti = base.ti + q.d / (VM * 0.8); q.ts = base.ts - (p.lb - q.d) / VS * 0.6; } } }
    const E = mp[nm], CR = L7 ? 0.38 : 0.25, FOLD = 0.28, DIS = tEnd + (L7 ? CR + FOLD : 0.2), FADE0 = tEnd + 0.5, END = L7 ? TS0 + L / VS + 1.5 : FADE0 + 1.8;
    const lastTi = Math.max(...paths.map(p => p.pts[p.pts.length - 1].ti));
    H.warnLine(x0, y0, a, L, 1.2, IG, C.col); H.X.banner('WORLDSPLITTER', '', C.col, 1.4); H.X.sfx.crash(); H.X.shake(7, 0.25); me.sq = 0.55;
    K.sparks(me.x + dx * 0.4, me.y + dy * 0.4, 14, 6); K.motes(me.x, me.y, 6); H.X.ring(x0, y0, 0.2, 1.4, 0.35, P.violet, 0.45); H.X.light(x0, y0, 2.2, 0.3);
    const fx = { rings: [], cr: new Set() };
    const sealA = (q, t) => (L7 ? (t < q.ts ? 1 : 0) : 1 - sm((t - FADE0) / 0.7));
    const hgt = age => (age < 0.07 ? eo(age / 0.07) * 1.15 : age < 0.32 ? 1.15 - 0.15 * cl((age - 0.07) / 0.1) : 1 - H.ease.io(cl((age - 0.32) / (SL - 0.32))));
    H.add({ life: END,
      update(dt, f) { const t = f.t;
        // the fracture itself bites as it races through a monster (a small blow and a jolt; the eruption is the real damage)
        if (t < IG) for (const p of paths) for (const q of p.pts) { if (q.tc > t || q.bit) continue; q.bit = true; for (const m of H.living()) { if (fx.cr.has(m) || Math.hypot(m.x - q.x, m.y - q.y) > 0.45 + m.r) continue; fx.cr.add(m); H.X.hitMon(m, DK * 0.5, C.dmgO({ stun: m.boss ? 0.15 : 0.3 })); K.sparks(m.x, m.y - 0.3, 6, 5); } }
        for (const p of paths) {
          // hits where the curtain erupts
          while (p.last < p.pts.length - 1 && p.pts[p.last + 1].ti <= t) { const A = p.pts[p.last], B = p.pts[p.last + 1]; p.last++; const sx2 = B.x - A.x, sy2 = B.y - A.y, l2 = sx2 * sx2 + sy2 * sy2 || 1;
            for (const m of H.living()) { if (p.hit.has(m)) continue; const u = cl(((m.x - A.x) * sx2 + (m.y - A.y) * sy2) / l2), ddx = m.x - (A.x + sx2 * u), ddy = m.y - (A.y + sy2 * u); if (Math.hypot(ddx, ddy) < 0.7 + p.tw + m.r) { p.hit.add(m); H.X.hitMon(m, p.dmg, C.dmgO({ kb: 1, stun: m.boss ? 0.3 : 0.6 })); K.sparks(m.x, m.y - 0.5, 8, 7); H.X.light(m.x, m.y, 1.6, 0.12); } }
            if (p.last % 4 === 0) H.X.sfx.crack(); if (p.main && p.last % 3 === 0) H.X.shake(3, 0.08); }
          // sparks shed by collapsing sheets, fragments lifting along the sides
          for (let k = 0; k < p.pts.length - 1; k++) { const q = p.pts[k], age = t - q.ti; if (age < 0.04 || age > SL) continue; const hz = p.hm * hgt(age);
            if (age > 0.32 && Math.random() < 0.18 * H.Q() * dt * 30) H.P({ kind: 'spark', x: q.x + (Math.random() - 0.5) * 0.3, y: q.y - hz * (0.6 + Math.random() * 0.4), vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2, g: 5, life: 0.5, max: 0.5, size: 1.8, color: Math.random() < 0.5 ? P.violet : P.ice });
            if (age < 0.6 && Math.random() < 0.05 * H.Q() * dt * 30) { const s = Math.random() < 0.5 ? -1 : 1, o = 0.45 + p.tw + Math.random() * 0.3; H.P({ kind: 'shard', x: q.x + px * s * o, y: q.y + py * s * o, vx: px * s * 0.3, vy: -0.4 - Math.random() * 0.5, g: -0.3, drag: 0.6, life: 1.1, max: 1.1, size: 2.2 + Math.random() * 1.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 4, color: Math.random() < 0.5 ? P.ice : P.violet }); } }
        }
        // the curtain lights the room round it (the game's darkness would grey it out otherwise)
        f.lt = (f.lt || 0) - dt; if (f.lt <= 0 && t > IG && t < lastTi + SL) { f.lt = 0.1; for (const p of paths) { let acc = 9; for (const q of p.pts) { const age = t - q.ti; if (age < 0 || age > SL) continue; acc += 0.3; if (acc >= 2) { acc = 0; H.X.light(q.x, q.y, p.main ? 2.6 : 1.8, 0.25); } } } }
        if (t > tEnd && t < DIS + 0.3 && !(f.lc > t)) { f.lc = t + 0.1; H.X.light(E.x + dx * 0.5, E.y + dy * 0.5, L7 ? 4.5 : 3, 0.25); }
        if (t > T0 && t < IG) { if (Math.random() < 0.5 * H.Q()) { const q = mp[Math.floor(Math.random() * (nm + 1))]; if (q.tc < t) H.P({ kind: 'spark', x: q.x, y: q.y, vx: (Math.random() - 0.5), vy: -1 - Math.random(), life: 0.3, max: 0.3, size: 1.5, color: P.violet }); } }
        if (!f.rumble && t > IG - 0.25) { f.rumble = true; H.X.shake(4, 0.25); H.X.sfx.hum(); }
        if (!f.ign && t > IG) { f.ign = true; H.X.flash(0.06, P.ice); H.X.sfx.crash(); }
        // the end of the fault: the crest and its discharge
        if (!f.dis && t > DIS) { f.dis = true; const Dx = L7 ? E.x + dx * 0.9 : E.x, Dy = L7 ? E.y + dy * 0.9 : E.y, R = L7 ? 2.7 : L4 ? 2.0 : 1.6;
          H.hitArea(Dx, Dy, R, DK * (L7 ? 6.5 : L4 ? 5 : 4.5), C.dmgO({ kb: 3, stun: 0.6 })); K.zapAt(Dx, Dy, R); K.sparks(Dx, Dy - 0.4, L7 ? 26 : 14, 8); K.motes(Dx, Dy - 0.6, L7 ? 14 : 8); if (L7) K.goldSparks(Dx, Dy - 0.8, 14, 8);
          fx.rings.push({ x: Dx, y: Dy, r: R, t0: t }); H.X.flash(L7 ? 0.16 : 0.08, P.ice); H.X.shake(L7 ? 14 : 8, 0.35); H.X.hitstop(L7 ? 0.07 : 0.04); H.X.sfx.crash(); H.X.light(Dx, Dy, R * 2, 0.4); }
        // floating sparks as it seals / fades
        if (t > FADE0 && Math.random() < 0.7 * H.Q()) { const p = paths[Math.floor(Math.random() * paths.length)], q = p.pts[Math.floor(Math.random() * p.pts.length)]; if (!L7 || Math.abs(t - q.ts) < 0.25) K.motes(q.x, q.y - 0.2, 1, { v: 0.6, g: -0.8, life: 1.1, color: [P.violet, P.ice, P.cyan] }); }
      },
      drawUnder(c, f, X, Y, T, gt) { const t = f.t; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        for (const p of paths) { const sp = p.pts.map(q => [H.sx(q.x), H.sy(q.y)]), ds = p.pts.map(q => q.d), np = sp.length;
          let dC = -1, dI = -1; for (let k = 0; k < np; k++) { if (p.pts[k].tc <= t) dC = ds[k]; if (p.pts[k].ti <= t) dI = ds[k]; }
          if (dC < 0) { const k0 = p.pts[0]; if (k0.tc > t) continue; }
          // the growing tip of the crack (interpolated)
          const kk = p.pts.findIndex(q => q.tc > t); if (kk > 0) dC = ds[kk - 1] + (ds[kk] - ds[kk - 1]) * cl((t - p.pts[kk - 1].tc) / (p.pts[kk].tc - p.pts[kk - 1].tc)); else if (kk < 0) dC = ds[np - 1];
          // the sealed part (Celestial seals from the far end back toward the pet)
          let dS = 1e9; if (L7) for (let k = np - 1; k >= 0; k--) { if (p.pts[k].ts <= t) dS = ds[k]; else break; }
          const ca = L7 ? 1 : 1 - sm((t - FADE0) / 0.7), live = Math.min(dC, dS - 0.01);
          if (ca > 0.01 && live > 0) {
            // the needle-thin fracture: violet with a white core; electricity pulsing beneath it before it ignites
            const pre = t < IG ? 1 : 0, bright = 1 + (t > IG - 0.3 && t < IG ? 1.2 * (t - IG + 0.3) / 0.3 : 0);
            c.beginPath(); upTo(c, sp, ds, live); c.globalAlpha = 0.55 * ca * bright; c.strokeStyle = P.violet; c.lineWidth = p.main ? 4 : 3; c.stroke(); c.globalAlpha = 0.95 * ca; c.strokeStyle = P.white; c.lineWidth = p.main ? 1.3 : 1; c.stroke();
            if (pre || t < IG + 0.4) { c.globalAlpha = 0.75 * ca * (pre ? 1 : 1 - (t - IG) / 0.4); c.strokeStyle = P.cyan; c.lineWidth = p.main ? 2.4 : 1.8; c.setLineDash([T * 0.12, T * 0.35]); c.lineDashOffset = -gt * T * 4; c.stroke(); c.setLineDash([]); }
            for (let k = 0; k < np; k += 3) if (ds[k] <= live) K.floorLight(c, sp[k][0], sp[k][1], T * (p.main ? 0.7 : 0.5) * (0.8 + 0.4 * bright - 0.4), 0.22 * ca * bright, P.violet);
            // the opened part burns brighter while the curtain stands
            if (dI > 0) { c.beginPath(); upTo(c, sp, ds, Math.min(dI, live), 0); c.globalAlpha = 0.18 * ca * (1 - cl((t - lastTi) / 0.8)); c.strokeStyle = P.violet; c.lineWidth = (p.main ? 7 : 4) + p.tw * T * 1.2; c.stroke(); c.globalAlpha = 0.7 * ca * (1 - cl((t - lastTi) / 0.8)); c.strokeStyle = P.ice; c.lineWidth = p.main ? 2 : 1.5; c.stroke();
              for (let k = 0; k < np; k += 2) { const age = t - p.pts[k].ti; if (age > 0 && age < SL + 0.2) K.floorLight(c, sp[k][0], sp[k][1], T * (p.main ? 1.3 : 0.9), 0.3 * (1 - age / (SL + 0.2)) * ca, age < 0.15 ? P.cyan : P.violet); } }
          }
          // Celestial: light first races beneath every path, revealing the whole shape
          if (L7 && t > 0.6 && t < IG + 0.1) { let dr = -1; for (let k = 0; k < np; k++) if (p.pts[k].tr <= t) dr = ds[k]; if (dr > 0) { const head = dr >= ds[np - 1] - 0.01 ? -1 : dr; c.beginPath(); upTo(c, sp, ds, dr, Math.max(0, dr - 1.4)); c.globalAlpha = head < 0 ? 0.4 : 0.9; c.strokeStyle = P.ice; c.lineWidth = 3; c.stroke();
              c.beginPath(); upTo(c, sp, ds, dr); c.globalAlpha = 0.35; c.strokeStyle = P.blue; c.lineWidth = 5; c.stroke();
              if (head > 0) { const k = p.pts.findIndex(q => q.d >= head), hp = sp[Math.max(0, k)]; K.floorLight(c, hp[0], hp[1], T * 1.4, 0.8, P.white); K.glow(c, hp[0], hp[1], T * 0.5, P.cyan, 0.9); } } }
          // the fading violet impression it leaves
          const sa = L7 ? (dS < 1e8 ? 1 - cl((t - TS0 - 0.3) / 1.8) : 0) : cl((t - FADE0) / 0.4) * (1 - cl((t - FADE0 - 0.4) / 1.3));
          if (sa > 0.01) { c.restore(); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; c.globalAlpha = sa * 0.5; c.strokeStyle = P.violet; c.lineWidth = p.main ? 5 : 3.5; c.beginPath(); if (L7) upTo(c, sp, ds, ds[np - 1], dS); else upTo(c, sp, ds, ds[np - 1]); c.stroke(); c.globalAlpha = sa * 0.2; c.strokeStyle = P.ice; c.lineWidth = 1; c.stroke(); }
        }
        c.restore();
        // shock rings of the discharge
        for (const r of fx.rings) { const u = (t - r.t0) / 0.6; if (u < 1) K.shockRing(c, H.sx(r.x), H.sy(r.y), r.r * T * eo(u), 1 - u, gt, L7 ? 6 : 3); if (u < 0.5) K.groundArcs(c, H.sx(r.x), H.sy(r.y), r.r * T * 1.1, L7 ? 7 : 4, gt, 1 - u * 2, 1); }
      },
      draw(c, f, X, Y, T, gt) { const t = f.t; if (t < IG) return; c.save(); petHole(c, T);
        const pk = d => cl((d - 0.1) / 0.9);   // (the sheets nearest the pet stay low and faint so they never stand over it)
        let fronts = 0;
        for (const p of paths) { const np = p.pts.length, offs = p.tw ? [-p.tw, p.tw] : [0];
          for (let k = 0; k < np - 1; k++) { const A = p.pts[k], B = p.pts[k + 1], age = t - A.ti; if (age < 0 || age > SL) continue; if (L7 && t > A.ts) continue;
            const near = p.main ? pk(A.d) : 1, hz = p.hm * hgt(age) * (0.85 + 0.3 * R1(k * 3.1 + (p.ji || 0) * 7)) * (0.94 + 0.06 * Math.sin(gt * 30 + k)) * (0.35 + 0.65 * near) * T, al = (p.main ? 0.95 : 0.8) * near;
            const wA = cl(1 - age / 0.12), cA = cl(age / 0.05) * (1 - cl((age - 0.16) / 0.25)), vA = cl((age - 0.08) / 0.18) * (1 - cl((age - 0.45) / (SL - 0.45))), vv = (Math.floor(gt * 10) + k) % 3;
            for (const o of offs) { const ax = H.sx(A.x + px * o), ay = H.sy(A.y + py * o), bx = H.sx(B.x + px * o), by = H.sy(B.y + py * o), lean = o * T * 0.35, ov = 0.18 + 0.82 * Math.abs(bx - ax) / (Math.hypot(bx - ax, by - ay) || 1), aa = al * ov * (offs.length > 1 ? 0.8 : 1);
              if (wA > 0.02) sheet(c, ax, ay, bx, by, lean, -hz, sheetSpr('w', vv), aa * wA * 0.6);
              if (cA > 0.02) sheet(c, ax, ay, bx, by, lean, -hz, sheetSpr('c', vv), aa * cA * 0.9);
              if (vA > 0.02) sheet(c, ax, ay, bx, by, lean * 1.4, -hz, sheetSpr('v', vv), aa * vA * 0.95); }
          }
          // the white-hot leading edge: a bolt riding the front, the floor ablaze under it
          const fi = (() => { let r = -1; for (let k = 0; k < np; k++) if (p.pts[k].ti <= t) r = k; return r; })();
          if (fi >= 0 && t < p.pts[np - 1].ti + 0.06 && fronts < 5) { fronts++; const q = p.pts[fi], fx2 = H.sx(q.x), fy2 = H.sy(q.y), hz = p.hm * 1.25 * T * (p.main ? (0.35 + 0.65 * pk(q.d)) : 1);
            K.glow(c, fx2, fy2 - hz * 0.3, T * (p.main ? 1.3 : 0.9), P.cyan, 0.45); K.glow(c, fx2, fy2, T * 0.45, P.white, 0.7); K.arc(c, fx2 + (R1(K.seed(gt, fi)) - 0.5) * T * 0.5, fy2 - hz, fx2, fy2, K.seed(gt, fi + (p.ji || 0) * 13, 24), p.main ? Math.max(2, T * 0.07) : Math.max(1.5, T * 0.05), 1, { forks: p.main ? 2 : 1, jit: T * 0.3 }); }
        }
        // arcs leaping across the opening (between the twin sheets from Adept; across the crack at Hatchling)
        for (let i = 0; i < (L7 ? 3 : 2); i++) { const s = K.seed(gt, i, 14), k = Math.floor(R1(s) * nm), q = mp[k], age = t - q.ti; if (age < 0.05 || age > SL * 0.8 || (L7 && t > q.ts)) continue; const o = (SW || 0.32) + 0.05, hz = (SW ? HM * hgt(age) * 0.35 * R1(s + 3) : 0.12) * T * pk(q.d);
          K.arc(c, H.sx(q.x - px * o), H.sy(q.y - py * o) - hz, H.sx(q.x + px * o), H.sy(q.y + py * o) - hz * (0.6 + 0.8 * R1(s + 5)), s, Math.max(1.2, T * 0.035), 0.9, { forks: 1, jit: T * 0.12 }); }
        // the crest at the far end (Celestial: colossal, forked, and folding forward)
        const cu = (t - tEnd) / CR; if (cu > 0 && t < DIS + 0.35) {
          const rise = eo(cu), fd = L7 ? H.ease.in(cl((t - tEnd - CR) / FOLD)) : 0, fade = 1 - cl((t - DIS) / 0.35), HC = (L7 ? 5.4 : L4 ? 3.4 : 2.6) * T * rise, W = (L7 ? 0.6 : 0.4);
          const bx = H.sx(E.x), by = H.sy(E.y), fwx = (H.sx(E.x + dx) - bx), fwy = (H.sy(E.y + dy) - by), ang = fd * Math.PI * 0.5, tx = fwx * Math.sin(ang) * HC / T, ty = -HC * Math.cos(ang) + fwy * Math.sin(ang) * HC / T;
          const l0x = H.sx(E.x - px * W), l0y = H.sy(E.y - py * W), r0x = H.sx(E.x + px * W), r0y = H.sy(E.y + py * W);
          const sv = Math.floor(gt * 10) % 3; sheet(c, l0x, l0y, r0x, r0y, tx, ty, sheetSpr('c', sv), 0.3 * fade * (1 - fd * 0.5)); sheet(c, l0x, l0y, r0x, r0y, tx * 1.08, ty * 1.08, sheetSpr('v', (sv + 1) % 3), 0.32 * fade);
          const topx = bx + tx, topy = by + ty; K.glow(c, topx, topy, T * (L7 ? 1.8 : 1.1), P.ice, 0.6 * fade); K.floorLight(c, bx, by, T * (L7 ? 2.4 : 1.5), 0.7 * fade, P.white);
          K.arc(c, bx, by, topx, topy, K.seed(gt, 77, 20), Math.max(2.5, T * (L7 ? 0.11 : 0.08)), fade, { forks: 2, jit: T * 0.35 });
          const ul = Math.hypot(tx, ty) || 1, ux = tx / ul, uy = ty / ul, NP = L7 ? 4 : 2;
          for (let j = 0; j < NP; j++) { const sp = (j - (NP - 1) / 2) / ((NP - 1) / 2 || 1), pl = HC * (L7 ? 0.42 : 0.35) * (1 - 0.2 * Math.abs(sp)), r = sp * 0.8, ex = topx + (ux * Math.cos(r) - uy * Math.sin(r)) * pl, ey = topy + (ux * Math.sin(r) + uy * Math.cos(r)) * pl, gold = L7 && (j === 1 || j === 2);
            K.arc(c, topx, topy, ex, ey, K.seed(gt, 80 + j, 20), Math.max(1.8, T * (L7 ? 0.075 : 0.055)), fade, { forks: 1, gold, jit: T * 0.25 }); K.glow(c, ex, ey, T * 0.45, gold ? P.gold : P.white, 0.7 * fade); }
        }
        c.restore();
      } });
  };
})();
