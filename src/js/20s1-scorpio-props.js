/* ---------- v445 AG: the Gate of Scorpio's pictures (the Amber Vigil and the Amber Sanctum) ----------
   Every solid piece of the gate is painted once, at the floor's sharpness, by the Drowned Belfry's software shading pass
   (BELPROPS.kit, 20n9: each pixel of a solid gets a normal and a material and is lit), in a light of its own: the vigil's
   ("vigil": violet starlight from the upper left, a cold violet sky in the reflections, a violet rim, the amber glass's warm
   bounce from below) and the sanctum's ("sanct": a blood moon's crimson-rose key, violet sky, a crimson rim, amber bounce).
   Materials: sandstone (strata, pits, sand in its hollows), desert bronze (a brown-green patina gathered in the hollows,
   worn bright edges), antique gold, amber glass (glossy, lit from within, flecks), obsidian (glassy black, violet sheen),
   ruby and violet crystal (emissions). Each is finished with a little 2D detail (glints, an ink edge). Nothing here is
   painted per frame: the frame lays the pictures down; what glows or moves is the gate's own GPU light over them (20s).
   Pictures (name, v): watch (a watch-stone: a sandstone menhir on a stepped plinth, a bronze collar and claws holding its
   amber eye), chime (a decoy chime: bronze tubes hung from a frame on a pedestal, a violet striker), altar (a shard altar:
   a plinth, bronze claws for a cradle), shard (a star shard: a violet-gold crystal cluster), star (the five-armed violet
   star in the bronze scorpion's sting), post (a thread post: an obsidian spike ringed in gold, a ruby bead on top), pillar
   (v 0 a whole sandstone column, 1 broken, 2 a fallen-drum ruin: cover), statue (v 0 a hooded sentinel, 1 a crouching
   sandstone scorpion: cover), rock (v 0..1: a sandstone boulder with amber crystals: cover), door (the great door's frame:
   sandstone jambs with amber-glass strips, a lintel with three shard sockets, the bronze scorpion's body and legs lying on
   it), leaf (v 'l' | 'r': its amber-glass leaves in bronze frames, half the Scorpio sign etched in each), arm (a pincer arm,
   from its shoulder down to the closed claw: drawn turned, mirrored for the right), tseg (one segment of the scorpion's
   tail: drawn along the tail's curve, tapering), sting (the sting's bulb and barb, the star's cradle), crown (the sanctum's
   monument: the Sevenfold Crown, seven curved obsidian blades tipped with ruby on a stepped dais round a ruby heart), col
   (v 0..2: the sanctum's obsidian-and-amber columns: whole with an amber bowl, broken, broken and chained), frag (v 0..2:
   amber shards held in the air round the sanctum), moon (the blood moon, per pixel, with its corona).
   API (global SCORPIO_PROPS): draw(c, name, v, Xs, Ys, T, o) the picture with its feet at Xs, Ys (o: { alpha, sx, sy, rot })
   -> false when it is not painted yet; sprite(name, v, P); warm(P) -> jobs for the loading screen; release() frees every
   picture (the gate calls it when its stage closes); setBase(P); GEO (the door's numbers, shared with the gate); TAIL (the
   tail's segment lengths); LIGHT.
   window.__SGP = 0 turns the pictures off (the gate then draws its plain 2D stand-ins). */
