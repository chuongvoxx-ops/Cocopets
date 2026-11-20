/* ---------- v433 DS: the Mouth Beneath the Dunes' far views (Rift 03: its three lands and its three boss arenas) ----------
   What is seen past the edge of the playable land, rebuilt (the user, 2026-11-20: "beautiful high quality background aswell
   like rift 02"). Each land is one landscape laid out over the stage itself and fixed in the world, as v428's garden sky is:
   a thing's place on the screen is its place in the world minus the camera, so nothing slides with the camera, and the
   layout repeats along x every `per` tiles so a stage of any width is covered. Its horizon lies across the middle of the
   stage's land (LIVE.hy, from the walkable tiles; an arena's: its centre), the sky above it, the far desert below it:
     dunes     (dusk under the jaw): a hot dusk sky closed overhead by the fossil jaw, its teeth hanging down; a swollen
               sun sinking into four ranges of dunes; fossil ribs and fangs standing in the sand; veils of sand blowing.
     mesa      (the Rust Flats, noon): a bleached blue sky, a white sun and its corona; ranges of layered red mesas and lone
               buttes on a cracked clay plain; mirage pools and heat shimmer on the horizon; dust on the wind; pink glints.
     nightdune (the Moonlit Dunes): a deep star field and the galaxy's band, a large moon, curtains of aurora-like dust;
               moonlit dune ranges, ribs against the glow; firefly swarms drifting over the sand; night mist.
   Pictures (the ribs, fangs and the jaw's segments, the mesas: BELPROPS.kit's software shading in each land's own light;
   the moon, the suns, the dune and mesa ranges, the galaxy's band, the sky's column, the star tiles) are painted once per
   sharpness and kept until the stage closes (DunWorld.dropProps, chained: every one given back). Nothing is painted per
   frame: the frame lays the pictures down; what moves or glows (the veils of sand, the corona, the aurora, the mirage and
   the shimmer, the stars' twinkle, the fireflies, the dust) is the GPU painter's (FGFX, 20k6h kinds 240..242 and 244: "v433
   DS"), lowFx respected; without it the pictures stay and the light is left out.
   Hooks: BIOMES.dunes / mesa / nightdune.gap -> 'dunesky' / 'mesasky' / 'nightsky' (GAP_EXT: the backdrop shown past the
   land); RIFT_BY_ID.dunes.everyStage (chained: LIVE, the stage's horizon; in a boss arena the live view beyond its rim) and
   .preload (chained: the pictures painted on the loading screen); DuneFiend.floor / .sky wrapped at run time (the boss
   files untouched): the arena's ground in the land's own sand, clay or night sand, fading to a dark lip, fossil teeth round
   its rim, and beyond it the same anchored view. window.__DSKY = 0 turns all of it off (the old look comes back).
   API (global DUNE_SKY): vista(c, V, o), view(X), release(), warm(P), stats, LIVE, LANDS, arena { floor, sky, hook }. */
