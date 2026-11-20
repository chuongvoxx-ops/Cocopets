/* ---------- v433 DE: The Mouth Beneath the Dunes repainted in 2.5D (Rift 03's three lands, their props and the puzzles' pieces) ----------
   Every solid piece of the rift is painted once into its own cached picture by the Drowned Belfry's software shading pass
   (BELPROPS.kit, 20n9: each pixel of a solid gets a normal and a material and is lit), each land in its own light:
     dusk  (the dunes under the fossil jaw, section 1): a low amber sun, violet shadows, a rose sky in the reflections, warm sand bounce
     noon  (the Rust Flats, section 2): a white sun overhead, rust shadows, a pale sky, an orange bounce off the clay
     night (the Moonlit Dunes, section 3): a cold moon key, navy shadows, a green rim from the fireflies
   then finished with a little 2D detail and a soft ink edge. Nothing is painted per frame: the frame lays the pictures down;
   what glows (the pink crystals, the skulls' sockets, the cyan resonance in the basalt, the resonator stones, the gaps
   between the ribs, the amber shards, the mounds' tells) is the GPU painter's light over them (FGFX, 20k6h), lowFx respected.
   Pictures (name, v; light from the land): the props of the three lands (v 0..1 painted, 2..3 the same mirrored): the dunes'
   dunerock, bones, ribarch, jawtooth, menhir, sanddrift; the Flats' mesarock, pinkcrystal, crystalout, claypillar, relic,
   tumbleweed; the night's nightrock, gravestone, bonecairn, glowshroom, deadtree, deadshrub, skullpile (bones in all three;
   dunerock and bones painted only where they stand in these lands: elsewhere the old art). Each land's props list, propN and
   a rim thicket (B.dress, as the Garden's) are getters too: the old list and counts whenever the painter is off; the floor's decals (durip dupeb dubone duvein dugrass dushard / medust mepeb mebone mecrack metuft mecrys / ndrip ndpeb ndbone ndshroom ndgrass
   ndtwig, v 0..3), the puzzles' pieces (the Sandstorm Flight's ribtip v 0 down 1 up, ribshaft (a texture), amber, cairn; the
   Echo Chamber's resonator v 0..5; the Grub Mounds' mound, grubpop, mantapop).
   Textures (made once per sharpness and land, wrapping): floor (6 tiles square), bank (the wall's face), roof (the wall top),
   cliff (over the pit), bridge (bone slats lashed between ropes; timber in the Flats) and bunder (its underside) for each of
   dunes / mesa / nightdune.
   The lands (BIOMES.dunes, .mesa, .nightdune): floorFn, wallFn, roofFn, cliffTint, bridgeFn, bridgeEdge and floor (the base colour
   under props: the floor texture's mean) as getters (undefined, so the old art,
   whenever the painter is off); DECALS of their own (six kinds each, about twice the old density); B.floorUnder (20e's v433 DE
   hook: the floor texture under the props too; the walls' feet get drifts). The `gap` and backgrounds
   are not touched here (20r3, DS).
   The props are repainted through the engine's prop cache (DunWorld.PROPS), so BREAK_FX shatters the new pictures in their
   own materials; each break adds its debris and a feathered GPU burst; the old 2D art stays in DUNE_PROPS.OLD.
   The rift (RIFT_BY_ID.dunes): everyStage (chained) lays the light over every stage and flushes the puzzles' queued light;
   preload (chained) warms the stage's textures, decals and pieces; DunWorld.dropProps (chained) frees everything.
   The puzzles call glide(), mounds() and resonator() (20r's "v433 DE" hooks): each draws its pieces' pictures and queues
   their light, or returns false (no painter, no GPU light this stage) and the old 2D art is drawn.
   window.__DPP = 0 turns all of it off. */
