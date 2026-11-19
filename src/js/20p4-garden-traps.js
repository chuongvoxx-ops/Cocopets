/* ---------- v423 GT: the Garden of Unborn Stars' floor traps (Rift 02, its three sections' dungeons) ----------
   Six original garden traps laid through the fight stages of Rift 02 (the Egg Orchard, the Moss Terraces, the Glassless
   Conservatory, the Pollen Galleries, the Thorn Walks, the Root Cellars): in their rooms and on their vine bridges, on top of
   the floor's own thorn spikes and the Tower's traps (left as they were). Not in the puzzles, the mini-games or the boss
   arenas. Each one TELLS by its own glow and motion only (no red area circles, no countdowns), from calm to bright:
     pod    BURSTING EGG-PODS  a rose egg-pod on root claws: when anything comes near it swells, wobbles and its seams glow
                               cream, then it bursts in a cloud of spores (r 1.5) and stands as a split husk while it regrows
     whip   BRAMBLE WHIPS      a thorny bramble lying along a lane from its root knot (in rooms from the island's edge, on
                               the vine bridges from the void beside them): it rears up as its thorns light from root to
                               tip, then lashes flat along the lane; cross between lashes
     gey    POLLEN GEYSERS     trumpet blossoms on a moss mound: they glow gold and pollen rises faster and faster, then a
                               column of pollen blasts up (r 1.15) and leaves the pet drowsy (slowed) for a moment
     sap    STICKY SAP         a glossy amber pool under a weeping bark knot: the pet wades through it slowly (no harm);
                               monsters too. It glows where something is stuck in it
     star   FALLING STAR-SEEDS a scorched ring of glassy husks on the moss: a star-seed glints high above it and falls, its
                               soft light growing on the floor under it, then it strikes (r 1.05)
     trip   ROOT SNARES        a taut glowing root between two knots: cross it and light races along it, then thorns erupt
                               along it; keep moving and they rise behind you
   Damage is tuned to the stage: the floor's own thorn spike's blow (12 x the floor's dmgMul, which carries the rift's level 20
   and its ease 0.6) times each kind's share (pod 1, whip 0.9, geyser 1, star-seed 1.25, snare 0.85), held to 4..14% of the
   pet's health. Monsters caught take twice it (as the floor hazards hit them); bosses and mini bosses are never touched.
   A dodge roll passes through every one of them. Only traps within 13 tiles of the pet run; the first of each kind the pet
   meets in a session plays once, harmlessly ("Safe to watch"), with a banner that names its tell.
   Density and the mix rise section by section (asked for, rooms + vine bridges): S1 11+3 / 12+4 (pods, geysers, sap, whips),
   S2 14+6 / 15+7 (+ star-seeds), S3 17+9 / 18+10 (+ root snares), closer together each section (2.5 / 2.2 / 1.9 tiles); the
   islands are small, so a cramped floor gets what fits (14..24 measured). Placed deterministically from the layout (a hash of
   its tiles and props), on plain floor (the tile floor, round it floor or moss-mud, nothing of the void, at most two props at
   its corners, and nothing tall standing just in front of it that would hide its tell), never near the start, the way on
   (and its mini boss), the packs' spawn points, shrines, stones, pots, nests, the thorn spikes or the Tower's traps; on the
   bridges only their straight 2-wide spans. Round traps lie on the floor as ellipses (depth 0.7 of their width) and their
   hit areas are those same ellipses. No trap is solid: none can block
   a path, and the timed ones always leave a window.
   Art: every model is painted once per sharpness by the Belfry's software shading pass (BELPROPS.kit, 20n9) in a garden light
   of its own (a cream moon key, plum shadows, a jade bounce, a rose rim) and finished with layered detail; each has a second
   picture of its own light (seams, throats, thorn tips, veins, glyphs) laid over additively as it builds, so its tell reads
   in the picture itself. The live light (floor glows, spores, pollen, the falling star, the lash, the eruption) is the GPU
   painter's (NIDHOGG_MOVES.FGFX) with its existing kinds; nothing is painted per frame. Without WebGL the pictures and their
   light layers still tell (no new 2D effects). st.lowFx thins the motes and puffs.
   Memory: the field and the pictures are let go when a stage is made or closed (GAMES.dungeon create / destroy, and
   BEL.onRelease); the pictures are warmed on the loading screen (the fight stages' S.preload) for the kinds that stage uses.
   window.__GT = 0 turns all of it off (the floors as before).
   API (global GARDEN_TRAPS): place(X, H, { sec, n, seed, count, br, kinds, teach }) -> field; clear(); release(); KINDS;
   SPEC; fields(); dmg(field, kind); stats; draw(c, name, v, Xs, Ys, T, o); sprite(name, v, P); warm(P, sec) */
