/* ---------- (v451 GE) Wind's six-star summon Ultimate: GOLDEN EAGLE ----------
   The user's brief (2026-11-22): an enormous eagle flies into the battlefield and drives successive waves of cutting wind through
   the enemies with powerful wingbeats. The eagle's model is 20k5yd (GOLDEAGLE_GL); this file is the move: one authoritative
   timeline per cast, its waves and their hits, its choreography, its light, its clean-up.
   The cast (20b useUlt commits it: MP and the 35 s cooldown start there, the summons' convention, as Titan's and Snake Flame's): a
   short gesture (TUNE.gesture), then the pet has its full controls (move, dodge, Normal, Strongs) while the eagle runs on its own
   clock; enemy attacks and the encounter's timers go on. The normal camera: a small pull back (TUNE.zoom) while it flies, a little
   shake at each wingbeat (more at the last).
   The aim is fixed at the cast: the waves all travel that one way (the aim's angle), so the player can line the enemies up.
   Timeline (game seconds from the cast; TUNE):
     0 .. enter      the eagle sweeps in from behind and to one side, fast and low, banks upward and flares into a powerful hover
                     above and a little behind the pet's cast position (TUNE.back, TUNE.hoverZ), facing the aim;
     release k       each wingbeat: a deliberate downstroke (TUNE.down) compresses the air beneath the wings (a pressure ring on the
                     floor, streaks of air driven down off the wingtips) and launches a broad crescent wave along the ground at its
                     bottom; the next upstroke recovers. Releases TUNE.first + k TUNE.gap;
     before the last the eagle opens its wings to their widest span and draws the air inward (TUNE.inhale: a vortex of mint air
                     streaming into its chest, a cry);
     the last        the final downstroke (TUNE.downF) releases a larger, stronger wave;
     then            it climbs away and dissolves into golden feathers and fading wind ribbons (TUNE.leave); the waves finish their
                     run; the effect ends. Arrival, hover and departure deal nothing.
   Waves: 3 wingbeats at Base (evo 1-3), 4 at Adept (4-6), 6 at Celestial (7), the final one included. A wave is a crescent across
   the aim (convex ahead: its middle leads, its tips trail by TUNE.curv per tile squared), TUNE.w0 .. w1 wide each side as it runs
   (the final w0F .. w1F), at TUNE.v tiles a second to TUNE.range (the final vF, rangeF), from a line on the floor under the eagle's
   wings. The floor it may cross: rays along the aim, a column every TUNE.col tiles across it, each from where it first meets open,
   reachable floor in sight of the cast position to the first wall or gap: the visible wave stops there, and so do its hits.
   Hits: each wave hits each enemy once, as its front passes it (a Map a wave: overlapping waves, ribbons or the eagle never add a
   hit), Wind damage (the pet's element): a wave TUNE.waveK DK, the final TUNE.finK DK, the largest single hit of the cast;
   DK = base x K x (1 + 0.08 (evo - 1)) (the elemental Ultimates' scale). Per enemy that stays in the path: 2 x 2 + 6 = 10 DK at Base,
   12 at Adept, 16 at Celestial (Snake Flame 12.4, Moby Dick 12.2 .. 16.6). A brief stagger and a push along the aim on the others;
   bosses take the damage and keep their immunity (H.push leaves them; no stun). The crossing is found by sweeping the front from
   its last place to this frame's (and the width at the enemy's own place), so dt 1/60 or 1/4 give the same hits.
   Light: the waves on the GPU painter (FGFX kinds 368 their standing body, 369 its light: a sharp luminous leading edge, the face
   fading toward the inner trailing edge, streaks, narrow spiral ribbons winding round it; 370 the trail over the floor with its
   dust, 371 the shade under it; 372 the inhale's vortex, 373 the pressure ring under a downstroke, 374 a golden feather, 375 a
   curved ribbon of wind in one quad; the GE-FX block in 20k6h); the eagle on GLM (20k5yd) with its shaped shadow on the floor (the
   body's and the wings' blobs) and its eyes' bloom. Without the GPU: the painted eagle and plain 2D waves. Particles (feathers, dust,
   motes) come from fixed pools, thinned by Fewer effects; the hits never are. The eagle's parts over the pet or an enemy's warning
   are drawn see-through.
   Clean-up: everything lives in one ELEM effect: it ends with the timeline; at once (a quick dissolve, no more hits) when the caster
   is downed or the game is over; with the stage (its GPU buffers freed by the stage's end: 20b destroy). No timers outside it. */
