/* ---------- (v450 SF) Fire's six-star summon Ultimate: SNAKE FLAME ----------
   The user's brief (2026-11-22): a gigantic serpent of living flame coils around the battlefield for exactly six seconds, then
   collapses into an engulfing ball of fire. The serpent's model is 20k6j (SNAKEFLAME_GL); this file is the move: one
   authoritative timeline per cast, its damage, its path, its light, its clean-up.
   The cast (20b useUlt commits it: MP and the 30 s cooldown start there, the summons' convention, as Titan's): a short gesture
   (TUNE.gesture), then the pet has its full controls (move, dodge, Normal, Strongs) while the serpent runs on its own clock;
   enemy attacks and the encounter's timers go on. The normal camera: a little shake at the surge and the blast, and a small
   pull back (TUNE.zoom) while it coils, given back after.
   Timeline (game seconds from the cast; TUNE):
     0 .. ring     a rotating ring of embers opens at the aimed area (the aim, moved onto open floor and toward the room's middle);
     ring          the head surges up through it, the body pouring after it (the head leads; every point of the body follows the
                   same path, the tail last), spiralling out into the coil;
     T_C = ring + form   fully formed: the six-second coiling phase begins. The head sweeps broad loops round the centre (a curve
                   of loops fitted to the arena: pulled in wherever a wall or a gap is nearer than the footprint's edge), the body
                   tracing the same path; the floor inside the coil burns (flowing fire: the damage footprint itself, cut where
                   the floor ends). Damage: one tick at T_C and every TUNE.tick s while the coil's time is under 6 (12 ticks);
   T_C + 5 .. 6   the last second: eyes, mouth and seams brighten, the jaw opens, the body curls toward the centre, the flames are
                   drawn inward;
   T_X = T_C + 6  exactly: the finishing explosion instead of a 13th tick (one hit per enemy in the footprint), the serpent
                   compressing into one fireball that grows over the whole footprint while the body dissolves into it;
   then           embers and a fading heat shimmer for TUNE.linger s, no damage; the effect ends.
   Damage: DK = base x K x (1 + 0.08 (evo - 1)) (Apocalypse's scale: K 1.25 at Celestial, and the Celestial Ult's x1.6 in its base);
   a tick TUNE.tickK DK, the finisher TUNE.finK DK (the largest hit of the cast): 12 x 0.45 + 7.0 = 12.4 DK per enemy that stays in
   the fire, under Apocalypse's single 11 DK blast plus its fireworks (it stays "the strongest fire there is"), level growth as
   every Ult's. One shared schedule: each beat looks at every living enemy once (a Map of the beat's hits), whatever the serpent's
   body or its effects overlap; the events run from the timeline in order whatever the frame step (dt 1/60 or 1/4 give the same
   hits). Enemies only (the game's monsters through X.hitMon); no displacement or control on a boss (the finisher's knock-back
   is for the others only), bosses still take the damage.
   Tiers by the pet's stage (Base 1-3, Adept 4-6, Celestial 7): the footprint radius TUNE.R x TUNE.RK (1, +15%, +30%); the body
   grows with it; Celestial: richer crests (five a side, longer, hotter), a grander fireball (prominences round it) and a
   wider ring of embers. The coil's six seconds and the 30 s cooldown are the same at every tier.
   Footprint: the fire is drawn as cells 0.8 tiles apart on the walkable, reachable floor inside the radius (by rays from the
   centre: nothing past a wall), feathered into one sheet (FGFX 353); an enemy is in the footprint where that fire is. Fire,
   ring and scorch are pictures only: no tile, collision or navigation changes.
   Light: on the GPU painter (FGFX kinds 352 the ring of embers, 353 the coil's fire, 354 the fireball, 355 the blast across the
   floor; the SF-FX block in 20k6h), with soft shadows under the body, its glow on the floor, its eyes' and seams' bloom (one pass
   under, one over, the pet's face kept clear); without it the fire kit's 2D pictures. The serpent's parts over the pet or over an
   enemy's warning are drawn see-through. Particles (embers, sparks) are few and bounded and thinned by Fewer effects; hits never are.
   Clean-up: everything lives in one ELEM effect: it ends with the timeline, at once (a quick dissolve) when the caster is downed
   or the game is over, and goes with the stage (its GPU buffers freed by the stage's end: 20b destroy). No timers are scheduled
   outside it. */
