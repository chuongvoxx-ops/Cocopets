/* ---------- (v450 SF, reworked v452 SF2) Fire's six-star summon Ultimate: SNAKE FLAME ----------
   The user's brief (2026-11-22): a gigantic serpent of living flame coils around the battlefield for exactly six seconds, then
   collapses into an engulfing ball of fire. After seeing v450 (v452 SF2, the user): "The snake should have an orange fire glow
   emanating from its skin. It needs to move all over the arena, fly up and to the sky and then plunge down and explode, make the
   final burst more dynamic." The serpent's model is 20k6j (SNAKEFLAME_GL); this file is the move: one authoritative timeline
   per cast, its damage, its path, its light, its clean-up.
   The cast (20b useUlt commits it: MP and the 30 s cooldown start there, the summons' convention, as Titan's): a short gesture
   (TUNE.gesture), then the pet has its full controls (move, dodge, Normal, Strongs) while the serpent runs on its own clock;
   enemy attacks and the encounter's timers go on. The normal camera: a little shake at the surge and a short punch at the blast,
   and a small pull back (TUNE.zoom) while it roams, given back after.
   Timeline (game seconds from the cast; TUNE):
     0 .. ring     a rotating ring of embers opens at the aimed area (the aim, moved onto open floor);
     ring          the head surges up through it, the body pouring after it (the head leads; every point of the body follows the
                   same path, the tail last);
     T_C = ring + form   fully formed: the six-second phase begins.
     T_C .. T_CL   (TUNE.coil - climb - plunge: 4.3 s) it roams the combat area: big S-curves and loops across the reachable floor
                   round the pet and the aim (and a little beyond the view), weaving among the enemies (its way-points are drawn
                   to them), as one creature: the head steers (a turning circle, walls felt ahead, never through a wall; over a
                   gap it lifts and flies), the body traces its path. Where it has been the floor burns: flowing fire that fades
                   over TUNE.fade s after the tail has passed (and stops at walls and gaps).
     T_CL .. T_P   (TUNE.climb) it rises steeply into the sky (off the top of the screen), smoke and fire streaming off it,
                   and turns over;
     T_P .. T_X    (TUNE.plunge) it plunges head-first onto the target: the aim (where its ring opened; a glow-only tell, the ring
                   of embers re-opening there, brightens as it falls), the jaw open, the eyes and seams white-hot;
     T_X = T_C + 6 exactly: it drives into the ground and the finishing explosion erupts there: a brief flash, a burst of fire,
                   a mushroom of fire rising, a shock front racing across the floor, jets of flame bursting up along radial
                   cracks as it passes, molten debris and the serpent's scales flung out arcing and falling, the cracked ground
                   glowing and cooling, a short camera punch; Celestial: more jets in two waves, more debris, a collar of flame
                   round the column. The serpent's body pours down into the impact, burning away into embers.
     then          embers and a fading heat shimmer for TUNE.linger s, no damage; the effect ends.
   Damage: DK = base x K x (1 + 0.08 (evo - 1)) (Apocalypse's scale: K 1.25 at Celestial, and the Celestial Ult's x1.6 in its base).
   ONE shared tick schedule: a tick at T_C and every TUNE.tick s while the phase's time is under 6 (12 ticks); each tick hits each
   living enemy once if it stands in the visible fire (the trail's field: the same per-cell strengths the floor's fire is drawn
   with, at the tick's scheduled time, its value at the enemy (or within half its radius) at least TUNE.burnMin); a Map of the
   beat's hits, so overlapping parts and pictures never add a second hit. A tick TUNE.tickK DK (0.5, v450 0.45: a roaming serpent catches
   fewer enemies each tick than v450's coil did, so the tick is a little higher; a monster it keeps catching takes about v450's
   coil total), the finisher TUNE.finK DK at T_X on every enemy in the blast's footprint (TUNE.RX x the tier, cut by walls),
   the cast's largest hit: at most 12 x 0.5 + 7.0 = 13 DK (an enemy the fire never leaves), typically 9..12 DK one it keeps catching (v450: 12.4), under
   Apocalypse's single 11 DK blast plus its fireworks for the whole room (it stays "the strongest fire there is"). The rising and
   diving serpent deals no other hit. The beats run from the timeline in order whatever the frame step (dt 1/60 or 1/4 give the
   same hits); the path is built once at the cast from a seed of the cast's own place (no frame-time input). Enemies only
   (X.hitMon); no displacement or control on a boss (the finisher's knock-back is for the others only), bosses take the damage.
   Tiers by the pet's stage (Base 1-3, Adept 4-6, Celestial 7): the fire's width and the blast's radius x TUNE.RK (1, +15%, +30%);
   the body grows with it and roams a little faster and wider; Celestial: richer crests (five a side), a grander burst.
   The six seconds and the 30 s cooldown are the same at every tier.
   Footprint: the fire is drawn as cells 0.8 tiles apart on the walkable, reachable floor (tent-weighted: one seamless sheet,
   FGFX 353), each with its own strength in time; an enemy is hit where that fire is. The blast's cells (FGFX 355) cover the
   floor within its radius that rays from the impact reach (nothing past a wall). Fire, ring and cracks are pictures only: no
   tile, collision or navigation changes. World offsets are drawn true to the game's floor (a tile is square on screen), so the
   serpent, its fire and the enemies it weaves among line up.
   Light: on the GPU painter (FGFX kinds 352 the ring of embers, 353 the trail's fire, 354 the burst's fireball, 355 the blast
   across the floor, 356 the fire rising off the serpent's skin (a sheath of flame along the body, tent-weighted segments: one
   continuous aura), 358 the mushroom of fire; and the shared 3 (fire balls), 9 (smoke), 301 (embers), 303 (jets), 304 (debris
   streaks); the SF-FX block in 20k6h), the floor's fire under every warning (the 'floor' pass), the body's glow, its aura and
   the burst over everything with the pet's face kept clear; without it the fire kit's 2D pictures and a painted glow. The
   serpent's parts over the pet or over an enemy's warning are drawn see-through. Particles (embers, debris, scales) are few,
   pooled in the cast and bounded, thinned by Fewer effects; hits never are.
   Clean-up: everything lives in one ELEM effect: it ends with the timeline, at once (a quick dissolve) when the caster is downed
   or the game is over, and goes with the stage (its GPU buffers freed by the stage's end: 20b destroy). No timers are scheduled
   outside it. */