var DUNE_SKY = (() => {
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined';
  const off = () => HAS_W && window.__DSKY === 0;
  const BP = () => (HAS_W && window.BELPROPS && window.BELPROPS.kit) ? window.BELPROPS : null;
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const md = (a, n) => ((a % n) + n) % n;
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + (s | 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const R1 = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const hex = h => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgba = (h, a) => { const c = hex(h); return `rgba(${c[0]},${c[1]},${c[2]},${clamp(a, 0, 1)})`; };
  const mix3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const kOf = c => { const m = c && c.getTransform ? c.getTransform() : null; return m ? Math.max(0.2, Math.hypot(m.a, m.b)) : 1; };
  const qP = P => Math.max(6, Math.round(Math.exp(Math.round(Math.log(Math.max(1, P)) * 8) / 8)));   // (steps of ~13%)
  const STATS = { painted: 0, paintMs: 0, released: 0, frames: 0, quads: 0, pics: 0, misses: 0 };
  // wrapping value noise (p cells across) for the tiles
  const PH = (x, y, s) => hh(x, y, s);
  function pvn(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), q = p | 0 || 1;
    const X0 = ((xi % q) + q) % q, X1 = (X0 + 1) % q, Y0 = ((yi % q) + q) % q, Y1 = (Y0 + 1) % q, a = PH(X0, Y0, s), b = PH(X1, Y0, s), c = PH(X0, Y1, s), d = PH(X1, Y1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const pfbm = (x, y, p, s) => pvn(x, y, p, s) * 0.55 + pvn(x * 2, y * 2, p * 2, s + 7) * 0.3 + pvn(x * 4, y * 4, p * 4, s + 13) * 0.15;
  // a wrapping 1D noise along x (period p cells)
  const pn1 = (x, p, s) => pvn(x, 0.5, p, s);

  /* ======================= the three lands ======================= */
  /* sky: the column's colours by a = (y - horizon) / span (y down, tiles); strips: the ranges (y their top, h their height,
     in tiles from the horizon; z their order among the items); items: pictures standing in the view (fx their place in the
     period, y their feet from the horizon, s their scale); veils: the GPU's banks of sand or mist (y, w, h in tiles) */
  const LANDS = {
    dunes: { per: 64, dark: '#1A0C18', starsA: [-0.42, -0.9], stars: 'warm',
      sky: [[-1.7, '#0C0412'], [-1.12, '#1C0920'], [-0.82, '#3A1230'], [-0.55, '#66203E'], [-0.32, '#A23E40'], [-0.16, '#D86640'], [-0.06, '#F89A50'], [0, '#FFD08A'], [0.03, '#EC9A5C'], [0.16, '#A85640'], [0.4, '#6A2C38'], [0.75, '#3A1628'], [1.15, '#22101E'], [1.7, '#140A12']],
      sun: { fx: 0.6, y: -1.0, r: 3.2, kind: 'sun', v: 0, glow: '#FF9A48', corona: '#FFB070' },
      jaw: { a: -1.0, t: -4.2 },
      strips: [
        { z: 1, prof: 'dune', y: -1.9, h: 2.4, per: 32, seed: 3, waves: [[3, 0.6, 0.1, 0.74], [5, 0.3, 0.4, 0.7], [11, 0.12, 0.7, 0.66]], lit: '#F0A27A', sh: '#A65466', rim: '#FFE0B0', haze: '#F2A684', hz: 0.5, hzd: 0.3, light: [-0.85, 0.5], fade: 0.9, phase: 5 },
        { z: 3, prof: 'dune', y: -0.9, h: 3.4, per: 48, seed: 7, waves: [[3, 0.55, 0.3, 0.72], [4, 0.35, 0.8, 0.7], [9, 0.14, 0.2, 0.66]], lit: '#EAA466', sh: '#7C3452', rim: '#FFE6B0', haze: '#C86A5E', hz: 0.24, hzd: 0.35, light: [-0.85, 0.5], fade: 1.2, phase: 19 },
        { z: 5, prof: 'dune', y: 1.4, h: 5.2, per: 40, seed: 11, waves: [[2, 0.6, 0.55, 0.74], [3, 0.3, 0.1, 0.7], [7, 0.15, 0.4, 0.66]], lit: '#D88C4A', sh: '#4C2038', rim: '#FFD898', haze: '#5A2A3A', hz: 0.06, hzd: 0.5, light: [-0.85, 0.5], fade: 1.6, phase: 7 },
        { z: 7, prof: 'dune', y: 5.8, h: 8.5, per: 56, seed: 17, waves: [[2, 0.62, 0.15, 0.76], [3, 0.28, 0.6, 0.7], [6, 0.14, 0.9, 0.64]], lit: '#B0643A', sh: '#2C1222', rim: '#FFC484', haze: '#1E0E1A', hz: 0.04, hzd: 0.45, light: [-0.85, 0.5], fade: 3, phase: 31 },
        { z: 9, prof: 'dune', y: 12.6, h: 9, per: 60, seed: 43, waves: [[2, 0.58, 0.6, 0.76], [3, 0.3, 0.2, 0.7], [7, 0.13, 0.45, 0.64]], lit: '#8A4630', sh: '#200C18', rim: '#F0A870', haze: '#160A12', hz: 0.04, hzd: 0.4, light: [-0.85, 0.5], fade: 3, phase: 13 } ],
      items: [
        { z: 2, kind: 'cage', n: 4, fx: 0.14, y: 1.0, s: 0.38, a: 0.8 }, { z: 2, kind: 'fang', v: 1, fx: 0.83, y: 1.0, s: 0.5, a: 0.8 },
        { z: 4, kind: 'cage', n: 3, fx: 0.45, y: 3.6, s: 0.7 }, { z: 4, kind: 'fang', v: 0, fx: 0.72, y: 3.8, s: 0.85 }, { z: 4, kind: 'fang', v: 2, fx: 0.95, y: 3.6, s: 0.65 },
        { z: 6, kind: 'rib', v: 0, fx: 0.06, y: 9.6, s: 1.2 }, { z: 6, kind: 'fang', v: 1, fx: 0.31, y: 9.5, s: 1.3 }, { z: 6, kind: 'cage', n: 3, fx: 0.66, y: 9.2, s: 1.1 },
        { z: 8, kind: 'fang', v: 2, fx: 0.18, y: 15, s: 1.6 }, { z: 8, kind: 'cage', n: 2, fx: 0.86, y: 15.5, s: 1.5 }, { z: 8, kind: 'fang', v: 0, fx: 0.52, y: 15.2, s: 1.3 },
        { z: 10, kind: 'cage', n: 2, fx: 0.36, y: 22.5, s: 1.9 }, { z: 10, kind: 'fang', v: 1, fx: 0.7, y: 22, s: 2.1 } ],
      veils: [{ y: -0.6, w: 30, h: 1.6, col: '#FFC890', a: 0.3, spd: 1.2 }, { y: 3.4, w: 34, h: 2.6, col: '#E8A070', a: 0.42, spd: 0.8 }, { y: 9, w: 40, h: 3.6, col: '#C8784E', a: 0.38, spd: 1.0 }, { y: 16, w: 44, h: 5, col: '#8A4A40', a: 0.34, spd: 0.6 }, { y: -9, w: 36, h: 2.4, col: '#E08070', a: 0.16, spd: 0.5 }],
      shimmer: [{ y: -0.15, w: 26, h: 1.5, col: '#FFC890', a: 0.32, mode: 0, fx: 0.6 }],
      motes: '#FFD8A0', light: 'dusk',
      sand: { lit: '#E6BE7E', sh: '#B68650', deep: '#94683A', glint: '#FFF4D8', kind: 'ripple' }, vein: '#62BFC9' },
    mesa: { per: 72, dark: '#4A1C0C',
      sky: [[-1.7, '#183C78'], [-1.1, '#2A5A98'], [-0.72, '#5A8ABC'], [-0.42, '#9CBCD4'], [-0.2, '#D6D8CC'], [-0.06, '#F6E8D2'], [0, '#FFF6E6'], [0.025, '#F6C894'], [0.14, '#EA9E60'], [0.4, '#D47E40'], [0.8, '#B25C2C'], [1.2, '#88421E'], [1.7, '#5C2A14']],
      sun: { fx: 0.34, a: -0.78, t: -8, r: 1.5, kind: 'sun', v: 1, glow: '#FFF4D8', corona: '#FFF6E8' },
      strips: [
        { z: 1, prof: 'mesa', y: -2.7, h: 2.9, per: 36, seed: 5, buttes: 6, jhz: 0.2, lit: '#F2C2A8', sh: '#C49498', rim: '#FFF0E0', haze: '#F2DCD0', hz: 0.55, hzd: 0.2, light: [-0.6, 0.8], fade: 0.8, phase: 3 },
        { z: 3, prof: 'mesa', y: -1.5, h: 3.8, per: 52, seed: 9, buttes: 5, jhz: 0.18, lit: '#EC9A68', sh: '#9A4A40', rim: '#FFE4C8', haze: '#E8B8A0', hz: 0.25, hzd: 0.3, light: [-0.6, 0.8], fade: 1.1, phase: 21 },
        { z: 5, prof: 'dune', y: 1.2, h: 2.6, per: 44, seed: 13, waves: [[3, 0.5, 0.2, 0.6], [7, 0.3, 0.5, 0.55], [13, 0.12, 0.1, 0.5]], lit: '#E8955A', sh: '#A8502C', rim: '#FFD0A0', haze: '#E8A070', hz: 0.2, hzd: 0.3, light: [-0.6, 0.8], fade: 1.2, phase: 9 } ],
      items: [
        { z: 2, kind: 'mesa', v: 0, fx: 0.08, y: 0.6, s: 0.55, haze: 0.5 }, { z: 2, kind: 'mesa', v: 2, fx: 0.55, y: 0.7, s: 0.5, haze: 0.5 }, { z: 2, kind: 'mesa', v: 1, fx: 0.8, y: 0.6, s: 0.42, haze: 0.5 }, { z: 2, kind: 'hoodoo', v: 1, fx: 0.33, y: 0.6, s: 0.45, haze: 0.5 },
        { z: 4, kind: 'mesa', v: 1, fx: 0.25, y: 2.6, s: 0.95, haze: 0.22 }, { z: 4, kind: 'mesa', v: 2, fx: 0.93, y: 2.7, s: 0.85, haze: 0.22 }, { z: 4, kind: 'hoodoo', v: 0, fx: 0.62, y: 2.7, s: 0.8, haze: 0.22 }, { z: 4, kind: 'hoodoo', v: 1, fx: 0.69, y: 2.8, s: 0.7, haze: 0.22 },
        { z: 6, kind: 'mesa', v: 0, fx: 0.44, y: 6.5, s: 1.0 }, { z: 6, kind: 'cage', n: 2, fx: 0.72, y: 6.4, s: 0.6 }, { z: 6, kind: 'hoodoo', v: 1, fx: 0.1, y: 7.2, s: 1.1 },
        { z: 8, kind: 'mesa', v: 2, fx: 0.05, y: 14, s: 1.35 }, { z: 8, kind: 'mesa', v: 1, fx: 0.62, y: 17, s: 1.25 }, { z: 8, kind: 'hoodoo', v: 0, fx: 0.86, y: 15.5, s: 1.4 } ],
      veils: [{ y: 4.6, w: 36, h: 2.4, col: '#E8A068', a: 0.32, spd: 1.4 }, { y: 11, w: 44, h: 3.6, col: '#D07A44', a: 0.3, spd: 1.0 }, { a2: -0.5, w: 46, h: 2.2, col: '#F6FAFF', a: 0.16, spd: 0.35 }, { a2: -0.95, w: 40, h: 1.8, col: '#EAF2FF', a: 0.12, spd: 0.25 }],
      shimmer: [{ y: 0.35, w: 40, h: 1.0, col: '#DCE8F6', a: 0.55, mode: 1, fx: 0.2 }, { y: 0.4, w: 28, h: 0.9, col: '#E4EEF8', a: 0.45, mode: 1, fx: 0.68 }, { y: 2.6, w: 36, h: 2.2, col: '#FFE6C0', a: 0.14, mode: 0, fx: 0.45 }, { y: 7.5, w: 30, h: 2.6, col: '#FFE0B8', a: 0.11, mode: 0, fx: 0.9 }],
      motes: '#FFE0C0', glints: '#FF7ACC', light: 'noon', cracks: true,
      sand: { lit: '#E08C4A', sh: '#B4602E', deep: '#8A421E', glint: '#FFD6A8', kind: 'clay' }, vein: '#FF5FC4' },
    nightdune: { per: 80, dark: '#050A18', starsA: [-0.04, -0.4], stars: 'cold',
      sky: [[-1.7, '#010208'], [-1.1, '#030614'], [-0.7, '#060C22'], [-0.4, '#0A1634'], [-0.16, '#13234C'], [-0.04, '#1E3466'], [0, '#2A4680'], [0.035, '#1A2C58'], [0.2, '#0F1C3C'], [0.55, '#09122A'], [1.05, '#050A1A'], [1.7, '#03050E']],
      moon: { fx: 0.3, a: -0.6, t: -6.5, r: 4.2 }, aurora: { a: -0.95, t: -12, w: 46, h: 15 }, galaxy: { fx: 0.62, a: -1.0, t: -13 },
      strips: [
        { z: 1, prof: 'dune', y: -1.5, h: 2.1, per: 40, seed: 23, waves: [[3, 0.6, 0.3, 0.72], [5, 0.3, 0.6, 0.7], [11, 0.12, 0.2, 0.66]], lit: '#40609E', sh: '#1A2A52', rim: '#B0CCFF', haze: '#2C4478', hz: 0.45, hzd: 0.3, light: [-0.7, 0.7], fade: 0.9, phase: 11 },
        { z: 3, prof: 'dune', y: -0.5, h: 3.3, per: 52, seed: 29, waves: [[3, 0.55, 0.7, 0.72], [4, 0.33, 0.2, 0.7], [9, 0.14, 0.5, 0.66]], lit: '#33528E', sh: '#0F1C3A', rim: '#C8DCFF', haze: '#1A2C58', hz: 0.2, hzd: 0.35, light: [-0.7, 0.7], fade: 1.2, phase: 3 },
        { z: 5, prof: 'dune', y: 2.4, h: 6, per: 44, seed: 31, waves: [[2, 0.6, 0.35, 0.74], [3, 0.3, 0.75, 0.7], [7, 0.15, 0.1, 0.66]], lit: '#253E72', sh: '#0A1228', rim: '#B8D0FF', haze: '#08101E', hz: 0.04, hzd: 0.55, light: [-0.7, 0.7], fade: 2.4, phase: 17 },
        { z: 7, prof: 'dune', y: 7.4, h: 9, per: 60, seed: 37, waves: [[2, 0.6, 0.45, 0.76], [3, 0.3, 0.05, 0.7], [7, 0.14, 0.6, 0.64]], lit: '#1C3260', sh: '#060C1E', rim: '#A0BEF6', haze: '#040818', hz: 0.04, hzd: 0.35, light: [-0.7, 0.7], fade: 3, phase: 23 },
        { z: 9, prof: 'dune', y: 13.6, h: 9, per: 64, seed: 41, waves: [[2, 0.55, 0.8, 0.76], [3, 0.32, 0.35, 0.7], [8, 0.13, 0.15, 0.64]], lit: '#16294E', sh: '#040916', rim: '#8EAEEA', haze: '#030612', hz: 0.03, hzd: 0.35, light: [-0.7, 0.7], fade: 3, phase: 41 } ],
      items: [
        { z: 2, kind: 'cage', n: 4, fx: 0.5, y: 1.3, s: 0.5, a: 0.85 }, { z: 2, kind: 'fang', v: 1, fx: 0.86, y: 1.3, s: 0.55, a: 0.85 },
        { z: 4, kind: 'cage', n: 3, fx: 0.12, y: 5.2, s: 0.9 }, { z: 4, kind: 'fang', v: 0, fx: 0.7, y: 5.4, s: 1.0 },
        { z: 6, kind: 'cage', n: 2, fx: 0.36, y: 11, s: 1.4 }, { z: 6, kind: 'fang', v: 2, fx: 0.93, y: 11, s: 1.5 },
        { z: 8, kind: 'cage', n: 3, fx: 0.62, y: 17.5, s: 1.3 }, { z: 8, kind: 'fang', v: 1, fx: 0.14, y: 17, s: 1.5 }, { z: 8, kind: 'rib', v: 1, fx: 0.86, y: 18, s: 1.3, flip: 1 }, { z: 8, kind: 'fang', v: 0, fx: 0.4, y: 17.4, s: 1.2 },
        { z: 10, kind: 'cage', n: 2, fx: 0.05, y: 24, s: 1.8 }, { z: 10, kind: 'fang', v: 2, fx: 0.5, y: 23.5, s: 2.0 }, { z: 10, kind: 'rib', v: 0, fx: 0.76, y: 24.5, s: 1.8 } ],
      veils: [{ y: 0.9, w: 40, h: 2.0, col: '#3A5A98', a: 0.26, spd: 0.4 }, { y: 7, w: 44, h: 3.4, col: '#24406E', a: 0.3, spd: 0.3 }, { y: 11.5, w: 42, h: 3.2, col: '#2C4A80', a: 0.26, spd: 0.35 }, { y: 15, w: 46, h: 4.5, col: '#1E3258', a: 0.3, spd: 0.25 }, { y: 20, w: 50, h: 5, col: '#1A2C50', a: 0.26, spd: 0.2 }],
      shimmer: [], motes: '#C8DCFF', flies: '#7CFF6A', light: 'night',
      sand: { lit: '#4A68A2', sh: '#22365E', deep: '#16244A', glint: '#D8E8FF', kind: 'ripple' }, vein: '#7CFF6A' } };
  const LAND_OF = { dunesky: 'dunes', mesasky: 'mesa', nightsky: 'nightdune' };
  // the lights the painted pieces are shaded in (BELPROPS.kit's light, swapped in for the painting)
  const LIGHT = { dusk: { a0: [0.16, 0.06, 0.12], a1: [0.12, 0.05, 0.1], e0: [0.12, 0.05, 0.08], e1: [0.6, 0.3, 0.3], k: [1.3, 0.86, 0.56], rim: [0.95, 0.5, 0.22], bo: [0.42, 0.2, 0.1] },
    noon: { a0: [0.24, 0.17, 0.15], a1: [0.12, 0.14, 0.2], e0: [0.2, 0.15, 0.12], e1: [0.45, 0.56, 0.72], k: [1.5, 1.42, 1.3], rim: [0.4, 0.34, 0.3], bo: [0.32, 0.15, 0.06] },
    night: { a0: [0.03, 0.05, 0.1], a1: [0.05, 0.07, 0.16], e0: [0.03, 0.04, 0.09], e1: [0.2, 0.28, 0.5], k: [0.62, 0.74, 1.05], rim: [0.42, 0.58, 0.95], bo: [0.03, 0.08, 0.05] } };
  function lit(K, name, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHT[name] || LIGHT.dusk); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }

  /* ======================= the sky's column (a gradient by height, made once) ======================= */
  const A0 = -1.7, A1 = 1.7, NCOL = 512;
  const COLC = new Map();
  function column(land) { let cv = COLC.get(land); if (cv) return cv; const L = LANDS[land], S = L.sky.map(([a, h]) => [a, hex(h)]); cv = mkc(2, NCOL); const c = cv.getContext('2d'), img = c.createImageData(2, NCOL), d = img.data;
    for (let i = 0; i < NCOL; i++) { const a = A0 + (i + 0.5) / NCOL * (A1 - A0); let k = 0; while (k < S.length - 2 && a > S[k + 1][0]) k++; const u = clamp((a - S[k][0]) / (S[k + 1][0] - S[k][0]), 0, 1), e = u * u * (3 - 2 * u), col = mix3(S[k][1], S[k + 1][1], lerp(u, e, 0.5));
      for (let j = 0; j < 2; j++) { const o = (i * 2 + j) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; } }
    c.putImageData(img, 0, 0); COLC.set(land, cv); return cv; }
  const skyAt = (land, a) => { const S = LANDS[land].sky; let k = 0; while (k < S.length - 2 && a > S[k + 1][0]) k++; return mix3(hex(S[k][1]), hex(S[k + 1][1]), clamp((a - S[k][0]) / (S[k + 1][0] - S[k][0]), 0, 1)); };

  /* ======================= the stars (tiles that wrap, laid over the sky anchored to the stage) ======================= */
  const STARC = new Map();
  function starTile(kind, k) { const key = kind + '@' + k; let p = STARC.get(key); if (p) return p; const S = kind === 'cold' ? 256 : 192, N = Math.max(16, Math.round(S * Math.min(2, k))), cv = mkc(N, N), c = cv.getContext('2d'), R = R1(kind === 'cold' ? 977 : 331);
    c.scale(N / S, N / S); const n = kind === 'cold' ? 240 : 70;
    for (let i = 0; i < n; i++) { const x = R() * S, y = R() * S, big = R(), s = big > 0.97 ? 1.5 : big > 0.85 ? 1.0 : 0.6, a = 0.25 + R() * 0.7, h = R();
      const col = kind === 'cold' ? (h > 0.9 ? '255,214,170' : h > 0.75 ? '170,200,255' : h > 0.7 ? '200,180,255' : '235,242,255') : (h > 0.8 ? '255,200,150' : h > 0.65 ? '255,170,190' : '255,236,214');
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const X = x + ox, Y = y + oy; if (X < -4 || Y < -4 || X > S + 4 || Y > S + 4) continue;
        if (s > 1.2) { const g = c.createRadialGradient(X, Y, 0, X, Y, s * 3); g.addColorStop(0, `rgba(${col},${a * 0.5})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(X - s * 3, Y - s * 3, s * 6, s * 6); }
        c.fillStyle = `rgba(${col},${a})`; c.beginPath(); c.arc(X, Y, s * 0.6, 0, TAU); c.fill(); } }
    p = { cv, pat: c.createPattern ? null : null, N, S }; p.pat = cv.getContext('2d').createPattern(cv, 'repeat'); STARC.set(key, p); return p; }

  /* ======================= the ranges (strips that wrap along x, painted pixel by pixel) ======================= */
  /* a range is three ridges deep (j 0 the farthest .. 2 the nearest), each nearer one hiding the foot of the one behind it
     and casting a soft shadow up it: the ridge of ridge j at x, 0..1 (1 its highest) */
  function profile(sp, x, j) { const per = sp.per; j = j || 0;
    if (sp.prof === 'mesa') { const bk = '_b' + j, B = sp[bk] || (sp[bk] = (() => { const R = R1(sp.seed * 131 + 7 + j * 977), out = [], n = sp.buttes + (j === 1 ? 1 : 0); for (let i = 0; i < n; i++) { const sp2 = R() < 0.3; out.push(sp2 ? { c: (i + 0.15 + R() * 0.7) / n * per, w: 0.12 + R() * 0.22, s: 0.12 + R() * 0.1, h: 0.7 + R() * 0.3 } : { c: (i + 0.15 + R() * 0.7) / n * per, w: 0.8 + R() * per / n * 0.3, s: 0.3 + R() * 0.45, h: 0.45 + R() * 0.55, st: R() < 0.5 ? (R() - 0.5) * 2 : 0 }); } return out; })());
      let H = 0.06 + 0.07 * pn1(x / per * 9, 9, sp.seed + j); for (const b of B) { const d = Math.abs(md(x - b.c + per / 2, per) - per / 2), e = 1 - ss(b.w, b.w + b.s, d); if (e <= 0) continue; const sx2 = md(x - b.c + per / 2, per) - per / 2, top = b.h * (0.96 + 0.05 * pn1(x / per * 40, 40, sp.seed + 3 + j)) - 0.06 * ss(b.w * 0.5, b.w, d) - (b.st ? 0.22 * b.h * ss(0, b.w * 0.5, sx2 * Math.sign(b.st)) : 0); H = Math.max(H, lerp(H, top, e)); } return H; }
    let H = 0; for (const [n, a, ph, c] of sp.waves) { const u = md(x / per * n + ph + j * 0.37 * (n % 2 ? 1 : -1) + 0.05 * pn1(x / per * n * 3, n * 3, sp.seed + j), 1), w = u < c ? Math.pow(Math.sin(u / c * Math.PI / 2), 1.35) : Math.pow(Math.cos((u - c) / (1 - c) * Math.PI / 2), 1.3); H += a * w; } return H * 0.85 + 0.1; }
  const STRC = new Map();
  function strip(land, i, P) { const key = land + '|' + i + '|' + P; let s = STRC.get(key); if (s) return s; const t0 = now(), sp = LANDS[land].strips[i];
    for (const [k2, s2] of [...STRC]) if (k2.startsWith(land + '|' + i + '|') && s2.P < P) { s2.cv.width = s2.cv.height = 1; STRC.delete(k2); }   // (a range painted smaller before, for the arena's small backdrop, given back)
    const w = Math.round(sp.per * P), h = Math.round(sp.h * P), cv = mkc(w, h), c = cv.getContext('2d'), img = c.createImageData(w, h), d = img.data;
    const LIT = hex(sp.lit), SH = hex(sp.sh), RIM = hex(sp.rim), HZ = hex(sp.haze), ll = Math.hypot(sp.light[0], sp.light[1]), lx = sp.light[0] / ll, ly = sp.light[1] / ll, mesa = sp.prof === 'mesa', NJ = 3;
    // each ridge's top (tiles from the strip's top) and its light (from its slope) for every column
    const OFF = [0, sp.h * 0.2, sp.h * 0.4], AMP = [sp.h * 0.55, sp.h * 0.5, sp.h * 0.5], top = [], dif = [], pre = [], skew = (sp.light[0] < 0 ? 1 : -1) * 0.7;
    for (let j = 0; j < NJ; j++) { const tp = new Float32Array(w), df = new Float32Array(w); for (let px = 0; px < w; px++) { const x = (px + 0.5) / P, e = 0.5 / P, H = profile(sp, x, j), sl = (profile(sp, x + e, j) - profile(sp, x - e, j)) / (2 * e) * AMP[j]; tp[px] = OFF[j] + (1 - H) * AMP[j]; const nl = Math.hypot(sl, 1); df[px] = clamp((-sl * lx + ly) / nl, 0, 1); } top.push(tp); dif.push(df); const ps = new Float32Array(w * 3 + 1); for (let q = 0; q < w * 3; q++) ps[q + 1] = ps[q] + df[q % w]; pre.push(ps); }
    // the colour of ridge j at a pixel
    // (a face's light is taken a little to one side and averaged wider the lower it lies: the crest's line slants down toward
    // the viewer and the boundary of light and shadow softens, rather than running straight down the range)
    const lightAt = (j, px, dd) => { const c0 = px + Math.round(dd * skew * P) + w, hw = Math.round(dd * 0.45 * P); if (hw < 1) return dif[j][((c0 % w) + w) % w]; const a0 = clamp(c0 - hw, 0, w * 3 - 1), a1 = clamp(c0 + hw, 1, w * 3); return (pre[j][a1] - pre[j][a0]) / (a1 - a0); };
    const colAt = (j, px, x, y) => { const tp = top[j][px], dd = Math.max(0, y - tp), df = lightAt(j, px, dd), deep = ss(0, sp.h * 0.55, dd); let k = lerp(df, 0.3 + df * 0.3, deep * (mesa ? 0.25 : 0.7));
      if (j < NJ - 1) { const gap = top[j + 1][px] - y; k *= 1 - 0.38 * (1 - ss(0, 0.6, gap)); }   // (the shadow a nearer ridge casts up the one behind it)
      if (mesa) { const band = Math.sin((y * 2.3 + pn1(x * 0.7, Math.round(sp.per * 0.7), sp.seed + 9) * 0.6) * Math.PI * 2), gr = pn1(x * 4, Math.round(sp.per * 4), sp.seed + j * 5); k *= (0.9 + 0.1 * band) * (0.86 + 0.24 * gr); if (df > 0.72 && dd < 0.1) k = Math.min(1, k + 0.18); }
      else { const rip = Math.sin((x * 3.1 + dd * 7 + pn1(x * 0.5, Math.round(sp.per * 0.5), sp.seed + j) * 3) * TAU); k *= 0.94 + 0.06 * rip * (1 - deep) * (df > 0.4 ? 1 : 0.4); }
      let col = mix3(SH, LIT, clamp(k, 0, 1));
      const rim = df > 0.4 ? (1 - ss(0, 0.14, dd)) * ss(0.4, 0.85, df) : (1 - ss(0, 0.045, dd)) * 0.3; col = mix3(col, RIM, rim * 0.85);
      return mix3(col, HZ, clamp(sp.hz + deep * sp.hzd + (NJ - 1 - j) * (sp.jhz || 0.12), 0, 1)); };
    for (let px = 0; px < w; px++) { const x = (px + 0.5) / P;
      for (let py = 0; py < h; py++) { const y = (py + 0.5) / P; let j = NJ - 1; while (j >= 0 && y < top[j][px] - 0.5 / P) j--; if (j < 0) continue;
        const fade = 1 - ss(sp.h - sp.fade, sp.h, y); if (fade <= 0.004) continue; const cv0 = clamp((y - top[j][px]) * P + 0.5, 0, 1);
        let col = colAt(j, px, x, y), al = 1;
        if (cv0 < 1) { let jb = j - 1; while (jb >= 0 && y < top[jb][px] - 0.5 / P) jb--; if (jb >= 0) col = mix3(colAt(jb, px, x, y), col, cv0); else al = cv0; }   // (each ridge's edge feathered over what is behind it)
        const gr = (hh(px, py, sp.seed) - 0.5) * 5, o = (py * w + px) * 4; d[o] = clamp(col[0] + gr, 0, 255); d[o + 1] = clamp(col[1] + gr, 0, 255); d[o + 2] = clamp(col[2] + gr, 0, 255); d[o + 3] = 255 * al * fade; } }
    c.putImageData(img, 0, 0); s = { cv, P, w: sp.per, h: sp.h }; STRC.set(key, s); STATS.painted++; STATS.paintMs += now() - t0; return s; }
  // a range's sharpness, held once chosen (a camera gliding between zooms, or the arena's small backdrop, keeps the one painted
  // unless it is off by more than about 40%): one painting a range per stage, not one per step of a zoom
  const HELD = new Map();
  const stripP = (sp, T, k) => { let P = qP(clamp(T * Math.min(2, k) * 0.6, 10, 26)); while (sp.per * P * sp.h * P > 160000 && P > 8) P = qP(P * 0.85); const h = HELD.get(sp); if (h && P < h * 1.4) return h; if (!h || P > h) HELD.set(sp, P); return P; };

  /* ======================= the painted pieces (BELPROPS.kit; the moon and the suns on their own) ======================= */
  // fossil bone (u along it, v round it, in tiles): mottled, pitted, fine cracks running along its length, darker toward a root
  // buried in the sand (t 0 its foot)
  function boneM(K, u, v, sd, t, root) { const { M, vn } = K, n1 = vn(u * 1.3 + sd, v * 1.3 + sd * 0.3), n2 = vn(u * 4.5 + sd * 2, v * 4.5 + 1), cr = vn(u * 3.2 - sd, v * 3.2 + 3), pit = vn(u * 11 + 7, v * 11 - sd);
    let b = 0.82 + 0.24 * n1 - 0.1 * n2 - (Math.abs(cr - 0.5) < 0.012 ? 0.22 : 0) - (pit > 0.82 ? (pit - 0.82) * 2.4 : 0); const age = root ? ss(0.3, 0, t) * 0.4 : 0;
    M.r = 0.86 * b - age * 0.22; M.g = 0.77 * b - age * 0.28; M.b = 0.6 * b - age * 0.3; M.rg = 0.62 + 0.25 * n2; M.ao *= 0.8 + 0.2 * n1; }
  const DEF = {
    // a fossil rib arching up out of the sand (v 0 a long sweep, 1 a tighter hook): two of them mirrored meet in an arch
    rib: { kit: true, sink: 0.7, box: () => [-1.1, -7.2, 5.0, 0.6], paint(K, S, v) { const sd = 3 + v * 7, pts = [], Lr = 9;
      for (let i = 0; i <= 18; i++) { const s = i / 18, x = v ? 3.3 * (1 - Math.cos(s * 1.75)) * 1.05 : 4.0 * (1 - Math.cos(s * 1.45)), y = -(v ? 6.0 : 6.6) * Math.sin(s * (v ? 1.45 : 1.3)) / Math.sin(v ? 1.45 : 1.3); pts.push([x, y]); }
      K.tube(S, pts, 0.44, 0.13, (t, s) => { boneM(K, t * Lr, s * 0.4, sd, t, 1); K.M.ao *= 0.92 + 0.08 * Math.sin(t * 50 + s); }); } },
    // a fang standing in the sand, curved (v 0..2 three of them): bone at the root turning to worn enamel at the tip
    fang: { kit: true, sink: 0.6, box: () => [-1.3, -4.6, 1.8, 0.6], paint(K, S, v) { const sd = 11 + v * 5, L = [3.6, 4.2, 3.0][v % 3], bend = [0.55, -0.35, 0.8][v % 3], pts = [];
      for (let i = 0; i <= 12; i++) { const s = i / 12; pts.push([bend * s * s, -L * s]); }
      K.tube(S, pts, 0.6, 0.03, (t, s) => { boneM(K, t * L, s * 0.5, sd, t, 1); const en = ss(0.3, 0.85, t); K.M.r += en * 0.07; K.M.g += en * 0.06; K.M.b += en * 0.03; K.M.rg = lerp(K.M.rg, 0.3, en); K.M.cc = en * 0.25; }); } },
    // the upper jaw, one period of it painted so its ends meet (see paintJaw)
    jaw: { kit: true, cap: 800, box: () => [-JAWP / 2, -5.8, JAWP / 2, 6.6], paint: (K, S) => paintJaw(K, S) },
    // a layered red mesa: cliffs of strata over a talus apron, its flat top in the sun (v 0..2)
    mesa: { kit: true, cap: 640, box: v => { const m = MESA[v % 3]; return [-(m.w + m.tal + 1.0), -(m.h + 1.2), m.w * 1.6 + m.tal + 2.6, 1.3]; }, paint: paintMesa },
    hoodoo: { kit: true, cap: 500, box: () => [-2.4, -4.4, 4.4, 1.2], paint: paintHoodoo },
    // the moon: a pale disc, seas and rayed craters, its limb dark (P: a radius in px)
    moon: { cap: 480, box: () => [-1.03, -1.03, 1.03, 1.03], paint: paintMoon },
    // the suns: v 0 the swollen dusk sun, banded by the haze; v 1 the white noon sun (P: a radius in px)
    sun: { cap: 400, box: () => [-1.6, -1.6, 1.6, 1.6], paint: paintSun },
    // the galaxy's band: dust lanes, a glow and a host of fine stars (a long picture, laid turned)
    galaxy: { box: () => [-20, -3.2, 20, 3.2], paint: paintGalaxy } };
  /* the Rust Flats' rocks: v 0 a broad mesa with a stepped shoulder, 1 a tall butte with a spire split from its flank, 2 a long
     mesa pierced by an arch. Each cliff's two edges wander on their own (eroded bays and buttresses), narrow a little upward
     under a harder caprock; the cliff is fluted, banded in strata, and stands on a talus apron that spreads, softens and
     fades into the plain; its shadow falls on the clay to the right (the sun is high on the left) */
  const MESA = [{ w: 3.0, h: 4.0, tal: 1.6, ht: 1.3, sd: 3, step: 1 }, { w: 1.5, h: 5.0, tal: 1.2, ht: 1.5, sd: 9, spire: 1 }, { w: 4.2, h: 3.1, tal: 1.8, ht: 1.0, sd: 17, arch: 1 }];
  const STRATA = [[0.7, 0.29, 0.16], [0.86, 0.52, 0.3], [0.52, 0.2, 0.11], [0.92, 0.7, 0.48], [0.76, 0.37, 0.2], [0.62, 0.25, 0.14]];
  const PLAIN = [0.58, 0.31, 0.16];   // (the clay under the noon key: lit, it meets the plain's own colour)
  function paintMesa(K, S, v) { const m = MESA[v % 3], { M, vn } = K, P = S.P, sd = m.sd, e = 0.5 / P;
    const edge = (hg, side) => { const s2 = sd + side * 31, t = clamp(hg / m.h, 0, 1); let w = m.w * (1 - 0.08 * t) + (vn(hg * 0.8 + s2, s2) - 0.5) * 0.9 + (vn(hg * 2.7 + s2, s2 + 5) - 0.5) * 0.3 + (vn(hg * 7 + s2, s2 + 9) - 0.5) * 0.08;
      if (hg > m.h - 0.45) w += 0.12;   // (the caprock's lip)
      const tk = hg < m.ht ? Math.pow(1 - hg / m.ht, 1.7) : 0; return w + tk * m.tal * (0.75 + 0.5 * vn(hg * 1.5 + s2, 7)); };
    const topAt = x => { let h = m.h + (vn(x * 0.9 + sd, 9) - 0.5) * 0.4; if (m.step) h -= m.h * 0.24 * ss(m.w * 0.15, m.w * 0.45, x); return h; };
    const SPX = m.w + 1.1, spW = hg => (0.42 - 0.1 * hg / (m.h * 0.72)) * (0.85 + 0.3 * vn(hg * 2.2, sd + 40)) + (hg < 0.7 ? (0.7 - hg) * 0.6 : 0), spH = m.h * 0.72;
    const AX = m.w * 0.45, AY = m.h * 0.42, AW = 0.75, AH = m.h * 0.24;
    S.lock();
    for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, hg = -(py + 0.5 - S.ay) / P; if (hg < -1.25) continue;
      const fo = (vn(x * 0.7 + sd, 3) - 0.5) * 1.1 + (vn(x * 2.6 + sd, 5) - 0.5) * 0.35, eL = edge(hg, 0), eR = edge(hg, 1), tk = hg < m.ht ? 1 - hg / m.ht : 0, fw = e + tk * tk * 0.55, hT = topAt(x);
      const capH = 0.32 * Math.sqrt(Math.max(0, 1 - ((x - (eR - eL) / 2) / ((eL + eR) / 2 + 0.05)) ** 2));
      let a = clamp((x + eL) / fw + 0.5, 0, 1) * clamp((eR - x) / fw + 0.5, 0, 1) * clamp((hT + capH - hg) * P + 0.5, 0, 1) * ss(-0.75 + fo * 0.6, 0.5 + fo, hg), spire = false;
      if (m.spire) { const sw = spW(hg), aS = clamp((sw - Math.abs(x - SPX)) * P + 0.5, 0, 1) * clamp((spH + 0.2 - hg) * P + 0.5, 0, 1) * ss(-0.6, 0.3, hg); if (aS > a) { a = aS; spire = true; } }
      let hole = 0; if (m.arch && !spire) { const q = Math.hypot((x - AX) / AW, (hg - AY) / AH); hole = clamp((1 - q) * Math.min(AW, AH) * P + 0.5, 0, 1); a *= 1 - hole; }
      if (a <= 0.003) continue; M0(K); let nx, ny, nz;
      if (!spire && hg > hT) { const ey = (hg - hT) / Math.max(0.05, capH * 2); nx = 0; ny = 0.25 - ey * 0.3; nz = 1; const n = vn(x * 3 + sd, hg * 3), n2 = vn(x * 12 + sd, hg * 12); M.r = 0.82 * (0.8 + 0.25 * n) * (0.95 + 0.1 * n2); M.g = 0.5 * (0.8 + 0.25 * n) * (0.95 + 0.1 * n2); M.b = 0.32 * (0.8 + 0.25 * n) * (0.95 + 0.1 * n2); M.rg = 0.9; M.ao = 0.8 + 0.2 * n; }
      else { const L0 = spire ? SPX - spW(hg) : -eL, R0 = spire ? SPX + spW(hg) : eR, cx = clamp(((x - L0) / Math.max(0.1, R0 - L0)) * 2 - 1, -1, 1), fl = (vn(x * 3.4 + sd, hg * 0.55 + sd) - 0.5) * (0.5 + vn(x * 0.7, hg * 0.9 + sd)), fl2 = vn(x * 9 + sd * 2, hg * 2.4) - 0.5, fr = vn(x * 0.45 + sd, hg * 6 + sd * 3), blk = vn(x * 1.6 + sd * 5, hg * 1.4);
        nx = Math.sign(cx) * Math.pow(Math.abs(cx), spire ? 1 : 2.5) * 0.92 + fl * 0.5 + fl2 * 0.22 + (blk - 0.5) * 0.3; nz = tk * 0.95 + 0.28 * ss(0.8, 0.86, fr) * (1 - ss(0.88, 0.92, fr)) - 0.22 * ss(0.74, 0.78, fr) * (1 - ss(0.8, 0.82, fr)); /* (fluting, blocky joints, and thin horizontal fractures: a lit ledge over a shadowed seam) */ ny = Math.sqrt(Math.max(0.05, 1 - Math.min(0.95, nx * nx)));
        const band = hg * 1.45 + (vn(x * 0.5 + sd, hg * 0.25) - 0.5) * 0.55, bi = Math.floor(band), bf = band - bi, c0 = STRATA[md(bi + sd, STRATA.length)], c1 = STRATA[md(bi + 1 + sd, STRATA.length)], eb = ss(0.8, 1, bf), n = 0.88 + 0.22 * vn(x * 5 + sd, hg * 2);
        const jx = md(x * 0.6 + hh(bi, sd, 5) * 7 + 0.12 * Math.sin(hg * 6 + bi) + 0.05 * Math.sin(hg * 17), 1), joint = tk > 0.3 || hh(Math.floor(x * 0.6 + hh(bi, sd, 5) * 7), bi, sd) > 0.45 ? 0 : (1 - ss(0.008, 0.03, Math.abs(jx - 0.5))) * ss(0.05, 0.25, bf) * (1 - ss(0.75, 0.95, bf)), gr2 = 0.94 + 0.12 * vn(x * 15 + sd, hg * 15);
        M.r = lerp(c0[0], c1[0], eb) * n * gr2; M.g = lerp(c0[1], c1[1], eb) * n * gr2; M.b = lerp(c0[2], c1[2], eb) * n * gr2; if (bf > 0.88 && tk === 0) nz += 0.3; if (joint > 0) { nx += (jx < 0.5 ? -0.35 : 0.35) * joint; M.r *= 1 - 0.22 * joint; M.g *= 1 - 0.22 * joint; M.b *= 1 - 0.22 * joint; }   /* (vertical joints splitting each stratum into blocks) */   // (a ledge at each hard band)
        if (tk > 0) { const g = vn(x * 9 + sd, hg * 9), bo = ss(0.72, 0.78, vn(x * 11 + sd, hg * 11 + 2)), k = ss(0, 0.6, tk); nz += bo * 0.6 * (vn(x * 11 + sd, (hg + 0.05) * 11 + 2) < vn(x * 11 + sd, hg * 11 + 2) ? 1 : -0.6); M.r = lerp(M.r, lerp(0.72, PLAIN[0], tk) * (0.86 + 0.28 * g), k); M.g = lerp(M.g, lerp(0.38, PLAIN[1], tk) * (0.86 + 0.28 * g), k); M.b = lerp(M.b, lerp(0.2, PLAIN[2], tk) * (0.86 + 0.28 * g), k); M.r *= 1 - 0.3 * bo; M.g *= 1 - 0.34 * bo; M.b *= 1 - 0.34 * bo; }
        M.rg = 0.88; M.ao = (0.74 + 0.26 * (0.5 + fl)) * (0.7 + 0.3 * ss(0, 0.6, hg)) * (1 - 0.25 * (1 - ss(0, 0.5, Math.abs(hg - m.ht))) * (tk > 0 ? 0 : 1));
        if (m.arch && !spire) { const q = Math.hypot((x - AX) / AW, (hg - AY) / AH); if (q < 1.35) { const r2 = ss(1.35, 1.0, q); M.ao *= 1 - 0.45 * r2; nx += (x - AX) / AW * 0.4 * r2; nz -= (hg - AY) / AH * 0.4 * r2; } } }
      const l = Math.hypot(nx, ny, nz); K.shade(nx / l, ny / l, nz / l); K.put(S, px, py, a); }
    S.unlock();
    // its shadow on the clay, falling to the right and a little back; soft-edged
    const c = S.c; c.save(); S.T(); c.globalCompositeOperation = 'destination-over'; const sx0 = m.w * 0.55 + 0.9, rx = m.w + m.tal + 1.4, g = c.createRadialGradient(sx0, 0.05, 0, sx0, 0.05, rx);
    g.addColorStop(0, 'rgba(84,30,12,.42)'); g.addColorStop(0.6, 'rgba(84,30,12,.22)'); g.addColorStop(1, 'rgba(84,30,12,0)'); c.fillStyle = g; c.translate(sx0, 0.05); c.scale(1, Math.min(0.16, 0.95 / rx)); c.translate(-sx0, -0.05); c.beginPath(); c.arc(sx0, 0.05, rx, 0, TAU); c.fill(); c.restore(); }
  /* a field of hoodoos: slender eroded columns, banded and pinched, each under its dark capstone (v 0, 1) */
  function paintHoodoo(K, S, v) { const R = R1(77 + v * 13), n = v ? 5 : 4, cols = []; for (let i = 0; i < n; i++) cols.push({ x: -1.6 + i * (3.4 / (n - 1)) + (R() - 0.5) * 0.4, by: -(R() * 0.25), H: 1.5 + R() * 1.8, r: 0.28 + R() * 0.16, ph: R() * 6 }); cols.sort((p, q) => p.by - q.by);
    for (const co of cols) { const prof = h => co.r * (0.78 + 0.2 * Math.sin(h * 3.6 + co.ph) + 0.08 * Math.sin(h * 9.1 + co.ph * 2)) * (1 - 0.22 * h / co.H) + 0.35 * ss(0.45, 0, h);
      K.rev(S, co.x, co.by, prof, 0, co.H, { top: true, mat: (u, h, ao) => { const band = h * 2.2 + Math.sin(u * 3 + co.ph) * 0.1, c0 = STRATA[md(Math.floor(band) + 3, STRATA.length)], nn = 0.86 + 0.24 * K.vn(u * 6 + co.ph, h * 5); K.M.r = c0[0] * nn; K.M.g = c0[1] * nn; K.M.b = c0[2] * nn; K.M.rg = 0.9; },
        capMat: () => { K.M.r = 0.5; K.M.g = 0.3; K.M.b = 0.22; K.M.rg = 0.9; } });
      K.ball(S, co.x, co.by - co.H - 0.12, co.r * 1.5, co.r * 0.75, (dx, dy) => { const nn = 0.8 + 0.3 * K.vn(dx * 5 + co.ph, dy * 5); K.M.r = 0.42 * nn; K.M.g = 0.26 * nn; K.M.b = 0.2 * nn; K.M.rg = 0.85; }); }
    S.unlock(); const c = S.c; c.save(); S.T(); c.globalCompositeOperation = 'destination-over'; const g = c.createRadialGradient(0.9, 0.05, 0, 0.9, 0.05, 3.2); g.addColorStop(0, 'rgba(84,30,12,.36)'); g.addColorStop(1, 'rgba(84,30,12,0)'); c.fillStyle = g; c.translate(0.9, 0.05); c.scale(1, 0.16); c.translate(-0.9, -0.05); c.beginPath(); c.arc(0.9, 0.05, 3.2, 0, TAU); c.fill(); c.restore(); }
  const M0 = K => { if (K.M0) K.M0(); };
  /* the upper jaw closing the dusk: a single fossil bone the length of the layout's period (its noise wraps, and the teeth at
     either end are painted again a period over, so copies laid end to end meet with no seam): the maxilla's mass rising into
     shadow, its lower edge a rolled lip swelling over each socket and crossed by zigzag sutures; worn sockets, some empty;
     teeth of every kind (long fangs, a great fang, chipped and broken ones, cusped molars), stained toward the root, lit from
     below by the dusk and rimmed by it */
  const JAWP = 25.6;
  const JAWT = (() => { const R = R1(911), kinds = ['molar', 'molar', 'chip', 'fang', 'empty', 'fang', 'stump', 'molar', 'fang', 'great', 'chip', 'molar', 'empty', 'fang', 'stump', 'molar'], out = []; let x = 0;
    for (const k of kinds) { const step = k === 'molar' ? 1.45 : k === 'great' ? 2.0 : 1.6; x += step / 2; out.push({ x, k, L: k === 'great' ? 5.2 + R() * 0.6 : k === 'fang' ? 2.6 + R() * 1.8 : k === 'chip' ? 2.0 + R() * 0.9 : 1.0 + R() * 0.4, lean: (R() - 0.5) * 0.7, r: 0.38 + R() * 0.1, sd: R() * 50 }); x += step / 2; }
    const f = JAWP / x; for (const t of out) t.x *= f; return out; })();
  const JSUT = [3.1, 11.7, 19.9];
  function paintJaw(K, S) { const { M } = K, P = S.P, per = JAWP, half = per / 2, pd = d => md(d + half, per) - half;
    const nzP = (X, y, f, sd) => pvn(X * f, y * f + 50, Math.max(1, Math.round(per * f)), sd);
    const ridge = X => { let sock = 0; for (const t of JAWT) { const d = pd(X - t.x); sock += Math.exp(-((d / 0.6) ** 2)) * (t.k === 'empty' ? 0.6 : 1); } return [0.1 * Math.sin(TAU * X / per * 2) + 0.16 * (nzP(X, 0, 0.35, 3) - 0.5), 0.74 + 0.26 * (nzP(X, 0, 0.6, 5) - 0.5) + 0.2 * Math.min(1.2, sock)]; };
    S.lock();
    for (let px = 0; px < S.w; px++) { const X = md((px + 0.5) / P, per), [yc, r] = ridge(X), e = 0.5 / P, [yc2, r2] = ridge(X + e), drdx = (r2 + yc2 - r - yc) / e;
      for (let py = 0; py < S.h; py++) { const y = (py + 0.5 - S.ay) / P, dy = y - yc; if (dy > r + 1 / P || y < -5.8) continue;
        const tY = -2.4 - 1.5 * nzP(X, 0, 0.45, 31) - 0.7 * nzP(X, 0, 1.6, 37);   /* (the mass's own uneven top, varying along it) */
        let a = clamp((r - dy) * P + 0.5, 0, 1) * ss(tY - 0.4, tY + 1.2, y); if (a <= 0.003) continue; M0(K); let nx, ny, nz, roll = dy >= -r;
        if (roll) { const q = clamp(dy / r, -1, 1); ny = Math.sqrt(Math.max(0, 1 - q * q)); nz = -q; nx = -drdx * 0.35 * (q > 0 ? 1 : 0.4); }
        else { const br = nzP(X, y, 0.45, 23) - 0.5, br2 = nzP(X + 7, y, 0.9, 29) - 0.5; ny = 0.92; nz = -0.1 + br * 0.6; nx = br2 * 0.5; }   // (the maxilla's broad swells and hollows)
        const b1 = nzP(X, y, 2.0, 7) - 0.5, b2 = nzP(X, y, 5.0, 9) - 0.5; nx += b1 * 0.3 + b2 * 0.12; nz += (nzP(X + 3, y, 2.0, 11) - 0.5) * 0.25;
        const n1 = nzP(X, y, 1.3, 13), n2 = nzP(X, y, 4.4, 17), pit = nzP(X, y, 11, 19); let alb = 0.8 + 0.24 * n1 - 0.08 * n2 - (pit > 0.84 ? (pit - 0.84) * 2.2 : 0), ao = 1;
        for (const xs of JSUT) { const dd = Math.abs(pd(X - xs - 0.09 * Math.sin(y * 23 + xs) - 0.05 * Math.sin(y * 57 + xs * 3))); if (dd < 0.05) { const k = 1 - dd / 0.05; ao *= 1 - 0.6 * k; alb -= 0.12 * k; } }   // (sutures)
        if (roll) for (const t of JAWT) { const d = pd(X - t.x); if (Math.abs(d) > 0.9) continue; const es = Math.hypot(d / 0.44, (dy - r * 0.74) / 0.26);
          if (es < 1) { ao *= t.k === 'empty' ? 0.25 + 0.4 * es : 0.55; alb -= 0.1; nz -= (dy - r * 0.74) / 0.26 * 0.4; nx -= d / 0.44 * 0.4; }   // (the socket's hollow)
          else if (es < 1.3) { alb += 0.07; nz += (dy - r * 0.74) / 0.26 * 0.25; nx += d / 0.44 * 0.25; } }   // (its rim, worn smooth and pale)
        if (!roll) ao *= 0.12 + 0.88 * ss(-5.0, -0.5, y);   // (the maxilla's mass going up into the shadow of the palate)
        M.r = 0.86 * alb; M.g = 0.77 * alb; M.b = 0.6 * alb; M.rg = 0.62 + 0.25 * n2; M.ao = ao * (0.82 + 0.18 * n1); if (!roll) { M.sh = 0.3 * ao; M.r *= 0.85; M.g *= 0.8; M.b *= 0.8; }
        const l = Math.hypot(nx, ny, nz); K.shade(nx / l, ny / l, nz / l); K.put(S, px, py, a); } }
    // the teeth (a period either side too, so those at the ends wrap round)
    const enamel = (t, s2, k, sd, tip) => { const n = K.vn(t * 5 + sd, s2 * 5 + sd), cr = K.vn(t * 7 + sd, s2 * 7 + 3); let b = 0.86 + 0.16 * n - (Math.abs(cr - 0.5) < 0.015 ? 0.2 : 0); const st = ss(0.3, 0, t);
      M.r = (0.9 - st * 0.25) * b; M.g = (0.83 - st * 0.32) * b; M.b = (0.66 - st * 0.34) * b; M.rg = lerp(0.6, 0.32, tip ? ss(0.4, 1, t) : 0.4); M.cc = 0.15 + 0.1 * t; M.ao *= 0.85 + 0.15 * n; };
    for (const off of [-per, 0, per]) for (const t of JAWT) { const x0 = t.x - half + off; if (x0 < -half - 3 || x0 > half + 3 || t.k === 'empty') continue; const [yc, r] = ridge(t.x), y0 = yc + r * 0.6;
      const L = t.k === 'molar' ? 0.85 : t.L, r0 = t.k === 'great' ? 0.56 : t.k === 'molar' ? 0.56 : t.r, pts = []; for (let j = 0; j <= 12; j++) { const u2 = j / 12; pts.push([x0 + t.lean * u2 * u2 * (t.k === 'molar' ? 0 : 1), y0 + L * u2]); }
      const prof = t.k === 'molar' ? (u2 => r0 * (0.9 + 0.12 * Math.sin(u2 * Math.PI)) * (u2 > 0.8 ? Math.sqrt(Math.max(0, 1 - ((u2 - 0.8) / 0.2) ** 2)) * 0.5 + 0.5 : 1))
        : t.k === 'stump' ? (u2 => r0 * (1.02 - 0.1 * u2) * (u2 > 0.9 ? Math.sqrt(Math.max(0, 1 - ((u2 - 0.9) / 0.1) ** 2)) * 0.25 + 0.75 : 1))
        : t.k === 'chip' ? (u2 => Math.max(0.15, r0 * (u2 < 0.35 ? 0.92 + 0.14 * Math.sin(u2 / 0.35 * Math.PI / 2) : 1.06 * Math.pow(1 - (u2 - 0.35) / 0.65, 0.85))))
        : (u2 => Math.max(0.02, r0 * (u2 < 0.35 ? 0.92 + 0.14 * Math.sin(u2 / 0.35 * Math.PI / 2) : 1.06 * Math.pow(1 - (u2 - 0.35) / 0.65, 0.85))));
      tubeP(K, S, pts, prof, (u2, s2) => { enamel(t.k === 'molar' ? 0.25 + u2 * 0.6 : u2, s2, t.k, t.sd, t.k === 'fang' || t.k === 'great');
        if (t.k === 'molar' && u2 > 0.72 && Math.abs(s2) < 0.16) M.ao *= 0.55;   // (the groove between its cusps)
        if (t.k === 'chip' && u2 > 0.9) { M.ao *= 0.75; M.rg = 0.8; M.cc = 0; }   // (the chipped face, dull)
        if (t.k === 'stump' && u2 > 0.82) { const j2 = Math.sin(s2 * 9 + t.sd) * 0.5 + 0.5; M.ao *= 0.6 + 0.3 * j2; M.rg = 0.85; M.cc = 0; } });   // (the broken end, rough)
      if (t.k === 'stump') { const ex = x0 + t.lean, ey = y0 + L; K.ball(S, ex + 0.1, ey + 0.02, 0.16, 0.12, () => { enamel(0.85, 0.4, t.k, t.sd, false); M.ao *= 0.7; M.rg = 0.85; M.cc = 0; }); } } }
  // a round bar along a path with its own radius along it (prof(t), t 0..1 by length): teeth that swell at the root and taper
  // to the tip in one piece; mat(t, s, ao) as the kit's tube
  function tubeP(K, S, pts, prof, mat) { const P = S.P, Q = pts.map(p => [S.ax + p[0] * P, S.ay + p[1] * P]), Lc = [0]; for (let i = 1; i < Q.length; i++) Lc.push(Lc[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1])); const LT = Lc[Lc.length - 1] || 1;
    let rm = 0; for (let i = 0; i <= 20; i++) rm = Math.max(rm, prof(i / 20)); rm *= P; let xa = 1e9, xb = -1e9, ya = 1e9, yb = -1e9; for (const q of Q) { xa = Math.min(xa, q[0]); xb = Math.max(xb, q[0]); ya = Math.min(ya, q[1]); yb = Math.max(yb, q[1]); }
    xa = Math.max(0, Math.floor(xa - rm - 1)); xb = Math.min(S.w - 1, Math.ceil(xb + rm + 1)); ya = Math.max(0, Math.floor(ya - rm - 1)); yb = Math.min(S.h - 1, Math.ceil(yb + rm + 1)); S.lock();
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { const X = px + 0.5, Y = py + 0.5; let bd = 1e9, bt = 0, bx = 0, by = 0, tl = 0;
      for (let i = 1; i < Q.length; i++) { const ax = Q[i - 1][0], ay = Q[i - 1][1], dx = Q[i][0] - ax, dy = Q[i][1] - ay, ll = dx * dx + dy * dy || 1e-6; let t2 = ((X - ax) * dx + (Y - ay) * dy) / ll; t2 = t2 < 0 ? 0 : t2 > 1 ? 1 : t2; const qx = ax + dx * t2, qy = ay + dy * t2, d = (X - qx) ** 2 + (Y - qy) ** 2; if (d < bd) { bd = d; bt = (Lc[i - 1] + t2 * (Lc[i] - Lc[i - 1])) / LT; bx = X - qx; by = Y - qy; tl = t2; } }
      const d = Math.sqrt(bd), r = prof(bt) * P; if (d > r + 1 || r < 0.3) continue; const s2 = Math.min(1, d / r), ux = d > 1e-6 ? bx / d : 0, uy = d > 1e-6 ? by / d : 0;
      const nx = ux * s2, nz = -uy * s2, ny = Math.sqrt(Math.max(0, 1 - s2 * s2)); M0(K); K.M.ao = 0.75 + 0.25 * ny; mat(bt, s2 * (ux >= 0 ? 1 : -1), K.M.ao); K.shade(nx, ny, nz); K.put(S, px, py, clamp(r - d + 0.6, 0, 1)); void tl; } }
  /* the moon: a sphere lit from the upper left (a full moon just past full: the lower right limb a little in shade), its
     limb darkening softly; grey-blue maria; craters with dark floors, a rim lit on the side toward the light and shadowed on the
     other, a few with faint rays; the brightest of it well below white (the GPU's halo lies round it, not on it) */
  const CRATERS = (() => { const R = R1(4242), out = []; for (let i = 0; i < 30; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 0.94, r = 0.03 + Math.pow(R(), 2.2) * 0.17; out.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, r, ray: r > 0.1 && R() < 0.5 }); } return out; })();
  function paintMoon(K, S) { const P = S.P; S.lock(); const d = S.d, fbm = (x, y) => pfbm(x + 8, y + 8, 64, 5), lx = -0.55, ly = -0.42, lz = 0.72;
    for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, r = Math.hypot(x, y); if (r > 1.0 + 1.5 / P) continue;
      const z = Math.sqrt(Math.max(0, 1 - r * r)), u = x / (z + 0.5), w = y / (z + 0.5);
      // maria: broad soft darker seas
      const mar = ss(0.4, 0.58, fbm(u * 1.1 + 3.1, w * 1.1 + 1.7)) * 0.85 + ss(0.5, 0.7, fbm(u * 2.3 + 9, w * 2.3)) * 0.15;
      let alb = 0.8 - 0.3 * mar + 0.05 * (fbm(u * 7, w * 7) - 0.5), nxp = x, nyp = y, nzp = z;
      for (const cr of CRATERS) { const dx = x - cr.x, dy = y - cr.y, q = Math.hypot(dx, dy) / cr.r; if (q > 2.6) continue;
        if (q < 1.25) { const bowl = q < 0.8 ? 1 : ss(1.1, 0.8, q); alb -= 0.05 * bowl; const ring = Math.exp(-(((q - 0.95) / 0.2) ** 2)), rx = dx / (q * cr.r + 1e-6), ry = dy / (q * cr.r + 1e-6), tilt = (q < 0.95 ? -1 : 0.6) * ring * 0.42 - (q < 0.8 ? 0.2 * (1 - q / 0.8) : 0);
          nxp += rx * tilt * 0.45; nyp += ry * tilt * 0.45; }
        else if (cr.ray) alb += 0.05 * Math.pow(Math.max(0, Math.cos(Math.atan2(dy, dx) * 9 + cr.x * 40)), 6) * ss(2.6, 1.2, q); }
      const nl = Math.hypot(nxp, nyp, nzp) || 1, ndl = (nxp * lx + nyp * ly + nzp * lz) / nl, lam = 0.18 + 0.82 * clamp(ndl, 0, 1), limb = 0.62 + 0.38 * Math.pow(z, 0.4);
      const L = clamp(alb * lam * limb * 1.02, 0, 0.9), i = (py * S.w + px) * 4; d[i] = L * 0.9 * 255; d[i + 1] = L * 0.95 * 255; d[i + 2] = Math.min(255, L * 1.06 * 255); d[i + 3] = clamp((1 - r) * P + 0.5, 0, 1) * 255; }
    S.unlock(); }
  function paintSun(K, S, v) { const c = S.c, P = S.P; c.save(); c.setTransform(1, 0, 0, 1, S.ax, S.ay);
    const halo = c.createRadialGradient(0, 0, P * 0.9, 0, 0, P * 1.6); halo.addColorStop(0, v ? 'rgba(255,252,240,.55)' : 'rgba(255,190,110,.5)'); halo.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = halo; c.fillRect(-P * 1.6, -P * 1.6, P * 3.2, P * 3.2);
    const g = c.createRadialGradient(-P * 0.1, -P * 0.12, 0, 0, 0, P); if (v) { g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.75, '#FFFDF6'); g.addColorStop(0.95, '#FFF2D6'); g.addColorStop(1, 'rgba(255,240,210,0)'); }
    else { g.addColorStop(0, '#FFF8E4'); g.addColorStop(0.45, '#FFE2A0'); g.addColorStop(0.82, '#FFB25E'); g.addColorStop(0.97, '#F2843E'); g.addColorStop(1, 'rgba(240,120,60,0)'); }
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, P, 0, TAU); c.fill();
    if (!v) { c.save(); c.beginPath(); c.arc(0, 0, P * 0.995, 0, TAU); c.clip(); for (let i = 0; i < 5; i++) { const y = P * (0.15 + i * 0.17), hgt = P * (0.035 + i * 0.012); c.fillStyle = `rgba(150,50,40,${0.1 + i * 0.05})`; c.beginPath(); c.ellipse(Math.sin(i * 2.1) * P * 0.1, y, P * 1.1, hgt, 0, 0, TAU); c.fill(); } c.restore(); }
    c.restore(); }
  function paintGalaxy(K, S) { const c = S.c, P = S.P, R = R1(5151); c.save(); S.T(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) { const x = (R() - 0.5) * 38, y = (R() - 0.5) * 2.2 * (1 - Math.abs(x) / 24), w = 2 + R() * 4.5, col = ['70,80,140', '110,90,160', '60,110,150', '150,120,170'][i % 4]; const g = c.createRadialGradient(x, y, 0, x, y, w); g.addColorStop(0, `rgba(${col},.32)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.save(); c.translate(x, y); c.scale(1, 0.45); c.translate(-x, -y); c.fillRect(x - w, y - w, w * 2, w * 2); c.restore(); }
    c.globalCompositeOperation = 'source-over'; for (let i = 0; i < 18; i++) { const x = (R() - 0.5) * 34, y = (R() - 0.5) * 0.9, w = 1.2 + R() * 3; c.fillStyle = 'rgba(4,6,16,.35)'; c.beginPath(); c.ellipse(x, y, w, 0.12 + R() * 0.25, (R() - 0.5) * 0.3, 0, TAU); c.fill(); }
    c.globalCompositeOperation = 'lighter'; const n = Math.round(260 * Math.min(1.6, P / 8)); for (let i = 0; i < n; i++) { const x = (R() - 0.5) * 38, sp = 1 - Math.abs(x) / 21, y = (R() + R() + R() - 1.5) * 1.6 * Math.max(0.2, sp), a = (0.25 + R() * 0.6) * Math.max(0.2, sp); c.fillStyle = `rgba(${R() > 0.85 ? '255,226,200' : '220,232,255'},${a})`; c.beginPath(); c.arc(x, y, (0.5 + R() * 0.7) / P, 0, TAU); c.fill(); }
    c.restore(); const m = mkc(S.w, S.h), mc = m.getContext('2d'), gx = mc.createLinearGradient(0, 0, S.w, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(0.18, '#000'); gx.addColorStop(0.82, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)'); mc.fillStyle = gx; mc.fillRect(0, 0, S.w, S.h);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-in'; c.drawImage(m, 0, 0); c.restore(); m.width = m.height = 1; }
  // a plain painting surface (for the pieces painted without the kit)
  function surf(b, P) { const w = Math.ceil((b[2] - b[0]) * P), h = Math.ceil((b[3] - b[1]) * P), cv = mkc(w, h), c = cv.getContext('2d', { willReadFrequently: true }); const S = { cv, c, P, w, h, ax: -b[0] * P, ay: -b[1] * P, d: null, img: null };
    S.T = () => c.setTransform(P, 0, 0, P, S.ax, S.ay); S.lock = () => { if (S.img) return; c.setTransform(1, 0, 0, 1, 0, 0); S.img = c.getImageData(0, 0, w, h); S.d = S.img.data; }; S.unlock = () => { if (!S.img) return; c.setTransform(1, 0, 0, 1, 0, 0); c.putImageData(S.img, 0, 0); S.img = S.d = null; S.T(); }; S.T(); return S; }
  const CACHE = new Map();
  function paintPic(name, v, ln, P, haze) { const D = DEF[name]; if (!D) return null; const B = D.kit ? BP() : null; if (D.kit && !B) return null; const K = B ? B.kit : (BP() ? BP().kit : null), b = D.box(v), t0 = now(); let S = null;
    try { S = D.kit ? K.surface(b[0], b[1], b[2], b[3], P) : surf(b, P); if (D.kit) lit(K, ln, () => { D.paint(K, S, v, ln); S.unlock(); }); else { D.paint(K, S, v, ln); if (S.unlock) S.unlock(); } } catch (e) { if (typeof console !== 'undefined') console.warn('DUNE_SKY', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = mkc(S.w, S.h), c = cv.getContext('2d'); c.drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;
    if (D.sink) { const g = c.createLinearGradient(0, S.ay - P * D.sink, 0, S.ay + P * 0.25); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = g; c.fillRect(0, S.ay - P * D.sink, cv.width, P * (D.sink + 1)); c.globalCompositeOperation = 'source-over'; }   // (its foot sinking into the sand)
    if (haze) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = haze; c.fillRect(0, 0, cv.width, cv.height); }
    STATS.painted++; STATS.paintMs += now() - t0; return { cv, ax: S.ax, ay: S.ay, P }; }
  // name|v|light|P[|haze]; budget: a frame paints at most ~10 ms of them unless forced (the loading screen forces)
  let budT = 0, budMs = 0;
  function pic(name, v, ln, P, haze, force) { const key = name + '|' + v + '|' + ln + '|' + P + (haze ? '|' + haze : ''); let s = CACHE.get(key); if (s) return s;
    { const pre = name + '|' + v + '|' + ln + '|'; for (const [k2, s2] of CACHE) if (k2.startsWith(pre) && (k2.split('|')[4] || '') === (haze || '') && s2.P >= P && s2.P <= P * 3.2) return s2; }   // (a sharper painting of it already kept serves a smaller drawing: no second copy)
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 10) { const pre = name + '|' + v + '|' + ln + '|'; for (const [k2, s2] of CACHE) if (k2.startsWith(pre) && (!haze === !k2.endsWith(haze || '#'))) return s2; STATS.misses++; return null; }
    const t1 = now(); s = paintPic(name, v, ln, P, haze); budMs += now() - t1; if (s) { if (CACHE.size > 60) release(true);
      { const pre = name + '|' + v + '|' + ln + '|'; for (const [k2, s2] of [...CACHE]) if (k2.startsWith(pre) && (k2.split('|')[4] || '') === (haze || '') && s2.P < P) { s2.cv.width = s2.cv.height = 1; CACHE.delete(k2); } }   // (a smaller painting of it given back: the new one serves it)
      CACHE.set(key, s); } return s; }
  // a piece's sharpness: its pixels per tile from a short ladder (one picture serves every size near it: the same rib far off
  // and nearer is one painting, not five), capped so its longest side stays within ~720 px
  const LADDER = [16, 28, 48, 80, 140, 240];
  function picP(name, v, T, k, s) { const b = DEF[name].box(v), ext = Math.max(b[2] - b[0], b[3] - b[1]), want = T * Math.min(1.5, k) * s * 0.92, cap = Math.floor((DEF[name].cap || 600) / ext); let P = LADDER.find(q => q >= want) || LADDER[LADDER.length - 1]; return Math.max(6, Math.min(P, cap)); }
  function drawPic(c, V, name, v, x, y, s, o) { o = o || {}; const T = V.T, P = picP(name, v, T, V.k, s), sp = pic(name, v, V.light, P, o.haze, o.force); if (!sp) return false;
    const f = T * s / sp.P; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; c.translate(x, y); if (o.flip) c.scale(-1, 1); if (o.rot) c.rotate(o.rot); c.drawImage(sp.cv, -sp.ax * f, -sp.ay * f, sp.cv.width * f, sp.cv.height * f); c.restore(); STATS.pics++; return true; }

  /* ======================= the view ======================= */
  /* V: { W, H, T, sx(x), sy(y) (world tiles -> screen px), t (seconds), land, light, hy, span, k (device px per css px) } */
  // where a thing of the sky stands: held a set height above the top of the stage's land (spec.t, tiles) so that the jaw, the sun,
  // the moon and the aurora are seen from its upper edge whatever its size; with no stage to go by, on the sky's own scale (spec.a)
  const skyY = (V, spec) => V.sy(V.top != null && spec.t != null ? Math.min(V.top + spec.t, V.hy + (spec.a - 0.1) * V.span * 0.5) : V.hy + spec.a * V.span);
  let LIVE = null;
  function view(X, land) { const L = LIVE; const T = X.Tz(), ln = land || (L && L.land) || 'dunes'; return { W: X.W(), H: X.H(), T, sx: X.sx, sy: X.sy, t: X.g ? X.g.t : now() / 1000, land: ln, light: LANDS[ln].light, hy: L ? L.hy : X.me.y, top: L ? L.top : null, span: L ? L.span : 18, k: 1 }; }
  const gpuF = () => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__DSKY_GL === 0)) return null; const F = HAS_W && window.NIDHOGG_MOVES && window.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  // the copies of a thing repeated every `per` tiles that can be on the screen (its reach r tiles about its place)
  function each(V, per, fx, r, f) { const x0 = (V.W * -0.5) / V.T, camX = (V.W / 2 - V.sx(0)) / V.T, lo = camX - V.W / 2 / V.T - r, hi = camX + V.W / 2 / V.T + r; void x0;
    for (let n = Math.floor((lo - fx * per) / per); n <= Math.ceil((hi - fx * per) / per); n++) { const xw = fx * per + n * per; if (xw < lo || xw > hi) continue; f(xw, n); } }
  function vista(c, V, o) { o = o || {}; const L = LANDS[V.land]; if (!L) return; const W = V.W, H = V.H, T = V.T, ya = a => V.sy(V.hy + a * V.span), yo = dy => V.sy(V.hy + dy), lf = lowFx(); STATS.frames++;
    const camY = V.hy + (H / 2 - V.sy(V.hy)) / T, top = camY - H / 2 / T, bot = camY + H / 2 / T;   // (the rows of the world on the screen)
    // the sky's column
    const col = column(V.land), y0 = ya(A0), y1 = ya(A1); c.save(); c.imageSmoothingEnabled = true;
    if (y0 > 0) { c.fillStyle = L.sky[0][1]; c.fillRect(0, 0, W, Math.min(H, y0 + 1)); } if (y1 < H) { c.fillStyle = L.sky[L.sky.length - 1][1]; c.fillRect(0, Math.max(0, y1 - 1), W, H - y1 + 1); }
    if (y1 > 0 && y0 < H) { const r0 = clamp((0 - y0) / (y1 - y0), 0, 1), r1 = clamp((H - y0) / (y1 - y0), 0, 1), s0 = r0 * NCOL, s1 = r1 * NCOL; if (s1 - s0 > 0.5) c.drawImage(col, 0, s0, 2, s1 - s0, -2, y0 + r0 * (y1 - y0), W + 4, (r1 - r0) * (y1 - y0)); }
    c.restore();
    // the cracked clay of the plain (the Rust Flats): finer far off, firmer nearer; under the ranges and mesas standing on it
    if (L.cracks) { const yc = yo(0.5); if (yc < H) { const p = crackPat(V.k); if (p) { c.save(); c.fillStyle = p; for (const [a0, a1, al, sc] of [[0.5, 3, 0.1, 0.32], [3, 8, 0.16, 0.55], [8, 16, 0.2, 0.8], [16, 999, 0.24, 1]]) { const yt = yo(a0), yb2 = Math.min(H, yo(a1)); if (yb2 <= 0 || yt >= H) continue; const kk = Math.min(2, Math.max(1, Math.round(V.k)));
      try { p.setTransform(new DOMMatrix([sc / kk, 0, 0, sc * 0.6 / kk, md(V.sx(0) * 1, 160 * sc), yt])); } catch (e) {} c.globalAlpha = al; c.fillRect(0, Math.max(0, yt), W, yb2 - Math.max(0, yt)); } c.restore(); } } }
    // the stars, fading in as the sky darkens (anchored to the stage: they keep their places as the camera moves)
    if (L.stars) { const yb = ya(L.starsA[0]); if (yb > 0) { const sp = starTile(L.stars, V.k), m = new DOMMatrix([1 / Math.min(2, V.k) * (sp.S / sp.N) * Math.min(2, V.k), 0, 0, (sp.S / sp.N), md(V.sx(0), sp.S), md(V.sy(0), sp.S)]); try { sp.pat.setTransform(m); } catch (e) {}
      const steps = 4; c.save(); c.fillStyle = sp.pat; for (let i = 0; i < steps; i++) { const aT = lerp(L.starsA[1], L.starsA[0], i / steps), aB = lerp(L.starsA[1], L.starsA[0], (i + 1) / steps), yt = i === 0 ? 0 : ya(aT), ybb = ya(aB); if (ybb <= 0 || yt >= H) continue; c.globalAlpha = (1 - (i + 0.5) / steps) * 0.9 + 0.05; c.fillRect(0, Math.max(0, yt), W, Math.min(H, ybb) - Math.max(0, yt)); } c.restore(); } }
    // the galaxy's band (night)
    if (L.galaxy) each(V, L.per, L.galaxy.fx, 26, xw => { const X = V.sx(xw), Y = skyY(V, L.galaxy); if (Y < -T * 30 || Y > H + T * 30) return; c.save(); c.globalCompositeOperation = 'lighter'; drawPic(c, V, 'galaxy', 0, X, Y, 1, { rot: -0.42, alpha: 0.85 }); c.restore(); });
    // the sun or the moon, low over the ranges
    const orb = L.sun || L.moon, orbY = o2 => L.sun && L.sun.y != null ? yo(L.sun.y) : skyY(V, o2);
    if (orb) each(V, L.per, orb.fx, (orb.r + 2) * 4, xw => { const X = V.sx(xw), Y = orbY(orb), R = orb.r * T; if (Y < -R * 4 || Y > H + R * 4) return;
      if (L.moon) return;   // (the moon is laid after the sky's light: below)
      else { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = L.sun.v ? 0.5 : 0.42; if (typeof blitSized === 'function' && typeof glowSprite === 'function') blitSized(c, glowSprite(L.sun.glow), X - R * 6, Y - R * (L.sun.v ? 6 : 3.4), R * 12, R * (L.sun.v ? 12 : 6.8)); c.restore(); drawPic(c, V, 'sun', L.sun.v, X, Y, orb.r); } });
    // the light of the sky (the GPU): the corona, the aurora, the stars' twinkle
    const F = o.gpu === false ? null : gpuF(); if (F) { try { const Q = F.begin(c, null); skyLight(Q, V, L, lf); if (Q.nl || Q.ns) { STATS.quads += (Q.nl + Q.ns) / 6; F.flush(c); } } catch (e) {} }
    if (L.moon) each(V, L.per, L.moon.fx, (L.moon.r + 2) * 4, xw => { const X = V.sx(xw), Y = skyY(V, L.moon), R = L.moon.r * T; if (Y < -R * 2 || Y > H + R * 2) return; drawPic(c, V, 'moon', 0, X, Y, L.moon.r); });
    // the upper jaw closing the dusk overhead: its ridge and the fangs hanging down from it
    if (L.jaw) { const yj = skyY(V, L.jaw); if (yj > -T * 2.5 && yj < H + T * 7) { const per = JAWP; each(V, per, 0, per / 2 + 1, xw => drawPic(c, V, 'jaw', 0, V.sx(xw), yj, 1));
      // the palate above it, in shadow
      if (yj - T * 1.2 > 0) { const g = c.createLinearGradient(0, 0, 0, yj - T * 0.6); g.addColorStop(0, 'rgba(8,3,8,.9)'); g.addColorStop(1, 'rgba(18,8,16,0)'); c.fillStyle = g; c.fillRect(0, 0, W, yj - T * 0.6); } } }
    // the ranges and what stands among them, back to front
    const ZS = L._z || (L._z = [...L.strips.map((s, i) => ({ z: s.z, strip: i })), ...L.items.map(it => ({ z: it.z, it }))].sort((p, q) => p.z - q.z));
    for (const e of ZS) { if (e.strip != null) { const sp = L.strips[e.strip], Yt = yo(sp.y), Hp = sp.h * T; if (Yt > H || Yt + Hp < 0) continue; const P = stripP(sp, T, V.k), s = strip(V.land, e.strip, P), wp = sp.per * T;
        let x = V.sx(sp.phase || 0); x = md(x, wp) - wp; for (; x < W; x += wp) if (x + wp > 0) c.drawImage(s.cv, x, Yt, wp + 0.6, Hp); continue; }
      const it = e.it, Y = yo(it.y); if (Y < -T * 8 * it.s || Y > H + T * 8 * it.s) continue;
      if (it.kind === 'cage') { each(V, L.per, it.fx, 10 * it.s, xw => { for (let j = it.n - 1; j >= 0; j--) { const sj = it.s * (1 - j * 0.13), xc = xw + j * it.s * 1.7, yj = Y - j * 0.2 * T * it.s, al = (it.a == null ? 1 : it.a) * (1 - j * 0.1);   // (a ribcage: arches of mirrored ribs receding in a row)
        drawPic(c, V, 'rib', 0, V.sx(xc - 3.52 * sj), yj, sj, { alpha: al }); drawPic(c, V, 'rib', 0, V.sx(xc + 3.52 * sj), yj, sj, { alpha: al, flip: true }); } }); continue; }
      each(V, L.per, it.fx, 7 * it.s, xw => drawPic(c, V, it.kind, it.v, V.sx(xw), Y, it.s, { alpha: (it.a == null ? 1 : it.a) * (it.haze ? 1 - it.haze * 0.75 : 1), flip: it.flip })); }   /* (aerial perspective: the far ones let the hazy horizon through; one painting each, no tinted copies) */
    // the air (the GPU): veils of sand or mist, heat shimmer and mirages, fireflies, dust and glints
    if (F) { try { const Q = F.begin(c, null); airLight(Q, V, L, lf, top, bot); if (Q.nl || Q.ns) { STATS.quads += (Q.nl + Q.ns) / 6; F.flush(c); } } catch (e) {} }
  }
  // the cracked clay: a wrapping tile of dark crack lines and pale curled edges (160 css px)
  let CRACK = null;
  function crackPat(k) { const kk = Math.min(2, Math.max(1, Math.round(k))); if (CRACK && CRACK.k === kk) return CRACK.p; const S = 160, N = S * kk, cv = mkc(N, N), c = cv.getContext('2d'), R = R1(919); c.scale(kk, kk);
    const pts = []; for (let i = 0; i < 26; i++) pts.push([R() * S, R() * S]);
    c.lineJoin = 'round'; c.lineCap = 'round';
    // the cracks: the edges of the cells (a coarse Voronoi drawn by sampling)
    const img = c.getImageData(0, 0, N, N), d = img.data; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const X = x / kk, Y = y / kk; let d1 = 1e9, d2 = 1e9; for (const [px, py] of pts) for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const q = (X - px - ox) ** 2 + (Y - py - oy) ** 2; if (q < d1) { d2 = d1; d1 = q; } else if (q < d2) d2 = q; }
      const e = Math.sqrt(d2) - Math.sqrt(d1), o = (y * N + x) * 4; if (e < 1.6) { d[o] = 60; d[o + 1] = 22; d[o + 2] = 10; d[o + 3] = 200 * (1 - e / 1.6); } else if (e < 3.2) { d[o] = 255; d[o + 1] = 210; d[o + 2] = 160; d[o + 3] = 60 * (1 - (e - 1.6) / 1.6); } }
    c.putImageData(img, 0, 0); CRACK = { k: kk, cv, p: c.createPattern(cv, 'repeat') }; return CRACK.p; }

  /* ---- the GPU's light: the sky's (under the ranges) ---- */
  function skyLight(Q, V, L, lf) { const T = V.T, W = V.W, H = V.H, ya = a => V.sy(V.hy + a * V.span), t = V.t;
    if (L.sun) each(V, L.per, L.sun.fx, 30, xw => { const X = V.sx(xw), Y = L.sun.y != null ? V.sy(V.hy + L.sun.y) : skyY(V, L.sun), R = L.sun.r * T; if (Y < -R * 12 || Y > H + R * 12) return;
      Q.quad(241, X, Y, R * (L.sun.v ? 9 : 6), 0, 0, R * (L.sun.v ? 9 : 6), L.sun.corona, L.sun.v ? 0.6 : 0.5, L.sun.v ? 0.3 : 0.7, lf ? 0.25 : 0.7, 0.025);
      if (!L.sun.v) Q.glow(X, Y + R * 0.6, R * 9, '#FF7A3A', 0.26, 0.28); });
    if (L.moon) each(V, L.per, L.moon.fx, 20, xw => { const X = V.sx(xw), Y = skyY(V, L.moon), R = L.moon.r * T; if (Y < -R * 5 || Y > H + R * 5) return; Q.glow(X, Y, R * 2.3, '#6A88D0', 0.13); Q.glow(X, Y, R * 5, '#2E4A90', 0.1); });
    if (L.aurora) { const A = L.aurora, Y = skyY(V, A); if (Y > -A.h * T && Y < H + A.h * T * 0.6) { const n = lf ? 1 : 2; for (let i = 0; i < n; i++) each(V, L.per, 0.15 + i * 0.47, A.w * 0.6, xw => { const X = V.sx(xw); if (X < -A.w * T * 0.6 || X > W + A.w * T * 0.6) return;
      Q.quad(240, X + i * T * 6, Y + i * T * 2.6, A.w * T / 2, 0, 0, A.h * T / 2, i ? '#6AE0FF' : '#4CFFB0', i ? 0.8 : 1, 0.13 + i * 0.37, 0.8 + i * 0.3, lf ? 0.3 : 0.9); }); } }
    // the brightest stars twinkling (cells of 6 tiles over the sky that is dark enough)
    if (L.starsA && !lf) { const aEnd = L.starsA[0], yEnd = ya(aEnd); if (yEnd > 0) { const camX = (W / 2 - V.sx(0)) / T, camY = V.hy + (H / 2 - V.sy(V.hy)) / T, C = 6;
      for (let gy = Math.floor((camY - H / 2 / T) / C); gy <= Math.ceil((camY + H / 2 / T) / C); gy++) for (let gx = Math.floor((camX - W / 2 / T) / C); gx <= Math.ceil((camX + W / 2 / T) / C); gx++) { for (let j = 0; j < 2; j++) { if (hh(gx, gy, 71 + j) > (L.stars === 'cold' ? 0.75 : 0.45)) continue;
        const xw = (gx + hh(gx, gy, 72 + j)) * C, yw = (gy + hh(gx, gy, 73 + j)) * C, a = (yw - V.hy) / V.span; if (a > aEnd) continue; const X = V.sx(xw), Y = V.sy(yw), tw = 0.55 + 0.45 * Math.sin(t * (1.3 + hh(gx, gy, 74) * 2.2) + hh(gx, gy, 75) * 9), dk = ss(aEnd, aEnd - 0.3, a);
        Q.star(X, Y, T * (0.16 + hh(gx, gy, 76 + j) * 0.16), 0.55 * tw * dk, L.stars === 'cold' ? '#E6EEFF' : '#FFE6C8'); Q.glow(X, Y, T * 0.35, L.stars === 'cold' ? '#9AB8FF' : '#FFC0A0', 0.18 * tw * dk); } } } } }
  /* ---- the GPU's light: the air (over the ranges) ---- */
  function airLight(Q, V, L, lf, top, bot) { const T = V.T, W = V.W, H = V.H, t = V.t, camX = (W / 2 - V.sx(0)) / T;
    const vs = lf ? L.veils.slice(0, 2) : L.veils; vs.forEach((vl, i) => { const yw = vl.a2 != null ? V.hy + vl.a2 * V.span : V.hy + vl.y; if (yw + vl.h < top - 1 || yw - vl.h > bot + 1) return; const Y = V.sy(yw);
      for (let j = 0; j < 3; j++) each(V, L.per, (i * 0.31 + j / 3) % 1, vl.w * 0.6, xw => { const X = V.sx(xw + Math.sin(t * 0.05 + i + j) * 2); Q.quad(244, X, Y + (j - 1) * T * vl.h * 0.18, vl.w * T / 2, 0, 0, vl.h * T / 2, vl.col, vl.a, vl.spd * (j % 2 ? 1 : 0.8), (i * 3 + j) * 0.137 + 0.05, 0.9); }); });
    if (!lf) for (const sh of L.shimmer) { const yw = V.hy + sh.y; if (yw + sh.h < top || yw - sh.h > bot) continue; each(V, L.per, sh.fx, sh.w * 0.6, xw => Q.quad(242, V.sx(xw), V.sy(yw), sh.w * T / 2, 0, 0, sh.h * T / 2, sh.col, sh.a, (sh.fx * 7) % 1 + 0.1, sh.mode, 1)); }
    // the dust (motes drifting on the wind, anchored to cells of the world)
    const C = 5, gx0 = Math.floor((camX - W / 2 / T) / C) - 1, gx1 = Math.ceil((camX + W / 2 / T) / C) + 1, gy0 = Math.floor(top / C) - 1, gy1 = Math.ceil(bot / C) + 1;
    for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) { const n = lf ? 1 : 2; for (let j = 0; j < n; j++) { if (hh(gx, gy, 91 + j) > 0.6) continue; const ph = hh(gx, gy, 92 + j), sp = 0.6 + ph, u = md(t * 0.04 * sp + ph, 1), xw = (gx + hh(gx, gy, 93 + j)) * C + (u - 0.5) * C * 2.4, yw = (gy + hh(gx, gy, 94 + j)) * C + Math.sin(t * 0.7 + ph * 9) * 0.4;
      if (L.light === 'noon' && yw < V.hy + 0.5) continue;   // (no motes in the noon sky: they would read as stars)
      const X = V.sx(xw), Y = V.sy(yw); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue; const a = Math.sin(u * Math.PI) * (0.4 + 0.3 * Math.sin(t * 2 + ph * 7)); Q.glow(X, Y, T * 0.12, L.motes, a * 0.6); Q.glow(X, Y, T * 0.035, '#FFFFFF', a * 0.7); } }
    // pink crystals glinting far out on the plain (the Rust Flats)
    if (L.glints) { const C2 = 7, gyA = Math.max(Math.floor(top / C2) - 1, Math.floor((V.hy + 0.5) / C2)); for (let gy = gyA; gy <= Math.ceil(bot / C2) + 1; gy++) for (let gx = gx0; gx <= Math.ceil((camX + W / 2 / T) / C2) + 1; gx++) { if (hh(gx, gy, 61) > 0.55) continue; const xw = (gx + hh(gx, gy, 62)) * C2, yw = Math.max(V.hy + 0.6, (gy + hh(gx, gy, 63)) * C2), X = V.sx(xw), Y = V.sy(yw); if (X < -20 || X > W + 20 || Y < -20 || Y > H + 20) continue;
      const tw = Math.pow(0.5 + 0.5 * Math.sin(t * (1.1 + hh(gx, gy, 64)) + hh(gx, gy, 65) * 9), 4), dk = clamp((yw - V.hy) / 6, 0.35, 1); Q.glow(X, Y, T * 0.5 * dk, L.glints, 0.22 * dk); if (tw > 0.05) Q.star(X, Y, T * 0.4 * dk, tw * 0.7, '#FFD6F0'); } }
    // the fireflies of the Moonlit Dunes: swarms over the sand, each fly on its own loop, blinking
    if (L.flies) { const C3 = 10, n = lf ? 8 : 18; for (let gy = Math.floor(top / C3) - 1; gy <= Math.ceil(bot / C3) + 1; gy++) for (let gx = Math.floor((camX - W / 2 / T) / C3) - 1; gx <= Math.ceil((camX + W / 2 / T) / C3) + 1; gx++) { if (hh(gx, gy, 51) > 0.6) continue; const cx = (gx + 0.2 + hh(gx, gy, 52) * 0.6) * C3, cy = (gy + 0.2 + hh(gx, gy, 53) * 0.6) * C3; if (cy < V.hy - 1.5) continue;
      if (V.sx(cx) < -T * 5 || V.sx(cx) > W + T * 5 || V.sy(cy) < -T * 4 || V.sy(cy) > H + T * 4) continue;
      const hx = cx + Math.sin(t * 0.11 + gx) * 1.2, hy2 = cy + Math.cos(t * 0.09 + gy) * 0.6; Q.glow(V.sx(hx), V.sy(hy2), T * 3.2, L.flies, 0.07, 0.6);   // (the swarm's own faint light on the air)
      for (let i = 0; i < n; i++) { const p = hh(gx * 31 + i, gy, 54), q = hh(gx, gy * 17 + i, 55), xw = hx + Math.sin(t * (0.3 + p * 0.5) + p * 20) * (0.8 + q * 1.5) + Math.sin(t * 1.3 + i) * 0.2, yw = hy2 + Math.cos(t * (0.25 + q * 0.4) + q * 20) * (0.5 + p * 0.9) - Math.sin(t * 0.9 + i * 2) * 0.25;
        const bl = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * (1.6 + p * 2) + q * 30), 3), X = V.sx(xw), Y = V.sy(yw); Q.glow(X, Y, T * 0.5, L.flies, 0.4 * bl); Q.glow(X, Y, T * 0.1, '#EAFFD8', 0.9 * bl); } } } }

  /* ======================= the backdrop past the land (GAP_EXT) ======================= */
  if (HAS_W) window.GAP_EXT = window.GAP_EXT || {};
  const GAPX = HAS_W ? window.GAP_EXT : {};
  for (const [gap, land] of Object.entries(LAND_OF)) { const L = LANDS[land], base = L.sky[Math.max(0, L.sky.findIndex(q => q[0] >= 0) + 2)][1];
    GAPX[gap] = { base,
      paint(c, S, R) { c.fillStyle = base; c.fillRect(0, 0, S, S); if (L.stars) for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,240,220,${0.2 + R() * 0.5})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.1 ? 1.2 : 0.6, 0, TAU); c.fill(); } },
      back(c, o) { if (off()) { o.grad('#0C0918', '#040308'); return; } let V = null; const Lv = LIVE;
        if (Lv && Lv.X && !Lv.fiend && Lv.land === land) { try { V = view(Lv.X, land); V.W = o.W; V.H = o.H; V.k = o.k || 1; V.t = o.t; } catch (e) { V = null; } }
        if (!V) { const T = Math.max(24, Math.min(o.W, o.H) / 10), cx = o.wx / T, cy = o.wy / T; V = { W: o.W, H: o.H, T, sx: x => (x - cx) * T + o.W / 2, sy: y => (y - cy) * T + o.H / 2, t: o.t, land, light: L.light, hy: cy + 2, span: 18, k: o.k || 1 }; }
        try { vista(c, V, { gpu: !!(Lv && Lv.X) }); } catch (e) { c.fillStyle = base; c.fillRect(0, 0, o.W, o.H); } } }; }
  const OLDB = {};
  const HAZE_K = { dunes: [0.7, 0.68], mesa: [0.75, 0.7], nightdune: [0.8, 0.72] };   // (veil, edge: the land's standing dust and its vignette, a third lighter)
  function install() { if (typeof BIOMES === 'undefined') return; for (const [gap, land] of Object.entries(LAND_OF)) { const B = BIOMES[land]; if (!B || B.__dsky) continue; B.__dsky = 1; OLDB[land] = { gap: B.gap, haze: B.haze ? Object.assign({}, B.haze) : null }; B.gap = gap;
    if (B.haze && HAZE_K[land]) { const old = B.haze; let mine = Object.assign({}, old, { veil: +(old.veil * HAZE_K[land][0]).toFixed(3), edge: +(old.edge * HAZE_K[land][1]).toFixed(3) }); try { Object.defineProperty(B, 'haze', { configurable: true, enumerable: true, get: () => off() ? old : mine, set: v => { mine = v; } }); } catch (e) {} } } }
  install();

  /* ======================= the stage: its horizon, and the arena's live view ======================= */
  function stageOf(X) { const M = X.M, F = X.F || {}, land = LANDS[F.biome] ? F.biome : 'dunes', TG = typeof T_GAP !== 'undefined' ? T_GAP : 2, TS = typeof T_SOLID !== 'undefined' ? T_SOLID : 0;
    if (F.fiend && M && M.FC) { const C = M.FC; return { X, land, fiend: true, C, hy: C.y - 1, span: C.R + 6, top: C.y - C.R - 1.5 }; }
    let y0 = 1e9, y1 = -1e9; if (M && M.G) { const G = M.G, MW = M.MW, MH = M.MH; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const g = G[y * MW + x]; if (g !== TG && g !== TS) { if (y < y0) y0 = y; if (y > y1) y1 = y; } } }
    if (!(y1 >= y0)) { y0 = X.me.y - 8; y1 = X.me.y + 8; } return { X, land, fiend: false, top: y0, hy: (y0 + y1) / 2 + 0.5, span: Math.max(13, (y1 - y0) / 2 + 7) }; }
  // the arena: the live view drawn beyond the floor's rim (where the floor has faded to its dark lip), feathered into it
  function arenaView(c, Lv) { const X = Lv.X, C = Lv.C, T = X.Tz(), V = view(X, Lv.land); V.k = kOf(c); const W = V.W, H = V.H, cx = X.sx(C.x), cy = X.sy(C.y), r0 = (C.R + 1.36) * T;
    if (Math.hypot(Math.max(Math.abs(cx), Math.abs(cx - W)), Math.max(Math.abs(cy), Math.abs(cy - H))) < r0) return;   // (the floor covers the whole screen)
    c.save(); c.beginPath(); c.rect(0, 0, W, H); c.arc(cx, cy, r0, 0, TAU, true); c.clip('evenodd');
    try { vista(c, V); } catch (e) {}
    const dk = LANDS[Lv.land].dark, g = c.createRadialGradient(cx, cy, r0 - 1, cx, cy, r0 + T * 2.4); g.addColorStop(0, rgba(dk, 1)); g.addColorStop(0.35, rgba(dk, 0.55)); g.addColorStop(1, rgba(dk, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
    rimTeeth(c, Lv, V); }
  // the fossil teeth round the arena's rim (north: tall fangs and ribs against the view; south: low stumps, never over the fight)
  function rimTeeth(c, Lv, V) { const C = Lv.C, list = Lv.rim || (Lv.rim = (() => { const R = R1(777 + Math.round(C.x * 13)), out = []; for (let i = 0; i < 44; i++) { const a = i / 44 * TAU + (R() - 0.5) * 0.08, s = Math.sin(a), d = C.R + 0.55 + R() * 0.45; const north = s < -0.25;
      out.push({ x: C.x + Math.cos(a) * d, y: C.y + s * d, kind: north && R() < 0.25 ? 'rib' : 'fang', v: Math.floor(R() * 3) % (north ? 3 : 3), s: north ? 0.55 + R() * 0.35 : s > 0.4 ? 0.2 + R() * 0.12 : 0.3 + R() * 0.25, flip: Math.cos(a) > 0 }); } return out.sort((p, q) => p.y - q.y); })());
    const T = V.T; for (const p of list) { const X = V.sx(p.x), Y = V.sy(p.y); if (X < -T * 5 || X > V.W + T * 5 || Y < -T * 2 || Y > V.H + T * 7) continue; drawPic(c, V, p.kind, p.kind === 'rib' ? p.v % 2 : p.v, X, Y + T * 0.15, p.s, { flip: p.flip }); } }
  function hookRift() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.dunes; if (!Rf || Rf.__dsky) return; Rf.__dsky = 1;
    const oe = Rf.everyStage; Rf.everyStage = function (X, self, H) { let a = {}; try { a = oe ? oe.apply(this, arguments) || {} : {}; } catch (e) { a = {}; } try { LIVE = stageOf(X); hookArena(); } catch (e) { LIVE = null; } if (off() || !LIVE || !LIVE.fiend) return a; const Lv = LIVE;
      return Object.assign({}, a, { drawGround(c) { if (!off() && LIVE === Lv) { try { arenaView(c, Lv); } catch (e) {} } if (a.drawGround) a.drawGround(c); }, dsky: Lv }); };
    const op = Rf.preload; Rf.preload = function (P) { let a = []; try { a = op ? op.apply(this, arguments) || [] : []; } catch (e) {} let b = []; try { hookArena(); b = warm(P); } catch (e) {} return a.concat(b); }; } catch (e) {} }
  hookRift();

  /* ======================= the arenas' ground and sky: through DuneFiend's shared hooks ======================= */
  const SANDC = new Map();
  // the sand of an arena: a wrapping tile 4 tiles square (dunes and night: wind ripples, a lit crest and a shadowed trough
  // to each, grains and glints; the Rust Flats: sun-cracked clay in curling plates)
  function sandTile(land, P) { const key = land + '|' + P; let s = SANDC.get(key); if (s) return s; const L = LANDS[land].sand, N = 4, w = Math.round(N * P), cv = mkc(w, w), c = cv.getContext('2d'), img = c.createImageData(w, w), d = img.data, LI = hex(L.lit), SH = hex(L.sh), DP = hex(L.deep), GL = hex(L.glint), t0 = now();
    for (let py = 0; py < w; py++) for (let px = 0; px < w; px++) { const x = px / P, y = py / P; let col, gl = 0;
      if (L.kind === 'clay') { const f = pfbm(x * 1.2, y * 1.2, 5, 3); let d1 = 9, d2 = 9; const xi = Math.floor(x * 1.5), yi = Math.floor(y * 1.5); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i, cy = yi + j, wx = md(cx, 6), wy = md(cy, 6), qx = cx + PH(wx, wy, 5), qy = cy + PH(wx, wy, 6), dd = Math.hypot(x * 1.5 - qx, y * 1.5 - qy); if (dd < d1) { d2 = d1; d1 = dd; } else if (dd < d2) d2 = dd; }
        const e = d2 - d1, crack = 1 - ss(0.02, 0.07, e), curl = ss(0.07, 0.16, e) * (1 - ss(0.16, 0.3, e)); col = mix3(SH, LI, 0.45 + f * 0.6); col = mix3(col, mix3(LI, [255, 220, 180], 0.3), curl * 0.5); col = mix3(col, DP, crack * 0.85); col = mix3(col, DP, (1 - ss(0, 0.5, d1)) * 0.0); }
      else { const warp = pfbm(x * 0.7, y * 0.7, 3, 11) * 2.2, ph = (y * 2.1 + warp + Math.sin(x * Math.PI * 0.5) * 0.25) % 1, rp = ph < 0.72 ? ph / 0.72 : (1 - ph) / 0.28, lt = ph < 0.72 ? 0.62 + 0.38 * Math.sin(ph / 0.72 * Math.PI / 2) : 0.3 + 0.3 * (1 - (ph - 0.72) / 0.28), f = pfbm(x * 2, y * 2, 8, 17);
        col = mix3(SH, LI, clamp(lt * 0.85 + (f - 0.5) * 0.35, 0, 1)); col = mix3(col, DP, (1 - ss(0.02, 0.18, rp)) * 0.25 * (ph > 0.6 ? 1 : 0)); void rp; }
      const g = hh(px, py, 99); if (g > 0.993) gl = 0.7; else if (g < 0.02) col = mix3(col, DP, 0.4); col = mix3(col, GL, gl); const gr = (hh(px, py, 98) - 0.5) * 10, o = (py * w + px) * 4; d[o] = clamp(col[0] + gr, 0, 255); d[o + 1] = clamp(col[1] + gr, 0, 255); d[o + 2] = clamp(col[2] + gr, 0, 255); d[o + 3] = 255; }
    c.putImageData(img, 0, 0); s = { cv, P, N }; SANDC.set(key, s); STATS.painted++; STATS.paintMs += now() - t0; return s; }
  const landNow = () => (LIVE && LANDS[LIVE.land] ? LIVE.land : 'dunes');
  function arenaFloor(c, A, o) { o = o || {}; const R = A.R, rnd = A.rnd, land = landNow(), L = LANDS[land], P = Math.min(48, Math.max(12, qP(kOf(c)))), t = sandTile(land, P); if (!t) return false;
    const pat = c.createPattern(t.cv, 'repeat'); try { pat.setTransform(new DOMMatrix([1 / t.P, 0, 0, 1 / t.P, 0, 0])); } catch (e) { return false; }
    const RO = R + 1.42; c.save(); c.beginPath(); c.arc(0, 0, RO, 0, TAU); c.clip(); c.fillStyle = pat; c.fillRect(-RO, -RO, RO * 2, RO * 2);
    // the land's light over the sand: dusk (amber from the low sun, rose shadow), noon (white and hot), night (moonlight, a cold blue)
    const lights = { dunes: [[-R * 0.5, -R * 0.35, R * 1.1, '255,170,90', 0.22], [R * 0.5, R * 0.4, R * 0.9, '120,40,80', 0.2]], mesa: [[-R * 0.3, -R * 0.3, R * 1.2, '255,250,230', 0.16], [R * 0.4, R * 0.5, R * 0.8, '150,60,30', 0.14]], nightdune: [[-R * 0.35, -R * 0.4, R * 1.1, '170,200,255', 0.16], [R * 0.3, R * 0.4, R * 0.9, '10,20,50', 0.25]] }[land];
    for (const [x, y, r, col, a] of lights) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
    // bone and rock lying in it, half buried: rib shards and vertebrae (soft shadows, a lit edge), basalt or red rock toward the rim
    const rock = land === 'mesa' ? ['#8A3A1E', '#5A2210', '#C8683A'] : land === 'nightdune' ? ['#1A2238', '#0A0E1C', '#3A4A70'] : ['#2E2A36', '#15131A', '#55506A'], bone = land === 'nightdune' ? ['#AEB8D0', '#6A7698', '#E2ECFF'] : land === 'mesa' ? ['#F0DCC0', '#B08A6A', '#FFF6E6'] : ['#E7D9B1', '#A8946A', '#FFF6DE'];
    for (let i = 0; i < 10; i++) { const a = rnd() * TAU, d = R * (0.62 + rnd() * 0.3), x = Math.cos(a) * d, y = Math.sin(a) * d, s = 0.45 + rnd() * 0.7, pts = []; for (let k = 0; k < 7; k++) { const b = k / 7 * TAU, rr = s * (0.7 + rnd() * 0.45); pts.push([x + Math.cos(b) * rr * 1.2, y + Math.sin(b) * rr * 0.7]); }
      c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); pts.forEach(([px, py], k) => k ? c.lineTo(px + 0.12, py + 0.18) : c.moveTo(px + 0.12, py + 0.18)); c.closePath(); c.fill();
      const g = c.createLinearGradient(x - s, y - s, x + s, y + s); g.addColorStop(0, rock[2]); g.addColorStop(0.45, rock[0]); g.addColorStop(1, rock[1]); c.fillStyle = g; c.beginPath(); pts.forEach(([px, py], k) => k ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); c.fill(); }
    for (let i = 0; i < 20; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (R - 1), x = Math.cos(a) * d, y = Math.sin(a) * d, rib = rnd() < 0.6, ra = rnd() * TAU, Ln = 0.5 + rnd() * 0.9;
      c.save(); c.translate(x, y); c.rotate(ra); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0.08, 0.12, rib ? Ln : 0.3, rib ? 0.17 : 0.26, 0, 0, TAU); c.fill();
      const g = c.createLinearGradient(0, -0.2, 0, 0.2); g.addColorStop(0, bone[2]); g.addColorStop(0.5, bone[0]); g.addColorStop(1, bone[1]); c.fillStyle = g; c.beginPath(); if (rib) { c.moveTo(-Ln, 0); c.quadraticCurveTo(0, -0.32, Ln, -0.02); c.quadraticCurveTo(0, 0.02, -Ln, 0.12); c.closePath(); } else { c.arc(0, 0, 0.26, 0, TAU); } c.fill();
      if (!rib) { c.fillStyle = rgba(rock[1], 0.5); c.beginPath(); c.arc(0, 0, 0.1, 0, TAU); c.fill(); } c.restore(); }
    // the land's own glow in the sand: resonance veins (dunes), pink crystal shards (the Rust Flats), firefly-lit sand (night)
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const a0 = rnd() * TAU; let x = Math.cos(a0) * R, y = Math.sin(a0) * R, a = a0 + Math.PI + (rnd() - 0.5) * 0.5; const pts = [[x, y]]; for (let j = 0; j < 9; j++) { x += Math.cos(a) * 1.5; y += Math.sin(a) * 1.5; a += (rnd() - 0.5) * 0.7; if (Math.hypot(x, y) < R * 0.3) break; pts.push([x, y]); }
      if (land === 'mesa') { for (const [px, py] of pts.slice(1, 4)) { const s = 0.18 + rnd() * 0.2; c.fillStyle = rgba(L.vein, 0.35); c.beginPath(); c.moveTo(px, py - s * 2); c.lineTo(px + s * 0.6, py); c.lineTo(px, py + s * 0.4); c.lineTo(px - s * 0.6, py); c.closePath(); c.fill(); } continue; }
      if (land === 'nightdune') { const [px, py] = pts[Math.min(2, pts.length - 1)], g = c.createRadialGradient(px, py, 0, px, py, 1.2); g.addColorStop(0, rgba(L.vein, 0.14)); g.addColorStop(1, rgba(L.vein, 0)); c.fillStyle = g; c.fillRect(px - 1.2, py - 1.2, 2.4, 2.4); continue; }
      for (const [w, a2] of [[0.3, 0.06], [0.1, 0.16]]) { c.strokeStyle = rgba(L.vein, a2); c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); pts.forEach(([px, py], k) => k ? c.lineTo(px, py) : c.moveTo(px, py)); c.stroke(); } } c.restore();
    c.restore();
    if (o.extra) o.extra(c, A);
    // the rim: the sand falls away into a dark lip (the view beyond is laid outside it, feathered from the same dark)
    const dk = L.dark, g = c.createRadialGradient(0, 0, R - 0.6, 0, 0, RO); g.addColorStop(0, rgba(dk, 0)); g.addColorStop(0.45, rgba(dk, 0.35)); g.addColorStop(0.8, rgba(dk, 0.88)); g.addColorStop(1, rgba(dk, 1)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, RO, 0, TAU); c.fill();
    c.strokeStyle = land === 'nightdune' ? 'rgba(170,200,255,.18)' : 'rgba(255,230,180,.2)'; c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, R + 0.05, 0, TAU); c.stroke();
    return true; }
  function arenaSky(c, W, H, t, cam, T, o) { o = o || {}; const Lv = LIVE, land = landNow(), C = Lv && Lv.C ? Lv.C : { x: cam.x || 0, y: cam.y || 0, R: 15 }, cx = cam.x || C.x, cy = cam.y || C.y;
    const V = { W, H, T, sx: x => (x - cx) * T + W / 2, sy: y => (y - cy) * T + H / 2, t: 0, land, light: LANDS[land].light, hy: Lv && Lv.fiend ? Lv.hy : cy - 1, top: Lv && Lv.fiend ? Lv.top : null, span: Lv && Lv.fiend ? Lv.span : 21, k: kOf(c) };
    vista(c, V, { gpu: false }); if (o.silhouette) o.silhouette(c, W, H, t, cam, T); return true; }
  let hookArena = () => { try { if (typeof DuneFiend === 'undefined' || !DuneFiend || DuneFiend.__dsky) return; const G = DuneFiend, of = G.floor, os = G.sky; if (typeof of !== 'function' || typeof os !== 'function') return; G.__dsky = 1;
    G.floor = function (c, A, o) { if (!off() && BP()) { try { c.save(); const ok = arenaFloor(c, A, o); c.restore(); if (ok) return; } catch (e) { try { c.restore(); } catch (e2) {} } } return of.apply(this, arguments); };
    G.sky = function (c, W, H, t, cam, T, o) { if (!off()) { try { c.save(); const ok = arenaSky(c, W, H, t, cam, T, o); c.restore(); if (ok) return; } catch (e) { try { c.restore(); } catch (e2) {} } } return os.apply(this, arguments); }; } catch (e) {} };
  if (typeof setTimeout === 'function') setTimeout(() => hookArena(), 0);   // (the boss files load after this one)

  /* ======================= release and warm-up ======================= */
  function release(keepCols) { const n = CACHE.size + STRC.size + SANDC.size; CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); CACHE.clear();
    if (!keepCols) { STRC.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STRC.clear(); SANDC.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); SANDC.clear(); STARC.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STARC.clear(); COLC.forEach(cv => { cv.width = cv.height = 1; }); COLC.clear(); HELD.clear(); if (CRACK) { CRACK.cv.width = CRACK.cv.height = 1; CRACK = null; } }
    STATS.released += n; }
  function hookRelease() { try { if (typeof DunWorld === 'undefined' || !DunWorld.dropProps || DunWorld.dropProps.__dsky) return; const od = DunWorld.dropProps; const f = function () { try { return od.apply(this, arguments); } finally { release(); LIVE = null; } }; for (const k in od) f[k] = od[k]; f.__dsky = 1; DunWorld.dropProps = f; } catch (e) {} }
  hookRelease();
  // the loading screen's jobs: the sky's column, the ranges and the pieces this land's view shows, at the stage's sharpness
  function warm(P) { if (off() || !P || !(P.T > 0) || !P.F) return []; const land = LANDS[P.F.biome] ? P.F.biome : null; if (!land) return []; const L = LANDS[land], k = Math.min(3, P.k || 1), T = P.T * (P.F.fiend ? 0.86 : 1), jobs = [], job = f => jobs.push(() => { try { f(); } catch (e) {} });
    job(() => column(land)); L.strips.forEach((sp, i) => job(() => strip(land, i, stripP(sp, T, k)))); const ln = L.light;
    for (const it of L.items) { const nm = it.kind === 'cage' ? 'rib' : it.kind, vv = it.kind === 'cage' ? 0 : it.v; job(() => pic(nm, vv, ln, picP(nm, vv, T, k, it.s), null, true)); }
    if (L.jaw) job(() => pic('jaw', 0, ln, picP('jaw', 0, T, k, 1), null, true));
    if (L.sun) job(() => pic('sun', L.sun.v, ln, picP('sun', L.sun.v, T, k, L.sun.r), null, true)); if (L.moon) job(() => pic('moon', 0, ln, picP('moon', 0, T, k, L.moon.r), null, true)); if (L.galaxy) job(() => pic('galaxy', 0, ln, picP('galaxy', 0, T, k, 1), null, true));
    if (L.stars) job(() => starTile(L.stars, k)); if (L.cracks) job(() => crackPat(k));
    if (P.F.fiend) { job(() => sandTile(land, Math.min(48, Math.max(12, qP(T * k))))); for (let v = 0; v < 3; v++) job(() => { for (const s of [0.3, 0.6, 0.8]) pic('fang', v, ln, picP('fang', v, T, k, s), null, true); }); }
    return jobs; }

  const API = { vista, view, release, warm, LANDS, DEF, LIGHT, get LIVE() { return LIVE; }, set LIVE(v) { LIVE = v; }, stageOf, install, OLDB, arena: { floor: arenaFloor, sky: arenaSky, view: arenaView, hook: () => hookArena() }, pic, strip, column, sandTile,
    get stats() { const px = [...CACHE.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) + [...STRC.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) + [...SANDC.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) + [...STARC.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0); return Object.assign({ cached: CACHE.size, strips: STRC.size, sands: SANDC.size, px }, STATS); } };
  if (HAS_W) window.DUNE_SKY = API;
  return API;
})();
