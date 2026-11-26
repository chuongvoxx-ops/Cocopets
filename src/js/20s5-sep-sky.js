/* ---------- v463 SS: the Sepulchre of Borrowed Hours' far views (Rift 04: its three lands and its three boss arenas) ----------
   What is seen past the edge of the playable land, rebuilt at Rift 03's standard (the user, 2026-11-26: "same method and
   graphic fidelity as rift 3"). Each land is one landscape laid over the stage and fixed in the world (v428 / v433 DS): a
   thing's place on the screen is its place in the world minus the camera, so nothing slides with the camera, and the layout
   repeats along x every `per` tiles so a stage of any width is covered. Its horizon lies across the middle of the stage's land
   (LIVE.hy; an arena's: just north of its centre), what hangs above it held a set height over the land's top edge:
     sepulchre (the Clockless Halls): endless galleries of round arches receding into the dark above and below, backlit by a far
       gold radiance; colossal stopped clock faces and great gear wheels hanging in the dark; pendulums on long rods hung from
       the unseen vault, each stopped mid-swing and straining (a slow shiver); shafts of pale gold light falling through the
       dust; gold motes drifting.
     twoages (the Hall in Two Ages): a sky split along x between dawn (rose, gold, a rising sun) and ruin (ash violet, an old
       veiled sun), the colours and the clouds' banks changing with it; fragments of the hall floating in it (marble slabs
       torn from the floor with their columns: whole, white and gilt in the dawn; broken, stained and overgrown in the ruin);
       rays from the dawn sun, gold glints on the young stone, sparkles in the dawn air and ash in the ruin's.
     borrowed (the Borrowed Stairs): an endless violet void; ranges of stair towers receding, flights of stairs and glass
       bridges and square door frames hanging in it; currents of time flowing through it; borrowed hours drifting as little
       clock faces of light, each with its own hand turning.
   Pictures (arcades, dials, gears, pendulums, the fragments, flights, bridges, frames: BELPROPS.kit's software shading in each
   land's own light; the sky's columns, the ranges, the suns, the star tiles) are painted once per sharpness and kept until the
   stage closes (DunWorld.dropProps, and the fight's release, chained: every one given back). Nothing is painted per frame: the
   frame lays the pictures down; what moves or glows is the GPU painter's (FGFX kinds 408..411, "v463 SS" in 20k6h: 408 shafts
   of light, 409 a dial's light / a borrowed hour, 410 currents of time, 411 a glass sheen; with 241 a sun's corona and 244 a
   veil of mist, both v433 DS's), lowFx respected; without it the pictures stay and the light is left out.
   Hooks: BIOMES.sepulchre / twoages / borrowed .gap -> 'sepdark' / 'agesky' / 'stairvoid' (getters: the old kind while
   window.__SSKY is 0) with their GAP_EXT backdrops; RIFT_BY_ID.sepulchre.everyStage (chained: LIVE, the stage's horizon) and
   .preload (chained: the pictures painted on the loading screen); the arenas through the fiend kit at run time (the boss files
   untouched): DunFiend.create wrapped for threnn / vaul / khyros so the live view is laid under the arena's own ground (its
   cached sky left transparent: FIEND_DEFS[id].sky wrapped), drawn only where the ground does not cover (read from the ground's
   own picture), with anchored dressing beyond its rim. A def may set sepSky: false to keep its own sky.
   window.__SSKY = 0 turns all of it off (the old look comes back); __SSKY_GL = 0 the GPU's part only.
   API (global SEP_SKY): vista(c, V, o), view(X), release(), warm(P), stats, LIVE, LANDS, DEF, arena { ... }. */
