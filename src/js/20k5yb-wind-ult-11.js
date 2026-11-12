/* ---------- Wind's 11th Ultimate: Belladonna (the core: worker A) ----------
   The pet floats at the heart of an enormous three-layer flower (four green leaves, the great pink bloom, the small
   pearl-white flower round it), six green tentacles behind the leaves, eight white ones reaching forward, and one ring
   of eight outward swords spinning overhead. It flies freely (Nidhogg's flight: over land, gaps and the open air round
   the map, a cruise height, a climb over walls, a flight volume, a safe return) until its timer ends or Twister is cast.
   This file is the session and nothing else's: the summon's choreography, the flight, the self-framing camera, Swoosh
   (the Dodge button: Dive Bomb's targeting and commitment as a banked, part-folded spiral pass round the enemy group,
   one hit per enemy, the whole route validated before it starts), the menu (Wildflowers, Ring Blade, Twister at a full
   gauge, once), the gauge, the timer as a game-clock deadline, the ring's overhead / outbound / returning state, the one
   guarded cleanup (timeout over open air, defeat, a party swap, a won floor), and the animation layer on the model's
   pose channels: breathing petals, swaying leaves, tentacles lagging the acceleration, the ring's spin and tilt, banking.
     the model:  BELLADONNA_MODEL (the lead, 20k5ya), or the stand-in below
     the moves:  self.BELLADONNA_MOVES (worker E, 20k5yc), or the stubs below: wildflowers, ringBlade, twister, and the
                 pictures swoosh / summon / exit
   The flower does not turn with the heading as a vehicle does: it stands behind the pet, facing the camera, and the
   steering banks, leans and yaws it a little (the brief's "Orientation"). The model is drawn at heading 0.
   Every hit goes through ctx.hit / ctx.hitArea / ctx.hitOval: effective damage charges the gauge (never Twister's:
   noCharge), and an area hit also breaks the scenery inside it through VEH_SMASH (20k0v).
   The contract with the lead, E and H is in docs/WIND-BELLADONNA-BRIEF.md, Notes (A). */
