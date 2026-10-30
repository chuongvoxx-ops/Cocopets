/* ---------- Fire, reworked: Inferno Carousel, Crown of Falling Suns, River of Molten Stars, Nine-Tailed Conflagration,
   World of Paper Flames (the second half of the fire Ultimates) ----------
   The Spike Bloom standard for the showpieces: every flame a shaded FK volume, every solid thing (blades, the crown, the
   star cores, the paper) faceted with a lit face and a shaded face, a bright edge, an outline and a glow; burning things
   light the floor and shed embers; every strike leaves a scorch, a shock ring, sparks and char flakes. Whatever forms on
   or round the pet is cut away round the pet's body (petHole) so the pet always stays in sight. */
(() => {
  const U = ELEM_IMPL.fire.ult, TAU = Math.PI * 2, P = FK.P;
  let H, K;
  const cl = u => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  /* the screen-space shape the pet occupies: an ellipse round its body */
  function petBox(T) { const me = H.me; return [H.sx(me.x), H.sy(me.y) - T * 0.46, T * 0.6, T * 0.7]; }
  /* clip the rest of this draw to everything except the pet's body, so nothing of the move ever covers the pet */
  function petHole(c, T) { const [x, y, rx, ry] = petBox(T); c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.clip('evenodd'); }
  /* screen -> world for particles (height folded into y, as the particles are drawn) */
  const wx = (SX, T) => H.me.x + (SX - H.sx(H.me.x)) / T, wy = (SY, T) => H.me.y + (SY - H.sy(H.me.y)) / T;
  /* the four-tone ramp of a lit facet: brightness 0..1 -> colour */
  const ramp = (k, R) => (k > 0.78 ? R[0] : k > 0.5 ? R[1] : k > 0.25 ? R[2] : R[3]);
  const LA = Math.atan2(-0.8, -0.6);   // where the light comes from (upper left)
  const lit = ang => 0.5 + 0.5 * Math.cos(ang - LA);
  const RAMP_HOT = [P.wht, P.yel, P.org, P.red], RAMP_CRUST = [P.crustL, P.crust, P.dred, P.char];
  /* a faceted star (n points): each point two facets, lit or shaded by the way they face, an outline, a white heart */
  function facetStar(c, x, y, r, ri, n, rot, R, a, sq) {
    if (r < 1) return; sq = sq || 1; c.save(); c.globalAlpha = a == null ? 1 : a; c.lineJoin = 'round';
    K.glow(c, x, y, r * 2.2, P.org, 0.5 * (a == null ? 1 : a));
    for (let i = 0; i < n; i++) { const b = rot + i / n * TAU, bl = b - Math.PI / n, br = b + Math.PI / n, tip = [x + Math.cos(b) * r, y + Math.sin(b) * r * sq], L = [x + Math.cos(bl) * ri, y + Math.sin(bl) * ri * sq], Rr = [x + Math.cos(br) * ri, y + Math.sin(br) * ri * sq];
      c.fillStyle = ramp(lit(b - 0.45), R); c.beginPath(); c.moveTo(x, y); c.lineTo(L[0], L[1]); c.lineTo(tip[0], tip[1]); c.closePath(); c.fill();
      c.fillStyle = ramp(lit(b + 0.45) - 0.12, R); c.beginPath(); c.moveTo(x, y); c.lineTo(tip[0], tip[1]); c.lineTo(Rr[0], Rr[1]); c.closePath(); c.fill();
      c.strokeStyle = H.rgba(P.wht, 0.55 * lit(b)); c.lineWidth = Math.max(0.8, r * 0.05); c.beginPath(); c.moveTo(x, y); c.lineTo(tip[0], tip[1]); c.stroke(); }
    c.strokeStyle = H.line(); c.lineWidth = Math.max(1, r * 0.07); c.beginPath(); for (let i = 0; i < n * 2; i++) { const b = rot + i / (n * 2) * TAU, rr = i % 2 ? ri : r; i ? c.lineTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr * sq) : c.moveTo(x + Math.cos(b) * rr, y + Math.sin(b) * rr * sq); } c.closePath(); c.stroke();
    H.core(c, x, y, ri * 0.9, P.yel, '#FFFFFF', 0.9 * (a == null ? 1 : a)); c.restore();
  }
  /* a flame blade: a faceted crescent (a dark crust back, a molten body lit on the near face, a white-hot cutting edge), an outline,
     flames licking off its back, a glow. At (X, Y), r px long, turned by rot (the edge faces rot - PI/2) */
  function blade(c, X, Y, r, rot, t, a, seed) {
    if (r < 2) return; a = a == null ? 1 : a; c.save(); c.translate(X, Y); c.rotate(rot); c.globalAlpha = a; c.lineJoin = 'round';
    K.glow(c, 0, -r * 0.12, r * 0.85, P.org, 0.5 * a);
    const tip = [r * 0.62, -r * 0.1], tail = [-r * 0.5, r * 0.06], edgeC = [-r * 0.02, -r * 0.66], backC = [r * 0.02, -r * 0.16], spine = [0, -r * 0.38];
    // flames licking back off the spine (pointing away from the cut)
    for (let i = 0; i < (seed < 0 ? 1 : 2); i++) flameAtS(c, -r * 0.25 + i * r * 0.32, -r * 0.16, Math.PI * 0.5 + 0.5 - i * 0.3, r * 0.2, r * (0.42 + 0.1 * Math.sin(t * 9 + i + seed)), t, i * 2.1 + seed, 0.85 * a);
    // the shaded back facet (crust to deep red)
    c.beginPath(); c.moveTo(tail[0], tail[1]); c.quadraticCurveTo(spine[0], spine[1] + r * 0.06, tip[0], tip[1]); c.quadraticCurveTo(backC[0], backC[1], tail[0], tail[1]); c.closePath();
    let g = c.createLinearGradient(0, -r * 0.3, 0, r * 0.05); g.addColorStop(0, P.red); g.addColorStop(0.6, P.dred); g.addColorStop(1, P.char); c.fillStyle = g; c.fill();
    // the lit front facet (molten: amber to orange to red)
    c.beginPath(); c.moveTo(tail[0], tail[1]); c.quadraticCurveTo(edgeC[0], edgeC[1], tip[0], tip[1]); c.quadraticCurveTo(spine[0], spine[1] + r * 0.06, tail[0], tail[1]); c.closePath();
    g = c.createLinearGradient(-r * 0.3, -r * 0.45, r * 0.3, -r * 0.1); g.addColorStop(0, P.yel); g.addColorStop(0.4, P.amb); g.addColorStop(0.8, P.org); g.addColorStop(1, P.red); c.fillStyle = g; c.fill();
    // glowing seams across the body
    c.save(); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.6); c.lineWidth = Math.max(1, r * 0.03); for (let i = 0; i < 3; i++) { const u = -0.3 + i * 0.3; c.beginPath(); c.moveTo(r * u, -r * 0.42); c.lineTo(r * (u + 0.06), -r * 0.24); c.lineTo(r * (u - 0.02), -r * 0.1); c.stroke(); } c.restore();
    // outline, then the white-hot cutting edge and a rim light on the back
    c.strokeStyle = H.line(); c.lineWidth = Math.max(1, r * 0.04); c.beginPath(); c.moveTo(tail[0], tail[1]); c.quadraticCurveTo(edgeC[0], edgeC[1], tip[0], tip[1]); c.quadraticCurveTo(backC[0], backC[1], tail[0], tail[1]); c.closePath(); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = H.rgba(P.wht, 0.95); c.lineWidth = Math.max(1.2, r * 0.05); c.beginPath(); c.moveTo(tail[0] + r * 0.12, tail[1] - r * 0.16); c.quadraticCurveTo(edgeC[0], edgeC[1] + r * 0.03, tip[0] - r * 0.04, tip[1]); c.stroke();
    c.strokeStyle = H.rgba(P.amb, 0.5); c.lineWidth = Math.max(1, r * 0.03); c.beginPath(); c.moveTo(tail[0] + r * 0.1, tail[1] - r * 0.02); c.quadraticCurveTo(backC[0], backC[1] + r * 0.02, tip[0] - r * 0.1, tip[1] + r * 0.01); c.stroke();
    K.glow(c, tip[0], tip[1], r * 0.25, P.yel, 0.8 * a); c.restore();
  }
  /* a fox tail is slim at the root, plump through the middle and drawn out to a soft point */
  const tailW = u => (0.3 + 0.95 * Math.sin(Math.min(1, u) * Math.PI * 0.88)) * Math.pow(Math.max(0, 1 - u), 0.5);
  /* the silhouette of a fox tail of flame round a centre line: both edges a run of soft rounded tufts (curved lobes leaning
     toward the tip, each flickering on its own), closing to a point */
  function tailPath(c, pts, w, t, seed, k) {
    const n = pts.length - 1, L = [], R = [], N = [];
    for (let j = 0; j <= n; j++) { const p = pts[j], q = pts[Math.min(n, j + 1)], o = pts[Math.max(0, j - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, hw = w * 0.5 * tailW(j / n) * k; N.push([nx, ny, dx / d, dy / d, hw]); L.push([p[0] + nx * hw, p[1] + ny * hw]); R.push([p[0] - nx * hw, p[1] - ny * hw]); }
    const lobe = (A, j, sg) => { const [nx, ny, tx, ty, hw] = N[j], m = [(A[j][0] + A[j + 1][0]) / 2, (A[j][1] + A[j + 1][1]) / 2], f = 0.42 + 0.14 * Math.sin(t * (9 + (j % 3)) + j * 2.1 + seed + sg), seg = Math.hypot(A[j + 1][0] - A[j][0], A[j + 1][1] - A[j][1]); c.quadraticCurveTo(m[0] + sg * nx * (hw * f + seg * 0.3) + tx * seg * 0.35, m[1] + sg * ny * (hw * f + seg * 0.3) + ty * seg * 0.35, A[j + 1][0], A[j + 1][1]); };
    c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (let j = 0; j < n; j++) lobe(L, j, 1);
    const e = pts[n], [, , tx, ty] = N[n]; c.quadraticCurveTo(e[0] + tx * w * 0.35, e[1] + ty * w * 0.35, R[n][0], R[n][1]);
    for (let j = n - 1; j >= 0; j--) { const [nx, ny, tx2, ty2, hw] = N[j], m = [(R[j][0] + R[j + 1][0]) / 2, (R[j][1] + R[j + 1][1]) / 2], f = 0.42 + 0.14 * Math.sin(t * (10 + (j % 3)) + j * 1.7 + seed), seg = Math.hypot(R[j + 1][0] - R[j][0], R[j + 1][1] - R[j][1]); c.quadraticCurveTo(m[0] - nx * (hw * f + seg * 0.3) + tx2 * seg * 0.35, m[1] - ny * (hw * f + seg * 0.3) + ty2 * seg * 0.35, R[j][0], R[j][1]); }
    c.quadraticCurveTo(pts[0][0] - N[0][2] * w * 0.2, pts[0][1] - N[0][3] * w * 0.2, L[0][0], L[0][1]); c.closePath();
    return N;
  }
  /* a fox tail of flame along a screen polyline: a soft outer fur of glow, a tufted body shading from deep red at the root
     through orange to yellow, the flank facing the light brighter and the other darker, a dark-red rim, a white-hot core
     running out to a blazing white tip; no FK flames (cheap: nine of them cost no flame budget) */
  function tail(c, pts, w, t, a, seed) {
    if (pts.length < 2 || w < 0.5 || a <= 0.01) return; const n = pts.length - 1, e = pts[n], r0 = pts[0], mid = pts[n >> 1];
    c.save(); for (let i = 3; i < pts.length; i += 3) K.glow(c, pts[i][0], pts[i][1], w * 1.5, P.org, 0.26 * a);
    c.lineJoin = 'round';
    // the soft outer fur: a bigger, fainter tufted layer
    c.globalAlpha = a * 0.5; c.globalCompositeOperation = 'lighter'; tailPath(c, pts, w * 1.3, t * 0.8, seed + 5, 1); c.fillStyle = H.rgba(P.org, 0.55); c.fill(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a;
    // the body
    const N = tailPath(c, pts, w, t, seed, 1), g = c.createLinearGradient(r0[0], r0[1], e[0], e[1]); g.addColorStop(0, P.dred); g.addColorStop(0.18, P.red); g.addColorStop(0.45, P.org); g.addColorStop(0.75, P.amb); g.addColorStop(1, P.yel); c.fillStyle = g; c.fill();
    c.strokeStyle = H.rgba(P.dred, 0.75); c.lineWidth = Math.max(1, w * 0.05); c.stroke();
    // volume: shade across the tail at its middle, lit toward the upper left
    c.save(); c.clip(); const [nx, ny, , , hw] = N[n >> 1], s = lit(Math.atan2(ny, nx)) > 0.5 ? 1 : -1, g2 = c.createLinearGradient(mid[0] + nx * hw * s, mid[1] + ny * hw * s, mid[0] - nx * hw * s, mid[1] - ny * hw * s);
    g2.addColorStop(0, H.rgba(P.yel, 0.4)); g2.addColorStop(0.4, H.rgba(P.yel, 0)); g2.addColorStop(0.6, H.rgba(P.dred, 0)); g2.addColorStop(1, H.rgba(P.dred, 0.5)); c.fillStyle = g2; c.fillRect(Math.min(r0[0], e[0]) - w * 3, Math.min(r0[1], e[1]) - w * 3, Math.abs(e[0] - r0[0]) + w * 6, Math.abs(e[1] - r0[1]) + w * 6);
    // flickers climbing toward the tip inside the fur
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.35); c.lineWidth = Math.max(1, w * 0.07); c.lineCap = 'round'; for (let i = 0; i < 2; i++) { const ph = (t * 1.4 + i * 0.5 + seed * 0.11) % 1, j = Math.min(n - 1, Math.floor(ph * n)), p = pts[j], q = pts[j + 1]; c.beginPath(); c.moveTo(p[0] + N[j][0] * N[j][4] * 0.4 * (i ? 1 : -1), p[1] + N[j][1] * N[j][4] * 0.4 * (i ? 1 : -1)); c.lineTo(q[0], q[1]); c.stroke(); }
    c.restore();
    // the white-hot core, brightening out to the tip
    c.globalCompositeOperation = 'lighter'; tailPath(c, pts.slice(Math.round(n * 0.15)), w * 0.42, t, seed + 3, 1); const g3 = c.createLinearGradient(pts[Math.round(n * 0.15)][0], pts[Math.round(n * 0.15)][1], e[0], e[1]); g3.addColorStop(0, H.rgba(P.amb, 0.15)); g3.addColorStop(0.5, H.rgba(P.yel, 0.6)); g3.addColorStop(1, H.rgba(P.wht, 1)); c.fillStyle = g3; c.fill();
    K.glow(c, e[0], e[1], w * 0.9, P.yel, 0.7 * a); K.glow(c, e[0], e[1], w * 0.4, '#FFFFFF', 0.8 * a); c.restore();
  }
  /* a burning ground channel along screen points: a charred groove, a glowing seam (heat 0..1), light on the floor */
  function channel(c, pts, w, heat, a, t) {
    if (pts.length < 2 || a <= 0.01) return; c.save(); c.globalAlpha = a; c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = H.rgba(P.char, 0.6); c.lineWidth = w * 1.4; H.poly(c, pts, false); c.stroke(); c.strokeStyle = H.rgba(P.crust, 0.8); c.lineWidth = w * 0.8; c.stroke();
    if (heat > 0.02) { c.globalCompositeOperation = 'lighter'; for (let i = 1; i < pts.length; i += 3) K.floorLight(c, pts[i][0], pts[i][1], w * 2.2, 0.35 * heat); c.strokeStyle = H.rgba(P.org, 0.8 * heat); c.lineWidth = w * 0.45; c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.85 * heat); c.lineWidth = Math.max(1, w * 0.16); c.setLineDash([w * 1.2, w * 0.6]); c.lineDashOffset = -t * w * 4; c.stroke(); c.setLineDash([]); }
    c.restore();
  }
  /* heat shimmer (rising wavy lines) */
  function shimmer(c, X, Y, r, h, t, a) { if (a <= 0.01) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 * a; c.strokeStyle = P.wht; c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { const ox = (i - 1) * r * 0.5, ph = t * 5 + i * 2; c.beginPath(); for (let j = 0; j <= 6; j++) { const u = j / 6, px = X + ox + Math.sin(ph + u * 7) * r * 0.12, py = Y - u * h - ((t * 0.6 + i * 0.3) % 1) * h * 0.2; j ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); } c.restore(); }
  /* --- flame budget: these draw single FK flames (never the three-tongue crown), so a busy Celestial cast stays near ~40 --- */
  function flameAtS(c, x, y, ang, w, h, t, seed, a) { c.save(); c.translate(x, y); c.rotate(ang + Math.PI / 2); K.flame(c, 0, 0, w, h, t, seed, Math.sin(t * 8 + (seed || 0)) * w * 0.18, a, true); c.restore(); }
  /* a ring of single flames on a floor ellipse, the back ones first */
  function ringS(c, X, Y, r, n, h, t, a, spin) { const L = []; for (let i = 0; i < n; i++) { const b = i / n * TAU + spin; L.push([Math.sin(b), b, i]); } L.sort((p, q) => p[0] - q[0]); for (const [, b, i] of L) K.flame(c, X + Math.cos(b) * r, Y + Math.sin(b) * r * H.GY, h * 0.5, h * (0.75 + 0.25 * Math.sin(b)) * (0.85 + 0.15 * Math.sin(t * 7 + i * 1.9)), t, i * 1.3, Math.cos(b) * h * 0.15, a, true); }
  /* a ball of fire without the tongue crown: a shaded sphere of flame (lit upper left), turbulent bright arcs, a white heart, glow */
  function ball(c, x, y, r, t, seed, a) {
    if (r < 1 || a <= 0.01) return; c.save(); c.globalAlpha = a; K.glow(c, x, y, r * 3, P.org, 0.6 * a); K.glow(c, x, y, r * 1.6, P.yel, 0.35 * a);
    const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y, r); g.addColorStop(0, P.wht); g.addColorStop(0.3, P.yel); g.addColorStop(0.62, P.org); g.addColorStop(0.88, P.red); g.addColorStop(1, H.rgba(P.dred, 0.9)); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = g; c.fill();
    c.save(); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.5); c.lineWidth = Math.max(1, r * 0.12); c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const b = t * (3 + i) + i * 2.1 + seed; c.beginPath(); c.arc(x + Math.cos(b) * r * 0.2, y + Math.sin(b) * r * 0.2, r * (0.45 + i * 0.16), b, b + 1.4); c.stroke(); } c.restore();
    c.strokeStyle = H.rgba(P.dred, 0.6); c.lineWidth = Math.max(0.8, r * 0.07); c.beginPath(); c.arc(x, y, r, 0.2, 1.9); c.stroke(); H.core(c, x - r * 0.12, y - r * 0.15, r * 0.5, P.yel, '#FFFFFF', 0.9 * a); c.restore();
  }
  /* a streak of fire along screen points: layered bands, glow, and a few single flames licking off it */
  function streak(c, pts, w, t, a, taper, seed, nf) {
    if (pts.length < 2 || w < 0.5 || a <= 0.01) return; c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; for (let i = 0; i < pts.length; i += 3) K.glow(c, pts[i][0], pts[i][1], w * 1.8, P.org, 0.35 * a);
    c.globalAlpha = a; H.ribbon(c, pts, w * 1.15, H.rgba(P.dred, 0.8), null, taper); H.ribbon(c, pts, w * 0.92, P.red, null, taper); H.ribbon(c, pts, w * 0.68, P.org, null, taper); c.globalCompositeOperation = 'lighter'; H.ribbon(c, pts, w * 0.4, H.rgba(P.yel, 0.9), null, taper); H.ribbon(c, pts, w * 0.14, P.wht, null, taper); c.globalCompositeOperation = 'source-over';
    const m = nf == null ? 3 : nf; for (let k = 1; k <= m; k++) { const i = Math.round(k / (m + 1) * (pts.length - 1)), u = i / (pts.length - 1), kk = taper ? taper(u) : 1; K.flame(c, pts[i][0], pts[i][1] + w * 0.2 * kk, w * 0.8 * kk, w * (1.4 + 0.6 * Math.sin(t * 9 + i * 1.7 + seed)) * kk, t, i * 1.3 + seed, Math.sin(t * 5 + i) * w * 0.2, 0.85 * a, true); }
    c.restore();
  }
  /* a quadratic bezier sampled into n+1 points */
  const bez = (p0, p1, p2, n) => { const o = []; for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; o.push([v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0], v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1]]); } return o; };
  const fireAt = (C, x, y, r, life, k) => H.fire(x, y, r, life, C.base * (k || 0.6), 'fire');
  /* a strike's impact on the floor: blast, shock ring, sparks, flakes, smoke */
  function impact(x, y, r, k) { K.blast(x, y, r, k); H.X.ring(x, y, 0.2, r * 1.1, 0.4, P.yel, 0.5); K.sparks(x, y, 10 * k, 7); K.flakes(x, y, Math.round(4 * k)); }

  // F-U06 Inferno Carousel: faceted flame blades orbit a twisting column of fire at the aim, in tiers; the lowest tier dips and
  // slashes the glowing rune ring beneath, then the column compresses white-hot and flings the blades out tier by tier, ending
  // in a low fire wave. Evolution: 2 tiers of 3 blades at Hatchling to 3 tiers of 5 at Celestial, a wider ring, and at
  // Celestial a second, wider fire wave.
  U.infernocarousel = (C, h) => {
    H = h; K = FK.bind(H); const x = C.tx, y = C.ty, ev = K.evo(C), DK = C.base * C.K * K.evoK(C), R = (2.3 + 0.1 * (ev - 1)) * C.K, RW = R + 2.0, TIERS = ev >= 4 ? 3 : 2, NB = K.evoN(C, 3, 5), ticks = [0.9, 1.25, 1.6, 1.95, 2.3], flings = [3.0, 3.25, 3.5].slice(0, TIERS), WAVE = 3.85, WAVE2 = ev >= 7 ? WAVE + 0.4 : 0, near = Math.hypot(H.me.x - x, H.me.y - y) < RW + 1.5;
    H.warn(x, y, R + 0.9, 0.9, C.col); H.X.banner('INFERNO CAROUSEL', '', C.col, 1.4); H.X.sfx.hum();
    const fl0 = [0, 0, 0];
    H.add({ life: 4.9 + (WAVE2 ? 0.4 : 0), x, y, rot: 0, comp: 0, fl: fl0, pos: [],
      update(dt, f) { f.rot += dt * (1.8 + f.comp * 5); f.comp = f.t > 2.6 && f.t < 3.0 ? H.ease.in(cl((f.t - 2.6) / 0.4)) : f.t >= 3.0 && f.t < WAVE ? 1 : 0; flings.forEach((t0, i) => { if (f.t > t0) f.fl[i] = cl((f.t - t0) / 0.45); });
        if (f.t < WAVE) K.aura(x, y, 0.5, dt, 20, 1.5); for (const p of f.pos) if (Math.random() < 0.5) K.aura(p[0], p[1], 0.25, dt, 10, p[2]); },
      drawUnder(c, f, X, Y, T, t) {
        const k = H.fade(f, 0.4, 0.7), form = H.ease.out(cl(f.t / 0.7));
        // the rune ring the low blades cut: a molten channel with ticks, glowing hotter as they strike
        if (f.t < WAVE) { const hot = 0.55 + 0.45 * Math.max(0, ...ticks.map(t0 => 1 - Math.abs(f.t - t0) / 0.18)); c.save(); c.globalAlpha = k * form;
          c.fillStyle = H.rgba(P.char, 0.32); c.beginPath(); c.ellipse(X, Y, T * (R + 0.9), T * (R + 0.9) * H.GY, 0, 0, TAU); c.ellipse(X, Y, T * (R - 0.6), T * (R - 0.6) * H.GY, 0, 0, TAU, true); c.fill('evenodd');
          K.floorLight(c, X, Y, T * (R + 1.2), 0.3 * hot); c.globalCompositeOperation = 'lighter';
          for (const rr of [R - 0.6, R + 0.9]) { c.strokeStyle = H.rgba(P.org, 0.7 * hot); c.lineWidth = 3; H.floorEllipse(c, X, Y, T * rr); c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.8 * hot); c.lineWidth = 1.2; c.stroke(); }
          c.strokeStyle = H.rgba(P.yel, 0.75 * hot); c.lineWidth = 2.5; for (let i = 0; i < 16; i++) { const b = i / 16 * TAU - f.rot * 0.5; c.beginPath(); c.moveTo(X + Math.cos(b) * T * (R - 0.4), Y + Math.sin(b) * T * (R - 0.4) * H.GY); c.lineTo(X + Math.cos(b + 0.12) * T * (R + 0.7), Y + Math.sin(b + 0.12) * T * (R + 0.7) * H.GY); c.stroke(); }
          c.restore(); K.floorLight(c, X, Y, T * 1.6 * form, 0.6 * k); }
        // the blades' light on the floor
        for (const p of f.pos) K.floorLight(c, H.sx(p[0]), H.sy(p[1]), T * 0.8, 0.35 * k);
        if (f.t > WAVE) { const u = cl((f.t - WAVE) / 0.5), heat = Math.max(0.1, 1 - (f.t - WAVE) / 1.1); K.scorch(c, X, Y, T * RW * u, k * 0.85, heat, 3); K.shockRing(c, X, Y, T * RW * H.ease.out(cl((f.t - WAVE) / 0.45)), 1 - cl((f.t - WAVE) / 0.5));
          if (WAVE2 && f.t > WAVE2) K.shockRing(c, X, Y, T * (RW + 1.4) * H.ease.out(cl((f.t - WAVE2) / 0.45)), 1 - cl((f.t - WAVE2) / 0.5)); }
      },
      draw(c, f, X, Y, T, t) {
        const k = Math.min(1, f.life / 0.6), form = H.ease.out(cl(f.t / 0.7)), colA = f.t < WAVE ? 1 : 1 - cl((f.t - WAVE) / 0.35); c.globalAlpha = k; if (near) petHole(c, T);
        const ch = T * (2.6 + 0.12 * ev) * form * (1 - f.comp * 0.5), cw = T * (0.6 + f.comp * 0.35) * form;
        // the blades, three tiers deep, sorted with the column by depth
        const items = [], pos = []; for (let tier = 0; tier < TIERS; tier++) { const z = (0.3 + tier * 1.0) * form, fl = f.fl[tier]; if (fl >= 1) continue; const rr = T * (R * form * (1 - f.comp * 0.55) + fl * (RW - R + 2 + tier * 0.6)), zz = z * (1 - fl) + fl * 0.25, dip = tier === 0 ? Math.max(0, ...ticks.map(t0 => 1 - Math.abs(f.t - t0) / 0.14)) * 0.25 : 0;
          for (let j = 0; j < NB; j++) { const dir = tier % 2 ? -1 : 1, b = j / NB * TAU + f.rot * dir * (1 + tier * 0.2) + tier * 0.6, bx = X + Math.cos(b) * rr, by = Y + Math.sin(b) * rr * H.GY, zt = (zz - dip) * T, al = (1 - fl * 0.6) * (tier === 2 ? 0.95 : 1);
            pos.push([x + Math.cos(b) * rr / T, y + Math.sin(b) * rr / T * H.GY, zz]);
            items.push({ y: by, d() { H.softShadow(c, bx, by, T * 0.45, 0.16 * al); const sz = T * (1.4 - tier * 0.15) * (1 - fl * 0.2), tang = b + Math.PI / 2 * dir; blade(c, bx, by - zt, sz, Math.atan2(Math.sin(tang) * H.GY, Math.cos(tang)) + (dir < 0 ? Math.PI : 0) + (fl ? Math.PI * 0.5 * fl : 0), t, al, NB * TIERS > 9 ? -1 - j - tier * 3 : j + tier * 3);
              if (fl > 0) { const pts = []; for (let q = 0; q <= 5; q++) { const r2 = rr - q * T * 0.35, b2 = b - dir * q * 0.06; pts.push([X + Math.cos(b2) * r2, Y + Math.sin(b2) * r2 * H.GY - zt]); } H.trail(c, pts.reverse(), T * 0.3, P.org, P.yel); } } }); } }
        f.pos = pos;
        if (colA > 0.01) items.push({ y: Y, d() {
          H.softShadow(c, X, Y, T * 1.0 * form, 0.3 * form);
          // the column: a crown of flames, a spiral of fire wound round it, a white-hot heart and a fireball cap
          c.save(); c.globalAlpha = k * colA;
          for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + t * 0.8, s = Math.sin(b); if (s >= 0) continue; K.flame(c, X + Math.cos(b) * cw * 0.9, Y + s * cw * 0.35, cw * 0.55, ch * 0.32 * (0.85 + 0.15 * Math.sin(t * 8 + i)), t, i * 2.2, Math.cos(b) * cw * 0.3, 0.9, true); }
          K.flame(c, X, Y + T * 0.05, cw * 1.6, ch, t, 1, Math.sin(t * 3) * cw * 0.2, 1);
          K.flame(c, X - cw * 0.3, Y - ch * 0.25, cw * 1.0, ch * 0.75, t, 4, -cw * 0.3, 0.9, true); K.flame(c, X + cw * 0.3, Y - ch * 0.3, cw, ch * 0.7, t, 7, cw * 0.3, 0.9, true);
          for (let s = 0; s < 2; s++) { const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14, b = u * TAU * 1.6 + t * 6 + s * Math.PI; pts.push([X + Math.cos(b) * cw * (0.75 - u * 0.3), Y - u * ch * 0.95 + Math.sin(b) * cw * 0.25]); } H.ribbon(c, pts, T * 0.14, H.rgba(P.dred, 0.8), null, u => 0.4 + 0.6 * Math.sin(u * Math.PI)); c.save(); c.globalCompositeOperation = 'lighter'; H.ribbon(c, pts, T * 0.1, H.rgba(P.yel, 0.85), P.wht, u => 0.4 + 0.6 * Math.sin(u * Math.PI)); c.restore(); }
          for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + t * 0.8, s = Math.sin(b); if (s < 0) continue; K.flame(c, X + Math.cos(b) * cw * 0.9, Y + s * cw * 0.35, cw * 0.55, ch * 0.3 * (0.85 + 0.15 * Math.sin(t * 8 + i)), t, i * 2.2, Math.cos(b) * cw * 0.3, 0.95, true); }
          H.core(c, X, Y - ch * 0.45, cw * (0.6 + f.comp * 0.5), P.org, P.wht, 0.75 + f.comp * 0.25);
          K.fireball(c, X, Y - ch * 0.98, T * (0.28 + f.comp * 0.1) * form, t, 2, 0.95);
          shimmer(c, X, Y - ch * 1.1, cw * 1.6, T * 1.3, t, 1); c.restore(); } });
        items.sort((p, q) => p.y - q.y).forEach(it => it.d());
        // the fire wave: a rolling ring of flames (and at Celestial a second, wider one)
        const wave = (t0, Rw, n) => { if (f.t > t0 && f.t < t0 + 0.75) { const u = (f.t - t0) / 0.75; ringS(c, X, Y, T * Rw * H.ease.out(u), n, T * (1.1 - u * 0.6), t, 1 - u * 0.8, t * 0.3); } };
        wave(WAVE, RW, H.Q() < 1 ? 12 : 18); if (WAVE2) wave(WAVE2, RW + 1.4, H.Q() < 1 ? 14 : 22);
      } });
    const tickD = DK * 0.95, flingD = DK * 1.6 * 3 / TIERS, waveD = DK * (WAVE2 ? 1.9 : 2.8), wave2D = DK * 0.9;
    ticks.forEach((t0, i) => H.X.after(t0, () => { H.hitRing(x, y, R - 0.8, R + 1.0, tickD, C.dmgO({ kb: 1, burn: 1 })); for (let j = 0; j < NB; j++) { const b = j / NB * TAU + i * 0.8, px = x + Math.cos(b) * R, py = y + Math.sin(b) * R * H.GY; K.sparks(px, py, 5, 6); K.embers(px, py, 3); } H.X.light(x, y, R * 1.5, 0.2); H.X.shake(3, 0.1); H.X.sfx.whoosh(); }));
    flings.forEach((t0, i) => H.X.after(t0 + 0.3, () => { const r0 = 0.6 + i * 1.3, r1 = r0 + 1.8 + (R - 2.3); H.hitRing(x, y, r0, r1, flingD, C.dmgO({ kb: 3 + i, burn: 1 })); H.X.ring(x, y, r0, r1, 0.35, i % 2 ? P.yel : P.org, 0.5); for (let j = 0; j < H.n(14); j++) { const b = Math.random() * TAU; K.sparks(x + Math.cos(b) * r1, y + Math.sin(b) * r1 * H.GY, 1, 5); H.P({ kind: 'ember', x: x + Math.cos(b) * r1, y: y + Math.sin(b) * r1 * H.GY, vx: Math.cos(b) * 3, vy: -2 - Math.random() * 2, g: -1, life: 0.6, max: 0.6, size: 4, color: j % 2 ? P.org : P.yel }); } H.X.shake(6, 0.12); H.X.sfx.crash(); }));
    H.X.after(WAVE, () => { H.hitArea(x, y, RW, waveD, C.dmgO({ kb: 6, burn: 1 })); K.blast(x, y, RW * 0.7, 2); H.X.ring(x, y, 0.3, RW, 0.55, P.yel, 0.5); H.X.flash(0.25, '#FFE0B0'); fireAt(C, x, y, 1.6, 2.5, 0.6); K.smoke(x, y, 8, RW * 0.5); K.flakes(x, y, 10); H.X.sfx.crash(); H.X.hitstop(0.06); });
    if (WAVE2) H.X.after(WAVE2, () => { H.hitRing(x, y, RW - 0.5, RW + 1.6, wave2D, C.dmgO({ kb: 4, burn: 1 })); H.X.ring(x, y, RW, RW + 1.6, 0.45, P.org, 0.5); for (let j = 0; j < H.n(16); j++) { const b = j / 16 * TAU; K.embers(x + Math.cos(b) * (RW + 1), y + Math.sin(b) * (RW + 1) * H.GY, 2); } H.X.shake(7, 0.15); H.X.sfx.crash(); });
  };

  /* a sun: a fireball inside a turning mantle of flame (a tilted ring of tongues, the back ones behind the ball), corona rays */
  function sun(c, x, y, r, t, seed, a, tilt) {
    if (r < 1) return; const n = H.Q() < 1 ? 4 : sun.n || 6, L = []; for (let i = 0; i < n; i++) { const b = i / n * TAU + t * 2.6 + seed; L.push([Math.sin(b), b, i]); }
    c.save(); c.globalAlpha = a; K.glow(c, x, y, r * 3.4, P.amb, 0.35 * a);
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x, y); c.rotate(t * 0.7 + seed); for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); const g = c.createLinearGradient(0, 0, r * 2.4, 0); g.addColorStop(0, H.rgba(P.yel, 0.45 * a)); g.addColorStop(1, H.rgba(P.org, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(r * 0.6, -r * 0.18); c.lineTo(r * (2.1 + 0.3 * Math.sin(t * 7 + i)), 0); c.lineTo(r * 0.6, r * 0.18); c.closePath(); c.fill(); } c.restore();
    const ring = back => { for (const [s, b, i] of L) { if ((s < 0) !== back) continue; const px = x + Math.cos(b) * r * 1.25, py = y + Math.sin(b) * r * 1.25 * tilt; flameAtS(c, px, py, Math.atan2(Math.sin(b) * tilt, Math.cos(b)) - 0.9, r * 0.5, r * (0.9 + 0.25 * Math.sin(t * 11 + i + seed)), t, i + seed, a * (back ? 0.75 : 0.95)); } };
    ring(true); ball(c, x, y, r, t, seed, a); ring(false); c.restore();
  }
  // F-U07 Crown of Falling Suns: a molten crown (a shaded band of dark crust and glowing seams, faceted spikes, a ring of flames) gathers
  // over the aim; suns ride its points, each growing a turning mantle of flame, then fall one by one on marked spots, trailing
  // fire, and burst; the crown's outline then drops as a circular strike shedding cinders. Evolution: 3 suns at Hatchling to 8
  // at Celestial on a wider crown; at Celestial the crown breaks into a ring of burning spires where it lands.
  U.fallingsuns = (C, h) => {
    H = h; K = FK.bind(H); const x = C.tx, y = C.ty, ev = K.evo(C), DK = C.base * C.K * K.evoK(C), R = (3.2 + 0.1 * (ev - 1)) * C.K, Z = 3.6, N = K.evoN(C, 3, 8), CR = 1.8 + 0.08 * ev, suns = [], near = Math.hypot(H.me.x - x, H.me.y - y) < R + 2;
    const tg = H.sortNear(x, y).filter(m => Math.hypot(m.x - x, m.y - y) < R + 0.5); const STEP = 1.8 / N;
    for (let i = 0; i < N; i++) { const m = tg[i % Math.max(1, tg.length)], b = i / N * TAU + 0.3, r = 1.0 + (i % 2) * 1.4; suns.push({ b, tx: m ? m.x + (Math.random() - 0.5) * 0.5 : x + Math.cos(b) * r, ty: m ? m.y + (Math.random() - 0.5) * 0.5 : y + Math.sin(b) * r, fall: 0, gone: false, t0: 1.4 + i * STEP, hitT: -9 }); }
    sun.n = N > 5 ? 4 : 6; H.warn(x, y, R, 1.2, C.col); H.X.banner('CROWN OF FALLING SUNS', '', C.col, 1.4); H.X.sfx.hum();
    const CROWN = 1.4 + N * STEP + 0.1, CHIT = CROWN + 0.45;
    H.add({ life: CHIT + 1.4, x, y, cz: Z,
      update(dt, f) { for (const s of suns) { if (s.gone) continue; if (f.t > s.t0 - 0.32) s.fall = cl((f.t - s.t0 + 0.32) / 0.32); if (f.t >= s.t0) { s.gone = true; s.hitT = f.t; } } if (f.t > CROWN) f.cz = Math.max(0, Z - (f.t - CROWN) / (CHIT - CROWN) * Z);
        if (f.t < CHIT) { K.aura(x, y, CR, dt, 18, f.cz); for (const s of suns) if (!s.gone) K.aura(x + Math.cos(s.b + f.t * 0.5) * CR, y + Math.sin(s.b + f.t * 0.5) * CR * 0.45, 0.3, dt, 6, f.cz + 0.5); } },
      drawUnder(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.7), form = H.ease.out(cl(f.t / 1.0));
        // the crown's light from above, growing as it gathers
        if (f.t < CHIT) { K.floorLight(c, X, Y, T * CR * 1.5 * form, 0.25 + 0.3 * (1 - f.cz / Z)); c.save(); c.globalAlpha = 0.3 * form; c.strokeStyle = H.rgba(P.org, 0.7); c.setLineDash([T * 0.3, T * 0.2]); c.lineDashOffset = -t * T; c.lineWidth = 2; H.floorEllipse(c, X, Y, T * CR); c.stroke(); c.restore(); }
        for (const s of suns) { const SX = H.sx(s.tx), SY = H.sy(s.ty); if (s.gone) { const a2 = f.t - s.hitT; K.scorch(c, SX, SY, T * 1.3 * cl(a2 / 0.25), k * 0.85, Math.max(0.1, 1 - a2 / 1.6), s.b * 3); K.shockRing(c, SX, SY, T * 1.6 * H.ease.out(cl(a2 / 0.35)), 1 - cl(a2 / 0.4)); } else if (s.fall > 0) K.floorLight(c, SX, SY, T * (0.6 + s.fall), 0.6 * s.fall); }
        if (f.t > CHIT) { const a2 = f.t - CHIT; K.scorch(c, X, Y, T * R * cl(a2 / 0.4), k * 0.85, Math.max(0.1, 1 - a2 / 1.1), 7); K.shockRing(c, X, Y, T * (R + 0.4) * H.ease.out(cl(a2 / 0.4)), 1 - cl(a2 / 0.5)); }
      },
      draw(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.6), form = H.ease.out(cl(f.t / 1.0)); c.globalAlpha = k; if (near) petHole(c, T);
        const cy = Y - T * f.cz, rx = T * CR * form, ry = T * CR * 0.45 * form, NS = 6 + N;
        // the crown: back half of the band and spikes first, then the suns behind, the front half, the suns in front
        const band = (back) => { c.save(); c.lineCap = 'butt'; const a0 = back ? Math.PI : 0, a1 = back ? TAU : Math.PI;
          c.strokeStyle = H.line(); c.lineWidth = T * 0.3; c.beginPath(); c.ellipse(X, cy, rx, ry, 0, a0, a1); c.stroke();
          const g = c.createLinearGradient(0, cy - ry - T * 0.15, 0, cy + ry + T * 0.15); g.addColorStop(0, back ? P.crust : P.crustL); g.addColorStop(0.5, back ? P.char : P.crust); g.addColorStop(1, back ? P.char : P.dred); c.strokeStyle = g; c.lineWidth = T * 0.24; c.stroke();
          c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, back ? 0.5 : 0.85); c.lineWidth = T * 0.06; c.setLineDash([T * 0.22, T * 0.12]); c.lineDashOffset = -t * T * 1.5; c.beginPath(); c.ellipse(X, cy, rx, ry, 0, a0, a1); c.stroke(); c.setLineDash([]);
          if (!back) { c.strokeStyle = H.rgba(P.yel, 0.6); c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.ellipse(X, cy - T * 0.1, rx, ry, 0, 0.2, Math.PI - 0.2); c.stroke(); }
          c.restore();
          // faceted spikes standing on the band, lit left face and shaded right, a glowing tip
          for (let i = 0; i < NS; i++) { const b = i / NS * TAU + 0.1 + f.t * 0.25, s = Math.sin(b); if ((s < 0) !== back) continue; const bx = X + Math.cos(b) * rx, by = cy + s * ry, sw = T * 0.2 * form, shh = T * (0.5 + 0.12 * (i % 2)) * form, tx = bx, ty = by - shh, d = back ? 0.8 : 1;
            c.fillStyle = back ? P.crust : P.crustL; c.beginPath(); c.moveTo(bx - sw, by); c.lineTo(tx, ty); c.lineTo(bx + sw * 0.1 * Math.cos(b), by); c.closePath(); c.fill();
            c.fillStyle = back ? P.char : P.dred; c.beginPath(); c.moveTo(bx + sw * 0.1 * Math.cos(b), by); c.lineTo(tx, ty); c.lineTo(bx + sw, by); c.closePath(); c.fill();
            c.strokeStyle = H.line(); c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx - sw, by); c.lineTo(tx, ty); c.lineTo(bx + sw, by); c.stroke();
            c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.8 * d); c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx, by - shh * 0.1); c.lineTo(tx, ty + shh * 0.2); c.stroke(); c.restore(); K.glow(c, tx, ty, T * 0.22, P.yel, 0.7 * d);
            if (i % 2 === 0) K.flame(c, bx, by - T * 0.05, T * 0.22, T * (0.45 + 0.1 * Math.sin(t * 8 + i)) * form, t, i * 1.7, 0, 0.85 * d, true); } };
        const sunItems = []; suns.forEach((s, i) => { if (s.gone) return; const u = H.ease.in(s.fall), b = s.b + f.t * 0.5, ox = X + Math.cos(b) * rx, oy = cy + Math.sin(b) * ry - T * 0.75 * form, SX = H.sx(s.tx), SY = H.sy(s.ty) - T * 0.3, px = lerp(ox, SX, u), py = lerp(oy, SY, u), grow = cl((f.t - 0.6 - i * 0.12) / 0.6), r = T * (0.3 + 0.16 * grow) * form;
          sunItems.push({ back: Math.sin(b) < 0 && u === 0, d() { if (u > 0) { const pts = []; for (let j = 0; j <= 6; j++) { const q = Math.max(0, u - j * 0.07); pts.push([lerp(ox, SX, q), lerp(oy, SY, q)]); } pts.reverse(); streak(c, pts, r * 1.1, t, 0.9, q => 0.25 + 0.75 * q, i, 2); } sun(c, px, py, r, t, i * 1.3, 1, 0.45); } }); });
        if (f.t < CHIT) { const al = f.t > CROWN ? 1 : 0.6 + 0.4 * form; c.save(); c.globalAlpha = k * al; K.glow(c, X, cy, rx * 1.4, P.org, 0.35); band(true); sunItems.filter(s => s.back).forEach(s => s.d()); band(false); c.restore(); if (f.t > CROWN) { for (let i = 0; i < H.n(3); i++) { const b = Math.random() * TAU; H.P({ kind: 'spark', x: x + Math.cos(b) * CR, y: y + Math.sin(b) * CR * 0.45 - f.cz, vx: Math.cos(b) * 2, vy: 2 + Math.random() * 3, g: 8, life: 0.4, max: 0.4, size: 2.5, color: Math.random() < 0.5 ? P.yel : P.wht }); } shimmer(c, X, cy, rx, T * 1.2, t, 1); } }
        sunItems.filter(s => !s.back).forEach(s => s.d());
        // Celestial: the crown breaks into burning spires round its landing
        if (ev >= 7 && f.t > CHIT && f.t < CHIT + 1.2) { const u = cl((f.t - CHIT) / 0.2), out = 1 - cl((f.t - CHIT - 0.8) / 0.4); for (let i = 0; i < 10; i++) { const b = i / 10 * TAU, bx = X + Math.cos(b) * T * R * 0.95, by = Y + Math.sin(b) * T * R * 0.95 * H.GY; K.flame(c, bx, by, T * 0.4, T * 1.4 * u * out * (0.85 + 0.15 * Math.sin(t * 9 + i)), t, i * 2, 0, out, true); } }
      } });
    const sunD = DK * 1.7 * 6 / N, crownD = DK * (ev >= 7 ? 3.0 : 3.6);
    suns.forEach((s, i) => { H.X.after(s.t0 - 0.35, () => H.warn(s.tx, s.ty, 1.4, 0.35, C.col)); H.X.after(s.t0, () => { H.hitArea(s.tx, s.ty, 1.45, sunD, C.dmgO({ kb: 3, burn: 1 })); impact(s.tx, s.ty, 1.4, 1.1); K.smoke(s.tx, s.ty, 3, 0.5); if (i % 2) fireAt(C, s.tx, s.ty, 1.0, 2.0, 0.5); H.X.sfx.crash(); }); });
    H.X.after(CHIT, () => { H.hitArea(x, y, R, crownD, C.dmgO({ kb: 5, burn: 1, stun: 0.4 })); K.blast(x, y, R * 0.8, 2); H.X.ring(x, y, 1.0, R, 0.5, P.yel, 0.5); H.X.ring(x, y, 0.3, R * 0.6, 0.35, P.wht, 0.3); H.X.flash(0.3, '#FFE0B0'); K.flakes(x, y, 12); for (let j = 0; j < H.n(28); j++) { const b = j / 28 * TAU; H.P({ kind: 'ember', x: x + Math.cos(b) * CR, y: y + Math.sin(b) * CR * 0.45, vx: Math.cos(b) * 4, vy: Math.sin(b) * 2 - 2, g: 1, life: 0.9, max: 0.9, size: 4.5, color: j % 2 ? P.org : P.gold }); } H.X.sfx.crash(); H.X.hitstop(0.08);
      if (ev >= 7) { H.hitRing(x, y, R * 0.8, R + 0.6, DK * 0.6, C.dmgO({ kb: 2, burn: 1 })); for (let i = 0; i < 10; i += 2) { const b = i / 10 * TAU; fireAt(C, x + Math.cos(b) * R * 0.95, y + Math.sin(b) * R * 0.95, 0.7, 1.2, 0.4); } } });
  };

  // F-U08 River of Molten Stars: a molten river (charred banks, a bright current under a drifting crust of glowing plates, small flames
  // riding it) pours along the aim and branches round its path; faceted star-cores ride the current and erupt in geysers of
  // flame; at its end it rears into a great curling wave of fire and folds down, leaving channels that glow and fade. Evolution:
  // a longer river, 2 star-cores and one pair of branches at Hatchling to 5 star-cores and two pairs at Celestial, where the
  // channels also erupt in a line of flame after the fold.
  U.moltenriver = (C, h) => {
    H = h; K = FK.bind(H); const me = H.me, a = C.a, ev = K.evo(C), DK = C.base * C.K * K.evoK(C), L = Math.max(3.0, Math.min((5.4 + 0.3 * (ev - 1)) * C.K, Math.hypot(C.tx - me.x, C.ty - me.y) + 1.0)), x0 = me.x + Math.cos(a) * 0.8, y0 = me.y + Math.sin(a) * 0.8, px = -Math.sin(a), py = Math.cos(a), FLOW = 1.5, ex = x0 + Math.cos(a) * L, ey = y0 + Math.sin(a) * L, WAVE = 2.4, FOLD = 3.15, NS = K.evoN(C, 2, 5), NBR = ev >= 5 ? 2 : 1, FIN = ev >= 7 ? FOLD + 0.55 : 0;
    const stars = []; for (let i = 0; i < NS; i++) stars.push([L * (0.22 + 0.62 * i / Math.max(1, NS - 1)), 1.0 + i * (1.0 / Math.max(1, NS - 1))]); if (NS === 1) stars[0] = [L * 0.5, 1.4];
    H.warnLine(x0, y0, a, L + 0.6, 2.6, 1.0, C.col); H.X.banner('RIVER OF MOLTEN STARS', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.6;
    const at = d => [x0 + Math.cos(a) * d, y0 + Math.sin(a) * d];
    // the branches: each leaves the river, swings out round its path and rejoins (sides alternate, the second pair wider)
    const brs = []; for (let i = 0; i < NBR * 2; i++) brs.push({ sg: i % 2 ? 1 : -1, d0: L * (0.22 + 0.12 * Math.floor(i / 2)), d1: L * (0.78 + 0.08 * Math.floor(i / 2)), w: 1.2 + 0.6 * Math.floor(i / 2) });
    const plates = []; for (let i = 0; i < 9; i++) plates.push({ d: Math.random(), o: (Math.random() - 0.5) * 0.5, s: 0.18 + Math.random() * 0.12, r: Math.random() * TAU });
    H.add({ life: 4.9 + (FIN ? 0.4 : 0), flow: 0, tk: 0,
      update(dt, f) { f.flow = Math.min(1, (f.t - 0.3) / FLOW); if (f.t > 1.0 && f.t < 3.1) { f.tk -= dt; if (f.tk <= 0) { f.tk = 0.4; H.hitLine(x0, y0, a, L * Math.max(0, f.flow), 1.6, DK * 0.5, C.dmgO({ dot: true, dotC: P.org, burn: 1 })); } }
        for (const p of plates) p.d = (p.d + dt * 0.12) % 1;
        if (f.flow > 0 && f.t < FOLD + 0.4) { const p = at(L * f.flow * Math.random()); K.aura(p[0], p[1], 0.6, dt, 22, 0); if (f.flow < 1) { const q = at(L * f.flow); K.aura(q[0], q[1], 0.4, dt, 16, 0.2); } } },
      drawUnder(c, f, X, Y, T, t) {
        const k = Math.min(1, f.life / 1.0), fl = Math.max(0, f.flow), heat = f.t < FOLD + 0.3 ? 1 : Math.max(0.12, 1 - (f.t - FOLD - 0.3) / 1.3), M = H.sx, N = H.sy; if (fl <= 0) return; c.save(); c.globalAlpha = k;
        const main = []; for (let i = 0; i <= 18; i++) { const d = L * fl * i / 18, w = Math.sin(d * 1.3 + t * 2) * 0.16, p = at(d); main.push([M(p[0] + px * w), N(p[1] + py * w)]); }
        const brP = brs.map(b => { const o = []; for (let i = 0; i <= 10; i++) { const d = lerp(b.d0, b.d1, i / 10); if (d > L * fl) break; const off = Math.sin(i / 10 * Math.PI) * b.w * b.sg, p = at(d); o.push([M(p[0] + px * off), N(p[1] + py * off)]); } return o; });
        // the river: charred banks, a dark-red bed, the bright current, crust plates drifting on it
        const river = (pts, w) => { if (pts.length < 2) return; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = H.rgba(P.char, 0.4); c.lineWidth = w * 1.55; H.poly(c, pts, false); c.stroke(); c.strokeStyle = P.crust; c.lineWidth = w * 1.18; c.stroke();
          c.strokeStyle = H.rgba(P.crustL, 0.8); c.lineWidth = w * 1.12; c.setLineDash([T * 0.22, T * 0.3]); c.stroke(); c.setLineDash([]); c.strokeStyle = H.mix(P.crust, P.red, heat); c.lineWidth = w * 0.92; c.stroke();
          c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, heat * 0.75); c.lineWidth = w * 0.7; c.stroke(); c.strokeStyle = H.rgba(P.amb, heat * 0.55); c.lineWidth = w * 0.42; c.stroke(); c.strokeStyle = H.rgba(P.yel, heat * 0.8); c.lineWidth = w * 0.2; c.setLineDash([T * 0.6, T * 0.25]); c.lineDashOffset = -t * T * 3 * heat; c.stroke(); c.setLineDash([]); c.strokeStyle = H.rgba(P.wht, heat * 0.5); c.lineWidth = Math.max(1, w * 0.06); c.stroke(); c.restore(); };
        for (let i = 1; i < main.length; i += 3) K.floorLight(c, main[i][0], main[i][1], T * 1.5, 0.4 * heat);
        brP.forEach(p => river(p, T * 0.42)); river(main, T * 0.95);
        // crust plates: dark shaded slabs with a glowing rim, riding the current
        if (heat > 0.3) for (const p of plates) { if (p.d > fl) continue; const q = at(L * p.d), SX = M(q[0] + px * p.o), SY = N(q[1] + py * p.o), s = T * p.s, rr = p.r + t * 0.4; const pts = []; for (let j = 0; j < 5; j++) { const b = rr + j / 5 * TAU, rad = s * (0.75 + 0.3 * ((j * 7 + p.s * 40) % 3) / 2); pts.push([SX + Math.cos(b) * rad, SY + Math.sin(b) * rad * 0.55]); } H.slab(c, pts, P.crust, P.crustL, P.char, { lw: 1 }); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.7 * heat); c.lineWidth = 1.5; H.poly(c, pts); c.stroke(); c.restore(); }
        if (heat < 1) shimmer(c, main[main.length >> 1][0], main[main.length >> 1][1], T * 2, T, t, heat);
        // the erupted stars' scorches and the end's great scorch
        for (const [d, t0] of stars) if (f.t > t0) { const p = at(d), a2 = f.t - t0; K.scorch(c, M(p[0]), N(p[1]), T * 1.4 * cl(a2 / 0.25), k, Math.max(0.1, 1 - a2 / 1.6), d); K.shockRing(c, M(p[0]), N(p[1]), T * 1.7 * H.ease.out(cl(a2 / 0.35)), 1 - cl(a2 / 0.4)); }
        if (f.t > FOLD) { const a2 = f.t - FOLD; K.scorch(c, M(ex), N(ey), T * 3 * C.K * cl(a2 / 0.3), k, Math.max(0.1, 1 - a2 / 1.3), 5); K.shockRing(c, M(ex), N(ey), T * 3.4 * C.K * H.ease.out(cl(a2 / 0.4)), 1 - cl(a2 / 0.5)); }
        c.restore();
      },
      draw(c, f, X, Y, T, t) {
        const k = Math.min(1, f.life / 0.8), fl = Math.max(0, f.flow); c.globalAlpha = k; petHole(c, T);
        // flames riding the current, and the head of the flow
        if (f.t < FOLD + 0.3) { const nf = H.Q() < 1 ? 4 : 7; for (let i = 0; i < nf; i++) { const d = ((i + 0.5) / nf) * L * fl, p = at(d), w = Math.sin(d * 1.3 + t * 2) * 0.16; K.flame(c, H.sx(p[0] + px * w), H.sy(p[1] + py * w), T * 0.3, T * (0.5 + 0.2 * Math.sin(t * 7 + i * 2)), t, i * 1.9, Math.cos(a) * T * 0.1, 0.85, true); } }
        if (fl > 0 && fl < 1) { const p = at(L * fl), HX = H.sx(p[0]), HY = H.sy(p[1]); K.flame(c, HX, HY, T * 0.7, T * 1.1, t, 3, Math.cos(a) * T * 0.25, 1); H.core(c, HX, HY - T * 0.2, T * 0.32, P.org, P.wht, 0.9); }
        // the star-cores: faceted gold stars bobbing in the current, spinning faster as they near their eruption
        stars.forEach(([d, t0], i) => { const show = f.t > 0.4 && f.t < t0, u = cl((f.t - 0.4) / Math.max(0.1, t0 - 0.5)), p = at(Math.min(d, L * fl) * u); if (show) { const SX = H.sx(p[0]), SY = H.sy(p[1]) - T * (0.25 + 0.08 * Math.sin(t * 5 + i)), sp = 2 + 8 * u * u; facetStar(c, SX, SY, T * 0.32, T * 0.13, 5, t * sp + i, RAMP_HOT, 1, 0.9); } });
        // eruptions: a geyser of flame and a fountain of fire where each star bursts
        for (const [d, t0] of stars) if (f.t > t0 && f.t < t0 + 0.8) { const p = at(d), u = (f.t - t0) / 0.8, SX = H.sx(p[0]), SY = H.sy(p[1]), hh = T * 2.4 * Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * (1 - u * u); K.flame(c, SX, SY, T * 0.75, hh, t, d * 3, 0, 1 - u * u); K.fireball(c, SX, SY - hh * 0.95, T * 0.25 * (1 - u), t, d, 1 - u); }
        // the wave: the river rears up at its end into a curling crest and folds back down
        if (f.t > WAVE && f.t < FOLD + 0.5) { const up = cl((f.t - WAVE) / (FOLD - WAVE)), fold = f.t > FOLD ? cl((f.t - FOLD) / 0.3) : 0, EX = H.sx(ex), EY = H.sy(ey), ca = Math.cos(a), sa = Math.sin(a) * H.GY, pys = py * H.GY, live = 1 - fold * 0.8,
            Hh = T * (2.6 + 0.15 * ev) * H.ease.out(up) * (1 - fold * 0.85), W = T * (1.5 + 0.06 * ev) * (0.7 + 0.3 * up), NC = 12, base = [], crest = [], lip = [];
          for (let j = 0; j <= NC; j++) { const s = j / NC * 2 - 1, prof = Math.pow(Math.cos(s * Math.PI / 2), 0.8), hh = Hh * prof * (0.86 + 0.14 * Math.sin(t * 5 + s * 7)), bulge = T * 0.6 * Math.cos(s * Math.PI / 2), bx = EX + px * s * W + ca * bulge, by = EY + pys * s * W + sa * bulge, lb = (-T * 0.7 * up * (1 - fold) + T * 2.2 * fold) * prof, cu = T * 0.85 * prof * up * (1 - fold * 0.6);
            base.push([bx, by]); crest.push([bx + ca * lb, by + sa * lb - hh]); lip.push([crest[j][0] + ca * cu, crest[j][1] + sa * cu + cu * 0.55]); }
          K.glow(c, EX, EY - Hh * 0.55, Math.max(W, Hh) * 1.6, P.org, 0.55 * live); K.floorLight(c, EX, EY, W * 1.8, 0.6 * live);
          c.save(); c.globalAlpha = k * live; c.lineJoin = 'round';
          // the body of the wave: molten from a dark-red foot to a yellow crest, lit on the left, shaded on the right
          const body = base.concat(crest.slice().reverse()); H.poly(c, body); let g = c.createLinearGradient(0, EY, 0, EY - Hh - 1); g.addColorStop(0, P.dred); g.addColorStop(0.35, P.red); g.addColorStop(0.75, P.org); g.addColorStop(1, P.amb); c.fillStyle = g; c.fill();
          c.save(); c.clip(); g = c.createLinearGradient(EX - W, 0, EX + W, 0); g.addColorStop(0, H.rgba(P.yel, 0.35)); g.addColorStop(0.45, H.rgba(P.yel, 0)); g.addColorStop(0.65, H.rgba(P.dred, 0)); g.addColorStop(1, H.rgba(P.char, 0.55)); c.fillStyle = g; c.fillRect(EX - W * 2, EY - Hh * 2 - T, W * 4, Hh * 2 + T * 2);
            // streaks of brighter melt climbing the face, and dark crust skins sliding down it
            c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let j = 1; j < NC; j++) { const ph = (t * 0.9 + j * 0.37) % 1, b = base[j], q = crest[j]; c.strokeStyle = H.rgba(j % 2 ? P.yel : P.wht, 0.45 * (1 - ph)); c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.moveTo(lerp(b[0], q[0], ph), lerp(b[1], q[1], ph)); c.lineTo(lerp(b[0], q[0], Math.min(1, ph + 0.25)), lerp(b[1], q[1], Math.min(1, ph + 0.25))); c.stroke(); }
            c.globalCompositeOperation = 'source-over'; c.fillStyle = H.rgba(P.crust, 0.75); for (let j = 1; j < NC; j += 2) { const ph = (t * 0.5 + j * 0.29) % 1, b = base[j], q = crest[j]; c.beginPath(); c.ellipse(lerp(q[0], b[0], ph), lerp(q[1], b[1], ph), T * 0.2, T * 0.09, 0.3, 0, TAU); c.fill(); }
          c.restore(); c.strokeStyle = H.rgba(P.dred, 0.9); c.lineWidth = Math.max(1.5, T * 0.045); H.poly(c, body); c.stroke();
          // the lip curling over: a bright underside, the crest line white-hot
          const curlP = crest.concat(lip.slice().reverse()); H.poly(c, curlP); g = c.createLinearGradient(0, crest[NC >> 1][1], 0, lip[NC >> 1][1] + 1); g.addColorStop(0, P.yel); g.addColorStop(1, P.org); c.fillStyle = g; c.fill(); c.strokeStyle = H.rgba(P.dred, 0.8); c.lineWidth = 1.2; c.stroke();
          c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = H.rgba(P.wht, 0.9); c.lineWidth = Math.max(1.5, T * 0.07); H.poly(c, crest, false); c.stroke(); c.restore();
          for (let j = 2; j < NC; j += 2) { const p = lip[j]; K.flame(c, p[0], p[1] + T * 0.1, T * 0.4, T * (0.8 + 0.25 * Math.sin(t * 9 + j)) * up * live, t, j * 1.7, ca * T * 0.25, 0.95 * live, true); }
          ball(c, lip[NC >> 1][0], lip[NC >> 1][1], T * 0.4 * up * live, t, 9, 0.95 * live);
          // droplets of molten star flung from the crest
          for (let i = 0; i < 6; i++) { const ph = (t * 1.3 + i / 6) % 1, b = lip[3 + i]; facetStar(c, b[0] + ca * T * 0.6 * ph, b[1] - T * 0.7 * ph + T * 1.4 * ph * ph, T * 0.13 * (1 - ph * 0.5), T * 0.05, 4, t * 4 + i, RAMP_HOT, (1 - ph) * up * live, 1); }
          shimmer(c, EX, EY - Hh, W, T * 1.4, t, up * live); }
        // Celestial: the channels erupt in a line of flame after the fold
        if (FIN && f.t > FIN && f.t < FIN + 0.9) { const u = (f.t - FIN) / 0.9; for (let i = 0; i < 7; i++) { const d = L * (0.12 + 0.12 * i), p = at(d), lu = cl(u * 2.2 - i * 0.12), hh = T * 1.8 * Math.sin(lu * Math.PI); if (hh > 1) K.flame(c, H.sx(p[0]), H.sy(p[1]), T * 0.55, hh, t, i * 2.3, 0, 0.95, true); } }
      } });
    const starD = DK * 1.7 * 3 / NS, foldD = DK * (FIN ? 3.8 : 4.6);
    stars.forEach(([d, t0]) => { const p = at(d); H.X.after(t0 - 0.3, () => H.warn(p[0], p[1], 1.5, 0.3, C.col)); H.X.after(t0, () => { H.hitArea(p[0], p[1], 1.55, starD, C.dmgO({ kb: 3, burn: 1 })); impact(p[0], p[1], 1.5, 1.2); for (let j = 0; j < H.n(12); j++) { const b = j / 12 * TAU; H.P({ kind: 'star', x: p[0], y: p[1] - 0.3, vx: Math.cos(b) * 4, vy: Math.sin(b) * 2.5 - 3, g: 7, life: 0.6, max: 0.6, size: 4, color: j % 2 ? P.yel : P.wht }); } H.X.sfx.crash(); }); });
    H.X.after(FOLD - 0.4, () => H.warn(ex, ey, 3.0, 0.4, C.col));
    H.X.after(FOLD, () => { H.hitArea(ex, ey, 3.0 * C.K, foldD, C.dmgO({ kb: 6, burn: 1, stun: 0.4 })); H.hitLine(at(L * 0.6)[0], at(L * 0.6)[1], a, L * 0.4 + 1, 3.0, DK * 1.5, C.dmgO({ kb: 3, burn: 1 })); impact(ex, ey, 3.0, 2.2); H.X.flash(0.3, '#FFE0B0'); fireAt(C, ex, ey, 1.8, 3, 0.7); K.smoke(ex, ey, 8, 1.2); for (let j = 0; j < H.n(20); j++) H.P({ kind: 'star', x: ex + (Math.random() - 0.5) * 3, y: ey - 1 - Math.random() * 2, vx: (Math.random() - 0.5) * 2, vy: -1 - Math.random() * 2, life: 1.2, max: 1.2, size: 3 + Math.random() * 3, color: j % 2 ? P.gold : P.wht }); H.X.sfx.crash(); H.X.hitstop(0.08); });
    if (FIN) { H.X.after(FIN - 0.3, () => H.warnLine(x0, y0, a, L * 0.9, 1.6, 0.3, C.col)); H.X.after(FIN + 0.2, () => { H.hitLine(x0, y0, a, L * 0.9, 1.6, DK * 0.8, C.dmgO({ kb: 2, burn: 1 })); for (let i = 0; i < 7; i++) { const p = at(L * (0.12 + 0.12 * i)); K.embers(p[0], p[1], 4); K.sparks(p[0], p[1], 3); } H.X.shake(5, 0.15); H.X.sfx.whoosh(); }); }
  };

  // F-U09 Nine-Tailed Conflagration: flame fox-tails unfurl as a halo AROUND the pet (rooted on a ring round its body, fanning outward
  // like a sunburst; the ones behind it drawn behind it, the pet always clear in the middle), then lash out one by one at
  // the forward area, each leaving a curved ember path; they slide round the halo to gather in front and braid into one
  // spiral lance for the finishing strike, then drift apart as floating strands. Evolution: 3 tails at Hatchling to 9 at
  // Celestial, longer tails reaching further; at Celestial the halo bursts outward in a ring of fire as the strands part.
  U.ninetails = (C, h) => {
    H = h; K = FK.bind(H); const me = H.me, a = C.a, ev = K.evo(C), DK = C.base * C.K * K.evoK(C), N = K.evoN(C, 3, 9), LASH0 = 1.0, LSTEP = 1.98 / N, BRAID = LASH0 + N * LSTEP + 0.05, LANCE = BRAID + 0.45, L = (6.4 + 0.12 * ev) * C.K, TL = 1.25 + 0.1 * ev, FIN = ev >= 7 ? LANCE + 0.5 : 0, tails = [];
    const order = []; for (let i = 0; i < N; i++) order.push(i); order.sort((p, q) => Math.abs(p - (N - 1) / 2) - Math.abs(q - (N - 1) / 2) || p - q);
    for (let i = 0; i < N; i++) { const s = N > 1 ? i / (N - 1) * 2 - 1 : 0, dist = 2.3 + (i % 2) * 1.5 + 0.08 * ev, spot = [me.x + Math.cos(a + s * 0.85) * dist, me.y + Math.sin(a + s * 0.85) * dist]; tails.push({ th: -Math.PI / 2 + i / N * TAU, spot, s, lash: 0, back: 0, t0: LASH0 + order.indexOf(i) * LSTEP, seed: i * 1.7 }); }
    // each tail lashes the spot nearest its own side of the halo
    { const sa0 = Math.atan2(Math.sin(a) * H.GY, Math.cos(a)), spots = tails.map(tl => [tl.spot, tl.s]), ts = tails.slice().sort((p, q) => H.wrap(p.th - sa0) - H.wrap(q.th - sa0)); ts.forEach((tl, j) => { tl.spot = spots[j][0]; tl.s = spots[j][1]; }); }
    H.warnCone(me.x, me.y, a, 4.0 + 0.08 * ev, 0.95, 1.0, C.col); H.X.banner('NINE-TAILED CONFLAGRATION', '', C.col, 1.4); H.X.sfx.hum(); me.sq = 0.7;
    H.X.after(BRAID, () => H.warnLine(me.x, me.y, a, L + 0.5, 2.2, LANCE - BRAID, C.col));
    const sa = Math.atan2(Math.sin(a) * H.GY, Math.cos(a));   // the aim on screen
    H.add({ life: LANCE + 1.4 + (FIN ? 0.3 : 0), tips: [],
      update(dt, f) { for (const tl of tails) { tl.lash = cl((f.t - tl.t0) / 0.22); tl.back = tl.lash >= 1 ? cl((f.t - tl.t0 - 0.32) / 0.45) : 0; }
        const T = H.X.Tz(); if (f.t < LANCE + 0.8) for (const p of f.tips) K.aura(wx(p[0], T), wy(p[1], T), 0.3, dt, 7, 0);
        K.aura(me.x, me.y, 0.9, dt, f.t < LANCE ? 10 : 4, 0.4); },
      // the pose of tail i at this moment, in screen points (13), and whether it is in front of the pet
      pose(tl, i, T, t, f) {
        const [cx, cy, hx, hy] = petBox(T), RX = hx * 1.04, RY = hy * 1.0, unf = H.ease.back(cl(f.t / 0.9)), braid = f.t > BRAID ? H.ease.io(cl((f.t - BRAID) / (LANCE - BRAID))) : 0, lance = f.t > LANCE ? cl((f.t - LANCE) / 0.25) : 0, after = f.t > LANCE + 0.3 ? cl((f.t - LANCE - 0.3) / 1.0) : 0;
        const th = tl.th + Math.sin(t * 0.8) * 0.06, root = [cx + Math.cos(th) * RX, cy + Math.sin(th) * RY], len = T * TL * unf, n = 12;
        // rest: radial out of the halo, curling the same way round like a sunburst, swaying; the lower ones laid flatter
        const rest = []; { let p = root.slice(), d = th; for (let j = 0; j <= n; j++) { const u = j / n; rest.push(p.slice()); d = th + 0.6 * u * u + Math.sin(u * Math.PI * 2 - t * 2.2 + i * 0.9) * 0.32 * u; const sq = Math.sin(d) > 0 ? 0.7 : 1; p = [p[0] + Math.cos(d) * len / n, p[1] + Math.sin(d) * len / n * sq]; } }
        let pts = rest;
        if (tl.lash > 0 && braid === 0) { const fw = tl.back > 0 ? 1 - H.ease.io(tl.back) : H.ease.in(tl.lash), SX = H.sx(tl.spot[0]), SY = H.sy(tl.spot[1]), ctl = [root[0] + Math.cos(th) * T * 1.2 + (SX - root[0]) * 0.25, Math.min(root[1], SY) - T * 1.8], hit = bez(root, ctl, [SX, SY], n); pts = rest.map((p, j) => [lerp(p[0], hit[j][0], fw), lerp(p[1], hit[j][1], fw)]); }
        if (braid > 0) { // slide round the halo to the front, then wind round the lance axis
          let dth = H.wrap(sa - th); const front = []; const Lz = T * (1.2 + L * 0.85 * (0.25 + 0.75 * braid) * (1 - after * 0.3)), ph = i / N * TAU;
          for (let j = 0; j <= n; j++) { const u = j / n; if (u <= 0.3) { const q = u / 0.3, b = th + dth * q, rr = 1 + q * 0.15; front.push([cx + Math.cos(b) * RX * rr, cy + Math.sin(b) * RY * rr]); } else { const q = (u - 0.3) / 0.7, ax = Math.cos(sa), ay = Math.sin(sa), base = [cx + ax * RX * 1.15, cy + ay * RY * 1.15], sp = Math.sin(q * 9 + ph + t * 10), cp = Math.cos(q * 9 + ph + t * 10), amp = T * 0.38 * (1 - lance * 0.6) * (1 - q * 0.4); front.push([base[0] + ax * Lz * q - ay * sp * amp, base[1] + ay * Lz * q + ax * sp * amp - cp * amp * 0.5]); } }
          pts = pts.map((p, j) => [lerp(p[0], front[j][0], braid), lerp(p[1], front[j][1], braid)]); }
        if (after > 0) pts = pts.map((p, j) => { const u = j / n; return [p[0] + Math.cos(th) * T * after * (0.6 + u), p[1] - after * T * (1.0 + u * 1.6) + Math.sin(t * 3 + j * 0.7 + i) * T * 0.15 * after]; });
        const inFront = Math.sin(th) > 0.05 || (tl.lash > 0 && tl.back < 1) || braid > 0;
        return { pts, inFront, w: T * (0.4 + 0.02 * ev) * (1 - after * 0.7) * (1 - braid * 0.12), a: 1 - after, braid, lance, after };
      },
      drawTails(c, f, T, t, front) { const k = Math.min(1, f.life / 0.6), tips = []; tails.forEach((tl, i) => { const P2 = f.pose(tl, i, T, t, f); tips.push(P2.pts[P2.pts.length - 1]); if (P2.inFront !== front) return; tail(c, P2.pts, P2.w, t, P2.a * k, tl.seed); const tip = P2.pts[P2.pts.length - 1]; if (tl.lash > 0 && tl.lash < 1) H.core(c, tip[0], tip[1], T * 0.22, P.yel, P.wht, 0.9); }); if (front) f.tips = tips; },
      drawUnder(c, f, X, Y, T, t) {
        const k = Math.min(1, f.life / 0.8), mx = H.sx(me.x), my = H.sy(me.y), unf = cl(f.t / 0.6), [cx, cy, hx, hy] = petBox(T);
        // the sigil on the floor under the pet and the back light of the halo behind it
        c.save(); c.globalAlpha = k * unf; K.floorLight(c, mx, my, T * 1.8, 0.5); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.6); c.lineWidth = 2.5; H.floorEllipse(c, mx, my, T * 1.15); c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.7); c.lineWidth = 1.2; H.floorEllipse(c, mx, my, T * 0.95); c.stroke();
        for (let i = 0; i < N; i++) { const b = -Math.PI / 2 + i / N * TAU + t * 0.4; c.beginPath(); c.moveTo(mx + Math.cos(b) * T * 0.95, my + Math.sin(b) * T * 0.95 * H.GY); c.lineTo(mx + Math.cos(b) * T * 1.3, my + Math.sin(b) * T * 1.3 * H.GY); c.stroke(); } c.restore();
        // the halo ring itself, behind the pet
        if (f.t < LANCE + 1) { const ha = k * unf * (f.t > LANCE ? 1 - cl((f.t - LANCE) / 1) : 1); K.glow(c, cx, cy, T * 1.5, P.org, 0.45 * ha); c.save(); c.globalAlpha = ha; c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.75); c.lineWidth = T * 0.12; c.beginPath(); c.ellipse(cx, cy, hx * 1.04, hy, 0, 0, TAU); c.stroke(); c.strokeStyle = H.rgba(P.yel, 0.9); c.lineWidth = T * 0.04; c.stroke(); c.restore(); }
        // the ember paths the lashes leave, curving out from the halo
        for (const tl of tails) { if (tl.lash < 1) continue; const age = f.t - tl.t0 - 0.22, heat = Math.max(0.1, 1 - age / 1.8), SX = H.sx(tl.spot[0]), SY = H.sy(tl.spot[1]), r0 = [mx + Math.cos(tl.th) * T * 0.8, my + Math.sin(tl.th) * T * 0.8 * H.GY]; channel(c, bez(r0, [lerp(r0[0], SX, 0.5) + Math.cos(a + Math.PI / 2) * tl.s * T * 1.1, lerp(r0[1], SY, 0.5) + Math.sin(a + Math.PI / 2) * tl.s * T * 0.6], [SX, SY], 10), T * 0.12, heat, k * 0.8 * Math.min(1, 0.35 + heat), t); K.scorch(c, SX, SY, T * 1.1 * cl(age / 0.2), k * 0.85, heat, tl.seed); K.shockRing(c, SX, SY, T * 1.4 * H.ease.out(cl(age / 0.3)), 1 - cl(age / 0.35)); }
        // the lance's burnt track
        if (f.t > LANCE) { const u = cl((f.t - LANCE) / 0.3), heat = Math.max(0.12, 1 - (f.t - LANCE) / 1.3), pts = []; for (let j = 0; j <= 12; j++) { const d = 0.9 + (L - 0.9) * u * j / 12; pts.push([H.sx(me.x + Math.cos(a) * d), H.sy(me.y + Math.sin(a) * d)]); } channel(c, pts, T * 0.55, heat, k, t); }
        if (FIN && f.t > FIN) { const a2 = f.t - FIN; K.shockRing(c, mx, my, T * 3.4 * H.ease.out(cl(a2 / 0.45)), 1 - cl(a2 / 0.5)); }
        f.drawTails(c, f, T, t, false);
      },
      draw(c, f, X, Y, T, t) {
        const k = Math.min(1, f.life / 0.6); c.globalAlpha = k; petHole(c, T); f.drawTails(c, f, T, t, true);
        const [cx, cy, hx, hy] = petBox(T), braid = f.t > BRAID ? cl((f.t - BRAID) / (LANCE - BRAID)) : 0, lance = f.t > LANCE ? cl((f.t - LANCE) / 0.25) : 0, after = f.t > LANCE + 0.3 ? cl((f.t - LANCE - 0.3) / 1.0) : 0;
        // the braid's gathering heart in front of the halo, then the lance: a spear of flame along the aim
        if (braid > 0 && after < 1) { const ax = Math.cos(sa), ay = Math.sin(sa), bx = cx + ax * hx * 1.3, by = cy + ay * hy * 1.3, Lz = T * (1.2 + L * 0.85 * (0.25 + 0.75 * braid));
          ball(c, bx + ax * T * 0.2, by + ay * T * 0.2, T * (0.25 + 0.2 * braid) * (1 - after), t, 5, 1 - after);
          if (lance > 0 && after < 0.7) { const fa = 1 - cl(after / 0.7); c.save(); c.translate(bx, by); c.rotate(sa); H.ray(c, 0, 0, 0, Lz, T * 1.3 * fa, P.org, 0.65 * fa); H.ray(c, 0, 0, 0, Lz, T * 0.45 * fa, P.wht, 0.85 * fa); c.restore();
            ball(c, bx + ax * Lz, by + ay * Lz, T * 0.55 * fa * lance, t, 8, fa); for (let i = 0; i < 4; i++) flameAtS(c, bx + ax * Lz, by + ay * Lz, sa + Math.PI + (i - 1.5) * 0.35, T * 0.35 * fa, T * (1.2 + 0.3 * Math.sin(t * 11 + i)) * fa * lance, t, i * 2, fa); shimmer(c, bx + ax * Lz * 0.6, by + ay * Lz * 0.6, T * 1.5, T * 1.2, t, fa); } }
        // Celestial: the halo bursts outward as a ring of fire
        if (FIN && f.t > FIN && f.t < FIN + 0.7) { const u = (f.t - FIN) / 0.7; ringS(c, H.sx(me.x), H.sy(me.y), T * 3.2 * H.ease.out(u), H.Q() < 1 ? 10 : 16, T * (1.0 - u * 0.5), t, 1 - u * 0.85, t * 0.2); }
      } });
    const tailD = DK * 1.2 * 9 / N * 0.85, lanceD = DK * (FIN ? 4.4 : 5.0);
    tails.forEach(tl => H.X.after(tl.t0 + 0.22, () => { H.hitArea(tl.spot[0], tl.spot[1], 1.35, tailD, C.dmgO({ kb: 2, burn: 1 })); H.X.ring(tl.spot[0], tl.spot[1], 0.2, 1.3, 0.3, P.org, 0.45); K.embers(tl.spot[0], tl.spot[1], 8, { v: 3 }); K.sparks(tl.spot[0], tl.spot[1], 7); K.flakes(tl.spot[0], tl.spot[1], 3); K.smoke(tl.spot[0], tl.spot[1], 2, 0.4); H.X.light(tl.spot[0], tl.spot[1], 2, 0.2); H.X.shake(3, 0.1); H.X.sfx.whoosh(); }));
    H.X.after(LANCE, () => { H.hitLine(me.x, me.y, a, L + 0.4, 2.2, lanceD, C.dmgO({ kb: 7, burn: 1, stun: 0.5 })); const ex = me.x + Math.cos(a) * L * 0.8, ey = me.y + Math.sin(a) * L * 0.8; impact(ex, ey, 2.4, 2.2); H.X.flash(0.3, '#FFE0B0'); for (let i = 0; i < 4; i++) fireAt(C, me.x + Math.cos(a) * (1.5 + i * 1.6), me.y + Math.sin(a) * (1.5 + i * 1.6), 1.0, 2.2, 0.5); for (let j = 0; j < H.n(24); j++) H.P({ kind: 'petal', x: me.x + Math.cos(a) * Math.random() * L, y: me.y + Math.sin(a) * Math.random() * L - 1 - Math.random(), vx: (Math.random() - 0.5), vy: -0.6 - Math.random() * 0.6, life: 1.4, max: 1.4, size: 4, rot: Math.random() * 6, vr: 3, color: j % 2 ? P.org : P.gold }); H.X.sfx.crash(); H.X.hitstop(0.08); });
    if (FIN) H.X.after(FIN, () => { H.hitRing(me.x, me.y, 0.6, 3.3, DK * 0.9, C.dmgO({ kb: 4, burn: 1 })); for (let j = 0; j < H.n(18); j++) { const b = j / 18 * TAU; K.embers(me.x + Math.cos(b) * 2.5, me.y + Math.sin(b) * 2.5 * H.GY, 1); } H.X.flash(0.15, '#FFD9A0'); H.X.shake(6, 0.15); H.X.sfx.crash(); });
  };

  /* a paper banner of flame: a folded sheet (a lit facet and a shaded facet meeting on a crease), translucent, its top edge charring
     away by burn (0..1) with flames along the burning edge, a dark rod at the top. At screen (X, Y) its foot, w wide, hh tall */
  function banner(c, X, Y, w, hh, lean, burn, t, seed, a) {
    c.save(); c.translate(X, Y); c.globalAlpha = a; c.transform(1, 0, lean, 1, 0, 0); const wav = Math.sin(t * 4 + seed) * w * 0.12, wav2 = Math.cos(t * 3.1 + seed) * w * 0.08;
    const L = [[-w / 2, 0], [-w / 2 + wav, -hh * 0.5], [-w / 2 - wav * 0.5, -hh]], M = [[wav2, w * 0.18], [wav2 * 0.5, -hh * 0.5], [0, -hh - w * 0.1]], R = [[w / 2, 0], [w / 2 + wav, -hh * 0.5], [w / 2 - wav * 0.5, -hh]];
    K.glow(c, 0, -hh * 0.5, w * 1.3, P.org, 0.35);
    const face = (A, B, cols, al) => { const pts = A.concat(B.slice().reverse()); const g = c.createLinearGradient(A[0][0], 0, B[0][0], -hh); g.addColorStop(0, H.rgba(cols[0], al)); g.addColorStop(0.5, H.rgba(cols[1], al)); g.addColorStop(1, H.rgba(cols[2], al)); H.poly(c, pts); c.fillStyle = g; c.fill(); return pts; };
    // burning from the top down: everything above the ragged burning edge is gone
    const bh = hh * burn * 0.85, edge = []; for (let i = 0; i <= 6; i++) edge.push([-w / 2 - w * 0.1 + w * 1.2 * i / 6, -hh + bh * (0.75 + 0.35 * Math.abs(Math.sin(i * 2.3 + seed + t * 2))) - (burn > 0 ? 0 : w)]);
    c.save(); if (burn > 0) { c.beginPath(); c.moveTo(-w * 2, w * 2); c.lineTo(-w * 2, edge[0][1]); for (const p of edge) c.lineTo(p[0], p[1]); c.lineTo(w * 2, edge[6][1]); c.lineTo(w * 2, w * 2); c.closePath(); c.clip(); }
    const lp = face(L, M, [P.yel, P.amb, P.org], 0.82), rp = face(M, R, [P.org, P.red, P.dred], 0.82);
    // ink-like flame sigils on the paper, glowing
    c.save(); H.poly(c, lp); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.wht, 0.55); c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-w * 0.4, -hh * (0.2 + i * 0.28) + wav); c.quadraticCurveTo(-w * 0.2, -hh * (0.28 + i * 0.28), 0, -hh * (0.22 + i * 0.28)); c.stroke(); } c.restore();
    c.save(); H.poly(c, rp); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.35); c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(0, -hh * (0.24 + i * 0.28)); c.quadraticCurveTo(w * 0.2, -hh * (0.18 + i * 0.28), w * 0.42, -hh * (0.26 + i * 0.28) - wav); c.stroke(); } c.restore();
    // the crease catches the light; the outline
    c.strokeStyle = H.rgba(P.wht, 0.85); c.lineWidth = 1.5; H.poly(c, M, false); c.stroke(); c.strokeStyle = H.rgba(P.dred, 0.95); c.lineWidth = 1.4; H.poly(c, L.concat(R.slice().reverse())); c.stroke();
    if (burn > 0) { // the charred, glowing margin along the burning edge
      c.save(); H.poly(c, L.concat(R.slice().reverse())); c.clip(); c.strokeStyle = H.rgba(P.char, 0.95); c.lineWidth = Math.max(2, w * 0.12); H.poly(c, edge, false); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.95); c.lineWidth = Math.max(1, w * 0.05); H.poly(c, edge.map(p => [p[0], p[1] + w * 0.07]), false); c.stroke(); c.restore(); }
    c.restore();
    if (burn > 0) { if (burn < 0.97) for (let i = 0; i < 3; i++) { const p = edge[1 + i * 2]; K.flame(c, p[0], p[1] + w * 0.04, w * 0.26, hh * (0.22 + 0.06 * Math.sin(t * 12 + i + seed)) * (1 - burn * 0.5), t, i + seed, 0, 0.95, true); } }
    else { c.fillStyle = P.char; c.fillRect(-w / 2 - 3, -hh - 4, w + 6, 4); c.strokeStyle = H.line(); c.lineWidth = 1; c.strokeRect(-w / 2 - 3, -hh - 4, w + 6, 4); }
    c.restore();
  }
  // F-U10 World of Paper Flames: folded flame sheets unfold into floating banners round the aim (each a lit and a shaded facet on a
  // crease, glowing sigils, its edge burning down from the top), turn and sweep across the monsters in arcs of flame; the
  // rest fold into one brilliant faceted origami star, which bursts into dozens of slow, curling scraps of burning paper.
  // Evolution: 3 banners at Hatchling to 8 at Celestial on a wider ring; the star grows points; at Celestial the scraps flare
  // in a second ring of fire as they fall.
  U.paperflames = (C, h) => {
    H = h; K = FK.bind(H); const x = C.tx, y = C.ty, ev = K.evo(C), DK = C.base * C.K * K.evoK(C), R = (2.7 + 0.1 * (ev - 1)) * C.K, N = K.evoN(C, 3, 8), STEP = 1.8 / N, sheets = [], near = Math.hypot(H.me.x - x, H.me.y - y) < R + 2, SP = 4 + Math.round((ev - 1) / 2), FIN = ev >= 7;
    for (let i = 0; i < N; i++) sheets.push({ b: i / N * TAU + 0.3, swp: 0, t0: 1.0 + i * STEP, burn: 0 });
    const FOLD = 1.0 + N * STEP + 0.05, BURST = FOLD + 0.6; H.warn(x, y, R + 0.5, 1.0, C.col); H.X.banner('WORLD OF PAPER FLAMES', '', C.col, 1.4); H.X.sfx.hum();
    const scraps = []; // burning paper fragments after the burst (drawn, not particles: they curl and char)
    H.add({ life: BURST + 1.9, x, y, rot: 0, fold: 0,
      update(dt, f) { f.rot += dt * 0.7; f.fold = f.t > FOLD ? cl((f.t - FOLD) / 0.5) : 0; sheets.forEach((s, i) => { s.swp = cl((f.t - s.t0) / 0.3); s.burn = cl((f.t - 0.8 - i * 0.12) / 2.8); });
        if (f.t < BURST) { for (const s of sheets) { const b = s.b + f.rot; if (Math.random() < 0.6) K.aura(x + Math.cos(b) * R * (1 - f.fold), y + Math.sin(b) * R * H.GY * (1 - f.fold), 0.3, dt, 6, 1.4); } }
        for (const p of scraps) { p.vx *= 1 - dt * 1.3; p.vy = p.vy * (1 - dt * 1.3) + dt * 1.6; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); p.vz -= dt * 1.0; p.r += p.vr * dt; p.life -= dt; if (Math.random() < 0.06 * H.Q()) H.P({ kind: 'ember', x: p.x, y: p.y - p.z, vx: 0, vy: -1, g: -1, life: 0.4, max: 0.4, size: 2.5, color: P.yel }); } },
      drawUnder(c, f, X, Y, T, t) { const k = H.fade(f, 0.4, 0.7);
        c.save(); c.globalAlpha = 0.6 * k * (1 - f.fold); K.floorLight(c, X, Y, T * (R + 0.6), 0.35); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.org, 0.7); c.lineWidth = 2; c.setLineDash([T * 0.25, T * 0.2]); c.lineDashOffset = f.rot * T * 2; H.floorEllipse(c, X, Y, T * R); c.stroke(); c.setLineDash([]); c.strokeStyle = H.rgba(P.yel, 0.5); c.lineWidth = 1.2; c.beginPath(); for (let i = 0; i < N; i++) { const b = i / N * TAU + f.rot * 0.5, b2 = (i + 1) / N * TAU + f.rot * 0.5; c.moveTo(X + Math.cos(b) * T * R, Y + Math.sin(b) * T * R * H.GY); c.lineTo(X + Math.cos(b2) * T * R * 0.55, Y + Math.sin(b2) * T * R * 0.55 * H.GY); } c.stroke(); c.restore();
        for (const s of sheets) { if (s.swp <= 0) continue; const a2 = f.t - s.t0 - 0.15; if (a2 > 0) { const b = s.b + f.rot * 0.8, bx = X + Math.cos(b) * T * R * 0.3, by = Y + Math.sin(b) * T * R * 0.3 * H.GY; K.scorch(c, bx, by, T * 0.8, k * 0.6, Math.max(0.1, 1 - a2 / 1.4), s.b * 5); } }
        if (f.t > BURST) { const a2 = f.t - BURST; K.scorch(c, X, Y, T * R * 0.8 * cl(a2 / 0.3), k, Math.max(0.1, 1 - a2 / 1.3), 2); K.shockRing(c, X, Y, T * (R + 0.6) * H.ease.out(cl(a2 / 0.45)), 1 - cl(a2 / 0.5)); if (FIN && a2 > 0.45) K.shockRing(c, X, Y, T * (R + 1.8) * H.ease.out(cl((a2 - 0.45) / 0.45)), 1 - cl((a2 - 0.45) / 0.5)); }
        for (const p of scraps) if (p.life > 0) K.floorLight(c, H.sx(p.x), H.sy(p.y), T * 0.35, 0.25 * cl(p.life));
      },
      draw(c, f, X, Y, T, t) { const k = Math.min(1, f.life / 0.7), unf = H.ease.back(cl(f.t / 0.9)), burst = f.t > BURST ? cl((f.t - BURST) / 0.35) : 0; c.globalAlpha = k; if (near) petHole(c, T);
        const items = []; sheets.forEach((s, i) => { if (burst > 0) return; const b = s.b + f.rot, swing = s.swp > 0 && s.swp < 1 ? Math.sin(s.swp * Math.PI) : 0, rr = T * R * Math.max(0, unf) * (1 - swing * 0.8) * (1 - f.fold), bx = X + Math.cos(b) * rr, by = Y + Math.sin(b) * rr * H.GY, z = T * (0.35 + 0.3 * Math.sin(t * 1.5 + i)) * (1 - f.fold) + f.fold * T * 1.4, hh = T * (1.7 + 0.05 * ev) * cl(unf) * (1 - f.fold * 0.5), w = T * 0.85 * cl(unf) * (1 - f.fold * 0.4), turn = Math.cos(b + t * 0.8);
          items.push({ y: by, d() { H.softShadow(c, bx, by, w * 0.7, 0.18 * (1 - f.fold)); K.floorLight(c, bx, by, w * 1.2, 0.3 * (1 - f.fold));
            if (swing > 0) { const pts = []; for (let j = 0; j <= 8; j++) { const u = j / 8, bb = b - u * 1.0, r2 = T * R * (1 - Math.sin(Math.max(0, s.swp - u * 0.2) * Math.PI) * 0.8); pts.push([X + Math.cos(bb) * r2, Y + Math.sin(bb) * r2 * H.GY - z - hh * 0.4]); } streak(c, pts.reverse(), hh * 0.24, t, 0.85 * swing, u => 0.3 + 0.7 * u, i, 3); }
            c.save(); c.translate(bx, by - z); c.rotate(f.fold * Math.cos(b) * 0.9); c.scale(0.55 + 0.45 * Math.abs(turn), 1); banner(c, 0, 0, w, hh, Math.cos(b) * 0.25 * (1 - f.fold) - Math.cos(b) * swing * 0.6, s.burn, t, i * 1.3, 1); c.restore(); } }); });
        items.sort((p, q) => p.y - q.y).forEach(it => it.d());
        // the folded star: an origami star of lit and shaded paper facets, white-hot, which bursts
        if (f.fold > 0 && burst < 1) { const cy = Y - T * 1.6, s = T * (0.9 + 0.06 * ev) * H.ease.back(f.fold) * (1 + burst * 1.5), al = 1 - burst; K.glow(c, X, cy, s * 2.4, P.amb, 0.6 * al); facetStar(c, X, cy, s, s * 0.42, SP, t * 1.2, RAMP_HOT, al, 1); facetStar(c, X, cy, s * 0.55, s * 0.22, SP, -t * 1.8 + 0.3, [P.wht, P.wht, P.yel, P.amb], al * 0.9, 1); shimmer(c, X, cy - s, s * 1.5, T * 1.2, t, al); }
        // the scraps: curling quads of paper, a glowing burning edge, charring as they fall
        for (const p of scraps) { if (p.life <= 0) continue; const SX = H.sx(p.x), SY = H.sy(p.y) - p.z * T, al = cl(p.life / 0.6), char = cl(1 - p.life / p.max * 1.2), cw = Math.cos(p.r * 1.7); c.save(); c.globalAlpha = k * al; c.translate(SX, SY); c.rotate(p.r); c.scale(1, 0.25 + 0.75 * Math.abs(cw)); const sz = p.s * T;
          c.fillStyle = cw > 0 ? H.mix(P.amb, P.char, char) : H.mix(P.red, P.char, char); c.beginPath(); c.moveTo(-sz, -sz * 0.6); c.lineTo(sz * 0.8, -sz * 0.8); c.lineTo(sz, sz * 0.5); c.lineTo(-sz * 0.7, sz * 0.7); c.closePath(); c.fill(); c.strokeStyle = H.rgba(P.char, 0.8); c.lineWidth = 1; c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(P.yel, 0.9 * (1 - char * 0.5)); c.lineWidth = 1.5; c.beginPath(); c.moveTo(sz * 0.8, -sz * 0.8); c.lineTo(sz, sz * 0.5); c.lineTo(-sz * 0.7, sz * 0.7); c.stroke(); c.restore(); if (p.fl) K.flame(c, SX, SY, sz * 0.9, sz * 2.2 * al, t, p.r, 0, al * 0.9, true); }
      } });
    const sweepD = DK * 1.4 * 6 / N, burstD = DK * (FIN ? 4.0 : 4.8);
    sheets.forEach((s, i) => H.X.after(s.t0 + 0.15, () => { const b = s.b + 0.7 * (s.t0 + 0.15), bx = x + Math.cos(b) * R, by = y + Math.sin(b) * R, ang = Math.atan2(y - by, x - bx); H.hitCone(bx, by, ang, R * 2.2, 0.42, sweepD, C.dmgO({ kb: 2, burn: 1 })); for (let j = 0; j < H.n(10); j++) { const d = Math.random() * R * 1.8; H.P({ kind: 'ember', x: bx + Math.cos(ang) * d, y: by + Math.sin(ang) * d - 0.5, vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random(), g: -1, life: 0.6, max: 0.6, size: 4, color: j % 2 ? P.org : P.yel }); } K.sparks(x, y, 5, 5); H.X.light(x, y, R, 0.2); H.X.shake(3, 0.1); H.X.sfx.whoosh(); }));
    H.X.after(BURST - 0.4, () => H.warn(x, y, R + 0.5, 0.4, C.col));
    H.X.after(BURST, () => { H.hitArea(x, y, R + 0.6, burstD, C.dmgO({ kb: 6, burn: 1, stun: 0.5 })); K.blast(x, y, R * 0.8, 2.4); H.X.ring(x, y, 0.3, R + 0.6, 0.5, P.yel, 0.5); H.X.flash(0.35, '#FFF0D0'); fireAt(C, x, y, 1.6, 3, 0.7); K.flakes(x, y, 10);
      const ns = H.n(36); for (let j = 0; j < ns; j++) { const b = Math.random() * TAU, v = 1.5 + Math.random() * 3; scraps.push({ x: x + (Math.random() - 0.5) * 0.6, y: y + (Math.random() - 0.5) * 0.4, z: 1.6 + (Math.random() - 0.5) * 0.6, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6, vz: 0.6 + Math.random() * 1.2, r: Math.random() * TAU, vr: (Math.random() - 0.5) * 5, s: 0.1 + Math.random() * 0.1, life: 1.3 + Math.random() * 0.6, max: 1.9, fl: j % 6 === 0 }); }
      for (let j = 0; j < H.n(24); j++) { const b = Math.random() * TAU, v = 1.5 + Math.random() * 3; H.P({ kind: 'petal', x: x + (Math.random() - 0.5), y: y - 1.6 + (Math.random() - 0.5), vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6 - 1.5, g: 1.6, drag: 1.5, life: 1.6 + Math.random() * 0.6, max: 2.0, size: 4 + Math.random() * 3, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8, color: j % 3 === 0 ? P.char : j % 3 === 1 ? P.org : P.gold }); }
      H.X.sfx.crash(); H.X.hitstop(0.08); });
    if (FIN) H.X.after(BURST + 0.45, () => { H.hitRing(x, y, R, R + 1.8, DK * 0.8, C.dmgO({ kb: 3, burn: 1 })); H.X.ring(x, y, R, R + 1.8, 0.4, P.org, 0.5); for (let j = 0; j < H.n(16); j++) { const b = j / 16 * TAU; K.embers(x + Math.cos(b) * (R + 1), y + Math.sin(b) * (R + 1) * H.GY, 1); K.sparks(x + Math.cos(b) * (R + 1), y + Math.sin(b) * (R + 1) * H.GY, 1, 4); } H.X.shake(5, 0.12); H.X.sfx.crash(); });
  };
})();
