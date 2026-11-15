/* ---------- The lightning kit: shared rendering for the reworked Lightning moves ----------
   The user's direction: white-hot lightning cores, saturated electric-blue and violet layers, selective golden
   highlights, flowing trails, and clearly animated structures inside the glow; every Ultimate has a buildup, a powerful
   release and a beautiful fading. Moves call TK.bind(H) at cast time. Screen-space drawing (px); particles in world units.
   Evolution: C.evo is the pet's stage (1 Hatchling .. 4 Adept .. 7 Celestial): TK.evoN(C, a, b) runs a count from a at
   stage 1 to b at stage 7; TK.lv(C, [n1, n4, n7]) picks the user's level-1 / level-4 / level-7 numbers (stages 2-3 take
   level 1's, 5-6 level 4's unless a move interpolates); TK.evoK(C) is the extra damage of an evolved cast. */
const TK = (() => {
  const TAU = Math.PI * 2;
  const P = { white: '#FFFFFF', core: '#F4FBFF', cyan: '#5FE4FF', blue: '#3FA8FF', ice: '#BFF2FF', violet: '#8A5CFF', deep: '#4A2BC8', night: '#1E1250', gold: '#FFD266', amber: '#FFB238' };
  let H;
  const rgba = (h, a) => H.rgba(h, a);
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  /* a seed that changes `hz` times a second (k separates the arcs of one effect) */
  const seed = (t, k, hz) => Math.floor(t * (hz || 20)) + (k || 0) * 101;
  /* (v346) the GPU mode: between gpuBegin and gpuEnd every glow, light, bolt, arc, ribbon, orb, ring and scar this kit draws goes
     to the GPU painter (20k6h's NIDHOGG_MOVES.FGFX) as layered plasma (a white-hot core, a cyan body, a violet bloom), in one
     pass flushed at gpuEnd over whatever the move drew itself; window[flag] = 0, window.__THUNDER_GL = 0, a software
     rasteriser or no WebGL keep the 2D */
  let GQ = null, GF = null, BM = null, GC = null;
  function gpuBegin(c, flag, pet) { if (GQ) return null; try { if (window[flag] === 0 || window.__THUNDER_GL === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; if (!F || !F.usable()) return null; GF = F; GQ = F.begin(c, null); BM = c.getTransform(); GC = c; /* (v349: no mask round the pet) */ return GQ; } catch (e) { GQ = null; return null; } }
  /* (v359) a point in the context's current frame -> the frame the batch began in (a move may draw under its own transform):
     its position and the extra scale; every GPU path of the kit maps its points through it */
  function gpuXY(x, y) { const m = GC ? GC.getTransform() : null; if (!m || !BM || (m.a === BM.a && m.b === BM.b && m.c === BM.c && m.d === BM.d && m.e === BM.e && m.f === BM.f)) return [x, y, 1];
    const X = m.a * x + m.c * y + m.e, Y = m.b * x + m.d * y + m.f, det = BM.a * BM.d - BM.b * BM.c, dx = X - BM.e, dy = Y - BM.f;
    return [(BM.d * dx - BM.c * dy) / det, (-BM.b * dx + BM.a * dy) / det, Math.sqrt(Math.abs((m.a * m.d - m.b * m.c) / det)) || 1]; }
  const mapPts = pts => { const m = GC ? GC.getTransform() : null; if (!m || !BM || (m.a === BM.a && m.b === BM.b && m.c === BM.c && m.d === BM.d && m.e === BM.e && m.f === BM.f)) return pts; return pts.map(p => gpuXY(p[0], p[1])); };
  function gpuEnd(c) { if (!GQ) return; const F = GF; GQ = null; GF = null; GC = null; try { F.flush(c); } catch (e) {} }
  // a line of light through points: gaussian beams run past their ends by an eighth (no dashes at the joints)
  function gpuLine(pts, w, col, a) { for (let i = 1; i < pts.length; i++) { const p0 = pts[i - 1], p1 = pts[i], dx = p1[0] - p0[0], dy = p1[1] - p0[1]; GQ.beam(p0[0] - dx * 0.125, p0[1] - dy * 0.125, p1[0] + dx * 0.125, p1[1] + dy * 0.125, w, col, a); } }
  function glow(c, x, y, r, col, a) { if (GQ) { if (r >= 1 && a > 0.01) { const p = gpuXY(x, y); GQ.glow(p[0], p[1], r * 1.1 * p[2], col || P.cyan, Math.min(1, a * 1.4)); } return; } if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col || P.cyan), x - r, y - r, r * 2, r * 2); c.restore(); }
  function floorLight(c, X, Y, r, a, col) { if (GQ) { if (r >= 1 && a > 0.01) { const p = gpuXY(X, Y); GQ.glow(p[0], p[1], r * 1.1 * p[2], col || P.blue, Math.min(1, a * 1.4), H.GY); } return; } if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col || P.blue), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  /* a jittered polyline from (x0, y0) to (x1, y1), screen px; jit the sideways reach; s the seed */
  function path(x0, y0, x1, y1, s, jit, segs) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, n = segs || Math.max(3, Math.min(18, Math.ceil(L / 11))), pts = [[x0, y0]];
    for (let i = 1; i < n; i++) { const u = i / n, o = (R1(s * 7.13 + i * 3.37) - 0.5) * 2 * jit * Math.sqrt(Math.sin(u * Math.PI)); pts.push([x0 + dx * u + nx * o, y0 + dy * u + ny * o]); } pts.push([x1, y1]); return pts; }
  function line(c, pts, w) { c.lineWidth = Math.max(0.4, w); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
  /* one bolt along pts: a wide violet haze, a blue-cyan body, a white-hot core (additive); gold tints the body */
  function bolt(c, pts, w, a, gold) { if (!pts || pts.length < 2 || !(a > 0.01)) return;
    if (GQ) { pts = mapPts(pts); for (let i = 0; i < pts.length; i += 3) GQ.glow(pts[i][0], pts[i][1], w * 5, gold ? P.gold : P.blue, 0.4 * a);
      if (w >= 1.2) for (let i = 1; i < pts.length; i++) { const p0 = pts[i - 1], p1 = pts[i], dx = p1[0] - p0[0], dy = p1[1] - p0[1]; GQ.ebeam(p0[0] - dx * 0.25, p0[1] - dy * 0.25, p1[0] + dx * 0.25, p1[1] + dy * 0.25, w * 2.1, gold ? '#FFB84A' : '#5C8CFF', 0.82, 0.42 * a, i * 1.7 + w, 14); }   // (v359: a turbulent sheath of plasma round the channel)
      gpuLine(pts, w * 2.6, P.violet, 0.35 * a); gpuLine(pts, w * 1.3, gold ? P.gold : P.blue, 0.7 * a); gpuLine(pts, w * 0.7, gold ? P.amber : P.cyan, a); gpuLine(pts, Math.max(0.7, w * 0.32), P.white, 1); gpuLine(pts, Math.max(0.4, w * 0.14), P.white, 1); return; } c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    c.globalAlpha = 0.35 * a; for (let i = 0; i < pts.length; i += 3) blitSized(c, glowSprite(gold ? P.gold : P.blue), pts[i][0] - w * 5, pts[i][1] - w * 5, w * 10, w * 10);   // (bloom along the bolt)
    c.globalAlpha = 0.28 * a; c.strokeStyle = P.violet; line(c, pts, w * 3.2); c.globalAlpha = 0.55 * a; c.strokeStyle = gold ? P.gold : P.blue; line(c, pts, w * 1.7);
    c.globalAlpha = 0.9 * a; c.strokeStyle = gold ? P.amber : P.cyan; line(c, pts, w); c.globalAlpha = a; c.strokeStyle = P.white; line(c, pts, Math.max(0.6, w * 0.38)); c.restore(); }
  /* a lightning arc between two screen points with forks off it (re-grows with the seed) */
  function arc(c, x0, y0, x1, y1, s, w, a, o) { o = o || {}; const L = Math.hypot(x1 - x0, y1 - y0), pts = path(x0, y0, x1, y1, s, o.jit != null ? o.jit : Math.min(26, L * 0.14)); bolt(c, pts, w, a, o.gold);
    const forks = o.forks == null ? Math.min(4, Math.floor(L / 40)) : o.forks; for (let i = 0; i < forks; i++) { const k = 1 + Math.floor(R1(s + i * 5.1) * (pts.length - 2)), p = pts[k], b = Math.atan2(y1 - y0, x1 - x0) + (R1(s + i * 9.7) - 0.5) * 2.2, fl = L * (0.12 + 0.18 * R1(s + i * 3.3)); bolt(c, path(p[0], p[1], p[0] + Math.cos(b) * fl, p[1] + Math.sin(b) * fl, s + i * 31, fl * 0.25, 4), w * 0.5, a * 0.8, o.gold); }
    return pts; }
  /* a sky bolt down to a floor point, with a ground tendril rising to meet it */
  function skyBolt(c, X, Y, h, s, w, a, o) { const pts = arc(c, X + (R1(s) - 0.5) * h * 0.2, Y - h, X, Y, s, w, a, Object.assign({ forks: 4 }, o || {})); glow(c, X, Y, w * 6, P.cyan, 0.7 * a); floorLight(c, X, Y, w * 10, 0.6 * a); return pts; }
  /* a tapered plasma ribbon (trail): white at the head (last point), cyan through the centre, violet along the fringes */
  function ribbon(c, pts, w, a, gold) { if (!pts || pts.length < 2 || !(a > 0.01)) return;
    if (GQ) { pts = mapPts(pts); const n = pts.length; for (let i = 1; i < n; i++) { const u = i / (n - 1), ww = w * (0.15 + 0.85 * u), p0 = pts[i - 1], p1 = pts[i], dx = p1[0] - p0[0], dy = p1[1] - p0[1], s0 = [p0[0] - dx * 0.125, p0[1] - dy * 0.125], s1 = [p1[0] + dx * 0.125, p1[1] + dy * 0.125];
      GQ.beam(s0[0], s0[1], s1[0], s1[1], ww * 1.2, P.violet, a * (0.25 + 0.5 * u) * 0.5); GQ.ebeam(s0[0] - dx * 0.1, s0[1] - dy * 0.1, s1[0] + dx * 0.1, s1[1] + dy * 0.1, ww * 0.75, gold ? '#FFB84A' : '#4FA0FF', 0.85, a * (0.25 + 0.6 * u), i * 1.3, 12); GQ.beam(s0[0], s0[1], s1[0], s1[1], ww * 0.6, gold ? P.gold : P.cyan, a * (0.3 + 0.7 * u)); GQ.beam(s0[0], s0[1], s1[0], s1[1], ww * 0.22, P.white, a * u); } return; }   /* (v359: plasma streaming in the ribbon) */ c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; const n = pts.length;
    for (let i = 1; i < n; i++) { const u = i / (n - 1), ww = w * (0.15 + 0.85 * u); c.globalAlpha = a * (0.25 + 0.5 * u) * 0.5; c.strokeStyle = P.violet; c.lineWidth = ww * 2.2; c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke();
      c.globalAlpha = a * (0.3 + 0.7 * u); c.strokeStyle = gold ? P.gold : P.cyan; c.lineWidth = ww * 1.1; c.stroke(); c.globalAlpha = a * u; c.strokeStyle = P.white; c.lineWidth = ww * 0.4; c.stroke(); }
    c.restore(); }
  /* a shaded electric orb: a violet rim, cyan body, white heart, filaments turning round it */
  function orb(c, x, y, r, t, s, a, gold) { if (r < 1 || !(a > 0.01)) return; if (GQ) { const p = gpuXY(x, y), R = r * p[2]; GQ.glow(p[0], p[1], R * 3.2, gold ? P.gold : P.blue, 0.6 * a); GQ.quad(17, p[0], p[1], R * 1.35, 0, 0, R * 1.35, gold ? P.gold : P.cyan, 1, a, s || 0); return; } glow(c, x, y, r * 3, gold ? P.gold : P.blue, 0.55 * a); c.save(); c.globalAlpha = a; const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r); g.addColorStop(0, P.white); g.addColorStop(0.35, P.ice); g.addColorStop(0.7, gold ? P.gold : P.cyan); g.addColorStop(1, rgba(P.deep, 0.85));
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = g; c.fill(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(P.white, 0.7); c.lineWidth = Math.max(0.8, r * 0.08); for (let i = 0; i < 3; i++) { const b = t * (2.5 + i * 1.3) + i * 2.1 + (s || 0); c.save(); c.translate(x, y); c.rotate(b); c.scale(1, 0.35 + 0.2 * i); c.beginPath(); c.arc(0, 0, r * (1.15 + i * 0.12), 0, TAU); c.restore(); c.stroke(); } c.restore(); }
  /* a ground shock ring: a soft blue band and a thin white edge; crawling arcs along it when arcs > 0 */
  function shockRing(c, X, Y, r, a, t, arcs) { if (r < 1 || !(a > 0.01)) return;
    if (GQ) { { const p = gpuXY(X, Y); X = p[0]; Y = p[1]; r *= p[2]; } GQ.ewave(X, Y, r, '#5FA8FF', 0.85, 0.65 * a, r * 0.017, H.GY, 0.16); GQ.ring(X, Y, r * 0.92, P.violet, 0.4 * a, Math.max(2, r * 0.16), H.GY); GQ.ring(X, Y, r, P.cyan, 0.8 * a, Math.max(1.5, r * 0.045), H.GY); GQ.ring(X, Y, r, P.white, 0.6 * a, Math.max(1, r * 0.015), H.GY); GQ.shimmer(X, Y, r * 1.04, 0.3 * a, H.GY, P.cyan);   /* (v359: a rolling wave of electric energy under the ring) */
      for (let i = 0; i < (arcs || 0); i++) { const b0 = i / arcs * TAU + (t || 0) * 0.7, b1 = b0 + 0.5; arc(c, X + Math.cos(b0) * r, Y + Math.sin(b0) * r * H.GY, X + Math.cos(b1) * r, Y + Math.sin(b1) * r * H.GY, seed(t || 0, i), 1.6, a * 0.8, { forks: 0, jit: r * 0.08 }); } return; } c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.strokeStyle = rgba(P.violet, 0.45); c.lineWidth = Math.max(2, r * 0.16); H.floorEllipse(c, X, Y, r * 0.92); c.stroke(); c.strokeStyle = rgba(P.cyan, 0.8); c.lineWidth = Math.max(1.5, r * 0.04); H.floorEllipse(c, X, Y, r); c.stroke(); c.restore();
    for (let i = 0; i < (arcs || 0); i++) { const b0 = i / arcs * TAU + (t || 0) * 0.7, b1 = b0 + 0.5; arc(c, X + Math.cos(b0) * r, Y + Math.sin(b0) * r * H.GY, X + Math.cos(b1) * r, Y + Math.sin(b1) * r * H.GY, seed(t || 0, i), 1.6, a * 0.8, { forks: 0, jit: r * 0.08 }); } }
  /* ground arcs crawling out from (X, Y) over radius r */
  function groundArcs(c, X, Y, r, n, t, a, s) { for (let i = 0; i < n; i++) { const b = (s || 0) + i / n * TAU + R1(seed(t, i, 8)) * 0.6, rr = r * (0.6 + 0.4 * R1(i + (s || 0))); arc(c, X, Y, X + Math.cos(b) * rr, Y + Math.sin(b) * rr * H.GY, seed(t, i), 1.4, a, { forks: 1, jit: rr * 0.18 }); } }
  /* a faint violet impression left on the floor after a strike (fades; nothing dark) */
  function scar(c, pts, a) { if (!pts || !(a > 0.01)) return; if (GQ) { pts = mapPts(pts); gpuLine(pts, 2.2, P.violet, a * 0.55); gpuLine(pts, 0.8, P.ice, a * 0.45); return; } c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.5; c.strokeStyle = P.violet; c.lineCap = 'round'; line(c, pts, 3); c.globalAlpha = a * 0.35; c.strokeStyle = P.ice; line(c, pts, 1); c.restore(); }
  /* particles (world units) */
  const sparks = (x, y, k, v, o) => H.burst(x, y, 'spark', k, Object.assign({ v: v || 6, up: 1.5, g: 6, life: 0.45, size: 2, color: [P.white, P.cyan, P.ice, P.violet] }, o || {}));
  const motes = (x, y, k, o) => H.burst(x, y, 'ember', k, Object.assign({ v: 1.8, up: 1.5, g: -0.6, life: 0.8, size: 3, color: [P.cyan, P.violet, P.ice, P.blue] }, o || {}));
  const goldSparks = (x, y, k, v) => H.burst(x, y, 'spark', k, { v: v || 6, up: 1.5, g: 6, life: 0.5, size: 2.2, color: [P.gold, P.white, P.amber] });
  /* the charged air round a thing: call from update(dt) with a rate per second */
  function aura(x, y, r, dt, rate, z) { const k = (rate || 10) * dt * H.Q(); let m = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (m-- > 0) { const b = Math.random() * TAU, rr = Math.sqrt(Math.random()) * (r || 0.6); H.P({ kind: Math.random() < 0.6 ? 'ember' : 'spark', x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * 0.6 - (z || 0), vx: (Math.random() - 0.5) * 2, vy: -0.8 - Math.random() * 1.6, g: -0.3, drag: 0.8, life: 0.4 + Math.random() * 0.4, max: 0.8, size: 1.8 + Math.random() * 1.8, color: Math.random() < 0.4 ? P.white : Math.random() < 0.6 ? P.cyan : P.violet }); } }
  /* a strike's flare: light, sparks, motes */
  function zapAt(x, y, r) { H.X.light(x, y, r * 1.8, 0.25); sparks(x, y, 10, 6); motes(x, y, 6); H.glowAt(x, y, r * 0.8, 0.25, P.cyan, 0.7); }
  const evo = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const evoN = (C, a, b) => Math.round(a + (b - a) * (evo(C) - 1) / 6);
  const lv = (C, L) => { const e = evo(C); return e >= 7 ? L[2] : e >= 4 ? L[1] : L[0]; };
  const evoK = C => 1 + 0.08 * (evo(C) - 1);
  /* (v362) energy on the GPU for the remade moves (each returns false when the GPU mode is off, so the caller can draw 2D):
     plasmaPts: a line of plasma through screen points (a violet sheath, a turbulent blue-cyan body, a white thread);
     energyAura: an aura of electric energy round a body (licks of energy flickering out round it, a glow; no solid shape);
     echoBody: an echo of the pet made of energy (a turbulent heart, the aura, a faint column of light);
     flareStar: a contact flare (a star of light, a hot core, four rays of energy) */
  function plasmaPts(c, pts, w, a, o) { if (!GQ || !pts || pts.length < 2 || !(a > 0.01) || !(w > 0.2)) return false; o = o || {}; pts = mapPts(pts); const n = pts.length, gold = o.gold, tp = o.taper || 0, sd = o.seed || 0;
    for (let i = 1; i < n; i++) { const u = i / (n - 1), k = 1 - tp + tp * u, p0 = pts[i - 1], p1 = pts[i], dx = p1[0] - p0[0], dy = p1[1] - p0[1], x0 = p0[0] - dx * 0.3, y0 = p0[1] - dy * 0.3, x1 = p1[0] + dx * 0.3, y1 = p1[1] + dy * 0.3, aa = a * (o.fade ? 0.15 + 0.85 * u : 1);
      if (o.sheath !== 0) GQ.ebeam(x0, y0, x1, y1, w * 2.1 * k, gold ? '#C9842A' : '#6A4CFF', 0.5, 0.42 * aa * (o.sheath || 1), sd + i * 0.9, 10);
      GQ.ebeam(x0, y0, x1, y1, w * k, gold ? '#FFC24A' : (o.col || '#4FA8FF'), o.heat == null ? 0.88 : o.heat, 0.85 * aa, sd + i * 1.7 + 3, o.scroll || 16);
      if (o.core !== 0) GQ.beam(p0[0] - dx * 0.12, p0[1] - dy * 0.12, p1[0] + dx * 0.12, p1[1] + dy * 0.12, Math.max(0.6, w * 0.15 * k), '#FFFFFF', aa * (o.core || 0.85)); }
    return true; }
  function energyAura(c, X, Y, h, a, t, sd, o) { if (!GQ || !(a > 0.01) || !(h > 2)) return false; o = o || {}; const p = gpuXY(X, Y), hh = h * p[2], cx = p[0], cy = p[1] - hh * 0.48, rx = hh * 0.44, ry = hh * 0.52, fs = Math.floor(t * 15), gold = o.gold, n = o.n || 11, kk = o.k || 1;
    GQ.glow(cx, cy, hh * 1.1 * kk, gold ? P.gold : P.blue, 0.16 * a); GQ.ring(cx, cy, hh * 0.5 * kk, gold ? P.gold : P.cyan, 0.3 * a, hh * 0.12, 1.05);
    for (let i = 0; i < n; i++) { const b = i / n * TAU + (sd || 0) * 0.37 + t * 0.7 * (o.spin || 1), nx = Math.cos(b), ny = Math.sin(b), dx = nx * 0.85 + (o.dir ? o.dir[0] * 1.4 : 0), dy = ny * 0.45 - 0.85 + (o.dir ? o.dir[1] * 1.4 : 0), L = hh * (0.24 + 0.3 * R1(sd * 3.1 + i * 7.1 + fs)) * kk, col = i % 3 === 0 ? (gold ? P.amber : P.violet) : gold ? P.gold : (i % 3 === 1 ? P.cyan : P.blue);
      GQ.etongue(cx + nx * rx, cy + ny * ry, L * 0.34, L, Math.atan2(dx, -dy), col, 0.62 + 0.15 * R1(i + fs), a * (0.35 + 0.35 * R1(i * 1.9 + fs * 1.3)), (sd || 0) + i * 2.3 + fs * 0.11); }
    return true; }
  function echoBody(c, X, Y, h, a, t, sd, o) { if (!GQ || !(a > 0.01) || !(h > 2)) return false; o = o || {}; const p = gpuXY(X, Y), hh = h * p[2], cx = p[0], cy = p[1] - hh * 0.48, gold = o.gold, ch = o.charge || 0;
    GQ.ebeam(cx, p[1], cx, cy - hh * 0.75, hh * 0.22, gold ? '#C9842A' : '#4A6CFF', 0.45, 0.22 * a, (sd || 0) + 1, 6);
    GQ.eorb(cx, cy, hh * (0.32 + 0.08 * ch), gold ? '#FFB84A' : '#4F8CFF', 0.55 + 0.3 * ch, 0.75 * a, (sd || 0) + 3, 2.5);
    energyAura(c, X, Y, h, a * 0.9, t, sd, { n: 13, gold, k: 1 + 0.25 * ch });
    GQ.star(cx, cy, hh * (0.35 + 0.25 * ch), (0.35 + 0.4 * ch) * a, gold ? '#FFF1C8' : '#E8FBFF');
    return true; }
  function flareStar(c, X, Y, r, a, rot, gold) { if (!GQ || !(a > 0.01)) return false; const p = gpuXY(X, Y), R = r * p[2];
    GQ.glow(p[0], p[1], R * 2.2, gold ? P.gold : P.blue, 0.5 * a); GQ.eorb(p[0], p[1], R * 0.5, gold ? '#FFC24A' : '#5FB4FF', 0.98, a, rot * 3, 3); GQ.star(p[0], p[1], R * 1.9, a, '#FFFFFF');
    for (let i = 0; i < 4; i++) { const b = rot + i * Math.PI / 2, L = R * (i % 2 ? 1.0 : 1.7); GQ.ebeam(p[0], p[1], p[0] + Math.cos(b) * L, p[1] + Math.sin(b) * L, R * 0.13, gold ? '#FFC24A' : '#6FC8FF', 0.95, 0.85 * a, i + rot, 18); }
    return true; }
  const K = { P, TAU, R1, seed, gpuBegin, gpuEnd, gq: () => GQ, gpuXY, mapPts, plasmaPts, energyAura, echoBody, flareStar, glow, floorLight, path, line, bolt, arc, skyBolt, ribbon, orb, shockRing, groundArcs, scar, sparks, motes, goldSparks, aura, zapAt, evo, evoN, lv, evoK };
  return { bind: h => { H = h; return K; }, P };
})();
