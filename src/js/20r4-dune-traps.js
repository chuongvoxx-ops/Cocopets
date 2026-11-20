/* ---------- v433 DT: The Mouth Beneath the Dunes' traps (Rift 03, its three sections' dungeons and two of its puzzles) ----------
   Nine original traps, three to each of the rift's lands, laid through its fight stages (the Buried Road, the Tooth Courts,
   the Rust Flats, the Crystal Scar, the Moonlit Barrows, the Throat of Sand) in their rooms and on their stone causeways, on
   top of the floor's own sand spouts and the Tower's traps (left as they were), and a few in the bowls of two puzzles where
   they cannot touch the rules (the Echo Chamber's corners, the Grub Mounds' open sand). None in the Sandstorm Flight (the pet
   flies there) or the boss arenas. Each TELLS by its own glow and motion only (no red area circles, no countdowns):
   Section 1, under the jaw (ochre dunes, black basalt, bleached bone, cyan resonance):
     sink   SAND SINKS         a shallow funnel in the sand: step on it and the sand turns, amber light winding into its hole
                               and pulling toward it, then the hole gulps (its middle, r 0.72); walk out of the swirl, or roll
     tooth  BONE-TOOTH SNAPS   a fossil jaw buried across the way, its teeth just showing: cross it and they rise as cyan
                               light runs along their roots, then they snap shut along it; keep moving, never stop on it
     res    RESONANCE STONES   a carved basalt stone: its three bands light from the foot up as it hums, then a ring of
                               resonance rolls out along the floor to 2.6 tiles (it hits where it passes): roll through it
   Section 2, the Rust Flats (sun-baked clay, layered red rock, pink crystals):
     vent   CLAY VENTS         a dome of cracked clay: its cracks glow orange to white and dust rises faster, then hot dust
                               and steam blast up from it (r 1.15)
     shard  CRYSTAL BURSTS     a cluster of pink crystals: when anything comes near its heart brightens and hums and five
                               lines of light run out along the floor from it, then shards fly along those lines
     mirage HEAT MIRAGES       a patch of sun-glazed clay that shimmers like water: the heat slows the pet inside it (no harm)
   Section 3, the Moonlit Dunes (night sand washed blue, green fireflies, the walking bones):
     hands  GRASPING HANDS     a patch of disturbed sand, finger bones showing: when anything comes near green light seeps up
                               through it and the fingers claw out, then two bone hands burst up and grab (r 1.05; held a moment)
     quick  MOONLIT QUICKSAND  a pool of fine pale sand turning slowly under the moon: the pet wades it slowly, and if it
                               lingers (1.7 s) the sand swallows it a little (a small blow) and spits it out
     gas    GRAVE-GAS          a broken grave slab on a low mound: green light wells in its cracks and gas bubbles faster,
                               then a cloud of grave-gas puffs out (r 1.3) and leaves the pet choking (slowed) for a moment
   Damage is the floor's own (as the Garden's traps, 20p4): 12 x the floor's dmgMul times each kind's share, held to 4..14% of
   the pet's health, through hurtPet with no source (traps are not foes: the rift's foeK does not double them). Monsters caught
   take twice it (as the floor hazards hit them); bosses and mini bosses are never touched. A dodge roll passes through every
   one of them. Only traps within 13 tiles of the pet run; the first of each kind the pet meets in a session plays once,
   harmlessly ("Safe to watch"), with a banner naming its tell.
   Density rises section by section (rooms + causeways): S1 11+3 / 12+4, S2 14+6 / 15+7, S3 17+9 / 18+10 (2.5 / 2.2 / 1.9
   tiles apart; a cramped floor gets what fits), placed deterministically from the layout on plain floor, kept off the start,
   the way on, the packs, shrines, stones, pots, the sand spouts and the Tower's traps; the puzzles' few kept off their pieces.
   Round traps lie on the floor as ellipses (depth 0.7 of their width) and hit in those same ellipses. No trap is solid.
   Art: every model is painted once per sharpness by the Belfry's software shading pass (BELPROPS.kit, 20n9) in its land's
   own light (dusk ochre under the jaw, a white noon over the Rust Flats, blue moonlight with a firefly-green rim at night),
   with a second picture of its own light (spiral grooves, tooth roots, carved bands, cracks, crystal hearts, glaze, seep)
   laid over additively as it builds, so the tell reads in the picture itself. The live light (the swirl, the rolling ring,
   the dust column, the flying shards, the gas, the moonlit sheen) is the GPU painter's (NIDHOGG_MOVES.FGFX) with its
   existing kinds; nothing is painted per frame. Without WebGL the pictures and their light layers still tell (no new 2D
   effects). st.lowFx drops the calm traps' breathing light and thins the motes and puffs.
   Memory: the field and the pictures are let go when a stage is made or closed (GAMES.dungeon create / destroy, and
   BEL.onRelease); the pictures are warmed on the loading screen (the stages' S.preload) for the kinds that stage uses.
   window.__DT = 0 turns all of it off (the floors as before).
   API (global DUNE_TRAPS): place(X, H, { sec, n, seed, count, br, kinds, teach, puzzle }) -> field; clear(); release(); KINDS;
   SPEC; MIX; fields(); dmg(field, kind); stats; draw(c, name, v, Xs, Ys, T, o); sprite(name, v, P); warm(P, sec, kinds) */
