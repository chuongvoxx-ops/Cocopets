/* ---------- v423 GE: the Garden of Unborn Stars repainted in 2.5D (Rift 02's land, props, puzzles and arenas) ----------
   Every solid piece of the garden is painted once into its own cached picture by the Drowned Belfry's software shading
   pass (BELPROPS.kit, 20n9: each pixel of a solid gets a normal and a material and is lit), in the garden's own light (the
   "grove": a cream moon key from the upper left, a plum night in the shadows, a lilac sky in the reflections, a rose rim
   from the second moon and a jade bounce off the moss), then finished with layered 2D detail and a soft ink edge. Nothing
   is painted per frame: the frame lays the pictures down; what glows or moves (the eggs, bulbs, lilies and glowcaps, the
   motes, the moonlight through the canopy, the mist) is the GPU painter's light over them (FGFX, 20k6h), lowFx respected.
   Pictures (name, v): the nine trees and plants of 20p2 (eggtree, weepwillow, thornpine, bulbtree, giantfern, glowcaps,
   starlily, thornbush, mossrock: v 0..1 painted, 2..3 the same mirrored), the floor's undergrowth (dtuft, dflower, dfern,
   droot, dmoss), the moons (moon v 0..2: cream, rose, jade), the puzzles' pieces (20p: the March's mpost, mblock,
   mboulder, mhedge, mbloom; the Falling Nursery's sbud, sbloom v 0..3, sstar, sshard; the Seedshot Gallery's pod v 0..3
   and ghedge), and the thorn spike of the vine bridges (thorn).
   Textures (made once per sharpness, wrapping): the floor (plum loam, moss, roots, pebbles, leaf litter, star flowers: 6
   tiles square), the earthen bank under the wall tops and the wall tops' moss (4 tiles), the cliff over the void with its
   hanging roots (4 tiles), the vine bridge (2 tiles, its underside) and the March's moss lane.
   The land (BIOMES.garden): floorFn, wallFn, roofFn (20e's v423 hook), cliffTint, bridgeFn/bridgeEdge, gap 'gardenvoid' (the
   starry void under the garden, the three unmoving moons, far floating isles) and the undergrowth decals (DECAL_EXT).
   The engine's props (DunWorld.PROPS) are repainted through its prop cache, so BREAK_FX shatters the new pictures in their
   own materials; the old 2D art stays in GARDEN_PROPS.OLD (and is drawn wherever these pictures cannot be).
   The rift (RIFT_BY_ID.garden): everyStage (chained) lays the GPU light over every stage; preload (chained) warms the
   pictures and textures the stage being loaded draws; the boss arenas are dressed through the fiends' shared hooks
   (GardenFiend.floor / .sky, wrapped at run time: the ground, the rim and the sky) and a ring of trees beyond the rim.
   API (global GARDEN_PROPS): draw(c, name, v, Xs, Ys, T, o) the picture with its feet at Xs, Ys (o: { alpha, sx, sy, rot,
   flip }) -> false when it is not painted (the caller then draws its old art); sprite(name, v, P); tex(name, P); has(name);
   warm(P) -> jobs; release() frees every picture and texture (on the stage's close: DunWorld.dropProps is chained);
   glowsOf(kind, v) -> the live lights of a prop; arena { floor, sky }; stats. window.__GPP = 0 turns all of it off. */
