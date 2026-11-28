/* ---------- v474 LE: the Library of Unwritten Lives' far views (Rift 07: its three lands and its three boss arenas) ----------
   What is seen past the edge of the playable land, at Rift 05 / 06's standard. Each land is one landscape fixed in the world (a
   thing's place on the screen is its place in the world minus the camera: nothing slides with the camera, nothing pops when the
   stage changes, and the layout repeats along x every `per` tiles so a stage of any width is covered). Over the land's top edge is
   its skyline; under its bottom edge the depth; beside it the gulf between:
     catalogue (the Catalogue of Truth): the endless library folded into a ruined university, adrift in ink: colossal bookcase
       towers on the horizon (shelves of spines, candles burning on their ledges, a gold rim from the moon), the university's domes
       and spires farther off in the haze; the black moon high over it (a disc of nothing ringed in gold, its corona combed out);
       far below, billows of ink lit violet with gold glints; fragments of the library drifting in the gulf (a slab of floor, its
       page block torn into ink, a bookcase or a lectern still standing on it); loose pages tumbling through the dark.
     binding (the Silver Bindery): white marble colonnades and silver domes under a silver moon; a sea of silver mist below; slabs
       of marble with a mirror or an urn drifting; white pages.
     archive (the Ascent of Light): golden temples and stairs on far clouds, cloud peaks beyond; heaven's light above (rays falling);
       a cloud sea below; cloud islands with a pillar, a monument, an arch; feathers drifting.
   Pictures (the skylines and the depths: 2D painted once per sharpness; the drifting fragments: BELPROPS.kit through LIB_PROPS in
   each land's light) are kept until the stage closes (DunWorld.dropProps, chained). The light is the GPU painter's (FGFX: LE-FX
   620 the black moon's corona, 621 the ink's drift, 624 heaven's rays, with glows), lowFx respected, laid only where the far view
   can be seen (the gaps' rectangles, as v472 YE). Without the GPU the pictures stay and the light is left out.
   The arenas (Syllax's Reading Circle, Vellum's Spilled-Ink Chamber, Nhalex's Final Archive): the fight's cached sky is this
   view, still (FIEND_DEFS[id].sky wrapped at run time: the boss files untouched), their floors carry the land's material grain
   laid into them (FIEND_DEFS[id].paintGround wrapped: the fight's own ground, its marks and shape, painted first as before), and
   their standing pieces are painted (the fights are set in the ink: each arena's sky is the Catalogue's view, the Final Archive's own opened skylight kept for the end) (drawProp wrapped: Syllax's bookcases, candelabras and stacks; Vellum's four lecterns, their
   pages, stains and drowning drawn live over the painted wood as before; Nhalex's eight great books, the painted cover swinging
   open on its spine over the painted pages).
   Hooks: BIOMES.catalogue / binding / archive .gap -> 'libcat' / 'libsilver' / 'libholy' (getters: the old 'inkvoid' / 'silvervoid'
   / 'celestial' while window.__LSKY is 0 or the painter is off) with their GAP_EXT backdrops; RIFT_BY_ID.library.everyStage
   (chained: the stage's horizon) and .preload (chained: the pictures painted on the loading screen).
   window.__LSKY = 0 turns all of it off; __LSKY_GL = 0 the GPU's part only. API (global LIB_SKY). */
