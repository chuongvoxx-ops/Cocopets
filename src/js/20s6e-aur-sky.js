/* ---------- v470 AE: The Pale Aurora's far views (Rift 05: its three lands and its three boss arenas) ----------
   What is seen past the edge of the playable land, at Rift 03 / 04's standard. Each land is one landscape fixed in the world
   (a thing's place on the screen is its place in the world minus the camera: nothing slides with the camera, nothing pops when
   the stage changes, and the layout repeats along x every `per` tiles so a stage of any width is covered). Over the land's top
   edge is the sky; under its bottom edge the drop; beside it the depths between:
     glacier (the Split Iceberg): a deep polar night; stars; the aurora hung high over the land as the outline of a vast open
       eye (two curtains, the lids, and a pale iris of light between them); a ridge of polar peaks behind the glacier's top
       edge, their lit faces white, their shadowed faces navy; far below, a sea of cloud under moonlight; bergs of the split
       glacier floating in the depths, icicles hanging from them; rime motes.
     observatory (the Observatory Ruins): the aurora bright and near, green and rose; the ruined domes and towers of the old
       observatory along the far ridge; broken arches and instruments adrift on floating stone; the cloud sea lit green.
     whiteout (the Whiteout Summit): the white of a blizzard; pale peaks half lost in it, a low warm sun through the cloud,
       veils of blowing snow streaming across the drop (the land and its monsters stay readable: the veils lie only past it).
   Pictures (the ranges, the cloud sea: 2D painted once per sharpness; the floating bergs and fragments: BELPROPS.kit through
   AUR_PROPS in each land's light) are kept until the stage closes (DunWorld.dropProps, chained). The light is the GPU painter's
   (FGFX: 510 the aurora's curtains, 511 blowing snow, 512 the moon / sun behind cloud, with glows), lowFx respected, laid only
   where the far view can be seen (the gaps' rectangles, as v463 SS). Without the GPU the pictures stay and the light is left out.
   The arenas (Thul's Sheltered Ice Cave, Nivora's Telescope Platform, Ahuul's Broad Summit): the fight's cached sky is this
   view, still (FIEND_DEFS[id].sky wrapped at run time: the boss files untouched).
   Hooks: BIOMES.glacier / observatory / whiteout .gap -> 'aurglacier' / 'aurobs' / 'aurwhite' (getters: the old 'iceabyss'
   while window.__ASKY is 0 or the painter is off) with their GAP_EXT backdrops; RIFT_BY_ID.aurora.everyStage (chained: the
   stage's horizon) and .preload (chained: the pictures painted on the loading screen).
   window.__ASKY = 0 turns all of it off; __ASKY_GL = 0 the GPU's part only. API (global AUR_SKY). */