(() => {
  const U = ELEM_IMPL.wind.ult;
  const TAU = Math.PI * 2;
  const MINT = '#B8FFE0', MINT2 = '#E6FFF4', PINK = '#FF7FB6', BLUSH = '#FFD0E4', LEAF = '#4FD07A', GOLD = '#F4E6B0', WHITE = '#FFFFFF';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const wrap = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const outBack = (u, s) => { s = s == null ? 1.70158 : s; u = cl(u) - 1; return 1 + (s + 1) * u * u * u + s * u * u; };
  const inOut = u => { u = cl(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const bump = (u, a, b, c2) => sstep(a, b, u) * (1 - sstep(b, c2, u));
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const calm = () => typeof reduceMotion !== 'undefined' && reduceMotion;
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const GY = 0.72, ZK = 0.695;

  /* ================= the tuning ================= */
  const TUNE = {
    dur: [20, 25, 35],          /* s of flight at evo 1-3 / 4-6 / 7, from the lift-off */
    cd: 120,                    /* s: the Ult's cooldown, from the exit (the kit row's own cd is used when present) */
    size: 1,                    /* a multiplier on the model's own scale (the pink bloom about 5.5 tiles across) */
    petH: 0.7,                  /* the pet's height at the flower's heart, tiles */
    viewW: 9.5,                 /* tiles across a 390-wide phone view at zoom 1 */
    zoom: 0.8, camLift: 1.2,    /* the camera's zoom and lift at v318's full-size model (leaves 9.5 tiles across); camOf() rescales both from the model's SIZE, so a smaller flower is framed as closely, up to the game's own zoom 1 */
    /* the summon: the seal, the four leaves, the pink flower, the white flower, the tentacles, the ring, the lift-off */
    summon: 3.0,
    sum: { seal: [0, 0.5], leaves: [0.3, 1.0], bloom: [0.75, 1.5], white: [1.25, 1.75], tentG: [1.5, 2.2], tentW: [1.75, 2.4], ring: [2.05, 2.6], lift: [2.35, 3.0] },
    /* the flight (Nidhogg's): speed = the stat system's movement speed x airK */
    airK: 1.75, accel: 20, brake: 13, cruise: 2.4, wallZ: 3.2, climbV: 5, sinkV: 2.6, margin: 16,
    turn: { max: 6.0, k: 8, acc: 30 },
    /* Swoosh (Dodge): the bank onto the line, the approach to the circle, the spinning pass round the group, the opening
       and the climb back. One hit per enemy; the whole route is checked before it starts */
    swoosh: { bank: 0.16, approach: 0.3, orbit: 0.62, rec: 0.34, R: [2.5, 1.8, 1.2], z: 1.5, hitR: 2.3, dmg: 4, kb: 4, group: 3.6, reach: 11, cone: 0.6, cone2: 1.0, reach2: 6, inv: 0.06, turns: 1, spins: 2 },
    dodgeCd: 0.85,              /* s after the pass: the game's dodge cadence (x its arcane / dodgeK modifiers), as Dive Bomb's */
    wildCd: 3.5, ringCd: 4,     /* s: Wildflowers from the cast, Ring Blade from the catch (it cannot be recast while away anyway); E's BELLADONNA_MOVES.TUNE.wildCd / ringCd win when present */
    recallCap: 1.4,             /* s: Twister pressed while the ring is away waits this long at most for it to come back */
    chargeK: 32,                /* the gauge fills at chargeK x DK of damage actually dealt */
    finCap: 18, busyCap: 9,
    outGlide: [0.3, 1.3], outSpd: 13, outZ: 1.1, hop: 0.5, fold: 1.25,   /* the exit: the glide to the safe ground (s, tiles/s), the height it folds at, the pet's step down, the fold and dissolve */
    freshGap: 0.28, mvHold: 0.6,
  };
  const tierOf = ev => ev >= 7 ? 2 : ev >= 4 ? 1 : 0;

  /* ================= the model: BELLADONNA_MODEL (the lead), or a stand-in so the flow can run ================= */
  const STUBM = (() => {
    const A = {}, put = (n, x, y, z) => { const p = A[n] || (A[n] = { x: 0, y: 0, z: 0 }); p.x = x; p.y = y; p.z = z; };
    function frame(x, y, z, P, s) { const b = (P.bank || 0) + (P.spin || 0), cb = Math.cos(b), sb = Math.sin(b), at = (n, lx, lz) => put(n, x + (lx * cb - (lz - 1.6) * sb) * s, y, z + (1.6 + lx * sb + (lz - 1.6) * cb) * s);
      at('seat', 0, 1.25); at('center', 0, 1.6); at('ring', 0, 4.9); at('top', 0, 4.3); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + (P.ringSpin || 0); at('sword' + i, Math.cos(a) * 2.6, 4.9 + Math.sin(a) * 0.5); } for (let i = 0; i < 4; i++) at('leaf' + i, (i % 2 ? 1 : -1) * 2.6, i < 2 ? 2.8 : 0.4); }
    function ringAt(c, X0, Y0, T, P, s, al) { const r = T * 1.35 * s * cl(P.ring == null ? 1 : P.ring), g = cl((P.ringGlow || 0) / 2); if (r < 1) return; c.save(); c.globalAlpha = al; c.translate(X0, Y0); c.rotate((P.ringTilt || 0) * 0.5); c.strokeStyle = GOLD; c.lineWidth = T * 0.12 * s; c.beginPath(); c.ellipse(0, 0, r, r * 0.3, 0, 0, TAU); c.stroke(); c.strokeStyle = g > 0.3 ? MINT2 : '#DDE6E0'; c.lineWidth = T * 0.07 * s;
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + (P.ringSpin || 0), ca = Math.cos(a), sa = Math.sin(a) * 0.3; c.beginPath(); c.moveTo(ca * r * 1.05, sa * r * 1.05); c.lineTo(ca * r * 2.0, sa * r * 2.0); c.stroke(); } c.restore(); }
    return {
      stub: true, SIZE: { bloom: 5.5 },
      create() { return { pose: { alpha: 1 } }; }, warm() { return true; }, anchor(n) { return A[n] || null; }, anchorDir() { return null; },
      drawShadow(c, x, y, z, a, P, o) { const T = o.T, k = (P.alpha == null ? 1 : P.alpha) * 0.26 / (1 + z * 0.25) * cl((P.leaves || 0) + (P.bloom || 0)); if (k < 0.01) return; c.save(); c.globalAlpha = k; c.fillStyle = '#04140C'; c.beginPath(); c.ellipse(o.sx(x), o.sy(y), T * 2.2 * (o.scale || 1), T * 0.7 * (o.scale || 1), 0, 0, TAU); c.fill(); c.restore(); },
      drawRing(c, x, y, z, P, o) { ringAt(c, o.sx(x), o.sy(y) - z * ZK * o.T, o.T, P, o.scale || 1, P.alpha == null ? 1 : P.alpha); },
      draw(c, x, y, z, a, P, o) { const T = o.T, s = o.scale || 1, al = P.alpha == null ? 1 : P.alpha; frame(x, y, z, P, s);
        const X0 = o.sx(x), Y0 = o.sy(y) - (z + 1.6 * s) * ZK * T, pet = () => { if (o.pet) { const p = A.seat; o.pet(c, o.sx(p.x), o.sy(p.y) - p.z * ZK * T); } };
        if (al < 0.01) { pet(); return; }
        const bl = P.bloom || 0, lv = cl(P.leaves || 0), wh = cl(P.white || 0), tg = cl(P.tentG || 0), tw = cl(P.tentW || 0), fo = cl(P.fold || 0), sw = P.sway || 0, ax = P.accX || 0, ay = P.accY || 0;
        c.save(); c.globalAlpha = al; c.translate(X0, Y0); c.rotate((P.bank || 0) + (P.spin || 0)); c.transform(1, 0, (P.yaw || 0) * 0.3, 1 - Math.abs(P.lean || 0) * 0.25, 0, 0);
        /* six green tentacles behind the leaves */
        c.lineCap = 'round'; c.strokeStyle = '#2FA45A'; c.lineWidth = T * 0.16 * s;
        for (let i = 0; i < 6; i++) { const sd = i < 3 ? -1 : 1, k = i % 3, ang = (-0.6 + k * 0.6), L = T * 3.6 * s * tg; if (L < 2) continue; c.beginPath(); c.moveTo(sd * T * 1.4 * s, 0); c.quadraticCurveTo(sd * (T * 1.6 * s + L * 0.6) - ax * T * 0.5, Math.sin(ang) * L * 0.4 + Math.sin(sw + i) * T * 0.15 - ay * T * 0.3, sd * (T * 1.4 * s + L * Math.cos(ang) * 0.9) - ax * T, Math.sin(ang) * L - T * 0.5 * s + Math.sin(sw * 1.3 + i * 2) * T * 0.25 - ay * T * 0.6); c.stroke(); }
        /* four leaves */
        for (let i = 0; i < 4; i++) { const sx2 = i % 2 ? 1 : -1, sy2 = i < 2 ? -1 : 1; c.save(); c.rotate(sx2 * sy2 * (0.75 + 0.03 * Math.sin(sw + i))); c.fillStyle = i < 2 ? '#3FBF6A' : '#35A85C'; c.beginPath(); c.ellipse(sx2 * T * 1.9 * s * lv, 0, T * 1.6 * s * lv, T * 0.75 * s * lv, 0, 0, TAU); c.fill(); c.restore(); }
        /* the pink flower */
        for (let i = 0; i < 7; i++) { const a2 = i / 7 * TAU + 0.2; c.save(); c.rotate(a2); c.fillStyle = i % 2 ? '#FF5FA0' : '#FF86B8'; c.beginPath(); c.ellipse(T * 1.35 * s * cl(bl) * (1 - 0.3 * fo), 0, T * 1.45 * s * Math.min(1.3, bl) * (1 - 0.35 * fo), T * 0.95 * s * Math.min(1.2, bl), 0, 0, TAU); c.fill(); c.restore(); }
        /* the white flower */
        for (let i = 0; i < 6; i++) { const a2 = i / 6 * TAU; c.save(); c.rotate(a2); c.fillStyle = '#FFF6EE'; c.beginPath(); c.ellipse(T * 0.55 * s * wh, 0, T * 0.6 * s * wh, T * 0.36 * s * wh, 0, 0, TAU); c.fill(); c.restore(); }
        c.restore();
        pet();
        /* eight white tentacles, reaching forward (drawn over the bloom, clear of the pet's corridor) */
        c.save(); c.globalAlpha = al; c.translate(X0, Y0); c.rotate((P.bank || 0) + (P.spin || 0)); c.lineCap = 'round'; c.strokeStyle = '#F4EEE6'; c.lineWidth = T * 0.07 * s;
        for (let i = 0; i < 8; i++) { const sd = i < 4 ? -1 : 1, k = i % 4, L = T * 2.9 * s * tw; if (L < 2) continue; const ang = -0.75 + k * 0.5; c.beginPath(); c.moveTo(sd * T * 0.55 * s, Math.sin(ang) * T * 0.3 * s); c.quadraticCurveTo(sd * (T * 0.6 * s + L * 0.5) - ax * T * 0.4, Math.sin(ang) * L * 0.25 + T * 0.2 * s - ay * T * 0.2, sd * (T * 0.5 * s + L * Math.cos(ang)) - ax * T * 0.8, Math.sin(ang) * L + T * 0.5 * s + Math.sin(sw * 1.6 + i) * T * 0.14 - ay * T * 0.5); c.stroke(); }
        c.restore();
        if (!(P.ringAway > 0.5)) { const p = A.ring; ringAt(c, o.sx(p.x), o.sy(p.y) - p.z * ZK * T, T, P, s, al); } },
    };
  })();
  /* the framing for the model as it is now: the zoom that keeps the assembly filling the view as it did at v318 (capped at the game's 1), the lift scaled with it */
  function camOf(M0) { let Z = null, Lf = null; try { const SZ = M0 && M0.SIZE; if (SZ) { if (+SZ.tentSpan > 1) Z = clamp(TUNE.viewW / SZ.tentSpan, TUNE.zoom, 1); else if (+SZ.leafSpan > 1) Z = clamp(TUNE.zoom * 9.5 / SZ.leafSpan, TUNE.zoom, 1); if (+SZ.ringH > 0.5) Lf = clamp(0.25 * SZ.ringH, 0.4, 1.4); } } catch (e) { Z = null; }
    /* (the green tendrils' tip-to-tip span fills the phone's width: 9.5 tiles at zoom 1 on a 390-wide view; the lift keeps the ring on the screen) */
    return { zoom: Z == null ? TUNE.zoom : Z, lift: Lf == null ? TUNE.camLift : Lf }; }
  const MOD = () => (typeof BELLADONNA_MODEL !== 'undefined' && BELLADONNA_MODEL && BELLADONNA_MODEL.draw ? BELLADONNA_MODEL : STUBM);

  /* ================= E's moves (looked up at call time), or stubs so the flow can run ================= */
  const STUB = {
    stub: true, TUNE: {}, stats: { wildTicks: 0, ringHits: 0, twisterTicks: 0, tornadoes: 0 },
    /* one bounded field at the aim: ticks at a cadence for a finite time; a recast refreshes it */
    wildflowers(ctx) { const T = ctx.target(), F = { x: T.x, y: T.y, r: 4.2, n: 0, max: 8, every: 0.4, t0: ctx.now() + 0.35 }; ctx.field = F; let t = 0;
      const f = ctx.H.add({ key: 'belladonna-moves', life: 9, update(dt) { if (!ctx.alive()) { f.life = 0; return; } t += dt; ctx.clip('cast', cl(t / 0.45)); if (t >= 0.45) { f.life = 0; ctx.done(); } } });
      if (!STUB.fieldFx || STUB.fieldFx.life <= 0 || STUB.fieldCtx !== ctx) { STUB.fieldCtx = ctx; STUB.fieldFx = ctx.H.add({ key: 'belladonna-moves', life: 30, update() { const f = ctx.field; if (!f || !ctx.alive()) { STUB.fieldFx.life = 0; ctx.field = null; return; }
        while (f.n < f.max && ctx.now() >= f.t0 + f.n * f.every) { f.n++; STUB.stats.wildTicks++; ctx.hitArea(f.x, f.y, f.r, ctx.DK * 1.1, {}); ctx.X.ring(f.x, f.y, 0.5, f.r, 0.35, PINK, 0.2); } if (f.n >= f.max) { STUB.fieldFx.life = 0; ctx.field = null; } } }); } },
    /* the ring thrown to the aim and back: the sweep and the flourish are one activation per enemy; the return is harmless */
    ringBlade(ctx) { const T = ctx.target(), a0 = ctx.anchor('ring'), once = {}, tx = T.x, ty = T.y; let t = 0, ph = 0, p = { x: a0.x, y: a0.y, z: a0.z };
      const f = ctx.H.add({ key: 'belladonna-moves', life: 9, update(dt) { if (!ctx.alive()) { f.life = 0; ctx.ringState('overhead'); return; } t += dt;
        if (ph === 0) { ctx.clip('ringWind', cl(t / 0.3)); if (t >= 0.3) { ph = 1; t = 0; ctx.ringState('outbound'); ctx.done(); } return; }
        if (ph === 1) { const u = cl(t / 0.5); p = { x: lerp(a0.x, tx, u), y: lerp(a0.y, ty, u), z: lerp(a0.z, 0.9, u) }; STUB.stats.ringHits += ctx.hitArea(p.x, p.y, 2.2, ctx.DK * 4.5, { once, kb: 3 }); if (u >= 1) { STUB.stats.ringHits += ctx.hitArea(tx, ty, 3.2, ctx.DK * 4.5, { once, kb: 4 }); ctx.X.ring(tx, ty, 0.4, 3.2, 0.4, MINT, 0.3); ph = 2; t = 0; ctx.ringState('returning'); } }
        else { const b = ctx.anchor('ring'), u = cl(t / (ctx.recall ? 0.25 : 0.5)); p = { x: lerp(tx, b.x, u), y: lerp(ty, b.y, u), z: lerp(0.9, b.z, u) }; if (u >= 1) { f.life = 0; ctx.ringState('overhead'); ctx.kick('ringGlow', 6); } }
        STUB.ringP = p; },
        drawEnt(c) { if (ph > 0 && ctx.model.drawRing) ctx.model.drawRing(c, p.x, p.y, p.z, Object.assign({}, ctx.poseObj, { ringAway: 0 }), { T: ctx.T(), sx: ctx.H.sx, sy: ctx.H.sy, scale: 1 }); } }); },
    /* six tornadoes orbiting the flower: fixed ticks, one registry per tick across the six, a last pulse */
    twister(ctx) { const V = ctx.vehicle, n = 12, every = 0.35, R = 4.6; let t0 = -1, k = 0, t = 0; STUB.stats.tornadoes = 6;
      const f = ctx.H.add({ key: 'belladonna-moves', life: 14, update(dt) { if (!ctx.alive()) { f.life = 0; return; } t += dt; if (t < 0.9) { ctx.clip('twisterOpen', t / 0.9); return; }
        if (t0 < 0) { t0 = ctx.now(); ctx.twisterPlan = { t0, t1: t0 + n * every, ticks: n, tick: every, tornadoes: 6 }; } const e = ctx.now() - t0; ctx.clip('twisterHold', cl(e / (n * every)));
        while (k < n && e >= (k + 1) * every) { k++; STUB.stats.twisterTicks++; const once = {}, last = k === n; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + e * 1.1, x = V.x + Math.cos(a) * R, y = V.y + Math.sin(a) * R * 0.8; ctx.hitArea(x, y, last ? 3 : 2.1, ctx.DK * (last ? 18 : 7), { once, noCharge: true, kb: 1 }); if (!ctx.low()) ctx.X.ring(x, y, 0.3, 2.1, 0.3, i % 2 ? PINK : MINT, 0.2); } }
        if (e >= n * every + 0.5) { f.life = 0; ctx.safeReturn(); ctx.done(); } } }); },
    swoosh(ctx, D) { ctx.X.ring(D.cx, D.cy, 0.5, D.R + D.hitR, 0.6, MINT, 0.25); },
  };
  function moves() { let FM = null; try { FM = typeof self !== 'undefined' && self.BELLADONNA_MOVES ? self.BELLADONNA_MOVES : null; } catch (e) { FM = null; } return FM || STUB; }
  const mvFn = name => { const MV = moves(); return typeof MV[name] === 'function' ? [MV, MV[name]] : [STUB, STUB[name]]; };
  const mvTune = (k, d) => { const M = moves(); return M && M.TUNE && typeof M.TUNE[k] === 'number' ? M.TUNE[k] : d; };
  function callMove(S, name, a, b) { const [MV, fn] = mvFn(name); if (!fn) return null; try { return fn.call(MV, S.ctx, a, b); } catch (e) { if (typeof console !== 'undefined') console.warn('Belladonna: ' + name + ' failed', e); return null; } }

  /* ================= the animation: targets built each frame, composed through per-channel springs =================
     The channels written to the model's pose (the brief's list; angles in rad):
       alpha   bloom (0 bud .. 1 open .. 1.3 spread)   leaves   white   tentG   tentW   ring (0..1 formed)
       ringSpin (accumulated)   ringTilt   ringGlow (0..2)   ringAway (1 while E draws it thrown)
       fold (0..1 petals swept back)   bank (roll, + to the screen's right side down)   lean (+ forward, toward its travel
       down the screen)   yaw (+ toward the screen's right, at most 0.44)   sway (accumulated phase)
       accX, accY (the tentacles' lag: the acceleration on the screen, about -1..1, already sprung so it swings and settles)
       glow (0..2)   brace (0..1)
     and one of A's own, for the lead to use or ignore: spin (rad, the whole flower's roll about the view axis during
     Swoosh, whole turns; it returns to a multiple of 2 pi) */
  function spring(S, key, target, w, z, dt) { const A = S.an; let s = A[key]; if (!s) s = A[key] = { x: target, v: 0 }; if (!isFinite(s.x) || !isFinite(s.v)) { s.x = target; s.v = 0; }
    let left = Math.min(dt, 0.1); while (left > 1e-5) { const h = Math.min(left, 1 / 120); s.v += (-2 * z * w * s.v - w * w * (s.x - target)) * h; s.x += s.v * h; left -= h; } return s.x; }
  const kick = (S, key, dv) => { const s = S.an[key]; if (s) s.v += dv; };
  const SPR = { bloom: [7.5, 0.34], leaves: [5.5, 0.32], white: [8.5, 0.32], tentG: [4.6, 0.3], tentW: [5.6, 0.28], ring: [9, 0.32], ringTilt: [4.5, 0.25], ringGlow: [10, 0.7], fold: [9, 0.45], bank: [6, 0.28], lean: [6, 0.3], yaw: [5, 0.32],
    accX: [4.4, 0.2], accY: [4.4, 0.2], glow: [8, 0.8], brace: [9, 0.4], z: [7, 0.32] };
  const TG = () => ({ shiver: 0, tremble: 0, bloom: 1, leaves: 1, white: 1, tentG: 1, tentW: 1, ring: 1, ringTilt: 0, ringGlow: 0.6, fold: 0, bank: 0, lean: 0, yaw: 0, accX: 0, accY: 0, glow: 0.5, brace: 0, z: 0, spinV: 1.5, swayV: 1.6 });
  /* the action clips E plays with ctx.clip(name, u, extra) (u 0..1 each frame while it lasts); also ctx.pose */
  const CLIPS = {
    /* Wildflowers' cast: the pink bloom gathers a breath, then opens wider than its rest and glows */
    cast(G, u) { const a = bump(u, 0, 0.22, 0.34), o = outBack(cl((u - 0.28) / 0.35), 2.2); G.bloom = 1 - 0.15 * a + 0.25 * o * (u > 0.28 ? 1 : 0); G.white = 1 - 0.12 * a + 0.12 * o * (u > 0.28 ? 1 : 0); G.leaves = 1 - 0.06 * a + 0.04 * o; G.tentG = 1 - 0.14 * a + 0.1 * (u > 0.28 ? o : 0); G.tentW = 1 - 0.16 * a + 0.18 * (u > 0.28 ? o : 0); G.accY = 0.5 * a - 0.6 * bump(u, 0.28, 0.4, 0.75);
      G.glow = 0.6 + 0.9 * o + 0.6 * bump(u, 0.3, 0.55, 0.9); G.fold = 0; G.lean += 0.06 * a - 0.1 * o; G.ringGlow = 1; G.swayV = 1.4 + 2.8 * bump(u, 0.28, 0.4, 1); G.shiver = 0.035 * bump(u, 0.28, 0.36, 0.8); },   /* (it gathers inward, then bursts open with a shiver of the petals; the tentacles flick out) */
    /* Ring Blade: the ring brightens and the swords accelerate; the throw's lunge; the catch */
    /* (it leans back away from the throw, the tentacles drawn back; the throw lunges and flings them forward; the catch recoils it all) */
    ringWind(G, u, s) { const d = s.throwDir || 1, b = sstep(0, 0.8, u); G.ringGlow = 0.8 + 1.2 * u; G.spinV = 1.5 + 16 * u * u; G.ringTilt -= 0.42 * b; G.lean -= 0.2 * b; G.bank = -d * 0.18 * b; G.bloom = 1 + 0.08 * u; G.accX = d * 0.9 * b; G.accY = 0.4 * b; G.tentW = 1 - 0.1 * b; G.tentG = 1 - 0.08 * b; G.tremble = 0.006 * u; },
    ringThrow(G, u, s) { const d = s.throwDir || 1, f = bump(u, 0, 0.18, 0.8); G.ringGlow = 2; G.spinV = 18; G.ringTilt += 0.5 * bump(u, 0, 0.2, 0.7); G.lean += 0.32 * f; G.bank = d * 0.22 * f; G.bloom = 1.12; G.fold = 0.2 * f; G.accX = -d * 1.3 * f; G.accY = -0.7 * f; G.tentW = 1 + 0.18 * f; G.tentG = 1 + 0.1 * f; G.swayV = 3.5; },
    ringCatch(G, u) { const r = bump(u, 0, 0.15, 0.6); G.ringGlow = 2 * (1 - u) + 0.6; G.spinV = lerp(14, 1.5, u); G.lean -= 0.16 * r; G.bloom = 1 - 0.06 * r; G.tentW = 1 - 0.08 * r; G.accY = 0.6 * r; },
    /* Twister: the flower opens fully, the leaves brace, the white blossom glows, the ring spins up; the hold; the last pulse; the unwinding */
    twisterOpen(G, u) { const o = outBack(u, 1.4); G.tremble = 0.004 + 0.014 * u * u; G.shiver = 0.012 * u; G.bloom = 1 + 0.3 * o; G.brace = sstep(0.1, 0.7, u); G.glow = 0.6 + 1.2 * u; G.ringGlow = 0.8 + 1.2 * u; G.spinV = 1.5 + 14 * u; G.fold = 0; G.tentG = 1 + 0.06 * u; G.tentW = 1 + 0.1 * u; G.swayV = 1.6 + 1.4 * u; G.bank = 0; G.yaw = 0; G.lean = -0.06 * u; },
    twisterHold(G, u, s) { const t = s.g.t; G.tremble = 0.016 + 0.022 * u; G.shiver = 0.012 + 0.016 * u; G.accX = 0.35 * Math.sin(t * 2.6); G.accY = 0.3 * Math.cos(t * 2.1); G.bloom = 1.3 + 0.03 * Math.sin(t * 5); G.brace = 1; G.glow = 1.6 + 0.3 * Math.sin(t * 7) + 0.1 * u; G.ringGlow = 2; G.spinV = 16 + 8 * u; G.fold = 0; G.tentW = 1.1; G.tentG = 1.06; G.swayV = 3; G.bank = 0.04 * Math.sin(t * 2.3); G.yaw = 0; G.lean = -0.06; },
    twisterPulse(G, u) { CLIPS.twisterHold(G, 1, CLIPS._s); const r = bump(u, 0, 0.12, 1); G.tremble = 0.03 * (1 - u); G.bloom = 1.3 + 0.12 * r; G.tentW = 1.1 + 0.12 * r; G.tentG = 1.06 + 0.08 * r; G.accY = -0.9 * r; G.shiver = 0.04 * r; G.glow = 2; G.ringGlow = 2; },   /* (the release: everything flung open) */
    unwind(G, u) { G.tremble = 0.01 * (1 - u); G.bloom = lerp(1.3, 1, u); G.brace = 1 - u; G.glow = lerp(1.6, 0.5, u); G.ringGlow = lerp(2, 0.6, u); G.spinV = lerp(16, 1.5, u); },
  };
  function eClip(S) { const E = S.eAct; return E && S.g.t - E.t <= 0.12 && CLIPS[E.clip] ? E : null; }
  function animate(S, dt) {
    const V = S.V, P = V.pose, g = S.g, t = g.t, G = TG(), top = Math.max(1, S.spd * TUNE.airK), sp = Math.hypot(V.vx, V.vy), k = cl(sp / top), Sw = S.swoosh;
    /* the acceleration on the screen (x right, y down the screen = toward the camera), smoothed: the tentacles swing against it */
    const ax = dt > 0 ? (V.vx - (S.pvx == null ? V.vx : S.pvx)) / dt : 0, ay = dt > 0 ? (V.vy - (S.pvy == null ? V.vy : S.pvy)) / dt : 0; S.pvx = V.vx; S.pvy = V.vy;
    S.axS = (S.axS || 0) + (clamp(ax / 17, -1.5, 1.5) - (S.axS || 0)) * Math.min(1, dt * 10); S.ayS = (S.ayS || 0) + (clamp(ay / 17, -1.5, 1.5) - (S.ayS || 0)) * Math.min(1, dt * 10);
    /* --- flight: everything breathes; the bloom banks into the turn and leans along its travel, the petals sweep back with speed --- */
    /* the breath: a 3 s cycle that ripples outward, the white flower first, then the pink bloom, then the leaves */
    const bw = TAU / 3, br = t * bw;
    G.white = 1 + 0.05 * Math.sin(br + 0.75); G.bloom = 1 + 0.05 * Math.sin(br) + 0.012 * Math.sin(t * 2.7 + 1.3); G.leaves = 1 + 0.035 * Math.sin(br - 0.8) + 0.015 * Math.sin(t * 0.77 + 2.1);
    /* the tentacles: the green ones coil and uncoil their tips slowly, the white ones reach and draw back like feelers (each on its own beat in the model) */
    G.tentG = 1 - 0.08 * (0.5 + 0.5 * Math.sin(t * 0.71 + 0.4)) + 0.02 * Math.sin(t * 1.9);
    G.tentW = 1 + 0.07 * Math.sin(t * 1.27 + 0.5) + 0.03 * Math.sin(t * 2.3 + 1.1);
    /* the hover: a gentle bob and a slow drift side to side, rolling a little into it */
    G.z = 0.14 * Math.sin(t * 1.7) + 0.05 * Math.sin(t * 2.9 + 1); S.swayX = 0.12 * Math.sin(t * 0.83) * (1 - 0.6 * k);
    const vxn = V.vx / top, vyn = V.vy / top;
    /* into the travel: it rolls and pitches toward where it goes, on springs that overshoot and settle (a stop swings it past and back) */
    G.bank = clamp(vxn * 0.32 + S.hw * 0.035 * k - S.axS * 0.08, -0.55, 0.55) + 0.04 * Math.sin(t * 0.83 + 0.6); G.yaw = clamp(vxn * 0.34, -0.4, 0.4) + 0.045 * Math.sin(t * 0.61); G.lean = clamp(vyn * 0.22 - S.ayS * 0.06, -0.26, 0.26) + 0.025 * Math.sin(t * 1.13 + 2);
    /* the tentacles' lag: they swing against every change of speed (strongly), and drift on their own when it hangs still */
    G.fold = 0.3 * k * k; G.accX = -S.axS * 1.15 - vxn * 0.4 + (0.24 * Math.sin(t * 0.53) + 0.1 * Math.sin(t * 1.31 + 2)) * (1 - 0.5 * k); G.accY = -S.ayS * 1.15 - vyn * 0.4 + (0.18 * Math.sin(t * 0.61 + 1) + 0.08 * Math.sin(t * 1.7)) * (1 - 0.5 * k);
    /* the ring: a steady spin, a slow wobble in its tilt, leaning into the turn */
    G.ringTilt = G.bank * 0.9 + clamp(S.hw * 0.05, -0.3, 0.3) + 0.07 * Math.sin(t * 0.9) + 0.035 * Math.sin(t * 2.1 + 1); G.spinV = 1.5 + 1.4 * k; G.swayV = 1.6 + 0.35 * Math.sin(t * 0.37) + 1.0 * k;
    G.glow = 0.5 + 0.25 * S.charge + (S.charge >= 1 && !S.used ? 0.35 + 0.15 * Math.sin(t * 5) : 0); G.ringGlow = 0.6 + 0.3 * k + (S.charge >= 1 && !S.used ? 0.9 + 0.3 * Math.sin(t * 6) : 0);
    /* --- reactions: a shudder and a flutter of the petals when the pet is hurt; a happy bloom when the gauge fills; a flick outward of every tentacle at each attack --- */
    { const hu = S.hurtT != null ? t - S.hurtT : 9, hp = S.happyT != null ? t - S.happyT : 9, fl = S.flickT != null ? t - S.flickT : 9;
      if (hu < 0.5) { const e = Math.exp(-hu * 7); G.shiver += 0.04 * e; G.tremble += 0.02 * e; G.bloom -= 0.06 * e; G.tentW -= 0.08 * e; }
      if (hp < 0.9) { const e = bump(hp, 0, 0.15, 0.9); G.bloom += 0.16 * e; G.white += 0.12 * e; G.leaves += 0.05 * e; G.tentW += 0.1 * e; G.glow += 0.8 * e; G.ringGlow += 0.8 * e; G.shiver += 0.02 * e; }
      if (fl < 0.55) { const e = bump(fl, 0, 0.08, 0.55); G.tentG += 0.1 * e; G.tentW += 0.16 * e; G.swayV += 3.5 * e; } }
    /* --- the summon: the layers unfold in order (stepSummon writes their targets) --- */
    if (S.phase === 'out' && S.exitShiver) G.shiver += S.exitShiver;
    if (S.phase === 'summon' || S.phase === 'out') { const Q = S.unf; G.leaves = Q.leaves; G.bloom = Q.bloom * G.bloom; G.white = Q.white; G.tentG = Q.tentG; G.tentW = Q.tentW; G.ring = Q.ring; G.glow = Q.glow; G.ringGlow = Q.ringGlow; G.fold = Q.fold || 0; G.spinV = Q.spinV == null ? G.spinV : Q.spinV; }
    /* --- Swoosh: banked hard into the circle, the petals swept back, the whole flower spinning; then it opens --- */
    if (Sw) { const T = TUNE.swoosh;
      if (Sw.ph === 0) { const u = cl(Sw.t / T.bank); G.bank = Sw.dir * 0.45 * u; G.fold = 0.5 * u; G.bloom = 1 - 0.1 * u; G.white = 1 - 0.08 * u; G.lean = 0.12 * u; G.tentW = 1 - 0.1 * u; }
      else if (Sw.ph === 1) { G.bank = Sw.dir * 0.6; G.fold = 0.75; G.bloom = 0.88; G.lean = 0.18; G.ringGlow = 1.4; G.spinV = 9; G.swayV = 3.6; G.accY = -0.9; G.tentW = 1.08; }
      else if (Sw.ph === 2) { const u = cl(Sw.t / T.orbit); G.bank = Sw.dir * 0.55; G.fold = 0.7; G.bloom = 0.9; G.ringGlow = 1.8; G.glow = 1.1; G.spinV = 14; G.swayV = 4.2; G.yaw = 0; G.lean = 0.1;
        G.accX = -Sw.dir * 1.3 * Math.cos(u * TAU * T.turns) - 0.35 * Sw.dir; G.accY = -Sw.dir * 1.1 * Math.sin(u * TAU * T.turns); G.ringTilt = Sw.dir * 0.5; G.tentW = 1.16; G.tentG = 1.1; G.leaves = 0.94; G.white = 0.94; }   /* (the tentacle tips trail the pinwheel: the lag turns with it) */
      else { const u = cl(Sw.t / T.rec), fl = bump(u, 0, 0.18, 1); G.bloom = 1 + 0.15 * fl; G.white = 1 + 0.12 * fl; G.leaves = 1 + 0.05 * fl; G.tentW = 1 + 0.14 * fl; G.shiver = 0.03 * bump(u, 0, 0.12, 0.7); G.fold = 0; G.accX = Sw.dir * 0.5 * (1 - u); G.bank = Sw.dir * 0.2 * (1 - u); G.glow = 1.2 * (1 - u) + 0.5; G.ringGlow = 1.4 * (1 - u) + 0.6; G.spinV = lerp(12, 1.5, u); }
      G.yaw = clamp(G.yaw, -0.2, 0.2); }
    /* --- E's clip, last: it owns the channels it sets --- */
    const E = eClip(S); if (E) { CLIPS._s = S; try { CLIPS[E.clip](G, E.u, S, E.extra); } catch (e) { /* (a clip never breaks the frame) */ } }
    for (const key in SPR) { const p = SPR[key]; P[key] = spring(S, key, G[key], p[0], p[1], dt); }
    S.ringSpin = (S.ringSpin || 0) + (S.spinV = (S.spinV == null ? G.spinV : S.spinV + (G.spinV - S.spinV) * Math.min(1, dt * 5))) * dt; S.sway = (S.sway || 0) + G.swayV * dt;
    P.ringSpin = S.ringSpin; P.sway = S.sway; P.spin = S.spinA || 0; P.ringAway = S.ring === 'overhead' ? 0 : 1;
    /* the fast layers on top of the springs: a shiver of the petals and a tremble of the whole flower (attacks, hurt, Twister's build) */
    if (G.shiver > 0.001) { P.bloom += G.shiver * Math.sin(t * 52); P.white += G.shiver * 0.8 * Math.sin(t * 47 + 1.3); P.leaves += G.shiver * 0.5 * Math.sin(t * 39 + 2.1); }
    if (G.tremble > 0.0005) { P.bank += G.tremble * 1.6 * Math.sin(t * 43); P.lean += G.tremble * Math.sin(t * 37 + 1); P.z = (P.z || 0) + G.tremble * 3 * Math.sin(t * 31 + 2); }
    /* the swords catch the light as each passes the front */
    P.ringGlow += 0.22 * Math.pow(0.5 + 0.5 * Math.cos(8 * S.ringSpin), 8);
    /* per-tentacle life for the model (M, Notes): each tentacle its own wave phase and speed, amplitude, coil (green) or reach (white); a model without them ignores them */
    { const TP = S.tp || (S.tp = { g: [0.9, 1.15, 1.37, 1.04, 1.26, 0.83].map((w, i) => ({ w, ph: i * 1.9 })), w: [1.21, 0.97, 1.43, 1.12, 1.33, 1.05, 0.91, 1.5].map((w, i) => ({ w, ph: i * 2.3 })) });
      const tgPh = P.tgPh || (P.tgPh = new Array(6).fill(0)), tgAmp = P.tgAmp || (P.tgAmp = new Array(6).fill(1)), tgCoil = P.tgCoil || (P.tgCoil = new Array(6).fill(0)), twPh = P.twPh || (P.twPh = new Array(8).fill(0)), twAmp = P.twAmp || (P.twAmp = new Array(8).fill(1)), twReach = P.twReach || (P.twReach = new Array(8).fill(0));
      const vk = G.swayV / 1.6, ex = clamp(Math.hypot(P.accX, P.accY), 0, 1.5);
      for (let i = 0; i < 6; i++) { const q = TP.g[i]; q.ph += q.w * 1.6 * vk * dt; tgPh[i] = q.ph; tgAmp[i] = 1 + 0.35 * Math.sin(t * 0.43 + i * 1.7) + 0.5 * ex; tgCoil[i] = 0.5 + 0.5 * Math.sin(t * (0.5 + 0.07 * i) + i * 2.2); }
      for (let i = 0; i < 8; i++) { const q = TP.w[i]; q.ph += q.w * 1.6 * vk * dt; twPh[i] = q.ph; twAmp[i] = 1 + 0.3 * Math.sin(t * 0.51 + i * 1.3) + 0.4 * ex; twReach[i] = 0.6 * Math.sin(t * (0.9 + 0.11 * i) + i * 1.9) + (P.tentW - 1) * 3; }
      P.flick = S.flickT != null ? Math.exp(-Math.max(0, t - S.flickT) * 5) : 0; P.breath = br; }
    P.bloom = clamp(P.bloom, 0, 1.4); P.fold = cl(P.fold); P.brace = cl(P.brace); P.ring = cl(P.ring); P.leaves = clamp(P.leaves, 0, 1.08); P.white = clamp(P.white, 0, 1.1); P.tentG = clamp(P.tentG, 0, 1.15); P.tentW = clamp(P.tentW, 0, 1.2);
    P.yaw = clamp(P.yaw, -0.4, 0.4); P.glow = clamp(P.glow, 0, 2); P.ringGlow = clamp(P.ringGlow, 0, 2); P.accX = clamp(P.accX, -1.3, 1.3); P.accY = clamp(P.accY, -1.3, 1.3);
    S.zOff = P.z || 0; P.z = 0; P.t = t; P.speed = k;
    const C2 = S.eCh; if (C2 && t - C2.t <= 0.12) { for (const key in C2.o) if (key !== 'alpha' && key !== 'ringAway') P[key] = C2.o[key]; }
  }

  /* ================= the air: the map's tiles, the open air round it, the walls (Nidhogg's) ================= */
  function airOf(X) { try { return X.air ? X.air() : null; } catch (e) { return null; } }
  function inMap(S, x, y) { const A = S.air; return !!A && x >= 0 && y >= 0 && x < A.w && y < A.h; }
  const tileOf = (S, x, y) => inMap(S, x, y) ? S.air.tile(Math.floor(x), Math.floor(y)) : -1;
  function wallNear(S, x, y, r) { if (!S.air) return S.X.blocked(x, y, r, 1); for (let ty = Math.floor(y - r); ty <= Math.floor(y + r); ty++) for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) { if (!inMap(S, tx + 0.5, ty + 0.5) || S.air.tile(tx, ty) !== T_SOLID) continue; const cx = Math.max(tx, Math.min(x, tx + 1)), cy = Math.max(ty, Math.min(y, ty + 1)); if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true; } return false; }
  function inVolume(S, x, y) { const A = S.air, m = TUNE.margin; return !A || (x >= -m && y >= -m && x <= A.w + m && y <= A.h + m); }
  function groundAt(S, x, y) { if (!S.air) return !S.X.blocked(x, y, 0.2, 0); const t = tileOf(S, x, y); return t >= 0 && T_WALK[t] === 1; }
  function canStand(S, x, y) { return groundAt(S, x, y) && !S.X.blocked(x, y, 0.38, 0) && !S.X.blocked(x, y, 0.2, 0); }
  function buildReach(S, sx, sy) {
    const A = S.air; if (!A) return; const W = A.w, H = A.h, R = S.reach && S.reach.length === W * H ? S.reach : new Uint8Array(W * H); R.fill(0);
    const q = S.reachQ && S.reachQ.length === W * H ? S.reachQ : new Int32Array(W * H); S.reachQ = q; let h = 0, tl = 0;
    const x0 = Math.floor(sx), y0 = Math.floor(sy); if (x0 < 0 || y0 < 0 || x0 >= W || y0 >= H || T_WALK[A.tile(x0, y0)] !== 1) { S.reach = R; return; }
    R[y0 * W + x0] = 1; q[tl++] = y0 * W + x0;
    while (h < tl) { const k = q[h++], x = k % W, y = (k / W) | 0;
      if (x > 0 && !R[k - 1] && T_WALK[A.tile(x - 1, y)] === 1) { R[k - 1] = 1; q[tl++] = k - 1; }
      if (x < W - 1 && !R[k + 1] && T_WALK[A.tile(x + 1, y)] === 1) { R[k + 1] = 1; q[tl++] = k + 1; }
      if (y > 0 && !R[k - W] && T_WALK[A.tile(x, y - 1)] === 1) { R[k - W] = 1; q[tl++] = k - W; }
      if (y < H - 1 && !R[k + W] && T_WALK[A.tile(x, y + 1)] === 1) { R[k + W] = 1; q[tl++] = k + W; } }
    S.reach = R;
  }
  function reachable(S, x, y) { const A = S.air; if (!A || !S.reach) return true; const tx = Math.floor(x), ty = Math.floor(y); return tx >= 0 && ty >= 0 && tx < A.w && ty < A.h && S.reach[ty * A.w + tx] === 1; }
  const safeOK = (S, x, y) => canStand(S, x, y) && reachable(S, x, y);
  function sturdy(S, p) { if (!p) return p; const cx = Math.floor(p.x) + 0.5, cy = Math.floor(p.y) + 0.5; if (safeOK(S, cx, cy) && !S.X.blocked(cx, cy, 0.5, 0)) return { x: cx, y: cy }; return p; }
  function nearestLand(S, x, y, maxR) {
    if (safeOK(S, x, y)) return { x, y };
    for (let r = 0.5; r <= (maxR || 8); r += 0.5) { const n = Math.max(8, Math.round(r * 8)); let best = null, bd = 1e9;
      for (let i = 0; i < n; i++) { const a = i / n * TAU, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (!safeOK(S, px, py)) continue; const d = S.safe ? Math.hypot(px - S.safe.x, py - S.safe.y) : 0; if (d < bd) { bd = d; best = { x: px, y: py }; } }
      if (best) return best; }
    return null;
  }
  /* the pet's way back to the ground: under the flower if that is safe ground, else the last safe ground it flew over, else home */
  function safeReturn(S) {
    const V = S.V; let p = nearestLand(S, V.x, V.y, 2.5);
    if (!p && S.safe && safeOK(S, S.safe.x, S.safe.y)) p = { x: S.safe.x, y: S.safe.y };
    if (!p && S.safe) p = nearestLand(S, S.safe.x, S.safe.y, 6);
    if (!p) { const w = S.X.walkPoint(S.home.x, S.home.y, { r: 0.4, x: S.home.x, y: S.home.y }); p = { x: w.x, y: w.y }; }
    return sturdy(S, p);
  }
  function smashCb(S) { return S._smCb || (S._smCb = (x, y) => { S.stats.smashed++; for (let i = 0; i < (lowFx() ? 2 : 5); i++) { const a = Math.random() * TAU, v = 1.5 + Math.random() * 2.5; addPart(S, 3, x, y, 0.4, Math.cos(a) * v, Math.sin(a) * v * GY, 1 + Math.random() * 1.5, 0.6 + Math.random() * 0.4, 0.13, { g: 2.5, drag: 1.2, col: i % 2 ? PINK : BLUSH }); } }); }
  const smashArea = (S, x, y, r, ox, oy) => S.vs.props ? S.vs.circle(x, y, r, smashCb(S), ox, oy) : 0;
  const smashOval = (S, cx, cy, rx, ry, ang, ox, oy) => S.vs.props ? S.vs.oval(cx, cy, rx, ry, ang, smashCb(S), ox, oy) : 0;

  /* ================= the session ================= */
  function startForm(C, H) {
    const me = H.me, g = H.g, X = H.X, M0 = MOD(), ev = evoOf(C), tier = tierOf(ev), K = C.K || 1, DK = C.base * K * (1 + 0.08 * (ev - 1));
    const kit = X.kit ? X.kit() : null, CD = (kit && kit.ult && kit.ult.key === 'ey_belladonna' && kit.ult.cd) || TUNE.cd, dur = TUNE.dur[tier];
    let inst; try { inst = M0.create({ T: X.Tz() * camOf(M0).zoom * ((typeof arc !== 'undefined' && arc.dpr) || 1) * TUNE.size, dpr: 1 }); } catch (e) { inst = null; } if (!inst || !inst.pose) inst = { pose: {} };
    const P = inst.pose; P.alpha = 0; for (const k of ['bloom', 'leaves', 'white', 'tentG', 'tentW', 'ring']) P[k] = 0;
    const tgt = X.nearestMon(me.x, me.y, 9), a0 = tgt ? Math.atan2(tgt.y - me.y, tgt.x - me.x) : (me.face < 0 ? Math.PI : 0);
    const V = { x: me.x, y: me.y, z: 0.2, heading: a0, vx: 0, vy: 0, pose: P, locked: true, vis: 1 };
    const S = { H, g, me, X, C, ev, tier, DK, CD, dur, V, inst, size: TUNE.size, phase: 'summon', t: 0, left: dur, endT: null, charge: 0, used: false, busy: null, busyT: 0, cd: { s1: 0, s2: 0, dodge: 0 }, cdMax: {},
      ring: 'overhead', swoosh: null, mvQ: null, dQ: null, ultQ: null, press: { ult: -9, strong: -9, strong2: -9 }, ha: a0, au: a0, hw: 0, an: {}, zOff: 0, spinA: 0, eAct: null, eCh: null, cam: null,
      unf: { leaves: 0, bloom: 0, white: 0, tentG: 0, tentW: 0, ring: 0, glow: 0.3, ringGlow: 0 },
      parts: [], free: [], marks: [], ended: false, released: false, pet: X.pet ? X.pet() : null, air: airOf(X), home: { x: me.x, y: me.y }, safe: { x: me.x, y: me.y }, safeT: 0, reachT: 2, sfxT: 0, mx: 0, my: 0, spd: 4.3,
      vs: VEH_SMASH.create(X, g),
      stats: { swooshSpot: 0, swooshSmash: 0, swooshes: 0, swooshHits: 0, swooshBad: 0, offT: 0, wild: 0, ring: 0, ringOut: 0, ringBack: 0, recalls: 0, twister: 0, smashed: 0, cdSet: 0, dealt: 0, charged: 0, hits: 0, flyT: 0, menuSets: 0, offshoreExit: 0 } };
    buildReach(S, me.x, me.y);
    g._belladonna = S;
    const ctx = S.ctx = { X, H, C, g, evo: ev, tier, DK, model: M0, poseObj: P, CLIPS, TUNE, sfx: X.sfx || {}, finisher: null, twisterPlan: null, field: null, recall: false,
      get vehicle() { return S.V; }, get form() { return 'flower'; }, get ring() { return S.ring; }, get swoosh() { return S.swoosh ? S.swoosh.info : null; }, get charge() { return S.charge; }, get left() { return S.left; }, get phase() { return S.phase; },
      now: () => g.t,
      hit: (m, dmg, o) => hitCharge(S, m, dmg, o),
      hitArea: (x, y, r, dmg, o) => { let n = 0; const once = o && o.once; for (const m of H.living()) { if (Math.hypot(m.x - x, m.y - y) >= r + (m.r || 0.4)) continue; if (once && seen(once, m)) continue; if (hitCharge(S, m, dmg, o) > 0) n++; } if (!(o && o.noSmash) && alive(S)) smashArea(S, x, y, r, o && o.ox, o && o.oy); return n; },
      hitOval: (cx, cy, rx, ry, ang, dmg, o) => { let n = 0; const once = o && o.once, ca = Math.cos(ang), sa = Math.sin(ang); for (const m of H.living()) { const dx = m.x - cx, dy = m.y - cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca, pr = m.r || 0.4; if ((u * u) / ((rx + pr) ** 2) + (v * v) / ((ry + pr) ** 2) >= 1) continue; if (once && seen(once, m)) continue; if (hitCharge(S, m, dmg, o) > 0) n++; } if (!(o && o.noSmash) && alive(S)) smashOval(S, cx, cy, rx, ry, ang, o && o.ox, o && o.oy); return n; },
      smashArea: (x, y, r, ox, oy) => alive(S) ? smashArea(S, x, y, r, ox, oy) : 0, smashOval: (cx, cy, rx, ry, ang, ox, oy) => alive(S) ? smashOval(S, cx, cy, rx, ry, ang, ox, oy) : 0,
      mons: () => H.living(), target: () => target(S), aimPoint: () => aimPoint(S) || { x: S.V.x, y: S.V.y }, aimDir: () => { const m = Math.hypot(S.mx, S.my); return m > 0.2 ? Math.atan2(S.my, S.mx) : S.V.heading; }, stick: () => ({ x: S.mx, y: S.my, mag: Math.min(1, Math.hypot(S.mx, S.my)) }),
      groundAt: (x, y) => groundAt(S, x, y), canStand: (x, y) => canStand(S, x, y), nearestLand: (x, y) => nearestLand(S, x, y, 8) || safeReturn(S), inVolume: (x, y) => inVolume(S, x, y),
      anchor: n => { let p = null; try { p = M0.anchor ? M0.anchor(n) : null; } catch (e) { p = null; } return p && isFinite(p.x) && isFinite(p.y) ? { x: p.x, y: p.y, z: p.z || 0 } : { x: S.V.x, y: S.V.y, z: S.V.z + (n === 'ring' ? 4.9 : n === 'top' ? 4.3 : 1.5) }; },
      scr: (x, y, z) => [H.sx(x), H.sy(y) - (z || 0) * ZK * X.Tz()], T: () => X.Tz(),
      camera: o => { if (!o) { S.cam = null; return; } if (o.shake && !calm()) X.shake(Math.min(10, o.shake), Math.min(0.5, o.dur || 0.25)); const c0 = S.cam || {}; S.cam = { zoom: o.zoom != null ? clamp(o.zoom, 0.5, 1.1) : c0.zoom, x: o.x != null ? o.x : c0.x, y: o.y != null ? o.y : c0.y, k: o.k != null ? cl(o.k) : c0.k }; },
      clip: (name, u, extra) => { if (name === 'rest' || !name) { S.eAct = null; return; } const E = S.eAct || (S.eAct = {}); E.clip = name; E.u = cl(u); E.extra = extra || null; E.t = g.t; },
      pose: (name, u, extra) => ctx.clip(name, u, extra),
      chan: o => { S.eCh = { o, t: g.t }; }, setPose: o => { if (o) S.eCh = { o: Object.assign({}, o), t: g.t }; },   /* (setPose: E's name for chan; ringAway follows the ring's state, not this) */ kick: (key, dv) => kick(S, key, dv),
      /* the one ring: E moves it through its states ('overhead' -> 'outbound' -> 'returning' -> 'overhead'); while it is away
         the model hides its own (pose.ringAway) and E draws it with model.drawRing; Ring Blade cannot be recast */
      ringState: s => { if (s !== 'overhead' && s !== 'outbound' && s !== 'returning') return S.ring; if (s === S.ring) return s; if (s === 'outbound') S.stats.ringOut++; if (s === 'overhead') { S.stats.ringBack++; ctx.recall = false; S.flickT = g.t; kick(S, 'accY', 6); kick(S, 'tentW', -1.5); kick(S, 'lean', -1.2); if (S.phase === 'fly') { S.cd.s2 = mvTune('ringCd', TUNE.ringCd); S.cdMax.s2 = S.cd.s2; } kick(S, 'ringGlow', 4); kick(S, 'ringTilt', 2.4); kick(S, 'z', -1.6); kick(S, 'bloom', 0.5); }   /* (the catch: the ring rocks, the whole flower dips and bounces) */ S.ring = s; S.ringT = g.t; return s; },
      vanish: () => { S.V.vis = 0; }, safeReturn: () => { const p = safeReturn(S); S.retPt = p; return { x: p.x, y: p.y }; },
      done: () => actionDone(S), alive: () => alive(S), calm, low: lowFx };
    S.veh = { get active() { return !S.released; }, drive: (mx, my, dt, spd) => { S.mx = mx; S.my = my; if (spd > 0) S.spd = spd; void dt; }, dodge: (mx, my) => trySwoosh(S, mx, my), strong: slot => tryMove(S, slot), ult: () => tryUlt(S),
      drawBtns: (c, o) => drawBtns(S, c, o), onSwitch: () => finish(S, 'swap'), cam: () => camFocus(S) };
    X.vehicle(S.veh);
    const F = S.fx = H.add({ key: 'belladonna', life: 1e9, entY: me.y, update(dt) { step(S, dt); }, drawUnder(c) { drawUnder(S, c); }, drawEnt(c) { drawEnt(S, c); }, draw(c) { drawOver(S, c); }, onEnd() { if (!S.released) release(S); } });
    me.petAlt = F;
    const sfx = X.sfx || {}; if (sfx.note) [523, 659, 784, 1047, 1319].forEach((f, i) => sfx.note(f, 0.6, 'sine', 0.05, f * 1.01, i * 0.12)); if (sfx.sparkle) sfx.sparkle();
    callMove(S, 'summon', { x: me.x, y: me.y, dur: TUNE.summon, stages: TUNE.sum });
    return S;
  }
  const seen = (once, m) => { const s = once.__seen || (once.__seen = new Set()); if (s.has(m)) return true; s.add(m); return false; };
  /* alive: the session runs and an action may go on (a committed Twister stays alive, even on a won floor, up to its cap) */
  function alive(S) { const me = S.me, g = S.g; if (S.ended || S.released || me.dead || g.over) return false; if (S.phase === 'finisher') return S.t < TUNE.finCap; return S.phase === 'fly' && !g.won; }
  /* the camera frames the form itself: centred on the model's drawn centre, a little under the screen's middle, led by its velocity */
  function camFocus(S) { const V = S.V, c = S.cam, CF = S.camF || (S.camF = camOf(S.ctx && S.ctx.model)), Z = CF.zoom, z = S.phase === 'summon' ? lerp(1, Z, sstep(0.3, TUNE.summon, S.t)) : S.phase === 'gone' ? 1 : S.phase === 'out' ? lerp(Z, 1, sstep(0, 1, (S.outT || 0) / 1.2)) : Z;
    if (c && c.x != null) return { x: c.x, y: c.y, k: c.k != null ? c.k : 0.6, zoom: c.zoom || z };
    if (S.phase === 'gone') return { x: V.x, y: V.y, k: 0, zoom: 1 };
    const M0 = S.ctx && S.ctx.model; let p = null; try { p = M0 && M0.anchor ? M0.anchor('center') : null; } catch (e) { p = null; } const okp = p && isFinite(p.x) && isFinite(p.y) && isFinite(p.z);
    const by = (okp ? p.y - p.z * ZK : V.y - (V.z + 1.6) * ZK) + (S.zOff || 0) * ZK, own = S.phase === 'summon' ? sstep(0.2, 1.4, S.t) : S.phase === 'out' ? 1 - sstep(0, 1, (S.outT || 0) / 1.2) : 1;
    return { x: V.x + (V.vx || 0) / 6 * own, y: V.y + (by - V.y - CF.lift + (V.vy || 0) / 6) * own, k: Math.max(0.02, own), zoom: c && c.zoom ? c.zoom : z }; }

  /* ---- targeting (Nidhogg's): an enemy near the stick's aim line, else the ground along it; no stick: the nearest ---- */
  function target(S) { const d = S.V, mag = Math.hypot(S.mx, S.my), M = S.H.living(), D = TUNE.swoosh;
    if (mag > 0.2) { const a = Math.atan2(S.my, S.mx); for (const [cone, reach] of [[D.cone, D.reach + 2], [D.cone2, D.reach2]]) { let best = null, bs = 1e9; for (const m of M) { const dx = m.x - d.x, dy = m.y - d.y, dist = Math.hypot(dx, dy); if (dist > reach) continue; const off = Math.abs(wrap(Math.atan2(dy, dx) - a)); if (off > cone + (dist < 2 ? 0.8 : 0)) continue; const s = dist + off * 6; if (s < bs) { bs = s; best = m; } } if (best) return { x: best.x, y: best.y, m: best }; } }
    else { let best = null, bd = 11; for (const m of M) { const dist = Math.hypot(m.x - d.x, m.y - d.y); if (dist < bd) { bd = dist; best = m; } } if (best) return { x: best.x, y: best.y, m: best }; }
    const p = aimPoint(S); if (p) return { x: p.x, y: p.y, m: null };
    { let best = null, bd = D.reach + 1; for (const m of M) { const dist = Math.hypot(m.x - d.x, m.y - d.y); if (dist < bd) { bd = dist; best = m; } } if (best) return { x: best.x, y: best.y, m: best }; }
    return { x: d.x + Math.cos(d.heading) * 4, y: d.y + Math.sin(d.heading) * 4, m: null }; }
  function aimPoint(S) { const d = S.V, mag = Math.hypot(S.mx, S.my);
    if (mag > 0.2) { const a = Math.atan2(S.my, S.mx), ca = Math.cos(a), sa = Math.sin(a); const p0 = { x: d.x + ca * 4.5, y: d.y + sa * 4.5 }; if (groundAt(S, p0.x, p0.y)) return p0;
      for (let s = 2; s <= TUNE.swoosh.reach; s += 0.35) { const x = d.x + ca * s, y = d.y + sa * s; if (groundAt(S, x, y)) return { x, y }; } return null; }
    let T = null, bd = 9; for (const m of S.H.living()) { const dist = Math.hypot(m.x - d.x, m.y - d.y); if (dist < bd) { bd = dist; T = m; } } if (T) return { x: T.x, y: T.y };
    const ca = Math.cos(d.heading), sa = Math.sin(d.heading); for (const s of [3, 2, 4, 1, 0]) { const x = d.x + ca * s, y = d.y + sa * s; if (groundAt(S, x, y)) return { x, y }; } return null; }

  /* ---- damage and the one gauge: each event once, after mitigation, without overkill ---- */
  function hitCharge(S, m, dmg, o) {
    if (!m || m.dead || m.falling || !(dmg > 0) || S.ended) return 0;
    const before = Math.max(0, m.hp), oo = Object.assign({ el: 'wind', src: 'ult' }, o || {}); delete oo.noCharge; delete oo.once; delete oo.noSmash; delete oo.ox; delete oo.oy;
    const r = S.X.hitMon(m, dmg, oo), dealt = Math.max(0, Math.min(r || 0, before));
    if (!(dealt > 0)) return 0;
    S.stats.dealt += dealt; S.stats.hits++;
    if (!(o && o.noCharge) && S.phase === 'fly' && !S.used) { const c0 = S.charge; S.charge = Math.min(1, S.charge + dealt / (TUNE.chargeK * S.DK)); S.stats.charged += S.charge - c0;
      if (c0 < 1 && S.charge >= 1) { const sfx = S.X.sfx || {}; if (sfx.note) [784, 1047, 1319, 1568].forEach((f, i) => sfx.note(f, 0.4, 'triangle', 0.06, f, i * 0.07)); S.X.text(S.V.x, S.V.y - 4, 'TWISTER READY', MINT2, 15, { life: 1.4, max: 1.4, vy: -0.5 }); kick(S, 'ringGlow', 8); kick(S, 'bloom', 1.2); S.happyT = S.g.t; } }
    return dealt;
  }
  function setHeading(S, a, dt) { const da = wrap(a - S.ha); S.ha = wrap(a); S.au += da; S.hw = dt > 0 ? da / dt : 0; }
  function steer(S, dt, want, mag) { const T = TUNE.turn; let wT = 0;
    if (want != null) { const off = wrap(want - S.ha); wT = clamp(off * T.k / T.max, -1, 1) * T.max * (0.6 + 0.4 * Math.min(1, mag)); }
    const lim = T.acc * dt, w = S.hw + clamp(wT - S.hw, -lim, lim); S.hw = w; S.ha = wrap(S.ha + w * dt); S.au += w * dt; }
  function syncMe(S) { const me = S.me, d = S.V; me.x = d.x; me.y = d.y; me.vx = d.vx; me.vy = d.vy; me.z = 0; me.airborne = S.phase === 'fly' || S.phase === 'finisher' || (S.phase === 'summon' && d.z > 0.8) || S.phase === 'out'; const c = Math.cos(d.heading); if (Math.abs(c) > 0.25) me.face = c > 0 ? 1 : -1; }

  /* ================= the flight (Nidhogg's) ================= */
  function fly(S, dt, steerOK) {
    const d = S.V, A = S.air, mag = steerOK ? Math.min(1, Math.hypot(S.mx, S.my)) : 0, top = S.spd * TUNE.airK;
    const want = mag > 0.15 ? Math.atan2(S.my, S.mx) : d.heading, tvx = mag > 0.15 ? Math.cos(want) * top * mag : 0, tvy = mag > 0.15 ? Math.sin(want) * top * mag : 0, k = Math.min(1, (mag > 0.15 ? TUNE.accel / top : TUNE.brake / top) * dt * 2.2);
    d.vx += (tvx - d.vx) * k; d.vy += (tvy - d.vy) * k;
    let zT = TUNE.cruise; const sp = Math.hypot(d.vx, d.vy), ux = sp > 0.1 ? d.vx / sp : Math.cos(d.heading), uy = sp > 0.1 ? d.vy / sp : Math.sin(d.heading), look = 0.6 + sp * 0.25;
    const tall = !A || A.hand;
    if (!tall && (wallNear(S, d.x, d.y, 0.8) || wallNear(S, d.x + ux * look, d.y + uy * look, 0.8))) zT = Math.max(zT, TUNE.wallZ);   /* (it climbs over a wall ahead) */
    { const dz = zT - d.z, vmax = dz > 0 ? TUNE.climbV : TUNE.sinkV; d.z += Math.sign(dz) * Math.min(Math.abs(dz), vmax * dt * Math.min(1, Math.abs(dz) * 1.6 + 0.15)); }
    const blockAt = (x, y) => (tall || d.z < TUNE.wallZ - 0.35) && wallNear(S, x, y, 0.6);
    const nx = d.x + d.vx * dt, ny = d.y + d.vy * dt;
    if (!blockAt(nx, d.y)) d.x = nx; else d.vx *= 0.3;
    if (!blockAt(d.x, ny)) d.y = ny; else d.vy *= 0.3;
    if (A) { const m = TUNE.margin; if (d.x < -m) { d.x = -m; d.vx = Math.max(0, d.vx); } if (d.x > A.w + m) { d.x = A.w + m; d.vx = Math.min(0, d.vx); } if (d.y < -m) { d.y = -m; d.vy = Math.max(0, d.vy); } if (d.y > A.h + m) { d.y = A.h + m; d.vy = Math.min(0, d.vy); } }   /* (the flight volume: the map and the open air round it) */
    steer(S, dt, mag > 0.15 ? want : null, mag);
    return mag;
  }

  /* ================= SWOOSH (Dodge): Dive Bomb's targeting and commitment, as a spiral pass round the enemy group =================
     The press picks the target (an enemy near the aim, else the ground along it), gathers the group round it, and plans
     the whole route before anything moves: the line to the circle, the full turn round the group at a safe height, the
     way out. Every point of it must be inside the flight volume and clear of walls at that height; a smaller circle or
     the other way round is tried, else the pass is refused (a mark on the spot, nothing spent). One hit per enemy */
  const dodgeCd = S => TUNE.dodgeCd * (S.g.buff && S.g.buff.arcane > 0 ? 0.6 : 1) * (S.g.dodgeK || 1);
  function routeOK(S, pts, high) { for (const p of pts) { if (!inVolume(S, p[0], p[1]) || (!high && wallNear(S, p[0], p[1], 0.6))) return false; } return true; }
  function planSwoosh(S, cx, cy) {
    const d = S.V, T = TUNE.swoosh, a0 = Math.atan2(d.y - cy, d.x - cx), dist = Math.hypot(d.x - cx, d.y - cy), pref = wrap(Math.atan2(cy - d.y, cx - d.x) - S.ha) >= 0 ? 1 : -1;
    /* low first (clear of every wall at the pass's height); where walls can be flown over, a pass above them is the fallback */
    const tall = !S.air || S.air.hand;
    for (const high of (tall ? [false] : [false, true])) for (const R of T.R) for (const dir of [pref, -pref]) {
      /* the entry: the near point of the circle (from inside it: straight out to the rim); then `turns` round; the exit carries on along the tangent */
      const e0 = dist > 0.2 ? a0 : S.ha + Math.PI, ex = cx + Math.cos(e0) * R, ey = cy + Math.sin(e0) * R * GY, pts = [], nA = Math.max(2, Math.ceil(Math.hypot(ex - d.x, ey - d.y) / 0.4));
      for (let i = 1; i <= nA; i++) pts.push([lerp(d.x, ex, i / nA), lerp(d.y, ey, i / nA)]);
      const nO = 28; for (let i = 1; i <= nO; i++) { const a = e0 + dir * TAU * T.turns * i / nO; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R * GY]); }
      const e1 = e0 + dir * TAU * T.turns, tx = -Math.sin(e1) * dir, ty = Math.cos(e1) * dir * GY, ox = cx + Math.cos(e1) * R, oy = cy + Math.sin(e1) * R * GY; for (let i = 1; i <= 4; i++) pts.push([ox + tx * 0.45 * i, oy + ty * 0.45 * i]);
      if (routeOK(S, pts, high)) return { R, dir, e0, e1, ex, ey, ox, oy, tx, ty, z: high ? TUNE.wallZ : T.z, high };
    }
    /* nothing fits (a stage whose walls cannot be flown over): the pinwheel on the spot, at the height it has. Terrain never refuses a Swoosh */
    return { R: 0, dir: pref, e0: S.ha + Math.PI, e1: S.ha + Math.PI, ex: d.x, ey: d.y, ox: d.x, oy: d.y, tx: 0, ty: 0, z: wallNear(S, d.x, d.y, 0.8) ? Math.max(d.z, T.z) : T.z, high: false, spot: true, cx: d.x, cy: d.y };
  }
  function trySwoosh(S, mx, my, queued) {
    const d = S.V, g = S.g, T = TUNE.swoosh; if (mx != null) { S.mx = mx; S.my = my; }
    if (S.phase !== 'fly') return;
    if (S.swoosh || S.busy || S.cd.dodge > 0 || d.locked) { if (!queued && ((S.swoosh && S.swoosh.ph >= 2) || S.busy || (S.cd.dodge > 0 && S.cd.dodge < 0.25))) S.dQ = g.t; return; }
    S.dQ = null;
    const Tg = target(S); let cx = Tg.x, cy = Tg.y, nG = 0;
    if (Tg.m) { let sx = 0, sy = 0; for (const m of S.H.living()) { if (Math.hypot(m.x - Tg.m.x, m.y - Tg.m.y) > T.group) continue; sx += m.x; sy += m.y; nG++; } if (nG > 1) { cx = lerp(Tg.m.x, sx / nG, 0.7); cy = lerp(Tg.m.y, sy / nG, 0.7); } }   /* (the group round the target: the circle centres on it, held near the target itself) */
    const plan = inVolume(S, cx, cy) ? planSwoosh(S, cx, cy) : null; if (plan && plan.spot) { cx = plan.cx; cy = plan.cy; S.stats.swooshSpot++; }
    if (!plan) {   /* (only an aim outside the flight volume is refused) */ S.marks.push({ x: cx, y: cy, t: 0, life: 0.7 }); S.stats.swooshBad++; const sfx = S.X.sfx || {}; if (sfx.wrong) sfx.wrong(); return; }
    const info = { spot: !!plan.spot, high: !!plan.high, cx, cy, R: plan.R, hitR: T.hitR, dir: plan.dir, x: d.x, y: d.y, z: d.z, u: 0, ph: 'bank', a: plan.e0, group: nG, m: Tg.m || null, dur: T.bank + T.approach + T.orbit + T.rec };
    S.swoosh = { ph: 0, t: 0, plan, cx, cy, dir: plan.dir, x0: d.x, y0: d.y, z0: d.z, hits: new Set(), nHit: 0, from: S.ha, info, spin0: S.spinA || 0 };
    S.flickT = g.t; S.me.inv = Math.max(S.me.inv || 0, T.inv); S.stats.swooshes++; g.movedOnce = true; g.dodges = (g.dodges || 0) + 1;
    const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) { sfx.note(660, 0.5, 'sine', 0.04, 1320); sfx.note(330, 0.4, 'triangle', 0.03, 880, 0.05); } if (sfx.hiss) sfx.hiss(0.5, 0.08, 2600);
    callMove(S, 'swoosh', info);
  }
  function stepSwoosh(S, dt) {
    const W = S.swoosh, d = S.V, T = TUNE.swoosh, Pn = W.plan, I = W.info; W.t += dt; const x0 = d.x, y0 = d.y;
    if (W.ph === 0) { const u = cl(W.t / T.bank); d.vx *= 0.86; d.vy *= 0.86; d.x += d.vx * dt; d.y += d.vy * dt; setHeading(S, W.from + wrap(Math.atan2(Pn.ey - d.y, Pn.ex - d.x) - W.from) * inOut(u), dt);
      if (W.t >= T.bank) { W.ph = 1; W.t -= T.bank; W.x0 = d.x; W.y0 = d.y; W.z0 = d.z; I.ph = 'approach'; } }
    if (W.ph === 1) { const u = cl(W.t / T.approach), e = u * u * (3 - 2 * u); d.x = lerp(W.x0, Pn.ex, e); d.y = lerp(W.y0, Pn.ey, e); d.z = lerp(W.z0, Pn.z, e); if (u < 1) setHeading(S, Math.atan2(Pn.ey - W.y0, Pn.ex - W.x0), dt);
      if (W.t >= T.approach) { W.ph = 2; W.t -= T.approach; I.ph = 'orbit'; } }
    if (W.ph === 2) { const u = cl(W.t / T.orbit), a = Pn.e0 + W.dir * TAU * T.turns * u; d.x = W.cx + Math.cos(a) * Pn.R; d.y = W.cy + Math.sin(a) * Pn.R * GY; d.z = Pn.z + 0.25 * Math.sin(u * Math.PI * 2);
      setHeading(S, Math.atan2(Math.cos(a) * W.dir * GY, -Math.sin(a) * W.dir), dt); S.spinA = W.spin0 + W.dir * TAU * T.spins * inOut(u); I.a = a;
      if (W.t >= T.orbit) { W.ph = 3; W.t -= T.orbit; S.spinA = 0; W.vx = Pn.tx * 7; W.vy = Pn.ty * 7; I.ph = 'open'; kick(S, 'tentW', 1.0); kick(S, 'tentG', 0.6); kick(S, 'accX', -W.dir * 4); const sfx = S.X.sfx || {}; if (sfx.note) sfx.note(1319, 0.3, 'sine', 0.04, 1976); } }
    if (W.ph === 3) { const u = cl(W.t / T.rec); d.vx = W.vx * (1 - u); d.vy = W.vy * (1 - u); d.x += d.vx * dt; d.y += d.vy * dt; d.z = lerp(Pn.z, Pn.high ? TUNE.wallZ : TUNE.cruise, sstep(0, 1, u)); }
    else if (dt > 0) { d.vx = (d.x - x0) / dt; d.vy = (d.y - y0) / dt; }
    /* the swept volume: every enemy the folded flower passes on the approach's end and round the circle, once */
    if ((W.ph === 1 && W.t > T.approach * 0.6) || W.ph === 2) { for (const m of S.H.living()) { if (W.hits.has(m)) continue; if (Math.hypot(m.x - d.x, m.y - d.y) > T.hitR + (m.r || 0.4)) continue; W.hits.add(m); if (hitCharge(S, m, S.DK * T.dmg, { kb: T.kb }) > 0) { W.nHit++; S.stats.swooshHits++; petals(S, m.x, m.y, 0.5, 4, 3); } }
      /* the same swept volume breaks the scenery under the pass (every few frames; VEH_SMASH: doors and bridges kept, chests opened, shrines triggered) */
      W.smT = (W.smT || 0) - dt; if (W.smT <= 0) { W.smT = 0.05; S.stats.swooshSmash += smashArea(S, d.x, d.y, T.hitR) || 0; }
      if (Math.random() < dt * (lowFx() ? 14 : 40)) addPart(S, Math.random() < 0.5 ? 3 : 1, d.x + (Math.random() - 0.5) * 2, d.y + (Math.random() - 0.5) * 1.2, d.z + Math.random() * 2, -d.vx * 0.12, -d.vy * 0.12, 0.3, 0.5 + Math.random() * 0.4, 0.12, { col: Math.random() < 0.5 ? PINK : MINT2, drag: 1.5 }); }
    I.x = d.x; I.y = d.y; I.z = d.z; I.u = cl(((W.ph > 0 ? T.bank : 0) + (W.ph > 1 ? T.approach : 0) + (W.ph > 2 ? T.orbit : 0) + W.t) / I.dur);
    if (W.ph === 3 && W.t >= T.rec) { S.swoosh = null; S.cd.dodge = dodgeCd(S); S.cdMax.dodge = S.cd.dodge; }
  }

  /* ================= the commands ================= */
  function fresh(S, key) { const t = S.g.t, p = S.press[key]; S.press[key] = t; return t - p >= TUNE.freshGap; }
  function tryMove(S, slot, queued) {
    const V = S.V, g = S.g, sfx = S.X.sfx || {}, s2 = slot === 'strong2', key = s2 ? 's2' : 's1', tk = s2 ? 'ringCd' : 'wildCd';
    if (!queued && !fresh(S, s2 ? 'strong2' : 'strong')) return;
    if (S.phase !== 'fly') return;
    if (S.busy || V.locked || S.swoosh) { if (!queued) S.mvQ = { slot, t: g.t }; return; }
    if (s2 && S.ring !== 'overhead') { if (!queued && sfx.wrong) sfx.wrong(); return; }   /* (the one ring is away: no recast until it is back overhead) */
    if (S.cd[key] > 0) { if (!queued) { if (S.cd[key] <= TUNE.mvHold) S.mvQ = { slot, t: g.t }; else if (sfx.wrong) sfx.wrong(); } return; }
    S.mvQ = null;
    const name = s2 ? 'ringBlade' : 'wildflowers', [MV, fn] = mvFn(name); if (!fn) return;
    S.flickT = S.g.t; if (s2) { const T2 = target(S); S.throwDir = T2.x >= S.V.x ? 1 : -1; }
    S.busy = name; S.busyT = 0; S.cd[key] = mvTune(tk, TUNE[tk]); S.cdMax[key] = S.cd[key]; S.stats[s2 ? 'ring' : 'wild']++;
    try { fn.call(MV, S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Belladonna: a move failed', e); actionDone(S); }
  }
  function tryUlt(S, queued) {
    const X = S.X, sfx = X.sfx || {}, V = S.V, g = S.g;
    if (!queued && !fresh(S, 'ult')) return;
    if (S.phase !== 'fly') return;
    if (S.used || S.charge < 1) { if (!queued) { if (sfx.wrong) sfx.wrong(); X.text(V.x, V.y - 3.5, S.used ? 'Twister used' : `Twister ${Math.floor(S.charge * 100)}%`, MINT, 12, { life: 0.9, max: 0.9, vy: -0.6 }); } return; }
    if (S.busy || S.swoosh) { if (!queued) S.ultQ = g.t; return; }   /* (a Swoosh or a cast in progress: it goes when that ends) */
    /* the ring is away: it is called back, visibly, before the finisher begins (E's recallRing hurries it; a cap ends the wait) */
    if (S.ring !== 'overhead') {
      if (typeof moves().ringState === 'function') { if (S.recallT == null) { S.recallT = g.t; S.ctx.recall = true; S.stats.recalls++; } }   /* (E's moves keep the ring themselves: their Twister opens with the recall, so the finisher is committed at the press) */
      else { if (S.recallT == null) { S.recallT = g.t; S.ctx.recall = true; S.stats.recalls++; callMove(S, 'recallRing'); } if (g.t - S.recallT < TUNE.recallCap) { S.ultQ = g.t; return; } S.ctx.ringState('overhead'); } }
    S.flickT = g.t; S.recallT = null; S.ultQ = null; S.used = true; S.phase = 'finisher'; S.t = 0; S.busy = 'twister'; S.busyT = 0; V.locked = true; S.ctx.finisher = 'twister'; S.stats.twister++;
    const [MV, fn] = mvFn('twister');
    try { fn.call(MV, S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Belladonna: Twister failed', e); actionDone(S); }
  }
  function actionDone(S) {
    if (!S.busy) return; const kind = S.busy; S.busy = null;
    if (S.phase === 'finisher' || kind === 'twister') { S.cam = null; startOut(S, 'finisher'); return; }
    if (S.phase === 'fly') { S.V.locked = false; S.cam = null; }
  }
  function queues(S) { const g = S.g, V = S.V; if (S.busy || S.swoosh) return;
    if (S.ultQ != null) { const q = S.ultQ; S.ultQ = null; if (g.t - q < 2 && S.charge >= 1 && !S.used) { tryUlt(S, true); if (S.phase !== 'fly') return; } }
    if (V.locked) return;
    if (S.dQ != null && S.cd.dodge <= 0) { const q = S.dQ; S.dQ = null; if (g.t - q < 0.6) { trySwoosh(S, null, null, true); if (S.swoosh) return; } }
    if (S.mvQ) { const Q = S.mvQ, key = Q.slot === 'strong2' ? 's2' : 's1'; if (g.t - Q.t > TUNE.mvHold + 0.8) S.mvQ = null; else if (S.cd[key] <= 0) { S.mvQ = null; tryMove(S, Q.slot, true); } } }

  /* ================= the frame ================= */
  function step(S, dt) {
    const d = S.V, me = S.me, g = S.g, X = S.X, M0 = MOD();
    if (S.released) { S.relT = (S.relT || 0) + dt; stepParts(S, dt); return; }
    if (me.dead) { finish(S, 'defeat'); return; }
    if (g.over || (g.won && S.phase !== 'finisher' && S.phase !== 'out')) { finish(S, 'won'); return; }
    if (X.pet && S.pet && X.pet() !== S.pet) { finish(S, 'swap'); return; }
    g.cdU = S.CD;   /* (held through the session: the cooldown starts at the exit) */
    S.t += dt; for (const k in S.cd) S.cd[k] = Math.max(0, S.cd[k] - dt); if (S.busy) S.busyT += dt;
    if (M0.warm) { try { M0.warm(S.phase === 'summon' ? 5 : 1); } catch (e) { /* (model) */ } }
    { const hp = me.hp; if (S.hpPrev != null && hp < S.hpPrev - 0.01) { S.hurtT = g.t; kick(S, 'z', -1.6); kick(S, 'bank', (Math.random() < 0.5 ? -1 : 1) * 1.4); } S.hpPrev = hp; }   /* (the pet hurt: the flower flinches) */
    const MVw = moves(); if (MVw.warm && !S.wDone) { try { if (MVw.warm(S.phase === 'summon' ? 1.5 : 0.6) === true) S.wDone = true; } catch (e) { S.wDone = true; } }
    if (S.phase === 'summon') stepSummon(S, dt);
    else if (S.phase === 'fly') {
      S.left = Math.min(S.left - dt, S.endT - g.t); S.stats.flyT += dt; if (!inMap(S, d.x, d.y) || (!groundAt(S, d.x, d.y) && tileOf(S, d.x, d.y) !== T_SOLID)) S.stats.offT += dt;   /* (off the land: over a gap, water or the open air, not over a wall) */   /* (the game clock: a hit-stop, which pauses this step, still counts) */
      if (S.left <= 0) { if (!inMap(S, d.x, d.y) || !groundAt(S, d.x, d.y)) S.stats.offshoreExit++; startOut(S, 'timeout'); return; }   /* (the timeout wins: a Swoosh or a cast in progress is cut, no free finisher; over open air it glides to the safe ground first) */
      if (S.busy && S.busyT > TUNE.busyCap) actionDone(S);
      if (S.swoosh) stepSwoosh(S, dt); else fly(S, dt, !d.locked);
      queues(S);
    } else if (S.phase === 'finisher') {
      if (S.t > TUNE.finCap) { S.busy = null; startOut(S, 'finisher'); return; }
      /* it steadies above the fight: the speed bleeds off, the height settles (E may place it through ctx.vehicle) */
      const k = Math.max(0, 1 - dt * 4); d.vx *= k; d.vy *= k; if (!wallNear(S, d.x + d.vx * dt, d.y + d.vy * dt, 0.6) || d.z >= TUNE.wallZ - 0.35) { d.x += d.vx * dt; d.y += d.vy * dt; } d.z += (Math.max(d.z > TUNE.wallZ - 0.4 && wallNear(S, d.x, d.y, 0.8) ? TUNE.wallZ : TUNE.cruise, TUNE.cruise) - d.z) * Math.min(1, dt * 2.5); S.hw *= Math.max(0, 1 - dt * 6);
    } else if (S.phase === 'out') stepOut(S, dt);
    /* the safe return point (valid ground the pet could walk from, tracked all through) */
    S.safeT -= dt; if (S.safeT <= 0) { S.safeT = 0.25; if (safeOK(S, d.x, d.y)) S.safe = { x: d.x, y: d.y }; }
    S.reachT -= dt; if (S.reachT <= 0) { S.reachT = 2; if (S.safe && canStand(S, S.safe.x, S.safe.y)) buildReach(S, S.safe.x, S.safe.y); }
    d.heading = S.ha;
    const MV = moves(); if (MV.update) { try { MV.update(S.ctx, dt); } catch (e) { /* (theirs) */ } }
    /* the ring's state when E keeps it itself (BELLADONNA_MOVES.ringState(ctx)): the core follows it, so the model hides its ring and Ring Blade cannot be recast while it is away */
    if (typeof MV.ringState === 'function' && (S.phase === 'fly' || S.phase === 'finisher')) { let rs = null; try { rs = MV.ringState(S.ctx); } catch (e) { rs = null; } if (rs && rs !== S.ring) S.ctx.ringState(rs); }
    if (S.phase !== 'out' || !S.hopped) syncMe(S);
    stepParts(S, dt);
    animate(S, dt);
    S.fx.entY = d.y + 0.4;
    /* a few petals always drift off the bloom */
    if (S.phase === 'fly' && Math.random() < dt * (lowFx() ? 1.5 : 4)) addPart(S, 3, d.x + (Math.random() - 0.5) * 4, d.y + (Math.random() - 0.5) * 1, d.z + 0.5 + Math.random() * 2.5, -d.vx * 0.2 + (Math.random() - 0.5), -d.vy * 0.2, -0.4, 1.4 + Math.random(), 0.11, { col: Math.random() < 0.7 ? PINK : BLUSH, drag: 0.6 });
    S.sfxT -= dt; if (S.sfxT <= 0 && S.phase === 'fly') { const sfx = X.sfx || {}; S.sfxT = 1.6 + Math.random() * 0.6; if (sfx.note) sfx.note(392, 0.9, 'sine', 0.012, 396); }
  }
  /* the summon: the Wind seal under the pet; the hub unfolds behind it: four leaves, the pink flower, the white flower;
     the green then the white tentacles unfurl from their roots; the ring forms overhead and its swords settle; the lift-off */
  function stepSummon(S, dt) {
    const d = S.V, P = d.pose, t = S.t, T = TUNE.summon, Q = TUNE.sum, U2 = S.unf, w = (r, x) => sstep(r[0], r[1], x);
    P.alpha = sstep(0.1, 0.45, t);
    U2.leaves = outBack(w(Q.leaves, t), 2.4); U2.bloom = outBack(w(Q.bloom, t), 2.6); U2.white = outBack(w(Q.white, t), 2.6); U2.tentG = outBack(w(Q.tentG, t), 2.0); U2.tentW = outBack(w(Q.tentW, t), 2.2); U2.ring = outBack(w(Q.ring, t), 2.8);
    U2.glow = 0.3 + 1.2 * bump(t, Q.bloom[0], Q.bloom[1], Q.white[1]) + 0.4 * w(Q.white, t); U2.ringGlow = 2 * bump(t, Q.ring[0], Q.ring[1], T) + 0.6 * w(Q.ring, t); U2.spinV = lerp(9, 1.5, w([Q.ring[0], T], t)); U2.fold = 0;
    d.z = lerp(0.2, TUNE.cruise, inOut(w(Q.lift, t))); d.vx = d.vy = 0;
    /* each layer opening: a breath of petals and light (E's summon draws the seal and the rest) */
    for (const [key, col, n] of [['leaves', LEAF, 6], ['bloom', PINK, 14], ['white', WHITE, 8], ['ring', MINT2, 10]]) { if (!S['s_' + key] && t >= Q[key][0] + 0.12) { S['s_' + key] = true; petals(S, d.x, d.y, d.z + (key === 'ring' ? 4.6 : 1.6), n, key === 'ring' ? 2 : 4, col); const sfx = S.X.sfx || {}; if (sfx.note) sfx.note(key === 'ring' ? 1568 : key === 'white' ? 1175 : key === 'bloom' ? 880 : 587, 0.4, 'sine', 0.05, key === 'ring' ? 2093 : 0); kick(S, 'z', 1.2); } }
    if (!S.lifted && t >= Q.lift[0]) { S.lifted = true; const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); addPart(S, 9, d.x, d.y, 0, 0, 0, 0, 0.6, 2.8); }
    if (t >= T) { S.phase = 'fly'; S.t = 0; d.locked = false; S.left = S.dur; S.endT = S.g.t + S.dur; P.alpha = 1; S.stats.menuSets++; for (const k in U2) if (k !== 'glow' && k !== 'ringGlow' && k !== 'spinV' && k !== 'fold') U2[k] = 1; }
  }

  /* ---- exits: the glide to valid ground, the pet set down, the flower folded and dissolved into petals and light, the cooldown ---- */
  function startOut(S, how) {
    if (S.phase === 'out' || S.released) return;
    const d = S.V; S.swoosh = null; S.spinA = 0; S.busy = null; S.mvQ = null; S.dQ = null; S.ultQ = null; S.recallT = null; S.eAct = null;
    S.outHow = how || 'timeout'; S.fromPhase = S.phase; S.phase = 'out'; S.t = 0; S.outT = 0; d.locked = true; S.cam = null; S.ctx.finisher = null; S.ctx.field = null; S.ring = 'overhead';
    const p = S.retPt && safeOK(S, S.retPt.x, S.retPt.y) ? S.retPt : safeReturn(S); S.ret = p;
    S.outFrom = { x: d.x, y: d.y, z: d.z }; S.outGlide = clamp(Math.hypot(p.x - d.x, p.y - d.y) / TUNE.outSpd, TUNE.outGlide[0], TUNE.outGlide[1]); S.hopped = false; S.petHop = 0;
    for (const k of ['leaves', 'bloom', 'white', 'tentG', 'tentW', 'ring']) S.unf[k] = 1; S.unf.glow = 0.8; S.unf.ringGlow = 0.8; S.unf.fold = 0; S.unf.spinV = 2;
    const sfx = S.X.sfx || {}; if (sfx.note) [1319, 1047, 784, 523].forEach((f, i) => sfx.note(f, 0.4, 'sine', 0.04, f * 0.98, i * 0.1));
    callMove(S, 'exit', { x: p.x, y: p.y, glide: S.outGlide, fold: TUNE.fold, how: S.outHow });
  }
  function stepOut(S, dt) {
    const d = S.V, P = d.pose, me = S.me, U2 = S.unf; S.outT += dt;
    if (S.outT < S.outGlide) { const u = sstep(0, 1, S.outT / S.outGlide), x0 = d.x, y0 = d.y; d.x = lerp(S.outFrom.x, S.ret.x, u); d.y = lerp(S.outFrom.y, S.ret.y, u); d.z = lerp(S.outFrom.z, TUNE.outZ, u); if (dt > 0) { d.vx = (d.x - x0) / dt; d.vy = (d.y - y0) / dt; } return; }
    d.vx = d.vy = 0; d.x = S.ret.x; d.y = S.ret.y;
    if (!S.hopped) { S.hopped = true; S.petHop = 0; const sfx = S.X.sfx || {}; if (sfx.jump) sfx.jump(); }
    S.petHop += dt; me.x = S.ret.x; me.y = S.ret.y; me.vx = me.vy = 0;
    /* the fold, outside in reverse of the summon: ring, tentacles, white flower, pink flower, leaves; then light */
    const v = cl((S.outT - S.outGlide) / TUNE.fold), gone = d.vis < 0.05;
    const rs = bump(v, 0, 0.09, 0.22), ez = (a, b) => Math.pow(sstep(a, b, v), 1.7);   /* (it resists: a last breath open with a shiver, then the fold gathers pace) */
    U2.ring = 1 - ez(0.06, 0.3); U2.tentW = 1 + 0.12 * rs - ez(0.12, 0.44); U2.tentG = 1 + 0.08 * rs - ez(0.16, 0.52); U2.white = 1 + 0.08 * rs - ez(0.32, 0.58); U2.bloom = 1 + 0.12 * rs - ez(0.42, 0.82); U2.leaves = 1 + 0.04 * rs - ez(0.56, 0.93); S.exitShiver = 0.03 * bump(v, 0.03, 0.12, 0.3); U2.fold = sstep(0.3, 0.7, v); U2.glow = 0.8 + 0.8 * bump(v, 0.3, 0.6, 0.9); U2.ringGlow = 1.6 * (1 - sstep(0, 0.25, v));
    P.alpha = gone ? 0 : 1 - sstep(0.7, 1, v);
    if (!gone && Math.random() < dt * (lowFx() ? 20 : 60) * (0.3 + v)) { const a = Math.random() * TAU, r = Math.random() * 2.6 * (1 - 0.6 * v); addPart(S, Math.random() < 0.75 ? 3 : 1, d.x + Math.cos(a) * r, d.y, d.z + 1.6 + Math.sin(a) * r * 0.9, Math.cos(a) * 1.4, (Math.random() - 0.5) * 0.6, 0.6 + Math.random() * 1.4, 0.9 + Math.random() * 0.7, 0.12, { col: Math.random() < 0.6 ? PINK : Math.random() < 0.5 ? BLUSH : MINT2, drag: 0.8 }); }
    if (v >= 1 || (gone && S.petHop > TUNE.hop)) release(S);
  }
  function finish(S, how) {
    if (S.released) return; S.outHow = how;
    const p = S.phase === 'out' && S.ret ? S.ret : safeReturn(S), me = S.me; me.x = p.x; me.y = p.y;   /* (never over the void, off the map or in a wall, even on defeat) */
    const d = S.V; if (d.vis > 0.05 && (d.pose.alpha || 0) > 0.05) { petals(S, d.x, d.y, d.z + 1.6, lowFx() ? 12 : 30, 5); S.fade = 0.35; }
    release(S);
  }
  /* the one guarded cleanup path: the controls, the camera, the cooldown, once */
  function release(S) {
    if (S.released) return;
    S.released = true; S.ended = true; S.relT = 0;
    const me = S.me, g = S.g, X = S.X;
    if (S.ret && S.phase === 'out') { me.x = S.ret.x; me.y = S.ret.y; }
    if (!safeOK(S, me.x, me.y) && !canStand(S, me.x, me.y)) { const p = safeReturn(S); me.x = p.x; me.y = p.y; }
    S.phase = 'gone'; S.busy = null; S.swoosh = null; S.mvQ = null; S.ultQ = null; S.dQ = null; S.cam = null; S.eAct = null; S.eCh = null; S.ring = 'overhead';
    if (S.ctx) { S.ctx.finisher = null; S.ctx.field = null; S.ctx.recall = false; } S.V.locked = true;
    try { X.vehicle(null); } catch (e) { /* (hook) */ }
    if (me.petAlt === S.fx) me.petAlt = null;
    me.vx = me.vy = 0; me.z = 0; me.push = null; me.castT = 0; me.airborne = false;
    g.cdU = S.CD; S.stats.cdSet++;   /* the cooldown starts now, once */
    g.tapBuf = 0; g.tapAim = null; g.normalT = Math.max(g.normalT || 0, 0.2);
    S.fx.life = 0.9; S.fx.onEnd = null;
  }

  /* ---- pooled particles: 1 mint spark (additive), 2 soft mist, 3 a petal (drawn as a small turned petal shape), 9 a pale ring of light on the floor ---- */
  const CAP = 260;
  function addPart(S, kind, x, y, z, vx, vy, vz, life, s, o) {
    if (S.parts.length >= CAP * (lowFx() ? 0.45 : 1)) return null;
    const p = S.free.pop() || {}; p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.s = s; p.g = (o && o.g) || 0; p.drag = (o && o.drag) || 0; p.grow = (o && o.grow) || 0; p.col = (o && o.col) || null; p.r = Math.random() * TAU; p.w = (Math.random() - 0.5) * 6;
    S.parts.push(p); return p;
  }
  function stepParts(S, dt) {
    for (let i = S.parts.length - 1; i >= 0; i--) { const p = S.parts[i]; p.life -= dt; if (p.life <= 0) { S.parts[i] = S.parts[S.parts.length - 1]; S.parts.pop(); S.free.push(p); continue; }
      const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz = p.vz * k - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); p.r += p.w * dt; }
    for (let i = S.marks.length - 1; i >= 0; i--) { const m = S.marks[i]; m.t += dt; if (m.t > m.life) S.marks.splice(i, 1); }
  }
  function petals(S, x, y, z, n, v0, col) { const Q = lowFx() ? 0.45 : 1; for (let i = 0; i < Math.round(n * Q); i++) { const a = Math.random() * TAU, v = v0 * (0.3 + Math.random() * 0.8); addPart(S, i % 4 === 3 ? 1 : 3, x, y, z, Math.cos(a) * v, Math.sin(a) * v * 0.4, (Math.random() - 0.3) * v * 0.6, 0.8 + Math.random() * 0.7, 0.12, { g: 1.2, drag: 1.6, col: col || (i % 3 ? PINK : BLUSH) }); } }

  /* ================= drawing ================= */
  const mOpts = (S, T, extra) => Object.assign({ T, sx: S.H.sx, sy: S.H.sy, t: S.g.t, low: lowFx(), scale: S.size }, extra || null);
  function callM(S, c, k) { const MV = moves(); if (MV[k] && S.ctx) { c.save(); try { MV[k](S.ctx, c); } catch (e) { /* (theirs) */ } c.restore(); } }
  function drawUnder(S, c) {
    const H = S.H, T = H.X.Tz(), d = S.V, M0 = MOD();
    /* the Wind seal's light under the pet at the summon (light only, feathered; E's summon draws the seal itself) */
    const sealA = S.phase === 'summon' ? Math.min(1, S.t / 0.3) * (1 - sstep(TUNE.summon - 0.9, TUNE.summon - 0.2, S.t)) : 0;
    if (sealA > 0.01) { const X0 = H.sx(S.home.x), Y0 = H.sy(S.home.y), r = T * 2.8 * sstep(0, 0.5, S.t); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = sealA * 0.4; blitSized(c, glowSprite(MINT), X0 - r, Y0 - r * GY, r * 2, r * 2 * GY); c.globalAlpha = sealA * 0.22; blitSized(c, glowSprite(WHITE), X0 - r * 0.5, Y0 - r * 0.5 * GY, r, r * GY); c.restore(); }
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of S.parts) { if (p.kind !== 9) continue; const u = 1 - p.life / p.max, e = 1 - (1 - u) ** 3, r = T * p.s * (0.25 + 0.75 * e); c.globalAlpha = Math.pow(1 - u, 1.4) * 0.4; blitSized(c, glowSprite(MINT), H.sx(p.x) - r, H.sy(p.y) - r * GY, r * 2, r * 2 * GY); }
    c.restore();
    if (S.phase !== 'gone' && d.vis > 0.05 && M0.drawShadow && inMap(S, d.x, d.y) && groundAt(S, d.x, d.y)) { try { M0.drawShadow(c, d.x + (S.swayX || 0), d.y, d.z + (S.zOff || 0), 0, d.pose, mOpts(S, T)); } catch (e) { /* (model) */ } }   /* (no shadow on the open air) */
    callM(S, c, 'drawUnder');
  }
  function drawEnt(S, c) {
    const H = S.H, T = H.X.Tz(), d = S.V, M0 = MOD();
    if (S.phase === 'gone') { if (S.fade && S.relT < S.fade && d.vis > 0.05) { const a0 = d.pose.alpha; d.pose.alpha = a0 * (1 - S.relT / S.fade); try { M0.draw(c, d.x, d.y, d.z, 0, d.pose, mOpts(S, T)); } catch (e) { /* (model) */ } d.pose.alpha = a0; } return; }
    const out = S.phase === 'out' && S.hopped, ph = S.phase === 'summon' ? lerp(1.5, TUNE.petH, sstep(0.3, 1.2, S.t)) : TUNE.petH;
    /* the pet at the flower's heart: upright, never yawed or rolled, always in view */
    let petDone = false; const o = mOpts(S, T, { pet: (cc, PX, PY) => { petDone = true; S.seatS = [PX, PY]; if (!out) H.X.drawPetAt(cc, PX, PY, { maxH: ph }); } });
    let drawn = false; if (d.vis > 0.05) { try { M0.draw(c, d.x + (S.swayX || 0), d.y, d.z + (S.zOff || 0), 0, d.pose, o); drawn = true; } catch (e) { drawn = false; } }
    if (!petDone) { const p = S.ctx.anchor('seat'); S.seatS = [H.sx(p.x), H.sy(p.y) - p.z * ZK * T]; if (!out) H.X.drawPetAt(c, S.seatS[0], S.seatS[1], { maxH: ph }); }   /* (the lead's model leaves the pet to the core: drawn at the seat anchor, over the flower) */
    if (out) { const u = cl(S.petHop / TUNE.hop), s3 = S.seatS, gx = H.sx(S.ret.x), gy = H.sy(S.ret.y); H.X.drawPetAt(c, lerp(s3[0], gx, u), lerp(s3[1], gy, u * u), u < 1 ? { maxH: lerp(TUNE.petH, 1.5, u * u) } : {}); }
    callM(S, c, 'drawEnt');
  }
  function drawOver(S, c) {
    const H = S.H, T = H.X.Tz();
    callM(S, c, 'drawOver');
    if (S.marks.length) { c.save(); for (const m of S.marks) { const a = 1 - Math.pow(Math.min(1, m.t / m.life), 2), X0 = H.sx(m.x), Y0 = H.sy(m.y), r = T * 0.7; c.globalAlpha = 0.8 * a; c.strokeStyle = '#FF9AB8'; c.lineWidth = T * 0.08; c.setLineDash([T * 0.18, T * 0.14]); c.beginPath(); c.ellipse(X0, Y0, r, r * GY, 0, 0, TAU); c.stroke(); c.setLineDash([]); c.beginPath(); c.moveTo(X0 - r * 0.5, Y0 - r * 0.35); c.lineTo(X0 + r * 0.5, Y0 + r * 0.35); c.moveTo(X0 + r * 0.5, Y0 - r * 0.35); c.lineTo(X0 - r * 0.5, Y0 + r * 0.35); c.stroke(); } c.restore(); }
    if (!S.parts.length) return;
    const sp = S.seatS || [-1e9, -1e9], PX = sp[0], PY = sp[1] - T * 0.35;
    c.save();
    for (const p of S.parts) { if (p.kind === 9) continue; const X0 = H.sx(p.x), Y0 = H.sy(p.y) - p.z * ZK * T, u = 1 - p.life / p.max, keep = 0.05 + 0.95 * sstep(T * 0.4, T * 1.0, Math.hypot(X0 - PX, Y0 - PY));   /* (never over the pet's face) */
      const a = cl(p.life / Math.min(0.35, p.max)) * Math.min(1, u * 8) * keep; if (a < 0.02) continue;
      if (p.kind === 3) { const r = T * p.s; c.globalCompositeOperation = 'source-over'; c.globalAlpha = a * 0.92; c.save(); c.translate(X0, Y0); c.rotate(p.r); c.scale(1, 0.55 + 0.4 * Math.sin(p.r * 1.7)); c.fillStyle = p.col || PINK; c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(0, -r * 0.9, r, 0); c.quadraticCurveTo(0, r * 0.9, -r, 0); c.fill(); c.restore(); continue; }
      const r = T * p.s * (p.kind === 2 ? 3 * (1 + p.grow * u) : 1); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * (p.kind === 2 ? 0.15 : 1); blitSized(c, glowSprite(p.col || MINT), X0 - r, Y0 - r, r * 2, r * 2); }
    c.restore();
  }

  /* ================= the HUD: Swoosh; Wildflowers; Ring Blade (dimmed while the ring is away); Twister's gauge and the timer ================= */
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  function drawBtns(S, c, o) {
    const { B, blitC, hudPic, glowPic } = o, t = S.g.t, idle = S.phase !== 'fly' || (S.V.locked && !S.busy), ic = moves().icons || null;
    const btn = (b, key, label, cd, cdMax, paint, busy, off) => { if (!b) return; const rd = cd <= 0.01 && !idle && !S.busy && !S.swoosh && !off;
      if (rd) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22 + 0.08 * Math.sin(t * 5); blitC(c, glowPic(glowSprite, MINT, Math.round(b.r * 1.7)), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`bel|${key}|${rd}|${b.r}|${ic && ic[key] ? 1 : 0}`, b.r * 2 + 10, b.r * 2 + 10, (x, w, h) => { const cx = w / 2, cy = h / 2; btnFace(x, cx, cy, b.r, rd); let ok = false; if (ic && typeof ic[key] === 'function') { try { ic[key](x, cx, cy, b.r, rd); ok = true; } catch (e) { ok = false; } } if (!ok) paint(x, cx, cy, b.r, rd); btnRim(x, cx, cy, b.r, rd); }), b.x, b.y);
      if (busy) { c.save(); c.lineWidth = 3; c.strokeStyle = rgba(MINT2, 0.85); c.beginPath(); c.arc(b.x, b.y, b.r + 2, t * 6, t * 6 + 1.6); c.stroke(); c.restore(); }
      if (cd > 0.05) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, cd / Math.max(0.1, cdMax))); c.closePath(); c.fillStyle = 'rgba(6,16,10,.55)'; c.fill(); GFX.textS(c, cd.toFixed(1), b.x, b.y, 13, '#FFFFFF'); }
      GFX.labelS(c, label, b.x, b.y + b.r + 9, 8, 800, '#EAFFF4', 'rgba(0,0,0,.7)', 3); };
    const away = S.ring !== 'overhead';
    btn(B.s[0], 'wildflowers', 'WILDFLOWERS', S.cd.s1, S.cdMax.s1 || TUNE.wildCd, paintWildBtn, S.busy === 'wildflowers');
    btn(B.s[1], 'ringBlade', away ? 'RING AWAY' : 'RING BLADE', S.cd.s2, S.cdMax.s2 || TUNE.ringCd, paintRingBtn, S.busy === 'ringBlade' || away, away);
    btn(B.d, 'swoosh', 'SWOOSH', S.cd.dodge, S.cdMax.dodge || TUNE.dodgeCd, paintSwooshBtn, !!S.swoosh);
    { const b = B.u, full = S.charge >= 1 && !S.used, k = S.used ? 1 : S.charge, fin = S.phase === 'finisher';
      if (full || fin) { const pl = 0.5 + 0.5 * Math.sin(t * 6); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.35 * pl; blitC(c, glowPic(glowSprite, MINT, Math.round(b.r * (2.1 + 0.25 * pl) * 4) / 4), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`bel|ult|${full || fin}|${b.r}|${ic && ic.twister ? 1 : 0}`, b.r * 2 + 12, b.r * 2 + 12, (x, w, h) => { const cx = w / 2, cy = h / 2; let ok = false; paintUltFace(x, cx, cy, b.r, full || fin); if (ic && typeof ic.twister === 'function') { try { ic.twister(x, cx, cy, b.r, full || fin); ok = true; } catch (e) { ok = false; } } if (!ok) paintTwisterBtn(x, cx, cy, b.r, full || fin); x.lineWidth = 2; x.strokeStyle = full || fin ? GOLD : 'rgba(244,230,176,.4)'; x.beginPath(); x.arc(cx, cy, b.r, 0, TAU); x.stroke(); }), b.x, b.y);
      c.save(); c.lineCap = 'round'; c.lineWidth = 4.5; c.strokeStyle = 'rgba(6,16,10,.85)'; c.beginPath(); c.arc(b.x, b.y, b.r - 2, 0, TAU); c.stroke(); if (k > 0.004) { c.strokeStyle = full ? WHITE : S.used ? 'rgba(184,255,224,.4)' : MINT; c.lineWidth = 3.5; c.beginPath(); c.arc(b.x, b.y, b.r - 2, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke(); } c.restore();
      const ph = S.phase, on = ph === 'fly', left = on ? S.left : ph === 'summon' ? S.dur : 0;
      if (on || ph === 'summon') { const u = cl(left / S.dur), low = on && left < 5; c.save(); c.lineCap = 'round'; c.lineWidth = 2.5; c.strokeStyle = low ? 'rgba(255,120,150,.95)' : 'rgba(230,255,244,.9)'; c.beginPath(); c.arc(b.x, b.y, b.r + 4.5, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); c.restore();
        GFX.labelS(c, Math.ceil(left) + 's', b.x, b.y + b.r * 0.7, 10, 900, low ? '#FF9AB8' : '#F2FFF8', 'rgba(0,0,0,.75)', 3); }
      const lab = fin ? 'TWISTER!' : full ? 'TWISTER' : S.used ? 'TWISTER USED' : `TWISTER ${Math.floor(S.charge * 100)}%`;
      if (full) { const s = 1 + 0.08 * Math.sin(t * 7); c.save(); c.translate(b.x, b.y + b.r + 10); c.scale(s, s); GFX.labelS(c, lab, 0, 0, 11, 900, WHITE, 'rgba(10,60,40,.9)', 3.5); c.restore(); }
      else GFX.labelS(c, lab, b.x, b.y + b.r + 9, 9, 800, '#EAFFF4', 'rgba(0,0,0,.7)', 3); }
  }
  /* deep green faces, a pale gold rim, a mint inner ring when ready */
  function btnFace(x, cx, cy, r, rd) { const g = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); if (rd) { g.addColorStop(0, '#3E8E62'); g.addColorStop(0.55, '#174A30'); g.addColorStop(1, '#06180E'); } else { g.addColorStop(0, '#2A3430'); g.addColorStop(0.6, '#161E1A'); g.addColorStop(1, '#090D0B'); } x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
  function btnRim(x, cx, cy, r, rd) { x.lineWidth = 3; x.strokeStyle = rd ? GOLD : 'rgba(244,230,176,.4)'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke(); x.lineWidth = 1.6; x.strokeStyle = rd ? MINT : 'rgba(184,255,224,.3)'; x.beginPath(); x.arc(cx, cy, r - 2.5, 0, TAU); x.stroke(); if (rd) { x.fillStyle = 'rgba(255,255,255,.16)'; x.beginPath(); x.ellipse(cx - r * 0.3, cy - r * 0.5, r * 0.3, r * 0.12, -0.5, 0, TAU); x.fill(); } }
  const blossom = (x, px, py, r, rd, col) => { x.save(); x.translate(px, py); for (let i = 0; i < 5; i++) { x.rotate(TAU / 5); x.fillStyle = rd ? (col || PINK) : '#6A5560'; x.beginPath(); x.ellipse(0, -r * 0.55, r * 0.36, r * 0.55, 0, 0, TAU); x.fill(); } x.fillStyle = rd ? '#FFF3B0' : '#8A8470'; x.beginPath(); x.arc(0, 0, r * 0.24, 0, TAU); x.fill(); x.restore(); };
  /* Swoosh: a spiral of wind with a sharp outer edge, a blossom riding it */
  function paintSwooshBtn(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.lineCap = 'round'; for (let i = 0; i < 3; i++) { x.strokeStyle = i === 0 ? (rd ? MINT2 : '#8A9A92') : rd ? rgba(MINT, 0.5 - i * 0.15) : 'rgba(184,255,224,.2)'; x.lineWidth = r * (0.1 - i * 0.02); x.beginPath(); for (let k = 0; k <= 24; k++) { const a = -2.4 + k / 24 * 5.2, rr = r * (0.62 - i * 0.1) * (0.45 + 0.55 * k / 24); const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.8; if (k) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke(); } blossom(x, r * 0.02, 0, r * 0.26, rd); x.restore(); }
  /* Wildflowers: a storm of blossoms */
  function paintWildBtn(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.strokeStyle = rd ? rgba(MINT2, 0.7) : 'rgba(184,255,224,.25)'; x.lineWidth = r * 0.06; x.lineCap = 'round'; x.beginPath(); x.ellipse(0, r * 0.05, r * 0.62, r * 0.36, -0.3, 0.4, 5.2); x.stroke(); blossom(x, -r * 0.28, -r * 0.2, r * 0.26, rd); blossom(x, r * 0.3, -r * 0.05, r * 0.22, rd, '#FF9CC6'); blossom(x, -r * 0.02, r * 0.3, r * 0.3, rd, '#FF5FA0'); x.restore(); }
  /* Ring Blade: the ring and its eight swords */
  function paintRingBtn(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.strokeStyle = rd ? '#EAF2EC' : '#7A847E'; x.lineWidth = r * 0.07; x.lineCap = 'round'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; x.beginPath(); x.moveTo(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36); x.lineTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72); x.stroke(); } x.strokeStyle = rd ? GOLD : '#8A8470'; x.lineWidth = r * 0.11; x.beginPath(); x.arc(0, 0, r * 0.3, 0, TAU); x.stroke(); x.strokeStyle = rd ? MINT : 'rgba(184,255,224,.3)'; x.lineWidth = r * 0.04; x.beginPath(); x.arc(0, 0, r * 0.3, 0, TAU); x.stroke(); x.restore(); }
  function paintUltFace(x, cx, cy, r, full) { const g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r); g.addColorStop(0, full ? '#3FA070' : '#1E2C26'); g.addColorStop(0.6, full ? '#12482E' : '#101A16'); g.addColorStop(1, '#030806'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
  /* Twister: six funnels round a bloom */
  function paintTwisterBtn(x, cx, cy, r, full) { x.save(); x.translate(cx, cy); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - 0.5, px = Math.cos(a) * r * 0.52, py = Math.sin(a) * r * 0.4 + r * 0.05; x.fillStyle = full ? (i % 2 ? rgba(MINT2, 0.9) : rgba(BLUSH, 0.9)) : '#56605A'; x.beginPath(); x.moveTo(px - r * 0.13, py - r * 0.2); x.lineTo(px + r * 0.13, py - r * 0.2); x.lineTo(px + r * 0.03, py + r * 0.16); x.lineTo(px - r * 0.03, py + r * 0.16); x.closePath(); x.fill(); } blossom(x, 0, 0, r * 0.24, full); x.restore(); }

  /* ================= the Ultimate ================= */
  U.belladonna = (C, H) => {
    const me = H.me, g = H.g;
    /* (a spirit, an actor that is not the played pet: a burst of wind and petals where it stands) */
    if (me.spirit || !H.X.vehicle || !H.X.drawPetAt) { const DK = C.base * (C.K || 1); H.hitArea(me.x, me.y, 2.6, DK * 2.5, { el: 'wind', src: 'ult' }); H.X.ring(me.x, me.y, 0.3, 2.6, 0.5, MINT, 0.3); return; }
    if (g._belladonna && !g._belladonna.released) return;
    startForm(C, H);
  };
  /* idle-time preparation (20b calls it for an equipped Ultimate at the floor's start): the model's and E's, a slice a frame */
  let PUMP = null;
  U.belladonna.warm = o => { setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T, M0 = MOD(); if (!(T > 0) || !M0) return;
    if (PUMP) return; let last = nowMs(), mvDone = false;
    const slice = ms => { let done = true; try { if (M0.warm) done = M0.warm(ms) === true; } catch (e) { done = true; } const MV = moves(); if (!mvDone && MV.warm) { try { mvDone = MV.warm(Math.min(2, ms)) === true; } catch (e) { mvDone = true; } } else mvDone = true; return done && mvDone; };
    PUMP = () => requestAnimationFrame(() => setTimeout(() => { const n = nowMs(), gap = n - last; last = n; if (slice(gap < 20 ? 3 : gap < 34 ? 1.6 : 0.8)) { PUMP = null; return; } PUMP(); }, 0));
    PUMP(); }, 300); };
  U.belladonna.TUNE = TUNE; U.belladonna.CLIPS = CLIPS;
  U.belladonna.__dbg = { TUNE, CLIPS, SPR, STUB, STUBM, MOD, moves, safeReturn, nearestLand, groundAt, target, aimPoint, planSwoosh, routeOK, startOut, finish };
})();
