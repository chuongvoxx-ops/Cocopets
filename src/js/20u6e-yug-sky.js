/* ---------- v472 YE: The Yuggoth Engine's far views (Rift 06: its three lands and its three boss arenas) ----------
   What is seen past the edge of the playable land, at Rift 04 / 05's standard. Each land is one landscape fixed in the world (a
   thing's place on the screen is its place in the world minus the camera: nothing slides with the camera, nothing pops when the
   stage changes, and the layout repeats along x every `per` tiles so a stage of any width is covered). Over the land's top edge is
   its skyline; under its bottom edge the depth; beside it the gulf between:
     wreckfield (the Torn Hull): the violet void the engine fell out of: a storm of current turning high over the crash site (its
       eye), stars; the wreck on the horizon (the engine's broken hull: torn plates, ribs and spars, its seams and ports lit), a
       farther ridge of its body; far below, the void's billowing nebula with forks of lightning in it; torn chunks of hull drifting
       in the gulf, cables trailing, a spike or pylon still standing on them.
     coolant (the Coolant Vaults): the vault's far wall (pipe stacks, gantries, rows of teal lamps, tanks of coolant), a farther wall
       in the haze; far below, a lake of glowing coolant, caustics drifting on it, steam rising off it; gantry platforms on long
       legs standing out of it, a tank on one.
     engineheart (the Engine Heart): the inside of the engine: a far wall of flesh grown over pistons and pipe, amber nodes along
       it, the heart's glow beating behind it; far below, a pit of pipes and nerve cables lit pink and amber in pulses; chunks of
       flesh-grown hull hanging in the gulf, a piston on one.
   Pictures (the skylines and the depths: 2D painted once per sharpness; the drifting chunks: BELPROPS.kit through YUG_PROPS in
   each land's light) are kept until the stage closes (DunWorld.dropProps, chained). The light is the GPU painter's (FGFX: YE-FX
   570 the void's current, 571 lightning, 572 the coolant's glow, 573 steam, with glows), lowFx respected, laid only where the far
   view can be seen (the gaps' rectangles, as v463 SS / v470 AE). Without the GPU the pictures stay and the light is left out.
   The arenas (Kh'aal's Breach, Ix-Vorra's Capacitor Hall, Nyar'zhul's Core Chamber): the fight's cached sky is this view, still
   (FIEND_DEFS[id].sky wrapped at run time: the boss files untouched), and their floors carry the land's floor texture laid into
   them (FIEND_DEFS[id].paintGround wrapped: the fight's own ground, its marks and shape, painted first as before).
   Hooks: BIOMES.wreckfield / coolant / engineheart .gap -> 'yugwreck' / 'yugcool' / 'yugheart' (getters: the old 'plasma' /
   'coolant' while window.__YSKY is 0 or the painter is off) with their GAP_EXT backdrops; RIFT_BY_ID.yuggoth.everyStage (chained:
   the stage's horizon) and .preload (chained: the pictures painted on the loading screen).
   window.__YSKY = 0 turns all of it off; __YSKY_GL = 0 the GPU's part only. API (global YUG_SKY). */
