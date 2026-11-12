/* ---------- Ice's 11th Ultimate: Fenrir (the core: worker A) ----------
   A giant mechanical ice wolf that folds into a motorcycle, ridden by the pet in the open on its saddle. Both forms are
   as big as the Sports Car (20k4p: 3.24 tiles long). It starts as the motorcycle.
   This file is the session and nothing else's: both forms' movement, Drift (the Dodge button: the attack first, then the
   transformation, the form and the menu changed exactly once when the other configuration is ready), the contextual menu,
   one summon timer (a game-clock deadline), one finisher gauge, one outer cooldown, the single guarded cleanup, and the
   animation layer on the model's pose channels.
     the model:  FENRIR_MODEL (worker M, 20k8m), or the stand-in below
     the moves:  self.FENRIR_MOVES (worker E, 20k8o), or the stubs below: iceCannon, somersault, spinningWheel,
                 fenrirDust (Diamond Dust), frozen, and the Drift's two pictures driftSweep / driftSpikes
   Every hit goes through ctx.hit / ctx.hitArea / ctx.hitOval: effective damage charges the gauge (never a finisher's:
   noCharge), and an area hit also breaks the scenery inside it through VEH_SMASH (20k0v), as does the body itself as it
   drives, runs, drifts or is moved by a move (ctx.move). Smashing deals no damage and charges nothing.
   The contract with M, E and H is written out in docs/ICE-FENRIR-BRIEF.md, Notes (A, 2026-11-12). */
