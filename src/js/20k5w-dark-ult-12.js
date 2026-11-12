/* ---------- Dark, the 12th Ultimate: Susano O (the core: worker A) ----------
   docs/DARK-SUSANOO-BRIEF.md, docs/elem-spec/dark-susanoo.md. A dark seal opens under the pet; the chest cockpit rises
   round it, the frame, limbs and armour slide into place, the shoulder engines unfold, the blade wings fan out, the
   helmet locks, the sword assembles; a mechanical lock and a pulse from the cockpit. One session, two forms:
     - ROBOT, 35 s from the moment it can move (20b's VEH hook takes the controls): it glides over the ground at the
       stat system's movement speed x1.35 (X.mvMod('susanoo', 1.35): applied once when it can move, removed once at the
       final exit; carried through the airship phase, never applied again). Dodge is Glides (a spinning sword sweep along
       the stick, one hit per enemy), Strong 1 Death Ray (round 6; it replaced True Dark Blade), Strong 2 Dark Spikes (worker E's 20k5x, SUSANOO_MOVES;
       stubs here if absent), Ult is TRANSFORM (no meter needed; the shared Dark Messiah meter shows as a ring).
     - TRANSFORM: accepted from a live robot phase (a press during an attack is kept and runs at its recovery); on
       commitment the robot timer stops, input is locked, and the timed stages drive the model's transformation channels
       (form, xf: TUNE.xfStages; the model's XF_STAGES when it has them). On completion, once: the airship menu, a fresh
       20 s, flight control. A held / repeated Ult press never chains into Dark Messiah: a press is only accepted after a
       release gap (TUNE.freshGap) and after the handover.
     - AIRSHIP, a fresh 20 s: free flight (Nidhogg's: the map plus open air round it, a cruise height, climbing walls it
       can clear), Dodge is Dive (an aerial roll, a swoop on the target, one hit per enemy at the low pass, a climb back),
       the one Strong is Shockwave Pulsar (the second Strong button is not drawn and its binding does nothing), Ult is
       DARK MESSIAH once the shared meter is full (worker E's finisher; its damage never refills the meter).
   The meter fills only through ctx.hit (effective damage after mitigation, no overkill; noCharge for the finisher).
   Exit (timeout in either form, Dark Messiah's end, the pet's defeat, a party swap, the floor's end): one guarded
   cleanup path: the pet set down on valid ground, the form dissolves, the controls, camera and movement modifier come
   back, and the 240 s cooldown starts then, once. */
