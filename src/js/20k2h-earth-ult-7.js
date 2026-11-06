/* ---------- Earth, reworked: Gilded Quicksand ----------
   A huge patch of terrain becomes shimmering mineral sand that slows and grinds the monsters, then hardens and ruptures.
   Formation (0.9 s): thin golden cracks spread through the area, then the surface breaks into countless small dark
   grains edged with amber. Active field (6 s at level 1, 8 at Adept, 10 at Celestial; levels between interpolate;
   radius 3 / 4 / 5 x K, the floor's ellipse): low ridges of metallic sand roll slowly through it, larger dark patches
   between sparse bright glints; the grains drift with the dunes; the perimeter crumbles inward and replenishes them.
   Every monster inside is slowed (its own slow, m.sandT: 40 %, bosses too, no frost tint) and takes an
   Earth tick every 0.5 s on the game clock (frame-rate independent); shallow rings of grains slide inward round its
   feet and a lip of piled sand covers just the bottom of it (a foot-level sinking, the body stays visible). Adept: a
   second set of dunes crossing the first, amber crystal tips surfacing and sinking. Celestial: the ripples organise
   into broad concentric mineral terraces drifting inward, gold veins with light travelling between them.
   Expiry: the sand stops dead; bright amber lines join across the whole field into a mosaic of stone plates (the
   frozen sand itself, cut into plates with dark sides); the slow ends; the plates lift a little with light under their
   gaps, then rupture upward in one substantial Earth hit (separate from the last tick; non-boss monsters are lifted),
   the plates thrown in short weighted arcs, breaking where they land, a low dust veil, fading gold specks, the light
   on the floor fading.
   Damage (DK = base x K x evoK), a monster in the field the whole time: 13 / 15.5 at Adept / 18 at Celestial x DK,
   70 % in the ticks, 30 % in the rupture.
   The field is composed each frame in one offscreen layer (cached grain, dune and patch textures as moving patterns,
   terraces from a cached ring, an irregular feathered mask), then laid on the floor; plates are cut once from the frozen
   layer. No per-frame gradients, no shadowBlur; the floor keeps only light when it is gone. */
