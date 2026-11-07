/* ---------- Wind ultimate: Pandemonium (replaces Loom of the Heavens) ----------
   The supreme offensive Wind ultimate: one enormous emerald cyclone over the aim lifts every monster in its footprint
   into a suspended eye, grinds them, makes every other allied hit on them land 40% harder, then ruptures in the
   element's biggest wind explosion.
   Atmosphere (1.4 s, before the window): the pet braces (a low squash); fine emerald strands race round the footprint;
   loose leaves and petals drift, then all turn toward the centre; light blades bend inward in a travelling wave; dust
   slides in on curved streams; broad ribbons coil round the pet and unfurl toward the centre; the ground pattern
   brightens from its rim inward and a narrow twisting column rises from the centre.
   Active window: exactly 7 s at level 1, 10 s at Adept, 14 s at Celestial (levels between interpolate), from the moment
   the pull, the ticks and the amplification begin to the finishing detonation. The column opens into a colossal canopy
   like a flower: a ground intake (cached floor swirls), a twisting lower funnel (fast streak rings and shaded bands), a
   clear eye at the top of the funnel holding the captives, and an upper canopy of shaded emerald wind bands (deep
   interiors, mint edges, pearly highlights) under a curling six-lobed corolla, white-green streaks racing between.
   The silhouette flexes (canopy breathes out as the funnel tightens), long outer ribbons curl round the mass and are
   drawn back into the intake. Petals (a few hundred cached-atlas blits plus petal clouds, each a cluster of tiny
   petals) enter along the floor, climb the funnel with luminous trails near the eye, circle the canopy and either
   recirculate or escape and drift. Each 0.5 s tick tightens the eye's bands in a pressure pulse.
   Capture: every non-boss, movable monster in the footprint (the floor ellipse, radius 3.2 / 3.9 / 4.8 x K) slides
   inward on a spiral at a capped speed into a slot round one anchor (a small sunflower cluster, gently turning) and is
   lifted while it slides: the height is m.liftZ, read only where monsters are drawn (20b), so melee, projectiles and
   area hits still find it at its floor spot; a lifted monster is held (20b's `held`). Bosses and fixed monsters are not
   moved but take the ticks and the amplification while inside.
   Amplification: an affected monster carries m.pandemUntil (refreshed every frame of the window); hitMon (20b) then
   multiplies every other allied hit by 1.4 (the caster's, party pets', summons', damage over time); the storm's own
   ticks and finale carry o.pandem. Thin emerald currents wind round affected monsters; an amplified hit tightens them
   and throws a sharp mint flare.
   Build-up (last 1.8 / 2.2 / 2.6 s, ticks and amplification continuing): the canopy lowers and folds into the eye, the
   flowers reverse and stream into the centre, the intake narrows and quickens, emerald lines climb the funnel, great
   curved wind petals close round the core like a bud (in sequence at Celestial), the outer motion stills.
   Finale at the window's end: one authoritative hit on every captive (hit before they are let go) and every monster in
   the footprint: an emerald-white flash in the eye; the bud tears open into a three-dimensional storm blossom of huge
   curved wind petals; a pressure column strikes the floor; a ground shockwave races out carrying a crest of flowers,
   leaves and glitter; long strands between the layers snap and unravel. Captives drop (landing squash) and are thrown
   outward (the floor's knockback rules: gaps still take them). Aftermath: wind rising outward, petals settling, the
   ground pattern fading from its rim inward, the last strands unravelling over the centre. Everything (heights, holds,
   amplification) is cleared at the end, at the pet's death (no finale then) and with the floor.
   Damage (DK = base x K x evoK, evoK = 1 + 0.08 (evo - 1)): ticks totalling 10 / 14 / 18 DK over the window (0.5 s on
   the game clock, NT = 14 / 20 / 28) plus a finale of 10 / 13 / 16 DK: ~20 / 27 / 34 DK for a captive (before the
   party's amplified hits). The finale is the move's strongest single hit.
   Performance: every soft shape is a cached sprite (feathered ring arms, floor swirls, a corolla, a wind-petal blade,
   a comet atlas in 16 directions, petal atlases in 12 turns, petal-cloud clusters, currents, a flare), baked a step at
   a time (a few ms a frame from the cast, or in idle time through U.pandemonium.warm); per frame only blits and a few
   untextured ribbon fills; no gradients, no shadowBlur. */