var AUR_SKY = (() => {
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined';
  const off = () => HAS_W && (window.__ASKY === 0 || window.__AURP === 0);
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const md = (a, n) => ((a % n) + n) % n;
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + (s | 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const hex = h => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const kOf = c => { const m = c && c.getTransform ? c.getTransform() : null; return m ? Math.max(0.5, Math.min(3, Math.hypot(m.a, m.b))) : 1; };
  const STATS = { painted: 0, paintMs: 0, frames: 0, quads: 0, released: 0, arena: 0 };
  function pvn(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), q = p | 0 || 1;
    const X0 = ((xi % q) + q) % q, X1 = (X0 + 1) % q, Y0 = ((yi % q) + q) % q, Y1 = (Y0 + 1) % q, a = hh(X0, Y0, s), b = hh(X1, Y0, s), c = hh(X0, Y1, s), d = hh(X1, Y1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const pn1 = (x, p, s) => pvn(x, 0.5, p, s), pf1 = (x, p, s) => pn1(x, p, s) * 0.55 + pn1(x * 2, p * 2, s + 3) * 0.28 + pn1(x * 4, p * 4, s + 5) * 0.12 + pn1(x * 8, p * 8, s + 7) * 0.05;

  /* ======================= the lands ======================= (ys: tiles relative to the land's top edge (t) or bottom edge (b)) */
  const LANDS = {
    glacier: { gap: 'aurglacier', base: '#0A1730', per: 36, L: 'glacier', zen: '#030817', sky: '#0B1C3C', hor: '#1C3560', deep: '#081428', sea: '#2A4468', seaHi: '#9FB8D8', seaSh: '#16284A',
      range: { t: -1.2, h: 5.5, lit: '#F2F8FC', sh: '#1E3660', rock: '#0A1428', haze: '#1C3560', seed: 11 }, range2: { t: -3.0, h: 4.2, lit: '#7E98BC', sh: '#18284A', rock: '#0C1628', haze: '#132848', seed: 17 },
      aurora: { col: '#78D7B2', vio: 0.5, eye: true, t: -7.5 }, moon: { fx: 0.72, t: -11, r: 1.4, col: '#E8F2FF' }, stars: 1,
      isles: [{ fx: 0.15, b: 5, s: 1.0, v: 0, prop: 'icewedge' }, { fx: 0.55, b: 9, s: 0.8, v: 1, prop: null }, { fx: 0.85, b: 4, s: 0.7, v: 2, prop: 'snowrock' }, { fx: 0.38, t: -3.5, s: 0.55, v: 1, prop: null }] },
    observatory: { gap: 'aurobs', base: '#081428', per: 36, L: 'obs', zen: '#03080F', sky: '#0A1E2E', hor: '#16404A', deep: '#061220', sea: '#22484E', seaHi: '#A8E8CC', seaSh: '#102A34',
      range: { t: -1.2, h: 5.0, lit: '#E0F2EE', sh: '#123040', rock: '#08141C', haze: '#16404A', seed: 23, ruins: true }, range2: { t: -3.2, h: 4.4, lit: '#6E9AA0', sh: '#123040', rock: '#0A1620', haze: '#10303A', seed: 29 },
      aurora: { col: '#8AF0C4', vio: 0.85, eye: true, t: -7, bright: 1.35 }, stars: 0.7,
      isles: [{ fx: 0.2, b: 5, s: 1.0, v: 0, prop: 'obsarch', pv: 1 }, { fx: 0.62, b: 8, s: 0.85, v: 1, prop: 'telescope' }, { fx: 0.9, b: 4, s: 0.65, v: 2, prop: null }, { fx: 0.45, t: -3.4, s: 0.55, v: 0, prop: null }] },
    whiteout: { gap: 'aurwhite', base: '#C8D8E6', per: 36, L: 'white', zen: '#9FB4C8', sky: '#C8D8E6', hor: '#E4EDF4', deep: '#B4C6D6', sea: '#DCE6EE', seaHi: '#FFFFFF', seaSh: '#A8BCCE',
      range: { t: -1.2, h: 5.0, lit: '#FFFFFF', sh: '#8AA2BC', rock: '#5E7690', haze: '#E4EDF4', seed: 31 }, range2: { t: -3.2, h: 4.0, lit: '#E8F0F6', sh: '#B4C6D6', rock: '#A0B4C8', haze: '#E4EDF4', seed: 37 },
      sun: { fx: 0.3, t: -7.5, r: 1.8, col: '#FFE2B8' }, snow: true,
      isles: [{ fx: 0.3, b: 5, s: 0.9, v: 0, prop: null }, { fx: 0.75, b: 7, s: 0.7, v: 1, prop: null }] } };
  const LAND_OF = {}; for (const k in LANDS) LAND_OF[LANDS[k].gap] = k;

  /* ======================= the pictures ======================= */
  const CACHE = new Map();
  const keep = (key, f) => { let s = CACHE.get(key); if (s) return s; const t0 = now(); s = f(); if (s) { CACHE.set(key, s); STATS.painted++; STATS.paintMs += now() - t0; } return s; };
  // a range of peaks along the horizon, per tiles wide (it repeats), h tall: lit faces to the left (the moon), snow above the
  // tree line of rock, the haze at its foot; ruins: domes and broken towers of the old observatory on its crest
  function rangeStrip(land, which, P) { const L = LANDS[land], R0 = L[which], per = L.per; return keep(`range|${land}|${which}|${P}`, () => {
    const W = Math.round(per * P), H = Math.round(R0.h * P), cv = mkc(W, H), c = cv.getContext('2d'), im = c.createImageData(W, H), d = im.data, lit = hex(R0.lit), sh = hex(R0.sh), rock = hex(R0.rock), hz = hex(R0.haze);
    const ridge = new Float32Array(W + 1); for (let x = 0; x <= W; x++) { const u = x / P; ridge[x] = H * (0.18 + 0.72 * Math.pow(pf1(u / per * 7, 7, R0.seed), 1.35) + 0.12 * Math.max(0, pf1(u / per * 23, 23, R0.seed + 9) - 0.5)); }
    for (let x = 0; x < W; x++) { const top = H - ridge[x], u = x / P, sl = (ridge[Math.min(W, x + 2)] - ridge[Math.max(0, x - 2)]) / 4, face = ss(-0.25, 0.25, sl * 1.6 + 0.48 * (pn1(u * 6, Math.round(per * 6), R0.seed + 11) - 0.5));   /* (v470 AE 2nd pass: crisp lit and shadowed faces) */
      for (let y = Math.max(0, Math.floor(top)); y < H; y++) { const dz = (y - top) / P, k = (y - top) / Math.max(1, H - top), snowLine = 0.35 + 0.35 * pn1(u * 3, Math.round(per * 3), R0.seed + 3), snow = ss(snowLine + 0.08, snowLine - 0.04, k) * (0.6 + 0.4 * face);
        const gully = Math.pow(Math.abs(Math.sin(u * 5.3 + pvn(u * 2, dz * 2, Math.round(per * 2), R0.seed + 5) * 3)), 6) * ss(0.1, 0.4, k);
        const crestL = Math.exp(-dz * dz / 0.004) * face * 0.35, rib = Math.pow(Math.abs(Math.sin(u * 9.4 + dz * 3 + pvn(u, dz, Math.round(per), R0.seed + 13) * 4)), 10) * ss(0.05, 0.3, k) * 0.35; let r = lerp(sh[0], lit[0], face) * (1 - rib) + 255 * crestL, g = lerp(sh[1], lit[1], face) * (1 - rib) + 255 * crestL, b = lerp(sh[2], lit[2], face) * (1 - rib * 0.7) + 255 * crestL; r = lerp(rock[0], r, snow * (1 - gully * 0.6)); g = lerp(rock[1], g, snow * (1 - gully * 0.6)); b = lerp(rock[2], b, snow * (1 - gully * 0.6));
        const hzk = ss(0.45, 1, k) * 0.55; r = lerp(r, hz[0], hzk); g = lerp(g, hz[1], hzk); b = lerp(b, hz[2], hzk); const i = (y * W + x) * 4, aa = y < top + 1 ? clamp(y + 1 - top, 0, 1) : 1; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255 * aa; } }
    c.putImageData(im, 0, 0);
    if (R0.ruins) { const R = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(R0.seed * 7 + 3); c.fillStyle = R0.rock;
      for (let i = 0; i < 5; i++) { const x = (0.1 + i * 0.2 + R() * 0.08) * W, top = H - ridge[Math.round(x)], s = P * (0.5 + R() * 0.5);
        if (i % 2) { c.beginPath(); c.moveTo(x - s * 1.2, top + s * 0.4); c.lineTo(x - s * 1.2, top - s * 0.4); c.arc(x, top - s * 0.4, s * 1.2, Math.PI, 0); c.lineTo(x + s * 1.2, top + s * 0.4); c.closePath(); c.fill(); c.fillStyle = R0.lit; c.globalAlpha = 0.5; c.beginPath(); c.arc(x, top - s * 0.4, s * 1.2, Math.PI * 1.1, Math.PI * 1.5); c.lineTo(x, top - s * 0.4); c.closePath(); c.fill(); c.globalAlpha = 1; c.fillStyle = R0.rock; c.fillRect(x + s * 0.1, top - s * 1.7, s * 0.18, s * 0.5); }
        else { c.fillRect(x - s * 0.3, top - s * 2.2, s * 0.6, s * 2.6); c.beginPath(); c.moveTo(x - s * 0.3, top - s * 2.2); c.lineTo(x - s * 0.1, top - s * 2.6); c.lineTo(x + s * 0.05, top - s * 2.3); c.lineTo(x + s * 0.3, top - s * 2.45); c.lineTo(x + s * 0.3, top - s * 2.2); c.fill(); } } }
    return { cv, P, W, H }; }); }
  // the sea of cloud far below: billows along a wavering top, lit on their upper rims (the moon, the aurora), darker in their folds
  function seaStrip(land, P) { const L = LANDS[land], per = L.per; return keep(`sea|${land}|${P}`, () => {
    const W = Math.round(per * P), H = Math.round(6 * P), cv = mkc(W, H), c = cv.getContext('2d'), im = c.createImageData(W, H), d = im.data, hi = hex(L.seaHi), mid = hex(L.sea), sh = hex(L.seaSh);
    for (let x = 0; x < W; x++) { const u = x / P, top = P * (0.6 + 1.1 * pf1(u / per * 9, 9, 41) + 0.35 * pn1(u / per * 31, 31, 43));
      for (let y = Math.max(0, Math.floor(top)); y < H; y++) { const dz = (y - top) / P, bil = pvn(u * 1.3, dz * 1.6, Math.round(per * 1.3), 45), rim = ss(0.5, 0.0, dz) * (0.6 + 0.4 * bil), fold = ss(0.45, 0.75, pvn(u * 2.6, dz * 2.2, Math.round(per * 2.6), 47)), k = clamp(rim * 0.85 + (1 - fold) * 0.25 - dz * 0.06, 0, 1);
        const i = (y * W + x) * 4; d[i] = k > 0.5 ? lerp(mid[0], hi[0], (k - 0.5) * 2) : lerp(sh[0], mid[0], k * 2); d[i + 1] = k > 0.5 ? lerp(mid[1], hi[1], (k - 0.5) * 2) : lerp(sh[1], mid[1], k * 2); d[i + 2] = k > 0.5 ? lerp(mid[2], hi[2], (k - 0.5) * 2) : lerp(sh[2], mid[2], k * 2); d[i + 3] = 255 * clamp(y + 1 - top, 0, 1) * (1 - ss(4.5, 6, dz + top / P)); } }
    c.putImageData(im, 0, 0); return { cv, P, W, H }; }); }
  // the stars: a tile of them (wrapping), a few bright ones with a soft cross
  function starTile(land, k) { return keep(`stars|${k}`, () => { const S = Math.round(256 * k), cv = mkc(S, S), c = cv.getContext('2d'), R = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(977);
    for (let i = 0; i < 140; i++) { const x = R() * S, y = R() * S, br = R(), r = (br > 0.96 ? 1.3 : br > 0.8 ? 0.8 : 0.5) * k; c.fillStyle = `rgba(${220 + Math.round(R() * 35)},${230 + Math.round(R() * 25)},255,${0.25 + br * 0.65})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); if (br > 0.97) { c.strokeStyle = 'rgba(220,240,255,.35)'; c.lineWidth = 0.6 * k; c.beginPath(); c.moveTo(x - 4 * k, y); c.lineTo(x + 4 * k, y); c.moveTo(x, y - 4 * k); c.lineTo(x, y + 4 * k); c.stroke(); } }
    const pat = c.createPattern ? null : null; void pat; return { cv, S }; }); }
  // a floating berg (the kit): a flat snowy top, its underside a cluster of ice prisms pointing down, icicles; v 2: a slab of the
  // observatory's floor with blocks under it
  function isle(land, v, P) { const A = HAS_W && window.AUR_PROPS, B = HAS_W && window.BELPROPS; if (!A || !B || !B.kit) return null; const L = LANDS[land].L;
    return keep(`isle|${land}|${v}|${P}`, () => { const K = B.kit, X = A.kitx, w = [1.7, 1.25, 1.0][v % 3], S = K.surface(-w - 0.4, -0.9, w + 0.4, 3.4, P), sd = 300 + v * 17, stone = L === 'obs';
      try { X.lit(K, L, () => { const R = K.R1(sd);
          const cones = []; for (let i = 0; i < 7; i++) { const x = (i / 6 - 0.5) * w * 1.6 + (R() - 0.5) * 0.2, len = (1.0 - Math.abs(i / 6 - 0.5) * 1.4) * (1.6 + R() * 1.0) * (w / 1.7) + 0.3; cones.push([x, len]); }
          cones.sort((a, b) => a[1] - b[1]);
          for (const [x, len] of cones) X.prism(K, S, x, 0.05, 0.22 * w / 1.2, 0.16 * w / 1.2, len * 0.55, len * 0.45, Math.PI + (R() - 0.5) * 0.25, (f, q, wt, tip) => { if (stone && wt < 0.45) X.rockM(K, q * 2 + x, wt * 3, sd, 0.3, false); else X.iceM(K, f, q, 1 - wt, tip, sd + x * 9, { tint: X.TINT[L], root: 0, frost: 0.6 }); });
          S.unlock(); X.lump(K, S, 0, -0.08, w, 0.3, { amp: 0.12, fr: 2.4, sd, bump: 0.3, flat: 0.2, mat: (dx, dy, ao, e, nz, wx, wy) => { if (dy > 0.35) { if (stone) X.stoneM(K, wx * 2, wy * 2, sd, { frost: 0.5 }); else X.rockM(K, wx * 2, wy * 2, sd, 0.6, false); } else X.snowM(K, wx * 2, wy * 2, sd, { blue: 0.15 }); } }); S.unlock();
          X.icicles(K, S, -w * 0.8, w * 0.8, 0.18, 6, 0.4, sd, L); K.ink(S, X.INK[L], 0.35); }); }
      catch (e) { if (typeof console !== 'undefined') console.warn('AUR_SKY isle', e); S.cv.width = S.cv.height = 1; return null; }
      const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1; return { cv, ax: S.ax, ay: S.ay, P }; }); }
  const LADDER = [12, 18, 24, 32, 44, 60];
  const pP = want => LADDER.find(q => q >= want) || LADDER[LADDER.length - 1];
  const sP = Tk => Math.min(60, pP(Tk * 0.55));   // (the ranges and the cloud sea: far and soft, painted no sharper than 44 px a tile)

  /* ======================= the view ======================= */
  // V: { W, H, T, sx(x), sy(y) (world tiles -> screen px), t, land, top, bot, k }
  let LIVE = null;
  function view(X, land) { const T = X.Tz(), L = LIVE; return { W: X.W(), H: X.H(), T, sx: X.sx, sy: X.sy, t: X.g ? X.g.t : now() / 1000, land, top: L ? L.top : X.me.y - 8, bot: L ? L.bot : X.me.y + 8, k: 1 }; }
  function each(V, per, fx, r, f) { const camX = (V.W / 2 - V.sx(0)) / V.T, lo = camX - V.W / 2 / V.T - r, hi = camX + V.W / 2 / V.T + r;
    for (let n = Math.floor((lo - fx * per) / per); n <= Math.ceil((hi - fx * per) / per); n++) { const xw = fx * per + n * per; if (xw < lo || xw > hi) continue; f(xw, n); } }
  function blitPart(c, cv, x, y, w, h, W, H) { const a0 = Math.max(0, -x / w), a1 = Math.min(1, (W - x) / w), b0 = Math.max(0, -y / h), b1 = Math.min(1, (H - y) / h); if (a1 <= a0 || b1 <= b0) return;
    c.drawImage(cv, a0 * cv.width, b0 * cv.height, (a1 - a0) * cv.width, (b1 - b0) * cv.height, x + a0 * w, y + b0 * h, (a1 - a0) * w, (b1 - b0) * h); }
  const gpuF = () => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__ASKY_GL === 0)) return null; const F = HAS_W && window.NIDHOGG_MOVES && window.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  function vista(c, V, o) { o = o || {}; const L = LANDS[V.land]; if (!L) return; STATS.frames++;
    if (o.rn > 0) { const R = o.rects; c.save(); try { c.beginPath(); for (let i = 0; i < o.rn * 4; i += 4) c.rect(R[i], R[i + 1], R[i + 2] - R[i], R[i + 3] - R[i + 1]); c.clip(); vistaIn(c, V, o, L); } finally { c.restore(); } return; }
    vistaIn(c, V, o, L); }
  function vistaIn(c, V, o, L) { const W = V.W, H = V.H, T = V.T, k = V.k || 1, t = V.t, yt = dy => V.sy(V.top + dy), yb = dy => V.sy(V.bot + dy), lf = lowFx();
    // the sky's column: the zenith over the land, the horizon at its top edge, the depths beside it, the cloud sea's glow below
    { const y0 = yt(-18), y1 = yt(0), y2 = yb(2), y3 = yb(9), g = c.createLinearGradient(0, y0, 0, y3), span = Math.max(1, y3 - y0), at = y => clamp((y - y0) / span, 0, 1);
      g.addColorStop(0, L.zen); g.addColorStop(at(y1 - T * 3), L.sky); g.addColorStop(at(y1), L.hor); g.addColorStop(clamp(at(y1) + 0.02, 0, 1), L.deep); g.addColorStop(at(y2), L.deep); g.addColorStop(1, L.sea); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    // the stars (anchored), above the ranges
    if (L.stars) { const yS = H; if (yS > 0) {   /* (v470 AE 2nd pass: stars all round the floating glacier, not only over it) */ const sp = starTile(V.land, Math.min(2, k)), S2 = sp.S / Math.min(2, k); c.save(); c.globalAlpha = L.stars * 0.9; let x = md(V.sx(0), S2) - S2; for (; x < W; x += S2) for (let y = md(V.sy(0), S2) - S2; y < Math.min(H, yS); y += S2) c.drawImage(sp.cv, x, y, S2, S2); c.restore(); } }
    // the sky's light first (the GPU: the aurora and its eye, the moon / sun), so the ranges stand in front of it
    const F = o.gpu === false ? null : gpuF(), rngOn = ['range2', 'range'].some(w => { const R0 = L[w], Y = yt(R0.t) - R0.h * T; return Y < H && Y + R0.h * T > 0; }); if (F && rngOn) {   /* (only when a range is on the screen: the aurora behind it needs a pass of its own; else one pass below) */ try { const Q = F.begin(c, null); if (o.gn > 0 && Q.clipTo) Q.clipTo(o.grects, o.gn); skyLight(Q, V, L, lf, t); if (Q.nl || Q.ns) { STATS.quads += (Q.nl + Q.ns) / 6; STATS.passes = (STATS.passes || 0) + 1; F.flush(c); } } catch (e) {} }
    // the far ranges behind the land's top edge (the farther one first)
    for (const which of ['range2', 'range']) { const R0 = L[which], Ptx = sP(T * k), s = rangeStrip(V.land, which, Ptx), wp = L.per * T, Hp = R0.h * T, Y = yt(R0.t) - Hp; if (Y > H || Y + Hp < 0) continue;
      let x = md(V.sx(which === 'range2' ? L.per * 0.37 : 0), wp) - wp; for (; x < W; x += wp) if (x + wp > 0) blitPart(c, s.cv, x, Y, wp + 0.6, Hp + 0.6, W, H);
      // the haze under it (the ranges sink into the depths: no hard foot)
      const yf = Y + Hp, g = c.createLinearGradient(0, yf - T * 0.8, 0, yf + T * 0.6), hz = L.hor; g.addColorStop(0, hz + '00'); g.addColorStop(0.6, hz); g.addColorStop(1, L.deep); c.fillStyle = g; c.fillRect(0, yf - T * 0.8, W, T * 1.4); }
    // the cloud sea far below
    { const s = seaStrip(V.land, sP(T * k)), wp = L.per * T, Hp = 6 * T, Y = yb(3.5); if (Y < H && Y + Hp > 0) { let x = md(V.sx(0) + t * T * 0.05, wp) - wp; for (; x < W; x += wp) if (x + wp > 0) blitPart(c, s.cv, x, Y, wp + 0.6, Hp, W, H); if (Y + Hp < H) { c.fillStyle = L.seaSh; c.fillRect(0, Y + Hp - 1, W, H - Y - Hp + 1); } } }
    // the floating bergs (and what stands on them), bobbing slowly
    for (const it of L.isles) { const P2 = pP(T * k * it.s), base = it.b != null ? yb(it.b) : yt(it.t); each(V, L.per, it.fx, 4 * it.s + 2, xw => { const X = V.sx(xw), Y = base + Math.sin(t * 0.4 + it.fx * 9) * T * 0.12; if (Y < -T * 5 || Y > H + T * 5) return;
      const s = isle(V.land, it.v, P2); if (!s) return; const f = T * it.s / s.P; c.drawImage(s.cv, X - s.ax * f, Y - s.ay * f, s.cv.width * f, s.cv.height * f);
      if (it.prop && HAS_W && window.AUR_PROPS) window.AUR_PROPS.piece(c, it.prop, it.pv || 0, X, Y - T * 0.12 * it.s, T * it.s * 0.7, { L: L.L }); }); }
    // the light (the GPU, one pass): the aurora and its eye, the moon / sun, the cloud sea's lit rims, blowing snow, motes
    if (F) { try { const Q = F.begin(c, null); if (o.gn > 0 && Q.clipTo) Q.clipTo(o.grects, o.gn); if (!rngOn) skyLight(Q, V, L, lf, t); airLight(Q, V, L, lf, t); if (Q.nl || Q.ns) { STATS.quads += (Q.nl + Q.ns) / 6; STATS.passes = (STATS.passes || 0) + 1; F.flush(c); } } catch (e) {} }
  }
  function skyLight(Q, V, L, lf, t) { const T = V.T, W = V.W, H = V.H, yt = dy => V.sy(V.top + dy), yb = dy => V.sy(V.bot + dy);
    if (L.moon) each(V, L.per, L.moon.fx, 8, xw => { const X = V.sx(xw), Y = yt(L.moon.t), R = L.moon.r * T; if (Y < -R * 6 || Y > H + R * 6) return; Q.quad(512, X, Y, R * 4, 0, 0, R * 4, L.moon.col, 0.9, 0.22, 0.6); Q.glow(X, Y, R * 9, '#6E8CC8', 0.12, 0.2); });
    if (L.sun) each(V, L.per, L.sun.fx, 10, xw => { const X = V.sx(xw), Y = yt(L.sun.t), R = L.sun.r * T; if (Y < -R * 8 || Y > H + R * 8) return; Q.quad(512, X, Y, R * 5, 0, 0, R * 5, L.sun.col, 0.8, 0.3, 0.4); Q.glow(X, Y, R * 12, '#FFF2DC', 0.25, 0.2); });
    if (L.aurora) { const A = L.aurora, br = A.bright || 1, per = L.per;
      // the curtains: long folded sheets across the sky; over the land, two of them close into the eye
      each(V, per, 0.5, per * 0.7, xw => { const X = V.sx(xw), Yh = yt(A.t), len = per * 0.62 * T;
        if (Yh + 7 * T < 0 || Yh - 9 * T > H) return;
        if (A.eye) { // the upper lid: a curtain arched over; the lower lid: a curtain sagging under it; the iris: a pale ring of light
          Q.quad(510, X, Yh - T * 1.8, len * 0.5, 0, 0, T * 4.2, A.col, 0.75 * br, 1.3, A.vio, 0.4);
          Q.quad(510, X, Yh + T * 2.4, len * 0.42, 0, 0, -T * 3.2, A.col, 0.5 * br, 4.7, A.vio * 0.5, 0.6);
          Q.ring(X, Yh + T * 0.2, T * 1.6, '#DFFFF0', 0.16 * br, T * 0.9, 0.35); Q.glow(X, Yh + T * 0.2, T * 1.2, '#B8F5DA', 0.18 * br, 0.4); Q.glow(X, Yh + T * 0.2, T * 0.45, '#FFFFFF', 0.12 * br, 0.5); }
        Q.quad(510, V.sx(xw - per * 0.42), Yh - T * 4.5, len * 0.32, 0, 0, T * 3.4, A.col, 0.45 * br, 7.9, A.vio, 0.3);
        if (!lf) Q.quad(510, V.sx(xw + per * 0.36), Yh - T * 3.2, len * 0.3, 0, 0, T * 3.0, A.col, 0.4 * br, 2.2, A.vio * 1.2, 0.5);
      });
      // (v470 AE 2nd pass) the glacier hangs in the sky: lower bands of the aurora drift in the depths beside and under the land too,
      // fixed in the world every 15 rows, fainter the deeper they are (they only show where the far view does)
      const r0 = Math.floor((V.top + (0 - V.sy(V.top)) / T - A.t) / 15), r1 = Math.ceil((V.top + (H - V.sy(V.top)) / T - A.t) / 15);
      for (let r = Math.max(1, r0); r <= r1; r++) { const yw = V.top + A.t + r * 15, Y = V.sy(yw), fade = Math.max(0.35, 1 - r * 0.18); if (Y < -T * 6 || Y > H + T * 6) continue;
        each(V, per, (0.2 + 0.37 * r) % 1, per * 0.5, xw => { Q.quad(510, V.sx(xw), Y, per * 0.26 * T, 0, 0, T * 3.4, A.col, 0.42 * br * fade, 3.1 + r * 1.7, A.vio * 0.8, 0.45); if (!lf) Q.glow(V.sx(xw), Y + T * 1.6, per * 0.2 * T, A.col, 0.06 * br * fade, 0.25); }); } } }
  function airLight(Q, V, L, lf, t) { const T = V.T, W = V.W, H = V.H, yt = dy => V.sy(V.top + dy), yb = dy => V.sy(V.bot + dy);
    // the aurora's light on the cloud sea far below
    if (L.aurora) each(V, L.per, 0.5, L.per * 0.7, xw => { const Ys = yb(4.2); if (Ys > -T * 3 && Ys < H + T * 3) Q.glow(V.sx(xw), Ys, L.per * 0.37 * T, L.aurora.col, 0.1 * (L.aurora.bright || 1), 0.08); });
    // blowing snow streaming across the drop (whiteout), and rime motes drifting in the depths (all lands)
    if (L.snow) for (let i = 0; i < (lf ? 2 : 4); i++) { const Y = yt(-2 + i * 3.5) + Math.sin(t * 0.3 + i) * T * 0.4; Q.quad(511, W / 2, Y, W * 0.75, 0, 0, T * 1.6, '#8EA8C4', 0.55, i * 1.7, 0.6 + i * 0.2, 0.6); Q.glow(W * (0.2 + 0.25 * i), Y, T * 4, '#FFFFFF', 0.12, 0.2); }
    const C = 5, camX = (W / 2 - V.sx(0)) / T, camY = (H / 2 - V.sy(0)) / T, gx0 = Math.floor((camX - W / 2 / T) / C) - 1, gx1 = Math.ceil((camX + W / 2 / T) / C) + 1, gy0 = Math.floor((camY - H / 2 / T) / C) - 1, gy1 = Math.ceil((camY + H / 2 / T) / C) + 1;
    const mc = L.snow ? '#FFFFFF' : L.aurora ? '#DFF6FF' : '#FFFFFF';
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) { if (hh(gx, gy, 91) > (lf ? 0.3 : 0.6)) continue; const ph = hh(gx, gy, 92), u = md(t * 0.04 * (0.6 + ph) + ph, 1), xw = (gx + hh(gx, gy, 93)) * C + (u - 0.5) * C * (L.snow ? 3 : 1), yw = (gy + hh(gx, gy, 94)) * C + (u - 0.5) * C * 1.4;
      const X = V.sx(xw), Y = V.sy(yw); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue; const a = Math.sin(u * Math.PI) * 0.5; Q.glow(X, Y, T * 0.1, mc, a * 0.5); Q.glow(X, Y, T * 0.03, '#FFFFFF', a * 0.8); } }

  /* ======================= the backdrop past the land (GAP_EXT) ======================= */
  if (HAS_W) window.GAP_EXT = window.GAP_EXT || {};
  const GAPX = HAS_W ? window.GAP_EXT : {};
  // where the far view will be seen: the gaps on the screen and one tile round them (and past the map's edge), as rectangles
  // (runs of tiles along each row, rows with the same runs joined): the GPU's light is laid only inside them (v434 PO / v463 SS)
  const SRC = [], SRP = [], SRQ = [];
  function seenRects(X, W, H) { const M = X.M; if (!M || !M.G || !(W > 0) || !(H > 0)) return 0; const G = M.G, MW = M.MW, MH = M.MH, T = X.Tz(), ox = X.sx(0), oy = X.sy(0); if (!(T > 0)) return 0;
    const TG = typeof T_GAP !== 'undefined' ? T_GAP : 2, TB = typeof T_BRIDGE !== 'undefined' ? T_BRIDGE : 5;
    const open = (x, y) => { if (x < 0 || y < 0 || x >= MW || y >= MH) return true; const g = G[y * MW + x]; return g === TG || g === TB; };
    const tx0 = Math.floor(-ox / T) - 1, tx1 = Math.floor((W - ox) / T) + 1, ty0 = Math.floor(-oy / T) - 1, ty1 = Math.floor((H - oy) / T) + 1;
    const seen = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (open(x + i, y + j)) return true; return false; };
    SRC.length = 0; SRP.length = 0; let n = 0, rowStart = 0;
    for (let ty = ty0; ty <= ty1; ty++) { SRQ.length = 0; let s = null; for (let tx = tx0; tx <= tx1 + 1; tx++) { const v = tx <= tx1 && seen(tx, ty); if (v && s === null) s = tx; else if (!v && s !== null) { SRQ.push(s, tx); s = null; } }
      const same = SRQ.length === SRP.length && SRQ.every((q, i) => q === SRP[i]);
      if (!same) { for (let i = 0; i < SRP.length; i += 2) { SRC.push(SRP[i], rowStart, SRP[i + 1], ty); n++; } SRP.length = 0; for (const q of SRQ) SRP.push(q); rowStart = ty; }
      if (n > 40) return 0; }
    for (let i = 0; i < SRP.length; i += 2) { SRC.push(SRP[i], rowStart, SRP[i + 1], ty1 + 1); n++; } if (n > 40) return 0;
    let k = 0; for (let i = 0; i < n * 4; i += 4) { const x0 = Math.max(0, SRC[i] * T + ox), y0 = Math.max(0, SRC[i + 1] * T + oy), x1 = Math.min(W, SRC[i + 2] * T + ox), y1 = Math.min(H, SRC[i + 3] * T + oy); if (x1 > x0 && y1 > y0) { SRC[k] = x0; SRC[k + 1] = y0; SRC[k + 2] = x1; SRC[k + 3] = y1; k += 4; } }
    SRC.length = k; if (!k) return -1;   /* (no gap on the screen: nothing of the far view can be seen) */ let a = 0; for (let i = 0; i < k; i += 4) a += (SRC[i + 2] - SRC[i]) * (SRC[i + 3] - SRC[i + 1]); STATS.seenN = k / 4; STATS.seenA = +(a / (W * H)).toFixed(3);
    return a > W * H * 0.85 ? 0 : k / 4; }
  // the GPU's rectangles: one pass each, so the bounding box unless the rectangles leave out more than 40% of it (then <= 4)
  const GRC = [];
  function coarse(R, n) { GRC.length = 0; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, a = 0; for (let i = 0; i < n * 4; i += 4) { x0 = Math.min(x0, R[i]); y0 = Math.min(y0, R[i + 1]); x1 = Math.max(x1, R[i + 2]); y1 = Math.max(y1, R[i + 3]); a += (R[i + 2] - R[i]) * (R[i + 3] - R[i + 1]); }
    if (n <= 4 && a < (x1 - x0) * (y1 - y0) * 0.6) { for (let i = 0; i < n * 4; i++) GRC.push(R[i]); return n; } GRC.push(x0, y0, x1, y1); return 1; }
  for (const [gap, land] of Object.entries(LAND_OF)) { const L = LANDS[land];
    GAPX[gap] = { base: L.base,
      paint(c, S, R) { c.fillStyle = L.base; c.fillRect(0, 0, S, S); for (let i = 0; i < 20; i++) { c.fillStyle = land === 'whiteout' ? `rgba(255,255,255,${0.2 + R() * 0.3})` : `rgba(220,240,255,${0.1 + R() * 0.35})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.1 ? 1.2 : 0.6, 0, TAU); c.fill(); } },
      back(c, o) { let V = null; const Lv = LIVE;
        if (Lv && Lv.X && Lv.land === land) { try { V = view(Lv.X, land); V.W = o.W; V.H = o.H; V.k = o.k || 1; V.t = o.t; } catch (e) { V = null; } }
        if (!V) { const T = Math.max(24, Math.min(o.W, o.H) / 10), cx = o.wx / T, cy = o.wy / T; V = { W: o.W, H: o.H, T, sx: x => (x - cx) * T + o.W / 2, sy: y => (y - cy) * T + o.H / 2, t: o.t, land, top: cy - 6, bot: cy + 6, k: o.k || 1 }; }
        const rn = Lv && Lv.X ? seenRects(Lv.X, o.W, o.H) : 0, gn = rn > 0 ? coarse(SRC, rn) : 0;
        if (rn < 0) { c.fillStyle = L.base; c.fillRect(0, 0, o.W, o.H); STATS.hidden = (STATS.hidden || 0) + 1; return; }   // (the land covers the screen: the base colour only, no pictures, no GPU pass)
        try { vista(c, V, { gpu: !!(Lv && Lv.X), rn, rects: SRC, gn, grects: GRC }); } catch (e) { c.fillStyle = L.base; c.fillRect(0, 0, o.W, o.H); } } }; }
  const OLDB = {};
  function install() { if (typeof BIOMES === 'undefined') return; for (const [gap, land] of Object.entries(LAND_OF)) { const B = BIOMES[land]; if (!B || B.__asky) continue; B.__asky = 1; const old = B.gap; OLDB[land] = old;
    try { Object.defineProperty(B, 'gap', { configurable: true, enumerable: true, get: () => (off() || !(HAS_W && window.BELPROPS) ? old : gap), set: () => {} }); } catch (e) { B.gap = gap; } } }
  install();

  /* ======================= the stage: its land's top and bottom edges ======================= */
  function stageOf(X) { const M = X.M, F = X.F || {}, land = LANDS[F.biome] ? F.biome : 'glacier', TG = typeof T_GAP !== 'undefined' ? T_GAP : 2, TS = typeof T_SOLID !== 'undefined' ? T_SOLID : 0;
    let y0 = 1e9, y1 = -1e9; if (M && M.G) { const G = M.G, MW = M.MW, MH = M.MH; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const g = G[y * MW + x]; if (g !== TG && g !== TS) { if (y < y0) y0 = y; if (y > y1) y1 = y; } } }
    if (!(y1 >= y0)) { y0 = X.me.y - 8; y1 = X.me.y + 8; } return { X, land, top: y0, bot: y1 + 1 }; }
  function hookRift() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.aurora; if (!Rf || Rf.__asky) return; Rf.__asky = 1;
    const oe = Rf.everyStage; Rf.everyStage = function (X) { let a = {}; try { a = oe ? oe.apply(this, arguments) || {} : {}; } catch (e) { a = {}; } try { LIVE = X.F && X.F.fiend ? null : stageOf(X); } catch (e) { LIVE = null; } return a; };
    const op = Rf.preload; Rf.preload = function (P) { let a = []; try { a = op ? op.apply(this, arguments) || [] : []; } catch (e) {} let b = []; try { hookArena(); b = warm(P); } catch (e) {} return a.concat(b); }; } catch (e) {} }
  hookRift();
  function release() { const n = CACHE.size; CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); CACHE.clear(); STATS.released += n; }
  function hookRelease() { try { if (typeof DunWorld === 'undefined' || !DunWorld.dropProps || DunWorld.dropProps.__asky) return; const od = DunWorld.dropProps; const f = function () { try { return od.apply(this, arguments); } finally { release(); LIVE = null; } }; for (const k in od) f[k] = od[k]; f.__asky = 1; DunWorld.dropProps = f; } catch (e) {} }
  hookRelease();
  function warm(P) { if (off() || !P || !(P.T > 0) || !P.F) return []; const land = LANDS[P.F.biome] ? P.F.biome : null; if (!land || P.F.fiend) return []; const L = LANDS[land], k = Math.min(3, P.k || 1), T = P.T, jobs = [], job = f => jobs.push(() => { try { f(); } catch (e) {} });
    job(() => rangeStrip(land, 'range2', sP(T * k))); job(() => rangeStrip(land, 'range', sP(T * k))); job(() => seaStrip(land, sP(T * k))); if (L.stars) job(() => starTile(land, Math.min(2, k)));
    for (const it of L.isles) { job(() => isle(land, it.v, pP(T * k * it.s))); if (it.prop && HAS_W && window.AUR_PROPS) job(() => window.AUR_PROPS.sprite(it.prop, it.pv || 0, Math.round(T * k * it.s * 0.7), L.L)); }
    return jobs; }

  /* ======================= the arenas: the fight's cached sky is this view, still ======================= */
  const MINE = { thul: 'glacier', nivora: 'observatory', ahuul: 'whiteout' };
  function wrapDef(id) { try { const D = typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS[id]; if (!D || D.__asky || typeof D.sky !== 'function') return; D.__asky = 1; const os = D.sky;
      D.sky = function (c, W, H, t, cam, T) { if (!off() && HAS_W && window.BELPROPS) { try { c.save(); const land = MINE[id], L = LANDS[land], V = { W, H, T, sx: x => (x - cam.x) * T + W / 2, sy: y => (y - cam.y) * T + H / 2, t: 0, land, top: cam.y - (id === 'thul' ? 12 : 14), bot: cam.y + 13, k: kOf(c) }; vista(c, V, { gpu: false }); c.restore(); STATS.arena++; return; } catch (e) { try { c.restore(); } catch (e2) {} } }
        return os.apply(this, arguments); }; } catch (e) {} }
  /* the arenas' floors: the fight's own ground (its shape, its marks and telegraphs' ground) painted as before, then the land's
     floor texture (20s6d: wind-packed snow and blue ice, the observatory's flagstones, the summit's powder) laid into it with an
     overlay and a soft light, so it carries the land's detail and light at Rift 03 / 04's grain without changing what it shows */
  const LN = { thul: 'glacier', nivora: 'obs', ahuul: 'white' };
  function wrapGround(id) { try { const D = typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS[id]; if (!D || D.__askyg || typeof D.paintGround !== 'function') return; D.__askyg = 1; const og = D.paintGround;
      D.paintGround = function (c, A2) { const r = og.apply(this, arguments); if (off() || !(HAS_W && window.AUR_PROPS && window.BELPROPS)) return r;
        try { const m = c.getTransform(), P = Math.max(8, Math.min(72, Math.round(Math.hypot(m.a, m.b)))), t = window.AUR_PROPS.tex('floor:' + LN[id], P); if (!t) return r; const R = A2.R;
          const pat = c.createPattern(t.cv, 'repeat'); if (!pat) return r; try { pat.setTransform(new DOMMatrix([1 / t.P, 0, 0, 1 / t.P, 0, 0])); } catch (e) { return r; }
          c.save(); c.beginPath(); c.arc(0, 0, R + 0.2, 0, TAU); c.clip(); c.fillStyle = pat; c.globalCompositeOperation = id === 'ahuul' ? 'multiply' : 'overlay'; c.globalAlpha = id === 'ahuul' ? 0.35 : 0.75; c.fillRect(-R - 1, -R - 1, R * 2 + 2, R * 2 + 2);
          c.globalCompositeOperation = 'soft-light'; c.globalAlpha = 0.45; c.fillRect(-R - 1, -R - 1, R * 2 + 2, R * 2 + 2);
          const g = c.createRadialGradient(0, 0, R * 0.5, 0, 0, R + 0.2); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, id === 'ahuul' ? 'rgba(150,175,200,.22)' : 'rgba(4,10,24,.3)'); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = g; c.fillRect(-R - 1, -R - 1, R * 2 + 2, R * 2 + 2); c.restore(); STATS.arenaFloor = (STATS.arenaFloor || 0) + 1; } catch (e) {}
        return r; }; } catch (e) {} }
  function hookArena() { for (const id in MINE) { wrapDef(id); wrapGround(id); } }
  if (typeof setTimeout === 'function') setTimeout(() => hookArena(), 0);   // (the boss files load after this one)

  const API = { vista, view, release, warm, LANDS, stageOf, install, OLDB, rangeStrip, seaStrip, isle, seenRects, arena: { hook: hookArena, MINE },
    get LIVE() { return LIVE; }, set LIVE(v) { LIVE = v; },
    get stats() { return Object.assign({ cached: CACHE.size, px: [...CACHE.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) }, STATS); } };
  if (HAS_W) window.AUR_SKY = API;
  return API;
})();
