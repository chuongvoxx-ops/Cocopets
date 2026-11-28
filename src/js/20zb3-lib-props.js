/* ---------- v474 LE: The Library of Unwritten Lives repainted in 2.5D (Rift 07's three lands, their props, pieces, hazards, doors) ----------
   Rift 07 rebuilt to the standard of Rifts 05 / 06 (v470 AE, v472 YE): every solid piece of the rift is painted ONCE into its own
   cached picture by the Drowned Belfry's software shading pass (BELPROPS.kit, 20n9; the extra primitives are Rift 06's,
   YUG_PROPS.kitx: lump, plate, disc, prism), each land in its own light:
     cat     (the Catalogue of Truth, section 1): a warm candlelit hall adrift in ink under a black moon; a candle-gold key, the
             void's violet in every rim, a warm bounce off the parchment floor
     silver  (the Silver Bindery, section 2): white marble and white lacquer under a silver moon; a cool white key, a pale blue rim
     holy    (the Ascent of Light, section 3): a stair of white marble and gold in the clouds; a bright warm key, a high sky light,
             a gold rim
   then finished with a little 2D detail and a soft ink edge. Nothing is painted per frame: the frame lays the pictures down; what
   glows (the candles' flames, the censers' white fire, the halos, the lectern's gold eye, the ink's sheen) is the GPU painter's
   light (FGFX, 20k6h; LE-FX 620..624), lowFx respected; without it the pictures stay (with their painted flames) and the light
   is left out.
   Props (DunWorld.PROPS through the engine's prop cache, so BREAK_FX shatters these pictures in their own materials, each break
   adding its own debris (splinters, loose pages, gilt, glass, cloud) and a feathered GPU burst; a clean floor after): bookcase,
   libladder, lectern, bookstack, candelabra, inkwell (the Catalogue; the furniture also in the Bindery's white lacquer and silver
   and the Ascent's ivory and gold), mirror, silverurn (the Bindery), platpillar, angelstatue, haloarch, censer, cloudbank, harp
   (the Ascent); v 0..1 painted, 2..3 the same mirrored. Only in the three lands (another land asking for one gets its 2D art).
   Textures (made once per sharpness and land, wrapping): floor (FN tiles square, continuous across tiles: never per-tile
   squares), bank (a wall's face: a shelf of book spines), roof (a wall's top), cliff (the island's edge: slab, gilt band, the
   page block torn into ink drips), bridge (a closed book's cover) and bunder (its page block). The lands (BIOMES.catalogue /
   .binding / .archive): floorFn (13 arguments), wallFn, roofFn, cliffTint, bridgeFn, bridgeEdge, floorUnder, floor as getters
   (the old art whenever the painter is off).
   Hazards: the lands' 'laser' (20b: its rule, timing and damage) has a GPU tell, a line of gold script light kindling from its
   ends (no dashed box).
   The trials' pieces (20za): LIB_PROPS.piece(c, name, v, Xs, Ys, T, o) draws a piece's picture (false: the caller draws its old
   2D), LIB_PROPS.ql / .qo queue GPU light under / over the actors for this frame; LIB_PROPS.stage.* draw whole trial parts.
   The exits are the Drowned Belfry's doors (BEL_DOORS, 20n9d: 'std' out of a stage, 'boss' before a boss), themed for the Library
   ('libcat' / 'libsilver' / 'libholy': carved wood or marble for its stone, gilt or silver for its bronze, ink-violet / moon /
   gold light); positions, trigger radius, labels and progression stay the stage's own (H.setExit).
   Hooks: RIFT_BY_ID.library.everyStage (chained: the light, the doors), .preload (chained: textures, props, pieces, the door),
   DunWorld.dropProps (chained: everything given back), BREAK_FX.prop (chained: debris and burst).
   window.__LIBP = 0 (or __BELP = 0) turns all of it off (the old 2D art); __LIBP_GL = 0 the GPU's part only. */