var GARDEN_PROPS = (() => {
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined';
  const off = () => HAS_W && (window.__GPP === 0 || window.__BELP === 0);
  const BP = () => (!off() && HAS_W && window.BELPROPS && window.BELPROPS.kit) ? window.BELPROPS : null;
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + (s | 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const R1 = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const rgba = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${clamp(a, 0, 1)})`; };
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0, tex: 0, texMs: 0 };
  const GOLD = '#FFD36B', CREAM = '#F2D8A1', ROSE = '#E07BA8', JADE = '#4A8D7B', LILAC = '#B9A6FF', MINT = '#7FE3B4';

  /* ======================= the light ======================= */
  const LIGHT = { grove: { a0: [0.13, 0.08, 0.17], a1: [0.07, 0.1, 0.11], e0: [0.08, 0.05, 0.11], e1: [0.42, 0.36, 0.56], k: [1.16, 1.08, 1.02], rim: [0.5, 0.22, 0.42], bo: [0.05, 0.14, 0.1] } };
  function lit(K, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHT.grove); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }

  /* ======================= noise that wraps (for the textures) ======================= */
  const PH = (x, y, s) => hh(x, y, s);
  function pvn(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), q = p | 0 || 1;
    const X0 = ((xi % q) + q) % q, X1 = (X0 + 1) % q, Y0 = ((yi % q) + q) % q, Y1 = (Y0 + 1) % q, a = PH(X0, Y0, s), b = PH(X1, Y0, s), c = PH(X0, Y1, s), d = PH(X1, Y1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const pfbm = (x, y, p, s) => pvn(x, y, p, s) * 0.52 + pvn(x * 2, y * 2, p * 2, s + 7) * 0.3 + pvn(x * 4, y * 4, p * 4, s + 13) * 0.18;
  // the nearest feature point of a wrapping cell grid (p cells across): { d (in cells), id }
  const CELL = { d: 0, d2: 0, id: 0, ox: 0, oy: 0 };
  function pcell(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y); let d1 = 9, d2 = 9, id = 0, ox = 0, oy = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i, cy = yi + j, wx = ((cx % p) + p) % p, wy = ((cy % p) + p) % p, px = cx + PH(wx, wy, s), py = cy + PH(wx, wy, s + 1), d = Math.hypot(x - px, y - py);
      if (d < d1) { d2 = d1; d1 = d; id = wy * p + wx; ox = x - px; oy = y - py; } else if (d < d2) d2 = d; }
    CELL.d = d1; CELL.d2 = d2; CELL.id = id; CELL.ox = ox; CELL.oy = oy; return CELL; }
  // the nearest of the sparse features (a cell holds one with chance prob): CELL.d 9 where none is near
  function pfeat(x, y, p, s, prob) { const xi = Math.floor(x), yi = Math.floor(y); let d1 = 9, id = -1, ox = 0, oy = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i, cy = yi + j, wx = ((cx % p) + p) % p, wy = ((cy % p) + p) % p; if (PH(wx, wy, s + 2) >= prob) continue; const px = cx + PH(wx, wy, s), py = cy + PH(wx, wy, s + 1), d = Math.hypot(x - px, y - py);
      if (d < d1) { d1 = d; id = wy * p + wx; ox = x - px; oy = y - py; } }
    CELL.d = d1; CELL.id = id; CELL.ox = ox; CELL.oy = oy; return CELL; }

  /* ======================= materials (each sets K.M) ======================= */
  function bark(K, u, v, ao, sd, moss) { const { M, vn, fbm } = K; const g = vn(u * 5 + sd, v * 1.4 + sd * 0.3), g2 = vn(u * 13 + sd, v * 4.5), groove = ss(0.52, 0.78, g * 0.7 + g2 * 0.4), ridge = ss(0.25, 0.05, g * 0.7 + g2 * 0.4), t = 0.78 + 0.28 * fbm(u * 3 + sd, v * 2);
    M.r = 0.36 * t; M.g = 0.21 * t; M.b = 0.31 * t; M.rg = 0.8; M.ao *= 1 - groove * 0.7; if (ridge > 0) { M.r += 0.08 * ridge; M.g += 0.06 * ridge; M.b += 0.07 * ridge; }
    const li = vn(u * 9 + sd * 2, v * 7 + 3); if (li > 0.78) { const k = ss(0.78, 0.9, li) * 0.6; M.r = lerp(M.r, 0.56, k); M.g = lerp(M.g, 0.6, k); M.b = lerp(M.b, 0.52, k); }
    if (moss) { const mk = ss(0.5, 0.78, fbm(u * 3 + 5, v * 2 + sd) * 0.7 + moss * 0.55 - v * 0.75); if (mk > 0) { M.r = lerp(M.r, 0.17, mk); M.g = lerp(M.g, 0.38, mk); M.b = lerp(M.b, 0.27, mk); M.rg = 0.95; } } }
  // leaves: cells of leaf, each its own tone; the gaps between them dark; a little waxy sheen
  function leafM(K, x, y, sd, pal, blush) { const { M, vn } = K; const c = vn(x * 11 + sd, y * 11 - sd), c2 = vn(x * 23 + 3, y * 23 + sd), t = 0.7 + 0.5 * c + 0.12 * c2;
    M.r = pal[0] * t; M.g = pal[1] * t; M.b = pal[2] * t; M.rg = 0.5; M.cc = 0.22; if (c < 0.26) M.ao *= 0.62;
    if (blush) { const b = ss(0.62, 0.86, vn(x * 3 + sd + 9, y * 3)); if (b > 0) { M.r = lerp(M.r, 0.62, b * blush); M.g = lerp(M.g, 0.3, b * blush); M.b = lerp(M.b, 0.46, b * blush); } } }
  function eggM(K, dx, dy, glow, sd) { const M = K.M, e = Math.min(1, dx * dx + dy * dy), rim = 1 - Math.sqrt(e); M.r = 0.97; M.g = 0.88; M.b = 0.68; M.rg = 0.28; M.cc = 0.65;
    const k = glow * (0.35 + 0.65 * rim); M.er = 0.55 * k; M.eg = 0.4 * k; M.eb = 0.12 * k;
    const q = Math.sqrt(Math.max(0.05, 1 - dy * dy)), mer = dx / q; for (const m of [-0.5, 0.5]) { const s = Math.abs(mer - m); if (s < 0.07 && dy > -0.75) { const w = 1 - s / 0.07; M.r = lerp(M.r, 0.3, w * 0.75); M.g = lerp(M.g, 0.14, w * 0.75); M.b = lerp(M.b, 0.3, w * 0.75); M.er *= 1 - w * 0.6; M.eg *= 1 - w * 0.6; } }
    if (K.vn(dx * 7 + sd, dy * 7) > 0.8) { M.r *= 0.94; M.g *= 0.9; } }
  function stoneM(K, u, v, sd, tone) { const { M, vn, fbm } = K; const w = fbm(u * 3 + sd, v * 3), t = (0.78 + 0.3 * w) * (tone || 1); M.r = 0.44 * t; M.g = 0.39 * t; M.b = 0.5 * t; M.rg = 0.72;
    const cr = Math.abs(vn(u * 4 + sd * 2, v * 4 + 1) - 0.5); if (cr < 0.02) M.ao *= 0.55; if (vn(u * 31, v * 31 + sd) > 0.84) M.ao *= 0.8; }
  function mossM(K, u, v, sd) { const { M, vn } = K; const w = vn(u * 9 + sd, v * 9), f = vn(u * 37, v * 37 + sd), t = 0.72 + 0.4 * w + 0.15 * f; M.r = 0.17 * t; M.g = 0.4 * t; M.b = 0.28 * t; M.rg = 0.95; M.sh = 0.92;
    if (f > 0.86) { M.r += 0.12; M.g += 0.16; M.b += 0.06; } if (vn(u * 17 + 5, v * 17 + sd) > 0.93) { M.er += 0.35; M.eg += 0.27; M.eb += 0.06; } }
  function thornM(K, t, s) { const M = K.M; M.r = lerp(0.42, 0.92, t); M.g = lerp(0.6, 0.94, t); M.b = lerp(0.3, 0.7, t); M.rg = 0.38; M.cc = 0.45; if (t > 0.86) { M.r = 0.94; M.g = 0.55; M.b = 0.72; } }
  function vineM(K, t, s, sd, tone) { const M = K.M, w = pvn(t * 4.5, s * 2 + sd, 9, sd | 0), rib = Math.abs(Math.sin(t * Math.PI * 13 + s * 1.5 + sd)); /* (t: tiles along, wrapping every 2: the bridge's period) */ const k = (0.75 + 0.4 * w) * (tone || 1); M.r = 0.2 * k; M.g = 0.48 * k; M.b = 0.28 * k; M.rg = 0.55; M.cc = 0.3; if (rib < 0.18) M.ao *= 0.8; }
  function glassM(K, dx, dy, col, glow) { const M = K.M, e = Math.min(1, dx * dx + dy * dy), c = 1 - Math.sqrt(e); M.r = col[0] * 0.5; M.g = col[1] * 0.5; M.b = col[2] * 0.5; M.rg = 0.1; M.cc = 1; M.sh = 0.6;
    const k = glow * (0.25 + 0.75 * c * c); M.er = col[0] * k; M.eg = col[1] * k; M.eb = col[2] * k; }
  function petalM(K, t, s, col, glow) { const M = K.M; M.r = col[0]; M.g = col[1]; M.b = col[2]; M.rg = 0.4; M.cc = 0.35; const k = glow * (1 - t) * (1 - t * 0.5); M.er = 0.6 * k + col[0] * 0.15 * glow; M.eg = 0.48 * k + col[1] * 0.15 * glow; M.eb = 0.16 * k + col[2] * 0.15 * glow; if (Math.abs(s) < 0.1) M.ao *= 0.86; }

  /* ======================= primitives beyond the kit's ======================= */
  /* lump: a leafy (or rocky) mass seen from the front: an ellipsoid with a wavering edge and a bumpy face. o: { amp, fr (edge
     waves), sd, bump, leaf (bump cells a tile), mat(dx, dy, ao, e, nz), ao } */
  function lump(K, S, cx, cy, rx, ry, o) { const { M, vn } = K, P = S.P, X0 = S.ax + cx * P, Y0 = S.ay + cy * P, RX = rx * P, RY = ry * P; if (RX < 0.5) return;
    const amp = o.amp == null ? 0.12 : o.amp, fr = o.fr || 2.2, sd = o.sd || 0, bump = o.bump == null ? 0.5 : o.bump, lf = o.leaf || 9, mR = Math.min(RX, RY), A0 = o.ao == null ? 1 : o.ao;
    S.lock();
    const xa = Math.max(0, Math.floor(X0 - RX * (1 + amp) - 2)), xb = Math.min(S.w - 1, Math.ceil(X0 + RX * (1 + amp) + 2)), ya = Math.max(0, Math.floor(Y0 - RY * (1 + amp) - 2)), yb = Math.min(S.h - 1, Math.ceil(Y0 + RY * (1 + amp) + 2));
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { const dx = (px + 0.5 - X0) / RX, dy = (py + 0.5 - Y0) / RY, rr = Math.hypot(dx, dy), ca = dx / (rr || 1), sa = dy / (rr || 1);
      const edge = 1 + amp * (vn(ca * fr + sd + 3, sa * fr + sd * 1.3 + 3) * 2 - 1) + amp * 0.5 * (vn(ca * fr * 3 + sd, sa * fr * 3 - sd) * 2 - 1); if (rr > edge + 1.5 / mR) continue;
      const e = Math.min(1, rr / edge), ny0 = Math.sqrt(Math.max(0, 1 - e * e)), wx = (px - S.ax) / P, wy = (py - S.ay) / P;
      let b1, b2, cr = 1; if (o.cells) { const cl = pcell(wx * lf + sd * 7, wy * lf * 1.25, 4096, (sd * 13) | 0); LEAF.id = cl.id; b1 = 0.5 + PH(cl.id, 3, 5) * 0.8 - 0.4 + cl.ox * 0.9; b2 = 0.5 + PH(cl.id, 4, 5) * 0.8 - 0.4 - cl.oy * 0.9; const gap = cl.d2 - cl.d; cr = ss(0.02, 0.16, gap); }
      else { b1 = vn(wx * lf + sd, wy * lf); b2 = vn(wx * lf + 4.1 + sd, wy * lf + 2.3); }
      let nx = dx / edge + (b1 - 0.5) * bump, ny = ny0 + 0.08, nz = -dy / edge + (b2 - 0.5) * bump; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      K.M0(); M.ao = (0.5 + 0.5 * ny0) * A0 * (0.45 + 0.55 * cr); o.mat(dx, dy, M.ao, e, nz, wx, wy); K.shade(nx, ny, nz); K.put(S, px, py, clamp((edge - rr) * mR + 0.6, 0, 1)); }
  }
  const LEAF = { id: 0 };   // (the leaf cell being shaded, for a crown's per-leaf tone)
  /* ribbon: a flat leaf, frond or petal along a path of points [x, y] (tiles), its half width w(t); cupped across (its
     edges turned up), a crease down its midrib. mat(t, s, ao) (t along 0..1, s across -1..1). o: { cup, face: [nx, ny, nz] } */
  function ribbon(K, S, pts, wf, mat, o) { o = o || {}; const { M } = K, P = S.P, Q = pts.map(p => [S.ax + p[0] * P, S.ay + p[1] * P]), L = [0]; for (let i = 1; i < Q.length; i++) L.push(L[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1])); const LT = L[L.length - 1] || 1;
    let wm = 0; for (let i = 0; i <= 20; i++) wm = Math.max(wm, wf(i / 20)); const rm = wm * P + 2, cup = o.cup == null ? 0.55 : o.cup, F = o.face || [0, 0.72, 0.69];
    let xa = 1e9, xb = -1e9, ya = 1e9, yb = -1e9; for (const q of Q) { xa = Math.min(xa, q[0]); xb = Math.max(xb, q[0]); ya = Math.min(ya, q[1]); yb = Math.max(yb, q[1]); }
    xa = Math.max(0, Math.floor(xa - rm)); xb = Math.min(S.w - 1, Math.ceil(xb + rm)); ya = Math.max(0, Math.floor(ya - rm)); yb = Math.min(S.h - 1, Math.ceil(yb + rm));
    S.lock();
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { const X = px + 0.5, Y = py + 0.5; let bd = 1e9, bt = 0, bx = 0, by = 0, tx = 1, ty = 0;
      for (let i = 1; i < Q.length; i++) { const ax = Q[i - 1][0], ay = Q[i - 1][1], dx = Q[i][0] - ax, dy = Q[i][1] - ay, ll = dx * dx + dy * dy || 1e-6; let t = ((X - ax) * dx + (Y - ay) * dy) / ll; t = t < 0 ? 0 : t > 1 ? 1 : t; const qx = ax + dx * t, qy = ay + dy * t, d = (X - qx) * (X - qx) + (Y - qy) * (Y - qy); if (d < bd) { bd = d; bt = (L[i - 1] + t * (L[i] - L[i - 1])) / LT; bx = X - qx; by = Y - qy; const l2 = Math.sqrt(ll); tx = dx / l2; ty = dy / l2; } }
      const w = wf(bt) * P; if (w < 0.3) continue; const d = Math.sqrt(bd); if (d > w + 1) continue; const sgn = (bx * -ty + by * tx) >= 0 ? 1 : -1, s = clamp(d / w, 0, 1) * sgn;
      let nx = F[0] - ty * s * cup, ny = F[1], nz = F[2] - tx * s * cup; const l = Math.hypot(nx, ny, nz) || 1;
      K.M0(); M.ao = (Math.abs(s) < 0.1 ? 0.78 : 1) * (0.85 + 0.15 * (1 - bt)); mat(bt, s, M.ao); K.shade(nx / l, ny / l, nz / l); K.put(S, px, py, clamp(w - d + 0.6, 0, 1) * (o.alpha == null ? 1 : o.alpha)); }
  }
  /* a soft halo of light baked into a picture (the live light is the GPU's) */
  function halo(c, x, y, r, col, a) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.4)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
  const INK = [34, 14, 40];
  const ptsQ = (x0, y0, cx, cy, x1, y1, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c2 = t * t; o.push([a * x0 + b * cx + c2 * x1, a * y0 + b * cy + c2 * y1]); } return o; };

  /* ======================= where each prop's live lights are (tiles from its feet; v 0..1, mirrored for 2..3) ======================= */
  const EGGS = [[[-0.62, -1.6], [0.55, -1.68], [0.06, -1.86], [0.98, -1.86], [-1.02, -1.78]], [[-0.8, -1.7], [0.36, -1.62], [-0.18, -1.9], [0.86, -1.92]]];
  const BULBS = [[[-1, 0.85, -2.3], [1, 0.95, -2.2], [-0.2, 0.25, -2.75], [0.45, 0.55, -2.6]], [[-1, 0.95, -2.15], [1, 0.8, -2.4], [0.1, 0.1, -2.85]]];
  const CAPS = [[[-0.42, 1.0, 0.34, 0], [0.4, 0.82, 0.29, 1], [0, 1.5, 0.46, 2]], [[-0.36, 1.25, 0.38, 3], [0.44, 0.9, 0.3, 2], [0.02, 1.6, 0.44, 1]]];
  const CAPCOL = [[[0.37, 0.79, 0.75], '#B9FFF4'], [[0.6, 0.48, 0.88], '#E2D4FF'], [[0.88, 0.48, 0.66], '#FFD6EA'], [[0.44, 0.69, 0.91], '#D6EEFF']];
  const LILIES = [[[-0.36, -1.0, 0.95], [0.38, -0.92, 0.85], [0.02, -1.4, 1.05]], [[-0.42, -1.12, 0.9], [0.4, -1.04, 0.95], [-0.02, -1.5, 1.0]]];
  function glowsOf(kind, v) { const vv = (v | 0) % 2, m = (v | 0) % 4 >= 2 ? -1 : 1, out = [];
    if (kind === 'eggtree') for (const [x, y] of EGGS[vv].slice(0, 3 + vv + ((v | 0) % 2))) out.push([x * m, y + 0.06, 0.55, GOLD, 'egg']);
    else if (kind === 'bulbtree') for (const [s, dx, ty] of BULBS[vv]) out.push([s * dx * m, ty - 0.14, 0.75, ROSE, 'bulb']);
    else if (kind === 'glowcaps') for (const [x, h, r, ci] of CAPS[vv]) out.push([x * m, -h + 0.02, r * 1.9, CAPCOL[ci][1], 'cap']);
    else if (kind === 'starlily') for (const [x, y, s] of LILIES[vv]) out.push([x * m, y, 0.62 * s, GOLD, 'lily']);
    else if (kind === 'weepwillow') for (const [x, y] of [[-0.62, -1.05], [0.5, -0.95], [0.05, -1.25], [-0.25, -0.8], [0.8, -1.2]].slice(0, 4 + vv)) out.push([x * m, y, 0.3, GOLD, 'bead']);
    else if (kind === 'thornpine') out.push([0, -(3.2 + vv * 0.25) - 0.2, 0.35, ROSE, 'tip']);
    else if (kind === 'mossrock') out.push([0.1 * m, -0.6, 0.35, MINT, 'spore']);
    else if (kind === 'thornbush') out.push([0, -0.62, 0.4, ROSE, 'berry']);
    return out; }

  /* ======================= the trees and plants ======================= */
  const trunk = (K, S, pts, r0, r1, sd, moss) => { const len = pts.reduce((a, p, i) => i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0); K.tube(S, pts, r0, r1, (t, s, ao) => { bark(K, s * 0.9 + sd, t * len, ao, sd, moss); }); S.unlock(); };
  const root = (K, S, x0, y0, x1, y1, r, sd) => { K.tube(S, ptsQ(x0, y0, (x0 + x1) / 2 + (x1 - x0) * 0.1, Math.min(y0, y1) - 0.1, x1, y1, 8), r, r * 0.35, (t, s, ao) => bark(K, s + sd, t * 2, ao, sd, 0.4)); S.unlock(); };
  const crown = (K, S, blobs, pal, sd, blush) => { for (const [x, y, r, dark] of blobs) lump(K, S, x, y, r, r * 0.92, { amp: 0.13, fr: 2.4, sd: sd + x * 3, bump: 0.9, leaf: 9, cells: true, ao: dark ? 0.62 : 1, mat: (dx, dy, ao, e, nz, wx, wy) => { leafM(K, wx, wy, sd, pal, blush); const lt = 0.82 + 0.36 * PH(LEAF.id, 9, 9); K.M.r *= lt; K.M.g *= lt; K.M.b *= lt; if (nz > 0.5) { const k = (nz - 0.5) * 0.5; K.M.r += 0.1 * k; K.M.g += 0.2 * k; K.M.b += 0.12 * k; } } }); S.unlock(); };
  const contact = (K, S, rx, ry, a) => K.contact(S, 0, 0.02, rx, ry, a || 0.55);
  function egg(K, S, x, y0, y1, glow) { const c = S.c; c.save(); c.strokeStyle = 'rgba(242,216,161,.75)'; c.lineWidth = 0.022; c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + 0.02, (y0 + y1) / 2, x, y1); c.stroke(); c.restore();
    halo(c, x, y1 + 0.12, 0.42, GOLD, 0.35); K.ball(S, x, y1 + 0.12, 0.1, 0.13, (dx, dy) => eggM(K, dx, dy, glow, x * 7)); S.unlock(); K.glint(c, x - 0.035, y1 + 0.06, 0.06, 0.6); }
  const PAL = { jade: [0.2, 0.46, 0.36], jade2: [0.24, 0.5, 0.36], deep: [0.12, 0.3, 0.24], willow: [0.3, 0.56, 0.36], fern: [0.24, 0.5, 0.3], fern2: [0.32, 0.6, 0.36], pine: [0.1, 0.27, 0.21] };
  function paintEggtree(K, S, v) { const R = K.R1(11 + v * 131), lean = v ? 0.12 : -0.12;
    contact(K, S, 1.2, 0.4, 0.6);
    for (let i = 0; i < 4; i++) { const s = i % 2 ? 1 : -1, k = 0.18 + (i >> 1) * 0.16; root(K, S, s * 0.08, -0.3 + k * 0.3, s * (0.48 + k * 1.1), 0.04, 0.09 + 0.02 * (1 - k), i + v); }
    trunk(K, S, ptsQ(0, 0.02, lean * 0.3, -0.9, lean, -1.78, 10), 0.3, 0.17, 1.3 + v, 0.5);
    for (const s of [-1, 1]) trunk(K, S, ptsQ(lean * 0.7, -1.4, s * 0.35, -1.75, s * 0.62, -2.05, 8), 0.12, 0.07, 3 + s, 0);
    const back = [[-0.55, -2.75, 0.62, 1], [0.6, -2.8, 0.6, 1], [0, -3.15, 0.58, 1]], front = [[0, -2.45, 0.82], [-0.8, -2.08, 0.6], [0.8, -2.12, 0.62], [-0.36, -3.0, 0.56], [0.42, -2.96, 0.55]];
    crown(K, S, back, PAL.deep, 2 + v, 0); crown(K, S, front, v ? PAL.jade2 : PAL.jade, 5 + v, 0.35);
    const n = 3 + v + (v % 2); for (const [x, y] of EGGS[v].slice(0, n)) egg(K, S, x, y - 0.22, y + 0.08, 1);
    // moonlight on the crown's top, a few leaves catching it
    const c = S.c; c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createRadialGradient(-0.5, -3.3, 0.1, -0.3, -2.9, 1.3); g.addColorStop(0, 'rgba(255,244,220,.2)'); g.addColorStop(1, 'rgba(255,244,220,0)'); c.fillStyle = g; c.fillRect(-2, -4.4, 4, 2.5); c.restore();
    for (let i = 0; i < 6; i++) K.glint(c, -0.9 + R() * 1.4, -3.3 + R() * 0.9, 0.05 + R() * 0.04, 0.4);
    K.ink(S, INK, 0.45); }
  function paintWillow(K, S, v) { const R = K.R1(23 + v * 71), lean = v ? 0.1 : -0.08;
    contact(K, S, 1.3, 0.42, 0.55); for (let i = 0; i < 2; i++) root(K, S, (i ? 1 : -1) * 0.06, -0.22, (i ? 1 : -1) * 0.55, 0.04, 0.08, i + v);
    trunk(K, S, ptsQ(0, 0.02, lean * 0.3, -0.8, lean, -1.62, 10), 0.24, 0.14, 2.1 + v, 0.6);
    const strands = []; for (let i = -16; i <= 16; i++) { const x = i * 0.078 + (R() - 0.5) * 0.04, top = -2.0 + Math.abs(i) * 0.02, bot = -0.4 - R() * 0.6 - (Math.abs(i) > 11 ? -0.2 : 0); strands.push([x, top, bot, (R() - 0.5) * 0.14, Math.abs(i) < 8]); }
    const strand = ([x, top, bot, sw], dark) => { K.tube(S, ptsQ(x, top, x + sw, (top + bot) / 2, x + sw * 1.6 + x * 0.12, bot, 8), 0.028, 0.012, (t, s, ao) => { leafM(K, x * 3 + t, t * 6, 4 + x, PAL.willow, 0); K.M.ao *= dark ? 0.55 : 0.8 + 0.2 * t; const fl = K.vn(t * 26 + x * 9, s * 3); if (fl > 0.62) { K.M.r += 0.07; K.M.g += 0.14; K.M.b += 0.05; } else if (fl < 0.3) K.M.ao *= 0.7; }); };
    for (const q of strands) if (q[4]) strand(q, true); S.unlock();
    crown(K, S, [[0, -2.3, 0.8], [-0.62, -2.0, 0.56], [0.62, -2.0, 0.56], [0, -2.88, 0.5]], PAL.willow, 7 + v, 0.15);
    for (const q of strands) if (!q[4]) strand(q, false); for (const q of strands) if (q[4] && hh(Math.round(q[0] * 100), v, 3) < 0.55) strand(q, false); S.unlock();
    const c = S.c; for (const [x, y] of glowsOf('weepwillow', v).map(g => [g[0], g[1]])) { halo(c, x, y, 0.22, GOLD, 0.5); K.ball(S, x, y, 0.035, 0.035, (dx, dy) => { K.M.r = 1; K.M.g = 0.95; K.M.b = 0.7; K.M.er = 0.8; K.M.eg = 0.65; K.M.eb = 0.25; }); } S.unlock();
    K.ink(S, INK, 0.4); }
  function paintPine(K, S, v) { const H = 3.2 + v * 0.25, tiers = 5, sd = 3.3 + v;
    contact(K, S, 0.85, 0.3, 0.6);
    const T0 = []; for (let t = 0; t < tiers; t++) { const hb = 0.45 + t * (H - 0.9) / tiers, w = 1.0 - t * 0.17, ht = (H - 0.5) / tiers * 1.55; T0.push([hb, w, ht]); }
    const prof = h => { let r = h < 0.7 ? 0.14 : 0; for (const [hb, w, ht] of T0) { if (h < hb - 0.03 || h > hb + ht) continue; const u = clamp((h - hb) / ht, 0, 1), up = clamp((h - hb + 0.03) / 0.03, 0, 1); r = Math.max(r, w * Math.pow(1 - u, 1.15) * up); } return r; };
    K.rev(S, 0, 0, prof, 0, H, { mat: (u, h, ao, ins, phi) => { const { M, vn } = K, n = vn(u * 14 + sd, h * 22), n2 = vn(u * 40, h * 9 + sd), t = 0.62 + 0.55 * n + 0.2 * n2; let rim = 0; for (const [hb, w] of T0) if (h > hb - 0.04 && h < hb + 0.14) rim = Math.max(rim, 1 - (h - hb) / 0.14);
      if (h < 0.5) { bark(K, u, h, ao, sd, 0.3); return; } M.r = 0.1 * t + 0.12 * rim; M.g = 0.27 * t + 0.1 * rim; M.b = 0.21 * t + 0.08 * rim; M.rg = 0.7; if (n2 > 0.75) M.ao *= 0.8; if (rim > 0.6 && vn(u * 9, h * 3 + sd) > 0.6) { M.r = lerp(M.r, 0.6, 0.5); M.g = lerp(M.g, 0.3, 0.5); M.b = lerp(M.b, 0.45, 0.5); } }, bump: 0.35, floorAO: 0.6 });
    S.unlock();
    // thorns jutting from each tier's rim (the front half), rose tips
    const tips = [];
    for (const [hb, w] of T0) { const n = 7; for (let i = 0; i < n; i++) { const a = Math.PI * (0.08 + 0.84 * (i + 0.5) / n), x = Math.cos(a) * w * 0.95, y = -hb + Math.sin(a) * w * K.K * 0.9, L = 0.16 + 0.06 * hh(i, hb * 10, 3), dx = Math.cos(a) * 0.9, dy = 0.45;
      K.tube(S, [[x, y], [x + dx * L, y + dy * L * 0.6 - 0.02]], 0.03, 0.004, (t, s) => thornM(K, t, s)); tips.push([x + dx * L, y + dy * L * 0.6 - 0.02]); } }
    K.tube(S, [[0, -H - 0.02], [0, -H - 0.36]], 0.06, 0.006, (t, s) => thornM(K, t, s)); S.unlock();
    for (const [x, y] of tips) if (hh(x * 50, y * 50, 7) < 0.45) K.ball(S, x, y, 0.035, 0.035, () => { K.M.r = 0.95; K.M.g = 0.45; K.M.b = 0.66; K.M.cc = 0.8; K.M.rg = 0.2; K.M.er = 0.25; K.M.eg = 0.06; K.M.eb = 0.14; }); S.unlock();
    halo(S.c, 0, -H - 0.3, 0.3, ROSE, 0.4); K.ink(S, INK, 0.45); }
  function paintBulb(K, S, v) { const sd = 4.1 + v * 2, col = v ? [0.36, 0.25, 0.42] : [0.42, 0.24, 0.38];
    contact(K, S, 0.95, 0.32, 0.6); for (let i = 0; i < 2; i++) root(K, S, (i ? 1 : -1) * 0.12, -0.2, (i ? 1 : -1) * 0.6, 0.05, 0.1, i + v);
    const prof = h => h < 1.25 ? 0.24 + 0.36 * Math.pow(Math.sin(clamp(h / 1.25, 0, 1) * Math.PI * 0.92 + 0.12), 0.8) * (1 - h * 0.12) : lerp(0.2, 0.13, (h - 1.25) / 0.4);
    K.rev(S, 0, 0, prof, 0, 1.65, { mat: (u, h, ao, ins, phi) => { const { M, vn } = K, band = Math.sin(phi * 3 + h * 4.2 + sd), w = vn(u * 4 + sd, h * 3), t = 0.8 + 0.3 * w;
      M.r = col[0] * t; M.g = col[1] * t; M.b = col[2] * t; M.rg = 0.6; M.cc = 0.25; if (band > 0.82) M.ao *= 0.6; else if (band > 0.6) { M.r *= 1.15; M.g *= 1.1; M.b *= 1.15; }
      const mk = ss(0.7, 0.8, vn(u * 2.6 + sd + 4, h * 2.2)) * ss(1.1, 0.3, h); if (mk > 0) { M.r = lerp(M.r, 0.18, mk); M.g = lerp(M.g, 0.4, mk); M.b = lerp(M.b, 0.28, mk); M.rg = 0.95; M.cc = 0; } }, bump: 0.12 });
    S.unlock();
    const B = BULBS[v];
    for (const [s, dx, ty] of B) { const ex = s * dx, ey = ty; K.tube(S, [[0, -1.55], [s * 0.1, -2.0], [ex - s * 0.35, ey + 0.25], [ex, ey + 0.02]], 0.08, 0.045, (t, s2, ao) => bark(K, s2 + s, t * 2, ao, sd + s, 0)); }
    S.unlock();
    // heart leaves on the arms
    const R = K.R1(41 + v * 29); for (let i = 0; i < 6; i++) { const x = (R() - 0.5) * 1.3, y = -1.85 - R() * 0.55, a = R() * TAU, L = 0.16; ribbon(K, S, [[x, y], [x + Math.cos(a) * L, y + Math.sin(a) * L]], t => 0.075 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 0.004, (t, s2) => leafM(K, x * 5 + t, y * 5 + s2, sd, PAL.jade2, 0.3), { cup: 0.4 }); }
    S.unlock();
    for (const [s, dx, ty] of B) { const ex = s * dx, ey = ty - 0.14; halo(S.c, ex, ey, 0.55, ROSE, 0.4); K.ball(S, ex, ey, 0.17, 0.19, (ddx, ddy) => glassM(K, ddx, ddy, [0.98, 0.62, 0.82], 0.65)); S.unlock(); K.glint(S.c, ex - 0.05, ey - 0.08, 0.07, 0.8); }
    K.ink(S, INK, 0.45); }
  function frond(K, S, x0, y0, a, len, pal, sd, dark, droop) { const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10, dd = u * len; pts.push([x0 + Math.cos(a) * dd, y0 + Math.sin(a) * dd + u * u * len * (droop == null ? 0.42 : droop)]); }
    ribbon(K, S, pts, t => 0.16 * (1 - t * 0.82) * (0.45 + 0.55 * Math.pow(Math.abs(Math.sin(t * Math.PI * 7.5)), 0.6)) + 0.012, (t, s) => { leafM(K, x0 + t * 4 + sd, s + sd, sd, pal, 0); if (dark) K.M.ao *= 0.7; const vein = Math.abs(Math.sin(t * Math.PI * 7.5)); if (vein < 0.12 && Math.abs(s) > 0.2) K.M.ao *= 0.85; }, { cup: 0.6 }); }
  function paintFern(K, S, v) { const R = K.R1(51 + v * 17), sd = 5 + v * 3;
    contact(K, S, 1.0, 0.32, 0.55);
    const n = 9; for (const pass of [0, 1]) for (let i = 0; i < n; i++) { const back = i % 2 === 0; if ((pass === 0) !== back) continue; const u = i / (n - 1), a = -Math.PI + 0.25 + u * (Math.PI - 0.5) + (R() - 0.5) * 0.1; frond(K, S, 0, -0.05, a, 1.12 + R() * 0.32 - (back ? 0 : 0.2), back ? PAL.fern : PAL.fern2, sd + i, back, 0.5); }
    S.unlock();
    const curl = []; for (let i = 0; i <= 16; i++) { const t = i / 16; if (t < 0.6) curl.push([0.04 * t, -0.9 * t / 0.6]); else { const a = (t - 0.6) / 0.4 * Math.PI * 1.6; curl.push([0.12 - Math.cos(a) * 0.09 + 0.0, -0.9 - Math.sin(a) * 0.09]); } }
    K.tube(S, curl, 0.04, 0.03, (t, s) => { leafM(K, t * 3, s, sd, [0.46, 0.76, 0.48], 0); }); S.unlock();
    K.ink(S, INK, 0.4); }
  function paintCaps(K, S, v) { const sd = 6 + v;
    contact(K, S, 0.85, 0.3, 0.55);
    for (const [x, h, r, ci] of CAPS[v].slice().sort((a, b) => a[1] - b[1])) { const [col, gl] = CAPCOL[ci];
      K.rev(S, x, 0, hh2 => 0.065 + 0.03 * Math.max(0, 1 - hh2 / 0.15) - 0.012 * (hh2 / h), 0, h - 0.04, { mat: (u, hh2, ao) => { const { M, vn } = K, f = vn(u * 30 + x * 9, hh2 * 4); M.r = 0.9; M.g = 0.85; M.b = 0.76; M.rg = 0.7; if (f > 0.7) M.ao *= 0.86; M.er = 0.04; M.eg = 0.05; M.eb = 0.05; } }); S.unlock();
      halo(S.c, x, -h + 0.02, r * 1.6, gl, 0.4);
      K.ball(S, x, -h + 0.03, r * 0.96, r * 0.26, (dx, dy) => { const M = K.M; M.r = col[0] * 0.6; M.g = col[1] * 0.6; M.b = col[2] * 0.6; const g2 = Math.abs(Math.sin(Math.atan2(dy, dx) * 14)); M.er = col[0] * (0.6 + 0.4 * g2); M.eg = col[1] * (0.6 + 0.4 * g2); M.eb = col[2] * (0.6 + 0.4 * g2); M.rg = 0.6; }); S.unlock();
      K.rev(S, x, -h, hh2 => r * Math.sqrt(Math.max(0, 1 - Math.pow(hh2 / (r * 0.95), 2.2))) * (1 + 0.05 * Math.max(0, 1 - hh2 / 0.05)), 0, r * 0.95, { mat: (u, hh2, ao) => { const { M } = K; const cl = pcell(u * 5 + x * 3, hh2 * 6, 64, 9); M.r = col[0] * 0.92; M.g = col[1] * 0.92; M.b = col[2] * 0.92; M.rg = 0.32; M.cc = 0.7;
        const e = hh2 / (r * 0.95); M.er = col[0] * 0.18 * (1 - e); M.eg = col[1] * 0.18 * (1 - e); M.eb = col[2] * 0.18 * (1 - e); if (cl.d < 0.22 && hh(cl.id, ci, 4) < 0.6) { M.r = 1; M.g = 0.97; M.b = 0.92; M.er += 0.1; M.eg += 0.1; M.eb += 0.1; } }, floorAO: 0 }); S.unlock();
      K.glint(S.c, x - r * 0.4, -h - r * 0.55, r * 0.35, 0.5); }
    K.ink(S, INK, 0.42); }
  function paintLily(K, S, v) { const R = K.R1(61 + v * 7), sd = 7 + v, petal = v ? [0.98, 0.84, 0.92] : [1.0, 0.95, 0.8];
    contact(K, S, 0.85, 0.3, 0.55);
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.36, L = 0.95 + R() * 0.2; ribbon(K, S, ptsQ(0, -0.02, Math.cos(a) * L * 0.4, Math.sin(a) * L * 0.6, Math.cos(a) * L * 0.62, Math.sin(a) * L * 0.95 + 0.05, 8), t => 0.15 * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.04)), (t, s) => { leafM(K, t * 3 + i, s, sd, i % 2 ? PAL.fern2 : PAL.fern, 0); }, { cup: 0.7 }); }
    S.unlock();
    for (const [x, y, s] of LILIES[v]) K.tube(S, ptsQ(x * 0.4, -0.2, x * 0.8, y * 0.6, x, y + 0.05, 6), 0.03, 0.022, (t, s2) => leafM(K, t * 2, s2, sd, PAL.fern2, 0)); S.unlock();
    for (const [x, y, s] of LILIES[v]) { const r = 0.3 * s; halo(S.c, x, y, r * 2.2, GOLD, 0.35);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * TAU; ribbon(K, S, [[x, y], [x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.42], [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85]], t => r * 0.34 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.02)), 0.75), (t, s2) => petalM(K, t, s2, petal, 0.9), { cup: 0.8, face: [0, 0.55, 0.84] }); }
      S.unlock(); K.ball(S, x, y, r * 0.2, r * 0.18, () => { const M = K.M; M.r = 1; M.g = 0.82; M.b = 0.4; M.er = 0.8; M.eg = 0.6; M.eb = 0.15; M.cc = 0.4; }); S.unlock(); K.glint(S.c, x - r * 0.1, y - r * 0.12, r * 0.3, 0.7); }
    K.ink(S, INK, 0.4); }
  function paintBush(K, S, v) { const R = K.R1(71 + v * 13), sd = 8 + v;
    contact(K, S, 0.75, 0.27, 0.55);
    const thorn = (front) => { for (let i = 0; i < 14; i++) { const a = -Math.PI + 0.15 + i / 13 * (Math.PI - 0.3) + (hh(i, v, 5) - 0.5) * 0.15; if ((i % 2 === 0) !== front) continue; const bx = Math.cos(a) * 0.52, by = -0.55 + Math.sin(a) * 0.46, l = 0.24 + hh(i, v, 6) * 0.12; K.tube(S, [[bx, by], [bx + Math.cos(a) * l, by + Math.sin(a) * l]], 0.04, 0.004, (t, s) => thornM(K, t, s)); } S.unlock(); };
    thorn(false); crown(K, S, [[-0.3, -0.45, 0.38], [0.3, -0.47, 0.38], [0, -0.75, 0.42]], PAL.deep, sd, 0.2); thorn(true);
    for (let i = 0; i < 7; i++) { const x = (R() - 0.5) * 0.9, y = -0.4 - R() * 0.55, r = 0.05 + R() * 0.02; K.ball(S, x, y, r, r, (dx, dy) => { const M = K.M; M.r = 0.85; M.g = 0.28; M.b = 0.5; M.rg = 0.15; M.cc = 1; M.er = 0.14; M.eb = 0.08; }); K.glint(S.c, x - r * 0.35, y - r * 0.4, r * 0.8, 0.7); }
    S.unlock(); K.ink(S, INK, 0.45); }
  function paintRock(K, S, v) { const R = K.R1(81 + v * 3), sd = 9 + v * 4;
    contact(K, S, 0.68, 0.26, 0.6);
    lump(K, S, 0.3, -0.2, 0.3, 0.22, { amp: 0.12, fr: 1.3, sd: sd + 3, bump: 0.5, leaf: 5, mat: (dx, dy, ao, e, nz, wx, wy) => stoneM(K, wx, wy, sd + 3, 0.9) }); S.unlock();
    lump(K, S, -0.05, -0.4, 0.62, 0.46, { amp: 0.16, fr: 1.25, sd, bump: 0.55, leaf: 4, mat: (dx, dy, ao, e, nz, wx, wy) => { const mk = ss(0.12, 0.4, nz + (K.vn(wx * 5 + sd, wy * 5) - 0.5) * 0.6 - dy * 0.2); stoneM(K, wx, wy, sd, 1); if (mk > 0) { const M = K.M, r = M.r, g = M.g, b = M.b, a = M.ao; mossM(K, wx, wy, sd); M.r = lerp(r, M.r, mk); M.g = lerp(g, M.g, mk); M.b = lerp(b, M.b, mk); M.ao = a; } } });
    S.unlock();
    for (const [x, a] of [[-0.48, -2.6], [-0.38, -2.2]]) frond(K, S, x, -0.42, a, 0.3 + R() * 0.1, PAL.fern2, sd + x, false, 0.35);
    S.unlock(); halo(S.c, 0.1, -0.6, 0.3, MINT, 0.35); for (let i = 0; i < 4; i++) { const x = (R() - 0.5) * 0.8, y = -0.5 - R() * 0.25; K.ball(S, x, y, 0.022, 0.022, () => { K.M.r = 0.8; K.M.g = 1; K.M.b = 0.85; K.M.er = 0.5; K.M.eg = 0.8; K.M.eb = 0.55; }); } S.unlock();
    K.ink(S, INK, 0.45); }

  /* ======================= the pictures ======================= */
  const DEF = {
    eggtree: { box: () => [-1.95, -4.15, 1.95, 0.42], paint: paintEggtree, mat: { hot: '#FFD36B',  mat: 'foliage', cols: ['#3A7A62', '#1E4A3C', '#F2D8A1'], mix: 'wood' }, el: 'leaf' },
    weepwillow: { box: () => [-1.75, -3.6, 1.75, 0.45], paint: paintWillow, mat: { mat: 'foliage', cols: ['#5FB072', '#2F6A46', '#FFF1B8'], mix: 'wood' }, el: 'leaf' },
    thornpine: { box: v => [-1.3, -(3.2 + v * 0.25) - 0.55, 1.3, 0.4], paint: paintPine, mat: { mat: 'foliage', cols: ['#28604A', '#143429', '#E07BA8'] }, el: 'leaf' },
    bulbtree: { box: () => [-1.45, -3.2, 1.45, 0.42], paint: paintBulb, mat: { hot: '#F7A8CF',  mat: 'foliage', cols: ['#6A3E62', '#3E2440', '#F7A8CF'], mix: 'glass' }, el: 'leaf' },
    giantfern: { box: () => [-1.6, -1.6, 1.6, 0.4], paint: paintFern, mat: { mat: 'foliage', cols: ['#47A262', '#2E7A4E', '#9FE0A0'] }, el: 'leaf' },
    glowcaps: { box: () => [-1.0, -2.25, 1.0, 0.4], paint: paintCaps, mat: { hot: '#B9FFF4',  mat: 'foliage', cols: ['#9A7BE0', '#5FC9C0', '#EDE0C6'] }, el: 'leaf' },
    starlily: { box: () => [-1.05, -1.95, 1.05, 0.4], paint: paintLily, mat: { hot: '#FFE9A8',  mat: 'foliage', cols: ['#3E8A55', '#FFF1C8', '#FFD36B'] }, el: 'leaf' },
    thornbush: { box: () => [-1.0, -1.42, 1.0, 0.4], paint: paintBush, mat: { mat: 'foliage', cols: ['#2F7A4A', '#173D2C', '#E07BA8'] }, el: 'leaf' },
    mossrock: { box: () => [-0.95, -1.35, 0.95, 0.4], paint: paintRock, mat: { mat: 'stone', cols: ['#6E6280', '#3E8A55', '#A79BC4'] }, el: 'earth' },
  };
  const KINDS = Object.keys(DEF);

  /* ======================= the cache and the drawing ======================= */
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0;
  function paint(name, v, P) { const B = BP(); if (!B) return null; const K = B.kit, D = DEF[name]; if (!D) return null; const b = D.box(v), t0 = now(); let S = null;
    try { S = K.surface(b[0], b[1], b[2], b[3], P); lit(K, () => { D.paint(K, S, v); S.unlock(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('GARDEN_PROPS', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;   // (the work canvas, read back often, given back at once: the plain copy is kept)
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  const keyOf = (name, v, P) => name + '|' + v + '|' + P;
  function sprite(name, v, P, force) { if (!DEF[name] || !BP()) return null; P = Math.max(8, Math.round(P || BASE || 48)); const key = keyOf(name, v, P); let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 12) return null;   // (a painting budget: what does not fit waits a frame)
    s = paint(name, v, P); if (s) { if (CACHE.size > 120) release(true); CACHE.set(key, s); } return s; }
  const qP = P => Math.max(8, Math.round(Math.exp(Math.round(Math.log(P) * 10) / 10)));   // (steps of ~10%)
  function draw(c, name, v, Xs, Ys, T, o) { if (off() || !DEF[name]) return false; o = o || {};
    const m = c.getTransform ? c.getTransform() : null, dpr = Math.min(2, m ? Math.max(0.5, Math.hypot(m.a, m.b)) : 1), sc = o.s || 1;
    let P = Math.min(CAP, qP(T * sc * dpr)); if (BASE && !o.exact && P <= BASE * 1.1 && P >= BASE * 0.5) P = BASE;
    let s = sprite(name, v, P); if (!s) { const pre = name + '|' + v + '|'; for (const [k, s2] of CACHE) if (k.startsWith(pre)) { s = s2; break; } if (!s) { STATS.misses++; return false; } }
    const f = T * sc / s.P, sx = (o.sx == null ? 1 : o.sx) * (o.flip ? -1 : 1), sy = o.sy == null ? 1 : o.sy; STATS.draws++;
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; c.translate(Xs, Ys); if (o.rot) c.rotate(o.rot); if (sx !== 1 || sy !== 1) c.scale(sx, sy); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); c.restore(); return true; }

  /* ======================= textures that wrap (the land) ======================= */
  const TEX = new Map();
  /* field(K, w, h, P, fn, o): a picture w x h tiles at P px a tile, every pixel from fn(x, y, mode) (tiles): mode 0 gives its
     height, mode 1 sets the material (K.M) and returns the height; FA (0..1) its cover. The normal is the height's slope
     (o.face: a wall's face toward the camera, else the floor seen from above); o.wrap: the slope wraps at the sides */
  let FA = 1;
  /* (made in bands of rows: the loading screen gives each band its own job, so no one job holds a frame long) */
  function fieldBegin(K, w, h, P, fn, o) { o = o || {}; const S = K.surface(0, 0, w, h, P), W = S.w, Hh = S.h, Hm = new Float32Array(W * Hh), bump = o.bump || 1, kk = P / 2 * bump;
    const F = { S, W, Hh, cv: null,
      heights(y0, y1) { for (let py = y0; py < Math.min(Hh, y1); py++) for (let px = 0; px < W; px++) Hm[py * W + px] = fn((px + 0.5) / P, (py + 0.5) / P, 0); },
      shade(y0, y1) { S.lock(); for (let py = y0; py < Math.min(Hh, y1); py++) for (let px = 0; px < W; px++) { const xl = px > 0 ? px - 1 : (o.wrap ? W - 1 : 0), xr = px < W - 1 ? px + 1 : (o.wrap ? 0 : W - 1), yu = py > 0 ? py - 1 : (o.wrapY ? Hh - 1 : 0), yd = py < Hh - 1 ? py + 1 : (o.wrapY ? 0 : Hh - 1);
        const hx = (Hm[py * W + xr] - Hm[py * W + xl]) * kk, hy = (Hm[yd * W + px] - Hm[yu * W + px]) * kk;
        K.M0(); FA = 1; fn((px + 0.5) / P, (py + 0.5) / P, 1); if (FA <= 0.003) continue;
        let nx, ny, nz; if (o.face) { nx = -hx; ny = 1; nz = hy; } else { nx = -hx; ny = -hy; nz = 1; } const l = Math.hypot(nx, ny, nz); K.shade(nx / l, ny / l, nz / l); K.put(S, px, py, FA); } },
      finish() { S.unlock(); const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1; F.cv = cv; return cv; } };
    return F; }
  function field(K, w, h, P, fn, o) { const F = fieldBegin(K, w, h, P, fn, o); F.heights(0, F.Hh); F.shade(0, F.Hh); return F.finish(); }
  /* the floor: plum loam with a fine crumb, moss in drifts, roots across it, pebbles, fallen leaves and petals, and tiny star
     flowers that glow (6 tiles square, wrapping) */
  const FN = 6;
  function floorFn(x, y, mode) { const M = GK.M, loam = pfbm(x, y, FN, 1), crumb = pvn(x * 8, y * 8, FN * 8, 3), moss0 = pfbm(x * 0.5 + 3.3, y * 0.5 + 1.7, FN * 0.5, 5);
    let h = loam * 0.07 + crumb * 0.018, kind = 0;
    const mk = ss(0.57, 0.7, moss0 + (pvn(x * 3, y * 3, FN * 3, 8) - 0.5) * 0.2); if (mk > 0) h += mk * (0.035 + 0.02 * pvn(x * 14, y * 14, FN * 14, 9));
    // roots: three that run across the floor and wrap (two east-west, one north-south)
    let rt = 0, rd = 0, ru = 0;
    for (let i = 0; i < 2; i++) { const ns = i === 1, a = ns ? y : x, b = ns ? x : y, base = [1.9, 3.6][i], c0 = base + 0.5 * Math.sin(a / FN * TAU * (i + 1) + i * 1.7) + 0.22 * Math.sin(a / FN * TAU * 3 + i), r = 0.045 + 0.022 * Math.sin(a / FN * TAU * 2 + i * 2.1), d = Math.abs(b - c0);
      if (d < r) { const q = Math.sqrt(1 - (d / r) * (d / r)); const hr = r * q * 0.9; if (hr > rt) { rt = hr; rd = d / r * Math.sign(b - c0); ru = a; } } }
    // pebbles (a cell of half a tile, one in four with a stone)
    const pc = pfeat(x * 2, y * 2, FN * 2, 21, 0.16), pr = 0.1 + 0.08 * PH(pc.id, 1, 22); let pb = 0; if (pc.d < pr) pb = Math.sqrt(1 - (pc.d / pr) * (pc.d / pr)) * 0.03;
    const pid = pc.id, pox = pc.ox, poy = pc.oy;
    if (!mode) { const rr0 = rt > 0 ? Math.max(h, 0.03 + rt * 0.8) : pb > 0 ? h + pb : h; return rr0; }   // (the leaves and flowers lie flat: the height needs none of them)
    // fallen leaves and petals (a third of a tile)
    const lc = pfeat(x * 3, y * 3, FN * 3, 31, 0.2); let lf = 0, lk = 0; { const hv = PH(lc.id, 0, 32) * 0.3; if (lc.id >= 0) { const an = PH(lc.id, 1, 33) * Math.PI, ca = Math.cos(an), sa = Math.sin(an), u = (lc.ox * ca + lc.oy * sa) / 0.34, w = (-lc.ox * sa + lc.oy * ca) / 0.16; if (u * u + w * w < 1) { lf = 1; lk = hv < 0.12 ? 2 : hv < 0.2 ? 1 : 0; } } }
    // the star flowers (one tile)
    const fc = pfeat(x * 1.0, y * 1.0, FN, 41, 0.18); let fl = 0, fk = 0; if (fc.id >= 0) { const an = Math.atan2(fc.oy, fc.ox), rr = fc.d, pet = 0.07 * (0.55 + 0.45 * Math.abs(Math.cos(an * 2.5 + PH(fc.id, 1, 43) * 6))); if (rr < pet) { fl = rr < 0.022 ? 2 : 1; fk = Math.floor(PH(fc.id, 2, 44) * 4); } }
    if (rt > 0) { h = Math.max(h, 0.03 + rt * 0.8); kind = 3; } else if (pb > 0) { h += pb; kind = 4; } else if (fl) { h += 0.01; kind = 6; } else if (lf) { h += 0.006; kind = 5; } else if (mk > 0.5) kind = 2; else kind = 1;
    if (!mode) return h;
    const cav = clamp(0.5 + (loam - 0.5) * 1.6, 0, 1);
    if (kind === 3) { bark(GK, rd * 0.5, ru * 2, 1, 2.2, 0); M.r *= 0.8; M.g *= 0.8; M.b *= 0.85; M.ao *= 0.6 + 0.4 * (1 - Math.abs(rd)); }
    else if (kind === 4) { stoneM(GK, pox * 3 + pid, poy * 3, pid % 7, 0.75); }
    else if (kind === 6) { const P2 = [[1, 0.94, 0.8], [0.98, 0.62, 0.8], [0.76, 0.68, 1], [1, 0.85, 0.45]][fk]; if (fl === 2) { M.r = 1; M.g = 0.86; M.b = 0.4; M.er = 0.7; M.eg = 0.55; M.eb = 0.12; } else { M.r = P2[0]; M.g = P2[1]; M.b = P2[2]; M.er = P2[0] * 0.3; M.eg = P2[1] * 0.3; M.eb = P2[2] * 0.3; } M.rg = 0.4; }
    else if (kind === 5) { const C = [[0.12, 0.24, 0.19], [0.36, 0.17, 0.28], [0.42, 0.34, 0.24]][lk]; const t = 0.8 + 0.3 * PH(lc.id, 3, 34); M.r = C[0] * t; M.g = C[1] * t; M.b = C[2] * t; M.rg = 0.6; M.ao *= 0.92; }
    else { const t = 0.7 + 0.42 * loam + 0.14 * crumb, warm = pvn(x * 0.5 + 9, y * 0.5, FN * 0.5, 12); M.r = (0.16 + 0.04 * warm) * t; M.g = 0.095 * t; M.b = (0.21 - 0.03 * warm) * t; M.rg = 0.88; M.ao *= 0.66 + 0.34 * cav;
      if (kind === 2 || mk > 0) { const r = M.r, g = M.g, b = M.b, ao = M.ao; mossM(GK, x * 0.8, y * 0.8, 4); M.r *= 0.78; M.g *= 0.7; M.b *= 0.78; const k2 = ss(0, 0.6, mk); M.r = lerp(r, M.r, k2); M.g = lerp(g, M.g, k2); M.b = lerp(b, M.b, k2); M.ao = ao; if (mk < 0.6) { M.er *= mk; M.eg *= mk; M.eb *= mk; } }
      if (crumb > 0.82) { M.r += 0.04; M.g += 0.03; M.b += 0.05; } }
    return h; }
  /* the earthen bank under a wall's top (its face, 4 tiles wide, h tall): strata of plum earth, stones in it, roots across
     it and spilling over its lip, moss hanging from its top edge */
  const WN = 4;
  function bankFn(H) { return (x, y, mode) => { const M = GK.M, v = y / H, st = pvn(x * 2, y * 7, WN * 2, 51), w = pfbm(x * 1.5, y * 3, WN * 1.5, 52);
    let h = w * 0.05 + st * 0.02, kind = 1;
    const sc = pcell(x * 2.5, y * 4, WN * 2.5, 53), sr = 0.32; let sb = 0; if (PH(sc.id, 0, 54) < 0.35 && sc.d < sr && v > 0.2) { sb = Math.sqrt(1 - (sc.d / sr) ** 2) * 0.05; }
    let rt = 0, rd = 0; for (let i = 0; i < 2; i++) { const c0 = H * (0.35 + 0.3 * i) + H * 0.18 * Math.sin(x / WN * TAU * (i + 1) + i * 2), r = 0.05, d = Math.abs(y - c0); if (d < r) { const q = Math.sqrt(1 - (d / r) ** 2); if (q * r > rt) { rt = q * r; rd = (y - c0) / r; } } }
    const lip = H * (0.16 + 0.07 * pvn(x * 5, 0.5, WN * 5, 55) + 0.05 * pvn(x * 13, 1.5, WN * 13, 56)), drip = PH(Math.floor(x * 6) % (WN * 6), 0, 57) < 0.25 ? H * 0.22 * PH(Math.floor(x * 6) % (WN * 6), 1, 58) : 0;
    if (y < lip + drip * ss(0.35, 0.5, 0.5 - Math.abs((x * 6 % 1) - 0.5))) { kind = 2; h += 0.03 + 0.02 * pvn(x * 16, y * 16, WN * 16, 59); }
    else if (rt > 0) { kind = 3; h = Math.max(h, 0.03 + rt); } else if (sb > 0) { kind = 4; h += sb; }
    if (!mode) return h;
    if (kind === 2) { mossM(GK, x * 2, y * 2, 6); M.ao *= 0.85 + 0.15 * (1 - y / H); }
    else if (kind === 3) { bark(GK, rd, x * 2, 1, 4.4, 0); }
    else if (kind === 4) { stoneM(GK, sc.ox * 3 + sc.id, sc.oy * 3, sc.id % 5, 0.85); }
    else { const t = 0.72 + 0.35 * w + 0.15 * st; M.r = 0.24 * t; M.g = 0.14 * t; M.b = 0.25 * t; M.rg = 0.9; if (st > 0.66) { M.r *= 0.82; M.g *= 0.8; M.b *= 0.85; } M.ao *= 0.6 + 0.4 * v; if (pvn(x * 21, y * 21, WN * 21, 60) > 0.86) { M.r += 0.05; M.g += 0.04; M.b += 0.05; } }
    return h; }; }
  /* the wall tops: a deep moss bed with fern sprigs, the odd glowing spore (4 tiles square, wrapping) */
  function roofFn(x, y, mode) { const M = GK.M, w = pfbm(x * 1.2, y * 1.2, WN * 1.2, 71), f = pvn(x * 12, y * 12, WN * 12, 72), cl = pfeat(x * 2, y * 2, WN * 2, 73, 0.55);
    let h = w * 0.08 + f * 0.025 + (1 - Math.min(1, cl.d / 0.6)) * 0.05; if (!mode) return h;
    mossM(GK, x * 1.3, y * 1.3, 7); M.r *= 0.7; M.g *= 0.72; M.b *= 0.78; M.ao *= 0.6 + 0.4 * w; if (PH(cl.id, 0, 74) < 0.08 && cl.d < 0.12) { M.r = 0.5; M.g = 0.9; M.b = 0.7; M.er = 0.3; M.eg = 0.6; M.eb = 0.4; } return h; }
  /* the cliff over the void (4 tiles wide, 1.2 tall from the ground's edge): a moss lip, a face of plum earth, its bottom
     ragged, roots hanging below it into the dark with glowing tips */
  function cliffFn(x, y, mode) { const M = GK.M, bot = 0.36 + 0.1 * pvn(x * 6, 0.5, WN * 6, 81) + 0.06 * pvn(x * 17, 2.5, WN * 17, 82);
    let h = 0, kind = 0; FA = 1;
    if (y < 0.08 + 0.04 * pvn(x * 9, 0, WN * 9, 83)) { kind = 2; h = 0.04 + 0.02 * pvn(x * 20, y * 20, WN * 20, 84); }
    else if (y < bot) { kind = 1; h = pfbm(x * 2, y * 4, WN * 2, 85) * 0.06; FA = clamp((bot - y) * 40, 0, 1); }
    else { // hanging roots: a few strands, each from the face's bottom down, swaying
      for (let i = 0; i < 9; i++) { const rx = (i + PH(i, 0, 86) * 0.8) * WN / 9, len = 0.25 + 0.6 * PH(i, 1, 87), x0 = rx + 0.06 * Math.sin((y - bot) * 7 + i), r = 0.028 * (1 - (y - bot) / (len + 0.01)) + 0.008; let dx = Math.abs(x - x0); dx = Math.min(dx, WN - dx);
        if (y - bot < len && dx < r) { kind = 3; h = Math.sqrt(1 - (dx / r) ** 2) * r; FA = clamp((r - dx) * 60, 0, 1); if (y - bot > len - 0.04) kind = 4; break; } }
      if (!kind) { FA = 0; return 0; } }
    if (!mode) return h;
    if (kind === 2) { mossM(GK, x * 2, y * 4, 8); M.ao *= 0.9; }
    else if (kind === 1) { const t = 0.7 + 0.35 * pvn(x * 3, y * 9, WN * 3, 88); M.r = 0.2 * t; M.g = 0.11 * t; M.b = 0.21 * t; M.rg = 0.9; M.ao *= 1 - (y / bot) * 0.55; if (pvn(x * 11, y * 11, WN * 11, 89) > 0.8) { M.r += 0.06; M.g += 0.03; M.b += 0.06; } }
    else if (kind === 3) { bark(GK, x * 3, y * 4, 1, 5.5, 0); M.ao *= 0.8; }
    else { M.r = 0.6; M.g = 1; M.b = 0.8; M.er = 0.45; M.eg = 0.9; M.eb = 0.6; }
    return h; }
  /* the March's moss lane (10 tiles across: the lane 1..9, its lips and the roots curling off them into the void; 6 tiles
     long, wrapping): a deep moss carpet in tufts, a trodden line of cream stones down its middle, star flowers, the lip raised */
  function laneFn(x, y, mode) { const M = GK.M, L0 = 1, L1 = 9; FA = 1;
    if (x < L0 || x > L1) { const side = x < L0 ? -1 : 1, d = side < 0 ? L0 - x : x - L1; let hit = 0, hr = 0;
      for (let i = 0; i < 6; i++) { const y0 = i + PH(i, side + 2, 91) * 0.7, len = 0.35 + 0.55 * PH(i, side + 2, 92), r = 0.045 * (1 - d / (len + 0.01)) + 0.01; if (d > len) continue; let dy = y - (y0 + d * d * 0.9 + Math.sin(d * 5 + i) * 0.06); dy = dy - Math.round(dy / FN) * FN; if (Math.abs(dy) < r) { hit = d > len - 0.05 ? 2 : 1; hr = Math.sqrt(1 - (dy / r) ** 2) * r; FA = clamp((r - Math.abs(dy)) * 50, 0, 1); break; } }
      if (!hit) { FA = 0; return 0; } if (!mode) return hr; if (hit === 2) { M.r = 0.6; M.g = 1; M.b = 0.8; M.er = 0.45; M.eg = 0.85; M.eb = 0.55; } else { bark(GK, x * 3, y * 2, 1, 6.2, 0); M.ao *= 0.75; } return hr; }
    const e = Math.min(x - L0, L1 - x), lip = ss(0.32, 0.0, e), w = pfbm(x * 0.5, y * 0.5, FN * 0.5, 93), tuft = pcell(x * 2, y * 2, FN * 2, 94), mid = Math.abs(x - 5);
    let h = w * 0.05 + (1 - Math.min(1, tuft.d / 0.75)) * 0.07 + lip * 0.06, kind = 1;
    const stc = pfeat(5 + (x - 5) * 1.0, y * 1.0, FN, 95, 0.9); let sb = 0; if (mid < 0.5) { const sr = 0.16 + 0.06 * PH(stc.id, 1, 96), sx = (x - 5), sy = stc.oy; const dd = Math.hypot(sx * 1.2, sy); if (stc.id >= 0 && dd < sr) { sb = Math.sqrt(1 - (dd / sr) ** 2) * 0.03; kind = 3; h += sb; } }
    const fc = pfeat(x * 1.3, y * 1.3, Math.round(FN * 1.3), 97, 0.2); if (kind === 1 && fc.id >= 0 && fc.d < 0.08) { kind = fc.d < 0.025 ? 5 : 4; h += 0.01; }
    if (!mode) return h;
    if (kind === 3) { stoneM(GK, stc.ox * 3 + stc.id, stc.oy * 3, stc.id % 9, 1.25); M.r += 0.08; M.g += 0.06; }
    else if (kind === 4 || kind === 5) { const P2 = [[1, 0.94, 0.8], [0.98, 0.62, 0.8], [0.76, 0.68, 1]][fc.id % 3]; if (kind === 5) { M.r = 1; M.g = 0.86; M.b = 0.4; M.er = 0.6; M.eg = 0.48; M.eb = 0.1; } else { M.r = P2[0]; M.g = P2[1]; M.b = P2[2]; M.er = P2[0] * 0.3; M.eg = P2[1] * 0.3; M.eb = P2[2] * 0.3; } }
    else { mossM(GK, x * 0.45, y * 0.45, 14); const cen = 1 - Math.min(1, mid / 4.2), tone = PH(tuft.id, 2, 98), k = 0.95 + 0.3 * cen + 0.18 * tone; M.r *= k * 1.05; M.g *= k * 1.15; M.b *= k; M.ao *= 0.55 + 0.45 * Math.min(1, tuft.d * 1.6); if (lip > 0) { M.r += 0.06 * lip; M.g += 0.14 * lip; M.b += 0.07 * lip; } }
    return h; }
  let GK = null;   // (the kit, while a texture is made)
  const TDEF = {
    floor: { w: FN, h: FN, fn: () => floorFn, o: { wrap: true, wrapY: true, bump: 1.2 } },
    bank: { w: WN, h: 0.55, fn: () => bankFn(0.55), o: { wrap: true, face: true, bump: 1.4 } },
    roof: { w: WN, h: WN, fn: () => roofFn, o: { wrap: true, wrapY: true, bump: 1.2 } },
    cliff: { w: WN, h: 1.25, fn: () => cliffFn, o: { wrap: true, face: true, bump: 1.4 } },
    mlane: { w: 10, h: FN, fn: () => laneFn, o: { wrapY: true, bump: 1.3 } },
  };
  /* the jobs that make a texture in bands (the loading screen's), its last one keeping it */
  // (a texture or picture is never made finer than CAP px a tile: on a 3x phone the floor's 94 px would cost twice the time and
  // memory of 72 for detail the eye cannot find there; it is drawn scaled the little way that remains)
  const CAP = 72;
  function texJobs(name, P) { const B = BP(), D = TDEF[name]; if (!B || !D) return []; P = Math.max(8, Math.min(CAP, Math.round(P))); const key = name + '|' + P; if (TEX.has(key)) return [];
    if (D.custom) return [() => tex(name, P)];
    const K = B.kit; let F = null, t0 = 0; const run = f => () => { if (TEX.has(key)) return; try { GK = K; lit(K, f); } catch (e) { F = null; } GK = null; }, jobs = [];
    jobs.push(run(() => { t0 = now(); F = fieldBegin(K, D.w, D.h, P, D.fn(), D.o); }));
    const H = Math.ceil(D.h * P), n = Math.max(1, Math.ceil(D.w * P * H / 24000)), band = Math.ceil(H / n);
    for (let i = 0; i < n; i++) jobs.push(run(() => { if (F) F.heights(i * band, (i + 1) * band); }));
    for (let i = 0; i < n; i++) jobs.push(run(() => { if (F) F.shade(i * band, (i + 1) * band); }));
    jobs.push(run(() => { if (!F) return; const cv = F.finish(); F = null; TEX.set(key, { cv, P }); STATS.tex++; STATS.texMs += now() - t0; }));
    return jobs; }
  // a texture at about this sharpness: one already made within tol (a fraction) is used as it is, else one is made
  function texNear(name, P, tol) { let best = null, bd = 1e9; const pre = name + '|'; for (const [k, t] of TEX) if (k.startsWith(pre)) { const d = Math.abs(t.P - P) / P; if (d < bd) { bd = d; best = t; } } return best && bd <= (tol == null ? 0.25 : tol) ? best : tex(name, P); }
  function tex(name, P) { const B = BP(), D = TDEF[name]; if (!B || !D) return null; P = Math.max(8, Math.min(CAP, Math.round(P))); const key = name + '|' + P; let t = TEX.get(key); if (t) return t;
    const t0 = now(), K = B.kit; let cv = null; try { GK = K; lit(K, () => { cv = D.custom ? D.custom(K, P) : field(K, D.w, D.h, P, D.fn(), D.o); }); } catch (e) { if (typeof console !== 'undefined') console.warn('GARDEN_PROPS tex', name, e); cv = null; } GK = null;
    if (!cv) return null; t = { cv, P }; TEX.set(key, t); STATS.tex++; STATS.texMs += now() - t0; return t; }

  /* ======================= the land: BIOMES.garden's own floor, walls, wall tops, cliffs ======================= */
  const kOf = c => { try { const m = c.getTransform(); return Math.max(0.5, Math.hypot(m.a, m.b)); } catch (e) { return 1; } };
  const md = (a, n) => ((a % n) + n) % n;
  // soft world-space washes over the floor: dark loam, moonlight pools (cream, rose, jade), a glow of moss
  function washes(c, X, Y, T, x, y) { const G = 3.2;
    for (let gy = Math.floor((y - 3) / G); gy <= Math.floor((y + 4) / G); gy++) for (let gx = Math.floor((x - 3) / G); gx <= Math.floor((x + 4) / G); gx++) { const kind = hh(gx, gy, 141); let col, a;
      if (kind < 0.26) { col = '14,6,20'; a = 0.1 + hh(gx, gy, 143) * 0.1; } else if (kind < 0.42) { col = '242,216,161'; a = 0.06 + hh(gx, gy, 147) * 0.05; } else if (kind < 0.5) { col = '224,123,168'; a = 0.05 + hh(gx, gy, 149) * 0.05; } else if (kind < 0.6) { col = '127,227,180'; a = 0.05 + hh(gx, gy, 151) * 0.04; } else continue;
      const cx = (gx + hh(gx, gy, 153)) * G, cy = (gy + hh(gx, gy, 159)) * G, rr = 1 + hh(gx, gy, 161) * 1.8; if (cx + rr < x || cx - rr > x + 1 || cy + rr * 0.8 < y || cy - rr * 0.8 > y + 1) continue;
      const px = X + (cx - x) * T, py = Y + (cy - y) * T; c.save(); c.translate(px, py); c.scale(1, 0.75); const g = c.createRadialGradient(0, 0, 0, 0, 0, rr * T); g.addColorStop(0, `rgba(${col},${a.toFixed(3)})`); g.addColorStop(0.6, `rgba(${col},${(a * 0.5).toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rr * T, 0, TAU); c.fill(); c.restore(); } }
  function landFloor(c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE) { const t = tex('floor', Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return OLDB.floorFn ? OLDB.floorFn.apply(null, arguments) : undefined;
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();   // (each tile paints its own square of the washes: they meet without a seam)
    c.drawImage(t.cv, md(x, FN) * P, md(y, FN) * P, P, P, X, Y, T + 0.02, T + 0.02);
    washes(c, X, Y, T, x, y);
    // the ground's edge over the void: darker earth, the moss thinning
    const side = (x0, y0, x1, y1, w, hh2) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(10,4,16,.5)'); g.addColorStop(0.5, 'rgba(10,4,16,.14)'); g.addColorStop(1, 'rgba(10,4,16,0)'); c.fillStyle = g; c.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, hh2); };
    if (gN) side(X, Y, X, Y + T * 0.5, T, T * 0.5); if (gS) side(X, Y + T, X, Y + T * 0.55, T, T * 0.45); if (gW) side(X, Y, X + T * 0.45, Y, T * 0.45, T); if (gE) side(X + T, Y, X + T * 0.55, Y, T * 0.45, T); c.restore(); }
  function landWall(c, X, Y, T, H, h, x, lw, B) { const t = tex('bank', Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return OLDB.wallFn ? OLDB.wallFn.apply(null, arguments) : undefined;
    c.drawImage(t.cv, md(x, WN) * P, 0, P, t.cv.height, X, Y, T + 0.5, H);
    const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, 'rgba(10,4,16,0)'); g.addColorStop(1, 'rgba(10,4,16,.35)'); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H); }
  function landRoof(c, X, Y, T, x, y, isWall) { const t = tex('roof', Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, WN) * P, md(y, WN) * P, P, P, X, Y, T + 0.5, T + 0.5);
    // where the bank falls away (north, west, east) a lit lip of moss, and a shade toward the south face
    if (!isWall(x, y - 1)) { c.fillStyle = 'rgba(190,255,210,.13)'; c.fillRect(X, Y, T + 0.5, Math.max(1, T * 0.06)); }
    if (!isWall(x - 1, y)) { c.fillStyle = 'rgba(190,255,210,.08)'; c.fillRect(X, Y, Math.max(1, T * 0.05), T); } if (!isWall(x + 1, y)) { c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(X + T * 0.94, Y, T * 0.06, T); } }
  function landCliff(c, x, y, X, Y, T, lw, B, isGap) { const t = tex('cliff', Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return OLDB.cliffTint ? OLDB.cliffTint.apply(null, arguments) : undefined;
    const rr = T * 0.38, l = isGap && isGap(x - 1, y) ? rr : 0, r = isGap && isGap(x + 1, y) ? rr : 0, sx = md(x, WN) * P, k = P / T;
    c.save(); if (l || r) { c.beginPath(); c.moveTo(X + l, Y - 1); c.lineTo(X + T - r, Y - 1); c.lineTo(X + T - r * 0.6, Y + T * 1.3); c.lineTo(X + l * 0.6, Y + T * 1.3); c.closePath(); c.clip(); }
    c.drawImage(t.cv, sx, 0, P, t.cv.height, X, Y - T * 0.02, T, t.cv.height / k); c.restore(); }

  /* ======================= the undergrowth (decals laid into the floor) ======================= */
  Object.assign(DEF, {
    dtuft: { box: () => [-0.32, -0.42, 0.32, 0.08], paint(K, S, v) { const R = K.R1(901 + v * 7), pal = [PAL.fern, PAL.fern2, [0.3, 0.62, 0.42], PAL.jade2][v % 4]; K.contact(S, 0, 0.02, 0.22, 0.07, 0.4);
      for (let i = 0; i < 9; i++) { const x = (i - 4) * 0.045 + (R() - 0.5) * 0.02, h = 0.22 + R() * 0.16, lean = (i - 4) * 0.035 + (R() - 0.5) * 0.06; ribbon(K, S, ptsQ(x, 0.02, x + lean * 0.3, -h * 0.5, x + lean, -h, 6), t => 0.018 * (1 - t) + 0.003, (t, s) => { leafM(K, x * 9 + t, s, 9 + i, pal, 0); K.M.ao *= 0.6 + 0.4 * t; }, { cup: 0.3 }); }
      S.unlock(); if (v === 3) for (let i = 0; i < 3; i++) K.ball(S, (i - 1) * 0.1, -0.32 - R() * 0.05, 0.02, 0.02, () => { K.M.r = 0.95; K.M.g = 0.5; K.M.b = 0.7; K.M.er = 0.3; K.M.eb = 0.2; }); S.unlock(); K.ink(S, INK, 0.3); } },
    dflower: { box: () => [-0.26, -0.26, 0.26, 0.26], paint(K, S, v) { const col = [[1, 0.94, 0.8], [0.98, 0.62, 0.8], [0.76, 0.68, 1], [1, 0.84, 0.42]][v % 4]; halo(S.c, 0, 0, 0.24, ['#FFF1C8', '#FFB8DA', '#D8CCFF', '#FFD36B'][v % 4], 0.35);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * TAU; ribbon(K, S, [[0, 0], [Math.cos(a) * 0.08, Math.sin(a) * 0.06], [Math.cos(a) * 0.15, Math.sin(a) * 0.11]], t => 0.05 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.02)), 0.7), (t, s) => petalM(K, t, s, col, 0.7), { cup: 0.4, face: [0, 0.3, 0.95] }); }
      S.unlock(); K.ball(S, 0, 0, 0.03, 0.025, () => { K.M.r = 1; K.M.g = 0.85; K.M.b = 0.4; K.M.er = 0.6; K.M.eg = 0.5; K.M.eb = 0.1; }); S.unlock(); K.ink(S, INK, 0.25); } },
    dfern: { box: () => [-0.4, -0.4, 0.4, 0.08], paint(K, S, v) { for (let k = -1; k <= 1; k++) frond(K, S, 0, 0, -Math.PI / 2 + k * 0.75 + (v - 1.5) * 0.08, 0.36, k ? PAL.fern : PAL.fern2, 11 + k + v, false, 0.25); S.unlock(); K.ink(S, INK, 0.3); } },
    droot: { box: () => [-0.5, -0.2, 0.5, 0.2], paint(K, S, v) { const R = K.R1(931 + v); K.tube(S, [[-0.46, 0.04], [-0.2, -0.06 + R() * 0.04], [0.1, 0.06], [0.44, -0.04]], 0.05, 0.03, (t, s, ao) => bark(K, s + v, t * 3, ao, v, 0.3)); K.tube(S, [[-0.05, 0.0], [0.05, 0.1], [0.14, 0.16]], 0.025, 0.01, (t, s, ao) => bark(K, s, t, ao, v + 1, 0)); S.unlock(); K.ink(S, INK, 0.3); } },
    dmoss: { box: () => [-0.42, -0.24, 0.42, 0.2], paint(K, S, v) { const R = K.R1(941 + v); for (let i = 0; i < 4; i++) lump(K, S, (R() - 0.5) * 0.4, -0.02 + (R() - 0.5) * 0.08, 0.14 + R() * 0.08, 0.07 + R() * 0.03, { amp: 0.2, fr: 3, sd: i + v, bump: 0.6, leaf: 30, mat: (dx, dy, ao, e, nz, wx, wy) => mossM(K, wx * 3, wy * 3, i) }); S.unlock();
      for (let i = 0; i < 4; i++) K.ball(S, (R() - 0.5) * 0.5, -0.02 + (R() - 0.5) * 0.12, 0.012, 0.012, () => { K.M.r = 1; K.M.g = 0.85; K.M.b = 0.4; K.M.er = 0.7; K.M.eg = 0.55; K.M.eb = 0.1; }); S.unlock(); K.ink(S, INK, 0.2); } },
    /* the vine bridges' thorn: a curved spike, green to cream, a rose tip */
    thorn: { box: () => [-0.05, -0.08, 0.4, 0.08], paint(K, S) { K.tube(S, [[0, 0], [0.18, -0.02], [0.36, 0.0]], 0.055, 0.005, (t, s) => thornM(K, t, s)); S.unlock(); K.ink(S, INK, 0.4); } },
  });
  // a decal: its picture (at the floor's sharpness, a little over), scaled by its size, turned if it lies flat
  const DEC = { gtuft: ['dtuft', false, 1.0], gflower: ['dflower', true, 0.9], gfern: ['dfern', false, 1.0], groot: ['droot', true, 1.1], gmoss: ['dmoss', true, 1.1] };
  function decal(c, kind, d, s, T) { const D = DEC[kind]; if (!D || off()) return false; const P = Math.round(T * kOf(c) * 1.25), sp = sprite(D[0], (d.v | 0) % 4, P, true); if (!sp) return false;
    const f = (s / (T * 0.18)) * T / sp.P * D[2]; c.save(); if (D[1]) c.rotate(d.rot || 0); c.drawImage(sp.cv, -sp.ax * f, -sp.ay * f, sp.cv.width * f, sp.cv.height * f); c.restore(); return true; }

  /* ======================= the puzzles' pieces (20p draws them; its old 2D art where these are not painted) ======================= */
  const stoneBox = (K, S, cx, by, hw, hd, z0, z1, sd, tone) => { K.rbox(S, cx, by, hw, hd, z0, z1, 0.06, (f, u, v, ao) => { stoneM(K, u + cx, v + by * 3, sd, tone); if (f === 't') K.M.ao *= 0.95; }); S.unlock(); };
  const mossCap = (K, S, x0, x1, y, sd, n) => { for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, x = lerp(x0, x1, u) + (hh(i, sd, 3) - 0.5) * 0.08, r = (x1 - x0) / n * 0.75 + 0.03; lump(K, S, x, y - 0.02 + (hh(i, sd, 4) - 0.5) * 0.04, r, r * 0.45, { amp: 0.25, fr: 3, sd: sd + i, bump: 0.6, leaf: 26, mat: (dx, dy, ao, e, nz, wx, wy) => mossM(K, wx * 3, wy * 3, sd + i) }); } S.unlock(); };
  Object.assign(DEF, {
    /* the March: a gate's vine post (its bud left pale: the gate's colour is the live glow), a stone block, a moss boulder,
       a thorn hedge clump, a bloom post (v 0 waiting, 1 reached) */
    mpost: { box: () => [-0.42, -2.05, 0.42, 0.3], paint(K, S, v) { contact(K, S, 0.3, 0.1, 0.5); trunk(K, S, [[0, 0.02], [0.03, -0.8], [-0.02, -1.6], [0, -1.86]], 0.08, 0.06, 21, 0.4);
      K.tube(S, ptsQ(-0.1, -0.1, 0.18, -0.7, -0.1, -1.5, 10), 0.03, 0.022, (t, s2) => vineM(K, t * 1.6, s2, 3, 1.1)); K.tube(S, ptsQ(0.1, -0.3, -0.16, -1.0, 0.09, -1.8, 10), 0.028, 0.02, (t, s2) => vineM(K, t * 1.6, s2, 5, 1.0)); S.unlock();
      for (const [y, sd2] of [[-0.35, 1], [-0.8, -1], [-1.2, 1]]) ribbon(K, S, [[0, y], [sd2 * 0.16, y - 0.04], [sd2 * 0.3, y + 0.02]], t => 0.075 * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.02)), (t, s2) => leafM(K, t * 3 + y, s2, 23, PAL.fern2, 0)); S.unlock();
      K.ball(S, 0, -1.98, 0.15, 0.15, (dx, dy) => { const M = K.M; M.r = 0.92; M.g = 0.9; M.b = 0.86; M.rg = 0.2; M.cc = 1; M.er = 0.12; M.eg = 0.12; M.eb = 0.12; }); S.unlock(); K.glint(S.c, -0.05, -2.04, 0.08, 0.8); K.ink(S, INK, 0.45); } },
    mblock: { box: () => [-1.15, -1.95, 1.15, 0.3], paint(K, S, v) { contact(K, S, 1.1, 0.24, 0.6); stoneBox(K, S, 0, -0.02, 0.95, 0.42, 0, 1.05, 4.3, 1.0); mossCap(K, S, -0.92, 0.92, -1.05 - 0.42 * K.K, 6, 7);
      const c = S.c; c.save(); c.strokeStyle = 'rgba(40,20,48,.55)'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(-0.95, -0.5); c.lineTo(0.95, -0.5); c.stroke(); c.restore();   // (a mortar line across its face)
      for (const [x, y] of [[-0.6, -0.25], [0.55, -0.78], [0.2, -0.3]]) lump(K, S, x, y, 0.16, 0.08, { amp: 0.3, fr: 3, sd: x * 9, bump: 0.6, leaf: 30, mat: (dx, dy, ao, e, nz, wx, wy) => mossM(K, wx * 3, wy * 3, 4) }); S.unlock(); K.ink(S, INK, 0.5); } },
    mboulder: { box: () => [-0.75, -0.75, 0.75, 0.75], paint(K, S, v) { lump(K, S, 0, 0, 0.62, 0.62, { amp: 0.07, fr: 1.4, sd: 41, bump: 0.45, leaf: 4, mat: (dx, dy, ao, e, nz, wx, wy) => { const mk = ss(0.35, 0.7, K.fbm(wx * 2.6 + 5, wy * 2.6)); stoneM(K, wx * 1.4, wy * 1.4, 41, 1.05); if (mk > 0) { const M = K.M, r = M.r, g = M.g, b = M.b, a = M.ao; mossM(K, wx * 2, wy * 2, 41); M.r = lerp(r, M.r, mk); M.g = lerp(g, M.g, mk); M.b = lerp(b, M.b, mk); M.ao = a; } } }); S.unlock(); K.ink(S, INK, 0.5); } },
    mhedge: { box: () => [-0.75, -1.25, 0.75, 0.3], paint(K, S, v) { contact(K, S, 0.6, 0.18, 0.55);
      const thorns = front => { for (let i = 0; i < 11; i++) { if ((i % 2 === 0) !== front) continue; const a = -Math.PI + 0.2 + i / 10 * (Math.PI - 0.4), bx = Math.cos(a) * 0.44, by = -0.45 + Math.sin(a) * 0.4, l = 0.2 + hh(i, v, 8) * 0.1; K.tube(S, [[bx, by], [bx + Math.cos(a) * l, by + Math.sin(a) * l]], 0.04, 0.004, (t) => thornM(K, t, 0)); } S.unlock(); };
      thorns(false); for (const [x, y, r] of [[-0.25, -0.38, 0.33], [0.26, -0.4, 0.33], [0, -0.62, 0.36]]) lump(K, S, x, y, r, r * 0.9, { amp: 0.14, fr: 2.4, sd: 51 + v + x * 5, bump: 0.9, leaf: 10, cells: true, mat: (dx, dy, ao, e, nz, wx, wy) => { leafM(K, wx, wy, 51, [0.26, 0.22, 0.36], 0.4); } }); S.unlock(); thorns(true);
      K.ball(S, 0.18, -0.55, 0.06, 0.06, () => { const M = K.M; M.r = 0.9; M.g = 0.3; M.b = 0.55; M.cc = 1; M.rg = 0.2; M.er = 0.2; M.eb = 0.1; }); S.unlock(); K.ink(S, INK, 0.5); } },
    mbloom: { box: () => [-0.65, -2.6, 0.65, 0.3], paint(K, S, v) { const on = v === 1; contact(K, S, 0.35, 0.12, 0.55); K.tube(S, ptsQ(0, 0.02, 0.22, -1.0, 0, -1.95, 12), 0.07, 0.045, (t, s2) => vineM(K, t * 2, s2, 9, 1.0)); S.unlock();
      for (const [y, sd2] of [[-0.5, 1], [-1.1, -1]]) ribbon(K, S, [[0.06, y], [sd2 * 0.22 + 0.06, y - 0.08], [sd2 * 0.4 + 0.06, y]], t => 0.09 * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.02)), (t, s2) => leafM(K, t * 3 + y, s2, 29, PAL.fern2, 0)); S.unlock();
      const col = on ? [0.62, 1, 0.84] : [1, 0.68, 0.84]; halo(S.c, 0, -2.1, 0.55, on ? MINT : '#F7B8D8', 0.4);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2; ribbon(K, S, [[0, -2.1], [Math.cos(a) * 0.14, -2.1 + Math.sin(a) * 0.12], [Math.cos(a) * 0.3, -2.1 + Math.sin(a) * 0.26]], t => 0.1 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.02)), 0.7), (t, s2) => petalM(K, t, s2, col, 0.7), { cup: 0.7, face: [0, 0.55, 0.84] }); }
      S.unlock(); K.ball(S, 0, -2.1, 0.08, 0.075, () => { const M = K.M; M.r = 1; M.g = 0.85; M.b = 0.4; M.er = 0.7; M.eg = 0.55; M.eb = 0.12; }); S.unlock(); K.ink(S, INK, 0.45); } },
    /* the March's Milkcap Colossus (in units of its radius, its origin the body's centre as MP.milkcap's; v 1 the cap tipped
       forward as it braces): four stubby jade legs, a broad jade body, a cream dome cap spotted rose, a crown of plum thorns,
       a black maw of cream fangs, two sockets the live light fills */
    colossus: { box: () => [-1.6, -2.05, 1.6, 1.15], paint(K, S, v) { const M = K.M, tip = v === 1 ? 0.25 : 0;
      for (const [x, y] of [[-0.7, 0.78], [-0.25, 0.88], [0.25, 0.88], [0.7, 0.78]]) K.tube(S, [[x * 0.7, 0.3], [x * 0.95, 0.62], [x, y]], 0.13, 0.11, (t, s2) => { leafM(K, x * 3 + t, s2, 81, [0.2, 0.42, 0.36], 0); M.ao *= 0.75 + 0.25 * t; });
      S.unlock();
      lump(K, S, 0, 0.25, 0.78, 0.52, { amp: 0.05, fr: 1.5, sd: 83, bump: 0.25, leaf: 6, mat: (dx, dy, ao, e, nz, wx, wy) => { const w = K.vn(wx * 5 + 3, wy * 5); M.r = 0.24 * (0.8 + 0.3 * w); M.g = 0.5 * (0.8 + 0.3 * w); M.b = 0.42 * (0.8 + 0.3 * w); M.rg = 0.55; M.cc = 0.3; if (dy > 0.5) M.ao *= 0.7; } }); S.unlock();
      // the maw and its fangs, the sockets
      const c = S.c; c.save(); c.fillStyle = '#1A0D20'; c.beginPath(); c.moveTo(-0.36, 0.3); for (let i = 0; i <= 6; i++) c.lineTo(-0.36 + i * 0.12, i % 2 ? 0.4 : 0.3); c.lineTo(0.32, 0.48); c.quadraticCurveTo(0, 0.64, -0.32, 0.48); c.closePath(); c.fill();
      for (let i = 0; i < 4; i++) { const x = -0.26 + i * 0.17; const g = c.createLinearGradient(x, 0.33, x, 0.46); g.addColorStop(0, '#FFF4DC'); g.addColorStop(1, '#C9AB72'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 0.05, 0.34); c.lineTo(x + 0.01, 0.47); c.lineTo(x + 0.06, 0.35); c.closePath(); c.fill(); }
      for (const sd of [-1, 1]) { c.fillStyle = '#12060F'; c.beginPath(); c.ellipse(sd * 0.3, 0.05, 0.11, 0.08, sd * 0.2, 0, TAU); c.fill(); c.strokeStyle = 'rgba(20,10,20,.85)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(sd * 0.48, -0.12); c.lineTo(sd * 0.14, 0.0); c.stroke(); } c.restore();
      // the cap: a dome on the body, tipped forward when it braces
      const S2 = { __proto__: S, ay: S.ay - (0.35 - tip) * S.P }; K.rev(S2, 0, 0, h => 1.1 * Math.sqrt(Math.max(0, 1 - Math.pow(h / 1.05, 2))) * (1 + 0.04 * Math.max(0, 1 - h / 0.08)), 0, 1.05, { mat: (u, h, ao, ins, phi) => { const cl = pcell(u * 2.2 + 7, h * 3, 64, 85); M.r = 0.96; M.g = 0.9; M.b = 0.78; M.rg = 0.4; M.cc = 0.5; const w = K.vn(u * 4, h * 4 + 2); M.r *= 0.92 + 0.1 * w; M.g *= 0.92 + 0.1 * w;
        if (cl.d < 0.3 && hh(cl.id, 1, 86) < 0.5) { const k = ss(0.3, 0.18, cl.d); M.r = lerp(M.r, 0.66, k); M.g = lerp(M.g, 0.36, k); M.b = lerp(M.b, 0.53, k); M.er += 0.08 * k; M.eb += 0.05 * k; } if (h < 0.08) M.ao *= 0.8; }, top: false, floorAO: 0.3 }); S.unlock();
      for (let i = 0; i < 7; i++) { const u = (i - 3) / 3, px = u * 0.85, py = -1.25 + Math.abs(u) * 0.45 + tip * 0.6; K.tube(S, [[px, py + 0.06], [px + u * 0.12, py - 0.38]], 0.1, 0.008, (t2) => { M.r = lerp(0.34, 0.7, t2); M.g = lerp(0.18, 0.42, t2); M.b = lerp(0.46, 0.85, t2); M.rg = 0.35; M.cc = 0.6; }); } S.unlock();
      K.glint(c, -0.45, -1.15 + tip, 0.22, 0.6); K.ink(S, INK, 0.55); } },
    /* the Falling Nursery: the star-bud's stem and leaves, its head at four stages of opening (3: bloomed), a falling star, a void shard */
    sbud: { box: () => [-0.75, -1.45, 0.75, 0.35], paint(K, S) { contact(K, S, 0.6, 0.2, 0.55); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.55, L = 0.55 + hh(i, 2, 3) * 0.2; ribbon(K, S, ptsQ(0, -0.02, Math.cos(a) * L * 0.4, Math.sin(a) * L * 0.5, Math.cos(a) * L * 0.75, Math.sin(a) * L * 0.75 + 0.06, 8), t => 0.12 * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.04)), (t, s2) => leafM(K, t * 3 + i, s2, 33, i % 2 ? PAL.fern2 : PAL.fern, 0), { cup: 0.7 }); }
      S.unlock(); K.tube(S, ptsQ(0, 0, 0.15, -0.7, 0, -1.32, 10), 0.07, 0.045, (t, s2) => vineM(K, t * 2, s2, 11, 1.0)); S.unlock(); K.ink(S, INK, 0.45); } },
    sbloom: { box: () => [-0.75, -0.75, 0.75, 0.75], paint(K, S, v) { const open = v >= 3 ? 1 : v * 0.3, n = 6; halo(S.c, 0, 0, 0.7, GOLD, 0.25 + 0.2 * open);
      for (let i = 0; i < n; i++) { const a = i / n * TAU - Math.PI / 2, sp = 0.2 + open * 0.32, col = i % 2 ? [1, 0.72, 0.86] : [0.86, 0.45, 0.66]; ribbon(K, S, [[0, 0], [Math.cos(a) * sp * 0.5, Math.sin(a) * sp * 0.42], [Math.cos(a) * sp, Math.sin(a) * sp * 0.82]], t => (0.12 + open * 0.05) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.02)), 0.7), (t, s2) => petalM(K, t, s2, col, 0.25 + 0.6 * open), { cup: 0.8 - open * 0.4, face: [0, 0.5 + open * 0.2, 0.86] }); }
      S.unlock(); const r = 0.12 + 0.1 * open; K.ball(S, 0, 0, r, r, (dx, dy) => { const M = K.M, e = Math.hypot(dx, dy); M.r = 1; M.g = 0.86; M.b = 0.45; M.cc = 0.6; M.rg = 0.25; M.er = (0.5 + 0.5 * open) * (1 - e * 0.5); M.eg = (0.4 + 0.4 * open) * (1 - e * 0.5); M.eb = 0.1 + 0.2 * open; }); S.unlock(); K.glint(S.c, -r * 0.3, -r * 0.4, r * 0.8, 0.8); K.ink(S, INK, 0.4); } },
    sstar: { box: () => [-0.4, -0.4, 0.4, 0.4], paint(K, S) { halo(S.c, 0, 0, 0.4, GOLD, 0.5); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * TAU; K.tube(S, [[0, 0], [Math.cos(a) * 0.3, Math.sin(a) * 0.3]], 0.11, 0.012, (t, s2) => { const M = K.M; M.r = 1; M.g = 0.92; M.b = 0.6; M.cc = 1; M.rg = 0.15; M.er = 0.75 * (1 - t * 0.6); M.eg = 0.6 * (1 - t * 0.6); M.eb = 0.18; }); } S.unlock(); K.ball(S, 0, 0, 0.1, 0.1, () => { const M = K.M; M.r = 1; M.g = 1; M.b = 0.9; M.er = 1; M.eg = 0.95; M.eb = 0.7; }); S.unlock(); K.ink(S, [60, 40, 20], 0.35); } },
    sshard: { box: () => [-0.35, -0.42, 0.35, 0.42], paint(K, S) { const c = S.c, faces = [[[0, -0.36], [0.2, -0.02], [0, 0.36]], [[0, -0.36], [-0.2, -0.02], [0, 0.36]]]; faces.forEach((f, i) => { c.beginPath(); f.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); const g = c.createLinearGradient(-0.2, -0.36, 0.2, 0.36); g.addColorStop(0, i ? '#3A2047' : '#5A3570'); g.addColorStop(1, i ? '#140A1C' : '#2A1638'); c.fillStyle = g; c.fill(); });
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(185,139,224,.85)'; c.lineWidth = 0.025; c.beginPath(); c.moveTo(0, -0.36); c.lineTo(0, 0.36); c.stroke(); c.strokeStyle = 'rgba(185,139,224,.4)'; c.beginPath(); c.moveTo(0, -0.36); c.lineTo(0.2, -0.02); c.lineTo(0, 0.36); c.lineTo(-0.2, -0.02); c.closePath(); c.stroke(); c.restore(); K.glint(c, 0.05, -0.2, 0.1, 0.5); K.ink(S, [10, 4, 16], 0.6); } },
    /* the Seedshot Gallery: a seed pod (v 0 plain, 1 tough bud, 2 gold, 3 the bud cracked), a hedge bush on a hedge tile */
    pod: { box: () => [-0.5, -0.65, 0.5, 0.45], paint(K, S, v) { const col = [[0.72, 0.55, 0.88], [0.29, 0.55, 0.48], [1.0, 0.82, 0.42], [0.29, 0.55, 0.48]][v], r = v === 1 || v === 3 ? 0.34 : 0.3; if (v === 2) halo(S.c, 0, 0, 0.6, GOLD, 0.4);
      K.tube(S, ptsQ(0, -r * 1.05, r * 0.3, -r * 1.5, r * 0.5, -r * 1.35, 6), 0.025, 0.018, (t, s2) => vineM(K, t, s2, 13, 1)); ribbon(K, S, [[r * 0.45, -r * 1.35], [r * 0.6, -r * 1.42], [r * 0.85, -r * 1.36]], t => 0.05 * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.02)), (t, s2) => leafM(K, t, s2, 13, PAL.fern2, 0)); S.unlock();
      K.ball(S, 0, 0, r, r * 1.15, (dx, dy) => { const M = K.M, e = Math.hypot(dx, dy), rib = Math.abs(Math.sin(Math.atan2(dy, dx * 1.5) * 3)); M.r = col[0]; M.g = col[1]; M.b = col[2]; M.rg = v === 2 ? 0.18 : 0.38; M.cc = 0.8; M.mt = v === 2 ? 0.6 : 0; M.fr = col[0]; M.fg = col[1] * 0.9; M.fb = col[2] * 0.6;
        if ((v === 1 || v === 3) && Math.abs(Math.sin(dx * 4.2)) < 0.12) M.ao *= 0.6; if (v === 0 && rib < 0.1) M.ao *= 0.8; const sp = K.vn(dx * 7 + v, dy * 7); if (sp > 0.82 && v !== 2) { M.r += 0.1; M.g += 0.1; M.b += 0.1; } if (v === 2) { M.er = 0.25 * (1 - e); M.eg = 0.2 * (1 - e); M.eb = 0.05; } }); S.unlock();
      if (v === 3) { const c = S.c; c.save(); c.strokeStyle = '#F4FFE8'; c.lineWidth = 0.035; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-r * 0.35, -r * 0.3); c.lineTo(-r * 0.02, r * 0.1); c.lineTo(r * 0.28, -r * 0.42); c.lineTo(r * 0.35, -r * 0.1); c.stroke(); c.strokeStyle = 'rgba(20,40,30,.7)'; c.lineWidth = 0.015; c.stroke(); c.restore(); }
      K.glint(S.c, -r * 0.35, -r * 0.5, r * 0.5, 0.75); K.ink(S, INK, 0.5); } },
    ghedge: { box: () => [-0.7, -1.05, 0.7, 0.3], paint(K, S, v) { contact(K, S, 0.55, 0.16, 0.55); for (const [x, y, r] of [[-0.24, -0.32, 0.3], [0.25, -0.34, 0.3], [0.02, -0.55, 0.32]]) lump(K, S, x + (v - 0.5) * 0.06, y, r, r * 0.86, { amp: 0.14, fr: 2.3, sd: 61 + v * 3 + x * 5, bump: 0.9, leaf: 11, cells: true, mat: (dx, dy, ao, e, nz, wx, wy) => leafM(K, wx, wy, 61 + v, [0.22, 0.4, 0.24], 0.15) }); S.unlock();
      for (let i = 0; i < 4; i++) { const x = -0.36 + i * 0.24, l = 0.22 + hh(i, v, 9) * 0.08; K.tube(S, [[x, -0.55], [x + 0.03, -0.55 - l]], 0.035, 0.004, (t) => thornM(K, t, 0)); } S.unlock(); K.ink(S, INK, 0.5); } },
  });

  /* ======================= the vine bridge ======================= */
  // a braid of four vines and two edge vines, 2 tiles long (the braid's period), painted once; the dark mat of stems under it
  function paintBridgeTex(K, P) { const S = K.surface(0, 0, 2, 1, P), c = S.c; c.fillStyle = '#10281B'; c.fillRect(0, 0, 2, 1); for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse((i * 0.23 + 0.1) % 2, 0.2 + hh(i, 0, 5) * 0.6, 0.16, 0.05, 0, 0, TAU); c.fill(); }
    const braid = i => s => 0.5 + 0.27 * Math.sin(s * Math.PI + i * Math.PI / 2), dep = i => s => Math.cos(s * Math.PI + i * Math.PI / 2);
    const segs = []; for (let i = 0; i < 4; i++) for (let k = -2; k < 18; k++) { const s0 = k * 0.125, s1 = s0 + 0.16, f = braid(i); segs.push([dep(i)(s0 + 0.06), i, [[s0, f(s0)], [(s0 + s1) / 2, f((s0 + s1) / 2)], [s1, f(s1)]]]); }
    segs.sort((a, b) => a[0] - b[0]); for (const [d, i, pts] of segs) { K.tube(S, pts, 0.095, 0.095, (t, s) => { vineM(K, pts[0][0] + t * 0.16, s, i * 1.7, 0.75 + 0.3 * (d * 0.5 + 0.5)); K.M.ao *= 0.6 + 0.4 * (d * 0.5 + 0.5); }); } S.unlock();
    for (const [y0, ph] of [[0.1, 0], [0.9, 1]]) { const pts = []; for (let k = -2; k <= 18; k++) { const s = k * 0.125; pts.push([s, y0 + 0.03 * Math.sin(s * Math.PI + ph)]); } K.tube(S, pts, 0.075, 0.075, (t, s) => vineM(K, -0.25 + t * 2.5, s, 3 + ph, 0.85)); } S.unlock();
    // pale tendrils binding the braid, leaves, a rose bud (kept off the seams)
    for (const u of [0.45, 1.35]) K.tube(S, [[u - 0.08, 0.1], [u + 0.12, 0.35], [u - 0.1, 0.65], [u + 0.06, 0.9]], 0.022, 0.018, (t, s) => { vineM(K, t * 5, s, 7, 1.35); K.M.r += 0.12; K.M.g += 0.1; }); S.unlock();
    for (const [x, y, a] of [[0.25, 0.32, 0.5], [0.8, 0.7, 2.2], [1.15, 0.28, 4.1], [1.7, 0.62, 1.2]]) ribbon(K, S, [[x, y], [x + Math.cos(a) * 0.18, y + Math.sin(a) * 0.1]], t => 0.055 * Math.sin(Math.PI * Math.min(1, t * 1.05 + 0.03)), (t, s) => leafM(K, x * 7 + t, s, 13, PAL.fern2, 0), { face: [0, 0.4, 0.92] }); S.unlock();
    K.ball(S, 1.02, 0.52, 0.06, 0.055, () => { const M = K.M; M.r = 0.88; M.g = 0.4; M.b = 0.6; M.cc = 0.9; M.rg = 0.2; M.er = 0.14; M.eb = 0.08; }); S.unlock();
    const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1; return cv; }
  function paintUnderTex(K, P) { const S = K.surface(0, 0, 2, 1.1, P), c = S.c; c.fillStyle = '#0B1E14'; c.beginPath(); c.moveTo(0, 0); c.lineTo(2, 0); for (let i = 16; i >= 0; i--) c.lineTo(i / 8, 0.14 + 0.06 * Math.sin(i * 1.9) * Math.sin(i * 0.7 + 1)); c.closePath(); c.fill();
    for (let k = 0; k < 5; k++) { const u = 0.2 + k * 0.4 + hh(k, 1, 3) * 0.1, L = 0.35 + hh(k, 2, 3) * 0.5, sw = (hh(k, 3, 3) - 0.5) * 0.3; K.tube(S, ptsQ(u, 0.08, u + sw, 0.08 + L * 0.6, u + sw * 0.4, 0.08 + L, 8), 0.028, 0.012, (t, s) => { vineM(K, t * 4, s, k, 0.9); K.M.ao *= 0.9 - t * 0.3; }); } S.unlock();
    for (let k = 0; k < 3; k++) { const u = 0.35 + k * 0.6, y = 0.35 + hh(k, 5, 3) * 0.3; ribbon(K, S, [[u, y], [u + 0.12, y + 0.06]], t => 0.04 * Math.sin(Math.PI * t) + 0.004, (t, s) => leafM(K, u * 5 + t, s, 17, PAL.fern, 0)); } S.unlock();
    const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1; return cv; }
  TDEF.bridge = { custom: paintBridgeTex }; TDEF.bunder = { custom: paintUnderTex };
  function landBridge(c, x, y, X, Y, T, isGap, tt, lw, B) { const t = tex('bridge', Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return OLDB.bridgeFn ? OLDB.bridgeFn.apply(null, arguments) : undefined;
    const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y);
    const run = (dx, dy) => { let n = 0; for (const s of [-1, 1]) for (let k = 1; k <= 6 && tt(x + dx * k * s, y + dy * k * s) === T_BRIDGE; k++) n++; return n; };
    const horiz = gNS && !gWE ? true : gWE && !gNS ? false : run(1, 0) >= run(0, 1);
    const W = horiz ? x : y, sideA = horiz ? isGap(x, y - 1) : isGap(x - 1, y), sideB = horiz ? isGap(x, y + 1) : isGap(x + 1, y);
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0);
    c.drawImage(t.cv, md(W, 2) * P, 0, P, P, 0, 0, T + 0.02, T + 0.02);
    // thorns jutting out over the drop (their picture, turned)
    for (const [on, y0, dir] of [[sideA, 0.1, -1], [sideB, 0.9, 1]]) if (on) for (let k = 0; k < 3; k++) { const u = (k + 0.2 + hh(x, y, 100 + k + (dir > 0 ? 10 : 0)) * 0.6) / 3, a = dir * Math.PI / 2 + (hh(x, y, 120 + k) - 0.5) * 0.9, sc = 0.8 + hh(x, y, 130 + k) * 0.5;
      const sp = sprite('thorn', 0, Math.round(P * 1.2), true); if (sp) { const f = T / sp.P * sc; c.save(); c.translate(u * T, y0 * T); c.rotate(a); c.drawImage(sp.cv, -sp.ax * f, -sp.ay * f, sp.cv.width * f, sp.cv.height * f); c.restore(); } }
    c.restore(); }
  function landBridgeEdge(c, x, y, X, Y, T, lw, B) { const t = tex('bunder', Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return OLDB.bridgeEdge ? OLDB.bridgeEdge.apply(null, arguments) : undefined;
    c.drawImage(t.cv, md(x, 2) * P, 0, P, t.cv.height, X, Y - T * 0.02, T + 0.02, t.cv.height * T / P); }

  /* ======================= the void under the garden: the gap's far view ======================= */
  // a moon (P px a moon radius): a pale disc, seas and rayed craters, its limb darker, tinted cream, rose or jade
  const MOONCOL = [[1.0, 0.94, 0.8], [1.0, 0.76, 0.86], [0.76, 0.96, 0.88]];
  function paintMoon(K, S, v) { const { vn, fbm } = K, P = S.P, col = MOONCOL[v % 3], d = S.d || (S.lock(), S.d);
    for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, r = Math.hypot(x, y); if (r > 1.0 + 1.5 / P) continue;
      const z = Math.sqrt(Math.max(0, 1 - r * r)), u = x / (z + 0.35) + v * 3, w = y / (z + 0.35), mar = ss(0.48, 0.66, fbm(u * 1.4 + 3.1, w * 1.4 + 1.7)), cr = vn(u * 7 + 2, w * 7 + 9), cr2 = vn(u * 19, w * 19 + 4);
      let L = 0.95 - 0.24 * mar - (cr > 0.8 ? (cr - 0.8) * 0.8 : 0) - (cr2 > 0.86 ? (cr2 - 0.86) * 0.6 : 0) + 0.06 * (fbm(u * 6, w * 6) - 0.5); L *= 0.55 + 0.45 * Math.pow(z, 0.55) + 0.12 * Math.max(0, -x - y) * z;
      const i = (py * S.w + px) * 4; d[i] = clamp(L * col[0] * 255, 0, 255); d[i + 1] = clamp(L * col[1] * 255, 0, 255); d[i + 2] = clamp(L * col[2] * 255, 0, 255); d[i + 3] = clamp((1 - r) * P + 0.5, 0, 1) * 255; }
    S.unlock(); }
  DEF.moon = { box: () => [-1.02, -1.02, 1.02, 1.02], paint: paintMoon };
  /* a far floating isle (P px a tile): a clod of plum earth, roots trailing from it, a tree of eggs on top */
  DEF.isle = { box: () => [-1.6, -2.4, 1.6, 1.4], paint(K, S, v) { const sd = 31 + v * 5, R = K.R1(sd);
    lump(K, S, 0, 0.0, 1.4, 0.55, { amp: 0.1, fr: 1.5, sd, bump: 0.4, leaf: 3, mat: (dx, dy, ao, e, nz, wx, wy) => { if (dy < -0.35) { mossM(K, wx * 2, wy * 2, sd); } else { const t = 0.6 + 0.4 * K.vn(wx * 4, wy * 4); K.M.r = 0.22 * t; K.M.g = 0.12 * t; K.M.b = 0.24 * t; K.M.rg = 0.9; K.M.ao *= 0.5 + 0.5 * (1 - (dy + 1) / 2); } } });
    S.unlock(); for (let i = 0; i < 6; i++) { const x = (R() - 0.5) * 2, L = 0.4 + R() * 0.7; K.tube(S, ptsQ(x, 0.3, x + (R() - 0.5) * 0.3, 0.3 + L * 0.6, x + (R() - 0.5) * 0.2, 0.3 + L, 6), 0.05, 0.015, (t, s) => bark(K, s, t * 2, 1, sd + i, 0)); }
    S.unlock(); trunk(K, S, ptsQ(0.1, -0.4, 0.15, -0.9, 0.05, -1.3, 6), 0.1, 0.06, sd, 0); crown(K, S, [[0.05, -1.6, 0.5], [-0.35, -1.4, 0.35], [0.45, -1.42, 0.35]], PAL.jade, sd, 0.3);
    for (const [x, y] of [[-0.3, -1.15], [0.35, -1.2], [0.05, -1.25]]) { halo(S.c, x, y, 0.25, GOLD, 0.45); K.ball(S, x, y, 0.06, 0.08, (dx, dy) => eggM(K, dx, dy, 1, x)); } S.unlock(); } };
  /* the void's tile: deep plum, nebula wisps, stars of three colours (128 px, wrapping) */
  window.GAP_EXT = window.GAP_EXT || {};
  const VOIDB = '#0A0512';
  GAP_EXT.gardenvoid = { base: VOIDB,
    paint(c, S, R) { c.fillStyle = VOIDB; c.fillRect(0, 0, S, S); const wrap = f => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) f(ox, oy); };
      for (let i = 0; i < 10; i++) { const x = R() * S, y = R() * S, w = 20 + R() * 50, col = ['44,18,64', '30,44,60', '64,20,48'][i % 3]; wrap((ox, oy) => { const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, w); g.addColorStop(0, `rgba(${col},.5)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x + ox - w, y + oy - w, w * 2, w * 2); }); }
      for (let i = 0; i < 60; i++) { const x = R() * S, y = R() * S, s = R() < 0.12 ? 1.3 : 0.7, a = 0.3 + R() * 0.6, k = R(); c.fillStyle = k > 0.85 ? `rgba(255,211,107,${a})` : k > 0.7 ? `rgba(247,184,216,${a})` : k > 0.6 ? `rgba(160,240,210,${a})` : `rgba(255,255,255,${a})`; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); } },
    back(c, o) { const { pat, pattern, k, P: Pn, W, H, t, wx, wy, bigGlow } = o;
      c.fillStyle = VOIDB; c.fillRect(0, 0, W, H); pat(pattern('gardenvoid', k), 0.22, 0, 0);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22; bigGlow(c, Pn, '#5A2A7A', W * 0.05 - ((wx * 0.04) % (W * 0.6)), H * 0.15 - ((wy * 0.04) % (H * 0.4)), W * 0.9); c.globalAlpha = 0.14; bigGlow(c, Pn, '#2A6A60', W * 0.45 - ((wx * 0.05) % (W * 0.6)), H * 0.5 - ((wy * 0.05) % (H * 0.4)), W * 0.8); c.restore();
      vista(c, W, H, wx, wy, t); } };
  // the three unmoving moons (fixed in the sky: no parallax) and far isles drifting below the garden (slow parallax)
  function vista(c, W, H, wx, wy, t, o) { o = o || {}; const T = Math.max(24, Math.min(W, H) / 10), lf = lowFx();
    const ISL = [[0.15, 0.3, 0.55, 0], [0.75, 0.62, 0.45, 1], [0.42, 0.9, 0.35, 2]];
    for (const [fx, fy, sc, v] of ISL) { const par = 0.18 + sc * 0.25, span = W * 1.6, spanY = H * 1.6, x = md(fx * span - wx * par * 0.02 * T / 24 + t * (2 + v), span) - W * 0.3, y = md(fy * spanY - wy * par * 0.02 * T / 24, spanY) - H * 0.3;
      if (!draw(c, 'isle', v % 2, x, y, T * sc * 1.4, { alpha: 0.55 + sc * 0.5, exact: true })) break; }
    const MOONS = o.moons || [[0.2, 0.13, 1.25, 0], [0.62, 0.07, 0.72, 1], [0.86, 0.19, 0.95, 2]];
    for (const [fx, fy, r, v] of MOONS) { const mx = W * fx, my = H * fy, R = T * r, col = ['#F2D8A1', '#F7B8D8', '#A8E8D0'][v];
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = lf ? 0.25 : 0.32; blitSized(c, glowSprite(col), mx - R * 3.2, my - R * 3.2, R * 6.4, R * 6.4); c.restore();
      if (!draw(c, 'moon', v, mx, my, R, { exact: true })) { c.fillStyle = col; c.beginPath(); c.arc(mx, my, R, 0, TAU); c.fill(); } } }

  /* ======================= the engine's props, repainted through its prop cache ======================= */
  const OLD = {}, OLDB = {};
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS, EXT = (HAS_W && (window.PROP_EXT = window.PROP_EXT || {})) || {};
    for (const k of KINDS) { if (!PR[k] || PR[k].__gpp) continue; const old = OLD[k] = PR[k];
      const f = function (c, P, v) { if (off()) return old.apply(this, arguments); const vv = (v | 0) % 4, s = sprite(k, vv % 2, Math.max(8, Math.min(CAP, Math.round(P))), true); if (!s) return old.apply(this, arguments);
        const q = P / s.P; c.save(); if (vv >= 2) c.scale(-1, 1); c.drawImage(s.cv, -s.ax * q, -s.ay * q, s.cv.width * q, s.cv.height * q); c.restore(); };
      f.__gpp = 1; PR[k] = f;
      let b = [0, 0, 0, 0]; for (let v = 0; v < 2; v++) { const q = DEF[k].box(v); b = [Math.min(b[0], q[0]), Math.min(b[1], q[1]), Math.max(b[2], q[2]), Math.max(b[3], q[3])]; }
      const E = EXT[k] || [2.4, 2.9]; EXT[k] = [Math.max(E[0], Math.max(-b[0], b[2]) * 2 - 1.6 + 0.1), Math.max(E[1], -b[1] - 0.25 + 0.1)]; }
    if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) for (const k of KINDS) BREAK_FX.KIND[k] = Object.assign({}, DEF[k].mat);
    if (typeof PROP_EL !== 'undefined') for (const k of KINDS) PROP_EL[k] = DEF[k].el || 'leaf';
    // the land
    const B = typeof BIOMES !== 'undefined' && BIOMES.garden; if (B && !B.__gpp) { B.__gpp = 1; for (const n of ['floorFn', 'wallFn', 'cliffTint', 'bridgeFn', 'bridgeEdge', 'gap', 'top', 'face', 'faceD']) OLDB[n] = B[n];
      Object.assign(B, { floorFn: (...a) => off() ? (OLDB.floorFn ? OLDB.floorFn(...a) : undefined) : landFloor(...a), wallFn: (...a) => off() ? (OLDB.wallFn ? OLDB.wallFn(...a) : undefined) : landWall(...a), roofFn: (...a) => off() ? undefined : landRoof(...a),
        cliffTint: (...a) => off() ? (OLDB.cliffTint ? OLDB.cliffTint(...a) : undefined) : landCliff(...a), bridgeFn: (...a) => off() ? OLDB.bridgeFn(...a) : landBridge(...a), bridgeEdge: (...a) => off() ? OLDB.bridgeEdge(...a) : landBridgeEdge(...a),
        gap: 'gardenvoid', top: '#2C4A3E', face: '#2A1834', faceD: '#140A1A' }); }
    if (HAS_W && window.DECAL_EXT) { for (const k of Object.keys(DEC)) { const o = DECAL_EXT[k]; if (!o || o.__gpp) continue; OLD['decal:' + k] = o; const f = function (c, d, s, lw, T) { if (!T || !decal(c, k, d, s, T)) return o.apply(this, arguments); }; f.__gpp = 1; DECAL_EXT[k] = f; } }
  }
  install();

  /* ======================= release, warm-up, budgets ======================= */
  // everything let go (the stage closed: DunWorld.dropProps, chained below): the pictures' and textures' memory given back at once
  function release(keepTex) { if (!keepTex && typeof BURSTS !== 'undefined') BURSTS.length = 0; CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); if (!keepTex) { TEX.forEach(t => { if (t && t.cv) t.cv.width = t.cv.height = 1; }); TEX.clear(); BASE = 0; } }
  // the trees' and plants' own copies let go once a stage is playing (the engine keeps its pictures of them in its prop cache;
  // should it want one again it is painted again): a phone keeps one copy of each, not two
  function trimKinds() { for (const [k, s2] of CACHE) { const n = k.split('|')[0]; if (DEF[n] && KINDS.includes(n)) { if (s2 && s2.cv) s2.cv.width = s2.cv.height = 1; CACHE.delete(k); STATS.released++; } } }
  function hookRelease() { try { if (typeof DunWorld === 'undefined' || !DunWorld.dropProps || DunWorld.dropProps.__gpp) return; const od = DunWorld.dropProps; const f = function () { try { od.apply(this, arguments); } finally { release(); } }; f.__gpp = 1; DunWorld.dropProps = f; } catch (e) {} }
  hookRelease();
  // the loading screen's jobs: the land's textures at the floor's sharpness, the undergrowth, the bridge, the moons and isles
  function warm(P) { if (!BP() || !P || !(P.T > 0)) return []; const k = P.k || 1, PB = Math.min(CAP, Math.round(P.T * k)); BASE = PB; const S2 = P.S || {}, jobs = [], job = f => jobs.push(() => { try { f(); } catch (e) {} });
    const boss = S2.kind === 'boss';
    if (!boss) { for (const n of ['floor', 'bank', 'roof', 'cliff', 'bridge', 'bunder']) for (const j of texJobs(n, PB)) jobs.push(j); for (const d of ['dtuft', 'dflower', 'dfern', 'droot', 'dmoss']) for (let v = 0; v < 4; v++) job(() => sprite(d, v, Math.round(PB * 1.25), true)); job(() => sprite('thorn', 0, Math.round(PB * 1.2), true)); }
    const VT = Math.max(24, Math.min(HAS_W ? window.innerWidth || 390 : 390, HAS_W ? window.innerHeight || 844 : 844) / 10), dk = Math.min(2, k);
    job(() => { [1.25, 0.72, 0.95].forEach((r, v) => sprite('moon', v, qP(VT * r * dk), true)); }); job(() => { sprite('isle', 0, qP(VT * 0.55 * 1.4 * dk), true); sprite('isle', 1, qP(VT * 0.45 * 1.4 * dk), true); sprite('isle', 0, qP(VT * 0.35 * 1.4 * dk), true); });
    if (EXTRA_WARM.length) for (const f of EXTRA_WARM) { let more = null; try { more = f(P, PB); } catch (e) {} if (Array.isArray(more)) for (const j of more) job(j); }
    return jobs; }
  const EXTRA_WARM = [   // (the puzzles' and arenas' own pictures, by the stage being loaded)
    (P, PB) => { const S2 = P.S || {}, n = S2.name || '', jobs = [], sp = (nm, v, Pq) => jobs.push(() => sprite(nm, v, Pq || PB, true)), k = P.k || 1;
      if (/Seedling March/.test(n)) { for (const j of texJobs('mlane', qP(PB * 0.78))) jobs.push(j); sp('colossus', 0, qP(PB * 0.78 * 1.95)); sp('colossus', 1, qP(PB * 0.78 * 1.95)); sp('mpost', 0); sp('mblock', 0); sp('mboulder', 0); sp('mhedge', 0); sp('mhedge', 1); sp('mbloom', 0); sp('mbloom', 1); }
      else if (/Falling Nursery/.test(n)) { sp('sbud', 0); for (let v = 0; v < 4; v++) sp('sbloom', v); sp('sstar', 0); sp('sshard', 0); }
      else if (/Seedshot Gallery/.test(n)) { for (let v = 0; v < 4; v++) sp('pod', v); sp('ghedge', 0); sp('ghedge', 1); }
      if (S2.kind === 'boss') { const PA = Math.min(64, qP(PB)); for (const j of texJobs('floor', PA)) jobs.push(j); for (const d of ['dtuft', 'dflower', 'dfern', 'droot', 'dmoss']) for (let v = 0; v < 4; v++) sp(d, v, Math.round(PA * 1.25)); for (const kk of KINDS) { sp(kk, 0); sp(kk, 1); } }
      void k; return jobs; } ];

  /* ======================= breaking them (the user, v423: every prop breakable, with its own destruction) =======================
     Every tree and plant of the garden is a prop on what was a room's floor (20a / 20p2's thicket keep each room joined), so a
     break only gives back floor inside its room: no route past a puzzle, a gate or a door can open (the puzzles, mini-games and
     boss arenas hold no props at all; the Gallery's hedge is solid ground, not a prop). The engine breaks them (20l: shots,
     areas, strong attacks, Ultimates, vehicles): the tile turns to floor and BREAK_FX shatters the painted picture in its
     material (BREAK_FX.KIND, set in install). Here: the hit points (big trees take more), and each kind's own debris laid on
     top (eggshell and the eggs' gold light, rose bulb glass, spore puffs, star sparks, leaves and petals, moss and grit) with a
     feathered GPU burst of its light (a flash, a soft ring, a drift of dust) drawn by the stage's light pass; lowFx: fewer
     pieces, no ring. Every burst ends within 1.6 s; nothing is kept. */
  const HPK = { eggtree: 4, weepwillow: 4, thornpine: 4, bulbtree: 3, giantfern: 2, glowcaps: 2, starlily: 2, thornbush: 2, mossrock: 3 };
  const DEBRIS = { eggtree: { col: GOLD, n: [['shard', '#FFF1D0', 8], ['leaf', '#3A7A62', 10], ['star', GOLD, 6]] }, weepwillow: { col: GOLD, n: [['leaf', '#5FB072', 16], ['star', '#FFF1B8', 6]] },
    thornpine: { col: ROSE, n: [['leaf', '#28604A', 12], ['spark', ROSE, 8], ['shard', '#E4F5B8', 5]] }, bulbtree: { col: '#F7A8CF', n: [['shard', '#F7A8CF', 10], ['spark', '#FFD6EA', 10], ['leaf', '#3E8A5E', 5]] },
    giantfern: { col: MINT, n: [['leaf', '#47A262', 14]] }, glowcaps: { col: '#B9FFF4', n: [['spore', '#B9FFF4', 14], ['smoke', 'rgba(185,255,244,', 4], ['petal', '#E2D4FF', 5]] },
    starlily: { col: GOLD, n: [['star', '#FFE9A8', 12], ['petal', '#FFF1C8', 10], ['leaf', '#3E8A55', 5]] }, thornbush: { col: ROSE, n: [['leaf', '#2F7A4A', 10], ['petal', '#E07BA8', 6], ['shard', '#CFE8A0', 4]] },
    mossrock: { col: MINT, n: [['rock', '#7E7294', 8], ['smoke', 'rgba(110,98,128,', 4], ['leaf', '#3E8A55', 6]] } };
  const BURSTS = [];
  function gardenBreak(X, p) { const D = DEBRIS[p.kind]; if (!D || !X || !X.part) return; const lf = lowFx(), k = lf ? 0.5 : 1, R = Math.random, h = Math.max(0.6, -(DEF[p.kind].box(0)[1]) * 0.55);
    for (const [kind, col, n] of D.n) for (let i = 0; i < Math.round(n * k); i++) { const a = R() * TAU, v = 1.5 + R() * 3.5, x = p.x + (R() - 0.5) * 0.8, y = p.y - 0.2 - R() * h;
      if (kind === 'smoke') X.part({ kind: 'smoke', x, y: p.y - 0.3, vx: (R() - 0.5) * 0.6, vy: -0.4 - R() * 0.4, life: 1.1, max: 1.1, size: 0.5 + R() * 0.3, color: col });
      else if (kind === 'leaf' || kind === 'petal') X.part({ kind: 'petal', x, y, vx: Math.cos(a) * v * 0.6, vy: -1.5 - R() * 2, g: 2.2, life: 1.3 + R() * 0.5, max: 1.8, size: 3 + R() * 3, rot: R() * 6, vr: (R() - 0.5) * 8, color: col });
      else if (kind === 'spore') X.part({ kind: 'glow', x, y, vx: Math.cos(a) * v * 0.3, vy: -0.6 - R() * 0.8, drag: 1, life: 1.2, max: 1.2, size: 0.1 + R() * 0.08, color: col });
      else X.part({ kind: kind === 'rock' ? 'shard' : kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, g: kind === 'star' || kind === 'spark' ? 3 : 9, life: 0.7 + R() * 0.4, max: 1.1, size: 3 + R() * 3, rot: R() * 6, vr: (R() - 0.5) * 12, color: col }); }
    if (BURSTS.length < 24) BURSTS.push({ x: p.x, y: p.y, h, col: D.col, kind: p.kind, t: 0, life: 1.6, X });
    for (const [dx, dy, r, col] of glowsOf(p.kind, p.v | 0)) if (BURSTS.length < 32) BURSTS.push({ x: p.x + dx, y: p.y + dy, h: 0, col, kind: 'spark', t: 0, life: 0.9, r, X }); }
  function burstsTick(dt) { for (let i = BURSTS.length - 1; i >= 0; i--) { BURSTS[i].t += dt; if (BURSTS[i].t >= BURSTS[i].life) BURSTS.splice(i, 1); } }
  function burstsDraw(G, X) { if (!BURSTS.length) return; const T = X.Tz(), lf = lowFx();
    for (const b of BURSTS) { if (b.X !== X) continue; const u = b.t / b.life, Xs = X.sx(b.x), Ys = X.sy(b.y), f = Math.pow(1 - u, 1.6);
      if (b.kind === 'spark') { G.Q.glow(Xs, Ys, T * b.r * (1.4 + u * 2.4), b.col, 0.55 * f); G.Q.glow(Xs, Ys, T * b.r * 0.5, '#FFFFFF', 0.6 * f); continue; }
      G.Q.glow(Xs, Ys - T * b.h * 0.6, T * (1.2 + b.h * 0.9) * (0.6 + u * 0.8), b.col, 0.42 * f);   // (the flash of its light, swelling and fading)
      G.Q.glow(Xs, Ys, T * (1.6 + u * 1.6), '#B9A6D8', 0.16 * f, 0.4);   // (the dust thrown up round its foot, lying low)
      if (!lf) G.Q.ring(Xs, Ys, T * (0.5 + u * 2.2), b.col, 0.3 * f, T * 0.35 * (1 - u * 0.5), 0.45); } }
  function hookBreak() { try { if (typeof BREAK_FX === 'undefined' || !BREAK_FX.prop || BREAK_FX.prop.__gpp) return; const op = BREAK_FX.prop; const f = function (Xa, p, o) { const r = op.apply(this, arguments); try { if (p && DEBRIS[p.kind] && !off()) gardenBreak(Xa, p); } catch (e) {} return r; }; f.__gpp = 1; BREAK_FX.prop = f; } catch (e) {} }
  hookBreak();
  // (the hit points, once a stage's props are known: a prop not yet struck)
  const toughen = props => { for (const p of props || []) if (HPK[p.kind] && !p.gpHp && !p.broken) { p.gpHp = 1; p.hp = Math.max(p.hp || 0, HPK[p.kind]); } };

  /* ======================= the light over every stage (GPU) ======================= */
  const gpu = c => { try { if (HAS_W && (window.__GG_GL === 0 || window.__DUN_GL === 0)) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; if (!F || !F.usable()) return null; return { F, Q: F.begin(c, null) }; } catch (e) { return null; } };
  const gpuEnd = (c, G) => { if (G) try { G.F.flush(c); } catch (e) {} };
  function lights(X, self) { const S = self.S || {}, fiend = !!(X.F && X.F.fiend); let glows = null, t = 0; const motes = [], LF = lowFx;
    const collect = () => { glows = []; for (const p of (X.props || []).concat(fiend && AR.trees && AR.X === X ? AR.trees : [])) { const gs = glowsOf(p.kind, p.v | 0); for (const [dx, dy, r, col, kind] of gs) glows.push({ p, dx, dy, r, col, kind, ph: hh(p.k || Math.round(p.x * 7 + p.y * 13), 1, 3) * TAU }); } };
    return {
      update(dt) { t += dt; burstsTick(dt); if (!glows) { collect(); toughen(X.props); if (!fiend) trimKinds(); } const me = X.me, want = LF() ? 8 : 26;
        if (motes.length < want && Math.random() < dt * 8) { const W = X.W() / X.Tz(), Hh = X.H() / X.Tz(); motes.push({ x: me.x + (Math.random() - 0.5) * W * 1.1, y: me.y + (Math.random() - 0.35) * Hh * 0.8, vx: (Math.random() - 0.5) * 0.25, vy: -(0.15 + Math.random() * 0.3), t: 0, life: 3 + Math.random() * 4, s: 0.6 + Math.random() * 0.9, ph: Math.random() * 6, col: [GOLD, GOLD, '#FFF1C8', MINT, '#F7B8D8'][Math.floor(Math.random() * 5)] }); }
        for (const e of motes) { e.t += dt; e.x += (e.vx + Math.sin(e.t * 1.1 + e.ph) * 0.25) * dt; e.y += e.vy * dt; } for (let i = motes.length - 1; i >= 0; i--) if (motes[i].t > motes[i].life) motes.splice(i, 1); },
      drawGround(c) { if (fiend) arenaDraw(c, X); if (!glows) return; const G = gpu(c); if (!G) return; const T = X.Tz(), W = X.W(), Hh = X.H(), lf = LF();
        // the light the glowing plants spill on the floor round them
        for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y); if (Xs < -T * 4 || Xs > W + T * 4 || Ys < -T * 3 || Ys > Hh + T * 3) continue; if (lf && q.kind !== 'egg' && q.kind !== 'bulb') continue;
          G.Q.glow(Xs, Ys - T * 0.05, q.r * T * 2.4, q.col, 0.14 + 0.04 * Math.sin(t * 1.3 + q.ph), 0.42); }
        // the mist lying low over the moss: soft lilac drifts (world-anchored, sliding slowly)
        if (!lf && !fiend) { for (let i = 0; i < 5; i++) { const cx = X.me.x + Math.sin(t * 0.05 + i * 1.7) * 6 + (i - 2) * 4, cy = X.me.y + Math.cos(t * 0.04 + i * 2.3) * 4 + (i % 2 ? 2 : -2), Xs = X.sx(cx), Ys = X.sy(cy); G.Q.glow(Xs, Ys, T * (5 + i % 3), i % 2 ? '#8E7AB8' : '#6E9A8E', 0.07, 0.38); } }
        gpuEnd(c, G); },
      drawOver(c) { if (!glows) return; const G = gpu(c); if (!G) return; const T = X.Tz(), W = X.W(), Hh = X.H(), lf = LF();
        // the eggs, bulbs, lilies, glowcaps and beads: a breathing glow and a bright core each
        for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y) + q.dy * T; if (Xs < -T * 3 || Xs > W + T * 3 || Ys < -T * 3 || Ys > Hh + T * 3) continue;
          const k = 0.75 + 0.25 * Math.sin(t * (q.kind === 'egg' ? 1.6 : 2.2) + q.ph); if (lf && q.kind !== 'egg' && q.kind !== 'bulb' && q.kind !== 'cap') continue;
          G.Q.glow(Xs, Ys, q.r * T * 1.7, q.col, 0.32 * k); G.Q.glow(Xs, Ys, q.r * T * 0.45, '#FFF8E8', 0.42 * k); }
        burstsDraw(G, X);   // (the breaks' bursts of light)
        // motes: seed lights drifting up through the air
        for (const e of motes) { const a = Math.sin(e.t / e.life * Math.PI), Xs = X.sx(e.x), Ys = X.sy(e.y); if (Xs < -10 || Xs > W + 10 || Ys < -10 || Ys > Hh + 10) continue; G.Q.glow(Xs, Ys, T * 0.16 * e.s, e.col, a * 0.55); G.Q.glow(Xs, Ys, T * 0.04 * e.s, '#FFFFFF', a * 0.8); }
        // the moons' light falling through the canopy: slow shafts from the upper left
        if (!lf) for (let i = 0; i < 3; i++) { const x = W * (0.12 + i * 0.36) + Math.sin(t * 0.13 + i * 2) * T * 0.8; G.Q.shafts(x, -T * 1.5, x + W * 0.2, Hh * 0.85, T * (1.4 + i * 0.3), i === 1 ? '#F7D0E6' : '#FFF0D0', fiend ? 0.07 : 0.11, i * 1.9 + 0.5); }
        gpuEnd(c, G); },
      refresh() { glows = null; } }; }
  function hookRift() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.garden; if (!Rf || Rf.__gpp) return; Rf.__gpp = 1;
    const oe = Rf.everyStage; Rf.everyStage = function (X, self, H) { let a = {}; try { a = oe ? oe.apply(this, arguments) || {} : {}; } catch (e) { a = {}; } if (off()) return a; let L = null; try { L = lights(X, self, H); if (X.F && X.F.fiend) dressArena(X, self); } catch (e) { L = null; } if (!L) return a;
      return Object.assign({}, a, { update(dt) { if (a.update) a.update(dt); L.update(dt); }, drawGround(c) { L.drawGround(c); if (a.drawGround) a.drawGround(c); }, drawOver(c) { if (a.drawOver) a.drawOver(c); L.drawOver(c); }, gpp: L }); };
    const op = Rf.preload; Rf.preload = function (P) { let a = []; try { a = op ? op.apply(this, arguments) || [] : []; } catch (e) {} let b = []; try { hookArena(); b = warm(P); } catch (e) {} return a.concat(b); }; } catch (e) {} }
  hookRift();

  /* ======================= the boss arenas: through the fiends' shared hooks ======================= */
  /* The three bosses (20x-rift-fiend-garden-1/2/3) paint their arenas with GardenFiend.floor (the ground, then the boss's own
     o.extra) and GardenFiend.sky. Those two are wrapped here at run time (the boss files are not touched): the ground becomes
     the garden's own loam and moss, its roots and undergrowth thickening toward a rim of painted plants, the sky the void's
     three moons and isles under hanging boughs. Beyond the rim (never on the floor the fight uses) a ring of painted trees
     stands in the dark, their eggs and bulbs lit by the GPU. Should the wrap fail, the bosses' own art is drawn. */
  const AR = { trees: null }; let dressArena = null, hookArena = null;
  function arenaFloor(c, A, o) { const R = A.R, rnd = A.rnd, P = kOf(c), t = texNear('floor', Math.min(64, Math.max(12, qP(P))), 0.35); if (!t) return false; o = o || {};
    const pat = c.createPattern(t.cv, 'repeat'); try { pat.setTransform(new DOMMatrix([1 / t.P, 0, 0, 1 / t.P, 0, 0])); } catch (e) { return false; }
    c.save(); c.beginPath(); c.arc(0, 0, R + 1.4, 0, TAU); c.clip(); c.fillStyle = pat; c.fillRect(-R - 1.5, -R - 1.5, R * 2 + 3, R * 2 + 3);
    // the boss's own tint (its mid and edge colours) laid softly over the loam, the floor darkening toward the rim
    const g = c.createRadialGradient(0, 0, R * 0.1, 0, 0, R + 1.4); g.addColorStop(0, rgba(o.mid || '#3A2449', 0.28)); g.addColorStop(0.62, rgba(o.edge || '#2A1634', 0.36)); g.addColorStop(0.9, 'rgba(16,6,22,.7)'); g.addColorStop(1, 'rgba(10,4,14,.95)'); c.fillStyle = g; c.fillRect(-R - 1.5, -R - 1.5, R * 2 + 3, R * 2 + 3);
    [[-R * 0.35, -R * 0.3, '242,216,161'], [R * 0.4, -R * 0.1, '247,184,216'], [0, R * 0.45, '127,227,180']].forEach(([x, y, col]) => { const gg = c.createRadialGradient(x, y, 0, x, y, R * 0.5); gg.addColorStop(0, `rgba(${col},.1)`); gg.addColorStop(1, `rgba(${col},0)`); c.fillStyle = gg; c.fillRect(x - R * 0.5, y - R * 0.5, R, R); });
    // root veins from the rim toward the middle: bark-dark, a lit ridge
    for (let i = 0; i < 12; i++) { const a0 = i / 12 * TAU + rnd() * 0.3; let x = Math.cos(a0) * (R + 0.6), y = Math.sin(a0) * (R + 0.6), a = a0 + Math.PI + (rnd() - 0.5) * 0.4; const pts = [[x, y]]; for (let j = 0; j < 6; j++) { x += Math.cos(a) * (0.9 + rnd() * 0.7); y += Math.sin(a) * (0.9 + rnd() * 0.7); a += (rnd() - 0.5) * 0.9; if (Math.hypot(x, y) < R * 0.42) break; pts.push([x, y]); }
      for (const [col, w, dy] of [['rgba(12,4,16,.6)', 0.42, 0.06], ['#3E2440', 0.28, 0], ['rgba(200,150,190,.22)', 0.08, -0.06]]) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach(([px, py], k) => k ? c.lineTo(px, py + dy) : c.moveTo(px, py + dy)); c.stroke(); } }
    // the undergrowth: thick toward the rim, a few flat flowers and moss on the open floor
    const put = (n, v, x, y, s, rot) => { const sp = sprite(n, v, Math.round(Math.min(64, P) * 1.25), true); if (!sp) return; const f = s / sp.P; c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.drawImage(sp.cv, -sp.ax * f, -sp.ay * f, sp.cv.width * f, sp.cv.height * f); c.restore(); };
    for (let i = 0; i < 70; i++) { const a = rnd() * TAU, d = R * (0.82 + rnd() * 0.2), x = Math.cos(a) * d, y = Math.sin(a) * d, k = rnd(); put(k < 0.4 ? 'dtuft' : k < 0.6 ? 'dfern' : k < 0.8 ? 'dmoss' : 'dflower', Math.floor(rnd() * 4), x, y, 1.1 + rnd() * 0.5, k > 0.6 ? rnd() * 6 : 0); }
    for (let i = 0; i < 26; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R * 0.8, x = Math.cos(a) * d, y = Math.sin(a) * d, k = rnd(); put(k < 0.5 ? 'dflower' : k < 0.8 ? 'dmoss' : 'droot', Math.floor(rnd() * 4), x, y, 0.9 + rnd() * 0.4, rnd() * 6); }
    c.restore();
    if (o.extra) o.extra(c, A);
    // the rim: a lip of moss, then a hedge of painted plants leaning over the dark (the north side fullest)
    c.save(); c.strokeStyle = 'rgba(127,227,180,.22)'; c.lineWidth = 0.16; c.beginPath(); c.arc(0, 0, R + 0.12, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(20,40,32,.8)'; c.lineWidth = 0.3; c.beginPath(); c.arc(0, 0, R + 0.4, 0, TAU); c.stroke(); c.restore();
    const rim = []; for (let i = 0; i < 64; i++) { const a = i / 64 * TAU + (rnd() - 0.5) * 0.06, d = R + 0.55 + rnd() * 0.5; rim.push([Math.cos(a) * d, Math.sin(a) * d, i]); } rim.sort((p, q) => p[1] - q[1]);
    for (const [x, y, i] of rim) { const k = hh(i, 7, 41), south = y > R * 0.55; const n = south ? (k < 0.5 ? 'dfern' : 'dtuft') : k < 0.45 ? 'thornbush' : k < 0.65 ? 'giantfern' : k < 0.8 ? 'starlily' : 'glowcaps'; const sp = sprite(n, i % 2, Math.round(Math.min(64, P) * (n[0] === 'd' ? 1.25 : 1)), true); if (!sp) continue;
      const sc = (n[0] === 'd' ? 1.8 : 0.85 + hh(i, 3, 2) * 0.3) / sp.P; c.save(); c.translate(x, y + 0.3); if (i % 3 === 0) c.scale(-1, 1); c.drawImage(sp.cv, -sp.ax * sc, -sp.ay * sc, sp.cv.width * sc, sp.cv.height * sc); c.restore(); }
    return true; }
  function arenaSky(c, W, H, t, cam, T, o) { o = o || {}; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, o.top || '#120820'); g.addColorStop(0.5, o.mid || '#2A1538'); g.addColorStop(1, o.bot || '#0E0712'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    try { const sp = DunWorld.pattern('gardenvoid', 1); c.save(); c.globalAlpha = 0.85; c.globalCompositeOperation = 'lighter'; sp.setTransform(new DOMMatrix([1, 0, 0, 1, -(cam.x || 0) * T * 0.05, 0])); c.fillStyle = sp; c.fillRect(0, 0, W, H); c.restore(); } catch (e) {}
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22; blitSized(c, glowSprite('#5A2A7A'), -W * 0.2, -H * 0.1, W * 1.1, H * 0.7); c.globalAlpha = 0.12; blitSized(c, glowSprite('#2A6A60'), W * 0.3, H * 0.25, W * 0.9, H * 0.6); c.restore();
    vista(c, W, H, ((cam.x || 0) - 28) * T * 0.4, ((cam.y || 0) - 28) * T * 0.4, t, { moons: [[0.2, 0.13, 1.3, 0], [0.56, 0.08, 0.75, 1], [0.84, 0.17, 0.95, 2]] });
    // boughs hanging in from above, eggs on threads glowing
    const R2 = mulberry32(31); c.save(); c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const x0 = W * (i + 0.5) / 6 + (R2() - 0.5) * 40, L = 60 + R2() * 70, sw = (R2() - 0.5) * 60;
      for (const [col, w] of [['#140818', 9], ['#3A2238', 5]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, -10); c.quadraticCurveTo(x0 + sw * 0.5, L * 0.5, x0 + sw, L); c.stroke(); c.lineWidth = w * 0.45; c.beginPath(); c.moveTo(x0 + sw * 0.6, L * 0.6); c.quadraticCurveTo(x0 + sw * 0.9 + 20, L * 0.8, x0 + sw + 30, L * 0.75); c.stroke(); }
      for (let k = 0; k < 4; k++) { const lx = x0 + sw * (0.2 + k * 0.22) + (R2() - 0.5) * 16, ly = L * (0.2 + k * 0.22); c.fillStyle = k % 2 ? '#2E6A50' : '#24523E'; c.beginPath(); c.ellipse(lx, ly, 9, 5, R2() * 3, 0, TAU); c.fill(); }
      for (let k = 0; k < 3; k++) { const u = 0.4 + k * 0.28, ex = x0 + sw * u + (k - 1) * 10, ey = L * u + 14 + R2() * 8; c.strokeStyle = 'rgba(242,216,161,.5)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(ex, ey - 12); c.lineTo(ex, ey - 4); c.stroke(); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite(GOLD), ex - 16, ey - 13, 32, 32); c.restore(); const eg = c.createRadialGradient(ex - 1.5, ey, 0.5, ex, ey + 3, 7); eg.addColorStop(0, '#FFF6E0'); eg.addColorStop(1, '#C9AB72'); c.fillStyle = eg; c.beginPath(); c.ellipse(ex, ey + 3, 4.5, 6, 0, 0, TAU); c.fill(); } }
    c.restore(); if (o.silhouette) o.silhouette(c, W, H, t, cam, T); return true; }
  hookArena = () => { try { if (typeof GardenFiend === 'undefined' || !GardenFiend || GardenFiend.__gpp) return; const G = GardenFiend, of = G.floor, os = G.sky; if (typeof of !== 'function' || typeof os !== 'function') return; G.__gpp = 1;
    G.floor = function (c, A, o) { if (!off() && BP()) { try { c.save(); const ok = arenaFloor(c, A, o); c.restore(); if (ok) return; } catch (e) { try { c.restore(); } catch (e2) {} } } return of.apply(this, arguments); };
    G.sky = function (c, W, H, t, cam, T, o) { if (!off() && BP()) { try { c.save(); const ok = arenaSky(c, W, H, t, cam, T, o); c.restore(); if (ok) return; } catch (e) { try { c.restore(); } catch (e2) {} } } return os.apply(this, arguments); }; } catch (e) {} };
  if (typeof setTimeout === 'function') setTimeout(() => hookArena(), 0);   // (the boss files load after this one: wrapped once every file has run)
  // the ring of trees beyond the arena's rim (drawn under everything that stands: they are all behind or beside the fight)
  dressArena = (X, self) => { const C = X.M && X.M.FC; if (!C) return; hookArena(); const R = C.R, list = [], rnd = R1(4231 + (X.F.rift ? X.F.rift.stage : 0) * 17), TREES = ['eggtree', 'weepwillow', 'thornpine', 'bulbtree', 'eggtree', 'thornpine'];
    for (let i = 0; i < 26; i++) { const a = -Math.PI * 1.08 + i / 25 * Math.PI * 1.16 + (rnd() - 0.5) * 0.05, d = R + 2.2 + rnd() * 1.6; list.push({ x: C.x + Math.cos(a) * d, y: C.y + Math.sin(a) * d, kind: TREES[Math.floor(rnd() * TREES.length)], v: Math.floor(rnd() * 4), k: 9000 + i }); }
    for (let i = 0; i < 10; i++) { const a = rnd() * Math.PI, d = R + 2.0 + rnd() * 1.2; if (Math.sin(a) < 0.5) list.push({ x: C.x + Math.cos(a) * d, y: C.y + Math.sin(a) * d, kind: ['glowcaps', 'starlily', 'giantfern', 'mossrock'][i % 4], v: i % 4, k: 9100 + i }); }
    list.sort((p, q) => p.y - q.y); AR.trees = list; AR.X = X; };
  function arenaDraw(c, X) { const L = AR.trees; if (!L || AR.X !== X) return; const T = X.Tz(), W = X.W(), Hh = X.H();
    for (const p of L) { const Xs = X.sx(p.x), Ys = X.sy(p.y); if (Xs < -T * 3 || Xs > W + T * 3 || Ys < -T * 1 || Ys > Hh + T * 5) continue; draw(c, p.kind, p.v % 2, Xs, Ys, T, { flip: p.v >= 2 }); } }

  const API = { draw, sprite: (n, v, P) => sprite(n, v, P, true), tex, texJobs, texNear, trimKinds, HPK, DEBRIS, BURSTS, AR, arena: { floor: arenaFloor, sky: arenaSky, hook: () => hookArena() }, has: n => !!DEF[n] && !!BP(), warm, release, glowsOf, install, OLD, OLDB, DEF, TDEF, KINDS, vista, lights, EXTRA_WARM, qP,
    get base() { return BASE; }, set base(v) { if (v > 2) BASE = Math.round(v); }, get stats() { return Object.assign({ cached: CACHE.size, textures: TEX.size, texKeys: [...TEX.keys()], px: [...CACHE.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) + [...TEX.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) }, STATS); },
    _k: { lump, ribbon, halo, leafM, bark, stoneM, mossM, thornM, vineM, glassM, eggM, petalM, crown, trunk, frond, egg, contact, ptsQ, lit, PAL, INK, pvn, pfbm, pcell, field, setDress: f => { dressArena = f; }, setArena: f => { hookArena = f; } } };
  if (HAS_W) window.GARDEN_PROPS = API;
  return API;
})();