(() => {
  const U = ELEM_IMPL.wind.ult; delete U.loom;
  const TAU = Math.PI * 2;
  const MINT = '#73E8B6', EMER = '#16A57B', DEEP = '#0B5E48', MOSS = '#2FC28F', PALE = '#E7FFF6', PINK = '#FFAFD2', ROSE = '#DE5A9A', WHITE = '#FFFFFF';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const eout = u => { u = cl(u); return 1 - (1 - u) * (1 - u); }, eout3 = u => { u = cl(u); return 1 - Math.pow(1 - u, 3); }, ein = u => { u = cl(u); return u * u; };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, C.evo || 1));
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const GY = 0.55;
  let H;
  /* (a debug profile by section, off unless U.pandemonium.__dbg.prof is set) */
  const DBG = { prof: null, off: {} }, P0 = () => (DBG.prof ? performance.now() : 0), P1 = (k, t0) => { if (DBG.prof) DBG.prof[k] = (DBG.prof[k] || 0) + performance.now() - t0; };

  /* ---- the bake queue (as Monsoon's, 20k3c): size-free sprites painted a step at a time, never all at once ---- */
  const BK = { q: [], keys: new Set(), done: new Map(), ms: 0, built: 0, maxSlice: 0, job: null };
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  function want(key) { const s = BK.done.get(key); if (s) return s; if (!BK.keys.has(key) && BAKE[key]) { BK.keys.add(key); BK.q.push(key); } return null; }
  function bakeStep(budget) { const t0 = performance.now(); while ((BK.job || BK.q.length) && performance.now() - t0 < budget) { const s = performance.now();
      if (BK.job) { const j = BK.job; j.step(j.i++); if (j.i >= j.n) { finish(j.key, j.cv); BK.job = null; } }
      else { const k = BK.q.shift(), r = BAKE[k](); if (r.step) { r.key = k; r.i = 0; BK.job = r; } else finish(k, r); }
      const d = performance.now() - s; BK.ms += d; if (d > BK.maxSlice) BK.maxSlice = d; } }
  /* a finished picture is handed to the GPU once as an ImageBitmap (a canvas source can be re-uploaded on every draw,
     which made the big ring pictures the storm's main cost); the canvas serves until the bitmap is ready */
  function finish(k, cv) { BK.done.set(k, cv); BK.built++; if (typeof createImageBitmap === 'function' && !DBG.noBitmap) createImageBitmap(cv).then(bm => { if (BK.done.get(k) === cv) BK.done.set(k, bm); }, () => {}); }
  function wantAll() { for (const k in BAKE) want(k); }

  /* a tapered arm: a centre path (u -> [x, y, nx, ny]) and a half width (u -> px), filled in nested passes from wide and
     faint to narrow and bright, so every edge and both ends are feathered; passes [colour, alpha, width, offset] */
  function arm(g, path, hw, passes, N, h) {
    const P = []; for (let i = 0; i <= N; i++) { const u = i / N; P.push(path(u).concat(hw(u))); }
    const q0 = h == null ? 0 : h ? passes.length >> 1 : 0, q1 = h == null ? passes.length : h ? passes.length : passes.length >> 1;
    for (let q = q0; q < q1; q++) { const [col, a, wm, off] = passes[q]; g.fillStyle = rgbaS(col, a); g.beginPath();
      for (let i = 0; i <= N; i++) { const p = P[i], o = (off || 0) * p[4], k = p[4] * wm + o; const x = p[0] + p[2] * k, y = p[1] + p[3] * k; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      for (let i = N; i >= 0; i--) { const p = P[i], o = (off || 0) * p[4], k = -p[4] * wm + o; g.lineTo(p[0] + p[2] * k, p[1] + p[3] * k); }
      g.closePath(); g.fill(); } }
  /* a path's normal by finite differences */
  const normd = (at, u) => { const q = at(Math.min(1, u + 0.01)), p0 = at(Math.max(0, u - 0.01)), dx = q[0] - p0[0], dy = q[1] - p0[1], d = Math.hypot(dx, dy) || 1, p = at(u); return [p[0], p[1], -dy / d, dx / d]; };
  const env = u => Math.pow(sm(u / 0.72), 1.25) * sm((1 - u) / 0.16);
  /* the normal of a path turned to face away from a point (the storm's axis in the sprite) */
  const awayFrom = (path, cx, cy) => u => { const p = path(u), d = (p[0] - cx) * p[2] + (p[1] - cy) * p[3]; return d < 0 ? [p[0], p[1], -p[2], -p[3]] : p; };
  /* a wind blade's cross-section (the user's look): across its width, from the side nearest the storm's centre to the
     side furthest from it: fully transparent -> faint emerald -> stronger emerald -> a thin, crisp, bright mint-white rim.
     Built as nested fills that all share the outer edge (so that edge is sharp) and start further and further out (so
     the inner side fades to nothing with no outline); each layer's alpha is chosen so the stack composites (source-over)
     to the profile. x runs -1 (inner edge) .. +1 (outer edge) in half-widths; rim = the rim's width in half-widths.
     Passes [colour, alpha, width, offset] for arm() (positive offsets = outward). */
  const hx = h => { const [r, g, b] = hexRGB(h); return [r, g, b]; }, hexOf = v => '#' + v.map(k => Math.round(k).toString(16).padStart(2, '0')).join('');
  const ramp = (stops, u) => { u = cl(u); for (let i = 1; i < stops.length; i++) if (u <= stops[i][0]) { const [u0, c0] = stops[i - 1], [u1, c1] = stops[i], k = (u - u0) / (u1 - u0 || 1), a = hx(c0), b = hx(c1); return hexOf(a.map((v, j) => v + (b[j] - v) * k)); } return stops[stops.length - 1][1]; };
  const BLADE_COL = [[0, DEEP], [0.45, EMER], [0.8, MOSS], [1, MINT]];
  function bladeProfile(rim, peak, N) {
    rim = Math.min(0.5, rim); N = N || 12; const xr = 1 - rim, L = []; let prev = 0;
    const layer = (s, A, col) => { A = Math.min(0.985, A); if (A <= prev + 1e-4) return; const a = 1 - (1 - A) / (1 - prev); prev = A; L.push([col, +a.toFixed(4), (1 - s) / 2, (1 + s) / 2]); };
    for (let j = 0; j < N; j++) { const s0 = -1 + (xr + 1) * j / N, um = (j + 0.5) / N; layer(s0, peak * Math.pow(um, 1.15) * (0.75 + 0.25 * sm(um)), ramp(BLADE_COL, um)); }
    layer(xr - rim * 0.35, Math.min(0.93, peak + (0.93 - peak) * 0.45), MINT);   // a hair of anti-aliasing into the rim, not a blur
    layer(xr, 0.93, PALE); layer(1 - rim * 0.45, 0.97, WHITE);
    return L; }
  /* the same layers for a screen-space ribbon (colour strings for fillStyle) */
  const ribPasses = P => P.map(([col, a, k, off]) => [rgbaS(col, 1), a, k, off]);
  /* rings of arms round a circle (radius RS in an RW sprite), leading clockwise on screen (the flow) */
  const RW = 384, RC = RW / 2, RS = 160;
  function ringBake(o) { const cv = mk(RW, RW), g = cv.getContext('2d');
    return { cv, n: o.n * 2, step(i) { const a = i >> 1, h = i & 1, a0 = a / o.n * TAU + (o.jit ? (R1(a * 3.7 + o.seed) - 0.5) * o.jit : 0), span = o.span * (o.spanJ ? 1 - o.spanJ * R1(a * 5.1 + o.seed) : 1), rr = RS * (o.rj ? 1 + (R1(a * 2.3 + o.seed) - 0.5) * o.rj : 1), wv = o.wave || 0;
      arm(g, u => { const b = a0 + u * span, r = rr + Math.sin(u * Math.PI * 2 + a) * wv; return [RC + Math.cos(b) * r, RC + Math.sin(b) * r, Math.cos(b), Math.sin(b)]; }, u => o.hw * env(u) * (o.hwJ ? 1 - o.hwJ * R1(a + o.seed) : 1), o.passes, Math.round(28 + 22 * o.span), h); } }; }
  /* the canopy's crown: six wind petals curling outward from the centre like an opening flower */
  function corollaBake() { const cv = mk(RW, RW), g = cv.getContext('2d'), n = 6;
    return { cv, n: n * 2, step(j) { const i = j >> 1, a0 = i / n * TAU + 0.2 * R1(i * 2.1), at = u => { const b = a0 + u * 0.9 + 0.55 * u * u, r = RS * (0.3 + 0.82 * u); return [RC + Math.cos(b) * r, RC + Math.sin(b) * r]; };
      arm(g, awayFrom(u => normd(at, u), RC, RC), u => 30 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.85) * (1 - 0.25 * u), COROLLA, 48, j & 1); } }; }
  /* a floor swirl seen from above: arms spiralling from the rim to the core, carried inward when turned with the flow */
  const SW = 384, SC = SW / 2;
  function swirlBake(o) { const cv = mk(SW, SW), g = cv.getContext('2d');
    return { cv, n: o.n * 2, step(i) { const a = i >> 1, a0 = a / o.n * TAU + (R1(a * 1.9 + o.seed) - 0.5) * 0.4, k = o.k * (0.85 + 0.3 * R1(a * 4.4 + o.seed)), r0 = SC * o.r0 * (0.92 + 0.08 * R1(a + o.seed)), r1 = SC * o.r1;
      const at = u => { const r = lerp(r0, r1, u), b = a0 - k * u; return [SC + Math.cos(b) * r, SC + Math.sin(b) * r]; };
      arm(g, awayFrom(u => normd(at, u), SC, SC), u => lerp(o.w0, o.w1, u) * sm(u / o.fin) * sm((1 - u) / o.fout), o.passes, 44, i & 1); } }; }
  /* a comet (a streak of air) along one of 16 directions, in an atlas of 48 px cells */
  const CN = 16, CS = 48;
  function cometBake() { const cv = mk(CS * CN, CS), g = cv.getContext('2d');
    return { cv, n: CN, step(i) { const b = i / CN * TAU, cx = CS * i + CS / 2, cy = CS / 2, L = 42, dx = Math.cos(b), dy = Math.sin(b);
      arm(g, u => [cx + dx * (u - 0.5) * L, cy + dy * (u - 0.5) * L, -dy, dx], u => 3.2 * env(u), [[MINT, 0.22, 1], [PALE, 0.5, 0.55], [WHITE, 0.85, 0.2]], 20); } }; }
  /* petal atlases: 12 turns of one shaded shape in 40 px cells */
  const PN = 12, PS = 40;
  function petalBake(kind) { const cv = mk(PS * PN, PS), g = cv.getContext('2d');
    return { cv, n: PN, step(i) { g.save(); g.translate(PS * i + PS / 2, PS / 2); g.rotate(i / PN * TAU); g.lineJoin = 'round';
      if (kind === 'leaf') { const L = 14, W = 7.5; g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(-2, -W * 1.25, L, 0); g.quadraticCurveTo(-2, W * 1.25, -L, 0); g.closePath();
        const gr = g.createLinearGradient(0, -W, 0, W); gr.addColorStop(0, PALE); gr.addColorStop(0.35, '#9CF2CB'); gr.addColorStop(0.7, '#3FC593'); gr.addColorStop(1, EMER); g.fillStyle = gr; g.fill();
        g.strokeStyle = 'rgba(14,110,80,0.75)'; g.lineWidth = 1.1; g.stroke(); g.strokeStyle = 'rgba(231,255,246,0.85)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-L + 2, 0.5); g.quadraticCurveTo(0, -1.2, L - 2, 0); g.stroke(); }
      else if (kind === 'petal' || kind === 'pale') { const pk = kind === 'petal'; g.beginPath(); g.moveTo(-11, 0); g.bezierCurveTo(-8, -9.5, 6, -10, 11.5, -3.2); g.lineTo(8.6, 0); g.lineTo(11.5, 3.2); g.bezierCurveTo(6, 10, -8, 9.5, -11, 0); g.closePath();
        const gr = g.createLinearGradient(-11, -6, 11, 6); if (pk) { gr.addColorStop(0, ROSE); gr.addColorStop(0.35, '#F38DBE'); gr.addColorStop(0.75, PINK); gr.addColorStop(1, '#FFE6F1'); } else { gr.addColorStop(0, '#FFC9E0'); gr.addColorStop(0.5, '#FFF0F6'); gr.addColorStop(1, WHITE); } g.fillStyle = gr; g.fill();
        g.strokeStyle = pk ? 'rgba(170,50,110,0.7)' : 'rgba(200,110,150,0.5)'; g.lineWidth = 1; g.stroke(); g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(2, -3.5, 5, 1.8, -0.25, 0, TAU); g.fill(); }
      else { for (let p = 0; p < 5; p++) { const b = p / 5 * TAU; g.save(); g.rotate(b); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-7, -4, -7.5, -14, -2.2, -15.5); g.lineTo(0, -13.6); g.lineTo(2.2, -15.5); g.bezierCurveTo(7.5, -14, 7, -4, 0, 0); g.closePath();
          const gr = g.createLinearGradient(0, 0, 0, -15); gr.addColorStop(0, ROSE); gr.addColorStop(0.35, '#F79AC6'); gr.addColorStop(1, '#FFE3F0'); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(160,40,100,0.65)'; g.lineWidth = 1; g.stroke(); g.restore(); }
        g.fillStyle = '#FFF4C9'; g.beginPath(); g.arc(0, 0, 3.2, 0, TAU); g.fill(); g.fillStyle = 'rgba(222,90,154,0.9)'; for (let p = 0; p < 5; p++) { const b = p / 5 * TAU + 0.6; g.beginPath(); g.arc(Math.cos(b) * 2.2, Math.sin(b) * 2.2, 0.9, 0, TAU); g.fill(); } }
      g.restore(); } }; }
  /* petal clouds: clusters of tiny petals, blossoms and mint specks (one blit reads as a dozen flowers) */
  const QN = 4, QS = 72;
  function cloudBake() { const cv = mk(QS * QN, QS), g = cv.getContext('2d'), tones = [ROSE, '#F38DBE', PINK, '#FFD3E6', '#FFF0F6'];
    return { cv, n: QN, step(v) { const ox = QS * v + QS / 2, oy = QS / 2;
      for (let i = 0; i < 30; i++) { const a = R1(v * 31 + i * 1.7) * TAU, rr = 27 * Math.sqrt(R1(v * 17 + i * 2.9)), x = ox + Math.cos(a) * rr, y = oy + Math.sin(a) * rr * 0.8, s = 1.6 + 2.2 * R1(v * 7 + i * 5.3), rot = R1(i * 9.1 + v) * TAU;
        g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = tones[(i + v) % tones.length]; g.beginPath(); g.ellipse(0, 0, s * 1.5, s * 0.75, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(-s * 0.3, -s * 0.2, s * 0.6, s * 0.25, 0, 0, TAU); g.fill(); g.restore(); }
      for (let i = 0; i < 3; i++) { const a = R1(v * 13 + i * 4.1) * TAU, rr = 18 * Math.sqrt(R1(v * 5 + i * 8.3)), x = ox + Math.cos(a) * rr, y = oy + Math.sin(a) * rr * 0.8;
        g.fillStyle = '#F79AC6'; for (let p = 0; p < 5; p++) { const b = p / 5 * TAU; g.beginPath(); g.arc(x + Math.cos(b) * 2.6, y + Math.sin(b) * 2.6, 2.2, 0, TAU); g.fill(); } g.fillStyle = '#FFF4C9'; g.beginPath(); g.arc(x, y, 1.4, 0, TAU); g.fill(); }
      for (let i = 0; i < 6; i++) { const a = R1(v * 3 + i * 6.7) * TAU, rr = 28 * Math.sqrt(R1(v * 11 + i * 3.1)); g.fillStyle = i % 2 ? 'rgba(115,232,182,0.8)' : 'rgba(231,255,246,0.9)'; g.beginPath(); g.arc(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr * 0.8, 1.1, 0, TAU); g.fill(); } } }; }
  /* a great curved wind petal (the bud and the storm blossom): base at (14, 64), tip at the right, bowed and curling
     up, a deep emerald interior shaded toward its lower side, translucent mint edges, a thin pearly highlight */
  const WPW = 320, WPH = 128, WPB = 14, WPY = 64, WPL = 296;
  const PETAL = bladeProfile(3.6 / 50, 0.56), COROLLA = bladeProfile(2.8 / 30, 0.55);
  function wpetalBake() { const cv = mk(WPW, WPH), g = cv.getContext('2d'), at = u => [WPB + u * WPL, WPY - Math.sin(Math.PI * u) * 12 - Math.pow(Math.max(0, u - 0.62) / 0.38, 2) * 16];
    arm(g, awayFrom(u => normd(at, u), WPW / 2, WPY + 600), u => 50 * Math.pow(Math.sin(Math.PI * Math.min(1, Math.pow(u, 0.7))), 0.75) * (1 - 0.28 * u) * Math.pow(sm(u / 0.16), 0.7), PETAL, 64); return cv; }
  /* the sharp mint flare of an amplified hit: a soft halo, a long horizontal spike, a shorter vertical, small diagonals */
  function flareBake() { const n = 128, cv = mk(n, n), g = cv.getContext('2d'), c = n / 2, gr = g.createRadialGradient(c, c, 0, c, c, c * 0.6);
    gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.2, 'rgba(231,255,246,0.6)'); gr.addColorStop(0.55, 'rgba(115,232,182,0.18)'); gr.addColorStop(1, 'rgba(115,232,182,0)'); g.fillStyle = gr; g.fillRect(0, 0, n, n);
    const spike = (a, L, W) => { for (const [col, al, k] of [[MINT, 0.35, 1], [PALE, 0.7, 0.55], [WHITE, 1, 0.22]]) { g.fillStyle = rgbaS(col, al); g.beginPath(); g.moveTo(c + Math.cos(a) * L, c + Math.sin(a) * L); g.lineTo(c + Math.cos(a + Math.PI / 2) * W * k, c + Math.sin(a + Math.PI / 2) * W * k); g.lineTo(c - Math.cos(a) * L, c - Math.sin(a) * L); g.lineTo(c - Math.cos(a + Math.PI / 2) * W * k, c - Math.sin(a + Math.PI / 2) * W * k); g.closePath(); g.fill(); } };
    spike(0, 62, 5); spike(Math.PI / 2, 40, 4); spike(Math.PI / 4, 20, 2.5); spike(-Math.PI / 4, 20, 2.5); return cv; }
  /* thin emerald currents (three spiralling threads) wound round an affected monster */
  function currentBake() { const n = 128, cv = mk(n, n), g = cv.getContext('2d'), c = n / 2;
    for (let i = 0; i < 3; i++) { const a0 = i / 3 * TAU, at = u => { const b = a0 + u * 2.0, r = 50 - 10 * u; return [c + Math.cos(b) * r, c + Math.sin(b) * r]; };
      arm(g, u => normd(at, u), u => 2.6 * Math.sin(Math.PI * u), [[EMER, 0.5, 1.7], [MINT, 0.75, 0.85], [PALE, 0.95, 0.3]], 40); }
    return cv; }
  function radialBake(stops, n) { const cv = mk(n, n), g = cv.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, n, n); return cv; }
  function columnBake() { const W = 64, Hh = 256, cv = mk(W, Hh), g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, W, 0);
    [[0, 'rgba(22,165,123,0)'], [0.2, 'rgba(22,165,123,0.10)'], [0.36, 'rgba(115,232,182,0.32)'], [0.46, 'rgba(231,255,246,0.62)'], [0.5, 'rgba(255,255,255,0.8)'], [0.54, 'rgba(231,255,246,0.62)'], [0.64, 'rgba(115,232,182,0.32)'], [0.8, 'rgba(22,165,123,0.10)'], [1, 'rgba(22,165,123,0)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, W, Hh); g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, Hh);
    gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.18, 'rgba(0,0,0,0.85)'); gv.addColorStop(0.85, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gv; g.fillRect(0, 0, W, Hh); return cv; }

  /* the ring variants: broad shaded bands (deep interior toward the axis, mint outer edge, a pearly line), lower funnel
     bands, thin pale streaks, short pressure arcs */
  /* (rim widths: about 2 screen px where each sprite is usually drawn) */
  const BAND = bladeProfile(2.6 / 21, 0.55), BANDB = bladeProfile(2.6 / 17, 0.55), FUNB = bladeProfile(3.4 / 11, 0.55);
  const STREAK = [[MINT, 0.22, 1], [PALE, 0.42, 0.5], [WHITE, 0.8, 0.18]];
  const BAKE = {
    comet: cometBake, petal: () => petalBake('petal'), blossom: () => petalBake('blossom'), leaf: () => petalBake('leaf'), pale: () => petalBake('pale'),
    rim: () => radialBake([[0, 'rgba(115,232,182,0)'], [0.72, 'rgba(115,232,182,0)'], [0.87, 'rgba(115,232,182,0.2)'], [0.95, 'rgba(231,255,246,0.45)'], [1, 'rgba(231,255,246,0)']], 256),
    ripple: () => radialBake([[0, 'rgba(115,232,182,0)'], [0.8, 'rgba(115,232,182,0)'], [0.9, 'rgba(115,232,182,0.4)'], [0.95, 'rgba(255,255,255,0.75)'], [0.985, 'rgba(231,255,246,0.2)'], [1, 'rgba(231,255,246,0)']], 256),
    pool: () => radialBake([[0, 'rgba(231,255,246,0.7)'], [0.25, 'rgba(115,232,182,0.35)'], [0.6, 'rgba(22,165,123,0.1)'], [1, 'rgba(22,165,123,0)']], 128),
    column: columnBake, cloud: cloudBake,
    intake: () => swirlBake({ n: 5, k: 2.4, r0: 0.97, r1: 0.12, w0: 22, w1: 5, fin: 0.3, fout: 0.4, seed: 2, passes: bladeProfile(3.2 / 22, 0.42) }),
    inner: () => swirlBake({ n: 9, k: 3.2, r0: 0.8, r1: 0.1, w0: 4.5, w1: 1.5, fin: 0.25, fout: 0.35, seed: 9, passes: [[MINT, 0.22, 1], [PALE, 0.5, 0.45]] }),
    streak: () => ringBake({ n: 5, span: 0.95, hw: 4.2, seed: 3, jit: 0.6, spanJ: 0.4, rj: 0.1, passes: STREAK }),
    arcs: () => ringBake({ n: 8, span: 0.42, hw: 3.4, seed: 5, jit: 0.5, spanJ: 0.3, rj: 0.16, passes: [[PALE, 0.28, 1], [WHITE, 0.75, 0.4]] }),
    funnel: () => ringBake({ n: 3, span: 1.7, hw: 11, wave: 3, seed: 11, jit: 0.4, passes: FUNB }),
    bandA: () => ringBake({ n: 2, span: 2.45, hw: 21, wave: 5, seed: 1, passes: BAND }),
    bandB: () => ringBake({ n: 3, span: 1.6, hw: 17, wave: 6, seed: 7, jit: 0.5, spanJ: 0.25, passes: BANDB }),
    corolla: corollaBake, wpetal: wpetalBake, current: currentBake, flare: flareBake,
  };
  let warmT = 0;
  const warm = () => { wantAll(); if (warmT || !BK.q.length) return; const step = () => { bakeStep(4); warmT = BK.q.length || BK.job ? setTimeout(step, 40) : 0; }; warmT = setTimeout(step, 60); };

  /* ================= Pandemonium ================= */
  U.pandemonium = (C, h) => {
    H = h; wantAll(); bakeStep(2);
    const me = H.me, g = H.g, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, K = C.K || 1, sK = Math.sqrt(K), evoK = 1 + 0.08 * (ev - 1), DK = C.base * K * evoK;
    /* the window 7 / 10 / 14 s exactly (interpolated between), the footprint radius 3.2 / 3.9 / 4.8 x K likewise */
    const DUR = ev <= 4 ? 7 + (ev - 1) : 10 + (ev - 4) * 4 / 3, R = (ev <= 4 ? 3.2 + (ev - 1) * 0.7 / 3 : 3.9 + (ev - 4) * 0.3) * K;
    const FORM = 1.4, TE = FORM + DUR, AFT = 3.2, LIFE = TE + AFT, TICK = 0.5, NT = Math.floor(DUR / TICK + 1e-6), CMP = CEL ? 2.6 : ADE ? 2.2 : 1.8;
    const TOT = (10 + (ev - 1) * 4 / 3) * DK, PER = TOT / NT, FIN = (10 + (ev - 1)) * DK;
    const E = (1.1 + 0.03 * (ev - 1)) * sK, ZE = (1.75 + 0.05 * (ev - 1)) * sK, ZC = (4.0 + 0.16 * (ev - 1)) * sK, VMAX = 2.4 * sK;
    const p0 = H.X.walkPoint(C.tx, C.ty, { r: 0.5, mv: 0 }), cx = p0.x, cy = p0.y;
    const inField = (m, pad) => { const dx = (m.x - cx) / (R * pad + m.r), dy = (m.y - cy) / (R * GY * pad + m.r); return dx * dx + dy * dy < 1; };
    /* --- the rings: layer, height (tiles), radius (tiles, before flex), sprite, turn (rad/s), alpha, opening delay --- */
    const funR0 = z => lerp(R * 0.48, E * 0.95, sm(z / ZE)), canR0 = u => lerp(E * 1.12, R * 1.06, Math.pow(cl(u), 0.72)), canZ = u => lerp(ZE + 0.65 * sK, ZC, u);
    const RINGS = [
      { L: 'fun', z: 0.1 * ZE, v: 'bandB', w: 0.85, a: 0.7 }, { L: 'fun', z: 0.32 * ZE, v: 'streak', w: 2.3, a: 0.85 },
      { L: 'fun', z: 0.52 * ZE, v: 'funnel', w: 1.6, a: 0.8 }, { L: 'fun', z: 0.74 * ZE, v: 'streak', w: 2.9, a: 0.75 },
      { L: 'eye', z: ZE - 0.2, r: E * 1.18, v: 'arcs', w: 3.3, a: 0.7 }, { L: 'eye', z: ZE + 0.42, r: E * 1.12, v: 'streak', w: 3.0, a: 0.55 } ];
    const CU = CEL ? [0.08, 0.24, 0.4, 0.56, 0.72, 0.87, 1] : ADE ? [0.1, 0.3, 0.5, 0.7, 0.86, 1] : [0.12, 0.36, 0.6, 0.82, 1];
    CU.forEach((u, i) => RINGS.push({ L: 'can', u, v: i % 2 ? 'bandB' : 'bandA', w: lerp(0.62, 0.32, u) * (CEL && i % 2 ? 0.7 : 1), a: 0.92, tilt: CEL ? (i % 2 ? 0.09 : -0.08) : 0 }));
    [0.48, 0.92].concat(ADE ? [0.25] : []).concat(CEL ? [0.66, 0.8, 0.12] : []).forEach(u => RINGS.push({ L: 'can', u, v: 'streak', w: 1.7, a: CEL ? 0.8 : 0.65, rk: 0.97 }));
    if (ADE) [0.3, 0.62, 0.9].forEach(u => RINGS.push({ L: 'can', u, v: 'bandB', w: 0.4, a: 0.7, rk: 1.15, dz: -0.3, outer: true }));
    if (CEL) RINGS.push({ L: 'fun', z: 0.9 * ZE, v: 'funnel', w: 2.2, a: 0.7, tilt: 0.06 }, { L: 'can', u: 0.45, v: 'arcs', w: 2.2, a: 0.6, rk: 0.9 });
    RINGS.forEach((q, i) => { q.ph = R1(i * 7.3) * TAU; q.rot = q.ph; q.zb = q.L === 'can' ? canZ(q.u) + (q.dz || 0) : q.z; q.d = q.L === 'can' ? 0.35 + q.u * 0.75 : q.L === 'eye' ? 0.3 : q.z / ZE * 0.25; });
    RINGS.sort((p, q) => p.zb - q.zb);
    /* --- the petals: kinds, flow modes (0 drift, 1 intake, 2 climb, 3 canopy, 4 outer ribbon, 5 escape, 6 drawn to the core, 7 burst) --- */
    const NPF = H.n(CEL ? 110 : ADE ? 95 : 80), NCL = H.n(CEL ? 56 : ADE ? 46 : 36), pts = [];
    const KINDS = ['petal', 'petal', 'blossom', 'petal', 'pale', 'leaf', 'dust', 'petal', 'blossom', 'leaf', 'petal', 'dust', 'pale', 'petal'];
    function respawn(p, first) { p.r = R * (first ? 0.25 + 0.9 * Math.sqrt(Math.random()) : 0.95 + 0.15 * Math.random()); p.th = Math.random() * TAU; p.z = 0.05 + Math.random() * 0.15; p.m = first ? 0 : 1; p.e = 0; p.s0 = 0; p.gone = false; p.al = first ? 0 : -0.3; if (first && Math.random() > 0.3) { p.m = 1; p.r = R * (1.0 + 0.2 * Math.random()); p.al = -0.6 - Math.random() * 2.2; } }
    for (let i = 0; i < NPF + NCL; i++) { const p = { k: i < NPF ? KINDS[i % KINDS.length] : 'cloud', v: i % QN, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 7, tf: 2 + Math.random() * 4, ph: Math.random() * TAU, s: 0.75 + Math.random() * 0.5, vz: 1.2 + Math.random() * 0.9, off: (Math.random() - 0.5) * 0.7, zo: (Math.random() - 0.5) * 0.8, rec: Math.random() < 0.55, px: null, py: null }; respawn(p, true); pts.push(p); }
    const blades = []; for (let i = 0; i < H.n(CEL ? 70 : 54); i++) blades.push({ r: R * (0.25 + 0.8 * Math.sqrt(R1(i * 3.1))), th: R1(i * 5.7) * TAU, ph: R1(i * 1.3) * TAU, s: 0.7 + 0.5 * R1(i * 9.9) });
    const crest = []; const glit = [];
    /* the bud / blossom petals: azimuth, the opening's final elevation and length */
    const NB = CEL ? 12 : ADE ? 10 : 8, LB = E * 2.1, LMAX = (CEL ? 6.2 : ADE ? 5.0 : 4.0) * sK, BP = [];
    for (let i = 0; i < NB; i++) BP.push({ phi: i / NB * TAU + 0.15, thf: [0.95, 0.4, -0.05][i % 3] + (R1(i * 4.4) - 0.5) * 0.25, lf: LMAX * (0.72 + 0.28 * R1(i * 2.7)), inner: false });
    if (CEL) for (let i = 0; i < 6; i++) BP.push({ phi: (i + 0.5) / 6 * TAU, thf: 1.18, lf: LMAX * 0.62, inner: true });
    const NSTR = CEL ? 12 : ADE ? 10 : 8, RSW = R * (CEL ? 1.9 : ADE ? 1.7 : 1.5);
    /* --- the monsters affected: record per monster (captured ones carry a slot, a lift and a release) --- */
    const rec = new Map(); const CAPS = []; let order = 0, next = 0, scanT = 0, dead = false, fin = false, lastTick = -9, endK = 1, braced = false, lastWh = 0;
    H.X.banner('PANDEMONIUM', '', C.col, 1.4); H.X.sfx.hum();
    H.X.after(0.6, () => { if (!dead) H.X.sfx.whoosh(); });
    H.X.after(FORM, () => { if (dead) return; H.X.shake(4, 0.3); H.X.light(cx, cy, R * 0.8, 0.5); H.X.sfx.whoosh(); });

    // the storm's phases on its own clock: the opening, the build-up (c), the still before the burst (hold), the burst (te)
    const opening = t => sm((t - FORM + 0.4) / 1.4), compress = t => (t < TE ? sm((t - (TE - CMP)) / (CMP - 0.25)) : 1), holdU = t => (t < TE ? sm((t - (TE - 0.45)) / 0.3) : 1);
    const pulseAt = t => (t >= lastTick && lastTick > 0 ? Math.exp(-(t - lastTick) / 0.14) : 0);
    let ZCc = ZC, RCc = R * 1.06, cK = 0, hK = 0, pK = 0;
    const funR = z => (z <= ZE ? funR0(z) * (1 - 0.3 * cK) : lerp(E * 1.12, RCc, Math.pow(cl((z - ZE - 0.65 * sK) / Math.max(0.3, ZCc - ZE - 0.65 * sK)), 0.72)));
    const omega = (r, z) => (0.6 + 2.6 / (0.45 + r / E)) * (z > ZE + 0.6 ? 0.55 : 1);
    function capture(m) { const q = { m, cap: !(m.boss || m.still), k: order++, lz: 0, a: 0, ph: Math.random() * TAU, lh: m.pandemHitT, fl: -9, age: 0, rel: null, out: false }; rec.set(m, q); return q; }
    function letGo(q, t, throwK) { const m = q.m; if (!q.cap || q.rel) return; q.rel = { t0: t, z0: q.lz };
      if (throwK && !m.dead && !m.still) { let dx = m.x - cx, dy = m.y - cy, d = Math.hypot(dx, dy); if (d < 0.05) { const a = Math.random() * TAU; dx = Math.cos(a); dy = Math.sin(a); d = 1; } const f = throwK * (m.type === 'golem' || m.type === 'knight' ? 0.5 : 1); m.kbx = (m.kbx || 0) + dx / d * f; m.kby = (m.kby || 0) + dy / d * f; } }
    /* (a captive that turns fixed or into a boss part-way is set down where it is and only stays affected) */
    function letGoFree(q, t) { if (q.lz > 0.01 && !q.rel) q.rel = { t0: t, z0: q.lz }; }
    function clearAll() { for (const [m, q] of rec) { if (m.liftZ != null) delete m.liftZ; m.pandemUntil = 0; } if (braced) { me.hopSq = 0; braced = false; } }

    const F = H.add({ life: LIFE, x: cx, y: cy, key: 'pandemonium',
      update(dt, f) {
        const t = f.t; bakeStep(3); const t0p = DBG.prof ? performance.now() : 0;
        if (me.dead && !dead && t < TE) { dead = true; f.life = Math.min(f.life, 0.9); for (const q of rec.values()) { q.m.pandemUntil = 0; letGo(q, t, 0); } }
        if (dead) endK = cl(f.life / 0.9);
        cK = compress(t); hK = holdU(t); pK = pulseAt(t);
        ZCc = lerp(ZC, ZE + 1.1 * sK, ein(cK) * 0.9) * (1 + 0.03 * Math.sin(t * 0.9)); RCc = lerp(R * 1.06, E * 1.7, eout(cK)) * (1 + 0.05 * Math.sin(t * 0.9));
        // the brace: the pet lowers into its stance while the storm gathers, then straightens
        if (t < FORM + 0.4 && !dead) { braced = true; me.hopSq = 0.16 * sm(t / 0.25) * (1 - sm((t - FORM) / 0.35)); if (t < FORM) me.face = cx >= me.x ? 1 : -1; } else if (braced) { me.hopSq = 0; braced = false; }
        const live = t >= FORM && t < TE && !dead;
        if (live) {
          // whoever is in the footprint is affected (and, unless a boss or fixed, captured)
          if (t >= scanT) { scanT = t + 0.1; for (const m of H.living()) if (!rec.has(m) && inField(m, 1.06)) capture(m); }   // (a look for newcomers ten times a second)
          // the ticks on the game clock: NT of them, every one strictly inside the window, a pressure pulse with each
          while (next < NT && t >= FORM + TICK * (next + 0.5)) { const n0 = next++; lastTick = t; let hit = 0;
            for (const q of rec.values()) { const m = q.m; if (m.dead || q.out) continue; H.X.hitMon(m, PER, C.dmgO({ pandem: true })); hit++; if (Math.random() < 0.4 * H.Q()) H.P({ kind: 'spark', x: m.x, y: m.y - 0.3 - (m.liftZ || 0), vx: (Math.random() - 0.5) * 3, vy: -1.5, life: 0.35, max: 0.35, size: 2, color: PALE }); }
            if (hit && n0 % 4 === 3 && t - lastWh > 1.8) { lastWh = t; H.X.sfx.whoosh(); } }
          // the gathering: an inward spiral into one small turning cluster, lifted on the way in
          CAPS.length = 0; for (const q of rec.values()) { if (q.cap && (q.m.boss || q.m.still)) { q.cap = false; letGoFree(q, t); } if (q.cap && !q.m.dead && !q.rel) CAPS.push(q); }   // (in capture order: the map keeps it)
          const ramp = sm((t - FORM) / 0.7), spin = t * 0.35, SP = 0.5 * (1 - 0.18 * cK);
          for (let i = 0; i < CAPS.length; i++) { const q = CAPS[i], m = q.m; q.age += dt; const sa = i * 2.39996 + spin, sr = i ? SP * Math.sqrt(i + 0.3) : 0.12, tx = cx + Math.cos(sa) * sr, ty = cy + Math.sin(sa) * sr * 0.8;
            const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
            if (d > 0.02) { const v = Math.min(VMAX, 0.45 + 2.2 * d) * ramp, s = Math.min(d, v * dt), ux = dx / d, uy = dy / d, tw = 0.5 * sm((d - 0.8) / 2); H.X.moveEnt(m, (ux + uy * tw) * s, (uy - ux * tw) * s, 0); }
            const dA = Math.hypot(m.x - cx, m.y - cy), lzT = (ZE - 0.35 * sK + ((i % 3) - 1) * 0.16 + 0.15 * cK) * sm(1.12 - (dA - 0.5) / (R * 0.85)) * sm(q.age / 0.45);
            q.lz += (lzT - q.lz) * Math.min(1, dt * 2.6); m.liftZ = q.lz + 0.07 * Math.sin(t * 2.2 + q.ph) * sm(q.lz / ZE); }
          for (const q of rec.values()) { const m = q.m; if (m.dead) continue; if (!q.cap && !inField(m, 1.12)) { q.out = true; continue; } q.out = false; m.pandemUntil = g.t + 0.25; }
        }
        // the finale: one authoritative hit on every captive (before letting go) and on everything in the footprint
        if (!fin && !dead && t >= TE) { fin = true; let n = 0; const qh = P0();
          for (const q of rec.values()) { const m = q.m; if (m.dead) continue; m.pandemUntil = 0; if (q.out && !inField(m, 1.15)) continue; H.X.hitMon(m, FIN, C.dmgO({ pandem: true })); n++; }
          for (const m of H.living()) if (!rec.has(m) && inField(m, 1.15)) { H.X.hitMon(m, FIN, C.dmgO({ pandem: true })); n++; }
          for (const q of rec.values()) letGo(q, t, 6.5); P1('finHits', qh); const qb = P0();
          burst(); P1('finBurst', qb); H.X.shake(CEL ? 16 : ADE ? 13 : 11, 0.5); H.X.flash(0.28, PALE); if (H.X.hitstop) H.X.hitstop(0.06); H.X.light(cx, cy, R * 1.6, 1); H.X.sfx.crash(); H.X.after(0.08, () => H.X.sfx.whoosh());
          H.burst(cx, cy - ZE * 0.5, 'spark', CEL ? 18 : 12, { v: 7, life: 0.5, size: 2, color: [MINT, PINK, MINT], drag: 2 }); }
        // released captives drop to the floor (a landing squash), then their height is gone
        for (const q of rec.values()) { const m = q.m; if (m.dead) { if (m.liftZ != null) delete m.liftZ; continue; }
          if (q.rel) { const u = cl((t - q.rel.t0) / 0.42); q.lz = q.rel.z0 * (1 - u * u); if (u >= 1) { if (m.liftZ != null) { delete m.liftZ; if (q.cap && q.rel.z0 > 0.3) { m.hitSq = 1; H.glowAt(m.x, m.y, m.r * 1.4, 0.35, MINT, 0.6); } } } else m.liftZ = q.lz; }
          // the currents' strength and an amplified hit's flare
          const on = !q.out && (t < TE && !dead) && t >= FORM; q.a = cl(q.a + (on ? dt / 0.35 : -dt / 0.3));
          if (m.pandemHitT !== q.lh) { q.lh = m.pandemHitT; if (on && t - q.fl > 0.07) q.fl = t; } }
        // the rings turn (the outer slowly, the inner fast), faster as the storm compresses
        const sp = sm((t - 0.8) / 1.0) * (1 + 1.6 * cK) * (1 - 0.3 * hK);
        for (const q of RINGS) q.rot += q.w * dt * sp * (q.L === 'can' ? 1 + 0.8 * cK : 1);
        const tf0 = DBG.prof ? performance.now() : 0; flow(dt, t); if (DBG.prof) DBG.prof.flow = (DBG.prof.flow || 0) + performance.now() - tf0; if (DBG.prof) DBG.prof.update = (DBG.prof.update || 0) + performance.now() - t0p;
      },
      onEnd() { clearAll(); },
      drawUnder(c, f, X, Y, T) {
        const t = f.t, te = t - TE, A = sm(t / 0.3) * endK; if (A <= 0.01) return;
        { const q0 = P0(); if (!DBG.off['floor']) { floor(c, X, Y, T, t, te, A); } P1('floor', q0); };
        if (te < 0.4) { { const q0 = P0(); if (!DBG.off['rings']) { rings(c, X, Y, T, t, A, -1); } P1('rings', q0); }; { const q0 = P0(); if (!DBG.off['eye']) { eyeLayer(c, X, Y, T, t, A, -1); } P1('eye', q0); }; }
        { const q0 = P0(); if (!DBG.off['column']) { column(c, X, Y, T, t, A); trunk(c, X, Y, T, t, A); } P1('column', q0); } { const q0 = P0(); if (!DBG.off['ribbons']) { ribbons(c, X, Y, T, t, A, -1); } P1('ribbons', q0); };
        { const q0 = P0(); if (!DBG.off['bud']) { bud(c, X, Y, T, t, A, -1); } P1('bud', q0); }; { const q0 = P0(); if (!DBG.off['parts']) { parts(c, X, Y, T, t, A, -1); } P1('parts', q0); }; { const q0 = P0(); if (!DBG.off['helix']) { helix(c, X, Y, T, t, A, -1); } P1('helix', q0); };
        if (te >= 0) { const q0 = P0(); if (!DBG.off['blast']) { blast(c, X, Y, T, te, A, -1); } P1('blast', q0); };
      },
      draw(c, f, X, Y, T) {
        const t = f.t, te = t - TE, A = sm(t / 0.3) * endK; if (A <= 0.01) return;
        const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46, rx = R * T * 1.3, near = Math.abs(PX - X) < rx + T && PY > Y - ZC * T - T && PY < Y + rx * GY + T * 1.2;
        if (near) { c.save(); c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(PX, PY, T * 0.62, T * 0.74, 0, 0, TAU); c.clip('evenodd'); }
        if (te < 0.4) { { const q0 = P0(); if (!DBG.off['rings']) { rings(c, X, Y, T, t, A, 1); } P1('rings', q0); }; { const q0 = P0(); if (!DBG.off['eye']) { eyeLayer(c, X, Y, T, t, A, 1); } P1('eye', q0); }; }
        { const q0 = P0(); if (!DBG.off['ribbons']) { ribbons(c, X, Y, T, t, A, 1); } P1('ribbons', q0); }; { const q0 = P0(); if (!DBG.off['pre']) { prestorm(c, X, Y, T, t, A); } P1('pre', q0); }; { const q0 = P0(); if (!DBG.off['bud']) { bud(c, X, Y, T, t, A, 1); } P1('bud', q0); }; { const q0 = P0(); if (!DBG.off['parts']) { parts(c, X, Y, T, t, A, 1); } P1('parts', q0); }; { const q0 = P0(); if (!DBG.off['helix']) { helix(c, X, Y, T, t, A, 1); } P1('helix', q0); };
        if (te >= 0) { const q0 = P0(); if (!DBG.off['blast']) { blast(c, X, Y, T, te, A, 1); } P1('blast', q0); };
        if (near) c.restore();
        { const q0 = P0(); if (!DBG.off['currents']) { currents(c, T, t, A); } P1('currents', q0); };
      } });

    /* ---------- the petal flow ---------- */
    function flow(dt, t) {
      const mv = sm((t - 0.45) / 0.5), te = t - TE, fr = 1 - 0.85 * hK, col = t > FORM - 0.5;
      if (fin) for (const q of glit) { const dr = Math.exp(-2.6 * dt); q.vx *= dr; q.vy *= dr; q.vz = q.vz * dr - 0.8 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z = Math.max(0.05, q.z + q.vz * dt); }
      if (fin) for (const q of crest) q.rot += q.vr * dt * (1 - sm(te / 2));
      for (const p of pts) { p.rot += p.vr * dt * (p.m === 5 ? 0.4 : 1);
        if (p.m === 7) { const dr = Math.exp(-2.4 * dt); p.vx *= dr; p.vy *= dr; p.vz = p.vz * dr - (te > 0.5 ? 1.1 : 0.3) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z < 0.03) { p.z = 0.03; p.vz = 0; p.vx *= 0.9; p.vy *= 0.9; } p.e += dt; continue; }
        if (p.al < 1) p.al = Math.min(1, p.al + dt / 0.4);
        const r = p.r, z = p.z;
        if (p.m === 0) { p.th += 0.12 * dt; p.r += Math.sin(t * 1.3 + p.ph) * 0.06 * dt; if (t > 0.45 + R1(p.ph) * 0.3) p.m = 1; continue; }
        if (cK > 0.02 && (p.m === 3 || p.m === 4 || p.m === 5)) p.m = 6;
        if (p.m === 1) { const vin = R * 0.3 * (0.6 + 0.4 * r / R) * (1 + 2.2 * cK) * fr; p.r = Math.max(col ? 0 : R * 0.22, r - vin * dt * mv * p.s); p.th += omega(r, 0) * dt * mv * (0.35 + 0.3 * r / R) * fr; p.z += ((0.06 + 0.4 * Math.pow(1 - r / R, 2)) - z) * Math.min(1, dt * 2);
          if (p.r < R * 0.42 && col) p.m = 2; continue; }
        if (p.m === 2) { p.z += p.vz * dt * (1 + 0.8 * cK); p.r += (funR(p.z) + p.off * (p.z < ZE ? 0.5 : 0.3) - r) * Math.min(1, dt * 4); p.th += omega(p.r, p.z) * dt * (1 + cK);
          if (p.z > ZE + 0.55 * sK) p.m = cK > 0.02 ? 6 : 3; continue; }
        if (p.m === 3) { p.z += 0.5 * p.vz * dt; p.r += (funR(p.z) + p.off * 1.4 - r) * Math.min(1, dt * 3); p.th += omega(p.r, p.z) * dt;
          if (p.z > ZCc - 0.2 + p.zo * 0.4) { if (p.rec) { p.m = 4; p.s0 = 0; p.z0 = p.z; } else { p.m = 5; p.e = 0; } } continue; }
        if (p.m === 4) { p.s0 += dt / 2.4; const u = sm(p.s0); p.r = RCc * (1 + 0.28 * Math.sin(Math.PI * Math.min(1, p.s0))) * (1 - 0.1 * u); p.z = lerp(p.z0, 0.12, u); p.th += 0.8 * dt;
          if (p.s0 >= 1) { p.m = 1; p.r = R * (0.95 + 0.1 * Math.random()); } continue; }
        if (p.m === 5) { p.e += dt; p.r += 0.35 * dt; p.z = Math.max(0.05, p.z - 0.32 * dt); p.th += 0.22 * dt; if (p.e > 2.4) { if (t < TE - CMP) respawn(p, false); else p.gone = true; } continue; }
        if (p.m === 6) { const k = Math.min(1, dt * 2.4); p.r += (E * (0.55 + 0.3 * R1(p.ph)) - r) * k; p.z += (ZE + p.off * 0.8 - z) * k; p.th += (2.6 + 3 * cK) * dt; continue; }
      }
    }
    /* the burst: every petal flies out from the eye in three dimensions, then loses speed and settles */
    function burst() {
      for (const p of pts) { if (p.gone) continue; let wx, wy, wz; if (p.m === 7) continue; wx = Math.cos(p.th) * p.r; wy = Math.sin(p.th) * p.r; wz = p.z;
        let dx = wx, dy = wy, dz = wz - ZE, d = Math.hypot(dx, dy, dz); if (d < 0.1) { const a = Math.random() * TAU, b = (Math.random() - 0.3) * 1.2; dx = Math.cos(a) * Math.cos(b); dy = Math.sin(a) * Math.cos(b); dz = Math.sin(b); d = 1; }
        const v = (4.5 + 5 * Math.random()) * sK * (CEL ? 1.25 : ADE ? 1.12 : 1); p.m = 7; p.x = wx; p.y = wy; p.vx = dx / d * v; p.vy = dy / d * v; p.vz = dz / d * v * 0.7 + 1.2; p.e = 0; }
    }
    /* the crest and the glitter are made with the cast and wait for the burst (nothing allocated on the burst's frame) */
    { const nc = H.n(CEL ? 110 : ADE ? 90 : 70), ck = ['petal', 'blossom', 'cloud', 'leaf', 'petal', 'glit', 'cloud', 'pale', 'blossom', 'glit'];
      for (let i = 0; i < nc; i++) crest.push({ a: i / nc * TAU + Math.random() * 0.08, rr: 0.86 + 0.2 * Math.random(), k: ck[i % ck.length], v: i % QN, s: 0.7 + 0.6 * Math.random(), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 9, zh: 0.25 + 0.75 * Math.random(), ph: Math.random() * TAU, tf: 2 + Math.random() * 3 });
      for (let i = 0; i < H.n(CEL ? 60 : 40); i++) { const a = Math.random() * TAU, b = (Math.random() - 0.2) * 1.4, v = (3 + 6 * Math.random()) * sK; glit.push({ x: 0, y: 0, z: ZE, vx: Math.cos(a) * Math.cos(b) * v, vy: Math.sin(a) * Math.cos(b) * v, vz: Math.sin(b) * v, s: 0.5 + Math.random() * 0.7 }); } }

    /* ---------- drawing ---------- */
    const ATL = { petal: null, blossom: null, leaf: null, pale: null };   // (this frame's petal atlases, looked up once)
    const atlasBlit = (c, at, i, x, y, sz, fy) => c.drawImage(at, i * PS, 0, PS, PS, x - sz / 2, y - sz * fy / 2, sz, sz * fy);
    const cometAt = (c, cm, ang, x, y, L) => { const ci = ((Math.round(ang / TAU * CN) % CN) + CN) % CN; c.drawImage(cm, ci * CS, 0, CS, CS, x - L / 2, y - L / 2, L, L); };
    function floorSpin(c, s, X, Y, r, ang, a) { if (r < 2 || a <= 0.01) return; c.save(); c.translate(X, Y); c.scale(1, GY); c.rotate(ang); c.globalAlpha = Math.min(1, a); c.drawImage(s, -r, -r, r * 2, r * 2); c.restore(); }
    const ellBlit = (c, s, x, y, r, a, k) => { if (!s || a <= 0.01 || r < 1) return; c.globalAlpha = Math.min(1, a); c.drawImage(s, x - r, y - r * (k || GY), r * 2, r * 2 * (k || GY)); };
    /* the floor: the footprint (drawn by racing strands, then brightening from the rim inward), the intake swirls, a
       light pool under the eye, the shockwave and the aftermath's fade from the rim inward. Light only. */
    function floor(c, X, Y, T, t, te, A) {
      const rx = R * T, aft = te > 0 ? 1 - sm((te - 0.3) / 2.4) : 1, shr = te > 0 ? 1 - 0.75 * sm((te - 0.3) / 2.2) : 1;
      c.globalCompositeOperation = 'lighter';
      ellBlit(c, want('rim'), X, Y, rx * 1.04 * shr * (1 + 0.012 * Math.sin(t * 3)), 0.45 * A * sm(t / 0.9) * aft);
      // the pattern brightening from the rim inward
      if (t > 0.45 && t < FORM + 0.5) { const u = (t - 0.45) / (FORM + 0.05 - 0.45); ellBlit(c, want('ripple'), X, Y, rx * lerp(1.02, 0.18, eout(u)), Math.sin(Math.PI * cl(u)) * 0.85 * A); }
      const sa = sm((t - 0.7) / 0.8) * A * aft * (1 - 0.4 * hK), sk = (1 - 0.38 * cK) * shr;
      c.globalCompositeOperation = 'source-over'; let s = want('intake'); if (s) floorSpin(c, s, X, Y, rx * 1.02 * sk, t * (0.5 + 0.9 * cK) * sm(t / 1.4) + 0.3, 0.95 * sa);
      c.globalCompositeOperation = 'lighter'; s = want('inner'); if (s) floorSpin(c, s, X, Y, rx * 0.75 * sk, t * (1.5 + 2 * cK) * sm(t / 1.4), 0.5 * sa);
      s = want('pool'); if (s) { const pr = rx * (0.3 + 0.08 * pK) * (1 + 0.06 * Math.sin(t * 5)); ellBlit(c, s, X, Y, pr, (0.5 + 0.3 * cK + 0.4 * pK) * A * sm((t - 1.0) / 0.5) * aft); }
      if (te >= 0) { // the pressure column's strike and the ground shockwave
        ellBlit(c, want('pool'), X, Y, rx * (0.5 + 0.6 * eout(te / 0.3)), (1 - sm(te / 0.7)) * 1.4 * A, GY);
        const u = te / 0.95, rr = RSW * T * eout3(u); s = want('ripple'); if (s && u < 1.3) { ellBlit(c, s, X, Y, rr, (1 - sm((u - 0.5) / 0.8)) * 0.75 * A); ellBlit(c, s, X, Y, rr * 0.82, (1 - sm((u - 0.3) / 0.6)) * 0.45 * A); }
        if (CEL && s && u < 1.6) ellBlit(c, s, X, Y, RSW * T * 1.12 * eout3((te - 0.12) / 1.1), (1 - sm((u - 0.6) / 0.9)) * 0.6 * A); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    /* the rings: side -1 their back halves (under the monsters), +1 the front halves (over them) */
    function rings(c, X, Y, T, t, A, side) {
      const op = opening(t), te = t - TE, br = te > 0 ? eout(te / 0.3) : 0, fad = te > 0 ? 1 - sm(te / 0.28) : 1;
      for (const q of RINGS) { const gq = sm((op * 1.55 - q.d) / 0.55); if (gq <= 0.01) continue; const s = want(q.v); if (!s) continue;
        let r, z;
        if (q.L === 'can') { const u = q.u; const fo = CEL ? sm((cK - (1 - u) * 0.3) / 0.7) : cK; z = lerp(canZ(u) + (q.dz || 0) * sK, ZE + (0.35 + 0.5 * u) * sK, ein(fo)); r = lerp(canR0(u) * (q.rk || 1), E * (1.15 + 0.5 * u) * (q.rk || 1), eout(fo)) * (1 + 0.05 * Math.sin(t * 0.9 + u * 0.8)); }
        else if (q.L === 'eye') { z = q.z; r = q.r * (1 - 0.14 * pK * (ADE ? 1.3 : 1)) * (1 - 0.12 * cK); }
        else { z = q.z; r = funR0(q.z) * (1 - 0.06 * Math.sin(t * 0.9)) * (1 - 0.3 * cK); }
        // the opening: from a narrow column, the rings swell out and up into place (the canopy last, like petals)
        r *= lerp(0.12, 1, eout3(gq)) * (1 + 2.2 * br); z = lerp(z * 0.55, z, eout(gq)) + br * 0.8;
        let a = q.a * gq * A * fad * (1 + 0.6 * pK * (q.L !== 'can' ? 1 : 0.3)); if (q.v === 'streak' || q.v === 'arcs') a *= 0.7; if (side > 0) a *= q.L === 'eye' ? 0.35 : q.L === 'can' ? (z < ZE + 1.5 * sK ? 0.4 : 0.8) : 0.75;
        if (a <= 0.01) continue; const rr = r * T, cy0 = Y - z * T, ry = rr * GY;
        c.save(); c.beginPath(); if (side < 0) c.rect(X - rr * 1.4, cy0 - ry * 1.5, rr * 2.8, ry * 1.5); else c.rect(X - rr * 1.4, cy0, rr * 2.8, ry * 1.5); c.clip();
        c.globalCompositeOperation = q.v === 'streak' || q.v === 'arcs' ? 'lighter' : 'source-over';
        c.translate(X, cy0); if (q.tilt) c.rotate(q.tilt * Math.sin(t * 0.7 + q.ph)); c.scale(1, GY); c.rotate(q.rot); c.globalAlpha = Math.min(1, a); const k = rr / RS; c.drawImage(s, -RC * k, -RC * k, RW * k, RW * k); c.restore(); }
      // the crown: the corolla turning over the canopy (back half here, front half over), folding in as the storm compresses
      const s = want('corolla'), gq = sm((op * 1.55 - 1.15) / 0.5); if (s && gq > 0.01) { const r = RCc * 1.02 * lerp(0.2, 1, eout3(gq)) * (1 + 2 * br), z = lerp(ZCc - 0.5, ZCc + 0.15, eout(gq)) + br, a = gq * A * fad * (side > 0 ? 0.9 : 1) * (1 - 0.5 * cK);
        if (a > 0.01) { const rr = r * T, cy0 = Y - z * T, ry = rr * GY; c.save(); c.beginPath(); if (side < 0) c.rect(X - rr * 1.4, cy0 - ry * 1.5, rr * 2.8, ry * 1.5); else c.rect(X - rr * 1.4, cy0, rr * 2.8, ry * 1.5); c.clip();
          c.translate(X, cy0); c.scale(1, GY * 0.9); c.rotate(t * 0.22 - (1 - gq) * 1.4); c.globalAlpha = Math.min(1, a); const k = rr / RS; c.drawImage(s, -RC * k, -RC * k, RW * k, RW * k); c.rotate(-t * 0.5 + 0.5); c.scale(0.62, 0.62); c.globalAlpha = Math.min(1, a * 0.8); c.drawImage(s, -RC * k, -RC * k, RW * k, RW * k); c.restore(); } }
    }
    /* the eye: a clear, faintly lit space; pressure rings tighten on every tick (Celestial: delicate rings at angles) */
    function eyeLayer(c, X, Y, T, t, A, side) {
      const op = sm((t - FORM + 0.2) / 0.8), te = t - TE, fad = te > 0 ? 1 - sm(te / 0.2) : 1, a0 = op * A * fad; if (a0 <= 0.01) return; const EY = Y - ZE * T;
      c.globalCompositeOperation = 'lighter';
      if (side < 0) { const gr = E * T * (1.8 + 0.3 * cK); c.globalAlpha = (0.22 + 0.25 * cK + 0.25 * pK) * a0; c.drawImage(glowSprite(MINT), X - gr, EY - gr * 0.8, gr * 2, gr * 1.6);
        if (cK > 0) { const cr = E * T * (1.2 - 0.3 * cK); c.globalAlpha = 0.5 * cK * a0 * (0.8 + 0.2 * Math.sin(t * 20)); c.drawImage(glowSprite(PALE), X - cr, EY - cr, cr * 2, cr * 2); } }
      const s = want('ripple'); if (!s) { c.globalCompositeOperation = 'source-over'; return; }
      const NRg = CEL ? 4 : ADE ? 2 : 1;
      for (let i = 0; i < NRg; i++) { const tilt = i === 0 ? 0 : (i % 2 ? 1 : -1) * (0.35 + 0.2 * i) + 0.15 * Math.sin(t * (0.6 + 0.2 * i)), sq = i === 0 ? GY : 0.32 + 0.1 * i, rr = E * T * (1.05 + 0.12 * i) * (1 - 0.18 * pK) * (1 - 0.2 * cK), a = (0.35 + 0.5 * pK) * a0 * (side > 0 ? 0.55 : 1);
        c.save(); c.translate(X, EY); c.rotate(tilt); c.beginPath(); if (side < 0) c.rect(-rr * 1.2, -rr, rr * 2.4, rr); else c.rect(-rr * 1.2, 0, rr * 2.4, rr); c.clip(); c.scale(1, sq); c.rotate(t * (1.5 + i * 0.7) * (i % 2 ? -1 : 1)); c.globalAlpha = Math.min(1, a); c.drawImage(s, -rr, -rr, rr * 2, rr * 2); c.restore(); }
      // Adept: a second, outer pulse ring snapping inward with each tick
      if (ADE && pK > 0.02) { const rr = E * T * (1.7 - 0.5 * (1 - pK)); c.globalAlpha = pK * 0.6 * a0 * (side > 0 ? 0.6 : 1); c.save(); c.translate(X, EY); c.beginPath(); if (side < 0) c.rect(-rr * 1.2, -rr, rr * 2.4, rr); else c.rect(-rr * 1.2, 0, rr * 2.4, rr); c.clip(); c.scale(1, GY); c.drawImage(s, -rr, -rr, rr * 2, rr * 2); c.restore(); }
      // the build-up: bright emerald lines climbing the funnel into the core
      if (side > 0 && cK > 0.05) { const cm = want('comet'); if (cm) { const n = CEL ? 8 : 6; for (let i = 0; i < n; i++) { const u = ((t * 1.4 + i / n) % 1), z = u * ZE, b = i / n * TAU + u * 5 + t * 2, rr = funR0(z) * (1 - 0.3 * cK) * T, x = X + Math.cos(b) * rr, y = Y + Math.sin(b) * rr * GY - z * T, fr = Math.sin(b) > -0.2 ? 1 : 0.4;
        c.globalAlpha = Math.sin(Math.PI * u) * cK * a0 * 0.95 * fr; cometAt(c, cm, Math.atan2(-ZE * T, -Math.sin(b) * rr * 5), x, y, T * 0.9); } } }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    /* the opening column: a narrow twisting updraft rising from the centre, swallowed by the funnel as it opens */
    function column(c, X, Y, T, t, A) {
      const s = want('column'); if (!s) return; const u = sm((t - 0.9) / 0.6), a = u * (1 - sm((t - FORM - 0.4) / 0.9)) * A; if (a <= 0.01) return;
      const hgt = T * ZC * eout(u) * (1 + 0.1 * Math.sin(t * 9)), w = T * (0.35 + 0.5 * sm((t - FORM) / 0.8)) * (1 + 0.08 * Math.sin(t * 13));
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.95 * a; c.drawImage(s, X - w, Y - hgt, w * 2, hgt + T * 0.1); c.globalAlpha = 0.7 * a; c.drawImage(s, X - w * 0.4, Y - hgt * 1.05, w * 0.8, hgt * 1.05);
      const cm = want('comet'); if (cm) for (let i = 0; i < 6; i++) { const v = (t * 1.6 + i / 6) % 1, b = i * 1.1 + v * 9, x = X + Math.sin(b) * w * 0.7, y = Y - hgt * v; c.globalAlpha = Math.sin(Math.PI * v) * a * (0.5 + 0.4 * Math.cos(b)); cometAt(c, cm, -Math.PI / 2 + Math.cos(b) * 0.6, x, y, T * 0.8); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    /* the lower funnel's body: a lit, twisting trunk of air from the intake up to the eye (slices of the cached column,
       each as wide as the funnel at its height) with streaks climbing round it */
    function trunk(c, X, Y, T, t, A) {
      const s = want('column'); if (!s) return; const a = sm((t - FORM + 0.3) / 0.8) * (1 - sm((t - TE) / 0.25)) * A; if (a <= 0.01) return;
      c.globalCompositeOperation = 'lighter'; const NS = 10, top = ZE + 0.5 * sK;
      for (let i = 0; i < NS; i++) { const z0 = i / NS * top, z1 = (i + 1) / NS * top, zm = (z0 + z1) / 2, w = funR0(zm) * (1 - 0.3 * cK) * (1 + 0.06 * Math.sin(t * 5 - zm * 2)) * T * 0.95, sy0 = (1 - (i + 1) / NS) * 256, sh = 256 / NS;
        c.globalAlpha = a * (0.22 + 0.15 * cK + 0.18 * pK) * (zm > ZE - 0.3 ? 1 - sm((zm - ZE + 0.3) / 0.8) * 0.6 : 1); c.drawImage(s, 0, sy0, 64, sh, X - w, Y - z1 * T, w * 2, (z1 - z0) * T + 1); }
      const cm = want('comet'); if (cm) { const n = CEL ? 14 : ADE ? 11 : 9; for (let i = 0; i < n; i++) { const u = (t * 0.9 + i / n) % 1, z = u * top, b = i / n * TAU + u * 7 + t * 3, rr = funR0(z) * (1 - 0.3 * cK) * T * 0.92, x = X + Math.cos(b) * rr, y = Y + Math.sin(b) * rr * GY - z * T;
        c.globalAlpha = Math.sin(Math.PI * u) * a * (0.35 + 0.45 * (Math.sin(b) > 0 ? 1 : 0.4)); cometAt(c, cm, Math.atan2(-top * T * 0.25, -Math.sin(b) * rr), x, y, T * 0.75); } }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    /* a feathered ribbon from screen points (x, y) with a width envelope: three nested untextured fills */
    /* a ribbon from screen points in reused buffers (RBX, RBY; n of them) and half widths (RBW), its baked blade
       profile's layers as untextured fills, the rim turned away from (ox, oy) point by point. No allocation. */
    const RBX = new Float32Array(24), RBY = new Float32Array(24), RBW = new Float32Array(24), RNX = new Float32Array(24), RNY = new Float32Array(24);
    function ribbonFill(c, n, passes, ox, oy) {
      for (let i = 0; i < n; i++) { const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1), dx = RBX[b] - RBX[a], dy = RBY[b] - RBY[a], d = Math.hypot(dx, dy) || 1; let ax = -dy / d, ay = dx / d; if ((RBX[i] - ox) * ax + (RBY[i] - oy) * ay * 2 < 0) { ax = -ax; ay = -ay; } RNX[i] = ax; RNY[i] = ay; }
      for (let q = 0; q < passes.length; q++) { const ps = passes[q], k = ps[2], off = ps[3] || 0; c.fillStyle = ps[0]; c.globalAlpha = ps[1]; c.beginPath();
        for (let i = 0; i < n; i++) { const w = RBW[i], e = w * k + off * w; i ? c.lineTo(RBX[i] + RNX[i] * e, RBY[i] + RNY[i] * e) : c.moveTo(RBX[i] + RNX[i] * e, RBY[i] + RNY[i] * e); }
        for (let i = n - 1; i >= 0; i--) { const w = RBW[i], e = w * k - off * w; c.lineTo(RBX[i] - RNX[i] * e, RBY[i] - RNY[i] * e); }
        c.closePath(); c.fill(); } c.globalAlpha = 1; }
    const RIBP = ribPasses(bladeProfile(0.2, 0.5, 5));
    /* the broad ribbons: before the storm they coil round the pet and unfurl to the centre; in the storm, long outer
       ribbons curl round the mass and are drawn back into the intake */
    function ribbons(c, X, Y, T, t, A, side) {
      const PX = H.sx(me.x), PY = H.sy(me.y), NRB = ADE ? 3 : 2, NK = 18;
      if (t < FORM + 0.8) for (let i = 0; i < NRB; i++) { const hd = 2.1 * eout((t - 0.12 - 0.12 * i) / 1.25), tl = hd - 0.85, a0 = i / NRB * TAU + 0.4, al = A * sm(t / 0.3) * (1 - sm((t - FORM - 0.1) / 0.6)); if (hd <= 0.02 || al <= 0.01) continue;
        const t0 = Math.max(0, tl), mid = t0 + (hd - t0) * 0.5, front = mid < 1 ? Math.sin(a0 + mid * TAU * 1.1) > 0 : true; if ((side > 0) !== front) continue;
        const ex = PX + Math.cos(a0 + TAU * 1.1) * 0.75 * T, ey = PY + Math.sin(a0 + TAU * 1.1) * 0.75 * T * GY - 0.85 * T;
        for (let k = 0; k <= NK; k++) { const s = t0 + (hd - t0) * k / NK, v = k / NK; let x, y;
          if (s < 1) { const b = a0 + s * TAU * 1.1; x = PX + Math.cos(b) * 0.75 * T; y = PY + Math.sin(b) * 0.75 * T * GY - (0.25 + 0.6 * s) * T; }
          else { const u = Math.min(1, s - 1), su = sm(u), bx = X - ex, by = (Y - 0.4 * T) - ey, bl = Math.hypot(bx, by) || 1, sg = (i % 2 ? 1 : -1) * Math.sin(Math.PI * u); x = ex + bx * su - by / bl * sg * 1.4 * T; y = ey + by * su + bx / bl * sg * 1.4 * T - Math.sin(Math.PI * u) * 0.9 * T; }
          RBX[k] = x; RBY[k] = y; RBW[k] = T * 0.2 * Math.pow(Math.sin(Math.PI * v), 0.7) * (0.5 + 0.5 * v) * al; }
        ribbonFill(c, NK + 1, RIBP, X, Y - ZE * T * 0.4); }
      // the outer ribbons of the living storm
      const on = sm((t - FORM - 0.6) / 0.8) * (1 - sm((t - (TE - CMP + 0.3)) / 0.6)) * A; if (on <= 0.01) return;
      const NO = CEL ? 4 : ADE ? 3 : 2;
      for (let i = 0; i < NO; i++) { const u0 = ((t - FORM) / 3.4 + i / NO) % 1, th0 = i / NO * TAU + t * 0.35, al = on * Math.sin(Math.PI * u0); if (al <= 0.01) continue;
        if ((Math.sin(th0 + cl(u0 * 1.5 - 0.5 + 0.275) * 2.6) > 0) !== (side > 0)) continue;
        for (let k = 0; k <= NK; k++) { const v = k / NK, s = cl(u0 * 1.5 - 0.5 + v * 0.55), sr = Math.sin(Math.PI * s), r = RCc * (1.0 + 0.3 * sr) * (1 - 0.15 * s), z = lerp(ZCc * 0.92, 0.25, sm(s)) + 0.5 * sr, th = th0 + s * 2.6;
          RBX[k] = X + Math.cos(th) * r * T; RBY[k] = Y + Math.sin(th) * r * T * GY - z * T; RBW[k] = T * 0.32 * Math.pow(Math.sin(Math.PI * v), 0.75) * al; }
        ribbonFill(c, NK + 1, RIBP, X, Y - ZE * T); }
    }
    /* the atmosphere's light marks: strands racing round the footprint, light blades bending inward as a wave passes */
    function prestorm(c, X, Y, T, t, A) {
      if (t > FORM + 0.6) return; const cm = want('comet'); if (!cm) return; const rx = R * T, al = A * (1 - sm((t - FORM) / 0.6));
      c.globalCompositeOperation = 'lighter';
      if (t < 1.1) { const NH = ADE ? 4 : 3; for (let i = 0; i < NH; i++) { const hb = i / NH * TAU + eout(t / 1.0) * TAU * 0.85, fa = Math.sin(Math.PI * cl(t / 1.1)) * al;
        for (let j = 0; j < 10; j++) { const b = hb - j * 0.07, x = X + Math.cos(b) * rx, y = Y + Math.sin(b) * rx * GY, ang = Math.atan2(Math.cos(b) * GY, -Math.sin(b)); c.globalAlpha = fa * (1 - j / 10) * 0.95; cometAt(c, cm, ang, x, y, T * (0.9 - j * 0.05)); } } }
      const wf = R * (1.15 - 1.3 * sm((t - 0.35) / 1.0));
      for (const b of blades) { const bend = sm((b.r - wf) / (0.45 * R) + 0.5) * 0.85, up = -Math.PI / 2, inw = Math.atan2(-Math.sin(b.th) * GY, -Math.cos(b.th)); let d = inw - up; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
        const ang = up + d * bend + Math.sin(t * 6 + b.ph) * 0.08, L = T * 0.38 * b.s, x = X + Math.cos(b.th) * b.r * T, y = Y + Math.sin(b.th) * b.r * T * GY;
        c.globalAlpha = al * sm(t / 0.4) * (0.25 + 0.35 * bend); cometAt(c, cm, ang, x + Math.cos(ang) * L * 0.3, y + Math.sin(ang) * L * 0.3, L); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    /* the bud (the build-up) and the storm blossom (the burst): great wind petals round the eye, projected in 3D */
    function bud(c, X, Y, T, t, A, side) {
      const s = want('wpetal'); if (!s) return; const te = t - TE; if (cK <= 0.01 && te < 0) return; if (te > 1.6) return;
      const EY = Y - ZE * T, spinA = t * (0.6 + 1.6 * cK);
      for (let i = 0; i < BP.length; i++) { const b = BP[i];
        const gi = te >= 0 ? 1 : sm((cK - (CEL ? i * 0.035 : i * 0.015) - (b.inner ? 0.2 : 0)) / 0.45); if (gi <= 0.01) continue;
        const eo = te > 0 ? eout3(te / 0.55) : 0, phi = b.phi + spinA + (te > 0 ? 0 : 0), th = lerp(b.inner ? 1.35 : 1.18, b.thf, eo), L = lerp(LB * (b.inner ? 0.7 : 1) * lerp(0.4, 1, gi), b.lf, eout(te / 0.75)) * (te > 0 ? 1 : 1 + 0.04 * Math.sin(t * 11 + i)), rb = lerp(E * (b.inner ? 0.5 : 0.85), b.lf * 0.28, eo);
        const sn = Math.sin(phi); if ((sn >= 0) !== (side > 0)) continue;
        const bx = X + Math.cos(phi) * rb * T, by = EY + sn * rb * T * GY + E * 0.75 * T * (1 - eo), dx = Math.cos(th) * Math.cos(phi), dy = Math.cos(th) * sn * GY - Math.sin(th), pl = Math.hypot(dx, dy) * L * T; if (pl < 2) continue;
        let a = gi * A * (te > 0 ? 1 - sm((te - 0.3) / 0.75) : 1) * (side > 0 ? (te > 0 ? 0.85 : 0.55) : 0.9); if (a <= 0.01) continue;
        const ang = Math.atan2(dy, dx), mx = bx + Math.cos(ang) * pl * 0.5 - X, my = by + Math.sin(ang) * pl * 0.5 - EY, dd = (mx * Math.sin(ang) - my * Math.cos(ang)) / (Math.hypot(mx, my) || 1);
        if (!b.fs || Math.abs(dd) > 0.12) b.fs = dd >= 0 ? 1 : -1;   // (the sprite's rim is its -y side: scaled by fs it maps to the side away from the eye)
        c.save(); c.translate(bx, by); c.rotate(ang); c.scale(pl / WPL, b.fs * (0.45 + 0.75 * Math.abs(sn)) * L * T / WPL * 1.25); c.globalAlpha = Math.min(1, a); c.drawImage(s, -WPB, -WPY); c.restore();
        // a pearly glint racing along the opening petal
        if (te > 0 && te < 0.6) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - te / 0.6) * 0.8 * A; const u = eout(te / 0.5), gx = bx + dx / Math.hypot(dx, dy) * pl * u, gy = by + dy / Math.hypot(dx, dy) * pl * u, gr = T * 0.5; c.drawImage(glowSprite(PALE), gx - gr, gy - gr, gr * 2, gr * 2); c.globalCompositeOperation = 'source-over'; } }
      c.globalAlpha = 1;
    }
    /* the petals: side -1 those behind the axis, +1 the rest; near the eye they stretch into short luminous trails, the
       front ones fade where they would cover the captives */
    function parts(c, X, Y, T, t, A, side) {
      const cm = want('comet'); if (!cm) return; const te = t - TE, EY = Y - ZE * T, er = E * T * 1.25, aft = te > 0 ? 1 - sm((te - 1.4) / (AFT - 1.6)) : 1;
      // the screen places, worked out once a frame (the back pass) and kept relative to the storm (the camera's shake
      // makes no trails); then two batched passes a side: the additive trails and motes, then the flowers
      let bx0 = -1e9, bx1 = 1e9, by0 = -1e9, by1 = 1e9; if (side < 0) { const m = c.getTransform(), ka = m.a || 1, kd = m.d || 1; bx0 = -m.e / ka - X - T; bx1 = bx0 + c.canvas.width / ka + 2 * T; by0 = -m.f / kd - Y - T; by1 = by0 + c.canvas.height / kd + 2 * T; }   // (the view, relative to the storm: petals outside it are skipped)
      if (side < 0) for (const p of pts) { p.vis = false; if (p.gone || p.al <= 0) continue; let x, y, front;
        if (p.m === 7) { x = p.x * T; y = p.y * T * GY - p.z * T; front = p.y >= 0; }
        else { const sn = Math.sin(p.th); x = Math.cos(p.th) * p.r * T; y = sn * p.r * T * GY - p.z * T; front = sn >= 0; }
        let a = A * p.al * aft * (p.m === 5 ? 1 - sm((p.e - 1.4) / 1.0) : 1); if (p.m === 0) a *= 0.7 * sm(t / 0.4);
        if (front && p.m !== 7) { const ex = x / er, ey = (y + ZE * T) / (er * 0.85), d2 = ex * ex + ey * ey; if (d2 < 1) a *= 0.3 + 0.7 * d2; }
        p.tl = 0; if (p.px != null && p.k !== 'cloud' && (p.m === 2 || p.m >= 6)) {   // (trails only where petals run fast: the climb, the rush to the core, the burst)
           const vx = x - p.px, vy = y - p.py, sp = Math.hypot(vx, vy); if (sp > T * 0.12 && sp < T * 2.5) { p.tl = Math.min(T * 1.1, sp * 2.2); p.ta = Math.atan2(vy, vx); p.tk = Math.min(0.75, sp / T * 1.5); } }
        p.px = x; p.py = y; p.sx = x; p.sy = y; p.fr = front; p.a = a; p.vis = a > 0.02 && x > bx0 && x < bx1 && y > by0 && y < by1; if (p.tl && a * p.tk < 0.04) p.tl = 0; }
      c.globalCompositeOperation = 'lighter'; const gs = glowSprite(PALE);
      for (const p of pts) { if (!p.vis || p.fr !== (side > 0)) continue; const x = X + p.sx, y = Y + p.sy;
        if (p.tl && !DBG.noTrail) { c.globalAlpha = p.a * p.tk; cometAt(c, cm, p.ta, x - Math.cos(p.ta) * p.tl * 0.35, y - Math.sin(p.ta) * p.tl * 0.35, p.tl); }
        if (p.k === 'dust') { const r = T * 0.07 * p.s; c.globalAlpha = p.a * 0.8; c.drawImage(gs, x - r, y - r, r * 2, r * 2); } }
      c.globalCompositeOperation = 'source-over'; const cla = want('cloud'); ATL.petal = want('petal'); ATL.blossom = want('blossom'); ATL.leaf = want('leaf'); ATL.pale = want('pale');
      for (const p of pts) { if (!p.vis || p.fr !== (side > 0) || p.k === 'dust') continue; const x = X + p.sx, y = Y + p.sy;
        if (p.k === 'cloud') { if (!cla) continue; const sz = T * 1.2 * p.s; c.globalAlpha = Math.min(1, p.a * 0.95); c.drawImage(cla, p.v * QS, 0, QS, QS, x - sz / 2, y - sz * 0.4, sz, sz * 0.8); continue; }
        if (DBG.noSpr) continue; const at = ATL[p.k]; if (!at) continue; const ri = ((Math.floor(p.rot / TAU * PN) % PN) + PN) % PN, sz = T * (p.k === 'blossom' ? 0.44 : p.k === 'leaf' ? 0.32 : 0.28) * p.s;
        c.globalAlpha = Math.min(1, p.a); atlasBlit(c, at, ri, x, y, sz, 0.3 + 0.7 * Math.abs(Math.cos(t * p.tf + p.ph))); }
      // the crest of the shockwave: flowers, leaves, petal clouds and glitter riding the ring, then settling
      if (te >= 0 && fin) { const u = te / 0.95, Rr = RSW * eout3(u) + (te > 0.95 ? (te - 0.95) * 0.25 : 0), fa = A * (1 - sm((te - 1.3) / 1.7));
        for (const q of crest) { const sn = Math.sin(q.a); if ((sn >= 0) !== (side > 0)) continue; const rr = Rr * q.rr, z = q.zh * 0.7 * Math.sin(Math.PI * cl(u * 0.9)) * (1 - sm((te - 0.9) / 1.2)) + 0.04, x = X + Math.cos(q.a) * rr * T, y = Y + sn * rr * T * GY - z * T;
          if (fa <= 0.02) break;
          if (q.k === 'glit') { const r = T * 0.12 * q.s * (0.7 + 0.3 * Math.sin(t * 20 + q.ph)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fa; c.drawImage(glowSprite(MINT), x - r, y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; continue; }
          if (q.k === 'cloud') { const at = want('cloud'); if (!at) continue; const sz = T * 0.9 * q.s; c.globalAlpha = fa; c.drawImage(at, q.v * QS, 0, QS, QS, x - sz / 2, y - sz * 0.4, sz, sz * 0.8); continue; }
          const at = want(q.k); if (!at) continue; const ri = ((Math.floor(q.rot / TAU * PN) % PN) + PN) % PN; c.globalAlpha = fa; atlasBlit(c, at, ri, x, y, T * 0.34 * q.s, 0.3 + 0.7 * Math.abs(Math.cos(t * q.tf + q.ph))); } }
      if (side > 0 && te >= 0 && fin) { c.globalCompositeOperation = 'lighter';
        for (const q of glit) { const x = X + q.x * T, y = Y + q.y * T * GY - q.z * T, r = T * 0.1 * q.s * (0.6 + 0.4 * Math.sin(t * 25 + q.s * 9)); c.globalAlpha = A * (1 - sm((te - 0.8) / 1.6)); if (c.globalAlpha <= 0.02) break; c.drawImage(glowSprite(PALE), x - r, y - r, r * 2, r * 2); } }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    /* Celestial: blossoms circling in immense ascending spirals (the storm's height and depth) */
    function helix(c, X, Y, T, t, A, side) {
      if (!CEL) return; const at = want('blossom'); if (!at) return; const on = sm((t - FORM - 0.8) / 1.0) * (1 - sm((t - (TE - CMP)) / 0.8)) * A; if (on <= 0.01) return;
      const N = H.n(24); for (let sI = 0; sI < 2; sI++) for (let i = 0; i < N; i++) { const u = (i / N + t * 0.07 + sI * 0.5) % 1, z = u * ZC * 1.02, r = (R * 0.92 - (R * 0.92 - E * 1.3) * Math.sin(Math.PI * Math.min(1, u * 1.1)) * 0.6) * (1 + 0.04 * Math.sin(t + i)), th = sI * Math.PI + u * TAU * 2.2 + t * 0.55, sn = Math.sin(th);
        if ((sn >= 0) !== (side > 0)) continue; const x = X + Math.cos(th) * r * T, y = Y + sn * r * T * GY - z * T, dep = 0.75 + 0.25 * sn, sz = T * 0.42 * dep; c.globalAlpha = on * Math.sin(Math.PI * u) * dep; atlasBlit(c, at, (i * 5 + Math.floor(t * 6)) % PN, x, y, sz, 0.55 + 0.4 * Math.abs(Math.cos(t * 2 + i))); }
      c.globalAlpha = 1;
    }
    /* the burst's other layers: the flash in the eye, the pressure column striking the floor, strands between the
       layers that snap and curl away, rising wind and unravelling strands in the aftermath */
    function blast(c, X, Y, T, te, A, side) {
      const EY = Y - ZE * T, cm = want('comet');
      c.globalCompositeOperation = 'lighter';
      if (side < 0) { // the pressure column (behind the flash) and the aftermath's rising rings of wind
        const col = want('column'); if (col && te < 0.6) { const hu = eout(te / 0.09), w = E * T * (1.5 - 0.9 * sm(te / 0.6)), top = EY - E * T * 0.4; c.globalAlpha = (1 - sm((te - 0.08) / 0.5)) * A; c.drawImage(col, X - w, top, w * 2, (Y + T * 0.25 - top) * hu); c.globalAlpha *= 0.8; c.drawImage(col, X - w * 0.35, top, w * 0.7, (Y + T * 0.25 - top) * hu); }
        const s = want('arcs'); if (s) for (let i = 0; i < (ADE ? 3 : 2); i++) { const u = (te - 0.35 - i * 0.3) / 2.2; if (u <= 0 || u >= 1) continue; const rr = (E * 1.4 + u * R * 1.1) * T, z = ZE + u * 2.4 * sK; c.save(); c.translate(X, Y - z * T); c.scale(1, GY); c.rotate(te * (1.2 - i * 0.3)); c.globalAlpha = Math.sin(Math.PI * u) * 0.55 * A; const k = rr / RS; c.drawImage(s, -RC * k, -RC * k, RW * k, RW * k); c.restore(); }
      } else {
        // the flash inside the eye
        if (te < 0.4) { const u = te / 0.4, fr = E * T * (1.0 + 2.6 * eout(u)); c.globalAlpha = (1 - sm(u)) * A; c.drawImage(glowSprite(PALE), X - fr, EY - fr, fr * 2, fr * 2); c.globalAlpha = (1 - sm(u / 0.5)) * A; const fr2 = E * T * (0.8 + 1.4 * eout(u)); c.drawImage(glowSprite(WHITE), X - fr2, EY - fr2, fr2 * 2, fr2 * 2); }
        const fl = want('flare'); if (fl && te < 0.35) { const u = te / 0.35, s2 = E * T * (1.8 + 3.0 * eout(u)); c.globalAlpha = (1 - sm(u)) * A; c.drawImage(fl, X - s2, EY - s2 * 0.6, s2 * 2, s2 * 1.2); }
        // strands from the eye to the shockwave's front: stretched, then snapping in the middle and curling away
        if (cm && te < 1.3) { const u = te / 0.95, Rr = RSW * eout3(u) * T;
          for (let i = 0; i < NSTR; i++) { const a = i / NSTR * TAU + 0.3, ex2 = X + Math.cos(a) * Rr, ey2 = Y + Math.sin(a) * Rr * GY, mx = (X + ex2) / 2 + Math.cos(a) * Rr * 0.15, my = (EY + ey2) / 2 - T * (1.2 + 0.6 * R1(i)), gap = 0.5 * sm((te - 0.35) / 0.5), al = A * sm(te / 0.06) * (1 - sm((te - 0.7) / 0.6)) * (Math.sin(a) >= 0 ? 0.9 : 0.6), curl = sm((te - 0.35) / 0.6) * T * 0.9 * (i % 2 ? 1 : -1);
            if (al <= 0.02) continue; for (let k = 0; k <= 9; k++) { const s = k / 9; if (Math.abs(s - 0.5) < gap) continue; const o = 1 - s, x0 = o * o * X + 2 * o * s * mx + s * s * ex2, y0 = o * o * EY + 2 * o * s * my + s * s * ey2, tx = 2 * o * (mx - X) + 2 * s * (ex2 - mx), ty = 2 * o * (my - EY) + 2 * s * (ey2 - my), tl = Math.hypot(tx, ty) || 1, cw = curl * Math.pow(Math.max(0, 1 - Math.abs(s - 0.5) / Math.max(0.01, gap + 0.25)), 1) * (s < 0.5 ? -1 : 1);
              const x = x0 - ty / tl * cw, y = y0 + tx / tl * cw; c.globalAlpha = al * (0.4 + 0.6 * Math.sin(Math.PI * s)); cometAt(c, cm, Math.atan2(ty, tx) + (gap > 0 ? (s < 0.5 ? -1 : 1) * gap * 1.5 : 0), x, y, T * 0.85); } } }
        // the last strands unravelling over the impact centre
        if (cm && te > 0.7 && te < 3.0) { const n = CEL ? 6 : 4; for (let i = 0; i < n; i++) { const u = (te - 0.7) / 2.3; for (let j = 0; j < 8; j++) { const z = ZE * 0.5 + u * 2.4 * sK + j * 0.13, th = i / n * TAU + j * 0.45 + te * 1.8, r = 0.35 + 0.9 * u + j * 0.03, x = X + Math.cos(th) * r * T, y = Y + Math.sin(th) * r * T * GY - z * T;
          c.globalAlpha = A * Math.sin(Math.PI * cl(u)) * 0.6 * (1 - j / 9); cometAt(c, cm, th + Math.PI / 2, x, y, T * 0.6); } } }
      }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    /* the thin emerald currents round every affected monster, tightening with a sharp mint flare on an amplified hit */
    function currents(c, T, t, A) {
      const cs = want('current'), fl = want('flare'); if (!cs) return; c.globalCompositeOperation = 'lighter';
      for (const q of rec.values()) { const m = q.m; if (m.dead || q.a <= 0.01) continue; const fk = Math.exp(-Math.max(0, t - q.fl) / 0.13), x = H.sx(m.x), y = H.sy(m.y) - ((m.z || 0) + (m.liftZ || 0)) * T - m.r * T * 0.45, s = m.r * T * (m.boss ? 1.3 : 1.7) * (1 - 0.3 * fk);
        c.save(); c.translate(x, y); c.scale(1, 0.5); c.rotate(t * 3.2 + q.ph); c.globalAlpha = Math.min(1, q.a * A * (0.38 + 0.62 * fk)); c.drawImage(cs, -s, -s, s * 2, s * 2); c.rotate(2.1); c.scale(0.8, 0.8); c.globalAlpha *= 0.6; c.drawImage(cs, -s, -s, s * 2, s * 2); c.restore();
        if (fl && fk > 0.03) { const fs = m.r * T * (1.1 + 1.4 * (1 - fk)) * (m.boss ? 1.5 : 1); c.globalAlpha = Math.min(1, fk * 1.2 * A); c.drawImage(fl, x - fs, y - fs * 0.7, fs * 2, fs * 1.4); } }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
  };
  U.pandemonium.warm = warm;
  U.pandemonium.__dbg = { BK, bakeStep, DBG, BAKE };
})();
