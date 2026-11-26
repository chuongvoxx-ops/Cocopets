/* ---------- v463 SE: The Sepulchre of Borrowed Hours repainted in 2.5D (Rift 04's three lands, their props and the trials' pieces) ----------
   Every solid piece of the rift is painted once into its own cached picture by the Drowned Belfry's software shading pass
   (BELPROPS.kit, 20n9: each pixel of a solid gets a normal and a material and is lit), each land in its own light:
     halls  (the Clockless Halls, section 1): the dark of a tomb lit by old gold, cold blue in the shadows and reflections
     ages   (the Hall in Two Ages, section 2): a white heavenly sun, a blue sky in the polish, an ivory bounce off the marble;
            every piece has its youth (v 0: whole, gleaming, gilded) and its ruin (v 1: broken, stained, its gold dulled)
     stairs (the Borrowed Stairs, section 3): a cold violet key from the void, a deep violet rim, glass and black stone
   then finished with a little 2D detail and a soft ink edge. Nothing is painted per frame: the frame lays the pictures down;
   what glows (the hourglasses' spheres, the falling stone's gold, the clocks' dials, the void's seams and shards, the
   lamps' borrowed hours, the gold motes) is the GPU painter's light over them (FGFX, 20k6h), lowFx respected.
   Pictures (name, v; v 0..1 painted, 2..3 the same mirrored): the halls' boxtomb, hourglass, fallstone, sepurn (the silver
   urn: the Library's 20zb2 owns PROPS.silverurn, so the land lists this kind instead), stopclock, mourner, dialslab; the
   ages' silverpillar, sunclock, marblebench, agesarch, gildedurn, ruinblock; the stairs' voidobelisk, stairstub,
   cornerglow, glassshard, hourlamp, floatstair. Each land's props list, propN and a light rim dressing (B.dress) are getters:
   the old list and counts whenever the painter is off. The floors' decals (DEC), the trials' pieces (PIECES below).
   Textures (made once per sharpness and land, wrapping): floor (6 tiles square; the ages have two: their youth and their
   ruin, laid by a slow field across the world), bank (the wall's face), roof (the wall top), cliff (over the gap), bridge
   (tomb slabs / marble / violet glass panes the void shows through) and bunder (its underside) for halls / ages / stairs.
   The lands (BIOMES.sepulchre, .twoages, .borrowed): floorFn, wallFn, roofFn, cliffTint, bridgeFn, bridgeEdge, floorUnder
   and floor (the base colour: the floor texture's mean) as getters (the old art whenever the painter is off); DECALS of
   their own. The `gap` and backgrounds are not touched here (20s5, SS).
   The props are repainted through the engine's prop cache (DunWorld.PROPS), so BREAK_FX shatters the new pictures in their
   own materials (each break adds its debris and a feathered GPU burst); the old 2D art stays in SEP_PROPS.OLD. The
   hourglass (dungeon one's mechanic) and the stair stub keep their old hit points (VEH_SMASH protects both).
   The rift (RIFT_BY_ID.sepulchre): everyStage (chained) lays the light over every stage and flushes the trials' queued
   light; preload (chained) warms the stage's textures, decals and pieces; DunWorld.dropProps (chained) frees everything.
   The trials call SEP_PROPS.piece(c, name, v, Xs, Ys, T, o) / .light(fn, ...) through their "v463 SE" hooks (20s1, 20s1b):
   it draws the piece's picture and queues its light, or returns false (no painter or no GPU light this stage) and the old
   2D art is drawn. window.__SEPP = 0 turns all of it off. */
