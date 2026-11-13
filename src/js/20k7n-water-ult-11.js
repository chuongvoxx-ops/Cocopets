/* ---------- Water's 11th Ultimate: Jaws (the core: worker A) ----------
   The pet rides one mechanical summon with two connected configurations: Jaws, a fast flying shark, and Leviathan, an
   anchored flying siege submarine. The loop: make Tidal Pools as the shark, gather enemies, anchor, spend the pools on
   Leviathan's artillery, release, prepare again.
   This file is the session and nothing else's: one timer (a game-clock deadline: 30 / 45 / 60 s, shared by both forms
   and their transformations), one Shark Attack gauge, the 150 s cooldown set once when normal control returns, the one
   guarded cleanup; the shark's free flight (Nidhogg's) and Leviathan's anchored aiming; Anchor / Release (the small
   extra button above Dodge, the F key); Maw and Hydrojet on one shared recovery; the contextual menu; the Tidal Pool
   registry (create, refresh, replace the oldest available, claim, release, consume, clear); and the animation layer on
   the model's pose channels (the air-swim, banking, the jaw, the transformation's beats, recoil).
     the model:  JAWS_MODEL (the lead, 20k7m), or the stand-in below
     the moves:  self.JAWS_MOVES (worker E, 20k7o), or the stubs below: waterRay, waterBombs, depthCharge, maelstrom,
                 sharkAttack, and the pictures maw / hydrojet / anchor / release / summon / exit
   Every hit goes through ctx.hit / ctx.hitArea / ctx.hitOval: effective damage (after mitigation, without overkill)
   charges the gauge (never Shark Attack's: noCharge), and an area hit also breaks the scenery inside it through
   VEH_SMASH (20k0v). Pools are pictures on the ground: no terrain, navigation or collision change, no damage, no charge.
   The contract with the lead, E and H is in docs/WATER-JAWS-BRIEF.md, Notes (A). */