(() => {
  const U = ELEM_IMPL.dark.ult;
  const TAU = Math.PI * 2;
  const VIO = '#9B5CFF', VIO2 = '#C9A2FF', DEEP = '#3A1466', SILV = '#D8D4E8', GOLD = '#D9B45A', CRIM = '#B0202E', WHITE = '#FFFFFF', INK = '#0C0812';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const wrap = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const easeIO = u => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const calm = () => typeof reduceMotion !== 'undefined' && reduceMotion;
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const GY = 0.72, ZK = 0.695;

  /* ================= the tuning (configurable; the spec's fixed values marked) ================= */
  const TUNE = {
    robotDur: 35, airDur: 20, cd: 240,             // (fixed by the spec) s of robot control, a fresh 20 s of airship control, the outer cooldown from the final exit
    mvK: 1.35,                                     // (fixed) the stat system's movement speed x this, once per session (X.mvMod)
    summon: 2.6,                                   // s: the assembly, until the robot can move
    size: 1,                                       // the model's drawn scale
    zoomR: 0.86, zoomA: 0.8,                       // the camera's zoom in robot and airship form
    camLift: 0.5,                                  // tiles: in the air the camera centres this far above the ship's drawn anchor (its hull's middle)
    hover: 0.35,                                   // tiles: the robot floats this high on its foot exhaust
    robotAcc: 9,                                   // 1/s: how fast its glide reaches the stick's speed (mass)
    turn: { max: 6.0, k: 8, acc: 30 },            // its heading: rad/s cap, gap closing, turn-rate easing (as Nidhogg's)
    // Glides (Dodge): prep, a committed spinning sweep along the stick, recovery; one hit per enemy per activation
    glide: { prep: 0.1, sweep: 0.42, rec: 0.2, dist: 5.2, steer: 2.2, reach: 3.0, dmg: 3, kb: 4, spins: 1 },   // (the single Glide before round 6; stage 3 keeps its numbers)
    /* (round 6, the user: "Glides shouldn't have a cooldown and player should be able to chain a 4 hit combo") Glides is a
       4-stage combo with no cooldown. Each stage: prep, act (the glide and its cut; the hits), rec. A press from the act's
       start to `win` s after the recovery chains the next stage (a press earlier in the stage is kept and fires at the
       act's end); after stage 4, or when the window lapses, the next press is stage 1 again. Anti-spam: a stage can't be
       cut short (prep + act are a stage's minimum). arc: rad of the frontal cut (0: all round). Stage 4 is the finisher: a
       leap-glide into an overhead slam (dmg x DK in reach) and its dark shockwave (wave x DK out to waveR); one hit per
       enemy per stage either way, with a brief hit-stop */
    combo: { win: 0.4, inv: 0.06, invLock: 0.8, st: [
      { clip: 'glide1', prep: 0.05, act: 0.22, rec: 0.14, dist: 3.0, reach: 3.0, arc: 2.8, dmg: 3, kb: 3 },
      { clip: 'glide2', prep: 0.05, act: 0.22, rec: 0.14, dist: 3.0, reach: 3.0, arc: 2.8, dmg: 3, kb: 3 },
      { clip: 'sweep', prep: 0.08, act: 0.36, rec: 0.14, dist: 4.4, reach: 3.0, arc: 0, dmg: 3, kb: 4, spin: 1 },
      { clip: 'glide4', prep: 0.14, act: 0.36, rec: 0.32, dist: 3.4, reach: 3.0, arc: 0, dmg: 4.8, kb: 8, h: 1.4, wave: 3, waveR: 3.6, stop: 0.08 } ] },
    // (H, 2026-11-12) the robot's basic sword swing (spec §4, last paragraph): the game's basic-attack input (tap / attack
    // key, at the pet's own normal-attack cadence: 20b sets g.normalT) swings the sword in a frontal arc; one hit per enemy
    // per swing through ctx.hit (it charges the meter); the airship has no basic weapon
    swing: { dur: 0.44, hit0: 0.38, hit1: 0.72,   /* (round 2: a bigger cut: wind-up, cut, follow-through; the hits over the cut) */ reach: 2.65, arc: 2.3, dmg: 0.8,   /* (M round 2: VIS 1.45, the reach +10%) */ kb: 1.5 },
    // (round 5, the user: "a jumping function/button to the robot ... like beast machine") Jump (robot only, its own button
    // above Glides, and J): no cooldown; crouch, a thruster-boosted planned arc, one landing shockwave
    jump: { dmg: 2.6, r: 2.6, kb: 6.5, ph: [0.16, 0.72, 0.12], h: 2.2, d: 4.4, max: 6.2, ext: 1.6, buf: 0.25, inv: 0.3, invLock: 1.8 },
    dodgeCd: 0.85,                                 // s after the recovery: the game's dodge cadence (x its arcane / dodgeK modifiers)
    // the robot's Strongs (E's moves own their own tuning; these are the cooldowns, from the press)
    cdBlade: 2.5, cdSpikes: 3.5, cdPulsar: 2.0, mvHold: 0.6,
    // Transform: its stages (s each; the model's XF_STAGES order), the lift
    xfStages: [['prepare', 0.32], ['dock', 0.34], ['clear', 0.26], ['pitch', 0.36], ['stow', 0.32], ['wings', 0.36], ['booms', 0.32], ['thrusters', 0.3], ['latch', 0.26], ['establish', 0.36]],
    freshGap: 0.28,                                // s: an Ult (or Strong) press counts only after a gap this long since the last press (a held key repeats faster)
    // the airship's flight (Nidhogg's): speed = the stat system's speed (with the session's x1.35) x airK
    airK: 1.75, accel: 20, brake: 13, cruise: 2.4, wallZ: 3.2, climbV: 5, sinkV: 2.6, margin: 16,
    // Dive (Dodge): roll, swoop, low pass, climb; one hit per enemy at the low pass
    dive: { roll: 0.24, swoop: 0.3, pass: 0.14, climb: 0.38, dmg: 3, r: 2.4, kb: 5, reach: 11, cone: 0.6, cone2: 1.0, reach2: 6 },   // (cone: rad either side of the aim for an enemy; cone2 / reach2: a looser second look before falling back to the ground (a keyboard aims in 45 deg steps))
    chargeK: 32,                                   // the meter fills at chargeK x DK of damage actually dealt
    messiahCap: 16,                                // s: a committed Dark Messiah is ended anyway after this
    outGlide: [0.35, 1.3], outSpd: 13, hop: 0.55, dissolve: 1.3, hatch: 0.4,   // s: the hatch opening before the pet leaves
  };
  const tierOf = ev => ev >= 7 ? 2 : ev >= 4 ? 1 : 0;
  const XFT = (() => { let t = 0; const L = TUNE.xfStages.map(([n, d]) => { const o = { n, t0: t, t1: t + d }; t += d; return o; }); return { L, total: t }; })();

  /* ================= the model: SUSANO_MODEL (worker M, 20k5v), or a stand-in so the flow can run ================= */
  const STUBM = (() => {
    /* a flat painted stand-in (no bake): the robot upright, the airship flat on the ground plane, a crossfade between */
    const blank = () => ({ form: 0, xf: 0, gait: 0, lean: 0, bank: 0, crouch: 0, pitch: 0, spin: 0, roll: 0, sword: 'rest', swordU: 0, wing: 0.6, thrust: 0.3, glow: 0.5, channel: 0, charge: 0, alpha: 1 });
    let LAST = null;
    function draw(c, x, y, z, a, P, o) {
      const T = o.T * (o.scale || 1), X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * o.T, al = P.alpha == null ? 1 : P.alpha, fm = cl(P.form || 0), xf = cl(P.xf || 0), k = Math.max(fm, xf);
      const ca = Math.cos(a), sa = Math.sin(a) * GY, face = ca >= 0 ? 1 : -1;
      LAST = { X0, Y0, T, a, face, k, z, wx: x, wy: y };
      c.save(); c.globalAlpha = al;
      // the robot (fading as it folds)
      if (k < 0.98) { c.save(); c.globalAlpha = al * (1 - k); c.translate(X0, Y0); const sp = P.spin || 0; c.scale(face * (Math.abs(Math.cos(sp)) * 0.7 + 0.3), 1);
        const H = T * 3.2, lean = (P.lean || 0) * 0.15; c.rotate(lean);
        // the wing fans behind
        for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const aa = -Math.PI / 2 + s * (0.5 + i * 0.22) * (0.5 + 0.5 * (P.wing == null ? 0.6 : P.wing)); c.save(); c.translate(s * T * 0.45, -H * 0.72); c.rotate(aa + Math.PI / 2); c.fillStyle = i % 2 ? '#2A2436' : '#3A3448'; c.beginPath(); c.moveTo(-T * 0.08, 0); c.quadraticCurveTo(T * 0.12, -T * 1.0, 0, -T * 1.7); c.lineTo(-T * 0.14, -T * 0.4); c.closePath(); c.fill(); c.strokeStyle = 'rgba(200,170,255,.6)'; c.lineWidth = 1; c.stroke(); c.restore(); }
        // legs, skirt, torso, shoulders, helm
        c.fillStyle = '#1C1824'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * T * 0.18, -H * 0.42); c.lineTo(s * T * 0.42, -H * 0.42); c.lineTo(s * T * 0.36, 0); c.lineTo(s * T * 0.12, 0); c.closePath(); c.fill(); }
        c.fillStyle = '#2B2638'; c.beginPath(); c.moveTo(-T * 0.55, -H * 0.42); c.lineTo(T * 0.55, -H * 0.42); c.lineTo(T * 0.45, -H * 0.82); c.lineTo(-T * 0.45, -H * 0.82); c.closePath(); c.fill();
        c.strokeStyle = GOLD; c.lineWidth = Math.max(1, T * 0.04); c.stroke();
        c.fillStyle = '#120E18'; c.beginPath(); c.arc(0, -H * 0.62, T * 0.3, 0, TAU); c.fill(); c.strokeStyle = GOLD; c.stroke();
        for (const s of [-1, 1]) { c.fillStyle = '#34304A'; c.beginPath(); c.arc(s * T * 0.62, -H * 0.8, T * 0.24, 0, TAU); c.fill(); c.strokeStyle = CRIM; c.lineWidth = T * 0.05; c.stroke(); }
        c.fillStyle = '#26222E'; c.beginPath(); c.moveTo(-T * 0.2, -H * 0.84); c.lineTo(T * 0.2, -H * 0.84); c.lineTo(T * 0.16, -H); c.lineTo(0, -H * 1.08); c.lineTo(-T * 0.16, -H); c.closePath(); c.fill();
        c.fillStyle = VIO2; c.fillRect(-T * 0.12, -H * 0.94, T * 0.24, T * 0.03);
        // the sword (hold presets)
        const hold = P.sword || 'rest', u = cl(P.swordU || 0); let sa2 = 0.5, hx = T * 0.7, hy = -H * 0.55;
        if (hold === 'sweep') sa2 = lerp(-1.2, 2.0, u); else if (hold === 'overhead') { sa2 = u < 0.5 ? lerp(0.5, -2.6, u / 0.5) : lerp(-2.6, 0.9, cl((u - 0.5) / 0.2)); hx = T * 0.2; hy = -H * 0.7; } else if (hold === 'pointDown' || hold === 'down') { sa2 = Math.PI / 2; hx = T * 0.3; hy = -H * (u < 0.5 ? 0.8 : 0.5); }
        c.save(); c.translate(hx, hy); c.rotate(sa2); c.fillStyle = '#18141E'; c.fillRect(0, -T * 0.09, T * 2.6, T * 0.18); c.fillStyle = SILV; c.fillRect(T * 0.2, T * 0.07, T * 2.4, T * 0.03); c.fillStyle = VIO; c.globalAlpha *= 0.4 + 0.6 * cl(P.channel || 0); c.fillRect(T * 0.3, -T * 0.02, T * 2.1, T * 0.04); c.restore();
        c.restore(); }
      // the airship (rising as it forms)
      if (k > 0.02) { c.save(); c.globalAlpha = al * k; c.translate(X0, Y0); const rot = Math.atan2(sa, ca), L = T * 2.4 * (0.6 + 0.4 * k); c.rotate(rot); c.scale(1, 1 - 0.35 * Math.abs(Math.sin(P.roll || 0)));
        for (const s of [-1, 1]) { c.fillStyle = '#2E2840'; c.beginPath(); c.moveTo(L * 0.1, 0); c.quadraticCurveTo(-L * 0.2, s * L * 0.9 * (P.wing == null ? 1 : 0.6 + 0.4 * P.wing), -L * 0.7, s * L * 0.8); c.lineTo(-L * 0.4, s * L * 0.15); c.closePath(); c.fill(); c.strokeStyle = 'rgba(200,170,255,.55)'; c.lineWidth = 1.2; c.stroke(); }
        c.fillStyle = '#1C1824'; for (const s of [-1, 1]) c.fillRect(-L * 0.9, s * L * 0.16 - L * 0.06, L * 0.7, L * 0.12);
        c.fillStyle = '#2B2638'; c.beginPath(); c.moveTo(L * 0.9, 0); c.lineTo(-L * 0.6, L * 0.2); c.lineTo(-L * 0.6, -L * 0.2); c.closePath(); c.fill(); c.strokeStyle = GOLD; c.lineWidth = Math.max(1, T * 0.04); c.stroke();
        c.fillStyle = '#18141E'; c.fillRect(L * 0.3, -T * 0.07, L * 1.0, T * 0.14); c.fillStyle = VIO; c.globalAlpha *= 0.4 + 0.6 * cl(P.channel || 0); c.fillRect(L * 0.35, -T * 0.02, L * 0.9, T * 0.04);
        c.restore(); c.save(); c.globalAlpha = al * k; c.globalCompositeOperation = 'lighter'; for (const s of [-1, 1]) { const px = X0 + Math.cos(a + Math.PI + s * 0.35) * L * 0.95, py = Y0 + Math.sin(a + Math.PI + s * 0.35) * L * 0.95 * GY; const r = T * (0.2 + 0.25 * cl(P.thrust || 0)); const g2 = c.createRadialGradient(px, py, 0, px, py, r); g2.addColorStop(0, 'rgba(230,200,255,.9)'); g2.addColorStop(1, 'rgba(120,60,255,0)'); c.fillStyle = g2; c.fillRect(px - r, py - r, r * 2, r * 2); } c.restore(); }
      c.restore();
      if (o.pet) { const s = anchor('seat'); if (s) o.pet(c, o.sx(s.x), o.sy(s.y) - s.z * ZK * o.T); }
    }
    function anchor(name) { if (!LAST) return null; const L = LAST, T = L.T, k = L.k, tz = L.z, x = (L.X0), a = L.a; const w = { x: 0, y: 0, z: 0 }; void x;
      const fx = Math.cos(a), fy = Math.sin(a), off = { seat: [0.1 * (1 - k), 0, lerp(2.0, 0.5, k)], cockpit: [0.1, 0, lerp(2.0, 0.5, k)], swordTip: [lerp(1.6, 3.2, k), 0, lerp(1.6, 0.2, k)], swordChannel: [lerp(1.2, 2.4, k), 0, lerp(1.6, 0.25, k)], helm: [0, 0, lerp(3.2, 0.4, k)], thrusterL: [-1.2, -0.6, 1.2 * (1 - k) + 0.3], thrusterR: [-1.2, 0.6, 1.2 * (1 - k) + 0.3], feet: [0, 0, 0] }[name] || [0, 0, 1];
      void T; w.x = (LAST.wx || 0) + fx * off[0] - fy * off[1]; w.y = (LAST.wy || 0) + fy * off[0] + fx * off[1]; w.z = tz + off[2]; return w; }
    function drawShadow(c, x, y, z, a, P, o) { const T = o.T * (o.scale || 1), X0 = o.sx(x), Y0 = o.sy(y), k = cl(Math.max(P.form || 0, P.xf || 0)), r = T * lerp(1.0, 2.2, k) / (1 + z * 0.15); c.save(); c.globalAlpha = 0.35 * (P.alpha == null ? 1 : P.alpha); const g2 = c.createRadialGradient(X0, Y0, 0, X0, Y0, r); g2.addColorStop(0, 'rgba(6,2,10,.8)'); g2.addColorStop(1, 'rgba(6,2,10,0)'); c.fillStyle = g2; c.beginPath(); c.ellipse(X0, Y0, r, r * GY * 0.7, 0, 0, TAU); c.fill(); c.restore(); }
    const api = { stub: true, create: () => ({ pose: blank() }), warm: () => true, warmIdle: () => {}, warmPlan: () => {}, blankPose: blank, relax: () => {},
      draw, drawShadow, anchor,
      XF_STAGES: TUNE.xfStages.map(s => s[0]) };
    return api;
  })();
  const MOD = () => (typeof SUSANO_MODEL !== 'undefined' && SUSANO_MODEL && SUSANO_MODEL.draw ? SUSANO_MODEL : STUBM);

  /* ================= E's moves (looked up at call time), or stubs so the flow can run ================= */
  const STUB = {
    TUNE: {},
    darkBlade(ctx) { let t = 0, hit = false; const P = ctx.pose, f = ctx.H.add({ life: 2, update(dt) { if (!ctx.alive()) { f.life = 0; ctx.done(); return; } t += dt; ctx.clip('overhead', t / 0.9);
      if (!hit && t >= 0.9 * CLIPS.overhead.hit) { hit = true; const v = ctx.vehicle, a = v.heading; for (let k = 1; k <= 6; k++) { const x = v.x + Math.cos(a) * k * 1.1, y = v.y + Math.sin(a) * k * 1.1; ctx.X.after(k * 0.05, () => { if (ctx.alive()) { ctx.hitArea(x, y, 1.6, ctx.DK * 4, { once: f }); ctx.X.ring(x, y, 0.2, 1.6, 0.3, VIO, 0.2); } }); } }
      if (t >= 0.9) { f.life = 0; ctx.done(); } void P; } }); },
    darkSpikes(ctx) { let t = 0, ph = 0; const f = ctx.H.add({ life: 2.4, update(dt) { if (!ctx.alive()) { f.life = 0; ctx.done(); return; } t += dt; ctx.clip('impale', t / 1.0); const p = ctx.aimPoint() || { x: ctx.vehicle.x + Math.cos(ctx.vehicle.heading) * 3, y: ctx.vehicle.y + Math.sin(ctx.vehicle.heading) * 3 };
      if (ph === 0 && t >= 0.5) { ph = 1; ctx.hitArea(p.x, p.y, 2.4, ctx.DK * 2.5); ctx.X.ring(p.x, p.y, 0.3, 2.4, 0.4, VIO, 0.3); } if (ph === 1 && t >= 0.85) { ph = 2; ctx.hitArea(p.x, p.y, 2.4, ctx.DK * 3); }
      if (t >= 1.0) { f.life = 0; ctx.done(); } } }); },
    pulsar(ctx) { let t = 0, hit = false; const f = ctx.H.add({ life: 2, update(dt) { if (!ctx.alive()) { f.life = 0; ctx.done(); return; } t += dt; ctx.clip('pulsar', t / 0.7); const p = ctx.aimPoint();
      if (!hit && t >= 0.35) { hit = true; if (p) { ctx.hitArea(p.x, p.y, 2.8, ctx.DK * 5); ctx.X.ring(p.x, p.y, 0.3, 2.8, 0.4, VIO, 0.35); } }
      if (t >= 0.7) { f.life = 0; ctx.done(); } } }); },
    messiah(ctx) { let t = 0, boomed = false; const v = ctx.vehicle, g0 = ctx.aimPoint() || { x: v.x + Math.cos(v.heading) * 4, y: v.y + Math.sin(v.heading) * 4 };
      const f = ctx.H.add({ life: 10, update(dt) { if (!ctx.alive()) { f.life = 0; return; } t += dt; ctx.clip('messiah', t / 4);
        if (!boomed && t >= 3) { boomed = true; ctx.hitArea(g0.x, g0.y, 7, ctx.DK * 40, { noCharge: true }); ctx.X.ring(g0.x, g0.y, 0.5, 7, 0.7, VIO, 0.4); ctx.camera({ shake: 8 }); }
        if (t >= 4) { f.life = 0; ctx.safeReturn(); ctx.done(); } } }); },
  };
  let MVC = null, MVK = null;
  function moves() { let SM = null; try { SM = typeof self !== 'undefined' && self.SUSANOO_MOVES ? self.SUSANOO_MOVES : null; } catch (e) { SM = null; } if (!SM) return STUB;
    const key = [SM.deathRay, SM.darkBlade, SM.darkSpikes, SM.pulsar, SM.messiah, SM.TUNE, SM.warm, SM.update, SM.drawUnder, SM.drawOver];
    if (MVC && MVK && MVK.every((v, i) => v === key[i])) return MVC; MVK = key;
    const pick = k => typeof SM[k] === 'function' ? SM[k] : STUB[k];
    return (MVC = { TUNE: SM.TUNE || {}, darkBlade: typeof SM.deathRay === 'function' ? SM.deathRay : pick('darkBlade'),   /* (Strong 1: Death Ray, the old slot name as the fallback) */ darkSpikes: pick('darkSpikes'), pulsar: pick('pulsar'), messiah: pick('messiah'), warm: SM.warm, update: SM.update, drawUnder: SM.drawUnder, drawOver: SM.drawOver, SM }); }

  /* ================= the animation (round 2, the user: "more lively, more realistic movements, bigger and wilder swings
     ... more fluid") =================
     The core no longer writes the model's pose directly. Every frame it builds TARGETS (G below: the body's lean, bank,
     torso pitch and twist, crouch, a whole-body yaw and rise, the sword's hold and progress, the fans, the thrust) from
     three layers, then springs the pose to them, each channel with its own stiffness and damping, so motion overlaps:
       - the base: a living idle (breathing, a slow weight shift, the fans breathing, a sword bob), the ground glide
         (leaning and pitching into acceleration, rearing back on the brake, banking into turns, the legs' gait swinging
         with the speed) and the airship (banking, pitching and wobbling with inertia);
       - an action clip (a basic cut, Glides, E's attacks through ctx.pose, Dive, the fold), keyed with anticipation, a
         fast eased strike, overshoot and follow-through;
       - secondary motion: the torso leads and the sword, then the fans follow on softer springs (they lag and sway),
         impact kicks (a spring's velocity jolted at a slam or a lock), thruster flicker that answers acceleration.
     The pose channels the model reads are only ever written here (and form / xf / alpha / assemble by the session). */
  const outBack = (u, s) => { s = s == null ? 1.70158 : s; u = cl(u) - 1; return 1 + (s + 1) * u * u * u + s * u * u; };   // (eased out past 1, then back)
  const inOut = u => { u = cl(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const outQ = u => 1 - Math.pow(1 - cl(u), 3), inQ = u => Math.pow(cl(u), 3);
  /* a critically under-damped spring per channel: w (rad/s) stiffness, z damping (< 1 overshoots) */
  function spring(S, key, target, w, z, dt) { const A = S.an; let s = A[key]; if (!s) s = A[key] = { x: target, v: 0 }; if (!isFinite(s.x)) { s.x = target; s.v = 0; }
    const h = Math.min(dt, 1 / 30), n = dt > h ? Math.ceil(dt / h) : 1, st = dt / n; for (let i = 0; i < n; i++) { const a = -w * w * (s.x - target) - 2 * z * w * s.v; s.v += a * st; s.x += s.v * st; } return s.x; }
  const kick = (S, key, dv) => { const s = S.an[key]; if (s) s.v += dv; };
  /* the per-channel springs: [stiffness, damping] (the torso leads; the sword follows; the fans lag and sway) */
  const SPR = { lean: [11, 0.42], bank: [10, 0.4], pitch: [13, 0.42], twist: [15, 0.4], crouch: [16, 0.45], yaw: [12, 0.42], z: [9, 0.4], swordU: [24, 0.62], swordK: [11, 0.7], wing: [5.5, 0.3], fold: [8, 0.45], thrust: [18, 0.6], roll: [9, 0.55], hip: [13, 0.45], arc: [10, 0.7] };
  const TG = () => ({ sword: 'rest', swordU: 0, swordK: 0, twist: 0, pitch: 0, crouch: 0, lean: 0, bank: 0, yaw: 0, z: 0, wing: 0.9, fold: 0, thrust: 0.35, roll: 0, hip: null, arc: 1, leg: null, aim: 0, channel: null, glow: null, charge: null, recoil: 0 });

  /* ---- the action clips: each writes targets into G at progress u (0..1); `hit` is the u of its strike, `rec` its
     recovery (E's damage belongs at hit). s = the side (+1 forehand, -1 backhand) where a clip has one ---- */
  const CLIPS = {
    /* (round 6) Glides' combo cuts: stage 1 right to left, stage 2 the return cut left to right: a short wind-up, a fast
       wide cut gliding forward, the follow-through held into the next stage (the springs flow, never back to idle) */
    glide1: { hit: 0.12, rec: 0.66, run(G, u) { cutClip(G, u, 1); } },
    glide2: { hit: 0.12, rec: 0.66, run(G, u) { cutClip(G, u, -1); } },
    /* stage 4, the finisher: a crouch and the sword raised overhead, the leap-glide arching back, the slam driving the
       whole body over (the impact is a spring kick), the heavy recovery */
    glide4: { hit: 0.6, rec: 0.6, run(G, u) { const pre = sstep(0, 0.17, u), air = cl((u - 0.17) / 0.44), slam = inQ(cl((u - 0.47) / 0.14)), rec = sstep(0.62, 1, u);
      G.sword = 'overhead'; G.swordK = 1 - 0.8 * sstep(0.85, 1, u); G.swordU = u < 0.47 ? 0 : slam; G.arc = 1.2;
      G.crouch = 0.6 * pre * (1 - sstep(0.17, 0.3, u)) + 0.85 * slam * (1 - rec); G.pitch = u < 0.47 ? -0.25 * pre - 0.45 * Math.sin(Math.PI * Math.min(1, air * 1.1)) : lerp(-0.3, 0.95, slam) * (1 - rec);
      G.lean = u < 0.47 ? -0.2 * pre + 0.4 * air : lerp(0.4, 0.6, slam) * (1 - rec); G.wing = u < 0.17 ? 0.6 : u < 0.47 ? 1 : lerp(1, 0.5, slam) + 0.5 * rec; G.fold = 0.3 * pre * (1 - air);
      G.thrust = 0.4 + 0.6 * Math.sin(Math.PI * air); G.leg = u > 0.17 && u < 0.6 ? -1 : null; G.channel = 0.3 + 0.7 * sstep(0.17, 0.6, u) * (1 - rec); } },
    /* (round 6) Death Ray (E): the free left arm raised and pointing at the spot on the ground ('rayAim' u 0..1), held
       while the ray carves the circle ('rayHold', tracking the target), the recoil as it explodes ('rayRecoil' u 0..1).
       The torso braces and leans a little back; the arm is M's aim channels (aimL / aimLYaw / aimLPitch) */
    ray: { hit: 0.5, rec: 0.8, run(G, u, t) { const aim = sstep(0, 0.25, u), held = u >= 0.25 && u < 0.8, rk = Math.sin(Math.PI * cl((u - 0.8) / 0.2));
      G.aim = aim * (1 - sstep(0.85, 1, u)); G.lean = -0.18 * aim * (1 - rk) - 0.35 * rk; G.pitch = -0.12 * aim - 0.4 * rk; G.crouch = 0.12 * aim * (1 - rk); G.twist = 0.25 * aim; G.wing = 0.95 + 0.05 * aim; G.fold = 0; G.thrust = 0.35 + 0.3 * rk;
      if (held) { const tr = Math.sin((t || 0) * 33) * 0.5 + Math.sin((t || 0) * 21) * 0.5; G.pitch += 0.02 * tr; G.twist += 0.02 * tr; } } },
    /* the basic cut: a big wind-up twisted back, a fast wide cut sweeping well past the body (the whole body turns with
       it: hips, torso, shoulders), the follow-through, the settle; s alternates left and right */
    basic: { hit: 0.38, rec: 0.72, run(G, u, s) { s = s || 1; const wu = sstep(0, 0.32, u), cut = outBack(cl((u - 0.32) / 0.3), 1.1), back = sstep(0.7, 1, u);
      G.sword = 'sweep'; G.arc = 1.45; G.swordK = 1 - 0.85 * back; const pathU = u < 0.32 ? 0.04 * wu : lerp(0.04, 1, Math.min(1, cut)); G.swordU = s > 0 ? pathU : 1 - pathU;
      G.twist = s * (u < 0.32 ? 0.75 * wu : lerp(0.75, -0.95, cut) * (1 - back)); G.yaw = s * (u < 0.32 ? 0.55 * wu : lerp(0.55, -0.75, cut) * (1 - back));
      G.crouch = 0.22 * Math.sin(Math.PI * cl(u / 0.75)) + 0.12 * wu * (1 - cut); G.lean = u < 0.32 ? -0.25 * wu : lerp(-0.25, 0.55, cut) * (1 - back); G.bank = -s * 0.35 * Math.sin(Math.PI * cl((u - 0.2) / 0.6));
      G.pitch = u < 0.32 ? -0.15 * wu : 0.3 * cut * (1 - back); G.wing = 0.75 + 0.25 * cut * (1 - back); G.fold = 0.25 * wu * (1 - cut); G.channel = 0.25 + 0.6 * Math.sin(Math.PI * cl((u - 0.25) / 0.5)); } },
    /* Glides: wind-up (a crouch, twisted against the spin), the full turn with the body leaning out and the sword at full
       extension (the core turns the heading), then the heavy recovery: a stagger the springs carry */
    sweep: { hit: 0.25, rec: 0.75, run(G, u, s) { s = s || 1; const pre = sstep(0, 0.18, u), sp = cl((u - 0.18) / 0.57), rec = sstep(0.75, 1, u);
      G.sword = 'sweep'; G.arc = 1.3; G.swordK = 1 - 0.8 * rec; G.swordU = u < 0.18 ? 0.1 * pre : lerp(0.1, 0.5, outQ(sp / 0.3)) * (1 - rec) + 0.5 * rec * 0;
      G.twist = u < 0.18 ? s * 0.7 * pre : lerp(s * 0.7, -s * 0.35, outQ(sp)) * (1 - rec); G.crouch = 0.35 * pre * (1 - outQ(sp)) + 0.28 * Math.sin(Math.PI * cl(sp)) + 0.32 * Math.sin(Math.PI * rec);
      G.lean = 0.55 * Math.sin(Math.PI * sp) - 0.2 * Math.sin(Math.PI * rec); G.bank = -s * 0.75 * Math.sin(Math.PI * sp) + s * 0.25 * Math.sin(TAU * rec);
      G.pitch = -0.12 * pre + 0.25 * Math.sin(Math.PI * sp) - 0.18 * Math.sin(Math.PI * rec); G.wing = lerp(0.95, 0.4, sstep(0, 0.25, u)) + 0.55 * rec; G.fold = 0.35 * Math.sin(Math.PI * sp);
      G.z = 0.15 * Math.sin(Math.PI * sp) - 0.08 * Math.sin(Math.PI * rec); G.channel = 0.3 + 0.6 * Math.sin(Math.PI * cl(sp)); } },
    /* (retired with True Dark Blade in round 6; kept for ctx.clip('overhead')) True Dark Blade (E: 'overhead' u 0..0.5 the lift, 'overheadSlam' 0.5..0.62 the drive, then the recoil to 1): a dip
       of anticipation, a huge lift with the back arched and the body rising on its thrusters, the smash with the whole
       body following through (a deep crouch, pitched over), the recoil, the settle */
    overhead: { hit: 0.62, rec: 0.75, run(G, u) { const dip = Math.sin(Math.PI * cl(u / 0.12)), lift = sstep(0.05, 0.5, u), slam = inQ(cl((u - 0.5) / 0.12)), rec = sstep(0.66, 1, u);
      G.sword = 'overhead'; G.swordK = 1 - 0.9 * sstep(0.85, 1, u); G.swordU = u < 0.5 ? 0 : u < 0.62 ? slam : 1;
      G.pitch = u < 0.5 ? -0.75 * lift : lerp(-0.75, 0.95, slam) * (1 - rec) + 0.0 * rec; G.crouch = 0.3 * dip * (1 - lift) + (u < 0.5 ? 0 : 0.95 * slam * (1 - rec));
      G.z = u < 0.5 ? 0.75 * lift : lerp(0.75, -0.1, slam) * (1 - rec); G.lean = u < 0.5 ? -0.35 * lift : lerp(-0.35, 0.6, slam) * (1 - rec); G.twist = u < 0.5 ? 0.25 * lift : lerp(0.25, -0.2, slam) * (1 - rec);
      G.wing = u < 0.5 ? 0.9 + 0.1 * lift : lerp(1, 0.55, slam) + 0.4 * rec; G.fold = u < 0.5 ? 0 : 0.25 * slam * (1 - rec); G.thrust = 0.35 + 0.55 * lift * (1 - slam); } },
    /* Dark Spikes (E: 'pointDown' u 0..0.35 the lift, 'pointDownPlunge' 0.35..0.6 the plunge, held planted to 0.75, the
       withdrawal to 1): the sword lifted high, point down, the body rising; the plunge with a crouch and full weight;
       planted, the robot strains (a tremor through the body), then hauls it out */
    impale: { hit: 0.45, rec: 0.75, run(G, u, t) { const lift = sstep(0, 0.35, u), pl = inQ(cl((u - 0.35) / 0.1)), held = u >= 0.45 && u < 0.75, rec = sstep(0.75, 1, u);
      G.sword = 'down'; G.swordK = 1 - 0.9 * sstep(0.85, 1, u); G.swordU = u < 0.35 ? 0 : u < 0.45 ? pl : 1 - 0.6 * rec;
      G.z = u < 0.35 ? 0.6 * lift : lerp(0.6, -0.15, pl) * (1 - rec); G.pitch = u < 0.35 ? -0.45 * lift : lerp(-0.45, 0.6, pl) * (1 - rec); G.crouch = u < 0.35 ? 0.12 * Math.sin(Math.PI * lift) : lerp(0, 1, pl) * (1 - rec);
      G.lean = u < 0.35 ? -0.2 * lift : 0.45 * pl * (1 - rec); G.wing = 1; G.fold = 0; G.thrust = 0.3 + 0.6 * lift * (1 - pl);
      if (held) { const tr = Math.sin((t || 0) * 47) * 0.5 + Math.sin((t || 0) * 31) * 0.5; G.pitch += 0.05 * tr; G.crouch += 0.04 * tr; G.bank += 0.05 * Math.sin((t || 0) * 23); G.twist += 0.04 * Math.sin((t || 0) * 19); } } },
    /* the airship's Shockwave Pulsar: the nose lifts (anticipation), drives down onto the aim, the release, the recoil
       throwing the nose up, the settle */
    pulsar: { hit: 0.5, rec: 0.6, run(G, u) { const ant = Math.sin(Math.PI * cl(u / 0.2)), aim = sstep(0.12, 0.45, u), rk = Math.sin(Math.PI * cl((u - 0.5) / 0.3)); G.pitch = -0.3 * ant * (1 - aim) + 0.65 * aim * (1 - sstep(0.5, 0.9, u)) - 0.55 * rk; G.thrust = 0.5 + 0.5 * rk; G.channel = u < 0.5 ? sstep(0, 0.5, u) : 1 - sstep(0.5, 1, u); G.charge = u < 0.5 ? sstep(0.1, 0.5, u) : 0; G.wing = 1 - 0.2 * rk; } },
    /* Dark Messiah: rising and pitching over the aim as it charges, wings flung wide, the hull trembling under the beam */
    messiah: { hit: 0.75, rec: 0.85, run(G, u, t) { const ch = sstep(0, 0.6, u), fire = u >= 0.6 && u < 0.85; G.pitch = 0.6 * sstep(0, 0.25, u) * (1 - sstep(0.85, 1, u)); G.z = 0.5 * ch * (1 - sstep(0.85, 1, u)); G.channel = sstep(0.05, 0.6, u) * (1 - sstep(0.85, 1, u) * 0.7); G.charge = ch * (1 - sstep(0.6, 0.66, u)); G.glow = 0.5 + 0.5 * ch; G.thrust = 0.4 + 0.5 * sstep(0.6, 0.75, u); G.wing = 1;
      if (fire) { const tr = Math.sin((t || 0) * 41) + Math.sin((t || 0) * 27); G.roll += 0.03 * tr; G.pitch += 0.04 * tr; } } },
  };
  /* the combo's cuts (s: +1 right to left, -1 left to right) */
  function cutClip(G, u, s) { const wu = sstep(0, 0.12, u), cut = outBack(cl((u - 0.12) / 0.4), 1.2), ft = sstep(0.66, 1, u);
    G.sword = 'sweep'; G.arc = 1.4; G.swordK = 1; const pathU = u < 0.12 ? 0.03 * wu : lerp(0.03, 1, Math.min(1, cut)); G.swordU = s > 0 ? pathU : 1 - pathU;
    G.twist = s * (u < 0.12 ? 0.6 * wu : lerp(0.6, -0.9, cut)) * (1 - 0.4 * ft); G.yaw = s * (u < 0.12 ? 0.4 * wu : lerp(0.4, -0.6, cut)) * (1 - 0.5 * ft); G.hip = s * (u < 0.12 ? 0.3 * wu : lerp(0.3, -0.4, cut)) * (1 - 0.5 * ft);
    G.crouch = 0.15 * wu * (1 - cut) + 0.18 * Math.sin(Math.PI * cl(u / 0.8)); G.lean = u < 0.12 ? -0.1 * wu : 0.6 * Math.min(1, cut) * (1 - 0.6 * ft); G.bank = -s * 0.4 * Math.sin(Math.PI * cl((u - 0.1) / 0.6));
    G.pitch = 0.25 * Math.min(1, cut) * (1 - ft); G.wing = 0.75 + 0.2 * Math.min(1, cut); G.fold = 0.2 * (1 - Math.min(1, cut)); G.channel = 0.3 + 0.6 * Math.sin(Math.PI * cl((u - 0.1) / 0.6)); }
  /* E's named poses (ctx.pose(name, u, extra)): each maps onto a stretch of a clip; they are recorded and played by the
     animation next frame (`extra` effect channels pass through; crouch / recoil add to the targets) */
  const POSES = { rayAim: ['ray', 0, 0.25], rayHold: ['ray', 0.25, 0.8], rayRecoil: ['ray', 0.8, 1], rest: null,   /* (True Dark Blade's overhead / overheadSlam retired with it) */ pointDown: ['impale', 0, 0.35], pointDownPlunge: ['impale', 0.35, 0.6], sweep: ['sweep', 0, 1],
    pulsarAim: ['pulsar', 0, 0.5], pulsarFire: ['pulsar', 0.5, 1], messiah: ['messiah', 0, 0.6], messiahFire: ['messiah', 0.6, 0.85] };
  function poseNamed(S, name, u, extra) { const E = S.eAct || (S.eAct = {}); const prev = E.name; E.name = name; E.u = cl(u); E.extra = extra || null; E.t = S.g.t;
    // a slam or a plunge reaching its end: the impact kick (the body jolts down and over, the fans flap)
    if ((name === 'overheadSlam' || name === 'pointDownPlunge') && u >= 1 && !E.hitDone) { E.hitDone = true; kick(S, 'crouch', 5); kick(S, 'pitch', 4); kick(S, 'z', -3); kick(S, 'wing', -3); if (!calm()) S.X.shake(name === 'overheadSlam' ? 5 : 4, 0.18); }
    if (name !== prev && name !== 'overheadSlam' && name !== 'pointDownPlunge') E.hitDone = false;
    if (name === 'pulsarAim' && prev === 'pulsarAim' && extra && extra.recoil > 0.9 && !E.rk) { E.rk = true; kick(S, 'pitch', -5); } if (name !== 'pulsarAim') E.rk = false; }
  /* where on its clip E's current pose is (clip, u), or null when E is not driving (a stale record after ~0.1 s) */
  function eClip(S) { const E = S.eAct; if (!E || S.g.t - E.t > 0.12) return null; if (E.name === '_clip') return CLIPS[E.clip] ? { c: E.clip, u: E.u } : null; const m = POSES[E.name];
    if (!m) return null; let u = lerp(m[1], m[2], E.u);
    // after the strike, E holds 'overheadSlam' / 'pointDownPlunge' at 1 through its recoil: run the clip's recovery from E's recoil / channel fade
    if (E.name === 'overheadSlam' && E.u >= 1 && E.extra && E.extra.recoil != null) u = lerp(0.62, 0.95, cl(1 - E.extra.recoil));
    if (E.name === 'pointDownPlunge' && E.u >= 1 && E.extra && E.extra.channel != null) u = lerp(0.6, 0.74, cl((1 - E.extra.channel) / 0.5));
    return { c: m[0], u }; }

  /* ---- the base layer and the compose, every frame ---- */
  function animate(S, dt) {
    const d = S.V, P = d.pose, g = S.g, t = g.t, ph = S.phase, G = S.tg || (S.tg = TG()), A = S.an || (S.an = {});
    Object.assign(G, TG.base || (TG.base = TG()));
    // the motion this frame: forward / lateral acceleration in the heading's frame
    const ax = (d.vx - (S.pvx || 0)) / Math.max(dt, 1e-3), ay = (d.vy - (S.pvy || 0)) / Math.max(dt, 1e-3); S.pvx = d.vx; S.pvy = d.vy;
    const ch = Math.cos(d.heading), sh = Math.sin(d.heading), fa = Math.max(-40, Math.min(40, ax * ch + ay * sh)), la = Math.max(-40, Math.min(40, -ax * sh + ay * ch)), sp = Math.hypot(d.vx, d.vy);
    S.accS = (S.accS || 0) + (fa - (S.accS || 0)) * Math.min(1, dt * 8); S.latS = (S.latS || 0) + (la - (S.latS || 0)) * Math.min(1, dt * 8);
    const breath = Math.sin(t * 1.6), shift = Math.sin(t * 0.47), sway = Math.sin(t * 0.83 + 1);
    const robotish = ph === 'robot' || ph === 'summon' || (ph === 'out' && S.fromPhase === 'robot'), airish = ph === 'air' || ph === 'messiah' || (ph === 'out' && S.fromPhase !== 'robot');
    if (robotish) {   // the living idle and the ground glide
      const mv = Math.min(1, sp / 5);
      // (round 3, the user: "stand strong and powerful") the tall hovering hero stance is the rest: no crouch; the chest
      // breathes, the body bobs on its thrusters, the fans breathe open; moving, it leans and banks forward like flying
      G.crouch = 0; G.bank = 0.05 * shift * (1 - mv) + Math.max(-0.8, Math.min(0.8, S.turnK * 0.65 + S.latS * 0.025)); G.twist = 0.05 * sway * (1 - mv) - S.turnK * 0.2;
      G.lean = Math.max(-0.4, Math.min(0.9, 0.55 * mv + S.accS * 0.035)); G.pitch = -0.04 * breath * (1 - mv) + Math.max(-0.35, Math.min(0.5, S.accS * 0.025 + 0.2 * mv));   // (pitched forward speeding up, reared back braking)
      G.wing = 0.92 + 0.08 * Math.sin(t * 1.1) - 0.2 * Math.min(1, Math.abs(S.turnK)) - 0.1 * mv; G.fold = 0.15 * mv + 0.2 * Math.min(1, Math.abs(S.turnK));
      G.thrust = 0.3 + 0.35 * mv + Math.min(0.4, Math.abs(S.accS) * 0.03); G.z = 0.09 * Math.sin(t * 1.9) + 0.04 * breath; G.swordU = 0; G.recoil = 0;
      P.gait = (P.gait || 0) + dt * (1.0 + sp * 0.5); P.gaitAmp = Math.min(0.35, sp / 12);   /* (it flies: the legs trail (legSwing) rather than walk) */
    } else if (airish) {   // the airship: bank, pitch and wobble with inertia
      G.bank = Math.max(-0.9, Math.min(0.9, S.turnK * 0.75 + S.latS * 0.025)); G.pitch = Math.max(-0.4, Math.min(0.4, S.accS * 0.02 - (d.z - (S.pz == null ? d.z : S.pz)) / Math.max(dt, 1e-3) * 0.04)) + 0.03 * Math.sin(t * 1.3);
      G.roll = 0.035 * Math.sin(t * 1.7) + 0.02 * Math.sin(t * 2.9 + 1); G.z = 0.06 * Math.sin(t * 1.4); G.wing = 1 - 0.18 * Math.min(1, Math.abs(S.turnK)) + 0.04 * Math.sin(t * 2.1); G.thrust = 0.35 + Math.min(0.55, sp / 16) + Math.min(0.3, Math.max(0, S.accS) * 0.02); P.gaitAmp = 0;
    }
    S.pz = d.z;
    // the action layer
    let ac = null;
    if (S.swing) ac = ['basic', S.swing.u || 0, S.swing.side];
    else if (S.glide) ac = [TUNE.combo.st[S.glide.n - 1].clip, S.glide.u || 0, S.glide.dir];
    else { const e = eClip(S); if (e) ac = [e.c, e.u, 0]; }
    if (ac) { const C = CLIPS[ac[0]]; if (C) { if (ac[0] === 'impale' || ac[0] === 'messiah' || ac[0] === 'ray') C.run(G, ac[1], t); else C.run(G, ac[1], ac[2]); } }
    if (S.jump) jumpTargets(S, G);
    if (S.dive) diveTargets(S, G);
    if (ph === 'xform') xformTargets(S, G);
    if (ph === 'summon') { const u = cl(S.t / TUNE.summon); G.wing = lerp(0.1, 0.9, sstep(0.55, 0.85, u)); G.fold = 0.6 * (1 - sstep(0.55, 0.85, u)); G.crouch = 0.25 * (1 - sstep(0.7, 1, u)); G.z = 0.3 * (1 - outBack(sstep(0.6, 1, u), 2.2)); G.glow = 0.3 + 0.7 * Math.exp(-Math.pow((S.t - (TUNE.summon - 0.15)) / 0.12, 2)); }
    // E's effect channels pass through; its crouch / recoil add
    const E = S.eAct && S.g.t - S.eAct.t < 0.12 ? S.eAct.extra : null;
    if (E) { if (E.crouch != null) G.crouch += E.crouch * 0.5; if (E.recoil != null) G.recoil = Math.max(G.recoil, E.recoil); for (const k of ['channel', 'glow', 'charge', 'thrust']) if (E[k] != null) G[k] = E[k]; }
    // the sword's hold: a new hold restarts its progress spring there (two holds never blend through each other)
    if (G.sword !== S.hold) { if (S.hold && S.hold !== 'rest' && G.sword !== 'rest') { const s = A.swordU; if (s) { s.x = G.swordU; s.v = 0; } } if (G.sword !== 'rest') S.hold = G.sword; else if ((A.swordK ? A.swordK.x : 0) < 0.05) S.hold = 'rest'; }
    P.sword = S.hold || 'rest';
    // the compose: each channel on its spring (overlap: the torso leads, the sword follows, the fans lag)
    const k = (c, v) => spring(S, c, v, SPR[c][0], SPR[c][1], dt);
    P.lean = k('lean', G.lean); P.bank = k('bank', G.bank); P.pitch = k('pitch', G.pitch); P.twist = k('twist', G.twist); P.crouch = Math.max(0, k('crouch', G.crouch));
    S.yawOff = k('yaw', G.yaw); S.zOff = k('z', G.z); P.swordU = cl(k('swordU', G.swordU)); P.swordK = cl(k('swordK', P.sword === 'rest' ? 0 : G.swordK));
    P.wingSpread = cl(k('wing', G.wing)); P.wingFold = cl(k('fold', G.fold)); P.thrust = cl(k('thrust', G.thrust) + 0.05 * Math.sin(t * 37) * Math.sin(t * 23) + Math.min(0.15, Math.abs(S.accS) * 0.006) * Math.sin(t * 53));
    if (airish || ph === 'xform') P.roll = k('roll', G.roll) + (S.dive ? S.dive.rollA || 0 : 0); else P.roll = 0;
    // (for M's optional channels: the legs trailing with momentum; each fan lagging on its own spring)
    P.legSwing = robotish ? Math.max(-1, Math.min(1, spring(S, 'leg', G.leg != null ? G.leg : -(Math.min(1, sp / 5) * 0.85 + S.accS * 0.03), 7, 0.35, dt))) : 0;
    { const sw = -S.turnK * 0.35 - S.latS * 0.012; P.wingSwayL = spring(S, 'swL', sw, 5, 0.3, dt); P.wingSwayR = spring(S, 'swR', sw, 4.2, 0.28, dt); }
    // the hips turn into the cut (M's hipYaw, clamped as the model does) and the sweep's arc widens on the big swings
    P.hipYaw = Math.max(-0.4, Math.min(0.4, k('hip', G.hip != null ? G.hip : (G.yaw * 0.45 + G.twist * 0.3)))); P.swordArc = Math.max(0.5, Math.min(1.6, k('arc', G.arc)));
    // (round 6) the free arm's aim for Death Ray: toward E's target on the ground (extra.x / extra.y), as body-frame yaw and pitch
    { let aimK = G.aim || 0, ay = 0, ap = 0.6; const Ex = S.eAct && S.eAct.extra; if (aimK > 0 && Ex && isFinite(Ex.x) && isFinite(Ex.y)) { const dx = Ex.x - d.x, dy = Ex.y - d.y, dist = Math.hypot(dx, dy); ay = wrap(Math.atan2(dy, dx) - (d.heading + (S.yawOff || 0))); ap = Math.atan2(3 + d.z, Math.max(0.5, dist)); S.rayAim = [ay, ap]; } else if (S.rayAim) { ay = S.rayAim[0]; ap = S.rayAim[1]; }
      P.aimL = cl(spring(S, 'aimL', aimK, 12, 0.6, dt)); P.aimLYaw = spring(S, 'aimLY', ay, 10, 0.7, dt); P.aimLPitch = spring(S, 'aimLP', ap, 10, 0.7, dt); }
    P.recoil = G.recoil; if (G.channel != null) P.channel = G.channel; else P.channel += (0.18 - (P.channel || 0)) * Math.min(1, dt * 4); if (G.glow != null) P.glow = G.glow; else P.glow += (0.5 - (P.glow || 0)) * Math.min(1, dt * 3); if (G.charge != null) P.charge = G.charge; else P.charge = (P.charge || 0) * Math.max(0, 1 - dt * 4);
  }
  /* the Jump: a deep crouch wind-up; in the air the legs tucked and trailing, the fans flung wide, the sword trailing
     behind, the torso pitched into the leap then rearing for the landing (the landing's crouch is a spring kick) */
  function jumpTargets(S, G) { const Jp = S.jump, J = TUNE.jump; if (Jp.t < Jp.c) { const u = Jp.t / Jp.c; G.crouch = 0.75 * sstep(0, 1, u); G.pitch = 0.15 * u; G.wing = 0.6; G.fold = 0.3; G.thrust = 0.4 + 0.5 * u; return; }
    const u = cl((Jp.t - Jp.c) / J.ph[1]); G.crouch = 0; G.leg = -1; G.wing = 1; G.fold = 0; G.thrust = 1 - 0.5 * sstep(0.3, 0.7, u) + 0.4 * sstep(0.85, 1, u);
    G.sword = 'sweep'; G.swordK = 0.7; G.swordU = 0.95; G.arc = 1.2; G.pitch = lerp(0.35, -0.25, sstep(0.2, 0.95, u)); G.lean = 0.3 * (1 - u); }
  /* Dive's targets: the roll (a full turn, eased, overshooting and settling on its spring), the swoop nose-down after a
     lift of anticipation, the pull-up overshooting nose-up, the thrust surging */
  function diveTargets(S, G) { const D = S.dive, t = D.t, d1 = D.t1, d2 = D.t2, d3 = D.t3;
    const ant = Math.sin(Math.PI * cl(t / (d1 * 0.6)));
    D.rollA = D.rollDir * TAU * inOut(cl(t / d1)) + (t > d1 ? D.rollDir * 0.35 * Math.sin(Math.PI * cl((t - d1) / 0.25)) * Math.exp(-(t - d1) * 4) : 0);
    G.pitch = t < d1 ? -0.3 * ant : t < d2 ? 0.75 * sstep(d1, d1 + 0.1, t) : t < d3 ? lerp(0.75, -0.5, sstep(d2, d3, t)) : -0.5 * (1 - sstep(d3, D.end, t)); G.thrust = t < d2 ? 0.7 + 0.3 * sstep(0, d1, t) : 1; G.wing = t < d2 ? lerp(1, 0.6, sstep(d1, d2, t)) : lerp(0.6, 1, sstep(d3, D.end, t)); G.bank = D.rollDir * 0.2 * Math.sin(Math.PI * cl((t - d2) / (D.end - d2))); }
  /* the fold's body: jolts at each lock (a dip and a pitch kick on the springs), the fans drawn in, then flung out */
  function xformTargets(S, G) { const st = xfStage(S.xt); G.wing = st.i < 5 ? 0.35 : lerp(0.35, 1, st.i === 5 ? outBack(st.u, 1.2) : 1); G.fold = st.i < 5 ? 0.4 : 0; G.thrust = st.i === 0 ? 0.4 + 0.5 * st.u : st.i === 7 ? 0.3 + 0.5 * st.u : st.i >= 8 ? 0.75 : 0.6; G.crouch = st.i === 0 ? 0.3 * Math.sin(Math.PI * st.u) : 0; G.roll = 0.02 * Math.sin(S.xt * 9);
    if (st.i !== S.xfKick) { S.xfKick = st.i; if (st.i >= 1) { kick(S, 'z', -1.6); kick(S, 'pitch', st.i % 2 ? 1.6 : -1.6); kick(S, 'roll', st.i % 2 ? 0.8 : -0.8); } } }

  /* ================= the air: the map's tiles, the open air round it, the walls (Nidhogg's) ================= */
  function airOf(X) { try { return X.air ? X.air() : null; } catch (e) { return null; } }
  function inMap(S, x, y) { const A = S.air; return !!A && x >= 0 && y >= 0 && x < A.w && y < A.h; }
  const tileOf = (S, x, y) => inMap(S, x, y) ? S.air.tile(Math.floor(x), Math.floor(y)) : -1;
  function wallNear(S, x, y, r) { for (let ty = Math.floor(y - r); ty <= Math.floor(y + r); ty++) for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) { if (!inMap(S, tx + 0.5, ty + 0.5) || S.air.tile(tx, ty) !== T_SOLID) continue; const cx = Math.max(tx, Math.min(x, tx + 1)), cy = Math.max(ty, Math.min(y, ty + 1)); if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true; } return false; }
  function groundAt(S, x, y) { const t = tileOf(S, x, y); return t >= 0 && T_WALK[t] === 1; }
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
  function safeReturn(S) {
    const d = S.V;
    let p = nearestLand(S, d.x, d.y, 2.5);
    if (!p && S.safe && safeOK(S, S.safe.x, S.safe.y)) p = { x: S.safe.x, y: S.safe.y };
    if (!p && S.safe) p = nearestLand(S, S.safe.x, S.safe.y, 6);
    if (!p) { const w = S.X.walkPoint(S.home.x, S.home.y, { r: 0.4, x: S.home.x, y: S.home.y }); p = { x: w.x, y: w.y }; }
    return sturdy(S, p);
  }

  /* ================= the session ================= */
  function startForm(C, H) {
    const me = H.me, g = H.g, X = H.X, M0 = MOD(), ev = evoOf(C), tier = tierOf(ev), K = C.K || 1, DK = C.base * K * (1 + 0.08 * (ev - 1));
    const kit = X.kit ? X.kit() : null, CD = (kit && kit.ult && kit.ult.key === 'ey_susanoo' && kit.ult.cd) || TUNE.cd;
    const T0 = X.Tz(), dpr = (typeof arc !== 'undefined' && arc.dpr) || 1, inst = M0.create({ T: T0 / Math.max(0.5, g.zoom || 1) * TUNE.zoomR * dpr * TUNE.size, dpr: 1 }), P = inst.pose; P.alpha = 0; P.form = 0; P.xf = 0;
    const tgt = X.nearestMon(me.x, me.y, 9), a0 = tgt ? Math.atan2(tgt.y - me.y, tgt.x - me.x) : (me.face < 0 ? Math.PI : 0);
    try { if (M0.warmPlan) { M0.warmPlan({ form: 'robot', heading: a0 }); M0.warmPlan({ form: 'xform', heading: a0 }); } } catch (e) { /* (model) */ }
    const V = { x: me.x, y: me.y, z: 0, heading: a0, vx: 0, vy: 0, pose: P, form: 0, locked: true, vis: 1 };
    const S = { H, g, me, X, C, ev, tier, DK, CD, V, inst, phase: 'summon', t: 0, charge: 0, used: false, busy: null, busyT: 0, cd: { blade: 0, spikes: 0, pulsar: 0, dodge: 0 }, mvQ: null, xfQ: null, dQ: null, glide: null, dive: null,
      leftR: TUNE.robotDur, leftA: 0, airGranted: false, menu: 'robot', menuSets: 0, xt: 0, mvOn: false, press: { ult: -9, strong: -9, strong2: -9 }, needFresh: { strong: false, strong2: false }, armT: -9,
      ha: a0, au: a0, hw: 0, turnK: 0, an: {}, yawOff: 0, zOff: 0, parts: [], free: [], marks: [], trail: [], ended: false, pet: X.pet ? X.pet() : null, air: airOf(X), home: { x: me.x, y: me.y }, safe: { x: me.x, y: me.y }, safeT: 0, reachT: 2, cam: null,
      stats: { glides: 0, glideHit: 0, dives: 0, diveHit: 0, diveBad: 0, blade: 0, spikes: 0, pulsar: 0, messiah: 0, dealt: 0, charged: 0, hits: 0, robotT: 0, airT: 0, xfT: 0, mvSet: 0, mvClear: 0, cdSet: 0, menuSets: 0, airGrants: 0 }, sfxT: 0, mx: 0, my: 0, spd: 4.3 };
    buildReach(S, me.x, me.y);
    g._susanoo = S;
    const ctx = S.ctx = { X, H, C, evo: ev, tier, DK, model: M0, poseObj: P, CLIPS,
      pose: (name, u, extra) => poseNamed(S, name, u, extra),   /* (E's named poses: see POSES) */ sfx: X.sfx || {}, messiah: false,
      get vehicle() { return S.V; }, get form() { return S.phase === 'air' || S.phase === 'messiah' ? 'air' : S.phase === 'xform' ? 'xform' : 'robot'; },
      hit: (m, dmg, o) => hitCharge(S, m, dmg, o),
      hitArea: (x, y, r, dmg, o) => { let n = 0; const once = o && o.once; for (const m of H.living()) { if (Math.hypot(m.x - x, m.y - y) >= r + (m.r || 0.4)) continue; if (once && seen(once, m)) continue; hitCharge(S, m, dmg, o); n++; } return n; },
      hitOval: (cx, cy, rx, ry, ang, dmg, o) => { let n = 0; const once = o && o.once, ca = Math.cos(ang), sa = Math.sin(ang); for (const m of H.living()) { const dx = m.x - cx, dy = m.y - cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca, pr = m.r || 0.4; if ((u * u) / ((rx + pr) ** 2) + (v * v) / ((ry + pr) ** 2) >= 1) continue; if (once && seen(once, m)) continue; hitCharge(S, m, dmg, o); n++; } return n; },
      mons: () => H.living(), target: () => target(S), aimPoint: () => aimPoint(S), aimDir: () => { const m = Math.hypot(S.mx, S.my); return m > 0.2 ? Math.atan2(S.my, S.mx) : S.V.heading; }, stick: () => ({ x: S.mx, y: S.my, mag: Math.min(1, Math.hypot(S.mx, S.my)) }),
      groundAt: (x, y) => groundAt(S, x, y), canStand: (x, y) => canStand(S, x, y), nearestLand: (x, y) => nearestLand(S, x, y, 8) || safeReturn(S),
      anchor: n => { const p = M0.anchor ? M0.anchor(n) : null; return p ? { x: p.x, y: p.y, z: p.z } : { x: S.V.x, y: S.V.y, z: S.V.z + 1.5 }; },
      scr: (x, y, z) => [H.sx(x), H.sy(y) - (z || 0) * ZK * X.Tz()], T: () => X.Tz(),
      camera: o => { if (!o) { S.cam = null; return; } if (o.shake && !calm()) X.shake(Math.min(10, o.shake), Math.min(0.5, o.dur || 0.25)); const c0 = S.cam || {}; S.cam = { zoom: o.zoom != null ? Math.max(0.5, Math.min(1.1, o.zoom)) : c0.zoom, x: o.x != null ? o.x : c0.x, y: o.y != null ? o.y : c0.y, k: o.k != null ? cl(o.k) : c0.k }; },
      clip: (name, u) => { const E = S.eAct || (S.eAct = {}); E.name = '_clip'; E.clip = name; E.u = cl(u); E.extra = null; E.t = S.g.t; },
      safeReturn: () => { const p = safeReturn(S); S.retPt = p; return { x: p.x, y: p.y }; },
      done: () => actionDone(S), alive: () => alive(S), calm, low: lowFx };
    S.veh = { get active() { return !S.released; }, drive: (mx, my, dt, spd) => { S.mx = mx; S.my = my; if (spd > 0) S.spd = spd; syncMe(S); void dt; },
      basic: A => trySwing(S, A),   /* (H: the basic-attack input; true when it swung, so 20b starts the attack cadence) */
      dodge: (mx, my) => tryDodge(S, mx, my), jump: (mx, my) => tryJump(S, mx, my), strong: slot => tryMove(S, slot), ult: () => tryUlt(S), drawBtns: (c, o) => drawBtns(S, c, o), onSwitch: () => finish(S, 'swap'), cam: () => camFocus(S) };
    X.vehicle(S.veh);
    const F = S.fx = H.add({ key: 'susanoo', life: 1e9, entY: me.y, update(dt) { step(S, dt); }, drawUnder(c) { drawUnder(S, c); }, drawEnt(c) { drawEnt(S, c); }, draw(c) { drawOver(S, c); }, onEnd() { if (!S.released) release(S); } });
    me.petAlt = F;
    const sfx = X.sfx || {}; if (sfx.note) { sfx.note(49, 1.4, 'sawtooth', 0.06, 70); sfx.note(98, 1.0, 'triangle', 0.04, 140, 0.25); }
    return S;
  }
  const seen = (once, m) => { const s = once.__seen || (once.__seen = new Set()); if (s.has(m)) return true; s.add(m); return false; };
  /* alive: the session runs and the action may go on (a committed Dark Messiah stays alive, even on a won floor, up to its cap) */
  function alive(S) { const me = S.me, g = S.g; if (S.ended || me.dead || g.over) return false; if (S.phase === 'messiah') return S.t < TUNE.messiahCap; return (S.phase === 'robot' || S.phase === 'air') && !g.won; }
  function camFocus(S) { const d = S.V, c = S.cam, zf = S.phase === 'air' || S.phase === 'messiah' ? TUNE.zoomA : S.phase === 'xform' ? lerp(TUNE.zoomR, TUNE.zoomA, sstep(0.2, 0.9, S.xt / XFT.total)) : S.phase === 'summon' ? lerp(1, TUNE.zoomR, sstep(0.3, 1.6, S.t)) : S.phase === 'out' || S.phase === 'gone' ? 1 : TUNE.zoomR;
    /* (v310: in the air the camera centres on the ship as it is drawn, its height lifted off the ground point, not on
       the ground under it, so the airship sits mid-screen instead of in the top half; its velocity / 6 leads the aim
       by exactly the lag of 20b's camera follow, dtReal * 6, so it stays centred at full speed too) */
    const air = S.phase === 'air' || S.phase === 'messiah' ? 1 : S.phase === 'xform' ? sstep(0, XFT.total, S.xt) : 0;
    if (air > 0 && !(c && c.x != null)) return { x: d.x + (d.vx || 0) / 6 * air, y: d.y + ((d.vy || 0) / 6 - (d.z || 0) * ZK - TUNE.camLift) * air, k: air, zoom: c && c.zoom ? c.zoom : zf };
    return { x: c && c.x != null ? c.x : d.x, y: c && c.y != null ? c.y : d.y, k: c && c.x != null ? (c.k != null ? c.k : 0.6) : 0, zoom: c && c.zoom ? c.zoom : zf }; }

  /* ---- targeting (Nidhogg's): an enemy near the stick's aim line, else the ground along it; no stick: the nearest ---- */
  function target(S) { const d = S.V, mag = Math.hypot(S.mx, S.my), M = S.H.living(), D = TUNE.dive;
    if (mag > 0.2) { const a = Math.atan2(S.my, S.mx); for (const [cone, reach] of [[D.cone, D.reach + 2], [D.cone2, D.reach2]]) { let best = null, bs = 1e9; for (const m of M) { const dx = m.x - d.x, dy = m.y - d.y, dist = Math.hypot(dx, dy); if (dist > reach) continue; const off = Math.abs(wrap(Math.atan2(dy, dx) - a)); if (off > cone + (dist < 2 ? 0.8 : 0)) continue; const s = dist + off * 6; if (s < bs) { bs = s; best = m; } } if (best) return { x: best.x, y: best.y, m: best }; } }
    else { let best = null, bd = 11; for (const m of M) { const dist = Math.hypot(m.x - d.x, m.y - d.y); if (dist < bd) { bd = dist; best = m; } } if (best) return { x: best.x, y: best.y, m: best }; }
    const p = aimPoint(S); if (p) return { x: p.x, y: p.y, m: null };
    // (no enemy on the aim line and no ground along it: the nearest enemy in reach, rather than nothing)
    { let best = null, bd = D.reach + 1; for (const m of M) { const dist = Math.hypot(m.x - d.x, m.y - d.y); if (dist < bd) { bd = dist; best = m; } } if (best) return { x: best.x, y: best.y, m: best }; }
    return { x: d.x + Math.cos(d.heading) * 4, y: d.y + Math.sin(d.heading) * 4, m: null }; }
  function aimPoint(S) { const d = S.V, mag = Math.hypot(S.mx, S.my);
    if (mag > 0.2) { const a = Math.atan2(S.my, S.mx), ca = Math.cos(a), sa = Math.sin(a); const p0 = { x: d.x + ca * 4.5, y: d.y + sa * 4.5 }; if (groundAt(S, p0.x, p0.y)) return p0;
      for (let s = 2; s <= TUNE.dive.reach; s += 0.35) { const x = d.x + ca * s, y = d.y + sa * s; if (groundAt(S, x, y)) return { x, y }; } return null; }
    const T = (() => { let best = null, bd = 9; for (const m of S.H.living()) { const dist = Math.hypot(m.x - d.x, m.y - d.y); if (dist < bd) { bd = dist; best = m; } } return best; })(); if (T) return { x: T.x, y: T.y };
    const ca = Math.cos(d.heading), sa = Math.sin(d.heading); for (const s of [3, 2, 4, 1, 0]) { const x = d.x + ca * s, y = d.y + sa * s; if (groundAt(S, x, y)) return { x, y }; } return null; }

  /* ---- damage and the shared meter: each event once, after mitigation, without overkill ---- */
  function hitCharge(S, m, dmg, o) {
    if (!m || m.dead || m.falling || !(dmg > 0) || S.ended) return 0;
    const before = Math.max(0, m.hp), oo = Object.assign({ el: 'dark', src: 'ult' }, o || {}); delete oo.noCharge; delete oo.once;
    const r = S.X.hitMon(m, dmg, oo), dealt = Math.max(0, Math.min(r || 0, before));
    if (!(dealt > 0)) return 0;
    S.stats.dealt += dealt; S.stats.hits++;
    if (!(o && o.noCharge) && (S.phase === 'robot' || S.phase === 'air' || S.phase === 'xform') && !S.used) { const c0 = S.charge; S.charge = Math.min(1, S.charge + dealt / (TUNE.chargeK * S.DK)); S.stats.charged += S.charge - c0;
      if (c0 < 1 && S.charge >= 1) { const sfx = S.X.sfx || {}; if (sfx.note) [147, 220, 294, 440].forEach((f, i) => sfx.note(f, 0.5, 'sawtooth', 0.04, f * 1.01, i * 0.08)); S.X.text(S.V.x, S.V.y - 3, S.phase === 'air' ? 'DARK MESSIAH READY' : 'MESSIAH CHARGED', VIO2, 15, { life: 1.4, max: 1.4, vy: -0.5 }); } }
    return dealt;
  }

  /* ---- the heading (as Nidhogg's): continuous, an eased turn rate ---- */
  function setHeading(S, a, dt) { const da = wrap(a - S.ha); S.ha = wrap(a); S.au += da; S.hw = dt > 0 ? da / dt : 0; }
  function steer(S, dt, want, mag) { const T = TUNE.turn; let wT = 0;
    if (want != null) { const off = wrap(want - S.ha); wT = Math.max(-1, Math.min(1, off * T.k / T.max)) * T.max * (0.6 + 0.4 * Math.min(1, mag)); }
    const lim = T.acc * dt, w = S.hw + Math.max(-lim, Math.min(lim, wT - S.hw)); S.hw = w; S.ha = wrap(S.ha + w * dt); S.au += w * dt;
    const k = Math.max(-1.2, Math.min(1.2, S.hw / 4)); S.turnK += (k - S.turnK) * Math.min(1, dt * 7); }
  function syncMe(S) { const me = S.me, d = S.V; me.x = d.x; me.y = d.y; me.vx = d.vx; me.vy = d.vy; me.z = 0; me.airborne = S.phase === 'air' || S.phase === 'messiah' || S.phase === 'xform'; const c = Math.cos(d.heading); if (Math.abs(c) > 0.25) me.face = c > 0 ? 1 : -1; }

  /* ================= ROBOT: the ground glide ================= */
  function moveRobot(S, dt, steerOK) {
    const d = S.V, me = S.me, mag = steerOK ? Math.min(1, Math.hypot(S.mx, S.my)) : 0, sp = S.spd;   /* (S.spd: 20b's stat speed, already x1.35 by the session's modifier) */
    const tvx = mag > 0.15 ? S.mx / Math.max(1, Math.hypot(S.mx, S.my)) * sp : 0, tvy = mag > 0.15 ? S.my / Math.max(1, Math.hypot(S.mx, S.my)) * sp : 0, k = Math.min(1, dt * TUNE.robotAcc);
    d.vx += (tvx - d.vx) * k; d.vy += (tvy - d.vy) * k;
    me.x = d.x; me.y = d.y; S.X.moveEnt(me, d.vx * dt, d.vy * dt, 0);   // (the pet's own collision: walls, gaps, the map's edge, bosses)
    if (Math.abs(me.x - d.x - d.vx * dt) > 1e-3) d.vx *= 0.4; if (Math.abs(me.y - d.y - d.vy * dt) > 1e-3) d.vy *= 0.4;
    d.x = me.x; d.y = me.y;
    if (steerOK) steer(S, dt, mag > 0.15 ? Math.atan2(S.my, S.mx) : null, mag); else steer(S, dt, null, 0);
    return mag;
  }
  /* the robot's hover (its body language is animate()'s) */
  function robotBody(S, dt) { const d = S.V; d.z += (TUNE.hover - d.z) * Math.min(1, dt * 5); }

  /* ---- Glides (Dodge, robot): a spinning sword sweep along the stick; one hit per enemy per activation ---- */
  function tryDodge(S, mx, my) { if (S.phase === 'robot') tryGlide(S, mx, my); else if (S.phase === 'air') tryDive(S, mx, my); }
  function dodgeCd(S) { const g = S.g; return TUNE.dodgeCd * (g.buff && g.buff.arcane > 0 ? 0.6 : 1) * (g.dodgeK || 1); }
  function glideDir(S, mx, my) { const d = S.V, mag = Math.hypot(mx, my); if (mag > 0.2) return Math.atan2(my, mx); const t = S.X.nearestMon(d.x, d.y, 6); return t ? Math.atan2(t.y - d.y, t.x - d.x) : d.heading; }
  /* a press: start stage 1, chain the next stage (in the window), or keep it for the act's end; no cooldown */
  function tryGlide(S, mx, my, queued) {
    const d = S.V; S.mx = mx; S.my = my; const Gl = S.glide, CB = TUNE.combo;
    if (S.busy || d.locked || S.jump || S.swing) { if (!queued) S.dQ = S.g.t; return; }
    if (Gl) { const St = CB.st[Gl.n - 1]; if (Gl.t < St.prep + St.act || Gl.n >= 4) { Gl.next = true; return; }   // (mid-stage: kept; after the finisher's act the next press waits for it to end, then starts a new combo)
      startStage(S, Gl.n + 1); return; }   // (in the recovery: the next stage at once)
    const chain = S.comboN && S.comboN < 4 && S.g.t - S.comboT <= CB.win ? S.comboN + 1 : 1;   // (just after a stage: the window is still open)
    startStage(S, chain);
  }
  function startStage(S, n) {
    const d = S.V, CB = TUNE.combo, St = CB.st[n - 1], a = glideDir(S, S.mx, S.my), dir = n === 2 ? -1 : n === 1 ? 1 : wrap(a - S.ha) >= 0 ? 1 : -1, g = S.g;
    S.dQ = null; S.glide = { n, t: 0, end: St.prep + St.act + St.rec, a, dir, from: S.ha, hits: new Set(), x0: d.x, y0: d.y, z0: d.z, next: false, struck: false };
    S.comboN = n; S.comboT = g.t;
    if (g.t - (S.gInvT == null ? -9 : S.gInvT) >= CB.invLock) { S.me.inv = Math.max(S.me.inv || 0, CB.inv); S.gInvT = g.t; }   // (the game's dodge protection, at most every invLock s: mashing is no shield)
    S.stats.glides++; S.stats['glide' + n] = (S.stats['glide' + n] || 0) + 1; g.movedOnce = true; g.dodges = (g.dodges || 0) + 1;
    const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) sfx.note(160 + n * 40, 0.3, 'sawtooth', 0.04, 520 + n * 80, 0.04);
  }
  function stepGlide(S, dt) {
    const Gl = S.glide, St = TUNE.combo.st[Gl.n - 1], d = S.V, me = S.me; Gl.t += dt; const t = Gl.t, t1 = St.prep, t2 = St.prep + St.act;
    Gl.u = Gl.t / Gl.end;   // (animate() plays the stage's clip from this)
    const mag = Math.hypot(S.mx, S.my); if (mag > 0.2 && t < t2) { const off = wrap(Math.atan2(S.my, S.mx) - Gl.a); Gl.a = wrap(Gl.a + Math.max(-TUNE.glide.steer * dt, Math.min(TUNE.glide.steer * dt, off))); }   // (bounded steering)
    const v = t < t1 ? 0 : t < t2 ? St.dist / St.act * (1.4 - 0.8 * (t - t1) / St.act) : 0;
    d.vx = Math.cos(Gl.a) * v; d.vy = Math.sin(Gl.a) * v; me.x = d.x; me.y = d.y; S.X.moveEnt(me, d.vx * dt, d.vy * dt, 0); d.x = me.x; d.y = me.y;   // (the pet's own collision: walls, gaps)
    // the heading: a cut faces its travel; stage 3 turns a full circle through its act; the finisher faces its leap
    if (St.spin) { const u = cl((t - t1) / St.act), e = easeIO(u); setHeading(S, t < t1 ? Gl.from + wrap(Gl.a - Gl.from) * sstep(0, t1, t) * 0.3 : t < t2 ? Gl.a + Gl.dir * TAU * (e - 1) : Gl.a, dt); }
    else setHeading(S, S.ha + wrap(Gl.a - S.ha) * Math.min(1, dt * 18), dt);
    // the finisher's leap
    if (St.h) d.z = TUNE.hover + (t >= t1 && t < t2 ? 4 * St.h * ((t - t1) / St.act) * (1 - (t - t1) / St.act) : 0);
    // the hits: the cut's frontal arc (or all round), once per enemy per stage; the finisher strikes at the slam
    if (!St.wave && t >= t1 && t <= t2 + 0.02) { for (const m of S.H.living()) { if (Gl.hits.has(m)) continue; const dx = m.x - d.x, dy = m.y - d.y, dist = Math.hypot(dx, dy), pr = m.r || 0.4; if (dist > St.reach + pr) continue;
        if (St.arc && dist > 0.3 && Math.abs(wrap(Math.atan2(dy, dx) - S.ha)) > St.arc / 2 + Math.asin(Math.min(1, pr / Math.max(dist, pr)))) continue;
        Gl.hits.add(m); if (hitCharge(S, m, S.DK * St.dmg, { kb: St.kb, src: 'ult' }) > 0) { S.stats.glideHit++; sparks(S, m.x, m.y, 1); } } }
    if (St.wave && !Gl.struck && t >= t2) { Gl.struck = true; finisherSlam(S, St); }
    // the crescent trail along the sword's edge, a ground wake
    if (t >= t1 * 0.6 && t <= t2 + 0.1) pushTrail(S); if (t >= t1 && t < t2 && Math.random() < dt * (lowFx() ? 25 : 60)) { const a = Math.random() * TAU; addPart(S, 2, d.x + Math.cos(a) * 0.6, d.y + Math.sin(a) * 0.4, 0.05, -d.vx * 0.2, -d.vy * 0.2, 0.2, 0.5, 0.35, { grow: 1.2, drag: 2, col: '#2A1A3A' }); }
    // a kept press chains the next stage as soon as this one's act is done (no snap back to idle)
    if (Gl.next && t >= t2 && Gl.n < 4) { startStage(S, Gl.n + 1); return; }
    if (t >= Gl.end) { const n = Gl.n, nx = Gl.next; S.glide = null; S.comboT = S.g.t; if (n >= 4) S.comboN = 0; kick(S, 'bank', Gl.dir * 1.5);
      if (nx && n >= 4) startStage(S, 1); }   // (a press during the finisher starts a new combo once it ends)
  }
  /* the finisher's slam: the sword's hit in reach, then the dark shockwave beyond (one hit per enemy), a brief hit-stop */
  function finisherSlam(S, St) {
    const d = S.V, X = S.X, Gl = S.glide; let n = 0;
    for (const m of S.H.living()) { if (Gl.hits.has(m)) continue; const dist = Math.hypot(m.x - d.x, m.y - d.y), pr = m.r || 0.4; const inBlade = dist <= St.reach + pr, inWave = dist <= St.waveR + pr * 0.85; if (!inBlade && !inWave) continue;
      Gl.hits.add(m); if (hitCharge(S, m, S.DK * (inBlade ? St.dmg : St.wave), { kb: St.kb, src: 'ult' }) > 0) { S.stats.glideHit++; S.stats.finisherHit = (S.stats.finisherHit || 0) + 1; sparks(S, m.x, m.y, 1.4); n++; } }
    addPart(S, 9, d.x, d.y, 0, 0, 0, 0, 0.6, St.waveR * 1.05, {}); addPart(S, 9, d.x, d.y, 0, 0, 0, 0, 0.9, St.waveR * 0.6, {});
    for (let i = 0; i < (lowFx() ? 10 : 26); i++) { const a = Math.random() * TAU, v = 3 + Math.random() * 4.5; addPart(S, i % 3 ? 2 : 1, d.x + Math.cos(a) * 0.6, d.y + Math.sin(a) * 0.45, 0.15, Math.cos(a) * v, Math.sin(a) * v * GY, i % 3 ? 0.4 : 2 + Math.random() * 2, 0.55 + Math.random() * 0.4, i % 3 ? 0.5 : 0.13, { grow: 1.5, drag: 2.4, col: i % 3 ? '#24162E' : (i % 2 ? VIO : VIO2), g: i % 3 ? 0 : 5 }); }
    X.light(d.x, d.y, 3.6, 0.25); kick(S, 'crouch', 8); kick(S, 'z', -4); kick(S, 'pitch', 4); kick(S, 'wing', -4);
    if (!calm()) { X.shake(n ? 7 : 5, 0.2); if (X.hitstop) X.hitstop(St.stop); }
    const sfx = X.sfx || {}; if (sfx.crash) sfx.crash(); if (sfx.stomp) sfx.stomp(); if (sfx.note) sfx.note(46, 0.5, 'sawtooth', 0.09, 32);
  }
  /* ---- (H) the basic sword swing (robot only): M's one-hand sweep hold, a frontal arc, one hit per enemy per swing ---- */
  function trySwing(S, A) {
    const d = S.V; if (S.phase !== 'robot' || S.swing || S.glide || S.busy || S.jump || d.locked || S.released) return false;   // (the airship, the fold, an attack or Glides: no swing)
    const t = A && A.t && !A.t.dead ? A.t : null, a = t ? Math.atan2(t.y - d.y, t.x - d.x) : A && isFinite(A.a) ? A.a : d.heading;
    S.swingSide = -(S.swingSide || -1); S.swing = { t: 0, a, hits: new Set(), side: S.swingSide, u: 0 };   /* (round 2: cuts alternate right and left) */ S.stats.swings = (S.stats.swings || 0) + 1;
    const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) sfx.note(240, 0.18, 'sawtooth', 0.025, 520);
    return true;
  }
  function stepSwing(S, dt) {
    const Sw = S.swing, W = TUNE.swing, d = S.V, P = d.pose; if (S.glide || S.busy || S.phase !== 'robot') { S.swing = null; return; }
    Sw.t += dt; const u = cl(Sw.t / W.dur);
    Sw.u = u;   // (animate() plays the basic cut from this: wind-up, the cut, the follow-through)
    setHeading(S, S.ha + wrap(Sw.a - S.ha) * Math.min(1, dt * 16), dt);   // (it turns into the cut; the travel stays the stick's)
    if (u >= W.hit0 && u <= W.hit1) { pushTrail(S);   // (the light crescent along the sword's edge: Glides' trail)
      for (const m of S.H.living()) { if (Sw.hits.has(m)) continue; const dx = m.x - d.x, dy = m.y - d.y, dist = Math.hypot(dx, dy), pr = m.r || 0.4; if (dist > W.reach + pr) continue;
        if (dist > 0.3 && Math.abs(wrap(Math.atan2(dy, dx) - Sw.a)) > W.arc / 2 + Math.asin(Math.min(1, pr / Math.max(dist, pr)))) continue;
        Sw.hits.add(m); if (S.ctx.hit(m, S.DK * W.dmg, { kb: W.kb, src: 'normal' }) > 0) { S.stats.swingHit = (S.stats.swingHit || 0) + 1; sparks(S, m.x, m.y, 1); } } }
    if (u >= 1) { S.swing = null; }
  }
  function pushTrail(S) { const M0 = MOD(); const tip = M0.anchor ? M0.anchor('swordTip') : null, hilt = M0.anchor ? (M0.anchor('swordChannel') || M0.anchor('hilt')) : null; if (!tip || !hilt) return; const L = S.trail; const q = L.length >= 14 ? L.pop() : {}; q.a = [tip.x, tip.y, tip.z]; q.b = [hilt.x, hilt.y, hilt.z]; q.t = S.g.t; L.unshift(q); }

  /* ---- Jump (robot only; its own button above Glides, and J; no cooldown, as Beast Machine's): a crouch, a planned
     arc boosted by the thrusters, one landing shockwave. Never in mid-air: a press in the air is kept and goes the moment
     it touches down; a press during an attack is kept TUNE.jump.buf s. The landing is planned on safe ground (walkable,
     the pet could walk there: the flow field), walls stop the arc, a gap is never landed in. ---- */
  const JOFF = [0, 0.2, -0.2, 0.4, -0.4, 0.6, -0.6];
  function landOK(S, x, y) { const X = S.X; return canStand(S, x, y) && (!X.flowAt || X.flowAt(x, y) < 9999); }
  function planJump(S, dir, d0) {
    const d = S.V, J = TUNE.jump, X = S.X, C = [];
    for (const off of JOFF) { const a = wrap(dir + off), ca = Math.cos(a), sa = Math.sin(a); let lim = d0 + J.ext;
      for (let st = 0.4; st <= lim + 0.21; st += 0.2) if (X.blocked(d.x + ca * st, d.y + sa * st, 0.4, 1)) { lim = st - 0.45; break; }   // (walls and the map's edge stop it in the air)
      for (let st = 0; st <= lim + 1e-6; st += 0.25) C.push([(st >= d0 - 1e-6 ? st - d0 : 5 + (d0 - st) * 1.2) + Math.abs(off) * 3, st, a]); }
    C.sort((p, q) => p[0] - q[0]);
    for (const [, st, a] of C) { const x = d.x + Math.cos(a) * st, y = d.y + Math.sin(a) * st; if (!landOK(S, x, y)) continue; return { x, y, a, d: st, d0 }; }
    return { x: d.x, y: d.y, a: d.heading, d: 0, d0, none: true };
  }
  function tryJump(S, mx, my, queued) {
    const d = S.V, g = S.g, J = TUNE.jump; if (mx != null) { S.mx = mx; S.my = my; }
    if (S.phase !== 'robot' || S.released) return;   // (the airship has no Jump)
    if (S.jump) { if (!queued) S.jumpLand = true; return; }   // (in the air: kept for the touchdown, never a jump in mid-air)
    if (S.busy || S.glide || S.swing || d.locked) { if (!queued) S.jumpQ = g.t; return; }
    S.jumpQ = null; S.jumpLand = false;
    const mag = Math.hypot(S.mx, S.my), dir = mag > 0.2 ? Math.atan2(S.my, S.mx) : S.ha, v0 = Math.max(0, d.vx * Math.cos(dir) + d.vy * Math.sin(dir)), plan = planJump(S, dir, mag > 0.2 ? Math.min(J.max, J.d + v0 * 0.35) : 0);
    S.lastPlan = plan;
    S.jump = { t: 0, c: J.ph[0], F: J.ph[0] + J.ph[1], x0: d.x, y0: d.y, z0: d.z, a0: S.ha, x1: plan.x, y1: plan.y, a1: plan.d > 0.05 ? plan.a : S.ha, plan, air: false };
    if (g.t - (S.invT == null ? -9 : S.invT) >= J.invLock) { S.me.inv = Math.max(S.me.inv || 0, J.inv); S.invT = g.t; }   // (the take-off's short protection, at most once per invLock s)
    S.stats.jump = (S.stats.jump || 0) + 1; g.movedOnce = true;
    const sfx = S.X.sfx || {}; if (sfx.note) { sfx.note(62, 0.2, 'triangle', 0.08, 48); sfx.note(196, 0.1, 'square', 0.02, 160, 0.03); } if (sfx.hiss) sfx.hiss(0.14, 0.05, 700);
  }
  function stepJump(S, dt) {
    const Jp = S.jump, d = S.V, J = TUNE.jump, me = S.me; Jp.t += dt;
    if (Jp.t < Jp.c) { d.vx *= 0.8; d.vy *= 0.8; me.x = d.x; me.y = d.y; return; }   // (the crouch: animate() plays it)
    if (!Jp.air) { Jp.air = true; me.airborne = true; const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) sfx.note(90, 0.35, 'sawtooth', 0.04, 300);
      for (let i = 0; i < (lowFx() ? 6 : 14); i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 2.5; addPart(S, 2, d.x + Math.cos(a) * 0.6, d.y + Math.sin(a) * 0.45, 0.05, Math.cos(a) * v, Math.sin(a) * v * GY, 0.3, 0.6 + Math.random() * 0.3, 0.4, { grow: 1.4, drag: 2.5, col: '#2A1A3A' }); }
      addPart(S, 9, d.x, d.y, 0, 0, 0, 0, 0.35, 1.3, {}); }
    const u = cl((Jp.t - Jp.c) / J.ph[1]);
    d.x = lerp(Jp.x0, Jp.x1, u); d.y = lerp(Jp.y0, Jp.y1, u); d.vx = (Jp.x1 - Jp.x0) / J.ph[1]; d.vy = (Jp.y1 - Jp.y0) / J.ph[1]; me.x = d.x; me.y = d.y;
    setHeading(S, Jp.a0 + wrap(Jp.a1 - Jp.a0) * sstep(0, 0.35, u), dt);
    d.z = TUNE.hover + 4 * J.h * u * (1 - u);
    if (u >= 1) landJump(S);
  }
  function landJump(S) {
    const Jp = S.jump; if (!Jp) return; S.jump = null;
    const d = S.V, me = S.me, J = TUNE.jump; let x = Jp.x1, y = Jp.y1;
    if (!landOK(S, x, y)) { if (landOK(S, Jp.x0, Jp.y0)) { x = Jp.x0; y = Jp.y0; } else { const p = nearestLand(S, x, y, 4) || safeReturn(S); x = p.x; y = p.y; } }   // (the ground changed under the plan: back where it left, else the nearest safe ground)
    S.lastLand = { x, y }; d.x = x; d.y = y; d.z = TUNE.hover; d.vx = d.vy = 0; me.x = x; me.y = y; me.airborne = false; S.landT = S.g.t;
    // one dark shockwave hit per monster in reach (it charges the meter)
    let n = 0; for (const m of S.H.living()) { if (Math.hypot(m.x - x, m.y - y) > J.r + (m.r || 0.4) * 0.85) continue; const dealt = hitCharge(S, m, S.DK * J.dmg, { kb: J.kb }); S.stats.jumpHit = (S.stats.jumpHit || 0) + 1; if (dealt > 0) sparks(S, m.x, m.y, 1); n++; }
    addPart(S, 9, x, y, 0, 0, 0, 0, 0.55, J.r * 1.05, {}); addPart(S, 9, x, y, 0, 0, 0, 0, 0.8, J.r * 0.6, {});
    for (let i = 0; i < (lowFx() ? 8 : 20); i++) { const a = Math.random() * TAU, v = 2.5 + Math.random() * 4; addPart(S, i % 3 ? 2 : 1, x + Math.cos(a) * 0.5, y + Math.sin(a) * 0.4, 0.15, Math.cos(a) * v, Math.sin(a) * v * GY, i % 3 ? 0.4 : 2 + Math.random() * 2, 0.5 + Math.random() * 0.4, i % 3 ? 0.45 : 0.12, { grow: 1.5, drag: 2.5, col: i % 3 ? '#24162E' : (i % 2 ? VIO : VIO2), g: i % 3 ? 0 : 5 }); }
    S.X.light(x, y, 3, 0.2); kick(S, 'crouch', 7); kick(S, 'z', -4); kick(S, 'pitch', 3); kick(S, 'wing', -4);   // (a heavy landing: the springs carry the crouch back up to the stance)
    if (!calm()) S.X.shake(n ? 5 : 3.5, 0.15); const sfx = S.X.sfx || {}; if (sfx.stomp) sfx.stomp(); if (sfx.note) sfx.note(50, 0.4, 'sawtooth', 0.08, 36);
    if (S.jumpLand) { S.jumpLand = false; S.jumpQ = S.g.t; }   // (pressed in the air: it goes again now)
  }

  /* ---- the Strongs and the Ult ---- */
  function fresh(S, key) { const t = S.g.t, p = S.press[key]; S.press[key] = t; return t - p >= TUNE.freshGap; }
  function tryMove(S, slot, queued) {
    const d = S.V, sfx = S.X.sfx || {}, air = S.phase === 'air';
    const key = slot === 'strong2' ? 'strong2' : 'strong', isFresh = queued ? true : fresh(S, key);
    if (S.phase !== 'robot' && S.phase !== 'air') return;
    if (air && slot === 'strong2') return;   // (the airship has one Strong: the second slot's binding does nothing)
    if (!queued && S.needFresh[key]) { if (!isFresh) return; S.needFresh[key] = false; }   // (a key held through the Transform never casts in the airship: a release and a fresh press first)
    const k = air ? 'pulsar' : slot === 'strong2' ? 'spikes' : 'blade', cd = S.cd[k];
    if (S.busy || S.glide || S.dive || S.jump || d.locked) { if (!queued && S.busy !== 'messiah') S.mvQ = { slot, t: S.g.t }; return; }
    if (cd > 0) { if (!queued && cd <= 0.4) S.mvQ = { slot, t: S.g.t }; return; }
    S.mvQ = null;
    const MV = moves(), fn = MV[k === 'blade' ? 'darkBlade' : k === 'spikes' ? 'darkSpikes' : 'pulsar']; if (typeof fn !== 'function') return;
    S.busy = k; S.busyT = 0; S.cd[k] = k === 'blade' ? TUNE.cdBlade : k === 'spikes' ? TUNE.cdSpikes : TUNE.cdPulsar; S.stats[k]++;
    try { fn.call(MV.SM || MV, S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Susano O: a move failed', e); actionDone(S); }
    void sfx;
  }
  function tryUlt(S) {
    const X = S.X, sfx = X.sfx || {}, isFresh = fresh(S, 'ult');
    if (S.phase === 'robot') { // Transform (no meter needed); during an attack it waits for the recovery
      if (!isFresh || S.xfQ != null) return;   /* (the Ult held from the cast never transforms on its own) */ if (S.busy || S.glide || S.jump) { S.xfQ = S.g.t; return; } commitXform(S); return; }
    if (S.phase !== 'air') return;   // (summoning, folding, committed: ignored)
    if (!isFresh || S.g.t - S.armT < TUNE.freshGap) return;   // (a held / repeated press from the Transform never fires the finisher)
    if (S.used || S.charge < 1) { if (sfx.wrong) sfx.wrong(); X.text(S.V.x, S.V.y - 2.6, S.used ? 'Dark Messiah used' : `Dark Messiah ${Math.floor(S.charge * 100)}%`, VIO2, 12, { life: 0.9, max: 0.9, vy: -0.6 }); return; }
    if (S.busy || S.dive) { S.ultQ = S.g.t; return; }   // (it waits for a Dive's recovery or the Pulsar's end)
    startMessiah(S);
  }
  function startMessiah(S) {
    S.used = true; S.charge = 0; S.phase = 'messiah'; S.t = 0; S.busy = 'messiah'; S.busyT = 0; S.ultQ = null; S.mvQ = null; S.dQ = null;
    const d = S.V; d.locked = true; d.vx *= 0.3; d.vy *= 0.3; S.ctx.messiah = true; S.stats.messiah++;
    const MV = moves();
    try { MV.messiah.call(MV.SM || MV, S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Susano O: Dark Messiah failed', e); startOut(S, 'messiah'); }
  }
  function actionDone(S) {
    if (!S.busy) return;
    const kind = S.busy; S.busy = null;
    if (kind === 'messiah') { S.ctx.messiah = false; S.cam = null; startOut(S, 'messiah'); return; }
  }

  /* ================= TRANSFORM: the timed stages; the handover once ================= */
  function commitXform(S) {
    if (S.phase !== 'robot' || S.released) return;
    try { const M0 = MOD(); if (M0.warmPlan) { M0.warmPlan({ form: 'xform', heading: S.ha }); M0.warmPlan({ form: 'airship', heading: S.ha }); } } catch (e) { /* (model) */ }
    S.phase = 'xform'; S.xt = 0; S.xfQ = null; S.mvQ = null; S.dQ = null; S.glide = null; S.swing = null; S.V.locked = true; S.stats.xfT = 0; S.xfFrom = { z: S.V.z };
    const sfx = S.X.sfx || {}; if (sfx.note) { sfx.note(70, 0.5, 'square', 0.04, 55); sfx.note(140, 0.25, 'triangle', 0.03, 120, 0.12); }
  }
  /* the stage at time t, with its own progress */
  function xfStage(t) { for (let i = 0; i < XFT.L.length; i++) { const s = XFT.L[i]; if (t < s.t1) return { i, n: s.n, u: cl((t - s.t0) / (s.t1 - s.t0)) }; } return { i: XFT.L.length - 1, n: XFT.L[XFT.L.length - 1].n, u: 1 }; }
  const XF_SNAP = { dock: 1, thrusters: 1, latch: 1 }, XF_ROT = { pitch: 1, stow: 1, wings: 1, booms: 1 };
  function stepXform(S, dt) {
    const d = S.V, P = d.pose, M0 = MOD(); S.xt += dt; S.stats.xfT = S.xt;
    const st = xfStage(S.xt);   /* (xf runs linearly through the timed stages; M's XF_STAGES are ranges of xf, so its stages keep their order and overlaps) */
    // xf: 0..1 through the ordered stages, each stage's share as the model names them (its boundaries, else equal)
    const B = Array.isArray(M0.XF_BOUNDS) ? M0.XF_BOUNDS : null; const eu = XF_SNAP[st.n] ? outBack(st.u, 1.3) : XF_ROT[st.n] ? inOut(st.u) : outQ(st.u);   /* (round 2: snappy where a lock closes, smooth where a part turns) */ P.xf = B ? lerp(B[st.i], B[st.i + 1], eu) : (st.i + eu) / XFT.L.length; P.stage = st.n; P.stageU = st.u;
    P.form = st.n === 'establish' && st.u >= 1 ? 1 : 0;
    // the lift: up off the ground in the first stage, on to the cruise height through the fold; the heading held
    d.z = lerp(S.xfFrom.z, TUNE.cruise, sstep(0, XFT.L[3].t1, S.xt)); d.vx *= 0.85; d.vy *= 0.85; setHeading(S, S.ha, dt);
    // the clunks: each stage's lock
    if (st.i !== S.xfLast) { S.xfLast = st.i; const sfx = S.X.sfx || {}; if (sfx.note) sfx.note(60 + st.i * 8, 0.22, 'square', 0.035, 45, 0.02); if (st.i >= 1 && sfx.stomp) sfx.stomp(); if (!calm() && st.i >= 1) S.X.shake(1.4, 0.06); }
    if (S.xt >= XFT.total) handover(S);
  }
  function handover(S) {
    if (S.phase !== 'xform' || S.airGranted) return;   // (once: a repeated callback never grants time again)
    S.airGranted = true; S.stats.airGrants++; S.phase = 'air'; S.leftA = TUNE.airDur; S.endA = S.g.t + TUNE.airDur; S.t = 0; S.menu = 'air'; S.menuSets++; S.stats.menuSets = S.menuSets;
    const d = S.V; d.locked = false; d.form = 1; d.pose.form = 1; d.pose.xf = 1; S.armT = S.g.t;   // (the fresh-press gate counts from here)
    S.mvQ = null; S.dQ = null; S.xfQ = null; S.ultQ = null; S.needFresh.strong = S.needFresh.strong2 = true;   // (stale robot commands dropped; a held Strong needs a release first)
    const sfx = S.X.sfx || {}; if (sfx.note) { sfx.note(220, 0.3, 'triangle', 0.04, 330); sfx.note(440, 0.25, 'sine', 0.03, 660, 0.1); }
  }

  /* ================= AIRSHIP: free flight (Nidhogg's) ================= */
  function fly(S, dt, steerOK, holdHeading) {
    const d = S.V, A = S.air, mag = steerOK ? Math.min(1, Math.hypot(S.mx, S.my)) : 0, top = S.spd * TUNE.airK;
    const want = mag > 0.15 ? Math.atan2(S.my, S.mx) : d.heading, tvx = mag > 0.15 ? Math.cos(want) * top * mag : 0, tvy = mag > 0.15 ? Math.sin(want) * top * mag : 0, k = Math.min(1, (mag > 0.15 ? TUNE.accel / top : TUNE.brake / top) * dt * 2.2);
    d.vx += (tvx - d.vx) * k; d.vy += (tvy - d.vy) * k;
    let zT = TUNE.cruise; const sp = Math.hypot(d.vx, d.vy), ux = sp > 0.1 ? d.vx / sp : Math.cos(d.heading), uy = sp > 0.1 ? d.vy / sp : Math.sin(d.heading), look = 0.6 + sp * 0.25;
    const tall = !A || A.hand;
    if (!tall && (wallNear(S, d.x, d.y, 0.8) || wallNear(S, d.x + ux * look, d.y + uy * look, 0.8))) zT = Math.max(zT, TUNE.wallZ);
    { const dz = zT - d.z, vmax = dz > 0 ? TUNE.climbV : TUNE.sinkV; d.z += Math.sign(dz) * Math.min(Math.abs(dz), vmax * dt * Math.min(1, Math.abs(dz) * 1.6 + 0.15)); }
    const blockAt = (x, y) => (tall || d.z < TUNE.wallZ - 0.35) && wallNear(S, x, y, 0.6);
    const nx = d.x + d.vx * dt, ny = d.y + d.vy * dt;
    if (!blockAt(nx, d.y)) d.x = nx; else d.vx *= 0.3;
    if (!blockAt(d.x, ny)) d.y = ny; else d.vy *= 0.3;
    if (A) { const m = TUNE.margin; if (d.x < -m) { d.x = -m; d.vx = Math.max(0, d.vx); } if (d.x > A.w + m) { d.x = A.w + m; d.vx = Math.min(0, d.vx); } if (d.y < -m) { d.y = -m; d.vy = Math.max(0, d.vy); } if (d.y > A.h + m) { d.y = A.h + m; d.vy = Math.min(0, d.vy); } }
    if (!holdHeading) steer(S, dt, mag > 0.15 ? want : null, mag);
    return mag;
  }
  function airBody(S) { const P = S.V.pose; P.form = 1; P.xf = 1; }   /* (its body language is animate()'s) */

  /* ---- Dive (Dodge, airship): a roll, a swoop on the target, one hit per enemy at the low pass, the climb back ---- */
  function tryDive(S, mx, my, queued) {
    const d = S.V; S.mx = mx; S.my = my;
    if (S.dive || S.busy || S.cd.dodge > 0 || d.locked) { if (!queued && ((S.dive && S.dive.t > S.dive.end - 0.25) || (S.cd.dodge > 0 && S.cd.dodge < 0.25))) S.dQ = S.g.t; return; }
    S.dQ = null;
    const T = target(S); let p = T.m ? { x: T.m.x, y: T.m.y } : groundAt(S, T.x, T.y) ? { x: T.x, y: T.y } : null; if (!p) p = aimPoint(S);
    if (!p || !pathOK(S, d.x, d.y, p.x, p.y)) { const a = Math.hypot(mx, my) > 0.2 ? Math.atan2(my, mx) : d.heading; S.marks.push({ x: d.x + Math.cos(a) * 4.5, y: d.y + Math.sin(a) * 4.5, t: 0, life: 0.7 }); S.stats.diveBad++; const sfx = S.X.sfx || {}; if (sfx.wrong) sfx.wrong(); return; }
    const D = TUNE.dive, a = Math.atan2(p.y - d.y, p.x - d.x);
    S.dive = { t: 0, t1: D.roll, t2: D.roll + D.swoop, t3: D.roll + D.swoop + D.pass, end: D.roll + D.swoop + D.pass + D.climb, x0: d.x, y0: d.y, z0: d.z, tx: p.x, ty: p.y, m: T.m, a, from: S.ha, rollDir: wrap(a - S.ha) >= 0 ? 1 : -1, hits: new Set(), struck: false };
    S.me.inv = Math.max(S.me.inv || 0, 0.06); S.stats.dives++; S.g.movedOnce = true;
    const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) sfx.note(110, 0.5, 'sawtooth', 0.04, 260);
  }
  /* the dive's line: the target on the ground of the map, and the pull-up space clear of tall walls (a hand-drawn stage) */
  function pathOK(S, x0, y0, x1, y1) { if (!groundAt(S, x1, y1)) return false; const A = S.air; if (A && A.hand) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.4); for (let i = 1; i <= n; i++) { const u = i / n; if (wallNear(S, lerp(x0, x1, u), lerp(y0, y1, u), 0.3)) return false; } } return true; }
  function stepDive(S, dt) {
    const D = S.dive, d = S.V, P = d.pose, Tn = TUNE.dive; D.t += dt; const t = D.t;
    if (D.m && !D.m.dead && t < D.t2 - 0.1) { D.tx = D.m.x; D.ty = D.m.y; }
    // the roll about the long axis (the pose's roll; the pet rolls flat with it), turning onto the dive's heading
    if (t < D.t1) { const u = easeIO(t / D.t1); setHeading(S, D.from + wrap(D.a - D.from) * u, dt); d.vx *= 0.85; d.vy *= 0.85; d.z = D.z0 + 0.3 * Math.sin(Math.PI * u); }
    else if (t < D.t3) { setHeading(S, D.a, dt); const u = cl((t - D.t1) / (D.t3 - D.t1)), e = Math.pow(cl((t - D.t1) / Tn.swoop), 1.6);
      d.x = lerp(D.x0, D.tx, Math.min(1, e)); d.y = lerp(D.y0, D.ty, Math.min(1, e)); d.z = lerp(D.z0 + 0.3, 0.55, Math.min(1, e)); void u;
      // the low pass: one hit per enemy inside the footprint, swept along the pass
      if (t >= D.t2 - 0.04) { for (const m of S.H.living()) { if (D.hits.has(m)) continue; if (Math.hypot(m.x - d.x, m.y - d.y) > Tn.r + (m.r || 0.4)) continue; D.hits.add(m); if (hitCharge(S, m, S.DK * Tn.dmg, { kb: Tn.kb }) > 0) { S.stats.diveHit++; sparks(S, m.x, m.y, 1); } }
        if (!D.struck) { D.struck = true; addPart(S, 9, d.x, d.y, 0, 0, 0, 0, 0.55, Tn.r * 1.05, {}); const sfx = S.X.sfx || {}; if (sfx.crash) sfx.crash(); if (!calm()) S.X.shake(4, 0.15); for (let i = 0; i < (lowFx() ? 10 : 24); i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 4; addPart(S, 1, d.x, d.y, 0.2, Math.cos(a) * v, Math.sin(a) * v * GY, 1 + Math.random() * 2, 0.4 + Math.random() * 0.4, 0.12, { col: i % 2 ? VIO : VIO2, g: 4 }); } } } }
    else { const u = sstep(D.t3, D.end, t); d.z = lerp(0.55, TUNE.cruise, u); d.vx = Math.cos(D.a) * 4 * (1 - u); d.vy = Math.sin(D.a) * 4 * (1 - u); d.x += d.vx * dt; d.y += d.vy * dt; }
    if (t >= D.end) { S.dive = null; S.cd.dodge = dodgeCd(S); }
  }

  /* ================= the frame ================= */
  function step(S, dt) {
    const d = S.V, me = S.me, g = S.g, X = S.X, M0 = MOD(), P = d.pose;
    if (S.released) { S.relT = (S.relT || 0) + dt; stepParts(S, dt); return; }
    if (me.dead) { finish(S, 'defeat'); return; }
    if (g.over || (g.won && S.phase !== 'messiah' && S.phase !== 'out')) { finish(S, 'won'); return; }
    if (X.pet && S.pet && X.pet() !== S.pet) { finish(S, 'swap'); return; }
    g.cdU = S.CD;   // (held through the session: the cooldown starts at the final exit)
    S.t += dt; for (const k in S.cd) S.cd[k] = Math.max(0, S.cd[k] - dt); if (S.busy) S.busyT += dt;
    if (M0.warm) { try { M0.warm(S.phase === 'summon' ? 5 : S.phase === 'xform' ? 3 : 1); } catch (e) { /* (model) */ } }   /* (the model's slices never overrun the budget; an empty queue returns at once) */
    const MVw = moves(); if (MVw.warm && !S.wDone) { try { if (MVw.warm(S.phase === 'summon' ? 1.5 : 0.6) === true) S.wDone = true; } catch (e) { S.wDone = true; } }
    if (S.phase === 'summon') stepSummon(S, dt);
    else if (S.phase === 'robot') {
      S.leftR = Math.min(S.leftR - dt, S.endR - g.t); S.stats.robotT += dt;   /* (the game clock: a hit-stop, which pauses this step, still counts) */
      if (S.leftR <= 0) { startOut(S, 'timeout'); return; }   // (exactly 35 s: a Glide or a Strong in progress is cut (its later hits are dropped: alive() is false); a Transform not yet committed at expiry is dropped: the timeout wins, deterministically)
      if (S.busy && S.busyT > 9) actionDone(S);
      if (S.jump) stepJump(S, dt); else if (S.glide) stepGlide(S, dt); else { moveRobot(S, dt, !d.locked && !busyLocks(S)); if (S.swing) stepSwing(S, dt); }
      if (!S.glide && !S.jump) robotBody(S, dt);
      if (S.jumpQ != null && !S.jump) { if (g.t - S.jumpQ > TUNE.jump.buf) S.jumpQ = null; else if (!S.busy && !S.glide && !S.swing && !d.locked) tryJump(S, S.mx, S.my, true); }
      if (S.xfQ != null && !S.busy && !S.glide && !S.jump) { if (g.t - S.xfQ < 3) commitXform(S); else S.xfQ = null; }
      queues(S);
    } else if (S.phase === 'xform') stepXform(S, dt);
    else if (S.phase === 'air') {
      S.leftA = Math.min(S.leftA - dt, S.endA - g.t); S.stats.airT += dt;
      if (S.leftA <= 0) { startOut(S, 'timeout'); return; }   // (exactly 20 s: a Dive or a Pulsar in progress resolves to the safe return, no late hits)
      if (S.busy && S.busyT > 9) actionDone(S);
      if (S.busy === 'pulsar') { const da = wrap(d.heading - S.ha); S.ha = wrap(d.heading); S.au += da; S.hw = 0; }   /* (Shockwave Pulsar aims the ship: E's heading is followed, never fought) */
      if (S.dive) stepDive(S, dt); else { fly(S, dt, !d.locked, S.busy === 'pulsar'); airBody(S, dt); }
      if (S.ultQ != null && !S.busy && !S.dive) { const q = S.ultQ; S.ultQ = null; if (g.t - q < 2 && S.charge >= 1 && !S.used) startMessiah(S); }
      queues(S);
    } else if (S.phase === 'messiah') { if (S.t > TUNE.messiahCap) { S.busy = null; S.ctx.messiah = false; S.cam = null; startOut(S, 'messiah'); return; } }
    else if (S.phase === 'out') stepOut(S, dt);
    // the safe return point (a valid ground location, tracked all through)
    S.safeT -= dt; if (S.safeT <= 0) { S.safeT = 0.25; if (safeOK(S, d.x, d.y)) S.safe = { x: d.x, y: d.y }; }
    S.reachT -= dt; if (S.reachT <= 0) { S.reachT = 2; if (S.safe && canStand(S, S.safe.x, S.safe.y)) buildReach(S, S.safe.x, S.safe.y); }
    if (d.locked && S.phase === 'messiah') { const da = wrap(d.heading - S.ha); S.ha = wrap(d.heading); S.au += da; S.hw = 0; } else d.heading = S.ha;
    const MV = moves(); if (MV.update) { try { MV.update(S.ctx, dt); } catch (e) { /* (theirs) */ } }
    if (S.phase !== 'out' || !S.hopped) syncMe(S);
    stepParts(S, dt);
    animate(S, dt);
    S.fx.entY = d.y + 1 + d.z;
    S.sfxT -= dt; if (S.sfxT <= 0 && (S.phase === 'robot' || S.phase === 'air')) { const sfx = X.sfx || {}; S.sfxT = 1.1 + Math.random() * 0.4; if (sfx.note) sfx.note(S.phase === 'air' ? 62 : 46, 0.9, 'sawtooth', 0.02, S.phase === 'air' ? 66 : 48); }
  }
  /* A's channels onto the model's names (M, 20k5v): the fans' spread, the gait's amplitude */
  const busyLocks = S => S.busy === 'spikes';   // (the sword is planted: it holds still; Death Ray lets it drift)
  function queues(S) { const g = S.g, d = S.V;
    if (S.mvQ) { const Q = S.mvQ, k = S.phase === 'air' ? 'pulsar' : Q.slot === 'strong2' ? 'spikes' : 'blade'; if (g.t - Q.t > TUNE.mvHold + 0.4) S.mvQ = null; else if (!S.busy && !S.glide && !S.dive && !S.jump && !d.locked && S.cd[k] <= 0) { S.mvQ = null; tryMove(S, Q.slot, true); } }
    if (S.dQ != null && !S.busy && !S.glide && !S.dive && !S.jump && (S.phase === 'robot' || S.cd.dodge <= 0)) { const q = S.dQ; S.dQ = null; if (g.t - q < 0.6) tryDodge2(S, q); } }
  function tryDodge2(S) { if (S.phase === 'robot') tryGlide(S, S.mx, S.my, true); else if (S.phase === 'air') tryDive(S, S.mx, S.my, true); }

  /* ---- the summon: the seal, the cockpit rising round the pet, the assembly, the lock and pulse ---- */
  function stepSummon(S, dt) {
    const d = S.V, P = d.pose, t = S.t, T = TUNE.summon;
    P.alpha = sstep(0.15, 0.6, t); P.form = 0; P.xf = 0; P.assemble = sstep(0.2, T - 0.4, t); P.glow = 0.3 + 0.7 * Math.exp(-Math.pow((t - (T - 0.15)) / 0.12, 2));
    d.z = TUNE.hover * sstep(0.4, T, t);
    if (Math.random() < dt * (lowFx() ? 15 : 40) && t < T - 0.3) { const a = Math.random() * TAU, r = Math.random() * 2.4; addPart(S, 1, d.x + Math.cos(a) * r, d.y + Math.sin(a) * r * 0.8, 0.05, 0, 0, 0.8 + Math.random() * 1.5, 0.8 + Math.random() * 0.6, 0.11, { col: Math.random() < 0.5 ? VIO : VIO2 }); }
    if (!S.locked1 && t >= T - 0.18) { S.locked1 = true; const sfx = S.X.sfx || {}; if (sfx.stomp) sfx.stomp(); if (sfx.note) sfx.note(55, 0.6, 'square', 0.05, 40); if (!calm()) S.X.shake(3, 0.12); }
    if (t >= T) { S.phase = 'robot'; S.t = 0; d.locked = false; S.leftR = TUNE.robotDur; S.endR = S.g.t + TUNE.robotDur; P.assemble = 1; P.alpha = 1;
      if (!S.mvOn && S.X.mvMod) { S.mvOn = true; S.X.mvMod('susanoo', TUNE.mvK); S.stats.mvSet++; } }   // (the x1.35, once, when it can move)
  }

  /* ---- exits: the pet set down on valid ground, the form dissolves, restore, cooldown ---- */
  function startOut(S, how) {
    if (S.phase === 'out' || S.released) return;
    const d = S.V; if (S.jump) { S.jump = null; S.me.airborne = false; } S.jumpQ = null; S.glide = null; S.swing = null; S.dive = null; S.busy = null; S.xfQ = null; S.mvQ = null; S.dQ = null; S.ultQ = null;
    S.outHow = how || 'timeout'; S.fromPhase = S.phase; S.phase = 'out'; S.t = 0; S.outT = 0; d.locked = true; S.cam = null; S.ctx.messiah = false;
    const p = S.retPt && safeOK(S, S.retPt.x, S.retPt.y) ? S.retPt : safeReturn(S); S.ret = p;
    S.outFrom = { x: d.x, y: d.y, z: d.z }; S.outGlide = S.fromPhase === 'robot' ? 0 : Math.max(TUNE.outGlide[0], Math.min(TUNE.outGlide[1], Math.hypot(p.x - d.x, p.y - d.y) / TUNE.outSpd));
    const sfx = S.X.sfx || {}; if (sfx.note) [294, 220, 147].forEach((f, i) => sfx.note(f, 0.35, 'sawtooth', 0.03, f * 0.95, i * 0.1));
  }
  function stepOut(S, dt) {
    const d = S.V, P = d.pose; S.outT += dt;
    if (S.outT < S.outGlide) { const u = sstep(0, 1, S.outT / S.outGlide); d.x = lerp(S.outFrom.x, S.ret.x, u); d.y = lerp(S.outFrom.y, S.ret.y, u); d.z = lerp(S.outFrom.z, 1.4, u); if (Math.hypot(S.ret.x - d.x, S.ret.y - d.y) > 0.4) steer(S, dt, Math.atan2(S.ret.y - S.outFrom.y, S.ret.x - S.outFrom.x), 1); return; }
    const t = S.outT - S.outGlide;
    // (M round 2) the chest hatch opens first, so the pet is seen leaving; then the hop
    if (!S.hopped) { S.hatchU = (S.hatchU || 0) + dt / TUNE.hatch; P.hatch = 1 - inOut(S.hatchU); if (S.hatchU < 1) return; P.hatch = 0; }
    if (!S.hopped) { S.hopped = true; S.petHop = 0; const sfx = S.X.sfx || {}; if (sfx.jump) sfx.jump(); }
    S.petHop += dt; const me = S.me; const u = cl(S.petHop / TUNE.hop); me.x = lerp(d.x, S.ret.x, u); me.y = lerp(d.y, S.ret.y, u); me.vx = me.vy = 0;
    // the dissolve: armour silhouettes fading, violet fragments and dark mist (after the rider is clear)
    if (S.petHop > TUNE.hop) { const v = cl((S.petHop - TUNE.hop) / TUNE.dissolve); void t; P.alpha = 1 - v; if (Math.random() < dt * (lowFx() ? 25 : 70)) { const a = Math.random() * TAU, r = Math.random() * 2; addPart(S, Math.random() < 0.6 ? 1 : 2, d.x + Math.cos(a) * r, d.y + Math.sin(a) * r * 0.7, d.z + Math.random() * 2.2, Math.cos(a) * 0.8, Math.sin(a) * 0.6, 0.5 + Math.random(), 0.7 + Math.random() * 0.5, 0.14, { col: Math.random() < 0.5 ? VIO : DEEP, grow: 1.4, drag: 1 }); }
      if (v >= 1) release(S); }
  }
  function finish(S, how) {
    if (S.released) return; S.outHow = how;
    const p = S.phase === 'out' && S.ret ? S.ret : safeReturn(S), me = S.me; me.x = p.x; me.y = p.y;   // (never over the void, off the map or in a wall, even on defeat)
    const d = S.V; if (d.vis > 0.05 && (d.pose.alpha || 0) > 0.05) { for (let i = 0; i < (lowFx() ? 10 : 26); i++) { const a = Math.random() * TAU, v = 1 + Math.random() * 3; addPart(S, 1, d.x + Math.cos(a), d.y + Math.sin(a) * 0.7, d.z + Math.random() * 2, Math.cos(a) * v, Math.sin(a) * v * GY, Math.random() * 2, 0.7 + Math.random() * 0.4, 0.14, { col: Math.random() < 0.5 ? VIO : VIO2 }); } S.fade = 0.35; }
    release(S);
  }
  /* the one guarded cleanup path: controls, camera, movement modifier, cooldown, once */
  function release(S) {
    if (S.released) return;
    S.released = true; S.ended = true; S.relT = 0;
    const me = S.me, g = S.g, X = S.X;
    if (S.ret && S.phase === 'out') { me.x = S.ret.x; me.y = S.ret.y; }
    if (!safeOK(S, me.x, me.y) && !canStand(S, me.x, me.y)) { const p = safeReturn(S); me.x = p.x; me.y = p.y; }
    S.phase = 'gone'; S.busy = null; S.glide = null; S.dive = null; S.mvQ = null; S.ultQ = null; S.dQ = null; S.xfQ = null; S.cam = null;
    if (S.ctx) S.ctx.messiah = false; S.V.locked = true;
    try { X.vehicle(null); } catch (e) { /* (hook) */ }
    if (S.mvOn && X.mvMod) { S.mvOn = false; X.mvMod('susanoo', null); S.stats.mvClear++; }   // (only this session's modifier, once)
    if (me.petAlt === S.fx) me.petAlt = null;
    me.vx = me.vy = 0; me.z = 0; me.push = null; me.castT = 0; me.airborne = false;
    if (!me.dead) { g.cdU = S.CD; S.stats.cdSet++; } else g.cdU = S.CD;   // the cooldown starts now, once (a defeat keeps the game's own policy: the same full cooldown)
    g.tapBuf = 0; g.tapAim = null; g.normalT = Math.max(g.normalT || 0, 0.2);
    S.fx.life = 2.2; S.fx.onEnd = null;
  }

  /* ---- pooled particles: 1 ember (additive), 2 dark mist puff, 9 violet shock ring on the floor (s = radius) ---- */
  const CAP = 300;
  function addPart(S, kind, x, y, z, vx, vy, vz, life, s, o) {
    if (S.parts.length >= CAP * (lowFx() ? 0.45 : 1)) return null;
    const p = S.free.pop() || {}; p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.s = s; p.g = (o && o.g) || 0; p.drag = (o && o.drag) || 0; p.grow = (o && o.grow) || 0; p.col = (o && o.col) || null;
    S.parts.push(p); return p;
  }
  function stepParts(S, dt) {
    for (let i = S.parts.length - 1; i >= 0; i--) { const p = S.parts[i]; p.life -= dt; if (p.life <= 0) { S.parts[i] = S.parts[S.parts.length - 1]; S.parts.pop(); S.free.push(p); continue; }
      const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz = p.vz * k - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); }
    for (let i = S.marks.length - 1; i >= 0; i--) { const m = S.marks[i]; m.t += dt; if (m.t > m.life) S.marks.splice(i, 1); }
    for (let i = S.trail.length - 1; i >= 0; i--) if (S.g.t - S.trail[i].t > 0.22) S.trail.length = i;
  }
  function sparks(S, x, y, k) { for (let i = 0; i < (lowFx() ? 4 : 9) * k; i++) { const a = Math.random() * TAU, v = 3 + Math.random() * 4; addPart(S, 1, x, y, 0.8, Math.cos(a) * v, Math.sin(a) * v * GY, 1 + Math.random() * 2, 0.25 + Math.random() * 0.2, 0.09, { col: i % 2 ? WHITE : VIO2, g: 6 }); } }

  /* ================= drawing ================= */
  function drawUnder(S, c) {
    const H = S.H, T = H.X.Tz(), d = S.V, M0 = MOD(), t = S.g.t;
    // the summoning seal: a dark circle opening, violet runes turning (light only)
    const sealA = S.phase === 'summon' ? Math.min(1, S.t / 0.35) * (1 - sstep(TUNE.summon - 0.6, TUNE.summon, S.t)) : 0;
    if (sealA > 0.01) { const X0 = H.sx(S.home.x), Y0 = H.sy(S.home.y), r = T * 2.4 * sstep(0, 0.5, S.t); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = sealA * 0.8; c.translate(X0, Y0); c.scale(1, GY); c.rotate(-S.t * 0.7);
      for (const [rr, w] of [[1, 3], [0.82, 1.4], [0.6, 2]]) { c.beginPath(); c.arc(0, 0, r * rr, 0, TAU); c.strokeStyle = VIO; c.lineWidth = w * T * 0.03; c.stroke(); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6); c.lineTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); c.strokeStyle = VIO2; c.lineWidth = T * 0.025; c.stroke(); }
      c.globalAlpha = sealA * 0.4; blitSized(c, glowSprite(VIO), -r, -r, r * 2, r * 2); c.restore(); }
    // shock rings on the floor
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of S.parts) { if (p.kind !== 9) continue; const u = 1 - p.life / p.max, e = 1 - (1 - u) ** 3, r = T * p.s * (0.2 + 0.8 * e), X0 = H.sx(p.x), Y0 = H.sy(p.y); c.globalAlpha = Math.pow(1 - u, 1.3) * 0.8; c.globalAlpha *= 0.4; blitSized(c, glowSprite(VIO), X0 - r, Y0 - r * GY, r * 2, r * 2 * GY); c.globalAlpha = Math.pow(1 - u, 1.3) * 0.7; c.beginPath(); c.ellipse(X0, Y0, r, r * GY, 0, 0, TAU); c.strokeStyle = VIO2; c.lineWidth = T * 0.18 * (1 - u); c.stroke(); }
    if (S.dive && !S.dive.struck) { const D = S.dive, u = cl(D.t / D.t2), r = T * TUNE.dive.r * (1.05 - 0.35 * u), X0 = H.sx(D.tx), Y0 = H.sy(D.ty); c.globalAlpha = 0.5 * sstep(0, 0.2, u); blitSized(c, glowSprite(VIO), X0 - r, Y0 - r * GY, r * 2, r * 2 * GY); }
    c.restore();
    // the robot's foot exhaust: a soft violet glow on the floor under it (light only), stronger as it accelerates
    if ((S.phase === 'robot' || S.phase === 'summon' || (S.phase === 'xform' && S.xt < 1.2)) && inMap(S, d.x, d.y)) { const k = cl((d.pose.thrust || 0.3) * (d.pose.alpha == null ? 1 : d.pose.alpha)) * (S.phase === 'xform' ? 1 + S.xt : 1), r = T * (0.9 + 0.5 * k); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 * k; blitSized(c, glowSprite(VIO), H.sx(d.x) - r, H.sy(d.y) - r * GY, r * 2, r * 2 * GY); c.restore(); }
    if (S.phase !== 'gone' && M0 && inMap(S, d.x, d.y)) { try { M0.drawShadow(c, d.x, d.y, d.z + (S.zOff || 0), d.heading + (S.yawOff || 0), d.pose, { T, sx: H.sx, sy: H.sy, t, scale: TUNE.size }); } catch (e) { /* (model) */ } }
    callM(S, c, 'drawUnder');
  }
  function callM(S, c, k) { const MV = moves(); if (MV[k] && S.ctx) { c.save(); try { MV[k](S.ctx, c); } catch (e) { /* (theirs) */ } c.restore(); } }
  function drawEnt(S, c) {
    const H = S.H, T = H.X.Tz(), d = S.V, M0 = MOD(), t = S.g.t;
    if (S.phase === 'gone') { if (S.fade && S.relT < S.fade) { const a0 = d.pose.alpha; d.pose.alpha = a0 * (1 - S.relT / S.fade); try { M0.draw(c, d.x, d.y, d.z, d.heading, d.pose, { T, sx: H.sx, sy: H.sy, t, low: lowFx(), scale: TUNE.size }); } catch (e) { /* (model) */ } d.pose.alpha = a0; } return; }
    const riding = !(S.phase === 'summon' && S.t < 0.5) && !(S.phase === 'out' && S.hopped);
    drawTrail(S, c);
    const roll = d.pose.roll || 0;
    const o = { T, sx: H.sx, sy: H.sy, t, low: lowFx(), scale: TUNE.size, pet: (cc, PX, PY) => { S.seatS = [PX, PY]; if (riding) H.X.drawPetAt(cc, PX, PY + T * 0.12 * Math.abs(Math.sin(roll)), { maxH: 0.7, rot: roll }); } };
    try { M0.draw(c, d.x, d.y, d.z + (S.zOff || 0), d.heading + (S.yawOff || 0), d.pose, o); }   /* (the animation's whole-body yaw and rise) */ catch (e) { if (riding) H.X.drawPetAt(c, H.sx(d.x), H.sy(d.y) - (d.z + 1.5) * ZK * T, { maxH: 0.7 }); }
    if (S.phase === 'summon' && S.t < 0.5) H.X.drawPetAt(c, H.sx(S.home.x), H.sy(S.home.y), {});
    if (S.phase === 'out' && S.hopped) { const u = cl(S.petHop / TUNE.hop), s3 = S.seatS || [H.sx(d.x), H.sy(d.y) - d.z * ZK * T], gx = H.sx(S.ret.x), gy = H.sy(S.ret.y); H.X.drawPetAt(c, lerp(s3[0], gx, u), lerp(s3[1], gy, u) - Math.sin(u * Math.PI) * T * 0.9, u < 1 ? { maxH: 0.7 } : {}); }
  }
  /* the Glides' crescent trail along the sword's real edge (tip and channel anchors over the last frames): a bright
     silver-violet leading edge, a translucent purple body, a soft smoky inner fade */
  function drawTrail(S, c) { const L = S.trail; if (L.length < 3) return; const H = S.H, T = H.X.Tz(), toS = p => [H.sx(p[0]), H.sy(p[1]) - p[2] * ZK * T];
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < L.length - 1; i++) { const A = L[i], B = L[i + 1], f = 1 - i / (L.length - 1), a0 = toS(A.a), a1 = toS(B.a), b0 = toS(A.b), b1 = toS(B.b);
      c.globalAlpha = 0.28 * f; c.fillStyle = '#7A3CD8'; c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.lineTo(b1[0], b1[1]); c.lineTo(b0[0], b0[1]); c.closePath(); c.fill();
      c.globalAlpha = 0.85 * f; c.strokeStyle = i < 2 ? '#F2EAFF' : VIO2; c.lineWidth = T * (0.05 + 0.06 * f); c.lineCap = 'round'; c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.stroke(); }
    c.restore(); }
  function drawOver(S, c) {
    const H = S.H, T = H.X.Tz();
    callM(S, c, 'drawOver');
    if (S.marks.length) { c.save(); for (const m of S.marks) { const a = 1 - Math.pow(Math.min(1, m.t / m.life), 2), X0 = H.sx(m.x), Y0 = H.sy(m.y), r = T * 0.7; c.globalAlpha = 0.85 * a; c.strokeStyle = '#C070FF'; c.lineWidth = T * 0.09; c.setLineDash([T * 0.18, T * 0.14]); c.beginPath(); c.ellipse(X0, Y0, r, r * GY, 0, 0, TAU); c.stroke(); c.setLineDash([]);
      c.beginPath(); c.moveTo(X0 - r * 0.5, Y0 - r * 0.35); c.lineTo(X0 + r * 0.5, Y0 + r * 0.35); c.moveTo(X0 + r * 0.5, Y0 - r * 0.35); c.lineTo(X0 - r * 0.5, Y0 + r * 0.35); c.stroke(); } c.restore(); }
    if (!S.parts.length) return;
    const sp = S.seatS || [-1e9, -1e9], PX = sp[0], PY = sp[1] - T * 0.4;
    c.save();
    for (const p of S.parts) { if (p.kind === 9) continue; const X0 = H.sx(p.x), Y0 = H.sy(p.y) - p.z * ZK * T, u = 1 - p.life / p.max, keep = 0.08 + 0.92 * sstep(T * 0.4, T * 1.2, Math.hypot(X0 - PX, Y0 - PY));   /* (never over the pet in its cockpit) */
      if (p.kind === 2) { const r = T * p.s * (1 + p.grow * u); c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, u * 6) * (1 - u) * 0.32 * keep; blitSized(c, glowSprite(p.col || '#24182E'), X0 - r, Y0 - r, r * 2, r * 2); continue; }
      const a = cl(p.life / Math.min(0.3, p.max)) * keep; if (a < 0.02) continue; const r = T * p.s; c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(p.col || VIO), X0 - r, Y0 - r, r * 2, r * 2); }
    c.restore();
  }

  /* ================= the HUD: two menus (robot: Glides, Jump, Death Ray, Dark Spikes, Transform; airship: Dive, Shockwave
     Pulsar, Dark Messiah), the phase timer apart from the meter ================= */
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  function drawBtns(S, c, o) {
    const { B, blitC, hudPic, glowPic } = o, t = S.g.t, air = S.menu === 'air', idle = (S.phase !== 'robot' && S.phase !== 'air') || S.V.locked;
    const btn = (b, key, label, cd, cdMax, paint, busy) => { const rd = cd <= 0.01 && !idle && !S.busy && !S.glide && !S.dive;
      if (rd) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.26 + 0.08 * Math.sin(t * 5); blitC(c, glowPic(glowSprite, VIO, Math.round(b.r * 1.7)), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`sus|${key}|${rd}|${b.r}`, b.r * 2 + 10, b.r * 2 + 10, (x, w, h) => paint(x, w / 2, h / 2, b.r, rd)), b.x, b.y);
      if (busy) { c.save(); c.lineWidth = 3; c.strokeStyle = rgba(VIO2, 0.85); c.beginPath(); c.arc(b.x, b.y, b.r + 2, t * 6, t * 6 + 1.6); c.stroke(); c.restore(); }
      if (cd > 0.05) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, cd / cdMax)); c.closePath(); c.fillStyle = 'rgba(8,4,14,.55)'; c.fill(); GFX.textS(c, cd.toFixed(1), b.x, b.y, 13, '#FFFFFF'); }
      GFX.labelS(c, label, b.x, b.y + b.r + 9, 8, 800, '#E6DCFF', 'rgba(0,0,0,.7)', 3); };
    if (!air) { btn(B.s[0], 'blade', 'DEATH RAY', S.cd.blade, TUNE.cdBlade, paintRayBtn, S.busy === 'blade');   /* (round 6: Strong 1 is E's Death Ray; the slot key stays 'blade') */ btn(B.s[1], 'spikes', 'DARK SPIKES', S.cd.spikes, TUNE.cdSpikes, paintSpikesBtn, S.busy === 'spikes'); btn(B.d, 'glides', 'GLIDES', 0, 1, paintGlideBtn, !!S.glide);   /* (round 6: no cooldown) */
      { // the combo's stage: four pips over the button, lit to the current stage while the combo runs (the finisher's pip glows white)
        const b = B.d, n = S.glide ? S.glide.n : (S.comboN && t - S.comboT <= TUNE.combo.win ? S.comboN : 0);
        for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * 0.36, px = b.x + Math.cos(a) * (b.r + 7), py = b.y + Math.sin(a) * (b.r + 7), on = i < n;
          c.beginPath(); c.arc(px, py, i === 3 ? 3.6 : 2.8, 0, TAU); c.fillStyle = on ? (i === 3 ? WHITE : VIO2) : 'rgba(20,10,30,.75)'; c.fill(); c.lineWidth = 1; c.strokeStyle = on ? 'rgba(255,255,255,.8)' : 'rgba(200,190,230,.45)'; c.stroke(); } } }
    if (!air && B.j) btn(B.j, 'jump', 'JUMP', 0, 1, paintJumpBtn, !!S.jump);   // (round 5: the robot's Jump, above Glides (the shared vehicle layout); the airship has none)
    else { btn(B.s[0], 'pulsar', 'PULSAR', S.cd.pulsar, TUNE.cdPulsar, paintPulsarBtn, S.busy === 'pulsar'); btn(B.d, 'dive', 'DIVE', S.cd.dodge, dodgeCd(S), paintDiveBtn, !!S.dive); }   // (the airship: no second Strong button)
    // the Ult: TRANSFORM (robot; the Dark Messiah meter as a thin ring) or DARK MESSIAH (airship: the meter, ready pulse)
    { const b = B.u, full = S.charge >= 1 && !S.used, k = S.used ? 1 : S.charge, msh = S.phase === 'messiah', xf = S.phase === 'xform';
      if (air && (full || msh)) { const pl = 0.5 + 0.5 * Math.sin(t * 6); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.35 * pl; blitC(c, glowPic(glowSprite, VIO, Math.round(b.r * (2.1 + 0.25 * pl) * 4) / 4), b.x, b.y); c.restore(); }
      if (!air && !xf && S.phase === 'robot') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22 + 0.06 * Math.sin(t * 3); blitC(c, glowPic(glowSprite, SILV, Math.round(b.r * 1.6)), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`sus|ult|${air}|${air && (full || msh)}|${b.r}`, b.r * 2 + 12, b.r * 2 + 12, (x, w, h) => (air ? paintMessiahBtn : paintXformBtn)(x, w / 2, h / 2, b.r, air ? full || msh : true)), b.x, b.y);
      // the meter ring (both forms; in the robot it is the secondary indicator)
      c.save(); c.lineCap = 'round'; c.lineWidth = air ? 4.5 : 3; c.strokeStyle = 'rgba(10,4,16,.85)'; c.beginPath(); c.arc(b.x, b.y, b.r - 2, 0, TAU); c.stroke(); if (k > 0.004) { c.strokeStyle = full ? WHITE : VIO; c.lineWidth = air ? 3.5 : 2.2; c.beginPath(); c.arc(b.x, b.y, b.r - 2, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke(); } c.restore();
      // the phase timer, apart from the meter: an outer arc and the seconds
      const ph = S.phase, left = ph === 'robot' ? S.leftR : ph === 'air' ? S.leftA : ph === 'summon' ? TUNE.robotDur : ph === 'xform' ? TUNE.airDur : 0, dur = ph === 'air' || ph === 'xform' ? TUNE.airDur : TUNE.robotDur;
      if (ph === 'robot' || ph === 'air' || ph === 'summon' || ph === 'xform') { const u = cl(left / dur), low = (ph === 'robot' || ph === 'air') && left < 5; c.save(); c.lineCap = 'round'; c.lineWidth = 2.5; c.strokeStyle = low ? 'rgba(255,120,150,.95)' : 'rgba(220,200,255,.9)'; c.beginPath(); c.arc(b.x, b.y, b.r + 4.5, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); c.restore();
        GFX.labelS(c, Math.ceil(left) + 's', b.x, b.y + b.r * 0.7, 10, 900, low ? '#FF9AB8' : '#F0E8FF', 'rgba(0,0,0,.75)', 3); }
      const lab = xf ? 'TRANSFORMING' : !air ? 'TRANSFORM' : msh ? 'DARK MESSIAH!' : full ? 'DARK MESSIAH' : S.used ? 'USED' : `MESSIAH ${Math.floor(S.charge * 100)}%`;
      if (air && full) { const s = 1 + 0.08 * Math.sin(t * 7); c.save(); c.translate(b.x, b.y + b.r + 10); c.scale(s, s); GFX.labelS(c, lab, 0, 0, 11, 900, WHITE, 'rgba(40,8,60,.9)', 3.5); c.restore(); }
      else GFX.labelS(c, lab, b.x, b.y + b.r + 9, 9, 800, xf ? VIO2 : '#E6DCFF', 'rgba(0,0,0,.7)', 3); }
  }
  /* black faces, a silver rim, a violet inner ring when ready */
  function btnFace(x, cx, cy, r, rd) { const g = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); if (rd) { g.addColorStop(0, '#4A3A66'); g.addColorStop(0.55, '#1E1430'); g.addColorStop(1, '#08040E'); } else { g.addColorStop(0, '#2C2834'); g.addColorStop(0.6, '#18141E'); g.addColorStop(1, '#0A080E'); } x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
  function btnRim(x, cx, cy, r, rd) { x.lineWidth = 3; x.strokeStyle = rd ? '#C8C4D8' : 'rgba(200,196,216,.45)'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke(); x.lineWidth = 1.6; x.strokeStyle = rd ? VIO : 'rgba(155,92,255,.3)'; x.beginPath(); x.arc(cx, cy, r - 2.5, 0, TAU); x.stroke(); if (rd) { x.fillStyle = 'rgba(255,255,255,.16)'; x.beginPath(); x.ellipse(cx - r * 0.3, cy - r * 0.5, r * 0.3, r * 0.12, -0.5, 0, TAU); x.fill(); } }
  const blade = (x, rd, L, w) => { x.fillStyle = rd ? '#1A1622' : '#141018'; x.beginPath(); x.moveTo(0, -w); x.lineTo(L, -w * 0.5); x.lineTo(L + w * 1.6, 0); x.lineTo(L, w * 0.5); x.lineTo(0, w); x.closePath(); x.fill(); x.strokeStyle = rd ? SILV : 'rgba(216,212,232,.45)'; x.lineWidth = 1.2; x.stroke(); x.strokeStyle = rd ? VIO2 : 'rgba(201,162,255,.35)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(w * 0.6, 0); x.lineTo(L, 0); x.stroke(); x.fillStyle = rd ? GOLD : '#6A5A3A'; x.fillRect(-w * 0.6, -w * 1.7, w * 0.8, w * 3.4); x.fillStyle = rd ? CRIM : '#4A1A1A'; x.fillRect(-w * 3.2, -w * 0.5, w * 2.6, w); };
  /* Glides: a sword sweeping round in a crescent arc */
  function paintGlideBtn(x, cx, cy, r, rd) { btnFace(x, cx, cy, r, rd); x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55;
    x.lineCap = 'round'; for (let i = 0; i < 3; i++) { x.strokeStyle = i === 0 ? (rd ? '#F2EAFF' : '#8A80A0') : rd ? `rgba(155,92,255,${0.6 - i * 0.18})` : 'rgba(155,92,255,.2)'; x.lineWidth = r * (0.12 - i * 0.03); x.beginPath(); x.arc(0, 0, r * (0.62 - i * 0.1), -2.6, 0.3); x.stroke(); }
    x.rotate(0.3); x.translate(r * 0.05, 0); blade(x, rd, r * 0.5, r * 0.07); x.restore(); btnRim(x, cx, cy, r, rd); }
  /* (the old True Dark Blade glyph: Death Ray's fallback when E's icon is absent) the sword driven down, a tall dark wave rolling forward */
  function paintBladeBtn(x, cx, cy, r, rd) { btnFace(x, cx, cy, r, rd); x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55;
    const g = x.createLinearGradient(0, r * 0.5, r * 0.6, -r * 0.4); g.addColorStop(0, rd ? 'rgba(40,10,70,.9)' : 'rgba(40,30,50,.8)'); g.addColorStop(1, rd ? 'rgba(201,162,255,.9)' : 'rgba(120,110,140,.6)'); x.fillStyle = g; x.beginPath(); x.moveTo(-r * 0.1, r * 0.5); x.quadraticCurveTo(r * 0.2, -r * 0.6, r * 0.62, -r * 0.3); x.quadraticCurveTo(r * 0.4, r * 0.1, r * 0.5, r * 0.5); x.closePath(); x.fill();
    x.rotate(1.2); x.translate(-r * 0.62, r * 0.1); blade(x, rd, r * 0.62, r * 0.075); x.restore(); btnRim(x, cx, cy, r, rd); }
  /* Death Ray: E's glyph (a hand's ray onto a glowing circle) between the face and the rim; the old blade glyph without it */
  function paintRayBtn(x, cx, cy, r, rd) { const SM = moves().SM, ic = SM && SM.icons && SM.icons.deathRay; if (!ic) { paintBladeBtn(x, cx, cy, r, rd); return; } btnFace(x, cx, cy, r, rd); try { ic(x, cx, cy, r, rd); } catch (e) { /* (theirs) */ } btnRim(x, cx, cy, r, rd); }
  /* Dark Spikes: obsidian formations bursting up round a planted sword */
  function paintSpikesBtn(x, cx, cy, r, rd) { btnFace(x, cx, cy, r, rd); x.save(); x.translate(cx, cy + r * 0.35); x.globalAlpha = rd ? 1 : 0.55;
    for (const [dx, h, w] of [[-0.45, 0.5, 0.14], [-0.2, 0.75, 0.16], [0.25, 0.62, 0.15], [0.48, 0.42, 0.12]]) { x.fillStyle = rd ? '#120E18' : '#0E0C12'; x.beginPath(); x.moveTo((dx - w) * r, 0); x.lineTo(dx * r, -h * r); x.lineTo((dx + w) * r, 0); x.closePath(); x.fill(); x.strokeStyle = rd ? '#B488FF' : 'rgba(180,136,255,.35)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(dx * r, -h * r); x.lineTo((dx + w * 0.3) * r, 0); x.stroke(); }
    x.rotate(-Math.PI / 2); x.translate(-r * 0.1, 0); blade(x, rd, r * 0.55, r * 0.065); x.restore(); btnRim(x, cx, cy, r, rd); }
  /* Transform: robot and craft silhouettes linked by a folding arrow */
  function paintXformBtn(x, cx, cy, r, rd) { btnFace(x, cx, cy, r, rd); x.save(); x.translate(cx, cy);
    x.fillStyle = '#D8D4E8'; x.beginPath(); x.moveTo(-r * 0.42, -r * 0.5); x.lineTo(-r * 0.26, -r * 0.5); x.lineTo(-r * 0.2, -r * 0.1); x.lineTo(-r * 0.24, r * 0.3); x.lineTo(-r * 0.44, r * 0.3); x.lineTo(-r * 0.48, -r * 0.1); x.closePath(); x.fill();
    x.fillStyle = VIO2; x.beginPath(); x.moveTo(r * 0.6, r * 0.05); x.lineTo(r * 0.15, -r * 0.2); x.lineTo(r * 0.25, r * 0.05); x.lineTo(r * 0.15, r * 0.3); x.closePath(); x.fill();
    x.strokeStyle = GOLD; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); x.arc(0, r * 0.05, r * 0.35, -2.4, -0.7); x.stroke(); x.beginPath(); x.moveTo(r * 0.27, -r * 0.27); x.lineTo(r * 0.2, -r * 0.12); x.lineTo(r * 0.33, -r * 0.15); x.stroke();
    x.restore(); x.lineWidth = 2.4; x.strokeStyle = SILV; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke(); }
  /* Jump: the robot's silhouette leaping off a violet shock ring, an arc of exhaust under it */
  function paintJumpBtn(x, cx, cy, r, rd) { btnFace(x, cx, cy, r, rd); x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55;
    x.strokeStyle = rd ? `rgba(155,92,255,.85)` : 'rgba(155,92,255,.3)'; x.lineWidth = 2; x.beginPath(); x.ellipse(0, r * 0.45, r * 0.5, r * 0.15, 0, 0, TAU); x.stroke();
    x.strokeStyle = rd ? VIO2 : 'rgba(201,162,255,.35)'; x.lineWidth = r * 0.08; x.lineCap = 'round'; x.beginPath(); x.moveTo(-r * 0.32, r * 0.4); x.quadraticCurveTo(-r * 0.25, -r * 0.1, 0, -r * 0.22); x.stroke();
    x.fillStyle = rd ? '#120E18' : '#0E0C12'; x.strokeStyle = rd ? SILV : 'rgba(216,212,232,.45)'; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(r * 0.05, -r * 0.55); x.lineTo(r * 0.22, -r * 0.42); x.lineTo(r * 0.2, -r * 0.08); x.lineTo(r * 0.34, r * 0.1); x.lineTo(r * 0.16, r * 0.14); x.lineTo(r * 0.06, r * 0.0); x.lineTo(-r * 0.12, r * 0.12); x.lineTo(-r * 0.2, r * 0.0); x.lineTo(-r * 0.06, -r * 0.12); x.lineTo(-r * 0.12, -r * 0.42); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = rd ? VIO2 : 'rgba(201,162,255,.4)'; x.fillRect(r * 0.0, -r * 0.48, r * 0.12, r * 0.03);
    x.restore(); btnRim(x, cx, cy, r, rd); }
  /* Dive: the craft rolling down a violet swoop */
  function paintDiveBtn(x, cx, cy, r, rd) { btnFace(x, cx, cy, r, rd); x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55;
    x.strokeStyle = rd ? VIO2 : 'rgba(201,162,255,.4)'; x.lineWidth = r * 0.12; x.lineCap = 'round'; x.beginPath(); x.moveTo(-r * 0.55, -r * 0.45); x.quadraticCurveTo(-r * 0.1, r * 0.55, r * 0.55, -r * 0.2); x.stroke();
    x.translate(r * 0.05, r * 0.12); x.rotate(0.6); x.fillStyle = rd ? '#120E18' : '#0E0C12'; x.beginPath(); x.moveTo(r * 0.35, 0); x.lineTo(-r * 0.15, -r * 0.3); x.lineTo(-r * 0.05, 0); x.lineTo(-r * 0.15, r * 0.3); x.closePath(); x.fill(); x.strokeStyle = rd ? SILV : 'rgba(216,212,232,.4)'; x.lineWidth = 1; x.stroke(); x.restore(); btnRim(x, cx, cy, r, rd); }
  /* Shockwave Pulsar: a bright ray down onto a burst ring */
  function paintPulsarBtn(x, cx, cy, r, rd) { btnFace(x, cx, cy, r, rd); x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55;
    const g = x.createLinearGradient(0, -r * 0.6, 0, r * 0.35); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, rd ? '#FFFFFF' : '#AAA'); x.fillStyle = g; x.fillRect(-r * 0.06, -r * 0.6, r * 0.12, r * 0.95);
    for (const [rr, a] of [[0.5, 0.9], [0.32, 0.6]]) { x.strokeStyle = rd ? `rgba(155,92,255,${a})` : 'rgba(155,92,255,.25)'; x.lineWidth = 2.2; x.beginPath(); x.ellipse(0, r * 0.38, r * rr, r * rr * 0.35, 0, 0, TAU); x.stroke(); }
    x.restore(); btnRim(x, cx, cy, r, rd); }
  /* Dark Messiah: a great sword-point focus and a ring of dark energy */
  function paintMessiahBtn(x, cx, cy, r, full) { let g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r); g.addColorStop(0, full ? '#3E1A66' : '#221830'); g.addColorStop(0.6, full ? '#160A28' : '#120C1A'); g.addColorStop(1, '#06030A'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
    x.strokeStyle = full ? VIO2 : 'rgba(201,162,255,.4)'; x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, r * 0.46, 0, TAU); x.stroke(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; x.beginPath(); x.moveTo(cx + Math.cos(a) * r * 0.36, cy + Math.sin(a) * r * 0.36); x.lineTo(cx + Math.cos(a + 0.15) * r * 0.46, cy + Math.sin(a + 0.15) * r * 0.46); x.stroke(); }
    g = x.createRadialGradient(cx, cy, 1, cx, cy, r * 0.26); g.addColorStop(0, full ? '#FFFFFF' : '#9A90AA'); g.addColorStop(0.45, full ? '#C9A2FF' : '#5A4A6A'); g.addColorStop(1, 'rgba(120,60,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r * 0.26, 0, TAU); x.fill();
    x.lineWidth = 2; x.strokeStyle = full ? SILV : 'rgba(216,212,232,.4)'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke(); }

  /* ================= the Ultimate ================= */
  U.susanoo = (C, H) => {
    const me = H.me, g = H.g;
    // (a spirit, an actor that is not the played pet: a burst of darkness where it stands)
    if (me.spirit || !H.X.vehicle || !H.X.drawPetAt) { const DK = C.base * (C.K || 1); H.hitArea(me.x, me.y, 2.6, DK * 2.5, { el: 'dark', src: 'ult' }); H.X.ring(me.x, me.y, 0.3, 2.6, 0.5, VIO, 0.3); return; }
    if (g._susanoo && !g._susanoo.released) return;
    startForm(C, H);
  };
  /* idle-time preparation (20b calls it for an equipped Ultimate at the floor's start): the model's bake and E's sprites,
     on every browser: a slice after each frame, sized to the frame rate it sees (as Nidhogg's, 20k6g) */
  let PUMP = null;
  U.susanoo.warm = o => { setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T, M0 = MOD(); if (!(T > 0) || !M0) return; const dpr = (typeof arc !== 'undefined' && arc.dpr) || 1;
    try { if (M0.warmIdle) M0.warmIdle(T * TUNE.zoomR * dpr * TUNE.size, 1); if (M0.warmPlan) M0.warmPlan({ form: 'all', heading: 0 }); } catch (e) { /* (model) */ }
    if (PUMP) return; const now = nowMs; let last = now(), mvDone = false;
    const slice = ms => { let done = true; try { if (M0.warm) done = M0.warm(ms) === true; } catch (e) { done = true; } const MV = moves(); if (!mvDone && MV.warm) { try { mvDone = MV.warm(Math.min(2, ms)) === true; } catch (e) { mvDone = true; } } else mvDone = true; return done && mvDone; };
    PUMP = () => requestAnimationFrame(() => setTimeout(() => { const n = now(), gap = n - last; last = n; if (slice(gap < 20 ? 3 : gap < 34 ? 1.6 : 0.8)) { PUMP = null; return; } PUMP(); }, 0));
    PUMP(); }, 300); };
  U.susanoo.TUNE = TUNE; U.susanoo.CLIPS = CLIPS;
  U.susanoo.__dbg = { TUNE, XFT, CLIPS, STUB, STUBM, MOD, moves, safeReturn, nearestLand, groundAt, aimPoint, target, xfStage };
})();
