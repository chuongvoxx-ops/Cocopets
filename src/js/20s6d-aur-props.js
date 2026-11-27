/* ---------- v470 AE: The Pale Aurora repainted in 2.5D (Rift 05's three lands, their props, the trials' pieces, the doors) ----------
   Rift 05 rebuilt to the standard of Rift 02 / 03 / 04 (v463 SE's method): every solid piece of the rift is painted ONCE into its
   own cached picture by the Drowned Belfry's software shading pass (BELPROPS.kit, 20n9: each pixel of a solid gets a normal and a
   material and is lit), each land in its own light:
     glacier     (the Split Iceberg, section 1): night on the glacier's edge; a cold moon key, the snow's blue bounce, the aurora's
                 green caught in every polish and rim
     obs         (the Observatory Ruins, section 2): the aurora bright overhead; jade and teal in the reflections, cold stone
     white       (the Whiteout Summit, section 3): a white overcast, soft and nearly shadowless; a warm amber rim from the ember
   then finished with a little 2D detail and a soft ink edge. Nothing is painted per frame: the frame lays the pictures down; what
   glows (the crystal trees' tips, the telescope's lens, the vanes' green eye, motes of rime) is the GPU painter's light (FGFX,
   20k6h), lowFx respected; without it the pictures stay and the light is left out.
   Props (DunWorld.PROPS through the engine's prop cache, so BREAK_FX shatters these pictures in their own materials, each break
   adding its own debris and a feathered GPU burst): snowrock, snowhill, icewedge, frozenvane, obsarch, telescope, stonearch,
   icetree; v 0..1 painted, 2..3 the same mirrored. Only in the three lands (another land asking for one gets the old 2D art).
   Textures (made once per sharpness and land, wrapping): floor (FN tiles square, continuous across tiles: never per-tile
   squares), bank (the wall's face), roof (the wall top), cliff (the face over the drop), bridge (ice planks) and bunder (the
   bridge's underside, icicles). The lands (BIOMES.glacier / .observatory / .whiteout): floorFn, wallFn, roofFn, cliffTint,
   bridgeFn, bridgeEdge, floorUnder and floor as getters (the old art whenever the painter is off).
   The trials' pieces (20s6d2-aur-pieces.js adds their DEFs): AUR_PROPS.piece(c, name, v, Xs, Ys, T, o) draws a piece's picture
   (false: the caller draws its old 2D), AUR_PROPS.ql / .qo queue GPU light under / over the actors for this frame.
   The exits are the Drowned Belfry's doors (BEL_DOORS, 20n9d: 'std' out of a stage, 'boss' before a boss), themed in glacier ice,
   frost and aurora light ('aurglacier' / 'aurobs' / 'aurwhite'); positions, trigger radius, labels and progression stay the
   stage's own (H.setExit); the door only reads whether the stage is done and changes no tile (nothing repainted as it opens,
   v447), its pictures are painted on the loading screen (warmDoor). The boss arenas keep theirs (20s6e paints their views).
   Hooks: RIFT_BY_ID.aurora.everyStage (chained: the light, the doors), .preload (chained: textures, props, pieces, the door),
   DunWorld.dropProps (chained: everything given back), BREAK_FX.prop (chained: debris and burst).
   window.__AURP = 0 (or __BELP = 0) turns all of it off (the old 2D art); __AURP_GL = 0 the GPU's part only. */