var GARDEN_TRAPS = (() => {
  const TAU = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v, hyp = Math.hypot, lerp = (a, b, u) => a + (b - a) * u, ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const W_ = () => typeof window !== 'undefined' ? window : {};
  const off = () => W_().__GT === 0;
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const BP = () => { const w = W_(); return (w.BELPROPS && w.BELPROPS.kit && w.__BELP !== 0 && !off()) ? w.BELPROPS : null; };
  const fgx = () => { try { if (W_().__GT_GL === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const hh = (a, b) => { let n = (a * 374761393 + b * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const R1 = s => { let x = (s >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0, fields: 0, gpu: 0 };

  /* ======================= the kinds ======================= (times in s, sizes in tiles) */
  const KINDS = {
    pod: { name: 'BURSTING EGG-PODS', tell: 'A pod swells and its seams glow when anything comes near, then it bursts in spores: keep moving past it, or roll', col: '#E9A6D8', hi: '#FFF0D8', dmgK: 1.0, trig: 1.7, r: 1.5, warn: 0.85, burst: 0.6, hitW: 0.3, rest: 5.5, shove: 1.2 },
    whip: { name: 'BRAMBLE WHIPS', tell: 'The bramble rears up as its thorns light from root to tip, then lashes along its lane: cross between lashes', col: '#B8F07A', hi: '#F4FFD8', dmgK: 0.9, warn: 1.0, burst: 0.3, hitA: 0.03, hitB: 0.26, rec: 0.55, w: 0.42, shove: 1.1, per: [3.6, 4.6] },
    gey: { name: 'POLLEN GEYSERS', tell: 'The blossoms glow gold as pollen rises faster, then a column of pollen blasts up and leaves you drowsy: step off', col: '#FFD36B', hi: '#FFF6C8', dmgK: 1.0, r: 1.15, warn: 1.5, burst: 0.8, hitW: 0.5, shove: 1.2, drowsy: 1.2, slowK: 0.7, per: [5.0, 6.6] },
    sap: { name: 'STICKY SAP', tell: 'Glossy amber sap holds your feet: you wade through it slowly. Go round it, or roll across', col: '#FFB347', hi: '#FFE6B0', dmgK: 0, r: 1.1, slowK: 0.55 },
    star: { name: 'FALLING STAR-SEEDS', tell: 'A star-seed glints high above a scorched ring and its light grows on the floor as it falls: step out of the light', col: '#CFE4FF', hi: '#FFFFFF', dmgK: 1.25, r: 1.05, warn: 1.4, burst: 0.55, hitW: 0.18, shove: 1.4, per: [5.2, 7.0] },
    trip: { name: 'ROOT SNARES', tell: 'Cross a glowing root and light races along it, then thorns erupt from it: keep moving, never stop on it', col: '#8FF0C0', hi: '#E8FFF4', dmgK: 0.85, warn: 0.55, burst: 0.45, hitW: 0.3, rest: 3.0, w: 0.6, len: 2.2, shove: 0.9 },
  };
  /* per section: [first dungeon, second dungeon] { n: in the rooms, br: on the bridges }, the rooms' mix (weights), the
     bridges' kinds, the spacing */
  const SPEC = { 1: [{ n: 11, br: 3 }, { n: 12, br: 4 }], 2: [{ n: 14, br: 6 }, { n: 15, br: 7 }], 3: [{ n: 17, br: 9 }, { n: 18, br: 10 }] };
  const MIX = { 1: { pod: 4, gey: 3, sap: 2, whip: 3 }, 2: { pod: 3, gey: 3, sap: 2, whip: 3, star: 4 }, 3: { pod: 3, gey: 3, sap: 2, whip: 3, star: 3, trip: 3 } };
  const BRIDGE = { 1: ['whip', 'sap'], 2: ['whip', 'star', 'sap'], 3: ['whip', 'trip', 'star', 'sap', 'trip'] };
  const GAP = { 1: 2.5, 2: 2.2, 3: 1.9 };
  const kindsOf = sec => Object.keys(MIX[sec] || MIX[1]).concat(BRIDGE[sec] || []).filter((k, i, a) => a.indexOf(k) === i);

  /* ======================= the pictures (BELPROPS.kit, in the garden's light) ======================= */
  const FR = 0.7;   // (a round thing lying on the floor, as these pictures draw it and its hit area is measured: its depth over its width)
  const LIGHT = { a0: [0.11, 0.07, 0.13], a1: [0.1, 0.08, 0.14], e0: [0.12, 0.08, 0.15], e1: [0.5, 0.44, 0.62], k: [1.16, 1.08, 1.0], rim: [0.46, 0.3, 0.52], bo: [0.06, 0.15, 0.12] };
  function lit(K, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHT); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }
  const E = (k, r, g, b) => { const M = k.M; M.r = M.g = M.b = 0; M.fr = M.fg = M.fb = 0; M.mt = 0; M.rg = 1; M.cc = 0; M.sh = 0; M.ao = 0; M.er = r; M.eg = g; M.eb = b; };   // (a light layer: emission only)
  // materials (each sets k.M)
  function bark(k, u, v, sd) { const { M, vn, fbm, ss } = k, g = fbm(u * 3 + sd, v * 2.2 + sd * 0.5), fis = ss(0.08, 0.0, Math.abs(vn(u * 7 + sd, v * 1.6) - 0.5)); M.r = 0.17 * (0.7 + 0.55 * g); M.g = 0.1 * (0.7 + 0.55 * g); M.b = 0.13 * (0.7 + 0.55 * g); M.rg = 0.82; M.ao *= 1 - 0.45 * fis;
    const ms = ss(0.58, 0.78, vn(u * 2.1 + 5, v * 2.1 + sd)); if (ms > 0) { const w = 0.75 + 0.5 * vn(u * 23, v * 23 + sd); M.r = lerp(M.r, 0.14 * w, ms); M.g = lerp(M.g, 0.3 * w, ms); M.b = lerp(M.b, 0.24 * w, ms); M.rg = 0.95; } }
  function moss(k, u, v, sd) { const { M, vn, fbm, ss } = k, g = fbm(u * 4 + sd, v * 4), tip = ss(0.66, 0.82, vn(u * 26 + sd, v * 26)); M.r = (0.12 + 0.06 * g) * (1 + 0.6 * tip); M.g = (0.27 + 0.14 * g) * (1 + 0.45 * tip); M.b = (0.21 + 0.08 * g) * (1 + 0.3 * tip); M.rg = 0.95; const dk = ss(0.6, 0.3, vn(u * 9, v * 9 + sd)); M.ao *= 1 - 0.3 * dk; }
  function thornM(k, t) { const M = k.M, q = Math.pow(clamp(t, 0, 1), 1.4); M.r = lerp(0.68, 0.22, q); M.g = lerp(0.52, 0.07, q); M.b = lerp(0.54, 0.2, q); M.rg = 0.3; M.cc = 0.4; }
  function podSkin(k, dx, dy, sd, glowL) { const { M, vn, ss } = k, lon = Math.asin(clamp(dx / Math.sqrt(Math.max(1e-4, 1 - dy * dy)), -1, 1)), sv = Math.abs((((lon / Math.PI) * 5 + 0.5 + sd * 0.07) % 1 + 1) % 1 - 0.5), hy = (1 - dy) / 2;
    if (glowL) { const seam = ss(0.1, 0.0, sv) * (0.55 + 0.45 * ss(-0.9, 0.2, dy)), core = Math.max(0, 1 - Math.hypot(dx, dy)) * 0.35; E(k, 1.35 * seam + 0.9 * core, 1.05 * seam + 0.42 * core, 0.72 * seam + 0.8 * core); return; }
    M.r = lerp(0.3, 0.52, hy); M.g = lerp(0.12, 0.26, hy); M.b = lerp(0.27, 0.44, hy); const sp = ss(0.7, 0.86, vn(dx * 17 + sd, dy * 21 + sd)) * ss(0.35, 0.6, vn(dx * 4 + 2, dy * 5 + sd)); M.r = lerp(M.r, 0.86, sp * 0.8); M.g = lerp(M.g, 0.76, sp * 0.8); M.b = lerp(M.b, 0.6, sp * 0.8);
    M.rg = 0.42; M.cc = 0.35; const gr = ss(0.07, 0.0, sv); if (gr > 0) { M.ao *= 1 - 0.5 * gr; M.r *= 1 - 0.35 * gr; M.g *= 1 - 0.4 * gr; M.er += 0.06 * gr; M.eg += 0.045 * gr; M.eb += 0.03 * gr; }
    M.er += 0.035; M.eg += 0.01; M.eb += 0.03; }   // (a little light held in the skin)
  // an ellipsoid as the kit's ball, its mat returning its alpha (0: no pixel; < 0: the inside of a broken shell, lit from within)
  function ballX(k, S, cx, cy, rx, ry, mat) { const P = S.P, X0 = S.ax + cx * P, Y0 = S.ay + cy * P, RX = rx * P, RY = ry * P; if (RX < 0.4) return; S.lock();
    for (let py = Math.max(0, Math.floor(Y0 - RY - 1)); py <= Math.min(S.h - 1, Math.ceil(Y0 + RY + 1)); py++) for (let px = Math.max(0, Math.floor(X0 - RX - 1)); px <= Math.min(S.w - 1, Math.ceil(X0 + RX + 1)); px++) {
      const dx = (px + 0.5 - X0) / RX, dy = (py + 0.5 - Y0) / RY, e = dx * dx + dy * dy; if (e > 1 + 3 / RX) continue; const ny = Math.sqrt(Math.max(0, 1 - e)); k.M0(); k.M.ao = 0.7 + 0.3 * ny; const a = mat(dx, dy); if (!a) continue;
      let nx = dx, nyy = ny, nz = -dy; if (a < 0) { nx = -dx * 0.5; nyy = 0.6; nz = dy * 0.5 + 0.3; } const l = Math.hypot(nx, nyy, nz) || 1; k.shade(nx / l, nyy / l, nz / l); k.put(S, px, py, clamp((1 - Math.sqrt(e)) * Math.min(RX, RY) + 0.6, 0, 1) * Math.abs(a)); } }

  /* ---- the egg-pod (feet at 0, 0): root claws, the pod, a sprout; v 0..2; 'podg' its seams' light; 'podh' the split husk ---- */
  const POD = v => ({ cy: -0.92, rx: 0.46 + 0.03 * (v % 2), ry: 0.6 + 0.04 * ((v + 1) % 3) });
  function podRoots(k, S, v, sd, front) { const { cy, ry } = POD(v), R = [[-0.64, -0.07], [0.6, -0.05], [0.32, 0.17], [-0.3, 0.19]];
    for (const [fx, fy] of R) { if ((fy > 0.1) !== front) continue; k.tube(S, [[fx * 0.2, cy + ry * 0.6], [fx * 0.62, cy + ry * 0.92 + fy * 0.3], [fx * 1.02, fy - 0.01]], 0.085, 0.032, (t, s) => bark(k, t * 2 + fx * 3, s, sd)); } }
  function paintPod(k, S, v, mode) { const sd = 3.1 + v * 7.3, { cy, rx, ry } = POD(v), R = k.R1(101 + v * 17), glowL = mode === 'g';
    if (!glowL) k.contact(S, 0.02, 0.02, 0.74, 0.26, 0.62);
    if (!glowL) podRoots(k, S, v, sd, false);
    if (mode === 'h') {   // the husk: the front of the shell below a torn rim, the inside of its back wall above it, nothing over the back wall's broken top
      const rim = dx => -0.08 + 0.13 * Math.sin(dx * 7 + sd) + 0.06 * Math.sin(dx * 17 + sd * 2), top = dx => -0.46 + 0.12 * Math.sin(dx * 5 + sd);
      ballX(k, S, 0, cy, rx, ry, (dx, dy) => { const t0 = top(dx), r0 = rim(dx); if (dy < t0) return 0; if (dy < r0) { const M = k.M, f = k.vn(dx * 14 + sd, dy * 5); M.r = 0.13 + 0.05 * f; M.g = 0.05 + 0.02 * f; M.b = 0.12 + 0.05 * f; M.rg = 0.7; M.ao = 0.45 + 0.25 * (dy - t0); M.er = 0.05; M.eg = 0.02; M.eb = 0.05; return -clamp((dy - t0) * ry * S.P * 0.9 + 0.3, 0, 1); }
        podSkin(k, dx, dy, sd, false); if (dy - r0 < 0.06) { const M = k.M, q = 1 - (dy - r0) / 0.06; M.r = lerp(M.r, 0.85, q * 0.7); M.g = lerp(M.g, 0.72, q * 0.7); M.b = lerp(M.b, 0.62, q * 0.7); } return 1; }); }
    else ballX(k, S, 0, cy, rx, ry, (dx, dy) => { podSkin(k, dx, dy, sd, glowL); return 1; });
    if (!glowL) { podRoots(k, S, v, sd, true);
      if (mode !== 'h') { k.tube(S, [[0, cy - ry * 0.95], [0.05, cy - ry - 0.12], [0.17, cy - ry - 0.2]], 0.036, 0.014, () => { const M = k.M; M.r = 0.2; M.g = 0.42; M.b = 0.3; M.rg = 0.6; });
        k.ball(S, 0.22, cy - ry - 0.22, 0.1, 0.05, (dx, dy) => { const M = k.M; M.r = 0.24; M.g = 0.5; M.b = 0.34; M.rg = 0.55; M.cc = 0.3; }); }
      S.unlock(); k.ink(S, [22, 8, 26], 0.45); S.unlock();
      if (mode !== 'h') for (let i = 0; i < 2; i++) k.glint(S.c, -rx * 0.38 + R() * 0.1, cy - ry * 0.45 + R() * 0.12, 0.06 + R() * 0.03, 0.45 + R() * 0.2);
      else { const c = S.c; c.save(); for (let i = 0; i < 26; i++) { const a = R() * TAU, d = 0.35 + R() * 0.55; c.fillStyle = `rgba(${200 + R() * 40 | 0},${150 + R() * 50 | 0},${200 + R() * 40 | 0},${0.25 + R() * 0.35})`; const s = 0.015 + R() * 0.02; c.fillRect(Math.cos(a) * d - s / 2, Math.sin(a) * d * 0.34 - s / 2, s, s); } c.restore(); } } }

  /* ---- the pollen geyser (feet at 0, 0): a moss mound, five trumpet blossoms; v 0..1; 'geyg' the throats' light ---- */
  const GEY = v => { const B = [[0.02, -0.24, 0.86, 0.27], [-0.46, -0.13, 0.66, 0.24], [0.45, -0.11, 0.72, 0.25], [-0.17, 0.04, 0.52, 0.2], [0.24, 0.07, 0.48, 0.19]]; return v % 2 ? B.map(b => [-b[0], b[1], b[2] * (0.92 + 0.1 * hh(b[2] * 100 | 0, 3)), b[3]]) : B; };
  function paintGey(k, S, v, glowL) { const sd = 5.3 + v * 3.9;
    if (!glowL) { k.contact(S, 0, 0.03, 1.02, 0.34, 0.58); k.ball(S, 0, -0.1, 0.94, 0.32, (dx, dy) => moss(k, dx * 3, dy * 2, sd)); }
    else k.ball(S, 0, -0.1, 0.94, 0.32, () => E(k, 0, 0, 0));
    for (const [bx, by, H, Rr] of GEY(v)) { const prof = h => h < H * 0.45 ? 0.045 + 0.008 * Math.sin(h * 40) : 0.045 + (Rr - 0.045) * Math.pow(k.ss(H * 0.45, H, h), 1.7);
      k.rev(S, bx, by, prof, 0, H, { top: true, floorAO: 0.4,
        mat: (u, h) => { if (glowL) return E(k, 0, 0, 0); const M = k.M, hn = h / H; if (hn < 0.46) { M.r = 0.16; M.g = 0.34; M.b = 0.22; M.rg = 0.6; return; }
          const vein = k.ss(0.05, 0.0, Math.abs(((u / Rr * 2.2 + sd) % 1 + 1) % 1 - 0.5)), lip = k.ss(0.9, 1.0, hn); M.r = lerp(0.84, 0.97, lip); M.g = lerp(0.66, 0.9, lip); M.b = lerp(0.5, 0.76, lip); M.r = lerp(M.r, 0.66, vein * 0.55); M.g = lerp(M.g, 0.3, vein * 0.55); M.b = lerp(M.b, 0.5, vein * 0.55); M.rg = 0.45; M.cc = 0.3; M.er = 0.05 * hn; M.eg = 0.035 * hn; M.eb = 0.02 * hn; },
        capMat: (x, z, ao, _a, _b, _c, ey) => { const q = clamp(Math.hypot(x / Rr, ey || 0), 0, 1), st2 = k.ss(0.22, 0.0, q);
          if (glowL) return E(k, 1.6 * Math.pow(1 - q, 1.5) + 1.2 * st2, 1.15 * Math.pow(1 - q, 1.5) + 0.95 * st2, 0.3 * Math.pow(1 - q, 2) + 0.4 * st2);
          const M = k.M; M.r = lerp(0.16, 0.9, q * q); M.g = lerp(0.04, 0.6, q * q); M.b = lerp(0.1, 0.52, q * q); M.rg = 0.6; M.er = 0.3 * st2; M.eg = 0.22 * st2; M.eb = 0.04 * st2; } }); }
    if (!glowL) { S.unlock(); k.ink(S, [16, 18, 12], 0.4); S.unlock(); const R = k.R1(77 + v), c = S.c; c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 18; i++) { const x = (R() - 0.5) * 1.6, y = -0.15 - R() * 0.9, s = 0.012 + R() * 0.02; c.fillStyle = `rgba(255,${200 + R() * 40 | 0},110,${0.25 + R() * 0.35})`; c.fillRect(x, y, s, s); } c.restore(); } }

  /* ---- the bramble: a segment of thorny vine along x (centred), 'wsegg' its thorns' light; the root knot 'wknot' (feet 0, 0) ---- */
  function paintWseg(k, S, v, glowL) { const sd = 2.2 + v * 4.1, path = [[-0.46, 0.02], [-0.15, -0.03], [0.15, 0.02], [0.46, -0.02]];
    const thorns = [[-0.3, -1], [0.02, 1], [0.3, -1], [0.16, -1]];
    for (const [tx, sg] of thorns) if (sg > 0) k.tube(S, [[tx, 0.08], [tx + 0.09, 0.26], [tx + 0.15, 0.4]], 0.065, 0.005, t => glowL ? E(k, 0.6 * t + 0.1, 1.0 * t + 0.15, 0.35 * t) : thornM(k, t));
    k.tube(S, path, 0.17, 0.155, (t, s) => { if (glowL) { const vn = k.ss(0.35, 0, Math.abs(s + 0.45)); return E(k, 0.25 * vn, 0.45 * vn, 0.15 * vn); } bark(k, t * 1.8 + sd, s, sd); });
    for (const [tx, sg] of thorns) if (sg < 0) k.tube(S, [[tx, -0.09], [tx + 0.08, -0.27], [tx + 0.14, -0.41]], 0.065, 0.005, t => glowL ? E(k, 0.65 * t + 0.1, 1.05 * t + 0.15, 0.4 * t) : thornM(k, t));
    if (!glowL) { S.unlock(); k.ink(S, [18, 10, 18], 0.35); } }
  function paintKnot(k, S, v) { const sd = 8.8 + v * 2.7; k.contact(S, 0.02, 0.02, 0.66, 0.24, 0.6);
    for (const [fx, fy] of [[-0.62, -0.05], [0.58, 0.02], [-0.18, 0.2], [0.3, 0.18]]) k.tube(S, [[fx * 0.35, -0.2], [fx * 0.75, -0.06 + fy * 0.3], [fx, fy]], 0.07, 0.028, (t, s) => bark(k, t * 2 + fx, s, sd));
    k.rev(S, 0, 0.02, h => 0.34 - 0.1 * h / 0.62 + 0.035 * Math.sin(h * 19 + sd), 0, 0.62, { top: true, mat: (u, h) => bark(k, u * 1.5, h * 1.2, sd), capMat: (x, z, ao, _a, _b, _c, ey) => { const q = Math.hypot(x / 0.24, ey || 0), M = k.M; M.r = 0.3 + 0.08 * Math.sin(q * 22); M.g = 0.2 + 0.05 * Math.sin(q * 22); M.b = 0.16; M.rg = 0.7; } });
    k.tube(S, [[-0.28, -0.52], [-0.05, -0.72], [0.22, -0.66], [0.3, -0.5]], 0.09, 0.07, (t, s) => bark(k, t * 2.5, s, sd + 1));
    S.unlock(); k.ink(S, [18, 10, 18], 0.4); }

  /* ---- the sap pool (feet at its middle on the floor): a glossy amber pool, bubbles, a weeping knot; 'sapg' its glow ---- */
  function paintSap(k, S, v, glowL) { const { M, vn, ss } = k, KK = FR, P = S.P, sd = 6.6 + v * 3.3, RX = 1.12, rho = a => 1 + 0.09 * (vn(Math.cos(a) * 1.7 + sd, Math.sin(a) * 1.7) - 0.5) * 2;
    if (!glowL) k.contact(S, 0, 0.0, 1.25, 0.46, 0.45);
    S.lock(); const xa = Math.max(0, Math.floor(S.ax - RX * 1.2 * P)), xb = Math.min(S.w - 1, Math.ceil(S.ax + RX * 1.2 * P)), ya = Math.max(0, Math.floor(S.ay - RX * KK * 1.25 * P)), yb = Math.min(S.h - 1, Math.ceil(S.ay + RX * KK * 1.25 * P));
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { const x = (px + 0.5 - S.ax) / P, fy = (py + 0.5 - S.ay) / P / KK, a = Math.atan2(fy, x), rr = Math.hypot(x, fy) / (RX * rho(a)); if (rr > 1) continue;
      k.M0(); const al = clamp((1 - rr) * RX * KK * P * 2.2 + 0.4, 0, 1);
      if (glowL) { const q = 1 - rr; E(k, 1.25 * (0.3 + 0.7 * q), 0.62 * (0.3 + 0.7 * q), 0.12 * q); k.shade(0, 0.95, 0.31); k.put(S, px, py, al); continue; }
      const rip = vn(x * 6 + sd, fy * 6) - 0.5, rip2 = vn(x * 15 - sd, fy * 15) - 0.5, men = ss(0.82, 1.0, rr), dh = 0.14 * rr + 0.9 * men;
      const nx = (x / (rr * RX * RX + 1e-4)) * dh * 0.5 + rip * 0.12 + rip2 * 0.05, ny = (fy / (rr * RX * RX + 1e-4)) * dh * 0.5 + rip * 0.08;
      const deep = ss(0.95, 0.15, rr); M.r = lerp(0.46, 0.15, deep); M.g = lerp(0.19, 0.045, deep); M.b = lerp(0.02, 0.004, deep); M.fr = M.fg = M.fb = 0.03; M.rg = 0.05; M.cc = 0.7; M.sh = 0.8; M.ao = 0.9;
      M.er = 0.24 * (1 - rr) * (1 - rr) + 0.06; M.eg = 0.075 * (1 - rr) * (1 - rr) + 0.018; M.eb = 0.004;
      const dirt = ss(0.72, 0.86, vn(x * 9 + 3, fy * 9 + sd)) * (1 - deep * 0.6); M.r = lerp(M.r, 0.1, dirt * 0.5); M.g = lerp(M.g, 0.05, dirt * 0.5); if (men > 0.2) { M.r = lerp(M.r, 0.62, men * 0.5); M.g = lerp(M.g, 0.3, men * 0.5); }
      { const ty = ny + 0.62, l2 = Math.hypot(nx, ty, 1); k.shade(nx / l2, ty / l2, 1 / l2); } k.put(S, px, py, al); }   // (its normal turned a little toward us: the kit's rim and sky light are made for upright things and wash a flat pool out)
    const R = k.R1(31 + v * 7);
    if (!glowL) { for (let i = 0; i < 6; i++) { const a = R() * TAU, d = R() * 0.75, r = 0.035 + R() * 0.05; k.ball(S, Math.cos(a) * d * RX, Math.sin(a) * d * RX * KK - r * 0.4, r, r * 0.8, (dx, dy) => { M.r = 0.55; M.g = 0.3; M.b = 0.05; M.cc = 1; M.rg = 0.03; M.er = 0.12; M.eg = 0.05; }); }
      // the weeping knot at its back edge, a run of sap down it into the pool
      const kx = (v % 2 ? 0.55 : -0.55), ky = -RX * KK * 0.85; k.rev(S, kx, ky, h => 0.16 - 0.05 * h + 0.03 * Math.sin(h * 25 + sd), 0, 0.42, { top: true, mat: (u, h) => bark(k, u * 2, h * 2, sd), capMat: () => { M.r = 0.28; M.g = 0.18; M.b = 0.12; M.rg = 0.7; } });
      k.tube(S, [[kx + 0.03, ky - 0.3], [kx + 0.06, ky - 0.12], [kx + 0.02, ky + 0.06]], 0.035, 0.05, () => { M.r = 0.58; M.g = 0.3; M.b = 0.05; M.cc = 1; M.rg = 0.04; M.er = 0.1; M.eg = 0.04; });
      S.unlock(); k.ink(S, [26, 12, 6], 0.25); S.unlock(); for (let i = 0; i < 3; i++) k.glint(S.c, (R() - 0.6) * RX * 0.9, (R() - 0.7) * RX * KK * 0.8, 0.07 + R() * 0.04, 0.5 + R() * 0.3); } }

  /* ---- the star-seed's scar (feet at its middle): scorched moss, a glassy crater, husk shards, starflowers; 'scarg' its glyph
     of light; 'seed' the falling star-seed (centred) ---- */
  function paintScar(k, S, v, glowL) { const { M, vn, ss } = k, KK = FR, P = S.P, sd = 4.4 + v * 6.1, R = k.R1(53 + v * 11);
    if (!glowL) { const c = S.c; c.save(); c.scale(1, KK); for (let i = 0; i < 9; i++) { const a = R() * TAU, d = R() * 0.6, x = Math.cos(a) * d, y = Math.sin(a) * d, rr = 0.45 + R() * 0.45, g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, `rgba(12,6,16,${0.3 + R() * 0.2})`); g.addColorStop(1, 'rgba(12,6,16,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); } c.restore(); }
    S.lock(); const RC = 0.42, xa = Math.max(0, Math.floor(S.ax - 0.95 * P)), xb = Math.min(S.w - 1, Math.ceil(S.ax + 0.95 * P)), ya = Math.max(0, Math.floor(S.ay - 0.95 * KK * P)), yb = Math.min(S.h - 1, Math.ceil(S.ay + 0.95 * KK * P));
    for (let py = ya; py <= yb; py++) for (let px = xa; px <= xb; px++) { const x = (px + 0.5 - S.ax) / P, fy = (py + 0.5 - S.ay) / P / KK, a = Math.atan2(fy, x), r = Math.hypot(x, fy);
      if (glowL) { if (r > 0.9) continue; const ray = Math.pow(Math.abs(Math.cos(a * 4 + sd)), 26) * ss(0.88, 0.1, r) + Math.pow(Math.abs(Math.cos(a * 4 + sd + 0.39)), 40) * ss(0.6, 0.1, r) * 0.6, core = ss(0.32, 0.0, r), ring = Math.exp(-Math.pow((r - RC) / 0.05, 2)) * 0.5; E(k, 1.1 * ray + 1.3 * core + 0.8 * ring, 1.1 * ray + 1.2 * core + 0.85 * ring, 1.25 * ray + 1.05 * core + 1.1 * ring); k.shade(0, 0.95, 0.31); k.put(S, px, py, 1); continue; }
      if (r > RC + 0.06) continue; const q = r / RC, dz = -0.12 * (1 - q * q), nx = (x / RC) * 0.5 + (vn(x * 13 + sd, fy * 13) - 0.5) * 0.3, ny = (fy / RC) * 0.5 + (vn(x * 13, fy * 13 + sd) - 0.5) * 0.3, l = Math.hypot(nx, ny, 1);
      k.M0(); M.r = 0.05; M.g = 0.035; M.b = 0.08; M.rg = 0.08; M.cc = 1; M.ao = 0.75 + dz; const cr = ss(0.05, 0.0, Math.abs(vn(a * 2 + sd, r * 8) - 0.5)); M.er = 0.12 * cr; M.eg = 0.1 * cr; M.eb = 0.22 * cr;
      k.shade(nx / l, ny / l, 1 / l); k.put(S, px, py, clamp((RC + 0.06 - r) * P * 1.5, 0, 1)); }
    if (glowL) return;
    // glassy husk shards round the crater, leaning out; starflowers among them
    const N = 9; for (let i = 0; i < N; i++) { const a = (i / N) * TAU + R() * 0.5, d = RC + 0.08 + R() * 0.3, x = Math.cos(a) * d, y = Math.sin(a) * d * KK, h = 0.12 + R() * 0.16, lean = Math.cos(a) * 0.08;
      k.tube(S, [[x, y], [x + lean, y - h]], 0.045 + R() * 0.03, 0.006, t => { M.r = 0.55 + 0.2 * t; M.g = 0.58 + 0.2 * t; M.b = 0.85; M.rg = 0.05; M.cc = 1; M.er = 0.05 + 0.2 * t; M.eg = 0.06 + 0.2 * t; M.eb = 0.12 + 0.25 * t; }); }
    for (let i = 0; i < 6; i++) { const a = R() * TAU, d = 0.62 + R() * 0.3, x = Math.cos(a) * d, y = Math.sin(a) * d * KK; for (let j = 0; j < 5; j++) { const b = j / 5 * TAU + a; k.ball(S, x + Math.cos(b) * 0.035, y + Math.sin(b) * 0.035 * 0.6, 0.03, 0.02, () => { M.r = 0.92; M.g = 0.88; M.b = 0.8; M.rg = 0.4; M.er = 0.08; M.eg = 0.08; M.eb = 0.06; }); }
      k.ball(S, x, y, 0.018, 0.014, () => { M.r = 0.9; M.g = 0.7; M.b = 0.2; M.er = 0.5; M.eg = 0.38; M.eb = 0.08; }); }
    S.unlock(); k.ink(S, [16, 10, 26], 0.3); S.unlock(); for (let i = 0; i < 3; i++) k.glint(S.c, (R() - 0.5) * 1.1, (R() - 0.5) * 0.3, 0.05 + R() * 0.03, 0.55); }
  function paintSeed(k, S) { const { M, ss } = k; const c = S.c; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(0, 0, 0, 0, 0, 0.4); g.addColorStop(0, 'rgba(255,250,230,.55)'); g.addColorStop(0.4, 'rgba(190,215,255,.25)'); g.addColorStop(1, 'rgba(160,190,255,0)'); c.fillStyle = g; c.fillRect(-0.42, -0.42, 0.84, 0.84); c.restore();
    k.ball(S, 0, 0, 0.17, 0.23, (dx, dy) => { const lon = Math.asin(clamp(dx / Math.sqrt(Math.max(1e-4, 1 - dy * dy)), -1, 1)), rid = ss(0.08, 0, Math.abs(((lon / Math.PI * 3 + 0.5) % 1 + 1) % 1 - 0.5)), core = Math.max(0, 1 - Math.hypot(dx, dy * 0.9));
      M.r = 0.8 - 0.3 * rid; M.g = 0.78 - 0.3 * rid; M.b = 0.7 - 0.2 * rid; M.rg = 0.35; M.cc = 0.5; M.er = 1.4 * core * core * (1 - rid * 0.7); M.eg = 1.35 * core * core * (1 - rid * 0.7); M.eb = 1.2 * core * core; }); }

  /* ---- the root snare: a root between two knots on the floor ('h' across the screen, 'v' into it), 'tripg' its vein; a
     thorn of its eruption 'thorn' (feet 0, 0; v 0..2) ---- */
  function tripPts(k, o) { const KK = k.K, L = 1.1, pts = []; for (let i = 0; i <= 8; i++) { const s = i / 8 * 2 - 1, w = Math.sin(s * 3.1 + 0.6) * 0.05, lift = -0.05 * (1 - s * s); pts.push(o === 'v' ? [w, s * L + lift] : [s * L, w * KK + lift]); } return pts; }
  function paintTrip(k, S, o, glowL) { const { M } = k, sd = o === 'v' ? 3.3 : 7.7, pts = tripPts(k, o), a = pts[0], b = pts[pts.length - 1];
    if (glowL) { k.tube(S, pts, 0.12, 0.12, (t, s) => { const q = Math.pow(1 - Math.abs(s), 1.4); E(k, 0.55 * q + 0.1, 1.25 * q + 0.15, 0.85 * q + 0.1); });
      for (const p of [a, b]) k.ball(S, p[0], p[1] - 0.09, 0.24, 0.2, (dx, dy) => { const q = Math.max(0, 1 - Math.hypot(dx, dy)); E(k, 0.35 * q, 0.8 * q, 0.55 * q); }); return; }
    k.contact(S, 0, 0.02, o === 'v' ? 0.48 : 1.35, o === 'v' ? 0.48 : 0.26, 0.5);
    const knot = p => { for (let j = 0; j < 4; j++) { const an = j * 1.6 + sd, l = 0.3; k.tube(S, [[p[0], p[1]], [p[0] + Math.cos(an) * l, p[1] + Math.sin(an) * l * 0.34 + 0.02]], 0.055, 0.018, (t, s) => bark(k, t + j, s, sd)); }
      k.ball(S, p[0], p[1] - 0.09, 0.24, 0.2, (dx, dy) => bark(k, dx * 2 + p[0], dy * 2, sd)); };
    knot(a); k.tube(S, pts, 0.12, 0.12, (t, s) => { bark(k, t * 5, s, sd); M.r *= 1.15; M.g *= 1.1; M.er = 0.02; M.eg = 0.05; M.eb = 0.035; }); knot(b);
    S.unlock(); k.ink(S, [16, 10, 18], 0.35); }
  function paintThorn(k, S, v) { const { M } = k, lean = (v - 1) * 0.12, sd = 1.7 + v * 2.9;
    k.ball(S, 0, -0.02, 0.22, 0.09, (dx, dy) => moss(k, dx * 2 + sd, dy * 2, sd));
    k.tube(S, [[0, -0.02], [lean * 0.5, -0.45], [lean, -0.92]], 0.155, 0.008, t => thornM(k, t));
    k.tube(S, [[lean * 0.3, -0.34], [lean * 0.3 + 0.15, -0.5]], 0.045, 0.004, t => thornM(k, 0.3 + t * 0.7)); k.tube(S, [[lean * 0.55, -0.55], [lean * 0.55 - 0.13, -0.68]], 0.035, 0.004, t => thornM(k, 0.4 + t * 0.6));
    S.unlock(); k.ink(S, [20, 8, 18], 0.4); }

  const DEFS = {
    pod: { box: () => [-0.9, -1.85, 0.9, 0.42], paint: (k, S, v) => paintPod(k, S, v, '') }, podg: { box: () => [-0.9, -1.85, 0.9, 0.42], paint: (k, S, v) => paintPod(k, S, v, 'g') }, podh: { box: () => [-0.9, -1.85, 0.9, 0.42], paint: (k, S, v) => paintPod(k, S, v, 'h') },
    gey: { box: () => [-1.15, -1.25, 1.15, 0.45], paint: (k, S, v) => paintGey(k, S, v, false) }, geyg: { box: () => [-1.15, -1.25, 1.15, 0.45], paint: (k, S, v) => paintGey(k, S, v, true) },
    wseg: { box: () => [-0.55, -0.5, 0.55, 0.5], paint: (k, S, v) => paintWseg(k, S, v, false) }, wsegg: { box: () => [-0.55, -0.5, 0.55, 0.5], paint: (k, S, v) => paintWseg(k, S, v, true) }, wknot: { box: () => [-0.75, -0.95, 0.75, 0.4], paint: paintKnot },
    sap: { box: () => [-1.4, -1.05, 1.4, 0.92], paint: (k, S, v) => paintSap(k, S, v, false) }, sapg: { box: () => [-1.4, -1.05, 1.4, 0.92], paint: (k, S, v) => paintSap(k, S, v, true) },
    scar: { box: () => [-1.15, -0.85, 1.15, 0.78], paint: (k, S, v) => paintScar(k, S, v, false) }, scarg: { box: () => [-1.15, -0.85, 1.15, 0.78], paint: (k, S, v) => paintScar(k, S, v, true) }, seed: { box: () => [-0.45, -0.45, 0.45, 0.45], paint: paintSeed },
    trip: { box: v => v === 'v' ? [-0.6, -1.45, 0.6, 1.35] : [-1.55, -0.55, 1.55, 0.42], paint: (k, S, v) => paintTrip(k, S, v, false) }, tripg: { box: v => v === 'v' ? [-0.6, -1.45, 0.6, 1.35] : [-1.55, -0.55, 1.55, 0.42], paint: (k, S, v) => paintTrip(k, S, v, true) },
    thorn: { box: () => [-0.4, -1.05, 0.4, 0.18], paint: paintThorn } };
  const PICS = { pod: [['pod', 0], ['pod', 1], ['podg', 0], ['podg', 1], ['podh', 0], ['podh', 1]], gey: [['gey', 0], ['gey', 1], ['geyg', 0], ['geyg', 1]],
    whip: [['wseg', 0], ['wsegg', 0], ['wknot', 0]], sap: [['sap', 0], ['sapg', 0]], star: [['scar', 0], ['scar', 1], ['scarg', 0], ['scarg', 1], ['seed', 0]], trip: [['trip', 'h'], ['trip', 'v'], ['tripg', 'h'], ['tripg', 'v'], ['thorn', 0], ['thorn', 1], ['thorn', 2]] };
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0;
  function paint(name, v, P) { const B = BP(); if (!B) return null; const K = B.kit, D = DEFS[name], b = D.box(v), t0 = now(); let S = null;
    try { S = K.surface(b[0], b[1], b[2], b[3], P); lit(K, () => { D.paint(K, S, v); S.unlock(); }); } catch (e) { if (typeof console !== 'undefined') console.warn('GARDEN_TRAPS', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = document.createElement('canvas'); cv.width = S.w; cv.height = S.h; cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;   // (the work canvas given back at once: the plain copy is kept)
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  const keyOf = (name, v, P) => name + '|' + v + '|' + P;
  function sprite(name, v, P, force) { if (!DEFS[name] || !BP()) return null; P = Math.max(8, Math.round(P || BASE || 48)); const key = keyOf(name, v, P); let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 10) return null;   // (a painting budget: what does not fit waits a frame)
    s = paint(name, v, P); if (s) CACHE.set(key, s); return s; }
  function draw(c, name, v, Xs, Ys, T, o) { if (!BASE) return false; const s = CACHE.get(keyOf(name, v, BASE)) || sprite(name, v, BASE); if (!s) { STATS.misses++; return false; } o = o || {}; const f = T / s.P, sx = o.sx == null ? 1 : o.sx, sy = o.sy == null ? 1 : o.sy; STATS.draws++;
    c.save(); if (o.add) c.globalCompositeOperation = 'lighter'; if (o.alpha != null) c.globalAlpha *= clamp(o.alpha, 0, 1); c.translate(Xs, Ys); if (o.rot) c.rotate(o.rot); if (sx !== 1 || sy !== 1) c.scale(sx, sy); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); c.restore(); return true; }
  function warm(P, sec) { if (!BP() || !P || !(P.T > 0) || off()) return []; BASE = Math.round(P.T * (P.k || 1)); const jobs = []; for (const kd of kindsOf(sec || 3)) for (const [n, v] of PICS[kd] || []) jobs.push(() => { sprite(n, v, BASE, true); }); return jobs; }
  function releasePics() { CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); BASE = 0; }

  /* ======================= placing ======================= */
  function hashLayout(M) { let h = 2166136261 >>> 0; const G = M.G; for (let i = 0; i < G.length; i++) h = Math.imul(h ^ G[i], 16777619) >>> 0; h = Math.imul(h ^ (M.MW * 131 + M.MH), 16777619) >>> 0; if (M.props) M.props.forEach((v, k) => { h = Math.imul(h ^ k, 16777619) >>> 0; }); return h >>> 0; }   // (the tiles and the props standing on them)
  // (placing measures with sqrt, correctly rounded everywhere, and a hair of slack: Math.hypot may differ in its last bit between V8's tiers, which flipped ties on the tile grid)
  const dist = (x, y) => Math.sqrt(x * x + y * y), EPS = 1e-6;
  const segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1e-9; let t = ((px - ax) * dx + (py - ay) * dy) / l; t = clamp(t, 0, 1); return dist(px - ax - dx * t, py - ay - dy * t); };
  function exitOf(X) { const M = X.M; let far = M.bossAt || M.start, best = -1; for (const r of M.rooms) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2, d = dist(cx - M.start.x, cy - M.start.y); if (d > best) { best = d; far = { x: cx, y: cy }; } } return far; }   // (the room's middle: riftFight's freeSpot near it moves with the monsters, and the 3.6 kept clear covers it)
  function place(X, H, o) { o = o || {}; const M = X.M, MW = M.MW, MH = M.MH, G = M.G, props = M.props, sec = clamp(o.sec || 1, 1, 3), sp = (SPEC[sec] || SPEC[1])[clamp((o.n || 1) - 1, 0, 1)];
    const seed = o.seed != null ? o.seed >>> 0 : (hashLayout(M) ^ Math.imul(sec * 7 + (o.n || 1), 2654435761)) >>> 0, rnd = R1(seed), gap = o.minGap || GAP[sec], nRoom = o.count != null ? o.count : sp.n, nBr = o.br != null ? o.br : sp.br;
    const start = M.start || { x: X.me.x, y: X.me.y }, ex = exitOf(X);
    const isF = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && G[y * MW + x] === T_FLOOR && !(props && props.has(y * MW + x));
    const walk = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && (G[y * MW + x] === T_FLOOR || G[y * MW + x] === T_BRIDGE || G[y * MW + x] === T_MUD);
    // plain: the tile floor; its four neighbours floor or moss-mud, no prop; round it nothing of the void and at most one prop
    const flo = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && (G[y * MW + x] === T_FLOOR || G[y * MW + x] === T_MUD) && !(props && props.has(y * MW + x));
    // (and nothing standing in front of it, down the screen, whose picture would hide the trap and its tell)
    const PX = typeof PROP_EXT !== 'undefined' ? PROP_EXT : {}, hidden = (x, y) => { if (!props) return false; for (let dy = 1; dy <= 3; dy++) for (let dx = -1; dx <= 1; dx++) { const kp = props.get((y + dy) * MW + x + dx); if (kp == null) continue; const E = PX[kp] || [2.4, 2.9]; if (E[1] >= dy + 1.3 && (dx === 0 ? true : E[0] >= 2.6 && dy <= 2)) return true; } return false; };
    const plain = (x, y) => { if (!isF(x, y) || hidden(x, y)) return false; let pr = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; if (flo(x + dx, y + dy)) continue; if (dx && dy && props && props.has((y + dy) * MW + x + dx) && pr < 2) { pr++; continue; } return false; } return true; };
    // what is kept clear: the start, the way on and its mini boss, the packs' spawn points, shrines, stones, pots, nests, the loot gremlin, the floor's thorns, the Tower's traps (their tracks)
    const keep = [{ x: start.x, y: start.y, r: 4.5 }, { x: ex.x, y: ex.y, r: 3.6 }].concat(o.avoid || []), segs = [];
    for (const p of M.packs || []) keep.push({ x: p.x, y: p.y, r: 1.3 }); for (const p of M.shrines || []) keep.push({ x: p.x, y: p.y, r: 2.0 }); for (const p of M.stones || []) keep.push({ x: p.x, y: p.y, r: 1.6 }); for (const p of M.pots || []) keep.push({ x: p.x, y: p.y, r: 1.0 });
    for (const p of M.nests || []) keep.push({ x: p.x, y: p.y, r: 2.0 }); if (M.gremlin) keep.push({ x: M.gremlin.x, y: M.gremlin.y, r: 2.0 }); for (const h of M.hazards || []) if (!h.area && h.x != null) keep.push({ x: h.x, y: h.y, r: 1.15 });
    for (const t of M.traps || []) { if (t.x0 != null) segs.push([t.x0, t.y0, t.x1, t.y1, 1.3]); else if (t.x1 != null) segs.push([t.x, t.y, t.x1, t.y1, 1.3]); else if (t.len) segs.push([t.x, t.y, t.x + t.dx * t.len, t.y + t.dy * t.len, 1.3]); else keep.push({ x: t.x, y: t.y, r: 1.6 }); }
    const out = [];
    const clearPt = (x, y, r0) => keep.every(k => dist(x - k.x, y - k.y) >= k.r + (r0 || 0) - EPS) && segs.every(s => segD(x, y, s[0], s[1], s[2], s[3]) >= s[4] + (r0 || 0) - EPS);
    const clearSeg = (ax, ay, bx, by) => keep.every(k => segD(k.x, k.y, ax, ay, bx, by) >= k.r - EPS) && segs.every(s => segD(ax, ay, s[0], s[1], s[2], s[3]) >= s[4] - EPS && segD(bx, by, s[0], s[1], s[2], s[3]) >= s[4] - EPS);
    const farFromTraps = (ax, ay, bx, by, g) => out.every(q => { const qa = q.x1 != null ? segD(ax, ay, q.x, q.y, q.x1, q.y1) : dist(ax - q.x, ay - q.y), qb = q.x1 != null ? segD(bx, by, q.x, q.y, q.x1, q.y1) : dist(bx - q.x, by - q.y), qm = segD(q.x, q.y, ax, ay, bx, by); return Math.min(qa, qb, qm) >= g - EPS; });
    // the rooms' share of each kind (largest remainder over the section's weights), dealt over a seeded shuffle
    const mix = o.kinds ? o.kinds.reduce((a, k) => (a[k] = 1, a), {}) : (MIX[sec] || MIX[1]), names = Object.keys(mix).filter(k => KINDS[k]), wsum = names.reduce((s, k) => s + mix[k], 0), want = [];
    { const raw = names.map(k => nRoom * mix[k] / wsum), base = raw.map(Math.floor); let left = nRoom - base.reduce((s, v) => s + v, 0); const ord = raw.map((v, i) => [v - base[i], i]).sort((a, b) => b[0] - a[0]); for (let j = 0; j < left; j++) base[ord[j % ord.length][1]]++; names.forEach((k, i) => { for (let j = 0; j < base[i]; j++) want.push(k); }); }
    for (let i = want.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const q = want[i]; want[i] = want[j]; want[j] = q; }
    // candidate spots per room (plain floor, clear), shuffled
    const rooms = M.rooms && M.rooms.length ? M.rooms : [{ x: 0, y: 0, w: MW, h: MH }];
    const lists = rooms.map(r => { const c = []; for (let y = Math.max(1, r.y - 1); y < Math.min(MH - 1, r.y + r.h + 1); y++) for (let x = Math.max(1, r.x - 1); x < Math.min(MW - 1, r.x + r.w + 1); x++) { if (M.RM && M.RM[y * MW + x] !== rooms.indexOf(r) && rooms.length > 1) continue; if (plain(x, y) && clearPt(x + 0.5, y + 0.5)) c.push([x + 0.5, y + 0.5, rnd()]); } c.sort((a, b) => a[2] - b[2]); return c; });
    // a lane for a bramble: from an edge tile (the island's rim or a wall behind it) inward along plain floor; a snare: an axis across a plain tile
    const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    function laneAt(x0, y0, kd) { const tx = Math.floor(x0), ty = Math.floor(y0); const ds = DIRS.slice(); for (let i = 3; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)), q = ds[i]; ds[i] = ds[j]; ds[j] = q; }   // (a seeded shuffle: a sort with a random comparator calls it a varying number of times in the browser's tiers)
      if (kd === 'whip') { for (let r = 0; r <= 3; r++) for (const [dx, dy] of ds) { const ax = tx - dx * r, ay = ty - dy * r; if (!isF(ax, ay) || walk(ax - dx, ay - dy)) continue;   // (its root at the rim: no floor behind it)
          const L = 3.2 + rnd() * 1.0; let okL = true; for (let s = 1; s <= Math.ceil(L); s++) if (!isF(ax + dx * s, ay + dy * s) || !isF(ax + dx * s - dy, ay + dy * s - dx) && !isF(ax + dx * s + dy, ay + dy * s + dx)) { okL = false; break; } if (!okL) continue;
          const A = { x: ax + 0.5 - dx * 0.3, y: ay + 0.5 - dy * 0.3 }, B = { x: A.x + dx * L, y: A.y + dy * L }; if (!clearSeg(A.x, A.y, B.x, B.y)) continue; return { x: A.x, y: A.y, x1: B.x, y1: B.y, dx, dy, L }; } return null; }
      if (kd === 'trip') { for (const [dx, dy] of ds.slice(0, 2)) { const hx = Math.abs(dx) ? 1 : 0, hy = 1 - hx, L = KINDS.trip.len / 2; if (!isF(tx - hx, ty - hy) || !isF(tx + hx, ty + hy)) continue; const A = { x: x0 - hx * L, y: y0 - hy * L }, B = { x: x0 + hx * L, y: y0 + hy * L }; if (!clearSeg(A.x, A.y, B.x, B.y)) continue; return { x: A.x, y: A.y, x1: B.x, y1: B.y, o: hx ? 'h' : 'v', L: KINDS.trip.len }; } return null; }
      return { x: x0, y: y0 }; }
    for (let pass = 0; pass < 80 && want.length; pass++) { let any = false;
      for (const Lr of lists) { if (!want.length) break; const kd = want[0];
        for (let i = 0; i < Lr.length; i++) { const [x, y] = Lr[i]; const g2 = kd === 'sap' ? gap * 0.8 : gap; if (!farFromTraps(x, y, x, y, g2)) continue; const ln = laneAt(x, y, kd); if (!ln) continue; if (ln.x1 != null && !farFromTraps(ln.x, ln.y, ln.x1, ln.y1, Math.min(2.2, g2))) continue;
          Lr.splice(i, 1); out.push(Object.assign({ kind: kd, bridge: false }, ln)); want.shift(); any = true; break; } }
      if (!any) { if (want.length > 1) want.push(want.shift()); if (pass > 40) break; } }
    // what found no lane or no room is made up with the section's standing kinds where they still fit
    const fill = names.filter(k => k !== 'whip' && k !== 'trip'); for (let j = 0; want.length && fill.length && j < 400; j++) { const kd = fill[j % fill.length]; let put = false;
      for (const Lr of lists) { for (let i = 0; i < Lr.length; i++) { const [x, y] = Lr[i]; if (!farFromTraps(x, y, x, y, kd === 'sap' ? gap * 0.8 : gap)) continue; Lr.splice(i, 1); out.push({ kind: kd, bridge: false, x, y }); want.shift(); put = true; break; } if (put) break; }
      if (!put && j >= fill.length) break; }
    // the vine bridges: their straight spans (2 wide), a bramble from the void beside one, or a snare across it
    const seen = new Uint8Array(MW * MH), spans = [];
    for (let i = 0; i < MW * MH; i++) { if (seen[i] || G[i] !== T_BRIDGE) continue; const comp = [], q = [i]; seen[i] = 1; while (q.length) { const k2 = q.pop(); comp.push(k2); const x = k2 % MW, y = (k2 / MW) | 0; for (const [dx, dy] of DIRS) { const n2 = (y + dy) * MW + x + dx; if (x + dx < 0 || y + dy < 0 || x + dx >= MW || y + dy >= MH || seen[n2] || G[n2] !== T_BRIDGE) continue; seen[n2] = 1; q.push(n2); } }
      // a straight stretch: a pair of tiles across (x, y) and (x, y + 1) (or x + 1) with the void on both outer sides and bridge along
      const cand = []; for (const k2 of comp) { const x = k2 % MW, y = (k2 / MW) | 0;
        if (G[(y + 1) * MW + x] === T_BRIDGE && G[(y - 1) * MW + x] === T_GAP && G[(y + 2) * MW + x] === T_GAP && G[y * MW + x - 1] === T_BRIDGE && G[y * MW + x + 1] === T_BRIDGE) cand.push({ ax: 'h', x: x + 0.5, y: y + 1, k: k2 });
        if (G[y * MW + x + 1] === T_BRIDGE && G[y * MW + x - 1] === T_GAP && G[y * MW + x + 2] === T_GAP && G[(y - 1) * MW + x] === T_BRIDGE && G[(y + 1) * MW + x] === T_BRIDGE) cand.push({ ax: 'v', x: x + 1, y: y + 0.5, k: k2 }); }
      if (cand.length) spans.push(cand); }
    for (let i = spans.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const q = spans[i]; spans[i] = spans[j]; spans[j] = q; }
    const bk = o.bridgeKinds || BRIDGE[sec] || BRIDGE[1]; let nb = 0;
    // (each bridge one in its middle, then a long one more along it, at least 3.2 tiles apart)
    const picks = [], more = []; for (const cand of spans) { cand.sort((a, b) => a.k - b.k); picks.push(cand[Math.floor(cand.length / 2)]); const m = Math.round(cand.length / 5); for (let j = 0; j < m; j++) more.push(cand[Math.min(cand.length - 1, Math.round((j + 0.5) * cand.length / m))]); }
    picks.push(...more);
    for (const c0 of picks) { if (nb >= nBr) break; const kd = bk[nb % bk.length]; if (!clearPt(c0.x, c0.y) || !farFromTraps(c0.x, c0.y, c0.x, c0.y, sec === 3 ? 2.8 : 3.2)) continue;
      const side = rnd() < 0.5 ? -1 : 1; let t;
      if (kd === 'whip') { if (c0.ax === 'h') { const ay = side < 0 ? c0.y - 1 - 0.35 : c0.y + 1 + 0.35; t = { kind: 'whip', bridge: true, x: c0.x, y: ay, dx: 0, dy: -side, L: 2.7 }; } else { const ax = side < 0 ? c0.x - 1 - 0.35 : c0.x + 1 + 0.35; t = { kind: 'whip', bridge: true, x: ax, y: c0.y, dx: -side, dy: 0, L: 2.7 }; } t.x1 = t.x + t.dx * t.L; t.y1 = t.y + t.dy * t.L; }
      else if (kd === 'sap' || kd === 'star') t = { kind: kd, bridge: true, x: c0.x, y: c0.y, sc: 0.84 };
      else { const L = KINDS.trip.len / 2; t = c0.ax === 'h' ? { kind: 'trip', bridge: true, x: c0.x, y: c0.y - L, x1: c0.x, y1: c0.y + L, o: 'v', L: KINDS.trip.len } : { kind: 'trip', bridge: true, x: c0.x - L, y: c0.y, x1: c0.x + L, y1: c0.y, o: 'h', L: KINDS.trip.len }; }
      out.push(t); nb++; }
    const F = field(X, H, out, { sec, n: o.n || 1, seed, teach: o.teach, hash: hashLayout(M), fp: keep.reduce((h, k) => Math.imul(h ^ Math.round(k.x * 64 + k.y * 4096 + k.r * 7), 16777619) >>> 0, segs.length * 977 + keep.length) }); F.diag = { cand: lists.reduce((s, l) => s + l.length, 0) + out.filter(q => !q.bridge).length, short: want.slice(), spans: spans.length }; return F; }

  /* ======================= the field ======================= */
  const FIELDS = [], TAUGHT = {};
  const say = (X, k, ...a) => { try { if (X.sfx && X.sfx[k]) X.sfx[k](...a); } catch (e) {} };
  function field(X, H, list, info) { const F = { X, traps: [], stat: { hits: 0, dodged: 0, bursts: 0, demos: 0, monHits: 0, byKind: {} }, taught: {}, live: true, info, lastT: X.g.t, LG: [], LL: [], drowsy: 0, teach: info.teach !== false, seed: info.seed };
    list.forEach((p, i) => { const K = KINDS[p.kind], h = hh(i + 3, info.seed | 0), per = K.per ? K.per[0] + (K.per[1] - K.per[0]) * h : 0;
      const tp = Object.assign({ K, period: per, st: 'idle', t: K.per ? (i * 0.618 % 1) * per : 0, n: 0, on: false, demo: false, hit: false, hm: null, sd: i * 1.37 + (info.seed % 97), v: (i + (info.seed & 7)) % 2, stuck: 0 }, p); tp.R = (K.r || 0) * (p.sc || 1); F.traps.push(tp);
      if (p.kind === 'whip') { const L = p.L; tp.ex = p.x + p.dx * L; tp.ey = p.y + p.dy * L; } });
    F.dmg = kind => dmgOf(F, kind);
    if (H && H.obj) { for (const tp of F.traps) { if (tp.kind === 'sap' || tp.kind === 'star') continue; const y = tp.kind === 'trip' ? Math.max(tp.y, tp.y1) + 0.05 : tp.kind === 'whip' ? tp.y + 0.1 : tp.y + 0.05; tp.obj = H.obj({ x: tp.x1 != null && tp.kind === 'trip' ? (tp.x + tp.x1) / 2 : tp.x, y, kind: 'gtrap', r: 0, label: '', draw(c) { if (F.live) drawStand(F, tp, c); } }); } }
    F.tick = dt => tick(F, dt); F.stop = () => stop(F); F.drawGround = c => { if (F.live) drawGround(F, c); }; F.drawOver = c => { if (F.live) drawOver(F, c); };
    FIELDS.push(F); STATS.fields++; return F; }
  function stop(F) { F.live = false; try { const g = F.X.g; if (g && g.mvMods) { delete g.mvMods.gtsap; delete g.mvMods.gtpollen; } } catch (e) {} for (const tp of F.traps) tp.obj = null; F.LG.length = F.LL.length = 0; }
  function clear() { for (const F of FIELDS) stop(F); FIELDS.length = 0; }
  function release() { clear(); releasePics(); }
  function dmgOf(F, kind) { const K = KINDS[kind], X = F.X, hp = X.ST().hp, base = 12 * ((X.F && X.F.dmgMul) || 1) * (K.dmgK || 0); return K.dmgK ? clamp(base, hp * 0.04, hp * 0.14) : 0; }

  /* ---------------- the cycle ---------------- */
  const groundMon = m => !m.dead && !m.boss && !m.fiend && !m.lesser && !m.fobj && !(typeof MON !== 'undefined' && MON[m.type] && MON[m.type].fly);
  const anyMon = m => !m.dead && !m.boss && !m.fiend && !m.lesser && !m.fobj;
  function tick(F, dt) { const X = F.X, me = X.me, g = X.g;
    for (const tp of F.traps) { const cx = tp.x1 != null ? (tp.x + tp.x1) / 2 : tp.x, cy = tp.y1 != null ? (tp.y + tp.y1) / 2 : tp.y; tp.on = hyp(me.x - cx, me.y - cy) < 13; }
    if (F.teach) teach(F);
    for (const tp of F.traps) step(F, tp, dt);
    // the sap's hold and the pollen's drowsiness: the engine's walking-speed mods (no frost tint)
    let inSap = false; for (const tp of F.traps) if (tp.kind === 'sap') { const d = hyp(me.x - tp.x, me.y - tp.y), inn = hyp(me.x - tp.x, (me.y - tp.y) / FR) < tp.R && !me.dead && !me.dodge; tp.stuck = clamp(tp.stuck + (inn ? dt * 4 : -dt * 2), 0, 1); if (inn) { inSap = true; F.stat.sapT = (F.stat.sapT || 0) + dt; }
      if (tp.on) for (const m of X.mons) if (groundMon(m) && hyp(m.x - tp.x, (m.y - tp.y) / FR) < tp.R + m.r * 0.3) { m.sandT = Math.max(m.sandT || 0, 0.25); tp.stuck = Math.max(tp.stuck, 0.5); } }
    if (F.drowsy > 0) F.drowsy -= dt;
    g.mvMods = g.mvMods || {}; if (inSap) g.mvMods.gtsap = KINDS.sap.slowK; else delete g.mvMods.gtsap; if (F.drowsy > 0) g.mvMods.gtpollen = KINDS.gey.slowK; else delete g.mvMods.gtpollen; }
  // the first of each kind the pet comes near plays once, harmlessly, with a banner naming its tell
  function teach(F) { const X = F.X, me = X.me; if (X.g.t < 5) return;
    for (const kd in KINDS) { if (TAUGHT[kd] || F.taught[kd]) continue; const cand = F.traps.filter(tp => tp.kind === kd); if (!cand.length) continue;
      const dm = cand.find(tp => tp.demo); if (dm) { if ((dm.st === 'warn' || kd === 'sap') && !dm.said) { dm.said = true; X.banner(KINDS[kd].name, KINDS[kd].tell, KINDS[kd].hi, 3.4, true); X.text(dm.x, dm.y - 1.8, kd === 'sap' ? 'Sticky sap!' : 'Safe to watch…', KINDS[kd].hi, 14); }
        if (kd === 'sap' ? dm.said : (dm.n > dm.n0 && (dm.st === 'idle' || dm.st === 'rest'))) { dm.demo = false; F.taught[kd] = TAUGHT[kd] = true; } continue; }
      if (F.stat.demoAt && X.g.t - F.stat.demoAt < 4.5) continue;   // (one banner at a time)
      let b = null, bd = kd === 'sap' ? 4 : 7.5; for (const tp of cand) { const d = hyp(me.x - tp.x, me.y - tp.y); if (d < bd && d > (kd === 'sap' ? 0 : 2.6) && (tp.st === 'idle')) { bd = d; b = tp; } }
      if (b) { b.demo = true; b.n0 = b.n; F.stat.demos++; F.stat.demoAt = X.g.t; if (KINDS[kd].per) { b.t = Math.max(0, b.period - KINDS[kd].warn - (kd === 'whip' ? KINDS.whip.burst + KINDS.whip.rec : 0) - 0.6); } else if (kd !== 'sap') { b.st = 'warn'; b.t = -0.6; } } } }
  function idleSpan(tp) { const K = tp.K; return tp.period - K.warn - K.burst - (K.rec || 0); }
  function step(F, tp, dt) { const X = F.X, me = X.me, K = tp.K; if (tp.kind === 'sap') return; if (!tp.on && (tp.st === 'idle' || tp.st === 'rest' && tp.t >= K.rest)) return; tp.t += dt;
    if (tp.st === 'idle') { if (K.per) { if (tp.t >= idleSpan(tp)) arm(F, tp); }
      else if (tp.on && trig(F, tp)) arm(F, tp); return; }
    if (tp.st === 'warn') { if (tp.t >= K.warn) { tp.st = 'burst'; tp.t = 0; tp.hit = false; tp.hm = new Set(); tp.n++; F.stat.bursts++; burstFx(F, tp); } return; }
    if (tp.st === 'burst') { strike(F, tp); if (tp.t >= K.burst) { tp.t = 0; tp.st = tp.kind === 'whip' ? 'rec' : K.rest ? 'rest' : 'idle'; tp.hm = null; } return; }
    if (tp.st === 'rec') { if (tp.t >= K.rec) { tp.st = 'idle'; tp.t = 0; } return; }
    if (tp.st === 'rest') { if (tp.t >= K.rest) { tp.st = 'idle'; tp.t = 0; } } }
  function arm(F, tp) { const X = F.X, K = tp.K; tp.st = 'warn'; tp.t = 0; if (!tp.on) return;
    if (tp.kind === 'pod') say(X, 'hiss', K.warn, 0.05, 900); else if (tp.kind === 'whip') say(X, 'hiss', K.warn * 0.9, 0.05, 1800); else if (tp.kind === 'gey') say(X, 'note', 330, K.warn, 'sine', 0.06, 660); else if (tp.kind === 'star') say(X, 'note', 1400, K.warn, 'sine', 0.05, 520); else if (tp.kind === 'trip') say(X, 'hiss', K.warn, 0.06, 2600); }
  // what sets off a pod or a snare: the pet (dodging or not) or a walking monster near it
  function trig(F, tp) { const X = F.X, me = X.me, K = tp.K;
    if (tp.kind === 'pod') { if (!me.dead && hyp(me.x - tp.x, (me.y - tp.y) / FR) < K.trig) return true; for (const m of X.mons) if (groundMon(m) && hyp(m.x - tp.x, (m.y - tp.y) / FR) < K.trig * 0.8) return true; return false; }
    const d = segD(me.x, me.y, tp.x, tp.y, tp.x1, tp.y1); if (!me.dead && d < 0.4 + (me.r || 0.3) * 0.5) return true; for (const m of X.mons) if (groundMon(m) && segD(m.x, m.y, tp.x, tp.y, tp.x1, tp.y1) < 0.35) return true; return false; }
  function inArea(tp, x, y, r, u) { const K = tp.K;
    if (tp.kind === 'whip') return u >= K.hitA / K.burst && u <= K.hitB / K.burst && segD(x, y, tp.x, tp.y, tp.ex, tp.ey) < K.w + r * 0.6;
    if (tp.kind === 'trip') return tp.t <= K.hitW && segD(x, y, tp.x, tp.y, tp.x1, tp.y1) < K.w + r * 0.5;
    return tp.t <= K.hitW && hyp(x - tp.x, (y - tp.y) / FR) < tp.R + r * 0.6; }   // (an ellipse on the floor, as its picture and light lie)
  function strike(F, tp) { const X = F.X, me = X.me, K = tp.K, u = tp.t / K.burst;
    if (!tp.hit && !tp.demo && !me.dead && inArea(tp, me.x, me.y, me.r || 0.3, u)) { tp.hit = true; const by = F.stat.byKind[tp.kind] || (F.stat.byKind[tp.kind] = { hits: 0, dodged: 0, lost: 0 });
      if (me.dodge) { F.stat.dodged++; by.dodged++; }
      else { const hp0 = me.hp, ok = X.hurtPet(dmgOf(F, tp.kind), null); if (ok) { F.stat.hits++; by.hits++; by.lost += hp0 - me.hp;
          let a; if (tp.kind === 'whip' || tp.kind === 'trip') { const ax = tp.x1 != null ? tp.x1 - tp.x : tp.ex - tp.x, ay = tp.y1 != null ? tp.y1 - tp.y : tp.ey - tp.y, s = (me.x - tp.x) * -ay + (me.y - tp.y) * ax >= 0 ? 1 : -1, l = hyp(ax, ay) || 1; a = Math.atan2(ax / l * s, -ay / l * s); } else a = Math.atan2(me.y - tp.y, me.x - tp.x);
          if (!tp.bridge && K.shove) X.push(isFinite(a) ? a : Math.random() * TAU, K.shove); if (tp.kind === 'gey') F.drowsy = K.drowsy; }
        else { F.stat.dodged++; by.dodged++; } } }
    // monsters caught (bosses, mini bosses and the fiend never)
    if (tp.demo || !tp.on || !tp.hm) return; const flyToo = tp.kind === 'gey' || tp.kind === 'star';
    for (const m of X.mons) { if (tp.hm.has(m) || !(flyToo ? anyMon(m) : groundMon(m))) continue; if (!inArea(tp, m.x, m.y, m.r || 0.4, u)) continue; tp.hm.add(m); F.stat.monHits++; try { X.hitMon(m, dmgOf(F, tp.kind) * 2, { src: 'hazard', el: tp.kind === 'star' ? 'light' : 'leaf' }); } catch (e) {} } }
  function burstFx(F, tp) { const X = F.X, K = tp.K, low = lowFx(); if (!tp.on) return; const n = low ? 6 : 12;
    if (tp.kind === 'pod') { for (let i = 0; i < n; i++) { const a = Math.random() * TAU; X.part({ kind: 'spark', x: tp.x + Math.cos(a) * 0.3, y: tp.y - 0.6, vx: Math.cos(a) * (2 + Math.random() * 3), vy: Math.sin(a) * 2 - 2.5, g: 3, life: 0.7, max: 0.7, size: 2.5 + Math.random() * 2.5, color: Math.random() < 0.5 ? K.col : K.hi }); } say(X, 'thud'); say(X, 'bubble'); X.shake && X.shake(1.8, 0.15); }
    else if (tp.kind === 'whip') { say(X, 'whoosh'); say(X, 'crack'); X.shake && X.shake(2.2, 0.15); }
    else if (tp.kind === 'gey') { for (let i = 0; i < n; i++) X.part({ kind: 'spark', x: tp.x + (Math.random() - 0.5) * 0.8, y: tp.y - 0.3, vx: (Math.random() - 0.5) * 2, vy: -5 - Math.random() * 4, g: 4, life: 0.9, max: 0.9, size: 2 + Math.random() * 2.5, color: Math.random() < 0.6 ? K.col : K.hi }); say(X, 'whoosh'); X.shake && X.shake(1.6, 0.15); }
    else if (tp.kind === 'star') { X.sparks && X.sparks(tp.x, tp.y - 0.2, K.hi, low ? 8 : 16, 6); say(X, 'crash'); say(X, 'sparkle'); X.shake && X.shake(3.5, 0.22); }
    else if (tp.kind === 'trip') { const cx = (tp.x + tp.x1) / 2, cy = (tp.y + tp.y1) / 2; X.sparks && X.sparks(cx, cy, K.col, low ? 6 : 10, 4); say(X, 'crack'); X.shake && X.shake(2, 0.12); } }

  /* ---------------- drawing ---------------- */
  const lvl = tp => tp.st === 'warn' ? ease(tp.t / tp.K.warn) : tp.st === 'burst' ? 1 : 0;   // (the build-up: calm 0 .. bright 1)
  const onScr = (X, Xs, Ys, T, m) => Xs > -T * m && Xs < X.W() + T * m && Ys > -T * m && Ys < X.H() + T * (m + 2);
  function gpu(c, L) { if (!L.length) return; const F = fgx(); if (F) { try { const Q = F.begin(c, null); for (const f of L) f(Q); F.flush(c); STATS.gpu++; } catch (e) {} } L.length = 0; }
  const SINK = [];
  function drawGround(F, c) { const X = F.X, T = X.Tz(), t = X.g.t, L = F.LG, lo = lowFx();
    for (const tp of F.traps) { const cx = tp.x1 != null ? (tp.x + tp.x1) / 2 : tp.x, cy = tp.y1 != null ? (tp.y + tp.y1) / 2 : tp.y, Xs = X.sx(cx), Ys = X.sy(cy); if (!onScr(X, Xs, Ys, T, 4)) continue;
      const L = lo && tp.st === 'idle' && !(tp.stuck > 0.02) ? (SINK.length = 0, SINK) : F.LG; /* (st.lowFx: a calm trap's breathing light left out; its picture and its light layer still show) */ const K = tp.K, k = lvl(tp), calm = 0.5 + 0.5 * Math.sin(t * 1.4 + tp.sd), u = tp.st === 'burst' ? tp.t / K.burst : 0;
      if (tp.kind === 'sap') { const sc = tp.sc || 1; draw(c, 'sap', 0, Xs, Ys, T, { sx: sc, sy: sc }); const gl = 0.1 + 0.08 * calm + 0.75 * tp.stuck; draw(c, 'sapg', 0, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: gl * 0.55 });
        L.push(Q => { Q.caustic(Xs, Ys, T * 0.95 * (tp.sc || 1), '#FFC870', 0.1 + 0.1 * calm + 0.25 * tp.stuck, tp.sd, FR); if (tp.stuck > 0.02) Q.glow(Xs, Ys, T * 1.3, K.col, 0.35 * tp.stuck, FR); if (!lo) Q.bubbles(Xs, Ys - T * 0.05, T * 0.8, T * 0.25, '#FFD08A', 0.25 + 0.3 * tp.stuck, tp.sd, 0.2); }); }
      else if (tp.kind === 'star') { const sc = tp.sc || 1; draw(c, 'scar', tp.v % 2, Xs, Ys, T, { sx: sc, sy: sc }); const gk = tp.st === 'warn' ? k : tp.st === 'burst' ? 1 - u : 0; draw(c, 'scarg', tp.v % 2, Xs, Ys, T, { sx: sc, sy: sc, add: true, alpha: 0.12 + 0.06 * calm + 0.82 * gk });
        L.push(Q => { if (gk > 0.01) { Q.glow(Xs, Ys, T * tp.R * (0.55 + 0.75 * k), '#E4EEFF', (0.08 + 0.6 * k * k) * (tp.st === 'burst' ? 1 - u : 1), FR); Q.glow(Xs, Ys, T * tp.R * 0.45, '#FFFFFF', 0.3 * k * k * k, FR); }
          if (tp.st === 'burst') { Q.ewave(Xs, Ys, T * tp.R * (0.5 + 1.4 * u), K.col, 0.85, 0.75 * (1 - u), tp.sd, FR, 0.2); Q.glow(Xs, Ys, T * 2, '#FFFFFF', 0.5 * (1 - u) * (1 - u), 0.55); } }); }
      else if (tp.kind === 'trip') { const o = tp.o || 'h'; draw(c, 'trip', o, Xs, Ys, T); const gk = tp.st === 'warn' ? 0.35 + 0.65 * k : tp.st === 'burst' ? 1 - u * 0.6 : tp.st === 'rest' ? 0.05 + 0.25 * clamp(tp.t / K.rest, 0, 1) : 0.28 + 0.14 * calm; draw(c, 'tripg', o, Xs, Ys, T, { add: true, alpha: gk });
        const ax = X.sx(tp.x), ay = X.sy(tp.y), bx = X.sx(tp.x1), by2 = X.sy(tp.y1);
        L.push(Q => { if (tp.st === 'warn') { const f = ease(tp.t / K.warn); Q.rbeam(ax, ay, bx, by2, T * 0.32, K.col, 0.2 + 0.55 * f, 1, 1); Q.star(lerp(ax, Xs, f), lerp(ay, Ys, f), T * 0.32, 0.9, K.hi); Q.star(lerp(bx, Xs, f), lerp(by2, Ys, f), T * 0.32, 0.9, K.hi); Q.glow(Xs, Ys, T * (0.8 + 0.6 * f), K.col, 0.25 * f, 0.5); }
          else if (tp.st === 'burst') { Q.rbeam(ax, ay, bx, by2, T * 0.55, K.col, 0.55 * (1 - u), 1, 1); Q.glow(Xs, Ys, T * 1.6, K.col, 0.4 * (1 - u), 0.45); }
          else Q.rbeam(ax, ay, bx, by2, T * 0.2, K.col, 0.06 + 0.05 * calm, 1, 1); }); }
      else if (tp.kind === 'pod') { L.push(Q => Q.glow(Xs, Ys - T * 0.05, T * (0.75 + 0.7 * k), K.col, (tp.st === 'rest' ? 0.04 : 0.1 + 0.05 * calm) + 0.45 * k, 0.45)); }
      else if (tp.kind === 'gey') { L.push(Q => { Q.glow(Xs, Ys - T * 0.1, T * (0.9 + 0.8 * k), K.col, 0.1 + 0.04 * calm + 0.5 * k, 0.48); if (tp.st === 'burst') Q.glow(Xs, Ys, T * K.r * 1.6, K.hi, 0.45 * (1 - u), 0.5); }); }
      else if (tp.kind === 'whip') { const ax = X.sx(tp.x), ay = X.sy(tp.y), bx = X.sx(tp.ex), by2 = X.sy(tp.ey); L.push(Q => { if (tp.st === 'warn') Q.rbeam(ax, ay, bx, by2, T * 0.55, K.col, 0.05 + 0.22 * k, 1, 0.35); else if (tp.st === 'burst') Q.rbeam(ax, ay, bx, by2, T * 0.75, K.hi, 0.45 * (1 - u), 1, 0.6); }); } }
    gpu(c, L); }
  // the bramble's pose: its points along the lane (world) and their heights (tiles) for its state
  function whipPts(tp, t, out) { const K = tp.K, N = 10, px = -tp.dy, py = tp.dx; let reach = 0.92, lift = 0.05, amp = 0.12, trem = 0;
    if (tp.st === 'warn') { const k = ease(tp.t / K.warn); reach = 0.92 - 0.42 * k; lift = 0.05 + 1.25 * k; amp = 0.12 + 0.12 * k; trem = k * k; }
    else if (tp.st === 'burst') { const u = clamp(tp.t / 0.11, 0, 1), e = 1 - (1 - u) * (1 - u); reach = 0.5 + 0.52 * e; lift = 1.3 * (1 - e); amp = 0.05 + 0.1 * (1 - e); }
    else if (tp.st === 'rec') { const u = ease(tp.t / K.rec); reach = 1.02 - 0.1 * u; lift = 0.05 * u; amp = 0.06 + 0.06 * u; }
    for (let i = 0; i <= N; i++) { const s = i / N, w = Math.sin(s * 5.2 + t * 1.3 + tp.sd) * amp * s + (trem ? Math.sin(t * 38 + i) * 0.035 * trem * s : 0), d = tp.L * reach * s;
      out[i] = [tp.x + tp.dx * d + px * w, tp.y + tp.dy * d + py * w, lift * Math.sin(Math.PI * Math.min(1, s * 1.05)) * (0.6 + 0.6 * s) + (tp.st === 'warn' ? 0.25 * ease(tp.t / K.warn) * s * s : 0)]; }
    return N; }
  const WP = [];
  function drawStand(F, tp, c) { const X = F.X, T = X.Tz(), t = X.g.t, K = tp.K, k = lvl(tp), Xs = X.sx(tp.x), Ys = X.sy(tp.y); const calm = 0.5 + 0.5 * Math.sin(t * 1.4 + tp.sd);
    if (tp.kind === 'pod') { if (!onScr(X, Xs, Ys, T, 3)) return; const v = tp.v;
      if (tp.st === 'idle' || tp.st === 'warn') { const br = 1 + 0.02 * Math.sin(t * 2 + tp.sd), sw = tp.st === 'warn' ? 0.13 * k + 0.045 * k * Math.sin(t * (10 + 26 * k)) : 0, sx = br + sw, sy = br + sw * 0.8;
        draw(c, 'pod', v, Xs, Ys, T, { sx, sy }); draw(c, 'podg', v, Xs, Ys, T, { sx, sy, add: true, alpha: 0.14 + 0.08 * calm + 0.8 * k * (0.8 + 0.2 * Math.sin(t * (6 + 20 * k))) }); }
      else { const u = tp.st === 'rest' ? clamp(tp.t / K.rest, 0, 1) : 0, regrow = clamp((u - 0.55) / 0.45, 0, 1);
        draw(c, 'podh', v, Xs, Ys, T, { alpha: 1 - regrow }); if (regrow > 0) { const s = 0.4 + 0.6 * ease(regrow); draw(c, 'pod', v, Xs, Ys, T, { sx: s, sy: s, alpha: ease(regrow * 1.5) }); } } return; }
    if (tp.kind === 'gey') { if (!onScr(X, Xs, Ys, T, 3)) return; draw(c, 'gey', tp.v % 2, Xs, Ys, T); const gk = tp.st === 'burst' ? 1 - tp.t / K.burst * 0.7 : k; draw(c, 'geyg', tp.v % 2, Xs, Ys, T, { add: true, alpha: 0.12 + 0.06 * calm + 0.85 * gk * (0.85 + 0.15 * Math.sin(t * (5 + 16 * k))) }); return; }
    if (tp.kind === 'trip') { if (tp.st !== 'burst' && !(tp.st === 'rest' && tp.t < 0.35)) return; const u = tp.st === 'burst' ? tp.t / K.burst : 1, sink = tp.st === 'rest' ? 1 - tp.t / 0.35 : 1, N = 5;
      const pts = []; for (let i = 0; i < N; i++) { const s = (i + 0.5) / N, wx = lerp(tp.x, tp.x1, s), wy = lerp(tp.y, tp.y1, s); pts.push([wx, wy, i]); } pts.sort((a, b) => a[1] - b[1]);
      for (const [wx, wy, i] of pts) { const Xi = X.sx(wx), Yi = X.sy(wy); if (!onScr(X, Xi, Yi, T, 2)) continue; const e = clamp(u / 0.18 - i * 0.12, 0, 1), sy = (1 - Math.pow(1 - e, 3)) * sink * (0.85 + 0.25 * hh(i, tp.sd | 0)); if (sy < 0.03) continue; draw(c, 'thorn', (i + tp.v) % 3, Xi + (hh(i + 9, tp.sd | 0) - 0.5) * T * 0.25, Yi, T, { sx: 0.9 + 0.2 * hh(i, 5), sy }); } return; }
    if (tp.kind === 'whip') { const n = whipPts(tp, t, WP), pS = WP.map(p => [X.sx(p[0]), X.sy(p[1]) - p[2] * T, p[2]]); let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9; for (const p of pS) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mny = Math.min(mny, p[1]); mxy = Math.max(mxy, p[1]); } if (mxx < -T * 2 || mnx > X.W() + T * 2 || mxy < -T * 2 || mny > X.H() + T * 2) return;
      draw(c, 'wknot', 0, Xs, Ys + T * 0.05, T, { sx: tp.bridge ? 0.85 : 1, sy: tp.bridge ? 0.85 : 1 });
      const lit = tp.st === 'warn' ? ease(tp.t / K.warn) * 1.25 : tp.st === 'burst' ? 1.3 : tp.st === 'rec' ? 1.3 * (1 - tp.t / K.rec) : 0;
      for (let i = n; i >= 1; i--) { const a = pS[i - 1], b = pS[i], s = i / n, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, len = hyp(b[0] - a[0], b[1] - a[1]), rot = Math.atan2(b[1] - a[1], b[0] - a[0]), th = 1.05 - 0.5 * s, sx = len / (T * 0.86) * 1.12;
        draw(c, 'wseg', 0, mx, my, T, { rot, sx, sy: th }); const g2 = clamp(lit - s * 0.9, 0, 1) * (tp.st === 'burst' || tp.st === 'rec' ? 1 : 0.85) + 0.1 * calm * (1 - s * 0.5); if (g2 > 0.02) draw(c, 'wsegg', 0, mx, my, T, { rot, sx, sy: th, add: true, alpha: g2 }); }
      tp.pS = pS; return; } }
  function drawOver(F, c) { const X = F.X, T = X.Tz(), t = X.g.t, L = F.LL, lo = lowFx(), useG = !!fgx();
    for (const tp of F.traps) { const K = tp.K, k = lvl(tp), Xs = X.sx(tp.x), Ys = X.sy(tp.y), u = tp.st === 'burst' ? tp.t / K.burst : 0; if (tp.kind === 'sap') continue;
      if (tp.kind === 'star') { if (tp.st !== 'warn' && !(tp.st === 'burst' && u < 0.5)) continue; if (!onScr(X, Xs, Ys, T, 4)) continue;
        const f = tp.st === 'warn' ? tp.t / K.warn : 1, z = (1 - Math.pow(f, 1.7)) * 9, Yz = Ys - z * T - T * 0.25;   // (the seed, high above, falling faster and faster)
        if (tp.st === 'warn') { if (!useG) draw(c, 'seed', 0, Xs, Yz, T, { sx: 0.8 + 0.5 * f, sy: 0.8 + 0.5 * f, alpha: 0.5 + 0.5 * f });
          L.push(Q => { const tl = T * (0.6 + 2.6 * f); Q.rbeam(Xs, Yz - tl, Xs, Yz, T * (0.12 + 0.1 * f), K.col, 0.55, 0, 1); Q.glow(Xs, Yz, T * (0.5 + 0.6 * f), K.col, 0.35 + 0.4 * f); Q.star(Xs, Yz, T * (0.35 + 0.35 * f), 0.75 + 0.25 * Math.sin(t * 30), K.hi); Q.eorb(Xs, Yz, T * (0.12 + 0.1 * f), '#BFD8FF', 0.9, 0.8, tp.sd, 1); }); }
        else L.push(Q => { const n = lo ? 5 : 9; for (let i = 0; i < n; i++) { const a = i / n * TAU + tp.sd, d = T * (0.3 + 2.0 * u); Q.star(Xs + Math.cos(a) * d, Ys - T * 0.2 + Math.sin(a) * d * 0.45 - T * 0.8 * u, T * 0.22 * (1 - u * 1.5), 1 - u * 2, K.hi); } Q.glow(Xs, Ys - T * 0.6, T * 1.4, '#FFFFFF', 0.55 * (1 - u * 2), 1.2); });
        continue; }
      if (tp.kind === 'pod') { if (!onScr(X, Xs, Ys, T, 3)) continue; if (tp.st === 'warn') L.push(Q => { Q.glow(Xs, Ys - T * 0.92, T * (0.55 + 0.25 * k), K.hi, (0.12 + 0.4 * k) * (0.75 + 0.25 * Math.sin(t * (8 + 22 * k)))); if (!lo && k > 0.3) for (let i = 0; i < 3; i++) { const ph = (t * 1.5 + i / 3) % 1; Q.star(Xs + Math.sin(i * 2.3 + t) * T * 0.35, Ys - T * (0.9 + ph * 0.8), T * 0.08, k * Math.sin(ph * Math.PI), K.hi); } });
        else if (tp.st === 'burst' || tp.st === 'rest' && tp.t < 1.2) { const e = tp.st === 'burst' ? u * 0.33 : 0.33 + tp.t / 1.2 * 0.67; L.push(Q => { const n = lo ? 3 : 6; for (let i = 0; i < n; i++) { const a = i / n * TAU + tp.sd, d = T * (0.3 + 1.3 * Math.sqrt(e)); Q.smoke(Xs + Math.cos(a) * d, Ys - T * 0.55 + Math.sin(a) * d * 0.45 - T * 0.4 * e, T * (0.45 + 0.7 * e), 0.42 * (1 - e), tp.sd + i, '#8E5CA8', 0.55); }
          if (e < 0.4) Q.glow(Xs, Ys - T * 0.7, T * 1.8, K.hi, 0.6 * (1 - e / 0.4), 0.8); if (!lo) for (let i = 0; i < 8; i++) { const a = i * 0.785 + tp.sd, d = T * (0.4 + 1.6 * e); Q.star(Xs + Math.cos(a) * d, Ys - T * 0.6 + Math.sin(a) * d * 0.5 - T * 0.6 * e, T * 0.1, 0.9 * (1 - e), i % 2 ? K.col : K.hi); } }); }
        continue; }
      if (tp.kind === 'gey') { if (!onScr(X, Xs, Ys, T, 3)) continue;
        if (tp.st === 'warn' || tp.st === 'idle' && !lo) { const sp = 0.4 + 2.2 * k, n = lo ? 3 : tp.st === 'idle' ? 2 : 4 + Math.round(6 * k); L.push(Q => { for (let i = 0; i < n; i++) { const ph = (t * sp + i / n + tp.sd) % 1, bx = Xs + (hh(i, 7) - 0.5) * T * 1.2 + Math.sin(t * 2 + i) * T * 0.1; Q.star(bx, Ys - T * (0.6 + ph * (1.2 + 1.4 * k)), T * (0.06 + 0.05 * k), (0.25 + 0.7 * k) * Math.sin(ph * Math.PI), i % 3 ? K.col : K.hi); } if (k > 0) Q.glow(Xs, Ys - T * 0.7, T * (0.6 + 0.5 * k), K.col, 0.35 * k); }); }
        else if (tp.st === 'burst') L.push(Q => { const rise = Math.min(1, u / 0.18), H = T * 3.4 * rise, fa = u > 0.6 ? 1 - (u - 0.6) / 0.4 : 1, n = lo ? 3 : 6;
          Q.glow(Xs, Ys - H * 0.5, T * 1.3, K.col, 0.45 * fa, 1.7); for (let i = 0; i < n; i++) { const s = (i + 0.5) / n, w = T * (0.45 + 0.5 * s + 0.3 * u); Q.smoke(Xs + Math.sin(i * 1.7 + t * 3) * T * 0.15, Ys - T * 0.4 - H * s, w, 0.38 * fa * (1 - 0.3 * s), tp.sd + i, '#E8B848', 1.0); }
          Q.spray(Xs, Ys - H, T * (0.8 + 0.8 * u), K.hi, 0.55 * fa, tp.sd, 1, 1); if (!lo) for (let i = 0; i < 10; i++) { const a = i * 0.63 + tp.sd, d = T * (0.2 + 1.5 * u); Q.star(Xs + Math.cos(a) * d, Ys - H * (0.5 + 0.5 * hh(i, 2)) + Math.sin(a) * d * 0.3, T * 0.09, 0.9 * fa, i % 2 ? K.col : K.hi); } });
        continue; }
      if (tp.kind === 'whip') { const pS = tp.pS; if (!pS) continue; const tip = pS[pS.length - 1]; if (!onScr(X, tip[0], tip[1], T, 3) && !onScr(X, Xs, Ys, T, 3)) continue;
        if (tp.st === 'warn') L.push(Q => { const n = pS.length; for (let i = 2; i < n; i += 2) { const s = i / (n - 1), g2 = clamp(k * 1.25 - s * 0.9, 0, 1); if (g2 > 0.05) Q.glow(pS[i][0], pS[i][1], T * 0.32, K.col, 0.35 * g2); } Q.star(tip[0], tip[1], T * (0.15 + 0.3 * k), 0.4 + 0.6 * k, K.hi); });
        else if (tp.st === 'burst') L.push(Q => { const n = pS.length, fa = 1 - u; for (let i = 1; i < n; i++) Q.rbeam(pS[i - 1][0], pS[i - 1][1], pS[i][0], pS[i][1], T * 0.22, K.hi, 0.55 * fa, 1, 1); Q.star(tip[0], tip[1], T * 0.8 * fa, fa, '#FFFFFF'); Q.glow(tip[0], tip[1], T * 1.1, K.col, 0.45 * fa, 0.6); });
        continue; }
      if (tp.kind === 'trip' && tp.st === 'burst') { const cx = X.sx((tp.x + tp.x1) / 2), cy = X.sy((tp.y + tp.y1) / 2); if (!onScr(X, cx, cy, T, 3)) continue; L.push(Q => { const n = lo ? 4 : 8; for (let i = 0; i < n; i++) { const s = (i + 0.5) / n; Q.star(lerp(X.sx(tp.x), X.sx(tp.x1), s), lerp(X.sy(tp.y), X.sy(tp.y1), s) - T * (0.3 + 0.9 * u), T * 0.12, 1 - u, K.hi); } }); } }
    gpu(c, L); }

  /* ======================= the garden's fight stages ======================= */
  function stageTraps(X, self, H, sec, n) { if (off() || !BP()) return null; if (!BASE) { try { BASE = Math.round(X.Tz() * Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1)); } catch (e) { BASE = 48; } }
    clear(); const F = place(X, H, { sec, n }); self.gtraps = F;
    return { update(dt) { if (F.live && !F.freeze) F.tick(Math.min(dt, 0.1)); }, drawGround(c) { F.drawGround(c); }, drawOver(c) { F.drawOver(c); } }; }
  function merge(a, b) { if (!b) return a; const o = Object.assign({}, a);
    o.update = dt => { if (a.update) a.update(dt); b.update(dt); }; o.drawGround = c => { if (a.drawGround) a.drawGround(c); b.drawGround(c); }; o.drawOver = c => { if (a.drawOver) a.drawOver(c); b.drawOver(c); }; return o; }
  function hook() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.garden; if (!Rf || Rf.__gt) return; Rf.__gt = 1;
      Rf.stages.forEach((S, i) => { if (S.kind !== 'fight') return; const P = typeof riftStagePos === 'function' ? riftStagePos(Rf, i) : { sec: 1, n: 1 }, sec = P.sec, n = P.n;
        const ex = S.extra; S.extra = function (X, self, H) { const a = ex ? ex.call(this, X, self, H) || {} : {}; let b = null; try { b = stageTraps(X, self, H, sec, n); } catch (e) { b = null; if (typeof console !== 'undefined') console.warn('GARDEN_TRAPS', e); } return merge(a, b); };
        const pre = S.preload; S.preload = function (P2) { let a = []; try { a = pre ? pre.apply(this, arguments) || [] : []; } catch (e) {} return (Array.isArray(a) ? a : []).concat(warm(P2, sec)); }; S.gtSec = sec; S.gtN = n; }); } catch (e) {} }
  hook();
  // the dead stage let go: when any stage is made or closed (its field, the slows it set, every picture)
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(release); } catch (e) {}
  try { const GD = typeof GAMES !== 'undefined' && GAMES.dungeon; if (GD && GD.create && !GD.__gtRel) { const c0 = GD.create; GD.__gtRel = 1; GD.create = function () { release(); const gm = c0.apply(this, arguments); try { if (gm && typeof gm.destroy === 'function') { const d0 = gm.destroy; gm.destroy = function () { release(); return d0.apply(this, arguments); }; } } catch (e) {} return gm; }; } } catch (e) {}
  const API = { place, clear, release, KINDS, SPEC, MIX, kindsOf, TAUGHT, fields: () => FIELDS, dmg: dmgOf, draw, sprite: (n, v, P) => sprite(n, v, P, true), warm, hook, DEFS, PICS, LIGHT, hashLayout, get base() { return BASE; }, set base(v) { BASE = v | 0; }, get stats() { return Object.assign({ cached: CACHE.size, live: FIELDS.length }, STATS); } };
  try { self.GARDEN_TRAPS = API; } catch (e) {}
  return API;
})();
