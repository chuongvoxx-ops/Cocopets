/* ---------- Anima 3D: cel-shaded models with real limbs ----------
   Each Anima is built from 3D parts (oriented ellipsoids, capsule limbs, flat fins and decals for eyes) posed by a rig:
   legs swing from the hip and bend at the knee, heads turn and nod, tails and wings follow through. Every part is
   projected by a small orthographic camera pitched down a little, sorted far to near and painted cel-shaded: a flat
   fill, a shadow band, a highlight band, an ink outline and a glossy blob. Turning round is a real turn in 3D.
   Everything is drawn straight onto the target canvas, so nothing is clipped by an offscreen box.
   Model space: f forward, s across, h up; one unit is size / 110 px; the feet stand on h = 0. */
const Anima3D = (() => {
  const TAU = Math.PI * 2, INK = '#1E1428';
  const sh = (h, k) => shadeC(h, k);
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const lerp = (a, b, u) => a + (b - a) * u, clamp01 = v => Math.max(0, Math.min(1, v));
  const PITCH = 0.38, CP = Math.cos(PITCH), SP = Math.sin(PITCH);
  let R = null;   // the render in progress
  /* ---- the camera ---- */
  const mw = (f, s, h) => [f * R.sy + s * R.cy, -f * R.cy + s * R.sy, h];
  const proj = w => [R.x + w[0] * R.u, R.y - (w[2] * CP + w[1] * SP) * R.u, w[1] * CP - w[2] * SP];
  const P = p => proj(mw(p[0], p[1], p[2]));
  const dirS = v => { const w = mw(v[0], v[1], v[2]); return [w[0] * R.u, -(w[2] * CP + w[1] * SP) * R.u, w[1] * CP - w[2] * SP]; };
  /* ---- vectors ---- */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const mix3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  /* a part's own axes: turned (yaw about up), tipped (pitch about its side) and rolled (about its forward) */
  function basis(yaw, pitch, roll) {
    const cy = Math.cos(yaw || 0), sy = Math.sin(yaw || 0), cp = Math.cos(pitch || 0), sp = Math.sin(pitch || 0), cr = Math.cos(roll || 0), sr = Math.sin(roll || 0);
    let F = [cy, sy, 0], S = [-sy, cy, 0], H = [0, 0, 1];
    const F2 = add(mul(F, cp), mul(H, sp)), H2 = add(mul(F, -sp), mul(H, cp)); F = F2; H = H2;
    const S2 = add(mul(S, cr), mul(H, sr)), H3 = add(mul(S, -sr), mul(H, cr)); return [F, S2, H3];
  }
  // rotate a model point about the vertical axis through o by a, or about a horizontal side axis by p
  const rotH = (p, o, a) => { const c = Math.cos(a), s = Math.sin(a), x = p[0] - o[0], y = p[1] - o[1]; return [o[0] + x * c - y * s, o[1] + x * s + y * c, p[2]]; };
  const rotS = (p, o, a) => { const c = Math.cos(a), s = Math.sin(a), x = p[0] - o[0], z = p[2] - o[2]; return [o[0] + x * c - z * s, p[1], o[2] + x * s + z * c]; };
  /* ---- the cel shader ---- */
  const LX = -0.55, LY = -0.83;
  function toon(c, path, o) {
    const col = o.col, shade = o.shade || sh(col, -0.3), hi = o.hi === false ? null : (o.hi || sh(col, 0.3)), line = o.line || sh(col, -0.72), r = o.r || 10;
    const d2 = r * (o.d2 == null ? 0.3 : o.d2), d1 = r * (o.d1 == null ? 0.14 : o.d1);
    c.save(); c.globalAlpha = R.alpha * (o.alpha == null ? 1 : o.alpha);
    c.beginPath(); path(c); c.fillStyle = col; c.fill();
    if (!o.flat) {
      c.save(); c.beginPath(); path(c); c.clip();
      c.beginPath(); path(c); c.save(); c.translate(LX * d2, LY * d2); path(c); c.restore(); c.fillStyle = shade; c.fill('evenodd');
      if (o.shade2 !== false) { c.beginPath(); path(c); c.save(); c.translate(LX * d2 * 1.8, LY * d2 * 1.8); path(c); c.restore(); c.fillStyle = o.shade2 || sh(shade, -0.2); c.fill('evenodd'); }
      if (hi) { c.beginPath(); path(c); c.save(); c.translate(-LX * d1, -LY * d1); path(c); c.restore(); c.fillStyle = hi; c.fill('evenodd'); }
      if (o.glowCol) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= o.glowA == null ? 0.5 : o.glowA; c.beginPath(); path(c); c.save(); c.translate(LX * d2 * 1.1, LY * d2 * 1.1); path(c); c.restore(); c.fillStyle = o.glowCol; c.fill('evenodd'); c.restore(); }
      if (o.inner) o.inner(c);
      c.restore();
    }
    if (o.line !== false) { c.beginPath(); path(c); c.lineWidth = o.lw || Math.max(1, R.u * 1.5); c.strokeStyle = line; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
    if (o.spec && o.specAt) { c.save(); c.translate(o.specAt[0], o.specAt[1]); c.rotate(-0.7); c.fillStyle = `rgba(255,255,255,${typeof o.spec === 'number' ? o.spec : 0.8})`; const sr = r * (o.specR || 0.17); c.beginPath(); c.ellipse(0, 0, sr, sr * 0.45, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(sr * 1.5, sr * 0.55, sr * 0.28, 0, TAU); c.fill(); c.restore(); }
    c.restore();
  }
  /* ---- parts ---- */
  const push = it => { R.items.push(it); return it; };
  // an ellipsoid: centre, half-axes along its own forward / side / up, colours and style
  function ell(c3, ax, o) {
    o = o || {}; const B = o.B || basis(o.yaw, o.pitch, o.roll), v = [dirS(mul(B[0], ax[0])), dirS(mul(B[1], ax[1])), dirS(mul(B[2], ax[2]))];
    const sxx = v[0][0] ** 2 + v[1][0] ** 2 + v[2][0] ** 2, sxy = v[0][0] * v[0][1] + v[1][0] * v[1][1] + v[2][0] * v[2][1], syy = v[0][1] ** 2 + v[1][1] ** 2 + v[2][1] ** 2;
    const tr = sxx + syy, det = sxx * syy - sxy * sxy, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det)), rx = Math.sqrt(tr / 2 + disc), ry = Math.sqrt(Math.max(1e-6, tr / 2 - disc)), rot = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const p = P(c3), r = Math.min(rx, ry);
    if (rx - ry < 0.6 && !o.inner && !o.glowCol && o.sprite !== false) return push({ d: p[2] + (o.z || 0), draw: c => sphereSprite(c, p[0], p[1], (rx + ry) / 2, o), p, rx, ry });
    return push({ d: p[2] + (o.z || 0), draw: c => toon(c, g => g.ellipse(p[0], p[1], Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU), Object.assign({ r, specAt: [p[0] - r * 0.38 - (rx - r) * 0.2, p[1] - r * 0.45] }, o)), p, rx, ry });
  }
  /* round parts look the same from every side, so each is painted once into a sprite and stamped */
  const SPR = new Map();
  function sphereSprite(c, x, y, r, o) {
    const tr = c.getTransform(), sc = Math.max(0.5, Math.hypot(tr.a, tr.b)), rr = Math.max(1, Math.round(r * sc * 2) / 2), lw = (o.lw || Math.max(1, R.u * 1.5)) * sc;
    const key = `${o.col}|${o.shade}|${o.hi}|${o.line}|${rr}|${o.spec || 0}|${Math.round(lw * 2)}|${o.d1}|${o.d2}|${o.flat ? 1 : 0}`;
    let cv = SPR.get(key);
    if (!cv) { const pad = Math.ceil(lw + 2), S = Math.ceil(rr * 2 + pad * 2); cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'), a0 = R.alpha; R.alpha = 1;
      try { toon(g, gg => gg.arc(S / 2, S / 2, rr, 0, TAU), Object.assign({}, o, { r: rr, lw, alpha: 1, specAt: [S / 2 - rr * 0.38, S / 2 - rr * 0.45] })); } finally { R.alpha = a0; }
      if (SPR.size > 600) SPR.clear(); SPR.set(key, cv); }
    c.save(); c.globalAlpha = R.alpha * (o.alpha == null ? 1 : o.alpha); c.drawImage(cv, x - cv.width / (2 * sc), y - cv.height / (2 * sc), cv.width / sc, cv.height / sc); c.restore();
  }
  const sphere = (c3, r, o) => ell(c3, [r, r, r], o);
  // a capsule along model points, radius rf(u) (u 0..1 along it)
  function capsulePath(sp, w) {
    const n = sp.length - 1, L = [], Rt = [];
    for (let i = 0; i <= n; i++) { const a = sp[Math.max(0, i - 1)], b = sp[Math.min(n, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy); if (d < 1e-3) { dx = 1; dy = 0; } else { dx /= d; dy /= d; } L.push([sp[i][0] - dy * w[i], sp[i][1] + dx * w[i], dx, dy]); Rt.push([sp[i][0] + dy * w[i], sp[i][1] - dx * w[i]]); }
    const out = L.map(p => [p[0], p[1]]);
    const cap = (i, dir) => { const [dx, dy] = [L[i][2] * dir, L[i][3] * dir], a0 = Math.atan2(dx, -dy); for (let k = 1; k < 8; k++) { const a = a0 - k / 8 * Math.PI; out.push([sp[i][0] + Math.cos(a) * w[i], sp[i][1] + Math.sin(a) * w[i]]); } };
    cap(n, 1); for (let i = n; i >= 0; i--) out.push(Rt[i]); cap(0, -1);
    return c => { c.moveTo((out[0][0] + out[out.length - 1][0]) / 2, (out[0][1] + out[out.length - 1][1]) / 2); for (let i = 0; i < out.length; i++) { const p = out[i], q = out[(i + 1) % out.length]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } c.closePath(); };
  }
  function tube(pts, rf, o) {
    o = o || {}; const sp = pts.map(P), n = pts.length - 1, w = pts.map((p, i) => Math.max(0.4, rf(n ? i / n : 0) * R.u)), d = sp.reduce((a, p) => a + p[2], 0) / sp.length;
    const r = Math.max(...w); return push({ d: d + (o.z || 0), draw: c => toon(c, capsulePath(sp, w), Object.assign({ r, d2: 0.4, d1: 0.2, spec: false }, o)), sp });
  }
  // a flat or shaped polygon through model points (fins, ears, petals), smoothed
  function blob(pts, o) {
    o = o || {}; const sp = pts.map(P), d = sp.reduce((a, p) => a + p[2], 0) / sp.length, xs = sp.map(p => p[0]), ys = sp.map(p => p[1]), r = Math.max(2, Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2);
    const path = o.sharp ? c => { c.moveTo(sp[0][0], sp[0][1]); for (let i = 1; i < sp.length; i++) c.lineTo(sp[i][0], sp[i][1]); c.closePath(); } : c => { const n = sp.length; c.moveTo((sp[0][0] + sp[n - 1][0]) / 2, (sp[0][1] + sp[n - 1][1]) / 2); for (let i = 0; i < n; i++) { const p = sp[i], q = sp[(i + 1) % n]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } c.closePath(); };
    return push({ d: d + (o.z || 0), draw: c => toon(c, path, Object.assign({ r, spec: false }, o)), sp });
  }
  // a custom painter at a depth, given the projected anchor
  function decal(c3, fn, z) { const p = P(c3); return push({ d: p[2] + (z || 0), draw: c => { c.save(); c.globalAlpha = R.alpha; fn(c, p); c.restore(); } }); }
  // a frame on a surface (centre, outward normal): screen vectors of its side and up, and how much it faces us
  function surfFrame(c3, n3, r) {
    n3 = norm(n3); let up = sub([0, 0, 1], mul(n3, n3[2])); if (Math.hypot(...up) < 1e-3) up = [1, 0, 0]; up = norm(up); const side = cross(up, n3);
    let ex = dirS(mul(side, r)), ey = dirS(mul(up, -r)); if (ex[0] < 0) ex = mul(ex, -1);
    const nd = dirS(n3)[2]; return { ex, ey, face: -nd };
  }
  // a big cartoon eye on a surface: white, iris, pupil, two catchlights, lids; it turns with the head
  function eye(c3, n3, r, o) {
    o = o || {}; const F = surfFrame(c3, n3, r); if (F.face < -0.05) return null;
    return decal(c3, (c, p) => {
      c.transform(F.ex[0] / r, F.ex[1] / r, F.ey[0] / r, F.ey[1] / r, p[0], p[1]);
      const ry = r * (o.tall || 1.08), bl = o.blink || 0, look = o.look || [0.15, 0.1], iris = o.iris || '#4A8AE0', lw = Math.max(1, R.u * (o.lw || 1.3)) * r / Math.max(1e-3, Math.hypot(F.ex[0], F.ex[1]));
      if (bl > 0.8) { c.strokeStyle = o.line || INK; c.lineWidth = lw * 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.95, 0); c.quadraticCurveTo(0, ry * 0.55, r * 0.95, 0); c.stroke(); return; }
      c.save(); c.scale(1, 1 - bl * 0.9);
      c.fillStyle = o.white || '#FFFFFF'; c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.clip();
      const ix = look[0] * r * 0.32, iy = look[1] * ry * 0.3 + ry * 0.06, ir = r * (o.irisR || 0.7);
      c.fillStyle = sh(iris, -0.4); c.beginPath(); c.ellipse(ix, iy, ir, ir * 1.06, 0, 0, TAU); c.fill();
      const g = c.createRadialGradient(ix, iy + ir * 0.35, ir * 0.1, ix, iy, ir); g.addColorStop(0, sh(iris, 0.55)); g.addColorStop(0.6, iris); g.addColorStop(1, sh(iris, -0.25)); c.fillStyle = g; c.beginPath(); c.ellipse(ix, iy + ir * 0.06, ir * 0.9, ir * 0.94, 0, 0, TAU); c.fill();
      c.fillStyle = o.pupil || '#120818'; const pr = ir * (o.pupilR || 0.48); c.beginPath(); c.ellipse(ix, iy, pr * (o.slit ? 0.38 : 1), pr * (o.slit ? 1.3 : 1.05), 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0, -ry * 0.82, r * 1.2, ry * 0.42, 0, 0, TAU); c.fill();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(ix - ir * 0.36, iy - ir * 0.4, ir * 0.3, ir * 0.22, -0.5, 0, TAU); c.fill(); c.beginPath(); c.arc(ix + ir * 0.34, iy + ir * 0.34, ir * 0.12, 0, TAU); c.fill();
      if (o.lid) { c.fillStyle = o.lidCol || '#3A3040'; c.beginPath(); c.moveTo(-r * 1.2, -ry * (1 - o.lid * 1.2)); c.lineTo(r * 1.2, -ry * (1 - o.lid * 2.4)); c.lineTo(r * 1.2, -ry * 1.3); c.lineTo(-r * 1.2, -ry * 1.3); c.closePath(); c.fill(); }
      c.restore();
      c.strokeStyle = o.line || INK; c.lineWidth = lw; c.beginPath(); c.ellipse(0, 0, r, ry, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.lineWidth = lw * 0.5; c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.stroke();
      if (o.lid) { c.lineWidth = lw; c.beginPath(); c.moveTo(-r * 1.02, -ry * (1 - o.lid * 1.2) * 0.96); c.lineTo(r * 1.0, -ry * (1 - o.lid * 2.4) * 0.96); c.stroke(); }
      if (o.lash) { c.lineWidth = lw * 0.9; c.lineCap = 'round'; c.beginPath(); c.moveTo(r * 0.85, -ry * 0.55); c.quadraticCurveTo(r * 1.25, -ry * 0.75, r * 1.35, -ry * 1.05); c.stroke(); }
      c.restore();
    }, (o.z || 0) - 0.5);
  }
  // a flat mark painted on a surface (blush, mouth, nose, star): fn draws in a frame where the surface's side is x and up is -y
  function mark(c3, n3, r, fn, z) { const F = surfFrame(c3, n3, r); if (F.face < 0.02) return null; return decal(c3, (c, p) => { c.transform(F.ex[0] / r, F.ex[1] / r, F.ey[0] / r, F.ey[1] / r, p[0], p[1]); fn(c, r, F.face); }, (z || 0) - 0.4); }
  // glows and flames: drawn after the body ('back' ones before it)
  const fx = (fn, back) => (back ? R.back : R.fx).push(fn);
  function glowAt(c3, r, col, a, back) { fx(c => { const p = P(c3), s = r * R.u; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = R.alpha * (a == null ? 0.6 : a); blitSized(c, glowSprite(col), p[0] - s, p[1] - s, s * 2, s * 2); c.restore(); }, back); }
  // a cartoon flame licking up from a model point: outer, middle and white-hot core, flickering
  function flame(c3, w, h, seed, cols, o) {
    o = o || {}; const p = P(c3), t = R.t, fl = 0.8 + 0.2 * Math.sin(t * 11 + seed * 3.1) + 0.1 * Math.sin(t * 23 + seed), lean = Math.sin(t * 4 + seed) * 0.25 + (o.lean || 0);
    const draw = c => { const W = w * R.u, H = h * R.u * fl; [[1, cols[0]], [0.66, cols[1]], [0.36, cols[2]]].forEach(([k, col], li) => { c.fillStyle = col; c.strokeStyle = li ? 'rgba(0,0,0,0)' : (o.line || '#8A1A1A'); c.lineWidth = Math.max(1, R.u * 1.2); c.beginPath(); c.moveTo(p[0] - W * k, p[1]); c.bezierCurveTo(p[0] - W * k * 1.1, p[1] - H * k * 0.5, p[0] + lean * W - W * k * 0.2, p[1] - H * k * 0.75, p[0] + lean * W * 1.6, p[1] - H * k); c.bezierCurveTo(p[0] + lean * W + W * k * 0.3, p[1] - H * k * 0.7, p[0] + W * k * 1.1, p[1] - H * k * 0.45, p[0] + W * k, p[1]); c.quadraticCurveTo(p[0], p[1] + W * k * 0.7, p[0] - W * k, p[1]); if (!li && o.line !== false) c.stroke(); c.fill(); }); };
    if (o.depth) push({ d: p[2] + (o.z || 0), draw: c => { c.save(); c.globalAlpha = R.alpha * (o.alpha || 1); draw(c); c.restore(); } });
    else fx(c => { c.save(); c.globalAlpha = R.alpha * (o.alpha || 1); if (o.add) c.globalCompositeOperation = 'lighter'; draw(c); c.restore(); }, o.back);
  }
  /* ---- shared limbs ---- */
  // a leg from the hip: it swings by `swing` (radians, forward positive), its foot lifts by `lift`, the knee bends forward
  // (kneeDir +1, front legs) or back (-1, hind legs); planted feet stay on the ground
  function leg(hip, len, swing, lift, kneeDir, rT, rS, o) {
    const foot = [hip[0] + Math.sin(swing) * len * 0.9, hip[1], lift];
    const mid = [lerp(hip[0], foot[0], 0.5) + kneeDir * (1.5 + lift * 0.5) * (o.knee == null ? 1 : o.knee), hip[1], lerp(hip[2], foot[2], 0.52)];
    tube([hip, mid], u => lerp(rT, (rT + rS) / 2, u), o); tube([mid, foot], u => lerp((rT + rS) / 2, rS, u), o);
    return foot;
  }
  /* ---- drawing ---- */
  const MODELS = {};
  function has(id) { return !!MODELS[id]; }
  function draw(c, id, k, x, y, size, t, o) {
    o = o || {}; const fk = o.fk != null ? o.fk : (o.flip ? -1 : 1), yaw = (o.yaw != null ? o.yaw : fk * (MODELS[id].yaw || 0.72)) + (o.yawAdd || 0);
    R = { c, x, y, u: size / 110, cy: Math.cos(yaw), sy: Math.sin(yaw), yaw, t, alpha: o.alpha == null ? 1 : o.alpha, items: [], fx: [], back: [], k };
    try {
      MODELS[id](k, t, o);
      R.back.forEach(f => f(c));
      R.items.sort((a, b) => b.d - a.d); R.items.forEach(it => it.draw(c));
      R.fx.forEach(f => f(c));
    } finally { R = null; }
  }
  /* the helpers a model can use */
  const H = { TAU, INK, sh, rgba, lerp, clamp01, add, sub, mul, dot, cross, norm, mix3, basis, rotH, rotS, ell, sphere, tube, blob, decal, eye, mark, fx, glowAt, flame, leg, P, get R() { return R; } };

  /* ================= the models ================= */

  /* Samael (Aries): a lamb of black wool with ember horns; the wool turns ash-grey, then burns white-hot as it ascends */
  const FIRE3 = ['#FF4A26', '#FFA43A', '#FFF2B0'], FIRE3R = ['#E8283C', '#FF7A3D', '#FFE9A0'];
  // points spread evenly over the upper part of a unit sphere (for wool, scales, feathers)
  const fib = (n, top, seed) => { const out = [], ga = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const z = 1 - (i + 0.5) / n * (1 + top), r = Math.sqrt(Math.max(0, 1 - z * z)), a = i * ga + (seed || 0); out.push([Math.cos(a) * r, Math.sin(a) * r, z]); } return out; };
  H.fib = fib;
  MODELS.aries = (k, t, o) => {
    const mv = clamp01(o.mv || 0), ph = o.ph || 0, atk = o.atk, s = [1.22, 1.36, 1.5][k - 1];
    const wool = ['#5A5064', '#A49CAE', '#FFF6EE'][k - 1], woolSh = ['#362E40', '#686076', '#F2B48E'][k - 1], woolHi = ['#827896', '#D2CADA', '#FFFFFF'][k - 1];
    const face = ['#3A3044', '#3A3044', '#33262E'][k - 1], faceSh = sh(face, -0.38), faceHi = sh(face, 0.4), ember = k === 3 ? '#FF3B2E' : '#FF8A3D', st = { line: INK };
    // the trot: diagonal pairs, the body riding up between strides
    const bob = (1 - Math.abs(Math.cos(ph))) * 2.6 * mv, hb = 27 * s + bob;
    let ff = 0, hp = 0; if (atk != null) { const wind = atk < 0.3 ? atk / 0.3 : atk < 0.42 ? 1 - (atk - 0.3) / 0.12 : 0, hit = atk < 0.3 ? 0 : atk < 0.5 ? (atk - 0.3) / 0.2 : 1 - (atk - 0.5) / 0.5; ff = (-5 * wind + 10 * hit) * (o.atkBig ? 1.5 : 1); hp = -0.22 * wind + 0.4 * hit; }
    const BL = 21 * s, BW = 17 * s, BH = 14 * s, body = [ff * 0.6, 0, hb];
    // legs: short dark legs with glossy hooves; front knees forward, hind knees back
    [[10, 7.5, 0, 1], [10, -7.5, Math.PI, 1], [-10, 7.5, Math.PI, -1], [-10, -7.5, 0, -1]].forEach(([lf, ls, off, kd]) => {
      const sw = Math.sin(ph + off) * 0.68 * mv, lift = Math.max(0, Math.cos(ph + off)) * 7.5 * mv, hip = [lf * s + ff * 0.5, ls * s, hb - BH * 0.45];
      const foot = leg(hip, hip[2], sw, lift, kd, 4.6 * s, 3.6 * s, { col: face, shade: faceSh, hi: faceHi, line: INK });
      ell([foot[0] + 1, foot[1], foot[2] + 1.6 * s], [3.9 * s, 3.3 * s, 2.3 * s], { col: '#1A141F', shade: '#0A070C', hi: '#5A5064', line: INK, spec: 0.55 });
      // only the forelegs burn: flames on the hind legs would be painted over the body
      if (k >= 2 && lf > 0) flame([foot[0] + 1, foot[1], foot[2] + 1.2], 2 + k * 0.5, 5 + k * 2.5, lf + ls, FIRE3R, { alpha: 0.95 });
    });
    // the body: a round core under a cloud of wool puffs spread evenly over it
    ell(body, [BL, BW, BH], { col: woolSh, shade: sh(woolSh, -0.3), hi: false, line: INK });
    fib(24, 0.5, 0.4).forEach((q, i) => { const pr = (7.4 + (i % 4) * 1.1) * s * (1 + 0.035 * Math.sin(t * 2.2 + i)); sphere([body[0] + q[0] * BL * 0.86, q[1] * BW * 0.86, body[2] + q[2] * BH * 0.8], pr, { col: wool, shade: woolSh, hi: woolHi, line: INK, d2: 0.36, d1: 0.16, spec: k === 3 && i % 3 === 0 ? 0.45 : false }); });
    sphere([body[0] - BL * 0.98, Math.sin(t * 7) * 2.4, body[2] + BH * 0.3], 5.4 * s, { col: wool, shade: woolSh, hi: woolHi, line: INK });
    // the head: big for a lamb, nodding with the stride and glancing about
    const hyaw = Math.sin(t * 0.8) * 0.2 * (1 - mv), hpitch = Math.sin(ph * 2) * 0.07 * mv + hp + Math.sin(t * 1.3) * 0.04, hr = 15 * s;
    const hc = [body[0] + BL * 0.9 + ff * 0.4, 0, hb + BH * 0.95 + Math.sin(ph * 2 + 0.6) * 1.3 * mv], HB = basis(hyaw, hpitch, Math.sin(t * 1.1) * 0.06);
    const at = (f, sd, h) => add(hc, add(add(mul(HB[0], f), mul(HB[1], sd)), mul(HB[2], h)));
    ell(hc, [hr * 0.95, hr * 0.94, hr * 0.9], { B: HB, col: face, shade: faceSh, hi: faceHi, line: INK, spec: 0.5 });
    // a crown of wool on the back of the head
    [[-0.35, 0, 0.62, 6.2], [-0.05, -0.42, 0.62, 5.2], [-0.05, 0.42, 0.62, 5.2], [-0.5, -0.45, 0.32, 4.8], [-0.5, 0.45, 0.32, 4.8], [0.2, 0, 0.8, 5]].forEach(([f, sd, h, r]) => sphere(at(f * hr, sd * hr, h * hr), r * s, { col: wool, shade: woolSh, hi: woolHi, line: INK }));
    // muzzle, nose, a small smile
    const mz = at(hr * 0.7, 0, -hr * 0.36); ell(mz, [hr * 0.4, hr * 0.48, hr * 0.32], { B: HB, col: faceHi, shade: face, hi: sh(faceHi, 0.25), line: INK, spec: 0.35 });
    mark(at(hr * 1.06, 0, -hr * 0.28), HB[0], 2.8 * s, (c, r) => { c.fillStyle = '#120C16'; c.beginPath(); c.moveTo(-r, -r * 0.5); c.quadraticCurveTo(0, -r * 0.9, r, -r * 0.5); c.quadraticCurveTo(r * 0.4, r * 0.7, 0, r * 0.7); c.quadraticCurveTo(-r * 0.4, r * 0.7, -r, -r * 0.5); c.fill(); c.strokeStyle = '#120C16'; c.lineWidth = r * 0.35; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.8, r * 1.6); c.quadraticCurveTo(0, r * 2.3, r * 0.8, r * 1.6); c.stroke(); if (k === 3) { c.fillStyle = '#FFFFFF'; [-1, 1].forEach(q => { c.beginPath(); c.moveTo(q * r * 0.55, r * 1.75); c.lineTo(q * r * 0.35, r * 2.6); c.lineTo(q * r * 0.15, r * 1.9); c.fill(); }); } });
    // floppy ears out to the sides, swinging as it trots
    [-1, 1].forEach(q => { const base = at(hr * 0.12, q * hr * 0.78, hr * 0.22), sw = Math.sin(ph * 2 + q) * 0.3 * mv + Math.sin(t * 1.7 + q) * 0.1, tip = at(hr * 0.05, q * hr * 1.75, -hr * 0.3 - sw * hr * 0.35);
      const mid = mix3(base, tip, 0.5), wv = mul(HB[0], hr * 0.34), wu = mul(HB[2], hr * 0.1);
      blob([base, add(mid, add(wv, wu)), tip, sub(mid, add(wv, wu))], { col: face, shade: faceSh, hi: faceHi, line: INK, z: -2 });
      blob([mix3(base, tip, 0.15), add(mid, mul(wv, 0.5)), mix3(base, tip, 0.82), sub(mid, mul(wv, 0.5))], { col: '#D8667F', shade: '#A84462', hi: false, line: false, z: -2.2 }); });
    // eyes: big and ember-bright, blinking
    [-1, 1].forEach(q => { const ep = at(hr * 0.66, q * hr * 0.4, hr * 0.05); eye(ep, sub(ep, at(-hr * 0.2, q * hr * 0.15, 0)), 5.4 * s, { iris: ember, blink: o.blink, look: [0.2, 0.15], lid: [0, 0.12, 0.26][k - 1], lidCol: face, irisR: 0.72 });
      const bp = at(hr * 0.56, q * hr * 0.68, -hr * 0.3); mark(bp, sub(bp, hc), 4 * s, (c, r) => { c.fillStyle = 'rgba(255,96,120,.55)'; c.beginPath(); c.ellipse(0, 0, r, r * 0.6, 0, 0, TAU); c.fill(); }); });
    // horns: ember nubs on the lamb; then ram horns curling back and down beside the head, veined with fire
    [-1, 1].forEach(q => {
      if (k === 1) { const b = at(hr * 0.22, q * hr * 0.42, hr * 0.78), tp = at(hr * 0.32, q * hr * 0.58, hr * 1.25); tube([b, mix3(b, tp, 0.5), tp], u => (3.6 - u * 2.8) * s, { col: '#FF8A4D', shade: '#D2552C', hi: '#FFD8A8', line: INK }); glowAt(tp, 7 * s, '#FF8A4D', 0.7); return; }
      const n = 22, turns = k === 3 ? 1.3 : 1.05, R0 = (k === 3 ? 0.54 : 0.44) * hr, C = [-0.4 * hr, q * 0.8 * hr, 0.28 * hr], pts = [];
      for (let i = 0; i <= n; i++) { const u = i / n, th = u * turns * TAU, rr = R0 * (1 - u * 0.62); pts.push(at(C[0] - Math.sin(th) * rr + 0.25 * hr * (1 - u), C[1] + q * u * hr * 0.42, C[2] + Math.cos(th) * rr)); }
      const hc2 = k === 2 ? '#8A2A3E' : '#2E2230', w0 = (k === 3 ? 6.4 : 5.2) * s;
      tube(pts, u => w0 * (1 - u * 0.7), { col: hc2, shade: sh(hc2, -0.42), hi: sh(hc2, 0.4), line: INK, glowCol: '#FF5A3C', glowA: k === 3 ? 0.55 : 0.35,
        inner: c => { c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = Math.max(1, R.u * 1.1); const sp = pts.map(P); for (let i = 1; i < n; i += 2) { const p = sp[i], q2 = sp[i + 1], dx = q2[0] - p[0], dy = q2[1] - p[1], d = Math.hypot(dx, dy) || 1, w = w0 * (1 - i / n * 0.7) * R.u; c.beginPath(); c.moveTo(p[0] - dy / d * w, p[1] + dx / d * w); c.lineTo(p[0] + dy / d * w, p[1] - dx / d * w); c.stroke(); } } });
      glowAt(pts[n], 5 * s, '#FF5A3C', 0.55);
    });
    if (k === 3) { const g = at(hr * 0.72, 0, hr * 0.55); sphere(g, 2.8 * s, { col: '#FF3B4E', shade: '#B01A30', hi: '#FFB0B8', line: INK, spec: 0.9, z: -1.5 }); glowAt(g, 11 * s, '#FF3B4E', 0.8); }
    // fire along its back as it grows, and a burning mane on the last form
    if (k >= 2) { const n = k === 3 ? 8 : 5; for (let i = 0; i < n; i++) { const u = (i / (n - 1) - 0.5) * 1.5, p = [body[0] + u * BL * 0.75 - BL * 0.1, Math.sin(i * 2.1) * BW * 0.2, body[2] + BH * 1.1 * (1 - u * u * 0.35)]; flame(p, 3.6 + k * 0.8, (k === 3 ? 20 : 11) * (1 - Math.abs(u) * 0.25), i * 1.9, FIRE3, { depth: true, z: 2 }); } }
    if (k === 3) for (let i = 0; i < 7; i++) { const a = (i / 6 - 0.5) * 2.6; flame(at(-hr * 0.45, Math.sin(a) * hr * 0.95, Math.cos(a) * hr * 0.9 + hr * 0.1), 3.4, 15, 10 + i, FIRE3, { back: true }); }
    glowAt([body[0], 0, body[2] + 6], (k === 3 ? 44 : 30) * s, k === 3 ? '#FF6A2A' : '#FF5A3C', k === 3 ? 0.3 : 0.12, true);
  };

  /* ---- more shared rigging ---- */
  // a head (or any part) with its own turn, nod and tilt: at(f, s, h) gives a point in its frame
  function frame(c3, yaw, pitch, roll) { const B = basis(yaw, pitch, roll); return { c: c3, B, at: (f, sd, h) => add(c3, add(add(mul(B[0], f), mul(B[1], sd)), mul(B[2], h))), dir: (f, sd, h) => add(add(mul(B[0], f), mul(B[1], sd)), mul(B[2], h)) }; }
  H.frame = frame;
  // a cubic curve through 3D control points, n+1 samples
  function bez3(a, b, c, d, n) { const out = []; for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; out.push([0, 1, 2].map(j => v * v * v * a[j] + 3 * v * v * u * b[j] + 3 * v * u * u * c[j] + u * u * u * d[j])); } return out; }
  H.bez3 = bez3;
  // four legs in a walk cycle: trot (diagonal pairs), stomp (slow, heavy), gallop (front pair then hind pair)
  function gait4(ph, mv, kind) {
    const off = kind === 'gallop' ? [0, 0.5, Math.PI, Math.PI + 0.5] : [0, Math.PI, Math.PI, 0], amp = kind === 'stomp' ? 0.45 : kind === 'gallop' ? 0.75 : 0.62, lift = kind === 'stomp' ? 5.5 : kind === 'gallop' ? 9 : 7;
    return off.map(o => ({ sw: Math.sin(ph + o) * amp * mv, lift: Math.max(0, Math.cos(ph + o)) * lift * mv }));
  }
  H.gait4 = gait4;
  // a strike curve: wind 0..1 while it gathers, hit 0..1..0 as it lands and recovers
  function strikeOf(atk, big) { if (atk == null) return { wind: 0, hit: 0 }; const wind = atk < 0.3 ? atk / 0.3 : atk < 0.42 ? 1 - (atk - 0.3) / 0.12 : 0, hit = atk < 0.3 ? 0 : atk < 0.5 ? (atk - 0.3) / 0.2 : 1 - (atk - 0.5) / 0.5; const k = big ? 1.5 : 1; return { wind: wind * k, hit: hit * k }; }
  H.strikeOf = strikeOf;
  // a feathered wing from a shoulder: an arm curving out to the tip with a fan of feathers hung from it. side is +1/-1
  // (which side of the body), span its length, flap rotates the whole wing about the body's long axis, spread opens it
  function wing(root, side, span, flap, spread, cols, o) {
    o = o || {}; const n = o.n || 7, rows = o.rows || 2, line = o.line || INK;
    const rot0 = d => { const c = Math.cos(flap), sn = Math.sin(flap); return [d[0], d[1] * c - d[2] * sn * side, d[1] * sn * side + d[2] * c]; }, rot = p => add(root, rot0(sub(p, root)));
    // the arm: up and out, then sweeping back toward the tip
    const elbow = [root[0] - span * 0.12, root[1] + side * span * 0.42, root[2] + span * (0.25 + spread * 0.2)], tip = [root[0] - span * (0.45 - spread * 0.15), root[1] + side * span * (0.7 + spread * 0.3), root[2] + span * (0.05 + spread * 0.45)];
    const arm = bez3(root, elbow, mix3(elbow, tip, 0.5), tip, 8).map(rot);
    for (let r = rows - 1; r >= 0; r--) for (let i = 0; i < n; i++) {
      const u = 0.2 + i / (n - 1) * 0.8, k2 = u * 8, j = Math.min(7, Math.floor(k2)), base = mix3(arm[j], arm[j + 1], k2 - j), len = span * (0.32 + u * 0.4) * (1 - r * 0.38), dn = [-(0.35 + u * 0.4) * len * 0.6, side * len * 0.12 * u, -len];
      const tipF = rot(add(base, mul(dn, 1))), wv = rot0([-len * 0.1, side * len * (o.fw || 0.17), 0]), b2 = rot(base), mid = mix3(b2, tipF, 0.55);
      const col = cols[Math.min(cols.length - 1, r + (u > 0.75 ? 1 : 0))];
      blob([add(b2, mul(wv, 1)), add(mid, mul(wv, 1.1)), tipF, sub(mid, mul(wv, 0.9)), sub(b2, mul(wv, 1))], { col, shade: sh(col, -0.28), hi: sh(col, 0.25), line, z: (o.z || 0) + r * 0.6 - u * 0.2 });
    }
    tube(arm, u => (o.armW || span * 0.1) * (1 - u * 0.6), { col: cols[0], shade: sh(cols[0], -0.25), hi: sh(cols[0], 0.3), line, z: (o.z || 0) - 1 });
    return { tip: arm[8], arm };
  }
  H.wing = wing;

  /* Belial (Taurus): a glossy black calf whose gold horns grow into a crown of ages, armoured in gold as it grows */
  MODELS.taurus = (k, t, o) => {
    const mv = clamp01(o.mv || 0), ph = o.ph || 0, s = [1.25, 1.38, 1.52][k - 1], S = strikeOf(o.atk, o.atkBig);
    const hide = '#2A2834', hideSh = '#15141C', hideHi = '#5E6090', gold = '#F2C65A', goldSh = '#B8862A', goldHi = '#FFF0B0', mz = '#5A5464';
    const ff = -5 * S.wind + 10 * S.hit, bob = (1 - Math.abs(Math.cos(ph))) * 1.8 * mv, hb = 25 * s + bob;
    const BL = 23 * s, BW = 18 * s, BH = 15 * s, body = [ff * 0.5, 0, hb], G = gait4(ph, mv, 'stomp');
    [[11, 8, 1], [11, -8, 1], [-11, 8, -1], [-11, -8, -1]].forEach(([lf, ls, kd], i) => {
      const hip = [lf * s + ff * 0.4, ls * s, hb - BH * 0.45], foot = leg(hip, hip[2], G[i].sw, G[i].lift, kd, 6.2 * s, 4.8 * s, { col: hide, shade: hideSh, hi: hideHi, line: INK });
      ell([foot[0] + 0.8, foot[1], foot[2] + 2 * s], [4.6 * s, 4.2 * s, 2.6 * s], { col: '#14121A', shade: '#08070C', hi: '#4A4860', line: INK, spec: 0.5 });
      if (k >= 2) ell([foot[0] + 0.5, foot[1], foot[2] + 4.4 * s], [4.4 * s, 4 * s, 1.1 * s], { col: gold, shade: goldSh, hi: goldHi, line: INK, spec: 0.6, z: -0.5 });
    });
    ell(add(body, [BL * 0.08, 0, BH * 0.12]), [BL * 1.02, BW, BH * 1.12], { col: hide, shade: hideSh, hi: hideHi, line: INK, spec: 0.75, specR: 0.14, pitch: -0.08 });
    // the tail: a rope with a tuft, swishing
    const tw = Math.sin(t * 2.4) * 4, tp = bez3([body[0] - BL * 0.92, 0, hb + BH * 0.4], [body[0] - BL * 1.3, tw * 0.5, hb + BH * 0.5], [body[0] - BL * 1.35, tw, hb - BH * 0.6], [body[0] - BL * 1.22, tw * 1.2, hb - BH * 1.2], 8);
    tube(tp, u => (2.2 - u * 0.8) * s, { col: hide, shade: hideSh, hi: hideHi, line: INK, z: 3 });
    sphere(tp[8], 3.8 * s, { col: '#121016', shade: '#060508', hi: '#3A3848', line: INK, z: 2.5 });
    if (k === 3) ell(sub(tp[8], [0, 0, -3 * s]), [3.2 * s, 3.2 * s, 1.2 * s], { col: gold, shade: goldSh, hi: goldHi, line: INK, spec: 0.6, z: 2 });
    // armour on the last form: a heart plate on the chest with a violet gem, gold pauldrons
    if (k === 3) { const cp = [body[0] + BL * 0.95, 0, hb + BH * 0.15]; mark(cp, [1, 0, 0.1], 11 * s, (c, r) => { c.fillStyle = gold; c.strokeStyle = INK; c.lineWidth = r * 0.08; c.beginPath(); c.moveTo(0, -r * 0.8); c.bezierCurveTo(r * 0.9, -r * 1.2, r * 1.2, 0, 0, r); c.bezierCurveTo(-r * 1.2, 0, -r * 0.9, -r * 1.2, 0, -r * 0.8); c.fill(); c.stroke(); c.fillStyle = goldSh; c.beginPath(); c.moveTo(0, -r * 0.5); c.bezierCurveTo(r * 0.5, -r * 0.75, r * 0.7, 0, 0, r * 0.6); c.bezierCurveTo(-r * 0.7, 0, -r * 0.5, -r * 0.75, 0, -r * 0.5); c.fill(); c.fillStyle = '#B983F5'; c.beginPath(); c.ellipse(0, -r * 0.05, r * 0.32, r * 0.38, 0, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(-r * 0.1, -r * 0.18, r * 0.1, r * 0.07, -0.5, 0, TAU); c.fill(); });
      [-1, 1].forEach(q => ell([body[0] + BL * 0.55, q * BW * 0.82, hb + BH * 0.75], [7 * s, 6 * s, 4.2 * s], { col: gold, shade: goldSh, hi: goldHi, line: INK, spec: 0.7 })); }
    // the head: broad, glossy, low on a thick neck; it lowers its head to charge
    const hr = 18 * s, F = frame([body[0] + BL * 1.0 + ff * 0.4, 0, hb + BH * 0.42 + Math.sin(ph * 2) * mv], Math.sin(t * 0.7) * 0.18 * (1 - mv), 0.08 + 0.35 * S.hit - 0.2 * S.wind + Math.sin(ph * 2) * 0.05 * mv, Math.sin(t * 1.1) * 0.04), at = F.at;
    ell(F.c, [hr * 0.9, hr * 0.98, hr * 0.85], { B: F.B, col: hide, shade: hideSh, hi: hideHi, line: INK, spec: 0.7 });
    ell(at(hr * 0.68, 0, -hr * 0.42), [hr * 0.46, hr * 0.66, hr * 0.42], { B: F.B, col: mz, shade: sh(mz, -0.3), hi: sh(mz, 0.3), line: INK, spec: 0.4 });
    [-1, 1].forEach(q => { mark(at(hr * 1.08, q * hr * 0.26, -hr * 0.42), F.B[0], 2.2 * s, (c, r) => { c.fillStyle = '#0E0C12'; c.beginPath(); c.ellipse(0, 0, r, r * 0.75, 0, 0, TAU); c.fill(); });
      // ears out to the sides
      const eb = at(-hr * 0.05, q * hr * 0.9, hr * 0.15), et = at(-hr * 0.25, q * hr * 1.6, hr * 0.05 + Math.sin(t * 2 + q) * hr * 0.08), em = mix3(eb, et, 0.5), wv = F.dir(0, 0, hr * 0.2);
      blob([eb, add(em, wv), et, sub(em, wv)], { col: hide, shade: hideSh, hi: hideHi, line: INK, z: -1.5 }); blob([mix3(eb, et, 0.2), add(em, mul(wv, 0.5)), mix3(eb, et, 0.8), sub(em, mul(wv, 0.5))], { col: '#B05A70', shade: '#803A50', hi: false, line: false, z: -1.7 });
      eye(at(hr * 0.62, q * hr * 0.42, hr * 0.12), F.dir(0.75, q * 0.62, 0.15), 4.8 * s, { iris: '#FFB347', blink: o.blink, lid: [0, 0.14, 0.22][k - 1], lidCol: hide, irisR: 0.74 });
      const bp = at(hr * 0.5, q * hr * 0.72, -hr * 0.2); mark(bp, F.dir(0.5, q * 0.85, -0.1), 3.6 * s, (c, r) => { c.fillStyle = 'rgba(255,138,168,.5)'; c.beginPath(); c.ellipse(0, 0, r, r * 0.6, 0, 0, TAU); c.fill(); });
      // gold horns: stubs, then a sweep up, then a great crown curving up and in
      const hl = [0.42, 0.78, 1.1][k - 1] * hr, b0 = at(-hr * 0.15, q * hr * 0.66, hr * 0.48), pts = bez3(b0, at(-hr * 0.3, q * (hr * 0.66 + hl * 0.65), hr * 0.45), at(-hr * 0.3, q * (hr * 0.66 + hl * 1.0), hr * 0.48 + hl * 0.4), at(-hr * 0.22, q * (hr * 0.66 + hl * (k === 3 ? 0.62 : 0.9)), hr * 0.48 + hl * [0.32, 0.75, 1.05][k - 1]), 10);
      tube(pts, u => [4.4, 5.4, 6.6][k - 1] * s * (1 - u * 0.78), { col: gold, shade: goldSh, hi: goldHi, line: INK, z: q > 0 ? -1 : -0.5,
        inner: k > 1 ? c => { c.strokeStyle = 'rgba(120,80,20,.55)'; c.lineWidth = Math.max(1, R.u); const sp = pts.map(P); for (let i = 1; i < 5; i++) { const p = sp[i], p2 = sp[i + 1], dx = p2[0] - p[0], dy = p2[1] - p[1], d = Math.hypot(dx, dy) || 1, w = 5 * s * R.u * (1 - i / 10 * 0.78); c.beginPath(); c.moveTo(p[0] - dy / d * w, p[1] + dx / d * w); c.lineTo(p[0] + dy / d * w, p[1] - dx / d * w); c.stroke(); } } : null });
    });
    // a tuft on the brow, a crest of gold, a violet gem; a nose ring on the bull
    for (let i = 0; i < 4; i++) sphere(at(hr * 0.35 - i * 0.12 * hr, (i - 1.5) * hr * 0.16, hr * 0.82), 3.4 * s, { col: '#16141C', shade: '#08070C', hi: '#3A3848', line: INK, z: -0.6 });
    if (k >= 2) { const cr = at(hr * 0.62, 0, hr * 0.62); mark(cr, F.dir(0.8, 0, 0.6), (k === 3 ? 7 : 5) * s, (c, r) => { c.fillStyle = gold; c.strokeStyle = INK; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(0, -r * 1.2); c.lineTo(r * 0.7, -r * 0.2); c.lineTo(r * (k === 3 ? 1.4 : 0.6), -r * 0.8); c.lineTo(r * 0.6, r * 0.6); c.lineTo(0, r * 0.9); c.lineTo(-r * 0.6, r * 0.6); c.lineTo(-r * (k === 3 ? 1.4 : 0.6), -r * 0.8); c.lineTo(-r * 0.7, -r * 0.2); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#B983F5'; c.beginPath(); c.ellipse(0, 0, r * 0.36, r * 0.42, 0, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-r * 0.1, -r * 0.14, r * 0.1, 0, TAU); c.fill(); }); glowAt(cr, 8 * s, '#D9B8FF', 0.5);
      const nr = at(hr * 1.1, 0, -hr * 0.66); mark(nr, F.B[0], 4 * s, (c, r) => { c.strokeStyle = gold; c.lineWidth = r * 0.42; c.beginPath(); c.arc(0, -r * 0.2, r, 0.3, Math.PI - 0.3); c.stroke(); }); }
    mark(at(hr * 1.06, 0, -hr * 0.68), F.B[0], 2.4 * s, (c, r) => { c.strokeStyle = '#0E0C12'; c.lineWidth = r * 0.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(0, r * 0.7, r, 0); c.stroke(); });
    if (k === 3) for (let i = 0; i < 3; i++) { const ph2 = (t * 0.6 + i / 3) % 1; [-1, 1].forEach(q => glowAt(at(hr * 1.2 + ph2 * 6, q * hr * (0.3 + ph2 * 0.3), -hr * 0.5 + ph2 * 3), (2 + ph2 * 5) * s, '#F0F0FF', 0.25 * (1 - ph2))); }
  };

  /* Raphael (Sagittarius): a star-dappled celestial horse. A wobbly foal with a comet mane grows into a courser in a starry
     saddle cloth with a moon-bow over its back, then a prancing steed in a constellation caparison and a crescent diadem */
  MODELS.sagittarius = (k, t, o) => {
    const mv = clamp01(o.mv || 0), ph = o.ph || 0, s = [1.05, 1.2, 1.32][k - 1], S = strikeOf(o.atk, o.atkBig);
    const coat = '#B8A8F0', coatSh = '#7E6CC8', coatHi = '#E8E0FF', mane = '#7A5AE0', maneSh = '#4E36A8', maneHi = '#B8A0FF', gold = '#F2C65A', hoof = '#F2D9A0';
    const rear = Math.max(0, S.wind) * 0.35 - S.hit * 0.1, bob = (1 - Math.abs(Math.cos(ph))) * 3 * mv, hb = 33 * s + bob, BL = 22 * s, BW = 11 * s, BH = 11.5 * s;
    const body = [S.hit * 4, 0, hb + rear * 10], G = gait4(ph, mv, 'gallop'), legL = [33, 36, 38][k - 1] * s;
    [[13, 6.5, 1], [13, -6.5, 1], [-13, 6.5, -1], [-13, -6.5, -1]].forEach(([lf, ls, kd], i) => {
      const front = i < 2, hip = rotS([lf * s + body[0], ls * s, hb - BH * 0.35], body, -rear), sw = G[i].sw + (front ? rear * 1.4 : 0), lift = G[i].lift + (front ? rear * 14 : 0);
      const foot = leg(hip, legL, sw, lift, kd, 3.7 * s, 2.4 * s, { col: coat, shade: coatSh, hi: coatHi, line: INK, knee: 1.4 });
      ell([foot[0] + 0.5, foot[1], foot[2] + 1.8 * s], [3 * s, 2.8 * s, 2 * s], { col: hoof, shade: '#C8A060', hi: '#FFF6D8', line: INK, spec: 0.5 });
    });
    ell(body, [BL, BW, BH], { col: coat, shade: coatSh, hi: coatHi, line: INK, spec: 0.6, pitch: rear, inner: c => { const R0 = mulberry32(4); c.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 9; i++) { const q = P([body[0] + (R0() - 0.5) * BL * 1.4, (R0() - 0.5) * BW * 1.6, hb + (R0() - 0.2) * BH * 1.2]); c.beginPath(); c.arc(q[0], q[1], (0.8 + R0() * 1.2) * R.u * s, 0, TAU); c.fill(); } } });
    // the saddle cloth and caparison
    if (k >= 2) { const sc = [body[0] - 1, 0, hb + BH * 0.7]; ell(sc, [BL * 0.5, BW * 1.08, BH * 0.62], { col: '#2A2468', shade: '#18144A', hi: '#4A42A0', line: INK, pitch: rear, z: -1, inner: c => { const q = P(add(sc, [0, -BW * 0.6, -BH * 0.1])); c.fillStyle = '#FFE37A'; [[0, 0], [0.5, -0.3], [1, 0.2], [-0.6, 0.3]].forEach(([dx, dy]) => { c.beginPath(); c.arc(q[0] + dx * 6 * R.u * s, q[1] + dy * 6 * R.u * s, 1.1 * R.u * s, 0, TAU); c.fill(); }); } });
    }
    // the tail: a comet of violet locks streaming back
    const tw = Math.sin(t * 2.2) * 3 + Math.sin(ph) * 2 * mv; for (let j = 0; j < 3; j++) { const tp = bez3([body[0] - BL * 0.9, 0, hb + BH * 0.5], [body[0] - BL * 1.35, (j - 1) * 3 + tw * 0.5, hb + BH * 0.8], [body[0] - BL * 1.65, (j - 1) * 5 + tw, hb - BH * 0.3], [body[0] - BL * 1.75, (j - 1) * 6 + tw * 1.4, hb - BH * 1.4 - j * 3], 8); tube(tp, u => (4.2 - u * 3.4) * s, { col: j === 1 ? maneHi : mane, shade: maneSh, hi: maneHi, line: '#2A1A6A', z: 3 + j * 0.1 }); }
    // the neck and head, held high; it rears to loose an arrow
    const nb = rotS([body[0] + BL * 0.75, 0, hb + BH * 0.5], body, -rear), hc = rotS([body[0] + BL * 1.25, 0, hb + BH * 1.95 + Math.sin(ph * 2) * 1.5 * mv], body, -rear), F = frame(hc, Math.sin(t * 0.7) * 0.15 * (1 - mv), 0.38 + Math.sin(ph * 2) * 0.06 * mv - rear * 0.6, Math.sin(t) * 0.04), at = F.at, hr = 11.5 * s;
    tube([nb, mix3(nb, hc, 0.5), hc], u => (8.6 - u * 3) * s, { col: coat, shade: coatSh, hi: coatHi, line: INK });
    ell(F.c, [hr * 1.05, hr * 0.85, hr * 0.92], { B: F.B, col: coat, shade: coatSh, hi: coatHi, line: INK, spec: 0.5 });
    ell(at(hr * 1.05, 0, -hr * 0.22), [hr * 0.72, hr * 0.62, hr * 0.6], { B: F.B, col: coatHi, shade: coat, hi: '#FFFFFF', line: INK, spec: 0.4 });
    [-1, 1].forEach(q => { mark(at(hr * 1.7, q * hr * 0.3, -hr * 0.2), F.B[0], 1.5 * s, (c, r) => { c.fillStyle = '#4A3A8A'; c.beginPath(); c.ellipse(0, 0, r, r * 0.6, 0, 0, TAU); c.fill(); });
      const eb = at(-hr * 0.3, q * hr * 0.4, hr * 0.7), et = at(-hr * 0.45, q * hr * 0.55, hr * 1.65 + Math.sin(t * 2.3 + q) * 1.2), em = mix3(eb, et, 0.5), wv = F.dir(0.28 * hr, 0, 0);
      blob([eb, add(em, wv), et, sub(em, wv)], { col: coat, shade: coatSh, hi: coatHi, line: INK, z: -1 });
      eye(at(hr * 0.42, q * hr * 0.62, hr * 0.22), F.dir(0.55, q * 0.8, 0.2), 4.3 * s, { iris: '#8A5AE8', blink: o.blink, irisR: 0.8, lash: true, look: [0.3, 0.1] }); });
    mark(at(hr * 0.5, 0, hr * 0.78), F.dir(0.6, 0, 0.8), 3.2 * s, (c, r) => { c.fillStyle = '#FFF3B0'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, rr = i % 2 ? r * 0.42 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); }); glowAt(at(hr * 0.5, 0, hr * 0.8), 6 * s, '#FFE37A', 0.6);
    if (k === 3) { const d = at(hr * 0.1, 0, hr * 1.0); mark(d, F.dir(0.3, 0, 1), 6 * s, (c, r) => { c.fillStyle = gold; c.strokeStyle = INK; c.lineWidth = r * 0.1; c.beginPath(); c.arc(0, 0, r, Math.PI * 1.1, Math.PI * 1.9); c.arc(0, -r * 0.35, r * 0.7, Math.PI * 1.85, Math.PI * 1.15, true); c.closePath(); c.fill(); c.stroke(); }); }
    // the mane: comet-flame locks down the neck, flowing back with the run
    for (let i = 0; i < 7 + k * 2; i++) { const u = i / (6 + k * 2), b0 = add(mix3(at(-hr * 0.2, 0, hr * 0.7), nb, u * 0.95), [0, 0, 2.5 * s]), fl = Math.sin(t * 3 + i * 1.3) * 2.5 + mv * 5, L = (10 + k * 3 + Math.sin(i * 2.1) * 3) * s;
      tube(bez3(b0, add(b0, [-L * 0.3, (i % 2 ? 1 : -1) * 2, L * 0.45]), add(b0, [-L * 0.75 - fl * 0.5, (i % 2 ? 2 : -2), L * 0.4]), add(b0, [-L - fl, (i % 2 ? 3 : -3), L * 0.1 + Math.sin(t * 4 + i) * 2]), 6), u2 => (4.4 - u2 * 3.6) * s, { col: i % 3 === 0 ? maneHi : mane, shade: maneSh, hi: maneHi, line: '#2A1A6A', z: -1 - u * 0.5 }); }
    if (k >= 2) for (let i = 0; i < 4; i++) glowAt(add(mix3(hc, nb, i / 3), [-6 * s, 0, 9 * s]), 3 * s, '#D8C8FF', 0.4 + 0.3 * Math.sin(t * 3 + i));
    // the moon-bow floating over its back, with a quiver of shooting stars
    if (k >= 2) { const bc = [body[0] - 4, 0, hb + BH * 2.3 + Math.sin(t * 1.6) * 1.5], br2 = (k === 3 ? 15 : 11) * s, bow = []; for (let i = 0; i <= 12; i++) { const a = -1.1 + i / 12 * 2.2; bow.push(add(bc, [Math.sin(a) * br2, 0, Math.cos(a) * br2 * 0.9 - br2 * 0.6])); }
      tube(bow, u => (1.6 + Math.sin(u * Math.PI) * 1.6) * s, { col: '#FFF0C0', shade: '#E8C870', hi: '#FFFFFF', line: '#8A6A20', z: -2, glowCol: '#FFE37A', glowA: 0.4 }); glowAt(bc, br2 * 1.1, '#FFE9A8', 0.25);
      fx(c => { const a2 = P(bow[0]), b2 = P(bow[12]); c.save(); c.globalAlpha = R.alpha * 0.8; c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(0.8, R.u); c.beginPath(); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); c.stroke(); c.restore(); }); }
  };

  /* Raziel (Gemini): twin celestial dragons of the sun and the moon, long serpents coiled round each other in a double
     helix, their heads meeting at the top as in a yin-yang. The light one is white-scaled with gold veins, a golden mane,
     golden eyes and a crown of swept-back golden horns; the dark one is deep navy with electric-blue frills, ice-blue eyes,
     a crown of sharp blue blades and lightning running through its scales. Gold and blue auras breathe round them. Hatchling
     wyrmlings with horn nubs grow into star serpents, then into the great twins with their crowns, manes and long whiskers */
  const GEM_LIGHT = { body: '#FCF9F2', sh: '#E6DCC8', sh2: '#CDBB98', hi: '#FFFFFF', line: '#7A5A2A', fin: '#E4B76A', finSh: '#B6873A', finHi: '#FFF0C4', horn: '#F0C978', hornSh: '#B07E2E', hornHi: '#FFF6D6', iris: '#FFC24D', aura: '#FFB84A', vein: '#E4B76A', scale: 'rgba(190,160,110,.38)', eyeW: '#FFF4D2' };
  const GEM_DARK = { body: '#24336E', sh: '#141D48', sh2: '#0E1530', hi: '#3F5DB0', line: '#060A1C', fin: '#4A90E2', finSh: '#2A5CB4', finHi: '#CFE6FA', horn: '#5DA9F5', hornSh: '#2A5CB4', hornHi: '#E2F2FF', iris: '#8FD3FF', aura: '#3A7AE8', vein: '#8FD3FF', scale: 'rgba(110,150,230,.4)', eyeW: '#D6ECFF' };
  MODELS.gemini = (k, t, o) => {
    const mv = clamp01(o.mv || 0), S = strikeOf(o.atk, o.atkBig), s = [0.86, 0.98, 1.08][k - 1];
    const n = 34, turns = [0.95, 1.25, 1.45][k - 1], H1 = [34, 47, 56][k - 1] * s, Rr = [10.5, 12.5, 14][k - 1] * s, W = [3.9, 4.6, 5.2][k - 1] * s, hr = [7.6, 8.4, 9.2][k - 1] * s;
    const breathe = Math.sin(t * 1.7), swim = 0.5 + mv, LW = Math.max(1, R.u * 1.05);
    const wf = u => (u < 0.24 ? W * (0.16 + 0.84 * Math.sin(u / 0.24 * Math.PI / 2)) : W * (1 - (u - 0.24) * 0.22)) * (1 + breathe * 0.025);
    const tan = (pts, i) => norm(sub(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]));
    const dragon = j => {
      const C = j ? GEM_DARK : GEM_LIGHT, q = j ? 1 : -1, aEnd = j ? 0 : Math.PI, pts = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, a = aEnd - (1 - u) * turns * TAU + Math.sin(t * 1.25 + u * 4.5 + j * 1.7) * 0.1 * (1 - u * 0.7);
        const r = Rr * (0.62 + 0.46 * Math.sin(Math.PI * Math.min(1, u * 1.08))) * (1 + Math.sin(t * 1.6 + u * 6 + j) * 0.05);
        const h = 6 * s + u * H1 + Math.sin(u * 9 - t * 2.4 + j * Math.PI) * 1.3 * s * swim + breathe * 0.8 * u;
        pts.push([Math.sin(a) * r * 0.82, Math.cos(a) * r, h]);
      }
      // a soft halo along the body: the aura that clings to each twin
      fx(c => { const sp = pts.map(P); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        [[2.5, 0.07], [1.7, 0.13]].forEach(([k2, a2]) => { c.globalAlpha = R.alpha * a2 * (j ? 1.9 : 0.6) * (0.85 + 0.15 * Math.sin(t * 2.2 + j * 2)); c.strokeStyle = C.aura; c.lineWidth = W * 2 * k2 * R.u; c.beginPath(); sp.forEach((p2, i) => i ? c.lineTo(p2[0], p2[1]) : c.moveTo(p2[0], p2[1])); c.stroke(); }); c.restore(); }, true);
      glowAt([0, q * Rr * 0.35, H1 * 0.5], 30 * s + k * 4, C.aura, 0.12 + k * 0.04, true);
      // the body, cut where it passes behind the other twin so each run sorts by its own depth
      const dz = pts.map(p => P(p)[2] - P([0, 0, p[2]])[2]), cuts = [0];
      for (let i = 1; i <= n; i++) if (Math.sign(dz[i]) !== Math.sign(dz[i - 1]) && i - cuts[cuts.length - 1] > 1) cuts.push(i);
      cuts.push(n);
      for (let ci = 0; ci < cuts.length - 1; ci++) {
        const a0 = cuts[ci], a1 = Math.min(n, cuts[ci + 1] + 1), seg = pts.slice(a0, a1 + 1), wseg = i => wf((a0 + i) / n);
        tube(seg, u => wf((a0 + u * (a1 - a0)) / n), { col: C.body, shade: C.sh, shade2: C.sh2, hi: C.hi, line: C.line, lw: LW, d2: 0.36, inner: c => {
          const sp = seg.map(P); c.lineCap = 'round';
          // scales: little arcs in rows down the body
          c.strokeStyle = C.scale; c.lineWidth = Math.max(0.6, R.u * 0.7); c.beginPath();
          for (let i = 1; i < sp.length - 1; i++) { const dx = sp[i + 1][0] - sp[i - 1][0], dy = sp[i + 1][1] - sp[i - 1][1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, w = wseg(i) * R.u, an = Math.atan2(dy, dx);
            for (const o2 of [-0.5, 0, 0.5]) { const cx = sp[i][0] + nx * w * o2, cy = sp[i][1] + ny * w * o2, a0 = an + 0.9; c.moveTo(cx + Math.cos(a0) * w * 0.3, cy + Math.sin(a0) * w * 0.3); c.arc(cx, cy, w * 0.3, a0, an + Math.PI * 2 - 0.9, true); } }
          c.stroke();
          // veins: gold filigree down the light one, blue lightning crackling through the dark one
          c.save(); if (j) c.globalCompositeOperation = 'lighter';
          const R0 = mulberry32(((Math.floor(t * (j ? 9 : 0.5)) * 7 + a0 * 13 + j * 101) >>> 0) + 1);
          for (const side of j ? [-0.38, 0.3] : [0.42]) { const path = []; for (let i = 0; i < sp.length; i++) { const dx = sp[Math.min(sp.length - 1, i + 1)][0] - sp[Math.max(0, i - 1)][0], dy = sp[Math.min(sp.length - 1, i + 1)][1] - sp[Math.max(0, i - 1)][1], L = Math.hypot(dx, dy) || 1, w = wseg(i) * R.u, jit = j ? (R0() - 0.5) * 0.5 : Math.sin(i * 1.7 + a0) * 0.12; path.push([sp[i][0] - dy / L * w * (side + jit), sp[i][1] + dx / L * w * (side + jit)]); }
            (j ? [[2.6, 0.35, C.fin], [1.1, 0.95, C.vein], [0.45, 1, '#FFFFFF']] : [[1.3, 0.9, C.vein], [0.5, 0.8, '#FFF6D6']]).forEach(([lw, al, col]) => { c.globalAlpha = R.alpha * al * (j ? 0.75 + 0.25 * Math.sin(t * 13 + side * 9) : 1); c.strokeStyle = col; c.lineWidth = Math.max(0.5, lw * R.u); c.beginPath(); path.forEach((p2, i) => i ? c.lineTo(p2[0], p2[1]) : c.moveTo(p2[0], p2[1])); c.stroke(); }); }
          c.restore();
        } });
      }
      // fin-like frills along the spine, sweeping back toward the tail
      const fin = (p, T, len, ht, sw, z) => { const Rd = norm([p[0], p[1], 0.0001]), D = norm(add(mul(Rd, 0.8), [0, 0, 0.6])), w = wf(0.6), b0 = add(p, add(mul(D, w * 0.55), mul(T, 1.6 * s))), b1 = add(p, add(mul(D, w * 0.55), mul(T, -1.8 * s))), tip = add(p, add(mul(D, w * 0.6 + ht), add(mul(T, -len), [0, 0, sw])));
        blob([b0, add(mix3(b0, tip, 0.5), mul(D, ht * 0.18)), tip, mix3(b1, tip, 0.35), b1], { col: C.fin, shade: C.finSh, hi: C.finHi, line: sh(C.fin, -0.55), lw: LW * 0.8, alpha: j ? 0.9 : 1, glowCol: j ? '#8FD3FF' : null, glowA: 0.45, z: (z || 0) + 0.6 }); };
      const step = k === 1 ? 5 : 3;
      for (let i = Math.round(n * 0.22); i < n - 1; i += step) fin(pts[i], tan(pts, i), (4.5 + k * 1.4) * s, (3 + k * 1.1) * s, Math.sin(t * 3 + i * 0.7) * 0.8 * s);
      // the tail: a flowing, translucent fan
      const T00 = sub(pts[0], pts[3]), T0 = norm([T00[0], T00[1], T00[2] * 0.25]), sway = Math.sin(t * 2.1 + j * 1.4) * 3 * s, tl = (13 + k * 4.5) * s, tb = pts[2];
      [[1, 0.55], [0.25, 0.45]].forEach(([d, a2], li) => blob([tb, add(pts[0], add(mul(T0, tl * 0.55), [0, q * d * 2 * s, d * (3.5 + k * 1.2) * s + sway + tl * 0.12])), add(pts[0], add(mul(T0, tl), [0, 0, sway * 1.3 + (1 - d) * 1.5 * s + tl * 0.3])), add(pts[0], mul(T0, tl * 0.3)), pts[1]], { col: li ? C.finHi : C.fin, shade: C.finSh, hi: C.finHi, line: sh(C.fin, -0.5), lw: LW * 0.8, alpha: a2 + 0.15, glowCol: j ? '#8FD3FF' : '#FFE9A8', glowA: 0.35, z: 0.8 }));
      // the neck, rising from the coil, and the head turned to face its twin
      const top = pts[n], Tn = tan(pts, n), yaw = q * -(Math.PI / 2 - 0.8) + Math.sin(t * 0.9 + j * 2) * 0.1;
      const lunge = S.hit * 3 * s, hc = [3.5 * s + lunge * 0.6, q * Rr * 1.12 - q * lunge, H1 + (15 + k * 2) * s + Math.sin(t * 1.4 + j) * 1.2 * s + S.hit * 2];
      const F = frame(hc, yaw, -0.12 + Math.sin(t * 1.1 + j) * 0.05 + S.hit * 0.25, q * 0.08 + Math.sin(t * 0.8 + j) * 0.04), at = F.at;
      const neck = bez3(top, add(top, add(mul(Tn, 2.5 * s), [-4 * s, 0, 7 * s])), add(hc, add(F.dir(-hr * 1.1, 0, -hr * 0.9), [0, 0, 0])), at(-hr * 0.35, 0, -hr * 0.1), 8);
      tube(neck, u => wf(1) * (1 - u * 0.12), { col: C.body, shade: C.sh, shade2: C.sh2, hi: C.hi, line: C.line, lw: LW, d2: 0.36, z: 2.5, inner: c => { const sp = neck.map(P); c.strokeStyle = C.scale; c.lineWidth = Math.max(0.6, R.u * 0.7); c.beginPath(); for (let i = 1; i < sp.length - 1; i++) { const an = Math.atan2(sp[i + 1][1] - sp[i - 1][1], sp[i + 1][0] - sp[i - 1][0]), w = wf(1) * R.u, a0 = an + 0.9; c.moveTo(sp[i][0] + Math.cos(a0) * w * 0.32, sp[i][1] + Math.sin(a0) * w * 0.32); c.arc(sp[i][0], sp[i][1], w * 0.32, a0, an + TAU - 0.9, true); } c.stroke(); } });
      for (let i = 2; i < 8; i += 2) fin(neck[i], tan(neck, i), (4 + k) * s, (2.4 + k * 0.8) * s, Math.sin(t * 3.4 + i) * 0.8 * s, -0.2);
      // the mane: flowing locks streaming back from the crown and down the neck
      const nl = k === 1 ? 2 : 3 + k;
      for (let i = 0; i < nl; i++) { const u = i / Math.max(1, nl - 1), b = at(-hr * (0.3 + u * 0.7), (i % 2 ? 1 : -1) * hr * 0.3, hr * (0.45 - u * 0.5)), fl = Math.sin(t * 2.6 + i * 1.3 + j) * 2.2 * s, L = (6 + k * 4.5 + (i % 3) * 2) * s;
        const tip = add(b, add(F.dir(-L, (i % 2 ? 1 : -1) * L * 0.25, -L * (0.15 + u * 0.35)), [0, 0, fl])), mid = add(mix3(b, tip, 0.5), F.dir(0, 0, L * 0.22));
        blob([add(b, F.dir(0, 0, 1.6 * s)), mid, tip, add(mix3(b, tip, 0.45), F.dir(0, 0, -L * 0.05)), add(b, F.dir(0, 0, -1.8 * s))], { col: i % 2 ? C.finHi : C.fin, shade: C.finSh, hi: C.finHi, line: sh(C.fin, -0.55), lw: LW * 0.85, alpha: j ? 0.9 : 1, glowCol: j ? '#8FD3FF' : null, glowA: 0.4, z: 1.2 + u * 0.4 }); }
      glowAt(hc, hr * 2.4, C.aura, j ? 0.42 : 0.22, true);
      // the head: a long dragon skull and snout, brows, a jaw that opens as it strikes
      ell(F.c, [hr * 0.95, hr * 0.74, hr * 0.68], { B: F.B, col: C.body, shade: C.sh, hi: C.hi, line: C.line, lw: LW, spec: 0.35 });
      ell(at(hr * 1.05, 0, -hr * 0.14), [hr * 0.9, hr * 0.44, hr * 0.32], { B: F.B, col: C.body, shade: C.sh, hi: C.hi, line: C.line, lw: LW, spec: 0.3, z: -0.3 });
      const jawA = S.hit * 0.35 + (k === 3 ? 0.06 : 0);
      ell(at(hr * 0.95, 0, -hr * (0.44 + jawA * 0.6)), [hr * 0.78, hr * 0.38, hr * 0.17], { B: basis(yaw, -0.12 - jawA, 0), col: C.sh, shade: C.sh2, hi: C.body, line: C.line, lw: LW, z: 0.2 });
      ell(at(hr * 1.82, 0, -hr * 0.1), [hr * 0.28, hr * 0.34, hr * 0.26], { B: F.B, col: C.body, shade: C.sh, hi: C.hi, line: C.line, lw: LW, z: -0.5 });
      if (S.hit > 0.1) glowAt(at(hr * 1.4, 0, -hr * 0.36), (5 + S.hit * 6) * s, j ? '#CFE6FA' : '#FFF0C4', 0.7 * Math.min(1, S.hit));
      [-1, 1].forEach(qq => {
        mark(at(hr * 2.0, qq * hr * 0.16, 0), F.dir(0.6, qq * 0.3, 0.6), hr * 0.06, (c, r) => { c.fillStyle = C.line; c.beginPath(); c.ellipse(0, 0, r, r * 0.55, qq * 0.5, 0, TAU); c.fill(); }, -1.2);
        ell(at(hr * 0.5, qq * hr * 0.43, hr * 0.4), [hr * 0.42, hr * 0.17, hr * 0.13], { B: basis(yaw + qq * 0.25, 0.25, 0), col: C.hi, shade: C.body, hi: '#FFFFFF', line: C.line, lw: LW, z: -0.6 });
        const ep = at(hr * 0.58, qq * hr * 0.5, hr * 0.16), en = F.dir(0.45, qq * 0.85, 0.15);
        if (eye(ep, en, hr * (k === 1 ? 0.3 : 0.24), { iris: C.iris, white: C.eyeW, slit: k > 1, irisR: k === 1 ? 0.8 : 0.9, lid: k === 1 ? 0 : 0.32, lidCol: C.body, line: C.line, blink: o.blink, look: [0.4, 0.05] })) glowAt(ep, 3.4 * s, C.iris, 0.55);
        // whiskers: long and flowing, from the snout down and back
        const wb = at(hr * 1.65, qq * hr * 0.3, -hr * 0.2), wl = (k === 1 ? 6 : 9 + k * 3.5) * s, ws = Math.sin(t * 1.9 + qq + j * 2) * 2 * s, ws2 = Math.cos(t * 1.5 + qq * 2 + j) * 1.6 * s;
        const wp = bez3(wb, add(wb, F.dir(hr * 0.4, qq * hr * 0.35, -hr * 0.2)), add(wb, F.dir(wl * 0.05 + ws * 0.5, qq * wl * 0.3, -wl * 0.5)), add(wb, F.dir(-wl * 0.35 + ws2, qq * wl * 0.2, -wl * 0.95)), 10);
        decal(wb, c => { const sp = wp.map(P); c.lineCap = 'round'; c.lineJoin = 'round'; [[2.4, 0.3, C.aura], [1.1, 1, C.fin], [0.45, 0.9, '#FFFFFF']].forEach(([w, al, col], li) => { c.save(); if (li !== 1) c.globalCompositeOperation = 'lighter'; c.globalAlpha = R.alpha * al; c.strokeStyle = col; c.beginPath(); for (let i = 0; i < sp.length - 1; i++) { c.lineWidth = Math.max(0.5, w * R.u * s * (1 - i / sp.length * 0.7)); c.beginPath(); c.moveTo(sp[i][0], sp[i][1]); c.lineTo(sp[i + 1][0], sp[i + 1][1]); c.stroke(); } c.restore(); }); }, -0.9);
        // cheek frills
        if (k >= 2) blob([at(hr * 0.3, qq * hr * 0.6, -hr * 0.25), at(-hr * 0.3, qq * hr * 1.15, -hr * 0.1 + Math.sin(t * 2 + qq) * 0.6), at(-hr * 0.7, qq * hr * 1.0, -hr * 0.55), at(-hr * 0.1, qq * hr * 0.62, -hr * 0.5)], { col: C.fin, shade: C.finSh, hi: C.finHi, line: sh(C.fin, -0.55), lw: LW * 0.85, alpha: j ? 0.88 : 1, glowCol: j ? '#8FD3FF' : null, glowA: 0.4, z: 0.5 });
      });
      // the crown of horns: two great horns swept back, and a fan of lesser spines (gold flames, or blue blades)
      const horn = (b, d1, d2, d3, w, z, sharp) => { const pts2 = bez3(b, add(b, d1), add(b, d2), add(b, d3), 9); tube(pts2, u => w * (1 - u * (sharp ? 0.92 : 0.85)), { col: C.horn, shade: C.hornSh, hi: C.hornHi, line: sh(C.horn, -0.6), lw: LW * 0.9, z, glowCol: j ? '#8FD3FF' : '#FFE9A8', glowA: j ? 0.55 : 0.3 }); return pts2[9]; };
      const HL = [0.9, 1.7, 2.5][k - 1] * hr;
      [-1, 1].forEach(qq => {
        const b = at(-hr * 0.15, qq * hr * 0.42, hr * 0.48);
        const tipP = horn(b, F.dir(-HL * 0.1, qq * HL * 0.08, HL * 0.42), F.dir(-HL * 0.55, qq * HL * 0.22, HL * (j ? 0.95 : 0.78)), F.dir(-HL * (j ? 0.75 : 1.05), qq * HL * (j ? 0.32 : 0.2), HL * (j ? 1.12 : 0.92)), (k === 1 ? 1.5 : 1.9 + k * 0.25) * s, 0.3, j);
        if (k === 3) glowAt(tipP, 3 * s, C.vein, 0.5 + 0.25 * Math.sin(t * 4 + qq));
        if (k >= 2) for (let i = 0; i < (k === 3 ? 2 : 1); i++) { const a2 = 0.55 + i * 0.45, L2 = HL * (0.6 - i * 0.14), b2 = at(-hr * (0.35 + i * 0.25), qq * hr * 0.55, hr * (0.3 - i * 0.12));
          horn(b2, F.dir(-L2 * 0.2, qq * L2 * 0.3 * a2, L2 * 0.25), F.dir(-L2 * 0.6, qq * L2 * 0.55 * a2, L2 * (j ? 0.7 : 0.5)), F.dir(-L2 * (j ? 0.75 : 1.0), qq * L2 * 0.7 * a2, L2 * (j ? 0.85 : 0.55)), (1.3 + k * 0.15) * s, 0.9 + i * 0.2, j); }
      });
      if (k === 3) horn(at(-hr * 0.05, 0, hr * 0.62), F.dir(-HL * 0.05, 0, HL * 0.3), F.dir(-HL * 0.3, 0, HL * (j ? 0.62 : 0.5)), F.dir(-HL * (j ? 0.35 : 0.6), 0, HL * (j ? 0.78 : 0.6)), 1.7 * s, 0.7, j);
      // a jewel on the brow: a sun for the light twin, a crescent moon for the dark
      if (k >= 2) { const br = at(hr * 0.62, 0, hr * 0.52); mark(br, F.dir(0.7, 0, 0.7), hr * 0.16, (c, r) => { c.fillStyle = j ? '#CFE6FA' : '#FFE9A8'; c.beginPath(); if (j) { c.arc(0, 0, r, 0.6, 5.7); c.arc(r * 0.4, -r * 0.1, r * 0.75, 5.4, 0.9, true); } else { for (let i = 0; i < 12; i++) { const an = i / 12 * TAU, rr = i % 2 ? r * 0.55 : r; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } } c.closePath(); c.fill(); }, -1.4); glowAt(br, 4 * s, j ? '#8FD3FF' : '#FFD36B', 0.7); }
      // motes of light drifting up round each twin
      for (let i = 0; i < 3 + k * 2; i++) { const ph2 = (t * (0.22 + i * 0.013) + i / (3 + k * 2) + j * 0.37) % 1, an = i * 2.4 + t * 0.6 * (j ? -1 : 1); fx(c => { const p2 = P([Math.sin(an) * Rr * 1.25, q * Rr * 0.4 + Math.cos(an) * Rr * 1.1, 4 * s + ph2 * (H1 + 26 * s)]), sz = (1.4 + (i % 3) * 0.7) * R.u * s, a2 = R.alpha * Math.sin(ph2 * Math.PI) * 0.95; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a2; blitSized(c, glowSprite(C.aura), p2[0] - sz * 3, p2[1] - sz * 3, sz * 6, sz * 6); c.globalAlpha = a2 * 0.9; c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(p2[0], p2[1] - sz * 1.6); c.quadraticCurveTo(p2[0], p2[1], p2[0] + sz * 1.6, p2[1]); c.quadraticCurveTo(p2[0], p2[1], p2[0], p2[1] + sz * 1.6); c.quadraticCurveTo(p2[0], p2[1], p2[0] - sz * 1.6, p2[1]); c.quadraticCurveTo(p2[0], p2[1], p2[0], p2[1] - sz * 1.6); c.fill(); c.restore(); }); }
    };
    // the yin-yang halo behind their heads, half gold and half blue, turning slowly
    if (k >= 2) fx(c => { const cp = P([-6 * s, 0, H1 + 14 * s]), rr = (k === 3 ? 22 : 16) * s * R.u, sp = t * 0.35; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      [[GEM_LIGHT.aura, 0], [GEM_DARK.aura, Math.PI]].forEach(([col, a0]) => [[6, 0.1], [2.2, 0.35], [0.9, 0.8]].forEach(([w, al], li) => { c.globalAlpha = R.alpha * al; c.strokeStyle = li === 2 ? '#FFFFFF' : col; c.lineWidth = Math.max(0.6, w * R.u); c.beginPath(); c.ellipse(cp[0], cp[1], rr, rr * 0.92, 0, sp + a0 + 0.15, sp + a0 + Math.PI - 0.15); c.stroke(); }));
      c.restore(); }, true);
    dragon(1); dragon(0);
  };
  MODELS.gemini.yaw = 0.1;

  /* Mammon (Capricorn): a sea-goat kid with gold coin spots and a fish's tail, whose ridged horns crackle with gold lightning */
  MODELS.capricorn = (k, t, o) => {
    const mv = clamp01(o.mv || 0), ph = o.ph || 0, s = [1.12, 1.24, 1.36][k - 1], S = strikeOf(o.atk, o.atkBig);
    const hide = '#3E5466', hideSh = '#25344A', hideHi = '#6E8AA0', fin = '#3FB8D8', finSh = '#2078A8', finHi = '#A8ECFF', gold = '#F2C65A', goldSh = '#B8862A';
    const hb = 24 * s + Math.sin(t * 1.4) * 1.6, body = [S.hit * 5 - S.wind * 2, 0, hb], BL = 15 * s, BW = 13 * s, BH = 13 * s;
    // the fish tail: from the rump it curls back and up, swishing as it swims, ending in a forked fin
    const sw = Math.sin(ph * 1.2 + t * 2) * (2 + mv * 4), tp = bez3([body[0] - BL * 0.5, 0, hb - BH * 0.1], [body[0] - BL * 1.6, sw * 0.4, hb - BH * 0.9], [body[0] - BL * 2.4, sw, hb - BH * 0.2], [body[0] - BL * 2.2, sw * 1.3, hb + BH * 1.1], 10);
    tube(tp, u => (11 - u * 8) * s, { col: hide, shade: hideSh, hi: hideHi, line: INK, z: 2, inner: c => { const sp = tp.map(P); c.strokeStyle = rgba(fin, 0.7); c.lineWidth = Math.max(1, R.u * 1.2); for (let i = 2; i < 10; i++) { const q = sp[i], q2 = sp[i + 1], dx = q2[0] - q[0], dy = q2[1] - q[1], d = Math.hypot(dx, dy) || 1, w = (11 - i / 10 * 8) * s * R.u * 0.8; c.beginPath(); c.arc(q[0], q[1], w * 0.6, Math.atan2(dy, dx) + 1.9, Math.atan2(dy, dx) + 4.4); c.stroke(); } } });
    const te = tp[10], td = norm(sub(tp[10], tp[8])); [-1, 1].forEach(q => { const a = add(te, add(mul(td, 11 * s), [q * 3 * s, 0, q * 7 * s])); blob([sub(te, mul(td, 2 * s)), add(mix3(te, a, 0.5), [0, q * 4 * s, 0]), a, mix3(te, a, 0.7)], { col: fin, shade: finSh, hi: finHi, line: INK, z: 1.5 }); });
    [0.35, 0.6].forEach((u, i) => { const q = tp[Math.round(u * 10)]; blob([q, add(q, [-5 * s, 0, 7 * s]), add(q, [-1 * s, 0, 8 * s]), add(q, [3 * s, 0, 2 * s])], { col: fin, shade: finSh, hi: finHi, line: INK, z: 2.2 }); });
    // front legs paddling as it swims, small gold hooves
    [-1, 1].forEach((q, i) => { const p2 = ph + i * Math.PI, hip = [body[0] + BL * 0.45, q * 5 * s, hb - BH * 0.4], foot = [hip[0] + 4 * s + Math.sin(p2) * 4 * s * (0.4 + mv), hip[1], hip[2] - 13 * s + Math.max(0, Math.cos(p2)) * 4 * s * (0.4 + mv)], knee = [mix3(hip, foot, 0.5)[0] + 3 * s, hip[1], mix3(hip, foot, 0.5)[2]];
      tube([hip, knee], u => (3.6 - u * 0.6) * s, { col: hide, shade: hideSh, hi: hideHi, line: INK }); tube([knee, foot], u => (3 - u * 0.5) * s, { col: hide, shade: hideSh, hi: hideHi, line: INK }); ell(add(foot, [0.5, 0, -0.5]), [2.6 * s, 2.4 * s, 1.8 * s], { col: gold, shade: goldSh, hi: '#FFF0B0', line: INK, spec: 0.6 }); });
    ell(body, [BL, BW, BH], { col: hide, shade: hideSh, hi: hideHi, line: INK, spec: 0.5, inner: c => { const R0 = mulberry32(7); for (let i = 0; i < 4 + k * 2; i++) { const q = P([body[0] + (R0() - 0.5) * BL * 1.2, (R0() - 0.5) * BW * 1.4, hb + (R0() - 0.3) * BH]); const r = (1.8 + R0()) * R.u * s; c.fillStyle = gold; c.beginPath(); c.arc(q[0], q[1], r, 0, TAU); c.fill(); c.strokeStyle = goldSh; c.lineWidth = Math.max(0.6, R.u * 0.7); c.beginPath(); c.arc(q[0], q[1], r * 0.6, 0, TAU); c.stroke(); } } });
    // a bib of white fluff and a coin on a ribbon
    ell([body[0] + BL * 0.62, 0, hb + BH * 0.15], [5 * s, 8 * s, 6 * s], { col: '#E8EEF4', shade: '#B8C4D0', hi: '#FFFFFF', line: INK });
    if (k >= 2) { const cp = [body[0] + BL * 0.95, 0, hb - BH * 0.05]; sphere(cp, 3 * s, { col: gold, shade: goldSh, hi: '#FFF0B0', line: INK, spec: 0.8, z: -1 }); glowAt(cp, 6 * s, '#FFE37A', 0.5); }
    // the head: a kid's head with drooping pink-lined ears, slit gold eyes, a little beard
    const hr = 13 * s, F = frame([body[0] + BL * 0.7, 0, hb + BH * 1.1 + Math.sin(t * 1.4 + 0.5) * 0.8], Math.sin(t * 0.8) * 0.2, 0.05 + S.hit * 0.25 - S.wind * 0.1 + Math.sin(t * 1.2) * 0.05, Math.sin(t) * 0.05), at = F.at;
    ell(F.c, [hr * 0.9, hr * 0.92, hr * 0.88], { B: F.B, col: hide, shade: hideSh, hi: hideHi, line: INK, spec: 0.5 });
    ell(at(hr * 0.7, 0, -hr * 0.35), [hr * 0.42, hr * 0.48, hr * 0.36], { B: F.B, col: hideHi, shade: hide, hi: sh(hideHi, 0.3), line: INK, spec: 0.3 });
    tube([at(hr * 0.75, 0, -hr * 0.7), at(hr * 0.72, 0, -hr * 1.05), at(hr * 0.62, 0, -hr * 1.3)], u => (2.6 - u * 1.8) * s, { col: '#E8EEF4', shade: '#B8C4D0', hi: '#FFFFFF', line: INK, z: -1 });
    [-1, 1].forEach(q => { const eb = at(-hr * 0.05, q * hr * 0.82, hr * 0.15), et = at(-hr * 0.25, q * hr * 1.6, -hr * 0.2 + Math.sin(t * 2 + q) * 0.8), em = mix3(eb, et, 0.5), wv = F.dir(0, 0, hr * 0.2);
      blob([eb, add(em, wv), et, sub(em, wv)], { col: hide, shade: hideSh, hi: hideHi, line: INK, z: -1.5 }); blob([mix3(eb, et, 0.2), add(em, mul(wv, 0.5)), mix3(eb, et, 0.8), sub(em, mul(wv, 0.5))], { col: '#E07A90', shade: '#B05A70', hi: false, line: false, z: -1.7 });
      eye(at(hr * 0.6, q * hr * 0.42, hr * 0.1), F.dir(0.75, q * 0.6, 0.12), 4.4 * s, { iris: '#FFD447', blink: o.blink, slit: true, irisR: 0.8, look: [0.2, 0.1] });
      // ridged horns curving back, crackling with gold lightning after the first form
      const hl = [0.55, 0.85, 1.1][k - 1] * hr, pts = bez3(at(hr * 0.15, q * hr * 0.4, hr * 0.7), at(-hr * 0.05, q * hr * 0.55, hr * 0.7 + hl * 0.6), at(-hr * 0.45 - hl * 0.3, q * hr * 0.7, hr * 0.7 + hl * 0.7), at(-hr * 0.6 - hl * 0.55, q * hr * 0.8, hr * 0.7 + hl * 0.25), 10);
      tube(pts, u => (3.4 - u * 2.4) * s, { col: '#5A6474', shade: '#3A4250', hi: '#9AA6B8', line: INK, z: -0.8, inner: c => { c.strokeStyle = 'rgba(20,26,36,.6)'; c.lineWidth = Math.max(1, R.u); const sp = pts.map(P); for (let i = 1; i < 9; i++) { const p2 = sp[i], p3 = sp[i + 1], dx = p3[0] - p2[0], dy = p3[1] - p2[1], d = Math.hypot(dx, dy) || 1, w = (3.4 - i / 10 * 2.4) * s * R.u; c.beginPath(); c.moveTo(p2[0] - dy / d * w, p2[1] + dx / d * w); c.lineTo(p2[0] + dy / d * w, p2[1] - dx / d * w); c.stroke(); } } });
      if (k >= 2) fx(c => { const sp = pts.map(P), seed = Math.floor(t * 9) + (q > 0 ? 7 : 0), Rr = mulberry32(seed); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = R.alpha * 0.9; c.strokeStyle = '#FFE37A'; c.lineWidth = Math.max(1, R.u * 1.3); c.lineJoin = 'round'; c.beginPath(); sp.forEach((p2, i) => { const jx = (Rr() - 0.5) * 6 * R.u, jy = (Rr() - 0.5) * 6 * R.u; i ? c.lineTo(p2[0] + jx, p2[1] + jy - 3 * R.u) : c.moveTo(p2[0], p2[1] - 3 * R.u); }); c.stroke(); c.restore(); }); });
    mark(at(hr * 1.08, 0, -hr * 0.3), F.B[0], 2 * s, (c, r) => { c.fillStyle = '#1A2230'; c.beginPath(); c.ellipse(-r * 0.5, 0, r * 0.35, r * 0.5, 0.3, 0, TAU); c.ellipse(r * 0.5, 0, r * 0.35, r * 0.5, -0.3, 0, TAU); c.fill(); c.strokeStyle = '#1A2230'; c.lineWidth = r * 0.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 0.7, r * 1.3); c.quadraticCurveTo(0, r * 1.9, r * 0.7, r * 1.3); c.stroke(); });
    if (k === 3) { const cr = at(hr * 0.1, 0, hr * 0.95); for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.35; sphere(add(cr, F.dir(Math.sin(a) * hr * 0.3, Math.sin(a) * hr * 0.45, Math.cos(a) * 1.5)), 2.2 * s, { col: gold, shade: goldSh, hi: '#FFF0B0', line: INK, spec: 0.8 }); } glowAt(cr, 10 * s, '#FFE37A', 0.5); }
    glowAt([body[0], 0, hb], 30 * s, '#3FB8D8', 0.15, true);
  };

  // a jointed arthropod leg: from the hip it rises to a knee out to the side, then reaches down to a pointed tip
  function bugLeg(hip, out, reach, lift, swing, w, o) {
    const kh = (o && o.kh) || 0.35, dir = norm([Math.sin(swing) * 0.6, out[1], 0]), knee = add(hip, [dir[0] * reach * 0.45 + out[0], dir[1] * reach * 0.5, reach * kh + lift]), tip = add(hip, [dir[0] * reach * 0.9 + out[0] * 1.6, dir[1] * reach * 0.95, -hip[2] + lift * 0.4]);
    tube([hip, knee], u => w * (1 - u * 0.25), o); tube([knee, mix3(knee, tip, 0.5), tip], u => w * 0.75 * (1 - u * 0.8), o);
    return tip;
  }
  H.bugLeg = bugLeg;

  /* Abaddon (Cancer): a glossy crimson crab with lantern-cyan eyes on stalks; spikes and glowing spots, then a pale moon */
  MODELS.cancer = (k, t, o) => {
    // seen nearly head-on, like a crab sidling toward you
    const mv = clamp01(o.mv || 0), ph = o.ph || 0, s = [1.12, 1.24, 1.36][k - 1], S = strikeOf(o.atk, o.atkBig);
    const shell = '#8A2A48', shellSh = '#5A1630', shellHi = '#E07090', cy = '#5DF2FF', leg2 = '#74223C';
    const hb = 15 * s + Math.abs(Math.sin(ph * 2)) * 1.2 * mv, body = [0, 0, hb], CW = 20 * s, CL = 15 * s, CH = 10.5 * s;
    if (k === 3) { const mc = [-16 * s, 0, 38 * s]; sphere(mc, 19 * s, { col: '#DDE6F6', shade: '#A8B6D6', hi: '#FFFFFF', line: '#6A7AA0', z: 30, inner: c => { const R0 = mulberry32(3), q = P(mc); [[-0.4, -0.3, 0.22], [0.3, 0.25, 0.28], [0.35, -0.45, 0.12], [-0.1, 0.45, 0.16]].forEach(([dx, dy, r]) => { c.fillStyle = 'rgba(120,140,190,.35)'; c.beginPath(); c.arc(q[0] + dx * 19 * s * R.u, q[1] + dy * 19 * s * R.u, r * 19 * s * R.u, 0, TAU); c.fill(); }); } }); glowAt(mc, 38 * s, '#BFEFFF', 0.3, true); }
    // six walking legs, scuttling in a ripple
    for (const q of [-1, 1]) for (let i = 0; i < 3; i++) { const p2 = ph * 2 + i * 2.1 + (q > 0 ? Math.PI : 0), lift = Math.max(0, Math.sin(p2)) * 4 * mv, sw = Math.cos(p2) * 0.5 * mv, hip = [(3 - i * 5.5) * s, q * CW * 0.72, hb - 3 * s];
      bugLeg(hip, [(-0.15 - i * 0.2) * 6 * s, q * 0.95], 14 * s, lift, sw, 3.8 * s, { col: leg2, shade: sh(leg2, -0.35), hi: sh(leg2, 0.35), line: INK, kh: 0.6 }); }
    // the carapace: wide, glossy, a pale belly band, spikes and glowing spots as it grows
    ell(body, [CL, CW, CH], { col: shell, shade: shellSh, hi: shellHi, line: INK, spec: 0.85, specR: 0.13, inner: k >= 2 ? c => { const R0 = mulberry32(8); for (let i = 0; i < (k === 3 ? 10 : 6); i++) { const q = P([(R0() - 0.5) * CL * 1.4, (R0() - 0.5) * CW * 1.5, hb + CH * 0.7]), pl = 0.6 + 0.4 * Math.sin(t * 2.4 + i); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = R.alpha * 0.8 * pl; blitSized(c, glowSprite(cy), q[0] - 4 * R.u * s, q[1] - 4 * R.u * s, 8 * R.u * s, 8 * R.u * s); c.restore(); c.fillStyle = '#E8FFFF'; c.beginPath(); c.arc(q[0], q[1], 0.9 * R.u * s, 0, TAU); c.fill(); } } : null });
    ell([CL * 0.35, 0, hb - CH * 0.45], [CL * 0.6, CW * 0.7, CH * 0.45], { col: '#F2B0C0', shade: '#C8788C', hi: '#FFE0E8', line: INK, z: -1 });
    if (k >= 2) { const n = k === 3 ? 7 : 5; for (let i = 0; i < n; i++) { const a = (i / (n - 1) - 0.5) * 2.2, b = [Math.cos(a) * CL * 0.2 - 2, Math.sin(a) * CW * 0.85, hb + CH * 0.7], tp = add(b, [0, Math.sin(a) * 3 * s, (4 + (k === 3 ? 3 : 0)) * s]); tube([b, tp], u => 2.4 * s * (1 - u * 0.9), { col: '#E4EAFF', shade: '#A8B4D8', hi: '#FFFFFF', line: INK }); } }
    // claws held up, snipping; they snap forward to strike
    [-1, 1].forEach(q => { const sh2 = [CL * 0.55, q * CW * 0.62, hb + 1 * s], snip = Math.max(0, Math.sin(t * 3 + q)) * 0.3, el = add(sh2, [4 * s + S.hit * 6, q * 7 * s, 7 * s]), cl = add(el, [3 * s + S.hit * 8, q * 1 * s, 8 * s + Math.sin(t * 3 + q) * 1.4 - S.wind * 3]);
      tube([sh2, el], u => 3.6 * s, { col: shell, shade: shellSh, hi: shellHi, line: INK }); tube([el, cl], u => 3.4 * s, { col: shell, shade: shellSh, hi: shellHi, line: INK });
      const cs = [11, 13.5, 16][k - 1] * s, F2 = frame(cl, q * 0.25, -1.0, 0); ell(F2.at(cs * 0.3, 0, 0), [cs * 0.62, cs * 0.42, cs * 0.5], { B: F2.B, col: shell, shade: shellSh, hi: shellHi, line: INK, spec: 0.8 });
      ell(F2.at(cs * 0.95, 0, cs * 0.18 + snip * cs * 0.3), [cs * 0.45, cs * 0.22, cs * 0.18], { B: frame(cl, q * 0.25, -1.0 - snip, 0).B, col: shell, shade: shellSh, hi: shellHi, line: INK });
      ell(F2.at(cs * 0.9, 0, -cs * 0.2), [cs * 0.42, cs * 0.22, cs * 0.16], { B: F2.B, col: '#F2E6EA', shade: '#C8B0BA', hi: '#FFFFFF', line: INK });
      if (k === 3) fx(c => { const a2 = P(F2.at(cs, 0, cs * 0.4)), seed = Math.floor(t * 8) + q * 5, Rr = mulberry32(seed + 9); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = R.alpha; c.strokeStyle = cy; c.lineWidth = Math.max(1, R.u * 1.4); c.beginPath(); c.moveTo(a2[0], a2[1]); for (let i = 1; i < 6; i++) c.lineTo(a2[0] + q * i * 3 * R.u + (Rr() - 0.5) * 6 * R.u, a2[1] - i * 4 * R.u * s); c.stroke(); c.restore(); }); });
    // eyes on stalks, bobbing, lantern-cyan
    [-1, 1].forEach(q => { const b = [CL * 0.75, q * 5.5 * s, hb + CH * 0.5], tp = add(b, [1 * s, q * 1 * s, (9 + Math.sin(t * 2.2 + q) * 1.2) * s]); tube([b, tp], u => 1.8 * s, { col: shell, shade: shellSh, hi: shellHi, line: INK });
      sphere(tp, 4.6 * s, { col: '#1A3A4A', shade: '#0A1A24', hi: '#3A6A7A', line: INK, z: -0.4 }); eye(add(tp, [3 * s, 0, 0.4]), [1, q * 0.15, 0.1], 3.8 * s, { iris: '#2FC9DD', blink: o.blink, irisR: 0.86, white: '#E8FFFF', look: [0.2, 0.1] }); glowAt(tp, 10 * s, cy, 0.35 + k * 0.06); });
    mark([CL * 0.98, 0, hb + CH * 0.05], [1, 0, 0.2], 3 * s, (c, r) => { c.strokeStyle = INK; c.lineWidth = r * 0.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r, -r * 0.2); c.quadraticCurveTo(-r * 0.5, r * 0.5, 0, 0); c.quadraticCurveTo(r * 0.5, r * 0.5, r, -r * 0.2); c.stroke(); c.fillStyle = 'rgba(255,140,170,.5)'; [-1, 1].forEach(q => { c.beginPath(); c.ellipse(q * r * 2.4, -r * 0.4, r * 0.9, r * 0.55, 0, 0, TAU); c.fill(); }); });
    if (k === 3) for (let i = 0; i < 4; i++) { const ph2 = (t * 0.6 + i * 0.25) % 1; glowAt([(-6 + i * 4) * s, (i % 2 ? 1 : -1) * CW * 0.4, hb - CH - ph2 * 10 * s], 3 * s, cy, 0.8 * (1 - ph2)); }
  };
  MODELS.cancer.yaw = 0.3;

  /* Asmodeus (Scorpio): a round obsidian scorpion veined with embers, trailing red smoke, with a burning stinger */
  MODELS.scorpio = (k, t, o) => {
    const mv = clamp01(o.mv || 0), ph = o.ph || 0, s = [1.08, 1.2, 1.32][k - 1], S = strikeOf(o.atk, o.atkBig), ob = '#2A2230', obSh = '#141018', obHi = '#7A6A86', red = '#FF3B4E';
    const hb = 12 * s + Math.abs(Math.sin(ph * 2)) * mv, body = [0, 0, hb], BL = 13 * s, BW = 13 * s, BH = 9 * s;
    const veins = c => { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = red; c.lineWidth = Math.max(1, R.u * (1 + k * 0.3)); c.lineCap = 'round'; const R0 = mulberry32(13); for (let i = 0; i < 3 + k * 2; i++) { const a0 = R0() * TAU, pts = []; let x = (R0() - 0.5) * BL, y = (R0() - 0.5) * BW; for (let j = 0; j < 4; j++) { pts.push(P([x, y, hb + BH * 0.7])); x += Math.cos(a0 + j) * 4 * s; y += Math.sin(a0 + j) * 4 * s; } c.globalAlpha = R.alpha * (0.5 + 0.4 * Math.sin(t * 3 + i)); c.beginPath(); pts.forEach((p2, j) => j ? c.lineTo(p2[0], p2[1]) : c.moveTo(p2[0], p2[1])); c.stroke(); } c.restore(); };
    if (k >= 2) for (let i = 0; i < (k === 3 ? 7 : 4); i++) { const ph2 = (t * 0.4 + i * 0.19) % 1; glowAt([-BL * 0.5 + Math.sin(i * 9.7) * 10 * s, Math.cos(i * 3.1) * 8 * s, hb + ph2 * 30 * s], (6 + ph2 * 8) * s, '#C8142A', 0.25 * Math.sin(ph2 * Math.PI), true); }
    for (const q of [-1, 1]) for (let i = 0; i < 4; i++) { const p2 = ph * 2 + i * 1.6 + (q > 0 ? Math.PI : 0), lift = Math.max(0, Math.sin(p2)) * 3.5 * mv, sw = Math.cos(p2) * 0.5 * mv;
      bugLeg([(4 - i * 3.6) * s, q * BW * 0.62, hb - 1 * s], [(-0.1 - i * 0.18) * 6 * s, q * 0.95], 13 * s, lift, sw, 3.2 * s, { col: ob, shade: obSh, hi: obHi, line: INK, kh: 0.6 }); }
    // the tail: segments arching over the back to a burning stinger; it strikes forward
    const arch = S.hit * 0.9 - S.wind * 0.3, segs = 7, tail = []; for (let i = 0; i <= segs; i++) { const u = i / segs, a = -0.2 + u * (3.1 - arch * 0.8), r = (16 + u * 2) * s; tail.push([-BL * 0.6 - Math.sin(a) * r * 0.85 + u * u * arch * 14 * s, Math.sin(t * 2.6) * 2 * u, hb + 2 + (1 - Math.cos(a)) * r * 0.85]); }
    tail.forEach((p2, i) => { if (i === 0) return; sphere(p2, (6.2 - i * 0.45) * s, { col: ob, shade: obSh, hi: obHi, line: INK, spec: 0.6, z: 1 - i * 0.1 }); if (k === 3 && i % 2) tube([p2, add(p2, [0, 0, 5 * s])], u => 2 * s * (1 - u), { col: red, shade: '#A01428', hi: '#FFB0B8', line: INK }); });
    const st = tail[segs], sd = norm(sub(st, tail[segs - 1])), sp2 = add(st, add(mul(sd, 7 * s), [3 * s, 0, -3 * s])); tube([st, mix3(st, sp2, 0.5), sp2], u => 3.6 * s * (1 - u * 0.85), { col: red, shade: '#A01428', hi: '#FFB0B8', line: INK, glowCol: '#FFD0D8', glowA: 0.5, z: 0.5 }); glowAt(sp2, (8 + k * 2) * s, red, 0.8);
    ell(body, [BL, BW, BH], { col: ob, shade: obSh, hi: obHi, line: INK, spec: 0.8, inner: veins });
    // pincers out front
    [-1, 1].forEach(q => { const sh2 = [BL * 0.6, q * BW * 0.55, hb], el = add(sh2, [7 * s + S.hit * 6, q * 7 * s, 2 * s]), cl = add(el, [8 * s + S.hit * 6, q * 1 * s, 2 * s]), snip = Math.max(0, Math.sin(t * 3.4 + q)) * 0.35;
      tube([sh2, el, cl], u => 3 * s, { col: ob, shade: obSh, hi: obHi, line: INK }); const F2 = frame(cl, q * 0.25, 0, 0), cs = (8 + k) * s;
      ell(F2.at(cs * 0.3, 0, 0), [cs * 0.6, cs * 0.45, cs * 0.42], { B: F2.B, col: ob, shade: obSh, hi: obHi, line: INK, spec: 0.7 });
      ell(F2.at(cs * 0.95, q * cs * 0.15, 0), [cs * 0.5, cs * 0.18, cs * 0.18], { B: frame(cl, q * (0.25 + snip), 0, 0).B, col: ob, shade: obSh, hi: obHi, line: INK });
      ell(F2.at(cs * 0.95, -q * cs * 0.2, 0), [cs * 0.48, cs * 0.18, cs * 0.18], { B: frame(cl, q * (0.25 - snip), 0, 0).B, col: ob, shade: obSh, hi: obHi, line: INK }); });
    // big ember eyes
    [-1, 1].forEach(q => { const ep = [BL * 0.82, q * 4.2 * s, hb + BH * 0.42]; eye(ep, [0.8, q * 0.5, 0.35], 4.2 * s, { iris: red, blink: o.blink, irisR: 0.86, white: '#FFE8EA', lid: k === 3 ? 0.18 : 0, lidCol: ob, look: [0.2, 0.15] }); glowAt(ep, 7 * s, red, 0.35); });
    if (k >= 2) for (let i = 0; i < 3; i++) { const a = (i - 1) * 0.5; tube([[Math.cos(a) * BL * 0.2, Math.sin(a) * BW * 0.4, hb + BH * 0.85], [Math.cos(a) * BL * 0.2 - 1, Math.sin(a) * BW * 0.45, hb + BH * 0.85 + (k === 3 ? 6 : 3.5) * s]], u => 2.2 * s * (1 - u), { col: red, shade: '#A01428', hi: '#FFB0B8', line: INK }); }
  };

  /* Michael (Leo): a sun sprite. A round cat-faced cub of dawn whose mane is a corona of sun petals, riding a little cloud;
     it grows wings of dawn and a shield of light, then gold armour, a lance and a blazing sun disc behind it */
  MODELS.scorpio.yaw = 0.42;
  MODELS.leo = (k, t, o) => {
    const s = [1.08, 1.18, 1.28][k - 1], S = strikeOf(o.atk, o.atkBig), fur = '#FFC979', furSh = '#E8863C', furHi = '#FFE8B8', belly = '#FFF0D2', petA = '#FF9F2E', petB = '#FFD24A', gold = '#F2C65A', goldSh = '#B8862A';
    const lean = S.hit * 5 - S.wind * 2, hb = 18 * s, body = [lean * 0.5, 0, hb];
    // the cloud it rides
    const cw = [17, 20, 24][k - 1] * s; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = cw * (0.62 + (i % 2) * 0.15); sphere([Math.cos(a) * rr * 0.8, Math.sin(a) * rr * 0.65, 3 * s + Math.sin(t * 2 + i) * 0.5], (6 + (i % 3)) * s, { col: '#FFF6F2', shade: '#F2C8BC', hi: '#FFFFFF', line: '#C8907E' }); }
    sphere([0, 0, 5 * s], 9 * s, { col: '#FFF6F2', shade: '#F2C8BC', hi: '#FFFFFF', line: '#C8907E' }); glowAt([0, 0, 4 * s], cw * 1.2, '#FFE3A8', 0.25, true);
    if (k === 3) fx(c => { const q = P([-10 * s, 0, 44 * s]); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = R.alpha * 0.5; blitSized(c, glowSprite('#FFC24D'), q[0] - 70 * R.u * s, q[1] - 70 * R.u * s, 140 * R.u * s, 140 * R.u * s); c.restore(); }, true);
    if (k === 3) { const dc = [-10 * s, 0, 44 * s]; fx(c => { const q = P(dc); c.save(); c.globalAlpha = R.alpha * 0.9; c.translate(q[0], q[1]); c.rotate(t * 0.15); c.fillStyle = '#FFD36B'; c.strokeStyle = '#B8742A'; c.lineWidth = Math.max(1, R.u * 1.2); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, L2 = (i % 2 ? 30 : 42) * R.u * s; c.beginPath(); c.moveTo(Math.cos(a - 0.12) * 24 * R.u * s, Math.sin(a - 0.12) * 24 * R.u * s); c.lineTo(Math.cos(a) * L2, Math.sin(a) * L2); c.lineTo(Math.cos(a + 0.12) * 24 * R.u * s, Math.sin(a + 0.12) * 24 * R.u * s); c.fill(); c.stroke(); } c.beginPath(); c.arc(0, 0, 26 * R.u * s, 0, TAU); c.fillStyle = '#FFE9A0'; c.fill(); c.stroke(); c.restore(); }, true); }
    // wings of dawn
    if (k >= 2) [-1, 1].forEach(q => wing([body[0] - 3 * s, q * 8 * s, hb + 8 * s], q, (k === 3 ? 34 : 24) * s, Math.sin(t * 3.4 + q * 0.3) * 0.12, 0.7, ['#FFFFFF', '#FFF0D6', '#FFC98A'], { n: k === 3 ? 8 : 6, rows: 2, z: 6 }));
    // the body, sitting, with a sunny belly
    ell(body, [11 * s, 12 * s, 12.5 * s], { col: fur, shade: furSh, hi: furHi, line: '#8A4A1A', spec: 0.4 });
    ell(add(body, [8 * s, 0, -1 * s]), [4 * s, 8 * s, 8.5 * s], { col: belly, shade: '#F2C890', hi: '#FFFFFF', line: false, z: -1 });
    [-1, 1].forEach(q => { sphere([body[0] + 9 * s, q * 6 * s, 6 * s], 4.4 * s, { col: fur, shade: furSh, hi: furHi, line: '#8A4A1A' }); sphere([body[0] - 2 * s, q * 9 * s, 5 * s], 5.2 * s, { col: fur, shade: furSh, hi: furHi, line: '#8A4A1A' }); });
    if (k === 3) { [-1, 1].forEach(q => ell([body[0] + 1 * s, q * 10 * s, hb + 9 * s], [6 * s, 5 * s, 3.5 * s], { col: gold, shade: goldSh, hi: '#FFF0B0', line: INK, spec: 0.8 })); mark([body[0] + 11 * s, 0, hb + 3 * s], [1, 0, 0.1], 6 * s, (c, r) => { c.fillStyle = gold; c.strokeStyle = INK; c.lineWidth = r * 0.1; c.beginPath(); c.moveTo(-r, -r); c.lineTo(r, -r); c.lineTo(r * 0.9, r * 0.2); c.lineTo(0, r); c.lineTo(-r * 0.9, r * 0.2); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#FF9F43'; c.beginPath(); c.arc(0, -r * 0.2, r * 0.3, 0, TAU); c.fill(); }); }
    // the tail with a star (then a comet flame) at the tip
    const tw = Math.sin(t * 2.4) * 3, tp = bez3([body[0] - 9 * s, 0, 8 * s], [body[0] - 18 * s, tw * 0.5, 7 * s], [body[0] - 20 * s, tw, 18 * s], [body[0] - 15 * s, tw * 1.3, 26 * s], 8);
    tube(tp, u => (3.2 - u * 1.2) * s, { col: fur, shade: furSh, hi: furHi, line: '#8A4A1A', z: 4 });
    if (k === 1) mark(tp[8], [0.3, 0, 1], 4 * s, (c, r) => { c.fillStyle = petB; c.strokeStyle = '#B8862A'; c.lineWidth = r * 0.15; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, rr = i % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke(); }); else flame(tp[8], 3.4, 12, 3, ['#FFB020', '#FFD24A', '#FFF8D8'], { line: '#B8742A' });
    glowAt(tp[8], 8 * s, '#FFE37A', 0.6);
    // the shield of light (and a lance on the last form)
    if (k >= 2) { const sc = [body[0] + 8 * s, -15 * s, hb + 2 * s], sr = (k === 3 ? 11 : 9) * s; ell(sc, [1.6 * s, sr, sr * 1.1], { col: gold, shade: goldSh, hi: '#FFF0B0', line: INK, spec: 0.7, z: -3 });
      mark(add(sc, [1.8 * s, 0, 0]), [1, -0.35, 0], sr * 0.78, (c, r) => { c.fillStyle = '#FFF8E0'; c.beginPath(); c.ellipse(0, 0, r, r * 1.08, 0, 0, TAU); c.fill(); c.fillStyle = '#FFC24D'; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = i % 2 ? r * 0.3 : r * 0.68; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.fillStyle = '#FFF3C2'; c.beginPath(); c.arc(0, 0, r * 0.25, 0, TAU); c.fill(); }, -3.5); glowAt(sc, sr * 1.6, '#FFE37A', 0.3 + 0.12 * Math.sin(t * 2.6)); }
    if (k === 3) { const lb = [body[0] + 6 * s, 15 * s, 4 * s], lt = [body[0] + 9 * s, 15 * s, 62 * s]; tube([lb, lt], u => 1.6 * s, { col: gold, shade: goldSh, hi: '#FFF0B0', line: INK }); const tipP = add(lt, [0, 0, 5 * s]); blob([add(lt, [0, -3 * s, 0]), tipP, add(lt, [0, 3 * s, 0]), add(lt, [0, 0, -2 * s])], { col: '#FFF3C2', shade: '#F2C66A', hi: '#FFFFFF', line: '#B8862A', sharp: true }); glowAt(tipP, 10 * s, '#FFE37A', 0.8); }
    // the head: big, round and sunny, ringed by a corona of petals
    const hr = 14.5 * s, F = frame([body[0] + 4 * s + lean * 0.4, 0, hb + 19 * s + Math.sin(t * 2.2) * 0.8], Math.sin(t * 0.8) * 0.22, Math.sin(t * 1.2) * 0.05 + S.hit * 0.12, Math.sin(t * 0.9) * 0.08), at = F.at;
    const pn = [11, 14, 17][k - 1], pl = [12, 15, 18][k - 1] * s;
    for (const [ring, col, len, off] of [[1.0, petA, pl, 0], [0.92, petB, pl * 0.66, 0.5]]) for (let i = 0; i < pn; i++) { const a = (i + off) / pn * TAU + Math.sin(t * 1.5 + i) * 0.04, d = norm(F.dir(-0.25, Math.cos(a), Math.sin(a))), b = add(F.c, mul(d, hr * ring * 0.85)), tip = add(b, mul(d, len * (0.9 + 0.2 * Math.sin(i * 2.7)))), wv = mul(norm(cross(d, F.B[0])), len * 0.32);
      blob([sub(b, wv), add(mix3(b, tip, 0.5), mul(wv, 1.05)), tip, sub(mix3(b, tip, 0.5), mul(wv, 1.05)), add(b, wv)], { col, shade: sh(col, -0.22), hi: sh(col, 0.35), line: '#B8742A', z: 6 + (ring < 1 ? -0.5 : 0) }); }
    ell(F.c, [hr * 0.9, hr, hr * 0.92], { B: F.B, col: fur, shade: furSh, hi: furHi, line: '#8A4A1A', spec: 0.5 });
    ell(at(hr * 0.55, 0, -hr * 0.42), [hr * 0.45, hr * 0.6, hr * 0.38], { B: F.B, col: belly, shade: '#F2C890', hi: '#FFFFFF', line: false });
    [-1, 1].forEach(q => { const eb = at(-hr * 0.05, q * hr * 0.55, hr * 0.7), et = at(-hr * 0.05, q * hr * 0.85, hr * 1.2), wv = F.dir(0.25 * hr, 0, 0); blob([sub(eb, mul(wv, 1.2)), et, add(eb, mul(wv, 1.2)), add(eb, [0, 0, -2])], { col: fur, shade: furSh, hi: furHi, line: '#8A4A1A', z: 1 }); blob([sub(eb, mul(wv, 0.6)), mix3(eb, et, 0.75), add(eb, mul(wv, 0.6))], { col: '#FFB3A8', shade: '#E08A80', hi: false, line: false, z: 0.8 });
      eye(at(hr * 0.68, q * hr * 0.38, hr * 0.02), F.dir(0.78, q * 0.55, 0.05), 4.7 * s, { iris: '#E8902A', blink: o.blink, irisR: 0.9, white: '#FFFFFF', line: '#5A2E10', look: [0.2, 0.1] });
      mark(at(hr * 0.55, q * hr * 0.66, -hr * 0.32), F.dir(0.55, q * 0.8, -0.2), 3.4 * s, (c, r) => { c.fillStyle = 'rgba(255,138,144,.6)'; c.beginPath(); c.ellipse(0, 0, r, r * 0.6, 0, 0, TAU); c.fill(); }); });
    mark(at(hr * 0.95, 0, -hr * 0.28), F.B[0], 2.2 * s, (c, r) => { c.fillStyle = '#FF8FA0'; c.strokeStyle = '#A8505A'; c.lineWidth = r * 0.2; c.beginPath(); c.moveTo(-r, -r * 0.4); c.lineTo(r, -r * 0.4); c.lineTo(0, r * 0.5); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = '#5A2E10'; c.lineWidth = r * 0.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, r * 0.5); c.lineTo(0, r); c.moveTo(-r, r * 1.2); c.quadraticCurveTo(-r * 0.5, r * 1.7, 0, r * 1); c.quadraticCurveTo(r * 0.5, r * 1.7, r, r * 1.2); c.stroke(); });
    const bm = at(hr * 0.72, 0, hr * 0.55); if (k === 1) { sphere(bm, 1.4 * s, { col: petB, shade: '#E0A030', hi: '#FFFFFF', line: '#B8862A', z: -1 }); glowAt(bm, 5 * s, '#FFE37A', 0.6); } else { mark(bm, F.dir(0.7, 0, 0.7), 3.4 * s, (c, r) => { c.fillStyle = gold; c.strokeStyle = '#8A5A12'; c.lineWidth = r * 0.12; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = i % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke(); if (k === 3) { c.fillStyle = '#FF9F43'; c.beginPath(); c.arc(0, 0, r * 0.35, 0, TAU); c.fill(); } }); glowAt(bm, 8 * s, '#FFE37A', 0.6); }
    if (k === 3) for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.32, b = add(F.c, F.dir(-0.1, Math.sin(a) * hr * 1.0, Math.cos(a) * hr * 1.0)), tp2 = add(b, F.dir(0, Math.sin(a) * (i === 2 ? 9 : 6) * s, Math.cos(a) * (i === 2 ? 9 : 6) * s)); blob([add(b, F.dir(0, -2 * s, 0)), tp2, add(b, F.dir(0, 2 * s, 0))], { col: '#FFF3C2', shade: '#F2D06A', hi: '#FFFFFF', line: '#B8862A', sharp: true, z: 5 }); }
  };

  /* Uriel (Libra): a fluffy celestial owl of the balance: one wing of starry night, one of golden day, a sun-gold eye and a
     moon-silver eye, the scales of judgement floating overhead; the great seer opens a third eye on its brow */
  MODELS.libra = (k, t, o) => {
    const s = [1.12, 1.25, 1.4][k - 1], S = strikeOf(o.atk, o.atkBig), fawn = '#E2B074', fawnSh = '#B07A44', fawnHi = '#FFE0B0', cream = '#FFF4DE', gold = '#F2C65A', goldSh = '#B8862A', sun = '#FFB020', moon = '#8FCBFF', sapph = '#3A7AFF';
    const hb = 17 * s, body = [S.hit * 3, 0, hb], br = 15 * s, flap = Math.sin(t * 2.6) * 0.1 + S.hit * 0.4;
    if (k === 3) { glowAt([-4 * s, 0, 44 * s], 46 * s, '#FFE9A8', 0.4, true); fx(c => { const q = P([-6 * s, 0, 44 * s]); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = R.alpha * 0.8; c.strokeStyle = '#FFD36B'; c.lineWidth = Math.max(1.5, R.u * 2.2); c.beginPath(); c.arc(q[0], q[1], 26 * R.u * s, 0, TAU); c.stroke(); c.restore(); }, true); }
    // wings: night on one side, day on the other, opening wider as it grows
    const WS = [14, 24, 36][k - 1] * s, sp = [0.15, 0.6, 0.95][k - 1];
    wing([body[0] - 2 * s, -br * 0.75, hb + 6 * s], -1, WS, flap, sp, ['#2C3A84', '#1C2256', '#5266C8'], { n: 7, rows: 3, line: '#0E1236', z: 4 });
    wing([body[0] - 2 * s, br * 0.75, hb + 6 * s], 1, WS, flap, sp, ['#F6D592', '#FFF4DC', '#E9A84A'], { n: 7, rows: 3, line: '#7A5420', z: 4 });
    fx(c => { const R0 = mulberry32(11); for (let i = 0; i < 4 + k * 4; i++) { const q = P([body[0] - 6 * s - R0() * WS * 0.4, -br * 0.8 - R0() * WS * 0.7, hb + 2 * s + R0() * WS * 0.6]), a = 0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i * 1.7)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = R.alpha * a; blitSized(c, glowSprite('#BFD8FF'), q[0] - 3 * R.u, q[1] - 3 * R.u, 6 * R.u, 6 * R.u); c.restore(); } });
    // one soft round body, a pale barred chest, little orange feet
    ell(body, [br * 0.92, br, br], { col: fawn, shade: fawnSh, hi: fawnHi, line: '#6A4220', spec: 0.25 });
    ell(add(body, [br * 0.6, 0, -2 * s]), [br * 0.42, br * 0.66, br * 0.72], { col: cream, shade: '#EAD2B0', hi: '#FFFFFF', line: false, z: -1, inner: c => { c.strokeStyle = 'rgba(154,102,52,.5)'; c.lineWidth = Math.max(1, R.u * s); c.lineCap = 'round'; for (let row = 0; row < 4; row++) for (let j = -2; j <= 2; j++) { const q = P(add(body, [br * 0.95, (j * 3.6 + (row % 2) * 1.8) * s, -2 * s + (2 - row) * 3.5 * s])); c.beginPath(); c.moveTo(q[0] - 1.6 * R.u * s, q[1] - R.u * s); c.quadraticCurveTo(q[0], q[1] + 0.8 * R.u * s, q[0] + 1.6 * R.u * s, q[1] - R.u * s); c.stroke(); } } });
    [-1, 1].forEach(q => { for (let i = -1; i <= 1; i++) ell([body[0] + br * 0.55 + Math.abs(i) * -0.8, q * 5.5 * s + i * 1.5 * s, 1.4 * s], [2.6 * s, 1.2 * s, 1.2 * s], { col: '#F2A85A', shade: '#C87830', hi: '#FFD8A0', line: '#8A4A1A', yaw: i * 0.4 }); });
    // the head: tufted ears, the facial disc, the sun eye and the moon eye, a little hooked beak
    const hr = 13.5 * s, F = frame([body[0] + 2 * s, 0, hb + br * 1.08 + Math.sin(t * 1.6) * 0.6], Math.sin(t * 0.6) * 0.35 + Math.sin(t * 2.7) * 0.03, S.hit * 0.15, Math.sin(t * 0.8) * 0.12), at = F.at;
    ell(F.c, [hr * 0.88, hr * 1.02, hr * 0.92], { B: F.B, col: fawn, shade: fawnSh, hi: fawnHi, line: '#6A4220', spec: 0.25 });
    [-1, 1].forEach(q => { [[0, 1], [0.3, 0.78]].forEach(([da, kk]) => { const b = at(-hr * 0.1, q * hr * 0.55, hr * 0.7), tp2 = at(-hr * 0.2 - da * hr * 0.3, q * hr * (0.75 + da * 0.2), hr * (1.25 + (k === 3 ? 0.25 : 0)) * kk + hr * 0.2); blob([at(-hr * 0.1, q * hr * 0.35, hr * 0.75), tp2, at(-hr * 0.15, q * hr * 0.8, hr * 0.55)], { col: da ? fawn : fawnSh, shade: sh(fawnSh, -0.2), hi: fawnHi, line: '#6A4220', z: 1 + da * 0.2 }); }); });
    // the facial disc stands out from the head as a shallow dish, its fine feathers radiating from each eye
    const dc = at(hr * 0.5, 0, -hr * 0.02);
    ell(dc, [hr * 0.44, hr * 0.88, hr * 0.76], { B: F.B, col: '#FFF9EE', shade: '#EAD2B0', hi: '#FFFFFF', line: k === 3 ? '#C8962A' : '#B88A5A', lw: Math.max(1, R.u * (k === 3 ? 2 : 1.4)), d2: 0.22, spec: false });
    mark(at(hr * 0.93, 0, -hr * 0.02), F.B[0], hr * 0.8, (c, r) => { c.strokeStyle = 'rgba(160,110,60,.28)'; c.lineWidth = r * 0.03; [-1, 1].forEach(q => { for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; c.beginPath(); c.moveTo(q * r * 0.46 + Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34); c.lineTo(q * r * 0.46 + Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5); c.stroke(); } }); }, 0.2);
    [[-1, sun, '#4A2A10'], [1, moon, '#1A2A50']].forEach(([q, col, ln]) => { const ep = at(hr * 0.9, q * hr * 0.38, hr * 0.06); eye(ep, F.dir(0.9, q * 0.4, 0.05), 4.6 * s, { iris: col, blink: o.blink, irisR: 0.88, line: ln, look: [0.15, 0.1] }); if (k >= 2) glowAt(ep, 8 * s, col, 0.25 + k * 0.06); });
    // a cute little beak: a round little base and a short hook curling down
    { const bc = '#F2C26A', bs = '#C8903A', bh = '#FFF0C8', bl = '#6A4A1A';
      ell(at(hr * 0.96, 0, -hr * 0.16), [2.6 * s, 2.5 * s, 2.3 * s], { B: F.B, col: bc, shade: bs, hi: bh, line: bl, spec: 0.6, z: -1.2 });
      tube([at(hr * 1.02, 0, -hr * 0.14), at(hr * 1.16, 0, -hr * 0.2), at(hr * 1.18, 0, -hr * 0.34), at(hr * 1.11, 0, -hr * 0.43)], u => (2.3 - u * 1.7) * s, { col: bc, shade: bs, hi: bh, line: bl, z: -1.4 }); }
    [-1, 1].forEach(q => mark(at(hr * 0.78, q * hr * 0.64, -hr * 0.3), F.dir(0.75, q * 0.65, -0.2), 2.8 * s, (c, r) => { c.fillStyle = 'rgba(255,154,168,.55)'; c.beginPath(); c.ellipse(0, 0, r, r * 0.6, 0, 0, TAU); c.fill(); }));
    if (k >= 2) { const te = at(hr * 0.8, 0, hr * 0.56); eye(te, F.dir(0.8, 0, 0.55), 2.2 * s, { iris: sapph, blink: o.blink, tall: 1.5, irisR: 0.9, line: '#1A2A60' }); glowAt(te, 8 * s, '#7FB0FF', 0.6); }
    // the scales: a pendant on the owlet; floating over its head after, tipping, with the sun and the moon in the pans
    const pan = (c3, r, orb) => { fx(c => { const q = P(c3), rr = r * R.u; c.save(); c.globalAlpha = R.alpha; c.strokeStyle = gold; c.lineWidth = Math.max(0.8, R.u * 0.8); c.setLineDash([2 * R.u, 1.5 * R.u]); c.beginPath(); c.moveTo(q[0], q[1] - rr * 1.6); c.lineTo(q[0] - rr * 0.9, q[1]); c.moveTo(q[0], q[1] - rr * 1.6); c.lineTo(q[0] + rr * 0.9, q[1]); c.stroke(); c.setLineDash([]); c.fillStyle = gold; c.strokeStyle = INK; c.lineWidth = Math.max(1, R.u); c.beginPath(); c.moveTo(q[0] - rr, q[1]); c.quadraticCurveTo(q[0], q[1] + rr, q[0] + rr, q[1]); c.closePath(); c.fill(); c.stroke(); c.fillStyle = orb; c.beginPath(); c.arc(q[0], q[1] - rr * 0.35, rr * 0.42, 0, TAU); c.fill(); c.stroke(); c.restore(); }); glowAt(sub(c3, [0, 0, -r * 0.3]), r * 1.6, orb, 0.6); };
    if (k === 1) { const pc = [body[0] + br * 0.98, 0, hb + 2 * s]; pan(add(pc, [0, -4 * s, -2 * s]), 2.6 * s, sun); pan(add(pc, [0, 4 * s, -2 * s]), 2.6 * s, moon); }
    else { const tilt = Math.sin(t * 1.4) * (k === 3 ? 3 : 2.2) * s, X = (k === 3 ? 26 : 20) * s, top = F.c[2] + hr * 1.35 + (k === 3 ? 10 : 6) * s + Math.sin(t * 1.6) * 1.2, bc = [F.c[0] - 2 * s, 0, top];
      tube([add(bc, [0, -X, -tilt]), add(bc, [0, X, tilt])], u => 0.9 * s, { col: gold, shade: goldSh, hi: '#FFF0B0', line: INK, z: -10 }); sphere(add(bc, [0, 0, 1.5 * s]), 2.2 * s, { col: sapph, shade: '#1A4ACA', hi: '#C8DCFF', line: INK, spec: 0.9, z: -10 }); glowAt(bc, 8 * s, '#7FB0FF', 0.6);
      pan(add(bc, [0, -X, -tilt - 7 * s]), (k === 3 ? 6.5 : 5) * s, sun); pan(add(bc, [0, X, tilt - 7 * s]), (k === 3 ? 6.5 : 5) * s, moon); }
  };

  // an ellipsoid laid along a direction (fish bodies, plumes): a basis whose forward is dir
  function along(dir, up) { const F = norm(dir); let S2 = cross(up || [0, 0, 1], F); if (Math.hypot(...S2) < 1e-3) S2 = [0, 1, 0]; S2 = norm(S2); const U = cross(F, S2); return [F, S2, U]; }
  H.along = along;
  // a rose: a cluster of petal puffs with a darker heart
  function rose(c3, r, col, o) { const R0 = mulberry32(5); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; sphere(add(c3, [Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, Math.sin(a * 2) * r * 0.1]), r * 0.55, { col, shade: sh(col, -0.25), hi: sh(col, 0.3), line: sh(col, -0.6), z: (o && o.z) || 0 }); } sphere(c3, r * 0.5, { col: sh(col, -0.15), shade: sh(col, -0.4), hi: col, line: sh(col, -0.6), z: ((o && o.z) || 0) - 0.5 }); }
  H.rose = rose;

  /* Gabriel (Virgo): a smooth porcelain bird of the dawn. A round rosebud chick grows into a tall seraph bird whose arched
     wings pour down in long streamers, with flowing tail fins, crest plumes and rose-gold marks; at last two pairs of wings */
  MODELS.virgo = (k, t, o) => {
    const s = [1.15, 1.08, 1.18][k - 1], S = strikeOf(o.atk, o.atkBig), pearl = '#F8F3FC', pearlSh = '#C8B4E2', pearlHi = '#FFFFFF', rose2 = '#FFB3D9', roseSh = '#D07AA8', gold = '#F2C65A', ln = '#6A4A7A';
    // the snout: a smooth porcelain muzzle pushing out from the face, the little orange beak at its tip, nostrils on top
    const beak = (F, at, hr) => {
      ell(at(hr * 0.78, 0, -hr * 0.26), [hr * 0.5, hr * 0.44, hr * 0.36], { B: F.B, col: pearl, shade: pearlSh, hi: pearlHi, line: ln, spec: 0.5, z: -0.8 });
      ell(at(hr * 1.22, 0, -hr * 0.27), [hr * 0.24, hr * 0.26, hr * 0.17], { B: F.B, col: '#FFB86A', shade: '#E0843A', hi: '#FFE0B0', line: '#B8642A', spec: 0.6, z: -1.2 });
      ell(at(hr * 1.14, 0, -hr * 0.42), [hr * 0.18, hr * 0.2, hr * 0.09], { B: F.B, col: '#F29A50', shade: '#C86A2A', hi: '#FFD0A0', line: '#B8642A', z: -1.1 });
      [-1, 1].forEach(q => mark(at(hr * 1.1, q * hr * 0.12, -hr * 0.12), F.dir(0.5, q * 0.2, 0.85), 0.9 * hr * 0.1 + 0.4, (c, r) => { c.fillStyle = '#8A2E52'; c.beginPath(); c.ellipse(0, 0, r, r * 0.6, 0, 0, TAU); c.fill(); }, -1.3));
      mark(at(hr * 1.2, 0, -hr * 0.36), F.B[0], hr * 0.16, (c, r) => { c.strokeStyle = '#8A3A1A'; c.lineWidth = r * 0.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(0, r * 0.5, r, 0); c.stroke(); }, -1.4);
    };
    const dotEye = (p, n, r) => eye(p, n, r, { iris: '#2A1E34', white: '#2A1E34', irisR: 0.98, pupilR: 0.6, blink: o.blink, look: [0.1, 0], line: '#120818' });
    if (k === 1) {
      const hb = 15 * s + Math.sin(t * 2) * 0.6, flap = Math.sin(t * 5) * 0.4;
      [-1, 1].forEach(q => { const sh2 = [0, q * 12 * s, hb + 3 * s], tip = add(sh2, [-6 * s, q * 6 * s, -4 * s + flap * q * 0 + Math.sin(t * 5 + q) * 3 * s]); blob([sh2, add(mix3(sh2, tip, 0.5), [4 * s, 0, 3 * s]), tip, add(mix3(sh2, tip, 0.5), [-3 * s, 0, -3 * s])], { col: pearl, shade: pearlSh, hi: pearlHi, line: ln, z: 1 }); });
      [-1, 0, 1].forEach(q => { const b = [-10 * s, q * 4 * s, hb - 4 * s]; blob([add(b, [0, -2.5 * s, 0]), add(b, [-5 * s, q * 3 * s, -9 * s - (q ? 0 : 3 * s)]), add(b, [0, 2.5 * s, 0])], { col: rose2, shade: roseSh, hi: '#FFE0F0', line: ln, z: 3 }); });
      [-1, 1].forEach(q => ell([3 * s, q * 5 * s, 1.5 * s], [4 * s, 2.4 * s, 1.4 * s], { col: '#FFB07A', shade: '#E08048', hi: '#FFD8B0', line: '#8A4A1A' }));
      ell([0, 0, hb], [13 * s, 13.5 * s, 14 * s], { col: pearl, shade: pearlSh, hi: pearlHi, line: ln, spec: 0.7, specR: 0.2 });
      const F = frame([4 * s, 0, hb + 17 * s], Math.sin(t * 0.9) * 0.25, Math.sin(t * 1.5) * 0.06 + S.hit * 0.2, Math.sin(t * 1.2) * 0.1), at = F.at, hr = 11 * s;
      ell(F.c, [hr, hr, hr * 0.95], { B: F.B, col: pearl, shade: pearlSh, hi: pearlHi, line: ln, spec: 0.7 });
      rose(at(0, 0, hr * 1.02), 3.6 * s, '#FFB3CF', { z: -1 }); [-1, 1].forEach(q => blob([at(0, 0, hr * 0.95), at(-2 * s, q * 6 * s, hr * 1.2), at(1 * s, q * 3 * s, hr * 1.05)], { col: '#6BAF7A', shade: '#4A8A5A', hi: '#A8E0B0', line: '#2A5A3A', z: 0 }));
      [-1, 1].forEach(q => { dotEye(at(hr * 0.8, q * hr * 0.44, hr * 0.14), F.dir(0.85, q * 0.45, 0.12), 3.4 * s); mark(at(hr * 0.62, q * hr * 0.7, -hr * 0.22), F.dir(0.6, q * 0.75, -0.2), 3 * s, (c, r) => { c.fillStyle = 'rgba(255,140,180,.55)'; c.beginPath(); c.ellipse(0, 0, r, r * 0.6, 0, 0, TAU); c.fill(); }); });
      beak(F, at, hr);
      return;
    }
    const hb = 30 * s + Math.sin(t * 1.6) * 1.2, flap = Math.sin(t * 2.2) * 0.14 + S.hit * 0.3, torso = [S.hit * 3, 0, hb];
    // wings: an arch from the shoulder, sheets of feathers hanging beneath, a long streamer to the ground
    const span = (k === 3 ? 46 : 38) * s; [-1, 1].forEach(q => { const W2 = wing([torso[0] - 2 * s, q * 6 * s, hb + 10 * s], q, span, flap, 0.95, [pearl, '#FFE6F4', k === 3 ? '#A8E6FF' : '#E8D0FF'], { n: 8, rows: k === 3 ? 2 : 3, line: ln, z: 6, armW: 4 * s, fw: 0.2 });
      const sl = W2.tip, st = bez3(sl, add(sl, [-2 * s, q * 3 * s, -12 * s]), add(sl, [-5 * s, q * 1 * s, -24 * s]), add(sl, [-3 * s, q * 4 * s, -34 * s + Math.sin(t * 2 + q) * 3]), 8); tube(st, u => (3.2 - u * 2.4) * s, { col: '#FFE6F4', shade: roseSh, hi: '#FFFFFF', line: ln, z: 6.5 }); glowAt(st[8], 7 * s, k === 3 ? '#A8E6FF' : '#FFC2E2', 0.5);
      if (k === 3) wing([torso[0] - 1 * s, q * 5 * s, hb - 6 * s], q, span * 0.6, -flap * 0.8, 0.5, ['#EFE8FF', '#D9B8FF', '#A8E6FF'], { n: 6, rows: 2, line: ln, z: 6.8, armW: 3 * s }); });
    // tail fins flowing beneath the body
    [[-0.65, 20], [0.65, 20], [-0.3, 27], [0.3, 27], [0, 32]].forEach(([a, len], i) => { const b = [torso[0] - 4 * s, a * 6 * s, hb - 10 * s], sw = Math.sin(t * 2.4 + i) * 2, tp = [b, add(b, [-3 * s, a * 6 * s + sw * 0.5, -len * s * 0.5]), add(b, [-2 * s + sw, a * 10 * s, -len * s])]; tube(tp, u => (3.6 - u * 2.6) * s, { col: rose2, shade: roseSh, hi: '#FFFFFF', line: ln, z: 2 }); if (k === 3) glowAt(tp[2], 4 * s, gold, 0.5); });
    ell(torso, [8.5 * s, 9 * s, 14 * s], { col: pearl, shade: pearlSh, hi: pearlHi, line: ln, spec: 0.6, inner: c => { const a2 = P(add(torso, [8 * s, -3 * s, 6 * s])), b2 = P(add(torso, [8 * s, -5 * s, -6 * s])), a3 = P(add(torso, [8 * s, 3 * s, 6 * s])), b3 = P(add(torso, [8 * s, 5 * s, -6 * s])); c.strokeStyle = '#E07AAE'; c.lineWidth = Math.max(1, R.u * 1.4); c.lineCap = 'round'; c.beginPath(); c.moveTo(a2[0], a2[1]); c.quadraticCurveTo(b2[0] - 4 * R.u, (a2[1] + b2[1]) / 2, b2[0], b2[1]); c.moveTo(a3[0], a3[1]); c.quadraticCurveTo(b3[0] + 4 * R.u, (a3[1] + b3[1]) / 2, b3[0], b3[1]); c.stroke(); } });
    const gm = add(torso, [8.4 * s, 0, 5 * s]); sphere(gm, 2.4 * s, { col: '#FF8FC0', shade: '#D0508A', hi: '#FFE0F0', line: ln, spec: 0.9, z: -1 }); glowAt(gm, 8 * s, '#FF8FC0', 0.5);
    // the neck and head with crest plumes swept back
    const nb = add(torso, [3 * s, 0, 12 * s]), F = frame(add(torso, [5 * s, 0, 25 * s + Math.sin(t * 1.6 + 0.5) * 0.8]), Math.sin(t * 0.8) * 0.25, Math.sin(t * 1.3) * 0.06 + S.hit * 0.25, Math.sin(t) * 0.08), at = F.at, hr = 9.5 * s;
    tube([nb, mix3(nb, F.c, 0.5), F.c], u => (5.5 - u * 1.2) * s, { col: pearl, shade: pearlSh, hi: pearlHi, line: ln });
    [[-0.5, 13, rose2], [0, 17, gold], [0.5, 13, rose2]].forEach(([a, len, col], i) => { const b = at(-hr * 0.2, a * hr * 0.4, hr * 0.8), tp = add(b, F.dir(-len * s * 0.6, a * 4 * s, len * s * 0.75 + Math.sin(t * 2 + i) * 0.8)); blob([at(-hr * 0.1, a * hr * 0.4 - 2 * s, hr * 0.7), add(mix3(b, tp, 0.5), F.dir(2 * s, 0, 2 * s)), tp, add(mix3(b, tp, 0.5), F.dir(-1.5 * s, 0, -1.5 * s)), at(-hr * 0.3, a * hr * 0.4 + 2 * s, hr * 0.7)], { col, shade: sh(col, -0.25), hi: '#FFFFFF', line: ln, z: 1.5 }); });
    ell(F.c, [hr, hr * 0.95, hr * 0.92], { B: F.B, col: pearl, shade: pearlSh, hi: pearlHi, line: ln, spec: 0.7 });
    [-1, 1].forEach(q => { dotEye(at(hr * 0.78, q * hr * 0.44, hr * 0.16), F.dir(0.85, q * 0.45, 0.14), 2.9 * s); mark(at(hr * 0.6, q * hr * 0.7, -hr * 0.22), F.dir(0.6, q * 0.75, -0.2), 2.6 * s, (c, r) => { c.fillStyle = 'rgba(255,140,180,.55)'; c.beginPath(); c.ellipse(0, 0, r, r * 0.6, 0, 0, TAU); c.fill(); }); });
    beak(F, at, hr);
    if (k === 3) { [[-0.4, '#FF8FB8'], [0, '#FFC2DC'], [0.4, '#FF9EC6']].forEach(([a, col]) => rose(at(hr * 0.3, a * hr * 0.6, hr * 0.92), 2.4 * s, col, { z: -1 })); const hp = at(-hr * 0.1, 0, hr * 2.0); fx(c => { const q = P(hp); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = R.alpha * 0.9; c.strokeStyle = '#FFD6F0'; c.lineWidth = Math.max(1.5, R.u * 2); c.beginPath(); c.ellipse(q[0], q[1], 9 * R.u * s, 2.8 * R.u * s, 0, 0, TAU); c.stroke(); c.restore(); }); glowAt(hp, 10 * s, '#FFF0FA', 0.5); }
    for (let i = 0; i < 3 + k; i++) { const ph2 = (t * 0.22 + i / (3 + k)) % 1; fx(c => { const q = P([Math.sin(i * 2.3) * 20 * s, Math.cos(i * 1.7) * 18 * s, 60 * s - ph2 * 55 * s]); c.save(); c.globalAlpha = R.alpha * Math.sin(ph2 * Math.PI) * 0.9; c.translate(q[0], q[1]); c.rotate(t * 2 + i); c.fillStyle = i % 2 ? '#FFB3D9' : '#FFE0EE'; c.beginPath(); c.ellipse(0, 0, 3.2 * R.u * s, 1.7 * R.u * s, 0, 0, TAU); c.fill(); c.restore(); }); }
  };

  /* Zadkiel (Aquarius): a sea serpent of the celestial river. A round-eyed hatchling coiled on the water grows into a great
     winged serpent: sapphire scales, pale belly, translucent fin-wings on bony rays, a frilled head, whiskers and ribbons of water */
  MODELS.aquarius = (k, t, o) => {
    const mv = clamp01(o.mv || 0), ph = o.ph || 0, s = [1.05, 1.15, 1.25][k - 1], S = strikeOf(o.atk, o.atkBig), sc = '#3A6AD8', scSh = '#2440A0', scHi = '#8AB4FF', belly = '#C8E4FF', fin = '#9FD8FF', ln = '#142A6A';
    // the water it coils on
    fx(c => { const q = P([0, 0, 0]); c.save(); c.globalAlpha = R.alpha * 0.55; c.strokeStyle = '#8FE0FF'; c.lineWidth = Math.max(1, R.u * 1.4); for (let i = 0; i < 3; i++) { const ph2 = (t * 0.5 + i / 3) % 1; c.globalAlpha = R.alpha * 0.5 * (1 - ph2); c.beginPath(); c.ellipse(q[0], q[1], (16 + ph2 * 18) * R.u * s, (5 + ph2 * 5) * R.u * s, 0, 0, TAU); c.stroke(); } c.restore(); }, true);
    // the body: a coil rising from the water to the head, rippling as it swims
    const H0 = [26, 42, 54][k - 1] * s, n = 22, pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n, a = -0.6 + u * (k === 1 ? 4.2 : 4.8) + Math.sin(t * 1.5) * 0.1, r = (13 - u * 7) * s * (1 + (k - 1) * 0.15), wav = Math.sin(u * 7 - t * 3 - ph) * 1.6 * s * (1 - u);
      pts.push([Math.cos(a) * r - u * 4 * s + S.hit * 6 * u * u, Math.sin(a) * r + wav, 3 * s + Math.pow(u, 1.6) * H0]); }
    const wf = u => (u < 0.08 ? 4 + u / 0.08 * 3 : 7 - u * 1.5) * s * (1 + (k - 1) * 0.12);
    // split the coil where it passes behind itself so each run sorts by its own depth
    for (let j = 0; j < 4; j++) { const a0 = Math.floor(j * n / 4), a1 = Math.min(n, Math.floor((j + 1) * n / 4) + 1), seg = pts.slice(a0, a1 + 1); tube(seg, u => wf((a0 + u * (a1 - a0)) / n), { col: sc, shade: scSh, hi: scHi, line: ln, d2: 0.35, inner: c => { const sp = seg.map(P); c.fillStyle = rgba(belly, 0.55); sp.forEach((p2, i) => { if (i % 2) return; c.beginPath(); c.ellipse(p2[0], p2[1] + wf((a0 + i) / n) * R.u * 0.4, wf((a0 + i) / n) * R.u * 0.55, wf((a0 + i) / n) * R.u * 0.3, 0, 0, TAU); c.fill(); }); } }); }
    const top = pts[n], nk = norm(sub(pts[n], pts[n - 2]));
    // the fin-wings: translucent fans on bony rays, from the upper body
    if (k >= 2) [-1, 1].forEach(q => { const b = pts[Math.round(n * 0.62)], span = (k === 3 ? 26 : 18) * s, fl = Math.sin(t * 2.4 + q) * 0.2, rays = 6; for (let i = 0; i < rays; i++) { const a = -0.4 + i / (rays - 1) * 1.6 + fl, d = [-Math.sin(a) * 0.4, q * Math.cos(a), Math.sin(a) * 0.9 + 0.2], tip = add(b, mul(norm(d), span * (0.75 + Math.sin(i * 1.7) * 0.15))); tube([b, mix3(b, tip, 0.5), tip], u => 1.1 * s, { col: '#D8F0FF', shade: '#8AB4E0', hi: '#FFFFFF', line: ln, z: 3 }); if (i) { const a2 = -0.4 + (i - 1) / (rays - 1) * 1.6 + fl, tip2 = add(b, mul(norm([-Math.sin(a2) * 0.4, q * Math.cos(a2), Math.sin(a2) * 0.9 + 0.2]), span * (0.75 + Math.sin((i - 1) * 1.7) * 0.15))); blob([b, tip2, mix3(tip2, tip, 0.5), tip], { col: fin, shade: '#5AA0E0', hi: '#E0F6FF', line: false, alpha: 0.55, z: 3.2, sharp: true }); } } });
    // the head: round, big-eyed, with frills and whiskers
    const F = frame(add(top, [2 * s, 0, 4 * s]), Math.sin(t * 0.8) * 0.25, -0.05 + Math.sin(t * 1.4) * 0.06 + S.hit * 0.2, Math.sin(t * 1.1) * 0.08), at = F.at, hr = (10.5 + k) * s;
    [-1, 1].forEach(q => { for (let i = 0; i < 3; i++) { const b = at(-hr * 0.2, q * hr * 0.75, hr * (0.4 - i * 0.35)), tp = add(b, F.dir(-hr * 0.4, q * hr * (0.6 + (k - 1) * 0.15), hr * (0.25 - i * 0.2) + Math.sin(t * 3 + i) * 0.6)); blob([b, add(mix3(b, tp, 0.5), F.dir(0, 0, 2.5 * s)), tp, add(mix3(b, tp, 0.5), F.dir(0, 0, -2.5 * s))], { col: fin, shade: '#5AA0E0', hi: '#E0F6FF', line: ln, z: 1 }); } });
    if (k >= 2) for (let i = 0; i < 4; i++) { const b = at(-hr * 0.4 + i * 0.1 * hr, 0, hr * 0.85 - i * 0.12 * hr), tp = add(b, F.dir(-hr * 0.5, 0, hr * (0.5 - i * 0.08))); blob([add(b, F.dir(1.5 * s, 0, 0)), tp, add(b, F.dir(-1.5 * s, 0, 0))], { col: scHi, shade: sc, hi: '#E0ECFF', line: ln, z: 1.2, sharp: true }); }
    ell(F.c, [hr * 0.92, hr, hr * 0.9], { B: F.B, col: sc, shade: scSh, hi: scHi, line: ln, spec: 0.6 });
    // the muzzle: a rounded dragon snout pushing out from the face, a pale underjaw beneath it
    const mzl = k === 1 ? 0.5 : 0.62;
    ell(at(hr * (0.62 + mzl * 0.5), 0, -hr * 0.42), [hr * mzl * 0.95, hr * 0.48, hr * 0.2], { B: F.B, col: belly, shade: '#8AB4E0', hi: '#FFFFFF', line: ln, z: -0.6 });
    ell(at(hr * (0.6 + mzl * 0.55), 0, -hr * 0.2), [hr * mzl, hr * 0.5, hr * 0.32], { B: F.B, col: sc, shade: scSh, hi: scHi, line: ln, spec: 0.55, z: -0.8 });
    [-1, 1].forEach(q => mark(at(hr * (0.6 + mzl * 1.38), q * hr * 0.16, -hr * 0.1), F.dir(0.55, q * 0.15, 0.8), hr * 0.07, (c, r) => { c.fillStyle = '#142A6A'; c.beginPath(); c.ellipse(0, 0, r, r * 0.6, q * 0.4, 0, TAU); c.fill(); }, -1.2));
    if (k >= 2) for (let i = 0; i < 3; i++) sphere(at(hr * (0.75 + i * 0.22), 0, hr * (0.1 - i * 0.02)), (1.4 - i * 0.25) * s, { col: scHi, shade: sc, hi: '#E0ECFF', line: ln, z: -1 });
    [-1, 1].forEach(q => { eye(at(hr * 0.6, q * hr * 0.45, hr * 0.22), F.dir(0.7, q * 0.6, 0.2), 4.8 * s, { iris: '#5FD4FF', blink: o.blink, irisR: 0.86, look: [0.2, 0.1], line: ln });
      mark(at(hr * 0.58, q * hr * 0.72, -hr * 0.12), F.dir(0.5, q * 0.8, -0.15), 3.2 * s, (c, r) => { c.fillStyle = 'rgba(255,150,190,.5)'; c.beginPath(); c.ellipse(0, 0, r, r * 0.6, 0, 0, TAU); c.fill(); });
      const wb = at(hr * (0.65 + mzl), q * hr * 0.4, -hr * 0.22), wt = bez3(wb, add(wb, F.dir(3 * s, q * 3 * s, -1 * s)), add(wb, F.dir(2 * s, q * 7 * s, -4 * s)), add(wb, F.dir(-1 * s, q * (9 + k * 2) * s, -2 * s + Math.sin(t * 2 + q) * 2)), 6); tube(wt, u => 0.9 * s * (1 - u * 0.6), { col: '#E0F6FF', shade: '#8AB4E0', hi: '#FFFFFF', line: ln, z: -1 }); });
    mark(at(hr * (0.6 + mzl * 1.5), 0, -hr * 0.34), F.dir(1, 0, -0.25), 2.4 * s, (c, r) => { c.strokeStyle = ln; c.lineWidth = r * 0.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(-r * 1.3, -r * 0.2); c.quadraticCurveTo(-r * 0.6, r * 0.5, 0, 0); c.quadraticCurveTo(r * 0.6, r * 0.5, r * 1.3, -r * 0.2); c.stroke(); }, -1.3);
    if (k === 1) { const bb = at(hr * 0.2, -hr * 0.9, hr * 1.1); sphere(add(bb, [0, 0, Math.sin(t * 2) * 1.5]), 3 * s, { col: '#E0F6FF', shade: '#8AD0FF', hi: '#FFFFFF', line: ln, spec: 0.9, z: -2 }); }
    // ribbons of water spiralling round it
    if (k >= 2) for (let j = 0; j < k - 1; j++) fx(c => { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const rp = []; for (let i = 0; i <= 30; i++) { const u = i / 30, a = u * 5 + t * (1.4 + j * 0.3) + j * 2, r = (20 + j * 6) * s * (1 - u * 0.3); rp.push(P([Math.cos(a) * r, Math.sin(a) * r * 0.9, 4 * s + u * H0 * 0.8])); } [[5, 0.15, '#5FD4FF'], [2, 0.6, '#C9F3FF'], [0.8, 0.9, '#FFFFFF']].forEach(([w, a, col]) => { c.globalAlpha = R.alpha * a; c.strokeStyle = col; c.lineWidth = Math.max(0.6, w * R.u); c.beginPath(); rp.forEach((p2, i) => i ? c.lineTo(p2[0], p2[1]) : c.moveTo(p2[0], p2[1])); c.stroke(); }); c.restore(); });
    for (let i = 0; i < 2 + k; i++) { const ph2 = (t * 0.4 + i / (2 + k)) % 1; fx(c => { const q = P([Math.sin(i * 3.7) * 16 * s, Math.cos(i * 2.1) * 12 * s, ph2 * H0]); c.save(); c.globalAlpha = R.alpha * Math.sin(ph2 * Math.PI) * 0.8; c.strokeStyle = '#C9F3FF'; c.lineWidth = Math.max(0.8, R.u); c.beginPath(); c.arc(q[0], q[1], (1.5 + i % 2) * R.u * s, 0, TAU); c.stroke(); c.restore(); }); }
  };

  /* Leviathan (Pisces): twin koi of light and shadow circling in a yin-yang; a ring of light round them, then broken chains */
  MODELS.pisces = (k, t, o) => {
    const mv = clamp01(o.mv || 0), s = [1.3, 1.42, 1.54][k - 1], S = strikeOf(o.atk, o.atkBig), C = [0, 0, 26 * s], Rr = 11 * s, spin = t * 1.1 + S.hit * 2;
    if (k >= 2) { fx(c => { c.save(); c.globalCompositeOperation = 'lighter'; const rp = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; rp.push(P(add(C, [0, Math.cos(a) * Rr * 2.05, Math.sin(a) * Rr * 2.05]))); } [[6, 0.15, '#B9A6FF'], [2, 0.7, '#EAF2FF']].forEach(([w, a, col]) => { c.globalAlpha = R.alpha * a; c.strokeStyle = col; c.lineWidth = Math.max(0.8, w * R.u); c.beginPath(); rp.forEach((p2, i) => i ? c.lineTo(p2[0], p2[1]) : c.moveTo(p2[0], p2[1])); c.closePath(); c.stroke(); }); c.restore(); }, true); }
    const koi = (a, light) => {
      const body = light ? '#FFF4F6' : '#5A4AA8', bodySh = light ? '#E0B8C8' : '#3A2A78', bodyHi = light ? '#FFFFFF' : '#9A8AE8', finC = light ? '#F2E8FF' : '#8A78E0', ln = light ? '#7A5A7A' : '#1A1240';
      const pos = add(C, [Math.sin(a * 2) * 2 * s, Math.cos(a) * Rr, Math.sin(a) * Rr]), tan = norm([0, -Math.sin(a), Math.cos(a)]), B = along(tan, [1, 0, 0]), at = (f, sd, h) => add(pos, add(add(mul(B[0], f), mul(B[1], sd)), mul(B[2], h)));
      const sw = Math.sin(t * 6 + (light ? 0 : 2)) * 0.35;
      // tail fin, fanning
      const tb = at(-10 * s, 0, 0); [-1, 1].forEach(q => blob([tb, at(-17 * s, q * (5 + sw * 3) * s, q * 6 * s), at(-21 * s, q * (2 + sw * 4) * s, q * 2 * s), at(-14 * s, 0, 0)], { col: finC, shade: sh(finC, -0.25), hi: '#FFFFFF', line: ln, alpha: 0.9 }));
      [-1, 1].forEach(q => blob([at(3 * s, q * 3 * s, -2 * s), at(-1 * s, q * 9 * s, -5 * s + sw * 2), at(-3 * s, q * 4 * s, -3 * s)], { col: finC, shade: sh(finC, -0.25), hi: '#FFFFFF', line: ln, alpha: 0.9 }));
      blob([at(4 * s, 0, 4 * s), at(-2 * s, 0, 9 * s), at(-8 * s, 0, 5 * s), at(-3 * s, 0, 3 * s)], { col: finC, shade: sh(finC, -0.25), hi: '#FFFFFF', line: ln, alpha: 0.9 });
      ell(pos, [12 * s, 5.2 * s, 6 * s], { B, col: body, shade: bodySh, hi: bodyHi, line: ln, spec: 0.7, inner: c => { const R0 = mulberry32(light ? 3 : 9); c.fillStyle = light ? 'rgba(255,90,110,.6)' : 'rgba(200,190,255,.55)'; for (let i = 0; i < 4; i++) { const q = P(at((R0() - 0.4) * 14 * s, (R0() - 0.5) * 6 * s, 3 * s + R0() * 2 * s)); c.beginPath(); c.ellipse(q[0], q[1], (2 + R0() * 2) * R.u * s, (1.4 + R0()) * R.u * s, R0() * 3, 0, TAU); c.fill(); } } });
      [-1, 1].forEach(q => eye(at(7.5 * s, q * 3.4 * s, 2 * s), add(mul(B[0], 0.6), add(mul(B[1], q * 0.75), mul(B[2], 0.2))), 2.8 * s, { iris: light ? '#6A5AB0' : '#FFE37A', blink: o.blink, irisR: 0.9, line: ln, look: [0.3, 0] }));
      [-1, 1].forEach(q => { const wb = at(10.5 * s, q * 2 * s, -1 * s); tube([wb, at(13 * s, q * 3 * s, -3 * s), at(14 * s, q * 5 * s, -6 * s + Math.sin(t * 3 + q) * 1)], u => 0.8 * s, { col: finC, shade: sh(finC, -0.3), hi: '#FFFFFF', line: ln, z: -0.5 }); });
      glowAt(pos, 14 * s, light ? '#FFFFFF' : '#6A5AB0', 0.25, true);
    };
    koi(spin, true); koi(spin + Math.PI, false);
    if (k === 3) for (let i = 0; i < 5; i++) { const a = -spin * 0.6 + i / 5 * TAU, cp = add(C, [Math.sin(a * 1.3) * 6 * s, Math.cos(a) * Rr * 2.5, Math.sin(a) * Rr * 2.5]); decal(cp, (c, q) => { c.strokeStyle = '#C9C2E8'; c.lineWidth = Math.max(1.5, R.u * 2.2); for (let j = 0; j < 2; j++) { c.beginPath(); c.ellipse(q[0] + (j - 0.5) * 5 * R.u * s, q[1], 3.4 * R.u * s, 2 * R.u * s, a + j, 0, TAU); c.stroke(); } c.strokeStyle = '#2A2450'; c.lineWidth = Math.max(0.6, R.u * 0.7); for (let j = 0; j < 2; j++) { c.beginPath(); c.ellipse(q[0] + (j - 0.5) * 5 * R.u * s, q[1], 3.4 * R.u * s, 2 * R.u * s, a + j, 0, TAU); c.stroke(); } }); }
  };
  MODELS.pisces.yaw = 0.3;

  return { has, draw, MODELS, H };
})();
