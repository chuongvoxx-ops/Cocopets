/* ---------- Wind, new: Monsoon ----------
   One sustained storm vortex settles on the aimed ground, pulls the monsters inward and grinds them.
   Formation (1.0 s, before the window): a soft teal pressure decal dims the ground; loose leaves, petals and dust
   across the field tremble, then slide inward along curved paths; broad, nearly horizontal wind sheets arrive from
   outside, curl round the edge and rise into a wide bowl; a narrow updraft climbs out of the centre.
   Active window: exactly 7 s at level 1, 10 s at Adept, 12 s at Celestial (levels between interpolate). The cast
   position is fixed. Every monster in the field (the floor's ellipse, radius 3 / 3.75 / 4.5 x K) is pulled smoothly
   toward the core on a spiral (capped speed that eases off near the core: they gather round it, never snap to it;
   bosses and fixed monsters are not moved) and takes a Wind tick every 0.5 s on the game clock. Pull and damage stop
   at the exact end of the window; the exit is visual only.
   Layers: a broad ground intake (two cached spiral swirls in the floor plane, the outer one slow, the inner streaks
   fast), the bowl wall (broad mint sheets at the rim, rotating slowly), thin pale inner streaks rotating faster,
   short pale pressure arcs above the floor (the pull reads even with Fewer effects), and the updraft column with
   rising streaks. Debris (dust, mint leaves, a few pink blossoms) rides the flow: in along the ground, up the core,
   peeling away at the top. Adept: wider, and an elevated second circulation band. Celestial: three airflow layers of
   one vortex: the ground intake, an angled middle funnel, a narrow vertical release; periodic ripples travel inward
   through all three. Expiry: the outer bands collapse toward the centre and vent upward into a thin stream of petals.
   Damage (DK = base x K x evoK), a monster in the field the whole window: 14 / 17 at Adept / 20 at Celestial x DK
   (levels between interpolate), spread evenly over the ticks (no finishing burst).
   Performance: every soft shape is a cached sprite (rings of tapered arms, floor swirls, the column, a comet atlas in
   16 directions, petal atlases in 12 turns), baked a few per frame from the cast or in idle time through
   U.monsoon.warm; per frame only blits, no gradients, no shadowBlur. Back halves of the rings go under the monsters,
   front halves over them, cut away round the pet. */