var LIB_SKY = (() => {
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined';
  const off = () => HAS_W && (window.__LSKY === 0 || window.__LIBP === 0);
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const md = (a, n) => ((a % n) + n) % n;
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + (s | 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const hex = h => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const kOf = c => { const m = c && c.getTransform ? c.getTransform() : null; return m ? Math.max(0.5, Math.min(3, Math.hypot(m.a, m.b))) : 1; };
  const STATS = { painted: 0, paintMs: 0, frames: 0, quads: 0, released: 0, arena: 0, arenaFloor: 0, aprops: 0, afall: 0 };
  function pvn(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), q = p | 0 || 1;
    const X0 = ((xi % q) + q) % q, X1 = (X0 + 1) % q, Y0 = ((yi % q) + q) % q, Y1 = (Y0 + 1) % q, a = hh(X0, Y0, s), b = hh(X1, Y0, s), c = hh(X0, Y1, s), d = hh(X1, Y1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const pn1 = (x, p, s) => pvn(x, 0.5, p, s), pf1 = (x, p, s) => pn1(x, p, s) * 0.55 + pn1(x * 2, p * 2, s + 3) * 0.28 + pn1(x * 4, p * 4, s + 5) * 0.12 + pn1(x * 8, p * 8, s + 7) * 0.05;
  const GOLD = '#E8C36A', GOLD_HI = '#FFF0B8', INKV = '#8A5BD0', INKV_HI = '#CDB4FF', MOON = '#DCE6FF', HOLY = '#FFE9A8';

  /* ======================= the lands ======================= (ys: tiles relative to the land's top edge (t) or bottom edge (b)) */
  const LANDS = {
    catalogue: { gap: 'libcat', base: '#0C0914', per: 36, L: 'cat', zen: '#040209', sky: '#0D0817', hor: '#2C1A30', deep: '#0A0712', sea: '#2E1C44', seaHi: '#C8A0F0', seaSh: '#07050C', depth: 'ink', pages: '#F4EAD2',
      range: { t: -1.0, h: 5.6, sh: '#140B14', lit: '#4A2E30', rim: '#F2D28A', haze: '#2C1A30', seed: 11, style: 'stacks', lights: ['#FFD27A', '#FFB85A', '#FFF0B8'] }, range2: { t: -3.4, h: 4.8, sh: '#110A16', lit: '#2A1C2E', rim: '#9A70D8', haze: '#22142C', seed: 17, style: 'spires', lights: ['#FFD27A'] },
      moon: { fx: 0.68, t: -10.5, r: 2.4, black: 1, col: GOLD }, drift: INKV, motes: GOLD_HI,
      isles: [{ fx: 0.15, b: 5, s: 1.0, v: 0, prop: 'bookcase', pv: 1 }, { fx: 0.55, b: 9, s: 0.8, v: 1, prop: 'lectern', pv: 0 }, { fx: 0.85, b: 4, s: 0.7, v: 2, prop: 'candelabra', pv: 0 }, { fx: 0.38, t: -3.6, s: 0.55, v: 1, prop: 'bookstack', pv: 1 }] },
    binding: { gap: 'libsilver', base: '#10141F', per: 36, L: 'silver', zen: '#05070D', sky: '#0E1324', hor: '#2A3452', deep: '#0C101C', sea: '#3E4866', seaHi: '#EEF2FF', seaSh: '#0A0D18', depth: 'mist', pages: '#FFFFFF',
      range: { t: -1.0, h: 5.6, sh: '#1A2030', lit: '#8A96B4', rim: '#F0F4FF', haze: '#2A3452', seed: 23, style: 'colonnade', lights: ['#DCE6FF', '#B8C8FF', '#FFFFFF'] }, range2: { t: -3.6, h: 4.8, sh: '#141A2A', lit: '#3E4864', rim: '#B8C8FF', haze: '#222A44', seed: 29, style: 'domes', lights: ['#DCE6FF'] },
      moon: { fx: 0.7, t: -10.5, r: 2.2, black: 0, col: MOON }, drift: '#B8C8FF', motes: '#FFFFFF',
      isles: [{ fx: 0.18, b: 5, s: 1.0, v: 0, prop: 'mirror', pv: 0 }, { fx: 0.6, b: 8.5, s: 0.8, v: 1, prop: 'silverurn', pv: 1 }, { fx: 0.88, b: 4, s: 0.7, v: 2, prop: 'bookcase', pv: 0 }, { fx: 0.4, t: -3.6, s: 0.55, v: 1, prop: null }] },
    archive: { gap: 'libholy', base: '#D8E4FA', per: 36, L: 'holy', zen: '#8EAEE6', sky: '#BDD3F8', hor: '#FFEFD2', deep: '#D6E2F8', sea: '#E6EEFC', seaHi: '#FFFFFF', seaSh: '#9EB0DA', depth: 'clouds', pages: '#FFFFFF', feathers: 1,
      range: { t: -1.0, h: 5.6, sh: '#C8B490', lit: '#FFF6E0', rim: '#FFFFFF', haze: '#FFF2DA', seed: 31, style: 'temple', lights: ['#FFE9A8', '#E8C36A'] }, range2: { t: -3.6, h: 5.0, sh: '#C2D0EE', lit: '#FFFFFF', rim: '#FFFFFF', haze: '#E8EEFF', seed: 37, style: 'cloudpeaks', lights: [] },
      sun: { fx: 0.5, t: -9.5, col: HOLY }, drift: '#FFE9A8', motes: GOLD_HI,
      isles: [{ fx: 0.2, b: 5, s: 1.0, v: 0, prop: 'platpillar', pv: 0 }, { fx: 0.62, b: 8.5, s: 0.8, v: 1, prop: 'angelstatue', pv: 1 }, { fx: 0.88, b: 4, s: 0.7, v: 2, prop: 'haloarch', pv: 0 }, { fx: 0.4, t: -3.6, s: 0.55, v: 1, prop: null }] } };
  const LAND_OF = {}; for (const k in LANDS) LAND_OF[LANDS[k].gap] = k;

  /* ======================= the pictures ======================= */
  const CACHE = new Map();
  const keep = (key, f) => { let s = CACHE.get(key); if (s) return s; const t0 = now(); s = f(); if (s) { CACHE.set(key, s); STATS.painted++; STATS.paintMs += now() - t0; } return s; };
  // the skyline behind the land's top edge, per tiles wide (it repeats), h tall, in its style:
  //   stacks: bookcase towers (posts, shelves of spines, candles on the ledges, pediments), the moon's gold on every top edge
  //   spires: the ruined university beyond: domes, gothic spires and gables, a few lit windows
  //   colonnade: white marble colonnades (round columns lit down one side, an entablature), towers with cupolas
  //   domes: silver domes and drums beyond
  //   temple: golden temples on clouds: stepped stairs, columns, gold roofs
  //   cloudpeaks: billowing cloud mountains
  function rangeStrip(land, which, P) { const L = LANDS[land], R0 = L[which], per = L.per; return keep(`range|${land}|${which}|${P}`, () => {
    const W = Math.round(per * P), H = Math.round(R0.h * P), cv = mkc(W, H), c = cv.getContext('2d'), im = c.createImageData(W, H), d = im.data, lit = hex(R0.lit), sh = hex(R0.sh), rim = hex(R0.rim), hz = hex(R0.haze), sty = R0.style, LC = R0.lights.map(hex);
    const ridge = new Float32Array(W + 1), seg = (u, w) => { const i = Math.floor(u / w); return { i, f: md(u, w) / w, h: hh(md(i, Math.round(per / w)), 1, R0.seed) }; };
    for (let x = 0; x <= W; x++) { const u = x / P; let r;
      if (sty === 'stacks') { const s = seg(u, 1.8), base = 0.42 + 0.45 * s.h, ped = hh(s.i, 2, R0.seed) > 0.5 ? 0.1 * Math.sqrt(Math.max(0, 1 - Math.pow(s.f * 2 - 1, 2))) : 0, gap = s.f < 0.04 || s.f > 0.96 ? -0.06 : 0; r = base + ped + gap + 0.03 * pf1(u / per * 30, 30, R0.seed); }
      else if (sty === 'spires') { const s = seg(u, 2.6), base = 0.3 + 0.25 * s.h, kind = hh(s.i, 3, R0.seed), cx = Math.abs(s.f - 0.5) * 2; r = base + (kind < 0.4 ? 0.45 * Math.max(0, 1 - cx * 1.6) : kind < 0.75 ? 0.25 * Math.sqrt(Math.max(0, 1 - cx * cx * 1.6)) : 0.15 * Math.max(0, 1 - cx)) + 0.05 * pf1(u / per * 11, 11, R0.seed); }
      else if (sty === 'colonnade') { const s = seg(u, 4.5), tower = s.h > 0.62 && s.f > 0.3 && s.f < 0.7, cx = Math.abs(s.f - 0.5) / 0.2; r = 0.55 + (tower ? 0.22 + 0.12 * Math.sqrt(Math.max(0, 1 - cx * cx)) : 0) + 0.02 * pf1(u / per * 9, 9, R0.seed); }
      else if (sty === 'domes') { const s = seg(u, 3.2), cx = Math.abs(s.f - 0.5) * 2; r = 0.32 + 0.18 * s.h + 0.3 * Math.sqrt(Math.max(0, 1 - cx * cx)) * (0.6 + 0.4 * s.h) + (cx < 0.06 ? 0.08 : 0); }
      else if (sty === 'temple') { const s = seg(u, 6), cx = Math.abs(s.f - 0.5) * 2, tier = Math.floor((1 - cx) * 5) / 5; r = 0.3 + 0.12 * pf1(u / per * 7, 7, R0.seed) + (s.h > 0.35 ? 0.38 * tier + (cx < 0.12 ? 0.12 : 0) : 0.08 * tier); }
      else { r = 0.35 + 0.5 * Math.pow(pf1(u / per * 6, 6, R0.seed), 1.3) + 0.12 * Math.abs(Math.sin(u * 1.7 + pf1(u / per * 13, 13, R0.seed) * 4)); }
      ridge[x] = H * clamp(r, 0.05, 0.98); }
    for (let x = 0; x < W; x++) { const top = H - ridge[x], u = x / P;
      for (let y = Math.max(0, Math.floor(top)); y < H; y++) { const dz = (y - top) / P, k = (y - top) / Math.max(1, H - top), zz = (H - y) / P; let r, g, b, lk = 0, lc = null;
        if (sty === 'stacks') { const s = seg(u, 1.8), post = s.f < 0.07 || s.f > 0.93, shelf = Math.abs(md(zz, 0.42) - 0.04) < 0.035, bi = Math.floor(u / 0.06), bc = hh(bi, Math.floor(zz / 0.42), R0.seed + 5), face = post ? (s.f < 0.07 ? 0.9 : 0.25) : 0.4 + 0.3 * bc;
          r = lerp(sh[0], lit[0], face); g = lerp(sh[1], lit[1], face); b = lerp(sh[2], lit[2], face); if (!post && !shelf) { const tint = [[1.2, 0.6, 0.7], [0.6, 0.7, 1.1], [0.7, 1.0, 0.7], [1.1, 0.95, 0.6]][Math.floor(bc * 4)]; r *= tint[0]; g *= tint[1]; b *= tint[2]; if (md(u, 0.06) < 0.01) { r *= 0.6; g *= 0.6; b *= 0.6; } }
          if (shelf) { r = lerp(sh[0], lit[0], 0.75); g = lerp(sh[1], lit[1], 0.75); b = lerp(sh[2], lit[2], 0.75); }
          const cdl = hh(Math.floor(u / 0.3), Math.floor(zz / 0.42), R0.seed + 7) < 0.05 && Math.abs(md(u, 0.3) - 0.15) < 0.03 && md(zz, 0.42) > 0.06 && md(zz, 0.42) < 0.2; if (cdl && dz > 0.2) { lk = 1; lc = LC[Math.floor(hh(Math.floor(u / 0.3), 9, R0.seed) * LC.length)]; } }
        else if (sty === 'spires' || sty === 'domes') { const sl = (ridge[Math.min(W, x + 2)] - ridge[Math.max(0, x - 2)]) / 4, face = ss(-0.3, 0.3, sl * 1.5 + 0.2); r = lerp(sh[0], lit[0], face * 0.7); g = lerp(sh[1], lit[1], face * 0.7); b = lerp(sh[2], lit[2], face * 0.7);
          const wi = Math.floor(u / 0.35), wz = Math.floor(zz / 0.55), win = hh(wi, wz, R0.seed + 3) < (sty === 'domes' ? 0.06 : 0.08) && Math.abs(md(u, 0.35) - 0.17) < 0.05 && md(zz, 0.55) > 0.12 && md(zz, 0.55) < 0.36 + 0.05 * Math.sqrt(Math.max(0, 1 - Math.pow((md(u, 0.35) - 0.17) / 0.05, 2))); if (win && dz > 0.25 && LC.length) { lk = 0.85; lc = LC[0]; } }
        else if (sty === 'colonnade') { const s = seg(u, 4.5), tower = s.h > 0.62 && s.f > 0.3 && s.f < 0.7, cu = md(u, 0.6) / 0.6, col = Math.abs(cu - 0.5) < 0.22, ang = col ? Math.cos((cu - 0.5) / 0.22 * Math.PI * 0.5) : 0, ent = dz < 0.32, base = zz < 0.25;
          let s0 = ent || base ? 0.8 : col ? 0.3 + 0.7 * ang * (cu < 0.5 ? 1 : 0.6) : 0.08; if (tower && !ent) s0 = 0.55 + 0.2 * Math.cos((s.f - 0.5) / 0.2 * 1.5); r = lerp(sh[0], lit[0], s0); g = lerp(sh[1], lit[1], s0); b = lerp(sh[2], lit[2], s0);
          if (ent && Math.abs(dz - 0.16) < 0.03) { r *= 0.8; g *= 0.8; b *= 0.85; } if (!col && !ent && !base && !tower && hh(Math.floor(u / 0.6), 4, R0.seed) < 0.3) { lk = 0.5; lc = LC[1]; } }
        else if (sty === 'temple') { const s = seg(u, 6), cx = Math.abs(s.f - 0.5) * 2, step = Math.abs(md((1 - cx) * 5, 1) - 0.5) > 0.42, roof = dz < 0.1 && s.h > 0.35, colm = s.h > 0.35 && Math.abs(md(u, 0.5) - 0.25) < 0.07 && dz > 0.1 && dz < 0.6;
          let s0 = 0.75 + 0.2 * (s.f < 0.5 ? 1 : -0.6) * (1 - cx); if (step) s0 *= 0.75; if (colm) s0 = 0.95; r = lerp(sh[0], lit[0], s0); g = lerp(sh[1], lit[1], s0); b = lerp(sh[2], lit[2], s0); if (roof) { r = 232; g = 190; b = 100; } }
        else { const fold = Math.pow(Math.abs(Math.sin(u * 2.1 + zz * 1.3 + pf1(u / per * 9, 9, R0.seed) * 5)), 3), s0 = 0.55 + 0.45 * ss(0.4, 0, dz) - 0.25 * fold; r = lerp(sh[0], lit[0], s0); g = lerp(sh[1], lit[1], s0); b = lerp(sh[2], lit[2], s0); }
        const cr = Math.exp(-dz * dz / 0.004); r = lerp(r, rim[0], cr * 0.75); g = lerp(g, rim[1], cr * 0.75); b = lerp(b, rim[2], cr * 0.75);
        const hzk = ss(0.35, 1, k) * 0.6; r = lerp(r, hz[0], hzk); g = lerp(g, hz[1], hzk); b = lerp(b, hz[2], hzk);
        if (lk > 0 && lc) { r = lerp(r, lc[0], lk); g = lerp(g, lc[1], lk); b = lerp(b, lc[2], lk); }
        const i = (y * W + x) * 4, aa = y < top + 1 ? clamp(y + 1 - top, 0, 1) : 1; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255 * aa; } }
    c.putImageData(im, 0, 0); return { cv, P, W, H }; }); }
  // the depth far below: the ink's billows (lit violet on their rims, gold glints), the silver mist, the cloud sea (white billows,
  // blue in their folds)
  function seaStrip(land, P) { const L = LANDS[land], per = L.per; return keep(`sea|${land}|${P}`, () => {
    const W = Math.round(per * P), H = Math.round(6 * P), cv = mkc(W, H), c = cv.getContext('2d'), im = c.createImageData(W, H), d = im.data, hi = hex(L.seaHi), mid = hex(L.sea), sh = hex(L.seaSh);
    for (let x = 0; x < W; x++) { const u = x / P, top = P * (0.5 + 1.0 * pf1(u / per * 9, 9, 41) + 0.35 * pn1(u / per * 31, 31, 43));
      for (let y = Math.max(0, Math.floor(top)); y < H; y++) { const dz = (y - top) / P; let k;
        const bil = pvn(u * 1.3, dz * 1.6, Math.round(per * 1.3), 45), rimk = ss(0.5, 0.0, dz) * (0.6 + 0.4 * bil), fold = ss(0.45, 0.75, pvn(u * 2.6, dz * 2.2, Math.round(per * 2.6), 47));
        if (L.depth === 'clouds') k = clamp(0.55 + rimk * 0.45 + (1 - fold) * 0.2 - dz * 0.05 - 0.25 * (1 - bil), 0, 1); else k = clamp(rimk * 0.8 + (1 - fold) * 0.25 - dz * 0.06, 0, 1);
        const i = (y * W + x) * 4; d[i] = k > 0.5 ? lerp(mid[0], hi[0], (k - 0.5) * 2) : lerp(sh[0], mid[0], k * 2); d[i + 1] = k > 0.5 ? lerp(mid[1], hi[1], (k - 0.5) * 2) : lerp(sh[1], mid[1], k * 2); d[i + 2] = k > 0.5 ? lerp(mid[2], hi[2], (k - 0.5) * 2) : lerp(sh[2], mid[2], k * 2);
        if (L.depth === 'ink' && hh(Math.floor(u * 9), Math.floor(dz * 9), 49) < 0.012) { d[i] = 255; d[i + 1] = 214; d[i + 2] = 140; }
        d[i + 3] = 255 * clamp(y + 1 - top, 0, 1) * (L.depth === 'clouds' ? 1 : 1 - ss(4.5, 6, dz + top / P)); } }
    c.putImageData(im, 0, 0); return { cv, P, W, H }; }); }
  // the moon: the Catalogue's black moon (a disc of nothing, a gold rim and a faint violet sheen within) or the Bindery's silver moon
  function moonPic(land, P) { const L = LANDS[land], M = L.moon; return keep(`moon|${land}|${P}`, () => { const R = M.r * P, S = Math.ceil(R * 2 + 8), cv = mkc(S, S), c = cv.getContext('2d'), o = S / 2;
    if (M.black) { const g = c.createRadialGradient(o - R * 0.3, o - R * 0.35, R * 0.1, o, o, R); g.addColorStop(0, '#1A1026'); g.addColorStop(0.7, '#08050E'); g.addColorStop(1, '#030207'); c.fillStyle = g; c.beginPath(); c.arc(o, o, R, 0, TAU); c.fill(); c.strokeStyle = 'rgba(242,220,154,.85)'; c.lineWidth = Math.max(1, R * 0.03); c.stroke(); }
    else { const g = c.createRadialGradient(o - R * 0.3, o - R * 0.3, R * 0.1, o, o, R); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.75, '#DCE4F4'); g.addColorStop(1, '#AEBAD4'); c.fillStyle = g; c.beginPath(); c.arc(o, o, R, 0, TAU); c.fill();
      c.save(); c.clip(); const Rr = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(91); for (let i = 0; i < 16; i++) { const a = Rr() * TAU, dd = Math.sqrt(Rr()) * R * 0.85, rr = R * (0.04 + Rr() * 0.14), x = o + Math.cos(a) * dd, y = o + Math.sin(a) * dd; const cg = c.createRadialGradient(x + rr * 0.2, y + rr * 0.2, rr * 0.1, x, y, rr); cg.addColorStop(0, 'rgba(140,152,184,.45)'); cg.addColorStop(0.8, 'rgba(160,172,200,.3)'); cg.addColorStop(1, 'rgba(255,255,255,.25)'); c.fillStyle = cg; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); } c.restore(); }
    return { cv, R, S }; }); }
  // a page (or, in the Ascent, a feather) drifting through the gulf
  function pagePic(land, P) { const L = LANDS[land]; return keep(`page|${land}|${P}`, () => { const w = Math.ceil(P * 0.5), h = Math.ceil(P * 0.66), cv = mkc(w + 4, h + 4), c = cv.getContext('2d');
    if (L.feathers) { c.translate((w + 4) / 2, (h + 4) / 2); c.beginPath(); c.moveTo(0, h * 0.48); c.quadraticCurveTo(w * 0.45, 0, w * 0.05, -h * 0.48); c.quadraticCurveTo(-w * 0.4, 0, 0, h * 0.48); const g = c.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#E2E6F4'); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(200,170,110,.7)'; c.lineWidth = Math.max(1, P * 0.02); c.beginPath(); c.moveTo(0, h * 0.48); c.quadraticCurveTo(w * 0.05, 0, w * 0.04, -h * 0.4); c.stroke(); return { cv }; }
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, L.pages); g.addColorStop(1, land === 'catalogue' ? '#C9B48A' : '#C8D0E4'); c.fillStyle = g; c.fillRect(2, 2, w, h); c.strokeStyle = 'rgba(40,30,50,.35)'; c.lineWidth = Math.max(0.6, P * 0.012); c.beginPath(); for (let j = 0; j < 6; j++) { const y = 2 + h * (0.18 + j * 0.12); c.moveTo(2 + w * 0.15, y); c.lineTo(2 + w * (0.55 + 0.3 * ((j * 7) % 3) / 2), y); } c.stroke(); return { cv }; }); }
  // the gulf's own texture, a wrapping tile fixed in the world: currents of ink curling (violet; the Bindery's pale silver), faint
  // lines of script in gold, specks; the Ascent's: soft wisps of cloud
  function voidTile(land, P) { const L = LANDS[land]; return keep(`void|${land}|${P}`, () => { const N = 8, S = Math.round(N * P), cv = mkc(S, S), c = cv.getContext('2d'), R = (q => () => (q = (q * 16807) % 2147483647) / 2147483647)(land.length * 977 + 5), wrap = f => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) f(ox, oy); };
    if (L.depth === 'clouds') { for (let i = 0; i < 14; i++) { const x = R() * S, y = R() * S, r = P * (0.6 + R() * 1.4); wrap((ox, oy) => { const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.save(); c.translate(x + ox, y + oy); c.scale(1.8, 0.6); c.translate(-x - ox, -y - oy); c.beginPath(); c.arc(x + ox, y + oy, r, 0, TAU); c.fill(); c.restore(); }); } return { cv, S, N }; }
    const cur = land === 'binding' ? '200,212,240' : '120,80,170', scr = land === 'binding' ? '230,238,255' : '242,210,138'; c.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const x = R() * S, y = R() * S, w = P * (0.6 + R() * 1.6), a = 0.08 + R() * 0.16, lw = P * (0.03 + R() * 0.06), curl = R() < 0.4; wrap((ox, oy) => { c.strokeStyle = `rgba(${cur},${a})`; c.lineWidth = lw; c.beginPath(); c.moveTo(x + ox - w, y + oy); c.bezierCurveTo(x + ox - w * 0.3, y + oy - P * 0.3, x + ox + w * 0.3, y + oy + P * 0.3, x + ox + w, y + oy); if (curl) c.arc(x + ox + w, y + oy - P * 0.15, P * 0.15, Math.PI / 2, Math.PI * 2.2); c.stroke(); }); }
    for (let i = 0; i < 9; i++) { const x = R() * S, y = R() * S, n = 4 + Math.floor(R() * 6), a = 0.1 + R() * 0.12; wrap((ox, oy) => { c.strokeStyle = `rgba(${scr},${a})`; c.lineWidth = Math.max(0.6, P * 0.025); c.beginPath(); c.moveTo(x + ox, y + oy); for (let j = 1; j <= n * 2; j++) c.quadraticCurveTo(x + ox + (j - 0.5) * P * 0.12, y + oy + (j % 2 ? -1 : 1) * P * 0.08, x + ox + j * P * 0.12, y + oy); c.stroke(); }); }
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(${scr},${0.2 + R() * 0.5})`; c.beginPath(); c.arc(R() * S, R() * S, P * (R() < 0.15 ? 0.04 : 0.02), 0, TAU); c.fill(); }
    return { cv, S, N }; }); }
  // a fragment in the gulf (the kit): the floor's slab (its material, a gilt edge) over its page block torn into ink drips (the
  // Ascent's: a cloud island)
  function isle(land, v, P) { const A = HAS_W && window.LIB_PROPS, B = HAS_W && window.BELPROPS, Y = HAS_W && window.YUG_PROPS; if (!A || !B || !B.kit || !Y || !Y.kitx) return null; const L = LANDS[land].L;
    return keep(`isle|${land}|${v}|${P}`, () => { const K = B.kit, X = Y.kitx, X2 = A.kitx, w = [1.7, 1.25, 1.0][v % 3], S = K.surface(-w - 0.5, -0.9, w + 0.5, 3.6, P), sd = 300 + v * 17;
      try { X2.lit(K, L, () => { const R = K.R1(sd);
          if (L === 'holy') { const puffs = []; for (let i = 0; i < 9; i++) puffs.push([(R() - 0.5) * w * 1.8, 0.1 + R() * 0.9, 0.3 + R() * 0.35]); puffs.sort((a, b) => a[1] - b[1]); for (const [x, y, r] of puffs) X.lump(K, S, x, y, r * w / 1.4, r * 0.7, { amp: 0.12, fr: 3, sd: sd + x * 9, bump: 0.25, leaf: 4, mat: (dx, dy, ao, e) => X2.cloudM(K, dx + x, dy + y, sd, 1 - e) }); S.unlock();
            K.rbox(S, 0, 0.08, w * 0.9, 0.35, 0, 0.18, 0.05, (f, u, vv) => { X2.marbleL(K, u * 2, vv * 2, sd, L); if (f === 'f' && Math.abs(vv - 0.09) < 0.025) X2.metalM(K, u * 4, vv, sd, L, 0.4); }); S.unlock(); }
          else { K.rbox(S, 0, 0.08, w, 0.38, -0.22, 0.0, 0.03, (f, u, vv) => { X2.parchM(K, u * 3, vv * 40, sd, false); if (md(vv * 50, 1) < 0.3) K.M.ao *= 0.8; }); S.unlock();
            const drips = []; for (let i = 0; i < 9; i++) { const x = (R() - 0.5) * w * 1.9, len = 0.4 + R() * 1.6; drips.push([x, len]); } for (const [x, len] of drips) K.tube(S, [[x, 0.3], [x + (R() - 0.5) * 0.1, 0.3 + len]], 0.07, 0.015, (t, s2) => { X2.inkGlassM(K, t, s2, sd); X2.glowAdd(K.M, X2.E_INK, 0.05); }); S.unlock();
            K.rbox(S, 0, 0.08, w + 0.04, 0.4, 0, 0.2, 0.04, (f, u, vv) => { X2.marbleL(K, u * 2, vv * 2, sd, L); if (f === 'f' && Math.abs(vv - 0.1) < 0.025) X2.metalM(K, u * 4, vv, sd, L, 0.4); }); S.unlock();
            const c = S.c; c.save(); c.globalCompositeOperation = 'destination-out'; const g = c.createLinearGradient(0, 1.2, 0, 3.4); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); c.fillStyle = g; c.fillRect(-w - 0.5, 1.2, w * 2 + 1, 2.4); c.restore(); }
          K.ink(S, X2.INK[L], 0.35); }); }
      catch (e) { if (typeof console !== 'undefined') console.warn('LIB_SKY isle', e); S.cv.width = S.cv.height = 1; return null; }
      const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1; return { cv, ax: S.ax, ay: S.ay, P }; }); }
  const LADDER = [12, 18, 24, 32, 44, 60];
  const pP = want => LADDER.find(q => q >= want) || LADDER[LADDER.length - 1];
  const sP = Tk => Math.min(60, pP(Tk * 0.55));

  /* ======================= the view ======================= */
  let LIVE = null;
  function view(X, land) { const T = X.Tz(), L = LIVE; return { W: X.W(), H: X.H(), T, sx: X.sx, sy: X.sy, t: X.g ? X.g.t : now() / 1000, land, top: L ? L.top : X.me.y - 8, bot: L ? L.bot : X.me.y + 8, k: 1 }; }
  function each(V, per, fx, r, f) { const camX = (V.W / 2 - V.sx(0)) / V.T, lo = camX - V.W / 2 / V.T - r, hi = camX + V.W / 2 / V.T + r;
    for (let n = Math.floor((lo - fx * per) / per); n <= Math.ceil((hi - fx * per) / per); n++) { const xw = fx * per + n * per; if (xw < lo || xw > hi) continue; f(xw, n); } }
  function blitPart(c, cv, x, y, w, h, W, H) { const a0 = Math.max(0, -x / w), a1 = Math.min(1, (W - x) / w), b0 = Math.max(0, -y / h), b1 = Math.min(1, (H - y) / h); if (a1 <= a0 || b1 <= b0) return;
    c.drawImage(cv, a0 * cv.width, b0 * cv.height, (a1 - a0) * cv.width, (b1 - b0) * cv.height, x + a0 * w, y + b0 * h, (a1 - a0) * w, (b1 - b0) * h); }
  const gpuF = () => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__LSKY_GL === 0)) return null; const F = HAS_W && window.NIDHOGG_MOVES && window.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  function vista(c, V, o) { o = o || {}; const L = LANDS[V.land]; if (!L) return; STATS.frames++;
    if (o.rn > 0) { const R = o.rects; c.save(); try { c.beginPath(); for (let i = 0; i < o.rn * 4; i += 4) c.rect(R[i], R[i + 1], R[i + 2] - R[i], R[i + 3] - R[i + 1]); c.clip(); vistaIn(c, V, o, L); } finally { c.restore(); } return; }
    vistaIn(c, V, o, L); }
  function vistaIn(c, V, o, L) { const W = V.W, H = V.H, T = V.T, k = V.k || 1, t = V.t, yt = dy => V.sy(V.top + dy), yb = dy => V.sy(V.bot + dy), lf = lowFx();
    { const y0 = yt(-18), y1 = yt(0), y2 = yb(2), y3 = yb(9), g = c.createLinearGradient(0, y0, 0, y3), span = Math.max(1, y3 - y0), at = y => clamp((y - y0) / span, 0, 1);
      g.addColorStop(0, L.zen); g.addColorStop(at(y1 - T * 3), L.sky); g.addColorStop(at(y1), L.hor); g.addColorStop(clamp(at(y1) + 0.02, 0, 1), L.deep); g.addColorStop(at(y2), L.deep); g.addColorStop(1, L.sea); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    const F = o.gpu === false ? null : gpuF();
    // the moon / heaven's light, behind the skyline
    if (L.moon) each(V, L.per, L.moon.fx, L.moon.r * 3, xw => { const X = V.sx(xw), Y = yt(L.moon.t), Pm = pP(L.moon.r * T * k * 0.5), m = moonPic(V.land, Pm), sz = m.S / Pm * T; if (Y < -sz || Y > H + sz) return;
      if (!L.moon.black) { const gg = c.createRadialGradient(X, Y, 0, X, Y, L.moon.r * T * 3.2); gg.addColorStop(0, 'rgba(220,230,255,.32)'); gg.addColorStop(1, 'rgba(220,230,255,0)'); c.fillStyle = gg; c.fillRect(X - L.moon.r * T * 3.2, Y - L.moon.r * T * 3.2, L.moon.r * T * 6.4, L.moon.r * T * 6.4); }
      else if (!F) { const gg = c.createRadialGradient(X, Y, L.moon.r * T, X, Y, L.moon.r * T * 2.4); gg.addColorStop(0, 'rgba(242,210,138,.3)'); gg.addColorStop(1, 'rgba(242,210,138,0)'); c.fillStyle = gg; c.fillRect(X - L.moon.r * T * 2.4, Y - L.moon.r * T * 2.4, L.moon.r * T * 4.8, L.moon.r * T * 4.8); }
      c.drawImage(m.cv, X - sz / 2, Y - sz / 2, sz, sz); });
    if (L.sun) each(V, L.per, L.sun.fx, L.per * 0.6, xw => { const X = V.sx(xw), Y = yt(L.sun.t), R = T * 9; if (Y < -R || Y > H + R) return; const gg = c.createRadialGradient(X, Y, 0, X, Y, R); gg.addColorStop(0, 'rgba(255,250,232,.95)'); gg.addColorStop(0.25, 'rgba(255,240,200,.55)'); gg.addColorStop(1, 'rgba(255,236,190,0)'); c.fillStyle = gg; c.fillRect(X - R, Y - R, R * 2, R * 2); });
    if (F && (L.moon || L.sun)) { try { const Q = F.begin(c, null); if (o.gn > 0 && Q.clipTo) Q.clipTo(o.grects, o.gn); skyLight(Q, V, L, lf, t); if (Q.nl || Q.ns) { STATS.quads += (Q.nl + Q.ns) / 6; STATS.passes = (STATS.passes || 0) + 1; F.flush(c); } } catch (e) {} }
    for (const which of ['range2', 'range']) { const R0 = L[which], Ptx = sP(T * k), s = rangeStrip(V.land, which, Ptx), wp = L.per * T, Hp = R0.h * T, Y = yt(R0.t) - Hp; if (Y > H || Y + Hp < 0) continue;
      for (let x = md(V.sx(which === 'range2' ? L.per * 0.37 : 0), wp) - wp; x < W; x += wp) if (x + wp > 0) blitPart(c, s.cv, x, Y, wp + 0.6, Hp + 0.6, W, H);
      const yf = Y + Hp, g = c.createLinearGradient(0, yf - T * 0.8, 0, yf + T * 0.6), hz = L.hor; g.addColorStop(0, hz + '00'); g.addColorStop(0.6, hz); g.addColorStop(1, L.deep); c.fillStyle = g; c.fillRect(0, yf - T * 0.8, W, T * 1.4); }
    { const s = seaStrip(V.land, sP(T * k)), wp = L.per * T, Hp = 6 * T, Y = yb(3.5); if (Y < H && Y + Hp > 0) { for (let x = md(V.sx(0) + t * T * 0.04, wp) - wp; x < W; x += wp) if (x + wp > 0) blitPart(c, s.cv, x, Y, wp + 0.6, Hp, W, H); if (Y + Hp < H) { c.fillStyle = L.depth === 'clouds' ? L.seaHi : L.seaSh; c.fillRect(0, Y + Hp - 1, W, H - Y - Hp + 1); } } }
    { const vt = voidTile(V.land, sP(T * k)), S2 = vt.N * T, Y0 = Math.max(0, yt(0.5)), ox = md(V.sx(0) + t * T * 0.05, S2) - S2, oy = md(V.sy(0), S2) - S2; if (Y0 < H) for (let x = ox; x < W; x += S2) for (let y = oy; y < H; y += S2) if (y + S2 > Y0) c.drawImage(vt.cv, x, y, S2 + 0.5, S2 + 0.5); }
    for (const it of L.isles) { const P2 = pP(T * k * it.s), base = it.b != null ? yb(it.b) : yt(it.t); each(V, L.per, it.fx, 4 * it.s + 2, xw => { const X = V.sx(xw), Y = base + Math.sin(t * 0.4 + it.fx * 9) * T * 0.12; if (Y < -T * 6 || Y > H + T * 5) return;
      const s = isle(V.land, it.v, P2); if (!s) return; const f = T * it.s / s.P; c.drawImage(s.cv, X - s.ax * f, Y - s.ay * f, s.cv.width * f, s.cv.height * f);
      if (it.prop && HAS_W && window.LIB_PROPS) window.LIB_PROPS.piece(c, it.prop, it.pv || 0, X, Y - T * 0.05 * it.s, T * it.s * 0.62, { L: L.L }); }); }
    pagesDraw(c, V, L);
    if (F) { try { const Q = F.begin(c, null); if (o.gn > 0 && Q.clipTo) Q.clipTo(o.grects, o.gn); airLight(Q, V, L, lf, t); if (Q.nl || Q.ns) { STATS.quads += (Q.nl + Q.ns) / 6; STATS.passes = (STATS.passes || 0) + 1; F.flush(c); } } catch (e) {} }
  }
  // the pages (feathers) tumbling through the gulf: in world cells of 7 tiles, one in some, drifting on a slow loop
  function pagesDraw(c, V, L) { const T = V.T, W = V.W, H = V.H, t = V.t, C = 7, camX = (W / 2 - V.sx(0)) / T, camY = (H / 2 - V.sy(0)) / T, pp = pagePic(V.land, pP(T * (V.k || 1)));
    const gx0 = Math.floor((camX - W / 2 / T) / C) - 1, gx1 = Math.ceil((camX + W / 2 / T) / C), gy0 = Math.floor((camY - H / 2 / T) / C) - 1, gy1 = Math.ceil((camY + H / 2 / T) / C), sz = T * 0.5, sh = sz * pp.cv.height / pp.cv.width;
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) { if (hh(gx, gy, 71) > 0.45) continue; const ph = hh(gx, gy, 72) * TAU, sp = 0.05 + hh(gx, gy, 73) * 0.05, u = md(t * sp + hh(gx, gy, 74), 1), xw = (gx + hh(gx, gy, 75)) * C + Math.sin(t * 0.3 + ph) * 1.2 + (u - 0.5) * C * 0.5, yw = (gy + hh(gx, gy, 76)) * C + (L.feathers ? u : u * 0.6) * C * 0.7 - C * 0.35;
      const X = V.sx(xw), Y = V.sy(yw); if (X < -sz * 2 || X > W + sz * 2 || Y < -sz * 2 || Y > H + sz * 2) continue; const a = Math.sin(u * Math.PI);
      c.save(); c.globalAlpha = 0.75 * a; c.translate(X, Y); c.rotate(Math.sin(t * 0.7 + ph) * 0.7); c.scale(1, 0.35 + 0.65 * Math.abs(Math.sin(t * 0.9 + ph))); c.drawImage(pp.cv, -sz / 2, -sh / 2, sz, sh); c.restore(); } }
  function skyLight(Q, V, L, lf, t) { const T = V.T, H = V.H, yt = dy => V.sy(V.top + dy);
    if (L.moon) each(V, L.per, L.moon.fx, L.per * 0.6, xw => { const X = V.sx(xw), Y = yt(L.moon.t), R = L.moon.r * T; if (Y < -R * 4 || Y > H + R * 4) return;
      if (L.moon.black) { Q.quad(620, X, Y, R * 3.2, 0, 0, R * 3.2, L.moon.col, 0.9, 1 / 3.2, 1.0, lf ? 0.4 : 1.0); Q.glow(X, Y, R * 4.2, '#6A3A8A', 0.12, 0.5); }
      else { Q.glow(X, Y, R * 2.6, L.moon.col, 0.22, 0.6); Q.ring(X, Y, R * 1.9, '#FFFFFF', 0.06, R * 0.3, 0.6); } });
    if (L.sun && !lf) each(V, L.per, L.sun.fx, L.per * 0.6, xw => { const X = V.sx(xw), Y = yt(L.sun.t); if (Y < -T * 12 || Y > H + T * 12) return; for (let i = 0; i < 3; i++) Q.quad(624, X + (i - 1) * T * 7, Y + T * 7, T * 6, 0, 0, T * 9, L.sun.col, 0.35, i * 3.1 + 0.7, 0.8, 0); }); }
  function airLight(Q, V, L, lf, t) { const T = V.T, W = V.W, H = V.H, yb = dy => V.sy(V.bot + dy);
    // the ink's drift in the depth and in bands through the gulf (fixed every 15 rows)
    if (L.depth !== 'clouds') { each(V, L.per, 0.5, L.per * 0.7, xw => { const Ys = yb(5.5); if (Ys > -T * 6 && Ys < H + T * 6) { Q.quad(621, V.sx(xw), Ys, L.per * 0.45 * T, 0, 0, T * 4.5, L.drift, 0.55, 0.13, L.depth === 'ink' ? 0.7 : 0.3, 0.2); if (!lf) Q.quad(621, V.sx(xw + L.per * 0.5), Ys + T * 2, L.per * 0.3 * T, 0, 0, T * 3, L.drift, 0.4, 0.53, 0.4, 0.3); } });
      const r0 = Math.floor((V.top + (0 - V.sy(V.top)) / T) / 15), r1 = Math.ceil((V.top + (H - V.sy(V.top)) / T) / 15);
      for (let r = Math.max(1, r0); r <= r1; r++) { const yw = V.top + r * 15 - 4, Y = V.sy(yw); if (Y < -T * 6 || Y > H + T * 6) continue; each(V, L.per, (0.2 + 0.37 * r) % 1, L.per * 0.5, xw => Q.quad(621, V.sx(xw), Y, L.per * 0.28 * T, 0, 0, T * 3.2, L.drift, 0.42 * Math.max(0.4, 1 - r * 0.15), (r * 0.31) % 1, 0.5, 0.25)); } }
    const C = 5, camX = (W / 2 - V.sx(0)) / T, camY = (H / 2 - V.sy(0)) / T, gx0 = Math.floor((camX - W / 2 / T) / C) - 1, gx1 = Math.ceil((camX + W / 2 / T) / C) + 1, gy0 = Math.floor((camY - H / 2 / T) / C) - 1, gy1 = Math.ceil((camY + H / 2 / T) / C) + 1;
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) { if (hh(gx, gy, 91) > (lf ? 0.3 : 0.6)) continue; const ph = hh(gx, gy, 92), u = md(t * 0.05 * (0.6 + ph) + ph, 1), xw = (gx + hh(gx, gy, 93)) * C + (u - 0.5) * C * 0.6, yw = (gy + hh(gx, gy, 94)) * C - u * C * 1.4;
      const X = V.sx(xw), Y = V.sy(yw); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue; const a = Math.sin(u * Math.PI) * 0.5; Q.glow(X, Y, T * 0.1, L.motes, a * 0.5); Q.glow(X, Y, T * 0.03, '#FFFFFF', a * 0.8); } }

  /* ======================= the backdrop past the land (GAP_EXT) ======================= */
  if (HAS_W) window.GAP_EXT = window.GAP_EXT || {};
  const GAPX = HAS_W ? window.GAP_EXT : {};
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
    SRC.length = k; if (!k) return -1; let a = 0; for (let i = 0; i < k; i += 4) a += (SRC[i + 2] - SRC[i]) * (SRC[i + 3] - SRC[i + 1]); STATS.seenN = k / 4; STATS.seenA = +(a / (W * H)).toFixed(3);
    return a > W * H * 0.85 ? 0 : k / 4; }
  const GRC = [];
  function coarse(R, n) { GRC.length = 0; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, a = 0; for (let i = 0; i < n * 4; i += 4) { x0 = Math.min(x0, R[i]); y0 = Math.min(y0, R[i + 1]); x1 = Math.max(x1, R[i + 2]); y1 = Math.max(y1, R[i + 3]); a += (R[i + 2] - R[i]) * (R[i + 3] - R[i + 1]); }
    if (n <= 4 && a < (x1 - x0) * (y1 - y0) * 0.6) { for (let i = 0; i < n * 4; i++) GRC.push(R[i]); return n; } GRC.push(x0, y0, x1, y1); return 1; }
  for (const [gap, land] of Object.entries(LAND_OF)) { const L = LANDS[land];
    GAPX[gap] = { base: L.base,
      paint(c, S, R) { c.fillStyle = L.base; c.fillRect(0, 0, S, S); for (let i = 0; i < 20; i++) { c.fillStyle = land === 'archive' ? `rgba(255,236,170,${0.15 + R() * 0.3})` : land === 'binding' ? `rgba(230,238,255,${0.1 + R() * 0.3})` : `rgba(242,220,154,${0.1 + R() * 0.3})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.1 ? 1.2 : 0.6, 0, TAU); c.fill(); } },
      back(c, o) { let V = null; const Lv = LIVE;
        if (Lv && Lv.X && Lv.land === land) { try { V = view(Lv.X, land); V.W = o.W; V.H = o.H; V.k = o.k || 1; V.t = o.t; } catch (e) { V = null; } }
        if (!V) { const T = Math.max(24, Math.min(o.W, o.H) / 10), cx = o.wx / T, cy = o.wy / T; V = { W: o.W, H: o.H, T, sx: x => (x - cx) * T + o.W / 2, sy: y => (y - cy) * T + o.H / 2, t: o.t, land, top: cy - 6, bot: cy + 6, k: o.k || 1 }; }
        const rn = Lv && Lv.X ? seenRects(Lv.X, o.W, o.H) : 0, gn = rn > 0 ? coarse(SRC, rn) : 0;
        if (rn < 0) { c.fillStyle = L.base; c.fillRect(0, 0, o.W, o.H); STATS.hidden = (STATS.hidden || 0) + 1; return; }
        try { vista(c, V, { gpu: !!(Lv && Lv.X), rn, rects: SRC, gn, grects: GRC }); } catch (e) { c.fillStyle = L.base; c.fillRect(0, 0, o.W, o.H); } } }; }
  const OLDB = {};
  function install() { if (typeof BIOMES === 'undefined') return; for (const [gap, land] of Object.entries(LAND_OF)) { const B = BIOMES[land]; if (!B || B.__lsky) continue; B.__lsky = 1; const old = B.gap; OLDB[land] = old;
    try { Object.defineProperty(B, 'gap', { configurable: true, enumerable: true, get: () => (off() || !(HAS_W && window.BELPROPS && window.LIB_PROPS && window.YUG_PROPS) ? old : gap), set: () => {} }); } catch (e) { B.gap = gap; } } }
  install();

  /* ======================= the stage: its land's top and bottom edges ======================= */
  function stageOf(X) { const M = X.M, F = X.F || {}, land = LANDS[F.biome] ? F.biome : 'catalogue', TG = typeof T_GAP !== 'undefined' ? T_GAP : 2, TS = typeof T_SOLID !== 'undefined' ? T_SOLID : 0;
    let y0 = 1e9, y1 = -1e9; if (M && M.G) { const G = M.G, MW = M.MW, MH = M.MH; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const g = G[y * MW + x]; if (g !== TG && g !== TS) { if (y < y0) y0 = y; if (y > y1) y1 = y; } } }
    if (!(y1 >= y0)) { y0 = X.me.y - 8; y1 = X.me.y + 8; } return { X, land, top: y0, bot: y1 + 1 }; }
  function hookRift() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.library; if (!Rf || Rf.__lsky) return; Rf.__lsky = 1;
    const oe = Rf.everyStage; Rf.everyStage = function (X) { let a = {}; try { a = oe ? oe.apply(this, arguments) || {} : {}; } catch (e) { a = {}; } try { LIVE = X.F && X.F.fiend ? null : stageOf(X); } catch (e) { LIVE = null; } return a; };
    const op = Rf.preload; Rf.preload = function (P) { let a = []; try { a = op ? op.apply(this, arguments) || [] : []; } catch (e) {} let b = []; try { hookArena(); b = warm(P); } catch (e) {} return a.concat(b); }; } catch (e) {} }
  hookRift();
  function release() { const n = CACHE.size; CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); CACHE.clear(); STATS.released += n; }
  function hookRelease() { try { if (typeof DunWorld === 'undefined' || !DunWorld.dropProps || DunWorld.dropProps.__lsky) return; const od = DunWorld.dropProps; const f = function () { try { return od.apply(this, arguments); } finally { release(); LIVE = null; } }; for (const k in od) f[k] = od[k]; f.__lsky = 1; DunWorld.dropProps = f; } catch (e) {} }
  hookRelease();
  function warm(P) { if (off() || !P || !(P.T > 0) || !P.F) return []; const land = P.F.fiend && MINE[P.F.fiend.id] ? MINE[P.F.fiend.id] : LANDS[P.F.biome] ? P.F.biome : null; if (!land) return []; const L = LANDS[land], k = Math.min(3, P.k || 1), T = P.T, jobs = [], job = f => jobs.push(() => { try { f(); } catch (e) {} });
    job(() => rangeStrip(land, 'range2', sP(T * k))); job(() => rangeStrip(land, 'range', sP(T * k))); job(() => seaStrip(land, sP(T * k))); job(() => voidTile(land, sP(T * k))); if (L.moon) job(() => moonPic(land, pP(L.moon.r * T * k * 0.5)));
    if (P.F.fiend) return jobs;
    job(() => pagePic(land, pP(T * k)));
    for (const it of L.isles) { job(() => isle(land, it.v, pP(T * k * it.s))); if (it.prop && HAS_W && window.LIB_PROPS) job(() => window.LIB_PROPS.sprite(it.prop, it.pv || 0, Math.round(T * k * it.s * 0.62), L.L)); }
    return jobs; }

  /* ======================= the arenas: the fight's cached sky is this view, still; its floor carries the land's grain ======================= */
  const MINE = { syllax: 'catalogue', vellum: 'catalogue', nhalex: 'catalogue' };   // (the three fights are set in the ink: the black moon over each)
  function wrapDef(id) { try { const D = typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS[id]; if (!D || D.__lsky || typeof D.sky !== 'function') return; D.__lsky = 1; const os = D.sky;
      D.sky = function (c, W, H, t, cam, T, FX) { if (!(FX && FX.m && FX.m.dead) && !off() && HAS_W && window.BELPROPS && window.LIB_PROPS && cam && T > 0) { try { c.save(); const land = MINE[id], V = { W, H, T, sx: x => (x - cam.x) * T + W / 2, sy: y => (y - cam.y) * T + H / 2, t: 0, land, top: cam.y - 16, bot: cam.y + 14, k: kOf(c) }; vista(c, V, { gpu: false, still: true }); c.restore(); STATS.arena++; return; } catch (e) { try { c.restore(); } catch (e2) {} } }
        return os.apply(this, arguments); }; } catch (e) {} }
  /* the arenas' floors: the fight's own ground (its rings, compass, boards, inlay and shape) painted as before, then the land's floor
     grain (20zb3's floor texture) laid into it with an overlay and a soft light, so it carries the land's material and light
     without changing what it shows */
  const LN = { syllax: 'cat', nhalex: 'holy' };   // (Vellum's floorboards keep their own grain)
  function wrapGround(id) { try { const D = typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS[id]; if (!D || D.__lskyg || typeof D.paintGround !== 'function') return; D.__lskyg = 1; const og = D.paintGround;
      D.paintGround = function (c, A2) { const r = og.apply(this, arguments); if (!LN[id] || off() || !(HAS_W && window.LIB_PROPS && window.BELPROPS)) return r;
        try { const m = c.getTransform(), P = Math.max(8, Math.min(72, Math.round(Math.hypot(m.a, m.b)))), t = window.LIB_PROPS.tex('grain:' + LN[id], P); if (!t) return r; const RX = A2.R + 1.2, RY = A2.R + 1.2;
          const pat = c.createPattern(t.cv, 'repeat'); if (!pat) return r; try { pat.setTransform(new DOMMatrix([1 / t.P, 0, 0, 1 / t.P, 0, 0])); } catch (e) { return r; }
          c.save(); c.beginPath(); c.ellipse(0, 0, RX, RY, 0, 0, TAU); c.clip(); c.fillStyle = pat; c.globalCompositeOperation = 'soft-light'; c.globalAlpha = id === 'nhalex' ? 0.45 : 0.6; c.fillRect(-RX - 1, -RY - 1, RX * 2 + 2, RY * 2 + 2);
          const g = c.createRadialGradient(0, 0, Math.min(RX, RY) * 0.45, 0, 0, Math.max(RX, RY) + 0.2); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, id === 'nhalex' ? 'rgba(120,110,90,.18)' : id === 'vellum' ? 'rgba(10,14,28,.32)' : 'rgba(14,8,22,.34)'); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = g; c.fillRect(-RX - 1, -RY - 1, RX * 2 + 2, RY * 2 + 2); c.restore(); STATS.arenaFloor++; } catch (e) {}
        return r; }; } catch (e) {} }
  function hookArena() { for (const id in MINE) { wrapDef(id); wrapGround(id); } if (HAS_W && window.LIB_ARENA) window.LIB_ARENA.wrap(); }
  if (typeof setTimeout === 'function') setTimeout(() => hookArena(), 0);

  const API = { vista, view, release, warm, LANDS, stageOf, install, OLDB, rangeStrip, seaStrip, isle, seenRects, arena: { hook: hookArena, MINE },
    get LIVE() { return LIVE; }, set LIVE(v) { LIVE = v; },
    get stats() { return Object.assign({ cached: CACHE.size, px: [...CACHE.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) }, STATS); } };
  if (HAS_W) window.LIB_SKY = API;
  return API;
})();