(() => {
  const U = ELEM_IMPL.fire.ult, TAU = Math.PI * 2;
  /* every timing, radius, count and multiplier (the coil's 6 s and the 30 s cooldown are the user's fixed values; the cooldown is the row's in 20k1) */
  const TUNE = {
    cd: 30, coil: 6.0,
    gesture: 0.5,          // the pet's cast pose (s)
    ring: 0.5,             // the ring of embers opens before the head surges through (s)
    form: 1.35,            // the body pours out of the ring (s): fully formed at ring + form
    tick: 0.5, tickK: 0.45, finK: 7.0,   // the burn's ticks (every 0.5 s while the coil's time < 6) and the finisher, in DK
    R: 3.6, RK: [1, 1.15, 1.3],          // the footprint's radius (tiles) by tier: Base, Adept, Celestial
    lenK: 4.4,             // the body's length, x R
    rad: 0.7, radK: [1, 1.06, 1.12],     // its girth (tiles) by tier
    vK: 2.0,               // the head's speed while it coils, x R a second
    rho: 0.55, loop: 0.2, loopN: -3,     // the coil's curve: a circle of rho R round the centre with loops of loop R, loopN a turn (broad sweeping loops, small curls)
    curl: 0.55,            // the last second's curl toward the centre (the share of the distance)
    squeeze: 0.3,          // the body compressing into the fireball (s)
    ballZ: 1.3, ballK: 0.92, burst: 0.55,   // the fireball: its height (tiles), its final radius (x R), its growth (s)
    linger: 1.6,           // embers and heat shimmer after the blast (s, no damage)
    zoom: 0.92,            // the small pull back while it coils (1: none)
    shake: [3, 7],         // the surge's and the blast's shake
    cell: 0.8,             // the fire's cells (tiles apart)
  };
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const eo = u => 1 - (1 - cl(u)) * (1 - cl(u)), eio = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const tierOf = ev => (ev >= 7 ? 2 : ev >= 4 ? 1 : 0);
  const NSL = () => SNAKEFLAME_GL.NSL;
  const dimsOf = tier => { const R = TUNE.R * TUNE.RK[tier], LB = TUNE.lenK * R, RM = TUNE.rad * TUNE.radK[tier]; return { R, LB, RM, SL: LB / NSL() }; };
  const fg = () => { try { if (typeof window !== 'undefined' && window.__SF_FX === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const STAT = { casts: 0, ticks: 0, fin: 0, last: null };
  let BLOB = null;   // (a soft shadow, made once)
  const blob = () => { if (BLOB) return BLOB; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(12,4,2,0.9)'); gr.addColorStop(0.55, 'rgba(12,4,2,0.45)'); gr.addColorStop(1, 'rgba(12,4,2,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (BLOB = cv); };   // (tests read these: the last cast's beats)

  U.snakeflame = (C, h) => {
    const H = h, K = FK.bind(H), PAL = FK.P, me = H.me, ev = K.evo(C), tier = tierOf(ev), dm = dimsOf(tier), R = dm.R, LB = dm.LB, RM = dm.RM;
    const DK = C.base * C.K * K.evoK(C), tickD = DK * TUNE.tickK, finD = DK * TUNE.finK;
    const T_R = TUNE.ring, T_C = T_R + TUNE.form, T_X = T_C + TUNE.coil, T_END = T_X + TUNE.burst + TUNE.linger;
    const key = 't' + tier, dims = { SL: dm.SL, RM };
    me.castT = me.castM = TUNE.gesture;   // (a short gesture: the pose only; the controls were never taken)
    H.X.banner('SNAKE FLAME', '', C.col, 1.4); H.X.sfx.hum();
    if (SNAKEFLAME_GL.usable()) SNAKEFLAME_GL.ensure(key, dims);   // (built now if the idle time has not: the meshes are reused by every later cast)

    /* ---- the arena: open floor round the aim. ok(x, y): walkable and reachable; rays from the centre give the reach each way ---- */
    const ok = (x, y) => { try { if (H.X.blocked(x, y, 0.05, 0)) return false; const f = H.X.flowAt ? H.X.flowAt(x, y) : 0; return f < 9999; } catch (e) { return true; } };
    let cx, cy; { const p = H.walk(C.tx, C.ty); cx = p.x; cy = p.y;
      // moved half way toward the middle of the open floor within the radius (an aim by a wall still gets its coil)
      let sx = 0, sy = 0, n = 0; for (let gy = -R; gy <= R; gy += 0.6) for (let gx = -R; gx <= R; gx += 0.6) if (gx * gx + gy * gy <= R * R && ok(cx + gx, cy + gy)) { sx += gx; sy += gy; n++; }
      if (n > 6) { const q = H.walk(cx + sx / n * 0.5, cy + sy / n * 0.5); if (ok(q.x, q.y)) { cx = q.x; cy = q.y; } } }
    const NR = 48, reach = new Float32Array(NR);
    for (let i = 0; i < NR; i++) { const a = i / NR * TAU, ca = Math.cos(a), sa = Math.sin(a); let d = 0.2; while (d < R + 0.5 && ok(cx + ca * d, cy + sa * d)) d += 0.2; reach[i] = Math.min(R + 0.5, d - 0.1); }
    const reachAt = a => { let f = ((a / TAU) % 1 + 1) % 1 * NR; const i = Math.floor(f) % NR, j = (i + 1) % NR; f -= Math.floor(f); return lerp(reach[i], reach[j], f); };
    /* the footprint: in the radius, inside the reach that way (the same rays the fire is laid by) */
    const inFoot = (x, y, pad) => { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy); return d < R + (pad || 0) && d < reachAt(Math.atan2(dy, dx)) + 0.25 + (pad || 0); };
    const cells = []; { const S = TUNE.cell, N = Math.ceil((R + 0.4) / S); for (let gy = -N; gy <= N; gy++) for (let gx = -N; gx <= N; gx++) { const ox = gx * S, oy = gy * S, d = Math.hypot(ox, oy); if (d > R + 0.45) continue; if (d > reachAt(Math.atan2(oy, ox)) + 0.2) continue; if (!ok(cx + ox, cy + oy) && d > 0.3) continue; cells.push([ox, oy, Math.random() * 6.283]); } }

    /* ---- the path: the head's, by arc length s from the ring (s <= 0: straight down the shaft under it). A circle of rho R with
       loops of loop R (loopN a turn), opening out of the centre over the first turn, pulled in where the reach is short; smoothed ---- */
    const vC = TUNE.vK * R, need = LB + vC * (TUNE.coil + TUNE.squeeze + 0.2) + 4, margin = RM * 1.15 + 0.15;
    const a0 = Math.atan2(cy - me.y, cx - me.x) + Math.PI * 0.5, rho = TUNE.rho * R, lp = TUNE.loop * R, kN = TUNE.loopN, ph = Math.random() * TAU;
    const PX = [], PY = []; { let th = a0, s = 0, lx = 0, ly = 0, i = 0; PX.push(0); PY.push(0);
      while (s < need && i < 20000) { th += 0.012; i++; const env = sstep(a0, a0 + 2.6, th); let x = env * (rho * Math.cos(th) + lp * Math.cos(kN * th + ph)), y = env * (rho * Math.sin(th) + lp * Math.sin(kN * th + ph));
        const d = Math.hypot(x, y), lim = Math.max(0.5, Math.min(R - margin, reachAt(Math.atan2(y, x)) - margin)); if (d > lim) { x *= lim / d; y *= lim / d; }
        PX.push(x); PY.push(y); s += Math.hypot(x - lx, y - ly); lx = x; ly = y; } }
    for (let pass = 0; pass < 3; pass++) for (let i = 2; i < PX.length - 2; i++) { PX[i] = (PX[i - 2] + PX[i - 1] * 2 + PX[i] * 2 + PX[i + 1] * 2 + PX[i + 2]) / 8; PY[i] = (PY[i - 2] + PY[i - 1] * 2 + PY[i] * 2 + PY[i + 1] * 2 + PY[i + 2]) / 8; }
    const SA = new Float32Array(PX.length); for (let i = 1; i < PX.length; i++) SA[i] = SA[i - 1] + Math.hypot(PX[i] - PX[i - 1], PY[i] - PY[i - 1]);
    const SN = SA[SA.length - 1];
    const xyAt = s => { if (s <= 0) return [0, 0]; if (s >= SN) return [PX[PX.length - 1], PY[PY.length - 1]]; let lo = 0, hi = SA.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (SA[m] <= s) lo = m; else hi = m; } const u = (s - SA[lo]) / Math.max(1e-6, SA[hi] - SA[lo]); return [lerp(PX[lo], PX[hi], u), lerp(PY[lo], PY[hi], u)]; };
    /* the head's arc length at time t: up the shaft and out (the body pouring after it), then the coil's speed */
    const vF = LB / TUNE.form, sHead = t => (t < T_C ? vF * (t - T_R) : LB + vC * (t - T_C));
    const prof = SNAKEFLAME_GL.prof, hs = RM / 0.6 * 1.22;

    /* ---- the state: one timeline, its beats (ticks, the finisher), the pose of this moment ---- */
    const S = { tk: 0, fin: false, dead: -1, hitsT: 0, hitsF: 0, pulse: -9, lastTick: -9, cast: ++STAT.casts, log: [], zoomOurs: false };
    STAT.last = S; S.R = R; S.inFoot = inFoot; S.tier = tier; S.T_C = T_C; S.T_X = T_X; S.cx = cx; S.cy = cy; S.cells = cells.length; S.tickD = tickD; S.finD = finD; S.DK = DK;
    let F = null;
    /* one beat: every living enemy in the footprint once (Map: overlapping parts and pictures never add a second hit) */
    function beat(kind, tt) { const hits = new Map(), dmg = kind === 'fin' ? finD : tickD;
      for (const m of H.living()) { if (hits.has(m) || !inFoot(m.x, m.y, m.r * 0.5)) continue; hits.set(m, 1);
        H.X.hitMon(m, dmg, C.dmgO(kind === 'fin' ? (m.boss ? {} : { kb: 3 }) : {})); }
      S.log.push([kind, Math.round(tt * 1000) / 1000, hits.size]); if (kind === 'fin') { S.hitsF += hits.size; STAT.fin++; } else { S.hitsT += hits.size; STAT.ticks++; } return hits.size; }
    /* the pose at time t (also the fade over the pet and the warnings): { pt(d), glow, ... } */
    const warns = () => (H.X.zones || []).filter(z => z.kind === 'warn' && z.own !== 'pet');
    const overWarn = (z, x, y, pad) => { const dx = x - z.x, dy = y - z.y; if (z.shape === 'line' || z.shape === 'cone') { const ca = Math.cos(z.a || 0), sa = Math.sin(z.a || 0), al = dx * ca + dy * sa, of = -dx * sa + dy * ca, L = z.len || 1;
        if (al < -pad || al > L + pad) return false; return z.shape === 'line' ? Math.abs(of) < (z.w || 1) / 2 + pad : Math.abs(of) < Math.tan(Math.min(1.5, z.spread || 0.5)) * Math.max(0, al) + pad; }
      return Math.hypot(dx, dy) < (z.r || 1) + pad; };
    let WZ = []; const fadeAt = p => { const wx = cx + p[0], wy = cy + p[1], dx = wx - me.x, dys = (wy - me.y) * SNAKEFLAME_GL.GY - p[2] * SNAKEFLAME_GL.ZK, r = RM * 0.8; let a = 1;
      if (!me.dead && Math.abs(dx) < 0.42 + r * 0.6 && dys > -1.05 - r * 0.5 && dys < 0.2 + r * 0.4) a = 0.45;   // (over the pet's sprite: see-through, the player's view kept)
      for (const z of WZ) if (overWarn(z, wx, wy, r + 0.2)) { a = Math.min(a, 0.5); break; }   // (over an enemy's warning: its own shape)
      return a; };
    function pose(t) {
      const tc = t - T_C, sH = sHead(t), ct = eio((tc - (TUNE.coil - 1)) / 1), sq = eio((t - T_X) / TUNE.squeeze), formK = cl((t - T_R) / TUNE.form);
      const raise = 0.95 * hs * (1 + 0.45 * (1 - formK) * cl((t - T_R) * 3)) * (1 + 0.25 * ct);
      return { k: tier, RM, LB, t, glow: 1 + 1.6 * ct + S.pulseK + 1.5 * sq, glow2: sq * 0.8, spill: cl((t - T_X - 0.04) / 0.42), shrink: 1 - 0.62 * sq, jaw: 0.12 + 0.12 * Math.sin(t * 2.3) * (1 - ct) + 0.75 * ct, pitch: 0.22 - 0.3 * ct, fin: 1 + 0.3 * ct, fade: fadeAt,
        pt: d => { const s = sH - d, u = d / LB; let xy = xyAt(s), z; if (s <= 0) z = s - 0.15; else z = (RM * prof(u) * 0.92 + 0.04 + 0.13 * Math.sin(s * 0.9 + t * 1.6) * sstep(0, 2, s)) * sstep(0, 1.0, s) + (d < 2.2 ? raise * Math.pow(1 - d / 2.2, 2) : 0);
          if (s > 0 && ct > 0) { const kq = 1 - TUNE.curl * ct * (1 - 0.35 * u); xy = [xy[0] * kq, xy[1] * kq]; z += 0.25 * ct * (1 - u); }   // (the last second: curling toward the centre)
          if (sq > 0) { xy = [xy[0] * (1 - sq), xy[1] * (1 - sq)]; z = lerp(Math.max(z, 0), TUNE.ballZ, sq); }   // (compressing into the fireball)
          return [xy[0], xy[1], z]; } };
    }
    S.pulseK = 0;
    /* ---- the update: the authoritative clock ---- */
    function update(dt, f) {
      const t = f.t, g = H.g;
      if (S.dead < 0 && (me.dead || g.over)) { S.dead = t; f.life = Math.min(f.life, 0.6); if (S.zoomOurs && g.zoomP === TUNE.zoom) g.zoomT = Math.min(g.zoomT || 0, 0.05); }   // (the caster downed, the game over: a quick dissolve, no more damage)
      if (S.dead < 0) {
        // the beats, in order, from the timeline: the ticks while the coil's time is under 6, then the finisher at exactly 6
        while (S.tk < Math.round(TUNE.coil / TUNE.tick) && t >= T_C + S.tk * TUNE.tick - 1e-6 && S.tk * TUNE.tick < TUNE.coil - 1e-6) { beat('tick', T_C + S.tk * TUNE.tick); S.lastTick = T_C + S.tk * TUNE.tick; S.tk++; }
        if (!S.fin && t >= T_X - 1e-6) { S.fin = true; beat('fin', T_X); blastFx(); }
        // the camera: a small pull back while it coils (the game gives it back when zoomT runs out: nothing to undo if this ends early)
        if (TUNE.zoom !== 1 && t > TUNE.gesture && t < T_X + 0.8 && (g.zoomP === 1 || g.zoomP === TUNE.zoom)) { g.zoomP = TUNE.zoom; g.zoomT = Math.max(g.zoomT || 0, 0.12); S.zoomOurs = true; }
        if (!S.surged && t >= T_R) { S.surged = true; H.X.shake(TUNE.shake[0], 0.25); H.X.sfx.whoosh(); K.embers(cx, cy, 8, { v: 3, up: 3 }); }
        if (!S.coiled && t >= T_C) { S.coiled = true; H.X.sfx.hum(); }
      }
      S.pulseK = Math.exp(-Math.max(0, t - S.lastTick) * 7) * 0.35;
      WZ = warns();
      // embers off the body and the field (a few a frame, thinned by Fewer effects)
      if (S.dead < 0 && t > T_R && t < T_X) { const k = dt * 14 * H.Q(); let n = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); n = Math.min(n, 3); if (n) { const P = pose(t); while (n-- > 0) { const d = Math.random() * LB * 0.9, p = P.pt(d); if (p[2] < 0) continue;
          H.P({ kind: 'ember', x: cx + p[0] + (Math.random() - 0.5) * 0.4, y: cy + p[1] - p[2] * 0.8, vx: (Math.random() - 0.5) * 1.2, vy: -0.8 - Math.random() * 1.2, g: -1.2, life: 0.6 + Math.random() * 0.5, max: 1.1, size: 2.4 + Math.random() * 1.6, color: Math.random() < 0.5 ? PAL.org : PAL.yel }); } } }
      if (t > T_X && t < T_END - 0.3 && Math.random() < 0.6 * H.Q()) { const b = Math.random() * TAU, rr = Math.sqrt(Math.random()) * R * 0.9; if (inFoot(cx + Math.cos(b) * rr, cy + Math.sin(b) * rr * 0.9)) H.P({ kind: 'ember', x: cx + Math.cos(b) * rr, y: cy + Math.sin(b) * rr, vx: (Math.random() - 0.5) * 0.6, vy: -0.6 - Math.random() * 0.8, g: -0.8, life: 0.9, max: 0.9, size: 2.2, color: Math.random() < 0.5 ? PAL.amb : PAL.org }); }
      if (t >= T_END) f.life = 0;
    }
    function blastFx() { H.X.shake(TUNE.shake[1], 0.35); H.X.sfx.crash(); H.X.flash(0.1, '#FFB066'); H.X.hitstop && H.X.hitstop(0.04);
      K.sparks(cx, cy - TUNE.ballZ * 0.8, 18, 7); K.embers(cx, cy, 14, { v: 4, up: 3 }); }

    /* ---- drawing: the field, the ring, the shadows and the body's glow under everything; the serpent, its bloom and the fireball over ---- */
    const GYs = () => H.GY || 0.55;
    const fieldA = t => (S.dead >= 0 ? Math.max(0, 1 - (t - S.dead) / 0.5) : 1) * sstep(T_C - 0.45, T_C - 0.05, t) * (1 - sstep(T_X + 0.1, T_X + 0.6, t));
    const ringA = t => sstep(0, T_R, t) * (1 - sstep(T_C, T_C + 0.45, t)) * (S.dead >= 0 ? Math.max(0, 1 - (t - S.dead) / 0.4) : 1);
    const serpA = t => (S.dead >= 0 ? Math.max(0, 1 - (t - S.dead) / 0.45) : 1);
    let PZ = null, PZt = -1, RG = null;   // (the pose and rig of this frame, shared by the two layers)
    const rigNow = t => { if (PZt === t && RG) return RG; PZ = pose(t); RG = SNAKEFLAME_GL.rig(PZ); PZt = t; return RG; };
    function drawUnder(c, f, X, Y, T, t) {
      const ft = f.t, GY = GYs(), FG = fg(), fa = fieldA(ft), ra = ringA(ft), sa = serpA(ft), post = ft - T_X, V = { X0: X, Y0: Y, k: T };
      const din = cl(ft - T_C - (TUNE.coil - 1)), alive = ft > T_R - 0.05 && ft < T_X + 0.5 && sa > 0.01, Rg = alive ? rigNow(ft) : null;
      if (Rg) { // the body's soft shadow on the floor (one cached blob each, drawn before the painter's pass: that pass then lays light only, one copy)
        const B = blob(), sh = sa * (1 - PZ.spill) * (1 - 0.7 * din); if (sh > 0.01) { c.save(); for (let i = 0; i < Rg.spine.length; i += 2) { const s = Rg.spine[i]; if (s.p[2] + s.r < 0) continue; const q = SNAKEFLAME_GL.toS(V, [s.p[0], s.p[1], 0]), lift = Math.max(0, s.p[2] - s.r), rr = s.r * T * (1.3 + lift * 0.3);
          c.globalAlpha = Math.min(1, 0.3 * sh / (1 + lift * 0.6)); c.drawImage(B, q[0] - rr, q[1] - rr * GY, rr * 2, rr * 2 * GY); } c.restore(); } }
      if (FG) { const Q = FG.begin(c, null);
        if (fa > 0.01) { const pz = Math.round(R * 100) + 0.98 * din, a = fa * (0.68 + S.pulseK * 0.45), cs = TUNE.cell * T;
          for (const q of cells) Q.quad(353, X + q[0] * T, Y + q[1] * T * GY, cs, 0, 0, cs * GY, '#FFFFFF', a, q[0], q[1], pz);
          Q.glow(X, Y, T * R * 1.1, PAL.red, 0.14 * fa, GY); }
        if (ra > 0.01) { const op = sstep(0, T_R, ft) + 0.4 * Math.exp(-Math.max(0, ft - T_R) * 3) * (ft > T_R ? 1 : 0), rr = T * (1.5 + 0.35 * tier);
          Q.quad(352, X, Y, rr, 0, 0, rr * GY, '#FFFFFF', ra, op, ft * 1.6, 1 + 0.6 * Math.exp(-Math.abs(ft - T_R) * 4)); Q.glow(X, Y, rr * 1.4, PAL.org, 0.35 * ra, GY); }
        if (Rg) { // the body's light on the floor
          for (let i = 0; i < Rg.spine.length; i += 4) { const s = Rg.spine[i]; if (s.p[2] + s.r < 0) continue; const q = SNAKEFLAME_GL.toS(V, [s.p[0], s.p[1], 0]); Q.glow(q[0], q[1], s.r * T * 2.4, PAL.org, 0.22 * sa * PZ.glow * (1 - PZ.spill) / 1.6, GY); } }
        if (post > -0.02) { const u = eo(post / 0.32), heat = Math.max(0, 1 - post / (TUNE.burst + TUNE.linger * 0.8)), rr = T * R * 1.04;
          Q.quad(355, X, Y, rr, 0, 0, rr * GY, '#FFFFFF', Math.min(1, 0.9 * Math.max(0, 1 - post / (TUNE.burst + TUNE.linger))), u, 0.37, heat * 1.3);
          if (post < 0.4) Q.glow(X, Y, rr * 1.1, PAL.amb, 0.25 * (1 - post / 0.4), GY); }
        FG.flush(c); return; }
      // ---- 2D: the fire kit's pictures ----
      if (fa > 0.01) { for (const q of cells) K.floorLight(c, X + q[0] * T, Y + q[1] * T * GY, T * TUNE.cell * 1.1, 0.5 * fa * (0.8 + 0.2 * Math.sin(t * 4 + q[2])), q[2] > 3 ? PAL.org : PAL.red); K.floorLight(c, X, Y, T * R, 0.25 * fa, PAL.amb); }
      if (ra > 0.01) { const rr = T * (1.5 + 0.35 * tier) * sstep(0, T_R, ft); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = ra; c.strokeStyle = H.rgba(PAL.org, 0.8); c.lineWidth = Math.max(2, T * 0.14); c.beginPath(); c.ellipse(X, Y, rr, rr * GY, 0, 0, TAU); c.stroke();
        c.fillStyle = H.rgba(PAL.yel, 0.9); for (let i = 0; i < 18; i++) { const b = i / 18 * TAU + ft * 1.6; c.beginPath(); c.arc(X + Math.cos(b) * rr, Y + Math.sin(b) * rr * GY, Math.max(1, T * 0.05), 0, TAU); c.fill(); } c.restore(); K.floorLight(c, X, Y, rr, 0.5 * ra); }
      if (post > -0.02) { const heat = Math.max(0, 1 - post / 1.6); K.scorch(c, X, Y, T * R * eo(post / 0.3), Math.max(0, 1 - post / (TUNE.burst + TUNE.linger)), heat, 3); if (post < 0.6) K.shockRing(c, X, Y, T * R * eo(post / 0.45), 1 - post / 0.6); }
    }
    function draw(c, f, X, Y, T, t) {
      const ft = f.t, GY = GYs(), FG = fg(), sa = serpA(ft), post = ft - T_X, V = { X0: X, Y0: Y, k: T }, ZK = SNAKEFLAME_GL.ZK, low = lowFx();
      const alive = ft > T_R - 0.05 && ft < T_X + 0.5 && sa > 0.01, Rg = alive ? rigNow(ft) : null;
      // the serpent (the GPU model, else the painted one)
      if (Rg) { if (sa < 0.999) { for (const it of Rg.inst) it.al = (it.al == null ? 1 : it.al) * sa; }
        if (!SNAKEFLAME_GL.drawGL(c, V, Rg, key, dims, { t: ft })) SNAKEFLAME_GL.draw2D(c, V, Rg, { glow: PZ.glow, spill: PZ.spill, t: ft, fade: p => fadeAt(p) * sa }); }
      const pet = [H.sx(me.x), H.sy(me.y) - T * 0.55, T * 0.62], BX = X, BY = Y - TUNE.ballZ * ZK * T;
      const ballU = post < 0 ? -1 : cl(post / (TUNE.burst + 0.6)), rB = T * lerp(0.9, R * TUNE.ballK, eo(post / TUNE.burst));
      if (FG) { const Q = FG.begin(c, pet);
        if (Rg) { const gl = PZ.glow, al = sa * (1 - PZ.spill), A = Rg.A;
          for (const e of A.eyes) { const q = SNAKEFLAME_GL.toS(V, e); Q.glow(q[0], q[1], T * 0.42 * hs * (1 + 0.3 * (gl - 1)), PAL.amb, 0.55 * al * Math.min(1.6, gl)); Q.glow(q[0], q[1], T * 0.14 * hs, PAL.yel, 0.7 * al); if (gl > 1.8) Q.star(q[0], q[1], T * 0.28 * (gl - 1.6), 0.6 * al); }
          for (const e of A.nost) { const q = SNAKEFLAME_GL.toS(V, e); Q.glow(q[0], q[1], T * 0.16 * hs, PAL.org, 0.35 * al * gl); }
          if (PZ.jaw > 0.3) { const q = SNAKEFLAME_GL.toS(V, A.mouth); Q.glow(q[0], q[1], T * 0.6 * hs * PZ.jaw, PAL.org, 0.5 * al * PZ.jaw); Q.glow(q[0], q[1], T * 0.25 * hs * PZ.jaw, PAL.yel, 0.6 * al * PZ.jaw); }
          // selective bloom along the body: soft halos on the seams' light
          for (let i = 1; i < Rg.spine.length; i += low ? 6 : 4) { const s = Rg.spine[i]; if (s.p[2] + s.r < 0) continue; const q = SNAKEFLAME_GL.toS(V, s.p); Q.glow(q[0], q[1], s.r * T * 2.0, PAL.org, 0.1 * al * gl * fadeAt(s.p)); } }
        if (post >= 0 && ballU < 1) { const fl = Math.max(0, 1 - post / 0.12), fa2 = Math.min(1, 1.6 * (1 - ballU)), rq = rB / 0.78;
          if (fl > 0) Q.glow(BX, BY, rB * 2.0, '#FFF2D8', 0.6 * fl);   // (a brief bright flash)
          Q.glow(BX, BY, rB * 1.6, PAL.org, 0.3 * fa2);
          // (cooling: billows of flame rolling off it and smoke rising, for depth behind the fire's light)
          if (ballU > 0.25) { const ck = cl((ballU - 0.25) / 0.5), np = low ? 4 : 7; for (let i = 0; i < np; i++) { const b = i / np * TAU + 0.4, rr = rB * (0.55 + 0.25 * ck), x2 = BX + Math.cos(b) * rr, y2 = BY + Math.sin(b) * rr * 0.75 - T * 0.6 * ck; Q.smoke(x2, y2 - T * 0.3 * i % 2, rB * (0.42 + 0.15 * ck), 0.45 * ck * fa2, i * 1.7 + 3, '#3A2A26', 0.5 * (1 - ck)); } }
          Q.quad(354, BX, BY, rq, 0, 0, rq, '#FFFFFF', 0.85 * fa2, ballU, 0.41 + 0.1 * tier, tier);
          if (tier >= 2 && !low) for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + post * 1.4, q2 = rB * (1.05 + 0.08 * Math.sin(post * 6 + i)); Q.tongue(BX + Math.cos(b) * q2, BY + Math.sin(b) * q2, T * 0.4, T * (0.9 + 0.5 * Math.sin(post * 9 + i)) * fa2, b + Math.PI / 2, 1.0, 0.7 * fa2, i * 3.1); } }
        if (post > 0.2) { const sh = Math.max(0, 1 - (post - 0.2) / TUNE.linger); if (sh > 0.01) for (let i = 0; i < (low ? 2 : 3); i++) { const rr = T * R * (0.45 + 0.28 * i + 0.1 * Math.sin(t * 1.3 + i)); Q.shimmer(X, Y - T * 0.25 * i, rr, 0.22 * sh, GY); } }
        FG.flush(c); return; }
      // ---- 2D ----
      if (Rg) { const gl = PZ.glow, al = sa * (1 - PZ.spill); for (const e of Rg.A.eyes) { const q = SNAKEFLAME_GL.toS(V, e); K.glow(c, q[0], q[1], T * 0.3 * hs, PAL.amb, 0.4 * al * Math.min(1.6, gl)); } }
      if (post >= 0 && ballU < 1) { const fa2 = Math.min(1, 1.6 * (1 - ballU)); if (post < 0.12) K.glow(c, BX, BY, rB * 2, '#FFFFFF', 0.7 * (1 - post / 0.12)); K.glow(c, BX, BY, rB * 1.6, PAL.org, 0.45 * fa2); K.fireball(c, BX, BY, rB, t, 3, fa2); }
    }
    F = H.add({ key: 'snakeflame', life: T_END + 0.25, x: cx, y: cy, update, drawUnder, draw, S, onEnd() { if (S.zoomOurs && H.g.zoomP === TUNE.zoom) H.g.zoomT = Math.min(H.g.zoomT || 0, 0.05); } });
    return F;
  };
  /* (idle time, when a stage starts with it in a kit: 20b) the meshes built and uploaded before the first cast */
  U.snakeflame.warm = o => { try { const tier = tierOf(Math.max(1, Math.min(7, Math.round((o && o.evo) || 1)))), d = dimsOf(tier); return SNAKEFLAME_GL.warm('t' + tier, { SL: d.SL, RM: d.RM }); } catch (e) { return false; } };
  U.snakeflame.TUNE = TUNE; U.snakeflame.STAT = STAT; U.snakeflame.dimsOf = dimsOf; U.snakeflame.tierOf = tierOf;
})();
