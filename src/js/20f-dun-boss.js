/* ---------- boss art: big, detailed, lit like solid things ----------
   Every boss is painted into an offscreen canvas each frame, then run through a small lighting pass:
   a rim light along the top-left silhouette, a shadow edge along the bottom-right, an ambient-occlusion
   gradient toward the ground and a fine surface grain. The painters themselves build the bosses from
   shaded parts: scaled hides, bone-fingered wings, plated armour, horns, claws, jaws full of teeth and
   eyes with real irises. */
const DunBoss = (() => {
  const { LN, rgba, spec, crown } = DunArt;
  const TAU = Math.PI * 2;
  const lwB = r => Math.max(1.6, Math.min(3, r * 0.045));
  const clampN = (v, a, b) => v < a ? a : v > b ? b : v;

  /* ---- shading toolkit ---- */
  // a radial three-stop gradient: lit from the top-left
  function lit(c, x, y, r, col, hi, dk, ox, oy) {
    const g = c.createRadialGradient(x + (ox == null ? -r * 0.35 : ox), y + (oy == null ? -r * 0.4 : oy), r * 0.08, x, y, r * 1.12);
    g.addColorStop(0, hi == null ? shadeC(col, 0.38) : hi); g.addColorStop(0.5, col); g.addColorStop(1, dk == null ? shadeC(col, -0.42) : dk);
    return g;
  }
  function line(c, w, col) { c.lineWidth = w; c.strokeStyle = col || LN; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
  // an ellipse of flesh, rock or metal with volume
  function orb(c, x, y, rx, ry, col, o) {
    o = o || {};
    c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot);
    c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU);
    c.fillStyle = lit(c, 0, 0, Math.max(rx, ry), col, o.hi, o.dk, o.ox, o.oy); c.fill();
    if (o.lw !== 0) line(c, o.lw || 2, o.line);
    if (o.spec !== false) { c.globalAlpha = o.specA || 0.32; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(-rx * 0.38, -ry * 0.42, rx * 0.26, ry * 0.14, -0.5, 0, TAU); c.fill(); c.globalAlpha = 1; }
    c.restore();
  }
  // a thick limb or neck along a curve: dark core stroke, lit stroke, highlight ridge
  function tube(c, pts, w, col, o) {
    o = o || {};
    const path = () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); if (pts.length === 3) c.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]); else if (pts.length === 4) c.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); else for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); };
    path(); line(c, w + (o.lw == null ? 3 : o.lw * 2), LN);
    path(); line(c, w, shadeC(col, -0.25));
    path(); c.lineWidth = w * 0.62; c.strokeStyle = col; c.stroke();
    c.save(); c.translate(-w * 0.14, -w * 0.16); path(); c.lineWidth = w * 0.22; c.strokeStyle = shadeC(col, 0.3); c.globalAlpha = 0.7; c.stroke(); c.restore();
  }
  // overlapping scales inside a region, from a cached tile so they cost almost nothing
  const scaleTiles = new Map();
  function scaleTile(col, cell) {
    const key = col + '|' + cell;
    let t = scaleTiles.get(key); if (t) return t;
    const w = cell, h = Math.round(cell * 1.44), cv = document.createElement('canvas'); cv.width = Math.max(2, Math.round(w)); cv.height = Math.max(2, h);
    const c = cv.getContext('2d'), rr = cell * 0.5, lwd = Math.max(1, cell * 0.14);
    const row = (y, ox) => { c.beginPath(); for (let x = -cell; x <= cell * 2; x += cell) { c.moveTo(x + ox - rr, y); c.arc(x + ox, y, rr, Math.PI, 0, true); } };
    c.lineWidth = lwd; c.strokeStyle = shadeC(col, -0.4); c.globalAlpha = 0.6;
    row(cell * 0.38, 0); c.stroke(); row(cell * 1.1, cell * 0.5); c.stroke();
    c.lineWidth = Math.max(0.8, lwd * 0.7); c.strokeStyle = shadeC(col, 0.4); c.globalAlpha = 0.35;
    const row2 = (y, ox) => { c.beginPath(); for (let x = -cell; x <= cell * 2; x += cell) { c.moveTo(x + ox - rr * 0.84, y + rr * 0.1); c.arc(x + ox, y + rr * 0.1, rr * 0.84, Math.PI * 1.15, Math.PI * 1.85); } };
    row2(cell * 0.38, 0); c.stroke(); row2(cell * 1.1, cell * 0.5); c.stroke();
    t = { cv }; scaleTiles.set(key, t); return t;
  }
  function scales(c, region, col, cell, a) {
    const cs = Math.max(4, Math.round(cell));
    const t = scaleTile(col, cs);
    if (!t.pat) t.pat = c.createPattern(t.cv, 'repeat');
    c.save(); region(); c.clip(); c.globalAlpha = a == null ? 0.8 : a * 1.4; c.fillStyle = t.pat; c.fillRect(-400, -400, 800, 800); c.restore();
  }
  // a row of spines along a line, each a lit triangle
  function spikes(c, x0, y0, x1, y1, n, h, col, o) {
    o = o || {};
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, bx = x0 + dx * u, by = y0 + dy * u, hh = h * (o.taper ? 1 - Math.abs(u - 0.5) * 1.1 : 1) * (o.wave ? 1 + 0.15 * Math.sin(o.wave + i) : 1), w = (L / n) * 0.42;
      const tx = bx + nx * hh + (o.lean || 0) * dx / L * hh, ty = by + ny * hh + (o.lean || 0) * dy / L * hh;
      c.beginPath(); c.moveTo(bx - dx / L * w, by - dy / L * w); c.lineTo(tx, ty); c.lineTo(bx + dx / L * w, by + dy / L * w); c.closePath();
      const g = c.createLinearGradient(bx - dx / L * w, by, bx + dx / L * w, by); g.addColorStop(0, shadeC(col, 0.3)); g.addColorStop(1, shadeC(col, -0.35));
      c.fillStyle = g; c.fill(); line(c, o.lw || 1.5, LN);
    }
  }
  // a curved horn, claw or fang
  function horn(c, x, y, len, ang, w, col, bend, o) {
    o = o || {};
    c.save(); c.translate(x, y); c.rotate(ang);
    const b = bend || 0;
    c.beginPath(); c.moveTo(-w / 2, 0); c.quadraticCurveTo(len * 0.45 - w * 0.2, -b * len * 0.5 - w * 0.5, len, -b * len); c.quadraticCurveTo(len * 0.5 + w * 0.1, -b * len * 0.55 + w * 0.5, w / 2, 0); c.closePath();
    const g = c.createLinearGradient(0, -w, 0, w); g.addColorStop(0, shadeC(col, 0.35)); g.addColorStop(0.5, col); g.addColorStop(1, shadeC(col, -0.4));
    c.fillStyle = g; c.fill(); line(c, o.lw || 1.5, o.line);
    if (o.rings) { c.strokeStyle = shadeC(col, -0.3); c.lineWidth = 1; for (let i = 1; i <= o.rings; i++) { const u = i / (o.rings + 1); c.beginPath(); c.moveTo(len * u, -b * len * u * u - w * (1 - u) * 0.45); c.lineTo(len * u, -b * len * u * u + w * (1 - u) * 0.45); c.stroke(); } }
    c.restore();
  }

  // a curling horn: a tapered tube swept along an arc (turn = total bend in radians), shaded across its width, with growth rings
  function curlHorn(c, x, y, len, ang0, turn, w, col, o) {
    o = o || {}; const N = 12, L = [], Rr = [];
    let px = x, py = y, a = ang0;
    for (let i = 0; i <= N; i++) { const u = i / N, ww = w * (1 - u) ** 0.85 + 0.6, nx = -Math.sin(a), ny = Math.cos(a); L.push([px + nx * ww / 2, py + ny * ww / 2]); Rr.push([px - nx * ww / 2, py - ny * ww / 2]); px += Math.cos(a) * len / N; py += Math.sin(a) * len / N; a += turn / N; }
    const path = () => { c.beginPath(); L.forEach(([qx, qy], i) => i ? c.lineTo(qx, qy) : c.moveTo(qx, qy)); for (let i = N; i >= 0; i--) c.lineTo(Rr[i][0], Rr[i][1]); c.closePath(); };
    const mid = Math.floor(N / 2), g = c.createLinearGradient(L[mid][0], L[mid][1], Rr[mid][0], Rr[mid][1]); g.addColorStop(0, shadeC(col, -0.45)); g.addColorStop(0.45, col); g.addColorStop(0.75, shadeC(col, 0.35)); g.addColorStop(1, shadeC(col, -0.1));
    path(); c.fillStyle = g; c.fill();
    c.save(); path(); c.clip(); c.strokeStyle = 'rgba(10,4,20,.3)'; c.lineWidth = 1; for (let i = 1; i < N - 1; i += 2) { c.beginPath(); c.moveTo(L[i][0], L[i][1]); c.quadraticCurveTo((L[i][0] + Rr[i][0]) / 2 + Math.cos(ang0 + turn * i / N) * w * 0.25, (L[i][1] + Rr[i][1]) / 2 + Math.sin(ang0 + turn * i / N) * w * 0.25, Rr[i][0], Rr[i][1]); c.stroke(); } c.restore();
    path(); line(c, o.lw || 1.2, o.line);
  }

  // ragged fur: a run of pointed tufts, each a slightly curved blade, dark at the root and lit toward the tip
  function tufts(c, list, col, dark, o) {
    o = o || {};
    const X = (x, y, a, lx, ly) => [x + Math.cos(a) * lx - Math.sin(a) * ly, y + Math.sin(a) * lx + Math.cos(a) * ly];
    if (o.sil) {
      // one jagged silhouette under the clumps, so the mass reads as a single shaggy pelt rather than a row of spines
      c.beginPath();
      list.forEach(([x, y, a, len, w, bend], i) => { const b = bend || 0, p0 = X(x, y, a, -w * 0.2, -w * 0.6), p1 = X(x, y, a, len * 0.55, -w * 0.4 - b * len * 0.4), p2 = X(x, y, a, len, -b * len), p3 = X(x, y, a, -w * 0.2, w * 0.6); if (!i) c.moveTo(p0[0], p0[1]); else c.lineTo(p0[0], p0[1]); c.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); c.lineTo(p3[0], p3[1]); });
      c.closePath(); c.fillStyle = shadeC(dark, -0.15); c.fill();
      // outline only the ragged edge, never the root line, so the pelt sits into the hide
      c.beginPath();
      list.forEach(([x, y, a, len, w, bend], i) => { const b = bend || 0, p0 = X(x, y, a, -w * 0.2, -w * 0.6), p1 = X(x, y, a, len * 0.55, -w * 0.4 - b * len * 0.4), p2 = X(x, y, a, len, -b * len), p3 = X(x, y, a, -w * 0.2, w * 0.6); if (!i) c.moveTo(p0[0], p0[1]); else c.lineTo(p0[0], p0[1]); c.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]); c.lineTo(p3[0], p3[1]); });
      c.lineWidth = o.silLw || 1.1; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
    }
    list.forEach(([x, y, a, len, w, bend]) => {
      const b = bend || 0;
      c.save(); c.translate(x, y); c.rotate(a);
      c.beginPath(); c.moveTo(0, -w / 2); c.quadraticCurveTo(len * 0.55, -w * 0.35 - b * len * 0.4, len, -b * len); c.quadraticCurveTo(len * 0.5, w * 0.35 - b * len * 0.3, 0, w / 2); c.closePath();
      const g = c.createLinearGradient(0, 0, len, -b * len); g.addColorStop(0, dark); g.addColorStop(0.55, col); g.addColorStop(1, o.tip || shadeC(col, 0.22));
      c.fillStyle = g; c.fill();
      if (o.lw !== 0) { c.lineWidth = o.lw || 0.9; c.strokeStyle = o.sil ? 'rgba(10,4,20,.28)' : INK; c.lineJoin = 'round'; c.stroke(); }
      if (o.hair) { c.strokeStyle = o.hair; c.globalAlpha = 0.55; c.lineWidth = Math.max(0.8, w * 0.12); c.lineCap = 'round'; c.beginPath(); c.moveTo(w * 0.1, -w * 0.08); c.quadraticCurveTo(len * 0.5, -w * 0.15 - b * len * 0.35, len * 0.82, -b * len * 0.8); c.moveTo(w * 0.1, w * 0.18); c.quadraticCurveTo(len * 0.4, w * 0.12 - b * len * 0.2, len * 0.6, -b * len * 0.5); c.stroke(); c.globalAlpha = 1; }
      c.restore();
    });
  }
  // tufts fanned round an ellipse arc, pointing outward (plus a lean), with jittered lengths and a slow ruffle
  function maneTufts(c, cx, cy, rx, ry, a0, a1, n, len, w, col, dark, o) {
    o = o || {}; const R = mulberry32(o.seed || 3), t = o.t || 0, list = [];
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, a = a0 + (a1 - a0) * u, j = R(), L = (len * (0.7 + j * 0.6) + Math.sin(t * 3 + i * 1.7) * len * 0.05) * (o.profile ? o.profile(u) : 1); list.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, a + (o.lean || 0) + (R() - 0.5) * 0.3, L, w * (0.8 + R() * 0.4), (R() - 0.5) * 0.5 + (o.bend || 0)]); }
    tufts(c, list, col, dark, o);
  }
  // tufts along a polyline (a spine ridge), pointing off its left-hand side (travel direction minus 90 degrees)
  function ridgeTufts(c, pts, n, len, w, col, dark, o) {
    o = o || {}; const R = mulberry32(o.seed || 5), list = [], segs = pts.length - 1;
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n * segs, k = Math.min(segs - 1, Math.floor(u)), f = u - k, p = pts[k], q = pts[k + 1], x = p[0] + (q[0] - p[0]) * f, y = p[1] + (q[1] - p[1]) * f, a = Math.atan2(q[1] - p[1], q[0] - p[0]) - Math.PI / 2 + (o.lean || 0); list.push([x, y, a + (R() - 0.5) * 0.3, len * (0.7 + R() * 0.6) * (o.profile ? o.profile(u / segs) : 1), w * (0.8 + R() * 0.4), (R() - 0.5) * 0.4 + (o.bend || 0)]); }
    tufts(c, list, col, dark, o);
  }
  // points along a cubic bezier
  function bez(p0, p1, p2, p3, N) { const out = []; for (let i = 0; i <= N; i++) { const u = i / N, a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, cc = 3 * (1 - u) * u * u, d = u ** 3; out.push([a * p0[0] + b * p1[0] + cc * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + cc * p2[1] + d * p3[1]]); } return out; }
  // short hair strokes scattered over a region (clipped), all leaning the same way
  function hairs(c, region, bx, by, bw, bh, col, n, seed, ang, len, a) {
    const R = mulberry32(seed); c.save(); region(); c.clip(); c.globalAlpha = a == null ? 0.25 : a; c.strokeStyle = col; c.lineWidth = 1; c.lineCap = 'round'; c.beginPath();
    for (let i = 0; i < n; i++) { const x = bx + R() * bw, y = by + R() * bh, L = len * (0.6 + R() * 0.8), aa = ang + (R() - 0.5) * 0.5; c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(aa) * L * 0.5, y + Math.sin(aa) * L * 0.5 - L * 0.15, x + Math.cos(aa) * L, y + Math.sin(aa) * L); }
    c.stroke(); c.restore();
  }
  // muscle definition: a shadow stroke with a highlight stroke riding just above it
  function muscle(c, segs, w, a) { strokes(c, segs, w, '#0A0414', a == null ? 0.32 : a); c.save(); c.translate(-w * 0.6, -w * 0.7); strokes(c, segs, w * 0.7, '#FFFFFF', (a == null ? 0.32 : a) * 0.45); c.restore(); }
  // a paw: a broad pad with toes and claws, facing +x
  function paw(c, x, y, w, col, o) {
    o = o || {};
    form(c, ellB(c, x, y, w * 0.5, w * 0.2), x, y, w * 0.5, col, { lw: 1, spec: false, shade: 0.35 });
    for (let k = 0; k < 3; k++) { const tx = x + w * (0.1 + k * 0.16), ty = y - w * 0.02 + Math.abs(k - 1) * w * 0.06; form(c, ellB(c, tx, ty, w * 0.11, w * 0.1), tx, ty, w * 0.11, col, { lw: 0.8, spec: false }); horn(c, tx + w * 0.06, ty + w * 0.02, w * 0.2, 0.55 - k * 0.12, w * 0.08, o.claw || '#F2ECDD', 0.25, { lw: 0.8 }); }
  }

  // a tongue of flame: a leaning blade with a three-stop gradient from root to tip
  function flame(c, px, py, ang, w, h, lean, c0, c1, c2, o) {
    c.save(); c.translate(px, py); c.rotate(ang);
    const sway = o && o.sway != null ? o.sway : -lean * 0.6;
    const path = (k) => { c.beginPath(); c.moveTo(-w * k, h * 0.3); c.bezierCurveTo(-w * 1.3 * k, -h * 0.1, sway - w * 0.5 * k, -h * 0.45, lean - w * 0.15 * k, -h * 0.72); c.quadraticCurveTo(lean + sway * 0.3, -h * 0.9, lean, -h); c.quadraticCurveTo(lean + w * 0.3 * k, -h * 0.78, sway + w * 0.5 * k, -h * 0.4); c.bezierCurveTo(w * 1.2 * k, -h * 0.15, w * 1.05 * k, h * 0.1, w * k, h * 0.3); c.closePath(); };
    const g = c.createLinearGradient(0, h * 0.3, lean * 0.5, -h); g.addColorStop(0, c0); g.addColorStop(0.55, c1); g.addColorStop(1, c2);
    if (!(o && o.noHalo)) { path(1.9); c.globalAlpha = 0.28; c.fillStyle = g; c.fill(); c.globalAlpha = 1; }
    path(1); c.fillStyle = g; c.fill();
    c.restore();
  }
  // a tapering tail or trunk along a sampled curve: ink underline, then cylinder-shaded segments
  function taper(c, pts, w0, w1, col, o) {
    o = o || {}; const N = pts.length - 1;
    c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.lineWidth = w0 + 2.4; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = INK; c.stroke();
    for (let i = 0; i < N; i++) { const w = w0 + (w1 - w0) * i / N, wn = w0 + (w1 - w0) * (i + 1) / N; limb(c, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w, wn, col, { lw: 0 }); }
    if (!o.matte) { c.beginPath(); pts.forEach(([x, y], i) => { const w = (w0 + (w1 - w0) * i / N) * 0.28; i ? c.lineTo(x - w, y - w) : c.moveTo(x - w, y - w); }); c.lineWidth = Math.max(1, w0 * 0.12); c.strokeStyle = 'rgba(255,255,255,.22)'; c.stroke(); }
  }

  // ---- organic shading: soft volumes, skin mottling, wrinkle lines, scale rows (no hard internal contours) ----
  // a soft volume: a radial gradient ellipse fading to nothing at its edge, so it melts into the surface it sits on
  function soft(c, x, y, rx, ry, rot, col, a) {
    c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.55, rgba(col, a * 0.55)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
  }
  // skin mottling: many faint soft blots, darker and lighter, scattered inside a region
  function mottle(c, region, bx, by, bw, bh, n, seed, dark, light, a) {
    const R = mulberry32(seed); c.save(); region(); c.clip();
    for (let i = 0; i < n; i++) { const x = bx + R() * bw, y = by + R() * bh, rr = (0.025 + R() * 0.06) * Math.max(bw, bh) * 0.5, lt = R() < 0.35; soft(c, x, y, rr * (1 + R()), rr, R() * 3, lt ? light : dark, (a || 0.12) * (lt ? 0.7 : 1)); }
    c.restore();
  }
  // rows of small overlapping scales along a curve, fading with alpha
  function scaleRows(c, pts, rows, cell, col, a) {
    c.save(); c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = 1; c.lineCap = 'round';
    for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, k = Math.max(1, Math.round(L / cell)); for (let j = 0; j < k; j++) { const u = (j + 0.5) / k, cx = x0 + dx * u, cy = y0 + dy * u; for (let r = -rows; r <= rows; r++) { const off = (r + ((i + j) % 2) * 0.5) * cell, px = cx + nx * off, py = cy + ny * off; c.beginPath(); c.arc(px, py, cell * 0.5, Math.atan2(dy, dx) - 2.6, Math.atan2(dy, dx) - 0.55); c.stroke(); } } }
    c.restore();
  }
  // a storm wing: arm, wrist and four long finger bones over a scalloped membrane that glows like a thunderhead,
  // with lightning crawling across the webbing. Drawn sweeping toward -x; side = 1 mirrors it to +x
  function stormWing(c, ox, oy, S, sc, fl, side, o) {
    o = o || {}; const memb = o.memb || '#2E57E0', membHi = o.membHi || '#8FC4FF', membDk = o.membDk || '#14246E', bone = o.bone || '#2A2A32', el = o.el || '#9FD8FF', t = o.t || 0;
    c.save(); c.translate(ox, oy); c.scale(side || -1, 1);
    const P = (x, y) => [x * S * sc, y * S * sc];
    const E = P(0.45, -1.0), W = P(0.85, -1.4), F = [P(0.3, -2.7 - fl), P(1.45, -2.6 - fl * 0.8), P(2.5, -2.0 - fl * 0.5), P(3.0, -1.05 - fl * 0.2)], H = P(1.6, 0.25), R0 = [0, 0];
    const scal = (a, b) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; c.quadraticCurveTo(mx + (W[0] - mx) * 0.42, my + (W[1] - my) * 0.42, b[0], b[1]); };
    const memPath = () => { c.beginPath(); c.moveTo(R0[0], R0[1]); c.lineTo(E[0], E[1]); c.lineTo(W[0], W[1]); c.lineTo(F[0][0], F[0][1]); scal(F[0], F[1]); scal(F[1], F[2]); scal(F[2], F[3]); scal(F[3], H); c.quadraticCurveTo(H[0] * 0.5, H[1] + S * sc * 0.15, R0[0], R0[1]); c.closePath(); };
    memPath(); const g = c.createLinearGradient(W[0], W[1], H[0] * 0.9, H[1]); g.addColorStop(0, membHi); g.addColorStop(0.4, memb); g.addColorStop(1, membDk); c.fillStyle = g; c.fill();
    c.save(); memPath(); c.clip();
    // thunderhead shading: bright core near the wrist, deep blue toward the trailing edge, darker where the membrane folds along each finger
    soft(c, W[0] + S * sc * 0.5, W[1] - S * sc * 0.3, S * sc * 1.2, S * sc * 0.9, 0.5, membHi, 0.45); soft(c, H[0] * 0.8, H[1] - S * sc * 0.3, S * sc * 1.0, S * sc * 0.6, -0.4, '#060A2A', 0.55);
    F.forEach((f, i) => { c.strokeStyle = 'rgba(4,8,40,.35)'; c.lineWidth = S * sc * 0.1; c.lineCap = 'round'; c.beginPath(); c.moveTo(W[0] + (f[0] - W[0]) * 0.1 - S * 0.04, W[1] + (f[1] - W[1]) * 0.1 + S * 0.06); c.quadraticCurveTo(W[0] + (f[0] - W[0]) * 0.5 - S * 0.1, W[1] + (f[1] - W[1]) * 0.5 + S * 0.12, f[0] * 0.96 + W[0] * 0.04, f[1] * 0.96 + W[1] * 0.04); c.stroke(); });
    // lightning: jagged bolts crawling from the wrist across the webbing, flickering
    const R = mulberry32(o.seed || 77); c.lineCap = 'round'; c.lineJoin = 'round';
    for (let b = 0; b < 7; b++) {
      const vis = Math.sin(t * 9 + b * 2.1 + (o.seed || 0)) > -0.35; const tgt = b < 4 ? F[b] : [H[0] * (0.3 + R() * 0.6) + F[3][0] * 0.2, H[1] * 0.6 + F[3][1] * 0.3]; const steps = 7 + Math.floor(R() * 4), pts = [[W[0] + (R() - 0.5) * S * 0.1, W[1] + (R() - 0.5) * S * 0.1]];
      for (let k = 1; k <= steps; k++) { const u = k / steps, bx = W[0] + (tgt[0] - W[0]) * u * 0.92, by = W[1] + (tgt[1] - W[1]) * u * 0.92, nx = -(tgt[1] - W[1]), ny = tgt[0] - W[0], L = Math.hypot(nx, ny) || 1, j = (R() - 0.5) * S * sc * 0.22 * Math.sin(u * Math.PI); pts.push([bx + nx / L * j, by + ny / L * j]); }
      if (!vis) continue;
      const draw = (w, col, a) => { c.globalAlpha = a; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); };
      c.globalCompositeOperation = 'lighter'; draw(S * sc * 0.07, el, 0.35); draw(S * sc * 0.025, '#F4FBFF', 0.9);
      // a short branch
      const bi = 2 + Math.floor(R() * (steps - 3)), [bx, by] = pts[bi], ba = Math.atan2(pts[bi + 1][1] - by, pts[bi + 1][0] - bx) + (R() - 0.5) * 1.6, bl = S * sc * (0.15 + R() * 0.25);
      c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.cos(ba) * bl * 0.5 + (R() - 0.5) * S * 0.05, by + Math.sin(ba) * bl * 0.5); c.lineTo(bx + Math.cos(ba) * bl, by + Math.sin(ba) * bl); c.globalAlpha = 0.8; c.lineWidth = S * sc * 0.018; c.stroke();
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    if (o.dim) { c.fillStyle = `rgba(4,8,30,${o.dim})`; c.fillRect(-S * 4, -S * 4, S * 8, S * 8); }
    c.restore();
    memPath(); c.lineWidth = 1; c.strokeStyle = 'rgba(6,6,14,.75)'; c.lineJoin = 'round'; c.stroke();
    // bones
    taper(c, bez(R0, [E[0] * 0.4, E[1] * 0.4 - S * 0.05], [E[0] + (W[0] - E[0]) * 0.5 + S * 0.05, E[1] + (W[1] - E[1]) * 0.5], W, 8), S * sc * 0.2, S * sc * 0.12, bone, { matte: true });
    F.forEach((f, i) => { const mx = W[0] + (f[0] - W[0]) * 0.5, my = W[1] + (f[1] - W[1]) * 0.5, nx = -(f[1] - W[1]), ny = f[0] - W[0], L = Math.hypot(nx, ny) || 1; taper(c, bez(W, [W[0] + (f[0] - W[0]) * 0.3 - nx / L * S * 0.05, W[1] + (f[1] - W[1]) * 0.3 - ny / L * S * 0.05], [mx - nx / L * S * 0.16, my - ny / L * S * 0.16], f, 10), S * sc * (0.085 - i * 0.008), S * sc * 0.018, shadeC(bone, 0.1), { matte: true }); });
    soft(c, W[0], W[1], S * sc * 0.18, S * sc * 0.15, 0, shadeC(bone, 0.5), 0.5); soft(c, E[0], E[1], S * sc * 0.16, S * sc * 0.13, 0, shadeC(bone, 0.4), 0.4);
    horn(c, W[0], W[1], S * sc * 0.3, -0.85, S * sc * 0.09, '#D8D8E0', 0.35, { lw: 0.8 });
    F.forEach(f => glow(c, f[0], f[1], S * sc * 0.26, el, 0.35));
    c.restore();
  }
  // an eye with an iris, a slit or round pupil, a lid shadow and a wet glint
  function eye(c, x, y, r, o) {
    o = o || {};
    const sc = o.sclera || '#F6EFD8', iris = o.iris || '#E0A020', slit = o.slit;
    c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot);
    const ry = r * (o.ry || 0.78);
    c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU);
    const sg = c.createRadialGradient(-r * 0.2, -ry * 0.3, r * 0.1, 0, 0, r); sg.addColorStop(0, '#FFFFFF'); sg.addColorStop(1, shadeC(sc, -0.3));
    c.fillStyle = sg; c.fill(); line(c, Math.max(1, r * 0.12), LN);
    const ir = r * (o.ir || 0.58), ix = clampN((o.lookX || 0) * r * 0.25, -r * 0.3, r * 0.3), iy = clampN((o.lookY || 0) * ry * 0.2, -ry * 0.25, ry * 0.25);
    c.save(); c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.clip();
    c.beginPath(); c.arc(ix, iy, ir, 0, TAU);
    const ig = c.createRadialGradient(ix - ir * 0.3, iy - ir * 0.3, ir * 0.1, ix, iy, ir); ig.addColorStop(0, shadeC(iris, 0.45)); ig.addColorStop(0.7, iris); ig.addColorStop(1, shadeC(iris, -0.5));
    c.fillStyle = ig; c.fill();
    c.strokeStyle = shadeC(iris, -0.4); c.lineWidth = 1; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; c.beginPath(); c.moveTo(ix + Math.cos(a) * ir * 0.35, iy + Math.sin(a) * ir * 0.35); c.lineTo(ix + Math.cos(a) * ir * 0.9, iy + Math.sin(a) * ir * 0.9); c.stroke(); }
    c.fillStyle = '#0B0612'; c.beginPath();
    if (slit) c.ellipse(ix, iy, ir * 0.18, ir * 0.9, 0, 0, TAU); else c.arc(ix, iy, ir * 0.48, 0, TAU);
    c.fill();
    // lid shadow
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, -ry * (o.lidLo ? 0.7 : 0.95), r * 1.2, ry * 0.6, 0, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = '#FFFFFF'; c.globalAlpha = 0.9; c.beginPath(); c.ellipse(ix - ir * 0.35, iy - ir * 0.4, ir * 0.22, ir * 0.14, -0.6, 0, TAU); c.fill(); c.globalAlpha = 1;
    if (o.glow) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite(o.glow), -r * 1.8, -r * 1.8, r * 3.6, r * 3.6); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    if (o.brow) { c.beginPath(); c.moveTo(-r * 1.2, -ry * 1.1 + o.brow * r * 0.5); c.quadraticCurveTo(0, -ry * 1.6, r * 1.2, -ry * 1.1 - o.brow * r * 0.5); c.lineTo(r * 1.1, -ry * 0.75 - o.brow * r * 0.5); c.quadraticCurveTo(0, -ry * 1.15, -r * 1.1, -ry * 0.75 + o.brow * r * 0.5); c.closePath(); c.fillStyle = o.browCol || LN; c.fill(); }
    c.restore();
  }
  // a glowing eye socket (no sclera): dark pit with a hot core
  function pitEye(c, x, y, r, col) {
    c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, TAU); c.fillStyle = '#0B0612'; c.fill();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9; blitSized(c, glowSprite(col), x - r * 2, y - r * 2, r * 4, r * 4); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x, y, r * 0.3, 0, TAU); c.fill();
  }
  // a mouth full of teeth along an arc; a0..a1 in radians around (cx, cy)
  function teeth(c, cx, cy, rx, ry, a0, a1, n, len, col, inward) {
    for (let i = 0; i < n; i++) {
      const a = a0 + (a1 - a0) * (i + 0.5) / n, bx = cx + Math.cos(a) * rx, by = cy + Math.sin(a) * ry, dir = inward ? 1 : -1, L = len * (i % 3 === 0 ? 1.25 : 0.85);
      const tx = cx + Math.cos(a) * (rx - dir * L), ty = cy + Math.sin(a) * (ry - dir * L), w = (a1 - a0) / n * Math.min(rx, ry) * 0.42;
      c.beginPath(); c.moveTo(bx + Math.cos(a + 1.57) * w, by + Math.sin(a + 1.57) * w); c.lineTo(tx, ty); c.lineTo(bx - Math.cos(a + 1.57) * w, by - Math.sin(a + 1.57) * w); c.closePath();
      c.fillStyle = col || '#F6F0DC'; c.fill(); line(c, 1, 'rgba(43,36,51,.6)');
    }
  }
  function glow(c, x, y, r, col, a) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a == null ? 0.6 : a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  // shaggy fur around an ellipse: short blunt tufts in two tones, no outline, so the edge reads as soft
  function fur(c, cx, cy, rx, ry, col, n, len, t) {
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, wob = Math.sin((t || 0) * 3 + i * 1.3) * 0.12, L = len * (0.55 + 0.45 * Math.abs(Math.sin(i * 2.3)));
      const bx = cx + Math.cos(a) * rx, by = cy + Math.sin(a) * ry, w = (TAU / n) * Math.min(rx, ry) * 0.62;
      const px = Math.cos(a + 1.57) * w, py = Math.sin(a + 1.57) * w, tx = bx + Math.cos(a + wob) * L, ty = by + Math.sin(a + wob) * L;
      c.beginPath(); c.moveTo(bx + px - Math.cos(a) * len * 0.5, by + py - Math.sin(a) * len * 0.5);
      c.quadraticCurveTo(tx + px * 0.5, ty + py * 0.5, tx, ty); c.quadraticCurveTo(tx - px * 0.5, ty - py * 0.5, bx - px - Math.cos(a) * len * 0.5, by - py - Math.sin(a) * len * 0.5); c.closePath();
      c.fillStyle = i % 2 ? shadeC(col, -0.16) : shadeC(col, 0.1); c.fill();
    }
  }
  // a bat wing: four bone fingers with a membrane stretched between them
  function batWing(c, x, y, span, rot, memb, bone, flap, side, o) {
    o = o || {};
    c.save(); c.translate(x, y); c.scale(side, 1); c.rotate(rot);
    const f = flap || 0, tips = [[span * 0.55, -span * 0.95 - f * span * 0.3], [span * 0.95, -span * 0.55 - f * span * 0.2], [span * 1.05, -span * 0.05 - f * span * 0.1], [span * 0.8, span * 0.35]];
    c.beginPath(); c.moveTo(0, 0);
    for (let i = 0; i < tips.length; i++) { const [tx, ty] = tips[i]; if (i === 0) c.lineTo(tx, ty); else { const [px, py] = tips[i - 1]; c.quadraticCurveTo((px + tx) / 2 - span * 0.12, (py + ty) / 2 + span * 0.18, tx, ty); } }
    c.quadraticCurveTo(span * 0.4, span * 0.3, 0, span * 0.12); c.closePath();
    const g = c.createLinearGradient(0, -span, span, span * 0.4); g.addColorStop(0, shadeC(memb, 0.2)); g.addColorStop(0.55, memb); g.addColorStop(1, shadeC(memb, -0.5));
    c.fillStyle = g; c.fill(); line(c, o.lw || 2, LN);
    // veins
    c.strokeStyle = shadeC(memb, -0.35); c.lineWidth = 1; c.globalAlpha = 0.6;
    for (let i = 0; i < tips.length - 1; i++) { const [ax, ay] = tips[i], [bx, by] = tips[i + 1]; for (let k = 1; k <= 2; k++) { const u = k / 3; c.beginPath(); c.moveTo(span * 0.1, span * 0.02); c.quadraticCurveTo((ax + bx) / 2 * 0.5, (ay + by) / 2 * 0.5 + span * 0.15, ax + (bx - ax) * u, ay + (by - ay) * u); c.stroke(); } }
    c.globalAlpha = 1;
    // bones: arm and fingers
    tips.slice(0, 3).forEach(([tx, ty]) => { c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(tx * 0.45, ty * 0.6 - span * 0.1, tx, ty); line(c, Math.max(2.5, span * 0.06) + 2, LN); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(tx * 0.45, ty * 0.6 - span * 0.1, tx, ty); line(c, Math.max(2.5, span * 0.06), bone); c.beginPath(); c.arc(tx, ty, span * 0.035, 0, TAU); c.fillStyle = LN; c.fill(); });
    c.beginPath(); c.arc(span * 0.5, -span * 0.5 - f * span * 0.15, span * 0.05, 0, TAU); c.fillStyle = bone; c.fill(); line(c, 1.5, LN);
    // claw at the wrist
    horn(c, span * 0.55, -span * 0.95 - f * span * 0.3, span * 0.18, -1.9, span * 0.05, '#F6F0DC', 0.4, { lw: 1 });
    c.restore();
  }
  // a feathered wing: three layers of feathers
  function featherWing(c, x, y, span, rot, col, side, flap, o) {
    o = o || {};
    c.save(); c.translate(x, y); c.scale(side, 1); c.rotate(rot + (flap || 0) * 0.3);
    const rows = [[1.0, 0.14, 9, shadeC(col, -0.12)], [0.78, 0.12, 8, col], [0.55, 0.1, 7, shadeC(col, 0.15)]];
    rows.forEach(([len, w, n, cc], ri) => {
      for (let i = n - 1; i >= 0; i--) {
        const u = i / (n - 1), a = -1.25 + u * 1.15, L = span * len * (0.55 + 0.45 * Math.sin(u * 2.6 + 0.3)), ww = span * w;
        c.save(); c.rotate(a - ri * 0.08); c.beginPath(); c.moveTo(0, -ww * 0.5); c.quadraticCurveTo(L * 0.6, -ww * 0.9, L, 0); c.quadraticCurveTo(L * 0.6, ww * 0.9, 0, ww * 0.5); c.closePath();
        const g = c.createLinearGradient(0, 0, L, 0); g.addColorStop(0, shadeC(cc, -0.2)); g.addColorStop(1, shadeC(cc, 0.2)); c.fillStyle = g; c.fill(); line(c, o.lw || 1.3, 'rgba(43,36,51,.75)');
        c.strokeStyle = 'rgba(43,36,51,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(L * 0.1, 0); c.lineTo(L * 0.9, 0); c.stroke();
        c.restore();
      }
    });
    c.restore();
  }
  // a bevelled armour plate with rivets
  function plate(c, x, y, w, h, rr, col, o) {
    o = o || {};
    c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot);
    GFX.rr(c, -w / 2, -h / 2, w, h, rr);
    const g = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, shadeC(col, 0.35)); g.addColorStop(0.45, col); g.addColorStop(1, shadeC(col, -0.4));
    c.fillStyle = g; c.fill(); line(c, o.lw || 1.8, LN);
    c.save(); GFX.rr(c, -w / 2, -h / 2, w, h, rr); c.clip(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-w / 2, -h / 2, w, Math.max(1.5, h * 0.12)); c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(-w / 2, h / 2 - Math.max(1.5, h * 0.14), w, h * 0.14); c.restore();
    if (o.rivets) { c.fillStyle = shadeC(col, -0.45); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { c.beginPath(); c.arc(a * (w / 2 - rr * 0.9), b * (h / 2 - rr * 0.9), Math.max(1.2, rr * 0.3), 0, TAU); c.fill(); c.fillStyle = shadeC(col, 0.4); c.beginPath(); c.arc(a * (w / 2 - rr * 0.9) - 0.6, b * (h / 2 - rr * 0.9) - 0.6, Math.max(0.6, rr * 0.14), 0, TAU); c.fill(); c.fillStyle = shadeC(col, -0.45); }); }
    c.restore();
  }
  // cracks with a glow seeping out of them
  function cracks(c, x, y, r, col, seed, glowCol) {
    const R = mulberry32(seed || 3);
    for (let i = 0; i < 5; i++) {
      const a = R() * TAU, L = r * (0.4 + R() * 0.5); let px = x + Math.cos(a) * r * 0.3, py = y + Math.sin(a) * r * 0.3;
      c.beginPath(); c.moveTo(px, py);
      for (let k = 0; k < 4; k++) { px += Math.cos(a + (R() - 0.5) * 1.2) * L / 4; py += Math.sin(a + (R() - 0.5) * 1.2) * L / 4; c.lineTo(px, py); }
      if (glowCol) { c.lineWidth = 3; c.strokeStyle = rgba(glowCol, 0.5); c.stroke(); }
      c.lineWidth = 1.3; c.strokeStyle = glowCol || col; c.stroke();
    }
  }
  function shadowBlob(c, x, y, rx, ry, a) { c.fillStyle = `rgba(0,0,0,${a == null ? 0.35 : a})`; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); }

  /* hydra heads hang off the body on long necks; positions in world units, shared by the AI */
  function heads(m, t) {
    const n = m.phase >= 2 ? 4 : 3, out = [];
    for (let i = 0; i < n; i++) {
      const s = (i - (n - 1) / 2), sway = Math.sin(t * 1.6 + i * 1.7) * 0.25;
      let hx = m.x + s * m.r * 0.95 + sway, hy = m.y - m.r * (1.15 + (Math.abs(s) < 0.6 ? 0.45 : 0)) + Math.cos(t * 2 + i) * 0.12;
      const b = m.bites && m.bites.find(q => q && q.k === i);
      if (b && b.snap > 0) { const k = Math.sin((1 - b.snap / 0.3) * Math.PI) * 3.2; hx += Math.cos(b.a) * k; hy += Math.sin(b.a) * k; }
      out.push({ x: hx, y: hy, i });
    }
    return out;
  }
  // a serpent head, jaws open by `open`, facing angle a (flips to face left or right)
  function serpentHead(c, x, y, r, a, col, open, o) {
    o = o || {};
    const fl = Math.cos(a) < 0 ? -1 : 1;
    c.save(); c.translate(x, y); c.scale(fl, 1);
    const op = open * r;
    // lower jaw
    c.save(); c.translate(-r * 0.2, r * 0.05); c.rotate(open * 0.9);
    c.beginPath(); c.moveTo(0, -r * 0.05); c.quadraticCurveTo(r * 0.6, -r * 0.05, r * 1.15, r * 0.1); c.quadraticCurveTo(r * 0.7, r * 0.45, 0, r * 0.35); c.closePath();
    c.fillStyle = lit(c, r * 0.4, r * 0.15, r * 0.7, shadeC(col, -0.1)); c.fill(); line(c, o.lw || 1.6);
    c.fillStyle = '#3A1830'; c.beginPath(); c.moveTo(r * 0.1, r * 0.02); c.quadraticCurveTo(r * 0.6, -r * 0.02, r * 1.05, r * 0.1); c.quadraticCurveTo(r * 0.6, r * 0.2, r * 0.1, r * 0.14); c.fill();
    teeth(c, r * 0.6, r * 0.5, r * 0.5, r * 0.45, -2.6, -0.6, 5, r * 0.16, '#F6F0DC', false);
    c.restore();
    // upper head
    c.beginPath(); c.moveTo(-r * 0.75, -r * 0.3); c.quadraticCurveTo(-r * 0.3, -r * 0.95, r * 0.5, -r * 0.6); c.quadraticCurveTo(r * 1.15, -r * 0.4, r * 1.2, -r * 0.02); c.quadraticCurveTo(r * 0.8, r * 0.06, r * 0.1, r * 0.06); c.lineTo(-r * 0.7, r * 0.05); c.closePath();
    c.fillStyle = lit(c, 0, -r * 0.3, r, col); c.fill(); line(c, o.lw || 1.6);
    scales(c, () => { c.beginPath(); c.moveTo(-r * 0.75, -r * 0.3); c.quadraticCurveTo(-r * 0.3, -r * 0.95, r * 0.5, -r * 0.6); c.quadraticCurveTo(r * 1.15, -r * 0.4, r * 1.2, -r * 0.02); c.lineTo(-r * 0.7, r * 0.05); c.closePath(); }, col, r * 0.22, 0.35);
    // fangs from the upper jaw and the glowing nostril, brow ridge, eye
    [0.85, 1.0].forEach(u => { horn(c, r * u, -r * 0.02, r * 0.3, 1.45, r * 0.09, '#F6F0DC', 0.1, { lw: 1 }); });
    c.fillStyle = shadeC(col, -0.45); c.beginPath(); c.ellipse(r * 1.0, -r * 0.2, r * 0.06, r * 0.04, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-r * 0.2, -r * 0.75); c.quadraticCurveTo(r * 0.3, -r * 0.8, r * 0.55, -r * 0.55); c.lineTo(r * 0.45, -r * 0.45); c.quadraticCurveTo(r * 0.2, -r * 0.62, -r * 0.15, -r * 0.58); c.closePath(); c.fillStyle = shadeC(col, -0.3); c.fill();
    eye(c, r * 0.18, -r * 0.4, r * 0.2, { iris: o.iris || '#FFD23A', slit: true, lookX: 0.6, glow: o.glow, ry: 0.7 });
    if (o.crest) { spikes(c, -r * 0.6, -r * 0.4, r * 0.4, -r * 0.7, 4, r * 0.3, o.crest, { lw: 1 }); }
    if (open > 0.15) { c.strokeStyle = '#FF5C8A'; c.lineWidth = Math.max(1.5, r * 0.07); c.beginPath(); c.moveTo(r * 0.9, r * 0.1); c.quadraticCurveTo(r * 1.3, r * 0.2 + op * 0.3, r * 1.55, op * 0.4); c.moveTo(r * 1.55, op * 0.4); c.lineTo(r * 1.72, op * 0.2); c.moveTo(r * 1.55, op * 0.4); c.lineTo(r * 1.7, op * 0.6); c.stroke(); }
    c.restore();
  }
  const ELC = { fire: ['#FF7A3D', '#FFB066'], frost: ['#BFEFFF', '#DDF6FF'], spark: ['#FFE37A', '#FFF3B0'], leaf: ['#9BE07A', '#D8FF8A'], shadow: ['#E07BF0', '#F3C9FF'] };
  const lookAt = (m, me) => [clampN(me.x - m.x, -1, 1), clampN(me.y - m.y, -1, 1)];

  /* ---- the painters: all draw around (0, 0) with the boss radius r in px ---- */

  /* ---- anatomy toolkit: masses with form shadows, tapered limbs, joints; thin occlusion contours instead of cartoon outlines ---- */
  const INK = 'rgba(22,12,34,.72)';
  function contour(c, w) { c.lineWidth = w; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
  // a smooth closed path through points (Catmull-Rom)
  function blobPath(c, pts, S) {
    const n = pts.length; c.beginPath();
    const P = i => pts[((i % n) + n) % n];
    c.moveTo(P(0)[0] * S, P(0)[1] * S);
    for (let i = 0; i < n; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); c.bezierCurveTo((p1[0] + (p2[0] - p0[0]) / 6) * S, (p1[1] + (p2[1] - p0[1]) / 6) * S, (p2[0] - (p3[0] - p1[0]) / 6) * S, (p2[1] - (p3[1] - p1[1]) / 6) * S, p2[0] * S, p2[1] * S); }
    c.closePath();
  }
  // a solid mass: lit fill, a form shadow curling round the bottom-right, a specular and a thin contour
  function form(c, build, cx, cy, rad, col, o) {
    o = o || {};
    build(); c.fillStyle = lit(c, cx, cy, rad, col, o.hi, o.dk, o.ox, o.oy); c.fill();
    c.save(); build(); c.clip();
    const g = c.createRadialGradient(cx - rad * 0.3, cy - rad * 0.35, rad * 0.3, cx, cy, rad * 1.08); g.addColorStop(0, 'rgba(10,4,20,0)'); g.addColorStop(0.62, 'rgba(10,4,20,0)'); g.addColorStop(1, `rgba(10,4,20,${o.shade == null ? 0.4 : o.shade})`);
    c.fillStyle = g; c.fillRect(cx - rad * 1.6, cy - rad * 1.6, rad * 3.2, rad * 3.2);
    if (o.spec !== false) { c.globalAlpha = o.specA || 0.24; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(cx - rad * (o.sx == null ? 0.36 : o.sx), cy - rad * (o.sy == null ? 0.42 : o.sy), rad * 0.26, rad * 0.13, -0.55, 0, TAU); c.fill(); c.globalAlpha = 1; }
    if (o.inner) o.inner();
    c.restore();
    if (o.lw !== 0) { build(); contour(c, o.lw || 1.2); }
  }
  const ellB = (c, x, y, rx, ry, rot) => () => { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); };
  // a tapered limb between two joints, shaded like a cylinder (lit on the side facing the top-left)
  function limb(c, x0, y0, x1, y1, w0, w1, col, o) {
    o = o || {};
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, a = Math.atan2(dy, dx);
    const build = () => { c.beginPath(); c.arc(x0, y0, w0 / 2, a + Math.PI / 2, a - Math.PI / 2); c.arc(x1, y1, w1 / 2, a - Math.PI / 2, a + Math.PI / 2); c.closePath(); };
    const litSide = (nx * -1 + ny * -1) < 0 ? -1 : 1, w = Math.max(w0, w1);
    const g = c.createLinearGradient((x0 + x1) / 2 - nx * w * 0.5 * litSide, (y0 + y1) / 2 - ny * w * 0.5 * litSide, (x0 + x1) / 2 + nx * w * 0.5 * litSide, (y0 + y1) / 2 + ny * w * 0.5 * litSide);
    g.addColorStop(0, shadeC(col, -0.45)); g.addColorStop(0.42, col); g.addColorStop(0.72, shadeC(col, 0.22)); g.addColorStop(1, shadeC(col, -0.1));
    build(); c.fillStyle = g; c.fill();
    if (o.rings) { c.save(); build(); c.clip(); c.strokeStyle = 'rgba(10,4,20,.25)'; c.lineWidth = 1; for (let i = 1; i <= o.rings; i++) { const u = i / (o.rings + 1), px = x0 + dx * u, py = y0 + dy * u, ww = (w0 + (w1 - w0) * u) * 0.55; c.beginPath(); c.moveTo(px - nx * ww, py - ny * ww); c.quadraticCurveTo(px + dx / L * ww * 0.5, py + dy / L * ww * 0.5, px + nx * ww, py + ny * ww); c.stroke(); } c.restore(); }
    if (o.lw !== 0) { build(); contour(c, o.lw || 1.1); }
  }
  function joint(c, x, y, rr, col, o) { form(c, ellB(c, x, y, rr, rr), x, y, rr, col, Object.assign({ lw: 1 }, o || {})); }
  // the shadow one mass casts on another: the upper shape, nudged, clipped inside the lower shape
  function castShade(c, under, over, dx, dy, a) { c.save(); under(); c.clip(); c.translate(dx, dy); over(); c.fillStyle = `rgba(10,4,20,${a == null ? 0.3 : a})`; c.fill(); c.restore(); }
  // a few shading strokes: muscle lines, fur direction, plate seams
  function strokes(c, segs, w, col, a) { c.save(); c.globalAlpha = a == null ? 0.35 : a; c.strokeStyle = col || '#0A0414'; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); segs.forEach(([x0, y0, cx, cy, x1, y1]) => { c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); }); c.stroke(); c.restore(); }
  // a small goblin head (for the mech cockpit)
  function goblinHead(c, x, y, r, col, lx, ly, chief) {
    form(c, ellB(c, x, y, r, r * 0.92), x, y, r, col, { lw: 1 });
    [-1, 1].forEach(s => { c.beginPath(); c.moveTo(x + s * r * 0.7, y - r * 0.3); c.quadraticCurveTo(x + s * r * 1.6, y - r * 1.0, x + s * r * 2.0, y - r * 0.7); c.quadraticCurveTo(x + s * r * 1.5, y - r * 0.2, x + s * r * 0.85, y + r * 0.1); c.closePath(); c.fillStyle = lit(c, x + s * r * 1.3, y - r * 0.5, r * 0.8, col); c.fill(); contour(c, 1); });
    [-1, 1].forEach(s => eye(c, x + s * r * 0.36, y - r * 0.12, r * 0.22, { iris: chief ? '#FF9F43' : '#FFD23A', sclera: '#FFF4C2', lookX: lx, lookY: ly, brow: 0.7 * s, browCol: shadeC(col, -0.45), ry: 0.8 }));
    c.fillStyle = shadeC(col, -0.2); c.beginPath(); c.moveTo(x - r * 0.05, y + r * 0.05); c.quadraticCurveTo(x + r * 0.4, y + r * 0.1, x + r * 0.32, y + r * 0.32); c.quadraticCurveTo(x + r * 0.12, y + r * 0.34, x - r * 0.05, y + r * 0.22); c.fill();
    c.beginPath(); c.moveTo(x - r * 0.5, y + r * 0.45); c.quadraticCurveTo(x, y + r * 0.6, x + r * 0.52, y + r * 0.38); c.quadraticCurveTo(x + r * 0.3, y + r * 0.8, x, y + r * 0.8); c.quadraticCurveTo(x - r * 0.3, y + r * 0.78, x - r * 0.5, y + r * 0.45); c.closePath(); c.fillStyle = '#2A0F26'; c.fill(); c.save(); c.clip(); teeth(c, x, y + r * 0.45, r * 0.5, r * 0.12, Math.PI + 0.2, TAU - 0.2, 6, r * 0.18, '#F6F0DC', true); c.restore(); contour(c, 1);
  }


  // a tapering tentacle along a bezier, with two rows of suckers on the inner side
  function tentacle(c, p0, p1, p2, p3, w0, w1, col, o) {
    o = o || {};
    const N = 14, pts = [];
    for (let i = 0; i <= N; i++) { const u = i / N, a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, cc = 3 * (1 - u) * u * u, d = u ** 3; pts.push([a * p0[0] + b * p1[0] + cc * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + cc * p2[1] + d * p3[1]]); }
    // dark core, then lit segments
    c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.lineWidth = w0 + 2.4; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = INK; c.stroke();
    for (let i = 0; i < N; i++) { const u = i / N, w = w0 + (w1 - w0) * u, wn = w0 + (w1 - w0) * (i + 1) / N; limb(c, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w, wn, col, { lw: 0 }); }
    // highlight ridge along the top
    c.beginPath(); pts.forEach(([x, y], i) => { const w = (w0 + (w1 - w0) * i / N) * 0.28; i ? c.lineTo(x - w, y - w) : c.moveTo(x - w, y - w); }); c.lineWidth = Math.max(1, w0 * 0.14); c.strokeStyle = 'rgba(255,255,255,.28)'; c.stroke();
    // suckers
    const sc = o.sucker || shadeC(col, 0.55), sd = shadeC(col, -0.3);
    for (let i = 1; i < N; i++) { const u = i / N, w = w0 + (w1 - w0) * u, dx = pts[i + 1][0] - pts[i - 1][0], dy = pts[i + 1][1] - pts[i - 1][1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * (o.side || 1), ny = dx / L * (o.side || 1); for (let k = 0; k < 2; k++) { const off = w * (0.12 + k * 0.24), rr = w * (0.13 - k * 0.03); if (rr < 0.8) continue; const x = pts[i][0] + nx * off, y = pts[i][1] + ny * off; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fillStyle = sc; c.fill(); c.beginPath(); c.arc(x, y, rr * 0.5, 0, TAU); c.fillStyle = sd; c.fill(); } }
    return pts;
  }

  /* ---- the painters: all draw around (0, 0); r is the boss radius in px ---- */
  const P = {
    // a hulking demon king: digitigrade legs, a spined back, long clawed arms, a horned skull, a burning core
    king(c, m, r, t, me, lw) {
      const [lx, ly] = lookAt(m, me), col = m.phase >= 2 ? '#8A52C4' : m.color, dk = shadeC(col, -0.3), S = r, sq = 1 + (m.squash || 0) * 0.2;
      c.scale(sq, 1 / sq);
      const bl = (...pts) => () => blobPath(c, pts, S);
      // cape
      c.beginPath(); c.moveTo(-S * 0.8, -S * 0.7); c.quadraticCurveTo(-S * 1.5, S * 0.4, -S * 1.25 + Math.sin(t * 3) * S * 0.06, S * 1.1); for (let i = 0; i < 6; i++) c.lineTo(-S * 1.25 + (i + 0.5) * S * 0.42, S * (i % 2 ? 1.15 : 0.92)); c.lineTo(S * 1.25, S * 1.1); c.quadraticCurveTo(S * 1.5, S * 0.4, S * 0.8, -S * 0.7); c.closePath();
      c.fillStyle = lit(c, 0, S * 0.3, S * 1.4, '#35184F', '#5A3380', '#140822'); c.fill(); contour(c, lw);
      // legs: thigh, shin, clawed feet
      [-1, 1].forEach(s => { limb(c, s * S * 0.4, S * 0.45, s * S * 0.72, S * 0.78, S * 0.42, S * 0.32, dk); limb(c, s * S * 0.72, S * 0.78, s * S * 0.6, S * 1.02, S * 0.3, S * 0.26, dk, { rings: 2 }); for (let k = 0; k < 3; k++) horn(c, s * S * (0.42 + k * 0.17), S * 1.06, S * 0.26, 1.3 + k * 0.1, S * 0.09, '#E8E0F4', 0.1, { lw: 0.8 }); });
      // torso: broad shoulders, narrow waist
      const torso = bl([-1.0, -0.55], [-0.75, 0.2], [-0.55, 0.7], [0, 0.82], [0.55, 0.7], [0.75, 0.2], [1.0, -0.55], [0.45, -0.85], [-0.45, -0.85]);
      spikes(c, -S * 1.0, -S * 0.45, -S * 0.3, -S * 0.78, 4, S * 0.55, shadeC(col, -0.1), { wave: t * 2, lw: 0.9 }); spikes(c, S * 0.3, -S * 0.78, S * 1.0, -S * 0.45, 4, S * 0.55, shadeC(col, -0.1), { wave: t * 2 + 1, lw: 0.9 });
      form(c, torso, 0, S * 0.05, S * 1.15, col, { lw, shade: 0.45 });
      [-1, 1].forEach(s => form(c, ellB(c, s * S * 0.36, -S * 0.38, S * 0.34, S * 0.22, s * 0.2), s * S * 0.36, -S * 0.38, S * 0.34, col, { lw: 0, shade: 0.5, specA: 0.16 }));
      strokes(c, [[-S * 0.72, -S * 0.2, -S * 0.5, -S * 0.1, -S * 0.3, -S * 0.3], [S * 0.72, -S * 0.2, S * 0.5, -S * 0.1, S * 0.3, -S * 0.3]], lw, '#0A0414', 0.35);
      // ribs and the void core
      c.save(); torso(); c.clip();
      glow(c, 0, S * 0.15, S * 0.8, m.phase >= 3 ? '#FF5C8A' : '#B39CFF', 0.6);
      c.fillStyle = 'rgba(10,4,20,.6)'; c.beginPath(); c.ellipse(0, S * 0.18, S * 0.4, S * 0.32, 0, 0, TAU); c.fill();
      strokes(c, [[-S * 0.65, -S * 0.15, -S * 0.3, S * 0.1, -S * 0.12, S * 0.42], [S * 0.65, -S * 0.15, S * 0.3, S * 0.1, S * 0.12, S * 0.42], [-S * 0.7, S * 0.15, -S * 0.35, S * 0.35, -S * 0.1, S * 0.55], [S * 0.7, S * 0.15, S * 0.35, S * 0.35, S * 0.1, S * 0.55]], lw * 1.1, '#0A0414', 0.45);
      c.restore();
      // arms: long, ending in three claws
      [-1, 1].forEach(s => { joint(c, s * S * 0.98, -S * 0.55, S * 0.36, col); limb(c, s * S * 0.98, -S * 0.55, s * S * 1.5, S * 0.1, S * 0.5, S * 0.38, col); joint(c, s * S * 1.5, S * 0.1, S * 0.2, dk); limb(c, s * S * 1.5, S * 0.1, s * S * 1.55, S * 0.78, S * 0.36, S * 0.3, col, { rings: 2 }); joint(c, s * S * 1.55, S * 0.82, S * 0.22, dk); for (let k = 0; k < 3; k++) horn(c, s * S * 1.55, S * 0.86, S * 0.4, 0.9 + k * 0.45 + (s < 0 ? 0.3 : 0), S * 0.1, '#E8E0F4', 0.3, { lw: 0.8 }); });
      // head: horned skull with sunken eyes and a fanged grin
      const head = bl([-0.55, -0.8], [-0.62, -1.15], [-0.3, -1.42], [0.3, -1.42], [0.62, -1.15], [0.55, -0.8], [0.25, -0.62], [-0.25, -0.62]);
      form(c, head, 0, -S * 1.0, S * 0.62, shadeC(col, 0.05), { lw, shade: 0.45 });
      [-1, 1].forEach(s => horn(c, s * S * 0.4, -S * 1.25, S * 0.7, s > 0 ? -1.0 : -2.14, S * 0.19, '#EBE3F7', 0.5, { lw: 0.9, rings: 3 }));
      [-1, 1].forEach(s => { c.fillStyle = 'rgba(10,4,20,.55)'; c.beginPath(); c.ellipse(s * S * 0.26, -S * 1.05, S * 0.22, S * 0.18, 0, 0, TAU); c.fill(); eye(c, s * S * 0.25, -S * 1.03, S * 0.15, { iris: m.phase >= 2 ? '#FF4D6D' : '#FFB020', sclera: '#2A1636', lookX: lx, lookY: ly, brow: 0.8 * s, browCol: '#1A0C2A', glow: m.phase >= 2 ? '#FF5C8A' : '#B39CFF', ry: 0.6 }); });
      c.beginPath(); c.moveTo(-S * 0.4, -S * 0.78); c.quadraticCurveTo(0, -S * 0.7, S * 0.42, -S * 0.8); c.quadraticCurveTo(S * 0.3, -S * 0.5, 0, -S * 0.48); c.quadraticCurveTo(-S * 0.28, -S * 0.5, -S * 0.4, -S * 0.78); c.closePath(); c.fillStyle = '#2A0F26'; c.fill();
      c.save(); c.clip(); teeth(c, 0, -S * 0.78, S * 0.4, S * 0.1, Math.PI + 0.2, TAU - 0.2, 7, S * 0.18, '#F6F0DC', true); teeth(c, 0, -S * 0.46, S * 0.32, S * 0.1, 0.3, Math.PI - 0.3, 5, S * 0.12, '#F6F0DC', true); c.fillStyle = '#C2385C'; c.beginPath(); c.ellipse(S * 0.04, -S * 0.55, S * 0.16, S * 0.08, 0, 0, TAU); c.fill(); c.restore(); contour(c, lw);
      crown(c, 0, -S * 1.42, S * 0.85);
    },
    // a swamp reptile with a thick body, four clawed legs and a crown of snapping heads
    hydra(c, m, r, t, me, lw, sx, sy) {
      const col = m.phase >= 2 ? '#3F7A3F' : m.color, H = heads(m, t), S = r, bl = (...pts) => () => blobPath(c, pts, S);
      if (m.under) { c.strokeStyle = 'rgba(200,255,220,.6)'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { const rr = r * (0.6 + ((t * 0.8 + i / 3) % 1) * 1.2); c.globalAlpha = 1 - ((t * 0.8 + i / 3) % 1); c.beginPath(); c.ellipse(0, r * 0.3, rr, rr * 0.4, 0, 0, TAU); c.stroke(); } c.globalAlpha = 1; return; }
      // tail
      tube(c, [[-S * 0.6, S * 0.55], [-S * 1.6, S * 0.9], [-S * 2.2, S * 0.4 + Math.sin(t * 2) * S * 0.08]], S * 0.34, col, { lw: 1 });
      spikes(c, -S * 0.8, S * 0.45, -S * 2.1, S * 0.35, 5, S * 0.2, shadeC(col, -0.2), { lw: 0.8, taper: true });
      // back legs
      [-1, 1].forEach(s => { limb(c, s * S * 0.85, S * 0.45, s * S * 1.2, S * 0.95, S * 0.42, S * 0.3, shadeC(col, -0.1)); for (let k = 0; k < 3; k++) horn(c, s * S * (1.05 + k * 0.14), S * 1.02, S * 0.22, 1.35, S * 0.08, '#F6F0DC', 0.1, { lw: 0.8 }); });
      // necks: tapered tubes with throat plates
      H.forEach(h => { const hx = sx(h.x), hy = sy(h.y); tube(c, [[hx * 0.15, -S * 0.35], [hx * 0.65, -S * 0.55 + (hy + S * 0.3) * 0.3], [hx, hy]], S * 0.36, col, { lw: 1 }); c.strokeStyle = 'rgba(10,4,20,.28)'; c.lineWidth = 1.2; for (let k = 1; k < 7; k++) { const u = k / 7, px = hx * (0.15 + 0.85 * u * u), py = -S * 0.35 + (hy + S * 0.35) * u; c.beginPath(); c.ellipse(px, py, S * 0.15, S * 0.055, Math.atan2(hy + S * 0.35, hx) + 1.57, 0, TAU); c.stroke(); } });
      // body: a plated reptile torso
      const body = bl([-1.15, 0.0], [-1.1, 0.6], [-0.6, 0.95], [0.6, 0.95], [1.1, 0.6], [1.15, 0.0], [0.6, -0.5], [-0.6, -0.5]);
      form(c, body, 0, S * 0.2, S * 1.2, col, { lw, hi: shadeC(col, 0.3), dk: shadeC(col, -0.5), shade: 0.45 });
      scales(c, body, col, S * 0.24, 0.45);
      c.save(); body(); c.clip(); c.beginPath(); c.ellipse(0, S * 0.5, S * 0.7, S * 0.42, 0, 0, TAU); c.fillStyle = lit(c, 0, S * 0.45, S * 0.75, '#C9D98A', '#EAF2B8', '#8FA256'); c.fill(); strokes(c, [[-S * 0.6, S * 0.3, 0, S * 0.36, S * 0.6, S * 0.3], [-S * 0.62, S * 0.48, 0, S * 0.54, S * 0.62, S * 0.48], [-S * 0.58, S * 0.66, 0, S * 0.72, S * 0.58, S * 0.66], [-S * 0.5, S * 0.82, 0, S * 0.88, S * 0.5, S * 0.82]], 1.3, '#0A0414', 0.35); c.restore();
      spikes(c, -S * 1.0, -S * 0.4, S * 1.0, -S * 0.4, 7, S * 0.4, shadeC(col, -0.15), { taper: true, wave: t * 2, lw: 0.9 });
      // front legs
      [-1, 1].forEach(s => { limb(c, s * S * 0.75, S * 0.35, s * S * 1.25, S * 0.65, S * 0.36, S * 0.28, col); limb(c, s * S * 1.25, S * 0.65, s * S * 1.3, S * 1.0, S * 0.28, S * 0.24, col, { rings: 2 }); joint(c, s * S * 1.25, S * 0.65, S * 0.14, shadeC(col, -0.15)); for (let k = 0; k < 3; k++) horn(c, s * S * (1.15 + k * 0.14), S * 1.05, S * 0.24, 1.3, S * 0.08, '#F6F0DC', 0.1, { lw: 0.8 }); });
      c.fillStyle = 'rgba(155,224,122,.7)'; for (let i = 0; i < 4; i++) { const dx = -S * 0.9 + i * S * 0.6, dl = S * (0.12 + 0.1 * Math.abs(Math.sin(t * 1.5 + i))); c.beginPath(); c.moveTo(dx - S * 0.05, S * 0.95); c.quadraticCurveTo(dx, S * 0.95 + dl * 1.6, dx + S * 0.05, S * 0.95); c.fill(); }
      H.forEach(h => { const b = m.bites && m.bites.find(q => q && q.k === h.i); serpentHead(c, sx(h.x), sy(h.y), S * 0.46, b ? b.a : Math.atan2(me.y - h.y, me.x - h.x), col, b && b.snap > 0 ? 0.3 : 0.08 + 0.03 * Math.sin(t * 4 + h.i), { lw: 1, iris: '#FFD23A', crest: shadeC(col, -0.2) }); });
    },
    // a real moth: veined wings with eye-spots, a furred thorax, a banded abdomen, plumed antennae, six legs
    moth(c, m, r, t, me, lw) {
      const fl = Math.sin(t * 16) * 0.35, pal = m.phase >= 2 ? ['#E88BF2', '#7E3BA8'] : ['#D79BE8', '#5E2D86'], S = r;
      [-1, 1].forEach(s => [0, 1].forEach(w => {
        c.save(); c.scale(s, 1); c.rotate((w ? 0.5 : -0.15) + fl * (w ? 0.6 : 1));
        const wx = S * (w ? 0.9 : 1.15), wy = w ? S * 0.55 : -S * 0.25, rx = S * (w ? 0.85 : 1.25), ry = S * (w ? 0.6 : 0.8);
        const wing = () => { c.beginPath(); c.moveTo(S * 0.1, w ? S * 0.2 : -S * 0.1); c.quadraticCurveTo(wx + rx * 0.3, wy - ry * 1.3, wx + rx, wy - ry * 0.2); c.quadraticCurveTo(wx + rx * 0.95, wy + ry * 0.6, wx + rx * 0.4, wy + ry); c.quadraticCurveTo(wx - rx * 0.2, wy + ry * 0.9, S * 0.1, w ? S * 0.45 : S * 0.3); c.closePath(); };
        wing(); const g = c.createLinearGradient(0, wy - ry, wx + rx, wy + ry); g.addColorStop(0, shadeC(pal[0], 0.28)); g.addColorStop(0.5, pal[0]); g.addColorStop(1, shadeC(pal[1], -0.1)); c.fillStyle = g; c.fill(); contour(c, lw * 0.9);
        c.save(); wing(); c.clip();
        c.strokeStyle = shadeC(pal[1], -0.25); c.lineWidth = 1.1; c.globalAlpha = 0.55; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(S * 0.1, wy * 0.3); c.quadraticCurveTo(wx * 0.6, wy - ry * 0.5 + i * ry * 0.3, wx + rx * (0.45 + i * 0.09), wy - ry * 1.0 + i * ry * 0.38); c.stroke(); } c.globalAlpha = 1;
        c.fillStyle = 'rgba(10,4,20,.22)'; c.beginPath(); c.moveTo(wx + rx * 0.2, wy + ry * 0.7); c.quadraticCurveTo(wx + rx * 0.6, wy + ry * 0.95, wx + rx * 1.1, wy + ry * 0.3); c.lineTo(wx + rx * 1.1, wy + ry * 1.2); c.lineTo(wx - rx * 0.3, wy + ry * 1.2); c.closePath(); c.fill();
        const ex = wx + rx * 0.35, ey = wy - ry * 0.05, er = ry * (w ? 0.38 : 0.42);
        c.beginPath(); c.arc(ex, ey, er, 0, TAU); c.fillStyle = shadeC(pal[1], -0.35); c.fill(); c.beginPath(); c.arc(ex, ey, er * 0.72, 0, TAU); c.fillStyle = lit(c, ex, ey, er * 0.72, '#FFD23A', '#FFF2B0', '#C98A10'); c.fill(); c.beginPath(); c.arc(ex, ey, er * 0.42, 0, TAU); c.fillStyle = '#2A0F26'; c.fill(); c.beginPath(); c.arc(ex - er * 0.2, ey - er * 0.2, er * 0.14, 0, TAU); c.fillStyle = '#FFFFFF'; c.fill();
        c.fillStyle = 'rgba(255,255,255,.14)'; for (let i = 0; i < 10; i++) { c.beginPath(); c.arc(wx + rx * ((i * 37) % 10) / 10 * 0.9, wy + ry * (((i * 53) % 10) / 10 - 0.4), S * 0.05, 0, TAU); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(S * 0.1, wy * 0.3); c.quadraticCurveTo(wx * 0.6, wy - ry * 1.1, wx + rx * 0.9, wy - ry * 0.3); c.lineTo(wx + rx * 0.85, wy - ry * 0.15); c.quadraticCurveTo(wx * 0.6, wy - ry * 0.85, S * 0.1, wy * 0.4); c.closePath(); c.fill();
        c.restore(); c.restore();
      }));
      // legs
      [-1, 1].forEach(s => [[-0.1, 0.35, 0.3], [0.05, 0.5, 0.45], [0.2, 0.62, 0.6]].forEach(([y0, kx, ky]) => { limb(c, s * S * 0.25, S * y0, s * S * (0.25 + kx), S * (y0 - 0.15), S * 0.07, S * 0.05, '#3A2250', { lw: 0.8 }); limb(c, s * S * (0.25 + kx), S * (y0 - 0.15), s * S * (0.35 + kx), S * (y0 + ky), S * 0.05, S * 0.03, '#3A2250', { lw: 0.8 }); }));
      // abdomen (banded) and thorax (furred)
      form(c, ellB(c, 0, S * 0.55, S * 0.4, S * 0.72), 0, S * 0.55, S * 0.72, '#4A2E66', { lw, hi: '#7A5596', shade: 0.5 });
      c.save(); c.beginPath(); c.ellipse(0, S * 0.55, S * 0.4, S * 0.72, 0, 0, TAU); c.clip(); for (let i = 0; i < 6; i++) { const y = S * (0.1 + i * 0.22); c.fillStyle = i % 2 ? 'rgba(10,4,20,.22)' : 'rgba(255,220,120,.16)'; c.fillRect(-S, y, S * 2, S * 0.11); } c.restore();
      form(c, ellB(c, 0, -S * 0.1, S * 0.52, S * 0.46), 0, -S * 0.1, S * 0.52, '#5B3A7A', { lw, hi: '#8E6AAE' });
      fur(c, 0, -S * 0.1, S * 0.5, S * 0.44, '#9B7CC0', 26, S * 0.11, t);
      // head, compound eyes, antennae, proboscis
      form(c, ellB(c, 0, -S * 0.56, S * 0.33, S * 0.29), 0, -S * 0.56, S * 0.33, '#3A2250', { lw });
      [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * S * 0.2, -S * 0.58, S * 0.17, S * 0.19, 0, 0, TAU); c.fillStyle = lit(c, s * S * 0.2, -S * 0.6, S * 0.2, '#FF6FB5', '#FFC2E3', '#8A2A62'); c.fill(); contour(c, 1); c.fillStyle = 'rgba(43,36,51,.35)'; for (let i = 0; i < 6; i++) for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(s * S * 0.2 + (i - 2.5) * S * 0.05, -S * 0.58 + (k - 1.5) * S * 0.07, S * 0.016, 0, TAU); c.fill(); } spec(c, s * S * 0.14, -S * 0.66, S * 0.05, S * 0.03, 0.8); });
      [-1, 1].forEach(s => { c.strokeStyle = '#2A1A3A'; c.lineWidth = lw; c.beginPath(); c.moveTo(s * S * 0.1, -S * 0.8); c.quadraticCurveTo(s * S * 0.5, -S * 1.5 + fl * S * 0.1, s * S * 0.9, -S * 1.4); c.stroke(); c.strokeStyle = '#C9A0E8'; c.lineWidth = 1; for (let k = 0; k < 8; k++) { const u = 0.25 + k * 0.1, px = s * S * (0.1 + 0.8 * u), py = -S * (0.8 + 0.6 * u * (2 - u)) + fl * S * 0.1 * u; c.beginPath(); c.moveTo(px, py); c.lineTo(px + s * S * 0.11, py - S * 0.12); c.moveTo(px, py); c.lineTo(px - s * S * 0.02, py - S * 0.15); c.stroke(); } });
      c.strokeStyle = '#2A0F26'; c.lineWidth = Math.max(1.5, S * 0.05); c.beginPath(); c.moveTo(0, -S * 0.35); c.quadraticCurveTo(S * 0.25, -S * 0.1, S * 0.1, S * 0.1); c.stroke();
      glow(c, 0, 0, S * 1.2, '#FF9BD2', 0.15);
    },
    // a stone colossus: a humanoid of stacked slabs and boulders, cracked open with light inside
    titan(c, m, r, t, me, lw, sx, sy, B) {
      const col = m.color, el = ELC[B.el] || ELC.fire, S = r, bl = (...pts) => () => blobPath(c, pts, S);
      const veins = B.id === 'titan' ? (m.phase >= 2 ? '#FF9F43' : null) : el[0], gem = B.id === 'crystalgolem', iron = B.id === 'irongolem', magma = B.id === 'magmagolem';
      const [lx] = lookAt(m, me), sway = Math.sin(t * 2) * S * 0.04;
      const slab = (pts, cx, cy, rad, cc, o) => form(c, () => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x * S, y * S) : c.moveTo(x * S, y * S)); c.closePath(); }, cx * S, cy * S, rad * S, cc, Object.assign({ lw, shade: 0.5 }, o || {}));
      // legs: boulders and slab feet
      [-1, 1].forEach(s => { slab([[s * 0.25, 0.5], [s * 0.85, 0.45], [s * 0.95, 1.0], [s * 0.3, 1.05]], s * 0.6, 0.75, 0.4, shadeC(col, -0.08)); slab([[s * 0.2, 0.95], [s * 1.05, 0.9], [s * 1.1, 1.12], [s * 0.2, 1.14]], s * 0.65, 1.02, 0.4, shadeC(col, -0.2)); });
      // arms: boulder shoulder, slab upper arm, boulder forearm, fist
      [-1, 1].forEach(s => {
        limb(c, s * S * 1.0, -S * 0.5, s * S * 1.45, S * 0.3 + sway * s, S * 0.55, S * 0.45, shadeC(col, -0.04), { lw });
        joint(c, s * S * 1.45, S * 0.3 + sway * s, S * 0.3, col, { lw });
        limb(c, s * S * 1.45, S * 0.3 + sway * s, s * S * 1.35, S * 0.9 + sway * s, S * 0.5, S * 0.46, col, { lw });
        slab([[s * 1.05, 0.7], [s * 1.7, 0.65], [s * 1.75, 1.05], [s * 1.0, 1.1]], s * 1.4, 0.88, 0.4, shadeC(col, 0.04), { shade: 0.45 });
        if (iron) plate(c, s * S * 1.4, S * 0.88 + sway * s, S * 0.6, S * 0.38, S * 0.1, shadeC(col, 0.06), { rivets: true }); else cracks(c, s * S * 1.4, S * 0.85, S * 0.4, shadeC(col, -0.5), 11 + s, veins);
        strokes(c, [[s * S * 1.15, S * 0.72, s * S * 1.2, S * 0.9, s * S * 1.15, S * 1.05], [s * S * 1.35, S * 0.7, s * S * 1.4, S * 0.9, s * S * 1.35, S * 1.06], [s * S * 1.55, S * 0.7, s * S * 1.6, S * 0.9, s * S * 1.55, S * 1.05]], 1.4, '#0A0414', 0.35);
      });
      // torso: pelvis slab and chest slab
      slab([[-0.75, 0.15], [0.75, 0.15], [0.65, 0.7], [-0.65, 0.7]], 0, 0.42, 0.7, shadeC(col, -0.06));
      slab([[-1.05, -0.4], [-0.6, -1.0], [0.6, -0.98], [1.05, -0.35], [0.8, 0.3], [-0.8, 0.3]], 0, -0.3, 1.1, col, { shade: 0.45 });
      strokes(c, [[-S * 0.7, -S * 0.5, -S * 0.2, -S * 0.4, -S * 0.3, S * 0.25], [S * 0.25, -S * 0.65, S * 0.7, -S * 0.3, S * 0.55, S * 0.25], [-S * 0.2, -S * 0.4, S * 0.05, -S * 0.55, S * 0.25, -S * 0.65]], lw, '#0A0414', 0.5);
      c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.moveTo(-S * 1.0, -S * 0.38); c.lineTo(-S * 0.58, -S * 0.95); c.lineTo(-S * 0.42, -S * 0.82); c.lineTo(-S * 0.8, -S * 0.32); c.closePath(); c.fill();
      if (iron) { plate(c, 0, -S * 0.3, S * 1.2, S * 0.85, S * 0.1, shadeC(col, 0.08), { rivets: true }); plate(c, 0, S * 0.42, S * 0.9, S * 0.4, S * 0.08, shadeC(col, 0.02), { rivets: true }); c.fillStyle = '#4DF0FF'; c.beginPath(); c.arc(0, -S * 0.3, S * 0.14, 0, TAU); c.fill(); glow(c, 0, -S * 0.3, S * 0.5, '#4DF0FF', 0.7); }
      else cracks(c, 0, -S * 0.25, S * 0.95, shadeC(col, -0.5), 5, veins);
      if (magma) { c.fillStyle = 'rgba(255,122,61,.6)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(-S * 0.6 + i * S * 0.25, -S * (0.4 - (i % 2) * 0.4), S * 0.08, S * 0.05, 0, 0, TAU); c.fill(); } glow(c, 0, -S * 0.1, S * 1.2, '#FF7A3D', 0.35); }
      if (gem) { for (let i = 0; i < 5; i++) { const gx = -S * 0.6 + i * S * 0.3, gy = -S * 0.5 + (i % 2) * S * 0.35; c.beginPath(); c.moveTo(gx, gy - S * 0.3); c.lineTo(gx + S * 0.12, gy - S * 0.05); c.lineTo(gx + S * 0.06, gy + S * 0.12); c.lineTo(gx - S * 0.08, gy + S * 0.1); c.lineTo(gx - S * 0.13, gy - S * 0.08); c.closePath(); c.fillStyle = lit(c, gx, gy, S * 0.25, '#9FE3FF', '#FFFFFF', '#3F8FC4'); c.fill(); contour(c, 1); } glow(c, 0, -S * 0.2, S * 1.1, '#7FD3F2', 0.3); }
      // shoulders
      [-1, 1].forEach(s => { slab([[s * 0.5, -0.98], [s * 1.2, -1.12], [s * 1.38, -0.6], [s * 1.0, -0.38]], s * 0.95, -0.78, 0.5, shadeC(col, 0.08)); if (B.id === 'titan' || magma) spikes(c, s * S * 0.55, -S * 1.0, s * S * 1.2, -S * 1.12, 3, S * 0.3, shadeC(col, 0.1), { lw: 0.9 }); });
      if (B.id === 'titan') { c.fillStyle = '#6CAF5A'; c.beginPath(); c.moveTo(-S * 0.6, -S * 0.98); c.quadraticCurveTo(-S * 0.1, -S * 1.3, S * 0.5, -S * 0.95); c.quadraticCurveTo(S * 0.2, -S * 0.82, -S * 0.1, -S * 0.86); c.quadraticCurveTo(-S * 0.3, -S * 0.78, -S * 0.6, -S * 0.98); c.closePath(); c.fill(); contour(c, 1); }
      // head sunk between the shoulders: a visor crack with burning eyes
      slab([[-0.52, -0.92], [-0.3, -1.3], [0.3, -1.3], [0.52, -0.92], [0.4, -0.65], [-0.4, -0.65]], 0, -0.98, 0.55, col);
      c.fillStyle = '#0B0612'; c.beginPath(); c.moveTo(-S * 0.48, -S * 0.9); c.lineTo(S * 0.42, -S * 0.94); c.lineTo(S * 0.32, -S * 0.76); c.lineTo(-S * 0.38, -S * 0.74); c.closePath(); c.fill();
      const ec = m.act === 'stunned' ? '#888888' : el[1];
      [-0.26, 0.2].forEach(ex => { glow(c, ex * S + lx * S * 0.05, -S * 0.83, S * 0.3, ec, 0.85); c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(ex * S + lx * S * 0.05, -S * 0.83, S * 0.07, S * 0.045, 0, 0, TAU); c.fill(); });
    },
    // a tall hooded sorcerer: a figure under heavy robes, an icicle beard, a staff crowned with a crystal
    wizard(c, m, r, t, me, lw) {
      const col = m.color, [lx, ly] = lookAt(m, me), S = r, bl = (...pts) => () => blobPath(c, pts, S);
      glow(c, 0, 0, S * 1.4, '#7FD3F2', 0.22);
      for (let i = 0; i < 6; i++) { const a = t * 1.2 + i * 1.05, rr = S * (1.25 + 0.15 * Math.sin(t * 2 + i)), px = Math.cos(a) * rr, py = S * 0.1 + Math.sin(a) * rr * 0.45; c.save(); c.translate(px, py); c.rotate(a * 1.5); c.beginPath(); c.moveTo(0, -S * 0.16); c.lineTo(S * 0.06, 0); c.lineTo(0, S * 0.16); c.lineTo(-S * 0.06, 0); c.closePath(); c.fillStyle = lit(c, 0, 0, S * 0.16, '#BFEFFF', '#FFFFFF', '#5FA8D8'); c.fill(); contour(c, 1); c.restore(); }
      // robe skirt with folds and a frosted hem
      const skirt = bl([-0.55, -0.1], [-0.95, 0.6], [-1.05, 1.05], [0, 1.1], [1.05, 1.05], [0.95, 0.6], [0.55, -0.1]);
      form(c, skirt, 0, S * 0.5, S * 1.2, col, { lw, hi: shadeC(col, 0.22), dk: shadeC(col, -0.55), shade: 0.5 });
      c.save(); skirt(); c.clip(); strokes(c, [[-S * 0.35, 0, -S * 0.45, S * 0.5, -S * 0.6, S * 1.1], [-S * 0.1, 0, -S * 0.12, S * 0.5, -S * 0.2, S * 1.1], [S * 0.15, 0, S * 0.2, S * 0.5, S * 0.25, S * 1.1], [S * 0.4, 0, S * 0.5, S * 0.5, S * 0.65, S * 1.1]], lw * 1.3, '#0A0414', 0.32); strokes(c, [[-S * 0.42, 0, -S * 0.52, S * 0.5, -S * 0.68, S * 1.1], [-S * 0.17, 0, -S * 0.2, S * 0.5, -S * 0.28, S * 1.1], [S * 0.08, 0, S * 0.12, S * 0.5, S * 0.17, S * 1.1], [S * 0.33, 0, S * 0.42, S * 0.5, S * 0.56, S * 1.1]], lw * 0.7, '#FFFFFF', 0.22);
      c.fillStyle = '#DDF6FF'; c.beginPath(); c.moveTo(-S * 1.2, S * 0.85); for (let i = 0; i < 9; i++) c.lineTo(-S * 1.05 + i * S * 0.26, S * (i % 2 ? 0.98 : 0.8)); c.lineTo(S * 1.2, S * 1.25); c.lineTo(-S * 1.2, S * 1.25); c.closePath(); c.fill(); c.restore();
      // torso and shoulders, arms in sleeves
      form(c, bl([-0.6, -0.15], [-0.7, -0.75], [-0.35, -0.95], [0.35, -0.95], [0.7, -0.75], [0.6, -0.15], [0, 0.05]), 0, -S * 0.5, S * 0.75, shadeC(col, 0.04), { lw, shade: 0.45 });
      [-1, 1].forEach(s => { limb(c, s * S * 0.55, -S * 0.7, s * S * (s > 0 ? 1.0 : 1.05), S * (s > 0 ? 0.1 : 0.25), S * 0.4, S * 0.46, col, { lw }); c.beginPath(); c.ellipse(s * S * (s > 0 ? 1.0 : 1.05), S * (s > 0 ? 0.12 : 0.28), S * 0.26, S * 0.18, 0, 0, TAU); c.fillStyle = shadeC(col, -0.35); c.fill(); contour(c, 1); c.fillStyle = '#BFD8EC'; c.beginPath(); c.ellipse(s * S * (s > 0 ? 1.02 : 1.06), S * (s > 0 ? 0.2 : 0.36), S * 0.14, S * 0.1, 0, 0, TAU); c.fill(); contour(c, 1); });
      // beard of ice, hooded face
      c.beginPath(); c.moveTo(-S * 0.38, -S * 0.52); c.lineTo(S * 0.38, -S * 0.52); for (let i = 0; i < 5; i++) c.lineTo(S * 0.38 - (i + 0.5) * S * 0.152, S * (0.12 + (i === 2 ? 0.5 : i % 2 ? 0.22 : 0.05))); c.closePath(); c.fillStyle = lit(c, 0, -S * 0.15, S * 0.5, '#E8F6FF', '#FFFFFF', '#9FD0EC'); c.fill(); contour(c, lw * 0.8);
      form(c, bl([-0.5, -0.5], [-0.55, -0.95], [-0.25, -1.2], [0.25, -1.2], [0.55, -0.95], [0.5, -0.5]), 0, -S * 0.85, S * 0.5, shadeC(col, 0.1), { lw });
      c.fillStyle = '#141A48'; c.beginPath(); c.ellipse(0, -S * 0.82, S * 0.4, S * 0.32, 0, 0, TAU); c.fill();
      [-1, 1].forEach(s => { glow(c, s * S * 0.16 + lx * S * 0.04, -S * 0.84 + ly * S * 0.03, S * 0.26, '#7FD3F2', 0.9); c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(s * S * 0.16 + lx * S * 0.04, -S * 0.84 + ly * S * 0.03, S * 0.07, S * 0.045, 0, 0, TAU); c.fill(); });
      // hat
      c.beginPath(); c.moveTo(-S * 0.85, -S * 1.05); c.lineTo(S * 0.85, -S * 1.05); c.lineTo(S * 0.25, -S * 2.35); c.closePath(); c.fillStyle = lit(c, 0, -S * 1.5, S * 1.2, '#2B3A80', '#5A6FC0', '#121A46'); c.fill(); contour(c, lw);
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(-S * 0.55, -S * 1.1); c.lineTo(S * 0.15, -S * 2.2); c.lineTo(S * 0.25, -S * 2.0); c.lineTo(-S * 0.3, -S * 1.1); c.closePath(); c.fill();
      plate(c, 0, -S * 1.1, S * 1.5, S * 0.18, S * 0.05, '#3F57B0', {});
      GFX.star(c, S * 0.05, -S * 1.65, S * 0.2, '#BFEFFF', 1.5); GFX.star(c, -S * 0.3, -S * 1.3, S * 0.1, '#FFFFFF', 0);
      // staff
      c.save(); c.translate(S * 1.02, S * 0.2); c.rotate(-0.08 + Math.sin(t * 2) * 0.03);
      tube(c, [[0, S * 0.9], [0, -S * 1.5]], S * 0.12, '#6B4A2E', { lw: 1 });
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(0, -S * 1.45); c.quadraticCurveTo(s * S * 0.3, -S * 1.6, s * S * 0.22, -S * 1.9); line(c, S * 0.07, '#6B4A2E'); });
      glow(c, 0, -S * 1.7, S * 0.55, '#7FD3F2', 0.8); form(c, ellB(c, 0, -S * 1.7, S * 0.24, S * 0.24), 0, -S * 1.7, S * 0.24, '#9FE3FF', { lw: 1, hi: '#FFFFFF', dk: '#3F8FC4' });
      c.restore();
    },
    // a wyvern rearing up: planted hind legs, a muscled chest with belly plates, an S-curved neck, bone-fingered wings
    dragon(c, m, r, t, me, lw, sx, sy, B) {
      const col = m.color, el = ELC[B.el] || ELC.fire, fl = Math.sin(t * 6) * 0.3, [lx, ly] = lookAt(m, me), S = r, bl = (...pts) => () => blobPath(c, pts, S);
      const memb = B.id === 'dragon' ? '#5A1E2B' : shadeC(col, -0.3), bone = shadeC(col, 0.15), belly = B.id === 'dragon' ? '#E8B88A' : shadeC(col, 0.55), dk = shadeC(col, -0.12);
      // tail
      tube(c, [[S * 0.3, S * 0.6], [S * 1.3, S * 1.05], [S * 2.1, S * 0.35 + Math.sin(t * 2) * S * 0.1]], S * 0.36, col, { lw: 1 });
      spikes(c, S * 0.5, S * 0.55, S * 2.0, S * 0.4, 6, S * 0.2, shadeC(col, -0.2), { lw: 0.9, taper: true });
      horn(c, S * 2.1, S * 0.35 + Math.sin(t * 2) * S * 0.1, S * 0.45, -0.5, S * 0.26, shadeC(col, -0.2), 0.1, { lw: 1 });
      // wings
      [-1, 1].forEach(s => batWing(c, s * S * 0.5, -S * 0.4, S * 1.7, 0.25 + fl * 0.5, memb, bone, fl, s, { lw: 1.2 }));
      // hind legs: thigh, shin, foot with claws
      [-1, 1].forEach(s => { form(c, ellB(c, s * S * 0.72, S * 0.55, S * 0.46, S * 0.4, s * 0.4), s * S * 0.72, S * 0.55, S * 0.46, dk, { lw, shade: 0.45 }); limb(c, s * S * 0.9, S * 0.75, s * S * 0.98, S * 1.0, S * 0.3, S * 0.24, dk, { rings: 2 }); form(c, ellB(c, s * S * 1.0, S * 1.04, S * 0.36, S * 0.13), s * S * 1.0, S * 1.04, S * 0.36, shadeC(col, -0.2), { lw: 1, spec: false }); for (let k = 0; k < 3; k++) horn(c, s * S * (0.8 + k * 0.18), S * 1.08, S * 0.24, 1.35, S * 0.08, '#F6F0DC', 0.15, { lw: 0.8 }); });
      // torso with scales and belly plates
      const body = bl([-0.85, -0.15], [-0.92, 0.45], [-0.55, 0.92], [0.55, 0.92], [0.92, 0.45], [0.85, -0.15], [0.45, -0.55], [-0.45, -0.55]);
      form(c, body, 0, S * 0.2, S * 1.0, col, { lw, hi: shadeC(col, 0.32), dk: shadeC(col, -0.5), shade: 0.45 });
      scales(c, body, col, S * 0.2, 0.4);
      c.save(); body(); c.clip(); for (let i = 0; i < 7; i++) { const y = S * (-0.3 + i * 0.18), w = S * (0.52 - Math.abs(i - 3) * 0.06); c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(0, y - S * 0.04, w, y); c.lineTo(w * 0.98, y + S * 0.17); c.quadraticCurveTo(0, y + S * 0.21, -w * 0.98, y + S * 0.17); c.closePath(); c.fillStyle = lit(c, 0, y + S * 0.08, w, belly, shadeC(belly, 0.3), shadeC(belly, -0.35)); c.fill(); contour(c, 1); } glow(c, 0, S * 0.1, S * 0.55, el[0], B.el === 'fire' || m.phase >= 2 ? 0.35 : 0.15); c.restore();
      // front legs
      [-1, 1].forEach(s => { limb(c, s * S * 0.5, S * 0.25, s * S * 0.8, S * 0.78, S * 0.26, S * 0.2, col, { rings: 2 }); for (let k = 0; k < 3; k++) horn(c, s * S * (0.7 + k * 0.1), S * 0.88, S * 0.2, 1.4, S * 0.07, '#F6F0DC', 0.1, { lw: 0.8 }); });
      // neck and head
      tube(c, [[0, -S * 0.45], [S * 0.25, -S * 0.95], [S * 0.05, -S * 1.3]], S * 0.46, col, { lw: 1 });
      spikes(c, -S * 0.12, -S * 0.55, -S * 0.12, -S * 1.25, 4, S * 0.2, shadeC(col, -0.2), { lw: 0.9 });
      const hy = -S * 1.3, open = m.ba != null ? 0.55 : 0.12 + 0.06 * Math.sin(t * 3);
      c.save(); c.translate(S * 0.05, hy + S * 0.25); c.rotate(open * 0.8);
      c.beginPath(); c.moveTo(-S * 0.4, 0); c.quadraticCurveTo(S * 0.3, -S * 0.05, S * 0.85, S * 0.05); c.quadraticCurveTo(S * 0.5, S * 0.4, -S * 0.35, S * 0.3); c.closePath(); c.fillStyle = lit(c, S * 0.2, S * 0.1, S * 0.6, shadeC(col, -0.05)); c.fill(); contour(c, lw);
      c.fillStyle = '#3A1830'; c.beginPath(); c.moveTo(-S * 0.2, S * 0.02); c.quadraticCurveTo(S * 0.3, -S * 0.02, S * 0.75, S * 0.06); c.quadraticCurveTo(S * 0.3, S * 0.22, -S * 0.2, S * 0.16); c.fill();
      if (open > 0.3) glow(c, S * 0.3, S * 0.05, S * 0.5, el[0], 0.9);
      teeth(c, S * 0.3, S * 0.55, S * 0.55, S * 0.5, -2.7, -0.4, 6, S * 0.17, '#F6F0DC', false);
      c.restore();
      const head = bl([-0.62, -0.1], [-0.4, -0.75], [0.3, -0.62], [0.95, -0.45], [1.0, 0.05], [0.4, 0.25], [-0.55, 0.25]).toString ? null : null;
      const headB = () => blobPath(c, [[-0.62, -0.1], [-0.4, -0.75], [0.3, -0.62], [0.95, -0.45], [1.0, 0.05], [0.4, 0.25], [-0.55, 0.25]].map(([x, y]) => [x, y + hy / S]), S);
      form(c, headB, 0, hy - S * 0.2, S * 0.9, col, { lw, shade: 0.45 });
      scales(c, headB, col, S * 0.18, 0.35);
      c.fillStyle = shadeC(col, -0.45); c.beginPath(); c.ellipse(S * 0.82, hy - S * 0.12, S * 0.07, S * 0.045, 0.3, 0, TAU); c.fill();
      teeth(c, S * 0.4, hy - S * 0.3, S * 0.6, S * 0.58, 0.5, 2.6, 6, S * 0.16, '#F6F0DC', false);
      c.beginPath(); c.moveTo(-S * 0.4, hy - S * 0.55); c.quadraticCurveTo(S * 0.1, hy - S * 0.75, S * 0.5, hy - S * 0.45); c.lineTo(S * 0.4, hy - S * 0.32); c.quadraticCurveTo(S * 0.05, hy - S * 0.52, -S * 0.3, hy - S * 0.4); c.closePath(); c.fillStyle = shadeC(col, -0.3); c.fill(); contour(c, 1);
      [[-S * 0.35, hy - S * 0.45, -2.3], [-S * 0.1, hy - S * 0.62, -2.0]].forEach(([hx, hy2, ang]) => horn(c, hx, hy2, S * 0.75, ang, S * 0.2, '#EBE3D2', 0.35, { lw: 1, rings: 4 }));
      eye(c, S * 0.22, hy - S * 0.28, S * 0.2, { iris: B.id === 'dragon' ? '#FF9F43' : el[0], slit: true, lookX: lx, lookY: ly, glow: m.phase >= 2 ? el[0] : null, ry: 0.72 });
      if (B.el === 'frost') spikes(c, -S * 0.5, hy - S * 0.2, -S * 0.2, hy - S * 0.6, 3, S * 0.3, '#BFEFFF', { lw: 0.8 });
      if (B.el === 'leaf') { c.fillStyle = '#9BE07A'; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(-S * 0.45 + i * S * 0.12, hy - S * 0.45 - i * S * 0.12, S * 0.18, S * 0.08, -0.9, 0, TAU); c.fill(); contour(c, 0.8); } }
      if (B.el === 'spark') { c.strokeStyle = '#FFE37A'; c.lineWidth = 2; c.beginPath(); c.moveTo(-S * 0.4, hy - S * 0.5); c.lineTo(-S * 0.6, hy - S * 0.8); c.lineTo(-S * 0.5, hy - S * 0.8); c.lineTo(-S * 0.7, hy - S * 1.1); c.stroke(); }
      if (m.ba != null) glow(c, Math.cos(m.ba) * S * 0.9, hy + S * 0.1 + Math.sin(m.ba) * S * 0.5, S * 0.8, el[0], 0.7);
    },
    // an armoured lamprey-worm: plated rings, lateral bristles, a funnel maw lined with rings of teeth, mandibles
    sandworm(c, m, r, t, me, lw) {
      const col = m.color, wig = Math.sin(t * 2.5), S = r;
      if (m.under) { c.strokeStyle = 'rgba(120,80,40,.5)'; c.lineWidth = 3; for (let i = 0; i < 3; i++) { const rr = r * (0.6 + ((t * 0.9 + i / 3) % 1) * 1.3); c.globalAlpha = 1 - ((t * 0.9 + i / 3) % 1); c.beginPath(); c.ellipse(0, r * 0.4, rr, rr * 0.35, 0, 0, TAU); c.stroke(); } c.globalAlpha = 1; return; }
      for (let i = 6; i >= 1; i--) {
        const px = -i * S * 0.42 + Math.sin(t * 2 + i) * S * 0.1, py = S * 0.3 + Math.abs(Math.cos(t * 2 + i * 0.7)) * S * 0.15, sr = S * (0.84 - i * 0.07);
        const seg = ellB(c, px, py, sr, sr * 0.92);
        form(c, seg, px, py, sr, i % 2 ? shadeC(col, -0.1) : col, { lw, hi: shadeC(col, 0.25), dk: shadeC(col, -0.5), shade: 0.5 });
        c.save(); seg(); c.clip(); c.strokeStyle = 'rgba(10,4,20,.3)'; c.lineWidth = lw; c.beginPath(); c.ellipse(px + sr * 0.3, py, sr * 0.3, sr * 0.9, 0, -1.4, 1.4); c.stroke(); c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(px - sr * 0.1, py - sr * 0.5, sr * 0.45, sr * 0.12, 0, 0, TAU); c.fill(); c.restore();
        for (let k = 0; k < 3; k++) horn(c, px + sr * 0.05, py - sr * 0.9 + k * sr * 0.18, sr * 0.28, -1.5 + k * 0.5, sr * 0.09, shadeC(col, -0.25), 0.15, { lw: 0.8 });
        for (let k = 0; k < 2; k++) horn(c, px + sr * 0.05, py + sr * 0.6 + k * sr * 0.2, sr * 0.22, 1.2 + k * 0.4, sr * 0.07, shadeC(col, -0.3), 0.1, { lw: 0.8 });
      }
      const head = ellB(c, 0, -S * 0.05 + wig * S * 0.05, S * 1.0, S * 0.98);
      form(c, head, 0, -S * 0.05, S * 1.0, col, { lw: lw * 1.1, hi: shadeC(col, 0.3), dk: shadeC(col, -0.55), shade: 0.5 });
      c.save(); head(); c.clip(); c.strokeStyle = 'rgba(10,4,20,.3)'; c.lineWidth = lw; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(-S * 0.3 - i * S * 0.18, -S * 0.05, S * 0.2, S * 0.9 - i * S * 0.08, 0, -1.25, 1.25); c.stroke(); } c.restore();
      spikes(c, -S * 0.5, -S * 0.97, S * 0.5, -S * 0.97, 5, S * 0.3, shadeC(col, -0.2), { lw: 0.9, taper: true });
      const open = 0.55 + 0.35 * Math.sin(t * 3), mr = S * 0.62;
      c.beginPath(); c.ellipse(S * 0.15, S * 0.1, mr, mr * open, 0, 0, TAU); c.fillStyle = '#2A0F26'; c.fill(); contour(c, lw);
      c.save(); c.beginPath(); c.ellipse(S * 0.15, S * 0.1, mr, mr * open, 0, 0, TAU); c.clip();
      glow(c, S * 0.15, S * 0.1, mr * 1.1, m.phase >= 2 ? '#FF5C5C' : '#FF9F43', 0.55);
      c.fillStyle = '#4A1636'; c.beginPath(); c.ellipse(S * 0.15, S * 0.1, mr * 0.55, mr * open * 0.55, 0, 0, TAU); c.fill(); c.fillStyle = '#1A0612'; c.beginPath(); c.ellipse(S * 0.15, S * 0.1, mr * 0.25, mr * open * 0.3, 0, 0, TAU); c.fill();
      teeth(c, S * 0.15, S * 0.1, mr * 0.6, mr * open * 0.6, 0, TAU, 10, mr * 0.2, '#E8DFC8', true); c.restore();
      teeth(c, S * 0.15, S * 0.1, mr, mr * open, 0, TAU, 14, mr * 0.3, '#F6F0DC', true);
      [-1, 1].forEach(s => horn(c, S * 0.15 + s * mr * 0.95, S * 0.1 - s * mr * open * 0.3, S * 0.55, s > 0 ? -0.9 : -2.25, S * 0.16, shadeC(col, -0.2), 0.5, { lw: 1, rings: 2 }));
      [-1, 1].forEach(s => { eye(c, s * S * 0.55, -S * 0.62, S * 0.14, { iris: m.phase >= 2 ? '#FF4D6D' : '#FFD23A', sclera: '#FFF8E0', ry: 0.9 }); eye(c, s * S * 0.72, -S * 0.45, S * 0.08, { iris: '#FFD23A', ry: 0.9 }); });
    },
    // a great ape: hunched, knuckles down, heavy shoulders and arms, a small crested head set low in the chest
    bigfoot(c, m, r, t, me, lw, sx, sy, B) {
      const col = m.color, cold = B.el === 'frost', skin = cold ? '#B9CCE0' : '#8A6A4A', st2 = Math.sin(t * 3) * S0(r) * 0.04, [lx, ly] = lookAt(m, me), S = r, bl = (...pts) => () => blobPath(c, pts, S);
      const dkf = shadeC(col, -0.15);
      // legs and feet
      [-1, 1].forEach(s => { limb(c, s * S * 0.4, S * 0.55, s * S * 0.55, S * 0.95, S * 0.52, S * 0.4, dkf); form(c, ellB(c, s * S * 0.58, S * 1.0, S * 0.4, S * 0.17), s * S * 0.58, S * 1.0, S * 0.4, cold ? '#9FB6CC' : '#5A4632', { lw: 1 }); for (let k = 0; k < 4; k++) { c.fillStyle = cold ? '#7E95AD' : '#3F3022'; c.beginPath(); c.ellipse(s * S * (0.3 + k * 0.17), S * 1.08, S * 0.06, S * 0.05, 0, 0, TAU); c.fill(); } });
      // back hump
      form(c, ellB(c, 0, -S * 0.5, S * 0.95, S * 0.6), 0, -S * 0.5, S * 0.95, shadeC(col, -0.05), { lw, shade: 0.5 });
      // torso
      const torso = bl([-1.05, -0.45], [-0.95, 0.25], [-0.62, 0.85], [0, 0.95], [0.62, 0.85], [0.95, 0.25], [1.05, -0.45], [0.5, -0.78], [-0.5, -0.78]);
      form(c, torso, 0, S * 0.1, S * 1.15, col, { lw, hi: shadeC(col, 0.22), dk: shadeC(col, -0.5), shade: 0.5 });
      c.save(); torso(); c.clip(); strokes(c, [[-S * 0.9, -S * 0.3, -S * 0.75, S * 0.1, -S * 0.7, S * 0.5], [S * 0.9, -S * 0.3, S * 0.75, S * 0.1, S * 0.7, S * 0.5], [-S * 0.5, S * 0.55, -S * 0.35, S * 0.75, -S * 0.3, S * 0.92], [S * 0.5, S * 0.55, S * 0.35, S * 0.75, S * 0.3, S * 0.92]], lw * 1.1, '#0A0414', 0.3); c.restore();
      // chest and belly skin with pectorals
      const chest = bl([-0.66, -0.3], [-0.64, 0.4], [-0.3, 0.72], [0.3, 0.72], [0.64, 0.4], [0.66, -0.3], [0, -0.48]);
      form(c, chest, 0, S * 0.15, S * 0.7, skin, { lw: 0, shade: 0.4 });
      [-1, 1].forEach(s => form(c, ellB(c, s * S * 0.32, -S * 0.05, S * 0.32, S * 0.24, s * 0.15), s * S * 0.32, -S * 0.05, S * 0.32, skin, { lw: 0, shade: 0.45, specA: 0.18 }));
      castShade(c, chest, () => { c.beginPath(); c.ellipse(-S * 0.32, -S * 0.05, S * 0.32, S * 0.24, -0.15, 0, TAU); c.ellipse(S * 0.32, -S * 0.05, S * 0.32, S * 0.24, 0.15, 0, TAU); }, 0, S * 0.08, 0.25);
      strokes(c, [[0, S * 0.2, 0, S * 0.45, 0, S * 0.7], [-S * 0.3, S * 0.3, -S * 0.1, S * 0.36, S * 0.3, S * 0.3], [-S * 0.26, S * 0.5, -S * 0.08, S * 0.56, S * 0.26, S * 0.5]], 1.3, '#0A0414', 0.3);
      chest(); contour(c, 1);
      // arms: deltoid, upper arm, elbow, forearm, fist on the ground
      [-1, 1].forEach(s => {
        joint(c, s * S * 1.02, -S * 0.48, S * 0.42, col, { lw });
        limb(c, s * S * 1.02, -S * 0.48, s * S * 1.55, S * 0.25 + st2 * s, S * 0.56, S * 0.46, col, { lw });
        joint(c, s * S * 1.55, S * 0.25 + st2 * s, S * 0.25, dkf, { lw: 1 });
        limb(c, s * S * 1.55, S * 0.25 + st2 * s, s * S * 1.42, S * 0.95 + st2 * s, S * 0.5, S * 0.42, col, { lw });
        fur(c, s * S * 1.52, S * 0.55 + st2 * s, S * 0.27, S * 0.36, col, 14, S * 0.07, t + s);
        form(c, ellB(c, s * S * 1.42, S * 1.0 + st2 * s, S * 0.36, S * 0.28), s * S * 1.42, S * 1.0 + st2 * s, S * 0.36, skin, { lw: 1, shade: 0.45 });
        c.fillStyle = 'rgba(10,4,20,.35)'; for (let k = -1; k <= 1; k++) { c.beginPath(); c.ellipse(s * S * 1.42 + k * S * 0.12, S * 0.92 + st2 * s, S * 0.05, S * 0.06, 0, 0, TAU); c.fill(); }
        strokes(c, [[s * S * 1.1, -S * 0.35, s * S * 1.35, -S * 0.05, s * S * 1.5, S * 0.2], [s * S * 1.65, S * 0.3, s * S * 1.62, S * 0.6, s * S * 1.58, S * 0.9]], lw, '#0A0414', 0.3);
      });
      // head: low between the shoulders, a sagittal crest, heavy brow, bared fangs
      form(c, bl([-0.5, -0.75], [-0.55, -1.1], [-0.3, -1.38], [0, -1.46], [0.3, -1.38], [0.55, -1.1], [0.5, -0.75], [0, -0.62]), 0, -S * 1.05, S * 0.58, col, { lw, shade: 0.5 });
      fur(c, 0, -S * 1.08, S * 0.5, S * 0.36, col, 22, S * 0.07, t);
      form(c, bl([-0.4, -0.72], [-0.44, -1.02], [-0.2, -1.18], [0.2, -1.18], [0.44, -1.02], [0.4, -0.72], [0, -0.6]), 0, -S * 0.92, S * 0.46, skin, { lw: 1, shade: 0.45 });
      c.beginPath(); c.moveTo(-S * 0.5, -S * 1.08); c.quadraticCurveTo(0, -S * 1.3, S * 0.5, -S * 1.08); c.quadraticCurveTo(0, -S * 1.1, -S * 0.5, -S * 1.08); c.closePath(); c.fillStyle = shadeC(col, -0.4); c.fill(); contour(c, 1);
      [-1, 1].forEach(s => eye(c, s * S * 0.19, -S * 1.0, S * 0.1, { iris: m.phase >= 2 ? '#FF4D6D' : '#D8A040', sclera: '#F2E6CC', lookX: lx, lookY: ly, brow: 0.6 * s, browCol: shadeC(col, -0.5), ry: 0.85 }));
      c.fillStyle = cold ? '#6E8CB0' : '#5A3A2A'; c.beginPath(); c.ellipse(0, -S * 0.82, S * 0.17, S * 0.1, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(0,0,0,.45)'; [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * S * 0.07, -S * 0.8, S * 0.045, S * 0.03, 0, 0, TAU); c.fill(); });
      const roar = m.act === 'roar' || m.phase >= 2;
      c.beginPath(); c.moveTo(-S * 0.3, -S * 0.7); c.quadraticCurveTo(0, -S * 0.64, S * 0.3, -S * 0.7); c.quadraticCurveTo(S * 0.2, -S * (roar ? 0.45 : 0.56), 0, -S * (roar ? 0.42 : 0.56)); c.quadraticCurveTo(-S * 0.2, -S * (roar ? 0.45 : 0.56), -S * 0.3, -S * 0.7); c.closePath(); c.fillStyle = '#2A0F26'; c.fill(); contour(c, 1);
      [-1, 1].forEach(s => horn(c, s * S * 0.18, -S * 0.68, S * 0.16, 1.57, S * 0.07, '#F6F0DC', 0, { lw: 0.8 }));
      if (roar) { c.fillStyle = '#C2385C'; c.beginPath(); c.ellipse(0, -S * 0.5, S * 0.1, S * 0.05, 0, 0, TAU); c.fill(); }
      if (cold) { [-1, 1].forEach(s => { for (let k = 0; k < 3; k++) horn(c, s * S * (0.7 + k * 0.15), -S * 0.6 - k * S * 0.05, S * 0.3, -1.4 + s * 0.3 - k * 0.2, S * 0.1, '#DDF6FF', 0.1, { lw: 0.8 }); }); }
    },
    // a fat cat sitting like a boss: pear body, paws together, a broad head with cheek fluff, a crown and a monocle
    fatcat(c, m, r, t, me, lw, sx, sy, B) {
      const col = m.color, sq = 1 + (m.squash || 0) * 0.25, breath = Math.sin(t * 2) * 0.025, tom = B.id === 'tomcat', [lx, ly] = lookAt(m, me), S = r, bl = (...pts) => () => blobPath(c, pts, S);
      const pale = tom ? '#E6E9F0' : '#FFF4E6';
      c.scale((1 + breath) * sq, (1 - breath) / sq);
      // tail curling round
      tube(c, [[S * 0.9, S * 0.7], [S * 1.8, S * 0.6], [S * 1.65 + Math.sin(t * 2.5) * S * 0.15, -S * 0.35]], S * 0.26, col, { lw: 1 });
      c.strokeStyle = shadeC(col, -0.4); c.lineWidth = S * 0.06; for (let k = 0; k < 4; k++) { const u = 0.3 + k * 0.17; c.beginPath(); c.arc(S * (0.9 + 0.78 * u) + (u > 0.6 ? Math.sin(t * 2.5) * S * 0.15 * (u - 0.6) : 0), S * 0.7 - S * 1.0 * u * u, S * 0.13, -1.8, 1.0); c.stroke(); }
      // haunches
      [-1, 1].forEach(s => form(c, ellB(c, s * S * 0.92, S * 0.7, S * 0.5, S * 0.42, s * 0.2), s * S * 0.92, S * 0.7, S * 0.5, shadeC(col, -0.04), { lw, shade: 0.45 }));
      // body
      const body = bl([-1.2, 0.85], [-1.22, 0.1], [-0.85, -0.5], [0, -0.62], [0.85, -0.5], [1.22, 0.1], [1.2, 0.85], [0.6, 1.02], [-0.6, 1.02]);
      form(c, body, 0, S * 0.25, S * 1.25, col, { lw, hi: shadeC(col, 0.3), dk: shadeC(col, -0.45), shade: 0.45 });
      c.save(); body(); c.clip();
      if (tom) strokes(c, [[-S * 0.75, -S * 0.5, -S * 0.65, 0, -S * 0.7, S * 0.6], [-S * 0.35, -S * 0.55, -S * 0.25, 0, -S * 0.3, S * 0.7], [S * 0.35, -S * 0.55, S * 0.25, 0, S * 0.3, S * 0.7], [S * 0.75, -S * 0.5, S * 0.65, 0, S * 0.7, S * 0.6]], S * 0.12, shadeC(col, -0.4), 0.8);
      else strokes(c, [[-S * 1.1, -S * 0.1, -S * 0.8, S * 0.1, -S * 0.9, S * 0.5], [S * 1.1, -S * 0.1, S * 0.8, S * 0.1, S * 0.9, S * 0.5], [-S * 0.6, -S * 0.5, -S * 0.5, -S * 0.3, -S * 0.65, -S * 0.1], [S * 0.6, -S * 0.5, S * 0.5, -S * 0.3, S * 0.65, -S * 0.1]], S * 0.1, shadeC(col, -0.3), 0.7);
      const belly = ellB(c, 0, S * 0.45, S * 0.8, S * 0.62); belly(); c.fillStyle = lit(c, 0, S * 0.4, S * 0.8, pale, '#FFFFFF', shadeC(pale, -0.2)); c.fill();
      fur(c, 0, S * 0.45, S * 0.78, S * 0.6, pale, 30, S * 0.08, t);
      c.restore();
      // front legs and paws
      [-1, 1].forEach(s => { limb(c, s * S * 0.38, S * 0.15, s * S * 0.45, S * 0.92, S * 0.32, S * 0.27, pale, { lw }); form(c, ellB(c, s * S * 0.47, S * 1.0, S * 0.28, S * 0.14), s * S * 0.47, S * 1.0, S * 0.28, pale, { lw: 1 }); c.fillStyle = 'rgba(10,4,20,.3)'; for (let k = -1; k <= 1; k++) { c.beginPath(); c.ellipse(s * S * 0.47 + k * S * 0.11, S * 1.03, S * 0.04, S * 0.05, 0, 0, TAU); c.fill(); } });
      // collar
      c.beginPath(); c.ellipse(0, -S * 0.3, S * 0.72, S * 0.24, 0, 0, TAU); c.fillStyle = tom ? '#3A3A48' : '#C9365A'; c.fill(); contour(c, lw);
      if (tom) spikes(c, -S * 0.6, -S * 0.36, S * 0.6, -S * 0.36, 6, S * 0.17, '#CFD3DE', { lw: 0.8 }); else form(c, ellB(c, 0, -S * 0.12, S * 0.15, S * 0.15), 0, -S * 0.12, S * 0.15, '#F2C94C', { lw: 1, hi: '#FFF2B0', dk: '#B8891C' });
      // head
      const head = bl([-0.78, -0.62], [-0.8, -1.05], [-0.42, -1.3], [0.42, -1.3], [0.8, -1.05], [0.78, -0.62], [0.3, -0.42], [-0.3, -0.42]);
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * S * 0.38, -S * 1.22); c.lineTo(s * S * 0.72, -S * 1.78); c.lineTo(s * S * 0.86, -S * 0.98); c.closePath(); c.fillStyle = lit(c, s * S * 0.6, -S * 1.3, S * 0.5, col); c.fill(); contour(c, lw); c.beginPath(); c.moveTo(s * S * 0.47, -S * 1.18); c.lineTo(s * S * 0.7, -S * 1.6); c.lineTo(s * S * 0.78, -S * 1.05); c.closePath(); c.fillStyle = '#FFB7C8'; c.fill(); if (tom && s > 0) { c.fillStyle = col; c.beginPath(); c.moveTo(S * 0.78, -S * 1.65); c.lineTo(S * 0.92, -S * 1.42); c.lineTo(S * 0.7, -S * 1.38); c.fill(); } });
      form(c, head, 0, -S * 0.9, S * 0.8, col, { lw, hi: shadeC(col, 0.3), shade: 0.45 });
      fur(c, 0, -S * 0.9, S * 0.78, S * 0.42, col, 28, S * 0.1, t);
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * S * 0.78, -S * 0.9); c.lineTo(s * S * 1.0, -S * 0.78); c.lineTo(s * S * 0.82, -S * 0.68); c.lineTo(s * S * 0.98, -S * 0.56); c.lineTo(s * S * 0.72, -S * 0.5); c.closePath(); c.fillStyle = shadeC(col, 0.05); c.fill(); contour(c, 1); });
      if (tom) { c.fillStyle = shadeC(col, -0.3); c.beginPath(); c.moveTo(-S * 0.5, -S * 1.25); c.quadraticCurveTo(0, -S * 1.42, S * 0.5, -S * 1.25); c.lineTo(S * 0.4, -S * 1.0); c.quadraticCurveTo(0, -S * 1.15, -S * 0.4, -S * 1.0); c.closePath(); c.fill(); strokes(c, [[S * 0.35, -S * 1.1, S * 0.45, -S * 0.95, S * 0.55, -S * 0.8]], 2, '#F2C9C9', 0.8); }
      form(c, ellB(c, 0, -S * 0.66, S * 0.48, S * 0.3), 0, -S * 0.66, S * 0.48, pale, { lw: 0, shade: 0.3 });
      [-1, 1].forEach(s => eye(c, s * S * 0.32, -S * 0.95, S * 0.17, { iris: tom ? '#9BE07A' : '#4FA8F0', slit: true, lookX: lx, lookY: ly, ry: 0.7, lidLo: true, brow: 0.35 * s, browCol: shadeC(col, -0.45) }));
      c.fillStyle = '#FFB7C8'; c.beginPath(); c.moveTo(-S * 0.1, -S * 0.7); c.lineTo(S * 0.1, -S * 0.7); c.lineTo(0, -S * 0.6); c.closePath(); c.fill(); contour(c, 0.8);
      c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(0, -S * 0.6); c.quadraticCurveTo(-S * 0.14, -S * 0.46, -S * 0.28, -S * 0.54); c.moveTo(0, -S * 0.6); c.quadraticCurveTo(S * 0.14, -S * 0.46, S * 0.28, -S * 0.54); c.stroke();
      [-1, 1].forEach(s => horn(c, s * S * 0.18, -S * 0.52, S * 0.15, 1.57, S * 0.06, '#F6F0DC', 0, { lw: 0.8 }));
      c.strokeStyle = 'rgba(43,36,51,.7)'; c.lineWidth = 1.2; [-1, 1].forEach(s => { for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(s * S * 0.32, -S * 0.66 + k * S * 0.07); c.lineTo(s * S * 1.1, -S * 0.72 + k * S * 0.16); c.stroke(); } });
      if (!tom) { crown(c, S * 0.35, -S * 1.32, S * 0.5); c.strokeStyle = '#F2C94C'; c.lineWidth = lw; c.beginPath(); c.arc(S * 0.32, -S * 0.95, S * 0.25, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(S * 0.55, -S * 0.82); c.lineTo(S * 0.85, -S * 0.36); c.stroke(); }
      else { c.strokeStyle = '#F2C94C'; c.lineWidth = lw * 0.8; c.beginPath(); c.arc(S * 0.72, -S * 1.48, S * 0.08, 0, TAU); c.stroke(); }
    },
    // a goblin piloting a walking war-machine: reverse-jointed piston legs, a riveted hull, a glass cockpit, a claw and a giant wrench
    goblinking(c, m, r, t, me, lw, sx, sy, B) {
      const col = m.color, chief = B.id === 'goblinchief', [lx, ly] = lookAt(m, me), S = r, bob = Math.sin(t * 4) * S * 0.04;
      const metal = chief ? '#7A5A3C' : '#8E8E9E', dark = chief ? '#4A3220' : '#4C4C5C', brass = '#C9A24A';
      // exhaust
      [-0.6, -0.3].forEach((ex, i) => { limb(c, ex * S, -S * 0.2 + bob, ex * S - S * 0.1, -S * 0.95 + bob, S * 0.16, S * 0.14, dark, { rings: 3 }); for (let k = 0; k < 3; k++) { const u = ((t * 0.8 + k / 3 + i * 0.5) % 1); glow(c, ex * S - S * 0.1 - u * S * 0.2, -S * 1.0 + bob - u * S * 0.7, S * (0.14 + u * 0.3), '#9A9AAA', (1 - u) * 0.5); } });
      // legs: hip, thigh, knee back, shin, foot plate, piston
      [-1, 1].forEach(s => {
        const hip = [s * S * 0.5, S * 0.35 + bob], knee = [s * S * 0.92, S * 0.6 + bob * 0.5], ankle = [s * S * 0.68, S * 1.0];
        limb(c, hip[0], hip[1], knee[0], knee[1], S * 0.26, S * 0.2, metal, { lw: 1 });
        limb(c, knee[0], knee[1], ankle[0], ankle[1], S * 0.2, S * 0.17, metal, { lw: 1 });
        limb(c, s * S * 0.62, S * 0.2 + bob, s * S * 0.85, S * 0.52 + bob * 0.5, S * 0.08, S * 0.08, '#D8D8E2', { lw: 0.8 });
        joint(c, hip[0], hip[1], S * 0.15, dark, { lw: 1 }); joint(c, knee[0], knee[1], S * 0.13, dark, { lw: 1 });
        plate(c, ankle[0], S * 1.05, S * 0.58, S * 0.16, S * 0.05, dark, { rivets: true }); c.fillStyle = '#2A2230'; c.fillRect(ankle[0] - S * 0.3, S * 1.11, S * 0.6, S * 0.04);
      });
      // hull
      plate(c, 0, S * 0.1 + bob, S * 1.6, S * 1.05, S * 0.28, metal, { rivets: true });
      c.save(); GFX.rr(c, -S * 0.8, -S * 0.42 + bob, S * 1.6, S * 1.05, S * 0.28); c.clip();
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-S * 0.8, S * 0.3 + bob, S * 1.6, S * 0.06); c.fillRect(-S * 0.05, -S * 0.42 + bob, S * 0.05, S * 1.05);
      // hazard stripes and vents
      c.save(); c.beginPath(); c.rect(-S * 0.8, S * 0.42 + bob, S * 1.6, S * 0.14); c.clip(); for (let i = -6; i < 8; i++) { c.fillStyle = i % 2 ? '#F2C94C' : '#2A2230'; c.beginPath(); c.moveTo(i * S * 0.22, S * 0.42 + bob); c.lineTo((i + 1) * S * 0.22, S * 0.42 + bob); c.lineTo((i + 0.4) * S * 0.22, S * 0.56 + bob); c.lineTo((i - 0.6) * S * 0.22, S * 0.56 + bob); c.closePath(); c.fill(); } c.restore();
      for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(S * 0.35, -S * 0.3 + bob + i * S * 0.12, S * 0.3, S * 0.05); }
      c.restore();
      if (chief) { spikes(c, -S * 0.7, -S * 0.4 + bob, S * 0.7, -S * 0.4 + bob, 6, S * 0.26, '#CFD3DE', { lw: 0.8 }); c.fillStyle = '#F6F0DC'; c.beginPath(); c.arc(-S * 0.4, S * 0.05 + bob, S * 0.14, 0, TAU); c.fill(); c.fillStyle = '#2A0F26'; c.beginPath(); c.arc(-S * 0.45, S * 0.02 + bob, S * 0.04, 0, TAU); c.arc(-S * 0.35, S * 0.02 + bob, S * 0.04, 0, TAU); c.fill(); }
      else { form(c, ellB(c, -S * 0.38, S * 0.05 + bob, S * 0.17, S * 0.17), -S * 0.38, S * 0.05 + bob, S * 0.17, '#4DF0FF', { lw: 1, hi: '#FFFFFF', dk: '#1F7FA0' }); glow(c, -S * 0.38, S * 0.05 + bob, S * 0.5, '#4DF0FF', 0.6); }
      // cockpit dome with the goblin inside
      const dome = ellB(c, 0, -S * 0.6 + bob, S * 0.56, S * 0.48);
      c.save(); dome(); c.clip(); c.fillStyle = '#1C2638'; c.fillRect(-S, -S * 1.2, S * 2, S * 0.7); goblinHead(c, 0, -S * 0.5 + bob, S * 0.3, col, lx, ly, chief); c.restore();
      dome(); const gg = c.createLinearGradient(-S * 0.5, -S * 1.1, S * 0.5, -S * 0.2); gg.addColorStop(0, 'rgba(190,235,255,.55)'); gg.addColorStop(0.45, 'rgba(190,235,255,.08)'); gg.addColorStop(1, 'rgba(120,180,230,.3)'); c.fillStyle = gg; c.fill(); contour(c, lw);
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-S * 0.25, -S * 0.85 + bob, S * 0.16, S * 0.07, -0.6, 0, TAU); c.fill();
      plate(c, 0, -S * 0.18 + bob, S * 1.25, S * 0.14, S * 0.04, dark, { rivets: true });
      if (!chief) crown(c, 0, -S * 1.12 + bob, S * 0.55); else { c.fillStyle = '#B83A3A'; c.beginPath(); c.moveTo(-S * 0.1, -S * 1.1 + bob); c.lineTo(S * 0.55, -S * 1.6 + bob + Math.sin(t * 3) * S * 0.06); c.lineTo(S * 0.6, -S * 1.1 + bob); c.closePath(); c.fill(); contour(c, 1); limb(c, -S * 0.1, -S * 1.05 + bob, -S * 0.1, -S * 1.75 + bob, S * 0.06, S * 0.05, '#6B4A2E', { lw: 0.8 }); }
      // arms: shoulder, upper, elbow, forearm; a claw on the left, the wrench on the right
      [-1, 1].forEach(s => {
        joint(c, s * S * 0.85, -S * 0.15 + bob, S * 0.2, dark, { lw: 1 });
        limb(c, s * S * 0.85, -S * 0.15 + bob, s * S * 1.3, S * 0.25 + bob, S * 0.28, S * 0.22, metal, { lw: 1 });
        joint(c, s * S * 1.3, S * 0.25 + bob, S * 0.13, dark, { lw: 1 });
        limb(c, s * S * 1.3, S * 0.25 + bob, s * S * 1.42, S * 0.72 + bob, S * 0.22, S * 0.2, metal, { lw: 1, rings: 2 });
        if (s < 0) { joint(c, -S * 1.42, S * 0.75 + bob, S * 0.16, dark, { lw: 1 }); for (let k = 0; k < 3; k++) horn(c, -S * 1.42, S * 0.78 + bob, S * 0.42, 0.9 + k * 0.5, S * 0.1, '#CFD3DE', 0.3, { lw: 0.8 }); }
        else { c.save(); c.translate(S * 1.42, S * 0.72 + bob); c.rotate(-0.7 + Math.sin(t * 3) * 0.12); tube(c, [[0, S * 0.4], [0, -S * 1.3]], S * 0.16, chief ? '#6B4A2E' : '#A9A9B8', { lw: 1 }); if (chief) { c.beginPath(); c.moveTo(0, -S * 1.4); c.quadraticCurveTo(S * 0.8, -S * 1.45, S * 0.75, -S * 0.6); c.quadraticCurveTo(S * 0.38, -S * 0.85, 0, -S * 0.8); c.closePath(); c.fillStyle = lit(c, S * 0.38, -S * 1.0, S * 0.5, '#CFD3DE', '#FFFFFF', '#7A7F94'); c.fill(); contour(c, lw); } else { c.beginPath(); c.moveTo(-S * 0.34, -S * 1.3); c.lineTo(-S * 0.34, -S * 1.72); c.lineTo(-S * 0.1, -S * 1.88); c.lineTo(-S * 0.1, -S * 1.5); c.lineTo(S * 0.1, -S * 1.5); c.lineTo(S * 0.1, -S * 1.88); c.lineTo(S * 0.34, -S * 1.72); c.lineTo(S * 0.34, -S * 1.3); c.closePath(); c.fillStyle = lit(c, 0, -S * 1.55, S * 0.4, '#A9A9B8', '#E8E8F0', '#5C5C70'); c.fill(); contour(c, lw); } c.restore(); }
      });
    },
    // a true spider: a small cephalothorax in front of a swollen abdomen, eight three-jointed legs, pedipalps, fangs, eight eyes
    spider(c, m, r, t, me, lw, sx, sy, B) {
      const col = m.color, cold = B.el === 'frost', [lx, ly] = lookAt(m, me), S = r, legC = shadeC(col, -0.08);
      // back legs first, front legs last, so they overlap correctly
      const leg = (s, i, front) => {
        const y0 = -S * 0.25 + i * S * 0.22, wag = Math.sin(t * 6 + i * 1.6) * S * 0.08 * (m.act === 'move' ? 1 : 0.3), spread = 0.75 + Math.abs(i - 1.5) * 0.18;
        const cx0 = s * S * 0.55, kx = s * S * (0.75 + spread * 0.75), ky = y0 - S * (0.95 - Math.abs(i - 1.5) * 0.12) + wag, tx = s * S * (0.9 + spread * 1.25), ty = y0 + S * 0.45 + wag * 0.3, fx = s * S * (0.95 + spread * 1.45), fy = S * 0.98;
        limb(c, cx0, y0, kx, ky, S * 0.17, S * 0.13, legC, { lw: 1, rings: 2 }); joint(c, kx, ky, S * 0.085, shadeC(col, 0.05), { lw: 0.9 });
        limb(c, kx, ky, tx, ty, S * 0.12, S * 0.09, legC, { lw: 1, rings: 2 }); joint(c, tx, ty, S * 0.06, shadeC(col, 0.05), { lw: 0.8 });
        limb(c, tx, ty, fx, fy, S * 0.08, S * 0.04, shadeC(col, -0.2), { lw: 0.9 });
        c.strokeStyle = shadeC(col, 0.3); c.lineWidth = 1; for (let k = 0; k < 5; k++) { const u = 0.15 + k * 0.18, px = cx0 + (kx - cx0) * u, py = y0 + (ky - y0) * u; c.beginPath(); c.moveTo(px, py); c.lineTo(px + s * S * 0.07, py - S * 0.09); c.stroke(); }
      };
      [-1, 1].forEach(s => { leg(s, 3); leg(s, 2); });
      // abdomen
      const abd = ellB(c, -S * 0.6, S * 0.15, S * 1.08, S * 0.86, -0.1);
      form(c, abd, -S * 0.6, S * 0.1, S * 1.08, col, { lw, hi: shadeC(col, 0.32), dk: shadeC(col, -0.5), shade: 0.5 });
      c.save(); abd(); c.clip(); c.fillStyle = 'rgba(10,4,20,.35)'; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; c.beginPath(); c.ellipse(-S * 0.6 + Math.cos(a) * S * 0.78, S * 0.15 + Math.sin(a) * S * 0.6, S * 0.05, S * 0.03, a, 0, TAU); c.fill(); }
      const mark = cold ? '#BFEFFF' : '#FF4D6D'; c.beginPath(); c.moveTo(-S * 0.8, -S * 0.35); c.lineTo(-S * 0.35, S * 0.15); c.lineTo(-S * 0.8, S * 0.7); c.lineTo(-S * 1.25, S * 0.15); c.closePath(); c.fillStyle = lit(c, -S * 0.8, S * 0.15, S * 0.5, mark, shadeC(mark, 0.35), shadeC(mark, -0.35)); c.fill(); contour(c, 1); glow(c, -S * 0.8, S * 0.15, S * 0.7, mark, 0.3); c.restore();
      fur(c, -S * 0.6, S * 0.15, S * 1.04, S * 0.82, shadeC(col, 0.1), 36, S * 0.08, t);
      [-1, 1].forEach(s => { c.fillStyle = shadeC(col, -0.3); c.beginPath(); c.ellipse(-S * 1.6, S * (0.15 + s * 0.12), S * 0.1, S * 0.05, 0, 0, TAU); c.fill(); });
      // cephalothorax
      const ceph = () => blobPath(c, [[0.15, -0.42], [0.75, -0.5], [1.15, -0.2], [1.12, 0.3], [0.75, 0.58], [0.2, 0.42]], S);
      form(c, ceph, S * 0.65, 0, S * 0.6, shadeC(col, 0.08), { lw, hi: shadeC(col, 0.35), shade: 0.5 });
      scales(c, ceph, col, S * 0.3, 0.2);
      c.beginPath(); c.moveTo(S * 0.2, -S * 0.42); c.quadraticCurveTo(S * 0.7, -S * 0.6, S * 1.15, -S * 0.2); c.lineTo(S * 1.0, -S * 0.1); c.quadraticCurveTo(S * 0.7, -S * 0.42, S * 0.3, -S * 0.3); c.closePath(); c.fillStyle = shadeC(col, -0.35); c.fill();
      [-1, 1].forEach(s => { leg(s, 1); leg(s, 0); });
      // pedipalps, chelicerae and fangs with venom
      [-1, 1].forEach(s => { limb(c, S * 0.95 + s * S * 0.2, S * 0.35, S * 1.25 + s * S * 0.3, S * 0.55, S * 0.1, S * 0.07, shadeC(col, -0.1), { lw: 0.9 }); form(c, ellB(c, S * 0.92 + s * S * 0.17, S * 0.5, S * 0.16, S * 0.24), S * 0.92 + s * S * 0.17, S * 0.5, S * 0.24, shadeC(col, -0.15), { lw: 1 }); horn(c, S * 0.92 + s * S * 0.2, S * 0.7, S * 0.45, 1.4 + s * 0.25, S * 0.12, '#F6F0DC', 0.25, { lw: 0.9 }); });
      c.fillStyle = '#9BE07A'; [-1, 1].forEach(s => { c.beginPath(); c.ellipse(S * 0.92 + s * S * 0.32, S * 1.1 + Math.abs(Math.sin(t * 2 + s)) * S * 0.1, S * 0.05, S * 0.08, 0, 0, TAU); c.fill(); });
      [[0.55, -0.18, 0.15], [0.9, -0.18, 0.15], [0.42, -0.4, 0.09], [1.02, -0.4, 0.09], [0.65, -0.46, 0.07], [0.82, -0.46, 0.07], [0.58, 0.05, 0.055], [0.88, 0.05, 0.055]].forEach(([ex, ey, er]) => { c.beginPath(); c.arc(ex * S, ey * S, er * S, 0, TAU); c.fillStyle = lit(c, ex * S, ey * S, er * S, m.phase >= 2 ? '#FF4D6D' : cold ? '#BFEFFF' : '#FFD23A', '#FFFFFF', '#5A1020'); c.fill(); contour(c, 0.8); c.fillStyle = '#0B0612'; c.beginPath(); c.arc(ex * S + lx * er * S * 0.3, ey * S + ly * er * S * 0.3, er * S * 0.45, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ex * S - er * S * 0.3, ey * S - er * S * 0.35, er * S * 0.2, 0, TAU); c.fill(); });
      if (m.phase >= 2) glow(c, S * 0.7, -S * 0.3, S * 0.8, '#FF4D6D', 0.3);
    },
    // a cobra: a thick body winding behind, a rising neck, a ribbed hood with eye-spots, a diamond head with fangs
    snake(c, m, r, t, me, lw, sx, sy, B) {
      const col = m.color, fire = B.el === 'fire', S = r;
      // body coils as one winding tube
      const pts = [[-1.5, 0.95], [-0.8, 0.55], [0.3, 1.0], [1.2, 0.62], [0.7, 0.2], [-0.25, 0.4], [0.1, -0.2]].map(([x, y]) => [x * S + Math.sin(t * 1.5 + y) * S * 0.04, y * S]);
      for (let i = 0; i < pts.length - 1; i++) { const w = S * (0.3 + 0.045 * i); const seg = [pts[i], pts[i + 1]]; tube(c, seg, w, col, { lw: 1 }); c.save(); c.beginPath(); c.moveTo(seg[0][0], seg[0][1]); c.lineTo(seg[1][0], seg[1][1]); c.lineWidth = w * 0.95; c.lineCap = 'round'; c.strokeStyle = 'rgba(0,0,0,0)'; c.stroke(); c.restore(); }
      for (let i = 0; i < pts.length - 1; i++) { const w = S * (0.3 + 0.045 * i), a = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]); c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = w * 0.22; c.lineCap = 'round'; c.beginPath(); c.moveTo(pts[i][0] + Math.sin(a) * w * 0.25, pts[i][1] - Math.cos(a) * w * 0.25 + w * 0.3); c.lineTo(pts[i + 1][0] + Math.sin(a) * w * 0.25, pts[i + 1][1] - Math.cos(a) * w * 0.25 + w * 0.3); c.stroke(); c.fillStyle = shadeC(col, -0.35); for (let k = 0; k < 4; k++) { const u = (k + 0.5) / 4, px = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, py = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u; c.beginPath(); c.moveTo(px, py - w * 0.3); c.lineTo(px + w * 0.16, py); c.lineTo(px, py + w * 0.3); c.lineTo(px - w * 0.16, py); c.closePath(); c.fill(); } }
      // rising neck
      tube(c, [[S * 0.1, -S * 0.2], [S * 0.38, -S * 0.8], [S * 0.22, -S * 1.25]], S * 0.5, col, { lw: 1 });
      c.strokeStyle = 'rgba(10,4,20,.25)'; c.lineWidth = 1.2; for (let k = 0; k < 7; k++) { const u = k / 7, px = S * 0.1 + S * 0.3 * Math.sin(u * 2.6), py = -S * 0.2 - S * 1.05 * u; c.beginPath(); c.ellipse(px, py, S * 0.22, S * 0.07, 0, 0, Math.PI); c.stroke(); }
      // hood: a broad ribbed plate
      const hw = S * (m.phase >= 2 ? 1.5 : 1.25);
      const hood = () => { c.beginPath(); c.moveTo(S * 0.2, -S * 0.45); c.quadraticCurveTo(S * 0.2 - hw * 2.1, -S * 1.6, S * 0.2, -S * 1.95); c.quadraticCurveTo(S * 0.2 + hw * 2.1, -S * 1.6, S * 0.2, -S * 0.45); c.closePath(); };
      form(c, hood, S * 0.2, -S * 1.2, S * 1.3, col, { lw, hi: shadeC(col, 0.3), dk: shadeC(col, -0.45), shade: 0.45 });
      scales(c, hood, col, S * 0.2, 0.4);
      c.save(); hood(); c.clip(); c.strokeStyle = 'rgba(10,4,20,.3)'; c.lineWidth = 1.3; for (let i = -4; i <= 4; i++) { if (!i) continue; c.beginPath(); c.moveTo(S * 0.2, -S * 0.5); c.quadraticCurveTo(S * 0.2 + i * S * 0.28, -S * 1.25, S * 0.2 + i * S * 0.32, -S * 1.9); c.stroke(); } c.restore();
      const spot = fire ? '#FFE37A' : '#FFFFFF', pupil = fire ? '#B83A3A' : '#FF9BD2';
      [[-0.62, -1.25], [1.02, -1.25]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x * S, y * S, S * 0.26, S * 0.17, 0, 0, TAU); c.fillStyle = shadeC(col, -0.4); c.fill(); c.beginPath(); c.ellipse(x * S, y * S, S * 0.2, S * 0.12, 0, 0, TAU); c.fillStyle = spot; c.fill(); c.beginPath(); c.ellipse(x * S, y * S, S * 0.09, S * 0.09, 0, 0, TAU); c.fillStyle = pupil; c.fill(); });
      if (!fire) { c.fillStyle = '#FF9BD2'; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; c.beginPath(); c.ellipse(S * 0.2 + Math.cos(a) * S * 0.2, -S * 1.65 + Math.sin(a) * S * 0.2, S * 0.1, S * 0.06, a, 0, TAU); c.fill(); } c.fillStyle = '#FFE37A'; c.beginPath(); c.arc(S * 0.2, -S * 1.65, S * 0.06, 0, TAU); c.fill(); }
      else spikes(c, -S * 0.9, -S * 1.3, S * 1.3, -S * 1.3, 7, S * 0.22, '#C9A24A', { lw: 0.8, taper: true });
      serpentHead(c, S * 0.25, -S * 1.1, S * 0.6, Math.atan2(me.y - m.y, me.x - m.x), col, m.act === 'lunge' ? 0.35 : 0.08 + 0.04 * Math.sin(t * 5), { lw: 1, iris: fire ? '#FF9F43' : '#FFD23A', glow: m.phase >= 2 ? (fire ? '#FF7A3D' : '#FF9BD2') : null });
    },
    // an undead warlord: a real skeleton (pelvis, spine, ribs, long bones) in pauldrons and a cape, with a greatsword
    skeleking(c, m, r, t, me, lw) {
      const bone = '#EDE6D6', chat = (Math.sin(t * 4) * 0.5 + 0.5) * r * 0.1, ec = m.phase >= 2 ? '#FF5C5C' : '#B9F0FF', S = r, bl = (...pts) => () => blobPath(c, pts, S);
      c.beginPath(); c.moveTo(-S * 0.6, -S * 0.5); c.quadraticCurveTo(-S * 1.3, S * 0.4, -S * 1.05, S * 1.1); for (let i = 0; i < 7; i++) c.lineTo(-S * 1.05 + (i + 0.5) * S * 0.3, S * (i % 2 ? 1.15 : 0.9)); c.lineTo(S * 1.05, S * 1.1); c.quadraticCurveTo(S * 1.3, S * 0.4, S * 0.6, -S * 0.5); c.closePath();
      c.fillStyle = lit(c, 0, S * 0.3, S * 1.4, '#4A1F2E', '#6E2F45', '#1E0A14'); c.fill(); contour(c, lw);
      // legs: femur, knee, tibia, armoured boots
      [-1, 1].forEach(s => { limb(c, s * S * 0.22, S * 0.6, s * S * 0.4, S * 0.95, S * 0.14, S * 0.11, bone, { lw: 1 }); joint(c, s * S * 0.4, S * 0.95, S * 0.08, bone, { lw: 0.8 }); plate(c, s * S * 0.42, S * 1.06, S * 0.34, S * 0.2, S * 0.05, '#5A5F78', {}); });
      // pelvis, spine, ribs around a glowing hollow
      form(c, bl([-0.42, 0.42], [-0.3, 0.75], [0, 0.82], [0.3, 0.75], [0.42, 0.42], [0, 0.5]), 0, S * 0.6, S * 0.4, bone, { lw: 1, shade: 0.45 });
      for (let i = 0; i < 6; i++) plate(c, 0, -S * 0.3 + i * S * 0.15, S * 0.16, S * 0.12, S * 0.03, shadeC(bone, -0.05), {});
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, S * 0.2, S * 0.3, S * 0.4, 0, 0, TAU); c.fill(); glow(c, 0, S * 0.2, S * 0.5, ec, 0.35);
      for (let i = 0; i < 4; i++) { const y = -S * 0.18 + i * S * 0.18, w = S * (0.62 - i * 0.08); [-1, 1].forEach(s => { limb(c, 0, y, s * w * 0.95, y + S * 0.16, S * 0.11, S * 0.08, bone, { lw: 0.9 }); }); }
      c.beginPath(); c.moveTo(-S * 0.1, -S * 0.3); c.lineTo(S * 0.1, -S * 0.3); c.lineTo(S * 0.08, S * 0.2); c.lineTo(-S * 0.08, S * 0.2); c.closePath(); c.fillStyle = shadeC(bone, -0.1); c.fill(); contour(c, 0.8);
      // shoulders and arms
      [-1, 1].forEach(s => { plate(c, s * S * 0.72, -S * 0.4, S * 0.55, S * 0.35, S * 0.1, '#5A5F78', { rivets: true, rot: s * 0.3 }); spikes(c, s * S * 0.5, -S * 0.55, s * S * 0.98, -S * 0.4, 2, S * 0.3, '#CFD3DE', { lw: 0.8 }); limb(c, s * S * 0.6, -S * 0.25, s * S * 0.95, S * 0.1, S * 0.13, S * 0.1, bone, { lw: 1 }); joint(c, s * S * 0.95, S * 0.1, S * 0.08, bone, { lw: 0.8 }); limb(c, s * S * 0.95, S * 0.1, s * S * (s > 0 ? 0.9 : 1.1), S * 0.5, S * 0.11, S * 0.09, bone, { lw: 1 }); joint(c, s * S * (s > 0 ? 0.9 : 1.1), S * 0.52, S * 0.1, bone, { lw: 0.8 }); });
      // greatsword
      c.save(); c.translate(S * 0.9, S * 0.5); c.rotate(-0.9 + (m.act === 'sweep' ? Math.sin(t * 12) * 0.5 : Math.sin(t * 2) * 0.1));
      tube(c, [[0, 0], [0, S * 0.45]], S * 0.12, '#3A2A1E', { lw: 1 }); plate(c, 0, 0, S * 0.7, S * 0.14, S * 0.04, '#C9A24A', {});
      c.beginPath(); c.moveTo(-S * 0.14, 0); c.lineTo(-S * 0.12, -S * 1.7); c.lineTo(0, -S * 1.95); c.lineTo(S * 0.12, -S * 1.7); c.lineTo(S * 0.14, 0); c.closePath(); c.fillStyle = lit(c, 0, -S * 0.9, S * 1.2, '#CFD3DE', '#FFFFFF', '#6E7390'); c.fill(); contour(c, lw);
      c.strokeStyle = 'rgba(43,36,51,.4)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -S * 0.1); c.lineTo(0, -S * 1.6); c.stroke(); glow(c, 0, -S * 1.0, S * 0.7, ec, 0.25);
      c.restore();
      // skull
      const skull = () => { c.beginPath(); c.moveTo(-S * 0.62, -S * 0.5); c.bezierCurveTo(-S * 0.85, -S * 1.55, S * 0.85, -S * 1.55, S * 0.62, -S * 0.5); c.quadraticCurveTo(S * 0.55, -S * 0.3, S * 0.42, -S * 0.3); c.lineTo(-S * 0.42, -S * 0.3); c.quadraticCurveTo(-S * 0.55, -S * 0.3, -S * 0.62, -S * 0.5); c.closePath(); };
      form(c, skull, 0, -S * 0.95, S * 0.85, bone, { lw, hi: '#FFFFFF', dk: '#9A8F7C', shade: 0.45 });
      strokes(c, [[-S * 0.1, -S * 1.4, -S * 0.05, -S * 1.15, -S * 0.18, -S * 1.0], [S * 0.35, -S * 1.2, S * 0.5, -S * 0.95, S * 0.45, -S * 0.8], [-S * 0.5, -S * 0.62, -S * 0.3, -S * 0.55, -S * 0.42, -S * 0.42]], 1.2, '#0A0414', 0.45);
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, -S * 0.5, S * 0.45, S * 0.12, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-S * 0.44, -S * 0.35 + chat); c.lineTo(-S * 0.36, -S * 0.02 + chat); c.lineTo(S * 0.36, -S * 0.02 + chat); c.lineTo(S * 0.44, -S * 0.35 + chat); c.closePath(); c.fillStyle = lit(c, 0, -S * 0.2 + chat, S * 0.5, bone, '#FFFFFF', '#9A8F7C'); c.fill(); contour(c, lw);
      c.fillStyle = '#FFFFFF'; for (let i = 0; i < 6; i++) { c.fillRect(-S * 0.33 + i * S * 0.115, -S * 0.42, S * 0.08, S * 0.14); c.fillRect(-S * 0.3 + i * S * 0.11, -S * 0.2 + chat, S * 0.07, S * 0.12); } c.strokeStyle = 'rgba(43,36,51,.5)'; c.lineWidth = 1; for (let i = 0; i < 6; i++) c.strokeRect(-S * 0.33 + i * S * 0.115, -S * 0.42, S * 0.08, S * 0.14);
      [-0.3, 0.3].forEach(ex => pitEye(c, ex * S, -S * 0.85, S * 0.21, ec));
      c.beginPath(); c.moveTo(-S * 0.07, -S * 0.52); c.lineTo(S * 0.07, -S * 0.52); c.lineTo(0, -S * 0.68); c.closePath(); c.fillStyle = '#2A1E2E'; c.fill();
      [-1, 1].forEach(s => horn(c, s * S * 0.5, -S * 1.15, S * 0.6, s > 0 ? -1.0 : -2.14, S * 0.17, '#D8CFBE', 0.45, { lw: 1, rings: 3 }));
      crown(c, 0, -S * 1.3, S * 0.85);
    },
    // an armoured angel: six feathered wings, a breastplate and pauldrons over robes, a golden helm, a burning blade
    seraph(c, m, r, t, me, lw) {
      const fl = Math.sin(t * 5) * 0.25, [lx, ly] = lookAt(m, me), gold = '#F2C94C', skin = m.phase >= 2 ? '#FFC24A' : '#FFE7A8', S = r, bl = (...pts) => () => blobPath(c, pts, S);
      [[-0.55, 0.85, -1.1], [0, 1.05, -0.35], [0.5, 0.8, 0.35]].forEach(([dy, s, rot], i) => [-1, 1].forEach(sd => featherWing(c, sd * S * 0.45, dy * S, S * s * 1.6, rot, i === 1 ? '#FFF6E0' : '#F4E6C8', sd, fl * (i === 1 ? 1 : 0.6), { lw: 1 })));
      c.beginPath(); c.ellipse(0, -S * 1.4, S * 0.8, S * 0.22, 0, 0, TAU); c.lineWidth = S * 0.16; c.strokeStyle = gold; c.stroke(); c.lineWidth = S * 0.05; c.strokeStyle = '#FFFBE0'; c.stroke(); glow(c, 0, -S * 1.4, S * 1.0, '#FFE37A', 0.5);
      // robe skirt, belt, greaves
      form(c, bl([-0.5, 0.1], [-0.75, 0.6], [-0.7, 1.05], [0.7, 1.05], [0.75, 0.6], [0.5, 0.1]), 0, S * 0.6, S * 0.9, '#F4F1E6', { lw, hi: '#FFFFFF', dk: '#B8B09C', shade: 0.45 });
      strokes(c, [[-S * 0.3, S * 0.15, -S * 0.35, S * 0.6, -S * 0.42, S * 1.02], [0, S * 0.15, 0, S * 0.6, 0, S * 1.02], [S * 0.3, S * 0.15, S * 0.35, S * 0.6, S * 0.42, S * 1.02]], lw, '#0A0414', 0.2);
      [-1, 1].forEach(s => plate(c, s * S * 0.3, S * 0.98, S * 0.28, S * 0.22, S * 0.05, gold, {}));
      // torso and breastplate
      form(c, bl([-0.58, -0.4], [-0.55, 0.25], [0, 0.4], [0.55, 0.25], [0.58, -0.4], [0, -0.55]), 0, -S * 0.1, S * 0.6, '#F4F1E6', { lw, shade: 0.4 });
      plate(c, 0, -S * 0.05, S * 1.0, S * 0.72, S * 0.2, gold, { rivets: true });
      c.beginPath(); c.moveTo(0, -S * 0.3); c.lineTo(S * 0.18, 0); c.lineTo(0, S * 0.25); c.lineTo(-S * 0.18, 0); c.closePath(); c.fillStyle = lit(c, 0, -S * 0.05, S * 0.3, '#7FD3F2', '#FFFFFF', '#2F80B7'); c.fill(); contour(c, 1); glow(c, 0, -S * 0.05, S * 0.45, '#BFEFFF', 0.6);
      // arms
      [-1, 1].forEach(s => { plate(c, s * S * 0.62, -S * 0.42, S * 0.46, S * 0.3, S * 0.1, gold, { rot: s * 0.35 }); limb(c, s * S * 0.6, -S * 0.3, s * S * 0.95, S * (s > 0 ? 0.0 : 0.2), S * 0.2, S * 0.17, skin, { lw: 1 }); joint(c, s * S * 0.95, S * (s > 0 ? 0.0 : 0.2), S * 0.1, skin, { lw: 0.8 }); limb(c, s * S * 0.95, S * (s > 0 ? 0.0 : 0.2), s * S * (s > 0 ? 1.0 : 1.05), S * (s > 0 ? 0.45 : 0.6), S * 0.17, S * 0.15, skin, { lw: 1 }); plate(c, s * S * (s > 0 ? 1.0 : 1.05), S * (s > 0 ? 0.5 : 0.65), S * 0.26, S * 0.26, S * 0.06, gold, {}); });
      // head under a golden helm
      form(c, ellB(c, 0, -S * 0.75, S * 0.42, S * 0.44), 0, -S * 0.75, S * 0.44, skin, { lw, hi: shadeC(skin, 0.25), dk: shadeC(skin, -0.3), shade: 0.4 });
      c.beginPath(); c.moveTo(-S * 0.46, -S * 0.85); c.quadraticCurveTo(0, -S * 1.38, S * 0.46, -S * 0.85); c.lineTo(S * 0.38, -S * 0.75); c.quadraticCurveTo(0, -S * 1.12, -S * 0.38, -S * 0.75); c.closePath(); c.fillStyle = lit(c, 0, -S * 1.0, S * 0.5, gold, '#FFF2B0', '#B8891C'); c.fill(); contour(c, lw);
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * S * 0.4, -S * 0.82); c.lineTo(s * S * 0.44, -S * 0.5); c.lineTo(s * S * 0.3, -S * 0.5); c.closePath(); c.fillStyle = gold; c.fill(); contour(c, 1); });
      spikes(c, -S * 0.3, -S * 1.08, S * 0.3, -S * 1.08, 3, S * 0.25, gold, { lw: 0.8 });
      [-1, 1].forEach(s => eye(c, s * S * 0.17, -S * 0.75, S * 0.11, { iris: m.phase >= 2 ? '#FF9F43' : '#4FA8F0', sclera: '#FFFFFF', lookX: lx, lookY: ly, brow: 0.8 * s, browCol: '#8A6A2A', glow: m.phase >= 2 ? '#FFE37A' : null, ry: 0.8 }));
      c.strokeStyle = INK; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(-S * 0.16, -S * 0.52); c.quadraticCurveTo(0, -S * 0.45, S * 0.16, -S * 0.52); c.stroke();
      // flaming blade
      c.save(); c.translate(S * 1.0, S * 0.5); c.rotate(-0.4 + Math.sin(t * 2) * 0.06);
      c.beginPath(); c.moveTo(-S * 0.09, -S * 0.1); c.lineTo(-S * 0.07, -S * 1.8); c.lineTo(0, -S * 2.0); c.lineTo(S * 0.07, -S * 1.8); c.lineTo(S * 0.09, -S * 0.1); c.closePath(); c.fillStyle = lit(c, 0, -S * 0.9, S * 1.2, '#FFF2B0', '#FFFFFF', '#D4A62A'); c.fill(); contour(c, lw * 0.9);
      plate(c, 0, -S * 0.1, S * 0.5, S * 0.12, S * 0.04, gold, {}); glow(c, 0, -S * 1.0, S * 0.9, '#FFE37A', 0.6);
      c.restore();
    },
    // a dark knight: a horned helm over a void, pauldrons and plate over a body of smoke, a crackling greatsword
    shade(c, m, r, t, me, lw) {
      const col = m.color, cape = Math.sin(t * 3) * r * 0.1, [lx, ly] = lookAt(m, me), S = r, bl = (...pts) => () => blobPath(c, pts, S), steel = shadeC(col, 0.12);
      for (let i = 0; i < 6; i++) { const u = ((t * 0.5 + i * 0.17) % 1), px = (i - 2.5) * S * 0.3 + Math.sin(t * 2 + i) * S * 0.1, py = S * 0.2 - u * S * 1.9; glow(c, px, py, S * (0.3 + u * 0.5), '#E07BF0', (1 - u) * 0.25); }
      c.beginPath(); c.moveTo(-S * 0.6, -S * 0.55); c.quadraticCurveTo(-S * 1.35, S * 0.5, -S * 1.1 + cape, S * 1.15); for (let i = 0; i < 7; i++) c.lineTo(-S * 1.1 + cape + (i + 0.5) * (2.2 * S - 2 * cape) / 7, S * (i % 2 ? 1.2 : 0.95)); c.lineTo(S * 1.1 - cape, S * 1.15); c.quadraticCurveTo(S * 1.35, S * 0.5, S * 0.6, -S * 0.55); c.closePath();
      c.fillStyle = lit(c, 0, S * 0.3, S * 1.4, '#1E1538', '#3B2F63', '#07040F'); c.fill(); contour(c, lw);
      // legs of smoke into greaves
      [-1, 1].forEach(s => { glow(c, s * S * 0.3, S * 0.75, S * 0.5, '#7A2A8E', 0.35); limb(c, s * S * 0.28, S * 0.5, s * S * 0.38, S * 0.98, S * 0.3, S * 0.26, col, { lw: 1 }); plate(c, s * S * 0.4, S * 1.05, S * 0.4, S * 0.2, S * 0.05, steel, { rivets: true }); });
      // torso and plate
      form(c, bl([-0.7, -0.35], [-0.72, 0.5], [-0.4, 0.75], [0.4, 0.75], [0.72, 0.5], [0.7, -0.35], [0, -0.55]), 0, S * 0.1, S * 0.8, col, { lw, hi: shadeC(col, 0.25), dk: shadeC(col, -0.5), shade: 0.45 });
      plate(c, 0, S * 0.1, S * 1.0, S * 0.8, S * 0.18, steel, { rivets: true });
      c.beginPath(); c.moveTo(0, -S * 0.2); c.lineTo(S * 0.2, S * 0.1); c.lineTo(0, S * 0.4); c.lineTo(-S * 0.2, S * 0.1); c.closePath(); c.fillStyle = lit(c, 0, S * 0.1, S * 0.3, '#E07BF0', '#FFFFFF', '#7A2A8E'); c.fill(); contour(c, 1); glow(c, 0, S * 0.1, S * 0.55, '#E07BF0', 0.7);
      // arms
      [-1, 1].forEach(s => { plate(c, s * S * 0.78, -S * 0.3, S * 0.55, S * 0.38, S * 0.1, steel, { rivets: true, rot: s * 0.3 }); spikes(c, s * S * 0.58, -S * 0.48, s * S * 1.05, -S * 0.3, 3, S * 0.3, '#B983F5', { lw: 0.8 }); limb(c, s * S * 0.75, -S * 0.1, s * S * 1.05, S * 0.3, S * 0.26, S * 0.22, col, { lw: 1 }); joint(c, s * S * 1.05, S * 0.3, S * 0.12, steel, { lw: 1 }); limb(c, s * S * 1.05, S * 0.3, s * S * (s > 0 ? 1.0 : 1.12), S * 0.7, S * 0.22, S * 0.2, col, { lw: 1 }); plate(c, s * S * (s > 0 ? 1.0 : 1.12), S * 0.75, S * 0.3, S * 0.3, S * 0.08, steel, {}); });
      c.save(); c.translate(S * 1.0, S * 0.75); c.rotate(-0.55 + Math.sin(t * 2) * 0.05);
      c.beginPath(); c.moveTo(-S * 0.12, -S * 0.1); c.lineTo(-S * 0.1, -S * 1.85); c.lineTo(0, -S * 2.1); c.lineTo(S * 0.1, -S * 1.85); c.lineTo(S * 0.12, -S * 0.1); c.closePath(); c.fillStyle = lit(c, 0, -S * 0.9, S * 1.2, '#4A3A7A', '#B983F5', '#160C2A'); c.fill(); contour(c, lw);
      c.strokeStyle = '#E07BF0'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -S * 0.2); c.lineTo(0, -S * 1.8); c.stroke(); glow(c, 0, -S * 1.0, S * 0.9, '#E07BF0', 0.5); plate(c, 0, -S * 0.1, S * 0.6, S * 0.14, S * 0.04, '#F2C94C', {});
      c.restore();
      // helm over the void
      form(c, bl([-0.55, -0.5], [-0.6, -1.0], [-0.3, -1.25], [0.3, -1.25], [0.6, -1.0], [0.55, -0.5], [0, -0.35]), 0, -S * 0.85, S * 0.6, steel, { lw, hi: shadeC(steel, 0.3), dk: shadeC(steel, -0.5), shade: 0.5 });
      c.fillStyle = '#07040F'; c.beginPath(); c.moveTo(-S * 0.45, -S * 0.95); c.lineTo(S * 0.45, -S * 0.95); c.lineTo(S * 0.3, -S * 0.55); c.lineTo(-S * 0.3, -S * 0.55); c.closePath(); c.fill();
      [-1, 1].forEach(s => { glow(c, s * S * 0.18 + lx * S * 0.05, -S * 0.78 + ly * S * 0.03, S * 0.32, '#FF7BF0', 0.9); c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(s * S * 0.18 + lx * S * 0.05, -S * 0.78 + ly * S * 0.03, S * 0.1, S * 0.05, s * 0.3, 0, TAU); c.fill(); });
      strokes(c, [[-S * 0.1, -S * 0.55, 0, -S * 0.5, S * 0.1, -S * 0.55], [-S * 0.3, -S * 1.15, 0, -S * 1.2, S * 0.3, -S * 1.15]], 1.2, '#0A0414', 0.5);
      [-1, 1].forEach(s => horn(c, s * S * 0.45, -S * 1.1, S * 0.7, s > 0 ? -0.95 : -2.2, S * 0.17, '#2A2040', 0.5, { lw: 1, rings: 3 }));
      crown(c, 0, -S * 1.25, S * 0.8);
    },

    // a deep-sea octopus: a bulbous mantle with mottled skin, slit eyes on the sides of the head, eight suckered arms coiling round
    octopus(c, m, r, t, me, lw) {
      const col = m.phase >= 2 ? '#A3365A' : m.color, S = r, pale = shadeC(col, 0.55), [lx, ly] = lookAt(m, me);
      if (m.under) return;
      // arms: back ones first
      const arms = [[-1.0, 0.25, -2.3, 0.1, -2.2, 1.0, -1.2, 1.1], [1.0, 0.25, 2.3, 0.1, 2.2, 1.0, 1.2, 1.1], [-0.8, 0.5, -1.9, 1.2, -2.4, 0.5, -2.1, -0.2], [0.8, 0.5, 1.9, 1.2, 2.4, 0.5, 2.1, -0.2], [-0.5, 0.6, -1.2, 1.4, -0.4, 1.5, 0.2, 1.15], [0.5, 0.6, 1.2, 1.4, 0.4, 1.5, -0.2, 1.15], [-0.3, 0.5, -0.9, 1.0, -1.6, 1.3, -1.9, 0.8], [0.3, 0.5, 0.9, 1.0, 1.6, 1.3, 1.9, 0.8]];
      arms.forEach(([x0, y0, x1, y1, x2, y2, x3, y3], i) => { const wob = Math.sin(t * 1.6 + i * 1.1) * S * 0.08, side = x3 < x0 ? -1 : 1; tentacle(c, [x0 * S, y0 * S], [x1 * S + wob, y1 * S], [x2 * S, y2 * S + wob], [x3 * S, y3 * S], S * 0.34, S * 0.08, i % 2 ? shadeC(col, -0.06) : col, { sucker: pale, side }); });
      // the mantle
      const mantle = () => blobPath(c, [[-0.95, 0.1], [-1.0, -0.55], [-0.6, -1.25], [0, -1.45], [0.6, -1.25], [1.0, -0.55], [0.95, 0.1], [0.5, 0.55], [-0.5, 0.55]], S);
      form(c, mantle, 0, -S * 0.45, S * 1.2, col, { lw, hi: shadeC(col, 0.3), dk: shadeC(col, -0.5), shade: 0.5 });
      c.save(); mantle(); c.clip();
      const R = mulberry32(5); for (let i = 0; i < 40; i++) { const x = (R() - 0.5) * S * 2, y = -S * 0.45 + (R() - 0.5) * S * 1.9, rr = S * (0.03 + R() * 0.06); c.fillStyle = i % 3 ? 'rgba(10,4,20,.14)' : 'rgba(255,255,255,.12)'; c.beginPath(); c.ellipse(x, y, rr * 1.4, rr, R() * 3, 0, TAU); c.fill(); }
      if (m.phase >= 2) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, px = Math.cos(a) * S * 0.6, py = -S * 0.5 + Math.sin(a) * S * 0.75; glow(c, px, py, S * 0.22, '#7FD3F2', 0.5 + 0.3 * Math.sin(t * 4 + i)); }
      c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(-S * 0.35, -S * 1.0, S * 0.35, S * 0.16, -0.5, 0, TAU); c.fill();
      c.restore();
      // head band and the siphon
      limb(c, -S * 0.75, S * 0.15, S * 0.75, S * 0.15, S * 0.26, S * 0.26, shadeC(col, -0.08), { lw: 0 });
      form(c, ellB(c, S * 0.95, S * 0.1, S * 0.14, S * 0.22, 0.6), S * 0.95, S * 0.1, S * 0.2, shadeC(col, -0.15), { lw: 1 });
      // eyes: big, horizontal slit pupils, heavy lids
      [-1, 1].forEach(s => { form(c, ellB(c, s * S * 0.62, -S * 0.2, S * 0.3, S * 0.26), s * S * 0.62, -S * 0.2, S * 0.3, col, { lw: 1, shade: 0.4 }); eye(c, s * S * 0.62, -S * 0.2, S * 0.2, { iris: m.phase >= 2 ? '#FF9F43' : '#E8B84A', sclera: '#F2E6C4', lookX: lx, lookY: ly, ry: 0.85, ir: 0.72, glow: m.phase >= 2 ? '#FF9F43' : null }); c.fillStyle = '#0B0612'; c.beginPath(); c.ellipse(s * S * 0.62 + lx * S * 0.04, -S * 0.2 + ly * S * 0.02, S * 0.1, S * 0.035, 0, 0, TAU); c.fill(); c.fillStyle = shadeC(col, -0.25); c.beginPath(); c.ellipse(s * S * 0.62, -S * 0.42, S * 0.3, S * 0.1, 0, 0, TAU); c.fill(); });
      // beak between the arms
      c.beginPath(); c.moveTo(-S * 0.18, S * 0.55); c.quadraticCurveTo(0, S * 0.45, S * 0.18, S * 0.55); c.lineTo(0, S * 0.82); c.closePath(); c.fillStyle = lit(c, 0, S * 0.62, S * 0.2, '#2A1E2E', '#5A4A5E', '#0B0612'); c.fill(); contour(c, 1);
      c.fillStyle = '#F6F0DC'; c.beginPath(); c.moveTo(-S * 0.06, S * 0.6); c.lineTo(0, S * 0.74); c.lineTo(S * 0.06, S * 0.6); c.fill();
    },
    // a behemoth: a crouching purple brute, all shoulder and haunch, a shaggy copper mane down the spine, bull horns and a low heavy head
    behemoth(c, m, r, t, me, lw) {
      const S = r, col = '#8A62C4', hiC = '#C9A8EC', dkC = '#3E2470', belly = '#D7BEF0', maneC = '#D2762E', maneD = '#6E3312', maneL = '#F2A95A', [lx, ly] = lookAt(m, me), br = Math.sin(t * 1.6) * S * 0.025, hot = m.phase >= 2;
      const bl = (...pts) => () => blobPath(c, pts, S);
      const lim = (x0, y0, x1, y1, w0, w1, cc, o) => limb(c, x0 * S, y0 * S, x1 * S, y1 * S, w0 * S, w1 * S, cc, Object.assign({ lw }, o || {}));
      // tail: long, whip-thick, curling up behind
      const tw = Math.sin(t * 2) * S * 0.08;
      tube(c, [[-S * 1.3, -S * 0.15], [-S * 2.3, S * 0.15 + tw], [-S * 2.75, -S * 0.5], [-S * 2.35, -S * 1.05 + tw]], S * 0.3, shadeC(col, -0.08), { lw: 1 });
      horn(c, -S * 2.35, -S * 1.05 + tw, S * 0.4, -1.3, S * 0.2, shadeC(col, -0.1), 0.3, { lw: 1 });
      // far legs (in shadow)
      lim(-0.75, 0.25, -0.6, 0.6, 0.42, 0.3, dkC); lim(-0.6, 0.6, -0.5, 0.95, 0.3, 0.26, dkC, { rings: 2 }); paw(c, -S * 0.45, S * 1.02, S * 0.52, shadeC(dkC, -0.05));
      lim(0.45, -0.1, 0.25, 0.45, 0.46, 0.32, dkC); lim(0.25, 0.45, 0.6, 0.95, 0.32, 0.28, dkC, { rings: 2 }); paw(c, S * 0.68, S * 1.02, S * 0.52, shadeC(dkC, -0.05));
      // the body: hump of shoulder, deep chest, lighter belly
      const body = bl([-1.42, -0.05], [-1.35, -0.6], [-0.75, -0.98], [0.1, -1.18], [0.75, -1.02], [1.08, -0.62], [1.12, -0.12], [0.92, 0.36], [0.2, 0.52], [-0.9, 0.52], [-1.36, 0.32]);
      form(c, body, -S * 0.1, -S * 0.25, S * 1.45, col, { lw, hi: hiC, dk: dkC, shade: 0.5 });
      c.save(); body(); c.clip();
      const bg = c.createLinearGradient(0, -S * 0.2, 0, S * 0.55); bg.addColorStop(0, 'rgba(215,190,240,0)'); bg.addColorStop(1, 'rgba(215,190,240,.55)'); c.fillStyle = bg; c.fillRect(-S * 1.5, -S * 0.3, S * 2.7, S * 0.9);
      // shoulder and haunch masses
      form(c, ellB(c, S * 0.55, -S * 0.5, S * 0.5, S * 0.42, 0.3), S * 0.55, -S * 0.5, S * 0.5, col, { lw: 0, hi: hiC, dk: dkC, shade: 0.45 });
      form(c, ellB(c, -S * 0.9, -S * 0.15, S * 0.55, S * 0.5, -0.25), -S * 0.9, -S * 0.15, S * 0.55, col, { lw: 0, hi: hiC, dk: dkC, shade: 0.45 });
      muscle(c, [[S * 0.15, -S * 0.55, S * 0.35, -S * 0.1, S * 0.2, S * 0.3], [S * 0.9, -S * 0.8, S * 1.0, -S * 0.5, S * 0.85, -S * 0.15], [-S * 0.45, -S * 0.5, -S * 0.3, -S * 0.1, -S * 0.4, S * 0.35], [-S * 1.3, -S * 0.3, -S * 1.15, 0, -S * 1.25, S * 0.3]], lw * 1.3, 0.3);
      strokes(c, [[-S * 0.1, S * 0.05, S * 0.05, S * 0.15, -S * 0.05, S * 0.3], [S * 0.1, 0, S * 0.25, S * 0.1, S * 0.15, S * 0.3], [-S * 0.3, S * 0.1, -S * 0.15, S * 0.2, -S * 0.25, S * 0.35]], lw, '#0A0414', 0.22);
      hairs(c, body, -S * 1.4, -S * 1.2, S * 2.5, S * 1.7, dkC, 90, 11, 0.2, S * 0.12, 0.22);
      hairs(c, body, -S * 1.4, -S * 1.2, S * 2.5, S * 1.2, '#FFFFFF', 40, 12, 0.2, S * 0.1, 0.1);
      if (hot) cracks(c, 0, -S * 0.2, S * 1.1, '#0A0414', 7, '#FF9F43');
      c.restore();
      // near legs: crouched, elbows back, forearms forward; thick hind leg with a hock
      lim(0.62, -0.35, 0.45, 0.4, 0.56, 0.4, col); joint(c, S * 0.45, S * 0.4, S * 0.2, shadeC(col, -0.1), { lw: 1 }); lim(0.45, 0.4, 0.98, 0.92, 0.4, 0.34, col, { rings: 2 }); paw(c, S * 1.1, S * 1.02, S * 0.62, col);
      muscle(c, [[S * 0.4, -S * 0.2, S * 0.35, S * 0.05, S * 0.4, S * 0.3], [S * 0.6, S * 0.5, S * 0.8, S * 0.6, S * 0.9, S * 0.85]], lw, 0.3);
      lim(-1.05, 0.3, -1.4, 0.62, 0.46, 0.32, col); joint(c, -S * 1.4, S * 0.62, S * 0.17, shadeC(col, -0.1), { lw: 1 }); lim(-1.4, 0.62, -1.15, 0.95, 0.32, 0.3, col, { rings: 2 }); paw(c, -S * 1.02, S * 1.02, S * 0.58, col);
      // the copper mane: two shaggy layers down the spine, then a ruff behind the head
      const spine = [[-1.3, -0.62], [-0.75, -0.98], [0.1, -1.18], [0.75, -1.02], [1.05, -0.7]].map(([x, y]) => [x * S, y * S]);
      const prof = u => 0.75 + 0.5 * Math.sin(u * Math.PI);
      ridgeTufts(c, spine, 18, S * 0.55, S * 0.34, maneD, '#3A1608', { seed: 7, lean: -0.6, bend: 0.12, sil: true, lw: 0, profile: prof });
      ridgeTufts(c, spine, 16, S * 0.42, S * 0.26, maneC, maneD, { seed: 8, lean: -0.55, bend: 0.15, lw: 0, hair: maneL, profile: prof });
      ridgeTufts(c, spine, 12, S * 0.26, S * 0.12, maneL, maneC, { seed: 11, lean: -0.5, bend: 0.1, lw: 0, profile: prof });
      maneTufts(c, S * 1.1, -S * 0.45, S * 0.42, S * 0.5, Math.PI * 0.72, Math.PI * 1.65, 11, S * 0.45, S * 0.26, maneD, '#3A1608', { seed: 9, lean: -0.55, t, sil: true, lw: 0 });
      maneTufts(c, S * 1.1, -S * 0.45, S * 0.34, S * 0.4, Math.PI * 0.75, Math.PI * 1.6, 10, S * 0.34, S * 0.18, maneC, maneD, { seed: 10, lean: -0.5, t, lw: 0, hair: maneL });
      // head: low and heavy, a bull's brow, a wide snout
      const hy = br;
      const head = () => blobPath(c, [[1.0, -0.35], [1.1, -0.8], [1.5, -0.9], [1.9, -0.72], [2.2, -0.42], [2.2, -0.1], [1.95, 0.12], [1.5, 0.18], [1.12, 0.1]].map(([x, y]) => [x, y + hy / S]), S);
      form(c, head, S * 1.6, -S * 0.35 + hy, S * 0.72, col, { lw, hi: hiC, dk: dkC, shade: 0.5 });
      c.save(); head(); c.clip();
      muscle(c, [[S * 1.25, -S * 0.7 + hy, S * 1.4, -S * 0.5 + hy, S * 1.3, -S * 0.2 + hy], [S * 1.85, -S * 0.6 + hy, S * 2.0, -S * 0.4 + hy, S * 1.95, -S * 0.1 + hy]], lw, 0.3);
      c.fillStyle = 'rgba(215,190,240,.35)'; c.beginPath(); c.ellipse(S * 1.75, S * 0.05 + hy, S * 0.45, S * 0.14, 0, 0, TAU); c.fill();
      c.restore();
      // lower jaw with tusks
      const open = m.act === 'gore' || m.act === 'charge' || hot ? 0.28 : 0.1 + 0.03 * Math.sin(t * 2.2);
      c.save(); c.translate(S * 1.5, S * 0.12 + hy); c.rotate(open);
      c.beginPath(); c.moveTo(0, -S * 0.02); c.quadraticCurveTo(S * 0.4, -S * 0.06, S * 0.68, 0); c.quadraticCurveTo(S * 0.6, S * 0.22, S * 0.3, S * 0.24); c.quadraticCurveTo(S * 0.05, S * 0.22, 0, S * 0.12); c.closePath(); c.fillStyle = lit(c, S * 0.3, S * 0.1, S * 0.4, shadeC(col, -0.05), hiC, dkC); c.fill(); contour(c, lw);
      c.fillStyle = '#2A0F26'; c.beginPath(); c.moveTo(S * 0.04, 0); c.quadraticCurveTo(S * 0.4, -S * 0.03, S * 0.62, S * 0.02); c.quadraticCurveTo(S * 0.4, S * 0.1, S * 0.04, S * 0.08); c.fill();
      horn(c, S * 0.6, S * 0.0, S * 0.26, -1.8, S * 0.09, '#F2ECDD', 0.2, { lw: 0.8 }); horn(c, S * 0.42, S * 0.0, S * 0.2, -1.75, S * 0.08, '#F2ECDD', 0.2, { lw: 0.8 });
      c.restore();
      // upper teeth, nostril, eye under the brow, a small ear
      c.save(); head(); c.clip(); c.fillStyle = '#2A0F26'; c.beginPath(); c.moveTo(S * 1.55, S * 0.1 + hy); c.quadraticCurveTo(S * 1.9, S * 0.02 + hy, S * 2.15, S * 0.02 + hy); c.lineTo(S * 2.15, S * 0.12 + hy); c.quadraticCurveTo(S * 1.9, S * 0.16 + hy, S * 1.55, S * 0.2 + hy); c.fill();
      for (let k = 0; k < 5; k++) horn(c, S * (1.62 + k * 0.12), S * 0.1 + hy, S * (k === 1 || k === 4 ? 0.2 : 0.12), 1.5, S * 0.07, '#F2ECDD', 0.05, { lw: 0.7 });
      c.restore();
      c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.ellipse(S * 2.1, -S * 0.3 + hy, S * 0.06, S * 0.045, 0.4, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(S * 1.95, -S * 0.5 + hy); c.quadraticCurveTo(S * 2.1, -S * 0.5 + hy, S * 2.2, -S * 0.35 + hy); c.strokeStyle = 'rgba(10,4,20,.35)'; c.lineWidth = lw; c.stroke();
      eye(c, S * 1.55, -S * 0.5 + hy, S * 0.12, { iris: hot ? '#FF4D6D' : '#FF9F43', sclera: '#F2E6C4', lookX: lx, lookY: ly, ry: 0.72, brow: 1.0, browCol: shadeC(col, -0.55), glow: hot ? '#FF7A3D' : null });
      tufts(c, [[S * 1.18, -S * 0.72 + hy, -2.2, S * 0.26, S * 0.16, 0.2]], shadeC(col, -0.1), dkC, { lw: 0.9 });
      c.fillStyle = dkC; c.beginPath(); c.moveTo(S * 1.2, -S * 0.72 + hy); c.lineTo(S * 1.06, -S * 0.9 + hy); c.lineTo(S * 1.16, -S * 0.62 + hy); c.fill();
      // bull horns: forward and curling up, the far one a shade darker
      curlHorn(c, S * 1.3, -S * 0.78 + hy, S * 1.0, -0.5, -1.35, S * 0.26, '#C9C0B0', { lw: 1 });
      curlHorn(c, S * 1.45, -S * 0.84 + hy, S * 1.15, -0.35, -1.4, S * 0.3, '#EDE6D8', { lw: 1 });
      // beard tufts under the jaw
      tufts(c, [[S * 1.35, S * 0.3 + hy, 1.9, S * 0.22, S * 0.1, 0.1], [S * 1.22, S * 0.26 + hy, 2.1, S * 0.2, S * 0.09, 0.1], [S * 1.5, S * 0.33 + hy, 1.7, S * 0.18, S * 0.09, 0]], maneC, maneD, { lw: 0.8 });
      if (hot) glow(c, S * 1.7, -S * 0.1, S * 0.7, '#FF9F43', 0.3);
    },
    // the king of apes: upright, silverback, crowned and armoured, fists raised to the chest
    kingape(c, m, r, t, me, lw) {
      const col = m.color, S = r, silver = '#8E8A96', skin = '#4A3C44', gold = '#E7B84A', [lx, ly] = lookAt(m, me), beat = m.beat ? Math.abs(Math.sin(t * 14)) : 0;
      const bl = (...pts) => () => blobPath(c, pts, S);
      // legs
      [-1, 1].forEach(s => { limb(c, s * S * 0.45, S * 0.45, s * S * 0.62, S * 0.95, S * 0.56, S * 0.44, col, { lw }); form(c, ellB(c, s * S * 0.66, S * 1.02, S * 0.42, S * 0.18), s * S * 0.66, S * 1.02, S * 0.42, skin, { lw: 1 }); c.fillStyle = '#2A2228'; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(s * S * (0.38 + k * 0.17), S * 1.1, S * 0.06, S * 0.05, 0, 0, TAU); c.fill(); } });
      // silver back hump
      form(c, ellB(c, 0, -S * 0.7, S * 1.0, S * 0.62), 0, -S * 0.7, S * 1.0, silver, { lw, shade: 0.5 });
      // torso: wide chest, narrow waist
      const torso = bl([-1.1, -0.6], [-0.95, 0.15], [-0.6, 0.75], [0, 0.9], [0.6, 0.75], [0.95, 0.15], [1.1, -0.6], [0.55, -0.95], [-0.55, -0.95]);
      form(c, torso, 0, 0, S * 1.2, col, { lw, hi: shadeC(col, 0.3), dk: shadeC(col, -0.5), shade: 0.5 });
      c.save(); torso(); c.clip(); strokes(c, [[-S * 0.95, -S * 0.4, -S * 0.8, 0, -S * 0.7, S * 0.5], [S * 0.95, -S * 0.4, S * 0.8, 0, S * 0.7, S * 0.5]], lw * 1.1, '#0A0414', 0.35); c.restore();
      const chest = bl([-0.7, -0.45], [-0.66, 0.3], [-0.3, 0.68], [0.3, 0.68], [0.66, 0.3], [0.7, -0.45], [0, -0.6]);
      form(c, chest, 0, S * 0.05, S * 0.72, skin, { lw: 0, shade: 0.45 });
      c.save(); chest(); c.clip(); c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.ellipse(-S * 0.3, -S * 0.3, S * 0.3, S * 0.12, -0.3, 0, TAU); c.ellipse(S * 0.3, -S * 0.3, S * 0.3, S * 0.12, 0.3, 0, TAU); c.fill(); c.restore();
      strokes(c, [[0, -S * 0.3, 0, S * 0.2, 0, S * 0.66], [-S * 0.6, S * 0.0, -S * 0.3, S * 0.12, -S * 0.04, S * 0.02], [S * 0.6, S * 0.0, S * 0.3, S * 0.12, S * 0.04, S * 0.02], [-S * 0.32, S * 0.28, -S * 0.1, S * 0.34, S * 0.32, S * 0.28], [-S * 0.28, S * 0.46, -S * 0.08, S * 0.52, S * 0.28, S * 0.46]], 1.3, '#0A0414', 0.4);
      chest(); contour(c, 1);
      // golden belt and bracers come with the arms
      plate(c, 0, S * 0.72, S * 1.1, S * 0.16, S * 0.04, gold, {}); form(c, ellB(c, 0, S * 0.72, S * 0.12, S * 0.12), 0, S * 0.72, S * 0.12, '#FF5C8A', { lw: 1 });
      // arms: raised, fists at the chest (beating when roaring)
      [-1, 1].forEach(s => {
        const fx = s * S * (0.8 - beat * 0.25), fy = -S * 0.55 + beat * S * 0.25;
        joint(c, s * S * 1.05, -S * 0.6, S * 0.44, col, { lw });
        limb(c, s * S * 1.05, -S * 0.6, s * S * 1.55, S * 0.1, S * 0.58, S * 0.46, col, { lw });
        joint(c, s * S * 1.55, S * 0.1, S * 0.26, shadeC(col, -0.1), { lw: 1 });
        limb(c, s * S * 1.55, S * 0.1, fx, fy, S * 0.5, S * 0.4, col, { lw });
        plate(c, s * S * 1.1, 0, S * 0.36, S * 0.42, S * 0.08, gold, { rivets: true, rot: s * 0.9 });
        form(c, ellB(c, fx, fy, S * 0.3, S * 0.26, s * 0.4), fx, fy, S * 0.3, shadeC(skin, -0.08), { lw: 1, shade: 0.45, spec: false });
        for (let k = 0; k < 4; k++) { const kx = fx + (k - 1.5) * S * 0.13 * Math.cos(s * 0.4), ky = fy - S * 0.2 + (k - 1.5) * S * 0.13 * Math.sin(s * 0.4); form(c, ellB(c, kx, ky, S * 0.075, S * 0.07), kx, ky, S * 0.075, shadeC(skin, -0.02), { lw: 0.8, spec: false }); }
        form(c, ellB(c, fx - s * S * 0.22, fy + S * 0.06, S * 0.12, S * 0.09, s * 0.6), fx - s * S * 0.22, fy + S * 0.06, S * 0.12, shadeC(skin, -0.05), { lw: 0.8, spec: false });
        strokes(c, [[s * S * 1.15, -S * 0.45, s * S * 1.4, -S * 0.15, s * S * 1.5, S * 0.05]], lw, '#0A0414', 0.3);
      });
      // head: crested, heavy brow, roaring
      form(c, bl([-0.55, -0.85], [-0.6, -1.22], [-0.32, -1.52], [0, -1.6], [0.32, -1.52], [0.6, -1.22], [0.55, -0.85], [0, -0.7]), 0, -S * 1.15, S * 0.62, col, { lw, shade: 0.5 });
      fur(c, 0, -S * 1.18, S * 0.55, S * 0.4, col, 24, S * 0.07, t);
      form(c, bl([-0.44, -0.82], [-0.48, -1.12], [-0.22, -1.3], [0.22, -1.3], [0.48, -1.12], [0.44, -0.82], [0, -0.7]), 0, -S * 1.02, S * 0.5, skin, { lw: 1, shade: 0.45 });
      c.beginPath(); c.moveTo(-S * 0.52, -S * 1.18); c.quadraticCurveTo(0, -S * 1.42, S * 0.52, -S * 1.18); c.quadraticCurveTo(0, -S * 1.2, -S * 0.52, -S * 1.18); c.closePath(); c.fillStyle = shadeC(col, -0.4); c.fill(); contour(c, 1);
      [-1, 1].forEach(s => eye(c, s * S * 0.2, -S * 1.1, S * 0.11, { iris: m.phase >= 2 ? '#FF4D6D' : '#E8B84A', sclera: '#F2E6CC', lookX: lx, lookY: ly, brow: 0.7 * s, browCol: shadeC(col, -0.5), ry: 0.85, glow: m.phase >= 2 ? '#FF5C8A' : null }));
      c.fillStyle = '#2A2228'; c.beginPath(); c.ellipse(0, -S * 0.92, S * 0.18, S * 0.1, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(0,0,0,.5)'; [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * S * 0.07, -S * 0.9, S * 0.045, S * 0.03, 0, 0, TAU); c.fill(); });
      const roar = !!m.beat || m.phase >= 2;
      c.beginPath(); c.moveTo(-S * 0.3, -S * 0.8); c.quadraticCurveTo(0, -S * 0.74, S * 0.3, -S * 0.8); c.quadraticCurveTo(S * 0.2, -S * (roar ? 0.5 : 0.66), 0, -S * (roar ? 0.46 : 0.66)); c.quadraticCurveTo(-S * 0.2, -S * (roar ? 0.5 : 0.66), -S * 0.3, -S * 0.8); c.closePath(); c.fillStyle = '#2A0F26'; c.fill();
      c.save(); c.clip(); teeth(c, 0, -S * 0.8, S * 0.28, S * 0.08, Math.PI + 0.3, TAU - 0.3, 5, S * 0.1, '#F6F0DC', true); if (roar) { c.fillStyle = '#C2385C'; c.beginPath(); c.ellipse(0, -S * 0.52, S * 0.12, S * 0.06, 0, 0, TAU); c.fill(); } c.restore(); contour(c, 1);
      [-1, 1].forEach(s => horn(c, s * S * 0.2, -S * 0.78, S * 0.18, 1.57, S * 0.07, '#F6F0DC', 0, { lw: 0.8 }));
      crown(c, 0, -S * 1.58, S * 0.9);
    },
    // a giant squid: a torpedo mantle with fins, a huge eye, a beak in the crown of eight arms and two long clubbed tentacles
    squid(c, m, r, t, me, lw) {
      const col = m.phase >= 2 ? '#D95A7A' : m.color, S = r, pale = '#F4D6DA', [lx, ly] = lookAt(m, me);
      // long feeding tentacles with clubs
      [-1, 1].forEach(s => { const wob = Math.sin(t * 1.4 + s) * S * 0.1; tentacle(c, [s * S * 0.3, S * 0.5], [s * S * 1.2, S * 1.3 + wob], [s * S * 2.3, S * 0.9], [s * S * 2.35, S * 0.0 + wob], S * 0.16, S * 0.1, shadeC(col, -0.05), { sucker: pale, side: -s }); form(c, ellB(c, s * S * 2.35, -S * 0.05 + wob, S * 0.16, S * 0.34, s * 0.3), s * S * 2.35, -S * 0.05 + wob, S * 0.34, shadeC(col, 0.05), { lw: 1 }); c.fillStyle = pale; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(s * S * (2.3 + (k % 2) * 0.08), -S * 0.3 + wob + k * S * 0.13, S * 0.035, 0, TAU); c.fill(); } });
      // eight arms
      const arms = [[-0.6, 0.45, -1.4, 1.2, -1.9, 1.0, -1.7, 0.4], [0.6, 0.45, 1.4, 1.2, 1.9, 1.0, 1.7, 0.4], [-0.45, 0.5, -0.9, 1.3, -0.6, 1.6, -0.1, 1.3], [0.45, 0.5, 0.9, 1.3, 0.6, 1.6, 0.1, 1.3], [-0.65, 0.4, -1.6, 0.7, -1.9, 1.3, -1.4, 1.5], [0.65, 0.4, 1.6, 0.7, 1.9, 1.3, 1.4, 1.5], [-0.25, 0.55, -0.5, 1.2, -1.0, 1.5, -1.3, 1.1], [0.25, 0.55, 0.5, 1.2, 1.0, 1.5, 1.3, 1.1]];
      arms.forEach(([x0, y0, x1, y1, x2, y2, x3, y3], i) => { const wob = Math.sin(t * 1.8 + i) * S * 0.07; tentacle(c, [x0 * S, y0 * S], [x1 * S, y1 * S + wob], [x2 * S + wob, y2 * S], [x3 * S, y3 * S], S * 0.26, S * 0.06, i % 2 ? shadeC(col, -0.08) : col, { sucker: pale, side: x3 < x0 ? -1 : 1 }); });
      // mantle pointing up, with fins
      c.beginPath(); c.moveTo(0, -S * 2.1); c.quadraticCurveTo(-S * 1.2, -S * 1.2, -S * 0.9, -S * 0.55); c.lineTo(-S * 0.35, -S * 0.75); c.lineTo(S * 0.35, -S * 0.75); c.lineTo(S * 0.9, -S * 0.55); c.quadraticCurveTo(S * 1.2, -S * 1.2, 0, -S * 2.1); c.closePath(); c.fillStyle = lit(c, 0, -S * 1.2, S * 1.1, shadeC(col, 0.1), shadeC(col, 0.35), shadeC(col, -0.3)); c.fill(); contour(c, lw);
      const mantle = () => blobPath(c, [[-0.55, 0.45], [-0.62, -0.5], [-0.42, -1.5], [0, -2.25], [0.42, -1.5], [0.62, -0.5], [0.55, 0.45]], S);
      form(c, mantle, 0, -S * 0.8, S * 1.4, col, { lw, hi: shadeC(col, 0.3), dk: shadeC(col, -0.5), shade: 0.5 });
      c.save(); mantle(); c.clip(); const R = mulberry32(9); for (let i = 0; i < 50; i++) { const x = (R() - 0.5) * S * 1.2, y = -S * 0.8 + (R() - 0.5) * S * 2.6; c.fillStyle = i % 3 ? 'rgba(10,4,20,.15)' : 'rgba(255,255,255,.14)'; c.beginPath(); c.arc(x, y, S * (0.02 + R() * 0.05), 0, TAU); c.fill(); } c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.ellipse(-S * 0.22, -S * 1.2, S * 0.14, S * 0.8, 0.05, 0, TAU); c.fill(); if (m.phase >= 2) for (let i = 0; i < 8; i++) glow(c, (i % 2 ? -1 : 1) * S * 0.25, -S * 1.9 + i * S * 0.3, S * 0.2, '#BFEFFF', 0.5 + 0.3 * Math.sin(t * 4 + i)); c.restore();
      // head: a short band with the great eyes
      limb(c, -S * 0.55, S * 0.25, S * 0.55, S * 0.25, S * 0.5, S * 0.5, shadeC(col, -0.04), { lw: 0 });
      [-1, 1].forEach(s => { form(c, ellB(c, s * S * 0.55, S * 0.2, S * 0.34, S * 0.32), s * S * 0.55, S * 0.2, S * 0.34, shadeC(col, 0.05), { lw: 1, shade: 0.45 }); eye(c, s * S * 0.55, S * 0.2, S * 0.26, { iris: m.phase >= 2 ? '#7FD3F2' : '#2F3A70', sclera: '#EEF2FF', lookX: lx, lookY: ly, ry: 0.95, ir: 0.78 }); });
      // beak
      c.beginPath(); c.moveTo(-S * 0.2, S * 0.5); c.quadraticCurveTo(0, S * 0.42, S * 0.2, S * 0.5); c.lineTo(0, S * 0.82); c.closePath(); c.fillStyle = lit(c, 0, S * 0.6, S * 0.2, '#2A1E2E', '#5A4A5E', '#0B0612'); c.fill(); contour(c, 1);
    },
    // a demon lion: a prowling lion in profile, tawny and striped, a shaggy dark-rose mane, bat wings on its back, a curling spiked tail
    demonlion(c, m, r, t, me, lw) {
      const S = r, tan = '#D9A66A', tanL = '#F2D3A0', tanD = '#7A4A2A', mane = '#5A1E34', maneD = '#2E0C1C', maneL = '#8E3454', pink = '#E8537F', fire = '#FF7A3D', [lx, ly] = lookAt(m, me), fl = Math.sin(t * 3) * 0.2, hot = m.phase >= 2;
      const bl = (...pts) => () => blobPath(c, pts, S);
      const lim = (x0, y0, x1, y1, w0, w1, cc, o) => limb(c, x0 * S, y0 * S, x1 * S, y1 * S, w0 * S, w1 * S, cc, Object.assign({ lw }, o || {}));
      const roar = hot || m.act === 'roar' || m.act === 'pounce';
      // tail: a segmented tail curling up over the rump, spiked along the outside, a cinder at the tip
      const tw = Math.sin(t * 2) * S * 0.05;
      const tp = bez([-S * 1.2, -S * 0.2], [-S * 2.15, -S * 0.05 + tw], [-S * 2.45, -S * 1.35], [-S * 1.45, -S * 1.45 + tw], 12);
      tube(c, [[-S * 1.2, -S * 0.2], [-S * 2.15, -S * 0.05 + tw], [-S * 2.45, -S * 1.35], [-S * 1.45, -S * 1.45 + tw]], S * 0.24, mane, { lw: 1 });
      c.save(); c.strokeStyle = 'rgba(10,4,20,.35)'; c.lineWidth = 1; for (let i = 1; i < tp.length - 1; i++) { const [x, y] = tp[i], [px, py] = tp[i - 1], a = Math.atan2(y - py, x - px) + Math.PI / 2; c.beginPath(); c.moveTo(x + Math.cos(a) * S * 0.1, y + Math.sin(a) * S * 0.1); c.lineTo(x - Math.cos(a) * S * 0.1, y - Math.sin(a) * S * 0.1); c.stroke(); } c.restore();
      ridgeTufts(c, tp, 9, S * 0.2, S * 0.1, pink, '#8A2040', { seed: 13, bend: 0.3, tip: '#FFB0C8' });
      glow(c, -S * 1.45, -S * 1.45 + tw, S * 0.3, fire, 0.5);
      // wings: folded back along the spine, the far one higher
      batWing(c, -S * 0.1, -S * 0.72, S * 1.15, -0.35 + fl * 0.3, '#2A0F26', '#6A2A42', fl, -1, { lw: 1 });
      batWing(c, 0.15 * S, -S * 0.6, S * 1.0, -0.1 + fl * 0.3, '#3A1430', '#8A3A58', fl, -1, { lw: 1 });
      // far legs
      lim(-0.7, 0.25, -0.55, 0.62, 0.3, 0.22, tanD); lim(-0.55, 0.62, -0.42, 0.95, 0.22, 0.2, tanD, { rings: 1 }); paw(c, -S * 0.36, S * 1.0, S * 0.42, shadeC(tanD, -0.05));
      lim(0.5, -0.15, 0.32, 0.4, 0.3, 0.22, tanD); lim(0.32, 0.4, 0.3, 0.95, 0.22, 0.2, tanD, { rings: 1 }); paw(c, S * 0.36, S * 1.0, S * 0.42, shadeC(tanD, -0.05));
      // body
      const body = bl([-1.36, -0.12], [-1.18, -0.52], [-0.4, -0.7], [0.5, -0.76], [0.95, -0.45], [1.0, 0.0], [0.82, 0.4], [0.1, 0.5], [-0.95, 0.44], [-1.32, 0.22]);
      form(c, body, -S * 0.15, -S * 0.12, S * 1.35, tan, { lw, hi: tanL, dk: tanD, shade: 0.5 });
      c.save(); body(); c.clip();
      const bg = c.createLinearGradient(0, -S * 0.1, 0, S * 0.5); bg.addColorStop(0, 'rgba(255,240,215,0)'); bg.addColorStop(1, 'rgba(255,240,215,.5)'); c.fillStyle = bg; c.fillRect(-S * 1.5, -S * 0.2, S * 2.7, S * 0.8);
      // dark stripes coming down off the back
      c.fillStyle = 'rgba(46,12,28,.8)';
      [[-0.95, 0.55], [-0.65, 0.7], [-0.35, 0.75], [-0.05, 0.7], [0.25, 0.6]].forEach(([x, L], i) => { const top = -0.7 + (x < -0.9 ? 0.18 : 0); c.beginPath(); c.moveTo((x - 0.11) * S, top * S); c.quadraticCurveTo((x - 0.2) * S, (top + L * 0.5) * S, (x - 0.18) * S, (top + L) * S); c.quadraticCurveTo((x - 0.1) * S, (top + L * 0.55) * S, (x + 0.1) * S, top * S); c.closePath(); c.fill(); });
      muscle(c, [[-S * 1.05, -S * 0.3, -S * 0.85, 0, -S * 0.95, S * 0.35], [S * 0.55, -S * 0.5, S * 0.75, -S * 0.15, S * 0.65, S * 0.25], [-S * 0.3, -S * 0.05, -S * 0.1, S * 0.1, -S * 0.15, S * 0.4]], lw * 1.2, 0.28);
      hairs(c, body, -S * 1.4, -S * 0.8, S * 2.5, S * 1.4, tanD, 80, 21, 0.25, S * 0.12, 0.25);
      hairs(c, body, -S * 1.4, -S * 0.8, S * 2.5, S * 0.9, '#FFFFFF', 30, 22, 0.25, S * 0.1, 0.12);
      if (hot) cracks(c, -S * 0.2, -S * 0.1, S * 1.0, '#0A0414', 5, fire);
      c.restore();
      // near legs: the hind leg pushing off, the foreleg reaching
      form(c, ellB(c, -S * 0.92, -S * 0.02, S * 0.5, S * 0.44, -0.3), -S * 0.92, -S * 0.02, S * 0.5, tan, { lw, hi: tanL, dk: tanD, shade: 0.5 });
      muscle(c, [[-S * 1.25, -S * 0.15, -S * 1.1, S * 0.1, -S * 1.2, S * 0.3]], lw, 0.3);
      lim(-1.05, 0.3, -1.38, 0.6, 0.32, 0.22, tan); joint(c, -S * 1.38, S * 0.6, S * 0.12, shadeC(tan, -0.1), { lw: 1 }); lim(-1.38, 0.6, -1.15, 0.95, 0.22, 0.2, tan, { rings: 1 }); paw(c, -S * 1.03, S * 1.0, S * 0.46, tan);
      joint(c, S * 0.62, -S * 0.3, S * 0.3, tan, { lw }); lim(0.62, -0.3, 0.8, 0.3, 0.38, 0.26, tan); joint(c, S * 0.8, S * 0.3, S * 0.13, shadeC(tan, -0.1), { lw: 1 }); lim(0.8, 0.3, 1.02, 0.92, 0.26, 0.22, tan, { rings: 1 }); paw(c, S * 1.12, S * 1.0, S * 0.48, tan);
      muscle(c, [[S * 0.45, -S * 0.4, S * 0.5, -S * 0.1, S * 0.6, S * 0.15]], lw, 0.3);
      // mane: a dark ruff over the shoulders and along the spine, a fuller ruff round the head, lighter tips in front
      const spine = [[-0.55, -0.68], [0.1, -0.76], [0.6, -0.76]].map(([x, y]) => [x * S, y * S]);
      ridgeTufts(c, spine, 9, S * 0.4, S * 0.26, mane, maneD, { seed: 17, lean: -0.65, bend: 0.1, sil: true, lw: 0 });
      ridgeTufts(c, spine, 8, S * 0.28, S * 0.16, maneL, mane, { seed: 24, lean: -0.6, bend: 0.1, lw: 0, hair: '#B05070' });
      maneTufts(c, S * 1.0, -S * 0.62, S * 0.5, S * 0.56, Math.PI * 0.55, Math.PI * 1.95, 19, S * 0.62, S * 0.32, mane, maneD, { seed: 18, lean: -0.6, t, bend: 0.1, sil: true, lw: 0 });
      maneTufts(c, S * 1.05, -S * 0.62, S * 0.42, S * 0.48, Math.PI * 0.6, Math.PI * 1.9, 16, S * 0.46, S * 0.22, maneL, mane, { seed: 19, lean: -0.55, t, lw: 0, hair: '#C06080', tip: hot ? '#FF9F6A' : '#B05070' });
      maneTufts(c, S * 1.08, -S * 0.62, S * 0.36, S * 0.4, Math.PI * 0.65, Math.PI * 1.85, 12, S * 0.3, S * 0.12, '#B05070', maneL, { seed: 25, lean: -0.5, t, lw: 0 });
      maneTufts(c, S * 1.1, -S * 0.5, S * 0.3, S * 0.3, Math.PI * 0.25, Math.PI * 0.7, 6, S * 0.3, S * 0.14, mane, maneD, { seed: 20, lean: -0.4, t, sil: true, lw: 0 });
      // head in profile: skull, muzzle, nose, ear, brow, a mouth of fangs
      const head = bl([1.0, -0.6], [1.08, -0.95], [1.4, -1.06], [1.7, -0.92], [2.0, -0.62], [1.98, -0.4], [1.72, -0.3], [1.42, -0.27], [1.1, -0.36]);
      form(c, head, S * 1.5, -S * 0.65, S * 0.56, tan, { lw, hi: tanL, dk: tanD, shade: 0.5 });
      c.save(); head(); c.clip(); c.fillStyle = 'rgba(255,240,215,.45)'; c.beginPath(); c.ellipse(S * 1.68, -S * 0.38, S * 0.36, S * 0.14, 0, 0, TAU); c.fill(); muscle(c, [[S * 1.2, -S * 0.9, S * 1.35, -S * 0.7, S * 1.3, -S * 0.45]], lw, 0.25); hairs(c, head, S * 1.0, -S * 1.1, S * 1.0, S * 0.8, tanD, 30, 23, 0.1, S * 0.08, 0.22); c.restore();
      // lower jaw (opens when roaring)
      const open = roar ? 0.45 : 0.14 + 0.04 * Math.sin(t * 2.4);
      c.save(); c.translate(S * 1.42, -S * 0.3); c.rotate(open);
      c.beginPath(); c.moveTo(0, -S * 0.02); c.quadraticCurveTo(S * 0.3, -S * 0.04, S * 0.52, 0); c.quadraticCurveTo(S * 0.5, S * 0.18, S * 0.25, S * 0.2); c.quadraticCurveTo(S * 0.05, S * 0.18, 0, S * 0.1); c.closePath(); c.fillStyle = lit(c, S * 0.25, S * 0.08, S * 0.3, tan, tanL, tanD); c.fill(); contour(c, lw);
      c.fillStyle = '#3A0F20'; c.beginPath(); c.moveTo(S * 0.04, 0); c.quadraticCurveTo(S * 0.3, -S * 0.02, S * 0.48, S * 0.02); c.quadraticCurveTo(S * 0.3, S * 0.08, S * 0.04, S * 0.07); c.fill();
      if (roar) { c.fillStyle = '#C2385C'; c.beginPath(); c.ellipse(S * 0.25, S * 0.05, S * 0.12, S * 0.04, 0, 0, TAU); c.fill(); }
      horn(c, S * 0.44, S * 0.0, S * 0.18, -1.8, S * 0.07, '#F6F0DC', 0.2, { lw: 0.7 }); horn(c, S * 0.28, S * 0.0, S * 0.1, -1.75, S * 0.06, '#F6F0DC', 0.2, { lw: 0.7 });
      tufts(c, [[S * 0.05, S * 0.16, 2.0, S * 0.18, S * 0.09, 0.1], [S * 0.18, S * 0.2, 1.8, S * 0.14, S * 0.08, 0]], mane, maneD, { lw: 0.8 });
      c.restore();
      // upper lip, fangs, nose, eye, ear, horns
      c.save(); head(); c.clip(); c.fillStyle = '#3A0F20'; c.beginPath(); c.moveTo(S * 1.45, -S * 0.3); c.quadraticCurveTo(S * 1.75, -S * 0.36, S * 1.98, -S * 0.4); c.lineTo(S * 1.98, -S * 0.3); c.quadraticCurveTo(S * 1.75, -S * 0.26, S * 1.45, -S * 0.22); c.fill(); c.restore();
      horn(c, S * 1.85, -S * 0.33, S * 0.24, 1.5, S * 0.07, '#F6F0DC', 0.05, { lw: 0.7 }); horn(c, S * 1.58, -S * 0.3, S * 0.14, 1.5, S * 0.06, '#F6F0DC', 0.05, { lw: 0.7 }); horn(c, S * 1.72, -S * 0.31, S * 0.1, 1.5, S * 0.05, '#F6F0DC', 0.05, { lw: 0.7 });
      c.fillStyle = '#2A1420'; c.beginPath(); c.moveTo(S * 1.9, -S * 0.66); c.quadraticCurveTo(S * 2.04, -S * 0.66, S * 2.02, -S * 0.52); c.quadraticCurveTo(S * 1.96, -S * 0.46, S * 1.88, -S * 0.5); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(S * 1.94, -S * 0.62, S * 0.03, S * 0.02, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(10,4,20,.4)'; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(S * 1.98, -S * 0.5); c.quadraticCurveTo(S * 1.92, -S * 0.4, S * 1.8, -S * 0.38); c.stroke();
      c.fillStyle = 'rgba(10,4,20,.45)'; [[1.62, -0.42], [1.66, -0.5], [1.58, -0.5]].forEach(([x, y]) => { c.beginPath(); c.arc(x * S, y * S, S * 0.015, 0, TAU); c.fill(); });
      eye(c, S * 1.52, -S * 0.72, S * 0.1, { iris: hot ? '#FFE37A' : '#FF3D5A', sclera: hot ? '#3A0F20' : '#F8E8D8', lookX: lx, lookY: ly, ry: 0.72, brow: 0.9, browCol: maneD, glow: fire });
      tufts(c, [[S * 1.12, -S * 0.96, -2.1, S * 0.3, S * 0.18, 0.2]], tan, tanD, { lw: 0.9 }); c.fillStyle = '#3A0F20'; c.beginPath(); c.moveTo(S * 1.14, -S * 0.97); c.lineTo(S * 1.0, -S * 1.18); c.lineTo(S * 1.08, -S * 0.86); c.closePath(); c.fill();
      curlHorn(c, S * 1.28, -S * 1.0, S * 0.62, -1.9, 1.3, S * 0.14, '#2A1E2E', { lw: 0.9 });
      curlHorn(c, S * 1.42, -S * 1.03, S * 0.7, -1.7, 1.3, S * 0.16, '#3A2A3E', { lw: 0.9 });
      // cinders drifting off the mane
      for (let i = 0; i < 5; i++) { const ph = (t * 0.5 + i * 0.41) % 1, px = S * (0.9 - i * 0.28) + Math.sin(t * 3 + i) * S * 0.06, py = -S * 1.15 - ph * S * 0.6; c.globalAlpha = 0.8 - ph * 0.8; c.fillStyle = i % 2 ? '#FFE37A' : fire; c.beginPath(); c.arc(px, py, S * 0.03, 0, TAU); c.fill(); }
      c.globalAlpha = 1;
      if (roar) glow(c, S * 1.7, -S * 0.2, S * 0.5, fire, 0.5);
    },
  };
  // painters whose wings or tails reach further than the usual 3.1 radii get a bigger offscreen canvas
  const REACH = {};
  const S0 = r => r;
  /* ---- the lighting pass ---- */
  let cvA = null, cvB = null, cvC = null, noisePat = null;
  const ensure = (cv, w, h) => { if (!cv) cv = document.createElement('canvas'); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } return cv; };
  function noise(c) {
    if (noisePat) return noisePat;
    const n = document.createElement('canvas'); n.width = n.height = 48; const nc = n.getContext('2d'), R = mulberry32(99);
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) { const v = R(); nc.fillStyle = v < 0.5 ? `rgba(0,0,0,${(0.5 - v) * 0.9})` : `rgba(255,255,255,${(v - 0.5) * 0.7})`; nc.fillRect(x, y, 1, 1); }
    noisePat = c.createPattern(n, 'repeat');
    return noisePat;
  }
  /* keep: the boss of a fight is kept as a picture and painted afresh on a second canvas in two halves, a frame each:
     the creature itself, then its lighting, after which the two canvases change places. Every frame lays down the last
     finished picture wherever the boss now stands, so no frame carries the whole painting. (The picture lives on the boss,
     unseen by copies made of it, so a clone or a portrait is painted whole, as it is) */
  function draw(c, m, X, Y, r, t, me, sx, sy, TS, keep) {
    const B = m.bk, kind = B.art || B.id, painter = P[kind];
    if (!painter) return;
    const dpr = Math.min(2, (typeof arc !== 'undefined' && arc.dpr) || 1), half = Math.ceil(r * (REACH[kind] || 3.1)), size = Math.ceil(half * 2 * dpr);
    if (!keep) { cvA = ensure(cvA, size, size); paintBody(cvA, m, r, t, me, sx, sy, X, Y, half, size, dpr); lightBody(cvA, m, r, size, dpr, 0, size); c.drawImage(cvA, X - half, Y - half, half * 2, half * 2); return; }
    let K = m._keep; if (!K) { K = { cv: null, back: null, cap: 0, px: 0, dpr: 0, step: 0, wholes: 0 }; Object.defineProperty(m, '_keep', { value: K, enumerable: false, configurable: true }); }
    // the two canvases are made a little roomier than the boss needs, so a boss that swells or a camera that zooms does not
    // have them made afresh (and the boss painted whole) every frame
    if (!K.cv || half > K.cap || half < K.cap * 0.72 || K.dpr !== dpr) {
      K.cap = Math.ceil(half * 1.12); K.dpr = dpr; K.px = Math.ceil(K.cap * 2 * dpr); K.step = 0; K.wholes++;
      K.cv = ensure(K.cv, K.px, K.px); paintBody(K.cv, m, r, t, me, sx, sy, X, Y, K.cap, K.px, dpr); lightBody(K.cv, m, r, K.px, dpr, (K.px - size) / 2, size);
    } else if (K.step === 0) { K.back = ensure(K.back, K.px, K.px); paintBody(K.back, m, r, t, me, sx, sy, X, Y, K.cap, K.px, dpr); settle1(K.back); K.step = 1; }
    else { lightBody(K.back, m, r, K.px, dpr, (K.px - size) / 2, size); const f = K.cv; K.cv = K.back; K.back = f; K.step = 0; }
    c.drawImage(K.cv, X - K.cap, Y - K.cap, K.px / dpr, K.px / dpr);
  }
  // (a canvas paints what is drawn on it only when it is read: one pixel of it is read after the first half, so that half
  // is painted in its own frame)
  let speck1 = null;
  function settle1(cv) { if (!speck1) { speck1 = document.createElement('canvas'); speck1.width = speck1.height = 1; } speck1.getContext('2d').drawImage(cv, 0, 0, 1, 1, 0, 0, 1, 1); speck1.width = 1; }
  // the creature, painted by its own painter
  function paintBody(cv, m, r, t, me, sx, sy, X, Y, half, size, dpr) {
    const B = m.bk, kind = B.art || B.id, a = cv.getContext('2d');
    a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1; a.clearRect(0, 0, size, size);
    a.setTransform(dpr, 0, 0, dpr, half * dpr, half * dpr);
    a.lineJoin = 'round'; a.lineCap = 'round';
    a.save();
    P[kind](a, m, r, t, me, lwB(r), v => sx(v) - X, v => sy(v) - Y, B);
    a.restore();
  }
  // its lighting, inside the silhouette: a rim of light, a shadow edge, occlusion toward the ground, a warm bounce, grain
  // (o, box: the square the boss is painted in, inside a canvas that may be roomier, so the light falls on it alike)
  function lightBody(cv, m, r, size, dpr, o, box) {
    if (m.under) return;
    const B = m.bk;
    cvB = ensure(cvB, size, size); cvC = ensure(cvC, size, size);
    const a = cv.getContext('2d'), b = cvB.getContext('2d'), d = cvC.getContext('2d');
    const rim = Math.max(1.2, r * 0.04) * dpr, el = ELC[B.el] || ELC.fire, lightCol = B.el ? el[1] : '#FFF4E0';
    // rim light: the silhouette minus itself nudged toward the light leaves the top-left edge (coloured 'atop', which keeps
    // to what is there as 'in' would but without the extra pass a browser makes for 'in' over the whole canvas)
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, size, size); b.drawImage(cv, 0, 0);
    b.globalCompositeOperation = 'destination-out'; b.drawImage(cv, rim * 1.4, rim * 1.6);
    b.globalCompositeOperation = 'source-atop'; b.fillStyle = lightCol; b.fillRect(0, 0, size, size);
    // shadow edge: the same from the other side
    d.setTransform(1, 0, 0, 1, 0, 0); d.globalCompositeOperation = 'source-over'; d.clearRect(0, 0, size, size); d.drawImage(cv, 0, 0);
    d.globalCompositeOperation = 'destination-out'; d.drawImage(cv, -rim * 1.6, -rim * 2);
    d.globalCompositeOperation = 'source-atop'; d.fillStyle = '#120820'; d.fillRect(0, 0, size, size);
    // ambient occlusion toward the ground, a warm bounce from the top, and the surface grain, all inside the silhouette,
    // laid over it as one picture
    a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'source-atop'; a.globalAlpha = 1; a.drawImage(shadePic(size, o, box), 0, 0);
    a.globalCompositeOperation = 'source-over'; a.globalAlpha = 0.55; a.drawImage(cvC, 0, 0);
    a.globalCompositeOperation = 'lighter'; a.globalAlpha = 0.75; a.drawImage(cvB, 0, 0);
    a.globalAlpha = 1; a.globalCompositeOperation = 'source-over';
  }
  // the occlusion, the bounce and the grain do not depend on the creature's shape, only on the size of its square, so they
  // are made once for each size (a boss that changes size by a few hundredths keeps its picture) and kept, a few at a time.
  // (Laying them over in one picture is the same as laying each in turn)
  const SHADES = [];
  function shadePic(size, o, box) {
    for (const e of SHADES) if (e.size === size && Math.abs(e.box - box) <= box * 0.05) return e.cv;
    if (SHADES.length >= 4) SHADES.shift();
    const cv = document.createElement('canvas'); cv.width = cv.height = size; const x = cv.getContext('2d');
    const ao = x.createLinearGradient(0, o + box * 0.25, 0, o + box); ao.addColorStop(0, 'rgba(20,8,40,0)'); ao.addColorStop(1, 'rgba(20,8,40,.42)'); x.fillStyle = ao; x.fillRect(0, 0, size, size);
    const key = x.createLinearGradient(o, o, o + box * 0.6, o + box * 0.7); key.addColorStop(0, 'rgba(255,244,224,.16)'); key.addColorStop(0.5, 'rgba(255,244,224,0)'); x.fillStyle = key; x.fillRect(0, 0, size, size);
    x.globalAlpha = 0.1; x.fillStyle = noise(x); x.fillRect(0, 0, size, size); x.globalAlpha = 1;
    SHADES.push({ size, box, cv }); return cv;
  }
  return { draw, heads, P, REACH, parts: { orb, tube, scales, spikes, horn, curlHorn, eye, teeth, glow, fur, batWing, featherWing, plate, cracks, form, limb, joint, blobPath, taper, tufts, serpentHead, tentacle, lit } };
})();