(() => {
  const U = ELEM_IMPL.wind.ult, TAU = Math.PI * 2;
  /* every timing, size, count and multiplier (the cooldown is the row's in 20k1: keep the two the same) */
  const TUNE = {
    cd: 35,
    gesture: 0.45,                          // the pet's cast pose (s); full control after it
    enter: 1.2,                             // the flight in, ending in the hover (s)
    first: 1.55, gap: 0.62, inhale: 0.8,    // the first wave's release, between releases, the widest-span inhale before the last (s)
    down: 0.24, downF: 0.32,                // a downstroke, the final one (s; each ends at its release)
    leave: 1.35,                            // the climb and dissolve after the last release (s)
    beats: [3, 4, 6],                       // wingbeats (waves) by tier: Base, Adept, Celestial (the final one included)
    waveK: 2.0, finK: 6.0,                  // damage, x DK: a wave, the final wave (the cast's largest hit)
    v: 7.0, range: 8.0, w0: 1.6, w1: 2.8, curv: 0.2, h: 0.7, trail: 1.4,          // a wave: speed (tiles/s), reach, half width at the start and at its reach, the tips' sweep back, height, the trail behind it
    vF: 8.0, rangeF: 9.5, w0F: 2.2, w1F: 3.8, curvF: 0.15, hF: 1.0, trailF: 2.0, // the final wave's
    band: 0.6,                              // the band behind the front that still counts as passing (tiles)
    col: 0.25,                              // the floor's columns across the aim (tiles apart)
    stun: 0.22, push: 0.45, stunF: 0.45, pushF: 1.0,   // the stagger (s) and push (tiles) on the others (bosses: none)
    sc: 0.9, hoverZ: 3.2, back: 1.4, origin: 0.6,      // the eagle's scale (span about 7.8 tiles), its hover height and place behind the cast, the waves' line ahead of that
    zoom: 0.9, shake: [1.5, 4.5],           // the camera: a small pull back while it flies; a wave's and the final's shake
    feathers: 30, motes: 26, dust: 36,      // cosmetic pools (thinned by Fewer effects; never the hits)
  };
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const eio = u => { u = cl(u); return u * u * (3 - 2 * u); }, cosE = u => 0.5 - 0.5 * Math.cos(Math.PI * cl(u));
  const tierOf = ev => (ev >= 7 ? 2 : ev >= 4 ? 1 : 0);
  const G = () => GOLDEAGLE_GL;
  const fg = () => { try { if (typeof window !== 'undefined' && window.__GE_FX === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const STAT = { casts: 0, waves: 0, last: null };   // (tests read these: the last cast's record)
  let BLOB = null;   // (a soft shadow, made once)
  const blob = () => { if (BLOB) return BLOB; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(10,14,8,0.85)'); gr.addColorStop(0.55, 'rgba(10,14,8,0.4)'); gr.addColorStop(1, 'rgba(10,14,8,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (BLOB = cv); };
  const C_MINT = '#A8FFE0', C_JADE = '#2FD69C', C_CHAMP = '#FFEFC4', C_WHITE = '#EFFFF8', C_DUST = '#D8CDA8';
  /* the release times (s from the cast): every gap, the last after the inhale */
  const releases = n => { const r = []; for (let k = 0; k < n; k++) r.push(k < n - 1 ? TUNE.first + k * TUNE.gap : TUNE.first + Math.max(0, n - 2) * TUNE.gap + (n > 1 ? TUNE.gap + TUNE.inhale : 0)); return r; };

  U.goldeneagle = (C, H) => {
    const me = H.me, X = H.X, g0 = H.g, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), tier = tierOf(ev), NB = TUNE.beats[tier];
    const DK = C.base * (C.K || 1) * (1 + 0.08 * (ev - 1)), waveD = DK * TUNE.waveK, finD = DK * TUNE.finK;
    me.castT = me.castM = TUNE.gesture;   // (a short gesture: the pose only; the controls were never taken)
    X.banner('GOLDEN EAGLE', '', C.col, 1.4); if (X.sfx.hum) X.sfx.hum();
    if (G().usable()) G().ensure();   // (built now if the idle time has not: the meshes are reused by every later cast)
    /* ---- the aim (fixed for the whole cast), the hover, the waves' line ---- */
    const A = isFinite(C.a) ? C.a : 0, dx = Math.cos(A), dy = Math.sin(A), nx = -dy, ny = dx;
    const C0 = { x: me.x, y: me.y }, HP = { x: C0.x - dx * TUNE.back, y: C0.y - dy * TUNE.back }, O = { x: HP.x + dx * TUNE.origin, y: HP.y + dy * TUNE.origin };
    const TR = releases(NB), T_LAST = TR[NB - 1], T_LEAVE = T_LAST + 0.45, T_GONE = T_LEAVE + TUNE.leave, T_END = Math.max(T_GONE, T_LAST + TUNE.rangeF / TUNE.vF + 0.35) + 0.05;
    /* ---- the floor the waves may cross: a column every TUNE.col tiles across the aim; each from its first open floor (in sight of the
       cast position) to the first wall or gap along the aim ---- */
    const ok = (x, y) => { try { if (X.blocked(x, y, 0.05, 0)) return false; const f = X.flowAt ? X.flowAt(x, y) : 0; return f < 9999; } catch (e) { return true; } };
    const los = (x0, y0, x1, y1) => { try { return X.los ? X.los(x0, y0, x1, y1) : true; } catch (e) { return true; } };
    const CW = TUNE.col, NC = 2 * Math.ceil((TUNE.w1F + 0.8) / CW) + 1, J0 = (NC - 1) / 2, cS = new Float32Array(NC), cR = new Float32Array(NC), RMAX = TUNE.rangeF + 0.5;
    for (let j = 0; j < NC; j++) { const of = (j - J0) * CW; let s0 = null;
      for (let s = -0.6; s <= 1.6 + 1e-6; s += 0.2) { const px = O.x + dx * s + nx * of, py = O.y + dy * s + ny * of; if (ok(px, py) && los(C0.x, C0.y, px, py)) { s0 = s; break; } }
      if (s0 == null) { cS[j] = 99; cR[j] = -1; continue; }
      let s = s0; while (s < RMAX && ok(O.x + dx * s + nx * of, O.y + dy * s + ny * of)) s += 0.2; cS[j] = s0; cR[j] = Math.min(RMAX, s - 0.1); }
    const colAt = of => { const j = Math.round(of / CW + J0); return j < 0 || j >= NC ? -1 : j; };
    /* ---- the waves: their own reach, width, front ---- */
    const waves = TR.map((t0, k) => { const fin = k === NB - 1; return { k, fin, t0, v: fin ? TUNE.vF : TUNE.v, range: fin ? TUNE.rangeF : TUNE.range, w0: fin ? TUNE.w0F : TUNE.w0, w1: fin ? TUNE.w1F : TUNE.w1, curv: fin ? TUNE.curvF : TUNE.curv, h: fin ? TUNE.hF : TUNE.h, trail: fin ? TUNE.trailF : TUNE.trail, dmg: fin ? finD : waveD, prev: -1, done: false, hits: new Map(), walls: new Uint8Array(NC), released: false }; });
    const hwAt = (w, s) => lerp(w.w0, w.w1, cl(s / w.range)), sNow = (w, t) => (t < w.t0 ? -1 : Math.min(w.range, w.v * (t - w.t0)));
    /* ---- the record (tests): the beats, every hit ---- */
    const S = { cast: ++STAT.casts, tier, NB, TR, DK, waveD, finD, A, C0, HP, O, log: [], hits: [], dead: -1, zoomOurs: false, cS, cR, NC, CW, J0, T_END, waves: waves.map(w => ({ k: w.k, fin: w.fin, t0: w.t0, v: w.v, range: w.range, curv: w.curv, w0: w.w0, w1: w.w1 })) };
    STAT.last = S;
    /* one wave's sweep this frame: every living enemy its front passed since the last frame (once a wave: the Map), on the floor it may cross */
    function sweep(w, t) {
      const s = sNow(w, t); if (s < 0 || w.done) return; const s0 = w.prev < 0 ? 0 : w.prev;
      for (const m of H.living()) { if (w.hits.has(m)) continue; const rx = m.x - O.x, ry = m.y - O.y, al = rx * dx + ry * dy, of = rx * nx + ry * ny, rr = (m.r || 0.4) * 0.6, cq = w.curv * of * of;
        if (al < -0.8 || al - rr > s - cq || al + rr < s0 - cq - TUNE.band) continue;   // (not reached yet, or already behind the front's last place)
        const sc = Math.max(0, Math.min(w.range, al + cq)); if (Math.abs(of) > hwAt(w, sc) + (m.r || 0.4) * 0.5) continue;   // (the width at its own place: the same whatever the frame step)
        const j = colAt(of); if (j < 0 || cR[j] < 0 || al < cS[j] - rr - 0.2 || al > cR[j] + rr) continue;   // (the floor it may cross: walls stop it)
        w.hits.set(m, 1); X.hitMon(m, w.dmg, C.dmgO(m.boss ? {} : { stun: w.fin ? TUNE.stunF : TUNE.stun }));
        if (!m.boss) H.push(m, m.x - dx, m.y - dy, w.fin ? TUNE.pushF : TUNE.push);   // (a push along the aim; H.push leaves a boss or a still one where it is)
        S.hits.push({ k: w.k, fin: w.fin, t, id: H.mons.indexOf(m), boss: !!m.boss, d: w.dmg }); }
      w.prev = s; if (s >= w.range - 1e-9) { w.done = true; S.log.push(['end', w.k, Math.round(t * 1000) / 1000, w.hits.size]); } }

    /* ---- the choreography: the eagle's pose at time t (its body's place relative to HP) ---- */
    const side = Math.random() < 0.5 ? 1 : -1, WP = G().WP, wmix = G().wmix;
    const P0 = [-dx * 12 + nx * side * 7, -dy * 12 + ny * side * 7, 6.2], P1 = [-dx * 4.5 + nx * side * 3.6, -dy * 4.5 + ny * side * 3.6, 1.5], P2 = [-dx * 1.3 + nx * side * 0.25, -dy * 1.3 + ny * side * 0.25, 1.75], P3 = [0, 0, TUNE.hoverZ];
    const bez = (u, i) => { const v = 1 - u; return v * v * v * P0[i] + 3 * v * v * u * P1[i] + 3 * v * u * u * P2[i] + u * u * u * P3[i]; };
    const bezD = (u, i) => { const v = 1 - u; return 3 * v * v * (P1[i] - P0[i]) + 6 * v * u * (P2[i] - P1[i]) + 3 * u * u * (P3[i] - P2[i]); };
    const WA = {}, WB = {}, WT = {};
    const nextK = t => { for (let k = 0; k < NB; k++) if (t < TR[k]) return k; return NB; };
    function wingAt(t) {
      if (t < TUNE.enter) { const u = t / TUNE.enter; if (u < 0.55) return wmix(WP.glide, WP.fold, 0.25 * (1 - u / 0.55), WT); if (u < 0.82) return wmix(WP.glide, WP.widest, eio((u - 0.55) / 0.27), WT); return wmix(WP.widest, WP.top, eio((u - 0.82) / 0.18), WT); }
      const k = nextK(t);
      if (k >= NB) { // the climb: strong beats rising away
        const t2 = t - T_LAST; if (t2 < 0.14) return wmix(WP.bottom, WP.bottom, 0, WT); const p = ((t2 - 0.14) / 0.46) % 1;
        if (p < 0.55) { const u = p / 0.55; return u < 0.5 ? wmix(WP.bottom, WP.mid, eio(u * 2), WT) : wmix(WP.mid, WP.top, eio(u * 2 - 1), WT); } return wmix(WP.top, WP.bottom, cosE((p - 0.55) / 0.45), WT); }
      const fin = k === NB - 1 && NB > 1, tp = k > 0 ? TR[k - 1] : TUNE.enter, dS = TR[k] - (fin ? TUNE.downF : TUNE.down), upEnd = fin ? tp + (TUNE.gap - TUNE.down) : dS;
      if (t >= dS) { const from = fin ? WP.widest : WP.top, u = cosE((t - dS) / (TR[k] - dS)); return wmix(from, WP.bottom, u, WT); }   // (the downstroke)
      if (k === 0) return wmix(WP.top, WP.top, 0, WT);   // (the flare ends at the top of a stroke)
      if (t >= upEnd) { const u = eio((t - upEnd) / 0.28), q = Math.sin((t - upEnd) * 23) * 0.025 * u; wmix(WP.top, WP.widest, u, WT); WT.elev += q; WT.fan += q; return WT; }   // (the inhale: the widest span, quivering)
      const u = cl((t - tp) / Math.max(0.05, upEnd - tp)); return u < 0.45 ? wmix(WP.bottom, WP.mid, eio(u / 0.45), WT) : wmix(WP.mid, WP.top, eio((u - 0.45) / 0.55), WT);   // (the upstroke: flexed, then reaching up)
    }
    const fadeIn = t => sstep(0, 0.14, t);
    let WZ = [];
    const warns = () => (X.zones || []).filter(z => z.kind === 'warn' && z.own !== 'pet');
    const overWarn = (z, x, y, pad) => { const ddx = x - z.x, ddy = y - z.y; if (z.shape === 'line' || z.shape === 'cone') { const ca = Math.cos(z.a || 0), sa = Math.sin(z.a || 0), al = ddx * ca + ddy * sa, of = -ddx * sa + ddy * ca, L = z.len || 1;
        if (al < -pad || al > L + pad) return false; return z.shape === 'line' ? Math.abs(of) < (z.w || 1) / 2 + pad : Math.abs(of) < Math.tan(Math.min(1.5, z.spread || 0.5)) * Math.max(0, al) + pad; }
      return Math.hypot(ddx, ddy) < (z.r || 1) + pad; };
    const GYc = G().GY, ZKc = G().ZK;
    const fadeAt = p => { const wx = HP.x + p[0], wy = HP.y + p[1], ddx = wx - me.x, dys = (wy - me.y) * GYc - p[2] * ZKc; let a = 1;
      if (!me.dead && Math.abs(ddx) < 0.62 && dys > -1.25 && dys < 0.3) a = 0.45;   // (over the pet's sprite: see-through, the player's view kept)
      for (const z of WZ) if (p[2] < 1.6 && overWarn(z, wx, wy, 0.3)) { a = Math.min(a, 0.55); break; }   // (low over an enemy's warning)
      return a; };
    function pose(t) {
      const w = wingAt(t), k = nextK(t), lastRel = k > 0 ? TR[k - 1] : -9, pulse = Math.exp(-Math.max(0, t - lastRel) * 7), inh = k === NB - 1 && NB > 1 && t > TR[k] - TUNE.downF - TUNE.inhale - 0.1 && t < TR[k] ? sstep(TR[k] - TUNE.downF - TUNE.inhale, TR[k] - TUNE.downF - 0.2, t) : 0;
      const P = { sc: TUNE.sc, t, k: tier, wing: w, glow: 0.75 + 0.6 * pulse + 0.7 * inh + 0.35 * sstep(-0.95, 0.4, -w.elev) * (k < NB ? 1 : 0), glow2: 0.55 * pulse * (k > 0 && k <= NB ? 1 : 0) + 0.35 * inh, spill: 0, fade: fadeAt, tail: { fan: 0.95, pitch: -0.35 }, head: {}, leg: 0.55, jaw: inh > 0.3 ? 0.55 * Math.sin(Math.PI * cl((inh - 0.3) / 0.7)) : 0 };
      if (t < TUNE.enter) { const u0 = t / TUNE.enter, u = 1 - Math.pow(1 - u0, 1.9), vx = bezD(u, 0), vy = bezD(u, 1), vz = bezD(u, 2), vh = Math.hypot(vx, vy) || 1e-6;
        P.x = bez(u, 0); P.y = bez(u, 1); P.z = bez(u, 2); P.yaw = Math.atan2(vy, vx); P.pitch = Math.atan2(vz, vh) * 0.7 + 0.55 * sstep(0.7, 1, u0); P.roll = -side * 0.8 * Math.sin(Math.PI * cl(u0 / 0.85)) * (1 - sstep(0.6, 0.9, u0));
        P.tail = { fan: lerp(0.35, 0.95, sstep(0.55, 0.95, u0)), pitch: lerp(0.05, -0.35, sstep(0.6, 1, u0)) }; P.leg = lerp(-0.5, 0.55, sstep(0.65, 1, u0)); P.glow = 0.8; P.glow2 = 0; }
      else { const bob = -0.14 * w.elev, rise = t > T_LEAVE ? Math.pow((t - T_LEAVE) / TUNE.leave, 1.6) : 0;
        P.x = -dx * 1.8 * rise; P.y = -dy * 1.8 * rise; P.z = TUNE.hoverZ + bob + 5.5 * rise; P.yaw = A; P.pitch = 0.5 + 0.08 * w.elev + 0.35 * sstep(0, 0.5, rise) + (k === NB && t - T_LAST < 0.3 ? -0.15 * Math.sin(Math.PI * (t - T_LAST) / 0.3) : 0); P.roll = 0;
        if (k === NB - 1 && NB > 1) P.leg = 0.55 + 0.35 * inh; if (k === NB && t - T_LAST < 0.4) P.leg = 0.9; }
      P.head = { pitch: -P.pitch * 0.8 + 0.05, yaw: 0 };
      if (t > T_LEAVE) P.spill = sstep(T_LEAVE + 0.1, T_GONE - 0.05, t);
      if (S.dead >= 0) P.spill = Math.max(P.spill, cl((t - S.dead) / 0.5));
      return P;
    }
    /* ---- the cosmetic pools (fixed sizes) ---- */
    const Qk = lowFx() ? 0.4 : 1, NF = Math.max(8, Math.round(TUNE.feathers * Qk)), NM = Math.max(8, Math.round(TUNE.motes * Qk)), ND = Math.max(10, Math.round(TUNE.dust * Qk));
    const FE = Array.from({ length: NF }, () => ({ on: false })), MO = Array.from({ length: NM }, () => ({ on: false })), DU = Array.from({ length: ND }, () => ({ on: false })), PU = Array.from({ length: 10 }, () => ({ on: false }));
    let nF = 0, nM = 0, nD = 0, nP = 0;
    const feather = (p, vx, vy, vz, life, burn) => { const q = FE[nF++ % NF]; Object.assign(q, { on: true, x: p[0], y: p[1], z: p[2], vx, vy, vz, t: 0, life, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 5, sd: Math.random(), cv: (Math.random() - 0.5) * 0.8, burn: !!burn, ph: Math.random() * TAU }); };
    const TRAIL = [[], []]; let trailT = 0;
    /* ---- the update: the authoritative clock ---- */
    let RG = null, RGt = -1, PZ = null;
    const rigNow = t => { if (RGt === t && RG) return RG; PZ = pose(t); RG = G().rig(PZ); RGt = t; return RG; };
    function update(dt, f) {
      const t = f.t, g = H.g;
      if (g !== g0) { f.life = 0; return; }   // (the stage changed under it)
      if (S.dead < 0 && (me.dead || g.over)) { S.dead = t; S.log.push(['dead', Math.round(t * 1000) / 1000]); f.life = Math.min(f.life, 0.6); if (S.zoomOurs && g.zoomP === TUNE.zoom) g.zoomT = Math.min(g.zoomT || 0, 0.05); }   // (the caster downed: a quick dissolve, no more hits)
      if (S.dead < 0) {
        for (const w of waves) {
          if (!w.released && t >= w.t0 - 1e-9) { w.released = true; STAT.waves++; S.log.push([w.fin ? 'fin' : 'wave', w.k, Math.round(w.t0 * 1000) / 1000]); release(w); }
          if (w.released) sweep(w, t); }
        if (TUNE.zoom !== 1 && t > TUNE.gesture && t < T_GONE && (g.zoomP === 1 || g.zoomP === TUNE.zoom)) { g.zoomP = TUNE.zoom; g.zoomT = Math.max(g.zoomT || 0, 0.12); S.zoomOurs = true; }
        if (!S.inh && NB > 1 && t >= TR[NB - 1] - TUNE.downF - TUNE.inhale) { S.inh = true; if (X.sfx.hum) X.sfx.hum(); if (X.sfx.chirp) X.sfx.chirp(); }
      }
      WZ = warns();
      // the cosmetics: the wingtips' trails, the inhale's motes, the dust at the waves' feet, the feathers' drift
      const R = t > 0.02 && t < T_GONE ? rigNow(t) : null; trailT += dt;
      if (R && trailT > 0.03) { trailT = 0; for (let i = 0; i < 2; i++) { const q = R.A.tips[i]; TRAIL[i].push([q[0], q[1], q[2], t]); while (TRAIL[i].length > 9) TRAIL[i].shift(); } }
      const kN = nextK(t), inhOn = S.dead < 0 && NB > 1 && kN === NB - 1 && t > TR[NB - 1] - TUNE.downF - TUNE.inhale && t < TR[NB - 1] - 0.05;
      if (inhOn && R) { const want = dt * 30 * H.Q(); let n = Math.floor(want) + (Math.random() < want % 1 ? 1 : 0); while (n-- > 0) { const q = MO[nM++ % NM], a = Math.random() * TAU; Object.assign(q, { on: true, a, r: 2.6 + Math.random() * 1.4, z: (Math.random() - 0.3) * 1.6, t: 0, life: 0.5 + Math.random() * 0.25, sp: 0.8 + Math.random() * 0.5 }); } }
      for (const q of MO) if (q.on) { q.t += dt; q.r = Math.max(0, q.r - dt * q.sp * 5.2 * (0.4 + q.t)); q.a += dt * 2.2; if (q.t >= q.life || q.r < 0.15) q.on = false; }
      for (const w of waves) { if (!w.released || S.dead >= 0) continue; const s = sNow(w, t); if (s < 0.3 || s >= w.range) continue; const want = dt * (w.fin ? 22 : 12) * H.Q(); let n = Math.floor(want) + (Math.random() < want % 1 ? 1 : 0);
        while (n-- > 0) { const of = (Math.random() * 2 - 1) * hwAt(w, s) * 0.92, j = colAt(of), sf = s - w.curv * of * of; if (j < 0 || cR[j] < sf || cS[j] > sf) continue; const q = DU[nD++ % ND];
          Object.assign(q, { on: true, x: O.x + dx * sf + nx * of, y: O.y + dy * sf + ny * of, z: 0.05, vx: dx * w.v * 0.35 + (Math.random() - 0.5) * 0.6, vy: dy * w.v * 0.35 + (Math.random() - 0.5) * 0.6, vz: 0.6 + Math.random() * 1.0, t: 0, life: 0.45 + Math.random() * 0.3, s: 0.05 + Math.random() * 0.05 }); }
        // a wave meeting a wall: a puff of dust and wind where its front stops
        for (let j = 0; j < NC; j += 3) { const of = (j - J0) * CW; if (w.walls[j] || cR[j] < 0 || cR[j] >= w.range - 0.2 || Math.abs(of) > hwAt(w, s)) continue; if (s - w.curv * of * of >= cR[j]) { w.walls[j] = 1; const q = PU[nP++ % PU.length]; Object.assign(q, { on: true, x: O.x + dx * cR[j] + nx * of, y: O.y + dy * cR[j] + ny * of, t: 0, life: 0.5, r: w.fin ? 0.9 : 0.6 }); } } }
      for (const q of DU) if (q.on) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz -= 2.5 * dt; q.vx *= 1 - dt * 2; q.vy *= 1 - dt * 2; if (q.t >= q.life || q.z < 0) q.on = false; }
      for (const q of PU) if (q.on) { q.t += dt; if (q.t >= q.life) q.on = false; }
      for (const q of FE) if (q.on) { q.t += dt; const dr = 1 - dt * 1.6; q.vx *= dr; q.vy *= dr; q.vz = q.vz * dr - 0.9 * dt; q.x += (q.vx + Math.sin(q.t * 3 + q.ph) * 0.4) * dt; q.y += q.vy * dt; q.z = Math.max(0.02, q.z + q.vz * dt); q.rot += q.vr * dt; if (q.t >= q.life) q.on = false; }
      // the dissolve: golden feathers shed from the whole bird
      if (R && t > T_LEAVE && (t < T_GONE || S.dead >= 0)) { const want = dt * 28 * H.Q(); let n = Math.floor(want) + (Math.random() < want % 1 ? 1 : 0); const pts = R.sh; while (n-- > 0) { const p = pts[Math.floor(Math.random() * pts.length)].p; feather(p, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.2, 0.3 + Math.random() * 1.2, 1.1 + Math.random() * 0.7, true); } }
      if (S.dead >= 0 && R && !S.deadBurst) { S.deadBurst = 1; for (let i = 0; i < Math.round(12 * H.Q()) + 2; i++) { const p = R.sh[i % R.sh.length].p; feather(p, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, Math.random() * 1.5, 0.9, true); } }
      if (t >= T_END) f.life = 0;
    }
    /* a release: the wave leaves the line under the wings; feathers shake loose; the shake, the sound */
    function release(w) {
      X.shake(w.fin ? TUNE.shake[1] : TUNE.shake[0], w.fin ? 0.3 : 0.14); if (X.sfx.whoosh) X.sfx.whoosh(); if (w.fin) { if (X.sfx.thud) X.sfx.thud(); if (X.flash) X.flash(0.07, '#CFFFEA'); }
      const R = rigNow(w.t0); for (const tr of R.A.trail) for (let i = 0; i < (lowFx() ? 1 : 2) + (w.fin ? 1 : 0); i++) { const p = tr[3 + Math.floor(Math.random() * 3)]; feather(p, -dx * 1.5 + (Math.random() - 0.5) * 1.5, -dy * 1.5 + (Math.random() - 0.5) * 1.5, -0.5 - Math.random(), 1.4 + Math.random() * 0.8, false); } }

    /* ================= drawing ================= */
    const sx = H.sx, sy = H.sy, GYs = () => H.GY || 0.55;
    const COLS = ['#000000', '#FF0000'];
    /* a wave's quads: its standing body (368) and light (369) on each stretch of its crescent, its trail (370) and shade (371) on the floor behind */
    function waveQuads(Q, w, t, T, layer) {
      const s = sNow(w, t); if (s < 0) return; const age = t - w.t0, endT = w.range / w.v;
      const aW = sstep(0, 0.06, age) * (1 - sstep(endT - 0.05, endT + 0.25, age)) * (1 - 0.35 * sstep(0.6 * w.range, w.range, s)) * (S.dead >= 0 ? Math.max(0, 1 - (t - S.dead) / 0.3) : 1); if (aW < 0.01) return;
      const hw = hwAt(w, s), hq = w.h * (0.25 + 0.75 * sstep(0, 0.2, age)) * (1 - 0.3 * sstep(0.65, 1, s / w.range)), NS = Math.max(8, Math.min(22, Math.ceil(2 * hw / 0.45))), dO = 2 * hw / NS, col = COLS[w.fin ? 1 : 0], GY = GYs();
      const vis = of => { const j = colAt(of); if (j < 0 || cR[j] < 0) return 0; const sf = s - w.curv * of * of; return sstep(cS[j] - 0.35, cS[j] + 0.05, sf) * (1 - sstep(cR[j] - 0.1, cR[j] + 0.25, sf)); };
      const V = []; for (let i = 0; i <= NS; i++) V.push(vis(-hw + i * dO));
      const lean = 0.65 * hq, Hx = dx * lean * T, Hy = (dy * lean * GY - hq * ZKc) * T, tl = w.trail * (0.45 + 0.55 * sstep(0, 0.3, age)), pad = tl * 0.12 / 0.88;
      for (let i = 0; i < NS; i++) { const a = Math.min(V[i], V[i + 1]); if (a < 0.02) continue;
        const of0 = -hw + i * dO, of1 = of0 + dO, s0 = s - w.curv * of0 * of0, s1 = s - w.curv * of1 * of1, x0 = O.x + dx * s0 + nx * of0, y0 = O.y + dy * s0 + ny * of0, x1 = O.x + dx * s1 + nx * of1, y1 = O.y + dy * s1 + ny * of1;
        const X0 = sx(x0), Y0 = sy(y0), X1 = sx(x1), Y1 = sy(y1), ux = (X1 - X0) / 2, uy = (Y1 - Y0) / 2, fl = (i === 0 || V[i - 1] < 0.02 ? 1 : 0) + (i === NS - 1 || V[i + 2] < 0.02 ? 2 : 0), q0 = of0 / hw, q1 = dO / hw + 4 * fl, q2 = s + 37 * w.k, al = aW * a;
        if (layer === 0) { // the floor: the shade and the trail behind the front (the quad reaching a little ahead of it, so the front's line is never cut)
          const bx = -dx * (tl + pad) / 2 * T, by = -dy * (tl + pad) / 2 * T * GY, cxq = (X0 + X1) / 2 + dx * pad * T + bx, cyq = (Y0 + Y1) / 2 + dy * pad * T * GY + by;
          Q.quad(371, cxq, cyq, ux, uy, bx, by, col, al, q0, q1, q2); Q.quad(370, cxq, cyq, ux, uy, bx, by, col, al, q0, q1, q2); }
        else { const cxq = (X0 + X1) / 2 + Hx / 2, cyq = (Y0 + Y1) / 2 + Hy / 2; Q.quad(368, cxq, cyq, ux, uy, -Hx / 2, -Hy / 2, col, al, q0, q1, q2); Q.quad(369, cxq, cyq, ux, uy, -Hx / 2, -Hy / 2, col, al, q0, q1, q2); } }
    }
    /* a curved ribbon of wind (375) from screen point a to b, bowed by m px (signed) at its middle, w px wide, alpha a0 at a .. a1 at b */
    function ribbon(Q, ax, ay, bx, by, m, w, col, a0, a1, al) { const ux = (bx - ax) / 2, uy = (by - ay) / 2, l = Math.hypot(ux, uy); if (l < 1 || al < 0.01) return; const px = -uy / l, py = ux / l, Hh = Math.abs(m) / 2 + 2.6 * w;
      Q.quad(375, (ax + bx) / 2 + px * m / 2, (ay + by) / 2 + py * m / 2, ux, uy, px * Hh, py * Hh, col, al, m / Hh, w / Hh, Math.floor(cl(a0) * 99) + cl(a1) * 0.99); }
    const ribbonThrough = (Q, A0, M0, B0, w, col, a0, a1, al) => { const ux = B0[0] - A0[0], uy = B0[1] - A0[1], l = Math.hypot(ux, uy) || 1, off = ((M0[0] - (A0[0] + B0[0]) / 2) * -uy + (M0[1] - (A0[1] + B0[1]) / 2) * ux) / l; ribbon(Q, A0[0], A0[1], B0[0], B0[1], off, w, col, a0, a1, al); };
    function drawUnder(c, f, Xs, Ys, T, t0) {
      const t = f.t, FG = fg(), V = { X0: Xs, Y0: Ys, k: T }, toS = G().toS, GY = GYs();
      const R = t > 0.02 && t < T_GONE + 0.05 ? rigNow(t) : null;
      if (R) { // the eagle's shaped shadow on the floor: its body's and wings' blobs, fainter and softer the higher it flies (drawn before the painter's pass: that pass lays light only)
        const B = blob(), sa = fadeIn(t) * (1 - (PZ ? PZ.spill : 0)); if (sa > 0.01) { c.save(); for (const q of R.sh) { const p = q.p, s0 = toS(V, [p[0], p[1], 0]), lift = Math.max(0, p[2]), rr = q.r * T * (1.25 + lift * 0.22); c.globalAlpha = Math.min(1, 0.4 * sa / (1 + lift * 0.45)); c.drawImage(B, s0[0] - rr, s0[1] - rr * GY, rr * 2, rr * 2 * GY); } c.restore(); } }
      if (FG) { const Q = FG.begin(c, null);
        for (const w of waves) if (w.released) waveQuads(Q, w, t, T, 0);
        // the pressure ring under each downstroke, spreading from the waves' line; the dust where a wave meets a wall
        for (const w of waves) { if (!w.released) continue; const e = t - w.t0; if (e < -0.12 || e > 0.6) continue; const u = cl((e + 0.12) / 0.72), r = T * (w.fin ? 3.2 : 2.4) * (0.35 + 0.65 * (1 - Math.pow(1 - u, 2)));
          Q.quad(373, sx(O.x), sy(O.y), r, 0, 0, r * GY, '#FFFFFF', (1 - u) * (S.dead >= 0 ? 0 : 1), 0.25 + 0.7 * u, w.k * 1.7, w.fin ? 1.3 : 0.9); }
        for (const q of PU) if (q.on) { const u = q.t / q.life; Q.glow(sx(q.x), sy(q.y), T * q.r * (0.6 + 0.8 * u), C_DUST, 0.3 * (1 - u), GY); Q.glow(sx(q.x), sy(q.y) - T * 0.2, T * q.r * 0.6 * (0.6 + u), C_MINT, 0.25 * (1 - u)); }
        for (const w of waves) if (w.released) waveQuads(Q, w, t, T, 1);
        for (const q of DU) if (q.on) { const a = (1 - q.t / q.life) * 0.5; Q.glow(sx(q.x), sy(q.y) - q.z * ZKc * T, T * q.s * 2.4, C_DUST, a); }
        FG.flush(c); return; }
      // ---- 2D: each wave as a feathered arc, its leading line bright ----
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (const w of waves) { if (!w.released) continue; const s = sNow(w, t), age = t - w.t0, endT = w.range / w.v, aW = sstep(0, 0.06, age) * (1 - sstep(endT - 0.05, endT + 0.25, age)) * (S.dead >= 0 ? 0 : 1); if (aW < 0.02 || s < 0) continue;
        const hw = hwAt(w, s), N = 16, pts = []; for (let i = 0; i <= N; i++) { const of = -hw + i * 2 * hw / N, j = colAt(of), sf = s - w.curv * of * of; if (j < 0 || cR[j] < sf || cS[j] > sf + 0.1) { pts.push(null); continue; } pts.push([sx(O.x + dx * sf + nx * of), sy(O.y + dy * sf + ny * of) - w.h * 0.5 * ZKc * T * (1 - Math.pow(of / hw, 2))]); }
        for (const [wd, colr, al] of [[T * 0.5, 'rgba(47,214,156,', 0.22], [T * 0.14, 'rgba(200,255,235,', 0.75]]) { c.strokeStyle = colr + (al * aW) + ')'; c.lineWidth = wd * (w.fin ? 1.4 : 1); c.beginPath(); let on = false; for (const p of pts) { if (!p) { on = false; continue; } if (!on) { c.moveTo(p[0], p[1]); on = true; } else c.lineTo(p[0], p[1]); } c.stroke(); } }
      c.restore();
    }
    function draw(c, f, Xs, Ys, T, t0) {
      const t = f.t, FG = fg(), V = { X0: Xs, Y0: Ys, k: T }, toS = G().toS, low = lowFx(), GY = GYs();
      const R = t > 0.02 && t < T_GONE + 0.05 ? rigNow(t) : null;
      // the eagle (the GPU model, else the painted one)
      if (R) { const fi = fadeIn(t); if (fi < 0.999) for (const it of R.inst) it.al *= fi;
        if (!G().drawGL(c, V, R, { t })) G().draw2D(c, V, R, { spill: PZ.spill, fade: p => fadeAt(p) * fi }); }
      const pet = [sx(me.x), sy(me.y) - T * 0.55, T * 0.62];
      if (FG) { const Q = FG.begin(c, pet);
        if (R) { const al = fadeIn(t) * (1 - PZ.spill), gl = PZ.glow, kN = nextK(t);
          // the eyes' bloom: bright emerald
          for (const e of R.A.eyes) { const q = toS(V, e); Q.glow(q[0], q[1], T * 0.16, '#3CFFAA', 0.5 * al * Math.min(1.6, gl)); Q.glow(q[0], q[1], T * 0.05, '#E8FFF4', 0.6 * al); }
          // the wingtips' trails: one curved ribbon each through its recent path
          for (let i = 0; i < 2; i++) { const H2 = TRAIL[i]; if (H2.length < 4) continue; const a = toS(V, H2[0]), m = toS(V, H2[Math.floor(H2.length / 2)]), b = toS(V, H2[H2.length - 1]); ribbonThrough(Q, a, m, b, T * 0.07, C_MINT, 0, 0.9, 0.55 * al * Math.min(1.4, gl)); }
          // a downstroke driving the air: streaks off each wingtip curving down to the waves' line, a compression glow under the wings
          if (kN < NB && S.dead < 0) { const fin = kN === NB - 1 && NB > 1, dS = TR[kN] - (fin ? TUNE.downF : TUNE.down), u = (t - dS) / (TR[kN] - dS);
            if (u > 0.15) { const k2 = sstep(0.15, 0.7, u), hw0 = fin ? TUNE.w0F : TUNE.w0; for (let i = 0; i < 2; i++) { const a = toS(V, R.A.tips[i]), sg = i === 0 ? 1 : -1, gx = O.x - HP.x + nx * sg * hw0 * 0.85, gy = O.y - HP.y + ny * sg * hw0 * 0.85, b = toS(V, [gx, gy, 0.1]);
                ribbon(Q, a[0], a[1], b[0], b[1], (i === 0 ? 1 : -1) * T * 0.6, T * (fin ? 0.11 : 0.08), C_MINT, 0.9, 0.2, k2 * al * 0.7); ribbon(Q, a[0], a[1], b[0], b[1], (i === 0 ? 1 : -1) * T * 1.1, T * 0.05, C_JADE, 0.6, 0.1, k2 * al * 0.5); }
              const ch = toS(V, [R.A.chest[0], R.A.chest[1], R.A.chest[2] - 0.6]); Q.glow(ch[0], ch[1], T * (fin ? 2.4 : 1.8), C_JADE, 0.16 * k2 * al, 0.6); } }
          // the inhale: a vortex of mint air streaming into its chest, motes drawn in
          if (NB > 1 && kN === NB - 1 && S.dead < 0) { const t1 = TR[NB - 1] - TUNE.downF - TUNE.inhale, k3 = sstep(t1, t1 + 0.35, t) * (1 - sstep(TR[NB - 1] - 0.12, TR[NB - 1], t)); if (k3 > 0.01) { const ch = toS(V, R.A.chest), rr = T * 3.6; Q.quad(372, ch[0], ch[1], rr, 0, 0, rr * 0.8, '#FFFFFF', k3 * al, k3, 0.37, 0); } }
          for (const q of MO) if (q.on) { const ch = R.A.chest, wx = ch[0] + Math.cos(q.a) * q.r, wy = ch[1] + Math.sin(q.a) * q.r * 0.6, wz = ch[2] + q.z * (q.r / 3), p = toS(V, [wx, wy, wz]), a = Math.sin(Math.PI * cl(q.t / q.life)) * 0.8; Q.glow(p[0], p[1], T * 0.12, C_MINT, a); Q.glow(p[0], p[1], T * 0.04, C_WHITE, a); }
          // the departure: fading ribbons of wind spiralling up round it as it dissolves
          if (PZ.spill > 0.02 && PZ.spill < 0.98) { const ch = R.A.chest, sp = PZ.spill; for (let i = 0; i < (low ? 2 : 4); i++) { const a0 = i / 4 * TAU + t * 2.2, r0 = 1.2 + sp * 1.5, p0 = toS(V, [ch[0] + Math.cos(a0) * r0, ch[1] + Math.sin(a0) * r0 * 0.6, ch[2] - 0.8 + sp]), p1 = toS(V, [ch[0] + Math.cos(a0 + 1.6) * r0 * 0.8, ch[1] + Math.sin(a0 + 1.6) * r0 * 0.5, ch[2] + 1.2 + sp * 2]);
              ribbon(Q, p0[0], p0[1], p1[0], p1[1], T * 0.9 * (i % 2 ? 1 : -1), T * 0.06, i % 2 ? C_MINT : C_CHAMP, 0.1, 0.9, Math.sin(Math.PI * sp) * 0.7); } } }
        // the release's flash of air along the waves' line (brief)
        for (const w of waves) { const e = t - w.t0; if (!w.released || e < 0 || e > 0.18 || S.dead >= 0) continue; Q.glow(sx(O.x), sy(O.y) - T * 0.4, T * (w.fin ? 2.6 : 1.7), C_WHITE, 0.3 * (1 - e / 0.18), 0.6); }
        // the golden feathers
        for (const q of FE) if (q.on) { const u = q.t / q.life, a = Math.min(1, q.t / 0.12) * (1 - sstep(0.7, 1, u)), p = toS(V, [q.x, q.y, q.z]); Q.rq(374, p[0], p[1], T * 0.26, T * 0.11, q.rot, '#FFFFFF', a * 0.95, q.sd, q.cv, q.burn ? sstep(0.2, 1, u) : 0); }
        FG.flush(c); return; }
      // ---- 2D: the eyes, the feathers ----
      if (R) for (const e of R.A.eyes) { const q = toS(V, e); H.glow(c, q[0], q[1], T * 0.14, '#3CFFAA', 0.45 * (1 - PZ.spill)); }
      for (const q of FE) if (q.on) { const u = q.t / q.life, p = toS(V, [q.x, q.y, q.z]); c.save(); c.globalAlpha = (1 - u) * 0.9; c.translate(p[0], p[1]); c.rotate(q.rot); c.fillStyle = q.burn ? '#FFE7A8' : '#E0B25A'; c.beginPath(); c.ellipse(0, 0, T * 0.22, T * 0.07, 0, 0, TAU); c.fill(); c.restore(); }
    }
    // (the feathers, the motes and the trails are kept in the rig's terms: relative to HP, drawn from its screen point; the dust and the puffs in world terms)
    const F = H.add({ key: 'goldeneagle', life: T_END + 0.25, x: HP.x, y: HP.y, update, drawUnder, draw, S, onEnd() { if (S.zoomOurs && H.g.zoomP === TUNE.zoom) H.g.zoomT = Math.min(H.g.zoomT || 0, 0.05); FE.length = 0; MO.length = 0; DU.length = 0; TRAIL[0].length = TRAIL[1].length = 0; } });
    return F;
  };
  /* (idle time, when a stage starts with it in a kit: 20b) the meshes built and uploaded before the first cast */
  U.goldeneagle.warm = () => { try { return GOLDEAGLE_GL.warm(); } catch (e) { return false; } };
  U.goldeneagle.TUNE = TUNE; U.goldeneagle.STAT = STAT; U.goldeneagle.tierOf = tierOf; U.goldeneagle.releases = releases;
})();