var SCORPIO_PROPS = (() => {
  const TAU = Math.PI * 2;
  const BP = () => (typeof window !== 'undefined' && window.BELPROPS && window.BELPROPS.kit && window.__BELP !== 0 && window.__SGP !== 0) ? window.BELPROPS : null;
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, released: 0 };
  const LIGHT = {
    vigil: { a0: [0.1, 0.07, 0.13], a1: [0.06, 0.05, 0.12], e0: [0.07, 0.05, 0.1], e1: [0.3, 0.25, 0.46], k: [1.02, 0.92, 1.12], rim: [0.55, 0.36, 0.85], bo: [0.3, 0.16, 0.05] },
    sanct: { a0: [0.12, 0.05, 0.1], a1: [0.08, 0.04, 0.12], e0: [0.12, 0.04, 0.07], e1: [0.42, 0.18, 0.3], k: [1.28, 0.8, 0.78], rim: [0.92, 0.3, 0.42], bo: [0.32, 0.15, 0.05] } };
  function lit(K, name, fn) { const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, LIGHT[name] || {}); try { fn(); } finally { for (const k in save) L[k] = save[k]; } }
  /* the door's measures (tiles): the doorway's half width and the leaves' height, the plinth, the jambs, the lintel, the shard
     sockets, the scorpion's shoulders (its arms' pivots), its claws' reach, where its tail rises, its eyes */
  const GEO = { WO: 1.3, PZ: 0.22, JW: 0.62, JD: 0.45, L0: 3.4, L1: 4.1, stud: [-0.85, 0, 0.85], studZ: 3.76, sh: [0.66, 4.22], claw: 2.3, tail: [0, 5.3], eyes: [[-0.2, 4.62], [0.2, 4.62]] };
  const TAIL = [0.62, 0.58, 0.55, 0.52, 0.48, 0.45, 0.42];   // (each tail segment's length, base to tip: tseg is painted 0.62 long and drawn scaled)

  /* ======================= materials ======================= */
  function sandM(K, u, v, ao, sd) { const { M, vn, fbm } = K, w = fbm(u * 2.2 + sd, v * 2.2 + sd * 0.7), st = Math.sin(v * 9 + fbm(u * 1.3 + sd, v * 0.6) * 4) * 0.5 + 0.5, pit = vn(u * 26 + sd, v * 26), t = 0.8 + 0.28 * w + 0.07 * st;
    M.r = 0.54 * t; M.g = 0.36 * t; M.b = 0.24 * t; M.rg = 0.9; if (pit > 0.76) M.ao *= 1 - (pit - 0.76) * 1.7; const dust = (1 - ao) * 0.45; M.r *= 1 - dust * 0.35; M.g *= 1 - dust * 0.48; M.b *= 1 - dust * 0.5; }
  function bronzeM(K, u, v, ao, sd, wear) { const { M, vn, ss, lerp } = K, n = vn(u * 5 + sd, v * 5) * 0.6 + vn(u * 17, v * 17 + sd) * 0.4, pat = ss(0.45, 0.82, n + (1 - ao) * 0.55) * (1 - (wear || 0) * 0.8);
    M.mt = 1 - pat * 0.72; M.r = lerp(0.3, 0.14, pat); M.g = lerp(0.18, 0.19, pat); M.b = lerp(0.08, 0.13, pat); M.fr = lerp(0.8, 0.2, pat); M.fg = lerp(0.52, 0.23, pat); M.fb = lerp(0.24, 0.15, pat); M.rg = lerp(0.28, 0.75, pat); }
  function goldM(K, u, v, e) { const M = K.M, w = K.vn(u * 13, v * 13); M.mt = 1; M.r = 0.28; M.g = 0.18; M.b = 0.07; M.fr = 0.95 * (0.88 + 0.16 * w); M.fg = 0.7 * (0.88 + 0.16 * w); M.fb = 0.3; M.rg = 0.2 + 0.15 * (e || 0) + 0.12 * w; M.cc = 0; }
  function amberM(K, u, v, k, sd) { const { M, vn, fbm } = K, w = fbm(u * 3 + (sd || 0), v * 3); M.mt = 0; M.r = 0.3 + 0.12 * w; M.g = 0.11 + 0.05 * w; M.b = 0.02; M.rg = 0.06; M.cc = 1; const e = (k == null ? 0.35 : k) * (0.5 + 0.7 * w); M.er += 0.62 * e; M.eg += 0.27 * e; M.eb += 0.04 * e; if (vn(u * 30 + 3, v * 30) > 0.86) { M.er += 0.25; M.eg += 0.16; } }
  function obsidM(K, u, v, sd) { const { M, vn, fbm } = K, w = fbm(u * 3 + sd, v * 3), rp = Math.sin((u * 5 + v * 3 + w * 4) * 3); M.mt = 0; M.r = 0.04 + 0.025 * w; M.g = 0.03 + 0.018 * w; M.b = 0.06 + 0.05 * w; M.rg = 0.07 + 0.1 * vn(u * 9, v * 9 + sd) + 0.03 * rp; M.cc = 0.9; }
  function rubyM(K, k) { const M = K.M; M.mt = 0; M.r = 0.45; M.g = 0.02; M.b = 0.08; M.rg = 0.08; M.cc = 1; M.er += 0.9 * k; M.eg += 0.05 * k; M.eb += 0.2 * k; }
  function violM(K, k) { const M = K.M; M.mt = 0; M.r = 0.45; M.g = 0.3; M.b = 0.85; M.rg = 0.08; M.cc = 1; M.er += 0.42 * k; M.eg += 0.28 * k; M.eb += 0.95 * k; }
  function pool(K, S, rx, col, a) { const c = S.c; K.contact(S, 0.03, 0.03, rx * 0.9, rx * 0.9 * K.K, 0.5); c.save(); c.scale(1, K.K); const g = c.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx * 1.3); g.addColorStop(0, `rgba(${col},${0.22 * a})`); g.addColorStop(0.6, `rgba(${col},${0.08 * a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx * 1.3, 0, TAU); c.fill(); c.restore(); }
  // a jagged break: everything above a ragged line at height h (tiles up) erased, between x0 and x1
  function breakTop(S, x0, x1, h, amp, sd) { const c = S.c, R = (s => { let x = s >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; })(sd * 977 + 13);
    c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.moveTo(x0 - 0.3, -h - 9); c.lineTo(x0 - 0.3, -h); const n = 9; for (let i = 0; i <= n; i++) c.lineTo(x0 + (x1 - x0) * i / n, -h - (R() - 0.5) * amp * 2 - Math.sin(i * 1.7 + sd) * amp * 0.5); c.lineTo(x1 + 0.3, -h); c.lineTo(x1 + 0.3, -h - 9); c.closePath(); c.fill(); c.restore(); }
  // a curved spine as points (tiles, y down): from (x0, y0) along angle a0, turning by `turn` radians over its length L
  function arcPts(x0, y0, a0, L, turn, n) { n = n || 18; const out = [[x0, y0]]; let x = x0, y = y0, a = a0; const ds = L / n; for (let i = 0; i < n; i++) { a += turn / n; x += Math.cos(a) * ds; y += Math.sin(a) * ds; out.push([x, y]); } return out; }

  /* ======================= the vigil ======================= */
  // a watch-stone: a stepped plinth, a tapering menhir with carved bands, a bronze collar and three claws holding its amber eye
  function paintWatch(K, S) { const { M } = K;
    pool(K, S, 0.95, '255,170,80', 0.6);
    K.rbox(S, 0, 0, 0.66, 0.52, 0, 0.26, 0.05, (f, u, v, ao) => { sandM(K, u * 2, v * 2, ao, 1.3); if (f === 'f' && v > 0.2) bronzeM(K, u * 3, v, ao, 2, 0.3); }); S.unlock();
    K.rbox(S, 0, 0, 0.52, 0.42, 0.26, 0.48, 0.05, (f, u, v, ao) => { sandM(K, u * 2, v * 2, ao, 1.7); }); S.unlock();
    K.rev(S, 0, 0, h => 0.37 - 0.1 * (h - 0.48) / 2.1 + (Math.abs(h - 1.05) < 0.06 || Math.abs(h - 2.15) < 0.06 ? 0.025 : 0), 0.48, 2.58, { part: 'front',
      mat: (u, h, ao) => { sandM(K, u * 1.3, h, ao, 2.4); if (Math.abs(h - 1.05) < 0.06 || Math.abs(h - 2.15) < 0.06) { bronzeM(K, u * 3, h * 3, ao, 3, 0.4); return; } const gl = Math.abs(K.vn(u * 4 + 2, h * 1.6) - 0.5); if (gl < 0.02 && h > 1.2 && h < 2.0) { M.ao *= 0.6; } } }); S.unlock();
    K.rev(S, 0, 0, h => 0.33 + 0.06 * Math.sin((h - 2.58) / 0.22 * Math.PI), 2.58, 2.8, { mat: (u, h, ao) => { bronzeM(K, u * 3, h * 3, ao, 4.1, 0.3); if (Math.abs(h - 2.7) < 0.02) goldM(K, u, h, 0.3); }, top: true, capMat: (x, h, ao, i, ph, x2, ey) => { bronzeM(K, x * 3, ey * 3, 0.7, 4.4, 0); M.ao = 0.55; } }); S.unlock();
    for (const [sx, k] of [[-1, 0], [1, 1]]) { K.tube(S, arcPts(sx * 0.26, -2.78, -Math.PI / 2 - sx * 0.55, 0.62, sx * 1.4, 10), 0.065, 0.02, (t, s2, ao) => { bronzeM(K, t * 6, s2, ao, 5 + k, 0.5); if (t > 0.82) goldM(K, t, s2, 0.3); }); S.unlock(); }
    K.ball(S, 0, -3.02, 0.33, 0.3, (dx, dy, ao) => { amberM(K, dx * 2, dy * 2, 0.6, 7.1); const sl = Math.abs(dx) < 0.09 * (1 - dy * dy) && Math.abs(dy) < 0.85; if (sl) { M.r = 0.05; M.g = 0.02; M.b = 0.01; M.er = M.eg = M.eb = 0; } M.ao = ao; }); S.unlock();
    K.glint(S.c, -0.09, -3.1, 0.12, 0.85); K.glint(S.c, -0.24, -1.9, 0.12, 0.35); K.ink(S, [26, 14, 22], 0.5); }
  // a decoy chime: a pedestal, two bronze posts and a crossbar, three hanging tubes, a violet striker between them
  function paintChime(K, S) { const { M } = K;
    pool(K, S, 0.7, '200,150,255', 0.6);
    K.rbox(S, 0, 0, 0.42, 0.32, 0, 0.32, 0.05, (f, u, v, ao) => { sandM(K, u * 2, v * 2, ao, 3.3); if (f === 'f' && Math.abs(v - 0.26) < 0.03) bronzeM(K, u * 4, v, ao, 1, 0.4); }); S.unlock();
    for (const sx of [-1, 1]) { K.tube(S, [[sx * 0.34, -0.3], [sx * 0.34, -2.06]], 0.045, 0.04, (t, s2, ao) => bronzeM(K, t * 8, s2, ao, 2 + sx, 0.4)); S.unlock(); K.ball(S, sx * 0.34, -2.1, 0.07, 0.07, (dx, dy, ao) => goldM(K, dx, dy, 0.2)); S.unlock(); }
    K.tube(S, [[-0.42, -2.04], [0.42, -2.04]], 0.04, 0.04, (t, s2, ao) => { bronzeM(K, t * 8, s2, ao, 3.3, 0.3); if (Math.abs(t - 0.5) < 0.04) goldM(K, t, s2, 0.2); }); S.unlock();
    for (const [x, y1, k] of [[-0.19, -1.18, 0], [0.19, -1.32, 1], [0, -1.02, 2]]) { K.tube(S, [[x, -1.98], [x, y1]], 0.05, 0.05, (t, s2, ao) => { bronzeM(K, t * 4, s2, ao, 6 + k, 0.65); if (t < 0.06) goldM(K, t, s2, 0.3); }); S.unlock(); }
    K.ball(S, 0.02, -1.62, 0.09, 0.11, (dx, dy, ao) => { violM(K, 0.6); M.ao = ao; }); S.unlock();
    K.glint(S.c, -0.19, -1.7, 0.09, 0.7); K.glint(S.c, 0.02, -1.66, 0.07, 0.9); K.ink(S, [26, 14, 22], 0.5); }
  // a shard altar: a sandstone plinth trimmed in bronze, an amber inlay on its front, two bronze claws curling up as a cradle
  function paintAltar(K, S) { const { M } = K;
    pool(K, S, 0.95, '255,190,110', 0.6);
    K.rbox(S, 0, 0, 0.62, 0.46, 0, 0.62, 0.06, (f, u, v, ao) => { if (f === 't') { sandM(K, u * 2, v * 2, ao, 4.1); if (Math.hypot(u, v * 1.3) < 0.28) { amberM(K, u * 3, v * 3, 0.5, 2); } return; } sandM(K, u * 2, v * 2, ao, 4.4);
      if (Math.abs(v - 0.56) < 0.04 || Math.abs(v - 0.06) < 0.035) bronzeM(K, u * 4, v * 4, ao, 2, 0.4); else if (Math.abs(u) < 0.2 && v > 0.18 && v < 0.44) { amberM(K, u * 3, v * 3, 0.4, 3); if (Math.abs(u) > 0.17 || v < 0.21 || v > 0.41) bronzeM(K, u, v, ao, 3, 0.3); } }); S.unlock();
    for (const sx of [-1, 1]) { K.tube(S, arcPts(sx * 0.36, -0.66, -Math.PI / 2 - sx * 0.3, 0.68, sx * 1.9, 14), 0.075, 0.02, (t, s2, ao) => { bronzeM(K, t * 7, s2, ao, 4 + sx, 0.5); if (Math.abs(((t * 6) % 1) - 0.5) < 0.06) M.ao *= 0.7; if (t > 0.86) goldM(K, t, s2, 0.3); }); S.unlock(); }
    K.glint(S.c, -0.4, -0.66, 0.1, 0.45); K.ink(S, [26, 14, 22], 0.5); }
  // a star shard: three violet crystal spikes from one root, a gold vein, a pale heart
  function paintShard(K, S) {
    for (const [a, L, r] of [[-1.22, 0.42, 0.075], [-1.9, 0.36, 0.06], [-1.57, 0.62, 0.11]]) { K.tube(S, [[0, -0.06], [Math.cos(a) * L, -0.06 + Math.sin(a) * L]], r, 0.008, (t, s2, ao) => { violM(K, 0.45 + 0.6 * t); K.M.ao = 0.7 + 0.3 * Math.abs(s2); if (Math.abs(s2) < 0.08 && t < 0.7) goldM(K, t, s2, 0.2); }); S.unlock(); }
    K.glint(S.c, -0.02, -0.5, 0.1, 0.9); K.ink(S, [40, 18, 60], 0.45); }
  // the star held in the scorpion's sting: five tapered violet arms round a pale heart
  function paintStar(K, S) {
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; K.tube(S, [[0, 0], [Math.cos(a) * 0.5, Math.sin(a) * 0.5]], 0.14, 0.01, (t, s2, ao) => { violM(K, 0.4 + 0.5 * (1 - t)); K.M.ao = 0.75 + 0.25 * Math.abs(s2); }); S.unlock(); }
    K.ball(S, 0, 0, 0.16, 0.16, (dx, dy, ao) => { violM(K, 1.1); K.M.er += 0.3; K.M.eg += 0.3; K.M.eb += 0.2; K.M.ao = ao; }); S.unlock();
    K.glint(S.c, -0.05, -0.06, 0.14, 0.9); K.ink(S, [40, 18, 60], 0.35); }
  // a thread post: an obsidian spike ringed in gold, a ruby bead on top
  function paintPost(K, S) { const { M } = K;
    pool(K, S, 0.5, '255,60,110', 0.5);
    K.rbox(S, 0, 0, 0.26, 0.22, 0, 0.16, 0.04, (f, u, v, ao) => { obsidM(K, u * 3, v * 3, 2.2); if (f === 'f' && v > 0.12) goldM(K, u, v, 0.3); }); S.unlock();
    K.rev(S, 0, 0, h => 0.15 * (1 - (h - 0.16) / 1.6 * 0.75), 0.16, 1.62, { mat: (u, h, ao) => { obsidM(K, u * 2, h * 2, 3.1); if (Math.abs(((h - 0.16) / 0.36) % 1 - 0.5) < 0.06) goldM(K, u, h, 0.25); } }); S.unlock();
    K.ball(S, 0, -1.7, 0.1, 0.1, (dx, dy, ao) => { rubyM(K, 0.5 + 0.4 * (1 - Math.hypot(dx, dy))); M.ao = ao; }); S.unlock();
    K.glint(S.c, -0.04, -1.74, 0.07, 0.9); K.ink(S, [26, 10, 20], 0.5); }
  // the vigil's cover: a sandstone column (v 0 whole, its capital and bronze band; v 1 broken), or a ruin of fallen drums (v 2)
  function paintPillar(K, S, v) { const { M } = K, H = v === 0 ? 2.75 : 1.75;
    pool(K, S, 0.85, '120,90,180', 0.5);
    if (v === 2) { K.rbox(S, 0, 0, 0.56, 0.48, 0, 0.5, 0.08, (f, u, vv, ao) => sandM(K, u * 2, vv * 2, ao, 6.1)); S.unlock();
      K.tube(S, [[-0.55, -0.62], [0.5, -0.55]], 0.3, 0.3, (t, s2, ao) => { sandM(K, t * 3, s2, ao, 7.7); const f = Math.cos(s2 * 6); M.ao *= 0.78 + 0.22 * f * f; if (Math.abs(t - 0.06) < 0.03 || Math.abs(t - 0.94) < 0.03) M.ao *= 0.6; }); S.unlock();
      K.rev(S, 0.15, -0.88, h => 0.28, 0, 0.42, { top: true, capMat: (x, h, ao, i, ph, x2, ey) => { sandM(K, x * 3, ey * 3, 1, 8.3); if (Math.hypot(x, ey * 0.3) < 0.08) M.ao *= 0.6; }, mat: (u, h, ao) => sandM(K, u * 1.4, h, ao, 8.3) }); S.unlock();
      K.glint(S.c, -0.3, -0.95, 0.12, 0.35); K.ink(S, [26, 14, 22], 0.5); return; }
    K.rbox(S, 0, 0, 0.5, 0.44, 0, 0.3, 0.05, (f, u, vv, ao) => { sandM(K, u * 2, vv * 2, ao, 2.3 + v); if (f === 'f' && vv > 0.24) bronzeM(K, u * 4, vv, ao, 1.4, 0.4); }); S.unlock();
    K.rev(S, 0, 0, h => (v === 0 && h > H - 0.25 ? 0.3 + 0.1 * K.ss(H - 0.25, H, h) : 0.3) * (1 + 0.04 * Math.sin(h * 6 + v)), 0.3, H, { part: 'front', top: v === 0, capMat: (x, h, ao, i, ph, x2, ey) => sandM(K, x * 3, ey, 1, 3.1),
      mat: (u, h, ao, ins, phi) => { if (Math.abs(h - 0.62) < 0.05 || Math.abs(h - (H - 0.38)) < 0.05) { bronzeM(K, u * 3, h * 3, ao, 1.1, 0.4); return; } sandM(K, u * 1.4, h, ao, 2.3 + v); const f = Math.cos(phi * 8); M.ao *= 0.8 + 0.2 * f * f; if (Math.abs(((h - 0.3) / 0.55) % 1) < 0.04) M.ao *= 0.6; } });
    S.unlock(); if (v === 1) { breakTop(S, -0.45, 0.45, H - 0.05, 0.14, 3); K.ball(S, 0.55, -0.12, 0.22, 0.16, (dx, dy, ao) => { sandM(K, dx * 2, dy * 2, ao, 9.9); M.ao = ao; }); S.unlock(); }
    K.glint(S.c, -0.12, -Math.min(H, 2.2) + 0.2, 0.12, 0.4); K.ink(S, [26, 14, 22], 0.5); }
  // the vigil's statues (cover): a hooded sentinel leaning on a bronze spear (v 0), a crouching sandstone scorpion (v 1)
  function paintStatue(K, S, v) { const { M } = K;
    pool(K, S, 0.9, '120,90,180', 0.5);
    K.rbox(S, 0, 0, 0.58, 0.48, 0, 0.3, 0.06, (f, u, vv, ao) => { sandM(K, u * 2, vv * 2, ao, 5.5 + v); if (f === 'f' && vv > 0.24) bronzeM(K, u * 4, vv, ao, 2, 0.4); }); S.unlock();
    if (v === 0) { K.tube(S, [[0.42, -0.25], [0.42, -2.55]], 0.035, 0.03, (t, s2, ao) => bronzeM(K, t * 9, s2, ao, 6, 0.4)); S.unlock();
      K.tube(S, [[0.42, -2.55], [0.42, -2.92]], 0.07, 0.005, (t, s2, ao) => goldM(K, t, s2, 0.25)); S.unlock();
      K.rev(S, 0, 0, h => 0.42 - 0.2 * Math.pow((h - 0.3) / 1.5, 1.2) + 0.03 * Math.sin(h * 9), 0.3, 1.8, { part: 'front', mat: (u, h, ao, ins, phi) => { sandM(K, u * 1.6, h, ao, 7.1); const f = Math.sin(phi * 7 + h * 1.5); M.ao *= 0.8 + 0.2 * f * f; } }); S.unlock();
      K.ball(S, 0, -2.02, 0.26, 0.3, (dx, dy, ao) => { sandM(K, dx * 2, dy * 2, ao, 7.9); if (dy > -0.2 && Math.abs(dx) < 0.55 && dy < 0.6) { M.r *= 0.25; M.g *= 0.22; M.b *= 0.3; M.ao *= 0.5; } M.ao *= ao; }); S.unlock();
      K.ball(S, 0.36, -1.45, 0.1, 0.1, (dx, dy, ao) => { sandM(K, dx, dy, ao, 8.8); M.ao = ao; }); S.unlock(); }
    else { K.ball(S, 0, -0.62, 0.48, 0.3, (dx, dy, ao) => { sandM(K, dx * 2, dy * 2, ao, 4.4); const sg = Math.abs(((dx + 1) * 3) % 1 - 0.5); if (sg < 0.05) M.ao *= 0.6; M.ao *= ao; }); S.unlock();
      for (const sx of [-1, 1]) { K.tube(S, [[sx * 0.3, -0.55], [sx * 0.72, -0.45], [sx * 0.86, -0.7]], 0.08, 0.06, (t, s2, ao) => sandM(K, t * 3, s2, ao, 5 + sx)); S.unlock(); K.ball(S, sx * 0.88, -0.78, 0.15, 0.12, (dx, dy, ao) => { sandM(K, dx, dy, ao, 6 + sx); if (Math.abs(dy + 0.2) < 0.12 && dx * sx > 0) M.ao *= 0.5; M.ao *= ao; }); S.unlock(); }
      K.tube(S, arcPts(0, -0.78, -Math.PI / 2 - 0.15, 1.6, 2.6, 20), 0.16, 0.06, (t, s2, ao) => { sandM(K, t * 4, s2, ao, 9.1); if (Math.abs(((t * 6) % 1) - 0.5) < 0.07) M.ao *= 0.65; }); S.unlock();
      K.ball(S, 0.48, -2.08, 0.1, 0.1, (dx, dy, ao) => { sandM(K, dx, dy, ao, 9.4); M.ao = ao; }); S.unlock(); }
    K.glint(S.c, -0.2, -1.2, 0.12, 0.3); K.ink(S, [26, 14, 22], 0.5); }
  // a sandstone boulder, wind-carved, an amber crystal cluster in its side (cover)
  function paintRock(K, S, v) { const { M, vn } = K, R = [0.62, 0.55][v], sd = 3 + v * 4;
    pool(K, S, 0.85, '120,90,180', 0.5);
    K.ball(S, 0, -R * 0.92, R * 1.12, R, (dx, dy, ao) => { sandM(K, dx * 2 + sd, dy * 2, ao, sd); const f = Math.floor((Math.atan2(dy, dx) + 4) * 2.1 + v) + Math.floor(Math.hypot(dx, dy) * 2.5); M.ao = ao * (0.72 + 0.28 * vn(f * 1.7 + sd, 2.3)); if (dy < -0.4) { M.r *= 1.06; M.g *= 1.03; } }); S.unlock();
    K.ball(S, R * 0.5, -R * 1.55, R * 0.5, R * 0.38, (dx, dy, ao) => { sandM(K, dx * 2, dy * 2, ao, sd + 1); M.ao = ao * 0.95; }); S.unlock();
    const cx = v ? -R * 0.5 : R * 0.45; for (const [a, L, r] of [[-1.3, 0.42, 0.08], [-1.75, 0.34, 0.065], [-0.95, 0.3, 0.06]]) { K.tube(S, [[cx, -R * 0.5], [cx + Math.cos(a) * L, -R * 0.5 + Math.sin(a) * L]], r, 0.01, (t, s2, ao) => { amberM(K, t * 3, s2, 0.6 + 0.4 * t, sd); M.ao = 0.75 + 0.25 * Math.abs(s2); }); S.unlock(); }
    K.glint(S.c, cx, -R * 0.85, 0.08, 0.7); K.ink(S, [26, 14, 22], 0.5); }

  /* ======================= the great door ======================= */
  // the frame: a sandstone plinth, jambs with amber-glass strips and bronze bands, a lintel with three shard sockets; the bronze
  // scorpion lying on the lintel: its carapace and the plates of its back, its legs gripping the lintel's top, two eyes
  function paintDoor(K, S) { const { M } = K, c = S.c, G = GEO, jx = G.WO + G.JW, RN = K.R1(4453);
    pool(K, S, 3.0, '255,170,90', 0.7);
    K.rbox(S, 0, 0, 3.15, 0.66, 0, G.PZ, 0.05, (f, u, v, ao) => { sandM(K, u, v * 2, ao, 1.7); if (f === 't' && Math.abs(v + 0.52) < 0.06) bronzeM(K, u * 3, v, ao, 2, 0.3); if (f === 'f' && v > G.PZ - 0.035) goldM(K, u, v, 0.4); }); S.unlock();
    for (const sd of [-1, 1]) { const x = sd * jx;
      K.rbox(S, x, 0, G.JW, G.JD, G.PZ, G.L0, 0.06, (f, u, v, ao) => { const lu = u * sd; if (f === 't') { sandM(K, u, v, ao, 5); return; }
        if (Math.abs(v - 0.5) < 0.06 || Math.abs(v - (G.L0 - 0.22)) < 0.06) { bronzeM(K, u * 3, v * 3, ao, 2, 0.35); return; }
        const inset = Math.abs(lu) < 0.16 && v > 0.72 && v < G.L0 - 0.45; if (inset) { amberM(K, u * 2, v, 0.5, 2.2 + sd); if (Math.abs(Math.abs(lu) - 0.15) < 0.02) bronzeM(K, u, v, ao, 3, 0.3); return; }
        sandM(K, u * 1.4, v, ao, 5.7 + sd); const ch = Math.abs(((v - 0.72) / 0.5) % 1 - 0.5); if (Math.abs(lu) > 0.3 && ch < 0.035) M.ao *= 0.62; }); S.unlock(); }
    K.rbox(S, 0, 0, jx + G.JW + 0.14, G.JD + 0.06, G.L0, G.L1, 0.06, (f, u, v, ao) => { if (f === 't') { sandM(K, u, v, ao, 8); return; } sandM(K, u * 1.5, v * 1.5, ao, 6.1);
      if (Math.abs(v - G.L0 - 0.07) < 0.035 || Math.abs(v - G.L1 + 0.07) < 0.035) { goldM(K, u, v, 0.2); return; }
      if (Math.abs(u) < 1.25 && v > G.L0 + 0.13 && v < G.L1 - 0.13) bronzeM(K, u * 2, v * 2, ao, 6.6, 0.4);
      for (const sx of G.stud) { const d = Math.hypot(u - sx, v - G.studZ); if (d < 0.2) { if (d > 0.14) goldM(K, u, v, 0.2); else { M.mt = 0; M.r = 0.04; M.g = 0.02; M.b = 0.06; M.rg = 0.3; M.cc = 0.6; M.ao *= 0.7; } } } }); S.unlock();
    // the scorpion: its legs first (four a side, gripping the lintel), the plates of its back, its carapace, its eyes
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const by = -(G.L1 + 0.25 + i * 0.12), bx = sd * (0.42 + i * 0.05), kx = sd * (1.25 + i * 0.28), ky = by - 0.34 + i * 0.06, fx = sd * (1.42 + i * 0.36), fy = -(G.L1 - 0.12);
      K.tube(S, [[bx, by], [kx, ky], [fx, fy]], 0.075 - i * 0.008, 0.035, (t, s2, ao) => { bronzeM(K, t * 6, s2, ao, 3 + i + sd, t > 0.45 && t < 0.55 ? 0.8 : 0.4); if (Math.abs(t - 0.5) < 0.05) goldM(K, t, s2, 0.3); }); S.unlock(); }
    for (let i = 3; i >= 1; i--) { const y = -(G.L1 + 0.42 + i * 0.25), rx = 0.62 - i * 0.07; K.ball(S, 0, y, rx, 0.2, (dx, dy, ao) => { bronzeM(K, dx * 2, dy * 3 + i, ao, 7 + i, 0.5); if (Math.abs(dy - 0.55) < 0.12) M.ao *= 0.6; if (Math.abs(dx) < 0.05) goldM(K, dx, dy, 0.3); M.ao *= ao; }); S.unlock(); }
    K.ball(S, 0, -(G.L1 + 0.36), 0.7, 0.36, (dx, dy, ao) => { bronzeM(K, dx * 2, dy * 2, ao, 9.2, 0.45); const rid = Math.abs(dx) < 0.05 && dy < 0.2; if (rid) goldM(K, dx, dy, 0.25); if (Math.abs(Math.hypot(dx, dy * 0.8) - 0.7) < 0.04) M.ao *= 0.7; M.ao *= ao; }); S.unlock();
    for (const [ex, ey] of G.eyes) { K.ball(S, ex, -ey, 0.075, 0.065, (dx, dy, ao) => { amberM(K, dx, dy, 0.7, 4); M.ao = ao; }); S.unlock(); }
    K.glint(c, -jx - 0.3, -G.L0 + 0.1, 0.16, 0.5); K.glint(c, jx + 0.3, -G.L1 + 0.1, 0.14, 0.45); K.glint(c, -0.3, -(G.L1 + 0.55), 0.16, 0.7);
    c.save(); for (let i = 0; i < 50; i++) { const x = (RN() - 0.5) * 6.2, y = -RN() * 0.5; c.fillStyle = `rgba(232,196,150,${(0.15 + RN() * 0.3).toFixed(2)})`; c.fillRect(x, y, 0.02, 0.014); } c.restore();
    K.ink(S, [26, 14, 22], 0.5); }
  // a leaf: amber glass in a bronze frame (a bronze band across it, rivets), half the Scorpio sign etched in gold, gold at the seam
  function paintLeaf(K, S, v) { const { M, clamp } = K, G = GEO, sd = v === 'l' ? -1 : 1, P = S.P, top = G.L0 + 0.15;
    S.lock();
    for (let py = 0; py < S.h; py++) { const Yt = (S.ay - py - 0.5) / P; if (Yt < G.PZ - 0.02 || Yt > top) continue; for (let px = 0; px < S.w; px++) { const X = (px + 0.5 - S.ax) / P, lx = X * sd; if (lx < -0.5 / P || lx > G.WO + 0.1) continue;
      let nx = 0, nz = 0, ao = 1; K.M0(); const fx = G.WO - lx, fr = lx < 0.08 || fx < 0.14 || Yt < G.PZ + 0.14 || Yt > top - 0.14 || Math.abs(Yt - 1.72) < 0.07;
      if (fr) { bronzeM(K, X * 2, Yt * 2, 0.85, v === 'l' ? 2.1 : 4.7, 0.5); nz += Math.abs(Yt - 1.72) < 0.07 ? 0.25 : 0; if (lx < 0.04) { nx = sd * (1 - lx / 0.04) * 0.6; ao = 0.6; goldM(K, X, Yt, 0.25); } }
      else { amberM(K, X * 1.4, Yt * 1.4, 0.42 + 0.25 * Math.sin(Yt * 1.3 + lx), v === 'l' ? 1.3 : 2.9); const cr = Math.abs(K.vn(X * 5 + sd, Yt * 4) - 0.5); if (cr < 0.012) { M.er += 0.3; M.eg += 0.14; } ao = 0.95;
        // the sign's half: three stems' arches on the left leaf, the tail and its sting on the right (etched gold lines)
        let e = 9; if (v === 'l') { for (const sx of [0.3, 0.78]) { e = Math.min(e, Math.abs(Math.hypot(lx - sx, Yt - 2.45) - 0.24) + (Yt < 2.45 ? 9 : 0)); e = Math.min(e, Yt < 2.45 && Yt > 0.95 ? Math.abs(lx - (sx - 0.24)) : 9); } e = Math.min(e, Yt < 2.45 && Yt > 0.95 ? Math.abs(lx - 1.02) : 9); }
        else { e = Math.min(e, Yt < 2.45 && Yt > 0.95 ? Math.abs(lx - 0.22) : 9); e = Math.min(e, Math.abs(Math.hypot(lx - 0.46, Yt - 2.45) - 0.24) + (Yt < 2.45 ? 9 : 0)); const sx = 0.7; if (Yt < 2.45 && Yt > 1.15) e = Math.min(e, Math.abs(lx - sx)); if (Yt <= 1.15 && Yt > 0.8) e = Math.min(e, Math.abs((lx - sx) - (1.15 - Yt) * 0.9)); const tx = sx + 0.32, ty = 0.84; if (Math.hypot(lx - tx, Yt - ty) < 0.14) e = Math.min(e, Math.abs(Math.abs(lx - tx) + Math.abs(Yt - ty) - 0.1)); }
        if (e < 0.05) { goldM(K, X, Yt, 0.3); M.er += 0.12; M.eg += 0.08; nz += 0.2; } else if (e < 0.075) ao *= 0.75; }
      const rv = ((lx * 3.6) % 1) - 0.5, ry2 = ((Yt * 2.8) % 1) - 0.5; if (fr && Math.hypot(rv * 0.28, ry2 * 0.36) < 0.035 && lx > 0.18) { goldM(K, X, Yt, 0.2); nx += rv * 2 * sd; nz -= ry2 * 2; }
      M.ao = ao; const l = Math.hypot(nx, 1, nz); K.shade(nx / l, 1 / l, nz / l); K.put(S, px, py, clamp((G.WO + 0.1 - lx) * P + 0.5, 0, 1) * clamp(lx * P + 1, 0, 1)); } }
    S.unlock(); K.ink(S, [26, 14, 22], 0.35); }
  // a pincer arm: from its shoulder (the picture's feet) down: the upper arm, a gold-ringed joint, the forearm, the closed claw
  function paintArm(K, S) { const { M } = K, L = GEO.claw;
    K.ball(S, 0, 0, 0.17, 0.15, (dx, dy, ao) => { bronzeM(K, dx * 2, dy * 2, ao, 1.1, 0.5); M.ao = ao; }); S.unlock();
    K.tube(S, [[0, 0.05], [0.12, L * 0.45]], 0.13, 0.1, (t, s2, ao) => { bronzeM(K, t * 5, s2, ao, 2.3, 0.45); if (Math.abs(t - 0.5) < 0.04) goldM(K, t, s2, 0.3); }); S.unlock();
    K.ball(S, 0.12, L * 0.46, 0.13, 0.12, (dx, dy, ao) => { bronzeM(K, dx * 2, dy * 2, ao, 3.1, 0.6); if (Math.abs(Math.hypot(dx, dy) - 0.8) < 0.1) goldM(K, dx, dy, 0.2); M.ao = ao; }); S.unlock();
    K.tube(S, [[0.12, L * 0.47], [0.02, L * 0.72]], 0.11, 0.13, (t, s2, ao) => bronzeM(K, t * 5, s2, ao, 4.3, 0.45)); S.unlock();
    K.ball(S, 0.02, L * 0.8, 0.22, 0.19, (dx, dy, ao) => { bronzeM(K, dx * 2, dy * 2, ao, 5.5, 0.4); if (Math.abs(dx) < 0.05) goldM(K, dx, dy, 0.3); M.ao = ao; }); S.unlock();
    for (const sx of [-1, 1]) { K.tube(S, arcPts(0.02 + sx * 0.1, L * 0.86, Math.PI / 2 + sx * 0.25, 0.34, -sx * 0.9, 10), 0.07, 0.018, (t, s2, ao) => { bronzeM(K, t * 4, s2, ao, 6 + sx, 0.55); if (t > 0.82) goldM(K, t, s2, 0.3); }); S.unlock(); }
    K.glint(S.c, -0.06, L * 0.76, 0.1, 0.6); K.ink(S, [26, 14, 22], 0.45); }
  // a tail segment (drawn along the curve, base at the picture's feet, pointing up): a ridged bronze plate, gold at its joint
  function paintTseg(K, S) { const { M } = K;
    K.ball(S, 0, -0.31, 0.25, 0.36, (dx, dy, ao) => { bronzeM(K, dx * 2, dy * 2, ao, 4.2, 0.4); if (Math.abs(dx) < 0.06 && dy < 0.6) { M.ao *= 0.85; goldM(K, dx, dy, 0.35); } if (dy > 0.72) M.ao *= 0.55; M.ao *= ao; }); S.unlock();
    K.ball(S, 0, -0.04, 0.16, 0.08, (dx, dy, ao) => { goldM(K, dx, dy, 0.25); M.ao = ao; }); S.unlock();
    K.glint(S.c, -0.08, -0.44, 0.07, 0.6); K.ink(S, [26, 14, 22], 0.45); }
  // the sting: a bronze bulb (its base at the picture's feet, pointing up), the barb curling over, a gold cradle for the star
  function paintSting(K, S) { const { M } = K;
    K.ball(S, 0, -0.3, 0.27, 0.32, (dx, dy, ao) => { bronzeM(K, dx * 2, dy * 2, ao, 8.1, 0.4); const rb = Math.abs(((dy + 1) * 2.4) % 1 - 0.5); if (rb < 0.05) M.ao *= 0.7; M.ao *= ao; }); S.unlock();
    K.tube(S, arcPts(0, -0.55, -Math.PI / 2, 0.55, 1.6, 12), 0.13, 0.01, (t, s2, ao) => { bronzeM(K, t * 4, s2, ao, 8.8, 0.5); if (t > 0.7) goldM(K, t, s2, 0.25); }); S.unlock();
    for (const sx of [-1, 1]) { K.tube(S, arcPts(sx * 0.14, -0.5, -Math.PI / 2 - sx * 0.6, 0.32, sx * 1.0, 8), 0.04, 0.012, (t, s2, ao) => goldM(K, t, s2, 0.25)); S.unlock(); }
    K.glint(S.c, -0.1, -0.42, 0.08, 0.6); K.ink(S, [26, 14, 22], 0.45); }

  /* ======================= the sanctum ======================= */
  // the Sevenfold Crown: a stepped dais of obsidian banded in gold, seven curved blades fanned across its back, ringed in gold,
  // their tips ruby; a ruby heart in a gold cradle at the front
  function paintCrown(K, S) { const { M } = K;
    pool(K, S, 3.8, '255,60,100', 0.7);
    K.rbox(S, 0, 0, 3.2, 0.95, 0, 0.32, 0.06, (f, u, v, ao) => { obsidM(K, u, v * 2, 2.1); if (f === 'f' && Math.abs(v - 0.26) < 0.03) goldM(K, u, v, 0.3); if (f === 't' && Math.abs(Math.abs(v) - 0.7) < 0.04) goldM(K, u, v, 0.3); }); S.unlock();
    K.rbox(S, 0, -0.18, 2.45, 0.62, 0.32, 0.66, 0.06, (f, u, v, ao) => { obsidM(K, u, v * 2, 3.3); if (f === 'f' && Math.abs(v - 0.6) < 0.03) goldM(K, u, v, 0.3); if (f === 'f' && Math.abs(u) < 2.2 && Math.abs(v - 0.45) < 0.05 && Math.abs(((u + 2.2) / 0.55) % 1 - 0.5) < 0.12) amberM(K, u, v, 0.7, 2); }); S.unlock();
    // the blades: tallest in the middle, fanned outward, each tip curling in over the dais
    for (const k of [0, 6, 1, 5, 2, 4, 3]) { const f = (k - 3) / 3, bx = f * 2.05, by = -0.95 - (1 - Math.abs(f)) * 0.12, a0 = -Math.PI / 2 + f * 0.42, L = 4.0 + (1 - Math.abs(f)) * 1.6, turn = -f * 0.9 + (k === 3 ? 0.0 : 0) + 0.85 * (f >= 0 ? -1 : 1) * Math.abs(f) * 0.5 - (f === 0 ? 0.6 : 0);
      const pts = arcPts(bx, by, a0, L, f === 0 ? 1.2 : -Math.sign(f) * 1.25, 26), sd = 3 + k;
      K.tube(S, pts, 0.24 - Math.abs(f) * 0.04, 0.03, (t, s2, ao) => { if (t > 0.8) { rubyM(K, 0.35 + 0.8 * (t - 0.8) / 0.2); M.ao = 0.7 + 0.3 * Math.abs(s2); return; } obsidM(K, t * 6, s2, sd); const seg = ((t * 9) % 1); if (seg < 0.07) M.ao *= 0.55; if (Math.abs(seg - 0.5) < 0.04 && t < 0.78) goldM(K, t, s2, 0.25); if (Math.abs(s2) < 0.12 && t < 0.78 && seg > 0.2 && seg < 0.8) { M.er += 0.25 * (1 - t); M.eb += 0.08 * (1 - t); } }); S.unlock();
      K.ball(S, bx, by + 0.02, 0.28, 0.2, (dx, dy, ao) => { goldM(K, dx, dy, 0.25); M.ao = ao; }); S.unlock(); }
    K.tube(S, [[-0.5, -1.1], [-0.38, -1.62], [0, -1.9], [0.38, -1.62], [0.5, -1.1]], 0.07, 0.07, (t, s2, ao) => goldM(K, t, s2, 0.2)); S.unlock();
    K.ball(S, 0, -1.45, 0.42, 0.46, (dx, dy, ao) => { rubyM(K, 0.55 + 0.6 * (1 - Math.hypot(dx, dy))); const fc = Math.floor((Math.atan2(dy, dx) + 4) * 1.6); M.ao = ao * (0.8 + 0.2 * K.vn(fc * 3.1, 1.7)); }); S.unlock();
    K.glint(S.c, -0.14, -1.62, 0.2, 0.9); K.glint(S.c, -2.4, -3.8, 0.2, 0.5); K.glint(S.c, 1.3, -5.0, 0.18, 0.5); K.ink(S, [26, 8, 18], 0.5); }
  // the sanctum's columns: obsidian drums banded in gold with amber-glass inlays; v 0 whole with an amber bowl, v 1 broken, v 2 broken and chained
  function paintCol(K, S, v) { const { M } = K, H = [3.3, 1.5, 2.5][v], R0 = 0.44, sd = 1.7 + v * 2.3;
    pool(K, S, 0.95, '255,80,120', 0.6);
    K.rbox(S, 0, 0, 0.62, 0.52, 0, 0.36, 0.05, (f, u, vv, ao) => { obsidM(K, u * 2, vv * 2, sd); if (f === 'f' && Math.abs(vv - 0.28) < 0.03) goldM(K, u, vv, 0.3); }); S.unlock();
    K.rev(S, 0, 0, h => R0 - 0.03 * (h / 4), 0.36, H, { part: 'front', top: v === 0, capMat: (x, h, ao) => obsidM(K, x * 3, h, sd + 1),
      mat: (u, h, ao, ins, phi) => { const drum = ((h - 0.36) / 0.62) % 1; obsidM(K, u * 1.2, h, sd); if (drum < 0.03) M.ao *= 0.5; const f = Math.cos(phi * 6); M.ao *= 0.75 + 0.25 * f * f; if (Math.abs(h - 0.64) < 0.045 || Math.abs(h - 2.9) < 0.045) goldM(K, u, h, 0.3); else if (Math.abs(drum - 0.5) < 0.08 && Math.abs(((u + 3) / 0.36) % 1 - 0.5) < 0.18) amberM(K, u, h, 0.6, sd); } }); S.unlock();
    if (v === 0) { K.rev(S, 0, -H, h => 0.18 + Math.pow(h / 0.4, 1.6) * 0.34, 0, 0.4, { floorAO: 0, mat: (u, h, ao) => { goldM(K, u, h, 0.3); }, top: true, capMat: (x, h, ao, i, ph, x2, ey) => { const r = Math.hypot(x / 0.52, ey); if (r > 0.86) { goldM(K, x, ey, 0.3); return; } amberM(K, x * 3, ey * 3, 0.9, sd); } }); S.unlock(); }
    else breakTop(S, -R0 - 0.1, R0 + 0.1, H - 0.05, 0.12, sd);
    if (v === 1) { K.tube(S, [[0.35, -0.3], [1.15, -0.18]], 0.36, 0.36, (t, s2, ao) => { obsidM(K, t * 3, s2, sd + 5); const f = Math.cos(s2 * 6); M.ao *= 0.75 + 0.25 * f * f; }); S.unlock(); }
    if (v === 2) { const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([-0.42 + t * 1.1, -(H - 0.4) + Math.sin(t * Math.PI) * 0.7 + t * 1.6]); } K.tube(S, pts, 0.045, 0.045, (t, s2, ao) => { goldM(K, t * 30, s2, 0.4); if (((t * 18) % 1) < 0.22) M.ao *= 0.55; }); S.unlock(); }
    K.glint(S.c, -0.3, -Math.min(H, 2.4) + 0.2, 0.15, 0.55); K.ink(S, [26, 8, 18], 0.5); }
  // an amber shard held in the air: a faceted lump of amber glass (v 0, 2) or obsidian veined with amber (v 1)
  function paintFrag(K, S, v) { const { M, vn } = K, r = [0.5, 0.4, 0.3][v], sd = 9 + v * 3;
    K.ball(S, 0, -r, r * 0.85, r, (dx, dy, ao) => { if (v === 1) { obsidM(K, dx * 3, dy * 3, sd); const cr = Math.abs(vn(dx * 3 + sd, dy * 3) - 0.5); if (cr < 0.04) { M.er += 0.7; M.eg += 0.3; } } else amberM(K, dx * 2, dy * 2, 0.5, sd); const f = Math.floor((Math.atan2(dy, dx) + 4) * 2.2) + Math.floor(Math.hypot(dx, dy) * 3); M.ao = ao * (0.72 + 0.28 * vn(f * 1.7 + sd, 2.3)); }); S.unlock();
    K.ball(S, r * 0.3, -r * 1.7, r * 0.35, r * 0.5, (dx, dy, ao) => { amberM(K, dx * 2 + 4, dy * 2, 0.6, sd + 1); M.ao = ao * 0.9; }); S.unlock();
    K.glint(S.c, -r * 0.3, -r * 1.3, r * 0.3, 0.7); K.ink(S, [26, 8, 18], 0.45); }

  /* ======================= the sky (2D, per pixel: no lighting pass) ======================= */
  // the blood moon (P px per its radius): a crimson disc, its dark seas, its limb darkened, a fine bright rim, a corona
  function paintMoon(K, S) { const { fbm, clamp, ss } = K, P = S.P; S.lock(); const d = S.d;
    for (let py = 0; py < S.h; py++) for (let px = 0; px < S.w; px++) { const x = (px + 0.5 - S.ax) / P, y = (py + 0.5 - S.ay) / P, r = Math.hypot(x, y); if (r > 1.75) continue;
      let R = 0, G = 0, B = 0, A = 0;
      if (r < 1) { const z = Math.sqrt(1 - r * r), n = fbm(x * 2.6 + 3, y * 2.6 + 1), mar = ss(0.48, 0.62, fbm(x * 1.4 + 9, y * 1.4 + 2)), cr = fbm(x * 9 + 1, y * 9), lit = 0.45 + 0.55 * Math.pow(z, 0.55) * (0.75 + 0.25 * (-x * 0.5 - y * 0.3 + 0.6));
        R = (0.62 + 0.25 * n - 0.32 * mar) * lit + 0.05 * cr; G = (0.09 + 0.06 * n - 0.05 * mar) * lit; B = (0.12 + 0.05 * n - 0.03 * mar) * lit; A = clamp((1 - r) * P + 0.5, 0, 1);
        const rim = ss(0.9, 1.0, r) * ss(-0.2, 0.6, -x * 0.7 - y * 0.7); R += 0.45 * rim; G += 0.18 * rim; B += 0.16 * rim; }
      const cor = Math.exp(-(r - 1) * 4.2) * ss(0.97, 1.0, r); if (r >= 0.98) { R += 0.85 * cor; G += 0.12 * cor; B += 0.22 * cor; A = Math.max(A, clamp(cor * 0.9, 0, 1)); }
      const i = (py * S.w + px) * 4; d[i] = clamp(R * 255, 0, 255); d[i + 1] = clamp(G * 255, 0, 255); d[i + 2] = clamp(B * 255, 0, 255); d[i + 3] = A * 255; }
    S.unlock(); }

  /* ======================= the pictures ======================= */
  const DEFS = {
    watch: { light: 'vigil', box: () => [-0.85, -3.35, 0.85, 0.55], paint: paintWatch },
    chime: { light: 'vigil', box: () => [-0.62, -2.3, 0.62, 0.45], paint: paintChime },
    altar: { light: 'vigil', box: () => [-0.9, -1.45, 0.9, 0.55], paint: paintAltar },
    shard: { light: 'vigil', box: () => [-0.42, -0.78, 0.42, 0.08], paint: paintShard },
    star: { light: 'vigil', box: () => [-0.66, -0.66, 0.66, 0.66], paint: paintStar },
    post: { light: 'vigil', box: () => [-0.5, -1.9, 0.5, 0.36], paint: paintPost },
    pillar: { light: 'vigil', box: v => v === 2 ? [-1.05, -1.5, 1.05, 0.5] : [-0.95, -(v === 0 ? 3.25 : 2.0), v === 1 ? 0.95 : 0.95, 0.5], paint: paintPillar },
    statue: { light: 'vigil', box: v => v === 0 ? [-0.9, -3.05, 0.9, 0.5] : [-1.2, -2.35, 1.2, 0.5], paint: paintStatue },
    rock: { light: 'vigil', box: v => { const R = [0.62, 0.55][v]; return [-R * 1.35, -R * 2.2, R * 1.35, 0.45]; }, paint: paintRock },
    door: { light: 'vigil', box: () => [-3.5, -5.65, 3.5, 0.8], paint: paintDoor },
    leaf: { light: 'vigil', box: v => v === 'l' ? [-GEO.WO - 0.15, -GEO.L0 - 0.3, 0.06, -GEO.PZ + 0.1] : [-0.06, -GEO.L0 - 0.3, GEO.WO + 0.15, -GEO.PZ + 0.1], paint: paintLeaf },
    arm: { light: 'vigil', box: () => [-0.42, -0.25, 0.48, GEO.claw * 1.04 + 0.12], paint: paintArm },
    tseg: { light: 'vigil', box: () => [-0.34, -0.72, 0.34, 0.12], paint: paintTseg },
    sting: { light: 'vigil', box: () => [-0.4, -1.05, 0.62, 0.1], paint: paintSting },
    crown: { light: 'sanct', box: () => [-4.3, -7.0, 4.3, 1.0], paint: paintCrown },
    col: { light: 'sanct', box: v => [-1.15, -(v === 0 ? 4.0 : v === 2 ? 3.0 : 2.2), v === 1 ? 1.65 : 1.15, 0.6], paint: paintCol },
    frag: { light: 'sanct', box: v => { const r = [0.5, 0.4, 0.3][v]; return [-r - 0.1, -r * 2.3, r + 0.2, 0.08]; }, paint: paintFrag },
    moon: { box: () => [-1.75, -1.75, 1.75, 1.75], paint: paintMoon } };
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  function paint(name, v, P) { const B = BP(); if (!B) return null; const K = B.kit, D = DEFS[name], b = D.box(v), t0 = now(); let S = null;
    try { S = K.surface(b[0], b[1], b[2], b[3], P); const go = () => { D.paint(K, S, v); S.unlock(); }; if (D.light) lit(K, D.light, go); else go(); } catch (e) { if (typeof console !== 'undefined') console.warn('SCORPIO_PROPS', name, e); if (S) S.cv.width = S.cv.height = 1; return null; }
    const cv = document.createElement('canvas'); cv.width = S.w; cv.height = S.h; cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;   // (the work canvas, read back often, given back at once)
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  const keyOf = (name, v, P) => name + '|' + v + '|' + P;
  function sprite(name, v, P, force) { if (!DEFS[name] || !BP()) return null; P = Math.max(6, Math.round(P || BASE || 48)); const key = keyOf(name, v, P); let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 12) return null;   // (a painting budget: what does not fit waits a frame)
    s = paint(name, v, P); if (s) CACHE.set(key, s); return s; }
  // (the sky's moon drawn at a radius of 3.2 tiles from a capped painting; the floating shards and the tail a little sharper than the floor)
  const SKY_P = { moon: P => Math.round(Math.min(P, 52) * 3.2) };
  const MOON_R = 3.2;
  function pick(name, v) { if (!BASE) return null; const PB = SKY_P[name] ? SKY_P[name](BASE) : BASE, s = CACHE.get(keyOf(name, v, PB)); return s || sprite(name, v, PB); }
  function draw(c, name, v, Xs, Ys, T, o) { const s = pick(name, v); if (!s) { STATS.misses++; return false; } o = o || {}; const f = T / s.P * (name === 'moon' ? MOON_R : 1), sx = o.sx == null ? 1 : o.sx, sy = o.sy == null ? 1 : o.sy; STATS.draws++;
    c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; c.translate(Xs, Ys); if (o.rot) c.rotate(o.rot); if (sx !== 1 || sy !== 1) c.scale(sx, sy); c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); c.restore(); return true; }
  const WARM = [['watch', 0], ['chime', 0], ['altar', 0], ['shard', 0], ['star', 0], ['post', 0], ['pillar', 0], ['pillar', 1], ['pillar', 2], ['statue', 0], ['statue', 1], ['rock', 0], ['rock', 1],
    ['door', 0], ['leaf', 'l'], ['leaf', 'r'], ['arm', 0], ['tseg', 0], ['sting', 0], ['crown', 0], ['col', 0], ['col', 1], ['col', 2], ['frag', 0], ['frag', 1], ['frag', 2], ['moon', 0]];
  function warm(P) { if (!BP() || !(P > 2)) return []; BASE = Math.round(P); return WARM.map(([n, v]) => () => { sprite(n, v, SKY_P[n] ? SKY_P[n](BASE) : BASE, true); }); }
  function release() { CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); STATS.released += CACHE.size; CACHE.clear(); BASE = 0; }
  if (typeof DunWorld !== 'undefined' && DunWorld.PROPS && !DunWorld.PROPS.sgnone) DunWorld.PROPS.sgnone = () => {};   // (a solid tile the gate draws itself: no wall block, no prop picture)
  const setBase = P => { if (P > 2) BASE = Math.round(P); };
  const API = { draw, sprite: (n, v, P) => sprite(n, v, P, true), has: n => !!DEFS[n] && !!BP(), warm, release, setBase, arcPts, GEO, TAIL, MOON_R, SKY_P, DEFS, LIGHT, WARM, get base() { return BASE; }, get stats() { return Object.assign({ cached: CACHE.size, keys: [...CACHE.keys()] }, STATS); } };
  if (typeof window !== 'undefined') window.SCORPIO_PROPS = API;
  return API;
})();