(() => {
  const U = ELEM_IMPL.earth.ult; delete U.amberepoch;
  const TAU = Math.PI * 2;
  const AMBER = '#D98A1E', GOLD = '#F2B73A', HONEY = '#FFCF5C', PALE = '#FFE9B8', CORE = '#FFF4D6';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  function scr(c) { const m = c.getTransform(), a = m.a || 1; return { k: a }; }
  const GY = 0.55;
  let H;

  /* ---- cached textures ---- */
  // wrap-around drawing on a square tile of S px
  const wrapDo = (S, x, y, r, f) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const X = x + ox, Y = y + oy; if (X > -r && X < S + r && Y > -r && Y < S + r) f(X, Y); } };
  const GPAL = ['#241B14', '#2E241B', '#3A3028', '#33281F', '#4A3A2B', '#1A130D', '#5C4126'];
  function grains(g, S, n, seed, sparse) {
    const R = mulberry32(seed);
    for (let i = 0; i < n; i++) { const x = R() * S, y = R() * S, r = (sparse ? 1.1 : 0.8) + R() * (sparse ? 1.5 : 1.4), col = GPAL[Math.floor(R() * (sparse ? 5 : 7))], lit = R(), rot = R() * 3;
      wrapDo(S, x, y, r + 2, (X, Y) => {
        g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.ellipse(X + 0.6, Y + 0.7, r, r * 0.8, rot, 0, TAU); g.fill();
        g.fillStyle = col; g.beginPath(); g.ellipse(X, Y, r, r * 0.8, rot, 0, TAU); g.fill();
        // the amber edge on its lit side; now and then a bright metallic one
        g.fillStyle = lit < (sparse ? 0.25 : 0.06) ? 'rgba(255,207,92,0.85)' : lit < 0.55 ? 'rgba(217,138,30,0.55)' : 'rgba(242,183,58,0.28)';
        g.beginPath(); g.ellipse(X - r * 0.3, Y - r * 0.3, r * 0.5, r * 0.36, rot, 0, TAU); g.fill(); }); } }
  const grainTile = () => fxSprite('qsgrain', 256, 256, g => {
    g.fillStyle = '#20180F'; g.fillRect(0, 0, 256, 256); const R = mulberry32(71);
    for (let i = 0; i < 40; i++) { const x = R() * 256, y = R() * 256, r = 14 + R() * 40, dk = R() < 0.6; wrapDo(256, x, y, r, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, r); gr.addColorStop(0, dk ? 'rgba(8,5,3,0.35)' : 'rgba(92,65,38,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(X - r, Y - r, r * 2, r * 2); }); }
    grains(g, 256, 5200, 17, false); });
  const grainTop = () => fxSprite('qsgrain2', 256, 256, g => grains(g, 256, 700, 29, true));
  // the large dark patches between the glints
  const blotTile = () => fxSprite('qsblot', 128, 128, g => { const R = mulberry32(5); for (let i = 0; i < 9; i++) { const x = R() * 128, y = R() * 128, r = 16 + R() * 26; wrapDo(128, x, y, r, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, r); gr.addColorStop(0, 'rgba(6,4,2,0.55)'); gr.addColorStop(0.6, 'rgba(6,4,2,0.22)'); gr.addColorStop(1, 'rgba(6,4,2,0)'); g.fillStyle = gr; g.fillRect(X - r, Y - r, r * 2, r * 2); }); } });
  // the dunes: wavy ridges, a lit gold slope, a sharp crest, a shadowed lee (periodic both ways)
  const ridgeTile = () => fxSprite('qsridge', 256, 256, g => { const im = g.createImageData(256, 256), d = im.data;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const v = y / 32 + 0.35 * Math.sin(TAU * (x / 256 * 2 + y / 256)) + 0.12 * Math.sin(TAU * (x / 256 * 5 - y / 256 * 2)), f = v - Math.floor(v);
      const hi = sstep(0.18, 0.47, f) * (1 - sstep(0.47, 0.53, f)), crest = Math.exp(-Math.pow((f - 0.49) / 0.025, 2)), sh = sstep(0.5, 0.58, f) * (1 - sstep(0.7, 0.98, f)), o = (y * 256 + x) * 4;
      if (hi + crest > sh) { d[o] = 255; d[o + 1] = 200 + 30 * crest; d[o + 2] = 120 + 60 * crest; d[o + 3] = 255 * Math.min(1, hi * 0.28 + crest * 0.42); } else { d[o] = 4; d[o + 1] = 2; d[o + 2] = 0; d[o + 3] = 255 * sh * 0.5; } }
    g.putImageData(im, 0, 0); });
  // the field's edge: an irregular feathered disc
  const maskSpr = () => fxSprite('qsmask', 512, 512, g => { const im = g.createImageData(512, 512), d = im.data;
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) { const dx = (x - 256) / 256, dy = (y - 256) / 256, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx), e = 0.93 + 0.025 * Math.sin(a * 7 + 1) + 0.018 * Math.sin(a * 13 + 2.3) + 0.012 * Math.sin(a * 23), o = (y * 512 + x) * 4;
      const nz = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1, f0 = 1 - sstep(e - 0.4, e, r), fz = Math.max(0, Math.min(1, f0 * 1.25 - 0.25 * Math.abs(nz) * (1 - f0) * 2)); d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = 255 * fz * fz * (3 - 2 * fz); }   // a wide, grainy feather: the sand thins out into the floor
    g.putImageData(im, 0, 0); });
  // a terrace: a lit band with a shadow inside it, feathered
  const terrSpr = () => fxSprite('qsterr', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(0,0,0,0)'], [0.74, 'rgba(0,0,0,0)'], [0.83, 'rgba(4,2,0,0.42)'], [0.9, 'rgba(4,2,0,0.12)'], [0.93, 'rgba(255,214,140,0.32)'], [0.965, 'rgba(255,233,184,0.42)'], [1, 'rgba(255,233,184,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const bandSpr = () => fxSprite('qsband', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); [[0, 'rgba(217,138,30,0)'], [0.6, 'rgba(217,138,30,0)'], [0.8, 'rgba(217,138,30,0.3)'], [0.9, 'rgba(242,183,58,0.75)'], [0.95, 'rgba(255,233,184,0.8)'], [1, 'rgba(255,233,184,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const dustSpr = () => fxSprite('qsdust', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(160,132,98,0.55)'); gr.addColorStop(0.45, 'rgba(128,104,76,0.28)'); gr.addColorStop(1, 'rgba(96,76,56,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  const pitSpr = () => fxSprite('qspit', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(6,4,2,0.6)'); gr.addColorStop(0.5, 'rgba(6,4,2,0.3)'); gr.addColorStop(1, 'rgba(6,4,2,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  // a shallow ring of grains (sliding inward to a monster's feet), feathered both sides
  const ringSpr = () => fxSprite('qsring', 160, 160, g => { const R = mulberry32(41);
    for (let i = 0; i < 520; i++) { const a = R() * TAU, rr = 0.62 + 0.36 * R(), w = Math.sin((rr - 0.62) / 0.36 * Math.PI), x = 80 + Math.cos(a) * rr * 78, y = 80 + Math.sin(a) * rr * 78, r = 1.2 + R() * 1.6; g.globalAlpha = w * (0.7 + 0.3 * R());
      g.fillStyle = GPAL[Math.floor(R() * 5)]; g.beginPath(); g.ellipse(x, y, r, r * 0.8, 0, 0, TAU); g.fill(); g.fillStyle = R() < 0.3 ? 'rgba(255,207,92,0.8)' : 'rgba(217,138,30,0.55)'; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.35, r * 0.45, r * 0.3, 0, 0, TAU); g.fill(); } });
  // the lip of piled sand in front of a monster's feet: a front half-ring, its top edge lit, its ends feathered
  const lipSpr = () => fxSprite('qslip', 192, 72, g => { const R = mulberry32(53);
    for (let i = 0; i < 900; i++) { const a = R() * Math.PI, rr = 0.7 + 0.3 * R(), x = 96 + Math.cos(a) * rr * 92, y = 18 + Math.sin(a) * rr * 36 - (1 - rr) * 26 * Math.sin(a), end = Math.min(1, Math.sin(a) * 2.2), r = 1.3 + R() * 1.8, top = 1 - (rr - 0.7) / 0.3;
      g.globalAlpha = end * (0.75 + 0.25 * R()); g.fillStyle = GPAL[Math.floor(R() * 6)]; g.beginPath(); g.ellipse(x, y, r, r * 0.8, 0, 0, TAU); g.fill();
      g.fillStyle = top > 0.6 && R() < 0.6 ? 'rgba(255,214,140,0.8)' : 'rgba(217,138,30,0.5)'; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.35, r * 0.45, r * 0.3, 0, 0, TAU); g.fill(); } });
  // a small clump of grains (the perimeter crumbling in)
  const clumpSpr = i => fxSprite('qsclump' + i, 32, 32, g => { const R = mulberry32(90 + i); for (let k = 0; k < 26; k++) { const a = R() * TAU, rr = R() * 11, x = 16 + Math.cos(a) * rr, y = 16 + Math.sin(a) * rr * 0.7, r = 1.2 + R() * 1.6; g.globalAlpha = 1 - rr / 13; g.fillStyle = GPAL[Math.floor(R() * 6)]; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = 'rgba(242,183,58,0.6)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, TAU); g.fill(); } });
  // an amber crystal tip: three facets, a pale edge, an ink edge
  const tipSpr = () => fxSprite('qstip', 48, 72, g => { g.lineJoin = 'round'; const F = (pts, col) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fillStyle = col; g.fill(); };
    const T0 = [24, 4], L = [10, 60], M = [22, 66], Rr = [38, 58]; F([T0, L, M], '#FFCF5C'); F([T0, M, Rr], '#B86A12'); F([T0, [16, 30], [12, 52], L], '#FFE9B8');
    g.strokeStyle = 'rgba(40,22,6,0.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(L[0], L[1]); g.lineTo(T0[0], T0[1]); g.lineTo(Rr[0], Rr[1]); g.stroke(); g.strokeStyle = 'rgba(255,244,214,0.9)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(T0[0], T0[1]); g.lineTo(M[0], M[1]); g.stroke(); });
  const glintSpr = () => fxSprite('qsglint', 48, 48, g => { g.globalCompositeOperation = 'lighter'; g.drawImage(glowSprite(HONEY), 12, 12, 24, 24); g.drawImage(glowSprite(CORE), 19, 19, 10, 10); g.fillStyle = 'rgba(255,244,214,0.9)'; g.beginPath(); g.moveTo(24, 4); g.lineTo(25.2, 22.8); g.lineTo(44, 24); g.lineTo(25.2, 25.2); g.lineTo(24, 44); g.lineTo(22.8, 25.2); g.lineTo(4, 24); g.lineTo(22.8, 22.8); g.closePath(); g.fill(); });
  // stamped soft light along a path (paint time)
  function stampPath(g, pts, w, col, a, taper) { let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; } if (L < 1) return;
    const img = glowSprite(col), step = Math.max(1, w * 0.3); let i = 0, acc = 0;
    for (let d = 0; d <= L; d += step) { while (i < seg.length - 1 && acc + seg[i] < d) { acc += seg[i]; i++; } const e = seg[i] ? (d - acc) / seg[i] : 0, x = lerp(pts[i][0], pts[i + 1][0], e), y = lerp(pts[i][1], pts[i + 1][1], e), u = d / L, env = taper ? Math.min(1, u / 0.06) * Math.pow(1 - u, 0.7) : Math.min(1, u / 0.15, (1 - u) / 0.15), ww = w * (taper ? 0.35 + 0.65 * (1 - u) : 1);
      g.globalAlpha = Math.min(1, a * env); g.drawImage(img, x - ww, y - ww, ww * 2, ww * 2); } g.globalAlpha = 1; }
  // the formation's cracks: thin gold lines branching out from the centre (light only; 512 px, centre 256)
  function crackSpr(seed) { return fxSprite('qscrack' + seed, 512, 512, g => { g.globalCompositeOperation = 'lighter'; const R = mulberry32(seed);
    const walk = (x, y, a, n, len, w, depth) => { const pts = [[x, y]]; for (let k = 0; k < n; k++) { a += (R() - 0.5) * 0.7; x += Math.cos(a) * len; y += Math.sin(a) * len; pts.push([x, y]); if (Math.hypot(x - 256, y - 256) > 240) break; }
      stampPath(g, pts, w * 3, AMBER, 0.28, true); stampPath(g, pts, w, GOLD, 0.6, true); stampPath(g, pts, w * 0.4, HONEY, 0.45, true);
      if (depth > 0) for (let b = 0; b < 2; b++) { const q = pts[1 + Math.floor(R() * (pts.length - 1))]; if (q) walk(q[0], q[1], a + (R() < 0.5 ? 0.9 : -0.9), Math.ceil(n * 0.55), len * 0.8, w * 0.7, depth - 1); } };
    for (let i = 0; i < 9; i++) walk(256, 256, i / 9 * TAU + R() * 0.4, 12, 21, 3.2, 2); }); }
  // the gold veins between the terraces (Celestial): radial meanders (light only; 512 px)
  function veinSet(seed) { const R = mulberry32(seed), out = []; for (let i = 0; i < 9; i++) { let a = i / 9 * TAU + R() * 0.5, r = 0.95; const pts = [[Math.cos(a) * r, Math.sin(a) * r]]; while (r > 0.12) { r -= 0.07; a += (R() - 0.5) * 0.35; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } out.push(pts); } return out; }
  function veinSpr(seed, V) { return fxSprite('qsvein' + seed, 512, 512, g => { g.globalCompositeOperation = 'lighter'; for (const v of V) { const pts = v.map(p => [256 + p[0] * 248, 256 + p[1] * 248]); stampPath(g, pts, 9, AMBER, 0.22); stampPath(g, pts, 3, GOLD, 0.55); stampPath(g, pts, 1.3, PALE, 0.5); } }); }

  /* ---- the mosaic: Voronoi cells inside the unit disc (the field's ellipse normalised) ---- */
  function clipHalf(poly, mx, my, nx, ny) { const out = [], f = p => (p[0] - mx) * nx + (p[1] - my) * ny; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], fa = f(a), fb = f(b); if (fa <= 0) out.push(a); if ((fa < 0) !== (fb < 0)) { const u = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); } } return out; }
  function mosaic(sp, seed) {
    const pts = [], n = Math.ceil(1 / sp) + 1;
    for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) { const x = (i + (j & 1) * 0.5 + (R1(seed + i * 7.1 + j * 3.3) - 0.5) * 0.7) * sp, y = (j * 0.87 + (R1(seed + i * 2.9 + j * 5.7) - 0.5) * 0.6) * sp; if (Math.hypot(x, y) < 1 + sp * 0.3) pts.push([x, y]); }
    const circ = []; for (let k = 0; k < 40; k++) circ.push([Math.cos(k / 40 * TAU) * 0.985, Math.sin(k / 40 * TAU) * 0.985]);
    const cells = [];
    for (const p of pts) { let poly = circ; for (const q of pts) { if (q === p) continue; const dx = q[0] - p[0], dy = q[1] - p[1]; if (dx * dx + dy * dy > sp * sp * 6.5) continue; poly = clipHalf(poly, (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, dx, dy); if (poly.length < 3) break; }
      if (poly.length < 3) continue; let cx = 0, cy = 0; for (const v of poly) { cx += v[0] / poly.length; cy += v[1] / poly.length; } if (Math.hypot(cx, cy) > 0.97) continue;
      const g = sp * 0.045; cells.push({ poly: poly.map(v => { const dx = v[0] - cx, dy = v[1] - cy, d = Math.hypot(dx, dy) || 1; return [v[0] - dx / d * g, v[1] - dy / d * g]; }), cx, cy, s: R1(seed + cells.length * 1.37) }); }
    return cells;
  }

  /* ================= E8 Gilded Quicksand ================= */
  U.quicksand = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, K = C.K, evoK = 1 + 0.08 * (ev - 1), DK = C.base * K * evoK;
    const DUR = 6 + (ev - 1) * 2 / 3, R = (3 + (ev - 1) / 3) * K, FORM = 0.9, TE = FORM + DUR, TL = TE + 0.42, TR = TE + 0.9, LIFE = TR + 2.0;
    const TOT = [13, 13.8, 14.7, 15.5, 16.3, 17.2, 18][ev - 1] * DK, NT = Math.floor((DUR - 0.5) / 0.5 + 1e-6) + 1, TICK = TOT * 0.7 / NT, RUP = TOT * 0.3;
    const p0 = H.X.walkPoint(C.tx, C.ty, { r: 0.5, mv: 0 }), cx = p0.x, cy = p0.y, seed = 1 + Math.floor(Math.random() * 997);
    const inField = m => { const dx = (m.x - cx) / (R + m.r * 0.4), dy = (m.y - cy) / (R * GY + m.r * 0.4); return dx * dx + dy * dy < 1; };
    const cells = mosaic(0.95 / R, seed), VEINS = CEL ? veinSet(seed) : null;
    // the mosaic's inner edges in three bands by distance from the centre (the outer ones fade, the rim has none)
    const EB = [[], [], []]; for (const cel of cells) { const P = cel.poly; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], r = Math.hypot((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); if (r > 0.93) continue; EB[r < 0.66 ? 0 : r < 0.82 ? 1 : 2].push([a[0], a[1], b[0], b[1]]); } }
    const EBA = [1, 0.7, 0.32];
    function edges(c, X, Y, rx, ry, ws, al) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (let k = 0; k < 3; k++) { c.beginPath(); for (const e of EB[k]) { c.moveTo(X + e[0] * rx, Y + e[1] * ry); c.lineTo(X + e[2] * rx, Y + e[3] * ry); }
        for (const [col, w, a] of ws) { c.globalAlpha = Math.min(1, a * al * EBA[k]); c.strokeStyle = col; c.lineWidth = w; c.stroke(); } } c.restore(); }
    const glints = []; for (let i = 0; i < H.n(CEL ? 34 : 26); i++) { const a = R1(seed + i * 3.1) * TAU, r = Math.sqrt(R1(seed + i * 5.3)) * 0.9; glints.push({ u: Math.cos(a) * r, v: Math.sin(a) * r, w: 1.3 + 1.7 * R1(seed + i * 7.7), ph: R1(seed + i) * TAU }); }
    const tips = ADE ? Array.from({ length: CEL ? 10 : 6 }, (_, i) => ({ t0: FORM + 0.4 + i * 0.37, u: 0, v: 0, i })) : [];
    const feet = new Map(), crumbs = [], dust = [], specks = [];
    let baseC = null, movC = null, movG = null, movT = -1;
    let next = 0, dead = false, halted = false, ruptured = false, snap = null, snapT = 0, snapK = 1, plates = null, built = 0, off = null, offG = null, ptn = null, slowed = new Set();
    H.X.banner('GILDED QUICKSAND', '', C.col, 1.4); H.X.sfx.hum();
    // where a unit-disc point lies on screen
    const at = (u, v, T) => [H.sx(cx) + u * R * T, H.sy(cy) + v * R * T * GY];
    function placeTip(p) { const a = R1(seed + p.i * 9.1 + p.t0) * TAU, r = 0.25 + 0.6 * Math.sqrt(R1(seed + p.i * 4.3 + p.t0 * 1.7)); p.u = Math.cos(a) * r; p.v = Math.sin(a) * r; }
    tips.forEach(placeTip);
    function rupture() {
      for (const m of H.living()) if (inField(m)) { H.X.hitMon(m, RUP, C.dmgO({ stun: 0.45 })); if (!m.boss && !m.still) H.lift(m, 0.55, 0.9); }
      H.X.flash(0.12, PALE); H.X.hitstop(0.07); H.X.sfx.crash(); H.X.shake(13 + 2 * ev, 0.45); H.X.light(cx, cy, R * 1.1, 0.5);
      for (let i = 0; i < H.n(20 + 3 * ev); i++) { const a = i / (20 + 3 * ev) * TAU + Math.random() * 0.3, r = 0.5 + 0.45 * Math.random(); dust.push({ x: cx + Math.cos(a) * r * R, y: cy + Math.sin(a) * r * R * GY, z: 0.05, vx: Math.cos(a) * (0.6 + Math.random()), vy: Math.sin(a) * 0.4, vz: 0.12 + Math.random() * 0.2, t: -Math.random() * 0.2, life: 1.5 + Math.random() * 0.6, s: 0.9 + Math.random() * 0.6, veil: true }); }
      for (let i = 0; i < H.n(30 + 4 * ev); i++) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()); specks.push({ x: cx + Math.cos(a) * r * R, y: cy + Math.sin(a) * r * R * GY, z: 0.2 + Math.random() * 1.4, vz: 0.3 + Math.random() * 0.6, t: -Math.random() * 0.4, life: 1 + Math.random() * 0.9, s: 0.05 + Math.random() * 0.06 }); }
      if (plates) for (const p of plates) { const d = Math.hypot(p.cx, p.cy) || 1, sp = 0.4 + 1.2 * Math.random(); p.vx = p.cx / d * sp; p.vy = p.cy / d * sp * 0.7; p.vz = 2.6 + Math.random() * 1.8 + (1 - d) * 1.2; p.vr = (Math.random() - 0.5) * 5; p.z = p.lz; p.fly = true; p.ft = 0; }
    }
    // a plate: cut from the frozen layer, its dark sides below the front edges, light under them
    function buildPlate(cell) {
      const W = off.width, Hh = off.height, rx = W / 2, ry = Hh / 2, P = cell.poly.map(v => [rx + v[0] * rx, ry + v[1] * ry]), th = Math.max(2, ry * 0.07);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
      x0 = Math.floor(x0 - 2); y0 = Math.floor(y0 - 2); const cw = Math.ceil(x1 - x0 + 4), ch = Math.ceil(y1 - y0 + th + 4), cv = mk(cw, ch), g = cv.getContext('2d'), Q = P.map(p => [p[0] - x0, p[1] - y0]);
      let mx = 0, my = 0; for (const q of Q) { mx += q[0] / Q.length; my += q[1] / Q.length; } g.lineJoin = 'round';
      for (let i = 0; i < Q.length; i++) { const a = Q[i], b = Q[(i + 1) % Q.length]; let nx = b[1] - a[1], ny = -(b[0] - a[0]); if (nx * ((a[0] + b[0]) / 2 - mx) + ny * ((a[1] + b[1]) / 2 - my) < 0) { nx = -nx; ny = -ny; } if (ny <= 0) continue;
        const ru = Math.hypot(((a[0] + b[0]) / 2 + x0 - rx) / rx, ((a[1] + b[1]) / 2 + y0 - ry) / ry), al = 1 - sstep(0.82, 0.97, ru); if (al < 0.02) continue;
        g.globalAlpha = al; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(b[0], b[1] + th); g.lineTo(a[0], a[1] + th); g.closePath(); g.fillStyle = nx < 0 ? '#2A2017' : '#17100B'; g.fill();
        g.strokeStyle = 'rgba(242,183,58,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(a[0], a[1] + th); g.lineTo(b[0], b[1] + th); g.stroke(); }
      g.globalAlpha = 1; g.save(); g.beginPath(); Q.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.clip(); g.drawImage(off, -x0, -y0);
      g.fillStyle = 'rgba(90,64,38,0.16)'; g.fillRect(0, 0, cw, ch); g.restore();
      // the bevel: lit upper-left edges, an ink line, all faded with the field's edge
      const ru0 = Math.hypot((mx + x0 - rx) / rx, (my + y0 - ry) / ry), ea = 1 - sstep(0.8, 0.97, ru0);
      g.globalAlpha = ea; for (let i = 0; i < Q.length; i++) { const a = Q[i], b = Q[(i + 1) % Q.length]; let nx = b[1] - a[1], ny = -(b[0] - a[0]); if (nx * ((a[0] + b[0]) / 2 - mx) + ny * ((a[1] + b[1]) / 2 - my) < 0) { nx = -nx; ny = -ny; }
        g.strokeStyle = nx + ny < 0 ? 'rgba(255,226,170,0.5)' : 'rgba(10,6,4,0.7)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
      return { cv, x0, y0, cw, ch, cx: cell.cx, cy: cell.cy, lz: 0, s: cell.s, mx: mx + x0, my: my + y0 };
    }
    const F = H.add({ life: LIFE, x: cx, y: cy, EQ: 1,
      update(dt, f) {
        const t = f.t;
        if (me.dead && !dead && t < TR) { dead = true; f.life = Math.min(f.life, 0.6); for (const m of slowed) if (!m.dead) m.sandT = 0; }
        if (!dead) {
          // the slow while the field lives; the ticks on the game clock
          if (t >= FORM && t < TE) for (const m of H.living()) if (inField(m)) { m.sandT = Math.max(m.sandT || 0, 0.2); slowed.add(m); }
          while (next < NT && t >= FORM + 0.5 + next * 0.5) { for (const m of H.living()) if (inField(m)) H.X.hitMon(m, TICK, C.dmgO({})); if (next % 4 === 0) H.X.sfx.thud(); next++; }
          if (!halted && t >= TE) { halted = true; for (const m of slowed) if (!m.dead) m.sandT = 0; slowed.clear(); H.X.sfx.crack(); H.X.shake(4, 0.15); }
          if (!ruptured && t >= TR) { ruptured = true; rupture(); }
        }
        // the monsters' feet: rings and lips fade in and out with them
        if (t < TL + 0.3) { for (const m of H.living()) if (inField(m) && t > FORM && t < TE && !dead) { let q = feet.get(m); if (!q) { q = { a: 0, ph: Math.random() }; feet.set(m, q); } q.in = true; }
          for (const [m, q] of feet) { q.a = cl(q.a + (q.in && !m.dead && t < TE ? dt / 0.35 : -dt / 0.3)); q.in = false; if (q.a <= 0 && (m.dead || t > TE)) feet.delete(m); } }
        // the perimeter crumbling inward
        if (t > FORM && t < TE && !dead && Math.random() < dt * (CEL ? 26 : ADE ? 18 : 12) * H.Q()) { const a = Math.random() * TAU; crumbs.push({ a, r: 0.97, sp: 0.05 + Math.random() * 0.07, t: 0, life: 1.6 + Math.random() * 0.8, k: Math.floor(Math.random() * 3), s: 0.12 + Math.random() * 0.12 }); }
        for (let i = crumbs.length - 1; i >= 0; i--) { const q = crumbs[i]; q.t += dt; if (t < TE) q.r -= q.sp * dt; if (q.t >= q.life || t > TL) crumbs.splice(i, 1); }
        for (const p of tips) if (t > p.t0 + 2.6) { p.t0 += 2.6 + (CEL ? 1.1 : 1.6) + R1(p.i + p.t0) * 0.6; placeTip(p); }
        // the plates: lift, fly, land and break
        if (plates) for (const p of plates) { if (!p.fly) { p.lz = 0.16 * sm((t - TL) / 0.4) + 0.05 * p.s * sm((t - TL) / 0.4); continue; } p.ft += dt; if (p.down) { p.dt += dt; continue; }
          p.cx += p.vx / R * dt; p.cy += p.vy / (R * GY) * dt * GY; p.z += p.vz * dt; p.vz -= 15 * dt; p.rot = (p.rot || 0) + p.vr * dt;
          if (p.z <= 0 && p.vz < 0) { p.z = 0; p.down = true; p.dt = 0; if (Math.random() < 0.6 * H.Q()) dust.push({ x: cx + p.cx * R, y: cy + p.cy * R * GY, z: 0.05, vx: 0, vy: 0, vz: 0.2, t: 0, life: 0.9, s: 0.5 + Math.random() * 0.3 }); } }
        for (let i = dust.length - 1; i >= 0; i--) { const p = dust[i]; p.t += dt; if (p.t < 0) continue; const k = Math.exp(-1.5 * dt); p.vx *= k; p.vy *= k; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.t >= p.life) dust.splice(i, 1); }
        for (let i = specks.length - 1; i >= 0; i--) { const p = specks[i]; p.t += dt; if (p.t < 0) continue; p.z += p.vz * dt; p.vz *= Math.exp(-dt); if (p.t >= p.life) specks.splice(i, 1); }
      },
      drawUnder(c, f, X0, Y0, T) {
        const t = f.t, SC = scr(c), X = H.sx(cx), Y = H.sy(cy), rx = R * T, ry = rx * GY, endA = dead ? cl(f.life / 0.5) : 1, tA = Math.min(t, TE);
        // the formation's cracks (light only), growing out from the centre
        if (t < FORM + 0.4) { const g = sm(t / 0.6), a = sm(t / 0.1) * (1 - sm((t - FORM + 0.15) / 0.45)) * endA; if (a > 0.01) { c.save(); c.beginPath(); c.ellipse(X, Y, rx * (0.08 + 0.98 * g), ry * (0.08 + 0.98 * g), 0, 0, TAU); c.clip(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.drawImage(crackSpr(seed % 5), X - rx, Y - ry, rx * 2, ry * 2); c.restore(); } }
        // the field: composed offscreen while it is sand (and frozen once it hardens)
        const grow = sm((t - 0.4) / 0.55), showField = t > 0.4 && (!plates || t < TL) && !ruptured;
        if (showField) {
          // a static grain base at full resolution (built once, already feathered) and the moving sand (dunes, terraces,
          // drifting grains) at half resolution, recomposed about 30 times a second; frozen at the halt
          const q = Math.min(1, 900 / (rx * 2 * SC.k)), kk = SC.k * q, W = Math.ceil(rx * 2 * kk), Hh = Math.ceil(ry * 2 * kk), W2 = Math.ceil(W / 2), H2 = Math.ceil(Hh / 2), Tk = T * kk;
          const Mx = (ox, oy, x, y, sx, sy, rot) => new DOMMatrix().translateSelf(ox, oy).scaleSelf(1, GY).rotateSelf(rot || 0).scaleSelf(sx, sy).translateSelf(x, y);
          if (!baseC || baseC.width !== W || baseC.height !== Hh) { baseC = mk(W, Hh); const g = baseC.getContext('2d'), gs = Math.max(0.7, Math.min(1.7, Tk / 58)), pg = g.createPattern(grainTile(), 'repeat'), pb = g.createPattern(blotTile(), 'repeat');
            if (pg.setTransform) pg.setTransform(Mx(W / 2, Hh / 2, 0, 0, gs, gs / GY * 0.62)); g.fillStyle = pg; g.fillRect(0, 0, W, Hh); if (pb.setTransform) pb.setTransform(Mx(W / 2, Hh / 2, 0, 0, Tk / 40, Tk / 40)); g.globalAlpha = 0.85; g.fillStyle = pb; g.fillRect(0, 0, W, Hh);
            g.globalAlpha = 1; g.globalCompositeOperation = 'destination-in'; g.drawImage(maskSpr(), 0, 0, W, Hh); movT = -1; }
          if (!movC || movC.width !== W2 || movC.height !== H2) { movC = mk(W2, H2); movG = movC.getContext('2d'); ptn = { t: movG.createPattern(grainTop(), 'repeat'), r: movG.createPattern(ridgeTile(), 'repeat') }; movT = -1; }
          if (!halted || !off) {
            if (movT < 0 || tA - movT >= 1 / 32 || tA >= TE) { movT = tA;
              const g = movG, ocx = W2 / 2, ocy = H2 / 2, T2 = Tk / 2, gs = Math.max(0.5, Math.min(1.7, T2 / 58)), rs = 0.62 * T2 / 32, M = (x, y, sx, sy, rot) => Mx(ocx, ocy, x, y, sx, sy, rot);
              g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W2, H2);
              const fill = (p, m, al) => { if (p.setTransform) p.setTransform(m); g.globalAlpha = al; g.fillStyle = p; g.fillRect(0, 0, W2, H2); };
              // the dunes (Celestial: concentric terraces instead of the main set), the crossing set at Adept, grains drifting with them
              const rv = tA * 0.22 * 32 / 0.62;
              if (!CEL) fill(ptn.r, M(0, rv, rs, rs / GY * 0.8, 8), 0.95);
              if (ADE) fill(ptn.r, M(0, rv * 0.7, rs * 1.15, rs * 1.15 / GY * 0.8, CEL ? 20 : 68), CEL ? 0.35 : 0.45);
              if (CEL) { const ts = terrSpr(); g.setTransform(1, 0, 0, 1, 0, 0); for (let k = 0; k < 6; k++) { const r = 1.02 - ((k / 6 + tA * 0.045) % 1), a2 = sstep(0.12, 0.3, r) * (1 - sstep(0.92, 1.02, r)); if (a2 < 0.01) continue; g.globalAlpha = a2; g.drawImage(ts, ocx - r * ocx, ocy - r * ocy, r * W2, r * H2); } }
              const drift = tA * 0.05 * T2 / gs; fill(ptn.t, M(drift * 1.6, rv * gs * 0.12 + drift * 3, gs, gs / GY * 0.62, 8), 0.8);
              g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'destination-in'; g.drawImage(maskSpr(), 0, 0, W2, H2); g.globalCompositeOperation = 'source-over'; }
            // the halt: the frozen sand, at full resolution, for the plates
            if (halted) { off = mk(W, Hh); const g = off.getContext('2d'); g.drawImage(baseC, 0, 0); g.drawImage(movC, 0, 0, W, Hh); }
          }
          { const mg = 0.15 + 0.85 * grow, a0 = endA * (t < 0.95 ? sm((t - 0.4) / 0.3) : 1), gw = rx * mg, gh = ry * mg; c.save(); c.globalAlpha = a0;
            if (off) c.drawImage(off, X - rx, Y - ry, rx * 2, ry * 2); else { c.drawImage(baseC, X - gw, Y - gh, gw * 2, gh * 2); c.drawImage(movC, X - gw, Y - gh, gw * 2, gh * 2); } c.restore(); }
          // the hardening: amber lines joining across the field
          if (halted && !dead) { const a = sm((t - TE) / 0.3), fl = 1 - sm((t - TE - 0.12) / 0.3); edges(c, X, Y, rx, ry, [[AMBER, Math.max(2, T * 0.14), 0.3], [GOLD, Math.max(1, T * 0.035), 0.75], [CORE, Math.max(0.7, T * 0.016), 0.8 * fl]], a); }
        }
        // the plates: cut from the frozen layer a few per frame, then lifted with light under their gaps
        if (halted && !dead && off && !plates && t >= TE + 0.02) { plates = []; snapK = off.width / (rx * 2); snapT = T; }
        if (plates && built < cells.length && !dead) { const t0 = performance.now(); while (built < cells.length && (performance.now() - t0 < 3 || t >= TL)) plates.push(buildPlate(cells[built++])); }
        if (plates && t >= TL && !ruptured && !dead) { const lift = sm((t - TL) / 0.4), sk = T / snapT;
          H.glow(c, X, Y, rx * 1.0, AMBER, 0.3 * lift); edges(c, X, Y, rx, ry, [[AMBER, Math.max(2, T * 0.22), 0.4 + 0.3 * lift], [HONEY, Math.max(1, T * 0.05), 0.85]], 1);
          const ox = X - rx, oy = Y - ry, kq = 1 / snapK * sk;
          for (const p of plates) { const jit = Math.sin(t * 60 + p.s * 40) * T * 0.012 * lift; c.drawImage(p.cv, ox + p.x0 * kq + jit, oy + p.y0 * kq - p.lz * T, p.cw * kq, p.ch * kq); } }
        // Adept: amber crystal tips surfacing and sinking
        if (tips.length && t > FORM && t < TE + 0.2 && !dead) { const sp = tipSpr(); for (const p of tips) { const e = t - p.t0; if (e < 0 || e > 2.6) continue; const up = sm(e / 0.45) * (1 - sm((e - 2.1) / 0.5)) * (t > TE ? 1 - sm((t - TE) / 0.2) : 1); if (up < 0.02) continue;
          const [px, py] = at(p.u, p.v, T), w = T * 0.32, hh = T * 0.5 * up; c.save(); c.beginPath(); c.rect(px - w, py - T, w * 2, T + T * 0.04); c.clip(); c.drawImage(sp, px - w / 2, py - hh, w, w * 1.5); c.restore();
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = up * 0.45; c.drawImage(glowSprite(AMBER), px - w, py - w * 0.6, w * 2, w * 1.2); c.restore(); } }
        // light on top of the sand: the glints, the veins and their travelling light (Celestial), the feet
        if (t > FORM - 0.2 && (!plates || t < TL) && !ruptured) { const fa = sm((t - FORM + 0.2) / 0.4) * endA;
          c.save(); c.globalCompositeOperation = 'lighter'; const gl = glintSpr();
          for (const p of glints) { const s = Math.sin(tA * p.w + p.ph), a = s > 0.8 ? Math.pow((s - 0.8) / 0.2, 2) : 0; if (a < 0.03) continue; const [gx, gy] = at(p.u, p.v, T), sz = T * 0.28 * (0.6 + 0.4 * a); c.globalAlpha = fa * a; c.drawImage(gl, gx - sz, gy - sz, sz * 2, sz * 2); }
          if (VEINS) { c.globalAlpha = fa * (0.28 + 0.08 * Math.sin(tA * 2)); c.drawImage(veinSpr(seed, VEINS), X - rx, Y - ry, rx * 2, ry * 2); const gs = glowSprite(HONEY);
            for (let i = 0; i < VEINS.length; i++) { const v = VEINS[i], q = (tA * 0.35 + i * 0.37) % 1, fi = q * (v.length - 1), k = Math.floor(fi), e = fi - k, p0 = v[k], p1 = v[Math.min(v.length - 1, k + 1)], [vx, vy] = at(lerp(p0[0], p1[0], e), lerp(p0[1], p1[1], e), T), sz = T * 0.4; c.globalAlpha = fa * 0.75 * Math.sin(q * Math.PI); c.drawImage(gs, vx - sz, vy - sz * 0.7, sz * 2, sz * 1.4); } }
          c.restore();
          // the feet: a shallow pit, rings of grains sliding inward
          const rs = ringSpr(), ps = pitSpr(); for (const [m, q] of feet) { if (m.dead) continue; const mx = H.sx(m.x), my = H.sy(m.y), r0 = Math.max(T * 0.35, m.r * T * 1.25);
            c.save(); c.globalAlpha = q.a * 0.75; c.drawImage(ps, mx - r0 * 1.2, my - r0 * 0.55, r0 * 2.4, r0 * 1.1);
            for (let k = 0; k < 2; k++) { const u = (tA * 0.75 + q.ph + k * 0.5) % 1, rr = r0 * (2.3 - 1.5 * u), a = Math.sin(u * Math.PI) * q.a * 0.85; c.globalAlpha = a; c.drawImage(rs, mx - rr, my - rr * GY, rr * 2, rr * 2 * GY); } c.restore(); }
          // the perimeter crumbs
          c.save(); for (const p of crumbs) { const [qx, qy] = at(Math.cos(p.a) * p.r, Math.sin(p.a) * p.r, T), a = Math.sin(cl(p.t / p.life) * Math.PI) * 0.9 * endA, sz = T * p.s; c.globalAlpha = a; c.drawImage(clumpSpr(p.k), qx - sz, qy - sz * 0.7, sz * 2, sz * 1.4); } c.restore(); }
        // after the rupture: the light on the floor fading, a ring of light rushing out
        if (ruptured) { const p = t - TR; H.glow(c, X, Y, rx * 1.1, AMBER, 0.4 * Math.max(0, 1 - p / 1.4)); H.glow(c, X, Y, rx * 0.6, HONEY, 0.3 * Math.max(0, 1 - p / 0.5));
          const q = cl(p / 0.6); if (q < 1) { const rr = rx * (0.4 + 0.8 * H.ease.out(q)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - q) * sstep(0, 0.1, q) * 0.8; c.drawImage(bandSpr(), X - rr, Y - rr * GY, rr * 2, rr * 2 * GY); c.restore(); } }
      },
      draw(c, f, X0, Y0, T) {
        const t = f.t, X = H.sx(cx), Y = H.sy(cy), rx = R * T, ry = rx * GY, PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45;
        // the lip of piled sand over each monster's feet (never over the pet)
        if (feet.size && t < TL + 0.3) { const ls = lipSpr(); c.save(); for (const [m, q] of feet) { if (m.dead || q.a < 0.02 || m.mv === 1) continue; const mx = H.sx(m.x), my = H.sy(m.y) - (m.z || 0) * T, w = Math.max(T * 0.42, m.r * T * 1.35); c.globalAlpha = q.a * (t > TE ? 1 - sm((t - TE) / 0.5) : 1); c.drawImage(ls, mx - w, my - w * 0.12, w * 2, w * 0.75); } c.restore(); }
        // the plates thrown up in short weighted arcs, breaking where they land
        if (plates && ruptured && !dead) { const ox = X - rx, oy = Y - ry, kq = 1 / snapK * (T / snapT);
          for (const p of plates) { if (!p.fly) continue; const a = p.down ? 1 - cl(p.dt / 0.3) : 1; if (a <= 0.01) continue; const w = p.cw * kq, hh = p.ch * kq, hx = ox + (p.mx * kq) + p.cx * rx - (p.mx * kq - rx) - rx + 0, px2 = X + p.cx * rx, py2 = Y + p.cy * ry - p.z * T;
            const dim = Math.hypot(px2 - PX, py2 - PY) < T * 1.0 ? 0.45 : 1; void hx;
            c.save(); c.translate(px2, py2); c.rotate(p.rot || 0); c.scale(1, p.down ? 1 - 0.3 * cl(p.dt / 0.3) : 1 - 0.25 * Math.abs(Math.sin(p.ft * 4 + p.s * 6))); c.globalAlpha = a * dim; c.drawImage(p.cv, (p.x0 - p.mx) * kq, (p.y0 - p.my) * kq, w, hh); c.restore(); } }
        // dust: the low veil after the rupture, puffs where plates land; the gold specks
        if (dust.length) { const ds = dustSpr(); c.save(); for (const p of dust) { if (p.t < 0) continue; const q = p.t / p.life, dx = H.sx(p.x), dy = H.sy(p.y) - p.z * T, r = T * p.s * (0.6 + 0.9 * q), a = Math.sin(Math.min(1, q * 2.5) * Math.PI / 2) * (1 - q) * (p.veil ? 0.75 : 0.6); c.globalAlpha = a * (Math.hypot(dx - PX, dy - PY) < T ? 0.5 : 1); c.drawImage(ds, dx - r, dy - r * 0.55, r * 2, r * 1.1); } c.restore(); }
        if (specks.length) { c.save(); c.globalCompositeOperation = 'lighter'; const gs = glowSprite(HONEY); for (const p of specks) { if (p.t < 0) continue; const q = p.t / p.life, sx2 = H.sx(p.x), sy2 = H.sy(p.y) - p.z * T, s = T * p.s * (1 + 2 * (1 - q)); c.globalAlpha = Math.sin(q * Math.PI) * 0.9; c.drawImage(gs, sx2 - s, sy2 - s, s * 2, s * 2); } c.restore(); }
        void ry;
      } });
    void F;
  };
})();