var SEP_PROPS = (() => {
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined';
  const off = () => HAS_W && (window.__SEPP === 0 || window.__BELP === 0);
  const BP = () => (!off() && HAS_W && window.BELPROPS && window.BELPROPS.kit) ? window.BELPROPS : null;
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + (s | 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const rgba = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${clamp(a, 0, 1)})`; };
  const md = (a, n) => ((a % n) + n) % n;
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0, tex: 0, texMs: 0, hooks: 0, land: 0, texSync: 0, texJob: 0, empty: 0 };
  const GOLD = '#E8CF8E', GOLDD = '#B2965D', VIO = '#C9B0FF', VIOD = '#8E6BD0', SKY = '#FFF4D0';

  /* ======================= the light of each land ======================= */
  const LIGHT = {
    halls: { a0: [0.07, 0.075, 0.12], a1: [0.05, 0.05, 0.09], e0: [0.05, 0.05, 0.08], e1: [0.26, 0.28, 0.42], k: [1.2, 0.98, 0.66], rim: [0.46, 0.34, 0.14], bo: [0.06, 0.05, 0.09] },
    ages: { a0: [0.25, 0.25, 0.29], a1: [0.12, 0.13, 0.17], e0: [0.3, 0.27, 0.22], e1: [0.62, 0.72, 0.92], k: [1.36, 1.28, 1.14], rim: [0.52, 0.46, 0.3], bo: [0.26, 0.22, 0.15] },
    stairs: { a0: [0.08, 0.05, 0.13], a1: [0.07, 0.03, 0.13], e0: [0.04, 0.02, 0.08], e1: [0.34, 0.22, 0.56], k: [0.9, 0.82, 1.14], rim: [0.48, 0.28, 0.78], bo: [0.09, 0.04, 0.15] } };
  const BIO_L = { sepulchre: 'halls', twoages: 'ages', borrowed: 'stairs' };
  const INK = { halls: [6, 8, 18], ages: [58, 54, 64], stairs: [10, 4, 26] };
  function lit(K, name, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHT[name] || LIGHT.halls); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }
  const bioOf = B => { if (!B || typeof BIOMES === 'undefined') return null; return B === BIOMES.sepulchre ? 'sepulchre' : B === BIOMES.twoages ? 'twoages' : B === BIOMES.borrowed ? 'borrowed' : null; };

  /* ======================= noise that wraps (for the textures) ======================= */
  const PH = (x, y, s) => hh(x, y, s);
  function pvn(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), q = p | 0 || 1;
    const X0 = ((xi % q) + q) % q, X1 = (X0 + 1) % q, Y0 = ((yi % q) + q) % q, Y1 = (Y0 + 1) % q, a = PH(X0, Y0, s), b = PH(X1, Y0, s), c = PH(X0, Y1, s), d = PH(X1, Y1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const pfbm = (x, y, p, s) => pvn(x, y, p, s) * 0.52 + pvn(x * 2, y * 2, p * 2, s + 7) * 0.3 + pvn(x * 4, y * 4, p * 4, s + 13) * 0.18;
  const CELL = { d: 0, d2: 0, id: 0, ox: 0, oy: 0 };
  function pcell(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y); let d1 = 9, d2 = 9, id = 0, ox = 0, oy = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i, cy = yi + j, wx = ((cx % p) + p) % p, wy = ((cy % p) + p) % p, px = cx + 0.15 + PH(wx, wy, s) * 0.7, py = cy + 0.15 + PH(wx, wy, s + 1) * 0.7, d = Math.hypot(x - px, y - py);
      if (d < d1) { d2 = d1; d1 = d; id = wy * p + wx; ox = x - px; oy = y - py; } else if (d < d2) d2 = d; }
    CELL.d = d1; CELL.d2 = d2; CELL.id = id; CELL.ox = ox; CELL.oy = oy; return CELL; }
  function pfeat(x, y, p, s, prob) { const xi = Math.floor(x), yi = Math.floor(y); let d1 = 9, id = -1;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i, cy = yi + j, wx = ((cx % p) + p) % p, wy = ((cy % p) + p) % p; if (PH(wx, wy, s + 2) >= prob) continue; const px = cx + PH(wx, wy, s), py = cy + PH(wx, wy, s + 1), d = Math.hypot(x - px, y - py);
      if (d < d1) { d1 = d; id = wy * p + wx; } }
    CELL.d = d1; CELL.id = id; return CELL; }

  /* ======================= primitives beyond the kit's ======================= */
  // lump: a mass seen from the front (an ellipsoid with a wavering edge and a bumpy face), as 20r2's
  function lump(K, S, cx, cy, rx, ry, o) { const { M, vn } = K, P = S.P, X0 = S.ax + cx * P, Y0 = S.ay + cy * P, RX = rx * P, RY = ry * P; if (RX < 0.5) return;
    const amp = o.amp == null ? 0.12 : o.amp, fr = o.fr || 2.2, sd = o.sd || 0, bump = o.bump == null ? 0.5 : o.bump, lf = o.leaf || 9, mR = Math.min(RX, RY), A0 = o.ao == null ? 1 : o.ao, flat = o.flat || 0;
    S.lock();
    const xa = Math.max(0, Math.floor(X0 - RX * (1 + amp) - 2)), xb = Math.min(S.w - 1, Math.ceil(X0 + RX * (1 + amp) + 2)), ya = Math.max(0, Math.floor(Y0 - RY * (1 + amp) - 2)), yb = Math.min(S.h - 1, Math.ceil(Y0 + RY * (1 + amp) + 2));
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { let dx = (px + 0.5 - X0) / RX, dy = (py + 0.5 - Y0) / RY; if (flat && dy > 0) dy *= 1 + flat * dy * 2;
      const rr = Math.hypot(dx, dy), ca = dx / (rr || 1), sa = dy / (rr || 1);
      const edge = 1 + amp * (vn(ca * fr + sd + 3, sa * fr + sd * 1.3 + 3) * 2 - 1) + amp * 0.5 * (vn(ca * fr * 3 + sd, sa * fr * 3 - sd) * 2 - 1); if (rr > edge + 1.5 / mR) continue;
      const e = Math.min(1, rr / edge), ny0 = Math.sqrt(Math.max(0, 1 - e * e)), wx = (px - S.ax) / P, wy = (py - S.ay) / P;
      const b1 = vn(wx * lf + sd, wy * lf), b2 = vn(wx * lf + 4.1 + sd, wy * lf + 2.3);
      let nx = dx / edge + (b1 - 0.5) * bump, ny = ny0 + 0.08, nz = -dy / edge + (b2 - 0.5) * bump; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      K.M0(); M.ao = (0.5 + 0.5 * ny0) * A0; o.mat(dx, dy, M.ao, e, nz, wx, wy); K.shade(nx, ny, nz); K.put(S, px, py, clamp((edge - rr) * mR + 0.6, 0, 1)); }
  }
  // prism: a six-sided prism standing from its foot (cx, by), leaning ang, radius r0 -> r1 over h tiles, a tip tip tall; mat(face, q, wt, inTip, ao)
  function prism(K, S, cx, by, r0, r1, h, tip, ang, mat, o) { o = o || {}; const { M } = K, P = S.P, CX = S.ax + cx * P, BY = S.ay + by * P, ca = Math.cos(ang), sa = Math.sin(ang), Ht = h + tip, rm = Math.max(r0, r1);
    const xs = [CX, CX + sa * Ht * P], ys = [BY, BY - ca * Ht * P];
    const xa = Math.max(0, Math.floor(Math.min(xs[0], xs[1]) - rm * P - 2)), xb = Math.min(S.w - 1, Math.ceil(Math.max(xs[0], xs[1]) + rm * P + 2)), ya = Math.max(0, Math.floor(Math.min(ys[0], ys[1]) - rm * P - 2)), yb = Math.min(S.h - 1, Math.ceil(Math.max(ys[0], ys[1]) + rm * P + 2));
    S.lock();
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { const dx = (px + 0.5 - CX) / P, dy = (py + 0.5 - BY) / P, w = dx * sa - dy * ca, u = dx * ca + dy * sa;
      if (w < -0.6 / P || w > Ht + 0.6 / P) continue; const inTip = w > h, r = inTip ? r1 * (1 - (w - h) / (tip || 1e-6)) : lerp(r0, r1, clamp(w / (h || 1), 0, 1)); if (r <= 0.002) continue;
      const au = Math.abs(u); if (au > r + 0.6 / P) continue; const q = clamp(u / r, -1, 1), face = q < -0.5 ? -1 : q > 0.5 ? 1 : 0;
      let lx = face * 0.866, ly = face ? 0.5 : 1, lz = (r0 - r1) / (h || 1) * 0.5; if (inTip) { lx *= 0.72; ly *= 0.72; lz = 0.62; }
      const nx = lx * ca + lz * sa, nz = -lx * sa + lz * ca, l = Math.hypot(nx, ly, nz) || 1;
      K.M0(); M.ao = 1 - 0.18 * ss(0.06, 0, Math.abs(Math.abs(q) - 0.5)); mat(face, q, clamp(w / Ht, 0, 1), inTip, M.ao); K.shade(nx / l, ly / l, nz / l);
      K.put(S, px, py, clamp((r - au) * P + 0.6, 0, 1) * clamp((w + 0.6 / P) * P, 0, 1) * (o.alpha == null ? 1 : o.alpha)); }
  }
  /* disc: a flat plate standing toward the camera (a clock's dial, a medallion, a gear): centre (cx, cy), radii rx, ry, its rim
     bevelled over bv (of the radius); o.rf(angle) its edge's radius (a gear's teeth); mat(dx, dy, e, ao) */
  function disc(K, S, cx, cy, rx, ry, mat, o) { o = o || {}; const { M } = K, P = S.P, X0 = S.ax + cx * P, Y0 = S.ay + cy * P, RX = rx * P, RY = ry * P, bv = o.bv == null ? 0.14 : o.bv, rf = o.rf, dome = o.dome || 0; if (RX < 0.5) return; S.lock();
    for (let py = Math.max(0, Math.floor(Y0 - RY * 1.3 - 1)); py <= Math.min(S.h - 1, Math.ceil(Y0 + RY * 1.3 + 1)); py++) for (let px = Math.max(0, Math.floor(X0 - RX * 1.3 - 1)); px <= Math.min(S.w - 1, Math.ceil(X0 + RX * 1.3 + 1)); px++) {
      const dx = (px + 0.5 - X0) / RX, dy = (py + 0.5 - Y0) / RY, r = Math.hypot(dx, dy), R0 = rf ? rf(Math.atan2(dy, dx)) : 1; if (r > R0 + 1.5 / RX) continue; const e = r / R0, k = e > 1 - bv ? (e - (1 - bv)) / bv * 0.85 : dome * e;
      const ux = r > 1e-5 ? dx / r : 0, uy = r > 1e-5 ? dy / r : 0, s = Math.min(0.95, k), nx = ux * s, nz = -uy * s, ny = Math.sqrt(1 - s * s);
      K.M0(); M.ao = 1 - 0.2 * ss(1 - bv, 1, e); mat(dx, dy, e, M.ao); K.shade(nx, ny, nz); K.put(S, px, py, clamp((R0 - r) * Math.min(RX, RY) + 0.6, 0, 1)); }
  }
  // a layer: painted on a work surface of its own, then laid over at alpha (glass)
  function layer(K, S, a, fn) { const S2 = K.surface(-S.ax / S.P, -S.ay / S.P, (S.w - S.ax) / S.P, (S.h - S.ay) / S.P, S.P); try { fn(S2); S2.unlock(); } catch (e) { S2.cv.width = S2.cv.height = 1; return; }
    S.unlock(); const c = S.c; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = a; c.drawImage(S2.cv, 0, 0); c.restore(); S2.cv.width = S2.cv.height = 1; }
  function halo(c, x, y, r, col, a) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.4)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
  function socket(c, x, y, rx, ry, rim) { c.save(); c.translate(x, y); c.scale(1, ry / rx); const g = c.createRadialGradient(0, -rx * 0.15, 0, 0, 0, rx); g.addColorStop(0, 'rgba(4,4,10,.96)'); g.addColorStop(0.7, 'rgba(10,10,18,.85)'); g.addColorStop(1, 'rgba(20,20,30,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
    if (rim) { c.strokeStyle = rim; c.lineWidth = rx * 0.16; c.beginPath(); c.arc(0, 0, rx * 0.86, 0.4, 2.7); c.stroke(); } c.restore(); }
  const ptsQ = (x0, y0, cx, cy, x1, y1, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c2 = t * t; o.push([a * x0 + b * cx + c2 * x1, a * y0 + b * cy + c2 * y1]); } return o; };
  const arcP = (cx, cy, r, a0, a1, n, sy) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * (sy || 1)]); } return o; };
  // fine cracks (2D, over what is painted): a dark line with a lit lower lip
  function cracks(c, R, n, x0, x1, y0, y1, a, len, lip) { c.save(); c.globalCompositeOperation = 'source-atop'; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < n; i++) { let x = lerp(x0, x1, R()), y = lerp(y0, y1, R()); const pts = [[x, y]], ang = R() * TAU, st = (len || 0.07); for (let k = 0; k < 4; k++) { x += Math.cos(ang + (R() - 0.5) * 1.4) * st; y += Math.sin(ang + (R() - 0.5) * 1.4) * st * 0.8 + 0.01; pts.push([x, y]); }
      for (const [dd, col, w] of [[0.009, lip || `rgba(230,236,255,${a * 0.4})`, 0.011], [0, `rgba(6,6,14,${a})`, 0.012]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach((p, j) => j ? c.lineTo(p[0], p[1] + dd) : c.moveTo(p[0], p[1] + dd)); c.stroke(); } }
    c.restore(); }
  // a line cut into a face (engraving): dark groove, lit lower lip
  function groove(c, pts, w, a, lipCol, close) { c.save(); c.globalCompositeOperation = 'source-atop'; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const [dd, col, lw] of [[w * 0.7, lipCol || `rgba(255,240,210,${a * 0.5})`, w * 0.8], [0, `rgba(4,4,12,${a})`, w]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); pts.forEach((p, j) => j ? c.lineTo(p[0], p[1] + dd) : c.moveTo(p[0], p[1] + dd)); if (close) c.closePath(); c.stroke(); } c.restore(); }
  const rectP = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  // a sheen over the upper left of what is painted (the key light's warmth on the land's pieces)
  function sheen(c, x0, y0, x1, y1, col, a) { c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(Math.min(x0, x1) - 1, Math.min(y0, y1) - 2, Math.abs(x1 - x0) + 2.5, Math.abs(y1 - y0) + 3); c.restore(); }

  /* ======================= materials (each sets K.M) ======================= */
  // the halls' blue-black tomb stone: a fine granite, mica flecks, pits, faint pale veins; tone lightens it
  function tombM(K, u, v, sd, tone, nv) { const { M, vn, fbm } = K, w = fbm(u * 3 + sd, v * 3), sp = vn(u * 47 + sd, v * 47), t = (0.82 + 0.32 * w) * (tone || 1);
    M.r = 0.15 * t; M.g = 0.17 * t; M.b = 0.235 * t; M.rg = 0.4; M.cc = 0.28;
    if (sp > 0.84) { M.r *= 1.5; M.g *= 1.48; M.b *= 1.4; } if (vn(u * 29, v * 29 + sd) > 0.8) M.ao *= 0.84;
    const vein = nv ? 1 : Math.abs(vn(u * 2.2 + sd * 3, v * 2.2 + 5) - 0.5); if (vein < 0.012) { const k = (1 - vein / 0.012) * 0.55; M.r = lerp(M.r, 0.42, k); M.g = lerp(M.g, 0.46, k); M.b = lerp(M.b, 0.6, k); } }
  // old gold: bright where worn, tarnished brown-green in the hollows
  function goldM(K, u, v, sd, wear, tar0) { const { M, vn } = K, s = vn(u * 9 + sd, v * 9), p = vn(u * 31, v * 31 + sd), tar = clamp(ss(0.55, 0.85, vn(u * 4 + sd, v * 4 + 3)) * (1 - (wear || 0)) + (tar0 || 0), 0, 1);
    M.mt = 1 - tar * 0.7; M.r = lerp(0.3, 0.16, tar); M.g = lerp(0.22, 0.15, tar); M.b = lerp(0.08, 0.07, tar); M.fr = (0.96 + 0.1 * s) * (1 - tar * 0.45); M.fg = (0.74 + 0.08 * s) * (1 - tar * 0.5); M.fb = (0.38 + 0.06 * s) * (1 - tar * 0.55); M.rg = lerp(0.22, 0.62, tar); if (p > 0.8) M.ao *= 0.85; }
  function silverM(K, u, v, sd, tar0) { const { M, vn } = K, s = vn(u * 8 + sd, v * 8), tar = clamp(ss(0.6, 0.9, vn(u * 5 + sd, v * 5 + 1)) * 0.6 + (tar0 || 0), 0, 1);
    M.mt = 1 - tar * 0.5; M.r = 0.2; M.g = 0.21; M.b = 0.24; M.fr = (0.8 + 0.08 * s) * (1 - tar * 0.5); M.fg = (0.83 + 0.08 * s) * (1 - tar * 0.48); M.fb = (0.9 + 0.06 * s) * (1 - tar * 0.4); M.rg = lerp(0.18, 0.5, tar); }
  // ivory marble: soft clouding, grey and gold veins, polished (o.ruin: grime, lichen, a duller polish; o.grey: the grey tiles)
  function marbleM(K, u, v, sd, o) { o = o || {}; const { M, vn, fbm } = K, w = fbm(u * 2.2 + sd, v * 2.2), t = (0.9 + 0.12 * w) * (o.tone || 1), gr = o.grey ? 1 : 0;
    M.r = lerp(0.93, 0.74, gr) * t; M.g = lerp(0.9, 0.76, gr) * t; M.b = lerp(0.83, 0.8, gr) * t; M.rg = 0.2; M.cc = 0.6;
    const v1 = Math.abs(vn(u * 1.6 + sd * 2 + fbm(u * 3, v * 3) * 1.4, v * 1.6 + 3) - 0.5), v2 = Math.abs(vn(u * 4.1 + 7, v * 4.1 + sd) - 0.5);
    if (v1 < 0.02) { const k = (1 - v1 / 0.02) * 0.6; M.r = lerp(M.r, 0.62, k); M.g = lerp(M.g, 0.6, k); M.b = lerp(M.b, 0.6, k); } else if (v2 < 0.008) { const k = (1 - v2 / 0.008) * 0.45; M.r = lerp(M.r, 0.86, k); M.g = lerp(M.g, 0.7, k); M.b = lerp(M.b, 0.42, k); }
    if (o.ruin) { const g2 = ss(0.45, 0.8, fbm(u * 1.4 + 9, v * 1.4 + sd)), li = ss(0.7, 0.85, vn(u * 6 + sd, v * 6 + 2)); M.r = lerp(M.r, 0.52, g2 * 0.5); M.g = lerp(M.g, 0.48, g2 * 0.5); M.b = lerp(M.b, 0.4, g2 * 0.5); M.rg = 0.55; M.cc = 0.15;
      if (li > 0) { M.r = lerp(M.r, 0.56, li * 0.6); M.g = lerp(M.g, 0.62, li * 0.6); M.b = lerp(M.b, 0.44, li * 0.6); } if (vn(u * 33, v * 33 + sd) > 0.78) M.ao *= 0.8; } }
  // the stairs' void stone: violet black, specks of light like far stars, a satin polish
  function vstoneM(K, u, v, sd, tone, nv) { const { M, vn, fbm } = K, w = fbm(u * 3 + sd, v * 3), t = (0.8 + 0.35 * w) * (tone || 1), sp = vn(u * 53 + sd, v * 53);
    M.r = 0.15 * t; M.g = 0.11 * t; M.b = 0.24 * t; M.rg = 0.36; M.cc = 0.35; if (sp > 0.9) { const k = (sp - 0.9) * 10; M.er = 0.5 * k; M.eg = 0.42 * k; M.eb = 0.7 * k; }
    const vein = nv ? 1 : Math.abs(vn(u * 2 + sd * 2, v * 2 + 7) - 0.5); if (vein < 0.01) { const k = 1 - vein / 0.01; M.r = lerp(M.r, 0.5, k * 0.6); M.g = lerp(M.g, 0.36, k * 0.6); M.b = lerp(M.b, 0.85, k * 0.6); M.er = 0.18 * k; M.eg = 0.1 * k; M.eb = 0.36 * k; } if (vn(u * 27, v * 27 + sd) > 0.82) M.ao *= 0.86; }
  // glass and crystal: dark body, clear coat, light inside (col 0..1 rgb)
  function glassM(K, col, k, glow) { const M = K.M; M.r = col[0] * k; M.g = col[1] * k; M.b = col[2] * k; M.rg = 0.05; M.cc = 1; M.sh = 0.6; M.er = col[0] * (glow || 0); M.eg = col[1] * (glow || 0); M.eb = col[2] * (glow || 0); }
  const VIOC = [0.72, 0.56, 1.0], GLASSC = [0.74, 0.82, 0.95], HOURC = [1.0, 0.88, 0.6];
  function crystalM(K, col, face, q, wt, glow) { const M = K.M, k = face ? 0.42 : 0.56; M.r = col[0] * k; M.g = col[1] * k; M.b = col[2] * k; M.rg = 0.06; M.cc = 1; M.sh = 0.7;
    const core = ss(0.3, 0.0, Math.abs(q)), e = glow * (0.2 + 0.5 * wt + 0.45 * core); M.er = col[0] * e + 0.2 * core * glow; M.eg = col[1] * e + 0.18 * core * glow; M.eb = col[2] * e + 0.24 * core * glow; }
  // a clock case's dark polished wood, its grain running up it
  function woodM(K, u, v, sd) { const { M, vn } = K, g = vn(u * 3 + sd, v * 22) * 0.6 + vn(u * 11, v * 60) * 0.4, t = 0.7 + 0.5 * g; M.r = 0.19 * t; M.g = 0.1 * t; M.b = 0.065 * t; M.rg = 0.32; M.cc = 0.55; if (vn(u * 5 + 3, v * 5) > 0.82) { M.r *= 0.7; M.g *= 0.7; M.b *= 0.7; } }
  function enamelM(K, u, v, sd, crack) { const { M, vn } = K, w = vn(u * 6 + sd, v * 6); M.r = 0.9 * (0.94 + 0.08 * w); M.g = 0.87 * (0.94 + 0.08 * w); M.b = 0.78 * (0.94 + 0.08 * w); M.rg = 0.15; M.cc = 0.9; if (crack) { const c2 = Math.abs(vn(u * 7 + 2, v * 7) - 0.5); if (c2 < 0.012) M.ao *= 0.5; } }
  function ironM(K, u, v, sd) { const { M, vn } = K, ru = ss(0.5, 0.8, vn(u * 6 + sd, v * 6) * 0.6 + vn(u * 23, v * 23 + sd) * 0.5) * 0.6; M.mt = 1 - ru * 0.8; M.r = lerp(0.06, 0.22, ru); M.g = lerp(0.06, 0.12, ru); M.b = lerp(0.08, 0.1, ru); M.fr = lerp(0.3, 0.05, ru); M.fg = lerp(0.3, 0.05, ru); M.fb = lerp(0.36, 0.06, ru); M.rg = lerp(0.36, 0.8, ru); }
  // dust lying in the halls (grey), marble grit in the ages, violet glass grit on the stairs
  function dustM(K, u, v, sd, L) { const { M, vn } = K, w = vn(u * 9 + sd, v * 9), t = 0.82 + 0.25 * w; if (L === 'ages') { M.r = 0.86 * t; M.g = 0.82 * t; M.b = 0.74 * t; M.rg = 0.9; } else if (L === 'stairs') { M.r = 0.24 * t; M.g = 0.18 * t; M.b = 0.36 * t; M.rg = 0.7; if (vn(u * 41, v * 41 + sd) > 0.86) { M.er = 0.3; M.eg = 0.2; M.eb = 0.5; } } else { M.r = 0.3 * t; M.g = 0.31 * t; M.b = 0.36 * t; M.rg = 0.95; } }
  const stoneOf = L => L === 'ages' ? (K, u, v, sd, ruin) => marbleM(K, u, v, sd, { ruin }) : L === 'stairs' ? (K, u, v, sd) => vstoneM(K, u, v, sd) : (K, u, v, sd, t) => tombM(K, u, v, sd, t === true ? 1 : t);

  /* ======================= the props ======================= */
  const contact = (K, S, rx, ry, a) => K.contact(S, 0, 0.02, rx, ry, a || 0.55);
  const pool = (K, S, x, y, rx, ry, sd, L) => lump(K, S, x, y, rx, ry, { amp: 0.2, fr: 3, sd: sd + x * 7, bump: 0.15, leaf: 18, flat: 0.8, mat: (dx, dy, ao, e, nz, wx, wy) => { dustM(K, wx, wy, sd, L); K.M.ao *= 0.9; } });
  const pebbles = (K, S, n, x0, x1, y0, y1, mat, sd) => { const R = K.R1(sd); for (let i = 0; i < n; i++) { const x = lerp(x0, x1, R()), y = lerp(y0, y1, R()), r = 0.03 + R() * 0.05; lump(K, S, x, y - r * 0.4, r * 1.3, r, { amp: 0.25, fr: 2.4, sd: sd + i, bump: 0.5, leaf: 26, flat: 0.5, mat: (dx, dy, ao, e, nz, wx, wy) => mat(wx, wy, i) }); } S.unlock(); };
  const box = (K, S, cx, by, hw, hd, z0, z1, b, mat) => { K.rbox(S, cx, by, hw, hd, z0, z1, b, mat); S.unlock(); };
  // a moulded band of gold round a box's front (its height z0..z1 in the front face's v)
  const band = (v, a, b) => v >= a && v <= b;
  /* ---- the Clockless Halls (halls) ---- */
  // a candle on its gold dish: wax, a drip, the wick (its flame is the GPU painter's light)
  function candle(K, S, x, y, h, sd) { K.rev(S, x, y, hh2 => hh2 < 0.03 ? 0.075 : 0.04 + 0.006 * Math.sin(hh2 * 40), 0, h, { top: true, mat: (u, hh2) => { const M = K.M; M.r = 0.88; M.g = 0.82; M.b = 0.68; M.rg = 0.45; M.cc = 0.35; M.er = 0.06 * ss(h * 0.5, h, hh2); M.eg = 0.04 * ss(h * 0.5, h, hh2); if (hh2 < 0.03) goldM(K, u * 6, hh2 * 9, sd, 0.6); } }); S.unlock();
    K.tube(S, [[x + 0.03, y - h + 0.01], [x + 0.036, y - h + 0.09]], 0.012, 0.009, () => { const M = K.M; M.r = 0.9; M.g = 0.84; M.b = 0.7; M.rg = 0.4; }); K.tube(S, [[x, y - h], [x + 0.004, y - h - 0.035]], 0.006, 0.004, () => { const M = K.M; M.r = 0.1; M.g = 0.07; M.b = 0.05; }); S.unlock(); halo(S.c, x, y - h - 0.06, 0.12, '#FFD890', 0.5); }
  function paintBoxtomb(K, S, v, L) { const sd = 3 + v * 7, R = K.R1(sd), c = S.c;
    contact(K, S, 1.05, 0.32, 0.62);
    // a stepped plinth, the chest with carved panels between gilded colonnettes, a ridged lid
    box(K, S, 0, 0.03, 0.92, 0.42, 0, 0.08, 0.03, (f, u, vv) => tombM(K, u * 2, vv * 2, sd, 0.72));
    box(K, S, 0, 0.02, 0.84, 0.37, 0.08, 0.16, 0.03, (f, u, vv) => { tombM(K, u * 2, vv * 2, sd, 0.86); if (f === 'f' && vv > 0.135) goldM(K, u * 6, vv * 6, sd, 0.4); });
    box(K, S, 0, 0.0, 0.74, 0.31, 0.16, 0.66, 0.04, (f, u, vv, ao, e) => { tombM(K, u * 1.5, vv * 1.5, sd + 1); if (f === 'f' && (band(vv, 0.58, 0.62) || band(vv, 0.2, 0.23))) goldM(K, u * 4, vv * 4, sd, 0.35); });
    for (const x0 of [-0.62, -0.18, 0.26]) { groove(c, rectP(x0, -0.56, x0 + 0.36, -0.24), 0.014, 0.6, 'rgba(120,140,190,.35)', true); groove(c, rectP(x0 + 0.05, -0.51, x0 + 0.31, -0.29), 0.01, 0.4, 'rgba(120,140,190,.25)', true); }
    disc(K, S, -0.44, -0.4, 0.075, 0.075, (dx, dy) => goldM(K, dx, dy, sd + 4, 0.6), { bv: 0.4 }); disc(K, S, 0.44, -0.4, 0.075, 0.075, (dx, dy) => goldM(K, dx, dy, sd + 5, 0.6), { bv: 0.4 });
    disc(K, S, 0, -0.4, 0.12, 0.12, (dx, dy, e) => { goldM(K, dx * 2, dy * 2, sd, 0.6); if (e < 0.74) { K.M.mt *= 0.6; K.M.fr *= 0.8; } }, { bv: 0.22 });
    c.save(); c.strokeStyle = 'rgba(40,24,8,.8)'; c.lineWidth = 0.012; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 0.07, -0.4 + Math.sin(a) * 0.07); c.lineTo(Math.cos(a) * 0.088, -0.4 + Math.sin(a) * 0.088); c.stroke(); }
    c.lineWidth = 0.016; c.beginPath(); c.moveTo(0, -0.4); c.lineTo(-0.012, -0.46); c.moveTo(0, -0.4); c.lineTo(0.045, -0.385); c.stroke(); c.restore();
    for (const x of [-0.72, 0.72]) { K.tube(S, [[x, -0.17], [x, -0.64]], 0.045, 0.04, (t, s2) => { goldM(K, s2 + x, t * 6, sd + 2, 0.5); if (Math.abs(Math.sin(t * 30)) < 0.2) K.M.ao *= 0.8; }); K.ball(S, x, -0.66, 0.06, 0.05, (dx, dy) => goldM(K, dx, dy, sd + 3, 0.7)); } S.unlock();
    const lx = v ? 0.16 : 0, ly = v ? -0.05 : 0;
    if (v) { c.save(); const g = c.createLinearGradient(0, -0.8, 0, -0.62); g.addColorStop(0, 'rgba(0,0,6,.9)'); g.addColorStop(1, 'rgba(0,0,6,0)'); c.fillStyle = g; c.fillRect(-0.72, -0.82, 0.42, 0.24); c.restore(); }
    box(K, S, lx, ly, 0.8, 0.35, 0.66, 0.74, 0.04, (f, u, vv, ao, e) => { tombM(K, u * 1.5 + 3, vv * 1.5, sd + 2, 1.1); if (e > 0.55) goldM(K, u * 5, vv * 5, sd + 3, 0.5); });
    K.tube(S, [[lx - 0.7, ly - 0.86], [lx + 0.7, ly - 0.86]], 0.14, 0.14, (t, s2) => { tombM(K, t * 4 + 3, s2, sd + 5, 1.2); if (Math.abs(Math.sin(t * Math.PI * 8)) < 0.12) goldM(K, t * 9, s2, sd, 0.5); }); S.unlock();
    for (const x of [-0.7, 0.7]) K.ball(S, lx + x, ly - 0.86, 0.06, 0.14, (dx, dy) => goldM(K, dx, dy, sd + 6, 0.6)); S.unlock();
    if (v) { cracks(c, R, 4, -0.5, 0.8, -1.0, -0.75, 0.6, 0.06); K.tube(S, [[0.62, -0.02], [0.95, 0.06]], 0.04, 0.038, () => { const M = K.M; M.r = 0.86; M.g = 0.8; M.b = 0.66; M.rg = 0.5; }); S.unlock(); }
    else for (const x of [-0.86, 0.86]) candle(K, S, x, 0.08, 0.2 + (x > 0 ? 0.06 : 0), sd);
    cracks(c, R, 6, -0.7, 0.7, -0.75, -0.12, 0.5, 0.05);
    pebbles(K, S, 4, -0.9, 0.9, 0.04, 0.16, (x, y, i) => tombM(K, x * 3, y * 3, sd + i, 1.1), sd + 9);
    pool(K, S, v ? -0.55 : 0.3, 0.06, 0.3, 0.07, sd, L); S.unlock();
    sheen(c, -0.8, -1.0, 0.2, -0.2, GOLD, 0.14); K.ink(S, INK[L], 0.5); }
  const hgProf = (h0, H, w) => h => { const t = clamp((h - h0) / H, 0, 1); return 0.045 + w * Math.pow(Math.abs(Math.cos(t * Math.PI)), 0.75) * (0.82 + 0.18 * Math.sin(t * Math.PI)); };
  function paintHourglass(K, S, v, L) { const sd = 11 + v * 5, R = K.R1(sd), c = S.c, base = v ? 0.5 : 0.34, H = 1.38, top = base + H;
    contact(K, S, 0.7, 0.24, 0.6);
    // the stepped drum it stands on
    K.rev(S, 0, 0, h => h < 0.1 ? 0.52 : h < 0.2 ? 0.46 : 0.4 - 0.04 * ss(0.2, base, h), 0, base - 0.04, { top: true, bump: 0.15, mat: (u, h) => { tombM(K, u * 2, h * 3, sd, 1.05); if (h > base - 0.1) goldM(K, u * 4, h * 4, sd, 0.3); } }); S.unlock();
    K.rev(S, 0, -(base - 0.04), h => 0.44, 0, 0.08, { top: true, mat: (u, h) => goldM(K, u * 4, h * 9, sd, 0.4) }); S.unlock();
    // the back post (behind the glass), then the glass with its light, then the two front posts
    K.tube(S, [[0, -base - 0.08], [0, -top]], 0.032, 0.032, (t, s) => { goldM(K, s, t * 6, sd + 1, 0.2); K.M.ao *= 0.6; }); S.unlock();
    layer(K, S, v ? 0.62 : 0.5, S2 => K.rev(S2, 0, -(base + 0.08), hgProf(0, H - 0.16, 0.31), 0, H - 0.16, { mat: (u, h) => glassM(K, GLASSC, 0.28, 0.02) }));
    { const sy = -(base + 0.08 + (H - 0.16) * (v ? 0.62 : 0.72)); halo(c, 0, sy, 0.42, '#FFD890', v ? 0.35 : 0.5); K.ball(S, 0, sy, 0.15, 0.15, (dx, dy) => { const M = K.M, e = Math.hypot(dx, dy); M.r = 1; M.g = 0.92; M.b = 0.7; M.rg = 0.1; M.cc = 1; M.er = 0.9 * (1 - e * 0.5); M.eg = 0.75 * (1 - e * 0.5); M.eb = 0.42 * (1 - e * 0.6); }); S.unlock(); }
    for (const x of [-0.34, 0.34]) { K.tube(S, [[x, -base - 0.08], [x, -top]], 0.035, 0.035, (t, s) => goldM(K, s + x, t * 6, sd + 2, 0.5)); } S.unlock();
    K.rev(S, 0, -top, h => 0.44, 0, 0.09, { top: true, mat: (u, h) => goldM(K, u * 4, h * 9, sd + 3, 0.4) }); S.unlock();
    K.rev(S, 0, -(top + 0.09), h => 0.12 * (1 - h / 0.28) + 0.03, 0, 0.26, { top: true, mat: (u, h) => goldM(K, u * 4, h * 9, sd + 4, 0.6) }); S.unlock();
    K.ball(S, 0, -(top + 0.4), 0.07, 0.07, (dx, dy) => goldM(K, dx, dy, sd, 0.8)); S.unlock();
    // the glass's shine; a crack (the ruined one); the gold's engraving
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,250,235,.4)'; c.lineWidth = 0.022; c.lineCap = 'round'; c.beginPath(); c.moveTo(-0.2, -(base + 0.25)); c.quadraticCurveTo(-0.24, -(base + 0.45), -0.08, -(base + 0.62)); c.moveTo(-0.08, -(base + 0.8)); c.quadraticCurveTo(-0.24, -(base + 0.98), -0.2, -(top - 0.2)); c.stroke(); c.restore();
    if (v) { c.save(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 0.012; c.beginPath(); c.moveTo(0.12, -(base + 1.0)); c.lineTo(0.05, -(base + 0.9)); c.lineTo(0.14, -(base + 0.82)); c.lineTo(0.08, -(base + 0.7)); c.stroke(); c.restore(); }
    cracks(c, R, 4, -0.4, 0.4, -base + 0.05, -0.05, 0.45, 0.04);
    pool(K, S, 0.42, 0.02, 0.22, 0.06, sd, L); S.unlock(); K.ink(S, INK[L], 0.45); }
  function paintFallstone(K, S, v, L) { const sd = 19 + v * 3, R = K.R1(sd), c = S.c, z0 = v ? 0.36 : 0.95;
    contact(K, S, 1.15, 0.34, 0.6);
    // two fluted columns on square plinths, gilded capitals, a lintel carved with a dial; the stone held in the air on chains
    for (const x of [-0.62, 0.62]) { box(K, S, x, 0, 0.2, 0.2, 0, 0.18, 0.03, (f, u, vv) => tombM(K, u * 3 + x, vv * 3, sd, 0.85));
      K.rev(S, x, -0.18, h => h < 0.08 ? 0.17 : 0.13 - 0.015 * h, 0, 1.72, { mat: (u, h) => { tombM(K, u * 2 + x, h * 1.3, sd, 1.05); K.M.ao *= fl(u, 3.4); if (h < 0.08) goldM(K, u * 4, h * 9, sd, 0.4); } }); S.unlock();
      K.rev(S, x, -1.9, h => lerp(0.13, 0.22, ss(0, 0.16, h)), 0, 0.18, { top: true, mat: (u, h) => goldM(K, u * 4, h * 9, sd + 1, 0.4) }); S.unlock(); }
    box(K, S, 0, 0, 0.88, 0.2, 2.08, 2.38, 0.05, (f, u, vv) => { tombM(K, u * 1.5, vv * 2, sd + 2, 1.06); if (f === 'f' && (band(vv, 2.12, 2.15) || band(vv, 2.32, 2.35))) goldM(K, u * 4, vv * 4, sd, 0.4); });
    disc(K, S, 0, -2.16, 0.12, 0.1, (dx, dy) => goldM(K, dx * 2, dy * 2, sd + 4, 0.6), { bv: 0.3 });
    for (const x of [-0.5, -0.3, 0.3, 0.5]) groove(c, [[x - 0.06, -2.1], [x + 0.06, -2.1], [x + 0.06, -2.24], [x - 0.06, -2.24]], 0.01, 0.4, null, true);
    halo(c, 0, -0.02, 0.6, '#FFD890', 0.32);
    // the chains from the lintel to the stone (one snapped in the ruin of it), then the stone with its gold band and glyph
    const sz = z0 + 0.62, topY = -(sz + 0.07), chain = (x0, y0, x1, y1, n, sd2) => { for (let i = 0; i <= n; i++) { const u = i / n; K.ball(S, lerp(x0, x1, u), lerp(y0, y1, u) + Math.sin(u * Math.PI) * 0.04, i % 2 ? 0.022 : 0.028, i % 2 ? 0.034 : 0.022, (dx, dy) => ironM(K, dx + i, dy, sd2)); } S.unlock(); };
    chain(-0.3, -2.02, -0.26, topY, 12, sd); if (!v) chain(0.3, -2.02, 0.26, topY, 12, sd + 1); else chain(0.3, -2.02, 0.36, -1.5, 5, sd + 1);
    box(K, S, 0, 0, 0.4, 0.22, z0, sz, 0.06, (f, u, vv) => { tombM(K, u * 2 + 5, vv * 2, sd + 3, 0.95); if (f === 'f' && band(vv, sz - 0.1, sz - 0.07)) goldM(K, u * 5, vv * 5, sd, 0.5); });
    const gy = -(z0 + 0.29 - 0.075); disc(K, S, 0, gy, 0.13, 0.13, (dx, dy, e) => { goldM(K, dx, dy, sd, 0.6); if (e < 0.6) { const M = K.M; M.er = 0.35; M.eg = 0.26; M.eb = 0.1; } }, { bv: 0.3 });
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const x = -0.3 + i * 0.15, y0 = -(z0 + 0.7), g = c.createLinearGradient(0, y0, 0, y0 - 0.5); g.addColorStop(0, 'rgba(255,220,150,.3)'); g.addColorStop(1, 'rgba(255,220,150,0)'); c.strokeStyle = g; c.lineWidth = 0.018; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y0 - 0.35 - R() * 0.2); c.stroke(); } c.restore();
    cracks(c, R, 7, -0.75, 0.75, -2.3, -0.2, 0.45, 0.05);
    pebbles(K, S, 5, -0.95, 0.95, 0.0, 0.14, (x, y, i) => tombM(K, x * 3, y * 3, sd + i, 1.1), sd + 3);
    pool(K, S, -0.62, 0.04, 0.3, 0.07, sd, L); pool(K, S, 0.66, 0.05, 0.26, 0.06, sd + 1, L); S.unlock(); sheen(c, -1, -2.4, 0.2, -0.4, GOLD, 0.12); K.ink(S, INK[L], 0.45); }
  const urnProf = v => h => { const b = v ? 0.2 : 0.26; return h < 0.07 ? 0.13 : h < 0.17 ? lerp(0.13, 0.07, ss(0.07, 0.17, h)) : h < 0.78 ? 0.07 + (b - 0.07) * Math.sin(clamp((h - 0.17) / 0.61, 0, 1) * Math.PI * 0.95 + 0.1) : h < 0.88 ? lerp(0.1, 0.075, ss(0.78, 0.88, h)) : h < 0.95 ? 0.13 : 0.1; };
  function paintSepurn(K, S, v, L) { const sd = 23 + v * 5, R = K.R1(sd), c = S.c, ph = v ? 0.42 : 0.32, H = v ? 1.15 : 0.98;
    contact(K, S, 0.62, 0.22, 0.6);
    box(K, S, 0, 0, 0.32, 0.28, 0, ph, 0.03, (f, u, vv) => { tombM(K, u * 2, vv * 2, sd, 1); if (f === 'f' && band(vv, ph - 0.07, ph - 0.035)) goldM(K, u * 5, vv * 5, sd, 0.4); });
    K.rev(S, 0, -ph, urnProf(v), 0, H, { top: true, bump: 0.05, mat: (u, h) => { silverM(K, u * 3, h * 3, sd, v ? 0.25 : 0); if ((h > 0.3 && h < 0.34) || (h > 0.8 && h < 0.86)) goldM(K, u * 5, h * 6, sd, 0.4); } }); S.unlock();
    K.rev(S, 0, -(ph + H), h => 0.07 * (1 - h / 0.16) + 0.02, 0, 0.15, { top: true, mat: (u, h) => goldM(K, u * 4, h * 9, sd, 0.5) }); S.unlock();
    K.ball(S, 0, -(ph + H + 0.2), 0.045, 0.045, (dx, dy) => goldM(K, dx, dy, sd, 0.8)); S.unlock();
    // the engraved band of the hours round its belly, the urn's own reflections
    { const y = -(ph + H * 0.5); c.save(); c.globalCompositeOperation = 'source-atop'; c.strokeStyle = 'rgba(20,24,36,.45)'; c.lineWidth = 0.01; for (let i = 0; i < 9; i++) { const x = -0.2 + i * 0.05; c.beginPath(); c.moveTo(x, y - 0.04); c.lineTo(x, y + 0.04); c.stroke(); } c.restore(); }
    K.glint(c, -0.1, -(ph + H * 0.55), 0.1, 0.55);
    if (v) cracks(c, R, 3, -0.15, 0.15, -(ph + H * 0.7), -(ph + H * 0.3), 0.5, 0.04);
    cracks(c, R, 3, -0.3, 0.3, -ph + 0.03, -0.04, 0.45, 0.04);
    pool(K, S, 0.32, 0.03, 0.2, 0.06, sd, L); S.unlock(); K.ink(S, INK[L], 0.45); }
  // a clock's dial: a gold bezel, ivory enamel, its marks and hands (stopped), a glass's glint
  function dial(K, S, x, y, r, sd, cr, hands) { const c = S.c;
    disc(K, S, x, y, r, r, (dx, dy, e) => goldM(K, dx * 2, dy * 2, sd, 0.6), { bv: 0.3 });
    disc(K, S, x, y, r * 0.8, r * 0.8, (dx, dy, e) => enamelM(K, dx * 2, dy * 2, sd, cr), { bv: 0.08, dome: 0.12 });
    c.save(); c.strokeStyle = 'rgba(30,22,14,.85)'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, l = i % 3 ? 0.62 : 0.52; c.lineWidth = r * (i % 3 ? 0.035 : 0.06); c.beginPath(); c.moveTo(x + Math.cos(a) * r * l, y + Math.sin(a) * r * l); c.lineTo(x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72); c.stroke(); }
    const [a1, a2] = hands || [-1.62, -0.58]; c.lineCap = 'round'; c.strokeStyle = '#1C140C'; c.lineWidth = r * 0.07; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a1) * r * 0.6, y + Math.sin(a1) * r * 0.6); c.stroke(); c.lineWidth = r * 0.09; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a2) * r * 0.4, y + Math.sin(a2) * r * 0.4); c.stroke(); c.fillStyle = '#B2965D'; c.beginPath(); c.arc(x, y, r * 0.07, 0, TAU); c.fill(); c.restore();
    if (cr) { c.save(); c.strokeStyle = 'rgba(30,20,10,.6)'; c.lineWidth = r * 0.025; c.beginPath(); c.moveTo(x - r * 0.6, y - r * 0.2); c.lineTo(x - r * 0.1, y + r * 0.05); c.lineTo(x + r * 0.2, y - r * 0.3); c.moveTo(x - r * 0.1, y + r * 0.05); c.lineTo(x + r * 0.05, y + r * 0.6); c.stroke(); c.restore(); }
    K.glint(c, x - r * 0.35, y - r * 0.4, r * 0.6, 0.45); }
  function paintStopclock(K, S, v, L) { const sd = 29 + v * 3, R = K.R1(sd), c = S.c; contact(K, S, 0.62, 0.22, 0.6);
    const wm = (f, u, vv) => { woodM(K, u * 2, vv * 2, sd); if (f === 'f' && (Math.abs(Math.abs(u) - 0.2) < 0.015)) goldM(K, u * 6, vv * 6, sd, 0.4); };
    if (!v) { // a longcase clock: its plinth, trunk and hood, a pendulum hanging still behind its glass, a gold pediment
      box(K, S, 0, 0, 0.36, 0.22, 0, 0.26, 0.03, wm); box(K, S, 0, 0, 0.27, 0.17, 0.26, 1.52, 0.03, wm);
      box(K, S, 0, 0, 0.35, 0.21, 1.52, 2.14, 0.035, (f, u, vv) => woodM(K, u * 2 + 3, vv * 2, sd)); box(K, S, 0, 0, 0.39, 0.23, 2.14, 2.26, 0.03, (f, u, vv) => goldM(K, u * 4, vv * 4, sd, 0.3));
      { const y0 = -(1.38 - 0.06), y1 = -(0.46 - 0.06); c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(-0.16, 0, 0.16, 0); g.addColorStop(0, 'rgba(4,2,8,.92)'); g.addColorStop(1, 'rgba(14,10,20,.86)'); c.fillStyle = g; c.fillRect(-0.16, y0, 0.32, y1 - y0); c.restore();
        K.tube(S, [[0, y0 + 0.03], [0, y1 - 0.2]], 0.014, 0.014, (t, s) => goldM(K, s, t * 5, sd, 0.6)); S.unlock(); disc(K, S, 0, y1 - 0.15, 0.09, 0.09, (dx, dy) => goldM(K, dx, dy, sd + 1, 0.7), { bv: 0.35 });
        groove(c, rectP(-0.17, y0 - 0.01, 0.17, y1 + 0.01), 0.014, 0.6, 'rgba(255,214,150,.3)', true);
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(200,210,255,.18)'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(-0.1, y1 - 0.05); c.lineTo(0.08, y0 + 0.2); c.stroke(); c.restore(); }
      dial(K, S, 0, -1.78, 0.25, sd, false, [-1.66, -0.62]);
      for (const x of [-0.32, 0, 0.32]) { K.ball(S, x, -2.34 - (x ? 0 : 0.06), x ? 0.05 : 0.07, x ? 0.05 : 0.07, (dx, dy) => goldM(K, dx, dy, sd, 0.7)); } S.unlock(); }
    else { // a bracket clock on a tomb pedestal, its dial cracked
      box(K, S, 0, 0, 0.34, 0.26, 0, 0.72, 0.035, (f, u, vv) => { tombM(K, u * 2, vv * 2, sd, 1); if (f === 'f' && band(vv, 0.62, 0.66)) goldM(K, u * 5, vv * 5, sd, 0.4); });
      box(K, S, 0, -0.02, 0.3, 0.18, 0.72, 1.3, 0.05, (f, u, vv) => woodM(K, u * 2, vv * 2, sd));
      K.rev(S, 0, -1.32, h => Math.sqrt(Math.max(0, 0.09 - h * h)) * 1.05, 0, 0.29, { mat: (u, h) => woodM(K, u * 2, h * 2, sd + 2) }); S.unlock();
      K.ball(S, 0, -1.66, 0.06, 0.06, (dx, dy) => goldM(K, dx, dy, sd, 0.7)); S.unlock();
      dial(K, S, 0, -1.02, 0.2, sd, true, [-2.4, -0.2]);
      cracks(c, R, 4, -0.3, 0.3, -0.7, -0.1, 0.5, 0.04); }
    sheen(c, -0.4, -2.3, 0.2, -0.6, GOLD, 0.12);
    pool(K, S, 0.3, 0.03, 0.2, 0.06, sd, L); S.unlock(); K.ink(S, INK[L], 0.45); }
  function paintMourner(K, S, v, L) { const sd = 37 + v * 3, R = K.R1(sd), c = S.c, ph = 0.3, rb = v ? 0.95 : 1.42, sm = (u, h) => { tombM(K, u * 2, h * 2, sd, 1.75); K.M.b *= 0.96; };
    contact(K, S, 0.7, 0.24, 0.62);
    box(K, S, 0, 0, 0.44, 0.32, 0, ph, 0.035, (f, u, vv) => { tombM(K, u * 2, vv * 2, sd, 1.0); if (f === 'f' && band(vv, ph - 0.08, ph - 0.05)) goldM(K, u * 5, vv * 5, sd, 0.35); });
    // the robe falls from bowed shoulders to the plinth in heavy folds
    K.rev(S, 0, -ph, h => { const t = h / rb; return (t < 0.55 ? lerp(0.36, 0.2, ss(0, 0.55, t)) : t < 0.88 ? lerp(0.2, 0.25, ss(0.55, 0.88, t)) : lerp(0.25, 0.1, ss(0.88, 1, t))) + 0.015 * Math.sin(t * 9) * (1 - t); }, 0, rb, { bump: 0.35, mat: (u, h) => { sm(u, h); if (Math.abs(Math.sin(u * 11 + Math.sin(h * 3) * 0.6)) < 0.28) K.M.ao *= 0.72; } }); S.unlock();
    // the hood falling on its shoulders, bowed forward, its opening dark; the sleeves folded to the hands round a small gold hourglass
    const hy = -(ph + rb + 0.12), sy = -(ph + rb * 0.86), hyy = -(ph + rb * 0.6);
    lump(K, S, 0, -(ph + rb - 0.03), 0.28, 0.12, { amp: 0.08, fr: 1.8, sd: sd + 4, bump: 0.3, leaf: 7, mat: (dx, dy, ao, e, nz, wx, wy) => sm(wx * 2, wy * 2) });
    lump(K, S, 0.04, hy, 0.21, 0.24, { amp: 0.06, fr: 1.6, sd, bump: 0.3, leaf: 6, mat: (dx, dy, ao, e, nz, wx, wy) => sm(wx * 2, wy * 2) }); S.unlock();
    socket(c, 0.08, hy + 0.07, 0.11, 0.13, null);
    for (const s of [-1, 1]) K.tube(S, ptsQ(s * 0.21, sy, s * 0.31, (sy + hyy) / 2 + 0.04, s * 0.07, hyy + 0.02, 10), 0.075, 0.06, (t, s2) => { sm(t + s, s2); if (Math.abs(Math.sin(t * 14)) < 0.2) K.M.ao *= 0.8; }); S.unlock();
    lump(K, S, 0, hyy, 0.12, 0.07, { amp: 0.08, fr: 1.6, sd: sd + 2, bump: 0.3, leaf: 8, mat: (dx, dy, ao, e, nz, wx, wy) => sm(wx * 3, wy * 3) }); S.unlock();
    K.rev(S, 0, hyy - 0.03, hgProf(0, 0.17, 0.045), 0, 0.17, { mat: (u, h) => goldM(K, u * 4, h * 9, sd, 0.6) }); S.unlock();
    // the folds' shadows, the weather on it
    c.save(); c.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 5; i++) { const x = -0.24 + i * 0.12; c.strokeStyle = 'rgba(4,6,14,.3)'; c.lineWidth = 0.018; c.beginPath(); c.moveTo(x * 0.5, -(ph + rb * 0.85)); c.quadraticCurveTo(x * 0.9, -(ph + rb * 0.4), x * 1.3, -ph - 0.02); c.stroke(); } c.restore();
    cracks(c, R, 5, -0.3, 0.3, -(ph + rb), -0.1, 0.45, 0.04);
    sheen(c, -0.4, -(ph + rb + 0.3), 0.15, -ph, GOLD, 0.16);
    pool(K, S, -0.4, 0.03, 0.22, 0.06, sd, L); S.unlock(); K.ink(S, INK[L], 0.45); }
  function paintDialslab(K, S, v, L) { const sd = 43 + v * 3, R = K.R1(sd), c = S.c;
    contact(K, S, 1.05, 0.3, 0.6);
    if (!v) { // a great stone clock-face leaning on a fallen block: its hours in gold, its hands stopped, split across
      box(K, S, 0.36, 0, 0.5, 0.26, 0, 0.42, 0.05, (f, u, vv) => tombM(K, u * 2 + 4, vv * 2, sd, 1.0));
      const cx = -0.18, cy = -0.86, r = 0.8;
      disc(K, S, cx, cy, r, r * 0.96, (dx, dy, e) => { tombM(K, dx * 2, dy * 2, sd + 2, 1.15); if (e > 0.84 && e < 0.9) goldM(K, dx * 3, dy * 3, sd, 0.45); }, { bv: 0.12 });
      groove(c, arcP(cx, cy, r * 0.62, 0, TAU, 48, 0.96), 0.016, 0.6, 'rgba(120,140,190,.3)');
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - Math.PI / 2, x = cx + Math.cos(a) * r * 0.74, y = cy + Math.sin(a) * r * 0.71; disc(K, S, x, y, i % 3 ? 0.035 : 0.055, i % 3 ? 0.035 : 0.055, (dx, dy) => goldM(K, dx, dy, sd + i, 0.5), { bv: 0.5 }); }
      K.tube(S, [[cx, cy], [cx - 0.12, cy - 0.5]], 0.03, 0.012, (t, s) => goldM(K, s, t * 4, sd, 0.4)); K.tube(S, [[cx, cy], [cx + 0.32, cy - 0.1]], 0.04, 0.016, (t, s) => goldM(K, s, t * 4, sd + 1, 0.4)); S.unlock();
      disc(K, S, cx, cy, 0.06, 0.06, (dx, dy) => goldM(K, dx, dy, sd + 3, 0.6), { bv: 0.5 });
      c.save(); c.globalCompositeOperation = 'source-atop'; c.lineCap = 'round'; for (const [dd, col, w] of [[0.012, 'rgba(140,160,210,.3)', 0.02], [0, 'rgba(2,2,8,.85)', 0.026]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(cx - 0.55, cy - 0.55 + dd); c.lineTo(cx - 0.2, cy - 0.15 + dd); c.lineTo(cx - 0.28, cy + 0.2 + dd); c.lineTo(cx + 0.1, cy + 0.72 + dd); c.stroke(); } c.restore(); }
    else { // a great gear of the clockwork, half sunk in the floor, its teeth worn, a hand lying by it
      const cx = 0.0, cy = -0.55, r = 0.66;
      disc(K, S, cx, cy, r, r * 0.92, (dx, dy, e) => { goldM(K, dx * 2, dy * 2, sd, 0.2, 0.25); if (e > 0.58 && e < 0.66) K.M.ao *= 0.7; }, { bv: 0.1, rf: a => 1 + 0.12 * ss(0.3, 0.6, Math.abs(Math.sin(a * 9))) });
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; socket(c, cx + Math.cos(a) * r * 0.36, cy + Math.sin(a) * r * 0.33, 0.07, 0.065, 'rgba(255,220,150,.3)'); }
      disc(K, S, cx, cy, 0.14, 0.13, (dx, dy) => goldM(K, dx * 2, dy * 2, sd + 1, 0.6), { bv: 0.4 });
      c.save(); c.globalCompositeOperation = 'destination-out'; const g = c.createLinearGradient(0, -0.02, 0, 0.18); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.4, 'rgba(0,0,0,1)'); c.fillStyle = g; c.fillRect(-1, -0.02, 2, 0.4); c.restore();   // (sunk into the floor)
      lump(K, S, 0, -0.02, 0.78, 0.08, { amp: 0.25, fr: 3, sd, bump: 0.4, leaf: 14, flat: 0.7, mat: (dx, dy, ao, e, nz, wx, wy) => tombM(K, wx * 3, wy * 3, sd, 1.1) }); S.unlock();
      K.tube(S, [[0.4, 0.06], [0.95, -0.04]], 0.045, 0.012, (t, s) => goldM(K, s, t * 4, sd + 2, 0.4)); S.unlock(); }
    cracks(c, R, 6, -0.9, 0.7, -1.6, -0.2, 0.45, 0.05);
    pebbles(K, S, 5, -1.0, 1.0, 0.0, 0.14, (x, y, i) => tombM(K, x * 3, y * 3, sd + i, 1.1), sd + 5);
    sheen(c, -1.0, -1.7, 0.4, -0.3, GOLD, 0.14); pool(K, S, -0.6, 0.03, 0.3, 0.07, sd, L); S.unlock(); K.ink(S, INK[L], 0.45); }
  /* ---- the Hall in Two Ages (ages): v 0 its youth, v 1 its ruin ---- */
  const fl = (u, n) => 0.78 + 0.22 * Math.pow(Math.abs(Math.cos(u * Math.PI * n)), 0.6);   // (a column's flutes)
  function lichen(c, R, n, x0, x1, y0, y1) { c.save(); c.globalCompositeOperation = 'source-atop'; for (let i = 0; i < n; i++) { const x = lerp(x0, x1, R()), y = lerp(y0, y1, R()), r = 0.03 + R() * 0.07; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(120,140,96,${0.35 + R() * 0.25})`); g.addColorStop(1, 'rgba(120,140,96,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); } c.restore(); }
  function chip(c, pts) { c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.restore(); }
  /* ---- carved ornament (v463 SE detail pass: the Two Ages and the Stairs; each leaves the surface unlocked) ---- */
  // an acanthus leaf seen from the front: a lobed mass with a sunk rib, its tip curled over; gd [wear, tarnish] gilds its rim
  function leaf(K, S, x, y, w, h, sd, mm, gd, lean) { lean = lean || 0;
    lump(K, S, x, y - h * 0.5, w * 0.5, h * 0.5, { amp: 0.3, fr: 5.5, sd, bump: 0.6, leaf: 16, mat: (dx, dy, ao, e, nz, wx, wy) => { mm(wx, wy); const rib = Math.abs(dx + dy * lean * 0.3) < 0.1; if (rib) K.M.ao *= 0.7; else if (Math.abs(Math.sin(Math.atan2(dy, dx) * 5)) < 0.25) K.M.ao *= 0.82; if (gd && (e > 0.84 || (rib && dy < -0.3))) goldM(K, wx * 6, wy * 6, sd, gd[0], gd[1]); } });
    K.ball(S, x + lean * w * 0.3, y - h * 0.92, w * 0.26, h * 0.14, (dx, dy) => { if (gd) goldM(K, dx * 3, dy * 3, sd + 1, gd[0], gd[1]); else mm(x + dx * 0.1, y + dy * 0.1); }); S.unlock(); }
  const spiralP = (x, y, r, s0, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, a = t * TAU * 1.6, rr = r * (1 - 0.72 * t); o.push([x + s0 * Math.sin(a) * rr, y - Math.cos(a) * rr * 0.95]); } return o; };
  // a volute: a scroll curling outward (s0) to its eye; mat(t, s)
  function volute(K, S, x, y, r, s0, mat) { K.tube(S, spiralP(x, y, r, s0, 26), r * 0.26, r * 0.1, (t, s2) => mat(t * 3, s2)); K.ball(S, x, y, r * 0.17, r * 0.17, (dx, dy) => mat(dx, dy)); S.unlock(); }
  // a gilt rosette of eight petals round a boss
  function rosette(K, S, x, y, r, sd, wear, tar) { const w = wear == null ? 0.6 : wear; disc(K, S, x, y, r, r, (dx, dy, e) => { goldM(K, dx * 3, dy * 3, sd, w, tar); const a = Math.atan2(dy, dx); if (Math.abs(Math.sin(a * 4)) > 0.85 && e > 0.3) K.M.ao *= 0.7; }, { bv: 0.45, dome: 0.5, rf: a => 0.74 + 0.26 * Math.pow(Math.abs(Math.cos(a * 4)), 0.6) });
    K.ball(S, x, y, r * 0.3, r * 0.3, (dx, dy) => goldM(K, dx, dy, sd + 1, Math.min(1, w + 0.2), tar)); S.unlock(); }
  // a row of beads (bead and reel)
  function beads(K, S, x0, x1, y, r, mat) { const n = Math.max(2, Math.round((x1 - x0) / (r * 2.6))); for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); K.ball(S, x, y, r * (i % 2 ? 0.6 : 1), r, (dx, dy) => mat(dx + x, dy)); } S.unlock(); }
  // moss in a cushion
  function moss(K, S, x, y, rx, ry, sd) { lump(K, S, x, y, rx, ry, { amp: 0.35, fr: 5, sd, bump: 0.8, leaf: 40, flat: 0.6, mat: (dx, dy, ao, e, nz, wx, wy) => { const M = K.M, t = 0.75 + 0.4 * K.vn(wx * 30 + sd, wy * 30); M.r = 0.3 * t; M.g = 0.42 * t; M.b = 0.2 * t; M.rg = 0.95; if (K.vn(wx * 60, wy * 60 + sd) > 0.8) { M.r = 0.55; M.g = 0.62; M.b = 0.3; } } }); S.unlock(); }
  // egg-and-dart carved along a band (2D)
  function eggdart(c, x0, x1, y, h, a, lip) { const n = Math.max(2, Math.round((x1 - x0) / (h * 0.9))), w = (x1 - x0) / n; for (let i = 0; i < n; i++) { const x = x0 + w * (i + 0.5); groove(c, arcP(x, y, w * 0.34, 0, TAU, 14, h * 0.42 / (w * 0.34)), h * 0.09, a, lip, true); groove(c, [[x + w * 0.5, y - h * 0.32], [x + w * 0.5, y + h * 0.36]], h * 0.07, a * 0.8, lip); } }
  // water stains run down a face (2D)
  function stains(c, R, n, x0, x1, y0, y1, col) { c.save(); c.globalCompositeOperation = 'source-atop'; for (let i = 0; i < n; i++) { const x = lerp(x0, x1, R()), w = 0.03 + R() * 0.08, ya = lerp(y0, y1, R() * 0.5), yb = ya + (y1 - ya) * (0.4 + R() * 0.6), g = c.createLinearGradient(0, ya, 0, yb), a = 0.1 + R() * 0.16;
      g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.7, `rgba(${col},${a * 0.6})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.moveTo(x - w / 2, ya); c.quadraticCurveTo(x, ya - 0.02, x + w / 2, ya); c.lineTo(x + w * 0.2, yb); c.lineTo(x - w * 0.2, yb); c.closePath(); c.fill(); } c.restore(); }
  // a fresh break in a face: the paler stone under the skin, its lower lip in shadow (2D)
  function nick(c, pts, fresh, dark) { c.save(); c.globalCompositeOperation = 'source-atop'; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = fresh || 'rgba(255,250,236,.4)'; c.fill();
    const h = Math.floor(pts.length / 2); c.strokeStyle = dark || 'rgba(50,40,30,.55)'; c.lineWidth = 0.014; c.beginPath(); for (let i = h; i < pts.length; i++) i === h ? c.moveTo(pts[i][0], pts[i][1]) : c.lineTo(pts[i][0], pts[i][1]); c.lineTo(pts[0][0], pts[0][1]); c.stroke(); c.restore(); }
  // a line of violet light (a joint, a seam) (2D)
  function glowLine(c, pts, w, a) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (const [lw, col] of [[w * 3, `rgba(142,107,208,${0.3 * a})`], [w, `rgba(226,212,255,${0.85 * a})`]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); pts.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } c.restore(); }
  // the stairs' runes, cut and burning violet (2D)
  const RUNES = [[[[0, -0.5], [0, 0.5]], [[-0.3, -0.2], [0, -0.5], [0.3, -0.2]], [[-0.3, 0.2], [0, 0.5], [0.3, 0.2]]], [[[-0.3, -0.5], [0.3, -0.5], [-0.3, 0.5], [0.3, 0.5], [-0.3, -0.5]]], [[[0, -0.5], [0, 0.5]], [[0, -0.1], [0.32, -0.36]], [[0, 0.2], [-0.32, -0.06]]],
    [[[-0.3, 0.5], [0, -0.5], [0.3, 0.5]], [[-0.16, 0.08], [0.16, 0.08]]], [[[-0.3, -0.5], [-0.3, 0.5]], [[0.3, -0.5], [0.3, 0.5]], [[-0.3, 0], [0.3, 0]]], [[[0.3, -0.5], [-0.2, -0.1], [0.2, 0.1], [-0.3, 0.5]]]];
  function rune(c, x, y, s, i, a) { const G = RUNES[((Math.round(i) % RUNES.length) + RUNES.length) % RUNES.length], P2 = G.map(l => l.map(([u, v]) => [x + u * s, y + v * s]));
    for (const l of P2) groove(c, l, s * 0.16, 0.8, 'rgba(201,176,255,.3)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; for (const [w, col] of [[s * 0.3, `rgba(142,107,208,${0.35 * a})`], [s * 0.08, `rgba(232,220,255,${0.9 * a})`]]) { c.strokeStyle = col; c.lineWidth = w; for (const l of P2) { c.beginPath(); l.forEach((p, j) => j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } } c.restore(); }
  // a shard of void crystal floating, its light under it
  function floatShard(K, S, x, y, r, ang) { S.unlock(); halo(S.c, x, y, r * 4, VIOD, 0.3); prism(K, S, x, y + r * 1.2, r * 0.7, r, r * 1.4, r * 1.2, ang, (f, q, wt) => crystalM(K, VIOC, f, q, wt, 0.6)); S.unlock(); }
  const brokeTop = (K, sd) => (x2, h2, a, b, c2, d, ey) => { marbleM(K, x2 * 3, (ey || 0) * 3, sd + 9, { ruin: true, tone: 1.06 }); if (K.vn(x2 * 20 + 3, (ey || 0) * 20) > 0.6) K.M.ao *= 0.72; };
  const fluteAo = (K, u, n) => { const q = Math.abs(Math.cos(u * Math.PI * n)); K.M.ao *= 0.6 + 0.4 * Math.pow(q, 0.45); if (q > 0.96) { K.M.r *= 1.06; K.M.g *= 1.06; K.M.b *= 1.05; } };

  /* ---- the Hall in Two Ages (ages) ---- */
  // a column of the gallery: stepped plinth with a carved panel, an Attic base, a fluted shaft, a Corinthian capital (two rows
  // of acanthus gilded at their tips, gilt volutes, an abacus with egg-and-dart and a rosette). The ruin: broken off, chipped,
  // stained; a drum fallen at its foot, a stub of drum with a piece of the capital on it
  function paintSilverpillar(K, S, v, L) { const sd = 51 + v * 3, R = K.R1(sd), c = S.c, ru = !!v, mo = { ruin: ru }, gw = ru ? 0 : 0.6, gt = ru ? 0.5 : 0, GD = ru ? [0, 0.5] : [0.6, 0], mm = (u, h) => marbleM(K, u, h, sd, mo), gm = (u, h) => goldM(K, u * 5, h * 5, sd, gw, gt), lm = (u, h) => mm(u * 3, h * 3);
    contact(K, S, ru ? 0.95 : 0.78, 0.27, 0.58);
    box(K, S, 0, 0.02, 0.46, 0.38, 0, 0.07, 0.025, (f, u, vv) => marbleM(K, u * 2, vv * 2, sd + 8, { ruin: ru, tone: 0.86 }));
    box(K, S, 0, 0, 0.4, 0.33, 0.07, 0.28, 0.025, (f, u, vv) => { mm(u * 2, vv * 2); if (f === 'f' && band(vv, 0.235, 0.255)) gm(u, vv); });
    groove(c, rectP(-0.3, -0.1, 0.3, 0.0), 0.012, 0.45, null, true); rosette(K, S, 0, -0.05, 0.045, sd, gw, gt);
    const yb = -0.28; K.rev(S, 0, yb, h => h < 0.07 ? 0.3 + 0.035 * Math.sin(h / 0.07 * Math.PI) : h < 0.11 ? 0.265 - 0.018 * Math.sin((h - 0.07) / 0.04 * Math.PI) : h < 0.17 ? 0.272 + 0.022 * Math.sin((h - 0.11) / 0.06 * Math.PI) : 0.25, 0, 0.2, { mat: (u, h) => { mm(u * 2, h * 2); if (h > 0.17) gm(u, h * 2); else if (h > 0.07 && h < 0.11) K.M.ao *= 0.75; } }); S.unlock();
    const Hs = ru ? 1.0 : 1.66, ys = yb - 0.2, yT = ys - Hs;
    K.rev(S, 0, ys, h => 0.235 - 0.035 * Math.pow(h / 1.66, 1.4), 0, Hs, { top: ru, bump: 0.04, mat: (u, h) => { mm(u * 1.4, h * 1.2); fluteAo(K, u, 9); }, capMat: brokeTop(K, sd) }); S.unlock();
    if (!ru) { K.rev(S, 0, yT, h => 0.198 + 0.026 * Math.sin(h / 0.06 * Math.PI), 0, 0.06, { mat: (u, h) => goldM(K, u * 5, h * 9, sd, 0.6) }); S.unlock();
      const yc = yT - 0.06; K.rev(S, 0, yc, h => lerp(0.19, 0.29, Math.pow(h / 0.36, 1.6)), 0, 0.36, { mat: (u, h) => { mm(u * 2, h * 2); K.M.ao *= 0.78; } }); S.unlock();
      for (const x of [-0.18, -0.06, 0.06, 0.18]) leaf(K, S, x, yc - 0.02, 0.15, 0.32, sd + 11 + x * 40, lm, GD, x * 2);
      for (const x of [-0.23, -0.115, 0, 0.115, 0.23]) leaf(K, S, x, yc + 0.07, 0.14 - Math.abs(x) * 0.08, 0.24, sd + 17 + x * 40, lm, GD, x * 2.5);
      box(K, S, 0, yc - 0.36, 0.37, 0.3, 0, 0.1, 0.02, (f, u, vv) => { mm(u * 3, vv * 3); if (f === 'f' && vv < 0.025) gm(u, vv); });
      eggdart(c, -0.32, 0.32, yc - 0.31, 0.06, 0.45);
      for (const s0 of [-1, 1]) volute(K, S, s0 * 0.27, yc - 0.24, 0.085, s0, (t, s2) => goldM(K, t + s0, s2, sd + 3, 0.6));
      rosette(K, S, 0, yc - 0.31, 0.04, sd + 4, 0.7);
      sheen(c, -0.4, -2.8, 0.3, -0.4, '#FFFFFF', 0.12); }
    else { chip(c, [[-0.3, yT - 0.14], [0.3, yT - 0.14], [0.3, yT + 0.05], [0.18, yT + 0.11], [0.07, yT - 0.01], [-0.06, yT + 0.15], [-0.16, yT + 0.04], [-0.3, yT + 0.11]]);
      chip(c, [[0.26, -0.95], [0.16, -0.86], [0.26, -0.76]]); chip(c, [[-0.26, -0.66], [-0.18, -0.58], [-0.26, -0.5]]);
      nick(c, [[0.06, -1.12], [0.19, -1.14], [0.2, -1.0], [0.08, -1.02]]); nick(c, [[-0.18, -0.42], [-0.07, -0.44], [-0.1, -0.33]]);
      stains(c, R, 7, -0.22, 0.22, yT + 0.1, -0.2, '96,84,60');
      // a drum fallen to the right, its broken face to us; a stub of drum at the left, a piece of the capital lying on it
      K.tube(S, [[0.3, -0.12], [0.74, -0.08]], 0.19, 0.19, (t, s2) => { marbleM(K, t * 2, s2, sd + 5, mo); K.M.ao *= 0.6 + 0.4 * Math.pow(Math.abs(Math.cos(s2 * Math.PI * 2.2)), 0.45); }); S.unlock();
      disc(K, S, 0.76, -0.08, 0.06, 0.19, (dx, dy) => { marbleM(K, dx, dy * 3, sd + 6, { ruin: true, tone: 1.08 }); if (K.vn(dx * 9, dy * 20) > 0.6) K.M.ao *= 0.75; }, { bv: 0.3 }); S.unlock();
      K.rev(S, -0.58, 0.04, h => 0.18 - 0.01 * h, 0, 0.26, { top: true, mat: (u, h) => { marbleM(K, u * 2, h * 2, sd + 7, mo); fluteAo(K, u, 9); }, capMat: brokeTop(K, sd + 2) }); S.unlock();
      volute(K, S, -0.74, -0.34, 0.07, -1, (t, s2) => goldM(K, t, s2, sd + 3, 0, 0.5));
      moss(K, S, 0.6, -0.27, 0.12, 0.04, sd + 3);
      lichen(c, R, 12, -0.8, 0.95, -1.4, 0.02); cracks(c, R, 8, -0.25, 0.25, -1.4, -0.3, 0.5, 0.06, 'rgba(255,255,255,.35)'); }
    pebbles(K, S, ru ? 7 : 2, -0.8, 0.9, 0.02, 0.15, (x, y, i) => marbleM(K, x * 3, y * 3, sd + i, mo), sd + 7);
    K.ink(S, INK[L], 0.4); }
  // a sundial: stepped base with a carved panel and rosette, acanthus round the foot of a turned baluster, the gilded dial on
  // its cap with its gnomon. The ruin: chipped, stained, moss on it, the gnomon snapped and lying at its foot, a vine
  function paintSunclock(K, S, v, L) { const sd = 57 + v * 3, R = K.R1(sd), c = S.c, ru = !!v, mo = { ruin: ru }, gw = ru ? 0 : 0.6, gt = ru ? 0.5 : 0, GD = ru ? [0, 0.5] : [0.6, 0], mm = (u, h) => marbleM(K, u, h, sd, mo);
    contact(K, S, 0.76, 0.26, 0.58);
    box(K, S, 0, 0.02, 0.5, 0.36, 0, 0.06, 0.02, (f, u, vv) => marbleM(K, u * 2, vv * 2, sd + 8, { ruin: ru, tone: 0.86 }));
    box(K, S, 0, 0, 0.44, 0.32, 0.06, 0.24, 0.03, (f, u, vv) => { mm(u * 2, vv * 2); if (f === 'f' && band(vv, 0.2, 0.215)) goldM(K, u * 5, vv * 5, sd, gw, gt); });
    groove(c, rectP(-0.34, -0.07, 0.34, 0.03), 0.012, 0.45, null, true); for (const x of [-0.2, 0.2]) groove(c, ptsQ(x - 0.1, -0.01, x, -0.07, x + 0.1, -0.01, 8), 0.01, 0.35); rosette(K, S, 0, -0.02, 0.035, sd + 1, gw, gt);
    const H = 0.92, by = -0.24; K.rev(S, 0, by, h => { const t = h / H; return t < 0.08 ? 0.24 : t < 0.14 ? 0.18 : t < 0.5 ? 0.12 + 0.11 * Math.sin((t - 0.14) / 0.36 * Math.PI * 0.5) : t < 0.86 ? 0.23 - 0.12 * ss(0.5, 0.86, t) : t < 0.92 ? 0.15 : 0.22; }, 0, H, { bump: 0.05, mat: (u, h) => { mm(u * 2, h * 2); const t = h / H; if (Math.abs(h - H * 0.5) < 0.02 || Math.abs(h - H * 0.89) < 0.02) goldM(K, u * 5, h * 9, sd, gw, gt); else if (t > 0.52 && t < 0.86) fluteAo(K, u, 10); } }); S.unlock();
    for (const x of [-0.15, -0.05, 0.05, 0.15]) leaf(K, S, x, -0.17, 0.1, 0.22, sd + 13 + x * 40, (u, h) => mm(u * 3, h * 3), GD, x * 3);
    const top = by - H; K.rev(S, 0, top, h => 0.38, 0, 0.06, { top: true, mat: (u, h) => mm(u * 3, h * 3), capMat: (x2, h2, a, b, c2, d, ey) => { const r = Math.hypot(x2 / 0.38, ey || 0); if (r < 0.84) goldM(K, x2 * 4, (ey || 0) * 3, sd + 3, ru ? 0.1 : 0.7, ru ? 0.4 : 0); else marbleM(K, x2 * 3, (ey || 0) * 3, sd + 2, mo); } }); S.unlock();
    eggdart(c, -0.34, 0.34, top + 0.1, 0.035, 0.4);
    { const y = top - 0.06; c.save(); c.globalCompositeOperation = 'source-atop'; c.strokeStyle = 'rgba(70,46,14,.85)'; c.lineWidth = 0.014; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r0 = i % 3 ? 0.22 : 0.18; c.beginPath(); c.moveTo(Math.cos(a) * r0, y + Math.sin(a) * r0 * 0.34); c.lineTo(Math.cos(a) * 0.3, y + Math.sin(a) * 0.3 * 0.34); c.stroke(); } c.restore();
      K.tube(S, ru ? [[0, y], [0.04, y - 0.12]] : [[-0.02, y + 0.02], [0.0, y - 0.42], [0.14, y - 0.44]], 0.028, 0.012, (t, s) => goldM(K, s, t * 4, sd + 2, 0.6)); S.unlock(); rosette(K, S, 0, y, 0.05, sd + 4, ru ? 0.1 : 0.7, ru ? 0.4 : 0); }
    if (ru) { chip(c, [[0.1, -0.76], [0.3, -0.76], [0.26, -0.5], [0.16, -0.58]]); chip(c, [[0.44, -0.12], [0.36, -0.07], [0.44, 0.0]]); nick(c, [[-0.3, -0.02], [-0.2, -0.04], [-0.22, 0.03]]);
      K.tube(S, [[0.32, 0.08], [0.62, 0.03]], 0.026, 0.012, (t, s) => goldM(K, s, t * 4, sd + 5, 0.1, 0.45)); S.unlock();
      moss(K, S, -0.3, -0.27, 0.14, 0.045, sd + 3); moss(K, S, 0.24, top - 0.04, 0.1, 0.035, sd + 4);
      stains(c, R, 7, -0.4, 0.4, top, -0.05, '96,84,60'); lichen(c, R, 9, -0.45, 0.45, -1.1, 0.02); cracks(c, R, 7, -0.4, 0.4, -1.1, -0.05, 0.5, 0.05, 'rgba(255,255,255,.35)');
      K.tube(S, ptsQ(-0.4, -0.02, -0.5, -0.4, -0.3, -0.7, 8), 0.02, 0.01, (t) => { const M = K.M; M.r = 0.42; M.g = 0.6; M.b = 0.36; M.ao *= 0.7 + 0.3 * t; }); S.unlock(); }
    else sheen(c, -0.5, -1.3, 0.2, -0.1, '#FFFFFF', 0.14);
    K.ink(S, INK[L], 0.4); }
  // a bench: the backrest a carved panel with gilt inlay and a rosette, scrolls at its ends and a palmette on its crest; the
  // seat's moulded edge with a gilt meander and beads; scroll legs on lion paws. The ruin: the back broken, a leg gone, the
  // seat's end fallen, moss and stains
  function paintMarblebench(K, S, v, L) { const sd = 61 + v * 3, R = K.R1(sd), c = S.c, ru = !!v, mo = { ruin: ru }, gw = ru ? 0 : 0.6, gt = ru ? 0.5 : 0, GD = ru ? [0, 0.5] : [0.6, 0], mm = (u, h) => marbleM(K, u, h, sd, mo), gm = (u, h) => goldM(K, u * 5, h * 5, sd, gw, gt);
    contact(K, S, 0.92, 0.28, 0.58);
    const bw = ru ? 0.36 : 0.64, bx = ru ? -0.3 : 0, bz1 = ru ? 0.72 : 0.86;
    box(K, S, bx, -0.2, bw, 0.06, 0.44, bz1, 0.03, (f, u, vv) => { mm(u * 2 + 4, vv * 2); if (f === 'f' && (band(vv, 0.49, 0.505) || band(vv, bz1 - 0.06, bz1 - 0.045))) gm(u, vv); });
    { const x0 = bx - bw + 0.1, x1 = bx + bw - 0.1, y0 = -0.18 - (bz1 - 0.08), y1 = -0.69; groove(c, rectP(x0, y0, x1, y1), 0.014, 0.5, null, true);
      if (!ru) { c.save(); c.globalCompositeOperation = 'source-atop'; c.strokeStyle = 'rgba(214,170,80,.9)'; c.lineWidth = 0.014; c.strokeRect(x0 + 0.04, y0 + 0.04, x1 - x0 - 0.08, y1 - y0 - 0.08); c.restore(); } }
    if (!ru) { rosette(K, S, 0, -0.83, 0.07, sd + 2, 0.6); for (const s0 of [-1, 1]) leaf(K, S, s0 * 0.3, -0.76, 0.1, 0.13, sd + s0 * 5, (u, h) => mm(u * 3, h * 3), GD, s0 * 1.2);
      for (const s0 of [-1, 1]) volute(K, S, s0 * 0.6, -1.08, 0.1, s0, (t, s2) => goldM(K, t + s0, s2, sd + 5, 0.6));
      leaf(K, S, 0, -1.04, 0.16, 0.24, sd + 9, (u, h) => mm(u * 3, h * 3), GD, 0); }
    else { chip(c, [[0.0, -1.0], [0.1, -1.0], [0.06, -0.7], [-0.02, -0.78]]); nick(c, [[-0.5, -0.86], [-0.38, -0.87], [-0.4, -0.78]]); volute(K, S, -0.62, -0.94, 0.09, -1, (t, s2) => goldM(K, t, s2, sd + 5, 0, 0.5)); }
    for (const x of [-0.5, 0.5]) { if (ru && x > 0) continue; const s0 = x < 0 ? -1 : 1;
      K.tube(S, ptsQ(x, -0.22, x + s0 * 0.1, -0.1, x + s0 * 0.02, 0.02, 10), 0.06, 0.045, (t, s2) => { mm(t * 2 + x, s2); if (Math.abs(s2) < 0.2) K.M.ao *= 0.85; }); S.unlock();
      lump(K, S, x + s0 * 0.03, 0.05, 0.1, 0.055, { amp: 0.1, fr: 3, sd: sd + x * 9, bump: 0.4, leaf: 16, flat: 0.6, mat: (dx, dy, ao, e, nz, wx, wy) => mm(wx * 3, wy * 3) });
      for (const k of [-1, 0, 1]) K.ball(S, x + s0 * 0.03 + k * 0.055, 0.075, 0.03, 0.025, (dx, dy) => { mm(dx + k, dy); K.M.ao *= 0.9; }); S.unlock();
      volute(K, S, x + s0 * 0.02, -0.24, 0.075, -s0, (t, s2) => mm(t * 2, s2)); }
    const seat = (cx, hw, by, z0) => box(K, S, cx, by, hw, 0.26, z0, z0 + 0.12, 0.04, (f, u, vv) => mm(u * 2, vv * 2));
    if (!ru) { seat(0, 0.7, 0, 0.34); K.tube(S, [[-0.68, -0.37], [0.68, -0.37]], 0.022, 0.022, (t, s2) => mm(t * 6, s2)); S.unlock(); beads(K, S, -0.64, 0.64, -0.245, 0.014, (u, h) => goldM(K, u * 6, h * 6, sd, 0.6));
      { const y = -0.31; c.save(); c.globalCompositeOperation = 'source-atop'; c.strokeStyle = 'rgba(214,170,80,.9)'; c.lineWidth = 0.011; c.beginPath(); c.moveTo(-0.64, y - 0.035); c.lineTo(0.64, y - 0.035); c.moveTo(-0.64, y + 0.03); c.lineTo(0.64, y + 0.03); for (let x = -0.6; x < 0.6; x += 0.08) { c.moveTo(x, y + 0.02); c.lineTo(x, y - 0.02); c.lineTo(x + 0.04, y - 0.02); c.lineTo(x + 0.04, y + 0.005); c.lineTo(x + 0.02, y + 0.005); } c.stroke(); c.restore(); }
      sheen(c, -0.7, -1.1, 0.3, -0.1, '#FFFFFF', 0.12); }
    else { seat(-0.32, 0.38, 0, 0.34); seat(0.46, 0.3, 0.06, 0); chip(c, [[0.07, -0.38], [0.0, -0.27], [0.08, -0.25]]); nick(c, [[0.3, 0.06], [0.44, 0.04], [0.42, 0.12]]);
      moss(K, S, -0.55, -0.42, 0.14, 0.05, sd + 3); moss(K, S, 0.6, -0.08, 0.12, 0.04, sd + 4);
      stains(c, R, 6, -0.66, 0.0, -0.9, -0.25, '96,84,60'); lichen(c, R, 9, -0.7, 0.8, -0.8, 0.02); cracks(c, R, 6, -0.6, 0.6, -0.7, -0.05, 0.5, 0.05, 'rgba(255,255,255,.35)');
      pebbles(K, S, 5, -0.2, 0.9, 0.02, 0.15, (x, y, i) => marbleM(K, x * 3, y * 3, sd + i, mo), sd + 7); }
    K.ink(S, INK[L], 0.4); }
  // an arch of the gallery: fluted columns on Attic bases with acanthus capitals and moulded imposts (gilt beads), the arch of
  // nine voussoirs with gilt rosettes, a gilt bead along its soffit, a moulded archivolt banded in gold, a keystone carved with
  // a leaf between two scrolls. The ruin: half fallen, its stones on the floor, moss on the broken tops, stains
  function paintAgesarch(K, S, v, L) { const sd = 67 + v * 3, R = K.R1(sd), c = S.c, ru = !!v, mo = { ruin: ru }, gw = ru ? 0 : 0.6, gt = ru ? 0.5 : 0, GD = ru ? [0, 0.5] : [0.6, 0], mm = (u, h) => marbleM(K, u, h, sd, mo);
    contact(K, S, 1.2, 0.32, 0.58);
    const col = (x, H) => { const brk = H < 1.5;
      box(K, S, x, 0.02, 0.22, 0.22, 0, 0.16, 0.02, (f, u, vv) => { marbleM(K, u * 3, vv * 3, sd + x * 5, mo); if (f === 'f' && band(vv, 0.11, 0.125)) goldM(K, u * 5, vv * 5, sd, gw, gt); });
      K.rev(S, x, -0.16, h => h < 0.06 ? 0.17 + 0.025 * Math.sin(h / 0.06 * Math.PI) : h < 0.09 ? 0.15 : 0.155 + 0.015 * Math.sin((h - 0.09) / 0.05 * Math.PI), 0, 0.14, { mat: (u, h) => mm(u * 3 + x, h * 3) }); S.unlock();
      K.rev(S, x, -0.3, h => 0.13 - 0.015 * h / 1.7, 0, H - 0.14, { top: brk, bump: 0.04, mat: (u, h) => { mm(u * 2 + x, h * 1.2); fluteAo(K, u, 12); }, capMat: brokeTop(K, sd) }); S.unlock();
      if (!brk) { const yc = -(0.16 + H);
        K.rev(S, x, yc, h => lerp(0.11, 0.17, h / 0.2), 0, 0.2, { mat: (u, h) => { mm(u * 3, h * 3); K.M.ao *= 0.8; } }); S.unlock();
        for (const dx of [-0.08, 0, 0.08]) leaf(K, S, x + dx, yc + 0.04, 0.09, 0.2, sd + 31 + dx * 50 + x * 7, (u, h) => mm(u * 3, h * 3), GD, dx * 3);
        box(K, S, x, yc - 0.2, 0.24, 0.2, 0, 0.1, 0.02, (f, u, vv) => { mm(u * 3 + x, vv * 3); if (f === 'f' && vv > 0.075) goldM(K, u * 5, vv * 5, sd, gw, gt); });
        beads(K, S, x - 0.21, x + 0.21, yc - 0.14, 0.015, (u, h) => goldM(K, u * 6, h * 6, sd, gw, gt)); } };
    const H = 1.85, top = -(0.16 + H) - 0.3;
    col(-0.78, H); col(0.78, ru ? 0.9 : H);
    const NV = 9, nv = ru ? 5 : NV, a0 = Math.PI, da = Math.PI / NV, aE = a0 + da * nv;
    for (let i = 0; i < nv; i++) { const tn = 0.94 + 0.12 * PH(i, sd, 7); K.tube(S, arcP(0, top, 0.78, a0 + da * i + 0.012, a0 + da * (i + 1) - 0.012, 5, 0.9), 0.15, 0.15, (t, s) => { marbleM(K, t * 2 + i * 3, s, sd + 3, { ruin: ru, tone: tn }); if (Math.abs(s) > 0.8) K.M.ao *= 0.82; }); S.unlock(); }
    for (let i = 1; i < nv; i++) { const a = a0 + da * i; groove(c, [[Math.cos(a) * 0.63, top + Math.sin(a) * 0.63 * 0.9], [Math.cos(a) * 0.93, top + Math.sin(a) * 0.93 * 0.9]], 0.014, 0.6); }
    K.tube(S, arcP(0, top, 0.97, a0, aE, 30, 0.9), 0.05, 0.05, (t, s) => { mm(t * 6, s); if (Math.abs(s) < 0.3) goldM(K, t * 12, s, sd + 4, gw, gt); }); S.unlock();
    for (let a = a0 + 0.05; a < aE - 0.04; a += 0.075) K.ball(S, Math.cos(a) * 0.615, top + Math.sin(a) * 0.615 * 0.9, 0.018, 0.018, (dx, dy) => goldM(K, dx * 3 + a, dy * 3, sd + 6, gw, gt)); S.unlock();
    for (let i = 1; i < nv; i += 2) { const a = a0 + da * (i + 0.5); rosette(K, S, Math.cos(a) * 0.78, top + Math.sin(a) * 0.78 * 0.9, 0.055, sd + i, gw, gt); }
    if (!ru) { const ky = top - 0.78 * 0.9; lump(K, S, 0, ky + 0.02, 0.12, 0.2, { amp: 0.04, fr: 1.5, sd: sd + 8, bump: 0.15, leaf: 8, flat: 0.2, mat: (dx, dy, ao, e, nz, wx, wy) => marbleM(K, wx * 3, wy * 3, sd + 8, { tone: 1.05 }) }); S.unlock();
      for (const s0 of [-1, 1]) volute(K, S, s0 * 0.07, ky - 0.1, 0.05, s0, (t, s2) => goldM(K, t + s0, s2, sd + 9, 0.6));
      leaf(K, S, 0, ky + 0.16, 0.12, 0.3, sd + 12, (u, h) => mm(u * 3, h * 3), GD, 0); rosette(K, S, 0, ky + 0.14, 0.04, sd + 13, 0.7);
      sheen(c, -1.0, -3.0, 0.4, -0.5, '#FFFFFF', 0.12); }
    else { for (const [x, y, w, z, i] of [[0.5, 0.04, 0.2, 0.18, 0], [0.22, -0.02, 0.16, 0.15, 1], [0.98, 0.0, 0.15, 0.13, 2]]) { box(K, S, x, y, w, 0.15, 0, z, 0.04, (f, u, vv) => marbleM(K, u * 3 + x, vv * 3, sd + 6, { ruin: true, tone: 0.95 + i * 0.05 })); nick(c, [[x - w * 0.6, y - z + 0.06], [x - w * 0.2, y - z + 0.055], [x - w * 0.4, y - z * 0.5 + 0.06]]); }
      rosette(K, S, 0.5, -0.04, 0.045, sd + 20, 0, 0.5);
      chip(c, [[0.06, top - 0.92], [0.2, top - 0.92], [0.13, top - 0.74]]);
      moss(K, S, -0.82, top - 0.02, 0.13, 0.045, sd + 5); moss(K, S, 0.8, -1.07, 0.1, 0.04, sd + 6);
      stains(c, R, 9, -0.95, 0.4, top - 0.6, -0.2, '96,84,60'); lichen(c, R, 10, -1.0, 1.0, -2.6, -0.1); cracks(c, R, 8, -0.9, 0.9, -2.6, -0.3, 0.5, 0.06, 'rgba(255,255,255,.35)'); }
    K.ink(S, INK[L], 0.4); }
  // a gilded urn: a plinth and moulded foot; the body gadrooned below, a gilt band of palmettes in relief round its belly, a
  // fluted neck; handles of gold with real volume curling into scrolls, a leaf where each meets the body; a domed fluted lid
  // with a gilt knob and a pine-cone finial. The ruin: toppled from its foot and cracked, a handle snapped, the lid rolled off
  function paintGildedurn(K, S, v, L) { const sd = 71 + v * 3, R = K.R1(sd), c = S.c, ru = !!v, mo = { ruin: ru }, gw = ru ? 0 : 0.6, gt = ru ? 0.5 : 0, mm = (u, h) => marbleM(K, u, h, sd, mo);
    contact(K, S, ru ? 0.95 : 0.72, 0.25, 0.58);
    box(K, S, 0, 0.02, 0.34, 0.3, 0, 0.12, 0.02, (f, u, vv) => { mm(u * 2, vv * 2); if (f === 'f' && band(vv, 0.085, 0.1)) goldM(K, u * 5, vv * 5, sd, gw, gt); });
    K.rev(S, 0, -0.1, h => h < 0.06 ? 0.27 + 0.02 * Math.sin(h / 0.06 * Math.PI) : h < 0.1 ? 0.2 : h < 0.24 ? 0.12 + 0.02 * Math.sin((h - 0.1) / 0.14 * Math.PI) : 0.12 + 0.1 * ss(0.24, 0.32, h), 0, 0.32, { top: ru, mat: (u, h) => { mm(u * 2, h * 2); if (h > 0.06 && h < 0.1) goldM(K, u * 5, h * 9, sd, gw, gt); }, capMat: brokeTop(K, sd) }); S.unlock();
    if (!ru) { const y0 = -0.42, H = 1.0, b0 = 0.36, b1 = 0.52, P0 = h => { const t = h / H; return t < 0.06 ? 0.2 : t < 0.5 ? 0.14 + 0.13 * Math.sin(ss(0.06, 0.5, t) * Math.PI * 0.5) : t < 0.78 ? 0.27 - 0.15 * ss(0.5, 0.78, t) : t < 0.92 ? 0.12 - 0.01 * Math.sin(ss(0.78, 0.92, t) * Math.PI) : 0.12 + 0.05 * ss(0.92, 1, t); };
      K.rev(S, 0, y0, P0, 0, H, { top: true, mat: (u, h) => { const t = h / H; mm(u * 2, h * 2);
          if (t < 0.06 || t > 0.93 || (t > 0.75 && t < 0.78)) goldM(K, u * 5, h * 6, sd, 0.6);
          else if (t > 0.08 && t < 0.34) { fluteAo(K, u, 7); if (t > 0.3) K.M.ao *= 0.9; }
          else if (t > b0 && t < b1) { const pu = ((u * 4.5) % 1 + 1) % 1, tt = (t - b0) / (b1 - b0), fig = Math.abs(pu - 0.5) < 0.32 * Math.sin(tt * Math.PI) * (0.6 + 0.4 * Math.abs(Math.sin(tt * 9))); goldM(K, u * 5, h * 6, sd + 1, fig ? 0.8 : 0.1, fig ? 0 : 0.35); if (!fig) K.M.ao *= 0.72; if (tt < 0.08 || tt > 0.92) K.M.ao *= 0.78; }
          else if (t > 0.8 && t < 0.92) fluteAo(K, u, 10); } }); S.unlock();
      const ys = y0 - H * 0.62, yn = y0 - H * 0.9;
      for (const s0 of [-1, 1]) { K.tube(S, ptsQ(s0 * 0.24, ys, s0 * 0.44, ys - 0.1, s0 * 0.3, yn - 0.06, 14), 0.042, 0.034, (t, s2) => goldM(K, s2 + t * 4, t * 4, sd + 2 + s0, 0.6)); S.unlock();
        volute(K, S, s0 * 0.3, yn - 0.06, 0.05, -s0, (t, s2) => goldM(K, t, s2, sd + 3, 0.7));
        leaf(K, S, s0 * 0.23, ys + 0.06, 0.08, 0.11, sd + 4 + s0, (u, h) => goldM(K, u * 3, h * 3, sd, 0.6), null, -s0); }
      const yl = y0 - H; K.rev(S, 0, yl, h => 0.16 * Math.sqrt(Math.max(0, 1 - Math.pow(h / 0.16, 2))) + 0.02, 0, 0.16, { mat: (u, h) => { mm(u * 3, h * 3); if (h < 0.025) goldM(K, u * 5, h * 9, sd, 0.6); else fluteAo(K, u, 9); } }); S.unlock();
      K.rev(S, 0, yl - 0.16, h => h < 0.03 ? 0.05 : 0.025, 0, 0.06, { mat: (u, h) => goldM(K, u * 5, h * 9, sd + 5, 0.6) }); S.unlock();
      lump(K, S, 0, yl - 0.3, 0.06, 0.09, { amp: 0.05, fr: 2, sd, bump: 0.2, leaf: 8, mat: (dx, dy, ao, e, nz, wx, wy) => { goldM(K, wx * 4, wy * 4, sd + 6, 0.7); if (Math.abs(Math.sin(wx * 60 + Math.abs(wy) * 30)) < 0.3 || Math.abs(Math.sin(wx * 60 - wy * 30)) < 0.3) K.M.ao *= 0.7; } }); S.unlock();
      K.glint(c, -0.1, y0 - H * 0.45, 0.12, 0.55); sheen(c, -0.4, -1.9, 0.2, -0.5, '#FFFFFF', 0.12); }
    else { const ox = 0.36;
      lump(K, S, ox, -0.24, 0.5, 0.21, { amp: 0.04, fr: 1.4, sd, bump: 0.15, leaf: 6, mat: (dx, dy, ao, e, nz, wx, wy) => { marbleM(K, wx * 2, wy * 2, sd + 2, mo);
          if (dx > -0.05 && dx < 0.3) { const pv = ((wy * 9) % 1 + 1) % 1, tt = (dx + 0.05) / 0.35, fig = Math.abs(pv - 0.5) < 0.3 * Math.sin(tt * Math.PI); goldM(K, wx * 5, wy * 5, sd, fig ? 0.3 : 0, fig ? 0.25 : 0.6); if (!fig) K.M.ao *= 0.75; }
          else if (dx < -0.3) K.M.ao *= 0.65 + 0.35 * Math.pow(Math.abs(Math.cos(dy * Math.PI * 5)), 0.5);
          else if (Math.abs(dx - 0.6) < 0.04) goldM(K, wx * 5, wy * 5, sd, 0, 0.5); } }); S.unlock();
      K.tube(S, [[ox + 0.48, -0.26], [ox + 0.74, -0.3]], 0.08, 0.1, (t, s) => { marbleM(K, t * 2, s, sd + 3, mo); fluteAo(K, s * 0.3, 10); }); S.unlock();
      disc(K, S, ox + 0.75, -0.3, 0.05, 0.1, (dx, dy, e) => { if (e > 0.6) goldM(K, dx, dy, sd, 0, 0.5); else { const M = K.M; M.r = 0.08; M.g = 0.07; M.b = 0.06; } }, { bv: 0.4 }); S.unlock();
      K.tube(S, ptsQ(ox - 0.16, -0.42, ox - 0.1, -0.56, ox - 0.02, -0.52, 6), 0.035, 0.03, (t, s2) => goldM(K, s2, t * 4, sd + 4, 0, 0.45)); S.unlock(); nick(c, [[ox - 0.04, -0.57], [ox + 0.01, -0.55], [ox - 0.01, -0.5]]);
      K.tube(S, ptsQ(ox + 0.2, 0.12, ox + 0.26, 0.02, ox + 0.38, 0.08, 8), 0.03, 0.03, (t, s2) => goldM(K, s2, t * 4, sd + 5, 0, 0.45)); S.unlock();
      K.rev(S, -0.52, 0.14, h => 0.13 * Math.sqrt(Math.max(0, 1 - Math.pow(h / 0.12, 2))) + 0.015, 0, 0.12, { mat: (u, h) => { marbleM(K, u * 3, h * 3, sd + 6, mo); if (h < 0.02) goldM(K, u * 5, h * 9, sd, 0, 0.5); else fluteAo(K, u, 9); } }); S.unlock();
      moss(K, S, ox - 0.3, -0.38, 0.14, 0.05, sd + 7);
      stains(c, R, 6, ox - 0.4, ox + 0.5, -0.42, -0.06, '96,84,60'); lichen(c, R, 8, -0.4, 1.1, -0.5, 0.02); cracks(c, R, 7, -0.2, 0.9, -0.42, -0.08, 0.5, 0.05, 'rgba(255,255,255,.35)'); }
    K.ink(S, INK[L], 0.4); }
  // a block of the gallery's entablature: a frieze carved with a laurel wreath round a gilt rosette and garlands swung from
  // gilt studs, egg-and-dart and dentils under its cornice, gilt-banded mouldings, a palmette and a gilt sphere over it. The
  // ruin: tumbled blocks, the relief broken, chipped corners, moss on their tops, stains, a statue's head among them
  function paintRuinblock(K, S, v, L) { const sd = 75 + v * 3, R = K.R1(sd), c = S.c, ru = !!v, mo = { ruin: ru }, gw = ru ? 0 : 0.6, gt = ru ? 0.5 : 0, GD = ru ? [0, 0.5] : [0.6, 0], mm = (u, h) => marbleM(K, u, h, sd, mo);
    contact(K, S, 1.05, 0.32, 0.58);
    const fr = x => (f, u, vv) => marbleM(K, u * 2 + x, vv * 2, sd, mo);
    const mould = (x0, x1, y, r, s0) => { K.tube(S, [[x0, y], [x1, y]], r, r, (t, s2) => { marbleM(K, t * 4 + s0, s2, sd + s0, { ruin: ru, tone: 1.05 }); if (Math.abs(s2) < 0.25) goldM(K, t * 9, s2, sd, gw, gt); }); S.unlock(); };
    const wreath = (x, y, r, n, of) => { for (let i = 0; i < n; i++) { if (of && of(i)) continue; const a = i / n * TAU; leaf(K, S, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.9 + 0.035, 0.05, 0.08, sd + 40 + i, (u, h) => mm(u * 4, h * 4), GD, Math.cos(a) * 1.5); } rosette(K, S, x, y, r * 0.45, sd + 41, gw, gt); };
    const garland = (x0, x1, y, sag) => { const pts = ptsQ(x0, y, (x0 + x1) / 2, y + sag, x1, y, 14); K.tube(S, pts, 0.03, 0.03, (t, s2) => { mm(t * 8, s2); K.M.ao *= 0.7 + 0.3 * Math.pow(Math.abs(Math.cos(t * Math.PI * 14 + s2 * 2)), 0.5); }); for (const p of [pts[0], pts[pts.length - 1]]) K.ball(S, p[0], p[1], 0.025, 0.025, (dx, dy) => goldM(K, dx, dy, sd + 5, gw, gt)); S.unlock(); };
    if (!ru) { box(K, S, 0, 0, 0.8, 0.32, 0, 0.5, 0.04, fr(0)); mould(-0.8, 0.8, 0.07, 0.05, 1);
      for (let x = -0.74; x <= 0.75; x += 0.075) groove(c, [[x, -0.33], [x, -0.37]], 0.024, 0.55);
      eggdart(c, -0.76, 0.76, -0.285, 0.045, 0.45);
      wreath(0, -0.12, 0.09, 12); garland(-0.68, -0.18, -0.21, 0.1); garland(0.18, 0.68, -0.21, 0.1);
      mould(-0.84, 0.84, -0.42, 0.06, 2);
      K.rev(S, 0, -0.56, h => h < 0.05 ? 0.2 : h < 0.12 ? 0.12 : 0.08 + 0.05 * Math.sin((h - 0.12) / 0.16 * Math.PI), 0, 0.28, { top: true, mat: (u, h) => { mm(u * 3, h * 3); if (h < 0.05 && h > 0.035) goldM(K, u * 6, h * 9, sd, 0.6); } }); S.unlock();
      K.ball(S, 0, -0.98, 0.13, 0.13, (dx, dy) => goldM(K, dx, dy, sd, 0.7)); S.unlock(); K.glint(c, -0.05, -1.03, 0.1, 0.6); sheen(c, -0.8, -1.1, 0.2, -0.1, '#FFFFFF', 0.12); }
    else { box(K, S, -0.25, 0.0, 0.5, 0.28, 0, 0.4, 0.05, fr(0)); wreath(-0.3, -0.1, 0.085, 12, i => i > 2 && i < 7); garland(-0.66, -0.42, -0.2, 0.08);
      box(K, S, 0.5, 0.03, 0.34, 0.24, 0, 0.3, 0.05, fr(2)); garland(0.22, 0.72, -0.1, 0.08);
      box(K, S, 0.1, -0.06, 0.38, 0.22, 0.4, 0.68, 0.05, fr(4)); mould(-0.22, 0.46, -0.6, 0.04, 3); eggdart(c, -0.22, 0.42, -0.5, 0.045, 0.45);
      K.ball(S, -0.62, -0.12, 0.16, 0.17, (dx, dy) => marbleM(K, dx * 2, dy * 2, sd + 5, mo)); S.unlock(); socket(c, -0.56, -0.15, 0.03, 0.025, null); socket(c, -0.5, -0.15, 0.03, 0.025, null); groove(c, [[-0.58, -0.06], [-0.5, -0.06]], 0.01, 0.4);
      chip(c, [[-0.76, -0.5], [-0.55, -0.5], [-0.7, -0.2]]); chip(c, [[0.49, -0.76], [0.32, -0.8], [0.49, -0.6]]); chip(c, [[0.85, -0.3], [0.74, -0.32], [0.85, -0.18]]);
      nick(c, [[-0.1, -0.28], [0.04, -0.3], [0.02, -0.18], [-0.08, -0.2]]); nick(c, [[0.36, -0.08], [0.46, -0.1], [0.44, -0.02]]);
      moss(K, S, -0.42, -0.42, 0.15, 0.05, sd + 3); moss(K, S, 0.02, -0.75, 0.12, 0.04, sd + 4); moss(K, S, 0.66, -0.34, 0.1, 0.035, sd + 5);
      stains(c, R, 9, -0.7, 0.8, -0.7, -0.02, '96,84,60'); lichen(c, R, 12, -0.8, 0.9, -0.9, 0.02); cracks(c, R, 8, -0.7, 0.8, -0.85, -0.05, 0.5, 0.05, 'rgba(255,255,255,.35)'); }
    pebbles(K, S, ru ? 7 : 3, -0.9, 0.9, 0.02, 0.15, (x, y, i) => marbleM(K, x * 3, y * 3, sd + i, mo), sd + 3);
    K.ink(S, INK[L], 0.4); }
  /* ---- the Borrowed Stairs (stairs) ---- */
  const rubble = (K, S, n, x0, x1, y0, y1, sd) => pebbles(K, S, n, x0, x1, y0, y1, (x, y, i) => vstoneM(K, x * 3, y * 3, sd + i, 1.2), sd);
  // an obelisk of the void floating over a stepped base cut with runes: its courses and facet edges lit, runes burning down its
  // face, a crystal pyramidion. The second: broken in two, the upper piece hanging over a gap full of floating shards
  function paintVoidobelisk(K, S, v, L) { const sd = 81 + v * 3, R = K.R1(sd), c = S.c, hov = 0.36;
    contact(K, S, 0.62, 0.22, 0.58);
    box(K, S, 0, 0.02, 0.44, 0.34, 0, 0.08, 0.02, (f, u, vv) => vstoneM(K, u * 2, vv * 2, sd + 5, 0.9));
    box(K, S, 0, 0, 0.36, 0.28, 0.08, 0.2, 0.02, (f, u, vv) => { vstoneM(K, u * 2, vv * 2, sd + 6, 1.1); if (f === 'f' && vv > 0.185) { const M = K.M; M.r = lerp(M.r, 0.7, 0.6); M.g = lerp(M.g, 0.52, 0.6); M.b = lerp(M.b, 1, 0.6); M.er = 0.32; M.eg = 0.2; M.eb = 0.6; } });
    for (let i = 0; i < 4; i++) rune(c, -0.24 + i * 0.16, -0.045, 0.07, sd + i, 0.8);
    halo(c, 0, -0.3, 0.5, VIOD, 0.35);
    const seam = (f, q, wt, tp) => { if (tp) { crystalM(K, VIOC, f, q, wt, 0.7); return; } vstoneM(K, q * 0.5 + sd, wt * 3, sd, 1.05); const M = K.M; if (f) M.ao *= 0.74;
      if ((wt * 7) % 1 < 0.03) M.ao *= 0.6;
      if (Math.abs(Math.abs(q) - 0.5) < 0.045) { M.r = lerp(M.r, 0.7, 0.7); M.g = lerp(M.g, 0.52, 0.7); M.b = lerp(M.b, 1, 0.7); M.er = 0.3; M.eg = 0.18; M.eb = 0.6; } };
    if (!v) { prism(K, S, 0, -hov, 0.28, 0.2, 1.9, 0.34, 0, seam); S.unlock(); for (let i = 0; i < 6; i++) rune(c, 0, -hov - 0.22 - i * 0.29, 0.11 - i * 0.008, sd + i * 3, 0.9); }
    else { prism(K, S, 0, -hov, 0.3, 0.25, 0.9, 0, 0, seam); prism(K, S, 0.04, -hov - 1.18, 0.24, 0.18, 0.95, 0.32, 0.06, seam); S.unlock();
      chip(c, [[-0.32, -hov - 0.92], [-0.1, -hov - 0.95], [-0.32, -hov - 0.76]]); chip(c, [[0.32, -hov - 0.86], [0.12, -hov - 0.93], [0.32, -hov - 0.7]]);
      halo(c, 0, -hov - 1.04, 0.36, VIO, 0.5);
      for (let i = 0; i < 3; i++) rune(c, 0, -hov - 0.2 - i * 0.26, 0.1, sd + i * 3, 0.9); for (let i = 0; i < 3; i++) rune(c, 0.04 + 0.06 * (0.2 + i * 0.28), -hov - 1.4 - i * 0.26, 0.09, sd + 9 + i, 0.9);
      for (const [x, y, r, a] of [[-0.2, -hov - 1.02, 0.035, 0.6], [0.22, -hov - 1.08, 0.03, -0.4], [0.02, -hov - 1.0, 0.025, 0.2]]) floatShard(K, S, x, y, r, a); }
    rubble(K, S, 5, -0.5, 0.5, 0.02, 0.14, sd + 3);
    sheen(c, -0.4, -2.6, 0.2, -0.4, VIO, 0.14); K.ink(S, INK[L], 0.5); }
  const stepM = (sd, z1) => (f, u, vv, ao, e) => { vstoneM(K0(), u * 2 + sd, vv * 2, sd); const M = K0().M; if ((f === 'f' && vv > z1 - 0.035) || (f === 't' && vv > -0.03)) { M.r = lerp(M.r, 0.7, 0.6); M.g = lerp(M.g, 0.52, 0.6); M.b = lerp(M.b, 1, 0.6); M.er = 0.32; M.eg = 0.2; M.eb = 0.6; } };
  let KK = null; const K0 = () => KK;
  // a baluster of the stairs' rail (void stone, a violet bead at its waist)
  const baluster = (K, S, x, y, h, sd) => { K.rev(S, x, y, hh2 => { const t = hh2 / h; return t < 0.12 ? 0.06 : t < 0.2 ? 0.04 : 0.035 + 0.025 * Math.sin(clamp((t - 0.2) / 0.7, 0, 1) * Math.PI) ; }, 0, h, { top: true, mat: (u, hh2) => { vstoneM(K, u * 3, hh2 * 3, sd, 1.3); if (Math.abs(hh2 / h - 0.55) < 0.05) { const M = K.M; M.r = 0.7; M.g = 0.5; M.b = 1; M.er = 0.3; M.eg = 0.18; M.eb = 0.6; } } }); S.unlock(); };
  // a step's carving: a joint of violet light between its two blocks, chipped corners, a nick in its nosing (2D)
  function stepCarve(c, s, i) { const { cx, hw, yT, yB } = s, jx = cx + (i % 2 ? 0.2 : -0.18);
    groove(c, [[jx, yT + 0.03], [jx, yB - 0.01]], 0.016, 0.7, 'rgba(201,176,255,.35)'); glowLine(c, [[jx, yT + 0.03], [jx, yB - 0.01]], 0.011, 0.8);
    chip(c, [[cx + hw + 0.01, yT - 0.01], [cx + hw - 0.07, yT - 0.01], [cx + hw + 0.01, yT + 0.06]]); chip(c, [[cx - hw - 0.01, yT + 0.08], [cx - hw + 0.04, yT + 0.12], [cx - hw - 0.01, yT + 0.16]]);
    nick(c, [[cx - 0.1 + i * 0.1, yT + 0.005], [cx + 0.02 + i * 0.1, yT + 0.005], [cx - 0.02 + i * 0.1, yT + 0.05]], 'rgba(120,100,170,.4)', 'rgba(10,4,26,.6)'); }
  // three steps of void stone, each a carved block: nosings lit violet, joints of light, chipped corners, runes in the lowest
  // riser; a balustrade up their left side. The second: broken, its steps lifted apart over crumbling undersides, shards afloat
  function paintStairstub(K, S, v, L) { const sd = 85 + v * 3, R = K.R1(sd), c = S.c; KK = K;
    contact(K, S, 0.92, 0.3, 0.58);
    const st = [];
    for (let i = 2; i >= 0; i--) { const z0 = v ? i * 0.3 + (i ? 0.08 : 0) : 0, z1 = (i + 1) * 0.24 + (v ? i * 0.06 : 0), by = -i * 0.17, cx = v ? (i - 1) * 0.06 : 0, hw = 0.64 - i * 0.06, yT = by - z1 + 0.044;
      st[i] = { cx, hw, yT, yB: i === 0 || v ? by - z0 + 0.044 : yT + 0.2 };
      if (v && i) { lump(K, S, cx, by - z0 + 0.07, hw - 0.12, 0.08, { amp: 0.35, fr: 3.4, sd: sd + i, bump: 0.6, leaf: 12, mat: (dx, dy, ao, e, nz, wx, wy) => { vstoneM(K, wx * 3, wy * 3, sd + i, 0.7); if (dy > 0.3) K.M.ao *= 0.6; } });
        for (const [dx, h] of [[-0.2, 0.12], [0.05, 0.18], [0.24, 0.1]]) prism(K, S, cx + dx, by - z0 + 0.1, 0.035, 0.03, h * 0.5, h * 0.5, Math.PI + dx, (f, q, wt) => vstoneM(K, q + dx * 9, wt, sd + i, 0.75)); S.unlock(); }
      box(K, S, cx, by, hw, 0.13, z0, z1, 0.025, stepM(sd + i, z1)); stepCarve(c, st[i], i); }
    for (const sx of [-0.4, 0.36]) rune(c, st[0].cx + sx, st[0].yT + 0.12, 0.08, sd + sx * 10, 0.85);
    const tops = [0, 1, 2].map(i => [-(0.64 - i * 0.06) + 0.06 + (v ? (i - 1) * 0.06 : 0), -i * 0.17 - (i + 1) * 0.24 - (v ? i * 0.06 : 0) + 0.04]);
    const n = v ? 2 : 3; for (let i = 0; i < n; i++) baluster(K, S, tops[i][0], tops[i][1], 0.42, sd + i);
    K.tube(S, tops.slice(0, n).map(([x, y]) => [x, y - 0.44]), 0.035, 0.03, (t, s2) => { vstoneM(K, t * 4, s2, sd + 7, 1.4); if (Math.abs(s2) < 0.3) { const M = K.M; M.er = 0.16; M.eg = 0.1; M.eb = 0.32; } }); S.unlock();
    for (const [x, y, r, a] of v ? [[0.52, -0.95, 0.035, 0.4], [0.64, -0.68, 0.028, -0.3], [-0.12, -1.3, 0.03, 0.1], [0.3, -1.42, 0.022, -0.5]] : [[0.56, -0.95, 0.03, 0.3], [0.7, -0.62, 0.024, -0.2]]) floatShard(K, S, x, y, r, a);
    rubble(K, S, v ? 8 : 5, -0.8, 0.8, -0.02, 0.13, sd + 5);
    cracks(c, R, 6, -0.6, 0.6, -0.9, -0.1, 0.5, 0.05, 'rgba(201,176,255,.3)'); sheen(c, -0.8, -1.3, 0.2, -0.2, VIO, 0.12); K.ink(S, INK[L], 0.5); }
  // a corner of the kennels: a wall of coursed void stone with a doorway carved into it (an arched dark recess, its threshold
  // lit violet by what lies past it), its frame of carved blocks cut with runes and a crystal keystone; a pilaster with runes
  // and a crystal capital; the hounds' claw marks. The second: taller, its door ajar and brighter
  function paintCornerglow(K, S, v, L) { const sd = 89 + v * 3, R = K.R1(sd), c = S.c, H = v ? 1.75 : 1.45;
    contact(K, S, 0.84, 0.28, 0.58);
    const wm = (f, u, vv) => { vstoneM(K, u * 2, vv * 2, sd, 1.15); const cr = Math.floor(vv / 0.3), fy = vv - cr * 0.3, fx = ((u + (cr % 2) * 0.25) * 2) % 1; if (f === 'f' && (fy < 0.02 || Math.abs(fx) < 0.025)) K.M.ao *= 0.6; };
    box(K, S, 0.02, -0.24, 0.54, 0.07, 0, H, 0.02, wm);
    { c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createRadialGradient(-0.4, -0.5, 0.05, -0.3, -0.6, 0.95); g.addColorStop(0, 'rgba(201,176,255,.6)'); g.addColorStop(0.4, 'rgba(142,107,208,.28)'); g.addColorStop(1, 'rgba(142,107,208,0)'); c.fillStyle = g; c.fillRect(-0.6, -H - 0.3, 1.3, H + 0.3); c.restore(); }
    const Y = z => -0.216 - z, d0 = -0.2, d1 = 0.3, dc = 0.05, dr = 0.25, dz = v ? 1.0 : 0.8;
    c.save(); c.globalCompositeOperation = 'source-atop'; c.beginPath(); c.moveTo(d0, Y(0)); c.lineTo(d0, Y(dz)); c.arc(dc, Y(dz), dr, Math.PI, TAU); c.lineTo(d1, Y(0)); c.closePath();
    { const g = c.createLinearGradient(0, Y(dz + dr), 0, Y(0)); g.addColorStop(0, 'rgba(4,2,12,.97)'); g.addColorStop(0.6, 'rgba(22,10,46,.96)'); g.addColorStop(1, v ? 'rgba(201,176,255,.95)' : 'rgba(142,107,208,.9)'); c.fillStyle = g; c.fill(); }
    c.clip(); { const g = c.createLinearGradient(d0, 0, d0 + 0.12, 0); g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(d0, Y(dz + dr), 0.12, dz + dr + 0.05); }
    if (v) { c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(d1 - 0.14, 0, d1, 0); g.addColorStop(0, 'rgba(201,176,255,0)'); g.addColorStop(1, 'rgba(232,220,255,.7)'); c.fillStyle = g; c.fillRect(d1 - 0.14, Y(dz + dr), 0.14, dz + dr + 0.05); }
    c.restore();
    const fp = [[d0 - 0.05, Y(0) - 0.01], [d0 - 0.05, Y(dz)], ...arcP(dc, Y(dz), dr + 0.05, Math.PI, TAU, 18, 1), [d1 + 0.05, Y(dz)], [d1 + 0.05, Y(0) - 0.01]];
    K.tube(S, fp, 0.05, 0.05, (t, s2) => { vstoneM(K, t * 6, s2, sd + 4, 1.4); if (Math.abs(((t * 9) % 1) - 0.5) > 0.46) K.M.ao *= 0.5; if (Math.abs(s2) < 0.25) { const M = K.M; M.er = 0.1; M.eg = 0.06; M.eb = 0.22; } }); S.unlock();
    for (let i = 0; i < 5; i++) { const a = Math.PI + (i + 0.5) / 5 * Math.PI; if (i === 2) continue; rune(c, dc + Math.cos(a) * (dr + 0.05), Y(dz) + Math.sin(a) * (dr + 0.05), 0.045, sd + i, 0.75); }
    for (const x of [d0 - 0.05, d1 + 0.05]) rune(c, x, Y(dz * 0.5), 0.045, sd + x * 10, 0.75);
    prism(K, S, dc, Y(dz) - dr + 0.04, 0.05, 0.06, 0.1, 0.1, 0, (f, q, wt) => crystalM(K, VIOC, f, q, wt, 0.8)); S.unlock(); halo(c, dc, Y(dz) - dr - 0.06, 0.25, VIO, 0.5);
    box(K, S, dc, -0.2, 0.32, 0.06, 0, 0.04, 0.015, (f, u, vv) => { vstoneM(K, u * 3, vv * 3, sd + 5, 1.3); const M = K.M; M.er = 0.2; M.eg = 0.12; M.eb = 0.4; });
    halo(c, dc, Y(0) - 0.05, 0.45, VIO, v ? 0.6 : 0.4);
    for (let k = 0; k < 3; k++) groove(c, [[0.38 + k * 0.05, -0.98], [0.44 + k * 0.05, -0.62]], 0.016, 0.7, 'rgba(226,212,255,.45)');
    box(K, S, -0.46, 0, 0.08, 0.3, 0, H, 0.02, (f, u, vv) => { wm(f, u, vv); if (f === 'f') { const M = K.M; M.er = 0.16; M.eg = 0.09; M.eb = 0.34; } });
    K.rev(S, -0.46, 0.06, h => h < 0.1 ? 0.11 : h < 0.14 ? 0.09 : 0.075, 0, H - 0.1, { mat: (u, h) => { vstoneM(K, u * 2, h * 2, sd + 3, 1.35); K.M.ao *= fl(u, 2.5); } }); S.unlock();
    for (let i = 0; i < 3; i++) rune(c, -0.46, -0.5 - i * (H - 0.6) / 3, 0.05, sd + 7 + i, 0.6);
    prism(K, S, -0.46, -(H - 0.04), 0.08, 0.09, 0.12, 0.16, 0, (f, q, wt) => crystalM(K, VIOC, f, q, wt, 0.7)); S.unlock();
    box(K, S, 0.02, -0.24, 0.58, 0.1, H, H + 0.1, 0.02, (f, u, vv) => vstoneM(K, u * 2, vv * 2, sd + 1, 1.3)); box(K, S, -0.46, 0, 0.11, 0.33, H, H + 0.1, 0.02, (f, u, vv) => vstoneM(K, u * 2, vv * 2, sd + 2, 1.3));
    chip(c, [[0.6, -H - 0.18], [0.46, -H - 0.18], [0.6, -H - 0.06]]); nick(c, [[0.34, -0.4], [0.46, -0.42], [0.44, -0.32]], 'rgba(120,100,170,.4)', 'rgba(10,4,26,.6)');
    halo(c, -0.32, -0.15, 0.5, VIOD, 0.35);
    cracks(c, R, 5, -0.5, 0.55, -H, -0.1, 0.5, 0.05, 'rgba(201,176,255,.3)'); rubble(K, S, 5, -0.6, 0.7, -0.02, 0.12, sd + 4); K.ink(S, INK[L], 0.5); }
  const SHARDS = [[[0, 0.62, 0.15, 0.95, 0.36, 0.12]], [[-0.22, 0.5, 0.11, 0.7, 0.26, -0.3], [0.2, 0.7, 0.12, 0.85, 0.3, 0.22], [0.0, 1.05, 0.09, 0.55, 0.22, 0.05]]];
  function paintGlassshard(K, S, v, L) { const sd = 93 + v * 3, R = K.R1(sd), c = S.c;
    contact(K, S, 0.55, 0.2, 0.5);
    box(K, S, 0, 0, 0.3, 0.24, 0, 0.22, 0.04, (f, u, vv) => { vstoneM(K, u * 2, vv * 2, sd, 1.1); if (f === 'f' && vv > 0.18) { const M = K.M; M.er = 0.3; M.eg = 0.2; M.eb = 0.6; } });
    for (const [x, y, r, h, tip, a] of SHARDS[v % 2]) { halo(c, x, -y - h * 0.5, 0.45, VIO, 0.3); layer(K, S, 0.88, S2 => { prism(K, S2, x, -y, r * 0.6, r, h * 0.3, 0, Math.PI + a, (f, q, wt) => crystalM(K, VIOC, f, q, wt, 0.4)); prism(K, S2, x, -y, r * 0.6, r, h, tip, a, (f, q, wt) => crystalM(K, VIOC, f, q, wt, 0.55)); });
      K.glint(c, x + Math.sin(a) * (h + tip) * 0.9, -y - Math.cos(a) * (h + tip) * 0.9, 0.1, 0.7); }
    rubble(K, S, 3, -0.5, 0.5, 0.0, 0.12, sd + 3); K.ink(S, INK[L], 0.45); }
  // a lantern: a six-sided iron cage round a glass housing, a pierced cap with a finial and ring, a drip tray; the flame inside
  function lantern(K, S, x, y, r, sd) { const c = S.c, hh = r * 1.05; halo(c, x, y, r * 2.8, '#FFE2B0', 0.42);
    K.rev(S, x, y + hh + r * 0.25, h => r * 0.1 + h / (r * 0.25) * r * 0.48, 0, r * 0.25, { top: true, mat: (u, h) => ironM(K, u * 3, h * 3, sd + 1) }); S.unlock();
    layer(K, S, 0.55, S2 => K.rev(S2, x, y + hh, h => r * (0.48 + 0.06 * Math.sin(h / (2 * hh) * Math.PI)), 0, 2 * hh, { mat: () => glassM(K, GLASSC, 0.3, 0.06) }));
    disc(K, S, x, y + hh * 0.15, r * 0.17, r * 0.32, (dx, dy, e) => { const M = K.M; M.r = 1; M.g = 0.94; M.b = 0.78; M.er = 0.95 * (1 - e * 0.4); M.eg = 0.82 * (1 - e * 0.4); M.eb = 0.6 * (1 - e * 0.5); M.rg = 0.2; }, { bv: 0.3, rf: a => 1 - 0.35 * Math.max(0, -Math.sin(a)) }); S.unlock();
    halo(c, x, y + hh * 0.1, r * 0.9, '#FFE2B0', 0.5);
    for (const a of [Math.PI / 6, Math.PI / 2, Math.PI * 5 / 6]) K.tube(S, [[x + Math.cos(a) * r * 0.55, y - hh], [x + Math.cos(a) * r * 0.55, y + hh]], r * 0.05, r * 0.05, (t, s) => ironM(K, s, t * 3, sd + 2));
    for (const yy of [y - hh, y + hh, y]) K.tube(S, arcP(x, yy, r * 0.56, 0, Math.PI, 12, 0.34), r * (yy === y ? 0.025 : 0.05), r * (yy === y ? 0.025 : 0.05), (t, s) => ironM(K, t * 3, s, sd + 3)); S.unlock();
    K.rev(S, x, y - hh, h => r * 0.06 + r * 0.6 * Math.pow(Math.max(0, 1 - h / (r * 0.55)), 1.3), 0, r * 0.55, { mat: (u, h) => { ironM(K, u * 3, h * 3, sd); if (Math.abs(Math.sin(u / r * 9)) < 0.3 && h > r * 0.12 && h < r * 0.3) { const M = K.M; M.mt = 0; M.r = 0.9; M.g = 0.7; M.b = 0.4; M.er = 0.5; M.eg = 0.36; M.eb = 0.16; } } }); S.unlock();
    K.ball(S, x, y - hh - r * 0.62, r * 0.12, r * 0.12, (dx, dy) => ironM(K, dx, dy, sd + 4)); K.tube(S, arcP(x, y - hh - r * 0.86, r * 0.16, 0, TAU, 14, 1), r * 0.03, r * 0.03, (t, s) => ironM(K, t, s, sd + 5)); S.unlock();
    K.glint(c, x - r * 0.25, y - r * 0.4, r * 0.6, 0.5); }
  const LAMP = [[0.38, -1.62, 0.17], [0, -1.62, 0.2]];
  // a street lamp of the stairs: a stepped foot of void stone cut with runes, a twisted iron post with collars, a stopped clock
  // set in it, a scrolled bracket (the first) or scrolls holding the lantern on the post (the second)
  function paintHourlamp(K, S, v, L) { const sd = 97 + v * 3, c = S.c;
    contact(K, S, 0.55, 0.2, 0.58);
    box(K, S, 0, 0.02, 0.3, 0.26, 0, 0.08, 0.02, (f, u, vv) => vstoneM(K, u * 2, vv * 2, sd + 4, 0.9));
    K.rev(S, 0, -0.08, h => h < 0.08 ? 0.22 : h < 0.14 ? 0.16 : h < 0.22 ? 0.1 + 0.03 * Math.sin((h - 0.14) / 0.08 * Math.PI) : 0.075, 0, 0.32, { top: true, mat: (u, h) => { vstoneM(K, u * 3, h * 3, sd, 1.1); if (h > 0.14 && h < 0.22) { const M = K.M; M.r = 0.6; M.g = 0.45; M.b = 0.95; M.er = 0.25; M.eg = 0.15; M.eb = 0.5; } } }); S.unlock();
    rune(c, -0.12, -0.045, 0.06, sd, 0.7); rune(c, 0.12, -0.045, 0.06, sd + 1, 0.7);
    const [lx, ly, lr] = LAMP[v % 2], pTop = v ? ly + lr * 1.35 : -2.1, cy = v ? -1.02 : -1.12;
    K.tube(S, [[0, -0.38], [0, pTop]], 0.045, 0.035, (t, s2) => { ironM(K, s2, t * 6, sd); K.M.ao *= 0.72 + 0.28 * Math.abs(Math.sin(t * 46 + s2 * 2.4)); }); S.unlock();
    for (const y of [-0.44, -0.86, -1.36, -1.8]) { if (y < pTop + 0.06) continue; K.rev(S, 0, y + 0.03, h => 0.058 + 0.014 * Math.sin(h / 0.06 * Math.PI), 0, 0.06, { mat: (u, h) => ironM(K, u * 4, h * 9, sd + 2) }); S.unlock(); }
    disc(K, S, 0, cy, 0.15, 0.15, (dx, dy, e) => { if (e > 0.8) ironM(K, dx * 3, dy * 3, sd + 3); else { enamelM(K, dx, dy, sd, true); K.M.r *= 0.9; K.M.g *= 0.88; K.M.b *= 1.02; } }, { bv: 0.24 }); S.unlock();
    c.save(); c.strokeStyle = 'rgba(30,22,40,.9)'; c.lineCap = 'round'; c.lineWidth = 0.008; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r0 = i % 3 ? 0.098 : 0.084; c.beginPath(); c.moveTo(Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(Math.cos(a) * 0.112, cy + Math.sin(a) * 0.112); c.stroke(); }
    c.lineWidth = 0.014; c.beginPath(); c.moveTo(0, cy); c.lineTo(-0.03, cy - 0.06); c.moveTo(0, cy); c.lineTo(0.075, cy + 0.02); c.stroke(); c.restore();
    K.ball(S, 0, cy, 0.016, 0.016, (dx, dy) => goldM(K, dx, dy, sd, 0.7)); S.unlock(); K.glint(c, -0.06, cy - 0.06, 0.08, 0.4);
    if (!v) { K.tube(S, ptsQ(0, -1.95, 0.05, -2.25, 0.38, -2.05, 12), 0.03, 0.025, (t, s) => ironM(K, s, t * 3, sd + 1)); S.unlock();
      volute(K, S, 0.14, -1.97, 0.075, 1, (t, s2) => ironM(K, s2, t, sd + 5)); K.ball(S, 0, pTop - 0.03, 0.05, 0.05, (dx, dy) => ironM(K, dx, dy, sd + 6)); S.unlock();
      K.tube(S, [[0.38, -2.05], [0.38, ly - lr * 1.7]], 0.012, 0.012, (t, s) => ironM(K, s, t, sd + 2)); S.unlock(); }
    else for (const s0 of [-1, 1]) volute(K, S, s0 * 0.12, -0.72, 0.08, s0, (t, s2) => ironM(K, s2, t, sd + s0 + 3));
    lantern(K, S, lx, ly, lr, sd);
    K.ink(S, INK[L], 0.45); }
  // a stair torn from the void and floating: carved steps (lit nosings, joints of light, chipped corners, runes), under it a
  // crumbling mass of broken stone with spikes of stone and crystals of the void grown down, shards and rubble afloat round it
  function paintFloatstair(K, S, v, L) { const sd = 101 + v * 3, R = K.R1(sd), c = S.c, hov = v ? 0.62 : 0.46, ox = v ? 0.1 : 0; KK = K;
    contact(K, S, 0.9, 0.26, 0.45); halo(c, ox, -hov + 0.3, 0.75, VIOD, 0.3);
    const n = v ? 2 : 3, uy = -hov + 0.06;
    for (const [x, y, rx, ry, k] of [[-0.3, uy + 0.02, 0.26, 0.11, 0], [0.05, uy + 0.05, 0.3, 0.14, 1], [0.34, uy, 0.22, 0.1, 2], [-0.08, uy + 0.12, 0.18, 0.1, 3]]) lump(K, S, x + ox, y, rx, ry, { amp: 0.35, fr: 3.4, sd: sd + k, bump: 0.7, leaf: 12, mat: (dx, dy, ao, e, nz, wx, wy) => { vstoneM(K, wx * 3, wy * 3, sd + k, 0.65); if (dy > 0.3) K.M.ao *= 0.6; } });
    for (const [x, h, r, a] of [[-0.36, 0.2, 0.04, 0.2], [-0.12, 0.28, 0.05, 0.05], [0.16, 0.22, 0.045, -0.15], [0.4, 0.15, 0.035, -0.3]]) prism(K, S, x + ox, uy + 0.08, r, r * 0.9, h * 0.5, h * 0.5, Math.PI + a, (f, q, wt) => vstoneM(K, q + x * 9, wt * 2, sd + 9, 0.7));
    for (const [x, h, r, a] of [[-0.24, 0.22, 0.05, 0.25], [0.06, 0.3, 0.06, -0.1], [0.3, 0.18, 0.04, -0.4]]) prism(K, S, x + ox, uy + 0.14, r, r * 0.9, h * 0.4, h * 0.6, Math.PI + a, (f, q, wt) => crystalM(K, VIOC, f, q, wt, 0.6)); S.unlock();
    for (let i = n - 1; i >= 0; i--) { const z0 = hov + i * 0.2, z1 = z0 + 0.2 + (i === 0 ? 0.04 : 0), by = -i * 0.16, cx = (v ? 0.12 : 0) - i * 0.04, hw = 0.56 - i * 0.04, yT = by - z1 + 0.041;
      box(K, S, cx, by, hw, 0.12, z0, z1, 0.025, stepM(sd + i, z1)); stepCarve(c, { cx, hw, yT, yB: i === 0 ? by - z0 + 0.041 : yT + 0.2 }, i);
      if (i === 0) for (const sx of [-0.34, 0.3]) rune(c, cx + sx, yT + 0.12, 0.075, sd + sx * 10, 0.85); }
    const n2 = v ? 1 : 2; for (let i = 0; i < n2; i++) baluster(K, S, -0.46 - i * 0.04 + (v ? 0.12 : 0), -(hov + 0.2 + i * 0.2 + (i === 0 ? 0.04 : 0)) - i * 0.16 + 0.03, 0.38, sd + 5 + i);
    if (!v) { K.tube(S, [[-0.46, -(hov + 0.24) - 0.4], [-0.5, -(hov + 0.4) - 0.16 - 0.38]], 0.03, 0.028, (t, s2) => vstoneM(K, t * 4, s2, sd + 7, 1.4)); S.unlock(); }
    for (const [x, y, r, a] of [[-0.56, -hov + 0.42, 0.03, 0.5], [0.6, -hov + 0.34, 0.035, -0.4], [0.24 + ox, -hov + 0.52, 0.025, 0.1], [-0.2 + ox, -hov - 0.9, 0.022, -0.3]]) floatShard(K, S, x, y, r, a);
    rubble(K, S, 7, -0.6 + ox, 0.6 + ox, -hov + 0.24, -hov + 0.42, sd + 2); rubble(K, S, 3, -0.7, 0.7, -0.05, 0.1, sd + 4);
    cracks(c, R, 4, -0.5, 0.5, -hov - 0.7, -hov, 0.5, 0.05, 'rgba(201,176,255,.3)'); K.ink(S, INK[L], 0.5); }
  /* ======================= the pictures ======================= */
  const DEF = {
    boxtomb: { box: () => [-1.1, -1.15, 1.1, 0.42], paint: paintBoxtomb, sc: 1.2, mat: { mat: 'stone', cols: ['#2C3446', '#161B26', '#E8CF8E'] }, el: 'gold' },
    hourglass: { box: v => [-0.75, v ? -2.75 : -2.6, 0.75, 0.42], paint: paintHourglass, mat: { mat: 'glass', cols: ['#C8D6EA', '#3A4560', '#FFF4D0'], hot: '#FFD890', mix: 'stone' }, el: 'prism', keepHp: true },
    fallstone: { box: () => [-1.15, -2.65, 1.15, 0.42], paint: paintFallstone, sc: 1.05, mat: { mat: 'stone', cols: ['#2C3446', '#161B26', '#E8CF8E'] }, el: 'gold' },
    sepurn: { box: v => [-0.62, v ? -1.95 : -1.68, 0.62, 0.4], paint: paintSepurn, sc: 1.3, mat: { mat: 'iron', cols: ['#A9B5C5', '#4A5468', '#E4EAF2'] }, el: 'gold' },
    stopclock: { box: v => [-0.7, v ? -1.85 : -2.6, 0.7, 0.42], paint: paintStopclock, sc: 1.05, mat: { mat: 'wood', cols: ['#4A2A1A', '#1E100A', '#E8CF8E'], mix: 'iron' }, el: 'gold' },
    mourner: { box: v => [-0.7, v ? -1.7 : -2.25, 0.7, 0.42], paint: paintMourner, sc: 1.3, mat: { mat: 'stone', cols: ['#4A5470', '#22283A', '#9AA8C8'] }, el: 'shadow' },
    dialslab: { box: v => v ? [-1.1, -1.35, 1.1, 0.42] : [-1.15, -1.85, 1.15, 0.42], paint: paintDialslab, sc: 1.15, mat: { mat: 'stone', cols: ['#2C3446', '#161B26', '#E8CF8E'] }, el: 'gold' },
    silverpillar: { box: v => v ? [-0.95, -1.75, 1.0, 0.42] : [-0.75, -2.85, 0.75, 0.42], paint: paintSilverpillar, sc: 1.1, mat: { mat: 'stone', cols: ['#E9E3D5', '#9C9484', '#FFFFFF'] }, el: 'gold' },
    sunclock: { box: () => [-0.78, -1.75, 0.78, 0.42], paint: paintSunclock, sc: 1.15, mat: { mat: 'stone', cols: ['#E9E3D5', '#9C9484', '#E8CF8E'] }, el: 'gold' },
    marblebench: { box: () => [-0.95, -1.42, 0.95, 0.42], paint: paintMarblebench, sc: 1.2, mat: { mat: 'stone', cols: ['#EFEADF', '#9C9484', '#FFFFFF'] }, el: 'gold' },
    agesarch: { box: () => [-1.25, -3.4, 1.25, 0.42], paint: paintAgesarch, sc: 1.1, mat: { mat: 'stone', cols: ['#E9E3D5', '#9C9484', '#FFFFFF'] }, el: 'gold' },
    gildedurn: { box: v => v ? [-0.8, -0.95, 1.25, 0.42] : [-0.72, -1.95, 0.72, 0.42], paint: paintGildedurn, sc: 1.25, mat: { mat: 'pottery', cols: ['#EFEADF', '#9C9484', '#E8CF8E'] }, el: 'gold' },
    ruinblock: { box: v => [-1.0, v ? -1.05 : -1.25, 1.0, 0.42], paint: paintRuinblock, sc: 1.25, mat: { mat: 'stone', cols: ['#E9E3D5', '#9C9484', '#E8CF8E'] }, el: 'gold' },
    voidobelisk: { box: v => [-0.62, v ? -2.85 : -2.75, 0.62, 0.42], paint: paintVoidobelisk, sc: 1.15, mat: { mat: 'basalt', cols: ['#2A2240', '#100C1C', '#C9B0FF'], hot: '#C9B0FF' }, el: 'shadow' },
    stairstub: { box: v => [-0.9, v ? -1.75 : -1.65, 0.9, 0.42], paint: paintStairstub, sc: 1.25, mat: { mat: 'stone', cols: ['#3A2E5E', '#1C1634', '#C9B0FF'] }, el: 'gold', keepHp: true },
    cornerglow: { box: v => [-0.75, v ? -2.05 : -1.85, 0.75, 0.42], paint: paintCornerglow, sc: 1.25, mat: { mat: 'stone', cols: ['#2A2240', '#130F24', '#C9B0FF'] }, el: 'prism' },
    glassshard: { box: v => [-0.72, v ? -2.0 : -2.15, 0.72, 0.4], paint: paintGlassshard, sc: 1.35, mat: { mat: 'crystal', cols: ['#B79CFF', '#5A3CA0', '#F0E8FF'], hot: '#C9B0FF', mix: 'stone' }, el: 'prism' },
    hourlamp: { box: v => [-0.55, v ? -2.15 : -2.45, 0.72, 0.4], paint: paintHourlamp, sc: 1.1, mat: { mat: 'iron', cols: ['#3A3448', '#16121E', '#FFE2B0'], mix: 'glass' }, el: 'spark' },
    floatstair: { box: v => [-0.85, v ? -2.0 : -1.75, 0.95, 0.42], paint: paintFloatstair, sc: 1.25, mat: { mat: 'stone', cols: ['#3A2E5E', '#1C1634', '#C9B0FF'] }, el: 'gold' },
  };
  const KINDS = Object.keys(DEF);
  // (kinds new in v463: with the painter off they never spawn (the land's old list is used); a stray one shows a kin's old art)
  const NEWK = { sepurn: 'silverurn', stopclock: 'fallstone', mourner: 'boxtomb', dialslab: 'boxtomb', agesarch: 'silverpillar', gildedurn: 'silverpillar', ruinblock: 'marblebench', glassshard: 'voidobelisk', hourlamp: 'voidobelisk', floatstair: 'stairstub' };
  /* ======================= the floor's decals ======================= */
  const tuft = (K, S, v, col) => { const R = K.R1(131 + v * 7); for (let i = 0; i < 9; i++) { const x0 = (i - 4) * 0.025 + (R() - 0.5) * 0.02, h = 0.16 + R() * 0.12, lean = (i - 4) * 0.03 + (R() - 0.5) * 0.06;
    K.tube(S, ptsQ(x0, 0.02, x0 + lean * 0.3, -h * 0.5, x0 + lean, -h, 5), 0.011, 0.003, (t) => { const M = K.M, w = 0.85 + 0.25 * hh(i, v, 3); M.r = col[0] * w; M.g = col[1] * w; M.b = col[2] * w; M.rg = 0.8; M.ao *= 0.55 + 0.45 * t; }); } S.unlock(); };
  const decPeb = (K, S, v, mat, sd, n) => { const R = K.R1(sd + v * 17); for (let i = 0; i < (n || 4); i++) { const x = (R() - 0.5) * 0.4, y = (R() - 0.5) * 0.12, r = 0.035 + R() * 0.05; lump(K, S, x, y - r * 0.4, r * 1.3, r, { amp: 0.2, fr: 2, sd: sd + i, bump: 0.4, leaf: 24, flat: 0.5, mat: (dx, dy, ao, e, nz, wx, wy) => mat(wx, wy, i) }); } S.unlock(); };
  const decCrack = (K, S, v, glow, col, sd) => { const c = S.c, R = K.R1(sd + v * 11), pts = [[-0.45, 0]]; for (let i = 1; i <= 6; i++) pts.push([-0.45 + i * 0.15, (R() - 0.5) * 0.12]); const br = [pts[2], [pts[2][0] + 0.06, pts[2][1] + 0.16]];
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; for (const [w, s] of [[0.05, 'rgba(4,4,12,.2)'], [0.022, 'rgba(2,2,8,.6)']]) { c.strokeStyle = s; c.lineWidth = w; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.moveTo(br[0][0], br[0][1]); c.lineTo(br[1][0], br[1][1]); c.stroke(); }
    if (glow) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(col, 0.85); c.lineWidth = 0.012; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); for (let i = 1; i < 6; i += 2) halo(c, pts[i][0], pts[i][1], 0.09, col, 0.35); }
    c.restore(); };
  const decDust = (K, S, v, L, sd) => { lump(K, S, 0, -0.02, 0.36, 0.08, { amp: 0.3, fr: 3, sd: sd + v * 5, bump: 0.2, leaf: 16, flat: 0.8, mat: (dx, dy, ao, e, nz, wx, wy) => { dustM(K, wx, wy, sd, L); K.M.ao *= 0.95; } }); S.unlock(); };
  Object.assign(DEF, {
    sdust: { box: () => [-0.45, -0.14, 0.45, 0.1], paint: (K, S, v) => { decDust(K, S, v, 'halls', 141); decPeb(K, S, v, (x, y, i) => tombM(K, x * 3, y * 3, 141 + i, 1.1), 141, 2); K.ink(S, INK.halls, 0.25); } },
    scog: { box: () => [-0.36, -0.2, 0.36, 0.14], paint: (K, S, v) => { const R = K.R1(143 + v); disc(K, S, -0.08, -0.02, 0.13, 0.09, (dx, dy, e) => { goldM(K, dx * 2, dy * 2, 143 + v, 0.3, 0.2); if (e < 0.35) K.M.ao *= 0.5; }, { bv: 0.25, rf: a => 1 + 0.18 * ss(0.3, 0.6, Math.abs(Math.sin(a * 5 + v))) });
      K.tube(S, [[0.02, 0.05], [0.3, -0.04 + R() * 0.06]], 0.022, 0.006, (t, s) => goldM(K, s, t * 3, 144, 0.4)); S.unlock(); K.ink(S, INK.halls, 0.35); } },
    scrack: { box: () => [-0.52, -0.22, 0.52, 0.22], paint: (K, S, v) => decCrack(K, S, v, v % 2 === 0, GOLD, 145) },
    sgold: { box: () => [-0.3, -0.12, 0.3, 0.1], paint: (K, S, v) => { const R = K.R1(147 + v * 3); for (let i = 0; i < 4; i++) { const x = (R() - 0.5) * 0.4, y = (R() - 0.5) * 0.12; disc(K, S, x, y, 0.045, 0.026, (dx, dy) => goldM(K, dx + i, dy, 147 + i, 0.6), { bv: 0.5 }); } K.ink(S, INK.halls, 0.3); } },
    scandle: { box: () => [-0.2, -0.36, 0.2, 0.08], paint: (K, S, v) => { const h = 0.14 + v * 0.03; K.rev(S, 0, 0, hh2 => 0.05 + 0.02 * Math.max(0, 1 - hh2 / 0.05), 0, h, { top: true, mat: (u, hh2) => { const M = K.M; M.r = 0.86; M.g = 0.8; M.b = 0.66; M.rg = 0.5; M.cc = 0.3; M.er = 0.08; M.eg = 0.05; M.eb = 0.01; } }); S.unlock(); lump(K, S, 0.04, -0.01, 0.1, 0.035, { amp: 0.3, fr: 2, sd: v, bump: 0.2, leaf: 20, mat: () => { const M = K.M; M.r = 0.86; M.g = 0.8; M.b = 0.66; M.rg = 0.5; } }); S.unlock(); K.tube(S, [[0, -h], [0.004, -h - 0.04]], 0.006, 0.004, () => { const M = K.M; M.r = 0.08; M.g = 0.06; M.b = 0.05; }); S.unlock(); K.ink(S, INK.halls, 0.3); } },
    achip: { box: () => [-0.32, -0.16, 0.32, 0.1], paint: (K, S, v) => { decPeb(K, S, v, (x, y, i) => marbleM(K, x * 3, y * 3, 151 + i, { ruin: i % 2 === 1 }), 151, 5); K.ink(S, INK.ages, 0.25); } },
    agold: { box: () => [-0.3, -0.12, 0.3, 0.1], paint: (K, S, v) => { const R = K.R1(153 + v * 3); for (let i = 0; i < 3; i++) { const x = (R() - 0.5) * 0.4, y = (R() - 0.5) * 0.12; disc(K, S, x, y, 0.06, 0.03, (dx, dy) => goldM(K, dx + i, dy, 153 + i, 0.8), { bv: 0.6, rf: a => 0.8 + 0.25 * Math.sin(a * 3 + i) }); } K.ink(S, INK.ages, 0.25); } },
    apetal: { box: () => [-0.34, -0.14, 0.34, 0.1], paint: (K, S, v) => { const R = K.R1(155 + v * 5); for (let i = 0; i < 6; i++) { const x = (R() - 0.5) * 0.5, y = (R() - 0.5) * 0.14; lump(K, S, x, y, 0.045, 0.022, { amp: 0.1, fr: 1, sd: i, bump: 0.1, leaf: 30, mat: () => { const M = K.M; M.r = 1; M.g = 0.93 - (i % 3) * 0.05; M.b = 0.9 - (i % 3) * 0.08; M.rg = 0.5; M.sh = 0.9; } }); } S.unlock(); K.ink(S, INK.ages, 0.15); } },
    amoss: { box: () => [-0.3, -0.36, 0.3, 0.06], paint: (K, S, v) => { tuft(K, S, v, [0.56, 0.66, 0.44]); K.ink(S, INK.ages, 0.25); } },
    acrack: { box: () => [-0.52, -0.22, 0.52, 0.22], paint: (K, S, v) => decCrack(K, S, v, false, GOLD, 157) },
    vshard: { box: () => [-0.26, -0.3, 0.26, 0.08], paint: (K, S, v) => { for (const [x, h, r, a] of [[-0.08, 0.14, 0.03, -0.5], [0.06, 0.2, 0.035, 0.3], [0.0, 0.1, 0.025, 1.1]]) prism(K, S, x, 0.01, r, r * 0.85, h, r * 1.3, a + (v - 1.5) * 0.1, (f, q, wt) => crystalM(K, VIOC, f, q, wt, 0.6)); S.unlock(); K.ink(S, INK.stairs, 0.3); } },
    vpeb: { box: () => [-0.32, -0.16, 0.32, 0.1], paint: (K, S, v) => { decPeb(K, S, v, (x, y, i) => vstoneM(K, x * 3, y * 3, 161 + i, 1.2), 161); K.ink(S, INK.stairs, 0.3); } },
    vcrack: { box: () => [-0.52, -0.22, 0.52, 0.22], paint: (K, S, v) => decCrack(K, S, v, true, VIO, 163) },
    vdust: { box: () => [-0.4, -0.14, 0.4, 0.1], paint: (K, S, v) => { decDust(K, S, v, 'stairs', 165); const R = K.R1(165 + v); for (let i = 0; i < 4; i++) halo(S.c, (R() - 0.5) * 0.5, (R() - 0.5) * 0.1 - 0.02, 0.05, i % 2 ? VIO : '#FFFFFF', 0.6); } },
  });
  // decal kind -> [picture, laid flat (turned), scale, the old kind it stands in for (its art where these are not painted), light]
  const DEC = { sdust: ['sdust', false, 1.2, 'pebbles', 'halls'], scog: ['scog', true, 1.0, 'rune', 'halls'], scrack: ['scrack', true, 1.0, 'crack', 'halls'], sgold: ['sgold', true, 1.0, 'rune', 'halls'], scandle: ['scandle', false, 1.0, 'cobweb', 'halls'],
    achip: ['achip', false, 1.1, 'goldinlay', 'ages'], agold: ['agold', true, 1.0, 'goldinlay', 'ages'], apetal: ['apetal', true, 1.0, 'flower', 'ages'], amoss: ['amoss', false, 1.0, 'feather', 'ages'], acrack: ['acrack', true, 1.0, 'star', 'ages'],
    vshard: ['vshard', false, 1.0, 'star', 'stairs'], vpeb: ['vpeb', false, 1.1, 'feather', 'stairs'], vcrack: ['vcrack', true, 1.0, 'goldinlay', 'stairs'], vdust: ['vdust', false, 1.2, 'flower', 'stairs'] };
  const DECS_OF = { sepulchre: ['sdust', 'scog', 'scrack', 'sgold', 'scandle'], twoages: ['achip', 'agold', 'apetal', 'amoss', 'acrack'], borrowed: ['vshard', 'vpeb', 'vcrack', 'vdust'] };
  const DECAL_LISTS = { sepulchre: [['sdust', 0.05], ['scog', 0.012], ['scrack', 0.05], ['sgold', 0.02], ['scandle', 0.02]], twoages: [['achip', 0.06], ['agold', 0.03], ['apetal', 0.05], ['amoss', 0.04], ['acrack', 0.04]], borrowed: [['vshard', 0.05], ['vpeb', 0.07], ['vcrack', 0.05], ['vdust', 0.05]] };
  const kOf = c => { try { const m = c.getTransform(); return Math.max(0.5, Math.hypot(m.a, m.b)); } catch (e) { return 1; } };
  function decal(c, kind, d, s, T, lw) { const D = DEC[kind]; if (!D) return false;
    if (!off()) { const P = Math.round(T * kOf(c) * 1.25), sp = sprite(D[0], (d.v | 0) % 4, P, true, D[4]); if (sp) { const f = (s / (T * 0.18)) * T / sp.P * D[2]; c.save(); if (D[1]) c.rotate(d.rot || 0); c.drawImage(sp.cv, -sp.ax * f, -sp.ay * f, sp.cv.width * f, sp.cv.height * f); c.restore(); return true; } }
    try { if (typeof DunWorld !== 'undefined' && DunWorld.decal) { c.save(); c.translate(-d.x * T, -d.y * T); DunWorld.decal(c, Object.assign({}, d, { kind: D[3] }), T, lw); c.restore(); } } catch (e) {} return true; }

  /* ======================= the cache and the drawing ======================= */
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0;
  const CAP = 72;
  function paint(name, v, P, L) { const B = BP(); if (!B) return null; const K = B.kit, D = DEF[name]; if (!D) return null; const b = D.box(v), t0 = now(), sc = D.sc || 1, P2 = Math.max(8, Math.round(P * sc)); let S = null;   // (sc: a prop drawn larger than its tile measures, at the same sharpness)
    try { S = K.surface(b[0], b[1], b[2], b[3], P2); lit(K, L, () => { KK = K; D.paint(K, S, v, L); S.unlock(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('SEP_PROPS', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = mkc(S.w, S.h); cv.getContext('2d', { willReadFrequently: true }).drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;   // (in plain memory, as the textures)
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P: P2 / sc }; }
  function sprite(name, v, P, force, L) { if (!DEF[name] || !BP()) return null; L = L || 'halls'; P = Math.max(8, Math.round(P || BASE || 48)); const key = name + '|' + v + '|' + L + '|' + P; let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 12) return null;
    s = paint(name, v, P, L); if (s) { if (CACHE.size > 160) release(true); CACHE.set(key, s); } return s; }
  const qP = P => Math.max(8, Math.round(Math.exp(Math.round(Math.log(P) * 10) / 10)));
  function pic(c, name, v, T, L, sc) { const m = c.getTransform ? c.getTransform() : null, dpr = Math.min(2, m ? Math.max(0.5, Math.hypot(m.a, m.b)) : 1);
    let P = Math.min(CAP, qP(T * (sc || 1) * dpr)); if (BASE && P <= BASE * 1.1 && P >= BASE * 0.5) P = BASE;
    let s = sprite(name, v, P, false, L); if (!s) { const pre = name + '|' + v + '|' + L + '|'; for (const [k, s2] of CACHE) if (k.startsWith(pre)) { s = s2; break; } } if (!s) STATS.misses++; return s; }
  const put = (c, s, Xs, Ys, T, sx, sy, rot) => { const f = T / s.P; c.save(); c.translate(Xs, Ys); if (rot) c.rotate(rot); if ((sx || 1) !== 1 || (sy || 1) !== 1) c.scale(sx || 1, sy || 1); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); c.restore(); STATS.draws++; };
  function draw(c, name, v, Xs, Ys, T, o) { if (off() || !DEF[name]) return false; o = o || {}; const s = pic(c, name, v, T, o.L || 'halls', o.s); if (!s) return false; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; put(c, s, Xs, Ys, T * (o.s || 1), o.flip ? -1 : 1, o.sy || 1, o.rot); c.restore(); return true; }

  /* ======================= textures that wrap (the lands) ======================= */
  const TEX = new Map(); let FA = 1, GK = null;
  function fieldBegin(K, w, h, P, fn, o) { o = o || {}; const S = K.surface(0, 0, w, h, P), W = S.w, Hh = S.h, Hm = new Float32Array(W * Hh), bump = o.bump || 1, kk = P / 2 * bump;
    const F = { S, W, Hh, cv: null,
      heights(y0, y1) { for (let py = y0; py < Math.min(Hh, y1); py++) for (let px = 0; px < W; px++) Hm[py * W + px] = fn((px + 0.5) / P, (py + 0.5) / P, 0); },
      shade(y0, y1) { S.lock(); for (let py = y0; py < Math.min(Hh, y1); py++) for (let px = 0; px < W; px++) { const xl = px > 0 ? px - 1 : (o.wrap ? W - 1 : 0), xr = px < W - 1 ? px + 1 : (o.wrap ? 0 : W - 1), yu = py > 0 ? py - 1 : (o.wrapY ? Hh - 1 : 0), yd = py < Hh - 1 ? py + 1 : (o.wrapY ? 0 : Hh - 1);
        const hx = (Hm[py * W + xr] - Hm[py * W + xl]) * kk, hy = (Hm[yd * W + px] - Hm[yu * W + px]) * kk;
        K.M0(); FA = 1; fn((px + 0.5) / P, (py + 0.5) / P, 1); if (FA <= 0.003) continue;
        let nx, ny, nz; if (o.face) { nx = -hx; ny = 1; nz = hy; } else { nx = -hx; ny = -hy; nz = 1; } const l = Math.hypot(nx, ny, nz); K.shade(nx / l, ny / l, nz / l); K.put(S, px, py, FA); } },
      finish() { S.unlock(); const cv = mkc(S.w, S.h); cv.getContext('2d', { willReadFrequently: true }).drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1; F.cv = cv; return cv; } };   // (a texture kept in plain memory: a GPU canvas's picture can be lost under a busy GPU)
    return F; }
  function field(K, w, h, P, fn, o) { const F = fieldBegin(K, w, h, P, fn, o); F.heights(0, F.Hh); F.shade(0, F.Hh); return F.finish(); }
  const FN = 6, WN = 4;
  /* ---- the floors ---- */
  // the halls: courses of blue-black flagstones, bevelled, polished where feet wore them, dust in the joints; old gold set
  // along every other course; here and there a dial cut in a slab with its hours in gold; specks of gold dust
  function hallsFloor(x, y, mode) { const M = GK.M, ci = Math.floor(y / 1.5), fy = y - ci * 1.5, cim = md(ci, 4), off2 = [0, 1, 0.5, 1.5][cim], xx = x + off2, si = Math.floor(xx / 2), fx = xx - si * 2, sid = md(si, 3) + cim * 3;
    const dj = Math.min(fx, 2 - fx, fy, 1.5 - fy), bev = ss(0, 0.08, dj), joint = ss(0.028, 0.006, dj), tone = PH(sid, 1, 11), gold = cim % 2 === 0 && fy < 0.045 && fy > 0.004;
    const wear = pfbm(x * 0.5, y * 0.5, 3, 12), dialOn = PH(sid, 5, 11) < 0.3, dr = Math.hypot(fx - 1, fy - 0.75), ring = dialOn ? ss(0.018, 0.006, Math.abs(dr - 0.46)) : 0, an = Math.atan2(fy - 0.75, fx - 1), tick = dialOn && dr > 0.36 && dr < 0.44 && Math.abs(Math.sin(an * 6)) < 0.09;
    let h = 0.03 * bev + (PH(sid, 2, 11) - 0.5) * 0.012 * (fx - 1) + (PH(sid, 3, 11) - 0.5) * 0.012 * (fy - 0.75) + 0.005 * pvn(x * 4, y * 4, 24, 13) - 0.01 * ring;
    if (gold) h = 0.028 + 0.004 * Math.sin(fy / 0.045 * Math.PI);
    const sp = pfeat(x * 3, y * 3, FN * 3, 14, 0.07); let mote = 0; if (sp.id >= 0 && sp.d < 0.06) mote = 1 - sp.d / 0.06;
    if (!mode) return h;
    if (gold) { goldM(GK, x * 4, fy * 20, 15, 0.45); return h; }
    if (tick) { goldM(GK, fx * 9 + sid, fy * 9, 16, 0.5); return h; }
    tombM(GK, fx * 1.3 + sid * 3.7, fy * 1.3 + sid * 1.9, 17, 0.8 + 0.2 * tone, true); M.r *= 0.8; M.g *= 0.92; M.b *= 1.4; M.rg = lerp(0.48, 0.26, ss(0.4, 0.75, wear)); M.cc = lerp(0.15, 0.45, ss(0.4, 0.75, wear));
    if (ring > 0) { M.r = lerp(M.r, 0.04, ring * 0.7); M.g = lerp(M.g, 0.045, ring * 0.7); M.b = lerp(M.b, 0.07, ring * 0.7); }
    if (joint > 0) { const k = joint; M.r = lerp(M.r, 0.24, k * 0.8); M.g = lerp(M.g, 0.25, k * 0.8); M.b = lerp(M.b, 0.29, k * 0.8); M.ao *= 1 - k * 0.5; M.rg = 0.95; M.cc = 0; }
    const du = ss(0.55, 0.8, pfbm(x * 0.5 + 3.3, y * 0.5 + 1.1, 3, 18)) * (1 - bev * 0.4); if (du > 0) { M.r = lerp(M.r, 0.3, du * 0.4); M.g = lerp(M.g, 0.31, du * 0.4); M.b = lerp(M.b, 0.35, du * 0.4); M.rg = lerp(M.rg, 0.9, du); M.cc *= 1 - du; }
    if (mote > 0) { M.r = lerp(M.r, 1, mote); M.g = lerp(M.g, 0.85, mote); M.b = lerp(M.b, 0.5, mote); M.er = 0.7 * mote; M.eg = 0.52 * mote; M.eb = 0.2 * mote; }
    return h; }
  // the ages: marble tiles, ivory and silver-grey in a checker, gold in the joints; its ruin cracked, chipped, stained and
  // lichened, the gold dulled, a tile here and there gone to earth
  /* (v463 SE second pass: depth) a marble floor of real slabs: each tile bevelled and set a hair apart, a dark seam either side of
     its gilded inlay, veins of grey and gold running through it (a few bold, many faint), each slab its own tone; the polish
     catching the sky; its ruin: slabs cracked through and chipped, tilted, water stains and lichen, the gold dulled or gone */
  function agesFloor(ruin) { return (x, y, mode) => { const M = GK.M, ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, tid = md(ix, FN) + md(iy, FN) * FN, grey = (ix + iy) % 2 !== 0;
      const dj = Math.min(fx, 1 - fx, fy, 1 - fy), bev = ss(0.012, 0.07, dj), seam = dj < 0.034 && dj >= 0.016, grout = dj < 0.016;
      const tilt = ruin ? ((PH(tid, 8, 22) - 0.5) * 0.03 * (fx - 0.5) + (PH(tid, 9, 22) - 0.5) * 0.03 * (fy - 0.5)) : 0;
      let h = 0.05 * bev + tilt + 0.003 * pvn(x * 8, y * 8, 48, 21), gone = false, chipK = 0, crack = 0;
      if (ruin) { gone = PH(tid, 1, 22) < 0.035; const cc = PH(tid, 2, 22), cx = cc < 0.25 ? 0 : cc < 0.5 ? 1 : -1, cy = PH(tid, 3, 22) < 0.5 ? 0 : 1; if (cx >= 0 && PH(tid, 4, 22) < 0.45) { const d = Math.hypot(fx - cx, fy - cy); chipK = ss(0.36, 0.3, d); h -= 0.024 * chipK; }
        const cl = pcell(fx * 1.3 + tid * 1.7, fy * 1.3 + tid * 0.9, 64, 23); const ca = PH(tid, 12, 22) * Math.PI, dl = Math.abs((fx - 0.5) * Math.sin(ca) - (fy - 0.5) * Math.cos(ca) - (PH(tid, 13, 22) - 0.5) * 0.4); crack = ss(0.03, 0.008, cl.d2 - cl.d) * (PH(tid, 5, 22) < 0.5 ? ss(0.3, 0.1, dl) : 0); h -= 0.014 * crack; if (gone) h = -0.016 + 0.014 * pvn(x * 10, y * 10, 60, 24); }
      if (grout && !gone) h = 0.012; else if (seam && !gone) h = 0.002;
      if (!mode) return h;
      if (gone) { const t = 0.78 + 0.3 * pvn(x * 9, y * 9, 54, 25); M.r = 0.5 * t; M.g = 0.44 * t; M.b = 0.36 * t; M.rg = 0.95; M.ao *= 0.8; if (pvn(x * 14, y * 14, 84, 26) > 0.68) { M.r = 0.5; M.g = 0.6; M.b = 0.42; } return h; }
      if (seam) { M.r = 0.3; M.g = 0.28; M.b = 0.26; M.rg = 0.9; M.ao *= 0.55; return h; }
      if (grout) { goldM(GK, x * 6, y * 6, 27, ruin ? 0 : 0.7, ruin ? 0.55 : 0); if (ruin && PH(tid, 6, 22) < 0.5) { M.mt = 0; M.r = 0.34; M.g = 0.3; M.b = 0.24; M.rg = 0.95; } return h; }
      marbleM(GK, fx * 1.1 + tid * 2.3, fy * 1.1 + tid * 1.3, 28, { grey, ruin, tone: 0.76 + 0.16 * PH(tid, 7, 22) });
      // bold veins across the slab (a third of them), a gilt vein now and then
      const wv = pfbm(x, y, 6, 29) * 1.6, bv = Math.abs(pvn(x * 2.2 + wv, y * 2.2 - wv * 0.5, 9, 30) - 0.5), fvn = Math.abs(pvn(x * 5 + wv * 2, y * 5, 30, 32) - 0.5);
      if (fvn < 0.014) { const k = (1 - fvn / 0.014) * 0.32; M.r = lerp(M.r, 0.5, k); M.g = lerp(M.g, 0.49, k); M.b = lerp(M.b, 0.52, k); }
      if (bv < 0.032) { const k = (1 - bv / 0.032) * (PH(tid, 10, 22) < 0.45 ? 0.8 : 0.45); M.r = lerp(M.r, 0.34, k); M.g = lerp(M.g, 0.33, k); M.b = lerp(M.b, 0.37, k); }
      else if (bv < 0.042 && PH(tid, 11, 22) < 0.25) { const k = 1 - (bv - 0.032) / 0.01; M.r = lerp(M.r, 0.9, k * 0.7); M.g = lerp(M.g, 0.7, k * 0.7); M.b = lerp(M.b, 0.36, k * 0.7); M.mt = 0.6 * k; M.fr = 0.95; M.fg = 0.74; M.fb = 0.38; }
      M.ao *= 0.7 + 0.3 * bev;
      if (!ruin) { M.rg = 0.1; M.cc = 0.85; }
      else { const stn = ss(0.5, 0.78, pfbm(x * 0.5 + 2.2, y * 0.5 + 0.7, 3, 31)); if (stn > 0) { M.r = lerp(M.r, 0.5, stn * 0.55); M.g = lerp(M.g, 0.44, stn * 0.55); M.b = lerp(M.b, 0.34, stn * 0.55); } }
      if (chipK > 0) { M.r *= 0.72; M.g *= 0.7; M.b *= 0.66; M.rg = 0.9; M.cc = 0; }
      if (crack > 0) { M.r = lerp(M.r, 0.16, crack * 0.85); M.g = lerp(M.g, 0.15, crack * 0.85); M.b = lerp(M.b, 0.14, crack * 0.85); M.ao *= 1 - crack * 0.5; }
      return h; }; }
  // the stairs: long treads of violet-black stone, their nosings lit along the front, the joints a thread of violet light,
  // far specks of light in the stone
  function stairsFloor(x, y, mode) { const M = GK.M, ri = Math.floor(y), fy = y - ri, off2 = md(ri, 2) ? 1.5 : 0, xx = x + off2, si = Math.floor(xx / 3), fx = xx - si * 3, sid = md(si, 2) + md(ri, FN) * 2;
    const dj = Math.min(fx, 3 - fx), nose = ss(0.86, 0.95, fy) * (1 - ss(0.95, 1, fy)), seamY = ss(0.025, 0.004, Math.min(fy, 1 - fy)), seamX = ss(0.022, 0.004, dj);
    let h = 0.03 * ss(0, 0.06, Math.min(dj, fy, 1 - fy)) + 0.006 * nose - 0.012 * ss(0.92, 1, fy) * 0 + 0.004 * pvn(x * 6, y * 6, 36, 31) + (PH(sid, 1, 32) - 0.5) * 0.008 * (fx - 1.5) / 1.5;
    if (!mode) return h;
    vstoneM(GK, fx * 1.2 + sid * 3.1, fy * 1.2 + sid * 1.7, 33, 0.6 + 0.12 * PH(sid, 2, 32), PH(sid, 3, 32) < 0.6); M.ao *= 0.78 + 0.22 * ss(0, 0.5, fy);
    if (nose > 0) { M.r = lerp(M.r, 0.32, nose * 0.5); M.g = lerp(M.g, 0.24, nose * 0.5); M.b = lerp(M.b, 0.5, nose * 0.5); }
    const s2 = Math.max(seamY, seamX); if (s2 > 0) { M.r = lerp(M.r, 0.6, s2); M.g = lerp(M.g, 0.44, s2); M.b = lerp(M.b, 1, s2); M.er = 0.38 * s2; M.eg = 0.24 * s2; M.eb = 0.72 * s2; M.cc = 0.6; }
    return h; }
  /* ---- the wall faces (WN tiles wide, H tall) ---- */
  function hallsBank(H) { return (x, y, mode) => { const M = GK.M, v = y / H, cr = y < H * 0.5 ? 0 : 1, fy = cr ? y - H * 0.5 : y, bx = x + (cr ? 0.5 : 0), bi = Math.floor(bx), fx = bx - bi, gold = y > 0.05 && y < 0.075, cope = y < 0.05;
      const dj = Math.min(fx, 1 - fx, Math.abs(fy - (cr ? 0 : 0.075)), Math.abs(H * 0.5 - fy)), joint = ss(0.02, 0.004, dj), pan = !cope && !gold && fx > 0.18 && fx < 0.82 && fy > (cr ? 0.05 : 0.12) && fy < H * 0.5 - 0.05;
      let h = cope ? 0.04 : gold ? 0.032 : 0.02 * ss(0, 0.05, dj) - (pan ? 0.006 : 0) + 0.004 * pvn(x * 9, y * 9, 36, 41);
      if (!mode) return h;
      if (gold) { goldM(GK, x * 6, y * 20, 42, 0.4); return h; }
      tombM(GK, fx + bi * 3.3, y * 2 + cr * 5, 43, cope ? 1.2 : 0.95); M.ao *= (1 - joint * 0.6) * (0.7 + 0.3 * (1 - v)); if (pan) { M.ao *= 0.9; }
      return h; }; }
  function agesBank(H) { return (x, y, mode) => { const M = GK.M, fx = x - Math.floor(x), pil = fx > 0.38 && fx < 0.62, cor = y < 0.06, gold = y > 0.06 && y < 0.085, base = y > H - 0.07;
      const flute = pil ? Math.abs(Math.cos((fx - 0.38) / 0.24 * Math.PI * 3)) : 0, inset = !pil && !cor && !gold && !base && Math.min(Math.abs(fx - 0.38), Math.abs(fx - 0.62), fx < 0.38 ? fx : 1 - fx) > 0.06 && y > 0.12 && y < H - 0.1;
      let h = cor ? 0.04 : gold ? 0.036 : base ? 0.03 : pil ? 0.03 + 0.006 * flute : inset ? 0.004 : 0.012;
      if (!mode) return h;
      if (gold) { goldM(GK, x * 6, y * 20, 44, 0.6); return h; }
      marbleM(GK, x * 1.4, y * 1.4, 45, { tone: cor || base ? 1.04 : 0.98 }); if (pil) M.ao *= 0.8 + 0.2 * flute; if (inset) M.ao *= 0.92;
      return h; }; }
  function stairsBank(H) { return (x, y, mode) => { const M = GK.M, cr = y < H * 0.5 ? 0 : 1, fy = cr ? y - H * 0.5 : y, bx = x * 0.75 + (cr ? 0.37 : 0), bi = Math.floor(bx), fx = bx - bi, seam = ss(0.016, 0.003, Math.abs(y - H * 0.5)), dj = Math.min(fx, 1 - fx, fy, H * 0.5 - fy), joint = ss(0.02, 0.004, dj);
      let h = 0.022 * ss(0, 0.04, dj) + 0.004 * pvn(x * 9, y * 9, 36, 46);
      if (!mode) return h;
      vstoneM(GK, fx + bi * 2.3, y * 2 + cr * 4, 47, 1.0); M.ao *= (1 - joint * 0.6) * (0.65 + 0.35 * (1 - y / H));
      if (seam > 0) { M.r = lerp(M.r, 0.7, seam); M.g = lerp(M.g, 0.5, seam); M.b = lerp(M.b, 1, seam); M.er = 0.45 * seam; M.eg = 0.28 * seam; M.eb = 0.85 * seam; }
      return h; }; }
  /* ---- the wall tops (WN square, from above) ---- */
  function hallsRoof(x, y, mode) { const M = GK.M, iy = Math.floor(y), fy = y - iy, xx = x + (iy % 2 ? 0.5 : 0), ix = Math.floor(xx), fx = xx - ix, id = md(ix, WN) + md(iy, WN) * WN, dj = Math.min(fx, 1 - fx, fy, 1 - fy);
    let h = 0.03 * ss(0, 0.06, dj) + (PH(id, 1, 51) - 0.5) * 0.01 * (fx - 0.5) + 0.004 * pvn(x * 8, y * 8, 32, 52); if (!mode) return h;
    tombM(GK, fx + id * 2.1, fy + id * 1.3, 53, 0.95 + 0.15 * PH(id, 2, 51), true); M.r *= 0.8; M.g *= 0.92; M.b *= 1.4; M.ao *= 1 - ss(0.02, 0.004, dj) * 0.6; const du = ss(0.5, 0.8, pfbm(x * 0.75, y * 0.75, 3, 54)); if (du > 0) { M.r = lerp(M.r, 0.3, du * 0.5); M.g = lerp(M.g, 0.31, du * 0.5); M.b = lerp(M.b, 0.35, du * 0.5); M.rg = 0.9; M.cc = 0; } return h; }
  function agesRoof(x, y, mode) { const M = GK.M, ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, id = md(ix, WN) + md(iy, WN) * WN, dj = Math.min(fx, 1 - fx, fy, 1 - fy), gold = dj < 0.02;
    let h = gold ? 0.016 : 0.02 * ss(0, 0.05, dj); if (!mode) return h; if (gold) { goldM(GK, x * 6, y * 6, 55, 0.5); return h; }
    marbleM(GK, fx + id * 2.3, fy + id * 1.1, 56, { tone: 1.02, ruin: PH(id, 1, 57) < 0.35 }); return h; }
  function stairsRoof(x, y, mode) { const M = GK.M, cl = pcell(x * 1.5, y * 1.5, 6, 61), gap = cl.d2 - cl.d, seam = ss(0.05, 0.012, gap); let h = 0.03 - 0.02 * seam + 0.004 * pvn(x * 9, y * 9, 36, 62); if (!mode) return h;
    vstoneM(GK, cl.ox * 2 + cl.id * 0.37, cl.oy * 2, 63, 1.1); if (seam > 0) { M.ao *= 1 - seam * 0.3; const k = seam * ss(0.4, 0.7, pvn(x * 2, y * 2, 8, 64)); M.er = 0.35 * k; M.eg = 0.2 * k; M.eb = 0.7 * k; } return h; }
  /* ---- the cliffs over the gap (WN wide, 1.25 tall from the ground's edge) ---- */
  function hallsCliff(x, y, mode) { const M = GK.M, bot = 0.62 + 0.22 * pvn(x * 1.5, 0.5, 6, 71) + 0.06 * pvn(x * 6, 1.5, 24, 72); FA = 1; if (y >= bot) { FA = 0; return 0; }
    const cr = Math.floor(y / 0.22), fy = y - cr * 0.22, bx = x + (cr % 2 ? 0.5 : 0), fx = bx - Math.floor(bx), dj = Math.min(fx, 1 - fx, fy, 0.22 - fy), lip = y < 0.06;
    let h = lip ? 0.04 : 0.024 * ss(0, 0.04, dj) + 0.005 * pvn(x * 9, y * 9, 36, 73); FA = clamp((bot - y) * 30, 0, 1); if (!mode) return h;
    tombM(GK, fx + Math.floor(bx) * 2.7, y * 2, 74, lip ? 1.2 : 0.9); M.ao *= (1 - ss(0.02, 0.004, dj) * 0.6) * (1 - (y / bot) * 0.55); if (lip && y > 0.035) goldM(GK, x * 6, y * 20, 75, 0.3); return h; }
  function agesCliff(x, y, mode) { const M = GK.M, bot = 0.5 + 0.25 * pvn(x * 1.5, 0.5, 6, 76) + 0.1 * pvn(x * 5, 1.5, 20, 77); FA = 1; if (y >= bot) { FA = 0; return 0; }
    const cor = y < 0.1, gold = y > 0.1 && y < 0.125, fx = x - Math.floor(x), corbel = y > 0.125 && y < 0.3 && Math.abs(fx - 0.5) < 0.12 * (1 - (y - 0.125) / 0.175 * 0.5);
    let h = cor ? 0.04 - 0.02 * ss(0.05, 0.1, y) : gold ? 0.03 : corbel ? 0.035 : 0.012 + 0.006 * pvn(x * 8, y * 8, 32, 78); FA = clamp((bot - y) * 22, 0, 1); if (!mode) return h;
    if (gold) { goldM(GK, x * 6, y * 20, 79, 0.6); return h; } marbleM(GK, x * 1.3, y * 1.3, 80, { tone: cor ? 1.05 : 0.95, ruin: y > 0.3 }); M.ao *= 1 - (y / bot) * 0.45; return h; }
  function stairsCliff(x, y, mode) { const M = GK.M, st = Math.floor(x * 2), fx2 = x * 2 - st, bot = 0.3 + 0.12 * md(st, 4) + 0.06 * pvn(x * 4, 0.5, 16, 81); FA = 1; if (y >= bot) { FA = 0; return 0; }
    const step = Math.floor(y / 0.15), seam = ss(0.012, 0.003, Math.abs(y - (step + 1) * 0.15) * (y < bot - 0.02 ? 1 : 9)), edge = ss(0.04, 0.005, Math.min(fx2, 1 - fx2));
    let h = 0.03 - 0.01 * edge + 0.005 * pvn(x * 9, y * 9, 36, 82); FA = clamp((bot - y) * 28, 0, 1); if (!mode) return h;
    vstoneM(GK, x * 1.5, y * 2, 83, 0.95); M.ao *= (1 - edge * 0.4) * (1 - (y / bot) * 0.45); if (seam > 0) { M.er = 0.4 * seam; M.eg = 0.24 * seam; M.eb = 0.8 * seam; } return h; }
  /* ---- the bridges over the gap (2 tiles along, 1 across; a run along x) and their undersides ---- */
  function hallsBridge(x, y, mode) { const M = GK.M, rail = y < 0.09 || y > 0.91, ry = y < 0.5 ? (y - 0.045) / 0.045 : (y - 0.955) / 0.045, fx = x * 2 - Math.floor(x * 2), sid = md(Math.floor(x * 2), 4), dj = Math.min(fx, 1 - fx) * 0.5;
    FA = 1; let h = rail ? 0.03 * Math.sqrt(Math.max(0, 1 - ry * ry)) : 0.02 * ss(0, 0.03, dj) + (PH(sid, 1, 91) - 0.5) * 0.006; if (!mode) return h;
    if (rail) { goldM(GK, x * 4, y * 9, 92, 0.4); return h; } tombM(GK, fx + sid * 2.3, y * 1.5, 93, 1.0); M.ao *= 1 - ss(0.02, 0.004, dj) * 0.7; return h; }
  function agesBridge(x, y, mode) { const M = GK.M, rail = y < 0.08 || y > 0.92, ry = y < 0.5 ? (y - 0.04) / 0.04 : (y - 0.96) / 0.04, fx = x * 4 - Math.floor(x * 4), sid = md(Math.floor(x * 4), 8), dj = Math.min(fx, 1 - fx) * 0.25;
    FA = 1; let h = rail ? 0.03 * Math.sqrt(Math.max(0, 1 - ry * ry)) : 0.016 * ss(0, 0.02, dj); if (!mode) return h;
    if (rail) { silverM(GK, x * 4, y * 9, 94); return h; } marbleM(GK, fx * 0.25 + sid * 1.9, y, 95, { tone: 1.02 }); if (dj < 0.01) goldM(GK, x * 9, y * 9, 96, 0.5); return h; }
  function stairsBridge(x, y, mode) { const M = GK.M, fr = y < 0.07 || y > 0.93, fx = x * 2 - Math.floor(x * 2), mul = Math.min(fx, 1 - fx) < 0.03, ry = y < 0.5 ? (y - 0.035) / 0.035 : (y - 0.965) / 0.035;
    FA = 1; let h = fr ? 0.025 * Math.sqrt(Math.max(0, 1 - ry * ry)) : mul ? 0.012 : 0.004 * pvn(x * 6, y * 6, 12, 97); if (!mode) return h;
    if (fr || mul) { silverM(GK, x * 4, y * 9, 98, 0.05); return h; }
    glassM(GK, VIOC, 0.16, 0.05); FA = 0.42 + 0.12 * pvn(x * 3, y * 3, 6, 99); const st = Math.abs(((x - y * 0.6) * 3) % 1); if (st < 0.06) FA = Math.min(1, FA + 0.25); return h; }
  function hallsUnder(x, y, mode) { FA = 1; if (y > 0.3) { FA = 0; return 0; } FA = clamp((0.3 - y) * 12, 0, 1); if (!mode) return 0.02; tombM(GK, x * 2, y * 2, 101, 0.7); GK.M.ao *= 1 - y * 2; return 0.02; }
  function agesUnder(x, y, mode) { FA = 1; if (y > 0.24) { FA = 0; return 0; } FA = clamp((0.24 - y) * 14, 0, 1); if (!mode) return 0.02; if (y < 0.04) goldM(GK, x * 6, y * 9, 102, 0.5); else marbleM(GK, x * 2, y * 2, 103, { tone: 0.9 }); GK.M.ao *= 1 - y * 2; return 0.02; }
  function stairsUnder(x, y, mode) { FA = 1; if (y > 0.12) { FA = 0; return 0; } FA = clamp((0.12 - y) * 16, 0, 1) * 0.8; if (!mode) return 0.01; glassM(GK, VIOC, 0.5, 0.35); return 0.01; }
  const TDEF = {
    'floor:halls': { w: FN, h: FN, L: 'halls', fn: () => hallsFloor, o: { wrap: true, wrapY: true, bump: 1.2 } },
    'floor:ages': { w: FN, h: FN, L: 'ages', fn: () => agesFloor(false), o: { wrap: true, wrapY: true, bump: 1.5 } },
    'floor:agesr': { w: FN, h: FN, L: 'ages', fn: () => agesFloor(true), o: { wrap: true, wrapY: true, bump: 1.6 } },
    'floor:stairs': { w: FN, h: FN, L: 'stairs', fn: () => stairsFloor, o: { wrap: true, wrapY: true, bump: 1.2 } },
    'bank:halls': { w: WN, h: 0.55, L: 'halls', fn: () => hallsBank(0.55), o: { wrap: true, face: true, bump: 1.4 } },
    'bank:ages': { w: WN, h: 0.55, L: 'ages', fn: () => agesBank(0.55), o: { wrap: true, face: true, bump: 1.4 } },
    'bank:stairs': { w: WN, h: 0.55, L: 'stairs', fn: () => stairsBank(0.55), o: { wrap: true, face: true, bump: 1.4 } },
    'roof:halls': { w: WN, h: WN, L: 'halls', fn: () => hallsRoof, o: { wrap: true, wrapY: true, bump: 1.2 } },
    'roof:ages': { w: WN, h: WN, L: 'ages', fn: () => agesRoof, o: { wrap: true, wrapY: true, bump: 1.2 } },
    'roof:stairs': { w: WN, h: WN, L: 'stairs', fn: () => stairsRoof, o: { wrap: true, wrapY: true, bump: 1.2 } },
    'cliff:halls': { w: WN, h: 1.25, L: 'halls', fn: () => hallsCliff, o: { wrap: true, face: true, bump: 1.4 } },
    'cliff:ages': { w: WN, h: 1.25, L: 'ages', fn: () => agesCliff, o: { wrap: true, face: true, bump: 1.4 } },
    'cliff:stairs': { w: WN, h: 1.25, L: 'stairs', fn: () => stairsCliff, o: { wrap: true, face: true, bump: 1.4 } },
    'bridge:halls': { w: 2, h: 1, L: 'halls', fn: () => hallsBridge, o: { wrap: true, bump: 1.2 } },
    'bridge:ages': { w: 2, h: 1, L: 'ages', fn: () => agesBridge, o: { wrap: true, bump: 1.2 } },
    'bridge:stairs': { w: 2, h: 1, L: 'stairs', fn: () => stairsBridge, o: { wrap: true, bump: 1.2 } },
    'bunder:halls': { w: 2, h: 1.1, L: 'halls', fn: () => hallsUnder, o: { wrap: true, face: true } },
    'bunder:ages': { w: 2, h: 1.1, L: 'ages', fn: () => agesUnder, o: { wrap: true, face: true } },
    'bunder:stairs': { w: 2, h: 1.1, L: 'stairs', fn: () => stairsUnder, o: { wrap: true, face: true } },
  };
  function texJobs(name, P) { const B = BP(), D = TDEF[name]; if (!B || !D) return []; P = Math.max(8, Math.min(CAP, Math.round(P))); const key = name + '|' + P; if (TEX.has(key)) return [];
    if (D.custom) return [() => tex(name, P)];
    const K = B.kit; let F = null, t0 = 0; const run = f => () => { if (TEX.has(key)) return; try { GK = K; lit(K, D.L, f); } catch (e) { F = null; } GK = null; }, jobs = [];
    jobs.push(run(() => { t0 = now(); F = fieldBegin(K, D.w, D.h, P, D.fn(), D.o); }));
    const H = Math.ceil(D.h * P), n = Math.max(1, Math.ceil(D.w * P * H / 24000)), band2 = Math.ceil(H / n);
    for (let i = 0; i < n; i++) jobs.push(run(() => { if (F) F.heights(i * band2, (i + 1) * band2); }));
    for (let i = 0; i < n; i++) jobs.push(run(() => { if (F) F.shade(i * band2, (i + 1) * band2); }));
    jobs.push(run(() => { if (!F) return; const cv = F.finish(); F = null; if (!texOK(name, cv)) return; TEX.set(key, { cv, P }); STATS.texJob++; STATS.tex++; STATS.texMs += now() - t0; }));
    return jobs; }
  function tex(name, P) { const B = BP(), D = TDEF[name]; if (!B || !D) return null; P = Math.max(8, Math.min(CAP, Math.round(P))); const key = name + '|' + P; let t = TEX.get(key); if (t) return t;
    const t0 = now(), K = B.kit; let cv = null; try { GK = K; lit(K, D.L, () => { cv = D.custom ? D.custom(K, P) : field(K, D.w, D.h, P, D.fn(), D.o); }); } catch (e) { if (typeof console !== 'undefined') console.warn('SEP_PROPS tex', name, e); cv = null; } GK = null;
    if (!cv || !texOK(name, cv)) return null; t = { cv, P }; STATS.texSync++; TEX.set(key, t); STATS.tex++; STATS.texMs += now() - t0; return t; }
  // an opaque texture (a floor, a wall face, a wall top) that came out empty is not kept: it is painted again when next asked for
  const texOK = (name, cv) => { if (!/^(floor|roof|bank|deck)/.test(name)) return true; try { const d = cv.getContext('2d', { willReadFrequently: true }).getImageData(cv.width >> 1, cv.height >> 1, 1, 1).data; if (d[3] > 0) return true; } catch (e) { return true; } STATS.empty = (STATS.empty || 0) + 1; EMPTY[name] = (EMPTY[name] || 0) + 1; return EMPTY[name] > 2; };   // (twice at most: never a storm of repaints)
  const EMPTY = {};

  /* ======================= the lands: each biome's own floor, walls, wall tops, cliffs ======================= */
  const LN_OF = { sepulchre: 'halls', twoages: 'ages', borrowed: 'stairs' };
  const WASH = { sepulchre: [['2,4,12', 0.16, 0.3], ['255,214,140', 0.05, 0.42], ['60,80,140', 0.05, 0.5]],
    twoages: [['60,58,70', 0.1, 0.3], ['90,96,120', 0.08, 0.44], ['255,214,140', 0.05, 0.52]],
    borrowed: [['4,0,14', 0.16, 0.3], ['142,107,208', 0.06, 0.44], ['226,212,255', 0.03, 0.5]] };
  const EDGE = { sepulchre: '2,4,12', twoages: '60,64,80', borrowed: '4,0,14' };
  function washes(c, X, Y, T, x, y, list) { const G = 3.2;
    for (let gy = Math.floor((y - 3) / G); gy <= Math.floor((y + 4) / G); gy++) for (let gx = Math.floor((x - 3) / G); gx <= Math.floor((x + 4) / G); gx++) { const kind = hh(gx, gy, 141); let col = null, a = 0;
      for (const [cc, aa, upto] of list) if (kind < upto) { col = cc; a = aa * (0.7 + 0.6 * hh(gx, gy, 143)); break; } if (!col) continue;
      const cx = (gx + hh(gx, gy, 153)) * G, cy = (gy + hh(gx, gy, 159)) * G, rr = 1 + hh(gx, gy, 161) * 1.8; if (cx + rr < x || cx - rr > x + 1 || cy + rr * 0.8 < y || cy - rr * 0.8 > y + 1) continue;
      const px = X + (cx - x) * T, py = Y + (cy - y) * T; c.save(); c.translate(px, py); c.scale(1, 0.75); const g = c.createRadialGradient(0, 0, 0, 0, 0, rr * T); g.addColorStop(0, `rgba(${col},${a.toFixed(3)})`); g.addColorStop(0.6, `rgba(${col},${(a * 0.5).toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rr * T, 0, TAU); c.fill(); c.restore(); } }
  // the ages' youth and ruin across the world: a slow field, each tile one or the other or (at the border) the two laid together
  const vn2 = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = hh(xi, yi, s), b = hh(xi + 1, yi, s), c2 = hh(xi, yi + 1, s), d = hh(xi + 1, yi + 1, s); return a + (b - a) * u + (c2 - a) * v + (a - b - c2 + d) * u * v; };
  const ruinAt = (x, y) => ss(0.44, 0.6, vn2(x / 9 + 0.5, y / 9 + 0.5, 171) * 0.75 + vn2(x / 3.5, y / 3.5, 173) * 0.25 + (x % 23 < 11.5 ? 0.04 : -0.04));
  function landFloor(bio) { const L = LN_OF[bio]; return function (c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE, isWall) { const t = tex('floor:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    c.drawImage(t.cv, md(x, FN) * P, md(y, FN) * P, P, P, X, Y, T + 0.02, T + 0.02); STATS.land++;
    if (bio === 'twoages') { const r = Math.round(ruinAt(x + 0.5, y + 0.5) * 4) / 4; if (r > 0) { const t2 = tex('floor:agesr', P); if (t2) { c.globalAlpha = r; c.drawImage(t2.cv, md(x, FN) * P, md(y, FN) * P, P, P, X, Y, T + 0.02, T + 0.02); c.globalAlpha = 1; } } }
    washes(c, X, Y, T, x, y, WASH[bio]);
    if (isWall && bio !== 'borrowed') { const dc = bio === 'twoages' ? '235,228,214' : '70,74,92', dr = (cx, cy, rx, ry, a) => { c.save(); c.translate(cx, cy); c.scale(1, ry / rx); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(${dc},${a})`); g.addColorStop(1, `rgba(${dc},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore(); };
      if (isWall(x, y - 1)) for (let k = 0; k < 2; k++) dr(X + T * (0.2 + k * 0.55 + (hh(x, y, 170 + k) - 0.5) * 0.2), Y + T * 0.04, T * (0.24 + hh(x, y, 180 + k) * 0.16), T * (0.14 + hh(x, y, 190 + k) * 0.1), 0.35); }
    const ec = EDGE[bio], side = (x0, y0, x1, y1, w, hh2) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(${ec},.5)`); g.addColorStop(0.5, `rgba(${ec},.14)`); g.addColorStop(1, `rgba(${ec},0)`); c.fillStyle = g; c.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, hh2); };
    if (gN) side(X, Y, X, Y + T * 0.5, T, T * 0.5); if (gS) side(X, Y + T, X, Y + T * 0.55, T, T * 0.45); if (gW) side(X, Y, X + T * 0.45, Y, T * 0.45, T); if (gE) side(X + T, Y, X + T * 0.55, Y, T * 0.45, T); c.restore(); }; }
  function landWall(bio) { const L = LN_OF[bio]; return function (c, X, Y, T, H, h, x) { const t = tex('bank:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, WN) * P, 0, P, t.cv.height, X, Y, T + 0.5, H);
    const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, `rgba(${EDGE[bio]},0)`); g.addColorStop(1, `rgba(${EDGE[bio]},.3)`); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H); }; }
  function landRoof(bio) { const L = LN_OF[bio]; return function (c, X, Y, T, x, y, isWall) { const t = tex('roof:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, WN) * P, md(y, WN) * P, P, P, X, Y, T + 0.5, T + 0.5);
    const lip = bio === 'borrowed' ? '201,176,255' : bio === 'twoages' ? '255,255,255' : '232,207,142';
    if (!isWall(x, y - 1)) { c.fillStyle = `rgba(${lip},.18)`; c.fillRect(X, Y, T + 0.5, Math.max(1, T * 0.06)); }
    if (!isWall(x - 1, y)) { c.fillStyle = `rgba(${lip},.1)`; c.fillRect(X, Y, Math.max(1, T * 0.05), T); } if (!isWall(x + 1, y)) { c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(X + T * 0.94, Y, T * 0.06, T); } }; }
  function landCliff(bio) { const L = LN_OF[bio]; return function (c, x, y, X, Y, T, lw, B, isGap) { const t = tex('cliff:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    const rr = B && B.out ? T * 0.38 : 0, l = isGap && isGap(x - 1, y) ? rr : 0, r = isGap && isGap(x + 1, y) ? rr : 0, sx = md(x, WN) * P, k = P / T;
    c.save(); if (l || r) { c.beginPath(); c.moveTo(X + l, Y - 1); c.lineTo(X + T - r, Y - 1); c.lineTo(X + T - r * 0.6, Y + T * 1.3); c.lineTo(X + l * 0.6, Y + T * 1.3); c.closePath(); c.clip(); }
    c.drawImage(t.cv, sx, 0, P, t.cv.height, X, Y - T * 0.02, T, t.cv.height / k); c.restore(); }; }
  function landBridge(bio) { const L = LN_OF[bio]; return function (c, x, y, X, Y, T, isGap, tt) { const t = tex('bridge:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y), TB = typeof T_BRIDGE !== 'undefined' ? T_BRIDGE : -1;
    const run = (dx, dy) => { let n = 0; for (const s of [-1, 1]) for (let k = 1; k <= 6 && tt(x + dx * k * s, y + dy * k * s) === TB; k++) n++; return n; };
    const horiz = gNS && !gWE ? true : gWE && !gNS ? false : run(1, 0) >= run(0, 1);
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0); c.drawImage(t.cv, md(horiz ? x : y, 2) * P, 0, P, P, 0, 0, T + 0.02, T + 0.02); c.restore(); }; }
  function landBridgeEdge(bio) { const L = LN_OF[bio]; return function (c, x, y, X, Y, T) { const t = tex('bunder:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, 2) * P, 0, P, t.cv.height, X, Y - T * 0.02, T + 0.02, t.cv.height * T / P); }; }

  /* ======================= the engine's props, the lands, the decals: installed ======================= */
  const OLD = {};
  const LANDS = {
    sepulchre: { props: ['boxtomb', 'hourglass', 'stopclock', 'fallstone', 'sepurn', 'mourner', 'hourglass', 'dialslab', 'stopclock', 'boxtomb'] /* (the hourglass a fifth of them, as before: dungeon one's mechanic) */, propN: [4, 3], edge: ['stopclock', 'mourner', 'sepurn', 'boxtomb', 'dialslab', 'stopclock'], rim: 0.1 },
    twoages: { props: ['silverpillar', 'sunclock', 'silverpillar', 'marblebench', 'agesarch', 'gildedurn', 'ruinblock', 'silverpillar'], propN: [3, 3], edge: ['silverpillar', 'gildedurn', 'ruinblock', 'agesarch'], rim: 0.1 },
    borrowed: { props: ['voidobelisk', 'stairstub', 'voidobelisk', 'cornerglow', 'glassshard', 'hourlamp', 'floatstair', 'glassshard'], propN: [3, 3], edge: ['voidobelisk', 'hourlamp', 'glassshard', 'floatstair'], rim: 0.08 } };
  const dressFn = (EDGE2, rate) => ({ rm, i, G, RM, props, R, id, MW, walk, okFeature, first }) => { const TS0 = typeof T_SOLID !== 'undefined' ? T_SOLID : null; if (TS0 == null || first) return;
    const cells = []; for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) { const k = id(x, y); if (RM[k] === i && walk(k)) cells.push(k); }
    if (cells.length < 24) return;
    const rim = cells.filter(k => { const x = k % MW, y = (k / MW) | 0; return okFeature(x, y, i) && [1, -1, MW, -MW].some(d => G[k + d] === TS0 && !props.has(k + d)); });
    const connected = () => { const open = cells.filter(k => walk(k)); if (!open.length) return true; const seen = new Set([open[0]]), q = [open[0]];
      for (let h = 0; h < q.length; h++) for (const d of [1, -1, MW, -MW]) { const kk = q[h] + d; if (!seen.has(kk) && RM[kk] === i && walk(kk)) { seen.add(kk); q.push(kk); } }
      return seen.size >= open.length; };
    let want = Math.round(rim.length * rate), tries = 0;
    while (want > 0 && rim.length && tries++ < 120) { const j = Math.floor(R() * rim.length), k = rim[j]; rim.splice(j, 1);
      if ([1, -1, MW, -MW, MW + 1, MW - 1, -MW + 1, -MW - 1].filter(d => props.has(k + d)).length > 0) continue;
      const was = G[k]; G[k] = TS0; if (!connected()) { G[k] = was; continue; } props.set(k, EDGE2[Math.floor(R() * EDGE2.length)]); want--; } };
  const FLOORC = { sepulchre: ['#262C3B', '#232938', '#29303F'], twoages: ['#E3DDD0', '#DAD4C8', '#E8E2D6'], borrowed: ['#251E38', '#221B35', '#28213C'] };
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS, EXT = (HAS_W && (window.PROP_EXT = window.PROP_EXT || {})) || {};
    for (const k in NEWK) if (!PR[k]) PR[k] = function () { const kin = NEWK[k], f = PR[kin] && PR[kin].__sepp ? OLD[kin] : PR[kin]; return f ? f.apply(this, arguments) : undefined; };
    for (const k of KINDS) { if (!PR[k] || PR[k].__sepp) continue; const old = OLD[k] = PR[k];
      const f = function (c, P, v, B) { const bio = bioOf(B); if (!bio || off()) return (old || function () {}).apply(this, arguments); const L = BIO_L[bio], vv = (v | 0) % 4, s = sprite(k, vv % 2, Math.max(8, Math.min(CAP, Math.round(P))), true, L); if (!s) return old.apply(this, arguments);
        const q = P / s.P; c.save(); if (vv >= 2) c.scale(-1, 1); c.drawImage(s.cv, -s.ax * q, -s.ay * q, s.cv.width * q, s.cv.height * q); c.restore(); };
      f.__sepp = 1; PR[k] = f;
      let b = [0, 0, 0, 0]; for (let v = 0; v < 2; v++) { const q = DEF[k].box(v).map(z => z * (DEF[k].sc || 1)); b = [Math.min(b[0], q[0]), Math.min(b[1], q[1]), Math.max(b[2], q[2]), Math.max(b[3], q[3])]; }
      const E = EXT[k] || [2.4, 2.9]; EXT[k] = [Math.max(E[0], Math.max(-b[0], b[2]) * 2 - 1.6 + 0.1), Math.max(E[1], -b[1] - 0.25 + 0.1)]; }
    if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) for (const k of KINDS) BREAK_FX.KIND[k] = Object.assign({}, BREAK_FX.KIND[k] || {}, DEF[k].mat);
    if (typeof PROP_EL !== 'undefined') for (const k of KINDS) PROP_EL[k] = DEF[k].el;
    try { if (typeof VEH_SMASH !== 'undefined' && VEH_SMASH.KINDS) for (const k of KINDS) if (!DEF[k].keepHp) VEH_SMASH.KINDS.add(k); } catch (e) {}
    for (const bio of ['sepulchre', 'twoages', 'borrowed']) { const B = typeof BIOMES !== 'undefined' && BIOMES[bio]; if (!B || B.__sepp) continue; B.__sepp = 1;
      const fns = { floorFn: landFloor(bio), wallFn: landWall(bio), roofFn: landRoof(bio), cliffTint: landCliff(bio), bridgeFn: landBridge(bio), bridgeEdge: landBridgeEdge(bio), floorUnder: true };
      { let oldF = B.floor; const F2 = FLOORC[bio]; Object.defineProperty(B, 'floor', { configurable: true, enumerable: true, get: () => (BP() ? F2 : oldF), set: v2 => { oldF = v2; } }); }
      { const Ld = LANDS[bio], old = { props: B.props, propN: B.propN, dress: B.dress }, now2 = { props: Ld.props, propN: Ld.propN, dress: dressFn(Ld.edge, Ld.rim) };
        for (const n of ['props', 'propN', 'dress']) Object.defineProperty(B, n, { configurable: true, enumerable: true, get: () => (BP() ? now2[n] : old[n]), set: v2 => { old[n] = v2; } }); }
      for (const n in fns) { OLD[bio + ':' + n] = B[n]; Object.defineProperty(B, n, { configurable: true, enumerable: true, get: () => (BP() ? fns[n] : OLD[bio + ':' + n]), set: v2 => { OLD[bio + ':' + n] = v2; } }); } }
    if (typeof DECALS !== 'undefined') for (const bio in DECAL_LISTS) { const d0 = Object.getOwnPropertyDescriptor(DECALS, bio); if (d0 && d0.get) continue; const was = DECALS[bio]; Object.defineProperty(DECALS, bio, { configurable: true, enumerable: true, get: () => (BP() ? DECAL_LISTS[bio] : was), set: () => {} }); }
    if (HAS_W) { window.DECAL_EXT = window.DECAL_EXT || {}; for (const k of Object.keys(DEC)) { if (DECAL_EXT[k] && DECAL_EXT[k].__sepp) continue; const f = function (c, d, s, lw, T) { decal(c, k, d, s, T || (s / (0.18 * (d.s || 1))), lw); }; f.__sepp = 1; DECAL_EXT[k] = f; } }
  }
  install();

  /* ======================= release, warm-up ======================= */
  function release(keepTex) { if (!keepTex) BURSTS.length = 0; CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); if (!keepTex) { TEX.forEach(t => { if (t && t.cv) t.cv.width = t.cv.height = 1; }); TEX.clear(); BASE = 0; } }
  function trimKinds() { for (const [k, s2] of CACHE) { const n = k.split('|')[0]; if (KINDS.includes(n)) { if (s2 && s2.cv) s2.cv.width = s2.cv.height = 1; CACHE.delete(k); STATS.released++; } } }
  function hookRelease() { try { if (typeof DunWorld === 'undefined' || !DunWorld.dropProps || DunWorld.dropProps.__sepp) return; const od = DunWorld.dropProps; const f = function () { try { od.apply(this, arguments); } finally { release(); } }; f.__sepp = 1; DunWorld.dropProps = f; } catch (e) {} }
  hookRelease();
  function warm(P) { if (!BP() || !P || !(P.T > 0)) return []; const S2 = P.S || {}, F = P.F || {}; if (S2.kind === 'boss' || F.fiend) return [];
    const k = P.k || 1, PB = Math.min(CAP, Math.round(P.T * k)); BASE = PB; const bio = BIO_L[F.biome] ? F.biome : 'sepulchre', L = BIO_L[bio], jobs = [], job = f => jobs.push(() => { try { f(); } catch (e) {} });
    for (const n of ['floor', 'bank', 'roof', 'cliff', 'bridge', 'bunder']) for (const j of texJobs(n + ':' + L, PB)) jobs.push(j);
    if (L === 'ages') for (const j of texJobs('floor:agesr', PB)) jobs.push(j);
    for (const d of DECS_OF[bio]) for (let v = 0; v < 4; v++) job(() => sprite(d, v, Math.round(PB * 1.25), true, L));
    if (!gpuOK()) return jobs;   // (no GPU light: the trials draw their old 2D pieces, so theirs are not painted)
    const n = S2.name || ''; for (const [re, list] of PIECES_OF) if (re.test(n)) for (const [nm, v, L2] of list) job(() => sprite(nm, v, PB, true, L2 || L));
    for (const [re, list] of TEX_OF) if (re.test(n)) for (const nm of list) for (const j of texJobs(nm, PB)) jobs.push(j);
    return jobs; }

  /* ======================= breaking them (every prop of the three lands but the hourglass and the stair stub) =======================
     The props stand on what was a room's floor, so a break only gives back floor inside its room: no way past a trial or a
     gate opens (the trials' pieces are not props and do not break; the boss arenas hold none). The engine breaks them
     (20l): the tile turns to floor and BREAK_FX shatters the painted picture in its material. Here: the hit points (the big
     ones take more), each kind's debris (tomb stone grit and gold flakes, glass and its light, marble chips, violet glass),
     and a feathered GPU burst of its light; lowFx: fewer pieces, no ring. Every burst ends within 1.6 s. */
  const HPK = { boxtomb: 4, fallstone: 4, sepurn: 2, stopclock: 3, mourner: 3, dialslab: 4, silverpillar: 3, sunclock: 3, marblebench: 2, agesarch: 4, gildedurn: 2, ruinblock: 3, voidobelisk: 4, cornerglow: 3, glassshard: 2, hourlamp: 2, floatstair: 3 };
  const DEBRIS = { boxtomb: { col: GOLD, dust: '#3A4258', n: [['rock', '#2C3446', 12], ['shard', GOLD, 4], ['smoke', 'rgba(58,66,88,', 5]] },
    fallstone: { col: GOLD, dust: '#3A4258', n: [['rock', '#2C3446', 14], ['spark', SKY, 8], ['smoke', 'rgba(58,66,88,', 5]] },
    sepurn: { col: '#E4EAF2', dust: '#6A7488', n: [['shard', '#C8D2E0', 10], ['shard', GOLD, 3], ['smoke', 'rgba(106,116,136,', 3]] },
    stopclock: { col: GOLD, dust: '#3A2418', n: [['twig', '#4A2A1A', 12], ['shard', '#F0E8D8', 6], ['spark', GOLD, 6], ['smoke', 'rgba(58,36,24,', 3]] },
    mourner: { col: '#C8D2EA', dust: '#4A5470', n: [['rock', '#5A6684', 12], ['spark', GOLD, 4], ['smoke', 'rgba(74,84,112,', 4]] },
    dialslab: { col: GOLD, dust: '#3A4258', n: [['rock', '#2C3446', 12], ['shard', GOLD, 6], ['smoke', 'rgba(58,66,88,', 5]] },
    silverpillar: { col: '#FFFFFF', dust: '#E9E3D5', n: [['rock', '#E9E3D5', 12], ['shard', GOLD, 4], ['smoke', 'rgba(233,227,213,', 5]] },
    sunclock: { col: GOLD, dust: '#E9E3D5', n: [['rock', '#E9E3D5', 10], ['shard', GOLD, 6], ['smoke', 'rgba(233,227,213,', 4]] },
    marblebench: { col: '#FFFFFF', dust: '#E9E3D5', n: [['rock', '#EFEADF', 10], ['smoke', 'rgba(233,227,213,', 4]] },
    agesarch: { col: '#FFFFFF', dust: '#E9E3D5', n: [['rock', '#E9E3D5', 14], ['shard', GOLD, 4], ['smoke', 'rgba(233,227,213,', 6]] },
    gildedurn: { col: GOLD, dust: '#E9E3D5', n: [['shard', '#EFEADF', 12], ['shard', GOLD, 5], ['smoke', 'rgba(233,227,213,', 3]] },
    ruinblock: { col: '#FFFFFF', dust: '#E9E3D5', n: [['rock', '#E9E3D5', 12], ['rock', '#8A9068', 3], ['smoke', 'rgba(233,227,213,', 5]] },
    voidobelisk: { col: VIO, dust: '#2A2240', n: [['rock', '#2A2240', 12], ['spark', '#E2D4FF', 10], ['spore', VIO, 6], ['smoke', 'rgba(42,34,64,', 4]] },
    cornerglow: { col: VIO, dust: '#2A2240', n: [['rock', '#2A2240', 10], ['spore', VIO, 8], ['smoke', 'rgba(42,34,64,', 3]] },
    glassshard: { col: VIO, dust: '#B79CFF', n: [['shard', '#B79CFF', 14], ['spark', '#F0E8FF', 10], ['spore', VIO, 6]] },
    hourlamp: { col: '#FFE2B0', dust: '#3A3448', n: [['shard', '#3A3448', 8], ['shard', '#D8E4F4', 6], ['spark', '#FFE2B0', 10], ['spore', '#FFE2B0', 4]] },
    floatstair: { col: VIO, dust: '#3A2E5E', n: [['rock', '#3A2E5E', 12], ['spore', VIO, 5], ['smoke', 'rgba(58,46,94,', 4]] } };
  const BURSTS = [];
  function sepBreak(X, p) { const D = DEBRIS[p.kind]; if (!D || !X || !X.part) return; const lf = lowFx(), k = lf ? 0.5 : 1, R = Math.random, h = Math.max(0.6, -(DEF[p.kind].box(0)[1]) * 0.5);
    for (const [kind, col, n] of D.n) for (let i = 0; i < Math.round(n * k); i++) { const a = R() * TAU, v = 1.5 + R() * 3.5, x = p.x + (R() - 0.5) * 0.8, y = p.y - 0.2 - R() * h;
      if (kind === 'smoke') X.part({ kind: 'smoke', x, y: p.y - 0.3, vx: (R() - 0.5) * 0.8, vy: -0.4 - R() * 0.4, life: 1.1, max: 1.1, size: 0.5 + R() * 0.35, color: col });
      else if (kind === 'twig') X.part({ kind: 'petal', x, y, vx: Math.cos(a) * v * 0.6, vy: -1.5 - R() * 2, g: 4, life: 1.0 + R() * 0.4, max: 1.4, size: 3 + R() * 3, rot: R() * 6, vr: (R() - 0.5) * 10, color: col });
      else if (kind === 'spore') X.part({ kind: 'glow', x, y, vx: Math.cos(a) * v * 0.3, vy: -0.6 - R() * 0.8, drag: 1, life: 1.2, max: 1.2, size: 0.1 + R() * 0.08, color: col });
      else X.part({ kind: kind === 'rock' ? 'shard' : kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, g: kind === 'spark' ? 3 : 9, life: 0.7 + R() * 0.4, max: 1.1, size: 3 + R() * 3, rot: R() * 6, vr: (R() - 0.5) * 12, color: col }); }
    if (BURSTS.length < 24) BURSTS.push({ x: p.x, y: p.y, h, col: D.col, dust: D.dust, kind: p.kind, t: 0, life: 1.6, X });
    for (const [dx, dy, r, col] of glowsOf(p.kind, p.v | 0)) if (BURSTS.length < 32) BURSTS.push({ x: p.x + dx, y: p.y + dy, h: 0, col, kind: 'spark', t: 0, life: 0.9, r, X }); }
  function burstsTick(dt) { for (let i = BURSTS.length - 1; i >= 0; i--) { BURSTS[i].t += dt; if (BURSTS[i].t >= BURSTS[i].life) BURSTS.splice(i, 1); } }
  function burstsDraw(G, X) { if (!BURSTS.length) return; const T = X.Tz(), lf = lowFx();
    for (const b of BURSTS) { if (b.X !== X) continue; const u = b.t / b.life, Xs = X.sx(b.x), Ys = X.sy(b.y), f = Math.pow(1 - u, 1.6);
      if (b.kind === 'spark') { G.Q.glow(Xs, Ys, T * b.r * (1.4 + u * 2.4), b.col, 0.55 * f); G.Q.glow(Xs, Ys, T * b.r * 0.5, '#FFFFFF', 0.6 * f); continue; }
      G.Q.glow(Xs, Ys - T * b.h * 0.6, T * (1.1 + b.h * 0.8) * (0.6 + u * 0.8), b.col, 0.34 * f);
      G.Q.glow(Xs, Ys, T * (1.6 + u * 1.7), b.dust, 0.2 * f, 0.4);
      if (!lf) G.Q.ring(Xs, Ys, T * (0.5 + u * 2.2), b.col, 0.26 * f, T * 0.35 * (1 - u * 0.5), 0.45); } }
  function hookBreak() { try { if (typeof BREAK_FX === 'undefined' || !BREAK_FX.prop || BREAK_FX.prop.__sepp) return; const op = BREAK_FX.prop; const f = function (Xa, p) { const r = op.apply(this, arguments); try { if (p && DEBRIS[p.kind] && BIO_L[p.biome] && !off()) sepBreak(Xa, p); } catch (e) {} return r; }; f.__sepp = 1; BREAK_FX.prop = f; } catch (e) {} }
  hookBreak();
  const toughen = props => { for (const p of props || []) if (HPK[p.kind] && BIO_L[p.biome] && !p.sepHp && !p.broken) { p.sepHp = 1; p.hp = Math.max(p.hp || 0, HPK[p.kind]); } };

  /* ======================= the light (GPU): props' glows, the trials' queued light, motes ======================= */
  // where each prop's live lights are (tiles from its feet; v 0..1, mirrored for 2..3): [dx, dy, r, colour, kind]
  function glowsOf(kind, v) { const sc = (DEF[kind] && DEF[kind].sc) || 1, o = glows0(kind, v); return sc === 1 ? o : o.map(([dx, dy, r, col, k]) => [dx * sc, dy * sc, r * sc, col, k]); }
  function glows0(kind, v) { const vv = (v | 0) % 2, m = (v | 0) % 4 >= 2 ? -1 : 1, out = [];
    if (kind === 'hourglass') out.push([0, vv ? -1.34 : -1.3, 0.22, '#FFD890', 'orb']);
    else if (kind === 'fallstone') { const z0 = vv ? 0.36 : 0.95; out.push([0, -(z0 + 0.22), 0.18, GOLD, 'crys'], [0, -0.04, 0.55, '#FFD890', 'pool'], [0, -2.16, 0.1, GOLD, 'dial']); }
    else if (kind === 'stopclock') out.push([0, vv ? -1.02 : -1.78, vv ? 0.16 : 0.2, SKY, 'dial']);
    else if (kind === 'boxtomb') { out.push([0, -0.4, 0.1, GOLD, 'dial']); if (!vv) for (const x of [-0.86, 0.86]) out.push([x * m, 0.08 - (0.2 + (x > 0 ? 0.06 : 0)) - 0.06, 0.08, '#FFD890', 'orb']); }   // (the candles' flames)
    else if (kind === 'mourner') out.push([0, vv ? -0.97 : -1.25, 0.08, GOLD, 'eye']);
    else if (kind === 'voidobelisk') { if (vv) out.push([0, -1.3, 0.3, VIO, 'crys'], [0, -0.7, 0.18, VIOD, 'vein']); else out.push([0, -0.7, 0.2, VIO, 'vein'], [0, -1.4, 0.18, VIO, 'vein'], [0, -2.0, 0.14, VIO, 'vein']); }
    else if (kind === 'cornerglow') { out.push([-0.32 * m, vv ? -0.7 : -0.6, 0.6, VIOD, 'crys']); if (vv) out.push([0.15 * m, -1.05, 0.22, VIO, 'vein']); }
    else if (kind === 'glassshard') { for (const [x, y, r, h, tip, a] of SHARDS[vv]) out.push([(x + Math.sin(a) * h * 0.5) * m, -y - Math.cos(a) * h * 0.5, r * 2.4, VIO, 'crys'], [(x + Math.sin(a) * (h + tip) * 0.9) * m, -y - Math.cos(a) * (h + tip) * 0.9, r, '#F0E8FF', 'tip']); }
    else if (kind === 'hourlamp') { const [lx, ly, lr] = LAMP[vv]; out.push([lx * m, ly, lr * 1.6, '#FFE2B0', 'orb']); }
    else if (kind === 'floatstair') out.push([0, -(vv ? 0.62 : 0.46) + 0.05, 0.4, VIOD, 'vein']);
    else if (kind === 'agesarch' && !vv) out.push([0, -3.02, 0.12, '#FFFFFF', 'tip']);
    else if (kind === 'gildedurn' && !vv) out.push([-0.1 * m, -1.15, 0.1, '#FFFFFF', 'tip']);
    else if (kind === 'sunclock' && !vv) out.push([0.1 * m, -0.95, 0.08, '#FFFFFF', 'tip']);
    return out; }
  const gpu = c => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__SEPP_GL === 0)) return null; const NM = HAS_W ? window.NIDHOGG_MOVES : null, F = NM && NM.FGFX; if (!F || !F.usable()) return null; return { F, Q: F.begin(c, null) }; } catch (e) { return null; } };
  const gpuEnd = (c, G) => { if (G) try { G.F.flush(c); } catch (e) {} };
  const gpuOK = () => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__SEPP_GL === 0)) return false; const NM = HAS_W ? window.NIDHOGG_MOVES : null; return !!(NM && NM.FGFX && NM.FGFX.usable()); } catch (e) { return false; } };
  const QL = [], QO = []; let LIVE = null;
  const ql = (fn, a, b, c2, d, e, f, g2, h, i) => { if (QL.length < 500) QL.push([fn, a, b, c2, d, e, f, g2, h, i]); };
  const qo = (fn, a, b, c2, d, e, f, g2, h, i) => { if (QO.length < 500) QO.push([fn, a, b, c2, d, e, f, g2, h, i]); };   // (light over the actors: the drawOver pass)
  function qFlush(G, Q) { for (const q of Q) { try { G.Q[q[0]](q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], q[9]); } catch (e) {} } Q.length = 0; }
  const ready = X => !!(X && LIVE && LIVE.X === X && !off() && BP() && gpuOK());
  function lights(X) { const F = X.F || {}, bio = BIO_L[F.biome] ? F.biome : 'sepulchre', L = BIO_L[bio], fiend = !!F.fiend; let glows = null, t = 0; const motes = [], LF = lowFx;
    const collect = () => { glows = []; for (const p of (X.props || [])) { if (!BIO_L[p.biome]) continue; for (const [dx, dy, r, col, kind] of glowsOf(p.kind, p.v | 0)) glows.push({ p, dx, dy, r, col, kind, ph: hh(p.k || Math.round(p.x * 7 + p.y * 13), 1, 3) * TAU }); } };
    const MCOL = { halls: ['#FFE2A0', GOLD, '#FFF4D0'], ages: ['#FFFFFF', SKY, '#FFE9B8'], stairs: [VIO, '#E2D4FF', '#FFFFFF'] }[L];
    const onScreen = () => { const T = X.Tz(), W = X.W(), Hh = X.H(); for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y); if (Xs > -T * 4 && Xs < W + T * 4 && Ys > -T * 3 && Ys < Hh + T * 4) return true; } return false; };
    return { X, L,
      update(dt) { t += dt; burstsTick(dt); if (!glows) { collect(); toughen(X.props); if (!fiend) trimKinds(); } if (QL.length > 400) QL.length = 0; if (QO.length > 400) QO.length = 0;
        const me = X.me, want = fiend ? 0 : LF() ? 4 : (L === 'halls' ? 14 : 10);
        if (motes.length < want && Math.random() < dt * 6) { const W = X.W() / X.Tz(), Hh = X.H() / X.Tz(); motes.push({ x: me.x + (Math.random() - 0.5) * W * 1.1, y: me.y + (Math.random() - 0.4) * Hh * 0.8, vx: (Math.random() - 0.5) * 0.25, vy: L === 'halls' ? -(0.12 + Math.random() * 0.2) : L === 'stairs' ? -(0.05 + Math.random() * 0.1) : (Math.random() - 0.5) * 0.1, t: 0, life: 3 + Math.random() * 4, s: 0.5 + Math.random() * 0.8, ph: Math.random() * 6, col: MCOL[Math.floor(Math.random() * MCOL.length)] }); }
        for (const e of motes) { e.t += dt; e.x += (e.vx + Math.sin(e.t * 1.3 + e.ph) * 0.15) * dt; e.y += (e.vy + Math.cos(e.t * 0.9 + e.ph) * 0.06) * dt; } for (let i = motes.length - 1; i >= 0; i--) if (motes[i].t > motes[i].life) motes.splice(i, 1); },
      drawGround(c) { if (!QL.length && !(glows && glows.length)) return; if (!QL.length && !onScreen()) return;   // (no GPU pass and no copy when nothing of it is in view)
        const G = gpu(c); if (!G) { QL.length = 0; return; } const T = X.Tz(), W = X.W(), Hh = X.H(), lf = LF();
        if (glows) for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y); if (Xs < -T * 4 || Xs > W + T * 4 || Ys < -T * 3 || Ys > Hh + T * 3) continue; if (q.kind === 'tip' || q.kind === 'eye' || (lf && q.kind !== 'crys' && q.kind !== 'orb')) continue;
          const big = q.kind === 'orb' || q.kind === 'pool'; G.Q.glow(Xs, Ys - T * 0.05, q.r * T * (big ? 4.2 : 2.6), q.col, (big ? 0.2 : 0.13) + 0.04 * Math.sin(t * 1.3 + q.ph), 0.42); }
        qFlush(G, QL); gpuEnd(c, G); },
      drawOver(c) { if (!QO.length && !(glows && glows.length) && !BURSTS.length && !motes.length) return; const G = gpu(c); if (!G) { QO.length = 0; return; } const T = X.Tz(), W = X.W(), Hh = X.H(), lf = LF();
        if (glows) for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y) + q.dy * T; if (Xs < -T * 3 || Xs > W + T * 3 || Ys < -T * 4 || Ys > Hh + T * 3) continue; if (q.kind === 'pool') continue;
          const k = 0.75 + 0.25 * Math.sin(t * (q.kind === 'orb' ? 2.2 : 1.6) + q.ph); if (lf && (q.kind === 'tip' || q.kind === 'dial')) continue;
          if (q.kind === 'tip') { const tw = Math.max(0, Math.sin(t * 1.9 + q.ph * 3)); G.Q.glow(Xs, Ys, q.r * T * 1.6, q.col, 0.22 * tw); if (tw > 0.8 && !lf) G.Q.star(Xs, Ys, q.r * T * 2.2 * (tw - 0.6), (tw - 0.8) * 3, '#FFFFFF'); continue; }
          if (q.kind === 'dial') { G.Q.glow(Xs, Ys, q.r * T * 2, q.col, 0.16 * k); continue; }
          G.Q.glow(Xs, Ys, q.r * T * 1.8, q.col, (q.kind === 'orb' ? 0.5 : q.kind === 'eye' ? 0.45 : 0.3) * k); G.Q.glow(Xs, Ys, q.r * T * 0.45, '#FFFFFF', (q.kind === 'orb' ? 0.55 : 0.32) * k); }
        qFlush(G, QO); burstsDraw(G, X);
        for (const e of motes) { const a = Math.sin(e.t / e.life * Math.PI), Xs = X.sx(e.x), Ys = X.sy(e.y); if (Xs < -10 || Xs > W + 10 || Ys < -10 || Ys > Hh + 10) continue; G.Q.glow(Xs, Ys, T * 0.12 * e.s, e.col, a * 0.42); G.Q.glow(Xs, Ys, T * 0.035 * e.s, '#FFFFFF', a * 0.65); }
        gpuEnd(c, G); },
      refresh() { glows = null; } }; }
  /* the stage exits are the Drowned Belfry's doors (BEL_DOORS, 20n9d: its relief door, lock and swing, dust and light, as
     v437 GR gave the Garden), painted in each land's light with its own rune glass and light: old gold in the Halls, the white
     sun in Two Ages, the violet void on the Stairs (themes 'sephalls' / 'sepages' / 'sepstairs'). The exit before a boss is
     the Belfry's boss door, the others its standard door. Positions, trigger radius and progression are the stage's own
     (H.setExit): the door only reads whether the stage is done (self.done); it changes no tile, so nothing is repainted as it
     opens. Its pictures are painted on the loading screen (warmDoor); it is let go with the stage (BEL.releaseStale); the
     boss arenas and the Gemini gate (20s3) keep theirs. Without BELPROPS (or with __SEPP 0) the old stone gate is drawn. */
  const DOOR_TH = { sepulchre: 'sephalls', twoages: 'sepages', borrowed: 'sepstairs' };
  function doorThemes() { try { if (typeof BEL_DOORS === 'undefined' || !BEL_DOORS || !BEL_DOORS.defTheme) return; const D = BEL_DOORS.defTheme;
    D('sephalls', { light: LIGHT.halls, gem: [1.0, 0.8, 0.4], rune: '#E8CF8E', runeHi: '#FFF6DC', ring: '#FFE2A0', lit: '#FFE9B8', litFloor: '#E8CF8E', caustic: '#FFE2A0', mote: '#FFF4D0', smoke: '#4A4E5E', drip: '#FFE9B8',
      recess: ['#04060C', '#2A2214', '#0A0C14'], glowIn: [[255, 246, 222], [236, 204, 130], [120, 88, 36]] });
    D('sepages', { light: LIGHT.ages, gem: [0.98, 0.94, 0.78], rune: '#FFF4D0', runeHi: '#FFFFFF', ring: '#FFFFFF', lit: '#FFFFFF', litFloor: '#FFF4D8', caustic: '#FFFDF0', mote: '#FFFFFF', smoke: '#B8B2A6', drip: '#FFFFFF',
      recess: ['#4A4A58', '#E8E4D8', '#6A6A78'], glowIn: [[255, 255, 255], [255, 244, 214], [200, 180, 140]] });
    D('sepstairs', { light: LIGHT.stairs, gem: [0.66, 0.46, 1.0], rune: '#C9B0FF', runeHi: '#F2EAFF', ring: '#D8C6FF', lit: '#D8C6FF', litFloor: '#8E6BD0', caustic: '#C9B0FF', mote: '#F2EAFF', smoke: '#3A2E5E', drip: '#E2D4FF',
      recess: ['#040008', '#2A1A4A', '#0A0614'], glowIn: [[242, 234, 255], [190, 160, 255], [70, 40, 140]] }); } catch (e) {} }
  doorThemes();
  const DOORS = () => (!off() && typeof BEL_DOORS !== 'undefined' && BEL_DOORS && BEL_DOORS.stage && BEL_DOORS.themed) ? BEL_DOORS : null;
  const doorKind = (Rf, i) => { const nx = Rf.stages[i + 1]; return nx && nx.kind === 'boss' ? 'boss' : 'std'; };
  function hookRift() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.sepulchre; if (!Rf || Rf.__sepp) return; Rf.__sepp = 1;
    const oe = Rf.everyStage; Rf.everyStage = function (X, self, H) { let a = {}; try { a = oe ? oe.apply(this, arguments) || {} : {}; } catch (e) { a = {}; } if (off()) return a;
      let C = null; try { const D = DOORS(), S2 = (self && self.S) || {}; if (D && S2.kind !== 'boss' && X.F.rift && !X.F.rift.gate && H && H.exit) { C = { t: 0, X, exitPos: () => H.exit() }; D.stage(X, C, doorKind(Rf, X.F.rift.stage), D.themed(DOOR_TH[X.F.biome] || 'sephalls')); } } catch (e) { C = null; }
      const tickDoor = dt => { if (!C) return; C.t += dt; try { BEL_DOORS.tick(C, dt, !!self.done); } catch (e) {} };
      let L = null; try { L = lights(X); } catch (e) { L = null; } if (!L) return C ? Object.assign({}, a, { update(dt) { if (a.update) a.update(dt); tickDoor(dt); }, door: C }) : a; LIVE = L; QL.length = 0; QO.length = 0;
      return Object.assign({}, a, { update(dt) { if (a.update) a.update(dt); L.update(dt); tickDoor(dt); }, drawGround(c) { if (a.drawGround) a.drawGround(c); L.drawGround(c); }, drawOver(c) { if (a.drawOver) a.drawOver(c); L.drawOver(c); }, sepp: L, door: C }); };
    const op = Rf.preload; Rf.preload = function (P) { let a = []; try { a = op ? op.apply(this, arguments) || [] : []; } catch (e) {} let b = []; try { b = warm(P); } catch (e) {}
      let d = []; try { const D = DOORS(), S2 = P && P.S; if (D && S2 && S2.kind !== 'boss' && P.F && P.F.rift && !P.F.rift.gate) d = D.warmDoor(P, doorKind(Rf, P.F.rift.stage), DOOR_TH[P.F.biome] || 'sephalls') || []; } catch (e) {}
      return a.concat(b, d); }; } catch (e) {} }
  hookRift();
  /* ======================= the trials' pieces (their look, not their rules) =======================
     the Hour Court: the stone hourglass throwers (their sphere is light), the crystals, the time-balls (their hands turn
     live), the dial in the floor (light); the Borrowed Beast: the three growths (cracked amber, blue crystal, a strapped
     plate), the nests (light), the sleeping guardian (its eyes light as it wakes); the Hall in Two Ages: the hourglass
     levers (a marble base, a gilded arm turned live), the bridge catch (open, braced), the silver bridge's deck (a
     texture), the fallen wall's blocks; the Room That Remembers: the memory anchors (a hourglass turning over each),
     the seed, the roof slab, the riverside bed (bare, planted), the sluice (its arm turned live), the drain (plugged,
     open), the statue (whole, crumbled); the Three Statues: the wake ring and the masons' mending threads (light);
     the Rolling Hour: the GIANT and FIRE orbs and the pet's blaze (light). */
  function paintThrower(K, S, v, L) { const sd = 201, c = S.c; contact(K, S, 0.66, 0.24, 0.6);
    // a stepped base, two fluted stone posts with gilt capitals round a great glass, a carved crown (the sphere in it is light)
    box(K, S, 0, 0.02, 0.5, 0.36, 0, 0.1, 0.03, (f, u, vv) => tombM(K, u * 2, vv * 2, sd, 0.8));
    box(K, S, 0, 0, 0.42, 0.3, 0.1, 0.24, 0.03, (f, u, vv) => { tombM(K, u * 2, vv * 2, sd, 1); if (f === 'f' && band(vv, 0.18, 0.21)) goldM(K, u * 5, vv * 5, sd, 0.4); });
    K.tube(S, [[0, -0.26], [0, -1.46]], 0.035, 0.035, (t, s) => { tombM(K, s, t * 4, sd + 2, 0.9); K.M.ao *= 0.6; }); S.unlock();
    layer(K, S, 0.45, S2 => K.rev(S2, 0, -0.28, hgProf(0, 1.16, 0.27), 0, 1.16, { mat: () => glassM(K, GLASSC, 0.28, 0.02) }));
    for (const x of [-0.34, 0.34]) { K.rev(S, x, -0.24, h => h < 0.06 ? 0.07 : 0.05, 0, 1.18, { mat: (u, h) => { tombM(K, u * 2 + x, h * 2, sd + 1, 1.12); K.M.ao *= fl(u, 2.2); } }); K.rev(S, x, -1.42, h => lerp(0.05, 0.08, h / 0.08), 0, 0.08, { top: true, mat: (u, h) => goldM(K, u * 4, h * 9, sd, 0.5) }); } S.unlock();
    box(K, S, 0, 0, 0.44, 0.31, 1.42, 1.62, 0.03, (f, u, vv) => { tombM(K, u * 2, vv * 2, sd + 3, 1.05); if (f === 'f' && band(vv, 1.47, 1.5)) goldM(K, u * 5, vv * 5, sd, 0.4); });
    K.tube(S, arcP(0, -1.72, 0.22, Math.PI, TAU, 14, 0.9), 0.04, 0.04, (t, s) => goldM(K, t * 5, s, sd + 4, 0.5)); S.unlock(); K.ball(S, 0, -1.94, 0.06, 0.06, (dx, dy) => goldM(K, dx, dy, sd + 5, 0.7)); S.unlock();
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,250,235,.35)'; c.lineWidth = 0.02; c.lineCap = 'round'; c.beginPath(); c.moveTo(-0.18, -0.44); c.quadraticCurveTo(-0.22, -0.62, -0.07, -0.8); c.stroke(); c.restore();
    sheen(c, -0.5, -2, 0.2, -0.3, GOLD, 0.12); K.ink(S, INK[L], 0.45); }
  const GOLDC = [1.0, 0.82, 0.42], AMBERC = [1.0, 0.66, 0.24], BLUEC = [0.5, 0.84, 1.0];
  function paintCourtgem(K, S) { halo(S.c, 0, -0.1, 0.34, GOLD, 0.3);
    prism(K, S, 0, 0, 0.12, 0.11, 0.22, 0.18, 0.05, (f, q, wt) => crystalM(K, GOLDC, f, q, wt, 0.65)); prism(K, S, 0, 0, 0.12, 0.11, 0, 0.2, Math.PI + 0.05, (f, q, wt) => crystalM(K, GOLDC, f, q, wt, 0.45)); S.unlock();
    K.glint(S.c, -0.03, -0.26, 0.09, 0.8); K.ink(S, [60, 40, 10], 0.45); }
  function paintTimeball(K, S, v) { const col = v ? [1.0, 0.55, 0.78] : [1.0, 0.84, 0.48];
    K.ball(S, 0, 0, 0.48, 0.48, (dx, dy) => { const M = K.M, e = Math.hypot(dx, dy); M.r = col[0] * 0.8; M.g = col[1] * 0.8; M.b = col[2] * 0.8; M.rg = 0.18; M.cc = 1; M.er = col[0] * 0.5 * (1 - e * 0.7); M.eg = col[1] * 0.5 * (1 - e * 0.7); M.eb = col[2] * 0.5 * (1 - e * 0.7); }); S.unlock();
    const c = S.c; c.save(); c.globalCompositeOperation = 'source-atop'; c.strokeStyle = v ? 'rgba(120,20,60,.6)' : 'rgba(90,60,10,.6)'; c.lineWidth = 0.02; c.beginPath(); c.arc(0, 0, 0.36, 0, TAU); c.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 0.3, Math.sin(a) * 0.3); c.lineTo(Math.cos(a) * 0.36, Math.sin(a) * 0.36); c.stroke(); } c.restore();
    K.glint(c, -0.16, -0.18, 0.2, 0.7); K.ink(S, v ? [70, 10, 40] : [60, 40, 10], 0.55); }
  const growthBase = (K, S, sd, mat) => { lump(K, S, 0, -0.06, 0.46, 0.14, { amp: 0.3, fr: 3, sd, bump: 0.5, leaf: 12, flat: 0.6, mat }); S.unlock(); };
  function paintAmberg(K, S, v) { const sd = 211 + v, c = S.c; contact(K, S, 0.55, 0.2, 0.6); halo(c, 0, -0.6, 0.7, '#FFC86A', 0.22);
    growthBase(K, S, sd, (dx, dy, ao, e, nz, wx, wy) => tombM(K, wx * 3, wy * 3, sd, 1.1));
    for (const [x, h, r, a] of [[-0.24, 0.8, 0.14, -0.3], [0.26, 0.62, 0.12, 0.35], [0.02, 1.15, 0.18, 0.04]]) prism(K, S, x, 0, r, r * 0.9, h, r * 1.3, a, (f, q, wt) => { crystalM(K, AMBERC, f, q, wt, 0.45); if (Math.abs(Math.sin(q * 7 + wt * 11)) < 0.06) K.M.ao *= 0.4; }); S.unlock();
    c.save(); c.globalCompositeOperation = 'source-atop'; c.strokeStyle = 'rgba(90,40,6,.8)'; c.lineWidth = 0.022; c.lineCap = 'round'; c.beginPath(); c.moveTo(-0.1, -1.0); c.lineTo(0.06, -0.7); c.lineTo(-0.04, -0.45); c.lineTo(0.08, -0.2); c.moveTo(0.06, -0.7); c.lineTo(0.16, -0.62); c.stroke(); c.restore();
    K.glint(c, 0.0, -1.28, 0.12, 0.6); K.ink(S, [70, 30, 6], 0.5); }
  function paintBlueg(K, S, v) { const sd = 215 + v, c = S.c; contact(K, S, 0.55, 0.2, 0.6); halo(c, 0, -0.6, 0.7, '#7FD3F2', 0.25);
    growthBase(K, S, sd, (dx, dy, ao, e, nz, wx, wy) => { tombM(K, wx * 3, wy * 3, sd, 1.2); K.M.b *= 1.2; });
    for (const [x, h, r, a] of [[-0.22, 0.95, 0.15, -0.22], [0.25, 0.72, 0.13, 0.3], [0.02, 1.35, 0.19, 0.02], [0.4, 0.4, 0.08, 0.7]]) prism(K, S, x, 0, r, r * 0.88, h, r * 1.4, a, (f, q, wt) => crystalM(K, BLUEC, f, q, wt, 0.55)); S.unlock();
    K.glint(c, 0.02, -1.5, 0.12, 0.7); K.glint(c, -0.4, -1.0, 0.08, 0.5); K.ink(S, [6, 30, 54], 0.5); }
  function paintPlateg(K, S, v) { const sd = 219 + v, c = S.c; contact(K, S, 0.62, 0.22, 0.65);
    // a heavy slab of stone bound in iron: straps and bolts, a ring to drag it by, chips off its edges
    box(K, S, 0, 0, 0.48, 0.24, 0, 1.02, 0.05, (f, u, vv) => { tombM(K, u * 2, vv * 2, sd, 1.3); K.M.r *= 1.12; K.M.g *= 1.04; if (f === 'f' && (band(vv, 0.16, 0.26) || band(vv, 0.72, 0.82))) ironM(K, u * 4, vv * 4, sd); if (f === 't') { K.M.r *= 1.1; K.M.g *= 1.1; K.M.b *= 1.1; } });
    box(K, S, 0, 0, 0.52, 0.27, 1.02, 1.12, 0.03, (f, u, vv) => tombM(K, u * 2, vv * 2, sd + 1, 1.4));
    for (const y of [-0.21 + 0.08, -0.77 + 0.08]) for (const x of [-0.38, -0.12, 0.12, 0.38]) K.ball(S, x, y, 0.035, 0.032, (dx, dy) => ironM(K, dx, dy, sd)); S.unlock();
    disc(K, S, 0, -0.5, 0.1, 0.1, (dx, dy) => ironM(K, dx, dy, sd + 2), { bv: 0.4 }); K.tube(S, arcP(0, -0.42, 0.13, 0.1, Math.PI - 0.1, 14, 1.1), 0.028, 0.028, (t, s) => ironM(K, t * 4, s, sd + 3)); S.unlock();
    chip(c, [[-0.5, -1.14], [-0.36, -1.14], [-0.5, -0.98]]); cracks(c, K.R1(sd), 5, -0.4, 0.4, -1.0, -0.1, 0.5, 0.05);
    K.ink(S, INK.halls, 0.5); }
  function paintGuardian(K, S) { const sd = 223, c = S.c, gm = (dx, dy, ao, e, nz, wx, wy) => { tombM(K, wx * 1.5, wy * 1.5, sd, 1.55); if (Math.abs(Math.sin(wx * 5 + wy * 3)) < 0.08) K.M.ao *= 0.85; };
    contact(K, S, 3.2, 0.45, 0.6);
    lump(K, S, 0, -0.95, 2.95, 0.95, { amp: 0.06, fr: 1.6, sd, bump: 0.35, leaf: 3, flat: 0.5, mat: gm });
    for (const s of [-1, 1]) lump(K, S, s * 1.95, -0.28, 0.78, 0.3, { amp: 0.08, fr: 2, sd: sd + s, bump: 0.35, leaf: 5, flat: 0.6, mat: gm });
    lump(K, S, 0, -1.52, 1.0, 0.8, { amp: 0.05, fr: 1.6, sd: sd + 3, bump: 0.3, leaf: 4, mat: gm });
    lump(K, S, 0, -0.78, 0.62, 0.42, { amp: 0.05, fr: 1.4, sd: sd + 5, bump: 0.25, leaf: 6, mat: (dx, dy, ao, e, nz, wx, wy) => gm(dx, dy, ao, e, nz, wx + 3, wy) });
    S.unlock();
    // its sleeping face: a broad brow, the eyes closed, nostrils; claws on the paws; a gold band over its brow and a collar
    for (const s of [-1, 1]) { groove(c, arcP(s * 0.96 * 0.333, -1.5, 0.22, 0.25, Math.PI - 0.25, 10), 0.03, 0.7, 'rgba(180,200,240,.3)'); for (let k = 0; k < 3; k++) groove(c, [[s * (1.7 + k * 0.22), -0.12], [s * (1.72 + k * 0.22), -0.26]], 0.025, 0.6, null); }
    for (const s of [-1, 1]) socket(c, s * 0.12, -0.92, 0.07, 0.05, null);
    K.tube(S, arcP(0, -1.45, 0.86, Math.PI * 1.12, Math.PI * 1.88, 20, 0.9), 0.06, 0.06, (t, s) => goldM(K, t * 6, s, sd, 0.5)); S.unlock();
    disc(K, S, 0, -2.18, 0.12, 0.14, (dx, dy) => goldM(K, dx * 2, dy * 2, sd + 1, 0.6), { bv: 0.4 });
    lichen(c, K.R1(sd), 14, -2.8, 2.8, -1.8, -0.1); cracks(c, K.R1(sd + 1), 12, -2.6, 2.6, -1.9, -0.2, 0.5, 0.08);
    sheen(c, -3, -2.4, 0, -0.3, GOLD, 0.12); K.ink(S, INK.halls, 0.55); }
  function paintAgelever(K, S) { const sd = 231, c = S.c; contact(K, S, 0.66, 0.24, 0.5);
    box(K, S, 0, 0.02, 0.52, 0.36, 0, 0.1, 0.03, (f, u, vv) => marbleM(K, u * 2, vv * 2, sd + 2, { tone: 0.96 }));
    box(K, S, 0, 0, 0.44, 0.3, 0.1, 0.4, 0.04, (f, u, vv) => { marbleM(K, u * 2, vv * 2, sd); if (f === 'f' && (band(vv, 0.31, 0.35) || band(vv, 0.14, 0.17))) goldM(K, u * 5, vv * 5, sd, 0.6); });
    for (const x of [-0.24, 0.24]) disc(K, S, x, -0.24, 0.06, 0.06, (dx, dy) => goldM(K, dx, dy, sd + 3, 0.6), { bv: 0.4 });
    groove(c, rectP(-0.12, -0.32, 0.12, -0.16), 0.01, 0.35, null, true);
    disc(K, S, 0, -0.46, 0.13, 0.08, (dx, dy) => goldM(K, dx, dy, sd, 0.6), { bv: 0.5 }); K.ink(S, INK.ages, 0.4); }
  function paintAgearm(K, S) { const sd = 233, c = S.c;   // (its pivot at 0, 0, pointing up)
    K.tube(S, [[0, 0], [0, -0.88]], 0.05, 0.04, (t, s) => goldM(K, s, t * 5, sd, 0.6)); S.unlock();
    for (const y of [-0.86, -1.26]) { K.rev(S, 0, y + 0.02, h => 0.2, 0, 0.04, { top: true, mat: (u, h) => goldM(K, u * 4, h * 9, sd + 1, 0.6) }); } S.unlock();
    layer(K, S, 0.55, S2 => K.rev(S2, 0, -0.9, hgProf(0, 0.32, 0.16), 0, 0.32, { mat: () => glassM(K, GLASSC, 0.3, 0.05) }));
    for (const x of [-0.17, 0.17]) K.tube(S, [[x, -0.86], [x, -1.24]], 0.02, 0.02, (t, s) => goldM(K, s, t * 4, sd + 2, 0.6)); S.unlock();
    K.glint(c, -0.06, -1.12, 0.1, 0.5); K.ink(S, INK.ages, 0.45); }
  function paintAgecatch(K, S, v) { const sd = 235 + v; contact(K, S, 0.6, 0.22, 0.55);
    box(K, S, 0, 0, 0.5, 0.3, 0, 0.42, 0.04, (f, u, vv) => { marbleM(K, u * 2, vv * 2, sd, { tone: 0.95 }); if (f === 'f' && band(vv, 0.32, 0.36)) goldM(K, u * 5, vv * 5, sd, 0.6); });
    if (!v) { K.tube(S, [[-0.3, -0.5], [0.0, -0.98], [0.3, -0.5]], 0.07, 0.07, (t, s) => goldM(K, t * 4, s, sd, 0.1, 0.5)); }
    else { K.tube(S, [[-0.34, -0.48], [0.0, -0.62], [0.34, -0.48]], 0.07, 0.07, (t, s) => goldM(K, t * 4, s, sd, 0.8)); }
    S.unlock(); disc(K, S, 0, v ? -0.62 : -0.98, 0.09, 0.09, (dx, dy) => goldM(K, dx, dy, sd + 2, 0.7), { bv: 0.5 }); K.ink(S, INK.ages, 0.45); }
  function paintAgerubble(K, S, v) { const sd = 239 + v * 3, R = K.R1(sd);
    for (let i = 0; i < 3; i++) { const x = (R() - 0.5) * 0.6, y = (R() - 0.3) * 0.25, w = 0.14 + R() * 0.1; box(K, S, x, y, w, w * 0.8, 0, w * 1.1, 0.03, (f, u, vv) => marbleM(K, u * 3 + i, vv * 3, sd + i, { ruin: true })); }
    pebbles(K, S, 4, -0.45, 0.45, -0.1, 0.2, (x, y, i) => marbleM(K, x * 3, y * 3, sd + i, { ruin: true }), sd + 4); K.ink(S, INK.ages, 0.35); }
  function paintAnchor(K, S) { const sd = 251, c = S.c; contact(K, S, 0.86, 0.3, 0.5);
    // a round dais of void stone, a gold ring set in it, four small obelisks of the stairs about it
    K.rev(S, 0, 0, h => h < 0.1 ? 0.8 : h < 0.2 ? 0.68 : 0.58, 0, 0.26, { top: true, mat: (u, h) => { vstoneM(K, u * 2, h * 3, sd, 1.15); if (Math.abs(h - 0.15) < 0.015) goldM(K, u * 6, h * 9, sd, 0.6); }, capMat: (x2, h2, a, b, c2, d, ey) => { const r = Math.hypot(x2 / 0.58, (ey || 0)); vstoneM(K, x2 * 2, (ey || 0), sd + 1, 1.2); if (Math.abs(r - 0.7) < 0.08) goldM(K, x2 * 6, (ey || 0) * 6, sd, 0.6); else if (r < 0.3) { const M = K.M; M.er = 0.2; M.eg = 0.12; M.eb = 0.4; } } }); S.unlock();
    for (const [x, y, h] of [[-0.66, -0.2, 0.42], [0.66, -0.2, 0.42], [-0.5, 0.08, 0.34], [0.5, 0.08, 0.34]]) { prism(K, S, x, y, 0.07, 0.05, h, 0.1, 0, (f, q, wt, tp) => { vstoneM(K, q + x * 3, wt * 3, sd + 2, 1.25); if (!f && Math.abs(q) < 0.15 && !tp) { const M = K.M; M.er = 0.3; M.eg = 0.18; M.eb = 0.6; } }); halo(c, x, y - h * 0.6, 0.12, VIO, 0.4); } S.unlock();
    K.ink(S, INK.stairs, 0.4); }
  function paintAnchorglass(K, S) { const sd = 253;   // (its waist at 0, 0)
    for (const y of [0.3, -0.34]) K.rev(S, 0, y, h => 0.17, 0, 0.04, { top: true, mat: (u, h) => goldM(K, u * 4, h * 9, sd, 0.6) }); S.unlock();
    layer(K, S, 0.6, S2 => K.rev(S2, 0, 0.27, hgProf(0, 0.58, 0.13), 0, 0.58, { mat: () => glassM(K, GLASSC, 0.3, 0.05) }));
    K.ball(S, 0, -0.14, 0.06, 0.06, () => { const M = K.M; M.r = 1; M.g = 0.9; M.b = 0.7; M.er = 0.9; M.eg = 0.75; M.eb = 0.4; }); S.unlock();
    for (const x of [-0.15, 0.15]) K.tube(S, [[x, 0.3], [x, -0.32]], 0.018, 0.018, (t, s) => goldM(K, s, t * 4, sd + 1, 0.6)); S.unlock(); K.ink(S, [60, 40, 10], 0.45); }
  function paintSeed(K, S) { const sd = 255; halo(S.c, 0, -0.1, 0.3, '#8FE0A6', 0.35);
    K.ball(S, 0, 0, 0.17, 0.22, (dx, dy) => { const M = K.M, w = K.vn(dx * 6 + sd, dy * 6); M.r = 0.5 * (0.8 + 0.3 * w); M.g = 0.34 * (0.8 + 0.3 * w); M.b = 0.18; M.rg = 0.5; M.cc = 0.3; if (Math.abs(dx) < 0.06) M.ao *= 0.8; }); S.unlock();
    K.tube(S, ptsQ(0, -0.18, 0.1, -0.38, 0.22, -0.34, 8), 0.025, 0.012, () => { const M = K.M; M.r = 0.45; M.g = 0.85; M.b = 0.45; M.er = 0.1; M.eg = 0.3; M.eb = 0.12; }); S.unlock();
    lump(K, S, 0.25, -0.38, 0.07, 0.035, { amp: 0.1, fr: 1, sd, bump: 0.1, leaf: 20, mat: () => { const M = K.M; M.r = 0.5; M.g = 0.9; M.b = 0.5; M.er = 0.12; M.eg = 0.35; M.eb = 0.15; } }); S.unlock(); K.ink(S, [20, 30, 10], 0.45); }
  function paintSlab(K, S) { const sd = 257, c = S.c; contact(K, S, 0.7, 0.22, 0.4);
    box(K, S, 0, 0, 0.62, 0.32, 0, 0.2, 0.05, (f, u, vv) => { vstoneM(K, u * 2, vv * 2, sd, 1.5); if (f === 't') { K.M.r *= 1.1; K.M.g *= 1.1; K.M.b *= 1.1; } if (f === 'f' && band(vv, 0.14, 0.16)) goldM(K, u * 5, vv * 5, sd, 0.4); });
    groove(c, rectP(-0.5, -0.36, 0.5, -0.26), 0.012, 0.4, 'rgba(201,176,255,.3)', true); for (let i = 0; i < 5; i++) groove(c, [[-0.4 + i * 0.2, -0.36], [-0.3 + i * 0.2, -0.26]], 0.01, 0.35);
    chip(c, [[0.5, -0.4], [0.64, -0.4], [0.64, -0.24]]); K.ink(S, INK.stairs, 0.45); }
  function paintBed(K, S, v) { const sd = 259 + v, R = K.R1(sd); contact(K, S, 0.92, 0.3, 0.4);
    lump(K, S, 0, -0.06, 0.8, 0.2, { amp: 0.1, fr: 2, sd, bump: 0.3, leaf: 14, flat: 0.7, mat: (dx, dy, ao, e, nz, wx, wy) => { const M = K.M, w = K.vn(wx * 9 + sd, wy * 9); M.r = 0.3 * (0.8 + 0.3 * w); M.g = 0.22 * (0.8 + 0.3 * w); M.b = 0.14 * (0.8 + 0.3 * w); M.rg = 0.95; } }); S.unlock();
    // a kerb of carved stones round the bed (the back ones first)
    for (const back of [true, false]) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, sn = Math.sin(a); if ((sn < 0) !== back) continue; const x = Math.cos(a) * 0.8, y = -0.06 + sn * 0.22; box(K, S, x, y, 0.1, 0.06, 0, 0.1 + (i % 3 === 0 ? 0.03 : 0), 0.025, (f, u, vv) => { vstoneM(K, u * 3 + i, vv * 3, sd + i, 1.35); if (f === 't') { K.M.r *= 1.1; K.M.g *= 1.1; K.M.b *= 1.1; } }); }
    if (v) { K.tube(S, ptsQ(0, -0.08, -0.08, -0.42, 0.04, -0.68, 10), 0.03, 0.015, () => { const M = K.M; M.r = 0.3; M.g = 0.62; M.b = 0.28; }); S.unlock();
      for (const [dx, dy] of [[-0.18, -0.47], [0.2, -0.58], [-0.12, -0.68]]) lump(K, S, dx, dy, 0.14, 0.06, { amp: 0.15, fr: 1, sd: sd + dx * 10, bump: 0.2, leaf: 18, mat: () => { const M = K.M; M.r = 0.46; M.g = 0.86; M.b = 0.5; M.rg = 0.5; M.er = 0.04; M.eg = 0.12; M.eb = 0.05; } }); S.unlock(); }
    void R; K.ink(S, [20, 14, 10], 0.4); }
  function paintSluice(K, S) { const sd = 263, c = S.c; contact(K, S, 0.66, 0.24, 0.5);
    // a stone housing with an iron wheel on its side and the channel's mouth before it
    box(K, S, 0, 0, 0.46, 0.3, 0, 0.46, 0.04, (f, u, vv) => { vstoneM(K, u * 2, vv * 2, sd, 1.3); if (f === 'f' && band(vv, 0.33, 0.37)) goldM(K, u * 5, vv * 5, sd, 0.5); });
    disc(K, S, -0.48, -0.36, 0.18, 0.2, (dx, dy, e) => { ironM(K, dx, dy, sd + 1); if (e > 0.25 && e < 0.8 && Math.abs(Math.sin(Math.atan2(dy, dx) * 3)) > 0.3) K.M.ao *= 0.35; }, { bv: 0.2, rf: a => 1 + 0.08 * ss(0.4, 0.7, Math.abs(Math.sin(a * 6))) });
    socket(c, 0, -0.16, 0.18, 0.1, 'rgba(127,211,242,.4)'); K.ink(S, INK.stairs, 0.45); }
  function paintSluicearm(K, S) { const sd = 265;
    K.tube(S, [[0, 0], [0, -0.88]], 0.05, 0.04, (t, s) => goldM(K, s, t * 5, sd, 0.6)); S.unlock();
    K.ball(S, 0, -0.95, 0.14, 0.14, (dx, dy) => { const M = K.M; M.r = 0.3; M.g = 0.7; M.b = 0.9; M.rg = 0.1; M.cc = 1; M.er = 0.1; M.eg = 0.3; M.eb = 0.4; }); S.unlock(); K.glint(S.c, -0.05, -1.0, 0.08, 0.6); K.ink(S, INK.stairs, 0.45); }
  function paintDrain(K, S, v) { const sd = 267 + v, c = S.c;
    K.rev(S, 0, 0.05, h => 0.56 - h * 0.4, 0, 0.12, { top: true, mat: (u, h) => vstoneM(K, u * 3, h * 3, sd, 1.4), capMat: (x2, h2, a, b, c2, d, ey) => { const r = Math.hypot(x2 / 0.51, ey || 0); vstoneM(K, x2 * 3, (ey || 0) * 3, sd, r < 0.8 ? 0.35 : 1.4); } }); S.unlock();
    for (let i = -2; i <= 2; i++) K.tube(S, [[i * 0.11, -0.2], [i * 0.11, 0.02]], 0.02, 0.02, (t, s) => ironM(K, s, t * 2, sd)); K.tube(S, [[-0.3, -0.09], [0.3, -0.09]], 0.018, 0.018, (t, s) => ironM(K, t * 2, s, sd + 1)); S.unlock();
    if (!v) { K.ball(S, 0, -0.2, 0.28, 0.18, (dx, dy) => vstoneM(K, dx, dy, sd + 2, 1.6)); S.unlock(); K.tube(S, arcP(0, -0.36, 0.06, Math.PI, TAU, 8, 1), 0.02, 0.02, (t, s) => ironM(K, t, s, sd)); S.unlock(); }
    void c; K.ink(S, INK.stairs, 0.4); }
  function paintRstatue(K, S, v) { const sd = 271 + v, R = K.R1(sd), c = S.c, sm = (u, h) => { tombM(K, u * 2, h * 2, sd, 2.4, true); K.M.r *= 1.05; };
    contact(K, S, 0.75, 0.26, 0.55);
    if (!v) { // a robed keeper of the room on a plinth, its arm held out (the switch it holds is drawn by the stage)
      box(K, S, 0, 0.02, 0.6, 0.34, 0, 0.12, 0.03, (f, u, vv) => vstoneM(K, u * 2, vv * 2, sd, 1.3)); box(K, S, 0, 0, 0.55, 0.3, 0.12, 0.38, 0.04, (f, u, vv) => { vstoneM(K, u * 2, vv * 2, sd, 1.5); if (f === 'f' && band(vv, 0.3, 0.33)) goldM(K, u * 5, vv * 5, sd, 0.5); });
      const rb = 1.3; K.rev(S, 0, -0.38, h => { const t = h / rb; return (t < 0.55 ? lerp(0.36, 0.21, ss(0, 0.55, t)) : t < 0.88 ? lerp(0.21, 0.25, ss(0.55, 0.88, t)) : lerp(0.25, 0.1, ss(0.88, 1, t))) + 0.015 * Math.sin(t * 9) * (1 - t); }, 0, rb, { bump: 0.3, mat: (u, h) => { sm(u, h); if (Math.abs(Math.sin(u * 10)) < 0.25) K.M.ao *= 0.75; } }); S.unlock();
      lump(K, S, 0, -(0.38 + rb - 0.03), 0.28, 0.12, { amp: 0.08, fr: 1.8, sd: sd + 4, bump: 0.3, leaf: 7, mat: (dx, dy, ao, e, nz, wx, wy) => sm(wx * 2, wy * 2) });
      lump(K, S, 0, -(0.38 + rb + 0.14), 0.21, 0.24, { amp: 0.05, fr: 1.6, sd, bump: 0.3, leaf: 6, mat: (dx, dy, ao, e, nz, wx, wy) => sm(wx * 2, wy * 2) }); S.unlock(); socket(c, 0.03, -(0.38 + rb + 0.08), 0.1, 0.12, null);
      K.tube(S, ptsQ(-0.21, -(0.38 + rb * 0.86), -0.3, -(0.38 + rb * 0.6), -0.1, -(0.38 + rb * 0.55), 10), 0.07, 0.06, (t, s2) => sm(t, s2)); K.tube(S, ptsQ(0.21, -(0.38 + rb * 0.86), 0.3, -(0.38 + rb * 0.82), 0.34, -1.24, 8), 0.07, 0.06, (t, s2) => sm(t + 2, s2)); S.unlock();
      c.save(); c.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 5; i++) { const x = -0.24 + i * 0.12; c.strokeStyle = 'rgba(4,6,14,.3)'; c.lineWidth = 0.018; c.beginPath(); c.moveTo(x * 0.5, -(0.38 + rb * 0.8)); c.quadraticCurveTo(x * 0.9, -(0.38 + rb * 0.4), x * 1.3, -0.4); c.stroke(); } c.restore(); }
    else { for (const [x, y, rx, ry] of [[-0.35, -0.12, 0.38, 0.2], [0.32, -0.1, 0.32, 0.18], [0, -0.32, 0.3, 0.2], [0.46, -0.3, 0.18, 0.12], [-0.1, -0.5, 0.2, 0.14]]) lump(K, S, x, y, rx, ry, { amp: 0.25, fr: 2.4, sd: sd + x * 9, bump: 0.6, leaf: 8, mat: (dx, dy, ao, e, nz, wx, wy) => sm(wx * 2, wy * 2) }); S.unlock();
      K.ball(S, 0.3, -0.44, 0.15, 0.16, (dx, dy) => sm(dx * 2, dy * 2)); S.unlock(); socket(c, 0.33, -0.4, 0.06, 0.07, null);
      pebbles(K, S, 7, -0.7, 0.7, -0.05, 0.12, (x, y, i) => sm(x * 3, y * 3), sd + 3); }
    cracks(c, R, 5, -0.5, 0.5, -1.8, -0.1, 0.5, 0.05, 'rgba(201,176,255,.3)'); K.ink(S, INK.stairs, 0.45); }
  /* the Three Statues' great statue (a monster of the stage, 20s1b, drawn through its art: statueMon): a hooded figure of
     marble on a stepped, gilt-banded plinth, holding an hourglass over its head in both hands. In r units (its radius), its
     feet at 0, 0. v 0 asleep (grey glass, eyes shut), 1..4 awake (gold sand burning in the glass and in its eyes), cracking
     deeper with each quarter of its health lost (gold light in the cracks) */
  function paintSepstatue(K, S, v) { const sd = 281, c = S.c, awake = v > 0, cr = Math.max(0, v - 1), mm = (u, h) => marbleM(K, u * 1.2, h * 1.2, sd, { tone: 0.98 });
    contact(K, S, 1.25, 0.4, 0.6);
    box(K, S, 0, 0.04, 1.0, 0.5, 0, 0.2, 0.04, (f, u, vv) => { marbleM(K, u, vv, sd + 1, { tone: 0.8, grey: f === 'f' }); if (f === 'f' && band(vv, 0.12, 0.16)) goldM(K, u * 3, vv * 3, sd, 0.6); });
    box(K, S, 0, 0, 0.9, 0.44, 0.2, 0.58, 0.05, (f, u, vv) => { marbleM(K, u, vv, sd + 2, { tone: 0.88 }); if (f === 'f' && (band(vv, 0.48, 0.52) || band(vv, 0.26, 0.29))) goldM(K, u * 3, vv * 3, sd, 0.6); });
    for (const x0 of [-0.74, -0.22, 0.3]) groove(c, rectP(x0, -0.5, x0 + 0.44, -0.32), 0.02, 0.4, null, true);
    const rb = 1.3, ry0 = -0.58; K.rev(S, 0, ry0, h => { const t = h / rb; return (t < 0.55 ? lerp(0.66, 0.4, ss(0, 0.55, t)) : t < 0.86 ? lerp(0.4, 0.46, ss(0.55, 0.86, t)) : lerp(0.46, 0.2, ss(0.86, 1, t))) + 0.02 * Math.sin(t * 9) * (1 - t); }, 0, rb, { bump: 0.25, mat: (u, h) => { mm(u, h); if (Math.abs(Math.sin(u * 7 + Math.sin(h * 2) * 0.5)) < 0.25) K.M.ao *= 0.7; } }); S.unlock();
    const sy = ry0 - rb * 0.88, hy = ry0 - rb - 0.18;
    // the folds of the robe, the mantle over its shoulders, the hood drawn forward (its face a shadow)
    c.save(); c.globalCompositeOperation = 'source-atop'; c.lineCap = 'round'; for (let i = 0; i < 7; i++) { const x = -0.42 + i * 0.14; for (const [w, col, dx] of [[0.05, 'rgba(60,50,40,.22)', 0], [0.02, 'rgba(255,255,255,.25)', 0.035]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x * 0.6 + dx, sy + 0.1); c.quadraticCurveTo(x * 0.9 + dx, ry0 - rb * 0.4, x * 1.45 + dx, ry0 - 0.04); c.stroke(); } } c.restore();
    lump(K, S, 0, sy - 0.04, 0.6, 0.26, { amp: 0.06, fr: 1.8, sd: sd + 4, bump: 0.3, leaf: 4, mat: (dx, dy, ao, e, nz, wx, wy) => { mm(wx, wy); if (Math.abs(Math.sin(wx * 14)) < 0.2) K.M.ao *= 0.8; } });
    lump(K, S, 0, hy - 0.02, 0.4, 0.46, { amp: 0.05, fr: 1.6, sd, bump: 0.25, leaf: 3, mat: (dx, dy, ao, e, nz, wx, wy) => mm(wx, wy) });
    K.tube(S, [[0, hy - 0.3], [0.02, hy - 0.5], [0.07, hy - 0.58]], 0.1, 0.02, (t, s2) => mm(t, s2)); S.unlock();
    socket(c, 0, hy + 0.1, 0.17, 0.2, null); groove(c, [[-0.25, hy + 0.26], [-0.3, hy - 0.05], [-0.18, hy - 0.22], [0, hy - 0.28], [0.18, hy - 0.22], [0.3, hy - 0.05], [0.25, hy + 0.26]], 0.03, 0.4, 'rgba(255,255,255,.3)');
    // the arms raised to the glass, the hands round its lower disc
    const gy0 = hy - 0.62, gy1 = gy0 - 0.66; for (const s0 of [-1, 1]) K.tube(S, ptsQ(s0 * 0.4, sy, s0 * 0.66, (sy + gy0) / 2, s0 * 0.32, gy0 + 0.04, 12), 0.12, 0.09, (t, s2) => { mm(t * 2 + s0, s2); if (Math.abs(Math.sin(t * 16)) < 0.2) K.M.ao *= 0.8; }); S.unlock();
    for (const y of [gy0 + 0.04, gy1]) K.rev(S, 0, y, h => 0.4, 0, 0.08, { top: true, mat: (u, h) => goldM(K, u * 3, h * 9, sd + 2, 0.6) }); S.unlock();
    layer(K, S, awake ? 0.62 : 0.5, S2 => K.rev(S2, 0, gy0 - 0.04, hgProf(0, gy0 - gy1 - 0.08, 0.3), 0, gy0 - gy1 - 0.08, { mat: () => glassM(K, GLASSC, 0.3, awake ? 0.08 : 0.02) }));
    if (awake) { halo(c, 0, gy0 - 0.2, 0.5, '#FFD890', 0.5); K.ball(S, 0, gy0 - 0.16, 0.16, 0.1, () => { const M = K.M; M.r = 1; M.g = 0.86; M.b = 0.5; M.er = 0.8; M.eg = 0.6; M.eb = 0.24; M.rg = 0.4; }); S.unlock(); }
    for (const x of [-0.34, 0.34]) K.tube(S, [[x, gy0 + 0.04], [x, gy1]], 0.035, 0.035, (t, s2) => goldM(K, s2 + x, t * 5, sd + 3, 0.6)); S.unlock();
    K.ball(S, 0, gy1 - 0.12, 0.09, 0.09, (dx, dy) => goldM(K, dx, dy, sd + 4, 0.7)); S.unlock();
    // its eyes in the dark of the hood: shut (two lines) asleep, gold awake
    if (!awake) for (const s0 of [-1, 1]) groove(c, [[s0 * 0.13 - 0.05, hy + 0.08], [s0 * 0.13 + 0.05, hy + 0.08]], 0.02, 0.5, 'rgba(200,200,210,.2)');
    else for (const s0 of [-1, 1]) { halo(c, s0 * 0.11, hy + 0.08, 0.14, '#FFD890', 0.9); disc(K, S, s0 * 0.11, hy + 0.08, 0.035, 0.03, () => { const M = K.M; M.r = 1; M.g = 0.9; M.b = 0.6; M.er = 1; M.eg = 0.8; M.eb = 0.4; }, { bv: 0.5 }); }
    S.unlock();
    // the cracks as it is broken, gold light in the deepest
    if (cr > 0) { const C = [[[-0.2, -1.0], [-0.05, -1.35], [-0.25, -1.6], [-0.1, -1.9]], [[0.3, -0.9], [0.12, -1.2], [0.35, -1.5]], [[-0.45, -0.4], [-0.2, -0.3], [0.1, -0.45], [0.4, -0.3]], [[0.05, -2.3], [-0.1, -2.05], [0.08, -1.95]]];
      c.save(); c.globalCompositeOperation = 'source-atop'; c.lineCap = 'round'; c.lineJoin = 'round'; C.slice(0, cr + 1).forEach(pts => { for (const [w, col] of [[0.06, 'rgba(255,200,110,.45)'], [0.022, 'rgba(30,20,10,.9)']]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); } }); c.restore(); }
    sheen(c, -1.0, -3.2, 0.2, -0.4, '#FFFFFF', 0.12); K.ink(S, INK.ages, 0.45); }
  // drawn into the monster's own picture (DunArt's cache, 20s1b's MP.sepstatue): c at its centre, r its radius in px
  function statueMon(c, r, mode) { if (off() || !BP()) return false; const md2 = String(mode || 'dormant').replace('<', ''), v = md2.startsWith('dormant') ? 0 : 1 + Math.min(3, parseInt(md2.slice(1), 10) || 0);
    const m = c.getTransform ? c.getTransform() : null, k = m ? Math.max(0.5, Math.hypot(m.a, m.b)) : 1, s = sprite('sepstatue', v, Math.min(96, qP(r * 0.85 * k)), true, 'ages'); if (!s) return false;
    put(c, s, 0, r * 0.9, r * 0.85); return true; }   // (its figure at 0.85 r a unit: as tall as the old one, inside DunArt's picture of 2.6 r)
  function paintOrb(K, S, v) { const col = v ? [1.0, 0.56, 0.22] : [1.0, 0.86, 0.48], c = S.c;   // (its centre at 0, 0)
    K.ball(S, 0, 0, 0.45, 0.45, (dx, dy) => { const M = K.M, e = Math.hypot(dx, dy); M.r = col[0] * 0.7; M.g = col[1] * 0.7; M.b = col[2] * 0.7; M.rg = 0.06; M.cc = 1; M.er = col[0] * 0.55 * (1 - e * 0.6); M.eg = col[1] * 0.55 * (1 - e * 0.6); M.eb = col[2] * 0.5 * (1 - e * 0.7); }); S.unlock();
    c.save(); c.fillStyle = 'rgba(255,250,235,.9)'; c.strokeStyle = 'rgba(40,20,10,.6)'; c.lineWidth = 0.025; c.lineJoin = 'round'; c.beginPath();
    if (v) { c.moveTo(0, -0.28); c.quadraticCurveTo(0.2, -0.02, 0, 0.24); c.quadraticCurveTo(-0.2, -0.02, 0, -0.28); } else { c.moveTo(-0.2, 0.02); c.lineTo(0, -0.24); c.lineTo(0.2, 0.02); c.lineTo(0.08, 0.02); c.lineTo(0.08, 0.24); c.lineTo(-0.08, 0.24); c.lineTo(-0.08, 0.02); c.closePath(); }
    c.fill(); c.stroke(); c.restore(); K.glint(c, -0.17, -0.18, 0.2, 0.7); K.ink(S, v ? [70, 20, 4] : [60, 40, 10], 0.55); }
  Object.assign(DEF, {
    thrower: { box: () => [-0.6, -2.1, 0.6, 0.42], paint: paintThrower, sc: 1.1 }, courtgem: { box: () => [-0.3, -0.5, 0.3, 0.3], paint: paintCourtgem }, timeball: { box: () => [-0.56, -0.56, 0.56, 0.56], paint: paintTimeball },
    amberg: { box: () => [-0.62, -1.62, 0.62, 0.32], paint: paintAmberg }, blueg: { box: () => [-0.62, -1.78, 0.62, 0.32], paint: paintBlueg }, plateg: { box: () => [-0.62, -1.32, 0.62, 0.36], paint: paintPlateg }, guardian: { box: () => [-3.3, -2.55, 3.3, 0.5], paint: paintGuardian },
    agelever: { box: () => [-0.6, -0.65, 0.6, 0.36], paint: paintAgelever }, agearm: { box: () => [-0.3, -1.4, 0.3, 0.12], paint: paintAgearm }, agecatch: { box: () => [-0.62, -1.2, 0.62, 0.36], paint: paintAgecatch }, agerubble: { box: () => [-0.6, -0.5, 0.6, 0.45], paint: paintAgerubble },
    anchor: { box: () => [-0.9, -0.8, 0.9, 0.36], paint: paintAnchor }, anchorglass: { box: () => [-0.24, -0.46, 0.24, 0.42], paint: paintAnchorglass }, seed: { box: () => [-0.34, -0.5, 0.42, 0.3], paint: paintSeed }, slab: { box: () => [-0.72, -0.5, 0.72, 0.36], paint: paintSlab },
    bed: { box: () => [-0.95, -0.82, 0.95, 0.32], paint: paintBed }, sluice: { box: () => [-0.75, -0.7, 0.6, 0.36], paint: paintSluice }, sluicearm: { box: () => [-0.2, -1.15, 0.2, 0.1], paint: paintSluicearm }, drain: { box: () => [-0.6, -0.6, 0.6, 0.32], paint: paintDrain }, rstatue: { box: v => [-0.85, v ? -0.85 : -2.25, 0.85, 0.4], paint: paintRstatue },
    orb: { box: () => [-0.52, -0.52, 0.52, 0.52], paint: paintOrb },
    sepstatue: { box: () => [-1.3, -3.62, 1.3, 0.62], paint: paintSepstatue },
  });
  // which pieces each trial warms on the loading screen (and the studio sheet's list): [name, v, light]
  const PIECES = [['thrower', [0], 'halls'], ['courtgem', [0], 'halls'], ['timeball', [0, 1], 'halls'], ['amberg', [0], 'halls'], ['blueg', [0], 'halls'], ['plateg', [0], 'halls'], ['guardian', [0], 'halls'],
    ['agelever', [0], 'ages'], ['agearm', [0], 'ages'], ['agecatch', [0, 1], 'ages'], ['agerubble', [0, 1, 2], 'ages'],
    ['anchor', [0], 'stairs'], ['anchorglass', [0], 'stairs'], ['seed', [0], 'stairs'], ['slab', [0], 'stairs'], ['bed', [0, 1], 'stairs'], ['sluice', [0], 'stairs'], ['sluicearm', [0], 'stairs'], ['drain', [0, 1], 'stairs'], ['rstatue', [0, 1], 'stairs'], ['orb', [0, 1], 'stairs'], ['sepstatue', [0, 1, 2, 3, 4], 'ages']];
  const pcs = names => PIECES.filter(p => names.includes(p[0])).flatMap(([n, vs, L]) => vs.map(v => [n, v, L]));
  const PIECES_OF = [[/Hour Court/, pcs(['thrower', 'courtgem', 'timeball'])], [/Borrowed Beast/, pcs(['amberg', 'blueg', 'plateg', 'guardian'])], [/Two Ages/, pcs(['agelever', 'agearm', 'agecatch', 'agerubble'])],
    [/Room That Remembers/, pcs(['anchor', 'anchorglass', 'seed', 'slab', 'bed', 'sluice', 'sluicearm', 'drain', 'rstatue'])], [/Rolling Hour/, pcs(['orb'])]];
  // the Hall in Two Ages' silver bridge deck: marble boards across, silver at their ends, gold pins (1 tile, wrapping)
  function agesDeck(x, y, mode) { const M = GK.M, fy = y * 3 - Math.floor(y * 3), bid = md(Math.floor(y * 3), 3), dj = Math.min(fy, 1 - fy) / 3, pin = Math.hypot((x * 3 - Math.floor(x * 3)) - 0.5, fy - 0.5) < 0.09 && md(Math.floor(x * 3), 3) !== 1;
    let h = 0.02 * ss(0, 0.02, dj) + (pin ? 0.006 : 0); if (!mode) return h; if (pin) { goldM(GK, x * 9, y * 9, 281, 0.6); return h; }
    marbleM(GK, x * 1.2 + bid * 2.7, fy * 0.3, 282, { tone: 0.98 + 0.05 * PH(bid, 1, 283) }); M.rg = 0.18; M.cc = 0.6; M.ao *= 1 - ss(0.015, 0.003, dj) * 0.6; return h; }
  TDEF['deck:ages'] = { w: 1, h: 1, L: 'ages', fn: () => agesDeck, o: { wrap: true, wrapY: true, bump: 1.2 } };
  const TEX_OF = [[/Two Ages/, ['deck:ages']]];

  /* ---- the hooks the trials call (20s1, 20s1b: "v463 SE"): each draws its pieces and queues their light, or returns false ---- */
  const L_OF = X => BIO_L[(X && X.F && X.F.biome)] || 'halls';
  const pc = (c, X, n, v, T, L) => pic(c, n, v, T, L || L_OF(X));
  // the Hour Court: the dial (light), aim lines (light), crystals, throwers, balls; the whole of its drawGround
  function court(c, X, S, C, throwers, need) { if (!ready(X)) return false; const T = X.Tz(), t = X.g.t, lf = lowFx();
    const th = pc(c, X, 'thrower', 0, T), gm = pc(c, X, 'courtgem', 0, T), b0 = pc(c, X, 'timeball', 0, T), b1 = pc(c, X, 'timeball', 1, T); if (!th || !gm || !b0 || !b1) return false; STATS.hooks++;
    const Xs = X.sx(C.x), Ys = X.sy(C.y), u = S.got / need;
    // the dial inlaid in the floor (its gold line and hours, the count's arc: the court's own 2D lines, they are its score) and its light
    c.save(); c.strokeStyle = 'rgba(178,150,93,.5)'; c.lineWidth = 3; c.beginPath(); c.arc(Xs, Ys, T * 5.2, 0, TAU); c.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(Xs + Math.cos(a) * T * 4.6, Ys + Math.sin(a) * T * 4.6); c.lineTo(Xs + Math.cos(a) * T * 5.2, Ys + Math.sin(a) * T * 5.2); c.stroke(); }
    if (u > 0) { c.strokeStyle = GOLD; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.arc(Xs, Ys, T * 5.5, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); } c.restore();
    ql('ring', Xs, Ys, T * 5.25, GOLD, 0.35, T * 0.2, 1); if (!lf) ql('glow', Xs, Ys, T * 5.6, GOLD, 0.06, 1);
    const n = Math.round(48 * u); for (let i = 0; i < n; i++) { const a0 = -Math.PI / 2 + i / 48 * TAU, a1 = a0 + TAU / 48 * 1.05; ql('beam', Xs + Math.cos(a0) * T * 5.5, Ys + Math.sin(a0) * T * 5.5, Xs + Math.cos(a1) * T * 5.5, Ys + Math.sin(a1) * T * 5.5, T * 0.22, SKY, 0.7); }
    // the throws' aims: a lane of light (no countdown, no hard edge), the great pink ones wider
    for (const A of S.aim) { const k = 0.65 + 0.35 * Math.sin(t * 20), x0 = X.sx(A.x), y0 = X.sy(A.y), x1 = X.sx(A.x + Math.cos(A.a) * 9), y1 = X.sy(A.y + Math.sin(A.a) * 9), big = A.kind === 'big'; ql('rbeam', x0, y0, x1, y1, T * (big ? 0.5 : 0.3), big ? '#FF9BD2' : GOLD, 0.85 * k, 1, 0.15); ql('rbeam', x0, y0, x1, y1, T * (big ? 0.14 : 0.08), '#FFFFFF', 0.8 * k, 1, 0.1); }
    for (const G of S.gems) { const gx = X.sx(G.x), gy = X.sy(G.y) - T * 0.3 - Math.sin(t * 3 + G.ph) * T * 0.08, k = G.loose ? Math.min(1, (7 - G.t) / 1.5) : 1; c.save(); c.globalAlpha *= k; put(c, gm, gx, gy, T); c.restore(); ql('glow', gx, gy - T * 0.1, T * 0.55, GOLD, 0.45 * k); ql('glow', gx, X.sy(G.y), T * 0.5, GOLD, 0.12 * k, 0.4); }
    for (const tw of throwers) { const tx = X.sx(tw.x), ty = X.sy(tw.y); put(c, th, tx, ty + T * 0.12, T); const sy = ty - T * (0.45 + tw.glow * 0.55); qo('glow', tx, sy, T * (0.3 + tw.glow * 0.5), GOLD, 0.55 + tw.glow * 0.4); qo('glow', tx, sy, T * 0.12, '#FFFFFF', 0.8); if (tw.glow > 0.05) ql('glow', tx, ty, T * (1 + tw.glow), GOLD, 0.25 * tw.glow, 0.45); }
    for (const B of S.balls) { const bx = X.sx(B.x), by = X.sy(B.y) - T * 0.4, col = B.kind === 'big' ? '#FF9BD2' : GOLD; if (!lf) B.trail.forEach((p, i) => qo('glow', X.sx(p.x), X.sy(p.y) - T * 0.4, T * B.r * (0.6 + i / B.trail.length * 0.6), col, i / B.trail.length * 0.3));
      c.save(); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(bx, X.sy(B.y) + T * 0.1, T * B.r, T * B.r * 0.35, 0, 0, TAU); c.fill(); c.restore();
      put(c, B.kind === 'big' ? b1 : b0, bx, by, T * B.r / 0.48);
      c.save(); c.strokeStyle = 'rgba(40,24,8,.85)'; c.lineCap = 'round'; c.lineWidth = Math.max(1.5, T * B.r * 0.1); const ang = t * 6; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + Math.cos(ang) * T * B.r * 0.55, by + Math.sin(ang) * T * B.r * 0.55); c.moveTo(bx, by); c.lineTo(bx + Math.cos(ang * 0.2) * T * B.r * 0.38, by + Math.sin(ang * 0.2) * T * B.r * 0.38); c.stroke(); c.restore();
      qo('glow', bx, by, T * B.r * 1.9, col, 0.42); }
    return true; }
  // the Borrowed Beast: a nest (light; its symbol stays the stage's), one tile of a growth, the sleeping guardian
  function beastNest(c, X, N, on) { if (!ready(X)) return false; const T = X.Tz(), Xs = X.sx(N.x), Ys = X.sy(N.y), t = X.g.t; STATS.hooks++;
    ql('ring', Xs, Ys, T * 0.85, VIO, on ? 0.5 + 0.15 * Math.sin(t * 3) : 0.16, T * 0.14, 0.5); ql('glow', Xs, Ys, T * 1.1, VIOD, on ? 0.3 : 0.08, 0.5); return true; }
  function growth(c, X, G, p) { if (!ready(X)) return false; const T = X.Tz(), n = G.type === 'crack' ? 'amberg' : G.type === 'blue' ? 'blueg' : 'plateg', s = pc(c, X, n, 0, T, 'halls'); if (!s) return false;
    const Xs = X.sx(p.tx) + T / 2, Ys = X.sy(p.ty) + T * 0.78; put(c, s, Xs, Ys, T, (p.tx + p.ty) % 2 ? -1 : 1, 1);
    if (G.type !== 'plate') { const col = G.type === 'crack' ? '#FFC86A' : '#7FD3F2'; ql('glow', Xs, Ys - T * 0.1, T * 0.9, col, 0.22, 0.45); qo('glow', Xs, Ys - T * 0.75, T * 0.6, col, 0.22 + 0.06 * Math.sin(X.g.t * 2 + p.tx)); }
    return true; }
  function beastGuard(c, X, S, guard) { if (!ready(X) || !guard.length) return false; const T = X.Tz(), s = pc(c, X, 'guardian', 0, T, 'halls'); if (!s) return false; STATS.hooks++;
    const x0 = Math.min(...guard.map(p => p.tx)), x1 = Math.max(...guard.map(p => p.tx)) + 1, y0 = Math.min(...guard.map(p => p.ty)), cx = X.sx((x0 + x1) / 2), cy = X.sy(y0 + 1) - T * 0.1 - S.wake * T * 0.6, k = (x1 - x0) / 6;
    if (S.wake >= 1) return true; c.save(); c.globalAlpha *= 1 - S.wake; put(c, s, cx, cy + T * 0.1, T * k); c.restore();
    if (S.woke) for (const sd of [-1, 1]) { const ex = cx + sd * T * k * 0.32, ey = cy - T * k * 1.45; qo('glow', ex, ey, T * 0.45, GOLD, 0.8 * (1 - S.wake)); qo('glow', ex, ey, T * 0.16, '#FFFFFF', 0.9 * (1 - S.wake)); }
    else { const zz = 0.5 + 0.5 * Math.sin(X.g.t * 1.5); qo('glow', cx, cy - T * k * 2.1, T * 0.5, VIO, 0.18 * zz); }
    return true; }
  // the Hall in Two Ages: a lever (base and its arm), the catch, the bridge deck, the fallen wall's blocks
  function ageLever(c, X, Xs, Ys, T, past) { if (!ready(X)) return false; const b = pc(c, X, 'agelever', 0, T, 'ages'), a = pc(c, X, 'agearm', 0, T, 'ages'); if (!b || !a) return false; STATS.hooks++;
    const r = past ? -0.7 : 0.7, col = past ? GOLD : VIO; put(c, b, Xs, Ys, T); put(c, a, Xs, Ys - T * 0.42, T, 1, 1, r);
    const hx = Xs + Math.sin(r) * T * 1.06, hy = Ys - T * 0.42 - Math.cos(r) * T * 1.06; qo('glow', hx, hy, T * 0.55, col, 0.45); qo('glow', hx, hy, T * 0.16, '#FFFFFF', 0.5); ql('glow', Xs, Ys, T * 1.2, col, 0.18, 0.45); return true; }
  function ageCatch(c, X, Xs, Ys, T, braced) { if (!ready(X)) return false; const s = pc(c, X, 'agecatch', braced ? 1 : 0, T, 'ages'); if (!s) return false; put(c, s, Xs, Ys, T);
    if (braced) { const k = 0.5 + 0.2 * Math.sin(X.g.t * 3); qo('glow', Xs, Ys - T * 0.62, T * 0.7, GOLD, k); ql('glow', Xs, Ys, T * 1.3, GOLD, 0.25 * k, 0.45); } return true; }
  function ageDeck(c, X, x0, x1, ya, yb, braced) { if (!ready(X)) return false; const T = X.Tz(), t = tex('deck:ages', Math.min(CAP, Math.round(T * kOf(c)))); if (!t) return false; STATS.hooks++;
    const P = t.P; c.save(); c.beginPath(); c.rect(x0 + 3, ya, x1 - x0 - 6, yb - ya); c.clip();
    for (let y = ya; y < yb; y += T) for (let x = x0; x < x1; x += T) c.drawImage(t.cv, 0, 0, P, P, x, y, T + 0.5, T + 0.5);
    c.restore(); c.save(); c.fillStyle = 'rgba(40,40,60,.4)'; c.fillRect(x0 + 3, ya, x1 - x0 - 6, Math.max(1, T * 0.05)); c.fillStyle = '#E4EAF2'; c.fillRect(x0, ya, 4, yb - ya); c.fillRect(x1 - 4, ya, 4, yb - ya); c.restore();
    for (const xx of [x0 + 2, x1 - 2]) ql('rbeam', xx, ya, xx, yb, T * 0.08, '#FFFFFF', braced ? 0.32 : 0.16, 0.6, 0.6);
    return true; }
  function ageRubble(c, X, Xs, Ys, T, i) { if (!ready(X)) return false; const s = pc(c, X, 'agerubble', i % 3, T, 'ages'); if (!s) return false; put(c, s, Xs + T / 2, Ys + T * 0.7, T); return true; }
  // the Room That Remembers
  function anchor(c, X, Xs, Ys, T, past) { if (!ready(X)) return false; const b = pc(c, X, 'anchor', 0, T, 'stairs'), g = pc(c, X, 'anchorglass', 0, T, 'stairs'); if (!b || !g) return false; STATS.hooks++;
    const t = X.g.t, k = 0.5 + 0.5 * Math.sin(t * 3), col = past ? GOLD : VIO; put(c, b, Xs, Ys + T * 0.3, T);
    ql('ring', Xs, Ys, T * 0.86, col, 0.45 + 0.2 * k, T * 0.12, 0.47); ql('glow', Xs, Ys, T * 1.3, col, 0.2 + 0.1 * k, 0.5);
    const gy = Ys - T * 1.1 - k * T * 0.1; put(c, g, Xs, gy, T, 1, 1, t * 0.6); qo('glow', Xs, gy, T * 0.7, col, 0.32 + 0.15 * k); qo('glow', Xs, gy, T * 0.14, '#FFFFFF', 0.45); return true; }
  function rpiece(c, X, name, v, Xs, Ys, T, o) { if (!ready(X)) return false; const s = pc(c, X, name, v, T, 'stairs'); if (!s) return false; o = o || {}; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; put(c, s, Xs, Ys, T * (o.s || 1), 1, 1, o.rot); c.restore();
    if (o.glow) qo('glow', Xs + (o.gx || 0) * T, Ys + (o.gy || 0) * T, T * (o.gr || 0.6), o.glow, o.ga || 0.4); if (o.pool) ql('glow', Xs, Ys + T * 0.05, T * (o.pr || 1.1), o.pool, o.pa || 0.18, 0.45); return true; }
  const seed = (c, X, Xs, Ys, T) => rpiece(c, X, 'seed', 0, Xs, Ys + T * 0.12, T, { glow: '#8FE0A6', gy: -0.15, gr: 0.45, ga: 0.35 });
  const slab = (c, X, Xs, Ys, T, a) => rpiece(c, X, 'slab', 0, Xs, Ys, T, { alpha: a });
  const bed = (c, X, Xs, Ys, T, planted, watered) => rpiece(c, X, 'bed', planted ? 1 : 0, Xs, Ys + T * 0.1, T, watered ? { pool: '#7FD3F2', pa: 0.3, glow: planted ? '#8FE0A6' : null, gy: -0.5, gr: 0.4, ga: 0.25 } : planted ? { glow: '#8FE0A6', gy: -0.5, gr: 0.4, ga: 0.25 } : {});
  function sluice(c, X, Xs, Ys, T, a) { if (!ready(X)) return false; const b = pc(c, X, 'sluice', 0, T, 'stairs'), r = pc(c, X, 'sluicearm', 0, T, 'stairs'); if (!b || !r) return false; put(c, b, Xs, Ys, T); put(c, r, Xs, Ys - T * 0.42, T, 1, 1, a);
    qo('glow', Xs + Math.sin(a) * T * 0.95, Ys - T * 0.42 - Math.cos(a) * T * 0.95, T * 0.35, '#7FD3F2', 0.45); return true; }
  const drain = (c, X, Xs, Ys, T, open, flow) => { const ok = rpiece(c, X, 'drain', open ? 1 : 0, Xs, Ys + T * 0.08, T); if (ok && flow) { const u = (X.g.t % 1); ql('ring', Xs, Ys, T * (0.2 + u * 0.45), '#9FE2FF', 0.5 * (1 - u), T * 0.06, 0.5); } return ok; };
  // water lying in the room (the Past's river, the flooded hollow): its light moving on it (the 2D water stays under it)
  function water(c, X, tiles) { if (!ready(X) || !tiles || !tiles.length) return false; const T = X.Tz(), t = X.g.t, lf = lowFx();
    for (const p of tiles) { const Xs = X.sx(p.tx) + T / 2, Ys = X.sy(p.ty) + T / 2, ph = hh(p.tx, p.ty, 5) * TAU; ql('glow', Xs, Ys, T * 0.75, '#7FD3F2', 0.14 + 0.06 * Math.sin(t * 2 + ph), 0.7);
      if (!lf) { const u = (t * 0.6 + ph / TAU) % 1; ql('ring', Xs + Math.sin(ph) * T * 0.2, Ys, T * (0.15 + u * 0.35), '#DFF6FF', 0.3 * (1 - u), T * 0.05, 0.55); } }
    return true; }
  const statue = (c, X, Xs, Ys, T, whole) => rpiece(c, X, 'rstatue', whole ? 0 : 1, Xs, Ys + T * 0.06, T);
  // the Three Statues: the ring before the statue to wake, the masons' mending threads (light only)
  function siege(c, X, S, wake, statues) { if (!ready(X)) return false; const T = X.Tz(), t = X.g.t; STATS.hooks++;
    if (S.cur < 0 && wake) { const Xs = X.sx(wake.x), Ys = X.sy(wake.y), k = 0.5 + 0.3 * Math.sin(t * 4); ql('ring', Xs, Ys, T * 0.95, GOLD, 0.55 * k + 0.2, T * 0.16, 0.5); ql('glow', Xs, Ys, T * 1.3, GOLD, 0.2 * k, 0.5); }
    if (S.cur >= 0) { const m = statues[S.cur], sx = X.sx(m.x), sy = X.sy(m.y) - T * 1.2; let n = 0;
      for (const q of S.mob) { if (q.dead || !q.mending || n++ > 24) continue; const qx = X.sx(q.x), qy = X.sy(q.y) - T * 0.6, mx = (qx + sx) / 2, my = Math.min(qy, sy) - T, a = 0.4 + 0.25 * Math.sin(t * 9 + q.x);
        let px = qx, py = qy; for (let i = 1; i <= 6; i++) { const u = i / 6, x = (1 - u) * (1 - u) * qx + 2 * (1 - u) * u * mx + u * u * sx, y = (1 - u) * (1 - u) * qy + 2 * (1 - u) * u * my + u * u * sy; qo('beam', px, py, x, y, T * 0.09, GOLD, a); px = x; py = y; }
        qo('glow', qx, qy, T * 0.35, GOLD, 0.4); }
      if (n) qo('glow', sx, sy, T * 1.4, GOLD, 0.18 + 0.04 * Math.min(n, 10)); }
    for (const m of statues || []) if (m && m.awake && !m.dead) { const k = 0.7 + 0.3 * Math.sin(t * 3 + m.statueI), r = m.r || 1.5, x = X.sx(m.x), y0 = X.sy(m.y);   // v463 SE: the woken statue's glass and eyes burn (its picture: statueMon)
      qo('glow', x, y0 + (0.9 - 2.55) * r * T, T * 1.5, GOLD, 0.32 * k, 1); qo('glow', x, y0 + (0.9 - 1.98 * 0.85) * r * T, T * 0.6, GOLD, 0.3 * k, 0.6); }
    return true; }
  // the Rolling Hour: the GIANT and FIRE orbs; the pet's blaze and a giant's gold
  function roll(c, X, S, label) { if (!ready(X)) return false; const T = X.Tz(), t = X.g.t, g0 = pc(c, X, 'orb', 0, T, 'stairs'), g1 = pc(c, X, 'orb', 1, T, 'stairs'); if (!g0 || !g1) return false; STATS.hooks++;
    for (const p of S.pw) { const Xs = X.sx(p.x), Ys = X.sy(p.y) - T * 0.6 - Math.sin(t * 4 + p.x) * T * 0.15, fire = p.kind === 'fire', col = fire ? '#FF9F43' : GOLD; if (p.t > 11 && Math.floor(t * 8) % 2) continue;
      ql('glow', Xs, X.sy(p.y), T * 1.0, col, 0.3, 0.45); put(c, fire ? g1 : g0, Xs, Ys, T); qo('glow', Xs, Ys, T * 1.2, col, 0.5 + 0.1 * Math.sin(t * 6)); qo('glow', Xs, Ys, T * 0.3, '#FFFFFF', 0.4);
      if (label) label(c, fire ? 'FIRE' : 'GIANT', Xs, Ys - T * 0.75, T * 0.32, col); }
    const me = X.me, pk = X.g.petK || 1; if (S.fire > 0 || S.giant > 0) { const Xs = X.sx(me.x), Ys = X.sy(me.y) - T * 0.5 * pk; if (S.fire > 0) { qo('glow', Xs, Ys, T * 1.6 * pk, '#FF7A2A', 0.5 + 0.18 * Math.sin(t * 14)); ql('glow', Xs, X.sy(me.y), T * 1.4 * pk, '#FF9F43', 0.3, 0.45); } if (S.giant > 0) qo('glow', Xs, Ys, T * 1.8 * pk, GOLD, 0.3); }
    return true; }
  const PIECE_API = { statueMon, court, beastNest, growth, beastGuard, ageLever, ageCatch, ageDeck, ageRubble, anchor, seed, slab, bed, sluice, drain, statue, water, siege, roll };
  const API = { ...PIECE_API, PIECES, draw, sprite: (n, v, P, L) => sprite(n, v, P, true, L), pic, tex, texJobs, warm, release, trimKinds, glowsOf, install, OLD, DEF, TDEF, KINDS, DEC, DECALS_OF: DECS_OF, HPK, DEBRIS, BURSTS, LIGHT, BIO_L, QL, QO, ruinAt,
    get live() { return LIVE; }, get base() { return BASE; }, set base(v) { if (v > 2) BASE = Math.round(v); },
    get stats() { return Object.assign({ cached: CACHE.size, textures: TEX.size, texKeys: [...TEX.keys()], px: [...CACHE.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) + [...TEX.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) }, STATS); } };
  if (HAS_W) window.SEP_PROPS = API;
  return API;
})();
