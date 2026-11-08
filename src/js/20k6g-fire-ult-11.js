/* ---------- Fire, the 11th Ultimate: Nidhogg (the core: worker N1) ----------
   A fiery seal opens under the pet, embers rise and Nidhogg (NIDHOGG_MODEL, 20k6f: a crimson half-living, half-machine
   wyvern) emerges through the heat haze; the pet mounts behind its neck, the wings spread and a great downstroke lifts
   it. For 20 s (25 at Adept, 35 at Celestial; game time, from the moment it can fly) the controls are the dragon's
   (20b's VEH hook):
     - the stick flies and steers in real free flight: an aerial volume of its own (the map plus TUNE.margin tiles of open
       air round it), over walls, gaps, water and beyond the land's outline, never snapped back. It cruises at a steady
       height, climbs to clear walls ahead and stays out of walls it cannot clear (a hand-drawn stage's walls are too
       tall to fly over). (Round 2: one cruise height; the altitude toggle is gone.) Turns are the model's snap-spins (turnDriver,
       drawn with drawSpin's motion blur); the camera follows it offshore at the flight zoom (0.9; round 2: the dragon is
       drawn at 0.65 of the model's size);
     - Dodge is Dive Bomb: zero cooldown. (Round 2) Like Drift: a full spin, then it folds and plunges at the stick's aim (an enemy near the aim line, else the
       ground there; with no stick the nearest enemy, else the ground below), flares to brake, slams once (TUNE.dive x DK
       in TUNE.diveR, knockback; charges the meter), with a fire shockwave, embers and glowing cracks, and climbs back
       spinning again; the rider rolls one flat turn with each spin (drawPetAt's rot, never a yaw).
       The next dive is accepted as soon as dive and recovery end (a press in the last TUNE.diveBuf s is kept). Aimed at
       nothing (open air, water, the void) it shows an invalid marker and keeps flying;
     - Strong 1 / 2 are Fireballs / Flare (worker N2's 20k6h, NIDHOGG_MOVES; stubs here if absent): exact 2 s / 4 s
       cooldowns, once per activation, counted from the press;
     - the Ult button is the Ultima meter: it fills only from the damage the form deals through ctx.hit (Dive Bomb,
       Fireballs, Flare; after mitigation, no overkill); a press when full starts Ultima (worker N3's 20k6i), once per
       form; it commits and plays out even past the timer.
   The pet keeps its own HP and defences (no dragon health). A safe return point is kept up to date (open walkable
   floor the pet could walk to from where the form began; revalidated at the exit), so the pet is never set down over
   the void, off the map or in a wall. Exit: timeout, Ultima's end, the pet's defeat, a party swap, the floor's end;
   the dragon glides to the return point and is dismissed in fire; the controls come back (the kit is never touched)
   and the Ult's 120 s cooldown starts then, once. */