(() => {
  const U = ELEM_IMPL.water.ult;
  const TAU = Math.PI * 2;
  const COB = '#2F6BFF', CYAN = '#6FE8FF', CYAN2 = '#D6F8FF', DEEP = '#0B2A6B', CHROME = '#DCE6F2', FOAM = '#F2FBFF', WHITE = '#FFFFFF', AMBER = '#FFC860';
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
    dur: [60, 60, 60],          /* s, shared by both forms and their transformations, from the moment the shark can be flown (v321, the user: 60 s at every evo; it was 30 / 45 / 60) */
    cd: 150,                    /* s: the outer cooldown, set once when normal control returns (the spec's) */
    pools: [3, 3, 5], poolR: 1.7, poolSame: 1.5,   /* the most Tidal Pools at once by tier (v321: five at Celestial); a pool's radius; a Water Ray landing this near an existing pool's centre refreshes it */
    autoXf: 5,                  /* (v321) Water Ray casts that made or refreshed a pool before Jaws turns into Leviathan by itself (the count restarts at each Transform back) */
    xfLock: 1.0,                /* s after either change of form before another can start */
    levK: 0.8,                  /* (v321) Leviathan flies too now (no anchoring), at this share of the shark's speed */
    size: 1, petH: 0.6, zoom: 0.92, camLift: 0.4,
    summon: 2.4,
    /* the shark's flight (Nidhogg's): speed = the stat system's movement speed x airK */
    airK: 1.85, accel: 22, brake: 13, cruise: 2.4, wallZ: 3.2, climbV: 5, sinkV: 2.6, margin: 16,
    turn: { max: 6.0, k: 8, acc: 30 },
    aim: { reach: 11, cone: 0.6, cone2: 1.0, reach2: 6 },
    /* Anchor / Release: the space Leviathan needs, the transformation's lengths, its beats (fractions of the way, shark -> Leviathan) */
    anchor: { r: 1.5, nudge: 1.6, dur: 1.45, release: 1.15, turn: 2.1, turnAcc: 4.5, slow: 5,
      beats: [['fins', 0.1], ['flanks', 0.28], ['cannon', 0.48], ['cockpit', 0.64], ['tail', 0.8], ['lock', 0.95]] },
    /* Maw (shark Dodge): the roll, the dive to the target, the bite, the ground-skimming thrash along a curved, lightly
       steerable route (the Sports Car's Drift), the pull back up. One hit per enemy for the whole action */
    maw: { roll: 0.16, dive: 0.26, thrash: 0.58, pull: 0.4, z: 0.55, v: 13, curve: 1.9, steer: 2.4, biteR: 2.1, hitR: 2.0, dmg: 5, kb: 6, inv: 0.38 },
    /* Hydrojet (Leviathan Dodge): a short violent burst along the stick (else straight back), then the hull settles */
    jet: { dist: 4.6, burst: 0.26, settle: 0.3, inv: 0.38 },
    dodgeRec: 0.18,             /* s: the one recovery Maw and Hydrojet share after the action ends (no cooldown beyond it; a form change never resets it) */
    s1Cd: 1.0, s2Cd: 1.5,       /* s from the end of the cast (held from the press): (v321) Water Bombs / Depth Charge share Strong 1, Water Ray / Maelstrom Strong 2; the core's own, E's TUNE does not override them */
    chargeK: [36, 45, 60],      /* the gauge fills at chargeK x DK of damage actually dealt, by tier (H: the session is long, so a single-target fight fills it a little past its middle) */
    finFold: 0.9, finCap: 22, busyCap: 10,
    outGlide: [0.3, 1.3], outSpd: 13, outZ: 1.0, hop: 0.45, dissolve: 0.9,
    freshGap: 0.28, mvHold: 0.6,
  };
  const tierOf = ev => ev >= 7 ? 2 : ev >= 4 ? 1 : 0;

  /* ================= the model: JAWS_MODEL (the lead), or a stand-in so the flow can run ================= */
  const STUBM = (() => {
    const A = {}, put = (n, x, y, z) => { const p = A[n] || (A[n] = { x: 0, y: 0, z: 0 }); p.x = x; p.y = y; p.z = z; };
    return { stub: true, SIZE: { len: 3.2, lenTail: 5, wid: 1.2, widLev: 2.4, r: 1.6 },
      create() { return { pose: { alpha: 1, xf: 0 } }; }, warm() { return true; }, anchor(n) { return A[n] || null; }, anchorDir() { return null; },
      drawShadow(c, x, y, z, a, P, o) { const T = o.T, k = (P.alpha == null ? 1 : P.alpha) * 0.28 / (1 + z * 0.25); if (k < 0.01) return; c.save(); c.globalAlpha = k; c.fillStyle = '#041020'; c.translate(o.sx(x), o.sy(y)); c.rotate(Math.atan2(Math.sin(a) * GY, Math.cos(a))); c.beginPath(); c.ellipse(0, 0, T * 1.9, T * (0.55 + 0.4 * (P.xf || 0)), 0, 0, TAU); c.fill(); c.restore(); },
      draw(c, x, y, z, a, P, o) { const T = o.T, s = o.scale || 1, al = P.alpha == null ? 1 : P.alpha, ca = Math.cos(a), sa = Math.sin(a), w = P.xf || 0;
        const at = (n, lx, ly, lz) => put(n, x + (lx * ca - ly * sa) * s, y + (lx * sa + ly * ca) * GY * s, z + lz * s);
        at('seat', 0.35, 0, 0.55 - 0.25 * w); at('center', 0, 0, 0); at('mouth', 1.7 + 0.5 * w, 0, -0.05); at('head', 1.2, 0, 0.1); at('snout', 1.75, 0, 0.05); at('reactor', -0.2, 0, 0); at('belly', 0, 0, -0.5); at('tailTip', -3.2 + 1.6 * w, 0, 0.1); at('jet', -1.6, 0, 0); at('dorsalTip', -0.3, 0, 1.2); at('finL', 0.2, 1.3, -0.1); at('finR', 0.2, -1.3, -0.1); at('gillL', 0.9, 0.5, 0); at('gillR', 0.9, -0.5, 0);
        if (al < 0.01) return; const X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T, sc = Math.atan2(sa * GY, ca);
        c.save(); c.globalAlpha = al; c.translate(X0, Y0); c.rotate(sc + (P.pitch || 0) * -0.6 * Math.cos(a)); c.scale(1, 1 - 0.25 * Math.abs(P.bank || 0));
        const sw = Math.sin(P.swim || 0) * (P.swimK || 0) * (1 - w);
        c.strokeStyle = COB; c.lineCap = 'round'; c.lineWidth = T * 0.28 * s; c.beginPath(); c.moveTo(-T * 1.4 * s, 0); c.quadraticCurveTo(-T * 2.2 * s * (1 - 0.5 * w), sw * T * 0.5, -T * 3.0 * s * (1 - 0.5 * w), -sw * T * 0.8 + (P.tail || 0) * T); c.stroke();
        c.fillStyle = COB; c.beginPath(); c.ellipse(0, 0, T * 1.65 * s, T * (0.55 + 0.4 * w) * s, 0, 0, TAU); c.fill();
        c.fillStyle = CHROME; c.beginPath(); c.moveTo(T * 1.75 * s, 0); c.lineTo(T * 0.9 * s, -T * 0.42 * s); c.lineTo(T * 0.9 * s, T * 0.42 * s); c.closePath(); c.fill();
        if ((P.jaw || 0) > 0.05 || w > 0.3) { c.fillStyle = (P.charge || 0) > 0.3 ? CYAN : '#0A1830'; c.beginPath(); c.arc(T * (1.5 + 0.4 * w) * s, 0, T * 0.22 * s * (0.5 + (P.jaw || 0) + w * 0.6), 0, TAU); c.fill(); }
        c.fillStyle = '#1D4AC0'; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(T * 0.4 * s, sd * T * 0.4 * s); c.lineTo(-T * 0.5 * s, sd * T * (1.2 + 0.4 * w) * s); c.lineTo(-T * 0.2 * s, sd * T * 0.45 * s); c.closePath(); c.fill(); }
        c.fillStyle = CYAN; c.globalAlpha = al * (0.3 + 0.7 * w) * (P.glow || 0.5); c.fillRect(-T * 0.7 * s, -T * 0.12 * s, T * 0.9 * s, T * 0.24 * s);
        c.restore(); },
    };
  })();
  /* does the model cut itself at a world height (pose.clipZ / o.clipZ)? Asked of M in Notes; without it the core fades the hull as it sinks */
  const canClip = M0 => { try { return !!(M0 && (M0.clip === true || (M0.blankPose && ('waterline' in M0.blankPose() || 'clipZ' in M0.blankPose())))); } catch (e) { return false; } };
  const MOD = () => (typeof JAWS_MODEL !== 'undefined' && JAWS_MODEL && JAWS_MODEL.draw ? JAWS_MODEL : STUBM);

  /* ================= E's moves (looked up at call time), or stubs so the flow can run ================= */
  const STUB = {
    stub: true, TUNE: {}, stats: { rays: 0, bombs: 0, charges: 0, empowered: 0, maelTicks: 0, beam: 0, bite: 0 },
    /* one authored explosion at the aim; a Tidal Pool left there (the core's rules decide whether one is made) */
    waterRay(ctx) { const T = ctx.target(); let t = 0; const f = ctx.H.add({ key: 'jaws-moves', life: 9, update(dt) { if (!ctx.alive()) { f.life = 0; return; } t += dt; if (t < 0.3) { ctx.clip('rayCharge', t / 0.3); return; } ctx.clip('rayFire', cl((t - 0.3) / 0.3));
      if (!f.hit) { f.hit = 1; STUB.stats.rays++; ctx.hitArea(T.x, T.y, 2.2, ctx.DK * 5, { kb: 2 }); ctx.pools.create(T.x, T.y); ctx.X.ring(T.x, T.y, 0.3, 2.2, 0.4, CYAN, 0.3); } if (t >= 0.6) { f.life = 0; ctx.done(); } } }); },
    /* (stand-in for Water Bombs: a sweep from the shark toward the aim, one hit per enemy) */
    waterBombs(ctx) { const V = ctx.vehicle, T = ctx.target(), a = Math.atan2(T.y - V.y, T.x - V.x), x0 = V.x, y0 = V.y, D = Math.max(4, Math.hypot(T.x - x0, T.y - y0)), once = {}; let t = 0; const f = ctx.H.add({ key: 'jaws-moves', life: 9, update(dt) { if (!ctx.alive()) { f.life = 0; return; } t += dt;
      if (t < 0.3) { ctx.clip('waveCoil', t / 0.3); return; } if (!f.dn) { f.dn = 1; STUB.stats.bombs++; ctx.done(); } const u = cl((t - 0.3) / 0.7), x = x0 + Math.cos(a) * D * u, y = y0 + Math.sin(a) * D * u; ctx.clip('waveFlick', cl((t - 0.3) / 0.25));
      for (const m of ctx.mons()) { if (Math.hypot(m.x - x, m.y - y) > 2 + (m.r || 0.4)) continue; const s = once.__seen || (once.__seen = new Set()); if (s.has(m)) continue; ctx.hitArea(m.x, m.y, 0.2, ctx.DK * 4, { once, noSmash: true }); if (!m.boss && !m.still) { m.x += (T.x - m.x) * 0.5; m.y += (T.y - m.y) * 0.5; } } ctx.smashArea(x, y, 1.8); if (u >= 1) f.life = 0; } }); },
    /* a sphere to the aim; onto an available pool it claims it at launch and resolves as one much larger blast, consuming it */
    depthCharge(ctx) { const V = ctx.vehicle, T = ctx.target(), own = {}, pool = ctx.pools.at(T.x, T.y), tx = pool ? pool.x : T.x, ty = pool ? pool.y : T.y; let t = 0, claimed = false; const f = ctx.H.add({ key: 'jaws-moves', life: 9, update(dt) { if (!ctx.alive()) { f.life = 0; ctx.pools.release(own); return; } t += dt;
      if (t < 0.35) { ctx.clip('depthCharge', t / 0.35); return; } if (!f.shot) { f.shot = 1; STUB.stats.charges++; claimed = !!(pool && ctx.pools.claim(pool, own)); ctx.clip('depthFire', 0); ctx.kick('recoil', 9); ctx.done(); }
      if (t >= 0.35 + 0.55) { f.life = 0; if (claimed) { STUB.stats.empowered++; ctx.hitArea(tx, ty, 4.2, ctx.DK * 15, { kb: 5 }); ctx.pools.consume(own); ctx.X.ring(tx, ty, 0.4, 4.2, 0.6, CYAN2, 0.4); } else { ctx.hitArea(tx, ty, 2.6, ctx.DK * 6, { kb: 3 }); ctx.X.ring(tx, ty, 0.3, 2.6, 0.4, CYAN, 0.3); } } } }); void V; },
    /* every available pool claimed at the press: ticks through one registry a tick, one final burst, the pools consumed */
    maelstrom(ctx) { const own = {}, P = ctx.pools.claimAll(own), n = 8, every = 0.4; let t0 = ctx.now() + 0.4, k = 0, t = 0; ctx.maelPlan = { t0, ticks: n, tick: every, pools: P.length };
      const f = ctx.H.add({ key: 'jaws-moves', life: 12, update(dt) { if (!ctx.alive()) { f.life = 0; ctx.pools.release(own); return; } t += dt; ctx.clip('maelstrom', cl(t / (0.4 + n * every))); if (t > 0.6 && !f.dn) { f.dn = 1; ctx.done(); }
        while (k < n && ctx.now() >= t0 + k * every) { k++; STUB.stats.maelTicks++; const once = {}; for (const p of P) { ctx.hitArea(p.x, p.y, p.r + 1.2, ctx.DK * 1.2, { once }); for (const m of ctx.mons()) { const d = Math.hypot(m.x - p.x, m.y - p.y); if (d < p.r + 2.2 && d > 0.3 && !m.boss && !m.still) { m.x += (p.x - m.x) * 0.12; m.y += (p.y - m.y) * 0.12; } } } }
        if (k >= n && ctx.now() >= t0 + n * every + 0.3) { f.life = 0; const once = {}; for (const p of P) { ctx.hitArea(p.x, p.y, p.r + 2, ctx.DK * 6, { once, kb: 4 }); ctx.X.ring(p.x, p.y, 0.4, p.r + 2, 0.5, CYAN2, 0.4); } ctx.pools.consume(own); } } }); },
    /* the starry ocean: the dive, the sky beam (one event), the breach, the jaws' closure (one event) */
    sharkAttack(ctx) { const V = ctx.vehicle; let t = 0; const f = ctx.H.add({ key: 'jaws-moves', life: 14, update(dt) { if (!ctx.alive()) { f.life = 0; return; } t += dt;
      if (t < 1.2) { ctx.clip('attackDive', t / 1.2); if (t > 0.9 && !f.cl) { f.cl = 1; ctx.pools.clear('ocean'); } return; }
      if (!f.beam) { f.beam = 1; STUB.stats.beam++; ctx.hitArea(V.x, V.y, 5, ctx.DK * [35, 42, 46][ctx.tier], { noCharge: true, once: {} }); ctx.X.ring(V.x, V.y, 0.5, 5, 0.6, CYAN2, 0.5); }
      if (t < 2.6) { ctx.clip('attackBreach', (t - 1.2) / 1.4); return; }
      if (!f.bite) { f.bite = 1; STUB.stats.bite++; ctx.clip('bite', 1); ctx.hitArea(V.x, V.y, 9, ctx.DK * [60, 73, 79][ctx.tier], { noCharge: true, once: {}, kb: 6 }); ctx.X.ring(V.x, V.y, 0.5, 9, 0.7, WHITE, 0.6); }
      if (t >= 3.4) { f.life = 0; ctx.safeReturn(); ctx.done(); } } }); },
    maw(ctx, D) { ctx.X.ring(D.tx, D.ty, 0.3, 2, 0.4, CYAN, 0.25); },
    hydrojet(ctx, D) { ctx.X.ring(D.x0, D.y0, 0.3, 1.6, 0.35, FOAM, 0.25); },
  };
  function moves() { let FM = null; try { FM = typeof self !== 'undefined' && self.JAWS_MOVES ? self.JAWS_MOVES : null; } catch (e) { FM = null; } return FM || STUB; }
  const mvFn = name => { const MV = moves(); return typeof MV[name] === 'function' ? [MV, MV[name]] : [STUB, STUB[name]]; };
  const mvTune = (k, d) => { const M = moves(); return M && M.TUNE && typeof M.TUNE[k] === 'number' ? M.TUNE[k] : d; };
  function callMove(S, name, a, b) { const [MV, fn] = mvFn(name); if (!fn) return null; try { return fn.call(MV, S.ctx, a, b); } catch (e) { if (typeof console !== 'undefined') console.warn('Jaws: ' + name + ' failed', e); return null; } }

  /* ================= the animation: targets built each frame, composed through per-channel springs =================
     The channels written to the model's pose (blankPose(): angles in rad):
       xf (0 shark .. 1 Leviathan)   alpha   swim (phase, accumulated)   swimK (stroke size 0..1)   jaw (0..1 open)
       cannon (0..1 extra extension)   recoil (0..1)   bank (+ rolls to its left)   pitch (+ nose up)
       fin (-1..1 trim; the stabilisers' tilt on Hydrojet)   tail (-1..1 extra sweep)   glow (0..2)   charge (mouth glow 0..1)
       breath (slow phase) */
  function spring(S, key, target, w, z, dt) { const A = S.an; let s = A[key]; if (!s) s = A[key] = { x: target, v: 0 }; if (!isFinite(s.x) || !isFinite(s.v)) { s.x = target; s.v = 0; }
    let left = Math.min(dt, 0.1); while (left > 1e-5) { const h = Math.min(left, 1 / 120); s.v += (-2 * z * w * s.v - w * w * (s.x - target)) * h; s.x += s.v * h; left -= h; } return s.x; }
  const kick = (S, key, dv) => { const s = S.an[key]; if (s) s.v += dv; };
  const SPR = { swimK: [6, 0.8], jaw: [20, 0.42], cannon: [12, 0.55], recoil: [26, 0.5], bank: [9, 0.48], pitch: [10, 0.5], fin: [11, 0.5], tail: [9, 0.4], glow: [8, 0.8], charge: [12, 0.8], z: [9, 0.45], glowK: [5, 0.95] };
  const TG = () => ({ glowK: 1, zAbs: null, fwd: 0, swimK: 0.5, jaw: 0, cannon: 0, recoil: 0, bank: 0, pitch: 0, fin: 0, tail: 0, glow: 0.5, charge: 0, z: 0, swimV: 2.4 });
  /* the action clips E plays with ctx.clip(name, u, extra) (u 0..1 each frame while it lasts) */
  const CLIPS = {
    rayCharge(G, u) { G.jaw = 0.75 * sstep(0, 0.6, u); G.charge = u; G.glow = 0.6 + 0.9 * u; G.pitch -= 0.06 * u; G.swimK *= 1 - 0.6 * u; },
    rayFire(G, u) { const k = Math.exp(-u * 4); G.jaw = 0.9; G.charge = k; G.recoil = k; G.pitch += 0.12 * k; G.glow = 0.7 + 0.8 * k; G.swimK *= 0.4; },
    waveCoil(G, u) { G.tail = -0.9 * sstep(0, 1, u); G.bank += 0.35 * u; G.pitch += 0.12 * u; G.swimK *= 1 - 0.7 * u; G.fin = 0.5 * u; },
    waveFlick(G, u) { const k = 1 - sstep(0, 1, u); G.tail = 1.0 * k * (1 - 2 * sstep(0.5, 1, u)); G.bank -= 0.25 * k; G.pitch -= 0.1 * k; G.swimV = 9; G.swimK = 1; },
    depthCharge(G, u) { G.charge = u; G.cannon = 0.6 * u; G.glow = 0.8 + 1.0 * u; G.pitch -= 0.04 * u; },
    depthFire(G, u) { const k = Math.exp(-u * 3.5); G.recoil = k; G.cannon = 1 - 0.6 * (1 - k); G.pitch += 0.08 * k; G.charge = 0.6 * k; G.glow = 1 + 0.6 * k; },
    maelstrom(G, u, s) { const t = s.g.t; G.glow = 1.4 + 0.4 * Math.sin(t * 9); G.charge = 0.5 + 0.3 * Math.sin(t * 7); G.cannon = 0.5; G.pitch += 0.015 * Math.sin(t * 31); G.fin = 0.2 * Math.sin(t * 5); void u; },
    /* Shark Attack's dive: a short climb, the nose over, then down through the surface along its heading, so the snout, the body, the dorsal fin and the tail go under in turn; it stays under until the breach */
    attackDive(G, u, s) { const d0 = s.V.z, a = sstep(0.18, 1, u); G.pitch = 0.25 * bump(u, 0, 0.14, 0.3) - 0.95 * sstep(0.16, 0.5, u) + 0.35 * sstep(0.8, 1, u); G.zAbs = 0.5 * bump(u, 0, 0.16, 0.36) - (d0 + 2.9) * a * a; G.fwd = 2.2 * sstep(0.1, 1, u); G.jaw = 0.25 * u; G.swimV = 9; G.swimK = 1; G.glow = 1 + 0.5 * u; s.subU = u; if (u > 0.9) s.under = true; },
    /* the breach through the centre of the jaws: straight up out of the water nose first, over the top, levelling as it comes back to its height */
    attackBreach(G, u, s) { const d0 = s.V.z, up = sstep(0, 0.55, u); s.under = false; s.breached = true; G.pitch = 1.2 * (1 - sstep(0.45, 1, u)) - 0.12 * bump(u, 0.6, 0.8, 1); G.zAbs = lerp(-(d0 + 2.9), 1.3, up) - 1.3 * sstep(0.6, 1, u); G.fwd = 2.2 * (1 - sstep(0, 0.5, u)); G.jaw = 1; G.swimV = 10; G.swimK = 1; G.glow = 1.7; G.charge = 0.6; },
    bite(G, u) { G.jaw = 1 - sstep(0, 0.15, u); G.glow = 2 - u; },
  };
  /* E's names for the same clips (20k7o) */
  Object.assign(CLIPS, { cannonCharge: CLIPS.depthCharge, cannonFire: CLIPS.depthFire, tailFlick: CLIPS.waveFlick, tailCoil: CLIPS.waveCoil, dive: CLIPS.attackDive, breach: CLIPS.attackBreach });
  function eClip(S) { const E = S.eAct; return E && S.g.t - E.t <= 0.12 && CLIPS[E.clip] ? E : null; }
  function animate(S, dt) {
    const V = S.V, P = V.pose, g = S.g, t = g.t, G = TG(), top = Math.max(1, S.spd * TUNE.airK), sp = Math.hypot(V.vx, V.vy), k = cl(sp / top), w = P.xf || 0, M = S.maw, J = S.jet, X = S.xfm;
    /* --- the shark swims the air: the tail's strokes quicken and widen with speed, it banks into the turn, the fins trim --- */
    G.swimK = (0.32 + 0.68 * k) * (1 - w); G.swimV = 2.2 + 5.2 * k;
    G.bank = clamp(S.hw * 0.085 * (0.4 + 0.6 * k), -0.55, 0.55) * (1 - 0.7 * w); G.fin = clamp(S.hw * 0.12, -1, 1) * (1 - w); G.tail = clamp(-S.hw * 0.1, -0.7, 0.7) * (1 - w);
    const vz = dt > 0 ? (V.z - (S.pz == null ? V.z : S.pz)) / dt : 0; S.pz = V.z; G.pitch = clamp(vz * 0.07, -0.3, 0.3) * (1 - w);
    G.glow = 0.5 + 0.2 * k + 0.5 * w + (S.charge >= 1 && !S.used ? 0.3 + 0.15 * Math.sin(t * 5) : 0); G.jaw = 0.04 + 0.03 * Math.sin(t * 1.3);
    /* Leviathan: heavy and still, a slow breathing bob, a little list as it turns */
    if (w > 0.5) { G.z += 0.05 * Math.sin(t * 1.1) * w; G.bank += clamp(S.hw * 0.03, -0.08, 0.08); }
    /* --- the transformation: the shark slows and braces, the beats seat one by one (stepXform kicks them) --- */
    if (X) { G.swimK *= 1 - sstep(0, 0.2, X.u); G.pitch += (X.to === 'leviathan' ? -0.06 : 0.08) * Math.sin(Math.PI * X.u); G.fin = (X.to === 'leviathan' ? 1 : -0.4) * bump(X.u, 0.02, 0.14, 0.4); G.jaw = 0.5 * bump(X.u, 0.35, 0.5, 0.7); G.glow = 0.9 + 0.5 * Math.sin(Math.PI * X.u); }
    /* --- Maw: the roll, jaws wide in the dive, the snap, the body whipping through the thrash, the pull up --- */
    if (M) { const T = TUNE.maw;
      if (M.ph === 0) { const u = cl(M.t / T.roll); G.bank = M.dir * 0.6 * u; G.jaw = 0.8 * u; G.pitch = -0.2 * u; G.swimV = 8; G.swimK = 1; }
      else if (M.ph === 1) { G.bank = M.dir * 0.35; G.jaw = 1; G.pitch = -0.75; G.swimV = 10; G.swimK = 1; G.glow = 1.2; }
      else if (M.ph === 2) { const u = cl(M.t / T.thrash), wv = Math.sin(u * Math.PI * 5); G.jaw = 0.15 + 0.25 * Math.max(0, wv); G.bank = M.dir * 0.3 + 0.4 * wv; G.tail = -M.dir * 0.5 + 0.9 * wv; G.fin = -wv; G.pitch = -0.08; G.swimV = 16; G.swimK = 1; G.glow = 1.3; }
      else { const u = cl(M.t / T.pull); G.pitch = 0.55 * (1 - u); G.jaw = 0.1; G.swimV = 7; G.swimK = 1; G.bank = M.dir * 0.15 * (1 - u); } }
    /* --- Hydrojet: the stabilisers tilt into the burst, the hull heels, then settles as one mass --- */
    if (J) { const T = TUNE.jet, u = J.ph === 0 ? cl(J.t / T.burst) : 1, sd = Math.sin(wrap(J.a - V.heading)), fw = Math.cos(wrap(J.a - V.heading)); G.fin = (J.ph === 0 ? 1 : 0.3) * (sd >= 0 ? 1 : -1) * (0.4 + 0.6 * Math.abs(sd)); G.bank += -0.3 * sd * (J.ph === 0 ? 1 : 0.2); G.pitch += -0.14 * fw * (J.ph === 0 ? 1 - 0.5 * u : 0); G.glow = 1.3; }
    /* --- the summon and the exit --- */
    if (S.phase === 'summon') { const u = cl(S.t / TUNE.summon); G.pitch = (S.emerge ? 1.15 : 0.5) * (1 - sstep(S.emerge ? 0.45 : 0.3, 0.95, u)); G.jaw = 0.5 * bump(u, 0.1, 0.3, 0.6); G.swimK = 0.2 + 0.5 * u; G.glow = 0.3 + 1.2 * bump(u, 0.5, 0.75, 1) + 0.3 * u; }
    /* --- the baby-blue glow (M's glowK): low between attacks, up through every attack, charge and Shark Attack, easing back (a slow spring) --- */
    G.glowK = 1 + 0.1 * k + 0.1 * w + (S.charge >= 1 && !S.used ? 0.15 + 0.1 * Math.sin(t * 5) : 0);   /* (M: 1 is the rest, up to 2.5) */
    if (S.busy) G.glowK = 1.6; if (M) G.glowK = Math.max(G.glowK, M.ph >= 1 ? 1.6 : 1.3); if (J) G.glowK = Math.max(G.glowK, 1.6); if (X) G.glowK = Math.max(G.glowK, 1.3); if (S.phase === 'finisher') G.glowK = 2.5;
    /* --- E's clip, last: it owns the channels it sets --- */
    const E = eClip(S); if (E) { try { CLIPS[E.clip](G, E.u, S, E.extra); } catch (e) { /* (a clip never breaks the frame) */ } if (/Charge|charge|maelstrom|Fire|fire/.test(E.clip)) G.glowK = Math.max(G.glowK, 2.0); }
    /* under E's ocean between the dive and the breach: held below the surface, gliding */
    if (S.phase !== 'finisher') S.under = false; else if (S.under && G.zAbs == null) { G.zAbs = -(V.z + 2.9); G.fwd = 2.2; G.pitch = 0.35; G.swimK = 0.6; G.jaw = 0.1; }
    for (const key in SPR) { const p = SPR[key]; P[key] = spring(S, key, G[key], p[0], p[1], dt); }
    if (G.zAbs != null) { const zs = S.an.z; zs.x = G.zAbs; zs.v = 0; P.z = G.zAbs; }   /* (a whole-body move: exact, not sprung) */
    S.fwd = (S.fwd || 0) + (G.fwd - (S.fwd || 0)) * Math.min(1, dt * 14);
    S.swimV = S.swimV == null ? G.swimV : S.swimV + (G.swimV - S.swimV) * Math.min(1, dt * 6); S.swim = (S.swim || 0) + S.swimV * dt; P.swim = S.swim; P.breath = t * 1.2;
    P.swimK = cl(P.swimK); P.jaw = cl(P.jaw); P.cannon = cl(P.cannon); P.recoil = cl(P.recoil); P.fin = clamp(P.fin, -1, 1); P.tail = clamp(P.tail, -1.2, 1.2); P.glow = clamp(P.glow, 0, 2); P.charge = cl(P.charge); P.glowK = clamp(P.glowK, 0, 2.5);
    S.zOff = P.z || 0; P.z = 0; P.t = t; P.speed = k;
    const C2 = S.eCh; if (C2 && t - C2.t <= 0.12) { for (const key in C2.o) if (key !== 'alpha' && key !== 'xf') P[key] = C2.o[key]; }
    /* the waterline: E's ocean (ctx.waterline / JAWS_MOVES.waterline(ctx), a world height while the shark is under) and the
       summon's ring. The model is cut there when it can be (pose.clipZ); else the hull fades as its middle goes under */
    let wl = null; if (S.phase === 'finisher') { try { const MV = moves(); wl = S.ctx.waterline != null ? S.ctx.waterline : typeof MV.waterline === 'function' ? MV.waterline(S.ctx) : null; } catch (e) { wl = null; } } else if (S.phase === 'summon' && S.emerge) wl = 0.04;
    S.waterline = wl != null && isFinite(wl) ? wl : null;
    if (S.waterline != null) { P.clipZ = P.waterline = S.waterline; if (!S.clipOK && S.phase === 'finisher') { S.sunkA = cl((V.z + (S.zOff || 0) - S.waterline + 0.55) / 1.1); P.alpha = Math.min(P.alpha == null ? 1 : P.alpha, S.sunkA); S.sunk = true; } }
    else { if (P.clipZ != null || P.waterline != null) P.clipZ = P.waterline = null; if (S.sunk) { S.sunk = false; if (S.phase === 'finisher') P.alpha = 1; } }
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
  function smashCb(S) { return S._smCb || (S._smCb = (x, y) => { S.stats.smashed++; splash(S, x, y, 0.3, lowFx() ? 3 : 7, 3); }); }
  const smashArea = (S, x, y, r, ox, oy) => S.vs.props ? S.vs.circle(x, y, r, smashCb(S), ox, oy) : 0;
  const smashOval = (S, cx, cy, rx, ry, ang, ox, oy) => S.vs.props ? S.vs.oval(cx, cy, rx, ry, ang, smashCb(S), ox, oy) : 0;

  /* ================= THE TIDAL POOLS: the registry (at most TUNE.pools; pictures only) =================
     A record: { id, x, y, r, born, t (last refreshed), state: 'available' | 'claimed' | 'consumed', owner }.
     - create(x, y, r?) -> the pool made or refreshed, or null (pools.last.how says which: 'new' | 'refresh' | 'claimed' |
       'full' | 'invalid' | 'closed'): on valid ground only. Near an existing pool (within poolSame of its centre) it refreshes that one
       (never a second on the same spot; a claimed one is left as it is). Else a new pool while fewer than the limit are
       live; else it replaces the OLDEST AVAILABLE; when every slot is claimed nothing is made. Returns { pool, how }.
     - claim(pool | id, owner): available -> claimed for that owner (any value; kept through Release). claimAll(owner).
     - release(pool | id | owner): a cancelled cast gives its claims back (claimed -> available).
     - consume(pool | id | owner): the attack resolved; the pool is gone.
     - clear(why): every pool and reservation gone (the exit; Shark Attack's ocean).
     Claimed pools count toward the limit. Nothing here deals damage or charges the gauge. */
  function poolApi(S) {
    const g = S.g, L = S.pools, live = () => L.filter(p => p.state !== 'consumed'), find = q => (q && q.id != null && q.state) ? (L.indexOf(q) >= 0 ? q : L.find(p => p.id === q.id) || null) : typeof q === 'number' ? L.find(p => p.id === q) || null : null;
    const drop = p => { p.state = 'consumed'; p.owner = null; p.goneT = g.t; const i = L.indexOf(p); if (i >= 0) L.splice(i, 1); S.poolLog.push(p); if (S.poolLog.length > 12) S.poolLog.shift(); };
    const A = {
      get max() { return S.poolMax; }, get r() { return TUNE.poolR; },
      list: () => L.slice(), available: () => L.filter(p => p.state === 'available'), claimed: owner => L.filter(p => p.state === 'claimed' && (owner == null || p.owner === owner)),
      count: () => ({ total: L.length, available: L.filter(p => p.state === 'available').length, claimed: L.filter(p => p.state === 'claimed').length }),
      /* the AVAILABLE pool whose surface holds (x, y) (the nearest), or null; { any: true } also returns a claimed one; { r } widens the catch */
      at: (x, y, o) => { let best = null, bd = 1e9; for (const p of L) { if (!(o && o.any) && p.state !== 'available') continue; const d = Math.hypot(p.x - x, p.y - y); if (d <= ((o && o.r) || p.r) && d < bd) { bd = d; best = p; } } return best; },
      valid: (x, y) => inMap(S, x, y) && groundAt(S, x, y),
      snap: (x, y, maxR) => { if (A.valid(x, y)) return { x, y }; for (let r = 0.3; r <= (maxR || 1.5) + 1e-6; r += 0.3) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (A.valid(px, py)) return { x: px, y: py }; } return null; },
      create: (x, y, r) => { const R = (how, pool) => { A.last = { how, pool: pool || null, t: g.t }; return how === 'new' || how === 'refresh' ? pool : null; };
        if (!alive(S) || S.phase === 'finisher') return R('closed');
        if (!A.valid(x, y)) { const q = A.snap(x, y); if (!q) { S.stats.poolInvalid++; return R('invalid'); } x = q.x; y = q.y; }   /* (an impact on a wall's edge or a gap's lip: the pool forms on the nearest ground, within 1.5 tiles) */
        let near = null, nd = 1e9; for (const p of L) { const d = Math.hypot(p.x - x, p.y - y); if (d <= TUNE.poolSame && d < nd) { nd = d; near = p; } }
        if (near) { if (near.state === 'available') { near.t = g.t; near.refreshed = (near.refreshed || 0) + 1; S.stats.poolsRefreshed++; poolCast(S); return R('refresh', near); } S.stats.poolBlocked++; return R('claimed', near); }
        if (L.length >= S.poolMax) { let old = null; for (const p of L) if (p.state === 'available' && (!old || p.born < old.born)) old = p; if (!old) { S.stats.poolFull++; return R('full'); } drop(old); old.how = 'replaced'; S.stats.poolsReplaced++; }
        const p = { id: ++S.poolId, x, y, r: r > 0.5 && r < 4 ? r : TUNE.poolR, born: g.t, t: g.t, state: 'available', owner: null, refreshed: 0 }; L.push(p); S.stats.poolsMade++; poolCast(S); return R('new', p); },
      claim: (q, owner) => { const p = find(q); if (owner == null) owner = 'cast'; if (!p || p.state !== 'available') return null; p.state = 'claimed'; p.owner = owner; p.claimT = g.t; S.stats.poolClaim++; return p; },
      claimAll: owner => { const out = []; if (owner == null) return out; for (const p of L) if (p.state === 'available') { p.state = 'claimed'; p.owner = owner; p.claimT = g.t; S.stats.poolClaim++; out.push(p); } return out; },
      release: q => { let n = 0; const one = find(q); for (const p of L) if (p.state === 'claimed' && (one ? p === one : p.owner === q)) { p.state = 'available'; p.owner = null; S.stats.claimsReleased++; n++; } return n; },
      consume: q => { let n = 0; const one = find(q); for (const p of L.slice()) if (one ? p === one : (p.state === 'claimed' && p.owner === q)) { drop(p); p.how = 'consumed'; S.stats.poolsConsumed++; n++; } return n; },
      clear: why => { let n = 0; for (const p of L.slice()) { drop(p); p.how = why || 'cleared'; n++; } if (n) S.stats.poolClear += n; return n; },
    };
    return A;
  }
  /* (v321) a Water Ray cast that made or refreshed a pool: the fifth turns the shark into Leviathan, once, by itself */
  function poolCast(S) { S.poolCasts++; S.stats.poolCasts = S.poolCasts; if (!S.autoDone && S.form === 'shark' && S.poolCasts >= TUNE.autoXf) S.autoXf = true; }
  /* the indicators: 'available' | 'claimed' | 'empty', oldest first (three, five at Celestial) */
  const poolPips = S => { const out = S.pools.map(p => p.state); while (out.length < S.poolMax) out.push('empty'); return out.slice(0, S.poolMax); };

  /* ================= the session ================= */
  function startForm(C, H) {
    const me = H.me, g = H.g, X = H.X, M0 = MOD(), ev = evoOf(C), tier = tierOf(ev), K = C.K || 1, DK = C.base * K * (1 + 0.08 * (ev - 1));
    const kit = X.kit ? X.kit() : null, CD = (kit && kit.ult && kit.ult.key === 'ey_jaws' && kit.ult.cd) || TUNE.cd, dur = TUNE.dur[tier];
    let inst; try { inst = M0.create({ T: X.Tz() * TUNE.zoom * ((typeof arc !== 'undefined' && arc.dpr) || 1) * TUNE.size, dpr: 1 }); } catch (e) { inst = null; } if (!inst || !inst.pose) inst = { pose: {} };
    const P = inst.pose; P.alpha = 0; P.xf = 0;
    const tgt = X.nearestMon(me.x, me.y, 9), a0 = tgt ? Math.atan2(tgt.y - me.y, tgt.x - me.x) : (me.face < 0 ? Math.PI : 0);
    const V = { x: me.x, y: me.y, z: 0.6, heading: a0, vx: 0, vy: 0, pose: P, form: 'shark', locked: true, vis: 1 };
    const S = { H, g, me, X, C, ev, tier, DK, CD, dur, V, inst, size: TUNE.size, phase: 'summon', form: 'shark', menu: null, t: 0, left: dur, endT: null, charge: 0, used: false, busy: null, busyT: 0, cd: { s1: 0, s2: 0, dodge: 0 }, cdMax: {},
      maw: null, jet: null, xfm: null, mvQ: null, dQ: null, ultQ: null, xQ: null, press: { ult: -9, strong: -9, strong2: -9, extra: -9 }, ha: a0, au: a0, hw: 0, an: {}, zOff: 0, eAct: null, eCh: null, cam: null,
      pools: [], poolLog: [], poolId: 0, poolMax: TUNE.pools[tier], poolCasts: 0, autoDone: false,
      parts: [], free: [], marks: [], ended: false, released: false, pet: X.pet ? X.pet() : null, air: airOf(X), home: { x: me.x, y: me.y }, safe: { x: me.x, y: me.y }, safeT: 0, reachT: 2, sfxT: 0, mx: 0, my: 0, spd: 4.3,
      vs: VEH_SMASH.create(X, g),
      stats: { autoXf: 0, poolCasts: 0, maws: 0, mawHits: 0, mawBad: 0, mawSmash: 0, hydrojets: 0, anchors: 0, releases: 0, anchorBad: 0, switches: 0, menuSets: 0, timerSets: 0, ray: 0, bombs: 0, depth: 0, mael: 0, maelRefused: 0, shark: 0, smashed: 0, cdSet: 0, dealt: 0, charged: 0, hits: 0,
        flyT: 0, siegeT: 0, xfT: 0, offT: 0, offshoreExit: 0, poolsMade: 0, poolsRefreshed: 0, poolsReplaced: 0, poolClaim: 0, claimsReleased: 0, poolsConsumed: 0, poolClear: 0, poolFull: 0, poolBlocked: 0, poolInvalid: 0 } };
    S.clipOK = canClip(M0); S.emerge = S.clipOK;   /* (with a model that cuts at a height, the summon is a real emergence through the ring: snout and teeth first) */
    buildReach(S, me.x, me.y);
    Object.defineProperty(S, 'xf', { get: () => S.V.pose.xf || 0 });
    g._jaws = S;
    const pools = poolApi(S);
    const ctx = S.ctx = { X, H, C, g, evo: ev, tier, DK, model: M0, poseObj: P, CLIPS, TUNE, sfx: X.sfx || {}, pools, pool: pools, finisher: null, attackPlan: null, maelPlan: null,
      get vehicle() { return S.V; }, get form() { return S.form; }, get anchored() { return S.phase === 'siege'; }, get xf() { return S.V.pose.xf || 0; }, get maw() { return S.maw ? S.maw.info : null; }, get jet() { return S.jet ? S.jet.info : null; }, get transform() { return S.xfm ? S.xfm.info : null; },
      get charge() { return S.charge; }, get left() { return S.left; }, get phase() { return S.phase; },
      now: () => g.t,
      hit: (m, dmg, o) => hitCharge(S, m, dmg, o),
      hitArea: (x, y, r, dmg, o) => { let n = 0; const once = o && o.once; for (const m of H.living()) { if (Math.hypot(m.x - x, m.y - y) >= r + (m.r || 0.4)) continue; if (once && seen(once, m)) continue; if (hitCharge(S, m, dmg, o) > 0) n++; } if (!(o && o.noSmash) && alive(S)) smashArea(S, x, y, r, o && o.ox, o && o.oy); return n; },
      hitOval: (cx, cy, rx, ry, ang, dmg, o) => { let n = 0; const once = o && o.once, ca = Math.cos(ang), sa = Math.sin(ang); for (const m of H.living()) { const dx = m.x - cx, dy = m.y - cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca, pr = m.r || 0.4; if ((u * u) / ((rx + pr) ** 2) + (v * v) / ((ry + pr) ** 2) >= 1) continue; if (once && seen(once, m)) continue; if (hitCharge(S, m, dmg, o) > 0) n++; } if (!(o && o.noSmash) && alive(S)) smashOval(S, cx, cy, rx, ry, ang, o && o.ox, o && o.oy); return n; },
      smashArea: (x, y, r, ox, oy) => alive(S) ? smashArea(S, x, y, r, ox, oy) : 0, smashOval: (cx, cy, rx, ry, ang, ox, oy) => alive(S) ? smashOval(S, cx, cy, rx, ry, ang, ox, oy) : 0,
      /* the one authority on displacement: true only for an enemy that may be pushed or pulled (bosses of every rank, rooted and fixed things never; they still take the damage) */
      movable: m => movable(m),
      mons: () => H.living(), target: () => target(S), aimPoint: () => aimPoint(S) || { x: S.V.x, y: S.V.y }, aimDir: () => { const m = Math.hypot(S.mx, S.my); return S.phase === 'siege' ? S.V.heading : m > 0.2 ? Math.atan2(S.my, S.mx) : S.V.heading; }, stick: () => ({ x: S.mx, y: S.my, mag: Math.min(1, Math.hypot(S.mx, S.my)) }),
      groundAt: (x, y) => groundAt(S, x, y), canStand: (x, y) => canStand(S, x, y), nearestLand: (x, y) => nearestLand(S, x, y, 8) || safeReturn(S), inVolume: (x, y) => inVolume(S, x, y), wallAt: (x, y, r) => wallNear(S, x, y, r == null ? 0.4 : r),
      anchor: n => { let p = null; try { p = M0.anchor ? M0.anchor(n) : null; } catch (e) { p = null; } if (p && isFinite(p.x) && isFinite(p.y)) return { x: p.x, y: p.y, z: p.z || 0 }; const V2 = S.V, f = n === 'mouth' || n === 'snout' ? 1.8 : n === 'jet' || n === 'tailTip' ? -1.8 : 0; return { x: V2.x + Math.cos(V2.heading) * f, y: V2.y + Math.sin(V2.heading) * f * GY, z: V2.z + (n === 'seat' ? 0.5 : 0) }; },
      scr: (x, y, z) => [H.sx(x), H.sy(y) - (z || 0) * ZK * X.Tz()], T: () => X.Tz(),
      camera: o => { if (!o) { S.cam = null; return; } if (o.shake && !calm()) X.shake(Math.min(10, o.shake), Math.min(0.5, o.dur || 0.25)); const c0 = S.cam || {}; S.cam = { zoom: o.zoom != null ? clamp(o.zoom, 0.5, 1.1) : c0.zoom, x: o.x != null ? o.x : c0.x, y: o.y != null ? o.y : c0.y, k: o.k != null ? cl(o.k) : c0.k }; },
      clip: (name, u, extra) => { if (name === 'rest' || !name) { S.eAct = null; return; } const E = S.eAct || (S.eAct = {}); E.clip = name; E.u = cl(u); E.extra = extra || null; E.t = g.t; },
      pose: (name, u, extra) => ctx.clip(name, u, extra), setPose: o => { if (o) S.eCh = { o: Object.assign({}, o), t: g.t }; },
      chan: o => { S.eCh = { o, t: g.t }; }, kick: (key, dv) => kick(S, key, dv),
      notice: (text, col) => { S.noticeT = g.t; X.text(S.V.x, S.V.y - 2.8, String(text), col || CYAN2, 12, { life: 1.3, max: 1.3, vy: -0.5 }); if (X.sfx && X.sfx.wrong) X.sfx.wrong(); },
      toggleForm: () => { if (S.form === 'leviathan') { tryExtra(S, false, true); return; } S.poolCasts = Math.max(S.poolCasts, TUNE.autoXf); S.autoXf = true; },   /* (a test hook: in the shark as if the fifth pool had been cast; in Leviathan the TRANSFORM button) */ pips: () => poolPips(S),
      vanish: () => { S.V.vis = 0; }, safeReturn: () => { const p = safeReturn(S); S.retPt = p; return { x: p.x, y: p.y }; },
      done: () => actionDone(S), alive: () => alive(S), calm, low: lowFx };
    S.veh = { get active() { return !S.released; }, drive: (mx, my, dt, spd) => { S.mx = mx; S.my = my; if (spd > 0) S.spd = spd; void dt; }, dodge: (mx, my) => tryDodge(S, mx, my), strong: slot => tryMove(S, slot), ult: () => tryUlt(S),
      /* Anchor / Release: the small extra button (the vehicle layout's slot above Dodge: touch, and its J key) and the F key
         (the attack key; the form has no basic attack, so 20b's basic-attack hook carries it: a key press only, never a tap on the screen) */
      /* (v321) TRANSFORM: the Jump slot and its J key, in Leviathan only (back to the shark); in the shark the slot is empty */
      get jump() { return S.form === 'leviathan' || S.phase === 'xform' ? (() => { if (S.form === 'leviathan') tryExtra(S); }) : null; },
      drawBtns: (c, o) => drawBtns(S, c, o), onSwitch: () => finish(S, 'swap'), cam: () => camFocus(S) };
    X.vehicle(S.veh);
    const F = S.fx = H.add({ key: 'jaws', life: 1e9, entY: me.y, update(dt) { step(S, dt); }, drawUnder(c) { drawUnder(S, c); }, drawEnt(c) { drawEnt(S, c); }, draw(c) { drawOver(S, c); }, onEnd() { if (!S.released) release(S); } });
    me.petAlt = F;
    const sfx = X.sfx || {}; if (sfx.note) { [392, 523, 659, 784].forEach((f, i) => sfx.note(f, 0.5, 'sine', 0.05, f * 1.01, i * 0.12)); sfx.note(65, 1.2, 'sawtooth', 0.04, 98, 0.3); } if (sfx.hiss) sfx.hiss(0.8, 0.06, 700);
    callMove(S, 'summon', { x: me.x, y: me.y, dur: TUNE.summon });
    return S;
  }
  const seen = (once, m) => { const s = once.__seen || (once.__seen = new Set()); if (s.has(m)) return true; s.add(m); return false; };
  /* alive: the session runs and an action may go on (a committed Shark Attack stays alive, even on a won floor, up to its cap) */
  function alive(S) { const me = S.me, g = S.g; if (S.ended || S.released || me.dead || g.over) return false; if (S.phase === 'finisher') return S.t < TUNE.finCap; return (S.phase === 'fly' || S.phase === 'siege' || S.phase === 'xform') && !g.won; }
  const movable = m => !!m && !m.dead && !m.falling && !m.boss && !m.lesser && !m.mini && !m.fiend && !m.still && !m.fobj && !m.rooted && !m.immovable && !m.fixed && !m.under && !(m.root > 0);
  const ctrl = S => S.phase === 'fly' || S.phase === 'siege';
  /* the camera frames the form itself: centred on the model's drawn centre, a little under the screen's middle, led by its velocity */
  function camFocus(S) { const V = S.V, c = S.cam, z = S.phase === 'summon' ? lerp(1, TUNE.zoom, sstep(0.3, TUNE.summon, S.t)) : S.phase === 'gone' ? 1 : S.phase === 'out' ? lerp(TUNE.zoom, 1, sstep(0, 1, (S.outT || 0) / 1.2)) : TUNE.zoom;
    if (c && c.x != null) return { x: c.x, y: c.y, k: c.k != null ? c.k : 0.6, zoom: c.zoom || z };
    if (S.phase === 'gone') return { x: V.x, y: V.y, k: 0, zoom: 1 };
    const own = S.phase === 'summon' ? sstep(0.2, 1.4, S.t) : S.phase === 'out' ? 1 - sstep(0, 1, (S.outT || 0) / 1.2) : 1, by = V.y - (V.z + (S.zOff || 0)) * ZK;   /* (the hull's middle is the model's origin: no anchor needed, so it never lags a frame) */
    return { x: V.x + (V.vx || 0) / 6 * own, y: V.y + (by - V.y - TUNE.camLift + (V.vy || 0) / 6) * own, k: Math.max(0.02, own), zoom: c && c.zoom ? c.zoom : z }; }

  /* ---- targeting (Nidhogg's): an enemy near the stick's aim line, else the ground along it; no stick: the nearest ---- */
  function target(S) { const d = S.V, mag = Math.hypot(S.mx, S.my), M = S.H.living(), D = TUNE.aim;
    /* Leviathan aims with its hull: the enemy nearest its line of fire, else an available pool on that line, else the ground along it */
    if (S.phase === 'siege' || (S.phase === 'xform' && S.form === 'leviathan')) { const a = d.heading; let best = null, bs = 1e9;
      for (const [cone, reach] of [[0.45, D.reach + 2], [0.9, D.reach]]) { for (const m of M) { const dx = m.x - d.x, dy = m.y - d.y, dist = Math.hypot(dx, dy); if (dist > reach) continue; const off = Math.abs(wrap(Math.atan2(dy, dx) - a)); if (off > cone + (dist < 2 ? 0.8 : 0)) continue; const sc = dist + off * 6; if (sc < bs) { bs = sc; best = m; } } if (best) return { x: best.x, y: best.y, m: best }; }
      let bp = null; bs = 1e9; for (const p of S.pools) { if (p.state !== 'available') continue; const dx = p.x - d.x, dy = p.y - d.y, dist = Math.hypot(dx, dy), off = Math.abs(wrap(Math.atan2(dy, dx) - a)); if (dist > D.reach + 2 || (off > 0.6 && dist > p.r + 1)) continue; const sc = dist + off * 6; if (sc < bs) { bs = sc; bp = p; } } if (bp) return { x: bp.x, y: bp.y, m: null, pool: bp };
      for (const r of [5, 4, 6, 3, 7, 2]) { const x = d.x + Math.cos(a) * r, y = d.y + Math.sin(a) * r; if (groundAt(S, x, y)) return { x, y, m: null }; } return { x: d.x + Math.cos(a) * 5, y: d.y + Math.sin(a) * 5, m: null }; }
    if (mag > 0.2) { const a = Math.atan2(S.my, S.mx); for (const [cone, reach] of [[D.cone, D.reach + 2], [D.cone2, D.reach2]]) { let best = null, bs = 1e9; for (const m of M) { const dx = m.x - d.x, dy = m.y - d.y, dist = Math.hypot(dx, dy); if (dist > reach) continue; const off = Math.abs(wrap(Math.atan2(dy, dx) - a)); if (off > cone + (dist < 2 ? 0.8 : 0)) continue; const s = dist + off * 6; if (s < bs) { bs = s; best = m; } } if (best) return { x: best.x, y: best.y, m: best }; } }
    else { let best = null, bd = 11; for (const m of M) { const dist = Math.hypot(m.x - d.x, m.y - d.y); if (dist < bd) { bd = dist; best = m; } } if (best) return { x: best.x, y: best.y, m: best }; }
    const p = aimPoint(S); if (p) return { x: p.x, y: p.y, m: null };
    { let best = null, bd = D.reach + 1; for (const m of M) { const dist = Math.hypot(m.x - d.x, m.y - d.y); if (dist < bd) { bd = dist; best = m; } } if (best) return { x: best.x, y: best.y, m: best }; }
    return { x: d.x + Math.cos(d.heading) * 4, y: d.y + Math.sin(d.heading) * 4, m: null }; }
  function aimPoint(S) { const d = S.V, mag = Math.hypot(S.mx, S.my);
    if (mag > 0.2) { const a = Math.atan2(S.my, S.mx), ca = Math.cos(a), sa = Math.sin(a); const p0 = { x: d.x + ca * 4.5, y: d.y + sa * 4.5 }; if (groundAt(S, p0.x, p0.y)) return p0;
      for (let s = 2; s <= TUNE.aim.reach; s += 0.35) { const x = d.x + ca * s, y = d.y + sa * s; if (groundAt(S, x, y)) return { x, y }; } return null; }
    let T = null, bd = 9; for (const m of S.H.living()) { const dist = Math.hypot(m.x - d.x, m.y - d.y); if (dist < bd) { bd = dist; T = m; } } if (T) return { x: T.x, y: T.y };
    const ca = Math.cos(d.heading), sa = Math.sin(d.heading); for (const s of [3, 2, 4, 1, 0]) { const x = d.x + ca * s, y = d.y + sa * s; if (groundAt(S, x, y)) return { x, y }; } return null; }

  /* ---- damage and the one gauge: each event once, after mitigation, without overkill ---- */
  function hitCharge(S, m, dmg, o) {
    if (!m || m.dead || m.falling || !(dmg > 0) || S.ended) return 0;
    const before = Math.max(0, m.hp), oo = Object.assign({ el: 'water', src: 'ult' }, o || {}); delete oo.noCharge; delete oo.once; delete oo.noSmash; delete oo.ox; delete oo.oy;
    const r = S.X.hitMon(m, dmg, oo), dealt = Math.max(0, Math.min(r || 0, before));
    if (!(dealt > 0)) return 0;
    S.stats.dealt += dealt; S.stats.hits++;
    if (!(o && o.noCharge) && S.phase !== 'finisher' && !S.used) { const c0 = S.charge; S.charge = Math.min(1, S.charge + dealt / (TUNE.chargeK[S.tier] * S.DK)); S.stats.charged += S.charge - c0;
      if (c0 < 1 && S.charge >= 1) { const sfx = S.X.sfx || {}; if (sfx.note) [523, 784, 1047, 1568].forEach((f, i) => sfx.note(f, 0.4, 'triangle', 0.06, f, i * 0.07)); S.X.text(S.V.x, S.V.y - 3, 'SHARK ATTACK READY', CYAN2, 15, { life: 1.4, max: 1.4, vy: -0.5 }); kick(S, 'glow', 8); kick(S, 'jaw', 6); } }
    return dealt;
  }
  function setHeading(S, a, dt) { const da = wrap(a - S.ha); S.ha = wrap(a); S.au += da; S.hw = dt > 0 ? da / dt : 0; }
  function steer(S, dt, want, mag) { const T = TUNE.turn; let wT = 0;
    if (want != null) { const off = wrap(want - S.ha); wT = clamp(off * T.k / T.max, -1, 1) * T.max * (0.6 + 0.4 * Math.min(1, mag)); }
    const lim = T.acc * dt, w = S.hw + clamp(wT - S.hw, -lim, lim); S.hw = w; S.ha = wrap(S.ha + w * dt); S.au += w * dt; }
  function syncMe(S) { const me = S.me, d = S.V; me.x = d.x; me.y = d.y; me.vx = d.vx; me.vy = d.vy; me.z = 0; me.airborne = S.phase !== 'gone' && !(S.phase === 'summon' && d.z < 0.9); const c = Math.cos(d.heading); if (Math.abs(c) > 0.25) me.face = c > 0 ? 1 : -1; }

  /* ================= the flight (Nidhogg's) ================= */
  function fly(S, dt, steerOK) {
    const d = S.V, A = S.air, mag = steerOK ? Math.min(1, Math.hypot(S.mx, S.my)) : 0, top = S.spd * TUNE.airK * (S.form === 'leviathan' ? TUNE.levK : 1);
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

  /* ================= ANCHOR / RELEASE: the space checked, the transformation run to its last lock, then the controls handed over =================
     The timer keeps running through it. The form (and so the menu) changes at the last beat, in switchForm, nowhere else */
  /* the space Leviathan occupies at (x, y): its wider hull clear of walls at its height, inside the flight volume */
  /* (where walls can be flown over, Leviathan simply sits above them: holdZ gives the height it holds there; only a stage of full-height walls can refuse) */
  const tallMap = S => !S.air || !!S.air.hand;
  function roomAt(S, x, y) { if (!inVolume(S, x, y)) return false; return !tallMap(S) || !wallNear(S, x, y, TUNE.anchor.r); }
  const holdZ = (S, x, y) => (!tallMap(S) && wallNear(S, x, y, TUNE.anchor.r) ? TUNE.wallZ : TUNE.cruise);
  function anchorSpot(S) { const d = S.V, T = TUNE.anchor; if (roomAt(S, d.x, d.y, d.z)) return { x: d.x, y: d.y };
    for (let r = 0.4; r <= T.nudge + 1e-6; r += 0.4) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, x = d.x + Math.cos(a) * r, y = d.y + Math.sin(a) * r; if (roomAt(S, x, y, d.z)) return { x, y }; }
    return null; }
  function tryExtra(S, queued, force) {
    const g = S.g, d = S.V, sfx = S.X.sfx || {};
    if (!queued && !force && !fresh(S, 'extra')) return true;   /* (a held key: one press) */
    if (!ctrl(S)) return true;
    if (S.xfLockT != null && g.t - S.xfLockT < TUNE.xfLock) return true;   /* (a short lockout after either change of form: a double tap cannot flip it twice) */
    if (S.busy || S.maw || S.jet || d.locked) { if (!queued) S.xQ = g.t; return true; }   /* (a move in progress: it goes when that ends) */
    S.xQ = null;
    const to = S.form === 'shark' ? 'leviathan' : 'shark', T = TUNE.anchor;
    let spot = { x: d.x, y: d.y };
    if (to === 'leviathan') { spot = anchorSpot(S); if (!spot) { S.stats.anchorBad++; if (sfx.wrong) sfx.wrong(); S.X.text(d.x, d.y - 2.6, 'No room to anchor', CYAN, 12, { life: 0.9, max: 0.9, vy: -0.6 }); return true; } }
    const dur = to === 'leviathan' ? T.dur : T.release, info = { from: S.form, to, u: 0, dur, x: spot.x, y: spot.y, z: d.z, beats: T.beats.map(b => b[0]), beat: null };
    S.xfm = { from: S.form, to, t: 0, u: 0, dur, x0: d.x, y0: d.y, x1: spot.x, y1: spot.y, nb: 0, info };
    S.phase = 'xform'; d.locked = true; S.stats[to === 'leviathan' ? 'anchors' : 'releases']++; g.movedOnce = true;
    if (sfx.note) sfx.note(to === 'leviathan' ? 196 : 147, 0.5, 'sawtooth', 0.04, to === 'leviathan' ? 98 : 294); if (sfx.hiss) sfx.hiss(0.4, 0.08, 1200);
    if (S.halo) { S.halo.on = false; S.halo = null; }   /* (Release: the halo under Leviathan goes) */
    callMove(S, typeof moves().transform === 'function' ? 'transform' : to === 'leviathan' ? 'anchor' : 'release', info);
    return true;
  }
  function stepXform(S, dt) {
    const X = S.xfm, d = S.V, T = TUNE.anchor, sfx = S.X.sfx || {}; X.t += dt; const u = X.u = cl(X.t / X.dur), anc = X.to === 'leviathan';
    /* the shark slows to a stop (and slides to the checked spot); Leviathan gathers way only once it is the shark again */
    const k = Math.max(0, 1 - dt * T.slow); d.vx *= k; d.vy *= k; const e = sstep(0, 0.35, u); d.x = lerp(X.x0, X.x1, e); d.y = lerp(X.y0, X.y1, e); S.hw *= Math.max(0, 1 - dt * 6);
    d.pose.xf = anc ? sstep(0.03, 0.97, u) : 1 - sstep(0.03, 0.97, u); if (anc) d.z += (holdZ(S, X.x1, X.y1) - d.z) * Math.min(1, dt * 3);
    /* the beats, in order (reversed on Release): each seats with a sound and a shudder */
    const B = T.beats, n = B.length; while (X.nb < n) { const b = anc ? B[X.nb] : B[n - 1 - X.nb], at = anc ? b[1] : 1 - b[1]; if (u < at) break; X.nb++; X.info.beat = b[0]; S.stats.beats = (S.stats.beats || 0) + 1;
      const lock = b[0] === 'lock'; kick(S, 'z', lock ? -2.2 : -0.7); kick(S, 'pitch', lock ? -1 : (X.nb % 2 ? 0.5 : -0.5)); kick(S, 'glow', lock ? 6 : 2); if (b[0] === 'cannon') { kick(S, 'jaw', anc ? 7 : -3); kick(S, 'cannon', anc ? 5 : -2); } if (b[0] === 'fins') kick(S, 'fin', anc ? 6 : -4);
      if (sfx.note) sfx.note(lock ? 82 : 220 + 40 * X.nb, lock ? 0.3 : 0.12, 'square', lock ? 0.06 : 0.03, lock ? 55 : 180); if (lock && sfx.stomp) sfx.stomp(); if (lock && !calm()) S.X.shake(3, 0.12); }
    X.info.u = u;
    if (X.t >= X.dur) switchForm(S);
  }
  /* the one place the form changes in ordinary play: a completed Anchor or Release */
  function switchForm(S) {
    const X = S.xfm, d = S.V; if (!X) return; S.xfm = null;
    S.form = d.form = X.to; d.pose.xf = X.to === 'leviathan' ? 1 : 0; d.x = X.x1; d.y = X.y1; d.vx = d.vy = 0; S.stats.switches++;
    S.xfLockT = S.g.t; if (X.to === 'shark') { S.poolCasts = 0; S.autoDone = false; S.autoXf = false; S.stats.transformsBack = (S.stats.transformsBack || 0) + 1; }   /* (back to the shark: five more pool casts to transform again; the pools stay) */
    S.phase = X.to === 'leviathan' ? 'siege' : 'fly'; d.locked = false; S.anchorZ = holdZ(S, d.x, d.y); setMenu(S);
    /* (v321: Leviathan is no longer anchored, so there is no anchor halo) */
  }
  function setMenu(S) { if (S.menu === S.form) return; S.menu = S.form; S.stats.menuSets++; }
  /* Leviathan: it holds its place and its height; the stick turns the hull to aim */
  function siege(S, dt) {
    const d = S.V, T = TUNE.anchor, mag = d.locked ? 0 : Math.min(1, Math.hypot(S.mx, S.my)); d.vx = d.vy = 0;
    let w = 0; if (mag > 0.2) { const da = wrap(Math.atan2(S.my, S.mx) - S.ha); w = clamp(da * 8, -T.turn, T.turn) * (0.5 + 0.5 * mag); }
    S.hw += (w - S.hw) * Math.min(1, dt * T.turnAcc); S.ha = wrap(S.ha + S.hw * dt); S.au += S.hw * dt;   /* (a heavy hull: it gathers and sheds its turn slowly) */
    if (S.anchorZ != null) d.z += (S.anchorZ - d.z) * Math.min(1, dt * 4);
  }

  /* ================= MAW (shark Dodge) and HYDROJET (Leviathan Dodge): one shared recovery ================= */
  function tryDodge(S, mx, my, queued) { if (mx != null) { S.mx = mx; S.my = my; } if (S.phase === 'fly') tryMaw(S, queued); else if (S.phase === 'siege') tryJet(S, queued); else if (S.phase === 'xform' && !queued) S.dQ = S.g.t; }
  function pathOK(S, x0, y0, x1, y1) { const A = S.air; if (A && A.hand) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.4); for (let i = 1; i <= n; i++) { const u = i / n; if (wallNear(S, lerp(x0, x1, u), lerp(y0, y1, u), 0.3)) return false; } } return true; }
  function tryMaw(S, queued) {
    const d = S.V, g = S.g, T = TUNE.maw;
    if (S.maw || S.busy || S.cd.dodge > 0 || d.locked) { if (!queued && ((S.maw && S.maw.ph >= 2) || S.busy || (S.cd.dodge > 0 && S.cd.dodge < 0.3))) S.dQ = g.t; return; }
    S.dQ = null;
    /* the selected enemy, else the aimed valid surface; the dive's line clear of full-height walls */
    const Tg = target(S); let p = Tg.m ? { x: Tg.m.x, y: Tg.m.y } : groundAt(S, Tg.x, Tg.y) ? { x: Tg.x, y: Tg.y } : aimPoint(S);
    if (p && (wallNear(S, p.x, p.y, 0.5) || !pathOK(S, d.x, d.y, p.x, p.y))) p = Tg.m ? p : null;
    if (!p || !inVolume(S, p.x, p.y) || (Tg.m && !pathOK(S, d.x, d.y, p.x, p.y))) { const a = Math.hypot(S.mx, S.my) > 0.2 ? Math.atan2(S.my, S.mx) : d.heading; S.marks.push({ x: d.x + Math.cos(a) * 4.5, y: d.y + Math.sin(a) * 4.5, t: 0, life: 0.7 }); S.stats.mawBad++; const sfx = S.X.sfx || {}; if (sfx.wrong) sfx.wrong(); return; }
    const a = Math.hypot(p.x - d.x, p.y - d.y) > 0.3 ? Math.atan2(p.y - d.y, p.x - d.x) : d.heading, dir = wrap(a - S.ha) >= 0 ? 1 : -1;
    const info = { ph: 'roll', x: d.x, y: d.y, z: d.z, a, tx: p.x, ty: p.y, dir, u: 0, m: Tg.m || null, hitR: T.hitR, dur: T.roll + T.dive + T.thrash + T.pull };
    S.maw = { ph: 0, t: 0, a, dir, tx: p.x, ty: p.y, m: Tg.m || null, x0: d.x, y0: d.y, z0: d.z, from: S.ha, hits: new Set(), nHit: 0, bit: false, vk: 1, info };
    S.me.inv = Math.max(S.me.inv || 0, T.inv); S.stats.maws++; g.movedOnce = true; g.dodges = (g.dodges || 0) + 1;
    const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) sfx.note(140, 0.4, 'sawtooth', 0.04, 300);
    callMove(S, 'maw', info);
  }
  function mawHit(S, M, r) { const d = S.V, T = TUNE.maw; for (const m of S.H.living()) { if (M.hits.has(m)) continue; if (Math.hypot(m.x - d.x, m.y - d.y) > r + (m.r || 0.4)) continue; M.hits.add(m); if (hitCharge(S, m, S.DK * T.dmg, { kb: T.kb }) > 0) { M.nHit++; S.stats.mawHits++; splash(S, m.x, m.y, 0.4, 6, 4); } } }
  function stepMaw(S, dt) {
    const M = S.maw, d = S.V, T = TUNE.maw, I = M.info, X = S.X, sfx = X.sfx || {}; M.t += dt; const x0 = d.x, y0 = d.y;
    if (M.m && !M.m.dead && M.ph < 1) { M.tx = M.m.x; M.ty = M.m.y; I.tx = M.tx; I.ty = M.ty; }
    if (M.ph === 0) { const u = cl(M.t / T.roll); M.a = Math.hypot(M.tx - d.x, M.ty - d.y) > 0.3 ? Math.atan2(M.ty - d.y, M.tx - d.x) : M.a; setHeading(S, M.from + wrap(M.a - M.from) * inOut(u), dt); d.vx *= 0.85; d.vy *= 0.85; d.x += d.vx * dt; d.y += d.vy * dt; d.z = M.z0 + 0.25 * Math.sin(Math.PI * u);
      if (M.t >= T.roll) { M.ph = 1; M.t -= T.roll; M.x0 = d.x; M.y0 = d.y; M.z0 = d.z; I.ph = 'dive'; } }
    if (M.ph === 1) { const u = cl(M.t / T.dive), e = Math.pow(u, 1.5); setHeading(S, M.a, dt); d.x = lerp(M.x0, M.tx, e); d.y = lerp(M.y0, M.ty, e); d.z = lerp(M.z0, T.z, e);
      if (M.t >= T.dive) { M.ph = 2; M.t -= T.dive; I.ph = 'thrash'; M.bit = true; I.bitT = S.g.t;
        /* the bite at contact (the first of the action's one hit per enemy) */
        mawHit(S, M, T.biteR); S.stats.mawSmash += smashArea(S, d.x, d.y, T.biteR) || 0; kick(S, 'jaw', -14); kick(S, 'pitch', 2.5); addPart(S, 9, d.x, d.y, 0, 0, 0, 0, 0.5, T.biteR * 1.1); splash(S, d.x, d.y, 0.2, 16, 6);
        if (sfx.crash) sfx.crash(); if (sfx.note) sfx.note(90, 0.25, 'square', 0.07, 50); if (!calm()) X.shake(5, 0.16); if (X.hitstop && M.nHit) X.hitstop(calm() ? 0.02 : 0.05); } }
    if (M.ph === 2) { const u = cl(M.t / T.thrash), mag = Math.hypot(S.mx, S.my);
      /* the thrash: a fast skim along a route that curves (the way it rolled in), bent a little by the stick, turned by walls */
      let w = M.dir * T.curve * (1 - 0.5 * u); if (mag > 0.2) w += clamp(wrap(Math.atan2(S.my, S.mx) - M.a) * 3, -T.steer, T.steer);
      M.a = wrap(M.a + w * dt); setHeading(S, M.a, dt); const v = T.v * (1 - 0.55 * u * u) * M.vk, dx = Math.cos(M.a) * v * dt, dy = Math.sin(M.a) * v * dt;
      const bx = wallNear(S, d.x + dx, d.y, 0.6) || !inVolume(S, d.x + dx, d.y), by = wallNear(S, d.x + (bx ? 0 : dx), d.y + dy, 0.6) || !inVolume(S, d.x, d.y + dy);
      if (!bx) d.x += dx; if (!by) d.y += dy; if (bx || by) { M.a = Math.atan2(by ? -Math.sin(M.a) : Math.sin(M.a), bx ? -Math.cos(M.a) : Math.cos(M.a)); M.vk *= 0.7; kick(S, 'z', 2); }
      d.z = T.z + 0.12 * Math.abs(Math.sin(u * Math.PI * 5));
      mawHit(S, M, T.hitR); M.smT = (M.smT || 0) - dt; if (M.smT <= 0) { M.smT = 0.05; S.stats.mawSmash += smashArea(S, d.x, d.y, T.hitR * 0.9) || 0; }
      if (Math.random() < dt * (lowFx() ? 20 : 55)) splash(S, d.x - Math.cos(M.a) * 1.2, d.y - Math.sin(M.a) * 0.9, 0.1, 1, 4);
      if (M.t >= T.thrash) { M.ph = 3; M.t -= T.thrash; I.ph = 'pull'; M.vx = Math.cos(M.a) * v; M.vy = Math.sin(M.a) * v; } }
    if (M.ph === 3) { const u = cl(M.t / T.pull); d.vx = M.vx * (1 - 0.6 * u); d.vy = M.vy * (1 - 0.6 * u); const nx = d.x + d.vx * dt, ny = d.y + d.vy * dt, hi = d.z >= TUNE.wallZ - 0.35 && !(S.air && S.air.hand); if (hi || !wallNear(S, nx, d.y, 0.6)) d.x = nx; if (hi || !wallNear(S, d.x, ny, 0.6)) d.y = ny;
      d.z = lerp(T.z, wallNear(S, d.x, d.y, 0.9) && !(S.air && S.air.hand) ? TUNE.wallZ : TUNE.cruise, sstep(0, 1, u)); }
    else if (dt > 0) { d.vx = (d.x - x0) / dt; d.vy = (d.y - y0) / dt; }
    I.x = d.x; I.y = d.y; I.z = d.z; I.a = M.a; I.u = cl(((M.ph > 0 ? T.roll : 0) + (M.ph > 1 ? T.dive : 0) + (M.ph > 2 ? T.thrash : 0) + M.t) / I.dur);
    if (M.ph === 3 && M.t >= T.pull) { S.maw = null; S.cd.dodge = TUNE.dodgeRec; S.cdMax.dodge = S.cd.dodge; }
  }
  function tryJet(S, queued) {
    const d = S.V, g = S.g, T = TUNE.jet;
    if (S.jet || S.cd.dodge > 0 || d.locked || S.busy === 'maelstrom-cast') { if (!queued && (S.jet || (S.cd.dodge > 0 && S.cd.dodge < 0.3))) S.dQ = g.t; return; }
    S.dQ = null;
    const mag = Math.hypot(S.mx, S.my), a = mag > 0.2 ? Math.atan2(S.my, S.mx) : wrap(d.heading + Math.PI);   /* (no stick: straight back) */
    /* the burst's reach: as far as the wider hull stays clear (walls at its height, the flight volume) */
    let reach = 0; for (let s = 0.3; s <= T.dist + 1e-6; s += 0.3) { if (!roomAt(S, d.x + Math.cos(a) * s, d.y + Math.sin(a) * s, d.z)) break; reach = s; }
    const info = { ph: 'burst', a, x0: d.x, y0: d.y, x: d.x, y: d.y, z: d.z, x1: d.x + Math.cos(a) * reach, y1: d.y + Math.sin(a) * reach, reach, u: 0 };
    S.jet = { ph: 0, t: 0, a, x0: d.x, y0: d.y, x1: info.x1, y1: info.y1, reach, info };
    if (!tallMap(S)) { for (let s2 = 0.3; s2 <= reach + 1e-6; s2 += 0.3) if (wallNear(S, d.x + Math.cos(a) * s2, d.y + Math.sin(a) * s2, TUNE.anchor.r)) { S.anchorZ = TUNE.wallZ; break; } }   /* (something in the way that can be flown over: it rises over it as it goes) */
    S.me.inv = Math.max(S.me.inv || 0, T.inv); S.stats.hydrojets++; g.movedOnce = true; g.dodges = (g.dodges || 0) + 1;
    kick(S, 'z', 1.5); const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.hiss) sfx.hiss(0.5, 0.14, 2200); if (sfx.note) sfx.note(110, 0.25, 'sawtooth', 0.05, 60);
    for (let i = 0; i < (lowFx() ? 6 : 16); i++) { const b = a + Math.PI + (Math.random() - 0.5) * 0.9, v = 4 + Math.random() * 5; addPart(S, i % 3 ? 1 : 2, d.x, d.y, d.z + (Math.random() - 0.5) * 0.4, Math.cos(b) * v, Math.sin(b) * v * GY, 0, 0.35 + Math.random() * 0.3, i % 3 ? 0.1 : 0.4, { col: i % 2 ? FOAM : CYAN, drag: 2.5, grow: 1.4 }); }
    callMove(S, 'hydrojet', info);
  }
  function stepJet(S, dt) {
    const J = S.jet, d = S.V, T = TUNE.jet, x0 = d.x, y0 = d.y; J.t += dt;
    if (J.ph === 0) { const u = cl(J.t / T.burst), e = 1 - Math.pow(1 - u, 2.4); d.x = lerp(J.x0, J.x1, e); d.y = lerp(J.y0, J.y1, e); if (dt > 0) { d.vx = (d.x - x0) / dt; d.vy = (d.y - y0) / dt; } J.info.u = u; J.info.x = d.x; J.info.y = d.y;
      if (J.t >= T.burst) { J.ph = 1; J.t -= T.burst; J.info.ph = 'settle'; d.x = J.x1; d.y = J.y1; d.vx = d.vy = 0; S.anchorZ = holdZ(S, d.x, d.y); kick(S, 'z', -2); kick(S, 'bank', 1.2); const sfx = S.X.sfx || {}; if (sfx.note) sfx.note(82, 0.2, 'square', 0.04, 55); } }
    else { d.vx = d.vy = 0; if (J.t >= T.settle) { S.jet = null; S.cd.dodge = TUNE.dodgeRec; S.cdMax.dodge = S.cd.dodge; } }
    /* it can still turn to aim through the burst */
    siege(S, dt);
  }

  /* ================= the commands ================= */
  function fresh(S, key) { const t = S.g.t, p = S.press[key]; S.press[key] = t; return t - p >= TUNE.freshGap; }
  const MOVES = { shark: { strong: ['waterBombs', 's1', 'bombs'], strong2: ['waterRay', 's2', 'ray'] }, leviathan: { strong: ['depthCharge', 's1', 'depth'], strong2: ['maelstrom', 's2', 'mael'] } };
  function tryMove(S, slot, queued) {
    const V = S.V, g = S.g, sfx = S.X.sfx || {}, sl = slot === 'strong2' ? 'strong2' : 'strong';
    if (!queued && !fresh(S, sl)) return;
    if (S.phase === 'xform') { if (!queued) S.mvQ = { slot: sl, t: g.t }; return; }
    if (!ctrl(S)) return;
    if (S.busy || V.locked || S.maw || S.jet) { if (!queued) S.mvQ = { slot: sl, t: g.t }; return; }
    const [name, key, stat] = MOVES[S.form][sl];
    if (S.cd[key] > 0) { if (!queued) { if (S.cd[key] <= TUNE.mvHold) S.mvQ = { slot: sl, t: g.t }; else if (sfx.wrong) sfx.wrong(); } return; }
    /* Maelstrom needs a pool that can still be claimed: say what makes one, spend nothing */
    if (name === 'maelstrom' && !S.pools.some(p => p.state === 'available')) { S.mvQ = null; S.stats.maelRefused++; S.needPoolT = g.t; if (sfx.wrong) sfx.wrong(); S.X.text(V.x, V.y - 2.8, 'Needs a Tidal Pool: Water Ray makes one', CYAN2, 12, { life: 1.3, max: 1.3, vy: -0.5 }); return; }
    S.mvQ = null;
    const [MV, fn] = mvFn(name); if (!fn) return;
    S.busy = name; S.busyT = 0; S.busyForm = S.form; S.cd[key] = TUNE[key + 'Cd']; S.cdMax[key] = S.cd[key]; S.stats[stat]++;
    let r; try { r = fn.call(MV, S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Jaws: a move failed', e); actionDone(S); return; }
    if (r === false && S.busy === name) { S.busy = null; S.cd[key] = 0; S.stats[stat]--; if (name === 'maelstrom') S.stats.maelRefused++; }   /* (the move refused itself: nothing spent) */
  }
  function tryUlt(S, queued) {
    const X = S.X, sfx = X.sfx || {}, V = S.V, g = S.g;
    if (!queued && !fresh(S, 'ult')) return;
    if (!ctrl(S) && S.phase !== 'xform') return;
    if (S.used || S.charge < 1) { if (!queued) { if (sfx.wrong) sfx.wrong(); X.text(V.x, V.y - 2.6, S.used ? 'Shark Attack used' : `Shark Attack ${Math.floor(S.charge * 100)}%`, CYAN, 12, { life: 0.9, max: 0.9, vy: -0.6 }); } return; }
    if (S.phase === 'xform' || S.busy || S.maw || S.jet) { if (!queued) S.ultQ = g.t; return; }   /* (a transformation, a cast or a dodge in progress: it goes when that ends) */
    /* committed: ordinary commands stop; from Leviathan it folds back to the shark as the approach begins (the core's, on the model's own xf) */
    S.ultQ = null; S.mvQ = null; S.dQ = null; S.xQ = null; S.used = true; S.fromForm = S.form; S.phase = 'finisher'; S.t = 0; S.busy = 'sharkAttack'; S.busyT = 0; V.locked = true; S.ctx.finisher = 'sharkAttack'; S.stats.shark++;
    if (S.form === 'leviathan') S.finFold = { t: 0 }; if (S.halo) { S.halo.on = false; S.halo = null; }
    const [MV, fn] = mvFn('sharkAttack');
    try { fn.call(MV, S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Jaws: Shark Attack failed', e); actionDone(S); }
  }
  function actionDone(S) {
    if (!S.busy) return; const kind = S.busy; S.busy = null;
    if (S.phase === 'finisher' || kind === 'sharkAttack') { S.cam = null; startOut(S, 'finisher'); return; }
    if (ctrl(S) || S.phase === 'xform') { S.V.locked = S.phase === 'xform'; S.cam = null; const M2 = MOVES[S.busyForm || S.form], e = M2 && Object.values(M2).find(q => q[0] === kind); if (e) { S.cd[e[1]] = Math.max(S.cd[e[1]], TUNE[e[1] + 'Cd']); S.cdMax[e[1]] = S.cd[e[1]]; } }   /* (the slot's cooldown runs from the end of the cast: a form change right after can never find the paired move ready) */
  }
  function queues(S) { const g = S.g, V = S.V; if (S.busy || S.maw || S.jet || S.xfm) return;
    if (S.ultQ != null) { const q = S.ultQ; S.ultQ = null; if (g.t - q < 2.5 && S.charge >= 1 && !S.used) { tryUlt(S, true); if (!ctrl(S)) return; } }
    if (V.locked) return;
    if (S.autoXf && !S.autoDone && S.form === 'shark') { tryExtra(S, true, true); if (S.xfm) { S.autoXf = false; S.autoDone = true; S.stats.autoXf++; S.X.text(V.x, V.y - 2.8, 'LEVIATHAN', CYAN2, 14, { life: 1.2, max: 1.2, vy: -0.5 }); return; } }   /* (the fifth pool: it transforms by itself; a cramped spot on a full-height stage waits until there is room) */
    if (S.dQ != null && S.cd.dodge <= 0) { const q = S.dQ; S.dQ = null; if (g.t - q < 0.6) { tryDodge(S, null, null, true); if (S.maw || S.jet) return; } }
    if (S.mvQ) { const Q = S.mvQ, key = MOVES[S.form][Q.slot][1]; if (g.t - Q.t > TUNE.mvHold + 1.2) S.mvQ = null; else if (S.cd[key] <= 0) { S.mvQ = null; tryMove(S, Q.slot, true); } } }

  /* ================= the frame ================= */
  function step(S, dt) {
    const d = S.V, me = S.me, g = S.g, X = S.X, M0 = MOD();
    if (S.released) { S.relT = (S.relT || 0) + dt; stepParts(S, dt); return; }
    if (me.dead) { finish(S, 'defeat'); return; }
    if (g.over || (g.won && S.phase !== 'finisher' && S.phase !== 'out')) { finish(S, 'won'); return; }
    if (X.pet && S.pet && X.pet() !== S.pet) { finish(S, 'swap'); return; }
    g.cdU = S.CD;   /* (held through the session: the cooldown starts when normal control returns) */
    S.t += dt; for (const k in S.cd) S.cd[k] = Math.max(0, S.cd[k] - dt); if (S.busy) S.busyT += dt;
    if (M0.warm) { try { M0.warm(S.phase === 'summon' ? 5 : 1); } catch (e) { /* (model) */ } }
    const MVw = moves(); if (MVw.warm && !S.wDone) { try { if (MVw.warm(S.phase === 'summon' ? 1.5 : 0.6) === true) S.wDone = true; } catch (e) { S.wDone = true; } }
    if (S.phase === 'summon') stepSummon(S, dt);
    else if (S.phase === 'fly' || S.phase === 'siege' || S.phase === 'xform') {
      /* the one timer: both forms and their transformations (the game clock: a hit-stop, which pauses this step, still counts) */
      S.left = Math.min(S.left - dt, S.endT - g.t); S.stats[S.phase === 'fly' ? 'flyT' : S.phase === 'siege' ? 'siegeT' : 'xfT'] += dt;
      if (!inMap(S, d.x, d.y) || (!groundAt(S, d.x, d.y) && tileOf(S, d.x, d.y) !== T_SOLID)) S.stats.offT += dt;
      /* expiry (during a transformation, Maw, Hydrojet, a cast or with a projectile in the air alike): the safe exit of whichever form it is; every later hit of a cancelled action is dropped (alive() is false); no finisher */
      if (S.left <= 0) { if (!inMap(S, d.x, d.y) || !groundAt(S, d.x, d.y)) S.stats.offshoreExit++; S.expiredIn = S.maw ? 'maw' : S.jet ? 'hydrojet' : S.xfm ? 'xform' : S.busy || S.phase; startOut(S, 'timeout'); return; }
      if (S.busy && S.busyT > TUNE.busyCap) actionDone(S);
      if (S.phase === 'xform') stepXform(S, dt);
      else if (S.phase === 'fly') { if (S.maw) stepMaw(S, dt); else fly(S, dt, !d.locked); }
      else { if (S.jet) stepJet(S, dt); else fly(S, dt, !d.locked); }   /* (v321: Leviathan flies too, slower; Hydrojet is still its dodge) */
      queues(S);
    } else if (S.phase === 'finisher') {
      if (S.t > TUNE.finCap) { S.busy = null; startOut(S, 'finisher'); return; }
      /* from Leviathan: the fold back to the shark through the approach (the same parts, the model's xf); E moves the body through ctx.vehicle */
      if (S.finFold) { const F = S.finFold; F.t += dt; const u = cl(F.t / TUNE.finFold); d.pose.xf = 1 - sstep(0.03, 0.97, u); if (u >= 1) { S.finFold = null; S.form = d.form = 'shark'; d.pose.xf = 0; S.stats.finFolds = (S.stats.finFolds || 0) + 1; } }
      const k = Math.max(0, 1 - dt * 4); d.vx *= k; d.vy *= k; S.hw *= Math.max(0, 1 - dt * 6);
    } else if (S.phase === 'out') stepOut(S, dt);
    /* the safe return point (valid ground the pet could walk from, tracked all through) */
    S.safeT -= dt; if (S.safeT <= 0) { S.safeT = 0.25; if (safeOK(S, d.x, d.y)) S.safe = { x: d.x, y: d.y }; }
    S.reachT -= dt; if (S.reachT <= 0) { S.reachT = 2; if (S.safe && canStand(S, S.safe.x, S.safe.y)) buildReach(S, S.safe.x, S.safe.y); }
    if (S.phase === 'finisher' && d.locked) { const da = wrap(d.heading - S.ha); S.ha = wrap(d.heading); S.au += da; } else d.heading = S.ha;   /* (E turns the body itself in the finisher) */
    const MV = moves(); if (MV.update) { try { MV.update(S.ctx, dt); } catch (e) { /* (theirs) */ } }
    if (S.phase !== 'out' || !S.hopped) syncMe(S);
    stepParts(S, dt);
    animate(S, dt);
    S.fx.entY = d.y + 0.4;
    S.sfxT -= dt; if (S.sfxT <= 0 && S.phase === 'fly') { const sfx = X.sfx || {}, k = cl(Math.hypot(d.vx, d.vy) / Math.max(1, S.spd * TUNE.airK)); S.sfxT = 0.62 - 0.3 * k; if (sfx.note && k > 0.1) sfx.note(120 + 30 * k, 0.16, 'triangle', 0.018, 80); }   /* (the mechanical air-swim: a soft stroke, quicker with speed) */
  }
  /* the summon: E's ring of water and bubbles; the snout and teeth first, then the body, fins and tail; the pet settles, the gills light, it levels off */
  function stepSummon(S, dt) {
    const d = S.V, P = d.pose, t = S.t, T = TUNE.summon;
    if (S.emerge) { P.alpha = sstep(0.05, 0.3, t); d.z = lerp(-2.6, TUNE.cruise, inOut(sstep(0.25, T - 0.2, t))); }   /* (it rises nose-up out of the ring of water: the snout and teeth, then the body, the fins, the tail) */
    else { P.alpha = sstep(0.15, 0.7, t); d.z = lerp(0.6, TUNE.cruise, inOut(sstep(0.5, T, t))); }
    P.xf = 0; d.vx = d.vy = 0;
    if (Math.random() < dt * (lowFx() ? 14 : 40) && t < T - 0.3) { const a = Math.random() * TAU, r = 0.6 + Math.random() * 1.6; addPart(S, 1, d.x + Math.cos(a) * r, d.y + Math.sin(a) * r * GY, 0.1 + Math.random() * 0.4, -Math.sin(a) * 2, Math.cos(a) * 2 * GY, 1.2 + Math.random() * 1.6, 0.6 + Math.random() * 0.4, 0.08, { col: Math.random() < 0.5 ? CYAN : FOAM }); }
    if (!S.gills && t >= T - 0.5) { S.gills = true; kick(S, 'glow', 8); const sfx = S.X.sfx || {}; if (sfx.note) sfx.note(784, 0.3, 'sine', 0.05, 1175); }
    if (t >= T) { S.phase = 'fly'; S.t = 0; d.locked = false; S.left = S.dur; S.endT = S.g.t + S.dur; S.stats.timerSets++; P.alpha = 1; setMenu(S); }   /* (the deadline is written here and nowhere else) */
  }

  /* ---- exits: every pool and reservation cleared, the glide to valid ground, the pet set down before its support goes, the body dissolved, the cooldown ---- */
  function startOut(S, how) {
    if (S.phase === 'out' || S.released) return;
    const d = S.V; S.maw = null; S.jet = null; S.busy = null; S.mvQ = null; S.dQ = null; S.ultQ = null; S.xQ = null; S.eAct = null; S.finFold = null; if (S.halo) { S.halo.on = false; S.halo = null; }
    if (S.xfm) { const X = S.xfm; S.xfm = null; S.form = d.form = X.from; d.pose.xf = X.from === 'leviathan' ? 1 : 0; }   /* (a transformation cut short: back to the form it left; nothing was handed over) */
    S.outHow = how || 'timeout'; S.fromPhase = S.phase; S.phase = 'out'; S.t = 0; S.outT = 0; d.locked = true; S.cam = null; S.ctx.finisher = null;
    S.ctx.pools.clear(how === 'finisher' ? 'ocean' : 'exit');
    const p = S.retPt && safeOK(S, S.retPt.x, S.retPt.y) ? S.retPt : safeReturn(S); S.ret = p;
    S.outFrom = { x: d.x, y: d.y, z: d.z }; S.outGlide = clamp(Math.hypot(p.x - d.x, p.y - d.y) / TUNE.outSpd, TUNE.outGlide[0], TUNE.outGlide[1]); S.hopped = false; S.petHop = 0;
    const sfx = S.X.sfx || {}; if (sfx.note) [784, 587, 392].forEach((f, i) => sfx.note(f, 0.4, 'sine', 0.04, f * 0.97, i * 0.1));
    callMove(S, 'exit', { x: p.x, y: p.y, glide: S.outGlide, dissolve: TUNE.dissolve, how: S.outHow, form: S.form });
  }
  function stepOut(S, dt) {
    const d = S.V, P = d.pose, me = S.me; S.outT += dt;
    if (S.outT < S.outGlide) { const u = sstep(0, 1, S.outT / S.outGlide), x0 = d.x, y0 = d.y; d.x = lerp(S.outFrom.x, S.ret.x, u); d.y = lerp(S.outFrom.y, S.ret.y, u); d.z = lerp(S.outFrom.z, TUNE.outZ, u); if (dt > 0) { d.vx = (d.x - x0) / dt; d.vy = (d.y - y0) / dt; } if (Math.hypot(S.ret.x - S.outFrom.x, S.ret.y - S.outFrom.y) > 0.6) steer(S, dt, Math.atan2(S.ret.y - S.outFrom.y, S.ret.x - S.outFrom.x), 1); return; }
    d.vx = d.vy = 0; d.x = S.ret.x; d.y = S.ret.y; S.hw *= 0.8;
    if (!S.hopped) { S.hopped = true; S.petHop = 0; const sfx = S.X.sfx || {}; if (sfx.jump) sfx.jump(); }
    S.petHop += dt; me.x = S.ret.x; me.y = S.ret.y; me.vx = me.vy = 0;
    /* the pet is down first; then the body goes to bubbles (E's exit draws them tail to head) */
    const v = cl((S.petHop - TUNE.hop) / TUNE.dissolve), gone = d.vis < 0.05;
    if (S.petHop > TUNE.hop) { P.alpha = gone ? 0 : 1 - sstep(0.1, 1, v); if (!gone && Math.random() < dt * (lowFx() ? 20 : 60)) { const f = lerp(-2.4, 1.6, v) + (Math.random() - 0.5); addPart(S, 1, d.x + Math.cos(d.heading) * f, d.y + Math.sin(d.heading) * f * GY, d.z + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5), (Math.random() - 0.5) * 0.5, 0.8 + Math.random() * 1.2, 0.7 + Math.random() * 0.5, 0.07, { col: Math.random() < 0.6 ? CYAN2 : FOAM }); } }
    if ((S.petHop > TUNE.hop && v >= 1) || (gone && S.petHop > TUNE.hop)) release(S);
  }
  function finish(S, how) {
    if (S.released) return; S.outHow = how;
    const p = S.phase === 'out' && S.ret ? S.ret : safeReturn(S), me = S.me; me.x = p.x; me.y = p.y;   /* (never over the void, off the map or in a wall, even on defeat) */
    const d = S.V; if (d.vis > 0.05 && (d.pose.alpha || 0) > 0.05) { splash(S, d.x, d.y, d.z, lowFx() ? 10 : 26, 5); S.fade = 0.35; }
    release(S);
  }
  /* the one guarded cleanup path: pools and reservations, actions, the controls, the camera, the cooldown, once */
  function release(S) {
    if (S.released) return;
    S.released = true; S.ended = true; S.relT = 0;
    const me = S.me, g = S.g, X = S.X;
    if (S.ret && S.phase === 'out') { me.x = S.ret.x; me.y = S.ret.y; }
    if (!safeOK(S, me.x, me.y) && !canStand(S, me.x, me.y)) { const p = safeReturn(S); me.x = p.x; me.y = p.y; }
    if (S.halo) { S.halo.on = false; S.halo = null; }
    S.phase = 'gone'; S.busy = null; S.maw = null; S.jet = null; S.xfm = null; S.finFold = null; S.mvQ = null; S.ultQ = null; S.dQ = null; S.xQ = null; S.cam = null; S.eAct = null; S.eCh = null;
    if (S.pools.length) { for (const p of S.pools) { p.state = 'consumed'; p.how = 'exit'; S.poolLog.push(p); S.stats.poolClear++; } S.pools.length = 0; }
    if (S.ctx) { S.ctx.finisher = null; } S.V.locked = true;
    try { X.vehicle(null); } catch (e) { /* (hook) */ }
    if (me.petAlt === S.fx) me.petAlt = null;
    me.vx = me.vy = 0; me.z = 0; me.push = null; me.castT = 0; me.airborne = false;
    g.cdU = S.CD; S.stats.cdSet++;   /* the 150 s start now, once: normal control is back */
    g.tapBuf = 0; g.tapAim = null; g.normalT = Math.max(g.normalT || 0, 0.2);
    S.fx.life = 0.9; S.fx.onEnd = null;
  }

  /* ---- pooled particles: 1 a droplet or bubble (additive), 2 soft spray, 9 a pale ring of light on the floor (s = radius) ---- */
  const CAP = 260;
  function addPart(S, kind, x, y, z, vx, vy, vz, life, s, o) {
    if (S.parts.length >= CAP * (lowFx() ? 0.45 : 1)) return null;
    const p = S.free.pop() || {}; p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.s = s; p.g = (o && o.g) || 0; p.drag = (o && o.drag) || 0; p.grow = (o && o.grow) || 0; p.col = (o && o.col) || null;
    S.parts.push(p); return p;
  }
  function stepParts(S, dt) {
    for (let i = S.parts.length - 1; i >= 0; i--) { const p = S.parts[i]; p.life -= dt; if (p.life <= 0) { S.parts[i] = S.parts[S.parts.length - 1]; S.parts.pop(); S.free.push(p); continue; }
      const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz = p.vz * k - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); }
    for (let i = S.marks.length - 1; i >= 0; i--) { const m = S.marks[i]; m.t += dt; if (m.t > m.life) S.marks.splice(i, 1); }
  }
  function splash(S, x, y, z, n, v0) { const Q = lowFx() ? 0.45 : 1; for (let i = 0; i < Math.round(n * Q); i++) { const a = Math.random() * TAU, v = v0 * (0.3 + Math.random() * 0.8); addPart(S, i % 4 === 3 ? 2 : 1, x, y, z, Math.cos(a) * v, Math.sin(a) * v * GY, 1 + Math.random() * 3, 0.35 + Math.random() * 0.35, i % 4 === 3 ? 0.4 : 0.08, { g: 7, drag: 1.2, grow: 1.2, col: i % 3 ? CYAN2 : FOAM }); } }

  /* ================= drawing ================= */
  const mOpts = (S, T, extra) => Object.assign({ T, sx: S.H.sx, sy: S.H.sy, t: S.g.t, low: lowFx(), scale: S.size }, extra || null);
  function callM(S, c, k) { const MV = moves(); if (MV[k] && S.ctx) { c.save(); try { MV[k](S.ctx, c); } catch (e) { /* (theirs) */ } c.restore(); } }
  function drawUnder(S, c) {
    const H = S.H, T = H.X.Tz(), d = S.V, M0 = MOD(), t = S.g.t;
    /* the Tidal Pools: M's picture (one GPU pass, every frame with the whole list: it notices a consumed pool by its absence); the stand-in only without it */
    if (M0.drawPools) { try { M0.drawPools(c, S.pools, mOpts(S, T)); } catch (e) { /* (model) */ } }
    else if (S.pools.length) { c.save(); for (const p of S.pools) { const X0 = H.sx(p.x), Y0 = H.sy(p.y), r = T * p.r * (0.9 + 0.1 * sstep(0, 0.4, t - p.born)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.34; blitSized(c, glowSprite(COB), X0 - r * 1.2, Y0 - r * 1.2 * GY, r * 2.4, r * 2.4 * GY); c.globalAlpha = 0.22 + 0.2 * Math.exp(-(t - p.t) * 4); blitSized(c, glowSprite(CYAN), X0 - r * 0.7, Y0 - r * 0.7 * GY, r * 1.4, r * 1.4 * GY);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.75; c.strokeStyle = p.state === 'claimed' ? AMBER : CYAN2; c.lineWidth = T * 0.05; if (p.state === 'claimed') c.setLineDash([T * 0.2, T * 0.16]); c.beginPath(); c.ellipse(X0, Y0, r, r * GY, 0, 0, TAU); c.stroke(); c.setLineDash([]); } c.restore(); }
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of S.parts) { if (p.kind !== 9) continue; const u = 1 - p.life / p.max, e = 1 - (1 - u) ** 3, r = T * p.s * (0.25 + 0.75 * e); c.globalAlpha = Math.pow(1 - u, 1.4) * 0.4; blitSized(c, glowSprite(CYAN), H.sx(p.x) - r, H.sy(p.y) - r * GY, r * 2, r * 2 * GY); }
    c.restore();
    if (S.phase !== 'gone' && d.vis > 0.05 && M0.drawShadow && inMap(S, d.x, d.y) && groundAt(S, d.x, d.y)) { try { M0.drawShadow(c, d.x, d.y, d.z + (S.zOff || 0), d.heading, d.pose, mOpts(S, T)); } catch (e) { /* (model) */ } }   /* (no shadow on the open air) */
    callM(S, c, 'drawUnder');
  }
  function drawEnt(S, c) {
    const H = S.H, T = H.X.Tz(), d = S.V, M0 = MOD();
    if (S.phase === 'gone') { if (S.fade && S.relT < S.fade && d.vis > 0.05) { const a0 = d.pose.alpha; d.pose.alpha = a0 * (1 - S.relT / S.fade); try { M0.draw(c, d.x, d.y, d.z, d.heading, d.pose, mOpts(S, T)); } catch (e) { /* (model) */ } d.pose.alpha = a0; } return; }
    const out = S.phase === 'out' && S.hopped, ph = S.phase === 'summon' ? lerp(1.5, TUNE.petH, sstep(0.5, 1.5, S.t)) : TUNE.petH;
    const wl = S.waterline, under = wl != null && S.ctx.anchor('seat').z < wl + 0.15;
    let petDone = false; const o = mOpts(S, T, { clipZ: wl, waterline: wl, pet: (cc, PX, PY) => { petDone = true; S.seatS = [PX, PY]; if (!out && !under) H.X.drawPetAt(cc, PX, PY, { maxH: ph }); } });
    const fx2 = (S.fwd || 0) * Math.cos(d.heading), fy2 = (S.fwd || 0) * Math.sin(d.heading) * GY;
    if (d.vis > 0.05) { try { M0.draw(c, d.x + fx2, d.y + fy2, d.z + (S.zOff || 0), d.heading, d.pose, o); } catch (e) { /* (model) */ } }
    /* the pet in the open cockpit: upright, never yawed or rolled, always in view (the lead's model leaves it to the core) */
    if (!petDone) { const p = S.ctx.anchor('seat'); S.seatS = [H.sx(p.x), H.sy(p.y) - p.z * ZK * T]; if (!out && !(wl != null && p.z < wl + 0.15) && !(S.sunk && S.sunkA < 0.5)) H.X.drawPetAt(c, S.seatS[0], S.seatS[1], { maxH: ph }); }   /* (under E's ocean the pet goes under with its seat) */
    if (S.phase === 'summon' && under) H.X.drawPetAt(c, H.sx(S.home.x), H.sy(S.home.y), {});   /* (the pet waits in the ring until the cockpit rises under it) */
    if (out) { const u = cl(S.petHop / TUNE.hop), s3 = S.seatS, gx = H.sx(S.ret.x), gy = H.sy(S.ret.y); H.X.drawPetAt(c, lerp(s3[0], gx, u), lerp(s3[1], gy, u * u) - Math.sin(u * Math.PI) * T * 0.3, u < 1 ? { maxH: lerp(TUNE.petH, 1.5, u * u) } : {}); }
    callM(S, c, 'drawEnt');
  }
  function drawOver(S, c) {
    const H = S.H, T = H.X.Tz();
    callM(S, c, 'drawOver');
    if (S.marks.length) { c.save(); for (const m of S.marks) { const a = 1 - Math.pow(Math.min(1, m.t / m.life), 2), X0 = H.sx(m.x), Y0 = H.sy(m.y), r = T * 0.7; c.globalAlpha = 0.8 * a; c.strokeStyle = '#FF9AB8'; c.lineWidth = T * 0.08; c.setLineDash([T * 0.18, T * 0.14]); c.beginPath(); c.ellipse(X0, Y0, r, r * GY, 0, 0, TAU); c.stroke(); c.setLineDash([]); c.beginPath(); c.moveTo(X0 - r * 0.5, Y0 - r * 0.35); c.lineTo(X0 + r * 0.5, Y0 + r * 0.35); c.moveTo(X0 + r * 0.5, Y0 - r * 0.35); c.lineTo(X0 - r * 0.5, Y0 + r * 0.35); c.stroke(); } c.restore(); }
    if (!S.parts.length) return;
    const sp = S.seatS || [-1e9, -1e9], PX = sp[0], PY = sp[1] - T * 0.3;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of S.parts) { if (p.kind === 9) continue; const X0 = H.sx(p.x), Y0 = H.sy(p.y) - p.z * ZK * T, u = 1 - p.life / p.max, keep = 0.05 + 0.95 * sstep(T * 0.35, T * 0.9, Math.hypot(X0 - PX, Y0 - PY));   /* (never over the pet's face) */
      const a = cl(p.life / Math.min(0.3, p.max)) * Math.min(1, u * 8) * keep; if (a < 0.02) continue; const r = T * p.s * (p.kind === 2 ? 1 + p.grow * u : 1); c.globalAlpha = a * (p.kind === 2 ? 0.16 : 1); blitSized(c, glowSprite(p.col || CYAN), X0 - r, Y0 - r, r * 2, r * 2); }
    c.restore();
  }

  /* ================= the HUD: the contextual menu (shark: Water Ray, Water Bombs, Maw; Leviathan: Depth Charge, Maelstrom,
     Hydrojet), the small Anchor / Release button above Dodge, Shark Attack's gauge, the summon time apart from it, three pool indicators ================= */
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  function drawBtns(S, c, o) {
    const { B, blitC, hudPic, glowPic } = o, t = S.g.t, lev = (S.menu || S.form) === 'leviathan', on = ctrl(S), idle = !on || (S.V.locked && !S.busy), ic = moves().icons || null, act = S.busy || S.maw || S.jet || S.xfm;
    const btn = (b, key, label, cd, cdMax, paint, busy, off, small) => { if (!b) return; const R = small ? Math.round(b.r * 0.72) : b.r, rd = cd <= 0.01 && !idle && !act && !off;
      if (rd) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22 + 0.08 * Math.sin(t * 5); blitC(c, glowPic(glowSprite, CYAN, Math.round(R * 1.7)), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`jaw|${key}|${rd}|${R}|${ic && ic[key] ? 1 : 0}`, R * 2 + 10, R * 2 + 10, (x, w, h) => { const cx = w / 2, cy = h / 2; btnFace(x, cx, cy, R, rd); let ok = false; if (ic && typeof ic[key] === 'function') { try { ic[key](x, cx, cy, R, rd); ok = true; } catch (e) { ok = false; } } if (!ok) paint(x, cx, cy, R, rd); btnRim(x, cx, cy, R, rd); }), b.x, b.y);
      if (busy) { c.save(); c.lineWidth = 3; c.strokeStyle = rgba(CYAN2, 0.85); c.beginPath(); c.arc(b.x, b.y, R + 2, t * 6, t * 6 + 1.6); c.stroke(); c.restore(); }
      if (cd > 0.05) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, R, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, cd / Math.max(0.1, cdMax))); c.closePath(); c.fillStyle = 'rgba(4,10,24,.55)'; c.fill(); GFX.textS(c, cd.toFixed(1), b.x, b.y, 13, '#FFFFFF'); }
      GFX.labelS(c, label, b.x, b.y + R + 9, small ? 7.5 : 8, 800, '#E4F6FF', 'rgba(0,0,0,.7)', 3); };
    const noPool = lev && !S.pools.some(p => p.state === 'available');
    if (!lev) { btn(B.s[0], 'waterBombs', 'WATER BOMBS', S.cd.s1, S.cdMax.s1 || TUNE.s1Cd, paintBombsBtn, S.busy === 'waterBombs'); btn(B.s[1], 'waterRay', 'WATER RAY', S.cd.s2, S.cdMax.s2 || TUNE.s2Cd, paintRayBtn, S.busy === 'waterRay'); btn(B.d, 'maw', 'MAW', S.cd.dodge, S.cdMax.dodge || TUNE.dodgeRec, paintMawBtn, !!S.maw); }
    else { btn(B.s[0], 'depthCharge', 'DEPTH CHARGE', S.cd.s1, S.cdMax.s1 || TUNE.s1Cd, paintDepthBtn, S.busy === 'depthCharge'); btn(B.s[1], 'maelstrom', noPool ? 'NEEDS A POOL' : 'MAELSTROM', S.cd.s2, S.cdMax.s2 || TUNE.s2Cd, paintMaelBtn, S.busy === 'maelstrom', noPool); btn(B.d, 'hydrojet', 'HYDROJET', S.cd.dodge, S.cdMax.dodge || TUNE.dodgeRec, paintJetBtn, !!S.jet); }
    /* (v321) no Anchor: the shark turns into Leviathan by itself at the fifth pool. TRANSFORM (small, labelled, above Dodge) takes Leviathan back to the shark; the shark has no button there */
    if (B.j && (lev || (S.xfm && S.xfm.to === 'shark'))) { const lk = S.xfLockT != null ? Math.max(0, TUNE.xfLock - (t - S.xfLockT)) : 0; btn(B.j, 'transform', S.xfm ? 'TRANSFORMING' : 'TRANSFORM', lk, TUNE.xfLock, paintReleaseBtn, !!S.xfm, false, true); }
    { const b = B.u, full = S.charge >= 1 && !S.used, k = S.used ? 1 : S.charge, fin = S.phase === 'finisher';
      if (full || fin) { const pl = 0.5 + 0.5 * Math.sin(t * 6); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.35 * pl; blitC(c, glowPic(glowSprite, CYAN, Math.round(b.r * (2.1 + 0.25 * pl) * 4) / 4), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`jaw|ult|${full || fin}|${b.r}|${ic && ic.sharkAttack ? 1 : 0}`, b.r * 2 + 12, b.r * 2 + 12, (x, w, h) => { const cx = w / 2, cy = h / 2; let ok = false; paintUltFace(x, cx, cy, b.r, full || fin); if (ic && typeof ic.sharkAttack === 'function') { try { ic.sharkAttack(x, cx, cy, b.r, full || fin); ok = true; } catch (e) { ok = false; } } if (!ok) paintAttackBtn(x, cx, cy, b.r, full || fin); x.lineWidth = 2; x.strokeStyle = full || fin ? CHROME : 'rgba(220,230,242,.4)'; x.beginPath(); x.arc(cx, cy, b.r, 0, TAU); x.stroke(); }), b.x, b.y);
      /* the gauge: a ring inside the button */
      c.save(); c.lineCap = 'round'; c.lineWidth = 4.5; c.strokeStyle = 'rgba(4,10,24,.85)'; c.beginPath(); c.arc(b.x, b.y, b.r - 2, 0, TAU); c.stroke(); if (k > 0.004) { c.strokeStyle = full ? WHITE : S.used ? 'rgba(111,232,255,.4)' : CYAN; c.lineWidth = 3.5; c.beginPath(); c.arc(b.x, b.y, b.r - 2, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke(); } c.restore();
      /* the summon time, apart from the gauge: an outer arc and the seconds */
      const ph = S.phase, run = ph === 'fly' || ph === 'siege' || ph === 'xform', left = run ? S.left : ph === 'summon' ? S.dur : 0;
      if (run || ph === 'summon') { const u = cl(left / S.dur), low = run && left < 5; c.save(); c.lineCap = 'round'; c.lineWidth = 2.5; c.strokeStyle = low ? 'rgba(255,120,150,.95)' : 'rgba(214,248,255,.9)'; c.beginPath(); c.arc(b.x, b.y, b.r + 4.5, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); c.restore();
        GFX.labelS(c, Math.ceil(left) + 's', b.x, b.y + b.r * 0.7, 10, 900, low ? '#FF9AB8' : '#EAF8FF', 'rgba(0,0,0,.75)', 3); }
      const lab = fin ? 'SHARK ATTACK!' : full ? 'SHARK ATTACK' : S.used ? 'SHARK ATTACK USED' : `SHARK ATTACK ${Math.floor(S.charge * 100)}%`;
      if (full) { const s = 1 + 0.08 * Math.sin(t * 7); c.save(); c.translate(b.x, b.y + b.r + 10); c.scale(s, s); GFX.labelS(c, lab, 0, 0, 11, 900, WHITE, 'rgba(8,30,80,.9)', 3.5); c.restore(); }
      else GFX.labelS(c, lab, b.x, b.y + b.r + 9, 9, 800, '#E4F6FF', 'rgba(0,0,0,.7)', 3);
      /* three pool indicators beside it: a filled drop = available, an amber ring with a dot = committed to an attack, a dark socket = empty */
      const pips = poolPips(S), n = pips.length; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 - 0.62 - (n - 1 - i) * (n > 3 ? 0.27 : 0.34), px = b.x + Math.cos(a) * (b.r + 15), py = b.y + Math.sin(a) * (b.r + 15), st2 = pips[i]; c.save();
        c.beginPath(); c.arc(px, py, 5.2, 0, TAU); c.fillStyle = st2 === 'available' ? CYAN : 'rgba(6,14,30,.85)'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = st2 === 'available' ? WHITE : st2 === 'claimed' ? AMBER : 'rgba(160,190,220,.45)'; c.stroke();
        if (st2 === 'claimed') { c.beginPath(); c.arc(px, py, 2, 0, TAU); c.fillStyle = AMBER; c.fill(); } c.restore(); }
      const cnt = S.ctx.pools.count(); GFX.labelS(c, `POOLS ${cnt.available}` + (cnt.claimed ? `+${cnt.claimed}` : '') + `/${S.poolMax}`, b.x - b.r * 0.9, b.y - b.r - 26, 7.5, 800, cnt.claimed ? '#FFE2A8' : '#CFEFFF', 'rgba(0,0,0,.7)', 3); }
  }
  /* deep blue faces, a chrome rim, a cyan inner ring when ready */
  function btnFace(x, cx, cy, r, rd) { const g = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); if (rd) { g.addColorStop(0, '#3B6FD8'); g.addColorStop(0.55, '#123A8E'); g.addColorStop(1, '#040E2A'); } else { g.addColorStop(0, '#28303E'); g.addColorStop(0.6, '#141A24'); g.addColorStop(1, '#080B10'); } x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
  function btnRim(x, cx, cy, r, rd) { x.lineWidth = 3; x.strokeStyle = rd ? CHROME : 'rgba(220,230,242,.4)'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke(); x.lineWidth = 1.6; x.strokeStyle = rd ? CYAN : 'rgba(111,232,255,.3)'; x.beginPath(); x.arc(cx, cy, r - 2.5, 0, TAU); x.stroke(); if (rd) { x.fillStyle = 'rgba(255,255,255,.16)'; x.beginPath(); x.ellipse(cx - r * 0.3, cy - r * 0.5, r * 0.3, r * 0.12, -0.5, 0, TAU); x.fill(); } }
  const pal = rd => ({ a: rd ? CYAN2 : '#7C8894', b: rd ? CYAN : '#56626E', c: rd ? CHROME : '#6C7682', d: rd ? COB : '#3A4452' });
  const jawG = (x, r, rd, open) => { const p = pal(rd); for (const sd of [-1, 1]) { x.save(); x.rotate(sd * open); x.fillStyle = p.c; x.beginPath(); x.moveTo(-r * 0.5, 0); x.quadraticCurveTo(0, sd * r * 0.5, r * 0.55, sd * r * 0.04); x.lineTo(r * 0.55, 0); x.closePath(); x.fill(); x.fillStyle = rd ? WHITE : '#9AA4AE'; for (let i = 0; i < 4; i++) { const tx = -r * 0.25 + i * r * 0.2; x.beginPath(); x.moveTo(tx, 0); x.lineTo(tx + r * 0.07, -sd * r * 0.14); x.lineTo(tx + r * 0.14, 0); x.closePath(); x.fill(); } x.restore(); } };
  function paintRayBtn(x, cx, cy, r, rd) { const p = pal(rd); x.save(); x.translate(cx, cy); x.rotate(-0.5); x.globalAlpha = rd ? 1 : 0.55; const g = x.createLinearGradient(-r * 0.6, 0, r * 0.6, 0); g.addColorStop(0, p.a); g.addColorStop(1, p.d); x.fillStyle = g; x.fillRect(-r * 0.6, -r * 0.09, r * 1.0, r * 0.18); x.strokeStyle = p.a; x.lineWidth = 1.5; for (const rr of [0.2, 0.32]) { x.beginPath(); x.ellipse(r * 0.45, 0, r * rr * 0.5, r * rr, 0, 0, TAU); x.stroke(); } x.fillStyle = p.b; x.beginPath(); x.ellipse(r * 0.45, r * 0.42, r * 0.3, r * 0.1, 0.5, 0, TAU); x.fill(); x.restore(); }
  function paintBombsBtn(x, cx, cy, r, rd) { const p = pal(rd); x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; for (const [px, py, k] of [[-0.36, 0.22, 0.2], [0.04, -0.22, 0.25], [0.42, 0.16, 0.18]]) { x.fillStyle = p.d; x.beginPath(); x.arc(px * r, py * r, k * r, 0, Math.PI * 2); x.fill(); x.fillStyle = rd ? FOAM : '#8A949E'; x.beginPath(); x.arc((px - 0.07) * r, (py - 0.07) * r, k * r * 0.32, 0, Math.PI * 2); x.fill(); } x.strokeStyle = rd ? FOAM : '#8A949E'; x.lineWidth = r * 0.07; x.lineCap = 'round'; x.beginPath(); x.moveTo(-r * 0.62, r * 0.56); x.quadraticCurveTo(0, r * 0.32, r * 0.62, r * 0.56); x.stroke(); x.restore(); }
  function paintMawBtn(x, cx, cy, r, rd) { x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.rotate(0.35); jawG(x, r, rd, 0.42); x.restore(); }
  function paintDepthBtn(x, cx, cy, r, rd) { const p = pal(rd); x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; const g = x.createRadialGradient(-r * 0.1, -r * 0.1, 0, 0, 0, r * 0.42); g.addColorStop(0, p.a); g.addColorStop(0.6, p.d); g.addColorStop(1, rd ? DEEP : '#20262E'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r * 0.42, 0, TAU); x.fill(); x.strokeStyle = p.a; x.lineWidth = 1.4; for (const rr of [0.24, 0.34]) { x.beginPath(); x.arc(0, 0, r * rr, 0.4, 2.6); x.stroke(); } x.strokeStyle = p.b; x.lineWidth = r * 0.07; x.lineCap = 'round'; x.beginPath(); x.moveTo(-r * 0.62, -r * 0.3); x.quadraticCurveTo(-r * 0.5, 0, -r * 0.42, r * 0.02); x.stroke(); x.restore(); }
  function paintMaelBtn(x, cx, cy, r, rd) { const p = pal(rd); x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.lineCap = 'round'; for (let i = 0; i < 3; i++) { x.strokeStyle = i ? p.b : p.a; x.lineWidth = r * (0.1 - i * 0.02); x.beginPath(); for (let k = 0; k <= 22; k++) { const a = i * 2.1 + k / 22 * 4.4, rr = r * 0.62 * (1 - 0.78 * k / 22); const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.72; if (k) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke(); } x.restore(); }
  function paintJetBtn(x, cx, cy, r, rd) { const p = pal(rd); x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.fillStyle = p.c; x.beginPath(); x.ellipse(r * 0.22, 0, r * 0.34, r * 0.2, 0, 0, TAU); x.fill(); x.strokeStyle = p.a; x.lineCap = 'round'; for (const [dy, L] of [[-0.18, 0.5], [0, 0.66], [0.18, 0.5]]) { x.lineWidth = r * 0.08; x.beginPath(); x.moveTo(-r * 0.12, dy * r); x.lineTo(-r * L, dy * r * 1.5); x.stroke(); } x.restore(); }
  function paintAnchorBtn(x, cx, cy, r, rd) { const p = pal(rd); x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.strokeStyle = p.c; x.lineWidth = r * 0.13; x.lineCap = 'round'; x.beginPath(); x.moveTo(0, -r * 0.42); x.lineTo(0, r * 0.45); x.moveTo(-r * 0.24, -r * 0.2); x.lineTo(r * 0.24, -r * 0.2); x.stroke(); x.beginPath(); x.arc(0, r * 0.05, r * 0.42, 0.25, Math.PI - 0.25); x.stroke(); x.beginPath(); x.arc(0, -r * 0.52, r * 0.1, 0, TAU); x.stroke(); x.restore(); }
  function paintReleaseBtn(x, cx, cy, r, rd) { const p = pal(rd); x.save(); x.translate(cx, cy); x.globalAlpha = rd ? 1 : 0.55; x.fillStyle = p.c; x.beginPath(); x.moveTo(r * 0.55, 0); x.quadraticCurveTo(0, -r * 0.42, -r * 0.35, -r * 0.05); x.lineTo(-r * 0.6, -r * 0.3); x.lineTo(-r * 0.5, r * 0.02); x.lineTo(-r * 0.6, r * 0.3); x.lineTo(-r * 0.35, r * 0.08); x.quadraticCurveTo(0, r * 0.38, r * 0.55, 0); x.closePath(); x.fill(); x.fillStyle = p.d; x.beginPath(); x.moveTo(-r * 0.05, -r * 0.22); x.lineTo(r * 0.05, -r * 0.55); x.lineTo(r * 0.18, -r * 0.2); x.closePath(); x.fill(); x.restore(); }
  function paintUltFace(x, cx, cy, r, full) { const g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r); g.addColorStop(0, full ? '#2F6BE0' : '#1C2638'); g.addColorStop(0.6, full ? '#0C2E7A' : '#0E1522'); g.addColorStop(1, '#02050C'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
  /* Shark Attack: a luminous jaw */
  function paintAttackBtn(x, cx, cy, r, full) { x.save(); x.translate(cx, cy); if (full) { const g = x.createRadialGradient(0, 0, 0, 0, 0, r * 0.7); g.addColorStop(0, 'rgba(214,248,255,.55)'); g.addColorStop(1, 'rgba(111,232,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r * 0.7, 0, TAU); x.fill(); } x.scale(1.15, 1.15); jawG(x, r, full, 0.5); x.restore(); }

  /* ================= the Ultimate ================= */
  U.jaws = (C, H) => {
    const me = H.me, g = H.g;
    /* (a spirit, an actor that is not the played pet: a burst of water where it stands) */
    if (me.spirit || !H.X.vehicle || !H.X.drawPetAt) { const DK = C.base * (C.K || 1); H.hitArea(me.x, me.y, 2.6, DK * 2.5, { el: 'water', src: 'ult' }); H.X.ring(me.x, me.y, 0.3, 2.6, 0.5, CYAN, 0.3); return; }
    if (g._jaws && !g._jaws.released) return;
    startForm(C, H);
  };
  /* idle-time preparation (20b calls it for an equipped Ultimate at the floor's start): the model's and E's, a slice a frame */
  let PUMP = null;
  U.jaws.warm = o => { setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T, M0 = MOD(); if (!(T > 0) || !M0) return;
    if (PUMP) return; let last = nowMs(), mvDone = false;
    const slice = ms => { let done = true; try { if (M0.warm) done = M0.warm(ms) === true; } catch (e) { done = true; } const MV = moves(); if (!mvDone && MV.warm) { try { mvDone = MV.warm(Math.min(2, ms)) === true; } catch (e) { mvDone = true; } } else mvDone = true; return done && mvDone; };
    PUMP = () => requestAnimationFrame(() => setTimeout(() => { const n = nowMs(), gap = n - last; last = n; if (slice(gap < 20 ? 3 : gap < 34 ? 1.6 : 0.8)) { PUMP = null; return; } PUMP(); }, 0));
    PUMP(); }, 300); };
  U.jaws.TUNE = TUNE; U.jaws.CLIPS = CLIPS;
  U.jaws.__dbg = { TUNE, CLIPS, SPR, STUB, STUBM, MOD, moves, poolApi, poolPips, safeReturn, nearestLand, groundAt, target, aimPoint, roomAt, anchorSpot, startOut, finish };
})();