var LIB_PROPS = (() => {
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined';
  const off = () => HAS_W && (window.__LIBP === 0 || window.__BELP === 0);
  const BP = () => (!off() && HAS_W && window.BELPROPS && window.BELPROPS.kit && window.YUG_PROPS && window.YUG_PROPS.kitx) ? window.BELPROPS : null;
  const XK = () => window.YUG_PROPS.kitx;
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + (s | 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const md = (a, n) => ((a % n) + n) % n;
  const kOf = c => { const m = c && c.getTransform ? c.getTransform() : null; return m ? Math.max(0.5, Math.min(3, Math.hypot(m.a, m.b))) : 1; };
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0, tex: 0, texMs: 0, land: 0, pieces: 0, breaks: 0, empty: 0, hazards: 0, tells: 0, flames: 0 };
  const GOLD = '#E8C36A', GOLD_HI = '#FFF0B8', CANDLE = '#FFB85A', INKV = '#8A5BD0', INKV_HI = '#CDB4FF', MOON = '#DCE6FF', HOLY = '#FFE9A8';
  const E_GOLD = [1.0, 0.78, 0.35], E_CANDLE = [1.0, 0.62, 0.25], E_INK = [0.55, 0.34, 0.95], E_MOON = [0.72, 0.8, 1.0], E_HOLY = [1.0, 0.92, 0.66];

  /* ======================= the light of each land ======================= */
  const LIGHT = {
    cat: { a0: [0.08, 0.06, 0.09], a1: [0.09, 0.06, 0.1], e0: [0.08, 0.06, 0.09], e1: [0.5, 0.38, 0.26], k: [1.16, 0.98, 0.76], rim: [0.5, 0.32, 0.78], bo: [0.2, 0.13, 0.07] },
    silver: { a0: [0.23, 0.25, 0.31], a1: [0.12, 0.14, 0.19], e0: [0.24, 0.26, 0.32], e1: [0.74, 0.8, 0.92], k: [1.08, 1.1, 1.18], rim: [0.5, 0.6, 0.85], bo: [0.2, 0.22, 0.26] },
    holy: { a0: [0.3, 0.28, 0.25], a1: [0.16, 0.16, 0.19], e0: [0.4, 0.38, 0.35], e1: [0.8, 0.76, 0.68], k: [1.1, 1.0, 0.84], rim: [0.7, 0.56, 0.3], bo: [0.38, 0.35, 0.28] } };
  const BIO_L = { catalogue: 'cat', binding: 'silver', archive: 'holy' };
  const INK = { cat: [22, 10, 26], silver: [34, 40, 62], holy: [128, 104, 64] };
  function lit(K, name, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHT[name] || LIGHT.cat); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }
  const bioOf = B => { if (!B || typeof BIOMES === 'undefined') return null; return B === BIOMES.catalogue ? 'catalogue' : B === BIOMES.binding ? 'binding' : B === BIOMES.archive ? 'archive' : null; };
  // (a 2D prop call may pass only { libTheme }: the teetering shelves, 20zb, through PROPS.bookcase)
  const LOF = B => { const b = bioOf(B); if (b) return BIO_L[b]; return B && B.libTheme ? (B.libTheme === 'silver' ? 'silver' : B.libTheme === 'holy' ? 'holy' : 'cat') : null; };

  /* ======================= noise that wraps (for the textures) ======================= */
  function pvn(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), q = p | 0 || 1;
    const X0 = ((xi % q) + q) % q, X1 = (X0 + 1) % q, Y0 = ((yi % q) + q) % q, Y1 = (Y0 + 1) % q, a = hh(X0, Y0, s), b = hh(X1, Y0, s), c = hh(X0, Y1, s), d = hh(X1, Y1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const pfbm = (x, y, p, s) => pvn(x, y, p, s) * 0.52 + pvn(x * 2, y * 2, p * 2, s + 7) * 0.3 + pvn(x * 4, y * 4, p * 4, s + 13) * 0.18;
  let DOM = 6; const wn = (x, y, f, s) => pvn(x * f, y * f, Math.max(1, Math.round(DOM * f)), s);

  /* ======================= materials ======================= (each sets K.M; u, v surface coordinates in tiles; L the land) */
  const glowAdd = (M, e, k) => { M.er += e[0] * k; M.eg += e[1] * k; M.eb += e[2] * k; };
  // wood: the Catalogue's polished mahogany (grain along v, a darker figure, a lacquer coat); the Bindery's white lacquer; the
  // Ascent's ivory enamel
  function woodM(K, u, v, sd, L, o) { const M = K.M, gr = K.vn(u * 3 + sd, v * 26) * 0.55 + K.vn(u * 12 - sd, v * 64) * 0.3 + K.vn(u * 1.3, v * 4 + sd) * 0.15, t = (o && o.tone) || 1;
    if (L === 'silver') { const w = 0.93 + 0.06 * gr; M.r = 0.74 * w * t; M.g = 0.77 * w * t; M.b = 0.84 * w * t; M.rg = 0.26; M.cc = 0.75; }
    else if (L === 'holy') { const w = 0.93 + 0.07 * gr; M.r = 0.88 * w * t; M.g = 0.82 * w * t; M.b = 0.7 * w * t; M.rg = 0.3; M.cc = 0.65; }
    else { const fig = ss(0.6, 0.82, K.vn(u * 2 + sd * 3, v * 9)); M.r = (0.2 + 0.13 * gr) * t * (1 - 0.35 * fig); M.g = (0.085 + 0.05 * gr) * t * (1 - 0.35 * fig); M.b = (0.055 + 0.03 * gr) * t * (1 - 0.3 * fig); M.rg = 0.3 + 0.12 * gr; M.cc = 0.55; } }
  // gilt (the Catalogue's and the Ascent's): warm metal, finely worn, dark in the hollows; silver (the Bindery's): cool, a touch tarnished
  function metalM(K, u, v, sd, L, wear) { const M = K.M, s1 = K.vn(u * 5 + sd, v * 5), s2 = K.vn(u * 19 - sd, v * 19), w = clamp(wear || 0, 0, 1); M.mt = 1;
    if (L === 'silver') { M.fr = 0.8 * (0.9 + 0.12 * s1); M.fg = 0.83 * (0.9 + 0.12 * s1); M.fb = 0.9 * (0.9 + 0.12 * s1); M.rg = lerp(0.24, 0.1, w) * (0.8 + 0.4 * s2); if (M.ao < 0.75) { M.fr *= 0.75; M.fg *= 0.75; M.fb *= 0.78; M.rg = 0.45; } return; }
    M.fr = 0.95 * (0.86 + 0.18 * s1); M.fg = 0.7 * (0.86 + 0.18 * s1); M.fb = 0.3 * (0.8 + 0.3 * s2); M.rg = lerp(0.3, 0.13, w) * (0.8 + 0.4 * s2); if (M.ao < 0.75) { M.fr *= 0.72; M.fg *= 0.64; M.fb *= 0.55; M.rg = 0.48; } }
  // a book's leather: fine pebbled grain, a little sheen, worn paler at its edges (e 0..1)
  function leatherM(K, u, v, sd, col, e) { const M = K.M, g = K.vn(u * 31 + sd, v * 31), w = K.fbm(u * 3 + sd, v * 3), t = 0.78 + 0.3 * w + 0.12 * (g - 0.5) + 0.25 * (e || 0); M.r = col[0] * t; M.g = col[1] * t; M.b = col[2] * t; M.rg = 0.46 + 0.14 * g; M.cc = 0.22; }
  // parchment: cream, fibrous, matte (white: the Ascent's pages)
  function parchM(K, u, v, sd, white) { const M = K.M, f = K.vn(u * 40 + sd, v * 7), w = K.fbm(u * 2 + sd, v * 2), t = 0.84 + 0.16 * w + 0.06 * (f - 0.5); if (white) { M.r = 0.92 * t; M.g = 0.9 * t; M.b = 0.86 * t; } else { M.r = 0.88 * t; M.g = 0.78 * t; M.b = 0.58 * t; } M.rg = 0.85; }
  // marble: polished, soft clouds, veins (tint, vein colours)
  function marbleM(K, u, v, sd, tint, vc) { const M = K.M, w = K.fbm(u * 1.7 + sd, v * 1.7), q = Math.abs(K.fbm(u * 2.2 + w * 2.5, v * 2.2 - sd) - 0.5), vein = ss(0.05, 0.0, q) * 0.7; tint = tint || [0.9, 0.89, 0.86]; vc = vc || [0.5, 0.52, 0.58];
    M.r = lerp(tint[0] * (0.93 + 0.08 * w), vc[0], vein); M.g = lerp(tint[1] * (0.93 + 0.08 * w), vc[1], vein); M.b = lerp(tint[2] * (0.93 + 0.08 * w), vc[2], vein); M.rg = 0.16; M.cc = 0.55; }
  const MARB = { cat: [[0.9, 0.82, 0.64], [0.6, 0.45, 0.3]], silver: [[0.9, 0.91, 0.93], [0.52, 0.56, 0.66]], holy: [[0.96, 0.95, 0.92], [0.84, 0.7, 0.4]] };
  const marbleL = (K, u, v, sd, L) => marbleM(K, u, v, sd, MARB[L][0], MARB[L][1]);
  // wax (a candle's): ivory, soft, a warm glow toward its wick
  function waxM(K, u, v, sd, k) { const M = K.M, w = K.vn(u * 9 + sd, v * 9); M.r = 0.92 * (0.9 + 0.1 * w); M.g = 0.86 * (0.9 + 0.1 * w); M.b = 0.72 * (0.9 + 0.1 * w); M.rg = 0.5; M.cc = 0.2; glowAdd(M, E_CANDLE, 0.05 + 0.55 * (k || 0)); }
  // black glass (the inkwell): near black, mirror-glossy, a violet depth
  function inkGlassM(K, u, v, sd) { const M = K.M; M.r = 0.018; M.g = 0.014; M.b = 0.04; M.rg = 0.05; M.cc = 1; M.mt = 0.1; M.fr = 0.08; M.fg = 0.06; M.fb = 0.14; }
  // cloud: soft white, lit through
  function cloudM(K, u, v, sd, k) { const M = K.M, w = K.fbm(u * 2 + sd, v * 2); M.r = 0.93 + 0.05 * w; M.g = 0.93 + 0.05 * w; M.b = 0.98; M.rg = 0.95; M.er += 0.2 + 0.12 * (k || 0); M.eg += 0.2 + 0.12 * (k || 0); M.eb += 0.22 + 0.12 * (k || 0); }
  // platinum: bright cool metal, brushed along v
  function platM(K, u, v, sd) { const M = K.M, s = K.vn(u * 4 + sd, v * 40); M.mt = 1; M.fr = 0.8 + 0.06 * s; M.fg = 0.82 + 0.06 * s; M.fb = 0.88 + 0.05 * s; M.rg = 0.16 + 0.08 * s; }
  // the books' colours per land
  const BOOKS = { cat: [[0.34, 0.08, 0.15], [0.08, 0.12, 0.26], [0.1, 0.22, 0.13], [0.42, 0.26, 0.08], [0.28, 0.08, 0.17], [0.2, 0.12, 0.32], [0.46, 0.1, 0.1], [0.08, 0.22, 0.22]],
    silver: [[0.1, 0.14, 0.3], [0.84, 0.86, 0.9], [0.42, 0.5, 0.68], [0.24, 0.26, 0.4], [0.62, 0.7, 0.82], [0.07, 0.09, 0.2], [0.66, 0.6, 0.8], [0.3, 0.4, 0.62]],
    holy: [[0.94, 0.92, 0.88], [0.92, 0.8, 0.52], [0.72, 0.82, 0.96], [0.84, 0.78, 0.96], [0.96, 0.85, 0.72], [0.7, 0.8, 0.92], [0.95, 0.93, 0.86], [0.82, 0.64, 0.3]] };
  const bookCol = (L, R) => BOOKS[L][Math.floor(R() * 8)];

  /* ======================= primitives (the kit's and Rift 06's) ======================= */
  const contact = (K, S, rx, ry, a, x, y) => K.contact(S, x || 0, y == null ? 0.03 : y, rx, ry, a);
  // one book standing: a rounded spine (the front face) with two gilt bands at each end and a label; its top the page block
  function book(K, S, x, by, bw, bd, z0, h, col, sd, L, o) { o = o || {};
    K.rbox(S, x, by, bw, bd, z0, z0 + h, Math.min(bw * 0.85, 0.06), (f, u, vv, ao, e) => { if (f === 't') { parchM(K, u * 20, vv * 20, sd, L === 'holy'); if (Math.abs(u) > bw * 0.7 || Math.abs(vv) > bd * 0.8) leatherM(K, u * 9, vv * 9, sd, col, 0.3); return; }
      const r = (vv - z0) / h; leatherM(K, u * 9, vv * 4, sd, col, e * 0.6); const bd2 = Math.min(Math.abs(r - 0.1), Math.abs(r - 0.18), Math.abs(r - 0.82), Math.abs(r - 0.9));
      if (bd2 < 0.018) metalM(K, u * 3, vv * 3, sd, L, 0.4); else if (o.label && r > 0.44 && r < 0.6 && Math.abs(u) < bw * 0.6) { const M = K.M; if (L === 'holy') { M.r = 0.7; M.g = 0.52; M.b = 0.22; } else { M.r = 0.05; M.g = 0.035; M.b = 0.04; } M.rg = 0.3; if (Math.abs(r - 0.52) < 0.015) metalM(K, u, vv, sd, L, 0.5); } }); }

  /* ======================= the props ======================= */
  // (box: the picture's box about its feet in tiles; paint(K, S, v, L); mat: what BREAK_FX breaks it into; el: its element; hp)
  const WOODC = { cat: ['#6A3A2A', '#3A1E18', '#A87050'], silver: ['#DCE1EA', '#9AA4B6', '#FFFFFF'], holy: ['#F2ECDC', '#CFC2A0', '#FFFFFF'] };
  const DEF = {
    /* a giant bookcase: a carcass of polished wood (white lacquer, ivory), four shelves of standing books (each spine rounded, gilt
       banded, a few lying in stacks), fluted posts, a cornice with a gilt strip, a curved pediment with a gilt arc and a finial */
    bookcase: { box: v => [-1.38, -(3.55 + v * 0.3) - 0.85, 1.38, 0.55], mat: { mat: 'wood' }, el: 'wood', hp: 4,
      paint(K, S, v, L) { const X = XK(), sd = 11 + v * 7, R = K.R1(41 + v * 3 + (L === 'silver' ? 5 : L === 'holy' ? 9 : 0)), H = 3.5 + v * 0.3, hw = 1.05, hd = 0.34, c = S.c;
        contact(K, S, 1.45, 0.42, 0.62);
        K.rbox(S, 0, 0.06, hw + 0.06, hd + 0.04, 0, 0.2, 0.04, (f, u, vv) => woodM(K, u * 2, vv * 3, sd + 3, L, { tone: 0.9 })); S.unlock();
        K.rbox(S, 0, -0.1, hw * 0.9, 0.05, 0.2, H - 0.12, 0.02, (f, u, vv) => { woodM(K, u * 2, vv * 2, sd, L, { tone: 0.6 }); K.M.ao *= 0.45; K.M.cc = 0.1; }); S.unlock();
        const rows = 4, z0 = 0.2, rh = (H - 0.32 - z0) / rows;
        for (let i = 0; i < rows; i++) { const zb = z0 + rh * i + 0.07;
          K.rbox(S, 0, 0.04, hw * 0.96, hd, zb - 0.07, zb, 0.02, (f, u, vv) => woodM(K, u * 2, vv * 4, sd + i, L)); S.unlock();
          let x = -hw * 0.86; while (x < hw * 0.84) { const room = hw * 0.86 - x;
            if (R() < 0.12 && room > 0.4) { const w = Math.min(room, 0.42 + R() * 0.18), n = 2 + Math.floor(R() * 3); let z = zb; for (let k = 0; k < n; k++) { const bh = 0.06 + R() * 0.035, col = bookCol(L, R), dx = (R() - 0.5) * 0.06; K.rbox(S, x + w / 2 + dx, 0.0, w / 2 - 0.02, 0.2, z, z + bh, 0.025, (f, u, vv, ao, e) => { if (f === 'f' && Math.abs((vv - z) / bh - 0.5) < 0.32) { parchM(K, u * 3, vv * 60, sd + k, L === 'holy'); if (md(vv * 70, 1) < 0.3) K.M.ao *= 0.8; } else leatherM(K, u * 6, vv * 6, sd + k, col, e * 0.5); }); z += bh; } x += w + 0.03; continue; }
            const bw = 0.045 + R() * 0.05, bh = rh * (0.6 + R() * 0.32); book(K, S, x + bw, -0.02 + R() * 0.05, bw, 0.2, zb, Math.min(bh, rh - 0.12), bookCol(L, R), sd + Math.round(x * 50), L, { label: R() < 0.5 }); x += bw * 2 + 0.006; }
          S.unlock(); }
        K.rbox(S, 0, 0.04, hw * 0.96, hd, H - 0.32, H - 0.24, 0.02, (f, u, vv) => woodM(K, u * 2, vv * 4, sd + 9, L)); S.unlock();
        for (const sx of [-1, 1]) K.rbox(S, sx * (hw - 0.03), 0.05, 0.1, hd + 0.02, 0, H, 0.035, (f, u, vv) => { woodM(K, u * 3 + sx, vv * 2, sd + 5, L); if (f === 'f') { const fl = Math.abs(md((u - sx * (hw - 0.03)) * 20 + 0.5, 1) - 0.5); if (fl < 0.12) K.M.ao *= 0.72; if (vv > 0.3 && vv < 0.42 || vv > H - 0.42 && vv < H - 0.32) metalM(K, u * 4, vv * 4, sd, L, 0.3); } }); S.unlock();
        K.rbox(S, 0, 0.07, hw + 0.12, hd + 0.08, H, H + 0.16, 0.04, (f, u, vv) => { woodM(K, u * 2, vv * 3, sd + 7, L); if (f === 'f' && Math.abs(vv - H - 0.08) < 0.022) metalM(K, u * 4, vv, sd, L, 0.4); }); S.unlock();
        const pd = []; for (let i = 0; i <= 18; i++) { const a = i / 18; pd.push([(-hw - 0.08) + a * (hw * 2 + 0.16), -(H + 0.15) - Math.sin(a * Math.PI) * 0.5]); } pd.push([hw + 0.08, -(H + 0.13)], [-hw - 0.08, -(H + 0.13)]);
        X.plate(K, S, pd, [0, 0.9, 0.42], 0.04, (x, y, ao, e) => { woodM(K, x * 2, y * 3, sd + 8, L, { tone: 0.95 }); const top = -(H + 0.15) - Math.sin(clamp((x + hw + 0.08) / (hw * 2 + 0.16), 0, 1) * Math.PI) * 0.5; if (Math.abs(y - top - 0.09) < 0.028 && y < -(H + 0.2)) metalM(K, x * 4, y * 4, sd, L, 0.5); }); S.unlock();
        K.ball(S, 0, -(H + 0.75), 0.1, 0.1, (dx, dy) => metalM(K, dx, dy, sd, L, 0.6)); S.unlock();
        K.glint(c, -hw * 0.55, -(H + 0.42), 0.12, 0.5); K.ink(S, INK[L], 0.45); } },
    /* a rolling library ladder climbing into empty air: two rails, eleven rungs, brass wheels at its foot; its top fades away */
    libladder: { box: () => [-1.2, -4.6, 1.2, 0.4], mat: { mat: 'wood' }, el: 'wood', hp: 2,
      paint(K, S, v, L) { const sd = 21 + v, H = 3.9, lean = (v % 2 ? 1 : -1) * 0.45, c = S.c; contact(K, S, 0.6, 0.2, 0.5);
        for (const sx of [-1, 1]) K.tube(S, [[sx * 0.32, 0], [sx * 0.24 + lean, -H]], 0.055, 0.045, (t, s2) => woodM(K, s2 + sx, t * 8, sd + sx, L)); S.unlock();
        for (let i = 1; i < 12; i++) { const u = i / 12, y = -H * u, x = lean * u; K.tube(S, [[-0.32 + 0.08 * u + x, y], [0.32 - 0.08 * u + x, y]], 0.032, 0.032, (t, s2) => woodM(K, t * 3, s2 + i, sd + i, L, { tone: 1.1 })); } S.unlock();
        for (const sx of [-1, 1]) K.ball(S, sx * 0.32, -0.04, 0.08, 0.08, (dx, dy) => metalM(K, dx, dy, sd, L, 0.4)); S.unlock();
        K.ink(S, INK[L], 0.4); c.save(); c.globalCompositeOperation = 'destination-out'; const g = c.createLinearGradient(0, -H, 0, -H * 0.35); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(-1.2, -H - 0.7, 2.4, H * 0.65 + 0.7); c.restore(); } },
    /* a reading lectern: a turned post on a round foot, a slanted desk, a great open book on it (v 0: a gold eye inked on its
       blank pages, glowing; v 1: lines of writing) and a ribbon hanging over the desk's edge; v 2 the desk bare */
    lectern: { box: () => [-1.0, -2.0, 1.0, 0.45], mat: { mat: 'wood' }, el: 'wood', hp: 2,
      paint(K, S, v, L) { const X = XK(), sd = 31 + v, c = S.c; contact(K, S, 0.75, 0.25, 0.6);
        K.rev(S, 0, 0, h => 0.42 - h * 1.2, 0, 0.14, { mat: (u, h) => woodM(K, u * 2, h * 4, sd, L), top: true, capMat: x => woodM(K, x * 2, 1, sd, L) }); S.unlock();
        K.rev(S, 0, -0.12, h => 0.09 + 0.035 * Math.pow(Math.abs(Math.sin(h * Math.PI * 2.4)), 3), 0, 0.82, { mat: (u, h) => { woodM(K, u * 2, h * 3, sd + 1, L); if (Math.abs(h - 0.41) < 0.03) metalM(K, u, h, sd, L, 0.4); } }); S.unlock();
        X.plate(K, S, [[-0.72, -0.98], [0.72, -0.98], [0.6, -1.3], [-0.6, -1.3]], [0, 0.55, 0.84], 0.035, (x, y) => woodM(K, x * 2, y * 2, sd + 2, L)); S.unlock();
        K.rbox(S, 0, -0.9, 0.73, 0.03, 0, 0.07, 0.015, (f, u, vv) => { woodM(K, u * 2, vv * 2, sd + 3, L, { tone: 0.8 }); if (f === 'f' && Math.abs(vv - 0.035) < 0.012) metalM(K, u * 4, vv, sd, L, 0.4); }); S.unlock();
        if (v < 2) { // (v 2: the desk left bare, for the trials' and Vellum's lecterns, 20zb3b)
        for (const sd2 of [-1, 1]) { const pts = []; for (let i = 0; i <= 10; i++) { const a = i / 10; pts.push([sd2 * a * 0.64, -1.2 - Math.sin(a * Math.PI * 0.85) * 0.14 + a * 0.05]); } for (let i = 10; i >= 0; i--) { const a = i / 10; pts.push([sd2 * a * 0.6, -1.06 - Math.sin(a * Math.PI * 0.85) * 0.08 + a * 0.06]); }
          X.plate(K, S, pts, [sd2 * 0.18, 0.6, 0.78], 0.02, (x, y, ao, e) => { parchM(K, x * 3, y * 3, sd + sd2, L === 'holy'); K.M.ao *= 0.75 + 0.25 * ss(0, 0.15, Math.abs(x)); }); }
        S.unlock();
        K.tube(S, [[0.05, -1.12], [0.09, -0.98], [0.07, -0.82], [0.1, -0.7]], 0.022, 0.018, (t, s2) => leatherM(K, t * 3, s2, sd, L === 'silver' ? [0.1, 0.14, 0.3] : [0.46, 0.08, 0.12])); S.unlock();
        c.save(); c.lineCap = 'round';
        if (v % 2 === 0) { c.strokeStyle = L === 'silver' ? 'rgba(70,90,140,.8)' : 'rgba(176,128,40,.85)'; c.lineWidth = 0.025; c.beginPath(); c.ellipse(-0.3, -1.2, 0.14, 0.05, 0, 0, TAU); c.stroke(); c.fillStyle = c.strokeStyle; c.beginPath(); c.arc(-0.3, -1.2, 0.03, 0, TAU); c.fill(); }
        else { c.strokeStyle = 'rgba(40,26,40,.38)'; c.lineWidth = 0.012; c.beginPath(); for (let i = 0; i < 5; i++) for (const s2 of [-1, 1]) { const y = -1.24 + i * 0.035; c.moveTo(s2 * 0.1, y + (s2 > 0 ? 0.01 : 0)); c.lineTo(s2 * (0.48 - (i % 2) * 0.08), y + 0.03); } c.stroke(); }
        c.restore(); } K.ink(S, INK[L], 0.42); } },
    /* three stacks of books lying flat: their covers tooled in gilt, page blocks (cream, finely lined) toward the front, a spine
       or two turned out */
    bookstack: { box: () => [-1.15, -1.75, 1.15, 0.45], mat: { mat: 'wood' }, el: 'wood', hp: 2,
      paint(K, S, v, L) { const sd = 41 + v, R = K.R1(61 + v * 5), c = S.c; contact(K, S, 1.0, 0.3, 0.55);
        for (const [x0, n] of [[-0.62, 3 + v % 2], [0.6, 2 + v % 2], [0.02, 5 - v % 2]]) { let z = 0; for (let i = 0; i < n; i++) { const w = 0.5 + R() * 0.15, h = 0.13 + R() * 0.06, dx = (R() - 0.5) * 0.1, col = bookCol(L, R), sp = R() < 0.35, zz = z;
            K.rbox(S, x0 + dx, 0.02, w / 2, 0.32, zz, zz + h, 0.03, (f, u, vv, ao, e) => { const r = (vv - zz) / h; if (f === 't') { leatherM(K, u * 6, vv * 6, sd + i, col, e * 0.5); const ed = Math.min(w / 2 - Math.abs(u - x0 - dx), 0.32 - Math.abs(vv)); if (Math.abs(ed - 0.06) < 0.012) metalM(K, u * 4, vv * 4, sd, L, 0.4); return; }
              if (sp || r < 0.16 || r > 0.84) { leatherM(K, u * 6, vv * 6, sd + i, col, e * 0.5); if (sp && Math.abs(r - 0.5) < 0.1 && Math.abs(u - x0 - dx) < w * 0.3) metalM(K, u * 3, vv * 3, sd, L, 0.4); } else { parchM(K, u * 3, vv * 80, sd + i, L === 'holy'); if (md(vv * 90, 1) < 0.3) K.M.ao *= 0.82; } }); z += h; } S.unlock(); }
        K.ink(S, INK[L], 0.42); } },
    /* a gilded three-armed candelabra (silver in the Bindery): a domed foot, a stem with knops, curling arms, three candles with
       wax runs and their small flames painted (their living light the GPU's) */
    candelabra: { box: () => [-0.9, -3.05, 0.9, 0.35], mat: { mat: 'iron', cols: ['#C9A24A', '#7A5A20', '#FFF0B8'] }, el: 'fire', hp: 2,
      paint(K, S, v, L) { const sd = 51 + v, c = S.c; contact(K, S, 0.45, 0.16, 0.55);
        K.rev(S, 0, 0, h => 0.3 * (1 - h * 3.2) + 0.05, 0, 0.26, { mat: (u, h) => metalM(K, u * 3, h * 5, sd, L, 0.3), top: true, capMat: x => metalM(K, x, 2, sd, L, 0.5) }); S.unlock();
        K.rev(S, 0, -0.25, h => 0.04 + 0.04 * Math.pow(Math.abs(Math.sin(h * Math.PI * 1.9)), 4), 0, 1.68, { mat: (u, h) => metalM(K, u * 3, h * 4, sd + 1, L, 0.4) }); S.unlock();
        for (const sx of [-1, 1]) K.tube(S, [[0, -1.28], [sx * 0.2, -1.32], [sx * 0.38, -1.42], [sx * 0.46, -1.58], [sx * 0.45, -1.76]], 0.035, 0.03, (t, s2) => metalM(K, t * 4, s2, sd + 2, L, 0.4)); S.unlock();
        const tips = [[-0.45, -1.76], [0, -1.93], [0.45, -1.76]];
        for (const [x, y] of tips) { K.rev(S, x, y, h => 0.1 - h * 0.3, 0, 0.08, { mat: (u, h) => metalM(K, u * 3, h * 9, sd + 3, L, 0.5), top: true, capMat: () => metalM(K, 0, 0, sd, L, 0.5) }); S.unlock();
          K.rev(S, x, y - 0.07, h => 0.052 + (h < 0.05 ? 0.01 : 0), 0, 0.3, { mat: (u, h) => { waxM(K, u * 6, h * 6, sd, ss(0.18, 0.3, h)); if (Math.abs(u + 0.02) < 0.012 && h > 0.12) K.M.ao *= 0.9; } }); S.unlock(); }
        c.save(); for (const [x, y] of tips) { const fy = y - 0.39; c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, fy, 0, x, fy, 0.3); g.addColorStop(0, 'rgba(255,214,140,.55)'); g.addColorStop(1, 'rgba(255,180,90,0)'); c.fillStyle = g; c.fillRect(x - 0.3, fy - 0.3, 0.6, 0.6);
          c.globalCompositeOperation = 'source-over'; c.beginPath(); c.moveTo(x, fy - 0.17); c.quadraticCurveTo(x + 0.06, fy - 0.02, x, fy + 0.04); c.quadraticCurveTo(x - 0.06, fy - 0.02, x, fy - 0.17); const f2 = c.createLinearGradient(0, fy - 0.17, 0, fy + 0.04); f2.addColorStop(0, '#FFF6D8'); f2.addColorStop(0.6, '#FFD27A'); f2.addColorStop(1, '#FF9A3A'); c.fillStyle = f2; c.fill(); } c.restore();
        K.ink(S, INK[L], 0.4); } },
    /* a giant inkwell of black glass with a gilt collar, its ink brimming (a violet sheen), a great white quill stood in it */
    inkwell: { box: () => [-1.1, -3.6, 1.1, 0.45], mat: { mat: 'glass' }, el: 'water', hp: 3,
      paint(K, S, v, L) { const X = XK(), sd = 61 + v, m = v % 2 ? 1 : -1, c = S.c; contact(K, S, 0.85, 0.28, 0.62);
        K.rev(S, 0, 0, h => 0.62 * Math.sqrt(Math.max(0.02, 1 - Math.pow((h - 0.36) / 0.52, 2))) * (h < 0.05 ? 0.92 : 1), 0, 0.82, { mat: (u, h) => { inkGlassM(K, u, h, sd); if (Math.abs(u + 0.25) < 0.05 && h > 0.2 && h < 0.6) { K.M.cc = 1; K.M.er += 0.08; K.M.eg += 0.08; K.M.eb += 0.12; } } }); S.unlock();
        K.rev(S, 0, -0.8, h => 0.34 + (h > 0.15 ? 0.04 : 0), 0, 0.2, { mat: (u, h) => metalM(K, u * 3, h * 9, sd, L, 0.4), top: true, capMat: (x, z, ao, q, ph, x2, ey) => { const r = Math.hypot(x / 0.38, ey || 0); if (r < 0.82) { inkGlassM(K, x, 0, sd); glowAdd(K.M, E_INK, 0.06 * (1 - r)); } else metalM(K, x * 3, 1, sd, L, 0.5); } }); S.unlock();
        const a = 0.35 * m, ca = Math.cos(a), sa = Math.sin(a), q = (s, d) => [0.05 + sa * s + ca * d, -0.95 - ca * s + sa * d];
        const vane = []; for (let i = 0; i <= 12; i++) { const s = 0.5 + i / 12 * 2.0, w = 0.32 * Math.sin(Math.min(1, (s - 0.5) / 2.0) * Math.PI) * (1 - 0.2 * (i / 12)); vane.push(q(s, w)); } for (let i = 12; i >= 0; i--) { const s = 0.5 + i / 12 * 2.0, w = 0.22 * Math.sin(Math.min(1, (s - 0.5) / 2.0) * Math.PI); vane.push(q(s, -w)); }
        X.plate(K, S, vane, [0.2 * m, 0.92, 0.3], 0.03, (x, y, ao, e) => { const dx = x - 0.05, dy = y + 0.95, s = sa * dx - ca * dy, d = ca * dx + sa * dy, barb = Math.abs(md((s * 1.4 + Math.abs(d) * 2.2) * 9, 1) - 0.5); parchM(K, s * 3, d * 9, sd, true); K.M.r *= 1.05; K.M.g *= 1.05; K.M.b *= 1.05; if (barb < 0.08) K.M.ao *= 0.82; K.M.rg = 0.6; }); S.unlock();
        K.tube(S, [q(0, 0), q(2.55, 0)], 0.03, 0.012, (t, s2) => { const M = K.M; M.r = 0.85; M.g = 0.8; M.b = 0.66; M.rg = 0.35; M.cc = 0.6; }); S.unlock();
        K.glint(c, -0.28, -0.5, 0.14, 0.7); K.ink(S, INK[L], 0.45); } },
    /* a tall oval mirror in a silver frame: two splayed feet, the frame a beaded silver ring, a crest; the glass reflecting the room */
    mirror: { box: () => [-0.95, -3.85, 0.95, 0.35], mat: { mat: 'glass' }, el: 'light', hp: 2,
      paint(K, S, v, L) { const X = XK(), sd = 71 + v, H = 2.6, cy = -H * 0.55, c = S.c; contact(K, S, 0.65, 0.2, 0.5);
        for (const sx of [-1, 1]) K.tube(S, [[sx * 0.12, -0.42], [sx * 0.32, -0.15], [sx * 0.5, 0]], 0.05, 0.04, (t, s2) => metalM(K, t * 3, s2, sd, L, 0.4)); S.unlock();
        X.disc(K, S, 0, cy, 0.5, H * 0.38, (dx, dy, r) => { const M = K.M; M.mt = 1; M.fr = 0.62 + 0.15 * (1 - (dy + 1) / 2); M.fg = 0.68 + 0.15 * (1 - (dy + 1) / 2); M.fb = 0.8 + 0.12 * (1 - (dy + 1) / 2); M.rg = 0.04; M.cc = 1; }, { bv: 0.06, dome: 0.15 }); S.unlock();
        const ring = []; for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU; ring.push([Math.sin(a) * 0.56, cy - Math.cos(a) * (H * 0.42)]); } K.tube(S, ring, 0.07, 0.07, (t, s2) => { metalM(K, t * 30, s2, sd, L, 0.5); if (md(t * 48, 1) < 0.2) K.M.ao *= 0.8; }); S.unlock();
        K.rev(S, 0, cy + H * 0.42 + 0.02, h => 0.1 - h * 0.15, 0, 0.42, { mat: (u, h) => metalM(K, u * 3, h * 6, sd, L, 0.4) }); S.unlock();
        X.plate(K, S, [[-0.3, cy - H * 0.4], [0, cy - H * 0.4 - 0.32], [0.3, cy - H * 0.4], [0, cy - H * 0.42 + 0.04]], [0, 0.92, 0.38], 0.05, (x, y) => metalM(K, x * 4, y * 4, sd, L, 0.5)); S.unlock();
        K.ball(S, 0, cy - H * 0.4 - 0.38, 0.08, 0.08, (dx, dy) => metalM(K, dx, dy, sd, L, 0.7)); S.unlock();
        c.save(); c.beginPath(); c.ellipse(0, cy, 0.47, H * 0.36, 0, 0, TAU); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineCap = 'round'; c.lineWidth = 0.12; c.beginPath(); c.moveTo(-0.42, cy + 0.25); c.lineTo(0.12, cy - 0.85); c.stroke(); c.lineWidth = 0.05; c.beginPath(); c.moveTo(-0.18, cy + 0.42); c.lineTo(0.36, cy - 0.68); c.stroke(); c.restore();
        K.ink(S, INK[L], 0.42); } },
    /* a silver urn of white lilies: a footed urn (gadrooned belly, a flared lip, two loop handles), five lilies on curving stems */
    silverurn: { box: () => [-0.9, -2.95, 0.9, 0.32], mat: { mat: 'pottery', cols: ['#C9D0DC', '#8E98AA', '#FFFFFF'] }, el: 'water', hp: 2,
      paint(K, S, v, L) { const X = XK(), sd = 81 + v, R = K.R1(91 + v); contact(K, S, 0.5, 0.17, 0.5);
        const prof = h => h < 0.1 ? 0.2 : h < 0.18 ? 0.12 : h < 0.75 ? 0.12 + 0.3 * Math.sin((h - 0.18) / 0.57 * Math.PI * 0.95) : h < 0.9 ? 0.2 : 0.2 + (h - 0.9) * 1.1;
        K.rev(S, 0, 0, prof, 0, 1.02, { mat: (u, h) => { metalM(K, u * 3, h * 5, sd, L, 0.4); if (h > 0.3 && h < 0.7 && Math.abs(md(u * 10, 1) - 0.5) > 0.42) K.M.ao *= 0.75; }, top: true, capMat: () => { const M = K.M; M.r = 0.04; M.g = 0.05; M.b = 0.06; M.rg = 0.4; } }); S.unlock();
        for (const sx of [-1, 1]) { const pts = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI; pts.push([sx * (0.38 + Math.sin(a) * 0.16), -0.85 + (1 - Math.cos(a)) * 0.16]); } K.tube(S, pts, 0.025, 0.025, (t, s2) => metalM(K, t * 4, s2, sd, L, 0.5)); } S.unlock();
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.42, Lh = 0.95 + (i % 2) * 0.25, x1 = Math.cos(a) * Lh * 0.55, y1 = -1.05 + Math.sin(a) * Lh;
          K.tube(S, [[0, -1.0], [x1 * 0.4, -1.3], [x1, y1]], 0.022, 0.018, (t, s2) => { const M = K.M; M.r = 0.18; M.g = 0.36; M.b = 0.2; M.rg = 0.5; }); S.unlock();
          for (let k = 0; k < 5; k++) { const b = k / 5 * TAU + i; X.lump(K, S, x1 + Math.cos(b) * 0.09, y1 + Math.sin(b) * 0.06, 0.1, 0.05, { amp: 0.15, fr: 3, sd: sd + i * 5 + k, bump: 0.2, mat: (dx, dy, ao, e) => { const M = K.M; M.r = 0.94; M.g = 0.94; M.b = 0.92; M.rg = 0.55; M.cc = 0.2; M.ao *= 0.75 + 0.25 * (1 - e); } }); }
          K.ball(S, x1, y1, 0.035, 0.035, () => { const M = K.M; M.r = 0.95; M.g = 0.78; M.b = 0.25; M.rg = 0.5; }); S.unlock(); }
        K.ink(S, INK[L], 0.4); } },
    /* a fluted platinum pillar with a gilt base and capital; a halo floats above it (its glow the GPU's) */
    platpillar: { box: v => [-0.9, -4.65, 0.9, 0.42], mat: { mat: 'stone', cols: ['#E9EEF5', '#B9C2D0', '#FFFFFF'] }, el: 'light', hp: 3,
      paint(K, S, v, L) { const sd = 91 + v, H = 3.1, c = S.c; contact(K, S, 0.7, 0.24, 0.45);
        K.rev(S, 0, 0, h => h < 0.14 ? 0.52 : h < 0.26 ? 0.44 : 0.4, 0, 0.34, { mat: (u, h) => metalM(K, u * 3, h * 6, sd, L, 0.4), top: true, capMat: x => metalM(K, x, 1, sd, L, 0.5) }); S.unlock();
        K.rev(S, 0, -0.32, h => 0.33 - h * 0.012, 0, H - 0.6, { mat: (u, h) => { platM(K, u, h, sd); const fl = Math.abs(md(u / 0.33 * 2.4 + 0.5, 1) - 0.5); K.M.ao *= 0.6 + 0.4 * ss(0.06, 0.2, fl); if (fl < 0.05) K.M.rg = 0.08; } }); S.unlock();
        K.rev(S, 0, -(H - 0.28), h => 0.33 + h * h * 2.6, 0, 0.3, { mat: (u, h) => { metalM(K, u * 3, h * 8, sd + 1, L, 0.4); if (Math.abs(md(u * 8, 1) - 0.5) > 0.4) K.M.ao *= 0.8; } }); S.unlock();
        K.rbox(S, 0, -H + 0.02, 0.58, 0.3, 0, 0.12, 0.03, (f, u, vv) => metalM(K, u * 3, vv * 3, sd + 2, L, 0.5)); S.unlock();
        const hy = -H - 0.8 - (v % 2) * 0.1, ring = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; ring.push([Math.cos(a) * 0.42, hy + Math.sin(a) * 0.13]); } K.tube(S, ring, 0.04, 0.04, (t, s2) => { metalM(K, t * 9, s2, sd, L, 0.7); glowAdd(K.M, E_HOLY, 0.25); }); S.unlock();
        K.glint(c, -0.15, -H * 0.55, 0.14, 0.45); K.ink(S, INK[L], 0.35); } },
    /* a celestial monument: a stepped marble plinth with gilt inlay; above it a faceted crystal of white gold inside a tilted gold
       ring set with pearls (v 0) or a pearl orb inside two crossing rings (v 1); its glow the GPU's */
    angelstatue: { box: () => [-1.75, -4.7, 1.75, 0.5], mat: { mat: 'stone', cols: ['#FBF8F0', '#DCD3BE', '#FFFFFF'] }, el: 'light', hp: 4,
      paint(K, S, v, L) { const X = XK(), sd = 101 + v, c = S.c, cy = -2.45; contact(K, S, 1.2, 0.38, 0.45);
        K.rev(S, 0, 0, h => 0.95, 0, 0.32, { mat: (u, h) => { marbleL(K, u * 2, h * 2, sd, L); if (Math.abs(h - 0.22) < 0.025) metalM(K, u * 4, h, sd, L, 0.4); }, top: true, capMat: (x, z, ao, q, ph, x2, ey) => { marbleL(K, x * 2, (ey || 0) * 2, sd + 1, L); if (Math.abs(Math.hypot(x / 0.95, ey || 0) - 0.84) < 0.03) metalM(K, x * 4, 0, sd, L, 0.4); } }); S.unlock();
        K.rev(S, 0, -0.32, h => 0.7, 0, 0.3, { mat: (u, h) => marbleL(K, u * 2 + 3, h * 2, sd, L), top: true, capMat: (x, z, ao, q, ph, x2, ey) => { marbleL(K, x * 2, (ey || 0) * 2, sd + 2, L); if (Math.abs(Math.hypot(x / 0.7, ey || 0) - 0.82) < 0.035) metalM(K, x * 4, 0, sd, L, 0.4); } }); S.unlock();
        const ringArc = (front, rx, ry, rot, w) => { const pts = []; for (let i = 0; i <= 24; i++) { const a = (front ? 0 : Math.PI) + i / 24 * Math.PI, x = Math.cos(a) * rx, y = Math.sin(a) * ry; pts.push([x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); } K.tube(S, pts, w, w, (t, s2) => metalM(K, t * 12, s2, sd, L, 0.5)); S.unlock();
          for (const a of front ? [0.7, 2.2] : [3.9, 5.3]) { const x = Math.cos(a) * rx, y = Math.sin(a) * ry; K.ball(S, x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot), 0.1, 0.1, (dx, dy) => { const M = K.M; M.r = 0.95; M.g = 0.93; M.b = 0.9; M.rg = 0.12; M.cc = 1; }); } S.unlock(); };
        if (v % 2 === 0) { ringArc(false, 1.45, 0.46, -0.35, 0.06);
          const Rr = 0.88, top = cy - 1.35, bot = cy + 1.05, P = [0, 1, 2, 3, 4, 5].map(k => { const a = -Math.PI / 2 + k / 6 * TAU + 0.3; return [Math.cos(a) * Rr, cy + Math.sin(a) * Rr * 0.32]; });
          const face = (a, b, apex, nz) => { const mx = (P[a][0] + P[b][0]) / 2, my = (P[a][1] + P[b][1]) / 2 - cy; X.plate(K, S, [P[a], P[b], [0, apex]], [mx * 1.1, 0.75 + my * 0.5, nz], 0.015, (x, y) => { const M = K.M; M.mt = 0.6; M.r = 0.95; M.g = 0.86; M.b = 0.6; M.fr = 1.0; M.fg = 0.9; M.fb = 0.62; M.rg = 0.06; M.cc = 1; glowAdd(M, E_HOLY, 0.12); }); };
          for (const [a, b] of [[1, 2], [2, 3], [3, 4]]) face(a, b, bot, -0.55); for (const [a, b] of [[4, 5], [5, 0], [0, 1]]) face(a, b, top, 0.7); for (const [a, b] of [[1, 2], [2, 3], [3, 4]]) face(a, b, top, 0.55); S.unlock();
          ringArc(true, 1.45, 0.46, -0.35, 0.06); }
        else { ringArc(false, 1.2, 0.36, 0.6, 0.05); ringArc(false, 1.45, 0.46, -0.35, 0.06);
          K.ball(S, 0, cy, 0.92, 0.92, (dx, dy) => { const M = K.M, ir = 0.5 + 0.5 * Math.sin((dx * 3 + dy * 2) * 2.2); M.r = 0.9 + 0.06 * ir; M.g = 0.88 + 0.04 * (1 - ir); M.b = 0.96; M.rg = 0.18; M.cc = 1; glowAdd(M, [0.8, 0.7, 1.0], 0.08); }); S.unlock();
          ringArc(true, 1.2, 0.36, 0.6, 0.05); ringArc(true, 1.45, 0.46, -0.35, 0.06); }
        K.glint(c, -0.3, cy - 0.55, 0.22, 0.7); K.ink(S, INK[L], 0.3); } },
    /* a golden arch with a halo hung in it and light filling it (the light's living part the GPU's) */
    haloarch: { box: () => [-1.55, -4.45, 1.55, 0.45], mat: { mat: 'iron', cols: ['#E2B64A', '#8A6A20', '#FFF1B8'] }, el: 'light', hp: 3,
      paint(K, S, v, L) { const sd = 111 + v, w = 1.15, H = 2.6, c = S.c; contact(K, S, 1.35, 0.32, 0.45);
        c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, -H - w, 0, 0); g.addColorStop(0, 'rgba(255,246,214,.32)'); g.addColorStop(1, 'rgba(255,246,214,.04)'); c.fillStyle = g; c.beginPath(); c.moveTo(-w * 0.82, 0); c.lineTo(-w * 0.82, -H); c.arc(0, -H, w * 0.82, Math.PI, 0); c.lineTo(w * 0.82, 0); c.closePath(); c.fill(); c.restore();
        for (const sx of [-1, 1]) K.rbox(S, sx * (w - 0.1), 0.02, 0.18, 0.2, 0, H, 0.05, (f, u, vv) => { metalM(K, u * 3, vv * 2, sd + sx, L, 0.4); if (f === 'f' && Math.abs(md((u - sx * (w - 0.1)) * 14 + 0.5, 1) - 0.5) < 0.12) K.M.ao *= 0.78; if (vv < 0.2 || (vv > H - 0.22 && vv < H - 0.1)) K.M.rg *= 0.6; }); S.unlock();
        const arc = []; for (let i = 0; i <= 24; i++) { const a = Math.PI + i / 24 * Math.PI; arc.push([Math.cos(a) * (w - 0.1), -H + Math.sin(a) * (w - 0.1)]); } K.tube(S, arc, 0.2, 0.2, (t, s2) => { metalM(K, t * 10, s2, sd, L, 0.4); if (Math.abs(md(t * 12, 1) - 0.5) > 0.44) K.M.ao *= 0.75; }); S.unlock();
        K.ball(S, 0, -H - w + 0.1, 0.16, 0.2, (dx, dy) => { const M = K.M; M.r = 1; M.g = 0.96; M.b = 0.86; M.rg = 0.08; M.cc = 1; glowAdd(M, E_HOLY, 0.35); }); S.unlock();
        const hy = -H * 0.62, ring = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; ring.push([Math.cos(a) * 0.5, hy + Math.sin(a) * 0.16]); } K.tube(S, ring, 0.045, 0.045, (t, s2) => { metalM(K, t * 9, s2, sd, L, 0.7); glowAdd(K.M, E_HOLY, 0.3); }); S.unlock();
        K.ink(S, INK[L], 0.3); } },
    /* a golden censer on three legs, a white-gold holy flame in its bowl (painted soft; its living fire the GPU's) */
    censer: { box: () => [-0.85, -2.7, 0.85, 0.38], mat: { mat: 'iron', cols: ['#E2B64A', '#8A6A20', '#FFF1B8'] }, el: 'fire', hp: 2,
      paint(K, S, v, L) { const sd = 121 + v, c = S.c; contact(K, S, 0.6, 0.2, 0.45);
        for (const sx of [-1, 0, 1]) K.tube(S, [[sx * 0.38, 0.02 - (sx ? 0 : 0.06)], [sx * 0.3, -0.35], [sx * 0.2, -0.72]], 0.04, 0.035, (t, s2) => metalM(K, t * 4, s2, sd + sx, L, 0.4)); S.unlock();
        K.ball(S, 0, 0.0, 0.05, 0.05, (dx, dy) => metalM(K, dx, dy, sd, L, 0.5));
        K.rev(S, 0, -0.62, h => 0.56 * Math.sin(Math.min(1, h / 0.36) * Math.PI * 0.5) + 0.03, 0, 0.36, { mat: (u, h) => { metalM(K, u * 3, h * 6, sd, L, 0.4); if (Math.abs(md(u * 7, 1) - 0.5) > 0.44) K.M.ao *= 0.78; } }); S.unlock();
        K.rev(S, 0, -0.97, h => 0.6, 0, 0.06, { mat: (u, h) => metalM(K, u * 3, h, sd + 1, L, 0.6), top: true, capMat: (x, z, ao, q, ph, x2, ey) => { const M = K.M; if (Math.hypot(x / 0.6, ey || 0) < 0.85) { M.r = 0.9; M.g = 0.84; M.b = 0.62; M.rg = 0.9; glowAdd(M, E_HOLY, 0.6); } else metalM(K, x, 0, sd, L, 0.6); } }); S.unlock();
        c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, -1.45, 0, 0, -1.45, 0.75); g.addColorStop(0, 'rgba(255,240,200,.35)'); g.addColorStop(1, 'rgba(255,230,170,0)'); c.fillStyle = g; c.fillRect(-0.75, -2.2, 1.5, 1.5); c.restore();
        c.save(); c.beginPath(); c.moveTo(-0.2, -1.0); c.quadraticCurveTo(-0.26, -1.36, -0.04, -1.72); c.quadraticCurveTo(0.02, -1.5, 0.06, -1.62); c.quadraticCurveTo(0.24, -1.3, 0.2, -1.0); c.closePath(); const f2 = c.createLinearGradient(0, -1.72, 0, -1.0); f2.addColorStop(0, 'rgba(255,255,255,.2)'); f2.addColorStop(0.5, 'rgba(255,244,210,.75)'); f2.addColorStop(1, 'rgba(255,214,130,.9)'); c.fillStyle = f2; c.fill(); c.restore();
        K.ink(S, INK[L], 0.3); } },
    /* a bank of cloud resting on the stair: soft puffs lit through, a violet-grey shade beneath */
    cloudbank: { box: () => [-1.7, -1.6, 1.7, 0.42], mat: { mat: 'cloud' }, el: 'water', hp: 1,
      paint(K, S, v, L) { const X = XK(), sd = 131 + v, R = K.R1(141 + v); contact(K, S, 1.4, 0.32, 0.25);
        const puffs = [[-0.9, -0.3, 0.5], [-0.35, -0.6, 0.62], [0.3, -0.55, 0.58], [0.85, -0.3, 0.45], [0, -0.22, 0.5], [-0.55, -0.12, 0.4], [0.55, -0.1, 0.42]].map(p => [p[0] * (v % 2 ? -1 : 1), p[1], p[2]]);
        puffs.sort((a, b) => a[1] - b[1]); for (const [x, y, r] of puffs) X.lump(K, S, x, y, r, r * 0.82, { amp: 0.1, fr: 3, sd: sd + x * 9, bump: 0.25, leaf: 4, mat: (dx, dy, ao, e) => cloudM(K, dx + x, dy + y, sd, 1 - e) }); S.unlock(); void R; } },
    /* a golden harp with shining strings: a carved base, a pillar, the curved neck and the sound box; its strings shimmer (GPU) */
    harp: { box: () => [-0.95, -3.25, 0.95, 0.38], mat: { mat: 'wood' }, el: 'light', hp: 2,
      paint(K, S, v, L) { const sd = 151 + v, m = v % 2 ? -1 : 1, c = S.c; contact(K, S, 0.6, 0.2, 0.45);
        K.rbox(S, 0, 0.02, 0.42, 0.24, 0, 0.24, 0.05, (f, u, vv) => metalM(K, u * 3, vv * 3, sd, L, 0.4)); S.unlock();
        const pts = []; for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push([m * (-0.3 + 0.85 * u * u * (1.2 - u * 0.4) - (u > 0.85 ? (u - 0.85) * 2 : 0)), -0.25 - 2.05 * Math.sin(u * Math.PI * 0.55) - 0.25 * u]); }
        K.tube(S, [[-0.3 * m, -0.24], [-0.3 * m, -2.3]], 0.08, 0.07, (t, s2) => { metalM(K, t * 6, s2, sd + 1, L, 0.4); if (Math.abs(md(t * 9, 1) - 0.5) > 0.42) K.M.ao *= 0.8; }); S.unlock();
        K.tube(S, [[-0.3 * m, -2.3], [0.1 * m, -2.55], [0.55 * m, -2.05], [0.42 * m, -1.1], [0.3 * m, -0.25]], 0.075, 0.1, (t, s2) => metalM(K, t * 6, s2, sd + 2, L, 0.5)); S.unlock();
        K.ball(S, -0.3 * m, -2.38, 0.11, 0.11, (dx, dy) => metalM(K, dx, dy, sd, L, 0.6)); S.unlock();
        c.save(); c.lineCap = 'round'; for (let i = 1; i < 7; i++) { const u = i / 7, x = m * (-0.3 + u * 0.62), top = -2.3 + (Math.sin(u * Math.PI) * -0.22 + u * 0.55); const g = c.createLinearGradient(0, top, 0, -0.3); g.addColorStop(0, 'rgba(255,250,230,.95)'); g.addColorStop(1, 'rgba(230,200,140,.8)'); c.strokeStyle = g; c.lineWidth = 0.018; c.beginPath(); c.moveTo(x, -0.3); c.lineTo(x, top); c.stroke(); } c.restore();
        void pts; K.glint(c, 0.1 * m, -2.5, 0.12, 0.6); K.ink(S, INK[L], 0.35); } },
  };
  const KINDS = ['bookcase', 'libladder', 'lectern', 'bookstack', 'candelabra', 'inkwell', 'mirror', 'silverurn', 'platpillar', 'angelstatue', 'haloarch', 'censer', 'cloudbank', 'harp'];

  /* ======================= the cache and the drawing ======================= */
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0; const CAP = 80, TCAP = 96;
  function paint(name, v, P, L) { const B = BP(); if (!B) return null; const K = B.kit, D = DEF[name]; if (!D) return null; const b = D.box(v), t0 = now(); let S = null;
    try { S = K.surface(b[0], b[1], b[2], b[3], P); lit(K, L, () => { D.paint(K, S, v, L); S.unlock(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('LIB_PROPS', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  function sprite(name, v, P, force, L) { if (!DEF[name] || !BP()) return null; L = L || 'cat'; P = Math.max(8, Math.min(CAP, Math.round(P || BASE || 48))); const key = name + '|' + v + '|' + L + '|' + P; let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 12) return null;
    s = paint(name, v, P, L); if (s) { if (CACHE.size > 160) release(true); CACHE.set(key, s); } return s; }
  const qP = P => Math.max(8, Math.round(Math.exp(Math.round(Math.log(P) * 10) / 10)));
  function pic(c, name, v, T, L, sc) { let P = Math.min(CAP, qP(T * (sc || 1) * kOf(c))); if (BASE && P <= BASE * 1.1 && P >= BASE * 0.5) P = BASE;
    let s = sprite(name, v, P, false, L); if (!s) { const pre = name + '|' + v + '|' + L + '|'; for (const [k, s2] of CACHE) if (k.startsWith(pre)) { s = s2; break; } } if (!s) STATS.misses++; return s; }
  const put = (c, s, Xs, Ys, T, sx, sy, rot) => { const f = T / s.P; c.save(); c.translate(Xs, Ys); if (rot) c.rotate(rot); if ((sx || 1) !== 1 || (sy || 1) !== 1) c.scale(sx || 1, sy || 1); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); c.restore(); STATS.draws++; };
  // a piece of a trial or a prop at a screen spot (its feet), T the tile in px: false when it could not be drawn (the caller draws its old 2D)
  function piece(c, name, v, Xs, Ys, T, o) { if (off() || !DEF[name]) return false; o = o || {}; const L = o.L || (LIVE && LIVE.L) || 'cat', s = pic(c, name, v, T, L); if (!s) return false; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; put(c, s, Xs, Ys, T * (o.s || 1), (o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1, o.rot); c.restore(); STATS.pieces++; return true; }

  /* ======================= textures that wrap (the lands) ======================= */
  const TEX = new Map(); let FA = 1, GK = null, GL = 'cat', TBASE = 0;
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
  // the field materials (periodic noise: they repeat with the texture)
  function marbleT(x, y, sd, tint, vc, f) { const M = GK.M, k = f || 1, w = wn(x, y, 0.6 * k, sd) * 0.5 + wn(x, y, 1.7 * k, sd + 1) * 0.3 + wn(x, y, 4 * k, sd + 5) * 0.2, x2 = x + 0.8 * wn(x, y, 0.9 * k, sd + 6), y2 = y + 0.8 * wn(x, y, 0.9 * k, sd + 7);
    const n = wn(x2, y2, 1.2 * k, sd + 2) * 0.55 + wn(x2, y2, 2.6 * k, sd + 3) * 0.3 + wn(x2, y2, 6 * k, sd + 8) * 0.15, vein = ss(0.022, 0.0, Math.abs(n - 0.5)) * ss(0.3, 0.62, wn(x, y, 0.8 * k, sd + 9)) * 0.8 + ss(0.008, 0.0, Math.abs(wn(x2 * 1.3, y2 * 1.3, 5 * k, sd + 4) - 0.5)) * 0.3;
    M.r = lerp(tint[0] * (0.92 + 0.1 * w), vc[0], vein); M.g = lerp(tint[1] * (0.92 + 0.1 * w), vc[1], vein); M.b = lerp(tint[2] * (0.92 + 0.1 * w), vc[2], vein); M.rg = 0.16; M.cc = 0.55; return vein; }
  function inlayT(x, y, sd, L) { const M = GK.M, s = wn(x, y, 6, sd); M.mt = 1; if (L === 'silver') { M.fr = 0.78 + 0.1 * s; M.fg = 0.81 + 0.1 * s; M.fb = 0.88 + 0.08 * s; } else { M.fr = 0.9 + 0.1 * s; M.fg = 0.66 + 0.08 * s; M.fb = 0.28 + 0.06 * s; } M.rg = 0.2 + 0.1 * s; M.r = M.g = M.b = 0; }
  /* ---- the floors (x, y in tiles inside the FN-square; mode 0 the height, 1 the material) ---- */
  // the Catalogue: warm parchment-marble flagstones (2 x 1.5, in a running bond), each its own tone, polished and worn paler in
  // the middle, soft veins; gilt strips inlaid in the joints with a gilt stud at every corner; old ink spills (glossy violet-black)
  // and hairline cracks
  function catFloor(x, y, mode) { const M = GK.M, ri = Math.floor(y / 1.5), fy = y - ri * 1.5, xx = x + (md(ri, 2) ? 1 : 0), si = Math.floor(xx / 2), fx = xx - si * 2, sid = md(si, 3) + md(ri, 4) * 3;
    const dj = Math.min(fx, 2 - fx, fy, 1.5 - fy), joint = ss(0.045, 0.02, dj), strip = ss(0.022, 0.012, dj), cr = Math.min(Math.hypot(fx, fy), Math.hypot(2 - fx, fy), Math.hypot(fx, 1.5 - fy), Math.hypot(2 - fx, 1.5 - fy)), stud = ss(0.085, 0.065, cr);
    const spill = ss(0.79, 0.84, pfbm(x * 0.7 + 3, y * 0.7, 4.2, 211)), crack = ss(0.02, 0.004, Math.abs(pvn(x * 1.6, y * 1.6, 9.6, 213) - 0.5)) * ss(0.6, 0.7, pvn(x * 0.9, y * 0.9, 5.4, 215));
    let h = 0.02 * ss(0.02, 0.07, dj) + 0.012 * stud - 0.004 * crack + 0.002 * pvn(x * 9, y * 9, 54, 217); if (strip > 0.5) h = 0.008;
    if (!mode) return h;
    if (stud > 0.5) { inlayT(x, y, 219, 'cat'); M.rg = 0.16; return h; }
    if (strip > 0.5) { inlayT(x, y, 219, 'cat'); M.ao = 0.8; return h; }
    const tone = 0.9 + 0.18 * hh(sid, 1, 221), vein = marbleT(x * 0.8 + sid * 1.3, y * 0.8, 223 + md(sid, 5), [0.98 * tone, 0.92 * tone, 0.7 * tone], [0.7, 0.56, 0.36]);
    const wear = ss(0.5, 0.2, dj) * 0.5; M.rg = lerp(0.2, 0.42, wear); M.cc = lerp(0.5, 0.25, wear); M.ao *= 0.78 + 0.22 * ss(0.02, 0.08, dj); if (joint > 0.4) { M.ao *= 0.5; M.cc = 0.1; } void vein;
    if (spill > 0.02) { M.r = lerp(M.r, 0.04, spill * 0.92); M.g = lerp(M.g, 0.028, spill * 0.92); M.b = lerp(M.b, 0.06, spill * 0.92); M.rg = lerp(M.rg, 0.06, spill); M.cc = lerp(M.cc, 1, spill); glowAdd(M, E_INK, 0.04 * spill); }
    if (crack > 0.2) M.ao *= 1 - crack * 0.45; return h; }
  // the Bindery: a checker of white and dove-grey marble slabs (2 x 2), mirror-polished, cool veins; silver strips in the joints
  // and a silver diamond set at each crossing
  function silverFloor(x, y, mode) { const M = GK.M, pi = Math.floor(x / 2), pj = Math.floor(y / 2), fx = x - pi * 2, fy = y - pj * 2, dark = md(pi + pj, 2) === 1, sid = md(pi, 3) + md(pj, 3) * 3;
    const dj = Math.min(fx, 2 - fx, fy, 2 - fy), strip = ss(0.024, 0.014, dj), joint = ss(0.04, 0.02, dj), cx = fx > 1 ? 2 - fx : fx, cy = fy > 1 ? 2 - fy : fy, dia = ss(0.2, 0.17, cx + cy), diaE = ss(0.2, 0.16, cx + cy) - ss(0.14, 0.11, cx + cy);
    let h = 0.02 * ss(0.02, 0.06, dj) + 0.002 * pvn(x * 10, y * 10, 60, 311); if (strip > 0.5 || dia > 0.5) h = 0.012 + 0.006 * diaE;
    if (!mode) return h;
    if (dia > 0.5 || strip > 0.5) { inlayT(x, y, 313, 'silver'); if (diaE > 0.5) M.rg = 0.08; return h; }
    marbleT(x * 0.7 + sid, y * 0.7, 315 + sid, dark ? [0.74, 0.76, 0.82] : [0.95, 0.96, 0.98], dark ? [0.36, 0.38, 0.46] : [0.6, 0.64, 0.74]); M.rg = 0.1; M.cc = 0.85; M.ao *= 0.8 + 0.2 * ss(0.02, 0.07, dj); if (joint > 0.4) { M.ao *= 0.6; M.cc = 0.2; }
    return h; }
  // the Ascent: warm white marble with pale gold veins (1.5 squares), broad gilt borders in the joints, a gilt sunburst set at every
  // other crossing
  function holyFloor(x, y, mode) { const M = GK.M, pi = Math.floor(x / 1.5), pj = Math.floor(y / 1.5), fx = x - pi * 1.5, fy = y - pj * 1.5, sid = md(pi, 4) + md(pj, 4) * 4;
    const dj = Math.min(fx, 1.5 - fx, fy, 1.5 - fy), strip = ss(0.04, 0.03, dj), joint = ss(0.055, 0.04, dj), qx = fx > 0.75 ? 1.5 - fx : fx, qy = fy > 0.75 ? 1.5 - fy : fy, cr = Math.hypot(qx, qy), sun = md(Math.floor((x + 0.75) / 1.5) + Math.floor((y + 0.75) / 1.5), 2) === 0;
    const ray = sun ? ss(0.3, 0.26, cr) * (Math.abs(md(Math.atan2(qy, qx) / TAU * 32, 1) - 0.5) < 0.18 ? 1 : 0) + ss(0.1, 0.08, cr) : 0;
    let h = 0.02 * ss(0.03, 0.08, dj) + 0.002 * pvn(x * 10, y * 10, 60, 411); if (strip > 0.5) h = 0.014; if (ray > 0.5) h = 0.022;
    if (!mode) return h;
    if (strip > 0.5 || ray > 0.5) { inlayT(x, y, 413, 'holy'); if (ray > 0.5) M.rg = 0.12; return h; }
    marbleT(x * 0.7 + sid * 0.9, y * 0.7, 415 + md(sid, 7), [0.93, 0.9, 0.84], [0.78, 0.6, 0.3]); M.rg = 0.14; M.cc = 0.7; M.ao *= 0.82 + 0.18 * ss(0.04, 0.1, dj); if (joint > 0.4) M.ao *= 0.8;
    return h; }
  /* ---- the walls' faces (x across, y down 0..h; mode as above): a shelf of book spines under a cornice ---- */
  function shelfBank(L) { const Hb = 0.55; return (x, y, mode) => { const M = GK.M, bi = Math.floor(x / 0.11 + Math.floor(hh(Math.floor(x / 0.33), 3, 501) * 2) * 0.5), fx = md(x / 0.11 + Math.floor(hh(Math.floor(x / 0.33), 3, 501) * 2) * 0.5, 1), top = 0.12 + hh(md(bi, 36), 1, 503) * 0.16, corn = y < 0.075, shelf = y > 0.5;
    const spine = Math.sqrt(Math.max(0, 1 - Math.pow(fx * 2 - 1, 2))), inB = !corn && !shelf && y > top;
    const h = corn ? 0.035 + (y > 0.045 && y < 0.06 ? 0.008 : 0) : shelf ? 0.03 : inB ? 0.012 * spine + 0.006 : 0.0;
    if (!mode) return h;
    if (corn) { if (y > 0.045 && y < 0.06) inlayT(x, y, 505, L); else { const wM = GK.M; woodLT(x, y, 507, L); wM.ao *= 0.9; } return h; }
    if (shelf) { woodLT(x, y, 509, L); M.ao *= 0.85; return h; }
    if (!inB) { woodLT(x * 0.5, y, 511, L); M.r *= 0.35; M.g *= 0.35; M.b *= 0.35; M.ao = 0.4; M.cc = 0; return h; }
    const col = BOOKS[L][Math.floor(hh(md(bi, 36), 2, 513) * 8)], r = (y - top) / (0.5 - top), g = wn(x, y, 30, 515);
    M.r = col[0] * (0.8 + 0.25 * g); M.g = col[1] * (0.8 + 0.25 * g); M.b = col[2] * (0.8 + 0.25 * g); M.rg = 0.45; M.cc = 0.2; M.ao *= 0.6 + 0.4 * spine;
    if (Math.abs(r - 0.12) < 0.04 || Math.abs(r - 0.85) < 0.04) inlayT(x, y, 517, L); else if (hh(md(bi, 36), 4, 519) < 0.45 && r > 0.4 && r < 0.58) { M.r *= 0.3; M.g *= 0.3; M.b *= 0.3; }
    M.ao *= 0.7 + 0.3 * ss(0, 0.15, r); void Hb; return h; }; }
  function woodLT(x, y, sd, L) { const M = GK.M, gr = wn(x, y * 0.2, 12, sd) * 0.6 + wn(x, y, 3, sd + 1) * 0.4;
    if (L === 'silver') { M.r = 0.74 * (0.94 + 0.06 * gr); M.g = 0.77 * (0.94 + 0.06 * gr); M.b = 0.84 * (0.94 + 0.06 * gr); M.rg = 0.26; M.cc = 0.7; }
    else if (L === 'holy') { M.r = 0.88 * (0.94 + 0.06 * gr); M.g = 0.82 * (0.94 + 0.06 * gr); M.b = 0.7 * (0.94 + 0.06 * gr); M.rg = 0.3; M.cc = 0.6; }
    else { M.r = 0.2 + 0.12 * gr; M.g = 0.085 + 0.05 * gr; M.b = 0.055 + 0.03 * gr; M.rg = 0.32; M.cc = 0.5; } }
  // the wall tops: the carcass's top boards seen from above (planks along x, a gilt edge moulding at the front)
  function boardRoof(L) { return (x, y, mode) => { const M = GK.M, pj = Math.floor(y / 0.5), fy = y - pj * 0.5, gap = ss(0.02, 0.008, Math.min(fy, 0.5 - fy)), h = 0.015 * (1 - gap); if (!mode) return h;
    if (L === 'holy' || L === 'silver') { marbleT(x, y, 601, MARB[L][0], MARB[L][1]); if (gap > 0.5) inlayT(x, y, 603, L); return h; }
    woodLT(x + pj * 1.7, y * 4, 605 + md(pj, 4), L); if (gap > 0.4) M.ao *= 0.4; return h; }; }
  // the island's edge over the drop: the floor slab's lip, a gilt band, then the page block (fine cream layers) torn ragged, ink
  // running off it in drips into the void (the Ascent's: white pages fraying into cloud)
  function pageCliff(L) { return (x, y, mode) => { const M = GK.M, lip = y < 0.1, band = y >= 0.1 && y < 0.15, tear = 0.5 + 0.22 * pvn(x * 2, 0.5, WN * 2, 701) + 0.05 * pvn(x * 6, 0.5, WN * 6, 703), drip = Math.pow(ss(0.62, 0.92, pvn(x * 3, 0.5, WN * 3, 705)), 2), dEnd = tear + 0.1 + drip * 0.5, dW = ss(0.05, 0.0, Math.abs(md(x * 3, 1) - 0.5) - 0.04) * (drip > 0.02 ? 1 : 0);
    const layer = md(y * 38 + pvn(x * 2, y * 2, 8, 707) * 2, 1), h = lip ? 0.04 : band ? 0.03 : 0.015 * ss(0.3, 0.1, Math.abs(layer - 0.5)); if (!mode) return h;
    if (lip) { if (L === 'cat') { marbleT(x, y, 709, MARB.cat[0], MARB.cat[1]); } else marbleT(x, y, 709, MARB[L][0], MARB[L][1]); M.ao *= 0.9; return h; }
    if (band) { inlayT(x, y, 711, L); return h; }
    FA = ss(tear + 0.05, tear - 0.06, y); const ink = y > tear - 0.08 && dW > 0.2 ? ss(tear - 0.08, tear + 0.02, y) : 0;
    if (FA < 0.5 && ink > 0) { FA = ss(dEnd, dEnd - 0.25, y) * dW; }
    if (L === 'holy') { parchM2(true); M.ao *= 0.8 + 0.2 * ss(0.3, 0.6, Math.abs(layer - 0.5)); M.er += 0.1 * ss(0.4, 1, y); M.eg += 0.1 * ss(0.4, 1, y); M.eb += 0.12 * ss(0.4, 1, y); return h; }
    parchM2(false); M.ao *= (0.72 + 0.28 * ss(0.3, 0.6, Math.abs(layer - 0.5))) * (1 - 0.45 * ss(0.2, 0.9, y));
    const st = Math.max(ink, ss(tear - 0.25, tear, y) * 0.6 * dW); if (st > 0) { M.r = lerp(M.r, 0.03, st); M.g = lerp(M.g, 0.02, st); M.b = lerp(M.b, 0.05, st); M.rg = lerp(M.rg, 0.05, st); M.cc = st; glowAdd(M, E_INK, 0.06 * st); }
    if (L === 'silver') { M.r *= 0.95; M.b *= 1.05; } return h; }; }
  function parchM2(white) { const M = GK.M; if (white) { M.r = 0.94; M.g = 0.92; M.b = 0.88; } else { M.r = 0.84; M.g = 0.74; M.b = 0.55; } M.rg = 0.85; }
  // the bridges: a closed book's cover laid across the drop: leather, a double gilt fillet along each long edge, a raised band and
  // a gilt lozenge alternating every tile
  const BRC = { cat: [0.36, 0.08, 0.16], silver: [0.1, 0.14, 0.3], holy: [0.92, 0.88, 0.78] };
  function coverBridge(L) { return (x, y, mode) => { const M = GK.M, col = BRC[L], band = ss(0.1, 0.085, Math.abs(md(x, 2) - 1)), fil = Math.min(Math.abs(y - 0.18), Math.abs(y - 0.22), Math.abs(y - 0.78), Math.abs(y - 0.82)), fl = ss(0.012, 0.004, fil), lx = Math.abs(md(x, 2) - 0.0), lz = Math.abs(md(x + 1, 2) - 1) * 1.0 + Math.abs(y - 0.5) * 1.2, loz = ss(0.2, 0.18, lz) - ss(0.15, 0.13, lz) + ss(0.05, 0.03, lz);
    const g = wn(x, y, 20, 801), h = 0.012 * band - 0.004 * fl - 0.003 * loz + 0.002 * g; void lx; if (!mode) return h;
    M.r = col[0] * (0.8 + 0.3 * g); M.g = col[1] * (0.8 + 0.3 * g); M.b = col[2] * (0.8 + 0.3 * g); M.rg = 0.5; M.cc = 0.2; if (band > 0.3) { M.r *= 0.8; M.g *= 0.8; M.b *= 0.8; M.ao *= 0.9 + 0.1 * band; }
    if (fl > 0.4 || loz > 0.4) inlayT(x, y, 803, L === 'silver' ? 'silver' : 'cat'); return h; }; }
  // its underside over the drop: the page block (cream lines), the back cover, a soft shadow fading away
  function pageUnder(L) { return (x, y, mode) => { const M = GK.M; if (y > 0.34) { FA = 0; return 0; } const pg = y < 0.2, h = pg ? 0.01 * ss(0.3, 0.1, Math.abs(md(y * 60, 1) - 0.5)) : 0.02; if (!mode) return h;
    if (pg) { parchM2(L === 'holy'); M.ao *= 0.8 + 0.2 * ss(0.3, 0.1, Math.abs(md(y * 60, 1) - 0.5)); return h; } FA = ss(0.34, 0.27, y); const col = BRC[L]; M.r = col[0] * 0.7; M.g = col[1] * 0.7; M.b = col[2] * 0.7; M.rg = 0.5; M.ao = 0.7; return h; }; }
  const TDEF = {};
  for (const L of ['cat', 'silver', 'holy']) {
    TDEF['floor:' + L] = { w: FN, h: FN, L, fn: () => (L === 'cat' ? catFloor : L === 'silver' ? silverFloor : holyFloor), o: { wrap: true, wrapY: true, bump: 2.0 } };
    TDEF['bank:' + L] = { w: WN, h: 0.55, L, fn: () => shelfBank(L), o: { wrap: true, face: true, bump: 2.2 } };
    TDEF['roof:' + L] = { w: WN, h: WN, L, fn: () => boardRoof(L), o: { wrap: true, wrapY: true, bump: 1.4 } };
    TDEF['cliff:' + L] = { w: WN, h: 1.25, L, fn: () => pageCliff(L), o: { wrap: true, face: true, bump: 2.0 } };
    TDEF['bridge:' + L] = { w: 2, h: 1, L, fn: () => coverBridge(L), o: { wrap: true, bump: 1.6 } };
    TDEF['bunder:' + L] = { w: 2, h: 0.4, L, fn: () => pageUnder(L), o: { wrap: true, face: true } }; }
  // (the arenas' floor grain: the land's stone without its joints, laid over a fight's own floor, 20zb4)
  for (const L of ['cat', 'holy']) TDEF['grain:' + L] = { w: FN, h: FN, L, fn: () => (x, y, mode) => { if (!mode) return 0.004 * pvn(x * 6, y * 6, 36, 251); marbleT(x * 0.8, y * 0.8, 253, MARB[L][0], MARB[L][1]); GK.M.rg = 0.3; return 0; }, o: { wrap: true, wrapY: true, bump: 2 } };
  function texJobs(name, P) { const B = BP(), D = TDEF[name]; if (!B || !D) return []; P = Math.max(8, Math.min(TCAP, Math.round(P))); const key = name + '|' + P; if (TEX.has(key)) return [];
    const K = B.kit; let F = null, t0 = 0; const run = f => () => { if (TEX.has(key)) return; try { GK = K; GL = D.L; DOM = D.w; lit(K, D.L, f); } catch (e) { F = null; } GK = null; }, jobs = [];
    jobs.push(run(() => { t0 = now(); F = fieldBegin(K, D.w, D.h, P, D.fn(), D.o); }));
    const H = Math.ceil(D.h * P), n = Math.max(1, Math.ceil(D.w * P * H / 24000)), band2 = Math.ceil(H / n);
    for (let i = 0; i < n; i++) jobs.push(run(() => { if (F) F.heights(i * band2, (i + 1) * band2); }));
    for (let i = 0; i < n; i++) jobs.push(run(() => { if (F) F.shade(i * band2, (i + 1) * band2); }));
    jobs.push(run(() => { if (!F) return; const cv = F.finish(); F = null; if (!texOK(name, cv)) return; TEX.set(key, { cv, P }); STATS.tex++; STATS.texMs += now() - t0; }));
    return jobs; }
  function tex(name, P) { const B = BP(), D = TDEF[name]; if (!B || !D) return null; P = Math.max(8, Math.min(TCAP, Math.round(P))); const key = name + '|' + P; let t = TEX.get(key); if (t) return t;
    if (TBASE) { const t2 = TEX.get(name + '|' + TBASE); if (t2) return t2; }
    const t0 = now(), K = B.kit; let cv = null; try { GK = K; GL = D.L; DOM = D.w; lit(K, D.L, () => { const F = fieldBegin(K, D.w, D.h, P, D.fn(), D.o); F.heights(0, F.Hh); F.shade(0, F.Hh); cv = F.finish(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('LIB_PROPS tex', name, e); cv = null; } GK = null;
    if (!cv || !texOK(name, cv)) return null; t = { cv, P }; TEX.set(key, t); STATS.tex++; STATS.texMs += now() - t0; return t; }
  const EMPTY = {};
  const texOK = (name, cv) => { if (!/^(floor|roof|bank)/.test(name)) return true; try { const d = cv.getContext('2d', { willReadFrequently: true }).getImageData(cv.width >> 1, cv.height >> 1, 1, 1).data; if (d[3] > 0) return true; } catch (e) { return true; } STATS.empty++; EMPTY[name] = (EMPTY[name] || 0) + 1; return EMPTY[name] > 2; };
  void GL;

  /* ======================= the lands: each biome's own floor, walls, wall tops, cliffs, bridges ======================= */
  // world-space washes (continuous across tiles): soft pools of the land's light laid over the floor (candlelight and ink
  // shadow; moonlight; heaven's gold)
  const WASH = { catalogue: [['14,8,26', 0.12, 0.3], ['255,190,110', 0.06, 0.46]], binding: [['18,24,44', 0.05, 0.28], ['205,218,255', 0.05, 0.42]], archive: [['200,170,110', 0.06, 0.3], ['150,180,240', 0.06, 0.42]] };
  const EDGE = { catalogue: ['12,8,22', 0.55], binding: ['16,22,40', 0.45], archive: ['170,150,110', 0.22] };
  function washes(c, X, Y, T, x, y, list) { const G = 3.4;
    for (let gy = Math.floor((y - 3) / G); gy <= Math.floor((y + 4) / G); gy++) for (let gx = Math.floor((x - 3) / G); gx <= Math.floor((x + 4) / G); gx++) { const kind = hh(gx, gy, 141); let col = null, a = 0;
      for (const [cc, aa, upto] of list) if (kind < upto) { col = cc; a = aa * (0.7 + 0.6 * hh(gx, gy, 143)); break; } if (!col) continue;
      const cx = (gx + hh(gx, gy, 153)) * G, cy = (gy + hh(gx, gy, 159)) * G, rr = 1 + hh(gx, gy, 161) * 1.9; if (cx + rr < x || cx - rr > x + 1 || cy + rr * 0.8 < y || cy - rr * 0.8 > y + 1) continue;
      const px = X + (cx - x) * T, py = Y + (cy - y) * T; c.save(); c.translate(px, py); c.scale(1, 0.75); const g = c.createRadialGradient(0, 0, 0, 0, 0, rr * T); g.addColorStop(0, `rgba(${col},${a.toFixed(3)})`); g.addColorStop(0.6, `rgba(${col},${(a * 0.5).toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rr * T, 0, TAU); c.fill(); c.restore(); } }
  function landFloor(bio) { const L = BIO_L[bio]; return function (c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE, isWall) { const t = tex('floor:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    c.drawImage(t.cv, md(x, FN) * P, md(y, FN) * P, P, P, X, Y, T + 0.02, T + 0.02); STATS.land++;
    washes(c, X, Y, T, x, y, WASH[bio]);
    const ec = EDGE[bio][0], ea = EDGE[bio][1];
    if (typeof isWall === 'function' && isWall(x, y - 1)) { const g = c.createLinearGradient(0, Y, 0, Y + T * 0.55); g.addColorStop(0, `rgba(${ec},${ea})`); g.addColorStop(0.5, `rgba(${ec},${ea * 0.3})`); g.addColorStop(1, `rgba(${ec},0)`); c.fillStyle = g; c.fillRect(X, Y, T, T * 0.55); }
    const side = (x0, y0, x1, y1, w, hh2) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(${ec},${ea})`); g.addColorStop(0.5, `rgba(${ec},${ea * 0.26})`); g.addColorStop(1, `rgba(${ec},0)`); c.fillStyle = g; c.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, hh2); };
    if (gN) side(X, Y, X, Y + T * 0.5, T, T * 0.5); if (gS) side(X, Y + T, X, Y + T * 0.55, T, T * 0.45); if (gW) side(X, Y, X + T * 0.45, Y, T * 0.45, T); if (gE) side(X + T, Y, X + T * 0.55, Y, T * 0.45, T); c.restore(); }; }
  function landWall(bio) { const L = BIO_L[bio]; return function (c, X, Y, T, H, h, x) { const t = tex('bank:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, WN) * P, 0, P, t.cv.height, X, Y, T + 0.5, H);
    const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, `rgba(${EDGE[bio][0]},0)`); g.addColorStop(1, `rgba(${EDGE[bio][0]},.3)`); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H); }; }
  function landRoof(bio) { const L = BIO_L[bio]; return function (c, X, Y, T, x, y, isWall) { const t = tex('roof:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, WN) * P, md(y, WN) * P, P, P, X, Y, T + 0.5, T + 0.5);
    if (!isWall(x, y + 1)) { c.fillStyle = L === 'silver' ? 'rgba(220,228,245,.5)' : 'rgba(232,195,106,.55)'; c.fillRect(X, Y + T * 0.9, T + 0.5, Math.max(1, T * 0.06)); }
    if (!isWall(x - 1, y)) { c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(X, Y, Math.max(1, T * 0.05), T); } if (!isWall(x + 1, y)) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(X + T * 0.94, Y, T * 0.06, T); } }; }
  function landCliff(bio) { const L = BIO_L[bio]; return function (c, x, y, X, Y, T, lw, B, isGap) { const t = tex('cliff:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    const rr = B && B.out ? T * 0.38 : 0, l = isGap && isGap(x - 1, y) ? rr : 0, r = isGap && isGap(x + 1, y) ? rr : 0, sx = md(x, WN) * P, k = P / T;
    c.save(); if (l || r) { c.beginPath(); c.moveTo(X + l, Y - 1); c.lineTo(X + T - r, Y - 1); c.lineTo(X + T - r * 0.6, Y + T * 1.3); c.lineTo(X + l * 0.6, Y + T * 1.3); c.closePath(); c.clip(); }
    c.drawImage(t.cv, sx, 0, P, t.cv.height, X, Y - T * 0.02, T, t.cv.height / k); c.restore(); }; }
  function landBridge(bio) { const L = BIO_L[bio]; return function (c, x, y, X, Y, T, isGap, tt) { const t = tex('bridge:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y), TB = typeof T_BRIDGE !== 'undefined' ? T_BRIDGE : -1;
    const run = (dx, dy) => { let n = 0; for (const s of [-1, 1]) for (let k = 1; k <= 6 && tt(x + dx * k * s, y + dy * k * s) === TB; k++) n++; return n; };
    const horiz = gNS && !gWE ? true : gWE && !gNS ? false : run(1, 0) >= run(0, 1);
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0); c.drawImage(t.cv, md(horiz ? x : y, 2) * P, 0, P, P, 0, 0, T + 0.02, T + 0.02);
    // the page edges along its open sides (cream, finely lined; continuous along it)
    const pages = (open, y0, dir) => { if (!open) return; const hgt = T * 0.12, yy = dir > 0 ? y0 : y0 - hgt; const g = c.createLinearGradient(0, yy, 0, yy + hgt); const pc = L === 'holy' ? ['#FFFDF6', '#E6DCC6'] : ['#F4E8CC', '#BFA778']; g.addColorStop(0, dir > 0 ? pc[0] : pc[1]); g.addColorStop(1, dir > 0 ? pc[1] : pc[0]); c.fillStyle = g; c.fillRect(0, yy, T + 0.02, hgt);
      c.strokeStyle = 'rgba(120,96,60,.35)'; c.lineWidth = Math.max(0.6, T * 0.008); c.beginPath(); for (let i = 1; i < 4; i++) { const ly = yy + hgt * i / 4; c.moveTo(0, ly); c.lineTo(T + 0.02, ly); } c.stroke(); c.fillStyle = 'rgba(20,10,24,.35)'; c.fillRect(0, dir > 0 ? yy + hgt : yy - Math.max(1, T * 0.02), T + 0.02, Math.max(1, T * 0.02)); };
    if (horiz) { pages(isGap(x, y - 1), 0, 1); pages(isGap(x, y + 1), T, -1); } else { pages(isGap(x - 1, y), 0, 1); pages(isGap(x + 1, y), T, -1); }
    c.restore(); }; }
  function landBridgeEdge(bio) { const L = BIO_L[bio]; return function (c, x, y, X, Y, T) { const t = tex('bunder:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, 2) * P, 0, P, t.cv.height, X, Y - T * 0.02, T + 0.02, t.cv.height * T / P); }; }

  /* ======================= the props in their lands: installed ======================= */
  const OLD = {};
  const FLOORC = { catalogue: ['#CDB894', '#C8B28C', '#D2BE9A'], binding: ['#D8DCE4', '#D2D6DE', '#DEE2EA'], archive: ['#F4EEE2', '#F0EADC', '#F8F2E6'] };
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS, EXT = (HAS_W && (window.PROP_EXT = window.PROP_EXT || {})) || {};
    for (const k of KINDS) { if (PR[k] && PR[k].__libp) continue; const old = OLD[k] = PR[k] || function () {};
      const f = function (c, P, v, B) { const L = LOF(B); if (!L || off()) return old.apply(this, arguments); const vv = (v | 0) % 4, s = sprite(k, vv % 2, Math.max(8, Math.min(CAP, Math.round(P))), true, L); if (!s) return old.apply(this, arguments);
        const q = P / s.P; c.save(); if (vv >= 2) c.scale(-1, 1); c.drawImage(s.cv, -s.ax * q, -s.ay * q, s.cv.width * q, s.cv.height * q); c.restore(); };
      f.__libp = 1; PR[k] = f;
      let b = [0, 0, 0, 0]; for (let v = 0; v < 2; v++) { const q = DEF[k].box(v); b = [Math.min(b[0], q[0]), Math.min(b[1], q[1]), Math.max(b[2], q[2]), Math.max(b[3], q[3])]; }
      const E = EXT[k] || [2.4, 2.9]; EXT[k] = [Math.max(E[0], Math.max(-b[0], b[2]) * 2 - 1.6 + 0.1), Math.max(E[1], -b[1] - 0.25 + 0.1)]; }
    if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) for (const k of KINDS) BREAK_FX.KIND[k] = Object.assign({}, BREAK_FX.KIND[k] || {}, DEF[k].mat);
    if (typeof PROP_EL !== 'undefined') for (const k of KINDS) PROP_EL[k] = DEF[k].el;
    for (const bio of ['catalogue', 'binding', 'archive']) { const B = typeof BIOMES !== 'undefined' && BIOMES[bio]; if (!B || B.__libp) continue; B.__libp = 1;
      const fns = { floorFn: landFloor(bio), wallFn: landWall(bio), roofFn: landRoof(bio), cliffTint: landCliff(bio), bridgeFn: landBridge(bio), bridgeEdge: landBridgeEdge(bio), floorUnder: true };
      { let oldF = B.floor; const F2 = FLOORC[bio]; Object.defineProperty(B, 'floor', { configurable: true, enumerable: true, get: () => (BP() ? F2 : oldF), set: v2 => { oldF = v2; } }); }
      for (const n in fns) { OLD[bio + ':' + n] = B[n]; Object.defineProperty(B, n, { configurable: true, enumerable: true, get: () => (BP() ? fns[n] : OLD[bio + ':' + n]), set: v2 => { OLD[bio + ':' + n] = v2; } }); } } }
  install();

  /* ======================= release, warm-up ======================= */
  function release(keepTex) { CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); if (!keepTex) { BURSTS.length = 0; TEX.forEach(t => { if (t && t.cv) t.cv.width = t.cv.height = 1; }); TEX.clear(); BASE = 0; TBASE = 0; } }
  function hookRelease() { try { if (typeof DunWorld === 'undefined' || !DunWorld.dropProps || DunWorld.dropProps.__libp) return; const od = DunWorld.dropProps; const f = function () { try { return od.apply(this, arguments); } finally { release(); LIVE = null; } }; for (const k in od) f[k] = od[k]; f.__libp = 1; DunWorld.dropProps = f; } catch (e) {} }
  hookRelease();
  const PIECES_OF = [];   // [stage name pattern, [[name, v], ...]] (the trials' and arenas' pieces)
  function warm(P) { if (!BP() || !P || !(P.T > 0)) return []; const S2 = P.S || {}, F = P.F || {}; if (!BIO_L[F.biome]) return [];
    const k = P.k || 1, PB = Math.min(CAP, Math.round(P.T * k)), PT = Math.min(TCAP, Math.round(P.T * k)); BASE = PB; TBASE = PT; const L = BIO_L[F.biome], jobs = [], job = f => jobs.push(() => { try { f(); } catch (e) {} });
    if (S2.kind === 'boss' || F.fiend) { if (L !== 'silver') for (const j of texJobs('grain:' + L, Math.min(72, PT))) jobs.push(j); const n = S2.name || ''; for (const [re, list] of PIECES_OF) if (re.test(n) || re.test(F.fiend && F.fiend.id || '')) for (const [nm, v] of list) job(() => sprite(nm, v, PB, true, L)); return jobs; }
    for (const n of ['floor', 'bank', 'roof', 'cliff', 'bridge', 'bunder']) for (const j of texJobs(n + ':' + L, PT)) jobs.push(j);
    const B = typeof BIOMES !== 'undefined' && BIOMES[F.biome]; if (B) for (const kd of new Set([...(B.props || []), ...(B.rim || []), 'bookcase'])) if (DEF[kd]) for (let v = 0; v < 2; v++) job(() => sprite(kd, v, PB, true, L));
    const n = S2.name || ''; for (const [re, list] of PIECES_OF) if (re.test(n)) for (const [nm, v] of list) job(() => sprite(nm, v, PB, true, L));
    return jobs; }

  /* ======================= breaking them =======================
     The engine breaks them (20l): the tile turns to floor (the land's own floor painted under props too: floorUnder) and BREAK_FX
     shatters the picture in its material. Here: the hit points (the big ones take more), each kind's debris (splinters, loose
     pages fluttering down, gilt flakes, glass, cloud) and a feathered GPU burst; lowFx: fewer pieces, no ring. Every burst ends
     within 1.6 s. */
  const PG = 'page', SPL = 'shard';
  const DEBRIS = { bookcase: { col: GOLD_HI, dust: '#6A4A3A', n: [[SPL, '#5A3426', 12], [PG, '#F4EAD2', 12], ['smoke', 'rgba(90,70,60,', 6]] },
    libladder: { col: GOLD_HI, dust: '#6A4A3A', n: [[SPL, '#7A5446', 10], ['smoke', 'rgba(90,70,60,', 3]] },
    lectern: { col: GOLD_HI, dust: '#6A4A3A', n: [[SPL, '#5A3426', 8], [PG, '#F4EAD2', 10], ['smoke', 'rgba(90,70,60,', 3]] },
    bookstack: { col: GOLD_HI, dust: '#8A6A50', n: [[PG, '#F4EAD2', 14], [SPL, '#6B324F', 8], ['smoke', 'rgba(120,100,80,', 4]] },
    candelabra: { col: CANDLE, dust: '#8A6A3A', n: [['shard', '#E8C36A', 8], ['spark', '#FFE6A0', 12], ['smoke', 'rgba(80,70,60,', 4]] },
    inkwell: { col: INKV_HI, dust: '#2A2440', n: [['shard', '#1A1626', 12], ['spore', INKV, 12], ['smoke', 'rgba(30,24,44,', 6]] },
    mirror: { col: MOON, dust: '#9AA4B6', n: [['shard', '#DCE6FF', 14], ['spark', '#FFFFFF', 10], ['smoke', 'rgba(200,210,230,', 3]] },
    silverurn: { col: MOON, dust: '#9AA4B6', n: [['shard', '#C9D0DC', 10], [PG, '#FFFFFF', 8], ['smoke', 'rgba(200,210,230,', 3]] },
    platpillar: { col: HOLY, dust: '#D6CBAE', n: [['shard', '#E9EEF5', 12], ['spark', GOLD_HI, 8], ['smoke', 'rgba(240,232,210,', 6]] },
    angelstatue: { col: HOLY, dust: '#E6DCC0', n: [['shard', '#FBF8F0', 14], ['spark', '#FFFFFF', 10], ['smoke', 'rgba(250,244,230,', 7]] },
    haloarch: { col: HOLY, dust: '#E2B64A', n: [['shard', '#E2B64A', 12], ['spark', GOLD_HI, 12], ['smoke', 'rgba(250,236,200,', 4]] },
    censer: { col: HOLY, dust: '#E2B64A', n: [['shard', '#E2B64A', 8], ['spark', '#FFFFFF', 12], ['smoke', 'rgba(255,246,220,', 6]] },
    cloudbank: { col: '#FFFFFF', dust: '#FFFFFF', n: [['smoke', 'rgba(255,255,255,', 10]] },
    harp: { col: HOLY, dust: '#E2B64A', n: [['shard', '#E2B64A', 10], ['spark', GOLD_HI, 10], ['smoke', 'rgba(250,236,200,', 3]] } };
  const HPK = {}; for (const k of KINDS) HPK[k] = DEF[k].hp;
  const BURSTS = [];
  function libBreak(X, p) { const D = DEBRIS[p.kind]; if (!D || !X || !X.part) return; STATS.breaks++; const lf = lowFx(), k = lf ? 0.5 : 1, R = Math.random, h = Math.max(0.6, -(DEF[p.kind].box(0)[1]) * 0.45);
    for (const [kind, col, n] of D.n) for (let i = 0; i < Math.round(n * k); i++) { const a = R() * TAU, v = 1.5 + R() * 3.5, x = p.x + (R() - 0.5) * 0.8, y = p.y - 0.2 - R() * h;
      if (kind === 'smoke') X.part({ kind: 'smoke', x, y: p.y - 0.3, vx: (R() - 0.5) * 0.8, vy: -0.4 - R() * 0.4, life: 1.1, max: 1.1, size: 0.5 + R() * 0.35, color: col });
      else if (kind === 'spore') X.part({ kind: 'glow', x, y, vx: Math.cos(a) * v * 0.3, vy: -0.6 - R() * 0.8, drag: 1, life: 1.2, max: 1.2, size: 0.1 + R() * 0.08, color: col });
      else if (kind === PG) X.part({ kind: 'shard', x, y, vx: Math.cos(a) * v * 0.5, vy: -1.5 - R() * 2, g: 2.2, drag: 1.2, life: 1.3 + R() * 0.4, max: 1.7, size: 4 + R() * 3, rot: R() * 6, vr: (R() - 0.5) * 8, color: col });
      else X.part({ kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, g: kind === 'spark' ? 3 : 9, life: 0.7 + R() * 0.4, max: 1.1, size: 3 + R() * 3, rot: R() * 6, vr: (R() - 0.5) * 12, color: col }); }
    if (BURSTS.length < 24) BURSTS.push({ x: p.x, y: p.y, h, col: D.col, dust: D.dust, t: 0, life: 1.6, X }); }
  function burstsTick(dt) { for (let i = BURSTS.length - 1; i >= 0; i--) { BURSTS[i].t += dt; if (BURSTS[i].t >= BURSTS[i].life) BURSTS.splice(i, 1); } }
  function burstsDraw(Q, X) { const T = X.Tz(), lf = lowFx();
    for (const b of BURSTS) { if (b.X !== X) continue; const u = b.t / b.life, Xs = X.sx(b.x), Ys = X.sy(b.y), f = Math.pow(1 - u, 1.6);
      Q.glow(Xs, Ys - T * b.h * 0.6, T * (1.1 + b.h * 0.8) * (0.6 + u * 0.8), b.col, 0.3 * f); Q.glow(Xs, Ys, T * (1.6 + u * 1.7), b.dust, 0.16 * f, 0.4);
      if (!lf) Q.ring(Xs, Ys, T * (0.5 + u * 2.2), b.col, 0.2 * f, T * 0.35 * (1 - u * 0.5), 0.45); } }
  function hookBreak() { try { if (typeof BREAK_FX === 'undefined' || !BREAK_FX.prop || BREAK_FX.prop.__libp) return; const op = BREAK_FX.prop; const f = function (Xa, p) { const r = op.apply(this, arguments); try { if (p && DEBRIS[p.kind] && BIO_L[p.biome] && !off()) libBreak(Xa, p); } catch (e) {} return r; }; for (const k in op) f[k] = op[k]; f.__libp = 1; BREAK_FX.prop = f; } catch (e) {} }
  hookBreak();
  const toughen = props => { for (const p of props || []) if (HPK[p.kind] && BIO_L[p.biome] && !p.libHp && !p.broken) { p.libHp = 1; p.hp = Math.max(p.hp || 0, HPK[p.kind]); } };

  /* ======================= the light (GPU): props' flames and glows, the trials' queued light, motes ======================= */
  // where each prop's live lights are (tiles from its feet; v 0..1, mirrored for 2..3): [dx, dy, r, colour, kind]
  function glowsOf(kind, v, L) { const vv = (v | 0) % 2, m = (v | 0) % 4 >= 2 ? -1 : 1, out = [];
    if (kind === 'candelabra') { for (const [x, y] of [[-0.45, -1.76], [0, -1.93], [0.45, -1.76]]) out.push([x * m, y - 0.45, 0.2, CANDLE, 'flame']); }
    else if (kind === 'censer') out.push([0, -1.45, 0.6, HOLY, 'fire']);
    else if (kind === 'lectern') { if (vv === 0) out.push([-0.3 * m, -1.2, 0.3, L === 'silver' ? MOON : GOLD, 'eye']); }
    else if (kind === 'platpillar') out.push([0, -3.9 - vv * 0.1, 0.45, HOLY, 'halo']);
    else if (kind === 'haloarch') { out.push([0, -1.6, 0.5, HOLY, 'halo'], [0, -2.0, 1.2, HOLY, 'fill']); }
    else if (kind === 'angelstatue') out.push([0, -2.45, 1.0, HOLY, 'crys']);
    else if (kind === 'inkwell') out.push([0, -0.95, 0.4, INKV, 'ink']);
    else if (kind === 'harp') out.push([0.0, -1.3, 0.6, GOLD_HI, 'strings']);
    else if (kind === 'mirror') out.push([0, -1.43, 0.5, MOON, 'glass']);
    return out; }
  const gpu = c => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__LIBP_GL === 0)) return null; const NM = HAS_W ? window.NIDHOGG_MOVES : null, F = NM && NM.FGFX; if (!F || !F.usable()) return null; return { F, Q: F.begin(c, null) }; } catch (e) { return null; } };
  const gpuEnd = (c, G) => { if (G) try { G.F.flush(c); } catch (e) {} };
  const gpuOK = () => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__LIBP_GL === 0)) return false; const NM = HAS_W ? window.NIDHOGG_MOVES : null; return !!(NM && NM.FGFX && NM.FGFX.usable()); } catch (e) { return false; } };
  const QL = [], QO = []; let LIVE = null;
  const ql = (fn, a, b, c2, d, e, f, g2, h, i, j, k, l) => { if (QL.length < 500) QL.push([fn, a, b, c2, d, e, f, g2, h, i, j, k, l]); };
  const qo = (fn, a, b, c2, d, e, f, g2, h, i, j, k, l) => { if (QO.length < 500) QO.push([fn, a, b, c2, d, e, f, g2, h, i, j, k, l]); };
  function qFlush(Q, list) { for (const q of list) { try { Q[q[0]](q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], q[9], q[10], q[11], q[12]); } catch (e) {} } list.length = 0; }
  const ready = X => !!(X && LIVE && LIVE.X === X && !off() && BP() && gpuOK());
  // a candle flame (LE-FX 622): a teardrop of light, flickering and swaying (uv.y 1 at its wick)
  const flame = (Q, x, y, s, col, a, sd, white) => { Q.quad(622, x, y - s * 0.9, s * 0.55, 0, 0, s * 1.0, col, a, sd, 0.6, white || 0); };
  function lights(X) { const F = X.F || {}, bio = BIO_L[F.biome] ? F.biome : 'catalogue', L = BIO_L[bio], fiend = !!F.fiend; let glows = null, t = 0; const motes = [], LF = lowFx;
    const collect = () => { glows = []; for (const p of (X.props || [])) { if (!BIO_L[p.biome]) continue; for (const [dx, dy, r, col, kind] of glowsOf(p.kind, p.v | 0, L)) glows.push({ p, dx, dy, r, col, kind, ph: hh(p.k || Math.round(p.x * 7 + p.y * 13), 1, 3) * TAU }); } };
    const MCOL = { cat: [GOLD_HI, '#FFD8A0', INKV_HI], silver: ['#FFFFFF', MOON, '#C8D4F0'], holy: [GOLD_HI, '#FFFFFF', HOLY] }[L];
    const onScreen = () => { const T = X.Tz(), W = X.W(), Hh = X.H(); for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y); if (Xs > -T * 4 && Xs < W + T * 4 && Ys > -T * 3 && Ys < Hh + T * 6) return true; } return false; };
    return { X, L,
      update(dt) { t += dt; burstsTick(dt); if (!glows) { collect(); toughen(X.props); } if (QL.length > 400) QL.length = 0; if (QO.length > 400) QO.length = 0;
        const me = X.me, want = fiend ? 0 : LF() ? 4 : 12;
        if (motes.length < want && Math.random() < dt * 6) { const W = X.W() / X.Tz(), Hh = X.H() / X.Tz(); motes.push({ x: me.x + (Math.random() - 0.5) * W * 1.1, y: me.y + (Math.random() - 0.4) * Hh * 0.8, vx: (Math.random() - 0.5) * 0.3, vy: -0.2 - Math.random() * 0.3, t: 0, life: 3 + Math.random() * 4, s: 0.5 + Math.random() * 0.8, ph: Math.random() * 6, col: MCOL[Math.floor(Math.random() * MCOL.length)] }); }
        for (const e of motes) { e.t += dt; e.x += (e.vx + Math.sin(e.t * 1.3 + e.ph) * 0.15) * dt; e.y += (e.vy + Math.cos(e.t * 0.9 + e.ph) * 0.06) * dt; } for (let i = motes.length - 1; i >= 0; i--) if (motes[i].t > motes[i].life) motes.splice(i, 1); },
      drawGround(c) { if (!QL.length && !(glows && glows.length)) return; if (!QL.length && !onScreen()) return;
        const G = gpu(c); if (!G) { QL.length = 0; return; } const T = X.Tz(), W = X.W(), Hh = X.H(), lf = LF();
        // the pools of light the flames and halos cast on the floor round them
        if (glows) for (const q of glows) { const p = q.p; if (p.broken || q.kind === 'strings' || q.kind === 'glass') continue; const Xs = X.sx(p.x), Ys = X.sy(p.y); if (Xs < -T * 4 || Xs > W + T * 4 || Ys < -T * 3 || Ys > Hh + T * 3) continue; if (lf && q.kind !== 'flame' && q.kind !== 'fire') continue;
          const pool = q.kind === 'flame' || q.kind === 'fire' ? 1.7 : q.kind === 'fill' ? 1.6 : 1.1; G.Q.glow(Xs + q.dx * T * 0.3, Ys - T * 0.05, T * pool, q.col, (L === 'holy' ? 0.08 : 0.12) + 0.04 * Math.sin(t * 1.1 + q.ph), 0.42); }
        qFlush(G.Q, QL); gpuEnd(c, G); },
      drawOver(c) { if (!QO.length && !(glows && glows.length) && !BURSTS.length && !motes.length) return; const G = gpu(c); if (!G) { QO.length = 0; return; } const T = X.Tz(), W = X.W(), Hh = X.H(), lf = LF();
        if (glows) for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y) + q.dy * T; if (Xs < -T * 3 || Xs > W + T * 3 || Ys < -T * 5 || Ys > Hh + T * 3) continue;
          const k = 0.75 + 0.25 * Math.sin(t * 1.6 + q.ph);
          if (q.kind === 'flame') { const fl = 0.85 + 0.15 * Math.sin(t * 17 + q.ph * 3) * Math.sin(t * 5.3 + q.ph); flame(G.Q, Xs, Ys + T * 0.07, T * 0.2 * fl, CANDLE, 0.95, q.ph); G.Q.glow(Xs, Ys - T * 0.08, T * 0.75, CANDLE, 0.22 * fl); STATS.flames++; continue; }
          if (q.kind === 'fire') { flame(G.Q, Xs, Ys + T * 0.45, T * 0.62, '#FFE2A0', 0.9, q.ph, 1); G.Q.glow(Xs, Ys, T * 1.3, HOLY, 0.22 * k); if (!lf) for (let i = 0; i < 3; i++) { const u = (t * 0.6 + i / 3 + q.ph) % 1; G.Q.glow(Xs + Math.sin(i * 2.3 + t + q.ph) * T * 0.2, Ys - u * T * 1.5, T * 0.07, '#FFFFFF', 0.6 * Math.sin(u * Math.PI)); } continue; }
          if (q.kind === 'eye') { G.Q.glow(Xs, Ys, T * 0.55, q.col, 0.28 + 0.15 * Math.sin(t * 2.2 + q.ph)); G.Q.glow(Xs, Ys, T * 0.1, '#FFFFFF', 0.5); continue; }
          if (q.kind === 'halo') { G.Q.ring(Xs, Ys, q.r * T, q.col, 0.32 * k, T * 0.16, 0.6); G.Q.glow(Xs, Ys, q.r * T * 1.6, q.col, 0.12 * k); continue; }
          if (q.kind === 'fill') { if (!lf) G.Q.quad(624, Xs, Ys + T * 0.4, T * 1.0, 0, 0, T * 1.6, HOLY, 0.4 * k, q.ph, 0.6, 0); continue; }
          if (q.kind === 'crys') { G.Q.glow(Xs, Ys, q.r * T * 1.6, q.col, 0.18 * k); const tw = Math.max(0, Math.sin(t * 1.3 + q.ph)); if (tw > 0.8 && !lf) G.Q.star(Xs - T * 0.3, Ys - T * 0.5, T * 0.5 * (tw - 0.6), (tw - 0.8) * 5, '#FFFFFF'); continue; }
          if (q.kind === 'ink') { G.Q.glow(Xs, Ys, T * 0.42, q.col, 0.12 + 0.06 * k); continue; }
          if (q.kind === 'strings') { if (lf) continue; const u = (t * 0.5 + q.ph) % 1; G.Q.beam(Xs - T * 0.25, Ys - T * 0.7 + u * T * 0.2, Xs + T * 0.25, Ys - T * 0.6 + u * T * 0.2, T * 0.25, q.col, 0.12 * Math.sin(u * Math.PI)); continue; }
          if (q.kind === 'glass') { const u = (t * 0.18 + q.ph) % 1; if (u < 0.25 && !lf) G.Q.beam(Xs - T * 0.4, Ys + T * 0.6 - u * T * 4, Xs + T * 0.3, Ys - T * 0.1 - u * T * 4, T * 0.18, '#FFFFFF', 0.25 * Math.sin(u / 0.25 * Math.PI)); continue; }
          G.Q.glow(Xs, Ys, q.r * T * 2, q.col, 0.3 * k); }
        qFlush(G.Q, QO); burstsDraw(G.Q, X);
        for (const e of motes) { const a = Math.sin(e.t / e.life * Math.PI), Xs = X.sx(e.x), Ys = X.sy(e.y); if (Xs < -10 || Xs > W + 10 || Ys < -10 || Ys > Hh + 10) continue; G.Q.glow(Xs, Ys, T * 0.1 * e.s, e.col, a * (L === 'holy' ? 0.3 : 0.4)); G.Q.glow(Xs, Ys, T * 0.03 * e.s, '#FFFFFF', a * 0.7); }
        gpuEnd(c, G); },
      refresh() { glows = null; } }; }

  /* ======================= the hazards: the lasers' tell (a line of gold script light) ======================= */
  const LIVEBIO = () => LIVE && LIVE.X && LIVE.X.F && BIO_L[LIVE.X.F.biome] ? LIVE.X.F.biome : null;
  // a laser's warning (20b: its line, then the beam): a band of light along the line kindling from its ends as the strike nears,
  // runs of script light moving along it (LE-FX 623), two glows at its ends (no dashed box)
  function lineTell(x, y, a, len, w, life) { if (off() || !LIVEBIO() || !gpuOK()) return undefined; const t0 = now(), X = LIVE.X;
    return () => { if (!gpuOK() || !LIVE || LIVE.X !== X) return false; const u = clamp((now() - t0) / 1000 / (life || 1), 0, 1), T = X.Tz(), ax = X.sx(x), ay = X.sy(y), bx = X.sx(x + Math.cos(a) * len), by = X.sy(y + Math.sin(a) * len), L = BIO_L[LIVEBIO()], col = L === 'silver' ? '#B8C8FF' : L === 'holy' ? '#FFB23F' : INKV_HI;
      const dx = (bx - ax) / 2, dy = (by - ay) / 2, l = Math.hypot(dx, dy) || 1, ww = T * w * (0.7 + 0.6 * u);
      ql('quad', 623, ax + dx, ay + dy, dx, dy, -dy / l * ww, dx / l * ww, col, 0.5 + 0.5 * u, Math.floor(x * 7 + y * 3), u, 0); ql('beam', ax, ay, bx, by, T * 0.06, '#FFFFFF', 0.1 + 0.35 * u * u);
      for (const [px, py] of [[ax, ay], [bx, by]]) { qo('glow', px, py - T * 0.3, T * (0.45 + 0.3 * u), col, 0.45 + 0.3 * Math.sin(now() / 40)); qo('glow', px, py - T * 0.3, T * 0.12, '#FFFFFF', 0.7); }
      STATS.tells++; return true; }; }

  /* ======================= the Ascent's threads of light and rising motes (20zb2's everyStage: its list, drawn here) ======================= */
  // each thread a soft band of light along its bowing curve (beams, a white core), a bead running along it; each mote a speck
  function threads(X, list, motes) { if (!ready(X)) return false; const T = X.Tz(), t = X.g ? X.g.t : now() / 1000, W = X.W(), Hh = X.H ? X.H() : 900;
    for (const th of list || []) { const k = Math.sin(Math.PI * Math.min(1, th.t / th.max)), ax = X.sx(th.ax), ay = X.sy(th.ay) - th.ah * T, bx = th.sky ? X.sx(th.bx) + th.skx * T : X.sx(th.bx), by = th.sky ? -20 : X.sy(th.by) - th.bh * T;
      const mx = (ax + bx) / 2, my = (ay + by) / 2, nx = -(by - ay), ny = bx - ax, L = Math.hypot(nx, ny) || 1, bend = Math.sin(t * 1.3 + th.seed) * T * 0.9 + th.bow * T, cx = mx + nx / L * bend, cy = my + ny / L * bend, at = u => [(1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx, (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by];
      let p0 = at(0); for (let i = 1; i <= 7; i++) { const p1 = at(i / 7); qo('beam', p0[0], p0[1], p1[0], p1[1], Math.max(4, T * 0.22), th.col, 0.2 * k); qo('beam', p0[0], p0[1], p1[0], p1[1], Math.max(1.5, T * 0.045), '#FFFFFF', 0.45 * k); p0 = p1; }
      const b = at((th.t / th.max * 1.4) % 1); qo('glow', b[0], b[1], T * 0.22, '#FFF6D0', 0.7 * k); }
    for (const q of motes || []) { const x = q.x * W + Math.sin(t + q.ph) * 12, y = q.y * Hh; qo('glow', x, y, q.s * 3, '#FFF6D0', 0.35 + 0.25 * Math.sin(t * 3 + q.ph)); }
    return true; }

  /* ======================= the doors (the Drowned Belfry's, themed for the Library) ======================= */
  const DOOR_TH = { catalogue: 'libcat', binding: 'libsilver', archive: 'libholy' };
  // the door's stone becomes carved wood panels (the Catalogue), white marble (the Bindery, the Ascent); its bronze gilt or silver
  const doorStone = L => (K, o, x, z, sd, stain) => { const blk = o.blk || 0; if (L === 'cat') { woodM(K, x * 1.3 + (o.u || 0) * 0.7, z * 1.1 + (o.v || 0) * 0.5, sd + blk * 1.7, 'cat', { tone: 0.9 + 0.2 * ((blk * 0.37) % 1) }); return; } marbleL(K, x * 1.3 + (o.u || 0) * 0.7, z * 1.1 + (o.v || 0) * 0.5, sd + blk * 1.7, L); void stain; };
  const doorMetal = L => (K, x, z, sd, wear) => metalM(K, x * 1.4, z * 1.2, sd, L, wear);
  function doorThemes() { try { if (typeof BEL_DOORS === 'undefined' || !BEL_DOORS || !BEL_DOORS.defTheme) return; const D = BEL_DOORS.defTheme;
    D('libcat', { light: LIGHT.cat, gem: [0.62, 0.38, 1.0], rune: GOLD, runeHi: GOLD_HI, ring: GOLD_HI, lit: '#FFE6B8', litFloor: CANDLE, caustic: INKV_HI, mote: GOLD_HI, smoke: '#4A3A44', drip: INKV_HI,
      recess: ['#0A0610', '#3A2240', '#140C18'], glowIn: [[255, 240, 210], [255, 196, 120], [90, 40, 110]], stoneM: doorStone('cat'), metalM: doorMetal('cat') });
    D('libsilver', { light: LIGHT.silver, gem: [0.7, 0.8, 1.0], rune: '#B8C8FF', runeHi: '#FFFFFF', ring: '#DCE6FF', lit: '#EEF2FF', litFloor: '#B8C8FF', caustic: '#DCE6FF', mote: '#FFFFFF', smoke: '#5A6278', drip: '#DCE6FF',
      recess: ['#0A0E18', '#2A3456', '#121826'], glowIn: [[245, 248, 255], [190, 205, 255], [50, 60, 110]], stoneM: doorStone('silver'), metalM: doorMetal('silver') });
    D('libholy', { light: LIGHT.holy, gem: [1.0, 0.86, 0.5], rune: '#E2B64A', runeHi: '#FFFFFF', ring: GOLD_HI, lit: '#FFFBEA', litFloor: HOLY, caustic: '#FFFFFF', mote: '#FFFFFF', smoke: '#E6DCC0', drip: GOLD_HI,
      recess: ['#C8B88E', '#FFF1C8', '#E8DCC0'], glowIn: [[255, 255, 250], [255, 236, 180], [200, 170, 110]], stoneM: doorStone('holy'), metalM: doorMetal('holy') }); } catch (e) {} }
  doorThemes();
  const DOORS = () => (!off() && typeof BEL_DOORS !== 'undefined' && BEL_DOORS && BEL_DOORS.stage && BEL_DOORS.themed) ? BEL_DOORS : null;
  const doorKind = (Rf, i) => { const nx = Rf.stages[i + 1]; return nx && nx.kind === 'boss' ? 'boss' : 'std'; };
  function hookRift() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.library; if (!Rf || Rf.__libp) return; Rf.__libp = 1;
    const oe = Rf.everyStage; Rf.everyStage = function (X, self, H) { let a = {}; try { a = oe ? oe.apply(this, arguments) || {} : {}; } catch (e) { a = {}; } if (off()) return a;
      let C = null; try { const D = DOORS(), S2 = (self && self.S) || {}; if (D && S2.kind !== 'boss' && X.F.rift && !X.F.rift.gate && H && H.exit) { C = { t: 0, X, exitPos: () => H.exit() }; D.stage(X, C, doorKind(Rf, X.F.rift.stage), D.themed(DOOR_TH[X.F.biome] || 'libcat')); } } catch (e) { C = null; }
      const tickDoor = dt => { if (!C) return; C.t += dt; try { BEL_DOORS.tick(C, dt, !!self.done); } catch (e) {} };
      let L = null; try { L = BIO_L[X.F.biome] ? lights(X) : null; } catch (e) { L = null; } if (!L) return C ? Object.assign({}, a, { update(dt) { if (a.update) a.update(dt); tickDoor(dt); }, door: C }) : a; LIVE = L; QL.length = 0; QO.length = 0;
      return Object.assign({}, a, { update(dt) { if (a.update) a.update(dt); L.update(dt); tickDoor(dt); }, drawGround(c) { if (a.drawGround) a.drawGround(c); L.drawGround(c); }, drawOver(c) { if (a.drawOver) a.drawOver(c); L.drawOver(c); }, libp: L, door: C }); };
    const op = Rf.preload; Rf.preload = function (P) { let a = []; try { a = op ? op.apply(this, arguments) || [] : []; } catch (e) {} let b = []; try { b = warm(P); } catch (e) {}
      let d = []; try { const D = DOORS(), S2 = P && P.S; if (D && S2 && S2.kind !== 'boss' && P.F && P.F.rift && !P.F.rift.gate) d = D.warmDoor(P, doorKind(Rf, P.F.rift.stage), DOOR_TH[P.F.biome] || 'libcat') || []; } catch (e) {}
      return a.concat(b, d); }; } catch (e) {} }
  hookRift();

  const API = { piece, sprite: (n, v, P, L) => sprite(n, v, P, true, L), pic, put, tex, texJobs, warm, release, install, glowsOf, OLD, DEF, TDEF, KINDS, HPK, DEBRIS, BURSTS, LIGHT, BIO_L, PIECES_OF, QL, QO, ql, qo, ready, gpuOK, lineTell, flame, threads,
    kitx: { woodM, metalM, leatherM, parchM, marbleM, marbleL, waxM, inkGlassM, cloudM, platM, book, bookCol, contact, glowAdd, lit, INK, MARB, BOOKS, E_GOLD, E_CANDLE, E_INK, E_MOON, E_HOLY },
    get live() { return LIVE; }, get base() { return BASE; }, set base(v) { if (v > 2) BASE = Math.round(v); },
    get stats() { return Object.assign({ cached: CACHE.size, textures: TEX.size, texKeys: [...TEX.keys()], px: [...CACHE.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) + [...TEX.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) }, STATS); } };
  if (HAS_W) window.LIB_PROPS = API;
  return API;
})();
