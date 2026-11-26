/* ---------- (v451 TM, model remade v454 TM2) Thunder's six-star summon Ultimate: Tiamat ----------
   The user's brief (2026-11-22): summon an immense dragon formed from pure lightning; it roars above the battlefield, then plunges
   into the ground and bursts into a storm of electricity. The dragon's model is 20k9l (TIAMAT_GL); this file is the move: one
   authoritative timeline per cast, its damage, its footprint, its light, its clean-up.
   The cast (20b useUlt commits it: MP and the cooldown, TUNE.cd 45 s, start there: the summons' convention, as Titan's): a short
   gesture (TUNE.gesture), then the pet has its normal movement, dodge and attacks while the dragon runs on its own clock; the
   monsters, their attacks and every timer carry on. The normal camera: pulled back a little while it flies, a restrained shake and
   a small punch at the impact.
   The sequence (seconds from the cast, all in TUNE):
     0 .. 0.8     forks of lightning converge from the sky onto a point above the impact area (a little behind it, so the dragon
                  faces it); a flash where they meet;
     0.5 .. 1.25  the dragon resolves there in one coherent formation (its chest first, then the head and neck, the fins, the
                  tail: a white front sweeping through each part as it appears), swimming in the air like an eel (v454 TM2: the
                  serpent of the user's concept: waves running down its body, its sail and fins rippling, its whiskers trailing);
     1.3 .. 2.25  it rears and roars, jaws open: the charge cue. The charge runs from the tail through the chest into the open jaws
                  (its magenta veins and dots brightening tail to head, an orb of light travelling with it, then gathering in the
                  jaws), violet arcs crackle between its crest spines, its claws, its fin-wings, along its sail; a deep thunder roll;
     2.25 .. 2.45 it gathers itself, its sail laid back, and pitches down;
     2.45 .. 2.85 it dives head first at the target, a trail of plasma behind it, its silhouette kept;
     2.85         THE IMPACT: the whole dragon erupts in one enormous electrical discharge, one heavy circular Thunder hit
                  (TUNE.impactK DK) on every monster within TUNE.impactR of the strike, each once (one Map for the whole event:
                  whatever of its body, its claws or its bolts overlap a monster). A short controlled flash, a restrained shake;
     then         a branching electrical pattern spreads over the floor out to TUNE.patR, and 1 / 2 / 3 aftershock pulses (Base /
                  Adept / Celestial) race out over it TUNE.pulseGap s apart (the first TUNE.pulseGap after the impact), each hitting
                  each monster once as its front passes (TUNE.pulseK DK), however many branches cross it;
     2.85 .. 3.45 the dragon's outline breaks into luminous arcs and is gone; the ground's electricity fades after the last pulse.
   The charging roar and the dive's trail deal no damage. The impact is the largest single hit: TUNE.impactK 11 DK against a pulse's 2.2
   (DK = base x K x (1 + 0.08 (evo - 1)), the elemental Ultimates' scale): 13.2 / 15.4 / 17.6 DK on a monster that takes all of it,
   in line with Moby Dick (12.2 .. 16.6, 40 s) and Ragnarok's single 16 DK strike (22 s). Bosses take the damage but keep their
   crowd-control immunity (no stun). Enemies only (the game's monsters through X.hitMon).
   Footprint: the strike's reach (impactR) and the pulses' (patR) are measured on the real floor round the impact (walkable, explored,
   in sight of it and connected to it, as Moby Dick's water); the ground's pattern is drawn on exactly those tiles (feathered at the
   walls) and a monster is struck only there. Pictures only: no tile, collision or navigation changes.
   One authoritative timeline (the effect's own game clock): the impact by its threshold, each pulse by its front's sweep since the
   last frame: the same hits at any frame rate. Everything ends with the effect: on completion, the caster's defeat (nothing more
   lands: the dragon breaks up where it is and the ground's light drains), the stage's end or exit (the effect goes with the game;
   the model's GPU buffers are freed by the stage's destroy hook in 20b).
   Layers: the ground's shade and pattern on the floor pass (under the warnings, traps and pickups); the dragon, its arcs, the
   discharge on the sky pass (a hook in 20b after the darkness and the fog, under the monsters' shots and rings: v451 TM).
   GPU first: the ground's pattern, the pulses and the discharge on the shared painter (20k6h FGFX kinds 376..378, TM-FX), the
   bolts and arcs through the lightning kit's GPU mode (20k9a TK), the dragon on GLM; without WebGL a painted version of each. Arcs
   and lights are bounded: at most TUNE.arcs crackling arcs, TUNE.forks forks, one dynamic light at the impact and one a pulse. */