var DUNE_TRAPS = (() => {
  const TAU = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v, hyp = Math.hypot, lerp = (a, b, u) => a + (b - a) * u, ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const W_ = () => typeof window !== 'undefined' ? window : {};
  const off = () => W_().__DT === 0;
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const BP = () => { const w = W_(); return (w.BELPROPS && w.BELPROPS.kit && w.__BELP !== 0 && !off()) ? w.BELPROPS : null; };
  const fgx = () => { try { if (W_().__DT_GL === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const hh = (a, b) => { let n = (a * 374761393 + b * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const R1 = s => { let x = (s >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0, fields: 0, gpu: 0 };

  /* ======================= the kinds ======================= (times in s, sizes in tiles) */
  const KINDS = {
    sink: { land: 1, name: 'SAND SINKS', tell: 'Step on a sink and its sand turns, amber light winding into its hole and pulling you in, then the hole gulps: walk out of the swirl, or roll', col: '#F2B45A', hi: '#FFF0C8', dmgK: 1.0, r: 1.25, core: 0.72, warn: 1.5, burst: 0.45, hitW: 0.3, rest: 3.5, pull: 1.35, shove: 1.2 },
    tooth: { land: 1, name: 'BONE-TOOTH SNAPS', tell: 'Cross the buried jaw and its teeth rise as cyan light runs along their roots, then they snap shut: keep moving, never stop on it', col: '#7FE6EE', hi: '#E8FFFF', dmgK: 0.9, warn: 0.7, burst: 0.4, hitW: 0.22, rest: 3.0, w: 0.55, len: 2.2, shove: 1.0 },
    res: { land: 1, name: 'RESONANCE STONES', tell: 'The stone\'s bands light from its foot up as it hums, then a ring of resonance rolls out along the floor: roll through the ring, or stand beyond it', col: '#62E0F0', hi: '#E6FFFF', dmgK: 0.85, R: 2.6, warn: 1.5, burst: 0.7, band: 0.36, shove: 1.3, per: [4.6, 6.2] },
    vent: { land: 2, name: 'CLAY VENTS', tell: 'The clay\'s cracks glow from orange to white as dust rises faster, then hot dust and steam blast up: step off it', col: '#FF9A48', hi: '#FFF0D0', dmgK: 1.0, r: 1.15, warn: 1.4, burst: 0.75, hitW: 0.5, shove: 1.3, per: [4.8, 6.4] },
    shard: { land: 2, name: 'CRYSTAL BURSTS', tell: 'Come near a crystal cluster and its heart brightens and hums as lines of light run out from it, then shards fly along those lines: step between them', col: '#FF6FCB', hi: '#FFE6F6', dmgK: 1.1, trig: 1.9, warn: 0.95, burst: 0.35, hitW: 0.22, rest: 5.0, rays: 5, len: 2.4, w: 0.36, shove: 1.1 },
    mirage: { land: 2, name: 'HEAT MIRAGES', tell: 'Sun-glazed clay shimmers like water: the heat slows you inside it. Go round it, or roll across', col: '#BFE6FF', hi: '#FFFFFF', dmgK: 0, r: 1.2, slowK: 0.6 },
    hands: { land: 3, name: 'GRASPING HANDS', tell: 'Come near the disturbed sand and green light seeps up as fingers claw out, then bone hands burst up and grab: keep clear, or roll past', col: '#7CFF6A', hi: '#E0FFD8', dmgK: 1.0, trig: 1.6, r: 1.05, warn: 0.85, burst: 0.5, hitW: 0.3, rest: 4.5, hold: 0.8, holdK: 0.15 },
    quick: { land: 3, name: 'MOONLIT QUICKSAND', tell: 'Moonlit sand turns slowly: you wade it slowly, and if you linger the sand swallows you a little. Keep moving across, or go round', col: '#A8C8FF', hi: '#EAF2FF', dmgK: 0.6, r: 1.1, slowK: 0.5, sinkT: 1.7, shove: 1.4 },
    gas: { land: 3, name: 'GRAVE-GAS', tell: 'Green light wells in the grave\'s cracks and gas bubbles faster, then a cloud of grave-gas puffs out and leaves you choking: step away', col: '#8CFF7A', hi: '#E8FFE0', dmgK: 0.9, r: 1.3, warn: 1.6, burst: 0.8, hitW: 0.55, choke: 1.2, slowK: 0.72, shove: 1.0, per: [5.0, 6.8] },
  };
  /* per section: [first dungeon, second dungeon] { n: in the rooms, br: on the causeways }, the rooms' mix (weights), the
     causeways' kinds, the spacing; the puzzles' few */
  const SPEC = { 1: [{ n: 11, br: 3 }, { n: 12, br: 4 }], 2: [{ n: 14, br: 6 }, { n: 15, br: 7 }], 3: [{ n: 17, br: 9 }, { n: 18, br: 10 }] };
  const MIX = { 1: { sink: 4, tooth: 3, res: 4 }, 2: { vent: 5, shard: 4, mirage: 3 }, 3: { hands: 5, quick: 3, gas: 5 } };
  const BRIDGE = { 1: ['tooth', 'res'], 2: ['vent', 'mirage'], 3: ['hands', 'quick', 'gas'] };
  const GAP = { 1: 2.5, 2: 2.2, 3: 1.9 };
  const PUZ = { 'The Echo Chamber': { kinds: ['vent', 'vent', 'mirage', 'vent'], n: 4 }, 'The Grub Mounds': { kinds: ['hands', 'gas', 'quick', 'hands', 'gas'], n: 5 } };
  const HAND_K = 1.4, SHARD_K = 1.2, RES_K = 1.12, LINE = { tooth: 1 }, ZONE = { mirage: 1, quick: 1 }, STAND = { tooth: 1, res: 1, shard: 1, hands: 1, gas: 1 };
  const kindsOf = sec => Object.keys(MIX[sec] || MIX[1]).concat(BRIDGE[sec] || []).filter((k, i, a) => a.indexOf(k) === i);

  /* ======================= the pictures (BELPROPS.kit, in each land's light) ======================= */
  const FR = 0.7;   // (a round thing lying on the floor, as these pictures draw it and its hit area is measured: its depth over its width)
  const LIGHTS = {   // (each land's: a0/a1 ambient low/high, e0/e1 the sky's reflection low/high, k the key, rim, bo the floor's bounce)
    1: { a0: [0.13, 0.07, 0.08], a1: [0.12, 0.06, 0.1], e0: [0.15, 0.08, 0.09], e1: [0.6, 0.4, 0.4], k: [1.3, 1.1, 0.9], rim: [0.18, 0.42, 0.46], bo: [0.2, 0.12, 0.05] },
    2: { a0: [0.18, 0.1, 0.07], a1: [0.12, 0.1, 0.12], e0: [0.2, 0.11, 0.07], e1: [0.62, 0.56, 0.56], k: [1.34, 1.2, 1.02], rim: [0.48, 0.24, 0.36], bo: [0.3, 0.13, 0.05] },
    3: { a0: [0.04, 0.06, 0.12], a1: [0.05, 0.07, 0.16], e0: [0.04, 0.06, 0.13], e1: [0.24, 0.32, 0.52], k: [0.74, 0.86, 1.18], rim: [0.2, 0.55, 0.26], bo: [0.03, 0.06, 0.11] } };
  function lit(K, land, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHTS[land] || LIGHTS[1]); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }
  const E = (k, r, g, b) => { const M = k.M; M.r = M.g = M.b = 0; M.fr = M.fg = M.fb = 0; M.mt = 0; M.rg = 1; M.cc = 0; M.sh = 0; M.ao = 0; M.er = r; M.eg = g; M.eb = b; };   // (a light layer: emission only)
  // cells (mud cracks, crazing): the distances to the nearest two cell points of a jittered grid -> [d1, d2]
  const CEL = [0, 0];
  function cells(x, y, sd) { const xi = Math.floor(x), yi = Math.floor(y); let d1 = 9, d2 = 9; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i, cy = yi + j, px = cx + 0.12 + 0.76 * hh(cx * 7 + sd, cy * 13 + 1), py = cy + 0.12 + 0.76 * hh(cx * 11 + 3, cy * 5 + sd), d = hyp(x - px, y - py); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; } CEL[0] = d1; CEL[1] = d2; return CEL; }
  // materials (each sets k.M)
  function sandM(k, u, v, sd, land) { const { M, vn, fbm } = k, g = fbm(u * 2.6 + sd, v * 2.6), gr = vn(u * 40 + sd, v * 40), rip = 0.5 + 0.5 * Math.sin((u * 0.6 + v) * 19 + vn(u * 2, v * 2) * 5);
    if (land === 3) { M.r = 0.25 * (0.8 + 0.35 * g); M.g = 0.35 * (0.8 + 0.35 * g); M.b = 0.52 * (0.8 + 0.3 * g); }   // (each near its land's floor, as its light shows it)
    else if (land === 2) { M.r = 0.9 * (0.8 + 0.3 * g); M.g = 0.5 * (0.8 + 0.3 * g); M.b = 0.24 * (0.8 + 0.3 * g); }
    else { M.r = 0.95 * (0.8 + 0.3 * g); M.g = 0.84 * (0.8 + 0.3 * g); M.b = 0.6 * (0.8 + 0.3 * g); }
    const t = 0.9 + 0.1 * rip + 0.12 * (gr - 0.5); M.r *= t; M.g *= t; M.b *= t; M.rg = 0.88; if (gr > 0.84) { M.r *= 1.18; M.g *= 1.16; M.b *= 1.12; } }
  function boneM(k, u, v, sd, land, stain) { const { M, vn, fbm, ss } = k, g = fbm(u * 3 + sd, v * 5), p = vn(u * 33 + sd, v * 33), cr = ss(0.04, 0.0, Math.abs(vn(u * 5 + sd, v * 2.3) - 0.5));
    if (land === 3) { M.r = 0.86; M.g = 0.9; M.b = 0.96; } else { M.r = 0.86; M.g = 0.8; M.b = 0.66; }
    const t = 0.82 + 0.25 * g; M.r *= t; M.g *= t; M.b *= t; M.rg = 0.62; M.cc = 0.12; if (p > 0.72) M.ao *= 1 - (p - 0.72) * 1.6; M.ao *= 1 - 0.5 * cr;
    if (stain > 0) { const s2 = clamp(stain, 0, 1); M.r = lerp(M.r, land === 3 ? 0.2 : 0.55, s2 * 0.6); M.g = lerp(M.g, land === 3 ? 0.26 : 0.36, s2 * 0.6); M.b = lerp(M.b, land === 3 ? 0.38 : 0.2, s2 * 0.6); } }
  function basaltM(k, u, v, sd) { const { M, vn, fbm, ss } = k, w = fbm(u * 3.4 + sd, v * 3.4), p = vn(u * 24 + sd, v * 24), t = 0.085 + 0.06 * (w - 0.5); M.r = t * 1.05; M.g = t * 0.98; M.b = t * 1.12; M.rg = 0.55; M.cc = 0.18;
    if (p > 0.76) { const q = ss(0.76, 0.88, p); M.ao *= 1 - 0.35 * q; } const ch = vn(u * 6 + 4, v * 6 + sd); if (ch > 0.72) { M.r *= 1.6; M.g *= 1.55; M.b *= 1.6; } }
  function clayM(k, u, v, sd, burnt) { const { M, vn, fbm, ss } = k, g = fbm(u * 3 + sd, v * 3), c = cells(u * 2.4, v * 2.4, sd | 0), e = c[1] - c[0], crack = ss(0.07, 0.015, e), lift = ss(0.0, 0.35, e);
    M.r = 0.86 * (0.82 + 0.3 * g); M.g = 0.47 * (0.82 + 0.3 * g); M.b = 0.24 * (0.82 + 0.3 * g); M.rg = 0.86; const pale = ss(0.15, 0.45, e) * 0.25; M.r += pale * 0.3; M.g += pale * 0.2; M.b += pale * 0.12;
    if (burnt) { const b = burnt * ss(0.3, 0.75, vn(u * 4 + 7, v * 4 + sd)); M.r *= 1 - 0.45 * b; M.g *= 1 - 0.5 * b; M.b *= 1 - 0.45 * b; }
    M.ao *= (1 - 0.75 * crack) * (0.85 + 0.15 * lift); return crack; }
  function nightStoneM(k, u, v, sd) { const { M, vn, fbm } = k, g = fbm(u * 3 + sd, v * 3), p = vn(u * 20, v * 20 + sd), lic = vn(u * 7 + 9, v * 7); M.r = 0.24 * (0.8 + 0.35 * g); M.g = 0.27 * (0.8 + 0.35 * g); M.b = 0.34 * (0.8 + 0.3 * g); M.rg = 0.8; if (p > 0.74) M.ao *= 0.8; if (lic > 0.7) { M.r *= 0.8; M.g *= 1.05; M.b *= 0.85; } }
  /* a thing lying on the floor: box [x0, w0, x1, w1] in the floor's own tiles (x right, w toward us), fr its depth on the
     picture (FR for round things, 1 for things laid along a lane); hf(x, w) its height (tiles, for the light only), mf(x, w, h)
     sets k.M and returns its alpha (0: no pixel). Its normal is turned a little toward us (the kit's rim and sky are made for
     upright things and wash a flat floor out) */
  function flat(k, S, box, fr, hf, mf) { const P = S.P, e = 0.015; S.lock();
    const xa = Math.max(0, Math.floor(S.ax + box[0] * P)), xb = Math.min(S.w - 1, Math.ceil(S.ax + box[2] * P)), ya = Math.max(0, Math.floor(S.ay + box[1] * fr * P)), yb = Math.min(S.h - 1, Math.ceil(S.ay + box[3] * fr * P));
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { const x = (px + 0.5 - S.ax) / P, w = (py + 0.5 - S.ay) / P / fr; k.M0(); const h = hf(x, w), a = mf(x, w, h); if (!(a > 0.003)) continue;
      const hx = (hf(x + e, w) - hf(x - e, w)) / (2 * e), hw = (hf(x, w + e) - hf(x, w - e)) / (2 * e), nx = -hx, ny = -hw + 0.62, l = hyp(nx, ny, 1); k.shade(nx / l, ny / l, 1 / l); k.put(S, px, py, a); } }
  // an irregular rim: its radius about 1 round angle a
  const rimOf = (k, sd, amp) => a => 1 + amp * (k.vn(Math.cos(a) * 1.7 + sd, Math.sin(a) * 1.7) - 0.5) * 2;
  // a pointed crystal: feet (x, y) tiles, width w, height h, leaning by lean (radians), three faces and two facets; mat(face, t) sets k.M (face -1 left, 0 front, 1 right; t up 0..1)
  function prism(k, S, x, y, w, h, lean, mat) { const P = S.P, c = Math.cos(lean), s = Math.sin(lean), tb = 0.74, X0 = S.ax + x * P, Y0 = S.ay + y * P, R = (h + w) * P; S.lock();
    for (let py = Math.max(0, Math.floor(Y0 - R)); py <= Math.min(S.h - 1, Math.ceil(Y0 + w * P)); py++) for (let px = Math.max(0, Math.floor(X0 - R)); px <= Math.min(S.w - 1, Math.ceil(X0 + R)); px++) {
      const dx = (px + 0.5 - X0) / P, dy = (py + 0.5 - Y0) / P, lx = dx * c + dy * s, ly = -(-dx * s + dy * c), t = ly / h, q = lx / (w / 2); if (t < -0.02 || t > 1) continue;
      const lim = t <= tb ? 1 : (1 - t) / (1 - tb); if (Math.abs(q) > lim + 1 / (w * P)) continue; const f = q < -lim / 3 ? -1 : q > lim / 3 ? 1 : 0, tip = t > tb;
      const nx = f * 0.78, ny = f ? 0.62 : 1, nz = tip ? 0.55 : 0, rx = nx * c + nz * s, rz = nz * c - nx * s, l = hyp(rx, ny, rz); k.M0(); k.M.ao = 0.75 + 0.25 * clamp(t * 2, 0, 1); mat(f, t, q / lim); k.shade(rx / l, ny / l, rz / l);
      k.put(S, px, py, clamp((lim - Math.abs(q)) * w * P * 0.5 + 0.6, 0, 1) * clamp((t + 0.02) * h * P + 0.6, 0, 1)); } }

  /* ---- 1. the sand sink (feet at its middle): a shallow funnel, spiral grooves winding into a dark hole, bones half swallowed at
     its rim; 'sinkg' the grooves' and the hole's light ---- */
  const SINK_RX = 1.38;
  function paintSink(k, S, v, glowL) { const sd = 3 + v * 5, rho = rimOf(k, sd, 0.06), RX = SINK_RX;
    const q = (x, w) => { const a = Math.atan2(w, x); return hyp(x, w) / (RX * rho(a)); };
    const groove = (x, w) => { const r = hyp(x, w), a = Math.atan2(w, x); return Math.sin(r * 15 - a * 2 + sd); };
    const hf = (x, w) => { const r = q(x, w); if (r >= 1) return 0; return -0.32 * Math.pow(1 - r, 1.7) + 0.012 * groove(x, w) * r * (1 - r) * 4 + 0.03 * Math.exp(-Math.pow((r - 0.9) / 0.07, 2)); };
    if (!glowL) k.contact(S, 0, 0, RX * 1.05, RX * FR * 1.02, 0.18);
    flat(k, S, [-RX * 1.1, -RX * 1.1, RX * 1.1, RX * 1.1], FR, hf, (x, w, h) => { const r = q(x, w); if (r >= 1) return 0; const al = clamp((1 - r) * RX * S.P * 1.6 + 0.3, 0, 1) * k.ss(1.0, 0.85, r) ;
      const gv = 0.5 + 0.5 * groove(x, w), hole = k.ss(0.16, 0.05, r);
      if (glowL) { const g2 = k.ss(0.72, 0.98, gv) * k.ss(1.0, 0.25, r) * (0.4 + 0.6 * k.ss(0.0, 0.6, 1 - r)); E(k, 1.25 * g2 + 1.1 * hole, 0.72 * g2 + 0.55 * hole, 0.22 * g2 + 0.12 * hole); return al * Math.max(g2, hole) > 0.003 ? al : 0; }
      sandM(k, x * 1.3, w * 1.3, sd, 1); const M = k.M, deep = k.ss(0.85, 0.1, r); M.r *= 1 - 0.45 * deep; M.g *= 1 - 0.5 * deep; M.b *= 1 - 0.42 * deep; M.ao *= 1 - 0.55 * deep * (1 - gv * 0.5);
      if (hole > 0) { M.r = lerp(M.r, 0.04, hole); M.g = lerp(M.g, 0.025, hole); M.b = lerp(M.b, 0.03, hole); M.er = 0.12 * hole; M.eg = 0.05 * hole; } return al; });
    if (glowL) return;
    const R = k.R1(71 + v * 13), M = k.M;
    // bones half swallowed at its rim, and basalt grit sliding in
    for (let i = 0; i < 3; i++) { const a = R() * TAU, d = 0.72 + R() * 0.2, x = Math.cos(a) * d * RX, y = Math.sin(a) * d * RX * FR, ang = a + Math.PI / 2 + (R() - 0.5) * 0.8, L = 0.22 + R() * 0.18;
      k.tube(S, [[x - Math.cos(ang) * L, y - Math.sin(ang) * L * FR], [x + Math.cos(ang) * L, y + Math.sin(ang) * L * FR - 0.03]], 0.045, 0.04, (t, s) => boneM(k, t * 3 + i, s, sd, 1, k.ss(0.4, 0, Math.abs(t - 0.5)) * 0.3));
      k.ball(S, x + Math.cos(ang) * L, y + Math.sin(ang) * L * FR - 0.03, 0.06, 0.055, (dx, dy) => boneM(k, dx * 3, dy * 3 + i, sd, 1, 0)); }
    for (let i = 0; i < 9; i++) { const a = R() * TAU, d = 0.25 + R() * 0.7, r0 = 0.02 + R() * 0.035; k.ball(S, Math.cos(a) * d * RX, Math.sin(a) * d * RX * FR, r0, r0 * 0.75, (dx, dy) => basaltM(k, dx + i, dy, sd)); }
    S.unlock(); k.ink(S, [40, 20, 16], 0.18); S.unlock();
    const c = S.c; c.save(); for (let i = 0; i < 40; i++) { const a = R() * TAU, d = Math.sqrt(R()) * RX * 0.95, s2 = 0.01 + R() * 0.014; c.fillStyle = R() < 0.5 ? `rgba(255,236,190,${0.25 + R() * 0.3})` : `rgba(60,30,20,${0.2 + R() * 0.25})`; c.fillRect(Math.cos(a) * d - s2 / 2, Math.sin(a) * d * FR - s2 / 2, s2, s2); } c.restore(); }

  /* ---- 2. the buried jaw (feet at its middle; 'h' across the screen, 'v' into it): two ridges of fossil jawbone either side of
     the lane with their sockets, sand between; 'jawg' the sockets' and roots' light; 'fang' a single tooth (feet 0, 0; v 0..2),
     'fangg' its light ---- */
  const JAW_L = 1.22, JAW_T = 0.42;
  function paintJaw(k, S, o, glowL) { const sd = o === 'v' ? 4.2 : 8.8, along = (x, w) => o === 'v' ? w : x, across = (x, w) => o === 'v' ? x : w;
    const hf = (x, w) => { const s = along(x, w), t = across(x, w), end = k.ss(JAW_L + 0.05, JAW_L - 0.25, Math.abs(s)), rid = Math.exp(-Math.pow((Math.abs(t) - JAW_T) / 0.1, 2)) * end, sock = Math.exp(-Math.pow(((s * 2.8 + (t > 0 ? 0.5 : 0)) % 1 + 1) % 1 - 0.5, 2) / 0.02) * Math.exp(-Math.pow((Math.abs(t) - JAW_T + 0.04) / 0.05, 2)) * end; return 0.08 * rid - 0.04 * sock - 0.025 * Math.exp(-t * t / 0.05) * end; };
    const b = o === 'v' ? [-0.75, -1.45, 0.75, 1.45] : [-1.45, -0.75, 1.45, 0.75];
    if (!glowL) k.contact(S, 0, 0, o === 'v' ? 0.7 : 1.45, o === 'v' ? 1.4 : 0.6, 0.22);
    flat(k, S, b, 1, hf, (x, w, h) => { const s = along(x, w), t = across(x, w), end = k.ss(JAW_L + 0.12, JAW_L - 0.1, Math.abs(s)), band = k.ss(0.72, 0.5, Math.abs(t)); const al = end * band; if (al < 0.003) return 0;
      const rid = Math.exp(-Math.pow((Math.abs(t) - JAW_T) / 0.11, 2)), sockv = h < -0.012 ? k.ss(-0.012, -0.03, h) : 0;
      if (glowL) { const g = sockv * 1.0 + 0.35 * Math.exp(-Math.pow((Math.abs(t) - JAW_T + 0.08) / 0.05, 2)) * k.ss(JAW_L, JAW_L - 0.3, Math.abs(s)); E(k, 0.35 * g, 1.15 * g, 1.25 * g); return g > 0.01 ? al : 0; }
      sandM(k, x * 1.2, w * 1.2, sd, 1); const M = k.M; if (rid > 0.25) { const q2 = k.ss(0.25, 0.7, rid); const r0 = M.r, g0 = M.g, b0 = M.b; boneM(k, s * 2, t * 6, sd, 1, 0.4 * (1 - q2)); M.r = lerp(r0, M.r, q2); M.g = lerp(g0, M.g, q2); M.b = lerp(b0, M.b, q2); }
      if (sockv > 0) { M.r *= 1 - 0.7 * sockv; M.g *= 1 - 0.65 * sockv; M.b *= 1 - 0.55 * sockv; M.eg = 0.05 * sockv; M.eb = 0.06 * sockv; } M.ao *= 1 - 0.35 * Math.exp(-t * t / 0.04); return al; });
    if (glowL) return; S.unlock(); k.ink(S, [40, 22, 18], 0.15); }
  function paintFang(k, S, v, glowL) { const sd = 2.3 + v * 3.1, bend = [0.1, 0.16, 0.06][v % 3], H = [0.72, 0.62, 0.8][v % 3];
    if (!glowL) k.ball(S, 0, -0.02, 0.17, 0.07, (dx, dy) => sandM(k, dx * 2, dy * 2, sd, 1));
    k.tube(S, [[0, 0], [bend * 0.3, -H * 0.4], [bend, -H * 0.78], [bend * 1.5, -H]], 0.13, 0.008, (t, s) => { if (glowL) { const g = Math.exp(-t * t / 0.03) * 0.9 + 0.5 * k.ss(0.6, 0.0, Math.abs(s - 0.55)) * k.ss(0.9, 0.2, t) * 0.4; return E(k, 0.3 * g, 1.1 * g, 1.2 * g); }
      boneM(k, t * 4, s * 2, sd, 1, k.ss(0.3, 0.0, t)); const M = k.M; M.rg = lerp(0.6, 0.35, t); M.cc = 0.2 * t; if (t > 0.85) { M.r *= 1.08; M.g *= 1.08; M.b *= 1.06; } });
    if (!glowL) { S.unlock(); k.ink(S, [44, 30, 26], 0.4); } }

  /* ---- 3. the resonance stone (feet 0, 0): a squat carved basalt monolith, three grooved bands that hold its light, a bone collar
     at its foot, a glyph on its top; 'resb' band i's light (0 its foot .. 2 its top), 'resg' the glyph's ---- */
  const RES_H = 1.22, RESB = [[0.3, 0.38], [0.6, 0.68], [0.9, 0.98]];
  const resProf = h => 0.4 - 0.13 * (h / RES_H) + 0.015 * Math.sin(h * 23) - RESB.reduce((s, [a, b]) => s + 0.035 * k_ss(a - 0.01, a + 0.02, h) * k_ss(b + 0.01, b - 0.02, h), 0);
  const k_ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function paintRes(k, S, v, mode) { const sd = 6.1 + v * 4.4, band = mode === 'b0' ? 0 : mode === 'b1' ? 1 : mode === 'b2' ? 2 : -1, glowL = band >= 0 || mode === 'g';
    if (!glowL) { k.contact(S, 0, 0.02, 0.7, 0.24, 0.55); }
    k.rev(S, 0, 0, resProf, 0, RES_H, { top: true, floorAO: 0.5,
      mat: (u, h) => { if (glowL) { if (band < 0) return E(k, 0, 0, 0); const [a, b] = RESB[band], q = k.ss(a - 0.02, a + 0.015, h) * k.ss(b + 0.02, b - 0.015, h), rn = 0.7 + 0.3 * Math.sin(u * 9 + band * 2 + sd); return E(k, 0.32 * q * rn, 1.15 * q * rn, 1.3 * q * rn); }
        basaltM(k, u * 1.6, h * 1.6, sd); const M = k.M; for (const [a, b] of RESB) { const q = k.ss(a - 0.015, a + 0.01, h) * k.ss(b + 0.015, b - 0.01, h); if (q > 0) { M.ao *= 1 - 0.5 * q; M.r = lerp(M.r, 0.05, q); M.g = lerp(M.g, 0.12, q); M.b = lerp(M.b, 0.14, q); M.cc = 0.5; M.eg += 0.03 * q; M.eb += 0.035 * q; } }
        if (h < 0.16) { const q = k.ss(0.16, 0.06, h); const r0 = M.r, g0 = M.g, b0 = M.b; boneM(k, u * 3, h * 9, sd, 1, 0.2); M.r = lerp(r0, M.r, q); M.g = lerp(g0, M.g, q); M.b = lerp(b0, M.b, q); } },
      capMat: (x, z, ao, _a, _b, _c, ey) => { const rr = hyp(x / 0.27, ey || 0), an = Math.atan2(ey || 0, x / 0.27), gl = k.ss(0.06, 0.0, Math.abs(rr - 0.55)) + k.ss(0.05, 0.0, Math.abs(Math.sin(an * 3 + sd))) * k.ss(0.5, 0.2, rr) * 0.8;
        if (glowL) return mode === 'g' ? E(k, 0.4 * gl, 1.2 * gl, 1.3 * gl) : E(k, 0, 0, 0); basaltM(k, x * 3, (ey || 0) * 3, sd); k.M.ao *= 1 - 0.4 * gl; } });
    if (!glowL) { S.unlock(); k.ink(S, [14, 12, 20], 0.5); S.unlock(); const R = k.R1(19 + v); for (let i = 0; i < 2; i++) k.glint(S.c, -0.2 + R() * 0.08, -0.4 - R() * 0.6, 0.05, 0.35); } }

  /* ---- 4. the clay vent (feet at its middle): a low dome of cracked, sun-baked plates round a blowhole, scorched pale dust round
     it; 'ventg' its cracks' and throat's light ---- */
  function paintVent(k, S, v, glowL) { const sd = 11 + v * 7, RX = 1.05, rho = rimOf(k, sd, 0.05), Hd = 0.22;
    const q = (x, w) => hyp(x, w) / (RX * rho(Math.atan2(w, x)));
    const hf = (x, w) => { const r = q(x, w); if (r >= 1) return 0; const dome = Hd * Math.pow(Math.cos(r * Math.PI / 2), 1.3), throat = -0.18 * k.ss(0.2, 0.06, r), c = cells(x * 3.2, w * 3.2, sd), e = c[1] - c[0]; return dome + throat - 0.02 * k.ss(0.08, 0.0, e) * (1 - k.ss(0.2, 0.08, r)); };
    if (!glowL) { const c = S.c, R = k.R1(5 + v); c.save(); c.scale(1, FR); for (let i = 0; i < 8; i++) { const a = R() * TAU, d = 0.8 + R() * 0.4, x = Math.cos(a) * d, y = Math.sin(a) * d, rr = 0.25 + R() * 0.3, g = c.createRadialGradient(x, y, 0, x, y, rr); const dk = i % 3 ? '70,24,10' : '255,214,160'; g.addColorStop(0, `rgba(${dk},${0.22 + R() * 0.14})`); g.addColorStop(1, `rgba(${dk},0)`); c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); } c.restore();
      k.contact(S, 0, 0.02, RX * 1.05, RX * FR, 0.3); }
    flat(k, S, [-RX * 1.06, -RX * 1.06, RX * 1.06, RX * 1.06], FR, hf, (x, w, h) => { const r = q(x, w); if (r >= 1) return 0; const al = clamp((1 - r) * RX * S.P * 1.5 + 0.3, 0, 1), th = k.ss(0.2, 0.07, r);
      if (glowL) { const c = cells(x * 3.2, w * 3.2, sd), e = c[1] - c[0], cr = k.ss(0.08, 0.0, e) * k.ss(0.98, 0.5, r), g = cr * 0.9 + th * 1.4; E(k, 1.5 * g, 0.62 * g, 0.16 * g); return g > 0.01 ? al : 0; }
      const cr = clayM(k, x * 1.33, w * 1.33, sd, 0.25 + 0.5 * k.ss(0.5, 0.1, r)); const M = k.M; if (th > 0) { M.r = lerp(M.r, 0.05, th); M.g = lerp(M.g, 0.025, th); M.b = lerp(M.b, 0.02, th); M.er = 0.14 * th; M.eg = 0.04 * th; } M.er += 0.05 * cr; M.eg += 0.012 * cr; return al; });
    if (glowL) return; S.unlock(); k.ink(S, [60, 22, 10], 0.2); S.unlock();
    const c = S.c, R = k.R1(29 + v); c.save(); for (let i = 0; i < 26; i++) { const a = R() * TAU, d = 0.3 + R() * 0.75, s2 = 0.01 + R() * 0.018; c.fillStyle = R() < 0.55 ? `rgba(255,226,180,${0.3 + R() * 0.3})` : `rgba(70,26,12,${0.25 + R() * 0.3})`; c.fillRect(Math.cos(a) * d - s2 / 2, Math.sin(a) * d * FR - Hd * 0.5 * (1 - d) - s2 / 2, s2, s2); } c.restore(); }

  /* ---- 5. the crystal cluster (feet 0, 0): pink prisms splayed like a burst (not standing like the land's crystal props) round a glowing heart, out of a socket of cracked clay rubble; 'shardg' the light in their hearts ---- */
  const SHARDS = v => { const B = [[0, 0.15, 0.86, 0.04], [-0.09, 0.13, 0.72, -0.44], [0.1, 0.13, 0.76, 0.4], [-0.15, 0.11, 0.6, -0.86], [0.16, 0.11, 0.58, 0.84], [-0.2, 0.1, 0.44, -1.22], [0.2, 0.1, 0.42, 1.18]]; return v % 2 ? B.map(b => [-b[0], b[1], b[2] * 0.95, -b[3]]) : B; };
  function paintShard(k, S, v, glowL) { const sd = 7 + v * 3;
    if (!glowL) { k.contact(S, 0, 0.02, 0.75, 0.26, 0.5); const R = k.R1(41 + v); for (let i = 0; i < 10; i++) { const a = R() * TAU, d = 0.25 + R() * 0.3, r0 = 0.05 + R() * 0.06; k.ball(S, Math.cos(a) * d, Math.sin(a) * d * 0.4 - r0 * 0.3, r0, r0 * 0.7, (dx, dy) => clayM(k, dx + i * 3, dy, sd, 0.2)); } }
    const L = SHARDS(v).map(b => b.slice()); L.sort((a, b) => Math.abs(b[3]) - Math.abs(a[3]));   // (the outer ones first: the tall middle one over them)
    for (const [x, w, h, lean] of L) prism(k, S, x, 0.02, w * 1.25, h, lean, (f, t, qq) => { const M = k.M;
      if (glowL) { const core = Math.exp(-qq * qq * 3) * (0.35 + 0.65 * k.ss(0.0, 0.7, t)), edge = k.ss(0.08, 0.0, Math.abs(Math.abs(qq) - 1 / 3)) * 0.5; return E(k, 1.3 * core + 0.8 * edge, 0.55 * core + 0.5 * edge, 1.0 * core + 0.75 * edge); }
      const base = k.ss(0.25, 0.0, t); M.r = lerp(0.92, 0.6, base); M.g = lerp(0.42, 0.2, base); M.b = lerp(0.72, 0.42, base); if (f === 0) { M.r *= 1.08; M.g *= 1.1; M.b *= 1.05; } if (f > 0) { M.r *= 0.72; M.g *= 0.62; M.b *= 0.72; }
      M.rg = 0.08; M.cc = 1; M.sh = 0.7; M.er = 0.18 + 0.12 * t; M.eg = 0.05 + 0.04 * t; M.eb = 0.12 + 0.08 * t; const ed = k.ss(0.06, 0.0, Math.abs(Math.abs(qq) - 1 / 3)); M.er += 0.3 * ed; M.eg += 0.22 * ed; M.eb += 0.3 * ed; });
    k.ball(S, 0, -0.07, 0.14, 0.11, (dx, dy) => { const c0 = Math.max(0, 1 - hyp(dx, dy)); if (glowL) return E(k, 1.6 * c0 + 0.3, 0.7 * c0 + 0.1, 1.2 * c0 + 0.25); const M = k.M; M.r = 0.95; M.g = 0.5; M.b = 0.8; M.rg = 0.06; M.cc = 1; M.er = 0.5 * c0; M.eg = 0.18 * c0; M.eb = 0.38 * c0; });   // (its heart)
    if (glowL) return; S.unlock(); k.ink(S, [70, 18, 44], 0.35); S.unlock(); const R = k.R1(61 + v); for (let i = 0; i < 3; i++) k.glint(S.c, (R() - 0.5) * 0.4, -0.3 - R() * 0.6, 0.06 + R() * 0.03, 0.55); }

  /* ---- 6. the sun-glazed patch (feet at its middle): clay crazed into plates under a glassy glaze that holds the sky; 'mirg' the
     glaze's sheen ---- */
  function paintMirage(k, S, v, glowL) { const sd = 21 + v * 5, RX = 1.28, rho = rimOf(k, sd, 0.08);
    const q = (x, w) => hyp(x, w) / (RX * rho(Math.atan2(w, x)));
    const hf = (x, w) => { const c = cells(x * 2.8, w * 2.8, sd), e = c[1] - c[0]; return 0.02 * k.ss(0.0, 0.3, e) - 0.01 * k.ss(0.06, 0.0, e); };
    flat(k, S, [-RX * 1.1, -RX * 1.1, RX * 1.1, RX * 1.1], FR, hf, (x, w) => { const r = q(x, w); if (r >= 1) return 0; const al = clamp((1 - r) * RX * S.P * 1.2 + 0.2, 0, 1), c = cells(x * 2.8, w * 2.8, sd), e = c[1] - c[0], cr = k.ss(0.06, 0.0, e), gz = k.ss(1.0, 0.55, r);
      if (glowL) { const sh = (0.5 + 0.5 * Math.sin(w * 7 + x * 1.5 + sd)) * gz * (1 - cr); E(k, 0.55 * sh, 0.75 * sh, 0.95 * sh); return sh > 0.01 ? al : 0; }
      clayM(k, x * 1.1, w * 1.1, sd, 0); const M = k.M; M.r = lerp(M.r, 0.86, gz * 0.3); M.g = lerp(M.g, 0.56, gz * 0.3); M.b = lerp(M.b, 0.34, gz * 0.3); M.rg = lerp(M.rg, 0.12, gz); M.cc = 0.6 * gz; M.sh = 1 - 0.2 * gz; M.ao *= 1 - 0.7 * cr; return al; });
    if (glowL) return; S.unlock(); const R = k.R1(9 + v); for (let i = 0; i < 4; i++) k.glint(S.c, (R() - 0.5) * RX * 1.2, (R() - 0.5) * RX * FR, 0.06 + R() * 0.04, 0.5); }

  /* ---- 7. the disturbed grave sand (feet at its middle): a low churned mound, finger bones showing, a broken rib; 'graveg' the
     green seep through it; 'hand' a bone hand clawing up (feet 0, 0; v 0 left, 1 right) ---- */
  function paintGrave(k, S, v, glowL) { const sd = 31 + v * 4, RX = 1.12, rho = rimOf(k, sd, 0.1);
    const q = (x, w) => hyp(x, w) / (RX * rho(Math.atan2(w, x)));
    const hf = (x, w) => { const r = q(x, w); if (r >= 1) return 0; return 0.08 * Math.pow(Math.cos(r * Math.PI / 2), 1.5) + 0.02 * (k.vn(x * 6 + sd, w * 6) - 0.5) - 0.03 * Math.exp(-Math.pow(Math.sin(x * 3 + w * 4 + sd), 2) / 0.02) * (1 - r); };
    if (!glowL) k.contact(S, 0, 0, RX, RX * FR, 0.3);
    flat(k, S, [-RX * 1.12, -RX * 1.12, RX * 1.12, RX * 1.12], FR, hf, (x, w, h) => { const r = q(x, w); if (r >= 1) return 0; const al = clamp((1 - r) * RX * S.P * 1.3 + 0.2, 0, 1), fur = Math.exp(-Math.pow(Math.sin(x * 3 + w * 4 + sd), 2) / 0.02) * (1 - r);
      if (glowL) { const g = fur * 1.2 + 0.3 * k.ss(0.5, 0.0, r); E(k, 0.4 * g, 1.3 * g, 0.35 * g); return g > 0.01 ? al : 0; }
      sandM(k, x * 1.4, w * 1.4, sd, 3); const M = k.M; M.r *= 1.1; M.g *= 1.08; M.b *= 1.02; M.ao *= 1 - 0.4 * fur; M.eg += 0.02 * fur; return al; });
    if (glowL) return; const R = k.R1(53 + v);
    for (let i = 0; i < 4; i++) { const a = R() * TAU, d = 0.25 + R() * 0.55, x = Math.cos(a) * d, y = Math.sin(a) * d * FR, L = 0.14 + R() * 0.1, lean = (R() - 0.5) * 0.6;   // (finger tips showing)
      k.tube(S, [[x, y], [x + lean * L, y - L]], 0.05, 0.028, (t, s) => boneM(k, t * 3 + i, s, sd, 3, k.ss(0.4, 0, t))); }
    { const a = R() * TAU, x = Math.cos(a) * 0.6, y = Math.sin(a) * 0.6 * FR; k.tube(S, [[x - 0.3, y + 0.02], [x - 0.05, y - 0.12], [x + 0.25, y - 0.04]], 0.04, 0.03, (t, s) => boneM(k, t * 4, s, sd, 3, 0.2)); }
    S.unlock(); k.ink(S, [8, 12, 26], 0.25); }
  function paintHand(k, S, v) { const sd = 3.3 + v * 1.7, m = v % 2 ? -1 : 1, M = k.M;
    k.ball(S, 0, -0.02, 0.2, 0.08, (dx, dy) => sandM(k, dx * 2, dy * 2, sd, 3));
    k.tube(S, [[-0.03 * m, 0], [-0.02 * m, -0.3]], 0.05, 0.042, (t, s) => boneM(k, t * 3, s, sd, 3, k.ss(0.3, 0, t)));
    k.tube(S, [[0.04 * m, 0], [0.05 * m, -0.3]], 0.042, 0.036, (t, s) => boneM(k, t * 3 + 2, s, sd, 3, k.ss(0.3, 0, t)));
    k.ball(S, 0.01 * m, -0.36, 0.12, 0.09, (dx, dy) => boneM(k, dx * 3, dy * 3, sd, 3, 0));
    const F = [[-0.1, -0.42, -0.17, -0.62, -0.1, -0.72], [-0.035, -0.45, -0.05, -0.7, 0.02, -0.8], [0.035, -0.45, 0.07, -0.69, 0.13, -0.76], [0.1, -0.42, 0.17, -0.58, 0.22, -0.64]];
    for (const [ax, ay, bx, by, cx, cy] of F) k.tube(S, [[ax * m, ay], [bx * m, by], [cx * m, cy]], 0.028, 0.016, (t, s) => { boneM(k, t * 5 + ax * 9, s, sd, 3, 0); if (Math.abs(t - 0.5) < 0.06) M.ao *= 0.7; });
    k.tube(S, [[0.11 * m, -0.33], [0.2 * m, -0.4], [0.25 * m, -0.5]], 0.026, 0.016, (t, s) => boneM(k, t * 4 + 7, s, sd, 3, 0));
    S.unlock(); k.ink(S, [10, 14, 26], 0.45); }

  /* ---- 8. the moonlit quicksand (feet at its middle): a pool of fine pale sand, slow rings, a soft lip; 'quickg' its moon sheen ---- */
  function paintQuick(k, S, v, glowL) { const sd = 41 + v * 3, RX = 1.18, rho = rimOf(k, sd, 0.05);
    const q = (x, w) => hyp(x, w) / (RX * rho(Math.atan2(w, x)));
    const hf = (x, w) => { const r = q(x, w); if (r >= 1) return 0; return -0.06 * (1 - r * r) + 0.006 * Math.sin(r * 30 + sd) * (1 - r) + 0.035 * Math.exp(-Math.pow((r - 0.93) / 0.06, 2)); };
    flat(k, S, [-RX * 1.08, -RX * 1.08, RX * 1.08, RX * 1.08], FR, hf, (x, w) => { const r = q(x, w); if (r >= 1) return 0; const al = clamp((1 - r) * RX * S.P * 1.4 + 0.2, 0, 1), rg = 0.5 + 0.5 * Math.sin(r * 30 + sd);
      if (glowL) { const g = (k.ss(0.6, 1.0, rg) * 0.5 + 0.5 * Math.exp(-Math.pow((r - 0.35) / 0.2, 2))) * k.ss(1.0, 0.7, r); E(k, 0.5 * g, 0.62 * g, 0.95 * g); return g > 0.01 ? al : 0; }
      sandM(k, x * 3, w * 3, sd, 3); const M = k.M, sm = k.ss(0.95, 0.4, r); M.r = lerp(M.r, 0.3, sm * 0.6); M.g = lerp(M.g, 0.38, sm * 0.6); M.b = lerp(M.b, 0.58, sm * 0.6); M.rg = lerp(0.88, 0.32, sm); M.cc = 0.25 * sm; M.ao *= 0.85 + 0.15 * rg; return al; });
    if (glowL) return; S.unlock(); const R = k.R1(15 + v); for (let i = 0; i < 3; i++) k.glint(S.c, (R() - 0.5) * RX, (R() - 0.5) * RX * FR * 0.8, 0.05 + R() * 0.03, 0.45); }

  /* ---- 9. the broken grave (feet 0, 0): a cracked slab leaning on a low mound of night sand and stones, a split in the mound
     before it; 'gasg' the green light in the cracks ---- */
  function paintGas(k, S, v, glowL) { const sd = 51 + v * 6, m = v % 2 ? -1 : 1, M = k.M;
    const crackAt = (x, z) => { const l = Math.abs(x - (0.05 * m + 0.12 * Math.sin(z * 7 + sd) + 0.06 * (z - 0.4))); return k.ss(0.03, 0.0, l); };
    if (!glowL) k.contact(S, 0, 0.02, 0.95, 0.34, 0.5);
    // the mound and its split
    k.ball(S, 0, -0.04, 0.85, 0.28, (dx, dy) => { const sp = k.ss(0.08, 0.0, Math.abs(dx - 0.1 * m - dy * 0.2)) * k.ss(-0.2, 0.5, dy); if (glowL) return E(k, 0.4 * sp, 1.3 * sp, 0.3 * sp); sandM(k, dx * 2.5, dy * 2.5, sd, 3); M.ao *= 1 - 0.7 * sp; M.eg += 0.04 * sp; });
    if (!glowL) { const R = k.R1(17 + v); for (let i = 0; i < 6; i++) { const a = R() * TAU, d = 0.5 + R() * 0.3, r0 = 0.06 + R() * 0.06; k.ball(S, Math.cos(a) * d, Math.sin(a) * d * 0.32 - r0 * 0.3, r0, r0 * 0.75, (dx, dy) => nightStoneM(k, dx + i, dy, sd)); } }
    // the slab: a leaning headstone, its top broken off on one side
    k.rbox(S, -0.08 * m, -0.12, 0.36, 0.08, 0.0, 0.78, 0.06, (face, u, z) => { const cr = crackAt(u, z);
      if (glowL) { const g = cr * k.ss(0.0, 0.2, z) + (face === 't' ? 0 : 0.0); return E(k, 0.4 * g, 1.35 * g, 0.32 * g); }
      nightStoneM(k, u * 2, z * 2, sd); M.ao *= 1 - 0.6 * cr; if (face === 'f') { const ins = k.ss(0.03, 0.0, Math.abs(Math.abs(u) - 0.24)) * k.ss(0.1, 0.16, z) * k.ss(0.62, 0.56, z); M.ao *= 1 - 0.3 * ins; } M.eg += 0.03 * cr; });
    if (!glowL) { const R = k.R1(23 + v); k.ball(S, 0.42 * m, -0.06, 0.13, 0.08, (dx, dy) => nightStoneM(k, dx * 2 + R(), dy * 2, sd)); }
    if (glowL) return; S.unlock(); k.ink(S, [8, 12, 24], 0.45); }

  const DEFS = {
    sink: { land: 1, box: () => [-1.55, -1.1, 1.55, 1.1], paint: (k, S, v) => paintSink(k, S, v, false) }, sinkg: { land: 1, box: () => [-1.55, -1.1, 1.55, 1.1], paint: (k, S, v) => paintSink(k, S, v, true) },
    jaw: { land: 1, box: o => o === 'v' ? [-0.8, -1.5, 0.8, 1.5] : [-1.5, -0.8, 1.5, 0.8], paint: (k, S, o) => paintJaw(k, S, o, false) }, jawg: { land: 1, box: o => o === 'v' ? [-0.8, -1.5, 0.8, 1.5] : [-1.5, -0.8, 1.5, 0.8], paint: (k, S, o) => paintJaw(k, S, o, true) },
    fang: { land: 1, box: () => [-0.3, -0.95, 0.45, 0.15], paint: (k, S, v) => paintFang(k, S, v, false) }, fangg: { land: 1, box: () => [-0.3, -0.95, 0.45, 0.15], paint: (k, S, v) => paintFang(k, S, v, true) },
    res: { land: 1, box: () => [-0.8, -1.6, 0.8, 0.35], paint: (k, S, v) => paintRes(k, S, v, '') }, resb: { land: 1, box: () => [-0.8, -1.6, 0.8, 0.35], paint: (k, S, v) => paintRes(k, S, 0, 'b' + v) }, resg: { land: 1, box: () => [-0.8, -1.6, 0.8, 0.35], paint: (k, S, v) => paintRes(k, S, 0, 'g') },
    vent: { land: 2, box: () => [-1.35, -1.1, 1.35, 0.95], paint: (k, S, v) => paintVent(k, S, v, false) }, ventg: { land: 2, box: () => [-1.35, -1.1, 1.35, 0.95], paint: (k, S, v) => paintVent(k, S, v, true) },
    shard: { land: 2, box: () => [-0.95, -1.25, 0.95, 0.35], paint: (k, S, v) => paintShard(k, S, v, false) }, shardg: { land: 2, box: () => [-0.95, -1.25, 0.95, 0.35], paint: (k, S, v) => paintShard(k, S, v, true) },
    mirage: { land: 2, box: () => [-1.5, -1.05, 1.5, 1.05], paint: (k, S, v) => paintMirage(k, S, v, false) }, mirg: { land: 2, box: () => [-1.5, -1.05, 1.5, 1.05], paint: (k, S, v) => paintMirage(k, S, v, true) },
    grave: { land: 3, box: () => [-1.3, -0.95, 1.3, 0.95], paint: (k, S, v) => paintGrave(k, S, v, false) }, graveg: { land: 3, box: () => [-1.3, -0.95, 1.3, 0.95], paint: (k, S, v) => paintGrave(k, S, v, true) },
    hand: { land: 3, box: () => [-0.4, -0.95, 0.4, 0.15], paint: paintHand },
    quick: { land: 3, box: () => [-1.35, -0.95, 1.35, 0.95], paint: (k, S, v) => paintQuick(k, S, v, false) }, quickg: { land: 3, box: () => [-1.35, -0.95, 1.35, 0.95], paint: (k, S, v) => paintQuick(k, S, v, true) },
    gas: { land: 3, box: () => [-1.05, -1.1, 1.05, 0.4], paint: (k, S, v) => paintGas(k, S, v, false) }, gasg: { land: 3, box: () => [-1.05, -1.1, 1.05, 0.4], paint: (k, S, v) => paintGas(k, S, v, true) } };
  const PICS = { sink: [['sink', 0], ['sink', 1], ['sinkg', 0], ['sinkg', 1]], tooth: [['jaw', 'h'], ['jaw', 'v'], ['jawg', 'h'], ['jawg', 'v'], ['fang', 0], ['fang', 1], ['fang', 2], ['fangg', 0], ['fangg', 1], ['fangg', 2]],
    res: [['res', 0], ['res', 1], ['resb', 0], ['resb', 1], ['resb', 2], ['resg', 0]], vent: [['vent', 0], ['vent', 1], ['ventg', 0], ['ventg', 1]], shard: [['shard', 0], ['shard', 1], ['shardg', 0], ['shardg', 1]],
    mirage: [['mirage', 0], ['mirg', 0]], hands: [['grave', 0], ['grave', 1], ['graveg', 0], ['graveg', 1], ['hand', 0], ['hand', 1]], quick: [['quick', 0], ['quickg', 0]], gas: [['gas', 0], ['gas', 1], ['gasg', 0], ['gasg', 1]] };
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0;
  function paint(name, v, P) { const B = BP(); if (!B) return null; const K = B.kit, D = DEFS[name], b = D.box(v), t0 = now(); let S = null;
    try { S = K.surface(b[0], b[1], b[2], b[3], P); lit(K, D.land, () => { D.paint(K, S, v); S.unlock(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('DUNE_TRAPS', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = document.createElement('canvas'); cv.width = S.w; cv.height = S.h; cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;   // (the work canvas given back at once: the plain copy is kept)
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  const keyOf = (name, v, P) => name + '|' + v + '|' + P;
  function sprite(name, v, P, force) { if (!DEFS[name] || !BP()) return null; P = Math.max(8, Math.round(P || BASE || 48)); const key = keyOf(name, v, P); let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 10) return null;   // (a painting budget: what does not fit waits a frame)
    s = paint(name, v, P); if (s) CACHE.set(key, s); return s; }
  function draw(c, name, v, Xs, Ys, T, o) { if (!BASE) return false; const s = CACHE.get(keyOf(name, v, BASE)) || sprite(name, v, BASE); if (!s) { STATS.misses++; return false; } o = o || {}; const f = T / s.P, sx = o.sx == null ? 1 : o.sx, sy = o.sy == null ? 1 : o.sy; STATS.draws++;
    c.save(); if (o.add) c.globalCompositeOperation = 'lighter'; if (o.alpha != null) c.globalAlpha *= clamp(o.alpha, 0, 1); c.translate(Xs, Ys); if (o.rot) c.rotate(o.rot); if (sx !== 1 || sy !== 1) c.scale(sx, sy); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); c.restore(); return true; }
  function warm(P, sec, kinds) { if (!BP() || !P || !(P.T > 0) || off()) return []; BASE = Math.round(P.T * (P.k || 1)); const jobs = []; for (const kd of kinds || kindsOf(sec || 1)) for (const [n, v] of PICS[kd] || []) jobs.push(() => { sprite(n, v, BASE, true); }); return jobs; }
  function releasePics() { CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); BASE = 0; }

  /* ======================= placing ======================= */
  function hashLayout(M) { let h = 2166136261 >>> 0; const G = M.G; for (let i = 0; i < G.length; i++) h = Math.imul(h ^ G[i], 16777619) >>> 0; h = Math.imul(h ^ (M.MW * 131 + M.MH), 16777619) >>> 0; if (M.props) M.props.forEach((v, k) => { h = Math.imul(h ^ k, 16777619) >>> 0; }); return h >>> 0; }
  const dist = (x, y) => Math.sqrt(x * x + y * y), EPS = 1e-6;   // (sqrt, correctly rounded everywhere: Math.hypot may differ in its last bit between V8's tiers)
  const segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1e-9; let t = ((px - ax) * dx + (py - ay) * dy) / l; t = clamp(t, 0, 1); return dist(px - ax - dx * t, py - ay - dy * t); };
  function exitOf(X) { const M = X.M; let far = M.bossAt || M.start, best = -1; for (const r of M.rooms) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2, d = dist(cx - M.start.x, cy - M.start.y); if (d > best) { best = d; far = { x: cx, y: cy }; } } return far; }
  // (how much room each kind needs kept clear round it, beyond the start's and the way on's own)
  const NEED = { res: 1.2, shard: 0.9, sink: 0.3, vent: 0.2, gas: 0.2 };
  function place(X, H, o) { o = o || {}; const M = X.M, MW = M.MW, MH = M.MH, G = M.G, props = M.props, sec = clamp(o.sec || 1, 1, 3), sp = (SPEC[sec] || SPEC[1])[clamp((o.n || 1) - 1, 0, 1)], puz = !!o.puzzle;
    const seed = o.seed != null ? o.seed >>> 0 : (hashLayout(M) ^ Math.imul(sec * 7 + (o.n || 1) + (puz ? 50 : 0), 2654435761)) >>> 0, rnd = R1(seed), gap = o.minGap || (puz ? 3.0 : GAP[sec]), nRoom = o.count != null ? o.count : sp.n, nBr = puz ? 0 : o.br != null ? o.br : sp.br;
    const start = M.start || { x: X.me.x, y: X.me.y }, ex = puz ? null : exitOf(X);
    const isF = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && G[y * MW + x] === T_FLOOR && !(props && props.has(y * MW + x));
    const walk = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && (G[y * MW + x] === T_FLOOR || G[y * MW + x] === T_BRIDGE || G[y * MW + x] === T_MUD);
    const flo = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && (G[y * MW + x] === T_FLOOR || G[y * MW + x] === T_MUD) && !(props && props.has(y * MW + x));
    // (nothing standing in front of it, down the screen, whose picture would hide the trap and its tell)
    const PX = typeof PROP_EXT !== 'undefined' ? PROP_EXT : {}, hidden = (x, y) => { if (!props) return false; for (let dy = 1; dy <= 3; dy++) for (let dx = -1; dx <= 1; dx++) { const kp = props.get((y + dy) * MW + x + dx); if (kp == null) continue; const Ee = PX[kp] || [2.4, 2.9]; if (Ee[1] >= dy + 1.3 && (dx === 0 ? true : Ee[0] >= 2.6 && dy <= 2)) return true; } return false; };
    const plain = (x, y) => { if (!isF(x, y) || hidden(x, y)) return false; let pr = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; if (flo(x + dx, y + dy)) continue; if (dx && dy && props && props.has((y + dy) * MW + x + dx) && pr < 2) { pr++; continue; } return false; } return true; };
    // what is kept clear: the start, the way on, the packs' spawn points, shrines, stones, pots, nests, the loot gremlin, the sand spouts, the Tower's traps (their tracks); a puzzle's pieces (its marks)
    const keep = [{ x: start.x, y: start.y, r: puz ? 3.4 : 4.5 }].concat(ex ? [{ x: ex.x, y: ex.y, r: 3.6 }] : [], o.avoid || []), segs = [];
    for (const p of M.packs || []) keep.push({ x: p.x, y: p.y, r: 1.3 }); for (const p of M.shrines || []) keep.push({ x: p.x, y: p.y, r: 2.0 }); for (const p of M.stones || []) keep.push({ x: p.x, y: p.y, r: 1.6 }); for (const p of M.pots || []) keep.push({ x: p.x, y: p.y, r: 1.0 });
    for (const p of M.nests || []) keep.push({ x: p.x, y: p.y, r: 2.0 }); if (M.gremlin) keep.push({ x: M.gremlin.x, y: M.gremlin.y, r: 2.0 }); for (const h of M.hazards || []) if (!h.area && h.x != null) keep.push({ x: h.x, y: h.y, r: 1.25 });
    for (const t of M.traps || []) { if (t.x0 != null) segs.push([t.x0, t.y0, t.x1, t.y1, 1.3]); else if (t.x1 != null) segs.push([t.x, t.y, t.x1, t.y1, 1.3]); else if (t.len) segs.push([t.x, t.y, t.x + t.dx * t.len, t.y + t.dy * t.len, 1.3]); else keep.push({ x: t.x, y: t.y, r: 1.6 }); }
    if (puz && M.marks) for (const ch in M.marks) for (const p of M.marks[ch]) keep.push({ x: p.x, y: p.y, r: ch === 'E' ? 2.4 : 1.8 });
    const out = [];
    const clearPt = (x, y, r0) => keep.every(k => dist(x - k.x, y - k.y) >= k.r + (r0 || 0) - EPS) && segs.every(s => segD(x, y, s[0], s[1], s[2], s[3]) >= s[4] + (r0 || 0) - EPS);
    const clearSeg = (ax, ay, bx, by) => keep.every(k => segD(k.x, k.y, ax, ay, bx, by) >= k.r - EPS) && segs.every(s => segD(ax, ay, s[0], s[1], s[2], s[3]) >= s[4] - EPS && segD(bx, by, s[0], s[1], s[2], s[3]) >= s[4] - EPS);
    const farFromTraps = (ax, ay, bx, by, g) => out.every(q => { const qa = q.x1 != null ? segD(ax, ay, q.x, q.y, q.x1, q.y1) : dist(ax - q.x, ay - q.y), qb = q.x1 != null ? segD(bx, by, q.x, q.y, q.x1, q.y1) : dist(bx - q.x, by - q.y), qm = segD(q.x, q.y, ax, ay, bx, by); return Math.min(qa, qb, qm) >= g - EPS; });
    const gapOf = kd => ZONE[kd] ? gap * 0.8 : kd === 'res' ? gap + 0.4 : gap;
    // the rooms' share of each kind (largest remainder over the weights), dealt over a seeded shuffle
    const mix = o.kinds ? o.kinds.reduce((a, k) => (a[k] = (a[k] || 0) + 1, a), {}) : (MIX[sec] || MIX[1]), names = Object.keys(mix).filter(k => KINDS[k]), wsum = names.reduce((s, k) => s + mix[k], 0), want = [];
    { const raw = names.map(k => nRoom * mix[k] / wsum), base = raw.map(Math.floor); let left = nRoom - base.reduce((s, v) => s + v, 0); const ord = raw.map((v, i) => [v - base[i], i]).sort((a, b) => b[0] - a[0]); for (let j = 0; j < left; j++) base[ord[j % ord.length][1]]++; names.forEach((k, i) => { for (let j = 0; j < base[i]; j++) want.push(k); }); }
    for (let i = want.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const q = want[i]; want[i] = want[j]; want[j] = q; }
    const rooms = M.rooms && M.rooms.length ? M.rooms : [{ x: 0, y: 0, w: MW, h: MH }];
    const lists = rooms.map(r => { const c = []; for (let y = Math.max(1, r.y - 1); y < Math.min(MH - 1, r.y + r.h + 1); y++) for (let x = Math.max(1, r.x - 1); x < Math.min(MW - 1, r.x + r.w + 1); x++) { if (M.RM && M.RM[y * MW + x] !== rooms.indexOf(r) && rooms.length > 1) continue; if (plain(x, y) && clearPt(x + 0.5, y + 0.5)) c.push([x + 0.5, y + 0.5, rnd()]); } c.sort((a, b) => a[2] - b[2]); return c; });
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    // a jaw: an axis across a plain tile, its neighbours along it plain floor; a round trap: its own room (NEED)
    function laneAt(x0, y0, kd) { const tx = Math.floor(x0), ty = Math.floor(y0); const ds = DIRS.slice(); for (let i = 3; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)), q = ds[i]; ds[i] = ds[j]; ds[j] = q; }
      if (LINE[kd]) { for (const [dx] of ds.slice(0, 2)) { const hx = Math.abs(dx) ? 1 : 0, hy = 1 - hx, L = KINDS.tooth.len / 2; if (!isF(tx - hx, ty - hy) || !isF(tx + hx, ty + hy)) continue; const A = { x: x0 - hx * L, y: y0 - hy * L }, B = { x: x0 + hx * L, y: y0 + hy * L }; if (!clearSeg(A.x, A.y, B.x, B.y)) continue; return { x: A.x, y: A.y, x1: B.x, y1: B.y, o: hx ? 'h' : 'v', L: KINDS.tooth.len }; } return null; }
      if (NEED[kd] && !clearPt(x0, y0, NEED[kd])) return null; return { x: x0, y: y0 }; }
    for (let pass = 0; pass < 80 && want.length; pass++) { let any = false;
      for (const Lr of lists) { if (!want.length) break; const kd = want[0];
        for (let i = 0; i < Lr.length; i++) { const [x, y] = Lr[i]; const g2 = gapOf(kd); if (!farFromTraps(x, y, x, y, g2)) continue; const ln = laneAt(x, y, kd); if (!ln) continue; if (ln.x1 != null && !farFromTraps(ln.x, ln.y, ln.x1, ln.y1, Math.min(2.2, g2))) continue;
          Lr.splice(i, 1); out.push(Object.assign({ kind: kd, bridge: false }, ln)); want.shift(); any = true; break; } }
      if (!any) { if (want.length > 1) want.push(want.shift()); if (pass > 40) break; } }
    // what found no room is made up with the section's round kinds where they still fit
    const fill = names.filter(k => !LINE[k]); for (let j = 0; want.length && fill.length && j < 400; j++) { const kd = fill[j % fill.length]; let put = false;
      for (const Lr of lists) { for (let i = 0; i < Lr.length; i++) { const [x, y] = Lr[i]; if (!farFromTraps(x, y, x, y, gapOf(kd)) || (NEED[kd] && !clearPt(x, y, NEED[kd]))) continue; Lr.splice(i, 1); out.push({ kind: kd, bridge: false, x, y }); want.shift(); put = true; break; } if (put) break; }
      if (!put && j >= fill.length) break; }
    // the causeways: their straight spans (2 wide): a jaw across one, or a round trap on it
    const seen = new Uint8Array(MW * MH), spans = [];
    if (nBr > 0) for (let i = 0; i < MW * MH; i++) { if (seen[i] || G[i] !== T_BRIDGE) continue; const comp = [], qq = [i]; seen[i] = 1; while (qq.length) { const k2 = qq.pop(); comp.push(k2); const x = k2 % MW, y = (k2 / MW) | 0; for (const [dx, dy] of DIRS) { const n2 = (y + dy) * MW + x + dx; if (x + dx < 0 || y + dy < 0 || x + dx >= MW || y + dy >= MH || seen[n2] || G[n2] !== T_BRIDGE) continue; seen[n2] = 1; qq.push(n2); } }
      const cand = []; for (const k2 of comp) { const x = k2 % MW, y = (k2 / MW) | 0;
        if (G[(y + 1) * MW + x] === T_BRIDGE && G[(y - 1) * MW + x] === T_GAP && G[(y + 2) * MW + x] === T_GAP && G[y * MW + x - 1] === T_BRIDGE && G[y * MW + x + 1] === T_BRIDGE) cand.push({ ax: 'h', x: x + 0.5, y: y + 1, k: k2 });
        if (G[y * MW + x + 1] === T_BRIDGE && G[y * MW + x - 1] === T_GAP && G[y * MW + x + 2] === T_GAP && G[(y - 1) * MW + x] === T_BRIDGE && G[(y + 1) * MW + x] === T_BRIDGE) cand.push({ ax: 'v', x: x + 1, y: y + 0.5, k: k2 }); }
      if (cand.length) spans.push(cand); }
    for (let i = spans.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const q = spans[i]; spans[i] = spans[j]; spans[j] = q; }
    const bk = o.bridgeKinds || BRIDGE[sec] || BRIDGE[1]; let nb = 0;
    const picks = [], more = []; for (const cand of spans) { cand.sort((a, b) => a.k - b.k); picks.push(cand[Math.floor(cand.length / 2)]); const m = Math.round(cand.length / 5); for (let j = 0; j < m; j++) more.push(cand[Math.min(cand.length - 1, Math.round((j + 0.5) * cand.length / m))]); }
    picks.push(...more);
    for (const c0 of picks) { if (nb >= nBr) break; const kd = bk[nb % bk.length]; if (!clearPt(c0.x, c0.y) || !farFromTraps(c0.x, c0.y, c0.x, c0.y, sec === 3 ? 2.8 : 3.2)) continue; let t;
      if (LINE[kd]) { const L = KINDS.tooth.len / 2; t = c0.ax === 'h' ? { kind: kd, bridge: true, x: c0.x, y: c0.y - L, x1: c0.x, y1: c0.y + L, o: 'v', L: KINDS.tooth.len } : { kind: kd, bridge: true, x: c0.x - L, y: c0.y, x1: c0.x + L, y1: c0.y, o: 'h', L: KINDS.tooth.len }; }
      else t = { kind: kd, bridge: true, x: c0.x, y: c0.y, sc: ZONE[kd] ? 0.84 : 0.9 };
      out.push(t); nb++; }
    const F = field(X, H, out, { sec, n: o.n || 1, seed, puzzle: puz, teach: o.teach, hash: hashLayout(M) }); F.diag = { cand: lists.reduce((s, l) => s + l.length, 0) + out.filter(q => !q.bridge).length, short: want.slice(), spans: spans.length }; return F; }

  /* ======================= the field ======================= */
  const FIELDS = [], TAUGHT = {};
  const say = (X, k, ...a) => { try { if (X.sfx && X.sfx[k]) X.sfx[k](...a); } catch (e) {} };
  const midOf = tp => tp.x1 != null ? [(tp.x + tp.x1) / 2, (tp.y + tp.y1) / 2] : [tp.x, tp.y];
  function field(X, H, list, info) { const F = { X, traps: [], stat: { hits: 0, dodged: 0, bursts: 0, demos: 0, monHits: 0, byKind: {} }, taught: {}, live: true, info, LG: [], LL: [], hold: 0, choke: 0, sinkT: 0, sinkCd: 0, teach: info.teach !== false, seed: info.seed };
    list.forEach((p, i) => { const K = KINDS[p.kind], h = hh(i + 3, info.seed | 0), per = K.per ? K.per[0] + (K.per[1] - K.per[0]) * h : 0;
      const tp = Object.assign({ K, period: per, st: 'idle', t: K.per ? (i * 0.618 % 1) * per : 0, n: 0, on: false, demo: false, hit: false, hm: null, sd: i * 1.37 + (info.seed % 97), v: (i + (info.seed & 7)) % 2, stuck: 0 }, p); tp.R = (K.r || 0) * (p.sc || 1);
      if (p.kind === 'shard') { const a0 = hh(i + 11, info.seed | 0) * TAU; tp.rays = []; for (let j = 0; j < K.rays; j++) { const a = a0 + j * TAU / K.rays; tp.rays.push([tp.x + Math.cos(a) * K.len, tp.y + Math.sin(a) * K.len * FR]); } }
      F.traps.push(tp); });
    F.dmg = kind => dmgOf(F, kind);
    // the standing ones are drawn among the floor's things, sorted by depth (a jaw's teeth by its far edge, so the pet in it is over them)
    if (H && H.obj) for (const tp of F.traps) { if (!STAND[tp.kind]) continue; const [cx] = midOf(tp), y = tp.kind === 'tooth' ? Math.min(tp.y, tp.y1) - 0.45 : tp.y + 0.05;
      tp.obj = H.obj({ x: cx, y, kind: 'dtrap', r: 0, label: '', draw(c) { if (F.live) drawStand(F, tp, c); } }); }
    F.tick = dt => tick(F, dt); F.stop = () => stop(F); F.drawGround = c => { if (F.live) drawGround(F, c); }; F.drawOver = c => { if (F.live) drawOver(F, c); };
    FIELDS.push(F); STATS.fields++; return F; }
  const MODS = ['dtzone', 'dthold', 'dtgas'];
  function stop(F) { F.live = false; try { const g = F.X.g; if (g && g.mvMods) for (const k of MODS) delete g.mvMods[k]; } catch (e) {} for (const tp of F.traps) tp.obj = null; F.LG.length = F.LL.length = 0; }
  function clear() { for (const F of FIELDS) stop(F); FIELDS.length = 0; }
  function release() { clear(); releasePics(); }
  function dmgOf(F, kind) { const K = KINDS[kind], X = F.X, hp = X.ST().hp, base = 12 * ((X.F && X.F.dmgMul) || 1) * (K.dmgK || 0); return K.dmgK ? clamp(base, hp * 0.04, hp * 0.14) : 0; }

  /* ---------------- the cycle ---------------- */
  const groundMon = m => !m.dead && !m.boss && !m.fiend && !m.lesser && !m.fobj && !(typeof MON !== 'undefined' && MON[m.type] && MON[m.type].fly);
  const anyMon = m => !m.dead && !m.boss && !m.fiend && !m.lesser && !m.fobj;
  const inEll = (tp, x, y, r) => hyp(x - tp.x, (y - tp.y) / FR) < r;
  function tick(F, dt) { const X = F.X, me = X.me, g = X.g;
    for (const tp of F.traps) { const [cx, cy] = midOf(tp); tp.on = hyp(me.x - cx, me.y - cy) < 13; }
    if (F.teach) teach(F);
    for (const tp of F.traps) step(F, tp, dt);
    // the zones: the mirage's heat and the quicksand's hold (the engine's walking-speed mods), the quicksand's swallow
    let zk = 1, inQ = null; for (const tp of F.traps) { if (!ZONE[tp.kind]) continue; const inn = !me.dead && !me.dodge && inEll(tp, me.x, me.y, tp.R); tp.stuck = clamp(tp.stuck + (inn ? dt * 4 : -dt * 2), 0, 1);
      if (inn) { zk = Math.min(zk, tp.K.slowK); if (tp.kind === 'quick') inQ = tp; F.stat.zoneT = (F.stat.zoneT || 0) + dt; }
      if (tp.on) for (const m of X.mons) if (groundMon(m) && inEll(tp, m.x, m.y, tp.R + m.r * 0.3)) { m.sandT = Math.max(m.sandT || 0, 0.25); tp.stuck = Math.max(tp.stuck, 0.5); } }
    if (F.sinkCd > 0) F.sinkCd -= dt;
    if (inQ && F.sinkCd <= 0) { F.sinkT += dt; inQ.sink = F.sinkT / inQ.K.sinkT; if (F.sinkT >= inQ.K.sinkT) { F.sinkT = 0; F.sinkCd = 2.0; inQ.sink = 0; const by = F.stat.byKind.quick || (F.stat.byKind.quick = { hits: 0, dodged: 0, lost: 0 }), hp0 = me.hp;
        if (!inQ.demo && X.hurtPet(dmgOf(F, 'quick'), null)) { F.stat.hits++; by.hits++; by.lost += hp0 - me.hp; const a = Math.atan2(me.y - inQ.y, me.x - inQ.x); X.push(isFinite(a) ? a : Math.random() * TAU, inQ.K.shove); say(X, 'thud'); X.sparks && X.sparks(me.x, me.y, inQ.K.hi, lowFx() ? 5 : 10, 3); } } }
    else { F.sinkT = Math.max(0, F.sinkT - dt * 2); for (const tp of F.traps) if (tp.kind === 'quick') tp.sink = tp === inQ ? F.sinkT / tp.K.sinkT : Math.max(0, (tp.sink || 0) - dt * 2); }
    if (F.hold > 0) F.hold -= dt; if (F.choke > 0) F.choke -= dt;
    g.mvMods = g.mvMods || {}; if (zk < 1) g.mvMods.dtzone = zk; else delete g.mvMods.dtzone; if (F.hold > 0) g.mvMods.dthold = KINDS.hands.holdK; else delete g.mvMods.dthold; if (F.choke > 0) g.mvMods.dtgas = KINDS.gas.slowK; else delete g.mvMods.dtgas; }
  // the first of each kind the pet comes near plays once, harmlessly, with a banner naming its tell
  function teach(F) { const X = F.X, me = X.me; if (X.g.t < (F.info.puzzle ? 7 : 5)) return;
    for (const kd in KINDS) { if (TAUGHT[kd] || F.taught[kd]) continue; const cand = F.traps.filter(tp => tp.kind === kd); if (!cand.length) continue; const zone = !!ZONE[kd];
      const dm = cand.find(tp => tp.demo); if (dm) { if ((dm.st === 'warn' || zone) && !dm.said) { dm.said = true; X.banner(KINDS[kd].name, KINDS[kd].tell, KINDS[kd].hi, 3.4, true); const [cx, cy] = midOf(dm); X.text(cx, cy - 1.8, zone ? (kd === 'quick' ? 'Quicksand!' : 'Heat haze!') : 'Safe to watch…', KINDS[kd].hi, 14); }
        if (zone ? dm.said && (X.g.t - F.stat.demoAt > 3.6) : (dm.n > dm.n0 && (dm.st === 'idle' || dm.st === 'rest'))) { dm.demo = false; F.taught[kd] = TAUGHT[kd] = true; } continue; }
      if (F.stat.demoAt && X.g.t - F.stat.demoAt < 4.5) continue;   // (one banner at a time)
      let b = null, bd = zone ? 4.5 : 7.5; for (const tp of cand) { const [cx, cy] = midOf(tp), d = hyp(me.x - cx, me.y - cy); if (d < bd && d > (zone ? 0 : 2.8) && tp.st === 'idle') { bd = d; b = tp; } }
      if (b) { b.demo = true; b.n0 = b.n; F.stat.demos++; F.stat.demoAt = X.g.t; if (KINDS[kd].per) b.t = Math.max(0, b.period - KINDS[kd].warn - KINDS[kd].burst - 0.6); else if (!zone) { b.st = 'warn'; b.t = -0.6; } } } }
  function idleSpan(tp) { const K = tp.K; return tp.period - K.warn - K.burst; }
  function step(F, tp, dt) { const X = F.X, me = X.me, K = tp.K; if (ZONE[tp.kind]) return; if (!tp.on && (tp.st === 'idle' || tp.st === 'rest' && tp.t >= K.rest)) return; tp.t += dt;
    if (tp.st === 'idle') { if (K.per) { if (tp.t >= idleSpan(tp)) arm(F, tp); } else if (tp.on && trig(F, tp)) arm(F, tp); return; }
    if (tp.st === 'warn') { if (tp.kind === 'sink' && !tp.demo) pull(F, tp, dt); if (tp.t >= K.warn) { tp.st = 'burst'; tp.t = 0; tp.hit = false; tp.hm = new Set(); tp.n++; F.stat.bursts++; burstFx(F, tp); } return; }
    if (tp.st === 'burst') { strike(F, tp); if (tp.t >= K.burst) { tp.t = 0; tp.st = K.rest ? 'rest' : 'idle'; tp.hm = null; } return; }
    if (tp.st === 'rest') { if (tp.t >= K.rest) { tp.st = 'idle'; tp.t = 0; } } }
  // the sink drags what stands in its swirl toward its hole (a dodge roll is never dragged); walking out against it is easy
  function pull(F, tp, dt) { const X = F.X, me = X.me, K = tp.K, k = ease(tp.t / K.warn);
    if (!me.dead && !me.dodge && inEll(tp, me.x, me.y, tp.R * 1.12)) { const dx = tp.x - me.x, dy = tp.y - me.y, d = hyp(dx, dy); if (d > 0.12) { const v = Math.min(d, K.pull * (0.35 + 0.65 * k) * dt); X.moveEnt(me, dx / d * v, dy / d * v, 0); } }
    for (const m of X.mons) if (groundMon(m) && inEll(tp, m.x, m.y, tp.R)) { const dx = tp.x - m.x, dy = tp.y - m.y, d = hyp(dx, dy); if (d > 0.12) { const v = Math.min(d, K.pull * 0.8 * dt); X.moveEnt(m, dx / d * v, dy / d * v); } } }
  function arm(F, tp) { const X = F.X, K = tp.K; tp.st = 'warn'; tp.t = 0; if (!tp.on) return;
    if (tp.kind === 'sink') say(X, 'hiss', K.warn, 0.05, 420); else if (tp.kind === 'tooth') say(X, 'hiss', K.warn, 0.05, 2200); else if (tp.kind === 'res') say(X, 'note', 196, K.warn, 'sine', 0.07, 392); else if (tp.kind === 'vent') say(X, 'hiss', K.warn * 0.9, 0.06, 700);
    else if (tp.kind === 'shard') say(X, 'note', 1320, K.warn, 'sine', 0.05, 1980); else if (tp.kind === 'hands') say(X, 'hiss', K.warn, 0.05, 1200); else if (tp.kind === 'gas') say(X, 'note', 110, K.warn, 'sine', 0.06, 165); }
  // what sets off a sink, a jaw, a cluster or the hands: the pet (dodging or not) or a walking monster near it
  function trig(F, tp) { const X = F.X, me = X.me, K = tp.K;
    if (tp.kind === 'tooth') { const d = segD(me.x, me.y, tp.x, tp.y, tp.x1, tp.y1); if (!me.dead && d < 0.45 + (me.r || 0.3) * 0.5) return true; for (const m of X.mons) if (groundMon(m) && segD(m.x, m.y, tp.x, tp.y, tp.x1, tp.y1) < 0.35) return true; return false; }
    const r = tp.kind === 'sink' ? tp.R * 0.95 : K.trig; if (!me.dead && inEll(tp, me.x, me.y, r)) return true; for (const m of X.mons) if (groundMon(m) && inEll(tp, m.x, m.y, r * 0.8)) return true; return false; }
  const resFront = (tp, u) => 0.45 + (tp.K.R * (tp.sc || 1) - 0.45) * ease(u);
  function inArea(tp, x, y, r, u) { const K = tp.K;
    if (tp.kind === 'tooth') return tp.t <= K.hitW && segD(x, y, tp.x, tp.y, tp.x1, tp.y1) < K.w + r * 0.5;
    if (tp.kind === 'res') { const d = hyp(x - tp.x, (y - tp.y) / FR); return u < 1 && Math.abs(d - resFront(tp, u)) < K.band + r * 0.5; }
    if (tp.kind === 'shard') { if (tp.t > K.hitW) return false; for (const [ex, ey] of tp.rays) if (segD(x, y, tp.x, tp.y, ex, ey) < K.w + r * 0.5) return true; return false; }
    if (tp.kind === 'sink') return tp.t <= K.hitW && inEll(tp, x, y, K.core * (tp.sc || 1) + r * 0.5);
    return tp.t <= K.hitW && inEll(tp, x, y, tp.R + r * 0.6); }
  function strike(F, tp) { const X = F.X, me = X.me, K = tp.K, u = tp.t / K.burst;
    if (!tp.hit && !tp.demo && !me.dead && inArea(tp, me.x, me.y, me.r || 0.3, u)) { tp.hit = true; const by = F.stat.byKind[tp.kind] || (F.stat.byKind[tp.kind] = { hits: 0, dodged: 0, lost: 0 });
      if (me.dodge) { F.stat.dodged++; by.dodged++; }
      else { const hp0 = me.hp, ok = X.hurtPet(dmgOf(F, tp.kind), null); if (ok) { F.stat.hits++; by.hits++; by.lost += hp0 - me.hp;
          let a; if (tp.kind === 'tooth') { const ax = tp.x1 - tp.x, ay = tp.y1 - tp.y, s = (me.x - tp.x) * -ay + (me.y - tp.y) * ax >= 0 ? 1 : -1, l = hyp(ax, ay) || 1; a = Math.atan2(ax / l * s, -ay / l * s); } else a = Math.atan2(me.y - tp.y, me.x - tp.x);
          if (tp.kind === 'hands') F.hold = K.hold; else if (!tp.bridge && K.shove) X.push(isFinite(a) ? a : Math.random() * TAU, K.shove); if (tp.kind === 'gas') F.choke = K.choke; }
        else { F.stat.dodged++; by.dodged++; } } }
    // monsters caught (bosses, mini bosses and the fiend never)
    if (tp.demo || !tp.on || !tp.hm) return; const flyToo = tp.kind === 'vent' || tp.kind === 'gas' || tp.kind === 'shard';
    for (const m of X.mons) { if (tp.hm.has(m) || !(flyToo ? anyMon(m) : groundMon(m))) continue; if (!inArea(tp, m.x, m.y, m.r || 0.4, u)) continue; tp.hm.add(m); F.stat.monHits++; try { X.hitMon(m, dmgOf(F, tp.kind) * 2, { src: 'hazard', noCrit: true }); } catch (e) {} } }
  function burstFx(F, tp) { const X = F.X, K = tp.K, low = lowFx(); if (!tp.on) return; const n = low ? 6 : 12, [cx, cy] = midOf(tp);
    if (tp.kind === 'sink') { for (let i = 0; i < n; i++) { const a = Math.random() * TAU; X.part({ kind: 'sand', x: tp.x + Math.cos(a) * 0.25, y: tp.y - 0.1, vx: Math.cos(a) * (1 + Math.random() * 2), vy: -2.5 - Math.random() * 2.5, g: 7, life: 0.6, max: 0.6, size: 2.5 + Math.random() * 2, color: Math.random() < 0.6 ? '#D9A866' : K.hi }); } say(X, 'thud'); X.shake && X.shake(2, 0.15); }
    else if (tp.kind === 'tooth') { X.sparks && X.sparks(cx, cy, K.hi, low ? 5 : 10, 4); say(X, 'crack'); X.shake && X.shake(2.4, 0.14); }
    else if (tp.kind === 'res') { say(X, 'note', 262, 0.9, 'sine', 0.16); say(X, 'note', 131, 1.2, 'sine', 0.12); X.shake && X.shake(2.5, 0.2); }
    else if (tp.kind === 'vent') { for (let i = 0; i < n; i++) X.part({ kind: 'sand', x: tp.x + (Math.random() - 0.5) * 0.7, y: tp.y - 0.2, vx: (Math.random() - 0.5) * 2.2, vy: -5 - Math.random() * 4, g: 5, life: 0.9, max: 0.9, size: 2.5 + Math.random() * 2.5, color: Math.random() < 0.5 ? '#E8B07A' : K.hi }); say(X, 'whoosh'); X.shake && X.shake(2, 0.16); }
    else if (tp.kind === 'shard') { say(X, 'crash'); say(X, 'sparkle'); X.shake && X.shake(2.6, 0.16); }
    else if (tp.kind === 'hands') { for (let i = 0; i < n; i++) { const a = Math.random() * TAU; X.part({ kind: 'sand', x: tp.x + Math.cos(a) * 0.4, y: tp.y + Math.sin(a) * 0.25, vx: Math.cos(a) * 1.5, vy: -2 - Math.random() * 2, g: 6, life: 0.5, max: 0.5, size: 2 + Math.random() * 2, color: '#4A6496' }); } say(X, 'crack'); say(X, 'thud'); X.shake && X.shake(2.2, 0.15); }
    else if (tp.kind === 'gas') { say(X, 'whoosh'); say(X, 'bubble'); X.shake && X.shake(1.4, 0.14); } }

  /* ---------------- drawing ---------------- */
  const lvl = tp => tp.st === 'warn' ? ease(tp.t / tp.K.warn) : tp.st === 'burst' ? 1 : 0;   // (the build-up: calm 0 .. bright 1)
  const onScr = (X, Xs, Ys, T, m) => Xs > -T * m && Xs < X.W() + T * m && Ys > -T * m && Ys < X.H() + T * (m + 2);
  const mist = (Q, x, y, rx, ry, col, a, sd, drift) => { if (rx > 0.5 && a > 0.005) Q.quad(137, x, y, rx, 0, 0, ry, col, Math.min(1, a), drift || 1, sd || 0, 1); };   // (the painter's drifting bank of mist, kind 137, laid over: dust, haze, gas)
  function gpu(c, L) { if (!L.length) return; const F = fgx(); if (F) { try { const Q = F.begin(c, null); for (const f of L) f(Q); F.flush(c); STATS.gpu++; } catch (e) {} } L.length = 0; }
  const SINK = [];
  function drawGround(F, c) { const X = F.X, T = X.Tz(), t = X.g.t, lo = lowFx();
    for (const tp of F.traps) { const [cx, cy] = midOf(tp), Xs = X.sx(cx), Ys = X.sy(cy); if (!onScr(X, Xs, Ys, T, 4)) continue;
      const L = lo && tp.st === 'idle' && !(tp.stuck > 0.02) ? (SINK.length = 0, SINK) : F.LG;   /* (st.lowFx: a calm trap's breathing light left out; its picture and its light layer still show) */
      const K = tp.K, k = lvl(tp), calm = 0.5 + 0.5 * Math.sin(t * 1.4 + tp.sd), u = tp.st === 'burst' ? tp.t / K.burst : 0, sc = tp.sc || 1, v = tp.v % 2;
      if (tp.kind === 'sink') { const rs = tp.st === 'rest' ? clamp(tp.t / K.rest, 0, 1) : 1; draw(c, 'sink', v, Xs, Ys, T, { sx: sc, sy: sc }); const gk = tp.st === 'warn' ? 0.25 + 0.75 * k : tp.st === 'burst' ? 1 - u * 0.5 : tp.st === 'rest' ? 0.5 * (1 - rs) : 0.1 + 0.08 * calm;
        draw(c, 'sinkg', v, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: gk });
        L.push(Q => { if (tp.st === 'warn') { Q.evortex(Xs, Ys, T * tp.R * 0.95, '#E8A33A', 0.45 + 0.4 * k, 0.18 + 0.42 * k, tp.sd, -(1.5 + 5 * k), FR); Q.glow(Xs, Ys, T * tp.R * (0.6 + 0.5 * k), K.col, 0.12 + 0.35 * k, FR); Q.glow(Xs, Ys, T * 0.35, K.hi, 0.25 * k * k); }
          else if (tp.st === 'burst') { Q.glow(Xs, Ys, T * tp.R * 1.2, K.col, 0.45 * (1 - u), FR); Q.ewave(Xs, Ys, T * K.core * (0.6 + 0.9 * u), '#E0A060', 0.6, 0.5 * (1 - u), tp.sd, FR, 0.25); }
          else Q.glow(Xs, Ys, T * tp.R * 0.6, K.col, 0.05 + 0.04 * calm, FR); }); }
      else if (tp.kind === 'tooth') { const o = tp.o || 'h', gk = tp.st === 'warn' ? 0.3 + 0.7 * k : tp.st === 'burst' ? 1 - u * 0.6 : tp.st === 'rest' ? 0.05 : 0.14 + 0.08 * calm; draw(c, 'jaw', o, Xs, Ys, T); draw(c, 'jawg', o, Xs, Ys, T, { add: true, alpha: gk });
        const ax = X.sx(tp.x), ay = X.sy(tp.y), bx = X.sx(tp.x1), by2 = X.sy(tp.y1);
        L.push(Q => { if (tp.st === 'warn') { const f = ease(tp.t / K.warn); Q.rbeam(ax, ay, bx, by2, T * 0.4, K.col, 0.12 + 0.35 * f, 1, 1); Q.star(lerp(ax, Xs, f), lerp(ay, Ys, f), T * 0.3, 0.9, K.hi); Q.star(lerp(bx, Xs, f), lerp(by2, Ys, f), T * 0.3, 0.9, K.hi); }
          else if (tp.st === 'burst') { Q.rbeam(ax, ay, bx, by2, T * 0.6, K.col, 0.5 * (1 - u), 1, 1); Q.glow(Xs, Ys, T * 1.5, K.hi, 0.35 * (1 - u), 0.6); }
          else Q.rbeam(ax, ay, bx, by2, T * 0.22, K.col, 0.04 + 0.03 * calm, 1, 1); }); }
      else if (tp.kind === 'res') { L.push(Q => { Q.glow(Xs, Ys, T * (0.8 + 0.7 * k), K.col, 0.06 + 0.03 * calm + 0.35 * k, FR); if (tp.st === 'burst') { const fr = resFront(tp, u) * T; Q.ewave(Xs, Ys, fr, '#2FB8D8', 0.38, 0.95 * (1 - u * 0.6), tp.sd, FR, 0.14); Q.ripple(Xs, Ys, fr * 1.02, K.col, 0.55 * (1 - u * 0.7), tp.sd, FR, 0.07); Q.glow(Xs, Ys, fr * 1.1, K.col, 0.12 * (1 - u), FR); } }); }
      else if (tp.kind === 'vent') { const gk = tp.st === 'warn' ? 0.2 + 0.8 * k : tp.st === 'burst' ? 1 - u * 0.6 : 0.16 + 0.08 * calm; draw(c, 'vent', v, Xs, Ys, T, { sx: sc, sy: sc }); draw(c, 'ventg', v, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: gk * (0.85 + 0.15 * Math.sin(t * (4 + 18 * k))) });
        L.push(Q => { const col = k < 0.6 ? '#FF8A30' : '#FFC890'; Q.glow(Xs, Ys - T * 0.05, T * (0.7 + 0.7 * k) * sc, col, 0.06 + 0.03 * calm + 0.45 * k, FR); if (k > 0.2) Q.ground(Xs, Ys - T * 0.08, T * 0.32 * sc, 0.4 + 0.5 * k, 0.35 * k, tp.sd, 0.6, 1); if (tp.st === 'burst') Q.glow(Xs, Ys, T * K.r * 1.7 * sc, '#FFD8A0', 0.45 * (1 - u), FR); }); }
      else if (tp.kind === 'shard') { L.push(Q => { Q.glow(Xs, Ys, T * (0.7 + 0.5 * k), K.col, 0.14 + 0.06 * calm + 0.35 * k, FR);
          if (tp.st === 'warn') { const f = ease(tp.t / K.warn); for (const [ex, ey] of tp.rays) { const Ex = X.sx(ex), Ey = X.sy(ey), mx = lerp(Xs, Ex, Math.min(1, f * 1.15)), my = lerp(Ys, Ey, Math.min(1, f * 1.15)); Q.rbeam(Xs, Ys, mx, my, T * 0.26, K.col, 0.1 + 0.3 * f, 1, 0.25); Q.star(mx, my, T * 0.2, 0.5 + 0.5 * f, K.hi); } } }); }
      else if (tp.kind === 'mirage') { draw(c, 'mirage', 0, Xs, Ys, T, { sx: sc, sy: sc }); draw(c, 'mirg', 0, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: 0.25 + 0.15 * Math.sin(t * 1.7 + tp.sd) + 0.35 * tp.stuck });
        L.push(Q => { Q.caustic(Xs, Ys, T * 1.05 * sc, '#CFE8FF', 0.12 + 0.06 * calm + 0.2 * tp.stuck, tp.sd, FR); if (!lo) mist(Q, Xs, Ys - T * 0.25, T * 1.1 * sc, T * 0.45 * sc, '#FFE6C8', 0.12 + 0.12 * tp.stuck, tp.sd, 0.8); if (tp.stuck > 0.02) Q.glow(Xs, Ys, T * 1.3 * sc, '#FFF0D0', 0.25 * tp.stuck, FR); }); }
      else if (tp.kind === 'hands') { const gk = tp.st === 'warn' ? 0.25 + 0.75 * k : tp.st === 'burst' ? 1 - u * 0.5 : tp.st === 'rest' ? 0.35 * (1 - clamp(tp.t / 1.5, 0, 1)) : 0.34 + 0.14 * calm; draw(c, 'grave', v, Xs, Ys, T, { sx: sc, sy: sc }); draw(c, 'graveg', v, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: gk });
        L.push(Q => { Q.glow(Xs, Ys, T * (0.7 + 0.6 * k) * sc, K.col, 0.05 + 0.03 * calm + 0.35 * k, FR); if (tp.st === 'burst') Q.glow(Xs, Ys, T * 1.4 * sc, K.hi, 0.3 * (1 - u), FR); }); }
      else if (tp.kind === 'quick') { const sk = clamp(tp.sink || 0, 0, 1); draw(c, 'quick', 0, Xs, Ys, T, { sx: sc, sy: sc }); draw(c, 'quickg', 0, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: 0.2 + 0.12 * calm + 0.3 * tp.stuck + 0.4 * sk });
        L.push(Q => { Q.evortex(Xs, Ys, T * tp.R * 0.9, '#9DB8F0', 0.3, 0.05 + 0.04 * calm + 0.18 * tp.stuck, tp.sd, 0.35, FR); if (tp.stuck > 0.02) { const me = X.me; Q.glow(X.sx(me.x), X.sy(me.y), T * (0.9 - 0.45 * sk), K.hi, (0.18 + 0.45 * sk) * tp.stuck, FR); } }); }
      else if (tp.kind === 'gas') { L.push(Q => { Q.glow(Xs, Ys, T * (0.8 + 0.7 * k), K.col, 0.06 + 0.03 * calm + 0.4 * k, FR); }); } }
    gpu(c, F.LG); }
  // the jaw's teeth: rows along both ridges, rising and snapping shut; [x, y (world), row -1|1, i]
  function teeth(tp) { if (tp.T) return tp.T; const n = 5, o = tp.o || 'h', [cx, cy] = midOf(tp), L = []; for (const row of [-1, 1]) for (let i = 0; i < n; i++) { const s = ((i + (row > 0 ? 0.5 : 0)) / n - 0.45) * 2 * (JAW_L - 0.2); L.push(o === 'v' ? [cx + row * JAW_T, cy + s, row, i] : [cx + s, cy + row * JAW_T, row, i]); } L.sort((a, b) => a[1] - b[1]); return (tp.T = L); }
  function drawStand(F, tp, c) { const X = F.X, T = X.Tz(), t = X.g.t, K = tp.K, k = lvl(tp), Xs = X.sx(tp.x), Ys = X.sy(tp.y), calm = 0.5 + 0.5 * Math.sin(t * 1.4 + tp.sd), u = tp.st === 'burst' ? tp.t / K.burst : 0, sc = tp.sc || 1, v = tp.v % 2;
    if (tp.kind === 'tooth') { const [cx, cy] = midOf(tp); if (!onScr(X, X.sx(cx), X.sy(cy), T, 3)) return; const o = tp.o || 'h';
      const rise = tp.st === 'warn' ? 0.3 + 0.7 * ease(tp.t / K.warn) : tp.st === 'burst' ? 1 : tp.st === 'rest' ? Math.max(0.3, 1 - tp.t / 0.5 * 0.7) : 0.3, snap = tp.st === 'burst' ? (1 - Math.pow(1 - Math.min(1, u / 0.25), 3)) * (1 - Math.max(0, u - 0.6) / 0.4) : 0, gl = tp.st === 'warn' ? 0.2 + 0.8 * k : tp.st === 'burst' ? 1 - u * 0.7 : 0.08 + 0.05 * calm, trem = tp.st === 'warn' ? Math.sin(t * 40) * 0.02 * k : 0;
      for (const [wx, wy, row, i] of teeth(tp)) { const Xi = X.sx(wx) + (o === 'v' ? -row * snap * T * 0.36 + trem * T : 0), Yi = X.sy(wy) + (o === 'h' ? -row * snap * T * 0.36 : 0), fv = (i + (row > 0 ? 1 : 0)) % 3, sy = rise * (0.85 + 0.2 * hh(i + row * 7, 3)) * (o === 'h' && row < 0 ? 1 - 0.3 * snap : 1), rot = o === 'v' ? row * -0.55 * snap : 0, sx = (row > 0 ? -1 : 1) * (o === 'v' ? 1 : 0.95);
        draw(c, 'fang', fv, Xi, Yi, T, { sx, sy, rot }); if (gl > 0.02) draw(c, 'fangg', fv, Xi, Yi, T, { sx, sy, rot, add: true, alpha: gl }); } return; }
    if (tp.kind === 'res') { if (!onScr(X, Xs, Ys, T, 3)) return; const jit = tp.st === 'warn' ? Math.sin(t * 60) * T * 0.012 * k : 0; const rs = { sx: RES_K, sy: RES_K }; draw(c, 'res', v, Xs + jit, Ys, T, rs);
      for (let b = 0; b < 3; b++) { const on = tp.st === 'warn' ? clamp(k * 3.2 - b, 0, 1) : tp.st === 'burst' ? 1 - u * 0.8 : tp.st === 'idle' ? 0.12 + 0.08 * Math.sin(t * 1.4 + tp.sd + b) : 0; if (on > 0.02) draw(c, 'resb', b, Xs + jit, Ys, T, { sx: RES_K, sy: RES_K, add: true, alpha: on * (0.85 + 0.15 * Math.sin(t * (6 + 20 * k) + b)) }); }
      draw(c, 'resg', 0, Xs + jit, Ys, T, { sx: RES_K, sy: RES_K, add: true, alpha: 0.2 + 0.1 * calm + 0.7 * k }); return; }
    if (tp.kind === 'shard') { if (!onScr(X, Xs, Ys, T, 3)) return; const rg = tp.st === 'rest' ? ease(clamp((tp.t - 0.8) / (K.rest - 1.2), 0, 1)) : 1, s = SHARD_K * (tp.st === 'rest' ? 0.35 + 0.65 * rg : 1 + (tp.st === 'warn' ? 0.04 * k * Math.sin(t * 40) : 0));
      draw(c, 'shard', v, Xs, Ys, T, { sx: s * sc, sy: s * sc, alpha: tp.st === 'rest' ? 0.55 + 0.45 * rg : 1 }); draw(c, 'shardg', v, Xs, Ys, T, { sx: s * sc, sy: s * sc, add: true, alpha: tp.st === 'rest' ? 0.1 * rg : 0.28 + 0.12 * calm + 0.7 * k }); return; }
    if (tp.kind === 'vent') return;
    if (tp.kind === 'hands') { if (!onScr(X, Xs, Ys, T, 3)) return; let h = 0, cl = 0; if (tp.st === 'warn') { const f = ease(tp.t / K.warn); h = 0.15 + 0.2 * f; cl = 0.2 * f; } else if (tp.st === 'burst') { h = Math.min(1, u / 0.2) * 1.05; cl = 0.2 + 0.8 * Math.min(1, Math.max(0, (u - 0.25) / 0.3)); } else if (tp.st === 'rest' && tp.t < 0.6) { h = 1.05 * (1 - tp.t / 0.6); cl = 1; } if (h < 0.02) return;
      for (const s of [-1, 1]) { const hx = Xs + s * T * 0.4 * sc + (tp.st === 'warn' ? Math.sin(t * 30 + s) * T * 0.02 : 0), hy = Ys + T * 0.04; draw(c, 'hand', s < 0 ? 0 : 1, hx, hy, T, { sx: HAND_K * sc * (1 - 0.15 * cl), sy: HAND_K * h * sc, rot: s * -0.35 * cl }); } return; }
    if (tp.kind === 'gas') { if (!onScr(X, Xs, Ys, T, 3)) return; draw(c, 'gas', v, Xs, Ys, T, { sx: sc, sy: sc }); const gk = tp.st === 'burst' ? 1 - u * 0.7 : k; draw(c, 'gasg', v, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: 0.12 + 0.08 * calm + 0.85 * gk * (0.85 + 0.15 * Math.sin(t * (5 + 16 * k))) }); return; } }
  function drawOver(F, c) { const X = F.X, T = X.Tz(), t = X.g.t, L = F.LL, lo = lowFx();
    for (const tp of F.traps) { const K = tp.K, k = lvl(tp), Xs = X.sx(tp.x), Ys = X.sy(tp.y), u = tp.st === 'burst' ? tp.t / K.burst : 0, sc = tp.sc || 1; if (ZONE[tp.kind]) continue;
      if (tp.kind === 'sink') { if (tp.st !== 'warn' && tp.st !== 'burst' || !onScr(X, Xs, Ys, T, 3)) continue;
        if (tp.st === 'warn') { if (!lo) L.push(Q => { const n = 6; for (let i = 0; i < n; i++) { const ph = (t * (0.6 + 1.2 * k) + i / n) % 1, a = i / n * TAU + t * (1 + 3 * k), d = T * tp.R * (1 - ph) * 0.9; Q.star(Xs + Math.cos(a) * d, Ys + Math.sin(a) * d * FR, T * 0.07, 0.8 * k * Math.sin(ph * Math.PI), K.hi); } }); }
        else L.push(Q => { const n = lo ? 3 : 5; for (let i = 0; i < n; i++) { const a = i / n * TAU + tp.sd, d = T * (0.2 + 0.8 * u); Q.smoke(Xs + Math.cos(a) * d, Ys - T * 0.2 - T * 0.5 * u + Math.sin(a) * d * 0.4, T * (0.35 + 0.5 * u), 0.4 * (1 - u), tp.sd + i, '#B88A50', 0.6); } }); continue; }
      if (tp.kind === 'tooth') { if (tp.st !== 'burst' || u > 0.5) continue; const [cx, cy] = midOf(tp), Cx = X.sx(cx), Cy = X.sy(cy); if (!onScr(X, Cx, Cy, T, 3)) continue; L.push(Q => { const n = lo ? 3 : 6; for (let i = 0; i < n; i++) { const s = (i + 0.5) / n; Q.star(lerp(X.sx(tp.x), X.sx(tp.x1), s), lerp(X.sy(tp.y), X.sy(tp.y1), s) - T * 0.35, T * 0.18 * (1 - u * 2), 1 - u * 2, K.hi); } }); continue; }
      if (tp.kind === 'res') { if (!onScr(X, Xs, Ys, T, 3) || (tp.st !== 'warn' && tp.st !== 'burst')) continue; L.push(Q => { const top = Ys - T * RES_H * RES_K; Q.glow(Xs, top + T * 0.1, T * (0.35 + 0.4 * k), K.col, (0.15 + 0.5 * k) * (tp.st === 'burst' ? 1 - u : 1));
          if (tp.st === 'warn' && !lo) for (let i = 0; i < 4; i++) { const ph = (t * (0.8 + 1.6 * k) + i / 4) % 1; Q.star(Xs + Math.sin(i * 2.1 + t * 3) * T * 0.25, Ys - T * (0.15 + ph * 1.1), T * 0.07, k * Math.sin(ph * Math.PI), K.hi); }
          if (tp.st === 'burst') Q.star(Xs, top + T * 0.05, T * (0.9 - 0.6 * u), 1 - u, '#FFFFFF'); }); continue; }
      if (tp.kind === 'vent') { if (!onScr(X, Xs, Ys, T, 3)) continue;
        if (tp.st === 'warn' || tp.st === 'idle' && !lo) { const sp = 0.4 + 2.0 * k, n = lo ? 3 : tp.st === 'idle' ? 2 : 4 + Math.round(5 * k); L.push(Q => { for (let i = 0; i < n; i++) { const ph = (t * sp + i / n + tp.sd) % 1, bx = Xs + (hh(i, 7) - 0.5) * T * 1.1 * sc + Math.sin(t * 2 + i) * T * 0.1; Q.star(bx, Ys - T * (0.15 + ph * (0.9 + 1.4 * k)), T * (0.05 + 0.04 * k), (0.2 + 0.7 * k) * Math.sin(ph * Math.PI), i % 3 ? K.col : K.hi); }
            if (k > 0) { Q.glow(Xs, Ys - T * 0.5, T * (0.5 + 0.4 * k), K.col, 0.3 * k); if (!lo) mist(Q, Xs, Ys - T * (0.5 + 0.3 * k), T * (0.5 + 0.3 * k), T * 0.6, '#E8C8A8', 0.25 * k, tp.sd, 1.5); } }); }
        else if (tp.st === 'burst') L.push(Q => { const rise = Math.min(1, u / 0.18), H = T * 3.2 * rise * sc, fa = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1, n = lo ? 3 : 6;
          Q.glow(Xs, Ys + T * 0.05, T * 1.8 * sc, '#FF9A48', 0.4 * fa, FR); Q.glow(Xs, Ys - H * 0.5, T * 1.1, K.col, 0.32 * fa, 1.9);
          for (let i = 0; i < n; i++) { const s = (i + 0.5) / n, w = T * (0.42 + 0.5 * s + 0.35 * u); mist(Q, Xs + Math.sin(i * 1.7 + t * 2) * T * 0.12, Ys - T * 0.2 - H * s, w, w * 0.8, i % 2 ? '#D8A47A' : '#F4E2CC', 0.7 * fa * (1 - 0.35 * s), tp.sd + i, 2.5); }
          Q.etongue(Xs, Ys + T * 0.02, T * 0.34, H * 0.5, Math.sin(t * 13) * 0.04, '#FFB070', 0.6, 0.5 * fa, tp.sd); Q.spray(Xs, Ys - H, T * (0.9 + 0.7 * u) * sc, '#FFF4E8', 0.55 * fa, tp.sd, 1, 1);
          if (!lo) for (let i = 0; i < 8; i++) { const a = i * 0.79 + tp.sd, d = T * (0.2 + 1.3 * u); Q.star(Xs + Math.cos(a) * d, Ys - H * (0.4 + 0.5 * hh(i, 2)) + Math.sin(a) * d * 0.3, T * 0.08, 0.85 * fa, i % 2 ? K.col : K.hi); } });
        continue; }
      if (tp.kind === 'shard') { if (tp.st !== 'burst' || !onScr(X, Xs, Ys, T, 4)) continue; L.push(Q => { const f = 1 - Math.pow(1 - Math.min(1, u / 0.6), 2), fa = 1 - u;
          for (const [ex, ey] of tp.rays) { const Ex = X.sx(ex), Ey = X.sy(ey), hx = lerp(Xs, Ex, f), hy = lerp(Ys - T * 0.5, Ey - T * 0.2, f), tx = lerp(Xs, Ex, Math.max(0, f - 0.35)), ty = lerp(Ys - T * 0.5, Ey - T * 0.2, Math.max(0, f - 0.35)); Q.rbeam(tx, ty, hx, hy, T * 0.3, K.col, 0.95 * fa, 0, 1); Q.rbeam(tx, ty, hx, hy, T * 0.1, K.hi, 0.9 * fa, 0, 1); Q.rbeam(Xs, Ys, lerp(Xs, Ex, f), lerp(Ys, Ey, f), T * 0.45, K.col, 0.3 * fa, 1, 0.2); Q.star(hx, hy, T * 0.42 * fa, fa, K.hi); }
          Q.glow(Xs, Ys - T * 0.5, T * 1.4, K.hi, 0.55 * fa * fa, 0.9); }); continue; }
      if (tp.kind === 'hands') { if (!onScr(X, Xs, Ys, T, 3)) continue; if (tp.st === 'warn') { if (!lo) L.push(Q => { for (let i = 0; i < 4; i++) { const ph = (t * (0.7 + 1.5 * k) + i / 4) % 1; Q.star(Xs + (hh(i, 9) - 0.5) * T * 1.2 * sc, Ys - T * ph * 0.9, T * 0.07, k * Math.sin(ph * Math.PI), i % 2 ? K.col : K.hi); } Q.glow(Xs, Ys - T * 0.2, T * 0.7, K.col, 0.25 * k); }); }
        else if (tp.st === 'burst') L.push(Q => { for (const s of [-1, 1]) Q.glow(Xs + s * T * 0.36 * sc, Ys - T * 0.6, T * 0.55, K.col, 0.4 * (1 - u)); }); continue; }
      if (tp.kind === 'gas') { if (!onScr(X, Xs, Ys, T, 4)) continue;
        if (tp.st === 'warn' || tp.st === 'idle' && !lo) { const n = lo ? 2 : tp.st === 'idle' ? 2 : 3 + Math.round(4 * k); L.push(Q => { for (let i = 0; i < n; i++) { const ph = (t * (0.35 + 1.4 * k) + i / n + tp.sd) % 1; mist(Q, Xs + (hh(i, 5) - 0.5) * T * 0.8 * sc + Math.sin(t + i) * T * 0.1, Ys - T * (0.2 + ph * (0.8 + 0.6 * k)), T * (0.28 + 0.3 * ph), T * (0.2 + 0.2 * ph), '#7CE86A', (0.15 + 0.4 * k) * Math.sin(ph * Math.PI), tp.sd + i, 1); }
            if (k > 0) { Q.glow(Xs, Ys - T * 0.4, T * (0.6 + 0.5 * k), K.col, 0.35 * k); if (!lo) for (let i = 0; i < 3; i++) { const ph = (t * 1.6 + i / 3) % 1; Q.star(Xs + Math.sin(i * 2.3 + t) * T * 0.3, Ys - T * (0.25 + ph * 0.9), T * 0.06, k * Math.sin(ph * Math.PI), K.hi); } } }); }
        else if (tp.st === 'burst') L.push(Q => { const n = lo ? 4 : 7, e = Math.sqrt(u); for (let i = 0; i < n; i++) { const a = i / n * TAU + tp.sd, d = T * (0.2 + 1.2 * e) * sc; mist(Q, Xs + Math.cos(a) * d, Ys - T * 0.35 + Math.sin(a) * d * FR - T * 0.3 * u, T * (0.55 + 0.6 * e), T * (0.4 + 0.45 * e), i % 2 ? '#5ED052' : '#9CF08A', 0.6 * (1 - u * 0.75), tp.sd + i, 1.2); }
          Q.glow(Xs, Ys - T * 0.3, T * K.r * 1.6 * sc, K.col, 0.45 * (1 - u), FR); if (!lo) for (let i = 0; i < 6; i++) { const a = i * 1.05 + tp.sd, d = T * (0.3 + 1.4 * e); Q.star(Xs + Math.cos(a) * d, Ys - T * 0.4 + Math.sin(a) * d * 0.5 - T * 0.5 * u, T * 0.08, 0.9 * (1 - u), i % 2 ? K.col : K.hi); } });
        continue; } }
    gpu(c, L); }

  /* ======================= the rift's stages ======================= */
  function ensureBase(X) { if (!BASE) { try { BASE = Math.round(X.Tz() * Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1)); } catch (e) { BASE = 48; } } }
  function stageTraps(X, self, H, sec, n, puz) { if (off() || !BP()) return null; ensureBase(X);
    clear(); const F = puz ? place(X, H, { sec, n: 1, puzzle: true, count: puz.n, kinds: puz.kinds }) : place(X, H, { sec, n }); self.dtraps = F;
    return { update(dt) { if (F.live && !F.freeze) F.tick(Math.min(dt, 0.1)); }, drawGround(c) { F.drawGround(c); }, drawOver(c) { F.drawOver(c); } }; }
  function merge(a, b) { if (!b) return a; const o = Object.assign({}, a);
    o.update = dt => { if (a.update) a.update(dt); b.update(dt); }; o.drawGround = c => { if (a.drawGround) a.drawGround(c); b.drawGround(c); }; o.drawOver = c => { if (a.drawOver) a.drawOver(c); b.drawOver(c); }; return o; }
  // (a puzzle's own object is kept as it is, its own methods wrapped in place: the stage and its tests hold on to it)
  function graft(a, b) { if (!b || !a) return a; const u0 = a.update, g0 = a.drawGround, o0 = a.drawOver;
    a.update = function (dt) { const r = u0 ? u0.apply(this, arguments) : undefined; b.update(dt); return r; }; a.drawGround = function (c) { if (g0) g0.apply(this, arguments); b.drawGround(c); }; a.drawOver = function (c) { if (o0) o0.apply(this, arguments); b.drawOver(c); }; return a; }
  function hook() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.dunes; if (!Rf || Rf.__dt) return; Rf.__dt = 1;
      Rf.stages.forEach((S, i) => { const pz = S.kind === 'puzzle' ? PUZ[S.name] : null; if (S.kind !== 'fight' && !pz) return; const P = typeof riftStagePos === 'function' ? riftStagePos(Rf, i) : { sec: 1, n: 1 }, sec = P.sec, n = P.n;
        if (S.kind === 'fight') { const ex = S.extra; S.extra = function (X, self, H) { const a = ex ? ex.call(this, X, self, H) || {} : {}; let b = null; try { b = stageTraps(X, self, H, sec, n, null); } catch (e) { b = null; if (typeof console !== 'undefined') console.warn('DUNE_TRAPS', e); } return merge(a, b); }; }
        else { const mk = S.make; S.make = function (X, self, H) { const a = mk.call(this, X, self, H); let b = null; try { b = stageTraps(X, self, H, sec, n, pz); } catch (e) { b = null; if (typeof console !== 'undefined') console.warn('DUNE_TRAPS', e); } return graft(a, b); }; }
        const pre = S.preload, kinds = pz ? pz.kinds.filter((k, j, a2) => a2.indexOf(k) === j) : null; S.preload = function (P2) { let a = []; try { a = pre ? pre.apply(this, arguments) || [] : []; } catch (e) {} return (Array.isArray(a) ? a : []).concat(warm(P2, sec, kinds)); }; S.dtSec = sec; S.dtN = n; }); } catch (e) {} }
  hook();
  // the dead stage let go: when any stage is made or closed (its field, the slows it set, every picture)
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(release); } catch (e) {}
  try { const GD = typeof GAMES !== 'undefined' && GAMES.dungeon; if (GD && GD.create && !GD.__dtRel) { const c0 = GD.create; GD.__dtRel = 1; GD.create = function () { release(); const gm = c0.apply(this, arguments); try { if (gm && typeof gm.destroy === 'function') { const d0 = gm.destroy; gm.destroy = function () { release(); return d0.apply(this, arguments); }; } } catch (e) {} return gm; }; } } catch (e) {}
  const API = { place, clear, release, KINDS, SPEC, MIX, BRIDGE, PUZ, kindsOf, TAUGHT, fields: () => FIELDS, dmg: dmgOf, draw, sprite: (n, v, P) => sprite(n, v, P, true), warm, hook, DEFS, PICS, LIGHTS, hashLayout, get base() { return BASE; }, set base(v) { BASE = v | 0; }, get stats() { return Object.assign({ cached: CACHE.size, live: FIELDS.length }, STATS); } };
  try { self.DUNE_TRAPS = API; } catch (e) {}
  return API;
})();
