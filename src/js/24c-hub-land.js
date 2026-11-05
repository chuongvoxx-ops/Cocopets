/* ---------- Cocopets Town: the landscape and its ambience (HubLand) ----------
   Everything that lies flat (grass, paths, the plaza's paving, terraces with their mossy retaining walls and stone
   stairs, the river with its banks, bridges, the dock, the farm beds) is painted once per 512-px world chunk at the
   current zoom into offscreen canvases and blitted; only the water's flow lines, sparkle and ripples are drawn live
   over the cache. Trees, shrubs, rocks, reeds and flower clumps are depth entities drawn from cached, cel-shaded,
   inked sprites (the crown separate from the trunk so it can sway). The airborne layer (petals, butterflies, chimney
   smoke, cooking steam, fountain splash, hearth glow) is a few small particle pools. No DOM beyond offscreen canvases,
   no game state: the kit reads HUB only. */
const HubLand = (() => {
  'use strict';
  const TAU = Math.PI * 2, INK = '#2B2433', CH = 512, LIFT = 70;
  const L = () => (typeof HUB !== 'undefined' ? HUB : { W: 2600, H: 2000, terraces: [], paths: [], river: { pts: [], w: 90 }, bridges: [], dock: null, buildings: [], props: [], plots: [], orchard: [], trees: [], shrubs: [], rocks: [], districts: {} });
  /* ---- tiny helpers (the kit is standalone) ---- */
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, u) => a + (b - a) * u;
  const hash = (x, y, s) => { let h = (Math.floor(x) * 374761393 + Math.floor(y) * 668265263 + ((s | 0) + 1) * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const rng = seed => { let a = seed | 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const hex3 = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const rgba = (h, a) => { const [r, g, b] = hex3(h); return `rgba(${r},${g},${b},${a})`; };
  /* shade: k > 1 lighter, k < 1 darker (multiplicative, like 23a-town-art) */
  const shade = (h, k) => { const [r, g, b] = hex3(h), f = v => clamp(Math.round(v * k), 0, 255); return `rgb(${f(r)},${f(g)},${f(b)})`; };
  /* mix two hex colours */
  const mix = (a, b, u) => { const A = hex3(a), B = hex3(b); return `rgb(${Math.round(lerp(A[0], B[0], u))},${Math.round(lerp(A[1], B[1], u))},${Math.round(lerp(A[2], B[2], u))})`; };
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const poly = (c, pts, dy) => { dy = dy || 0; c.beginPath(); for (let i = 0; i < pts.length; i++) i ? c.lineTo(pts[i][0], pts[i][1] + dy) : c.moveTo(pts[i][0], pts[i][1] + dy); c.closePath(); };
  const ink = (c, w) => { c.strokeStyle = INK; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const circ = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); };
  const ell = (c, x, y, rx, ry, rot) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, TAU); };
  function inPoly(pts, x, y) { let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; }
  const bboxOf = pts => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } return [x0, y0, x1, y1]; };
  const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const lift = lv => (lv || 0) * LIFT;
  /* the elevation level at a world point: the highest terrace polygon containing it */
  function lvAt(x, y) { let lv = 0; for (const T of L().terraces) if (T.lv > lv && inPoly(T.poly, x, y)) lv = T.lv; return lv; }
  /* a soft noise sheet, multiplied over fills for grain (pattern space follows the transform, so it is world-locked) */
  let noiseCv = null;
  function noise() { if (noiseCv) return noiseCv; const cv = mk(128, 128), c = cv.getContext('2d'), im = c.createImageData(128, 128), R = rng(5); for (let i = 0; i < im.data.length; i += 4) { const v = 112 + R() * 86; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } c.putImageData(im, 0, 0); noiseCv = cv; return cv; }
  function grain(c, x, y, w, h, a) { c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(noise(), 'repeat'); c.fillRect(x, y, w, h); c.restore(); }
  /* ---- palette: warm daylight, lush green, cream stone ---- */
  const P = {
    grass: '#6DAD58', grassS: '#5E9E4F', grassTop: '#7CBA63', grassSanct: '#79B479', grassLook: '#8BB562', grassOrch: '#7BB75E',
    flag: '#D2C8B4', flagM: '#B5A98F', dirt: '#BC9B6B', dirtW: '#CDB088', plazaP: '#E9B7C4', plazaC: '#F6E9D3', plazaM: '#CDB89C',
    water: '#3F8FD0', waterD: '#2C6FB0', waterS: '#8FCBEE', mud: '#B39B73', sand: '#D9C7A1', wall: '#8F978A', wallD: '#6E776C', moss: '#6B9C5A',
    bark: '#6E4A2A', barkD: '#4E3420', oak: ['#2A6A38', '#3E8F4E', '#6CC15A', '#9EDC7A'], pine: ['#1E5A3C', '#2E7A50', '#4FA06A', '#7CC48A'],
    cherry: ['#C96A95', '#E58BB3', '#F7B6D2', '#FFE0EC'], willow: ['#4E8A3A', '#6AA84A', '#93C462', '#C2E08C'], apple: ['#2F6E3A', '#43924F', '#6FBF5E', '#A2DC80'],
  };
  /* =====================================================================================================================
     GROUND
     ===================================================================================================================== */
  /* a path resampled into drawn space (y lifted per vertex by its terrace level), with per-sample tangent */
  const pathCache = new Map();
  function pathSamples(pi) {
    if (pathCache.has(pi)) return pathCache.get(pi);
    const p = L().paths[pi], pts = p.pts.map(q => [q[0], q[1] - lift(lvAt(q[0], q[1]))]), out = [];
    for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(len / 10)); for (let j = 0; j < n; j++) { const u = j / n; out.push([lerp(ax, bx, u), lerp(ay, by, u), (bx - ax) / len, (by - ay) / len]); } }
    const last = pts[pts.length - 1], pl = out[out.length - 1]; out.push([last[0], last[1], pl[2], pl[3]]);
    const r = { pts, s: out, bb: bboxOf(pts).map((v, i) => v + (i < 2 ? -p.w : p.w)) }; pathCache.set(pi, r); return r;
  }
  function strokePolyline(c, pts, w, col, cap) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = cap || 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); }
  /* an irregular flagstone: a rounded hexagon with jittered radii */
  const STONE_TINTS = ['#D2C8B4', '#C9C3B6', '#D9CBB2', '#C4BBA6', '#CFC9BC', '#D6CDB0'];
  function stone(c, x, y, rx, ry, seed, col, lw) {
    const tint = col || shade(STONE_TINTS[Math.floor(hash(seed, 5, 5) * STONE_TINTS.length)], 0.9 + hash(seed, 1, 1) * 0.2);
    c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + hash(seed, i, 3) * 0.5, r = 0.78 + hash(seed, i, 4) * 0.3; const px = x + Math.cos(a) * rx * r, py = y + Math.sin(a) * ry * r; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath();
    c.fillStyle = tint; c.fill(); c.strokeStyle = 'rgba(70,55,40,.32)'; c.lineWidth = lw || 1.2; c.lineJoin = 'round'; c.stroke();
    // a light top-left rim and a shadowed bottom-right rim read as a bevel; a hairline crack on some stones
    c.save(); c.clip(); c.strokeStyle = 'rgba(255,255,255,.38)'; c.lineWidth = 2.2; c.beginPath(); c.arc(x - rx * 0.1, y - ry * 0.1, Math.max(rx, ry) * 0.98, Math.PI * 1.05, Math.PI * 1.75); c.stroke(); c.strokeStyle = 'rgba(60,40,20,.24)'; c.beginPath(); c.arc(x + rx * 0.1, y + ry * 0.1, Math.max(rx, ry) * 0.98, Math.PI * 0.05, Math.PI * 0.75); c.stroke();
    if (hash(seed, 6, 6) < 0.3) { const a = hash(seed, 7, 7) * TAU, cx = x + (hash(seed, 8, 8) - 0.5) * rx, cy = y + (hash(seed, 9, 9) - 0.5) * ry; c.strokeStyle = 'rgba(60,45,35,.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * rx * 0.5, cy + Math.sin(a) * ry * 0.5); c.lineTo(cx + Math.cos(a + 0.7) * rx * 0.8, cy + Math.sin(a + 0.7) * ry * 0.8); c.stroke(); }
    c.restore();
    // lichen and moss specks in the joints
    if (hash(seed, 10, 10) < 0.35) { const a = hash(seed, 11, 11) * TAU; c.fillStyle = hash(seed, 12, 12) < 0.5 ? 'rgba(150,170,90,.5)' : 'rgba(90,140,80,.45)'; ell(c, x + Math.cos(a) * rx * 0.95, y + Math.sin(a) * ry * 0.95, 1.6 + hash(seed, 13, 13) * 1.4, 1.1); c.fill(); }
  }
  /* a flagstone path: mortar bed, then stones in staggered rows across the width, then a worn-middle sheen */
  function drawPath(c, pi, bb, kq) {
    const p = L().paths[pi], S = pathSamples(pi); if (!hit(S.bb, bb)) return;
    const w = p.w, pts = S.pts;
    if (p.kind === 'dirt') {
      strokePolyline(c, pts, w + 8, 'rgba(70,50,30,.2)'); strokePolyline(c, pts, w, P.dirt); strokePolyline(c, pts, w * 0.42, P.dirtW);
      // pebbles and wheel-worn lines
      for (let i = 0; i < S.s.length; i += 2) { const [x, y, tx, ty] = S.s[i]; if (x < bb[0] - 40 || x > bb[2] + 40 || y < bb[1] - 40 || y > bb[3] + 40) continue; const n = 2 + Math.floor(hash(x, y, 7) * 3); for (let j = 0; j < n; j++) { const o = (hash(x, j, 8) - 0.5) * w * 0.9, px = x - ty * o + (hash(x, j, 9) - 0.5) * 8, py = y + tx * o; c.fillStyle = hash(x, j, 10) < 0.5 ? '#B29470' : '#E3D2AE'; ell(c, px, py, 1.6 + hash(x, j, 11) * 1.8, 1.1 + hash(x, j, 12) * 1.2, hash(x, j, 13) * 3); c.fill(); } }
      // grass creeping over the edges
      c.strokeStyle = 'rgba(80,150,70,.55)'; c.lineWidth = 1.3; for (let i = 0; i < S.s.length; i += 3) { const [x, y, tx, ty] = S.s[i]; for (const sgn of [-1, 1]) { const ex = x - ty * sgn * (w / 2 + 2), ey = y + tx * sgn * (w / 2 + 2); if (ex < bb[0] - 20 || ex > bb[2] + 20 || ey < bb[1] - 20 || ey > bb[3] + 20) continue; for (let j = 0; j < 3; j++) { const jx = ex + (hash(x, j, 14) - 0.5) * 10, jy = ey + (hash(x, j, 15) - 0.5) * 6; c.beginPath(); c.moveTo(jx, jy); c.lineTo(jx + (hash(x, j, 16) - 0.5) * 5, jy - 4 - hash(x, j, 17) * 4); c.stroke(); } } }
      pathEdges(c, S, w, bb); return;
    }
    strokePolyline(c, pts, w + 6, 'rgba(60,45,30,.18)'); strokePolyline(c, pts, w, P.flagM);
    const cols = Math.max(3, Math.round(w / 17)), cw = w / cols, step = Math.max(10, cw * 0.95);
    let acc = 0, row = 0;
    for (let i = 0; i < S.s.length; i++) {
      const [x, y, tx, ty] = S.s[i]; acc += 10; if (acc < step) continue; acc = 0; row++;
      if (x < bb[0] - 60 || x > bb[2] + 60 || y < bb[1] - 60 || y > bb[3] + 60) continue;
      const off = row % 2 ? cw / 2 : 0;
      for (let j = 0; j < cols + (off ? 1 : 0); j++) { const o = -w / 2 + cw * j + cw / 2 - off; if (Math.abs(o) > w / 2 - cw * 0.3) continue; const sx = x - ty * o, sy = y + tx * o, seed = pi * 1000 + row * 7 + j; const tone = 0.9 + hash(seed, 1, 1) * 0.2, warm = hash(seed, 2, 2) < 0.3; stone(c, sx, sy, cw * 0.56, step * 0.58, seed, null, 1); void tone; void warm; }
    }
    strokePolyline(c, pts, w * 0.45, w >= 80 ? 'rgba(255,250,235,.18)' : 'rgba(255,250,235,.09)');
    pathEdges(c, S, w, bb);
  }
  /* where grass meets stone: moss dabs and tiny wildflowers along both edges of a path */
  function pathEdges(c, S, w, bb) { for (let i = 0; i < S.s.length; i += 2) { const [x, y, tx, ty] = S.s[i]; if (x < bb[0] - 30 || x > bb[2] + 30 || y < bb[1] - 30 || y > bb[3] + 30) continue; for (const sgn of [-1, 1]) { const h = hash(x + sgn * 3, y, 270); const ex = x - ty * sgn * (w / 2 + 1), ey = y + tx * sgn * (w / 2 + 1); if (h < 0.3) { c.fillStyle = 'rgba(70,130,60,.45)'; ell(c, ex, ey, 4 + h * 10, 2 + h * 3, Math.atan2(ty, tx)); c.fill(); } else if (h > 0.84) { const fx = ex - ty * sgn * (4 + h * 8), fy = ey + tx * sgn * (4 + h * 8); c.fillStyle = ['#FFFFFF', '#FFE37A', '#C9A8F0', '#FFB3D1'][Math.floor(h * 97) & 3]; circ(c, fx, fy, 1.5); c.fill(); circ(c, fx + 3, fy + 2, 1.2); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; circ(c, fx - 0.4, fy - 0.4, 0.6); c.fill(); } } } }
  /* the plaza: concentric rings of pink and cream pavers round the fountain, a rosette in the middle, a stone kerb */
  const PLAZA = { x: 1300, y: 1030, rx: 230, ry: 200 };
  function drawPlaza(c, bb) {
    const { x, y, rx, ry } = PLAZA; if (!hit([x - rx - 20, y - ry - 20, x + rx + 20, y + ry + 20], bb)) return;
    c.fillStyle = 'rgba(60,45,30,.22)'; ell(c, x, y + 5, rx + 12, ry + 10); c.fill();
    c.fillStyle = P.plazaM; ell(c, x, y, rx, ry); c.fill();
    c.save(); ell(c, x, y, rx, ry); c.clip();
    const rings = 11; for (let r = rings; r >= 1; r--) { const u = r / rings, n = Math.max(8, Math.round(14 * r)), rr0 = u * rx, rr1 = (r - 1) / rings * rx; for (let i = 0; i < n; i++) { const a0 = i / n * TAU + (r % 2 ? 0.08 : 0), a1 = (i + 1) / n * TAU + (r % 2 ? 0.08 : 0), g = 0.035; const col = (i + r) % 2 ? P.plazaP : P.plazaC, tone = 0.94 + hash(r, i, 20) * 0.12; c.fillStyle = shade(col, tone); c.beginPath(); c.arc(x, y, rr0 - 1.5, a0 + g, a1 - g); c.arc(x, y, rr1 + 1.5, a1 - g, a0 + g, true); c.closePath(); c.save(); c.scale(1, ry / rx); c.fill(); c.restore(); c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1; c.save(); c.scale(1, ry / rx); c.stroke(); c.restore(); c.save(); c.clip(); c.strokeStyle = 'rgba(90,60,70,.3)'; c.lineWidth = 2.6; c.save(); c.scale(1, ry / rx); c.beginPath(); c.arc(x, y, rr1 + 2, a1 - g, a0 + g, true); c.stroke(); c.restore(); c.restore();
      // the inlay: a small diamond in every other paver, a lichen speck in some joints
      const am = (a0 + a1) / 2, rm = (rr0 + rr1) / 2, ix = x + Math.cos(am) * rm, iy = y + Math.sin(am) * rm * ry / rx, d = Math.min(4, (rr0 - rr1) * 0.18); if ((i + r) % 2 && rr0 - rr1 > 12) { c.fillStyle = (i + r) % 4 === 1 ? 'rgba(200,120,140,.35)' : 'rgba(255,255,255,.4)'; c.beginPath(); c.moveTo(ix, iy - d); c.lineTo(ix + d, iy); c.lineTo(ix, iy + d); c.lineTo(ix - d, iy); c.closePath(); c.fill(); } if (hash(r, i, 21) < 0.18) { c.fillStyle = hash(r, i, 22) < 0.5 ? 'rgba(150,170,90,.5)' : 'rgba(90,140,80,.4)'; ell(c, x + Math.cos(a0 + g) * rr1 * 1.01, y + Math.sin(a0 + g) * rr1 * 1.01 * ry / rx, 1.8, 1.2); c.fill(); } } }
    // the rosette round the fountain basin
    { const fy = y - 6; c.fillStyle = '#E6D2BC'; ell(c, x, fy, 78, 44); c.fill(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.fillStyle = i % 2 ? '#F2A6B8' : '#FFF5E6'; c.beginPath(); c.moveTo(x, fy); c.lineTo(x + Math.cos(a - 0.22) * 74, fy + Math.sin(a - 0.22) * 41); c.quadraticCurveTo(x + Math.cos(a) * 80, fy + Math.sin(a) * 45, x + Math.cos(a + 0.22) * 74, fy + Math.sin(a + 0.22) * 41); c.closePath(); c.fill(); c.strokeStyle = 'rgba(120,70,60,.3)'; c.lineWidth = 1.1; c.stroke(); } ell(c, x, fy, 78, 44); c.strokeStyle = 'rgba(120,70,60,.4)'; c.lineWidth = 2; c.stroke(); }
    grain(c, x - rx, y - ry, rx * 2, ry * 2, 0.28);
    const pg = c.createRadialGradient(x, y, 30, x, y, rx); pg.addColorStop(0, 'rgba(255,245,220,.14)'); pg.addColorStop(1, 'rgba(70,40,30,.14)'); c.fillStyle = pg; c.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    c.restore();
    c.strokeStyle = '#B9A58A'; c.lineWidth = 7; ell(c, x, y, rx - 2, ry - 2); c.stroke(); c.strokeStyle = 'rgba(70,50,35,.45)'; c.lineWidth = 1.8; ell(c, x, y, rx + 2, ry + 2); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1.2; ell(c, x, y, rx - 6, ry - 6); c.stroke();
  }
  /* the river: a band along the polyline. Banks (mud, sand, pebbles), the deep water with a lighter shallow edge, static
     foam at the bank; flow lines and sparkle are live (see liveWater). */
  function riverPts() { return L().river.pts; }
  function riverCurve(c, pts, sx, sy) { sx = sx || (v => v); sy = sy || (v => v); c.beginPath(); c.moveTo(sx(pts[0][0]), sy(pts[0][1])); for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; c.quadraticCurveTo(sx(pts[i][0]), sy(pts[i][1]), sx(mx), sy(my)); } c.lineTo(sx(pts[pts.length - 1][0]), sy(pts[pts.length - 1][1])); }
  function drawRiver(c, bb) {
    const R = L().river, pts = R.pts; if (!pts.length) return; const rb = bboxOf(pts); if (!hit([rb[0], rb[1] - R.w, rb[2], rb[3] + R.w], bb)) return;
    const w = R.w, H = L();
    const curve = (lw, col) => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; riverCurve(c, pts); c.stroke(); };
    // banks: a shadowed lip, mud, sand
    curve(w + 46, 'rgba(60,45,30,.18)'); curve(w + 34, P.mud); curve(w + 22, P.sand);
    // the riverbed: pale sand with pebbles across the whole band (seen through the shallows)
    curve(w + 4, '#2A5F93'); curve(w, '#C9B48E');
    c.save(); riverCurve(c, pts); c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,0)'; c.stroke();
    for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], len = Math.hypot(bx - ax, by - ay), n = Math.round(len / 5); const tx = (bx - ax) / len, ty = (by - ay) / len; for (let j = 0; j < n; j++) { const u = j / n, x = lerp(ax, bx, u), y = lerp(ay, by, u); if (x < bb[0] - 60 || x > bb[2] + 60) continue; for (let q = 0; q < 2; q++) { const o = (hash(x, q, 280) - 0.5) * (w - 10), px = x - ty * o, py = y + tx * o; c.fillStyle = shade(['#B7A58A', '#9E9282', '#C8B99C', '#8E857A'][Math.floor(hash(x, q, 281) * 4)], 0.9 + hash(x, q, 282) * 0.2); ell(c, px, py, 1.6 + hash(x, q, 283) * 2.6, 1.2 + hash(x, q, 284) * 1.4, hash(x, q, 285) * 3); c.fill(); } } }
    // translucent water: light shallows, then deeper and darker towards the centre
    curve(w, 'rgba(120,196,236,.5)'); curve(w - 16, 'rgba(70,150,214,.5)'); curve(w - 34, 'rgba(44,112,180,.62)'); curve(w - 54, 'rgba(30,80,150,.6)'); curve(w - 72, 'rgba(22,62,128,.5)');
    // reflection bands (sky light) baked faintly; the breathing ones are live
    curve(w * 0.3, 'rgba(255,255,255,.06)');
    // foam at the banks and round pilings / bridge piers
    c.fillStyle = 'rgba(255,255,255,.42)';
    for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], len = Math.hypot(bx - ax, by - ay), n = Math.round(len / 7); const tx = (bx - ax) / len, ty = (by - ay) / len; for (let j = 0; j < n; j++) { const u = j / n, x = lerp(ax, bx, u), y = lerp(ay, by, u); if (x < bb[0] - 60 || x > bb[2] + 60) continue; for (const sgn of [-1, 1]) { const h = hash(x, sgn, 290); if (h < 0.45) continue; const o = w / 2 - 2 - h * 5, px = x - ty * sgn * o, py = y + tx * sgn * o; c.globalAlpha = 0.25 + h * 0.3; ell(c, px, py, 3 + h * 5, 1.4 + h, Math.atan2(ty, tx)); c.fill(); } } }
    c.globalAlpha = 1;
    const foamRing = (x, y, r) => { for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + hash(x, i, 291) * 0.5, rr0 = r + hash(x, i, 292) * 4; c.globalAlpha = 0.3 + hash(x, i, 293) * 0.3; ell(c, x + Math.cos(a) * rr0, y + Math.sin(a) * rr0 * 0.6, 3 + hash(x, i, 294) * 3, 1.6); c.fill(); } c.globalAlpha = 1; };
    for (const B of H.bridges) { foamRing(B.x - 4, B.y + B.h / 2, 12); foamRing(B.x + B.w + 4, B.y + B.h / 2, 12); }
    if (H.dock) { const n = riverNear(H.dock.x + H.dock.w / 2, H.dock.y), top = Math.min(H.dock.y - 20, n.y + 4), px = H.dock.x + 8; foamRing(px + 7, top + 10, 7); foamRing(px + 45, top + 10, 7); }
    // pebbles on the banks
    for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], len = Math.hypot(bx - ax, by - ay), n = Math.round(len / 9); for (let j = 0; j < n; j++) { const u = j / n, x = lerp(ax, bx, u), y = lerp(ay, by, u); if (x < bb[0] - 80 || x > bb[2] + 80) continue; const tx = (bx - ax) / len, ty = (by - ay) / len; for (const sgn of [-1, 1]) { if (hash(x, sgn, 30) < 0.55) continue; const o = w / 2 + 6 + hash(x, sgn, 31) * 12, px = x - ty * sgn * o, py = y + tx * sgn * o; c.fillStyle = shade('#A89C8A', 0.8 + hash(x, sgn, 32) * 0.45); ell(c, px, py, 2 + hash(x, sgn, 33) * 3, 1.5 + hash(x, sgn, 34) * 1.6, hash(x, sgn, 35) * 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.4)'; ell(c, px - 0.8, py - 0.7, 1, 0.6); c.fill(); if (hash(x, sgn, 36) > 0.8) { const fx = px - ty * sgn * 14, fy = py + tx * sgn * 14; c.fillStyle = ['#FFFFFF', '#FFE37A', '#C9A8F0', '#FFB3D1'][Math.floor(hash(x, sgn, 37) * 4)]; circ(c, fx, fy, 1.6); c.fill(); circ(c, fx + 3, fy + 1.5, 1.3); c.fill(); } } } }
    c.restore(); grain(c, rb[0], rb[1] - w, rb[2] - rb[0], rb[3] - rb[1] + w * 2, 0.14);
  }
  /* the nearest point on the river's centre line, its distance and the local tangent */
  function riverNear(x, y) { const pts = riverPts(); let best = { d: 1e9 }; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, u = clamp(((x - ax) * dx + (y - ay) * dy) / l2, 0, 1), px = ax + dx * u, py = ay + dy * u, d = Math.hypot(x - px, y - py); if (d < best.d) { const l = Math.sqrt(l2); best = { d, x: px, y: py, tx: dx / l, ty: dy / l }; } } return best; }
  /* planks: a deck of boards with gaps, grain lines and nail heads, in a rect */
  function planks(c, x, y, w, h, across, col) {
    c.fillStyle = col || '#A87A4E'; c.fillRect(x, y, w, h);
    const n = Math.max(2, Math.round((across ? h : w) / 11));
    for (let i = 0; i < n; i++) { const u = i / n, v = (i + 1) / n; const tone = 0.9 + hash(x + i, y, 40) * 0.2; c.fillStyle = shade(col || '#A87A4E', tone); if (across) c.fillRect(x, y + h * u + 0.8, w, h / n - 1.6); else c.fillRect(x + w * u + 0.8, y, w / n - 1.6, h); c.strokeStyle = 'rgba(60,35,15,.35)'; c.lineWidth = 0.8; c.beginPath(); if (across) { const yy = y + h * (u + v) / 2; c.moveTo(x + 4, yy + 1); c.lineTo(x + w - 4, yy - 1); } else { const xx = x + w * (u + v) / 2; c.moveTo(xx + 1, y + 4); c.lineTo(xx - 1, y + h - 4); } c.stroke(); c.fillStyle = '#4A3A30'; if (across) { circ(c, x + 5, y + h * (u + v) / 2, 1.1); c.fill(); circ(c, x + w - 5, y + h * (u + v) / 2, 1.1); c.fill(); } else { circ(c, x + w * (u + v) / 2, y + 5, 1.1); c.fill(); circ(c, x + w * (u + v) / 2, y + h - 5, 1.1); c.fill(); } }
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); grain(c, x, y, w, h, 0.3); c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(x, y, w, h);
  }
  /* the wooden dock: a pier of planks on pilings reaching from the south bank into the water, with a mooring post */
  function drawDock(c, bb) {
    const D = L().dock; if (!D) return; const near = riverNear(D.x + D.w / 2, D.y), top = Math.min(D.y - 20, near.y + 4), px = D.x + 8, pw = 52, ph = D.y - top + 6; if (!hit([D.x - 20, top - 20, D.x + D.w + 20, D.y + D.h + 20], bb)) return;
    // the pier's shadow on the water and its pilings with ripple collars
    c.fillStyle = 'rgba(20,40,80,.3)'; c.fillRect(px + 6, top + 8, pw, ph); for (const [qx, qy] of [[px + 7, top + 5], [px + pw - 7, top + 5], [px + 7, top + ph * 0.55], [px + pw - 7, top + ph * 0.55]]) { c.fillStyle = 'rgba(255,255,255,.35)'; ell(c, qx, qy + 7, 9, 3); c.fill(); c.fillStyle = '#5A4030'; ell(c, qx, qy + 4, 5, 3); c.fill(); }
    planks(c, px, top, pw, ph, true, '#B5855A');
    c.fillStyle = '#8A5E3A'; c.fillRect(px - 3, top, 4, ph); c.fillRect(px + pw - 1, top, 4, ph); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(px - 3, top, 4, ph); c.strokeRect(px + pw - 1, top, 4, ph);
    // the landing on the bank: wider boards running the other way
    c.fillStyle = 'rgba(30,25,20,.22)'; c.fillRect(D.x + 3, D.y + 4, D.w, D.h); planks(c, D.x, D.y, D.w, D.h, false, '#AD7E54');
    // mooring post with a coil of rope, a lantern hook post at the landing
    c.fillStyle = '#6E4A2A'; c.fillRect(px + pw - 14, top - 4, 8, 16); c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(px + pw - 14, top - 4, 8, 16); c.strokeStyle = '#D9C39A'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { ell(c, px + pw - 10, top + 2 + i * 3, 6, 2); c.stroke(); }
    c.fillStyle = '#6E4A2A'; c.fillRect(D.x + 4, D.y + 4, 7, 7); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(D.x + 4, D.y + 4, 7, 7);
  }
  /* an arched stone bridge seen from above: the deck (planks on cobbles), parapets on both sides with a curved profile,
     an arch shadow on the water at each end */
  function drawBridge(c, B, bb) {
    const x = B.x, y = B.y, w = B.w, h = B.h; if (!hit([x - 14, y - 10, x + w + 14, y + h + 14], bb)) return;
    c.fillStyle = 'rgba(15,35,70,.35)'; ell(c, x + w / 2, y + h * 0.5, w * 0.6, h * 0.46); c.fill();
    // the arch's belly: a lighter stone crescent peeking out at the sides of the deck
    c.fillStyle = '#7F8784'; c.beginPath(); c.moveTo(x - 6, y + 10); c.quadraticCurveTo(x - 14, y + h / 2, x - 6, y + h - 10); c.lineTo(x + 2, y + h - 10); c.lineTo(x + 2, y + 10); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x + w + 6, y + 10); c.quadraticCurveTo(x + w + 14, y + h / 2, x + w + 6, y + h - 10); c.lineTo(x + w - 2, y + h - 10); c.lineTo(x + w - 2, y + 10); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 6, y + 10); c.quadraticCurveTo(x - 14, y + h / 2, x - 6, y + h - 10); c.moveTo(x + w + 6, y + 10); c.quadraticCurveTo(x + w + 14, y + h / 2, x + w + 6, y + h - 10); c.stroke();
    // deck: stone with a cobble course, the crown of the arch lighter
    c.fillStyle = P.flagM; c.fillRect(x, y, w, h);
    let row = 0; for (let yy = y + 4; yy < y + h - 4; yy += 11, row++) { let xx = x + 10 + (row % 2 ? 7 : 0); while (xx < x + w - 12) { const sw = 12 + hash(xx, yy, 50) * 5; stone(c, xx + sw / 2, yy + 5, sw / 2, 5, xx * 3 + yy, shade(P.flag, 0.9 + hash(xx, yy, 51) * 0.2), 0.9); xx += sw + 1; } }
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(0,0,0,.14)'); g.addColorStop(0.5, 'rgba(255,255,255,.16)'); g.addColorStop(1, 'rgba(0,0,0,.16)'); c.fillStyle = g; c.fillRect(x, y, w, h);
    // parapets: low stone walls with coping, a bowed profile so the arch reads
    for (const side of [0, 1]) { const px = side ? x + w - 10 : x; c.fillStyle = '#9AA296'; c.beginPath(); c.moveTo(px, y - 2); c.quadraticCurveTo(px + (side ? 12 : -2), y + h / 2, px, y + h + 2); c.lineTo(px + 10, y + h + 2); c.quadraticCurveTo(px + (side ? 12 : -2) + 10, y + h / 2, px + 10, y - 2); c.closePath(); c.fill(); c.save(); c.clip(); for (let yy = y; yy < y + h; yy += 9) { c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(px - 4, yy, 20, 1.2); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(px - 4, yy + 1.2, 20, 1); } grain(c, px - 6, y - 4, 24, h + 8, 0.35); c.restore(); ink(c, 1.6); c.fillStyle = '#C8CFC4'; c.beginPath(); c.moveTo(px + 2, y - 2); c.quadraticCurveTo(px + (side ? 12 : -2) + 2, y + h / 2, px + 2, y + h + 2); c.lineTo(px + 5, y + h + 2); c.quadraticCurveTo(px + (side ? 12 : -2) + 5, y + h / 2, px + 5, y - 2); c.closePath(); c.fill(); }
    // end posts
    for (const [px, py] of [[x, y], [x + w - 10, y], [x, y + h - 10], [x + w - 10, y + h - 10]]) { c.fillStyle = '#AEB6AA'; c.fillRect(px - 2, py - 2, 14, 14); c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(px - 2, py - 2, 14, 14); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(px, py, 5, 5); }
  }
  /* the farm's beds: an apron of tilled earth round the plots with a low stone edging and an irrigation channel */
  function farmRect() { const pl = L().plots; if (!pl.length) return null; const b = bboxOf(pl); return [b[0] - 66, b[1] - 92, b[2] + 66, b[3] + 22]; }
  function drawFarm(c, bb) {
    const F = farmRect(); if (!F || !hit(F, bb)) return; const [x0, y0, x1, y1] = F, w = x1 - x0, h = y1 - y0;
    c.fillStyle = 'rgba(60,45,30,.2)'; c.fillRect(x0 - 4, y0 + 6, w + 8, h + 4);
    c.fillStyle = '#A3825C'; c.fillRect(x0, y0, w, h); c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
    // packed earth with footworn patches and a few straws
    for (let i = 0; i < 24; i++) { c.fillStyle = hash(i, 1, 300) < 0.5 ? 'rgba(255,240,210,.14)' : 'rgba(70,45,25,.14)'; ell(c, x0 + hash(i, 2, 301) * w, y0 + hash(i, 3, 302) * h, 20 + hash(i, 4, 303) * 30, 8 + hash(i, 5, 304) * 10); c.fill(); } c.strokeStyle = 'rgba(230,200,140,.5)'; c.lineWidth = 1; for (let i = 0; i < 60; i++) { const x = x0 + hash(i, 6, 305) * w, y = y0 + hash(i, 7, 306) * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (hash(i, 8, 307) - 0.5) * 10, y + (hash(i, 9, 308) - 0.5) * 4); c.stroke(); } grain(c, x0, y0, w, h, 0.3); c.restore();
    for (const [px, py] of L().plots) { c.fillStyle = '#6E5035'; c.beginPath(); c.roundRect ? c.roundRect(px - 45, py - 70, 90, 70, 4) : c.rect(px - 45, py - 70, 90, 70); c.fill(); c.strokeStyle = 'rgba(40,25,15,.3)'; c.lineWidth = 1.2; c.stroke(); for (let r = 0; r < 4; r++) { const ry = py - 62 + r * 17; c.fillStyle = '#5A3F2A'; c.fillRect(px - 40, ry, 80, 6); c.fillStyle = 'rgba(255,230,200,.16)'; c.fillRect(px - 40, ry + 6, 80, 1.5); } }
    // the irrigation channel between the two rows: a stone-lined runnel with water
    const rows = [...new Set(L().plots.map(p => p[1]))].sort((a, b) => a - b); if (rows.length >= 2) { const cy = (rows[0] + rows[1] - 70) / 2; c.fillStyle = '#7A736A'; c.fillRect(x0 + 10, cy - 8, w - 20, 16); c.fillStyle = P.water; c.fillRect(x0 + 12, cy - 5, w - 24, 10); c.fillStyle = 'rgba(255,255,255,.35)'; for (let xx = x0 + 20; xx < x1 - 20; xx += 22) c.fillRect(xx, cy - 2, 9, 1.6); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(x0 + 10, cy - 8, w - 20, 16); }
    // the stone edging
    c.strokeStyle = '#9A9282'; c.lineWidth = 7; c.strokeRect(x0, y0, w, h); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1.5; c.strokeRect(x0 - 2, y0 - 2, w + 4, h + 4); c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(x0 + 3, y0 + 3, w - 6, h - 6); c.strokeRect(x0 - 3.5, y0 - 3.5, w + 7, h + 7);
    let s = 0; for (let xx = x0; xx < x1; xx += 14, s++) { c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(xx + 12, y0 - 3, 1.5, 6); c.fillRect(xx + 12 + (s % 2 ? 4 : 0), y1 - 3, 1.5, 6); } for (let yy = y0; yy < y1; yy += 14) { c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(x0 - 3, yy + 12, 6, 1.5); c.fillRect(x1 - 3, yy + 12, 6, 1.5); }
  }
  /* grass: base tone, light and dark pools, district colour drift, grain, dappled light, blade clumps with lighter
     tips, clover and small wildflowers — in a rect, at a density by zoom */
  const TINTS = [[470, 1240, 320, 240, 'rgba(210,200,90,.14)'], [1250, 1830, 420, 220, 'rgba(90,190,170,.14)'], [2020, 900, 320, 260, 'rgba(160,170,70,.12)'], [1300, 1450, 300, 200, 'rgba(230,200,120,.1)'], [720, 520, 320, 240, 'rgba(190,230,120,.12)'], [330, 820, 150, 120, 'rgba(170,220,200,.16)']];
  function grassFill(c, x0, y0, x1, y1, base, kq, seed) {
    c.fillStyle = base; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    const cell = 160; for (let gy = Math.floor(y0 / cell) - 1; gy <= Math.floor(y1 / cell); gy++) for (let gx = Math.floor(x0 / cell) - 1; gx <= Math.floor(x1 / cell); gx++) { const px = (gx + hash(gx, gy, seed)) * cell, py = (gy + hash(gx, gy, seed + 1)) * cell, r = 60 + hash(gx, gy, seed + 2) * 110, lite = hash(gx, gy, seed + 3) < 0.45; const g = c.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, lite ? 'rgba(190,232,130,.3)' : 'rgba(25,75,40,.24)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; ell(c, px, py, r, r * 0.62); c.fill(); }
    for (const [tx, ty, trx, try_, col] of TINTS) if (hit([tx - trx, ty - try_, tx + trx, ty + try_], [x0, y0, x1, y1])) { c.fillStyle = col; ell(c, tx, ty, trx, try_); c.fill(); }
    grain(c, x0, y0, x1 - x0, y1 - y0, 0.22);
    // dappled light: small warm pools
    const dc = 90; for (let gy = Math.floor(y0 / dc) - 1; gy <= Math.floor(y1 / dc); gy++) for (let gx = Math.floor(x0 / dc) - 1; gx <= Math.floor(x1 / dc); gx++) { if (hash(gx, gy, seed + 9) < 0.55) continue; const px = (gx + hash(gx, gy, seed + 4)) * dc, py = (gy + hash(gx, gy, seed + 5)) * dc, r = 18 + hash(gx, gy, seed + 6) * 26; const g = c.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(235,245,170,.2)'); g.addColorStop(1, 'rgba(235,245,170,0)'); c.fillStyle = g; ell(c, px, py, r, r * 0.55, hash(gx, gy, seed + 7) * 1.2); c.fill(); }
    if (kq < 0.5) return;
    const tc = 28, dens = kq > 0.9 ? 3 : 2; c.lineCap = 'round';
    for (let gy = Math.floor(y0 / tc); gy <= Math.floor(y1 / tc); gy++) for (let gx = Math.floor(x0 / tc); gx <= Math.floor(x1 / tc); gx++) for (let i = 0; i < dens; i++) {
      const x = (gx + hash(gx, gy, 100 + i)) * tc, y = (gy + hash(gx, gy, 110 + i)) * tc, h = 5 + hash(gx, gy, 120 + i) * 6, d = hash(gx, gy, 130 + i);
      if (i === 0 && d > 0.9) { const col = ['#FFFFFF', '#FFE37A', '#C9A8F0', '#FFB3D1'][(gx * 3 + gy) & 3]; c.fillStyle = '#4C9A48'; ell(c, x + 2, y + 1, 3, 1.4, 0.5); c.fill(); c.fillStyle = col; circ(c, x + 5, y - 2, 1.6); c.fill(); if (d > 0.96) { circ(c, x + 8, y + 1, 1.3); c.fill(); } c.fillStyle = 'rgba(255,255,255,.55)'; circ(c, x + 4.5, y - 2.5, 0.6); c.fill(); continue; }
      if (i === 1 && d < 0.05) { c.fillStyle = 'rgba(90,170,80,.7)'; circ(c, x + 5, y + 2, 1.5); c.fill(); circ(c, x + 7.6, y + 0.4, 1.5); c.fill(); circ(c, x + 6.4, y + 3.8, 1.5); c.fill(); continue; }
      // a clump of three blades: dark bases, light tips
      const dark = d < 0.5, nb = d < 0.35 ? 2 : 3; c.lineWidth = 1.2; for (let b = 0; b < nb; b++) { const bb2 = b - (nb - 1) / 2, lean = bb2 * 3 + (d - 0.5) * 4, bh = (h + 2) * (bb2 ? 0.8 : 1); c.strokeStyle = dark ? 'rgba(40,105,48,.42)' : 'rgba(75,145,65,.38)'; c.beginPath(); c.moveTo(x + bb2 * 1.4, y); c.quadraticCurveTo(x + bb2 * 1.4 + lean * 0.35, y - bh * 0.55, x + bb2 * 1.4 + lean, y - bh); c.stroke(); if (!bb2 || d > 0.7) { c.strokeStyle = dark ? 'rgba(150,210,110,.38)' : 'rgba(205,240,155,.42)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x + bb2 * 1.4 + lean * 0.6, y - bh * 0.66); c.lineTo(x + bb2 * 1.4 + lean, y - bh); c.stroke(); c.lineWidth = 1.2; } }
    }
  }
  /* a flower clump on the ground (blooms over a leaf disc) */
  function flowerPatch(c, x, y, r, seed) { c.fillStyle = 'rgba(40,110,45,.55)'; ell(c, x, y, r, r * 0.6); c.fill(); const n = Math.round(r * r / 12); for (let i = 0; i < n; i++) { const a = hash(seed, i, 60) * TAU, rr0 = Math.sqrt(hash(seed, i, 61)) * r * 0.95, fx = x + Math.cos(a) * rr0, fy = y + Math.sin(a) * rr0 * 0.6; c.fillStyle = '#4A9A4A'; ell(c, fx + 2, fy + 1, 3, 1.6, hash(seed, i, 62) * 3); c.fill(); c.fillStyle = ['#FF6F59', '#FF9BD2', '#FFE37A', '#FFFFFF', '#B983F5', '#FF9F43'][(i + seed) % 6]; if (i % 7 === 3) { const sr = 3 + hash(seed, i, 64) * 1.5; c.fillStyle = hash(seed, i, 65) < 0.5 ? '#FFF6B0' : '#FFFFFF'; c.beginPath(); for (let p = 0; p < 10; p++) { const a = p / 10 * TAU - Math.PI / 2, r = p % 2 ? sr * 0.42 : sr; p ? c.lineTo(fx + Math.cos(a) * r, fy + Math.sin(a) * r) : c.moveTo(fx + Math.cos(a) * r, fy + Math.sin(a) * r); } c.closePath(); c.fill(); c.fillStyle = '#F2B13C'; circ(c, fx, fy, 0.9); c.fill(); } else { circ(c, fx, fy, 2.2 + hash(seed, i, 63) * 1.5); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; circ(c, fx - 0.7, fy - 0.7, 0.9); c.fill(); } } }
  /* flower patches: a deterministic scatter near paths, the plaza rim, the cottage, the gardens */
  let flowerSpots = null;
  function flowers() {
    if (flowerSpots) return flowerSpots; const out = [], H = L(), R = rng(77);
    const add = (x, y, r, lv) => out.push({ x, y, r, lv: lv == null ? lvAt(x, y) : lv });
    H.paths.forEach((p, i) => { for (let j = 0; j < p.pts.length - 1; j++) { const [ax, ay] = p.pts[j], [bx, by] = p.pts[j + 1], len = Math.hypot(bx - ax, by - ay); for (let s = 30; s < len - 20; s += 70) { if (R() < 0.55) continue; const u = s / len, sgn = R() < 0.5 ? -1 : 1, tx = (bx - ax) / len, ty = (by - ay) / len, o = p.w / 2 + 14 + R() * 12; add(lerp(ax, bx, u) - ty * sgn * o, lerp(ay, by, u) + tx * sgn * o, 9 + R() * 8); } } });
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; add(PLAZA.x + Math.cos(a) * (PLAZA.rx + 22), PLAZA.y + Math.sin(a) * (PLAZA.ry + 20), 10 + R() * 6, 0); }
    [[640, 560, 16], [800, 640, 14], [560, 640, 12], [330, 790, 14], [300, 850, 12], [370, 850, 11], [1240, 1830, 16], [1340, 1810, 14], [1150, 1880, 12], [2330, 330, 12], [2400, 240, 12], [2260, 390, 10], [1720, 1800, 12], [1120, 1500, 12], [980, 1120, 12], [2140, 1300, 10]].forEach(([x, y, r]) => add(x, y, r));
    flowerSpots = out; return out;
  }
  /* stone courses in a (u, v) rect: staggered blocks with a light top rim and dark joints, mossy where damp */
  function courses(c, w, h, col, rowH, mossy) {
    c.fillStyle = shade(col, 0.72); c.fillRect(0, 0, w, h); let row = 0;
    for (let yy = 0; yy < h; yy += rowH, row++) { let xx = (row % 2 ? -rowH * 0.9 : 0); while (xx < w) { const bw = rowH * 1.6 + hash(xx, row, 70) * rowH * 1.1, bh = Math.min(rowH - 1.4, h - yy - 0.8); const tone = 0.88 + hash(xx, row, 71) * 0.24; c.fillStyle = shade(col, tone); c.beginPath(); c.roundRect ? c.roundRect(Math.max(0, xx), yy, Math.min(bw - 1.6, w - Math.max(0, xx)), bh, 1.5) : c.rect(Math.max(0, xx), yy, Math.min(bw - 1.6, w - Math.max(0, xx)), bh); c.fill(); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(Math.max(0, xx) + 1, yy + 0.6, Math.min(bw - 3.6, w - Math.max(0, xx)), 1.1); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(Math.max(0, xx) + 1, yy + bh - 1.2, Math.min(bw - 3.6, w - Math.max(0, xx)), 1.2); if (mossy && hash(xx, row, 72) < 0.22) { c.fillStyle = rgba(P.moss, 0.55); ell(c, xx + bw * 0.5, yy + bh * 0.6, bw * 0.28, bh * 0.32); c.fill(); } xx += bw; } }
  }
  /* a terrace: the retaining wall faces on every south-facing edge (70 px per level), then the lifted top */
  function drawTerrace(c, T, bb, kq) {
    const Lh = lift(T.lv), pts = T.poly, b = bboxOf(pts); if (!hit([b[0] - 10, b[1] - Lh - 10, b[2] + 10, b[3] + 20], bb)) return;
    let area = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; area += p[0] * q[1] - q[0] * p[1]; } const cw = area > 0;   // clockwise on a y-down screen
    const faces = [];
    for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy); let nx = dy / len, ny = -dx / len; if (!cw) { nx = -nx; ny = -ny; } faces.push({ p, q, dx, dy, len, nx, ny }); }
    // contact shadow under the faces (cast onto the lower ground)
    for (const f of faces) if (f.ny > 0.3) { c.fillStyle = 'rgba(30,25,20,.22)'; c.beginPath(); c.moveTo(f.p[0], f.p[1]); c.lineTo(f.q[0], f.q[1]); c.lineTo(f.q[0] + 4, f.q[1] + 12); c.lineTo(f.p[0] + 4, f.p[1] + 12); c.closePath(); c.fill(); }
    for (const f of faces) {
      if (f.ny > 0.3) {
        c.save(); c.transform(f.dx / f.len, f.dy / f.len, 0, 1, f.p[0], f.p[1] - Lh); c.beginPath(); c.rect(0, 0, f.len, Lh); c.clip();
        courses(c, f.len, Lh, P.wall, 11, true);
        const g = c.createLinearGradient(0, 0, 0, Lh); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(0.6, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.28)'); c.fillStyle = g; c.fillRect(0, 0, f.len, Lh); grain(c, 0, 0, f.len, Lh, 0.3);
        // ivy and grass hanging over the rim, moss at the foot
        c.strokeStyle = 'rgba(70,130,60,.75)'; c.lineWidth = 1.6; for (let u = 6; u < f.len; u += 9) { if (hash(u, f.p[0], 80) < 0.4) continue; const h = 5 + hash(u, f.p[1], 81) * 14; c.beginPath(); c.moveTo(u, 0); c.quadraticCurveTo(u + 2, h * 0.5, u + (hash(u, 2, 82) - 0.5) * 5, h); c.stroke(); if (hash(u, 3, 83) < 0.5) { c.fillStyle = '#5FAF55'; ell(c, u + 1, h * 0.7, 2.4, 1.6, 0.5); c.fill(); } }
        c.fillStyle = rgba(P.moss, 0.5); for (let u = 0; u < f.len; u += 14) { if (hash(u, 9, 84) < 0.5) continue; ell(c, u + 7, Lh - 2, 7 + hash(u, 8, 85) * 8, 3); c.fill(); }
        c.restore();
        // ink: the foot line and the two vertical ends
        c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(f.p[0], f.p[1]); c.lineTo(f.q[0], f.q[1]); c.stroke();
      } else if (f.ny > 0.04) {
        // an edge seen end-on: a sliver of wall between the lifted rim and the ground, with ink
        c.fillStyle = P.wallD; c.beginPath(); c.moveTo(f.p[0], f.p[1] - Lh); c.lineTo(f.q[0], f.q[1] - Lh); c.lineTo(f.q[0], f.q[1]); c.lineTo(f.p[0], f.p[1]); c.closePath(); c.fill();
      }
    }
    // the top: lighter grass, a stone rim along the walled edges
    c.save(); poly(c, pts, -Lh); c.clip();
    const tone = T.id === 'sanctuary' ? P.grassSanct : T.id === 'lookout' ? P.grassLook : P.grassTop; grassFill(c, b[0], b[1] - Lh, b[2], b[3] - Lh, tone, kq, 200 + T.lv);
    c.restore();
    poly(c, pts, -Lh); c.strokeStyle = '#AEB5A8'; c.lineWidth = 5; c.lineJoin = 'round'; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.4; c.stroke(); poly(c, pts, -Lh); ink(c, 1.6);
    // the per-terrace dressing on the top
    if (T.id === 'dojo') drawCourt(c, 2060, 980 - Lh, 330, 170, bb);
    if (T.id === 'sanctuary') drawSanctuaryFloor(c, Lh, bb);
    if (T.id === 'lookout') drawLookout(c, Lh, bb);
    if (T.id === 'cottage') { c.save(); poly(c, pts, -Lh); c.clip(); c.fillStyle = P.flagM; c.beginPath(); c.roundRect ? c.roundRect(600, 540 - Lh, 240, 70, 14) : c.rect(600, 540 - Lh, 240, 70); c.fill(); let row = 0; for (let yy = 548 - Lh; yy < 600 - Lh; yy += 13, row++) for (let xx = 608 + (row % 2 ? 8 : 0); xx < 830; xx += 17) stone(c, xx, yy + 5, 8, 5.5, xx + yy, shade(P.flag, 0.9 + hash(xx, yy, 90) * 0.2), 0.9); c.restore(); }
  }
  /* the dojo's training court: raked gravel in a timber frame with a stone border, lines drawn in the gravel */
  function drawCourt(c, x, y, w, h, bb) {
    if (!hit([x - w / 2, y - h / 2, x + w / 2, y + h / 2], bb)) return; const x0 = x - w / 2, y0 = y - h / 2;
    c.fillStyle = '#5A4630'; c.fillRect(x0 - 6, y0 - 6, w + 12, h + 12); c.fillStyle = '#D9CBB0'; c.fillRect(x0, y0, w, h); c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip(); c.strokeStyle = 'rgba(120,100,70,.3)'; c.lineWidth = 1.2; for (let yy = y0 + 5; yy < y0 + h; yy += 7) { c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + w, yy + Math.sin(yy) * 1.5); c.stroke(); } for (let i = 0; i < 70; i++) { c.fillStyle = hash(i, 1, 95) < 0.5 ? 'rgba(255,255,255,.5)' : 'rgba(90,70,50,.3)'; circ(c, x0 + hash(i, 2, 96) * w, y0 + hash(i, 3, 97) * h, 1 + hash(i, 4, 98)); c.fill(); } grain(c, x0, y0, w, h, 0.3); c.strokeStyle = 'rgba(200,60,60,.55)'; c.lineWidth = 2.5; c.strokeRect(x0 + 30, y0 + 28, w - 60, h - 56); circ(c, x, y, 28); c.stroke(); c.restore(); c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(x0 - 6, y0 - 6, w + 12, h + 12); c.strokeRect(x0, y0, w, h);
  }
  /* the sanctuary's floor: a ring of pale stone paving round the pool, a flagged walk up to the altar, petals strewn */
  function drawSanctuaryFloor(c, Lh, bb) {
    const cx = 1300, cy = 440 - Lh; if (!hit([cx - 260, cy - 250, cx + 260, cy + 120], bb)) return;
    c.fillStyle = '#C9CBBE'; ell(c, cx, cy, 170, 92); c.fill(); c.save(); ell(c, cx, cy, 170, 92); c.clip();
    for (let r = 6; r >= 1; r--) { const n = 10 + r * 6, r0 = r / 6 * 170, r1 = (r - 1) / 6 * 170; for (let i = 0; i < n; i++) { const a0 = i / n * TAU, a1 = (i + 1) / n * TAU; c.fillStyle = shade((i + r) % 2 ? '#D9DBCF' : '#E8E6DA', 0.94 + hash(r, i, 101) * 0.1); c.beginPath(); c.save(); c.translate(cx, cy); c.scale(1, 92 / 170); c.arc(0, 0, r0 - 1.5, a0 + 0.03, a1 - 0.03); c.arc(0, 0, r1 + 1.5, a1 - 0.03, a0 + 0.03, true); c.closePath(); c.restore(); c.fill(); c.strokeStyle = 'rgba(80,80,90,.22)'; c.lineWidth = 1; c.stroke(); } }
    grain(c, cx - 170, cy - 92, 340, 184, 0.25); c.restore(); ell(c, cx, cy, 170, 92); c.strokeStyle = '#A6A89C'; c.lineWidth = 5; c.stroke(); ink(c, 1.4);
    runes(c, cx, cy, 'rgba(110,80,190,.42)', 1.8);
    // the walk to the altar
    c.fillStyle = P.flagM; c.fillRect(cx - 34, cy - 200, 68, 130); let row = 0; for (let yy = cy - 196; yy < cy - 76; yy += 13, row++) for (let xx = cx - 26 + (row % 2 ? 9 : 0); xx < cx + 26; xx += 18) stone(c, xx, yy + 5, 8.5, 5.5, xx * 7 + yy, shade('#E4E2D6', 0.9 + hash(xx, yy, 102) * 0.18), 0.9);
    c.fillStyle = 'rgba(247,182,210,.85)'; for (let i = 0; i < 40; i++) { const a = hash(i, 1, 103) * TAU, r = 40 + hash(i, 2, 104) * 200; ell(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.55, 2.4, 1.4, hash(i, 3, 105) * 3); c.fill(); }
  }
  /* eight rune glyphs inlaid round the sanctuary ring (also drawn live as a pulsing glow) */
  function runes(c, cx, cy, col, lw) { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8, x = cx + Math.cos(a) * 118, y = cy + Math.sin(a) * 64, s = 9; c.save(); c.translate(x, y); c.scale(1, 0.7); c.beginPath(); switch (i % 4) { case 0: c.moveTo(-s, s); c.lineTo(0, -s); c.lineTo(s, s); c.moveTo(-s * 0.5, 0); c.lineTo(s * 0.5, 0); break; case 1: c.moveTo(0, -s); c.lineTo(0, s); c.moveTo(-s, -s * 0.4); c.lineTo(0, s * 0.3); c.lineTo(s, -s * 0.4); break; case 2: c.moveTo(-s, -s); c.lineTo(s, s); c.moveTo(s, -s); c.lineTo(-s, s); c.moveTo(0, -s * 1.2); c.lineTo(0, s * 1.2); break; default: c.arc(0, 0, s * 0.8, 0, TAU); c.moveTo(-s * 1.2, 0); c.lineTo(s * 1.2, 0); } c.stroke(); c.restore(); } c.beginPath(); c.ellipse(cx, cy, 118, 64, 0, 0, TAU); c.lineWidth = lw * 0.6; c.stroke(); }
  /* the lookout: a rocky shelf with a flagged viewing circle and wildflowers */
  function drawLookout(c, Lh, bb) {
    const cx = 2340, cy = 300 - Lh; if (!hit([cx - 170, cy - 180, cx + 170, cy + 150], bb)) return;
    c.fillStyle = '#B9B2A2'; ell(c, cx, cy, 70, 42); c.fill(); c.save(); ell(c, cx, cy, 70, 42); c.clip(); let row = 0; for (let yy = cy - 42; yy < cy + 42; yy += 12, row++) for (let xx = cx - 70 + (row % 2 ? 8 : 0); xx < cx + 70; xx += 16) stone(c, xx, yy + 5, 7.5, 5, xx + yy * 3, shade('#CFC8B8', 0.9 + hash(xx, yy, 110) * 0.2), 0.9); grain(c, cx - 70, cy - 42, 140, 84, 0.25); c.restore(); ell(c, cx, cy, 70, 42); ink(c, 1.4);
    for (let i = 0; i < 14; i++) { const a = hash(i, 1, 111) * TAU, r = 80 + hash(i, 2, 112) * 70; flowerPatch(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8, 6 + hash(i, 3, 113) * 5, 500 + i); }
  }
  /* stairs: a slope in (u, v) space (u down the slope, v across), drawn under a transform that maps it into the world */
  function stairs(c, len, wid, n, Lh) {
    c.fillStyle = '#B8B2A3'; c.fillRect(0, 0, len, wid); const sh = len / n;
    for (let i = 0; i < n; i++) { const u = i * sh; c.fillStyle = shade('#CFC8B8', 0.92 + (i % 2) * 0.08 + hash(i, 1, 120) * 0.06); c.fillRect(u, 2, sh - 2.4, wid - 4); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(u, 2, 1.8, wid - 4); c.fillStyle = 'rgba(40,30,30,.45)'; c.fillRect(u + sh - 3.2, 2, 2.4, wid - 4); c.fillStyle = 'rgba(60,45,30,.12)'; c.fillRect(u + 2, 2, sh - 6, wid - 4); for (let j = 0; j < 3; j++) { c.fillStyle = 'rgba(0,0,0,.1)'; circ(c, u + 3 + hash(i, j, 121) * (sh - 6), 4 + hash(i, j, 122) * (wid - 8), 1.2); c.fill(); } }
    grain(c, 0, 0, len, wid, 0.28);
    // low side walls with coping
    for (const v of [0, wid - 7]) { c.fillStyle = P.wall; c.fillRect(-2, v, len + 4, 7); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-2, v + 1, len + 4, 1.4); for (let u = 0; u < len; u += 12) { c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(u + 10, v, 1.3, 7); } c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(-2, v, len + 4, 7); }
    // moss creeping in at the foot
    c.fillStyle = rgba(P.moss, 0.45); ell(c, len - 6, 10, 10, 4); c.fill(); ell(c, len - 10, wid - 12, 8, 3.5); c.fill();
  }
  function drawRamp(c, T, r, bb) {
    const Lh = lift(T.lv);
    if (r.dir === 's' || r.dir === 'n') { const len = r.h + Lh, y0 = r.y - Lh; if (!hit([r.x - 6, y0 - 4, r.x + r.w + 6, r.y + r.h + 10], bb)) return; c.fillStyle = 'rgba(30,25,20,.25)'; c.fillRect(r.x - 4, r.y + r.h, r.w + 8, 8); c.save(); c.transform(0, 1, 1, 0, r.x, y0); stairs(c, len, r.w, Math.max(6, Math.round(len / 13)), Lh); c.restore(); }
    else { const e = r.dir === 'e'; if (!hit([r.x - 6, r.y - Lh - 4, r.x + r.w + 6, r.y + r.h + 10], bb)) return; c.save(); if (e) c.transform(1, Lh / r.w, 0, 1, r.x, r.y - Lh); else c.transform(1, -Lh / r.w, 0, 1, r.x, r.y); if (!e) { c.translate(r.w, 0); c.scale(-1, 1); } stairs(c, r.w, r.h, Math.max(5, Math.round(r.w / 14)), Lh); c.restore(); }
  }
  /* small still features that live on the ground: the fountain basin's water disc (Geo's stone sits on it), the hidden
     garden's ring of blooms, the orchard's fallen fruit, the plots' soil shadow */
  function drawExtras(c, bb, kq) {
    const H = L();
    for (const o of H.orchard) { if (!hit([o[0] - 40, o[1] - 30, o[0] + 40, o[1] + 20], bb)) continue; c.fillStyle = 'rgba(120,180,90,.35)'; ell(c, o[0], o[1] - 2, 36, 18); c.fill(); for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#E8554E' : '#F2B13C'; circ(c, o[0] + (hash(o[0], i, 130) - 0.5) * 60, o[1] + (hash(o[1], i, 131) - 0.5) * 26, 2.4); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; circ(c, o[0] + (hash(o[0], i, 130) - 0.5) * 60 - 0.7, o[1] + (hash(o[1], i, 131) - 0.5) * 26 - 0.7, 0.8); c.fill(); } }
    for (const f of flowers()) { const y = f.y - lift(f.lv); if (!hit([f.x - f.r, y - f.r, f.x + f.r, y + f.r], bb)) continue; flowerPatch(c, f.x, y, f.r, Math.floor(f.x * 3 + f.y)); }
    for (const p of H.props) if (p.kind === 'fountain' && hit([p.x - 60, p.y - 50, p.x + 60, p.y + 10], bb)) { const g = c.createRadialGradient(p.x, p.y - 16, 4, p.x, p.y - 16, 46); g.addColorStop(0, '#9FDCFF'); g.addColorStop(0.7, '#3F8FD6'); g.addColorStop(1, '#245FA8'); c.fillStyle = g; ell(c, p.x, p.y - 16, 46, 24); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; ell(c, p.x - 12, p.y - 22, 14, 4, -0.3); c.fill(); }
    // the hidden garden: a soft bioluminescent glow under its flowers (breathes live)
    if (hit([180, 690, 480, 950], bb)) { const g = c.createRadialGradient(330, 820, 10, 330, 820, 110); g.addColorStop(0, 'rgba(140,255,230,.28)'); g.addColorStop(0.5, 'rgba(170,200,255,.16)'); g.addColorStop(1, 'rgba(170,200,255,0)'); c.fillStyle = g; ell(c, 330, 820, 110, 86); c.fill(); for (let i = 0; i < 18; i++) { const a = hash(i, 1, 320) * TAU, r = 20 + hash(i, 2, 321) * 80, x = 330 + Math.cos(a) * r, y = 820 + Math.sin(a) * r * 0.75; const gg = c.createRadialGradient(x, y, 0, x, y, 9); gg.addColorStop(0, 'rgba(180,255,240,.5)'); gg.addColorStop(1, 'rgba(180,255,240,0)'); c.fillStyle = gg; circ(c, x, y, 9); c.fill(); c.fillStyle = ['#CFFFF3', '#E8D9FF', '#FFF6C8'][i % 3]; circ(c, x, y, 1.6); c.fill(); } }
    if (kq >= 0.5) for (const [sx, sy, s] of H.shrubs) { if (!hit([sx - 30, sy - 20, sx + 30, sy + 10], bb)) continue; const y = sy - lift(lvAt(sx, sy)); c.fillStyle = 'rgba(30,70,30,.18)'; ell(c, sx, y, 24 * s, 9 * s); c.fill(); }
  }
  /* ---- the chunk painter ---- */
  function paintChunk(cx, cy, kq, S) {
    const res = kq * S, cv = mk(Math.round(CH * res), Math.round(CH * res)), c = cv.getContext('2d'), H = L();
    c.scale(res, res); c.translate(-cx * CH, -cy * CH);
    const bb = [cx * CH - 8, cy * CH - 8, (cx + 1) * CH + 8, (cy + 1) * CH + 8];
    // 1. valley-floor grass with a cooler tone towards the north and the orchard's own tint
    grassFill(c, bb[0], bb[1], bb[2], bb[3], P.grass, kq, 1);
    const gN = c.createLinearGradient(0, 0, 0, H.H); gN.addColorStop(0, 'rgba(60,120,90,.16)'); gN.addColorStop(1, 'rgba(120,150,60,.12)'); c.fillStyle = gN; c.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
    if (H.orchard.length && hit([180, 920, 880, 1440], bb)) { c.fillStyle = 'rgba(150,200,90,.22)'; ell(c, 300, 1150, 150, 260); c.fill(); ell(c, 790, 1220, 110, 190); c.fill(); }
    // the hidden garden: a soft clearing
    if (hit([200, 700, 460, 940], bb)) { const g = c.createRadialGradient(330, 820, 10, 330, 820, 120); g.addColorStop(0, 'rgba(230,240,170,.32)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; ell(c, 330, 820, 120, 95); c.fill(); }
    // 2. the farm's beds, the river, the dock, the bridges
    drawFarm(c, bb); drawRiver(c, bb);
    // 3. level-0 paving: the plaza and every path (paths climb to their terrace by per-vertex lift)
    drawPlaza(c, bb); H.paths.forEach((p, i) => { if (lvAt(p.pts[0][0], p.pts[0][1]) === 0 && lvAt(p.pts[p.pts.length - 1][0], p.pts[p.pts.length - 1][1]) === 0) drawPath(c, i, bb, kq); });
    drawDock(c, bb); for (const B of H.bridges) drawBridge(c, B, bb);
    // 4. terraces (low to high) with their faces and tops, then the paths that run on them, then the stairs
    const TS = H.terraces.slice().sort((a, b) => a.lv - b.lv); for (const T of TS) drawTerrace(c, T, bb, kq);
    H.paths.forEach((p, i) => { if (lvAt(p.pts[0][0], p.pts[0][1]) !== 0 || lvAt(p.pts[p.pts.length - 1][0], p.pts[p.pts.length - 1][1]) !== 0) drawPath(c, i, bb, kq); });
    for (const T of TS) for (const r of (T.ramps || [])) drawRamp(c, T, r, bb);
    // 5. ground dressing
    drawExtras(c, bb, kq);
    return cv;
  }
  const chunks = new Map(); let chunkPx = 0; const CHUNK_BUDGET = 24e6;   // ~96 MB of RGBA at most (a phone screen at k=1, dpr 2 needs 6-9 chunks of 1 Mpx)
  /* the cache zoom: k snapped so a chunk is a whole number of device pixels (re-snapped when k drifts by > 5% or the
     backing scale changes), so cached chunks and sprites blit 1:1 on integer device pixels — the cheap path on every
     renderer (a scaled or sub-pixel blit resamples and costs 10-20x in software rasterisers) */
  let cacheK = 0, cacheS = 0;
  const resOf = c => Math.min(3, Math.max(1, (c.getTransform ? c.getTransform().a : 1) || 1));
  function cacheZoom(k, S) { if (!cacheK || cacheS !== S || Math.abs(k - cacheK) / cacheK > 0.05) { cacheK = Math.max(1, Math.round(CH * k * S)) / (CH * S); cacheS = S; } return cacheK; }
  const zoomOf = (c, k) => { const S = resOf(c); return { kc: cacheZoom(k, S), S }; };
  function getChunk(cx, cy, kq, S, budget) {
    const key = cx + ',' + cy + ',' + kq.toFixed(3) + ',' + S; let e = chunks.get(key);
    if (e) { e.at = frameNo; return e.cv; }
    if (budget.n <= 0) return null; budget.n--;
    const t0 = performance.now(), cv = paintChunk(cx, cy, kq, S); stats.paints++; stats.lastPaint = performance.now() - t0;
    chunks.set(key, { cv, at: frameNo }); chunkPx += cv.width * cv.height;
    while (chunkPx > CHUNK_BUDGET && chunks.size > 1) { let oldK = null, old = 1e18; for (const [k2, v] of chunks) if (v.at < old && k2 !== key) { old = v.at; oldK = k2; } if (!oldK) break; const v = chunks.get(oldK); chunkPx -= v.cv.width * v.cv.height; chunks.delete(oldK); }
    return cv;
  }
  let frameNo = 0; const stats = { paints: 0, lastPaint: 0, blit: 0, live: 0 };
  /* a seamless caustic tile: a soft web of light rings, rendered once at 2 px per world px */
  let causticCv = null, causticRes = 0; const CT = 96;
  function caustic(res) { if (causticCv && causticRes === res) return causticCv; causticRes = res; const px = Math.max(1, Math.round(CT * res)); const cv = mk(px, px), c = cv.getContext('2d'); c.scale(px / CT, px / CT); c.lineCap = 'round'; const R = rng(11); for (let i = 0; i < 26; i++) { const x = R() * CT, y = R() * CT, r = 5 + R() * 9, rx = r * (0.8 + R() * 0.5), ry = r * (0.55 + R() * 0.5), rot = R() * 3; for (const [dx, dy] of [[0, 0], [CT, 0], [-CT, 0], [0, CT], [0, -CT], [CT, CT], [-CT, -CT], [CT, -CT], [-CT, CT]]) { c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 3; ell(c, x + dx, y + dy, rx, ry, rot); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.1; ell(c, x + dx, y + dy, rx, ry, rot); c.stroke(); } } causticCv = cv; return cv; }
  /* the river band as a screen-space clip (the bridges' decks and the dock's pier cut out) */
  function riverClip(c, sx, sy) { const R = L().river, pts = R.pts, hw = R.w / 2, left = [], right = []; for (let i = 0; i < pts.length; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(pts.length - 1, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * hw, ny = dx / l * hw; left.push([pts[i][0] + nx, pts[i][1] + ny]); right.push([pts[i][0] - nx, pts[i][1] - ny]); } c.beginPath(); riverCurveOpen(c, left, sx, sy); riverCurveOpen(c, right.reverse(), sx, sy, true); c.closePath(); for (const B of L().bridges) c.rect(sx(B.x - 4), sy(B.y), B.w * (sx(1) - sx(0)) + 8 * (sx(1) - sx(0)), B.h * (sx(1) - sx(0))); const D = L().dock; if (D) { const n = riverNear(D.x + D.w / 2, D.y), top = Math.min(D.y - 20, n.y + 4), kk = sx(1) - sx(0); c.rect(sx(D.x + 5), sy(top), 58 * kk, (D.y - top + 6) * kk); } c.clip('evenodd'); }
  function riverCurveOpen(c, pts, sx, sy, cont) { cont ? c.lineTo(sx(pts[0][0]), sy(pts[0][1])) : c.moveTo(sx(pts[0][0]), sy(pts[0][1])); for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; c.quadraticCurveTo(sx(pts[i][0]), sy(pts[i][1]), sx(mx), sy(my)); } c.lineTo(sx(pts[pts.length - 1][0]), sy(pts[pts.length - 1][1])); }
  /* live water over the cache: caustic webs scrolled at two speeds, breathing reflection bands, flow lines, drifting
     specular glints, pet ripples, the fountain's rings and splash rings, the sanctuary runes' pulse, the garden's breath */
  function liveWater(c, cam, k, W, H, t) {
    const R = L().river, pts = R.pts; const sx = wx => (wx - cam.x) * k + W / 2, sy = wy => (wy - cam.y) * k + H / 2;
    const x0 = cam.x - W / 2 / k - 60, x1 = cam.x + W / 2 / k + 60, y0 = cam.y - H / 2 / k - 60, y1 = cam.y + H / 2 / k + 60;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    const rb = pts.length ? bboxOf(pts) : null;
    if (rb && !(rb[3] + R.w < y0 || rb[1] - R.w > y1)) {
      c.save(); riverClip(c, sx, sy);
      const rx0 = Math.max(0, sx(rb[0])), ry0 = Math.max(0, sy(rb[1] - R.w)), rx1 = Math.min(W, sx(rb[2])), ry1 = Math.min(H, sy(rb[3] + R.w));
      // caustics: two scrolled layers of the tile, world-locked
      const S = resOf(c), tile = caustic(k * S), tpx = tile.width / S; for (const [vx, vy, a] of [[22, 3, 0.16], [-11, 1.5, 0.11]]) { const pat = c.createPattern(tile, 'repeat'); if (pat.setTransform) { const m = new DOMMatrix(); pat.setTransform(m.translate(Math.round((sx(0) + (t * vx % CT) * k) * S) / S, Math.round((sy(0) + (t * vy % CT) * k) * S) / S).scale(tpx / tile.width)); c.fillStyle = pat; c.globalAlpha = a; c.fillRect(rx0, ry0, rx1 - rx0, ry1 - ry0); } }
      c.globalAlpha = 1;
      // breathing reflection bands
      for (const [o, ph, lw] of [[0.1, 0, 0.22], [-0.3, 2.1, 0.14], [0.34, 4, 0.12]]) { const a = 0.07 + 0.06 * Math.sin(t * 0.45 + ph); c.strokeStyle = `rgba(230,245,255,${a.toFixed(3)})`; c.lineWidth = R.w * lw * k; c.beginPath(); let on = false; for (let i = 0; i < pts.length; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(pts.length - 1, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, px = pts[i][0] - dy / l * o * R.w, py = pts[i][1] + dx / l * o * R.w + Math.sin(t * 0.6 + i) * 3; if (px < x0 - 300 || px > x1 + 300) { on = false; continue; } on ? c.lineTo(sx(px), sy(py)) : c.moveTo(sx(px), sy(py)); on = true; } c.stroke(); }
      // flow lines sliding downstream
      for (const [o, sp, a, lw] of [[0, 46, 0.3, 2.2], [-0.26, 34, 0.22, 1.6], [0.28, 40, 0.22, 1.6]]) { c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = lw * k; c.setLineDash([22 * k, 30 * k, 9 * k, 40 * k]); c.lineDashOffset = -t * sp * k + o * 300; c.beginPath(); let on = false; for (let i = 0; i < pts.length; i++) { const nx = i < pts.length - 1 ? pts[i + 1][0] - pts[i][0] : pts[i][0] - pts[i - 1][0], ny = i < pts.length - 1 ? pts[i + 1][1] - pts[i][1] : pts[i][1] - pts[i - 1][1], l = Math.hypot(nx, ny), px = pts[i][0] - ny / l * o * R.w, py = pts[i][1] + nx / l * o * R.w; if (px < x0 - 300 || px > x1 + 300) { on = false; continue; } on ? c.lineTo(sx(px), sy(py)) : c.moveTo(sx(px), sy(py)); on = true; } c.stroke(); }
      c.setLineDash([]);
      // specular glints that drift downstream and twinkle
      c.fillStyle = '#FFFFFF'; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; if (Math.max(ax, bx) < x0 || Math.min(ax, bx) > x1) continue; const len = Math.hypot(bx - ax, by - ay), tx = (bx - ax) / len, ty = (by - ay) / len; for (let s = 10; s < len; s += 24) { const h = hash(i, s, 140), u = ((s + t * 14 * (0.6 + h)) % len) / len, o = (h - 0.5) * R.w * 0.7, px = lerp(ax, bx, u) - ty * o, py = lerp(ay, by, u) + tx * o; const tw = Math.sin(t * (2 + h * 3) + h * 40); if (tw < 0.5) continue; const a = (tw - 0.5) / 0.5; c.globalAlpha = a * 0.9; const X = sx(px), Y = sy(py), r = (1 + a * 1.8) * k; c.beginPath(); c.moveTo(X - r * 2.2, Y); c.lineTo(X, Y - r * 0.6); c.lineTo(X + r * 2.2, Y); c.lineTo(X, Y + r * 0.6); c.closePath(); c.fill(); } }
      c.globalAlpha = 1; c.restore();
    }
    // ripples (pets in the shallows, water pets near the stream, splash rings in the basin)
    for (const r of rings) { const u = r.t / r.dur, X = sx(r.x), Y = sy(r.y); if (X < -60 || X > W + 60 || Y < -60 || Y > H + 60) continue; c.strokeStyle = `rgba(255,255,255,${((1 - u) * 0.6).toFixed(3)})`; c.lineWidth = (1.6 - u) * k; c.beginPath(); c.ellipse(X, Y, (3 + u * r.r) * k, (1.5 + u * r.r * 0.5) * k, 0, 0, TAU); c.stroke(); }
    // the fountain basin: slow concentric rings and a drifting highlight
    for (const p of L().props) if (p.kind === 'fountain') { const X = sx(p.x), Y = sy(p.y - 16); if (X < -80 || X > W + 80 || Y < -80 || Y > H + 80) continue; for (let i = 0; i < 4; i++) { const u = ((t * 0.45 + i / 4) % 1); c.strokeStyle = `rgba(255,255,255,${((1 - u) * 0.45).toFixed(3)})`; c.lineWidth = 1.2 * k; c.beginPath(); c.ellipse(X, Y, (5 + u * 40) * k, (2.5 + u * 20) * k, 0, 0, TAU); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(X - 10 * k + Math.sin(t * 0.7) * 6 * k, Y - 6 * k, 12 * k, 3 * k, -0.3, 0, TAU); c.fill(); }
    // the sanctuary runes' pulse and the hidden garden's breathing glow
    { const cx = 1300, cy = 440 - lift(2); if (sx(cx) > -300 && sx(cx) < W + 300 && sy(cy) > -200 && sy(cy) < H + 200) { const a = 0.18 + 0.16 * Math.sin(t * 1.1); c.save(); c.translate(sx(cx), sy(cy)); c.scale(k, k); c.globalCompositeOperation = 'lighter'; runes(c, 0, 0, `rgba(190,150,255,${a.toFixed(3)})`, 3.2); runes(c, 0, 0, `rgba(240,225,255,${(a * 0.9).toFixed(3)})`, 1.2); c.restore(); } }
    { const X = sx(330), Y = sy(820); if (X > -200 && X < W + 200 && Y > -200 && Y < H + 200) { const a = 0.1 + 0.08 * Math.sin(t * 0.8), r = 110 * k, g = c.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, `rgba(150,255,235,${a.toFixed(3)})`); g.addColorStop(1, 'rgba(150,255,235,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(X, Y, r, r * 0.8, 0, 0, TAU); c.fill(); } }
    c.restore();
  }
  function paintGround(c, cam, k, W, H, t) {
    frameNo++; const t0 = performance.now(); const S = resOf(c), kc = cacheZoom(k, S), szDev = Math.round(CH * kc * S), sz = szDev / S;
    const x0 = cam.x - W / 2 / k, y0 = cam.y - H / 2 / k, x1 = cam.x + W / 2 / k, y1 = cam.y + H / 2 / k;
    const c0 = Math.floor(x0 / CH), c1 = Math.floor(x1 / CH), r0 = Math.floor(y0 / CH), r1 = Math.floor(y1 / CH), budget = { n: paintAll ? 1e9 : 2 };
    const ox = Math.round(((c0 * CH - cam.x) * kc + W / 2) * S) / S, oy = Math.round(((r0 * CH - cam.y) * kc + H / 2) * S) / S;
    c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'low';
    for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) {
      const X = ox + (cx - c0) * sz, Y = oy + (cy - r0) * sz;
      if (cx < -1 || cy < -1 || cx * CH > L().W + CH || cy * CH > L().H + CH) { c.fillStyle = '#3F7A48'; c.fillRect(X, Y, sz, sz); continue; }
      const cv = getChunk(cx, cy, kc, S, budget);
      if (cv) c.drawImage(cv, X, Y, sz, sz); else { c.fillStyle = P.grass; c.fillRect(X, Y, sz, sz); }
    }
    c.restore(); stats.blit = performance.now() - t0;
    const t1 = performance.now(); liveWater(c, cam, k, W, H, t); stats.live = performance.now() - t1;
  }
  let paintAll = false;
  /* paint every chunk the view (plus a margin) needs right now; the core may call it at start so the first frames do
     not stutter. all = the whole map (the harness overview). */
  function prewarm(c, cam, k, W, H, all) { const prev = paintAll; paintAll = true; if (all) { const S = resOf(c), kc = cacheZoom(k, S); for (let cy = 0; cy * CH < L().H; cy++) for (let cx = 0; cx * CH < L().W; cx++) getChunk(cx, cy, kc, S, { n: 1e9 }); } else paintGround(c, cam, k, W + 2 * CH * k, H + 2 * CH * k, 0); paintAll = prev; }
  /* =====================================================================================================================
     ENTITIES: trees, shrubs, rocks, reeds, flower clumps — cached sprites, crown separate from trunk
     ===================================================================================================================== */
  const sprites = new Map(); let spritePx = 0;
  function sprite(key, w, h, ax, ay, Z, painter) {
    const res = Z.kc * Z.S, k2 = key + '|' + res.toFixed(4); let s = sprites.get(k2); if (s) return s;
    const cv = mk(w * res, h * res), c = cv.getContext('2d'); c.scale(res, res); c.translate(ax, ay); painter(c);
    s = { cv, ax, ay, kc: Z.kc, S: Z.S, w, h }; sprites.set(k2, s); spritePx += cv.width * cv.height;
    if (spritePx > 16e6) { const it = sprites.keys(); for (let i = 0; i < 20; i++) { const kk = it.next().value; if (kk === undefined) break; const v = sprites.get(kk); spritePx -= v.cv.width * v.cv.height; sprites.delete(kk); } }
    return s;
  }
  const blit = (c, s, X, Y, k, alpha) => { const S = s.S, x = Math.round((X - s.ax * s.kc) * S) / S, y = Math.round((Y - s.ay * s.kc) * S) / S, w = s.cv.width / S, h = s.cv.height / S; if (alpha != null && alpha < 1) { c.globalAlpha = alpha; c.drawImage(s.cv, x, y, w, h); c.globalAlpha = 1; } else c.drawImage(s.cv, x, y, w, h); };
  /* a cel-shaded blob: three bands (dark base, mid, light cap) inside a circle, plus the ink outline */
  function blob(c, x, y, r, pal, lw, noInk) {
    c.save(); circ(c, x, y, r); c.clip(); c.fillStyle = pal[0]; c.fillRect(x - r, y - r, r * 2, r * 2); c.fillStyle = pal[1]; circ(c, x - r * 0.16, y - r * 0.2, r * 0.98); c.fill(); c.fillStyle = pal[2]; circ(c, x - r * 0.3, y - r * 0.36, r * 0.74); c.fill(); c.fillStyle = pal[3]; circ(c, x - r * 0.42, y - r * 0.5, r * 0.36); c.fill(); c.restore();
    if (!noInk) { circ(c, x, y, r); ink(c, lw); }
  }
  /* leafy flecks over a crown: short arcs in the light and the dark tone */
  function flecks(c, blobs, pal, seed, n) { c.lineWidth = 1.3; for (let i = 0; i < n; i++) { const b = blobs[i % blobs.length], a = hash(seed, i, 150) * TAU, rr0 = Math.sqrt(hash(seed, i, 151)) * b[2] * 0.85, x = b[0] + Math.cos(a) * rr0, y = b[1] + Math.sin(a) * rr0, up = y < b[1] - b[2] * 0.1; c.strokeStyle = up ? rgba('#FFFFFF', 0.35) : rgba('#000000', 0.22); c.beginPath(); c.arc(x, y, 2.2 + hash(seed, i, 152) * 2, Math.PI * 1.05, Math.PI * 1.75); c.stroke(); } }
  function softShadow(c, x, y, rx, ry, a) { const g = c.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, `rgba(20,30,20,${a})`); g.addColorStop(0.65, `rgba(20,30,20,${a * 0.6})`); g.addColorStop(1, 'rgba(20,30,20,0)'); c.fillStyle = g; ell(c, x, y, rx, ry); c.fill(); }
  function trunk(c, x, y, h, w, seed, pal) {
    pal = pal || [P.bark, P.barkD]; c.fillStyle = pal[0]; c.beginPath(); c.moveTo(x - w * 0.95, y); c.quadraticCurveTo(x - w * 0.6, y - h * 0.5, x - w * 0.55, y - h); c.lineTo(x + w * 0.55, y - h); c.quadraticCurveTo(x + w * 0.65, y - h * 0.5, x + w * 1.05, y); c.quadraticCurveTo(x, y + w * 0.5, x - w * 0.95, y); c.closePath(); c.fill(); c.save(); c.clip(); c.fillStyle = pal[1]; c.beginPath(); c.moveTo(x + w * 0.1, y - h); c.lineTo(x + w * 0.6, y - h); c.quadraticCurveTo(x + w * 0.7, y - h * 0.5, x + w * 1.1, y + 2); c.lineTo(x + w * 0.15, y + 2); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1.1; for (let i = 0; i < 4; i++) { const u = -0.6 + i * 0.4; c.beginPath(); c.moveTo(x + u * w, y - 3); c.quadraticCurveTo(x + u * w * 0.9 + (hash(seed, i, 160) - 0.5) * 3, y - h * 0.5, x + u * w * 0.8, y - h * 0.9); c.stroke(); } c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x - w * 0.6, y - h, w * 0.3, h); c.restore(); c.beginPath(); c.moveTo(x - w * 0.95, y); c.quadraticCurveTo(x - w * 0.6, y - h * 0.5, x - w * 0.55, y - h); c.lineTo(x + w * 0.55, y - h); c.quadraticCurveTo(x + w * 0.65, y - h * 0.5, x + w * 1.05, y); ink(c, 1.8);
    // roots
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - w * 0.95, y); c.quadraticCurveTo(x - w * 1.3, y + 1, x - w * 1.6, y + 3); c.moveTo(x + w * 1.05, y); c.quadraticCurveTo(x + w * 1.4, y + 1, x + w * 1.7, y + 3); c.stroke();
  }
  /* crowns: each painter draws with the crown's anchor (the trunk top) at (0, 0); returns nothing, the sprite box is given */
  const CROWNS = {
    oak(c, s, seed) { const B = [[-22, -16, 24], [22, -18, 24], [-30, -40, 20], [30, -42, 20], [0, -34, 30], [-10, -62, 24], [14, -64, 22], [0, -82, 18]].map(b => [b[0] * s, b[1] * s, b[2] * s]); B.forEach(b => blob(c, b[0], b[1], b[2], P.oak, 1.9)); flecks(c, B, P.oak, seed, 46); },
    apple(c, s, seed) { const B = [[-16, -14, 19], [16, -14, 19], [0, -30, 24], [-12, -46, 16], [12, -46, 16], [0, -58, 13]].map(b => [b[0] * s, b[1] * s, b[2] * s]); B.forEach(b => blob(c, b[0], b[1], b[2], P.apple, 1.7)); flecks(c, B, P.apple, seed, 24); for (let i = 0; i < 9; i++) { const b = B[i % B.length], a = hash(seed, i, 170) * TAU, x = b[0] + Math.cos(a) * b[2] * 0.6, y = b[1] + Math.sin(a) * b[2] * 0.6; c.fillStyle = '#E8554E'; circ(c, x, y, 3.2 * s); c.fill(); circ(c, x, y, 3.2 * s); ink(c, 1.1); c.fillStyle = 'rgba(255,255,255,.6)'; circ(c, x - 1 * s, y - 1 * s, 1 * s); c.fill(); } },
    cherry(c, s, seed) { const B = [[-26, -14, 20], [24, -16, 22], [-34, -36, 17], [32, -38, 18], [-2, -30, 26], [-14, -56, 20], [14, -58, 19], [0, -76, 15]].map(b => [b[0] * s, b[1] * s, b[2] * s]);
      // branches peeking between the clusters
      c.strokeStyle = P.barkD; c.lineWidth = 3 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-20 * s, -34 * s); c.moveTo(0, 0); c.lineTo(22 * s, -36 * s); c.moveTo(0, 0); c.lineTo(2 * s, -50 * s); c.stroke();
      B.forEach(b => blob(c, b[0], b[1], b[2], P.cherry, 1.7)); flecks(c, B, P.cherry, seed, 40); for (let i = 0; i < 26; i++) { const b = B[i % B.length], a = hash(seed, i, 180) * TAU, r = Math.sqrt(hash(seed, i, 181)) * b[2] * 0.8, x = b[0] + Math.cos(a) * r, y = b[1] + Math.sin(a) * r; c.fillStyle = hash(seed, i, 182) < 0.5 ? '#FFF1F6' : '#FFC7DD'; for (let p = 0; p < 5; p++) { const pa = p / 5 * TAU; ell(c, x + Math.cos(pa) * 1.6 * s, y + Math.sin(pa) * 1.6 * s, 1.3 * s, 0.9 * s, pa); c.fill(); } c.fillStyle = '#F2B13C'; circ(c, x, y, 0.7 * s); c.fill(); } },
    pine(c, s, seed) { const tiers = [[0, 42, 34], [-28, 35, 32], [-54, 27, 30], [-78, 18, 28]];
      for (const [y0, hw0, h0] of tiers) { const yb = y0 * s, hw = hw0 * s, h = h0 * s, yt = yb - h, n = 5;
        c.beginPath(); c.moveTo(0, yt); c.lineTo(hw, yb); for (let j = 0; j < n; j++) { const xa = hw - 2 * hw * j / n, xb = hw - 2 * hw * (j + 1) / n; c.quadraticCurveTo((xa + xb) / 2, yb + 5 * s, xb, yb); } c.closePath();
        c.fillStyle = P.pine[1]; c.fill(); c.save(); c.clip();
        c.fillStyle = P.pine[0]; c.beginPath(); c.moveTo(1 * s, yt); c.lineTo(hw + 4 * s, yb + 8 * s); c.lineTo(1 * s, yb + 8 * s); c.closePath(); c.fill();
        c.fillStyle = P.pine[2]; c.beginPath(); c.moveTo(-1 * s, yt + 3 * s); c.lineTo(-hw * 0.74, yb - 1 * s); c.lineTo(-hw * 0.22, yb - 1 * s); c.closePath(); c.fill();
        c.fillStyle = P.pine[3]; c.beginPath(); c.moveTo(-1 * s, yt + 6 * s); c.lineTo(-hw * 0.46, yb - 7 * s); c.lineTo(-hw * 0.14, yb - 4 * s); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1.1; for (let j = -3; j <= 3; j++) { c.beginPath(); c.moveTo(j * 1.5 * s, yt + 4 * s); c.lineTo(j * hw * 0.3, yb - 2 * s); c.stroke(); }
        c.restore(); ink(c, 1.8); }
      c.fillStyle = '#5A3A22'; c.fillRect(-1.5 * s, -108 * s, 3 * s, 5 * s); },
    willow(c, s, seed) { const B = [[-26, -44, 24], [26, -46, 24], [0, -62, 30], [-12, -82, 18], [14, -82, 17]].map(b => [b[0] * s, b[1] * s, b[2] * s]); B.forEach(b => blob(c, b[0], b[1], b[2], P.willow, 1.8)); flecks(c, B, P.willow, seed, 30); },
    willowStrands(c, s, seed) { c.lineCap = 'round';
      // the curtain: a scalloped mass of the darker green hanging from the crown, inked along its hem
      const hem = []; for (let i = 0; i <= 12; i++) { const u = i / 12, x = (-50 + u * 100) * s, y = (-46 + Math.sin(u * Math.PI) * 54 + hash(seed, i, 195) * 8) * s; hem.push([x, y]); }
      c.beginPath(); c.moveTo(-50 * s, -50 * s); hem.forEach((p, i) => { if (!i) c.lineTo(p[0], p[1]); else c.quadraticCurveTo((hem[i - 1][0] + p[0]) / 2, p[1] + 6 * s, p[0], p[1]); }); c.lineTo(50 * s, -50 * s); c.closePath(); c.fillStyle = P.willow[0]; c.fill(); ink(c, 1.8);
      // light strands over the curtain, a few inked
      for (let i = 0; i < 30; i++) { const u = i / 29, x = (-48 + u * 96) * s, top = (-50 - Math.sin(u * Math.PI) * 10) * s, len = (26 + hash(seed, i, 190) * 16 + Math.sin(u * Math.PI) * 44) * s, sw = (hash(seed, i, 191) - 0.5) * 10 * s; c.strokeStyle = [P.willow[1], P.willow[2], P.willow[3]][i % 3]; c.lineWidth = 2.2 * s; c.beginPath(); c.moveTo(x, top); c.quadraticCurveTo(x + sw, top + len * 0.55, x + sw * 0.7, top + len); c.stroke(); if (i % 4 === 1) { c.strokeStyle = 'rgba(43,36,51,.45)'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x + 1.4 * s, top); c.quadraticCurveTo(x + sw + 1.4 * s, top + len * 0.55, x + sw * 0.7 + 1.4 * s, top + len); c.stroke(); }
        c.fillStyle = i % 3 === 2 ? P.willow[2] : P.willow[3]; for (let j = 1; j < 4; j++) { const v = j / 4, qx = x + sw * (2 * v - v * v) * 0.9, qy = top + len * v; ell(c, qx - 1.5 * s, qy, 2.2 * s, 1 * s, 0.8); c.fill(); ell(c, qx + 1.5 * s, qy + 1.4 * s, 2.2 * s, 1 * s, -0.8); c.fill(); } } },
  };
  const BOX = { oak: [64, 110, 30], apple: [46, 78, 22], cherry: [62, 100, 28], pine: [48, 112, 0], willow: [56, 106, 32] };   // crown half-width, height above trunk top, trunk height
  function crownSprite(kind, s, seed, res) { const [hw, h] = BOX[kind], W2 = Math.ceil(hw * 2 * s + 16), H2 = Math.ceil(h * s + 30); return sprite('crown:' + kind + ':' + s.toFixed(2) + ':' + (seed % 4), W2, H2, W2 / 2, H2 - 16, res, c => CROWNS[kind](c, s, seed)); }
  function strandSprite(s, seed, res) { const W2 = Math.ceil(124 * s), H2 = Math.ceil(140 * s); return sprite('strands:' + s.toFixed(2) + ':' + (seed % 4), W2, H2, W2 / 2, H2 * 0.55, res, c => CROWNS.willowStrands(c, s, seed)); }
  function baseSprite(kind, s, seed, res) { const [hw, , th] = BOX[kind], W2 = Math.ceil(hw * 2.4 * s + 20), H2 = Math.ceil(th * s + 40); return sprite('base:' + kind + ':' + s.toFixed(2) + ':' + (seed % 4), W2, H2, W2 / 2, H2 - 20, res, c => { softShadow(c, 4 * s, 3, hw * 1.1 * s, hw * 0.42 * s, 0.34); if (th) trunk(c, 0, 0, th * s, 7 * s, seed); else { c.fillStyle = P.barkD; c.fillRect(-4 * s, -8 * s, 8 * s, 9 * s); c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(-4 * s, -8 * s, 8 * s, 9 * s); } }); }
  function shrubSprite(s, seed, res) { const W2 = Math.ceil(70 * s), H2 = Math.ceil(50 * s); return sprite('shrub:' + s.toFixed(2) + ':' + (seed % 3), W2, H2, W2 / 2, H2 - 8, res, c => { softShadow(c, 2, 2, 28 * s, 10 * s, 0.3); const B = [[-14, -10, 14], [14, -11, 14], [0, -18, 17], [-6, -26, 10], [8, -27, 10]].map(b => [b[0] * s, b[1] * s, b[2] * s]); B.forEach(b => blob(c, b[0], b[1], b[2], P.oak, 1.6)); flecks(c, B, P.oak, seed, 14); for (let i = 0; i < 6; i++) { const b = B[i % B.length], a = hash(seed, i, 200) * TAU, x = b[0] + Math.cos(a) * b[2] * 0.6, y = b[1] + Math.sin(a) * b[2] * 0.6; c.fillStyle = ['#FF9BD2', '#FFE37A', '#FFFFFF'][(seed + i) % 3]; circ(c, x, y, 2 * s); c.fill(); } }); }
  function rockSprite(s, seed, res) { const W2 = Math.ceil(64 * s), H2 = Math.ceil(44 * s); return sprite('rock:' + s.toFixed(2) + ':' + (seed % 3), W2, H2, W2 / 2, H2 - 8, res, c => { softShadow(c, 3 * s, 2, 26 * s, 9 * s, 0.32); const pts = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = (0.8 + hash(seed, i, 210) * 0.3) * 22 * s; pts.push([Math.cos(a) * r, -10 * s + Math.sin(a) * r * 0.62]); } poly(c, pts); c.fillStyle = '#8A8F8E'; c.fill(); c.save(); c.clip(); c.fillStyle = '#6A6F70'; poly(c, pts.map(p => [p[0] + 5 * s, p[1] + 6 * s])); c.fill(); c.fillStyle = '#A9AEAC'; poly(c, pts.map(p => [p[0] * 0.7 - 4 * s, p[1] * 0.7 - 6 * s])); c.fill(); c.fillStyle = '#CBCFCB'; poly(c, pts.map(p => [p[0] * 0.38 - 7 * s, p[1] * 0.38 - 10 * s])); c.fill(); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-6 * s, -4 * s); c.lineTo(4 * s, -14 * s); c.moveTo(8 * s, -2 * s); c.lineTo(14 * s, -9 * s); c.stroke(); c.fillStyle = rgba(P.moss, 0.7); ell(c, -8 * s, -2 * s, 9 * s, 3.5 * s); c.fill(); ell(c, 10 * s, -16 * s, 5 * s, 2.5 * s, 0.4); c.fill(); grain(c, -32 * s, -36 * s, 64 * s, 44 * s, 0.35); c.restore(); poly(c, pts); ink(c, 1.8); }); }
  function reedSprite(s, seed, res) { const W2 = Math.ceil(40 * s), H2 = Math.ceil(56 * s); return sprite('reed:' + s.toFixed(2) + ':' + (seed % 3), W2, H2, W2 / 2, H2 - 6, res, c => { c.lineCap = 'round'; for (let i = 0; i < 7; i++) { const x = (-12 + i * 4 + (hash(seed, i, 220) - 0.5) * 3) * s, h = (26 + hash(seed, i, 221) * 20) * s, lean = (hash(seed, i, 222) - 0.5) * 12 * s; c.strokeStyle = i % 2 ? '#5FA04C' : '#86BF5E'; c.lineWidth = 2 * s; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + lean * 0.3, -h * 0.6, x + lean, -h); c.stroke(); if (hash(seed, i, 223) < 0.55) { c.fillStyle = '#7A4A2A'; ell(c, x + lean, -h + 3 * s, 2 * s, 6 * s, lean * 0.02); c.fill(); ell(c, x + lean, -h + 3 * s, 2 * s, 6 * s, lean * 0.02); ink(c, 0.9); } } c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 0.8; for (let i = 0; i < 7; i++) { const x = (-12 + i * 4 + (hash(seed, i, 220) - 0.5) * 3) * s, h = (26 + hash(seed, i, 221) * 20) * s, lean = (hash(seed, i, 222) - 0.5) * 12 * s; c.beginPath(); c.moveTo(x + 0.8 * s, 0); c.quadraticCurveTo(x + lean * 0.3 + 0.8 * s, -h * 0.6, x + lean + 0.8 * s, -h); c.stroke(); } }); }
  function clumpSprite(s, seed, res) { const W2 = Math.ceil(36 * s), H2 = Math.ceil(30 * s); return sprite('clump:' + s.toFixed(2) + ':' + (seed % 4), W2, H2, W2 / 2, H2 - 4, res, c => { c.fillStyle = 'rgba(30,70,30,.25)'; ell(c, 0, 0, 14 * s, 4 * s); c.fill(); for (let i = 0; i < 6; i++) { const x = (-12 + i * 5) * s, h = (10 + hash(seed, i, 230) * 10) * s; c.strokeStyle = '#4C9A48'; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 2 * s, -h * 0.5, x + (hash(seed, i, 231) - 0.5) * 6 * s, -h); c.stroke(); const fx = x + (hash(seed, i, 231) - 0.5) * 6 * s, fy = -h; c.fillStyle = ['#FF6F59', '#FF9BD2', '#FFE37A', '#FFFFFF', '#B983F5'][(seed + i) % 5]; for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; ell(c, fx + Math.cos(a) * 2.2 * s, fy + Math.sin(a) * 2.2 * s, 1.8 * s, 1.2 * s, a); c.fill(); } c.fillStyle = '#F2B13C'; circ(c, fx, fy, 1 * s); c.fill(); } }); }
  const SWAY = { oak: 2.2, apple: 1.8, cherry: 2.8, pine: 1.2, willow: 3.4 };
  let entList = null, cherries = [];
  function makeTree(x, y, kind, size, seed) {
    kind = CROWNS[kind] ? kind : 'oak'; const s = size || 1, lv = lvAt(x, y), [hw, h, th] = BOX[kind];
    const e = { x, y, w: 22 * s, d: 16 * s, top: (h + th) * s, lv, kind: 'tree', tree: kind, size: s, seed,
      draw(c, X, Y, k, t, o) {
        const res = zoomOf(c, k), fade = o && o.fade != null ? o.fade : 1, wind = windNow;
        blit(c, baseSprite(kind, s, seed, res), X, Y, k);
        const ph = t * 0.9 + x * 0.013 + y * 0.007, sw = (Math.sin(ph) * 0.7 + Math.sin(ph * 2.3 + 1) * 0.3) * SWAY[kind] * s * (0.5 + wind), ty = Y - th * s * k;
        blit(c, crownSprite(kind, s, seed, res), X + sw * k, ty + Math.abs(sw) * 0.15 * k, k, fade);
        if (kind === 'willow') blit(c, strandSprite(s, seed, res), X + (sw * 1.4 + wind * 3) * k, ty, k, fade);
      } };
    if (kind === 'cherry') cherries.push(e); return e;
  }
  function buildEntities() {
    const H = L(), out = []; cherries = []; let seed = 1;
    for (const [x, y, kind, size] of H.trees) out.push(makeTree(x, y, kind, size, seed++));
    for (const [x, y] of H.orchard) out.push(makeTree(x, y, 'apple', 0.9 + hash(x, y, 240) * 0.2, seed++));
    for (const [x, y, s] of H.shrubs) { const sd = seed++; out.push({ x, y, w: 34 * s, d: 18 * s, top: 36 * s, lv: lvAt(x, y), kind: 'shrub', draw(c, X, Y, k, t, o) { blit(c, shrubSprite(s, sd, zoomOf(c, k)), X, Y, k, o && o.fade != null ? o.fade : 1); } }); }
    for (const [x, y, s] of H.rocks) { const sd = seed++; out.push({ x, y, w: 36 * s, d: 20 * s, top: 34 * s, lv: lvAt(x, y), kind: 'rock', draw(c, X, Y, k, t, o) { blit(c, rockSprite(s, sd, zoomOf(c, k)), X, Y, k); } }); }
    // reeds along both banks (non-blocking), skipping the bridges and the dock
    const pts = H.river.pts, w = H.river.w; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], len = Math.hypot(bx - ax, by - ay), tx = (bx - ax) / len, ty = (by - ay) / len; for (let s = 20; s < len; s += 48) for (const sgn of [-1, 1]) { if (hash(i, s + sgn, 250) < 0.5) continue; const u = s / len, o = w / 2 + 2 + hash(i, s, 251) * 10, x = lerp(ax, bx, u) - ty * sgn * o, y = lerp(ay, by, u) + tx * sgn * o; if (H.bridges.some(B => x > B.x - 24 && x < B.x + B.w + 24 && y > B.y - 10 && y < B.y + B.h + 10)) continue; if (H.dock && x > H.dock.x - 20 && x < H.dock.x + H.dock.w + 20 && y > H.dock.y - 90) continue; const sz = 0.8 + hash(i, s, 252) * 0.5, sd = seed++; out.push({ x, y, w: 0, d: 0, top: 50 * sz, lv: 0, kind: 'reeds', draw(c, X, Y, k, t) { const sw = Math.sin(t * 1.6 + x * 0.02) * 2 * (0.4 + windNow); c.save(); c.translate(X, Y); c.transform(1, 0, sw * 0.04, 1, 0, 0); blit(c, reedSprite(sz, sd, zoomOf(c, k)), 0, 0, k); c.restore(); } }); } }
    // standing flower clumps beside some of the ground patches
    for (const f of flowers()) { if (hash(f.x, f.y, 260) < 0.6) continue; const sz = 0.8 + hash(f.x, f.y, 261) * 0.4, sd = seed++, x = f.x + 10, y = f.y + 6; out.push({ x, y, w: 0, d: 0, top: 26 * sz, lv: f.lv, kind: 'flowers', draw(c, X, Y, k, t) { blit(c, clumpSprite(sz, sd, zoomOf(c, k)), X, Y, k); } }); }
    return out;
  }
  function entities() { if (!entList) entList = buildEntities(); return entList; }
  /* =====================================================================================================================
     AMBIENCE
     ===================================================================================================================== */
  const petals = [], flies = [], puffs = [], steam = [], drops = [], rings = [], embers = [], motes = []; let pets = [], windNow = 0.5, windVec = { x: 0.5, y: 0 };
  const flutter = { phase: 0, amp: 0.5 };
  let emitAcc = 0, smokeAcc = 0, steamAcc = 0, dropAcc = 0, ringAcc = 0;
  const CHIMNEYS = [[800, 380], [1560, 1300], [2040, 1280]];
  function hearths() { const H = L(), out = CHIMNEYS.map(([x, y]) => ({ x, y: y - lift(lvAt(x, y)), kind: 'chimney' })); for (const p of H.props) if (p.kind === 'cookpot') out.push({ x: p.x, y: p.y - 26 - lift(lvAt(p.x, p.y)), kind: 'pot' }); return out; }
  function update(dt, cam, k, W, H, t, wind) {
    dt = Math.min(0.05, dt || 0.016);
    if (typeof wind === 'number') { windNow = clamp(wind, 0, 1); windVec = { x: windNow, y: 0 }; } else if (wind && typeof wind.x === 'number') { windVec = wind; windNow = clamp(Math.hypot(wind.x, wind.y), 0, 1); } else { windNow = 0.45 + Math.sin(t * 0.23) * 0.2 + Math.sin(t * 0.71) * 0.1; windVec = { x: windNow, y: 0 }; }
    flutter.phase = t * 5.5; flutter.amp = 0.35 + windNow * 0.65;
    const vx0 = cam.x - W / 2 / k - 120, vx1 = cam.x + W / 2 / k + 120, vy0 = cam.y - H / 2 / k - 200, vy1 = cam.y + H / 2 / k + 120, inView = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
    // petals from cherry trees in view
    entities(); emitAcc += dt; if (emitAcc > 0.16) { emitAcc = 0; for (const e of cherries) { const gy = e.y - lift(e.lv); if (!inView(e.x, gy) || Math.random() > 0.35 + windNow * 0.4 || petals.length > 70) continue; const a = Math.random() * TAU, r = Math.random() * 40 * e.size; petals.push({ x: e.x + Math.cos(a) * r, y: gy - (70 + Math.sin(a) * 30) * e.size, g: gy + 4 + Math.random() * 12, vx: 8 + Math.random() * 10, vy: 14 + Math.random() * 10, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 6, ph: Math.random() * TAU, t: 0, life: 7, col: Math.random() < 0.7 ? '#FFC7DD' : '#FFF1F6', s: 2.4 + Math.random() * 1.4 }); } }
    for (let i = petals.length - 1; i >= 0; i--) { const p = petals[i]; p.t += dt; if (p.y < p.g) { p.x += (p.vx * (0.3 + windNow) + Math.sin(p.t * 3 + p.ph) * 12 + windVec.x * 20) * dt; p.y += (p.vy + Math.cos(p.t * 2.2 + p.ph) * 6) * dt; p.rot += p.vr * dt; for (const q of pets) if (q.el === 'wind') { const dx = p.x - q.x, dy = p.y - (q.y - lift(q.lv || 0)), d = Math.hypot(dx, dy); if (d < 90) { const f = (1 - d / 90) * 90 * dt; p.x += (-dy / (d + 1)) * f + dx / (d + 1) * f * 0.3; p.y -= f * 0.6; p.rot += 4 * dt; } } } else { p.y = p.g; p.rest = (p.rest || 0) + dt; } if (p.t > p.life || (p.rest || 0) > 2.5 || !inView(p.x, p.y)) petals.splice(i, 1); }
    // butterflies: 2–5, each anchored to a flower spot in view
    const spotsIn = flowers().filter(f => inView(f.x, f.y - lift(f.lv))); const want = spotsIn.length ? clamp(2 + Math.floor(spotsIn.length / 4), 2, 5) : 0;
    for (let i = flies.length - 1; i >= 0; i--) { const f = flies[i]; f.t += dt; const gy = f.a.y - lift(f.a.lv); f.x = f.a.x + Math.sin(f.t * 0.9 + f.ph) * 34 + Math.sin(f.t * 2.3) * 8; f.y = gy - 18 - Math.abs(Math.sin(f.t * 1.4 + f.ph)) * 20 + Math.sin(f.t * 5) * 3; if (!inView(f.x, f.y) || f.t > f.life) flies.splice(i, 1); }
    while (flies.length < want) { const a = spotsIn[Math.floor(Math.random() * spotsIn.length)]; flies.push({ a, x: a.x, y: a.y, t: Math.random() * 10, ph: Math.random() * TAU, life: 14 + Math.random() * 10, col: ['#FFE37A', '#8FD3F4', '#FFFFFF', '#FF9BD2'][Math.floor(Math.random() * 4)], s: 1.1 + Math.random() * 0.4 }); }
    if (flies.length > want) flies.length = want;
    // chimney smoke and the cookpot's steam
    const HS = hearths(); smokeAcc += dt; steamAcc += dt; const fireNear = h => pets.some(q => q.el === 'fire' && Math.hypot(q.x - h.x, q.y - lift(q.lv || 0) - h.y) < 170);
    if (smokeAcc > 0.34) { smokeAcc = 0; for (const h of HS) { if (h.kind !== 'chimney' || !inView(h.x, h.y) || puffs.length > 48) continue; const hot = fireNear(h); puffs.push({ x: h.x + (Math.random() - 0.5) * 4, y: h.y, r: 4 + Math.random() * 2, t: 0, life: hot ? 3.2 : 4.2, vx: 4 + Math.random() * 4, vy: -(16 + Math.random() * 8) * (hot ? 1.4 : 1), ph: Math.random() * TAU, hot }); if (hot && embers.length < 30) embers.push({ x: h.x, y: h.y, vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 30, t: 0, life: 0.9 + Math.random() * 0.6 }); } }
    if (steamAcc > 0.22) { steamAcc = 0; for (const h of HS) { if (h.kind !== 'pot' || !inView(h.x, h.y) || steam.length > 24) continue; steam.push({ x: h.x + (Math.random() - 0.5) * 12, y: h.y, r: 3 + Math.random() * 2, t: 0, life: 1.6 + Math.random() * 0.6, vx: 2, vy: -22 - Math.random() * 10, ph: Math.random() * TAU }); if (fireNear(h) && embers.length < 30) embers.push({ x: h.x, y: h.y + 10, vx: (Math.random() - 0.5) * 24, vy: -30 - Math.random() * 20, t: 0, life: 0.8 }); } }
    for (const A of [puffs, steam]) for (let i = A.length - 1; i >= 0; i--) { const p = A[i]; p.t += dt; p.x += (p.vx + windVec.x * 26 + Math.sin(p.t * 1.7 + p.ph) * 6) * dt; p.y += p.vy * dt; p.vy *= (1 - 0.35 * dt); p.r += (A === puffs ? 7 : 9) * dt; if (p.t > p.life) A.splice(i, 1); }
    for (let i = embers.length - 1; i >= 0; i--) { const e = embers[i]; e.t += dt; e.x += (e.vx + windVec.x * 20) * dt; e.y += e.vy * dt; e.vy += 30 * dt; if (e.t > e.life) embers.splice(i, 1); }
    // the fountain's splash
    dropAcc += dt; const F = L().props.find(p => p.kind === 'fountain'); if (F && inView(F.x, F.y) && dropAcc > 0.05) { dropAcc = 0; if (drops.length < 46) for (let n = 0; n < 2; n++) { const a = Math.random() * TAU, sp = 26 + Math.random() * 22; drops.push({ x: F.x + (Math.random() - 0.5) * 6, y: F.y - 96, z: 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.45, vz: 58 + Math.random() * 26, t: 0, floor: F.y - 16 }); } }
    for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.t += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; d.vz -= 190 * dt; if (d.y - d.z > d.floor + Math.abs(d.x - F.x) * 0.3 || d.t > 2) { if (rings.length < 40 && Math.random() < 0.5) rings.push({ x: d.x, y: d.floor + Math.abs(d.x - F.x) * 0.3, t: 0, dur: 0.8, r: 10 }); drops.splice(i, 1); } }
    // sparkle motes drifting over the sanctuary and the lookout
    for (let i = motes.length - 1; i >= 0; i--) { const m = motes[i]; m.t += dt; m.x += (Math.sin(m.t * 0.8 + m.ph) * 6 + windVec.x * 4) * dt; m.y -= (4 + Math.sin(m.t * 1.3 + m.ph) * 2) * dt; if (m.t > m.life || !inView(m.x, m.y)) motes.splice(i, 1); }
    if (motes.length < 26) for (const T of L().terraces) { if (T.lv < 2) continue; const b = bboxOf(T.poly), x = b[0] + Math.random() * (b[2] - b[0]), y = b[1] + Math.random() * (b[3] - b[1]); if (!inPoly(T.poly, x, y)) continue; const gy = y - lift(T.lv); if (!inView(x, gy)) continue; motes.push({ x, y: gy - 8 - Math.random() * 30, t: 0, life: 4 + Math.random() * 4, ph: Math.random() * TAU, col: T.id === 'lookout' ? '#FFF2B0' : '#D9C8FF', s: 1 + Math.random() }); }
    // ripples from pets in the shallows and water pets near the stream
    ringAcc += dt; if (ringAcc > 0.3) { ringAcc = 0; for (const q of pets) { const n = riverNear(q.x, q.y), half = L().river.w / 2; if (n.d < half + 14 && rings.length < 24) rings.push({ x: q.x, y: q.y, t: 0, dur: 1.4, r: 22 }); else if (q.el === 'water' && n.d < 90 && rings.length < 24) rings.push({ x: n.x + (Math.random() - 0.5) * 30, y: n.y + (Math.random() - 0.5) * 20, t: 0, dur: 1.8, r: 30 }); } }
    for (let i = rings.length - 1; i >= 0; i--) { rings[i].t += dt; if (rings[i].t > rings[i].dur) rings.splice(i, 1); }
  }
  function drawOver(c, cam, k, W, H, t) {
    const sx = wx => (wx - cam.x) * k + W / 2, sy = wy => (wy - cam.y) * k + H / 2;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // hearth glow for fire pets (additive, pulsing)
    for (const q of pets) if (q.el === 'fire') { let best = null, bd = 170; for (const h of hearths()) { const d = Math.hypot(q.x - h.x, q.y - lift(q.lv || 0) - h.y); if (d < bd) { bd = d; best = h; } } if (best) { const X = sx(best.x), Y = sy(best.y) + (best.kind === 'pot' ? 10 : 6) * k, r = (28 + Math.sin(t * 6) * 4) * k, g = c.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, 'rgba(255,170,60,.5)'); g.addColorStop(0.5, 'rgba(255,110,40,.22)'); g.addColorStop(1, 'rgba(255,90,30,0)'); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(X - r, Y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; } }
    for (const e of embers) { const u = e.t / e.life; c.fillStyle = `rgba(255,${Math.round(190 - u * 120)},60,${1 - u})`; circ(c, sx(e.x), sy(e.y), (1.6 - u) * k); c.fill(); }
    // smoke: two-tone puffs
    for (const A of [puffs, steam]) for (const p of A) { const u = p.t / p.life, a = (A === puffs ? 0.42 : 0.5) * (u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85), X = sx(p.x), Y = sy(p.y), r = p.r * k; if (X < -40 || X > W + 40 || Y < -40) continue; c.fillStyle = A === puffs ? (p.hot ? `rgba(190,180,185,${a})` : `rgba(205,205,215,${a})`) : `rgba(245,248,255,${a})`; circ(c, X, Y, r); c.fill(); circ(c, X - r * 0.55, Y + r * 0.1, r * 0.72); c.fill(); circ(c, X + r * 0.5, Y - r * 0.05, r * 0.66); c.fill(); c.fillStyle = `rgba(255,255,255,${a * 0.55})`; circ(c, X - r * 0.25, Y - r * 0.35, r * 0.5); c.fill(); c.fillStyle = `rgba(60,55,80,${a * 0.25})`; ell(c, X + r * 0.2, Y + r * 0.45, r * 0.7, r * 0.35); c.fill(); }
    // fountain droplets
    c.fillStyle = 'rgba(235,248,255,.85)'; for (const d of drops) { const X = sx(d.x), Y = sy(d.y - d.z); c.beginPath(); c.ellipse(X, Y, 1.5 * k, (1.5 + Math.abs(d.vz) * 0.02) * k, 0, 0, TAU); c.fill(); }
    if (drops.length) { c.fillStyle = 'rgba(255,255,255,.35)'; for (const d of drops) if (d.z < 8) circ(c, sx(d.x), sy(d.floor + 4), 1.2 * k), c.fill(); }
    // motes: four-point sparkles that twinkle
    for (const m of motes) { const u = m.t / m.life, a = Math.sin(u * Math.PI) * (0.55 + 0.45 * Math.sin(m.t * 5 + m.ph)), X = sx(m.x), Y = sy(m.y), r = m.s * k * (1 + 0.3 * Math.sin(m.t * 5 + m.ph)); if (a <= 0.03) continue; c.globalAlpha = a; c.fillStyle = m.col; c.beginPath(); c.moveTo(X - r * 2.4, Y); c.lineTo(X, Y - r * 0.8); c.lineTo(X + r * 2.4, Y); c.lineTo(X, Y + r * 0.8); c.closePath(); c.fill(); c.beginPath(); c.moveTo(X, Y - r * 2.4); c.lineTo(X + r * 0.8, Y); c.lineTo(X, Y + r * 2.4); c.lineTo(X - r * 0.8, Y); c.closePath(); c.fill(); }
    c.globalAlpha = 1;
    // petals
    for (const p of petals) { const X = sx(p.x), Y = sy(p.y), a = p.rest ? 1 - p.rest / 2.5 : 1; if (X < -10 || X > W + 10 || Y < -10 || Y > H + 10) continue; c.globalAlpha = a; c.fillStyle = p.col; c.save(); c.translate(X, Y); c.rotate(p.rot); c.beginPath(); c.ellipse(0, 0, p.s * k, p.s * 0.6 * k, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(230,120,170,.5)'; c.beginPath(); c.ellipse(p.s * 0.3 * k, 0, p.s * 0.35 * k, p.s * 0.25 * k, 0, 0, TAU); c.fill(); c.restore(); }
    c.globalAlpha = 1;
    // butterflies: two wings scaled by the flap, a dark body, a shadow dot on the ground
    for (const f of flies) { const X = sx(f.x), Y = sy(f.y), fl = Math.abs(Math.sin(f.t * 16 + f.ph)) * 0.85 + 0.15, s = f.s * k; c.fillStyle = 'rgba(20,30,20,.18)'; ell(c, X, sy(f.a.y - lift(f.a.lv)) + 2 * k, 3 * s, 1.2 * s); c.fill(); c.save(); c.translate(X, Y); c.rotate(Math.sin(f.t * 0.9 + f.ph) * 0.3); for (const sgn of [-1, 1]) { c.save(); c.scale(sgn * fl, 1); c.fillStyle = f.col; c.beginPath(); c.ellipse(4.2 * s, -1.5 * s, 4.4 * s, 3.2 * s, -0.4, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke(); c.beginPath(); c.ellipse(3.4 * s, 2.4 * s, 3 * s, 2.2 * s, 0.4, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(0,0,0,.18)'; circ(c, 5 * s, -1.6 * s, 1.1 * s); c.fill(); c.restore(); } c.fillStyle = INK; ell(c, 0, 0, 1 * s, 3.4 * s); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, -3 * s); c.lineTo(-2 * s, -6 * s); c.moveTo(0, -3 * s); c.lineTo(2 * s, -6 * s); c.stroke(); c.restore(); }
    c.restore();
  }
  function setPets(list) { pets = Array.isArray(list) ? list : []; }
  /* ---- the pet-visibility fade helper: does an entity's body (footprint up to its top) cover the screen point of the
     player while standing in front of them? ease(cur, target, dt) steps the fade over 0.25 s. ---- */
  function occludes(e, X, Y, k, px, py, petBaseY) { if (petBaseY != null && Y <= petBaseY) return false; const hw = Math.max(18, (e.w || 20) * 0.8) * k; return px > X - hw && px < X + hw && py < Y && py > Y - (e.top || 60) * k; }
  const ease = (cur, target, dt) => { const sp = dt / 0.25; return cur < target ? Math.min(target, cur + sp) : Math.max(target, cur - sp); };
  return { paintGround, entities, update, drawOver, setPets, lift, prewarm, lvAt, occludes, ease, flutter, stats, CH, layout: L, get wind() { return windNow; }, riverNear, _reset() { chunks.clear(); chunkPx = 0; cacheK = 0; sprites.clear(); spritePx = 0; entList = null; pathCache.clear(); flowerSpots = null; } };
})();
globalThis.HubLand = HubLand;