var AUR_PROPS = (() => {
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined';
  const off = () => HAS_W && (window.__AURP === 0 || window.__BELP === 0);
  const BP = () => (!off() && HAS_W && window.BELPROPS && window.BELPROPS.kit) ? window.BELPROPS : null;
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + (s | 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const rgba = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${clamp(a, 0, 1)})`; };
  const md = (a, n) => ((a % n) + n) % n;
  const kOf = c => { const m = c && c.getTransform ? c.getTransform() : null; return m ? Math.max(0.5, Math.min(3, Math.hypot(m.a, m.b))) : 1; };
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0, tex: 0, texMs: 0, land: 0, pieces: 0, breaks: 0, empty: 0 };
  const GREEN = '#78D7B2', GREEN_HI = '#B8F5DA', ICE_HI = '#CFE8F4', WARM = '#FFB35C';

  /* ======================= the light of each land ======================= */
  const LIGHT = {
    glacier: { a0: [0.06, 0.085, 0.14], a1: [0.07, 0.1, 0.16], e0: [0.1, 0.13, 0.2], e1: [0.2, 0.46, 0.42], k: [0.9, 0.98, 1.18], rim: [0.26, 0.7, 0.55], bo: [0.12, 0.16, 0.24] },
    obs: { a0: [0.06, 0.09, 0.12], a1: [0.05, 0.11, 0.12], e0: [0.08, 0.12, 0.15], e1: [0.22, 0.6, 0.5], k: [0.84, 0.98, 1.06], rim: [0.34, 0.86, 0.64], bo: [0.09, 0.14, 0.17] },
    white: { a0: [0.4, 0.44, 0.5], a1: [0.2, 0.22, 0.26], e0: [0.48, 0.52, 0.58], e1: [0.8, 0.86, 0.94], k: [1.02, 1.0, 0.96], rim: [0.6, 0.46, 0.3], bo: [0.36, 0.4, 0.46] } };
  const BIO_L = { glacier: 'glacier', observatory: 'obs', whiteout: 'white' };
  const INK = { glacier: [8, 16, 34], obs: [8, 14, 26], white: [60, 76, 96] };
  function lit(K, name, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHT[name] || LIGHT.glacier); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }
  const bioOf = B => { if (!B || typeof BIOMES === 'undefined') return null; return B === BIOMES.glacier ? 'glacier' : B === BIOMES.observatory ? 'observatory' : B === BIOMES.whiteout ? 'whiteout' : null; };

  /* ======================= noise that wraps (for the textures) ======================= */
  function pvn(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), q = p | 0 || 1;
    const X0 = ((xi % q) + q) % q, X1 = (X0 + 1) % q, Y0 = ((yi % q) + q) % q, Y1 = (Y0 + 1) % q, a = hh(X0, Y0, s), b = hh(X1, Y0, s), c = hh(X0, Y1, s), d = hh(X1, Y1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const pfbm = (x, y, p, s) => pvn(x, y, p, s) * 0.52 + pvn(x * 2, y * 2, p * 2, s + 7) * 0.3 + pvn(x * 4, y * 4, p * 4, s + 13) * 0.18;
  // (a texture's noise must repeat with it: DOM the texture's size in tiles, f a frequency with DOM * f a whole number)
  let DOM = 6; const wn = (x, y, f, s) => pvn(x * f, y * f, Math.max(1, Math.round(DOM * f)), s);
  const CELL = { d: 0, d2: 0, id: 0 };
  function pcell(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y); let d1 = 9, d2 = 9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i, cy = yi + j, wx = ((cx % p) + p) % p, wy = ((cy % p) + p) % p, px = cx + 0.15 + hh(wx, wy, s) * 0.7, py = cy + 0.15 + hh(wx, wy, s + 1) * 0.7, d = Math.hypot(x - px, y - py);
      if (d < d1) { d2 = d1; d1 = d; id = wy * p + wx; } else if (d < d2) d2 = d; }
    CELL.d = d1; CELL.d2 = d2; CELL.id = id; return CELL; }

  /* ======================= materials ======================= (each sets K.M; u, v surface coordinates in tiles) */
  // snow: bright, rough, a faint blue in its hollows (the sky in it), sparkling crystals here and there
  function snowM(K, u, v, sd, o) { const M = K.M, w = K.vn(u * 3.1 + sd, v * 3.1), sp = K.vn(u * 47 + sd, v * 47 - sd), t = 0.86 + 0.08 * (w - 0.5) * 2;
    M.r = 0.82 * t; M.g = 0.88 * t; M.b = 0.95 * t; M.rg = 0.78; M.cc = 0.08; M.er = 0.07 * t; M.eg = 0.1 * t; M.eb = 0.15 * t;   // (light scattered in the snow)
    if (sp > 0.9) { M.cc = 0.9; M.rg = 0.12; } if (o && o.blue) { M.r *= 1 - o.blue * 0.25; M.g *= 1 - o.blue * 0.12; M.er *= 1 - o.blue * 0.4; } }
  // granite: dark blue-grey, grained, specks of feldspar, frost gathered on its upper faces and in its cracks
  function rockM(K, u, v, sd, frost, up) { const M = K.M, w = K.fbm(u * 2.4 + sd, v * 2.4 + sd * 0.7), p = K.vn(u * 23 + sd, v * 23), sp = K.vn(u * 61, v * 61 + sd), t = 0.2 + 0.08 * (w - 0.5);
    M.r = t * 0.92; M.g = t * 0.98; M.b = t * 1.14; M.rg = 0.62; M.cc = 0.14; if (p > 0.76) M.ao *= 0.78; if (sp > 0.9) { M.r += 0.06; M.g += 0.06; M.b += 0.07; }
    const fr = clamp(frost || 0, 0, 1) * ss(0.56, 0.76, K.vn(u * 4.7 + sd + 3, v * 4.7) * 0.65 + (up ? 0.4 : 0.05)); if (fr > 0) { const s2 = K.vn(u * 29, v * 29 + sd); M.r = lerp(M.r, 0.72 + 0.1 * s2, fr); M.g = lerp(M.g, 0.8 + 0.08 * s2, fr); M.b = lerp(M.b, 0.9, fr); M.rg = lerp(M.rg, 0.85, fr); } }
  // dressed observatory stone: a cold blue-grey limestone, each block its tone, chips, specks, frost in the pores
  function stoneM(K, u, v, sd, o) { const M = K.M, g = K.fbm(u * 3.3 + sd, v * 3.3 + sd * 0.7), p = K.vn(u * 29 + sd, v * 29), t = ((o && o.tone) || 1) * (0.82 + 0.26 * g);
    M.r = 0.36 * t; M.g = 0.4 * t; M.b = 0.48 * t; M.rg = 0.8; M.cc = 0.05; if (p > 0.74) M.ao *= 1 - (p - 0.74) * 2.2;
    const fr = (o && o.frost != null ? o.frost : 0.4) * ss(0.6, 0.78, K.vn(u * 6 + sd + 5, v * 6) + (o && o.up ? 0.25 : 0)); if (fr > 0) { M.r = lerp(M.r, 0.78, fr); M.g = lerp(M.g, 0.84, fr); M.b = lerp(M.b, 0.92, fr); M.rg = lerp(M.rg, 0.86, fr); } }
  // cold brass (the observatory's instruments): tarnished dark, bright where worn, a green bloom in the hollows
  function brassM(K, u, v, ao, sd, wear) { const M = K.M, s1 = K.vn(u * 4 + sd, v * 4), s2 = K.vn(u * 14 - sd, v * 14), pk = clamp((1 - ao) * 0.9 + ss(0.62, 0.86, s1 * 0.7 + s2 * 0.4) * 0.5, 0, 1) * (1 - (wear || 0) * 0.8), wr = clamp(wear || 0, 0, 1);
    M.mt = 1 - pk * 0.85; M.r = lerp(0.3, 0.12, pk); M.g = lerp(0.22, 0.32, pk); M.b = lerp(0.08, 0.28, pk); M.fr = lerp(0.72 * (0.8 + 0.3 * s1), 0.98, wr); M.fg = lerp(0.54 * (0.8 + 0.3 * s1), 0.86, wr); M.fb = lerp(0.26 * (0.8 + 0.3 * s1), 0.58, wr); M.rg = lerp(lerp(0.36, 0.16, wr), 0.8, pk); }
  // glacier ice for the kit's shapes (face: -1 / 0 / 1 the prism's left / front / right, q across -1..1, wt along 0..1, tip):
  // a clear coat over light held inside (deep blue at the root, pale toward the tip and the ridges), refraction bands, hairline
  // fractures, frosted patches; tint: [r, g, b] of the light inside (the aurora's green in it, or a plain cyan)
  function iceM(K, face, q, wt, tip, sd, o) { const M = K.M, tint = (o && o.tint) || [0.45, 0.78, 1.0], g = (o && o.glow) != null ? o.glow : 1;
    M.r = 0.03; M.g = 0.05; M.b = 0.08; M.rg = 0.06; M.cc = 1; M.sh = 0.55;
    const w = K.vn(q * 2.1 + face * 3.7 + sd, wt * 4.3 + sd), edge = Math.pow(Math.abs(q), 3), ridge = ss(0.12, 0.0, Math.abs(Math.abs(q) - 0.5)) * 0.8 + ss(0.9, 1.0, Math.abs(q)) * 0.4;
    const band = Math.pow(Math.max(0, Math.sin((wt * (3 + face) + q * 1.3 + sd) * 5.2 + w * 2.4)), 14) * 0.5;
    const k = clamp(0.1 + 0.7 * Math.pow(wt, 1.2) + 0.35 * edge + 0.25 * (w - 0.5) + (tip ? 0.25 : 0), 0, 1), ff = face < 0 ? 1.25 : face > 0 ? 0.62 : 0.95;
    M.er = (0.04 + tint[0] * 0.46 * k + band * 0.5 + ridge * 0.55) * ff * g; M.eg = (0.09 + tint[1] * 0.5 * k + band * 0.55 + ridge * 0.6) * ff * g; M.eb = (0.16 + tint[2] * 0.56 * k + band * 0.6 + ridge * 0.65) * ff * g;
    const cr = ss(0.012, 0, Math.abs(K.vn(q * 3.3 + sd * 2, wt * 5.1 + face) - 0.5)) * ss(0.5, 0.68, K.vn(q * 1.2 + sd, wt * 2 + face * 2)); if (cr > 0) { M.er += cr * 0.7; M.eg += cr * 0.8; M.eb += cr * 0.85; }
    const fp = ss(0.64, 0.8, K.vn(q * 2.6 + sd + 11, wt * 3.2 + face)) * 0.5 * ((o && o.frost) != null ? o.frost : 1); if (fp > 0) { M.r += 0.36 * fp; M.g += 0.4 * fp; M.b += 0.44 * fp; M.rg = lerp(M.rg, 0.6, fp); M.cc *= 1 - 0.6 * fp; }
    const rime = ((o && o.root) != null ? o.root : 0.12) * (0.6 + 0.8 * K.vn(q * 4 + sd, 3.3)); if (rime > 0 && wt < rime) { const f = ss(rime, rime * 0.3, wt); M.r = lerp(M.r, 0.8, f); M.g = lerp(M.g, 0.86, f); M.b = lerp(M.b, 0.94, f); M.rg = lerp(M.rg, 0.85, f); M.cc = lerp(M.cc, 0.1, f); M.er *= 1 - f * 0.8; M.eg *= 1 - f * 0.8; M.eb *= 1 - f * 0.7; } }
  // the same materials for the textures that wrap (their noise repeats with the texture: no seam where it is laid again)
  function snowT(K, x, y, sd, blue) { const M = K.M, w = wn(x, y, 1, sd) * 0.6 + wn(x, y, 3, sd + 1) * 0.4, sp = wn(x, y, 24, sd + 2), t = 0.86 + 0.08 * (w - 0.5) * 2;
    M.r = 0.82 * t; M.g = 0.88 * t; M.b = 0.95 * t; M.rg = 0.78; M.cc = 0.08; M.er = 0.07 * t; M.eg = 0.1 * t; M.eb = 0.15 * t; if (sp > 0.86) { M.cc = 0.9; M.rg = 0.12; } if (blue) { M.r *= 1 - blue * 0.25; M.g *= 1 - blue * 0.12; } }
  function stoneT(K, x, y, sd, tone, frost) { const M = K.M, g = wn(x, y, 2, sd) * 0.6 + wn(x, y, 6, sd + 1) * 0.4, p = wn(x, y, 16, sd + 2), t = (tone || 1) * (0.82 + 0.26 * g);
    M.r = 0.36 * t; M.g = 0.4 * t; M.b = 0.48 * t; M.rg = 0.8; M.cc = 0.05; if (p > 0.72) M.ao *= 1 - (p - 0.72) * 2;
    const fr = (frost == null ? 0.4 : frost) * ss(0.6, 0.78, wn(x, y, 4, sd + 5)); if (fr > 0) { M.r = lerp(M.r, 0.78, fr); M.g = lerp(M.g, 0.84, fr); M.b = lerp(M.b, 0.92, fr); M.rg = lerp(M.rg, 0.86, fr); } }
  function rockT(K, x, y, sd, frost) { const M = K.M, w = wn(x, y, 2, sd) * 0.6 + wn(x, y, 6, sd + 1) * 0.4, p = wn(x, y, 16, sd + 2), sp = wn(x, y, 32, sd + 3), t = 0.13 + 0.07 * (w - 0.5);
    M.r = t * 0.92; M.g = t * 0.98; M.b = t * 1.14; M.rg = 0.66; M.cc = 0.1; if (p > 0.76) M.ao *= 0.72; if (sp > 0.86) { M.r += 0.08; M.g += 0.08; M.b += 0.09; }
    const fr = (frost || 0) * ss(0.5, 0.7, wn(x, y, 4, sd + 4)); if (fr > 0) { M.r = lerp(M.r, 0.78, fr); M.g = lerp(M.g, 0.84, fr); M.b = lerp(M.b, 0.92, fr); M.rg = lerp(M.rg, 0.85, fr); } }
  const TINT = { glacier: [0.4, 0.86, 0.9], obs: [0.36, 0.9, 0.78], white: [0.6, 0.82, 1.0] };

  /* ======================= primitives beyond the kit's (as v463 SE's) ======================= */
  // lump: a mass seen from the front (an ellipsoid with a wavering edge and a bumpy face); mat(dx, dy, ao, e, nz, wx, wy)
  function lump(K, S, cx, cy, rx, ry, o) { const { M, vn } = K, P = S.P, X0 = S.ax + cx * P, Y0 = S.ay + cy * P, RX = rx * P, RY = ry * P; if (RX < 0.5) return;
    const amp = o.amp == null ? 0.12 : o.amp, fr = o.fr || 2.2, sd = o.sd || 0, bump = o.bump == null ? 0.5 : o.bump, lf = o.leaf || 9, mR = Math.min(RX, RY), A0 = o.ao == null ? 1 : o.ao, flat = o.flat || 0, cut = o.cut;
    S.lock();
    const xa = Math.max(0, Math.floor(X0 - RX * (1 + amp) - 2)), xb = Math.min(S.w - 1, Math.ceil(X0 + RX * (1 + amp) + 2)), ya = Math.max(0, Math.floor(Y0 - RY * (1 + amp) - 2)), yb = Math.min(S.h - 1, Math.ceil(Y0 + RY * (1 + amp) + 2));
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { let dx = (px + 0.5 - X0) / RX, dy = (py + 0.5 - Y0) / RY; if (flat && dy > 0) dy *= 1 + flat * dy * 2;
      const wx = (px - S.ax) / P, wy = (py - S.ay) / P; if (cut != null && wy > cut) continue;
      const rr = Math.hypot(dx, dy), ca = dx / (rr || 1), sa = dy / (rr || 1);
      const edge = 1 + amp * (vn(ca * fr + sd + 3, sa * fr + sd * 1.3 + 3) * 2 - 1) + amp * 0.5 * (vn(ca * fr * 3 + sd, sa * fr * 3 - sd) * 2 - 1); if (rr > edge + 1.5 / mR) continue;
      const e = Math.min(1, rr / edge), ny0 = Math.sqrt(Math.max(0, 1 - e * e));
      const b1 = vn(wx * lf + sd, wy * lf), b2 = vn(wx * lf + 4.1 + sd, wy * lf + 2.3);
      let nx = dx / edge + (b1 - 0.5) * bump, ny = ny0 + 0.08, nz = -dy / edge + (b2 - 0.5) * bump; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      K.M0(); M.ao = (0.5 + 0.5 * ny0) * A0; o.mat(dx, dy, M.ao, e, nz, wx, wy); K.shade(nx, ny, nz); K.put(S, px, py, clamp((edge - rr) * mR + 0.6, 0, 1) * (cut != null ? clamp((cut - wy) * P + 0.5, 0, 1) : 1)); } }
  // prism: a six-sided prism standing from its foot (cx, by), leaning ang (radians from straight up, + to the right), radius
  // r0 -> r1 over h tiles, then a tip tip tall; mat(face, q, wt, inTip, ao)
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
      K.put(S, px, py, clamp((r - au) * P + 0.6, 0, 1) * clamp((w + 0.6 / P) * P, 0, 1) * (o.alpha == null ? 1 : o.alpha)); } }
  // disc: a flat plate standing toward the camera (a lens, a medallion): centre (cx, cy), radii rx, ry; mat(dx, dy, e, ao)
  function disc(K, S, cx, cy, rx, ry, mat, o) { o = o || {}; const { M } = K, P = S.P, X0 = S.ax + cx * P, Y0 = S.ay + cy * P, RX = rx * P, RY = ry * P, bv = o.bv == null ? 0.14 : o.bv, dome = o.dome || 0; if (RX < 0.5) return; S.lock();
    for (let py = Math.max(0, Math.floor(Y0 - RY - 2)); py <= Math.min(S.h - 1, Math.ceil(Y0 + RY + 2)); py++) for (let px = Math.max(0, Math.floor(X0 - RX - 2)); px <= Math.min(S.w - 1, Math.ceil(X0 + RX + 2)); px++) {
      const dx = (px + 0.5 - X0) / RX, dy = (py + 0.5 - Y0) / RY, r = Math.hypot(dx, dy); if (r > 1 + 1.5 / RX) continue; const k = r > 1 - bv ? (r - (1 - bv)) / bv * 0.85 : dome * r;
      const ux = r > 1e-5 ? dx / r : 0, uy = r > 1e-5 ? dy / r : 0, s = Math.min(0.95, k), nx = ux * s, nz = -uy * s, ny = Math.sqrt(1 - s * s);
      K.M0(); M.ao = 1 - 0.2 * ss(1 - bv, 1, r); mat(dx, dy, r, M.ao); K.shade(nx, ny, nz); K.put(S, px, py, clamp((1 - r) * Math.min(RX, RY) + 0.6, 0, 1)); } }
  // box: the kit's rounded box (feet line by, half width hw, half depth hd, z0..z1 up, edge b); mat(face 'f'|'t', u, v, ao)
  const box = (K, S, cx, by, hw, hd, z0, z1, b, mat, o) => K.rbox(S, cx, by, hw, hd, z0, z1, b, mat, o);
  function contact(K, S, rx, ry, a, x, y) { K.contact(S, x || 0, y == null ? 0.03 : y, rx, ry, a); }
  function halo(c, x, y, r, col, a) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.4)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
  // frost dust: fine white specks and a few sparkles about a point (2D, tiles)
  function dust(c, R, x, y, rx, ry, n, a) { c.save(); for (let i = 0; i < n; i++) { const an = R() * TAU, d = Math.sqrt(R()), px = x + Math.cos(an) * rx * d, py = y + Math.sin(an) * ry * d, s = 0.007 + R() * 0.016; c.fillStyle = `rgba(240,250,255,${(0.35 + R() * 0.55) * (a || 1)})`; c.fillRect(px - s / 2, py - s / 2, s, s); } c.restore(); }
  // icicles hanging from a lip: n of them along x0..x1 at y (tiles), up to len long (ice prisms pointing down)
  function icicles(K, S, x0, x1, y, n, len, sd, L) { const R = K.R1(sd * 97 + 13); for (let i = 0; i < n; i++) { const x = lerp(x0, x1, (i + 0.3 + R() * 0.4) / n), l = len * (0.35 + R() * 0.65), r = 0.02 + l * 0.08;
      prism(K, S, x, y - 0.02, r, r * 0.7, l * 0.35, l * 0.65, Math.PI + (R() - 0.5) * 0.12, (f, q, wt, tip) => iceM(K, f, q, 1 - wt, tip, sd + i, { tint: TINT[L], root: 0, frost: 0.4 })); } S.unlock(); }
  // a snow cap lying over a shape's top: a lump from cx-rx..cx+rx, its top at y0, thickness th (it droops at its ends)
  function snowCap(K, S, cx, y0, rx, th, sd, o) { lump(K, S, cx, y0 + th * 0.55, rx, th * 0.75, { amp: 0.14, fr: 2.6, sd, bump: 0.35, leaf: 7, flat: 0.9, ao: 1, mat: (dx, dy, ao, e, nz, wx, wy) => { snowM(K, wx * 2, wy * 2, sd, { blue: (o && o.blue) || 0 }); K.M.ao = 0.75 + 0.25 * ao; if (dy > 0.3) K.M.ao *= 0.85; } }); S.unlock(); }

  /* ======================= the props ======================= */
  // (box: the picture's box about its feet in tiles; paint(K, S, v, L); mat: what BREAK_FX breaks it into; el: its element; hp)
  const SNOWC = ['#E8F2F8', '#A8C4D8', '#FFFFFF'], ICEC = ['#BFE4FF', '#5A9CC8', '#F0FAFF'], ROCKC = ['#3A4458', '#1E2638', '#8A98AC'], STONEC = ['#6A7890', '#3A4458', '#C8D4E2'], BRASSC = ['#9A7A3E', '#4A3418', '#E8C27A'];
  const DEF = {
    /* a granite boulder under a broad cap of wind-packed snow; icicles from the cap's lip, rime on its weather side, pebbles */
    snowrock: { box: () => [-1.15, -1.75, 1.15, 0.45], mat: { mat: 'stone', cols: ROCKC, mix: 'ice' }, el: 'frost', hp: 3,
      paint(K, S, v, L) { const sd = 11 + v * 7, c = S.c, R = K.R1(41 + v), w = v ? 0.86 : 0.74, h = v ? 0.92 : 1.08; contact(K, S, w * 1.05, 0.3, 0.6);
        lump(K, S, -w * 0.55, -0.16, w * 0.42, 0.2, { amp: 0.25, fr: 3, sd: sd + 3, bump: 0.6, flat: 0.8, mat: (dx, dy, ao, e, nz, wx, wy) => rockM(K, wx * 2, wy * 2, sd + 5, 0.5, nz > 0.3) });
        lump(K, S, 0.02, -h * 0.46, w, h * 0.52, { amp: 0.2, fr: 2.4, sd, bump: 0.75, leaf: 6, flat: 0.5, mat: (dx, dy, ao, e, nz, wx, wy) => rockM(K, wx * 1.6, wy * 1.6, sd, 0.85, nz > 0.25) }); S.unlock();
        snowCap(K, S, 0.05 + (v ? 0.08 : -0.05), -h * 0.98, w * 0.86, h * 0.36, sd + 9, { blue: L === 'white' ? 0 : 0.2 });
        icicles(K, S, -w * 0.6, w * 0.7, -h * 0.66, 5 + v, 0.34, sd, L);
        lump(K, S, w * 0.75, -0.07, 0.16, 0.1, { amp: 0.3, sd: sd + 7, mat: (dx, dy, ao, e, nz, wx, wy) => rockM(K, wx * 3, wy * 3, sd + 7, 0.6, nz > 0.2) }); S.unlock();
        dust(c, R, 0, -h * 0.95, w * 0.8, 0.12, 40); dust(c, R, 0, 0.05, w * 1.1, 0.22, 30); K.glint(c, -w * 0.25, -h * 1.12, 0.1, 0.55); K.ink(S, INK[L], 0.45); } },
    /* a great smooth drift of wind-packed snow: a carved cornice on its lee, sastrugi ridges on its weather side, a few dark
       rocks and an ice blade breaking through, soft blue in its shadow */
    snowhill: { box: v => [-1.55, -2.1 - (v ? 0.2 : 0), 1.55, 0.45], mat: { mat: 'snow', cols: SNOWC }, el: 'frost', hp: 3,
      paint(K, S, v, L) { const sd = 21 + v * 5, c = S.c, R = K.R1(53 + v), w = 1.2 + v * 0.12, h = 1.42 + v * 0.22; c.save(); c.scale(1, K.K); const g = c.createRadialGradient(0, 0, 0.1, 0, 0, w * 1.25); g.addColorStop(0, 'rgba(30,60,110,.32)'); g.addColorStop(1, 'rgba(30,60,110,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, w * 1.25, 0, TAU); c.fill(); c.restore();
        if (!v) { prism(K, S, 0.55, -0.15, 0.2, 0.14, 0.9, 0.42, 0.32, (f, q, wt, tip) => iceM(K, f, q, wt, tip, sd, { tint: TINT[L] })); S.unlock(); }
        lump(K, S, -w * 0.12, -h * 0.42, w * 0.92, h * 0.46, { amp: 0.1, fr: 1.6, sd: sd + 1, bump: 0.2, leaf: 4, flat: 1.2, mat: (dx, dy, ao, e, nz, wx, wy) => { snowM(K, wx * 2, wy * 2, sd + 1, { blue: 0.1 }); } }); S.unlock();
        lump(K, S, w * 0.1, -h * 0.55, w * 0.78, h * 0.5, { amp: 0.08, fr: 1.8, sd, bump: 0.22, leaf: 4, flat: 1.4, mat: (dx, dy, ao, e, nz, wx, wy) => { const rid = Math.pow(Math.abs(Math.sin((wx * 2.2 - wy * 3.4 + K.vn(wx * 2, wy * 2) * 1.8) * 3.2)), 8) * ss(0.2, -0.3, dx); snowM(K, wx * 2, wy * 2, sd, { blue: 0.15 + (dx > 0.2 ? 0.35 * ss(0.2, 0.9, dx) : 0) }); K.M.ao *= 0.86 + 0.14 * (1 - rid); if (dy > 0.55) K.M.ao *= 0.92; } }); S.unlock();
        lump(K, S, w * 0.18, -h * 0.98, w * 0.55, h * 0.12, { amp: 0.1, fr: 3, sd: sd + 4, bump: 0.25, flat: 0.4, mat: (dx, dy, ao, e, nz, wx, wy) => { snowM(K, wx * 2, wy * 2, sd + 4); if (dy > 0.2) K.M.ao *= 0.7; } }); S.unlock();
        for (const [x, y, r] of v ? [[-0.85, -0.12, 0.2], [-0.55, -0.05, 0.12], [0.95, -0.1, 0.16]] : [[-0.75, -0.1, 0.22], [0.98, -0.08, 0.13]]) lump(K, S, x, y, r, r * 0.7, { amp: 0.3, sd: sd + x * 9, bump: 0.7, flat: 0.6, mat: (dx, dy, ao, e, nz, wx, wy) => rockM(K, wx * 3, wy * 3, sd + 2, 0.7, nz > 0.2) });
        S.unlock(); dust(c, R, -0.2, -h * 0.75, w * 0.7, h * 0.3, 70); K.glint(c, -w * 0.35, -h * 0.82, 0.12, 0.6); K.glint(c, w * 0.05, -h * 1.02, 0.08, 0.5); K.ink(S, INK[L], 0.35); } },
    /* a slab of glacier ice heaved up out of the floor: a broad bevelled wedge and a split shard beside it, deep blue inside,
       its upper faces frosted, snow banked at its foot and lying on its back */
    icewedge: { box: () => [-1.3, -2.5, 1.3, 0.45], mat: { mat: 'ice', cols: ICEC }, el: 'frost', hp: 3,
      paint(K, S, v, L) { const sd = 31 + v * 3, c = S.c, R = K.R1(61 + v), m = v ? -1 : 1; contact(K, S, 1.0, 0.3, 0.55); halo(c, 0, -1.0, 1.2, '#9FD8FF', L === 'white' ? 0.08 : 0.16);
        prism(K, S, -0.42 * m, 0.0, 0.3, 0.24, 0.75, 0.38, -0.36 * m, (f, q, wt, tip) => iceM(K, f, q, wt, tip, sd + 2, { tint: TINT[L] }));
        prism(K, S, 0.12 * m, 0.04, 0.62, 0.5, 1.35, 0.55, 0.22 * m, (f, q, wt, tip) => iceM(K, f, q, wt, tip, sd, { tint: TINT[L], frost: 1.2 }));
        prism(K, S, 0.6 * m, 0.06, 0.2, 0.16, 0.45, 0.25, 0.55 * m, (f, q, wt, tip) => iceM(K, f, q, wt, tip, sd + 5, { tint: TINT[L] })); S.unlock();
        lump(K, S, 0.02, -0.08, 0.95, 0.18, { amp: 0.25, fr: 3, sd: sd + 9, bump: 0.3, flat: 0.8, mat: (dx, dy, ao, e, nz, wx, wy) => snowM(K, wx * 2, wy * 2, sd + 9, { blue: 0.15 }) }); S.unlock();
        snowCap(K, S, (0.12 + 0.22 * 1.6) * m, -1.62, 0.34, 0.13, sd + 3);
        dust(c, R, 0, -0.1, 1.0, 0.2, 40); K.glint(c, (0.12 + 0.22 * 2.0) * m, -1.86, 0.14, 0.9); K.glint(c, -0.62 * m, -1.02, 0.08, 0.6); K.ink(S, INK[L], 0.4); } },
    /* a weather vane of the old observers: a rimed granite plinth, an iron mast, a vane arrow with its tail fin, a triangular
       pennant of beaten metal frozen mid-flutter, a green glass eye in its hub (its light the GPU's) */
    frozenvane: { box: () => [-1.0, -2.65, 1.25, 0.4], mat: { mat: 'iron', cols: ['#4A5468', '#1E2638', '#A8B4C4'], mix: 'stone' }, el: 'wind', hp: 2,
      paint(K, S, v, L) { const sd = 41 + v, c = S.c, R = K.R1(71 + v), m = v ? -1 : 1; contact(K, S, 0.5, 0.17, 0.55);
        box(K, S, 0, 0.02, 0.32, 0.24, 0, 0.32, 0.05, (f, u, vv) => { rockM(K, u * 2, vv * 2, sd, 0.6, f === 't'); if (f === 'f' && Math.abs(vv - 0.2) < 0.015) K.M.ao *= 0.5; }); S.unlock();
        snowCap(K, S, 0.02, -0.4, 0.3, 0.07, sd + 3);
        K.rev(S, 0, -0.32, h => (h < 0.08 ? 0.07 : 0.045) - h * 0.004, 0, 2.05, { mat: (u, h, ao) => { K.iron(u * 3, h * 2, ao, sd); const fr = ss(0.55, 0.75, K.vn(u * 7 + sd, h * 5)) * 0.8; if (fr > 0 && u < 0.02) { K.M.mt *= 1 - fr; K.M.r = lerp(K.M.r, 0.8, fr); K.M.g = lerp(K.M.g, 0.86, fr); K.M.b = lerp(K.M.b, 0.92, fr); K.M.rg = 0.85; } }, top: true, capMat: () => brassM(K, 0, 0, 1, sd, 0.6) }); S.unlock();
        const hy = -2.0; K.tube(S, [[-0.62 * m, hy], [0.7 * m, hy]], 0.03, 0.025, (t, s, ao) => K.iron(t * 4, s, ao, sd + 1)); S.unlock();
        c.save(); c.translate(0.74 * m, hy); c.scale(m, 1); c.beginPath(); c.moveTo(0.14, 0); c.lineTo(-0.08, -0.1); c.lineTo(-0.03, 0); c.lineTo(-0.08, 0.1); c.closePath(); let g = c.createLinearGradient(0, -0.1, 0, 0.1); g.addColorStop(0, '#9AA8BC'); g.addColorStop(0.5, '#4A5468'); g.addColorStop(1, '#1E2638'); c.fillStyle = g; c.fill(); c.restore();
        c.save(); c.translate(-0.62 * m, hy); c.scale(m, 1); c.beginPath(); c.moveTo(0.05, 0); c.lineTo(-0.28, -0.26); c.lineTo(-0.34, -0.2); c.lineTo(-0.16, 0); c.lineTo(-0.34, 0.2); c.lineTo(-0.28, 0.26); c.closePath(); g = c.createLinearGradient(0, -0.26, 0, 0.26); g.addColorStop(0, '#B8C4D4'); g.addColorStop(0.45, '#5A6678'); g.addColorStop(1, '#262E3E'); c.fillStyle = g; c.fill(); c.restore();
        // the pennant: beaten metal, frozen in a flutter, rime along its leading edge
        c.save(); c.translate(0, -1.58); c.scale(m, 1); c.beginPath(); c.moveTo(0.04, -0.2); c.bezierCurveTo(0.3, -0.24, 0.5, -0.1, 0.72, -0.08); c.bezierCurveTo(0.5, 0.0, 0.32, 0.12, 0.04, 0.16); c.closePath(); g = c.createLinearGradient(0, -0.22, 0.6, 0.14); g.addColorStop(0, '#DDE6EE'); g.addColorStop(0.4, '#8C9AAE'); g.addColorStop(0.75, '#5A6678'); g.addColorStop(1, '#3A4458'); c.fillStyle = g; c.fill();
        c.globalCompositeOperation = 'source-atop'; c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(0.06, -0.19); c.bezierCurveTo(0.3, -0.23, 0.5, -0.1, 0.7, -0.08); c.stroke(); c.restore();
        K.ball(S, 0, hy, 0.085, 0.085, (dx, dy) => brassM(K, dx, dy, 1, sd + 3, 0.5)); S.unlock(); K.ball(S, 0.0, hy, 0.045, 0.045, (dx, dy) => { const M = K.M; M.r = 0.05; M.g = 0.3; M.b = 0.2; M.rg = 0.08; M.cc = 1; M.er = 0.25; M.eg = 0.75; M.eb = 0.5; }); S.unlock();
        icicles(K, S, -0.5, 0.6, hy + 0.02, 5, 0.18, sd, L); icicles(K, S, -0.3, 0.3, -0.36, 3, 0.16, sd + 5, L);
        dust(c, R, 0, -0.38, 0.3, 0.06, 20); K.ink(S, INK[L], 0.45); } },
    /* a tall arch of the observatory, leaning outward like a rib: two piers of dressed blocks, a ring of voussoirs, a keystone
       with a brass star inlaid, snow on its crown and every ledge, icicles under the soffit. v 1: broken, one pier stopping in a
       jagged stump, its fallen blocks at its foot */
    obsarch: { box: () => [-1.55, -3.6, 1.55, 0.45], mat: { mat: 'stone', cols: STONEC }, el: 'gold', hp: 4,
      paint(K, S, v, L) { const sd = 51 + v * 5, c = S.c, R = K.R1(81 + v), lean = 0.1, PW = 0.26, PX = 0.92, H = 2.25, broken = v === 1; contact(K, S, 1.35, 0.3, 0.55);
        const pier = (sx, top) => { const n = Math.round(top / 0.42); for (let i = 0; i < n; i++) { const z0 = i * top / n, z1 = (i + 1) * top / n, x = sx * PX + sx * lean * (z0 + z1) * 0.5 / H, hw = PW * (1 - i * 0.02) + (i % 2 ? 0.02 : 0);
            box(K, S, x, 0, hw, 0.22, z0, z1 - 0.012, 0.035, (f, u, vv) => stoneM(K, u * 2 + i * 1.7, vv * 2, sd + i + sx, { tone: 0.92 + 0.16 * hh(i, sx + 2, sd), up: f === 't', frost: 0.5 })); S.unlock(); } };
        pier(-1, H); pier(1, broken ? H * 0.42 : H);
        box(K, S, 0, 0.03, 1.32, 0.3, 0, 0.1, 0.03, (f, u, vv) => stoneM(K, u * 3, vv * 3, sd + 9, { tone: 0.8, up: f === 't' })); S.unlock();
        if (!broken) { const R0 = PX + lean * 0.5, N = 9; for (let i = 0; i < N; i++) { const a0 = Math.PI + i / N * Math.PI, a1 = Math.PI + (i + 1) / N * Math.PI, pts = []; for (let k = 0; k <= 4; k++) { const a = lerp(a0, a1, k / 4) ; pts.push([Math.cos(a) * R0, -H - Math.sin(a + Math.PI) * R0 * 0.95 + 0.02]); }
            const key = i === 4; K.tube(S, pts, key ? 0.29 : 0.25, key ? 0.29 : 0.25, (t, s2, ao) => { stoneM(K, t * 2 + i * 3.1, s2, sd + 20 + i, { tone: key ? 1.08 : 0.95 + 0.1 * hh(i, 5, sd), up: s2 < -0.3, frost: 0.55 }); if (t < 0.04 || t > 0.96) K.M.ao *= 0.55; }); S.unlock(); }
          snowCap(K, S, 0, -H - R0 * 0.95 - 0.28, 0.62, 0.17, sd + 4); icicles(K, S, -0.5, 0.5, -H - R0 * 0.95 + 0.25, 7, 0.36, sd, L);
          c.save(); c.translate(0, -H - R0 * 0.95 + 0.02); c.fillStyle = '#E8C27A'; c.beginPath(); for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + k * Math.PI / 4, r = k % 2 ? 0.045 : 0.12; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.strokeStyle = 'rgba(70,50,20,.8)'; c.lineWidth = 0.015; c.stroke(); c.restore(); }
        else { snowCap(K, S, PX + lean * 0.2, -H * 0.42 - 0.08, 0.3, 0.1, sd + 6); for (const [x, y, r] of [[1.25, -0.06, 0.2], [0.55, -0.04, 0.15], [1.4, -0.3, 0.13]]) { box(K, S, x, y + 0.1, r * 1.2, r * 0.8, 0, r * 1.2, 0.04, (f, u, vv) => stoneM(K, u * 3 + x, vv * 3, sd + x * 7, { up: f === 't', frost: 0.6 })); S.unlock(); }
          snowCap(K, S, -PX - lean, -H - 0.12, 0.32, 0.1, sd + 8); }
        snowCap(K, S, -PX - lean * 0.45, -H * 0.5, 0.2, 0.05, sd + 2); dust(c, R, 0, -0.06, 1.3, 0.2, 40); K.ink(S, INK[L], 0.45); } },
    /* the ruin of a great telescope: a drum of dressed stone with a carved meridian band, a brass fork, the long brass tube
       tilted at the sky with its rings and dew cap, a lens of blue glass (its light the GPU's), snow on everything that faces up */
    telescope: { box: () => [-1.45, -3.0, 1.55, 0.45], mat: { mat: 'iron', cols: BRASSC, mix: 'stone' }, el: 'gold', hp: 3,
      paint(K, S, v, L) { const sd = 61 + v, c = S.c, R = K.R1(91 + v), m = v ? -1 : 1; contact(K, S, 0.9, 0.28, 0.6);
        K.rev(S, 0, 0, h => h < 0.1 ? 0.62 : h < 0.68 ? 0.52 - 0.04 * h : 0.6, 0, 0.78, { mat: (u, h, ao) => { stoneM(K, u * 2, h * 2, sd, { tone: 0.95, frost: 0.4 }); if (Math.abs(h - 0.4) < 0.05) { brassM(K, u * 5, h * 5, ao, sd, 0.3); } if (Math.abs(((u * 3.2) % 1 + 1) % 1 - 0.5) > 0.47 && h > 0.1 && h < 0.68) K.M.ao *= 0.5; }, top: true, capMat: (x) => snowM(K, x * 3, 4, sd) }); S.unlock();
        K.tube(S, [[-0.28 * m, -0.86], [-0.3 * m, -1.32]], 0.06, 0.05, (t, s2, ao) => brassM(K, t * 2, s2, ao, sd + 1, 0.2)); K.tube(S, [[0.28 * m, -0.86], [0.3 * m, -1.32]], 0.06, 0.05, (t, s2, ao) => brassM(K, t * 2, s2, ao, sd + 2, 0.2)); S.unlock();
        const a = 0.95, cx = 0, cy = -1.3, L1 = 1.55, L0 = 0.62, dx = Math.sin(a) * m, dy = -Math.cos(a), ex = cx + dx * L1, ey = cy + dy * L1, bx = cx - dx * L0, by = cy - dy * L0;
        K.tube(S, [[bx, by], [cx, cy], [ex, ey]], 0.16, 0.21, (t, s2, ao) => { const tt = t * (L0 + L1); brassM(K, tt * 2, s2, ao, sd + 3, 0.25 * (1 - Math.abs(s2))); for (const rr of [0.25, 0.62, 1.2, 1.9]) if (Math.abs(tt - rr) < 0.035) { brassM(K, tt * 8, s2, ao, sd, 0.75); K.M.ao *= 0.9; } if (s2 < -0.55) { const f = ss(-0.55, -0.85, s2) * 0.85; K.M.mt *= 1 - f; K.M.r = lerp(K.M.r, 0.84, f); K.M.g = lerp(K.M.g, 0.9, f); K.M.b = lerp(K.M.b, 0.96, f); K.M.rg = lerp(K.M.rg, 0.8, f); } }); S.unlock();
        K.tube(S, [[ex - dx * 0.06, ey - dy * 0.06], [ex + dx * 0.16, ey + dy * 0.16]], 0.25, 0.26, (t, s2, ao) => { brassM(K, t * 3, s2, ao, sd + 4, 0.35); K.M.ao *= 0.8; }); S.unlock();
        disc(K, S, ex + dx * 0.17, ey + dy * 0.17, 0.2, 0.2, (x, y, r) => { const M = K.M; M.r = 0.02; M.g = 0.05; M.b = 0.1; M.rg = 0.04; M.cc = 1; M.er = 0.1 + 0.3 * (1 - r); M.eg = 0.3 + 0.35 * (1 - r); M.eb = 0.55 + 0.4 * (1 - r); }, { bv: 0.2, dome: 0.25 }); S.unlock();
        K.tube(S, [[bx + dx * 0.05, by + dy * 0.05], [bx - dx * 0.12, by - dy * 0.12]], 0.06, 0.05, (t, s2, ao) => brassM(K, t * 4, s2, ao, sd + 5, 0.5)); S.unlock();
        icicles(K, S, Math.min(cx, ex) + 0.1, Math.max(cx, ex) - 0.1, (cy + ey) / 2 + 0.2, 4, 0.2, sd, L);
        dust(c, R, 0, -0.78, 0.5, 0.1, 25); K.glint(c, ex + dx * 0.1 - 0.06, ey + dy * 0.1 - 0.06, 0.12, 0.8); K.ink(S, INK[L], 0.45); } },
    /* a low niche of dark stone on the summit (a shelter of the old climbers): two jambs and a round arch of dark blocks, its
       back wall in shadow, snow on its crown and drifted into its mouth */
    stonearch: { box: () => [-1.15, -2.2, 1.15, 0.45], mat: { mat: 'stone', cols: ['#3A4458', '#1E2638', '#8A98AC'] }, el: 'gold', hp: 4,
      paint(K, S, v, L) { const sd = 71 + v, c = S.c, R = K.R1(101 + v); contact(K, S, 0.95, 0.3, 0.6);
        box(K, S, 0, -0.18, 0.62, 0.08, 0, 1.25, 0.03, (f, u, vv) => { rockM(K, u * 2, vv * 2, sd, 0.15, false); K.M.ao *= 0.5; }); S.unlock();
        for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { box(K, S, sx * 0.62, 0, 0.17, 0.2, i * 0.4, i * 0.4 + 0.39, 0.03, (f, u, vv) => rockM(K, u * 2 + i, vv * 2, sd + sx + i, 0.55, f === 't')); S.unlock(); }
        const N = 7; for (let i = 0; i < N; i++) { const a0 = Math.PI + i / N * Math.PI, a1 = Math.PI + (i + 1) / N * Math.PI, pts = []; for (let k = 0; k <= 4; k++) { const a = lerp(a0, a1, k / 4); pts.push([Math.cos(a) * 0.62, -1.2 - Math.sin(a + Math.PI) * 0.6]); }
          K.tube(S, pts, 0.17, 0.17, (t, s2, ao) => { rockM(K, t * 2 + i * 3, s2, sd + 9 + i, 0.6, s2 < -0.3); if (t < 0.05 || t > 0.95) K.M.ao *= 0.5; }); S.unlock(); }
        snowCap(K, S, 0, -1.92, 0.55, 0.16, sd + 2); for (const sx of [-1, 1]) snowCap(K, S, sx * 0.66, -1.24, 0.13, 0.05, sd + sx * 3);
        lump(K, S, 0, -0.06, 0.52, 0.14, { amp: 0.2, fr: 2.5, sd: sd + 5, bump: 0.25, flat: 1, mat: (dx, dy, ao, e, nz, wx, wy) => snowM(K, wx * 2, wy * 2, sd + 5, { blue: 0.2 }) }); S.unlock();
        icicles(K, S, -0.45, 0.45, -1.22, 5, 0.22, sd, L); dust(c, R, 0, -0.04, 0.9, 0.18, 30); K.ink(S, INK[L], 0.45); } },
    /* a tree grown out of glacier ice: a faceted trunk splitting into a crown of sharp crystal limbs, every limb a six-sided
       prism bright at its tip, small thorns along them, shards and a drift of snow at its roots (the tips' glints and the
       light breathing in the crown are the GPU's) */
    icetree: { box: () => [-2.5, -5.4, 2.5, 0.5], mat: { mat: 'ice', cols: ICEC, size: 3.0 }, el: 'frost', hp: 4,
      paint(K, S, v, L) { const sd = 81 + v * 13, c = S.c, R = K.R1(131 + v * 977), tint = TINT[L], H = 3.6 + (v % 2) * 0.3; contact(K, S, 1.2, 0.36, 0.55); halo(c, 0, -H * 0.62, 1.9, L === 'white' ? '#B8D8F0' : '#9FE8D8', L === 'white' ? 0.1 : 0.2);
        const limbs = [], add = (x, y, a, len, r, depth) => { limbs.push({ x, y, a, len, r, depth }); if (depth <= 0) return; const kids = 2 + (R() < 0.45 ? 1 : 0);
          for (let i = 0; i < kids; i++) { const u = 0.45 + R() * 0.42, sd2 = i % 2 ? 1 : -1, na = a + sd2 * (0.42 + R() * 0.42); add(x + Math.sin(a) * len * u, y - Math.cos(a) * len * u, na, len * (0.52 + R() * 0.2), r * 0.6, depth - 1); } };
        // the trunk (two stacked spans, kinked), the crown off its top, two low limbs off its sides
        const k = (R() - 0.5) * 0.18, tx = Math.sin(k) * H * 0.42, ty = -Math.cos(k) * H * 0.42;
        for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.46 + (R() - 0.5) * 0.18; add(tx + (i - 2) * 0.03, ty + Math.abs(i - 2) * 0.12, a, H * (i === 2 ? 0.58 : 0.42 + R() * 0.1), 0.15, i === 2 ? 2 : 1); }
        for (const sx of [-1, 1]) add(0, -H * 0.18 - R() * 0.2, sx * (1.0 + R() * 0.2), H * 0.32, 0.11, 1);
        // far limbs first (the crown is painted back to front by depth of branching: the thin far ones behind)
        limbs.sort((p, q) => q.depth - p.depth);
        for (let i = 0; i < 5; i++) { const a = -2.4 + i * 1.2 + (R() - 0.5) * 0.3, l = 0.35 + R() * 0.35; prism(K, S, (i - 2) * 0.22, 0.02, 0.07, 0.05, l * 0.6, l * 0.4, a * 0.6, (f, q, wt, tip) => iceM(K, f, q, wt, tip, sd + 50 + i, { tint, root: 0.2 })); }
        prism(K, S, 0, 0.02, 0.3, 0.2, H * 0.44, 0.0001, k, (f, q, wt, tip) => iceM(K, f, q, wt * 0.6, tip, sd, { tint, root: 0.16, frost: 1.2 }));
        let n = 0; for (const b of limbs) { const r0 = b.r, i = n++; if (b.depth === 0) for (let j = 0; j < 2; j++) { const u = 0.3 + R() * 0.4; prism(K, S, b.x + Math.sin(b.a) * b.len * u, b.y - Math.cos(b.a) * b.len * u, r0 * 0.35, r0 * 0.25, b.len * 0.12, b.len * 0.16, b.a + (j ? 0.95 : -0.95), (f, q, wt, tip) => iceM(K, f, q, 0.4 + wt * 0.6, tip, sd + i * 3 + j, { tint, root: 0 })); }
          prism(K, S, b.x, b.y, r0, r0 * 0.72, b.len * 0.68, b.len * 0.32, b.a, (f, q, wt, tip) => iceM(K, f, q, 0.25 + wt * 0.75, tip, sd + i * 2.3, { tint, root: 0, frost: 0.8 })); }
        S.unlock();
        lump(K, S, 0, -0.08, 0.85, 0.2, { amp: 0.22, fr: 3, sd: sd + 7, bump: 0.3, flat: 0.9, mat: (dx, dy, ao, e, nz, wx, wy) => snowM(K, wx * 2, wy * 2, sd + 7, { blue: 0.2 }) }); S.unlock();
        // glints at the sharpest tips (their twinkle the GPU's)
        const tips = limbs.filter(b => b.depth === 0).slice(0, 5); for (const b of tips) { const L2 = b.len; K.glint(c, b.x + Math.sin(b.a) * L2 * 0.97, b.y - Math.cos(b.a) * L2 * 0.97, 0.12, 0.7); }
        dust(c, R, 0, -0.1, 0.9, 0.2, 40); K.ink(S, INK[L], 0.4); DEF.icetree.tips[v + '|' + L] = tips.map(b => [b.x + Math.sin(b.a) * b.len * 0.97, b.y - Math.cos(b.a) * b.len * 0.97]); }, tips: {} },
  };
  const KINDS = ['snowrock', 'snowhill', 'icewedge', 'frozenvane', 'obsarch', 'telescope', 'stonearch', 'icetree'];

  /* ======================= the cache and the drawing ======================= */
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0; const CAP = 80, TCAP = 96;   // (v470 AE 2nd pass: sharper at DPR 3: props to 80 px a tile, textures to 96)
  function paint(name, v, P, L) { const B = BP(); if (!B) return null; const K = B.kit, D = DEF[name]; if (!D) return null; const b = D.box(v), t0 = now(); let S = null;
    try { S = K.surface(b[0], b[1], b[2], b[3], P); lit(K, L, () => { D.paint(K, S, v, L); S.unlock(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('AUR_PROPS', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;   // (a plain copy: the work canvas let go)
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  function sprite(name, v, P, force, L) { if (!DEF[name] || !BP()) return null; L = L || 'glacier'; P = Math.max(8, Math.min(CAP, Math.round(P || BASE || 48))); const key = name + '|' + v + '|' + L + '|' + P; let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 12) return null;
    s = paint(name, v, P, L); if (s) { if (CACHE.size > 140) release(true); CACHE.set(key, s); } return s; }
  const qP = P => Math.max(8, Math.round(Math.exp(Math.round(Math.log(P) * 10) / 10)));
  function pic(c, name, v, T, L, sc) { let P = Math.min(CAP, qP(T * (sc || 1) * kOf(c))); if (BASE && P <= BASE * 1.1 && P >= BASE * 0.5) P = BASE;
    let s = sprite(name, v, P, false, L); if (!s) { const pre = name + '|' + v + '|' + L + '|'; for (const [k, s2] of CACHE) if (k.startsWith(pre)) { s = s2; break; } } if (!s) STATS.misses++; return s; }
  const put = (c, s, Xs, Ys, T, sx, sy, rot) => { const f = T / s.P; c.save(); c.translate(Xs, Ys); if (rot) c.rotate(rot); if ((sx || 1) !== 1 || (sy || 1) !== 1) c.scale(sx || 1, sy || 1); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); c.restore(); STATS.draws++; };
  // a piece of a trial or a prop at a screen spot (its feet), T the tile in px: false when it could not be drawn (the caller draws its old 2D)
  function piece(c, name, v, Xs, Ys, T, o) { if (off() || !DEF[name]) return false; o = o || {}; const L = o.L || (LIVE && LIVE.L) || 'glacier', s = pic(c, name, v, T, L) /* (a scale, o.s: a swelling tomato, reuses the picture: never a repaint a frame) */; if (!s) return false; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; put(c, s, Xs, Ys, T * (o.s || 1), (o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1, o.rot); c.restore(); STATS.pieces++; return true; }

  /* ======================= textures that wrap (the lands) ======================= */
  const TEX = new Map(); let FA = 1, GK = null, TBASE = 0;
  function fieldBegin(K, w, h, P, fn, o) { o = o || {}; const S = K.surface(0, 0, w, h, P), W = S.w, Hh = S.h, Hm = new Float32Array(W * Hh), bump = o.bump || 1, kk = P / 2 * bump;
    const F = { S, W, Hh,
      heights(y0, y1) { for (let py = y0; py < Math.min(Hh, y1); py++) for (let px = 0; px < W; px++) Hm[py * W + px] = fn((px + 0.5) / P, (py + 0.5) / P, 0); },
      shade(y0, y1) { S.lock(); for (let py = y0; py < Math.min(Hh, y1); py++) for (let px = 0; px < W; px++) { const xl = px > 0 ? px - 1 : (o.wrap ? W - 1 : 0), xr = px < W - 1 ? px + 1 : (o.wrap ? 0 : W - 1), yu = py > 0 ? py - 1 : (o.wrapY ? Hh - 1 : 0), yd = py < Hh - 1 ? py + 1 : (o.wrapY ? 0 : Hh - 1);
        const hx = (Hm[py * W + xr] - Hm[py * W + xl]) * kk, hy = (Hm[yd * W + px] - Hm[yu * W + px]) * kk;
        K.M0(); FA = 1; fn((px + 0.5) / P, (py + 0.5) / P, 1); if (FA <= 0.003) continue;
        let nx, ny, nz; if (o.face) { nx = -hx; ny = 1; nz = hy; } else { nx = -hx; ny = -hy; nz = 1; } const l = Math.hypot(nx, ny, nz); K.shade(nx / l, ny / l, nz / l); K.put(S, px, py, FA); } },
      finish() { S.unlock(); const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1; return cv; } };
    return F; }
  const FN = 6, WN = 4;
  /* ---- the floors (x, y in tiles inside the FN-square; mode 0 the height, 1 the material) ---- */
  // (v470 AE, 2nd pass: crisper relief and real light and shadow; the snow's own glow kept low on the floors so the relief reads)
  const floorSnow = (K, x, y, sd, blue, h) => { snowT(K, x, y, sd, blue); const M = K.M, hol = ss(0.03, -0.03, h); M.er *= 0.25; M.eg *= 0.25; M.eb *= 0.3; M.r *= 1 - hol * 0.3; M.g *= 1 - hol * 0.14; M.ao *= 1 - hol * 0.25; };
  // the Split Iceberg: wind-packed snow carved into sharp sastrugi (crested ridges running with the wind, their lee faces in blue
  // shadow), worn through in places to the glacier's blue ice: a clear skin over deep blue, white fracture planes and trapped
  // bubbles; frost flowers and rime sparkling on the snow
  function glacierFloor(x, y, mode) { const K = GK, M = K.M, n = pfbm(x * 5 / 6, y * 5 / 6, 5, 201), iceK = ss(0.6, 0.63, n + 0.1 * pvn(x * 3, y * 3, FN * 3, 203));
    const ph = x * Math.PI * 2 / 3 - y * Math.PI * 5 / 3 + pvn(x * 1.5, y * 1.5, FN * 1.5, 205) * 4.4, sw = (Math.sin(ph) + 1) / 2, crest = Math.pow(sw, 7), sas = crest * (0.6 + 0.4 * pvn(x * 0.5, y * 0.5, 3, 206));
    const fine = Math.pow(Math.abs(Math.sin(x * Math.PI * 4 - y * Math.PI * 10 + pvn(x * 3, y * 3, 18, 208) * 3)), 3) * 0.008;
    const cr = pcell(x * 4 / 3, y * 4 / 3, 8, 209), crack = iceK * ss(0.04, 0.008, cr.d2 - cr.d), rim = ss(0.6, 0.66, n + 0.1 * pvn(x * 3, y * 3, FN * 3, 203)) - iceK;
    const h = (0.09 * sas + 0.018 * pfbm(x * 2, y * 2, FN * 2, 207) + fine) * (1 - iceK) - 0.02 * iceK - 0.012 * crack + 0.025 * Math.max(0, rim);
    if (!mode) return h;
    if (iceK > 0.5) { const b = pvn(x * 9, y * 9, FN * 9, 211), bub = b > 0.82 ? (b - 0.82) * 4 : 0, deep = pvn(x * 2, y * 2, FN * 2, 213); M.r = 0.02; M.g = 0.04; M.b = 0.08; M.rg = 0.04; M.cc = 1; M.er = 0.02 + 0.1 * bub + 0.4 * crack; M.eg = 0.09 + 0.12 * bub + 0.5 * crack + 0.06 * deep; M.eb = 0.2 + 0.14 * bub + 0.55 * crack + 0.12 * deep; return h; }
    floorSnow(K, x, y, 215, 0.1, h - 0.045 * sas); M.ao *= 0.78 + 0.22 * (sw > 0.5 ? 1 : 0.6 + 0.8 * sw);
    if (iceK > 0.02) M.ao *= 1 - iceK * 0.6;
    const ff = pvn(x * 16, y * 16, FN * 16, 217); if (ff > 0.8) { M.cc = 0.9; M.rg = 0.1; M.eb += 0.05; }
    return h; }
  // the Observatory Ruins: courses of old dressed flagstones, each its own tone, bevelled, chipped at the corners, a few cracked;
  // brass meridian lines inlaid every three tiles with their hour ticks, star circles cut in some slabs and filled with brass;
  // rime in the joints, snow packed into them and lying in small crisp drifts against the slab edges
  function obsFloor(x, y, mode) { const K = GK, M = K.M, ci = Math.floor(y / 1.5), fy = y - ci * 1.5, cim = md(ci, 4), off2 = [0, 1, 0.5, 1.5][cim], xx = x + off2, si = Math.floor(xx / 2), fx = xx - si * 2, sid = md(si, 3) + cim * 3;
    const dj = Math.min(fx, 2 - fx, fy, 1.5 - fy), bev = ss(0, 0.05, dj), joint = ss(0.03, 0.01, dj), tone = hh(sid, 1, 301), tilt = (hh(sid, 2, 301) - 0.5) * 0.02 * (fx - 1) + (hh(sid, 3, 301) - 0.5) * 0.02 * (fy - 0.75);
    const cd = Math.min(Math.hypot(fx, fy), Math.hypot(2 - fx, fy), Math.hypot(fx, 1.5 - fy), Math.hypot(2 - fx, 1.5 - fy)), chip = hh(sid, 4, 301) < 0.6 ? ss(0.16, 0.1, cd + 0.04 * pvn(x * 9, y * 9, 54, 302)) : 0;
    const ccell = pcell(x * 2, y * 2, 12, 303), crk = hh(sid, 5, 301) < 0.35 ? ss(0.025, 0.006, ccell.d2 - ccell.d) : 0;
    const meri = md(x, FN) < 0.05 || Math.abs(md(x, FN) - 3) < 0.035, tick = meri && Math.abs(md(y, 0.5) - 0.25) < 0.03;
    const star = hh(sid, 6, 301) < 0.3, sr = Math.hypot(fx - 1, fy - 0.75), sring = star ? ss(0.022, 0.008, Math.abs(sr - 0.48)) + ss(0.016, 0.006, Math.abs(sr - 0.3)) * 0.8 : 0, ray = star && sr < 0.48 && sr > 0.06 ? ss(0.03, 0.008, Math.abs(Math.sin(Math.atan2(fy - 0.75, fx - 1) * 4)) * sr) : 0;
    const dfield = pfbm(x * 0.5 + 3, y * 0.5, 3, 305) + 0.12 * pvn(x * 3, y * 3, 18, 307), drift = ss(0.6, 0.615, dfield) * ss(0.0, 0.25, dj + 0.1);
    let h = 0.04 * bev + tilt + 0.006 * pvn(x * 6, y * 6, 36, 309) - 0.03 * chip - 0.012 * crk - 0.006 * (sring + ray); if (meri) h = 0.032; h = Math.max(h, drift * (0.06 + 0.02 * pvn(x * 2, y * 2, 12, 311)));
    if (!mode) return h;
    if (drift > 0.5) { floorSnow(K, x, y, 317, 0.15, h - 0.06); return h; }
    if (joint > 0.4) { const rime = pvn(x * 24, y * 24, FN * 24, 319); floorSnow(K, x, y, 317, 0.25, -0.05); M.ao *= 0.55 + 0.35 * rime; if (rime > 0.75) { M.cc = 0.9; M.rg = 0.12; } return h; }
    if ((meri && !drift) || sring + ray > 0.4) { brassM(K, 0, y * 9 + x, 1, 313, 0.75 + (tick ? 0.25 : 0)); M.cc = 0.45; return h; }
    stoneT(K, fx * 1.3 + sid * 3.1, y * 1.3, 315 + sid, 0.78 + 0.4 * tone, 0.18); M.ao *= 0.7 + 0.3 * bev; if (chip > 0.3) { M.ao *= 0.75; M.r *= 0.85; M.g *= 0.85; } if (crk > 0.3) M.ao *= 0.45;
    const fr = ss(0.12, 0.0, dj) * 0.5; if (fr > 0) { M.r = lerp(M.r, 0.72, fr); M.g = lerp(M.g, 0.78, fr); M.b = lerp(M.b, 0.86, fr); }
    return h; }
  // the Whiteout Summit: deep powder in long low dunes, crested by sharp sastrugi, scooped by the wind into shallow hollows
  // (blue in their shadow), rippled finely; a few dark stones half buried under caps of snow
  function whiteFloor(x, y, mode) { const K = GK, M = K.M, dn = pfbm(x / 3, y / 3, 2, 401) * 0.5 + pfbm(x / 2, y / 2, 3, 402) * 0.5;
    const ph = x * Math.PI * 2 / 3 + y * Math.PI * 4 / 3 + pvn(x * 5 / 6, y * 5 / 6, 5, 403) * 6, sw = (Math.sin(ph) + 1) / 2, crest = Math.pow(sw, 9) * ss(0.35, 0.6, dn);
    const rip = Math.pow(Math.abs(Math.sin(x * Math.PI * 4 + y * Math.PI * 12 + pvn(x * 2, y * 2, 12, 404) * 4)), 4);
    const sc = pcell(x * 2 / 3 + 0.3 * pvn(x, y, 6, 415), y * 2 / 3, 4, 413), scoop = hh(sc.id, 9, 414) < 0.3 ? ss(0.5, 0.15, sc.d) * (0.6 + 0.4 * pvn(x * 2, y * 2, 12, 416)) : 0;
    const stn = pcell(x * 5 / 6, y * 5 / 6, 5, 405), rock = hh(stn.id, 7, 407) < 0.14 ? ss(0.26, 0.1, stn.d + 0.06 * pvn(x * 6, y * 6, 36, 406)) : 0;
    const h = 0.07 * dn + 0.06 * crest + 0.006 * rip - 0.03 * scoop + 0.05 * rock;
    if (!mode) return h;
    if (rock > 0.35) { rockT(K, x, y, 409, 0.6); M.ao *= 0.8; const sn = ss(0.8, 0.45, rock) + ss(0.5, 0.75, wn(x, y, 6, 412)) * rock; if (sn > 0.02) { const M0 = { r: M.r, g: M.g, b: M.b, rg: M.rg }; floorSnow(K, x, y, 411, 0.1, h); for (const k in M0) M[k] = lerp(M0[k], M[k], clamp(sn, 0, 1)); } return h; }
    floorSnow(K, x, y, 411, 0.06 + 0.35 * scoop, h - 0.08 - 0.04 * scoop); M.ao *= (0.88 + 0.12 * rip) * (1 - 0.25 * scoop);
    return h; }
  /* ---- the walls' faces (x across, y down 0..h; mode as above) ---- */
  // glacier ice cliff: layered bands of blue ice, pale and dark, a cornice of snow at the top, icicle grooves
  function iceBank(Hb, L) { return (x, y, mode) => { const K = GK, M = K.M, band = pvn(x * 0.5, y * 7 + pvn(x * 1.5, 0, WN * 1.5, 503) * 1.5, 2, 501), groove = Math.pow(Math.abs(Math.sin(x * Math.PI * 3 + pvn(x * 3, y * 2, WN * 3, 505) * 2)), 6);
    const cor = ss(0.16, 0.05, y + 0.05 * pvn(x * 4, 0, WN * 4, 507)), h = 0.04 * band + 0.02 * groove + 0.06 * cor;
    if (!mode) return h;
    if (cor > 0.5) { snowT(K, x, y, 509, 0.15); return h; }
    M.r = 0.04; M.g = 0.07; M.b = 0.11; M.rg = 0.1; M.cc = 0.9; const k = 0.3 + 0.6 * band, tint = TINT[L] || TINT.glacier, refr = Math.pow(Math.max(0, Math.sin(y * 34 + band * 6 + x * 0.8)), 18) * 0.6 + groove * 0.25; M.er = (0.04 + 0.16 * k + refr * 0.5) * tint[0]; M.eg = (0.1 + 0.3 * k + refr * 0.55) * tint[1]; M.eb = (0.18 + 0.44 * k + refr * 0.6) * tint[2]; /* (strata, and thin bright planes where the ice refracts the light) */
    const fr = ss(0.6, 0.8, pvn(x * 3, y * 5, WN * 3, 511)) * 0.6 + ss(0.35, 0.18, y) * 0.3; if (fr > 0) { M.r = lerp(M.r, 0.75, fr); M.g = lerp(M.g, 0.82, fr); M.b = lerp(M.b, 0.9, fr); M.rg = lerp(M.rg, 0.7, fr); }
    M.ao *= 0.75 + 0.25 * ss(Hb, 0, y) ; return h; }; }
  // observatory masonry: courses of dressed blocks, frost in the joints, snow along each ledge
  function stoneBank(Hb) { return (x, y, mode) => { const K = GK, M = K.M, ci = Math.floor(y / 0.18), fy = y - ci * 0.18, xx = x + (ci % 2) * 0.4, si = Math.floor(xx / 0.8), fx = xx - si * 0.8, dj = Math.min(fx, 0.8 - fx, fy, 0.18 - fy), j = ss(0.016, 0.004, dj);
    const ledge = ss(0.06, 0.02, y), h = 0.02 * ss(0, 0.02, dj) + 0.04 * ledge;
    if (!mode) return h;
    if (ledge > 0.5) { snowT(K, x, y, 521, 0); return h; }
    const sw = md(si, 5); stoneT(K, fx + sw * 2.3, y + ci, 523 + sw, 0.85 + 0.25 * hh(sw, ci, 525), 0.35); if (j > 0.3) { M.ao *= 0.5; const f = 0.6; M.r = lerp(M.r, 0.7, f * j); M.g = lerp(M.g, 0.76, f * j); M.b = lerp(M.b, 0.84, f * j); } M.ao *= 0.72 + 0.28 * ss(Hb, 0, y); return h; }; }
  // the wall tops: a cap of snow, wind-rippled, sparkling (stone peeking through on the observatory's)
  function capRoof(stone) { return (x, y, mode) => { const K = GK, M = K.M, rip = Math.pow(Math.abs(Math.sin(x * Math.PI - y * Math.PI * 2 + pvn(x * 1.25, y * 1.25, 5, 601) * 6)), 4), sk = stone ? ss(0.62, 0.7, pfbm(x * 0.75, y * 0.75, 3, 603)) : 0;
    const h = 0.03 * rip + 0.02 * pvn(x * 3, y * 3, WN * 3, 605) - 0.03 * sk;
    if (!mode) return h;
    if (sk > 0.5) stoneT(K, x, y, 607, 1, 0.4); else { snowT(K, x, y, 609, 0.08); M.ao *= 0.9 + 0.1 * rip; } return h; }; }
  // the face over the drop: the glacier's blue heart in strata, darker deeper, long icicle flutes; the observatory's
  // foundation blocks give way to ice below
  function iceCliff(L, stoneTop) { return (x, y, mode) => { const K = GK, M = K.M, st = pvn(x * 0.5, y * 3.2 + pvn(x * 1.25, y, 5, 703) * 1.2, 2, 701), flute = Math.pow(Math.abs(Math.sin(x * Math.PI * 2.5 + pvn(x * 2, y * 0.8, 8, 705) * 2.5)), 5);
    const stone = stoneTop ? ss(0.48, 0.42, y + 0.05 * pvn(x * 3, 0, WN * 3, 707)) : 0, lip = ss(0.07, 0.02, y), h = 0.05 * st + 0.03 * flute + 0.03 * stone + 0.05 * lip;
    if (!mode) return h;
    FA = ss(1.25, 0.95, y + 0.12 * flute);
    if (lip > 0.5) { snowT(K, x, y, 709, 0.15); return h; }
    if (stone > 0.5) { const ci = Math.floor(y / 0.16), xx = x + (ci % 2) * 0.4, fx = md(xx, 0.8), dj = Math.min(fx, 0.8 - fx, md(y, 0.16), 0.16 - md(y, 0.16)); stoneT(K, x, y, 711 + md(Math.floor(xx / 0.8), 5), 0.75, 0.4); if (dj < 0.01) M.ao *= 0.5; M.ao *= 0.8; return h; }
    const tint = TINT[L] || TINT.glacier, k = (0.3 + 0.6 * st) * (1 - 0.55 * ss(0.2, 1.2, y)), band = Math.pow(Math.max(0, Math.sin(y * 22 + st * 5)), 14) * 0.55, edge = Math.pow(flute, 3) * 0.5; M.r = 0.03; M.g = 0.05; M.b = 0.09; M.rg = 0.08; M.cc = 0.95;
    M.er = (0.03 + 0.2 * k + (band + edge) * 0.45 * (1 - y * 0.6)) * tint[0]; M.eg = (0.08 + 0.34 * k + (band + edge) * 0.5 * (1 - y * 0.6)) * tint[1]; M.eb = (0.16 + 0.5 * k + (band + edge) * 0.55 * (1 - y * 0.6)) * tint[2]; /* (strata, the flutes' bright edges, refraction bands) */ M.ao *= 1 - 0.5 * ss(0.3, 1.2, y); return h; }; }
  // the ice bridges: thick planks of clear blue ice laid across, frosted along their edges, snow packed in the seams
  function iceBridge(L) { return (x, y, mode) => { const K = GK, M = K.M, pl = md(x, 0.5), seam = ss(0.03, 0.008, Math.min(pl, 0.5 - pl)), edge = 0, w = pvn(x * 3, y * 3, 6, 801);   // (no rim in the texture: the frosted rim is laid only along the bridge's own sides, landBridge)
    const h = 0.03 * ss(0, 0.04, Math.min(pl, 0.5 - pl)) + 0.01 * w + 0.02 * edge;
    if (!mode) return h;
    if (seam > 0.4 || edge > 0.6) { snowT(K, x, y, 803, 0.12); return h; }
    const tint = TINT[L] || TINT.glacier; M.r = 0.04; M.g = 0.07; M.b = 0.11; M.rg = 0.05; M.cc = 1; M.er = (0.06 + 0.16 * w) * tint[0] + 0.06; M.eg = (0.16 + 0.24 * w) * tint[1] + 0.08; M.eb = (0.3 + 0.3 * w) * tint[2] + 0.1;
    const cr = ss(0.015, 0, Math.abs(pvn(x * 4, y * 4, 8, 805) - 0.5)); if (cr > 0) { M.er += cr * 0.5; M.eg += cr * 0.55; M.eb += cr * 0.6; } return h; }; }
  // the bridge's underside: the slab's dark edge, then icicles hanging into the drop
  function iceUnder(L) { return (x, y, mode) => { const K = GK, M = K.M, n = md(x, 0.25) / 0.25, l = 0.25 + 0.75 * hh(Math.floor(x / 0.25), 3, 901), cx = Math.abs(n - 0.5) * 2, len = l * 0.9, inI = y > 0.14 && (y - 0.14) < len * (1 - cx * cx * 1.6);
    if (y < 0.14) { if (!mode) return 0.02; FA = 1; M.r = 0.05; M.g = 0.09; M.b = 0.15; M.cc = 0.7; M.rg = 0.2; const tint = TINT[L] || TINT.glacier; M.er = 0.08 * tint[0]; M.eg = 0.16 * tint[1]; M.eb = 0.28 * tint[2]; M.ao = 0.7; return 0.02; }
    if (!inI) { FA = 0; return 0; } if (!mode) return 0.03 * (1 - cx); FA = clamp(((len * (1 - cx * cx * 1.6)) - (y - 0.14)) * 40, 0, 1) * 0.95; const tint = TINT[L] || TINT.glacier, k = 1 - (y - 0.14) / Math.max(0.05, len);
    M.r = 0.05; M.g = 0.08; M.b = 0.12; M.rg = 0.05; M.cc = 1; M.er = (0.12 + 0.3 * (1 - k)) * tint[0]; M.eg = (0.22 + 0.4 * (1 - k)) * tint[1]; M.eb = (0.36 + 0.5 * (1 - k)) * tint[2]; return 0.03 * (1 - cx); }; }
  const TDEF = {};
  for (const [L, fl, bank, roofStone, cliffStone] of [['glacier', () => glacierFloor, H => iceBank(H, 'glacier'), false, false], ['obs', () => obsFloor, H => stoneBank(H), true, true], ['white', () => whiteFloor, H => iceBank(H, 'white'), false, false]]) {
    TDEF['floor:' + L] = { w: FN, h: FN, L, fn: fl, o: { wrap: true, wrapY: true, bump: L === 'white' ? 2.6 : 2.2 } };
    TDEF['bank:' + L] = { w: WN, h: 0.55, L, fn: () => bank(0.55), o: { wrap: true, face: true, bump: 2.2 } };
    TDEF['roof:' + L] = { w: WN, h: WN, L, fn: () => capRoof(roofStone), o: { wrap: true, wrapY: true, bump: 1.2 } };
    TDEF['cliff:' + L] = { w: WN, h: 1.25, L, fn: () => iceCliff(L, cliffStone), o: { wrap: true, face: true, bump: 2.4 } };
    TDEF['bridge:' + L] = { w: 2, h: 1, L, fn: () => iceBridge(L), o: { wrap: true, bump: 1.2 } };
    TDEF['bunder:' + L] = { w: 2, h: 1.1, L, fn: () => iceUnder(L), o: { wrap: true, face: true } }; }
  function texJobs(name, P) { const B = BP(), D = TDEF[name]; if (!B || !D) return []; P = Math.max(8, Math.min(TCAP, Math.round(P))); const key = name + '|' + P; if (TEX.has(key)) return [];
    const K = B.kit; let F = null, t0 = 0; const run = f => () => { if (TEX.has(key)) return; try { GK = K; DOM = D.w; lit(K, D.L, f); } catch (e) { F = null; } GK = null; }, jobs = [];
    jobs.push(run(() => { t0 = now(); F = fieldBegin(K, D.w, D.h, P, D.fn(), D.o); }));
    const H = Math.ceil(D.h * P), n = Math.max(1, Math.ceil(D.w * P * H / 24000)), band2 = Math.ceil(H / n);
    for (let i = 0; i < n; i++) jobs.push(run(() => { if (F) F.heights(i * band2, (i + 1) * band2); }));
    for (let i = 0; i < n; i++) jobs.push(run(() => { if (F) F.shade(i * band2, (i + 1) * band2); }));
    jobs.push(run(() => { if (!F) return; const cv = F.finish(); F = null; if (!texOK(name, cv)) return; TEX.set(key, { cv, P }); STATS.tex++; STATS.texMs += now() - t0; }));
    return jobs; }
  function tex(name, P) { const B = BP(), D = TDEF[name]; if (!B || !D) return null; P = Math.max(8, Math.min(TCAP, Math.round(P))); const key = name + '|' + P; let t = TEX.get(key); if (t) return t;
    // (a sharper or softer one already made serves until this one is made: never a frame of the old art in between)
    if (TBASE) { const t2 = TEX.get(name + '|' + TBASE); if (t2) return t2; }
    const t0 = now(), K = B.kit; let cv = null; try { GK = K; DOM = D.w; lit(K, D.L, () => { const F = fieldBegin(K, D.w, D.h, P, D.fn(), D.o); F.heights(0, F.Hh); F.shade(0, F.Hh); cv = F.finish(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('AUR_PROPS tex', name, e); cv = null; } GK = null;
    if (!cv || !texOK(name, cv)) return null; t = { cv, P }; TEX.set(key, t); STATS.tex++; STATS.texMs += now() - t0; return t; }
  const EMPTY = {};
  const texOK = (name, cv) => { if (!/^(floor|roof|bank)/.test(name)) return true; try { const d = cv.getContext('2d', { willReadFrequently: true }).getImageData(cv.width >> 1, cv.height >> 1, 1, 1).data; if (d[3] > 0) return true; } catch (e) { return true; } STATS.empty++; EMPTY[name] = (EMPTY[name] || 0) + 1; return EMPTY[name] > 2; };

  /* ======================= the lands: each biome's own floor, walls, wall tops, cliffs, bridges ======================= */
  const LN_OF = { glacier: 'glacier', observatory: 'obs', whiteout: 'white' };
  // world-space washes (continuous across tiles): soft pools of the land's light laid over the floor
  const WASH = { glacier: [['10,24,52', 0.07, 0.25], ['120,215,178', 0.035, 0.35]],   // (v470 AE 2nd pass: subtle: large soft washes read as fog)
    observatory: [['6,14,30', 0.06, 0.25], ['120,215,178', 0.04, 0.4]],
    whiteout: [['110,150,195', 0.05, 0.3], ['255,214,160', 0.025, 0.36]] };
  const EDGE = { glacier: '8,18,40', observatory: '6,12,28', whiteout: '120,150,180' };
  function washes(c, X, Y, T, x, y, list) { const G = 3.4;
    for (let gy = Math.floor((y - 3) / G); gy <= Math.floor((y + 4) / G); gy++) for (let gx = Math.floor((x - 3) / G); gx <= Math.floor((x + 4) / G); gx++) { const kind = hh(gx, gy, 141); let col = null, a = 0;
      for (const [cc, aa, upto] of list) if (kind < upto) { col = cc; a = aa * (0.7 + 0.6 * hh(gx, gy, 143)); break; } if (!col) continue;
      const cx = (gx + hh(gx, gy, 153)) * G, cy = (gy + hh(gx, gy, 159)) * G, rr = 1 + hh(gx, gy, 161) * 1.9; if (cx + rr < x || cx - rr > x + 1 || cy + rr * 0.8 < y || cy - rr * 0.8 > y + 1) continue;
      const px = X + (cx - x) * T, py = Y + (cy - y) * T; c.save(); c.translate(px, py); c.scale(1, 0.75); const g = c.createRadialGradient(0, 0, 0, 0, 0, rr * T); g.addColorStop(0, `rgba(${col},${a.toFixed(3)})`); g.addColorStop(0.6, `rgba(${col},${(a * 0.5).toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rr * T, 0, TAU); c.fill(); c.restore(); } }
  function landFloor(bio) { const L = LN_OF[bio]; return function (c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE, isWall) { const t = tex('floor:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    c.drawImage(t.cv, md(x, FN) * P, md(y, FN) * P, P, P, X, Y, T + 0.02, T + 0.02); STATS.land++;
    washes(c, X, Y, T, x, y, WASH[bio]);
    // drifts of snow banked against the wall above (soft, from the wall's foot)
    if (typeof isWall === 'function' && isWall(x, y - 1)) { const dr = (cx, cy, rx, ry, a) => { c.save(); c.translate(cx, cy); c.scale(1, ry / rx); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(244,250,255,${a})`); g.addColorStop(0.6, `rgba(244,250,255,${a * 0.5})`); g.addColorStop(1, 'rgba(244,250,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore(); };
      for (let k = 0; k < 2; k++) dr(X + T * (0.2 + k * 0.55 + (hh(x, y, 170 + k) - 0.5) * 0.2), Y + T * 0.02, T * (0.3 + hh(x, y, 180 + k) * 0.2), T * (0.16 + hh(x, y, 190 + k) * 0.12), bio === 'whiteout' ? 0.35 : 0.5); }
    const ec = EDGE[bio], side = (x0, y0, x1, y1, w, hh2) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(${ec},.45)`); g.addColorStop(0.5, `rgba(${ec},.12)`); g.addColorStop(1, `rgba(${ec},0)`); c.fillStyle = g; c.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, hh2); };
    if (gN) side(X, Y, X, Y + T * 0.5, T, T * 0.5); if (gS) side(X, Y + T, X, Y + T * 0.55, T, T * 0.45); if (gW) side(X, Y, X + T * 0.45, Y, T * 0.45, T); if (gE) side(X + T, Y, X + T * 0.55, Y, T * 0.45, T); c.restore(); }; }
  function landWall(bio) { const L = LN_OF[bio]; return function (c, X, Y, T, H, h, x) { const t = tex('bank:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, WN) * P, 0, P, t.cv.height, X, Y, T + 0.5, H);
    const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, `rgba(${EDGE[bio]},0)`); g.addColorStop(1, `rgba(${EDGE[bio]},.3)`); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H); }; }
  function landRoof(bio) { const L = LN_OF[bio]; return function (c, X, Y, T, x, y, isWall) { const t = tex('roof:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, WN) * P, md(y, WN) * P, P, P, X, Y, T + 0.5, T + 0.5);
    if (!isWall(x, y - 1)) { c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(X, Y, T + 0.5, Math.max(1, T * 0.05)); }
    if (!isWall(x - 1, y)) { c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(X, Y, Math.max(1, T * 0.05), T); } if (!isWall(x + 1, y)) { c.fillStyle = 'rgba(20,40,80,.2)'; c.fillRect(X + T * 0.94, Y, T * 0.06, T); } }; }
  function landCliff(bio) { const L = LN_OF[bio]; return function (c, x, y, X, Y, T, lw, B, isGap) { const t = tex('cliff:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    const rr = B && B.out ? T * 0.38 : 0, l = isGap && isGap(x - 1, y) ? rr : 0, r = isGap && isGap(x + 1, y) ? rr : 0, sx = md(x, WN) * P, k = P / T;
    c.save(); if (l || r) { c.beginPath(); c.moveTo(X + l, Y - 1); c.lineTo(X + T - r, Y - 1); c.lineTo(X + T - r * 0.6, Y + T * 1.3); c.lineTo(X + l * 0.6, Y + T * 1.3); c.closePath(); c.clip(); }
    c.drawImage(t.cv, sx, 0, P, t.cv.height, X, Y - T * 0.02, T, t.cv.height / k); c.restore(); }; }
  function landBridge(bio) { const L = LN_OF[bio]; return function (c, x, y, X, Y, T, isGap, tt) { const t = tex('bridge:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y), TB = typeof T_BRIDGE !== 'undefined' ? T_BRIDGE : -1;
    const run = (dx, dy) => { let n = 0; for (const s of [-1, 1]) for (let k = 1; k <= 6 && tt(x + dx * k * s, y + dy * k * s) === TB; k++) n++; return n; };
    const horiz = gNS && !gWE ? true : gWE && !gNS ? false : run(1, 0) >= run(0, 1);
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0); c.drawImage(t.cv, md(horiz ? x : y, 2) * P, 0, P, P, 0, 0, T + 0.02, T + 0.02);
    // the frosted rim along the bridge's open sides only (continuous along it: never a square per tile)
    const rim = (open, y0, y1) => { if (!open) return; const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(236,246,252,.88)'); g.addColorStop(0.35, 'rgba(220,238,250,.42)'); g.addColorStop(1, 'rgba(220,238,250,0)'); c.fillStyle = g; c.fillRect(0, Math.min(y0, y1), T + 0.02, Math.abs(y1 - y0)); };
    if (horiz) { rim(isGap(x, y - 1), 0, T * 0.2); rim(isGap(x, y + 1), T, T * 0.8); } else { rim(isGap(x - 1, y), 0, T * 0.2); rim(isGap(x + 1, y), T, T * 0.8); }
    c.restore(); }; }
  function landBridgeEdge(bio) { const L = LN_OF[bio]; return function (c, x, y, X, Y, T) { const t = tex('bunder:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, 2) * P, 0, P, t.cv.height, X, Y - T * 0.02, T + 0.02, t.cv.height * T / P); }; }

  /* ======================= the engine's props and the lands: installed ======================= */
  const OLD = {};
  const LANDS_P = { glacier: { props: ['icetree', 'icewedge', 'icetree', 'snowrock', 'frozenvane', 'snowhill', 'icetree', 'icewedge', 'snowrock'], propN: [7, 4], edge: ['icewedge', 'snowrock', 'snowhill', 'icetree', 'icewedge'], rim: 0.16 },
    observatory: { props: ['obsarch', 'telescope', 'icetree', 'obsarch', 'snowrock', 'icewedge', 'stonearch', 'snowrock'], propN: [6, 4], edge: ['obsarch', 'snowrock', 'stonearch', 'icewedge', 'snowrock'], rim: 0.15 },
    whiteout: { props: ['icetree', 'stonearch', 'snowhill', 'icetree', 'snowrock', 'snowhill', 'icewedge'], propN: [6, 3], edge: ['snowhill', 'snowrock', 'icewedge', 'snowhill'], rim: 0.14 } };
  // props in clusters along the rooms' rims too (as v463 SE's dressing): only where the room stays connected
  const dressFn = (EDGE2, rate) => ({ rm, i, G, RM, props, R, id, MW, walk, okFeature, first }) => { const TS0 = typeof T_SOLID !== 'undefined' ? T_SOLID : null; if (TS0 == null || first) return;
    const cells = []; for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) { const k = id(x, y); if (RM[k] === i && walk(k)) cells.push(k); }
    if (cells.length < 24) return;
    const rim = cells.filter(k => { const x = k % MW, y = (k / MW) | 0; return okFeature(x, y, i) && [1, -1, MW, -MW].some(d => G[k + d] === TS0 && !props.has(k + d)); });
    const connected = () => { const open = cells.filter(k => walk(k)); if (!open.length) return true; const seen = new Set([open[0]]), q = [open[0]];
      for (let h = 0; h < q.length; h++) for (const d of [1, -1, MW, -MW]) { const kk = q[h] + d; if (!seen.has(kk) && RM[kk] === i && walk(kk)) { seen.add(kk); q.push(kk); } }
      return seen.size >= open.length; };
    let want = Math.round(rim.length * rate), tries = 0;
    while (want > 0 && rim.length && tries++ < 140) { const j = Math.floor(R() * rim.length), k = rim[j]; rim.splice(j, 1);
      if ([1, -1, MW, -MW].filter(d => props.has(k + d)).length > 1) continue;
      const was = G[k]; G[k] = TS0; if (!connected()) { G[k] = was; continue; } props.set(k, EDGE2[Math.floor(R() * EDGE2.length)]); want--; } };
  const FLOORC = { glacier: ['#D6E2EA', '#CFDCE5', '#DCE6EE'], observatory: ['#5A6880', '#566478', '#606E86'], whiteout: ['#EEF4F8', '#E8F0F5', '#F3F8FA'] };
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS, EXT = (HAS_W && (window.PROP_EXT = window.PROP_EXT || {})) || {};
    for (const k of KINDS) { if (!PR[k] || PR[k].__aurp) continue; const old = OLD[k] = PR[k];
      const f = function (c, P, v, B) { const bio = bioOf(B); if (!bio || off()) return old.apply(this, arguments); const L = BIO_L[bio], vv = (v | 0) % 4, s = sprite(k, vv % 2, Math.max(8, Math.min(CAP, Math.round(P))), true, L); if (!s) return old.apply(this, arguments);
        const q = P / s.P; c.save(); if (vv >= 2) c.scale(-1, 1); c.drawImage(s.cv, -s.ax * q, -s.ay * q, s.cv.width * q, s.cv.height * q); c.restore(); };
      f.__aurp = 1; PR[k] = f;
      let b = [0, 0, 0, 0]; for (let v = 0; v < 2; v++) { const q = DEF[k].box(v); b = [Math.min(b[0], q[0]), Math.min(b[1], q[1]), Math.max(b[2], q[2]), Math.max(b[3], q[3])]; }
      const E = EXT[k] || [2.4, 2.9]; EXT[k] = [Math.max(E[0], Math.max(-b[0], b[2]) * 2 - 1.6 + 0.1), Math.max(E[1], -b[1] - 0.25 + 0.1)]; }
    if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) for (const k of KINDS) BREAK_FX.KIND[k] = Object.assign({}, BREAK_FX.KIND[k] || {}, DEF[k].mat);
    if (typeof PROP_EL !== 'undefined') for (const k of KINDS) PROP_EL[k] = DEF[k].el;
    for (const bio of ['glacier', 'observatory', 'whiteout']) { const B = typeof BIOMES !== 'undefined' && BIOMES[bio]; if (!B || B.__aurp) continue; B.__aurp = 1;
      const fns = { floorFn: landFloor(bio), wallFn: landWall(bio), roofFn: landRoof(bio), cliffTint: landCliff(bio), bridgeFn: landBridge(bio), bridgeEdge: landBridgeEdge(bio), floorUnder: true };
      { const Ld = Object.assign({ dress: dressFn(LANDS_P[bio].edge, LANDS_P[bio].rim) }, LANDS_P[bio]), old = { props: B.props, propN: B.propN, dress: B.dress }; for (const n of ['props', 'propN', 'dress']) Object.defineProperty(B, n, { configurable: true, enumerable: true, get: () => (BP() ? Ld[n] : old[n]), set: v2 => { old[n] = v2; } }); }   // (more of the remade props in each land; the old lists whenever the painter is off)
      { let oldF = B.floor; const F2 = FLOORC[bio]; Object.defineProperty(B, 'floor', { configurable: true, enumerable: true, get: () => (BP() ? F2 : oldF), set: v2 => { oldF = v2; } }); }
      for (const n in fns) { OLD[bio + ':' + n] = B[n]; Object.defineProperty(B, n, { configurable: true, enumerable: true, get: () => (BP() ? fns[n] : OLD[bio + ':' + n]), set: v2 => { OLD[bio + ':' + n] = v2; } }); } } }
  install();

  /* ======================= release, warm-up ======================= */
  function release(keepTex) { CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); if (!keepTex) { BURSTS.length = 0; TEX.forEach(t => { if (t && t.cv) t.cv.width = t.cv.height = 1; }); TEX.clear(); BASE = 0; TBASE = 0; } }
  function hookRelease() { try { if (typeof DunWorld === 'undefined' || !DunWorld.dropProps || DunWorld.dropProps.__aurp) return; const od = DunWorld.dropProps; const f = function () { try { return od.apply(this, arguments); } finally { release(); LIVE = null; } }; for (const k in od) f[k] = od[k]; f.__aurp = 1; DunWorld.dropProps = f; } catch (e) {} }
  hookRelease();
  const PIECES_OF = [];   // [stage name pattern, [[name, v], ...]] (20s6d2 adds the trials' pieces)
  function warm(P) { if (!BP() || !P || !(P.T > 0)) return []; const S2 = P.S || {}, F = P.F || {}; if (S2.kind === 'boss' || F.fiend || !LN_OF[F.biome]) return [];
    const k = P.k || 1, PB = Math.min(CAP, Math.round(P.T * k)), PT = Math.min(TCAP, Math.round(P.T * k)); BASE = PB; TBASE = PT; const L = LN_OF[F.biome], jobs = [], job = f => jobs.push(() => { try { f(); } catch (e) {} });
    for (const n of ['floor', 'bank', 'roof', 'cliff', 'bridge', 'bunder']) for (const j of texJobs(n + ':' + L, PT)) jobs.push(j);
    const B = typeof BIOMES !== 'undefined' && BIOMES[F.biome]; if (B && B.props) for (const kd of new Set(B.props)) if (DEF[kd]) for (let v = 0; v < 2; v++) job(() => sprite(kd, v, PB, true, L));
    const n = S2.name || ''; for (const [re, list] of PIECES_OF) if (re.test(n)) for (const [nm, v] of list) job(() => sprite(nm, v, PB, true, L));
    return jobs; }

  /* ======================= breaking them =======================
     The props stand on what was a room's floor, so a break only gives back floor inside its room. The engine breaks them (20l):
     the tile turns to floor (the land's own floor painted under props too: floorUnder) and BREAK_FX shatters the picture in its
     material. Here: the hit points (the big ones take more), each kind's debris (snow, ice shards and their light, granite
     grit, stone chips, brass) and a feathered GPU burst; lowFx: fewer pieces, no ring. Every burst ends within 1.6 s. */
  const DEBRIS = { snowrock: { col: '#E8F4FF', dust: '#C8DCEA', n: [['rock', '#3A4458', 10], ['shard', '#F4FAFF', 8], ['smoke', 'rgba(232,242,250,', 5]] },
    snowhill: { col: '#FFFFFF', dust: '#DDEAF2', n: [['shard', '#FFFFFF', 12], ['rock', '#3A4458', 3], ['smoke', 'rgba(240,248,255,', 7]] },
    icewedge: { col: ICE_HI, dust: '#9FD8FF', n: [['shard', '#BFE4FF', 14], ['spark', '#FFFFFF', 10], ['smoke', 'rgba(220,240,255,', 4]] },
    frozenvane: { col: GREEN_HI, dust: '#6A7890', n: [['shard', '#5A6678', 10], ['spark', GREEN_HI, 6], ['smoke', 'rgba(200,214,230,', 3]] },
    obsarch: { col: '#DDE6EE', dust: '#6A7890', n: [['rock', '#6A7890', 14], ['shard', '#F4FAFF', 6], ['smoke', 'rgba(150,164,184,', 6]] },
    telescope: { col: '#FFE9B0', dust: '#6A7890', n: [['shard', '#C9A24A', 10], ['shard', '#9FD8FF', 6], ['spark', '#FFE9B0', 8], ['smoke', 'rgba(150,164,184,', 4]] },
    stonearch: { col: '#C8D4E2', dust: '#3A4458', n: [['rock', '#3A4458', 14], ['shard', '#F4FAFF', 6], ['smoke', 'rgba(110,124,144,', 5]] },
    icetree: { col: GREEN_HI, dust: '#9FD8FF', n: [['shard', '#BFE4FF', 18], ['spark', '#FFFFFF', 12], ['spore', GREEN_HI, 8], ['smoke', 'rgba(220,240,255,', 4]] } };
  const HPK = {}; for (const k of KINDS) HPK[k] = DEF[k].hp;
  const BURSTS = [];
  function aurBreak(X, p) { const D = DEBRIS[p.kind]; if (!D || !X || !X.part) return; STATS.breaks++; const lf = lowFx(), k = lf ? 0.5 : 1, R = Math.random, h = Math.max(0.6, -(DEF[p.kind].box(0)[1]) * 0.45);
    for (const [kind, col, n] of D.n) for (let i = 0; i < Math.round(n * k); i++) { const a = R() * TAU, v = 1.5 + R() * 3.5, x = p.x + (R() - 0.5) * 0.8, y = p.y - 0.2 - R() * h;
      if (kind === 'smoke') X.part({ kind: 'smoke', x, y: p.y - 0.3, vx: (R() - 0.5) * 0.8, vy: -0.4 - R() * 0.4, life: 1.1, max: 1.1, size: 0.5 + R() * 0.35, color: col });
      else if (kind === 'spore') X.part({ kind: 'glow', x, y, vx: Math.cos(a) * v * 0.3, vy: -0.6 - R() * 0.8, drag: 1, life: 1.2, max: 1.2, size: 0.1 + R() * 0.08, color: col });
      else X.part({ kind: kind === 'rock' ? 'shard' : kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, g: kind === 'spark' ? 3 : 9, life: 0.7 + R() * 0.4, max: 1.1, size: 3 + R() * 3, rot: R() * 6, vr: (R() - 0.5) * 12, color: col }); }
    if (BURSTS.length < 24) BURSTS.push({ x: p.x, y: p.y, h, col: D.col, dust: D.dust, t: 0, life: 1.6, X }); }
  function burstsTick(dt) { for (let i = BURSTS.length - 1; i >= 0; i--) { BURSTS[i].t += dt; if (BURSTS[i].t >= BURSTS[i].life) BURSTS.splice(i, 1); } }
  function burstsDraw(Q, X) { if (!BURSTS.length) return; const T = X.Tz(), lf = lowFx();
    for (const b of BURSTS) { if (b.X !== X) continue; const u = b.t / b.life, Xs = X.sx(b.x), Ys = X.sy(b.y), f = Math.pow(1 - u, 1.6);
      Q.glow(Xs, Ys - T * b.h * 0.6, T * (1.1 + b.h * 0.8) * (0.6 + u * 0.8), b.col, 0.34 * f); Q.glow(Xs, Ys, T * (1.6 + u * 1.7), b.dust, 0.2 * f, 0.4);
      if (!lf) Q.ring(Xs, Ys, T * (0.5 + u * 2.2), b.col, 0.24 * f, T * 0.35 * (1 - u * 0.5), 0.45); } }
  function hookBreak() { try { if (typeof BREAK_FX === 'undefined' || !BREAK_FX.prop || BREAK_FX.prop.__aurp) return; const op = BREAK_FX.prop; const f = function (Xa, p) { const r = op.apply(this, arguments); try { if (p && DEBRIS[p.kind] && BIO_L[p.biome] && !off()) aurBreak(Xa, p); } catch (e) {} return r; }; for (const k in op) f[k] = op[k]; f.__aurp = 1; BREAK_FX.prop = f; } catch (e) {} }
  hookBreak();
  const toughen = props => { for (const p of props || []) if (HPK[p.kind] && BIO_L[p.biome] && !p.aurHp && !p.broken) { p.aurHp = 1; p.hp = Math.max(p.hp || 0, HPK[p.kind]); } };

  /* ======================= the light (GPU): props' glows, the trials' queued light, rime motes ======================= */
  // where each prop's live lights are (tiles from its feet; v 0..1, mirrored for 2..3): [dx, dy, r, colour, kind]
  function glowsOf(kind, v, L) { const vv = (v | 0) % 2, m = (v | 0) % 4 >= 2 ? -1 : 1, out = [];
    if (kind === 'icetree') { const tips = DEF.icetree.tips[vv + '|' + L] || []; for (const [x, y] of tips) out.push([x * m, y, 0.12, '#FFFFFF', 'tip']); out.push([0, -2.4, 1.1, L === 'white' ? '#BFE4FF' : GREEN, 'crys']); }
    else if (kind === 'frozenvane') out.push([0, -2.0, 0.07, GREEN_HI, 'eye']);
    else if (kind === 'telescope') { const a = 0.95, dx = Math.sin(a) * (vv ? -1 : 1) * m, dy = -Math.cos(a), ex = dx * 1.72, ey = -1.3 + dy * 1.72; out.push([ex, ey, 0.2, '#9FD8FF', 'lens']); }
    else if (kind === 'icewedge') out.push([0.12 * (vv ? -1 : 1) * m, -1.0, 0.7, '#9FD8FF', 'crys'], [(0.12 + 0.22 * 2.0) * (vv ? -1 : 1) * m, -1.86, 0.1, '#FFFFFF', 'tip']);
    else if (kind === 'obsarch' && !vv) out.push([0, -3.13, 0.1, '#FFE9B0', 'tip']);
    else if (kind === 'snowhill' || kind === 'snowrock') out.push([-0.3 * m, kind === 'snowhill' ? -1.4 : -1.1, 0.08, '#FFFFFF', 'tip']);
    return out; }
  const gpu = c => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__AURP_GL === 0)) return null; const NM = HAS_W ? window.NIDHOGG_MOVES : null, F = NM && NM.FGFX; if (!F || !F.usable()) return null; return { F, Q: F.begin(c, null) }; } catch (e) { return null; } };
  const gpuEnd = (c, G) => { if (G) try { G.F.flush(c); } catch (e) {} };
  const gpuOK = () => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__AURP_GL === 0)) return false; const NM = HAS_W ? window.NIDHOGG_MOVES : null; return !!(NM && NM.FGFX && NM.FGFX.usable()); } catch (e) { return false; } };
  const QL = [], QO = []; let LIVE = null;
  const ql = (fn, a, b, c2, d, e, f, g2, h, i, j, k, l) => { if (QL.length < 500) QL.push([fn, a, b, c2, d, e, f, g2, h, i, j, k, l]); };
  const qo = (fn, a, b, c2, d, e, f, g2, h, i, j, k, l) => { if (QO.length < 500) QO.push([fn, a, b, c2, d, e, f, g2, h, i, j, k, l]); };   // (light over the actors: the drawOver pass)
  function qFlush(Q, list) { for (const q of list) { try { Q[q[0]](q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], q[9], q[10], q[11], q[12]); } catch (e) {} } list.length = 0; }
  const ready = X => !!(X && LIVE && LIVE.X === X && !off() && BP() && gpuOK());
  function lights(X) { const F = X.F || {}, bio = BIO_L[F.biome] ? F.biome : 'glacier', L = BIO_L[bio], fiend = !!F.fiend; let glows = null, t = 0; const motes = [], LF = lowFx;
    const collect = () => { glows = []; for (const p of (X.props || [])) { if (!BIO_L[p.biome]) continue; for (const [dx, dy, r, col, kind] of glowsOf(p.kind, p.v | 0, L)) glows.push({ p, dx, dy, r, col, kind, ph: hh(p.k || Math.round(p.x * 7 + p.y * 13), 1, 3) * TAU }); } };
    const MCOL = { glacier: ['#FFFFFF', ICE_HI, GREEN_HI], obs: [GREEN_HI, '#FFFFFF', ICE_HI], white: ['#FFFFFF', '#FFFFFF', '#FFE9C8'] }[L];
    const onScreen = () => { const T = X.Tz(), W = X.W(), Hh = X.H(); for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y); if (Xs > -T * 4 && Xs < W + T * 4 && Ys > -T * 3 && Ys < Hh + T * 6) return true; } return false; };
    return { X, L,
      update(dt) { t += dt; burstsTick(dt); if (!glows) { collect(); toughen(X.props); } if (QL.length > 400) QL.length = 0; if (QO.length > 400) QO.length = 0;
        const me = X.me, want = fiend ? 0 : LF() ? 4 : 12;
        if (motes.length < want && Math.random() < dt * 6) { const W = X.W() / X.Tz(), Hh = X.H() / X.Tz(); motes.push({ x: me.x + (Math.random() - 0.5) * W * 1.1, y: me.y + (Math.random() - 0.6) * Hh * 0.8, vx: 0.15 + Math.random() * 0.3, vy: 0.08 + Math.random() * 0.15, t: 0, life: 3 + Math.random() * 4, s: 0.5 + Math.random() * 0.8, ph: Math.random() * 6, col: MCOL[Math.floor(Math.random() * MCOL.length)] }); }
        for (const e of motes) { e.t += dt; e.x += (e.vx + Math.sin(e.t * 1.3 + e.ph) * 0.15) * dt; e.y += (e.vy + Math.cos(e.t * 0.9 + e.ph) * 0.06) * dt; } for (let i = motes.length - 1; i >= 0; i--) if (motes[i].t > motes[i].life) motes.splice(i, 1); },
      drawGround(c) { if (!QL.length && !(glows && glows.length)) return; if (!QL.length && !onScreen()) return;   // (no GPU pass and no copy when nothing of it is in view)
        const G = gpu(c); if (!G) { QL.length = 0; return; } const T = X.Tz(), W = X.W(), Hh = X.H(), lf = LF();
        if (glows) for (const q of glows) { const p = q.p; if (p.broken || q.kind === 'tip' || q.kind === 'eye') continue; const Xs = X.sx(p.x), Ys = X.sy(p.y); if (Xs < -T * 4 || Xs > W + T * 4 || Ys < -T * 3 || Ys > Hh + T * 3) continue; if (lf && q.kind !== 'crys') continue;
          G.Q.glow(Xs + q.dx * T * 0.3, Ys - T * 0.05, T * (q.kind === 'crys' ? 1.6 : 1.0), q.col, (L === 'white' ? 0.08 : 0.14) + 0.04 * Math.sin(t * 1.1 + q.ph), 0.42); }
        qFlush(G.Q, QL); gpuEnd(c, G); },
      drawOver(c) { if (!QO.length && !(glows && glows.length) && !BURSTS.length && !motes.length) return; const G = gpu(c); if (!G) { QO.length = 0; return; } const T = X.Tz(), W = X.W(), Hh = X.H(), lf = LF();
        if (glows) for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y) + q.dy * T; if (Xs < -T * 3 || Xs > W + T * 3 || Ys < -T * 4 || Ys > Hh + T * 3) continue;
          const k = 0.75 + 0.25 * Math.sin(t * 1.6 + q.ph);
          if (q.kind === 'tip') { if (lf) continue; const tw = Math.max(0, Math.sin(t * 1.7 + q.ph * 3 + q.dx * 5)); G.Q.glow(Xs, Ys, q.r * T * 1.8, q.col, 0.2 * tw); if (tw > 0.82) G.Q.star(Xs, Ys, q.r * T * 2.6 * (tw - 0.6), (tw - 0.82) * 3.5, '#FFFFFF'); continue; }
          if (q.kind === 'crys') { G.Q.glow(Xs, Ys, q.r * T * 1.4, q.col, (L === 'white' ? 0.06 : 0.12) * k); continue; }
          if (q.kind === 'lens') { G.Q.glow(Xs, Ys, q.r * T * 2.2, q.col, 0.32 * k); G.Q.glow(Xs, Ys, q.r * T * 0.6, '#FFFFFF', 0.35 * k); continue; }
          G.Q.glow(Xs, Ys, q.r * T * 2.4, q.col, 0.45 * k); G.Q.glow(Xs, Ys, q.r * T * 0.6, '#FFFFFF', 0.5 * k); }
        qFlush(G.Q, QO); burstsDraw(G.Q, X);
        for (const e of motes) { const a = Math.sin(e.t / e.life * Math.PI), Xs = X.sx(e.x), Ys = X.sy(e.y); if (Xs < -10 || Xs > W + 10 || Ys < -10 || Ys > Hh + 10) continue; G.Q.glow(Xs, Ys, T * 0.11 * e.s, e.col, a * 0.4); G.Q.glow(Xs, Ys, T * 0.03 * e.s, '#FFFFFF', a * 0.7); }
        gpuEnd(c, G); },
      refresh() { glows = null; } }; }

  /* ======================= the doors (the Drowned Belfry's, themed for the Aurora) ======================= */
  const DOOR_TH = { glacier: 'aurglacier', observatory: 'aurobs', whiteout: 'aurwhite' };
  function doorThemes() { try { if (typeof BEL_DOORS === 'undefined' || !BEL_DOORS || !BEL_DOORS.defTheme) return; const D = BEL_DOORS.defTheme;
    D('aurglacier', { light: LIGHT.glacier, gem: [0.5, 0.95, 0.8], rune: '#78D7B2', runeHi: '#E8FFF6', ring: '#B8F5DA', lit: '#E0FFF2', litFloor: '#78D7B2', caustic: '#B8F5DA', mote: '#FFFFFF', smoke: '#8AA4BC', drip: '#E8F8FF',
      recess: ['#040A18', '#123A44', '#081426'], glowIn: [[236, 255, 248], [150, 235, 205], [30, 100, 110]] });
    D('aurobs', { light: LIGHT.obs, gem: [0.46, 1.0, 0.82], rune: '#9AF0CC', runeHi: '#F0FFF8', ring: '#B8F5DA', lit: '#D8FFEE', litFloor: '#78D7B2', caustic: '#9AF0CC', mote: '#E8FFF6', smoke: '#5A6880', drip: '#D8FFEE',
      recess: ['#03080F', '#0E3A3A', '#06121C'], glowIn: [[230, 255, 246], [140, 240, 200], [20, 90, 90]] });
    D('aurwhite', { light: LIGHT.white, gem: [1.0, 0.78, 0.45], rune: '#FFC27A', runeHi: '#FFF6E8', ring: '#FFE0B0', lit: '#FFF2DC', litFloor: '#FFC27A', caustic: '#FFE0B0', mote: '#FFFFFF', smoke: '#B8C8D8', drip: '#FFFFFF',
      recess: ['#2A3446', '#6A5A48', '#3A4456'], glowIn: [[255, 250, 238], [255, 200, 130], [150, 90, 40]] }); } catch (e) {} }
  doorThemes();
  const DOORS = () => (!off() && typeof BEL_DOORS !== 'undefined' && BEL_DOORS && BEL_DOORS.stage && BEL_DOORS.themed) ? BEL_DOORS : null;
  const doorKind = (Rf, i) => { const nx = Rf.stages[i + 1]; return nx && nx.kind === 'boss' ? 'boss' : 'std'; };
  function hookRift() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.aurora; if (!Rf || Rf.__aurp) return; Rf.__aurp = 1;
    const oe = Rf.everyStage; Rf.everyStage = function (X, self, H) { let a = {}; try { a = oe ? oe.apply(this, arguments) || {} : {}; } catch (e) { a = {}; } if (off()) return a;
      let C = null; try { const D = DOORS(), S2 = (self && self.S) || {}; if (D && S2.kind !== 'boss' && X.F.rift && !X.F.rift.gate && H && H.exit) { C = { t: 0, X, exitPos: () => H.exit() }; D.stage(X, C, doorKind(Rf, X.F.rift.stage), D.themed(DOOR_TH[X.F.biome] || 'aurglacier')); } } catch (e) { C = null; }
      const tickDoor = dt => { if (!C) return; C.t += dt; try { BEL_DOORS.tick(C, dt, !!self.done); } catch (e) {} };
      let L = null; try { L = LN_OF[X.F.biome] ? lights(X) : null; } catch (e) { L = null; } if (!L) return C ? Object.assign({}, a, { update(dt) { if (a.update) a.update(dt); tickDoor(dt); }, door: C }) : a; LIVE = L; QL.length = 0; QO.length = 0;
      return Object.assign({}, a, { update(dt) { if (a.update) a.update(dt); L.update(dt); tickDoor(dt); }, drawGround(c) { if (a.drawGround) a.drawGround(c); L.drawGround(c); }, drawOver(c) { if (a.drawOver) a.drawOver(c); L.drawOver(c); }, aurp: L, door: C }); };
    const op = Rf.preload; Rf.preload = function (P) { let a = []; try { a = op ? op.apply(this, arguments) || [] : []; } catch (e) {} let b = []; try { b = warm(P); } catch (e) {}
      let d = []; try { const D = DOORS(), S2 = P && P.S; if (D && S2 && S2.kind !== 'boss' && P.F && P.F.rift && !P.F.rift.gate) d = D.warmDoor(P, doorKind(Rf, P.F.rift.stage), DOOR_TH[P.F.biome] || 'aurglacier') || []; } catch (e) {}
      return a.concat(b, d); }; } catch (e) {} }
  hookRift();

  const API = { piece, sprite: (n, v, P, L) => sprite(n, v, P, true, L), tex, texJobs, warm, release, install, glowsOf, OLD, DEF, TDEF, KINDS, HPK, DEBRIS, BURSTS, LIGHT, BIO_L, LN_OF, PIECES_OF, QL, QO, ql, qo, ready, gpuOK,
    kitx: { lump, prism, disc, box, contact, halo, dust, icicles, snowCap, snowM, rockM, stoneM, brassM, iceM, TINT, INK, lit },
    get live() { return LIVE; }, get base() { return BASE; }, set base(v) { if (v > 2) BASE = Math.round(v); },
    get stats() { return Object.assign({ cached: CACHE.size, textures: TEX.size, texKeys: [...TEX.keys()], px: [...CACHE.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) + [...TEX.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) }, STATS); } };
  if (HAS_W) window.AUR_PROPS = API;
  return API;
})();