var SEP_SKY = (() => {
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined';
  const off = () => HAS_W && window.__SSKY === 0;
  const BP = () => (HAS_W && window.BELPROPS && window.BELPROPS.kit) ? window.BELPROPS : null;
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const md = (a, n) => ((a % n) + n) % n;
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + (s | 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const R1 = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const hex = h => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const kOf = c => { const m = c && c.getTransform ? c.getTransform() : null; return m ? Math.max(0.2, Math.hypot(m.a, m.b)) : 1; };
  const qP = P => Math.max(6, Math.round(Math.exp(Math.round(Math.log(Math.max(1, P)) * 8) / 8)));   // (steps of ~13%)
  const STATS = { painted: 0, paintMs: 0, released: 0, frames: 0, quads: 0, pics: 0, misses: 0, arena: 0 };
  // wrapping value noise (p cells across)
  function pvn(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), q = p | 0 || 1;
    const X0 = ((xi % q) + q) % q, X1 = (X0 + 1) % q, Y0 = ((yi % q) + q) % q, Y1 = (Y0 + 1) % q, a = hh(X0, Y0, s), b = hh(X1, Y0, s), c = hh(X0, Y1, s), d = hh(X1, Y1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const pn1 = (x, p, s) => pvn(x, 0.5, p, s);
  // the Hall in Two Ages: how much of the ruin there is at x (0 the dawn's half of the layout, 1 the ruin's; soft between)
  const ruinU = u => ss(0.36, -0.36, Math.sin(TAU * u));

  /* ======================= the three lands ======================= */
  /* sky: the column's colours by a = (y - horizon) / span (y down); sky2 (two ages) the ruin's column; strips: the ranges (y their
     top, h their height, tiles from the horizon; z their order among the items); items: pictures standing in the view (fx their
     place in the period, y their feet from the horizon or t over the land's top edge, s their scale); veils: banks of mist (GPU) */
  const LANDS = {
    sepulchre: { per: 72, light: 'halls', base: '#05060C',
      sky: [[-1.7, '#010205'], [-1.1, '#03040A'], [-0.7, '#060912'], [-0.42, '#0B0F1C'], [-0.2, '#121626'], [-0.08, '#1E1E28'], [-0.025, '#3A3022'], [0, '#5A4626'], [0.025, '#3A3024'], [0.1, '#1C1A24'], [0.3, '#0E1020'], [0.7, '#070914'], [1.2, '#04050C'], [1.7, '#020306']],
      radiance: '#E8B460',
      strips: [
        { z: 1, prof: 'arcade', y: -2.6, h: 4.2, per: 36, nb: 18, nj: 2, seed: 7, wall: '#080A13', lit: '#24242E', rim: '#FFD890', haze: '#3A3022', hz: 0.26, hzd: 0.3, rimA: 0.9, fade: 1.4, phase: 7 },
        { z: 5, prof: 'arcade', y: 3.2, h: 6.8, per: 48, nb: 13, nj: 2, seed: 11, wall: '#06080F', lit: '#1E2030', rim: '#F0C070', haze: '#100F16', hz: 0.08, hzd: 0.55, rimA: 0.85, fade: 3.2, phase: 3 },
        { z: 9, prof: 'arcade', y: 14, h: 11, per: 72, nb: 12, nj: 2, seed: 29, wall: '#04050A', lit: '#161826', rim: '#D8A458', haze: '#05060C', hz: 0.03, hzd: 0.55, rimA: 0.75, fade: 5, phase: 29 } ],
      items: [
        { z: 0, kind: 'dial', v: 1, fx: 0.62, y: -2.2, s: 1.5, a: 0.7, haze: 0.5, ring: 1 }, { z: 0, kind: 'gear', v: 2, fx: 0.2, y: -2.0, s: 1.8, a: 0.65, haze: 0.55 },
        { z: 2, kind: 'gear', v: 1, fx: 0.86, y: 3.6, s: 1.5, haze: 0.3 }, { z: 2, kind: 'gear', v: 2, fx: 0.4, y: 4.4, s: 2.4, haze: 0.3, rot: 0.1 }, { z: 2, kind: 'gear', v: 0, fx: 0.49, y: 3.0, s: 1.1, haze: 0.3, rot: 0.13 }, { z: 2, kind: 'dial', v: 2, fx: 0.08, y: 3.8, s: 1.8, haze: 0.3, ring: 1 },
        { z: 6, kind: 'dial', v: 0, fx: 0.16, y: 13.2, s: 3.4, ring: 1 }, { z: 6, kind: 'gear', v: 2, fx: 0.56, y: 14, s: 3.6, rot: 0.06 }, { z: 6, kind: 'gear', v: 1, fx: 0.7, y: 12.2, s: 2.0 }, { z: 6, kind: 'gear', v: 0, fx: 0.9, y: 13.6, s: 2.6, rot: 0.3 },
        { z: 10, kind: 'gear', v: 0, fx: 0.3, y: 27, s: 4.4 }, { z: 10, kind: 'dial', v: 2, fx: 0.82, y: 26.5, s: 4.0, ring: 1 } ],
      // what hangs over the land (t: tiles over its top edge): the great dials and the pendulums (their pivots out of sight)
      hang: [
        { kind: 'dial', v: 0, fx: 0.36, t: -9, s: 3.6, ring: 1 }, { kind: 'dial', v: 2, fx: 0.9, t: -6.5, s: 2.4, a: 0.9, ring: 1 }, { kind: 'gear', v: 1, fx: 0.63, t: -11, s: 2.2, a: 0.8, rot: 0.2 }, { kind: 'dial', v: 1, fx: 0.12, t: -12.5, s: 2.0, a: 0.75, ring: 1 },
        { kind: 'pend', v: 0, fx: 0.38, t: -12, s: 0.75, sw: 0.08, ph: 1.7 }, { kind: 'pend', v: 2, fx: 0.94, t: -17, s: 1.1, sw: -0.07, ph: 3.1 }, { kind: 'gear', v: 0, fx: 0.46, t: -4.5, s: 1.4, a: 0.7, haze: 0.4 },
        { kind: 'pend', v: 1, fx: 0.06, t: -14, s: 1, sw: 0.16, ph: 0.3 }, { kind: 'pend', v: 2, fx: 0.52, t: -16, s: 1.05, sw: -0.12, ph: 2.1 }, { kind: 'pend', v: 0, fx: 0.76, t: -11, s: 0.9, sw: 0.22, ph: 4.4 }, { kind: 'pend', v: 1, fx: 0.24, t: -13, s: 0.8, sw: -0.2, ph: 5.3 } ],
      shafts: [{ fx: 0.18, t: -14, w: 7, h: 18, a: 0.32 }, { fx: 0.5, t: -15, w: 5.5, h: 15, a: 0.24 }, { fx: 0.78, t: -13, w: 8, h: 20, a: 0.28 }],
      veils: [{ y: -0.5, w: 34, h: 1.8, col: '#6A5A44', a: 0.24, spd: 0.4 }, { y: 4.4, w: 40, h: 3, col: '#2A2838', a: 0.34, spd: 0.3 }, { y: 11, w: 46, h: 4.4, col: '#1E1E2C', a: 0.32, spd: 0.25 }, { y: -7, w: 40, h: 3, col: '#2E2A30', a: 0.18, spd: 0.3 }],
      motes: '#FFD488' },
    twoages: { per: 96, light: 'dawn', two: true, base: '#CFC8DC',
      sky: [[-1.7, '#2E4C94'], [-1.1, '#4E72B4'], [-0.7, '#86A2D4'], [-0.4, '#C2C2DE'], [-0.2, '#EEC8C4'], [-0.07, '#FFD8B0'], [0, '#FFEACA'], [0.04, '#FFF4E4'], [0.2, '#F2E4E0'], [0.5, '#D4CCE2'], [1.0, '#A8AED8'], [1.7, '#7C88C4']],
      sky2: [[-1.7, '#1C1626'], [-1.1, '#2C2436'], [-0.7, '#463A4E'], [-0.4, '#6A5866'], [-0.2, '#8E7676'], [-0.07, '#AE8E80'], [0, '#C4A290'], [0.04, '#B49C94'], [0.2, '#8E8090'], [0.5, '#685E74'], [1.0, '#4A4258'], [1.7, '#302A3C']],
      suns: [{ fx: 0.25, t: -8, a: -0.5, r: 2.6, v: 0 }, { fx: 0.76, t: -10, a: -0.62, r: 2.1, v: 1 }],
      strips: [
        { z: 0, prof: 'cloud', y: -11, h: 2.6, per: 96, seed: 41, nj: 2, soft: 0.2, lit: '#FFFFFF', sh: '#C8CCE8', rim: '#FFF0D0', haze: '#B8C4E6', hz: 0.45, hzd: 0.3, light: [-0.6, 0.8], fade: 1.6,
          ruin: { lit: '#B4A4B0', sh: '#5C4E66', rim: '#D8B4A0', haze: '#5A4C66' } },   // (a high bank in the open sky over the hall)
        { z: 1, prof: 'cloud', y: -1.2, h: 2.2, per: 96, seed: 5, soft: 0.14, lit: '#FFF6EA', sh: '#E6C4C0', rim: '#FFE2A8', haze: '#FFEAD2', hz: 0.42, hzd: 0.2, light: [-0.6, 0.8], fade: 0.9,
          ruin: { lit: '#D8C4BC', sh: '#8C7682', rim: '#F0C8A8', haze: '#C2A496' } },
        { z: 3, prof: 'cloud', y: 0.6, h: 3.6, per: 96, seed: 9, soft: 0.16, lit: '#FFF8F0', sh: '#D2BCD2', rim: '#FFE6BC', haze: '#F6E8E4', hz: 0.24, hzd: 0.3, light: [-0.6, 0.8], fade: 1.4,
          ruin: { lit: '#C8B6B6', sh: '#6E5E72', rim: '#E8BEA4', haze: '#A89096' } },
        { z: 5, prof: 'cloud', y: 4.2, h: 5.6, per: 96, seed: 13, soft: 0.2, lit: '#FFFAF4', sh: '#BCB0D4', rim: '#FFE8C4', haze: '#DCD4E6', hz: 0.12, hzd: 0.35, light: [-0.6, 0.8], fade: 2.2,
          ruin: { lit: '#B8A8B0', sh: '#5A4C62', rim: '#DCB49C', haze: '#7C6E82' } },
        { z: 7, prof: 'cloud', y: 10.5, h: 8, per: 96, seed: 19, soft: 0.26, lit: '#FFFCF8', sh: '#A8A4D0', rim: '#FFF0D8', haze: '#B4B4DC', hz: 0.06, hzd: 0.35, light: [-0.6, 0.8], fade: 3.2,
          ruin: { lit: '#A89AA6', sh: '#463C52', rim: '#CCA894', haze: '#544A62' } } ],
      items: [
        { z: 2, kind: 'isle', v: 0, fx: 0.12, y: -0.9, s: 0.42, haze: 0.5 }, { z: 2, kind: 'isle', v: 1, fx: 0.34, y: -0.6, s: 0.36, haze: 0.5 }, { z: 2, kind: 'isle', v: 2, fx: 0.6, y: -0.7, s: 0.4, haze: 0.5 }, { z: 2, kind: 'isle', v: 3, fx: 0.86, y: -1.0, s: 0.36, haze: 0.5 },
        { z: 4, kind: 'isle', v: 1, fx: 0.04, y: 2.4, s: 0.7, haze: 0.22 }, { z: 4, kind: 'isle', v: 0, fx: 0.42, y: 3.0, s: 0.78, haze: 0.22 }, { z: 4, kind: 'isle', v: 3, fx: 0.58, y: 2.8, s: 0.72, haze: 0.22 }, { z: 4, kind: 'isle', v: 2, fx: 0.94, y: 2.2, s: 0.66, haze: 0.22 },
        { z: 6, kind: 'isle', v: 0, fx: 0.24, y: 8.8, s: 1.2 }, { z: 6, kind: 'isle', v: 2, fx: 0.72, y: 9.4, s: 1.3 },
        { z: 8, kind: 'isle', v: 1, fx: 0.36, y: 18, s: 1.9 }, { z: 8, kind: 'isle', v: 3, fx: 0.86, y: 17, s: 1.8 } ],
      hang: [{ kind: 'isle', v: 0, fx: 0.06, t: -4.5, s: 0.95 }, { kind: 'isle', v: 1, fx: 0.4, t: -6, s: 0.8 }, { kind: 'isle', v: 2, fx: 0.56, t: -5, s: 0.9 }, { kind: 'isle', v: 3, fx: 0.98, t: -7.5, s: 1.1 },
        { kind: 'isle', v: 1, fx: 0.2, t: -15, s: 1.3 }, { kind: 'isle', v: 3, fx: 0.7, t: -16, s: 1.4 }, { kind: 'isle', v: 0, fx: 0.34, t: -22, s: 1.7 }, { kind: 'isle', v: 2, fx: 0.84, t: -21, s: 1.6 }],
      veils: [{ y: -0.4, w: 40, h: 1.6, col: '#FFF0E4', a: 0.3, spd: 0.5 }, { y: 2.2, w: 46, h: 2.4, col: '#FFFFFF', a: 0.3, spd: 0.4 }, { y: 7, w: 50, h: 3.4, col: '#F4ECF6', a: 0.28, spd: 0.35 }, { a2: -0.6, w: 46, h: 2.2, col: '#FFF6F0', a: 0.18, spd: 0.3 }, { a2: -1.0, w: 40, h: 1.6, col: '#FFFFFF', a: 0.12, spd: 0.25 }],
      motes: '#FFF0C0', ash: '#C8B8C0' },
    borrowed: { per: 80, light: 'void', stars: true, base: '#0A0618',
      sky: [[-1.7, '#020106'], [-1.1, '#05030C'], [-0.7, '#0A0618'], [-0.4, '#120B26'], [-0.18, '#1C1236'], [-0.06, '#2A1C4C'], [0, '#3C2866'], [0.05, '#24183E'], [0.2, '#140C28'], [0.55, '#0A0616'], [1.1, '#05030C'], [1.7, '#020106']],
      strips: [
        { z: 1, prof: 'steps', y: -2.4, h: 3.2, per: 40, seed: 23, towers: 6, lit: '#6A58A8', sh: '#2A1E50', rim: '#D8C4FF', haze: '#3C2C6A', hz: 0.42, hzd: 0.2, light: [-0.7, 0.7], fade: 0.2, phase: 11 },
        { z: 3, prof: 'steps', y: 0.6, h: 5.0, per: 56, seed: 29, towers: 6, lit: '#5A4A94', sh: '#1A1236', rim: '#E2D0FF', haze: '#24183E', hz: 0.2, hzd: 0.3, light: [-0.7, 0.7], fade: 0.2, phase: 3 },
        { z: 5, prof: 'steps', y: 5.6, h: 8.5, per: 64, seed: 37, towers: 5, lit: '#4A3E80', sh: '#100A22', rim: '#D0BAFF', haze: '#0E0A1E', hz: 0.06, hzd: 0.35, light: [-0.7, 0.7], fade: 0.2, phase: 23 } ],
      items: [
        { z: 2, kind: 'flight', v: 0, fx: 0.1, y: -0.9, s: 0.5, haze: 0.45 }, { z: 2, kind: 'bridge', v: 0, fx: 0.42, y: -0.5, s: 0.5, haze: 0.45 }, { z: 2, kind: 'frame', v: 0, fx: 0.7, y: -0.7, s: 0.55, haze: 0.45 }, { z: 2, kind: 'flight', v: 2, fx: 0.88, y: -0.6, s: 0.48, haze: 0.45, flip: 1 }, { z: 2, kind: 'bridge', v: 2, fx: 0.58, y: -1.4, s: 0.45, haze: 0.5 },
        { z: 4, kind: 'flight', v: 1, fx: 0.26, y: 4.0, s: 1.0, haze: 0.2 }, { z: 4, kind: 'bridge', v: 2, fx: 0.6, y: 3.6, s: 0.95, haze: 0.2 }, { z: 4, kind: 'frame', v: 1, fx: 0.95, y: 4.4, s: 1.0, haze: 0.2, rot: 0.2 }, { z: 4, kind: 'flight', v: 0, fx: 0.78, y: 5.0, s: 0.9, haze: 0.2, flip: 1 },
        { z: 6, kind: 'flight', v: 0, fx: 0.5, y: 12.5, s: 1.8, flip: 1 }, { z: 6, kind: 'bridge', v: 1, fx: 0.12, y: 13, s: 1.7 }, { z: 6, kind: 'frame', v: 2, fx: 0.82, y: 12, s: 1.8, rot: -0.12 }, { z: 6, kind: 'flight', v: 2, fx: 0.3, y: 14.5, s: 1.6 },
        { z: 8, kind: 'flight', v: 2, fx: 0.36, y: 22, s: 2.6 }, { z: 8, kind: 'bridge', v: 0, fx: 0.76, y: 23, s: 2.6 }, { z: 8, kind: 'frame', v: 0, fx: 0.08, y: 22.5, s: 2.4, rot: 0.15 } ],
      hang: [{ kind: 'flight', v: 1, fx: 0.15, t: -5, s: 1.2, flip: 1 }, { kind: 'frame', v: 0, fx: 0.4, t: -7.5, s: 1.4, rot: -0.25 }, { kind: 'bridge', v: 2, fx: 0.66, t: -4.5, s: 1.2 }, { kind: 'flight', v: 2, fx: 0.9, t: -9, s: 1.5 }, { kind: 'frame', v: 2, fx: 0.55, t: -12, s: 1.1, rot: 0.3, a: 0.8 }, { kind: 'flight', v: 0, fx: 0.3, t: -13, s: 1.0, a: 0.8 }],
      currents: [{ a2: -0.75, w: 60, h: 14, fx: 0.2, col: '#7A4CE0', rose: 0.6 }, { y: 3, w: 54, h: 9, fx: 0.7, col: '#5A3CC0', rose: 0.3 }, { y: 13, w: 66, h: 14, fx: 0.4, col: '#4A2CA0', rose: 0.8 }],
      veils: [{ y: -0.2, w: 40, h: 1.8, col: '#6A50B0', a: 0.24, spd: 0.3 }, { y: 4.6, w: 46, h: 3, col: '#3A2A70', a: 0.28, spd: 0.25 }, { y: 12, w: 50, h: 4, col: '#2A1E54', a: 0.26, spd: 0.2 }],
      motes: '#D8C8FF', hours: '#E8D8FF' } };
  const LAND_OF = { sepdark: 'sepulchre', agesky: 'twoages', stairvoid: 'borrowed' };
  // the lights the painted pieces are shaded in (BELPROPS.kit's light, swapped in for the painting)
  const LIGHT = { halls: { a0: [0.035, 0.04, 0.075], a1: [0.03, 0.035, 0.07], e0: [0.03, 0.028, 0.045], e1: [0.42, 0.3, 0.14], k: [1.1, 0.86, 0.52], rim: [0.75, 0.52, 0.22], bo: [0.16, 0.11, 0.05] },
    dawn: { a0: [0.3, 0.26, 0.28], a1: [0.12, 0.14, 0.22], e0: [0.34, 0.3, 0.32], e1: [0.6, 0.66, 0.86], k: [1.45, 1.22, 0.98], rim: [0.6, 0.46, 0.3], bo: [0.42, 0.34, 0.34] },
    ruin: { a0: [0.16, 0.13, 0.17], a1: [0.07, 0.06, 0.1], e0: [0.16, 0.13, 0.15], e1: [0.36, 0.3, 0.38], k: [0.95, 0.72, 0.62], rim: [0.5, 0.34, 0.28], bo: [0.2, 0.15, 0.18] },
    void: { a0: [0.07, 0.05, 0.13], a1: [0.06, 0.04, 0.14], e0: [0.05, 0.04, 0.1], e1: [0.34, 0.26, 0.6], k: [0.92, 0.8, 1.25], rim: [0.7, 0.5, 1.2], bo: [0.16, 0.08, 0.3] } };
  function lit(K, name, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHT[name] || LIGHT.halls); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }

  /* ======================= the sky's columns (a gradient by height, made once) ======================= */
  const A0 = -1.7, A1 = 1.7, NCOL = 512, COLC = new Map();
  const colAt = (S, a) => { let k = 0; while (k < S.length - 2 && a > S[k + 1][0]) k++; const u = clamp((a - S[k][0]) / (S[k + 1][0] - S[k][0]), 0, 1), e = u * u * (3 - 2 * u); return mix3(S[k][1], S[k + 1][1], lerp(u, e, 0.5)); };
  function column(land) { let cv = COLC.get(land); if (cv) return cv; const S = LANDS[land].sky.map(([a, h]) => [a, hex(h)]); cv = mkc(2, NCOL); const c = cv.getContext('2d'), img = c.createImageData(2, NCOL), d = img.data;
    for (let i = 0; i < NCOL; i++) { const col = colAt(S, A0 + (i + 0.5) / NCOL * (A1 - A0)); for (let j = 0; j < 2; j++) { const o = (i * 2 + j) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; } }
    c.putImageData(img, 0, 0); COLC.set(land, cv); return cv; }
  // the ruin's sky (two ages): its column through a mask that wraps with the layout (64 columns over one period)
  function ruinSky(land) { const key = land + '|ruin'; let cv = COLC.get(key); if (cv) return cv; const S = LANDS[land].sky2.map(([a, h]) => [a, hex(h)]), NW = 64; cv = mkc(NW, NCOL); const c = cv.getContext('2d'), img = c.createImageData(NW, NCOL), d = img.data;
    for (let i = 0; i < NCOL; i++) { const col = colAt(S, A0 + (i + 0.5) / NCOL * (A1 - A0)); for (let j = 0; j < NW; j++) { const o = (i * NW + j) * 4, w = ruinU((j + 0.5) / NW); d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255 * w; } }
    c.putImageData(img, 0, 0); COLC.set(key, cv); return cv; }

  /* ======================= the far lights of the void (a tile that wraps, anchored to the stage) ======================= */
  const STARC = new Map();
  function starTile(k) { const key = 'v@' + k; let p = STARC.get(key); if (p) return p; const S = 224, N = Math.max(16, Math.round(S * Math.min(2, k))), cv = mkc(N, N), c = cv.getContext('2d'), R = R1(4631);
    c.scale(N / S, N / S);
    for (let i = 0; i < 46; i++) { const x = R() * S, y = R() * S, big = R(), s = big > 0.94 ? 1.3 : big > 0.75 ? 0.9 : 0.55, a = 0.2 + R() * 0.55, h = R(), col = h > 0.8 ? '255,214,170' : h > 0.45 ? '200,176,255' : '232,224,255';
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const X = x + ox, Y = y + oy; if (X < -4 || Y < -4 || X > S + 4 || Y > S + 4) continue;
        if (s > 1.1) { const g = c.createRadialGradient(X, Y, 0, X, Y, s * 3.2); g.addColorStop(0, `rgba(${col},${a * 0.45})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(X - s * 3.2, Y - s * 3.2, s * 6.4, s * 6.4); }
        c.fillStyle = `rgba(${col},${a})`; c.beginPath(); c.arc(X, Y, s * 0.6, 0, TAU); c.fill(); } }
    p = { cv, N, S, pat: cv.getContext('2d').createPattern(cv, 'repeat') }; STARC.set(key, p); return p; }

  /* ======================= the ranges (strips that wrap along x, painted pixel by pixel) ======================= */
  /* a range is three ridges deep (j 0 the farthest .. 2 the nearest), each nearer one hiding the foot of the one behind it.
     profile: the ridge's top at x, 0..1 (1 its highest). arcade: a wall of round arches (its openings show the ridge behind,
     or the sky); cloud: billows; steps: towers of stairs; else rolling ridges */
  function bumps(sp, j) { const k = '_b' + j; if (sp[k]) return sp[k]; const R = R1(sp.seed * 131 + 7 + j * 977), out = [];
    if (sp.prof === 'cloud') { let x = 0; const big = []; while (x < sp.per) { const r = (0.3 + R() * 0.8) * sp.h * 0.32 * (1 - j * 0.1), b = (0.02 + R() * 0.22) * sp.h * 0.4; big.push({ c: x + r * 0.6, r, b }); x += r * (0.6 + R() * 0.8); }
      for (const q of big) { out.push(q); const n = 1 + Math.floor(R() * 3); for (let i = 0; i < n; i++) { const off = (R() - 0.5) * q.r * 1.3, r = q.r * (0.22 + R() * 0.3), top = q.b + Math.sqrt(Math.max(0, q.r * q.r - off * off)); out.push({ c: q.c + off, r, b: top - r * (0.35 + R() * 0.4) }); } } }   // (billows, and smaller ones heaped on them)
    else { const n = sp.towers + (j === 1 ? 1 : 0); for (let i = 0; i < n; i++) out.push({ c: (i + 0.15 + R() * 0.7) / n * sp.per, w: 0.7 + R() * sp.per / n * 0.26, ns: 4 + Math.floor(R() * 6), h: 0.35 + R() * 0.6, dir: R() < 0.5 ? 1 : -1, top: R() < 0.4, dp: 0.5 + R() * 0.9 }); }
    return (sp[k] = out); }
  function profile(sp, x, j, AMP) { const per = sp.per;
    if (sp.prof === 'arcade') return 0.97 - (pn1(x / per * 9, 9, sp.seed + j) < 0.18 ? 0.06 : 0);   // (a level cornice, broken back here and there)
    if (sp.prof === 'cloud') { let H = 0; for (const b of bumps(sp, j)) { const d = Math.abs(md(x - b.c + per / 2, per) - per / 2); if (d >= b.r) continue; H = Math.max(H, b.b + Math.sqrt(b.r * b.r - d * d)); } return clamp(H / AMP, 0, 1); }
    if (sp.prof === 'steps') { let H = 0; for (const b of bumps(sp, j)) { const dx = md(x - b.c + per / 2, per) - per / 2; if (Math.abs(dx) > b.w) continue;
        const u = clamp((dx * b.dir + b.w) / (2 * b.w), 0, 1), st = Math.floor(u * b.ns) / b.ns; H = Math.max(H, b.top && u > 0.75 ? b.h : b.h * (0.2 + 0.8 * st)); } return H; }
    return 0.5; }
  // an arcade's openings: the distance (tiles, + outside the opening) from (x, yr tiles under the ridge's top) to the nearest
  // opening's edge; the bays of ridge j are nb * (1.4, 1.18, 1) to the period (so they shrink into the distance and wrap)
  const NBK = [1.4, 1.18, 1];
  function arch(sp, x, yr, j) { const nb = Math.round(sp.nb * NBK[j]), bay = sp.per / nb, a = bay * 0.3, crown = bay * 0.2, ys = crown + a, dx = md(x - (sp.phase || 0) * (j + 1) * 0.37, bay) - bay / 2;
    return { d: yr >= ys ? Math.abs(dx) - a : Math.hypot(dx, yr - ys) - a, dx, ys, bay, a, crown }; }
  const STRC = new Map();
  function strip(land, i, P) { const key = land + '|' + i + '|' + P; let s = STRC.get(key); if (s) return s; const t0 = now(), sp = LANDS[land].strips[i];
    for (const [k2, s2] of [...STRC]) if (k2.startsWith(land + '|' + i + '|') && s2.P < P) { s2.cv.width = s2.cv.height = 1; STRC.delete(k2); }   // (a range painted smaller before given back)
    const w = Math.round(sp.per * P), h = Math.round(sp.h * P), cv = mkc(w, h), c = cv.getContext('2d'), img = c.createImageData(w, h), d = img.data, per = sp.per;
    const RU = sp.ruin, C0 = { lit: hex(sp.lit || sp.wall), sh: hex(sp.sh || sp.wall), rim: hex(sp.rim), hz: hex(sp.haze), wall: hex(sp.wall || sp.sh) }, C1 = RU ? { lit: hex(RU.lit), sh: hex(RU.sh), rim: hex(RU.rim), hz: hex(RU.haze), wall: hex(RU.sh) } : null;
    const lt = sp.light || [-0.7, 0.7], ll = Math.hypot(lt[0], lt[1]), lx = lt[0] / ll, ly = lt[1] / ll, NJ = sp.nj || 3, kind = sp.prof, soft = Math.max(1 / P, sp.soft || 0);
    const OFF = kind === 'arcade' ? [0, sp.h * 0.22, sp.h * 0.34] : [0, sp.h * 0.2, sp.h * 0.4], AMP = kind === 'arcade' ? [sp.h * 0.2, sp.h * 0.2, sp.h * 0.2] : [sp.h * 0.55, sp.h * 0.5, sp.h * 0.5];
    const top = [], bot = [], dif = [], pre = [], skew = (lt[0] < 0 ? 1 : -1) * 0.7;
    for (let j = 0; j < NJ; j++) { const tp = new Float32Array(w), bt = new Float32Array(w), df = new Float32Array(w); for (let px = 0; px < w; px++) { const x = (px + 0.5) / P, e = 0.5 / P, H = profile(sp, x, j, AMP[j]), sl = (profile(sp, x + e, j, AMP[j]) - profile(sp, x - e, j, AMP[j])) / (2 * e) * AMP[j]; tp[px] = OFF[j] + (1 - H) * AMP[j]; const nl = Math.hypot(sl, 1); df[px] = clamp((-sl * lx + ly) / nl, 0, 1); bt[px] = 1e9;
        if (kind === 'steps') { bt[px] = -1; for (const b of bumps(sp, j)) { const dx = md(x - b.c + per / 2, per) - per / 2, q = 1 - (dx / b.w) ** 2; if (q <= 0) continue; const yb = OFF[j] + AMP[j] + b.dp * AMP[j] * Math.pow(q, 0.6) * (0.85 + 0.3 * pn1(x * 3, Math.round(per * 3), sp.seed + j)); if (yb > bt[px]) bt[px] = yb; } } }   // (a stair tower floats: its underside tapers away under it)
      top.push(tp); bot.push(bt); dif.push(df); const ps = new Float32Array(w * 3 + 1); for (let q = 0; q < w * 3; q++) ps[q + 1] = ps[q] + df[q % w]; pre.push(ps); }
    const lightAt = (j, px, dd) => { const c0 = px + Math.round(dd * skew * P) + w, hw = Math.round(dd * 0.45 * P); if (hw < 1) return dif[j][((c0 % w) + w) % w]; const a0 = clamp(c0 - hw, 0, w * 3 - 1), a1 = clamp(c0 + hw, 1, w * 3); return (pre[j][a1] - pre[j][a0]) / (a1 - a0); };
    const pal = x => { if (!C1) return C0; const u = ruinU(md(x / per, 1)); if (u < 0.002) return C0; if (u > 0.998) return C1; return { lit: mix3(C0.lit, C1.lit, u), sh: mix3(C0.sh, C1.sh, u), rim: mix3(C0.rim, C1.rim, u), hz: mix3(C0.hz, C1.hz, u), wall: mix3(C0.wall, C1.wall, u) }; };
    // the clouds' billows by the tile they span (each a sphere: its centre b over the ridge's foot line)
    const BK = kind === 'cloud' ? [] : null; if (BK) for (let j = 0; j < NJ; j++) { const cols = []; for (let q = 0; q < per; q++) cols.push([]); for (const b of bumps(sp, j)) for (let q = Math.floor(b.c - b.r) - 1; q <= Math.ceil(b.c + b.r) + 1; q++) { const a = cols[md(q, per)]; if (a.indexOf(b) < 0) a.push(b); } BK.push(cols); }
    const L3 = [lx * 0.75, 0.62, 0.45], l3 = Math.hypot(L3[0], L3[1], L3[2]); L3[0] /= l3; L3[1] /= l3; L3[2] /= l3;
    // the colour of ridge j at a pixel (dd: depth under its top; A: the arcade's opening there)
    const colOf = (j, px, x, y, A) => { const tp = top[j][px], dd = Math.max(0, y - tp), deep = ss(0, sp.h * 0.55, dd), C = pal(x); let col;
      if (kind === 'arcade') { const yr = y - tp, bay = A.bay, nz = pvn(x * 3, yr * 3, Math.round(per * 3), sp.seed + j), blk = pvn(x * 1.1, yr * 2.2, Math.round(per * 1.1), sp.seed + 5);
        col = mix3(C.wall, C.lit, 0.18 + 0.22 * nz + 0.12 * blk);
        const imp = Math.abs(yr - A.ys) < bay * 0.035 && A.d > 0 ? 1 : 0, cor = yr < bay * 0.09 ? 1 : 0, kst = A.d > 0 && A.d < bay * 0.07 && yr < A.ys && Math.abs(A.dx) < bay * 0.05 ? 1 : 0;
        if (imp || cor) col = mix3(col, C.lit, 0.55);   // (the impost moulding at the springing; the cornice)
        if (kst) col = mix3(col, C.lit, 0.7);   // (the keystone)
        const pil = Math.abs(Math.abs(A.dx) - bay / 2) < bay * 0.035 && yr > bay * 0.09 ? 0.35 : 0;   // (a pilaster's edge down the pier)
        const rim = Math.exp(-Math.max(0, A.d) / (bay * 0.035)) + Math.exp(-yr / (bay * 0.03)) * 0.8 + (imp ? 0.25 : 0) + pil;   // (the far radiance through the openings, rimming their edges)
        col = mix3(col, C.rim, clamp(rim, 0, 1) * sp.rimA * (0.55 + 0.45 * (1 - deep)));
        return mix3(col, C.hz, clamp(sp.hz + deep * sp.hzd + (NJ - 1 - j) * 0.16, 0, 1)); }
      if (kind === 'cloud') { const yB = OFF[j] + AMP[j], hp = yB - y; let bz = -1, nx = 0, nyu = 0, nzf = 1, rr = 1;
        for (const b of BK[j][md(Math.floor(x), per)]) { const dx = md(x - b.c + per / 2, per) - per / 2, dy = hp - b.b, q = b.r * b.r - dx * dx - dy * dy; if (q <= 0) continue; const z = Math.sqrt(q) + b.r * 0.15 * (b.r < AMP[j] * 0.5 ? 1 : 0); if (z > bz) { bz = z; nx = dx / b.r; nyu = dy / b.r; nzf = Math.sqrt(q) / b.r; rr = b.r; } }
        if (bz < 0) { nx = 0; nyu = -0.3; nzf = 0.95; } else if (nyu < 0.35) { const u = ss(0.35, -0.5, nyu); nx *= 1 - u; nyu = lerp(nyu, -0.3, u); nzf = lerp(nzf, 0.95, u); }   // (the body under the billows; each billow's lower half melting into it)
        const dfs = clamp(nx * L3[0] + nyu * L3[1] + nzf * L3[2], 0, 1), wisp = pvn(x * 2.2, y * 2.2, Math.round(per * 2.2), sp.seed + j * 3);
        const dB = ss(-AMP[j] * 0.2, sp.h * 0.5, y - yB);   // (deeper into the bank: by its own foot line, not by the billow over it)
        let k = (0.3 + 0.7 * dfs) * (0.9 + 0.12 * wisp) * (1 - 0.3 * dB);
        col = mix3(C.sh, C.lit, clamp(k, 0, 1));
        const edge = bz >= 0 ? Math.pow(1 - nzf, 2.2) * clamp(nx * L3[0] * 1.3 + nyu * 0.9, 0, 1) : 0; col = mix3(col, C.rim, clamp(edge * 1.1 + (1 - ss(0, 0.12, dd)) * 0.35, 0, 1));   // (the silver lining where a billow turns to the light)
        void rr; void deep; return mix3(col, C.hz, clamp(sp.hz + dB * sp.hzd + (NJ - 1 - j) * 0.1, 0, 1)); }
      const df = lightAt(j, px, dd); let k = lerp(df, 0.3 + df * 0.3, deep * 0.7);
      if (j < NJ - 1) { const gap = top[j + 1][px] - y; k *= 1 - 0.34 * (1 - ss(0, 0.6, gap)); }   // (the shadow a nearer ridge casts up the one behind it)
      if (kind === 'steps') { const bt = bot[j][px], up = bt - y; k *= 0.55 + 0.45 * ss(0, 1.2, up); }
      col = mix3(C.sh, C.lit, clamp(k, 0, 1));
      const rim = df > 0.4 ? (1 - ss(0, 0.14, dd)) * ss(0.4, 0.85, df) : (1 - ss(0, 0.045, dd)) * 0.3; col = mix3(col, C.rim, rim * 0.85);
      if (kind === 'steps') { const tr = (1 - ss(0, 0.07, dd)) * (df > 0.35 ? 1 : 0.5), sm = Math.exp(-Math.max(0, bot[j][px] - y) / 0.06); col = mix3(col, C.rim, clamp(tr * 0.7 + sm * 0.6, 0, 1)); }   // (each tread's lit edge; a seam of light along the underside)
      return mix3(col, C.hz, clamp(sp.hz + deep * sp.hzd + (NJ - 1 - j) * 0.12, 0, 1)); };
    // ridge j at a pixel, over what is behind it: [r, g, b, a]
    const sample = (j, px, x, y) => { for (; j >= 0; j--) { const tp = top[j][px]; if (y < tp - soft) continue;
        let cov = clamp((y - tp) / soft + 0.5, 0, 1), A = null; if (kind === 'arcade') { A = arch(sp, x, y - tp, j); cov *= clamp(A.d * P + 0.5, 0, 1); } else if (kind === 'steps') { const bt = bot[j][px]; if (bt < 0) continue; cov *= clamp((bt - y) * P + 0.5, 0, 1); }
        if (cov <= 0.003) continue; const col = colOf(j, px, x, y, A); if (cov >= 0.997) return [col[0], col[1], col[2], 1];
        const b = sample(j - 1, px, x, y), ab = b[3] * (1 - cov), na = cov + ab; return [(col[0] * cov + b[0] * ab) / na, (col[1] * cov + b[1] * ab) / na, (col[2] * cov + b[2] * ab) / na, na]; }
      return [0, 0, 0, 0]; };
    for (let px = 0; px < w; px++) { const x = (px + 0.5) / P; let tmin = 1e9; for (let j = 0; j < NJ; j++) tmin = Math.min(tmin, top[j][px]);
      for (let py = 0; py < h; py++) { const y = (py + 0.5) / P; if (y < tmin - soft) continue;
        const fade = 1 - ss(sp.h - sp.fade, sp.h, y); if (fade <= 0.004) continue; const s2 = sample(NJ - 1, px, x, y); if (s2[3] <= 0.003) continue;
        const gr = (hh(px, py, sp.seed) - 0.5) * 5, o = (py * w + px) * 4; d[o] = clamp(s2[0] + gr, 0, 255); d[o + 1] = clamp(s2[1] + gr, 0, 255); d[o + 2] = clamp(s2[2] + gr, 0, 255); d[o + 3] = 255 * s2[3] * fade; } }
    c.putImageData(img, 0, 0); s = { cv, P, w: per, h: sp.h }; STRC.set(key, s); STATS.painted++; STATS.paintMs += now() - t0; return s; }
  // a range's sharpness, held once chosen (one painting a range per stage, not one per step of a zoom)
  const HELD = new Map();
  const stripP = (sp, T, k) => { let P = qP(clamp(T * Math.min(2, k) * 0.6, 10, 26)); while (sp.per * P * sp.h * P > 170000 && P > 7) P = qP(P * 0.85); const h = HELD.get(sp); if (h && P < h * 1.4) return h; if (!h || P > h) HELD.set(sp, P); return P; };

  /* ======================= the painted pieces (BELPROPS.kit) ======================= */
  const M0 = K => { if (K.M0) K.M0(); };
  /* plate: a flat piece facing the viewer cut out by sdf(x, y) (units; + inside), its edges bevelled over bw (the normal turned
     out along the gradient), mat(x, y, d, ao) sets the material; o.bump(x, y) -> [bx, bz] a relief; o.box [x0, y0, x1, y1] */
  function plate(K, S, sdf, bw, mat, o) { o = o || {}; const P = S.P, e = 0.6 / P, bx = o.box; S.lock();
    const xa = bx ? Math.max(0, Math.floor(S.ax + bx[0] * P)) : 0, xb = bx ? Math.min(S.w - 1, Math.ceil(S.ax + bx[2] * P)) : S.w - 1, ya = bx ? Math.max(0, Math.floor(S.ay + bx[1] * P)) : 0, yb = bx ? Math.min(S.h - 1, Math.ceil(S.ay + bx[3] * P)) : S.h - 1;
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, d = sdf(x, y); if (d < -1 / P) continue;
      const a = clamp(d * P + 0.5, 0, 1) * (o.alpha == null ? 1 : o.alpha); if (a <= 0.003) continue; let nx = 0, nz = 0;
      if (d < bw) { const gx = (sdf(x + e, y) - sdf(x - e, y)) / (2 * e), gy = (sdf(x, y + e) - sdf(x, y - e)) / (2 * e), gl = Math.hypot(gx, gy) || 1, b = Math.pow(1 - clamp(d / bw, 0, 1), 1.3) * 0.88; nx = -gx / gl * b; nz = gy / gl * b; }
      if (o.bump) { const q = o.bump(x, y); nx += q[0]; nz += q[1]; }
      M0(K); K.M.ao = 1; mat(x, y, d, 1); const ny = Math.sqrt(Math.max(0.02, 1 - Math.min(0.98, nx * nx + nz * nz))), l = Math.hypot(nx, ny, nz); K.shade(nx / l, ny / l, nz / l); K.put(S, px, py, a); } }
  const gilt = (K, u, v, sd, wear) => K.brass(u, v, 1, sd, wear);
  /* ---- the Clockless Halls ---- */
  // a great clock face, stopped (v 0 dark blue enamel and gilt; 1 an old ivory face, crazed, its hands blued steel; 2 a bronze
  // face gone green): a rolled gilt bezel, a dark groove, the chapter ring with raised hour bars and minute ticks, a guilloché
  // centre, three hands stopped at their own hour, a boss at the middle. (units: its radius)
  const DIALS = [{ h: [5.15, 1.32, 3.55], face: [0.06, 0.08, 0.15], ring: [0.08, 0.1, 0.18], hand: 'gilt' }, { h: [0.75, 4.05, 2.4], face: [0.66, 0.6, 0.46], ring: [0.58, 0.52, 0.4], hand: 'blue' }, { h: [2.9, 5.6, 0.35], face: [0.12, 0.24, 0.2], ring: [0.2, 0.3, 0.24], hand: 'gilt' }];
  function paintDial(K, S, v) { const D = DIALS[v % 3], sd = 7 + v * 13, { M, vn } = K, HL = [[0.4, 0.06, 0.12], [0.6, 0.04, 0.16], [0.66, 0.012, 0.2]];
    const handAt = (x, y) => { for (let i = 0; i < 3; i++) { const th = D.h[i], dx = Math.sin(th), dy = -Math.cos(th), al = x * dx + y * dy, ac = -x * dy + y * dx, [Lh, wh, tail] = HL[i];
        if (al < -tail || al > Lh) continue; const hw = al < 0 ? wh * (0.7 + 0.5 * ss(-tail, -tail * 0.6, al) * (1 - ss(-tail * 0.3, 0, al))) : i === 2 ? wh * 0.8 : wh * (al < Lh * 0.72 ? 0.75 + 0.5 * ss(Lh * 0.45, Lh * 0.7, al) : Math.pow(1 - (al - Lh * 0.72) / (Lh * 0.28), 0.8) * 1.25);   // (a spade swelling before the tip; a counterweight behind the boss)
        if (Math.abs(ac) < hw) return { i, t: ac / hw, al }; } return null; };
    plate(K, S, (x, y) => 1 - Math.hypot(x, y), 0.06, (x, y) => { const r = Math.hypot(x, y), an = Math.atan2(x, -y), H = handAt(x, y);
      if (H) { const st = H.i === 2 || D.hand === 'blue'; if (st) { M.mt = 1; M.fr = 0.18; M.fg = 0.24; M.fb = 0.52; M.rg = 0.22; M.r = M.g = M.b = 0.05; } else gilt(K, H.al * 4, H.t, sd + H.i, 0.55); return; }
      if (r < 0.065) { gilt(K, x * 9, y * 9, sd, 0.7); return; }
      if (r > 0.86) { gilt(K, an * 6, r * 30, sd, 0.3 + 0.35 * vn(an * 7 + sd, 3)); M.ao *= 0.86 + 0.14 * Math.cos(an * 120); return; }   // (the bezel, knurled)
      if (r > 0.83) { M.r = M.g = M.b = 0.03; M.ao = 0.35; M.rg = 0.8; return; }   // (the groove)
      const n = vn(x * 7 + sd, y * 7), cr = vn(x * 11 - sd, y * 11 + 2), crz = Math.abs(cr - 0.5) < 0.012 || Math.abs(vn(x * 23, y * 23 + sd) - 0.5) < 0.008;
      if (r > 0.6) { const hb = Math.abs(md(an + Math.PI / 12, Math.PI / 6) - Math.PI / 12) * r, mk = Math.abs(md(an + Math.PI / 60, Math.PI / 30) - Math.PI / 60) * r, big = Math.abs(md(an + Math.PI / 4, Math.PI / 2) - Math.PI / 4) * r < 0.04;
        if ((hb < (big ? 0.036 : 0.022) && r > 0.64 && r < 0.79) || (mk < 0.0055 && r > 0.75 && r < 0.81)) { gilt(K, an * 9, r * 9, sd + 3, 0.6); return; }
        M.r = D.ring[0] * (0.85 + 0.3 * n); M.g = D.ring[1] * (0.85 + 0.3 * n); M.b = D.ring[2] * (0.85 + 0.3 * n); M.rg = 0.32; M.cc = 0.5; if (crz) M.ao *= 0.6; return; }
      const gu = 0.9 + 0.1 * Math.sin(r * 140 + 2.5 * Math.sin(an * 12)), sun = 0.94 + 0.06 * Math.cos(an * 48);   // (guilloché rings and a sunburst)
      M.r = D.face[0] * gu * sun * (0.85 + 0.3 * n); M.g = D.face[1] * gu * sun * (0.85 + 0.3 * n); M.b = D.face[2] * gu * sun * (0.85 + 0.3 * n); M.rg = 0.36; M.cc = 0.45; if (crz) M.ao *= 0.55;
      if (r > 0.5 && r < 0.53) { gilt(K, an * 9, r, sd, 0.5); } },
      { bump: (x, y) => { const r = Math.hypot(x, y) || 1, ux = x / r, uy = y / r, H = handAt(x, y);
        if (H) { const th = D.h[H.i], dx = Math.sin(th), dy = -Math.cos(th), k = H.t * 0.55; return [-dy * k, -dx * k]; }   // (a ridge along the hand)
        if (r > 0.86) { const q = clamp((r - 0.93) / 0.07, -1, 1) * 0.85; return [ux * q, -uy * q]; }
        if (r < 0.065) { const q = r / 0.065 * 0.7; return [ux * q, -uy * q]; }
        const hb = md(Math.atan2(x, -y) + Math.PI / 12, Math.PI / 6) - Math.PI / 12; if (r > 0.64 && r < 0.79 && Math.abs(hb) * r < 0.036) { const s = Math.sign(hb) * 0.5; return [uy * s * -1, -ux * s]; }
        return [ux * 0.06, -uy * 0.06]; } }); }
  // a gear wheel (v 0 old brass: 28 teeth, six spokes; 1 dark iron: 16 teeth, four; 2 bronze: 40 teeth, eight, a raised ring)
  // its rim, spokes and hub bevelled, the openings between the spokes cut through; rivets round the hub. (units: its radius)
  const GEARS = [{ n: 28, k: 6, mat: 'brass', ri: 0.7 }, { n: 16, k: 4, mat: 'iron', ri: 0.66 }, { n: 40, k: 8, mat: 'bronze', ri: 0.76 }];
  function paintGear(K, S, v) { const G = GEARS[v % 3], sd = 21 + v * 9, { M, vn } = K;
    const sdf = (x, y) => { const r = Math.hypot(x, y), an = Math.atan2(y, x), f = md(an * G.n / TAU, 1), e = Math.abs(f - 0.5), tR = lerp(1.0, 0.88, ss(0.17, 0.31, e)), out = (tR - r) * (1 - 0.3 * ss(0.17, 0.31, e) * ss(0.31, 0.17, e));
      const sa = Math.abs(md(an + Math.PI / G.k, TAU / G.k) - Math.PI / G.k) * r, sw = 0.075 + 0.045 * (1 - r) - sa;
      return Math.min(out, Math.max(r - G.ri, sw, 0.22 - r), r - 0.07); };
    plate(K, S, sdf, 0.045, (x, y) => { const r = Math.hypot(x, y), an = Math.atan2(y, x);
      if (G.mat === 'iron') K.iron(an * 3, r * 8, 1, sd); else if (G.mat === 'bronze') K.bronze(an * 2.5, r * 6, 1, sd, 0.3, false); else gilt(K, an * 3, r * 9, sd, 0.25 + 0.3 * vn(an * 5, r * 5 + sd));
      if (r > 0.22 && r < 0.27) M.ao *= 0.8; const rv = Math.hypot(r - 0.155, (md(an, TAU / G.k) - TAU / G.k / 2) * 0.155); if (rv < 0.022) { M.ao *= 0.7 + 0.3 * rv / 0.022; }
      if (G.ri < r && r < G.ri + 0.02) M.ao *= 0.75; },
      { bump: (x, y) => { const r = Math.hypot(x, y) || 1; if (v % 3 === 2 && r > 0.82 && r < 0.88) { const q = (r - 0.85) / 0.03 * 0.5; return [x / r * q, -y / r * q]; } return [0, 0]; } }); }
  // a pendulum hung from its pivot (0, 0): a bracket, a long rod with two collars, a great lens-shaped bob engraved with rings
  // and the Sepulchre's hourglass, its rim rolled gilt. (units: tiles; v the rod's length 7 / 10 / 13)
  const PENDL = [7, 10, 13];
  function paintPend(K, S, v) { const L = PENDL[v % 3], sd = 41 + v * 7, { M, vn } = K;
    plate(K, S, (x, y) => Math.min(0.3 - Math.abs(x), 0.22 - Math.abs(y + 0.02)), 0.06, (x, y) => K.iron(x * 4, y * 4, 1, sd), { box: [-0.4, -0.3, 0.4, 0.3] });
    K.tube(S, [[0, 0.12], [0, L - 0.9]], 0.075, 0.062, (t, s2) => { gilt(K, t * L, s2, sd, 0.4); });
    for (const cy of [L * 0.32, L * 0.64]) K.tube(S, [[0, cy - 0.12], [0, cy + 0.12]], 0.13, 0.13, (t, s2) => { gilt(K, t * 3, s2, sd + 1, 0.6); });
    plate(K, S, (x, y) => 1 - Math.hypot(x, y - L), 0.05, (x, y) => { const yy = y - L, r = Math.hypot(x, yy), an = Math.atan2(x, -yy);
      gilt(K, an * 4, r * 6, sd, 0.3 + 0.3 * vn(x * 4 + sd, yy * 4));
      const eng = Math.abs(r - 0.78) < 0.012 || Math.abs(r - 0.55) < 0.01 || (r < 0.55 && Math.abs(Math.abs(x) - Math.abs(yy) * 0.62 - 0.03) < 0.012 && Math.abs(yy) < 0.4) || (r < 0.55 && Math.abs(Math.abs(yy) - 0.4) < 0.012 && Math.abs(x) < 0.28);   // (engraved rings and an hourglass)
      if (eng) { M.ao *= 0.45; M.rg = 0.7; } if (r > 0.92) M.rg *= 0.7; },
      { box: [-1.05, L - 1.05, 1.05, L + 1.05], bump: (x, y) => { const yy = y - L, r = Math.hypot(x, yy) || 1, k = r > 0.9 ? clamp((r - 0.95) / 0.05, -1, 1) * 0.8 : r / 1.6; return [x / r * k, -yy / r * k]; } }); }
  /* ---- the Hall in Two Ages ---- */
  // a fragment of the hall floating in the sky: a marble slab torn from the floor (its top paved in squares, a gilt band on its
  // edge) over the broken masonry and earth it was torn with, tapering to a ragged point; columns on it with gilt capitals.
  // v 0 two whole columns under their lintel; 1 one tall column and a fallen drum (the dawn's, young: white and gilt); 2 broken
  // columns of three heights, ivy hanging; 3 a tilted slab, one stump, a column lying across it (the ruin's: stained, cracked,
  // overgrown). (units: tiles; feet: the slab's top at y 0)
  const ISLES = [{ w: 2.6, dep: 1.4, cols: [[-1.3, 3.6], [1.3, 3.6]], lintel: 1, young: 1 }, { w: 2.2, dep: 1.3, cols: [[0.3, 4.6]], drum: [-1.2, 0.5], young: 1 },
    { w: 2.8, dep: 1.5, cols: [[-1.6, 2.4], [0, 3.6], [1.5, 1.3]], ivy: 1, broken: 1 }, { w: 2.4, dep: 1.3, cols: [[1.2, 1.0]], lying: 1, ivy: 1, broken: 1, tilt: 0.12 }];
  function paintIsle(K, S, v) { const I = ISLES[v % 4], { M, vn } = K, sd = 61 + v * 17, Kp = K.K, yg = !!I.young, P = S.P;
    const marble = (u, w2, dark) => { const vein = Math.abs(vn(u * 1.3 + sd + vn(u * 3, w2 * 3) * 1.5, w2 * 1.3) - 0.5), n = vn(u * 6 + sd, w2 * 6);
      let b = (yg ? 0.95 : 0.78) - (vein < 0.02 ? 0.22 * (1 - vein / 0.02) : 0) - n * 0.05; if (!yg) { const st = ss(0.5, 0.8, vn(u * 2 - sd, w2 * 2)); b -= st * 0.18; M.g *= 1; }
      M.r = b * (yg ? 0.98 : 0.92); M.g = b * (yg ? 0.95 : 0.86); M.b = b * (yg ? 0.9 : 0.8); M.rg = yg ? 0.28 : 0.6; M.cc = yg ? 0.4 : 0.05; if (dark) { M.r *= dark; M.g *= dark; M.b *= dark; }
      if (!yg && vn(u * 3 + 9, w2 * 3) > 0.7) { M.r *= 0.7; M.g *= 0.85; M.b *= 0.6; } };   // (moss)
    const edgeY = x => { const q = 1 - (x / I.w) ** 2; return q > 0 ? I.dep * Kp * Math.sqrt(q) * (1 + (vn(x * 1.7 + sd, 3) - 0.5) * 0.25) : -1; };
    const th = 0.5, tilt = I.tilt || 0, tipY = 3.2 + (v % 2) * 0.6;
    S.lock();
    for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y0 = (py + 0.5 - S.ay) / P, y = y0 - tilt * x; if (Math.abs(x) > I.w + 0.1) continue;
      const ef = edgeY(x); if (ef < 0) continue; const q = 1 - (x / I.w) ** 2, eb = -ef;   // (the slab's back edge)
      let a = 0; M0(K);
      if (y >= eb && y <= ef) { a = clamp((y - eb) * P + 0.5, 0, 1) * clamp((ef - y) * P + 0.5, 0, 1) * clamp((Math.sqrt(q) * I.w - Math.abs(x) * 0) * P, 0, 1);   // the top, paved
        const u = x, w2 = y / Kp, gx = Math.abs(md(u + 0.5, 1.0) - 0.5), gy = Math.abs(md(w2 + 0.5, 1.0) - 0.5), grout = gx < 0.03 || gy < 0.03;
        marble(u, w2); if (grout) { if (yg) { gilt(K, u * 4, w2 * 4, sd, 0.6); } else { M.ao *= 0.6; } } if (!yg && Math.abs(vn(u * 2.2 + sd, w2 * 2.2) - 0.5) < 0.015) M.ao *= 0.45;
        K.shade(0, 0.25, 0.97); K.put(S, px, py, a); continue; }
      if (y > ef && y <= ef + th) { a = clamp((y - ef) * P + 1, 0, 1);   // the slab's edge (its front), a gilt band along its top
        const yy = y - ef; marble(x * 1.2, yy * 3, 0.92); if (yy < 0.09 && yg) gilt(K, x * 5, yy, sd + 2, 0.4); if (!yg && Math.abs(md(x * 0.8 + 0.3, 1) - 0.5) < 0.02) M.ao *= 0.5;
        const nx = -x / I.w * 0.5; K.shade(nx, 0.86, yy < 0.06 ? 0.4 : -0.1); K.put(S, px, py, a * clamp((Math.sqrt(q) - 0.02) * 14, 0, 1)); continue; }
      const yb = y - ef - th, depth = tipY - ef - th; if (yb < 0) continue; const tt = yb / depth, hw = I.w * Math.sqrt(q) * Math.pow(Math.max(0, 1 - tt), 0.85) * (0.82 + 0.36 * vn(yb * 2.2 + sd, x * 0.3)) - (vn(x * 4 + sd, yb * 4) - 0.5) * 0.25;   // the torn underside
      if (tt >= 1 || Math.abs(x) > Math.abs(hw) + 0.02) continue; a = clamp((Math.abs(hw) - Math.abs(x)) * P * 0.7 + 0.5, 0, 1) * clamp((1 - tt) * 12, 0, 1);
      const bl = vn(x * 2.6 + sd, yb * 3.2), bk = Math.abs(md(yb * 2.4 + bl * 0.6, 1) - 0.5) < 0.05, ear = ss(0.15, 0.6, tt), n = vn(x * 7 + sd, yb * 7);
      M.r = lerp(yg ? 0.72 : 0.58, 0.42, ear) * (0.85 + 0.3 * n); M.g = lerp(yg ? 0.66 : 0.52, 0.32, ear) * (0.85 + 0.3 * n); M.b = lerp(yg ? 0.6 : 0.5, 0.26, ear) * (0.85 + 0.3 * n); M.rg = 0.85; if (bk) M.ao *= 0.55;
      const nx = clamp(x / (Math.abs(hw) + 0.01), -1, 1) * 0.75 + (bl - 0.5) * 0.6; K.shade(nx, 0.5, -0.65); K.put(S, px, py, a); }
    // the columns (feet on the slab's top; the ruin's broken at their tops)
    const by = x => -tilt * 0 + 0.1 + tilt * x;
    for (const [cx, H] of I.cols) { const r0 = 0.3, fl = 20, broken = I.broken;
      const prof = h => r0 * (1 + 0.12 * ss(0.3, 0, h)) * (1 - 0.06 * h / Math.max(H, 1));
      K.rev(S, cx, by(cx), prof, 0, H, { mat: (u, h, ao) => { marble(u * 2, h); M.ao *= 0.86 + 0.14 * Math.cos(u / r0 * fl); }, top: true, capMat: () => { marble(cx * 3, H * 3, broken ? 0.8 : 1); if (broken) { M.rg = 0.9; M.cc = 0; } } });
      if (!broken) { K.rev(S, cx, by(cx), h => h < H + 0.12 ? r0 * 1.15 + (h - H) * 0.9 : r0 * 1.45, H, H + 0.34, { mat: (u, h) => gilt(K, u * 4, h * 6, sd + 4, 0.4), top: true, capMat: () => gilt(K, cx, H, sd + 5, 0.5) }); } }
    if (I.lintel) { const [a0, a1] = [I.cols[0][0], I.cols[1][0]], H = I.cols[0][1] + 0.34; K.rbox(S, (a0 + a1) / 2, 0.1, (a1 - a0) / 2 + 0.55, 0.36, H, H + 0.5, 0.06, (f, u, vv) => { marble(u * 2, vv * 2); if (f === 'f' && vv > H + 0.36) gilt(K, u * 5, vv * 5, sd + 6, 0.4); }); }
    if (I.drum) K.tube(S, [[I.drum[0] - 0.55, -0.32], [I.drum[0] + 0.45, -0.28]], 0.32, 0.32, (t, s2) => { marble(t * 2, s2 * 3); M.ao *= 0.86 + 0.14 * Math.cos(s2 * 9); });
    if (I.lying) K.tube(S, [[-2.0, -0.45], [0.6, -0.2]], 0.3, 0.28, (t, s2) => { marble(t * 4, s2 * 3, 0.95); M.ao *= 0.86 + 0.14 * Math.cos(s2 * 9); });
    if (I.ivy) { const R = R1(sd); for (let i = 0; i < 7; i++) { let x = (R() - 0.5) * I.w * 1.7, y = edgeY(x) + 0.04; const pts = [[x, y]], Ln = 0.9 + R() * 2.6, ph = R() * 6; for (let k = 1; k <= 14; k++) { y += Ln / 14; pts.push([x + Math.sin(k * 0.9 + ph) * 0.09, y]); }
        K.tube(S, pts, 0.032, 0.016, () => { M.r = 0.14; M.g = 0.24; M.b = 0.1; M.rg = 0.75; });
        for (let k = 1; k < pts.length; k++) { if (R() < 0.35) continue; const sx = k % 2 ? 1 : -1, g = 0.32 + R() * 0.14; K.ball(S, pts[k][0] + sx * (0.06 + R() * 0.05), pts[k][1] + (R() - 0.5) * 0.04, 0.065 * (1 - k / 20), 0.045 * (1 - k / 20), () => { M.r = 0.16 + R() * 0.06; M.g = g; M.b = 0.12; M.rg = 0.5; M.cc = 0.2; }); } } } }
  // the suns (P: a radius in px): v 0 the dawn's, white gold; 1 the ruin's old sun, a veiled rose disc banded by the haze
  function paintSun(K, S, v) { const c = S.c, P = S.P; c.save(); c.setTransform(1, 0, 0, 1, S.ax, S.ay);
    const halo = c.createRadialGradient(0, 0, P * 0.9, 0, 0, P * 1.6); halo.addColorStop(0, v ? 'rgba(230,170,160,.4)' : 'rgba(255,236,190,.55)'); halo.addColorStop(1, 'rgba(255,220,180,0)'); c.fillStyle = halo; c.fillRect(-P * 1.6, -P * 1.6, P * 3.2, P * 3.2);
    const g = c.createRadialGradient(-P * 0.1, -P * 0.12, 0, 0, 0, P); if (!v) { g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.6, '#FFF8E6'); g.addColorStop(0.9, '#FFE6B0'); g.addColorStop(1, 'rgba(255,220,160,0)'); }
    else { g.addColorStop(0, '#F2D0C0'); g.addColorStop(0.6, '#D8A498'); g.addColorStop(0.92, '#B07C80'); g.addColorStop(1, 'rgba(160,110,120,0)'); }
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, P, 0, TAU); c.fill();
    if (v) { c.save(); c.beginPath(); c.arc(0, 0, P * 0.995, 0, TAU); c.clip(); for (let i = 0; i < 6; i++) { const y = P * (-0.5 + i * 0.22), hgt = P * (0.04 + i * 0.012); c.fillStyle = `rgba(90,70,96,${0.12 + i * 0.04})`; c.beginPath(); c.ellipse(Math.sin(i * 2.3) * P * 0.12, y, P * 1.1, hgt, 0, 0, TAU); c.fill(); } c.restore(); }
    c.restore(); }
  /* ---- the Borrowed Stairs ---- */
  const voidStone = (K, u, w2, sd, k) => { const { M, vn } = K, n = vn(u * 4 + sd, w2 * 4), n2 = vn(u * 13, w2 * 13 + sd); M.r = (0.22 + 0.07 * n) * (k || 1); M.g = (0.17 + 0.06 * n) * (k || 1); M.b = (0.36 + 0.09 * n) * (k || 1); M.rg = 0.45 + 0.3 * n2; M.cc = 0.2; };
  const seam = (K, a) => { K.M.er += 0.55 * a; K.M.eg += 0.38 * a; K.M.eb += 1.0 * a; };
  // a flight of stairs hanging in the void (v 0 ten steps rising right to a landing; 1 seven steps, the last crumbling, its
  // pieces hanging under it; 2 a steep flight of twelve over a pillar): violet stone, each tread's nosing faintly lit, a seam
  // of light along its underside. (units: tiles; feet: the first step's foot at 0, 0)
  const FLIGHTS = [{ n: 10, run: 0.5, rise: 0.32, land: 1.4 }, { n: 7, run: 0.55, rise: 0.36, crumble: 2 }, { n: 12, run: 0.36, rise: 0.4, pillar: 1 }];
  function paintFlight(K, S, v) { const F = FLIGHTS[v % 3], sd = 81 + v * 11, { M } = K, P = S.P, end = F.n * F.run + (F.land || 0), th = 0.55;
    // the soffit under the flight: a sloped slab from the first step's foot to the landing's
    S.lock(); const slope = F.rise / F.run;
    for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P; if (x < -0.05 || x > end) continue; const xs = Math.min(x, F.n * F.run), ytop = -xs * slope + 0.02, ybot = ytop + th + (x > F.n * F.run ? 0 : 0); if (y < ytop - 0.6 || y > ybot) continue;
      const cut = F.crumble && x > (F.n - F.crumble) * F.run ? 1 : 0; if (cut) continue; const a = clamp((ybot - y) * P + 0.5, 0, 1) * clamp(x * P + 0.5, 0, 1) * clamp((end - x) * P + 0.5, 0, 1); if (y < ytop) continue;
      M0(K); voidStone(K, x, y, sd, 0.85); const eg = Math.exp(-(ybot - y) / 0.05); if (eg > 0.05) seam(K, eg * 0.8); K.shade(0, 0.62, -0.78); K.put(S, px, py, a); }
    for (let i = 0; i < F.n; i++) { if (F.crumble && i >= F.n - F.crumble) break; const cx = (i + 0.5) * F.run, z1 = (i + 1) * F.rise;
      K.rbox(S, cx, 0, F.run / 2 + 0.01, 0.6, Math.max(0, i * F.rise - 0.25), z1, 0.035, (f, u, w2) => { voidStone(K, u + i * 0.37, w2, sd); if (f === 'f' && w2 > z1 - 0.06) seam(K, 0.35); if (f === 't') { M.r *= 1.15; M.g *= 1.12; M.b *= 1.1; } }); }
    if (F.land) K.rbox(S, F.n * F.run + F.land / 2, 0, F.land / 2, 0.6, F.n * F.rise - 0.5, F.n * F.rise, 0.04, (f, u, w2) => { voidStone(K, u, w2, sd + 3); if (f === 'f' && w2 > F.n * F.rise - 0.06) seam(K, 0.4); });
    if (F.crumble) { const R = R1(sd); for (let k = 0; k < 5; k++) { const i = F.n - F.crumble + (k % F.crumble), cx = (i + 0.3 + R() * 0.5) * F.run, dz = 0.4 + R() * 1.4; K.rbox(S, cx, 0, 0.12 + R() * 0.12, 0.18, i * F.rise - dz - 0.2, i * F.rise - dz, 0.03, (f, u, w2) => voidStone(K, u, w2, sd + k)); } }
    if (F.pillar) { const cx = F.n * F.run * 0.62; K.rbox(S, cx, 0, 0.28, 0.28, -3.2, F.n * F.rise * 0.62 - 0.3, 0.05, (f, u, w2) => { voidStone(K, u, w2 * 0.5, sd + 9, 0.9); if (Math.abs(u) < 0.03) seam(K, 0.5); }); } }
  // a glass bridge (v 0 a straight span between two stair stubs; 1 a span broken off mid-air, shards hanging; 2 a glass arch):
  // a deck of pale glass, its edges bright, silver rails and posts, stone stubs at its ends. (units: tiles; feet: its middle)
  const BRIDGES = [{ L: 4.2, stubs: 2 }, { L: 4.0, stubs: 1, broken: 1 }, { L: 4.6, stubs: 2, arch: 1.1 }];
  function paintBridge(K, S, v) { const B = BRIDGES[v % 3], sd = 91 + v * 7, { M } = K, P = S.P, Kp = K.K, dp = 0.55, yAt = x => B.arch ? -B.arch * (1 - (x / B.L) ** 2) : 0, xEnd = B.broken ? B.L * 0.35 : B.L;
    for (const sx of B.stubs === 2 ? [-1, 1] : [-1]) K.rbox(S, sx * (B.L + 0.5), 0.2, 0.5, dp, -1.4, 0.12, 0.05, (f, u, w2) => { voidStone(K, u, w2, sd); if (f === 't') { M.r *= 1.2; M.g *= 1.15; M.b *= 1.1; } });
    S.lock();
    for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P; if (x < -B.L || x > xEnd) continue; const y0 = yAt(x) - dp * Kp * 2, y1 = yAt(x), y2 = y1 + 0.14; if (y < y0 - 0.02 || y > y2 + 0.02) continue;
      const top = y < y1, ed = top ? Math.min(y - y0, y1 - y) : Math.min(y - y1, y2 - y), rim = Math.exp(-Math.max(0, ed) / 0.025), endK = B.broken ? clamp((xEnd - x) * 3, 0, 1) : 1;
      M0(K); M.r = 0.62; M.g = 0.64; M.b = 0.9; M.rg = 0.08; M.cc = 1; M.mt = 0.2; M.fr = 0.7; M.fg = 0.72; M.fb = 0.95; if (rim > 0.2) { M.er = 0.5 * rim; M.eg = 0.48 * rim; M.eb = 0.8 * rim; }
      const fl = top ? 0.35 + 0.2 * Math.sin(x * 2.1 + y * 9) : 0.55; K.shade(0, top ? 0.3 : 0.95, top ? 0.95 : 0.1); K.put(S, px, py, clamp(fl + rim * 0.6, 0, 1) * endK * clamp((y - y0 + 0.02) * P, 0, 1) * clamp((y2 + 0.02 - y) * P, 0, 1)); }
    // the rails and their posts (silver), the back one fainter
    for (const [dy, al] of [[-dp * Kp * 2, 0.6], [0, 1]]) { const pts = []; for (let i = 0; i <= 16; i++) { const x = -B.L + (xEnd + B.L) * i / 16; pts.push([x, yAt(x) + dy - 0.7]); }
      K.tube(S, pts, 0.045, 0.045, (t, s2) => { M.mt = 1; M.fr = 0.78; M.fg = 0.8; M.fb = 0.9; M.rg = 0.18; }, { alpha: al });
      for (let x = -B.L + 0.4; x < xEnd - 0.1; x += 0.8) K.tube(S, [[x, yAt(x) + dy - 0.7], [x, yAt(x) + dy]], 0.03, 0.03, () => { M.mt = 1; M.fr = 0.7; M.fg = 0.72; M.fb = 0.85; M.rg = 0.22; }, { alpha: al }); }
    if (B.broken) { const R = R1(sd); S.lock(); for (let k = 0; k < 6; k++) { const cx = xEnd + 0.2 + R() * 1.6, cy = 0.3 + R() * 1.8, rr = 0.12 + R() * 0.22, ang = R() * 3;
        plate(K, S, (x, y) => { const dx = x - cx, dy = y - cy, ca = Math.cos(ang), sa = Math.sin(ang), u = dx * ca + dy * sa, w2 = -dx * sa + dy * ca; return Math.min(rr - Math.abs(u) - Math.abs(w2) * 0.6, rr * 0.5 - Math.abs(w2)); }, 0.02, () => { M.r = 0.6; M.g = 0.62; M.b = 0.9; M.cc = 1; M.rg = 0.08; M.er = 0.15; M.eg = 0.14; M.eb = 0.3; }, { box: [cx - rr - 0.1, cy - rr - 0.1, cx + rr + 0.1, cy + rr + 0.1], alpha: 0.7 }); } } }
  // a square door frame hanging in the void (v 0 upright; 1 a frame with a square window cut in its lintel; 2 a frame within a
  // frame): dark violet stone bevelled, its inner edge lit violet, gilt studs at its corners. (units: tiles; feet: its sill)
  function paintFrame(K, S, v) { const sd = 101 + v * 5, { M } = K, W2 = 1.0, H2 = 2.6, t = 0.26, W3 = 0.62, H3 = 1.6;
    const rect = (x, y, hw, y0, y1) => Math.min(hw - Math.abs(x), y - y0, y1 - y);
    const sdf = (x, y) => { let d = Math.min(rect(x, y, W2, -H2, 0), -rect(x, y, W2 - t, -H2 + t, 0.5)); if (v % 3 === 2) d = Math.max(d, Math.min(rect(x, y, W3, -H3 - 0.45, -0.45), -rect(x, y, W3 - 0.16, -H3 - 0.45 + 0.16, -0.45 - 0.16))); if (v % 3 === 1) d = Math.min(d, -rect(x, y, 0.18, -H2 + 0.05, -H2 + t - 0.05)); return d; };
    const inner = (x, y) => -rect(x, y, W2 - t, -H2 + t, 0.5);
    plate(K, S, sdf, 0.07, (x, y) => { voidStone(K, x * 1.3, y * 1.3, sd); const di = inner(x, y); if (di < 0.07 && di > -0.01) seam(K, Math.exp(-Math.max(0, di) / 0.03) * 0.9);
      const cx = Math.abs(x) - (W2 - t / 2), cy = Math.min(Math.abs(y + H2 - t / 2), Math.abs(y + t / 2)); if (Math.abs(cx) < 0.08 && cy < 0.08) { gilt(K, x * 6, y * 6, sd, 0.5); } }, { bump: (x, y) => { const cx = Math.abs(x) - (W2 - t / 2), cy = Math.min(Math.abs(y + H2 - t / 2), Math.abs(y + t / 2)); return Math.abs(cx) < 0.08 && cy < 0.08 ? [Math.sign(cx) * 0.4 * Math.sign(x), 0.3] : [0, 0]; } }); }
  const DEF = {
    dial: { kit: true, cap: 760, box: () => [-1.04, -1.04, 1.04, 1.04], paint: paintDial },
    gear: { kit: true, cap: 700, box: () => [-1.04, -1.04, 1.04, 1.04], paint: paintGear },
    pend: { kit: true, cap: 900, box: v => [-1.12, -0.4, 1.12, PENDL[v % 3] + 1.12], paint: paintPend },
    isle: { kit: true, cap: 720, box: v => [-ISLES[v % 4].w - 0.6, -6.0, ISLES[v % 4].w + 0.6, 4.2], paint: paintIsle, light: v => (ISLES[v % 4].young ? 'dawn' : 'ruin') },
    sun: { cap: 400, box: () => [-1.6, -1.6, 1.6, 1.6], paint: paintSun },
    flight: { kit: true, cap: 640, box: v => { const F = FLIGHTS[v % 3]; return [-0.6, -(F.n * F.rise + 0.8), F.n * F.run + (F.land || 0) + 0.4, F.pillar ? 3.6 : F.crumble ? 2.4 : 1.2]; }, paint: paintFlight },
    bridge: { kit: true, cap: 640, box: v => { const B = BRIDGES[v % 3]; return [-B.L - 1.1, -(B.arch || 0) - 1.2, B.L + 1.1, B.broken ? 2.4 : 1.6]; }, paint: paintBridge },
    frame: { kit: true, cap: 520, box: () => [-1.1, -2.7, 1.1, 0.12], paint: paintFrame } };
  // a plain painting surface (for the pieces painted without the kit)
  function surf(b, P) { const w = Math.ceil((b[2] - b[0]) * P), h = Math.ceil((b[3] - b[1]) * P), cv = mkc(w, h), c = cv.getContext('2d', { willReadFrequently: true }); const S = { cv, c, P, w, h, ax: -b[0] * P, ay: -b[1] * P, d: null, img: null };
    S.T = () => c.setTransform(P, 0, 0, P, S.ax, S.ay); S.lock = () => { if (S.img) return; c.setTransform(1, 0, 0, 1, 0, 0); S.img = c.getImageData(0, 0, w, h); S.d = S.img.data; }; S.unlock = () => { if (!S.img) return; c.setTransform(1, 0, 0, 1, 0, 0); c.putImageData(S.img, 0, 0); S.img = S.d = null; S.T(); }; S.T(); return S; }
  const CACHE = new Map();
  function paintPic(name, v, ln, P, haze) { const D = DEF[name]; if (!D) return null; const B = D.kit ? BP() : null; if (D.kit && !B) return null; const K = B ? B.kit : (BP() ? BP().kit : null), b = D.box(v), t0 = now(); let S = null;
    try { S = D.kit ? K.surface(b[0], b[1], b[2], b[3], P) : surf(b, P); if (D.kit) lit(K, ln, () => { D.paint(K, S, v, ln); S.unlock(); }); else { D.paint(K, S, v, ln); if (S.unlock) S.unlock(); } } catch (e) { if (typeof console !== 'undefined') console.warn('SEP_SKY', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = mkc(S.w, S.h), c = cv.getContext('2d'); c.drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;
    if (haze) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = haze; c.fillRect(0, 0, cv.width, cv.height); }
    STATS.painted++; STATS.paintMs += now() - t0; return { cv, ax: S.ax, ay: S.ay, P }; }
  // name|v|light|P; budget: a frame paints at most ~10 ms of them unless forced (the loading screen forces)
  let budT = 0, budMs = 0;
  function pic(name, v, ln, P, force) { const key = name + '|' + v + '|' + ln + '|' + P; let s = CACHE.get(key); if (s) return s; const pre = name + '|' + v + '|' + ln + '|';
    for (const [k2, s2] of CACHE) if (k2.startsWith(pre) && s2.P >= P && s2.P <= P * 6) return s2;   // (a sharper painting of it already kept serves a smaller drawing)
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 10) { for (const [k2, s2] of CACHE) if (k2.startsWith(pre)) return s2; STATS.misses++; return null; }
    const t1 = now(); s = paintPic(name, v, ln, P); budMs += now() - t1; if (s) { if (CACHE.size > 60) release(true);
      for (const [k2, s2] of [...CACHE]) if (k2.startsWith(pre) && s2.P < P) { s2.cv.width = s2.cv.height = 1; CACHE.delete(k2); }   // (a smaller painting of it given back: the new one serves it)
      CACHE.set(key, s); } return s; }
  const LADDER = [16, 28, 48, 80, 140, 240];
  function picP(name, v, T, k, s) { const b = DEF[name].box(v), ext = Math.max(b[2] - b[0], b[3] - b[1]), want = T * Math.min(1.5, k) * s * 0.92, cap = Math.floor((DEF[name].cap || 600) / ext); let P = LADDER.find(q => q >= want) || LADDER[LADDER.length - 1]; return Math.max(6, Math.min(P, cap)); }
  const lightOf = (name, v, V) => (DEF[name].light ? DEF[name].light(v) : V.light);
  function drawPic(c, V, name, v, x, y, s, o) { o = o || {}; const T = V.T, P = picP(name, v, T, V.k, s), sp = pic(name, v, lightOf(name, v, V), P, o.force); if (!sp) return false;
    const f = T * s / sp.P; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; c.translate(x, y); if (o.rot) c.rotate(o.rot); if (o.flip) c.scale(-1, 1); c.drawImage(sp.cv, -sp.ax * f, -sp.ay * f, sp.cv.width * f, sp.cv.height * f); c.restore(); STATS.pics++; return true; }

  /* ======================= the view ======================= */
  /* V: { W, H, T, sx(x), sy(y) (world tiles -> screen px), t (seconds), land, light, hy, top, span, k (device px per css px) } */
  // where a thing over the land stands: a set height (spec.t, tiles) over the top of the stage's land, so it is seen from its
  // upper edge whatever its size; with no stage to go by, on the sky's own scale (spec.a)
  const skyY = (V, spec) => V.sy(V.top != null && spec.t != null ? Math.min(V.top + spec.t, V.hy + ((spec.a != null ? spec.a : -0.8) - 0.1) * V.span * 0.5) : V.hy + (spec.a != null ? spec.a : -0.8) * V.span);
  let LIVE = null;
  function view(X, land) { const L = LIVE; const T = X.Tz(), ln = land || (L && L.land) || 'sepulchre'; return { W: X.W(), H: X.H(), T, sx: X.sx, sy: X.sy, t: X.g ? X.g.t : now() / 1000, land: ln, light: LANDS[ln].light, hy: L ? L.hy : X.me.y, top: L ? L.top : null, span: L ? L.span : 18, k: 1 }; }
  const gpuF = () => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__SSKY_GL === 0)) return null; const F = HAS_W && window.NIDHOGG_MOVES && window.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  // the copies of a thing repeated every `per` tiles that can be on the screen (its reach r tiles about its place)
  function each(V, per, fx, r, f) { const camX = (V.W / 2 - V.sx(0)) / V.T, lo = camX - V.W / 2 / V.T - r, hi = camX + V.W / 2 / V.T + r;
    for (let n = Math.floor((lo - fx * per) / per); n <= Math.ceil((hi - fx * per) / per); n++) { const xw = fx * per + n * per; if (xw < lo || xw > hi) continue; f(xw, n); } }
  // the pendulum's angle: stopped mid-swing, straining against the stopped time (a slow shiver about where it stopped)
  const pendA = (p, t) => p.sw + 0.012 * Math.sin(t * 0.9 + p.ph) + 0.005 * Math.sin(t * 2.3 + p.ph * 3);
  function vista(c, V, o) { o = o || {}; const L = LANDS[V.land]; if (!L) return;
    if (o.rn > 0) { const n = o.rn, R = o.rects || SRC; c.save(); try { c.beginPath(); for (let i = 0; i < n * 4; i += 4) c.rect(R[i], R[i + 1], R[i + 2] - R[i], R[i + 3] - R[i + 1]); c.clip(); vistaIn(c, V, o, L); } finally { c.restore(); } return; }
    vistaIn(c, V, o, L); }
  // a picture laid at (x, y, w, h) with only its part on the screen copied (the strips are periods wide: most lies off the screen)
  function blitPart(c, cv, x, y, w, h, W, H) { const a0 = Math.max(0, -x / w), a1 = Math.min(1, (W - x) / w), b0 = Math.max(0, -y / h), b1 = Math.min(1, (H - y) / h); if (a1 <= a0 || b1 <= b0) return;
    c.drawImage(cv, a0 * cv.width, b0 * cv.height, (a1 - a0) * cv.width, (b1 - b0) * cv.height, x + a0 * w, y + b0 * h, (a1 - a0) * w, (b1 - b0) * h); }
  /* the GPU's rectangles: each is a pass and a copy of its own, so the bounding box (one copy) unless the rectangles leave
     out more than 40% of it (then at most 4 of them) */
  const GRC = [];
  function coarse(R, n) { GRC.length = 0; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, a = 0; for (let i = 0; i < n * 4; i += 4) { x0 = Math.min(x0, R[i]); y0 = Math.min(y0, R[i + 1]); x1 = Math.max(x1, R[i + 2]); y1 = Math.max(y1, R[i + 3]); a += (R[i + 2] - R[i]) * (R[i + 3] - R[i + 1]); }
    if (n <= 4 && a < (x1 - x0) * (y1 - y0) * 0.6) { for (let i = 0; i < n * 4; i++) GRC.push(R[i]); return n; } GRC.push(x0, y0, x1, y1); return 1; }
  function vistaIn(c, V, o, L) { const W = V.W, H = V.H, T = V.T, ya = a => V.sy(V.hy + a * V.span), yo = dy => V.sy(V.hy + dy), lf = lowFx(); STATS.frames++;
    const camY = V.hy + (H / 2 - V.sy(V.hy)) / T, top = camY - H / 2 / T, bot = camY + H / 2 / T;   // (the rows of the world on the screen)
    // the sky's column (and the ruin's, laid over it through its mask, period by period)
    const col = column(V.land), y0 = ya(A0), y1 = ya(A1); c.save(); c.imageSmoothingEnabled = true;
    if (y0 > 0) { c.fillStyle = L.sky[0][1]; c.fillRect(0, 0, W, Math.min(H, y0 + 1)); } if (y1 < H) { c.fillStyle = L.sky[L.sky.length - 1][1]; c.fillRect(0, Math.max(0, y1 - 1), W, H - y1 + 1); }
    let r0 = 0, r1 = 1, s0 = 0, s1 = 0; if (y1 > 0 && y0 < H) { r0 = clamp((0 - y0) / (y1 - y0), 0, 1); r1 = clamp((H - y0) / (y1 - y0), 0, 1); s0 = r0 * NCOL; s1 = r1 * NCOL; if (s1 - s0 > 0.5) c.drawImage(col, 0, s0, 2, s1 - s0, -2, y0 + r0 * (y1 - y0), W + 4, (r1 - r0) * (y1 - y0)); }
    if (L.two) { const rs = ruinSky(V.land), wp = L.per * T; if (y0 > 0 || y1 < H) { each(V, L.per, 0.75, L.per * 0.5, xw => { const X = V.sx(xw - L.per * 0.25), Wd = L.per * 0.5 * T; c.save(); c.globalAlpha = 1; if (y0 > 0) { c.fillStyle = L.sky2[0][1]; c.fillRect(X, 0, Wd, Math.min(H, y0 + 1)); } if (y1 < H) { c.fillStyle = L.sky2[L.sky2.length - 1][1]; c.fillRect(X, Math.max(0, y1 - 1), Wd, H - y1 + 1); } c.restore(); }); }
      if (s1 - s0 > 0.5) { let x = md(V.sx(0), wp) - wp; for (; x < W; x += wp) if (x + wp > 0) { const a0 = Math.max(0, -x / wp), a1 = Math.min(1, (W - x) / wp); if (a1 > a0) c.drawImage(rs, a0 * rs.width, s0, (a1 - a0) * rs.width, s1 - s0, x + a0 * wp, y0 + r0 * (y1 - y0), (a1 - a0) * wp + 0.6, (r1 - r0) * (y1 - y0)); } } }
    c.restore();
    // the far lights of the void (anchored to the stage)
    if (L.stars) { const yb = ya(0.15); if (yb > 0) { const sp = starTile(V.k), m = new DOMMatrix([sp.S / sp.N, 0, 0, sp.S / sp.N, md(V.sx(0), sp.S), md(V.sy(0), sp.S)]); try { sp.pat.setTransform(m); } catch (e) {} c.save(); c.fillStyle = sp.pat; c.globalAlpha = 0.85; c.fillRect(0, 0, W, Math.min(H, yb)); c.restore(); } }
    // the suns (two ages), low over the clouds
    if (L.suns) for (const sn of L.suns) each(V, L.per, sn.fx, sn.r * 4, xw => { const X = V.sx(xw), Y = skyY(V, sn), R = sn.r * T; if (Y < -R * 4 || Y > H + R * 4) return; if (typeof blitSized === 'function' && typeof glowSprite === 'function') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = sn.v ? 0.3 : 0.45; blitSized(c, glowSprite(sn.v ? '#C88C90' : '#FFD8A0'), X - R * 6, Y - R * 6, R * 12, R * 12); c.restore(); } drawPic(c, V, 'sun', sn.v, X, Y, sn.r); });
    // what hangs over the land: the great dials, the pendulums, the floating pieces
    if (L.hang) for (const it of L.hang) { const reach = (it.kind === 'pend' ? PENDL[it.v % 3] + 1.2 : 6) * it.s; each(V, L.per, it.fx, reach + 2, xw => { const Y = skyY(V, it); if (it.kind === 'pend' ? (Y > H || Y + reach * T < 0) : (Y + reach * T < 0 || Y - reach * T > H)) return;
      if (it.kind === 'pend') drawPic(c, V, 'pend', it.v, V.sx(xw), Y, it.s, { rot: pendA(it, V.t), alpha: it.a });
      else drawPic(c, V, it.kind, it.v, V.sx(xw), Y, it.s, { alpha: it.a, rot: it.rot, flip: it.flip }); }); }
    // the ranges and what stands among them, back to front
    const ZS = L._z || (L._z = [...L.strips.map((s, i) => ({ z: s.z, strip: i })), ...L.items.map(it => ({ z: it.z, it }))].sort((p, q) => p.z - q.z));
    for (const e of ZS) { if (e.strip != null) { const sp = L.strips[e.strip], Yt = yo(sp.y), Hp = sp.h * T; if (Yt > H || Yt + Hp < 0) continue; const P = stripP(sp, T, V.k), s = strip(V.land, e.strip, P), wp = sp.per * T;
        let x = V.sx(sp.phase || 0); x = md(x, wp) - wp; for (; x < W; x += wp) if (x + wp > 0) blitPart(c, s.cv, x, Yt, wp + 0.6, Hp, W, H); continue; }
      const it = e.it, Y = yo(it.y), ext = it.kind === 'isle' ? 6 : it.kind === 'flight' || it.kind === 'bridge' ? 7 : 1.2; if (Y < -T * ext * it.s * 1.2 || Y > H + T * ext * it.s) continue;
      each(V, L.per, it.fx, ext * it.s + 1, xw => drawPic(c, V, it.kind, it.v, V.sx(xw), Y, it.s, { alpha: (it.a == null ? 1 : it.a) * (it.haze ? 1 - it.haze * 0.7 : 1), flip: it.flip, rot: it.rot })); }   /* (aerial perspective: the far ones let the hazy horizon through) */
    // the light (the GPU, one pass over everything: two copies, its veils and its light): the coronas, the far radiance, the
    // shafts, the currents; veils of mist, the dials' light, the borrowed hours, glints, the dust
    const F = o.gpu === false ? null : gpuF(); if (F) { try { const Q = F.begin(c, null); if (o.rn > 0 && Q.clipTo) { const g = coarse(o.grects || o.rects || SRC, o.gn > 0 ? o.gn : o.rn); Q.clipTo(GRC, g); } skyLight(Q, V, L, lf, top, bot); airLight(Q, V, L, lf, top, bot); if (Q.nl || Q.ns) { STATS.quads += (Q.nl + Q.ns) / 6; F.flush(c); } } catch (e) {} }
  }

  /* ---- the GPU's light: the sky's (under what hangs and stands) ---- */
  function skyLight(Q, V, L, lf, top, bot) { const T = V.T, W = V.W, H = V.H, t = V.t, yo = dy => V.sy(V.hy + dy);
    // the far radiance along the horizon (the Halls: gold through the galleries; the void: a violet line)
    if (L.radiance || L.stars) { const Y = yo(0); if (Y > -T * 8 && Y < H + T * 8) { const col = L.radiance || '#7A5AD0'; each(V, L.per, 0.5, L.per * 0.5, xw => { Q.glow(V.sx(xw), Y, L.per * 0.5 * T, col, L.radiance ? 0.22 : 0.16, 0.08); }); each(V, L.per, 0.15, 14, xw => Q.glow(V.sx(xw), Y, T * 12, col, 0.12, 0.25)); } }
    if (L.suns) for (const sn of L.suns) each(V, L.per, sn.fx, 30, xw => { const X = V.sx(xw), Y = skyY(V, sn), R = sn.r * T; if (Y < -R * 12 || Y > H + R * 12) return;
      Q.quad(241, X, Y, R * (sn.v ? 3.6 : 4.6), 0, 0, R * (sn.v ? 3.6 : 4.6), sn.v ? '#E0A8A0' : '#FFE6B8', sn.v ? 0.22 : 0.3, sn.v ? 0.3 : 0.6, sn.v ? 0.15 : 0.5, lf ? 0.25 : 0.05);
      if (!sn.v) { Q.glow(X, Y + R, R * 8, '#FFB070', 0.08, 0.35); if (!lf) for (let i = 0; i < 3; i++) { const an = Math.PI / 2 + (i - 1) * 0.42 + 0.05 * Math.sin(t * 0.07 + i), Ln = R * (9 + i * 2), ux = Math.cos(an), uy = Math.sin(an);   // (rays falling from the dawn sun)
          Q.quad(408, X + ux * Ln * 0.55, Y + uy * Ln * 0.55, -uy * R * 3.2, ux * R * 3.2, ux * Ln * 0.55, uy * Ln * 0.55, '#FFE8C0', 0.16, 0.3 + i * 0.21, 0.5, 0); } } });
    if (L.shafts && !lf) for (const sh of L.shafts) each(V, L.per, sh.fx, sh.w + 4, xw => { const Y0 = skyY(V, sh), X = V.sx(xw); if (Y0 > H || Y0 + sh.h * T < 0) return;
      Q.quad(408, X - sh.h * 0.18 * T, Y0 + sh.h * T / 2, sh.w * T / 2, 0, sh.h * 0.18 * T, sh.h * T / 2, '#FFE2A8', sh.a, sh.fx * 7 % 1 + 0.1, 0.6, 0); });
    if (L.currents && !lf) for (const cu of L.currents) { const yw = cu.a2 != null ? V.hy + cu.a2 * V.span : V.hy + cu.y; if (yw + cu.h < top - 2 || yw - cu.h > bot + 2) continue; const Y = V.sy(yw);
      each(V, L.per, cu.fx, cu.w * 0.6, xw => Q.quad(410, V.sx(xw), Y, cu.w * T / 2, 0, 0, cu.h * T / 2, cu.col, 0.55, cu.fx * 5 % 1 + 0.07, cu.rose, 0.6)); } }
  /* ---- the GPU's light: the air (over what stands) ---- */
  function airLight(Q, V, L, lf, top, bot) { const T = V.T, W = V.W, H = V.H, t = V.t, camX = (W / 2 - V.sx(0)) / T, yo = dy => V.sy(V.hy + dy);
    const vs = lf ? L.veils.slice(0, 2) : L.veils; vs.forEach((vl, i) => { const yw = vl.a2 != null ? V.hy + vl.a2 * V.span : V.hy + vl.y; if (yw + vl.h < top - 1 || yw - vl.h > bot + 1) return; const Y = V.sy(yw);
      for (let j = 0; j < 3; j++) each(V, L.per, (i * 0.31 + j / 3) % 1, vl.w * 0.6, xw => { const X = V.sx(xw + Math.sin(t * 0.05 + i + j) * 2); Q.quad(244, X, Y + (j - 1) * T * vl.h * 0.18, vl.w * T / 2, 0, 0, vl.h * T / 2, vl.col, vl.a, vl.spd * (j % 2 ? 1 : 0.8), (i * 3 + j) * 0.137 + 0.05, 0.9); }); });
    // the dials' light: a glint going round each bezel, the ticks glimmering, the stopped hand's faint violet (409, mode 0)
    const dialLight = (X, Y, R, v, al) => { if (X < -R || X > W + R || Y < -R || Y > H + R) return; const D = DIALS[v % 3]; Q.quad(409, X, Y, R, 0, 0, R, '#FFD890', al, (v * 0.37 + 0.11) % 1, D.h[2], 0.5); };
    if (L.hang) for (const it of L.hang) { if (it.kind === 'dial') each(V, L.per, it.fx, it.s * 2, xw => dialLight(V.sx(xw), skyY(V, it), it.s * T, it.v, 0.8 * (it.a == null ? 1 : it.a)));
      else if (it.kind === 'pend') each(V, L.per, it.fx, PENDL[it.v % 3] + 2, xw => { const a = pendA(it, t), Ln = PENDL[it.v % 3] * it.s * T, X = V.sx(xw) - Math.sin(a) * Ln, Y = skyY(V, it) + Math.cos(a) * Ln; if (X < -T * 3 || X > W + T * 3 || Y < -T * 3 || Y > H + T * 3) return; const gl = 0.5 + 0.5 * Math.sin(t * 0.6 + it.ph * 2);
        Q.glow(X, Y, T * 1.8 * it.s, '#FFC870', 0.12); if (!lf) Q.star(X - T * 0.35 * it.s, Y - T * 0.4 * it.s, T * 0.6 * it.s, 0.25 + 0.35 * gl, '#FFF0C8'); }); }
    for (const it of L.items) if (it.kind === 'dial' && it.ring) { const Y = yo(it.y); if (Y < -T * it.s || Y > H + T * it.s) continue; each(V, L.per, it.fx, it.s * 2, xw => dialLight(V.sx(xw), Y, it.s * T, it.v, 0.7 * (it.a == null ? 1 : it.a) * (it.haze ? 1 - it.haze * 0.7 : 1))); }
    // glass sheens running along the bridges (411), the young stone's gilt glinting (two ages)
    if (!lf) for (const list of [L.items, L.hang || []]) for (const it of list) { if (it.kind !== 'bridge' || (it.v % 3) === 2) continue; const B = BRIDGES[it.v % 3], hz = it.haze ? 1 - it.haze * 0.7 : 1;
      each(V, L.per, it.fx, B.L * it.s * 2, xw => { const Y = it.t != null ? skyY(V, it) : yo(it.y), X = V.sx(xw), Ln = B.L * it.s * T, x1 = B.broken ? B.L * 0.35 * it.s * T : Ln; if (Y < -T * 3 || Y > H + T * 3 || X + x1 < 0 || X - Ln > W) return;
        Q.quad(411, X + (x1 - Ln) / 2, Y - 0.2 * it.s * T, (x1 + Ln) / 2, 0, 0, 0.32 * it.s * T, '#E8E0FF', 0.7 * hz, (it.fx * 9) % 1, 0.5, 0); }); }
    if (L.two && !lf) for (const list of [L.items, L.hang || []]) for (const it of list) { if (it.kind !== 'isle' || !ISLES[it.v % 4].young) continue; each(V, L.per, it.fx, 5 * it.s, xw => { const Y = it.t != null ? skyY(V, it) : yo(it.y), X = V.sx(xw); if (Y < -T * 6 * it.s || Y > H + T * 4 * it.s || X < -T * 4 * it.s || X > W + T * 4 * it.s) return; const I = ISLES[it.v % 4];
      for (let k = 0; k < 3; k++) { const gx = (hh(k, it.v, 31) - 0.5) * I.w * 1.6, tw = Math.pow(0.5 + 0.5 * Math.sin(t * (0.7 + k * 0.3) + it.fx * 20 + k * 2), 6); if (tw < 0.05) continue; Q.star(X + gx * it.s * T, Y + I.dep * K_ISO * it.s * T * 0.9, T * 0.5 * it.s, tw * 0.6 * (it.haze ? 1 - it.haze * 0.7 : 1), '#FFF2C8'); } }); }
    // borrowed hours: little clock faces of light drifting through the void, each hand turning at its own pace (409, mode 1)
    if (L.hours) { const C = 7, gx0 = Math.floor((camX - W / 2 / T) / C) - 1, gx1 = Math.ceil((camX + W / 2 / T) / C) + 1, n = lf ? 1 : 2;
      for (let gy = Math.floor(top / C) - 1; gy <= Math.ceil(bot / C) + 1; gy++) for (let gx = gx0; gx <= gx1; gx++) for (let j = 0; j < n; j++) { if (hh(gx, gy, 201 + j) > 0.55) continue; const ph = hh(gx, gy, 202 + j), u = md(t * 0.012 * (0.6 + ph) + ph, 1);
        const xw = (gx + hh(gx, gy, 203 + j)) * C + Math.sin(t * 0.07 + ph * 9) * 1.4, yw = (gy + hh(gx, gy, 204 + j)) * C - (u - 0.5) * C * 1.6, X = V.sx(xw), Y = V.sy(yw); if (X < -40 || X > W + 40 || Y < -40 || Y > H + 40) continue;
        const sz = T * (0.32 + 0.4 * hh(gx, gy, 205 + j)), a = Math.sin(u * Math.PI) * (0.55 + 0.25 * Math.sin(t * 1.3 + ph * 7));
        Q.glow(X, Y, sz * 3.2, '#9A7AF0', a * 0.22); Q.quad(409, X, Y, sz, 0, 0, sz, L.hours, a * 0.9, ph, 0, 1.5); } }
    // the dust: motes drifting on the air, anchored to cells of the world (the ruin's are ash, slower and greyer)
    const C = 5, gx0 = Math.floor((camX - W / 2 / T) / C) - 1, gx1 = Math.ceil((camX + W / 2 / T) / C) + 1, gy0 = Math.floor(top / C) - 1, gy1 = Math.ceil(bot / C) + 1;
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) { const n = lf ? 1 : 2; for (let j = 0; j < n; j++) { if (hh(gx, gy, 91 + j) > 0.62) continue; const ph = hh(gx, gy, 92 + j), sp = 0.6 + ph, u = md(t * 0.03 * sp + ph, 1), xw = (gx + hh(gx, gy, 93 + j)) * C + (u - 0.5) * C * 1.6, yw = (gy + hh(gx, gy, 94 + j)) * C + Math.sin(t * 0.5 + ph * 9) * 0.5 - (L.two ? 0 : (u - 0.5) * 1.2);
      const X = V.sx(xw), Y = V.sy(yw); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue; const ru = L.two ? ruinU(md(xw / L.per, 1)) : 0, a = Math.sin(u * Math.PI) * (0.4 + 0.3 * Math.sin(t * 2 + ph * 7)) * (1 - ru * 0.35);
      Q.glow(X, Y, T * (0.12 + ru * 0.05), ru > 0.5 ? L.ash : L.motes, a * 0.6); if (ru < 0.5) Q.glow(X, Y, T * 0.035, '#FFFFFF', a * 0.7); } } }
  const K_ISO = 0.34;   // (the kit's floor ellipse ratio, for where the young stone's gilt edge lies)

  /* ======================= the backdrop past the land (GAP_EXT) ======================= */
  if (HAS_W) window.GAP_EXT = window.GAP_EXT || {};
  const GAPX = HAS_W ? window.GAP_EXT : {};
  for (const [gap, land] of Object.entries(LAND_OF)) { const L = LANDS[land], base = L.sky[Math.max(0, L.sky.findIndex(q => q[0] >= 0) + 2)][1];
    GAPX[gap] = { base,
      paint(c, S, R) { c.fillStyle = base; c.fillRect(0, 0, S, S); for (let i = 0; i < 24; i++) { c.fillStyle = land === 'twoages' ? `rgba(255,255,255,${0.1 + R() * 0.2})` : `rgba(255,226,180,${0.1 + R() * 0.35})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.1 ? 1.2 : 0.6, 0, TAU); c.fill(); } },
      back(c, o) { let V = null; const Lv = LIVE;
        if (Lv && Lv.X && !Lv.fiend && Lv.land === land) { try { V = view(Lv.X, land); V.W = o.W; V.H = o.H; V.k = o.k || 1; V.t = o.t; } catch (e) { V = null; } }
        if (!V) { const T = Math.max(24, Math.min(o.W, o.H) / 10), cx = o.wx / T, cy = o.wy / T; V = { W: o.W, H: o.H, T, sx: x => (x - cx) * T + o.W / 2, sy: y => (y - cy) * T + o.H / 2, t: o.t, land, light: L.light, hy: cy + 2, span: 18, k: o.k || 1 }; }
        const RS = Lv && Lv.X && !Lv.fiend ? seenRects(Lv.X, o.W, o.H) : 0;
        try { vista(c, V, { gpu: !!(Lv && Lv.X), rn: RS }); } catch (e) { c.fillStyle = base; c.fillRect(0, 0, o.W, o.H); } } }; }
  /* where the far view will be seen: the land's chunks are laid over it everywhere but its gaps, the walls past the land's edge
     (the Halls' are solid) and past the map's edge. Those tiles on the screen, one tile more all round, as rectangles (runs of
     tiles along each row, rows with the same runs joined): the view's GPU passes are shaded and laid only inside them and its
     pictures clipped to them (as v434 PO). Up to 40 rectangles (else the whole box) */
  const SRC = [], SRP = [], SRQ = [];
  function seenRects(X, W, H) { const M = X.M; if (!M || !M.G || !(W > 0) || !(H > 0)) return 0; const G = M.G, MW = M.MW, MH = M.MH, T = X.Tz(), ox = X.sx(0), oy = X.sy(0); if (!(T > 0)) return 0;
    const TF = typeof T_FLOOR !== 'undefined' ? T_FLOOR : 1, TM = typeof T_MUD !== 'undefined' ? T_MUD : 3, TI = typeof T_ICE !== 'undefined' ? T_ICE : 4, TG = typeof T_GAP !== 'undefined' ? T_GAP : 2, TB = typeof T_BRIDGE !== 'undefined' ? T_BRIDGE : 5;
    const open = (x, y) => { if (x < 0 || y < 0 || x >= MW || y >= MH) return true; const g = G[y * MW + x]; return g === TG || g === TB; };   // (glass bridges let the view through)
    const tx0 = Math.floor(-ox / T) - 1, tx1 = Math.floor((W - ox) / T) + 1, ty0 = Math.floor(-oy / T) - 1, ty1 = Math.floor((H - oy) / T) + 1;
    const seen = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (open(x + i, y + j)) return true; return false; };
    SRC.length = 0; SRP.length = 0; let n = 0, rowStart = 0; void TF; void TM; void TI;
    for (let ty = ty0; ty <= ty1; ty++) { SRQ.length = 0; let s = null; for (let tx = tx0; tx <= tx1 + 1; tx++) { const v = tx <= tx1 && seen(tx, ty); if (v && s === null) s = tx; else if (!v && s !== null) { SRQ.push(s, tx); s = null; } }
      const same = SRQ.length === SRP.length && SRQ.every((q, i) => q === SRP[i]);
      if (!same) { for (let i = 0; i < SRP.length; i += 2) { SRC.push(SRP[i], rowStart, SRP[i + 1], ty); n++; } SRP.length = 0; for (const q of SRQ) SRP.push(q); rowStart = ty; }
      if (n > 40) return 0; }
    for (let i = 0; i < SRP.length; i += 2) { SRC.push(SRP[i], rowStart, SRP[i + 1], ty1 + 1); n++; } if (n > 40) return 0;
    let k = 0; for (let i = 0; i < n * 4; i += 4) { const x0 = Math.max(0, SRC[i] * T + ox), y0 = Math.max(0, SRC[i + 1] * T + oy), x1 = Math.min(W, SRC[i + 2] * T + ox), y1 = Math.min(H, SRC[i + 3] * T + oy); if (x1 > x0 && y1 > y0) { SRC[k] = x0; SRC[k + 1] = y0; SRC[k + 2] = x1; SRC[k + 3] = y1; k += 4; } }
    SRC.length = k; let a = 0; for (let i = 0; i < k; i += 4) a += (SRC[i + 2] - SRC[i]) * (SRC[i + 3] - SRC[i + 1]); STATS.seenN = k / 4; STATS.seenA = +(a / (W * H)).toFixed(3);
    return a > W * H * 0.85 ? 0 : k / 4; }
  const OLDB = {};
  function install() { if (typeof BIOMES === 'undefined') return; for (const [gap, land] of Object.entries(LAND_OF)) { const B = BIOMES[land]; if (!B || B.__ssky) continue; B.__ssky = 1; const old = B.gap; OLDB[land] = { gap: old };
    try { Object.defineProperty(B, 'gap', { configurable: true, enumerable: true, get: () => (off() ? old : gap), set: () => {} }); } catch (e) { B.gap = gap; } } }
  install();

  /* ======================= the stage: its horizon ======================= */
  function stageOf(X) { const M = X.M, F = X.F || {}, land = LANDS[F.biome] ? F.biome : 'sepulchre', TG = typeof T_GAP !== 'undefined' ? T_GAP : 2, TS = typeof T_SOLID !== 'undefined' ? T_SOLID : 0;
    if (F.fiend && M && M.FC) { const C = M.FC; return { X, land, fiend: true, C, hy: C.y - 1, span: C.R + 6, top: C.y - C.R - 1.5 }; }
    let y0 = 1e9, y1 = -1e9; if (M && M.G) { const G = M.G, MW = M.MW, MH = M.MH; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const g = G[y * MW + x]; if (g !== TG && g !== TS) { if (y < y0) y0 = y; if (y > y1) y1 = y; } } }
    if (!(y1 >= y0)) { y0 = X.me.y - 8; y1 = X.me.y + 8; } return { X, land, fiend: false, top: y0, hy: (y0 + y1) / 2 + 0.5, span: Math.max(13, (y1 - y0) / 2 + 7) }; }
  function hookRift() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.sepulchre; if (!Rf || Rf.__ssky) return; Rf.__ssky = 1;
    const oe = Rf.everyStage; Rf.everyStage = function (X) { let a = {}; try { a = oe ? oe.apply(this, arguments) || {} : {}; } catch (e) { a = {}; } try { const Lv = stageOf(X); if (!(Lv.fiend && LIVE && LIVE.fiend && LIVE.fd)) LIVE = Lv; else Object.assign(LIVE, { X, hy: Lv.hy, span: Lv.span, top: Lv.top, C: Lv.C }); hookArena(); } catch (e) { LIVE = null; } return a; };
    const op = Rf.preload; Rf.preload = function (P) { let a = []; try { a = op ? op.apply(this, arguments) || [] : []; } catch (e) {} let b = []; try { hookArena(); b = warm(P); } catch (e) {} return a.concat(b); }; } catch (e) {} }
  hookRift();

  /* ======================= the arenas: the live view under the fight's own ground ======================= */
  /* The fight lays its sky (a backdrop painted once, small) and then its ground (a picture of the arena painted once). Here the
     live view is laid first, under both: the cached sky is left transparent (the def's sky wrapped while the fight is drawn) and
     the ground's own picture lies over the view, its soft edges falling into it. The view is laid only where the ground does
     not cover: the ground's picture is read once each time it is painted (a 48 x 48 copy, its opaque cells), its covered rows
     gathered into up to 14 bands, and the screen outside them given as rectangles (the 2D pieces clipped, the GPU shaded
     only there). Around it, anchored dressing beyond the rim (DRESS): stopped dials and gears beyond the court; floating
     fragments round the gallery; stair stubs and frames hung under the sanctuary's slab */
  const MINE = { threnn: 'sepulchre', vaul: 'twoages', khyros: 'borrowed' };
  const DRESS = {
    threnn: [{ kind: 'gear', v: 0, dx: -9, dy: -17.5, s: 2.8 }, { kind: 'dial', v: 1, dx: 4, dy: -18.5, s: 3.2 }, { kind: 'gear', v: 1, dx: 12, dy: -16, s: 1.8, rot: 0.2 }, { kind: 'gear', v: 2, dx: -15, dy: 15.8, s: 3.4 }, { kind: 'dial', v: 2, dx: 9, dy: 17, s: 2.6 }],
    vaul: [{ kind: 'isle', v: 2, dx: -12, dy: -15, s: 0.9 }, { kind: 'isle', v: 0, dx: 9, dy: -16.5, s: 1.0 }, { kind: 'isle', v: 3, dx: -6, dy: 19, s: 1.2 }, { kind: 'isle', v: 1, dx: 13, dy: 18.5, s: 1.1 }],
    khyros: [{ kind: 'frame', v: 2, dx: -9, dy: -13.5, s: 1.3, rot: -0.1 }, { kind: 'flight', v: 1, dx: 6, dy: -14.5, s: 1.1 }, { kind: 'flight', v: 0, dx: -14, dy: 17.5, s: 1.3, flip: 1 }, { kind: 'bridge', v: 1, dx: 8, dy: 18, s: 1.2 }] };
  // the ground's footprint: covered bands [y0, y1, x0, x1] in world tiles about the arena's centre (conservative)
  let FPC = null;
  function footprint(S, R) { const cv = S && S.arenaCv; if (!cv || !(cv.width > 8)) return null; if (FPC && FPC.cv === cv && FPC.w === cv.width) return FPC.bands;
    const N = 48, m = mkc(N, N), mc = m.getContext('2d', { willReadFrequently: true }); let bands = null;
    try { mc.drawImage(cv, 0, 0, N, N); const d = mc.getImageData(0, 0, N, N).data, half = R + 1.5, cell = half * 2 / N, rows = [];
      for (let y = 0; y < N; y++) { let x0 = -1, x1 = -1, best = 0; for (let x = 0; x < N;) { if (d[(y * N + x) * 4 + 3] >= 250) { let e = x; while (e < N && d[(y * N + e) * 4 + 3] >= 250) e++; if (e - x > best) { best = e - x; x0 = x; x1 = e; } x = e; } else x++; }
        rows.push(best >= 3 ? [x0 + 1, x1 - 1] : null); }
      bands = []; const NB = 14; for (let b = 0; b < NB; b++) { const ya = Math.floor(b * N / NB), yb = Math.floor((b + 1) * N / NB); let lo = -1e9, hi = 1e9, ok = true; for (let y = Math.max(0, ya - 1); y < Math.min(N, yb + 1); y++) { const r = rows[y]; if (!r) { ok = false; break; } lo = Math.max(lo, r[0]); hi = Math.min(hi, r[1]); }
        if (ok && hi - lo >= 2) bands.push([-half + ya * cell, -half + yb * cell, -half + lo * cell, -half + hi * cell]); } } catch (e) { bands = null; }
    m.width = m.height = 1; FPC = { cv, w: cv.width, bands }; return bands; }
  /* the screen outside the ground as rectangles: ARQ fine (the 2D pieces' clip: each band's sides, rows of the same sides joined),
     GRQ coarse (the GPU's passes: each rectangle is a pass of its own, so at most 8: above, below, and each third's two sides
     taken wide enough for every band in it) */
  const ARQ = [], GRQ = [];
  function arenaRects(bands, C, sx, sy, W, H) { ARQ.length = 0; GRQ.length = 0; if (!bands || !bands.length) return -1; let yPrev = 0;
    const push = (A, x0, y0, x1, y1) => { x0 = clamp(x0, 0, W); x1 = clamp(x1, 0, W); y0 = clamp(y0, 0, H); y1 = clamp(y1, 0, H); if (!(x1 - x0 > 0.5 && y1 - y0 > 0.5)) return; const n = A.length;
      for (let i = n - 4; i >= Math.max(0, n - 8); i -= 4) if (A[i] === x0 && A[i + 2] === x1 && Math.abs(A[i + 3] - y0) < 1) { A[i + 3] = y1; return; }   // (joined to the one above it)
      A.push(x0, y0, x1, y1); };
    const vis = []; for (const [by0, by1, bx0, bx1] of bands) { const Y0 = Math.ceil(sy(C.y + by0)), Y1 = Math.floor(sy(C.y + by1)), X0 = Math.round(sx(C.x + bx0)), X1 = Math.round(sx(C.x + bx1)); if (Y1 <= 0 || Y0 >= H) continue; vis.push([Y0, Y1, X0, X1]);
      if (Y0 > yPrev) push(ARQ, 0, yPrev, W, Y0); push(ARQ, 0, Y0, X0, Y1); push(ARQ, X1, Y0, W, Y1); yPrev = Math.max(yPrev, Y1); }
    if (yPrev < H) push(ARQ, 0, yPrev, W, H);
    if (!vis.length) { GRQ.push(0, 0, W, H); return ARQ.length / 4; }
    const yT = vis[0][0], yB = vis[vis.length - 1][1]; push(GRQ, 0, 0, W, yT); push(GRQ, 0, yB, W, H);
    for (let g = 0; g < 3; g++) { const part = vis.slice(Math.floor(g * vis.length / 3), Math.floor((g + 1) * vis.length / 3)); if (!part.length) continue; let l = 0, r = W; for (const b of part) { l = Math.max(l, b[2]); r = Math.min(r, b[3]); }
      const y0 = g ? part[0][0] : yT, y1 = g === 2 ? yB : part[part.length - 1][1]; if (r <= l) { push(GRQ, 0, y0, W, y1); continue; } push(GRQ, 0, y0, l, y1); push(GRQ, r, y0, W, y1); }
    return ARQ.length / 4; }
  function arenaDraw(c, fd, land, W, H, T, t) { const FX = fd.FX, C = FX.C || LIVE && LIVE.C; if (!C) return; const Lv = LIVE && LIVE.fiend ? LIVE : null, k = kOf(c);
    const V = { W, H, T, sx: FX.sx, sy: FX.sy, t, land, light: LANDS[land].light, hy: C.y - 1, top: C.y - C.R - 1.5, span: C.R + 6, k };
    let n = arenaRects(footprint(fd.S, C.R), C, FX.sx, FX.sy, W, H); STATS.arena++; STATS.arenaRects = n;
    if (n === 0) return;   // (the ground covers the whole screen)
    if (n < 0 || n > 40) n = 0; const rects = n > 0 ? ARQ : null; vista(c, V, { rn: n, rects, gn: n > 0 ? GRQ.length / 4 : 0, grects: n > 0 ? GRQ : null }); STATS.arenaGRects = GRQ.length / 4;
    // the dressing beyond the rim, clipped as the view
    const list = DRESS[fd.__ssky]; if (list) { c.save(); if (n > 0) { c.beginPath(); for (let i = 0; i < n * 4; i += 4) c.rect(ARQ[i], ARQ[i + 1], ARQ[i + 2] - ARQ[i], ARQ[i + 3] - ARQ[i + 1]); c.clip(); }
      for (const p of list) { const X = FX.sx(C.x + p.dx), Y = FX.sy(C.y + p.dy), r = p.s * T * 7; if (X < -r || X > W + r || Y < -r || Y > H + r) continue; drawPic(c, V, p.kind, p.v, X, Y, p.s, { rot: p.rot, flip: p.flip }); } c.restore(); }
    void Lv; }
  function wrapDef(id) { try { const D = typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS[id]; if (!D || D.__ssky || typeof D.sky !== 'function') return; D.__ssky = 1; const os = D.sky;
    D.sky = function (c, W, H, t, cam, T) { if (!off() && D.sepSky !== false && INFIGHT) { try { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); return; } catch (e) {} }   // (the fight's own cached sky left clear: the live view is under it)
      if (!off() && D.sepSky !== false && BP()) { try { c.save(); const land = MINE[id], V = { W, H, T, sx: x => (x - cam.x) * T + W / 2, sy: y => (y - cam.y) * T + H / 2, t: 0, land, light: LANDS[land].light, hy: cam.y - 1, top: cam.y - 14, span: 19, k: kOf(c) }; vista(c, V, { gpu: false }); c.restore(); return; } catch (e) { try { c.restore(); } catch (e2) {} } }   // (elsewhere, a still of the view)
      return os.apply(this, arguments); }; } catch (e) {} }
  let INFIGHT = false;
  let hookArena = () => { try { if (typeof DunFiend === 'undefined' || !DunFiend || typeof DunFiend.create !== 'function') return; for (const id in MINE) wrapDef(id); if (DunFiend.create.__ssky) return;
    const oc = DunFiend.create; const f = function (H) { const fd = oc.apply(this, arguments); try { const id = H && H.F && H.F.fiend && H.F.fiend.id, land = MINE[id]; if (fd && land && typeof fd.drawArena === 'function') { wrapDef(id); fd.__ssky = id;
        const od = fd.drawArena, orl = fd.release, D = FIEND_DEFS[id];
        fd.drawArena = function (c, W, H2, cam, T, t) { const S = fd.S, mine = !off() && !(D && D.sepSky === false);
          // (the fight's cached sky is the def's own picture or clear: whenever that changes it is painted again at once, never a
          // clear one left in use by the old path)
          if (S && fd.__clr !== mine) { fd.__clr = mine; S.skyKey = null; }
          if (!mine) return od.apply(this, arguments);
          // every pixel of the canvas painted every frame (v463 SS fix): the land's base laid over all of it first (one fill, where
          // the old path copied a whole-screen sky), the live view over what the ground leaves, the ground over that; nothing of
          // an earlier frame can stay on the screen, in the intro, under a soft edge, or if the view fails
          try { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.fillStyle = LANDS[land].base; c.fillRect(0, 0, c.canvas.width, c.canvas.height); } catch (e) {} finally { try { c.restore(); } catch (e2) {} }
          try { c.save(); arenaDraw(c, fd, land, W, H2, T, t); } catch (e) {} finally { try { c.restore(); } catch (e2) {} }
          INFIGHT = true; let r; try { r = od.apply(this, arguments); } finally { INFIGHT = false; }
          if (S && S.skyFull && S.skyFull.width > 1 && !(D && D.floorDisc)) { S.skyFull.width = S.skyFull.height = 1; }   // (the clear sky's full-size copy given back: it is only copied, and clear)
          if (S && S.skyCv && S.skyCv.width > 1) S.skyCv.width = S.skyCv.height = 1;
          return r; };
        fd.release = function () { try { if (orl) return orl.apply(this, arguments); } finally { release(); FPC = null; if (LIVE && LIVE.fd === fd) LIVE = null; } };
        const C0 = fd.FX && fd.FX.C; LIVE = { X: null, land, fiend: true, C: C0, fd, hy: C0 ? C0.y - 1 : 0, span: C0 ? C0.R + 6 : 19, top: C0 ? C0.y - C0.R - 1.5 : 0 }; } } catch (e) {} return fd; };
    for (const k in oc) f[k] = oc[k]; f.__ssky = 1; DunFiend.create = f; } catch (e) {} };
  if (typeof setTimeout === 'function') setTimeout(() => hookArena(), 0);   // (the boss files load after this one)

  /* ======================= release and warm-up ======================= */
  function release(keepCols) { const n = CACHE.size + STRC.size; CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); CACHE.clear();
    if (!keepCols) { STRC.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STRC.clear(); STARC.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STARC.clear(); COLC.forEach(cv => { cv.width = cv.height = 1; }); COLC.clear(); HELD.clear(); FPC = null; }
    STATS.released += n; }
  function hookRelease() { try { if (typeof DunWorld === 'undefined' || !DunWorld.dropProps || DunWorld.dropProps.__ssky) return; const od = DunWorld.dropProps; const f = function () { try { return od.apply(this, arguments); } finally { release(); LIVE = null; } }; for (const k in od) f[k] = od[k]; f.__ssky = 1; DunWorld.dropProps = f; } catch (e) {} }
  hookRelease();
  // the loading screen's jobs: the sky's columns, the ranges and the pieces this land's view shows, at the stage's sharpness
  function warm(P) { if (off() || !P || !(P.T > 0) || !P.F) return []; const land = LANDS[P.F.biome] ? P.F.biome : P.F.fiend && MINE[P.F.fiend.id]; if (!land) return []; const L = LANDS[land], k = Math.min(3, P.k || 1), T = P.T * (P.F.fiend ? 0.66 : 1), jobs = [], job = f => jobs.push(() => { try { f(); } catch (e) {} });
    job(() => column(land)); if (L.two) job(() => ruinSky(land)); L.strips.forEach((sp, i) => job(() => strip(land, i, stripP(sp, T, k)))); if (L.stars) job(() => starTile(k));
    // (each piece once, its sharpest first: that painting serves the smaller drawings of it, so none is painted twice)
    const W8 = new Map(), want = (nm, vv, s) => { const ln = DEF[nm].light ? DEF[nm].light(vv) : L.light, P2 = picP(nm, vv, T, k, s), key = nm + '|' + vv + '|' + ln, q = W8.get(key); if (!q || P2 > q[3]) W8.set(key, [nm, vv, ln, P2]); };
    for (const it of L.items) want(it.kind, it.v, it.s); for (const it of L.hang || []) want(it.kind, it.v, it.s); for (const sn of L.suns || []) want('sun', sn.v, sn.r);
    if (P.F.fiend && DRESS[P.F.fiend.id]) for (const p of DRESS[P.F.fiend.id]) want(p.kind, p.v, p.s);
    for (const [nm, vv, ln, P2] of W8.values()) job(() => pic(nm, vv, ln, P2, true));
    return jobs; }

  const API = { vista, view, release, warm, LANDS, DEF, LIGHT, get LIVE() { return LIVE; }, set LIVE(v) { LIVE = v; }, stageOf, install, OLDB, pic, strip, column, footprint, arena: { draw: arenaDraw, hook: () => hookArena(), DRESS, MINE },
    get stats() { const px = [...CACHE.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) + [...STRC.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) + [...STARC.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) + [...COLC.values()].reduce((a, q) => a + q.width * q.height, 0); return Object.assign({ cached: CACHE.size, strips: STRC.size, px }, STATS); } };
  if (HAS_W) window.SEP_SKY = API;
  return API;
})();
