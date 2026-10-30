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
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col || P.cyan), x - r, y - r, r * 2, r * 2); c.restore(); }
  function floorLight(c, X, Y, r, a, col) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col || P.blue), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  /* a jittered polyline from (x0, y0) to (x1, y1), screen px; jit the sideways reach; s the seed */
  function path(x0, y0, x1, y1, s, jit, segs) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, n = segs || Math.max(3, Math.min(18, Math.ceil(L / 11))), pts = [[x0, y0]];
    for (let i = 1; i < n; i++) { const u = i / n, o = (R1(s * 7.13 + i * 3.37) - 0.5) * 2 * jit * Math.sqrt(Math.sin(u * Math.PI)); pts.push([x0 + dx * u + nx * o, y0 + dy * u + ny * o]); } pts.push([x1, y1]); return pts; }
  function line(c, pts, w) { c.lineWidth = Math.max(0.4, w); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
  /* one bolt along pts: a wide violet haze, a blue-cyan body, a white-hot core (additive); gold tints the body */
  function bolt(c, pts, w, a, gold) { if (!pts || pts.length < 2 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
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
  function ribbon(c, pts, w, a, gold) { if (!pts || pts.length < 2 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; const n = pts.length;
    for (let i = 1; i < n; i++) { const u = i / (n - 1), ww = w * (0.15 + 0.85 * u); c.globalAlpha = a * (0.25 + 0.5 * u) * 0.5; c.strokeStyle = P.violet; c.lineWidth = ww * 2.2; c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke();
      c.globalAlpha = a * (0.3 + 0.7 * u); c.strokeStyle = gold ? P.gold : P.cyan; c.lineWidth = ww * 1.1; c.stroke(); c.globalAlpha = a * u; c.strokeStyle = P.white; c.lineWidth = ww * 0.4; c.stroke(); }
    c.restore(); }
  /* a shaded electric orb: a violet rim, cyan body, white heart, filaments turning round it */
  function orb(c, x, y, r, t, s, a, gold) { if (r < 1 || !(a > 0.01)) return; glow(c, x, y, r * 3, gold ? P.gold : P.blue, 0.55 * a); c.save(); c.globalAlpha = a; const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.05, x, y, r); g.addColorStop(0, P.white); g.addColorStop(0.35, P.ice); g.addColorStop(0.7, gold ? P.gold : P.cyan); g.addColorStop(1, rgba(P.deep, 0.85));
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = g; c.fill(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(P.white, 0.7); c.lineWidth = Math.max(0.8, r * 0.08); for (let i = 0; i < 3; i++) { const b = t * (2.5 + i * 1.3) + i * 2.1 + (s || 0); c.save(); c.translate(x, y); c.rotate(b); c.scale(1, 0.35 + 0.2 * i); c.beginPath(); c.arc(0, 0, r * (1.15 + i * 0.12), 0, TAU); c.restore(); c.stroke(); } c.restore(); }
  /* a ground shock ring: a soft blue band and a thin white edge; crawling arcs along it when arcs > 0 */
  function shockRing(c, X, Y, r, a, t, arcs) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.strokeStyle = rgba(P.violet, 0.45); c.lineWidth = Math.max(2, r * 0.16); H.floorEllipse(c, X, Y, r * 0.92); c.stroke(); c.strokeStyle = rgba(P.cyan, 0.8); c.lineWidth = Math.max(1.5, r * 0.04); H.floorEllipse(c, X, Y, r); c.stroke(); c.restore();
    for (let i = 0; i < (arcs || 0); i++) { const b0 = i / arcs * TAU + (t || 0) * 0.7, b1 = b0 + 0.5; arc(c, X + Math.cos(b0) * r, Y + Math.sin(b0) * r * H.GY, X + Math.cos(b1) * r, Y + Math.sin(b1) * r * H.GY, seed(t || 0, i), 1.6, a * 0.8, { forks: 0, jit: r * 0.08 }); } }
  /* ground arcs crawling out from (X, Y) over radius r */
  function groundArcs(c, X, Y, r, n, t, a, s) { for (let i = 0; i < n; i++) { const b = (s || 0) + i / n * TAU + R1(seed(t, i, 8)) * 0.6, rr = r * (0.6 + 0.4 * R1(i + (s || 0))); arc(c, X, Y, X + Math.cos(b) * rr, Y + Math.sin(b) * rr * H.GY, seed(t, i), 1.4, a, { forks: 1, jit: rr * 0.18 }); } }
  /* a faint violet impression left on the floor after a strike (fades; nothing dark) */
  function scar(c, pts, a) { if (!pts || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.5; c.strokeStyle = P.violet; c.lineCap = 'round'; line(c, pts, 3); c.globalAlpha = a * 0.35; c.strokeStyle = P.ice; line(c, pts, 1); c.restore(); }
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
  const K = { P, TAU, R1, seed, glow, floorLight, path, line, bolt, arc, skyBolt, ribbon, orb, shockRing, groundArcs, scar, sparks, motes, goldSparks, aura, zapAt, evo, evoN, lv, evoK };
  return { bind: h => { H = h; return K; }, P };
})();
