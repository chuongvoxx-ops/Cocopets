/* ---------- the toon kit: a cartoon shader for the last fiends of the tower ----------
   Where the beast kits paint soft lit volumes with textures, this one paints like an animated film: a flat body colour,
   one hard shadow band on the side away from the light, one hard highlight band toward it, a bold dark outline, and a
   glossy blob of specular. The bands are true crescents (the shape minus itself shifted), so they follow any outline:
   an ellipse, a tentacle, a flipper. Shapes are still placed in three dimensions with the same camera as the beasts,
   so a creature turns and its arms rise and fall; only the way light lands on it is different. */
const FiendToon = (() => {
  const TAU = Math.PI * 2, lerp = (a, b, u) => a + (b - a) * u;
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const sh = (h, k) => DunFiend.KIT.sh(h, k);
  /* ---- paths: functions that add a subpath to the current path (no beginPath), so they can be combined ---- */
  const ell = (x, y, rx, ry, rot) => c => c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU);
  const poly = pts => c => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
  /* a smooth closed blob through points */
  const blob = pts => c => { const n = pts.length, P = i => pts[((i % n) + n) % n]; c.moveTo(P(0)[0], P(0)[1]); for (let i = 0; i < n; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); } c.closePath(); };
  /* a smooth open ribbon of width wf(u) along points: a tentacle, a flipper's edge, a fluke */
  function ribbonPts(pts, wf) {
    const N = pts.length - 1, L = [], R = [];
    for (let i = 0; i <= N; i++) { const p = pts[i], q = pts[Math.min(N, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, w = wf(i / N) / 2; L.push([p[0] - dy / d * w, p[1] + dx / d * w]); R.push([p[0] + dy / d * w, p[1] - dx / d * w]); }
    return { L, R };
  }
  const ribbon = (pts, wf) => { const { L, R } = ribbonPts(pts, wf); const all = L.concat(R.slice().reverse()); return c => { c.moveTo(all[0][0], all[0][1]); for (let i = 1; i < all.length; i++) { const p0 = all[i - 1], p1 = all[i], p2 = all[Math.min(all.length - 1, i + 1)]; c.quadraticCurveTo(p1[0], p1[1], (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2); } c.closePath(); }; };
  /* ---- the shader ---- */
  /* o: col, shade, hi, line, lw, r (size, for the band widths), lx/ly (light direction), d1/d2 (band widths as a
     fraction of r), spec (0..1 or false), specAt [x, y], inner(c) painted inside the clip, alpha, glowCol/glowA (an inner
     emissive wash along the far edge, for furnace tissue and lit throats) */
  function shape(c, path, o) {
    o = o || {}; const col = o.col || '#C07040', shade = o.shade || sh(col, -0.3), hi = o.hi || sh(col, 0.28), line = o.line || sh(col, -0.72), r = o.r || 20;
    let lx = o.lx == null ? -0.55 : o.lx, ly = o.ly == null ? -0.8 : o.ly; const ll = Math.hypot(lx, ly) || 1; lx /= ll; ly /= ll;
    const d2 = r * (o.d2 == null ? 0.26 : o.d2), d1 = r * (o.d1 == null ? 0.13 : o.d1), q = DunFiend.KIT.qq();
    c.save(); if (o.alpha != null) c.globalAlpha = o.alpha;
    c.beginPath(); path(c); c.fillStyle = col; c.fill();
    if (q >= 1 || o.force) {
      c.save(); c.beginPath(); path(c); c.clip();
      // the shadow band: the shape minus itself moved toward the light. At full quality the deeper band below covers it
      // wholly (on any shape without a hollow in its side), so it is only painted when that band is not
      const deep = o.shade2 !== false && q >= 2;
      if (!deep) { c.beginPath(); path(c); c.save(); c.translate(lx * d2, ly * d2); path(c); c.restore(); c.fillStyle = shade; c.fill('evenodd'); }
      // a second, deeper band at the very edge
      if (deep) { c.beginPath(); path(c); c.save(); c.translate(lx * d2 * 1.9, ly * d2 * 1.9); path(c); c.restore(); c.fillStyle = o.shade2 || sh(shade, -0.22); c.fill('evenodd'); }
      // the highlight band: the shape minus itself moved away from the light
      if (o.hi !== false) { c.beginPath(); path(c); c.save(); c.translate(-lx * d1, -ly * d1); path(c); c.restore(); c.fillStyle = hi; c.fill('evenodd'); }
      if (o.glowCol) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = o.glowA == null ? 0.5 : o.glowA; c.beginPath(); path(c); c.save(); c.translate(lx * d2 * 1.2, ly * d2 * 1.2); path(c); c.restore(); c.fillStyle = o.glowCol; c.fill('evenodd'); c.restore(); }
      if (o.inner) o.inner(c);
      c.restore();
    } else if (o.inner) {
      // at the lowest quality the shading bands go, but a shape's painted detail (scutes, plates, markings) always stays
      c.save(); c.beginPath(); path(c); c.clip(); o.inner(c); c.restore();
    }
    // a hit flash: the shape blinks pale for a frame
    if (DunFiend.KIT.Q.flash > 0 && !o.noFlash) { c.beginPath(); path(c); c.fillStyle = 'rgba(255,244,236,.16)'; c.fill(); }
    if (o.line !== false) { c.beginPath(); path(c); c.lineWidth = o.lw || Math.max(1.2, r * 0.07); c.strokeStyle = line; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
    if (o.spec) { const sa = o.specAt; if (sa) spec(c, sa[0], sa[1], r * (o.specR || 0.16), o.specRot == null ? -0.7 : o.specRot, typeof o.spec === 'number' ? o.spec : 0.85); }
    c.restore();
  }
  /* many small shapes in one style (a shell's scutes, a hide's plates), shaded as shape() shades one but painted
     together: a fill per colour, one for all the shadow bands, one for the highlights and one stroke for every outline,
     rather than five apiece. A band is the shape less the part of it its shifted copy covers, worked out as polygons
     (so no clip is needed); the shapes must not overlap. list: [{ pts, col, r }]; o: shade, hi, line, lw, d1, d2, lx, ly */
  function clipTo(S, C) {
    let A = 0; for (let i = 0; i < C.length; i++) { const a = C[i], b = C[(i + 1) % C.length]; A += a[0] * b[1] - b[0] * a[1]; }
    const sg = A >= 0 ? 1 : -1; let out = S;
    for (let i = 0; i < C.length && out.length; i++) {
      const a = C[i], b = C[(i + 1) % C.length], ex = b[0] - a[0], ey = b[1] - a[1], inp = out, side = p => (ex * (p[1] - a[1]) - ey * (p[0] - a[0])) * sg; out = [];
      for (let j = 0; j < inp.length; j++) { const p = inp[j], q = inp[(j + 1) % inp.length], sp = side(p), sq = side(q); if (sp >= 0) out.push(p); if ((sp >= 0) !== (sq >= 0)) { const u = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]); } }
    }
    return out;
  }
  function plates(c, list, o) {
    if (!list.length) return;
    let lx = o.lx == null ? -0.55 : o.lx, ly = o.ly == null ? -0.8 : o.ly; const ll = Math.hypot(lx, ly) || 1; lx /= ll; ly /= ll;
    const q = DunFiend.KIT.qq(), by = new Map(), moved = (P, k) => P.map(p => [p[0] + lx * k, p[1] + ly * k]);
    list.forEach(s => { if (!by.has(s.col)) by.set(s.col, []); by.get(s.col).push(s); });
    c.save();
    const X = o.skip || {};
    if (!X.base) by.forEach((L, col) => { c.beginPath(); L.forEach(s => blob(s.pts)(c)); c.fillStyle = col; c.fill(); });
    if ((q >= 1 || o.force) && !X.band) {
      const band = (k, col) => { c.beginPath(); list.forEach(s => { const keep = clipTo(s.pts, moved(s.pts, s.r * k)); poly(s.pts)(c); if (keep.length > 2) poly(keep)(c); }); c.fillStyle = col; c.fill('evenodd'); };
      band(o.d2 == null ? 0.26 : o.d2, o.shade);
      if (o.hi !== false) band(-(o.d1 == null ? 0.13 : o.d1), o.hi);
    }
    if (o.line !== false && !X.line) { c.beginPath(); list.forEach(s => blob(s.pts)(c)); c.lineWidth = o.lw || 1.5; c.strokeStyle = o.line; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
    c.restore();
  }
  /* the glossy blob: a tilted white lozenge and a smaller dot */
  function spec(c, x, y, r, rot, a) { c.save(); c.translate(x, y); c.rotate(rot || -0.7); c.fillStyle = `rgba(255,255,255,${a == null ? 0.85 : a})`; c.beginPath(); c.ellipse(0, 0, r, r * 0.45, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(r * 1.5, r * 0.5, r * 0.28, 0, TAU); c.fill(); c.restore(); }
  /* a tube along points, toon-shaded; the bands run along the side away from the light */
  function tube(c, pts, wf, o) { if (pts.length < 2) return; shape(c, ribbon(pts, wf), Object.assign({ r: wf(0) }, o)); }
  /* a tube shaded as tube() shades it, but with no clip: its bands are strips laid inside its two edges, each as wide as
     shape()'s shifted copy would uncover there (the shadow along the edge turned from the light, the highlight along the
     edge turned to it), so the whole tube is four calls rather than a clip and its bands. For the many thin tubes of a
     creature (tentacles, bands of light); one with painted detail inside it (o.inner) goes to tube() */
  const smoothClosed = all => c => { c.moveTo(all[0][0], all[0][1]); for (let i = 1; i < all.length; i++) { const p1 = all[i], p2 = all[Math.min(all.length - 1, i + 1)]; c.quadraticCurveTo(p1[0], p1[1], (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2); } c.closePath(); };
  function tubeLite(c, pts, wf, o) {
    if (pts.length < 2) return; o = o || {};
    if (o.inner) return tube(c, pts, wf, o);
    // (its outline made once, as a path to fill, flash and stroke)
    const { L, R } = ribbonPts(pts, wf), n = L.length, path = new Path2D(); smoothClosed(L.concat(R.slice().reverse()))(path);
    const col = o.col || '#C07040', shade = o.shade || sh(col, -0.3), hi = o.hi || sh(col, 0.28), line = o.line || sh(col, -0.72), r = o.r || wf(0), q = DunFiend.KIT.qq();
    let lx = o.lx == null ? -0.55 : o.lx, ly = o.ly == null ? -0.8 : o.ly; const ll = Math.hypot(lx, ly) || 1; lx /= ll; ly /= ll;
    const deep = o.shade2 !== false && q >= 2, d2 = r * (o.d2 == null ? 0.26 : o.d2), d1 = r * (o.d1 == null ? 0.13 : o.d1);
    c.save(); if (o.alpha != null) c.globalAlpha = o.alpha;
    c.fillStyle = col; c.fill(path);
    if (q >= 1 || o.force) {
      // per point: the left edge's outward normal, the tube's width there, and how squarely that edge faces the light
      const N = [], W = [], D = []; for (let i = 0; i < n; i++) { const dx = L[i][0] - R[i][0], dy = L[i][1] - R[i][1], w = Math.hypot(dx, dy) || 1e-6; N.push([dx / w, dy / w]); W.push(w); D.push((dx * lx + dy * ly) / w); }
      // the strip inside one edge (s 1 the left, -1 the right): k wide where that edge faces the light squarely (sg 1) or
      // faces from it (sg -1), narrowing as it turns side-on. An edge that nowhere faces that way has no strip at all (it
      // would be a sliver of no width, which paints nothing but still costs its outline), so it is left out
      const strip = (s, k, sg) => { const E = s > 0 ? L : R, out = [], inn = []; let any = false; for (let i = 0; i < n; i++) { const t = Math.min(W[i] * 0.98, k * Math.max(0, sg * s * D[i])); if (t > 0) any = true; out.push(E[i]); inn.push([E[i][0] - N[i][0] * s * t, E[i][1] - N[i][1] * s * t]); } return any ? out.concat(inn.reverse()) : null; };
      const bands = (k, sg, fill) => { const a = strip(1, k, sg), b = strip(-1, k, sg); if (!a && !b) return; c.beginPath(); if (a) smoothClosed(a)(c); if (b) smoothClosed(b)(c); c.fillStyle = fill; c.fill(); };
      bands(deep ? d2 * 1.9 : d2, -1, deep ? (o.shade2 || sh(shade, -0.22)) : shade);
      if (o.hi !== false) bands(d1, 1, hi);
      if (o.glowCol) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= o.glowA == null ? 0.5 : o.glowA; bands(d2 * 1.2, -1, o.glowCol); c.restore(); }
    }
    if (DunFiend.KIT.Q.flash > 0 && !o.noFlash) { c.fillStyle = 'rgba(255,244,236,.16)'; c.fill(path); }
    if (o.line !== false) { c.lineWidth = o.lw || Math.max(1.2, r * 0.07); c.strokeStyle = line; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(path); }
    if (o.spec && o.specAt) spec(c, o.specAt[0], o.specAt[1], r * (o.specR || 0.16), o.specRot == null ? -0.7 : o.specRot, typeof o.spec === 'number' ? o.spec : 0.85);
    c.restore();
  }
  /* rings of suckers down the underside of a tentacle: pale cups with a dark stone ring, two rows, shrinking to the tip */
  function suckers(c, pts, wf, o) {
    o = o || {}; const N = pts.length - 1, n = o.n || 9, cup = o.cup || '#F6DDB8', ring = o.ring || '#4A2A1E', q = DunFiend.KIT.qq();
    for (let i = 1; i <= n; i++) { const u = (o.u0 || 0.1) + (i / n) * ((o.u1 || 0.95) - (o.u0 || 0.1)), k = u * N, j = Math.min(N - 1, Math.floor(k)), e = k - j, p = pts[j], p2 = pts[j + 1], x = lerp(p[0], p2[0], e), y = lerp(p[1], p2[1], e), dx = p2[0] - p[0], dy = p2[1] - p[1], d = Math.hypot(dx, dy) || 1, w = wf(u);
      for (const s of (w > 6 && q >= 1 ? [-1, 1] : [0])) { const cx = x - dy / d * w * 0.22 * s, cy = y + dx / d * w * 0.22 * s, rr = w * (s ? 0.17 : 0.24) * (1 - u * 0.25);
        if (rr < 1.2) continue; c.fillStyle = ring; c.beginPath(); c.arc(cx, cy, rr, 0, TAU); c.fill(); c.fillStyle = cup; c.beginPath(); c.arc(cx, cy, rr * 0.66, 0, TAU); c.fill(); c.fillStyle = rgba(ring, 0.55); c.beginPath(); c.arc(cx, cy, rr * 0.3, 0, TAU); c.fill(); }
    }
  }
  /* drips hanging from an edge: teardrops, some falling */
  function drips(c, pts, col, s, t, seed) {
    const R = mulberry32(seed || 5); c.fillStyle = col;
    pts.forEach((p, i) => { const L = s * (0.4 + R() * 0.8), w = s * (0.1 + R() * 0.08), ph = (t * (0.3 + R() * 0.3) + R()) % 1; c.beginPath(); c.moveTo(p[0] - w, p[1]); c.quadraticCurveTo(p[0] - w, p[1] + L * 0.7, p[0], p[1] + L); c.quadraticCurveTo(p[0] + w, p[1] + L * 0.7, p[0] + w, p[1]); c.closePath(); c.fill(); if (ph > 0.6) { const fy = p[1] + L + (ph - 0.6) / 0.4 * s * 1.2; c.beginPath(); c.arc(p[0], fy, w * 0.9, 0, TAU); c.fill(); } });
  }
  /* a big cartoon eye: white, a wide iris, a pupil that looks somewhere, two catchlights; lids close with blink 0..1 */
  function eye(c, x, y, r, o) {
    o = o || {}; const iris = o.iris || '#F2A51F', look = o.look || [0, 0], blink = o.blink || 0, lid = o.lid || '#B8602A', line = o.line || '#2A1410', rot = o.rot || 0, ry = r * (o.squash || 0.85);
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = o.white || '#FFF6E6'; c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.clip();
    const ix = look[0] * r * 0.35, iy = look[1] * ry * 0.35, ir = r * (o.irisR || 0.62);
    c.fillStyle = sh(iris, -0.35); c.beginPath(); c.ellipse(ix, iy, ir, ir, 0, 0, TAU); c.fill();
    c.fillStyle = iris; c.beginPath(); c.ellipse(ix, iy + ir * 0.12, ir * 0.88, ir * 0.8, 0, 0, TAU); c.fill();
    c.fillStyle = o.pupil || '#120806'; const pr = ir * (o.pupilR || 0.5); c.beginPath(); c.ellipse(ix, iy, pr * (o.slit ? 0.4 : 1), pr * (o.slit ? 1.25 : 1), 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(ix - ir * 0.35, iy - ir * 0.38, ir * 0.22, ir * 0.16, -0.5, 0, TAU); c.fill(); c.beginPath(); c.arc(ix + ir * 0.3, iy + ir * 0.3, ir * 0.09, 0, TAU); c.fill();
    // the top lid, shading the eye, and the blink
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, -ry * 0.75, r * 1.1, ry * 0.4, 0, 0, TAU); c.fill();
    if (blink > 0) { c.fillStyle = lid; c.fillRect(-r * 1.2, -ry * 1.2, r * 2.4, ry * 1.2 + ry * (blink * 2 - 1) * 1.0); c.fillRect(-r * 1.2, ry * 1.2 - ry * 1.2 * blink, r * 2.4, ry * 1.2 * blink); }
    c.restore();
    c.lineWidth = Math.max(1.2, r * 0.1); c.strokeStyle = line; c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.stroke();
    if (o.brow) { c.lineWidth = Math.max(1.5, r * 0.16); c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.9, -ry * 1.15 + o.brow * ry * 0.2); c.quadraticCurveTo(0, -ry * 1.5 - o.brow * ry * 0.3, r * 0.95, -ry * 1.1 - o.brow * ry * 0.2); c.stroke(); }
    c.restore();
  }
  /* a soft shadow under something that flies or looms, scaled with its height */
  function groundShadow(c, X, Y, rx, ry, z, a) { const k = 1 / (1 + (z || 0) * 0.15); c.save(); c.fillStyle = `rgba(10,6,4,${(a == null ? 0.4 : a) * k})`; c.beginPath(); c.ellipse(X, Y, rx * k, ry * k, 0, 0, TAU); c.fill(); c.restore(); }
  /* stars and sparkles: a four-point twinkle */
  function twinkle(c, x, y, r, col, a) { c.save(); c.globalAlpha = a == null ? 1 : a; c.fillStyle = col || '#FFFFFF'; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); c.restore(); }
  /* the camera and body frame shared with the beasts */
  const cam = (X, Y, T, m) => (x, y, z) => [X + (x - m.x) * T, Y + (y - m.y) * T - (z || 0) * T];
  const frame = (m, th) => { const fx = Math.cos(th), fy = Math.sin(th); return { fx, fy, w: (u, v, z) => [m.x + fx * u - fy * v, m.y + fy * u + fx * v, z || 0] }; };
  /* an ellipsoid as a toon shape: the screen ellipse of (half-axes a along th, b across, cz up) at world g */
  function ellipsoid(c, P3, th, g, A, o) { const K = DunFiend.KIT, [ex, ey, rot] = K.ell3(A[0], A[1], A[2], th), p = P3(g[0], g[1], g[2]), T = o.T; shape(c, ell(p[0], p[1], ex * T, ey * T, rot), Object.assign({ r: Math.max(ex, ey) * T, specAt: [p[0] - ex * T * 0.35, p[1] - ey * T * 0.45] }, o)); return { p, rx: ex * T, ry: ey * T, rot }; }
  return { TAU, ell, poly, blob, ribbon, ribbonPts, shape, plates, clipTo, spec, tube, tubeLite, suckers, drips, eye, groundShadow, twinkle, cam, frame, ellipsoid, rgba, sh };
})();
