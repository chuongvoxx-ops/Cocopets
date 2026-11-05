/* ---------- Cocopets Town: the building and prop kit (HubGeo) ----------
   Every building and prop of the hub is a small cel-shaded 3D model built from GeoKit solids (blocks, prisms, hipped
   roofs, lathes) with materials in three lit bands, ink outlines and face painters that draw tile rows, planks, stone
   courses, plaster, windows with frames and shutters, doors in their recesses, in each face's own frame. The static
   picture of a model is painted once per kind and zoom into an offscreen canvas and blitted; only the living bits
   (lantern glow, sign swing, banner cloth, crystals, rings) are drawn every frame.
   Units: 1 model unit = 10 world px; z is up; the model's baseline (its feet, the south edge of its footprint) is y = 0,
   the footprint runs north to y = -d. The camera is GeoKit's (0.62 rad above the horizon), so d world px of footprint
   are d / sin(0.62) true units deep. Contract: see docs/HUB-BRIEF.md (HubGeo.make / draw / shadow / kinds). */
const HubGeo = (() => {
  const TAU = Math.PI * 2, U = 10, EL = 0.62, SE = Math.sin(EL), CE = Math.cos(EL), DY = 1 / SE;
  const GK = () => (typeof GeoKit !== 'undefined' ? GeoKit : globalThis.GeoKit);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u;
  /* ---- colour ---- */
  const hex = h => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const toHex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const sh = (h, k) => { const [r, g, b] = hex(h); return k >= 0 ? toHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k) : toHex(r * (1 + k), g * (1 + k), b * (1 + k)); };
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${clamp(a, 0, 1)})`; };
  const rnd = seed => { let a = (seed * 2654435761) >>> 0 || 7; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // a material: three cel tones round a base colour (shadow, base, light)
  const mat = (base, o) => Object.assign({ c: [sh(base, -0.34), base, sh(base, 0.16)], base }, o || {});
  // a decal's colour under the light its face gets
  const tone = (col, band) => band === 2 ? col : band === 1 ? sh(col, -0.1) : sh(col, -0.3);
  const INK = '#2B1A22', INK_A = 0.85;
  /* the palette: warm timber, cream plaster, mossy stone, tiled roofs */
  const C = { timber: '#7A5236', timberD: '#54351F', timberL: '#B07E4E', plaster: '#F4E8D4', cream: '#FBF3E2', stone: '#A09D92', stoneM: '#8E9A84', stoneD: '#6E6B63', slate: '#5B6A86', tile: '#C96443', tileM: '#7D9A5A', thatch: '#CDAA5E', copper: '#5E9C80', iron: '#3F3C44', brass: '#D1A24B', glass: '#BFE0EE', glassD: '#6E9FBC', soil: '#6B4A32', soilW: '#4A3222', leaf: '#5FA64E', leafD: '#3E7A36', pink: '#F08AA8', red: '#D9483B', gold: '#F2C14E', pearl: '#F2EAF4', rose: '#E7A5A0', water: '#7FC4E0', vermilion: '#D8452E', paper: '#FFF4DC' };
  const M = { timber: mat(C.timber), timberD: mat(C.timberD), timberL: mat(C.timberL), plaster: mat(C.plaster), cream: mat(C.cream), stone: mat(C.stone), stoneM: mat(C.stoneM), stoneD: mat(C.stoneD), slate: mat(C.slate), tile: mat(C.tile), tileM: mat(C.tileM), thatch: mat(C.thatch), copper: mat(C.copper), iron: mat(C.iron), brass: mat(C.brass, { gloss: 1 }), soil: mat(C.soil), leaf: mat(C.leaf), paper: mat(C.paper), pearl: mat(C.pearl, { gloss: 1 }), rose: mat(C.rose, { gloss: 1 }) };

  /* ---- meshes beyond GeoKit's: extrusions, hipped roofs, lathes, boxes on slopes. All convex ---- */
  // a profile of (a, z) pushed along the other ground axis: extX takes (y, z) along x, extY takes (x, z) along y
  function extX(prof, x0, x1) { const G = GK(), n = prof.length, v = prof.map(([y, z]) => [x0, y, z]).concat(prof.map(([y, z]) => [x1, y, z])), f = [prof.map((_, i) => i), prof.map((_, i) => n + i)]; for (let i = 0; i < n; i++) { const j = (i + 1) % n; f.push([i, j, n + j, n + i]); } return G.mesh(v, f); }
  function extY(prof, y0, y1) { const G = GK(), n = prof.length, v = prof.map(([x, z]) => [x, y0, z]).concat(prof.map(([x, z]) => [x, y1, z])), f = [prof.map((_, i) => i), prof.map((_, i) => n + i)]; for (let i = 0; i < n; i++) { const j = (i + 1) % n; f.push([i, j, n + j, n + i]); } return G.mesh(v, f); }
  // a hipped roof: a w0 x d0 rectangle at z = 0 rising to a w1 x d1 top at z = h (a ridge when d1 is 0, a point when both are)
  function hipMesh(w0, d0, w1, d1, h) {
    const G = GK(), v = [[-w0 / 2, -d0 / 2, 0], [w0 / 2, -d0 / 2, 0], [w0 / 2, d0 / 2, 0], [-w0 / 2, d0 / 2, 0]], f = [[0, 1, 2, 3]];
    if (w1 > 0.01 && d1 > 0.01) { v.push([-w1 / 2, -d1 / 2, h], [w1 / 2, -d1 / 2, h], [w1 / 2, d1 / 2, h], [-w1 / 2, d1 / 2, h]); f.push([4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]); }
    else if (w1 > 0.01) { v.push([-w1 / 2, 0, h], [w1 / 2, 0, h]); f.push([0, 1, 5, 4], [1, 2, 5], [2, 3, 4, 5], [3, 0, 4]); }
    else if (d1 > 0.01) { v.push([0, -d1 / 2, h], [0, d1 / 2, h]); f.push([0, 1, 4], [1, 2, 5, 4], [2, 3, 5], [3, 0, 4, 5]); }
    else { v.push([0, 0, h]); f.push([0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]); }
    return G.mesh(v, f);
  }
  // a lathe of rings [[r, z], ...] (radii that make a convex shape), n sides; closed top and bottom
  function lathe(rings, n, a0) {
    const G = GK(), v = [], f = []; a0 = a0 || 0;
    rings.forEach(([r, z]) => { for (let i = 0; i < n; i++) { const a = i / n * TAU + a0; v.push([Math.cos(a) * r, Math.sin(a) * r, z]); } });
    const m = rings.length; f.push(Array.from({ length: n }, (_, i) => i)); f.push(Array.from({ length: n }, (_, i) => (m - 1) * n + i));
    for (let k = 0; k < m - 1; k++) for (let i = 0; i < n; i++) { const j = (i + 1) % n; f.push([k * n + i, k * n + j, (k + 1) * n + j, (k + 1) * n + i]); }
    return G.mesh(v, f);
  }
  const cylMesh = (r0, r1, h, n, a0) => lathe([[r0, 0], [r1, h]], n, a0);
  // a box whose bottom follows a roof slope (a chimney, a dormer): x0..x1 across, y0..y1 along the slope, top at zt, bottom zb(y)
  const slopeBox = (x0, x1, y0, y1, zt, zb) => extX([[y0, zb(y0)], [y0, zt], [y1, zt], [y1, zb(y1)]], x0, x1);
  const rx = a => GK().rx(a), ry = a => GK().ry(a), rz = a => GK().rz(a);
  const faceDir = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };

  /* ---- the scene: parts (solids), flats (2D painters in the depth order), live painters, lights ---- */
  function scene() {
    const S = { parts: [], live: [], lights: [], glowAt: [] };
    S.add = (Mh, xf, o) => { S.parts.push({ M: Mh, xf: xf || {}, o: o || {} }); return S; };
    // a box: footprint centre (cx, cy), bottom z0, size w x dd x h (true units), material mt; o.R turns it about its centre
    S.box = (cx, cy, z0, w, dd, h, mt, o) => { o = o || {}; const t = [cx, cy, z0 + h / 2]; if (o.R && o.piv) { const G = GK(), p = o.piv, q = G.add(p, G.mv(o.R, G.sub(t, p))); t[0] = q[0]; t[1] = q[1]; t[2] = q[2]; } return S.add(GK().block(w / 2, dd / 2, h / 2), { t, R: o.R }, Object.assign({ mats: [mt] }, o)); };
    S.cyl = (cx, cy, z0, r0, r1, h, n, mt, o) => S.add(cylMesh(r0, r1, h, n, o && o.a0), { t: [cx, cy, z0], R: o && o.R }, Object.assign({ mats: [mt] }, o || {}));
    S.lathe = (cx, cy, z0, rings, n, mt, o) => S.add(lathe(rings, n, o && o.a0), { t: [cx, cy, z0], R: o && o.R }, Object.assign({ mats: [mt] }, o || {}));
    S.pyr = (cx, cy, z0, hx, hy, h, mt, o) => S.add(GK().pyramid(4, 1, h, { a0: Math.PI / 4, sx: hx * Math.SQRT2, sy: hy * Math.SQRT2 }), { t: [cx, cy, z0], R: o && o.R }, Object.assign({ mats: [mt] }, o || {}));
    S.hip = (cx, cy, z0, w0, d0, w1, d1, h, mt, o) => S.add(hipMesh(w0, d0, w1, d1, h), { t: [cx, cy, z0], R: o && o.R }, Object.assign({ mats: [mt] }, o || {}));
    S.flat = (dep, fn) => { S.parts.push({ flat: fn, dep }); return S; };
    S.liveAdd = fn => { S.live.push(fn); return S; };
    S.light = (x, y, z, r, col) => { S.lights.push([x, y, z, r, col || '#FFD27A']); return S; };
    // a roof with the look of thickness: a darker copy a little lower (its eave band shows under the real roof), then the roof
    S.thick = (Mh, xf, mt, th, o) => { const G = GK(), d = Object.assign({}, xf, { t: G.add(xf.t || [0, 0, 0], [0, 0, -th]) }); S.add(Mh, d, { mats: [mat(sh(mt.base, -0.42))], inner: false, ink: INK, lw: 0.1 }); return S.add(Mh, xf, Object.assign({ mats: [mt] }, o || {})); };
    return S;
  }
  // which way a face looks, in the part's own frame: T top, B bottom, S E N W the walls, a leading s for a slope
  function sideOf(n, R) { const G = GK(); let l = n; if (R) l = [R[0] * n[0] + R[3] * n[1] + R[6] * n[2], R[1] * n[0] + R[4] * n[1] + R[7] * n[2], R[2] * n[0] + R[5] * n[1] + R[8] * n[2]]; if (l[2] > 0.86) return 'T'; if (l[2] < -0.86) return 'B'; const s = l[2] > 0.2 ? 's' : ''; return s + (Math.abs(l[1]) >= Math.abs(l[0]) ? (l[1] > 0 ? 'S' : 'N') : (l[0] > 0 ? 'E' : 'W')); }
  // the face's frame made canvas-like: x to the right on the screen, y down it; returns the face's bounds in it
  function fs(c, fr) {
    let m = c.getTransform(), x0 = fr.u0, x1 = fr.u1, y0 = fr.v0, y1 = fr.v1;
    if (Math.abs(m.a) < Math.abs(m.c)) { c.transform(0, 1, 1, 0, 0, 0); x0 = fr.v0; x1 = fr.v1; y0 = fr.u0; y1 = fr.u1; m = c.getTransform(); }
    const fx = m.a < 0 ? -1 : 1, fy = m.d < 0 ? -1 : 1;
    if (fx < 0 || fy < 0) c.transform(fx, 0, 0, fy, fx < 0 ? x0 + x1 : 0, fy < 0 ? y0 + y1 : 0);
    return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  let PX = 0.1;   // one device pixel in model units while a sprite is being painted

  /* ---- face painters: all in face units, x right, y down ---- */
  const rr = (c, x, y, w, h, r) => { if (!(w > 0) || !(h > 0)) { c.beginPath(); c.rect(x, y, Math.max(0, w), Math.max(0, h)); return; } r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const ink = (c, w, a) => { c.strokeStyle = rgba(INK, a == null ? INK_A : a); c.lineWidth = Math.max(PX * 1.1, w || 0.08); c.stroke(); };
  function plaster(c, F, band, seed) {
    const R = rnd(seed || 5), n = Math.min(900, F.w * F.h * 1.4);
    for (let i = 0; i < n; i++) { c.fillStyle = R() < 0.55 ? `rgba(90,60,40,${0.04 + R() * 0.06})` : `rgba(255,255,255,${0.05 + R() * 0.08})`; c.fillRect(F.x0 + R() * F.w, F.y0 + R() * F.h, 0.1 + R() * 0.25, 0.1 + R() * 0.25); }
    for (let i = 0; i < 2 + F.w * 0.12; i++) { let x = F.x0 + R() * F.w, y = F.y0 + F.h * (0.55 + R() * 0.4), a = -1.2 - R() * 0.8; c.strokeStyle = 'rgba(70,45,30,.28)'; c.lineWidth = Math.max(PX, 0.05); c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { a += (R() - 0.5) * 1.1; x += Math.cos(a) * 0.5; y += Math.sin(a) * 0.5; c.lineTo(x, y); } c.stroke(); }
    const g = c.createLinearGradient(0, F.y1 - 1.8, 0, F.y1); g.addColorStop(0, 'rgba(70,50,30,0)'); g.addColorStop(1, 'rgba(70,50,30,.2)'); c.fillStyle = g; c.fillRect(F.x0, F.y1 - 1.8, F.w, 1.8);
  }
  // horizontal boards (o.v: vertical), with grain, seams and nail heads
  function planks(c, F, band, col, o) {
    o = o || {}; const bh = o.bh || 1.1, R = rnd(o.seed || 11), vert = !!o.v, L = vert ? F.w : F.h, n = Math.ceil(L / bh);
    for (let i = 0; i < n; i++) { const p0 = (vert ? F.x0 : F.y0) + i * bh, k = (R() - 0.5) * 0.12; c.fillStyle = tone(sh(col, k), band); if (vert) c.fillRect(p0, F.y0, bh + 0.02, F.h); else c.fillRect(F.x0, p0, F.w, bh + 0.02);
      c.strokeStyle = rgba(sh(col, -0.3), 0.35); c.lineWidth = Math.max(PX, 0.05); for (let g = 0; g < 2; g++) { const q = p0 + bh * (0.25 + R() * 0.5); c.beginPath(); if (vert) { c.moveTo(q, F.y0); c.lineTo(q + (R() - 0.5) * 0.3, F.y1); } else { c.moveTo(F.x0, q); c.lineTo(F.x1, q + (R() - 0.5) * 0.3); } c.stroke(); }
      c.strokeStyle = rgba(INK, 0.55); c.lineWidth = Math.max(PX, 0.07); c.beginPath(); if (vert) { c.moveTo(p0, F.y0); c.lineTo(p0, F.y1); } else { c.moveTo(F.x0, p0); c.lineTo(F.x1, p0); } c.stroke();
      if (o.nails !== false) { c.fillStyle = rgba(INK, 0.55); const ps = vert ? [F.y0 + 0.5, F.y1 - 0.5] : [F.x0 + 0.5, F.x1 - 0.5]; for (const q of ps) { c.beginPath(); if (vert) c.arc(p0 + bh / 2, q, 0.07, 0, TAU); else c.arc(q, p0 + bh / 2, 0.07, 0, TAU); c.fill(); } } }
  }
  // stone courses in running bond, each stone its own tint, mortar behind
  function stones(c, F, band, col, o) {
    o = o || {}; const ch = o.ch || 0.9, sw = o.sw || 1.6, R = rnd(o.seed || 17), g = o.gap || 0.08;
    c.fillStyle = tone(sh(col, -0.38), band); c.fillRect(F.x0, F.y0, F.w, F.h);
    for (let r = 0, y = F.y0; y < F.y1; r++, y += ch) { let x = F.x0 - (r % 2 ? sw * 0.5 : 0) - R() * 0.3; while (x < F.x1) { const w = sw * (0.7 + R() * 0.6), h = Math.min(ch, F.y1 - y), k = (R() - 0.5) * 0.16, moss = o.moss && R() < 0.22;
      c.fillStyle = tone(moss ? mix(sh(col, k), '#7FA062', 0.55) : sh(col, k), band); rr(c, x + g, y + g, w - g * 2, h - g * 2, 0.14); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = Math.max(PX, 0.05); c.beginPath(); c.moveTo(x + g + 0.1, y + h - g - 0.1); c.lineTo(x + g + 0.1, y + g + 0.1); c.lineTo(x + w - g - 0.1, y + g + 0.1); c.stroke();
      c.strokeStyle = rgba(INK, 0.3); c.beginPath(); c.moveTo(x + w - g - 0.1, y + g + 0.1); c.lineTo(x + w - g - 0.1, y + h - g - 0.1); c.lineTo(x + g + 0.1, y + h - g - 0.1); c.stroke(); x += w; } }
  }
  // rows of overlapping roof tiles from the ridge (y0) to the eave (y1): each row laps over the one above it
  function roofTiles(c, F, band, col, o) {
    o = o || {}; const rh = o.rh || 1.15, tw = o.tw || 1.3, lap = 0.3, R = rnd(o.seed || 23), rows = Math.ceil((F.h + lap) / (rh - lap)), flat = o.flat;
    c.fillStyle = tone(sh(col, -0.25), band); c.fillRect(F.x0, F.y0, F.w, F.h);
    for (let r = 0; r < rows; r++) { const y = F.y0 + r * (rh - lap) - 0.3, off = r % 2 ? tw / 2 : 0;
      // the shadow this row casts on the one above
      c.fillStyle = rgba(INK, 0.28); c.fillRect(F.x0 - 1, y - 0.16, F.w + 2, 0.24);
      for (let x = F.x0 - tw + off; x < F.x1 + tw; x += tw) { const k = (R() - 0.5) * 0.14; c.fillStyle = tone(sh(col, k), band); c.beginPath();
        if (flat) { rr(c, x + 0.03, y, tw - 0.06, rh, 0.1); } else { c.moveTo(x + 0.03, y); c.lineTo(x + tw - 0.03, y); c.lineTo(x + tw - 0.03, y + rh - tw * 0.42); c.arc(x + tw / 2, y + rh - tw * 0.42, tw / 2 - 0.03, 0, Math.PI); c.closePath(); }
        c.fill(); c.strokeStyle = rgba(INK, 0.5); c.lineWidth = Math.max(PX, 0.06); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(x + 0.2, y + 0.18); c.lineTo(x + tw - 0.3, y + 0.18); c.stroke(); } }
    if (o.ridge !== false) { c.fillStyle = tone(sh(col, -0.15), band); c.fillRect(F.x0 - 1, F.y0 - 0.1, F.w + 2, 0.5); c.strokeStyle = rgba(INK, 0.6); c.lineWidth = Math.max(PX, 0.07); c.beginPath(); c.moveTo(F.x0 - 1, F.y0 + 0.4); c.lineTo(F.x1 + 1, F.y0 + 0.4); c.stroke(); }
  }
  function thatch(c, F, band, col, o) { const R = rnd(31); c.fillStyle = tone(col, band); c.fillRect(F.x0, F.y0, F.w, F.h); for (let i = 0; i < F.w * F.h * 1.6; i++) { const x = F.x0 + R() * F.w, y = F.y0 + R() * F.h, L = 0.6 + R() * 1.4; c.strokeStyle = R() < 0.5 ? rgba(sh(col, -0.35), 0.5) : rgba('#FFF4C8', 0.3); c.lineWidth = Math.max(PX, 0.06); c.beginPath(); c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 0.3, y + L); c.stroke(); } const rows = Math.ceil(F.h / 1.6); for (let r = 1; r < rows; r++) { const y = F.y0 + r * 1.6; c.strokeStyle = rgba(INK, 0.35); c.lineWidth = 0.1; c.beginPath(); c.moveTo(F.x0, y); for (let x = F.x0; x <= F.x1 + 0.5; x += 0.5) c.lineTo(x, y + Math.sin(x * 3 + r) * 0.08); c.stroke(); } }
  function stripes(c, F, band, a, b, w) { w = w || 1.4; for (let x = F.x0 - w, i = 0; x < F.x1 + w; x += w, i++) { c.fillStyle = tone(i % 2 ? b : a, band); c.fillRect(x, F.y0 - 0.5, w + 0.02, F.h + 1); } }
  // an opening set into the wall: dark reveal, its lit jamb on the right, its shadowed lintel above
  function recess(c, x, y, w, h, band, dark, dep) { dep = dep || 0.22; c.fillStyle = tone(dark, Math.min(band, 1)); c.fillRect(x, y, w, h); c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x, y, w, dep); c.fillRect(x, y, dep, h); c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(x + w - dep, y + dep, dep, h - dep); }
  // a window: recess, pearly glass with a glint, frame and mullions, sill; o.shut colour for shutters, o.box for a flower box, o.arch for a round top
  function windowD(c, x, y, w, h, band, o) {
    o = o || {}; const fr = o.frame || C.timberL, fw = o.fw || 0.22;
    c.save(); if (o.arch) { c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); c.clip(); }
    recess(c, x, y, w, h, band, '#4A3A44', 0.18);
    const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, tone(C.glass, band)); g.addColorStop(0.45, tone(sh(C.glass, 0.25), band)); g.addColorStop(0.5, tone(C.glassD, band)); g.addColorStop(1, tone(sh(C.glassD, -0.2), band));
    c.fillStyle = g; c.fillRect(x + fw, y + fw, w - fw * 2, h - fw * 2);
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(PX, 0.1); c.beginPath(); c.moveTo(x + fw + 0.25, y + h * 0.55); c.lineTo(x + w * 0.5, y + fw + 0.25); c.moveTo(x + w * 0.45, y + h - fw - 0.3); c.lineTo(x + w - fw - 0.25, y + h * 0.45); c.stroke();
    if (o.lit) { c.fillStyle = rgba('#FFD98A', 0.55 * o.lit); c.fillRect(x + fw, y + fw, w - fw * 2, h - fw * 2); }
    c.fillStyle = tone(fr, band); c.fillRect(x + w / 2 - fw / 2, y, fw, h); c.fillRect(x, y + h * 0.45, w, fw * 0.8);
    c.restore();
    c.strokeStyle = tone(fr, band); c.lineWidth = fw; if (o.arch) { c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.stroke(); } else c.strokeRect(x, y, w, h);
    c.beginPath(); if (o.arch) { c.moveTo(x - fw / 2, y + h); c.lineTo(x - fw / 2, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2 + fw / 2, Math.PI, 0); c.lineTo(x + w + fw / 2, y + h); } else c.rect(x - fw / 2, y - fw / 2, w + fw, h + fw); ink(c, 0.07, 0.7);
    // the sill
    c.fillStyle = tone(sh(fr, 0.1), band); c.fillRect(x - 0.3, y + h, w + 0.6, 0.32); c.beginPath(); c.rect(x - 0.3, y + h, w + 0.6, 0.32); ink(c, 0.07, 0.7); c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x - 0.3, y + h + 0.32, w + 0.6, 0.12);
    if (o.shut) { for (const sx of [x - 0.95, x + w + 0.1]) { c.fillStyle = tone(o.shut, band); rr(c, sx, y - 0.05, 0.85, h + 0.1, 0.08); c.fill(); ink(c, 0.07); c.strokeStyle = rgba(sh(o.shut, -0.4), 0.8); c.lineWidth = 0.07; c.beginPath(); for (let k = 1; k < 5; k++) { c.moveTo(sx + 0.12, y + h * k / 5); c.lineTo(sx + 0.73, y + h * k / 5); } c.stroke(); } }
    if (o.box) { const bx = x - 0.4, by = y + h + 0.5, bw = w + 0.8, bh = 0.9, R = rnd(o.seed || 3), cols = ['#F26B8A', '#FFD54F', '#F49AC1', '#FF8A65', '#FFFFFF'];
      for (let i = 0; i < bw * 2.6; i++) { const fx = bx + 0.3 + R() * (bw - 0.6), fy = by - 0.1 - R() * 0.5; c.fillStyle = tone(C.leafD, band); c.beginPath(); c.ellipse(fx, fy + 0.2, 0.32, 0.2, R() * 2, 0, TAU); c.fill(); }
      for (let i = 0; i < bw * 2.2; i++) { const fx = bx + 0.3 + R() * (bw - 0.6), fy = by - 0.15 - R() * 0.55, col = cols[Math.floor(R() * cols.length)]; c.fillStyle = tone(col, band); c.beginPath(); c.arc(fx, fy, 0.2 + R() * 0.1, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(fx - 0.06, fy - 0.07, 0.07, 0, TAU); c.fill(); }
      c.fillStyle = tone(C.timber, band); rr(c, bx, by, bw, bh, 0.1); c.fill(); ink(c, 0.08); c.strokeStyle = rgba(C.timberD, 0.8); c.lineWidth = 0.06; c.beginPath(); c.moveTo(bx + 0.2, by + bh * 0.5); c.lineTo(bx + bw - 0.2, by + bh * 0.5); c.stroke(); }
  }
  // a door in its recess: planks, iron hinges and a ring handle, a stone step; o.arch, o.open (the leaf swung in), o.col
  function doorD(c, x, y, w, h, band, o) {
    o = o || {}; const col = o.col || C.timber;
    c.save(); c.beginPath(); if (o.arch) { c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); } else c.rect(x, y, w, h); c.closePath(); c.clip();
    recess(c, x, y, w, h, band, '#2E2228', 0.28);
    if (!o.open) { const F = { x0: x + 0.2, x1: x + w - 0.2, y0: y + 0.2, y1: y + h, w: w - 0.4, h: h - 0.2 }; planks(c, F, band, col, { v: true, bh: w / 3.2, nails: false, seed: 5 });
      c.fillStyle = tone(C.iron, band); for (const hy of [y + h * 0.25, y + h * 0.7]) { rr(c, x + 0.25, hy, w * 0.55, 0.26, 0.1); c.fill(); } c.beginPath(); c.arc(x + w * 0.72, y + h * 0.55, 0.26, 0, TAU); c.lineWidth = 0.1; c.strokeStyle = tone(C.brass, band); c.stroke();
    } else { c.fillStyle = 'rgba(20,10,14,.7)'; c.fillRect(x, y, w, h); if (o.inside) o.inside(c, x, y, w, h, band); }
    c.restore();
    c.beginPath(); if (o.arch) { c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); } else c.rect(x, y, w, h); c.strokeStyle = tone(o.frame || C.timberD, band); c.lineWidth = 0.26; c.stroke(); ink(c, 0.08);
    if (o.step !== false) { c.fillStyle = tone(C.stone, band); c.fillRect(x - 0.4, y + h - 0.02, w + 0.8, 0.55); c.beginPath(); c.rect(x - 0.4, y + h - 0.02, w + 0.8, 0.55); ink(c, 0.07, 0.7); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x - 0.4, y + h, w + 0.8, 0.1); }
  }
  // the timber frame of a half-timbered wall: corner posts, a mid rail, braces; drawn over the plaster
  function timberFrame(c, F, band, o) {
    o = o || {}; const col = tone(o.col || C.timberD, band), pw = o.pw || 0.42, posts = o.posts || [F.x0 + pw / 2, F.x1 - pw / 2], rails = o.rails || [F.y0 + pw / 2, F.y1 - 1.2];
    c.fillStyle = col; for (const x of posts) c.fillRect(x - pw / 2, F.y0, pw, F.h); for (const y of rails) c.fillRect(F.x0, y - pw / 2, F.w, pw);
    c.strokeStyle = col; c.lineWidth = pw * 0.8; c.lineCap = 'butt'; c.beginPath(); for (const [x0, y0, x1, y1] of o.braces || []) { c.moveTo(x0, y0); c.lineTo(x1, y1); } c.stroke();
    c.strokeStyle = rgba(INK, 0.5); c.lineWidth = Math.max(PX, 0.06); for (const x of posts) c.strokeRect(x - pw / 2, F.y0, pw, F.h); for (const y of rails) c.strokeRect(F.x0, y - pw / 2, F.w, pw);
    c.strokeStyle = rgba(sh(o.col || C.timberD, -0.4), 0.6); c.lineWidth = 0.05; c.beginPath(); for (const x of posts) { c.moveTo(x - pw * 0.15, F.y0); c.lineTo(x - pw * 0.15, F.y1); } c.stroke();
  }
  // a hanging sign board painted once; drawn live swinging from its bracket
  function signSprite(col, text, w, h, T) {
    const cv = document.createElement('canvas'), W = Math.ceil(w * T) + 6, H = Math.ceil(h * T) + 6; cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.translate(3, 3); g.scale(T, T); g.fillStyle = col; rr(g, 0, 0, w, h, 0.25); g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(1.2 / T, 0.1); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 0.08; rr(g, 0.2, 0.2, w - 0.4, h - 0.4, 0.18); g.stroke();
    if (text) { g.fillStyle = '#FFF8EA'; g.font = `700 ${h * 0.55}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 0.05); }
    return cv;
  }
  // a cel-shaded blob (a flower head, a blossom cluster, a shrub) in 2D: shadow side, base, a highlight, ink
  function blob(c, x, y, r, col, o) { o = o || {}; const sx = o.sx || 1, sy = o.sy || 1; c.save(); c.translate(x, y); c.scale(sx, sy); c.fillStyle = col; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.save(); c.clip(); c.fillStyle = rgba(sh(col, -0.36), 0.9); c.beginPath(); c.arc(r * 0.3, r * 0.32, r * 0.95, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(-r * 0.08, -r * 0.1, r * 0.78, 0, TAU); c.fill(); c.fillStyle = rgba(sh(col, 0.4), 0.85); c.beginPath(); c.arc(-r * 0.35, -r * 0.35, r * 0.3, 0, TAU); c.fill(); c.restore(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.strokeStyle = o.ink || INK; c.lineWidth = o.lw || Math.max(1.2, r * 0.09); c.stroke(); c.restore(); }
  // a soft glow sprite (additive), cached per colour
  const glows = {};
  function glowImg(col) { if (glows[col]) return glows[col]; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, rgba(col, 0.9)); gr.addColorStop(0.35, rgba(col, 0.4)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return glows[col] = cv; }
  function glow(c, x, y, r, col, a) { if (!(r > 0.5) || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(glowImg(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  const shadows = {};
  function shadow(c, X, Y, w, k, a) { const key = 'sh'; let cv = shadows[key]; if (!cv) { cv = shadows[key] = document.createElement('canvas'); cv.width = 128; cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 32, 0, 64, 32, 32); gr.addColorStop(0, 'rgba(20,10,30,.55)'); gr.addColorStop(0.55, 'rgba(20,10,30,.35)'); gr.addColorStop(1, 'rgba(20,10,30,0)'); g.fillStyle = gr; g.setTransform(1, 0, 0, 1, 0, 0); g.scale(1, 1); g.fillRect(0, 0, 128, 64); } const W = w * k, H = W * 0.42, ga = c.globalAlpha; c.globalAlpha = ga * (a == null ? 1 : a); c.drawImage(cv, X - W / 2, Y - H / 2, W, H); c.globalAlpha = ga; }

  /* ---- the painter: a scene drawn through GeoKit at a camera ---- */
  const wrapCam = (cam, R) => { const G = GK(); return { X: cam.X, Y: cam.Y, T: cam.T, P: p => cam.P(G.mv(R, p)), dep: p => cam.dep(G.mv(R, p)) }; };
  function paintScene(c, S, cam, o) {
    const G = GK(), T = cam.T, items = [], camF = S.R ? wrapCam(cam, S.R) : cam;
    for (const p of S.parts) {
      if (p.flat) { items.push({ dep: p.dep, f: () => p.flat(c, camF, T) }); continue; }
      const R = p.xf.R, t = p.xf.t || [0, 0, 0], s = p.xf.s == null ? 1 : p.xf.s, sv = Array.isArray(s) ? s : [s, s, s];
      let dep = 0; for (const v of p.M.v) { const w = G.add(t, R ? G.mv(R, [v[0] * sv[0], v[1] * sv[1], v[2] * sv[2]]) : [v[0] * sv[0], v[1] * sv[1], v[2] * sv[2]]); dep += cam.dep(w); } dep = dep / p.M.v.length + (p.o.dz || 0);
      items.push({ dep, f: () => { const po = p.o, fc = po.face, opts = Object.assign({ force: true, ink: INK, lw: 0.13, lwI: 0.055, inkIA: 0.6 }, po); if (fc) opts.face = (cc, i, fr) => { cc.save(); const F = fs(cc, fr); fc(cc, F, sideOf(fr.n, R), fr.band, fr, i); cc.restore(); }; G.solid(c, cam, p.M, p.xf, opts); } });
    }
    items.sort((a, b) => a.dep - b.dep);
    for (const it of items) it.f();
  }
  // the screen bounds of a scene at a camera (anchor at 0, 0): [minX, minY, maxX, maxY] in px
  function bounds(S, T) {
    const G = GK(), cam = G.cam(0, 0, T); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const take = (x, y) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; };
    for (const p of S.parts) { if (p.flat) { if (p.bb) { const [bx, by, bz, br] = p.bb, q = cam.P([bx, by, bz]); take(q[0] - br * T, q[1] - br * T); take(q[0] + br * T, q[1] + br * T); } continue; }
      const R = p.xf.R, t = p.xf.t || [0, 0, 0], s = p.xf.s == null ? 1 : p.xf.s, sv = Array.isArray(s) ? s : [s, s, s];
      for (const v of p.M.v) { const w = G.add(t, R ? G.mv(R, [v[0] * sv[0], v[1] * sv[1], v[2] * sv[2]]) : [v[0] * sv[0], v[1] * sv[1], v[2] * sv[2]]), q = cam.P(w); take(q[0], q[1]); } }
    if (S.bb) for (const [bx, by, bz, br] of S.bb) { const q = cam.P(S.R ? G.mv(S.R, [bx, by, bz]) : [bx, by, bz]); take(q[0] - br * T, q[1] - br * T); take(q[0] + br * T, q[1] + br * T); }
    if (x0 > x1) { x0 = -10; x1 = 10; y0 = -10; y1 = 10; }
    return [x0, y0, x1, y1];
  }

  /* ---- the builders: one per kind, each takes the spec { w, d (true units), face, color, game, v, entry } ---- */
  const BUILD = {};
  const DEF = {};   // default footprints in world px for kinds the layout gives none
  // (builders follow; the file ends with make / draw / the cache)

  /* ---- shared pieces ---- */
  // a gabled roof with a ridge along x: two thick slabs (their rake ends show the thickness) and a ridge cap. yF/yB the
  // wall faces, over the overhang, a the pitch. zAt(y) gives the roof's surface height, for things that sit on it
  function gableX(S, x0, x1, yF, yB, z0, over, a, th, mt, col, o) {
    o = o || {}; const half = (yF - yB) / 2 + over, H = half * Math.tan(a), L = half / Math.cos(a) + 0.3, ym = (yF + yB) / 2, sa = Math.sin(a), ca = Math.cos(a), G = GK();
    const tiles = (c, F, side, band) => { if (side === 'T' || side[0] === 's') (o.tiles || roofTiles)(c, F, band, col, o.tileO); else if (side === 'S' || side === 'N') { c.fillStyle = tone(o.fascia || C.cream, band); c.fillRect(F.x0, F.y0, F.w, F.h); c.strokeStyle = rgba(INK, 0.4); c.lineWidth = 0.06; c.beginPath(); c.moveTo(F.x0, F.cy); c.lineTo(F.x1, F.cy); c.stroke(); } else { c.fillStyle = tone(o.fascia || C.cream, band); c.fillRect(F.x0, F.y0, F.w, F.h); } };
    const fmat = mat(o.fascia || C.cream);
    // south slab: its y runs from the ridge down to the eave; north slab the other way
    const midS = [(x0 + x1) / 2, yF + over - half / 2 * 1, z0 + H / 2], nS = [0, sa, ca];
    const midN = [(x0 + x1) / 2, yB - over + half / 2, z0 + H / 2], nN = [0, -sa, ca];
    const slab = (mid, n, R) => { const t = G.sub(mid, G.mul(n, th / 2)); const Mh = G.block((x1 - x0) / 2 + over, L / 2, th / 2); Mh.mat = Mh.f.map((_, i) => i === 1 ? 0 : 1); S.add(Mh, { t, R }, { mats: [mt, fmat], face: tiles, dz: o.dz || 0 }); };
    slab(midS, nS, rx(-a)); slab(midN, nN, rx(a));
    S.box((x0 + x1) / 2, ym, z0 + H - 0.25, x1 - x0 + over * 2 + 0.3, 1.5, 0.7, mat(sh(col, -0.18)), { dz: (o.dz || 0) + 0.5, face: (c, F, side, band) => { c.strokeStyle = rgba(INK, 0.45); c.lineWidth = 0.07; c.beginPath(); for (let x = F.x0 + 0.6; x < F.x1; x += 1.3) { c.moveTo(x, F.y0); c.lineTo(x, F.y1); } c.stroke(); } });
    return { H, zAt: y => z0 + (half - Math.abs(y - ym)) * Math.tan(a), ym, half };
  }
  // the same with the ridge along y (a dormer, a shed's cross gable)
  function gableY(S, y0, y1, xL, xR, z0, over, b, th, mt, col, o) {
    o = o || {}; const half = (xR - xL) / 2 + over, H = half * Math.tan(b), L = half / Math.cos(b) + 0.2, xm = (xL + xR) / 2, sb = Math.sin(b), cb = Math.cos(b), G = GK();
    const tiles = (c, F, side, band) => { if (side === 'T' || side[0] === 's') (o.tiles || roofTiles)(c, F, band, col, o.tileO); else { c.fillStyle = tone(o.fascia || C.cream, band); c.fillRect(F.x0, F.y0, F.w, F.h); } };
    const fmat = mat(o.fascia || C.cream);
    const slab = (mid, n, R) => { const t = G.sub(mid, G.mul(n, th / 2)); const Mh = G.block(L / 2, (y1 - y0) / 2 + over, th / 2); Mh.mat = Mh.f.map((_, i) => i === 1 ? 0 : 1); S.add(Mh, { t, R }, { mats: [mt, fmat], face: tiles, dz: o.dz || 0 }); };
    slab([xR + over - half / 2, (y0 + y1) / 2, z0 + H / 2], [sb, 0, cb], ry(b)); slab([xL - over + half / 2, (y0 + y1) / 2, z0 + H / 2], [-sb, 0, cb], ry(-b));
    S.box(xm, (y0 + y1) / 2, z0 + H - 0.2, 1.2, y1 - y0 + over * 2 + 0.2, 0.6, mat(sh(col, -0.18)), { dz: (o.dz || 0) + 0.5 });
    return { H, zAt: x => z0 + (half - Math.abs(x - xm)) * Math.tan(b) };
  }
  // a post (square timber) and a chimney with its cap and pot
  const post = (S, x, y, z0, h, s, mt, o) => S.box(x, y, z0, s || 0.6, s || 0.6, h, mt || M.timber, o);
  function chimney(S, x, y0, y1, zt, zAt, o) {
    o = o || {}; const hw = o.hw || 1.3;
    S.add(slopeBox(x - hw, x + hw, y0, y1, zt, zAt), {}, { mats: [M.stone], dz: o.dz || 3, face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, C.stone, { ch: 0.8, sw: 1.3, seed: 9 }); } });
    S.box(x, (y0 + y1) / 2, zt, hw * 2 + 0.6, y1 - y0 + 0.6, 0.55, M.stoneD, { dz: (o.dz || 3) + 0.5 });
    S.cyl(x, (y0 + y1) / 2, zt + 0.55, 0.55, 0.62, 1.2, 8, mat('#9A5A48'), { dz: (o.dz || 3) + 1 });
    S.cyl(x, (y0 + y1) / 2, zt + 1.75, 0.7, 0.7, 0.25, 8, mat('#7A4438'), { dz: (o.dz || 3) + 1.2 });
  }
  // a hanging lantern that glows at night and softly always: a bracket, the lamp, a live glow
  function lantern(S, x, y, z, o) {
    o = o || {}; const col = o.col || '#FFD27A';
    if (o.bracket) S.box(x - o.bracket / 2, y, z + 1.6, o.bracket, 0.18, 0.18, M.iron);
    S.lathe(x, y, z, [[0.18, 0], [0.55, 0.15], [0.62, 1.0], [0.4, 1.45], [0.14, 1.7]], 6, mat('#FFE6A8', { a: 0.95 }), { face: (c, F, side, band) => { if (side === 'T' || side === 'B') return; c.fillStyle = rgba('#3C3440', 0.85); c.fillRect(F.x0, F.y0, F.w, 0.14); c.fillRect(F.x0, F.y1 - 0.14, F.w, 0.14); c.fillRect(F.cx - 0.05, F.y0, 0.1, F.h); } });
    S.box(x, y, z + 1.7, 0.3, 0.3, 0.2, M.iron);
    S.light(x, y, z + 0.8, 2.6, col);
    S.liveAdd((c, cam, t, oo) => { const p = cam.P([x, y, z + 0.8]); glow(c, p[0], p[1], cam.T * (2.2 + Math.sin(t * 3 + x) * 0.15), col, 0.22 + 0.5 * (oo.lit || 0)); });
  }
  // a cloth banner on a pole, waving live
  function pennant(S, x, y, z0, h, col, o) {
    o = o || {}; S.cyl(x, y, z0, 0.16, 0.12, h, 6, M.timberD); S.lathe(x, y, z0 + h, [[0.12, 0], [0.3, 0.2], [0.28, 0.45], [0.02, 0.62]], 6, M.brass);
    const W = o.w || 1.8, H = o.h || 4, top = z0 + h - 0.3, side = o.side == null ? 1 : o.side;
    S.liveAdd((c, cam, t, oo) => { const T = cam.T, pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6, wv = Math.sin(t * 2.6 + u * 3.2 + x * 0.3) * 0.18 * u; pts.push(cam.P([x + side * (0.1 + u * W), y + wv, top - u * 0.12])); }
      const base = cam.P([x + side * 0.1, y, top - H]); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); const tip = pts[pts.length - 1]; c.lineTo(tip[0], tip[1] + H * CE * T * 0.5); c.lineTo(base[0], base[1]); c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = Math.max(1.2, T * 0.1); c.stroke();
      c.save(); c.clip(); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(pts[3][0] - T * 0.1, pts[0][1] - T, side > 0 ? T * 3 : -T * 3, T * (H + 2)); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(pts[0][0], pts[0][1] + T * 0.6, pts[1][0] - pts[0][0], T * (H * 0.4)); c.restore(); });
  }
  const dark = col => sh(col, -0.45);

  /* ---- buildings ---- */
  BUILD.cottage = sp => {
    const S = scene(), w = sp.w, d = sp.d, yF = -4.6, yB = -d + 0.8, cy = (yF + yB) / 2, dd = yF - yB, wall = w - 1.6, shut = '#4F8E8E';
    S.box(0, cy, 0, wall + 0.5, dd + 0.5, 1.3, M.stoneM, { face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, C.stoneM, { ch: 0.65, sw: 1.4, moss: true }); } });
    const wallH = 9.6;
    S.box(0, cy, 1.3, wall, dd, wallH, M.plaster, { face: (c, F, side, band) => {
      if (side === 'T' || side === 'N') return; plaster(c, F, band, side === 'S' ? 1 : 2);
      if (side === 'S') { timberFrame(c, F, band, { posts: [F.x0 + 0.25, F.cx - 5.6, F.cx + 5.6, F.x1 - 0.25], rails: [F.y0 + 0.25, F.y0 + 3.2], braces: [[F.x0 + 0.4, F.y0 + 3.2, F.cx - 5.6, F.y0 + 0.4], [F.x1 - 0.4, F.y0 + 3.2, F.cx + 5.6, F.y0 + 0.4]] });
        doorD(c, F.cx - 1.8, F.y1 - 5.8, 3.6, 5.8, band, { arch: true, step: false });
        windowD(c, F.cx - 11.2, F.y1 - 7.4, 3, 3.4, band, { shut, box: true, seed: 4 }); windowD(c, F.cx + 8.2, F.y1 - 7.4, 3, 3.4, band, { shut, box: true, seed: 8 });
      } else { timberFrame(c, F, band, { posts: [F.x0 + 0.25, F.cx, F.x1 - 0.25], rails: [F.y0 + 0.25, F.y0 + 3.2], braces: [[F.x0 + 0.4, F.y0 + 3.2, F.cx, F.y0 + 0.4], [F.x1 - 0.4, F.y0 + 3.2, F.cx, F.y0 + 0.4]] }); windowD(c, F.cx + (side === 'W' ? 2.5 : -5.5), F.y1 - 7.2, 3, 3.2, band, { shut, box: side === 'W', seed: 6 }); }
    } });
    S.light(-9.7, yF, 4.8, 3); S.light(9.7, yF, 4.8, 3); S.light(-wall / 2, cy + 4, 5, 3);
    // the gable ends, then the roof over them
    const a = 0.5, over = 2.4, z0 = 1.3 + wallH - 0.1;
    const gh = ((yF - yB) / 2 + over) * Math.tan(a) - over * Math.tan(a);
    S.add(extX([[yF, z0 + over * Math.tan(a)], [cy, z0 + over * Math.tan(a) + gh], [yB, z0 + over * Math.tan(a)]], -wall / 2, wall / 2), {}, { mats: [M.plaster], dz: 0.3, face: (c, F, side, band) => { if (side !== 'E' && side !== 'W') return; plaster(c, F, band, 7); timberFrame(c, F, band, { posts: [F.cx], rails: [F.y1 - 0.3], braces: [[F.cx, F.y0 + 0.6, F.cx - 4, F.y1 - 0.3], [F.cx, F.y0 + 0.6, F.cx + 4, F.y1 - 0.3]], pw: 0.38 }); windowD(c, F.cx - 1, F.y1 - 3.6, 2, 2.4, band, { arch: true }); } });
    const roof = gableX(S, -wall / 2, wall / 2, yF, yB, z0, over, a, 0.6, M.tile, C.tile, { dz: 0.6 });
    // the dormer on the south slope, the chimney at the east end
    const dx = -6.5, dyF = yF - 3.4, dyB = cy + 1.2, dzT = roof.zAt(dyF) + 3.6;
    S.add(slopeBox(dx - 2.6, dx + 2.6, dyB, dyF, dzT, roof.zAt), {}, { mats: [M.plaster], dz: 4, face: (c, F, side, band) => { if (side !== 'S') return; plaster(c, F, band, 9); windowD(c, F.cx - 1.2, F.y1 - 3.1, 2.4, 2.6, band, { shut, seed: 2 }); } });
    S.light(dx, dyF, dzT - 1.6, 2.4);
    gableY(S, dyB, dyF, dx - 2.6, dx + 2.6, dzT - 0.1, 0.9, 0.62, 0.5, M.tile, C.tile, { dz: 5, tileO: { rh: 0.95, tw: 1.1 } });
    chimney(S, wall / 2 - 3.2, cy - 2.4, cy - 0.2, roof.zAt(cy) + 2.8, roof.zAt, { dz: 4 });
    // the porch: deck, posts, its own little roof, a lantern by the door
    S.box(0, (yF - 0.4) / 2, 0, 13, -yF - 0.4 + 0.4, 0.9, M.timber, { face: (c, F, side, band) => { if (side === 'T') planks(c, F, band, C.timberL, { bh: 1.3, seed: 2 }); else planks(c, F, band, C.timber, { bh: 0.9, nails: false }); } });
    post(S, -5.8, yF + 2.0, 0.9, z0 + 0.2 - 0.9, 0.7); post(S, 5.8, yF + 2.0, 0.9, z0 + 0.2 - 0.9, 0.7);
    S.box(0, yF + 2.0, 3.2, 12.2, 0.25, 0.3, M.timber); for (const x of [-4.4, -3, 3, 4.4]) S.box(x, yF + 2.0, 0.9, 0.3, 0.25, 2.3, M.timberL);
    lantern(S, -3.2, yF + 0.5, 5.2, { bracket: 0.9 });
    S.liveAdd((c, cam, t, o) => { if (!o.flag) return; const p = cam.P([0, yF + 1, 11]); glow(c, p[0], p[1], cam.T * 1.2, '#FFD27A', 0.3); });
    return S;
  };
  BUILD.shed = sp => {
    const S = scene(), w = sp.w, d = sp.d, cy = -d / 2, col = '#8C6A48';
    S.box(0, cy, 0, w - 0.2, d - 0.2, 0.8, M.stoneD, { face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, C.stoneD, { ch: 0.8, sw: 1.5 }); } });
    const h = 6.5;
    S.box(0, cy, 0.8, w - 1, d - 1, h, mat(col), { face: (c, F, side, band) => { if (side === 'T') return; planks(c, F, band, col, { bh: 1.05, seed: side === 'S' ? 3 : 4 });
      if (side === 'S') { doorD(c, F.cx - 1.9, F.y1 - 4.8, 3.8, 4.8, band, { col: '#A2794F', step: false }); c.strokeStyle = tone('#5A3E28', band); c.lineWidth = 0.3; c.beginPath(); c.moveTo(F.cx - 1.7, F.y1 - 4.5); c.lineTo(F.cx - 0.2, F.y1 - 0.4); c.moveTo(F.cx + 1.7, F.y1 - 4.5); c.lineTo(F.cx + 0.2, F.y1 - 0.4); c.stroke(); c.fillStyle = tone(C.iron, band); c.fillRect(F.cx - 0.1, F.y1 - 4.8, 0.2, 4.8); }
      else if (side === 'W') windowD(c, F.cx - 1.2, F.y1 - 4.6, 2.4, 2.2, band, { frame: C.cream }); } });
    S.light(-(w - 1) / 2, cy, 3.3, 2.4);
    // a single pitch sloping down to the back, mossy shingles; a barrel at the side
    { const b = 0.36, G = GK(), over = 1.2, yFr = -0.5 + over, yBk = -d + 0.5 - over, L = (yFr - yBk) / Math.cos(b), n = [0, Math.sin(b), Math.cos(b)], zF = 0.8 + h + 0.35, zB = zF - (yFr - yBk) * Math.tan(b), mid = [0, (yFr + yBk) / 2, (zF + zB) / 2]; const Mh = G.block(w / 2 + over * 0.6, L / 2, 0.3); Mh.mat = Mh.f.map((_, i) => i === 1 ? 0 : 1);
      S.add(Mh, { t: G.sub(mid, G.mul(n, 0.15)), R: rx(-b) }, { mats: [M.tileM, mat('#6E5236')], dz: 1, face: (c, F, side, band) => { if (side === 'T' || side[0] === 's') roofTiles(c, F, band, C.tileM, { flat: true, rh: 1.1, tw: 1.5, ridge: false }); else { c.fillStyle = tone('#6E5236', band); c.fillRect(F.x0, F.y0, F.w, F.h); } } }); }
    S.cyl(w / 2 - 1.2, -1.6, 0, 1.1, 1.0, 2.6, 10, mat('#8A5E3C'), { face: (c, F, side, band) => { if (side === 'T') { c.fillStyle = tone('#A77A50', band); c.beginPath(); c.arc(F.cx, F.cy, 0.9, 0, TAU); c.fill(); c.strokeStyle = rgba(INK, 0.5); c.lineWidth = 0.06; c.beginPath(); c.arc(F.cx, F.cy, 0.5, 0, TAU); c.stroke(); } else { c.fillStyle = tone(C.iron, band); c.fillRect(F.x0, F.y0 + 0.5, F.w, 0.3); c.fillRect(F.x0, F.y1 - 0.8, F.w, 0.3); c.strokeStyle = rgba(INK, 0.4); c.lineWidth = 0.06; c.beginPath(); for (let x = F.x0; x < F.x1; x += 0.7) { c.moveTo(x, F.y0); c.lineTo(x, F.y1); } c.stroke(); } } });
    return S;
  };
  // walls of dark timber posts with cream panels (the dojo and shrine)
  function panelWall(c, F, band, o) { o = o || {}; c.fillStyle = tone(o.panel || '#F2E6CF', band); c.fillRect(F.x0, F.y0, F.w, F.h); plaster(c, F, band, 4); const n = Math.max(1, Math.round(F.w / (o.sp || 4.2))), posts = []; for (let i = 0; i <= n; i++) posts.push(F.x0 + 0.25 + (F.w - 0.5) * i / n); timberFrame(c, F, band, { col: o.col || '#4A2E22', posts, rails: [F.y0 + 0.25, F.y1 - 0.3, F.y0 + F.h * 0.62], pw: 0.46 }); return posts; }
  function shoji(c, x, y, w, h, band, o) { recess(c, x, y, w, h, band, '#3A2A2C', 0.2); c.fillStyle = tone('#FFF6E2', band); c.fillRect(x + 0.2, y + 0.2, w - 0.4, h - 0.2); if (o && o.lit) { c.fillStyle = rgba('#FFD98A', 0.5 * o.lit); c.fillRect(x + 0.2, y + 0.2, w - 0.4, h - 0.2); } c.strokeStyle = tone('#4A2E22', band); c.lineWidth = 0.14; c.beginPath(); for (let k = 1; k < 4; k++) { c.moveTo(x + w * k / 4, y); c.lineTo(x + w * k / 4, y + h); } for (let k = 1; k < 5; k++) { c.moveTo(x, y + h * k / 5); c.lineTo(x + w, y + h * k / 5); } c.stroke(); c.lineWidth = 0.3; c.strokeRect(x, y, w, h); c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.stroke(); }
  BUILD.dojo = sp => {
    const S = scene(), w = sp.w, d = sp.d, cy = -d / 2, hw = w - 8, hd = d - 10, hy = cy - 1, yF = hy + hd / 2, slate = C.slate;
    S.box(0, cy, 0, w - 0.4, d - 0.4, 1.4, M.stone, { face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, C.stone, { ch: 1.4, sw: 3.2, gap: 0.1 }); else { c.fillStyle = tone(sh(C.stone, 0.08), band); c.fillRect(F.x0, F.y0, F.w, F.h); } } });
    S.box(0, cy, 1.4, w - 3, d - 3, 0.7, M.timber, { face: (c, F, side, band) => { if (side === 'T') planks(c, F, band, '#A8805A', { bh: 1.2, seed: 6 }); else { c.fillStyle = tone('#5A3C2A', band); c.fillRect(F.x0, F.y0, F.w, F.h); } } });
    const wallH = 8;
    S.box(0, hy, 2.1, hw, hd, wallH, M.cream, { face: (c, F, side, band) => { if (side === 'T') return; panelWall(c, F, band, { sp: 4.4 }); if (side === 'S') shoji(c, F.cx - 3.2, F.y1 - 6.2, 6.4, 6.2, band); else if (side !== 'N') { shoji(c, F.cx - 1.6, F.y1 - 5.6, 3.2, 3.6, band); } } });
    S.light(0, yF, 5, 4.5); S.light(-hw / 2, hy, 5, 3); S.light(hw / 2, hy, 5, 3);
    // the lower roof, a broad hipped tier with a flat top the upper hall stands on
    const z1 = 2.1 + wallH, uw = hw - 9, ud = hd - 11;
    const roofFace = (c, F, side, band) => { if (side !== 'T' && side !== 'B') roofTiles(c, F, band, slate, { flat: true, rh: 1.0, tw: 1.1, ridge: side[0] === 's' }); else { c.fillStyle = tone(sh(slate, -0.1), band); c.fillRect(F.x0, F.y0, F.w, F.h); } };
    S.thick(hipMesh(w + 1.5, d - 2.5, uw + 1.2, ud + 1.2, 3.4), { t: [0, hy, z1] }, M.slate, 0.6, { dz: 1, face: roofFace });
    S.box(0, hy, z1 + 3.4, uw, ud, 4.6, M.cream, { dz: 3, face: (c, F, side, band) => { if (side === 'T') return; panelWall(c, F, band, { sp: 4.2 }); if (side === 'S') { windowD(c, F.cx - 1.3, F.y0 + 1.1, 2.6, 2.6, band, { arch: true, frame: '#4A2E22' }); } } });
    S.light(0, hy + ud / 2, z1 + 5.6, 2.6);
    S.thick(hipMesh(uw + 5, ud + 5, 4, 0, 3.6), { t: [0, hy, z1 + 8] }, M.slate, 0.55, { dz: 5, face: roofFace });
    S.lathe(-2, hy, z1 + 11.4, [[0.3, 0], [0.6, 0.4], [0.5, 0.9], [0.05, 1.5]], 8, M.brass, { dz: 6 }); S.lathe(2, hy, z1 + 11.4, [[0.3, 0], [0.6, 0.4], [0.5, 0.9], [0.05, 1.5]], 8, M.brass, { dz: 6 });
    // posts under the front eave, the steps, the lanterns, the pennants at the corners
    for (const x of [-hw / 2 + 0.4, -5.2, 5.2, hw / 2 - 0.4]) post(S, x, yF + 3.6, 2.1, z1 - 2.1, 0.7, M.timberD);
    S.box(0, yF + 5.2, 1.4, 8, 1.6, 0.7, M.stone); S.box(0, yF + 6.6, 0, 9, 1.6, 1.4, M.stone, { face: (c, F, side, band) => { if (side === 'T') { c.fillStyle = tone(sh(C.stone, 0.08), band); c.fillRect(F.x0, F.y0, F.w, F.h); } } });
    for (const x of [-9, 9]) { S.lathe(x, yF + 3.2, z1 - 3.4, [[0.3, 0], [1.05, 0.45], [1.15, 1.4], [0.95, 2.2], [0.3, 2.6]], 8, mat('#F06A5A'), { face: (c, F, side, band) => { if (side === 'T' || side === 'B') return; c.strokeStyle = rgba('#7A1F1A', 0.7); c.lineWidth = 0.08; c.beginPath(); for (let k = 1; k < 5; k++) { c.moveTo(F.x0, F.y0 + F.h * k / 5); c.lineTo(F.x1, F.y0 + F.h * k / 5); } c.stroke(); } }); S.box(x, yF + 3.2, z1 - 0.8, 0.14, 0.14, 0.8, M.iron); S.light(x, yF + 3.2, z1 - 2.1, 2.6, '#FFB070');
      S.liveAdd((c, cam, t, o) => { const p = cam.P([x, yF + 3.2, z1 - 2.1]); glow(c, p[0], p[1], cam.T * (2.4 + Math.sin(t * 2.4 + x) * 0.2), '#FF9A60', 0.24 + 0.5 * (o.lit || 0)); }); }
    pennant(S, -w / 2 + 1.6, -1.8, 1.4, 13, '#C8373A', { side: 1, w: 1.6, h: 5 }); pennant(S, w / 2 - 1.6, -1.8, 1.4, 13, '#C8373A', { side: -1, w: 1.6, h: 5 });
    return S;
  };
  BUILD.shrine = sp => {
    const S = scene(), w = sp.w, d = sp.d, cy = -d / 2;
    S.box(0, cy, 0, w - 0.4, d - 0.4, 1.2, M.stone, { face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, C.stone, { ch: 0.7, sw: 1.6, moss: true }); } });
    S.box(0, cy, 1.2, w - 2.4, d - 2.4, 0.9, M.stoneD);
    const hw = w - 5, hd = d - 6, yF = cy + hd / 2, h = 5.5;
    for (const [x, y] of [[-hw / 2 - 0.5, yF + 0.4], [hw / 2 + 0.5, yF + 0.4], [-hw / 2 - 0.5, cy - hd / 2 - 0.4], [hw / 2 + 0.5, cy - hd / 2 - 0.4]]) post(S, x, y, 2.1, h + 0.6, 0.55, mat('#B5452E'));
    S.box(0, cy, 2.1, hw, hd, h, mat('#9C4A3A'), { face: (c, F, side, band) => { if (side === 'T') return; planks(c, F, band, '#9C4A3A', { v: true, bh: 0.9, nails: false, seed: 2 }); if (side === 'S') { doorD(c, F.cx - 1.4, F.y1 - 3.8, 2.8, 3.8, band, { open: true, step: false, inside: (cc, x, y, ww, hh) => { cc.fillStyle = rgba('#FFD27A', 0.7); cc.beginPath(); cc.arc(x + ww / 2, y + hh * 0.5, ww * 0.26, 0, TAU); cc.fill(); cc.fillStyle = rgba('#FFF4D0', 0.9); cc.beginPath(); cc.arc(x + ww / 2, y + hh * 0.5, ww * 0.13, 0, TAU); cc.fill(); } }); } } });
    S.light(0, yF, 4, 3.2, '#FFCC77');
    S.liveAdd((c, cam, t, o) => { const p = cam.P([0, yF, 4.2]); glow(c, p[0], p[1], cam.T * (2 + Math.sin(t * 2) * 0.15), '#FFCC77', 0.3 + 0.4 * (o.lit || 0)); });
    gableX(S, -hw / 2, hw / 2, yF, cy - hd / 2, 2.1 + h + 0.3, 1.9, 0.72, 0.5, M.copper, C.copper, { dz: 1, tileO: { rh: 0.9, tw: 1.0 }, fascia: '#B5452E' });
    S.lathe(0, yF + 1.1, 2.1 + h - 1.6, [[0.25, 0], [0.55, 0.25], [0.6, 0.9], [0.45, 1.3], [0.1, 1.5]], 8, M.brass, { dz: 2 });
    S.box(0, yF + 1.1, 2.1 + h - 0.1, 0.12, 0.12, 0.6, M.iron, { dz: 2 });
    S.lathe(0, yF + 2.2, 2.1, [[0.7, 0], [0.9, 0.3], [0.6, 0.55]], 8, M.stoneD);
    return S;
  };
  BUILD.altar = sp => {
    const S = scene(), w = sp.w, d = sp.d, cy = -d / 2, rune = (c, F, side, band) => { if (side === 'T') return; const R = rnd(13); c.strokeStyle = rgba('#7FE0E8', 0.9); c.lineWidth = 0.12; c.lineCap = 'round'; for (let x = F.x0 + 0.8; x < F.x1 - 0.6; x += 1.3) { c.beginPath(); const n = 2 + Math.floor(R() * 3); let px = x, py = F.cy - 0.4; c.moveTo(px, py); for (let k = 0; k < n; k++) { px += (R() - 0.5) * 0.7; py += (R() - 0.2) * 0.5; c.lineTo(px, py); } c.stroke(); } };
    const st = mat('#B9B4C4');
    S.box(0, cy, 0, w - 0.4, d - 0.4, 1.1, st, { face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, '#B9B4C4', { ch: 1.1, sw: 2.6 }); } });
    S.box(0, cy, 1.1, w - 4, d - 4, 1.1, st, { face: rune });
    S.box(0, cy, 2.2, w - 8, d - 8, 1.1, st, { face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, '#B9B4C4', { ch: 1.1, sw: 2.6 }); } });
    for (const [x, y] of [[-w / 2 + 3.4, cy + d / 2 - 3.6], [w / 2 - 3.4, cy + d / 2 - 3.6], [-w / 2 + 3.4, cy - d / 2 + 3.6], [w / 2 - 3.4, cy - d / 2 + 3.6]]) { S.cyl(x, y, 2.2, 0.85, 0.7, 7, 8, st); S.box(x, y, 9.2, 2, 2, 0.6, st); S.box(x, y, 1.1, 2, 2, 0.5, st); }
    S.lathe(0, cy, 3.3, [[1.6, 0], [1.2, 0.5], [1.1, 2.6], [1.5, 3.1]], 8, st, { face: rune });
    S.light(0, cy, 7.5, 5, '#9FE8FF');
    S.liveAdd((c, cam, t, o) => { const G = GK(), z = 7.6 + Math.sin(t * 1.4) * 0.3, p = cam.P([0, cy, z]); glow(c, p[0], p[1], cam.T * 3.4, '#7FD8FF', 0.35 + 0.3 * (o.lit || 0)); G.solid(c, cam, CRYSTAL, { R: G.mm(G.rz(t * 0.7), G.rx(0.1)), t: [0, cy, z] }, { mats: [mat('#9FE8FF', { c: ['#3C88B8', '#8AD8F8', '#E6FBFF'], gloss: 1 })], ink: '#245068', lw: 0.1, force: true, inner: true }); glow(c, p[0], p[1], cam.T * 0.9, '#FFFFFF', 0.5); });
    return S;
  };
  let CRYSTAL = null;
  BUILD.kitchen = sp => {
    const S = scene(), w = sp.w, d = sp.d, cy = -d / 2, yB = -d + 0.6, roofCol = '#B86A48';
    S.box(0, cy, 0, w - 0.3, d - 0.3, 0.6, M.stoneM, { face: (c, F, side, band) => { if (side === 'T') stones(c, F, band, '#B8AE9A', { ch: 2.4, sw: 2.8, gap: 0.12 }); else stones(c, F, band, C.stoneM, { ch: 0.6, sw: 1.4 }); } });
    const h = 7.2;
    S.box(0, yB + 1.3, 0.6, w - 1.2, 2.6, h, M.plaster, { face: (c, F, side, band) => { if (side !== 'S') { if (side !== 'T') plaster(c, F, band, 3); return; } plaster(c, F, band, 3); timberFrame(c, F, band, { posts: [F.x0 + 0.25, F.x1 - 0.25], rails: [F.y0 + 0.25] });
      // shelves of jars and loaves, a window
      for (const sy of [F.y0 + 2.2, F.y0 + 4]) { c.fillStyle = tone(C.timber, band); c.fillRect(F.x0 + 1, sy, F.w * 0.42, 0.3); const R = rnd(sy * 10); for (let x = F.x0 + 1.3; x < F.x0 + F.w * 0.42; x += 1.1) { c.fillStyle = tone(['#D9A066', '#A8C8E8', '#E8707C', '#F2D27A'][Math.floor(R() * 4)], band); rr(c, x, sy - 0.9, 0.8, 0.9, 0.2); c.fill(); ink(c, 0.06, 0.6); } }
      windowD(c, F.cx + 2.6, F.y0 + 1.6, 3.4, 3, band, { frame: C.cream }); } });
    S.light(4.3, yB + 2.6, 3.4, 3);
    for (const x of [-1, 1]) S.box(x * (w / 2 - 1.3), cy - d / 4 + 0.2, 0.6, 1.4, d / 2, h, M.plaster, { face: (c, F, side, band) => { if (side !== 'T') { plaster(c, F, band, 5); timberFrame(c, F, band, { posts: [F.x0 + 0.25, F.x1 - 0.25], rails: [F.y0 + 0.25] }); } } });
    for (const x of [-w / 2 + 1.3, w / 2 - 1.3]) post(S, x, -1.6, 0.6, h, 0.8, M.timberD);
    // the oven in the back corner and its chimney, the counter, the pots on their rail
    S.lathe(-w / 2 + 4.6, yB + 5.2, 0.6, [[2.5, 0], [2.6, 1.6], [2.1, 2.8], [1.2, 3.6], [0.3, 3.9]], 10, M.stoneD, { face: (c, F, side, band) => { if (side === 'S' || side === 'sS') { c.fillStyle = '#2A1612'; c.beginPath(); c.moveTo(F.cx - 1, F.y1); c.lineTo(F.cx - 1, F.y1 - 1.1); c.arc(F.cx, F.y1 - 1.1, 1, Math.PI, 0); c.lineTo(F.cx + 1, F.y1); c.closePath(); c.fill(); c.fillStyle = rgba('#FF8A3A', 0.8); c.beginPath(); c.arc(F.cx, F.y1 - 0.3, 0.6, Math.PI, 0); c.fill(); } else if (side !== 'T') stones(c, F, band, C.stoneD, { ch: 0.7, sw: 1.2 }); } });
    S.liveAdd((c, cam, t, o) => { const p = cam.P([-w / 2 + 4.6, yB + 7.6, 1.4]); glow(c, p[0], p[1], cam.T * (1.6 + Math.sin(t * 9) * 0.15 + Math.sin(t * 5.3) * 0.1), '#FF8A3A', 0.45); });
    const z1 = 0.6 + h, hipH = 4.2;
    const roof = hipMesh(w + 2.4, d + 1.4, w - 8, 0, hipH), half = (d + 1.4) / 2, zAtN = y => z1 + (y - (cy - half)) * hipH / half;
    chimney(S, -w / 2 + 4.6, yB + 0.6, yB + 3.2, z1 + hipH + 1.2, zAtN, { dz: 1.5, hw: 1.2 });
    S.thick(roof, { t: [0, cy, z1] }, mat(roofCol), 0.6, { dz: 2, face: (c, F, side, band) => { if (side !== 'B') roofTiles(c, F, band, roofCol, { rh: 1.1, tw: 1.25, ridge: side === 'sS' || side === 'sN' }); } });
    S.box(0, -2.2, 0.6, w - 5, 3, 3.2, M.timber, { face: (c, F, side, band) => { if (side === 'T') { planks(c, F, band, '#B5885C', { bh: 1.1, seed: 8 }); const R = rnd(21); for (let i = 0; i < 9; i++) { const x = F.x0 + 1 + R() * (F.w - 2), y = F.y0 + 0.5 + R() * (F.h - 1), col = ['#FF8A4A', '#E8505A', '#F2C14E', '#8FC95C', '#D9A066'][i % 5]; blob(c, x, y, 0.42 + R() * 0.2, tone(col, band), { lw: 0.08 }); } } else planks(c, F, band, C.timber, { v: true, bh: 1.2, nails: false }); } });
    S.box(0, -1.2, 3.8, w - 4.4, 3.6, 0.4, M.timberL, { face: (c, F, side, band) => { if (side === 'T') planks(c, F, band, '#C89A68', { bh: 1.2, seed: 4 }); } });
    S.box(0, -0.4, z1 - 1.3, w - 5, 0.3, 0.3, M.iron, { dz: 2.2 });
    for (const [x, zz, col] of [[-5, 2.1, '#5A5560'], [-2.2, 1.7, '#B07040'], [0.8, 2.3, '#5A5560'], [3.6, 1.9, '#C9A24B']]) { S.lathe(x, -0.4, z1 - 1.3 - zz, [[0.55, 0], [0.9, 0.35], [0.85, 1.3], [0.7, 1.5]], 8, mat(col, { gloss: col === '#C9A24B' ? 1 : 0 }), { dz: 2.3 }); S.box(x, -0.4, z1 - 1.3 - zz + 1.5, 0.08, 0.08, zz - 1.5, M.iron, { dz: 2.3 }); }
    return S;
  };
  BUILD.stall = sp => {
    const S = scene(), w = sp.w, d = sp.d, cy = -d / 2, col = sp.color || '#E84C6A', pale = mix(col, '#FFFFFF', 0.72), G = GK();
    S.box(0, cy, 0, w - 0.4, d - 0.4, 0.5, M.timberD, { face: (c, F, side, band) => { if (side === 'T') planks(c, F, band, '#9A7452', { bh: 1.2, seed: 3 }); } });
    for (const [x, y] of [[-w / 2 + 0.8, -0.9], [w / 2 - 0.8, -0.9], [-w / 2 + 0.8, -d + 0.9], [w / 2 - 0.8, -d + 0.9]]) post(S, x, y, 0.5, 8.6, 0.55, M.timberL);
    S.box(0, -2.3, 0.5, w - 2.2, 3.6, 3.4, M.timber, { face: (c, F, side, band) => { if (side === 'T') planks(c, F, band, '#B5885C', { bh: 1.1, seed: 2 }); else if (side === 'S') { planks(c, F, band, '#9A6A44', { v: true, bh: 1.0, nails: false, seed: 1 }); c.fillStyle = tone(pale, band); rr(c, F.cx - 2.4, F.cy - 0.9, 4.8, 1.8, 0.25); c.fill(); ink(c, 0.07); c.fillStyle = tone(col, band); c.beginPath(); c.arc(F.cx, F.cy, 0.55, 0, TAU); c.fill(); ink(c, 0.06); } else planks(c, F, band, '#9A6A44', { v: true, bh: 1.0, nails: false }); } });
    // baskets of produce on the counter, a crate beside it
    const R = rnd(sp.entry && sp.entry.x || 4), fruit = ['#FF8A4A', '#E8505A', '#F2C14E', '#8FC95C', '#C76BE0'];
    for (const x of [-3.6, 0.4, 3.8]) { S.lathe(x, -2.3, 3.9, [[1, 0], [1.3, 1.1]], 8, mat('#C9A06A'), { face: (c, F, side, band) => { if (side === 'T') { const fc = fruit[Math.floor(R() * fruit.length)]; for (let i = 0; i < 6; i++) blob(c, F.cx + (R() - 0.5) * 1.4, F.cy + (R() - 0.5) * 1.1, 0.4, tone(fc, band), { lw: 0.07 }); } else { c.strokeStyle = rgba('#6B4A2A', 0.6); c.lineWidth = 0.08; c.beginPath(); for (let y = F.y0 + 0.25; y < F.y1; y += 0.3) { c.moveTo(F.x0, y); c.lineTo(F.x1, y); } for (let x2 = F.x0; x2 < F.x1; x2 += 0.45) { c.moveTo(x2, F.y0); c.lineTo(x2 + 0.1, F.y1); } c.stroke(); } } }); }
    S.box(w / 2 - 2.3, -d + 2.6, 0.5, 2.6, 2.6, 2.4, M.timberL, { face: (c, F, side, band) => { if (side !== 'B') planks(c, F, band, '#B5885C', { bh: 0.8, nails: false, v: side !== 'T' }); } });
    // the awning: a striped slab sloping to the front, a scalloped fringe hanging from its edge, the sign swinging under it
    const b = 0.32, L = (d + 1.6) / Math.cos(b), n = [0, Math.sin(b), Math.cos(b)], zB = 9.1, mid = [0, cy, zB - (d + 1.6) / 2 * Math.tan(b) + (d / 2 + 0.8) * Math.tan(b) - ((d + 1.6) / 2) * Math.tan(b) + 0.6];
    const Mh = G.block(w / 2 + 1.2, L / 2, 0.22);
    S.add(Mh, { t: G.sub(mid, G.mul(n, 0.11)), R: rx(-b) }, { mats: [mat(col)], dz: 2, face: (c, F, side, band) => { if (side === 'T' || side[0] === 's') { stripes(c, F, band, col, pale, 1.5); c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(F.x0, F.y0, F.w, 0.5); } } });
    const zF = mid[2] - (L / 2) * Math.sin(b), yFr = cy + L / 2 * Math.cos(b);
    S.flat(cy * CE + 9 * SE + 2, (c, cam, T) => { const p0 = cam.P([-w / 2 - 1.2, yFr, zF]), p1 = cam.P([w / 2 + 1.2, yFr, zF]), nS = Math.round((w + 2.4) / 1.5), sw = (p1[0] - p0[0]) / nS, sh2 = T * 0.55; c.beginPath(); c.moveTo(p0[0], p0[1] - 1); for (let i = 0; i < nS; i++) { c.arc(p0[0] + sw * (i + 0.5), p0[1], sw / 2, Math.PI, 0, true); } c.lineTo(p1[0], p1[1] - 1); c.closePath(); c.fillStyle = sh(pale, -0.06); c.fill(); c.strokeStyle = INK; c.lineWidth = Math.max(1.2, T * 0.1); c.stroke(); void sh2; });
    const sign = { cv: null, T: 0 }; S.liveAdd((c, cam, t, o) => { const T = cam.T; if (!sign.cv || Math.abs(sign.T - T) > 0.5) { sign.cv = signSprite(sh(col, -0.12), null, 3.2, 1.9, T * 1.4); sign.T = T; } const p = cam.P([w / 2 - 2.6, yFr, zF - 0.5]), ang = Math.sin(t * 1.7 + (sp.entry ? sp.entry.x : 0) * 0.01) * 0.1; c.save(); c.translate(p[0], p[1]); c.rotate(ang); c.strokeStyle = '#3F3C44'; c.lineWidth = Math.max(1, T * 0.1); c.beginPath(); c.moveTo(-T * 1.2, 0); c.lineTo(-T * 1.2, T * 0.8); c.moveTo(T * 1.2, 0); c.lineTo(T * 1.2, T * 0.8); c.stroke(); c.drawImage(sign.cv, -T * 1.6, T * 0.8, T * 3.2 + 6 / 1.4, T * 1.9 + 6 / 1.4); c.fillStyle = '#FFFFFF'; c.globalAlpha = 0.9; c.beginPath(); c.arc(0, T * 1.75, T * 0.42, 0, TAU); c.fill(); c.restore(); });
    return S;
  };
  BUILD.workshop = sp => {
    const S = scene(), w = sp.w, d = sp.d, yF = -2.8, yB = -d + 0.8, cy = (yF + yB) / 2, dd = yF - yB, wall = w - 1.2;
    S.box(0, cy, 0, wall + 0.4, dd + 0.4, 1.0, M.stoneD, { face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, C.stoneD, { ch: 0.7, sw: 1.5 }); } });
    const h1 = 4.2, h2 = 5.6;
    S.box(0, cy, 1, wall, dd, h1, M.stone, { face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, C.stone, { ch: 1.0, sw: 2.2, moss: true, seed: 4 }); } });
    S.box(0, cy, 1 + h1, wall, dd, h2, M.plaster, { face: (c, F, side, band) => { if (side === 'T') return; plaster(c, F, band, 8); const posts = []; for (let x = F.x0 + 0.25; x <= F.x1; x += (F.w - 0.5) / Math.max(1, Math.round(F.w / 5))) posts.push(x); timberFrame(c, F, band, { posts, rails: [F.y0 + 0.25, F.y1 - 0.25], braces: posts.slice(0, -1).map((x, i) => [x, F.y1 - 0.3, posts[i + 1], F.y0 + 0.3]) });
      if (side === 'S') windowD(c, F.x1 - 6.2, F.y0 + 1.2, 3, 2.8, band, { frame: C.cream }); if (side === 'W') windowD(c, F.cx - 1.4, F.y0 + 1.2, 2.8, 2.8, band, { frame: C.cream }); } });
    S.light(wall / 2 - 4.7, yF, 1 + h1 + 2.6, 3); S.light(-wall / 2, cy, 1 + h1 + 2.6, 3);
    // the big doors: one leaf open, as a separate slab standing out from the wall
    S.box(-2.2, yF + 0.02, 1, 7.2, 0.02, h1 + 2.8, M.stone, { dz: 0.4, face: (c, F, side, band) => { if (side !== 'S') return; recess(c, F.x0, F.y0, F.w, F.h, band, '#241A1C', 0.4); c.fillStyle = 'rgba(255,140,60,.25)'; c.fillRect(F.x0 + 0.4, F.y0 + 0.4, F.w - 0.8, F.h - 0.4); c.fillStyle = tone(C.timber, band); planks(c, { x0: F.cx, x1: F.x1, y0: F.y0, y1: F.y1, w: F.w / 2, h: F.h, cx: 0, cy: 0 }, band, '#8C6240', { v: true, bh: 1.1, nails: false }); c.fillStyle = tone(C.iron, band); c.fillRect(F.cx + 0.3, F.y0 + 1.2, F.w / 2 - 0.6, 0.3); c.fillRect(F.cx + 0.3, F.y1 - 1.6, F.w / 2 - 0.6, 0.3); c.beginPath(); c.rect(F.x0, F.y0, F.w, F.h); ink(c, 0.09); } });
    S.add(GK().block(0.14, 1.75, (h1 + 2.8) / 2), { t: [-5.9, yF + 1.8, 1 + (h1 + 2.8) / 2] }, { mats: [mat('#8C6240')], dz: 0.6, face: (c, F, side, band) => { if (side === 'E' || side === 'W') { planks(c, F, band, '#8C6240', { v: true, bh: 1.1, nails: false }); c.fillStyle = tone(C.iron, band); c.fillRect(F.x0 + 0.3, F.y0 + 1.2, F.w - 0.6, 0.3); c.fillRect(F.x0 + 0.3, F.y1 - 1.6, F.w - 0.6, 0.3); } } });
    const a = 0.5, over = 1.6, z0 = 1 + h1 + h2 - 0.1;
    const gh = ((yF - yB) / 2) * Math.tan(a);
    S.add(extX([[yF, z0 + over * Math.tan(a)], [cy, z0 + over * Math.tan(a) + gh], [yB, z0 + over * Math.tan(a)]], -wall / 2, wall / 2), {}, { mats: [M.plaster], dz: 0.3, face: (c, F, side, band) => { if (side !== 'E' && side !== 'W') return; plaster(c, F, band, 7); timberFrame(c, F, band, { posts: [F.cx], rails: [F.y1 - 0.3, F.y1 - 2.6], braces: [[F.cx, F.y0 + 0.6, F.cx - 4.5, F.y1 - 0.3], [F.cx, F.y0 + 0.6, F.cx + 4.5, F.y1 - 0.3]], pw: 0.38 }); } });
    const roof = gableX(S, -wall / 2, wall / 2, yF, yB, z0, over, a, 0.6, M.slate, '#6B6F7C', { dz: 0.6, tileO: { flat: true, rh: 1.0, tw: 1.4 } });
    // the stone hearth chimney, broad, up the east gable; a lean-to with a workbench feel at the west
    S.box(wall / 2 + 1.2, cy + 2, 0, 2.6, 5, z0 + 1, M.stoneD, { dz: 1, face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, C.stoneD, { ch: 0.9, sw: 1.6, seed: 3 }); } });
    chimney(S, wall / 2 + 1.2, cy + 0.6, cy + 3.4, roof.zAt(cy) + 2.4, () => z0 + 1, { dz: 2, hw: 1.2 });
    S.liveAdd((c, cam, t, o) => { if (!o.flag) return; const p = cam.P([0, yF, z0 + 2]); glow(c, p[0], p[1], cam.T * 1.4, '#FFD27A', 0.3); });
    return S;
  };
  // the Tower's gate: two stone towers and an arch between them, its opening toward the west (the walker comes from there)
  BUILD.gate = sp => {
    const S = scene(), W = Math.min(11, Math.max(sp.w, sp.d)), D = 4.4, cy = -D / 2 - 4.2, st = mat('#5E5868'), stD = mat('#403A48'), G = GK();
    const face = (c, F, side, band) => { if (side !== 'T') stones(c, F, band, '#5E5868', { ch: 1.2, sw: 2.4, gap: 0.1, seed: 2 }); else { c.fillStyle = tone('#4A4452', band); c.fillRect(F.x0, F.y0, F.w, F.h); } };
    const tw = 3.6, th = 12.5, gap = W - tw * 2 + 1.0, ax = gap / 2, yF = cy + D / 2;
    for (const x of [-ax - tw / 2, ax + tw / 2]) { S.box(x, cy, 0, tw, D, th, st, { face }); for (let i = -1; i <= 1; i++) { S.box(x + i * tw * 0.34, cy, th, tw * 0.28, D, 1.3, stD, { dz: 1 }); S.box(x, cy + i * D * 0.34, th, tw, D * 0.28, 1.3, stD, { dz: 1 }); }
      S.box(x, yF - 0.01, 6.0, 1.1, 0.02, 2.2, st, { dz: 0.5, face: (c, F, side, band) => { if (side !== 'S') return; recess(c, F.x0, F.y0, F.w, F.h, band, '#1A1418', 0.25); c.fillStyle = rgba('#FF7A3A', 0.6); c.fillRect(F.x0 + 0.3, F.cy, F.w - 0.6, F.h / 2 - 0.3); } }); S.light(x, yF, 7, 2.4, '#FF9A50'); }
    // the arch header: a round arch cut from its underside
    const prof = [[-ax - 0.6, th], [ax + 0.6, th], [ax + 0.6, 7.4]]; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; prof.push([Math.cos(a) * ax, 7.4 + Math.sin(a) * ax * 0.55]); } prof.push([-ax - 0.6, 7.4]);
    S.add(extY(prof, yF - D, yF), {}, { mats: [st], dz: 1.5, face: (c, F, side, band) => { if (side === 'S') { stones(c, F, band, '#5E5868', { ch: 1.2, sw: 2.2, gap: 0.1, seed: 5 }); c.strokeStyle = rgba('#CFC2DC', 0.5); c.lineWidth = 0.25; c.beginPath(); c.moveTo(F.cx - ax, F.y1); c.lineTo(F.cx - ax, F.y1 - 0.3); c.quadraticCurveTo(F.cx, F.y0 + 1.5, F.cx + ax, F.y1 - 0.3); c.lineTo(F.cx + ax, F.y1); c.stroke(); } else if (side === 'T') { c.fillStyle = tone('#4A4452', band); c.fillRect(F.x0, F.y0, F.w, F.h); } } });
    for (let i = -2; i <= 2; i++) S.box(i * ax * 0.42, cy, th, ax * 0.3, D * 0.9, 1.3, stD, { dz: 2.5 });
    // the portal: a dark way through, the portcullis's bars, a violet light on the sill
    S.flat((yF + 0.2) * CE + 6 * SE, (c, cam, T) => { const p0 = cam.P([-ax, yF, 0]), p1 = cam.P([ax, yF, 0]), t0 = cam.P([-ax, yF, 7.4]), t1 = cam.P([ax, yF, 7.4]), top = cam.P([0, yF, 7.4 + ax * 0.55]); c.save(); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(t0[0], t0[1]); c.quadraticCurveTo(top[0], top[1] - (t0[1] - top[1]) * 0.9, t1[0], t1[1]); c.lineTo(p1[0], p1[1]); c.closePath(); const g = c.createLinearGradient(0, top[1], 0, p0[1]); g.addColorStop(0, '#0E0A14'); g.addColorStop(1, '#30204A'); c.fillStyle = g; c.fill(); c.clip(); c.strokeStyle = '#2E2A36'; c.lineWidth = Math.max(1.5, T * 0.22); c.beginPath(); for (let k = 1; k < 5; k++) { const x = p0[0] + (p1[0] - p0[0]) * k / 5; c.moveTo(x, top[1] - T); c.lineTo(x, p0[1] + T); } for (let k = 0; k < 5; k++) { const y = p0[1] - T * CE * (1.4 + k * 2.1); c.moveTo(p0[0] - T, y); c.lineTo(p1[0] + T, y); } c.stroke(); c.restore(); glow(c, (p0[0] + p1[0]) / 2, p0[1] - T * 1.5, T * 4, '#9A5CFF', 0.4); });
    S.light(0, yF, 4, 5, '#9A5CFF');
    turnScene(S, Math.PI / 4);
    return S;
  };
  BUILD.riftgate = sp => {
    const S = scene(), w = sp.w, d = sp.d, cy = -d / 2, G = GK(), cm = ['#5C2E9A', '#9A5CFF', '#E9D6FF'], cryst = mat('#9A5CFF', { c: cm, gloss: 1, glint: '#F4E8FF', edge: '#C9A4FF', edgeA: 0.5 });
    S.lathe(0, cy, 0, [[w / 2, 0], [w / 2 - 0.8, 0.9], [w / 2 - 1.8, 1.2]], 10, mat('#4A4458'), { face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, '#4A4458', { ch: 0.5, sw: 1.4 }); else { c.strokeStyle = rgba('#C9A4FF', 0.8); c.lineWidth = 0.16; c.beginPath(); c.arc(F.cx, F.cy, F.w * 0.3, 0, TAU); c.stroke(); c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.moveTo(F.cx + Math.cos(a) * F.w * 0.18, F.cy + Math.sin(a) * F.w * 0.18); c.lineTo(F.cx + Math.cos(a) * F.w * 0.3, F.cy + Math.sin(a) * F.w * 0.3); } c.stroke(); } } });
    const shards = [];
    for (const sgn of [-1, 1]) for (let i = 0; i < 4; i++) { const y = cy + sgn * (d / 2 - 1.6 - i * 0.9), h = 4 + i * 2.6 + (i === 3 ? 1 : 0), r = 0.9 + i * 0.2, lean = sgn * (0.5 - i * 0.14); const Mh = G.bipyramid(5, r, h, 0.8, { seed: i + sgn * 3 + 9, jit: 0.4 }); S.add(Mh, { t: [0, y, 1.1 + 0.6], R: G.rx(lean) }, { mats: [cryst], ink: '#2A1440', lw: 0.1 }); shards.push([y, h]); }
    // the keystone shard floats in the arch, turning; its light fills the opening
    const KEY = G.bipyramid(5, 1.3, 2.6, 2.2, { seed: 4 });
    S.liveAdd((c, cam, t, o) => { const T = cam.T, z = 12.4 + Math.sin(t * 1.2) * 0.35, p = cam.P([0, cy, z]); const base = cam.P([0, cy, 0.5]); glow(c, base[0], base[1] - T * 3, T * 6, '#8E5CFF', 0.3 + 0.1 * Math.sin(t * 2)); glow(c, p[0], p[1], T * 3.2, '#B08CFF', 0.5); G.solid(c, cam, KEY, { R: G.mm(G.rz(t * 0.9), G.rx(0.15)), t: [0, cy, z] }, { mats: [cryst], ink: '#2A1440', lw: 0.1, force: true }); glow(c, p[0], p[1], T * 1.1, '#FFFFFF', 0.6); for (let i = 0; i < 7; i++) { const a = t * 0.8 + i * 0.9, q = cam.P([Math.cos(a) * 2.2, cy + Math.sin(a) * 2.2, 4 + ((t * 0.6 + i * 0.37) % 1) * 7]); glow(c, q[0], q[1], T * 0.45, '#E9D6FF', 0.8); } });
    S.light(0, cy, 6, 6, '#9A5CFF');
    return S;
  };
  // the six mini-game houses keep Pocket Town's colours
  BUILD.hangar = sp => {
    const S = scene(), w = sp.w, d = sp.d, cy = -d / 2, wall = '#DCEBFF', trim = '#7FB6E8', roof = '#4F8FD6', G = GK();
    S.box(0, cy, 0, w - 0.2, d - 0.2, 0.7, mat('#B9C7D6'));
    // a barrel vault: a half polygon pushed along y
    const prof = [], n = 9, rw = w / 2 - 0.6, hh = 9; for (let i = 0; i <= n; i++) { const a = Math.PI * i / n; prof.push([Math.cos(a) * rw, 0.7 + Math.sin(a) * hh]); }
    S.add(extY(prof, -d + 0.6, -0.6), {}, { mats: [mat(roof)], face: (c, F, side, band) => { if (side === 'S' || side === 'N') { c.fillStyle = tone(wall, band); c.fillRect(F.x0, F.y0, F.w, F.h); plaster(c, F, band, 2); if (side === 'S') { recess(c, F.cx - 5, F.y1 - 6.4, 10, 6.4, band, '#2A3040', 0.3); c.fillStyle = tone(trim, band); planks(c, { x0: F.cx - 5, x1: F.cx - 0.4, y0: F.y1 - 6.4, y1: F.y1, w: 4.6, h: 6.4 }, band, trim, { v: true, bh: 1.15, nails: false }); planks(c, { x0: F.cx + 0.4, x1: F.cx + 5, y0: F.y1 - 6.4, y1: F.y1, w: 4.6, h: 6.4 }, band, trim, { v: true, bh: 1.15, nails: false }); c.strokeStyle = tone('#3F6FA8', band); c.lineWidth = 0.3; c.strokeRect(F.cx - 5, F.y1 - 6.4, 10, 6.4); c.beginPath(); c.moveTo(F.cx - 5, F.y1 - 6.4); c.lineTo(F.cx, F.y1 - 3.2); c.lineTo(F.cx - 5, F.y1); c.moveTo(F.cx + 5, F.y1 - 6.4); c.lineTo(F.cx, F.y1 - 3.2); c.lineTo(F.cx + 5, F.y1); c.stroke(); windowD(c, F.cx - 1.6, F.y1 - 10.2, 3.2, 2.4, band, { arch: true, frame: trim }); c.fillStyle = tone('#FFFFFF', band); blob(c, F.cx - 6.5, F.y1 - 8.4, 1.1, tone('#FFFFFF', band), { lw: 0.1 }); blob(c, F.cx - 5.4, F.y1 - 8.9, 0.8, tone('#FFFFFF', band), { lw: 0.1 }); blob(c, F.cx + 6.4, F.y1 - 8.4, 1.1, tone('#FFFFFF', band), { lw: 0.1 }); } }
      else { c.fillStyle = tone(roof, band); c.fillRect(F.x0, F.y0, F.w, F.h); c.strokeStyle = rgba(INK, 0.4); c.lineWidth = 0.08; c.beginPath(); for (let x = F.x0 + 1.5; x < F.x1; x += 2.6) { c.moveTo(x, F.y0); c.lineTo(x, F.y1); } c.stroke(); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(F.x0, F.y0, F.w, 0.2); c.fillStyle = rgba(INK, 0.5); for (let x = F.x0 + 0.7; x < F.x1; x += 2.6) for (const y of [F.y0 + 0.5, F.y1 - 0.5]) { c.beginPath(); c.arc(x, y, 0.1, 0, TAU); c.fill(); } } } });
    S.light(0, -0.6, 2.5, 4.5, '#CFE6FF');
    // a windsock on a pole
    S.cyl(w / 2 - 1.6, -1.2, 0.7, 0.16, 0.12, 13, 6, M.iron);
    S.liveAdd((c, cam, t, o) => { const T = cam.T, x = w / 2 - 1.6, top = 13.7, dir = 1, pts = []; for (let i = 0; i <= 5; i++) { const u = i / 5; pts.push(cam.P([x + dir * u * 3.2, -1.2 + Math.sin(t * 3 + u * 4) * 0.3 * u, top - u * 0.9 - u * u * 0.5])); } for (let i = 0; i < 5; i++) { const r0 = T * (0.55 - i * 0.07), r1 = T * (0.48 - i * 0.07); c.fillStyle = i % 2 ? '#FFFFFF' : '#FF7A3A'; c.beginPath(); c.moveTo(pts[i][0], pts[i][1] - r0); c.lineTo(pts[i + 1][0], pts[i + 1][1] - r1); c.lineTo(pts[i + 1][0], pts[i + 1][1] + r1); c.lineTo(pts[i][0], pts[i][1] + r0); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = Math.max(1, T * 0.08); c.stroke(); } });
    void G; return S;
  };
  BUILD.hedge = sp => {
    const S = scene(), w = sp.w, d = sp.d, cy = -d / 2, wall = '#3E8F4E', light = '#5DB36E', leafy = (c, F, side, band) => { if (side === 'B') return; const R = rnd(side.charCodeAt(0) + 7); c.fillStyle = tone(wall, band); c.fillRect(F.x0, F.y0, F.w, F.h); for (let i = 0; i < F.w * F.h * 1.3; i++) { const x = F.x0 + R() * F.w, y = F.y0 + R() * F.h; c.fillStyle = tone(R() < 0.5 ? light : sh(wall, -0.25), band); c.beginPath(); c.arc(x, y, 0.3 + R() * 0.35, 0, TAU); c.fill(); } for (let i = 0; i < F.w * F.h * 0.5; i++) { c.fillStyle = rgba('#CFF2B0', 0.35 + R() * 0.3); c.beginPath(); c.arc(F.x0 + R() * F.w, F.y0 + R() * F.h * 0.6, 0.18, 0, TAU); c.fill(); } };
    const H = 5.2, t = 2.4;
    // the outer hedges with an arched way in at the front, two inner walls, a rose arch over the entrance
    S.box(0, -d + t / 2, 0, w, t, H, mat(wall), { face: leafy }); S.box(-w / 2 + t / 2, cy, 0, t, d, H, mat(wall), { face: leafy }); S.box(w / 2 - t / 2, cy, 0, t, d, H, mat(wall), { face: leafy });
    S.box(-w / 4 - 2, -t / 2, 0, w / 2 - 4, t, H, mat(wall), { face: leafy }); S.box(w / 4 + 2, -t / 2, 0, w / 2 - 4, t, H, mat(wall), { face: leafy });
    S.box(-w / 6, cy + 1, 0, t, d * 0.45, H - 0.3, mat(wall), { face: leafy }); S.box(w / 6, cy - 2, 0, t, d * 0.45, H - 0.3, mat(wall), { face: leafy });
    S.box(0, cy - 1, 0, w * 0.3, t, H - 0.3, mat(wall), { face: leafy });
    for (const x of [-4.2, 4.2]) S.cyl(x, -1.4, 0, 0.3, 0.3, 7.5, 6, mat('#F2F2EE'));
    S.flat(-1.4 * CE + 8 * SE, (c, cam, T) => { const a = cam.P([-4.2, -1.4, 7.5]), b = cam.P([4.2, -1.4, 7.5]), top = cam.P([0, -1.4, 9.8]); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(top[0], top[1] - T * 1.6, b[0], b[1]); c.strokeStyle = '#F2F2EE'; c.lineWidth = Math.max(2, T * 0.6); c.stroke(); c.strokeStyle = INK; c.lineWidth = Math.max(1, T * 0.1); c.beginPath(); c.moveTo(a[0] - T * 0.3, a[1]); c.quadraticCurveTo(top[0], top[1] - T * 1.9, b[0] + T * 0.3, b[1]); c.stroke(); const R = rnd(3); for (let i = 0; i < 16; i++) { const u = R(), px = a[0] + (b[0] - a[0]) * u, py = a[1] + (top[1] - T * 1.6 - a[1]) * 4 * u * (1 - u) * 0.5 + (R() - 0.5) * T; blob(c, px, py, T * (0.35 + R() * 0.2), R() < 0.6 ? '#F08AA8' : '#F5F0E8', { lw: Math.max(1, T * 0.07) }); } });
    S.box(0, cy, 0, w - 2 * t, d - t, 0.25, mat('#B7A986'), { face: (c, F, side, band) => { if (side === 'T') stones(c, F, band, '#C9BB97', { ch: 1.6, sw: 1.8, gap: 0.12 }); } });
    S.lathe(0, cy - 3, 0.25, [[1.6, 0], [1.2, 0.5], [0.6, 2.2], [1.1, 2.6], [0.3, 3.4], [0.9, 3.8]], 8, mat('#DADBD4'), { dz: 0.4 });
    for (const [x, y] of [[-w / 2 + 1.2, -t * 1.5], [w / 2 - 1.2, -t * 1.5], [-w / 2 + 1.2, -d + t + 1.5], [w / 2 - 1.2, -d + t + 1.5]]) S.lathe(x, y, H, [[1.4, 0], [1.1, 1.2], [0.4, 2.3]], 7, mat(light), { dz: 0.6 });
    return S;
  };
  BUILD.dome = sp => {
    const S = scene(), w = sp.w, d = sp.d, cy = -d / 2, wall = '#4E3F8F', trim = '#2B2456', roof = '#8C7BE0', r = Math.min(w, d) / 2 - 1.2, H = 10;
    S.lathe(0, cy, 0, [[r + 1.4, 0], [r + 1.2, 0.9]], 12, mat('#6E6A86'), { face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, '#6E6A86', { ch: 0.6, sw: 1.4 }); } });
    S.lathe(0, cy, 0.9, [[r, 0], [r - 0.3, H]], 12, mat(wall), { face: (c, F, side, band) => { if (side === 'T') return; plaster(c, F, band, 12); c.fillStyle = tone(trim, band); c.fillRect(F.x0 - 0.1, F.y0, F.w + 0.2, 0.7); c.fillRect(F.x0 - 0.1, F.y1 - 0.8, F.w + 0.2, 0.8); if (side === 'S') doorD(c, F.cx - 1.6, F.y1 - 5.2, 3.2, 5.2, band, { arch: true, col: '#2B2456', frame: '#C9B8FF' }); else if (side !== 'N') windowD(c, F.cx - 1.1, F.cy - 2, 2.2, 2.2, band, { arch: true, frame: '#C9B8FF' }); const R = rnd(side.charCodeAt(0)); for (let i = 0; i < 5; i++) { const x = F.x0 + R() * F.w, y = F.y0 + 1 + R() * 3; c.fillStyle = '#FFE98A'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - Math.PI / 2, rr2 = k % 2 ? 0.14 : 0.32; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fill(); } } });
    S.light(0, cy + r, 4, 3.5, '#C9B8FF'); S.light(-r, cy, 6, 2.5, '#C9B8FF'); S.light(r, cy, 6, 2.5, '#C9B8FF');
    S.lathe(0, cy, 0.9 + H, [[r + 0.9, 0], [r + 0.9, 0.9], [r + 0.3, 1.1]], 12, mat(trim), { dz: 0.5 });
    const rings = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; rings.push([Math.cos(a) * (r + 0.1), Math.sin(a) * (r - 0.6)]); }
    S.lathe(0, cy, 0.9 + H + 1.1, rings, 14, mat(roof, { gloss: 0.35, glint: '#F0E8FF' }), { dz: 1, a0: Math.PI / 14, face: (c, F, side, band) => { if (side === 'B') return; c.strokeStyle = rgba(INK, 0.4); c.lineWidth = 0.08; c.beginPath(); c.moveTo(F.cx, F.y0); c.lineTo(F.cx, F.y1); c.stroke(); if (side === 'sS' || side === 'S') { c.fillStyle = '#1A1430'; c.fillRect(F.cx - 0.55, F.y0 - 2, 1.1, F.h + 4); } } });
    S.add(GK().block(0.5, 0.5, 2.4), { t: [0, cy + 2.2, 0.9 + H + 2.6 + r * 0.5], R: GK().rx(-0.9) }, { mats: [M.brass], dz: 3 });
    S.lathe(0, cy, 0.9 + H + 1.1 + r - 0.6, [[0.5, 0], [0.3, 0.6], [0.05, 1.6]], 6, M.brass, { dz: 3 });
    return S;
  };
  BUILD.mine = sp => {
    const S = scene(), w = sp.w, d = sp.d, cy = -d / 2, rock = '#6B6478', trim = '#4A4458', G = GK();
    const R = rnd(5), rocks = [[0, cy - 1, w / 2 + 0.5, d / 2 - 0.5, 9], [-w / 3, cy + 1, w / 4, d / 3, 5.5], [w / 3, cy - 2, w / 4, d / 3, 6.5], [w / 6, cy + 3, w / 5, d / 4, 3.6]];
    for (const [x, y, rx2, ry2, h] of rocks) { const Mh = G.bipyramid(7, 1, h, 0.5, { seed: Math.floor(R() * 99), jit: 0.5, jitR: 0.4, jitZ: 0.3, sx: rx2, sy: ry2 }); S.add(Mh, { t: [x, y, 0.4] }, { mats: [mat(rock)], face: (c, F, side, band) => { if (side === 'B') return; const Rr = rnd(F.w * 7 | 0); for (let i = 0; i < 5; i++) { c.strokeStyle = rgba(INK, 0.25); c.lineWidth = 0.08; c.beginPath(); c.moveTo(F.x0 + Rr() * F.w, F.y0 + Rr() * F.h); c.lineTo(F.x0 + Rr() * F.w, F.y0 + Rr() * F.h); c.stroke(); } } }); }
    // the portal: posts, lintel, a dark mouth with rails coming out, a lantern
    const pw = 6, ph = 5.6, yP = -1.6;
    for (const x of [-pw / 2, pw / 2]) post(S, x, yP, 0, ph, 0.9, M.timber, { dz: 6 });
    S.box(0, yP, ph, pw + 2.2, 1.0, 0.9, M.timber, { dz: 6.5, face: (c, F, side, band) => { if (side === 'S') planks(c, F, band, C.timber, { bh: 0.9, nails: true }); } });
    S.box(0, yP - 0.3, 0, pw - 0.9, 0.05, ph, mat('#1A1420'), { dz: 5.9, face: (c, F, side, band) => { if (side !== 'S') return; const g = c.createLinearGradient(0, F.y0, 0, F.y1); g.addColorStop(0, '#0C0812'); g.addColorStop(1, '#2A2238'); c.fillStyle = g; c.fillRect(F.x0, F.y0, F.w, F.h); c.strokeStyle = '#6A6478'; c.lineWidth = 0.14; c.beginPath(); c.moveTo(F.cx - 0.9, F.y1); c.lineTo(F.cx - 0.5, F.y1 - 1.6); c.moveTo(F.cx + 0.9, F.y1); c.lineTo(F.cx + 0.5, F.y1 - 1.6); c.stroke(); } });
    S.box(0, 0.9 - 2.4, 0, pw * 0.7, 4.8, 0.2, mat('#6A6478'), { dz: 0.2, face: (c, F, side, band) => { if (side !== 'T') return; c.strokeStyle = tone('#3A3644', band); c.lineWidth = 0.24; c.beginPath(); c.moveTo(F.cx - 1, F.y0); c.lineTo(F.cx - 1, F.y1); c.moveTo(F.cx + 1, F.y0); c.lineTo(F.cx + 1, F.y1); c.stroke(); c.strokeStyle = tone(C.timber, band); c.lineWidth = 0.4; c.beginPath(); for (let y = F.y0 + 0.4; y < F.y1; y += 0.9) { c.moveTo(F.cx - 1.5, y); c.lineTo(F.cx + 1.5, y); } c.stroke(); } });
    S.box(-pw / 2 - 2.6, -2.4, 0.2, 2.6, 2.2, 1.9, M.iron, { dz: 0.5, face: (c, F, side, band) => { if (side === 'T') { const Rr = rnd(2); for (let i = 0; i < 6; i++) blob(c, F.cx + (Rr() - 0.5) * 1.6, F.cy + (Rr() - 0.5) * 1.2, 0.45, tone(['#8FD3FF', '#C9A4FF', '#FFD27A'][i % 3], band), { lw: 0.07 }); } else { c.strokeStyle = rgba('#8A8694', 0.6); c.lineWidth = 0.14; c.strokeRect(F.x0 + 0.2, F.y0 + 0.2, F.w - 0.4, F.h - 0.4); } } });
    for (const x of [-pw / 2 - 3.4, -pw / 2 - 1.8]) S.cyl(x, -1.2, 0, 0.55, 0.55, 0.25, 8, M.iron, { dz: 0.6 });
    const gem = mat('#C9A4FF', { c: ['#6A3FB8', '#B48CFF', '#F0E6FF'], gloss: 1 });
    for (const [x, y, z, h, a] of [[-w / 3 + 1, cy - 3, 4.5, 4.2, -0.3], [w / 3, cy - 4, 5.5, 5, 0.25], [w / 3 + 3, cy, 3.6, 3.4, 0.6], [-3, cy - 6, 8, 3.6, 0]]) S.add(G.bipyramid(5, 0.9, h, 0.6, { seed: x | 0, jit: 0.3 }), { t: [x, y, z], R: G.mm(G.ry(a), G.rx(a * 0.5)) }, { mats: [gem], ink: '#2A1440', dz: 4 });
    lantern(S, pw / 2 + 0.9, yP + 0.6, ph - 2.4, { bracket: 0.8 });
    return S;
  };
  BUILD.tent = sp => {
    const S = scene(), w = sp.w, d = sp.d, cy = -d / 2, wall = '#F2C98A', trim = '#B5803F', roof = '#D9483B', r = Math.min(w, d) / 2 - 0.4, h = 5.4, G = GK();
    S.lathe(0, cy, 0, [[r, 0], [r, h]], 10, mat(wall), { a0: Math.PI / 10, face: (c, F, side, band) => { if (side === 'T') return; stripes(c, F, band, wall, sh(wall, 0.12), 2.2); c.fillStyle = tone(trim, band); c.fillRect(F.x0 - 0.1, F.y1 - 0.5, F.w + 0.2, 0.5); if (side === 'S') { c.fillStyle = '#4A2A1E'; c.beginPath(); c.moveTo(F.cx - 1.8, F.y1); c.lineTo(F.cx, F.y1 - 4.2); c.lineTo(F.cx + 1.8, F.y1); c.closePath(); c.fill(); c.fillStyle = tone(sh(wall, -0.15), band); c.beginPath(); c.moveTo(F.cx - 2.4, F.y1); c.lineTo(F.cx - 0.3, F.y1 - 4.4); c.lineTo(F.cx - 1.2, F.y1 - 1.6); c.closePath(); c.fill(); c.beginPath(); c.moveTo(F.cx + 2.4, F.y1); c.lineTo(F.cx + 0.3, F.y1 - 4.4); c.lineTo(F.cx + 1.2, F.y1 - 1.6); c.closePath(); c.fill(); } } });
    S.lathe(0, cy, h - 0.1, [[r + 1.2, 0], [r + 1.0, 0.5]], 10, mat(trim), { a0: Math.PI / 10, dz: 0.5 });
    S.add(G.pyramid(10, r + 1.2, 7.5, { a0: Math.PI / 10 }), { t: [0, cy, h + 0.4] }, { mats: [mat(roof)], dz: 1, face: (c, F, side, band, fr, i) => { if (side === 'B') return; c.fillStyle = tone(i % 2 ? roof : '#F7EBD8', band); c.fillRect(F.x0 - 1, F.y0 - 1, F.w + 2, F.h + 2); c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(F.x0 - 1, F.y1 - 0.6, F.w + 2, 0.7); } });
    // the scallop round the roof's edge, the pennant on top, a boulder and a target in front
    S.flat(cy * CE + (h + 0.4) * SE + 0.6, (c, cam, T) => { const pts = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * TAU + Math.PI / 10; pts.push(cam.P([Math.cos(a) * (r + 1.3), cy + Math.sin(a) * (r + 1.3), h + 0.4])); } for (let i = 0; i < 10; i++) { const p = pts[i], q = pts[i + 1]; if ((p[1] + q[1]) / 2 < cam.P([0, cy, h + 0.4])[1]) continue; for (let k = 0; k < 3; k++) { const x0 = p[0] + (q[0] - p[0]) * k / 3, y0 = p[1] + (q[1] - p[1]) * k / 3, x1 = p[0] + (q[0] - p[0]) * (k + 1) / 3, y1 = p[1] + (q[1] - p[1]) * (k + 1) / 3; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo((x0 + x1) / 2, (y0 + y1) / 2 + T * 0.55); c.closePath(); c.fillStyle = k % 2 ? roof : '#F7EBD8'; c.fill(); c.strokeStyle = INK; c.lineWidth = Math.max(1, T * 0.08); c.stroke(); } } });
    pennant(S, 0, cy, h + 7.6, 2.2, '#F2C14E', { w: 1.6, h: 1.1, side: 1 });
    S.add(G.bipyramid(7, 1, 1.6, 0.6, { seed: 8, jit: 0.5, jitR: 0.4, sx: 2.2, sy: 1.6 }), { t: [-w / 2 + 2.6, -2.2, 0.5] }, { mats: [mat('#8A8077')] });
    S.add(G.block(0.1, 1.4, 1.4), { t: [w / 2 - 2.6, -1.8, 2.4], R: G.rz(Math.PI / 2) }, { mats: [mat('#F7EBD8')], dz: 0.8, face: (c, F, side, band) => { if (side !== 'S') return; for (let i = 3; i >= 0; i--) { c.fillStyle = tone(i % 2 ? '#F7EBD8' : roof, band); c.beginPath(); c.arc(F.cx, F.cy, 0.35 * (i + 1), 0, TAU); c.fill(); } } });
    for (const x of [w / 2 - 3.2, w / 2 - 2.0]) S.add(G.block(0.14, 0.14, 1.6), { t: [x, -1.0, 1.4], R: G.rx(0.35) }, { mats: [M.timber] });
    return S;
  };
  BUILD.gym = sp => {
    const S = scene(), w = sp.w, d = sp.d, yF = -1.2, yB = -d + 0.6, cy = (yF + yB) / 2, wall = '#FFE9A8', trim = '#E07A3F', roof = '#6CC15A', wallW = w - 1.2, h = 8;
    S.box(0, cy, 0, wallW + 0.4, yF - yB + 0.4, 0.8, mat('#C9B48A'));
    S.box(0, cy, 0.8, wallW, yF - yB, h, mat(wall), { face: (c, F, side, band) => { if (side === 'T') return; plaster(c, F, band, 14); c.fillStyle = tone(trim, band); c.fillRect(F.x0, F.y0, F.w, 0.6); c.fillRect(F.x0, F.y1 - 1.2, F.w, 1.2); c.strokeStyle = rgba(INK, 0.45); c.lineWidth = 0.07; c.strokeRect(F.x0, F.y1 - 1.2, F.w, 1.2);
      if (side === 'S') { doorD(c, F.cx - 2.2, F.y1 - 5.6, 4.4, 5.6, band, { col: trim, frame: '#7A3A1A' }); windowD(c, F.x0 + 2.2, F.y0 + 1.6, 4.4, 3, band, { frame: '#FFFFFF' }); windowD(c, F.x1 - 6.6, F.y0 + 1.6, 4.4, 3, band, { frame: '#FFFFFF' }); for (let i = 0; i < 3; i++) { c.fillStyle = tone(['#F26B8A', '#4FA3E0', '#F2C14E'][i], band); c.beginPath(); c.arc(F.cx - 6 + i * 6, F.y0 + 1.0, 0.5, 0, TAU); c.fill(); ink(c, 0.06); } }
      else if (side !== 'N') windowD(c, F.cx - 2, F.y0 + 1.6, 4, 3, band, { frame: '#FFFFFF' }); } });
    S.light(-wallW / 2 + 4.4, yF, 5.5, 3.6); S.light(wallW / 2 - 4.4, yF, 5.5, 3.6); S.light(-wallW / 2, cy, 5.5, 3.2); S.light(wallW / 2, cy, 5.5, 3.2);
    const a = 0.42, over = 1.5, z0 = 0.8 + h - 0.1, gh = ((yF - yB) / 2) * Math.tan(a);
    S.add(extX([[yF, z0 + over * Math.tan(a)], [cy, z0 + over * Math.tan(a) + gh], [yB, z0 + over * Math.tan(a)]], -wallW / 2, wallW / 2), {}, { mats: [mat(wall)], dz: 0.3, face: (c, F, side, band) => { if (side !== 'E' && side !== 'W') return; plaster(c, F, band, 7); windowD(c, F.cx - 1.1, F.y1 - 3, 2.2, 2.2, band, { arch: true, frame: '#FFFFFF' }); } });
    gableX(S, -wallW / 2, wallW / 2, yF, yB, z0, over, a, 0.6, mat(roof), roof, { dz: 0.6, fascia: '#FFFFFF', tileO: { flat: true, rh: 1.0, tw: 1.6 } });
    // the hopscotch stoop and a flag
    S.box(0, (yF + 0.1) / 2 - 0.1, 0, 12, -yF + 0.2, 0.5, mat('#D9CBA6'), { face: (c, F, side, band) => { if (side !== 'T') return; c.strokeStyle = tone('#E07A3F', band); c.lineWidth = 0.14; for (let i = 0; i < 4; i++) c.strokeRect(F.cx - 0.9 + (i % 2 ? -1 : 0) * 0, F.y1 - 0.2 - (i + 1) * 0.8, 1.8, 0.8); } });
    pennant(S, wallW / 2 - 1, yF + 0.6, z0, 5, trim, { w: 1.6, h: 1.2 });
    return S;
  };
  BUILD.greenhouse = sp => {
    const S = scene(), w = sp.w, d = sp.d, cy = -d / 2, glass = mat('#CFEAF2', { a: 0.5, c: ['#8CBFD4', '#CFEAF2', '#F2FBFF'], gloss: 0.9, glint: '#FFFFFF' }), frame = mat('#F4F4F0'), wallW = w - 1, dd = d - 1, h = 6;
    S.box(0, cy, 0, wallW + 0.4, dd + 0.4, 0.8, M.stoneM, { face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, C.stoneM, { ch: 0.7, sw: 1.5 }); } });
    S.box(0, cy, 0.8, wallW - 0.4, dd - 0.4, 1.4, M.timber, { face: (c, F, side, band) => { if (side !== 'T') planks(c, F, band, '#9A7452', { bh: 0.7 }); } });
    // plants inside, drawn before the glass
    const R = rnd(44); for (let i = 0; i < 10; i++) { const x = -wallW / 2 + 2 + R() * (wallW - 4), y = cy - dd / 2 + 2 + R() * (dd - 4), z = 2.2, col = ['#5FA64E', '#3E7A36', '#78B85A'][i % 3]; S.flat(y * CE + 3 * SE, (c, cam, T) => { const p = cam.P([x, y, z]); for (let k = 0; k < 3; k++) blob(c, p[0] + (k - 1) * T * 0.7, p[1] - T * (0.6 + (k % 2) * 0.5), T * 0.8, col, { lw: Math.max(1, T * 0.08) }); blob(c, p[0], p[1] - T * 1.6, T * 0.35, ['#FF8A4A', '#F2C14E', '#E8505A'][i % 3], { lw: Math.max(1, T * 0.06) }); }); }
    const glassFace = (c, F, side, band) => { if (side === 'T' || side === 'B') return; c.strokeStyle = tone('#F4F4F0', band); c.lineWidth = 0.28; c.beginPath(); for (let x = F.x0 + 2.2; x < F.x1; x += 2.2) { c.moveTo(x, F.y0); c.lineTo(x, F.y1); } for (let y = F.y0 + 2; y < F.y1; y += 2) { c.moveTo(F.x0, y); c.lineTo(F.x1, y); } c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 0.1; c.beginPath(); c.moveTo(F.x0 + 0.6, F.y1 - 0.4); c.lineTo(F.x0 + 2.6, F.y0 + 0.4); c.stroke(); if (side === 'S') { c.fillStyle = tone('#F4F4F0', band); c.fillRect(F.cx - 1.6, F.y1 - 4.4, 3.2, 4.4); c.strokeStyle = rgba(INK, 0.7); c.lineWidth = 0.1; c.strokeRect(F.cx - 1.6, F.y1 - 4.4, 3.2, 4.4); c.strokeRect(F.cx - 1.2, F.y1 - 4, 2.4, 3.6); c.beginPath(); c.moveTo(F.cx - 1.2, F.y1 - 2.2); c.lineTo(F.cx + 1.2, F.y1 - 2.2); c.moveTo(F.cx, F.y1 - 4); c.lineTo(F.cx, F.y1); c.stroke(); } };
    S.box(0, cy, 2.2, wallW - 0.4, dd - 0.4, h, glass, { dz: 0.5, face: glassFace, lw: 0.1 });
    for (const [x, y] of [[-wallW / 2 + 0.3, cy + dd / 2 - 0.3], [wallW / 2 - 0.3, cy + dd / 2 - 0.3], [-wallW / 2 + 0.3, cy - dd / 2 + 0.3], [wallW / 2 - 0.3, cy - dd / 2 + 0.3]]) post(S, x, y, 2.2, h, 0.5, frame, { dz: 0.6 });
    const a = 0.5, over = 0.6, zr = 2.2 + h, half = dd / 2 + over, H = half * Math.tan(a);
    S.add(extX([[cy + half, zr], [cy, zr + H], [cy - half, zr]], -wallW / 2 - over, wallW / 2 + over), {}, { mats: [glass], dz: 1, lw: 0.1, face: (c, F, side, band) => { if (side === 'E' || side === 'W') { c.strokeStyle = tone('#F4F4F0', band); c.lineWidth = 0.28; c.beginPath(); c.moveTo(F.cx, F.y0); c.lineTo(F.cx, F.y1); c.moveTo(F.x0, F.y1 - 0.14); c.lineTo(F.x1, F.y1 - 0.14); c.stroke(); } else glassFace(c, F, 'E', band); } });
    S.box(0, cy, zr + H - 0.25, wallW + over * 2 + 0.3, 0.5, 0.4, frame, { dz: 1.5 });
    return S;
  };

  /* ---- props ---- */
  Object.assign(DEF, { bigtree: [160, 60], fountain: [110, 80], bench: [60, 28], lanternpost: [24, 24], well: [60, 60], woodpile: [60, 36], flowerbed: [70, 44], trellis: [56, 16], cart: [64, 40], scarecrow: [30, 20], dummy: [30, 22], banner: [20, 20], rack: [54, 20], crystal: [36, 30], pool: [90, 64], torii: [64, 20], cookpot: [44, 32], crates: [44, 32], baskets: [44, 30], workbench: [60, 30], anvil: [30, 24], lumber: [64, 36], picnic: [70, 46], reeds: [30, 20], rocks: [54, 40], telescope: [30, 30], flowerring: [70, 70], readingbench: [64, 30], plot: [90, 70], greenhouse: [220, 120], sculpture: [70, 50], floatcrystal: [40, 36], runestone: [34, 26], glowshrooms: [36, 26], windchime: [20, 20], fairylights: [60, 60], wishingstar: [56, 44], lilypads: [60, 40], stonelantern: [26, 26] });
  const ring = (c, x, y, r0, r1, col) => { c.beginPath(); c.arc(x, y, r1, 0, TAU); c.arc(x, y, r0, 0, TAU, true); c.fillStyle = col; c.fill('evenodd'); };
  const endGrain = (c, F, band) => { c.fillStyle = tone('#C9A070', band); c.beginPath(); c.arc(F.cx, F.cy, F.w / 2, 0, TAU); c.fill(); c.strokeStyle = rgba('#6B4A2A', 0.7); c.lineWidth = 0.06; for (let r = F.w * 0.1; r < F.w / 2; r += F.w * 0.12) { c.beginPath(); c.arc(F.cx + 0.05, F.cy, r, 0, TAU); c.stroke(); } c.strokeStyle = rgba(INK, 0.5); c.lineWidth = 0.07; c.beginPath(); c.moveTo(F.cx, F.cy); c.lineTo(F.cx + F.w * 0.3, F.cy - F.w * 0.25); c.stroke(); };
  const bark = (c, F, side, band) => { if (side === 'T' || side === 'B') { endGrain(c, F, band); return; } const R = rnd(F.h * 3 | 0); c.strokeStyle = rgba('#3A2414', 0.5); c.lineWidth = 0.08; c.beginPath(); for (let i = 0; i < F.w * 2 + 2; i++) { const x = F.x0 + R() * F.w; c.moveTo(x, F.y0 + R() * F.h * 0.3); c.lineTo(x + (R() - 0.5) * 0.3, F.y1 - R() * F.h * 0.3); } c.stroke(); };
  // a log lying along x (or y when o.y)
  const log = (S, x, y, z, r, L, o) => { o = o || {}; const G = GK(), R = o.y ? G.rx(-Math.PI / 2) : G.ry(Math.PI / 2); return S.add(cylMesh(r, r * 0.92, L, 9), { t: [x - (o.y ? 0 : L / 2), y - (o.y ? L / 2 : 0), z], R }, { mats: [mat(o.col || '#8A5E3C')], face: bark, dz: o.dz || 0 }); };
  // a flower standing in the ground, 2D, cel shaded, at a model point
  function flower(c, cam, x, y, z, col, h, o) { const T = cam.T, b = cam.P([x, y, z]), tp = cam.P([x, y, z + h]); c.strokeStyle = o && o.stem || '#3E7A36'; c.lineWidth = Math.max(1, T * 0.12); c.beginPath(); c.moveTo(b[0], b[1]); c.quadraticCurveTo(b[0] + T * 0.2, (b[1] + tp[1]) / 2, tp[0], tp[1]); c.stroke(); c.fillStyle = '#5FA64E'; c.beginPath(); c.ellipse(b[0] + T * 0.25, b[1] - T * h * 0.3, T * 0.32, T * 0.14, -0.6, 0, TAU); c.fill(); if (o && o.petals) { for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; blob(c, tp[0] + Math.cos(a) * T * 0.26, tp[1] + Math.sin(a) * T * 0.22, T * 0.2, col, { lw: Math.max(0.8, T * 0.05) }); } blob(c, tp[0], tp[1], T * 0.16, '#FFE27A', { lw: Math.max(0.8, T * 0.05) }); } else blob(c, tp[0], tp[1], T * (o && o.r || 0.32), col, { lw: Math.max(1, T * 0.07) }); }
  const FLOWERS = ['#F26B8A', '#FFD54F', '#F49AC1', '#FF8A65', '#FFFFFF', '#C98BF0', '#6FB7F0'];

  BUILD.bigtree = sp => {
    const S = scene(), cy = -sp.d / 2, G = GK();
    S.lathe(0, cy, 0, [[3.6, 0], [2.6, 1.4], [2.0, 7], [1.8, 12]], 10, mat('#7A5236'), { face: bark });
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.4; S.add(G.pyramid(3, 1.1, 2.4, { a0: a }), { t: [Math.cos(a) * 3.3, cy + Math.sin(a) * 3.3 * SE, 0], R: G.mm(G.rz(a), G.ry(1.2)) }, { mats: [mat('#6B4630')], dz: -0.2 }); }
    const limbs = [[0.3, 12, 5.5, 0.9], [2.4, 11, 6, 1.0], [4.5, 11.5, 5, 0.85], [-1.2, 11.5, 5.5, 0.9], [-2.8, 10.5, 6, 0.95], [1.5, 11, 4, 0.6]];
    for (const [a, z, L, r] of limbs) { const dir = G.norm([Math.cos(a) * 0.8, Math.sin(a) * 0.8, 1]); S.add(cylMesh(r, r * 0.6, L, 7), { t: [0, cy, z], R: G.mm(G.rz(a), G.ry(Math.PI / 2 - 0.9)) }, { mats: [mat('#7A5236')], face: bark, dz: 1 }); void dir; }
    // the crown: pink blossom clusters on a shell, far to near
    const R = rnd(77), cl = []; for (let i = 0; i < 26; i++) { const a = R() * TAU, el = -0.25 + R() * 1.4, rad = 10 + R() * 2.2, x = Math.cos(a) * Math.cos(el) * rad * 1.15, y = cy + Math.sin(a) * Math.cos(el) * rad, z = 15.5 + Math.sin(el) * rad * 0.8, r = 3.2 + R() * 2.2; cl.push([x, y, z, r, R() < 0.3 ? '#F7B6CC' : R() < 0.7 ? '#F08AA8' : '#E96F95']); }
    cl.push([0, cy, 17, 7, '#EE7FA0']);
    for (const [x, y, z, r, col] of cl) { const dep = y * CE + z * SE; const p = { flat: (c, cam, T) => { const q = cam.P([x, y, z]); blob(c, q[0], q[1], r * T, col, { lw: Math.max(1.2, T * 0.12), sy: 0.86 }); const Rr = rnd((x * 7 + z * 3) | 0); for (let k = 0; k < 4; k++) { const fx = q[0] + (Rr() - 0.5) * r * T * 1.2, fy = q[1] + (Rr() - 0.6) * r * T * 1.0; c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(fx, fy, T * 0.35, 0, TAU); c.fill(); } }, dep, bb: [x, y, z, r] }; S.parts.push(p); }
    S.bb = cl.map(([x, y, z, r]) => [x, y, z, r * 1.1]);
    return S;
  };
  BUILD.fountain = sp => {
    const S = scene(), cy = -sp.d / 2, r = sp.w / 2 - 0.2, st = mat('#CFC8D6'), stoneF = (c, F, side, band) => { if (side !== 'T') { stones(c, F, band, '#CFC8D6', { ch: 0.8, sw: 1.8, gap: 0.08 }); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(F.x0, F.y0, F.w, 0.25); } };
    const water = mat('#7FC4E0', { c: ['#4C9BC2', '#7FC4E0', '#B7E6F6'], a: 0.92 });
    S.lathe(0, cy, 0, [[r + 0.6, 0], [r + 0.4, 0.5]], 8, st, { a0: Math.PI / 8 });
    S.lathe(0, cy, 0.5, [[r, 0], [r, 1.5], [r - 0.3, 1.8]], 8, st, { a0: Math.PI / 8, face: stoneF });
    S.lathe(0, cy, 1.7, [[r - 1.1, 0], [r - 1.1, 0.35]], 8, water, { a0: Math.PI / 8, inner: false, dz: 1.2, face: (c, F, side, band) => { if (side !== 'T') return; c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 0.1; c.beginPath(); c.arc(F.cx, F.cy, F.w * 0.25, 0.2, 1.4); c.arc(F.cx, F.cy, F.w * 0.36, 3.4, 4.4); c.stroke(); } });
    S.lathe(0, cy, 1.8, [[1.9, 0], [1.3, 0.5], [1.1, 4.0], [1.6, 4.6]], 8, st, { dz: 1 });
    S.lathe(0, cy, 6.4, [[0.9, 0], [3.4, 1.0], [3.3, 1.4]], 10, st, { dz: 1.2, face: (c, F, side, band) => { if (side === 'T' || side === 'B') return; c.strokeStyle = rgba(INK, 0.35); c.lineWidth = 0.08; c.beginPath(); for (let x = F.x0 + 0.5; x < F.x1; x += 0.8) { c.moveTo(x, F.y0); c.lineTo(x - 0.2, F.y1); } c.stroke(); } });
    S.lathe(0, cy, 6.4 + 1.05, [[2.8, 0], [2.8, 0.25]], 10, water, { inner: false, dz: 1.6 });
    S.lathe(0, cy, 7.8, [[0.8, 0], [0.6, 0.4], [0.5, 2.2]], 8, st, { dz: 1.5 });
    S.lathe(0, cy, 10, [[0.2, 0], [0.75, 0.35], [0.9, 0.9], [0.7, 1.45], [0.2, 1.8]], 8, mat('#DCD6E4', { gloss: 0.6 }), { dz: 1.6 });
    S.liveAdd((c, cam, t, o) => { const T = cam.T, p = cam.P([0, cy, 11.6]); for (let i = 0; i < 6; i++) { const u = ((t * 0.8 + i / 6) % 1), a = i / 6 * TAU + t * 0.3, x = Math.cos(a) * u * 2.6, y = cy + Math.sin(a) * u * 2.6, z = 11.6 + 2.2 * u * (1 - u) * 3 - u * u * 3.6; const q = cam.P([x, y, Math.max(7.8, z)]); c.fillStyle = 'rgba(230,248,255,.85)'; c.beginPath(); c.arc(q[0], q[1], T * 0.18, 0, TAU); c.fill(); } glow(c, p[0], p[1], T * 1.2, '#CFF2FF', 0.25); });
    return S;
  };
  BUILD.bench = sp => {
    const S = scene(), cy = -sp.d / 2, L = Math.max(5, sp.w / 2 - 0.4) * 1.0, w = sp.w - 0.8, iron = mat('#3E3A46', { gloss: 0.3 });
    for (const x of [-w / 2 + 0.7, w / 2 - 0.7]) { S.box(x, cy, 0, 0.35, 1.2, 2.1, iron); S.box(x, cy - 0.85, 2.1, 0.35, 0.25, 2.6, iron, { R: GK().rx(0.22), piv: [x, cy - 0.85, 2.1] }); S.box(x, cy + 0.2, 2.9, 0.3, 1.6, 0.28, iron); }
    S.box(0, cy + 0.1, 2.1, w, 1.8, 0.35, M.timberL, { face: (c, F, side, band) => { if (side === 'T') planks(c, F, band, '#B07E4E', { bh: 0.58, seed: 5, nails: false }); } });
    S.box(0, cy - 0.95, 2.6, w, 0.3, 2.3, M.timberL, { R: GK().rx(0.22), piv: [0, cy - 0.95, 2.6], face: (c, F, side, band) => { if (side === 'S' || side === 'sS') planks(c, F, band, '#B07E4E', { bh: 0.62, seed: 6, nails: false }); } });
    void L; return S;
  };
  BUILD.lanternpost = sp => { const S = scene(), cy = -sp.d / 2; S.lathe(0, cy, 0, [[1.0, 0], [0.8, 0.5], [0.45, 0.9]], 8, M.stoneD); S.cyl(0, cy, 0.9, 0.24, 0.18, 8.6, 8, M.iron); S.lathe(0, cy, 5.2, [[0.2, 0], [0.45, 0.2], [0.2, 0.5]], 8, M.iron); lantern(S, 0, cy, 9.0, {}); S.lathe(0, cy, 10.9, [[0.15, 0], [0.3, 0.15], [0.05, 0.6]], 6, M.iron, { dz: 1 }); return S; };
  BUILD.well = sp => {
    const S = scene(), cy = -sp.d / 2, r = Math.min(sp.w, sp.d * SE) / 2 - 0.6;
    S.lathe(0, cy, 0, [[r, 0], [r, 2.6], [r - 0.3, 2.8]], 10, M.stoneM, { face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, C.stoneM, { ch: 0.75, sw: 1.5, moss: true, seed: 2 }); } });
    S.lathe(0, cy, 1.9, [[r - 0.6, 0], [r - 0.6, 0.3]], 10, mat('#223A4C'), { inner: false, dz: 1.5 });
    for (const x of [-r + 0.2, r - 0.2]) post(S, x, cy, 2.6, 5.4, 0.55);
    S.add(cylMesh(0.3, 0.3, r * 2 - 0.6, 7), { t: [-r + 0.3, cy, 6.2], R: GK().ry(Math.PI / 2) }, { mats: [M.timberL], dz: 0.5 });
    S.box(r + 0.3, cy, 6.2, 0.9, 0.22, 0.22, M.iron, { dz: 0.6 }); S.box(r + 0.65, cy, 5.3, 0.22, 0.22, 1.0, M.iron, { dz: 0.6 });
    S.lathe(0, cy + 0.2, 3.6, [[0.55, 0], [0.7, 0.9]], 8, mat('#8A5E3C'), { dz: 0.3 });
    S.flat(cy * CE + 5 * SE + 0.4, (c, cam, T) => { const a = cam.P([0, cy, 6.2]), b = cam.P([0, cy + 0.2, 4.5]); c.strokeStyle = '#C9A070'; c.lineWidth = Math.max(1, T * 0.1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); });
    gableX(S, -r - 0.4, r + 0.4, cy + 1.6, cy - 1.6, 8.0, 0.8, 0.7, 0.4, M.tileM, C.tileM, { dz: 2, tileO: { flat: true, rh: 0.8, tw: 1.0 } });
    return S;
  };
  BUILD.woodpile = sp => { const S = scene(), cy = -sp.d / 2, L = sp.w - 1.6; for (const x of [-L / 2 - 0.3, L / 2 + 0.3]) post(S, x, cy, 0, 3.6, 0.45, M.timberD); const rows = [[0, 4], [0.9, 3], [1.8, 2]]; for (const [z, n] of rows) for (let i = 0; i < n; i++) { const y = cy + (i - (n - 1) / 2) * 1.5 * 1.1; log(S, 0, y, z + 0.75, 0.75, L * (0.9 + ((i * 7 + z) % 3) * 0.04), { col: ['#8A5E3C', '#9C6B44', '#7A5236'][i % 3] }); } return S; };
  BUILD.flowerbed = sp => {
    const S = scene(), cy = -sp.d / 2, rx2 = sp.w / 2 - 0.3, ry2 = sp.d * SE / 2 - 0.2, sc = [rx2 / ry2, 1, 1];
    S.add(lathe([[ry2, 0], [ry2, 0.9], [ry2 - 0.5, 1.0]], 12), { t: [0, cy, 0], s: sc }, { mats: [mat('#A8927A')], face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, '#A8927A', { ch: 0.9, sw: 1.1, gap: 0.08 }); } });
    S.add(lathe([[ry2 - 0.5, 0], [ry2 - 0.5, 0.8]], 12), { t: [0, cy, 0], s: sc }, { mats: [M.soil], inner: false, dz: 0.1 });
    const R = rnd(sp.entry ? sp.entry.x : 3); for (let i = 0; i < 16; i++) { const a = R() * TAU, rr2 = Math.sqrt(R()) * 0.8, x = Math.cos(a) * rr2 * rx2, y = cy + Math.sin(a) * rr2 * ry2, col = FLOWERS[Math.floor(R() * FLOWERS.length)], h = 1.3 + R() * 1.2, petals = R() < 0.4; S.parts.push({ flat: (c, cam) => flower(c, cam, x, y, 0.8, col, h, { petals }), dep: y * CE + 1 * SE + 0.2, bb: [x, y, 0.8, 1.8] }); }
    return S;
  };
  BUILD.trellis = sp => {
    const S = scene(), cy = -sp.d / 2, w = sp.w - 1, h = 6.5; for (const x of [-w / 2, w / 2]) post(S, x, cy, 0, h, 0.45, mat('#E9E2D2'));
    S.box(0, cy, h - 0.3, w + 0.6, 0.3, 0.3, mat('#E9E2D2'));
    S.flat(cy * CE + 3 * SE, (c, cam, T) => { c.strokeStyle = '#E9E2D2'; c.lineWidth = Math.max(1.2, T * 0.14); c.beginPath(); for (let u = -w / 2; u <= w / 2 + 0.01; u += 1.1) { const a = cam.P([u, cy, 0.4]), b = cam.P([Math.min(w / 2, u + h * 0.6), cy, Math.min(h - 0.4, 0.4 + (Math.min(w / 2, u + h * 0.6) - u) / 0.6)]); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); const a2 = cam.P([u, cy, 0.4]), b2 = cam.P([Math.max(-w / 2, u - h * 0.6), cy, Math.min(h - 0.4, 0.4 + (u - Math.max(-w / 2, u - h * 0.6)) / 0.6)]); c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]); } c.stroke(); c.strokeStyle = rgba(INK, 0.6); c.lineWidth = Math.max(0.8, T * 0.04); c.stroke();
      const R = rnd(sp.entry ? sp.entry.y : 5); for (let i = 0; i < 14; i++) { const p = cam.P([-w / 2 + R() * w, cy - 0.3, 0.8 + R() * (h - 1.6)]); blob(c, p[0], p[1], T * (0.5 + R() * 0.3), R() < 0.5 ? '#5FA64E' : '#3E7A36', { lw: Math.max(1, T * 0.07) }); } for (let i = 0; i < 9; i++) { const p = cam.P([-w / 2 + R() * w, cy - 0.4, 1 + R() * (h - 2)]); blob(c, p[0], p[1], T * 0.3, R() < 0.6 ? '#F08AA8' : '#FFFFFF', { lw: Math.max(0.8, T * 0.06) }); } });
    S.bb = [[0, cy, h / 2, w / 2 + 0.5]];
    return S;
  };
  BUILD.cart = sp => {
    const S = scene(), cy = -sp.d / 2, G = GK(), bw = sp.w - 2.4, bd = 3.2;
    S.box(0, cy, 1.6, bw, bd, 2.0, M.timber, { face: (c, F, side, band) => { if (side === 'T') return; planks(c, F, band, '#9A6A44', { bh: 0.66, seed: 3 }); c.fillStyle = tone(C.timberD, band); c.fillRect(F.x0 + 0.3, F.y0, 0.4, F.h); c.fillRect(F.x1 - 0.7, F.y0, 0.4, F.h); c.fillRect(F.cx - 0.2, F.y0, 0.4, F.h); } });
    S.box(0, cy, 1.4, bw + 0.4, bd + 0.4, 0.25, M.timberD);
    const R = rnd(9); S.flat(cy * CE + 3.6 * SE + 0.3, (c, cam, T) => { for (let i = 0; i < 12; i++) { const p = cam.P([(R() - 0.5) * (bw - 1), cy + (R() - 0.5) * (bd - 1), 3.4 + R() * 0.8]); blob(c, p[0], p[1], T * (0.7 + R() * 0.3), ['#F2C14E', '#E8B040', '#FFD36A'][i % 3], { lw: Math.max(1, T * 0.07) }); } });
    for (const x of [-bw / 2 - 0.3, bw / 2 + 0.3]) S.add(cylMesh(1.7, 1.7, 0.45, 12), { t: [x - (x < 0 ? 0.45 : 0), cy, 1.7], R: G.ry(Math.PI / 2) }, { mats: [mat('#7A5236')], dz: 0.5, face: (c, F, side, band) => { if (side !== 'T' && side !== 'B') return; c.fillStyle = tone('#C9A070', band); c.beginPath(); c.arc(F.cx, F.cy, F.w * 0.42, 0, TAU); c.fill(); c.strokeStyle = tone('#7A5236', band); c.lineWidth = 0.22; c.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.moveTo(F.cx, F.cy); c.lineTo(F.cx + Math.cos(a) * F.w * 0.42, F.cy + Math.sin(a) * F.w * 0.42); } c.stroke(); c.fillStyle = tone(C.iron, band); c.beginPath(); c.arc(F.cx, F.cy, 0.3, 0, TAU); c.fill(); c.strokeStyle = tone(C.iron, band); c.lineWidth = 0.18; c.beginPath(); c.arc(F.cx, F.cy, F.w * 0.46, 0, TAU); c.stroke(); } });
    for (const x of [-bw / 4, bw / 4]) S.add(G.block(0.18, 2.0, 0.18), { t: [x, cy + bd / 2 + 1.6, 1.4], R: G.rx(0.28) }, { mats: [M.timber] });
    S.box(0, cy + bd / 2 + 3.3, 0.5, bw / 2 + 0.4, 0.3, 0.3, M.timber);
    return S;
  };
  BUILD.scarecrow = sp => {
    const S = scene(), cy = -sp.d / 2, G = GK();
    post(S, 0, cy, 0, 7.4, 0.45, M.timber); S.box(0, cy, 5.6, 4.6, 0.4, 0.4, M.timber);
    S.box(0, cy, 3.4, 2.6, 1.6, 2.8, mat('#C96443'), { dz: 0.3, face: (c, F, side, band) => { if (side === 'T' || side === 'B') return; c.strokeStyle = rgba('#F2E3B0', 0.75); c.lineWidth = 0.14; c.beginPath(); for (let x = F.x0 + 0.4; x < F.x1; x += 0.8) { c.moveTo(x, F.y0); c.lineTo(x, F.y1); } for (let y = F.y0 + 0.5; y < F.y1; y += 0.8) { c.moveTo(F.x0, y); c.lineTo(F.x1, y); } c.stroke(); c.fillStyle = tone('#3E6FA8', band); rr(c, F.x0 - 0.1, F.y1 - 0.3, F.w + 0.2, 0.5, 0.1); c.fill(); } });
    for (const x of [-2.1, 2.1]) S.add(G.block(0.9, 0.7, 0.55), { t: [x, cy, 5.6] }, { mats: [mat('#C96443')], dz: 0.4 });
    S.lathe(0, cy, 6.2, [[0.5, 0], [1.1, 0.5], [1.15, 1.4], [0.8, 2.1], [0.2, 2.4]], 8, mat('#E8C98A'), { dz: 0.6, face: (c, F, side, band) => { if (side === 'S' || side === 'sS') { c.fillStyle = INK; c.beginPath(); c.arc(F.cx - 0.4, F.cy - 0.1, 0.16, 0, TAU); c.arc(F.cx + 0.4, F.cy - 0.1, 0.16, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.12; c.beginPath(); c.arc(F.cx, F.cy + 0.1, 0.5, 0.3, 2.8); c.stroke(); } } });
    S.lathe(0, cy, 8.4, [[1.9, 0], [1.8, 0.3], [1.1, 0.4], [0.9, 1.9], [0.3, 2.1]], 9, mat('#B07E4E'), { dz: 0.8, face: (c, F, side, band) => { if (side === 'T' || side === 'B') return; c.fillStyle = tone('#C8373A', band); c.fillRect(F.x0 - 0.2, F.y1 - 0.9, F.w + 0.4, 0.4); } });
    S.flat(cy * CE + 5.6 * SE + 1, (c, cam, T) => { const R = rnd(4); c.strokeStyle = '#E8C98A'; c.lineWidth = Math.max(1, T * 0.1); for (const [x, z] of [[-2.9, 5.6], [2.9, 5.6], [0, 2.1]]) { const p = cam.P([x, cy, z]); c.beginPath(); for (let k = 0; k < 6; k++) { c.moveTo(p[0], p[1]); c.lineTo(p[0] + (R() - 0.5) * T * 1.4 + (x > 0 ? T * 0.5 : x < 0 ? -T * 0.5 : 0), p[1] + (z > 3 ? (R() - 0.3) * T : R() * T * 1.2)); } c.stroke(); } const q = cam.P([2.0, cy, 6.1]); blob(c, q[0], q[1] - T * 0.5, T * 0.55, '#2A2430', { lw: Math.max(0.8, T * 0.06) }); c.fillStyle = '#F2C14E'; c.beginPath(); c.moveTo(q[0] + T * 0.5, q[1] - T * 0.5); c.lineTo(q[0] + T * 0.95, q[1] - T * 0.42); c.lineTo(q[0] + T * 0.5, q[1] - T * 0.3); c.fill(); });
    return S;
  };
  BUILD.dummy = sp => {
    const S = scene(), cy = -sp.d / 2;
    S.lathe(0, cy, 0, [[1.3, 0], [1.1, 0.6]], 8, M.stoneD); post(S, 0, cy, 0.6, 6.6, 0.5, M.timber);
    S.lathe(0, cy, 2.2, [[0.9, 0], [1.3, 0.6], [1.35, 2.4], [1.1, 3.2]], 9, mat('#D9B872'), { dz: 0.3, face: (c, F, side, band) => { if (side === 'T' || side === 'B') return; c.strokeStyle = rgba('#8A6A32', 0.7); c.lineWidth = 0.1; c.beginPath(); for (let y = F.y0 + 0.5; y < F.y1; y += 0.55) { c.moveTo(F.x0, y); c.lineTo(F.x1, y + 0.08); } c.stroke(); if (side === 'S') { for (let i = 2; i >= 0; i--) { c.fillStyle = tone(i % 2 ? '#F7EBD8' : '#D9483B', band); c.beginPath(); c.arc(F.cx, F.cy, 0.32 * (i + 1), 0, TAU); c.fill(); } } } });
    S.box(0, cy, 4.6, 4.8, 0.4, 0.4, M.timber, { dz: 0.4 }); for (const x of [-2.2, 2.2]) S.lathe(x, cy, 4.0, [[0.4, 0], [0.55, 0.5], [0.5, 1.5]], 7, mat('#D9B872'), { dz: 0.5 });
    S.lathe(0, cy, 5.5, [[0.4, 0], [0.8, 0.4], [0.75, 1.3], [0.2, 1.7]], 8, mat('#D9B872'), { dz: 0.6 });
    return S;
  };
  BUILD.banner = sp => {
    const S = scene(), cy = -sp.d / 2, col = sp.color || '#C8373A';
    S.lathe(0, cy, 0, [[0.9, 0], [0.7, 0.6]], 8, M.stoneD); S.cyl(0, cy, 0.6, 0.22, 0.16, 12, 7, M.timberD); S.box(0, cy, 11.6, 3.2, 0.22, 0.22, M.timberD, { dz: 1 }); S.lathe(0, cy, 12.6, [[0.12, 0], [0.32, 0.2], [0.05, 0.7]], 6, M.brass, { dz: 1 });
    S.liveAdd((c, cam, t, o) => { const T = cam.T, L = [], Rr = []; for (let i = 0; i <= 6; i++) { const u = i / 6, wv = Math.sin(t * 2.2 + u * 3.5) * 0.25 * u; L.push(cam.P([-1.4 + wv * 0.4, cy + wv, 11.5 - u * 7.2])); Rr.push(cam.P([1.4 + wv * 0.4, cy + wv, 11.5 - u * 7.2])); } c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (let i = 1; i < 7; i++) c.lineTo(L[i][0], L[i][1]); c.lineTo((L[6][0] + Rr[6][0]) / 2, L[6][1] + T * 0.9); for (let i = 6; i >= 0; i--) c.lineTo(Rr[i][0], Rr[i][1]); c.closePath(); c.fillStyle = col; c.fill(); c.save(); c.clip(); c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(L[3][0], L[0][1] - 2, T * 1.3, T * 9); c.fillStyle = '#F7E6B8'; c.beginPath(); c.arc((L[2][0] + Rr[2][0]) / 2, (L[2][1] + L[3][1]) / 2 + T * 0.3, T * 0.8, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.arc((L[2][0] + Rr[2][0]) / 2, (L[2][1] + L[3][1]) / 2 + T * 0.3, T * 0.42, 0, TAU); c.fill(); c.restore(); c.strokeStyle = INK; c.lineWidth = Math.max(1.2, T * 0.1); c.stroke(); });
    S.bb = [[0, cy, 7, 2.2]];
    return S;
  };
  BUILD.rack = sp => {
    const S = scene(), cy = -sp.d / 2, w = sp.w - 1, G = GK();
    for (const x of [-w / 2, w / 2]) post(S, x, cy, 0, 5.2, 0.45, M.timberD); S.box(0, cy, 4.6, w + 0.4, 0.3, 0.4, M.timberD, { dz: 0.4 }); S.box(0, cy, 0.9, w + 0.4, 0.5, 0.3, M.timberD);
    const n = Math.max(3, Math.round(w / 1.6)); for (let i = 0; i < n; i++) { const x = -w / 2 + 0.9 + i * (w - 1.8) / (n - 1), wood = i % 2 === 0; S.add(G.block(wood ? 0.22 : 0.14, 0.14, 2.6), { t: [x, cy + 0.1, 3.4], R: G.ry(0.08 * (i % 3 - 1)) }, { mats: [wood ? M.timberL : M.iron], dz: 0.5 }); S.box(x, cy + 0.1, 1.9, 0.9, 0.2, 0.22, wood ? M.timber : M.brass, { dz: 0.6 }); S.lathe(x, cy + 0.1, 0.6, [[0.2, 0], [0.2, 1.4]], 6, mat(wood ? '#5A3C2A' : '#6E4A2E'), { dz: 0.55 }); }
    return S;
  };
  const CRY = { c: ['#3C88B8', '#8AD8F8', '#E6FBFF'] }, cryMat = (col, c3) => mat(col, { c: c3 || CRY.c, gloss: 1, glint: '#FFFFFF' });
  BUILD.crystal = sp => {
    const S = scene(), cy = -sp.d / 2, G = GK(), col = sp.color || '#8AD8F8', cm = cryMat(col, [sh(col, -0.55), col, sh(col, 0.6)]);
    S.add(G.bipyramid(7, 1, 1.2, 0.4, { seed: 2, jit: 0.4, jitR: 0.3, sx: 2.8, sy: 1.9 }), { t: [0, cy, 0.3] }, { mats: [mat('#7A7484')] });
    for (const [x, y, h, r, a, b] of [[0, cy, 5.2, 1.1, 0.05, 0.1], [-1.6, cy + 0.6, 3.4, 0.8, -0.5, 0.2], [1.5, cy - 0.3, 3.8, 0.75, 0.45, -0.1], [0.6, cy + 1.2, 2.4, 0.55, 0.2, 0.5], [-0.9, cy - 1.0, 2.6, 0.55, -0.3, -0.4]]) S.add(G.bipyramid(6, r, h, 0.6, { seed: (x * 10) | 0, jit: 0.3 }), { t: [x, y, 1.0], R: G.mm(G.ry(a), G.rx(b)) }, { mats: [cm], ink: sh(col, -0.7), lw: 0.1, dz: 1 });
    S.light(0, cy, 3, 4, col);
    S.liveAdd((c, cam, t, o) => { const p = cam.P([0, cy, 3]); glow(c, p[0], p[1], cam.T * (3 + Math.sin(t * 1.8) * 0.3), col, 0.3 + 0.25 * (o.lit || 0)); for (let i = 0; i < 3; i++) { const q = cam.P([Math.sin(t + i * 2) * 1.5, cy + Math.cos(t * 0.7 + i) * 1.2, 2 + ((t * 0.5 + i / 3) % 1) * 5]); glow(c, q[0], q[1], cam.T * 0.4, '#FFFFFF', 0.8); } });
    return S;
  };
  BUILD.pool = sp => {
    const S = scene(), cy = -sp.d / 2, rx2 = sp.w / 2 - 0.3, ry2 = sp.d * SE / 2 - 0.2, sc = [rx2 / ry2, 1, 1], col = '#5FD8D0';
    S.add(lathe([[ry2 + 0.2, 0], [ry2, 0.7], [ry2 - 0.7, 0.8]], 14), { t: [0, cy, 0], s: sc }, { mats: [mat('#B9B4C4')], face: (c, F, side, band) => { if (side !== 'T') stones(c, F, band, '#B9B4C4', { ch: 0.7, sw: 1.2 }); else { c.strokeStyle = rgba('#7FE0E8', 0.7); c.lineWidth = 0.1; c.beginPath(); c.moveTo(F.x0 + 0.2, F.cy); c.lineTo(F.x1 - 0.2, F.cy); c.stroke(); } } });
    S.add(lathe([[ry2 - 0.7, 0], [ry2 - 0.7, 0.3]], 14), { t: [0, cy, 0.35], s: sc }, { mats: [mat(col, { c: ['#2E9A96', col, '#C8FFF8'], a: 0.95 })], inner: false, dz: 1.5, face: (c, F, side, band) => { if (side !== 'T') return; const R = rnd(8); for (let i = 0; i < 5; i++) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 0.1; c.beginPath(); const a = R() * TAU; c.arc(F.cx + (R() - 0.5) * F.w * 0.4, F.cy + (R() - 0.5) * F.h * 0.4, 0.6 + R() * 1.2, a, a + 1.2); c.stroke(); } } });
    S.light(0, cy, 0.5, 6, col);
    S.liveAdd((c, cam, t, o) => { const T = cam.T, p = cam.P([0, cy, 0.5]); c.save(); c.translate(p[0], p[1]); c.scale(rx2 / ry2, 1); glow(c, 0, 0, T * ry2 * 1.3 * (0.95 + Math.sin(t * 1.5) * 0.05), col, 0.3); c.restore(); for (let i = 0; i < 5; i++) { const u = (t * 0.25 + i * 0.2) % 1, a = i * 1.3 + t * 0.4, q = cam.P([Math.cos(a) * rx2 * 0.6, cy + Math.sin(a) * ry2 * 0.6, 0.6 + u * 3]); glow(c, q[0], q[1], T * 0.35, '#FFFFFF', (1 - u) * 0.9); } });
    return S;
  };
  BUILD.torii = sp => {
    const S = scene(), cy = -sp.d / 2, w = sp.w - 1.4, verm = mat(C.vermilion), G = GK();
    for (const x of [-w / 2, w / 2]) { S.lathe(x, cy, 0, [[0.9, 0], [0.7, 0.5]], 8, M.stoneD); S.cyl(x, cy, 0.5, 0.6, 0.52, 9.2, 9, verm); }
    S.box(0, cy, 6.6, w + 1.0, 0.5, 0.7, verm, { dz: 0.4 }); S.box(0, cy, 7.3, 1.1, 0.7, 1.6, verm, { dz: 0.5 });
    S.box(0, cy, 9.0, w + 2.6, 0.9, 0.7, verm, { dz: 0.6 }); S.box(0, cy, 9.7, w + 3.2, 1.1, 0.5, mat('#2A2430'), { dz: 0.7 });
    for (const sgn of [-1, 1]) S.add(G.block(1.2, 0.56, 0.3), { t: [sgn * (w / 2 + 2.2), cy, 10.3], R: G.ry(-sgn * 0.3) }, { mats: [mat('#2A2430')], dz: 0.8 });
    S.flat(cy * CE + 7 * SE + 1, (c, cam, T) => { const p = cam.P([0, cy, 7.9]); c.fillStyle = '#1E1824'; rr(c, p[0] - T * 0.45, p[1] - T * 0.75, T * 0.9, T * 1.4, T * 0.1); c.fill(); c.fillStyle = '#F2C14E'; c.font = `700 ${T * 0.7}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('神', p[0], p[1]); });
    return S;
  };
  BUILD.cookpot = sp => {
    const S = scene(), cy = -sp.d / 2, G = GK();
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; S.add(G.bipyramid(6, 0.55, 0.5, 0.2, { seed: i + 3, jit: 0.5, jitR: 0.3 }), { t: [Math.cos(a) * 2.4, cy + Math.sin(a) * 1.9, 0.2] }, { mats: [mat('#7E7A86')] }); }
    S.add(cylMesh(0.32, 0.3, 3, 7), { t: [-1.5, cy + 0.4, 0.35], R: G.mm(G.ry(Math.PI / 2), G.rz(0.3)) }, { mats: [mat('#4A3222')] }); S.add(cylMesh(0.32, 0.3, 3, 7), { t: [-1.3, cy - 0.6, 0.35], R: G.mm(G.ry(Math.PI / 2), G.rz(-0.5)) }, { mats: [mat('#4A3222')] });
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5, bx = Math.cos(a) * 2.2, by = cy + Math.sin(a) * 1.9; const dir = G.norm([-bx, -(by - cy), 7.2]); S.add(cylMesh(0.2, 0.16, 7.5, 6), { t: [bx, by, 0], R: G.mm(G.rz(Math.atan2(dir[1], dir[0])), G.ry(Math.acos(dir[2]))) }, { mats: [M.timberD], dz: i === 1 ? 1.2 : 0 }); }
    S.lathe(0, cy, 2.2, [[1.0, 0], [1.7, 0.6], [1.75, 2.0], [1.5, 2.3]], 9, mat('#3A3640', { gloss: 0.5 }), { dz: 0.8 });
    S.lathe(0, cy, 4.5, [[1.5, 0], [0.8, 0.4], [0.2, 0.55], [0.25, 0.9]], 9, mat('#4A4650', { gloss: 0.5 }), { dz: 0.9 });
    S.flat(cy * CE + 5 * SE + 1, (c, cam, T) => { const a = cam.P([-1.6, cy, 4.3]), b = cam.P([0, cy, 6.9]), d2 = cam.P([1.6, cy, 4.3]); c.strokeStyle = '#3A3640'; c.lineWidth = Math.max(1.2, T * 0.14); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(b[0], b[1] - T * 0.4, d2[0], d2[1]); c.stroke(); });
    S.light(0, cy, 1, 3, '#FF9A3A');
    S.liveAdd((c, cam, t, o) => { const T = cam.T, p = cam.P([0, cy, 0.6]); glow(c, p[0], p[1] - T * 0.3, T * (2.4 + Math.sin(t * 9) * 0.2), '#FF8A3A', 0.5); for (let i = 0; i < 4; i++) { const ph = (t * 1.6 + i * 0.27) % 1, x = Math.sin(t * 5 + i * 2) * 0.4 + (i - 1.5) * 0.4, q = cam.P([x, cy, 0.4 + ph * 1.8]); c.fillStyle = ph < 0.5 ? rgba('#FFD56A', 0.9 - ph) : rgba('#FF7A2A', 1.2 - ph); c.beginPath(); c.ellipse(q[0], q[1], T * 0.32 * (1 - ph * 0.6), T * 0.5 * (1 - ph * 0.5), 0, 0, TAU); c.fill(); } });
    return S;
  };
  const crateFace = (c, F, side, band) => { if (side === 'B') return; planks(c, F, band, '#B5885C', { bh: 0.75, nails: false, v: side !== 'T' }); c.strokeStyle = tone('#6E4A2E', band); c.lineWidth = 0.28; c.strokeRect(F.x0 + 0.15, F.y0 + 0.15, F.w - 0.3, F.h - 0.3); if (side !== 'T') { c.beginPath(); c.moveTo(F.x0 + 0.2, F.y1 - 0.2); c.lineTo(F.x1 - 0.2, F.y0 + 0.2); c.stroke(); } };
  BUILD.crates = sp => { const S = scene(), cy = -sp.d / 2, G = GK(); S.box(-1.4, cy + 0.4, 0, 2.6, 2.6, 2.4, M.timberL, { face: crateFace }); S.box(1.6, cy - 0.4, 0, 2.6, 2.6, 2.4, M.timberL, { face: crateFace, R: G.rz(0.25), piv: [1.6, cy - 0.4, 0] }); S.box(-0.4, cy - 0.2, 2.4, 2.2, 2.2, 2.0, M.timberL, { face: crateFace, R: G.rz(-0.2), piv: [-0.4, cy - 0.2, 2.4], dz: 1 }); S.lathe(2.2, cy + 1.6, 0, [[0.7, 0], [0.9, 0.4], [0.75, 1.2], [0.35, 1.4]], 8, mat('#8A8E96')); return S; };
  const weave = (c, F, side, band) => { if (side === 'T') return; c.strokeStyle = rgba('#6B4A2A', 0.55); c.lineWidth = 0.08; c.beginPath(); for (let y = F.y0 + 0.22; y < F.y1; y += 0.28) { c.moveTo(F.x0, y); c.lineTo(F.x1, y); } for (let x = F.x0; x < F.x1; x += 0.42) { c.moveTo(x, F.y0); c.lineTo(x + 0.08, F.y1); } c.stroke(); c.fillStyle = tone('#A67A48', band); c.fillRect(F.x0, F.y0, F.w, 0.22); };
  BUILD.baskets = sp => { const S = scene(), cy = -sp.d / 2, R = rnd(sp.entry ? sp.entry.y : 2), fruit = ['#FF8A4A', '#E8505A', '#F2C14E', '#8FC95C']; [[-1.6, cy + 0.5, 1.2], [1.4, cy - 0.3, 1.4], [0.4, cy + 1.4, 0.9]].forEach(([x, y, r], i) => { S.lathe(x, y, 0, [[r * 0.8, 0], [r, 1.4]], 9, mat('#C9A06A'), { face: (c, F, side, band) => { weave(c, F, side, band); if (side === 'T') { const fc = fruit[i % 4]; for (let k = 0; k < 7; k++) blob(c, F.cx + (R() - 0.5) * r * 1.3, F.cy + (R() - 0.5) * r * 1.0, r * 0.3, tone(fc, band), { lw: 0.07 }); } } }); }); return S; };
  BUILD.workbench = sp => {
    const S = scene(), cy = -sp.d / 2, w = sp.w - 1, G = GK();
    for (const [x, y] of [[-w / 2 + 0.5, cy + 1.0], [w / 2 - 0.5, cy + 1.0], [-w / 2 + 0.5, cy - 1.0], [w / 2 - 0.5, cy - 1.0]]) post(S, x, y, 0, 3.2, 0.5, M.timberD);
    S.box(0, cy, 1.2, w - 0.6, 0.3, 0.5, M.timberD);
    S.box(0, cy, 3.2, w, 3.2, 0.5, M.timberL, { face: (c, F, side, band) => { if (side === 'T') { planks(c, F, band, '#B07E4E', { bh: 0.8, seed: 7 }); const R = rnd(5); c.fillStyle = rgba(INK, 0.5); for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(F.x0 + 0.5 + R() * (F.w - 1), F.y0 + 0.3 + R() * (F.h - 0.6), 0.09, 0, TAU); c.fill(); } } } });
    S.box(w / 2 - 1.3, cy + 1.2, 3.7, 1.2, 1.0, 1.0, M.iron, { dz: 0.5 }); S.add(cylMesh(0.14, 0.14, 2.0, 6), { t: [w / 2 - 1.3, cy + 0.3, 4.2], R: G.rx(-Math.PI / 2) }, { mats: [M.iron], dz: 0.6 });
    S.add(G.block(0.14, 1.3, 0.14), { t: [-1.2, cy + 0.2, 3.85], R: G.rz(0.5) }, { mats: [M.timber], dz: 0.5 }); S.box(-1.2 - Math.sin(0.5) * 1.3, cy + 0.2 + Math.cos(0.5) * 1.3, 3.7, 0.5, 1.1, 0.55, M.iron, { R: G.rz(0.5), piv: [-1.2 - Math.sin(0.5) * 1.3, cy + 0.2 + Math.cos(0.5) * 1.3, 3.7], dz: 0.6 });
    S.add(G.block(1.6, 0.35, 0.07), { t: [-w / 2 + 2.6, cy - 0.5, 3.8], R: G.rz(-0.3) }, { mats: [mat('#C9A070')], dz: 0.5 });
    S.add(G.block(0.25, 2.2, 0.12), { t: [w / 2 + 0.1, cy, 2.2], R: G.rx(-0.9) }, { mats: [mat('#C9A070')], dz: 0.3 });
    return S;
  };
  BUILD.anvil = sp => { const S = scene(), cy = -sp.d / 2, G = GK(), iron = mat('#4A4650', { gloss: 0.6, glint: '#DDE2EE' }); S.lathe(0, cy, 0, [[1.5, 0], [1.4, 2.0]], 10, mat('#8A5E3C'), { face: bark }); S.box(0, cy, 2.0, 1.6, 1.4, 0.5, iron, { dz: 0.3 }); S.box(0, cy, 2.5, 1.0, 1.0, 0.8, iron, { dz: 0.4 }); S.box(0.3, cy, 3.3, 2.6, 1.3, 0.7, iron, { dz: 0.5 }); S.add(G.pyramid(4, 0.55, 1.8, { a0: Math.PI / 4 }), { t: [-1.0, cy, 3.65], R: G.ry(-Math.PI / 2) }, { mats: [iron], dz: 0.6 }); S.add(G.block(0.1, 0.1, 1.2), { t: [1.0, cy + 0.2, 4.3], R: G.mm(G.rz(0.6), G.rx(1.2)) }, { mats: [M.timber], dz: 0.8 }); S.box(1.0 - 0.9, cy + 0.2 + 0.6, 4.0, 0.5, 0.9, 0.5, iron, { dz: 0.85 }); return S; };
  BUILD.lumber = sp => { const S = scene(), cy = -sp.d / 2, L = sp.w - 1.2, pl = mat('#C9A070'); for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) { S.box(0, cy + (i - 1) * 1.3, r * 0.5 + (r === 1 ? 0.02 : 0), L - r * 0.6, 1.1, 0.5, pl, { face: (c, F, side, band) => { if (side === 'E' || side === 'W') endGrain(c, { cx: F.cx, cy: F.cy, w: F.w, x0: F.x0, y0: F.y0 }, band); else { c.strokeStyle = rgba('#6B4A2A', 0.4); c.lineWidth = 0.06; c.beginPath(); c.moveTo(F.x0, F.cy); c.lineTo(F.x1, F.cy + 0.1); c.stroke(); } }, dz: r * 0.2 }); } for (const [y, z] of [[cy + 2.6, 0], [cy - 2.7, 0], [cy - 2.2, 1.5]]) log(S, 0.2, y, z + 0.75, 0.75, L * 0.8, { col: '#8A5E3C' }); return S; };
  BUILD.picnic = sp => {
    const S = scene(), cy = -sp.d / 2, w = sp.w - 1.4, G = GK();
    for (const x of [-w / 2 + 1.2, w / 2 - 1.2]) { S.add(G.block(0.25, 0.2, 1.6), { t: [x, cy + 0.9, 1.6], R: G.rx(-0.5) }, { mats: [M.timber] }); S.add(G.block(0.25, 0.2, 1.6), { t: [x, cy - 0.9, 1.6], R: G.rx(0.5) }, { mats: [M.timber] }); S.box(x, cy, 1.4, 0.3, 5.4, 0.3, M.timber); }
    for (const y of [cy + 2.6, cy - 2.6]) S.box(0, y, 1.4, w, 1.2, 0.3, M.timberL, { face: (c, F, side, band) => { if (side === 'T') planks(c, F, band, '#B07E4E', { bh: 0.6, nails: false }); } });
    S.box(0, cy, 2.9, w, 3.0, 0.35, M.timberL, { dz: 0.5, face: (c, F, side, band) => { if (side !== 'T') { planks(c, F, band, '#B07E4E', { bh: 0.35, nails: false }); return; } c.fillStyle = tone('#F7EBD8', band); c.fillRect(F.x0 + 0.5, F.y0 - 0.1, F.w - 1, F.h + 0.2); c.fillStyle = tone('#E8505A', band); for (let x = F.x0 + 0.5; x < F.x1 - 0.5; x += 1.2) for (let y = F.y0 - 0.1; y < F.y1 + 0.1; y += 1.2) { c.fillRect(x, y, 0.6, 0.6); c.fillRect(x + 0.6, y + 0.6, Math.min(0.6, F.x1 - 0.5 - x - 0.6), 0.6); } } });
    S.lathe(-w / 4, cy, 3.25, [[0.9, 0], [1.2, 1.1]], 8, mat('#C9A06A'), { dz: 0.8, face: weave }); S.lathe(w / 4, cy + 0.3, 3.25, [[0.8, 0], [0.8, 0.1]], 10, mat('#FFFFFF'), { dz: 0.8 }); S.lathe(w / 4, cy + 0.3, 3.35, [[0.45, 0], [0.5, 0.3]], 8, mat('#E8B040'), { dz: 0.9 });
    return S;
  };
  BUILD.reeds = sp => { const S = scene(), cy = -sp.d / 2, R = rnd(sp.entry ? sp.entry.x + 1 : 1), st = []; for (let i = 0; i < 11; i++) st.push([(R() - 0.5) * (sp.w - 1), cy + (R() - 0.5) * 2, 3.2 + R() * 2.4, R() < 0.5, R() * TAU]); st.sort((a, b) => a[1] - b[1]); S.liveAdd((c, cam, t) => { const T = cam.T; for (const [x, y, h, head, ph] of st) { const sw = Math.sin(t * 1.6 + ph) * 0.35, b = cam.P([x, y, 0]), tp = cam.P([x + sw, y, h]); c.strokeStyle = '#5A9A48'; c.lineWidth = Math.max(1.2, T * 0.14); c.beginPath(); c.moveTo(b[0], b[1]); c.quadraticCurveTo(b[0], (b[1] + tp[1]) / 2, tp[0], tp[1]); c.stroke(); c.strokeStyle = '#7FB85C'; c.lineWidth = Math.max(1, T * 0.1); c.beginPath(); c.moveTo(b[0], b[1]); c.quadraticCurveTo(b[0] - T * 0.6, b[1] - T * h * 0.5, b[0] - T * (0.9 + sw * 0.3), b[1] - T * h * 0.75); c.stroke(); if (head) { c.fillStyle = '#6B4A32'; rr(c, tp[0] - T * 0.16, tp[1], T * 0.32, T * 1.1, T * 0.16); c.fill(); c.strokeStyle = INK; c.lineWidth = Math.max(0.8, T * 0.05); c.stroke(); } } }); S.bb = [[0, cy, 3, sp.w / 2 + 1]]; return S; };
  BUILD.rocks = sp => { const S = scene(), cy = -sp.d / 2, G = GK(), rk = [[-1.6, cy + 0.5, 2.6, 1.8, 2.4, 1], [1.8, cy - 0.4, 2.0, 1.5, 1.7, 2], [0.4, cy + 1.6, 1.2, 0.9, 1.0, 3]]; for (const [x, y, sx, sy, h, sd] of rk) S.add(G.bipyramid(7, 1, h, 0.4, { seed: sd + 4, jit: 0.5, jitR: 0.35, jitZ: 0.3, sx, sy }), { t: [x, y, 0.3] }, { mats: [mat('#8A8780')], face: (c, F, side, band, fr) => { if (fr.n[2] < 0.3) return; const R = rnd((F.w * 11) | 0); for (let i = 0; i < 3; i++) { c.fillStyle = rgba('#7FA062', 0.55); c.beginPath(); c.ellipse(F.x0 + R() * F.w, F.y0 + R() * F.h, 0.5 + R() * 0.5, 0.3 + R() * 0.3, R() * 2, 0, TAU); c.fill(); } } }); return S; };
  BUILD.telescope = sp => { const S = scene(), cy = -sp.d / 2, G = GK(), brass = mat('#D1A24B', { gloss: 1, glint: '#FFF4D0' }); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + Math.PI / 2, bx = Math.cos(a) * 1.9, by = cy + Math.sin(a) * 1.6, dir = G.norm([-bx, -(by - cy), 4.8]); S.add(cylMesh(0.16, 0.13, 5.2, 6), { t: [bx, by, 0], R: G.mm(G.rz(Math.atan2(dir[1], dir[0])), G.ry(Math.acos(dir[2]))) }, { mats: [M.timber] }); } S.lathe(0, cy, 4.6, [[0.5, 0], [0.5, 0.6]], 8, M.iron, { dz: 0.5 }); const dir = G.norm([0.55, -0.35, 0.75]); S.add(lathe([[0.42, 0], [0.5, 0.5], [0.5, 3.6], [0.7, 3.9], [0.7, 4.6]], 9), { t: [-dir[0] * 1.8, cy - dir[1] * 1.8, 5.2 - dir[2] * 1.8], R: G.mm(G.rz(Math.atan2(dir[1], dir[0])), G.ry(Math.acos(dir[2]))) }, { mats: [brass], dz: 1, face: (c, F, side, band) => { if (side === 'T' || side === 'B') { c.fillStyle = tone('#8CBFD4', band); c.beginPath(); c.arc(F.cx, F.cy, F.w * 0.38, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(F.cx - 0.12, F.cy - 0.1, F.w * 0.12, 0, TAU); c.fill(); return; } c.fillStyle = tone('#8A6A2A', band); c.fillRect(F.x0, F.y0 + 0.5, F.w, 0.18); c.fillRect(F.x0, F.y1 - 1.1, F.w, 0.18); } }); return S; };
  BUILD.flowerring = sp => { const S = scene(), cy = -sp.d / 2, rx2 = sp.w / 2 - 0.8, ry2 = sp.d * SE / 2 - 0.5, G = GK(); S.add(G.bipyramid(7, 1, 1.4, 0.4, { seed: 6, jit: 0.4, jitR: 0.3, sx: 1.5, sy: 1.1 }), { t: [0, cy, 0.2] }, { mats: [mat('#8E9A84')] }); S.liveAdd((c, cam, t) => { const p = cam.P([0, cy, 1.2]); glow(c, p[0], p[1], cam.T * (2.2 + Math.sin(t * 2) * 0.2), '#CFF7A8', 0.3); }); const R = rnd(21); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + R() * 0.2, x = Math.cos(a) * rx2, y = cy + Math.sin(a) * ry2, col = FLOWERS[i % FLOWERS.length], h = 1.2 + R() * 0.6; S.parts.push({ flat: (c, cam) => flower(c, cam, x, y, 0, col, h, { petals: i % 2 === 0 }), dep: y * CE + 0.5, bb: [x, y, 0, 1.6] }); } return S; };
  BUILD.readingbench = sp => { const S = BUILD.bench({ w: sp.w - 1.4 * U, d: sp.d, entry: sp.entry }), cy = -sp.d / 2, x = sp.w / 2 - 0.9; S.lathe(x, cy, 0, [[0.8, 0], [0.6, 0.4]], 8, M.stoneD); S.cyl(x, cy, 0.4, 0.18, 0.14, 6.2, 7, M.iron); lantern(S, x, cy, 6.2, {}); for (let i = 0; i < 3; i++) S.box(-sp.w / 2 + 2.6 + (i % 2) * 0.2, cy + 0.1, 2.45 + i * 0.45, 1.6, 1.2, 0.45, mat(['#C8373A', '#3E6FA8', '#6CC15A'][i]), { dz: 0.4 + i * 0.1, R: GK().rz(i * 0.15), piv: [-sp.w / 2 + 2.6, cy + 0.1, 0] }); return S; };
  // the farm bed: soil with furrows; wet beds are dark; the crop is drawn live by stage
  const CROP_ART = { sunberry: { leaf: '#5FA64E', fruit: '#FFAA3D', bush: true }, carrot: { leaf: '#4E9A3E', fruit: '#FF8A3A', feather: true }, pumpkin: { leaf: '#4E8A3E', fruit: '#F0862A', vine: true }, starfruit: { leaf: '#4FA06A', fruit: '#F2D24E', tree: true } };
  BUILD.plot = sp => {
    const S = scene(), cy = -sp.d / 2, wet = sp.v === 'w', col = wet ? C.soilW : C.soil, w = sp.w - 0.6, dd = sp.d - 0.6;
    S.box(0, cy, 0, w, dd, 0.9, mat(col), { face: (c, F, side, band) => { if (side !== 'T') { const R = rnd(3); c.fillStyle = rgba('#000000', 0.08); for (let i = 0; i < F.w * 3; i++) c.fillRect(F.x0 + R() * F.w, F.y0 + R() * F.h, 0.2, 0.15); return; } const R = rnd(7); c.fillStyle = rgba('#000000', wet ? 0.12 : 0.07); for (let i = 0; i < F.w * F.h * 1.2; i++) c.fillRect(F.x0 + R() * F.w, F.y0 + R() * F.h, 0.15 + R() * 0.2, 0.12 + R() * 0.15); for (let i = 0; i < 3; i++) { const y = F.y0 + F.h * (i + 0.5) / 3; c.fillStyle = rgba('#000000', 0.22); c.fillRect(F.x0 + 0.3, y - 0.25, F.w - 0.6, 0.5); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(F.x0 + 0.3, y + 0.25, F.w - 0.6, 0.15); } if (wet) { c.fillStyle = 'rgba(120,180,220,.14)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(F.x0 + R() * F.w, F.y0 + R() * F.h, 0.8 + R(), 0.3 + R() * 0.3, 0, 0, TAU); c.fill(); } } } });
    S.liveAdd((c, cam, t, o) => { const stage = o.stage == null ? -1 : o.stage; if (stage < 0) return; const A = CROP_ART[o.crop] || CROP_ART.sunberry, T = cam.T, g = clamp(stage / 3, 0, 1); for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) { const x = (i - 1) * w * 0.3, y = cy + (r - 0.5) * dd * 0.42, p = cam.P([x, y, 0.9]), s = T * (0.35 + g * 0.9) * (A.tree ? 1.2 : 1), ph = Math.sin(t * 1.5 + x + y) * 0.06;
      if (A.tree && stage >= 2) { c.strokeStyle = '#8A5E3C'; c.lineWidth = Math.max(1, T * 0.14); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], p[1] - s * 1.1); c.stroke(); blob(c, p[0] + s * ph, p[1] - s * 1.5, s * 0.9, A.leaf, { lw: Math.max(1, T * 0.07) }); if (stage === 3) for (let k = 0; k < 3; k++) { const a = k * 2.1, fx = p[0] + Math.cos(a) * s * 0.6, fy = p[1] - s * 1.5 + Math.sin(a) * s * 0.5; c.fillStyle = A.fruit; c.beginPath(); for (let m = 0; m < 10; m++) { const aa = m / 10 * TAU - Math.PI / 2, rr2 = m % 2 ? s * 0.12 : s * 0.26; c.lineTo(fx + Math.cos(aa) * rr2, fy + Math.sin(aa) * rr2); } c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = Math.max(0.8, T * 0.05); c.stroke(); } continue; }
      // leaves: a fan of 3 to 5 blades
      const n = 3 + Math.min(2, stage); for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k - (n - 1) / 2) * 0.55 + ph, L = s * (A.feather ? 1.3 : 1); c.save(); c.translate(p[0], p[1]); c.rotate(a); c.fillStyle = k % 2 ? A.leaf : sh(A.leaf, -0.2); c.beginPath(); if (A.feather) { c.moveTo(0, 0); for (let m = 1; m <= 4; m++) { c.lineTo(L * m / 4, (m % 2 ? 1 : -1) * s * 0.22); } c.lineTo(L, 0); for (let m = 4; m >= 1; m--) c.lineTo(L * m / 4, (m % 2 ? -1 : 1) * s * 0.22); } else c.ellipse(L * 0.5, 0, L * 0.5, s * 0.3, 0, 0, TAU); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = Math.max(0.8, T * 0.06); c.stroke(); c.restore(); }
      if (stage === 3) { if (A.vine) { blob(c, p[0] + s * 0.5, p[1] + s * 0.1, s * 0.5, A.fruit, { lw: Math.max(0.8, T * 0.06), sy: 0.8 }); c.strokeStyle = sh(A.fruit, -0.4); c.lineWidth = Math.max(0.8, T * 0.05); c.beginPath(); c.moveTo(p[0] + s * 0.5, p[1] - s * 0.3); c.lineTo(p[0] + s * 0.5, p[1] + s * 0.5); c.stroke(); } else if (A.feather) { c.fillStyle = A.fruit; c.beginPath(); c.arc(p[0], p[1] - s * 0.05, s * 0.22, 0, Math.PI); c.fill(); } else for (let k = 0; k < 4; k++) blob(c, p[0] + (k - 1.5) * s * 0.35, p[1] - s * 0.5 - (k % 2) * s * 0.3, s * 0.18, A.fruit, { lw: Math.max(0.8, T * 0.05) }); }
      else if (stage === 2 && !A.vine) { c.fillStyle = '#FFF3C0'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(p[0] + (k - 1) * s * 0.4, p[1] - s * 0.6, s * 0.1, 0, TAU); c.fill(); } } } });
    return S;
  };
  BUILD.plot.variant = o => o && o.wet ? 'w' : 'd';

  /* ---- the fantasy set: sculptures, floating crystals, glowing growths ---- */
  const PEARL = mat('#F2EAF4', { c: ['#B4A4C6', '#F2EAF4', '#FFFFFF'], gloss: 1, glint: '#FFFFFF' }), ROSEG = mat('#E7A5A0', { c: ['#9E5C58', '#E7A5A0', '#FFE4DA'], gloss: 1, glint: '#FFF0E8' }), TEAL = mat('#7FE0E8', { c: ['#2F8C9A', '#7FE0E8', '#EAFFFF'], gloss: 1, glint: '#FFFFFF', edge: '#BFFFFF', edgeA: 0.35 });
  const carved = (c, F, side, band) => { if (side === 'T') { c.strokeStyle = rgba('#FFFFFF', 0.35); c.lineWidth = 0.1; c.strokeRect(F.x0 + 0.5, F.y0 + 0.4, F.w - 1, F.h - 0.8); return; } if (side === 'B') return; stones(c, F, band, '#C4BCCB', { ch: F.h + 1, sw: 2.2, gap: 0.1 }); c.strokeStyle = rgba('#FFFFFF', 0.45); c.lineWidth = 0.1; c.beginPath(); for (let x = F.x0 + 0.5; x < F.x1 - 0.3; x += 1.1) { c.moveTo(x, F.cy - 0.35); c.lineTo(x + 0.4, F.cy + 0.35); c.lineTo(x + 0.8, F.cy - 0.35); } c.stroke(); };
  function plinth(S, cy, w, d, h) { S.box(0, cy, 0, w, d, h * 0.45, mat('#C4BCCB'), { face: carved }); S.box(0, cy, h * 0.45, w - 1, d - 0.8, h * 0.55, mat('#D6CFDC'), { face: (c, F, side, band) => { if (side === 'T') { c.strokeStyle = rgba('#9A8FB0', 0.6); c.lineWidth = 0.1; c.beginPath(); c.arc(F.cx, F.cy, Math.min(F.w, F.h) * 0.32, 0, TAU); c.stroke(); } } }); return h; }
  // blocks laid along a 3D curve: pts [[x, y, z], ...], a cross-section (hy across, hz thick), up guides the flat face
  function ribbon(S, pts, hy, hz, mt, up, o) { const G = GK(); for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], dir = G.sub(b, a), L = G.len(dir), u = typeof up === 'function' ? up(i, a) : up; const Rm = G.frame(dir, u); S.add(G.block(L / 2 + 0.06, hy, hz), { t: G.mul(G.add(a, b), 0.5), R: Rm }, Object.assign({ mats: [mt], lw: 0.1, inner: false }, o || {})); } }
  BUILD.sculpture = sp => {
    const S = scene(), cy = -sp.d / 2, v = sp.v || 'spiral', G = GK();
    if (v === 'spiral') { const h0 = plinth(S, cy, 5.5, 5.5, 1.4), pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30, a = u * TAU * 1.75, r = 2.4 - u * 1.4; pts.push([Math.cos(a) * r, cy + Math.sin(a) * r, h0 + u * 12]); } ribbon(S, pts, 1.1, 0.22, ROSEG, (i, a) => [a[0], a[1] - cy, 0.2]); S.lathe(0, cy, h0 + 12.2, [[0.15, 0], [0.7, 0.4], [0.7, 0.9], [0.15, 1.3]], 8, PEARL, { dz: 2 }); S.liveAdd((c, cam, t) => { const p = cam.P([0, cy, h0 + 12.8]); glow(c, p[0], p[1], cam.T * 1.6, '#FFD6D0', 0.3 + 0.1 * Math.sin(t * 2)); }); }
    else if (v === 'heart') { const h0 = plinth(S, cy, 6, 4.5, 1.4), pts = []; for (let i = 0; i <= 28; i++) { const th = i / 28 * TAU + Math.PI, x = 16 * Math.pow(Math.sin(th), 3) * 0.26, z = (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) * 0.26; pts.push([x, cy, h0 + 5.2 + z]); } ribbon(S, pts, 0.75, 0.75, ROSEG, [0, -1, 0]); S.liveAdd((c, cam, t) => { const p = cam.P([0, cy, h0 + 5]); glow(c, p[0], p[1], cam.T * 2.6, '#FFB6C8', 0.22 + 0.08 * Math.sin(t * 3)); }); }
    else if (v === 'moonarch') { const span = 11, pts = []; for (let i = 0; i <= 22; i++) { const u = i / 22, a = Math.PI * (1 - u); pts.push([Math.cos(a) * span / 2, cy + 0.0, 0.8 + Math.sin(a) * 9]); } for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], u = (i + 0.5) / 22, th = 0.5 + Math.sin(u * Math.PI) * 1.1, dir = G.sub(b, a); S.add(G.block(G.len(dir) / 2 + 0.05, th, th), { t: G.mul(G.add(a, b), 0.5), R: G.frame(dir, [0, 1, 0]) }, { mats: [PEARL], lw: 0.1, inner: false }); } for (const sgn of [-1, 1]) S.lathe(sgn * span / 2, cy, 0, [[1.4, 0], [1.1, 0.5], [0.8, 0.9]], 8, mat('#C4BCCB'), { face: carved }); const R = rnd(5); for (let i = 0; i < 7; i++) { const u = 0.15 + R() * 0.7, a = Math.PI * (1 - u), x = Math.cos(a) * span / 2 * 0.93, z = 0.8 + Math.sin(a) * 9 - 1.2 - R() * 1.5; S.liveAdd((c, cam, t) => { const q = cam.P([x, cy, z + Math.sin(t * 1.4 + i) * 0.15]); glow(c, q[0], q[1], cam.T * 0.5, '#FFF4C0', 0.9); c.fillStyle = '#FFF8D8'; c.beginPath(); c.arc(q[0], q[1], Math.max(1, cam.T * 0.12), 0, TAU); c.fill(); }); } S.liveAdd((c, cam, t) => { const p = cam.P([0, cy, 9.8]); glow(c, p[0], p[1], cam.T * 3.4, '#E8E0FF', 0.2 + 0.05 * Math.sin(t)); }); }
    else if (v === 'orbit') { const h0 = plinth(S, cy, 5.5, 5.5, 1.4); S.lathe(0, cy, h0, [[1.2, 0], [0.5, 0.6], [0.45, 4.2], [0.9, 4.8]], 8, mat('#C4BCCB')); const oz = h0 + 8.2, ORB = lathe([[0.2, -1.9], [1.2, -1.5], [1.85, -0.7], [2.0, 0], [1.85, 0.7], [1.2, 1.5], [0.2, 1.9]], 12), orbM = mat('#FFE9B0', { c: ['#E0A860', '#FFE9B0', '#FFFFFF'], gloss: 1 }), rings = [[3.4, 0.35, 0.9, 0.6], [4.4, -0.5, 0.4, -0.45], [5.4, 1.1, 0.25, 0.3]];
      S.liveAdd((c, cam, t, o) => { const T = cam.T, p = cam.P([0, cy, oz]); glow(c, p[0], p[1], T * 4.5, '#FFD98A', 0.3 + 0.08 * Math.sin(t * 2)); const segs = []; rings.forEach(([r, tilt, spd, tilt2], k) => { const Rm = G.mm(G.rz(t * spd), G.mm(G.rx(tilt), G.ry(tilt2 + Math.sin(t * 0.3) * 0.2))); for (let i = 0; i < 28; i++) { const a0 = i / 28 * TAU, a1 = (i + 1) / 28 * TAU, p0 = G.add([0, cy, oz], G.mv(Rm, [Math.cos(a0) * r, Math.sin(a0) * r, 0])), p1 = G.add([0, cy, oz], G.mv(Rm, [Math.cos(a1) * r, Math.sin(a1) * r, 0])); segs.push({ dep: cam.dep(G.mul(G.add(p0, p1), 0.5)), s0: cam.P(p0), s1: cam.P(p1), w: 0.5 - k * 0.1, n: G.mv(Rm, [Math.cos(a0), Math.sin(a0), 0]) }); } }); segs.sort((a, b) => a.dep - b.dep); const orbDep = cam.dep([0, cy, oz]); let drawnOrb = false; c.lineCap = 'round'; for (const s of segs) { if (!drawnOrb && s.dep > orbDep) { G.solid(c, cam, ORB, { t: [0, cy, oz] }, { mats: [orbM], ink: '#6E4A2A', lw: 0.1, force: true }); glow(c, p[0], p[1], T * 1.4, '#FFFFFF', 0.5); drawnOrb = true; } const lit = 0.5 + 0.5 * (s.n[2] * 0.6 - s.n[0] * 0.5 + s.n[1] * 0.3); c.strokeStyle = INK; c.lineWidth = T * s.w + Math.max(1.6, T * 0.12); c.beginPath(); c.moveTo(s.s0[0], s.s0[1]); c.lineTo(s.s1[0], s.s1[1]); c.stroke(); c.strokeStyle = lit > 0.7 ? '#FFE4DA' : lit > 0.4 ? '#E7A5A0' : '#9E5C58'; c.lineWidth = T * s.w; c.stroke(); } if (!drawnOrb) G.solid(c, cam, ORB, { t: [0, cy, oz] }, { mats: [orbM], ink: '#6E4A2A', lw: 0.1, force: true }); }); S.bb = [[0, cy, oz, 6]]; }
    else if (v === 'wave') { const h0 = plinth(S, cy, 7, 4.5, 1.2), pts = []; for (let i = 0; i <= 26; i++) { const u = i / 26; let x, z; if (u < 0.45) { const s = u / 0.45; x = -4 + s * 5.5; z = h0 + s * s * 4.5; } else { const s = (u - 0.45) / 0.55, a = -Math.PI / 2 + s * Math.PI * 1.45; x = 1.5 + Math.cos(a) * 3.2 * (1 - s * 0.25); z = h0 + 4.5 + 3.2 + Math.sin(a) * 3.2 * (1 - s * 0.25); } pts.push([x, cy, z]); } ribbon(S, pts, 1.6, 0.5, TEAL, [0, -1, 0], { ink: '#1E5C66' }); const R = rnd(9); for (let i = 0; i < 6; i++) { const q = pts[20 + Math.floor(R() * 6)], x = q[0] + (R() - 0.5), z = q[2] + R() * 0.8; S.parts.push({ flat: (c, cam, T) => { const p = cam.P([x, cy - 1.7, z]); blob(c, p[0], p[1], T * (0.35 + R() * 0.3), '#F4FFFF', { lw: Math.max(0.8, T * 0.06) }); }, dep: (cy - 1.7) * CE + z * SE + 1, bb: [x, cy, z, 1] }); } S.liveAdd((c, cam, t) => { const p = cam.P([0.5, cy, h0 + 5]); glow(c, p[0], p[1], cam.T * 3.2, '#9FF0F4', 0.22 + 0.06 * Math.sin(t * 2.5)); }); }
    else { const h0 = plinth(S, cy, 5.5, 5.5, 1.4); for (let i = 0; i < 20; i++) { const u = i / 20, r = 1.9 * (1 - u * 0.7); S.add(G.block(r, r, 0.36), { t: [0, cy, h0 + 0.36 + i * 0.7], R: G.rz(u * 2.4) }, { mats: [ROSEG], lw: 0.1, inner: false, dz: i * 0.02 }); } S.add(G.pyramid(4, 0.65, 1.8, { a0: 2.4 * 0.95 + Math.PI / 4 }), { t: [0, cy, h0 + 0.36 + 19 * 0.7 + 0.18] }, { mats: [PEARL], dz: 1 }); S.liveAdd((c, cam, t) => { const p = cam.P([0, cy, h0 + 15.2]); glow(c, p[0], p[1], cam.T * 1.4, '#FFD6D0', 0.35 + 0.1 * Math.sin(t * 2)); }); }
    return S;
  };
  const runes = (c, F, side, band, col) => { if (side === 'T' || side === 'B') return; const R = rnd((F.w * 13 + F.h * 7) | 0); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(col || '#8FE8FF', 0.9); c.lineWidth = 0.13; c.lineCap = 'round'; c.shadowColor = rgba(col || '#8FE8FF', 0.9); for (let y = F.y0 + 0.9; y < F.y1 - 0.5; y += 1.2) { const x = F.cx + (R() - 0.5) * F.w * 0.4, n = 2 + Math.floor(R() * 3); c.beginPath(); let px = x - 0.3, py = y; c.moveTo(px, py); for (let k = 0; k < n; k++) { px += R() * 0.5; py += (R() - 0.5) * 0.7; c.lineTo(px, py); } c.stroke(); } c.restore(); };
  BUILD.floatcrystal = sp => { const S = scene(), cy = -sp.d / 2, G = GK(), col = sp.color || '#8FE8FF', cm = cryMat(col, [sh(col, -0.55), col, sh(col, 0.65)]); S.lathe(0, cy, 0, [[1.9, 0], [1.6, 0.5], [1.5, 1.3], [1.0, 1.6]], 8, mat('#8E88A0'), { face: (c, F, side, band) => runes(c, F, side, band, col) }); const K = G.bipyramid(6, 1.1, 2.6, 1.9, { seed: 3, jit: 0.2 }); S.light(0, cy, 4, 4, col);
    S.liveAdd((c, cam, t, o) => { const T = cam.T, z = 4.6 + Math.sin(t * 1.3 + (sp.entry ? sp.entry.x : 0)) * 0.4, p = cam.P([0, cy, z]), b = cam.P([0, cy, 1.7]); glow(c, b[0], b[1], T * 2.2, col, 0.3); shadow(c, b[0], b[1], 3.4 * T, 1, 0.45); glow(c, p[0], p[1], T * 3.2, col, 0.35 + 0.2 * (o.lit || 0)); G.solid(c, cam, K, { R: G.mm(G.rz(t * 0.8), G.rx(0.12)), t: [0, cy, z] }, { mats: [cm], ink: sh(col, -0.7), lw: 0.1, force: true }); glow(c, p[0], p[1], T * 1.0, '#FFFFFF', 0.55); for (let i = 0; i < 5; i++) { const u = (t * 0.35 + i / 5) % 1, a = t * 0.9 + i * 1.26, q = cam.P([Math.cos(a) * 2.2, cy + Math.sin(a) * 2.2, 1.8 + u * 5.5]); glow(c, q[0], q[1], T * 0.4, '#FFFFFF', (1 - u) * 0.9); } });
    S.bb = [[0, cy, 5, 3.4]]; return S; };
  BUILD.runestone = sp => { const S = scene(), cy = -sp.d / 2, G = GK(), col = '#8FE8FF'; S.add(G.bipyramid(6, 1.0, 1.0, 0.3, { seed: 2, jit: 0.4, sx: 2.6, sy: 1.6 }), { t: [0, cy, 0.3] }, { mats: [mat('#7A7484')] }); S.add(lathe([[1.5, 0], [1.75, 1.6], [1.6, 4.2], [1.2, 6.2], [0.5, 7.2]], 6, 0.3), { t: [0, cy, 0.9], R: G.mm(G.rx(0.06), G.ry(-0.08)), s: [1, 0.65, 1] }, { mats: [mat('#6E6A7A')], face: (c, F, side, band, fr) => { if (fr.n[1] > 0.2 || fr.n[0] < -0.5) runes(c, F, side, band, col); const R = rnd(4); c.fillStyle = rgba('#7FA062', 0.4); for (let i = 0; i < 2; i++) { c.beginPath(); c.ellipse(F.x0 + R() * F.w, F.y1 - R() * 1.5, 0.5, 0.3, 0, 0, TAU); c.fill(); } } }); S.light(0, cy + 0.5, 4, 3, col); S.liveAdd((c, cam, t, o) => { const p = cam.P([0, cy + 0.8, 4.5]); glow(c, p[0], p[1], cam.T * (2.4 + Math.sin(t * 1.6) * 0.3), col, 0.22 + 0.25 * (o.lit || 0)); }); return S; };
  BUILD.glowshrooms = sp => { const S = scene(), cy = -sp.d / 2, R = rnd(sp.entry ? sp.entry.x + sp.entry.y : 9), ms = []; for (let i = 0; i < 5; i++) { const x = (R() - 0.5) * (sp.w / U - 1), y = cy + (R() - 0.5) * 2, h = 1.2 + R() * 2.2, r = 0.7 + R() * 0.7, col = R() < 0.5 ? '#26A4B4' : '#7A52D0'; ms.push([x, y, h, r, col]); S.lathe(x, y, 0, [[r * 0.4, 0], [r * 0.3, h]], 7, mat('#EDE6F2')); S.lathe(x, y, h - 0.2, [[r * 0.75, 0], [r, 0.25], [r * 0.85, 0.65], [r * 0.4, 1.0], [0.1, 1.15]], 9, mat(col, { c: [sh(col, -0.4), col, sh(col, 0.4)], gloss: 0.5 }), { dz: 0.3, face: (c, F, side, band) => { if (side === 'B') return; const Rr = rnd(F.w * 5 | 0); c.fillStyle = 'rgba(255,255,255,.6)'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(F.x0 + Rr() * F.w, F.y0 + Rr() * F.h * 0.7, 0.12, 0, TAU); c.fill(); } } }); } S.liveAdd((c, cam, t) => { ms.forEach(([x, y, h, r, col], i) => { const p = cam.P([x, y, h - 0.1]); glow(c, p[0], p[1] + cam.T * 0.6, cam.T * (r * 1.5) * (0.9 + 0.1 * Math.sin(t * 2 + i * 1.3)), sh(col, 0.3), 0.16 + 0.08 * Math.sin(t * 2 + i * 1.3)); }); }); return S; };
  BUILD.windchime = sp => { const S = scene(), cy = -sp.d / 2, G = GK(); S.lathe(0, cy, 0, [[0.7, 0], [0.5, 0.4]], 8, M.stoneD); S.cyl(0, cy, 0.4, 0.2, 0.16, 7.5, 7, M.timberD); S.add(G.block(1.7, 0.14, 0.14), { t: [1.4, cy, 7.6] }, { mats: [M.timberD] }); S.lathe(2.9, cy, 6.3, [[0.1, 0], [0.9, 0.2], [0.9, 0.45], [0.1, 0.6]], 8, M.timber, { dz: 1 }); const ch = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ch.push([2.9 + Math.cos(a) * 0.7, cy + Math.sin(a) * 0.55, 1.6 + (i % 3) * 0.6, i % 2 ? 'tube' : 'gem', a]); }
    S.liveAdd((c, cam, t) => { const T = cam.T, sw = Math.sin(t * 1.3) * 0.25, sw2 = Math.cos(t * 1.7) * 0.18; for (const [x, y, L, kind, a] of ch) { const top = cam.P([x, y, 6.3]), bot = cam.P([x + sw * (L / 2) + Math.sin(a + t) * 0.1, y + sw2 * (L / 2), 6.3 - L - 0.6]); c.strokeStyle = '#6B6470'; c.lineWidth = Math.max(0.8, T * 0.04); c.beginPath(); c.moveTo(top[0], top[1]); c.lineTo(bot[0], bot[1] - T * L * 0.5); c.stroke(); if (kind === 'tube') { c.strokeStyle = INK; c.lineWidth = T * 0.3 + Math.max(1.4, T * 0.1); c.lineCap = 'round'; c.beginPath(); c.moveTo(bot[0], bot[1] - T * L * 0.5); c.lineTo(bot[0], bot[1]); c.stroke(); c.strokeStyle = '#D1A24B'; c.lineWidth = T * 0.3; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = T * 0.08; c.beginPath(); c.moveTo(bot[0] - T * 0.08, bot[1] - T * L * 0.45); c.lineTo(bot[0] - T * 0.08, bot[1] - T * 0.1); c.stroke(); } else { c.fillStyle = '#C9A4FF'; c.beginPath(); c.moveTo(bot[0], bot[1] - T * 0.6); c.lineTo(bot[0] + T * 0.3, bot[1] - T * 0.2); c.lineTo(bot[0], bot[1] + T * 0.25); c.lineTo(bot[0] - T * 0.3, bot[1] - T * 0.2); c.closePath(); c.fill(); c.strokeStyle = '#4A2A7A'; c.lineWidth = Math.max(1, T * 0.07); c.stroke(); glow(c, bot[0], bot[1], T * 0.6, '#C9A4FF', 0.5); } } }); S.bb = [[2.9, cy, 4, 2]]; return S; };
  BUILD.fairylights = sp => { const S = scene(), cy = -sp.d / 2, n = 9, R = rnd(sp.entry ? sp.entry.y : 3), ph = []; for (let i = 0; i < n; i++) ph.push([R() * TAU, 0.5 + R() * 0.7, 2 + R() * 2.2, ['#FFE9A8', '#FFC2E0', '#C8F0FF', '#D9FFC8'][i % 4]]); S.liveAdd((c, cam, t) => { const T = cam.T; for (let i = 0; i < n; i++) { const [p0, spd, rr2, col] = ph[i], a = p0 + t * spd * 0.5, r = (sp.w / U / 2) * (0.6 + 0.4 * Math.sin(t * 0.7 + p0)), x = Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.8, z = rr2 + Math.sin(t * 1.9 + p0 * 3) * 0.5, q = cam.P([x, y, z]), tw = 0.6 + 0.4 * Math.sin(t * 5 + p0 * 7); glow(c, q[0], q[1], T * 0.55 * tw, col, 0.55 * tw); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(q[0], q[1], Math.max(1, T * 0.09), 0, TAU); c.fill(); } }); S.bb = [[0, cy, 2.5, sp.w / U / 2 + 1]]; return S; };
  BUILD.wishingstar = sp => { const S = scene(), cy = -sp.d / 2, G = GK(), rx2 = sp.w / 2 - 0.3, ry2 = sp.d * SE / 2; S.add(lathe([[ry2, 0], [ry2 * 0.7, 0.9], [ry2 * 0.55, 0.5]], 12), { t: [0, cy, 0], s: [rx2 / ry2, 1, 1] }, { mats: [mat('#7A5A48')], face: (c, F, side, band) => { if (side === 'B') return; const R = rnd(3); c.fillStyle = rgba('#000000', 0.12); for (let i = 0; i < F.w * 4; i++) c.fillRect(F.x0 + R() * F.w, F.y0 + R() * F.h, 0.25, 0.2); } }); S.add(lathe([[ry2 * 0.55, 0], [ry2 * 0.55, 0.3]], 12), { t: [0, cy, 0.2], s: [rx2 / ry2, 1, 1] }, { mats: [mat('#2A2230')], inner: false, dz: 0.1 }); const STAR = G.bipyramid(5, 1.7, 0.9, 0.7, { a0: -Math.PI / 2 }); S.add(STAR, { t: [0.3, cy, 0.9], R: G.mm(G.rz(0.3), G.ry(0.35)) }, { mats: [PEARL], dz: 0.5 }); S.light(0.3, cy, 1.2, 4, '#FFF4C0'); S.liveAdd((c, cam, t) => { const T = cam.T, p = cam.P([0.3, cy, 1.4]); glow(c, p[0], p[1], T * (3 + Math.sin(t * 2.2) * 0.3), '#FFE9A8', 0.45); glow(c, p[0], p[1], T * 0.9, '#FFFFFF', 0.8); for (let i = 0; i < 4; i++) { const u = (t * 0.5 + i / 4) % 1, q = cam.P([0.3 + Math.sin(i * 2 + t) * 1.2, cy + Math.cos(i * 1.4) * 0.8, 1.2 + u * 3]); c.fillStyle = rgba('#FFF8D8', 1 - u); c.beginPath(); c.moveTo(q[0], q[1] - T * 0.3); c.lineTo(q[0] + T * 0.1, q[1]); c.lineTo(q[0], q[1] + T * 0.3); c.lineTo(q[0] - T * 0.1, q[1]); c.closePath(); c.fill(); } }); return S; };
  BUILD.lilypads = sp => { const S = scene(), cy = -sp.d / 2, R = rnd(sp.entry ? sp.entry.x : 8), pads = []; for (let i = 0; i < 4; i++) pads.push([(R() - 0.5) * (sp.w / U - 2), cy + (R() - 0.5) * 2.4, 1.0 + R() * 0.7, R() * TAU, i === 1]); pads.sort((a, b) => a[1] - b[1]); S.liveAdd((c, cam, t) => { const T = cam.T; pads.forEach(([x, y, r, a, fl], i) => { const bob = Math.sin(t * 1.2 + i * 1.7) * 0.06, p = cam.P([x, y, bob]); c.save(); c.translate(p[0], p[1]); c.scale(1, SE); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r * T, a + 0.5, a + TAU - 0.5); c.closePath(); c.fillStyle = '#4F9A4A'; c.fill(); c.save(); c.clip(); c.fillStyle = '#6DB85E'; c.beginPath(); c.arc(-r * T * 0.25, -r * T * 0.3, r * T * 0.8, 0, TAU); c.fill(); c.strokeStyle = 'rgba(30,80,40,.5)'; c.lineWidth = Math.max(0.8, T * 0.05); c.beginPath(); for (let k = 0; k < 6; k++) { const aa = a + 0.9 + k * 0.8; c.moveTo(0, 0); c.lineTo(Math.cos(aa) * r * T, Math.sin(aa) * r * T); } c.stroke(); c.restore(); c.strokeStyle = INK; c.lineWidth = Math.max(1.2, T * 0.09); c.stroke(); c.restore(); if (fl) { for (let k = 0; k < 6; k++) { const aa = k / 6 * TAU; blob(c, p[0] + Math.cos(aa) * T * 0.45, p[1] - T * 0.35 + Math.sin(aa) * T * 0.3, T * 0.3, '#F7B6CC', { lw: Math.max(0.8, T * 0.06) }); } blob(c, p[0], p[1] - T * 0.45, T * 0.22, '#FFE27A', { lw: Math.max(0.8, T * 0.05) }); } }); }); S.bb = [[0, cy, 0, sp.w / U / 2 + 0.5]]; return S; };
  BUILD.stonelantern = sp => { const S = scene(), cy = -sp.d / 2, st = mat('#9C9AA4'), face = (c, F, side, band) => { if (side !== 'T' && side !== 'B') { const R = rnd(F.w * 3 | 0); c.fillStyle = rgba('#7FA062', 0.35); for (let i = 0; i < 2; i++) { c.beginPath(); c.ellipse(F.x0 + R() * F.w, F.y1 - R() * 0.8, 0.4, 0.2, 0, 0, TAU); c.fill(); } } }; S.lathe(0, cy, 0, [[1.5, 0], [1.3, 0.5], [0.9, 0.9]], 8, st, { face }); S.cyl(0, cy, 0.9, 0.55, 0.5, 3.6, 8, st); S.box(0, cy, 4.5, 2.6, 2.6, 0.5, st); S.box(0, cy, 5.0, 1.9, 1.9, 2.0, st, { dz: 0.3, face: (c, F, side, band) => { if (side === 'T' || side === 'B') return; c.fillStyle = '#3A3240'; rr(c, F.cx - 0.55, F.cy - 0.6, 1.1, 1.2, 0.1); c.fill(); c.fillStyle = rgba('#FFD27A', 0.85); rr(c, F.cx - 0.45, F.cy - 0.5, 0.9, 1.0, 0.08); c.fill(); } }); S.hip(0, cy, 7.0, 3.6, 3.6, 0.5, 0.5, 1.3, st, { dz: 0.6 }); S.lathe(0, cy, 8.3, [[0.3, 0], [0.5, 0.3], [0.35, 0.7], [0.08, 1.1]], 8, st, { dz: 0.8 }); S.light(0, cy, 6, 3); S.liveAdd((c, cam, t, o) => { const p = cam.P([0, cy, 6]); glow(c, p[0], p[1], cam.T * (2.4 + Math.sin(t * 2.5) * 0.15), '#FFD27A', 0.3 + 0.5 * (o.lit || 0)); }); return S; };
  // a tidy box for a kind the kit does not know
  BUILD.placeholder = sp => { const S = scene(), cy = -sp.d / 2; S.box(0, cy, 0, sp.w - 0.4, sp.d - 0.4, 3, mat('#D9CBB0'), { face: (c, F, side, band) => { if (side !== 'S') return; c.fillStyle = INK; c.font = `700 1.2px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(sp.kind || '?').slice(0, 10), F.cx, F.cy); } }); return S; };

  /* ---- make / draw / the cache ---- */
  // buildings are modelled shallower than their footprint (the footprint is a top-down depth; the camera looks down at
  // 35 degrees, so a full-depth roof would fill the screen): the body sits at the front of its collision box
  const DEPTH = kind => BIG[kind] ? 1.0 : DY;
  const BIG = { cottage: 1, shed: 1, dojo: 1, shrine: 1, altar: 1, kitchen: 1, stall: 1, workshop: 1, hangar: 1, hedge: 1, dome: 1, mine: 1, tent: 1, gym: 1, greenhouse: 1 };
  const NOCOL = { glowshrooms: 1, windchime: 1, fairylights: 1, lilypads: 1 };
  const scenes = new Map(), sprites = new Map(), SPRITE_MAX = 140;
  // the whole scene turned about the baseline point to face another way (a bench facing east)
  function turnScene(S, ang) { const G = GK(), R = G.rz(ang); for (const p of S.parts) { if (p.flat) { if (p.bb) { const q = G.mv(R, p.bb.slice(0, 3)); p.bb = [q[0], q[1], q[2], p.bb[3]]; } continue; } p.xf.R = p.xf.R ? G.mm(R, p.xf.R) : R; p.xf.t = G.mv(R, p.xf.t || [0, 0, 0]); p.turned = R; } S.lights = S.lights.map(([x, y, z, r, col]) => { const q = G.mv(R, [x, y, z]); return [q[0], q[1], q[2], r, col]; }); S.R = S.R ? G.mm(R, S.R) : R; return S; }
  function sceneFor(kind, sp, key) {
    let S = scenes.get(key); if (S) return S;
    const b = BUILD[kind] || BUILD.placeholder;
    try { S = b(sp); } catch (e) { S = BUILD.placeholder(sp); }
    if (sp.face && sp.face !== 's' && faceDir[sp.face] != null && kind !== 'gate' && kind !== 'riftgate' && kind !== 'stall') turnScene(S, faceDir[sp.face]);
    const bb = bounds(S, U); S.top = Math.max(4, -bb[1]); S.bb1 = bb;
    scenes.set(key, S); return S;
  }
  // the static picture of a scene at Tpx device pixels per unit
  function sprite(S, key, Tpx) {
    const k = key + '|' + Tpx.toFixed(2); let sp = sprites.get(k); if (sp) { sp.at = ++tick; return sp; }
    if (sprites.size >= SPRITE_MAX) { let oldest = null; for (const [kk, v] of sprites) if (!oldest || v.at < oldest[1].at) oldest = [kk, v]; if (oldest) sprites.delete(oldest[0]); }
    const G = GK(), bb = bounds(S, Tpx), pad = Math.ceil(Tpx * 0.5) + 3, ox = -bb[0] + pad, oy = -bb[1] + pad, W = Math.min(4096, Math.ceil(bb[2] - bb[0] + pad * 2)), H = Math.min(4096, Math.ceil(bb[3] - bb[1] + pad * 2));
    const cv = document.createElement('canvas'); cv.width = Math.max(2, W); cv.height = Math.max(2, H); const g = cv.getContext('2d');
    const pxWas = PX; PX = 1 / Tpx; try { paintScene(g, S, G.cam(ox, oy, Tpx)); } catch (e) { g.fillStyle = '#C9A'; g.fillRect(0, 0, W, H); } PX = pxWas;
    // the baseline split for fading: the picture above this row dims when the pet stands behind the building
    sp = { cv, ox, oy, at: ++tick }; sprites.set(k, sp); return sp;
  }
  let tick = 0;
  function make(entry) {
    entry = entry || {}; const kind = String(entry.kind || 'box'), G = GK();
    if (!CRYSTAL && G) CRYSTAL = G.bipyramid(5, 1.0, 1.9, 1.4);
    const df = DEF[kind] || [60, 40], wpx = entry.w || df[0], dpx = entry.d || df[1];
    const sp = { kind, w: wpx / U, d: dpx / U * DEPTH(kind), face: entry.face || 's', color: entry.color, game: entry.game, v: entry.v, entry };
    const vkey = `${kind}|${wpx}x${dpx}|${sp.face}|${sp.color || ''}|${sp.v || ''}`, vfn = BUILD[kind] && BUILD[kind].variant;
    const top = () => sceneFor(kind, sp, vkey + (vfn ? '|' + vfn({}) : '')).top;
    const noCol = NOCOL[kind] || (kind === 'sculpture' && sp.v === 'moonarch');
    const D = { kind, w: noCol ? 0 : wpx, d: noCol ? 0 : dpx, top: top(), door: entry.door ? entry.door.slice() : null, entry };
    if (kind === 'sculpture' && sp.v === 'moonarch') D.feet = [[entry.x - 55, entry.y, 28, 22], [entry.x + 55, entry.y, 28, 22]];
    D.draw = (c, X, Y, k, t, o) => {
      o = o || {}; if (!G) { c.fillStyle = '#C9A'; c.fillRect(X - wpx * k / 2, Y - dpx * k, wpx * k, dpx * k); return; }
      const key = vkey + (vfn ? '|' + vfn(o) : ''), S = sceneFor(kind, sp, key), tr = c.getTransform ? c.getTransform() : null, dpr = clamp(tr ? Math.hypot(tr.a, tr.b) : 1, 0.5, 3);
      const res = k * dpr, bucket = Math.round(Math.log(res) / Math.log(1.05)), rb = Math.pow(1.05, bucket), Tpx = rb * U, sc = k * U / Tpx;
      const fade = o.fade == null ? 1 : clamp(o.fade, 0, 1);
      if (S.parts.length) {
        const spr = sprite(S, key, Tpx), cv = spr.cv, x0 = X - spr.ox * sc, y0 = Y - spr.oy * sc, w = cv.width * sc, h = cv.height * sc;
        if (fade >= 0.999) c.drawImage(cv, x0, y0, w, h);
        else { const row = clamp(Math.round(spr.oy - Math.min(dpx, 80) * rb * 0.8), 1, cv.height - 1); const ga = c.globalAlpha; c.globalAlpha = ga * fade; c.drawImage(cv, 0, 0, cv.width, row, x0, y0, w, row * sc, 1); c.globalAlpha = ga; c.drawImage(cv, 0, row, cv.width, cv.height - row, x0, y0 + row * sc, w, (cv.height - row) * sc); }
      }
      if (S.live.length || (o.lit > 0 && S.lights.length)) {
        const cam0 = G.cam(X, Y, k * U), cam = S.R ? wrapCam(cam0, S.R) : cam0, ga = c.globalAlpha; c.globalAlpha = ga * (0.5 + 0.5 * fade); const pxWas = PX; PX = 1 / (k * U * dpr);
        if (o.lit > 0) for (const [lx, ly, lz, r, col] of S.lights) { const p = cam.P([lx, ly, lz]); glow(c, p[0], p[1], r * k * U * 0.9, col || '#FFD27A', 0.45 * o.lit); }
        for (const L of S.live) { try { L(c, cam, t || 0, o, X, Y, k); } catch (e) { /* a living bit that fails stays still */ } }
        PX = pxWas; c.globalAlpha = ga;
      }
    };
    return D;
  }
  const kinds = Object.keys(BUILD).filter(k => k !== 'placeholder');
  return { make, kinds, shadow, glow, GK, _kit: { scene, mat, sh, mix, rgba, tone, rnd, C, M, BUILD, DEF, paintScene, bounds, sceneFor, sprites, scenes }, U, SE, CE };
})();
globalThis.HubGeo = HubGeo;