(() => {
  const U = ELEM_IMPL.wind.ult; delete U.tempest;
  const TAU = Math.PI * 2;
  const MINT = '#73E8B6', EMER = '#16A57B', PALE = '#E7FFF6', PINK = '#FFAFD2', ROSE = '#DE5A9A', WHITE = '#FFFFFF';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const GY = 0.55;
  let H;

  /* ---- the bake queue: sprites are size-free (drawn scaled), painted a few per frame, never all at once ---- */
  const BK = { q: [], keys: new Set(), done: new Map(), ms: 0, built: 0, maxSlice: 0 };
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  function want(key) { const s = BK.done.get(key); if (s) return s; if (!BK.keys.has(key) && BAKE[key]) { BK.keys.add(key); BK.q.push(key); } return null; }
  /* (a ring or swirl is painted an arm at a time: a job whose steps each stay well under a frame) */
  function bakeStep(budget) { const t0 = performance.now(); while ((BK.job || BK.q.length) && performance.now() - t0 < budget) { const s = performance.now();
      if (BK.job) { const j = BK.job; j.step(j.i++); if (j.i >= j.n) { BK.done.set(j.key, j.cv); BK.job = null; BK.built++; } }
      else { const k = BK.q.shift(), r = BAKE[k](); if (r.step) { r.key = k; r.i = 0; BK.job = r; } else { BK.done.set(k, r); BK.built++; } }
      const d = performance.now() - s; BK.ms += d; if (d > BK.maxSlice) BK.maxSlice = d; } }
  function wantAll() { for (const k in BAKE) want(k); }

  /* a tapered arm: a centre path (u 0..1 -> [x, y, nx, ny]) and a half width (u -> px), filled in nested passes from
     wide and faint to narrow and bright, so its edges and both ends are feathered: passes [colour, alpha, width, offset] */
  function arm(g, path, hw, passes, N) {
    const P = []; for (let i = 0; i <= N; i++) { const u = i / N; P.push(path(u).concat(hw(u))); }
    for (const [col, a, wm, off] of passes) { g.fillStyle = rgbaS(col, a); g.beginPath();
      for (let i = 0; i <= N; i++) { const p = P[i], o = (off || 0) * p[4], k = p[4] * wm + o; const x = p[0] + p[2] * k, y = p[1] + p[3] * k; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      for (let i = N; i >= 0; i--) { const p = P[i], o = (off || 0) * p[4], k = -p[4] * wm + o; g.lineTo(p[0] + p[2] * k, p[1] + p[3] * k); }
      g.closePath(); g.fill(); } }
  // the envelope along an arm: a long tail growing toward a rounded head (u = 1 leads the flow)
  const env = u => Math.pow(sm(u / 0.72), 1.25) * sm((1 - u) / 0.16);
  /* a ring of arms round a circle (radius RS in a W-px sprite), arms leading clockwise on screen (the flow) */
  const RW = 384, RC = RW / 2, RS = 160;
  function ringBake(o) { const cv = mk(RW, RW), g = cv.getContext('2d');
    return { cv, n: o.n, step(a) { const a0 = a / o.n * TAU + (o.jit ? (R1(a * 3.7 + o.seed) - 0.5) * o.jit : 0), span = o.span * (o.spanJ ? 1 - o.spanJ * R1(a * 5.1 + o.seed) : 1), rr = RS * (o.rj ? 1 + (R1(a * 2.3 + o.seed) - 0.5) * o.rj : 1), wv = o.wave || 0;
      arm(g, u => { const b = a0 + u * span, r = rr + Math.sin(u * Math.PI * 2 + a) * wv; return [RC + Math.cos(b) * r, RC + Math.sin(b) * r, Math.cos(b), Math.sin(b)]; }, u => o.hw * env(u) * (o.hwJ ? 1 - o.hwJ * R1(a + o.seed) : 1), o.passes, 56); } }; }
  /* a floor swirl seen from above: arms spiralling from the rim to the core. Going inward an arm turns against the
     flow, so the picture turned with the flow carries every arm inward (the intake reads as drawn in) */
  const SW = 384, SC = SW / 2;
  function swirlBake(o) { const cv = mk(SW, SW), g = cv.getContext('2d');
    return { cv, n: o.n, step(a) { const a0 = a / o.n * TAU + (R1(a * 1.9 + o.seed) - 0.5) * 0.4, k = o.k * (0.85 + 0.3 * R1(a * 4.4 + o.seed)), r0 = SC * o.r0 * (0.92 + 0.08 * R1(a + o.seed)), r1 = SC * o.r1;
      const at = u => { const r = lerp(r0, r1, u), b = a0 - k * u; return [SC + Math.cos(b) * r, SC + Math.sin(b) * r]; };
      arm(g, u => { const p = at(u), q = at(Math.min(1, u + 0.01)), p0 = at(Math.max(0, u - 0.01)), dx = q[0] - p0[0], dy = q[1] - p0[1], d = Math.hypot(dx, dy) || 1; return [p[0], p[1], -dy / d, dx / d]; },
        u => lerp(o.w0, o.w1, u) * sm(u / o.fin) * sm((1 - u) / o.fout), o.passes, 64); } }; }
  /* a comet (a streak of air, a dust trail) pointing along one of 16 directions, in an atlas of 48 px cells */
  const CN = 16, CS = 48;
  function cometBake() { const cv = mk(CS * CN, CS), g = cv.getContext('2d');
    for (let i = 0; i < CN; i++) { const b = i / CN * TAU, cx = CS * i + CS / 2, cy = CS / 2, L = 40, dx = Math.cos(b), dy = Math.sin(b);
      arm(g, u => [cx + dx * (u - 0.5) * L, cy + dy * (u - 0.5) * L, -dy, dx], u => 3.2 * env(u), [[MINT, 0.22, 1], [PALE, 0.5, 0.55], [WHITE, 0.85, 0.2]], 20); }
    return cv; }
  /* petal atlases: 12 turns of one shape in 40 px cells, shaded (a lit face, a darker edge, a highlight) */
  const PN = 12, PS = 40;
  function petalBake(kind) { const cv = mk(PS * PN, PS), g = cv.getContext('2d');
    return { cv, n: PN, step(i) { g.save(); g.translate(PS * i + PS / 2, PS / 2); g.rotate(i / PN * TAU); g.lineJoin = 'round';
      if (kind === 'leaf') { const L = 14, W = 7.5; g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(-2, -W * 1.25, L, 0); g.quadraticCurveTo(-2, W * 1.25, -L, 0); g.closePath();
        const gr = g.createLinearGradient(0, -W, 0, W); gr.addColorStop(0, '#E7FFF6'); gr.addColorStop(0.35, '#9CF2CB'); gr.addColorStop(0.7, '#3FC593'); gr.addColorStop(1, '#16A57B'); g.fillStyle = gr; g.fill();
        g.strokeStyle = 'rgba(14,110,80,0.75)'; g.lineWidth = 1.1; g.stroke(); g.strokeStyle = 'rgba(231,255,246,0.85)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-L + 2, 0.5); g.quadraticCurveTo(0, -1.2, L - 2, 0); g.stroke(); }
      else if (kind === 'petal' || kind === 'pale') { const pk = kind === 'petal'; g.beginPath(); g.moveTo(-11, 0); g.bezierCurveTo(-8, -9.5, 6, -10, 11.5, -3.2); g.lineTo(8.6, 0); g.lineTo(11.5, 3.2); g.bezierCurveTo(6, 10, -8, 9.5, -11, 0); g.closePath();
        const gr = g.createLinearGradient(-11, -6, 11, 6); if (pk) { gr.addColorStop(0, '#DE5A9A'); gr.addColorStop(0.35, '#F38DBE'); gr.addColorStop(0.75, '#FFAFD2'); gr.addColorStop(1, '#FFE6F1'); } else { gr.addColorStop(0, '#A9EED3'); gr.addColorStop(0.5, '#E7FFF6'); gr.addColorStop(1, '#FFFFFF'); } g.fillStyle = gr; g.fill();
        g.strokeStyle = pk ? 'rgba(170,50,110,0.7)' : 'rgba(40,150,110,0.55)'; g.lineWidth = 1; g.stroke(); g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(2, -3.5, 5, 1.8, -0.25, 0, TAU); g.fill(); }
      else { // a five-petal blossom
        for (let p = 0; p < 5; p++) { const b = p / 5 * TAU; g.save(); g.rotate(b); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-7, -4, -7.5, -14, -2.2, -15.5); g.lineTo(0, -13.6); g.lineTo(2.2, -15.5); g.bezierCurveTo(7.5, -14, 7, -4, 0, 0); g.closePath();
          const gr = g.createLinearGradient(0, 0, 0, -15); gr.addColorStop(0, '#DE5A9A'); gr.addColorStop(0.35, '#F79AC6'); gr.addColorStop(1, '#FFE3F0'); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(160,40,100,0.65)'; g.lineWidth = 1; g.stroke(); g.restore(); }
        g.fillStyle = '#FFF4C9'; g.beginPath(); g.arc(0, 0, 3.2, 0, TAU); g.fill(); g.fillStyle = 'rgba(222,90,154,0.9)'; for (let p = 0; p < 5; p++) { const b = p / 5 * TAU + 0.6; g.beginPath(); g.arc(Math.cos(b) * 2.2, Math.sin(b) * 2.2, 0.9, 0, TAU); g.fill(); } }
      g.restore(); } }; }
  /* soft radial pictures: the pressure dim, the rim light, a ripple band, a vertical column */
  function radialBake(stops, n) { const cv = mk(n, n), g = cv.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, n, n); return cv; }
  function columnBake() { const W = 64, Hh = 256, cv = mk(W, Hh), g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, W, 0);
    [[0, 'rgba(22,165,123,0)'], [0.2, 'rgba(22,165,123,0.10)'], [0.36, 'rgba(115,232,182,0.32)'], [0.46, 'rgba(231,255,246,0.62)'], [0.5, 'rgba(255,255,255,0.8)'], [0.54, 'rgba(231,255,246,0.62)'], [0.64, 'rgba(115,232,182,0.32)'], [0.8, 'rgba(22,165,123,0.10)'], [1, 'rgba(22,165,123,0)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, W, Hh); g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, Hh);
    gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.3, 'rgba(0,0,0,0.75)'); gv.addColorStop(0.55, 'rgba(0,0,0,1)'); gv.addColorStop(0.9, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gv; g.fillRect(0, 0, W, Hh); return cv; }

  /* the ring variants (all leading clockwise): broad mint sheets with a bright leading edge on their outer side, thin
     pale streaks, short pressure arcs, the Celestial funnel bands */
  const SHEET = [[EMER, 0.10, 1.0], [MINT, 0.12, 0.72], [MINT, 0.16, 0.46, 0.18], [PALE, 0.30, 0.24, 0.42], [WHITE, 0.55, 0.09, 0.62]];
  const STREAK = [[MINT, 0.22, 1], [PALE, 0.42, 0.5], [WHITE, 0.8, 0.18]];
  const BAKE = {
    sheetA: () => ringBake({ n: 2, span: 2.35, hw: 15, wave: 4, seed: 1, passes: SHEET }),
    sheetB: () => ringBake({ n: 3, span: 1.55, hw: 12, wave: 5, seed: 7, jit: 0.5, spanJ: 0.25, passes: SHEET }),
    streak: () => ringBake({ n: 5, span: 0.95, hw: 4.2, seed: 3, jit: 0.6, spanJ: 0.4, rj: 0.1, passes: STREAK }),
    arcs: () => ringBake({ n: 8, span: 0.42, hw: 3.4, seed: 5, jit: 0.5, spanJ: 0.3, rj: 0.16, passes: [[PALE, 0.28, 1], [WHITE, 0.75, 0.4]] }),
    funnel: () => ringBake({ n: 3, span: 1.7, hw: 11, wave: 3, seed: 11, jit: 0.4, passes: [[EMER, 0.10, 1.0], [MINT, 0.18, 0.62], [PALE, 0.36, 0.3, 0.35], [WHITE, 0.6, 0.1, 0.55]] }),
    intake: () => swirlBake({ n: 4, k: 2.3, r0: 0.96, r1: 0.14, w0: 22, w1: 5, fin: 0.3, fout: 0.4, seed: 2, passes: [[EMER, 0.10, 1], [MINT, 0.13, 0.6], [PALE, 0.22, 0.25]] }),
    inner: () => swirlBake({ n: 9, k: 3.2, r0: 0.8, r1: 0.1, w0: 4.5, w1: 1.5, fin: 0.25, fout: 0.35, seed: 9, passes: [[MINT, 0.22, 1], [PALE, 0.5, 0.45]] }),
    comet: cometBake,
    leaf: () => petalBake('leaf'), petal: () => petalBake('petal'), pale: () => petalBake('pale'), blossom: () => petalBake('blossom'),
    dim: () => radialBake([[0, 'rgba(6,42,40,0.62)'], [0.45, 'rgba(8,48,44,0.46)'], [0.78, 'rgba(10,52,48,0.16)'], [1, 'rgba(10,52,48,0)']], 128),
    rim: () => radialBake([[0, 'rgba(115,232,182,0)'], [0.74, 'rgba(115,232,182,0)'], [0.88, 'rgba(115,232,182,0.22)'], [0.95, 'rgba(231,255,246,0.42)'], [1, 'rgba(231,255,246,0)']], 256),
    ripple: () => radialBake([[0, 'rgba(115,232,182,0)'], [0.8, 'rgba(115,232,182,0)'], [0.9, 'rgba(115,232,182,0.4)'], [0.95, 'rgba(255,255,255,0.75)'], [0.985, 'rgba(231,255,246,0.2)'], [1, 'rgba(231,255,246,0)']], 256),
    pool: () => radialBake([[0, 'rgba(231,255,246,0.7)'], [0.25, 'rgba(115,232,182,0.35)'], [0.6, 'rgba(22,165,123,0.1)'], [1, 'rgba(22,165,123,0)']], 128),
    column: columnBake,
  };
  /* warm: paint everything in small idle slices (when a pet with Monsoon in its kit enters a floor) */
  let warmT = 0;
  const warm = () => { wantAll(); if (warmT || !BK.q.length) return; const step = () => { bakeStep(4); warmT = BK.q.length ? setTimeout(step, 40) : 0; }; warmT = setTimeout(step, 60); };

  /* ================= Monsoon ================= */
  U.monsoon = (C, h) => {
    H = h; wantAll(); bakeStep(2);
    const me = H.me, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, K = C.K, evoK = 1 + 0.08 * (ev - 1), DK = C.base * K * evoK;
    /* the window: 7 / 10 / 12 s exactly, interpolated between; the field radius 3 / 3.75 / 4.5 x K likewise */
    const DUR = ev <= 4 ? 7 + (ev - 1) : 10 + (ev - 4) * 2 / 3, R = (ev <= 4 ? 3 + 0.25 * (ev - 1) : 3.75 + 0.25 * (ev - 4)) * K;
    const FORM = 1.0, TE = FORM + DUR, EXIT = 1.5, LIFE = TE + EXIT, TICK = 0.5, NT = Math.floor(DUR / TICK + 1e-6);
    const TOT = (14 + (ev - 1)) * DK, PER = TOT / NT, VMAX = (1.25 + 0.05 * ev) * Math.sqrt(K), CORE = 0.42;
    const p0 = H.X.walkPoint(C.tx, C.ty, { r: 0.5, mv: 0 }), cx = p0.x, cy = p0.y;
    const ZC = (3.0 + 0.25 * (ev - 1)) * Math.sqrt(K);   // the updraft's height
    const inField = (m, pad) => { const dx = (m.x - cx) / (R * pad + m.r), dy = (m.y - cy) / (R * GY * pad + m.r); return dx * dx + dy * dy < 1; };
    /* the rings: radius (x R), height (tiles), variant, turn speed (rad/s), phase, alpha, entry delay; the ripple
       reaches each at q (its place along the flow: rim -> core -> up) */
    const RINGS = [
      { r: 0.95, z: 0.16, v: 'sheetA', w: 0.42, a: 0.95, d: 0.30 },
      { r: 1.02, z: 0.72, v: 'sheetB', w: 0.36, a: 0.85, d: 0.38 },
      { r: 1.07, z: 1.3, v: 'sheetA', w: 0.48, a: 0.72, d: 0.46, ph: 1.7 },
      { r: 0.78, z: 0.36, v: 'arcs', w: 1.05, a: 0.85, d: 0.42 },
      { r: 0.55, z: 0.26, v: 'streak', w: 1.55, a: 0.85, d: 0.5 },
      { r: 0.36, z: 0.62, v: 'streak', w: 2.2, a: 0.8, d: 0.56, ph: 2.2 },
      { r: 0.62, z: 0.9, v: 'arcs', w: 1.3, a: 0.6, d: 0.55, ph: 0.9 } ];
    if (ADE) RINGS.push({ r: 0.66, z: 1.6, v: 'sheetB', w: 0.75, a: 0.8, d: 0.62, ph: 2.9 }, { r: 0.6, z: 1.82, v: 'arcs', w: 1.4, a: 0.55, d: 0.66, ph: 0.3 });
    if (CEL) RINGS.push({ r: 0.5, z: 1.25, v: 'funnel', w: 1.1, a: 1, d: 0.6, tilt: 0.07 }, { r: 0.4, z: 1.75, v: 'funnel', w: 1.45, a: 1, d: 0.66, ph: 1.1, tilt: -0.06 }, { r: 0.3, z: 2.25, v: 'funnel', w: 1.85, a: 0.95, d: 0.72, ph: 2.3, tilt: 0.05 }, { r: 0.2, z: 2.7, v: 'streak', w: 2.6, a: 0.7, d: 0.78, ph: 0.4 });
    RINGS.forEach((q, i) => { q.ph = (q.ph || 0) + i * 0.83; q.q = (1 - q.r) * 0.8 + q.z / (ZC + 1) * 0.6; q.rot = q.ph; });
    /* the debris: dust, streaks, mint leaves, pale and pink petals, a few blossoms, riding the flow */
    const ND = H.n(CEL ? 120 : ADE ? 92 : 70), deb = [];
    const kinds = ['mote', 'mote', 'streak', 'streak', 'streak', 'leaf', 'leaf', 'leaf', 'pale', 'pale', 'petal', 'mote', 'streak', 'leaf', 'petal', 'blossom'];
    function spawn(p, first) { p.r = R * (first ? 0.15 + 0.85 * Math.sqrt(Math.random()) : 0.82 + 0.2 * Math.random()); p.th = Math.random() * TAU; p.z = 0.05 + Math.random() * 0.25; p.up = 0; p.peel = 0; p.age = first ? -Math.random() * 0.25 : 0; p.sp = 0.75 + Math.random() * 0.5; }
    for (let i = 0; i < ND; i++) { const p = { k: kinds[i % kinds.length], rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 7, tf: 2 + Math.random() * 4, ph: Math.random() * TAU, s: 0.8 + Math.random() * 0.45 }; spawn(p, true); deb.push(p); }
    const W0 = 0.85 + 0.05 * ev, omega = r => W0 * (0.45 + 1.0 / (0.3 + r / R)), vin = r => R * 0.3 * (0.6 + 0.4 * r / R);
    /* the column's rising streaks */
    const NS = CEL ? 10 : 7, rise = []; for (let i = 0; i < NS; i++) rise.push({ u: i / NS, b: R1(i * 3.3) * TAU, sp: 0.45 + R1(i * 7.7) * 0.3 });
    const feet = new Map(); let next = 0, dead = false, done = false, endK = 1, lastWh = 0;
    const RP = CEL ? 1.3 : 1.8;   // a ripple runs inward every RP seconds
    H.X.banner('MONSOON', '', C.col, 1.4); H.X.sfx.hum();
    H.X.after(0.45, () => { if (!dead) H.X.sfx.whoosh(); });
    H.X.after(FORM, () => { if (dead) return; H.X.shake(3, 0.2); H.X.light(cx, cy, R * 0.8, 0.5); });

    // the time on the vortex's own clock, a ripple's phase, and a ring's growth into place
    const ripU = t => { if (t < FORM + 0.2 || t > TE) return -1; const q = (t - FORM - 0.2) / RP; return (q - Math.floor(q)) / 0.85; };
    const ringG = (q, t) => sm((t - q.d) / 0.6);
    const exitU = t => cl((t - TE) / EXIT);
    /* the exit's vent: a thin stream of petals spiralling up out of the core */
    function vent() { const kv = ['petal', 'pale', 'petal', 'blossom', 'leaf', 'petal', 'pale', 'streak'], nv = H.n(CEL ? 30 : ADE ? 24 : 18);
      for (let i = 0; i < nv; i++) deb.push({ k: kv[i % kv.length], rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 8, tf: 3 + Math.random() * 4, ph: Math.random() * TAU, s: 0.75 + Math.random() * 0.4, r: R * 0.05, th: Math.random() * TAU, z: 0.2 + i / nv * 1.4, up: 1, peel: 0, age: -i / nv * 0.5, sp: 1, vent: true }); }
    function pullAll(dt) {
      for (const m of H.living()) { if (!inField(m, 1.12)) continue; if (!feet.has(m)) feet.set(m, { a: 0, b: Math.random() * TAU }); feet.get(m).on = true;
        if (m.boss || m.still || m.dead) continue; const dx = cx - m.x, dy = cy - m.y, d = Math.hypot(dx, dy); if (d < CORE) continue;
        const v = VMAX * sm((d - CORE) / 1.6), ux = dx / d, uy = dy / d, tw = 0.45;   // inward, plus a little swirl with the flow
        H.X.moveEnt(m, (ux + uy * tw) * v * dt, (uy - ux * tw) * v * dt, 0); } }
    const F = H.add({ life: LIFE, x: cx, y: cy, key: 'monsoon',
      update(dt, f) {
        const t = f.t; bakeStep(3);
        if (me.dead && !dead && t < TE) { dead = true; f.life = Math.min(f.life, 0.7); }
        if (dead) endK = cl(f.life / 0.7);
        // damage on the game clock: NT ticks in the window, every one strictly inside it
        if (!dead) { while (next < NT && t >= FORM + TICK * (next + 0.5)) { const n0 = next; for (const m of H.living()) if (inField(m, 1)) { H.X.hitMon(m, PER, C.dmgO({})); if (Math.random() < 0.35 * H.Q()) H.P({ kind: 'spark', x: m.x, y: m.y - 0.3, vx: (Math.random() - 0.5) * 2, vy: -1.5, life: 0.4, max: 0.4, size: 2, color: PALE }); } next++; if (n0 % 5 === 4 && t - lastWh > 2) { lastWh = t; H.X.sfx.whoosh(); } }
          if (t >= FORM && t < TE) pullAll(dt); }
        if (!done && t >= TE) { done = true; if (!dead) { H.X.sfx.whoosh(); vent(); } }
        for (const [m, q] of feet) { q.a = cl(q.a + (q.on && !m.dead && t < TE && !dead ? dt / 0.3 : -dt / 0.35)); q.on = false; q.b += dt * 5; if (q.a <= 0 && (m.dead || t >= TE || dead)) feet.delete(m); }
        // the rings turn (the outer slowly, the inner fast), faster as the storm forms
        const spin = sm(t / 0.9) * (1 + 0.6 * exitU(t)); for (const q of RINGS) q.rot += q.w * dt * spin;
        // the debris: tremble, slide inward on curved paths, climb the core, peel away at the top
        const mv = sm((t - 0.3) / 0.6), ex = exitU(t), ztop = ZC * (0.75 + 0.6 * ex);
        for (const p of deb) { p.age += dt; if (p.age < 0) continue; p.rot += p.vr * dt;
          if (p.peel > 0) { p.peel += dt; p.r += R * 0.35 * dt; p.z += 0.8 * dt; if (p.peel > 0.6) { if (t < TE - 0.5 && !dead) spawn(p, false); else p.gone = true; } continue; }
          const vi = vin(p.r) * p.sp * mv * (1 + 2.2 * ex);
          p.th += omega(p.r) * dt * mv * (1 + ex); if (p.r > R * 0.1) p.r = Math.max(R * 0.08, p.r - vi * dt);
          if (p.r < R * 0.2 || p.up) { p.up = 1; p.r += (R * 0.07 * (1 - 0.6 * ex) - p.r) * Math.min(1, dt * 3); p.z += (1.3 + p.z * 0.55) * dt * (1 + ex); if (p.z > ztop) p.peel = 0.001; }
          else p.z += ((0.1 + 0.55 * Math.pow(1 - p.r / R, 2)) - p.z) * Math.min(1, dt * 2); }
      },
      drawUnder(c, f, X, Y, T) {
        const t = f.t, ex = exitU(t), A = sm(t / 0.45) * (1 - sm((t - TE - 0.3) / 1.0)) * endK; if (A <= 0.01) return;
        const rx = R * T, ry = rx * GY, S = scr(c); if (X + rx * 1.2 < S.x0 || X - rx * 1.2 > S.x0 + S.w || Y + ry * 1.3 < S.y0 || Y - ry * 1.3 - ZC * T > S.y0 + S.h) return;
        // the pressure decal: a soft teal dim, a mint rim light (light only), a pale pool at the core
        let s = want('dim'); if (s) { c.globalAlpha = 0.6 * A; c.drawImage(s, X - rx * 1.08, Y - ry * 1.08, rx * 2.16, ry * 2.16); }
        c.globalCompositeOperation = 'lighter';
        s = want('rim'); if (s) { const br = 1 + 0.015 * Math.sin(t * 3); c.globalAlpha = 0.75 * A * (1 - ex); c.drawImage(s, X - rx * br, Y - ry * br, rx * 2 * br, ry * 2 * br); }
        s = want('pool'); if (s) { const pr = rx * 0.32 * (1 + 0.08 * Math.sin(t * 5)); c.globalAlpha = 0.55 * A * sm((t - 0.5) / 0.5); c.drawImage(s, X - pr, Y - pr * GY, pr * 2, pr * 2 * GY); }
        // the ground intake: broad slow arms and fast fine streaks, turned with the flow (arms carried inward)
        const sa = sm((t - 0.15) / 0.6) * A * (1 - sm(ex / 0.7)), sk = 1 - 0.5 * ex;
        s = want('intake'); if (s && sa > 0.01) floorSpin(c, s, X, Y, rx * 1.02 * sk, t * 0.55 * sm(t / 1.2) + 0.3, 0.9 * sa);
        s = want('inner'); if (s && sa > 0.01) floorSpin(c, s, X, Y, rx * 0.8 * sk, t * 1.5 * sm(t / 1.2), 0.75 * sa);
        // a ripple running inward over the floor
        const ru = ripU(t); s = want('ripple'); if (s && ru >= 0 && ru <= 1) { const rr = rx * (1.02 - 0.85 * ru), al = Math.sin(Math.PI * ru) * (CEL ? 0.8 : 0.5) * A; c.globalAlpha = al; c.drawImage(s, X - rr, Y - rr * GY, rr * 2, rr * 2 * GY); }
        // the caught monsters: a little swirl of air round their feet
        s = want('inner'); if (s) for (const [m, q] of feet) { if (q.a <= 0.01) continue; const mr = T * (0.55 + m.r * 0.5); floorSpin(c, s, H.sx(m.x), H.sy(m.y), mr, q.b, 0.7 * q.a * A); }
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        // the rings' back halves, and the debris behind the core
        rings(c, X, Y, T, t, A, -1); debris(c, X, Y, T, t, A, -1);
      },
      draw(c, f, X, Y, T) {
        const t = f.t, A = sm(t / 0.45) * endK; if (A <= 0.01) return;
        const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46, rx = R * T, near = Math.abs(PX - X) < rx * 1.15 + T && PY > Y - ZC * T - T && PY < Y + rx * GY + T * 1.2;
        if (near) { c.save(); c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(PX, PY, T * 0.62, T * 0.74, 0, 0, TAU); c.clip('evenodd'); }
        rings(c, X, Y, T, t, A * (near ? 0.75 : 1), 1); debris(c, X, Y, T, t, A, 1);
        if (near) c.restore();
      } });
    // the updraft column stands among the monsters (depth-sorted at the centre)
    H.add({ life: LIFE, x: cx, y: cy, entY: cy, key: 'monsoonCore',
      update(dt, f) { if (dead) f.life = Math.min(f.life, F.life); for (const q of rise) q.u += q.sp * dt * (1 + exitU(F.t)); },
      drawEnt(c) { const t = F.t, ex = exitU(t), A = sm((t - 0.5) / 0.5) * endK * (1 - sm((ex - 0.55) / 0.45)); if (A <= 0.01) return;
        const T = H.X.Tz(), X = H.sx(cx), Y = H.sy(cy), hgt = T * ZC * (sm((t - 0.5) / 0.5) * (1 + 0.8 * H.ease.in(ex))), w = T * (CEL ? 1.1 : 0.85) * (1 - 0.65 * ex) * (1 + 0.05 * Math.sin(t * 7));
        const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46, near = Math.abs(PX - X) < w + T && PY > Y - hgt - T && PY < Y + T;
        if (near) { c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(PX, PY, T * 0.62, T * 0.74, 0, 0, TAU); c.clip('evenodd'); }
        c.globalCompositeOperation = 'lighter'; const col = want('column');
        if (col) { c.globalAlpha = 0.95 * A; c.drawImage(col, X - w, Y - hgt, w * 2, hgt + T * 0.15); c.globalAlpha = (CEL ? 0.85 : 0.65) * A; c.drawImage(col, X - w * 0.4, Y - hgt * 1.05, w * 0.8, hgt * 1.05); }
        // a ripple reaching the core climbs the column (Celestial: the release brightens as it passes)
        const ru = ripU(t); if (ru > 0.7 && ru <= 1.25) { const u = (ru - 0.7) / 0.55, gy = Y - hgt * u, gr = w * (CEL ? 1.5 : 1.1); c.globalAlpha = Math.sin(Math.PI * cl(u)) * (CEL ? 0.6 : 0.35) * A; c.drawImage(glowSprite(PALE), X - gr, gy - gr, gr * 2, gr * 2); }
        // rising streaks wound round it
        const cm = want('comet'); if (cm) for (const q of rise) { const u = q.u % 1, b = q.b + u * 9 + t * 2, xs = X + Math.sin(b) * w * 0.55, ys = Y - hgt * u, fr = Math.cos(b), a = Math.sin(Math.PI * u) * A * (0.45 + 0.4 * fr); if (a <= 0.02) continue;
          const dir = Math.atan2(-hgt / 1.8, Math.cos(b) * w * 0.55 * 9 / 1.8), ci = ((Math.round(dir / TAU * CN) % CN) + CN) % CN, L = T * 0.85; c.globalAlpha = a; c.drawImage(cm, ci * CS, 0, CS, CS, xs - L / 2, ys - L / 2, L, L); }
        // at the top: the release, a soft plume (and the vent at the end)
        c.globalAlpha = (0.35 + 0.35 * ex) * A; const pr = w * (1.6 + 1.5 * ex); c.drawImage(glowSprite(MINT), X - pr, Y - hgt - pr * 0.6, pr * 2, pr * 1.2);
        c.globalAlpha = 0.5 * A; const br = w * 1.3; c.drawImage(glowSprite(PALE), X - br, Y - br * 0.5, br * 2, br);
      } });

    /* a floor picture turned in the floor's own plane (squashed after turning) */
    function floorSpin(c, s, X, Y, r, ang, a) { if (r < 2 || a <= 0.01) return; c.save(); c.translate(X, Y); c.scale(1, GY); c.rotate(ang); c.globalAlpha = Math.min(1, a); c.drawImage(s, -r, -r, r * 2, r * 2); c.restore(); }
    /* the rings: side = -1 the back halves (under the monsters), +1 the front halves (over them) */
    function rings(c, X, Y, T, t, A, side) {
      const ex = exitU(t), col = sm(ex / 0.75), ru = ripU(t);
      for (const q of RINGS) { const g = ringG(q, t); if (g <= 0.01) continue; const s = want(q.v); if (!s) continue;
        // the entry: arriving from outside and below, curling round the edge as it rises; the exit: collapsing inward and venting up
        const boost = ru >= 0 ? Math.exp(-Math.pow((ru * 1.35 - q.q) / 0.13, 2)) * (CEL ? 1 : 0.5) : 0;
        const rr = R * T * q.r * (1 + 0.28 * (1 - H.ease.out(g))) * (1 - 0.82 * H.ease.in(col)) * (1 - 0.035 * boost) * (1 + 0.012 * Math.sin(t * 2.3 + q.ph));
        const z = T * (q.z * H.ease.out(g) + 2.2 * H.ease.in(col) * (1 + q.z * 0.4) + 0.05 * Math.sin(t * 1.7 + q.ph)), a = q.a * g * A * (1 - sm((ex - 0.45) / 0.5)) * (1 + 0.7 * boost);
        if (a <= 0.01 || rr < 2) continue; const cy0 = Y - z, ry = rr * GY;
        c.save(); c.beginPath(); if (side < 0) c.rect(X - rr * 1.3, cy0 - ry * 1.4, rr * 2.6, ry * 1.4); else c.rect(X - rr * 1.3, cy0, rr * 2.6, ry * 1.4); c.clip();
        c.globalCompositeOperation = q.v === 'sheetA' || q.v === 'sheetB' || q.v === 'funnel' ? 'source-over' : 'lighter';
        c.translate(X, cy0); if (q.tilt) c.rotate(q.tilt); c.scale(1, GY); c.rotate(q.rot); c.globalAlpha = Math.min(1, a); const k = rr / RS; c.drawImage(s, -RC * k, -RC * k, RW * k, RW * k); c.restore(); }
    }
    /* the debris: side -1 those behind the core and low, +1 the rest */
    function debris(c, X, Y, T, t, A, side) {
      const cm = want('comet'); if (!cm) return; const tr = sm(t / 0.3), mv = sm((t - 0.3) / 0.6);
      for (const p of deb) { if (p.age < 0 || p.gone) continue; const sn = Math.sin(p.th); if ((sn < 0 && !p.up) !== (side < 0)) continue;
        const jit = (1 - mv) * 0.05, wx = cx + Math.cos(p.th) * p.r + Math.sin(t * 41 + p.ph) * jit, wy = cy + Math.sin(p.th) * p.r * GY + Math.cos(t * 37 + p.ph) * jit * GY;
        const x = H.sx(wx), y = H.sy(wy) - p.z * T, a = A * tr * Math.min(1, p.age / 0.3) * (p.peel > 0 ? 1 - p.peel / 0.6 : 1) * (1 - sm((t - TE - 0.85) / 0.6)); if (a <= 0.02) continue;
        if (p.k === 'mote') { const r = T * 0.09 * p.s; c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.9; c.drawImage(glowSprite(PALE), x - r, y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; continue; }
        if (p.k === 'streak') { const w = omega(p.r) * p.r * mv, vx = -Math.sin(p.th) * w - Math.cos(p.th) * vin(p.r) * mv, vy = (Math.cos(p.th) * w - Math.sin(p.th) * vin(p.r) * mv) * GY - (p.up ? 1.5 : 0), sp = Math.hypot(vx, vy); if (sp < 0.2) continue;
          const ci = ((Math.round(Math.atan2(vy, vx) / TAU * CN) % CN) + CN) % CN, L = T * Math.min(0.85, 0.22 + sp * 0.11) * p.s; c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.7; c.drawImage(cm, ci * CS, 0, CS, CS, x - L / 2, y - L / 2, L, L); c.globalCompositeOperation = 'source-over'; continue; }
        const at = want(p.k); if (!at) continue; const ri = ((Math.floor(p.rot / TAU * PN) % PN) + PN) % PN, sz = T * (p.k === 'blossom' ? 0.46 : p.k === 'leaf' ? 0.34 : 0.3) * p.s, fy = 0.3 + 0.7 * Math.abs(Math.cos(t * p.tf + p.ph));
        c.globalAlpha = Math.min(1, a); c.drawImage(at, ri * PS, 0, PS, PS, x - sz / 2, y - sz * fy / 2, sz, sz * fy); }
      c.globalAlpha = 1;
    }
  };
  U.monsoon.warm = warm;
  U.monsoon.__dbg = { BK, bakeStep };
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d }; }
})();
