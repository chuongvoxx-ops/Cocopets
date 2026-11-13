/* ---------- Fire, the 11th Ultimate: Nidhogg (the core: worker N1) ----------
   A fiery seal opens under the pet, embers rise and Nidhogg (NIDHOGG_MODEL, 20k6f: a crimson half-living, half-machine
   wyvern) emerges through the heat haze; the pet mounts behind its neck, the wings spread and a great downstroke lifts
   it. For 20 s (25 at Adept, 35 at Celestial; game time, from the moment it can fly) the controls are the dragon's
   (20b's VEH hook):
     - the stick flies and steers in real free flight: an aerial volume of its own (the map plus TUNE.margin tiles of open
       air round it), over walls, gaps, water and beyond the land's outline, never snapped back. It cruises at a steady
       height, climbs to clear walls ahead and stays out of walls it cannot clear (a hand-drawn stage's walls are too
       tall to fly over). (Round 2: one cruise height; the altitude toggle is gone.) (Round 3) Turns are smooth and
       continuous (TUNE.turn: an eased turn rate, bank, head and tail), drawn with drawSpin's motion blur scaled by the
       turn rate; the camera follows it offshore at the flight zoom (0.9; round 2: the dragon is drawn at 0.65 of the
       model's size);
     - Dodge is Dive Bomb: zero cooldown. A snappy full spin, then it folds and plunges at the stick's aim (an enemy near the aim line, else the
       ground there; with no stick the nearest enemy, else the ground below), flares to brake, slams once (TUNE.dive x DK
       in TUNE.diveR, knockback; charges the meter) with a hit-stop, a fire shockwave, embers and glowing cracks, grinds
       round once on the ground (round 3: slow, heavy, wings dragging, a dust and ember swirl) and pushes off back into
       flight; the rider rolls one flat turn with each spin (drawPetAt's rot, never a yaw).
       The next dive is accepted as soon as dive and recovery end (a press in the last TUNE.diveBuf s is kept). Aimed at
       nothing (open air, water, the void) it shows an invalid marker and keeps flying;
     - Strong 1 / 2 are Fireballs / Flare (worker N2's 20k6h, NIDHOGG_MOVES; stubs here if absent): exact 1 s / 4 s
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
  const ULT_Z0 = 0.9, ULT_CAM_K = 0.25;   /* (v327, the user: "zoom back in by 50%" again: a quarter of the authored pull-back is kept; charge and beam about 0.54, blast about 0.53 at the 0.585 flight zoom) (ULT_Z0: the flight zoom the moves' and the Ultima's camera zooms were authored against) */
  /* (v325, the user: "camera pull back too far during ultima, zoom back in by half") the share of the Ultima's own zoom-out that is kept (framing only, not a gameplay number) */
  const TUNE = {
    dur: [20, 25, 35], cd: 120,                    // s of flight at evo 1-3 / 4-6 / 7 (from the moment it can fly); the Ult's cooldown from the exit
    size: 0.65,                                    // (round 2, the user: "smaller by 35%") the dragon's drawn scale: wingspan ~7 tiles
    zoom: 0.585,                                   // the flight zoom (v325: 0.9 -> 0.78 for M's wings; v326, the user: "zoom back by 25% when on the dragon": 0.585)
    top: 10, accel: 22, brake: 14,                 // tiles/s, tiles/s2
    cruise: 2.2, wallZ: 3.0, climbV: 5, sinkV: 2.6,   // tiles: the one cruise height (round 2: no high setting), the height that clears a wall; tiles/s up / down
    margin: 18,                                    // tiles of open air round the map the dragon may fly in (a soft edge: it simply cannot go further)
    dive: 3.0, diveR: 2.6, diveKb: 6.5,            // x DK once per monster at the slam; radius (+ the monster's own x0.85); knockback
    diveReach: 9, diveCone: 0.5, diveBuf: 0.3,     // tiles; rad either side of the aim for an enemy; s a press is kept before the dive ends
    /* (round 3, the user: "should take more time ... some weight and momentum") Dive Bomb: a snappy wind-up spin at
       height, a heavy accelerating plunge, the slam (hit-stop) and an impact hold, a slow grinding spin on the ground
       (fast, then decelerating; wings dragging, a dust and ember swirl), a powerful push-off back into flight.
       Seconds: spin, plunge (to the slam), hold, grind, push: 0.26 + 0.30 + 0.10 + 0.62 + 0.28 = 1.56 s */
    divePh: [0.26, 0.30, 0.10, 0.62, 0.28],
    /* (round 3, the user: "make it normal turn instead and keep the motion blur") flight turns are continuous: the
       heading follows the stick at up to `max` rad/s (`k`: how hard it closes the gap; `acc`: rad/s2, the turn rate
       eases in and out), banking into the turn, the head leading and the tail counter-swinging on a spring. The blur
       ghosts and wingtip streaks fade in with the turn rate between blur[0] and blur[1] rad/s: gentle turns are clean */
    turn: { max: 5.0, k: 7, acc: 26, blur: [1.6, 4.6] },
    grindR: 2.8, bodyL: 1.5, bodyW: 0.8,           // (round 4) tiles: the grind's smash radius; the flying body's smash oval (half length, half width)
    chargeK: 30,                                   // the meter fills at chargeK x DK of damage actually dealt
    cdFire: 1, cdFlare: 4, mvHold: 0.6,            // s, exact, from the press of an activation; a press held while busy (round 3: Fireballs 1 s)
    summon: 3.4, readyHold: 6,                     // s: the model's summon clip; (round 3) the longest it hovers on at its end, on a cold cache, until every heading is drawable
    ultCap: 14, ultWonCap: 14,        // s: the model's summon clip; a started Ultima is ended anyway after this
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
     and tail out of step. So the dragon is only DRAWN at a heading with a usable picture set (sharp, or the quick
     half-size pictures) within one bucket of it (the model's least-squares map turns a neighbour's pictures onto the
     true heading: 22.5 deg at most, still one connected body).
     (Round 3, the user: "stuck in one position for a couple of seconds") The old rule drew a cold dragon at the nearest
     ready heading, frozen and straightened, for as long as the bake took, and on an iPhone that was long: Safari has no
     requestIdleCallback, so the idle warm-up barely ran. Now: bakePlan() orders the model's queue (the quick pictures
     of every other heading first: with those, EVERY heading is drawable; then the sharp pictures where it is facing,
     the remaining quick ones, the rest nearest first); the warm-up runs on any browser from the floor's start; the
     summon bakes hard and, on a cold cache, hovers (flapping) until every heading is drawable before it can fly. */
  function MDB() { const M0 = MOD(); return M0 && M0.__dbg; }
  /* the bake scale: the tile size (px, at zoom 1, times dpr) at the flight zoom; an existing bake within 25% is kept */
  const bakeT = TSdpr => TSdpr * TUNE.zoom * TUNE.size;   /* (round 2: the smaller dragon bakes smaller, so it bakes faster) */
  function bakeScaleOK(TSdpr) { const D = MDB(), k = D && D.BK && D.BK.k; if (!k) return false; const want = Math.round(bakeT(TSdpr) * (MOD().VIS || 1.25) / 8) * 8; return k >= want * 0.75; }
  const NBK = 16;
  function usableAt(a) { const D = MDB(); if (!D || !D.usableB) return true; const f = Math.floor(wrap(a) / TAU * NBK), b0 = ((f % NBK) + NBK) % NBK; return D.usableB(b0) || D.usableB((b0 + 1) % NBK); }
  function bothAt(a) { const D = MDB(); if (!D || !D.usableB) return true; const f = Math.floor(wrap(a) / TAU * NBK), b0 = ((f % NBK) + NBK) % NBK; return D.usableB(b0) && D.usableB((b0 + 1) % NBK); }
  function drawHeading(S, a) { const D = MDB(); if (!D || !D.usableB) return a; if (usableAt(a)) return a; const b = D.bucketOf(a);
    for (let d = 1; d <= NBK / 2; d++) for (const bb of [(b + d) % NBK, (b - d + NBK) % NBK]) if (D.usableB(bb)) { S.offHeading = (S.offHeading || 0) + 1; return bb / NBK * TAU; }
    return null; }
  /* every heading drawable (each pair of neighbours has one usable set); all usable; all sharp */
  function bakeState() { const D = MDB(); if (!D || !D.usableB || !D.BK || !D.BK.k) return { draw: true, all: true, sharp: true }; let draw = true, all = true, sharp = true;
    for (let b = 0; b < NBK; b++) { const u = D.usableB(b); if (!u) { all = false; if (!D.usableB((b + 1) % NBK)) draw = false; } if (!D.readyB(b)) sharp = false; } return { draw, all, sharp }; }
  let KEYS = null, PLAN = { b: -1, t: 0 };
  /* the bake order (the model's queue, rewritten in place): its segments, the quick pictures of every other heading
     (nearest to `a` first), the sharp ones of the facing heading and the next one in the turn's direction, the other
     quick pictures, then the rest sharp, nearest first */
  function bakePlan(a, dir, force) { const D = MDB(); if (!D || !D.BK || !D.BK.k || !D.bucketOf) return; const BK = D.BK, parts = Object.keys(BK.spr), b0 = D.bucketOf(a), now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (!force && b0 === PLAN.b && dir === PLAN.dir && now - PLAN.t < 250 && BK.queue[0] === PLAN.first) return; PLAN.b = b0; PLAN.dir = dir; PLAN.t = now;   /* (the model's draw moves the drawn heading's sharp pictures to the front each frame: re-planned when it has) */
    if (!KEYS || KEYS.n !== parts.length) { KEYS = { n: parts.length, lo: [], hi: [] }; for (let b = 0; b < NBK; b++) { KEYS.lo[b] = parts.map(p => 'lo:' + p + ':' + b); KEYS.hi[b] = parts.map(p => p + ':' + b); } }
    const Q = BK.queue, segs = Q.filter(k => k.startsWith('seg:')), out = segs, seen = new Set(), add = k => { if (k !== BK.genKey && !seen.has(k)) { seen.add(k); out.push(k); } };
    const near = []; for (let d = 0; d <= NBK / 2; d++) { near.push((b0 + d) % NBK); if (d && d < NBK / 2) near.push((b0 - d + NBK) % NBK); }
    const lo = b => parts.forEach((p, i) => { if (!BK.spr[p][b] && !BK.lo[p][b]) add(KEYS.lo[b][i]); }), hi = b => parts.forEach((p, i) => { if (!BK.spr[p][b]) add(KEYS.hi[b][i]); });
    for (const b of near) if (!(b & 1)) lo(b);
    hi(b0); hi((b0 + (dir < 0 ? NBK - 1 : 1)) % NBK);
    for (const b of near) if (b & 1) lo(b);
    for (const b of near) hi(b);
    Q.length = 0; for (const k of out) Q.push(k); PLAN.first = Q[0]; }
  /* ---- the heading (round 3): continuous, with an eased turn rate; a short history for the motion blur ---- */
  const HN = 32;
  function setHeading(S, a, dt) { const da = wrap(a - S.ha); S.ha = wrap(a); S.au += da; S.hw = dt > 0 ? da / dt : 0; }
  function steer(S, dt, want, mag) { const T = TUNE.turn; let wT = 0;
    if (want != null) { const off = wrap(want - S.ha); wT = Math.max(-1, Math.min(1, off * T.k / T.max)) * T.max * (0.6 + 0.4 * Math.min(1, mag)); }
    const lim = T.acc * dt, w = S.hw + Math.max(-lim, Math.min(lim, wT - S.hw)); S.hw = w; S.ha = wrap(S.ha + w * dt); S.au += w * dt; }
  function pushHist(S) { const H0 = S.hist; H0.i = (H0.i + 1) % HN; H0.t[H0.i] = S.g.t; H0.a[H0.i] = S.au; if (H0.n < HN) H0.n++; }
  /* the unwrapped heading `lag` s ago (from the history) */
  function agoU(S, lag) { const H0 = S.hist, t = S.g.t - lag; let j = H0.i, prev = -1;
    for (let k = 0; k < H0.n; k++) { if (H0.t[j] <= t) { if (prev < 0) return H0.a[j]; const u = (t - H0.t[j]) / Math.max(1e-6, H0.t[prev] - H0.t[j]); return lerp(H0.a[j], H0.a[prev], cl(u)); } prev = j; j = (j - 1 + HN) % HN; }
    return prev >= 0 ? H0.a[prev] : S.au; }
  /* the blur's strength: from the turn rate over the last tenth of a second (gentle turns: none) */
  function blurK(S) { const T = TUNE.turn, w = Math.abs(S.au - agoU(S, 0.1)) / 0.1; return sstep(T.blur[0], T.blur[1], w); }
  /* a stand-in for the turn driver handed to drawSpin: the drawn heading, ghosts along the recent arc and the wingtip
     streaks, both scaled by the turn rate; only ghosts whose headings are drawable */
  function spinProxy(S, a) { const P = S.TDP || (S.TDP = { spin: null, u: 0, last: { from: 0, span: 0, dir: 1, t: 0, dur: 0.16, to: 0 }, ghosts: n => ghostsOf(S, n) }), nb = !!S.noBlur;   /* (S.noBlur: tests count the body without the streaks) */
    const k = nb || Math.abs(wrap(a - S.ha)) > 0.05 ? 0 : blurK(S); P.a = a; P.k = k; P.blur = k > 0.03 ? 0.12 * k : 0;
    const u0 = agoU(S, 0.16), span = S.au - u0; P.last.from = wrap(S.ha - span); P.last.span = span; P.last.dir = span >= 0 ? 1 : -1; P.last.to = S.ha; return P; }
  function ghostsOf(S, n) { return [];   /* (no blur ghosts at all, the user 2026-11-08: each was a whole extra dragon draw; the wingtip streaks stay) */
    const P = S.TDP; if (!P || !(P.k > 0.03)) return []; const m = Math.min(n, 2), out = [];   /* (2 ghosts in the dive too: 3 peaked near 10 ms) */
    for (let i = m; i >= 1; i--) { const a = wrap(S.ha - (S.au - agoU(S, i * 0.035))); if (usableAt(a)) out.push({ a, al: 0.42 * (1 - (i - 1) / m) * P.k }); } return out; }
  function warmMoves(ms) { const MV = moves(), ws = ['warmS', 'warmU'].filter(w => MV[w] && !WARMED[w]); if (!ws.length || ms < 0.4) return; const w = ws[(WARMI++) % ws.length]; try { if (MV[w](Math.min(2, ms)) === true) WARMED[w] = true; } catch (e) { WARMED[w] = true; } }

  /* ================= the air: the map's tiles, the open air round it, the walls ================= */
  function airOf(X) { try { return X.air ? X.air() : null; } catch (e) { return null; } }
  function inMap(S, x, y) { const A = S.air; return !!A && x >= 0 && y >= 0 && x < A.w && y < A.h; }
  const tileOf = (S, x, y) => inMap(S, x, y) ? S.air.tile(Math.floor(x), Math.floor(y)) : -1;   // (-1: open air off the map)
  /* a wall the dragon must clear (T_SOLID inside the map) within r of (x, y) */
  function wallNear(S, x, y, r) { for (let ty = Math.floor(y - r); ty <= Math.floor(y + r); ty++) for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) { if (!inMap(S, tx + 0.5, ty + 0.5) || S.air.tile(tx, ty) !== T_SOLID || (S.vs && !S.air.hand && S.vs.smashable(tx, ty))) continue;   /* (round 4: a smashable prop is no wall: the body smashes through it) */ const cx = Math.max(tx, Math.min(x, tx + 1)), cy = Math.max(ty, Math.min(y, ty + 1)); if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true; } return false; }
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
    const TD = M0.turnDriver({ a: a0 });   /* (kept for the contract; round 3: flight no longer snap-spins, see steer()) */
    const dragon = { x: me.x, y: me.y, z: 0, heading: a0, vx: 0, vy: 0, pose: P, locked: true, vis: 1 };
    const S = { H, g, me, X, C, ev, tier, DK, CD, dur, left: dur, dragon, inst, TD, phase: 'summon', t: 0, ct: 0, charge: 0, used: false, busy: null, busyT: 0, cdF: 0, cdL: 0, mvQ: null, ultQ: null, dive: null, diveQ: null,
      gate: new Map(), parts: [], free: [], cracks: [], marks: [], ended: false, pet: X.pet ? X.pet() : null, air: airOf(X), vs: typeof VEH_SMASH !== 'undefined' ? VEH_SMASH.create(X, g) : null /* (round 4: the scenery it smashes) */, home: { x: me.x, y: me.y }, safe: { x: me.x, y: me.y }, safeT: 0, reachT: 2, cam: null, camShake: 0,
      ha: wrap(a0), au: a0, hw: 0, hist: { i: 0, n: 0, t: new Float64Array(HN), a: new Float64Array(HN) }, turnK: 0, tail: 0, tailV: 0, spinR: 0,
      stats: { smash: 0, pots: 0, dives: 0, diveHit: 0, diveBad: 0, fireballs: 0, flare: 0, ultima: 0, dealt: 0, charged: 0, hits: 0, flyT: 0, offT: 0, maxOff: 0, spins: 0 }, sfxT: 0, mx: 0, my: 0 };
    buildReach(S, me.x, me.y);
    g._nidhogg = S;
    const ctx = S.ctx = { X, H, C, evo: ev, tier, DK, dragon, petX: me.x, petY: me.y, petZ: 0, ultima: false, sfx: X.sfx || {}, model: M0,
      hit: (m, dmg, o) => hitCharge(S, m, dmg, o),
      hitArea: (x, y, r, dmg, o) => { if (!(o && o.noSmash)) smashArea(S, x, y, r);   /* (round 4: every area hit also smashes the scenery in it: Fireballs' bursts, Ultima's beam ticks and explosion) */ let n = 0; const ex = o && o.exclude; for (const m of H.living()) { if (ex && (ex === m || (ex.has && ex.has(m)))) continue; if (Math.hypot(m.x - x, m.y - y) < r + (m.r || 0.4)) { hitCharge(S, m, dmg, o); n++; } } return n; },
      smashArea: (x, y, r) => smashArea(S, x, y, r), smashCircle: (x, y, r) => smashArea(S, x, y, r), smashOval: (cx, cy, rx, ry, ang) => smashOval(S, cx, cy, rx, ry, ang),   /* (round 4: the scenery only: no damage, no charge) */
      mons: () => H.living(), target: () => target(S), aimPoint: () => aimPoint(S), aimDir: () => { const m = Math.hypot(S.mx, S.my); return m > 0.2 ? Math.atan2(S.my, S.mx) : dragon.heading; }, stick: () => ({ x: S.mx, y: S.my, mag: Math.min(1, Math.hypot(S.mx, S.my)) }),
      groundAt: (x, y) => groundAt(S, x, y), surfaceAt: (x, y) => surfaceAt(S, x, y), canStand: (x, y) => canStand(S, x, y), nearestLand: (x, y) => nearestLand(S, x, y, 8) || safeReturn(S),
      anchor: n => { const p = inst.anchor(n); return p ? { x: p.x, y: p.y, z: p.z } : { x: dragon.x, y: dragon.y, z: dragon.z }; },
      scr: (x, y, z) => [H.sx(x), H.sy(y) - (z || 0) * ZK * X.Tz()], T: () => X.Tz(),
      camera: o => { if (!o) { S.cam = null; return; } if (o.shake) { if (!calm()) X.shake(Math.min(10, o.shake), Math.min(0.5, o.dur || 0.25)); } const c0 = S.cam || {}, rz = o.zoom != null ? o.zoom / ULT_Z0 : null, uz = rz == null ? null : TUNE.zoom * (S.phase === 'ultima' && rz < 1 ? 1 + (rz - 1) * ULT_CAM_K : rz); S.cam = { zoom: uz != null ? Math.max(0.3, Math.min(1.1, uz)) : c0.zoom,   /* (every authored zoom is relative to the flight zoom it was made for (0.9); the Ultima keeps half its pull-back) */ x: o.x != null ? o.x : c0.x, y: o.y != null ? o.y : c0.y, k: o.k != null ? cl(o.k) : c0.k }; },   /* (a framing point x, y with k = how far the view leans to it; zoom; a later call merges) */
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
    const d = S.dragon, A = S.air, mag = steer ? Math.min(1, Math.hypot(S.mx, S.my)) : 0;
    const top = TUNE.top * (S.me.chill > 0 ? 0.8 : 1) * (S.g.buff && S.g.buff.haste > 0 ? 1.15 : 1);
    const want = mag > 0.15 ? Math.atan2(S.my, S.mx) : d.heading,   /* (the travel follows the stick exactly; the body turns to it smoothly) */ tvx = mag > 0.15 ? Math.cos(want) * top * mag : 0, tvy = mag > 0.15 ? Math.sin(want) * top * mag : 0, k = Math.min(1, (mag > 0.15 ? TUNE.accel / top : TUNE.brake / top) * dt * 2.2);
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
    // a full spin first (as Drift: away from the new heading, so a turn of less than a full one never shows), then the
    // plunge onto the point
    const a1 = dist > 0.3 ? a : d.heading, off = wrap(a1 - S.ha), dir = Math.abs(off) > 0.15 ? Math.sign(off) : -(S.lastDir || -1); S.lastDir = dir;
    const T1 = Ph[0], T2 = T1 + Ph[1], T3 = T2 + Ph[2], T4 = T3 + Ph[3];
    S.dive = { t: 0, ct: 0, t1: T1, t2: T2, t3: T3, t4: T4, end: T4 + Ph[4], x0: d.x, y0: d.y, z0: d.z, tx: p.x, ty: p.y, m: T.m, a: a1, dist, slam: false, spin2: false, push: false, dir, sp: null, swirl: 0 };
    startSpin(S, off + dir * TAU, Ph[0], 'io');
    S.busy = 'dive'; S.busyT = 0; S.stats.dives++; S.g.movedOnce = true; S.g.dodges = (S.g.dodges || 0) + 1;
    const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) { sfx.note(140, 0.4, 'sawtooth', 0.05, 60); sfx.note(320, 0.25, 'triangle', 0.03, 180, 0.08); }
  }
  /* a full spin of the heading (the blur ghosts and streaks follow from the turn rate). 'io': eased in and out (the
     snappy wind-up); 'out': fast, then decelerating (the grind's momentum running down) */
  const EASE = { io: u => u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, out: u => 1 - Math.pow(1 - u, 2.2) };
  function startSpin(S, span, dur, ease) { S.dive.sp = { from: S.ha, span, t: 0, dur, e: EASE[ease] || EASE.io }; S.stats.spins++; S.spinDir = span > 0 ? 1 : -1; }
  function runSpin(S, dt) { const Sp = S.dive && S.dive.sp; if (!Sp) { S.spinR = 0; S.hw = 0; return null; } Sp.t += dt; const u = cl(Sp.t / Sp.dur), e = Sp.e(u); setHeading(S, Sp.from + Sp.span * e, dt); S.spinR = (Sp.span > 0 ? 1 : -1) * TAU * e; if (u >= 1) { S.dive.sp = null; S.spinR = 0; } return u; }
  /* the rider's flat 2D roll: one turn per spin, exactly as Drift rolls the pet's sprite (never a yaw) */
  function petRoll(S) { return S.dive ? S.spinR || 0 : 0; }
  function stepDive(S, dt) {
    const D = S.dive, d = S.dragon, P = d.pose, CL = MOD().CLIPS.dive, Ph = TUNE.divePh, t1 = D.t1, t2 = D.t2, t3 = D.t3, t4 = D.t4; D.t += dt;
    // the model's dive clip, retimed: fold during the spin, plunge, braking flare to the slam, hold (wings spread wide
    // and legs down), kept there through the grind, then its push-up
    const t = D.t, prev = D.ct; D.ct = t < t1 ? 0.25 * t / t1 : t < t2 - 0.08 ? 0.25 + 0.55 * (t - t1) / (Ph[1] - 0.08) : t < t2 ? 0.8 + 0.2 * (t - (t2 - 0.08)) / 0.08 : t < t3 ? 1.0 + 0.1 * (t - t2) / Ph[2] : t < t4 ? 1.1 + 0.04 * (t - t3) / Ph[3] : 1.15 + 0.55 * cl((t - t4) / Ph[4]);
    CL.run(P, D.ct, Math.max(0, D.ct - prev));
    runSpin(S, dt);
    if (D.m && !D.m.dead && t < t2 - 0.1) { D.tx = D.m.x; D.ty = D.m.y; }   // (it tracks an enemy until it is committed)
    if (t < t1) { d.z = D.z0 + 0.4 * sstep(0, t1, t); d.vx *= 0.8; d.vy *= 0.8; }   // the wind-up: a snappy spin, rearing up
    else if (t <= t2) { const u0 = cl((t - t1) / Ph[1]), u = Math.pow(u0, 1.8);   // the plunge: accelerating, heavy
      d.x = lerp(D.x0, D.tx, u); d.y = lerp(D.y0, D.ty, u); d.z = lerp(D.z0 + 0.4, 0.3, Math.pow(u0, 1.5)); d.vx = (D.tx - D.x0) / Ph[1]; d.vy = (D.ty - D.y0) / Ph[1];
      if (Math.random() < dt * (lowFx() ? 20 : 60)) { const a = Math.random() * TAU; addPart(S, 1, d.x + Math.cos(a) * 0.5, d.y + Math.sin(a) * 0.4, d.z + 0.4, -d.vx * 0.15 + Math.cos(a), -d.vy * 0.15 + Math.sin(a) * GY, 1.5 + Math.random() * 2, 0.35 + Math.random() * 0.25, 0.14, { col: Math.random() < 0.5 ? FIRE : EMBER }); } }
    if (!D.slam && t >= t2) { D.slam = true; d.x = D.tx; d.y = D.ty; d.z = 0.3; d.vx = d.vy = 0; smashArea(S, D.tx, D.ty, TUNE.diveR); slam(S, D.tx, D.ty); }
    if (t > t2 && t < t3) { const u = (t - t2) / Ph[2]; d.z = 0.3 - 0.08 * Math.sin(Math.PI * u); P.pitch -= 0.25 * Math.sin(Math.PI * u); }   // the impact hold: it sinks into the slam
    // the grind: one slow heavy turn on the ground (fast off the slam, running down), wings dragging, dust and embers swirling
    if (t >= t3 && Math.floor((t - t3) / 0.15) !== D.gk && t < t4) { D.gk = Math.floor((t - t3) / 0.15); smashArea(S, d.x, d.y, TUNE.grindR); }   // (round 4: the grind's dragging wings and tail sweep the ground round it)
    if (t >= t3 && !D.spin2) { D.spin2 = true; startSpin(S, -D.dir * TAU, Ph[3], 'out'); const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.hiss) sfx.hiss(Ph[3], 0.06, 500); addPart(S, 9, d.x, d.y, 0, 0, 0, 0, 0.7, 2.2, {}); }
    if (t >= t3 && t < t4) { const u = (t - t3) / Ph[3], w = Math.abs(S.hw), sg = D.dir > 0 ? -1 : 1;
      d.z = 0.3 + 0.03 * Math.sin(u * 9); P.flapAmp = 0.1; P.downFlex = 0.75; P.spread = 1; P.pitch = -0.22; P.bank = -sg * 0.35 * (1 - u); P.tailSwing = sg * 0.9 * (1 - u * 0.7); P.headYaw = sg * 0.3 * (1 - u); P.legs = 1;
      D.swirl += dt * (lowFx() ? 22 : 60) * (0.35 + 0.65 * (1 - u)); while (D.swirl >= 1) { D.swirl -= 1; swirlPart(S, d, sg, w); } }
    // the push-off: a powerful downstroke and a climb straight back to cruise
    if (t >= t4 && !D.push) { D.push = true; const X = S.X, sfx = X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) sfx.note(80, 0.35, 'triangle', 0.06, 120); if (!calm()) X.shake(2.5, 0.12);
      for (let i = 0; i < (lowFx() ? 6 : 14); i++) { const a = i / (lowFx() ? 6 : 14) * TAU + Math.random() * 0.3, v = 3 + Math.random() * 2.5; addPart(S, 2, d.x + Math.cos(a) * 1.2, d.y + Math.sin(a) * 0.9, 0.1, Math.cos(a) * v, Math.sin(a) * v * GY, 0.4, 0.7 + Math.random() * 0.4, 0.5 + Math.random() * 0.3, { grow: 1.6, drag: 3 }); } }
    if (t > t4) { const u = cl((t - t4) / Ph[4]); d.z = lerp(0.3, TUNE.cruise, 1 - Math.pow(1 - u, 2)); P.flapAmp = Math.max(P.flapAmp, 1.1); }
    if (t >= D.end) { S.dive = null; S.busy = null; S.spinR = 0; d.vx = d.vy = 0; if (S.diveQ != null && S.g.t - S.diveQ < TUNE.diveBuf + 0.3) { S.diveQ = null; tryDive(S, S.mx, S.my, true); } }
  }
  /* one swirl particle off a dragging wingtip or the tail: dust (the floor's) or an ember, flung along the spin */
  function swirlPart(S, d, sg, w) { const k = Math.floor(Math.random() * 3), a = S.ha + (k === 0 ? Math.PI / 2 : k === 1 ? -Math.PI / 2 : Math.PI) + (Math.random() - 0.5) * 0.5, r = (k === 2 ? 2.0 : 2.4) * TUNE.size / 0.65 * (0.8 + Math.random() * 0.35);
    const x = d.x + Math.cos(a) * r, y = d.y + Math.sin(a) * r, ta = a + sg * Math.PI / 2, v = Math.min(9, w * r * 0.35) + 0.5;
    if (Math.random() < 0.55) addPart(S, 2, x, y, 0.05, Math.cos(ta) * v + Math.cos(a), (Math.sin(ta) * v + Math.sin(a)) * GY, 0.3 + Math.random() * 0.4, 0.6 + Math.random() * 0.4, 0.35 + Math.random() * 0.25, { grow: 1.3, drag: 2.5 });
    else addPart(S, 1, x, y, 0.1, Math.cos(ta) * v * 1.2, Math.sin(ta) * v * 1.2 * GY, 1 + Math.random() * 2, 0.4 + Math.random() * 0.3, 0.1 + Math.random() * 0.06, { col: Math.random() < 0.5 ? FIRE : EMBER, g: 3, drag: 1 }); }
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
    X.light(x, y, 3.6, 0.25); if (!calm()) { X.shake(n ? 7 : 5, 0.2); if (X.hitstop) X.hitstop(n ? 0.08 : 0.05); }   /* (round 3: a heavy slam: the hit-stop even on bare ground; none with reduce-motion) */
    const sfx = X.sfx || {}; if (sfx.thud) sfx.thud(); if (sfx.crash) sfx.crash(); if (sfx.stomp) sfx.stomp(); if (sfx.note) { sfx.note(55, 0.55, 'sawtooth', 0.12, 30); sfx.note(110, 0.3, 'square', 0.03, 70, 0.02); } if (sfx.hiss) sfx.hiss(0.4, 0.1, 1400);
  }

  /* ---- (round 4, the user: "the same environmental destruction ... same as beast machine") the scenery, through 20k0v's
     VEH_SMASH (its allowlist and protected kinds; the game's own break paths: chests open, shrines bless then break;
     nothing on a hand-drawn rift / puzzle / gate stage or a Super Fiend floor; walls, gaps, bridges, doors, gates, exits,
     stairs, keys and rift objects never). The rules, for a dragon that flies:
       - its body: at its height (cruise is low enough that its belly and legs brush the tall props) everything under its
         torso's swept oval (TUNE.bodyL x bodyW along the heading) breaks as it flies through; a smashable prop is not
         a wall it must climb (the wings span wide and pass over: they smash nothing);
       - Dive Bomb: the slam smashes its whole area (TUNE.diveR); the grind sweeps TUNE.grindR round it every 0.15 s;
       - every ctx.hitArea also smashes its area (Fireballs' bursts, Ultima's beam ticks and explosion) unless
         { noSmash }; Flare's lances call ctx.smashArea where each one strikes (one call in 20k6h);
       - areas never smash through a real wall (a line from the area's centre).
     No damage, no Ultima charge (never through hitCharge) ---- */
  const smashOn = S => !!(S.vs && S.vs.props) && !S.released && (S.phase === 'fly' || S.phase === 'ultima' || (S.phase === 'out' && !S.hopped)) && S.dragon.vis > 0.05;
  function inBody(px, py, x, y, a, pad) { const gx = px - x, gy = py - y, ca = Math.cos(a), sa = Math.sin(a), u = gx * ca + gy * sa, v = -gx * sa + gy * ca; return (u / (TUNE.bodyL + pad)) ** 2 + (v / (TUNE.bodyW + pad)) ** 2 < 1; }
  function smashBody(S) { const d = S.dragon; if (!smashOn(S)) { S.sb = null; return; } const p = S.sb || (S.sb = { x: d.x, y: d.y, a: d.heading }); if (Math.hypot(d.x - p.x, d.y - p.y) > 6) { p.x = d.x; p.y = d.y; }
    const n = Math.min(16, Math.max(1, Math.ceil(Math.max(Math.hypot(d.x - p.x, d.y - p.y) / 0.35, Math.abs(wrap(d.heading - p.a)) / 0.3)))), R = TUNE.bodyL + 0.6, a0 = p.a, da = wrap(d.heading - a0);
    const hit = (px, py, pad) => { for (let i = 0; i <= n; i++) { const u = i / n; if (inBody(px, py, lerp(p.x, d.x, u), lerp(p.y, d.y, u), a0 + da * u, pad)) return true; } return false; };
    S.vs.sweep(Math.floor(Math.min(p.x, d.x) - R), Math.floor(Math.min(p.y, d.y) - R), Math.floor(Math.max(p.x, d.x) + R), Math.floor(Math.max(p.y, d.y) + R), hit, smashCb(S));
    p.x = d.x; p.y = d.y; p.a = d.heading; }
  function smashArea(S, x, y, r) { if (!smashOn(S) || !(r > 0) || !isFinite(x) || !isFinite(y)) return 0; return S.vs.circle(x, y, r, smashCb(S)); }
  function smashOval(S, cx, cy, rx, ry, ang) { if (!smashOn(S) || !isFinite(cx) || !isFinite(cy)) return 0; return S.vs.oval(cx, cy, rx, ry, ang, smashCb(S)); }
  const smashCb = S => S.smashCb || (S.smashCb = (x, y, quiet, pot) => { S.stats[pot ? 'pots' : 'smash']++; smashFx(S, x, y, quiet); });
  /* the dragon's own touch on a smash (the break itself is 20l's / breakPot's): embers and ash thrown off, a small fire
     ring, a flash of light; light only, small, fewer on LOW; no shake for a quiet chain or under Reduce Motion */
  function smashFx(S, x, y, quiet) { const Q = lowFx() ? 0.4 : 1;
    for (let i = 0; i < Math.round(7 * Q); i++) { const a = Math.random() * TAU, v = 2.5 + Math.random() * 3.5; addPart(S, 1, x + Math.cos(a) * 0.2, y + Math.sin(a) * 0.15, 0.4, Math.cos(a) * v, Math.sin(a) * v * GY, 1.5 + Math.random() * 2.5, 0.3 + Math.random() * 0.25, 0.12 + Math.random() * 0.06, { col: i % 3 ? FIRE : i % 2 ? EMBER : CORE, g: 6, drag: 1.5 }); }
    addPart(S, 9, x, y, 0, 0, 0, 0, 0.28, 0.85, {}); if (!lowFx()) addPart(S, 2, x, y, 0.2, 0, 0, 0.5, 0.6, 0.4, { grow: 1.3, drag: 2.4 });
    S.X.light(x, y, 1.6, 0.12); if (!quiet && !calm()) S.X.shake(2, 0.08); }

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
    const d = S.dragon, me = S.me, g = S.g, X = S.X, M0 = MOD(), P = d.pose;
    if (S.released) { S.relT = (S.relT || 0) + dt; stepParts(S, dt); return; }
    if (me.dead) { finish(S, 'defeat'); return; }
    if (g.over || (g.won && S.phase !== 'ultima' && S.phase !== 'out')) { finish(S, 'won'); return; }
    if (X.pet && S.pet && X.pet() !== S.pet) { finish(S, 'swap'); return; }
    g.cdU = S.CD;   // (held while flying: the cooldown starts at the exit)
    S.t += dt; S.cdF = Math.max(0, S.cdF - dt); S.cdL = Math.max(0, S.cdL - dt); if (S.busy) S.busyT += dt;
    { const B = bakeState(), want = Math.hypot(S.mx, S.my) > 0.15 ? Math.atan2(S.my, S.mx) : S.ha; bakePlan(S.ha, wrap(want - S.ha) < 0 ? -1 : 1);
      // the bake budget (ms this frame; the model's slices never overrun it): hard while the summon waits, still firm until
      // every heading is drawable, then while the facing heading is not sharp; a trickle otherwise
      const DB = MDB(), sharpHere = !DB || !DB.readyB || DB.readyB(DB.bucketOf(S.ha));
      M0.warm(S.phase === 'summon' ? (B.draw ? (B.all ? 5 : 8) : S.hold2 > 0 || S.hold > 0 ? 13 : 10) : !B.draw ? 8 : !B.all ? 4.5 : !sharpHere ? 3 : B.sharp ? 0 : 1.2); S.bake = B;
      warmMoves(S.phase === 'summon' ? 1.5 : 0.5); }
    let mag = 0;
    if (S.phase === 'summon') {
      if (S.t > 1.9 && drawHeading(S, S.ha) == null && (S.hold || 0) < 4) { S.hold = (S.hold || 0) + dt; S.t -= dt; }   /* (the seal and the haze play on; on a cold cache the dragon is not drawn until a heading is ready, and the pet's mount at 1.9 s waits for it) */
      const h = M0.CLIPS.summon.run(P, S.t, dt) || {};
      if (h.dz) d.z = Math.min(TUNE.cruise, d.z + h.dz * dt);
      if (h.seal && Math.random() < dt * (lowFx() ? 14 : 40)) { const a = Math.random() * TAU, r = Math.random() * 2.4; addPart(S, 1, d.x + Math.cos(a) * r, d.y + Math.sin(a) * r * 0.8, 0.05, 0, 0, 1 + Math.random() * 2, 1 + Math.random(), 0.12, { col: Math.random() < 0.5 ? FIRE : EMBER }); }
      if (h.mount && !S.mounted) { S.mounted = true; const sfx = X.sfx || {}; if (sfx.jump) sfx.jump(); }
      if (S.t > 2.1 && !S.beat) { S.beat = true; const sfx = X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) sfx.note(62, 0.6, 'sawtooth', 0.08, 45); if (!calm()) X.shake(3, 0.15); }
      /* (round 3) on a cold cache it hovers on at the end of the summon, flapping, until every heading is drawable (so it
         can never fly frozen at a stand-in heading); at most TUNE.readyHold s */
      if (S.t >= TUNE.summon - 0.4 && !(S.bake && S.bake.draw) && (S.hold2 || 0) < TUNE.readyHold) { S.hold2 = (S.hold2 || 0) + dt; S.t = TUNE.summon - 0.4; S.hct = (S.hct || 0) + dt; M0.CLIPS.hover.run(P, S.hct, dt); d.z += (TUNE.cruise * 0.8 + 0.12 * Math.sin(S.hct * 2.2) - d.z) * Math.min(1, dt * 3); }
      if (S.t >= TUNE.summon) { S.phase = 'fly'; S.t = 0; d.locked = false; S.left = S.dur; d.z = Math.max(d.z, 1.6); }
    } else if (S.phase === 'fly') {
      S.left -= dt; S.stats.flyT += dt;
      if (S.left <= 0 && !S.dive && (!S.busy || S.busyT > 3)) { startOut(S, 'timeout'); return; }
      if (S.busy && S.busy !== 'dive' && S.busyT > 9) actionDone(S);
      if (S.dive) stepDive(S, dt);
      else { mag = fly(S, dt, !d.locked);
        if (!d.locked) { steer(S, dt, mag > 0.15 ? Math.atan2(S.my, S.mx) : null, mag); turnPose(S, dt); }
        if (!S.busy) { const C = mag > 0.15 ? M0.CLIPS.fly : M0.CLIPS.hover; S.ct += dt; C.run(P, S.ct, dt, { turn: S.turnK || 1e-4 }); relaxFx(P, dt); bodyTurn(S, P, dt, C === M0.CLIPS.hover); const vz = (d.z - (S.zPrev == null ? d.z : S.zPrev)) / Math.max(dt, 1e-3); P.pitch += Math.max(-0.3, Math.min(0.3, -0.09 * vz)); /* (nose up as it climbs, down as it sinks) */ } }
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
    // the heading: steered in fly() / the dive's spins / the glide home; while locked, Ultima owns dragon.heading (it is
    // followed, never fought)
    if (S.phase === 'out' && S.outT < (S.outGlide || 0) && S.ret && Math.hypot(S.ret.x - d.x, S.ret.y - d.y) > 0.6) { steer(S, dt, Math.atan2(S.ret.y - d.y, S.ret.x - d.x), 1); turnPose(S, dt); }
    else if (S.phase !== 'fly' && S.phase !== 'ultima') { steer(S, dt, null, 0); turnPose(S, dt); }
    if (d.locked && (S.phase === 'ultima' || S.busy)) { const da = wrap(d.heading - S.ha); S.ha = wrap(d.heading); S.au += da; S.hw = 0; S.turnK *= 0.8; } else d.heading = S.ha;
    if (S.busy && !S.dive && S.phase === 'fly' && !d.locked) bodyTurn(S, P, dt, false);   /* (a Strong's clip owns the pose: the bank and the tail's lag go on top) */
    pushHist(S);
    smashBody(S);
    S.zPrev = d.z;
    const MV = moves(); if (MV.update) { try { MV.update(S.ctx, dt); } catch (e) { /* (theirs) */ } }
    life(S, dt);
    if (S.phase !== 'out' || S.outT < (S.outGlide || 0)) syncMe(S);
    stepParts(S, dt);
    S.fx.entY = d.y + 1 + d.z;
    // wingbeats and a low growl now and then
    S.sfxT -= dt; if (S.sfxT <= 0 && S.phase === 'fly') { const sfx = X.sfx || {}; S.sfxT = 0.75 + Math.random() * 0.3; if (sfx.note) { sfx.note(70 + Math.random() * 10, 0.35, 'triangle', 0.035, 50); if (Math.random() < 0.15) sfx.note(48, 0.9, 'sawtooth', 0.03, 40); } if (Math.random() < 0.25 && sfx.hiss) sfx.hiss(0.08, 0.025, 2500); }
  }
  /* when no clip owns them: the effect channels relax (the flight clips set the motion channels themselves) */
  /* the turn's body language: turnK eases toward the turn rate (-1.3..1.3); the tail lags on an underdamped spring */
  function turnPose(S, dt) { const k = Math.max(-1.3, Math.min(1.3, S.hw / 3.6)); S.turnK += (k - S.turnK) * Math.min(1, dt * 7);
    const tg = -S.turnK * 0.8; S.tailV += (-90 * (S.tail - tg) - 9 * S.tailV) * dt; S.tail += S.tailV * dt; }
  /* after a clip: bank into the turn, the head leading, the tail counter-swinging with its lag, a harder flap in a hard turn */
  function bodyTurn(S, P, dt, hover) { const k = S.turnK; if (hover) { P.bank = k * 0.5; P.headYaw += k * 0.3; P.tailSwing += S.tail; } else { P.tailSwing += S.tail + k * 0.8; if (Math.abs(k) > 0.02) P.bank = k * 0.5; }
    P.flap = (P.flap + dt * 0.9 * Math.abs(k)) % 1; }
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
    if (S.outT < S.outGlide) { const u = sstep(0, 1, S.outT / S.outGlide); d.x = lerp(S.outFrom.x, S.ret.x, u); d.y = lerp(S.outFrom.y, S.ret.y, u); d.z = lerp(S.outFrom.z, 1.4, u); M0.CLIPS.fly.run(P, S.outT, dt, { turn: S.turnK || 1e-4 }); relaxFx(P, dt); bodyTurn(S, P, dt, false);
      return; }
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
    if (S.dive && !S.dive.slam) { const D = S.dive, u = cl(D.t / D.t2), r = T * TUNE.diveR * (1.05 - 0.35 * u), X0 = H.sx(D.tx), Y0 = H.sy(D.ty); c.globalAlpha = 0.65 * sstep(0, 0.2, u); c.beginPath(); c.ellipse(X0, Y0, r, r * GY, 0, 0, TAU); c.strokeStyle = FIRE; c.lineWidth = T * 0.07; c.stroke(); c.globalAlpha *= 0.4; blitSized(c, glowSprite(RED), X0 - r, Y0 - r * GY, r * 2, r * 2 * GY); }
    c.restore();
    // (v327) Dive Bomb in true 3D on the GPU (NIDHOGG_MOVES.F3D; the flat marks above stay as its light on the floor): a
    // flaming trail along the dive path, then at the slam a dome of fire swelling out of the ground over a crater ring
    // of fire, cooling into smoke; under the actors, so the dragon and its rider sit in it
    try { const F3 = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.F3D; if (F3 && F3.usable() && (S.dive || S.parts.some(p => p.kind === 9 && p.s > 2))) { const Q3 = F3.begin(c, H, T * ZK, d.x, d.y, null), K = Q3.K, D = S.dive;
      if (D && D.t > D.t1 && D.t < D.t2 + 0.08) { const Ph = TUNE.divePh, u0 = cl((D.t - D.t1) / Ph[1]), fade = D.t > D.t2 ? 1 - (D.t - D.t2) / 0.08 : sstep(0, 0.2, u0), PT = S.p3 || (S.p3 = []), n = Q3.low ? 6 : 10;
        for (let i = 0; i < n; i++) { const v = Math.max(0, u0 - i * 0.05), u = Math.pow(v, 1.8), q = PT[i] || (PT[i] = [0, 0, 0]); q[0] = lerp(D.x0, D.tx, u); q[1] = lerp(D.y0, D.ty, u); q[2] = lerp(D.z0 + 0.4, 0.3, Math.pow(v, 1.5)) + 0.5; }
        Q3.tube(PT, n, w => 0.7 * (1 - 0.8 * w), K.body, '#FF7A2E', 0.8 * fade, { heat: 0.95, seed: 3.1, af: w => 1 - w }); Q3.tube(PT, n, w => 0.95 * (1 - 0.75 * w), K.fire, '#FF7A2E', fade, { heat: 1.12, seed: 3.1, scroll: 4, af: w => 1 - w * w }); }
      for (const p of S.parts) { if (p.kind !== 9 || !(p.s > 2)) continue; const u = 1 - p.life / p.max, e = 1 - (1 - u) * (1 - u), r = TUNE.diveR * (0.45 + 0.6 * e), a = 1 - sstep(0.35, 1, u);
        Q3.sphere(p.x, p.y, 0, r * 0.95, K.body, '#FF7A2E', 0.9 * a, { heat: 1.0 - 0.5 * u, seed: 6.1, amp: 0.25, sz: 0.85, hemi: true }); Q3.sphere(p.x, p.y, 0, r, K.fire, '#FF7A2E', a, { heat: 1.15 - 0.6 * u, seed: 6.1, amp: 0.28, sz: 0.85, hemi: true, flow: 1.5 }); if (u < 0.4) Q3.sphere(p.x, p.y, 0.2, r * 0.4, K.core, '#FFF0C8', 1 - u / 0.4, { amp: 0.1, sz: 0.8 });
        if (u > 0.3) Q3.sphere(p.x, p.y, r * 0.25, r * 1.05, K.smoke, '#3A2A26', 0.7 * a * sstep(0.3, 0.6, u), { seed: 6.7, amp: 0.3, sz: 0.55, hemi: true, warm: 0.7 });
        Q3.torus(p.x, p.y, 0.04, TUNE.diveR * (0.3 + 0.8 * e), 0.1 * (1 - u) + 0.03, [0, 0, 1], 0, K.floor, '#FF8A3A', 1 - u, { heat: 0.95 - 0.4 * u }); }
      F3.flush(c); } } catch (e) { /* (the 3D layer; the flat pictures stand) */ }
    // the dragon's shadow (only over something to fall on: inside the map)
    if (S.phase !== 'gone' && M0 && inMap(S, d.x, d.y)) { const da = drawHeading(S, d.heading); if (da != null) try { M0.drawShadow(c, d.x, d.y, d.z, da, d.pose, { T, sx: H.sx, sy: H.sy, t, scale: TUNE.size }); } catch (e) { /* (model) */ } }
    callM(S, c, 'drawUnder');
  }
  function callM(S, c, k) { const MV = moves(); if (MV[k] && S.ctx) { c.save(); try { MV[k](S.ctx, c); } catch (e) { /* (theirs) */ } c.restore(); } }
  function petPos(S, T) {   // the rider on its seat (from the model's callback), or hopping on / off
    const H = S.H; if (S.phase === 'summon') { const s3 = S.seatS; const u = sstep(1.9, 2.25, S.t); if (!s3) return null; return [lerp(H.sx(S.home.x) + T * 1.6, s3[0], u), lerp(H.sy(S.home.y) + T * 0.8, s3[1], u) - Math.sin(u * Math.PI) * T, u]; }
    return null;
  }
  /* ---- (GPU remake, A) the life layer: authored waves and springs added over whatever wrote the pose this frame (the
     clips, the moves, the Ultima), applied for the draw only and taken off after it, so nothing feeds back into the clips:
     the wings' follow-through and a harder downstroke, neck and tail S-curves lagging the body, a bank that overshoots
     into turns, the head tracking the nearest enemy, breathing, a flinch when the rider is hurt, the Ultima's rear-back,
     chest swell and recoil, and a stronger summon and exit. Its phases are wrapped; sanePose clamps the result. ---- */
  const bumpL = (u, a, b, c2) => u <= a || u >= c2 ? 0 : u < b ? sstep(a, b, u) : 1 - sstep(b, c2, u);
  const SMK = { pitch: 0.09, bank: 0, headYaw: 0.07, headPitch: 0.07, neckCurve: 0.1, tailSwing: 0.12, tailLift: 0.12, legs: 0.12, spread: 0.08, fold: 0.08, finger: 0.08, downFlex: 0.05, jaw: 0.035, throat: 0.05 };   /* (s: every clip change blended over ~3 of these) */
  function life(S, dt) {
    const d = S.dragon, P = d.pose, t = S.g.t, me = S.me, V = S.LV || (S.LV = {}); for (const k in V) V[k] = 0;
    const L = S.L || (S.L = { ph: 0, bk: P.bank || 0, bkv: 0, hy: 0, hyv: 0, hp: me.hp, hit: -9, hd: 1, rec: -9, jaw0: 0, fp: P.flap || 0, amp: P.flapAmp || 0.8, w: 0, glide: 0, gT: 2, sm: {}, zb: 0 });
    if (!(S.phase === 'fly' || S.phase === 'summon' || S.phase === 'out' || S.phase === 'ultima') || !(dt > 0)) { L.hp = me.hp; L.fp = P.flap || 0; L.w = 0; return; }
    const sp = cl(Math.hypot(d.vx || 0, d.vy || 0) / TUNE.top), dive = !!S.dive, free = S.phase === 'fly' && !dive && !S.busy, own = dive ? 0.25 : S.busy ? 0.6 : 1, tk = S.turnK || 0;
    L.ph = (L.ph + dt * (1.5 + 1.1 * sp)) % TAU;
    /* ---- the flight: the core's own wingbeat while it flies free (the clips keep theirs in a dive, a Strong, the Ultima, the summon and exit):
       hovering, a steady beat; cruising straight, glides on spread wings broken by two or three strong beats; climbing or turning hard, harder and quicker;
       just after take-off, a heavy beat. Its phase is written back into the pose, so a clip taking over carries on from it with no jump */
    L.w += ((free ? 1 : 0) - L.w) * Math.min(1, dt / 0.2);
    const vz = (d.z - (L.zp == null ? d.z : L.zp)) / dt; L.zp = d.z;
    const toff = S.phase === 'fly' ? 1 - sstep(0, 0.9, S.t) : 0, cruise = sp > 0.55 && Math.abs(tk) < 0.35 && vz < 0.4 && toff < 0.1;
    L.gT -= dt; if (L.gT <= 0) { if (L.glide) { L.glide = 0; L.gT = (2 + Math.floor(Math.random() * 2)) / 1.25; } else if (cruise) { L.glide = 1; L.gT = 1.4 + Math.random() * 1.4; } else L.gT = 0.4; }
    if (!cruise && L.glide) { L.glide = 0; L.gT = 0.8; }
    let rate = sp < 0.25 ? 1.5 : 1.25, ampT = sp < 0.25 ? 0.95 : 0.78; if (vz > 0.4 || Math.abs(tk) > 0.6) { rate = 1.75; ampT = 1.0; } if (toff > 0) { rate = lerp(rate, 1.95, toff); ampT = lerp(ampT, 1.12, toff); }
    const gl = L.glide ? 1 : 0; L.gk = (L.gk || 0) + (gl - (L.gk || 0)) * Math.min(1, dt / 0.35); ampT = lerp(ampT, 0.1, L.gk); rate = lerp(rate, 0.25, L.gk);
    L.amp += (ampT - L.amp) * Math.min(1, dt / 0.25);
    if (L.w > 0.02) { const f0 = L.fp, sn = Math.sin(f0 * TAU); L.fp = (f0 + dt * rate * (1 + 0.38 * -Math.cos(f0 * TAU))) % 1;   /* (a quick, hard downstroke and a slower recovery) */ P.flap = L.fp; } else L.fp = P.flap || 0;
    const fp = (((P.flap || 0) % 1) + 1) % 1 * TAU, ampC = cl(P.flapAmp || 0), amp = lerp(ampC, L.amp, L.w), dn = Math.max(0, -Math.cos(fp)), upk = Math.max(0, Math.cos(fp));
    V.flapAmp = amp - ampC;
    /* downstroke: spread wide and cupped (fingers fanned); upstroke: folded at the wrist; the tips trail the arm; gliding: spread and still, a slight dihedral */
    V.spread = own * (0.16 * amp * dn + 0.25 * L.gk * L.w); V.finger = own * 0.18 * amp * dn; V.fold = own * 0.1 * amp * upk; V.downFlex = own * 0.25 * amp * Math.sin(fp - 1.1);
    /* M's wing joints (v325): the hand trails the arm through each stroke, the fingers fan and the membrane bellies (cupped) on the downstroke,
       the forearm sweeps back on the upstroke; gliding, a slight dihedral, the membrane full, the fingers open */
    V.wrist = own * 0.4 * amp * Math.sin(fp - 1.2); V.fingerSpread = own * (0.45 * amp * dn - 0.3 * amp * upk + 0.25 * L.gk * L.w); V.billow = own * (0.6 * amp * dn + 0.35 * L.gk * L.w); V.elbow = own * 0.45 * amp * upk; V.shoulder = own * (0.15 * L.gk * L.w - 0.08 * amp * dn);
    L.zb = own * 0.09 * amp * -Math.sin(fp - 0.5);   /* the body heaves up on each downstroke (a drawn height, never the dragon's own) */
    V.pitch = own * 0.03 * amp * Math.sin(fp + 0.6) - 0.14 * toff;
    /* the neck and tail as continuous S-waves: one slow wave down the body and the beat's echo, each later than the last; the head leads the turn, the tail swings wide */
    V.neckCurve = own * (0.08 * Math.sin(L.ph) + 0.06 * amp * Math.sin(fp - 0.9)); V.headPitch = own * (-0.05 * Math.sin(L.ph - 0.7) - 0.04 * amp * Math.sin(fp - 1.4));
    V.tailSwing = own * ((0.12 + 0.06 * sp) * Math.sin(L.ph * 0.8 - 1.6) - 0.35 * tk); V.tailLift = own * (0.09 * amp * Math.sin(fp - 2.0) + 0.05 * Math.sin(L.ph - 2.4)) - 0.12 * toff;
    V.breath = 0.35 * (1 - sp);
    /* the bank: an underdamped spring after whatever bank this frame asks for (rolls into the turn, swings past, settles) */
    { const tg = (P.bank || 0) + (free ? 0.12 * tk : 0), w = 6.5, z = 0.38; L.bkv += (-2 * z * w * L.bkv - w * w * (L.bk - tg)) * dt; L.bk += L.bkv * dt; if (!isFinite(L.bk)) { L.bk = tg; L.bkv = 0; } V.bank = dive ? 0 : clamp(L.bk - (P.bank || 0), -0.45, 0.45); }
    /* the head: leads the turn, and turns a little toward the nearest enemy ahead (8 tiles, 100 degrees either side) */
    { let ty = free ? 0.3 * tk : 0; if (!dive && S.phase === 'fly') { let best = 64; for (const m of S.H.living()) { const dx = m.x - d.x, dy = m.y - d.y, r2 = dx * dx + dy * dy; if (r2 >= best) continue; const a = wrap(Math.atan2(dy, dx) - d.heading); if (Math.abs(a) > 1.75) continue; best = r2; ty += clamp(a, -0.5, 0.5) * 0.6; } }
      const w = 6, z = 0.6; L.hyv += (-2 * z * w * L.hyv - w * w * (L.hy - ty)) * dt; L.hy += L.hyv * dt; if (!isFinite(L.hy)) { L.hy = 0; L.hyv = 0; } V.headYaw = clamp(L.hy, -0.6, 0.6); }
    /* hurt: a flinch, the head snapping back, a sideways jolt through the bank and the tail, the jaw open in a snarl */
    if (me.hp < L.hp - 0.5) { L.hit = t; L.hd = Math.random() < 0.5 ? -1 : 1; } L.hp = me.hp;
    { const u = t - L.hit; if (u >= 0 && u < 0.7) { const e = Math.exp(-u * 6), w2 = Math.cos(u * 22); V.bank += 0.22 * L.hd * e * w2; V.headPitch -= 0.3 * e; V.jaw = (V.jaw || 0) + 0.5 * e; V.tailSwing += 0.3 * L.hd * e * w2; V.spread -= 0.15 * e; V.pitch -= 0.08 * e; V.shoulder -= 0.35 * e * w2; V.elbow += 0.3 * e; } }
    if (S.phase === 'ultima') { const u = S.t, r = bumpL(u, 0, 0.4, 1.0);   /* the anticipation: it rears back, the chest swells, the wings lift */
      V.pitch -= 0.3 * r; V.headPitch -= 0.35 * r; V.neckCurve += 0.3 * r; V.breath += 1.4 * r;   /* (the wings: held low and back under the ring, below) */
      if (L.jaw0 < 0.9 && (P.jaw || 0) >= 0.9) L.rec = t; L.jaw0 = P.jaw || 0;   /* the beam's first instant: the recoil through the neck and body */
      const e = t - L.rec < 1.2 ? Math.exp(-(t - L.rec) * 4) : 0; V.pitch -= 0.22 * e; V.headPitch -= 0.18 * e; V.neckCurve -= 0.22 * e; V.tailLift += 0.15 * e; }
    else L.jaw0 = 0;
    /* (v326, the user: "make sure that the wings don't come through" the Ultima's ring) through the whole Ultima the wings are held spread low and back,
       under the ring's plane: eased in over 0.2 s from the cast and out after it; checked over every clip frame by __dbg.ultWingCheck */
    L.uw = (L.uw || 0) + ((S.phase === 'ultima' ? 1 : 0) - (L.uw || 0)) * Math.min(1, dt / 0.2); if (L.uw > 0.001) ultHold(P, V, L.uw);
    if (S.phase === 'summon') { const r = bumpL(S.t, 1.95, 2.25, 3.0);   /* the summon's roar as it takes the rider: wings flung wide, head up, jaws open */
      V.spread += 0.4 * r; V.shoulder += 0.45 * r; V.fingerSpread += 0.6 * r; V.jaw = (V.jaw || 0) + 0.75 * r; V.headPitch -= 0.4 * r; V.neckCurve += 0.3 * r; V.pitch -= 0.22 * r; V.tailLift += 0.15 * r; }
    if (S.phase === 'out') { const G2 = S.outGlide || 0, r2 = bumpL(S.outT, G2 - 0.45, G2 - 0.12, G2 + 0.15), r = bumpL(S.outT - G2, 0, 0.18, 0.7);   /* the exit: a braking flare onto the spot (its weight: legs down, the body settling), then a last roar as it burns away */
      V.spread += 0.3 * r2 + 0.4 * r; V.billow += 0.6 * r2; V.fingerSpread += 0.5 * r2 + 0.5 * r; V.shoulder += 0.3 * r; V.pitch -= 0.2 * r2 + 0.15 * r; V.legs = (V.legs || 0) + 0.4 * r2; L.zb -= 0.12 * r2; V.jaw = (V.jaw || 0) + 0.7 * r; V.headPitch -= 0.35 * r; V.neckCurve += 0.25 * r; }
    /* every clip change eased: the drawn channels follow the written ones through a short low-pass (the bank has its own spring) */
    const SM = L.sm; for (const k in SMK) { const v = P[k] || 0; if (SM[k] == null || !isFinite(SM[k])) SM[k] = v; const tau = SMK[k]; if (tau > 0) { SM[k] += (v - SM[k]) * Math.min(1, dt / tau); V[k] = (V[k] || 0) + (SM[k] - v); } }
  }
  const ULT_HOLD = { flap: 0.25, flapAmp: 0.12, shoulder: 0.5, elbow: 0.4, wrist: -0.3, fold: 0.15, spread: 0.3, downFlex: 0, fingerSpread: 0.2, billow: 0.3 };   /* (shoulder + lowers the whole wing in the rig; about 1.2 rig units under the 1.6x ring at worst) */
  function ultHold(P, V, w, H) { H = H || ULT_HOLD; for (const k in H) { let d = H[k] - (P[k] || 0); if (k === 'flap') d = ((d % 1) + 1.5) % 1 - 0.5; V[k] = lerp(V[k] || 0, d, w); } }
  /* the check (tests, via __dbg): the Ultima's clips (ultima, beam, settle) frame by frame, the hold applied, every wing point (root, elbow, wrist,
     the four finger tips) against the ring's plane wherever the ring shows; returns the smallest clearance below it (rig units; above 0 = clear) */
  function ultWingCheck(o) { o = o || {}; const M0 = MOD(); if (!M0 || !M0.rig || !M0.CLIPS) return null; const P = M0.blankPose(), dt = 1 / 60, H = o.hold, rk = o.ringK || 1.6; let worst = 1e9, at = null, n = 0;
    for (const nm of ['ultima', 'beam', 'settle']) { const C = M0.CLIPS[nm]; if (!C) continue; for (let t = 0; t <= C.dur + 1e-6; t += dt) { C.run(P, t, dt); if (!(P.ring > 0.02)) continue; const V = {}; ultHold(P, V, 1, H); const Q = Object.assign({}, P); for (const k in V) Q[k] = (Q[k] || 0) + V[k]; Q.flap = ((Q.flap % 1) + 1) % 1;
        const R = M0.rig(Q, t), rz = R.ring[2], rx = R.ring[0], ry = R.ring[1], rr = 1.45 * 1.45 * rk; n++;
        for (const Wg of R.wing) for (const q of [Wg.elbow, Wg.wrist].concat(Wg.fing)) { const c2 = rz - q[2], hd = Math.hypot(q[0] - rx, q[1] - ry); if (c2 < worst) { worst = c2; at = { clip: nm, t: +t.toFixed(2), r: +hd.toFixed(2), z: +q[2].toFixed(2), ringZ: +rz.toFixed(2), ringR: +rr.toFixed(2) }; } } } }
    return { clearance: +worst.toFixed(3), frames: n, at }; }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  function lifeOn(S, P) { const V = S.LV; if (!V) return null; const keep = {}; for (const k in V) { if (!V[k]) continue; keep[k] = P[k]; P[k] = (P[k] || 0) + V[k]; } sanePose(P, MOD()); return keep; }
  function lifeOff(P, keep) { if (keep) for (const k in keep) P[k] = keep[k]; }
  /* every pose channel sane before a draw (the core, the moves, the Ultima and the clips all write it): phases wrapped
     (flap in cycles, ringSpin in radians), NaN or Infinity to the rest value, amounts and angles held to a wide range */
  const PSIGN = { pitch: 1, bank: 1, headYaw: 1, headPitch: 1, neckCurve: 1, tailSwing: 1, tailLift: 1, downFlex: 1 };
  function sanePose(P, M0) { const B = sanePose.B || (sanePose.B = M0 && M0.blankPose ? M0.blankPose() : {});
    for (const k in P) { let v = P[k]; if (typeof v !== 'number') continue; if (!isFinite(v)) { P[k] = B[k] != null ? B[k] : 0; continue; }
      if (k === 'flap') v = ((v % 1) + 1) % 1; else if (k === 'shoulder' || k === 'wrist' || k === 'fingerSpread') v = v < -1 ? -1 : v > 1 ? 1 : v; else if (k === 'elbow' || k === 'billow') v = v < 0 ? 0 : v > 1 ? 1 : v; else if (k === 'ringSpin') v = v % TAU; else if (k === 'ringSpinV') v = Math.max(-20, Math.min(20, v)); else if (k === 'alpha') v = v < 0 ? 0 : v > 1 ? 1 : v; else if (PSIGN[k]) v = v < -2 ? -2 : v > 2 ? 2 : v; else v = v < -0.5 ? -0.5 : v > 1.6 ? 1.6 : v;   /* (amounts: a little overshoot either way is the clips' own spring) */
      P[k] = v; } }
  function drawEnt(S, c) {
    const H = S.H, T = H.X.Tz(), d = S.dragon, M0 = MOD(), t = S.g.t; if (d && d.pose) sanePose(d.pose, M0);
    if (S.phase === 'gone') { const da = drawHeading(S, d.heading); if (S.fade && S.relT < S.fade && M0 && da != null) { const a0 = d.pose.alpha; d.pose.alpha = a0 * (1 - S.relT / S.fade); M0.drawSpin(c, d.x, d.y, d.z, d.pose, { T, sx: H.sx, sy: H.sy, t, low: lowFx(), scale: TUNE.size }, spinProxy(S, da)); d.pose.alpha = a0; } return; }
    if (!M0 || d.vis <= 0.01) { if (S.phase !== 'out' || !S.hopped) H.X.drawPetAt(c, H.sx(d.x), H.sy(d.y) - d.z * ZK * T, { maxH: 0.85 }); return; }
    const riding = !(S.phase === 'summon' && S.t < 2.2) && !(S.phase === 'out' && S.hopped);
    const o = { T, sx: H.sx, sy: H.sy, t, low: lowFx(), scale: TUNE.size, pet: (cc, PX, PY) => { const roll = petRoll(S); PY += T * TUNE.size * (0.3 * Math.max(0, d.pose.pitch || 0) * (1 + 0.8 * Math.max(0, -Math.sin(d.heading))) + (S.dive ? 0.14 : 0)) + T * 0.22 * Math.abs(Math.sin(roll)); S.seatS = [PX, PY]; if (riding) H.X.drawPetAt(cc, PX, PY, { maxH: 0.85, rot: roll }); } };   /* (rolled on its side the sprite's lowest point rises: it is kept down on the seat) */   /* (nose-down, the back slopes away from the seat point: the rider is seated a little lower, on the plates) */   /* (round 2: drawn at 0.65; the rider a little smaller to sit in the smaller seat, rolling flat with each dive spin) */
    const a0 = d.pose.alpha; d.pose.alpha = a0 * d.vis;
    const da = drawHeading(S, d.heading); S.drawnA = da;
    if (da != null) { const sub = Math.abs(wrap(da - d.heading)) > 0.05, P0 = d.pose, half = !sub && !bothAt(da), kb = sub || half ? [P0.bank, P0.headYaw, P0.tailSwing] : null;
      if (sub) { P0.bank = 0; P0.headYaw = 0; P0.tailSwing = 0; } else if (half) P0.bank *= 0.5;   /* (round 3: only one of the two neighbouring headings baked yet, early in a cold cast: a hard bank is halved so the mapped torso keeps the rider's seat) */ const ring0 = P0.ring; if (S.noBlur) P0.ring = 0;   /* (S.noBlur, tests only: the body without the spin's streaks and the Ultima ring's floating segments) */   /* (at a stand-in heading the spin's bank / head yaw / tail swing would turn pieces toward headings not baked yet: drawn straight, every piece and the seat share one heading) */
      const LK = sub ? null : lifeOn(S, P0), zb = LK && S.L ? S.L.zb * TUNE.size : 0; try { M0.drawSpin(c, d.x, d.y, d.z + zb, d.pose, o, spinProxy(S, da)); } catch (e) { /* (model) */ } lifeOff(P0, LK);
      if (kb) { P0.bank = kb[0]; P0.headYaw = kb[1]; P0.tailSwing = kb[2]; } P0.ring = ring0; }
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
    // (v327) Dive Bomb's flaming trail and the slam's rising fireball over the actors (3D, the rider's face kept clear)
    try { const F3 = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.F3D, D = S.dive, d = S.dragon; if (F3 && F3.usable() && (D || S.parts.some(p => p.kind === 9 && p.s > 2))) { const sp0 = S.seatS || [-1e9, -1e9], Q3 = F3.begin(c, H, T * ZK, d.x, d.y, [sp0[0], sp0[1] - T * 0.45, T * 0.95]), K = Q3.K;
      if (D && D.t > D.t1 && D.t < D.t2 + 0.1) { const Ph = TUNE.divePh, u0 = cl((D.t - D.t1) / Ph[1]), fade = D.t > D.t2 ? 1 - (D.t - D.t2) / 0.1 : sstep(0, 0.2, u0), PT = S.p3o || (S.p3o = []), n = Q3.low ? 6 : 10;
        for (let i = 0; i < n; i++) { const v = Math.max(0, u0 - 0.05 - i * 0.06), u = Math.pow(v, 1.8), q = PT[i] || (PT[i] = [0, 0, 0]); q[0] = lerp(D.x0, D.tx, u); q[1] = lerp(D.y0, D.ty, u); q[2] = lerp(D.z0 + 0.4, 0.3, Math.pow(v, 1.5)) + 0.9; }
        Q3.tube(PT, n, w => 0.6 * (1 - 0.8 * w), K.body, '#FF7A2E', 0.8 * fade, { heat: 0.95, seed: 3.1, af: w => 1 - w }); Q3.tube(PT, n, w => 0.85 * (1 - 0.75 * w), K.fire, '#FF7A2E', fade, { heat: 1.12, seed: 3.1, scroll: 4, af: w => 1 - w * w }); }
      for (const p of S.parts) { if (p.kind !== 9 || !(p.s > 2)) continue; const u = 1 - p.life / p.max; if (u > 0.6) continue; const v = u / 0.6, r = TUNE.diveR * (0.35 + 0.3 * (1 - (1 - v) * (1 - v))), z = 0.6 + 1.4 * v;
        Q3.sphere(p.x, p.y, z, r * 0.9, K.body, '#FF7A2E', 1 - v, { heat: 1.0 - 0.5 * v, seed: 8.1, amp: 0.3 }); Q3.sphere(p.x, p.y, z, r, K.fire, '#FF7A2E', 1 - v, { heat: 1.15 - 0.6 * v, seed: 8.1, amp: 0.32, flow: 1.6 }); if (v > 0.35) Q3.sphere(p.x, p.y, z + r * 0.3, r * 1.1, K.smoke, '#3A2A26', 0.7 * (v - 0.35) / 0.65, { seed: 8.7, amp: 0.3, warm: 0.6 }); }
      F3.flush(c); } } catch (e) { /* (the 3D layer) */ }
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
  /* idle-time preparation (20b calls it for an equipped Ultimate at the floor's start): the model's bake (in bakePlan's
     order: every heading drawable as soon as possible), then N2's / N3's sprites.
     (Round 3) It runs on every browser (Safari, so every iPhone, has no requestIdleCallback, and a busy device has
     little idle time anyway): a slice after each frame, sized to the frame rate it sees (3 ms at 60 fps, 1.6 ms when
     frames run late, 0.8 ms on a struggling device), so it never stacks a hitch on a slow frame */
  let PUMP = null;
  U.nidhogg.warm = o => { setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T, M0 = MOD(); if (!(T > 0) || !M0) return; const dpr = (typeof arc !== 'undefined' && arc.dpr) || 1; const Z = (typeof arc !== 'undefined' && arc.game && arc.game._dbg && arc.game._dbg.g && arc.game._dbg.g.zoom) || 1;
    if (bakeScaleOK(T / Math.max(0.5, Z) * dpr)) M0.warmIdle(0, 1); else M0.warmIdle(bakeT(T / Math.max(0.5, Z) * dpr), 1);   /* (the same scale the cast will use) */
    bakePlan(0, 1, true);
    const idle = () => { if (['warmS', 'warmU'].every(w => !moves()[w] || WARMED[w])) return; warmMoves(2); if (typeof requestIdleCallback === 'function') requestIdleCallback(idle, { timeout: 300 }); else setTimeout(idle, 60); }; idle();
    if (PUMP) return; const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()); let last = now();
    const slice = ms => { const g = typeof arc !== 'undefined' && arc.game && arc.game._dbg && arc.game._dbg.g, S = g && g._nidhogg, a = S && !S.released ? S.ha : 0; bakePlan(a, 1, false); return M0.warm(ms) === true; };
    PUMP = () => requestAnimationFrame(() => setTimeout(() => { const n = now(), gap = n - last; last = n; if (slice(gap < 20 ? 3 : gap < 34 ? 1.6 : 0.8)) { PUMP = null; return; } PUMP(); }, 0));
    PUMP(); }, 300); };
  U.nidhogg.TUNE = TUNE;
  U.nidhogg.__dbg = { ultWingCheck, ULT_HOLD, VS: typeof VEH_SMASH !== "undefined" ? VEH_SMASH : null, smashArea, smashOn, TUNE, STUB, moves, safeReturn, nearestLand, groundAt, aimPoint, target, petRoll, blurK, bakeState, bakePlan };
})();
