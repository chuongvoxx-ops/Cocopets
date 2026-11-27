/* ---------- v472 YE: The Yuggoth Engine repainted in 2.5D (Rift 06's three lands, their props, hazards, lightning, doors) ----------
   Rift 06 rebuilt to the standard of Rift 04 / 05 (v463 SE, v470 AE): every solid piece of the rift is painted ONCE into its own
   cached picture by the Drowned Belfry's software shading pass (BELPROPS.kit, 20n9: each pixel of a solid gets a normal and a
   material and is lit), each land in its own light:
     wreck   (the Torn Hull, section 1): night on the crash site under the violet void; a cold key, the void's violet in every
             polish and rim, an ember bounce off the scorched ground
     cool    (the Coolant Vaults, section 2): steel galleries over glowing coolant; teal in the reflections, teal bounce from below
     heart   (the Engine Heart, section 3): the living core; a warm key, magenta flesh-light bouncing, an amber rim
   then finished with a little 2D detail and a soft ink edge. Nothing is painted per frame: the frame lays the pictures down; what
   glows (the neon strips, the pylons' caps, the coolant in its glass, the pistons' amber joints, the nerve cables' pulses, the
   fungus) is the GPU painter's light (FGFX, 20k6h; YE-FX 570..575), lowFx respected; without it the pictures stay and the light is
   left out.
   Props (DunWorld.PROPS through the engine's prop cache, so BREAK_FX shatters these pictures in their own materials, each break
   adding its own debris and a feathered GPU burst; a clean floor after): metalspike, hullshard, neonpost, wreckrib, pylon,
   fungusstalk (the Torn Hull), coolanttank, pipestack, valve (the Coolant Vaults), piston, nervecable, biotube, xenospire, vertebra
   (the Engine Heart); v 0..1 painted, 2..3 the same mirrored. Only in the three lands (another land asking for one gets its 2D art).
   Textures (made once per sharpness and land, wrapping): floor (FN tiles square, continuous across tiles: never per-tile squares),
   bank (a wall's face), roof (a wall's top), cliff (the face over the drop), bridge (a steel catwalk) and bunder (its girders). The
   lands (BIOMES.wreckfield / .coolant / .engineheart): floorFn (13 arguments), wallFn, roofFn, cliffTint, bridgeFn, bridgeEdge,
   floorUnder, floor, props, propN, dress as getters (the old art whenever the painter is off).
   Lightning: the charge cells' chain lightning (20u6 bolt/discharge: their rule untouched) and the ambient arcs between the tall
   props (20u6 drawArcs) are GPU bolts (YE-FX 571), queued here and laid in this stage's light pass (no extra pass).
   Hazards: the Coolant Vaults' steam vents are a painted steel grate with GPU steam (YE-FX 573), their tell a kindling glow (no
   circle); the lasers' tell is a GPU glow along the line (no dashed box). Their rules, timing and damage are 20b's.
   The trials' pieces (20u6d2-yug-pieces.js adds their DEFs): YUG_PROPS.piece(c, name, v, Xs, Ys, T, o) draws a piece's picture
   (false: the caller draws its old 2D), YUG_PROPS.ql / .qo queue GPU light under / over the actors for this frame.
   The exits are the Drowned Belfry's doors (BEL_DOORS, 20n9d: 'std' out of a stage, 'boss' before a boss), themed for the Engine
   ('yugwreck' / 'yugcool' / 'yugheart': hull plates for its stone, gunmetal for its bronze, violet / teal / amber light); positions,
   trigger radius, labels and progression stay the stage's own (H.setExit); the door only reads whether the stage is done and
   changes no tile (v447), its pictures are painted on the loading screen (warmDoor).
   Hooks: RIFT_BY_ID.yuggoth.everyStage (chained: the light, the doors), .preload (chained: textures, props, pieces, the door),
   DunWorld.dropProps (chained: everything given back), BREAK_FX.prop (chained: debris and burst).
   window.__YUGP = 0 (or __BELP = 0) turns all of it off (the old 2D art); __YUGP_GL = 0 the GPU's part only. */