var DUNE_PROPS = (() => {
  const TAU = Math.PI * 2, HAS_W = typeof window !== 'undefined';
  const off = () => HAS_W && (window.__DPP === 0 || window.__BELP === 0);
  const BP = () => (!off() && HAS_W && window.BELPROPS && window.BELPROPS.kit) ? window.BELPROPS : null;
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + (s | 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const R1 = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const rgba = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${clamp(a, 0, 1)})`; };
  const rgb3 = h => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const md = (a, n) => ((a % n) + n) % n;
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0, tex: 0, texMs: 0, hooks: 0 };
  const CYAN = '#62BFC9', AMBER = '#E8A33A', PINK = '#FF5FC4', GREEN = '#7CFF6A', SAND = '#FFE9A8';

  /* ======================= the light of each land ======================= */
  const LIGHT = {
    dusk: { a0: [0.17, 0.09, 0.13], a1: [0.1, 0.06, 0.1], e0: [0.14, 0.08, 0.07], e1: [0.52, 0.32, 0.42], k: [1.32, 1.02, 0.74], rim: [0.55, 0.32, 0.16], bo: [0.17, 0.11, 0.06] },
    noon: { a0: [0.21, 0.13, 0.1], a1: [0.12, 0.1, 0.1], e0: [0.2, 0.1, 0.06], e1: [0.46, 0.48, 0.58], k: [1.4, 1.27, 1.08], rim: [0.46, 0.3, 0.24], bo: [0.22, 0.1, 0.05] },
    night: { a0: [0.07, 0.09, 0.17], a1: [0.05, 0.07, 0.14], e0: [0.05, 0.06, 0.12], e1: [0.26, 0.34, 0.56], k: [0.7, 0.84, 1.16], rim: [0.14, 0.42, 0.22], bo: [0.04, 0.06, 0.12] } };
  const BIO_L = { dunes: 'dusk', mesa: 'noon', nightdune: 'night' };
  const INK = { dusk: [44, 18, 30], noon: [56, 18, 10], night: [6, 10, 28] };
  function lit(K, name, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHT[name] || LIGHT.dusk); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }
  const bioOf = B => { if (!B || typeof BIOMES === 'undefined') return null; return B === BIOMES.dunes ? 'dunes' : B === BIOMES.mesa ? 'mesa' : B === BIOMES.nightdune ? 'nightdune' : null; };

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
  function pfeat(x, y, p, s, prob) { const xi = Math.floor(x), yi = Math.floor(y); let d1 = 9, id = -1, ox = 0, oy = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i, cy = yi + j, wx = ((cx % p) + p) % p, wy = ((cy % p) + p) % p; if (PH(wx, wy, s + 2) >= prob) continue; const px = cx + PH(wx, wy, s), py = cy + PH(wx, wy, s + 1), d = Math.hypot(x - px, y - py);
      if (d < d1) { d1 = d; id = wy * p + wx; ox = x - px; oy = y - py; } }
    CELL.d = d1; CELL.id = id; CELL.ox = ox; CELL.oy = oy; return CELL; }

  /* ======================= primitives beyond the kit's ======================= */
  /* lump: a mass seen from the front: an ellipsoid with a wavering edge and a bumpy face (as 20p3's). o: { amp, fr, sd, bump,
     leaf (bumps a tile), mat(dx, dy, ao, e, nz, wx, wy), ao } */
  function lump(K, S, cx, cy, rx, ry, o) { const { M, vn } = K, P = S.P, X0 = S.ax + cx * P, Y0 = S.ay + cy * P, RX = rx * P, RY = ry * P; if (RX < 0.5) return;
    const amp = o.amp == null ? 0.12 : o.amp, fr = o.fr || 2.2, sd = o.sd || 0, bump = o.bump == null ? 0.5 : o.bump, lf = o.leaf || 9, mR = Math.min(RX, RY), A0 = o.ao == null ? 1 : o.ao, flat = o.flat || 0;
    S.lock();
    const xa = Math.max(0, Math.floor(X0 - RX * (1 + amp) - 2)), xb = Math.min(S.w - 1, Math.ceil(X0 + RX * (1 + amp) + 2)), ya = Math.max(0, Math.floor(Y0 - RY * (1 + amp) - 2)), yb = Math.min(S.h - 1, Math.ceil(Y0 + RY * (1 + amp) + 2));
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { let dx = (px + 0.5 - X0) / RX, dy = (py + 0.5 - Y0) / RY; if (flat && dy > 0) dy *= 1 + flat * dy * 2;   // (flat: a sole that sits on the ground)
      const rr = Math.hypot(dx, dy), ca = dx / (rr || 1), sa = dy / (rr || 1);
      const edge = 1 + amp * (vn(ca * fr + sd + 3, sa * fr + sd * 1.3 + 3) * 2 - 1) + amp * 0.5 * (vn(ca * fr * 3 + sd, sa * fr * 3 - sd) * 2 - 1); if (rr > edge + 1.5 / mR) continue;
      const e = Math.min(1, rr / edge), ny0 = Math.sqrt(Math.max(0, 1 - e * e)), wx = (px - S.ax) / P, wy = (py - S.ay) / P;
      const b1 = vn(wx * lf + sd, wy * lf), b2 = vn(wx * lf + 4.1 + sd, wy * lf + 2.3);
      let nx = dx / edge + (b1 - 0.5) * bump, ny = ny0 + 0.08, nz = -dy / edge + (b2 - 0.5) * bump; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      K.M0(); M.ao = (0.5 + 0.5 * ny0) * A0; o.mat(dx, dy, M.ao, e, nz, wx, wy); K.shade(nx, ny, nz); K.put(S, px, py, clamp((edge - rr) * mR + 0.6, 0, 1)); }
  }
  /* prism: a six-sided prism (a crystal, a basalt column, an obelisk) standing from its foot (cx, by), leaning ang (radians,
     + to the right), radius r0 at the foot to r1 at the top (h tiles up), then a pyramid tip tip tiles tall (0: flat).
     A flat face toward the camera, two side faces. mat(face -1 | 0 | 1, q across -1..1, wt up 0..1, inTip, ao) */
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
  function halo(c, x, y, r, col, a) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.35, rgba(col, a * 0.4)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
  const ptsQ = (x0, y0, cx, cy, x1, y1, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c2 = t * t; o.push([a * x0 + b * cx + c2 * x1, a * y0 + b * cy + c2 * y1]); } return o; };
  // a hole the wind scoured through soft rock (2D, over the painted rock)
  function hole(c, x, y, rx, ry) { c.save(); c.translate(x, y); c.scale(1, ry / rx); const g = c.createRadialGradient(-rx * 0.2, -rx * 0.25, 0, 0, 0, rx); g.addColorStop(0, 'rgba(22,8,14,.94)'); g.addColorStop(0.62, 'rgba(48,20,20,.8)'); g.addColorStop(1, 'rgba(90,44,26,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,224,170,.38)'; c.lineWidth = rx * 0.14; c.beginPath(); c.arc(0, 0, rx * 0.9, 0.35, 2.75); c.stroke(); c.restore(); }
  // a dark socket (a skull's eye, a crater): a soft dark well, a lit lower rim
  function socket(c, x, y, rx, ry, rim) { c.save(); c.translate(x, y); c.scale(1, ry / rx); const g = c.createRadialGradient(0, -rx * 0.15, 0, 0, 0, rx); g.addColorStop(0, 'rgba(8,6,12,.96)'); g.addColorStop(0.7, 'rgba(20,12,16,.85)'); g.addColorStop(1, 'rgba(40,26,20,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
    if (rim) { c.strokeStyle = rim; c.lineWidth = rx * 0.16; c.beginPath(); c.arc(0, 0, rx * 0.86, 0.4, 2.7); c.stroke(); } c.restore(); }

  /* ======================= materials (each sets K.M) ======================= */
  function sandM(K, u, v, sd, tone, night) { const { M, vn } = K, g = vn(u * 23 + sd, v * 23), w = vn(u * 3 + sd, v * 3), t = (0.85 + 0.2 * w + 0.1 * g) * (tone || 1);
    if (night) { M.r = 0.62 * t; M.g = 0.6 * t; M.b = 0.6 * t; } else { M.r = 0.86 * t; M.g = 0.68 * t; M.b = 0.44 * t; } M.rg = 0.95; if (g > 0.8) { M.r *= 1.07; M.g *= 1.06; M.b *= 1.05; } else if (g < 0.15) M.ao *= 0.9; }
  function sandstoneM(K, u, v, sd) { const { M, vn, fbm } = K, band = v * 7.5 + (fbm(u * 1.3 + sd, v * 0.8) - 0.5) * 1.6, id = Math.floor(band), f = band - id, tone = hh(id, 3, sd | 0), w = fbm(u * 5 + sd, v * 5), t = 0.82 + 0.25 * w;
    M.r = (0.8 + 0.1 * tone) * t; M.g = (0.55 + 0.1 * tone) * t; M.b = (0.32 + 0.06 * tone) * t; if (tone < 0.3) { M.r *= 0.92; M.g *= 0.8; M.b *= 0.76; }
    M.rg = 0.88; const gr = Math.abs(f - 0.5); if (gr < 0.08) M.ao *= 0.66 + gr * 4.2; if (f > 0.9) { M.r *= 1.07; M.g *= 1.07; M.b *= 1.05; } if (vn(u * 31 + sd, v * 31) > 0.83) M.ao *= 0.85; }
  function basaltM(K, u, v, sd, vein) { const { M, vn } = K, w = vn(u * 6 + sd, v * 6), p = vn(u * 37 + sd, v * 37), t = 0.8 + 0.4 * w;
    M.r = 0.13 * t; M.g = 0.12 * t; M.b = 0.145 * t; M.rg = 0.48; M.cc = 0.2; if (p > 0.78) M.ao *= 1 - (p - 0.78) * 2.2;
    if (vein !== false) { const vv = Math.abs(vn(u * 2.6 + sd * 3, v * 2.6 + 4) - 0.5); if (vv < 0.013) { const k = 1 - vv / 0.013; M.r = lerp(M.r, 0.3, k); M.g = lerp(M.g, 0.8, k); M.b = lerp(M.b, 0.85, k); M.er = 0.1 * k; M.eg = 0.42 * k; M.eb = 0.46 * k; } } }
  function boneM(K, u, v, sd, stain) { const { M, vn } = K, w = vn(u * 5 + sd, v * 5), p = vn(u * 41 + sd, v * 41), t = 0.88 + 0.16 * w;
    M.r = 0.92 * t; M.g = 0.88 * t; M.b = 0.76 * t; M.rg = 0.6; M.cc = 0.08; if (p > 0.74) M.ao *= 1 - (p - 0.74) * 1.6;
    const cr = Math.abs(vn(u * 3.3 + sd * 2, v * 9) - 0.5); if (cr < 0.012) { M.ao *= 0.55; M.r *= 0.8; M.g *= 0.76; M.b *= 0.7; }
    if (stain) { const k = clamp(stain, 0, 1); M.r = lerp(M.r, 0.62, k); M.g = lerp(M.g, 0.48, k); M.b = lerp(M.b, 0.3, k); } }
  function clayM(K, u, v, sd, tone) { const { M, vn, fbm } = K, w = fbm(u * 3 + sd, v * 3), t = (0.8 + 0.32 * w) * (tone || 1); M.r = 0.82 * t; M.g = 0.44 * t; M.b = 0.22 * t; M.rg = 0.92; if (vn(u * 29, v * 29 + sd) > 0.82) M.ao *= 0.85; }
  const STRATA = [[0.93, 0.74, 0.54], [0.85, 0.48, 0.25], [0.66, 0.28, 0.15], [0.9, 0.58, 0.34], [0.5, 0.19, 0.11], [0.8, 0.4, 0.2]];
  function redrockM(K, u, v, sd) { const { M, vn, fbm } = K, b = v * 6.2 + (fbm(u * 0.9 + sd, v * 0.5) - 0.5) * 0.9, id = Math.floor(b), f = b - id, C0 = STRATA[md(id, 6)], C1 = STRATA[md(id + 1, 6)], k = ss(0.82, 1, f), w = fbm(u * 6 + sd, v * 6), t = 0.84 + 0.24 * w;
    M.r = lerp(C0[0], C1[0], k) * t; M.g = lerp(C0[1], C1[1], k) * t; M.b = lerp(C0[2], C1[2], k) * t; M.rg = 0.86;
    if (f < 0.08) M.ao *= 0.7 + f * 3.6;   // (the seam under each layer)
    const sk = ss(0.6, 0.85, vn(u * 9 + sd, v * 1.2)) * ss(0.5, 0.0, f); if (sk > 0) { M.r = lerp(M.r, 0.28, sk * 0.5); M.g = lerp(M.g, 0.14, sk * 0.5); M.b = lerp(M.b, 0.1, sk * 0.5); }   // (desert varnish down from a ledge)
    if (vn(u * 33, v * 33 + sd) > 0.84) M.ao *= 0.86; }
  const PINKC = [1.0, 0.42, 0.8], AMBC = [1.0, 0.62, 0.16];
  function crystalM(K, col, face, q, wt, glow) { const M = K.M; const k = face ? 0.5 : 0.62; M.r = col[0] * k; M.g = col[1] * k; M.b = col[2] * k; M.rg = 0.07; M.cc = 1; M.sh = 0.75;
    const core = ss(0.3, 0.0, Math.abs(q)), e = glow * (0.22 + 0.5 * wt + 0.45 * core); M.er = col[0] * e + 0.25 * core * glow; M.eg = col[1] * e + 0.22 * core * glow; M.eb = col[2] * e + 0.24 * core * glow; }
  function nstoneM(K, u, v, sd, tone) { const { M, vn, fbm } = K, w = fbm(u * 3 + sd, v * 3), t = (0.8 + 0.3 * w) * (tone || 1); M.r = 0.5 * t; M.g = 0.5 * t; M.b = 0.55 * t; M.rg = 0.8;
    const li = vn(u * 7 + sd, v * 7); if (li > 0.76) { const k = ss(0.76, 0.86, li) * 0.6; M.r = lerp(M.r, 0.66, k); M.g = lerp(M.g, 0.74, k); M.b = lerp(M.b, 0.6, k); } if (vn(u * 31, v * 31 + sd) > 0.82) M.ao *= 0.85; }
  function deadwoodM(K, t, s, sd) { const { M, vn } = K, g = vn(s * 3 + sd, t * 26), w = 0.75 + 0.35 * g; M.r = 0.45 * w; M.g = 0.42 * w; M.b = 0.41 * w; M.rg = 0.72; if (g < 0.25) M.ao *= 0.7; }
  // a fossil rib (the Sandstorm Flight's): bleached bone, growth rings round it, ochre staining; v wraps every 2 tiles
  function ribM(K, s, v, sd) { const M = K.M, w = pvn(s * 2 + 3, v * 4, 8, 5 + sd), w2 = pvn(s * 6 + 1, v * 12, 24, 7 + sd), ring = Math.abs(Math.sin(v * Math.PI * 3 + w * 1.4)), t = 0.84 + 0.2 * w + 0.06 * w2;
    M.r = 0.92 * t; M.g = 0.86 * t; M.b = 0.72 * t; M.rg = 0.6; M.cc = 0.1; if (ring < 0.12) M.ao *= 0.78; const stn = ss(0.55, 0.8, pvn(s * 1.5, v * 2, 4, 9 + sd)); if (stn > 0) { M.r = lerp(M.r, 0.7, stn * 0.5); M.g = lerp(M.g, 0.52, stn * 0.5); M.b = lerp(M.b, 0.32, stn * 0.5); }
    if (w2 > 0.82) M.ao *= 0.86; }

  /* ======================= the props ======================= */
  /* (v433 DE, second pass) every prop rebuilt at the Garden's bar: real fossil anatomy (ribcages of single ribs on a chain of
     vertebrae, tusks, jaws with their teeth, horned skulls, the great jaw's teeth standing as spires), wind-carved sandstone
     (overhangs, yardangs, strata cut back, sand pooled at the foot), organic layered buttes, faceted crystal clusters in
     clay sockets with light inside them, basalt menhirs veined with the jaw's cyan, rusted relics, tumbleweed, gravestone
     slabs, bone cairns, glowing fungus and dead trees; cracks, pitting and sand drifted into every hollow */
  const contact = (K, S, rx, ry, a) => K.contact(S, 0, 0.02, rx, ry, a || 0.55);
  const dustM = (K, u, v, sd, L) => { if (L === 'noon') { clayM(K, u, v, sd, 1.1); K.M.g *= 1.1; K.M.b *= 1.15; } else sandM(K, u, v, sd, 1, L === 'night'); };
  const drift = (K, S, cx, rx, ry, sd, L, cy) => lump(K, S, cx, cy == null ? -0.02 : cy, rx, ry, { amp: 0.14, fr: 2.6, sd: sd + 9, bump: 0.18, leaf: 14, flat: 0.6, mat: (dx, dy, ao, e, nz, wx, wy) => dustM(K, wx, wy, sd, L) });
  // sand pooled in a hollow (between ribs, in a socket, against a stone): a small low drift
  const pool = (K, S, x, y, rx, ry, sd, L) => lump(K, S, x, y, rx, ry, { amp: 0.2, fr: 3, sd: sd + x * 7, bump: 0.15, leaf: 18, flat: 0.8, mat: (dx, dy, ao, e, nz, wx, wy) => { dustM(K, wx, wy, sd, L); K.M.ao *= 0.9; } });
  const pebbles = (K, S, n, x0, x1, y0, y1, mat, sd) => { const R = K.R1(sd); for (let i = 0; i < n; i++) { const x = lerp(x0, x1, R()), y = lerp(y0, y1, R()), r = 0.03 + R() * 0.05; lump(K, S, x, y - r * 0.4, r * 1.3, r, { amp: 0.25, fr: 2.4, sd: sd + i, bump: 0.5, leaf: 26, flat: 0.5, mat: (dx, dy, ao, e, nz, wx, wy) => mat(wx, wy, i) }); } S.unlock(); };
  // fine cracks (2D, over what is painted): a dark line with a lit lower lip
  function cracks(c, R, n, x0, x1, y0, y1, a, len) { c.save(); c.globalCompositeOperation = 'source-atop'; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < n; i++) { let x = lerp(x0, x1, R()), y = lerp(y0, y1, R()); const pts = [[x, y]], ang = R() * TAU, st = (len || 0.07); for (let k = 0; k < 4; k++) { x += Math.cos(ang + (R() - 0.5) * 1.4) * st; y += Math.sin(ang + (R() - 0.5) * 1.4) * st * 0.8 + 0.01; pts.push([x, y]); }
      for (const [dd, col, w] of [[0.009, `rgba(255,240,215,${a * 0.45})`, 0.011], [0, `rgba(30,14,12,${a})`, 0.012]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach((p, j) => j ? c.lineTo(p[0], p[1] + dd) : c.moveTo(p[0], p[1] + dd)); c.stroke(); } }
    c.restore(); }
  // lines along a path drawn over its painted tube: across it (a bone's growth ridges) or along it (a tooth's enamel striations)
  function along(pts, t) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); const T0 = t * L[L.length - 1]; let i = 1; while (i < pts.length - 1 && L[i] < T0) i++;
    const u = (T0 - L[i - 1]) / ((L[i] - L[i - 1]) || 1), dx = pts[i][0] - pts[i - 1][0], dy = pts[i][1] - pts[i - 1][1], l = Math.hypot(dx, dy) || 1; return [pts[i - 1][0] + dx * u, pts[i - 1][1] + dy * u, dx / l, dy / l]; }
  function ridges(c, pts, r0, r1, n, a, t0, t1) { c.save(); c.globalCompositeOperation = 'source-atop'; c.lineCap = 'round'; for (let k = 1; k < n; k++) { if (hh(k, n, 5) < 0.3) continue; const t = lerp(t0 || 0, t1 || 1, (k + (hh(k, n, 7) - 0.5) * 0.7) / n), [x, y, tx, ty] = along(pts, t), r = lerp(r0, r1, t) * 0.92, nx = -ty, ny = tx, bow = r * 0.25;
      for (const [dd, col, w] of [[0, `rgba(60,36,26,${a})`, 0.16], [r * 0.14, `rgba(255,244,222,${a * 0.6})`, 0.1]]) { c.strokeStyle = col; c.lineWidth = r * w; c.beginPath(); c.moveTo(x - nx * r + tx * dd, y - ny * r + ty * dd); c.quadraticCurveTo(x + tx * (bow + dd), y + ty * (bow + dd), x + nx * r + tx * dd, y + ny * r + ty * dd); c.stroke(); } } c.restore(); }
  function striae(c, pts, r0, r1, n, a, t0) { c.save(); c.globalCompositeOperation = 'source-atop'; c.lineCap = 'round'; for (let j = 0; j < n; j++) { const s = -0.75 + 1.5 * (j + 0.5) / n; c.strokeStyle = `rgba(80,60,40,${a * (0.6 + 0.4 * Math.abs(s))})`; c.lineWidth = lerp(r0, r1, 0.5) * 0.06; c.beginPath();
      for (let k = 0; k <= 20; k++) { const t = lerp(t0 || 0, 1, k / 20), [x, y, tx, ty] = along(pts, t), r = lerp(r0, r1, t); const px = x - ty * r * s, py = y + tx * r * s; if (k) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke(); } c.restore(); }
  // a bone along a path: pitted, cracked, ridged with growth lines, stained where the sand held it
  const boneT = (K, S, pts, r0, r1, sd, dark, st) => K.tube(S, pts, r0, r1, (t, s) => { boneM(K, s * 0.6 + sd, t * 4, sd, (st || 0) * ss(0.2, 0, t) + 0.08); if (Math.abs(Math.sin(t * 55 + sd)) < 0.1) K.M.ao *= 0.86; if (dark) K.M.ao *= dark; });
  // a vertebra side-on: its body, the spine above, a wing each side
  function vert(K, S, x, y, r, sd, st) { K.tube(S, [[x, y - r * 0.5], [x - r * 0.3, y - r * 2.0]], r * 0.34, r * 0.16, (t, s) => boneM(K, s + sd, t * 2, sd, st));
    for (const s0 of [-1, 1]) K.tube(S, [[x, y - r * 0.2], [x + s0 * r * 1.45, y - r * 0.6]], r * 0.28, r * 0.13, (t, s) => boneM(K, s + sd, t, sd + s0, st));
    S.unlock(); K.ball(S, x, y, r * 0.78, r * 0.64, (dx, dy) => { boneM(K, dx + sd, dy, sd, st + ss(-0.2, 0.9, dy) * 0.3); if (Math.abs(dx) > 0.82) K.M.ao *= 0.8; }); S.unlock(); }
  function skull(K, S, c, x, y, r, sd, horns) {   // a beast's skull, side-on, its snout to the right
    if (horns) { for (const [p, s0] of [[ptsQ(x - r * 0.3, y - r * 0.55, x - r * 1.5, y - r * 1.9, x - r * 2.5, y - r * 1.0, 12), 1], [ptsQ(x + r * 0.2, y - r * 0.65, x + r * 0.7, y - r * 2.1, x + r * 2.1, y - r * 1.9, 12), 2]]) K.tube(S, p, r * 0.24, r * 0.04, (t, s) => { boneM(K, s + s0, t * 3, s0, 0.35); K.M.r *= 0.86; K.M.g *= 0.8; K.M.b *= 0.72; if (Math.abs(Math.sin(t * 46)) < 0.24) K.M.ao *= 0.72; }); S.unlock(); }
    lump(K, S, x - r * 0.1, y - r * 0.05, r, r * 0.76, { amp: 0.06, fr: 1.6, sd: sd + 1, bump: 0.32, leaf: 7, mat: (dx, dy, ao, e, nz, wx, wy) => boneM(K, wx * 2, wy * 2, sd, ss(-0.1, 1, dy) * 0.45) });
    lump(K, S, x + r * 1.0, y + r * 0.32, r * 0.78, r * 0.4, { amp: 0.06, fr: 1.6, sd: sd + 3, bump: 0.3, leaf: 7, mat: (dx, dy, ao, e, nz, wx, wy) => boneM(K, wx * 2, wy * 2, sd + 3, ss(-0.1, 1, dy) * 0.45) }); S.unlock();
    socket(c, x + r * 0.3, y - r * 0.12, r * 0.26, r * 0.22, 'rgba(255,240,210,.35)'); socket(c, x + r * 1.62, y + r * 0.28, r * 0.09, r * 0.06, null); socket(c, x + r * 1.4, y + r * 0.26, r * 0.08, r * 0.05, null); socket(c, x - r * 0.45, y + r * 0.15, r * 0.22, r * 0.12, null);
    c.save(); for (let i = 0; i < 6; i++) { const tx = x + r * (0.5 + i * 0.2); const g = c.createLinearGradient(tx, y + r * 0.62, tx, y + r * 0.9); g.addColorStop(0, '#FFF6E2'); g.addColorStop(1, '#B8A07C'); c.fillStyle = g; c.beginPath(); c.moveTo(tx - r * 0.07, y + r * 0.62); c.lineTo(tx, y + r * (0.86 + (i % 2) * 0.06)); c.lineTo(tx + r * 0.07, y + r * 0.62); c.closePath(); c.fill(); } c.restore(); }
  /* ---- the dunes (dusk) ---- */
  function paintDunerock(K, S, v, L) { const sd = 3 + v * 7, R = K.R1(sd * 3), ssm = (dx, dy, ao, e, nz, wx, wy) => sandstoneM(K, wx, -wy, sd);
    contact(K, S, v ? 1.2 : 0.95, 0.34, 0.55);
    if (!v) { // a mushroom of sandstone: the wind has cut its waist back under a hard cap that overhangs it
      lump(K, S, 0.02, -0.6, 0.42, 0.62, { amp: 0.1, fr: 2.2, sd, bump: 0.5, leaf: 5, mat: ssm }); lump(K, S, -0.25, -0.22, 0.4, 0.26, { amp: 0.14, fr: 2, sd: sd + 4, bump: 0.5, leaf: 6, mat: ssm }); S.unlock();
      { const c = S.c; c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(0, -1.15, 0, -0.75); g.addColorStop(0, 'rgba(40,14,24,.55)'); g.addColorStop(1, 'rgba(40,14,24,0)'); c.fillStyle = g; c.fillRect(-1, -1.2, 2, 0.5); c.restore(); }   // (the cap's shadow on the waist)
      lump(K, S, 0.08, -1.3, 0.78, 0.3, { amp: 0.12, fr: 2.6, sd: sd + 2, bump: 0.45, leaf: 5, mat: (dx, dy, ao, e, nz, wx, wy) => { sandstoneM(K, wx, -wy, sd + 1); if (dy > 0.3) K.M.ao *= 0.7; } }); S.unlock();
      hole(S.c, -0.12, -0.62, 0.11, 0.08); hole(S.c, 0.2, -0.36, 0.07, 0.05); hole(S.c, 0.45, -1.32, 0.08, 0.05); }
    else { // a yardang: a long wind-streamlined ridge, its front cut under, a second ridge behind
      lump(K, S, -0.42, -0.86, 0.5, 0.3, { amp: 0.12, fr: 1.8, sd: sd + 2, bump: 0.42, leaf: 5, mat: ssm });
      lump(K, S, -0.05, -0.46, 0.95, 0.44, { amp: 0.12, fr: 1.4, sd, bump: 0.48, leaf: 4, mat: ssm }); S.unlock();
      lump(K, S, 0.42, -0.72, 0.5, 0.2, { amp: 0.1, fr: 2.2, sd: sd + 6, bump: 0.4, leaf: 5, mat: (dx, dy, ao, e, nz, wx, wy) => { sandstoneM(K, wx, -wy, sd + 3); if (dy > 0.35) K.M.ao *= 0.68; } }); S.unlock();
      hole(S.c, -0.45, -0.5, 0.12, 0.08); hole(S.c, -0.3, -0.9, 0.07, 0.045); hole(S.c, 0.12, -0.3, 0.06, 0.04); }
    // the layers of the sandstone: grooves the wind cut along them, each with a lit lip above
    { const c = S.c, Rg = K.R1(sd * 5); c.save(); c.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 13; i++) { const y = -0.08 - i * 0.12 - Rg() * 0.06, x0 = -1.1 + Rg() * 0.9, x1 = x0 + 0.5 + Rg() * 1.2, bend = (Rg() - 0.5) * 0.1, w = 0.012 + Rg() * 0.02;
      for (const [dy, col, a, lw] of [[0, '70,30,26', 0.32, w], [-w * 1.1, '255,226,170', 0.22, w * 0.6]]) { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.3, `rgba(${col},${a})`); g.addColorStop(0.7, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.strokeStyle = g; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y + dy); c.quadraticCurveTo((x0 + x1) / 2, y + bend + dy, x1, y + dy - 0.02); c.stroke(); } } c.restore(); }
    cracks(S.c, R, 5, -0.6, 0.6, -1.3, -0.2, 0.4);
    pebbles(K, S, 4, -0.9, 0.9, -0.05, 0.12, (x, y, i) => i % 2 ? basaltM(K, x * 3, y * 3, sd + i, false) : sandstoneM(K, x, -y * 4, sd + i), sd + 11);
    drift(K, S, -0.05, v ? 1.12 : 0.9, 0.15, sd, L); pool(K, S, v ? 0.55 : 0.4, -0.12, 0.3, 0.12, sd, L); S.unlock();
    const c = S.c; c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(-0.6, -1.6, 0.2, -0.4); g.addColorStop(0, 'rgba(255,214,150,.22)'); g.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = g; c.fillRect(-1.3, -1.8, 2.6, 1.6); c.restore();
    K.ink(S, INK[L], 0.45); }
  function paintBones(K, S, v, L) { const sd = 5 + v * 9, R = K.R1(sd * 7);
    contact(K, S, 1.15, 0.32, 0.5);
    if (!v) { // a ribcage lying on its side: the ribs arching up from the spine, the far ones in shadow, one broken, sand between them
      for (let i = 5; i >= 0; i--) { const xb = -0.72 + i * 0.25, top = -1.32 + Math.abs(i - 2.4) * 0.17, p = ptsQ(xb, -0.16, xb - 0.02, top, xb + 0.52, -0.1 - 0.12 * (i % 2), 16); if (i === 4) p.length = 11;
        boneT(K, S, p, 0.062, 0.03, sd + i, 0.66 + i * 0.06, 0.5); S.unlock(); ridges(S.c, p, 0.062, 0.03, 7, 0.16); }
      for (let i = 0; i < 5; i++) pool(K, S, -0.5 + i * 0.25, -0.07, 0.14, 0.07, sd + i, L); S.unlock();
      for (let i = 0; i < 8; i++) vert(K, S, -0.95 + i * 0.24, -0.12 - 0.025 * Math.sin(i * 1.3), 0.1 - Math.abs(i - 3.5) * 0.006, sd + i, 0.15);
      cracks(S.c, R, 8, -0.8, 0.8, -0.95, -0.15, 0.45, 0.04);
      drift(K, S, 0, 1.08, 0.1, sd, L, 0.04); }
    else { // a horned skull with a tusk behind it and a jaw fragment before it, its teeth still in
      K.tube(S, ptsQ(-1.1, -0.1, -0.25, -0.02, 0.5, -0.92, 14), 0.11, 0.02, (t, s) => { boneM(K, s + 3, t * 5, 3, 0.2); const M = K.M; M.cc = 0.25; M.rg = 0.42; if (Math.abs(Math.sin(t * 44)) < 0.1) M.ao *= 0.84; }); S.unlock();
      skull(K, S, S.c, 0.05, -0.42, 0.3, sd, true);
      pool(K, S, 0.14, -0.43, 0.06, 0.03, sd, L);   // (sand blown into the eye)
      K.tube(S, [[-0.75, -0.05], [-0.42, -0.1], [-0.05, -0.06]], 0.055, 0.045, (t, s) => boneM(K, s + 9, t * 3, 9, 0.25)); S.unlock();
      for (let i = 0; i < 5; i++) prism(K, S, -0.66 + i * 0.13, -0.13, 0.026, 0.02, 0.07, 0.045, (i - 2) * 0.08, (f, q, wt) => { const M = K.M; M.r = 0.96; M.g = 0.92; M.b = 0.82; M.rg = 0.3; M.cc = 0.5; if (f) M.ao *= 0.85; }); S.unlock();
      cracks(S.c, R, 6, -0.3, 0.6, -0.7, -0.2, 0.45, 0.04);
      drift(K, S, 0.05, 1.12, 0.14, sd, L); }
    S.unlock(); K.ink(S, INK[L], 0.42); }
  function paintRibarch(K, S, v, L) { const sd = 13 + v * 5, R = K.R1(sd); const sg = v ? -1 : 1;
    contact(K, S, 1.25, 0.34, 0.5);
    const p0 = ptsQ(0.95 * sg, 0.04, 1.05 * sg, -2.0, -0.25 * sg, -1.85, 16); boneT(K, S, p0, 0.14, 0.07, sd + 1, 0.68, 0.5); S.unlock(); ridges(S.c, p0, 0.14, 0.07, 11, 0.16);
    const p1 = ptsQ(0.62 * sg, 0.04, 0.6 * sg, -1.0, 0.05 * sg, -0.95, 10); p1.length = 8; boneT(K, S, p1, 0.08, 0.06, sd + 5, 0.62, 0.5); S.unlock();   // (a short broken one between)
    const p = ptsQ(-0.98 * sg, 0.06, -1.08 * sg, -3.05, 0.6 * sg, -2.2, 18); p.length = 16; boneT(K, S, p, 0.2, 0.095, sd, 1, 0.6); S.unlock(); ridges(S.c, p, 0.2, 0.1, 13, 0.18); striae(S.c, p, 0.2, 0.1, 3, 0.22, 0.05);
    K.ball(S, -0.98 * sg, -0.05, 0.2, 0.15, (dx, dy) => boneM(K, dx + sd, dy, sd, 0.4)); S.unlock();   // (its head, where it met the spine)
    const e = p[p.length - 1]; K.tube(S, [[e[0] - 0.04 * sg, e[1] + 0.02], [e[0] + 0.06 * sg, e[1] + 0.14]], 0.04, 0.008, (t, s) => boneM(K, s, t, sd, 0)); S.unlock();   // (a splinter at the break)
    vert(K, S, -0.55 * sg, -0.1, 0.13, sd + 3, 0.2); vert(K, S, -0.22 * sg, -0.06, 0.1, sd + 4, 0.2);
    cracks(S.c, R, 10, -1.1, 0.8, -2.3, -0.3, 0.45, 0.05);
    drift(K, S, -0.85 * sg, 0.55, 0.16, sd, L); drift(K, S, 0.9 * sg, 0.45, 0.13, sd + 2, L); pool(K, S, -0.4 * sg, -0.02, 0.5, 0.1, sd, L); S.unlock();
    K.ink(S, INK[L], 0.45); }
  function paintJawtooth(K, S, v, L) { const sd = 17 + v * 3, R = K.R1(sd);
    contact(K, S, 0.95, 0.3, 0.55);
    const tooth = (x, h, r, lean, s0, broken) => { const pts = ptsQ(x, 0.03, x + lean * 0.25, -h * 0.55, x + lean, -h, 16); if (broken) pts.length = 10;
      K.tube(S, pts, r, broken ? r * 0.55 : r * 0.04, (t, s) => { const M = K.M; if (t < 0.3) { boneM(K, s + s0, t * 4, s0, 0.7); M.r *= 0.92; } else { const w = K.vn(s * 3 + s0, t * 12); M.r = 0.95 * (0.9 + 0.12 * w); M.g = 0.92 * (0.9 + 0.1 * w); M.b = 0.82 * (0.88 + 0.1 * w); M.rg = 0.26; M.cc = 0.55; const st = ss(0.85, 0.6, t); M.r = lerp(M.r, 0.8, st * 0.2); M.g = lerp(M.g, 0.64, st * 0.2); M.b = lerp(M.b, 0.46, st * 0.2); }
        if (Math.abs(Math.sin(t * 34 + s0)) < 0.07) M.ao *= 0.8; if (Math.abs(Math.sin(s * 9 + s0)) < 0.18 && t > 0.3) M.ao *= 0.88; }); S.unlock(); striae(S.c, pts, r, broken ? r * 0.55 : r * 0.04, 5, 0.3, 0.32); ridges(S.c, pts, r, r * 0.5, 4, 0.14, 0.04, 0.3); };
    if (!v) { tooth(0.72, 1.0, 0.2, 0.22, 2, true); tooth(-0.05, 2.65, 0.42, 0.42, 1); }
    else { tooth(0.45, 1.5, 0.27, 0.3, 4, true); tooth(-0.3, 2.25, 0.36, -0.34, 3); }
    cracks(S.c, R, 9, -0.5, 0.7, -2.2, -0.2, 0.5, 0.06);
    pebbles(K, S, 6, -0.9, 0.95, -0.04, 0.12, (x, y, i) => boneM(K, x * 3, y * 3, sd + i, 0.3), sd + 5);
    drift(K, S, 0.05, 1.0, 0.17, sd, L); pool(K, S, -0.42, -0.1, 0.28, 0.1, sd, L); S.unlock(); K.ink(S, INK[L], 0.45); }
  function paintMenhir(K, S, v, L) { const sd = 23 + v * 5, R = K.R1(sd);
    contact(K, S, 0.85, 0.28, 0.6);
    const stone = (x, h, r, a, s0) => { prism(K, S, x, 0.04, r, r * 0.76, h, r * 0.75, a, (f, q, wt, tp) => { basaltM(K, q * 0.5 + s0, wt * h * 2, s0, false); const M = K.M; if (f) M.ao *= 0.8; if (tp) { M.r *= 1.1; M.g *= 1.1; M.b *= 1.15; }
      const vq = 0.22 * Math.sin(wt * 8 + s0) + 0.05, d = Math.abs(q - vq), d2 = Math.abs(q + 0.3 - 0.15 * Math.cos(wt * 11 + s0)); const k = Math.max(d < 0.05 && wt > 0.06 && wt < 0.8 ? 1 - d / 0.05 : 0, d2 < 0.03 && wt > 0.3 && wt < 0.6 ? (1 - d2 / 0.03) * 0.8 : 0);
      if (k > 0 && !tp) { M.r = lerp(M.r, 0.35, k); M.g = lerp(M.g, 0.9, k); M.b = lerp(M.b, 0.95, k); M.er = 0.14 * k; M.eg = 0.6 * k; M.eb = 0.68 * k; M.cc = 0.8; M.rg = 0.2; } }); S.unlock(); };
    if (!v) stone(0, 1.95, 0.36, 0.06, 1); else { stone(-0.3, 1.6, 0.3, -0.12, 2); stone(0.42, 1.0, 0.26, 0.24, 3); }
    cracks(S.c, R, 4, -0.4, 0.5, -1.6, -0.3, 0.3, 0.05);
    pebbles(K, S, 7, -0.8, 0.8, -0.06, 0.12, (x, y, i) => basaltM(K, x * 3, y * 3, sd + i, false), sd + 3);
    drift(K, S, 0, 0.82, 0.13, sd, L); pool(K, S, 0.32, -0.1, 0.3, 0.1, sd, L); S.unlock(); K.ink(S, INK[L], 0.5); }
  function paintSanddrift(K, S, v, L) { const sd = 27 + v * 3, R = K.R1(sd), dm = (dx, dy, ao, e, nz, wx, wy) => { dustM(K, wx, wy, sd, L); if (nz > 0.5) { K.M.r *= 1.06; K.M.g *= 1.05; } };
    contact(K, S, 1.15, 0.28, 0.35);
    lump(K, S, -0.05, -0.2, 1.08, 0.26, { amp: 0.1, fr: 1.4, sd, bump: 0.12, leaf: 10, flat: 0.9, mat: dm });
    lump(K, S, 0.22, -0.4, 0.62, 0.2, { amp: 0.12, fr: 1.6, sd: sd + 2, bump: 0.12, leaf: 10, flat: 0.6, mat: (dx, dy, ao, e, nz, wx, wy) => { dm(dx, dy, ao, e, nz, wx, wy); if (dx > 0.2 && dy < 0) K.M.ao *= 0.82; } }); S.unlock();
    // the wind's ripples across it
    { const c = S.c; c.save(); c.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 9; i++) { const y = -0.12 - i * 0.055, x0 = -1 + R() * 0.4, x1 = 0.6 + R() * 0.5;
      for (const [dd, col, a] of [[0.012, '70,34,24', 0.25], [0, '255,236,200', 0.3]]) { c.strokeStyle = `rgba(${col},${a})`; c.lineWidth = 0.014; c.beginPath(); c.moveTo(x0, y + dd); c.quadraticCurveTo((x0 + x1) / 2, y - 0.04 + dd, x1, y + 0.01 + dd); c.stroke(); } } c.restore(); }
    if (!v) { boneT(K, S, ptsQ(-0.62, -0.18, -0.72, -0.62, -0.42, -0.9, 8), 0.05, 0.03, sd, 1, 0.4); S.unlock(); for (let i = 0; i < 7; i++) { const x = 0.55 + i * 0.03; K.tube(S, ptsQ(x, -0.3, x + (i - 3) * 0.03, -0.5, x + (i - 3) * 0.08, -0.62 - R() * 0.12, 5), 0.01, 0.003, (t) => { const M = K.M; M.r = 0.78; M.g = 0.64; M.b = 0.4; M.rg = 0.8; M.ao *= 0.7 + 0.3 * t; }); } S.unlock(); }
    else { K.ball(S, 0.5, -0.5, 0.17, 0.14, (dx, dy) => boneM(K, dx + sd, dy, sd, 0.3)); S.unlock(); socket(S.c, 0.55, -0.52, 0.05, 0.045, null); boneT(K, S, [[-0.5, -0.25], [-0.15, -0.38]], 0.035, 0.03, sd + 2, 0.9, 0.3); S.unlock(); pool(K, S, 0.45, -0.38, 0.22, 0.07, sd, L); S.unlock(); }
    K.ink(S, INK[L], 0.3); }
  /* ---- the Rust Flats (noon) ---- */
  function paintMesarock(K, S, v, L) { const sd = 11 + v * 5, R = K.R1(sd * 7), rl = (dx, dy, ao, e, nz, wx, wy) => { redrockM(K, wx * 1.3 + sd, -wy, sd); if (nz > 0.55) { K.M.r *= 1.1; K.M.g *= 1.06; } if (dy > 0.55) K.M.ao *= 0.8; };
    contact(K, S, 1.2, 0.36, 0.55);
    if (!v) { // a butte: worn tiers, each rounded by the weather, the upper ones set back, a dark caprock
      const tiers = [[0.02, -1.8, 0.7, 0.14], [0.05, -1.45, 0.66, 0.36], [-0.05, -0.95, 0.84, 0.42], [0, -0.42, 0.98, 0.47]];
      tiers.forEach(([cx, cy, rx, ry], i) => { lump(K, S, cx, cy, rx, ry, { amp: 0.07, fr: 3.4, sd: sd + i * 3, bump: 0.3, leaf: 5, flat: 0.35, mat: i ? rl : (dx, dy, ao, e, nz, wx, wy) => { redrockM(K, wx + sd, 0.1, sd + 3); const M = K.M; M.r *= 0.62; M.g *= 0.5; M.b *= 0.5; if (nz > 0.4) { M.r *= 1.2; M.g *= 1.12; } } }); S.unlock(); }); }
    else { // a hoodoo: a waisted column of soft rock under a hard dark caprock
      K.rev(S, 0, 0, h => 0.44 - 0.16 * ss(0, 1.0, h) + 0.05 * ss(1.1, 1.45, h) + 0.025 * Math.sin(h * 11 + sd), 0, 1.48, { mat: (u, h) => redrockM(K, u * 1.2 + sd, h, sd), bump: 0.22, floorAO: 0.7 }); S.unlock();
      lump(K, S, 0.03, -1.47, 0.54, 0.17, { amp: 0.12, fr: 2.6, sd: sd + 3, bump: 0.6, leaf: 7, flat: 0.8, mat: (dx, dy, ao, e, nz, wx, wy) => { redrockM(K, wx + sd, 0.1, sd + 3); const M = K.M; M.r *= 0.6; M.g *= 0.48; M.b *= 0.48; if (nz > 0.4) { M.r *= 1.2; M.g *= 1.12; } } }); S.unlock(); }
    for (let i = 0; i < 6; i++) { const x = (i - 2.5) * 0.36 + (R() - 0.5) * 0.15, r = 0.08 + R() * 0.09; lump(K, S, x, -r * 0.55 + 0.05, r * 1.3, r, { amp: 0.28, fr: 3.4, sd: sd + i, bump: 0.7, leaf: 9, flat: 0.5, mat: (dx, dy, ao, e, nz, wx, wy) => redrockM(K, wx * 2, 0.3 + i * 0.17, sd + i) }); }
    S.unlock();
    if (!v) { for (const [x, h, r, a] of [[0.62, 0.42, 0.07, 0.35], [0.5, 0.3, 0.05, -0.25]]) prism(K, S, x, 0.03, r, r * 0.85, h, r * 1.4, a, (f, q, wt) => crystalM(K, PINKC, f, q, wt, 0.55)); S.unlock(); }
    const c = S.c; c.save(); c.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 4; i++) { const x = -0.6 + i * 0.4 + (R() - 0.5) * 0.15, y0 = -1.6 + R() * 0.5; c.strokeStyle = 'rgba(70,22,10,.14)'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + 0.05, -1.0, x - 0.03, -0.1); c.stroke(); c.strokeStyle = 'rgba(255,220,180,.12)'; c.lineWidth = 0.015; c.beginPath(); c.moveTo(x - 0.03, y0); c.quadraticCurveTo(x + 0.02, -1.0, x - 0.06, -0.1); c.stroke(); }
    const g = c.createLinearGradient(-1, -1.9, 0.6, -0.4); g.addColorStop(0, 'rgba(255,236,200,.18)'); g.addColorStop(1, 'rgba(255,236,200,0)'); c.fillStyle = g; c.fillRect(-1.3, -2.1, 2.6, 2); c.restore();
    cracks(c, R, 6, -0.8, 0.8, -1.6, -0.2, 0.35, 0.05);
    drift(K, S, 0, 1.15, 0.12, sd, L, 0.04); S.unlock(); K.ink(S, INK[L], 0.45); }
  // crystal clusters: [x, h, r, lean, back] (tiles); the pink crystals, the big outcrop, the small one
  const CRYS = { pinkcrystal: [[[-0.55, 0.5, 0.08, -0.72, 1], [0.56, 0.58, 0.09, 0.66, 1], [-0.3, 0.98, 0.13, -0.32, 0], [0.3, 1.12, 0.14, 0.3, 0], [0.02, 1.52, 0.17, 0.04, 0]],
      [[-0.5, 0.62, 0.09, -0.55, 1], [0.48, 0.45, 0.08, 0.8, 1], [0.24, 1.3, 0.16, 0.2, 0], [-0.18, 1.05, 0.14, -0.22, 0], [0.62, 0.8, 0.1, 0.45, 0]]],
    crystalout: [[[0.2, 0.9, 0.12, 0.15, 1], [-0.15, 1.15, 0.13, -0.12, 1], [-0.78, 0.8, 0.12, -0.62, 0], [0.82, 0.92, 0.13, 0.62, 0], [-0.42, 1.5, 0.18, -0.28, 0], [0.45, 1.72, 0.2, 0.3, 0], [0.0, 2.25, 0.25, 0.03, 0], [0.18, 0.5, 0.09, 0.9, 0]],
      [[0.12, 0.45, 0.08, 0.7, 1], [-0.3, 0.62, 0.1, -0.42, 0], [0.32, 0.72, 0.11, 0.42, 0], [0.0, 0.92, 0.14, 0.05, 0]]] };
  const CRYS_BY = { pinkcrystal: 0.03, crystalout: -0.16 };
  function crysTips(kind, v, m) { const L0 = CRYS[kind] && CRYS[kind][v % 2]; if (!L0) return []; const by = (kind === 'crystalout' && v % 2) ? -0.1 : CRYS_BY[kind]; return L0.map(([x, h, r, a]) => [(x + Math.sin(a) * (h + r * 1.3)) * m, by - Math.cos(a) * (h + r * 1.3), r]); }
  function crystals(K, S, kind, v, by, glow) { const list = CRYS[kind][v % 2];
    for (const [x, h, r, a, back] of list.slice().sort((p, q) => q[4] - p[4])) prism(K, S, x, by, r, r * 0.86, h, r * 1.35, a, (f, q, wt) => { crystalM(K, PINKC, f, q, wt, back ? glow * 0.7 : glow); if (back) K.M.ao *= 0.8; });
    S.unlock();
    // the light inside them: a bright core along each, refracted
    const c = S.c; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const [x, h, r, a] of list) { const x1 = x + Math.sin(a) * h * 0.92, y1 = by - Math.cos(a) * h * 0.92, g = c.createLinearGradient(x, by, x1, y1); g.addColorStop(0, 'rgba(255,120,210,0)'); g.addColorStop(0.5, 'rgba(255,170,230,.35)'); g.addColorStop(1, 'rgba(255,240,250,.55)'); c.strokeStyle = g; c.lineWidth = r * 0.45; c.beginPath(); c.moveTo(x, by); c.lineTo(x1, y1); c.stroke();
      c.strokeStyle = 'rgba(255,230,250,.35)'; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.48, by + Math.sin(a) * r * 0.48); c.lineTo(x1 + Math.cos(a) * r * 0.42, y1 + Math.sin(a) * r * 0.42); c.stroke(); }
    c.restore(); }
  const socketClay = (K, S, xs, sd, L, rock) => { for (const [x, y, rx, ry] of xs) lump(K, S, x, y, rx, ry, { amp: 0.22, fr: 3, sd: sd + x * 9, bump: 0.55, leaf: 12, flat: 0.5, mat: (dx, dy, ao, e, nz, wx, wy) => { if (rock) redrockM(K, wx * 2, 0.3 - wy, sd); else clayM(K, wx, wy, sd, 0.95); const cl = pcell(wx * 9, wy * 9, 64, sd | 0); if (cl.d2 - cl.d < 0.05) K.M.ao *= 0.55; } }); S.unlock(); };
  function paintCrystal(K, S, v, L) { const sd = 21 + v, R = K.R1(sd);
    contact(K, S, 0.75, 0.25, 0.5); halo(S.c, 0, -0.8, 1.0, PINK, 0.2);
    socketClay(K, S, [[0, -0.1, 0.55, 0.16]], sd, L);
    crystals(K, S, 'pinkcrystal', v, 0.0, 0.6);
    socketClay(K, S, [[-0.42, -0.04, 0.26, 0.12], [0.4, -0.02, 0.24, 0.11], [0.02, 0.02, 0.3, 0.1]], sd + 2, L);
    for (const [x, y] of crysTips('pinkcrystal', v, 1)) K.glint(S.c, x, y + 0.04, 0.09, 0.7);
    pebbles(K, S, 4, -0.8, 0.8, 0.02, 0.12, (x, y, i) => crystalM(K, PINKC, 0, 0.2, 0.5, 0.4), sd + 4); void R;
    K.ink(S, INK[L], 0.4); }
  function paintCrystalout(K, S, v, L) { const sd = 35 + v * 3;
    contact(K, S, v ? 0.7 : 1.15, 0.3, 0.55); halo(S.c, 0, v ? -0.5 : -1.1, v ? 0.8 : 1.5, PINK, 0.2);
    socketClay(K, S, v ? [[0, -0.18, 0.55, 0.22]] : [[0, -0.28, 0.98, 0.34], [-0.45, -0.5, 0.45, 0.22]], sd, L, true);
    crystals(K, S, 'crystalout', v, v ? -0.1 : -0.16, 0.62);
    socketClay(K, S, v ? [[-0.35, -0.03, 0.22, 0.1], [0.32, -0.02, 0.22, 0.1]] : [[-0.6, -0.05, 0.35, 0.14], [0.55, -0.04, 0.38, 0.14], [0.0, 0.0, 0.42, 0.12]], sd + 5, L, true);
    for (const [x, y] of crysTips('crystalout', v, 1)) K.glint(S.c, x, y + 0.04, 0.1, 0.7);
    K.ink(S, INK[L], 0.42); }
  function paintClaypillar(K, S, v, L) { const sd = 41 + v * 3, R = K.R1(sd);
    contact(K, S, 0.85, 0.28, 0.55);
    const col = (x, h, r, s0) => { K.rev(S, x, 0, hh2 => r * (1 + 0.1 * Math.sin(hh2 * 3.2 + s0) - 0.18 * ss(h * 0.72, h, hh2)), 0, h, { top: true, bump: 0.3,
      mat: (u, hh2) => { clayM(K, u + s0, hh2, s0, 1); const cl = pcell(u * 3.4 + s0, hh2 * 3.4, 64, s0), gp = cl.d2 - cl.d; if (gp < 0.07) { const k = ss(0.07, 0.015, gp); K.M.r = lerp(K.M.r, 0.3, k); K.M.g = lerp(K.M.g, 0.12, k); K.M.b = lerp(K.M.b, 0.07, k); K.M.ao *= 1 - k * 0.6; } else if (gp < 0.16) { K.M.r *= 1.08; K.M.g *= 1.09; K.M.b *= 1.08; } },
      capMat: (x2, h2, a, b, c2, d, ey) => { clayM(K, x2 * 3 + s0, (ey || 0) * 2, s0, 1.12); } }); S.unlock(); };
    if (!v) col(0, 1.75, 0.36, 1); else { col(-0.32, 1.32, 0.3, 2); col(0.38, 0.85, 0.26, 3); }
    cracks(S.c, R, 6, -0.4, 0.4, -1.6, -0.2, 0.35, 0.05);
    pebbles(K, S, 6, -0.8, 0.8, -0.05, 0.12, (x, y, i) => clayM(K, x * 3, y * 3, sd + i, 0.9), sd + 2);
    drift(K, S, 0, 0.85, 0.14, sd, L); S.unlock(); K.ink(S, INK[L], 0.45); }
  function rustM(K, u, v, sd) { const { M, vn } = K, w = vn(u * 7 + sd, v * 7), p = vn(u * 31, v * 31 + sd), sp = ss(0.55, 0.8, vn(u * 3 + sd, v * 3 + 2));
    M.r = lerp(0.42, 0.72, sp) * (0.8 + 0.3 * w); M.g = lerp(0.2, 0.36, sp) * (0.8 + 0.3 * w); M.b = lerp(0.12, 0.14, sp) * (0.8 + 0.3 * w); M.rg = 0.85; if (p > 0.75) M.ao *= 1 - (p - 0.75) * 2;
    if (vn(u * 13 + 4, v * 2) > 0.86) { M.mt = 0.7; M.r = 0.3; M.g = 0.28; M.b = 0.28; M.fr = 0.55; M.fg = 0.5; M.fb = 0.46; M.rg = 0.35; } }
  function paintRelic(K, S, v, L) { const sd = 45 + v * 3, R = K.R1(sd);
    contact(K, S, 1.0, 0.3, 0.55);
    if (!v) { // a great toothed ring of some machine, half sunk in the clay, its spokes and hub
      const cx = 0, cy = -0.6, Rr = 0.62, ring = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU; ring.push([cx + Math.cos(a) * Rr, cy + Math.sin(a) * Rr]); }
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.3; K.tube(S, [[cx, cy], [cx + Math.cos(a) * Rr, cy + Math.sin(a) * Rr]], 0.045, 0.04, (t, s) => { rustM(K, s + i, t * 3, sd + i); K.M.ao *= 0.8; }); } S.unlock();
      K.tube(S, ring, 0.075, 0.075, (t, s) => rustM(K, s * 0.5 + t * 9, t * 9, sd)); S.unlock();
      for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; K.tube(S, [[cx + Math.cos(a) * (Rr + 0.05), cy + Math.sin(a) * (Rr + 0.05)], [cx + Math.cos(a) * (Rr + 0.15), cy + Math.sin(a) * (Rr + 0.15)]], 0.045, 0.035, (t, s) => rustM(K, s + i, t, sd + i)); } S.unlock();
      K.ball(S, cx, cy, 0.13, 0.13, (dx, dy) => rustM(K, dx, dy, sd + 7)); S.unlock(); socket(S.c, cx, cy, 0.05, 0.05, null); }
    else { // a toppled riveted pipe, its open mouth dark
      K.tube(S, [[-0.95, -0.3], [0.75, -0.4]], 0.3, 0.3, (t, s) => { rustM(K, s, t * 6, sd); if (Math.abs(((t * 6) % 1) - 0.5) > 0.47) K.M.ao *= 0.7; }); S.unlock();
      for (let k = 0; k < 6; k++) for (const s0 of [-0.12, -0.24, -0.36]) K.ball(S, -0.85 + k * 0.29 + 0.14, -0.33 + s0 * 0.4 - k * 0.006, 0.022, 0.022, (dx, dy) => rustM(K, dx + k, dy, sd + 3)); S.unlock();
      socket(S.c, 0.75, -0.4, 0.11, 0.28, 'rgba(255,190,140,.3)'); }
    cracks(S.c, R, 5, -0.7, 0.7, -1.2, -0.2, 0.35, 0.04);
    drift(K, S, 0, 1.0, 0.2, sd, L, 0.0); pebbles(K, S, 5, -0.9, 0.9, -0.02, 0.12, (x, y, i) => redrockM(K, x * 2, 0.3 + i * 0.2, sd + i), sd + 4); K.ink(S, INK[L], 0.45); }
  function paintTumbleweed(K, S, v, L) { const sd = 49 + v * 3, R = K.R1(sd), cy = -0.44 - v * 0.04, rad = 0.42 - v * 0.06, segs = [];
    contact(K, S, 0.55, 0.18, 0.45);
    for (let i = 0; i < 30; i++) { const th = R() * TAU, ph = Math.acos(2 * R() - 1), ux = Math.sin(ph) * Math.cos(th), uy = Math.sin(ph) * Math.sin(th), uz = Math.cos(ph); let ax = 1, ay = 0, az = 0; if (Math.abs(ux) > 0.9) { ax = 0; ay = 1; }
      let px = uy * az - uz * ay, py = uz * ax - ux * az, pz = ux * ay - uy * ax; const pl = Math.hypot(px, py, pz); px /= pl; py /= pl; pz /= pl; const qx = uy * pz - uz * py, qy = uz * px - ux * pz, qz = ux * py - uy * px, a0 = R() * TAU, span = 1.5 + R() * 2.5, rr = rad * (0.75 + R() * 0.3);
      let prev = null; for (let k = 0; k <= 10; k++) { const a = a0 + span * k / 10, X3 = (Math.cos(a) * px + Math.sin(a) * qx) * rr, Y3 = (Math.cos(a) * py + Math.sin(a) * qy) * rr, Z3 = (Math.cos(a) * pz + Math.sin(a) * qz) * rr, pt = [X3, cy - Z3 * 0.95, Y3]; if (prev) segs.push([prev, pt]); prev = pt; } }
    for (const back of [true, false]) { for (const [a, b] of segs) { const d = (a[2] + b[2]) / 2; if ((d < 0) !== back) continue; K.tube(S, [[a[0], a[1]], [b[0], b[1]]], 0.013, 0.011, (t, s) => { const M = K.M; M.r = 0.66; M.g = 0.54; M.b = 0.36; M.rg = 0.75; M.ao *= back ? 0.55 : 0.85 + 0.15 * (d / rad); }); } S.unlock(); }
    K.ink(S, INK[L], 0.3); }
  /* ---- the Moonlit Dunes (night) ---- */
  function paintNightrock(K, S, v, L) { const sd = 31 + v * 3, R = K.R1(sd), nm = (dx, dy, ao, e, nz, wx, wy) => { nstoneM(K, wx * 1.5, wy * 1.5, sd); if (nz > 0.45 && dx < 0.2) { K.M.r *= 1.12; K.M.g *= 1.15; K.M.b *= 1.2; } };
    contact(K, S, v ? 0.95 : 0.85, 0.3, 0.6);
    if (!v) { lump(K, S, -0.02, -0.48, 0.64, 0.5, { amp: 0.13, fr: 1.5, sd, bump: 0.55, leaf: 4, mat: nm }); lump(K, S, 0.62, -0.14, 0.24, 0.17, { amp: 0.14, fr: 1.8, sd: sd + 2, bump: 0.5, leaf: 6, mat: nm }); }
    else { lump(K, S, -0.08, -0.38, 0.76, 0.38, { amp: 0.12, fr: 1.4, sd, bump: 0.5, leaf: 4, mat: nm }); lump(K, S, 0.14, -0.92, 0.44, 0.33, { amp: 0.14, fr: 1.6, sd: sd + 4, bump: 0.5, leaf: 5, mat: nm }); }
    S.unlock(); cracks(S.c, R, 5, -0.5, 0.5, -1.1, -0.2, 0.4, 0.05);
    pebbles(K, S, 7, -0.95, 0.95, -0.04, 0.14, (x, y, i) => nstoneM(K, x * 3, y * 3, sd + i, 0.85), sd + 6);
    drift(K, S, 0, v ? 0.98 : 0.88, 0.12, sd, L); pool(K, S, -0.45, -0.1, 0.25, 0.08, sd, L); S.unlock();
    // the moon along the upper left edges
    const c = S.c; c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createRadialGradient(-0.55, -1.2, 0.1, -0.3, -0.8, 0.9); g.addColorStop(0, 'rgba(210,232,255,.4)'); g.addColorStop(1, 'rgba(210,232,255,0)'); c.fillStyle = g; c.fillRect(-1.2, -1.6, 2.4, 1.6); c.restore();
    K.ink(S, INK[L], 0.45); }
  function paintGravestone(K, S, v, L) { const sd = 61 + v * 3, R = K.R1(sd), c = S.c;
    contact(K, S, 0.9, 0.28, 0.6);
    const slab = (x, hw, h, s0, broken) => { K.rbox(S, x, 0, hw, 0.12, 0, h, 0.05, (f, u, vv) => { nstoneM(K, u * 3 + s0, vv * 3, s0, 0.82); if (f === 't') { K.M.r *= 1.1; K.M.g *= 1.12; K.M.b *= 1.18; } if (u < -hw + 0.06) { K.M.r *= 1.25; K.M.g *= 1.3; K.M.b *= 1.35; } }); S.unlock();
      const yTop = -(h + 0.12 * 0.34), yc = yTop + hw * 0.9; c.save(); c.globalCompositeOperation = 'destination-out';
      if (!broken) { c.beginPath(); c.moveTo(x - hw - 0.05, yTop - 0.2); c.lineTo(x + hw + 0.05, yTop - 0.2); c.lineTo(x + hw + 0.05, yc); c.arc(x, yc, hw, 0, Math.PI, true); c.lineTo(x - hw - 0.05, yc); c.closePath(); c.fill(); }
      else { c.beginPath(); c.moveTo(x - hw - 0.05, yTop - 0.2); c.lineTo(x + hw + 0.05, yTop - 0.2); c.lineTo(x + hw + 0.05, yTop + 0.28); for (let k = 0; k <= 6; k++) c.lineTo(x + hw - k * hw / 3, yTop + 0.1 + (k % 2 ? 0.12 : 0) + R() * 0.06); c.lineTo(x - hw - 0.05, yTop + 0.1); c.closePath(); c.fill(); }
      c.restore();
      // a worn glyph cut in its face (a circle and the jaw's three lines), lichen
      c.save(); c.globalCompositeOperation = 'source-atop'; const gy = yTop + h * 0.45; for (const [col, dd] of [['rgba(4,6,14,.55)', 0], ['rgba(190,215,255,.22)', 0.012]]) { c.strokeStyle = col; c.lineWidth = 0.022; c.beginPath(); c.arc(x, gy + dd, hw * 0.32, 0, TAU); c.moveTo(x - hw * 0.4, gy + hw * 0.6 + dd); c.lineTo(x + hw * 0.4, gy + hw * 0.6 + dd); c.moveTo(x - hw * 0.28, gy + hw * 0.85 + dd); c.lineTo(x + hw * 0.28, gy + hw * 0.85 + dd); c.stroke(); }
      for (let i = 0; i < 9; i++) { c.fillStyle = `rgba(150,200,140,${0.2 + R() * 0.25})`; c.beginPath(); c.arc(x + (R() - 0.5) * hw * 1.6, yTop + h * (0.6 + R() * 0.4), 0.02 + R() * 0.03, 0, TAU); c.fill(); } c.restore(); };
    if (!v) { slab(0, 0.38, 1.4, 1); pebbles(K, S, 3, 0.45, 0.85, -0.02, 0.1, (x, y, i) => nstoneM(K, x * 3, y * 3, sd + i, 0.8), sd + 1); }
    else { slab(-0.38, 0.3, 1.12, 2); slab(0.42, 0.32, 0.62, 3, true); }
    cracks(c, R, 4, -0.6, 0.6, -1.2, -0.2, 0.4, 0.05);
    drift(K, S, 0, 0.9, 0.13, sd, L); pool(K, S, v ? -0.38 : 0, -0.06, 0.32, 0.08, sd, L); S.unlock(); K.ink(S, INK[L], 0.5); }
  function paintBonecairn(K, S, v, L) { const sd = 65 + v * 3, R = K.R1(sd), nm = (dx, dy, ao, e, nz, wx, wy) => nstoneM(K, wx * 2, wy * 2, sd, 0.85);
    contact(K, S, 0.75, 0.26, 0.6);
    const bone = (x0, y0, x1, y1, r, s0) => { boneT(K, S, [[x0, y0], [x1, y1]], r, r * 0.85, s0, 1, 0.2); S.unlock(); for (const [x, y] of [[x0, y0], [x1, y1]]) for (const k of [-1, 1]) K.ball(S, x + k * r * 0.8, y, r * 1.1, r * 1.0, (dx, dy) => boneM(K, dx + s0, dy, s0, 0.1)); S.unlock(); };
    bone(-0.42, -0.2, 0.08, -1.22, 0.045, 1); bone(0.45, -0.22, -0.06, -1.18, 0.045, 2);
    lump(K, S, -0.36, -0.22, 0.32, 0.22, { amp: 0.14, fr: 1.8, sd, bump: 0.5, leaf: 6, mat: nm }); lump(K, S, 0.36, -0.2, 0.3, 0.2, { amp: 0.14, fr: 1.8, sd: sd + 1, bump: 0.5, leaf: 6, mat: nm }); lump(K, S, 0.0, -0.34, 0.34, 0.26, { amp: 0.14, fr: 1.8, sd: sd + 2, bump: 0.5, leaf: 6, mat: nm }); S.unlock();
    bone(-0.3, -0.62, 0.32, -0.72, 0.04, 3); lump(K, S, 0.02, -0.82, 0.25, 0.17, { amp: 0.14, fr: 1.8, sd: sd + 3, bump: 0.5, leaf: 7, mat: nm }); S.unlock();
    if (v) bone(-0.25, -0.98, 0.28, -1.02, 0.035, 4);
    const sx = 0.02, sy = -1.24; K.ball(S, sx, sy, 0.21, 0.19, (dx, dy) => boneM(K, dx * 0.5 + 9, dy * 0.5, 9, 0)); lump(K, S, sx, sy + 0.15, 0.15, 0.08, { amp: 0.05, fr: 1.4, sd, bump: 0.2, leaf: 8, mat: (dx, dy, ao, e, nz, wx, wy) => boneM(K, wx * 2, wy * 2, 10, 0.15) }); S.unlock();
    const c = S.c; socket(c, sx - 0.075, sy + 0.02, 0.055, 0.062, 'rgba(255,250,235,.3)'); socket(c, sx + 0.075, sy + 0.02, 0.055, 0.062, 'rgba(255,250,235,.3)'); c.save(); for (let i = 0; i < 4; i++) { c.fillStyle = '#F4EEDC'; c.fillRect(sx - 0.075 + i * 0.04, sy + 0.12, 0.03, 0.04); } c.restore();
    cracks(c, R, 5, -0.4, 0.4, -1.3, -0.2, 0.4, 0.04);
    drift(K, S, 0, 0.75, 0.11, sd, L); S.unlock(); K.ink(S, INK[L], 0.45); }
  const SHROOMS = [[[-0.36, 0.72, 0.24], [0.26, 1.02, 0.3], [0.0, 0.48, 0.17], [0.56, 0.44, 0.14], [-0.66, 0.34, 0.12]], [[-0.22, 0.86, 0.27], [0.32, 0.6, 0.2], [0.62, 0.32, 0.12], [-0.6, 0.42, 0.15], [0.08, 0.36, 0.12]]];
  const SHCOL = [[0.45, 1.0, 0.42], [0.36, 0.95, 0.8]];
  function paintGlowshroom(K, S, v, L) { const sd = 69 + v * 3;
    contact(K, S, 0.85, 0.28, 0.55);
    lump(K, S, 0, -0.08, 0.78, 0.16, { amp: 0.2, fr: 3, sd, bump: 0.6, leaf: 18, flat: 0.6, mat: (dx, dy, ao, e, nz, wx, wy) => { nstoneM(K, wx * 3, wy * 3, sd, 0.6); const M = K.M; M.g *= 1.1; } }); S.unlock();
    for (const [x, h, r] of SHROOMS[v % 2].slice().sort((a, b) => a[1] - b[1])) { const ci = Math.round(x * 10 + h * 7) & 1, col = SHCOL[ci];
      K.rev(S, x, 0, hh2 => 0.05 + 0.025 * Math.max(0, 1 - hh2 / 0.15) - 0.01 * (hh2 / h), 0, h - 0.03, { mat: (u, hh2) => { const M = K.M; M.r = 0.78; M.g = 0.82; M.b = 0.8; M.rg = 0.6; M.er = col[0] * 0.05; M.eg = col[1] * 0.08; M.eb = col[2] * 0.06; } }); S.unlock();
      halo(S.c, x, -h, r * 1.6, ci ? '#62E6D0' : GREEN, 0.35);
      K.ball(S, x, -h + 0.02, r * 0.94, r * 0.24, (dx, dy) => { const M = K.M, g2 = Math.abs(Math.sin(Math.atan2(dy, dx) * 14)); M.r = col[0] * 0.5; M.g = col[1] * 0.5; M.b = col[2] * 0.5; M.er = col[0] * (0.55 + 0.4 * g2); M.eg = col[1] * (0.55 + 0.4 * g2); M.eb = col[2] * (0.55 + 0.4 * g2); M.rg = 0.6; }); S.unlock();
      K.rev(S, x, -h, hh2 => r * Math.sqrt(Math.max(0, 1 - Math.pow(hh2 / (r * 0.7), 2.2))), 0, r * 0.7, { floorAO: 0, mat: (u, hh2) => { const M = K.M, e = hh2 / (r * 0.7), cl = pcell(u * 5 + x * 3, hh2 * 6, 64, 9); M.r = col[0] * 0.55; M.g = col[1] * 0.6; M.b = col[2] * 0.55; M.rg = 0.32; M.cc = 0.6; M.er = col[0] * 0.25 * (1 - e); M.eg = col[1] * 0.3 * (1 - e); M.eb = col[2] * 0.25 * (1 - e); if (cl.d < 0.2) { M.r = 0.9; M.g = 1; M.b = 0.9; M.er += 0.15; M.eg += 0.2; M.eb += 0.15; } } }); S.unlock();
      K.glint(S.c, x - r * 0.4, -h - r * 0.42, r * 0.35, 0.5); }
    drift(K, S, 0, 0.8, 0.09, sd, L, 0.04); S.unlock(); K.ink(S, INK[L], 0.4); }
  function deadBranches(K, S, R, sd, roots) { const br = (x, y, a, len, r, d) => { const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, mx = (x + x2) / 2 + (R() - 0.5) * len * 0.3, my = (y + y2) / 2 + (R() - 0.5) * len * 0.2;
      K.tube(S, [[x, y], [mx, my], [x2, y2]], r, r * 0.6, (t, s) => { deadwoodM(K, t * len * 3 + d, s, sd + x * 5); if (Math.abs(Math.sin(t * 20 + s * 3)) < 0.1) K.M.ao *= 0.8; });
      if (d > 0) { br(x2, y2, a - 0.42 - R() * 0.3, len * 0.68, r * 0.62, d - 1); br(x2, y2, a + 0.3 + R() * 0.3, len * 0.64, r * 0.6, d - 1); if (R() < 0.4) br(mx, my, a + (R() < 0.5 ? -1 : 1) * (0.7 + R() * 0.3), len * 0.45, r * 0.5, d - 1); } else if (R() < 0.5) K.ball(S, x2, y2, r * 1.6, r * 1.4, () => { const M = K.M; M.r = 0.5; M.g = 0.42; M.b = 0.36; M.rg = 0.7; }); };
    return br; }
  function paintShrub(K, S, v, L) { const R = K.R1(41 + v * 13), sd = 41 + v;
    contact(K, S, 0.6, 0.2, 0.5); const br = deadBranches(K, S, R, sd);
    br(0, 0, -Math.PI / 2 - 0.5 - v * 0.1, 0.42, 0.05, 3); br(0.04, 0, -Math.PI / 2 + 0.42, 0.4, 0.048, 3); br(0.02, 0, -Math.PI / 2 + 0.02, 0.52, 0.06, 3); br(-0.04, 0, -Math.PI / 2 - 0.15, 0.34, 0.04, 2); S.unlock();
    pebbles(K, S, 4, -0.6, 0.6, -0.03, 0.1, (x, y, i) => nstoneM(K, x * 3, y * 3, sd + i, 0.8), sd + 2);
    drift(K, S, 0, 0.58, 0.11, sd, L); pool(K, S, 0.2, -0.06, 0.2, 0.06, sd, L); S.unlock(); K.ink(S, INK[L], 0.4); }
  function paintDeadtree(K, S, v, L) { const R = K.R1(73 + v * 11), sd = 73 + v, sg = v ? -1 : 1;
    contact(K, S, 1.0, 0.3, 0.55);
    for (const [a, l] of [[0.25, 0.55], [Math.PI - 0.3, 0.6], [0.9, 0.35], [Math.PI - 1.0, 0.4]]) K.tube(S, ptsQ(0, -0.1, Math.cos(a) * l * 0.5, -0.05, Math.cos(a) * l, 0.05, 6), 0.08, 0.02, (t, s) => deadwoodM(K, t * 3, s, sd)); S.unlock();
    K.tube(S, ptsQ(0, 0.02, 0.22 * sg, -1.1, -0.06 * sg, -2.0, 14), 0.2, 0.1, (t, s) => { deadwoodM(K, t * 8, s + Math.sin(t * 9) * 0.5, sd); if (Math.abs(Math.sin(t * 26 + s * 2)) < 0.12) K.M.ao *= 0.75; }); S.unlock();
    socket(S.c, 0.12 * sg, -0.95, 0.06, 0.09, 'rgba(200,215,255,.25)');
    const br = deadBranches(K, S, R, sd); br(-0.06 * sg, -1.95, -Math.PI / 2 - 0.55 * sg, 0.7, 0.085, 3); br(-0.04 * sg, -1.9, -Math.PI / 2 + 0.5 * sg, 0.6, 0.075, 3); br(0.16 * sg, -1.35, -Math.PI / 2 + 1.0 * sg, 0.55, 0.06, 2); br(0.1 * sg, -1.6, -Math.PI / 2 - 1.1 * sg, 0.5, 0.055, 2); S.unlock();
    drift(K, S, 0, 0.85, 0.13, sd, L); S.unlock(); K.ink(S, INK[L], 0.45); }
  function paintSkullpile(K, S, v, L) { const sd = 51 + v * 7, R = K.R1(sd);
    contact(K, S, 0.85, 0.28, 0.55);
    const bone = (x0, y0, x1, y1, r, s0) => { boneT(K, S, [[x0, y0], [x1, y1]], r, r * 0.88, s0, 1, 0.15); S.unlock(); const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * r * 0.9, ny = Math.cos(a) * r * 0.9;
      for (const [x, y] of [[x0, y0], [x1, y1]]) for (const k of [-1, 1]) K.ball(S, x + nx * k, y + ny * k, r * 1.05, r * 1.05, (dx, dy) => boneM(K, dx + s0, dy, s0, 0.1)); S.unlock(); };
    for (let i = 0; i < 4; i++) boneT(K, S, ptsQ(-0.5 + i * 0.12, -0.1, -0.45 + i * 0.12, -0.75 + Math.abs(i - 1.5) * 0.08, -0.15 + i * 0.12, -0.6, 10), 0.028, 0.02, 6 + i, 0.7, 0.1); S.unlock();
    bone(-0.68, -0.08, 0.2, -0.22, 0.045, 1); bone(-0.1, -0.3, 0.68, -0.06, 0.042, 2); bone(-0.45, -0.34, 0.12, -0.05, 0.038, 3); bone(0.3, -0.38, 0.72, -0.24, 0.035, 4); if (v) bone(-0.75, -0.26, -0.32, -0.04, 0.035, 5);
    pool(K, S, -0.25, -0.12, 0.25, 0.07, sd, L); S.unlock();
    // the skulls: a small one fallen to the side, the big one on top
    const one = (sx, sy, r) => { K.ball(S, sx, sy, r, r * 0.93, (dx, dy) => boneM(K, dx * 0.5 + 9, dy * 0.5, 9, 0)); lump(K, S, sx, sy + r * 0.75, r * 0.7, r * 0.37, { amp: 0.05, fr: 1.4, sd, bump: 0.2, leaf: 8, mat: (dx, dy, ao, e, nz, wx, wy) => boneM(K, wx * 2, wy * 2, 10, 0.15) }); S.unlock();
      const c = S.c; socket(c, sx - r * 0.37, sy + r * 0.07, r * 0.27, r * 0.3, 'rgba(255,250,235,.3)'); socket(c, sx + r * 0.37, sy + r * 0.07, r * 0.27, r * 0.3, 'rgba(255,250,235,.3)');
      c.save(); c.fillStyle = 'rgba(10,8,14,.9)'; c.beginPath(); c.moveTo(sx - r * 0.1, sy + r * 0.52); c.lineTo(sx + r * 0.1, sy + r * 0.52); c.lineTo(sx, sy + r * 0.33); c.closePath(); c.fill(); for (let i = 0; i < 4; i++) { c.fillStyle = '#F4EEDC'; c.fillRect(sx - r * 0.37 + i * r * 0.19, sy + r * 0.63, r * 0.15, r * 0.19); } c.restore(); K.glint(c, sx - r * 0.45, sy - r * 0.55, r * 0.3, 0.5); };
    one(-0.55, -0.22, 0.16); const sx = v ? 0.12 : 0.02; one(sx, -0.47, 0.27);
    cracks(S.c, R, 6, -0.4, 0.4, -0.7, -0.3, 0.45, 0.04);
    drift(K, S, 0, 0.82, 0.1, sd, L); S.unlock(); K.ink(S, INK[L], 0.45); }

  /* ======================= the pictures ======================= */
  const DEF = {
    dunerock: { box: v => v ? [-1.4, -1.5, 1.4, 0.42] : [-1.15, -1.8, 1.15, 0.42], paint: paintDunerock, mat: { mat: 'stone', cols: ['#C9924F', '#7A5230', '#F0D29A'] }, el: 'gold' },
    bones: { box: v => v ? [-1.4, -1.5, 1.4, 0.4] : [-1.3, -1.45, 1.3, 0.4], paint: paintBones, mat: { mat: 'bone' }, el: 'shadow' },
    ribarch: { box: () => [-1.5, -2.75, 1.5, 0.42], paint: paintRibarch, mat: { mat: 'bone' }, el: 'shadow' },
    jawtooth: { box: () => [-1.15, -2.85, 1.15, 0.42], paint: paintJawtooth, mat: { mat: 'bone' }, el: 'shadow' },
    menhir: { box: () => [-0.95, -2.55, 0.95, 0.42], paint: paintMenhir, mat: { mat: 'stone', cols: ['#2E2A34', '#141218', '#62BFC9'] }, el: 'prism' },
    sanddrift: { box: () => [-1.3, -1.0, 1.3, 0.4], paint: paintSanddrift, mat: { mat: 'cloud', cols: ['#D9B07A', '#B08050', '#F0D8A8'] }, el: 'gold' },
    mesarock: { box: v => v ? [-1.3, -1.95, 1.3, 0.44] : [-1.3, -2.05, 1.3, 0.44], paint: paintMesarock, mat: { mat: 'stone', cols: ['#C4602E', '#7E321A', '#F2B27A'] }, el: 'gold' },
    pinkcrystal: { box: () => [-1.05, -2.0, 1.05, 0.4], paint: paintCrystal, mat: { mat: 'crystal', cols: ['#FF7FD0', '#B0257E', '#FFE0F4'], hot: '#FF8FD8' }, el: 'prism' },
    crystalout: { box: v => v ? [-0.95, -1.35, 0.95, 0.4] : [-1.35, -2.75, 1.35, 0.42], paint: paintCrystalout, mat: { mat: 'crystal', cols: ['#FF7FD0', '#B0257E', '#FFE0F4'], hot: '#FF8FD8', mix: 'stone' }, el: 'prism' },
    claypillar: { box: () => [-0.95, -2.1, 0.95, 0.42], paint: paintClaypillar, mat: { mat: 'pottery', cols: ['#C8743A', '#7A3A1A', '#F0B080'] }, el: 'gold' },
    relic: { box: v => v ? [-1.3, -0.9, 1.3, 0.42] : [-1.1, -1.5, 1.1, 0.42], paint: paintRelic, mat: { mat: 'iron', cols: ['#8A4A24', '#3A1E10', '#C8783C'] }, el: 'spark' },
    tumbleweed: { box: () => [-0.65, -1.0, 0.65, 0.3], paint: paintTumbleweed, mat: { mat: 'wood', cols: ['#A88A5C', '#5E4A30', '#D8C090'] }, el: 'leaf' },
    nightrock: { box: v => v ? [-1.1, -1.4, 1.1, 0.42] : [-1.05, -1.15, 1.05, 0.42], paint: paintNightrock, mat: { mat: 'stone', cols: ['#4A5C88', '#26304C', '#9AB0D8'] }, el: 'gold' },
    gravestone: { box: () => [-0.95, -1.75, 0.95, 0.4], paint: paintGravestone, mat: { mat: 'stone', cols: ['#4A5470', '#22283A', '#9AA8C8'] }, el: 'shadow' },
    bonecairn: { box: () => [-0.85, -1.6, 0.85, 0.4], paint: paintBonecairn, mat: { mat: 'bone', mix: 'stone' }, el: 'shadow' },
    glowshroom: { box: () => [-1.0, -1.45, 1.0, 0.4], paint: paintGlowshroom, mat: { mat: 'foliage', cols: ['#4AC86A', '#1E5A3A', '#B8FFB0'] }, el: 'leaf' },
    deadtree: { box: () => [-1.55, -3.2, 1.55, 0.42], paint: paintDeadtree, mat: { mat: 'wood', cols: ['#5A5664', '#2A2830', '#9A94A4'] }, el: 'leaf' },
    deadshrub: { box: () => [-0.95, -1.5, 0.95, 0.38], paint: paintShrub, mat: { mat: 'wood', cols: ['#4E4A56', '#26232C', '#8A8494'] }, el: 'leaf' },
    skullpile: { box: () => [-0.95, -1.0, 0.95, 0.38], paint: paintSkullpile, mat: { mat: 'bone' }, el: 'shadow' },
  };
  const KINDS = Object.keys(DEF);
  // (kinds new in v433: with the painter off they never spawn (the land's old list is used); a stray one shows this old art)
  const NEWK = { ribarch: 'bones', jawtooth: 'bones', menhir: 'dunerock', sanddrift: 'dunerock', crystalout: 'pinkcrystal', claypillar: 'mesarock', relic: 'mesarock', tumbleweed: 'deadshrub', gravestone: 'nightrock', bonecairn: 'skullpile', glowshroom: 'deadshrub', deadtree: 'deadshrub' };

  /* ======================= the puzzles' pieces ======================= */
  function paintRibtip(K, S, v) { const sg = v ? -1 : 1, sd = 61;   // (v 0: the end of a rib hanging from the jaw, its knuckle at 0, 0; v 1: one standing up out of the sand)
    K.tube(S, [[0, -0.85 * sg], [0, -0.3 * sg]], 0.42, 0.37, (t, s) => ribM(K, s, -0.85 * sg + t * 0.55 * sg, 0)); S.unlock();
    K.ball(S, 0, -0.18 * sg, 0.39, 0.24, (dx, dy) => ribM(K, dx, -0.18 * sg + dy * 0.2, 0)); S.unlock();
    K.ball(S, 0.0, -0.02 * sg, 0.27, 0.13, (dx, dy) => { ribM(K, dx + 2, dy * 0.2, 0); K.M.ao *= 0.92; }); S.unlock();
    const c = S.c; c.save(); c.strokeStyle = 'rgba(70,46,30,.45)'; c.lineWidth = 0.02; c.beginPath(); c.moveTo(-0.3, -0.2 * sg); c.quadraticCurveTo(0, -0.08 * sg, 0.3, -0.2 * sg); c.stroke(); c.restore(); void sd;
    K.ink(S, INK.dusk, 0.5); }
  function paintCairn(K, S) { const sd = 71; contact(K, S, 0.42, 0.14, 0.5);
    lump(K, S, 0, -0.13, 0.33, 0.14, { amp: 0.12, fr: 1.8, sd, bump: 0.4, leaf: 8, flat: 0.4, mat: (dx, dy, ao, e, nz, wx, wy) => basaltM(K, wx * 2, wy * 2, sd, false) });
    lump(K, S, 0.03, -0.37, 0.25, 0.12, { amp: 0.12, fr: 1.8, sd: sd + 1, bump: 0.4, leaf: 8, flat: 0.4, mat: (dx, dy, ao, e, nz, wx, wy) => sandstoneM(K, wx, -wy, sd) });
    lump(K, S, -0.01, -0.57, 0.16, 0.1, { amp: 0.12, fr: 1.8, sd: sd + 2, bump: 0.3, leaf: 9, mat: (dx, dy, ao, e, nz, wx, wy) => boneM(K, wx * 2, wy * 2, sd, 0.2) }); S.unlock(); K.ink(S, INK.dusk, 0.5); }
  function paintAmber(K, S) { halo(S.c, 0, -0.12, 0.36, AMBER, 0.3);   // (its waist at 0, 0: the picture is laid with its waist on the shard's place)
    prism(K, S, 0, 0, 0.13, 0.12, 0.3, 0.2, 0.12, (f, q, wt) => crystalM(K, AMBC, f, q, wt, 0.7)); S.unlock();
    prism(K, S, 0, 0, 0.13, 0.12, 0.0, 0.24, Math.PI + 0.12, (f, q, wt) => crystalM(K, AMBC, f, q, wt, 0.5)); S.unlock();   // (its lower point)
    K.glint(S.c, -0.04, -0.3, 0.1, 0.8); K.ink(S, [60, 30, 10], 0.45); }
  const STONE_COL = ['#62BFC9', '#FFB347', '#B983F5', '#8FE0A6', '#FF8FB8', '#FFE37A'];
  const BANDS = [0.47, 0.84, 1.2];
  function paintResonator(K, S, v) { const sd = 81 + v, col = rgb3(STONE_COL[v % 6]);
    contact(K, S, 0.6, 0.22, 0.6);
    K.rbox(S, 0, 0, 0.52, 0.34, 0, 0.13, 0.04, (f, u, vv) => basaltM(K, u * 3 + sd, vv * 3, sd, false)); S.unlock();
    prism(K, S, 0, -0.12, 0.38, 0.29, 1.3, 0.22, 0, (f, q, wt, tp) => { const hgt = 0.12 + wt * 1.52; basaltM(K, q * 0.6 + sd, hgt * 2, sd, false); if (f) K.M.ao *= 0.86;
      for (const b of BANDS) if (Math.abs(hgt - b) < 0.045) { const M = K.M, e = ss(0.045, 0.02, Math.abs(hgt - b)); M.r = lerp(M.r, col[0] * 0.75, e); M.g = lerp(M.g, col[1] * 0.75, e); M.b = lerp(M.b, col[2] * 0.75, e); M.rg = 0.22; M.cc = 0.7; M.er = col[0] * 0.16 * e; M.eg = col[1] * 0.16 * e; M.eb = col[2] * 0.16 * e; }
      if (tp) { const M = K.M; M.r *= 1.2; M.g *= 1.2; M.b *= 1.25; } });
    S.unlock(); K.ink(S, INK.noon, 0.5); }
  function paintMound(K, S) { const sd = 91; contact(K, S, 0.9, 0.24, 0.45);
    lump(K, S, 0, -0.17, 0.82, 0.3, { amp: 0.1, fr: 2.2, sd, bump: 0.22, leaf: 12, flat: 0.5, mat: (dx, dy, ao, e, nz, wx, wy) => { sandM(K, wx, wy, sd, 1, true); const r = Math.abs(Math.sin(wx * 9 + wy * 3)); if (r < 0.15) K.M.ao *= 0.88; } }); S.unlock();
    socket(S.c, 0, -0.33, 0.3, 0.11, 'rgba(220,230,255,.25)');
    const R = K.R1(sd); for (let i = 0; i < 5; i++) { const a = R() * TAU, x = Math.cos(a) * 0.6, y = -0.12 + Math.sin(a) * 0.15; lump(K, S, x, y, 0.05, 0.035, { amp: 0.2, fr: 2, sd: sd + i, bump: 0.4, leaf: 20, mat: (dx, dy, ao, e, nz, wx, wy) => nstoneM(K, wx * 3, wy * 3, sd + i, 0.7) }); }
    S.unlock(); K.ink(S, INK.night, 0.4); }
  function paintGrubpop(K, S) { const sd = 93;
    K.tube(S, [[0, 0.02], [0.02, -0.5], [0, -0.92]], 0.31, 0.26, (t, s) => { const M = K.M, ring = (t * 4.2) % 1; M.r = 0.95; M.g = 0.92; M.b = 0.84; M.rg = 0.42; M.cc = 0.3; if (ring < 0.12) M.ao *= 0.62; const w = K.vn(s * 3 + sd, t * 9); M.r *= 0.92 + 0.1 * w; M.g *= 0.9 + 0.1 * w; }); S.unlock();
    K.ball(S, 0, -0.96, 0.27, 0.16, (dx, dy) => { const M = K.M; M.r = 0.97; M.g = 0.93; M.b = 0.86; M.rg = 0.4; M.cc = 0.3; }); S.unlock();
    K.ball(S, 0, -0.7, 0.11, 0.11, (dx, dy) => { const M = K.M, e = Math.hypot(dx, dy); M.r = 1; M.g = 0.66; M.b = 0.2; M.rg = 0.15; M.cc = 1; M.er = 0.6 * (1 - e * 0.6); M.eg = 0.35 * (1 - e * 0.6); M.eb = 0.05; }); S.unlock();
    const c = S.c; c.save(); c.fillStyle = '#16121C'; c.beginPath(); c.arc(0.01, -0.7, 0.045, 0, TAU); c.fill(); for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; c.beginPath(); c.moveTo(0, -1.0); c.lineTo(Math.cos(a - 0.5) * 0.15, -1.0 + Math.sin(a - 0.5) * 0.08); c.lineTo(Math.cos(a + 0.5) * 0.15, -1.0 + Math.sin(a + 0.5) * 0.08); c.closePath(); c.fill(); } c.restore();
    K.glint(c, -0.13, -0.85, 0.12, 0.5); K.ink(S, INK.night, 0.55); }
  function paintMantapop(K, S) { const sd = 95;
    for (const s of [-1, 1]) K.tube(S, ptsQ(s * 0.18, -0.92, s * 0.5, -1.25, s * 0.72, -1.22, 8), 0.025, 0.01, () => { const M = K.M; M.r = 0.3; M.g = 0.85; M.b = 0.9; M.er = 0.2; M.eg = 0.65; M.eb = 0.72; M.rg = 0.3; }); S.unlock();
    lump(K, S, 0, -0.62, 0.84, 0.3, { amp: 0.1, fr: 1.2, sd, bump: 0.2, leaf: 6, mat: (dx, dy, ao, e, nz) => { const M = K.M; M.r = 0.12; M.g = 0.1; M.b = 0.16; M.rg = 0.3; M.cc = 0.45; if (e > 0.82) { M.er = 0.04 * (e - 0.82) * 5; M.eg = 0.3 * (e - 0.82) * 5; M.eb = 0.34 * (e - 0.82) * 5; } } }); S.unlock();
    lump(K, S, 0, -0.32, 0.2, 0.32, { amp: 0.06, fr: 1.2, sd: sd + 1, bump: 0.2, leaf: 6, mat: () => { const M = K.M; M.r = 0.09; M.g = 0.08; M.b = 0.12; M.rg = 0.35; M.cc = 0.3; } }); S.unlock();
    for (const s of [-1, 1]) K.ball(S, s * 0.17, -0.68, 0.06, 0.05, (dx, dy) => { const M = K.M; M.r = 0.5; M.g = 1; M.b = 1; M.er = 0.35; M.eg = 0.9; M.eb = 0.95; M.cc = 1; M.rg = 0.1; }); S.unlock();
    K.ink(S, [4, 20, 26], 0.5); }
  Object.assign(DEF, {
    ribtip: { box: v => v ? [-0.56, -0.18, 0.56, 0.9] : [-0.56, -0.9, 0.56, 0.18], paint: paintRibtip },
    cairn: { box: () => [-0.5, -0.78, 0.5, 0.25], paint: paintCairn },
    amber: { box: () => [-0.4, -0.66, 0.4, 0.4], paint: paintAmber },
    resonator: { box: () => [-0.7, -1.9, 0.7, 0.36], paint: paintResonator },
    mound: { box: () => [-1.0, -0.62, 1.0, 0.3], paint: paintMound },
    grubpop: { box: () => [-0.5, -1.25, 0.5, 0.15], paint: paintGrubpop },
    mantapop: { box: () => [-0.95, -1.35, 0.95, 0.15], paint: paintMantapop },
  });

  /* ======================= the floor's decals ======================= */
  const tuft = (K, S, v, col) => { const R = K.R1(131 + v * 7); for (let i = 0; i < 9; i++) { const x0 = (i - 4) * 0.025 + (R() - 0.5) * 0.02, h = 0.2 + R() * 0.15, lean = (i - 4) * 0.03 + (R() - 0.5) * 0.06;
    K.tube(S, ptsQ(x0, 0.02, x0 + lean * 0.3, -h * 0.5, x0 + lean, -h, 5), 0.011, 0.003, (t) => { const M = K.M, w = 0.85 + 0.25 * hh(i, v, 3); M.r = col[0] * w; M.g = col[1] * w; M.b = col[2] * w; M.rg = 0.8; M.ao *= 0.55 + 0.45 * t; }); } S.unlock(); };
  const decPeb = (K, S, v, mat, sd, n) => { const R = K.R1(sd + v * 17); for (let i = 0; i < (n || 4); i++) { const x = (R() - 0.5) * 0.4, y = (R() - 0.5) * 0.12, r = 0.04 + R() * 0.05; lump(K, S, x, y - r * 0.4, r * 1.3, r, { amp: 0.2, fr: 2, sd: sd + i, bump: 0.4, leaf: 24, flat: 0.5, mat: (dx, dy, ao, e, nz, wx, wy) => mat(wx, wy, i) }); } S.unlock(); };
  const decBone = (K, S, v, stain) => { const L = 0.26 + v * 0.03; K.tube(S, [[-L, 0], [L, 0]], 0.03, 0.028, (t, s) => boneM(K, s + v, t * 2, v, stain)); S.unlock(); for (const x of [-L, L]) for (const k of [-1, 1]) K.ball(S, x, k * 0.028, 0.034, 0.034, (dx, dy) => boneM(K, dx + v, dy, v, stain)); S.unlock(); };
  // a wind ripple drift: two or three crescents of lit sand, each with its thin lee shadow (2D: the floor is seen from above)
  const decRip = (K, S, v, night, sd) => { const c = S.c, R = K.R1(sd + v * 5), lit = night ? '205,220,255' : '255,238,205', sh = night ? '10,16,40' : '80,40,30';
    c.save(); c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const y = (i - 1) * 0.07 + (R() - 0.5) * 0.02, w = 0.38 - Math.abs(i - 1) * 0.08, x0 = (R() - 0.5) * 0.06;
      for (const [dy, col, a, lw] of [[0.014, sh, 0.22, 0.022], [0, lit, 0.42, 0.026]]) { const g = c.createLinearGradient(x0 - w, 0, x0 + w, 0); g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(0.5, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.strokeStyle = g; c.lineWidth = lw; c.beginPath(); c.moveTo(x0 - w, y + dy + 0.02); c.quadraticCurveTo(x0, y + dy - 0.035, x0 + w, y + dy + 0.015); c.stroke(); } }
    c.restore(); };
  const decCrack = (K, S, v, glow, col, sd) => { const c = S.c, R = K.R1(sd + v * 11), pts = [[-0.45, 0]]; for (let i = 1; i <= 6; i++) pts.push([-0.45 + i * 0.15, (R() - 0.5) * 0.12]); const br = [pts[2], [pts[2][0] + 0.06, pts[2][1] + 0.16]];
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; for (const [w, s] of [[0.05, 'rgba(30,12,8,.18)'], [0.022, 'rgba(18,6,6,.55)']]) { c.strokeStyle = s; c.lineWidth = w; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.moveTo(br[0][0], br[0][1]); c.lineTo(br[1][0], br[1][1]); c.stroke(); }
    if (glow) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(col, 0.85); c.lineWidth = 0.012; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); for (let i = 1; i < 6; i += 2) halo(c, pts[i][0], pts[i][1], 0.09, col, 0.35); }
    c.restore(); };
  Object.assign(DEF, {
    durip: { box: () => [-0.5, -0.14, 0.5, 0.12], paint: (K, S, v) => decRip(K, S, v, false, 101) },
    dupeb: { box: () => [-0.32, -0.16, 0.32, 0.1], paint: (K, S, v) => { decPeb(K, S, v, (x, y, i) => basaltM(K, x * 3, y * 3, 103 + i, false), 103); K.ink(S, INK.dusk, 0.3); } },
    dubone: { box: () => [-0.42, -0.1, 0.42, 0.1], paint: (K, S, v) => { decBone(K, S, v, 0.25); K.ink(S, INK.dusk, 0.3); } },
    duvein: { box: () => [-0.52, -0.22, 0.52, 0.22], paint: (K, S, v) => decCrack(K, S, v, true, CYAN, 105) },
    medust: { box: () => [-0.4, -0.14, 0.4, 0.1], paint: (K, S, v) => { decPeb(K, S, v, (x, y, i) => redrockM(K, x * 3, 0.2 + i * 0.15, 107 + i), 107, 7); } },
    mepeb: { box: () => [-0.34, -0.17, 0.34, 0.1], paint: (K, S, v) => { decPeb(K, S, v, (x, y, i) => redrockM(K, x * 2, 0.3 + i * 0.2, 109), 109); K.ink(S, INK.noon, 0.3); } },
    mebone: { box: () => [-0.42, -0.1, 0.42, 0.1], paint: (K, S, v) => { decBone(K, S, v, 0.1); K.ink(S, INK.noon, 0.3); } },
    mecrack: { box: () => [-0.52, -0.3, 0.52, 0.22], paint: (K, S, v) => { decCrack(K, S, v, false, PINK, 111); if (v % 2 === 0) { prism(K, S, -0.12, 0.0, 0.035, 0.03, 0.14, 0.05, -0.3, (f, q, wt) => crystalM(K, PINKC, f, q, wt, 0.6)); prism(K, S, -0.05, 0.01, 0.03, 0.026, 0.1, 0.04, 0.35, (f, q, wt) => crystalM(K, PINKC, f, q, wt, 0.6)); S.unlock(); } } },
    ndrip: { box: () => [-0.5, -0.14, 0.5, 0.12], paint: (K, S, v) => decRip(K, S, v, true, 113) },
    ndpeb: { box: () => [-0.32, -0.16, 0.32, 0.1], paint: (K, S, v) => { decPeb(K, S, v, (x, y, i) => nstoneM(K, x * 3, y * 3, 115 + i, 0.85), 115); K.ink(S, INK.night, 0.3); } },
    ndbone: { box: () => [-0.42, -0.1, 0.42, 0.1], paint: (K, S, v) => { decBone(K, S, v, 0); K.ink(S, INK.night, 0.3); } },
    ndtwig: { box: () => [-0.45, -0.2, 0.45, 0.15], paint: (K, S, v) => { const R = K.R1(117 + v); K.tube(S, [[-0.4, 0.02], [-0.05, -0.04 + R() * 0.04], [0.38, 0.03]], 0.026, 0.014, (t, s) => deadwoodM(K, t * 4, s, 117)); K.tube(S, [[-0.05, -0.02], [0.08, -0.14], [0.2, -0.16]], 0.014, 0.007, (t, s) => deadwoodM(K, t * 3, s, 118)); S.unlock(); K.ink(S, INK.night, 0.3); } },
    // (second pass) dry grass, bone shards, tiny crystals, glowing button mushrooms
    dugrass: { box: () => [-0.3, -0.42, 0.3, 0.06], paint: (K, S, v) => { tuft(K, S, v, [0.82, 0.7, 0.44]); K.ink(S, INK.dusk, 0.3); } },
    dushard: { box: () => [-0.36, -0.12, 0.36, 0.1], paint: (K, S, v) => { const R = K.R1(121 + v); for (let i = 0; i < 4; i++) { const x = (R() - 0.5) * 0.5, y = (R() - 0.5) * 0.1, a = R() * Math.PI, l = 0.05 + R() * 0.06; K.tube(S, [[x - Math.cos(a) * l, y - Math.sin(a) * l * 0.4], [x + Math.cos(a) * l, y + Math.sin(a) * l * 0.4]], 0.022, 0.014, (t, s2) => boneM(K, s2 + i, t, 121 + i, 0.3)); } S.unlock(); K.ink(S, INK.dusk, 0.3); } },
    metuft: { box: () => [-0.3, -0.42, 0.3, 0.06], paint: (K, S, v) => { tuft(K, S, v + 4, [0.86, 0.62, 0.36]); K.ink(S, INK.noon, 0.3); } },
    mecrys: { box: () => [-0.22, -0.32, 0.22, 0.06], paint: (K, S, v) => { for (const [x, h, r, a] of [[-0.06, 0.16, 0.035, -0.4], [0.06, 0.2, 0.04, 0.3], [0.0, 0.26, 0.045, 0.02]]) prism(K, S, x, 0.01, r, r * 0.85, h, r * 1.3, a + (v - 1.5) * 0.08, (f, q, wt) => crystalM(K, PINKC, f, q, wt, 0.7)); S.unlock(); K.ink(S, INK.noon, 0.3); } },
    ndshroom: { box: () => [-0.26, -0.3, 0.26, 0.06], paint: (K, S, v) => { for (const [x, h, r] of [[-0.12, 0.12, 0.06], [0.04, 0.18, 0.075], [0.15, 0.09, 0.05]]) { K.tube(S, [[x, 0], [x, -h]], 0.012, 0.01, () => { const M = K.M; M.r = 0.8; M.g = 0.85; M.b = 0.82; }); K.ball(S, x, -h, r, r * 0.5, (dx, dy) => { const M = K.M; M.r = 0.3; M.g = 0.7; M.b = 0.4; M.er = 0.3; M.eg = 0.85; M.eb = 0.35; M.cc = 0.5; }); } S.unlock(); halo(S.c, 0, -0.12, 0.22, GREEN, 0.3); K.ink(S, INK.night, 0.3); } },
    ndgrass: { box: () => [-0.3, -0.42, 0.3, 0.06], paint: (K, S, v) => { tuft(K, S, v + 8, [0.62, 0.64, 0.66]); K.ink(S, INK.night, 0.3); } },
  });
  // decal kind -> [picture, laid flat (turned), scale, the old kind it stands in for (its art where these are not painted), land]
  const DEC = { durip: ['durip', false, 1.4, 'ripple', 'dusk'], dupeb: ['dupeb', false, 1.1, 'pebbles', 'dusk'], dubone: ['dubone', true, 1.0, 'bones', 'dusk'], duvein: ['duvein', true, 1.0, 'crack', 'dusk'],
    medust: ['medust', false, 1.2, 'ripple', 'noon'], mepeb: ['mepeb', false, 1.1, 'pebbles', 'noon'], mebone: ['mebone', true, 1.0, 'bones', 'noon'], mecrack: ['mecrack', true, 1.1, 'crack', 'noon'],
    ndrip: ['ndrip', false, 1.4, 'ripple', 'night'], ndpeb: ['ndpeb', false, 1.1, 'pebbles', 'night'], ndbone: ['ndbone', true, 1.0, 'bones', 'night'], ndtwig: ['ndtwig', true, 1.0, 'crack', 'night'],
    dugrass: ['dugrass', false, 1.0, 'pebbles', 'dusk'], dushard: ['dushard', true, 1.0, 'pebbles', 'dusk'], metuft: ['metuft', false, 1.0, 'pebbles', 'noon'], mecrys: ['mecrys', false, 1.0, 'pebbles', 'noon'], ndshroom: ['ndshroom', false, 1.0, 'pebbles', 'night'], ndgrass: ['ndgrass', false, 1.0, 'pebbles', 'night'] };
  const DECS_OF = { dunes: ['durip', 'dupeb', 'dubone', 'duvein', 'dugrass', 'dushard'], mesa: ['medust', 'mepeb', 'mebone', 'mecrack', 'metuft', 'mecrys'], nightdune: ['ndrip', 'ndpeb', 'ndbone', 'ndtwig', 'ndshroom', 'ndgrass'] };
  // (the rates: about twice the desert's, the Garden's undergrowth density)
  const DECAL_LISTS = { dunes: [['durip', 0.16], ['dupeb', 0.08], ['dubone', 0.05], ['duvein', 0.03], ['dugrass', 0.07], ['dushard', 0.06]], mesa: [['medust', 0.12], ['mepeb', 0.08], ['mebone', 0.03], ['mecrack', 0.05], ['metuft', 0.06], ['mecrys', 0.03]], nightdune: [['ndrip', 0.14], ['ndpeb', 0.07], ['ndbone', 0.05], ['ndtwig', 0.04], ['ndshroom', 0.03], ['ndgrass', 0.05]] };
  const kOf = c => { try { const m = c.getTransform(); return Math.max(0.5, Math.hypot(m.a, m.b)); } catch (e) { return 1; } };
  function decal(c, kind, d, s, T, lw) { const D = DEC[kind]; if (!D) return false;
    if (!off()) { const P = Math.round(T * kOf(c) * 1.25), sp = sprite(D[0], (d.v | 0) % 4, P, true, D[4]); if (sp) { const f = (s / (T * 0.18)) * T / sp.P * D[2]; c.save(); if (D[1]) c.rotate(d.rot || 0); c.drawImage(sp.cv, -sp.ax * f, -sp.ay * f, sp.cv.width * f, sp.cv.height * f); c.restore(); return true; } }
    // (the old art: the desert's decal of that slot)
    try { if (typeof DunWorld !== 'undefined' && DunWorld.decal) { c.save(); c.translate(-d.x * T, -d.y * T); DunWorld.decal(c, Object.assign({}, d, { kind: D[3] }), T, lw); c.restore(); } } catch (e) {} return true; }

  /* ======================= the cache and the drawing ======================= */
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0;
  const CAP = 72;
  function paint(name, v, P, L) { const B = BP(); if (!B) return null; const K = B.kit, D = DEF[name]; if (!D) return null; const b = D.box(v), t0 = now(); let S = null;
    try { S = K.surface(b[0], b[1], b[2], b[3], P); lit(K, L, () => { D.paint(K, S, v, L); S.unlock(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('DUNE_PROPS', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  function sprite(name, v, P, force, L) { if (!DEF[name] || !BP()) return null; L = L || 'dusk'; P = Math.max(8, Math.round(P || BASE || 48)); const key = name + '|' + v + '|' + L + '|' + P; let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 12) return null;
    s = paint(name, v, P, L); if (s) { if (CACHE.size > 140) release(true); CACHE.set(key, s); } return s; }
  const qP = P => Math.max(8, Math.round(Math.exp(Math.round(Math.log(P) * 10) / 10)));
  // a picture at about the sharpness the screen wants (the warmed one if near; any painted size rather than none)
  function pic(c, name, v, T, L, sc) { const m = c.getTransform ? c.getTransform() : null, dpr = Math.min(2, m ? Math.max(0.5, Math.hypot(m.a, m.b)) : 1);
    let P = Math.min(CAP, qP(T * (sc || 1) * dpr)); if (BASE && P <= BASE * 1.1 && P >= BASE * 0.5) P = BASE;
    let s = sprite(name, v, P, false, L); if (!s) { const pre = name + '|' + v + '|' + L + '|'; for (const [k, s2] of CACHE) if (k.startsWith(pre)) { s = s2; break; } } if (!s) STATS.misses++; return s; }
  const put = (c, s, Xs, Ys, T, sx, sy) => { const f = T / s.P; c.save(); c.translate(Xs, Ys); if ((sx || 1) !== 1 || (sy || 1) !== 1) c.scale(sx || 1, sy || 1); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); c.restore(); STATS.draws++; };
  function draw(c, name, v, Xs, Ys, T, o) { if (off() || !DEF[name]) return false; o = o || {}; const s = pic(c, name, v, T, o.L || 'dusk', o.s); if (!s) return false; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; put(c, s, Xs, Ys, T * (o.s || 1), o.flip ? -1 : 1, 1); c.restore(); return true; }

  /* ======================= textures that wrap (the lands) ======================= */
  const TEX = new Map(); let FA = 1, GK = null;
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
  const FN = 6, WN = 4;
  /* ---- the floors ---- */
  // wind-rippled sand (the dunes: bleached bone-sand, basalt grit, bone chips, rare cyan resonance; the night: the same sand
  // under the moon, stones, rare green motes): ripples run across the wind, a gentle windward slope, a steep lee
  function sandFloor(o) { return (x, y, mode) => { const M = GK.M, und = pfbm(x * 0.5, y * 0.5, 3, o.s), war = pfbm(x * 0.5 + 7.7, y * 0.5 + 3.1, 3, o.s + 4), gr = pvn(x * 16, y * 16, 96, o.s + 9);
      const q = y * 1.5 + x * 0.5 + war * 1.3, f = q - Math.floor(q), rp = f < 0.74 ? ss(0, 0.74, f) : ss(1, 0.74, f);
      let h = 0.024 * rp + 0.06 * und + 0.004 * gr, kind = 0;
      const gc = pfeat(x * 4, y * 4, FN * 4, o.s + 11, o.gritP); let gb = 0; if (gc.id >= 0 && gc.d < 0.13) { gb = Math.sqrt(1 - (gc.d / 0.13) ** 2) * 0.008; kind = 1; }
      const gid = gc.id;
      const cc = pfeat(x * 2, y * 2, FN * 2, o.s + 21, o.chipP); let cb = 0, cid = -1; if (cc.id >= 0) { const an = PH(cc.id, 1, o.s + 22) * Math.PI, ca = Math.cos(an), sa = Math.sin(an), u = (cc.ox * ca + cc.oy * sa) / 0.22, w = (-cc.ox * sa + cc.oy * ca) / 0.06; if (u * u + w * w < 1) { cb = Math.sqrt(1 - u * u - w * w) * 0.014; kind = 2; cid = cc.id; } }
      const sc = pfeat(x * 1.5, y * 1.5, 9, o.s + 31, o.sparkP); let sp = 0; if (sc.id >= 0 && sc.d < 0.045) { sp = 1 - sc.d / 0.045; kind = 3; }
      if (kind === 1) h += gb; else if (kind === 2) h += cb; if (!mode) return h;
      const t = 0.86 + 0.18 * und + 0.06 * gr, base = o.base, crest = ss(0.6, 1, rp), trough = ss(0.25, 0, rp);
      M.r = base[0] * t; M.g = base[1] * t; M.b = base[2] * t; M.rg = 0.95;
      if (crest > 0) { M.r = lerp(M.r, o.crest[0], crest * 0.35); M.g = lerp(M.g, o.crest[1], crest * 0.35); M.b = lerp(M.b, o.crest[2], crest * 0.35); }
      if (trough > 0 && gr > 0.5) { M.r = lerp(M.r, o.trough[0], trough * 0.5); M.g = lerp(M.g, o.trough[1], trough * 0.5); M.b = lerp(M.b, o.trough[2], trough * 0.5); }
      if (kind === 1) { const k = 0.7 + 0.5 * PH(gid, 3, 5), m2 = 0.55 + 0.35 * PH(gid, 4, 5); M.r = lerp(M.r, o.grit[0] * k, m2); M.g = lerp(M.g, o.grit[1] * k, m2); M.b = lerp(M.b, o.grit[2] * k, m2); M.rg = 0.5; M.cc = 0.15; }
      else if (kind === 2) { const k = 0.9 + 0.12 * PH(cid, 4, 6); M.r = 0.92 * k; M.g = 0.88 * k; M.b = 0.76 * k; M.rg = 0.55; }
      else if (kind === 3) { const e = o.spark; M.r = lerp(M.r, e[0], sp); M.g = lerp(M.g, e[1], sp); M.b = lerp(M.b, e[2], sp); M.er = e[0] * 0.7 * sp; M.eg = e[1] * 0.7 * sp; M.eb = e[2] * 0.7 * sp; }
      return h; }; }
  // sun-cracked clay (the Rust Flats): curled plates between deep cracks, each its own tone, dust and grit, pink crystal specks
  /* (v433 DE second pass) the clay: plates of every size (big ones, some split again, some split twice), their outlines warped
     so no two are alike, each plate tilted its own way and its edges curled up from the crack; the cracks part-filled with
     pale blown dust, a dark thread at the bottom of the deepest; grit and pebbles, rare pink crystal specks */
  function clayFloor(x, y, mode) { const M = GK.M, wx = x + 0.55 * (pfbm(x * 0.5, y * 0.5, 3, 70) - 0.5), wy = y + 0.55 * (pfbm(x * 0.5 + 5.3, y * 0.5 + 1.7, 3, 71) - 0.5);
    const c1 = pcell(wx * 0.5, wy * 0.5, 3, 61), g1 = (c1.d2 - c1.d) * 2, id1 = c1.id, ox1 = c1.ox, oy1 = c1.oy;   // (gaps in tiles)
    const split = PH(id1, 4, 72), c2 = pcell(wx + 0.37, wy + 0.11, 6, 73), g2 = (c2.d2 - c2.d), id2 = c2.id, ox2 = c2.ox * 1.5, oy2 = c2.oy * 1.5;
    const c3 = pcell(wx * 2 + 0.21, wy * 2 + 0.63, 12, 74), g3 = (c3.d2 - c3.d) / 2, sub2 = PH(id2, 5, 75) < 0.25;
    const w1 = 0.035 + 0.025 * PH(id1, 6, 76), w2 = 0.022 + 0.012 * PH(id2, 7, 77);
    let gap = g1, w = w1, id = id1 + 1000 * 0, tx = ox1 * 0.5, ty = oy1 * 0.5, deep = 1;
    if (split > 0.35 && g2 < gap * 1.0) { if (g2 < gap) { gap = g2; w = w2; deep = 0.7; } id = id1 * 31 + id2; tx = ox2 / 1.5; ty = oy2 / 1.5; }
    if (split > 0.35 && sub2 && g3 < gap) { gap = g3; w = 0.014; deep = 0.45; id = id1 * 31 + id2 * 7 + c3.id; }
    const crack = ss(w, w * 0.35, gap), lip = ss(w * 3, w, gap) * (1 - crack), plate = PH(id, 1, 62), dust = pfbm(x * 0.5, y * 0.5, 3, 63), gr = pvn(x * 14, y * 14, 84, 64);
    const ta = PH(id, 2, 78) * TAU, tilt = (Math.cos(ta) * tx + Math.sin(ta) * ty) * 0.03;
    let h = 0.05 + 0.014 * lip * deep + tilt - 0.06 * crack * deep + 0.01 * pfbm(x * 2, y * 2, 12, 65) + 0.004 * gr + 0.008 * (plate - 0.5), kind = 0;
    const pc = pfeat(x * 3, y * 3, FN * 3, 66, 0.06); let pb = 0; const pid = pc.id; if (pc.id >= 0 && pc.d < 0.18) { pb = Math.sqrt(1 - (pc.d / 0.18) ** 2) * 0.016; kind = 1; }
    const sc = pfeat(x * 1.5, y * 1.5, 9, 67, 0.22); let sp = 0; if (sc.id >= 0 && sc.d < 0.05 && crack < 0.3) { sp = 1 - sc.d / 0.05; kind = 2; h += 0.008 * sp; }
    if (kind === 1 && crack < 0.5) h += pb; if (!mode) return h;
    const t = 0.8 + 0.24 * plate + 0.08 * gr; M.r = 0.86 * t; M.g = 0.5 * t; M.b = 0.27 * t; M.rg = 0.9;
    if (dust > 0.5) { const k = ss(0.5, 0.75, dust) * 0.45; M.r = lerp(M.r, 0.95, k); M.g = lerp(M.g, 0.68, k); M.b = lerp(M.b, 0.46, k); }
    if (lip > 0) { M.r = lerp(M.r, 0.98, lip * 0.3); M.g = lerp(M.g, 0.67, lip * 0.3); M.b = lerp(M.b, 0.45, lip * 0.3); M.ao *= 1 - lip * 0.12; }
    if (crack > 0) { const core = ss(0.5, 0.95, crack) * deep, fill = PH(id, 8, 79);   // (dust blown into the crack, a dark thread where it is deepest)
      M.r = lerp(M.r, 0.92, crack * 0.75); M.g = lerp(M.g, 0.72, crack * 0.75); M.b = lerp(M.b, 0.52, crack * 0.75); M.ao *= 1 - crack * 0.35;
      if (fill < 0.6) { M.r = lerp(M.r, 0.2, core * 0.85); M.g = lerp(M.g, 0.08, core * 0.85); M.b = lerp(M.b, 0.05, core * 0.85); M.ao *= 1 - core * 0.5; } }
    if (kind === 1 && crack < 0.5) { const s2 = STRATA[Math.floor(PH(pid, 2, 68) * 6)], k = 0.8 + 0.3 * PH(pid, 3, 69); M.r = s2[0] * k; M.g = s2[1] * k; M.b = s2[2] * k; M.rg = 0.7; }
    else if (kind === 2) { M.r = lerp(M.r, 1, sp); M.g = lerp(M.g, 0.5, sp); M.b = lerp(M.b, 0.85, sp); M.er = 0.8 * sp; M.eg = 0.3 * sp; M.eb = 0.6 * sp; M.cc = 1; M.rg = 0.1; }
    return h; }
  /* ---- the wall faces (WN tiles wide, H tall) ---- */
  // the jaw's black basalt in columns, sand drifted against their feet (o.night: the night's blue stone)
  function columnBank(H, o) { return (x, y, mode) => { const M = GK.M, cx = x * 3, ci = Math.floor(cx), u = cx - ci, cid = md(ci, 12), v = y / H, cj = H * (0.25 + 0.4 * PH(cid, 2, 71)), cross = ss(0.03, 0.0, Math.abs(y - cj));
      const joint = ss(0.12, 0.0, Math.min(u, 1 - u)); let h = 0.05 * Math.pow(Math.sin(u * Math.PI), 0.5) * (1 - joint) - 0.02 * cross + 0.008 * pvn(x * 9, y * 9, 36, 72), kind = 0;
      const sl = H * (0.6 + 0.14 * pvn(x * 2, 0.5, 8, 73) + 0.06 * pvn(x * 7, 1.5, 28, 74)); if (y > sl) { kind = 1; h = Math.max(h, 0.04 + (y - sl) * 0.35); }
      if (!mode) return h;
      if (kind === 1) { const t = 0.9 + 0.12 * pvn(x * 20, y * 20, 80, 75); if (o.night) { M.r = 0.6 * t; M.g = 0.6 * t; M.b = 0.62 * t; } else { M.r = 0.84 * t; M.g = 0.68 * t; M.b = 0.45 * t; } M.rg = 0.95; M.ao *= 0.75 + 0.25 * ss(sl, H, y); return h; }
      if (o.night) nstoneM(GK, u * 0.4 + cid, y * 2, 77, 0.62); else basaltM(GK, u * 0.4 + cid * 1.7, y * 2.2, 77, true);
      M.ao *= (1 - joint * 0.65) * (1 - cross * 0.5) * (0.62 + 0.38 * (1 - v)); if (v < 0.08) { M.r *= 1.25; M.g *= 1.22; M.b *= 1.2; }
      return h; }; }
  // the Rust Flats' layered red rock: each layer stands out a little over the one below, fractures down it, rubble at its foot
  function strataBank(H) { return (x, y, mode) => { const M = GK.M, b = y / H * 4.2 + 0.5 * pvn(x * 1.5, y * 3, 6, 81), id = Math.floor(b), f = b - id, fx = x * 2.5 + 0.35 * pvn(x * 2, y * 6, 8, 83), fr = Math.abs(fx - Math.floor(fx) - 0.5), frac = ss(0.47, 0.5, fr);
      let h = 0.035 * (1 - f) + 0.016 * pfbm(x * 2, y * 4, 8, 82) - 0.02 * frac, kind = 0; const rb = H * (0.8 + 0.1 * pvn(x * 3, 0.5, 12, 84)); if (y > rb) { kind = 1; h = Math.max(h, 0.03 + (y - rb) * 0.3 + 0.02 * pvn(x * 12, y * 12, 48, 85)); }
      if (!mode) return h;
      if (kind === 1) { redrockM(GK, x * 2, 0.4 + pvn(x * 8, y * 8, 32, 86), 86); M.ao *= 0.8; return h; }
      const C0 = STRATA[md(id, 6)], C1 = STRATA[md(id + 1, 6)], k = ss(0.85, 1, f), t = 0.85 + 0.2 * pfbm(x * 3, y * 6, 12, 87); M.r = lerp(C0[0], C1[0], k) * t; M.g = lerp(C0[1], C1[1], k) * t; M.b = lerp(C0[2], C1[2], k) * t; M.rg = 0.86;
      if (f < 0.1) M.ao *= 0.66 + f * 3.4; M.ao *= 1 - frac * 0.6; const sk = ss(0.62, 0.86, pvn(x * 7, y * 1.5, 28, 88)) * ss(0.6, 0, f); if (sk > 0) { M.r = lerp(M.r, 0.3, sk * 0.5); M.g = lerp(M.g, 0.14, sk * 0.5); M.b = lerp(M.b, 0.1, sk * 0.5); }
      return h; }; }
  /* ---- the wall tops (seen from above, WN square) ---- */
  function columnRoof(o) { return (x, y, mode) => { const M = GK.M, cl = pcell(x * 2.5, y * 2.5, 10, 91), gap = cl.d2 - cl.d, joint = ss(0.08, 0.02, gap), lvl = PH(cl.id, 3, 92), dr = pfbm(x * 0.75, y * 0.75, 3, 93);
      let h = 0.04 + 0.03 * lvl - 0.035 * joint + 0.005 * pvn(x * 14, y * 14, 56, 94); const sand = 0.02 + 0.075 * ss(0.4, 0.78, dr); let kind = 0, sk = ss(h - 0.006, h + 0.006, sand); if (sand > h) { h = sand + 0.003 * pvn(x * 20, y * 20, 80, 95); kind = 1; }
      if (!mode) return h;
      if (kind === 1 && sk > 0.99) { const t = 0.9 + 0.12 * pvn(x * 20, y * 20, 80, 96); if (o.night) { M.r = 0.6 * t; M.g = 0.6 * t; M.b = 0.62 * t; } else { M.r = 0.86 * t; M.g = 0.72 * t; M.b = 0.52 * t; } M.rg = 0.95; M.ao *= 0.85 + 0.15 * ss(0.02, 0.08, sand); return h; }
      if (o.night) nstoneM(GK, cl.ox * 2 + cl.id * 0.37, cl.oy * 2, 97, 0.66); else basaltM(GK, cl.ox * 2.5 + cl.id * 0.37, cl.oy * 2.5, 97, true); M.ao *= (1 - joint * 0.7) * (0.85 + 0.15 * lvl); if (sk > 0) { const t = 0.9, r0 = o.night ? 0.6 : 0.86, g0 = o.night ? 0.6 : 0.72, b0 = o.night ? 0.62 : 0.52; M.r = lerp(M.r, r0 * t, sk); M.g = lerp(M.g, g0 * t, sk); M.b = lerp(M.b, b0 * t, sk); M.rg = lerp(M.rg, 0.95, sk); M.cc *= 1 - sk; M.er *= 1 - sk; M.eg *= 1 - sk; M.eb *= 1 - sk; }
      return h; }; }
  function mesaRoof(x, y, mode) { const M = GK.M, w = pfbm(x * 0.75, y * 0.75, 3, 101), con = w * 6, id = Math.floor(con), f = con - id, dust = pfbm(x * 1.5 + 4, y * 1.5, 6, 102);
    let h = 0.05 * w + 0.012 * (1 - f) + 0.004 * pvn(x * 16, y * 16, 64, 103); if (!mode) return h;
    const C0 = STRATA[md(id + 1, 6)], C1 = STRATA[md(id + 2, 6)], kk = ss(0.7, 1, f), C = [lerp(C0[0], C1[0], kk) * 0.6 + 0.85 * 0.4, lerp(C0[1], C1[1], kk) * 0.6 + 0.48 * 0.4, lerp(C0[2], C1[2], kk) * 0.6 + 0.26 * 0.4], t = 0.84 + 0.2 * pvn(x * 6, y * 6, 24, 104) + 0.06 * pvn(x * 24, y * 24, 96, 105); M.r = C[0] * t; M.g = C[1] * t; M.b = C[2] * t; M.rg = 0.88; if (f < 0.08) M.ao *= 0.72 + f * 3.5;
    if (dust > 0.5) { const k = ss(0.5, 0.8, dust) * 0.3; M.r = lerp(M.r, 0.9, k); M.g = lerp(M.g, 0.6, k); M.b = lerp(M.b, 0.4, k); } return h; }
  /* ---- the cliffs over the pit (WN wide, 1.25 tall from the ground's edge) ---- */
  function columnCliff(o) { return (x, y, mode) => { const M = GK.M, cx = x * 3, ci = Math.floor(cx), u = cx - ci, cid = md(ci, 12), bot = 0.42 + 0.34 * PH(cid, 5, 111) + 0.05 * pvn(x * 9, 0.5, 36, 112);
      let h = 0, kind = 0; FA = 1;
      if (y < 0.07 + 0.04 * pvn(x * 9, 0, 36, 113)) { kind = 2; h = 0.04 + 0.01 * pvn(x * 20, y * 20, 80, 114); }
      else if (y < bot) { kind = 1; const joint = ss(0.12, 0.0, Math.min(u, 1 - u)); h = 0.05 * Math.pow(Math.sin(u * Math.PI), 0.5) * (1 - joint); FA = clamp((bot - y) * 40, 0, 1); }
      else { // sand running off the column ends in thin falls, fading into the pit
        const fi = Math.floor(x * 1.5), fx = (fi + 0.3 + PH(md(fi, 6), 0, 115) * 0.4) / 1.5, len = 0.2 + 0.45 * PH(md(fi, 6), 1, 116), on = PH(md(fi, 6), 2, 117) < 0.55, dx = Math.abs(x - fx - 0.02 * Math.sin(y * 9)), r = 0.02 + 0.015 * (y - bot);
        if (on && dx < r && y - bot < len) { kind = 3; FA = clamp((r - dx) * 60, 0, 1) * (1 - (y - bot) / len) * 0.75; h = 0; } else { FA = 0; return 0; } }
      if (!mode) return h;
      if (kind === 2) { const t = 0.92 + 0.1 * pvn(x * 20, y * 20, 80, 118); if (o.night) { M.r = 0.62 * t; M.g = 0.62 * t; M.b = 0.64 * t; } else { M.r = 0.86 * t; M.g = 0.7 * t; M.b = 0.47 * t; } M.rg = 0.95; }
      else if (kind === 1) { if (o.night) nstoneM(GK, u * 0.4 + cid, y * 2, 119, 0.6); else basaltM(GK, u * 0.4 + cid * 1.7, y * 2.2, 119, true); const joint = ss(0.12, 0.0, Math.min(u, 1 - u)); M.ao *= (1 - joint * 0.65) * (1 - (y / bot) * 0.5); }
      else { if (o.night) { M.r = 0.6; M.g = 0.62; M.b = 0.66; } else { M.r = 0.9; M.g = 0.74; M.b = 0.5; } M.rg = 0.95; M.ao *= 0.8; }
      return h; }; }
  function strataCliff(x, y, mode) { const M = GK.M, bot = 0.5 + 0.18 * pvn(x * 3, 0.5, 12, 121) + 0.08 * pvn(x * 11, 2.5, 44, 122); let h = 0; FA = 1;
    if (y >= bot) { FA = 0; return 0; } const b = y * 7 + 0.5 * pvn(x * 1.5, y * 3, 6, 123), id = Math.floor(b), f = b - id; h = 0.035 * (1 - f) + 0.014 * pfbm(x * 2, y * 4, 8, 124); FA = clamp((bot - y) * 40, 0, 1);
    if (!mode) return h; const C = STRATA[md(id + 2, 6)], t = 0.86 + 0.2 * pfbm(x * 3, y * 6, 12, 125); M.r = C[0] * t; M.g = C[1] * t; M.b = C[2] * t; M.rg = 0.86; if (f < 0.1) M.ao *= 0.66 + f * 3.4; M.ao *= 1 - (y / bot) * 0.5; if (y < 0.05) { M.r *= 1.15; M.g *= 1.1; M.b *= 1.05; } return h; }
  const TDEF = {
    'floor:dunes': { w: FN, h: FN, L: 'dusk', fn: () => sandFloor({ s: 1, base: [0.84, 0.8, 0.7], crest: [0.98, 0.95, 0.86], trough: [0.7, 0.58, 0.46], grit: [0.16, 0.14, 0.18], spark: [0.4, 0.95, 1], gritP: 0.08, chipP: 0.11, sparkP: 0.06 }), o: { wrap: true, wrapY: true, bump: 1.25 } },
    'floor:nightdune': { w: FN, h: FN, L: 'night', fn: () => sandFloor({ s: 3, base: [0.58, 0.62, 0.72], crest: [0.78, 0.84, 0.95], trough: [0.38, 0.42, 0.55], grit: [0.24, 0.26, 0.34], spark: [0.85, 0.95, 1], gritP: 0.06, chipP: 0.06, sparkP: 0.2 }), o: { wrap: true, wrapY: true, bump: 1.25 } },
    'floor:mesa': { w: FN, h: FN, L: 'noon', fn: () => clayFloor, o: { wrap: true, wrapY: true, bump: 1.2 } },
    'bank:dunes': { w: WN, h: 0.55, L: 'dusk', fn: () => columnBank(0.55, {}), o: { wrap: true, face: true, bump: 1.4 } },
    'bank:nightdune': { w: WN, h: 0.55, L: 'night', fn: () => columnBank(0.55, { night: true }), o: { wrap: true, face: true, bump: 1.4 } },
    'bank:mesa': { w: WN, h: 0.55, L: 'noon', fn: () => strataBank(0.55), o: { wrap: true, face: true, bump: 1.4 } },
    'roof:dunes': { w: WN, h: WN, L: 'dusk', fn: () => columnRoof({}), o: { wrap: true, wrapY: true, bump: 1.2 } },
    'roof:nightdune': { w: WN, h: WN, L: 'night', fn: () => columnRoof({ night: true }), o: { wrap: true, wrapY: true, bump: 1.2 } },
    'roof:mesa': { w: WN, h: WN, L: 'noon', fn: () => mesaRoof, o: { wrap: true, wrapY: true, bump: 1.2 } },
    'cliff:dunes': { w: WN, h: 1.25, L: 'dusk', fn: () => columnCliff({}), o: { wrap: true, face: true, bump: 1.4 } },
    'cliff:nightdune': { w: WN, h: 1.25, L: 'night', fn: () => columnCliff({ night: true }), o: { wrap: true, face: true, bump: 1.4 } },
    'cliff:mesa': { w: WN, h: 1.25, L: 'noon', fn: () => strataCliff, o: { wrap: true, face: true, bump: 1.4 } },
  };
  // the fossil rib's shaft (the Sandstorm Flight): 1 tile wide, 2 tall, wrapping up and down; the bone a tube 0.42 round
  function paintRibShaft(K, P) { const S = K.surface(0, 0, 1, 2, P); K.tube(S, [[0.5, -0.4], [0.5, 2.4]], 0.42, 0.42, (t, s) => ribM(K, s, -0.4 + t * 2.8, 0)); S.unlock();
    const c = S.c; c.save(); for (const [x, a] of [[0.085, 0.55], [0.915, 0.7]]) { c.strokeStyle = `rgba(44,18,30,${a})`; c.lineWidth = 0.035; c.beginPath(); c.moveTo(x, -0.1); c.lineTo(x, 2.1); c.stroke(); } c.restore();   // (the ink edge the pictures have)
    const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1; return cv; }
  TDEF['ribshaft:dusk'] = { L: 'dusk', custom: paintRibShaft };
  /* the bridges over the pit: slats of bleached bone (the noon's sun-dried timber in the Rust Flats) lashed between two ropes,
     2 tiles long (wrapping), the dark of the drop between the slats; the underside seen past a bridge's south edge, rope ends
     hanging from it */
  function ropeM(K, t, s, sd) { const M = K.M, tw = Math.abs(Math.sin(t * Math.PI * 2 * 22 + s * 2.2)); M.r = 0.56; M.g = 0.42; M.b = 0.28; M.rg = 0.9; if (tw < 0.3) M.ao *= 0.68; const w = pvn(t * 10, s + sd, 10, 3); M.r *= 0.85 + 0.2 * w; M.g *= 0.85 + 0.2 * w; }
  function paintBridgeTex(K, P, wood) { const S = K.surface(0, 0, 2, 1, P), c = S.c; c.fillStyle = '#140C10'; c.fillRect(0, 0, 2, 1); const g = c.createLinearGradient(0, 0, 0, 1); g.addColorStop(0, 'rgba(60,30,30,.5)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,30,30,.5)'); c.fillStyle = g; c.fillRect(0, 0, 2, 1);
    for (let i = 0; i < 8; i++) { const x = (i + 0.5) * 0.25, sk = (hh(i, 1, 7) - 0.5) * 0.03, r = 0.085 + hh(i, 2, 7) * 0.015;
      K.tube(S, [[x - sk, 0.06], [x, 0.5], [x + sk, 0.94]], r, r * 0.92, (t, s2) => { if (wood) { const M = K.M, gr = pvn(s2 * 2 + i * 3, t * 18, 18, 11); M.r = 0.5 * (0.75 + 0.4 * gr); M.g = 0.3 * (0.75 + 0.4 * gr); M.b = 0.18 * (0.75 + 0.4 * gr); M.rg = 0.8; if (gr < 0.25) M.ao *= 0.7; } else boneM(K, s2 + i * 3, t * 3, i, 0.15 + 0.2 * hh(i, 3, 7)); }); }
    S.unlock();
    for (const y0 of [0.12, 0.88]) { K.tube(S, [[-0.2, y0], [1, y0 + 0.01], [2.2, y0]], 0.04, 0.04, (t, s2) => ropeM(K, t * 2.4 - 0.2, s2, y0 * 9)); S.unlock(); for (let i = 0; i < 8; i++) K.ball(S, (i + 0.5) * 0.25, y0, 0.05, 0.035, (dx, dy) => ropeM(K, dx * 0.1 + i, dy, 5)); S.unlock(); }
    const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1; return cv; }
  function paintUnderTex(K, P) { const S = K.surface(0, 0, 2, 1.1, P), c = S.c; c.fillStyle = '#120A0E'; c.beginPath(); c.moveTo(0, 0); c.lineTo(2, 0); c.lineTo(2, 0.1); c.lineTo(0, 0.1); c.closePath(); c.fill();
    for (let k = 0; k < 6; k++) { const u = 0.15 + k * 0.33 + hh(k, 1, 3) * 0.1, L = 0.25 + hh(k, 2, 3) * 0.45, sw = (hh(k, 3, 3) - 0.5) * 0.15; K.tube(S, ptsQ(u, 0.05, u + sw, 0.05 + L * 0.6, u + sw * 0.4, 0.05 + L, 8), 0.022, 0.012, (t, s2) => { ropeM(K, t, s2, k); K.M.ao *= 0.9 - t * 0.35; }); } S.unlock();
    const cv = mkc(S.w, S.h); cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1; return cv; }
  TDEF['bridge:dunes'] = { L: 'dusk', custom: (K, P) => paintBridgeTex(K, P, false) }; TDEF['bridge:nightdune'] = { L: 'night', custom: (K, P) => paintBridgeTex(K, P, false) }; TDEF['bridge:mesa'] = { L: 'noon', custom: (K, P) => paintBridgeTex(K, P, true) };
  TDEF['bunder:dunes'] = { L: 'dusk', custom: paintUnderTex }; TDEF['bunder:nightdune'] = { L: 'night', custom: paintUnderTex }; TDEF['bunder:mesa'] = { L: 'noon', custom: paintUnderTex };
  function texJobs(name, P) { const B = BP(), D = TDEF[name]; if (!B || !D) return []; P = Math.max(8, Math.min(CAP, Math.round(P))); const key = name + '|' + P; if (TEX.has(key)) return [];
    if (D.custom) return [() => tex(name, P)];
    const K = B.kit; let F = null, t0 = 0; const run = f => () => { if (TEX.has(key)) return; try { GK = K; lit(K, D.L, f); } catch (e) { F = null; } GK = null; }, jobs = [];
    jobs.push(run(() => { t0 = now(); F = fieldBegin(K, D.w, D.h, P, D.fn(), D.o); }));
    const H = Math.ceil(D.h * P), n = Math.max(1, Math.ceil(D.w * P * H / 24000)), band = Math.ceil(H / n);
    for (let i = 0; i < n; i++) jobs.push(run(() => { if (F) F.heights(i * band, (i + 1) * band); }));
    for (let i = 0; i < n; i++) jobs.push(run(() => { if (F) F.shade(i * band, (i + 1) * band); }));
    jobs.push(run(() => { if (!F) return; const cv = F.finish(); F = null; TEX.set(key, { cv, P }); STATS.tex++; STATS.texMs += now() - t0; }));
    return jobs; }
  function tex(name, P) { const B = BP(), D = TDEF[name]; if (!B || !D) return null; P = Math.max(8, Math.min(CAP, Math.round(P))); const key = name + '|' + P; let t = TEX.get(key); if (t) return t;
    const t0 = now(), K = B.kit; let cv = null; try { GK = K; lit(K, D.L, () => { cv = D.custom ? D.custom(K, P) : field(K, D.w, D.h, P, D.fn(), D.o); }); } catch (e) { if (typeof console !== 'undefined') console.warn('DUNE_PROPS tex', name, e); cv = null; } GK = null;
    if (!cv) return null; t = { cv, P }; TEX.set(key, t); STATS.tex++; STATS.texMs += now() - t0; return t; }

  /* ======================= the lands: each biome's own floor, walls, wall tops, cliffs ======================= */
  // soft world-space washes over the floor (each land its own): shade, warm light, a touch of the land's glow
  const WASH = { dunes: [['40,16,34', 0.12, 0.26], ['255,196,120', 0.07, 0.42], ['30,26,40', 0.08, 0.52], ['98,191,201', 0.035, 0.57]],
    mesa: [['90,28,12', 0.1, 0.24], ['255,226,180', 0.08, 0.42], ['255,95,196', 0.035, 0.5], ['150,52,20', 0.07, 0.6]],
    nightdune: [['4,8,30', 0.16, 0.3], ['170,205,255', 0.08, 0.46], ['124,255,106', 0.025, 0.52]] };
  const EDGE = { dunes: '24,8,20', mesa: '40,12,6', nightdune: '2,4,16' };
  function washes(c, X, Y, T, x, y, list) { const G = 3.2;
    for (let gy = Math.floor((y - 3) / G); gy <= Math.floor((y + 4) / G); gy++) for (let gx = Math.floor((x - 3) / G); gx <= Math.floor((x + 4) / G); gx++) { const kind = hh(gx, gy, 141); let col = null, a = 0;
      for (const [cc, aa, upto] of list) if (kind < upto) { col = cc; a = aa * (0.7 + 0.6 * hh(gx, gy, 143)); break; } if (!col) continue;
      const cx = (gx + hh(gx, gy, 153)) * G, cy = (gy + hh(gx, gy, 159)) * G, rr = 1 + hh(gx, gy, 161) * 1.8; if (cx + rr < x || cx - rr > x + 1 || cy + rr * 0.8 < y || cy - rr * 0.8 > y + 1) continue;
      const px = X + (cx - x) * T, py = Y + (cy - y) * T; c.save(); c.translate(px, py); c.scale(1, 0.75); const g = c.createRadialGradient(0, 0, 0, 0, 0, rr * T); g.addColorStop(0, `rgba(${col},${a.toFixed(3)})`); g.addColorStop(0.6, `rgba(${col},${(a * 0.5).toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rr * T, 0, TAU); c.fill(); c.restore(); } }
  const DRIFTC = { dunes: '238,214,170', mesa: '232,170,110', nightdune: '150,172,214' };
  function landFloor(bio) { return function (c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE, isWall) { const t = tex('floor:' + bio, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    c.drawImage(t.cv, md(x, FN) * P, md(y, FN) * P, P, P, X, Y, T + 0.02, T + 0.02);
    washes(c, X, Y, T, x, y, WASH[bio]);
    // sand (dust in the Flats) drifted against the walls' feet: lumpy, lit along its crest
    if (isWall) { const dc = DRIFTC[bio], dr = (cx, cy, rx, ry, a) => { c.save(); c.translate(cx, cy); c.scale(1, ry / rx); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(${dc},${a})`); g.addColorStop(0.6, `rgba(${dc},${a * 0.6})`); g.addColorStop(1, `rgba(${dc},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore(); };
      if (isWall(x, y - 1)) for (let k = 0; k < 3; k++) dr(X + T * (0.15 + k * 0.35 + (hh(x, y, 170 + k) - 0.5) * 0.2), Y + T * 0.05, T * (0.3 + hh(x, y, 180 + k) * 0.2), T * (0.22 + hh(x, y, 190 + k) * 0.14), 0.5);
      if (isWall(x - 1, y)) dr(X, Y + T * (0.3 + hh(x, y, 201) * 0.4), T * 0.32, T * 0.42, 0.32); if (isWall(x + 1, y)) dr(X + T, Y + T * (0.3 + hh(x, y, 203) * 0.4), T * 0.32, T * 0.42, 0.32); }
    const ec = EDGE[bio], side = (x0, y0, x1, y1, w, hh2) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(${ec},.5)`); g.addColorStop(0.5, `rgba(${ec},.14)`); g.addColorStop(1, `rgba(${ec},0)`); c.fillStyle = g; c.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, hh2); };
    if (gN) side(X, Y, X, Y + T * 0.5, T, T * 0.5); if (gS) side(X, Y + T, X, Y + T * 0.55, T, T * 0.45); if (gW) side(X, Y, X + T * 0.45, Y, T * 0.45, T); if (gE) side(X + T, Y, X + T * 0.55, Y, T * 0.45, T); c.restore(); }; }
  function landWall(bio) { return function (c, X, Y, T, H, h, x) { const t = tex('bank:' + bio, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, WN) * P, 0, P, t.cv.height, X, Y, T + 0.5, H);
    const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, `rgba(${EDGE[bio]},0)`); g.addColorStop(1, `rgba(${EDGE[bio]},.32)`); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H); }; }
  function landRoof(bio) { return function (c, X, Y, T, x, y, isWall) { const t = tex('roof:' + bio, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, WN) * P, md(y, WN) * P, P, P, X, Y, T + 0.5, T + 0.5);
    const lip = bio === 'nightdune' ? '190,215,255' : bio === 'mesa' ? '255,220,170' : '255,226,170';
    if (!isWall(x, y - 1)) { c.fillStyle = `rgba(${lip},.16)`; c.fillRect(X, Y, T + 0.5, Math.max(1, T * 0.06)); }
    if (!isWall(x - 1, y)) { c.fillStyle = `rgba(${lip},.09)`; c.fillRect(X, Y, Math.max(1, T * 0.05), T); } if (!isWall(x + 1, y)) { c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(X + T * 0.94, Y, T * 0.06, T); } }; }
  function landCliff(bio) { return function (c, x, y, X, Y, T, lw, B, isGap) { const t = tex('cliff:' + bio, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    const rr = T * 0.38, l = isGap && isGap(x - 1, y) ? rr : 0, r = isGap && isGap(x + 1, y) ? rr : 0, sx = md(x, WN) * P, k = P / T;
    c.save(); if (l || r) { c.beginPath(); c.moveTo(X + l, Y - 1); c.lineTo(X + T - r, Y - 1); c.lineTo(X + T - r * 0.6, Y + T * 1.3); c.lineTo(X + l * 0.6, Y + T * 1.3); c.closePath(); c.clip(); }
    c.drawImage(t.cv, sx, 0, P, t.cv.height, X, Y - T * 0.02, T, t.cv.height / k); c.restore(); }; }

  function landBridge(bio) { return function (c, x, y, X, Y, T, isGap, tt) { const t = tex('bridge:' + bio, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y), TB = typeof T_BRIDGE !== 'undefined' ? T_BRIDGE : -1;
    const run = (dx, dy) => { let n = 0; for (const s of [-1, 1]) for (let k = 1; k <= 6 && tt(x + dx * k * s, y + dy * k * s) === TB; k++) n++; return n; };
    const horiz = gNS && !gWE ? true : gWE && !gNS ? false : run(1, 0) >= run(0, 1);
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0); c.drawImage(t.cv, md(horiz ? x : y, 2) * P, 0, P, P, 0, 0, T + 0.02, T + 0.02); c.restore(); }; }
  function landBridgeEdge(bio) { return function (c, x, y, X, Y, T) { const t = tex('bunder:' + bio, Math.round(T * kOf(c))), P = t ? t.P : 0; if (!t) return;
    c.drawImage(t.cv, md(x, 2) * P, 0, P, t.cv.height, X, Y - T * 0.02, T + 0.02, t.cv.height * T / P); }; }

  /* ======================= the engine's props, the lands, the decals: installed ======================= */
  const OLD = {};
  /* the lands' furniture (v433 DE second pass): more kinds and many more of them, like the Garden; a ring of the big ones
     round each room's rim (20p2's thicket: only where every open tile of the room still reaches every other) */
  const LANDS = {
    dunes: { props: ['dunerock', 'bones', 'jawtooth', 'sanddrift', 'menhir', 'ribarch', 'dunerock', 'bones', 'sanddrift', 'menhir', 'dunerock', 'jawtooth'], propN: [7, 5], edge: ['jawtooth', 'dunerock', 'menhir', 'ribarch', 'dunerock', 'sanddrift', 'jawtooth', 'bones'] },
    mesa: { props: ['mesarock', 'pinkcrystal', 'claypillar', 'crystalout', 'relic', 'tumbleweed', 'mesarock', 'bones', 'pinkcrystal', 'tumbleweed', 'claypillar', 'crystalout'], propN: [7, 4], edge: ['mesarock', 'crystalout', 'claypillar', 'mesarock', 'pinkcrystal', 'relic'] },
    nightdune: { props: ['nightrock', 'bones', 'gravestone', 'bonecairn', 'glowshroom', 'deadtree', 'deadshrub', 'skullpile', 'nightrock', 'glowshroom', 'gravestone', 'deadshrub'], propN: [7, 4], edge: ['deadtree', 'gravestone', 'nightrock', 'bonecairn', 'glowshroom', 'deadtree', 'deadshrub'] } };
  const dressFn = EDGE => ({ rm, i, G, RM, props, R, id, MW, walk, okFeature, first }) => { const TS0 = typeof T_SOLID !== 'undefined' ? T_SOLID : null; if (TS0 == null) return;
    const cells = []; for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) { const k = id(x, y); if (RM[k] === i && walk(k)) cells.push(k); }
    if (cells.length < 20) return;
    const rim = cells.filter(k => { const x = k % MW, y = (k / MW) | 0; return okFeature(x, y, i) && [1, -1, MW, -MW].some(d => !walk(k + d) && !props.has(k + d)); });
    const connected = () => { const open = cells.filter(k => walk(k)); if (!open.length) return true; const seen = new Set([open[0]]), q = [open[0]];
      for (let h = 0; h < q.length; h++) for (const d of [1, -1, MW, -MW]) { const kk = q[h] + d; if (!seen.has(kk) && RM[kk] === i && walk(kk)) { seen.add(kk); q.push(kk); } }
      return seen.size >= open.length; };
    let want = Math.round(rim.length * (first ? 0.14 : 0.24)), tries = 0;
    while (want > 0 && rim.length && tries++ < 200) { const j = Math.floor(R() * rim.length), k = rim[j]; rim.splice(j, 1);
      if ([1, -1, MW, -MW].filter(d => props.has(k + d)).length > 1) continue;
      const was = G[k]; G[k] = TS0; if (!connected()) { G[k] = was; continue; } props.set(k, EDGE[Math.floor(R() * EDGE.length)]); want--; } };
  const FLOORC = { dunes: ['#C89E83', '#C29880', '#CEA486'], mesa: ['#C17F4F', '#BA784A', '#C78654'], nightdune: ['#6481AC', '#5F7CA6', '#6986B2'] };
  function install() { if (typeof DunWorld === 'undefined' || !DunWorld.PROPS) return; const PR = DunWorld.PROPS, EXT = (HAS_W && (window.PROP_EXT = window.PROP_EXT || {})) || {};
    for (const k in NEWK) if (!PR[k]) PR[k] = function () { return (PR[NEWK[k]] && PR[NEWK[k]].__dpp ? OLD[NEWK[k]] : PR[NEWK[k]]).apply(this, arguments); };   // (a new kind's stand-in: the old art of a kin)
    for (const k of KINDS) { if (!PR[k] || PR[k].__dpp) continue; const old = OLD[k] = PR[k];
      const f = function (c, P, v, B) { const bio = bioOf(B); if (!bio || off()) return old.apply(this, arguments); const L = BIO_L[bio], vv = (v | 0) % 4, s = sprite(k, vv % 2, Math.max(8, Math.min(CAP, Math.round(P))), true, L); if (!s) return old.apply(this, arguments);
        const q = P / s.P; c.save(); if (vv >= 2) c.scale(-1, 1); c.drawImage(s.cv, -s.ax * q, -s.ay * q, s.cv.width * q, s.cv.height * q); c.restore(); };
      f.__dpp = 1; PR[k] = f;
      let b = [0, 0, 0, 0]; for (let v = 0; v < 2; v++) { const q = DEF[k].box(v); b = [Math.min(b[0], q[0]), Math.min(b[1], q[1]), Math.max(b[2], q[2]), Math.max(b[3], q[3])]; }
      const E = EXT[k] || [2.4, 2.9]; EXT[k] = [Math.max(E[0], Math.max(-b[0], b[2]) * 2 - 1.6 + 0.1), Math.max(E[1], -b[1] - 0.25 + 0.1)]; }
    // (the shared kinds' break colours stay the desert's where they stand elsewhere: dunerock's sandstone is the same ochre)
    if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) for (const k of KINDS) BREAK_FX.KIND[k] = Object.assign({}, BREAK_FX.KIND[k] || {}, DEF[k].mat);
    if (typeof PROP_EL !== 'undefined') for (const k of KINDS) if (k !== 'bones' && k !== 'dunerock') PROP_EL[k] = DEF[k].el;
    try { if (typeof VEH_SMASH !== 'undefined' && VEH_SMASH.KINDS) for (const k of KINDS) VEH_SMASH.KINDS.add(k); } catch (e) {}
    // the lands: their painted floor, wall faces, wall tops and cliffs (getters: the old art whenever the painter is off)
    for (const bio of ['dunes', 'mesa', 'nightdune']) { const B = typeof BIOMES !== 'undefined' && BIOMES[bio]; if (!B || B.__dpp) continue; B.__dpp = 1;
      const fns = { floorFn: landFloor(bio), wallFn: landWall(bio), roofFn: landRoof(bio), cliffTint: landCliff(bio), bridgeFn: landBridge(bio), bridgeEdge: landBridgeEdge(bio) };
      { let oldF = B.floor; const F2 = FLOORC[bio]; Object.defineProperty(B, 'floor', { configurable: true, enumerable: true, get: () => (BP() ? F2 : oldF), set: v2 => { oldF = v2; } }); }   // (the base colour of tiles the texture does not cover, under props: the texture's own mean)
      B.floorUnder = true;   // (20e's v433 DE hook: the floor texture under the props too)
      { const Ld = LANDS[bio], old = { props: B.props, propN: B.propN, dress: B.dress }, now2 = { props: Ld.props, propN: Ld.propN, dress: dressFn(Ld.edge) };
        for (const n of ['props', 'propN', 'dress']) Object.defineProperty(B, n, { configurable: true, enumerable: true, get: () => (BP() ? now2[n] : old[n]), set: v2 => { old[n] = v2; } }); }
      for (const n in fns) { OLD[bio + ':' + n] = B[n]; Object.defineProperty(B, n, { configurable: true, enumerable: true, get: () => (BP() ? fns[n] : OLD[bio + ':' + n]), set: v2 => { OLD[bio + ':' + n] = v2; } }); } }
    // the decals: each land its own four (the same slots and rates as the desert's it had)
    if (typeof DECALS !== 'undefined') for (const bio in DECAL_LISTS) { if (Object.getOwnPropertyDescriptor(DECALS, bio) && Object.getOwnPropertyDescriptor(DECALS, bio).get) continue; Object.defineProperty(DECALS, bio, { configurable: true, enumerable: true, get: () => (BP() ? DECAL_LISTS[bio] : undefined), set: () => {} }); }   // (painter off: undefined, so the desert's)
    if (HAS_W) { window.DECAL_EXT = window.DECAL_EXT || {}; for (const k of Object.keys(DEC)) { if (DECAL_EXT[k] && DECAL_EXT[k].__dpp) continue; const f = function (c, d, s, lw, T) { decal(c, k, d, s, T || (s / (0.18 * (d.s || 1))), lw); }; f.__dpp = 1; DECAL_EXT[k] = f; } }
  }
  install();

  /* ======================= release, warm-up ======================= */
  function release(keepTex) { if (!keepTex) BURSTS.length = 0; CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); if (!keepTex) { TEX.forEach(t => { if (t && t.cv) t.cv.width = t.cv.height = 1; }); TEX.clear(); BASE = 0; } }
  // the props' own copies let go once a stage plays (the engine keeps its pictures of them in its prop cache)
  function trimKinds() { for (const [k, s2] of CACHE) { const n = k.split('|')[0]; if (KINDS.includes(n)) { if (s2 && s2.cv) s2.cv.width = s2.cv.height = 1; CACHE.delete(k); STATS.released++; } } }
  function hookRelease() { try { if (typeof DunWorld === 'undefined' || !DunWorld.dropProps || DunWorld.dropProps.__dpp) return; const od = DunWorld.dropProps; const f = function () { try { od.apply(this, arguments); } finally { release(); } }; f.__dpp = 1; DunWorld.dropProps = f; } catch (e) {} }
  hookRelease();
  function warm(P) { if (!BP() || !P || !(P.T > 0)) return []; const S2 = P.S || {}, F = P.F || {}; if (S2.kind === 'boss' || F.fiend) return [];
    const k = P.k || 1, PB = Math.min(CAP, Math.round(P.T * k)); BASE = PB; const bio = BIO_L[F.biome] ? F.biome : 'dunes', L = BIO_L[bio], jobs = [], job = f => jobs.push(() => { try { f(); } catch (e) {} });
    for (const n of ['floor', 'bank', 'roof', 'cliff', 'bridge', 'bunder']) for (const j of texJobs(n + ':' + bio, PB)) jobs.push(j);
    for (const d of DECS_OF[bio]) for (let v = 0; v < 4; v++) job(() => sprite(d, v, Math.round(PB * 1.25), true, L));
    const n = S2.name || '', sp = (nm, v) => job(() => sprite(nm, v, PB, true, L));
    if (!gpuOK()) return jobs;   // (no GPU light: the puzzles draw their old 2D pieces, so theirs are not painted)
    if (/Sandstorm Flight/.test(n)) { for (const j of texJobs('ribshaft:dusk', PB)) jobs.push(j); sp('ribtip', 0); sp('ribtip', 1); sp('amber', 0); sp('cairn', 0); }
    else if (/Echo Chamber/.test(n)) { for (let v = 0; v < 6; v++) sp('resonator', v); }
    else if (/Grub Mounds/.test(n)) { sp('mound', 0); sp('grubpop', 0); sp('mantapop', 0); }
    return jobs; }

  /* ======================= breaking them (every prop of the three lands; nothing here holds a way shut) =======================
     The props stand on what was a room's floor, so a break only gives back floor inside its room: no route past a puzzle, a
     gate or a door can open (the puzzles' pieces are not props and do not break; the boss arenas hold none). The engine breaks
     them (20l: shots, areas, strong attacks, Ultimates, vehicles): the tile turns to floor and BREAK_FX shatters the painted
     picture in its material. Here: the hit points (the great rocks take more), each kind's own debris on top (sandstone grit
     and sand, bone splinters, red rock and orange dust, pink glass and sparks, blue stone, twigs, bone and the sockets' green
     light) and a feathered GPU burst of its light; lowFx: fewer pieces, no ring. Every burst ends within 1.6 s. */
  const HPK = { dunerock: 3, bones: 2, mesarock: 4, pinkcrystal: 2, nightrock: 3, deadshrub: 1, skullpile: 2, ribarch: 3, jawtooth: 4, menhir: 4, sanddrift: 1, crystalout: 4, claypillar: 3, relic: 3, tumbleweed: 1, gravestone: 3, bonecairn: 2, glowshroom: 1, deadtree: 3 };
  const DEBRIS = { dunerock: { col: '#FFD08A', dust: '#D9B07A', n: [['rock', '#C9924F', 9], ['smoke', 'rgba(217,176,122,', 5], ['rock', '#2A2630', 3]] },
    bones: { col: '#FFF1D0', dust: '#E7D9B1', n: [['shard', '#EDE4CF', 10], ['smoke', 'rgba(231,217,177,', 3]] },
    mesarock: { col: '#FFB070', dust: '#D9823F', n: [['rock', '#C4602E', 10], ['rock', '#F2B27A', 4], ['smoke', 'rgba(217,130,63,', 6]] },
    pinkcrystal: { col: PINK, dust: '#FFB8E6', n: [['shard', '#FF7FD0', 12], ['spark', '#FFE0F4', 10], ['spore', '#FF9BD8', 6]] },
    nightrock: { col: '#B8D4FF', dust: '#4A5C88', n: [['rock', '#4A5C88', 9], ['smoke', 'rgba(74,92,136,', 4]] },
    deadshrub: { col: '#B8C4D8', dust: '#5A566A', n: [['twig', '#4E4A56', 12], ['smoke', 'rgba(90,86,106,', 3]] },
    skullpile: { col: GREEN, dust: '#C9CFDD', n: [['shard', '#D8DDE8', 10], ['spore', GREEN, 8], ['smoke', 'rgba(124,255,106,', 2]] },
    ribarch: { col: '#FFF1D0', dust: '#E7D9B1', n: [['shard', '#EDE4CF', 14], ['smoke', 'rgba(231,217,177,', 5], ['rock', '#D9B07A', 4]] },
    jawtooth: { col: '#FFF6E0', dust: '#E7D9B1', n: [['shard', '#F4EEDC', 14], ['shard', '#C9A06A', 6], ['smoke', 'rgba(231,217,177,', 5]] },
    menhir: { col: CYAN, dust: '#4A4450', n: [['rock', '#2E2A34', 12], ['spark', '#8FF0F8', 10], ['spore', CYAN, 6], ['smoke', 'rgba(60,56,70,', 4]] },
    sanddrift: { col: '#FFE2A8', dust: '#D9B07A', n: [['smoke', 'rgba(217,176,122,', 9], ['rock', '#D9B07A', 6]] },
    crystalout: { col: PINK, dust: '#FFB8E6', n: [['shard', '#FF7FD0', 16], ['spark', '#FFE0F4', 12], ['spore', '#FF9BD8', 8], ['rock', '#C4602E', 5]] },
    claypillar: { col: '#FFC890', dust: '#D9823F', n: [['rock', '#C8743A', 12], ['smoke', 'rgba(217,130,63,', 6]] },
    relic: { col: '#FFB070', dust: '#8A4A24', n: [['shard', '#8A4A24', 10], ['spark', '#FFC070', 8], ['smoke', 'rgba(138,74,36,', 4]] },
    tumbleweed: { col: '#E8D0A0', dust: '#A88A5C', n: [['twig', '#A88A5C', 16], ['smoke', 'rgba(168,138,92,', 3]] },
    gravestone: { col: '#B8D4FF', dust: '#4A5470', n: [['rock', '#4A5470', 12], ['smoke', 'rgba(74,84,112,', 4]] },
    bonecairn: { col: GREEN, dust: '#C9CFDD', n: [['shard', '#D8DDE8', 10], ['rock', '#4A5C88', 6], ['spore', GREEN, 6]] },
    glowshroom: { col: GREEN, dust: '#2A4A3A', n: [['spore', GREEN, 14], ['spore', '#62E6D0', 8], ['twig', '#CFE0D8', 6]] },
    deadtree: { col: '#B8C4D8', dust: '#5A566A', n: [['twig', '#5A5664', 18], ['rock', '#3A3640', 5], ['smoke', 'rgba(90,86,106,', 4]] } };
  const BURSTS = [];
  function duneBreak(X, p) { const D = DEBRIS[p.kind]; if (!D || !X || !X.part) return; const lf = lowFx(), k = lf ? 0.5 : 1, R = Math.random, h = Math.max(0.6, -(DEF[p.kind].box(0)[1]) * 0.5);
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
      G.Q.glow(Xs, Ys - T * b.h * 0.6, T * (1.1 + b.h * 0.8) * (0.6 + u * 0.8), b.col, 0.36 * f);
      G.Q.glow(Xs, Ys, T * (1.6 + u * 1.7), b.dust, 0.2 * f, 0.4);   // (the dust thrown up round its foot, lying low)
      if (!lf) G.Q.ring(Xs, Ys, T * (0.5 + u * 2.2), b.col, 0.28 * f, T * 0.35 * (1 - u * 0.5), 0.45); } }
  function hookBreak() { try { if (typeof BREAK_FX === 'undefined' || !BREAK_FX.prop || BREAK_FX.prop.__dpp) return; const op = BREAK_FX.prop; const f = function (Xa, p) { const r = op.apply(this, arguments); try { if (p && DEBRIS[p.kind] && BIO_L[p.biome] && !off()) duneBreak(Xa, p); } catch (e) {} return r; }; f.__dpp = 1; BREAK_FX.prop = f; } catch (e) {} }
  hookBreak();
  const toughen = props => { for (const p of props || []) if (HPK[p.kind] && BIO_L[p.biome] && !p.dpHp && !p.broken) { p.dpHp = 1; p.hp = Math.max(p.hp || 0, HPK[p.kind]); } };

  /* ======================= the light (GPU): props' glows, the puzzles' queued light, motes ======================= */
  // where each prop's live lights are (tiles from its feet; v 0..1, mirrored for 2..3): [dx, dy, r, colour, kind]
  function glowsOf(kind, v) { const vv = (v | 0) % 2, m = (v | 0) % 4 >= 2 ? -1 : 1, out = [];
    if (kind === 'pinkcrystal') { out.push([0, -0.75, 0.95, PINK, 'crys']); for (const [x, y, r] of crysTips(kind, vv, m)) out.push([x, y, r * 1.6, '#FFC8EC', 'tip']); }
    else if (kind === 'crystalout') { out.push([0, vv ? -0.5 : -1.0, vv ? 0.7 : 1.3, PINK, 'crys']); for (const [x, y, r] of crysTips(kind, vv, m)) out.push([x, y, r * 1.5, '#FFC8EC', 'tip']); }
    else if (kind === 'mesarock' && vv === 0) out.push([0.6 * m, -0.3, 0.4, PINK, 'crys']);
    else if (kind === 'skullpile') { const sx = vv ? 0.12 : 0.02; for (const s of [-1, 1]) out.push([(sx + s * 0.1) * m, -0.45, 0.12, GREEN, 'eye']); out.push([-0.55 * m, -0.21, 0.08, GREEN, 'eye']); }
    else if (kind === 'bonecairn') { for (const s of [-1, 1]) out.push([(0.02 + s * 0.075) * m, -1.22, 0.1, GREEN, 'eye']); }
    else if (kind === 'menhir') { if (vv) { out.push([-0.32 * m, -0.75, 0.3, CYAN, 'vein'], [0.45 * m, -0.5, 0.24, CYAN, 'vein']); } else out.push([0.06 * m, -0.7, 0.32, CYAN, 'vein'], [0.04 * m, -1.35, 0.26, CYAN, 'vein']); }
    else if (kind === 'glowshroom') { for (const [x, h, r] of SHROOMS[vv]) out.push([x * m, -h - r * 0.15, r * 1.5, (Math.round(x * 10 + h * 7) & 1) ? '#62E6D0' : GREEN, 'cap']); }
    return out; }
  const gpu = c => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__DPP_GL === 0)) return null; const NM = HAS_W ? window.NIDHOGG_MOVES : null, F = NM && NM.FGFX; if (!F || !F.usable()) return null; return { F, Q: F.begin(c, null) }; } catch (e) { return null; } };
  const gpuEnd = (c, G) => { if (G) try { G.F.flush(c); } catch (e) {} };
  const gpuOK = () => { try { if (HAS_W && (window.__DUN_GL === 0 || window.__DPP_GL === 0)) return false; const NM = HAS_W ? window.NIDHOGG_MOVES : null; return !!(NM && NM.FGFX && NM.FGFX.usable()); } catch (e) { return false; } };
  // the puzzles' light, queued as their pieces are drawn and laid by the stage's light pass right after (ground, then over)
  const QL = []; let LIVE = null;
  const ql = (fn, a, b, c2, d, e, f, g2, h) => { if (QL.length < 400) QL.push([fn, a, b, c2, d, e, f, g2, h]); };
  function qFlush(G) { for (const q of QL) { try { G.Q[q[0]](q[1], q[2], q[3], q[4], q[5], q[6], q[7], q[8]); } catch (e) {} } QL.length = 0; }
  const ready = X => !!(X && LIVE && LIVE.X === X && !off() && BP() && gpuOK());
  function lights(X, self) { const F = X.F || {}, bio = BIO_L[F.biome] ? F.biome : 'dunes', L = BIO_L[bio], fiend = !!F.fiend; let glows = null, t = 0; const motes = [], LF = lowFx;
    const collect = () => { glows = []; for (const p of (X.props || [])) { if (!BIO_L[p.biome]) continue; for (const [dx, dy, r, col, kind] of glowsOf(p.kind, p.v | 0)) glows.push({ p, dx, dy, r, col, kind, ph: hh(p.k || Math.round(p.x * 7 + p.y * 13), 1, 3) * TAU }); } };
    const MCOL = { dusk: ['#FFE9A8', '#FFD08A', '#F7C8A0'], noon: ['#FFE2C0', '#FFC8EC', '#FFF4E0'], night: ['#CFE0FF', '#B8FFB0'] }[L];
    return { X, L,
      update(dt) { t += dt; burstsTick(dt); if (!glows) { collect(); toughen(X.props); if (!fiend) trimKinds(); } if (QL.length > 300) QL.length = 0;
        const me = X.me, want = fiend ? 0 : LF() ? 5 : (L === 'night' ? 8 : 18);
        if (motes.length < want && Math.random() < dt * 7) { const W = X.W() / X.Tz(), Hh = X.H() / X.Tz(); motes.push({ x: me.x + (Math.random() - 0.5) * W * 1.1, y: me.y + (Math.random() - 0.4) * Hh * 0.8, vx: (L === 'night' ? 0.1 : 0.55) + Math.random() * 0.4, vy: -(0.05 + Math.random() * 0.15), t: 0, life: 3 + Math.random() * 4, s: 0.5 + Math.random() * 0.8, ph: Math.random() * 6, col: MCOL[Math.floor(Math.random() * MCOL.length)] }); }
        for (const e of motes) { e.t += dt; e.x += (e.vx + Math.sin(e.t * 1.3 + e.ph) * 0.2) * dt; e.y += (e.vy + Math.cos(e.t * 0.9 + e.ph) * 0.08) * dt; } for (let i = motes.length - 1; i >= 0; i--) if (motes[i].t > motes[i].life) motes.splice(i, 1); },
      drawGround(c) { if (!QL.length && !(glows && glows.length)) return; const G = gpu(c); if (!G) { QL.length = 0; return; } const T = X.Tz(), W = X.W(), Hh = X.H(), lf = LF();
        // the light the glowing things spill on the floor round them
        if (glows) for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y); if (Xs < -T * 4 || Xs > W + T * 4 || Ys < -T * 3 || Ys > Hh + T * 3) continue; if (q.kind === 'tip' || (lf && q.kind !== 'crys')) continue;
          G.Q.glow(Xs, Ys - T * 0.05, q.r * T * (q.kind === 'eye' ? 4 : 2.4), q.col, (q.kind === 'eye' ? 0.08 : 0.15) + 0.04 * Math.sin(t * 1.3 + q.ph), 0.42); }
        qFlush(G); gpuEnd(c, G); },
      drawOver(c) { if (!QL.length && !(glows && glows.length) && !BURSTS.length && !motes.length) return; const G = gpu(c); if (!G) { QL.length = 0; return; } const T = X.Tz(), W = X.W(), Hh = X.H(), lf = LF();
        if (glows) for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y) + q.dy * T; if (Xs < -T * 3 || Xs > W + T * 3 || Ys < -T * 3 || Ys > Hh + T * 3) continue;
          const k = 0.75 + 0.25 * Math.sin(t * (q.kind === 'eye' ? 3.1 : 1.7) + q.ph); if (lf && q.kind === 'tip') continue;
          if (q.kind === 'tip') { const tw = Math.max(0, Math.sin(t * 2.3 + q.ph * 3)); G.Q.glow(Xs, Ys, q.r * T * 1.4, q.col, 0.22 * tw); if (tw > 0.8 && !lf) G.Q.star(Xs, Ys, q.r * T * 1.6 * (tw - 0.6), (tw - 0.8) * 3, '#FFFFFF'); continue; }
          G.Q.glow(Xs, Ys, q.r * T * 1.7, q.col, (q.kind === 'eye' ? 0.55 : 0.3) * k); G.Q.glow(Xs, Ys, q.r * T * 0.42, '#FFFFFF', (q.kind === 'eye' ? 0.5 : 0.36) * k); }
        qFlush(G); burstsDraw(G, X);
        // motes: sand glints on the wind (the dunes, the flats), slow moon motes (the night)
        for (const e of motes) { const a = Math.sin(e.t / e.life * Math.PI), Xs = X.sx(e.x), Ys = X.sy(e.y); if (Xs < -10 || Xs > W + 10 || Ys < -10 || Ys > Hh + 10) continue; G.Q.glow(Xs, Ys, T * 0.12 * e.s, e.col, a * 0.45); G.Q.glow(Xs, Ys, T * 0.035 * e.s, '#FFFFFF', a * 0.7); }
        gpuEnd(c, G); },
      refresh() { glows = null; } }; }
  function hookRift() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.dunes; if (!Rf || Rf.__dpp) return; Rf.__dpp = 1;
    const oe = Rf.everyStage; Rf.everyStage = function (X, self, H) { let a = {}; try { a = oe ? oe.apply(this, arguments) || {} : {}; } catch (e) { a = {}; } if (off()) return a; let L = null; try { L = lights(X, self, H); } catch (e) { L = null; } if (!L) return a; LIVE = L; QL.length = 0;
      return Object.assign({}, a, { update(dt) { if (a.update) a.update(dt); L.update(dt); }, drawGround(c) { if (a.drawGround) a.drawGround(c); L.drawGround(c); }, drawOver(c) { if (a.drawOver) a.drawOver(c); L.drawOver(c); }, dpp: L }); };
    const op = Rf.preload; Rf.preload = function (P) { let a = []; try { a = op ? op.apply(this, arguments) || [] : []; } catch (e) {} let b = []; try { b = warm(P); } catch (e) {} return a.concat(b); }; } catch (e) {} }
  hookRift();

  /* ======================= the puzzles' pieces, drawn (20r's "v433 DE" hooks) ======================= */
  /* the Sandstorm Flight: the storm's streaks and the gusts' warning (light), the fossil ribs (a shaft texture and a knuckle),
     the faint glow in each gap still to fly, the amber shards (picture and light), the cairn, the shield's blink */
  function glide(c, X, R, ribs, o) { if (!ready(X)) return false; const T = X.Tz(), W = X.W(), me = X.me, L = 'dusk', GH = (o && o.H) || 11;
    const sh = tex('ribshaft:dusk', Math.min(CAP, Math.round(T * kOf(c)))), t0 = pic(c, 'ribtip', 0, T, L), t1 = pic(c, 'ribtip', 1, T, L), am = pic(c, 'amber', 0, T, L), ca = pic(c, 'cairn', 0, T, L);
    if (!sh || !t0 || !t1 || !am || !ca) return false; STATS.hooks++;
    const lf = lowFx();
    // the storm: sand streaks blowing left (soft light), the gust's chevrons before and while it blows
    for (let i = 0; i < (lf ? 10 : 20); i++) { const wy = 1 + ((i * 37) % 61) / 61 * (GH - 2), ph = ((i * 53) % 97) / 97, wx = me.x + 9 - ((ph + R.t * 1.4 + i * 0.1) % 1) * 18, Xs = X.sx(wx), Ys = X.sy(wy); if (Xs < -20 || Xs > W + 20) continue; ql('beam', Xs, Ys, Xs + T * 1.1, Ys, T * 0.03, SAND, 0.32); }
    if (R.windWarn > 0 || R.wind > 0) { const a = R.wind > 0 ? 0.5 : 0.28 + 0.18 * Math.sin(R.t * 12); for (let k = 0; k < 6; k++) { const xx = X.sx(me.x - 3 + k * 1.4), yy = X.sy(me.y) + (R.windDir < 0 ? 1 : -1) * ((R.t * 90 + k * 40) % 120 - 60), d = R.windDir; ql('beam', xx - T * 0.3, yy + d * T * 0.25, xx, yy - d * T * 0.15, T * 0.05, CYAN, a); ql('beam', xx, yy - d * T * 0.15, xx + T * 0.3, yy + d * T * 0.25, T * 0.05, CYAN, a); } }
    const shaft = (Xs, ya, yb, anchor) => { if (yb - ya < 1) return; c.save(); c.beginPath(); c.rect(Xs - T * 0.6, ya, T * 1.2, yb - ya); c.clip(); const th = T * 2, w = T; let y0 = anchor - Math.ceil((anchor - ya) / th) * th; for (let y = y0; y < yb; y += th) c.drawImage(sh.cv, Xs - w / 2, y, w, th + 0.5); c.restore(); };
    for (const rb of ribs) { const X0 = X.sx(rb.x); if (X0 < -60 || X0 > W + 60) continue; const Xs = X0 + (rb.hitT > 0.6 ? Math.sin(R.t * 40) * 3 : 0), yTop = X.sy(rb.gapY - rb.gapH / 2), yBot = X.sy(rb.gapY + rb.gapH / 2), y0 = X.sy(0.5), y1 = X.sy(GH + 0.5);
      c.save(); if (rb.passed) c.globalAlpha *= 0.82;
      shaft(Xs, y0, yTop - T * 0.6, yTop); put(c, t0, Xs, yTop, T);
      shaft(Xs, yBot + T * 0.6, y1, yBot); put(c, t1, Xs, yBot, T);
      c.restore();
      if (!rb.passed) { const gh = yBot - yTop; ql('glow', Xs, (yTop + yBot) / 2, T * 0.7, CYAN, 0.3 + 0.1 * Math.sin(R.t * 4 + rb.ph), Math.max(0.6, gh / (T * 1.4))); ql('glow', Xs, yTop + T * 0.15, T * 0.4, CYAN, 0.25); ql('glow', Xs, yBot - T * 0.15, T * 0.4, CYAN, 0.25); }
      if (rb.shard && !rb.shard.got) { const sy2 = X.sy(rb.gapY) + Math.sin(R.t * 3 + rb.ph) * T * 0.08; put(c, am, Xs, sy2 + T * 0.12, T); ql('glow', Xs, sy2, T * 0.62, AMBER, 0.5 + 0.12 * Math.sin(R.t * 5 + rb.ph)); ql('glow', Xs, sy2, T * 0.18, '#FFF6D8', 0.6); } }
    if (R.cairn) { const Xs = X.sx(R.cairn.x), Ys = X.sy(R.cairn.y + 0.6); put(c, ca, Xs, Ys + T * 0.12, T); }
    if (R.inv > 0 && R.mode === 'run') { const Xs = X.sx(me.x), Ys = X.sy(me.y) - T * 0.5; ql('ring', Xs, Ys, T * 0.72, '#FFFFFF', 0.35 + 0.3 * Math.sin(R.t * 20), T * 0.12); }
    return true; }
  /* the Grub Mounds: the mounds, the grub or hooded manta rising out of one, the trembling mound's tell (light only), the eyes */
  function mounds(c, X, R, list) { if (!ready(X)) return false; const T = X.Tz(), L = BIO_L[(X.F && X.F.biome)] || 'night';
    const mp = pic(c, 'mound', 0, T, L), gp = pic(c, 'grubpop', 0, T, L), mt = pic(c, 'mantapop', 0, T, L); if (!mp || !gp || !mt) return false; STATS.hooks++;
    for (const mo of list) { const Xs = X.sx(mo.x), Ys = X.sy(mo.y), tr = mo.state === 'tremble' ? Math.sin(R.t * 40) * 2 : 0;
      put(c, mp, Xs + tr, Ys + T * 0.14, T);
      if (mo.state === 'tremble') { const k = 0.55 + 0.45 * Math.sin(R.t * 20), col = mo.kind === 'manta' ? CYAN : AMBER; ql('ring', Xs, Ys - T * 0.05, T * 0.95, col, 0.55 * k, T * 0.2, 0.5); ql('glow', Xs, Ys - T * 0.1, T * 1.1, col, 0.22 * k, 0.5); }
      if (mo.state === 'up') { const u = Math.min(1, mo.t * 6), h = T * 1.1 * u, left = 1 - mo.t / mo.up;
        put(c, mo.kind === 'manta' ? mt : gp, Xs, Ys - T * 0.08, T, 1, Math.max(0.05, u));
        if (mo.kind === 'manta') { ql('glow', Xs, Ys - h * 0.62, T * 0.95, CYAN, 0.42); for (const s of [-1, 1]) ql('glow', Xs + s * T * 0.17, Ys - T * 0.08 - T * 0.68 * u, T * 0.16, '#DFFFFF', 0.6); }
        else { ql('glow', Xs, Ys - T * 0.08 - T * 0.7 * u, T * 0.32, AMBER, 0.55); ql('glow', Xs, Ys - T * 0.05, T * 0.9, OCHRE_L, 0.12, 0.45);
          c.save(); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 4; c.beginPath(); c.arc(Xs, Ys - h - T * 0.25, T * 0.2, 0, TAU); c.stroke(); c.strokeStyle = AMBER; c.lineWidth = 2.5; c.beginPath(); c.arc(Xs, Ys - h - T * 0.25, T * 0.2, -Math.PI / 2, -Math.PI / 2 + TAU * left); c.stroke(); c.restore(); } } }
    return true; }
  const OCHRE_L = '#E8B070';
  /* the Echo Chamber: a resonator stone (its picture), its light (the bands and the crown; bright while it rings), its number */
  function resonator(c, Xs, Ys, T, o, COLS) { const X = LIVE && LIVE.X; if (!ready(X)) return false; const s = pic(c, 'resonator', o.i % 6, T, BIO_L[(X.F && X.F.biome)] || 'noon'); if (!s) return false; STATS.hooks++;
    const k = o.lit || 0, SC = (COLS || STONE_COL)[o.i % 6];
    put(c, s, Xs, Ys, T);
    ql('glow', Xs, Ys - T * 0.9, T * (0.75 + k * 1.1), SC, 0.1 + 0.5 * k, 1.5); for (const b of BANDS) ql('glow', Xs, Ys - T * b, T * (0.34 + 0.12 * k), SC, 0.22 + 0.55 * k, 0.4);
    if (k > 0.2) ql('glow', Xs, Ys - T * 1.62, T * 0.4 * k, '#FFFFFF', 0.6 * k);
    c.save(); c.font = `800 ${Math.round(T * 0.26)}px ${typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = SC; c.strokeText(`${o.i + 1}`, Xs, Ys - T * 1.92); c.fillText(`${o.i + 1}`, Xs, Ys - T * 1.92); c.restore();
    return true; }

  const API = { draw, sprite: (n, v, P, L) => sprite(n, v, P, true, L), pic, tex, texJobs, warm, release, trimKinds, glowsOf, install, glide, mounds, resonator, OLD, DEF, TDEF, KINDS, DEC, DECALS_OF: DECS_OF, HPK, DEBRIS, BURSTS, LIGHT, BIO_L, QL,
    get live() { return LIVE; }, get base() { return BASE; }, set base(v) { if (v > 2) BASE = Math.round(v); },
    get stats() { return Object.assign({ cached: CACHE.size, textures: TEX.size, texKeys: [...TEX.keys()], px: [...CACHE.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) + [...TEX.values()].reduce((a, q) => a + q.cv.width * q.cv.height, 0) }, STATS); },
    _k: { lump, prism, halo, socket, hole, sandM, sandstoneM, basaltM, boneM, clayM, redrockM, crystalM, nstoneM, deadwoodM, ribM, lit, pvn, pfbm, pcell, field } };
  if (HAS_W) window.DUNE_PROPS = API;
  return API;
})();