(() => {
  const U = ELEM_IMPL.fire.ult;
  const TAU = Math.PI * 2;
  const FIRE = '#FF6A1A', EMBER = '#FFB347', CORE = '#FFF2C8', CRIM = '#D21E2A', RED = '#FF3A1E', GOLD = '#FFD266', WHITE = '#FFFFFF';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const wrap = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const calm = () => typeof reduceMotion !== 'undefined' && reduceMotion;
  const GY = 0.72, ZK = 0.695;
  const MOD = () => (typeof NIDHOGG_MODEL !== 'undefined' ? NIDHOGG_MODEL : null);

  /* ================= the tuning (configurable) ================= */
  const TUNE = {
    dur: [20, 25, 35], cd: 120,                    // s of flight at evo 1-3 / 4-6 / 7 (from the moment it can fly); the Ult's cooldown from the exit
    size: 0.65,                                    // (round 2, the user: "smaller by 35%") the dragon's drawn scale: wingspan ~7 tiles
    zoom: 0.9,                                     // the flight zoom: frames the smaller dragon on a 390 x 844 phone with room to aim
    top: 10, accel: 22, brake: 14,                 // tiles/s, tiles/s2
    cruise: 2.2, wallZ: 3.0, climbV: 5, sinkV: 2.6,   // tiles: the one cruise height (round 2: no high setting), the height that clears a wall; tiles/s up / down
    margin: 18,                                    // tiles of open air round the map the dragon may fly in (a soft edge: it simply cannot go further)
    dive: 3.0, diveR: 2.6, diveKb: 6.5,            // x DK once per monster at the slam; radius (+ the monster's own x0.85); knockback
    diveReach: 9, diveCone: 0.5, diveBuf: 0.3,     // tiles; rad either side of the aim for an enemy; s a press is kept before the dive ends
    /* (round 2) Dive Bomb is a spinning dive with Drift's cadence: a full spin at height, the plunge, the slam, a second
       spin as it climbs back. Seconds: spin, plunge (to the slam), hold, spin-and-climb: 0.2 + 0.32 + 0.08 + 0.3 = 0.9 s */
    divePh: [0.2, 0.32, 0.08, 0.3],
    chargeK: 30,                                   // the meter fills at chargeK x DK of damage actually dealt
    cdFire: 2, cdFlare: 4, mvHold: 0.6,            // s, exact, from the press of an activation; a press held while busy
    summon: 3.4, ultCap: 14, ultWonCap: 14,        // s: the model's summon clip; a started Ultima is ended anyway after this
    outGlide: [0.35, 1.4], outSpd: 13, dismiss: 1.6,   // s min / max of the glide to the return point; tiles/s; the dismiss clip
  };
  const tierOf = ev => ev >= 7 ? 2 : ev >= 4 ? 1 : 0;

  /* ================= N2's / N3's moves (looked up at call time), or stubs so the whole flow can run ================= */
  const STUB = {
    TUNE_S: {},
    fireballs(ctx) { const n = ctx.tier + 1, d = ctx.dragon, P = d.pose, C = MOD().CLIPS.fireball; let t = 0, k = 0;
      const f = ctx.H.add({ life: 3, update(dt) { if (!ctx.alive()) { f.life = 0; ctx.done(); return; } t += dt; const h = C.run(P, t, dt, { n }) || {};
        if (h.shot && k < n) { k++; const T = ctx.target(), p = T.m ? { x: T.m.x, y: T.m.y } : ctx.aimPoint(); if (p) ctx.X.after(0.45, () => { if (!ctx.alive() && !ctx.H) return; if (ctx.groundAt(p.x, p.y) || T.m) { ctx.hitArea(p.x, p.y, 1.8, ctx.DK * 3); ctx.X.ring(p.x, p.y, 0.3, 1.8, 0.35, FIRE, 0.25); } }); }
        if (t >= C.dur) { f.life = 0; ctx.done(); } } }); },
    flare(ctx) { const n = [10, 20, 30][ctx.tier], d = ctx.dragon, P = d.pose, C = MOD().CLIPS.flare; let t = 0, k = 0;
      const f = ctx.H.add({ life: 3, update(dt) { if (!ctx.alive()) { f.life = 0; ctx.done(); return; } t += dt; C.run(P, t, dt);
        while (k < n && t > 0.25 + k * 0.03) { k++; const M = ctx.mons(), m = M.length ? M[k % M.length] : null; if (m && Math.hypot(m.x - d.x, m.y - d.y) < 10) ctx.X.after(0.4, () => { if (!m.dead) ctx.hit(m, ctx.DK * 0.5); }); }
        if (t >= C.dur) { f.life = 0; ctx.done(); } } }); },
    ultima(ctx) { const d = ctx.dragon, P = d.pose, CL = MOD().CLIPS; let t = 0, ph = 'ultima', tick = 0, boomed = false; const g0 = { x: d.x + Math.cos(d.heading) * 1.5, y: d.y + Math.sin(d.heading) * 1.5 };
      const f = ctx.H.add({ life: 16, update(dt) { if (!ctx.alive()) { f.life = 0; return; } t += dt;
        if (ph === 'ultima') { CL.ultima.run(P, t, dt); if (t >= CL.ultima.dur) { ph = 'beam'; t = 0; ctx.camera({ zoom: 0.62 }); } }
        else if (ph === 'beam') { CL.beam.run(P, t, dt); tick -= dt; if (tick <= 0) { tick = 0.15; ctx.hitArea(g0.x, g0.y, 2.4, ctx.DK * 0.6, { noCharge: true }); }
          if (t >= 1.5) { ph = 'settle'; t = 0; boomed = true; ctx.hitArea(g0.x, g0.y, 6.5, ctx.DK * 14, { noCharge: true }); ctx.X.ring(g0.x, g0.y, 0.5, 6.5, 0.7, FIRE, 0.4); ctx.camera({ shake: 8 }); } }
        else { CL.settle.run(P, t, dt); if (t >= CL.settle.dur) { f.life = 0; ctx.camera(null); ctx.safeReturn(); ctx.done(); } } void boomed; } }); },
  };
  let MVC = null, MVK = null;
  function moves() { let NM = null; try { NM = typeof self !== 'undefined' && self.NIDHOGG_MOVES ? self.NIDHOGG_MOVES : null; } catch (e) { NM = null; } if (!NM) return STUB;
    const key = [NM.fireballs, NM.flare, NM.ultima, NM.TUNE_S, NM.update, NM.drawUnder, NM.drawOver, NM.warmS, NM.warmU];
    if (MVC && MVK && MVK.every((v, i) => v === key[i])) return MVC; MVK = key;
    return (MVC = { TUNE_S: NM.TUNE_S || {}, TUNE_U: NM.TUNE_U, fireballs: typeof NM.fireballs === 'function' ? NM.fireballs : STUB.fireballs, flare: typeof NM.flare === 'function' ? NM.flare : STUB.flare, ultima: typeof NM.ultima === 'function' ? NM.ultima : STUB.ultima,
      warmS: NM.warmS, warmU: NM.warmU, update: NM.update, drawUnder: NM.drawUnder, drawOver: NM.drawOver, NM }); }
  const WARMED = {}; let WARMI = 0;
  /* (the fix for the 'split apart' dragon) The model bakes its pieces per heading in the background; a piece whose
     heading is not baked yet is drawn from another heading (or not at all), so a cold model shows the head, neck, body
     and tail out of step. So the dragon is only ever DRAWN at a heading whose whole picture set is usable (sharp, or the
     quick half-size pictures); if the heading it should face is not ready, it is drawn at the nearest ready one, while
     the wanted one goes to the front of the bake queue (quick pictures first). Flight still follows the stick exactly. */
  function MDB() { const M0 = MOD(); return M0 && M0.__dbg; }
  /* the bake scale: the tile size (px, at zoom 1, times dpr) at the flight zoom; an existing bake within 25% is kept */
  const bakeT = TSdpr => TSdpr * TUNE.zoom * TUNE.size;   /* (round 2: the smaller dragon bakes smaller, so it bakes faster) */
  function bakeScaleOK(TSdpr) { const D = MDB(), k = D && D.BK && D.BK.k; if (!k) return false; const want = Math.round(bakeT(TSdpr) * (MOD().VIS || 1.25) / 8) * 8; return k >= want * 0.75; }
  function usableAt(a) { const D = MDB(); if (!D || !D.usableB) return true; return D.usableB(D.bucketOf(a)); }
  function drawHeading(S, a) { const D = MDB(); if (!D || !D.usableB) return a; const NB = 16, b = D.bucketOf(a); if (D.usableB(b)) return a;
    for (let d = 1; d <= NB / 2; d++) for (const bb of [(b + d) % NB, (b - d + NB) % NB]) if (D.usableB(bb)) { S.offHeading = (S.offHeading || 0) + 1; return bb / NB * TAU; }
    return null; }
  function wantHeading(a) { const D = MDB(); if (!D || !D.want || !D.BK || !D.BK.k) return; const b = D.bucketOf(a); if (!D.readyB(b)) D.want(b, !D.usableB(b)); }
  /* a stand-in for the turn driver handed to drawSpin: the drawn heading, and only the ghosts whose headings are ready */
  function spinProxy(S, a) { const TD = S.TD, P = S.TDP || (S.TDP = {}), nb = !!S.noBlur; P.a = a; P.spin = nb ? null : TD.spin; P.blur = nb ? 0 : TD.blur; P.last = TD.last; P.u = TD.u;   /* (S.noBlur: tests count the body without the spin's streaks) */
    P.ghosts = n => (nb || Math.abs(wrap(a - TD.a)) > 0.05 ? [] : TD.ghosts(n).filter(g => usableAt(g.a))); return P; }
  function warmMoves(ms) { const MV = moves(), ws = ['warmS', 'warmU'].filter(w => MV[w] && !WARMED[w]); if (!ws.length || ms < 0.4) return; const w = ws[(WARMI++) % ws.length]; try { if (MV[w](Math.min(2, ms)) === true) WARMED[w] = true; } catch (e) { WARMED[w] = true; } }

  /* ================= the air: the map's tiles, the open air round it, the walls ================= */
  function airOf(X) { try { return X.air ? X.air() : null; } catch (e) { return null; } }
  function inMap(S, x, y) { const A = S.air; return !!A && x >= 0 && y >= 0 && x < A.w && y < A.h; }
  const tileOf = (S, x, y) => inMap(S, x, y) ? S.air.tile(Math.floor(x), Math.floor(y)) : -1;   // (-1: open air off the map)
  /* a wall the dragon must clear (T_SOLID inside the map) within r of (x, y) */
  function wallNear(S, x, y, r) { for (let ty = Math.floor(y - r); ty <= Math.floor(y + r); ty++) for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) { if (!inMap(S, tx + 0.5, ty + 0.5) || S.air.tile(tx, ty) !== T_SOLID) continue; const cx = Math.max(tx, Math.min(x, tx + 1)), cy = Math.max(ty, Math.min(y, ty + 1)); if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true; } return false; }
  /* solid ground to strike: walkable floor inside the map (not a wall top, water, a pit, lava, the sky or the void) */
  function groundAt(S, x, y) { const t = tileOf(S, x, y); return t >= 0 && T_WALK[t] === 1; }
  function surfaceAt(S, x, y) { const t = tileOf(S, x, y); return t < 0 ? 'void' : t === T_SOLID ? 'wall' : T_WALK[t] === 1 ? 'floor' : 'gap'; }
  function canStand(S, x, y) { return groundAt(S, x, y) && !S.X.blocked(x, y, 0.38, 0) && !S.X.blocked(x, y, 0.2, 0); }
  /* where the pet could walk from where the form began (a flood over walkable tiles, rebuilt every 2 s from the last
     safe point, so a door that opens is taken into account) */
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
  /* a landing with room round it: the tile's centre when that is open (a point on a wall's margin could be nudged into it) */
  function sturdy(S, p) { if (!p) return p; const cx = Math.floor(p.x) + 0.5, cy = Math.floor(p.y) + 0.5; if (safeOK(S, cx, cy) && !S.X.blocked(cx, cy, 0.5, 0)) return { x: cx, y: cy }; return p; }
  /* the nearest safe landing to (x, y): a ring search, then the last safe point, then where the form began */
  function nearestLand(S, x, y, maxR) {
    if (safeOK(S, x, y)) return { x, y };
    for (let r = 0.5; r <= (maxR || 8); r += 0.5) { const n = Math.max(8, Math.round(r * 8)); let best = null, bd = 1e9;
      for (let i = 0; i < n; i++) { const a = i / n * TAU, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (!safeOK(S, px, py)) continue; const d = S.safe ? Math.hypot(px - S.safe.x, py - S.safe.y) : 0; if (d < bd) { bd = d; best = { x: px, y: py }; } }
      if (best) return best; }
    return null;
  }
  function safeReturn(S) {
    const d = S.dragon;
    let p = nearestLand(S, d.x, d.y, 2.5);
    if (!p && S.safe && safeOK(S, S.safe.x, S.safe.y)) p = { x: S.safe.x, y: S.safe.y };
    if (!p && S.safe) p = nearestLand(S, S.safe.x, S.safe.y, 6);
    if (!p) { const w = S.X.walkPoint(S.home.x, S.home.y, { r: 0.4, x: S.home.x, y: S.home.y }); p = { x: w.x, y: w.y }; }
    return sturdy(S, p);
  }

  /* ================= the form ================= */
  function startForm(C, H) {
    const me = H.me, g = H.g, X = H.X, M0 = MOD(), ev = evoOf(C), tier = tierOf(ev), K = C.K || 1, DK = C.base * K * (1 + 0.08 * (ev - 1));
    const kit = X.kit ? X.kit() : null, CD = (kit && kit.ult && kit.ult.key === 'ey_nidhogg' && kit.ult.cd) || TUNE.cd, dur = TUNE.dur[tier];
    // (one bake scale for the whole floor: the dragon's drawn size in flight. Re-scaling would make the model throw away
    //  every picture baked in idle time and start again, which is what drew a cold, split dragon)
    const T0 = X.Tz(), dpr = (typeof arc !== 'undefined' && arc.dpr) || 1, inst = M0.create(bakeScaleOK(T0 / Math.max(0.5, g.zoom || 1) * dpr) ? {} : { T: bakeT(T0 / Math.max(0.5, g.zoom || 1) * dpr), dpr: 1 }), P = inst.pose; P.alpha = 0;
    const tgt = X.nearestMon(me.x, me.y, 9); const a0 = tgt ? Math.atan2(tgt.y - me.y, tgt.x - me.x) : (me.face < 0 ? Math.PI : 0);
    const TD = M0.turnDriver({ a: a0 });
    const dragon = { x: me.x, y: me.y, z: 0, heading: TD.a, vx: 0, vy: 0, pose: P, locked: true, vis: 1 };
    const S = { H, g, me, X, C, ev, tier, DK, CD, dur, left: dur, dragon, inst, TD, phase: 'summon', t: 0, ct: 0, charge: 0, used: false, busy: null, busyT: 0, cdF: 0, cdL: 0, mvQ: null, ultQ: null, dive: null, diveQ: null,
      gate: new Map(), parts: [], free: [], cracks: [], marks: [], ended: false, pet: X.pet ? X.pet() : null, air: airOf(X), home: { x: me.x, y: me.y }, safe: { x: me.x, y: me.y }, safeT: 0, reachT: 2, cam: null, camShake: 0,
      stats: { dives: 0, diveHit: 0, diveBad: 0, fireballs: 0, flare: 0, ultima: 0, dealt: 0, charged: 0, hits: 0, flyT: 0, offT: 0, maxOff: 0, spins: 0 }, sfxT: 0, mx: 0, my: 0 };
    buildReach(S, me.x, me.y);
    g._nidhogg = S;
    const ctx = S.ctx = { X, H, C, evo: ev, tier, DK, dragon, petX: me.x, petY: me.y, petZ: 0, ultima: false, sfx: X.sfx || {}, model: M0,
      hit: (m, dmg, o) => hitCharge(S, m, dmg, o),
      hitArea: (x, y, r, dmg, o) => { let n = 0; const ex = o && o.exclude; for (const m of H.living()) { if (ex && (ex === m || (ex.has && ex.has(m)))) continue; if (Math.hypot(m.x - x, m.y - y) < r + (m.r || 0.4)) { hitCharge(S, m, dmg, o); n++; } } return n; },
      mons: () => H.living(), target: () => target(S), aimPoint: () => aimPoint(S), aimDir: () => { const m = Math.hypot(S.mx, S.my); return m > 0.2 ? Math.atan2(S.my, S.mx) : dragon.heading; }, stick: () => ({ x: S.mx, y: S.my, mag: Math.min(1, Math.hypot(S.mx, S.my)) }),
      groundAt: (x, y) => groundAt(S, x, y), surfaceAt: (x, y) => surfaceAt(S, x, y), canStand: (x, y) => canStand(S, x, y), nearestLand: (x, y) => nearestLand(S, x, y, 8) || safeReturn(S),
      anchor: n => { const p = inst.anchor(n); return p ? { x: p.x, y: p.y, z: p.z } : { x: dragon.x, y: dragon.y, z: dragon.z }; },
      scr: (x, y, z) => [H.sx(x), H.sy(y) - (z || 0) * ZK * X.Tz()], T: () => X.Tz(),
      camera: o => { if (!o) { S.cam = null; return; } if (o.shake) { if (!calm()) X.shake(Math.min(10, o.shake), Math.min(0.5, o.dur || 0.25)); } const c0 = S.cam || {}; S.cam = { zoom: o.zoom != null ? Math.max(0.5, Math.min(1.1, o.zoom)) : c0.zoom, x: o.x != null ? o.x : c0.x, y: o.y != null ? o.y : c0.y, k: o.k != null ? cl(o.k) : c0.k }; },   /* (a framing point x, y with k = how far the view leans to it; zoom; a later call merges) */
      safeReturn: () => { const p = safeReturn(S); S.retPt = p; return { x: p.x, y: p.y }; },
      done: () => actionDone(S), alive: () => !S.ended && !me.dead && !g.over && (S.phase === 'ultima' || (S.phase === 'fly' && !g.won)),
      calm, low: lowFx };
    S.veh = { get active() { return !S.released; }, noJumpBtn: true /* (round 2: no altitude button; J does nothing) */, drive: (mx, my, dt) => drive(S, mx, my, dt), dodge: (mx, my) => tryDive(S, mx, my), jump: () => {}, strong: slot => tryMove(S, slot), ult: () => tryUlt(S), drawBtns: (c, o) => drawBtns(S, c, o), onSwitch: () => finish(S, 'swap'),
      cam: () => camFocus(S) };
    X.vehicle(S.veh);
    const F = S.fx = H.add({ key: 'nidhogg', life: 1e9, entY: me.y,
      update(dt) { step(S, dt); }, drawUnder(c) { drawUnder(S, c); }, drawEnt(c) { drawEnt(S, c); }, draw(c) { drawOver(S, c); },
      onEnd() { if (!S.released) release(S); } });
    me.petAlt = F;
    const sfx = X.sfx || {}; if (sfx.note) { sfx.note(55, 1.2, 'sawtooth', 0.06, 80); sfx.note(110, 0.9, 'triangle', 0.05, 165, 0.2); } if (sfx.hiss) sfx.hiss(0.8, 0.08, 900);
    return S;
  }
  function camFocus(S) { const d = S.dragon, c = S.cam; return { x: c && c.x != null ? c.x : d.x, y: c && c.y != null ? c.y : d.y, k: c && c.x != null ? (c.k != null ? c.k : 0.6) : 0, zoom: c && c.zoom ? c.zoom : S.phase === 'summon' ? lerp(1, TUNE.zoom, sstep(1.8, 3.0, S.t)) : S.phase === 'out' || S.phase === 'gone' ? 1 : TUNE.zoom }; }

  /* ---- targeting: an enemy near the stick's aim line, else the first ground along it; with no stick the nearest enemy ---- */
  function target(S) { const d = S.dragon, mag = Math.hypot(S.mx, S.my), M = S.H.living();
    if (mag > 0.2) { const a = Math.atan2(S.my, S.mx); let best = null, bs = 1e9; for (const m of M) { const dx = m.x - d.x, dy = m.y - d.y, dist = Math.hypot(dx, dy); if (dist > TUNE.diveReach + 2) continue; const off = Math.abs(wrap(Math.atan2(dy, dx) - a)); if (off > TUNE.diveCone + (dist < 2 ? 0.8 : 0)) continue; const s = dist + off * 6; if (s < bs) { bs = s; best = m; } } if (best) return { x: best.x, y: best.y, m: best }; }
    else { let best = null, bd = 11; for (const m of M) { const dist = Math.hypot(m.x - d.x, m.y - d.y); if (dist < bd) { bd = dist; best = m; } } if (best) return { x: best.x, y: best.y, m: best }; }
    const p = aimPoint(S); return p ? { x: p.x, y: p.y, m: null } : { x: d.x + Math.cos(d.heading) * 4, y: d.y + Math.sin(d.heading) * 4, m: null };
  }
  /* the aimed ground point (null over no ground): along the stick from 3 tiles out (the first ground met, so a dragon
     offshore can strike the land's edge), or below / just ahead of the dragon */
  function aimPoint(S) { const d = S.dragon, mag = Math.hypot(S.mx, S.my);
    if (mag > 0.2) { const a = Math.atan2(S.my, S.mx), ca = Math.cos(a), sa = Math.sin(a); const p0 = { x: d.x + ca * 4.5, y: d.y + sa * 4.5 }; if (groundAt(S, p0.x, p0.y)) return p0;
      for (let s = 2; s <= TUNE.diveReach; s += 0.35) { const x = d.x + ca * s, y = d.y + sa * s; if (groundAt(S, x, y)) return { x: x + ca * 0.6 * (groundAt(S, x + ca * 0.6, y + sa * 0.6) ? 1 : 0), y: y + sa * 0.6 * (groundAt(S, x + ca * 0.6, y + sa * 0.6) ? 1 : 0) }; } return null; }
    const ca = Math.cos(d.heading), sa = Math.sin(d.heading); for (const s of [1.5, 0.5, 2.5, 3.5]) { const x = d.x + ca * s, y = d.y + sa * s; if (groundAt(S, x, y)) return { x, y }; } return null;
  }

  /* ---- damage and the meter: each event once, after mitigation, without overkill ---- */
  function hitCharge(S, m, dmg, o) {
    if (!m || m.dead || m.falling || !(dmg > 0)) return 0;
    const before = Math.max(0, m.hp), oo = Object.assign({ el: 'fire', src: 'ult' }, o || {}); delete oo.noCharge; delete oo.exclude;
    const r = S.X.hitMon(m, dmg, oo), dealt = Math.max(0, Math.min(r || 0, before));
    if (!(dealt > 0)) return 0;
    S.stats.dealt += dealt; S.stats.hits++;
    if (!(o && o.noCharge) && S.phase === 'fly' && !S.used && !S.released) { const c0 = S.charge; S.charge = Math.min(1, S.charge + dealt / (TUNE.chargeK * S.DK)); S.stats.charged += S.charge - c0;
      if (c0 < 1 && S.charge >= 1) { const sfx = S.X.sfx || {}; if (sfx.note) [196, 294, 392, 587].forEach((f, i) => sfx.note(f, 0.45, 'sawtooth', 0.04, f * 1.01, i * 0.08)); S.X.text(S.dragon.x, S.dragon.y - 3, 'ULTIMA READY', EMBER, 16, { life: 1.4, max: 1.4, vy: -0.5 }); } }
    return dealt;
  }

  /* ---- free flight ---- */
  function drive(S, mx, my, dt) { S.mx = mx; S.my = my; syncMe(S); void dt; }   // (the stick is read here; the flight runs in step, every frame)
  function fly(S, dt, steer) {
    const d = S.dragon, A = S.air, mag = steer ? Math.min(1, Math.hypot(S.mx, S.my)) : 0, TD = S.TD;
    const top = TUNE.top * (S.me.chill > 0 ? 0.8 : 1) * (S.g.buff && S.g.buff.haste > 0 ? 1.15 : 1);
    const want = mag > 0.15 ? TD.want : d.heading, tvx = mag > 0.15 ? Math.cos(want) * top * mag : 0, tvy = mag > 0.15 ? Math.sin(want) * top * mag : 0, k = Math.min(1, (mag > 0.15 ? TUNE.accel / top : TUNE.brake / top) * dt * 2.2);
    d.vx += (tvx - d.vx) * k; d.vy += (tvy - d.vy) * k;
    // the height: cruise; a wall ahead lifts it to clearance; on a hand-drawn stage walls are never flown over
    let zT = TUNE.cruise; const sp = Math.hypot(d.vx, d.vy), ux = sp > 0.1 ? d.vx / sp : Math.cos(d.heading), uy = sp > 0.1 ? d.vy / sp : Math.sin(d.heading), look = 0.6 + sp * 0.25;
    const tall = !A || A.hand;
    if (!tall && (wallNear(S, d.x, d.y, 0.7) || wallNear(S, d.x + ux * look, d.y + uy * look, 0.7))) zT = Math.max(zT, TUNE.wallZ);
    { const dz = zT - d.z, vmax = dz > 0 ? TUNE.climbV : TUNE.sinkV; d.z += Math.sign(dz) * Math.min(Math.abs(dz), vmax * dt * Math.min(1, Math.abs(dz) * 1.6 + 0.15)); }
    // the move: an axis at a time; a wall it cannot clear yet (too low, or a tall stage's wall) stops it on that axis
    const blockAt = (x, y) => (tall || d.z < TUNE.wallZ - 0.35) && wallNear(S, x, y, 0.55);
    const nx = d.x + d.vx * dt, ny = d.y + d.vy * dt;
    if (!blockAt(nx, d.y)) d.x = nx; else d.vx *= 0.3;
    if (!blockAt(d.x, ny)) d.y = ny; else d.vy *= 0.3;
    // the aerial volume: the map plus a margin of open air; at its edge it simply stops (no snapping back)
    if (A) { const m = TUNE.margin; if (d.x < -m) { d.x = -m; d.vx = Math.max(0, d.vx); } if (d.x > A.w + m) { d.x = A.w + m; d.vx = Math.min(0, d.vx); } if (d.y < -m) { d.y = -m; d.vy = Math.max(0, d.vy); } if (d.y > A.h + m) { d.y = A.h + m; d.vy = Math.min(0, d.vy); } }
    return mag;
  }
  function syncMe(S) { const me = S.me, d = S.dragon; me.x = d.x; me.y = d.y; me.vx = d.vx; me.vy = d.vy; me.z = 0; me.airborne = S.phase !== 'gone'; const c = Math.cos(d.heading); if (Math.abs(c) > 0.25) me.face = c > 0 ? 1 : -1; }

  /* ---- Dive Bomb (replaces Dodge): zero cooldown ---- */
  function tryDive(S, mx, my, queued) {
    if (S.phase !== 'fly') return; S.mx = mx; S.my = my;
    const d = S.dragon;
    if (S.dive) { if (!queued && S.dive.t >= S.dive.end - TUNE.diveBuf) S.diveQ = S.g.t; return; }   // (the dive and its recovery first; a press near its end is kept)
    if (d.locked || S.busy === 'ultima') return;
    if (S.busy) { if (!queued) S.diveQ = S.g.t; return; }
    S.diveQ = null;
    const T = target(S); let p = T.m ? { x: T.m.x, y: T.m.y } : groundAt(S, T.x, T.y) ? { x: T.x, y: T.y } : null;
    if (!p) { const q = aimPoint(S); if (q) p = q; }
    if (!p) { // no ground to strike: an invalid marker where it aimed, and it keeps flying
      const a = Math.hypot(mx, my) > 0.2 ? Math.atan2(my, mx) : d.heading; S.marks.push({ x: d.x + Math.cos(a) * 4.5, y: d.y + Math.sin(a) * 4.5, t: 0, life: 0.7 }); S.stats.diveBad++;
      const sfx = S.X.sfx || {}; if (sfx.wrong) sfx.wrong(); return; }
    const a = Math.atan2(p.y - d.y, p.x - d.x), dist = Math.hypot(p.x - d.x, p.y - d.y), Ph = TUNE.divePh;
    // (round 2) a full spin first (as Drift: away from the new heading, so a turn of less than a full one never shows), then
    // the plunge onto the point; the body ends a little short of it along the dive so its belly comes down on it
    const a1 = dist > 0.3 ? a : d.heading, off = wrap(a1 - S.TD.a), dir = Math.abs(off) > 0.15 ? Math.sign(off) : -(S.lastDir || -1); S.lastDir = dir;
    S.dive = { t: 0, ct: 0, end: Ph[0] + Ph[1] + Ph[2] + Ph[3], x0: d.x, y0: d.y, z0: d.z, tx: p.x, ty: p.y, m: T.m, a: a1, dist, slam: false, spin2: false, dir };
    spinTo(S, a1, off + dir * TAU * (Math.abs(off) > 0.15 ? 1 : 1), Ph[0]);
    S.busy = 'dive'; S.busyT = 0; S.stats.dives++; S.g.movedOnce = true; S.g.dodges = (S.g.dodges || 0) + 1;
    const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) { sfx.note(140, 0.4, 'sawtooth', 0.05, 60); sfx.note(320, 0.25, 'triangle', 0.03, 180, 0.08); }
  }
  /* a full snap-spin through the model's turn driver (its ghosts, swooshes, bank kick and tail whip come with it) */
  function spinTo(S, to, span, dur) { const TD = S.TD; TD.want = to; TD.spin = { from: TD.a, span, dir: span > 0 ? 1 : -1, t: 0, dur, to: wrap(to) }; TD.u = 0; TD.blur = 0; TD.spins = (TD.spins || 0) + 1; S.stats.spins++; S.spinDir = span > 0 ? 1 : -1; }
  /* the rider's flat 2D roll: one turn per spin, exactly as Drift rolls the pet's sprite (never a yaw) */
  function petRoll(S) { const TD = S.TD, Sp = TD.spin; if (!S.dive || !Sp) return 0; const u = TD.u, e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; return Sp.dir * TAU * e; }
  function stepDive(S, dt) {
    const D = S.dive, d = S.dragon, P = d.pose, CL = MOD().CLIPS.dive, Ph = TUNE.divePh, t1 = Ph[0], t2 = t1 + Ph[1], t3 = t2 + Ph[2]; D.t += dt;
    // the model's dive clip, retimed: fold during the spin, plunge, braking flare to the slam, hold, recovery
    const t = D.t, prev = D.ct; D.ct = t < t1 ? 0.25 * t / t1 : t < t2 - 0.08 ? 0.25 + 0.55 * (t - t1) / (Ph[1] - 0.08) : t < t2 ? 0.8 + 0.2 * (t - (t2 - 0.08)) / 0.08 : t < t3 ? 1.0 + 0.15 * (t - t2) / Ph[2] : 1.15 + 1.05 * cl((t - t3) / Ph[3]);
    CL.run(P, D.ct, Math.max(0, D.ct - prev));
    if (D.m && !D.m.dead && t < t2 - 0.1) { D.tx = D.m.x; D.ty = D.m.y; }   // (it tracks an enemy until it is committed)
    if (t < t1) { d.z = D.z0 + 0.25 * Math.sin(Math.PI * t / t1); d.vx *= 0.8; d.vy *= 0.8; }   // the spin, rising a little
    else if (t <= t2) { const u = sstep(t1, t2, t), ez = Math.pow(cl((t - t1) / Ph[1]), 1.4); d.x = lerp(D.x0, D.tx, u); d.y = lerp(D.y0, D.ty, u); d.z = lerp(D.z0 + 0.1, 0.3, ez); d.vx = (D.tx - D.x0) / Ph[1]; d.vy = (D.ty - D.y0) / Ph[1];
      // fire streams from the armour seams on the way down
      if (Math.random() < dt * (lowFx() ? 20 : 60)) { const a = Math.random() * TAU; addPart(S, 1, d.x + Math.cos(a) * 0.5, d.y + Math.sin(a) * 0.4, d.z + 0.4, -d.vx * 0.15 + Math.cos(a), -d.vy * 0.15 + Math.sin(a) * GY, 1.5 + Math.random() * 2, 0.35 + Math.random() * 0.25, 0.14, { col: Math.random() < 0.5 ? FIRE : EMBER }); } }
    if (!D.slam && t >= t2) { D.slam = true; d.x = D.tx; d.y = D.ty; d.z = 0.3; d.vx = d.vy = 0; slam(S, D.tx, D.ty); }
    // the second spin as it pushes back up into flight
    if (t >= t3 && !D.spin2) { D.spin2 = true; spinTo(S, D.a, -D.dir * TAU, Ph[3] * 0.9); const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); }
    if (t > t3) { const u = sstep(t3, D.end, t); d.z = lerp(0.3, TUNE.cruise, u); }
    if (t >= D.end) { S.dive = null; S.busy = null; d.vx = d.vy = 0; if (S.diveQ != null && S.g.t - S.diveQ < TUNE.diveBuf + 0.3) { S.diveQ = null; tryDive(S, S.mx, S.my, true); } }
  }
  /* the slam: one damage event per monster in reach, the fire shockwave, embers, glowing cracks (light only) */
  function slam(S, x, y) {
    const X = S.X, Q = lowFx() ? 0.4 : 1; let n = 0;
    for (const m of S.H.living()) { if (Math.hypot(m.x - x, m.y - y) > TUNE.diveR + (m.r || 0.4) * 0.85) continue; hitCharge(S, m, S.DK * TUNE.dive, { kb: TUNE.diveKb });   /* (one damage event: no burn ticks on top) */ S.stats.diveHit++; n++; }
    addPart(S, 9, x, y, 0, 0, 0, 0, 0.55, TUNE.diveR * 1.1, {}); addPart(S, 9, x, y, 0, 0, 0, 0, 0.8, TUNE.diveR * 0.6, {});
    for (let i = 0; i < Math.round(36 * Q); i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 5; addPart(S, 1, x + Math.cos(a) * 0.5, y + Math.sin(a) * 0.4, 0.2, Math.cos(a) * v, Math.sin(a) * v * GY, 1 + Math.random() * 3.5, 0.5 + Math.random() * 0.6, 0.12 + Math.random() * 0.1, { col: i % 3 ? FIRE : i % 2 ? EMBER : CORE, g: 4 }); }
    for (let i = 0; i < Math.round(10 * Q); i++) { const a = Math.random() * TAU, v = 1 + Math.random() * 2; addPart(S, 2, x + Math.cos(a) * 0.8, y + Math.sin(a) * 0.6, 0.1, Math.cos(a) * v, Math.sin(a) * v * GY, 0.6, 0.9 + Math.random() * 0.5, 0.45 + Math.random() * 0.3, { grow: 1.4, drag: 2 }); }
    // cracks: jagged glowing lines out from the impact (they cool and fade; nothing dark is left)
    const nc = lowFx() ? 5 : 8; for (let i = 0; i < nc; i++) { const a = i / nc * TAU + Math.random() * 0.5, L = 1.4 + Math.random() * 1.4, pts = [[x, y]]; let px = x, py = y; for (let k = 0; k < 4; k++) { const aa = a + (Math.random() - 0.5) * 0.7, s = L / 4; px += Math.cos(aa) * s; py += Math.sin(aa) * s; pts.push([px, py]); } S.cracks.push({ pts, t: 0, life: 1.8 + Math.random() * 0.6 }); }
    if (S.cracks.length > 24) S.cracks.splice(0, S.cracks.length - 24);
    X.light(x, y, 3.6, 0.25); if (!calm()) { X.shake(n ? 7 : 5, 0.2); if (n && X.hitstop) X.hitstop(0.05); }
    const sfx = X.sfx || {}; if (sfx.thud) sfx.thud(); if (sfx.crash) sfx.crash(); if (sfx.stomp) sfx.stomp(); if (sfx.note) { sfx.note(55, 0.55, 'sawtooth', 0.12, 30); sfx.note(110, 0.3, 'square', 0.03, 70, 0.02); } if (sfx.hiss) sfx.hiss(0.4, 0.1, 1400);
  }

  /* ---- the Strongs and Ultima ---- */
  function tryMove(S, slot, queued) {
    const d = S.dragon, sfx = S.X.sfx || {}, fb = slot !== 'strong2', cd = fb ? S.cdF : S.cdL;
    if (S.phase !== 'fly') return;
    if (S.busy || d.locked) { if (!queued) { if (S.busy !== 'ultima') S.mvQ = { slot, t: S.g.t }; else if (sfx.wrong) sfx.wrong(); } return; }
    if (cd > 0) { if (!queued && cd <= 0.4) S.mvQ = { slot, t: S.g.t }; return; }
    S.mvQ = null;
    const MV = moves(), fn = fb ? MV.fireballs : MV.flare; if (typeof fn !== 'function') return;
    S.busy = fb ? 'fireballs' : 'flare'; S.busyT = 0;
    if (fb) S.cdF = TUNE.cdFire; else S.cdL = TUNE.cdFlare;   // exact, once per activation, from the press
    S.stats[fb ? 'fireballs' : 'flare']++;
    try { fn.call(MV.NM || MV, S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Nidhogg: a move failed', e); actionDone(S); }
  }
  function tryUlt(S) {
    const X = S.X, sfx = X.sfx || {};
    if (S.phase !== 'fly') return;
    if ((S.busy || S.dive) && !S.used && S.charge >= 1) { S.ultQ = S.g.t; return; }
    if (S.used || S.charge < 1 || S.dragon.locked) { if (sfx.wrong) sfx.wrong(); X.text(S.dragon.x, S.dragon.y - 2.6, S.used ? 'Ultima used' : `Ultima ${Math.floor(S.charge * 100)}%`, EMBER, 12, { life: 0.9, max: 0.9, vy: -0.6 }); return; }
    S.used = true; S.phase = 'ultima'; S.t = 0; S.busy = 'ultima'; S.busyT = 0; S.ultQ = null; S.mvQ = null; S.diveQ = null;
    const d = S.dragon; d.locked = true; d.vx *= 0.3; d.vy *= 0.3; S.ctx.ultima = true; S.stats.ultima++;
    const MV = moves();
    try { MV.ultima.call(MV.NM || MV, S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Nidhogg: Ultima failed', e); startOut(S, 'ultima'); }
  }
  function actionDone(S) {
    if (!S.busy || S.busy === 'dive') return;
    const kind = S.busy; S.busy = null;
    if (kind === 'ultima') { S.ctx.ultima = false; S.cam = null; startOut(S, 'ultima'); return; }
    if (S.phase === 'fly') S.dragon.locked = false;
  }

  /* ---- the frame ---- */
  function step(S, dt) {
    const d = S.dragon, me = S.me, g = S.g, X = S.X, M0 = MOD(), P = d.pose, TD = S.TD;
    if (S.released) { S.relT = (S.relT || 0) + dt; stepParts(S, dt); return; }
    if (me.dead) { finish(S, 'defeat'); return; }
    if (g.over || (g.won && S.phase !== 'ultima' && S.phase !== 'out')) { finish(S, 'won'); return; }
    if (X.pet && S.pet && X.pet() !== S.pet) { finish(S, 'swap'); return; }
    g.cdU = S.CD;   // (held while flying: the cooldown starts at the exit)
    S.t += dt; S.cdF = Math.max(0, S.cdF - dt); S.cdL = Math.max(0, S.cdL - dt); if (S.busy) S.busyT += dt;
    { const DB = MDB(), aW = d.locked ? d.heading : TD.spin ? TD.spin.to : TD.a; wantHeading(aW); if (TD.spin) wantHeading(TD.want);
      const need = DB && DB.readyB && !DB.readyB(DB.bucketOf(aW)); M0.warm(S.phase === 'summon' ? (drawHeading(S, TD.a) == null ? 7 : 4.5) : need ? 4.5 : 0.8);   /* (the model's slices are <= ~3 ms and never overrun the budget) */ warmMoves(S.phase === 'summon' ? 1.5 : 0.5); }
    let mag = 0;
    if (S.phase === 'summon') {
      if (S.t > 1.9 && drawHeading(S, TD.a) == null && (S.hold || 0) < 4) { S.hold = (S.hold || 0) + dt; S.t -= dt; }   /* (the seal and the haze play on; on a cold cache the dragon is not drawn until a heading is ready, and the pet's mount at 1.9 s waits for it) */
      const h = M0.CLIPS.summon.run(P, S.t, dt) || {};
      if (h.dz) d.z = Math.min(TUNE.cruise, d.z + h.dz * dt);
      if (h.seal && Math.random() < dt * (lowFx() ? 14 : 40)) { const a = Math.random() * TAU, r = Math.random() * 2.4; addPart(S, 1, d.x + Math.cos(a) * r, d.y + Math.sin(a) * r * 0.8, 0.05, 0, 0, 1 + Math.random() * 2, 1 + Math.random(), 0.12, { col: Math.random() < 0.5 ? FIRE : EMBER }); }
      if (h.mount && !S.mounted) { S.mounted = true; const sfx = X.sfx || {}; if (sfx.jump) sfx.jump(); }
      if (S.t > 2.1 && !S.beat) { S.beat = true; const sfx = X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) sfx.note(62, 0.6, 'sawtooth', 0.08, 45); if (!calm()) X.shake(3, 0.15); }
      if (S.t >= TUNE.summon) { S.phase = 'fly'; S.t = 0; d.locked = false; S.left = S.dur; d.z = Math.max(d.z, 1.6); }
    } else if (S.phase === 'fly') {
      S.left -= dt; S.stats.flyT += dt;
      if (S.left <= 0 && !S.dive && (!S.busy || S.busyT > 3)) { startOut(S, 'timeout'); return; }
      if (S.busy && S.busy !== 'dive' && S.busyT > 9) actionDone(S);
      if (S.dive) stepDive(S, dt);
      else { mag = fly(S, dt, !d.locked);
        if (!S.busy) { const C = mag > 0.15 ? M0.CLIPS.fly : M0.CLIPS.hover; S.ct += dt; C.run(P, S.ct, dt, { turn: 1e-4 }); relaxFx(P, dt); const vz = (d.z - (S.zPrev == null ? d.z : S.zPrev)) / Math.max(dt, 1e-3); P.pitch += Math.max(-0.3, Math.min(0.3, -0.09 * vz)); /* (nose up as it climbs, down as it sinks) */ } }
      if (S.mvQ) { const Q = S.mvQ, cdq = Q.slot !== 'strong2' ? S.cdF : S.cdL; if (g.t - Q.t > TUNE.mvHold + 0.4) S.mvQ = null; else if (!S.busy && !d.locked && cdq <= 0) { S.mvQ = null; tryMove(S, Q.slot, true); } }
      if (S.diveQ != null && !S.busy && !S.dive) { const q = S.diveQ; S.diveQ = null; if (g.t - q < 0.8) tryDive(S, S.mx, S.my, true); }
      if (S.ultQ != null && !S.busy && !S.dive) { const q = S.ultQ; S.ultQ = null; if (g.t - q < 3) tryUlt(S); }   /* (kept through a dive and its recovery, ~1.8 s, or a Strong) */
      // the safe return point: revalidated four times a second; the reach flood rebuilt every 2 s
      S.safeT -= dt; if (S.safeT <= 0) { S.safeT = 0.25; if (safeOK(S, d.x, d.y)) S.safe = { x: d.x, y: d.y }; }
      S.reachT -= dt; if (S.reachT <= 0) { S.reachT = 2; if (S.safe && canStand(S, S.safe.x, S.safe.y)) buildReach(S, S.safe.x, S.safe.y); }
      if (!inMap(S, d.x, d.y)) { S.stats.offT += dt; } if (S.air) { const off = Math.max(0, -d.x, d.x - S.air.w, -d.y, d.y - S.air.h); S.stats.maxOff = Math.max(S.stats.maxOff, off); }
    } else if (S.phase === 'ultima') {
      if (S.t > (g.won ? TUNE.ultWonCap : TUNE.ultCap)) { S.busy = null; S.ctx.ultima = false; S.cam = null; startOut(S, 'ultima'); return; }
    } else if (S.phase === 'out') stepOut(S, dt);
    // the heading: snap-spins (the model's turnDriver) toward the stick while flying freely
    if (S.phase === 'fly' && !S.dive && !d.locked) { const ev = TD.step(dt, mag > 0.15 ? S.mx : 0, mag > 0.15 ? S.my : 0, P); if (ev.spinStart) { S.stats.spins++; const sfx = X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); } }
    else if (S.phase === 'out' && S.outT < (S.outGlide || 0) && S.ret && Math.hypot(S.ret.x - d.x, S.ret.y - d.y) > 0.6) TD.step(dt, S.ret.x - d.x, S.ret.y - d.y, P);   /* (the glide home faces the return point) */
    else if (S.dive || S.phase === 'out') TD.step(dt, 0, 0, P);
    // (while locked, Ultima owns dragon.heading: the driver follows it, never the other way, and no snap-spin runs)
    if (d.locked && (S.phase === 'ultima' || S.busy)) { TD.a = d.heading; TD.want = d.heading; TD.spin = null; TD.blur = 0; } else d.heading = TD.a;
    S.zPrev = d.z;
    const MV = moves(); if (MV.update) { try { MV.update(S.ctx, dt); } catch (e) { /* (theirs) */ } }
    if (S.phase !== 'out' || S.outT < (S.outGlide || 0)) syncMe(S);
    stepParts(S, dt);
    S.fx.entY = d.y + 1 + d.z;
    // wingbeats and a low growl now and then
    S.sfxT -= dt; if (S.sfxT <= 0 && S.phase === 'fly') { const sfx = X.sfx || {}; S.sfxT = 0.75 + Math.random() * 0.3; if (sfx.note) { sfx.note(70 + Math.random() * 10, 0.35, 'triangle', 0.035, 50); if (Math.random() < 0.15) sfx.note(48, 0.9, 'sawtooth', 0.03, 40); } if (Math.random() < 0.25 && sfx.hiss) sfx.hiss(0.08, 0.025, 2500); }
  }
  /* when no clip owns them: the effect channels relax (the flight clips set the motion channels themselves) */
  function relaxFx(P, dt) { const k = Math.min(1, dt * 3); for (const c of ['jaw', 'throat', 'vents', 'glow', 'trace', 'ring', 'core', 'heat']) P[c] += (0 - P[c]) * k; P.alpha += (1 - P.alpha) * k; }

  /* ---- exits: glide to the safe return point, dismiss in fire, set the pet down, restore, cooldown ---- */
  function startOut(S, how) {
    if (S.phase === 'out' || S.released) return;
    const d = S.dragon; S.dive = null; if (S.busy === 'dive') S.busy = null;
    S.outHow = how || 'timeout'; S.phase = 'out'; S.t = 0; S.outT = 0; d.locked = true; S.cam = null;
    const p = S.retPt && safeOK(S, S.retPt.x, S.retPt.y) ? S.retPt : safeReturn(S); S.ret = p;
    S.outFrom = { x: d.x, y: d.y, z: d.z }; S.outGlide = Math.max(TUNE.outGlide[0], Math.min(TUNE.outGlide[1], Math.hypot(p.x - d.x, p.y - d.y) / TUNE.outSpd));
    const sfx = S.X.sfx || {}; if (sfx.note) [330, 247, 196].forEach((f, i) => sfx.note(f, 0.35, 'sawtooth', 0.035, f * 0.95, i * 0.1));
  }
  function stepOut(S, dt) {
    const d = S.dragon, P = d.pose, M0 = MOD(); S.outT += dt;
    if (S.outT < S.outGlide) { const u = sstep(0, 1, S.outT / S.outGlide); d.x = lerp(S.outFrom.x, S.ret.x, u); d.y = lerp(S.outFrom.y, S.ret.y, u); d.z = lerp(S.outFrom.z, 1.4, u); M0.CLIPS.fly.run(P, S.outT, dt, { turn: 1e-4 }); relaxFx(P, dt);
      if (Math.hypot(S.ret.x - S.outFrom.x, S.ret.y - S.outFrom.y) > 0.5) S.TD.want = Math.atan2(S.ret.y - S.outFrom.y, S.ret.x - S.outFrom.x); return; }
    const t = S.outT - S.outGlide, h = M0.CLIPS.dismiss.run(P, t, dt) || {};
    if (!S.hopped) { S.hopped = true; const me = S.me; me.x = S.ret.x; me.y = S.ret.y; S.petHop = 0; const sfx = S.X.sfx || {}; if (sfx.jump) sfx.jump(); if (sfx.hiss) sfx.hiss(0.6, 0.08, 1200); }
    S.petHop += dt;
    if (h.embers && Math.random() < dt * (lowFx() ? 20 : 60)) { const a = Math.random() * TAU, r = Math.random() * 2.5; addPart(S, 1, d.x + Math.cos(a) * r, d.y + Math.sin(a) * r * 0.7, d.z + Math.random() * 1.2, Math.cos(a) * 0.6, Math.sin(a) * 0.5, 1 + Math.random() * 2, 0.8 + Math.random() * 0.5, 0.13, { col: Math.random() < 0.5 ? FIRE : EMBER }); }
    S.me.vx = S.me.vy = 0;
    if (t >= TUNE.dismiss) release(S);
  }
  function finish(S, how) {
    if (S.released) return; S.outHow = how;
    const p = S.phase === 'out' && S.ret ? S.ret : safeReturn(S), me = S.me; me.x = p.x; me.y = p.y;   // (never over the void, off the map or in a wall, even on defeat)
    if (S.dragon.vis > 0.05 && (S.dragon.pose.alpha || 0) > 0.05) { const d = S.dragon; for (let i = 0; i < (lowFx() ? 10 : 26); i++) { const a = Math.random() * TAU, v = 1 + Math.random() * 3; addPart(S, 1, d.x + Math.cos(a), d.y + Math.sin(a) * 0.7, d.z + Math.random(), Math.cos(a) * v, Math.sin(a) * v * GY, Math.random() * 2, 0.7 + Math.random() * 0.4, 0.14, { col: Math.random() < 0.5 ? FIRE : EMBER }); } S.fade = 0.35; }
    release(S);
  }
  function release(S) {
    if (S.released) return;
    S.released = true; S.ended = true; S.relT = 0;
    const me = S.me, g = S.g, X = S.X;
    if (S.ret && S.phase === 'out') { me.x = S.ret.x; me.y = S.ret.y; }
    if (!safeOK(S, me.x, me.y) && !canStand(S, me.x, me.y)) { const p = safeReturn(S); me.x = p.x; me.y = p.y; }
    S.phase = 'gone'; S.busy = null; S.dive = null; S.mvQ = null; S.ultQ = null; S.diveQ = null; S.cam = null;
    const c0 = S.ctx; if (c0) c0.ultima = false; S.dragon.locked = true;
    try { X.vehicle(null); } catch (e) { /* (hook) */ }
    if (me.petAlt === S.fx) me.petAlt = null;
    me.vx = me.vy = 0; me.z = 0; me.push = null; me.castT = 0; me.airborne = false;
    g.cdU = S.CD;   // the cooldown starts now, once
    g.tapBuf = 0; g.tapAim = null; g.normalT = Math.max(g.normalT || 0, 0.2);
    S.gate.clear(); S.fx.life = 2.2; S.fx.onEnd = null;
  }

  /* ---- pooled particles: 1 ember (additive), 2 smoke puff, 9 fire shockwave ring on the floor (s = radius) ---- */
  const CAP = 320;
  function addPart(S, kind, x, y, z, vx, vy, vz, life, s, o) {
    if (S.parts.length >= CAP * (lowFx() ? 0.45 : 1)) return null;
    const p = S.free.pop() || {}; p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.s = s; p.g = (o && o.g) || 0; p.drag = (o && o.drag) || 0; p.grow = (o && o.grow) || 0; p.col = (o && o.col) || null;
    S.parts.push(p); return p;
  }
  function stepParts(S, dt) {
    for (let i = S.parts.length - 1; i >= 0; i--) { const p = S.parts[i]; p.life -= dt; if (p.life <= 0) { S.parts[i] = S.parts[S.parts.length - 1]; S.parts.pop(); S.free.push(p); continue; }
      const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz = p.vz * k - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); }
    for (let i = S.cracks.length - 1; i >= 0; i--) { const c = S.cracks[i]; c.t += dt; if (c.t > c.life) S.cracks.splice(i, 1); }
    for (let i = S.marks.length - 1; i >= 0; i--) { const m = S.marks[i]; m.t += dt; if (m.t > m.life) S.marks.splice(i, 1); }
  }

  /* ================= drawing ================= */
  function drawUnder(S, c) {
    const H = S.H, T = H.X.Tz(), d = S.dragon, M0 = MOD(), t = S.g.t;
    // the summoning seal (and the dismiss's): fire rings and a hex star turning under the dragon
    const sealA = S.phase === 'summon' ? Math.min(1, S.t / 0.5) * (1 - sstep(2.2, 2.9, S.t)) : 0;
    if (sealA > 0.01) { const X0 = H.sx(S.home.x), Y0 = H.sy(S.home.y), r = T * 2.6; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = sealA * 0.85; c.translate(X0, Y0); c.scale(1, GY); c.rotate(S.t * 0.8);
      for (const [rr, w] of [[1, 3], [0.84, 1.5], [0.62, 2.2]]) { c.beginPath(); c.arc(0, 0, r * rr, 0, TAU); c.strokeStyle = '#FF6A2A'; c.lineWidth = w * T * 0.03; c.stroke(); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); c.lineTo(Math.cos(a + 2.094) * r * 0.62, Math.sin(a + 2.094) * r * 0.62); c.strokeStyle = '#FFB060'; c.lineWidth = T * 0.03; c.stroke(); }
      c.globalAlpha = sealA * 0.45; blitSized(c, glowSprite(FIRE), -r, -r, r * 2, r * 2); c.restore(); }
    // the cracks and shockwaves (light only: they glow and cool away)
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const k of S.cracks) { const a = 1 - k.t / k.life; if (a <= 0) continue; c.beginPath(); k.pts.forEach((p, i) => i ? c.lineTo(H.sx(p[0]), H.sy(p[1])) : c.moveTo(H.sx(p[0]), H.sy(p[1]))); c.globalAlpha = 0.35 * a; c.strokeStyle = RED; c.lineWidth = T * 0.16; c.stroke(); c.globalAlpha = 0.8 * a * a; c.strokeStyle = EMBER; c.lineWidth = T * 0.05; c.stroke(); }
    for (const p of S.parts) { if (p.kind !== 9) continue; const u = 1 - p.life / p.max, e = 1 - (1 - u) * (1 - u) * (1 - u), r = T * p.s * (0.2 + 0.8 * e), X0 = H.sx(p.x), Y0 = H.sy(p.y); c.globalAlpha = Math.pow(1 - u, 1.3) * 0.9;
      c.beginPath(); c.ellipse(X0, Y0, r, r * GY, 0, 0, TAU); c.strokeStyle = FIRE; c.lineWidth = T * 0.35 * (1 - u); c.stroke(); c.strokeStyle = CORE; c.lineWidth = T * 0.08 * (1 - u); c.stroke(); c.globalAlpha *= 0.35; blitSized(c, glowSprite(FIRE), X0 - r, Y0 - r * GY, r * 2, r * 2 * GY); }
    // the dive's target ring closing in; an invalid marker (an X in a broken ring) where nothing can be struck
    if (S.dive && !S.dive.slam) { const D = S.dive, u = cl(D.t / 1.0), r = T * TUNE.diveR * (1.05 - 0.35 * u), X0 = H.sx(D.tx), Y0 = H.sy(D.ty); c.globalAlpha = 0.65 * sstep(0, 0.2, u); c.beginPath(); c.ellipse(X0, Y0, r, r * GY, 0, 0, TAU); c.strokeStyle = FIRE; c.lineWidth = T * 0.07; c.stroke(); c.globalAlpha *= 0.4; blitSized(c, glowSprite(RED), X0 - r, Y0 - r * GY, r * 2, r * 2 * GY); }
    c.restore();
    // the dragon's shadow (only over something to fall on: inside the map)
    if (S.phase !== 'gone' && M0 && inMap(S, d.x, d.y)) { const da = drawHeading(S, d.heading); if (da != null) try { M0.drawShadow(c, d.x, d.y, d.z, da, d.pose, { T, sx: H.sx, sy: H.sy, t, scale: TUNE.size }); } catch (e) { /* (model) */ } }
    callM(S, c, 'drawUnder');
  }
  function callM(S, c, k) { const MV = moves(); if (MV[k] && S.ctx) { c.save(); try { MV[k](S.ctx, c); } catch (e) { /* (theirs) */ } c.restore(); } }
  function petPos(S, T) {   // the rider on its seat (from the model's callback), or hopping on / off
    const H = S.H; if (S.phase === 'summon') { const s3 = S.seatS; const u = sstep(1.9, 2.25, S.t); if (!s3) return null; return [lerp(H.sx(S.home.x) + T * 1.6, s3[0], u), lerp(H.sy(S.home.y) + T * 0.8, s3[1], u) - Math.sin(u * Math.PI) * T, u]; }
    return null;
  }
  function drawEnt(S, c) {
    const H = S.H, T = H.X.Tz(), d = S.dragon, M0 = MOD(), t = S.g.t;
    if (S.phase === 'gone') { const da = drawHeading(S, d.heading); if (S.fade && S.relT < S.fade && M0 && da != null) { const a0 = d.pose.alpha; d.pose.alpha = a0 * (1 - S.relT / S.fade); M0.drawSpin(c, d.x, d.y, d.z, d.pose, { T, sx: H.sx, sy: H.sy, t, low: lowFx(), scale: TUNE.size }, spinProxy(S, da)); d.pose.alpha = a0; } return; }
    if (!M0 || d.vis <= 0.01) { if (S.phase !== 'out' || !S.hopped) H.X.drawPetAt(c, H.sx(d.x), H.sy(d.y) - d.z * ZK * T, { maxH: 0.85 }); return; }
    const riding = !(S.phase === 'summon' && S.t < 2.2) && !(S.phase === 'out' && S.hopped);
    const o = { T, sx: H.sx, sy: H.sy, t, low: lowFx(), scale: TUNE.size, pet: (cc, PX, PY) => { const roll = petRoll(S); PY += T * TUNE.size * (0.3 * Math.max(0, d.pose.pitch || 0) + (S.dive ? 0.14 : 0)) + T * 0.22 * Math.abs(Math.sin(roll)); S.seatS = [PX, PY]; if (riding) H.X.drawPetAt(cc, PX, PY, { maxH: 0.85, rot: roll }); } };   /* (rolled on its side the sprite's lowest point rises: it is kept down on the seat) */   /* (nose-down, the back slopes away from the seat point: the rider is seated a little lower, on the plates) */   /* (round 2: drawn at 0.65; the rider a little smaller to sit in the smaller seat, rolling flat with each dive spin) */
    const a0 = d.pose.alpha; d.pose.alpha = a0 * d.vis;
    const da = drawHeading(S, d.heading); S.drawnA = da;
    if (da != null) { const sub = Math.abs(wrap(da - d.heading)) > 0.05, P0 = d.pose, kb = sub ? [P0.bank, P0.headYaw, P0.tailSwing] : null;
      if (sub) { P0.bank = 0; P0.headYaw = 0; P0.tailSwing = 0; } const ring0 = P0.ring; if (S.noBlur) P0.ring = 0;   /* (S.noBlur, tests only: the body without the spin's streaks and the Ultima ring's floating segments) */   /* (at a stand-in heading the spin's bank / head yaw / tail swing would turn pieces toward headings not baked yet: drawn straight, every piece and the seat share one heading) */
      try { M0.drawSpin(c, d.x, d.y, d.z, d.pose, o, spinProxy(S, da)); } catch (e) { /* (model) */ }
      if (sub) { P0.bank = kb[0]; P0.headYaw = kb[1]; P0.tailSwing = kb[2]; } P0.ring = ring0; }
    else if (riding) H.X.drawPetAt(c, H.sx(d.x), H.sy(d.y) - d.z * ZK * T, { maxH: 0.85 });   /* (nothing baked at all yet: the rider alone, never a broken dragon) */
    d.pose.alpha = a0;
    // the pet before it mounts (standing by the seal, then hopping up) and after it hops down at the exit
    if (S.phase === 'summon' && S.t < 2.2) { if (S.t < 1.9) H.X.drawPetAt(c, H.sx(S.home.x) + T * 1.6, H.sy(S.home.y) + T * 0.8, {}); else { const p = petPos(S, T); if (p) H.X.drawPetAt(c, p[0], p[1], { maxH: 0.85 }); } }
    if (S.phase === 'out' && S.hopped) { const u = sstep(0, 0.45, S.petHop), s3 = S.seatS || [H.sx(d.x), H.sy(d.y) - d.z * ZK * T], gx = H.sx(S.ret.x), gy = H.sy(S.ret.y); H.X.drawPetAt(c, lerp(s3[0], gx, u), lerp(s3[1], gy, u) - Math.sin(u * Math.PI) * T * 0.9, u < 1 ? { maxH: 0.85 } : {}); }
  }
  function drawOver(S, c) {
    const H = S.H, T = H.X.Tz();
    callM(S, c, 'drawOver');
    // the invalid-target marker (an X in a broken ring) goes over everything: off the map the floor layer is under the void
    if (S.marks.length) { c.save(); c.globalCompositeOperation = 'lighter';
      for (const m of S.marks) { const a = 1 - Math.pow(Math.min(1, m.t / m.life), 2), X0 = H.sx(m.x), Y0 = H.sy(m.y), r = T * 0.7; c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.85 * a; c.strokeStyle = '#FF3A3A'; c.lineWidth = T * 0.09; c.setLineDash([T * 0.18, T * 0.14]); c.beginPath(); c.ellipse(X0, Y0, r, r * GY, 0, 0, TAU); c.stroke(); c.setLineDash([]);
        c.beginPath(); c.moveTo(X0 - r * 0.5, Y0 - r * 0.35); c.lineTo(X0 + r * 0.5, Y0 + r * 0.35); c.moveTo(X0 + r * 0.5, Y0 - r * 0.35); c.lineTo(X0 - r * 0.5, Y0 + r * 0.35); c.stroke(); c.globalCompositeOperation = 'lighter'; }
      c.restore(); }
    if (!S.parts.length) return;
    const sp = S.seatS || [-1e9, -1e9], PX = sp[0], PY = sp[1] - T * 0.45;
    c.save();
    for (const p of S.parts) { if (p.kind === 9) continue; const X0 = H.sx(p.x), Y0 = H.sy(p.y) - p.z * ZK * T, u = 1 - p.life / p.max, keep = 0.08 + 0.92 * sstep(T * 0.4, T * 1.2, Math.hypot(X0 - PX, Y0 - PY));
      if (p.kind === 2) { const r = T * p.s * (1 + p.grow * u); c.globalCompositeOperation = 'source-over'; c.globalAlpha = Math.min(1, u * 6) * (1 - u) * 0.3 * keep; blitSized(c, glowSprite('#3A2A26'), X0 - r, Y0 - r, r * 2, r * 2); continue; }
      const a = cl(p.life / Math.min(0.3, p.max)) * keep; if (a < 0.02) continue; const r = T * p.s; c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(p.col || FIRE), X0 - r, Y0 - r, r * 2, r * 2); }
    c.restore();
  }

  /* ================= the HUD while flying: Fireballs, Flare, Dive Bomb, altitude and the Ultima meter ================= */
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  function drawBtns(S, c, o) {
    const { B, blitC, hudPic, glowPic } = o, t = S.g.t, idle = S.phase !== 'fly' || S.dragon.locked;
    const btn = (b, key, label, cd, cdMax, paint, col, busy, dx) => { const rd = cd <= 0.01 && !idle && !S.busy;
      if (rd) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.28 + 0.08 * Math.sin(t * 5); blitC(c, glowPic(glowSprite, FIRE, Math.round(b.r * 1.7)), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`nid|${key}|${rd}|${b.r}`, b.r * 2 + 10, b.r * 2 + 10, (x, w, h) => paint(x, w / 2, h / 2, b.r, rd)), b.x, b.y);
      if (busy) { c.save(); c.lineWidth = 3; c.strokeStyle = rgba(EMBER, 0.85); c.beginPath(); c.arc(b.x, b.y, b.r + 2, t * 6, t * 6 + 1.6); c.stroke(); c.restore(); }
      if (cd > 0.05) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, cd / cdMax)); c.closePath(); c.fillStyle = 'rgba(10,2,2,.55)'; c.fill(); GFX.textS(c, cd.toFixed(1), b.x, b.y, 13, '#FFFFFF'); }
      if (label) GFX.labelS(c, label, b.x + (dx || 0), b.y + b.r + 9, 8, 800, col, 'rgba(0,0,0,.7)', 3); };
    btn(B.s[0], 'fb', 'FIREBALLS', S.cdF, TUNE.cdFire, paintFireballBtn, '#FFD2A0', S.busy === 'fireballs');
    btn(B.s[1], 'fl', 'FLARE', S.cdL, TUNE.cdFlare, paintFlareBtn, '#FFC08A', S.busy === 'flare');
    // Dive Bomb: no cooldown; a busy arc while a dive runs (a press near its end is kept)
    { const b = B.d, rd = !idle && !S.dive && !S.busy;
      if (rd) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.34 + 0.1 * Math.sin(t * 5 + 1); blitC(c, glowPic(glowSprite, RED, Math.round(b.r * 1.7)), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`nid|dive|${rd}|${b.r}`, b.r * 2 + 10, b.r * 2 + 10, (x, w, h) => paintDiveBtn(x, w / 2, h / 2, b.r, rd)), b.x, b.y);
      if (S.dive) { c.save(); c.lineWidth = 3; c.strokeStyle = rgba(EMBER, 0.9); c.beginPath(); c.arc(b.x, b.y, b.r + 2, -Math.PI / 2, -Math.PI / 2 + TAU * cl(S.dive.t / S.dive.end)); c.stroke(); c.restore(); }
      GFX.labelS(c, 'DIVE BOMB', b.x, b.y + b.r + 9, 8, 800, '#FFB0A0', 'rgba(0,0,0,.7)', 3); }
    // the Ultima meter: molten orange-red rising in the button; ULTIMA pulsing when full
    { const b = B.u, full = S.charge >= 1 && !S.used, k = S.used ? 1 : S.charge, ult = S.phase === 'ultima';
      if (full || ult) { const pl = 0.5 + 0.5 * Math.sin(t * 6); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.35 * pl; blitC(c, glowPic(glowSprite, FIRE, Math.round(b.r * (2.1 + 0.25 * pl) * 4) / 4), b.x, b.y); c.globalAlpha = 0.45; blitC(c, glowPic(shockSprite, EMBER, Math.round(b.r * 1.8)), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`nid|ult|${full || ult}|${b.r}`, b.r * 2 + 12, b.r * 2 + 12, (x, w, h) => paintUltBtn(x, w / 2, h / 2, b.r, full || ult)), b.x, b.y);
      // the molten fill: a liquid level rising in the face, its surface rippling
      if (k > 0.01) { c.save(); c.beginPath(); c.arc(b.x, b.y, b.r - 4, 0, TAU); c.clip(); const lvl = b.y + (b.r - 4) - 2 * (b.r - 4) * k; c.beginPath(); c.moveTo(b.x - b.r, b.y + b.r); for (let i = 0; i <= 12; i++) { const x = b.x - b.r + i / 12 * 2 * b.r; c.lineTo(x, lvl + Math.sin(t * 4 + i * 0.9) * 1.6); } c.lineTo(b.x + b.r, b.y + b.r); c.closePath();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 + 0.15 * Math.sin(t * 3); c.fillStyle = full ? '#FF8A2A' : '#D2381A'; c.fill(); c.globalAlpha = 0.6; c.strokeStyle = CORE; c.lineWidth = 1.2; c.stroke(); c.restore(); }
      c.save(); c.lineCap = 'round'; c.lineWidth = 4.5; c.strokeStyle = 'rgba(20,4,2,.85)'; c.beginPath(); c.arc(b.x, b.y, b.r - 2, 0, TAU); c.stroke(); if (k > 0.004) { c.strokeStyle = full ? GOLD : FIRE; c.lineWidth = 3.5; c.beginPath(); c.arc(b.x, b.y, b.r - 2, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke(); } c.restore();
      if (S.phase === 'fly' || S.phase === 'summon') { const u = S.phase === 'summon' ? 1 : cl(S.left / S.dur), low = S.phase === 'fly' && S.left < 5; c.save(); c.lineCap = 'round'; c.lineWidth = 2.5; c.strokeStyle = low ? 'rgba(255,120,110,.95)' : 'rgba(255,200,140,.9)'; c.beginPath(); c.arc(b.x, b.y, b.r + 4.5, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); c.restore();
        GFX.labelS(c, Math.ceil(S.phase === 'summon' ? S.dur : S.left) + 's', b.x, b.y + b.r * 0.7, 10, 900, low ? '#FF9AA8' : '#FFE6C8', 'rgba(0,0,0,.75)', 3); }
      const lab = ult ? 'ULTIMA!' : full ? 'ULTIMA' : S.used ? 'USED' : `ULTIMA ${Math.floor(S.charge * 100)}%`;
      if (full) { const s = 1 + 0.08 * Math.sin(t * 7); c.save(); c.translate(b.x, b.y + b.r + 10); c.scale(s, s); GFX.labelS(c, lab, 0, 0, 12, 900, GOLD, 'rgba(60,8,2,.9)', 3.5); c.restore(); }
      else GFX.labelS(c, lab, b.x, b.y + b.r + 9, 9, 800, ult ? GOLD : '#FFC8A8', 'rgba(0,0,0,.7)', 3); }
  }
  /* crimson faces with a black rim and an orange inner ring when ready */
  function btnFace(x, cx, cy, r, rd) { const g = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); if (rd) { g.addColorStop(0, '#E2483A'); g.addColorStop(0.55, '#8E1218'); g.addColorStop(1, '#2A0406'); } else { g.addColorStop(0, '#4A2624'); g.addColorStop(0.6, '#2A1414'); g.addColorStop(1, '#120808'); } x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
  function btnRim(x, cx, cy, r, rd) { x.lineWidth = 3; x.strokeStyle = rd ? '#120404' : 'rgba(18,4,4,.6)'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke(); x.lineWidth = 1.6; x.strokeStyle = rd ? '#FF8A2A' : 'rgba(255,138,42,.3)'; x.beginPath(); x.arc(cx, cy, r - 2.5, 0, TAU); x.stroke(); if (rd) { x.fillStyle = 'rgba(255,255,255,.2)'; x.beginPath(); x.ellipse(cx - r * 0.3, cy - r * 0.5, r * 0.3, r * 0.12, -0.5, 0, TAU); x.fill(); } }
  const flameGrad = (x, x0, y0, x1, y1, rd) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rd ? '#FFF6D8' : '#8A7A6A'); g.addColorStop(0.35, rd ? '#FFC24A' : '#7A5A3A'); g.addColorStop(0.75, rd ? '#FF5A1A' : '#5A2A1A'); g.addColorStop(1, rd ? 'rgba(200,20,10,0)' : 'rgba(60,20,10,0)'); return g; };
  /* a big fireball dropping on a downward arc, its rolling tail behind */
  function paintFireballBtn(x, cx, cy, r, rd) { btnFace(x, cx, cy, r, rd); x.save(); x.globalAlpha = rd ? 1 : 0.55; x.translate(cx, cy);
    x.fillStyle = flameGrad(x, r * 0.2, r * 0.25, -r * 0.6, -r * 0.55, rd); x.beginPath(); x.moveTo(r * 0.05, r * 0.42); x.quadraticCurveTo(-r * 0.6, -r * 0.05, -r * 0.62, -r * 0.62); x.quadraticCurveTo(-r * 0.2, -r * 0.2, r * 0.35, r * 0.02); x.closePath(); x.fill();
    const g = x.createRadialGradient(r * 0.12, r * 0.18, r * 0.04, r * 0.2, r * 0.25, r * 0.32); g.addColorStop(0, rd ? '#FFFFFF' : '#AAA'); g.addColorStop(0.35, rd ? '#FFE27A' : '#8A7A5A'); g.addColorStop(0.8, rd ? '#FF6A1A' : '#5A3A2A'); g.addColorStop(1, rd ? '#B8160E' : '#3A1A12'); x.fillStyle = g; x.beginPath(); x.arc(r * 0.2, r * 0.25, r * 0.3, 0, TAU); x.fill();
    x.restore(); btnRim(x, cx, cy, r, rd); }
  /* a fan of fire lances bursting outward from a vent */
  function paintFlareBtn(x, cx, cy, r, rd) { btnFace(x, cx, cy, r, rd); x.save(); x.globalAlpha = rd ? 1 : 0.55; x.translate(cx, cy + r * 0.32); x.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.33, L = r * (0.62 + (i % 2) * 0.12), ex = Math.cos(a) * L, ey = Math.sin(a) * L; x.strokeStyle = flameGrad(x, ex, ey, 0, 0, rd); x.lineWidth = r * 0.12; x.beginPath(); x.moveTo(ex * 0.25, ey * 0.25); x.lineTo(ex, ey); x.stroke(); x.fillStyle = rd ? '#FFF2C8' : '#9A8A7A'; x.beginPath(); x.arc(ex, ey, r * 0.055, 0, TAU); x.fill(); }
    x.fillStyle = rd ? '#1A0606' : '#0A0404'; x.beginPath(); x.ellipse(0, 0, r * 0.34, r * 0.12, 0, 0, TAU); x.fill(); x.fillStyle = rd ? '#FF7A1A' : '#5A2A12'; x.beginPath(); x.ellipse(0, -r * 0.01, r * 0.24, r * 0.06, 0, 0, TAU); x.fill();
    x.restore(); btnRim(x, cx, cy, r, rd); }
  /* a dragon silhouette plunging down a fiery streak into a ground burst */
  function paintDiveBtn(x, cx, cy, r, rd) { btnFace(x, cx, cy, r, rd); x.save(); x.globalAlpha = rd ? 1 : 0.55; x.translate(cx, cy);
    x.strokeStyle = flameGrad(x, r * 0.05, r * 0.3, -r * 0.45, -r * 0.6, rd); x.lineWidth = r * 0.22; x.lineCap = 'round'; x.beginPath(); x.moveTo(-r * 0.5, -r * 0.62); x.quadraticCurveTo(-r * 0.25, -r * 0.1, r * 0.02, r * 0.18); x.stroke();
    x.save(); x.translate(r * 0.08, r * 0.12); x.rotate(0.85); x.fillStyle = rd ? '#120404' : '#0A0404'; x.beginPath(); x.moveTo(r * 0.36, 0); x.lineTo(r * 0.1, -r * 0.06); x.lineTo(-r * 0.05, -r * 0.34); x.lineTo(-r * 0.12, -r * 0.06); x.lineTo(-r * 0.36, -r * 0.02); x.lineTo(-r * 0.12, r * 0.06); x.lineTo(-r * 0.05, r * 0.34); x.lineTo(r * 0.1, r * 0.06); x.closePath(); x.fill(); x.strokeStyle = rd ? '#FF8A2A' : 'rgba(255,138,42,.4)'; x.lineWidth = 1; x.stroke(); x.restore();
    x.strokeStyle = rd ? '#FFD27A' : 'rgba(255,210,122,.4)'; x.lineWidth = 1.8; for (const a of [-2.6, -2.0, -1.1, -0.5]) { x.beginPath(); x.moveTo(r * 0.3 + Math.cos(a) * r * 0.18, r * 0.5 + Math.sin(a) * r * 0.1); x.lineTo(r * 0.3 + Math.cos(a) * r * 0.36, r * 0.5 + Math.sin(a) * r * 0.2); x.stroke(); }
    x.fillStyle = rd ? '#FF6A1A' : '#5A2A12'; x.beginPath(); x.ellipse(r * 0.3, r * 0.52, r * 0.3, r * 0.08, 0, 0, TAU); x.fill();
    x.restore(); btnRim(x, cx, cy, r, rd); }
  /* the Ultima emblem: a rune ring round a white-hot core */
  function paintUltBtn(x, cx, cy, r, full) { let g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r); g.addColorStop(0, full ? '#6A1A10' : '#3A1612'); g.addColorStop(0.6, full ? '#2E0806' : '#1C0A08'); g.addColorStop(1, '#0A0202'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
    x.strokeStyle = full ? '#FF6A2A' : 'rgba(255,106,42,.45)'; x.lineWidth = 2.2; x.beginPath(); x.arc(cx, cy - 1, r * 0.48, 0, TAU); x.stroke(); x.lineWidth = 1; x.beginPath(); x.arc(cx, cy - 1, r * 0.36, 0, TAU); x.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; x.beginPath(); x.moveTo(cx + Math.cos(a) * r * 0.38, cy - 1 + Math.sin(a) * r * 0.38); x.lineTo(cx + Math.cos(a + 0.12) * r * 0.46, cy - 1 + Math.sin(a + 0.12) * r * 0.46); x.stroke(); }
    g = x.createRadialGradient(cx, cy - 1, 1, cx, cy - 1, r * 0.26); g.addColorStop(0, full ? '#FFFFFF' : '#AA9A8A'); g.addColorStop(0.4, full ? '#FFE27A' : '#8A6A3A'); g.addColorStop(1, 'rgba(255,90,20,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy - 1, r * 0.26, 0, TAU); x.fill();
    x.lineWidth = 2; x.strokeStyle = full ? GOLD : 'rgba(255,210,102,.4)'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke(); }

  /* ================= the Ultimate ================= */
  U.nidhogg = (C, H) => {
    const me = H.me, g = H.g;
    // (a spirit, an actor that is not the played pet, or a build without the model: a burst of fire where it stands)
    if (me.spirit || !H.X.vehicle || !H.X.drawPetAt || !MOD()) { const DK = C.base * (C.K || 1); H.hitArea(me.x, me.y, 2.6, DK * 2.5, { el: 'fire', src: 'ult' }); H.X.ring(me.x, me.y, 0.3, 2.6, 0.5, FIRE, 0.3); return; }
    if (g._nidhogg && !g._nidhogg.released) return;
    if (MOD().preview) { try { MOD().preview(false); } catch (e) { /* (the dev preview, if one is up) */ } }
    startForm(C, H);
  };
  /* idle-time preparation (20b calls it for an equipped Ultimate): the model's bake, then N2's / N3's sprites */
  U.nidhogg.warm = o => { setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T, M0 = MOD(); if (!(T > 0) || !M0) return; const dpr = (typeof arc !== 'undefined' && arc.dpr) || 1; const Z = (typeof arc !== 'undefined' && arc.game && arc.game._dbg && arc.game._dbg.g && arc.game._dbg.g.zoom) || 1;
    if (bakeScaleOK(T / Math.max(0.5, Z) * dpr)) M0.warmIdle(0, 1); else M0.warmIdle(bakeT(T / Math.max(0.5, Z) * dpr), 1);   /* (the same scale the cast will use) */
    const idle = () => { if (['warmS', 'warmU'].every(w => !moves()[w] || WARMED[w])) return; warmMoves(2); if (typeof requestIdleCallback === 'function') requestIdleCallback(idle, { timeout: 300 }); else setTimeout(idle, 60); }; idle();
    // (the model's bake on the leftover time of each idle period as well, up to 8 ms: its slices are <= ~3 ms and never
    //  overrun the budget, so frames do not hitch; a dragon cast early in a floor then has its headings ready sooner)
    const pump = dl => { const ms = dl && dl.timeRemaining ? Math.min(8, dl.timeRemaining() - 1) : 3; if (ms > 1.5 && M0.warm(ms) === true) return; if (typeof requestIdleCallback === 'function') requestIdleCallback(pump, { timeout: 500 }); else setTimeout(pump, 50); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(pump, { timeout: 500 }); }, 300); };
  U.nidhogg.TUNE = TUNE;
  U.nidhogg.__dbg = { TUNE, STUB, moves, safeReturn, nearestLand, groundAt, aimPoint, target, petRoll };
})();