(() => {
  const U = ELEM_IMPL.thunder.ult, TAU = Math.PI * 2;
  const TUNE = {
    cd: 45,                     // (the cooldown, s: the row's cd in ELEM_MOVES.thunder; the game sets it when the cast commits)
    gesture: 0.45,              // the pet's casting gesture (s); full control after it
    forks: 0.8, form0: 0.5, form1: 1.25,               // the forks converge (s); the formation's window
    roar: 1.3, charge0: 1.4, charge1: 2.1, fold: 2.25, dive: 2.45, impact: 2.85,   // the timeline (s)
    pulseGap: 0.45, pulses: [1, 2, 3], pulseV: 26,      // the aftershocks: apart (s), how many (Base, Adept, Celestial), their fronts' speed (tiles/s)
    pulseBand: 0.6,             // the band behind a front that still counts as passing (tiles)
    impactR: 3.0, patR: 4.6, spread: 0.3,               // the strike's reach, the pattern's (the pulses' reach), how fast it spreads (s) (tiles)
    breakup: 0.6, fade: 0.65,   // the dragon's break-up after the impact (s); the ground's light fading after the last pulse (s)
    hoverZ: 3.5, hoverBack: 2.0, size: 0.6,           // where it hovers (tiles above the floor, behind the impact) and its size
    impactK: 11, pulseK: 2.2,   // damage (x DK)
    stun: 0.8, pulseStun: 0.25, // (monsters only: bosses keep their immunity)
    shake: 10, zoom: 1.04, zoomT: 0.3, zoomOut: 0.92,   // the camera: a restrained shake and a small punch at the impact; pulled back a little while it flies
    arcs: 5, nForks: 6, sparks: 26,                     // cosmetic bounds (thinned by Fewer effects; never the hits)
  };
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const eo = u => 1 - (1 - cl(u)) * (1 - cl(u));
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const TG = () => (typeof TIAMAT_GL !== 'undefined' ? TIAMAT_GL : null);
  const glOff = () => { try { return typeof window !== 'undefined' && window.__TM_GL === 0; } catch (e) { return false; } };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  let LAST = null;   // (the last cast's record: tests read its hits and its timeline)

  /* ---- the footprint's floor: every floor tile round the impact that is walkable, explored, in sight of it and connected to it ---- */
  function floorMap(H, cx, cy, R) {
    const X = H.X, x0 = Math.floor(cx - R) - 1, y0 = Math.floor(cy - R) - 1, n = Math.ceil(R) * 2 + 3, ok = new Uint8Array(n * n);
    const inG = (i, j) => i >= 0 && j >= 0 && i < n && j < n;
    const floorAt = (tx, ty) => { try { return !X.blocked(tx + 0.5, ty + 0.5, 0.05, 0); } catch (e) { return false; } };
    const expAt = (tx, ty) => { try { return X.isExp ? X.isExp(tx + 0.5, ty + 0.5) : true; } catch (e) { return true; } };
    const sight = (tx, ty) => { try { return X.los ? X.los(cx, cy, tx + 0.5, ty + 0.5) : true; } catch (e) { return true; } };
    const good = (i, j) => { const tx = x0 + i, ty = y0 + j; return Math.hypot(tx + 0.5 - cx, ty + 0.5 - cy) <= R && floorAt(tx, ty) && expAt(tx, ty) && sight(tx, ty); };
    const si = Math.floor(cx) - x0, sj = Math.floor(cy) - y0, Q = [];
    if (inG(si, sj) && floorAt(si + x0, sj + y0) && expAt(si + x0, sj + y0)) { ok[sj * n + si] = 1; Q.push(si, sj); }
    for (let h = 0; h < Q.length; h += 2) { const i = Q[h], j = Q[h + 1];
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (!inG(a, b) || ok[b * n + a]) continue; if (good(a, b)) { ok[b * n + a] = 1; Q.push(a, b); } else ok[b * n + a] = 2; } }
    const has = (i, j) => inG(i, j) && ok[j * n + i] === 1;
    const tiles = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { if (!has(i, j)) continue;
      const m = (has(i - 1, j) ? 0 : 1) | (has(i + 1, j) ? 0 : 2) | (has(i, j - 1) ? 0 : 4) | (has(i, j + 1) ? 0 : 8) | (has(i - 1, j - 1) ? 0 : 16) | (has(i + 1, j - 1) ? 0 : 32) | (has(i - 1, j + 1) ? 0 : 64) | (has(i + 1, j + 1) ? 0 : 128);
      const x = x0 + i + 0.5, y = y0 + j + 0.5; tiles.push({ i, j, x, y, m, d: Math.hypot(x - cx, y - cy) }); }
    const on = (x, y) => has(Math.floor(x) - x0, Math.floor(y) - y0);
    return { x0, y0, n, has, on, tiles, cx, cy };
  }
  /* ---- the 2D picture's branches (no GPU painter): five main branches out to R with forks, as polylines in tiles from the impact,
     each cut where it leaves the floor ---- */
  function branches2D(W, cx, cy, R, seed) {
    const out = [], grow = (x, y, a, len, depth, k) => { const pts = [[x, y]]; let px = x, py = y, aa = a; const n = Math.max(3, Math.round(len / 0.35));
      for (let i = 1; i <= n; i++) { aa += (R1(seed + k * 7.1 + i * 3.3) - 0.5) * 0.7; px += Math.cos(aa) * len / n; py += Math.sin(aa) * len / n; if (!W.on(cx + px, cy + py) || Math.hypot(px, py) > R) break; pts.push([px, py]);
        if (depth < 2 && i > 1 && R1(seed + k * 1.9 + i * 5.7) > 0.72) grow(px, py, aa + (R1(seed + i + k) > 0.5 ? 0.7 : -0.7), len * 0.45, depth + 1, k * 3 + i); }
      if (pts.length > 1) out.push({ pts, depth }); };
    for (let i = 0; i < 5; i++) grow(0, 0, i / 5 * TAU + seed, R, 0, i + 1);
    return out;
  }
  /* ---- the choreography: tracks of the dragon's pose (keys: [time, value], smooth between) ---- */
  function keys(K, t) { if (t <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const a = K[i - 1], b = K[i], v = (t - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], v * v * (3 - 2 * v)); } return K[K.length - 1][1]; }
  const TR = {   // (v454 TM2: the serpent's swim, its rearing roar, its head-first dive)
    neck: [[0, 0.5], [1.3, 0.5], [1.55, 0.9], [2.22, 0.9], [2.44, 0.2], [2.85, 0.0]],
    head: [[0, -0.25], [1.3, -0.25], [1.55, 0.25], [2.22, 0.28], [2.44, -0.4], [2.85, -0.15]],
    jaw: [[0, 0.25], [1.42, 0.25], [1.62, 0.8], [2.16, 0.78], [2.42, 0.35], [2.85, 0.5]],
    pitch: [[0, 0.05], [1.3, 0.05], [1.55, 0.3], [2.22, 0.32], [2.46, -0.25], [2.66, -0.95], [2.85, -1.0]],
    arch: [[0, 0.0], [1.5, -0.3], [2.22, -0.3], [2.46, 0.2], [2.85, 0.1]],
    tail: [[0, 0.4], [1.5, 0.6], [2.22, 0.55], [2.46, 0.2], [2.85, 0.1]],
    wave: [[0, 0.9], [1.3, 0.9], [1.55, 0.62], [2.22, 0.62], [2.46, 0.28], [2.85, 0.16]],
    waveL: [[0, 0.2], [2.22, 0.2], [2.6, 0.06]],
    sail: [[0, 1], [2.22, 1], [2.46, 0.72], [2.85, 0.55]],
    flut: [[0, 1], [1.4, 1], [1.6, 1.3], [2.22, 1.3], [2.46, 0.8], [2.85, 0.6]],
    reach: [[0, 0.3], [2.25, 0.3], [2.46, 0.7], [2.75, 1]],
    hind: [[0, 0.1], [2.3, 0.15], [2.62, 0.4]],
  };
  /* the pose at time t, the root (the chest) relative to the impact point: S.H the hover, S.Rimp the chest at the impact */
  function poseAt(S, t) {
    const P = { k: TUNE.size, yaw: S.yaw, t, waveF: t * 0.85, tailT: 0.25 * Math.sin(t * 1.2), roll: 0.05 * Math.sin(t * 1.3) };
    for (const k in TR) P[k] = keys(TR[k], t);
    const roarW = sstep(TUNE.roar - 0.1, TUNE.roar + 0.25, t) * (1 - sstep(TUNE.fold, TUNE.fold + 0.18, t));
    P.head += 0.04 * Math.sin(t * 23) * roarW;   // (a tremble as it roars)
    const H = S.H, back = [-Math.cos(S.yaw), -Math.sin(S.yaw)];
    let x = H.x, y = H.y, z = H.z + 0.15 * Math.sin(t * 2.6) + 0.3 * roarW;
    if (t >= TUNE.fold) { const w = sstep(TUNE.fold, TUNE.dive, t); x += back[0] * 0.3 * w; y += back[1] * 0.3 * w; z += 0.35 * w; }   // (it gathers itself: back and up)
    if (t >= TUNE.dive) { const u = cl((t - TUNE.dive) / (TUNE.impact - TUNE.dive)), e = Math.pow(u, 1.6), sx = H.x + back[0] * 0.3, sy = H.y + back[1] * 0.3, sz = H.z + 0.35; x = lerp(sx, S.Rimp.x, e); y = lerp(sy, S.Rimp.y, e); z = lerp(sz, S.Rimp.z, e); }
    if (t >= TUNE.impact) { const e = eo((t - TUNE.impact) / 0.2); x = S.Rimp.x; y = S.Rimp.y; z = S.Rimp.z - 0.9 * e; }   // (it plunges on into the ground)
    P.x = x; P.y = y; P.z = z; return P;
  }

  U.tiamat = (C, h) => {
    const H = h, K = TK.bind(H), PAL = K.P, me = H.me, X = H.X, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, DK = C.base * (C.K || 1) * (1 + 0.08 * (ev - 1));
    const NP = TUNE.pulses[tier - 1], g0 = H.g, G = TG();
    me.castT = me.castM = TUNE.gesture;   // (a short gesture: the game's cast pose, cut to it)
    X.banner('TIAMAT', '', C.col, 1.4); if (X.sfx.hum) X.sfx.hum(); if (X.sfx.crack) X.sfx.crack();
    // the impact point on the floor (the aimed monster, else ahead)
    let T = H.walk(C.tx, C.ty); if (!isFinite(T.x) || !isFinite(T.y)) T = { x: me.x, y: me.y };
    let W = floorMap(H, T.x, T.y, TUNE.patR); if (!W.tiles.length) { T = { x: me.x, y: me.y }; W = floorMap(H, T.x, T.y, TUNE.patR); }
    // where it hovers: behind the impact (facing it, turned a little toward the pet's side, mostly toward the viewer), kept in the camera's view
    const side = me.x <= T.x ? 1 : -1, yaw = side > 0 ? 0.4 : Math.PI - 0.4;   // (v454 TM2: in profile, turned a little toward the viewer: the serpent's curves and its sail read best from the side)
    let back = TUNE.hoverBack, hz = TUNE.hoverZ;
    // (how far its raised wings and head reach up the screen above the chest in the roar: measured on the pose itself)
    let need = 3.1, xL = -3, xR = 3; try { if (G) { const P = poseAt({ yaw, H: { x: 0, y: 0, z: 0 }, Rimp: { x: 0, y: 0, z: 0 } }, 1.9); P.x = P.y = P.z = 0; const A = G.pose(P); let m = 0; xL = 0; xR = 0; for (const q of A.sail.concat(A.pec, A.tailTips, [A.head, A.snout, A.horns[0], A.horns[1], A.tail])) { m = Math.max(m, -(q[1] - 0.9 * q[2])); xL = Math.min(xL, q[0]); xR = Math.max(xR, q[0]); } need = m + 0.2; } } catch (e) {}   // (and its reach left and right)
    try { const Tz = X.Tz(), Hh = (typeof arc !== 'undefined' && arc.H) || 844, top = me.y - (H.sy(me.y) - Hh / 2) / Tz - Hh / 2 / Tz / TUNE.zoomOut;
      for (let i = 0; i < 16; i++) { const yTop = T.y - Math.sin(yaw) * back - 0.9 * hz - need; if (yTop >= top + 0.3) break; if (back > 0.7) back -= 0.3; else if (hz > 2.4) hz -= 0.2; else break; } } catch (e) {}
    let hx = -Math.cos(yaw) * back;
    try { const Tz = X.Tz(), Ww = (typeof arc !== 'undefined' && arc.W) || 390, cx = me.x - (H.sx(me.x) - Ww / 2) / Tz, hw = Ww / 2 / Tz / TUNE.zoomOut - 0.3;   // (moved sideways, toward the middle of the view, while its wings would leave it; at most 3 tiles)
      const lo = cx - hw - (T.x + xL), hi = cx + hw - (T.x + xR); let sh = 0; if (lo > hi) sh = (lo + hi) / 2 - hx; else if (hx < lo) sh = lo - hx; else if (hx > hi) sh = hi - hx; hx += Math.max(-3, Math.min(3, sh)); } catch (e) {}
    const S = { T, W, tier, ev, NP, yaw, H: { x: hx, y: -Math.sin(yaw) * back, z: hz }, Rimp: { x: 0, y: 0, z: 0.5 } };
    // the chest at the impact: the dive's pose with its head on the strike point (v454 TM2: head first)
    if (G) { const P = poseAt(Object.assign({}, S, { H: { x: 0, y: 0, z: 0 } }), TUNE.impact - 1e-4); P.x = P.y = P.z = 0; const A = G.pose(P), f = A.snout; S.Rimp = { x: -f[0], y: -f[1], z: Math.max(0.3, -f[2]) }; }
    const tP = k => TUNE.impact + TUNE.pulseGap * (k + 1), tEnd = tP(NP - 1) + TUNE.patR / TUNE.pulseV, LIFE = tEnd + TUNE.fade + 0.1;
    const rec = { T: { x: T.x, y: T.y }, tier, ev, DK, pulses: NP, hits: [], impactT: TUNE.impact, tP: Array.from({ length: NP }, (_, k) => tP(k)), life: LIFE, tiles: W.tiles.length, abort: null, impactN: 0, hover: S.H };
    LAST = rec;
    const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj;
    const onFloor = m => W.on(m.x, m.y) || W.on(m.x + m.r * 0.7, m.y) || W.on(m.x - m.r * 0.7, m.y) || W.on(m.x, m.y + m.r * 0.7) || W.on(m.x, m.y - m.r * 0.7);
    const seed = R1(T.x * 3.1 + T.y * 7.7 + ev), colSeed = (() => { const r = Math.round(TUNE.patR / 8 * 255), g = Math.round(seed * 255), hx = v => (v < 16 ? '0' : '') + v.toString(16); return '#' + hx(Math.min(255, r)) + hx(g) + 'FF'; })();
    const BR2 = branches2D(W, T.x, T.y, TUNE.patR, seed * 6.2);
    // the state
    let struck = false, aborted = -1, anc = null, PZ = null; const impactHit = new Map(), pulseHit = Array.from({ length: NP }, () => new Map()), pulsePrev = new Array(NP).fill(-1);
    const trail = [], TRN = 12; let trailN = 0;
    const pulseR = (k, t) => (t < tP(k) ? -1 : Math.min(TUNE.patR, (t - tP(k)) * TUNE.pulseV));
    const tq = t => (aborted >= 0 ? Math.min(t, aborted) : t);   // (the pose stops where the caster fell)
    const disOf = t => (aborted >= 0 ? cl((t - aborted) / 0.5) : t < TUNE.impact ? 0 : cl((t - TUNE.impact - 0.04) / TUNE.breakup));
    const groundA = t => (aborted >= 0 ? 1 - cl((t - aborted) / 0.5) : 1 - cl((t - tEnd) / TUNE.fade));
    function strike(f) {
      struck = true; let n = 0;
      for (const m of H.living()) { if (!valid(m) || impactHit.has(m) || !onFloor(m) || Math.hypot(m.x - T.x, m.y - T.y) > TUNE.impactR + m.r) continue; impactHit.set(m, 1); n++;
        X.hitMon(m, TUNE.impactK * DK, C.dmgO(m.boss ? {} : { stun: TUNE.stun })); rec.hits.push({ k: 'impact', t: f.t, id: H.mons.indexOf(m), boss: !!m.boss }); }
      rec.impactN = n;
      X.shake(TUNE.shake, 0.4); if (X.hitstop) X.hitstop(0.06); X.flash(0.3, '#D6DEFF'); X.light(T.x, T.y, 9, 0.5);
      if (X.sfx.crash) X.sfx.crash(); if (X.sfx.crack) X.sfx.crack(); if (X.sfx.thud) X.sfx.thud();
      if (H.g && TUNE.zoom > 1) { H.g.zoomP = TUNE.zoom * TUNE.zoomOut; H.g.zoomT = TUNE.zoomT; }
      K.sparks(T.x, T.y, Math.round(TUNE.sparks * (lowFx() ? 0.4 : 1)), 9, { up: 4 }); K.motes(T.x, T.y, lowFx() ? 5 : 12);
    }
    function abort(f) { if (aborted >= 0) return; aborted = f.t; rec.abort = f.t; f.life = Math.min(f.life, 0.75); }
    const F = H.add({ key: 'tiamat', life: LIFE, x: T.x, y: T.y, S, rec,
      update(dt, f) {
        const t = f.t;
        if (H.g !== g0 || Math.hypot(me.x - T.x, me.y - T.y) > 45) { f.life = 0; return; }   // (the stage changed under it)
        if ((me.dead || (H.g && H.g.over)) && aborted < 0) abort(f);
        if (aborted < 0) {
          // the hits: the impact once (one Map for the whole event), then each pulse's front swept over the monsters (each pulse each monster once)
          if (!struck && t >= TUNE.impact) strike(f);
          for (let k = 0; k < NP; k++) { const r = pulseR(k, t); if (r < 0 || pulsePrev[k] >= TUNE.patR) { pulsePrev[k] = Math.max(pulsePrev[k], r); continue; } const r0 = pulsePrev[k] < 0 ? 0 : pulsePrev[k];
            for (const m of H.living()) { if (!valid(m) || pulseHit[k].has(m)) continue; const d = Math.hypot(m.x - T.x, m.y - T.y);
              if (d - m.r <= r && d + m.r >= r0 - TUNE.pulseBand && d <= TUNE.patR + m.r && onFloor(m)) { pulseHit[k].set(m, 1); X.hitMon(m, TUNE.pulseK * DK, C.dmgO(m.boss ? {} : { stun: TUNE.pulseStun })); rec.hits.push({ k: 'pulse' + k, t, id: H.mons.indexOf(m), boss: !!m.boss }); } }
            if (pulsePrev[k] < 0) { X.shake(3, 0.12); if (X.sfx.crack) X.sfx.crack(); X.light(T.x, T.y, 6, 0.25); K.sparks(T.x, T.y, lowFx() ? 4 : 9, 7, { up: 2 }); }
            pulsePrev[k] = r; }
          // the cues: the forks' crackle, the formation, the roar's thunder roll, the dive's rush
          if (!S._fk && t >= 0.05) { S._fk = 1; if (X.sfx.whoosh) X.sfx.whoosh(); }
          if (!S._fm && t >= TUNE.forks - 0.1) { S._fm = 1; X.shake(2, 0.15); if (X.sfx.crack) X.sfx.crack(); }
          if (!S._ro && t >= TUNE.roar) { S._ro = 1; X.shake(4, 0.6); if (X.sfx.crash) X.sfx.crash(); if (X.sfx.hiss) X.sfx.hiss(1.5, 0.16, 210); if (X.sfx.note) { X.sfx.note(55, 1.4, 'sawtooth', 0.06, 38); X.sfx.note(41, 1.6, 'triangle', 0.08, 30, 0.12); } }   // (a deep thunder roll)
          if (!S._dv && t >= TUNE.dive) { S._dv = 1; if (X.sfx.whoosh) X.sfx.whoosh(); }
          if (!S._zo && t >= TUNE.gesture && H.g && TUNE.zoomOut < 1) { S._zo = 1; if (!(H.g.zoomT > 0) || H.g.zoomP >= 1) { H.g.zoomP = TUNE.zoomOut; H.g.zoomT = TUNE.impact - t; } }   // (pulled back a little while it flies)
          if (t > TUNE.form0 && t < TUNE.impact && anc && Math.random() < dt * 9 * H.Q()) { const sp = anc.spine[Math.floor(Math.random() * anc.spine.length)]; K.aura(T.x + sp.p[0], T.y + sp.p[1], 0.3, dt, 6, sp.p[2] * 0.9); }   // (charged air shed from the body, few)
        }
      },
      onEnd() { S.done = true; trail.length = 0; BR2.length = 0; },
      drawFloor(c, f, Xs, Ys, Tz) { try { floorPass(c, f, Tz); } catch (e) { if (!S._ef) { S._ef = 1; try { console.warn('Tiamat floor', e); } catch (e2) {} } } },
      // the dragon and its light in the sky pass (20b: after the darkness and the fog, a creature of light is never dimmed by them; under the monsters' shots and rings)
      drawSky(c, f, Xs, Ys, Tz) { try { dragonPass(c, f); } catch (e) { if (!S._ew) { S._ew = 1; try { console.warn('Tiamat dragon', e); } catch (e2) {} } }
        try { overPass(c, f, Tz); } catch (e) { if (!S._eo) { S._eo = 1; try { console.warn('Tiamat fx', e); } catch (e2) {} } } } });

    /* ================= drawing ================= */
    const sx = H.sx, sy = H.sy, wsx = p => sx(T.x + p[0]), wsy = p => sy(T.y + p[1]) - p[2] * 0.9 * X.Tz();   // (a model point, tiles from the impact, on the screen)
    const formOf = t => lerp(0, 1.5, cl((t - TUNE.form0) / (TUNE.form1 - TUNE.form0)));
    const chargeOf = t => (t < TUNE.charge0 ? 0 : t < TUNE.charge1 ? lerp(0.02, 1.05, (t - TUNE.charge0) / (TUNE.charge1 - TUNE.charge0)) : 1.15);
    /* the floor: the light pooled under the hovering dragon, the branching pattern spreading from the strike, the strike's flare, the pulses */
    function floorPass(c, f, Tz) {
      const t = f.t, ga = groundA(t); if (!(ga > 0.01)) return;
      const Q = K.gpuBegin(c, '__TM_FX'), h2 = Tz / 2;
      if (Q) {
        if (anc && t < TUNE.impact + 0.3) { const ch = chargeOf(tq(t)), a = cl((t - TUNE.form0) / 0.4) * (t < TUNE.impact ? 1 : 1 - cl((t - TUNE.impact) / 0.3)), p = anc.spine[Math.floor(anc.spine.length * 0.3)].p, rz = Math.max(0, p[2]);
          Q.glow(sx(T.x + p[0]), sy(T.y + p[1]), Tz * (2.6 + 0.2 * rz), '#5A5CFF', a * (0.1 + 0.06 * ch) / (1 + rz * 0.12)); }   // (its blue-violet light on the floor below it)
        if (struck && aborted < 0 || (aborted > TUNE.impact)) {
          const e = t - TUNE.impact, Rs = Math.min(63.5, TUNE.patR * eo(e / TUNE.spread) + 0.01), pk = Math.max(0, 1 - e / 0.5);
          for (const tl of W.tiles) { if (tl.d - 0.8 > Rs) continue; Q.quad(379, sx(tl.x), sy(tl.y), h2, 0, 0, h2, '#120C38', ga * 0.8, tl.x - T.x, tl.y - T.y, tl.m * 64 + Rs); }   // (a deep indigo shade under it, so its light reads on a pale floor)
          for (const tl of W.tiles) { if (tl.d - 0.8 > Rs) continue; Q.quad(376, sx(tl.x), sy(tl.y), h2, 0, 0, h2, colSeed, ga * (0.72 + 0.28 * pk), tl.x - T.x, tl.y - T.y, tl.m * 64 + Rs); }
          if (e < 0.4) { const r = TUNE.impactR * eo(e / 0.16); for (const tl of W.tiles) { if (Math.abs(tl.d - r) > 1.4) continue; Q.quad(377, sx(tl.x), sy(tl.y), h2, 0, 0, h2, colSeed, ga * (1 - e / 0.4), tl.x - T.x, tl.y - T.y, tl.m * 64 + Math.min(63.5, r)); } }
          for (let k = 0; k < NP; k++) { const r = aborted >= 0 ? -1 : pulseR(k, t); if (r < 0) continue; const a = (1 - sstep(0.75 * TUNE.patR, TUNE.patR + 0.3, r)) * Math.min(1, (t - tP(k)) / 0.05) + (r >= TUNE.patR ? 0 : 0); if (a < 0.02) continue;
            for (const tl of W.tiles) { if (Math.abs(tl.d - r) > 1.5) continue; Q.quad(377, sx(tl.x), sy(tl.y), h2, 0, 0, h2, colSeed, ga * a, tl.x - T.x, tl.y - T.y, tl.m * 64 + Math.min(63.5, r)); } } }
        K.gpuEnd(c); return; }
      // ---- 2D: the branches as bolts over the floor, the pulses brightening them where their fronts are ----
      if (anc && t < TUNE.impact) { const p = anc.spine[Math.floor(anc.spine.length * 0.3)].p; K.glow(c, sx(T.x + p[0]), sy(T.y + p[1]), Tz * 2.4, '#5A5CFF', 0.12 * cl((t - TUNE.form0) / 0.4)); }
      if (!struck) return; const e = t - TUNE.impact, Rs = TUNE.patR * eo(e / TUNE.spread);
      let front = -9; for (let k = 0; k < NP; k++) { const r = aborted >= 0 ? -1 : pulseR(k, t); if (r >= 0 && r < TUNE.patR) front = r; }
      for (const b of BR2) { const pts = []; for (const q of b.pts) { if (Math.hypot(q[0], q[1]) > Rs) break; pts.push([sx(T.x + q[0]), sy(T.y + q[1])]); } if (pts.length < 2) continue;
        const mid = b.pts[Math.floor(b.pts.length / 2)], dd = Math.hypot(mid[0], mid[1]), lit = front >= 0 ? Math.exp(-(((dd - front) / 1.2) ** 2)) : 0;
        K.bolt(c, pts, Math.max(0.8, Tz * (0.05 - 0.012 * b.depth)) * (1 + lit), ga * (0.55 + 0.45 * lit + (e < 0.3 ? 0.4 * (1 - e / 0.3) : 0))); }
    }
    /* the dragon itself, on GLM or painted (in the sky pass: over everything on the ground, as it flies over it) */
    function dragonPass(c, f) {
      const t = f.t, Gd = TG(); if (!Gd || t < TUNE.form0 - 0.02) { anc = null; return; }
      const dis = disOf(t); if (dis >= 0.999) { anc = null; return; }
      const tt = tq(t), P = poseAt(S, tt); PZ = P; anc = Gd.pose(P);
      const Tz = X.Tz(), ch = chargeOf(tt), flashK = (struck ? Math.max(0, 1 - (t - TUNE.impact) / 0.15) : 0) + Math.max(0, 1 - Math.abs(t - TUNE.form1) / 0.12) * 0.35;
      // see-through where it would hide the pet's sprite or an enemy's warning (the player's view kept)
      let al = 1; const near = (X0, Y0, R) => { for (const s of anc.spine) { if (s.p[2] > -0.1 && Math.hypot(wsx(s.p) - X0, wsy(s.p) - Y0) < R + s.r * Tz) return true; } return false; };   // (its body over the point: the wings are see-through already)
      if (!me.dead && near(sx(me.x), sy(me.y) - Tz * 0.5, Tz * 0.5)) al = 0.6;
      for (const z of (X.zones || [])) { if (z.kind !== 'warn' || z.own === 'pet' || al < 0.75) continue; if (!z.shape && near(sx(z.x), sy(z.y), Math.min(2, z.r || 1) * Tz)) { al = 0.72; break; } }
      const o = { X0: sx(T.x), Y0: sy(T.y), k: Tz, t: t + 5, glow: 1 + 0.6 * cl(ch), glow2: flashK, form: formOf(t), charge: ch, dis, clip: tt > TUNE.dive, alpha: al, jaw: P.jaw };
      // (the trail: the chest's last screen points, sampled as it dives)
      if (tt >= TUNE.dive - 0.05 && tt <= TUNE.impact + 0.05) { const q = [wsx(anc.chest), wsy(anc.chest)]; if (!trail.length || Math.hypot(q[0] - trail[trail.length - 1][0], q[1] - trail[trail.length - 1][1]) > 2) { trail.push(q); trailN++; if (trail.length > TRN) trail.shift(); } }
      if (!glOff() && Gd.usable() && Gd.draw(c, o)) return;
      Gd.draw2D(c, o);
    }
    /* over everything: the converging forks, the arcs between its horns, claws and wing joints, the charge running up it and gathering
       in its jaws, the dive's trail, the impact's discharge and flash, the outline breaking into arcs */
    function overPass(c, f, Tz) {
      const t = f.t, low = lowFx(), Q = K.gpuBegin(c, '__TM_FX'), tt = tq(t), hz = S.H.z, HX = sx(T.x + S.H.x), HY = sy(T.y + S.H.y) - hz * 0.9 * Tz;
      // the forks: from high round the hover point, each running in to it (re-grown 15 times a second)
      if (t < TUNE.forks + 0.12 && aborted < 0) { const nF = low ? 3 : TUNE.nForks, u = eo(t / TUNE.forks), fs = Math.floor(t * 15);
        for (let i = 0; i < nF; i++) { const a = i / nF * TAU + 0.4 + seed, x0 = HX + Math.cos(a) * Tz * 4.6, y0 = HY - Tz * (3.2 + 1.4 * R1(i + seed)) + Math.sin(a) * Tz * 1.6, x1 = lerp(x0, HX, u), y1 = lerp(y0, HY, u);
          K.arc(c, x0, y0, x1, y1, fs * 7 + i * 31, Math.max(1.2, Tz * 0.07), 0.9 * (1 - cl((t - TUNE.forks) / 0.12)), { forks: low ? 0 : 2 }); }
        if (t > TUNE.forks - 0.15) { const k = 1 - cl(Math.abs(t - TUNE.forks + 0.05) / 0.12); K.glow(c, HX, HY, Tz * 2.4, PAL.cyan, 0.7 * k); if (Q) Q.star(HX, HY, Tz * 1.6, 0.8 * k, '#FFFFFF'); } }
      if (anc && aborted < 0 && tt < TUNE.impact) {
        const ch = chargeOf(tt), crk = cl((tt - TUNE.form1 + 0.1) / 0.3) * (1 - sstep(TUNE.dive - 0.1, TUNE.dive + 0.1, tt)), fs = Math.floor(t * 15), A = anc;
        // the violet arcs (a few, bounded): between the crest spines, the claws, the fin-wings, along the sail's crest, the tail fin's lobes
        if (crk > 0.02) { const sl = A.sail, pairs = [[A.horns[0], A.horns[1]], [A.fore[0], A.fore[1]], [A.pec[0], A.pec[1]], sl.length > 2 ? [sl[1], sl[2]] : [A.hindC[0], A.hindC[1]], [A.tailTips[0], A.tailTips[1]]].slice(0, low ? 2 : TUNE.arcs);
          pairs.forEach(([p, q], i) => { if (R1(fs * 3.7 + i) < 0.22) return; const x0 = wsx(p), y0 = wsy(p), x1 = wsx(q), y1 = wsy(q), L = Math.hypot(x1 - x0, y1 - y0); const pts = K.path(x0, y0, x1, y1, fs * 13 + i * 7, Math.min(Tz * 0.4, L * 0.25), 6);
            const a = crk * (0.55 + 0.45 * cl(ch)); if (!K.plasmaPts(c, pts, Math.max(1, Tz * 0.05), a, { col: '#8A5CFF', seed: fs + i, heat: 0.8 })) K.bolt(c, pts, Math.max(0.8, Tz * 0.035), a); }); }
        // the charge: an orb of light running up the spine with the front, then gathering in the jaws
        if (ch > 0.01 && ch < 1.1) { const s = 1 - Math.min(1, ch), i = Math.max(0, Math.min(A.spine.length - 1, Math.round(s * (A.spine.length - 1)))), p = ch >= 1 ? A.mouth : A.spine[i].p; K.glow(c, wsx(p), wsy(p), Tz * 0.9, PAL.cyan, 0.65); K.orb(c, wsx(p), wsy(p), Tz * 0.16, t, 3, 0.9); }
        if (tt > TUNE.charge1 - 0.15 && tt < TUNE.dive + 0.1) { const g = cl((tt - TUNE.charge1 + 0.15) / 0.3) * (1 - cl((tt - TUNE.fold) / 0.3) * 0.5); K.glow(c, wsx(A.mouth), wsy(A.mouth), Tz * 1.3 * g, PAL.blue, 0.6 * g); K.orb(c, wsx(A.mouth), wsy(A.mouth), Tz * 0.28 * g, t, 5, g); }
        // selective bloom: the eyes, a soft halo round the chest
        for (const e of A.eyes) K.glow(c, wsx(e), wsy(e), Tz * 0.32, '#C9B4FF', 0.5 * cl(formOf(t) - 0.4));
        K.glow(c, wsx(A.chest), wsy(A.chest), Tz * 2.0, PAL.blue, 0.1 * cl(formOf(t) - 0.2) * (1 + 0.6 * cl(ch))); }
      // (v454 TM2) its whiskers: two long tendrils of electricity trailing from the snout, swaying (drawn while it is whole)
      if (anc && aborted < 0 && tt < TUNE.impact + 0.05) { const A = anc, Fh = A.Fh, kk = A.K, fa = cl(formOf(t) - 0.6), ch = chargeOf(tt);
        if (fa > 0.02) for (let k = 0; k < 2; k++) { const sg = k ? -1 : 1, r = A.whisk[k], pts = [[wsx(r), wsy(r)]];
          for (let i = 1; i <= 8; i++) { const sw = 0.14 * Math.sin(t * 3.1 + i * 0.75 + k * 1.7) * i / 8, dn = -0.06 * i - 0.025 * i * i * 0.3, q = [r[0] + (-Fh.x[0] * 0.3 * i + Fh.y[0] * sg * (0.05 * i + sw) + Fh.z[0] * dn) * kk, r[1] + (-Fh.x[1] * 0.3 * i + Fh.y[1] * sg * (0.05 * i + sw) + Fh.z[1] * dn) * kk, r[2] + (-Fh.x[2] * 0.3 * i + Fh.y[2] * sg * (0.05 * i + sw) + Fh.z[2] * dn) * kk]; pts.push([wsx(q), wsy(q)]); }
          const a = fa * (0.75 + 0.25 * cl(ch)); if (!K.plasmaPts(c, pts, Math.max(1, Tz * 0.045), a, { col: '#C46BFF', seed: k * 3 + Math.floor(t * 12), heat: 0.8, taper: 0.7 })) K.bolt(c, pts, Math.max(0.8, Tz * 0.03), a); } }
      // the dive's trail
      if (trail.length > 1 && tt < TUNE.impact + 0.25 && aborted < 0) { const a = tt < TUNE.impact ? 0.85 : 0.85 * (1 - (tt - TUNE.impact) / 0.25); K.ribbon(c, trail, Math.max(2, Tz * 0.55), a); }
      // the impact: the discharge, a short flash, the arcs bursting off it
      if (struck && aborted < 0) { const e = t - TUNE.impact, X0 = sx(T.x), Y0 = sy(T.y);
        if (e < 0.5) { if (Q) Q.quad(378, X0, Y0 - Tz * 0.5, TUNE.impactR * Tz * 1.15, 0, 0, TUNE.impactR * Tz * 1.15, '#FFFFFF', 1, e / 0.5, seed, tier);
          else K.glow(c, X0, Y0 - Tz * 0.5, TUNE.impactR * Tz * (0.6 + 0.6 * eo(e / 0.5)), PAL.cyan, 0.8 * (1 - e / 0.5)); }
        if (e < 0.12) { K.glow(c, X0, Y0 - Tz * 0.4, Tz * 3.6, '#EEF2FF', 0.55 * (1 - e / 0.12)); if (K.flareStar(c, X0, Y0 - Tz * 0.4, Tz * 1.4, 1 - e / 0.12, 0.3)) {} }
        if (e < 0.35) { const n = low ? 3 : 5, fs = Math.floor(t * 15); for (let i = 0; i < n; i++) { const a = i / n * TAU + seed * 3, L = TUNE.impactR * Tz * (0.6 + 0.4 * R1(fs + i)); K.arc(c, X0, Y0 - Tz * 0.4, X0 + Math.cos(a) * L, Y0 - Tz * 0.4 + Math.sin(a) * L * 0.7, fs * 11 + i, Math.max(1, Tz * 0.06), 0.9 * (1 - e / 0.35), { forks: 0 }); } } }
      // the break-up: its outline as luminous arcs, fading
      if (anc && (struck || aborted >= 0)) { const d0 = aborted >= 0 ? aborted : TUNE.impact, e = t - d0, a = 1 - cl(e / (TUNE.breakup + 0.1)); if (a > 0.02) { const A = anc, fs = Math.floor(t * 15), segs = [];
          for (let i = 4; i < A.spine.length; i += 4) segs.push([A.spine[i - 4].p, A.spine[i].p]);
          for (let i = 1; i < A.sail.length; i++) segs.push([A.sail[i - 1], A.sail[i]]);
          segs.push([A.head, A.horns[0]], [A.head, A.horns[1]], [A.tail, A.tailTips[0]], [A.tail, A.tailTips[1]], [A.spine[3].p, A.pec[0]]);
          const nS = low ? Math.ceil(segs.length / 2) : segs.length;
          for (let i = 0; i < nS; i++) { const [p, q] = segs[low ? i * 2 : i]; if (p[2] < -0.05 && q[2] < -0.05) continue; const x0 = wsx(p), y0 = wsy(p), x1 = wsx(q), y1 = wsy(q); K.bolt(c, K.path(x0, y0, x1, y1, fs * 5 + i * 3, Math.min(Tz * 0.3, Math.hypot(x1 - x0, y1 - y0) * 0.2), 5), Math.max(0.8, Tz * 0.045), a * (0.6 + 0.4 * R1(fs + i))); } } }
      K.gpuEnd(c);
    }
    return F;
  };
  U.tiamat.warm = () => { try { const G = TG(); if (G) G.warm(); } catch (e) {} };
  U.tiamat.TUNE = TUNE;
  U.tiamat.lib = { TUNE, floorMap, poseAt, branches2D, get last() { return LAST; } };
})();