var YUG_SKY = (() => {
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined';
  const off = () => HAS_W && (window.__YSKY === 0 || window.__YUGP === 0);
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const md = (a, n) => ((a % n) + n) % n;
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + (s | 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const hex = h => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const kOf = c => { const m = c && c.getTransform ? c.getTransform() : null; return m ? Math.max(0.5, Math.min(3, Math.hypot(m.a, m.b))) : 1; };
  const STATS = { painted: 0, paintMs: 0, frames: 0, quads: 0, released: 0, arena: 0, bolts: 0 };
  function pvn(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), q = p | 0 || 1;
    const X0 = ((xi % q) + q) % q, X1 = (X0 + 1) % q, Y0 = ((yi % q) + q) % q, Y1 = (Y0 + 1) % q, a = hh(X0, Y0, s), b = hh(X1, Y0, s), c = hh(X0, Y1, s), d = hh(X1, Y1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const pn1 = (x, p, s) => pvn(x, 0.5, p, s), pf1 = (x, p, s) => pn1(x, p, s) * 0.55 + pn1(x * 2, p * 2, s + 3) * 0.28 + pn1(x * 4, p * 4, s + 5) * 0.12 + pn1(x * 8, p * 8, s + 7) * 0.05;
  const VIOLET = '#C452FF', VIOLET_HI = '#E8B8FF', TEAL = '#3FE0C8', TEAL_HI = '#B8FFF2', AMBER = '#FFB23F', PINK = '#FF6FB0';

  /* ======================= the lands ======================= (ys: tiles relative to the land's top edge (t) or bottom edge (b)) */
  const LANDS = {
    wreckfield: { gap: 'yugwreck', base: '#0A0414', per: 36, L: 'wreck', zen: '#04010A', sky: '#10061F', hor: '#2A0E46', deep: '#0A0418', sea: '#2A0E48', seaHi: '#B070F0', seaSh: '#0C0418',
      range: { t: -1.0, h: 5.2, sh: '#120C1E', lit: '#3A3450', rim: '#C890FF', haze: '#2A0E46', seed: 11, style: 'wreck', lights: [VIOLET_HI, TEAL_HI, '#FFB28A'] }, range2: { t: -3.0, h: 4.4, sh: '#140A24', lit: '#2A2040', rim: '#8A50D0', haze: '#1E0A36', seed: 17, style: 'hulk', lights: [VIOLET] },
      eye: { col: VIOLET, t: -8.5 }, core: { fx: 0.62, t: -2.2, col: VIOLET }, stars: 1, depth: 'void', bolts: 1,
      isles: [{ fx: 0.15, b: 5, s: 1.0, v: 0, prop: 'metalspike' }, { fx: 0.55, b: 9, s: 0.8, v: 1, prop: null }, { fx: 0.85, b: 4, s: 0.7, v: 2, prop: 'pylon' }, { fx: 0.38, t: -3.4, s: 0.55, v: 1, prop: null }] },
    coolant: { gap: 'yugcool', base: '#061A1C', per: 36, L: 'cool', zen: '#020809', sky: '#06161A', hor: '#0E3438', deep: '#041214', sea: '#0E5A56', seaHi: '#9AF6E6', seaSh: '#062426',
      range: { t: -1.0, h: 6.0, sh: '#0C1C22', lit: '#3A5666', rim: '#8AF0E0', haze: '#0E3438', seed: 23, style: 'vault', lights: [TEAL_HI, TEAL, '#FFE2A0'] }, range2: { t: -3.6, h: 5.0, sh: '#0A161A', lit: '#22383F', rim: '#4AA8A0', haze: '#0A2A2E', seed: 29, style: 'vault2', lights: [TEAL] },
      lamps: { col: TEAL, t: -6.4 }, stars: 0, depth: 'coolant', steam: 1,
      isles: [{ fx: 0.2, b: 4, s: 1.0, v: 0, prop: 'coolanttank' }, { fx: 0.62, b: 7, s: 0.8, v: 1, prop: 'pipestack' }, { fx: 0.9, b: 3.5, s: 0.65, v: 2, prop: null }] },
    engineheart: { gap: 'yugheart', base: '#0A0410', per: 36, L: 'heart', zen: '#06020A', sky: '#14061A', hor: '#3A1030', deep: '#0C0410', sea: '#3A1030', seaHi: '#FF9AC8', seaSh: '#0E0410',
      range: { t: -1.0, h: 6.0, sh: '#1E0A1C', lit: '#5A2850', rim: '#FFB0D8', haze: '#3A1030', seed: 31, style: 'flesh', lights: [AMBER, PINK, '#FFE2A0'] }, range2: { t: -3.4, h: 5.0, sh: '#160816', lit: '#3A1838', rim: '#C05090', haze: '#2A0C26', seed: 37, style: 'flesh2', lights: [PINK] },
      heart: { fx: 0.5, t: -5.5, col: PINK }, stars: 0, depth: 'pit',
      isles: [{ fx: 0.25, b: 5, s: 0.95, v: 0, prop: 'piston' }, { fx: 0.7, b: 8, s: 0.8, v: 1, prop: null }, { fx: 0.45, t: -3.2, s: 0.55, v: 2, prop: null }] } };
  const LAND_OF = {}; for (const k in LANDS) LAND_OF[LANDS[k].gap] = k;

  /* ======================= the pictures ======================= */
  const CACHE = new Map();
  const keep = (key, f) => { let s = CACHE.get(key); if (s) return s; const t0 = now(); s = f(); if (s) { CACHE.set(key, s); STATS.painted++; STATS.paintMs += now() - t0; } return s; };
  // the skyline behind the land's top edge, per tiles wide (it repeats), h tall, in its style:
  //   wreck: the broken hull: jagged plates and torn towers, a violet rim along every top edge, rows of lit ports, plate seams
  //   hulk:  the engine's body beyond: great rounded hull sections, faint seams
  //   vault / vault2: the vault's far wall: pipe stacks (round, lit down one side), gantries across them, rows of lamps, tanks
  //   flesh / flesh2: flesh grown over the engine: soft columns and folds, chrome pistons in them, glowing nodes
  function rangeStrip(land, which, P) { const L = LANDS[land], R0 = L[which], per = L.per; return keep(`range|${land}|${which}|${P}`, () => {
    const W = Math.round(per * P), H = Math.round(R0.h * P), cv = mkc(W, H), c = cv.getContext('2d'), im = c.createImageData(W, H), d = im.data, lit = hex(R0.lit), sh = hex(R0.sh), rim = hex(R0.rim), hz = hex(R0.haze), sty = R0.style, LC = R0.lights.map(hex);
    const ridge = new Float32Array(W + 1), wall = /vault/.test(sty) || /flesh/.test(sty);
    for (let x = 0; x <= W; x++) { const u = x / P; let r;
      if (sty === 'wreck') { const blk = Math.floor(u / 1.4), bh = hh(md(blk, Math.round(per / 1.4)), 1, R0.seed), tower = bh > 0.72 ? 0.25 + 0.25 * hh(blk, 2, R0.seed) : 0, tear = ss(0.0, 0.25, md(u, 1.4) / 1.4) * (hh(blk, 3, R0.seed) > 0.5 ? 0.12 : -0.08);
        r = 0.2 + 0.45 * Math.pow(pf1(u / per * 5, 5, R0.seed), 1.2) + tower + tear + 0.05 * Math.max(0, pf1(u / per * 41, 41, R0.seed + 9) - 0.5); }
      else if (sty === 'hulk') r = 0.35 + 0.4 * Math.sqrt(Math.max(0, Math.sin(md(u, 12) / 12 * Math.PI))) * (0.7 + 0.3 * pn1(Math.floor(u / 12), 3, R0.seed)) + 0.08 * pf1(u / per * 13, 13, R0.seed + 3);
      else r = 0.88 + 0.1 * pf1(u / per * 7, 7, R0.seed);
      ridge[x] = H * clamp(r, 0.05, 0.98); }
    for (let x = 0; x < W; x++) { const top = H - ridge[x], u = x / P;
      for (let y = Math.max(0, Math.floor(top)); y < H; y++) { const dz = (y - top) / P, k = (y - top) / Math.max(1, H - top), zz = (H - y) / P; let r, g, b;
        if (sty === 'wreck' || sty === 'hulk') { const sl = (ridge[Math.min(W, x + 2)] - ridge[Math.max(0, x - 2)]) / 4, face = ss(-0.3, 0.3, sl * 1.5 + 0.4 * (pn1(u * 3, Math.round(per * 3), R0.seed + 11) - 0.5));
          const seam = Math.abs(md(zz, 0.42) - 0.21) > 0.19 ? 0.55 : 1, vseam = Math.abs(md(u + (Math.floor(zz / 0.42) % 2) * 0.6, 1.2) - 0.6) > 0.57 ? 0.7 : 1;
          r = lerp(sh[0], lit[0], face * 0.6) * seam * vseam; g = lerp(sh[1], lit[1], face * 0.6) * seam * vseam; b = lerp(sh[2], lit[2], face * 0.6) * seam * vseam;
          const cr = Math.exp(-dz * dz / 0.006) * (0.5 + 0.5 * face); r = lerp(r, rim[0], cr * 0.85); g = lerp(g, rim[1], cr * 0.85); b = lerp(b, rim[2], cr * 0.85);
          if (sty === 'wreck' && dz > 0.25 && k < 0.8) { const gx = Math.floor(u / 0.3), gy = Math.floor(zz / 0.42), on = hh(gx, gy, R0.seed + 21) < 0.06, fx = md(u, 0.3) / 0.3, fy = md(zz, 0.42) / 0.42; if (on && fx > 0.25 && fx < 0.75 && fy > 0.35 && fy < 0.6) { const L2 = LC[Math.floor(hh(gx, gy, R0.seed + 22) * LC.length)]; r = L2[0]; g = L2[1]; b = L2[2]; } } }
        else if (/vault/.test(sty)) { const pw = sty === 'vault' ? 0.9 : 1.3, pu = md(u, pw) / pw, pipeK = Math.abs(pu - 0.5) * 2, isPipe = pipeK < 0.62, ang = isPipe ? Math.sqrt(1 - Math.pow(pipeK / 0.62, 2)) : 0, gant = Math.abs(md(zz, 1.6) - 0.8) > 0.74, tank = hh(Math.floor(u / (pw * 3)), 4, R0.seed) > 0.7 && md(zz, 1.6) > 0.25 && md(zz, 1.6) < 1.3 && Math.abs(md(u, pw * 3) - pw * 1.5) < pw * 0.9;
          let s0 = isPipe ? 0.35 + 0.65 * ang * (pu < 0.5 ? 1 : 0.55) : 0.15; r = lerp(sh[0], lit[0], s0); g = lerp(sh[1], lit[1], s0); b = lerp(sh[2], lit[2], s0);
          if (isPipe && Math.abs(md(zz, 0.55) - 0.27) > 0.25) { r *= 0.6; g *= 0.6; b *= 0.6; }
          if (tank) { const tu = (md(u, pw * 3) - pw * 1.5) / (pw * 0.9), tk = 0.45 + 0.55 * Math.sqrt(Math.max(0, 1 - tu * tu)); r = lerp(r, 40, 0.7) * 0 + 30 * tk; g = 150 * tk + 40; b = 140 * tk + 40; }
          if (gant) { r = lerp(sh[0], lit[0], 0.7); g = lerp(sh[1], lit[1], 0.7); b = lerp(sh[2], lit[2], 0.7); if (Math.abs(md(zz, 1.6) - 0.8) > 0.785) { r = rim[0] * 0.6; g = rim[1] * 0.6; b = rim[2] * 0.6; } }
          if (!gant && Math.abs(md(zz, 1.6) - 0.8) > 0.66 && Math.abs(md(u, 0.6) - 0.3) < 0.06) { const L2 = LC[Math.floor(hh(Math.floor(u / 0.6), Math.floor(zz / 1.6), R0.seed + 5) * LC.length)]; r = L2[0]; g = L2[1]; b = L2[2]; } }
        else { const fw = sty === 'flesh' ? 1.1 : 1.6, fu = md(u + 0.2 * Math.sin(zz * 1.3 + Math.floor(u / fw)), fw) / fw, col2 = Math.sin(fu * Math.PI), piston = sty === 'flesh' && hh(Math.floor(u / fw), 6, R0.seed) > 0.62 && Math.abs(fu - 0.5) < 0.12 && md(zz, 2.2) > 0.4;
          let s0 = 0.25 + 0.75 * Math.pow(col2, 0.8) * (fu < 0.5 ? 1 : 0.7); r = lerp(sh[0], lit[0], s0); g = lerp(sh[1], lit[1], s0); b = lerp(sh[2], lit[2], s0);
          const fold = Math.pow(Math.abs(Math.sin(zz * 3.1 + fu * 2 + pn1(u * 2, Math.round(per * 2), R0.seed) * 3)), 6); r *= 1 - 0.35 * fold; g *= 1 - 0.35 * fold; b *= 1 - 0.35 * fold;
          if (piston) { const pk = 1 - Math.abs(fu - 0.5) / 0.12; r = 90 + 120 * pk; g = 90 + 110 * pk; b = 110 + 120 * pk; }
          const node = hh(Math.floor(u / 0.5), Math.floor(zz / 0.7), R0.seed + 8) < 0.07 && Math.hypot(md(u, 0.5) - 0.25, (md(zz, 0.7) - 0.35) * 0.8) < 0.08; if (node) { const L2 = LC[Math.floor(hh(Math.floor(u / 0.5), Math.floor(zz / 0.7), R0.seed + 9) * LC.length)]; r = L2[0]; g = L2[1]; b = L2[2]; } }
        const hzk = ss(0.4, 1, k) * (wall ? 0.65 : 0.55); r = lerp(r, hz[0], hzk); g = lerp(g, hz[1], hzk); b = lerp(b, hz[2], hzk);
        const i = (y * W + x) * 4, aa = y < top + 1 ? clamp(y + 1 - top, 0, 1) : 1; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255 * aa; } }
    c.putImageData(im, 0, 0);
    // the wreck's ribs and spars arching out of the skyline (the near one)
    if (sty === 'wreck') { const R = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(R0.seed * 7 + 3); c.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const x = (0.08 + i * 0.16 + R() * 0.05) * W, top = H - ridge[Math.round(x)], hgt = P * (1.2 + R() * 1.4), lean = (R() - 0.5) * P * 2.2, wd = P * (0.18 + R() * 0.1);
        c.strokeStyle = R0.sh; c.lineWidth = wd; c.beginPath(); c.moveTo(x - P * 0.4, top + P * 0.3); c.bezierCurveTo(x - P * 0.5, top - hgt * 0.7, x + lean, top - hgt * 1.1, x + lean + P * 1.1, top - hgt * 0.8); c.stroke();
        c.strokeStyle = R0.rim; c.globalAlpha = 0.55; c.lineWidth = Math.max(1, P * 0.035); c.beginPath(); c.moveTo(x - P * 0.4 - wd * 0.35, top + P * 0.2); c.bezierCurveTo(x - P * 0.5 - wd * 0.35, top - hgt * 0.7 - wd * 0.3, x + lean, top - hgt * 1.1 - wd * 0.4, x + lean + P * 1.1, top - hgt * 0.8 - wd * 0.4); c.stroke(); c.globalAlpha = 1; } }
    return { cv, P, W, H }; }); }
  // the depth far below: the void's nebula (billows lit violet on their rims), the coolant lake (bright bands, ripples), the pit
  // (tangled pipes and cables, lit from beneath)
  function seaStrip(land, P) { const L = LANDS[land], per = L.per; return keep(`sea|${land}|${P}`, () => {
    const W = Math.round(per * P), H = Math.round(6 * P), cv = mkc(W, H), c = cv.getContext('2d'), im = c.createImageData(W, H), d = im.data, hi = hex(L.seaHi), mid = hex(L.sea), sh = hex(L.seaSh);
    for (let x = 0; x < W; x++) { const u = x / P, top = P * (L.depth === 'coolant' ? 0.35 + 0.15 * pf1(u / per * 9, 9, 41) : 0.6 + 1.1 * pf1(u / per * 9, 9, 41) + 0.35 * pn1(u / per * 31, 31, 43));
      for (let y = Math.max(0, Math.floor(top)); y < H; y++) { const dz = (y - top) / P; let k;
        if (L.depth === 'coolant') { const band = Math.pow(Math.abs(Math.sin(dz * 7 + pvn(u * 1.3, dz * 2, Math.round(per * 1.3), 45) * 3)), 6), rip = pvn(u * 3, dz * 6, Math.round(per * 3), 47); k = clamp(0.55 + 0.35 * band + 0.15 * (rip - 0.5) - dz * 0.06 + ss(0.3, 0, dz) * 0.3, 0, 1); }
        else if (L.depth === 'pit') { const pipe = Math.pow(Math.abs(Math.sin(dz * 5 + pvn(u * 0.8, dz, Math.round(per * 0.8), 49) * 4)), 0.5), gap = ss(0.15, 0.0, Math.abs(Math.sin(dz * 5 + pvn(u * 0.8, dz, Math.round(per * 0.8), 49) * 4))); k = clamp(0.2 + 0.35 * pipe * (1 - dz * 0.12) + 0.5 * gap * (0.5 + 0.5 * pvn(u * 2, dz, Math.round(per * 2), 51)), 0, 1); }
        else { const bil = pvn(u * 1.3, dz * 1.6, Math.round(per * 1.3), 45), rim = ss(0.5, 0.0, dz) * (0.6 + 0.4 * bil), fold = ss(0.45, 0.75, pvn(u * 2.6, dz * 2.2, Math.round(per * 2.6), 47)); k = clamp(rim * 0.8 + (1 - fold) * 0.25 - dz * 0.06, 0, 1); }
        const i = (y * W + x) * 4; d[i] = k > 0.5 ? lerp(mid[0], hi[0], (k - 0.5) * 2) : lerp(sh[0], mid[0], k * 2); d[i + 1] = k > 0.5 ? lerp(mid[1], hi[1], (k - 0.5) * 2) : lerp(sh[1], mid[1], k * 2); d[i + 2] = k > 0.5 ? lerp(mid[2], hi[2], (k - 0.5) * 2) : lerp(sh[2], mid[2], k * 2); d[i + 3] = 255 * clamp(y + 1 - top, 0, 1) * (1 - ss(4.5, 6, dz + top / P)); } }
    c.putImageData(im, 0, 0); return { cv, P, W, H }; }); }
  // the gulf's floor seen from above, a tile of it (wrapping, fixed in the world): the coolant lake (deep teal, a web of bright
  // caustics, ripples, foam where it laps) or the heart's pit (pipes and nerve cables crossing in tangles, lit from beneath)
  function depthTile(land, P) { const L = LANDS[land], N = 6; return keep(`depth|${land}|${P}`, () => { const W = Math.round(N * P), cv = mkc(W, W), c = cv.getContext('2d'), im = c.createImageData(W, W), d = im.data, hi = hex(L.seaHi), mid = hex(L.sea), sh = hex(L.seaSh);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const u = x / P, v = y / P; let k;
      if (L.depth === 'coolant') { const w1 = pvn(u * 1.2 + pvn(u * 0.5, v * 0.5, 3, 61) * 2, v * 1.2, N * 1.2, 63), cs = Math.abs(pvn(u * 2.2, v * 2.2 + w1 * 1.5, Math.round(N * 2.2), 65) - 0.5), web = ss(0.06, 0.0, cs), rip = Math.pow(Math.abs(Math.sin((u * 0.8 + v * 2.3 + w1 * 3) * Math.PI)), 12); k = clamp(0.3 + 0.25 * w1 + 0.55 * web + 0.15 * rip, 0, 1); }
      else { const pp = pvn(u * 0.7, v * 0.7, Math.round(N * 0.7), 71), pipe = Math.abs(Math.sin((v * 2.2 + pp * 2.5) * Math.PI)), pipe2 = Math.abs(Math.sin((u * 1.6 - v * 0.4 + pvn(u, v, N, 73) * 2) * Math.PI)), top2 = Math.max(Math.pow(pipe, 0.6) * (pvn(u * 3, v * 3, N * 3, 75) > 0.35 ? 1 : 0.5), Math.pow(pipe2, 0.7) * 0.8), gapL = ss(0.2, 0.0, Math.min(pipe, pipe2)); k = clamp(0.12 + 0.4 * top2 + 0.55 * gapL * pvn(u * 1.5, v * 1.5, Math.round(N * 1.5), 77), 0, 1); }
      const i = (y * W + x) * 4; d[i] = k > 0.5 ? lerp(mid[0], hi[0], (k - 0.5) * 2) : lerp(sh[0], mid[0], k * 2); d[i + 1] = k > 0.5 ? lerp(mid[1], hi[1], (k - 0.5) * 2) : lerp(sh[1], mid[1], k * 2); d[i + 2] = k > 0.5 ? lerp(mid[2], hi[2], (k - 0.5) * 2) : lerp(sh[2], mid[2], k * 2); d[i + 3] = 255; }
    c.putImageData(im, 0, 0); return { cv, S: W, P }; }); }
  function starTile(k) { return keep(`stars|${k}`, () => { const S = Math.round(256 * k), cv = mkc(S, S), c = cv.getContext('2d'), R = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(1777);
    for (let i = 0; i < 120; i++) { const x = R() * S, y = R() * S, br = R(), r = (br > 0.96 ? 1.3 : br > 0.8 ? 0.8 : 0.5) * k, vi = R() < 0.3; c.fillStyle = vi ? `rgba(220,170,255,${0.25 + br * 0.6})` : `rgba(${225 + Math.round(R() * 30)},${220 + Math.round(R() * 30)},255,${0.2 + br * 0.6})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      if (br > 0.97) { c.strokeStyle = 'rgba(230,200,255,.35)'; c.lineWidth = 0.6 * k; c.beginPath(); c.moveTo(x - 4 * k, y); c.lineTo(x + 4 * k, y); c.moveTo(x, y - 4 * k); c.lineTo(x, y + 4 * k); c.stroke(); } }
    return { cv, S }; }); }
  // a chunk in the gulf (the kit): wreck: a slab of torn hull, jagged plates and girders hanging under it, cables trailing; cool: a
  // gantry platform on long legs fading into the coolant; heart: a lump of flesh-grown hull, tendrils hanging from it
  function isle(land, v, P) { const A = HAS_W && window.YUG_PROPS, B = HAS_W && window.BELPROPS; if (!A || !B || !B.kit) return null; const L = LANDS[land].L;
    return keep(`isle|${land}|${v}|${P}`, () => { const K = B.kit, X = A.kitx, w = [1.7, 1.25, 1.0][v % 3], S = K.surface(-w - 0.5, -0.9, w + 0.5, L === 'cool' ? 5.2 : 3.6, P), sd = 300 + v * 17;
      try { X.lit(K, L, () => { const R = K.R1(sd);
          if (L === 'cool') { for (const sx of [-0.7, 0.7]) K.tube(S, [[sx * w, 0.1], [sx * w * 0.9, 5.0]], 0.08, 0.07, (t, s2) => { X.darkM(K, t * 8, s2, sd); K.M.ao *= 1 - 0.6 * t; }); S.unlock();
            for (let i = 1; i < 6; i++) { const y = i * 0.8; K.tube(S, [[-0.7 * w, y], [0.7 * w * 0.95, y + 0.6]], 0.03, 0.03, (t, s2) => X.darkM(K, t * 4, s2, sd)); } S.unlock();
            K.rbox(S, 0, 0.12, w, 0.4, 0, 0.22, 0.04, (f, u, vv) => { X.hullT(K, u * 2, vv * 2, sd, { tone: 1.1, paint: 0.5, pc: [0.06, 0.12, 0.14] }); if (f === 't' && Math.abs(((u * 4) % 1 + 1) % 1 - 0.5) > 0.45) K.M.ao *= 0.6; }); S.unlock();
            for (const sx of [-1, 1]) K.tube(S, [[sx * w * 0.95, -0.2], [sx * w * 0.95, -0.7]], 0.025, 0.025, (t, s2) => X.darkM(K, t, s2, sd)); K.tube(S, [[-w * 0.95, -0.68], [w * 0.95, -0.68]], 0.025, 0.025, (t, s2) => X.darkM(K, t, s2, sd)); S.unlock();
            const c = S.c; c.save(); c.globalCompositeOperation = 'destination-out'; const g = c.createLinearGradient(0, 2.5, 0, 5.2); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); c.fillStyle = g; c.fillRect(-w - 0.5, 2.5, w * 2 + 1, 2.8); c.restore(); }
          else { const heart = L === 'heart', cones = []; for (let i = 0; i < 7; i++) { const x = (i / 6 - 0.5) * w * 1.6 + (R() - 0.5) * 0.2, len = (1.0 - Math.abs(i / 6 - 0.5) * 1.4) * (1.4 + R() * 1.0) * (w / 1.7) + 0.3; cones.push([x, len]); }
            cones.sort((a, b) => a[1] - b[1]);
            for (const [x, len] of cones) X.prism(K, S, x, 0.05, 0.22 * w / 1.2, 0.12 * w / 1.2, len * 0.6, len * 0.4, Math.PI + (R() - 0.5) * 0.3, (f, q, wt) => { if (heart) X.fleshM(K, q * 2 + x, wt * 3, sd, { glow: 0.3 }); else { X.hullM(K, q + x * 3, wt * 3, sd + x * 9, { burn: 0.6, tone: f < 0 ? 1.1 : 0.8 }); if (Math.abs(Math.abs(q) - 0.5) < 0.05) K.M.rg = 0.12; } }, { flat: heart ? 0 : 0.5 });
            S.unlock();
            for (let i = 0; i < 3; i++) { const x = (R() - 0.5) * w * 1.4, pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push([x + Math.sin(u * 3 + i) * 0.15, 0.1 + u * (1.2 + R() * 0.8)]); } K.tube(S, pts, 0.035, 0.02, (t, s2) => heart ? X.fleshM(K, t * 4, s2, sd + i, { glow: 0.5 }) : X.rubberM(K, t * 4, s2, sd + i)); } S.unlock();
            X.lump(K, S, 0, -0.08, w, 0.3, { amp: 0.14, fr: 2.6, sd, bump: 0.35, flat: 0.2, mat: (dx, dy, ao, e, nz, wx, wy) => { if (heart) { if (dy < 0.2) X.fleshM(K, wx * 2, wy * 2, sd + 3, { glow: 0.25 }); else X.hullM(K, wx * 2, wy * 2, sd, { burn: 0.4 }); } else { X.hullM(K, wx * 1.5, wy * 1.5, sd, { burn: 0.5 * ss(0.2, 0.8, dy) + 0.2, paint: 0.4 }); if (e > 0.85) K.M.rg = 0.15; } } }); S.unlock(); }
          K.ink(S, X.INK[L], 0.35); }); }
      catch (e) { if (typeof console !== 'undefined') console.warn('YUG_SKY isle', e); S.cv.width = S.cv.height = 1; return null; }
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
  const gpuF = () => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__YSKY_GL === 0)) return null; const F = HAS_W && window.NIDHOGG_MOVES && window.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  function vista(c, V, o) { o = o || {}; const L = LANDS[V.land]; if (!L) return; STATS.frames++;
    if (o.rn > 0) { const R = o.rects; c.save(); try { c.beginPath(); for (let i = 0; i < o.rn * 4; i += 4) c.rect(R[i], R[i + 1], R[i + 2] - R[i], R[i + 3] - R[i + 1]); c.clip(); vistaIn(c, V, o, L); } finally { c.restore(); } return; }
    vistaIn(c, V, o, L); }
  function vistaIn(c, V, o, L) { const W = V.W, H = V.H, T = V.T, k = V.k || 1, t = V.t, yt = dy => V.sy(V.top + dy), yb = dy => V.sy(V.bot + dy), lf = lowFx();
    { const y0 = yt(-18), y1 = yt(0), y2 = yb(2), y3 = yb(9), g = c.createLinearGradient(0, y0, 0, y3), span = Math.max(1, y3 - y0), at = y => clamp((y - y0) / span, 0, 1);
      g.addColorStop(0, L.zen); g.addColorStop(at(y1 - T * 3), L.sky); g.addColorStop(at(y1), L.hor); g.addColorStop(clamp(at(y1) + 0.02, 0, 1), L.deep); g.addColorStop(at(y2), L.deep); g.addColorStop(1, L.sea); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    if (L.stars) { const sp = starTile(Math.min(2, k)), S2 = sp.S / Math.min(2, k); c.save(); c.globalAlpha = L.stars * 0.85; for (let x = md(V.sx(0), S2) - S2; x < W; x += S2) for (let y = md(V.sy(0), S2) - S2; y < H; y += S2) c.drawImage(sp.cv, x, y, S2, S2); c.restore(); }
    const F = o.gpu === false ? null : gpuF(), rngOn = ['range2', 'range'].some(w => { const R0 = L[w], Y = yt(R0.t) - R0.h * T; return Y < H && Y + R0.h * T > 0; });
    if (F && rngOn) { try { const Q = F.begin(c, null); if (o.gn > 0 && Q.clipTo) Q.clipTo(o.grects, o.gn); skyLight(Q, V, L, lf, t); if (Q.nl || Q.ns) { STATS.quads += (Q.nl + Q.ns) / 6; STATS.passes = (STATS.passes || 0) + 1; F.flush(c); } } catch (e) {} }
    else if (!F && o.still) skyStill(c, V, L);
    for (const which of ['range2', 'range']) { const R0 = L[which], Ptx = sP(T * k), s = rangeStrip(V.land, which, Ptx), wp = L.per * T, Hp = R0.h * T, Y = yt(R0.t) - Hp; if (Y > H || Y + Hp < 0) continue;
      for (let x = md(V.sx(which === 'range2' ? L.per * 0.37 : 0), wp) - wp; x < W; x += wp) if (x + wp > 0) blitPart(c, s.cv, x, Y, wp + 0.6, Hp + 0.6, W, H);
      const yf = Y + Hp, g = c.createLinearGradient(0, yf - T * 0.8, 0, yf + T * 0.6), hz = L.hor; g.addColorStop(0, hz + '00'); g.addColorStop(0.6, hz); g.addColorStop(1, L.deep); c.fillStyle = g; c.fillRect(0, yf - T * 0.8, W, T * 1.4); }
    if (L.depth === 'coolant' || L.depth === 'pit') { // the gulf's floor far below, under the far wall's foot down past the land: tiles fixed in the world, darker toward the far shore
      const Y0 = Math.max(0, yt(L.depth === 'coolant' ? -0.4 : -0.2)); if (Y0 < H) { const dt = depthTile(V.land, sP(T * k)), S2 = 6 * T, ox = md(V.sx(0) + (L.depth === 'coolant' ? t * T * 0.03 : 0), S2) - S2, oy = md(V.sy(0), S2) - S2;
        c.save(); c.beginPath(); c.rect(0, Y0, W, H - Y0); c.clip(); for (let x = ox; x < W; x += S2) for (let y = oy; y < H; y += S2) if (y + S2 > Y0) c.drawImage(dt.cv, x, y, S2 + 0.5, S2 + 0.5);
        const g = c.createLinearGradient(0, Y0, 0, Y0 + T * 5), dc = hex(L.deep); g.addColorStop(0, `rgba(${dc[0]},${dc[1]},${dc[2]},.92)`); g.addColorStop(0.5, `rgba(${dc[0]},${dc[1]},${dc[2]},.45)`); g.addColorStop(1, `rgba(${dc[0]},${dc[1]},${dc[2]},.18)`); c.fillStyle = g; c.fillRect(0, Y0, W, H - Y0); c.restore(); } }
    else { const s = seaStrip(V.land, sP(T * k)), wp = L.per * T, Hp = 6 * T, Y = yb(3.5); if (Y < H && Y + Hp > 0) { for (let x = md(V.sx(0) + t * T * (L.depth === 'coolant' ? 0.02 : 0.05), wp) - wp; x < W; x += wp) if (x + wp > 0) blitPart(c, s.cv, x, Y, wp + 0.6, Hp, W, H); if (Y + Hp < H) { c.fillStyle = L.seaSh; c.fillRect(0, Y + Hp - 1, W, H - Y - Hp + 1); } } }
    for (const it of L.isles) { const P2 = pP(T * k * it.s), base = it.b != null ? yb(it.b) : yt(it.t); each(V, L.per, it.fx, 4 * it.s + 2, xw => { const X = V.sx(xw), Y = base + (L.depth === 'coolant' ? 0 : Math.sin(t * 0.4 + it.fx * 9) * T * 0.12); if (Y < -T * 6 || Y > H + T * 5) return;
      const s = isle(V.land, it.v, P2); if (!s) return; const f = T * it.s / s.P; c.drawImage(s.cv, X - s.ax * f, Y - s.ay * f, s.cv.width * f, s.cv.height * f);
      if (it.prop && HAS_W && window.YUG_PROPS) window.YUG_PROPS.piece(c, it.prop, it.v % 2, X, Y - T * 0.12 * it.s, T * it.s * 0.7, { L: L.L }); }); }
    if (F) { try { const Q = F.begin(c, null); if (o.gn > 0 && Q.clipTo) Q.clipTo(o.grects, o.gn); if (!rngOn) skyLight(Q, V, L, lf, t); airLight(Q, V, L, lf, t); if (Q.nl || Q.ns) { STATS.quads += (Q.nl + Q.ns) / 6; STATS.passes = (STATS.passes || 0) + 1; F.flush(c); } } catch (e) {} }
  }
  // (the arenas' still sky, no GPU: a soft painted glow where the light would be)
  function skyStill(c, V, L) { const T = V.T, yt = dy => V.sy(V.top + dy); const g = (x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createRadialGradient(x, y, 0, x, y, r); const n = hex(col); gg.addColorStop(0, `rgba(${n[0]},${n[1]},${n[2]},${a})`); gg.addColorStop(1, `rgba(${n[0]},${n[1]},${n[2]},0)`); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); };
    if (L.eye) each(V, L.per, 0.5, 10, xw => g(V.sx(xw), yt(L.eye.t), T * 6, L.eye.col, 0.22));
    if (L.core) each(V, L.per, L.core.fx, 8, xw => g(V.sx(xw), yt(L.core.t), T * 4, L.core.col, 0.3));
    if (L.heart) each(V, L.per, L.heart.fx, 10, xw => g(V.sx(xw), yt(L.heart.t), T * 7, L.heart.col, 0.25));
    if (L.lamps) each(V, L.per, 0.25, 10, xw => g(V.sx(xw), yt(L.lamps.t), T * 5, L.lamps.col, 0.12)); }
  function skyLight(Q, V, L, lf, t) { const T = V.T, W = V.W, H = V.H, yt = dy => V.sy(V.top + dy);
    if (L.eye) each(V, L.per, 0.5, L.per * 0.6, xw => { const X = V.sx(xw), Y = yt(L.eye.t); if (Y < -T * 12 || Y > H + T * 12) return;   // the storm's eye over the crash site: the void's current turning, a pale hollow at its heart
      Q.quad(570, X, Y, T * 9, 0, 0, T * 6.5, L.eye.col, 0.85, 0.37, 0.8, 0.3); Q.glow(X, Y, T * 2.4, '#E8C8FF', 0.12, 0.7); Q.ring(X, Y, T * 3.6, VIOLET_HI, 0.08, T * 1.2, 0.7);
      if (!lf) Q.quad(570, V.sx(xw + L.per * 0.48), Y + T * 2.5, T * 6, 0, 0, T * 3.5, '#8A40E0', 0.55, 0.71, 0.5, 0.2); });
    if (L.core) each(V, L.per, L.core.fx, 8, xw => { const X = V.sx(xw), Y = yt(L.core.t); if (Y < -T * 8 || Y > H + T * 8) return; const p = 0.85 + 0.15 * Math.sin(t * 1.3); Q.glow(X, Y, T * 5, L.core.col, 0.22 * p, 0.5); Q.glow(X, Y, T * 1.5, VIOLET_HI, 0.25 * p, 0.6); });
    if (L.lamps) each(V, L.per, 0.25, L.per * 0.6, xw => { const Y = yt(L.lamps.t); if (Y < -T * 6 || Y > H + T * 6) return; for (let i = 0; i < 6; i++) { const X = V.sx(xw + i * L.per / 6); Q.glow(X, Y, T * 1.6, L.lamps.col, 0.14 + 0.03 * Math.sin(t * 0.9 + i), 0.6); Q.glow(X, Y, T * 0.25, TEAL_HI, 0.5); } Q.glow(V.sx(xw + L.per * 0.25), yt(-2.5), L.per * 0.4 * T, TEAL, 0.05, 0.2); });
    if (L.heart) each(V, L.per, L.heart.fx, L.per * 0.6, xw => { const X = V.sx(xw), Y = yt(L.heart.t); if (Y < -T * 12 || Y > H + T * 12) return; const ph = (t * 1.15) % 1, beat = Math.exp(-ph * 9) + 0.6 * Math.exp(-Math.max(0, ph - 0.22) * 11) * (ph > 0.22 ? 1 : 0);
      Q.glow(X, Y, T * (8 + beat * 1.5), L.heart.col, 0.16 + 0.22 * beat, 0.6); Q.glow(X, Y, T * 3, AMBER, 0.12 + 0.2 * beat, 0.6); if (!lf) Q.quad(570, X, Y, T * 7, 0, 0, T * 4.5, '#C0306A', 0.5, 0.21, 0.25 + 0.4 * beat, 0.6); }); }
  // the far lightning: bolts striking in the void now and then, fixed in the world (each lives a fraction of a second)
  const SKYB = [];
  function airLight(Q, V, L, lf, t) { const T = V.T, W = V.W, H = V.H, yt = dy => V.sy(V.top + dy), yb = dy => V.sy(V.bot + dy);
    if (L.depth === 'void') { each(V, L.per, 0.5, L.per * 0.7, xw => { const Ys = yb(5.5); if (Ys > -T * 6 && Ys < H + T * 6) { Q.quad(570, V.sx(xw), Ys, L.per * 0.45 * T, 0, 0, T * 4.5, VIOLET, 0.7, 0.13, 0.6, 0.15); if (!lf) Q.quad(570, V.sx(xw + L.per * 0.5), Ys + T * 2, L.per * 0.3 * T, 0, 0, T * 3, '#8A40E0', 0.5, 0.53, 0.4, 0.2); } });
      // bands of the void's current drifting in the gulf beside and under the land too, fixed every 15 rows
      const r0 = Math.floor((V.top + (0 - V.sy(V.top)) / T) / 15), r1 = Math.ceil((V.top + (H - V.sy(V.top)) / T) / 15);
      for (let r = Math.max(1, r0); r <= r1; r++) { const yw = V.top + r * 15 - 4, Y = V.sy(yw); if (Y < -T * 6 || Y > H + T * 6) continue; each(V, L.per, (0.2 + 0.37 * r) % 1, L.per * 0.5, xw => Q.quad(570, V.sx(xw), Y, L.per * 0.28 * T, 0, 0, T * 3.2, VIOLET, 0.5 * Math.max(0.4, 1 - r * 0.15), (r * 0.31) % 1, 0.6, 0.2)); } }
    if (L.depth === 'coolant' || L.depth === 'pit') { // over the gulf's floor (cells of 9 x 7 tiles fixed in the world, under the far wall's foot): the coolant's caustic glow and steam rising off it; the pit's pulses of light running through its cables
      const y0w = V.top - 0.4, C2 = 9, R2 = 7, camX = (W / 2 - V.sx(0)) / T, camY = (H / 2 - V.sy(0)) / T, gx0 = Math.floor((camX - W / 2 / T) / C2) - 1, gx1 = Math.ceil((camX + W / 2 / T) / C2), gy0 = Math.max(0, Math.floor((camY - H / 2 / T - y0w) / R2) - 1), gy1 = Math.ceil((camY + H / 2 / T - y0w) / R2);
      for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) { const cx = (gx + 0.5) * C2, cy = y0w + (gy + 0.5) * R2, X = V.sx(cx), Y = V.sy(cy), dk = Math.min(1, 0.45 + gy * 0.2); if (X < -C2 * T || X > W + C2 * T || Y < -R2 * T || Y > H + R2 * T) continue;
        if (L.depth === 'coolant') { Q.quad(572, X, Y, C2 * 0.55 * T, 0, 0, R2 * 0.55 * T, TEAL, 0.6 * dk, hh(gx, gy, 81), 0.8, lf ? 0 : 0.5); if (!lf && hh(gx, gy, 83) < 0.45) { const xp = V.sx(cx + (hh(gx, gy, 85) - 0.5) * C2 * 0.6); Q.quad(573, xp, Y - T * 1.2, T * 1.8, 0, 0, T * 2.6, '#BFEFE8', 0.32 * dk, hh(gx, gy, 87) * 9, 0.9, 0.2); } }
        else { for (let i = 0; i < 2; i++) { const ph = md(t * 0.9 - hh(gx, gy, 91 + i) * 2 - i * 0.37, 1), k = Math.exp(-ph * 5); Q.glow(V.sx(cx + (hh(gx, gy, 93 + i) - 0.5) * C2), V.sy(cy + (hh(gx, gy, 95 + i) - 0.5) * R2), T * (2.2 + k * 1.6), i ? AMBER : PINK, (0.08 + 0.22 * k) * dk, 0.4); } } } }
    if (L.bolts && !lf) { // the void's lightning: a new fork every ~1.2 s somewhere over or under the land (in the world)
      if (!SKYB.length || t - SKYB[SKYB.length - 1].t0 > 0.9 + hh(Math.floor(t), 7, 9) * 0.8 || t < SKYB[SKYB.length - 1].t0) { const cx = (W / 2 - V.sx(0)) / T, up = Math.random() < 0.5, x0 = cx + (Math.random() - 0.5) * W / T * 0.9, ya = up ? V.top - 9 - Math.random() * 3 : V.bot + 4 + Math.random() * 2;
        SKYB.push({ t0: t, x0, ya, x1: x0 + (Math.random() - 0.5) * 4, yb: ya + (up ? 5 + Math.random() * 2 : 3 + Math.random() * 2), sd: Math.random() * 90 }); if (SKYB.length > 6) SKYB.shift(); STATS.bolts++; }
      for (const b of SKYB) { const u = (t - b.t0) / 0.28; if (u < 0 || u > 1) continue; const ax = V.sx(b.x0), ay = V.sy(b.ya), bx = V.sx(b.x1), by = V.sy(b.yb), dx = (bx - ax) / 2, dy = (by - ay) / 2, l = Math.hypot(dx, dy) || 1;
        Q.quad(571, ax + dx, ay + dy, dx, dy, -dy / l * T * 1.6, dx / l * T * 1.6, '#B070FF', 0.9, b.sd, u, 0.8); Q.glow(bx, by, T * 2, VIOLET, 0.3 * (1 - u)); Q.glow(ax + dx, ay + dy, T * 4, VIOLET, 0.08 * (1 - u), 0.6); } }
    const C = 5, camX = (W / 2 - V.sx(0)) / T, camY = (H / 2 - V.sy(0)) / T, gx0 = Math.floor((camX - W / 2 / T) / C) - 1, gx1 = Math.ceil((camX + W / 2 / T) / C) + 1, gy0 = Math.floor((camY - H / 2 / T) / C) - 1, gy1 = Math.ceil((camY + H / 2 / T) / C) + 1;
    const mc = L.depth === 'coolant' ? TEAL_HI : L.depth === 'pit' ? '#FFD0A0' : VIOLET_HI;
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) { if (hh(gx, gy, 91) > (lf ? 0.3 : 0.6)) continue; const ph = hh(gx, gy, 92), u = md(t * 0.05 * (0.6 + ph) + ph, 1), xw = (gx + hh(gx, gy, 93)) * C + (u - 0.5) * C * 0.6, yw = (gy + hh(gx, gy, 94)) * C - u * C * 1.4;
      const X = V.sx(xw), Y = V.sy(yw); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue; const a = Math.sin(u * Math.PI) * 0.5; Q.glow(X, Y, T * 0.1, mc, a * 0.5); Q.glow(X, Y, T * 0.03, '#FFFFFF', a * 0.8); } }

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
      paint(c, S, R) { c.fillStyle = L.base; c.fillRect(0, 0, S, S); for (let i = 0; i < 20; i++) { c.fillStyle = land === 'coolant' ? `rgba(120,240,220,${0.08 + R() * 0.2})` : land === 'engineheart' ? `rgba(255,160,200,${0.08 + R() * 0.2})` : `rgba(220,180,255,${0.1 + R() * 0.3})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.1 ? 1.2 : 0.6, 0, TAU); c.fill(); } },
      back(c, o) { let V = null; const Lv = LIVE;
        if (Lv && Lv.X && Lv.land === land) { try { V = view(Lv.X, land); V.W = o.W; V.H = o.H; V.k = o.k || 1; V.t = o.t; } catch (e) { V = null; } }
        if (!V) { const T = Math.max(24, Math.min(o.W, o.H) / 10), cx = o.wx / T, cy = o.wy / T; V = { W: o.W, H: o.H, T, sx: x => (x - cx) * T + o.W / 2, sy: y => (y - cy) * T + o.H / 2, t: o.t, land, top: cy - 6, bot: cy + 6, k: o.k || 1 }; }
        const rn = Lv && Lv.X ? seenRects(Lv.X, o.W, o.H) : 0, gn = rn > 0 ? coarse(SRC, rn) : 0;
        if (rn < 0) { c.fillStyle = L.base; c.fillRect(0, 0, o.W, o.H); STATS.hidden = (STATS.hidden || 0) + 1; return; }
        try { vista(c, V, { gpu: !!(Lv && Lv.X), rn, rects: SRC, gn, grects: GRC }); } catch (e) { c.fillStyle = L.base; c.fillRect(0, 0, o.W, o.H); } } }; }
  const OLDB = {};
  function install() { if (typeof BIOMES === 'undefined') return; for (const [gap, land] of Object.entries(LAND_OF)) { const B = BIOMES[land]; if (!B || B.__ysky) continue; B.__ysky = 1; const old = B.gap; OLDB[land] = old;
    try { Object.defineProperty(B, 'gap', { configurable: true, enumerable: true, get: () => (off() || !(HAS_W && window.BELPROPS) ? old : gap), set: () => {} }); } catch (e) { B.gap = gap; } } }
  install();

  /* ======================= the stage: its land's top and bottom edges ======================= */
  function stageOf(X) { const M = X.M, F = X.F || {}, land = LANDS[F.biome] ? F.biome : 'wreckfield', TG = typeof T_GAP !== 'undefined' ? T_GAP : 2, TS = typeof T_SOLID !== 'undefined' ? T_SOLID : 0;
    let y0 = 1e9, y1 = -1e9; if (M && M.G) { const G = M.G, MW = M.MW, MH = M.MH; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const g = G[y * MW + x]; if (g !== TG && g !== TS) { if (y < y0) y0 = y; if (y > y1) y1 = y; } } }
    if (!(y1 >= y0)) { y0 = X.me.y - 8; y1 = X.me.y + 8; } return { X, land, top: y0, bot: y1 + 1 }; }
  function hookRift() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.yuggoth; if (!Rf || Rf.__ysky) return; Rf.__ysky = 1;
    const oe = Rf.everyStage; Rf.everyStage = function (X) { let a = {}; try { a = oe ? oe.apply(this, arguments) || {} : {}; } catch (e) { a = {}; } try { LIVE = X.F && X.F.fiend ? null : stageOf(X); SKYB.length = 0; } catch (e) { LIVE = null; } return a; };
    const op = Rf.preload; Rf.preload = function (P) { let a = []; try { a = op ? op.apply(this, arguments) || [] : []; } catch (e) {} let b = []; try { hookArena(); b = warm(P); } catch (e) {} return a.concat(b); }; } catch (e) {} }
  hookRift();
  function release() { const n = CACHE.size; CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); CACHE.clear(); STATS.released += n; SKYB.length = 0; }
  function hookRelease() { try { if (typeof DunWorld === 'undefined' || !DunWorld.dropProps || DunWorld.dropProps.__ysky) return; const od = DunWorld.dropProps; const f = function () { try { return od.apply(this, arguments); } finally { release(); LIVE = null; } }; for (const k in od) f[k] = od[k]; f.__ysky = 1; DunWorld.dropProps = f; } catch (e) {} }
  hookRelease();
  function warm(P) { if (off() || !P || !(P.T > 0) || !P.F) return []; const land = LANDS[P.F.biome] ? P.F.biome : null; if (!land) return []; const L = LANDS[land], k = Math.min(3, P.k || 1), T = P.T, jobs = [], job = f => jobs.push(() => { try { f(); } catch (e) {} });
    job(() => rangeStrip(land, 'range2', sP(T * k))); job(() => rangeStrip(land, 'range', sP(T * k))); job(() => (L.depth === 'void' ? seaStrip(land, sP(T * k)) : depthTile(land, sP(T * k)))); if (L.stars) job(() => starTile(Math.min(2, k)));
    if (P.F.fiend) return jobs;
    for (const it of L.isles) { job(() => isle(land, it.v, pP(T * k * it.s))); if (it.prop && HAS_W && window.YUG_PROPS) job(() => window.YUG_PROPS.sprite(it.prop, it.v % 2, Math.round(T * k * it.s * 0.7), L.L)); }
    return jobs; }

  /* ======================= the arenas: the fight's cached sky is this view, still; its floor carries the land's texture ======================= */
  const MINE = { khaal: 'wreckfield', ixvorra: 'coolant', nyarzhul: 'engineheart' };
  function wrapDef(id) { try { const D = typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS[id]; if (!D || D.__ysky || typeof D.sky !== 'function') return; D.__ysky = 1; const os = D.sky;
      D.sky = function (c, W, H, t, cam, T) { if (!off() && HAS_W && window.BELPROPS && cam && T > 0) { try { c.save(); const land = MINE[id], V = { W, H, T, sx: x => (x - cam.x) * T + W / 2, sy: y => (y - cam.y) * T + H / 2, t: 0, land, top: cam.y - (id === 'nyarzhul' ? 17 : 15), bot: cam.y + 14, k: kOf(c) }; vista(c, V, { gpu: false, still: true }); c.restore(); STATS.arena++; return; } catch (e) { try { c.restore(); } catch (e2) {} } }
        return os.apply(this, arguments); }; } catch (e) {} }
  /* the arenas' floors: the fight's own ground (its shape, its marks, the channels, the gantry) painted as before, then the land's
     floor texture (20u6d: plates in scorched grit, the vaults' deck, flesh over steel) laid into it with an overlay and a soft
     light, so it carries the land's detail and light at the lands' grain without changing what it shows */
  const LN = { khaal: 'wreck', ixvorra: 'cool', nyarzhul: 'heart' }, SHAPE = { khaal: R => [R + 0.05, R + 0.05], ixvorra: R => [R + 0.05, R + 0.05], nyarzhul: () => [17, 12] };
  function wrapGround(id) { try { const D = typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS[id]; if (!D || D.__yskyg || typeof D.paintGround !== 'function') return; D.__yskyg = 1; const og = D.paintGround;
      D.paintGround = function (c, A2) { const r = og.apply(this, arguments); if (off() || !(HAS_W && window.YUG_PROPS && window.BELPROPS)) return r;
        try { const m = c.getTransform(), P = Math.max(8, Math.min(72, Math.round(Math.hypot(m.a, m.b)))), t = window.YUG_PROPS.tex('floor:' + LN[id], P); if (!t) return r; const [RX, RY] = SHAPE[id](A2.R);
          const pat = c.createPattern(t.cv, 'repeat'); if (!pat) return r; try { pat.setTransform(new DOMMatrix([1 / t.P, 0, 0, 1 / t.P, 0, 0])); } catch (e) { return r; }
          c.save(); c.beginPath(); c.ellipse(0, 0, RX, RY, 0, 0, TAU); c.clip(); c.fillStyle = pat; c.globalCompositeOperation = 'overlay'; c.globalAlpha = id === 'ixvorra' ? 0.55 : 0.75; c.fillRect(-RX - 1, -RY - 1, RX * 2 + 2, RY * 2 + 2);
          c.globalCompositeOperation = 'soft-light'; c.globalAlpha = 0.4; c.fillRect(-RX - 1, -RY - 1, RX * 2 + 2, RY * 2 + 2);
          const g = c.createRadialGradient(0, 0, Math.min(RX, RY) * 0.5, 0, 0, Math.max(RX, RY) + 0.2); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, id === 'ixvorra' ? 'rgba(2,12,16,.3)' : 'rgba(8,2,14,.32)'); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = g; c.fillRect(-RX - 1, -RY - 1, RX * 2 + 2, RY * 2 + 2); c.restore(); STATS.arenaFloor = (STATS.arenaFloor || 0) + 1; } catch (e) {}
        return r; }; } catch (e) {} }
  function hookArena() { for (const id in MINE) { wrapDef(id); wrapGround(id); } }
  if (typeof setTimeout === 'function') setTimeout(() => hookArena(), 0);

  const API = { vista, view, release, warm, LANDS, stageOf, install, OLDB, rangeStrip, seaStrip, isle, seenRects, arena: { hook: hookArena, MINE },
    get LIVE() { return LIVE; }, set LIVE(v) { LIVE = v; },
    get stats() { return Object.assign({ cached: CACHE.size, px: [...CACHE.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) }, STATS); } };
  if (HAS_W) window.YUG_SKY = API;
  return API;
})();