var YUG_PROPS = (() => {
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined';
  const off = () => HAS_W && (window.__YUGP === 0 || window.__BELP === 0);
  const BP = () => (!off() && HAS_W && window.BELPROPS && window.BELPROPS.kit) ? window.BELPROPS : null;
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + (s | 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const rgba = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${clamp(a, 0, 1)})`; };
  const md = (a, n) => ((a % n) + n) % n;
  const kOf = c => { const m = c && c.getTransform ? c.getTransform() : null; return m ? Math.max(0.5, Math.min(3, Math.hypot(m.a, m.b))) : 1; };
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0, tex: 0, texMs: 0, land: 0, pieces: 0, breaks: 0, empty: 0, bolts: 0, arcs: 0, hazards: 0, tells: 0 };
  const VIOLET = '#C452FF', VIOLET_HI = '#E8B8FF', TEAL = '#3FE0C8', TEAL_HI = '#B8FFF2', AMBER = '#FFB23F', PINK = '#FF6FB0', FUNGUS = '#E88AC0';
  // emissive colours (linear-ish, for the kit's materials)
  const E_VIO = [0.77, 0.32, 1.0], E_TEAL = [0.25, 0.88, 0.78], E_AMB = [1.0, 0.62, 0.18], E_PINK = [1.0, 0.36, 0.7], E_FUNG = [0.95, 0.5, 0.78];

  /* ======================= the light of each land ======================= */
  const LIGHT = {
    wreck: { a0: [0.07, 0.065, 0.09], a1: [0.07, 0.06, 0.09], e0: [0.07, 0.065, 0.1], e1: [0.42, 0.36, 0.56], k: [1.05, 1.0, 1.1], rim: [0.62, 0.3, 0.9], bo: [0.16, 0.08, 0.1] },
    cool: { a0: [0.04, 0.08, 0.09], a1: [0.03, 0.08, 0.08], e0: [0.05, 0.1, 0.11], e1: [0.22, 0.6, 0.56], k: [0.88, 0.98, 1.04], rim: [0.25, 0.85, 0.75], bo: [0.06, 0.24, 0.21] },
    heart: { a0: [0.08, 0.04, 0.06], a1: [0.09, 0.02, 0.07], e0: [0.1, 0.05, 0.08], e1: [0.6, 0.28, 0.45], k: [1.06, 0.9, 0.86], rim: [0.95, 0.52, 0.3], bo: [0.24, 0.06, 0.14] } };
  const BIO_L = { wreckfield: 'wreck', coolant: 'cool', engineheart: 'heart' };
  const INK = { wreck: [10, 6, 20], cool: [4, 16, 20], heart: [20, 6, 18] };
  function lit(K, name, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHT[name] || LIGHT.wreck); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }
  const bioOf = B => { if (!B || typeof BIOMES === 'undefined') return null; return B === BIOMES.wreckfield ? 'wreckfield' : B === BIOMES.coolant ? 'coolant' : B === BIOMES.engineheart ? 'engineheart' : null; };
  const NEON = { wreck: [E_VIO, E_TEAL], cool: [E_TEAL, E_VIO], heart: [E_PINK, E_AMB] }, NEONC = { wreck: [VIOLET, TEAL], cool: [TEAL, VIOLET], heart: [PINK, AMBER] };

  /* ======================= noise that wraps (for the textures) ======================= */
  function pvn(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), q = p | 0 || 1;
    const X0 = ((xi % q) + q) % q, X1 = (X0 + 1) % q, Y0 = ((yi % q) + q) % q, Y1 = (Y0 + 1) % q, a = hh(X0, Y0, s), b = hh(X1, Y0, s), c = hh(X0, Y1, s), d = hh(X1, Y1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const pfbm = (x, y, p, s) => pvn(x, y, p, s) * 0.52 + pvn(x * 2, y * 2, p * 2, s + 7) * 0.3 + pvn(x * 4, y * 4, p * 4, s + 13) * 0.18;
  let DOM = 6; const wn = (x, y, f, s) => pvn(x * f, y * f, Math.max(1, Math.round(DOM * f)), s);
  const CELL = { d: 0, d2: 0, id: 0 };
  function pcell(x, y, p, s) { const xi = Math.floor(x), yi = Math.floor(y); let d1 = 9, d2 = 9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i, cy = yi + j, wx = ((cx % p) + p) % p, wy = ((cy % p) + p) % p, px = cx + 0.15 + hh(wx, wy, s) * 0.7, py = cy + 0.15 + hh(wx, wy, s + 1) * 0.7, d = Math.hypot(x - px, y - py);
      if (d < d1) { d2 = d1; d1 = d; id = wy * p + wx; } else if (d < d2) d2 = d; }
    CELL.d = d1; CELL.d2 = d2; CELL.id = id; return CELL; }

  /* ======================= materials ======================= (each sets K.M; u, v surface coordinates in tiles) */
  const glowAdd = (M, e, k) => { M.er += e[0] * k; M.eg += e[1] * k; M.eb += e[2] * k; };
  // the hull: an alien gunmetal alloy, brushed along u, fine scratches, a blue-violet temper bloom in places, scorched where it
  // burned (burn 0..1), a chipped dark coat over parts of it (paint), pitted where the void ate it
  function hullM(K, u, v, sd, o) { const M = K.M, w = K.fbm(u * 2.1 + sd, v * 2.1), br = K.vn(u * 2.5 + sd, v * 48 - sd), sc = K.vn(u * 37 + sd, v * 7), tb = K.vn(u * 1.1 - sd, v * 1.1 + 3), pit = K.vn(u * 19 + 7, v * 19 + sd);
    const t = 0.3 + 0.09 * (w - 0.5) + 0.05 * (br - 0.5), tone = (o && o.tone) || 1;
    M.mt = 0.5; M.r = t * 0.78 * tone; M.g = t * 0.82 * tone; M.b = t * 0.98 * tone; M.fr = t * 1.1 * tone; M.fg = t * 1.15 * tone; M.fb = t * 1.32 * tone; M.rg = 0.3 + 0.16 * (1 - br);
    if (tb > 0.66) { const f = ss(0.66, 0.85, tb) * 0.6; M.fr += 0.05 * f; M.fg -= 0.02 * f; M.fb += 0.12 * f; }
    if (sc > 0.92) { M.rg = 0.14; M.fr += 0.12; M.fg += 0.12; M.fb += 0.13; }
    if (pit > 0.82) { M.ao *= 0.7; M.rg = 0.7; }
    const pt = o && o.paint ? ss(0.5, 0.56, K.vn(u * 3.3 + sd + 9, v * 3.3)) * o.paint : 0; if (pt > 0) { M.mt = lerp(M.mt, 0.05, pt); M.r = lerp(M.r, 0.07, pt); M.g = lerp(M.g, 0.08, pt); M.b = lerp(M.b, 0.12, pt); M.rg = lerp(M.rg, 0.55, pt); }
    const bu = o && o.burn ? clamp(o.burn * ss(0.4, 0.75, K.fbm(u * 1.4 + sd + 5, v * 1.4)), 0, 1) : 0; if (bu > 0) { M.mt *= 1 - bu * 0.75; M.r = lerp(M.r, 0.025, bu); M.g = lerp(M.g, 0.02, bu); M.b = lerp(M.b, 0.03, bu); M.rg = lerp(M.rg, 0.85, bu); M.fr *= 1 - bu * 0.6; M.fg *= 1 - bu * 0.6; M.fb *= 1 - bu * 0.5; } }
  // dark steel (masts, frames, rails): near black, satin, a cool sheen on its edges
  function darkM(K, u, v, sd) { const M = K.M, w = K.vn(u * 5 + sd, v * 23); M.mt = 0.7; M.r = 0.05; M.g = 0.05; M.b = 0.065; M.fr = 0.2 + 0.05 * w; M.fg = 0.21 + 0.05 * w; M.fb = 0.26 + 0.06 * w; M.rg = 0.36 + 0.1 * w; }
  // polished steel (piston rods, valve stems): bright, smooth, a long reflection
  function chromeM(K, u, v, sd) { const M = K.M, w = K.vn(u * 3 + sd, v * 40); M.mt = 1; M.fr = 0.62 + 0.08 * w; M.fg = 0.64 + 0.08 * w; M.fb = 0.7 + 0.08 * w; M.rg = 0.1 + 0.06 * w; M.cc = 0.2; }
  // copper windings: warm metal, darker in the grooves, a green bloom in places
  function copperM(K, u, v, sd, groove) { const M = K.M, w = K.vn(u * 6 + sd, v * 6), g = groove || 0; M.mt = 0.95; M.fr = 0.78 - 0.2 * g; M.fg = 0.42 - 0.12 * g; M.fb = 0.26 - 0.08 * g; M.rg = 0.28 + 0.15 * w; if (w > 0.78) { M.mt = 0.3; M.r = 0.12; M.g = 0.32; M.b = 0.26; M.rg = 0.7; } }
  // a glowing glass (a neon tube, a lens, a cell's window): clear coat over light held inside (col), brightest along its core (k)
  function glowGlassM(K, e, k, o) { const M = K.M; M.r = 0.02; M.g = 0.02; M.b = 0.03; M.rg = 0.05; M.cc = 1; M.sh = 0.5; glowAdd(M, e, k); if (o && o.white) { M.er += o.white; M.eg += o.white; M.eb += o.white; } }
  // fungus: soft pink flesh, matte, faintly lit from within; gills paler
  function fungusM(K, u, v, sd, e, k) { const M = K.M, w = K.fbm(u * 4 + sd, v * 4), sp = K.vn(u * 23 + sd, v * 23); M.r = 0.78 * (0.85 + 0.3 * (w - 0.5)); M.g = 0.42 * (0.85 + 0.3 * (w - 0.5)); M.b = 0.6 * (0.85 + 0.3 * (w - 0.5)); M.rg = 0.62; M.cc = 0.15;
    if (sp > 0.8) { M.r *= 0.75; M.g *= 0.7; M.b *= 0.8; } glowAdd(M, e || E_FUNG, (k == null ? 0.12 : k) * (0.7 + 0.6 * w)); }
  // flesh: violet-magenta, wet (a clear coat), mottled, fine veins raised and faintly lit (amber or pink)
  function fleshM(K, u, v, sd, o) { const M = K.M, w = K.fbm(u * 2.6 + sd, v * 2.6), mo = K.vn(u * 9 + sd, v * 9), vein = ss(0.04, 0.0, Math.abs(K.vn(u * 5.3 + sd * 2, v * 5.3) - 0.5)) * ss(0.4, 0.6, K.vn(u * 2 + 3, v * 2 + sd));
    M.r = 0.4 * (0.8 + 0.4 * w); M.g = 0.11 * (0.8 + 0.4 * w); M.b = 0.3 * (0.8 + 0.4 * w); M.rg = 0.38; M.cc = (o && o.wet != null) ? o.wet : 0.6; M.sh = 0.85;
    if (mo > 0.7) { M.r *= 1.15; M.g *= 0.9; M.b *= 1.2; } if (mo < 0.25) { M.r *= 0.75; M.b *= 0.8; }
    M.er += 0.04 + 0.03 * w; M.eb += 0.03; if (vein > 0.02) { M.r = lerp(M.r, 0.6, vein * 0.6); M.g = lerp(M.g, 0.18, vein * 0.6); glowAdd(M, (o && o.vein) || E_PINK, vein * ((o && o.glow) != null ? o.glow : 0.35)); } }
  // glossy black biomech (the bone tubes, spires, vertebrae of the heart): near black, very glossy, ribbed, violet in the grooves
  function boneM(K, u, v, sd, groove) { const M = K.M, w = K.vn(u * 4 + sd, v * 4); M.r = M.g = 0.035; M.b = 0.05; M.rg = 0.2 + 0.08 * w; M.cc = 0.9; M.mt = 0.15; M.fr = M.fg = 0.08; M.fb = 0.12;
    const g = groove || 0; if (g > 0) { M.ao *= 1 - g * 0.45; glowAdd(M, E_VIO, g * 0.18); } }
  // rubber hose / cable sheath: black, matte
  function rubberM(K, u, v, sd) { const M = K.M, w = K.vn(u * 8 + sd, v * 8); M.r = 0.04 + 0.02 * w; M.g = 0.04 + 0.02 * w; M.b = 0.05 + 0.02 * w; M.rg = 0.7; M.cc = 0.15; }
  // scorched ground (the crash site): ash and dark basalt grit, violet-grey
  function ashM(K, u, v, sd) { const M = K.M, w = K.fbm(u * 3 + sd, v * 3), sp = K.vn(u * 41 + sd, v * 41); const t = 0.085 * (0.8 + 0.45 * w); M.r = t * 1.02; M.g = t * 0.92; M.b = t * 1.12; M.rg = 0.88; if (sp > 0.85) { M.r += 0.05; M.g += 0.04; M.b += 0.06; } }
  // the textures' versions (their noise repeats with the texture)
  function hullT(K, x, y, sd, o) { const M = K.M, w = wn(x, y, 1, sd) * 0.6 + wn(x, y, 3, sd + 1) * 0.4, br = wn(x, y * 0.25, 24, sd + 2), sc = wn(x, y, 32, sd + 3), tb = wn(x, y, 0.5, sd + 4), t = 0.28 + 0.1 * (w - 0.5) + 0.05 * (br - 0.5), tone = (o && o.tone) || 1;
    M.mt = 0.5; M.r = t * 0.78 * tone; M.g = t * 0.82 * tone; M.b = t * 0.98 * tone; M.fr = t * 1.1 * tone; M.fg = t * 1.15 * tone; M.fb = t * 1.32 * tone; M.rg = 0.32 + 0.16 * (1 - br);
    if (tb > 0.64) { const f = ss(0.64, 0.85, tb) * 0.6; M.fr += 0.05 * f; M.fb += 0.12 * f; } if (sc > 0.9) { M.rg = 0.16; M.fr += 0.1; M.fg += 0.1; M.fb += 0.11; }
    const bu = o && o.burn ? clamp(o.burn, 0, 1) : 0; if (bu > 0) { M.mt *= 1 - bu * 0.75; M.r = lerp(M.r, 0.025, bu); M.g = lerp(M.g, 0.02, bu); M.b = lerp(M.b, 0.03, bu); M.rg = lerp(M.rg, 0.85, bu); M.fr *= 1 - bu * 0.6; M.fg *= 1 - bu * 0.6; M.fb *= 1 - bu * 0.5; }
    const pt = o && o.paint ? o.paint : 0; if (pt > 0) { M.mt = lerp(M.mt, 0.05, pt); M.r = lerp(M.r, (o.pc || [0.07, 0.08, 0.12])[0], pt); M.g = lerp(M.g, (o.pc || [0.07, 0.08, 0.12])[1], pt); M.b = lerp(M.b, (o.pc || [0.07, 0.08, 0.12])[2], pt); M.rg = lerp(M.rg, 0.55, pt); } }
  function fleshT(K, x, y, sd, o) { const M = K.M, w = wn(x, y, 1, sd) * 0.6 + wn(x, y, 3, sd + 1) * 0.4, mo = wn(x, y, 6, sd + 2);
    M.r = 0.27 * (0.8 + 0.45 * w); M.g = 0.075 * (0.8 + 0.45 * w); M.b = 0.21 * (0.8 + 0.45 * w); M.rg = 0.36; M.cc = (o && o.wet != null) ? o.wet : 0.55; M.sh = 0.85; if (mo > 0.68) { M.r *= 1.15; M.b *= 1.2; } if (mo < 0.28) { M.r *= 0.78; M.b *= 0.82; } M.er += 0.035 + 0.03 * w; M.eb += 0.025; }

  /* ======================= primitives beyond the kit's (as v470 AE's) ======================= */
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
  // prism: a six-sided prism standing from its foot (cx, by), leaning ang (radians from up, + right), radius r0 -> r1 over h tiles,
  // then a tip tip tall; mat(face, q, wt, inTip, ao); o.flat (0..1): flattens it into a blade (its side faces turned away)
  function prism(K, S, cx, by, r0, r1, h, tip, ang, mat, o) { o = o || {}; const { M } = K, P = S.P, CX = S.ax + cx * P, BY = S.ay + by * P, ca = Math.cos(ang), sa = Math.sin(ang), Ht = h + tip, rm = Math.max(r0, r1), fl = o.flat || 0;
    const xs = [CX, CX + sa * Ht * P], ys = [BY, BY - ca * Ht * P];
    const xa = Math.max(0, Math.floor(Math.min(xs[0], xs[1]) - rm * P - 2)), xb = Math.min(S.w - 1, Math.ceil(Math.max(xs[0], xs[1]) + rm * P + 2)), ya = Math.max(0, Math.floor(Math.min(ys[0], ys[1]) - rm * P - 2)), yb = Math.min(S.h - 1, Math.ceil(Math.max(ys[0], ys[1]) + rm * P + 2));
    S.lock();
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { const dx = (px + 0.5 - CX) / P, dy = (py + 0.5 - BY) / P, w = dx * sa - dy * ca, u = dx * ca + dy * sa;
      if (w < -0.6 / P || w > Ht + 0.6 / P) continue; const inTip = w > h, r = inTip ? r1 * (1 - (w - h) / (tip || 1e-6)) : lerp(r0, r1, clamp(w / (h || 1), 0, 1)); if (r <= 0.002) continue;
      const au = Math.abs(u); if (au > r + 0.6 / P) continue; const q = clamp(u / r, -1, 1), face = q < -0.5 ? -1 : q > 0.5 ? 1 : 0;
      let lx = face * (0.866 + fl * 0.1), ly = face ? 0.5 * (1 - fl * 0.6) : 1, lz = (r0 - r1) / (h || 1) * 0.5; if (inTip) { lx *= 0.72; ly *= 0.72; lz = 0.62; }
      const nx = lx * ca + lz * sa, nz = -lx * sa + lz * ca, l = Math.hypot(nx, ly, nz) || 1;
      K.M0(); M.ao = 1 - 0.18 * ss(0.06, 0, Math.abs(Math.abs(q) - 0.5)); mat(face, q, clamp(w / Ht, 0, 1), inTip, M.ao); K.shade(nx / l, ly / l, nz / l);
      K.put(S, px, py, clamp((r - au) * P + 0.6, 0, 1) * clamp((w + 0.6 / P) * P, 0, 1) * (o.alpha == null ? 1 : o.alpha)); } }
  // plate: a flat polygon panel (pts [[x, y], ...] in tiles) facing n [nx, ny, nz] (ny toward the camera), its edges bevelled bv
  // tiles (rounded outward); mat(x, y, ao, e (0 inside .. 1 at the bevel's lip), edge) sets M
  function plate(K, S, pts, n, bv, mat, o) { o = o || {}; const { M } = K, P = S.P, N = pts.length; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const xa = Math.max(0, Math.floor(S.ax + x0 * P - 1)), xb = Math.min(S.w - 1, Math.ceil(S.ax + x1 * P + 1)), ya = Math.max(0, Math.floor(S.ay + y0 * P - 1)), yb = Math.min(S.h - 1, Math.ceil(S.ay + y1 * P + 1)), bvp = Math.max(0.6, bv * P);
    const nl = Math.hypot(n[0], n[1], n[2]) || 1, n0 = [n[0] / nl, n[1] / nl, n[2] / nl];
    S.lock();
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P; let inside = false, bd = 1e9, ex = 0, ey = 0;
      for (let i = 0, j = N - 1; i < N; j = i++) { const ax = pts[j][0], ay = pts[j][1], bx = pts[i][0], by = pts[i][1];
        if (((ay > y) !== (by > y)) && (x < (bx - ax) * (y - ay) / (by - ay) + ax)) inside = !inside;
        const dx = bx - ax, dy = by - ay, ll = dx * dx + dy * dy || 1e-9; let t = ((x - ax) * dx + (y - ay) * dy) / ll; t = t < 0 ? 0 : t > 1 ? 1 : t; const qx = ax + dx * t - x, qy = ay + dy * t - y, d = qx * qx + qy * qy; if (d < bd) { bd = d; ex = -qx; ey = -qy; } }
      const d = Math.sqrt(bd) * P * (inside ? 1 : -1); if (d < -0.8) continue; const el = Math.hypot(ex, ey) || 1, e = d < bvp ? 1 - clamp(d / bvp, 0, 1) : 0;
      // the bevel: the normal tipped outward (screen x -> nx, screen down -> -nz) as the lip nears
      const s = Math.min(0.9, e * 0.95), ox = -ex / el, oz = ey / el; let nx = n0[0] * (1 - s) + ox * s, ny = n0[1] * (1 - s), nz = n0[2] * (1 - s) + oz * s; const l = Math.hypot(nx, ny, nz) || 1;
      K.M0(); M.ao = 1 - 0.25 * e; mat(x, y, M.ao, e, d / P); K.shade(nx / l, ny / l, nz / l); K.put(S, px, py, clamp(d + 0.6, 0, 1) * (o.alpha == null ? 1 : o.alpha)); } }
  function disc(K, S, cx, cy, rx, ry, mat, o) { o = o || {}; const { M } = K, P = S.P, X0 = S.ax + cx * P, Y0 = S.ay + cy * P, RX = rx * P, RY = ry * P, bv = o.bv == null ? 0.14 : o.bv, dome = o.dome || 0; if (RX < 0.5) return; S.lock();
    for (let py = Math.max(0, Math.floor(Y0 - RY - 2)); py <= Math.min(S.h - 1, Math.ceil(Y0 + RY + 2)); py++) for (let px = Math.max(0, Math.floor(X0 - RX - 2)); px <= Math.min(S.w - 1, Math.ceil(X0 + RX + 2)); px++) {
      const dx = (px + 0.5 - X0) / RX, dy = (py + 0.5 - Y0) / RY, r = Math.hypot(dx, dy); if (r > 1 + 1.5 / RX) continue; const k = r > 1 - bv ? (r - (1 - bv)) / bv * 0.85 : dome * r;
      const ux = r > 1e-5 ? dx / r : 0, uy = r > 1e-5 ? dy / r : 0, s = Math.min(0.95, k), nx = ux * s, nz = -uy * s, ny = Math.sqrt(1 - s * s);
      K.M0(); M.ao = 1 - 0.2 * ss(1 - bv, 1, r); mat(dx, dy, r, M.ao); K.shade(nx, ny, nz); K.put(S, px, py, clamp((1 - r) * Math.min(RX, RY) + 0.6, 0, 1)); } }
  const box = (K, S, cx, by, hw, hd, z0, z1, b, mat, o) => K.rbox(S, cx, by, hw, hd, z0, z1, b, mat, o);
  function contact(K, S, rx, ry, a, x, y) { K.contact(S, x || 0, y == null ? 0.03 : y, rx, ry, a); }
  function halo(c, x, y, r, col, a) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.4)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
  // grit and ash specks about a point (2D, tiles)
  function grit(c, R, x, y, rx, ry, n, col, a) { c.save(); for (let i = 0; i < n; i++) { const an = R() * TAU, d = Math.sqrt(R()), px = x + Math.cos(an) * rx * d, py = y + Math.sin(an) * ry * d, s = 0.008 + R() * 0.02; c.fillStyle = col ? rgba(col, (0.35 + R() * 0.5) * (a || 1)) : `rgba(${20 + R() * 30 | 0},${16 + R() * 24 | 0},${26 + R() * 30 | 0},${(0.4 + R() * 0.5) * (a || 1)})`; c.fillRect(px - s / 2, py - s / 2, s, s); } c.restore(); }
  // rivets: small domes along a list of points
  function rivets(K, S, pts, r, sd) { for (const [x, y] of pts) K.ball(S, x, y, r, r, (dx, dy) => { hullM(K, dx + x * 3, dy + y * 3, sd); K.M.rg = 0.22; }); S.unlock(); }
  // a torn shard of plate lying on the ground (a low plate seen nearly from above)
  function floorShard(K, S, x, y, w, h, sd, R, o) { const n = 5 + Math.floor(R() * 3), pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU + (R() - 0.5) * 0.5, rr = 0.6 + R() * 0.45; pts.push([x + Math.cos(a) * w * rr, y + Math.sin(a) * h * rr]); }
    plate(K, S, pts, [0, 0.35, 1], 0.03, (px, py, ao, e) => { hullM(K, px * 2, py * 2, sd, { burn: (o && o.burn) || 0.4 }); if (e > 0.6) K.M.rg *= 0.6; }); S.unlock(); }

  /* ======================= the props ======================= */
  // (box: the picture's box about its feet in tiles; paint(K, S, v, L); mat: what BREAK_FX breaks it into; el: its element; hp)
  const HULLC = ['#5A6278', '#2A2F3E', '#AEB6CC'], DARKC = ['#2A2F3E', '#14161E', '#6A7288'], GLASSC = ['#3FE0C8', '#1E6A64', '#B8FFF2'], FLESHC = ['#7A3A6E', '#3E1A38', '#FFB2DC'], BONEC = ['#1E1E28', '#0A0A10', '#7A6E9A'], FUNGC = ['#E88AC0', '#8E4A78', '#FFD0E8'];
  const DEF = {
    /* a cluster of steel spikes burst out of the ground: tall faceted blades (lit and shaded faces, a bright ridge), a neon strip
       glowing down each (violet / teal; pink in the heart), torn plates and scorched grit at their roots (the tips' glints and the
       neon's light the GPU's) */
    metalspike: { box: v => [-1.7, -5.1 - (v ? 0.3 : 0), 1.7, 0.5], mat: { mat: 'iron', cols: HULLC }, el: 'spark', hp: 3, tips: {},
      paint(K, S, v, L) { const sd = 11 + v * 7, c = S.c, R = K.R1(41 + v), neon = NEON[L][v % 2], tips = []; contact(K, S, 1.35, 0.4, 0.62);
        const blades = [[0.06, 0.0, 0.42, 3.9 + v * 0.5, 0.04], [-0.42, 0.02, 0.34, 2.9, -0.2], [0.5, 0.02, 0.33, 2.5, 0.26], [-0.95, 0.05, 0.24, 1.6, -0.55], [0.98, 0.05, 0.25, 1.7, 0.6], [-0.18, 0.08, 0.26, 2.0, -0.08], [0.32, 0.1, 0.22, 1.4, 0.18]];
        blades.sort((a, b) => b[3] - a[3]);
        for (const [x, y, r, h, a] of blades) { const s2 = sd + x * 13; prism(K, S, x, y, r, r * 0.55, h * 0.78, h * 0.22, a, (f, q, wt, tip) => { hullM(K, q * 0.6 + x * 3, wt * h, s2, { burn: 0.7 * ss(0.25, 0, wt), tone: f < 0 ? 1.15 : f > 0 ? 0.8 : 1 });
            if (Math.abs(Math.abs(q) - 0.5) < 0.05) { K.M.rg = 0.12; K.M.fr += 0.12; K.M.fg += 0.12; K.M.fb += 0.14; }   // (the ridges)
            if (f === 0 && Math.abs(q - 0.12) < 0.07 && wt > 0.08 && wt < 0.88) { const k = ss(0.07, 0.0, Math.abs(q - 0.12)); glowGlassM(K, neon, 0.6 + 0.9 * k, { white: k * k * 0.9 }); } }, { flat: 0.5 });
          tips.push([x + Math.sin(a) * h * 0.98, y - Math.cos(a) * h * 0.98]); }
        S.unlock();
        for (let i = 0; i < 5; i++) floorShard(K, S, (i - 2) * 0.48 + (R() - 0.5) * 0.2, 0.18 + R() * 0.12, 0.22 + R() * 0.12, 0.08 + R() * 0.04, sd + i * 5, R, { burn: 0.6 });
        grit(c, R, 0, 0.1, 1.3, 0.3, 70); K.glint(c, tips[0][0] - 0.05, tips[0][1] + 0.3, 0.14, 0.7); K.ink(S, INK[L], 0.45); DEF.metalspike.tips[v + '|' + L] = tips.slice(0, 5); } },
    /* a torn plate of hull driven into the ground: two great jagged leaves (their lit faces and their dark torn edges), rivet rows
       along a seam, a crack where the violet current still crawls (its light the GPU's), shards and ash round its foot */
    hullshard: { box: () => [-1.6, -3.2, 1.6, 0.5], mat: { mat: 'iron', cols: HULLC }, el: 'spark', hp: 3,
      paint(K, S, v, L) { const sd = 21 + v * 5, c = S.c, R = K.R1(53 + v), m = v ? -1 : 1, X = p => p.map(q => [q[0] * m, q[1]]); contact(K, S, 1.3, 0.36, 0.6);
        const back = X([[-0.2, 0.05], [-0.55, -2.4], [-0.25, -2.9], [0.15, -2.55], [0.42, -2.75], [0.9, -1.4], [1.0, 0.05]]), front = X([[-1.05, 0.08], [-1.2, -1.6], [-0.85, -2.25], [-0.55, -1.95], [-0.35, -2.1], [0.05, -1.2], [0.25, 0.08]]);
        const edge = (pts, dx) => plate(K, S, pts.map(p => [p[0] + dx * m, p[1] + 0.03]), [0.8 * m, 0.4, 0.1], 0.02, (x, y) => { darkM(K, x * 3, y * 3, sd); K.M.ao *= 0.6; });
        edge(back, 0.08); plate(K, S, back, [0.25 * m, 0.9, 0.25], 0.06, (x, y, ao, e) => { hullM(K, x * 1.2 + 4, y * 1.2, sd + 1, { burn: 0.55 * ss(-0.6, 0.05, y), paint: 0.7, tone: 0.85 }); if (e > 0.5) { K.M.rg *= 0.5; K.M.fr += 0.08; K.M.fg += 0.08; K.M.fb += 0.1; } });
        edge(front, 0.1); plate(K, S, front, [-0.35 * m, 0.92, 0.15], 0.06, (x, y, ao, e) => { hullM(K, x * 1.2, y * 1.2, sd, { burn: 0.6 * ss(-0.7, 0.05, y), paint: 0.6 });
          const sx = x * m + 0.42 + 0.1 * Math.sin(y * 4), cr = ss(0.035, 0.0, Math.abs(sx - (-0.06 - 0.12 * y))) * ss(-0.15, -0.5, y) * ss(-2.0, -1.6, y); if (cr > 0) glowGlassM(K, E_VIO, 1.2 * cr, { white: cr * 0.5 });
          if (e > 0.5) { K.M.rg *= 0.5; K.M.fr += 0.1; K.M.fg += 0.1; K.M.fb += 0.12; } });
        S.unlock(); const rv = []; for (let i = 0; i < 7; i++) { const u = i / 6; rv.push([lerp(-0.95, -0.62, u) * m, lerp(-0.2, -1.85, u)]); } rivets(K, S, rv, 0.045, sd + 3);
        lump(K, S, 0, 0.0, 1.1, 0.2, { amp: 0.3, fr: 3, sd: sd + 9, bump: 0.6, flat: 0.8, mat: (dx, dy, ao, e, nz, wx, wy) => ashM(K, wx * 2, wy * 2, sd + 9) }); S.unlock();
        for (let i = 0; i < 4; i++) floorShard(K, S, (R() - 0.5) * 2.2, 0.2 + R() * 0.12, 0.16 + R() * 0.1, 0.06 + R() * 0.03, sd + i * 3, R);
        grit(c, R, 0, 0.12, 1.3, 0.25, 50); K.glint(c, -0.85 * m, -2.15, 0.12, 0.6); K.ink(S, INK[L], 0.45); } },
    /* a neon post: a dark steel frame (two rails), a tall glass tube glowing between them, a bolted cap and a cast foot, a power
       cable sagging from the cap to the ground (the tube's light the GPU's) */
    neonpost: { box: v => [-0.95, -4.25 - (v ? 0.4 : 0), 0.95, 0.4], mat: { mat: 'iron', cols: DARKC, mix: 'glass' }, el: 'spark', hp: 2,
      paint(K, S, v, L) { const sd = 31 + v, c = S.c, R = K.R1(61 + v), H = 3.4 + v * 0.4, neon = NEON[L][v % 2]; contact(K, S, 0.65, 0.22, 0.6);
        box(K, S, 0, 0.04, 0.4, 0.3, 0, 0.32, 0.05, (f, u, vv) => hullM(K, u * 2, vv * 2, sd, { burn: f === 't' ? 0.1 : 0.4, paint: 0.6 })); S.unlock();
        K.rev(S, 0, -0.32, h => 0.1 - h * 0.006, 0, H, { mat: (u, h, ao) => { glowGlassM(K, neon, 0.55 + 0.9 * ss(0.09, 0, Math.abs(u)) , { white: 0.5 * ss(0.05, 0, Math.abs(u)) }); if (h < 0.15 || h > H - 0.15) { darkM(K, u, h, sd); } } }); S.unlock();
        for (const sx of [-1, 1]) K.tube(S, [[sx * 0.17, -0.3], [sx * 0.15, -0.3 - H - 0.1]], 0.045, 0.04, (t, s2) => darkM(K, t * 6, s2, sd + sx)); S.unlock();
        for (let i = 1; i < 5; i++) { const y = -0.32 - H * i / 5; K.tube(S, [[-0.2, y], [0.2, y]], 0.022, 0.022, (t, s2) => darkM(K, t * 3, s2, sd)); } S.unlock();
        box(K, S, 0, -0.32 - H + 0.12, 0.26, 0.2, 0, 0.2, 0.04, (f, u, vv) => hullM(K, u * 2, vv * 2, sd + 4, { paint: 0.5 })); S.unlock();
        const ty = -0.32 - H - 0.05, pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, x = lerp(0.24, 0.85, u) * (v ? -1 : 1), y = lerp(ty, 0.0, u) + Math.sin(u * Math.PI) * 0.55; pts.push([x, y]); } K.tube(S, pts, 0.035, 0.04, (t, s2) => rubberM(K, t * 5, s2, sd)); S.unlock();
        grit(c, R, 0, 0.06, 0.6, 0.18, 30); K.ink(S, INK[L], 0.45); } },
    /* a great curved rib of the vessel arching out of the ground: a ridged hull spar with a fin of plating along its back, rivets,
       a fungal frill (pink, softly lit) at its root, torn plating hanging off it */
    wreckrib: { box: () => [-2.0, -3.9, 2.0, 0.5], mat: { mat: 'iron', cols: HULLC, mix: 'wood' }, el: 'dark', hp: 4,
      paint(K, S, v, L) { const sd = 41 + v * 3, c = S.c, R = K.R1(71 + v), m = v ? -1 : 1, H = 3.1; contact(K, S, 1.6, 0.4, 0.55);
        const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16, x = (-0.95 + 2.3 * u) * m, y = -(Math.sin(u * Math.PI * 0.92) * H * (0.8 + 0.2 * u)) + u * u * 0.6; pts.push([x, y]); }
        // its fin: a strip of plating along the outer side of the curve
        const fin = []; for (let i = 0; i <= 12; i++) { const u = 0.08 + 0.75 * i / 12, j = Math.round(u * 16), p = pts[j]; fin.push([p[0] - 0.05 * m, p[1] - 0.25 - 0.12 * Math.sin(u * 9)]); } for (let i = 12; i >= 0; i--) { const u = 0.08 + 0.75 * i / 12, j = Math.round(u * 16), p = pts[j]; fin.push([p[0] + 0.05 * m, p[1] + 0.02]); }
        plate(K, S, fin, [0.2 * m, 0.9, 0.35], 0.04, (x, y, ao, e) => { hullM(K, x * 2, y * 2, sd + 2, { burn: 0.3, paint: 0.5, tone: 0.85 }); const ribs = Math.abs(((x * 5) % 1 + 1) % 1 - 0.5); if (ribs > 0.45) K.M.ao *= 0.6; if (e > 0.5) K.M.rg *= 0.6; }); S.unlock();
        K.tube(S, pts, 0.34, 0.16, (t, s2, ao) => { hullM(K, t * 6, s2, sd, { burn: 0.6 * ss(0.15, 0, t) + 0.5 * ss(0.85, 1, t), tone: 0.95 }); const rb = Math.abs(((t * 14) % 1) - 0.5); if (rb > 0.42) { K.M.ao *= 0.55; } else if (rb < 0.08) { K.M.rg *= 0.6; K.M.fr += 0.06; K.M.fg += 0.06; K.M.fb += 0.08; } }); S.unlock();
        const rv = []; for (let i = 1; i < 14; i++) { const p = pts[i]; rv.push([p[0] + 0.12 * m, p[1] - 0.05]); } rivets(K, S, rv, 0.035, sd + 5);
        // torn plating hanging from the arch
        const hp = pts[6]; plate(K, S, [[hp[0] - 0.25, hp[1] + 0.1], [hp[0] + 0.3, hp[1] + 0.05], [hp[0] + 0.22, hp[1] + 0.9], [hp[0] + 0.05, hp[1] + 0.7], [hp[0] - 0.15, hp[1] + 1.05]], [0.1, 0.95, -0.2], 0.03, (x, y, ao, e) => hullM(K, x * 2, y * 2, sd + 7, { burn: 0.5, paint: 0.7 })); S.unlock();
        // the fungal frill at its root
        const rx = -0.85 * m; for (let i = 0; i < 9; i++) { const a = -0.4 + i * 0.12, x = rx + (i - 4) * 0.1 * m + (R() - 0.5) * 0.06, y = -0.12 - R() * 0.25, r = 0.1 + R() * 0.08;
          lump(K, S, x, y, r, r * 0.65, { amp: 0.3, fr: 4, sd: sd + i * 3, bump: 0.5, mat: (dx, dy, ao, e, nz, wx, wy) => { fungusM(K, wx * 3, wy * 3, sd + i, i % 3 ? E_FUNG : E_TEAL, 0.22); if (dy > 0.2) K.M.ao *= 0.7; } }); void a; }
        S.unlock(); grit(c, R, 0, 0.1, 1.6, 0.3, 50); K.ink(S, INK[L], 0.42); } },
    /* a tesla pylon: a hull plinth, a dark mast, ceramic insulators, three copper coils lit violet in their windings, a cap of
       glass with current crawling inside (its crackle and its arcs the GPU's) */
    pylon: { box: v => [-1.0, -4.3 - (v ? 0.3 : 0), 1.0, 0.45], mat: { mat: 'iron', cols: DARKC, mix: 'glass' }, el: 'spark', hp: 3,
      paint(K, S, v, L) { const sd = 51 + v, c = S.c, R = K.R1(81 + v), H = 3.1 + v * 0.3, neon = L === 'heart' ? E_AMB : L === 'cool' ? E_TEAL : E_VIO; contact(K, S, 0.75, 0.24, 0.6);
        box(K, S, 0, 0.04, 0.48, 0.34, 0, 0.4, 0.06, (f, u, vv) => { hullM(K, u * 2, vv * 2, sd, { burn: 0.3, paint: 0.7 }); if (f === 'f' && Math.abs(vv - 0.22) < 0.02) K.M.ao *= 0.5; }); S.unlock();
        K.rev(S, 0, -0.4, h => 0.09 - h * 0.008, 0, H, { mat: (u, h, ao) => darkM(K, u * 3, h * 2, sd) }); S.unlock();
        K.rev(S, 0, -0.4, h => 0.13 + 0.04 * Math.abs(Math.sin(h * Math.PI * 6)), 0.1, 0.75, { mat: (u, h, ao) => { const M = K.M; M.r = 0.62; M.g = 0.6; M.b = 0.58; M.rg = 0.18; M.cc = 0.8; } }); S.unlock();
        for (let i = 0; i < 3; i++) { const h0 = 0.95 + i * 0.62, rr = 0.36 - i * 0.04; K.rev(S, 0, -0.4, h => rr * (0.92 + 0.08 * Math.sin(Math.min(1, (h - h0) / 0.22) * Math.PI)), h0, h0 + 0.22, { mat: (u, h, ao) => { const gr = Math.abs(((h * 34) % 1) - 0.5) > 0.32 ? 1 : 0; copperM(K, u * 4, h * 30, sd + i, gr); if (gr) glowAdd(K.M, neon, 0.35); } }); S.unlock(); }
        const cy = -0.4 - H - 0.2; K.ball(S, 0, cy, 0.24, 0.24, (dx, dy) => glowGlassM(K, neon, 0.45 + 0.9 * (1 - Math.hypot(dx, dy)), { white: 0.6 * ss(0.5, 0, Math.hypot(dx, dy)) })); S.unlock();
        K.rev(S, 0, -0.4 - H + 0.02, h => 0.14, 0, 0.08, { mat: (u, h, ao) => darkM(K, u, h, sd), top: true, capMat: () => darkM(K, 0, 0, sd) }); S.unlock();
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 0.02; c.beginPath(); c.moveTo(-0.08, cy + 0.08); c.lineTo(0.03, cy - 0.04); c.lineTo(-0.02, cy - 0.1); c.lineTo(0.09, cy - 0.16); c.stroke(); c.restore();
        grit(c, R, 0, 0.06, 0.7, 0.2, 30); K.glint(c, -0.08, cy - 0.1, 0.1, 0.7); K.ink(S, INK[L], 0.45); } },
    /* alien fungus: a clump of soft pink stalks, each with a gilled cap lit from within (teal and pink), small buttons at their feet */
    fungusstalk: { box: () => [-1.1, -2.3, 1.1, 0.4], mat: { mat: 'leaf', cols: FUNGC }, el: 'leaf', hp: 1,
      paint(K, S, v, L) { const sd = 61 + v * 3, c = S.c, R = K.R1(91 + v), n = 4 + v; contact(K, S, 0.9, 0.25, 0.5);
        const st2 = []; for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 0.34 + (R() - 0.5) * 0.1, h = 0.75 + ((i * 7 + v) % 4) * 0.28 + R() * 0.2, cw = 0.2 + (i % 2) * 0.08 + R() * 0.05, lean = (R() - 0.5) * 0.25; st2.push({ x, h, cw, lean, e: i % 2 ? E_TEAL : E_FUNG }); }
        st2.sort((a, b) => b.h - a.h);
        for (const s of st2) { const tx = s.x + Math.sin(s.lean) * s.h, ty = -s.h;
          K.tube(S, [[s.x, 0.02], [s.x + Math.sin(s.lean) * s.h * 0.5 + 0.05, -s.h * 0.5], [tx, ty + 0.05]], 0.07, 0.05, (t, s2) => { fungusM(K, t * 3, s2, sd + s.x * 9, s.e, 0.06); K.M.r = 0.86; K.M.g = 0.72; K.M.b = 0.8; }); S.unlock();
          lump(K, S, tx, ty - s.cw * 0.12, s.cw, s.cw * 0.52, { amp: 0.12, fr: 5, sd: sd + s.x * 13, bump: 0.25, leaf: 14, mat: (dx, dy, ao, e, nz, wx, wy) => { if (dy > 0.25) { const gl = Math.abs(Math.sin(Math.atan2(dy, dx) * 18)); fungusM(K, wx * 4, wy * 4, sd, s.e, 0.35 + 0.4 * gl); K.M.r = 0.9; K.M.g = 0.78; K.M.b = 0.86; K.M.ao *= 0.8 + 0.2 * gl; } else fungusM(K, wx * 3, wy * 3, sd + 3, s.e, 0.3 + 0.15 * (1 - e)); } }); S.unlock(); }
        for (let i = 0; i < 6; i++) { const x = (R() - 0.5) * 1.6, r = 0.05 + R() * 0.05; lump(K, S, x, 0.02 - r * 0.4, r, r * 0.7, { amp: 0.2, sd: sd + i, bump: 0.3, mat: (dx, dy, ao, e, nz, wx, wy) => fungusM(K, wx * 4, wy * 4, sd + i, E_FUNG, 0.25) }); } S.unlock();
        K.ink(S, INK[L], 0.35); } },
    /* a glass tank of coolant: a bolted steel foot and cap, the glass between them full of glowing teal coolant (deeper at the foot,
       pale bands where it refracts), two steel bands, side struts, a pipe from its cap into the floor, bubbles rising */
    coolanttank: { box: v => [-1.1, -3.3 - (v ? 0.4 : 0), 1.1, 0.45], mat: { mat: 'glass', cols: GLASSC, mix: 'iron' }, el: 'water', hp: 3,
      paint(K, S, v, L) { const sd = 71 + v, c = S.c, R = K.R1(101 + v), H = 2.0 + v * 0.4, e = L === 'heart' ? E_PINK : E_TEAL; contact(K, S, 0.85, 0.28, 0.62);
        K.rev(S, 0, 0, h => h < 0.08 ? 0.66 : 0.6, 0, 0.36, { mat: (u, h, ao) => { hullM(K, u * 2, h * 3, sd, { paint: 0.8, tone: 1.05 }); if (Math.abs(h - 0.22) < 0.02) K.M.ao *= 0.5; } }); S.unlock();
        K.rev(S, 0, -0.36, h => 0.5, 0, H, { mat: (u, h, ao) => { const k = 0.35 + 0.55 * (1 - h / H) + 0.25 * Math.pow(Math.max(0, Math.sin(h * 7 + u * 2)), 12), edge = ss(0.25, 0.5, Math.abs(u)); glowGlassM(K, e, k * (1 - edge * 0.5), { white: Math.pow(Math.max(0, Math.sin(h * 7 + u * 2)), 30) * 0.4 }); if (Math.abs(u + 0.28) < 0.04) { K.M.er += 0.25; K.M.eg += 0.3; K.M.eb += 0.3; } } }); S.unlock();
        for (const hb of [H * 0.33, H * 0.66]) { K.rev(S, 0, -0.36, h => 0.53, hb - 0.05, hb + 0.05, { mat: (u, h, ao) => darkM(K, u * 4, h, sd + 2) }); S.unlock(); }
        K.rev(S, 0, -0.36 - H, h => 0.6 - h * h * 0.6, 0, 0.32, { mat: (u, h, ao) => hullM(K, u * 2, h * 3, sd + 3, { paint: 0.8, tone: 1.05 }), top: true, capMat: (x) => darkM(K, x, 0, sd) }); S.unlock();
        for (const sx of [-1, 1]) K.tube(S, [[sx * 0.56, -0.3], [sx * 0.56, -0.4 - H]], 0.035, 0.035, (t, s2) => darkM(K, t * 5, s2, sd + sx)); S.unlock();
        const m = v ? -1 : 1, pp = [[0.1 * m, -0.6 - H], [0.55 * m, -0.75 - H], [0.85 * m, -0.6 - H], [0.88 * m, -0.2], [0.88 * m, 0.08]]; K.tube(S, pp, 0.07, 0.07, (t, s2) => { hullM(K, t * 4, s2, sd + 5, { paint: 0.6 }); if (Math.abs(t - 0.5) < 0.02) K.M.ao *= 0.5; }); S.unlock();
        c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { const x = (R() - 0.5) * 0.7, y = -0.4 - R() * (H - 0.1), r = 0.015 + R() * 0.03; c.fillStyle = `rgba(220,255,250,${0.3 + R() * 0.4})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } c.restore();
        grit(c, R, 0, 0.08, 0.8, 0.2, 25); K.glint(c, -0.3, -0.5 - H * 0.6, 0.14, 0.6); K.ink(S, INK[L], 0.45); } },
    /* three thick coolant pipes stacked on cradles: bolted collars, weld seams, a wheel valve on the top one, condensation running
       down, a pool of spilled coolant glowing at their foot (its light the GPU's) */
    pipestack: { box: () => [-1.65, -1.95, 1.65, 0.5], mat: { mat: 'iron', cols: ['#4A5E70', '#2A3A48', '#9AB4C6'] }, el: 'water', hp: 3,
      paint(K, S, v, L) { const sd = 81 + v, c = S.c, R = K.R1(111 + v), m = v ? -1 : 1; contact(K, S, 1.4, 0.32, 0.6);
        c.save(); c.scale(1, K.K); const g = c.createRadialGradient(0.7 * m, 0.25 / K.K, 0, 0.7 * m, 0.25 / K.K, 0.6); g.addColorStop(0, 'rgba(63,224,200,.55)'); g.addColorStop(1, 'rgba(63,224,200,0)'); c.fillStyle = g; c.fillRect(0.1 * m - 0.6, 0, 1.2, 1.4); c.restore();
        for (const sx of [-0.95, 0.95]) { box(K, S, sx, 0.02, 0.1, 0.32, 0, 0.62, 0.03, (f, u, vv) => darkM(K, u * 3, vv * 3, sd)); S.unlock(); }
        for (let i = 0; i < 3; i++) { const y = -0.3 - i * 0.43, x0 = -1.45 + (i % 2) * 0.15, x1 = 1.45 - ((i + 1) % 2) * 0.15;
          K.tube(S, [[x0, y], [x1, y]], 0.2, 0.2, (t, s2) => { hullM(K, t * 6, s2 * 0.5 + i, sd + i, { paint: 0.85, pc: [0.06, 0.12, 0.14], tone: 1.1 }); const tt = t * (x1 - x0); for (const cx of [0.25, x1 - x0 - 0.3, (x1 - x0) / 2]) if (Math.abs(tt - cx) < 0.07) { darkM(K, tt * 9, s2, sd); if (Math.abs(tt - cx) > 0.05) K.M.ao *= 0.6; }
            if (s2 > 0.3 && K.vn(t * 30 + i, s2 * 4) > 0.7) { K.M.cc = 0.9; K.M.rg = 0.1; } }); S.unlock();
          for (const cx of [x0 + 0.25, x1 - 0.3]) for (const yy of [-0.17, 0.17]) { K.ball(S, cx, y + yy, 0.03, 0.03, (dx, dy) => chromeM(K, dx, dy, sd)); } S.unlock(); }
        const vx = 0.35 * m, vy = -0.3 - 2 * 0.43 - 0.22; K.tube(S, [[vx, vy + 0.1], [vx, vy - 0.12]], 0.045, 0.045, (t, s2) => darkM(K, t, s2, sd)); S.unlock();
        const ring = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; ring.push([vx + Math.cos(a) * 0.22, vy - 0.14 + Math.sin(a) * 0.08]); } K.tube(S, ring, 0.03, 0.03, (t, s2) => { const M = K.M; M.r = 0.1; M.g = 0.6; M.b = 0.55; M.rg = 0.35; M.cc = 0.6; }); S.unlock();
        for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; K.tube(S, [[vx, vy - 0.14], [vx + Math.cos(a) * 0.2, vy - 0.14 + Math.sin(a) * 0.07]], 0.016, 0.016, (t, s2) => darkM(K, t, s2, sd)); } S.unlock();
        lump(K, S, 0.7 * m, 0.2, 0.42, 0.09, { amp: 0.25, fr: 3, sd: sd + 4, bump: 0.15, flat: 0.5, mat: () => glowGlassM(K, E_TEAL, 0.35) }); S.unlock();
        grit(c, R, 0, 0.1, 1.4, 0.25, 30); K.glint(c, -0.8, -0.42, 0.1, 0.5); K.ink(S, INK[L], 0.45); } },
    /* a wheel valve on a short standpipe: a flanged foot bolted to the deck, the pipe, a teal wheel with four spokes */
    valve: { box: () => [-0.75, -1.9, 0.75, 0.4], mat: { mat: 'iron', cols: ['#4A5E70', '#2A3A48', '#9AB4C6'] }, el: 'water', hp: 2,
      paint(K, S, v, L) { const sd = 91 + v, c = S.c, R = K.R1(121 + v); contact(K, S, 0.5, 0.18, 0.6);
        K.rev(S, 0, 0, h => h < 0.1 ? 0.3 : 0.12, 0, 1.0, { mat: (u, h, ao) => hullM(K, u * 2, h * 3, sd, { paint: 0.8, pc: [0.06, 0.12, 0.14] }), top: true, capMat: () => darkM(K, 0, 0, sd) }); S.unlock();
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; K.ball(S, Math.cos(a) * 0.24, -0.05 + Math.sin(a) * 0.08, 0.03, 0.03, (dx, dy) => chromeM(K, dx, dy, sd)); } S.unlock();
        const cy = -1.12, ring = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * TAU; ring.push([Math.cos(a) * 0.38, cy + Math.sin(a) * 0.38]); } K.tube(S, ring, 0.045, 0.045, (t, s2) => { const M = K.M; M.r = 0.08; M.g = 0.55; M.b = 0.5; M.rg = 0.3; M.cc = 0.7; }); S.unlock();
        for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; K.tube(S, [[0, cy], [Math.cos(a) * 0.36, cy + Math.sin(a) * 0.36]], 0.025, 0.025, (t, s2) => darkM(K, t, s2, sd)); } S.unlock();
        K.ball(S, 0, cy, 0.07, 0.07, (dx, dy) => chromeM(K, dx, dy, sd)); S.unlock(); grit(c, R, 0, 0.05, 0.5, 0.15, 15); K.ink(S, INK[L], 0.45); } },
    /* a piston of flesh and metal: a steel collar in the deck, a ribbed sleeve of living flesh, an amber joint (its pulse the GPU's),
       a polished rod up into a bolted steel head; tendons from the sleeve into the floor */
    piston: { box: v => [-1.0, -4.3 - (v ? 0.35 : 0), 1.0, 0.45], mat: { mat: 'flesh', cols: FLESHC, mix: 'iron' }, el: 'fire', hp: 3,
      paint(K, S, v, L) { const sd = 101 + v, c = S.c, R = K.R1(131 + v), up = v * 0.35; contact(K, S, 0.8, 0.26, 0.6);
        for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) { const x0 = sx * (0.42 + k * 0.2); K.tube(S, [[x0 * 0.9, -0.6 - k * 0.15], [x0 * 1.3, -0.25], [x0 * 1.55 + sx * 0.1, 0.06]], 0.06 - k * 0.015, 0.035, (t, s2) => fleshM(K, t * 4, s2, sd + sx * 3 + k, { glow: 0.2 })); } S.unlock();
        K.rev(S, 0, 0, h => h < 0.12 ? 0.6 : 0.52, 0, 0.3, { mat: (u, h, ao) => { hullM(K, u * 2, h * 3, sd, { burn: 0.3 }); if (Math.abs(h - 0.15) < 0.015) K.M.ao *= 0.5; } }); S.unlock();
        K.rev(S, 0, -0.3, h => 0.42 + 0.06 * Math.abs(Math.sin(h * Math.PI * 4.5)) - h * 0.05, 0, 1.15, { mat: (u, h, ao) => { fleshM(K, u * 2, h * 2, sd + 1, { vein: E_AMB, glow: 0.4 }); const rib = Math.abs(Math.sin(h * Math.PI * 4.5)); K.M.ao *= 0.65 + 0.35 * rib; } }); S.unlock();
        K.ball(S, 0, -1.5, 0.22, 0.2, (dx, dy) => glowGlassM(K, E_AMB, 0.5 + 0.8 * (1 - Math.hypot(dx, dy)), { white: 0.5 * ss(0.5, 0, Math.hypot(dx, dy)) })); S.unlock();
        K.rev(S, 0, -1.62, h => 0.12, 0, 1.6 + up, { mat: (u, h, ao) => chromeM(K, u * 2, h, sd) }); S.unlock();
        K.rev(S, 0, -3.15 - up, h => h < 0.05 || h > 0.33 ? 0.36 : 0.32, 0, 0.38, { mat: (u, h, ao) => { hullM(K, u * 2, h * 3, sd + 3, { paint: 0.5 }); if (Math.abs(h - 0.19) < 0.02) K.M.ao *= 0.5; }, top: true, capMat: (x) => hullM(K, x, 3, sd + 4) }); S.unlock();
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3, x = Math.cos(a) * 0.3; if (Math.sin(a) < -0.2) continue; K.ball(S, x, -3.55 - up + Math.sin(a) * 0.1, 0.035, 0.035, (dx, dy) => chromeM(K, dx, dy, sd)); } S.unlock();
        grit(c, R, 0, 0.08, 0.8, 0.22, 25, '#2A1028'); K.glint(c, -0.05, -2.4, 0.08, 0.6); K.ink(S, INK[L], 0.45); } },
    /* a nerve cable: a thick living cable looping out of the deck and back in through steel collars, its sheath ribbed, nodules
       along it lit amber (its pulses run along it: the GPU's) */
    nervecable: { box: () => [-1.8, -2.65, 1.8, 0.5], mat: { mat: 'flesh', cols: FLESHC }, el: 'spark', hp: 2,
      paint(K, S, v, L) { const sd = 111 + v, c = S.c, R = K.R1(141 + v), m = v ? -1 : 1; contact(K, S, 1.4, 0.3, 0.55);
        const P = []; for (let i = 0; i <= 20; i++) { const u = i / 20, a = Math.PI * (1 - u); P.push([Math.cos(a) * 1.15 * m + Math.sin(u * TAU) * 0.12, -Math.sin(a) * (1.85 + 0.2 * Math.sin(u * 3)) + 0.02]); }
        K.tube(S, P, 0.24, 0.22, (t, s2, ao) => { fleshM(K, t * 8, s2, sd, { vein: E_AMB, glow: 0.5 }); const rb = Math.abs(((t * 24) % 1) - 0.5); K.M.ao *= 0.7 + 0.3 * (rb < 0.38 ? 1 : 0.4); }); S.unlock();
        for (const e of [P[0], P[20]]) { K.rev(S, e[0], 0.04, h => h < 0.06 ? 0.38 : 0.3, 0, 0.22, { mat: (u, h, ao) => hullM(K, u * 2, h * 3, sd + 2, { burn: 0.3 }), top: true, capMat: () => darkM(K, 0, 0, sd) }); S.unlock(); }
        for (let i = 2; i < 19; i += 3) { const p = P[i]; K.ball(S, p[0], p[1] - 0.06, 0.1, 0.09, (dx, dy) => glowGlassM(K, E_AMB, 0.4 + 0.7 * (1 - Math.hypot(dx, dy)), { white: 0.3 * ss(0.5, 0, Math.hypot(dx, dy)) })); } S.unlock();
        grit(c, R, 0, 0.08, 1.4, 0.25, 30, '#2A1028'); K.ink(S, INK[L], 0.42); } },
    /* a great ribbed tube of glossy black biomech arching out of the floor and diving back in, ribs ringing it, violet in its grooves */
    biotube: { box: () => [-2.7, -4.3, 2.7, 0.5], mat: { mat: 'iron', cols: BONEC }, el: 'dark', hp: 4,
      paint(K, S, v, L) { const sd = 121 + v, c = S.c, R = K.R1(151 + v), m = v ? -1 : 1, W2 = 1.9 + v * 0.3, H = 3.0 + v * 0.3, r0 = 0.62 + v * 0.08; contact(K, S, W2 * 1.15, 0.4, 0.6);
        const P = []; for (let i = 0; i <= 24; i++) { const u = i / 24, a = Math.PI * (1 - u); P.push([Math.cos(a) * W2 * m, -Math.sin(a) * H + Math.sin(u * TAU) * 0.15 + r0 * 0.4]); }
        K.tube(S, P, r0, r0 * 0.82, (t, s2, ao) => { const rib = Math.abs(((t * 18) % 1) - 0.5); boneM(K, t * 10, s2, sd, rib > 0.4 ? (rib - 0.4) * 10 : 0); if (rib < 0.12) { K.M.cc = 1; K.M.rg = 0.12; } }); S.unlock();
        for (const e of [P[0], P[24]]) { lump(K, S, e[0], 0.02, r0 * 1.3, r0 * 0.4, { amp: 0.25, fr: 4, sd: sd + e[0] * 9, bump: 0.5, flat: 0.6, mat: (dx, dy, ao, e2, nz, wx, wy) => fleshM(K, wx * 3, wy * 3, sd + 3, { glow: 0.3 }) }); } S.unlock();
        c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.05; c.beginPath(); for (let i = 3; i <= 21; i++) { const p = P[i]; i === 3 ? c.moveTo(p[0] - r0 * 0.35, p[1] - r0 * 0.45) : c.lineTo(p[0] - r0 * 0.35, p[1] - r0 * 0.45); } c.stroke(); c.restore();
        grit(c, R, 0, 0.1, W2 * 1.1, 0.3, 30, '#2A1028'); K.ink(S, INK[L], 0.45); } },
    /* a tall twisting spire like a spine: stacked ribbed segments of glossy black biomech, curved thorns off it, a glossy tip */
    xenospire: { box: () => [-1.5, -6.3, 1.5, 0.45], mat: { mat: 'iron', cols: BONEC }, el: 'dark', hp: 4,
      paint(K, S, v, L) { const sd = 131 + v, c = S.c, R = K.R1(161 + v), tw = v ? -1 : 1, H = 4.6 + v * 0.4; contact(K, S, 1.0, 0.32, 0.6);
        const P = []; for (let i = 0; i <= 22; i++) { const u = i / 22; P.push([Math.sin(u * 5 + v) * 0.3 * tw * u, -u * H]); }
        for (let i = 3; i < 19; i += 3) for (const sd2 of [-1, 1]) { const p = P[i], u = i / 22, w = 0.55 * (1 - u * 0.8); prism(K, S, p[0] + sd2 * w * 0.6, p[1] + 0.05, 0.07 * (1 - u * 0.5), 0.04, 0.45 * (1 - u * 0.4), 0.3, sd2 * (0.95 - u * 0.3), (f, q, wt) => boneM(K, q, wt * 3, sd + i, 0)); } S.unlock();
        K.tube(S, P, 0.55, 0.08, (t, s2, ao) => { const seg = Math.abs(((t * 22) % 1) - 0.5); boneM(K, t * 12, s2, sd, seg > 0.4 ? (seg - 0.4) * 5 : 0); if (seg < 0.1) { K.M.rg = 0.14; } }); S.unlock();
        const tp = P[22]; prism(K, S, tp[0], tp[1] + 0.05, 0.08, 0.06, 0.2, 0.6, 0.25 * tw, (f, q, wt) => { boneM(K, q, wt, sd + 9, 0); K.M.cc = 1; }); S.unlock();
        lump(K, S, 0, 0.0, 0.75, 0.22, { amp: 0.3, fr: 4, sd: sd + 3, bump: 0.5, flat: 0.6, mat: (dx, dy, ao, e, nz, wx, wy) => fleshM(K, wx * 3, wy * 3, sd + 3, { glow: 0.3 }) }); S.unlock();
        c.save(); c.strokeStyle = 'rgba(255,255,255,.32)'; c.lineWidth = 0.04; c.lineCap = 'round'; c.beginPath(); for (let i = 1; i <= 20; i++) { const p = P[i], w = 0.55 * (1 - i / 22 * 0.85); i === 1 ? c.moveTo(p[0] - w * 0.45, p[1]) : c.lineTo(p[0] - w * 0.45, p[1]); } c.stroke(); c.restore();
        K.glint(c, tp[0], tp[1] - 0.5, 0.12, 0.7); K.ink(S, INK[L], 0.45); DEF.xenospire.tips[v + '|' + L] = [[tp[0], tp[1] - 0.7]]; }, tips: {} },
    /* a column of stacked vertebrae: each a glossy black bone with a ridge and two short wings, flesh between them, a pink glow on top */
    vertebra: { box: () => [-1.3, -4.4, 1.3, 0.45], mat: { mat: 'iron', cols: BONEC }, el: 'dark', hp: 3,
      paint(K, S, v, L) { const sd = 141 + v, c = S.c, R = K.R1(171 + v), n = 5 + v; contact(K, S, 0.85, 0.28, 0.6);
        for (let i = 0; i < n; i++) { const y = -0.32 - i * 0.6, w = 0.55 - i * 0.03;
          lump(K, S, 0, y + 0.18, w * 0.55, 0.12, { amp: 0.2, sd: sd + i * 3, bump: 0.4, mat: (dx, dy, ao, e, nz, wx, wy) => fleshM(K, wx * 3, wy * 3, sd + i, { glow: 0.4 }) }); S.unlock();
          for (const sx of [-1, 1]) prism(K, S, sx * w * 0.5, y + 0.02, 0.1, 0.05, w * 0.7, 0.3, sx * (1.2 - i * 0.04), (f, q, wt) => boneM(K, q, wt * 2, sd + i + sx, 0)); S.unlock();
          lump(K, S, 0, y - 0.1, w, 0.24, { amp: 0.08, fr: 2, sd: sd + i, bump: 0.2, leaf: 6, mat: (dx, dy, ao, e, nz, wx, wy) => { boneM(K, wx * 4, wy * 4, sd + i, ss(0.6, 1.0, e) * 0.3); if (Math.abs(dx) < 0.08 && dy < 0) { K.M.cc = 1; K.M.rg = 0.08; } } }); S.unlock(); }
        K.glint(c, -0.15, -0.5 - (n - 1) * 0.6, 0.12, 0.6); K.ink(S, INK[L], 0.45); } },
  };
  const KINDS = ['metalspike', 'hullshard', 'neonpost', 'wreckrib', 'pylon', 'fungusstalk', 'coolanttank', 'pipestack', 'valve', 'piston', 'nervecable', 'biotube', 'xenospire', 'vertebra'];

  /* ======================= the cache and the drawing ======================= */
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0; const CAP = 80, TCAP = 96;
  function paint(name, v, P, L) { const B = BP(); if (!B) return null; const K = B.kit, D = DEF[name]; if (!D) return null; const b = D.box(v), t0 = now(); let S = null;
    try { S = K.surface(b[0], b[1], b[2], b[3], P); lit(K, L, () => { D.paint(K, S, v, L); S.unlock(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('YUG_PROPS', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  function sprite(name, v, P, force, L) { if (!DEF[name] || !BP()) return null; L = L || 'wreck'; P = Math.max(8, Math.min(CAP, Math.round(P || BASE || 48))); const key = name + '|' + v + '|' + L + '|' + P; let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 12) return null;
    s = paint(name, v, P, L); if (s) { if (CACHE.size > 160) release(true); CACHE.set(key, s); } return s; }
  const qP = P => Math.max(8, Math.round(Math.exp(Math.round(Math.log(P) * 10) / 10)));
  function pic(c, name, v, T, L, sc) { let P = Math.min(CAP, qP(T * (sc || 1) * kOf(c))); if (BASE && P <= BASE * 1.1 && P >= BASE * 0.5) P = BASE;
    let s = sprite(name, v, P, false, L); if (!s) { const pre = name + '|' + v + '|' + L + '|'; for (const [k, s2] of CACHE) if (k.startsWith(pre)) { s = s2; break; } } if (!s) STATS.misses++; return s; }
  const put = (c, s, Xs, Ys, T, sx, sy, rot) => { const f = T / s.P; c.save(); c.translate(Xs, Ys); if (rot) c.rotate(rot); if ((sx || 1) !== 1 || (sy || 1) !== 1) c.scale(sx || 1, sy || 1); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); c.restore(); STATS.draws++; };
  // a piece of a trial or a prop at a screen spot (its feet), T the tile in px: false when it could not be drawn (the caller draws its old 2D)
  function piece(c, name, v, Xs, Ys, T, o) { if (off() || !DEF[name]) return false; o = o || {}; const L = o.L || (LIVE && LIVE.L) || 'wreck', s = pic(c, name, v, T, L); if (!s) return false; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; put(c, s, Xs, Ys, T * (o.s || 1), (o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1, o.rot); c.restore(); STATS.pieces++; return true; }

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
  // the Torn Hull: scorched ground of ash and black grit; torn hull plates lie half sunk in it in staggered rows (bevelled, riveted
  // along their rims, a weld seam across, burned toward their torn edges); cracks in the ground where violet current still crawls;
  // pink lichen in the hollows
  function wreckFloor(x, y, mode) { const K = GK, M = K.M, ci = Math.floor(y / 1.5), fy = y - ci * 1.5, cim = md(ci, 4), xx = x + [0, 0.7, 1.3, 0.4][cim], si = Math.floor(xx / 2), fx = xx - si * 2, sid = md(si, 3) + cim * 3;
    const has = hh(sid, 1, 401) < 0.55, rough = pvn(x * 3, y * 3, 18, 403), inset = 0.07 + rough * 0.18 + (hh(sid, 2, 401) < 0.5 ? ss(1.1, 1.9, fx) * 0.5 : 0), dj = Math.min(fx, 2 - fx, fy, 1.5 - fy), inP = has && dj > inset;
    const g = pfbm(x * 0.9, y * 0.9, 5, 405), cc = pcell(x * 1.5, y * 1.5, 9, 407), crack = ss(0.045, 0.01, cc.d2 - cc.d) * ss(0.55, 0.65, pvn(x * 0.8, y * 0.8, 5, 409)), peb = pcell(x * 7, y * 7, 42, 411), pb = ss(0.3, 0.12, peb.d) * (hh(peb.id, 3, 412) < 0.35 ? 1 : 0);
    let h;
    if (inP) { const bev = ss(inset, inset + 0.06, dj), along = Math.min(fx, 2 - fx) < Math.min(fy, 1.5 - fy) ? fy : fx, rv = Math.abs(dj - inset - 0.12) < 0.03 && Math.abs(md(along, 0.22) - 0.11) < 0.032, weld = Math.abs(fx - 1) < 0.025, tilt = (hh(sid, 4, 401) - 0.5) * 0.03 * (fx - 1);
      h = 0.018 + 0.016 * bev + tilt * 0.5 + (rv ? 0.012 : 0) - (weld ? 0.006 : 0) + 0.002 * pvn(x * 9, y * 9, 54, 413);
      if (!mode) return h; const burn = ss(inset + 0.35, inset, dj) * 0.8 + ss(0.6, 0.85, pvn(x * 2, y * 2, 12, 415)) * 0.5;
      hullT(K, x * 0.5 + sid, y * 0.5, 417 + sid, { burn: clamp(burn, 0, 1), paint: hh(sid, 5, 401) < 0.4 ? 0.75 * ss(0.45, 0.55, pvn(x * 4, y * 4, 24, 419)) : 0 }); M.ao *= 0.75 + 0.25 * bev;
      if (rv) { M.rg = 0.2; M.ao *= 0.9; } if (weld) { M.mt = 0.5; M.rg = 0.6; M.ao *= 0.7; } return h; }
    h = 0.02 * g + 0.012 * pb - 0.014 * crack + 0.004 * pvn(x * 12, y * 12, 72, 421) - (has ? 0.01 * ss(inset, inset - 0.12, dj) : 0);
    if (!mode) return h;
    const t = 0.055 * (0.75 + 0.5 * g); M.r = t * 1.0; M.g = t * 0.94; M.b = t * 1.06; M.rg = 0.9; if (pb > 0.3) { M.r = 0.12; M.g = 0.11; M.b = 0.14; M.rg = 0.55; }
    const sp = pvn(x * 40, y * 40, 240, 423); if (sp > 0.84) { M.r += 0.09; M.g += 0.085; M.b += 0.1; } else if (sp < 0.2) { M.r *= 0.6; M.g *= 0.6; M.b *= 0.6; }
    const li = ss(0.7, 0.75, pfbm(x * 0.7 + 3, y * 0.7, 4, 425)) * (1 - crack); if (li > 0) { const sp2 = pvn(x * 22, y * 22, 132, 427); if (sp2 > 0.55) { M.r = lerp(M.r, 0.42, li * 0.6); M.g = lerp(M.g, 0.2, li * 0.6); M.b = lerp(M.b, 0.32, li * 0.6); M.er += 0.05 * li; M.eb += 0.04 * li; } }
    if (crack > 0.05) { const k = crack * (0.5 + 0.5 * pvn(x * 4, y * 4, 24, 429)); M.ao *= 1 - crack * 0.5; M.er += 0.55 * k; M.eg += 0.22 * k; M.eb += 0.78 * k; }
    if (has) M.ao *= 1 - 0.35 * ss(inset, inset - 0.15, dj);   // (the ground's shadow under a plate's edge)
    return h; }
  // the Coolant Vaults: a deck of steel panels two tiles square, each bevelled and riveted round its rim; some with a raised diamond
  // tread, some smooth and scuffed, some grated (the coolant's teal glow through the slots), a few a round hatch; condensation
  // pooled in sheets on them (glossy), teal stains run from the grates
  function coolFloor(x, y, mode) { const K = GK, M = K.M, pi = Math.floor(x / 2), pj = Math.floor(y / 2), fx = x - pi * 2, fy = y - pj * 2, pid = md(pi, 3) + md(pj, 3) * 3, kind = Math.floor(hh(pid, 1, 501) * 4);
    const dj = Math.min(fx, 2 - fx, fy, 2 - fy), bev = ss(0.0, 0.05, dj), joint = ss(0.025, 0.008, dj), along = Math.min(fx, 2 - fx) < Math.min(fy, 2 - fy) ? fy : fx, rv = Math.abs(dj - 0.12) < 0.028 && Math.abs(md(along, 0.25) - 0.125) < 0.03 && dj < 0.2;
    let h = 0.03 * bev + (rv ? 0.012 : 0) + 0.002 * pvn(x * 10, y * 10, 60, 503), grate = 0, tread = 0, hatch = 0;
    if (kind === 0 && dj > 0.2) { const u = (fx + fy) * 4, w2 = (fx - fy) * 4; tread = ss(0.2, 0.08, Math.abs(md(u, 1) - 0.5)) * ss(0.35, 0.25, Math.abs(md(w2, 2) - 1)); h += 0.012 * tread; }
    else if (kind === 1 && dj > 0.22) { const sl = Math.abs(md(fx, 0.25) - 0.125); grate = ss(0.05, 0.035, sl) * ss(0.2, 0.26, dj); h -= 0.05 * grate; }
    else if (kind === 2) { const r = Math.hypot(fx - 1, fy - 1); hatch = ss(0.03, 0.01, Math.abs(r - 0.6)) + ss(0.025, 0.008, Math.abs(r - 0.48)) * 0.6; h -= 0.008 * hatch; if (r < 0.12) h += 0.015; }
    if (!mode) return h;
    if (grate > 0.5) { const k = 0.35 + 0.5 * pvn(x * 2, y * 2 - 0.3, 12, 505); M.r = 0.01; M.g = 0.02; M.b = 0.025; M.rg = 0.6; M.ao = 0.6; M.er += 0.08 * k; M.eg += 0.5 * k; M.eb += 0.45 * k; return h; }
    hullT(K, x * 0.5 + pid * 1.3, y * 0.5, 507 + pid, { tone: 1.12, paint: kind === 3 ? 0.85 : 0.3 * ss(0.4, 0.6, pvn(x * 3, y * 3, 18, 509)), pc: [0.07, 0.13, 0.15] }); M.ao *= 0.72 + 0.28 * bev;
    if (joint > 0.4) { M.ao *= 0.4; M.rg = 0.7; }
    if (tread > 0.3) { M.rg *= 0.7; M.fr += 0.06; M.fg += 0.07; M.fb += 0.07; }
    if (rv) { M.rg = 0.2; } if (hatch > 0.3) M.ao *= 0.5;
    const wet = ss(0.6, 0.66, pfbm(x * 0.8 + 2, y * 0.8, 5, 511)); if (wet > 0) { M.cc = 0.95 * wet; M.rg = lerp(M.rg, 0.08, wet); M.fr *= 1 - 0.25 * wet; M.fg *= 1 - 0.2 * wet; M.fb *= 1 - 0.18 * wet; }
    if (kind === 1) { const stn = ss(0.7, 0.85, pvn(x * 3, y * 6, 18, 513)) * ss(0.4, 0.2, dj); if (stn > 0) { M.r = lerp(M.r, 0.05, stn); M.g = lerp(M.g, 0.22, stn); M.b = lerp(M.b, 0.2, stn); M.mt *= 1 - stn * 0.5; M.eg += 0.05 * stn; M.eb += 0.05 * stn; } }
    return h; }
  // the Engine Heart: living flesh grown over the engine's plates: a wet membrane, mottled violet and magenta, swollen in places,
  // a web of raised veins (faintly lit, amber and pink), pores; where the flesh is thin the steel shows through, bolted, and the
  // flesh rises in a lip round it
  function heartFloor(x, y, mode) { const K = GK, M = K.M, n = pfbm(x * 0.55, y * 0.55, 3.3, 601) * 0.65 + pfbm(x * 1.3, y * 1.3, 8, 602) * 0.35, metal = ss(0.6, 0.64, n), lip = ss(0.53, 0.6, n) - metal;
    const cc = pcell(x * 1.2, y * 1.2, 7.2, 603), vein = ss(0.06, 0.015, cc.d2 - cc.d) * (1 - metal), vein2 = ss(0.035, 0.0, Math.abs(pvn(x * 2.5, y * 2.5, 15, 605) - 0.5)) * 0.6 * (1 - metal), pore = ss(0.84, 0.92, pvn(x * 9, y * 9, 54, 607)) * (1 - metal);
    const pj = Math.floor(y / 1.5), pi = Math.floor(x / 1.5), fx = x - pi * 1.5, fy = y - pj * 1.5, dj = Math.min(fx, 1.5 - fx, fy, 1.5 - fy), rv = Math.abs(dj - 0.1) < 0.03 && Math.abs(md(Math.min(fx, 1.5 - fx) < Math.min(fy, 1.5 - fy) ? fy : fx, 0.25) - 0.125) < 0.03;
    const swell = pfbm(x * 0.8, y * 0.8, 4.8, 609);
    let h = metal > 0.5 ? 0.0 + 0.02 * ss(0, 0.04, dj) + (rv ? 0.012 : 0) : 0.035 * swell + 0.022 * vein + 0.012 * vein2 - 0.015 * pore + 0.04 * lip + 0.004 * pvn(x * 14, y * 14, 84, 611);
    if (!mode) return h;
    if (metal > 0.5) { hullT(K, x * 0.5, y * 0.5, 613 + md(pi, 4) + md(pj, 4) * 4, { burn: 0.3 * ss(0.6, 0.85, pvn(x * 2, y * 2, 12, 615)), tone: 0.9 }); if (dj < 0.02) { M.ao *= 0.4; M.er += 0.2; M.eg += 0.1; M.eb += 0.02; } if (rv) M.rg = 0.2; M.ao *= 0.6 + 0.4 * ss(0.6, 0.7, n); return h; }
    fleshT(K, x, y, 617, { wet: 0.5 + 0.3 * swell }); M.ao *= 0.75 + 0.25 * swell;
    if (pore > 0.3) { M.ao *= 0.5; M.r *= 0.6; M.b *= 0.7; M.cc *= 0.4; }
    if (vein > 0.05 || vein2 > 0.05) { const k = Math.max(vein, vein2), pk = pvn(x * 2, y * 2, 12, 619); M.r = lerp(M.r, 0.5, k * 0.6); M.g = lerp(M.g, 0.16, k * 0.6); M.b = lerp(M.b, 0.34, k * 0.4); const e = pk > 0.55 ? E_AMB : E_PINK; M.er += e[0] * k * 0.22; M.eg += e[1] * k * 0.22; M.eb += e[2] * k * 0.22; }
    if (lip > 0.1) { M.ao *= 0.85; M.r *= 1.1; }
    return h; }
  /* ---- the walls' faces (x across, y down 0..h; mode as above) ---- */
  // the Torn Hull's walls: courses of hull plating, riveted along their seams, scorched, a few seams lit violet
  function hullBank(Hb, L) { return (x, y, mode) => { const K = GK, M = K.M, ci = Math.floor(y / 0.18), fy = y - ci * 0.18, xx = x + (ci % 2) * 0.45, si = Math.floor(xx / 0.9), fx = xx - si * 0.9, dj = Math.min(fx, 0.9 - fx, fy, 0.18 - fy), j = ss(0.012, 0.003, dj);
    const rv = Math.abs(fy - 0.035) < 0.012 && Math.abs(md(fx, 0.15) - 0.075) < 0.014, lipK = ss(0.05, 0.015, y), h = 0.018 * ss(0, 0.015, dj) + (rv ? 0.008 : 0) + 0.03 * lipK;
    if (!mode) return h;
    const sid = md(si, 5) + ci * 5; hullT(K, x + sid * 0.7, y * 3 + ci, 701 + md(sid, 7), { burn: 0.6 * ss(0.5, 0.8, wn(x, y, 1, 703)) + 0.2, paint: L === 'cool' ? 0.6 : 0.2, pc: L === 'cool' ? [0.06, 0.12, 0.14] : L === 'heart' ? [0.12, 0.05, 0.1] : null, tone: L === 'cool' ? 1.1 : 0.95 });
    if (j > 0.3) { M.ao *= 0.45; const lit2 = hh(si, ci, 705) < (L === 'cool' ? 0.18 : 0.12) ? 1 : 0; if (lit2) { const e = L === 'cool' ? E_TEAL : L === 'heart' ? E_AMB : E_VIO; M.er += e[0] * 0.5 * j; M.eg += e[1] * 0.5 * j; M.eb += e[2] * 0.5 * j; } }
    if (rv) M.rg = 0.2; M.ao *= 0.72 + 0.28 * ss(Hb, 0, y); return h; }; }
  // the Engine Heart's walls: flesh hanging in folds over ribs of bone
  function fleshBank(Hb) { return (x, y, mode) => { const K = GK, M = K.M, fold = Math.pow(Math.abs(Math.sin(x * Math.PI * 2.5 + wn(x, y, 1, 721) * 2)), 0.6), rib = ss(0.05, 0.02, Math.abs(md(x, 1) - 0.5)), h = 0.03 * fold + 0.03 * rib + 0.02 * ss(0.05, 0.01, y);
    if (!mode) return h;
    if (rib > 0.4) { boneM(K, x * 3, y * 3, 723, 0); M.ao *= 0.8; return h; }
    fleshT(K, x, y * 2, 725, { wet: 0.6 }); M.ao *= 0.55 + 0.45 * fold; M.ao *= 0.75 + 0.25 * ss(Hb, 0, y); return h; }; }
  // the wall tops: hull plates seen from above, riveted, scorched; the vaults' a steel grating; the heart's grown over with flesh
  function capRoof(L) { return (x, y, mode) => { const K = GK, M = K.M;
    if (L === 'heart') { const n = pfbm(x * 0.75, y * 0.75, 3, 801), cc = pcell(x * 1.5, y * 1.5, 6, 803), vein = ss(0.05, 0.01, cc.d2 - cc.d), h = 0.03 * n + 0.015 * vein; if (!mode) return h; fleshT(K, x, y, 805, { wet: 0.6 }); if (vein > 0.1) { M.er += 0.15 * vein; M.eg += 0.05 * vein; M.eb += 0.1 * vein; } return h; }
    const pi = Math.floor(x / 1), pj = Math.floor(y / 1), fx = x - pi, fy = y - pj, dj = Math.min(fx, 1 - fx, fy, 1 - fy), rv = Math.abs(dj - 0.07) < 0.02 && Math.abs(md(Math.min(fx, 1 - fx) < Math.min(fy, 1 - fy) ? fy : fx, 0.2) - 0.1) < 0.025, gr = L === 'cool' && dj > 0.12 ? ss(0.035, 0.02, Math.abs(md(fy, 0.16) - 0.08)) : 0;
    const h = 0.025 * ss(0, 0.04, dj) + (rv ? 0.01 : 0) - 0.03 * gr; if (!mode) return h;
    if (gr > 0.5) { M.r = 0.01; M.g = 0.02; M.b = 0.025; M.ao = 0.5; M.eg += 0.12; M.eb += 0.11; return h; }
    hullT(K, x + md(pi, 4) * 1.7, y, 807 + md(pi, 4) + md(pj, 4) * 4, { burn: L === 'wreck' ? 0.5 * ss(0.5, 0.75, pvn(x * 1.5, y * 1.5, 6, 809)) : 0, tone: L === 'cool' ? 1.1 : 1, paint: L === 'cool' ? 0.4 : 0 }); if (dj < 0.015) M.ao *= 0.45; if (rv) M.rg = 0.2; return h; }; }
  // the face over the drop: the Torn Hull's torn strata of plating and girder ends over the void (violet light from below); the
  // vaults' steel bulkhead streaked wet, a teal light strip; the heart's flesh hanging in strands; all fading into the depth
  function dropCliff(L) { return (x, y, mode) => { const K = GK, M = K.M, st = pvn(x * 0.5, y * 3.2 + pvn(x * 1.25, y, 5, 903) * 1.2, 2, 901), lip = ss(0.07, 0.02, y);
    if (L === 'heart') { const strand = Math.pow(Math.abs(Math.sin(x * Math.PI * 3 + pvn(x * 2, y * 0.8, 8, 905) * 2.5)), 4), len = 0.6 + 0.6 * pvn(x * 4, 0.5, WN * 4, 907), h = 0.04 * strand + 0.05 * lip; if (!mode) return h;
      FA = ss(len + 0.2, len - 0.1, y + 0.2 * (1 - strand)); fleshT(K, x, y * 2, 909, { wet: 0.6 }); M.ao *= (0.5 + 0.5 * strand) * (1 - 0.5 * ss(0.2, 1.1, y)); if (strand > 0.6) { M.er += 0.12 * strand * ss(0.3, 1, y); M.eb += 0.08 * strand; } return h; }
    if (L === 'cool') { const ci = Math.floor(y / 0.3), rib = ss(0.04, 0.015, Math.abs(md(x, 0.5) - 0.25)), streak = ss(0.6, 0.8, pvn(x * 6, y * 0.6, 24, 911)), strip = ss(0.03, 0.01, Math.abs(y - 0.55)), h = 0.03 * rib + 0.02 * lip + 0.01 * ss(0.01, 0.003, Math.abs(md(y, 0.3) - 0.15) - 0.14); if (!mode) return h;
      FA = ss(1.25, 0.95, y); hullT(K, x * 2, y * 2 + ci, 913, { tone: 1.05, paint: 0.6, pc: [0.06, 0.12, 0.14] }); M.ao *= 0.8 + 0.2 * rib; if (streak > 0) { M.cc = 0.8 * streak; M.rg = lerp(M.rg, 0.1, streak); } if (strip > 0.1) glowAdd(M, E_TEAL, 0.9 * strip);
      M.ao *= 1 - 0.55 * ss(0.3, 1.2, y); M.eg += 0.06 * ss(0.6, 1.2, y); M.eb += 0.06 * ss(0.6, 1.2, y); return h; }
    const torn = pvn(x * 3, 0.5, WN * 3, 915), layer = Math.floor(y / 0.16), fy = md(y, 0.16), gird = ss(0.06, 0.03, Math.abs(md(x, 1.33) - 0.66)) * ss(0.9, 0.7, y), end = 0.55 + 0.6 * torn, h = 0.03 * st + 0.03 * ss(0.02, 0.005, Math.abs(fy - 0.08) - 0.07) + 0.05 * lip + 0.04 * gird; if (!mode) return h;
    FA = Math.max(ss(end + 0.15, end - 0.05, y), gird > 0.3 ? ss(1.2, 0.9, y) : 0);
    if (gird > 0.3) { darkM(K, x, y * 4, 917); M.ao *= 0.8; } else { hullT(K, x * 1.5 + layer * 0.7, y * 2, 919 + md(layer, 5), { burn: 0.4 + 0.4 * ss(0.3, 0.8, y), tone: 0.9 - layer * 0.03 }); if (Math.abs(fy - 0.08) > 0.07) M.ao *= 0.5; }
    M.ao *= 1 - 0.5 * ss(0.3, 1.2, y); const vg = ss(0.35, 1.0, y); M.er += 0.3 * vg * E_VIO[0] * 0.4; M.eg += 0.3 * vg * E_VIO[1] * 0.4; M.eb += 0.3 * vg * E_VIO[2] * 0.4; return h; }; }
  // the bridges: a steel catwalk grating: two side stringers, cross bars, the dark gaps between them showing the glow below
  function catwalk(L) { return (x, y, mode) => { const K = GK, M = K.M, bar = ss(0.062, 0.076, Math.abs(md(x, 0.2) - 0.1)), cross = ss(0.205, 0.222, Math.abs(md(y, 0.5) - 0.25)), solid = Math.max(bar, cross), h = 0.03 * solid;
    if (!mode) return h;
    if (solid < 0.5) { const e = L === 'cool' ? E_TEAL : L === 'heart' ? E_PINK : E_VIO; M.r = 0.01; M.g = 0.01; M.b = 0.015; M.ao = 0.4; glowAdd(M, e, 0.12); return h; }
    hullT(K, x * 2, y * 2, 951, { tone: 1.1, paint: L === 'cool' ? 0.5 : 0.2, pc: [0.06, 0.12, 0.14] }); if (cross > 0.5) M.ao *= 0.85; return h; }; }
  // the catwalk's underside: an I-beam girder and its truss diagonals over the drop
  function girderUnder(L) { return (x, y, mode) => { const K = GK, M = K.M, flange = y < 0.12, web = y >= 0.12 && y < 0.5, diag = ss(0.04, 0.02, Math.abs(md(x + y * 1.0, 1) - 0.5) - 0.44) * (y > 0.12 && y < 0.75 ? 1 : 0), lower = Math.abs(y - 0.72) < 0.04;
    if (flange) { if (!mode) return 0.02; FA = 1; darkM(K, x * 3, y * 6, 961); M.ao = 0.85; return 0.02; }
    if (!(diag > 0.4 || lower || (web && Math.abs(md(x, 1) - 0.5) > 0.47))) { FA = 0; return 0; }
    if (!mode) return 0.02; FA = (1 - ss(0.6, 0.95, y)) * 0.95 + (lower ? 0.05 : 0); darkM(K, x * 3, y * 3, 963); M.ao = 0.6 * (1 - 0.4 * ss(0.3, 0.9, y)); return 0.02; }; }
  const TDEF = {};
  for (const L of ['wreck', 'cool', 'heart']) {
    TDEF['floor:' + L] = { w: FN, h: FN, L, fn: () => (L === 'wreck' ? wreckFloor : L === 'cool' ? coolFloor : heartFloor), o: { wrap: true, wrapY: true, bump: 2.3 } };
    TDEF['bank:' + L] = { w: WN, h: 0.55, L, fn: () => (L === 'heart' ? fleshBank(0.55) : hullBank(0.55, L)), o: { wrap: true, face: true, bump: 2.2 } };
    TDEF['roof:' + L] = { w: WN, h: WN, L, fn: () => capRoof(L), o: { wrap: true, wrapY: true, bump: 1.4 } };
    TDEF['cliff:' + L] = { w: WN, h: 1.25, L, fn: () => dropCliff(L), o: { wrap: true, face: true, bump: 2.4 } };
    TDEF['bridge:' + L] = { w: 2, h: 1, L, fn: () => catwalk(L), o: { wrap: true, bump: 1.4 } };
    TDEF['bunder:' + L] = { w: 2, h: 1.1, L, fn: () => girderUnder(L), o: { wrap: true, face: true } }; }
  function texJobs(name, P) { const B = BP(), D = TDEF[name]; if (!B || !D) return []; P = Math.max(8, Math.min(TCAP, Math.round(P))); const key = name + '|' + P; if (TEX.has(key)) return [];
    const K = B.kit; let F = null, t0 = 0; const run = f => () => { if (TEX.has(key)) return; try { GK = K; DOM = D.w; lit(K, D.L, f); } catch (e) { F = null; } GK = null; }, jobs = [];
    jobs.push(run(() => { t0 = now(); F = fieldBegin(K, D.w, D.h, P, D.fn(), D.o); }));
    const H = Math.ceil(D.h * P), n = Math.max(1, Math.ceil(D.w * P * H / 24000)), band2 = Math.ceil(H / n);
    for (let i = 0; i < n; i++) jobs.push(run(() => { if (F) F.heights(i * band2, (i + 1) * band2); }));
    for (let i = 0; i < n; i++) jobs.push(run(() => { if (F) F.shade(i * band2, (i + 1) * band2); }));
    jobs.push(run(() => { if (!F) return; const cv = F.finish(); F = null; if (!texOK(name, cv)) return; TEX.set(key, { cv, P }); STATS.tex++; STATS.texMs += now() - t0; }));
    return jobs; }
  function tex(name, P) { const B = BP(), D = TDEF[name]; if (!B || !D) return null; P = Math.max(8, Math.min(TCAP, Math.round(P))); const key = name + '|' + P; let t = TEX.get(key); if (t) return t;
    if (TBASE) { const t2 = TEX.get(name + '|' + TBASE); if (t2) return t2; }
    const t0 = now(), K = B.kit; let cv = null; try { GK = K; DOM = D.w; lit(K, D.L, () => { const F = fieldBegin(K, D.w, D.h, P, D.fn(), D.o); F.heights(0, F.Hh); F.shade(0, F.Hh); cv = F.finish(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('YUG_PROPS tex', name, e); cv = null; } GK = null;
    if (!cv || !texOK(name, cv)) return null; t = { cv, P }; TEX.set(key, t); STATS.tex++; STATS.texMs += now() - t0; return t; }
  const EMPTY = {};
  const texOK = (name, cv) => { if (!/^(floor|roof|bank)/.test(name)) return true; try { const d = cv.getContext('2d', { willReadFrequently: true }).getImageData(cv.width >> 1, cv.height >> 1, 1, 1).data; if (d[3] > 0) return true; } catch (e) { return true; } STATS.empty++; EMPTY[name] = (EMPTY[name] || 0) + 1; return EMPTY[name] > 2; };

  /* ======================= the lands: each biome's own floor, walls, wall tops, cliffs, bridges ======================= */
  const LN_OF = BIO_L;
  // world-space washes (continuous across tiles): soft pools of the land's light laid over the floor
  const WASH = { wreckfield: [['8,4,18', 0.08, 0.3], ['196,82,255', 0.025, 0.38]], coolant: [['4,16,20', 0.07, 0.25], ['63,224,200', 0.04, 0.42]], engineheart: [['14,4,12', 0.08, 0.28], ['255,111,176', 0.035, 0.4], ['255,178,63', 0.025, 0.48]] };
  const EDGE = { wreckfield: '8,4,16', coolant: '3,12,16', engineheart: '14,4,12' };
  function washes(c, X, Y, T, x, y, list) { const G = 3.4;
    for (let gy = Math.floor((y - 3) / G); gy <= Math.floor((y + 4) / G); gy++) for (let gx = Math.floor((x - 3) / G); gx <= Math.floor((x + 4) / G); gx++) { const kind = hh(gx, gy, 141); let col = null, a = 0;
      for (const [cc, aa, upto] of list) if (kind < upto) { col = cc; a = aa * (0.7 + 0.6 * hh(gx, gy, 143)); break; } if (!col) continue;
      const cx = (gx + hh(gx, gy, 153)) * G, cy = (gy + hh(gx, gy, 159)) * G, rr = 1 + hh(gx, gy, 161) * 1.9; if (cx + rr < x || cx - rr > x + 1 || cy + rr * 0.8 < y || cy - rr * 0.8 > y + 1) continue;
      const px = X + (cx - x) * T, py = Y + (cy - y) * T; c.save(); c.translate(px, py); c.scale(1, 0.75); const g = c.createRadialGradient(0, 0, 0, 0, 0, rr * T); g.addColorStop(0, `rgba(${col},${a.toFixed(3)})`); g.addColorStop(0.6, `rgba(${col},${(a * 0.5).toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rr * T, 0, TAU); c.fill(); c.restore(); } }
  const FOOT = { wreckfield: '10,6,16', coolant: '4,14,18', engineheart: '20,6,16' };
  function landFloor(bio) { const L = LN_OF[bio]; return function (c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE, isWall) { const t = tex('floor:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    c.drawImage(t.cv, md(x, FN) * P, md(y, FN) * P, P, P, X, Y, T + 0.02, T + 0.02); STATS.land++;
    washes(c, X, Y, T, x, y, WASH[bio]);
    // the wall's foot: soot and shadow banked against the wall above (soft, continuous along it)
    if (typeof isWall === 'function' && isWall(x, y - 1)) { const g = c.createLinearGradient(0, Y, 0, Y + T * 0.55); g.addColorStop(0, `rgba(${FOOT[bio]},.55)`); g.addColorStop(0.5, `rgba(${FOOT[bio]},.18)`); g.addColorStop(1, `rgba(${FOOT[bio]},0)`); c.fillStyle = g; c.fillRect(X, Y, T, T * 0.55); }
    const ec = EDGE[bio], side = (x0, y0, x1, y1, w, hh2) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(${ec},.5)`); g.addColorStop(0.5, `rgba(${ec},.14)`); g.addColorStop(1, `rgba(${ec},0)`); c.fillStyle = g; c.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, hh2); };
    if (gN) side(X, Y, X, Y + T * 0.5, T, T * 0.5); if (gS) side(X, Y + T, X, Y + T * 0.55, T, T * 0.45); if (gW) side(X, Y, X + T * 0.45, Y, T * 0.45, T); if (gE) side(X + T, Y, X + T * 0.55, Y, T * 0.45, T); c.restore(); }; }
  function landWall(bio) { const L = LN_OF[bio]; return function (c, X, Y, T, H, h, x) { const t = tex('bank:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, WN) * P, 0, P, t.cv.height, X, Y, T + 0.5, H);
    const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, `rgba(${EDGE[bio]},0)`); g.addColorStop(1, `rgba(${EDGE[bio]},.35)`); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H); }; }
  function landRoof(bio) { const L = LN_OF[bio]; return function (c, X, Y, T, x, y, isWall) { const t = tex('roof:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, WN) * P, md(y, WN) * P, P, P, X, Y, T + 0.5, T + 0.5);
    if (!isWall(x, y - 1)) { c.fillStyle = bio === 'coolant' ? 'rgba(184,255,242,.22)' : bio === 'engineheart' ? 'rgba(255,190,220,.18)' : 'rgba(232,184,255,.2)'; c.fillRect(X, Y, T + 0.5, Math.max(1, T * 0.05)); }
    if (!isWall(x - 1, y)) { c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(X, Y, Math.max(1, T * 0.05), T); } if (!isWall(x + 1, y)) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(X + T * 0.94, Y, T * 0.06, T); } }; }
  function landCliff(bio) { const L = LN_OF[bio]; return function (c, x, y, X, Y, T, lw, B, isGap) { const t = tex('cliff:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    const rr = B && B.out ? T * 0.38 : 0, l = isGap && isGap(x - 1, y) ? rr : 0, r = isGap && isGap(x + 1, y) ? rr : 0, sx = md(x, WN) * P, k = P / T;
    c.save(); if (l || r) { c.beginPath(); c.moveTo(X + l, Y - 1); c.lineTo(X + T - r, Y - 1); c.lineTo(X + T - r * 0.6, Y + T * 1.3); c.lineTo(X + l * 0.6, Y + T * 1.3); c.closePath(); c.clip(); }
    c.drawImage(t.cv, sx, 0, P, t.cv.height, X, Y - T * 0.02, T, t.cv.height / k); c.restore(); }; }
  function landBridge(bio) { const L = LN_OF[bio]; return function (c, x, y, X, Y, T, isGap, tt) { const t = tex('bridge:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y), TB = typeof T_BRIDGE !== 'undefined' ? T_BRIDGE : -1;
    const run = (dx, dy) => { let n = 0; for (const s of [-1, 1]) for (let k = 1; k <= 6 && tt(x + dx * k * s, y + dy * k * s) === TB; k++) n++; return n; };
    const horiz = gNS && !gWE ? true : gWE && !gNS ? false : run(1, 0) >= run(0, 1);
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0); c.drawImage(t.cv, md(horiz ? x : y, 2) * P, 0, P, P, 0, 0, T + 0.02, T + 0.02);
    // the catwalk's side rails along its open sides only (continuous along it)
    const rail = (open, y0, y1) => { if (!open) return; const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(150,160,184,.85)'); g.addColorStop(0.3, 'rgba(40,46,62,.9)'); g.addColorStop(1, 'rgba(20,22,30,0)'); c.fillStyle = g; c.fillRect(0, Math.min(y0, y1), T + 0.02, Math.abs(y1 - y0)); };
    if (horiz) { rail(isGap(x, y - 1), 0, T * 0.14); rail(isGap(x, y + 1), T, T * 0.86); } else { rail(isGap(x - 1, y), 0, T * 0.14); rail(isGap(x + 1, y), T, T * 0.86); }
    c.restore(); }; }
  function landBridgeEdge(bio) { const L = LN_OF[bio]; return function (c, x, y, X, Y, T) { const t = tex('bunder:' + L, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, 2) * P, 0, P, t.cv.height, X, Y - T * 0.02, T + 0.02, t.cv.height * T / P); }; }

  /* ======================= the props in their lands: installed ======================= */
  const OLD = {};
  const LANDS_P = { wreckfield: { props: ['metalspike', 'hullshard', 'pylon', 'neonpost', 'metalspike', 'wreckrib', 'fungusstalk', 'pylon', 'hullshard', 'neonpost'], propN: [6, 4], edge: ['hullshard', 'metalspike', 'wreckrib', 'fungusstalk', 'hullshard'], rim: 0.15 },
    coolant: { props: ['coolanttank', 'pipestack', 'neonpost', 'coolanttank', 'valve', 'pylon', 'pipestack', 'metalspike'], propN: [6, 3], edge: ['pipestack', 'coolanttank', 'valve', 'pipestack'], rim: 0.14 },
    engineheart: { props: ['piston', 'biotube', 'xenospire', 'nervecable', 'vertebra', 'piston', 'biotube', 'metalspike', 'nervecable', 'xenospire'], propN: [6, 3], edge: ['vertebra', 'nervecable', 'piston', 'xenospire'], rim: 0.14 } };
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
  const FLOORC = { wreckfield: ['#22202C', '#1E1C28', '#26232F'], coolant: ['#3A4C58', '#364854', '#3E505C'], engineheart: ['#3A1A34', '#36182F', '#3E1C38'] };
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS, EXT = (HAS_W && (window.PROP_EXT = window.PROP_EXT || {})) || {};
    for (const k of KINDS) { if (PR[k] && PR[k].__yugp) continue; const old = OLD[k] = PR[k] || function () {};
      const f = function (c, P, v, B) { const bio = bioOf(B); if (!bio || off()) return old.apply(this, arguments); const L = BIO_L[bio], vv = (v | 0) % 4, s = sprite(k, vv % 2, Math.max(8, Math.min(CAP, Math.round(P))), true, L); if (!s) return old.apply(this, arguments);
        const q = P / s.P; c.save(); if (vv >= 2) c.scale(-1, 1); c.drawImage(s.cv, -s.ax * q, -s.ay * q, s.cv.width * q, s.cv.height * q); c.restore(); };
      f.__yugp = 1; PR[k] = f;
      let b = [0, 0, 0, 0]; for (let v = 0; v < 2; v++) { const q = DEF[k].box(v); b = [Math.min(b[0], q[0]), Math.min(b[1], q[1]), Math.max(b[2], q[2]), Math.max(b[3], q[3])]; }
      const E = EXT[k] || [2.4, 2.9]; EXT[k] = [Math.max(E[0], Math.max(-b[0], b[2]) * 2 - 1.6 + 0.1), Math.max(E[1], -b[1] - 0.25 + 0.1)]; }
    if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) for (const k of KINDS) BREAK_FX.KIND[k] = Object.assign({}, BREAK_FX.KIND[k] || {}, DEF[k].mat);
    if (typeof PROP_EL !== 'undefined') for (const k of KINDS) PROP_EL[k] = DEF[k].el;
    for (const bio of ['wreckfield', 'coolant', 'engineheart']) { const B = typeof BIOMES !== 'undefined' && BIOMES[bio]; if (!B || B.__yugp) continue; B.__yugp = 1;
      const fns = { floorFn: landFloor(bio), wallFn: landWall(bio), roofFn: landRoof(bio), cliffTint: landCliff(bio), bridgeFn: landBridge(bio), bridgeEdge: landBridgeEdge(bio), floorUnder: true };
      { const Ld = Object.assign({ dress: dressFn(LANDS_P[bio].edge, LANDS_P[bio].rim) }, LANDS_P[bio]), old = { props: B.props, propN: B.propN, dress: B.dress }; for (const n of ['props', 'propN', 'dress']) Object.defineProperty(B, n, { configurable: true, enumerable: true, get: () => (BP() ? Ld[n] : old[n]), set: v2 => { old[n] = v2; } }); }
      { let oldF = B.floor; const F2 = FLOORC[bio]; Object.defineProperty(B, 'floor', { configurable: true, enumerable: true, get: () => (BP() ? F2 : oldF), set: v2 => { oldF = v2; } }); }
      for (const n in fns) { OLD[bio + ':' + n] = B[n]; Object.defineProperty(B, n, { configurable: true, enumerable: true, get: () => (BP() ? fns[n] : OLD[bio + ':' + n]), set: v2 => { OLD[bio + ':' + n] = v2; } }); } } }
  install();

  /* ======================= release, warm-up ======================= */
  function release(keepTex) { CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); if (!keepTex) { BURSTS.length = 0; BOLTS.length = 0; TEX.forEach(t => { if (t && t.cv) t.cv.width = t.cv.height = 1; }); TEX.clear(); BASE = 0; TBASE = 0; } }
  function hookRelease() { try { if (typeof DunWorld === 'undefined' || !DunWorld.dropProps || DunWorld.dropProps.__yugp) return; const od = DunWorld.dropProps; const f = function () { try { return od.apply(this, arguments); } finally { release(); LIVE = null; } }; for (const k in od) f[k] = od[k]; f.__yugp = 1; DunWorld.dropProps = f; } catch (e) {} }
  hookRelease();
  const PIECES_OF = [];   // [stage name pattern, [[name, v], ...]] (20u6d2 adds the trials' pieces)
  function warm(P) { if (!BP() || !P || !(P.T > 0)) return []; const S2 = P.S || {}, F = P.F || {}; if (!LN_OF[F.biome]) return [];
    const k = P.k || 1, PB = Math.min(CAP, Math.round(P.T * k)), PT = Math.min(TCAP, Math.round(P.T * k)); BASE = PB; TBASE = PT; const L = LN_OF[F.biome], jobs = [], job = f => jobs.push(() => { try { f(); } catch (e) {} });
    if (S2.kind === 'boss' || F.fiend) { for (const j of texJobs('floor:' + L, Math.min(72, PT))) jobs.push(j); const n = S2.name || ''; for (const [re, list] of PIECES_OF) if (re.test(n) || re.test(F.fiend && F.fiend.id || '')) for (const [nm, v] of list) job(() => sprite(nm, v, PB, true, L)); return jobs; }
    for (const n of ['floor', 'bank', 'roof', 'cliff', 'bridge', 'bunder']) for (const j of texJobs(n + ':' + L, PT)) jobs.push(j);
    const B = typeof BIOMES !== 'undefined' && BIOMES[F.biome]; if (B && B.props) for (const kd of new Set(B.props)) if (DEF[kd]) for (let v = 0; v < 2; v++) job(() => sprite(kd, v, PB, true, L));
    if (L === 'cool') job(() => sprite('yugvent', 0, PB, true, L));
    const n = S2.name || ''; for (const [re, list] of PIECES_OF) if (re.test(n)) for (const [nm, v] of list) job(() => sprite(nm, v, PB, true, L));
    return jobs; }

  /* ======================= breaking them =======================
     The engine breaks them (20l): the tile turns to floor (the land's own floor painted under props too: floorUnder) and BREAK_FX
     shatters the picture in its material. Here: the hit points (the big ones take more), each kind's debris (steel shards, sparks,
     glass and coolant, flesh, spores) and a feathered GPU burst; lowFx: fewer pieces, no ring. Every burst ends within 1.6 s. */
  const DEBRIS = { metalspike: { col: VIOLET_HI, dust: '#5A6278', n: [['shard', '#8A93A8', 12], ['spark', '#FFFFFF', 10], ['smoke', 'rgba(60,56,80,', 5]] },
    hullshard: { col: VIOLET_HI, dust: '#4A5268', n: [['shard', '#5A6278', 14], ['spark', VIOLET_HI, 8], ['smoke', 'rgba(50,46,64,', 6]] },
    neonpost: { col: TEAL_HI, dust: '#2A2F3E', n: [['shard', '#B8FFF2', 10], ['spark', '#FFFFFF', 12], ['smoke', 'rgba(40,44,56,', 3]] },
    wreckrib: { col: '#FFD0E8', dust: '#3A3446', n: [['shard', '#4A5268', 14], ['spore', FUNGUS, 10], ['smoke', 'rgba(58,52,70,', 6]] },
    pylon: { col: VIOLET_HI, dust: '#2A2F3E', n: [['shard', '#B87333', 8], ['spark', VIOLET_HI, 16], ['smoke', 'rgba(40,40,54,', 4]] },
    fungusstalk: { col: FUNGUS, dust: '#8E4A78', n: [['spore', FUNGUS, 14], ['spore', TEAL_HI, 8], ['smoke', 'rgba(232,138,192,', 4]] },
    coolanttank: { col: TEAL_HI, dust: '#1E6A64', n: [['shard', '#B8FFF2', 14], ['spore', TEAL, 12], ['smoke', 'rgba(200,255,246,', 7]] },
    pipestack: { col: TEAL_HI, dust: '#2A3A48', n: [['shard', '#4A5E70', 12], ['spore', TEAL, 8], ['smoke', 'rgba(220,245,240,', 8]] },
    valve: { col: TEAL_HI, dust: '#2A3A48', n: [['shard', '#4A5E70', 8], ['smoke', 'rgba(220,245,240,', 6]] },
    piston: { col: '#FFE2A0', dust: '#3E1A38', n: [['shard', '#AEB6CC', 8], ['shard', '#7A3A6E', 8], ['spark', AMBER, 8], ['smoke', 'rgba(70,30,60,', 4]] },
    nervecable: { col: '#FFE2A0', dust: '#3E1A38', n: [['shard', '#7A3A6E', 12], ['spore', AMBER, 10], ['smoke', 'rgba(70,30,60,', 3]] },
    biotube: { col: VIOLET_HI, dust: '#14141C', n: [['shard', '#1E1E28', 16], ['spore', VIOLET_HI, 6], ['smoke', 'rgba(30,26,40,', 6]] },
    xenospire: { col: VIOLET_HI, dust: '#14141C', n: [['shard', '#1E1E28', 16], ['spore', PINK, 6], ['smoke', 'rgba(30,26,40,', 5]] },
    vertebra: { col: '#FFB2DC', dust: '#14141C', n: [['shard', '#1E1E28', 14], ['shard', '#7A3A6E', 6], ['smoke', 'rgba(40,20,36,', 5]] } };
  const HPK = {}; for (const k of KINDS) HPK[k] = DEF[k].hp;
  const BURSTS = [], BOLTS = [];
  function yugBreak(X, p) { const D = DEBRIS[p.kind]; if (!D || !X || !X.part) return; STATS.breaks++; const lf = lowFx(), k = lf ? 0.5 : 1, R = Math.random, h = Math.max(0.6, -(DEF[p.kind].box(0)[1]) * 0.45);
    for (const [kind, col, n] of D.n) for (let i = 0; i < Math.round(n * k); i++) { const a = R() * TAU, v = 1.5 + R() * 3.5, x = p.x + (R() - 0.5) * 0.8, y = p.y - 0.2 - R() * h;
      if (kind === 'smoke') X.part({ kind: 'smoke', x, y: p.y - 0.3, vx: (R() - 0.5) * 0.8, vy: -0.4 - R() * 0.4, life: 1.1, max: 1.1, size: 0.5 + R() * 0.35, color: col });
      else if (kind === 'spore') X.part({ kind: 'glow', x, y, vx: Math.cos(a) * v * 0.3, vy: -0.6 - R() * 0.8, drag: 1, life: 1.2, max: 1.2, size: 0.1 + R() * 0.08, color: col });
      else X.part({ kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, g: kind === 'spark' ? 3 : 9, life: 0.7 + R() * 0.4, max: 1.1, size: 3 + R() * 3, rot: R() * 6, vr: (R() - 0.5) * 12, color: col }); }
    if (BURSTS.length < 24) BURSTS.push({ x: p.x, y: p.y, h, col: D.col, dust: D.dust, t: 0, life: 1.6, X });
    // the tall conductors go out with a crack of current into the ground
    if ((p.kind === 'pylon' || p.kind === 'metalspike' || p.kind === 'neonpost') && !lf) for (let i = 0; i < 2; i++) { const a = R() * TAU; queueBolt(X, p.x, p.y, h * 1.6, p.x + Math.cos(a) * 1.8, p.y + Math.sin(a) * 1.2, 0, 0.3, VIOLET, 0.5); } }
  function burstsTick(dt) { for (let i = BURSTS.length - 1; i >= 0; i--) { BURSTS[i].t += dt; if (BURSTS[i].t >= BURSTS[i].life) BURSTS.splice(i, 1); } for (let i = BOLTS.length - 1; i >= 0; i--) { BOLTS[i].t += dt; if (BOLTS[i].t >= BOLTS[i].life) BOLTS.splice(i, 1); } }
  function burstsDraw(Q, X) { const T = X.Tz(), lf = lowFx();
    for (const b of BURSTS) { if (b.X !== X) continue; const u = b.t / b.life, Xs = X.sx(b.x), Ys = X.sy(b.y), f = Math.pow(1 - u, 1.6);
      Q.glow(Xs, Ys - T * b.h * 0.6, T * (1.1 + b.h * 0.8) * (0.6 + u * 0.8), b.col, 0.34 * f); Q.glow(Xs, Ys, T * (1.6 + u * 1.7), b.dust, 0.2 * f, 0.4);
      if (!lf) Q.ring(Xs, Ys, T * (0.5 + u * 2.2), b.col, 0.24 * f, T * 0.35 * (1 - u * 0.5), 0.45); } }
  function hookBreak() { try { if (typeof BREAK_FX === 'undefined' || !BREAK_FX.prop || BREAK_FX.prop.__yugp) return; const op = BREAK_FX.prop; const f = function (Xa, p) { const r = op.apply(this, arguments); try { if (p && DEBRIS[p.kind] && BIO_L[p.biome] && !off()) yugBreak(Xa, p); } catch (e) {} return r; }; for (const k in op) f[k] = op[k]; f.__yugp = 1; BREAK_FX.prop = f; } catch (e) {} }
  hookBreak();
  const toughen = props => { for (const p of props || []) if (HPK[p.kind] && BIO_L[p.biome] && !p.yugHp && !p.broken) { p.yugHp = 1; p.hp = Math.max(p.hp || 0, HPK[p.kind]); } };

  /* ======================= lightning (the GPU): the cells' chains, the ambient arcs, the pylons' crackle =======================
     a bolt is a world segment (each end its height in tiles over the floor), laid as YE-FX 571 over the actors with a glow at each end */
  function queueBolt(X, ax, ay, ah, bx, by, bh, life, col, w) { if (BOLTS.length >= 48) BOLTS.shift(); BOLTS.push({ X, ax, ay, ah: ah || 0, bx, by, bh: bh || 0, t: 0, life: life || 0.3, col: col || VIOLET, w: w || 0.7, sd: Math.random() * 97 }); STATS.bolts++; }
  function boltQ(Q, X, b, T) { const ax = X.sx(b.ax), ay = X.sy(b.ay) - b.ah * T, bx = X.sx(b.bx), by = X.sy(b.by) - b.bh * T, dx = (bx - ax) / 2, dy = (by - ay) / 2, L = Math.hypot(dx, dy); if (L < 2) return; const u = b.t / b.life, wv = T * b.w * Math.min(1, 0.35 + L / (T * 4));
    Q.quad(571, ax + dx, ay + dy, dx * 1.04, dy * 1.04, -dy / L * wv, dx / L * wv, b.col, 0.95, b.sd, u, Math.min(1, 0.4 + L / (T * 8))); const f = 1 - u; Q.glow(bx, by, T * 0.7, b.col, 0.5 * f); Q.glow(bx, by, T * 0.22, '#FFFFFF', 0.6 * f); Q.glow(ax, ay, T * 0.45, b.col, 0.35 * f); }
  // the ambient arcs (20u6 ambientArcs' list: drawn here instead of its 2D strokes when the painter is live)
  function arcs(c, X, list) { if (!ready(X) || !list) return false; STATS.arcs++; for (const a of list) { if (a.__yug) continue; a.__yug = 1; BOLTS.push({ X, ax: a.ax, ay: a.ay, ah: a.ah, bx: a.bx, by: a.by, bh: a.bh, t: 0, life: a.max || 0.2, col: a.sky ? '#B88AFF' : VIOLET, w: a.sky ? 0.9 : 0.6, sd: a.seed || Math.random() * 97 }); } return true; }
  // the charge cells' chain (20u6 bolt(X, ax, ay, bx, by): world points already lifted): a GPU bolt and two sparks
  function bolt(X, ax, ay, bx, by) { if (!ready(X)) return false; queueBolt(X, ax, ay, 0, bx, by, 0, 0.32, VIOLET, 0.75); if (X.part) for (let i = 0; i < 2; i++) X.part({ kind: 'spark', x: bx + (Math.random() - 0.5) * 0.4, y: by, vx: (Math.random() - 0.5) * 3, vy: -2, g: 6, life: 0.35, max: 0.35, size: 2.5, color: '#FFFFFF' }); return true; }
  // a cell's discharge: a flash of current at its foot, bolts into the ground round it (20u6 discharge adds this to its boom)
  function burst(X, x, y) { if (!ready(X)) return false; if (BURSTS.length < 24) BURSTS.push({ x, y, h: 1.0, col: VIOLET_HI, dust: VIOLET, t: 0, life: 1.0, X }); if (!lowFx()) for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.random() * 0.8; queueBolt(X, x, y, 0.9, x + Math.cos(a) * 2.2, y + Math.sin(a) * 1.5, 0, 0.28, VIOLET, 0.6); } return true; }

  /* ======================= the light (GPU): props' glows, the trials' queued light, motes ======================= */
  // where each prop's live lights are (tiles from its feet; v 0..1, mirrored for 2..3): [dx, dy, r, colour, kind]
  function glowsOf(kind, v, L) { const vv = (v | 0) % 2, m = (v | 0) % 4 >= 2 ? -1 : 1, out = [], nc = NEONC[L] || NEONC.wreck;
    if (kind === 'metalspike') { const tips = DEF.metalspike.tips[vv + '|' + L] || []; for (const [x, y] of tips) out.push([x * m, y, 0.12, nc[vv], 'tip']); out.push([0, -1.6, 1.2, nc[vv], 'crys']); }
    else if (kind === 'neonpost') { const H = 3.4 + vv * 0.4; out.push([0, -0.32 - H * 0.5, H * 0.5, nc[vv], 'tube']); }
    else if (kind === 'pylon') { const H = 3.1 + vv * 0.3; out.push([0, -0.6 - H, 0.24, L === 'heart' ? AMBER : L === 'cool' ? TEAL : VIOLET, 'cap']); }
    else if (kind === 'hullshard') out.push([0.25 * (vv ? -1 : 1) * m, -1.2, 0.5, VIOLET, 'seam']);
    else if (kind === 'coolanttank') { const H = 2.0 + vv * 0.4; out.push([0, -0.36 - H * 0.5, 0.8, L === 'heart' ? PINK : TEAL, 'tank']); }
    else if (kind === 'pipestack') out.push([0.7 * (vv ? -1 : 1) * m, 0.2, 0.6, TEAL, 'pool']);
    else if (kind === 'piston') out.push([0, -1.5, 0.22, AMBER, 'eye']);
    else if (kind === 'nervecable') { for (let i = 0; i < 6; i++) { const u = (2 + i * 3) / 20, a = Math.PI * (1 - u); out.push([Math.cos(a) * 1.15 * (vv ? -1 : 1) * m, -Math.sin(a) * 1.85 - 0.04, 0.1, AMBER, 'node' + i]); } }
    else if (kind === 'fungusstalk') out.push([0, -1.0, 0.8, FUNGUS, 'crys']);
    else if (kind === 'xenospire') { const tp = DEF.xenospire.tips[vv + '|' + L] || [[0, -5]]; out.push([tp[0][0] * m, tp[0][1], 0.1, PINK, 'tip']); }
    else if (kind === 'vertebra') out.push([0, -0.5 - (5 + vv - 1) * 0.6, 0.5, PINK, 'seam']);
    else if (kind === 'biotube') { out.push([-(1.9 + vv * 0.3) * (vv ? -1 : 1) * m, 0, 0.6, VIOLET, 'seam'], [(1.9 + vv * 0.3) * (vv ? -1 : 1) * m, 0, 0.6, VIOLET, 'seam']); }
    return out; }
  const gpu = c => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__YUGP_GL === 0)) return null; const NM = HAS_W ? window.NIDHOGG_MOVES : null, F = NM && NM.FGFX; if (!F || !F.usable()) return null; return { F, Q: F.begin(c, null) }; } catch (e) { return null; } };
  const gpuEnd = (c, G) => { if (G) try { G.F.flush(c); } catch (e) {} };
  const gpuOK = () => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__YUGP_GL === 0)) return false; const NM = HAS_W ? window.NIDHOGG_MOVES : null; return !!(NM && NM.FGFX && NM.FGFX.usable()); } catch (e) { return false; } };
  const QL = [], QO = []; let LIVE = null;
  const ql = (fn, a, b, c2, d, e, f, g2, h, i, j, k, l) => { if (QL.length < 500) QL.push([fn, a, b, c2, d, e, f, g2, h, i, j, k, l]); };
  const qo = (fn, a, b, c2, d, e, f, g2, h, i, j, k, l) => { if (QO.length < 500) QO.push([fn, a, b, c2, d, e, f, g2, h, i, j, k, l]); };
  function qFlush(Q, list) { for (const q of list) { try { Q[q[0]](q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8], q[9], q[10], q[11], q[12]); } catch (e) {} } list.length = 0; }
  const ready = X => !!(X && LIVE && LIVE.X === X && !off() && BP() && gpuOK());
  function lights(X) { const F = X.F || {}, bio = BIO_L[F.biome] ? F.biome : 'wreckfield', L = BIO_L[bio], fiend = !!F.fiend; let glows = null, t = 0, crackT = 0; const motes = [], LF = lowFx;
    const collect = () => { glows = []; for (const p of (X.props || [])) { if (!BIO_L[p.biome]) continue; for (const [dx, dy, r, col, kind] of glowsOf(p.kind, p.v | 0, L)) glows.push({ p, dx, dy, r, col, kind, ph: hh(p.k || Math.round(p.x * 7 + p.y * 13), 1, 3) * TAU }); } };
    const MCOL = { wreck: [VIOLET_HI, '#FFFFFF', '#FF9B5A'], cool: [TEAL_HI, '#FFFFFF', TEAL], heart: [AMBER, '#FFD0E8', PINK] }[L];
    const onScreen = () => { const T = X.Tz(), W = X.W(), Hh = X.H(); for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y); if (Xs > -T * 4 && Xs < W + T * 4 && Ys > -T * 3 && Ys < Hh + T * 6) return true; } return false; };
    return { X, L,
      update(dt) { t += dt; burstsTick(dt); if (!glows) { collect(); toughen(X.props); } if (QL.length > 400) QL.length = 0; if (QO.length > 400) QO.length = 0;
        const me = X.me, want = fiend ? 0 : LF() ? 4 : 12;
        if (motes.length < want && Math.random() < dt * 6) { const W = X.W() / X.Tz(), Hh = X.H() / X.Tz(); motes.push({ x: me.x + (Math.random() - 0.5) * W * 1.1, y: me.y + (Math.random() - 0.4) * Hh * 0.8, vx: (Math.random() - 0.5) * 0.3, vy: -0.25 - Math.random() * 0.35, t: 0, life: 3 + Math.random() * 4, s: 0.5 + Math.random() * 0.8, ph: Math.random() * 6, col: MCOL[Math.floor(Math.random() * MCOL.length)] }); }
        for (const e of motes) { e.t += dt; e.x += (e.vx + Math.sin(e.t * 1.3 + e.ph) * 0.15) * dt; e.y += (e.vy + Math.cos(e.t * 0.9 + e.ph) * 0.06) * dt; } for (let i = motes.length - 1; i >= 0; i--) if (motes[i].t > motes[i].life) motes.splice(i, 1);
        // the pylons' caps crackle: a short arc now and then off one on the screen
        crackT -= dt; if (crackT <= 0 && glows && !LF()) { crackT = 0.35 + Math.random() * 0.6; const caps = glows.filter(q => q.kind === 'cap' && !q.p.broken); if (caps.length) { const q = caps[Math.floor(Math.random() * caps.length)], p = q.p, T = X.Tz(), Xs = X.sx(p.x); if (Xs > -T * 4 && Xs < X.W() + T * 4) { const a = Math.random() * TAU; queueBolt(X, p.x + q.dx, p.y, -q.dy, p.x + q.dx + Math.cos(a) * 0.9, p.y + Math.sin(a) * 0.4, -q.dy - 0.2 - Math.random() * 0.6, 0.16, q.col, 0.35); } } } },
      drawGround(c) { if (!QL.length && !(glows && glows.length)) return; if (!QL.length && !onScreen()) return;
        const G = gpu(c); if (!G) { QL.length = 0; return; } const T = X.Tz(), W = X.W(), Hh = X.H(), lf = LF();
        if (glows) for (const q of glows) { const p = q.p; if (p.broken || q.kind === 'tip' || q.kind.startsWith('node')) continue; const Xs = X.sx(p.x), Ys = X.sy(p.y); if (Xs < -T * 4 || Xs > W + T * 4 || Ys < -T * 3 || Ys > Hh + T * 3) continue; if (lf && q.kind !== 'crys' && q.kind !== 'tube') continue;
          const pool = q.kind === 'pool' ? 1.6 : q.kind === 'crys' || q.kind === 'tube' ? 1.5 : q.kind === 'tank' ? 1.4 : 1.0; G.Q.glow(Xs + q.dx * T * (q.kind === 'pool' ? 1 : 0.3), Ys - T * 0.05 + (q.kind === 'pool' ? q.dy * T : 0), T * pool, q.col, 0.13 + 0.04 * Math.sin(t * 1.1 + q.ph), 0.42); }
        qFlush(G.Q, QL); gpuEnd(c, G); },
      drawOver(c) { if (!QO.length && !(glows && glows.length) && !BURSTS.length && !BOLTS.length && !motes.length) return; const G = gpu(c); if (!G) { QO.length = 0; return; } const T = X.Tz(), W = X.W(), Hh = X.H(), lf = LF();
        if (glows) for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y) + q.dy * T; if (Xs < -T * 3 || Xs > W + T * 3 || Ys < -T * 5 || Ys > Hh + T * 3) continue;
          const k = 0.75 + 0.25 * Math.sin(t * 1.6 + q.ph);
          if (q.kind === 'tip') { if (lf) continue; const tw = Math.max(0, Math.sin(t * 1.9 + q.ph * 3 + q.dx * 5)); G.Q.glow(Xs, Ys, q.r * T * 2.2, q.col, 0.25 + 0.2 * tw); if (tw > 0.85) G.Q.star(Xs, Ys, q.r * T * 2.8 * (tw - 0.6), (tw - 0.85) * 4, '#FFFFFF'); continue; }
          if (q.kind === 'crys') { G.Q.glow(Xs, Ys, q.r * T * 1.4, q.col, 0.1 * k); continue; }
          if (q.kind === 'tube') { const fl = 0.85 + 0.15 * Math.sin(t * 31 + q.ph) * Math.sin(t * 7.3); G.Q.beam(Xs, Ys - q.r * T * 0.95, Xs, Ys + q.r * T * 0.95, T * 0.55, q.col, 0.32 * fl); G.Q.beam(Xs, Ys - q.r * T * 0.92, Xs, Ys + q.r * T * 0.92, T * 0.14, '#FFFFFF', 0.35 * fl); continue; }
          if (q.kind === 'cap') { const fl = 0.7 + 0.3 * Math.abs(Math.sin(t * 13 + q.ph) * Math.sin(t * 5.1)); G.Q.glow(Xs, Ys, T * 1.1, q.col, 0.45 * fl); G.Q.glow(Xs, Ys, T * 0.3, '#FFFFFF', 0.6 * fl); continue; }
          if (q.kind === 'tank') { G.Q.glow(Xs, Ys, q.r * T * 1.6, q.col, 0.16 * k); if (!lf) for (let i = 0; i < 3; i++) { const u = (t * 0.35 + i / 3 + q.ph) % 1; G.Q.glow(Xs + Math.sin(i * 2.3 + q.ph) * T * 0.2, Ys + T * 0.9 - u * T * 1.8, T * 0.08, '#E8FFFA', 0.5 * Math.sin(u * Math.PI)); } continue; }
          if (q.kind === 'pool') { if (!lf) { const u = (t * 0.7 + q.ph) % 1; G.Q.ring(Xs, Ys, T * (0.1 + u * 0.5), TEAL_HI, 0.3 * (1 - u), T * 0.05, 0.4); } continue; }
          if (q.kind === 'eye') { const beat = Math.pow(Math.max(0, Math.sin(t * 2.6 + q.ph)), 6); G.Q.glow(Xs, Ys, T * (0.7 + 0.3 * beat), q.col, 0.4 + 0.35 * beat); G.Q.glow(Xs, Ys, T * 0.18, '#FFF2D0', 0.6); continue; }
          if (q.kind.startsWith('node')) { const i = +q.kind.slice(4), run = Math.pow(Math.max(0, Math.cos((t * 2.4 - i * 0.55 + q.ph) % TAU)), 8); G.Q.glow(Xs, Ys, T * (0.3 + 0.25 * run), q.col, 0.25 + 0.5 * run); continue; }
          if (q.kind === 'seam') { G.Q.glow(Xs, Ys, q.r * T * 1.6, q.col, 0.12 * k); continue; }
          G.Q.glow(Xs, Ys, q.r * T * 2.4, q.col, 0.4 * k); }
        qFlush(G.Q, QO); burstsDraw(G.Q, X); for (const b of BOLTS) if (b.X === X) boltQ(G.Q, X, b, T);
        for (const e of motes) { const a = Math.sin(e.t / e.life * Math.PI), Xs = X.sx(e.x), Ys = X.sy(e.y); if (Xs < -10 || Xs > W + 10 || Ys < -10 || Ys > Hh + 10) continue; G.Q.glow(Xs, Ys, T * 0.1 * e.s, e.col, a * 0.45); G.Q.glow(Xs, Ys, T * 0.03 * e.s, '#FFFFFF', a * 0.75); }
        gpuEnd(c, G); },
      refresh() { glows = null; } }; }

  /* ======================= the hazards: the vaults' steam vents (a painted grate, GPU steam), the lasers' glow tell ======================= */
  DEF.yugvent = { box: () => [-0.75, -0.55, 0.75, 0.45], mat: { mat: 'iron', cols: ['#4A5E70', '#2A3A48', '#9AB4C6'] }, el: 'water', hp: 99,
    paint(K, S, v, L) { const sd = 191, c = S.c;
      disc(K, S, 0, 0, 0.62, 0.32, (dx, dy, r) => { hullT(K, dx * 2, dy * 2, sd, { tone: 1.1, paint: 0.5, pc: [0.06, 0.12, 0.14] }); if (r > 0.86) K.M.ao *= 0.8; }, { bv: 0.22, dome: 0.1 }); S.unlock();
      disc(K, S, 0, -0.01, 0.46, 0.23, (dx, dy, r) => { const M = K.M; M.r = 0.01; M.g = 0.015; M.b = 0.02; M.rg = 0.7; M.ao = 0.4; glowAdd(M, E_TEAL, 0.25 * (1 - r)); }, { bv: 0.3 }); S.unlock();
      for (let i = -3; i <= 3; i++) { const x = i * 0.12, hw = Math.sqrt(Math.max(0, 1 - (x / 0.46) * (x / 0.46))) * 0.23; if (hw < 0.03) continue; K.tube(S, [[x, -0.01 - hw], [x, -0.01 + hw]], 0.022, 0.022, (t, s2) => darkM(K, t * 4, s2, sd)); } S.unlock();
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; K.ball(S, Math.cos(a) * 0.54, Math.sin(a) * 0.28, 0.025, 0.025, (dx, dy) => chromeM(K, dx, dy, sd)); } S.unlock(); K.ink(S, INK[L], 0.4); } };
  const LIVEBIO = () => LIVE && LIVE.X && LIVE.X.F && BIO_L[LIVE.X.F.biome] ? LIVE.X.F.biome : null;
  // 20b drawHazard: a steam vent in a Yuggoth land is the painted grate; its live light (wisps idle, kindling as it warns, a plume
  // as it blows) queued for this stage's pass. true when drawn (20b then skips its old ellipses)
  function hazard(c, h, Xs, Ys, T, gt) { if (off() || !h || h.kind !== 'steamvent' || !LIVEBIO()) return false; if (!piece(c, 'yugvent', 0, Xs, Ys, T)) return false; STATS.hazards++;
    if (gpuOK()) { const warn = h.st === 'warn', pop = h.pop > 0 ? Math.min(1, h.pop / 0.45) : 0, sd = h.ph || 0;
      ql('glow', Xs, Ys, T * (warn ? 0.9 : 0.6), TEAL, warn ? 0.3 + 0.15 * Math.sin(gt * 9) : 0.12, 0.5);
      qo('quad', 573, Xs, Ys - T * (0.7 + pop * 0.6), T * (0.55 + pop * 0.4), 0, 0, T * (0.8 + pop * 0.7), '#DFF6F2', warn ? 0.7 : 0.45 + pop * 0.5, sd, warn ? 0.55 : 0.3 + pop * 0.7, warn ? 0.8 : 0.3);
      if (warn) qo('glow', Xs, Ys - T * 0.05, T * 0.45, '#FFFFFF', 0.25 + 0.15 * Math.sin(gt * 14)); }
    return true; }
  // a vent's warning (20b warnZone drawn: true while its glow is the tell; else 20b draws its circle): the grate's own kindling
  // (hazard() above) is the tell, so here only a soft pool of warm-white light gathers round it
  function tellFor(h) { if (off() || !h || !LIVEBIO() || !gpuOK()) return undefined; if (h.kind === 'steamvent') return () => { if (!gpuOK()) return false; STATS.tells++; return true; }; return undefined; }
  // a laser's warning (20b: its line, then the beam): a glow along the line, kindling from its ends as the strike nears, two
  // emitters of light at its ends (no dashed box)
  function lineTell(x, y, a, len, w, life) { if (off() || !LIVEBIO() || !gpuOK()) return undefined; const t0 = now(), X = LIVE.X;
    return () => { if (!gpuOK() || !LIVE || LIVE.X !== X) return false; const u = clamp((now() - t0) / 1000 / (life || 1), 0, 1), T = X.Tz(), ax = X.sx(x), ay = X.sy(y), bx = X.sx(x + Math.cos(a) * len), by = X.sy(y + Math.sin(a) * len), col = LIVEBIO() === 'engineheart' ? PINK : VIOLET;
      ql('rbeam', ax, ay, bx, by, T * w * (0.6 + 0.6 * u), col, 0.18 + 0.4 * u, 1, 1); ql('beam', ax, ay, bx, by, T * 0.08, '#FFFFFF', 0.15 + 0.35 * u * u);
      for (const [px, py] of [[ax, ay], [bx, by]]) { qo('glow', px, py - T * 0.4, T * (0.45 + 0.3 * u), col, 0.5 + 0.3 * Math.sin(now() / 40)); qo('glow', px, py - T * 0.4, T * 0.12, '#FFFFFF', 0.7); }
      STATS.tells++; return true; }; }
  // the steam a vent leaves (20b's poison zone of colour #E8F0F8, in a Yuggoth land): GPU steam instead of its outlined ellipse
  function steamZone(c, z, Xs, Ys, T) { if (off() || !LIVEBIO() || !gpuOK()) return false; const k = Math.min(1, z.life / 0.6, (z.max - z.life) / 0.25 + 0.2), R = z.r * T;
    ql('glow', Xs, Ys, R * 1.2, '#CFEFEA', 0.22 * k, 0.6); qo('quad', 573, Xs, Ys - R * 0.9, R * 1.1, 0, 0, R * 1.3, '#E8FFFA', 0.6 * k, (z.sd = z.sd || Math.random() * 40), 0.95, 0.5); return true; }

  /* ======================= the doors (the Drowned Belfry's, themed for the Engine) ======================= */
  const DOOR_TH = { wreckfield: 'yugwreck', coolant: 'yugcool', engineheart: 'yugheart' };
  // the door's stone becomes hull plating (each block a plate, its own tone, riveted bevel, scorched), its bronze gunmetal with
  // worn bright edges (20n9d's theme material hooks, v472 YE)
  const doorStone = (burn, pc, flesh) => (K, o, x, z, sd, stain) => { hullM(K, x * 1.3 + (o.u || 0) * 0.7, z * 1.1 + (o.v || 0) * 0.5, sd + (o.blk || 0) * 1.7, { burn: burn * (0.6 + 0.4 * ((o.blk || 0) * 0.37 % 1)), paint: pc ? 0.7 : 0, tone: 0.9 + 0.15 * ((o.blk || 0) * 0.53 % 1) });
    if (pc && K.M.mt < 0.5) { K.M.r = pc[0]; K.M.g = pc[1]; K.M.b = pc[2]; } if (flesh && (z < 0.5 || K.vn(x * 3 + sd, z * 3) > 0.78)) { const f = z < 0.5 ? ss(0.5, 0.1, z) * ss(0.4, 0.6, K.vn(x * 4, z * 4 + sd)) : 0.6; if (f > 0) { const M = K.M, s = { r: M.r, g: M.g, b: M.b }; fleshM(K, x * 3, z * 3, sd); M.r = lerp(s.r, M.r, f); M.g = lerp(s.g, M.g, f); M.b = lerp(s.b, M.b, f); M.mt *= 1 - f; } } };
  const doorMetal = tint => (K, x, z, sd, wear, k) => { darkM(K, x, z, sd); const M = K.M, w = clamp(wear || 0, 0, 1); M.fr = lerp(M.fr, 0.62, w * 0.6) + tint[0] * 0.12; M.fg = lerp(M.fg, 0.64, w * 0.6) + tint[1] * 0.12; M.fb = lerp(M.fb, 0.72, w * 0.6) + tint[2] * 0.12; M.rg = lerp(M.rg, 0.18, w); };
  function doorThemes() { try { if (typeof BEL_DOORS === 'undefined' || !BEL_DOORS || !BEL_DOORS.defTheme) return; const D = BEL_DOORS.defTheme;
    D('yugwreck', { light: LIGHT.wreck, gem: [0.85, 0.4, 1.0], rune: VIOLET, runeHi: '#F2DDFF', ring: VIOLET_HI, lit: '#E8C8FF', litFloor: VIOLET, caustic: VIOLET_HI, mote: '#FFFFFF', smoke: '#4A4058', drip: VIOLET_HI,
      recess: ['#06030C', '#2A0E44', '#0C0618'], glowIn: [[245, 230, 255], [200, 130, 255], [70, 20, 110]], stoneM: doorStone(0.55, null, false), metalM: doorMetal(E_VIO) });
    D('yugcool', { light: LIGHT.cool, gem: [0.3, 1.0, 0.88], rune: TEAL, runeHi: '#E8FFFA', ring: TEAL_HI, lit: '#D8FFF8', litFloor: TEAL, caustic: TEAL_HI, mote: '#FFFFFF', smoke: '#3A4C58', drip: TEAL_HI,
      recess: ['#020A0C', '#0C3A3A', '#06141A'], glowIn: [[230, 255, 250], [130, 240, 220], [20, 90, 90]], stoneM: doorStone(0.15, [0.06, 0.12, 0.14], false), metalM: doorMetal(E_TEAL) });
    D('yugheart', { light: LIGHT.heart, gem: [1.0, 0.62, 0.22], rune: AMBER, runeHi: '#FFF2D8', ring: '#FFE2A0', lit: '#FFE8C8', litFloor: AMBER, caustic: '#FFD0E8', mote: '#FFE2A0', smoke: '#4A2A44', drip: '#FFD0E8',
      recess: ['#0C0308', '#4A1238', '#160610'], glowIn: [[255, 240, 225], [255, 170, 120], [110, 30, 60]], stoneM: doorStone(0.35, null, true), metalM: doorMetal(E_AMB) }); } catch (e) {} }
  doorThemes();
  const DOORS = () => (!off() && typeof BEL_DOORS !== 'undefined' && BEL_DOORS && BEL_DOORS.stage && BEL_DOORS.themed) ? BEL_DOORS : null;
  const doorKind = (Rf, i) => { const nx = Rf.stages[i + 1]; return nx && nx.kind === 'boss' ? 'boss' : 'std'; };
  function hookRift() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.yuggoth; if (!Rf || Rf.__yugp) return; Rf.__yugp = 1;
    const oe = Rf.everyStage; Rf.everyStage = function (X, self, H) { let a = {}; try { a = oe ? oe.apply(this, arguments) || {} : {}; } catch (e) { a = {}; } if (off()) return a;
      let C = null; try { const D = DOORS(), S2 = (self && self.S) || {}; if (D && S2.kind !== 'boss' && X.F.rift && !X.F.rift.gate && H && H.exit) { C = { t: 0, X, exitPos: () => H.exit() }; D.stage(X, C, doorKind(Rf, X.F.rift.stage), D.themed(DOOR_TH[X.F.biome] || 'yugwreck')); } } catch (e) { C = null; }
      const tickDoor = dt => { if (!C) return; C.t += dt; try { BEL_DOORS.tick(C, dt, !!self.done); } catch (e) {} };
      let L = null; try { L = LN_OF[X.F.biome] ? lights(X) : null; } catch (e) { L = null; } if (!L) return C ? Object.assign({}, a, { update(dt) { if (a.update) a.update(dt); tickDoor(dt); }, door: C }) : a; LIVE = L; QL.length = 0; QO.length = 0; BOLTS.length = 0;
      return Object.assign({}, a, { update(dt) { if (a.update) a.update(dt); L.update(dt); tickDoor(dt); }, drawGround(c) { if (a.drawGround) a.drawGround(c); L.drawGround(c); }, drawOver(c) { if (a.drawOver) a.drawOver(c); L.drawOver(c); }, yugp: L, door: C }); };
    const op = Rf.preload; Rf.preload = function (P) { let a = []; try { a = op ? op.apply(this, arguments) || [] : []; } catch (e) {} let b = []; try { b = warm(P); } catch (e) {}
      let d = []; try { const D = DOORS(), S2 = P && P.S; if (D && S2 && S2.kind !== 'boss' && P.F && P.F.rift && !P.F.rift.gate) d = D.warmDoor(P, doorKind(Rf, P.F.rift.stage), DOOR_TH[P.F.biome] || 'yugwreck') || []; } catch (e) {}
      return a.concat(b, d); }; } catch (e) {} }
  hookRift();

  const API = { piece, sprite: (n, v, P, L) => sprite(n, v, P, true, L), tex, texJobs, warm, release, install, glowsOf, OLD, DEF, TDEF, KINDS, HPK, DEBRIS, BURSTS, BOLTS, LIGHT, BIO_L, LN_OF, PIECES_OF, QL, QO, ql, qo, ready, gpuOK,
    arcs, bolt, burst, queueBolt, hazard, tellFor, lineTell, steamZone,
    kitx: { lump, prism, plate, disc, box, contact, halo, grit, rivets, floorShard, hullM, darkM, chromeM, copperM, glowGlassM, fungusM, fleshM, boneM, rubberM, ashM, hullT, fleshT, glowAdd, INK, lit, E_VIO, E_TEAL, E_AMB, E_PINK, E_FUNG },
    get live() { return LIVE; }, get base() { return BASE; }, set base(v) { if (v > 2) BASE = Math.round(v); },
    get stats() { return Object.assign({ cached: CACHE.size, textures: TEX.size, texKeys: [...TEX.keys()], bolts: BOLTS.length, px: [...CACHE.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) + [...TEX.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) }, STATS); } };
  if (HAS_W) window.YUG_PROPS = API;
  return API;
})();