(() => {
  const U = ELEM_IMPL.fire.ult, TAU = Math.PI * 2;
  /* every timing, radius, count and multiplier (the six seconds and the 30 s cooldown are the user's fixed values; the cooldown is the row's in 20k1) */
  const TUNE = {
    cd: 30, coil: 6.0,
    gesture: 0.5,          // the pet's cast pose (s)
    ring: 0.5,             // the ring of embers opens before the head surges through (s)
    form: 1.35,            // the body pours out of the ring (s): fully formed at ring + form
    climb: 0.9, plunge: 0.8,             // the last part of the six seconds: the climb into the sky and the plunge (s); the roam is the rest (4.3 s)
    tick: 0.5, tickK: 0.5, finK: 7.0,    // the burn's ticks (every 0.5 s while the phase's time < 6) and the finisher, in DK
    burnMin: 0.35,         // the fire's strength (the drawn field, 0..1) an enemy must stand in for a tick to hit it
    R: 3.6, RK: [1, 1.15, 1.3],          // the serpent's scale (tiles) and the tiers' growth: Base, Adept, Celestial
    lenK: 4.4,             // the body's length, x R
    rad: 0.7, radK: [1, 1.06, 1.12],     // its girth (tiles) by tier
    RX: 4.0,               // the blast's radius (tiles, x RK; v450's fireball 3.6)
    trailW: 1.2,           // the fire's half width round the path (tiles, x RK)
    fade: 1.7,             // the fire fades over this after the tail has passed (s)
    spread: 7,             // the fire runs out from under the body this fast (tiles/s)
    vR: 7.6,               // the head's speed roaming (tiles/s; +10% a tier)
    turnR: 1.45,           // its turning circle (tiles, x RK)
    weave: [0.5, 6.5],     // the S-curves laid over its course: amplitude (radians), wavelength (tiles)
    hop: 5.0,              // the preferred distance between its way-points (tiles)
    loopR: 1.9, loopP: 0.35,             // a loop round a crowd: its radius (tiles), the chance at a crowded way-point
    area: [5.0, 8.0],      // the roaming area's half extents round the pet and the aim (tiles; the phone's view is about 4.5 x 9.5; +8% a tier)
    lead: 3.2,             // the climb begins this far short of the target (tiles)
    skyZ: 15,              // the climb's height (tiles: off the top of the screen)
    burstT: 0.3,           // the shock front reaches the blast's edge (s)
    heatT: 2.0,            // the cracked ground cools (s)
    colT: 1.5,             // the mushroom of fire rises and cools (s)
    linger: 2.0,           // embers and heat shimmer after the blast (s, no damage)
    jets: [7, 9, 12], debris: [14, 18, 26], scales: [6, 8, 10],   // the burst's jets of flame, molten debris and flung scales by tier (Fewer effects: x 0.6)
    zoom: 0.92,            // the small pull back while it roams (1: none)
    shake: [3, 8],         // the surge's and the blast's shake
    cell: 0.8,             // the fire's cells (tiles apart)
  };
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const eo = u => 1 - (1 - cl(u)) * (1 - cl(u)), eio = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const tierOf = ev => (ev >= 7 ? 2 : ev >= 4 ? 1 : 0);
  const NSL = () => SNAKEFLAME_GL.NSL;
  const dimsOf = tier => { const R = TUNE.R * TUNE.RK[tier], LB = TUNE.lenK * R, RM = TUNE.rad * TUNE.radK[tier]; return { R, LB, RM, SL: LB / NSL(), RX: TUNE.RX * TUNE.RK[tier], TW: TUNE.trailW * TUNE.RK[tier] }; };
  const fg = () => { try { if (typeof window !== 'undefined' && window.__SF_FX === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const STAT = { casts: 0, ticks: 0, fin: 0, last: null };   // (tests read these: the last cast's beats)
  let BLOB = null;   // (a soft shadow, made once)
  const blob = () => { if (BLOB) return BLOB; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(12,4,2,0.9)'); gr.addColorStop(0.55, 'rgba(12,4,2,0.45)'); gr.addColorStop(1, 'rgba(12,4,2,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (BLOB = cv); };
  /* the painter's colours carry a few values to its shaders (quantised: a bounded set of strings) */
  const HX = n => (n < 16 ? '0' : '') + n.toString(16), q6 = v => HX(Math.round(cl(v) * 63) * 4 + 2), q5 = v => HX(Math.round(cl(v) * 31) * 8 + 4);
  const COLR = []; for (let k = 0; k < 64; k++) COLR.push('#' + HX(k * 4 + 2) + '0000');
  const colR = v => COLR[Math.round(cl(v) * 63)];
  const angd = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

  /* the fire rising off the serpent's skin (FGFX 356): one sheath of flame along the body, tent-weighted stretches between its
     points (every other one under Fewer effects); o: { glow, al, SL (the points' spacing, tiles), low, fade(p) } (the studio sheets use it too) */
  function aura(Q, V, Rg, T, o) { const sp = Rg.spine, n = sp.length, stp = o.low ? 2 : 1, gl = o.glow, SL = o.SL, pts = sp.map(s => SNAKEFLAME_GL.toS(V, s.p)), heat = Math.min(3, Math.max(0, gl - 0.6) * 1.1);
    for (let j = 0; j < n; j += stp) { const s = sp[j]; if (s.p[2] + s.r < -0.05) continue; const jp = Math.max(0, j - stp), jn = Math.min(n - 1, j + stp), k2 = jn - jp || 1, P0 = pts[jp], P1 = pts[jn];
      let ax = (P1[0] - P0[0]) * stp / k2, ay = (P1[1] - P0[1]) * stp / k2; if (Math.hypot(ax, ay) < 0.5) { ax = T * 0.3; ay = 0; }
      const Lq = Math.hypot(ax, ay), nx = -ay / Lq, ny = ax / Lq, W = s.r * T * (2.05 + 0.2 * Math.min(2, gl - 1)) + T * 0.14, rb = Math.min(0.9, s.r * T / W), upk = -ny;
      const end = j < 2 ? 0.55 + 0.2 * j : j > n - 4 ? Math.max(0.2, (n - j) / 4) : 1, sub = cl((s.p[2] + s.r) / Math.max(0.05, s.r * 1.2)), a = 0.85 * o.al * end * sub * (o.fade ? o.fade(s.p) : 1);
      if (a > 0.01) Q.quad(356, pts[j][0], pts[j][1], ax, ay, nx * W, ny * W, '#FFFFFF', a, 50 + Math.round(upk * 50) + rb * 0.99, j * SL, Math.floor(heat * 20) + Math.min(0.99, SL * stp)); } }
  U.snakeflame = (C, h) => {
    const H = h, K = FK.bind(H), PAL = FK.P, me = H.me, ev = K.evo(C), tier = tierOf(ev), dm = dimsOf(tier), R = dm.R, LB = dm.LB, RM = dm.RM, RX = dm.RX, TW = dm.TW;
    const DK = C.base * C.K * K.evoK(C), tickD = DK * TUNE.tickK, finD = DK * TUNE.finK;
    const T_R = TUNE.ring, T_C = T_R + TUNE.form, T_X = T_C + TUNE.coil, T_P = T_X - TUNE.plunge, T_CL = T_P - TUNE.climb, T_END = T_X + TUNE.linger;
    const key = 't' + tier, dims = { SL: dm.SL, RM }, GYM = SNAKEFLAME_GL.GY, ZK = SNAKEFLAME_GL.ZK;
    me.castT = me.castM = TUNE.gesture;   // (a short gesture: the pose only; the controls were never taken)
    H.X.banner('SNAKE FLAME', '', C.col, 1.4); H.X.sfx.hum();
    if (SNAKEFLAME_GL.usable()) SNAKEFLAME_GL.ensure(key, dims);   // (built now if the idle time has not: the meshes are reused by every later cast)

    /* ---- the arena. ok: walkable and reachable floor; wall: solid (gaps are not walls: it may fly over them) ---- */
    const ok = (x, y) => { try { if (H.X.blocked(x, y, 0.05, 0)) return false; const f = H.X.flowAt ? H.X.flowAt(x, y) : 0; return f < 9999; } catch (e) { return true; } };
    const wall = (x, y, r) => { try { return H.X.blocked(x, y, r, 1); } catch (e) { return false; } };
    let cx, cy; { const p = H.walk(C.tx, C.ty); cx = p.x; cy = p.y;
      // moved half way toward the middle of the open floor within the blast's radius (an aim by a wall still gets its burst)
      let sx = 0, sy = 0, n = 0; for (let gy = -RX; gy <= RX; gy += 0.6) for (let gx = -RX; gx <= RX; gx += 0.6) if (gx * gx + gy * gy <= RX * RX && ok(cx + gx, cy + gy)) { sx += gx; sy += gy; n++; }
      if (n > 6) { const q = H.walk(cx + sx / n * 0.5, cy + sy / n * 0.5); if (ok(q.x, q.y)) { cx = q.x; cy = q.y; } } }
    /* the seed: the cast's own place (the same cast gives the same path at any frame rate) */
    let rs = ((Math.round(cx * 8) * 73856093) ^ (Math.round(cy * 8) * 19349663) ^ (Math.round(me.x * 4) * 83492791) ^ (Math.round(me.y * 4) * 2971215073) ^ (tier * 1013)) >>> 0;
    const rnd = () => { rs = (rs + 0x6D2B79F5) >>> 0; let x = rs; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    /* the blast's reach: rays from the impact (nothing past a wall) */
    const NR = 48, reach = new Float32Array(NR);
    for (let i = 0; i < NR; i++) { const a = i / NR * TAU, ca = Math.cos(a), sa = Math.sin(a); let d = 0.2; while (d < RX + 0.5 && ok(cx + ca * d, cy + sa * d)) d += 0.2; reach[i] = Math.min(RX + 0.5, d - 0.1); }
    const reachAt = a => { let f = ((a / TAU) % 1 + 1) % 1 * NR; const i = Math.floor(f) % NR, j = (i + 1) % NR; f -= Math.floor(f); return lerp(reach[i], reach[j], f); };
    const inFootX = (x, y, pad) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy); return d < RX + (pad || 0) && d < reachAt(Math.atan2(dy, dx)) + 0.25 + (pad || 0); };

    /* ---- the path (world offsets from the impact point (cx, cy), z up). The head steers like a creature: toward way-points chosen
       across the roaming area (drawn to the enemies, to floor it has not yet burned, alternating sides: S-curves), a turning
       circle, a weave laid over its course, a loop round a crowd now and then, walls felt ahead and never entered; near the end it
       homes on the target, then climbs and plunges (two Hermite arcs: up and over, then head-first down), and goes on into the
       ground below the impact ---- */
    const area = [TUNE.area[0] * (1 + 0.08 * tier), TUNE.area[1] * (1 + 0.08 * tier)], gcx = lerp(me.x, cx, 0.5), gcy = lerp(me.y, cy, 0.5);
    const vR = TUNE.vR * (1 + 0.1 * tier), turnR = TUNE.turnR * TUNE.RK[tier], S1need = LB + vR * (T_CL - T_C);
    const foes = H.living().filter(m => Math.abs(m.x - gcx) < area[0] + 3 && Math.abs(m.y - gcy) < area[1] + 3).map(m => [m.x, m.y]);
    const cand = []; for (let gy = -area[1]; gy <= area[1] + 1e-6; gy += 1) for (let gx = -area[0]; gx <= area[0] + 1e-6; gx += 1) { if ((gx / area[0]) ** 2 + (gy / area[1]) ** 2 > 1.05) continue; const x = gcx + gx + (rnd() - 0.5) * 0.5, y = gcy + gy + (rnd() - 0.5) * 0.5; if (ok(x, y) && !wall(x, y, 0.75)) cand.push([x, y]); }
    const dens = (x, y) => { let s = 0; for (const f of foes) { const d2 = (f[0] - x) ** 2 + (f[1] - y) ** 2; if (d2 < 16) s += Math.exp(-d2 / 2.9); } return s; };
    const lineOK = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(L / 0.3); for (let i = 1; i <= n; i++) { const u = i / n; if (wall(lerp(x0, x1, u), lerp(y0, y1, u), 0.35)) return false; } return true; };
    const flowOf = (x, y) => { try { return H.X.flowAt ? H.X.flowAt(x, y) : 9999; } catch (e) { return 9999; } };
    const flowDir = (x, y) => { let ba = null, bv = flowOf(x, y); if (bv >= 9999) return null; for (let k = 0; k < 8; k++) { const a = k * TAU / 8, v = flowOf(x + Math.cos(a), y + Math.sin(a)); if (v < bv) { bv = v; ba = a; } } return ba; };
    const freeLen = (x, y, a) => { const ca = Math.cos(a), sa = Math.sin(a); let d = 0.25; while (d < 3 && !wall(x + ca * d, y + sa * d, 0.42)) d += 0.25; return d; };
    const PW = [[cx, cy]], visited = [[cx, cy]], WPS = [];
    { let x = cx, y = cy, s = 0, th = Math.atan2(cy - me.y, cx - me.x), wp = null, wpS = 0, wpL = 0, lastTurn = rnd() < 0.5 ? 1 : -1, homing = false, loopLeft = 0, loopSg = 1, guard = 0, homeFD;
      const ph = rnd() * TAU, ds = 0.1;
      const pick = () => { const dx = Math.cos(th), dy = Math.sin(th), sc = [];
        for (const p of cand) { const ex = p[0] - x, ey = p[1] - y, d = Math.hypot(ex, ey); if (d < 2.2) continue; let cov = 9; for (const v of visited) { const q = Math.hypot(v[0] - p[0], v[1] - p[1]); if (q < cov) cov = q; }
          const sg = Math.sign(dx * ey - dy * ex) || 1; sc.push([1.6 * dens(p[0], p[1]) + 0.45 * Math.min(cov, 6) - 0.35 * Math.abs(d - TUNE.hop) + (sg === -lastTurn ? 0.8 : 0) + rnd() * 0.6, p, sg, d]); }
        sc.sort((a, b) => b[0] - a[0]); for (let i = 0; i < Math.min(sc.length, 30); i++) { const c = sc[i]; if (lineOK(x, y, c[1][0], c[1][1])) { lastTurn = c[2]; return c; } } return sc.length ? sc[0] : null; };
      while (s < S1need && guard++ < 6000) {
        const rem = S1need - s, dT = Math.hypot(cx - x, cy - y), aT = Math.atan2(cy - y, cx - x);
        if (!homing && s > LB * 0.5 && rem <= Math.max(0, dT - TUNE.lead) + turnR * Math.abs(angd(aT, th)) + 0.6) { homing = true; loopLeft = 0; }
        if (!homing && loopLeft <= 0 && (!wp || Math.hypot(wp[1][0] - x, wp[1][1] - y) < 1.3 || s - wpS > wpL * 2.2 + 4)) {
          if (wp && s - wpS <= wpL * 2.2 + 4 && dens(wp[1][0], wp[1][1]) > 0.8 && rnd() < TUNE.loopP && rem > TUNE.loopR * TAU + 8) { loopLeft = TUNE.loopR * TAU; loopSg = rnd() < 0.5 ? 1 : -1; }
          wp = pick(); wpS = s; wpL = wp ? wp[3] : 0; if (wp) WPS.push([+wp[1][0].toFixed(2), +wp[1][1].toFixed(2), +s.toFixed(1), loopLeft > 0 ? 1 : 0]); }
        let desired;
        if (loopLeft > 0) { desired = th + loopSg * 1.2; loopLeft -= ds; }
        else if (homing) desired = dT > TUNE.lead * 0.7 ? aT + 0.15 * Math.sin(TAU * s / TUNE.weave[1] + ph) : th;
        else desired = (wp ? Math.atan2(wp[1][1] - y, wp[1][0] - x) : th) + TUNE.weave[0] * Math.sin(TAU * s / TUNE.weave[1] + ph);
        // (strayed out of the area, say down a corridor: back toward its middle, turning about where it must; the view stays on it)
        // (the way back follows the floor's own walking field toward the pet when a wall stands between: no dead ends)
        const stray = ((x - gcx) / area[0]) ** 2 + ((y - gcy) / area[1]) ** 2 > 1.0; if (stray && loopLeft <= 0) { const fd = flowDir(x, y); desired = fd != null ? fd : homing ? aT : Math.atan2(gcy - y, gcx - x); }
        else if (homing && dT > TUNE.lead * 0.7) { if (s % 1 < ds || homeFD === undefined) homeFD = lineOK(x, y, cx, cy) ? null : flowDir(x, y); if (homeFD != null) desired = homeFD; }
        // walls felt ahead: turn toward the freer side
        if (!stray && (wall(x + Math.cos(th) * 1.0, y + Math.sin(th) * 1.0, 0.45) || wall(x + Math.cos(th) * 1.9, y + Math.sin(th) * 1.9, 0.45))) { const l = freeLen(x, y, th + 0.7), r = freeLen(x, y, th - 0.7); desired = th + (l >= r ? 1.3 : -1.3); }
        const kmax = ds / (loopLeft > 0 ? TUNE.loopR : stray ? turnR * 0.5 : turnR); th += Math.max(-kmax, Math.min(kmax, angd(desired, th)));
        const clr = wall(x, y, 0.42) ? 0.12 : 0.42; let nx = x + Math.cos(th) * ds, ny = y + Math.sin(th) * ds;
        if (wall(nx, ny, clr)) { let done = false; const pref = angd(desired, th) >= 0 ? 1 : -1;
          for (let k = 1; k <= 21 && !done; k++) for (const sg of [pref, -pref]) { const t2 = th + sg * k * 0.15, x2 = x + Math.cos(t2) * ds, y2 = y + Math.sin(t2) * ds; if (!wall(x2, y2, clr)) { th = t2; nx = x2; ny = y2; done = true; break; } }
          if (!done) { nx = x; ny = y; th += 0.3; } }
        if (nx === x && ny === y) continue;   // (boxed in: turned, not moved)
        x = nx; y = ny; s += ds; PW.push([x, y]); if (PW.length % 10 === 0) visited.push([x, y]); } }
    // smoothed (a point the smoothing would put into a wall keeps its place)
    for (let pass = 0; pass < 3; pass++) for (let i = 3; i < PW.length - 3; i++) { const x = (PW[i - 2][0] + PW[i - 1][0] * 2 + PW[i][0] * 2 + PW[i + 1][0] * 2 + PW[i + 2][0]) / 8, y = (PW[i - 2][1] + PW[i - 1][1] * 2 + PW[i][1] * 2 + PW[i + 1][1] * 2 + PW[i + 2][1]) / 8; if (!wall(x, y, 0.3)) PW[i] = [x, y]; }
    const NW = PW.length;
    // over a gap it lifts and flies (no fire there)
    const gapF = PW.map(p => (!ok(p[0], p[1]) && !wall(p[0], p[1], 0.05) ? 1 : 0)), zl = new Float32Array(NW);
    for (let i = 0; i < NW; i++) { let a = 0, n = 0; for (let k = -12; k <= 12; k++) { const j = i + k; if (j >= 0 && j < NW) { a += gapF[j]; n++; } } zl[i] = 1.2 * Math.min(1, 1.6 * a / n) * sstep(0, 12, i); }
    const QX = [], QY = [], QZ = [], FLO = []; for (let i = 0; i < NW; i++) { QX.push(PW[i][0] - cx); QY.push(PW[i][1] - cy); QZ.push(zl[i]); FLO.push(gapF[i] ? 0 : 1); }
    const iE = QX.length - 1;
    // the climb and the plunge: E (the roam's end) up and over to the apex A, then head-first down onto the target (0, 0)
    { const ex = QX[iE], ey = QY[iE], ez = QZ[iE], hx0 = ex - QX[Math.max(0, iE - 6)], hy0 = ey - QY[Math.max(0, iE - 6)], hl = Math.hypot(hx0, hy0) || 1, hx = hx0 / hl, hy = hy0 / hl, dE = Math.hypot(ex, ey);
      const dx = dE > 1.5 ? -ex / dE : hx, dy = dE > 1.5 ? -ey / dE : hy, Z = TUNE.skyZ, ax = -dx * 1.6, ay = -dy * 1.6;
      const herm = (P0, M0, P1, M1, u) => { const u2 = u * u, u3 = u2 * u, a = 2 * u3 - 3 * u2 + 1, b = u3 - 2 * u2 + u, c = -2 * u3 + 3 * u2, d = u3 - u2; return [0, 1, 2].map(k => a * P0[k] + b * M0[k] + c * P1[k] + d * M1[k]); };
      const A0 = [ex, ey, ez], A1 = [ax, ay, Z], MA = [dx * 7, dy * 7, 0];
      for (let i = 1; i <= 80; i++) { const p = herm(A0, [hx * 6, hy * 6, Z * 1.4], A1, MA, i / 80); QX.push(p[0]); QY.push(p[1]); QZ.push(p[2]); FLO.push(p[2] < 0.35 ? 1 : 0); }
      const M1 = [dx * 2.2, dy * 2.2, -Z * 1.6]; for (let i = 1; i <= 60; i++) { const p = herm(A1, MA, [0, 0, 0], M1, i / 60); QX.push(p[0]); QY.push(p[1]); QZ.push(p[2]); FLO.push(0); }
      const ml = Math.hypot(M1[0], M1[1], M1[2]); for (let i = 1; i <= 40; i++) { const k = (LB + 4) * i / 40 / ml; QX.push(M1[0] * k); QY.push(M1[1] * k); QZ.push(M1[2] * k); FLO.push(0); } }
    const NP = QX.length, SA = new Float32Array(NP); for (let i = 1; i < NP; i++) SA[i] = SA[i - 1] + Math.hypot(QX[i] - QX[i - 1], QY[i] - QY[i - 1], QZ[i] - QZ[i - 1]);
    const S1 = SA[iE], S2 = SA[iE + 80], S3 = SA[iE + 140], SN = SA[NP - 1];
    const idxAt = s => { let lo = 0, hi = NP - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (SA[m] <= s) lo = m; else hi = m; } return lo; };
    const P3 = s => { if (s <= 0) return [0, 0, s - 0.15]; if (s >= SN) return [QX[NP - 1], QY[NP - 1], QZ[NP - 1]]; const i = idxAt(s), u = (s - SA[i]) / Math.max(1e-6, SA[i + 1] - SA[i]); return [lerp(QX[i], QX[i + 1], u), lerp(QY[i], QY[i + 1], u), lerp(QZ[i], QZ[i + 1], u)]; };
    /* the head's arc length at time t: up the shaft and out (the body pouring after it), the roam's speed, the climb and the plunge (speeding up, each from the speed before it), on into the ground */
    const vF = LB / TUNE.form, vRe = Math.max(0.5, (S1 - LB) / (T_CL - T_C)), Lc = S2 - S1, Lp = S3 - S2;
    // (an eased arc each: g(0) 0, g(1) 1, its slopes at the ends k0, k1 (x the arc / the time): the climb leaves at the roam's speed, bursts upward and slows as it turns over; the plunge falls faster and faster)
    const ez = (k0, k1) => u => ((k0 + k1 - 2) * u + (3 - 2 * k0 - k1)) * u * u + k0 * u;
    const kC0 = Math.min(1.5, vRe * TUNE.climb / Lc), gC = ez(kC0, 0.6), kP0 = Math.min(1.5, 0.6 * Lc / TUNE.climb * TUNE.plunge / Lp), gP = ez(kP0, 2.0), vEnd = 2.0 * Lp / TUNE.plunge;
    const sHead = t => { if (t < T_C) return vF * (t - T_R); if (t < T_CL) return LB + vRe * (t - T_C); if (t < T_P) return S1 + Lc * gC((t - T_CL) / TUNE.climb);
      if (t < T_X) return S2 + Lp * gP((t - T_P) / TUNE.plunge); return S3 + vEnd * (t - T_X); };
    const tOfS = s => { let a = T_R - 2, b = T_END + 4; if (sHead(b) < s) return 1e9; for (let i = 0; i < 44; i++) { const m = (a + b) / 2; if (sHead(m) < s) a = m; else b = m; } return b; };

    /* ---- the fire on the floor: cells 0.8 tiles apart; each burns from when the head passes near it (spreading out from under
       the body) until the tail has gone (+ fade). One strength function serves the drawing and the damage ---- */
    const CS = TUNE.cell, CELLS = [], CM = new Map(), ck = (i, j) => (i + 1024) * 4096 + (j + 1024);
    { const okc = new Map(); for (let s = 0.1; s < S1 + 2.5; s += 0.2) { const i0 = idxAt(s); if (!FLO[i0] || !FLO[Math.min(NP - 1, i0 + 1)]) continue; const p = P3(s); if (p[2] > 0.35) continue;
        const tH = tOfS(s), tT = tOfS(s + LB), gi0 = Math.floor((p[0] - TW) / CS), gi1 = Math.ceil((p[0] + TW) / CS), gj0 = Math.floor((p[1] - TW) / CS), gj1 = Math.ceil((p[1] + TW) / CS);
        for (let gj = gj0; gj <= gj1; gj++) for (let gi = gi0; gi <= gi1; gi++) { const ox = gi * CS, oy = gj * CS, d = Math.hypot(ox - p[0], oy - p[1]); if (d > TW) continue; const kk = ck(gi, gj);
          let good = okc.get(kk); if (good == null) { good = ok(cx + ox, cy + oy); okc.set(kk, good); } if (!good) continue;
          let cel = CM.get(kk); if (!cel) { cel = { ox, oy, iv: [], ang: 0, sd: rnd() }; CM.set(kk, cel); CELLS.push(cel); }
          const a = tH + d / TUNE.spread, b = tT + 0.15 + d / TUNE.spread * 0.5, L = cel.iv[cel.iv.length - 1];
          if (L && a <= L[1] + 0.25) { if (b > L[1]) L[1] = b; if (a < L[0]) L[0] = a; } else { cel.iv.push([a, b]); const q = P3(s + 0.3); cel.ang = Math.atan2(q[1] - p[1], q[0] - p[0]); } } } }
    const consume = t => 1 - sstep(T_X, T_X + 0.6, t);   // (the blast swallows what is left of the trail)
    const cellStr = (cel, t) => { let v = 0; for (const iv of cel.iv) { let w; if (t < iv[0] - 0.15) w = 0; else if (t < iv[0]) w = (t - iv[0] + 0.15) / 0.15; else if (t <= iv[1]) w = 1 + 0.5 * Math.exp(-(t - iv[0]) * 5); else w = 1 - (t - iv[1]) / TUNE.fade; if (w > v) v = w; } return v * consume(t); };
    const fieldAt = (x, y, t) => { const gx = (x - cx) / CS, gy = (y - cy) / CS, i0 = Math.floor(gx), j0 = Math.floor(gy), fx = gx - i0, fy = gy - j0; let v = 0;
      for (let dj = 0; dj <= 1; dj++) for (let di = 0; di <= 1; di++) { const cel = CM.get(ck(i0 + di, j0 + dj)); if (!cel) continue; v += (di ? fx : 1 - fx) * (dj ? fy : 1 - fy) * Math.min(1, cellStr(cel, t)); } return v; };
    const fieldM = (m, t) => { const r = (m.r || 0.4) * 0.5; return Math.max(fieldAt(m.x, m.y, t), fieldAt(m.x + r, m.y, t), fieldAt(m.x - r, m.y, t), fieldAt(m.x, m.y + r, t), fieldAt(m.x, m.y - r, t)); };
    /* the blast's cells (its footprint on the floor: within the radius, as far as the rays reach) */
    const BC = []; { const N = Math.ceil((RX + 0.4) / CS); for (let gy = -N; gy <= N; gy++) for (let gx = -N; gx <= N; gx++) { const ox = gx * CS, oy = gy * CS, d = Math.hypot(ox, oy); if (d > RX + 0.45) continue; if (d > reachAt(Math.atan2(oy, ox)) + 0.2) continue; if (!ok(cx + ox, cy + oy) && d > 0.3) continue; BC.push([ox, oy]); } }
    /* the burst's pieces (cosmetic): the jets along radial cracks, the sky trail's puffs */
    const JETS = []; { const nJ = Math.max(3, Math.round(TUNE.jets[tier] * (lowFx() ? 0.6 : 1))), ph = rnd() * TAU;
      for (let w = 0; w < (tier >= 2 ? 2 : 1); w++) for (let i = 0; i < nJ; i++) { const b = ph + (i + 0.5 * w + (rnd() - 0.5) * 0.5) / nJ * TAU, re = Math.min(RX, reachAt(b)), rj = re * (w ? 0.75 + 0.2 * rnd() : 0.32 + 0.4 * rnd()), x = Math.cos(b) * rj, y = Math.sin(b) * rj;
        if (rj < 0.6 || !ok(cx + x, cy + y)) continue; const u = 1 - Math.sqrt(Math.max(0, 1 - rj / RX)); JETS.push({ x, y, t0: u * TUNE.burstT + w * 0.22 + rnd() * 0.05, h: (1.6 + 1.1 * rnd()) * (1 + 0.12 * tier), w: 0.32 + 0.12 * rnd(), sd: rnd() * 9 }); } }
    const PUFF = []; for (let s = S1 + 1.2; s < S3 - 1; s += 1.7) PUFF.push({ s, tH: tOfS(s), tT: tOfS(s + LB * 0.85), sd: rnd() * 9 });
    const prof = SNAKEFLAME_GL.prof, hs = RM / 0.6 * 1.22;

    /* ---- the state: one timeline, its beats (ticks, the finisher), the pose of this moment ---- */
    const S = { tk: 0, fin: false, dead: -1, hitsT: 0, hitsF: 0, pulse: -9, lastTick: -9, cast: ++STAT.casts, log: [], zoomOurs: false, deb: [], scl: [] };
    STAT.last = S; Object.assign(S, { R, RX, TW, inFootX, fieldAt, fieldM, tier, T_C, T_X, T_CL, T_P, cx, cy, cells: CELLS.length, bcells: BC.length, tickD, finD, DK, S1, S2, S3, LB, jets: JETS.length });
    S.headAt = t => P3(sHead(t)).map((v, i) => (i === 0 ? v + cx : i === 1 ? v + cy : v));
    S.floorPath = () => { const o = []; for (let i = 0; i <= iE; i++) o.push([QX[i] + cx, QY[i] + cy, QZ[i], FLO[i]]); return o; };
    S.area = { x: gcx, y: gcy, ax: area[0], ay: area[1] }; S.wps = WPS; S.seedIn = [cx, cy, me.x, me.y, foes.length, cand.length];
    let F = null;
    /* one beat: every living enemy in the fire once (Map: overlapping parts and pictures never add a second hit) */
    function beat(kind, tt) { const hits = new Map(), dmg = kind === 'fin' ? finD : tickD;
      for (const m of H.living()) { if (hits.has(m)) continue; if (kind === 'fin' ? !inFootX(m.x, m.y, m.r * 0.5) : fieldM(m, tt) < TUNE.burnMin) continue; hits.set(m, 1);
        H.X.hitMon(m, dmg, C.dmgO(kind === 'fin' ? (m.boss ? {} : { kb: 3 }) : {})); }
      S.log.push([kind, Math.round(tt * 1000) / 1000, hits.size]); if (kind === 'fin') { S.hitsF += hits.size; STAT.fin++; } else { S.hitsT += hits.size; STAT.ticks++; } return hits.size; }
    /* the pose at time t (also the fade over the pet and the warnings): { pt(d) in the model's space (y / GY: the game's floor drawn true), glow, ... } */
    const warns = () => (H.X.zones || []).filter(z => z.kind === 'warn' && z.own !== 'pet');
    const overWarn = (z, x, y, pad) => { const dx = x - z.x, dy = y - z.y; if (z.shape === 'line' || z.shape === 'cone') { const ca2 = Math.cos(z.a || 0), sa2 = Math.sin(z.a || 0), al = dx * ca2 + dy * sa2, of = -dx * sa2 + dy * ca2, L = z.len || 1;
        if (al < -pad || al > L + pad) return false; return z.shape === 'line' ? Math.abs(of) < (z.w || 1) / 2 + pad : Math.abs(of) < Math.tan(Math.min(1.5, z.spread || 0.5)) * Math.max(0, al) + pad; }
      return Math.hypot(dx, dy) < (z.r || 1) + pad; };
    let WZ = []; const fadeAt = p => { const wx = cx + p[0], wy = cy + p[1] * GYM, dx = wx - me.x, dys = (wy - me.y) - p[2] * ZK, r = RM * 0.8; let a = 1;
      if (!me.dead && Math.abs(dx) < 0.42 + r * 0.6 && dys > -1.05 - r * 0.5 && dys < 0.2 + r * 0.4) a = 0.45;   // (over the pet's sprite: see-through, the player's view kept)
      if (p[2] < 2.5) for (const z of WZ) if (overWarn(z, wx, wy, r + 0.2)) { a = Math.min(a, 0.5); break; }   // (over an enemy's warning: its own shape)
      return a; };
    function pose(t) {
      const sH = sHead(t), climbK = cl((t - T_CL) / TUNE.climb), dive = cl((t - T_P) / TUNE.plunge), wh = eio((t - (T_X - 0.3)) / 0.3), formK = cl((t - T_R) / TUNE.form);
      const raise = 0.95 * hs * (1 + 0.45 * (1 - formK) * cl((t - T_R) * 3)) * (1 - sstep(S1, S1 + 2.5, sH));
      return { k: tier, RM, LB, t, glow: 1.15 + 0.3 * climbK + 1.5 * eio(dive) + S.pulseK, glow2: 0.6 * wh, spill: cl((t - T_X - 0.02) / 0.45), shrink: 1, jaw: 0.12 + 0.12 * Math.sin(t * 2.3) * (1 - dive) + 0.75 * eio(dive * 1.4), pitch: 0.22 * (1 - climbK), fin: 1 + 0.3 * dive, fade: fadeAt,
        pt: d => { const s = sH - d, u = d / LB; if (s <= 0) return [0, 0, s - 0.15]; const p = P3(s), wf = 1 - sstep(S1, S1 + 3, s);
          const z = p[2] + (RM * prof(u) * 0.92 + 0.04 + 0.13 * Math.sin(s * 0.9 + t * 1.6) * sstep(0, 2, s)) * sstep(0, 1.0, s) * wf + (d < 2.2 ? raise * Math.pow(1 - d / 2.2, 2) : 0);
          return [p[0], p[1] / GYM, z]; } };
    }
    S.pulseK = 0;
    /* ---- the update: the authoritative clock ---- */
    function update(dt, f) {
      const t = f.t, g = H.g;
      if (S.dead < 0 && (me.dead || g.over)) { S.dead = t; f.life = Math.min(f.life, 0.6); if (S.zoomOurs && g.zoomP === TUNE.zoom) g.zoomT = Math.min(g.zoomT || 0, 0.05); }   // (the caster downed, the game over: a quick dissolve, no more damage)
      if (S.dead < 0) {
        // the beats, in order, from the timeline: the ticks while the phase's time is under 6, then the finisher at exactly 6
        while (S.tk < Math.round(TUNE.coil / TUNE.tick) && t >= T_C + S.tk * TUNE.tick - 1e-6 && S.tk * TUNE.tick < TUNE.coil - 1e-6) { beat('tick', T_C + S.tk * TUNE.tick); S.lastTick = T_C + S.tk * TUNE.tick; S.tk++; }
        if (!S.fin && t >= T_X - 1e-6) { S.fin = true; beat('fin', T_X); blastFx(); }
        // the camera: a small pull back while it roams (the game gives it back when zoomT runs out: nothing to undo if this ends early)
        if (TUNE.zoom !== 1 && t > TUNE.gesture && t < T_X + 0.8 && (g.zoomP === 1 || g.zoomP === TUNE.zoom)) { g.zoomP = TUNE.zoom; g.zoomT = Math.max(g.zoomT || 0, 0.12); S.zoomOurs = true; }
        if (!S.surged && t >= T_R) { S.surged = true; H.X.shake(TUNE.shake[0], 0.25); H.X.sfx.whoosh(); K.embers(cx, cy, 8, { v: 3, up: 3 }); }
        if (!S.coiled && t >= T_C) { S.coiled = true; H.X.sfx.hum(); }
        if (!S.rose && t >= T_CL) { S.rose = true; H.X.sfx.whoosh(); }
        if (!S.dove && t >= T_P) { S.dove = true; H.X.sfx.whoosh(); }
      }
      S.pulseK = Math.exp(-Math.max(0, t - S.lastTick) * 7) * 0.35;
      WZ = warns();
      // embers off the body (a few a frame, thinned by Fewer effects; more while it climbs: its trail of sparks)
      if (S.dead < 0 && t > T_R && t < T_X) { const k = dt * (t > T_CL ? 26 : 14) * H.Q(); let n = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); n = Math.min(n, 4); if (n) { const P = pose(t); while (n-- > 0) { const d = Math.random() * LB * 0.95, p = P.pt(d); if (p[2] < 0) continue;
          H.P({ kind: 'ember', x: cx + p[0] + (Math.random() - 0.5) * 0.4, y: cy + p[1] * GYM - p[2] * ZK, vx: (Math.random() - 0.5) * 1.2, vy: -0.8 - Math.random() * 1.2, g: -1.2, life: 0.6 + Math.random() * 0.5, max: 1.1, size: 2.4 + Math.random() * 1.6, color: Math.random() < 0.5 ? PAL.org : PAL.yel }); } } }
      if (t > T_X && t < T_END - 0.3 && Math.random() < 0.7 * H.Q()) { const b = Math.random() * TAU, rr = Math.sqrt(Math.random()) * RX * 0.9; if (inFootX(cx + Math.cos(b) * rr, cy + Math.sin(b) * rr)) H.P({ kind: 'ember', x: cx + Math.cos(b) * rr, y: cy + Math.sin(b) * rr, vx: (Math.random() - 0.5) * 0.6, vy: -0.6 - Math.random() * 0.8, g: -0.8, life: 0.9, max: 0.9, size: 2.2, color: Math.random() < 0.5 ? PAL.amb : PAL.org }); }
      if (t >= T_END) f.life = 0;
    }
    /* the blast: the camera's punch, sound, sparks; the pooled debris and scales (cosmetic: ballistic, from the blast's own clock) */
    function blastFx() { H.X.shake(TUNE.shake[1], 0.4); H.X.sfx.crash(); H.X.flash(0.08, '#FFB066'); H.X.hitstop && H.X.hitstop(0.05);
      K.sparks(cx, cy - 1, 22, 8); K.embers(cx, cy, 16, { v: 5, up: 4 });
      const q = lowFx() ? 0.6 : 1, nD = Math.round(TUNE.debris[tier] * q), nS = Math.round(TUNE.scales[tier] * q);
      for (let i = 0; i < nD; i++) { const b = Math.random() * TAU, v = (2.2 + Math.random() * 3.2) * (1 + 0.1 * tier); S.deb.push({ b, vx: Math.cos(b) * v, vy: Math.sin(b) * v, vz: 5 + Math.random() * 6, g: 15, t0: T_X + Math.random() * 0.08, sd: Math.random() * 9, w: 0.1 + Math.random() * 0.09 }); }
      for (let i = 0; i < nS; i++) { const b = Math.random() * TAU, v = 1.6 + Math.random() * 2.6; S.scl.push({ vx: Math.cos(b) * v, vy: Math.sin(b) * v, vz: 4 + Math.random() * 4, g: 13, t0: T_X + Math.random() * 0.05, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16, sz: 0.16 + Math.random() * 0.1 }); } }
    const ball = (o, tau) => [o.vx * tau, o.vy * tau, 0.3 + o.vz * tau - 0.5 * o.g * tau * tau];

    /* ---- drawing: the floor's fire, the rings, the shadows and the body's light on the floor (under every warning); the serpent,
       its aura, its eyes' bloom, the sky trail and the burst over everything ---- */
    const GYs = () => H.GY || 0.55;
    const gA = t => (S.dead >= 0 ? Math.max(0, 1 - (t - S.dead) / 0.5) : 1);
    const ringA = t => sstep(0, T_R, t) * (1 - sstep(T_C, T_C + 0.45, t)) * gA(t);
    const tellA = t => sstep(T_P - 0.35, T_X - 0.05, t) * (1 - sstep(T_X, T_X + 0.12, t)) * gA(t);
    const serpA = t => (S.dead >= 0 ? Math.max(0, 1 - (t - S.dead) / 0.45) : 1);
    let PZt = -1, PZ = null, RG = null;   // (the pose and rig of this frame, shared by the layers)
    const rigNow = t => { if (PZt === t && RG) return RG; PZ = pose(t); RG = SNAKEFLAME_GL.rig(PZ); PZt = t; return RG; };
    const aliveAt = (ft, sa) => ft > T_R - 0.05 && ft < T_X + 0.75 && sa > 0.01;
    function drawFloor(c, f, X, Y, T, t) {
      const ft = f.t, GY = GYs(), FG = fg(), ga = gA(ft), ra = ringA(ft), ta = tellA(ft), sa = serpA(ft), post = ft - T_X, V = { X0: X, Y0: Y, k: T };
      const Rg = aliveAt(ft, sa) ? rigNow(ft) : null, low = lowFx();
      if (Rg) { // the body's soft shadow on the floor (one cached blob each, drawn before the painter's pass: that pass then lays light only)
        const B = blob(), sh = sa * (1 - PZ.spill); if (sh > 0.01) { c.save(); for (let i = 0; i < Rg.spine.length; i += 2) { const s = Rg.spine[i], lift = Math.max(0, s.p[2] - s.r); if (s.p[2] + s.r < 0 || lift > 7) continue; const q = SNAKEFLAME_GL.toS(V, [s.p[0], s.p[1], 0]), rr = s.r * T * (1.3 + lift * 0.3);
          c.globalAlpha = Math.min(1, 0.3 * sh / (1 + lift * 0.6)); c.drawImage(B, q[0] - rr, q[1] - rr * GY, rr * 2, rr * 2 * GY); } c.restore(); } }
      const cs = CS * T, pk = 0.62 + S.pulseK * 0.3;
      if (FG) { const Q = FG.begin(c, null);
        // the fire it leaves on the floor (fading where it has been)
        if (ga > 0.01) for (const cel of CELLS) { const v = cellStr(cel, ft); if (v < 0.01) continue; Q.quad(353, X + cel.ox * T, Y + cel.oy * T, cs, 0, 0, cs, colR(v / 2), ga * pk, cel.ox, cel.oy, cel.ang); }
        if (ra > 0.01) { const op = sstep(0, T_R, ft) + 0.4 * Math.exp(-Math.max(0, ft - T_R) * 3) * (ft > T_R ? 1 : 0), rr = T * (1.5 + 0.35 * tier);
          Q.quad(352, X, Y, rr, 0, 0, rr * GY, '#FFFFFF', ra, op, ft * 1.6, 1 + 0.6 * Math.exp(-Math.abs(ft - T_R) * 4)); Q.glow(X, Y, rr * 1.4, PAL.org, 0.35 * ra, GY); }
        if (ta > 0.01) { const rr = T * (1.3 + 0.3 * tier) * (0.6 + 0.4 * ta); Q.quad(352, X, Y, rr, 0, 0, rr * GY, '#FFFFFF', ta, ta, ft * 2.6, 0.8 + 0.8 * ta); Q.glow(X, Y, rr * (1.5 + ta), PAL.amb, 0.45 * ta * ta, GY); }   // (the glow-only tell where it will strike)
        if (Rg) { // the body's light on the floor
          for (let i = 0; i < Rg.spine.length; i += 4) { const s = Rg.spine[i], lift = Math.max(0, s.p[2] - s.r); if (s.p[2] + s.r < 0 || lift > 8) continue; const q = SNAKEFLAME_GL.toS(V, [s.p[0], s.p[1], 0]); Q.glow(q[0], q[1], s.r * T * (2.6 + lift * 0.3), PAL.org, 0.18 * sa * PZ.glow * (1 - PZ.spill) / 1.6 / (1 + lift * 0.5), GY); } }
        if (post > -0.02) { // the blast across the floor: its shock front, the cracked ground burning and cooling
          const fr = eo(post / TUNE.burstT) * 1.05, heat = 1.25 * Math.max(0, 1 - post / TUNE.heatT), a = Math.min(1, 1.1 * Math.max(0, 1 - post / (TUNE.linger + 0.2))) * ga;
          if (a > 0.01) { const col = '#' + q5(fr / 1.1) + q5(heat / 1.5) + '80'; for (const b of BC) Q.quad(355, X + b[0] * T, Y + b[1] * T, cs, 0, 0, cs, col, a, b[0], b[1], RX); }
          if (post < 0.35) Q.glow(X, Y, T * RX * 1.1, PAL.amb, 0.18 * (1 - post / 0.35), GY); }
        FG.flush(c); return; }
      // ---- 2D: the fire kit's pictures ----
      if (ga > 0.01) { const n0 = low ? 2 : 1; let k = 0; for (const cel of CELLS) { const v = cellStr(cel, ft); if (v < 0.03 || (k++ % n0)) continue; K.glow(c, X + cel.ox * T, Y + cel.oy * T, cs * 1.25 * n0, cel.sd > 0.5 ? PAL.org : PAL.red, 0.42 * ga * Math.min(1.3, v) * (0.85 + 0.15 * Math.sin(t * 5 + cel.sd * 9))); } }
      if (ra > 0.01 || ta > 0.01) { const a0 = Math.max(ra, ta), rr = T * (1.5 + 0.35 * tier) * (ra > ta ? sstep(0, T_R, ft) : 0.6 + 0.4 * ta), ph = ft * (ra > ta ? 1.6 : 2.6); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a0; c.strokeStyle = H.rgba(PAL.org, 0.8); c.lineWidth = Math.max(2, T * 0.14); c.beginPath(); c.ellipse(X, Y, rr, rr * GY, 0, 0, TAU); c.stroke();
        c.fillStyle = H.rgba(PAL.yel, 0.9); for (let i = 0; i < 18; i++) { const b = i / 18 * TAU + ph; c.beginPath(); c.arc(X + Math.cos(b) * rr, Y + Math.sin(b) * rr * GY, Math.max(1, T * 0.05), 0, TAU); c.fill(); } c.restore(); K.floorLight(c, X, Y, rr, 0.5 * a0); }
      if (post > -0.02) { const heat = Math.max(0, 1 - post / TUNE.heatT), fr = eo(post / TUNE.burstT); for (const b of BC) { const d = Math.hypot(b[0], b[1]) / RX; if (d > fr + 0.05) continue; K.glow(c, X + b[0] * T, Y + b[1] * T, cs * 1.3, PAL.org, 0.35 * heat * ga * (1 - 0.5 * d)); }
        K.scorch(c, X, Y, T * RX * fr, Math.max(0, 1 - post / (TUNE.linger + 0.2)), heat, 3); if (post < 0.6) K.shockRing(c, X, Y, T * RX * fr, 1 - post / 0.6); }
    }
    function draw(c, f, X, Y, T, t) {
      const ft = f.t, GY = GYs(), FG = fg(), sa = serpA(ft), post = ft - T_X, V = { X0: X, Y0: Y, k: T }, low = lowFx(), ga = gA(ft);
      const Rg = aliveAt(ft, sa) ? rigNow(ft) : null;
      // the serpent (the GPU model, else the painted one)
      if (Rg) { if (sa < 0.999) { for (const it of Rg.inst) it.al = (it.al == null ? 1 : it.al) * sa; }
        if (!SNAKEFLAME_GL.drawGL(c, V, Rg, key, dims, { t: ft })) SNAKEFLAME_GL.draw2D(c, V, Rg, { glow: PZ.glow, spill: PZ.spill, t: ft, fade: p => fadeAt(p) * sa }); }
      // the scales flung out by the blast: dark plates tumbling, a hot edge (2D, under the light)
      if (S.scl.length && post > 0) { c.save(); c.lineJoin = 'round'; for (const o of S.scl) { const tau = ft - o.t0; if (tau < 0) continue; const p = ball(o, tau); if (p[2] < -0.05) continue; const x = X + p[0] * T, y = Y + p[1] * T - p[2] * ZK * T, r = o.sz * T, a = o.rot + o.vr * tau, ca2 = Math.cos(a), sn = Math.sin(a), hot = Math.max(0, 1 - tau / 1.2);
          c.globalAlpha = ga * Math.min(1, p[2] * 3 + 0.2); c.beginPath(); c.moveTo(x + ca2 * r, y + sn * r * 0.6); c.lineTo(x - sn * r * 0.55, y + ca2 * r * 0.4); c.lineTo(x - ca2 * r, y - sn * r * 0.6); c.lineTo(x + sn * r * 0.55, y - ca2 * r * 0.4); c.closePath();
          c.fillStyle = '#1C1416'; c.fill(); c.strokeStyle = H.rgba(PAL.org, 0.4 + 0.5 * hot); c.lineWidth = Math.max(1, T * 0.035); c.stroke(); } c.restore(); }
      const pet = [H.sx(me.x), H.sy(me.y) - T * 0.55, T * 0.62];
      if (FG) { const Q = FG.begin(c, pet);
        if (Rg) { const gl = PZ.glow, al = sa * (1 - PZ.spill), A = Rg.A;
          aura(Q, V, Rg, T, { glow: gl, al, SL: dm.SL, low, fade: fadeAt });   // the fire rising off its skin
          const hq = SNAKEFLAME_GL.toS(V, A.head); Q.glow(hq[0], hq[1], T * hs * 1.2, PAL.org, 0.14 * al * Math.min(2, gl));
          for (const e of A.eyes) { const q = SNAKEFLAME_GL.toS(V, e); Q.glow(q[0], q[1], T * 0.42 * hs * (1 + 0.3 * (gl - 1)), PAL.amb, 0.55 * al * Math.min(1.6, gl)); Q.glow(q[0], q[1], T * 0.14 * hs, PAL.yel, 0.7 * al); if (gl > 1.8) Q.star(q[0], q[1], T * 0.28 * (gl - 1.6), 0.6 * al); }
          for (const e of A.nost) { const q = SNAKEFLAME_GL.toS(V, e); Q.glow(q[0], q[1], T * 0.16 * hs, PAL.org, 0.35 * al * gl); }
          if (PZ.jaw > 0.3) { const q = SNAKEFLAME_GL.toS(V, A.mouth); Q.glow(q[0], q[1], T * 0.6 * hs * PZ.jaw, PAL.org, 0.5 * al * PZ.jaw); Q.glow(q[0], q[1], T * 0.25 * hs * PZ.jaw, PAL.yel, 0.6 * al * PZ.jaw); } }
        // the sky trail: fire and smoke streaming off where it rose and fell
        if (ft > T_CL && post < 1.2) for (const pf of PUFF) { if (ft < pf.tH) continue; const ag = (ft - Math.max(pf.tH, pf.tT)) / 0.75, a0 = ft < pf.tT ? 0.35 : Math.max(0, 1 - ag); if (a0 < 0.02) continue; const p = P3(pf.s), x = X + p[0] * T, y = Y + p[1] * T - p[2] * ZK * T, r = T * RM * (0.8 + 1.2 * cl(ag)) ;
          if (ft >= pf.tT) Q.smoke(x, y - r * 0.2, r * 1.3, 0.32 * a0 * ga, pf.sd, '#3A2A26', 0.5 * a0); Q.quad(3, x, y, r, 0, 0, r, '#FFFFFF', 0.7 * a0 * ga, 0.75 + 0.3 * a0, pf.sd); }
        // the burst
        if (post >= 0 && post < TUNE.linger) { const BY = Y, fl = Math.max(0, 1 - post / 0.1), RXs = RX * T;
          if (fl > 0) { Q.glow(X, BY - T * 0.6, RXs * 0.95, '#FFF2D8', 0.5 * fl); Q.star(X, BY - T * 0.4, RXs * 0.8 * fl, 0.6 * fl); }   // (a brief flash)
          // the burst's fireball, swelling and lifting into the column
          if (post < 0.7) { const u = post / 0.7, rB = T * lerp(0.8, RX * 0.36, eo(post / 0.25)), z = lerp(0.3, 1.4, eo(u)); Q.glow(X, BY - z * ZK * T, rB * 1.5, PAL.org, 0.22 * (1 - u) * ga); Q.quad(354, X, BY - z * ZK * T, rB / 0.78, 0, 0, rB / 0.78, '#FFFFFF', 0.65 * (1 - u * u) * ga, u, 0.41 + 0.1 * tier, tier); }
          // the mushroom of fire
          { const u = post / TUNE.colT; if (u < 1) { const hw = RXs * 0.5 * (1 + 0.1 * tier), hc = hw * 1.5; Q.quad(358, X, BY - hc + T * 0.15, hw, 0, 0, hc, '#FFFFFF', 0.85 * Math.min(1, 6 * u) * ga, u, 0.37 + 0.2 * tier, tier); } }
          // jets of flame bursting up along the cracks as the front passes
          for (const J of JETS) { const tau = post - J.t0; if (tau < 0 || tau > 0.6) continue; const u = tau / 0.6, hh = T * J.h * Math.sin(Math.min(1, u * 2.2) * Math.PI / 2) * (1 - 0.35 * u), x = X + J.x * T, y = Y + J.y * T;
            if (hh > 1) { Q.quad(303, x, y - hh, T * J.w * (1 + 0.6 * u), 0, 0, hh, '#FFFFFF', (1 - u * u) * ga, 0.35, J.sd, 1.3 * (1 - 0.6 * u)); Q.glow(x, y, T * J.h * 0.5, PAL.org, 0.25 * (1 - u) * ga, GY); } }
          // molten debris arcing out and falling
          for (const o of S.deb) { const tau = post - (o.t0 - T_X); if (tau < 0) continue; const p = ball(o, tau); const x = X + p[0] * T, y = Y + p[1] * T - p[2] * ZK * T;
            if (p[2] < 0) { const tl = tau - (o.vz + Math.sqrt(o.vz * o.vz + 0.6 * o.g)) / o.g; if (tl < 0.5) Q.glow(X + p[0] * T, Y + p[1] * T, T * 0.35, PAL.org, 0.5 * (1 - tl / 0.5) * ga, GY); continue; }
            const vx = o.vx * T, vy = (o.vy - (o.vz - o.g * tau) * ZK) * T, vl = Math.hypot(vx, vy) || 1, hl = Math.min(T * 0.9, vl * 0.04), w = T * o.w;
            Q.quad(304, x - vx / vl * hl, y - vy / vl * hl, vx / vl * hl, vy / vl * hl, -vy / vl * w, vx / vl * w, '#FFFFFF', 0.95 * ga, 0.6, o.sd, 1); Q.glow(x, y, T * 0.24, PAL.amb, 0.3 * ga); }
          // embers drifting out of the blast; the heat shimmer
          if (post > 0.12) { const u = cl((post - 0.12) / (TUNE.linger - 0.2)); Q.quad(301, X, BY - RXs * 0.35, RXs * 1.1, 0, 0, RXs * 0.85, '#FFFFFF', 0.6 * (1 - u) * ga, u, 0.53, low ? 0.5 : 0.8 + 0.1 * tier); }
          if (post > 0.25) { const sh = Math.max(0, 1 - (post - 0.25) / (TUNE.linger - 0.25)); if (sh > 0.01) for (let i = 0; i < (low ? 2 : 3); i++) { const rr = RXs * (0.45 + 0.28 * i + 0.1 * Math.sin(t * 1.3 + i)); Q.shimmer(X, BY - T * 0.25 * i, rr, 0.22 * sh, GY); } } }
        FG.flush(c); return; }
      // ---- 2D ----
      if (Rg) { const gl = PZ.glow, al = sa * (1 - PZ.spill); for (const e of Rg.A.eyes) { const q = SNAKEFLAME_GL.toS(V, e); K.glow(c, q[0], q[1], T * 0.3 * hs, PAL.amb, 0.4 * al * Math.min(1.6, gl)); } }
      if (ft > T_CL && post < 1.0) for (const pf of PUFF) { if (ft < pf.tT) continue; const ag = (ft - pf.tT) / 0.7; if (ag > 1) continue; const p = P3(pf.s); K.glow(c, X + p[0] * T, Y + p[1] * T - p[2] * ZK * T, T * RM * (1 + ag), PAL.org, 0.5 * (1 - ag) * ga); }
      if (post >= 0 && post < TUNE.linger) { const RXs = RX * T;
        if (post < 0.12) K.glow(c, X, Y - T * 0.6, RXs * 1.4, '#FFFFFF', 0.7 * (1 - post / 0.12));
        const u = post / TUNE.colT; if (u < 1) { const fa = 1 - u; for (let i = 0; i < 3; i++) { const z = (0.6 + i * 1.1) * eo(u * 1.4) * (1 + 0.1 * tier), r = T * (0.9 + 0.5 * i) * (0.6 + 0.6 * eo(u)); K.fireball(c, X, Y - z * T, r, t, 3, fa * (1 - 0.2 * i)); } K.glow(c, X, Y - T, RXs * 0.9, PAL.org, 0.45 * fa); }
        for (const J of JETS) { const tau = post - J.t0; if (tau < 0 || tau > 0.55) continue; const uu = tau / 0.55; K.flame(c, X + J.x * T, Y + J.y * T, T * J.w * 2, T * J.h * Math.sin(Math.min(1, uu * 2.2) * Math.PI / 2), t, J.sd, 0, 1 - uu * uu); }
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(PAL.amb, 0.9); c.lineCap = 'round'; c.lineWidth = Math.max(1.5, T * 0.09); c.beginPath();
        for (const o of S.deb) { const tau = post - (o.t0 - T_X); if (tau < 0) continue; const p = ball(o, tau), p0 = ball(o, Math.max(0, tau - 0.05)); if (p[2] < 0) continue; c.moveTo(X + p0[0] * T, Y + p0[1] * T - p0[2] * ZK * T); c.lineTo(X + p[0] * T, Y + p[1] * T - p[2] * ZK * T); } c.stroke(); c.restore(); }
    }
    F = H.add({ key: 'snakeflame', life: T_END + 0.25, x: cx, y: cy, update, drawFloor, draw, S, onEnd() { if (S.zoomOurs && H.g.zoomP === TUNE.zoom) H.g.zoomT = Math.min(H.g.zoomT || 0, 0.05); } });
    return F;
  };
  /* (idle time, when a stage starts with it in a kit: 20b) the meshes built and uploaded before the first cast */
  U.snakeflame.warm = o => { try { const tier = tierOf(Math.max(1, Math.min(7, Math.round((o && o.evo) || 1)))), d = dimsOf(tier); return SNAKEFLAME_GL.warm('t' + tier, { SL: d.SL, RM: d.RM }); } catch (e) { return false; } };
  U.snakeflame.TUNE = TUNE; U.snakeflame.STAT = STAT; U.snakeflame.aura = aura; U.snakeflame.dimsOf = dimsOf; U.snakeflame.tierOf = tierOf;
})();