(() => {
  const U = ELEM_IMPL.ice.ult;
  const TAU = Math.PI * 2;
  const ICE = '#7FD8FF', ICE2 = '#CFF3FF', COB = '#2A6BFF', DEEP = '#0E2A66', SILV = '#D6DEEA', CYAN = '#5FF2FF', WHITE = '#FFFFFF';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const wrap = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const outBack = (u, s) => { s = s == null ? 1.70158 : s; u = cl(u) - 1; return 1 + (s + 1) * u * u * u + s * u * u; };
  const inOut = u => { u = cl(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const outQ = u => 1 - Math.pow(1 - cl(u), 3);
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const calm = () => typeof reduceMotion !== 'undefined' && reduceMotion;
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const GY = 0.72, ZK = 0.695;

  /* ================= the tuning ================= */
  const TUNE = {
    dur: [20, 25, 35],          /* s of riding at evo 1-3 / 4-6 / 7, from the moment it can be ridden (one timer for both forms) */
    cd: 120,                    /* s: the Ult's cooldown, from the exit (the kit row's own cd is used when present) */
    start: 'bike',
    /* (the user: "as big as a sports car, and so should the motorcycle form") the motorcycle is drawn exactly as long as
       the Sports Car, 3.24 tiles: the model's scale is len / FENRIR_MODEL.SIZE.bike.len (x size), so it holds whatever
       the model's own units become; the wolf is the same parts at the same scale. The camera does not pull back (the
       Sports Car's does not either), so the two are the same length on the screen too */
    size: 1, len: 3.24, hw: 0.56,   /* a multiplier on that scale; the body's length and half width in tiles (the collision's) */
    zoom: 1,                    /* the camera's zoom while it is out (zoom only: k 0, the game's own follow) */
    petH: 0.5,                  /* the rider's height in tiles on the saddle (the Sports Car's driver: 1.2 in a cockpit; a small rider on a big machine) */
    /* the motorcycle drives as the Sports Car does (fast, a turn rate that grows with speed, deep leans); the wolf runs a
       little slower, starts and stops at once and turns far tighter */
    bike: { top: 11.8, accel: 24, coast: 10.5, over: 7, steer: [3.3, 6.2], grip: 13, bump: 0.45, lean: 0.52, leanK: 0.105 },
    wolf: { top: 10.2, accel: 42, coast: 30, over: 16, steer: [10.5, 8.2], grip: 24, bump: 0.55, lean: 0.2, leanK: 0.03, stride: 2.9 },
    /* Drift: a burst along the stick with the body spinning through one full turn (the moving sweep), the stop and the
       ice spikes at the destination, then the transformation; the form and the menu change at its end */
    drift: { cd: 1.9, ph: [0.05, 0.32, 0.3, 0.8], v: 19, turn: 5, buf: 0.25, inv: 0.62,
      r: 2.5, dmg: 3.0, kb: 7.5,                  /* damage phase 1, the moving sweep: tiles round the centre, x DK once per monster, knockback */
      spikeAt: 0.07, spikeR: 3.0, spikeDmg: 4.0, spikeKb: 5, spikeFreeze: 0.5 },   /* damage phase 2, the eruption at the stop: s into it, tiles, x DK once per monster */
    cannonCd: 2.5, s2Cd: 3.5,   /* s (E's FENRIR_MOVES.TUNE.cannonCd / s2Cd win when present); both shared across the forms */
    chargeK: 32,                /* the gauge fills at chargeK x DK of damage actually dealt */
    /* Jump (both forms; the Sports Car's and the Beast Machine's): a hop along the stick (else the heading) over gaps,
       water, pits and lava, never through a wall; the landing is planned before take-off, where the whole body fits and
       the pet could walk from. No cooldown; a press in the air is kept for the touchdown; never a jump in mid-air */
    jump: { dmg: 2.6, r: 2.6, kb: 6, ph: [0.1, 0.62], h: [1.5, 1.9], v: 9.5, max: 8, ext: 2, buf: 0.25, inv: 0.3, invLock: 1.8 },   /* x DK once per monster on landing; tiles; knockback; s squat / airtime; peak height bike / wolf; least launch speed; longest hop; how much further it may reach; a press this early is kept; take-off protection, at most once per invLock s */
    summon: 1.5, hop: 0.42, dissolve: 0.75, finCap: 16, busyCap: 9,
    freshGap: 0.28, mvHold: 0.5,
  };
  const tierOf = ev => ev >= 7 ? 2 : ev >= 4 ? 1 : 0;
  const other = f => f === 'bike' ? 'wolf' : 'bike';

  /* ================= the model: FENRIR_MODEL (worker M), or a stand-in so the flow can run ================= */
  const STUBM = (() => {
    const A = {}; let L = null;
    const put = (n, x, y, z) => { const p = A[n] || (A[n] = { x: 0, y: 0, z: 0 }); p.x = x; p.y = y; p.z = z; };
    function frame(x, y, z, a, pose, s) { const ca = Math.cos(a), sa = Math.sin(a), w = pose.xf || 0, h = lerp(0.75, 1.25, w) + (pose.z || 0);
      const at = (n, lx, ly, lz) => put(n, x + (lx * ca - ly * sa) * s, y + (lx * sa + ly * ca) * s * GY, z + lz * s);
      at('center', 0, 0, h * 0.8); at('seat', -0.25, 0, h + 0.15); at('head', 1.5, 0, h + 0.1 * w); at('tailTip', -1.75, 0, h + 0.3);
      at('muzzleL', lerp(1.9, 1.6, w), 0.45, lerp(0.45, h + 0.45, w)); at('muzzleR', lerp(1.9, 1.6, w), -0.45, lerp(0.45, h + 0.45, w));
      at('wheelF', 1.05, 0, 0.42); at('wheelR', -1.05, 0, 0.42); at('pawFL', 1.0, 0.4, 0); at('pawFR', 1.0, -0.4, 0); at('pawRL', -1.0, 0.4, 0); at('pawRR', -1.0, -0.4, 0); }
    return {
      stub: true,
      create() { return { pose: { alpha: 1, xf: 0 } }; }, warm() { return true; }, warmIdle() {}, warmPlan() {},
      anchor(n) { return A[n] || null; },
      drawShadow(c, x, y, z, a, pose, o) { const T = o.T, k = (pose.alpha == null ? 1 : pose.alpha) * 0.3 / (1 + z * 0.4); if (k < 0.01) return; c.save(); c.globalAlpha = k; c.fillStyle = '#04101E'; c.translate(o.sx(x), o.sy(y)); c.rotate(Math.atan2(Math.sin(a) * GY, Math.cos(a))); c.beginPath(); c.ellipse(0, 0, T * 1.6 * (o.scale || 1), T * 0.5 * (o.scale || 1), 0, 0, TAU); c.fill(); c.restore(); },
      draw(c, x, y, z, a, pose, o) { const T = o.T, s = o.scale || 1, al = pose.alpha == null ? 1 : pose.alpha; frame(x, y, z, a, pose, s); L = 1; if (al < 0.01) { if (o.pet) { const p = A.seat; o.pet(c, o.sx(p.x), o.sy(p.y) - p.z * ZK * T); } return; }
        const w = pose.xf || 0, X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T, sa = Math.atan2(Math.sin(a) * GY, Math.cos(a)), fl = (pose.flip || 0) * Math.cos(a), h = lerp(0.75, 1.25, w) * ZK * T * s * (1 - 0.35 * (pose.curl || 0) - 0.2 * (pose.crouch || 0));
        c.save(); c.globalAlpha = al; c.translate(X0, Y0 - h * 0.5); c.rotate(-fl); c.translate(0, h * 0.5);
        const px = (lx, lz) => [Math.cos(sa) * lx * T * s, Math.sin(sa) * lx * T * s - lz * ZK * T * s];
        /* wheels (bike) / legs (wolf) */
        for (const lx of [1.05, -1.05]) { const p = px(lx * (1 - 0.25 * w), 0.42 + 0.45 * w), r = T * 0.42 * s * (1 - 0.35 * w); c.fillStyle = '#10151C'; c.beginPath(); c.arc(p[0], p[1], r, 0, TAU); c.fill(); c.strokeStyle = CYAN; c.lineWidth = T * 0.05; c.beginPath(); c.arc(p[0], p[1], r * 0.62, (pose.wheelR || 0), (pose.wheelR || 0) + 4.4); c.stroke(); }
        if (w > 0.05) { c.strokeStyle = SILV; c.lineWidth = T * 0.16 * s; c.lineCap = 'round'; const g = (pose.gait || 0) * TAU, k = (pose.gaitK || 0) * 0.5; for (const [lx, ph] of [[1.0, 0], [0.8, 2.6], [-0.9, 3.4], [-1.1, 0.8]]) { const top = px(lx, h / (ZK * T * s) * 0.8), ft = px(lx + Math.sin(g + ph) * k, Math.max(0, Math.cos(g + ph)) * k * 0.5); c.globalAlpha = al * w; c.beginPath(); c.moveTo(top[0], top[1]); c.lineTo(ft[0], ft[1] * (1 - (pose.curl || 0))); c.stroke(); } c.globalAlpha = al; }
        /* body, head, tail, cannons */
        const b0 = px(-1.3, 0), b1 = px(1.3, 0); c.strokeStyle = '#8FA2BC'; c.lineWidth = T * 0.62 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(b0[0], b0[1] - h * 0.75); c.lineTo(b1[0], b1[1] - h * 0.75); c.stroke();
        c.strokeStyle = COB; c.lineWidth = T * 0.3 * s; c.beginPath(); c.moveTo(b0[0], b0[1] - h * 0.95); c.lineTo(px(-1.75, 0)[0], px(-1.75, 0)[1] - h * (1.05 + 0.2 * Math.sin(pose.tail || 0))); c.stroke();
        const hd = px(1.5, 0); c.fillStyle = SILV; c.beginPath(); c.arc(hd[0], hd[1] - h * (0.8 + 0.25 * w), T * 0.3 * s, 0, TAU); c.fill();
        const m0 = px(0.5, 0), m1 = px(lerp(1.9, 1.6, w) - 0.25 * Math.max(pose.recoilL || 0, pose.recoilR || 0), 0), mz = lerp(0.45, 1.25 + 0.45, w) * ZK * T * s; c.strokeStyle = (pose.barrel || 0) > 0.3 ? CYAN : '#39424E'; c.lineWidth = T * 0.1 * s; c.beginPath(); c.moveTo(m0[0], m0[1] - mz); c.lineTo(m1[0], m1[1] - mz); c.stroke();
        c.restore();
        if (o.pet) { const p = A.seat, ox = o.sx(p.x) - X0, oy = o.sy(p.y) - p.z * ZK * T - (Y0 - h * 0.5), cf = Math.cos(-fl), sf = Math.sin(-fl); o.pet(c, X0 + ox * cf - oy * sf, Y0 - h * 0.5 + ox * sf + oy * cf); }
        void L; },
    };
  })();
  /* the scale the model is drawn at, so that the motorcycle's length is TUNE.len tiles */
  function sizeOf(M0) { let L = 0; try { L = M0 && M0.SIZE && M0.SIZE.bike ? +M0.SIZE.bike.len : 0; } catch (e) { L = 0; } return TUNE.size * (L > 1 ? clamp(TUNE.len / L, 0.7, 1.6) : 1); }
  const MOD = () => (typeof FENRIR_MODEL !== 'undefined' && FENRIR_MODEL && FENRIR_MODEL.draw ? FENRIR_MODEL : STUBM);

  /* ================= E's moves (looked up at call time), or stubs so the flow can run ================= */
  const STUB = {
    stub: true, TUNE: {}, stats: { shots: 0, shatters: 0, frozenTicks: 0, dustHits: 0 },
    iceCannon(ctx) { const n = ctx.tier + 1, V = ctx.vehicle; let k = 0, t = 0; ctx.H.add({ life: 9, update(dt) { if (!ctx.alive()) { this.life = 0; return; } t += dt; ctx.clip('cannon', cl((t - k * 0.4) / 0.4));
      if (t >= k * 0.4 + 0.14 && !this['f' + k]) { this['f' + k] = 1; const T = ctx.target(); for (const s of [-1, 1]) { STUB.stats.shots++; const x = T.x - Math.sin(V.heading) * s * 0.7, y = T.y + Math.cos(V.heading) * s * 0.7; ctx.hitArea(x, y, 1.5, ctx.DK * 1.1, { chill: true }); ctx.X.ring(x, y, 0.2, 1.5, 0.4, ICE, 0.2); } }
      if (t >= (k + 1) * 0.4) { k++; if (k >= n) { this.life = 0; ctx.done(); } } } }); },
    somersault(ctx) { const V = ctx.vehicle; let t = 0; ctx.H.add({ life: 9, update(dt) { if (!ctx.alive()) { this.life = 0; return; } t += dt; const u = cl(t / 0.75); ctx.clip('somersault', u, { h: 2.2 }); ctx.move(Math.cos(V.heading) * 5 * dt, Math.sin(V.heading) * 5 * dt);
      if (u >= 1) { this.life = 0; ctx.hitArea(V.x, V.y, 2.8, ctx.DK * 4); ctx.X.ring(V.x, V.y, 0.3, 2.8, 0.5, ICE, 0.3); ctx.done(); } } }); },
    spinningWheel(ctx) { const V = ctx.vehicle, once = {}; let t = 0; ctx.H.add({ life: 9, update(dt) { if (!ctx.alive()) { this.life = 0; return; } t += dt; const u = cl(t / 1.0), s = ctx.stick(); if (s.mag > 0.2) V.heading += clamp(wrap(Math.atan2(s.y, s.x) - V.heading), -4 * dt, 4 * dt);
      ctx.clip('wheel', u, { spin: t * 22 }); ctx.move(Math.cos(V.heading) * 13 * dt, Math.sin(V.heading) * 13 * dt); ctx.hitArea(V.x, V.y, 1.7, ctx.DK * 3.2, { once });
      if (u >= 1) { this.life = 0; ctx.done(); } } }); },
    fenrirDust(ctx) { const V = ctx.vehicle; let t = 0, hit = 0; ctx.H.add({ life: 9, update(dt) { if (!ctx.alive()) { this.life = 0; return; } t += dt; ctx.clip('burnout', cl(t / 1.6)); V.heading += dt * 7;
      if (t > 1.6 && !hit) { hit = 1; STUB.stats.dustHits += ctx.hitArea(V.x, V.y, 6, ctx.DK * 9, { noCharge: true, freeze: 3, chill: true }); ctx.X.ring(V.x, V.y, 0.4, 6, 0.6, ICE2, 0.4); }
      if (t > 2.2) { this.life = 0; ctx.done(); } } }); },
    frozen(ctx) { const V = ctx.vehicle, tick = 0.25, n = 20; let t = 0, k = 0, t0 = -1; ctx.H.add({ life: 12, update(dt) { if (!ctx.alive()) { this.life = 0; return; } t += dt;
      if (t < 0.6) { ctx.clip('backflip', t / 0.6, { h: 2.4 }); return; } if (t < 1.0) { ctx.clip('lock', (t - 0.6) / 0.4); return; } if (t < 1.4) { ctx.clip('load', (t - 1.0) / 0.4); return; }
      if (t0 < 0) { t0 = ctx.g.t; ctx.frozenPlan = { t0, t1: t0 + 5, ticks: n, tick }; }
      const e = ctx.g.t - t0; ctx.clip('beam', cl(e / 5));
      while (k < n && e >= k * tick) { k++; STUB.stats.frozenTicks++; ctx.hitOval(V.x + Math.cos(V.heading) * 6.5, V.y + Math.sin(V.heading) * 6.5, 6, 1.3, V.heading, ctx.DK * 0.9, { noCharge: true, chill: true }); }
      if (e >= 5) { this.life = 0; ctx.done(); } } }); },
    /* the Drift's two pictures (the core deals both hits): driftSweep(ctx, D) as the slide starts, driftSpikes(ctx, D) at the stop; D is ctx.drift, live */
    driftSweep(ctx, D) { ctx.X.ring(D.x, D.y, 0.4, D.r, 0.35, ICE, 0.22); },
    driftSpikes(ctx, D) { ctx.X.ring(D.x, D.y, 0.3, D.spikeR, 0.5, ICE2, 0.4); ctx.X.ring(D.x, D.y, 0.2, D.spikeR * 0.6, 0.35, COB, 0.3); },
  };
  function moves() { let FM = null; try { FM = typeof self !== 'undefined' && self.FENRIR_MOVES ? self.FENRIR_MOVES : null; } catch (e) { FM = null; } return FM || STUB; }
  const mvFn = name => { const MV = moves(); return typeof MV[name] === 'function' ? [MV, MV[name]] : [STUB, STUB[name]]; };
  const mvTune = (k, d) => { const M = moves(); return M && M.TUNE && M.TUNE[k] != null ? M.TUNE[k] : d; };

  /* ================= the animation: targets built each frame (the ride's body language, the Drift, E's clip), then
     composed through per-channel springs so every change of pose carries weight, overshoot and settle =================
     The channels written to the model's pose (M reads them; angles in rad, the rest 0..1):
       xf (0 motorcycle .. 1 wolf)   alpha   assemble (summon 0..1)   crack (frost cracks, the exit)   glow (emissive)
       wheelF, wheelR (spin angles)  steer (fork / forequarters yaw, + to its left)   lean (roll, + to its left)
       pitch (+ nose up)   susp (0..1 compression)   crouch (0..1)   drift (0..1 the low drift / skid posture)
       gait (run cycle, in cycles: frac = phase)   gaitK (0..1 its amplitude: 0 stand .. 1 full gallop)
       flip (whole-body pitch rotation: + backflip, - forward somersault; full turns)   curl (0..1 Spinning Wheel)
       pawLock, piston (0..1)   recoilL, recoilR (0..1)   load (0..1 cartridge)   barrel (0..1 glow)   vent (0..1)
       tail (sway, + to its left), tailLift (0..1)   head (yaw toward the aim, + to its left), jaw (0..1)   mane (0..1 flare) */
  function spring(S, key, target, w, z, dt) { const A = S.an; let s = A[key]; if (!s) s = A[key] = { x: target, v: 0 }; if (!isFinite(s.x) || !isFinite(s.v)) { s.x = target; s.v = 0; }
    let left = Math.min(dt, 0.1); while (left > 1e-5) { const h = Math.min(left, 1 / 120); s.v += (-2 * z * w * s.v - w * w * (s.x - target)) * h; s.x += s.v * h; left -= h; } return s.x; }
  const kick = (S, key, dv) => { const s = S.an[key]; if (s) s.v += dv; };
  const SPR = { tuck: [17, 0.62], crystalGlow: [9, 0.85], lean: [10, 0.5], pitch: [12, 0.42], susp: [15, 0.38], steer: [16, 0.62], crouch: [15, 0.5], drift: [16, 0.6], z: [12, 0.42], tail: [6, 0.3], tailLift: [8, 0.5], head: [11, 0.6], mane: [9, 0.45], gaitK: [10, 0.9],
    pawLock: [22, 0.5], piston: [18, 0.55], recoilL: [30, 0.55], recoilR: [30, 0.55], load: [20, 0.7], barrel: [14, 0.9], vent: [12, 0.9], jaw: [14, 0.5], glow: [9, 0.8] };
  const DIRECT = ['flip', 'curl', 'crack'];
  const TG = () => ({ tuck: 0, crystalGlow: 1, lean: 0, pitch: 0, susp: 0, steer: 0, crouch: 0, drift: 0, z: 0, tail: 0, tailLift: 0, head: 0, mane: 0, gaitK: 0, pawLock: 0, piston: 0, recoilL: 0, recoilR: 0, load: 0, barrel: 0, vent: 0, jaw: 0, glow: 0.5, flip: 0, curl: 0, crack: 0, wheelK: 0, rearK: 0 });
  const bump = (u, a, b, c2) => sstep(a, b, u) * (1 - sstep(b, c2, u));
  /* the action clips E plays with ctx.clip(name, u, extra) (u 0..1 each frame while it lasts); s = the session */
  const CLIPS = {
    /* one paired volley: the chambers charge and glow, the shot kicks both barrels back and the nose up, vapour vents */
    cannon(G, u, s, ex) { const side = ex && ex.side, k = Math.exp(-Math.max(0, u - 0.35) * 9) * (u >= 0.35 ? 1 : 0); G.load = bump(u, 0, 0.3, 0.42); G.barrel = Math.max(sstep(0, 0.32, u) * (1 - sstep(0.5, 1, u)), k);
      if (side !== 'R') G.recoilL = k; if (side !== 'L') G.recoilR = k; G.pitch += 0.09 * k; G.susp += 0.35 * k; G.vent = bump(u, 0.35, 0.5, 1); G.jaw = 0.5 * k; G.mane = 0.5 * k; },
    /* the motorcycle's forward somersault: a squat, the leap, one full forward turn, the landing's compression */
    somersault(G, u, s, ex) { const h = (ex && ex.h) || 2.2, a = sstep(0.1, 0.9, u); G.crouch = 0.8 * bump(u, 0, 0.1, 0.22) + 0.6 * sstep(0.9, 1, u); G.flip = -TAU * (ex && ex.turns || 1) * inOut(a); G.z += h * Math.sin(Math.PI * a); G.susp = 0.9 * sstep(0.9, 1, u); G.wheelK = 2.5; G.mane = 1; G.glow = 1; },
    /* the wolf's Spinning Wheel: it curls into a ring and rolls (E's spin angle, else four turns), then uncurls */
    wheel(G, u, s, ex) { const c0 = sstep(0, 0.14, u) * (1 - sstep(0.86, 1, u)); G.curl = c0; G.flip = -((ex && ex.spin != null) ? ex.spin : (ex && ex.roll != null) ? ex.roll : u * TAU * 4) * (c0 > 0.02 ? 1 : 0); G.z += 0.55 * c0; G.gaitK = 0; G.tailLift = 1; G.mane = 1; G.glow = 1; G.crouch = 0.5 * (1 - c0) * bump(u, 0, 0.07, 0.14); },
    /* Diamond Dust's burnout: the rear wheel screaming, the body low and leant into the spin, a hard tremble */
    burnout(G, u, s) { const k = sstep(0, 0.15, u); G.rearK = 6 * k; G.drift = k; G.lean += 0.3 * k * (s.lastSide || 1); G.susp = 0.4 * k + 0.08 * Math.sin(s.g.t * 47); G.pitch += 0.03 * Math.sin(s.g.t * 61) * k; G.glow = 0.6 + 0.4 * u; G.mane = u; G.barrel = 0.3 * u; },
    /* Frozen: the backflip, the paws locking into the ground, the cartridges loading, the beam held, the cracks */
    backflip(G, u, s, ex) { const h = (ex && ex.h) || 2.4, a = sstep(0.12, 0.92, u); G.crouch = 0.9 * bump(u, 0, 0.12, 0.25) + 0.7 * sstep(0.92, 1, u); G.flip = TAU * inOut(a); G.z += h * Math.sin(Math.PI * a); G.tailLift = 1; G.gaitK = 0; G.mane = 0.8; },
    lock(G, u) { G.pawLock = outBack(u, 2.2); G.piston = sstep(0.3, 1, u); G.crouch = 0.45 * sstep(0, 0.6, u); G.head = 0; G.gaitK = 0; G.tailLift = 0.6; },
    load(G, u) { G.pawLock = 1; G.piston = 1; G.crouch = 0.45; G.load = u; G.barrel = 0.5 * u; G.vent = bump(u, 0.5, 0.8, 1); G.gaitK = 0; G.tailLift = 0.8; G.jaw = 0.3 * u; },
    beam(G, u, s) { const t = s.g.t, tr = 0.5 + 0.5 * Math.sin(t * 53); G.pawLock = 1; G.piston = 1; G.crouch = 0.5; G.load = 1; G.barrel = 1; G.recoilL = 0.55 + 0.25 * tr; G.recoilR = 0.55 + 0.25 * (1 - tr); G.pitch += 0.035 + 0.02 * Math.sin(t * 41); G.susp = 0.35 + 0.1 * tr; G.jaw = 1; G.mane = 1; G.glow = 1; G.gaitK = 0; G.tailLift = 1; G.tail = 0.15 * Math.sin(t * 9); G.vent = 0.6; },
    crack(G, u) { G.crack = u; G.pawLock = 1; G.crouch = 0.5 + 0.2 * u; G.glow = 1 - 0.7 * u; G.gaitK = 0; },
  };
  /* E's named poses (ctx.pose; 20k8o), on the same channels. E moves the body itself in these (its height too), so they add no rise */
  Object.assign(CLIPS, {
    cannonLoad(G, u, s, ex) { G.load = bump(u, 0, 0.6, 1.2); G.barrel = ex && ex.glow != null ? ex.glow : u; G.crouch += 0.12 * u; G.mane = 0.6; G.jaw = 0.3 * u; },
    cannonFire(G, u, s, ex) { G.recoilL = G.recoilR = u; G.barrel = ex && ex.glow != null ? ex.glow : u; G.pitch += 0.1 * u; G.susp += 0.4 * u; G.vent = 1 - u; G.jaw = 0.6 * u; G.mane = 0.5 + 0.5 * u; G.glow = 0.7 + 0.3 * u; },
    somersault(G, u, s, ex) { if (ex && ex.land != null) { G.flip = 0; G.susp = 0.9 * ex.land; G.crouch = 0.5 * ex.land; return; } G.flip = -TAU * u; G.crouch = 0.7 * (1 - sstep(0, 0.14, u)); G.susp = 0.6 * (1 - sstep(0, 0.12, u)); G.wheelK = 2.5; G.mane = 1; G.glow = 1; },
    wheelCurl(G, u) { G.curl = u; G.flip = -TAU * u; G.gaitK = 0; G.tailLift = 1; G.mane = 1; G.glow = 1; },
    wheelRoll(G, u, s, ex) { G.curl = 1; G.flip = -((ex && ex.roll) || u * TAU * 4); G.gaitK = 0; G.tailLift = 1; G.mane = 1; G.glow = 1; },
    wheelLand(G, u) { G.curl = 1 - u; G.flip = 0; G.crouch = 0.7 * (1 - u); G.susp = 0.6 * (1 - u); G.gaitK = 0; G.mane = 1 - 0.5 * u; },
    pawLock(G, u) { CLIPS.lock(G, u); },
    frozenLoad(G, u) { CLIPS.load(G, u); },
    frozenCharge(G, u, s, ex) { CLIPS.load(G, 1); G.barrel = ex && ex.glow != null ? 0.5 + 0.5 * ex.glow : 0.5 + 0.5 * u; G.mane = 1; G.glow = 0.6 + 0.4 * u; G.jaw = 0.3 + 0.5 * u; G.vent = 0; G.susp = 0.2 * u + 0.05 * Math.sin(s.g.t * 43) * u; },
    frozenFire(G, u, s, ex) { CLIPS.beam(G, u, s); if (ex && ex.recoil != null) { G.recoilL = 0.5 + 0.35 * ex.recoil; G.recoilR = 0.85 - 0.35 * ex.recoil + 0.15; } },
    frostCracks(G, u) { CLIPS.crack(G, u); },
  });
  function eClip(S) { const E = S.eAct; return E && S.g.t - E.t <= 0.12 && CLIPS[E.clip] ? E : null; }
  function animate(S, dt) {
    const V = S.V, P = V.pose, g = S.g, t = g.t, F = TUNE[S.form], D = S.drift, G = TG();
    const sp = Math.max(Math.hypot(V.vx, V.vy), S.carrySp || 0), k = cl(sp / F.top), w = P.xf || 0, riding = S.phase === 'ride' || S.phase === 'drift';
    const acc = dt > 0 ? (sp - (S.spPrev == null ? sp : S.spPrev)) / dt : 0; S.spPrev = sp; S.accS = (S.accS || 0) + (acc - (S.accS || 0)) * Math.min(1, dt * 8);
    /* --- the ride: lean into the turn, the nose lifting under power and dipping under the brakes, the fork steering --- */
    G.lean = clamp(-S.hw * k * lerp(TUNE.bike.leanK, TUNE.wolf.leanK, w), -lerp(TUNE.bike.lean, TUNE.wolf.lean, w), lerp(TUNE.bike.lean, TUNE.wolf.lean, w));
    G.steer = clamp(-S.hw * 0.14, -1, 1); G.pitch = clamp(S.accS * 0.0042, -0.1, 0.13) * (1 - 0.5 * w);
    G.wheelK = 1; G.rearK = 0; G.gaitK = w * k;
    /* the wolf's gallop: the body rises and pitches twice a stride, the tail streams; standing, it breathes and looks at its prey */
    const gp = (S.gait || 0) * TAU; G.z += w * k * 0.1 * (0.5 + 0.5 * Math.sin(gp * 2 + 0.6)); G.pitch += w * k * 0.04 * Math.sin(gp * 2 + 0.6);
    G.tail = 0.22 * Math.sin(t * 2.1) * (1 - k) + clamp(S.hw * 0.06, -0.5, 0.5) + w * k * 0.12 * Math.sin(gp); G.tailLift = 0.25 + 0.55 * k;
    G.susp += (1 - w) * (0.025 * Math.sin(t * 31) * (0.4 + 0.6 * k)) + w * (1 - k) * 0.05 * Math.sin(t * 1.9);
    G.mane = 0.25 + 0.5 * k; G.glow = 0.45 + 0.3 * k;
    /* the body crystals' inner glow (M, round 5): 1 at rest to 1.4 at full speed, flaring to 2 in an attack (a Drift, a Strong, a finisher, a Jump's landing) */
    G.crystalGlow = 1 + 0.4 * k; if (D || S.busy || S.phase === 'finisher' || (S.landT != null && t - S.landT < 0.4)) G.crystalGlow = 2;
    if (riding && !D) { const T = S.aimM; if (T && !T.dead) G.head = -clamp(wrap(Math.atan2(T.y - V.y, T.x - V.x) - V.heading), -0.7, 0.7) * (0.35 + 0.65 * w) * (1 - 0.6 * k); }
    /* --- the Drift: the low spinning skid, the hard stop, the unfolding --- */
    if (D) { const Dt = TUNE.drift.ph;
      if (D.ph <= 1) { const u = D.ph === 0 ? 0 : cl(D.t / Dt[1]); G.drift = 1; G.lean = -D.side * (0.55 - 0.2 * w) * (0.6 + 0.4 * Math.sin(u * Math.PI)); G.crouch = 0.55 * w + 0.15; G.rearK = 5 * (1 - w); G.wheelK = 0.4; G.gaitK = 0; G.steer = D.side; G.tailLift = 1; G.mane = 1; G.glow = 1; G.susp = 0.3; G.jaw = 0.6 * w; }
      else if (D.ph === 2) { const u = cl(D.t / Dt[2]); G.drift = 1 - sstep(0.3, 1, u); G.crouch = 0.75 * (1 - sstep(0.25, 1, u)); G.susp = 0.8 * (1 - u); G.pitch -= 0.1 * (1 - sstep(0, 0.5, u)); G.lean = -D.side * 0.2 * (1 - u); G.wheelK = 0; G.gaitK = 0; G.mane = 1; G.glow = 1; G.jaw = w; }
      else { const u = cl(D.t / Dt[3]); G.crouch = 0.5 * bump(u, 0, 0.18, 0.4) + 0.35 * sstep(0.85, 1, u) * (1 - sstep(0.93, 1, u)); G.z += 0.4 * Math.sin(Math.PI * sstep(0.1, 0.85, u)); G.pitch += 0.16 * Math.sin(Math.PI * u) * (D.to === 'wolf' ? 1 : -0.6); G.wheelK = 0.3; G.gaitK = 0; G.mane = 1; G.glow = 1; G.tailLift = 0.5 + 0.5 * u; }
    }
    /* --- the Jump: the motorcycle's wheelie launch and nose-down landing; the wolf's crouch and tucked leap --- */
    if (S.jump) { const Jp = S.jump, J = TUNE.jump;
      if (!Jp.air) { const u = cl(Jp.t / J.ph[0]); G.crouch = 0.9 * u; G.susp = 0.8 * u; G.pitch += (1 - w) * 0.12 * u; G.gaitK = 0; G.tailLift = 0.2; G.mane = 0.8; }
      else { const u = cl((Jp.t - J.ph[0]) / J.ph[1]), up = 1 - sstep(0, 0.55, u), dn = sstep(0.5, 1, u);
        G.pitch += (1 - w) * (0.5 * up - 0.2 * dn) + w * (0.32 * up - 0.28 * dn); G.susp = -0.6 * (1 - w) * Math.sin(Math.PI * u); G.wheelK = 2.4; G.rearK = 1.2 * (1 - w) * up;
        G.tuck = w * sstep(0, 0.22, u) * (1 - sstep(0.7, 0.93, u)); G.crouch = 0.15 * w; G.crystalGlow = Math.max(G.crystalGlow, 1.6);   /* (M's tuck folds the four legs under the body; released before the landing, so the paws are down for the settle) */ G.gaitK = 0; G.tailLift = 1; G.tail = 0; G.mane = 1; G.glow = 0.9; G.jaw = 0.5 * w * up; G.lean = 0; G.steer = 0; G.head = 0; } }
    /* --- E's clip, last: it owns the channels it sets --- */
    const E = eClip(S); if (E) { try { CLIPS[E.clip](G, E.u, S, E.extra); } catch (e) { /* (a clip never breaks the frame) */ } }
    /* the gait and the wheels: accumulated (never sprung), driven by the ground actually covered */
    if (riding) S.gait = (S.gait || 0) + sp * dt / TUNE.wolf.stride * (w > 0.02 ? 1 : 0);
    const roll = sp * dt / 0.42; S.wF = (S.wF || 0) + roll * G.wheelK; S.wR = (S.wR || 0) + roll * G.wheelK + G.rearK * 9 * dt;
    P.wheelF = S.wF; P.wheelR = S.wR; P.gait = S.gait || 0;
    if (E && E.clip === 'burnout' && E.extra && E.extra.spin != null && S.phase === 'finisher') S.spin = E.extra.spin; else if (S.phase === 'finisher' && S.spin) S.spin = 0;
    for (const key in SPR) { const p = SPR[key]; P[key] = spring(S, key, G[key], p[0], p[1], dt); }
    for (const key of DIRECT) P[key] = G[key];
    P.gaitK = cl(P.gaitK); P.tuck = cl(P.tuck); P.crystalGlow = clamp(P.crystalGlow, 0, 2); P.susp = clamp(P.susp, -0.3, 1); P.crouch = clamp(P.crouch, -0.2, 1.1);
    S.zOff = Math.max(-0.2, P.z || 0); P.z = 0;   /* (the rise is whole-body: added to the height it is drawn at) */
    P.form = S.form === 'wolf' ? 1 : 0; P.speed = k; P.t = t;
    /* E's raw channel overrides for this frame (ctx.chan), applied over everything */
    const C2 = S.eCh; if (C2 && t - C2.t <= 0.12) { for (const key in C2.o) if (key !== 'xf' && key !== 'alpha') P[key] = C2.o[key]; }
    P.roll = (P.flip || 0);
    P.recoilL = cl(P.recoilL); P.recoilR = cl(P.recoilR); P.cannonPitch = 0.1 * Math.max(P.recoilL, P.recoilR); P.jaw = cl(P.jaw); P.load = cl(P.load); P.barrel = cl(P.barrel); P.pawLock = clamp(P.pawLock, 0, 1.08); P.steer = clamp(P.steer, -1, 1);
  }

  /* ================= the ground ================= */
  function airOf(X) { try { return X.air ? X.air() : null; } catch (e) { return null; } }
  function groundAt(S, x, y) { const A = S.air; if (!A) return !S.X.blocked(x, y, 0.2, 0); const tx = Math.floor(x), ty = Math.floor(y); if (tx < 0 || ty < 0 || tx >= A.w || ty >= A.h) return false; const t = A.tile(tx, ty); return typeof T_WALK !== 'undefined' ? T_WALK[t] === 1 : !S.X.blocked(x, y, 0.2, 0); }
  function canStand(S, x, y) { return !S.X.blocked(x, y, 0.38, 0) && !S.X.blocked(x, y, 0.2, 0); }
  function nearestStand(S, x, y) { const me = S.me, p = S.X.walkPoint(x, y, { r: 0.4, x: S.safe ? S.safe.x : me.x, y: S.safe ? S.safe.y : me.y }); return { x: p.x, y: p.y }; }
  function safeReturn(S) { const V = S.V; if (canStand(S, V.x, V.y)) return { x: V.x, y: V.y };
    for (let r = 0.5; r <= 3; r += 0.5) { const n = Math.max(8, Math.round(r * 8)); for (let i = 0; i < n; i++) { const a = i / n * TAU, x = V.x + Math.cos(a) * r, y = V.y + Math.sin(a) * r; if (canStand(S, x, y) && (!S.X.flowAt || S.X.flowAt(x, y) < 9999)) return { x, y }; } }
    if (S.safe && canStand(S, S.safe.x, S.safe.y)) return { x: S.safe.x, y: S.safe.y };
    return nearestStand(S, V.x, V.y); }
  /* walls: three circles along the body's axis (its nose and tail as they show on the screen); a prop it may smash is open road */
  const blk = (S, x, y, r, mode) => S.vs.blk(x, y, r, mode);
  function poseBlocked(B, x, y, a) { const ex = Math.cos(a) * 1.0, ey = Math.sin(a) * 1.0 * GY; return B(x, y, 0.5) || B(x + ex, y + ey, 0.4) || B(x - ex, y - ey, 0.4); }
  function moveV(S, dx, dy) {
    const V = S.V, X = S.X, a = V.heading + (S.spin || 0), n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.12)); let hit = false;
    const B = (x, y, r) => blk(S, x, y, r), stuck = poseBlocked(B, V.x, V.y, a), bl = stuck ? (x, y) => B(x, y, 0.5) : (x, y) => poseBlocked(B, x, y, a), cStuck = stuck && B(V.x, V.y, 0.5);
    for (let i = 0; i < n; i++) { const sx = dx / n, sy = dy / n;
      V.x += sx; if (!cStuck && bl(V.x, V.y)) { V.x -= sx; hit = true; }
      V.y += sy; if (!cStuck && bl(V.x, V.y)) { V.y -= sy; hit = true; } }
    if (stuck && B(V.x, V.y, 0.5)) { const p = X.walkPoint(V.x, V.y, { r: 0.5, x: V.x, y: V.y }); V.x += (p.x - V.x) * 0.25; V.y += (p.y - V.y) * 0.25; }
    return hit;
  }
  /* everything the body passed through since the last frame (its swept footprint, a little padded) breaks: on the ground only */
  function inBody(px, py, x, y, a, pad) { const ag = Math.atan2(Math.sin(a), GY * Math.cos(a)), ca = Math.cos(ag), sa = Math.sin(ag), gx = px - x, gy = (py - y) / GY, lx = gx * ca + gy * sa, ly = -gx * sa + gy * ca; return Math.abs(lx) < TUNE.len / 2 + pad && Math.abs(ly) < TUNE.hw + pad; }
  function smashCb(S) { return S._smCb || (S._smCb = (x, y, quiet) => { S.stats.smashed++; smashFx(S, x, y, quiet); }); }
  function smashSweep(S) {
    const V = S.V, Pv = S.prev; if (!S.vs.props || V.vis < 0.05 || V.z + (S.zOff || 0) > 0.6) { Pv.x = V.x; Pv.y = V.y; Pv.a = V.heading + (S.spin || 0); return; }
    const a = V.heading + (S.spin || 0), d = Math.hypot(V.x - Pv.x, V.y - Pv.y), da = Math.abs(wrap(a - Pv.a)); if (d < 0.01 && da < 0.02 && S.swT > 0) { S.swT -= 1; return; } S.swT = 6;   /* (standing still: a look every few frames) */
    const n = Math.min(24, Math.max(1, Math.ceil(Math.max(d / 0.35, da / 0.3)))), R = TUNE.len / 2 + 0.6, x0 = Pv.x, y0 = Pv.y, a0 = Pv.a;
    const hitAt = (px, py, pad) => { for (let i = 0; i <= n; i++) { const u = i / n; if (inBody(px, py, lerp(x0, V.x, u), lerp(y0, V.y, u), a0 + wrap(a - a0) * u, pad)) return true; } return false; };
    S.vs.sweep(Math.floor(Math.min(V.x, x0) - R), Math.floor(Math.min(V.y, y0) - R), Math.floor(Math.max(V.x, x0) + R), Math.floor(Math.max(V.y, y0) + R), hitAt, smashCb(S));
    Pv.x = V.x; Pv.y = V.y; Pv.a = a;
  }
  function smashFx(S, x, y, quiet) { const Q = lowFx() ? 0.4 : 1; addPart(S, 9, x, y, 0, 0, 0, 0, 0.32, 1.1);
    for (let i = 0; i < Math.round(6 * Q); i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 3; addPart(S, 1, x, y, 0.35, Math.cos(a) * v, Math.sin(a) * v * GY, 1.5 + Math.random() * 2, 0.4 + Math.random() * 0.25, 0.1, { g: 5, drag: 1.6, col: i % 3 ? ICE : WHITE }); }
    for (let i = 0; i < Math.round(2 * Q); i++) addPart(S, 2, x, y, 0.2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.4, 0.4, 0.6, 0.5, { grow: 1.3, drag: 2.4 });
    kick(S, 'susp', 2.2); S.X.light(x, y, 1.8, 0.14); if (!quiet && !calm()) S.X.shake(2.2, 0.08); }
  const smashArea = (S, x, y, r, ox, oy) => S.vs.props ? S.vs.circle(x, y, r, smashCb(S), ox, oy) : 0;
  const smashOval = (S, cx, cy, rx, ry, ang, ox, oy) => S.vs.props ? S.vs.oval(cx, cy, rx, ry, ang, smashCb(S), ox, oy) : 0;

  /* ================= the session ================= */
  function startForm(C, H) {
    const me = H.me, g = H.g, X = H.X, M0 = MOD(), ev = evoOf(C), tier = tierOf(ev), K = C.K || 1, DK = C.base * K * (1 + 0.08 * (ev - 1));
    const kit = X.kit ? X.kit() : null, CD = (kit && kit.ult && kit.ult.key === 'ey_fenrir' && kit.ult.cd) || TUNE.cd, dur = TUNE.dur[tier];
    const T0 = X.Tz(), dpr = (typeof arc !== 'undefined' && arc.dpr) || 1;
    let inst; try { inst = M0.create({ T: T0 / Math.max(0.5, g.zoom || 1) * TUNE.zoom * dpr * sizeOf(M0), dpr: 1 }); } catch (e) { inst = null; } if (!inst || !inst.pose) inst = { pose: {} };
    const P = inst.pose, form = TUNE.start; P.alpha = 0; P.xf = form === 'wolf' ? 1 : 0; P.form = P.xf;
    const tgt = X.nearestMon(me.x, me.y, 9); let a0 = tgt ? Math.atan2(tgt.y - me.y, tgt.x - me.x) : (me.face < 0 ? Math.PI : 0);
    const size = sizeOf(M0);
    const V = { x: me.x, y: me.y, z: 0, heading: a0, vx: 0, vy: 0, speed: 0, pose: P, form, locked: true, vis: 1 };
    const S = { H, g, me, X, C, ev, tier, DK, CD, dur, V, inst, size, phase: 'summon', form, menu: null, t: 0, left: dur, endT: null, charge: 0, used: false, busy: null, busyT: 0, cd: { cannon: 0, s2: 0, dodge: 0 },
      drift: null, mvQ: null, dQ: null, ultQ: null, press: { ult: -9, strong: -9, strong2: -9 }, hw: 0, spin: 0, an: {}, zOff: 0, gait: 0, wF: 0, wR: 0, eAct: null, eCh: null, cam: null,
      parts: [], free: [], ended: false, released: false, pet: X.pet ? X.pet() : null, air: airOf(X), home: { x: me.x, y: me.y }, safe: { x: me.x, y: me.y }, safeT: 0, prev: { x: me.x, y: me.y, a: a0 }, swT: 0, bumpT: 0, sfxT: 0, mx: 0, my: 0, lastSide: 1,
      vs: VEH_SMASH.create(X, g),
      stats: { jump: 0, jumpHit: 0, jumpInv: 0, drifts: 0, driftSweepHits: 0, spikes: 0, spikeHits: 0, switches: 0, menuSets: 0, cannon: 0, somersault: 0, wheel: 0, dust: 0, frozen: 0, smashed: 0, cdSet: 0, dealt: 0, charged: 0, hits: 0, rideT: 0, bikeT: 0, wolfT: 0 } };
    /* a place the whole body fits: the heading turned, or the centre nudged, until it is clear of the walls */
    { const B = (x, y, r) => X.blocked(x, y, r, 0); let best = null;
      for (let k2 = 0; k2 < 12 && !best; k2++) { const ang = a0 + (k2 % 2 ? 1 : -1) * Math.ceil(k2 / 2) * (Math.PI / 6); if (!poseBlocked(B, me.x, me.y, ang)) best = { x: me.x, y: me.y, a: ang }; }
      if (!best) for (let r = 0.3; r < 2.6 && !best; r += 0.3) for (let i = 0; i < 12 && !best; i++) for (const ang of [a0, a0 + Math.PI / 2]) { const x = me.x + Math.cos(i / 12 * TAU) * r, y = me.y + Math.sin(i / 12 * TAU) * r; if (!poseBlocked(B, x, y, ang)) { best = { x, y, a: ang }; break; } }
      if (best) { V.x = best.x; V.y = best.y; V.heading = a0 = best.a; S.prev.x = V.x; S.prev.y = V.y; S.prev.a = a0; } }
    try { if (M0.warmPlan) M0.warmPlan({ form: 'bike', heading: a0 }); } catch (e) { /* (model) */ }
    g._fenrir = S;
    const ctx = S.ctx = { X, H, C, g, evo: ev, tier, DK, model: M0, poseObj: P, CLIPS, TUNE, sfx: X.sfx || {}, finisher: null, frozenPlan: null,
      get vehicle() { return S.V; }, get form() { return S.form; }, get drift() { return S.drift ? S.drift.info : null; }, get charge() { return S.charge; }, get left() { return S.left; },
      hit: (m, dmg, o) => hitCharge(S, m, dmg, o),
      hitArea: (x, y, r, dmg, o) => { let n = 0; const once = o && o.once; for (const m of H.living()) { if (Math.hypot(m.x - x, m.y - y) >= r + (m.r || 0.4)) continue; if (once && seen(once, m)) continue; if (hitCharge(S, m, dmg, o) > 0) n++; } if (!(o && o.noSmash) && alive(S)) smashArea(S, x, y, r, o && o.ox, o && o.oy); return n; },
      hitOval: (cx, cy, rx, ry, ang, dmg, o) => { let n = 0; const once = o && o.once, ca = Math.cos(ang), sa = Math.sin(ang); for (const m of H.living()) { const dx = m.x - cx, dy = m.y - cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca, pr = m.r || 0.4; if ((u * u) / ((rx + pr) ** 2) + (v * v) / ((ry + pr) ** 2) >= 1) continue; if (once && seen(once, m)) continue; if (hitCharge(S, m, dmg, o) > 0) n++; } if (!(o && o.noSmash) && alive(S)) smashOval(S, cx, cy, rx, ry, ang, o && o.ox, o && o.oy); return n; },
      smashArea: (x, y, r, ox, oy) => alive(S) ? smashArea(S, x, y, r, ox, oy) : 0, smashOval: (cx, cy, rx, ry, ang, ox, oy) => alive(S) ? smashOval(S, cx, cy, rx, ry, ang, ox, oy) : 0,
      now: () => g.t, freeze: (m, sec) => { try { H.bind(m, sec); } catch (e) { /* (20k1) */ } },
      aimPoint: () => { const T = target(S); return { x: T.x, y: T.y }; }, groundAt: (x, y) => groundAt(S, x, y), nearestLand: (x, y) => nearestStand(S, x, y),
      mons: () => H.living(), target: () => target(S), aimDir: () => { const m = Math.hypot(S.mx, S.my); return m > 0.2 ? Math.atan2(S.my, S.mx) : S.V.heading; }, stick: () => ({ x: S.mx, y: S.my, mag: Math.min(1, Math.hypot(S.mx, S.my)) }),
      canStand: (x, y) => canStand(S, x, y), canDrive: (x, y, a) => !poseBlocked((x2, y2, r) => blk(S, x2, y2, r), x, y, a == null ? S.V.heading : a), nearestStand: (x, y) => nearestStand(S, x, y),
      /* move the body by (dx, dy) with the walls in the way, smashing what it passes through; true when a wall stopped it */
      move: (dx, dy) => { const V2 = S.V, x0 = V2.x, y0 = V2.y, hitW = moveV(S, dx, dy); void x0; void y0; smashSweep(S); return hitW; },
      anchor: n => { let p = null; try { p = M0.anchor ? M0.anchor(n) : null; } catch (e) { p = null; } return p && isFinite(p.x) ? { x: p.x, y: p.y, z: p.z } : { x: S.V.x, y: S.V.y, z: S.V.z + 0.9 }; },
      scr: (x, y, z) => [H.sx(x), H.sy(y) - (z || 0) * ZK * X.Tz()], T: () => X.Tz(),
      camera: o => { if (!o) { S.cam = null; return; } if (o.shake && !calm()) X.shake(Math.min(10, o.shake), Math.min(0.5, o.dur || 0.25)); const c0 = S.cam || {}; S.cam = { zoom: o.zoom != null ? clamp(o.zoom, 0.5, 1.1) : c0.zoom, x: o.x != null ? o.x : c0.x, y: o.y != null ? o.y : c0.y, k: o.k != null ? cl(o.k) : c0.k }; },
      clip: (name, u, extra) => { const E = S.eAct || (S.eAct = {}); E.clip = name; E.u = cl(u); E.extra = extra || null; E.t = g.t; },
      pose: (name, u, extra) => { if (name === 'rest' || !name) { S.eAct = null; return; } ctx.clip(name, u, extra); },
      chan: o => { S.eCh = { o, t: g.t }; }, kick: (key, dv) => kick(S, key, dv),
      vanish: () => { S.V.vis = 0; }, safeReturn: () => { const p = safeReturn(S); S.retPt = p; return { x: p.x, y: p.y }; },
      done: () => actionDone(S), alive: () => alive(S), calm, low: lowFx };
    S.veh = { get active() { return !S.released; }, drive: (mx, my, dt) => { S.mx = mx; S.my = my; void dt; }, dodge: (mx, my) => tryDrift(S, mx, my), jump: (mx, my) => tryJump(S, mx, my), strong: slot => tryMove(S, slot), ult: () => tryUlt(S),
      drawBtns: (c, o) => drawBtns(S, c, o), onSwitch: () => finish(S, 'swap'), cam: () => camFocus(S) };
    X.vehicle(S.veh);
    const F = S.fx = H.add({ key: 'fenrir', life: 1e9, entY: me.y, update(dt) { step(S, dt); }, drawUnder(c) { drawUnder(S, c); }, drawEnt(c) { drawEnt(S, c); }, draw(c) { drawOver(S, c); }, onEnd() { if (!S.released) release(S); } });
    me.petAlt = F;
    const sfx = X.sfx || {}; if (sfx.note) { [523, 784, 1047, 1568].forEach((f, i) => sfx.note(f, 0.5, 'sine', 0.06, f * 1.01, i * 0.09)); sfx.note(70, 1.0, 'sawtooth', 0.04, 110, 0.3); }
    return S;
  }
  const seen = (once, m) => { const s = once.__seen || (once.__seen = new Set()); if (s.has(m)) return true; s.add(m); return false; };
  /* alive: the session runs and an action may go on (a committed finisher stays alive, even on a won floor, up to its cap) */
  function alive(S) { const me = S.me, g = S.g; if (S.ended || S.released || me.dead || g.over) return false; if (S.phase === 'finisher') return S.t < TUNE.finCap; return (S.phase === 'ride' || S.phase === 'drift') && !g.won; }
  function camFocus(S) { const V = S.V, c = S.cam, z = S.phase === 'summon' ? lerp(1, TUNE.zoom, sstep(0.2, TUNE.summon, S.t)) : S.phase === 'out' || S.phase === 'gone' ? 1 : TUNE.zoom;
    return { x: c && c.x != null ? c.x : V.x, y: c && c.y != null ? c.y : V.y, k: c && c.x != null ? (c.k != null ? c.k : 0.6) : 0, zoom: c && c.zoom ? c.zoom : z }; }
  function target(S) { const V = S.V, X = S.X, mag = Math.hypot(S.mx, S.my);
    if (mag > 0.2) { const a = Math.atan2(S.my, S.mx); let best = null, bs = 1e9; for (const m of S.H.living()) { const dx = m.x - V.x, dy = m.y - V.y, d = Math.hypot(dx, dy); if (d > 12) continue; const off = Math.abs(wrap(Math.atan2(dy, dx) - a)); if (off > 0.7 + (d < 2 ? 0.8 : 0)) continue; const s = d + off * 6; if (s < bs) { bs = s; best = m; } } if (best) return { x: best.x, y: best.y, m: best }; }
    const m = X.nearestMon(V.x, V.y, 8.5, null, true) || X.nearestMon(V.x, V.y, 12); if (m) return { x: m.x, y: m.y, m };
    const a = mag > 0.2 ? Math.atan2(S.my, S.mx) : V.heading; return { x: V.x + Math.cos(a) * 5, y: V.y + Math.sin(a) * 5, m: null }; }

  /* ---- damage and the one gauge: each event once, after mitigation, without overkill ---- */
  function hitCharge(S, m, dmg, o) {
    if (!m || m.dead || m.falling || !(dmg > 0) || S.ended) return 0;
    const before = Math.max(0, m.hp), oo = Object.assign({ el: 'ice', src: 'ult' }, o || {}); delete oo.noCharge; delete oo.once; delete oo.noSmash; delete oo.ox; delete oo.oy;
    const r = S.X.hitMon(m, dmg, oo), dealt = Math.max(0, Math.min(r || 0, before));
    if (!(dealt > 0)) return 0;
    S.stats.dealt += dealt; S.stats.hits++;
    if (!(o && o.noCharge) && (S.phase === 'ride' || S.phase === 'drift') && !S.used) { const c0 = S.charge; S.charge = Math.min(1, S.charge + dealt / (TUNE.chargeK * S.DK)); S.stats.charged += S.charge - c0;
      if (c0 < 1 && S.charge >= 1) { const sfx = S.X.sfx || {}; if (sfx.note) [784, 1047, 1319, 1568].forEach((f, i) => sfx.note(f, 0.4, 'triangle', 0.07, f, i * 0.07)); S.X.text(S.V.x, S.V.y - 2.2, S.form === 'wolf' ? 'FROZEN READY' : 'DIAMOND DUST READY', ICE2, 15, { life: 1.4, max: 1.4, vy: -0.5 }); } }
    return dealt;
  }
  function syncMe(S) { const me = S.me, V = S.V; me.x = V.x; me.y = V.y; me.vx = V.vx; me.vy = V.vy; me.z = 0; me.airborne = !!(S.jump && S.jump.air); const c = Math.cos(V.heading); if (Math.abs(c) > 0.25) me.face = c > 0 ? 1 : -1; }

  /* ================= the ride: the motorcycle drives, the wolf runs (one model of motion, two sets of numbers) ================= */
  function ride(S, dt) {
    const V = S.V, me = S.me, X = S.X, g = S.g, F = TUNE[S.form], mx = S.mx, my = S.my;
    if (me.push) { const P = me.push; P.t -= dt; moveV(S, P.vx * dt, P.vy * dt); if (P.t <= 0) me.push = null; }
    const top = F.top * (me.chill > 0 ? 0.75 : 1) * (g.buff && g.buff.haste > 0 ? 1.15 : 1), mag = V.locked ? 0 : Math.min(1, Math.hypot(mx, my));
    let w = 0;
    if (mag > 0.12) {
      const da = wrap(Math.atan2(my, mx) - V.heading), rate = lerp(F.steer[0], F.steer[1], cl(V.speed / top)), turn = clamp(da, -rate * dt, rate * dt);
      V.heading = wrap(V.heading + turn); w = turn / Math.max(dt, 1e-4);
      const thr = mag * (Math.abs(da) > 2.2 ? 0.25 : Math.abs(da) > 1.2 ? 0.6 : 1), tg = top * thr;
      if (V.speed < tg) V.speed = Math.min(tg, V.speed + F.accel * dt); else V.speed = Math.max(tg, V.speed - F.over * dt);
    } else V.speed = Math.max(0, V.speed - F.coast * (V.locked ? 2 : 1) * dt);
    S.hw += (w - S.hw) * Math.min(1, dt * 12);
    const grip = S.slipT > 0 ? lerp(F.grip, 4, cl(S.slipT / 0.2)) : F.grip; if (S.slipT > 0) S.slipT -= dt;
    V.vx += (Math.cos(V.heading) * V.speed - V.vx) * Math.min(1, grip * dt); V.vy += (Math.sin(V.heading) * V.speed - V.vy) * Math.min(1, grip * dt);
    if (moveV(S, V.vx * dt, V.vy * dt)) { V.speed *= F.bump; V.vx *= 0.4; V.vy *= 0.4; kick(S, 'susp', 4); kick(S, 'pitch', -1.2); if (S.bumpT <= 0) { S.bumpT = 0.35; if (X.sfx && X.sfx.thud) X.sfx.thud(); frost(S, V.x + Math.cos(V.heading) * 1.2, V.y + Math.sin(V.heading) * 0.9, 6, 3); } }
    smashSweep(S);
    /* frost off the rear wheel under power and in hard turns; puffs under the wolf's paws each stride */
    const sp = Math.hypot(V.vx, V.vy), Q = lowFx() ? 0.4 : 1;
    if (S.form === 'bike') { if (sp > 3 && Math.random() < dt * (10 + 30 * Math.min(1, Math.abs(S.hw) / 4)) * Q) { const bx = V.x - Math.cos(V.heading) * 1.1, by = V.y - Math.sin(V.heading) * 1.1 * GY; addPart(S, 1, bx, by, 0.1, -V.vx * 0.15 + (Math.random() - 0.5) * 2, -V.vy * 0.15 + (Math.random() - 0.5) * 1.4, 0.8 + Math.random() * 1.4, 0.3 + Math.random() * 0.25, 0.07, { g: 5, col: Math.random() < 0.5 ? ICE2 : ICE }); } }
    else { const st2 = Math.floor((S.gait || 0) * 2); if (st2 !== S.lastStep && sp > 2) { S.lastStep = st2; kick(S, 'susp', 1.6); for (let i = 0; i < Math.round(2 * Q); i++) addPart(S, 2, V.x + (Math.random() - 0.5) * 1.6, V.y + (Math.random() - 0.5) * 0.8, 0.05, -V.vx * 0.08, -V.vy * 0.08, 0.3, 0.45, 0.32, { grow: 1.2, drag: 2 }); } }
  }

  /* ================= DRIFT: the sweep, the spikes at the destination, the transformation; the switch once, at its end ================= */
  const dodgeCd = S => TUNE.drift.cd * (S.g.buff && S.g.buff.arcane > 0 ? 0.6 : 1) * (S.g.dodgeK || 1);
  function tryDrift(S, mx, my, queued) {
    const V = S.V, g = S.g, Dt = TUNE.drift;
    if (S.phase !== 'ride' || S.busy || V.locked || S.drift || S.jump) { if (!queued && (S.phase === 'ride' || S.phase === 'drift') && !(S.drift && S.drift.ph < 3)) S.dQ = g.t; return; }   /* (in the air: it goes on landing) */
    if (S.cd.dodge > 0) { if (!queued && S.cd.dodge <= Dt.buf) S.dQ = g.t; return; }
    S.dQ = null;
    const mag = Math.hypot(mx, my); let dir;
    if (mag > 0.2) dir = Math.atan2(my, mx); else if (Math.hypot(V.vx, V.vy) > 2) dir = Math.atan2(V.vy, V.vx); else { const T = target(S); dir = T.m ? Math.atan2(T.y - V.y, T.x - V.x) : V.heading; }
    /* the travel heading jumps to the burst; the body keeps its angle and spins from there through one full turn */
    const s0 = wrap(V.heading - dir), side = Math.abs(s0) > 0.15 ? -Math.sign(s0) : -(S.lastSide || -1); S.lastSide = side;
    V.heading = dir; S.spin = s0;
    const from = S.form, to = other(from);
    const info = { from, to, dir, side, x0: V.x, y0: V.y, x: V.x, y: V.y, u: 0, ph: 'sweep', r: Dt.r, spikeR: Dt.spikeR, dur: Dt.ph[0] + Dt.ph[1], spikesAt: null, tier: S.tier };
    S.drift = { ph: 0, t: 0, dir, side, s0, from, to, hit: new Set(), nHit: 0, vk: 1, spiked: false, info };
    S.phase = 'drift'; S.cd.dodge = dodgeCd(S); S.cdDodgeMax = S.cd.dodge;
    S.me.inv = Math.max(S.me.inv || 0, Dt.inv); g.dodges = (g.dodges || 0) + 1; g.movedOnce = true;
    try { const M0 = MOD(); if (M0.warmPlan) M0.warmPlan({ form: 'xform', heading: dir }); } catch (e) { /* (model) */ }
    kick(S, 'susp', 5); if (!calm()) S.X.shake(2.5, 0.1);
    const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) { sfx.note(980, 0.34, 'sawtooth', 0.024, 1700); sfx.note(220, 0.3, 'triangle', 0.07, 110); } if (sfx.hiss) sfx.hiss(0.4, 0.12, 4200);
    callMove(S, 'driftSweep', info);
  }
  function callMove(S, name, a, b) { const [MV, fn] = mvFn(name); if (!fn) return null; try { return fn.call(MV, S.ctx, a, b); } catch (e) { if (typeof console !== 'undefined') console.warn('Fenrir: ' + name + ' failed', e); return null; } }
  function stepDrift(S, dt) {
    const D = S.drift, V = S.V, X = S.X, Dt = TUNE.drift, P = Dt.ph, I = D.info, F = TUNE[D.from], top = F.top;
    D.t += dt;
    if (D.ph === 0 && D.t >= P[0]) { D.ph = 1; D.t -= P[0]; }
    if (D.ph <= 1) {
      /* the burst: eased off like the Dodge's roll, bent by the stick, bounced off walls; the body spins one full turn */
      const mag = Math.hypot(S.mx, S.my); if (mag > 0.2) { const da = wrap(Math.atan2(S.my, S.mx) - D.dir); D.dir = wrap(D.dir + clamp(da, -Dt.turn * dt, Dt.turn * dt)); }
      const u = D.ph === 0 ? 0 : cl(D.t / P[1]), v = Dt.v * (1 - u * u * 0.6) * D.vk * (S.me.chill > 0 ? 0.8 : 1);
      V.heading = D.dir; V.vx = Math.cos(D.dir) * v; V.vy = Math.sin(D.dir) * v; V.speed = v;
      S.spin = D.s0 * (1 - u) + D.side * TAU * (1 - Math.pow(1 - u, 2.2)); S.hw = D.side * 9 * (1 - u);
      const x0 = V.x, y0 = V.y, dx = V.vx * dt, dy = V.vy * dt;
      if (moveV(S, dx, dy)) { const bx = Math.abs(dx) > 1e-4 && Math.abs(V.x - x0) < Math.abs(dx) * 0.5, by = Math.abs(dy) > 1e-4 && Math.abs(V.y - y0) < Math.abs(dy) * 0.5;
        D.dir = Math.atan2(by ? -Math.sin(D.dir) : Math.sin(D.dir), bx ? -Math.cos(D.dir) : Math.cos(D.dir)); D.vk *= 0.65; kick(S, 'susp', 5);
        if (S.bumpT <= 0) { S.bumpT = 0.15; if (X.sfx && X.sfx.thud) X.sfx.thud(); frost(S, V.x, V.y, lowFx() ? 4 : 10, 4); if (!calm()) X.shake(3, 0.08); } }
      smashSweep(S);
      /* damage phase 1, the moving sweep: every monster the spinning body passes, once (the scenery is the body's own sweep above) */
      for (const m of S.H.living()) { if (D.hit.has(m)) continue; if (Math.hypot(m.x - V.x, m.y - V.y) > Dt.r + (m.r || 0.4)) continue; D.hit.add(m);
        if (hitCharge(S, m, S.DK * Dt.dmg, { kb: Dt.kb, chill: true }) > 0) { D.nHit++; S.stats.driftSweepHits++; frost(S, m.x, m.y, 5, 3); } }
      /* frost thrown off the sliding wheel / the claws */
      const Q = lowFx() ? 0.35 : 1, a = V.heading + S.spin + Math.PI; for (let i = 0; i < Math.round(3 * Q); i++) { const b = a + (Math.random() - 0.5) * 1.2, sv = 3 + Math.random() * 5; addPart(S, 1, V.x + Math.cos(a) * 1.2, V.y + Math.sin(a) * 1.2 * GY, 0.1, Math.cos(b) * sv, Math.sin(b) * sv * GY, 1 + Math.random() * 2.5, 0.3 + Math.random() * 0.3, 0.08, { g: 6, col: i % 2 ? ICE2 : ICE }); }
      if (Math.random() < dt * 30 * Q) addPart(S, 2, V.x + Math.cos(a) * 1.1, V.y + Math.sin(a) * 0.9, 0.1, 0, 0, 0.5, 0.6, 0.5, { grow: 1.5, drag: 2 });
      I.x = V.x; I.y = V.y; I.u = cl((D.ph === 0 ? D.t : P[0] + D.t) / (P[0] + P[1])); I.dir = D.dir;
      if (D.ph === 1 && D.t >= P[1]) { D.ph = 2; D.t -= P[1]; S.spin = 0; S.hw = 0; I.ph = 'spikes'; I.u = 0; I.x = V.x; I.y = V.y; kick(S, 'susp', 6); kick(S, 'pitch', -2); }
    } else if (D.ph === 2) {
      /* the stop at the destination; damage phase 2, the ice spikes erupting round it, once */
      const k = Math.max(0, 1 - dt * 14); V.vx *= k; V.vy *= k; V.speed *= k; moveV(S, V.vx * dt, V.vy * dt); smashSweep(S);
      if (!D.spiked && D.t >= Dt.spikeAt) { D.spiked = true; S.stats.spikes++; I.x = V.x; I.y = V.y; I.spikesAt = S.g.t;
        for (const m of S.H.living()) { if (Math.hypot(m.x - V.x, m.y - V.y) >= Dt.spikeR + (m.r || 0.4)) continue; if (hitCharge(S, m, S.DK * Dt.spikeDmg, { kb: Dt.spikeKb, freeze: Dt.spikeFreeze, chill: true }) > 0) S.stats.spikeHits++; }
        smashArea(S, V.x, V.y, Dt.spikeR); if (!calm()) X.shake(5, 0.16); X.light(V.x, V.y, 3.2, 0.25);
        callMove(S, 'driftSpikes', I);   /* (E's picture of it: the big spikes round the stop) */
        addPart(S, 9, V.x, V.y, 0, 0, 0, 0, 0.5, Dt.spikeR); frost(S, V.x, V.y, lowFx() ? 8 : 20, 6);
        kick(S, 'z', 1.2); }
      I.u = cl(D.t / P[2]);
      if (D.t >= P[2]) { D.ph = 3; D.t -= P[2]; V.vx = V.vy = 0; V.speed = 0; I.ph = 'xform'; I.u = 0; const sfx = X.sfx || {}; if (sfx.note) { sfx.note(D.to === 'wolf' ? 196 : 392, 0.5, 'sawtooth', 0.035, D.to === 'wolf' ? 392 : 196); sfx.note(1319, 0.2, 'square', 0.02, 1319, 0.2); } }
    } else {
      /* the transformation: the configuration unfolds on the model's own pivots; the form and the menu change when it is ready */
      const u = cl(D.t / P[3]), e = sstep(0.04, 0.96, u); V.pose.xf = D.to === 'wolf' ? e : 1 - e; I.u = u;
      if (Math.random() < dt * (lowFx() ? 10 : 30)) { const a = Math.random() * TAU; addPart(S, 1, V.x + Math.cos(a) * 1.2, V.y + Math.sin(a) * 0.8, 0.3 + Math.random() * 1.2, Math.cos(a) * 1.2, Math.sin(a) * 0.9, 0.6 + Math.random(), 0.45, 0.08, { col: Math.random() < 0.5 ? CYAN : ICE2 }); }
      if (D.t >= P[3]) switchForm(S);
    }
  }
  /* the one place the form changes: a completed Drift, once */
  function switchForm(S) {
    const D = S.drift, V = S.V; if (!D || D.done) return; D.done = true;
    S.form = V.form = D.to; V.pose.xf = D.to === 'wolf' ? 1 : 0; S.stats.switches++; S.stats.drifts++;
    setMenu(S); S.drift = null; S.phase = 'ride'; S.spin = 0; S.slipT = 0;
    kick(S, 'susp', 5); kick(S, 'z', 1.5); if (!calm()) S.X.shake(2.5, 0.1);
    const sfx = S.X.sfx || {}; if (sfx.note) { sfx.note(S.form === 'wolf' ? 147 : 262, 0.35, 'square', 0.04, S.form === 'wolf' ? 110 : 330); } if (S.form === 'wolf' && sfx.roar) sfx.roar();
  }
  function setMenu(S) { if (S.menu === S.form) return; S.menu = S.form; S.stats.menuSets++; }

  /* ================= JUMP (both forms): the planned hop, the landing's frost shock ================= */
  const JOFF = [0, 0.2, -0.2, 0.4, -0.4, 0.6, -0.6];
  /* a landing: the whole body fits there (a prop it may smash is open: the landing breaks it), the pet could stand and walk from it */
  function landOK(S, x, y, a) { if (poseBlocked((x2, y2, r) => blk(S, x2, y2, r), x, y, a)) return false; if (S.X.blocked(x, y, 0.38, 0) && !S.vs.smashable(Math.floor(x), Math.floor(y))) return false; if (!groundAt(S, x, y)) return false; const F = S.vs.flowAt ? S.vs.flowAt(x, y) : S.X.flowAt ? S.X.flowAt(x, y) : 0; return F < 9999; }
  function planJump(S, dir, d0) {
    const V = S.V, J = TUNE.jump, X = S.X, C = [];
    for (const off of JOFF) { const a = wrap(dir + off), ca = Math.cos(a), sa = Math.sin(a); let lim = d0 + J.ext;
      for (let st = 0.4; st <= lim + 0.21; st += 0.2) if (X.blocked(V.x + ca * st, V.y + sa * st, 0.4, 1)) { lim = st - 0.45; break; }   /* (walls and the map's edge stop it in the air) */
      for (let st = 0; st <= lim + 1e-6; st += 0.25) C.push([(st >= d0 - 1e-6 ? st - d0 : 5 + (d0 - st) * 1.2) + Math.abs(off) * 3, st, a]); }
    C.sort((p, q) => p[0] - q[0]);
    for (const [, st, a] of C) { const x = V.x + Math.cos(a) * st, y = V.y + Math.sin(a) * st; if (st > 0.05 && !landOK(S, x, y, a)) continue; if (st <= 0.05) break; return { x, y, a, d: st, d0 }; }
    return { x: V.x, y: V.y, a: V.heading, d: 0, d0, none: true };   /* (nowhere to land: a hop on the spot) */
  }
  function tryJump(S, mx, my, queued) {
    const V = S.V, g = S.g, J = TUNE.jump; if (mx != null) { S.mx = mx; S.my = my; }
    if (S.released || S.phase !== 'ride') return;   /* (never during a Drift, a finisher, the summon or the exit) */
    if (S.jump) { if (!queued) S.jumpLand = true; return; }   /* (in the air: kept for the touchdown, never a jump in mid-air) */
    if (S.busy || V.locked || S.drift) { if (!queued) S.jumpQ = g.t; return; }
    S.jumpQ = null; S.jumpLand = false;
    const mag = Math.hypot(S.mx, S.my), dir = mag > 0.2 ? Math.atan2(S.my, S.mx) : V.heading, v0 = Math.max(J.v, V.vx * Math.cos(dir) + V.vy * Math.sin(dir)), plan = planJump(S, dir, Math.min(J.max, v0 * J.ph[1]));
    S.lastPlan = plan;
    S.jump = { t: 0, x0: V.x, y0: V.y, a0: V.heading, x1: plan.x, y1: plan.y, a1: plan.d > 0.05 ? plan.a : V.heading, h: J.h[S.form === 'wolf' ? 1 : 0] * (plan.none ? 0.7 : 1), plan, air: false, form: S.form };
    if (g.t - (S.invT == null ? -9 : S.invT) >= J.invLock) { S.me.inv = Math.max(S.me.inv || 0, J.inv); S.invT = g.t; S.stats.jumpInv++; }   /* (the take-off's short protection, at most once per invLock s: a chain of hops is not a shield) */
    S.stats.jump++; g.movedOnce = true;
    const sfx = S.X.sfx || {}; if (sfx.note) { sfx.note(S.form === 'wolf' ? 82 : 110, 0.2, 'triangle', 0.07, S.form === 'wolf' ? 60 : 180); } if (sfx.hiss) sfx.hiss(0.14, 0.05, 1800);
  }
  function stepJump(S, dt) {
    const Jp = S.jump, V = S.V, J = TUNE.jump; Jp.t += dt;
    if (Jp.t < J.ph[0]) { const k = Math.max(0, 1 - dt * 6); V.vx *= k; V.vy *= k; moveV(S, V.vx * dt, V.vy * dt); smashSweep(S); return; }   /* (the squat: animate() plays it) */
    if (!Jp.air) { Jp.air = true; Jp.x0 = V.x; Jp.y0 = V.y; if (Jp.plan.none) { Jp.x1 = V.x; Jp.y1 = V.y; } const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.jump) sfx.jump();
      addPart(S, 9, V.x, V.y, 0, 0, 0, 0, 0.35, 1.4); frost(S, V.x - Math.cos(V.heading) * 0.9, V.y - Math.sin(V.heading) * 0.7, 10, 4); kick(S, 'pitch', S.form === 'wolf' ? 2 : 4); }
    const u = cl((Jp.t - J.ph[0]) / J.ph[1]);
    V.x = lerp(Jp.x0, Jp.x1, u); V.y = lerp(Jp.y0, Jp.y1, u); V.vx = (Jp.x1 - Jp.x0) / J.ph[1]; V.vy = (Jp.y1 - Jp.y0) / J.ph[1]; V.speed = Math.hypot(V.vx, V.vy);
    const a = Jp.a0 + wrap(Jp.a1 - Jp.a0) * sstep(0, 0.4, u); S.hw = dt > 0 ? wrap(a - V.heading) / dt : 0; V.heading = wrap(a);
    V.z = 4 * Jp.h * u * (1 - u); S.prev.x = V.x; S.prev.y = V.y; S.prev.a = V.heading;
    if (Math.random() < dt * (lowFx() ? 12 : 36)) addPart(S, 1, V.x + (Math.random() - 0.5) * 1.6, V.y + (Math.random() - 0.5) * 0.9, V.z + 0.3 + Math.random() * 0.6, -V.vx * 0.1, -V.vy * 0.1, -0.5, 0.4 + Math.random() * 0.3, 0.07, { col: Math.random() < 0.5 ? ICE2 : CYAN });
    if (u >= 1) landJump(S);
  }
  function landJump(S) {
    const Jp = S.jump; if (!Jp) return; S.jump = null;
    const V = S.V, J = TUNE.jump, X = S.X; let x = Jp.x1, y = Jp.y1;
    if (!Jp.plan.none && !landOK(S, x, y, V.heading)) { if (landOK(S, Jp.x0, Jp.y0, V.heading)) { x = Jp.x0; y = Jp.y0; } else { const p = safeReturn(S); x = p.x; y = p.y; } }   /* (the ground changed under the plan: back where it left, else the nearest safe ground) */
    V.x = x; V.y = y; V.z = 0; S.hw = 0; S.me.airborne = false; S.lastLand = { x, y }; S.landT = S.g.t;
    V.speed = Math.min(TUNE[S.form].top, Math.hypot(V.vx, V.vy)) * 0.8; V.vx = Math.cos(V.heading) * V.speed; V.vy = Math.sin(V.heading) * V.speed;   /* (it lands rolling) */
    /* the landing's frost shock: one hit per monster in reach (it charges the gauge), the scenery inside it broken */
    let n = 0; for (const m of S.H.living()) { if (Math.hypot(m.x - x, m.y - y) > J.r + (m.r || 0.4) * 0.85) continue; if (hitCharge(S, m, S.DK * J.dmg, { kb: J.kb, chill: true }) > 0) { S.stats.jumpHit++; frost(S, m.x, m.y, 5, 3); n++; } }
    S.prev.x = x; S.prev.y = y; S.prev.a = V.heading; S.swT = 0; smashSweep(S); smashArea(S, x, y, J.r);
    addPart(S, 9, x, y, 0, 0, 0, 0, 0.5, J.r * 1.05); addPart(S, 9, x, y, 0, 0, 0, 0, 0.75, J.r * 0.6); frost(S, x, y, lowFx() ? 10 : 24, 6);
    for (let i = 0; i < (lowFx() ? 3 : 8); i++) { const a = Math.random() * TAU; addPart(S, 2, x + Math.cos(a) * 0.8, y + Math.sin(a) * 0.6, 0.1, Math.cos(a) * 2.5, Math.sin(a) * 2.5 * GY, 0.3, 0.6, 0.5, { grow: 1.5, drag: 2.5 }); }
    X.light(x, y, 3, 0.2); kick(S, 'susp', 9); kick(S, 'crouch', 6); kick(S, 'pitch', -3); kick(S, 'z', -2.5);   /* (a heavy landing: the springs carry the compression back up) */
    if (!calm()) X.shake(n ? 5 : 3.5, 0.15); const sfx = X.sfx || {}; if (sfx.stomp) sfx.stomp(); if (sfx.note) sfx.note(1319, 0.25, 'triangle', 0.05, 1976);
    if (S.dQ != null) S.dQ = S.g.t; if (S.mvQ) S.mvQ.t = S.g.t; if (S.ultQ != null) S.ultQ = S.g.t;   /* (a Drift, a Strong or the Ult pressed in the air waited for this) */
    if (S.jumpLand) { S.jumpLand = false; S.jumpQ = S.g.t; }   /* (pressed in the air: it goes again now) */
  }

  /* ================= the commands ================= */
  function fresh(S, key) { const t = S.g.t, p = S.press[key]; S.press[key] = t; return t - p >= TUNE.freshGap; }
  function tryMove(S, slot, queued) {
    const V = S.V, g = S.g, sfx = S.X.sfx || {}, s2 = slot === 'strong2', key = s2 ? 's2' : 'cannon';
    if (!queued && !fresh(S, s2 ? 'strong2' : 'strong')) return;
    if (S.phase !== 'ride' && S.phase !== 'drift') return;
    if (S.phase === 'drift' || S.busy || V.locked || S.jump) { if (!queued) S.mvQ = { slot, t: g.t }; return; }
    if (S.cd[key] > 0) { if (!queued) { if (S.cd[key] <= TUNE.mvHold) S.mvQ = { slot, t: g.t }; else if (sfx.wrong) sfx.wrong(); } return; }
    S.mvQ = null;
    const name = !s2 ? 'iceCannon' : S.form === 'bike' ? 'somersault' : 'spinningWheel', [MV, fn] = mvFn(name); if (!fn) return;
    S.busy = name; S.busyT = 0; S.busyForm = S.form; S.cd[key] = mvTune(key + 'Cd', TUNE[key + 'Cd']); S.cdMax = S.cdMax || {}; S.cdMax[key] = S.cd[key];
    if (s2 || mvTune('cannonLock', false)) { V.locked = true; if (s2) { V.speed = 0; V.vx *= 0.3; V.vy *= 0.3; } }
    S.stats[!s2 ? 'cannon' : S.form === 'bike' ? 'somersault' : 'wheel']++;
    try { fn.call(MV, S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Fenrir: a move failed', e); actionDone(S); }
  }
  function tryUlt(S, queued) {
    const X = S.X, sfx = X.sfx || {}, V = S.V, g = S.g;
    if (!queued && !fresh(S, 'ult')) return;
    if (S.phase !== 'ride' && S.phase !== 'drift') return;
    const name = S.form === 'wolf' ? 'Frozen' : 'Diamond Dust';
    if (S.used || S.charge < 1) { if (!queued) { if (sfx.wrong) sfx.wrong(); X.text(V.x, V.y - 2, S.used ? name + ' used' : `${name} ${Math.floor(S.charge * 100)}%`, ICE, 12, { life: 0.9, max: 0.9, vy: -0.6 }); } return; }
    if (S.phase === 'drift' || S.busy || V.locked || S.jump) { if (!queued) S.ultQ = g.t; return; }   /* (a Drift or a Strong in progress: it goes when that ends, in the form it ends in) */
    const key = S.form === 'wolf' ? 'frozen' : 'fenrirDust', FM = moves(), fnName = S.form === 'wolf' ? 'frozen' : typeof FM.diamondDust === 'function' ? 'diamondDust' : 'fenrirDust', [MV, fn] = mvFn(fnName);
    S.ultQ = null; S.used = true; S.phase = 'finisher'; S.t = 0; S.busy = key; S.busyT = 0; S.busyForm = S.form; V.locked = true; V.speed = 0; V.vx = V.vy = 0; S.spin = 0;
    S.ctx.finisher = key; S.ctx[S.form === 'wolf' ? 'frozen' : 'dust'] = true; S.stats[S.form === 'wolf' ? 'frozen' : 'dust']++;
    try { fn.call(MV, S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Fenrir: the finisher failed', e); actionDone(S); }
  }
  function actionDone(S) {
    if (!S.busy) return; const kind = S.busy, V = S.V; S.busy = null;
    if (S.phase === 'finisher' || kind === 'frozen' || kind === 'fenrirDust') { S.cam = null; startOut(S, 'finisher'); return; }
    if (S.phase === 'ride' || S.phase === 'drift') { V.locked = false; V.z = 0; S.cam = null; }
  }
  function queues(S) { const g = S.g, V = S.V; if (S.busy || V.locked || S.drift || S.jump) return;
    if (S.jumpQ != null) { const q = S.jumpQ; S.jumpQ = null; if (g.t - q <= TUNE.jump.buf + 0.35) { tryJump(S, null, null, true); if (S.jump) return; } }
    if (S.ultQ != null) { const q = S.ultQ; S.ultQ = null; if (g.t - q < 2 && S.charge >= 1 && !S.used) { tryUlt(S, true); if (S.phase !== 'ride') return; } }
    if (S.dQ != null && S.cd.dodge <= 0) { const q = S.dQ; S.dQ = null; if (g.t - q < 0.6) { tryDrift(S, S.mx, S.my, true); if (S.drift) return; } }
    if (S.mvQ) { const Q = S.mvQ, key = Q.slot === 'strong2' ? 's2' : 'cannon'; if (g.t - Q.t > TUNE.mvHold + 1.6) S.mvQ = null; else if (S.cd[key] <= 0) { S.mvQ = null; tryMove(S, Q.slot, true); } } }

  /* ================= the frame ================= */
  function step(S, dt) {
    const V = S.V, me = S.me, g = S.g, X = S.X, M0 = MOD();
    if (S.released) { S.relT = (S.relT || 0) + dt; stepParts(S, dt); return; }
    if (me.dead) { finish(S, 'defeat'); return; }
    if (g.over || (g.won && S.phase !== 'finisher' && S.phase !== 'out')) { finish(S, 'won'); return; }
    if (X.pet && S.pet && X.pet() !== S.pet) { finish(S, 'swap'); return; }
    g.cdU = S.CD;   /* (held through the session: the cooldown starts at the exit) */
    S.t += dt; for (const k in S.cd) S.cd[k] = Math.max(0, S.cd[k] - dt); if (S.busy) S.busyT += dt; if (S.bumpT > 0) S.bumpT -= dt;
    if (M0.warm) { try { M0.warm(S.phase === 'summon' ? 5 : S.drift ? 2 : 1); } catch (e) { /* (model) */ } }
    const MVw = moves(); if (MVw.warm && !S.wDone) { try { if (MVw.warm(S.phase === 'summon' ? 1.5 : 0.6) === true) S.wDone = true; } catch (e) { S.wDone = true; } }
    if (S.phase === 'summon') stepSummon(S, dt);
    else if (S.phase === 'ride' || S.phase === 'drift') {
      S.left = Math.min(S.left - dt, S.endT - g.t); S.stats.rideT += dt; S.stats[S.form + 'T'] += dt;   /* (the game clock: a hit-stop, which pauses this step, still counts) */
      if (S.left <= 0) { startOut(S, 'timeout'); return; }   /* (the timeout wins: a Drift not yet complete does not switch, a Strong's later hits are dropped, no free finisher) */
      if (S.busy && S.busyT > TUNE.busyCap) actionDone(S);
      if (S.jump) stepJump(S, dt); else if (S.drift) stepDrift(S, dt);
      else { ride(S, dt); queues(S); }
    } else if (S.phase === 'finisher') { if (S.t > TUNE.finCap) { S.busy = null; startOut(S, 'finisher'); return; } smashSweep(S); }
    else if (S.phase === 'out') stepOut(S, dt);
    S.safeT -= dt; if (S.safeT <= 0) { S.safeT = 0.25; if (canStand(S, V.x, V.y)) { S.safe.x = V.x; S.safe.y = V.y; } }
    if (S.phase === 'ride') { S.aimT = (S.aimT || 0) - dt; if (S.aimT <= 0) { S.aimT = 0.2; S.aimM = X.nearestMon(V.x, V.y, 9) || null; } }
    const MV = moves(); if (MV.update) { try { MV.update(S.ctx, dt); } catch (e) { /* (theirs) */ } }
    if (S.phase !== 'out' || !S.hopped) syncMe(S);
    stepParts(S, dt);
    { const L = S.lastPos || (S.lastPos = { x: V.x, y: V.y }); S.carrySp = dt > 0 && V.locked ? Math.min(30, Math.hypot(V.x - L.x, V.y - L.y) / dt) : 0; L.x = V.x; L.y = V.y; }   /* (a move carrying the body: its speed drives the wheels and the gait) */
    animate(S, dt);
    S.fx.entY = V.y + 0.6;
    S.sfxT -= dt; if (S.sfxT <= 0 && S.phase === 'ride') { const sfx = X.sfx || {}, k = cl(V.speed / TUNE[S.form].top); S.sfxT = S.form === 'bike' ? 0.5 : 0.34 - 0.1 * k; if (sfx.note && k > 0.15) { if (S.form === 'bike') sfx.note(70 + 60 * k, 0.5, 'sawtooth', 0.016, 74 + 64 * k); else sfx.note(95, 0.08, 'triangle', 0.03, 60); } }
  }
  /* the summon: a ring of frost opens under the pet, Fenrir assembles round it out of the cold, the lock and a pulse */
  function stepSummon(S, dt) {
    const V = S.V, P = V.pose, t = S.t, T = TUNE.summon;
    P.alpha = sstep(0.12, 0.55, t); P.assemble = sstep(0.15, T - 0.3, t); P.xf = S.form === 'wolf' ? 1 : 0;
    if (Math.random() < dt * (lowFx() ? 15 : 45) && t < T - 0.25) { const a = Math.random() * TAU, r = 0.6 + Math.random() * 2; addPart(S, 1, V.x + Math.cos(a) * r, V.y + Math.sin(a) * r * GY, 0.1 + Math.random() * 1.6, -Math.cos(a) * r * 1.4, -Math.sin(a) * r * GY * 1.4, 0, 0.5 + Math.random() * 0.3, 0.09, { col: Math.random() < 0.5 ? ICE : ICE2 }); }
    if (!S.locked1 && t >= T - 0.16) { S.locked1 = true; const sfx = S.X.sfx || {}; if (sfx.stomp) sfx.stomp(); if (sfx.note) sfx.note(110, 0.5, 'square', 0.04, 70); if (!calm()) S.X.shake(3, 0.12); kick(S, 'susp', 6); addPart(S, 9, V.x, V.y, 0, 0, 0, 0, 0.45, 2.4); }
    if (t >= T) { S.phase = 'ride'; S.t = 0; V.locked = false; S.left = S.dur; S.endT = S.g.t + S.dur; P.assemble = 1; P.alpha = 1; setMenu(S); }
  }

  /* ---- exits: the pet set down on valid ground beside it, the body cracks and dissolves, the controls restored, the cooldown ---- */
  function startOut(S, how) {
    if (S.phase === 'out' || S.released) return;
    const V = S.V; S.drift = null; S.spin = 0; S.busy = null; S.mvQ = null; S.dQ = null; S.ultQ = null; S.jump = null; S.jumpQ = null; S.jumpLand = false; S.me.airborne = false;
    S.outHow = how || 'timeout'; S.fromPhase = S.phase; S.phase = 'out'; S.t = 0; S.outT = 0; V.locked = true; V.vx = V.vy = 0; V.speed = 0; V.z = 0; S.cam = null; S.ctx.finisher = null;
    V.pose.xf = S.form === 'wolf' ? 1 : 0;   /* (a Drift cut short settles back to the form it had) */
    /* the dismount: a step off to the side nearest open ground */
    let p = S.retPt && canStand(S, S.retPt.x, S.retPt.y) ? S.retPt : null;
    if (!p) { const a = V.heading; for (const [s, r] of [[1, 1.1], [-1, 1.1], [1, 1.6], [-1, 1.6]]) { const x = V.x - Math.sin(a) * s * r, y = V.y + Math.cos(a) * s * r; if (canStand(S, x, y) && S.X.los && S.X.los(V.x, V.y, x, y) !== false) { p = { x, y }; break; } } }
    if (!p || (S.X.flowAt && !(S.X.flowAt(p.x, p.y) < 9999))) p = safeReturn(S);
    S.ret = p; S.hopped = false; S.petHop = 0;
    const sfx = S.X.sfx || {}; if (sfx.note) [1568, 1175, 784].forEach((f, i) => sfx.note(f, 0.3, 'sine', 0.04, f * 0.97, i * 0.09));
  }
  function stepOut(S, dt) {
    const V = S.V, P = V.pose, me = S.me; S.outT += dt;
    if (!S.hopped) { S.hopped = true; S.petHop = 0; const sfx = S.X.sfx || {}; if (sfx.jump) sfx.jump(); }
    S.petHop += dt; const u = cl(S.petHop / TUNE.hop); me.x = lerp(V.x, S.ret.x, u); me.y = lerp(V.y, S.ret.y, u); me.vx = me.vy = 0;
    if (S.petHop > TUNE.hop) { const gone = V.vis < 0.05 || (P.alpha || 0) < 0.02 && S.outV == null, v = gone ? 1 : (S.outV = cl((S.petHop - TUNE.hop) / TUNE.dissolve));
      if (!gone) { S.outCrack = sstep(0, 0.55, v); P.alpha = 1 - sstep(0.45, 1, v); S.eCh = { o: { crack: S.outCrack, crystalGlow: 1 - sstep(0, 0.8, v) }, t: S.g.t };   /* (the crystals' glow dies as it cracks and dissolves) */
        if (Math.random() < dt * (lowFx() ? 25 : 70)) { const a = Math.random() * TAU, r = Math.random() * 1.6; addPart(S, Math.random() < 0.7 ? 1 : 2, V.x + Math.cos(a) * r, V.y + Math.sin(a) * r * GY, Math.random() * 1.4, Math.cos(a) * 1.2, Math.sin(a) * 0.9, 0.4 + Math.random() * 1.2, 0.6 + Math.random() * 0.5, 0.1, { col: Math.random() < 0.5 ? ICE : ICE2, grow: 1.3, drag: 1 }); } }
      if (v >= 1) release(S); }
  }
  function finish(S, how) {
    if (S.released) return; S.outHow = how;
    const p = S.phase === 'out' && S.ret ? S.ret : safeReturn(S), me = S.me; me.x = p.x; me.y = p.y;
    const V = S.V; if (V.vis > 0.05 && (V.pose.alpha || 0) > 0.05) { for (let i = 0; i < (lowFx() ? 10 : 24); i++) { const a = Math.random() * TAU, v = 1 + Math.random() * 3; addPart(S, 1, V.x + Math.cos(a), V.y + Math.sin(a) * 0.7, Math.random() * 1.4, Math.cos(a) * v, Math.sin(a) * v * GY, Math.random() * 2, 0.6 + Math.random() * 0.4, 0.1, { col: Math.random() < 0.5 ? ICE : ICE2, g: 3 }); } S.fade = 0.35; }
    release(S);
  }
  /* the one guarded cleanup path: the controls, the camera, the cooldown, once */
  function release(S) {
    if (S.released) return;
    S.released = true; S.ended = true; S.relT = 0; S.jump = null; S.jumpQ = null;
    const me = S.me, g = S.g, X = S.X;
    if (S.ret && S.phase === 'out') { me.x = S.ret.x; me.y = S.ret.y; }
    if (!canStand(S, me.x, me.y)) { const p = safeReturn(S); me.x = p.x; me.y = p.y; }
    S.phase = 'gone'; S.busy = null; S.drift = null; S.mvQ = null; S.ultQ = null; S.dQ = null; S.cam = null; S.eAct = null; S.eCh = null;
    if (S.ctx) { S.ctx.finisher = null; S.ctx.frozen = false; S.ctx.dust = false; } S.V.locked = true;
    try { X.vehicle(null); } catch (e) { /* (hook) */ }
    if (me.petAlt === S.fx) me.petAlt = null;
    me.vx = me.vy = 0; me.z = 0; me.push = null; me.castT = 0; me.airborne = false;
    g.cdU = S.CD; S.stats.cdSet++;   /* the cooldown starts now, once */
    g.tapBuf = 0; g.tapAim = null; g.normalT = Math.max(g.normalT || 0, 0.2);
    S.fx.life = 0.8; S.fx.onEnd = null;
  }

  /* ---- pooled particles: 1 frost spark (additive), 2 cold mist puff, 9 pale ring of light on the floor (s = radius) ---- */
  const CAP = 280;
  function addPart(S, kind, x, y, z, vx, vy, vz, life, s, o) {
    if (S.parts.length >= CAP * (lowFx() ? 0.45 : 1)) return null;
    const p = S.free.pop() || {}; p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.s = s; p.g = (o && o.g) || 0; p.drag = (o && o.drag) || 0; p.grow = (o && o.grow) || 0; p.col = (o && o.col) || null;
    S.parts.push(p); return p;
  }
  function stepParts(S, dt) {
    for (let i = S.parts.length - 1; i >= 0; i--) { const p = S.parts[i]; p.life -= dt; if (p.life <= 0) { S.parts[i] = S.parts[S.parts.length - 1]; S.parts.pop(); S.free.push(p); continue; }
      const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz = p.vz * k - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); }
  }
  function frost(S, x, y, n, v0) { const Q = lowFx() ? 0.45 : 1; for (let i = 0; i < Math.round(n * Q); i++) { const a = Math.random() * TAU, v = v0 * (0.4 + Math.random() * 0.8); addPart(S, 1, x, y, 0.3, Math.cos(a) * v, Math.sin(a) * v * GY, 1 + Math.random() * 2.5, 0.3 + Math.random() * 0.25, 0.08, { g: 6, col: i % 2 ? WHITE : ICE }); } }

  /* ================= drawing ================= */
  const mOpts = (S, T, extra) => Object.assign({ T, sx: S.H.sx, sy: S.H.sy, t: S.g.t, low: lowFx(), scale: S.size }, extra || null);
  function drawUnder(S, c) {
    const H = S.H, T = H.X.Tz(), V = S.V, M0 = MOD();
    /* the summoning ring: frost light opening under the pet (light only, feathered) */
    const sealA = S.phase === 'summon' ? Math.min(1, S.t / 0.3) * (1 - sstep(TUNE.summon - 0.5, TUNE.summon, S.t)) : 0;
    if (sealA > 0.01) { const X0 = H.sx(V.x), Y0 = H.sy(V.y), r = T * 2.3 * sstep(0, 0.45, S.t); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = sealA * 0.45; blitSized(c, glowSprite(ICE), X0 - r, Y0 - r * GY, r * 2, r * 2 * GY); c.globalAlpha = sealA * 0.25; blitSized(c, glowSprite(WHITE), X0 - r * 0.5, Y0 - r * 0.5 * GY, r, r * GY); c.restore(); }
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of S.parts) { if (p.kind !== 9) continue; const u = 1 - p.life / p.max, e = 1 - (1 - u) ** 3, r = T * p.s * (0.25 + 0.75 * e), X0 = H.sx(p.x), Y0 = H.sy(p.y); c.globalAlpha = Math.pow(1 - u, 1.4) * 0.42; blitSized(c, glowSprite(ICE), X0 - r, Y0 - r * GY, r * 2, r * 2 * GY); }
    /* the cyan channels' light on the floor under it */
    if (S.phase !== 'gone' && V.vis > 0.05) { const k = cl((V.pose.glow || 0.4) * (V.pose.alpha == null ? 1 : V.pose.alpha)), r = T * 1.9; c.globalAlpha = 0.22 * k; blitSized(c, glowSprite(CYAN), H.sx(V.x) - r, H.sy(V.y) - r * GY * 0.8, r * 2, r * 2 * GY * 0.8); }
    c.restore();
    if (S.phase !== 'gone' && V.vis > 0.05 && M0.drawShadow) { try { M0.drawShadow(c, V.x, V.y, V.z + (S.zOff || 0), V.heading + (S.spin || 0), V.pose, mOpts(S, T)); } catch (e) { /* (model) */ } }
    callM(S, c, 'drawUnder');
  }
  function callM(S, c, k) { const MV = moves(); if (MV[k] && S.ctx) { c.save(); try { MV[k](S.ctx, c); } catch (e) { /* (theirs) */ } c.restore(); } }
  function drawEnt(S, c) {
    const H = S.H, T = H.X.Tz(), V = S.V, M0 = MOD(), a = V.heading + (S.spin || 0);
    if (S.phase === 'gone') { if (S.fade && S.relT < S.fade && V.vis > 0.05) { const a0 = V.pose.alpha; V.pose.alpha = a0 * (1 - S.relT / S.fade); try { M0.draw(c, V.x, V.y, V.z, a, V.pose, mOpts(S, T)); } catch (e) { /* (model) */ } V.pose.alpha = a0; } return; }
    const riding = !(S.phase === 'summon' && S.t < 0.4) && !(S.phase === 'out' && S.hopped);
    /* the pet rides upright in the open; it rolls with the body in a somersault or the Spinning Wheel (a flat roll, never yawed) */
    const ph = S.phase === 'summon' ? lerp(1.5, TUNE.petH, sstep(0.4, 0.8, S.t)) : TUNE.petH;   /* (it settles into the saddle as Fenrir forms round it) */
    const rot = -(V.pose.flip || 0) * Math.cos(a), o = mOpts(S, T, { pet: (cc, PX, PY) => { S.seatS = [PX, PY]; if (riding) H.X.drawPetAt(cc, PX, PY, rot ? { maxH: ph, rot } : { maxH: ph }); } });
    let drawn = false; if (V.vis > 0.05) { try { M0.draw(c, V.x, V.y, V.z + (S.zOff || 0), a, V.pose, o); drawn = true; } catch (e) { drawn = false; } }
    if (!drawn || !S.seatS) { const p = S.ctx.anchor('seat'); S.seatS = [H.sx(p.x), H.sy(p.y) - p.z * ZK * T]; if (riding && !drawn) H.X.drawPetAt(c, S.seatS[0], S.seatS[1], { maxH: TUNE.petH }); }
    if (S.phase === 'summon' && S.t < 0.4) H.X.drawPetAt(c, H.sx(S.home.x), H.sy(S.home.y), {});
    if (S.phase === 'out' && S.hopped) { const u = cl(S.petHop / TUNE.hop), s3 = S.seatS, gx = H.sx(S.ret.x), gy = H.sy(S.ret.y); H.X.drawPetAt(c, lerp(s3[0], gx, u), lerp(s3[1], gy, u) - Math.sin(u * Math.PI) * T * 0.7, u < 1 ? { maxH: lerp(TUNE.petH, 1.5, u * u) } : {}); }
    callM(S, c, 'drawEnt');
  }
  function drawOver(S, c) {
    const H = S.H, T = H.X.Tz();
    callM(S, c, 'drawOver');
    if (!S.parts.length) return;
    const sp = S.seatS || [-1e9, -1e9], PX = sp[0], PY = sp[1] - T * 0.35;
    c.save();
    for (const p of S.parts) { if (p.kind === 9) continue; const X0 = H.sx(p.x), Y0 = H.sy(p.y) - p.z * ZK * T, u = 1 - p.life / p.max, keep = 0.1 + 0.9 * sstep(T * 0.35, T * 1.0, Math.hypot(X0 - PX, Y0 - PY));   /* (never over the rider) */
      if (p.kind === 2) { const r = T * p.s * (1 + p.grow * u); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, u * 6) * (1 - u) * 0.16 * keep; blitSized(c, glowSprite(p.col || ICE2), X0 - r, Y0 - r * 0.8, r * 2, r * 1.6); continue; }
      const a = cl(p.life / Math.min(0.3, p.max)) * keep; if (a < 0.02) continue; const r = T * p.s; c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(p.col || ICE), X0 - r, Y0 - r, r * 2, r * 2); }
    c.restore();
  }

  /* ================= the HUD: one contextual menu (Drift; Ice Cannon; Somersault / Spinning Wheel; Diamond Dust / Frozen),
     the summon timer apart from the gauge; Jump above Drift, in both forms ================= */
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  function drawBtns(S, c, o) {
    const { B, blitC, hudPic, glowPic } = o, t = S.g.t, wolf = (S.menu || S.form) === 'wolf', idle = (S.phase !== 'ride' && S.phase !== 'drift') || (S.V.locked && !S.busy), ic = moves().icons || null;
    const btn = (b, key, label, cd, cdMax, paint, busy) => { if (!b) return; const rd = cd <= 0.01 && !idle && !S.busy && !S.drift;
      if (rd) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.24 + 0.08 * Math.sin(t * 5); blitC(c, glowPic(glowSprite, ICE, Math.round(b.r * 1.7)), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`fen|${key}|${rd}|${b.r}|${ic && ic[key] ? 1 : 0}`, b.r * 2 + 10, b.r * 2 + 10, (x, w, h) => { const cx = w / 2, cy = h / 2; btnFace(x, cx, cy, b.r, rd); let ok = false; if (ic && typeof ic[key] === 'function') { try { ic[key](x, cx, cy, b.r, rd); ok = true; } catch (e) { ok = false; } } if (!ok) paint(x, cx, cy, b.r, rd); btnRim(x, cx, cy, b.r, rd); }), b.x, b.y);
      if (busy) { c.save(); c.lineWidth = 3; c.strokeStyle = rgba(ICE2, 0.85); c.beginPath(); c.arc(b.x, b.y, b.r + 2, t * 6, t * 6 + 1.6); c.stroke(); c.restore(); }
      if (cd > 0.05) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, cd / Math.max(0.1, cdMax))); c.closePath(); c.fillStyle = 'rgba(4,10,20,.55)'; c.fill(); GFX.textS(c, cd.toFixed(1), b.x, b.y, 13, '#FFFFFF'); }
      GFX.labelS(c, label, b.x, b.y + b.r + 9, 8, 800, '#DDF4FF', 'rgba(0,0,0,.7)', 3); };
    const M2 = S.cdMax || {};
    btn(B.s[0], 'iceCannon', 'ICE CANNON', S.cd.cannon, M2.cannon || TUNE.cannonCd, paintCannonBtn, S.busy === 'iceCannon');
    if (wolf) btn(B.s[1], 'spinningWheel', 'SPINNING WHEEL', S.cd.s2, M2.s2 || TUNE.s2Cd, paintWheelBtn, S.busy === 'spinningWheel'); else btn(B.s[1], 'somersault', 'SOMERSAULT', S.cd.s2, M2.s2 || TUNE.s2Cd, paintSomersaultBtn, S.busy === 'somersault');
    btn(B.d, wolf ? 'driftWolf' : 'driftBike', 'DRIFT', S.cd.dodge, S.cdDodgeMax || TUNE.drift.cd, wolf ? paintDriftWolfBtn : paintDriftBikeBtn, !!S.drift);
    if (B.j) btn(B.j, wolf ? 'jumpWolf' : 'jumpBike', 'JUMP', 0, 1, wolf ? paintJumpWolfBtn : paintJumpBikeBtn, !!S.jump);
    /* the Ult: the finisher of the form in play, its gauge as a ring, the summon timer as an outer arc with the seconds */
    { const b = B.u, full = S.charge >= 1 && !S.used, k = S.used ? 1 : S.charge, fin = S.phase === 'finisher', name = wolf ? 'FROZEN' : 'DIAMOND DUST';
      if (full || fin) { const pl = 0.5 + 0.5 * Math.sin(t * 6); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.35 * pl; blitC(c, glowPic(glowSprite, ICE, Math.round(b.r * (2.1 + 0.25 * pl) * 4) / 4), b.x, b.y); c.restore(); }
      const ikey = wolf ? 'frozen' : 'diamondDust';
      blitC(c, hudPic(`fen|ult|${wolf}|${full || fin}|${b.r}|${ic && ic[ikey] ? 1 : 0}`, b.r * 2 + 12, b.r * 2 + 12, (x, w, h) => { const cx = w / 2, cy = h / 2; let ok = false; paintUltFace(x, cx, cy, b.r, full || fin); if (ic && typeof ic[ikey] === 'function') { try { ic[ikey](x, cx, cy, b.r, full || fin); ok = true; } catch (e) { ok = false; } } if (!ok) (wolf ? paintFrozenBtn : paintDustBtn)(x, cx, cy, b.r, full || fin); x.lineWidth = 2; x.strokeStyle = full || fin ? SILV : 'rgba(214,222,234,.4)'; x.beginPath(); x.arc(cx, cy, b.r, 0, TAU); x.stroke(); }), b.x, b.y);
      c.save(); c.lineCap = 'round'; c.lineWidth = 4.5; c.strokeStyle = 'rgba(4,10,20,.85)'; c.beginPath(); c.arc(b.x, b.y, b.r - 2, 0, TAU); c.stroke(); if (k > 0.004) { c.strokeStyle = full ? WHITE : S.used ? 'rgba(127,216,255,.4)' : ICE; c.lineWidth = 3.5; c.beginPath(); c.arc(b.x, b.y, b.r - 2, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke(); } c.restore();
      const ph = S.phase, on = ph === 'ride' || ph === 'drift', left = on ? S.left : ph === 'summon' ? S.dur : 0;
      if (on || ph === 'summon') { const u = cl(left / S.dur), low = on && left < 5; c.save(); c.lineCap = 'round'; c.lineWidth = 2.5; c.strokeStyle = low ? 'rgba(255,120,150,.95)' : 'rgba(207,243,255,.9)'; c.beginPath(); c.arc(b.x, b.y, b.r + 4.5, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); c.restore();
        GFX.labelS(c, Math.ceil(left) + 's', b.x, b.y + b.r * 0.7, 10, 900, low ? '#FF9AB8' : '#EAF8FF', 'rgba(0,0,0,.75)', 3); }
      const lab = fin ? name + '!' : full ? name : S.used ? name + ' USED' : `${name} ${Math.floor(S.charge * 100)}%`;
      if (full) { const s = 1 + 0.08 * Math.sin(t * 7); c.save(); c.translate(b.x, b.y + b.r + 10); c.scale(s, s); GFX.labelS(c, lab, 0, 0, 11, 900, WHITE, 'rgba(8,30,70,.9)', 3.5); c.restore(); }
      else GFX.labelS(c, lab, b.x, b.y + b.r + 9, 9, 800, '#DDF4FF', 'rgba(0,0,0,.7)', 3); }
  }
  /* dark steel faces, a silver rim, a cyan inner ring when ready */
  function btnFace(x, cx, cy, r, rd) { const g = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); if (rd) { g.addColorStop(0, '#3A5E96'); g.addColorStop(0.55, '#14284E'); g.addColorStop(1, '#060C1A'); } else { g.addColorStop(0, '#2A3038'); g.addColorStop(0.6, '#161A20'); g.addColorStop(1, '#090B0E'); } x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
  function btnRim(x, cx, cy, r, rd) { x.lineWidth = 3; x.strokeStyle = rd ? SILV : 'rgba(214,222,234,.45)'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke(); x.lineWidth = 1.6; x.strokeStyle = rd ? CYAN : 'rgba(95,242,255,.3)'; x.beginPath(); x.arc(cx, cy, r - 2.5, 0, TAU); x.stroke(); if (rd) { x.fillStyle = 'rgba(255,255,255,.16)'; x.beginPath(); x.ellipse(cx - r * 0.3, cy - r * 0.5, r * 0.3, r * 0.12, -0.5, 0, TAU); x.fill(); } }
  const shard = (x, px, py, h, w, rd) => { x.fillStyle = rd ? '#BFEAFF' : '#5A6A78'; x.beginPath(); x.moveTo(px - w, py); x.lineTo(px, py - h); x.lineTo(px + w, py); x.closePath(); x.fill(); x.fillStyle = rd ? COB : '#2C3440'; x.beginPath(); x.moveTo(px, py - h); x.lineTo(px + w, py); x.lineTo(px + w * 0.2, py); x.closePath(); x.fill(); };
  const wheelG = (x, px, py, r, rd) => { x.fillStyle = '#0A0E14'; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); x.strokeStyle = rd ? CYAN : 'rgba(95,242,255,.35)'; x.lineWidth = Math.max(1, r * 0.22); x.beginPath(); x.arc(px, py, r * 0.6, 0, TAU); x.stroke(); };
  /* Ice Cannon: two barrels, two bright rounds */
  function paintCannonBtn(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.rotate(-0.5); x.globalAlpha = rd ? 1 : 0.55; for (const dy of [-0.2, 0.2]) { x.fillStyle = rd ? '#2A3038' : '#1A1E24'; x.fillRect(-r * 0.6, (dy - 0.07) * r, r * 0.85, r * 0.14); x.fillStyle = rd ? SILV : '#69727E'; x.fillRect(r * 0.18, (dy - 0.1) * r, r * 0.14, r * 0.2); const g = x.createRadialGradient(r * 0.55, dy * r, 0, r * 0.55, dy * r, r * 0.2); g.addColorStop(0, rd ? '#FFFFFF' : '#8A96A2'); g.addColorStop(0.5, rd ? ICE : '#4A5662'); g.addColorStop(1, 'rgba(127,216,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(r * 0.55, dy * r, r * 0.2, 0, TAU); x.fill(); } x.restore(); }
  /* Somersault: the motorcycle turning over a crystal */
  function paintSomersaultBtn(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; shard(x, 0, r * 0.55, r * 0.45, r * 0.16, rd); shard(x, -r * 0.25, r * 0.55, r * 0.28, r * 0.11, rd); shard(x, r * 0.25, r * 0.55, r * 0.3, r * 0.11, rd);
    x.strokeStyle = rd ? ICE2 : 'rgba(207,243,255,.35)'; x.lineWidth = r * 0.08; x.lineCap = 'round'; x.beginPath(); x.arc(0, -r * 0.1, r * 0.42, Math.PI * 0.9, Math.PI * 2.2); x.stroke(); x.translate(0, -r * 0.1); x.rotate(-0.9); wheelG(x, -r * 0.2, 0, r * 0.15, rd); wheelG(x, r * 0.2, 0, r * 0.15, rd); x.fillStyle = rd ? SILV : '#69727E'; x.fillRect(-r * 0.2, -r * 0.16, r * 0.4, r * 0.1); x.restore(); }
  /* Spinning Wheel: the wolf curled into a ring of blades, rolling */
  function paintWheelBtn(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; for (let i = 0; i < 8; i++) { x.save(); x.rotate(i / 8 * TAU); x.fillStyle = i % 2 ? (rd ? COB : '#2C3440') : (rd ? '#BFEAFF' : '#5A6A78'); x.beginPath(); x.moveTo(r * 0.3, -r * 0.1); x.lineTo(r * 0.66, r * 0.12); x.lineTo(r * 0.32, r * 0.16); x.closePath(); x.fill(); x.restore(); }
    x.strokeStyle = rd ? SILV : '#69727E'; x.lineWidth = r * 0.12; x.beginPath(); x.arc(0, 0, r * 0.3, 0, TAU); x.stroke(); x.fillStyle = rd ? CYAN : 'rgba(95,242,255,.35)'; x.beginPath(); x.arc(0, 0, r * 0.1, 0, TAU); x.fill(); x.restore(); }
  /* Drift: the skid's arc ending in spikes, and the form it turns into (a paw for the motorcycle, a wheel for the wolf) */
  function driftArc(x, r, rd) { x.strokeStyle = rd ? ICE2 : 'rgba(207,243,255,.35)'; x.lineWidth = r * 0.1; x.lineCap = 'round'; x.beginPath(); x.arc(-r * 0.05, r * 0.05, r * 0.46, Math.PI * 0.75, Math.PI * 1.85); x.stroke(); shard(x, r * 0.42, r * 0.02, r * 0.34, r * 0.1, rd); shard(x, r * 0.24, r * 0.06, r * 0.22, r * 0.08, rd); }
  function paintDriftBikeBtn(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; driftArc(x, r, rd); x.fillStyle = rd ? SILV : '#69727E'; x.beginPath(); x.ellipse(-r * 0.05, r * 0.2, r * 0.15, r * 0.12, 0, 0, TAU); x.fill(); for (const [dx, dy] of [[-0.2, 0.02], [-0.08, -0.04], [0.05, -0.02], [0.14, 0.08]]) { x.beginPath(); x.arc(dx * r, dy * r, r * 0.055, 0, TAU); x.fill(); } x.restore(); }
  function paintDriftWolfBtn(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; driftArc(x, r, rd); wheelG(x, -r * 0.05, r * 0.12, r * 0.2, rd); x.restore(); }
  /* Jump: an arc of frost off a ring of light, the wheel (motorcycle) or the paw (wolf) at its top */
  function jumpArc(x, r, rd) { x.strokeStyle = rd ? CYAN : 'rgba(95,242,255,.3)'; x.lineWidth = 2; x.beginPath(); x.ellipse(0, r * 0.48, r * 0.5, r * 0.15, 0, 0, TAU); x.stroke(); x.strokeStyle = rd ? ICE2 : 'rgba(207,243,255,.35)'; x.lineWidth = r * 0.09; x.lineCap = 'round'; x.beginPath(); x.moveTo(-r * 0.42, r * 0.42); x.quadraticCurveTo(-r * 0.3, -r * 0.3, r * 0.02, -r * 0.3); x.stroke(); shard(x, -r * 0.2, r * 0.5, r * 0.22, r * 0.07, rd); shard(x, r * 0.28, r * 0.5, r * 0.16, r * 0.06, rd); }
  function paintJumpBikeBtn(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; jumpArc(x, r, rd); x.translate(r * 0.18, -r * 0.18); x.rotate(-0.5); wheelG(x, -r * 0.2, 0, r * 0.15, rd); wheelG(x, r * 0.22, 0, r * 0.15, rd); x.fillStyle = rd ? SILV : '#69727E'; x.fillRect(-r * 0.22, -r * 0.17, r * 0.46, r * 0.1); x.restore(); }
  function paintJumpWolfBtn(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; jumpArc(x, r, rd); x.translate(r * 0.2, -r * 0.2); x.fillStyle = rd ? SILV : '#69727E'; x.beginPath(); x.ellipse(0, r * 0.08, r * 0.16, r * 0.13, 0, 0, TAU); x.fill(); for (const [dx, dy] of [[-0.17, -0.08], [-0.06, -0.15], [0.07, -0.14], [0.17, -0.05]]) { x.beginPath(); x.arc(dx * r, dy * r, r * 0.055, 0, TAU); x.fill(); } x.restore(); }
  function paintUltFace(x, cx, cy, r, full) { const g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r); g.addColorStop(0, full ? '#2E64B8' : '#1E2A3C'); g.addColorStop(0.6, full ? '#0E2A66' : '#101824'); g.addColorStop(1, '#03060C'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
  /* Diamond Dust: concentric crystals round a bright core */
  function paintDustBtn(x, cx, cy, r, full) { x.save(); x.translate(cx, cy); for (const [rr, n, h] of [[0.5, 10, 0.2], [0.3, 6, 0.24]]) for (let i = 0; i < n; i++) { const a = i / n * TAU + rr; shard(x, Math.cos(a) * r * rr, Math.sin(a) * r * rr * 0.75 + r * 0.12, r * h, r * 0.07, full); }
    const g = x.createRadialGradient(0, 0, 0, 0, 0, r * 0.24); g.addColorStop(0, full ? '#FFFFFF' : '#8A96A2'); g.addColorStop(1, 'rgba(127,216,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r * 0.24, 0, TAU); x.fill(); x.restore(); }
  /* Frozen: one great beam from a locked stance */
  function paintFrozenBtn(x, cx, cy, r, full) { x.save(); x.translate(cx, cy); x.rotate(-0.45); const g = x.createLinearGradient(-r * 0.5, 0, r * 0.7, 0); g.addColorStop(0, full ? '#FFFFFF' : '#8A96A2'); g.addColorStop(0.5, full ? ICE : '#4A5662'); g.addColorStop(1, 'rgba(127,216,255,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(-r * 0.45, -r * 0.08); x.lineTo(r * 0.7, -r * 0.3); x.lineTo(r * 0.7, r * 0.3); x.lineTo(-r * 0.45, r * 0.08); x.closePath(); x.fill();
    x.fillStyle = full ? SILV : '#69727E'; x.beginPath(); x.arc(-r * 0.48, 0, r * 0.14, 0, TAU); x.fill(); x.restore(); }

  /* ================= the Ultimate ================= */
  U.fenrir = (C, H) => {
    const me = H.me, g = H.g;
    /* (a spirit, an actor that is not the played pet: a burst of ice where it stands) */
    if (me.spirit || !H.X.vehicle || !H.X.drawPetAt) { const DK = C.base * (C.K || 1); H.hitArea(me.x, me.y, 2.6, DK * 2.5, { el: 'ice', src: 'ult', chill: true }); H.X.ring(me.x, me.y, 0.3, 2.6, 0.5, ICE, 0.3); return; }
    if (g._fenrir && !g._fenrir.released) return;
    startForm(C, H);
  };
  /* idle-time preparation (20b calls it for an equipped Ultimate at the floor's start): the model's bake and E's sprites,
     a slice after each frame, sized to the frame rate it sees (as Susano O's, 20k5w) */
  let PUMP = null;
  U.fenrir.warm = o => { setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T, M0 = MOD(); if (!(T > 0) || !M0) return; const dpr = (typeof arc !== 'undefined' && arc.dpr) || 1;
    try { if (M0.warmIdle) M0.warmIdle(T * TUNE.zoom * dpr * sizeOf(M0), 1); if (M0.warmPlan) M0.warmPlan({ form: 'all', heading: 0 }); } catch (e) { /* (model) */ }
    if (PUMP) return; let last = nowMs(), mvDone = false;
    const slice = ms => { let done = true; try { if (M0.warm) done = M0.warm(ms) === true; } catch (e) { done = true; } const MV = moves(); if (!mvDone && MV.warm) { try { mvDone = MV.warm(Math.min(2, ms)) === true; } catch (e) { mvDone = true; } } else mvDone = true; return done && mvDone; };
    PUMP = () => requestAnimationFrame(() => setTimeout(() => { const n = nowMs(), gap = n - last; last = n; if (slice(gap < 20 ? 3 : gap < 34 ? 1.6 : 0.8)) { PUMP = null; return; } PUMP(); }, 0));
    PUMP(); }, 300); };
  U.fenrir.TUNE = TUNE; U.fenrir.CLIPS = CLIPS;
  U.fenrir.__dbg = { planJump, landOK, TUNE, CLIPS, SPR, STUB, STUBM, MOD, moves, safeReturn, target, switchForm, startOut, finish };
})();
