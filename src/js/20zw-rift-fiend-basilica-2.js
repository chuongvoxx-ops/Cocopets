/* ---------- THESSARYM, THE VEIL SERPENT ----------
   The Basilica's second boss, in the Reliquary: a 32-metre circular court of pale calcite flagstones, a ring of black
   basalt round it, two broad stone screens on north–south rails either side of a central lane (the stage's make() in
   20zt2 builds them: X.rift.self.mod.screens, mod.lane).
   Thessarym is an eight-metre snake of seven pale calcite SEGMENTS joined by dark flexible GAPS, a small closed eye in
   each segment; its HEAD is a broad faceted triangle with two hooked side fins and no jaw, and a red VERTICAL EYE at its
   front that opens only while it attacks. It lies coiled in a low ring, so the court stays in view round it.
   Passing Judgement: the coil tightens and four segment eyes (five from half health) open, each showing its NUMBER;
   each casts a narrow gaze LANE (warning red) and they fire in that order, the next one counting down on the floor.
   Step out of a lane before it fires, and cross through it once its eye has closed (a screen's shadow blocks a lane too).
   Unveiling: the head rears, the red eye opens, and a broad frontal BEAM locks onto the pet for 1.5 s, following it;
   then its direction FREEZES (shown) and it fires for 2 s. Pull a screen into its path (one second a stop) and stand in
   its shadow: the screens block its gaze (BAS.inShadow with the eye as the source). A beam fully blocked by a screen is
   turned back on it: the head REELS for 1.5 s (its blows land half again as hard, its red eye twice).
   From half health a TAIL SWEEP runs round the ring while the beam charges: the tail lashes out across the court in a
   full turn; a screen's lee (its shadow from the coil) is safe from it, so the screen placed early shelters from both.
   Weak points: the open red eye (x1.75; x2 while it reels) and any open segment eye (x1.4).
   Between attacks it slithers to another place round the court's rim (never across the central lane) and recoils.
   It is never still: the coil breathes and a ripple runs round it, the head sways, the fins flex, the closed lids
   shiver; it jolts when struck, tightens before Judgement, rears before Unveiling, lifts its tail before the sweep,
   reels, rises out of the floor at its entrance, and dies segment by segment as its eyes close and the stone settles. */
RiftFiend.define({ id: 'thessarym', hpK: 1.25, dmgK: 1.25, name: 'Thessarym', title: 'The Veil Serpent', color: '#D8D1BB', glow: '#E08A7E', accent: '#FFD2C2', biome: 'courtyard', r: 2.4, els: ['earth', 'dark'], phases: 2, cuts: [1, 0.5] }, (() => {
  const { TAU, TN, sorted, hit } = RiftFiend, B = BAS, K = DunFiend.KIT, rgba = TN.rgba;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const lerpA = (a, b, u) => a + angTo(a, b) * u;
  const mix = (a, b, u) => K.mixC(a, b, clamp(u, 0, 1));
  const sfx = (FX, k) => { const f = FX.H && FX.H.sfx && FX.H.sfx[k]; if (f) f(); };
  // the palette: pale calcite stone (three tones and a hot edge), ochre inlay, the dark flexible gaps, the red eye
  const CAL_HI = '#F4EFE0', CAL = '#D8D1BB', CAL_SH = '#B3AB95', CAL_SH2 = '#878070', OCH = '#A18E65', OCH_HI = '#C9B88F', OCH_D = '#6E6046';
  const GAP = '#242428', GAP_HI = '#3C3C45', GAP_SH = '#141416', INK = '#1A1A1E', RED = '#BF675D', RED_HI = '#E08A7E', RED_D = '#8A4640', HOT = '#FFE6D8';
  const WARN = B.WARN, DEAD = '#9C978B', SAFE = '#BFF2D8';
  /* the body (metres): the coil's radius, seven segments' girths, the court's places it lies */
  const AR = B.arena.thessarym.R, RR = 1.75, NS = 7, WK = [1.0, 1.06, 1.06, 1.0, 0.92, 0.82, 0.7], STEP = 0.79, A0 = 0.78;
  const HOME_A = [-Math.PI / 2 - 0.42, -Math.PI / 2 + 0.42, Math.PI / 2 + 0.42, Math.PI / 2 - 0.42], HOME_R = 9.6;
  const LANE_W = 1.3, LANE_L = 27, BEAM_S = 0.34, BEAM_L = 30;
  const L3 = (() => { const v = [-0.55, 0.12, 0.82], l = Math.hypot(...v); return v.map(q => q / l); })(), V3 = [0, Math.SQRT1_2, Math.SQRT1_2];
  const fastK = FX => (1 + (FX.S.phase - 1) * 0.1) * FX.S.fast;
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const ZERO8 = [0, 0, 0, 0, 0, 0, 0, 0];
  // (the rift's own X, for Calcification: the Basilica's context keyed by the game; only in a running fight)
  const riftX = FX => { if (!FX.g || !FX.F || !FX.F.rift) return null; const C = B.ctx({ g: FX.g }); return C && C.X && C.X.me ? C.X : null; };

  return {
    arenaR: AR, carve: B.arena.thessarym.carve, start: B.arena.thessarym.start, firstAct: 'slither', artY: 0.56,
    artPoses: [
      { name: 'coiled, every eye closed', mem: {} },
      { name: 'Passing Judgement: eyes open, numbered', mem: { coil: 1, eyeR: 0.6, segEye: [1, 0, 1, 0, 1, 1, 0], segNum: [2, 0, 1, 0, 4, 3, 0], segNext: 1 } },
      { name: 'Unveiling: reared, the red eye open', mem: { rear: 1, eyeR: 1, fin: 1 } },
      { name: 'tail sweep: the tail lashes out', mem: { rear: 0.8, eyeR: 1, fin: 0.7, tailExt: 1, tailA: 0.5 } },
      { name: 'reeling: its gaze turned back', mem: { reel: 1, eyeR: 0.55, recoil: 0.6 } },
      { name: 'rising out of the floor', mem: { rise: 0.45 } },
      { name: 'stilled: the stone settled', mem: { settle: [1, 1, 1, 1, 1, 1, 1, 1], dead: 1, eyeR: 0 } },
      { name: 'facing away (north)', mem: { hd: -Math.PI / 2 + 0.5, eyeR: 1, rear: 0.5 } }],
    phaseNames: ['The Reliquary', 'The Tail Sweep'],
    props(C) { const out = [], kinds = ['narrowpillar', 'beaststatue', 'narrowpillar', 'stonebanner'], R = mulberry32(9205);
      for (let i = 0; i < 20; i++) { const a = i / 20 * TAU + Math.PI / 20, far = Math.sin(a) < 0.1, s = far ? 1.05 + R() * 0.2 : 0.75; out.push({ kind: kinds[i % 4], v: i, s, x: C.x + Math.cos(a) * (AR + 1.0), y: C.y + Math.sin(a) * (AR + 0.8) }); }
      return out; },
    propKeep: { every: 30, box: p => [-1.6 * p.s, -4.8 * p.s, 1.6 * p.s, 0.6 * p.s] },
    drawProp(c, FX, p, X, Y, T) { const f = DunWorld.PROPS[p.kind]; if (!f) return; c.translate(X, Y); f(c, T * p.s, p.v); },
    paintGround(c, A) { paintFloor(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m; m.noTouch = true; const h = homeP(FX, 0); m.x = h.x; m.y = h.y; m.act = 'enter';
      Object.assign(M, { bt: 0, hd: Math.PI / 2, hdT: Math.PI / 2, dir: 1, rise: 0, coil: 0, coilT: 0, rear: 0, rearT: 0, eyeR: 0, eyeT: 0, fin: 0, finT: 0, recoil: 0, reel: 0, tailExt: 0, tailExtT: 0, tailA: 0, tailLift: 0, spdK: 0, mvA: Math.PI / 2,
        segEye: [0, 0, 0, 0, 0, 0, 0], segEyeT: [0, 0, 0, 0, 0, 0, 0], segNum: [0, 0, 0, 0, 0, 0, 0], segNext: 0, segHit: [0, 0, 0, 0, 0, 0, 0], eyeHit: 0, settle: ZERO8.slice(), home: 0, wait: 1.2, J: null, U: null, SW: null, end: null, nextAct: null, picks: 0, seen: {}, taught: false, roared: false, wasStun: false, stunKind: null, chain: null, marks: [], dust: [],
        stat: { judges: 0, lanes: 0, laneHit: 0, laneMiss: 0, laneShadow: 0, order: [], unveils: 0, beamTicks: 0, beamHit: 0, blocked: 0, reels: 0, sweeps: 0, sweepHit: 0, sweepMiss: 0, sweepShadow: 0, sweepRoll: 0, slithers: 0, homes: [] } });
      solve(m, M, 0, true); },
    phase(FX, p) { const M = FX.mem, m = FX.m; endAll(FX, m, M); m.stunT = 0; M.recoil = 1; M.fin = 1;
      if (p >= 2) FX.H.after(0.9, () => FX.H.banner('THE TAIL SWEEP', 'Now its tail lashes round the ring while the beam charges: place a screen EARLY and keep to its safe side', RED_HI, 3.0, true)); },
    ai(FX, m, dt) { const M = FX.mem, F = fastK(FX); m.actT += dt; m.noTouch = true;
      switch (m.act) {
        case 'slither': slitherStep(FX, m, M, dt, F); break;
        case 'judge': judgeStep(FX, m, M, dt, F); break;
        case 'unveil': unveilStep(FX, m, M, dt, F); break;
        case 'recoil': M.hdT = FX.angPet(m.x, m.y); M.eyeT = 0; M.rearT = 0; if (m.actT > 0.9 / F) startSlither(FX, m, M); break;
        default: startSlither(FX, m, M);
      }
      if (M.SW) sweepStep(FX, m, M, dt);
      weakPts(FX, m, M, false);
      FX.parts(bodyParts(m, M)); },
    stunned(FX, m, dt) { const M = FX.mem; m.noTouch = true; M.eyeT = 0.6; M.rearT = 0; M.coilT = 0; weakPts(FX, m, M, m.stunT > 0.05);
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0 && M.chain) { M.kickT = 0.2 + Math.random() * 0.15; const h = M.chain[0]; FX.H.part({ kind: 'spark', x: h[0] + FX.rnd(-0.5, 0.5), y: h[1] - h[2] - 0.3, vx: FX.rnd(-1.5, 1.5), vy: -1.6, drag: 0.6, life: 0.55, max: 0.55, size: 2.4, color: Math.random() < 0.5 ? RED_HI : CAL_HI }); }
      FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.stat) return; M.bt += dt;
      if (M.end) { stepEnd(FX, m, M, dt); solve(m, M, dt, false); return; }
      const stun = m.stunT > 0;
      if (!stun && M.wasStun) { M.wasStun = false; M.recoil = 0.6; FX.H.text(m.x, m.y - 3.4, 'It gathers its coil again', CAL_HI, 13); sfx(FX, 'whoosh'); M.stunKind = null; } else if (stun) M.wasStun = true;
      // the entrance: the ring rises out of the floor, segment by segment, then its eyes flick open and shut
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.rise = smooth((e - 0.25) / 2.5); if (Math.random() < 0.5 && M.rise < 0.98) dustAt(FX, m.x + FX.rnd(-2.4, 2.4), m.y + FX.rnd(-2, 2), CAL_SH);
        if (e > 0.25 && !M.quake) { M.quake = true; FX.H.shake(8, 1.6); sfx(FX, 'crash'); }
        if (e > 2.6 && !M.roared) { M.roared = true; M.recoil = 0.5; M.fin = 1; M.eyeR = 1; M.segEye = M.segEye.map(() => 1); sfx(FX, 'hum'); FX.H.ring(m.x, m.y, 0.5, 7, 0.8, RED_HI, 0.35); FX.H.shake(10, 0.4); } }
      else M.rise = toward(M.rise, 1, dt, 3);
      // the first lesson, once it slithers
      if (!M.taught && m.act === 'slither') { M.taught = true; m.actT = -2.4; FX.H.banner('THESSARYM', 'Its eyes open only to attack: numbered eyes cast gaze LANES in order · the red eye UNVEILS a beam the SCREENS block. Strike an open eye', RED_HI, 3.4, true); }
      // the eased pose
      M.coil = toward(M.coil, M.coilT, dt, 4); M.rear = toward(M.rear, stun ? 0 : M.rearT, dt, M.rearT > M.rear ? 4 : 2.5); M.fin = toward(M.fin, Math.max(M.finT || 0, M.rear * 0.8), dt, 4);
      M.eyeR = toward(M.eyeR, M.eyeT, dt, M.eyeT > M.eyeR ? 5 : 3);
      for (let i = 0; i < NS; i++) { M.segEye[i] = toward(M.segEye[i], M.segEyeT[i], dt, M.segEyeT[i] > M.segEye[i] ? 7 : 4); M.segHit[i] = decay(M.segHit[i], dt, 4); }
      M.tailExt = toward(M.tailExt, M.tailExtT, dt, M.tailExtT > M.tailExt ? 6 : 3); M.tailLift = toward(M.tailLift, M.tailLiftT || 0, dt, 5);
      M.reel = toward(M.reel, stun && M.stunKind === 'reel' ? 1 : 0, dt, stun ? 6 : 2.5);
      M.recoil = decay(M.recoil, dt, 2.2); M.eyeHit = decay(M.eyeHit, dt, 4); M.finT = decay(M.finT, dt, 1.2);
      if ((m.hitSq || 0) > 0.5) M.recoil = Math.max(M.recoil, 0.3);
      M.hd = lerpA(M.hd, M.hdT == null ? M.hd : M.hdT, Math.min(1, dt * (M.U && M.U.st === 'lock' ? 9 : 3.2)));
      M.marks = M.marks.filter(k => (k.t += dt) < k.life);
      solve(m, M, dt, false); },
    dmgK(FX, m) { const M = FX.mem; if (M) { M.recoil = Math.max(M.recoil || 0, 0.28); if (M.end) return 0; } return m.stunT > 0 && M && M.stunKind === 'reel' ? 1.5 : 1; },
    onWeakHit(FX, key) { const M = FX.mem; if (!M) return; M.recoil = Math.max(M.recoil || 0, 0.5); if (key === 'eye') M.eyeHit = 1; else if (key.slice(0, 3) === 'seg') { const i = +key.slice(3); if (i >= 0 && i < NS) M.segHit[i] = 1; } },
    camFocus(FX, m) { const M = FX.mem, me = FX.me; if (!M || !M.stat || m.dead) return null; if (m.act === 'enter') return { x: m.x, y: m.y - 1, k: 0.5 };
      const x = m.x, y = m.y - 1, d = Math.hypot(x - me.x, y - me.y) || 1; return { x, y, k: Math.min(0.4, 4 / d) }; },
    ending(FX, m) { const M = FX.mem; endAll(FX, null, M); FX.noParts(); weakPts(FX, m, M, false); for (const k in FX.S.weak) FX.weak(k, 0, 0, 0, 0, false);
      M.end = { t: 0, shut: -1 }; M.segEye = M.segEye.map(() => 1); M.segEyeT = M.segEyeT.map(() => 1); M.eyeR = 1; M.eyeT = 1; M.rearT = 0.6; M.segNum = M.segNum.map(() => 0);
      return { title: 'THE SERPENT IS STILLED', sub: 'Thessarym\'s eyes close one by one, and the stone of it settles', col: RED_HI, delay: 4.8, bannerAt: 0.4, fanfareAt: 3.4, quiet: true, slow: 0.6 }; },
    keep: { every: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t) { drawBody(c, FX, m, X, Y + (m.z || 0) * T * 4, T, t); },
    drawObj() {},
    drawFx(c, FX, T, t) { drawAir(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function homeP(FX, i) { const a = HOME_A[i]; return { x: FX.C.x + Math.cos(a) * HOME_R, y: FX.C.y + Math.sin(a) * HOME_R }; }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.4 : 1.2, true); }
  function dustAt(FX, x, y, col) { FX.H.part({ kind: 'smoke', x, y, vx: FX.rnd(-0.6, 0.6), vy: -0.6, drag: 0.8, life: 0.9, max: 0.9, size: 7 + Math.random() * 6, color: col || CAL_SH }); }
  function endAll(FX, m, M) { M.J = null; M.U = null; M.SW = null; M.coilT = 0; M.rearT = 0; M.eyeT = 0; M.tailExtT = 0; M.tailLiftT = 0; M.segEyeT = [0, 0, 0, 0, 0, 0, 0]; M.segNum = [0, 0, 0, 0, 0, 0, 0]; M.segNext = 0;
    if (m) { m.act = 'slither'; m.actT = 0; } }
  function choose(FX, m) { const M = FX.mem; let k = M.nextAct; M.nextAct = null; if (!k) { k = M.picks % 2 === 0 ? 'judge' : 'unveil'; M.picks++; } (k === 'judge' ? startJudge : startUnveil)(FX, m, M); }
  /* ---- between attacks: it slithers to another of its places round the rim (the lane stays clear), then turns to the pet ---- */
  function startSlither(FX, m, M) { const me = FX.me, opts = [0, 1, 2, 3].filter(i => i !== M.home);
    // (it likes a place not too near the pet, so the coil is never on top of it)
    opts.sort((a, b) => (Math.hypot(homeP(FX, b).x - me.x, homeP(FX, b).y - me.y) > 6 ? 1 : 0) - (Math.hypot(homeP(FX, a).x - me.x, homeP(FX, a).y - me.y) > 6 ? 1 : 0) || Math.random() - 0.5);
    M.home = opts[opts.length - 1]; m.act = 'slither'; m.actT = 0; M.wait = (FX.S.phase >= 2 ? 0.8 : 1.2) / FX.S.fast; M.stat.slithers++; M.stat.homes.push(M.home); M.coilT = 0; M.rearT = 0; M.eyeT = 0; }
  function slitherStep(FX, m, M, dt, F) { const h = homeP(FX, M.home), dx = h.x - m.x, dy = h.y - m.y, d = Math.hypot(dx, dy), v = Math.min(3.6 * F, d * 2.2);
    if (d > 0.05) { m.x += dx / d * v * dt; m.y += dy / d * v * dt; M.mvA = Math.atan2(dy, dx); }
    M.spdK = toward(M.spdK, d > 0.4 ? 1 : 0, dt, 4);
    M.hdT = d > 1.2 ? Math.atan2(dy, dx) : FX.angPet(m.x, m.y);
    if (d < 0.2 && m.actT > M.wait) { m.actT = 0; choose(FX, m); } }

  /* ---- Passing Judgement: numbered segment eyes open; their lanes fire in that order ---- */
  function startJudge(FX, m, M) { const me = FX.me, F = fastK(FX), n = FX.S.phase >= 2 ? 5 : 4, order = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5).slice(0, n);
    const ab = Math.atan2(me.y - m.y, me.x - m.x), px = -Math.sin(ab), py = Math.cos(ab), offs = [0, 1.9, -1.9, 0.95, -0.95], P0 = { x: me.x, y: me.y };
    const lanes = order.map((j, k) => { const E = M.chain[j + 1], qx = P0.x + px * offs[k], qy = P0.y + py * offs[k];
      return { k, j, num: k + 1, x: E[0], y: E[1], a: Math.atan2(qy - E[1], qx - E[0]), len: LANE_L, w: LANE_W, openAt: 0.18 * k / F, fireAt: (1.75 + k * 0.85) / F, st: 'wait', t: 0, res: null }; });
    M.J = { t: 0, lanes, n, endT: 0 }; m.act = 'judge'; m.actT = 0; M.coilT = 1; M.eyeT = 0.6; M.stat.judges++; M.spdK = 0; M.hdT = ab; sfx(FX, 'hum');
    say(FX, 'judge', 'PASSING JUDGEMENT', `${n} eyes open, numbered: their gaze lanes fire in that order · step out of each before it fires, cross it once its eye has closed`, RED_HI); }
  function laneIn(L, x, y, rr) { const ca = Math.cos(L.a), sa = Math.sin(L.a), rx = x - L.x, ry = y - L.y, al = rx * ca + ry * sa, of = Math.abs(-rx * sa + ry * ca); return al > 0.4 && al < L.len && of < L.w / 2 + rr; }
  function judgeStep(FX, m, M, dt, F) { const J = M.J; if (!J) { startSlither(FX, m, M); return; } J.t += dt; const me = FX.me;
    let next = null;
    J.lanes.forEach(L => { if (J.t >= L.openAt && L.st === 'wait') { if (!M.segEyeT[L.j]) { M.segEyeT[L.j] = 1; M.segNum[L.j] = L.num; sfx(FX, 'pop'); } }
      if (L.st === 'wait' && !next) next = L;
      if (L.st === 'wait' && J.t >= L.fireAt) fireLane(FX, m, M, L);
      else if (L.st === 'hot') { L.t += dt; if (L.t > 0.3) { L.st = 'closed'; L.t = 0; M.segEyeT[L.j] = 0; M.segNum[L.j] = 0; } }
      else if (L.st === 'closed') L.t += dt; });
    M.segNext = next ? next.num : 0; M.coilT = next ? 1 : 0.3;
    if (J.lanes.every(L => L.st === 'closed')) { J.endT += dt; M.eyeT = 0; if (J.endT > 0.6 / F) { M.J = null; startSlither(FX, m, M); } } }
  function fireLane(FX, m, M, L) { const me = FX.me; L.st = 'hot'; L.t = 0; M.stat.lanes++; M.stat.order.push(L.num); M.finT = 0.6; M.segHit[L.j] = 0.6;
    const inL = laneIn(L, me.x, me.y, me.r * 0.4), shade = inL && B.inShadow(me.x, me.y, { x: L.x, y: L.y, len: L.len });
    if (inL && !shade && !me.dodge && !me.leap && !me.dead) { L.res = 'hit'; M.stat.laneHit++; FX.hurt(m.dmg * 1.0); const RX = riftX(FX); if (RX) B.calcify.add(1, RX); FX.H.text(me.x, me.y - 1.6, 'Judged!', WARN, 13); }
    else { L.res = shade ? 'shadow' : 'miss'; M.stat.laneMiss++; if (shade) { M.stat.laneShadow++; FX.H.text(me.x, me.y - 1.6, 'Hidden from its gaze', SAFE, 12); } }
    sfx(FX, 'crack'); FX.H.shake(3, 0.12); }

  /* ---- Unveiling: the red eye opens, a broad beam locks onto the pet, then FREEZES its direction and fires ---- */
  function headG(M) { const h = M.chain[0]; return { x: h[0], y: h[1] }; }
  function startUnveil(FX, m, M) { const me = FX.me, F = fastK(FX), h = headG(M), a = Math.atan2(me.y - h.y, me.x - h.x), sw = FX.S.phase >= 2;
    M.U = { st: 'open', t: 0, a, src: { x: h.x, y: h.y, a, len: BEAM_L, spread: BEAM_S }, open: 0.6 / F, lock: 1.5 / F, frz: 0.55 / F, fire: 2.0 / F, tk: 0, hit: 0, blockedT: 0, inT: 0, sweep: sw, swGiven: false };
    m.act = 'unveil'; m.actT = 0; M.rearT = 1; M.eyeT = 1; M.hdT = a; M.spdK = 0; M.stat.unveils++; sfx(FX, 'hum');
    say(FX, sw ? 'unveil2' : 'unveil', 'UNVEILING', sw ? 'The beam locks on, then FREEZES · its tail sweeps the ring as it charges: get a screen between you and the coil, and stay in its shadow' : 'Its red eye opens: a broad beam locks onto you, then FREEZES and fires · pull a SCREEN into its path and stand in its shadow', RED_HI); }
  function unveilStep(FX, m, M, dt, F) { const U = M.U; if (!U) { startSlither(FX, m, M); return; } U.t += dt; const me = FX.me, h = headG(M);
    U.src.x = h.x; U.src.y = h.y;
    if (U.st === 'open') { M.hdT = Math.atan2(me.y - h.y, me.x - h.x); U.a = M.hdT; U.src.a = U.a; if (U.t >= U.open) { U.st = 'lock'; U.t = 0; sfx(FX, 'hum'); } }
    else if (U.st === 'lock') { const want = Math.atan2(me.y - h.y, me.x - h.x); U.a += clamp(angTo(U.a, want), -2.8 * dt, 2.8 * dt); U.src.a = U.a; M.hdT = U.a;
      if (U.sweep && !U.swGiven) { U.swGiven = true; startSweep(FX, m, M); }
      if (U.t >= U.lock) { U.st = 'frozen'; U.t = 0; M.finT = 1; sfx(FX, 'crack'); FX.H.shake(4, 0.2); FX.H.text(h.x, h.y - 3.2, 'FROZEN', WARN, 15); } }
    else if (U.st === 'frozen') { M.hdT = U.a; if (U.t >= U.frz) { U.st = 'fire'; U.t = 0; U.tk = 0; sfx(FX, 'crash'); FX.H.shake(7, 0.3); FX.H.flash(0.1, RED_HI); } }
    else if (U.st === 'fire') { M.hdT = U.a; const d = Math.hypot(me.x - U.src.x, me.y - U.src.y), inB = d > 0.6 && B.inCone(me.x, me.y, U.src);
      if (inB && !me.dead) { if (B.inShadow(me.x, me.y, U.src)) U.blockedT += dt; else if (!me.dodge && !me.leap) { U.inT += dt; const RX = riftX(FX); if (RX) B.calcify.see(); U.tk -= dt; if (U.tk <= 0) { U.tk = 0.4; U.hit++; M.stat.beamTicks++; FX.hurt(m.dmg * 0.45); } } }
      if (Math.random() < 0.5) { const k = 2 + Math.random() * 12; FX.H.part({ kind: 'spark', x: U.src.x + Math.cos(U.a) * k, y: U.src.y + Math.sin(U.a) * k, vx: FX.rnd(-1, 1), vy: -1.5, life: 0.4, max: 0.4, size: 2.2, color: RED_HI }); }
      if (U.t >= U.fire) { U.st = 'end'; U.t = 0; M.eyeT = 0.2; M.rearT = 0.2; if (U.hit) M.stat.beamHit++; } }
    else if (U.st === 'end') { if (U.t >= 0.35 / F) { const full = U.hit === 0 && U.blockedT >= U.fire * 0.5; M.U = null; if (full) reel(FX, m, M); else { m.act = 'recoil'; m.actT = 0; } } } }
  /* ---- a beam fully blocked by a screen turns back on it: the head reels ---- */
  function reel(FX, m, M) { M.stat.blocked++; M.stat.reels++; m.stunT = Math.max(m.stunT || 0, 1.5); M.stunKind = 'reel'; m.act = 'recoil'; m.actT = 0; M.recoil = 1; M.eyeHit = 1; M.SW = null; M.tailExtT = 0; M.tailLiftT = 0;
    const h = M.chain[0], first = !M.seen.reel; M.seen.reel = true; FX.H.boom(h[0], h[1] - h[2], 1.1, RED_HI, HOT, { n: 16, shake: 8 }); sfx(FX, 'crash'); sfx(FX, 'crack');
    FX.H.banner('IT REELS!', first ? 'The screen turned its own gaze back on it: strike the open RED EYE (x2) while it reels' : 'It reels: strike the red eye!', RED_HI, first ? 2.4 : 1.3, true); }
  /* ---- the tail sweep (from half health): the tail lashes a full turn round the ring; a screen's lee from the coil is safe ---- */
  function startSweep(FX, m, M) { const me = FX.me, F = fastK(FX), ap = Math.atan2(me.y - m.y, me.x - m.x), dir = Math.random() < 0.5 ? 1 : -1;
    M.SW = { t: 0, show: 0.6 / F, dur: 1.4 / F, a0: ap + Math.PI, dir, cur: ap + Math.PI, prev: ap + Math.PI, x: m.x, y: m.y, done: false, res: null }; M.tailLiftT = 1; M.tailExtT = 0.25; M.tailA = ap + Math.PI; M.stat.sweeps++; sfx(FX, 'whoosh');
    FX.H.text(m.x, m.y - 3.6, 'Its tail lifts...', RED_HI, 13); }
  function sweepStep(FX, m, M, dt) { const S = M.SW, me = FX.me; S.t += dt;
    if (S.t < S.show) { M.tailA = S.a0; return; }
    const u = clamp((S.t - S.show) / S.dur, 0, 1); S.prev = S.cur; S.cur = S.a0 + S.dir * TAU * u; M.tailA = S.cur; M.tailExtT = 1; M.tailLiftT = 0;
    if (!S.res && !me.dead) { const pa = Math.atan2(me.y - S.y, me.x - S.x), d = Math.hypot(me.x - S.x, me.y - S.y), swept = S.dir * angTo(S.a0, pa); const sw0 = S.dir > 0 ? ((S.prev - S.a0) % TAU + TAU) % TAU : ((S.a0 - S.prev) % TAU + TAU) % TAU, s1 = TAU * u, sp = ((swept % TAU) + TAU) % TAU;
      if ((sp > sw0 - 1e-6 && sp <= s1) || u >= 1) { if (d < RR + 0.6) S.res = 'inside'; else if (B.inShadow(me.x, me.y, { x: S.x, y: S.y, len: 22 })) { S.res = 'shadow'; M.stat.sweepShadow++; FX.H.text(me.x, me.y - 1.6, 'The screen takes the lash', SAFE, 12); }
        else if (me.dodge || me.leap) { S.res = 'roll'; M.stat.sweepRoll++; }
        else { S.res = 'hit'; M.stat.sweepHit++; FX.hurt(m.dmg * 1.3); const nx = (me.x - S.x) / (d || 1), ny = (me.y - S.y) / (d || 1); me.push = { vx: nx * 9 - ny * 6 * S.dir, vy: ny * 9 + nx * 6 * S.dir, t: 0.22 }; FX.H.text(me.x, me.y - 1.6, 'The tail sweep!', WARN, 13); FX.H.shake(6, 0.2); }
        if (S.res !== 'hit') M.stat.sweepMiss++; } }
    if (Math.random() < 0.6) { const k = RR + 1 + Math.random() * 3.2; dustAt(FX, S.x + Math.cos(S.cur) * k, S.y + Math.sin(S.cur) * k, CAL_SH); }
    if (u >= 1) { M.SW = null; M.tailExtT = 0; sfx(FX, 'thud'); M.marks.push({ x: S.x, y: S.y, t: 0, life: 2.5, kind: 'sweep' }); } }

  /* ---- weak points: the open red eye, any open segment eye ---- */
  function eyeWorld(M) { const G = headGeo(M); return G.eye3; }
  function weakPts(FX, m, M, reeling) { const W = FX.S.weak;
    if (!M.chain || M.end) { if (W.eye) FX.weak('eye', 0, 0, 0, 0, false); for (let i = 0; i < NS; i++) if (W['seg' + i]) FX.weak('seg' + i, 0, 0, 0, 0, false); return; }
    const on = reeling || M.eyeR > 0.45; if (on) { const e = eyeWorld(M); FX.weak('eye', e[0], e[1] - e[2], 0.72, reeling ? 2.0 : 1.75, true); } else if (W.eye) FX.weak('eye', 0, 0, 0, 0, false);
    for (let i = 0; i < NS; i++) { if (M.segEye[i] > 0.5 && !reeling) { const p = M.chain[i + 1]; FX.weak('seg' + i, p[0], p[1] - p[2] - 0.35, 0.55, 1.4, true); } else if (W['seg' + i]) FX.weak('seg' + i, 0, 0, 0, 0, false); } }
  function bodyParts(m, M) { const S = M.chain; if (!S) return []; const out = [hit('head', S[0], 0.9, m)]; for (let i = 1; i <= NS; i++) out.push(hit('s' + i, S[i], 0.7 * WK[i - 1], m)); return out; }

  /* ---- the ending: segment by segment its eyes close and the stone settles ---- */
  function stepEnd(FX, m, M, dt) { const E = M.end; E.t += dt; M.eyeR = toward(M.eyeR, M.eyeT, dt, 3); M.rear = toward(M.rear, M.rearT, dt, 2); M.reel = decay(M.reel, dt, 2); M.recoil = decay(M.recoil, dt, 2);
    for (let i = 0; i < NS; i++) { const tc = 0.6 + i * 0.36; if (E.t >= tc && M.segEyeT[i]) { M.segEyeT[i] = 0; M.segHit[i] = 1; const p = M.chain[i + 1]; for (let k = 0; k < 3; k++) dustAt(FX, p[0] + FX.rnd(-0.4, 0.4), p[1] + FX.rnd(-0.3, 0.3), CAL_SH); sfx(FX, 'thud'); FX.H.shake(2.5, 0.1); }
      M.segEye[i] = toward(M.segEye[i], M.segEyeT[i], dt, 6); M.settle[i] = toward(M.settle[i], E.t > tc ? 1 : 0, dt, 2.6); }
    const th = 0.6 + NS * 0.36; if (E.t >= th) { if (M.eyeT) { M.eyeT = 0; M.rearT = 0; const h = M.chain[0]; for (let k = 0; k < 5; k++) dustAt(FX, h[0] + FX.rnd(-0.6, 0.6), h[1] + FX.rnd(-0.4, 0.4), CAL_SH); sfx(FX, 'crash'); FX.H.shake(5, 0.3); } M.settle[7] = toward(M.settle[7], 1, dt, 2.2); }
    M.tailExt = decay(M.tailExt, dt, 2); M.coil = decay(M.coil, dt, 2); }

  /* ---------- the body: target places for the head, the seven segments and the tail tip, each easing behind ---------- */
  function targets(m, M) {
    const bt = M.bt || 0, hd = M.hd == null ? Math.PI / 2 : M.hd, dir = M.dir || 1, rise = M.rise == null ? 1 : M.rise, coil = M.coil || 0, rear = M.rear || 0, rc = M.recoil || 0, reel = M.reel || 0, sp = M.spdK || 0, mv = M.mvA == null ? hd : M.mvA, st = M.settle || ZERO8;
    const ext = M.tailExt || 0, ta = M.tailA == null ? hd + Math.PI : M.tailA, lift = M.tailLift || 0, hs = m.hitSq || 0, segEye = M.segEye || ZERO8;
    const cf = Math.cos(hd), sf = Math.sin(hd), lx = -sf, ly = cf, px = -Math.sin(mv), py = Math.cos(mv), out = [];
    const R = RR * (1 + Math.sin(bt * 1.3) * 0.025 - coil * 0.06 + reel * 0.04);
    const riseK = i => smooth(rise * 1.7 - i * 0.09), sink = (z, i) => lerp(-0.85, z, riseK(i));
    // the head: raised on its neck at the front of the ring; it rears, sways, flinches, reels
    const hr = R + 0.78 - rc * 0.35 - rear * 0.2 + reel * 0.15, sway = (Math.sin(bt * 0.8) * 0.2 + reel * Math.sin(bt * 8) * 0.3) * (1 - rear * 0.7) + reel * 0.45;
    let hz = 0.95 + rear * 0.9 + Math.sin(bt * 1.9) * 0.06 - rc * 0.32 - hs * 0.2 - reel * 0.45 + coil * 0.12;
    hz = lerp(sink(hz, 0), 0.32, st[7]);
    out.push([m.x + cf * hr + lx * sway, m.y + sf * hr + ly * sway, hz]);
    for (let i = 0; i < NS; i++) { const ph = hd + dir * (A0 + i * STEP) + Math.sin(bt * 0.7) * 0.03, r = R * (1 - i * 0.015), wv = Math.sin(bt * 2.3 - i * 0.85), sl = Math.sin(bt * 7 - i * 1.1) * 0.38 * sp;
      let z = 0.34 * WK[i] + wv * 0.06 + coil * (0.14 + 0.06 * Math.sin(bt * 6 + i)) + (segEye[i] || 0) * 0.18 - rc * 0.05 * Math.sin(bt * 30 + i) + (i >= 5 ? lift * (i - 4) * 0.25 : 0);
      z = lerp(sink(z, i + 1), 0.12 * WK[i], st[i]);
      out.push([m.x + Math.cos(ph) * r + px * sl, m.y + Math.sin(ph) * r + py * sl, z]); }
    // the tail tip: tucked under the neck; lifted before the sweep; lashed out round the ring in it
    const pt = hd + dir * (A0 + (NS - 1) * STEP + 0.52), tuck = [m.x + Math.cos(pt) * R * 0.9, m.y + Math.sin(pt) * R * 0.9, 0.2 + lift * 1.1 + Math.sin(bt * 2.6) * 0.05];
    const lash = [m.x + Math.cos(ta) * (R + 0.6 + ext * 2.9), m.y + Math.sin(ta) * (R + 0.6 + ext * 2.9), 0.28 + ext * 0.25];
    const tip = ext > 0.01 ? [lerp(tuck[0], lash[0], ext), lerp(tuck[1], lash[1], ext), lerp(tuck[2], lash[2], ext)] : tuck; tip[2] = lerp(sink(tip[2], NS + 1), 0.08, st[NS - 1]);
    out.push(tip);
    return out; }
  function solve(m, M, dt, snap) { const P = targets(m, M); if (!M.chain || snap) { M.chain = P.map(p => p.slice()); return; }
    for (let i = 0; i < P.length; i++) { const s = M.chain[i], q = P[i], k = Math.min(1, dt * (i === P.length - 1 ? ((M.tailExt || 0) > 0.1 ? 16 : 7) : 9.5 - i * 0.6)); s[0] += (q[0] - s[0]) * k; s[1] += (q[1] - s[1]) * k; s[2] += (q[2] - s[2]) * k; } }

  /* ---------- painting it ---------- */
  // a faceted solid: its faces (3D points), each shaded by how it meets the light, those turned from the camera left out;
  // a seam of its own colour, the edges faint, the silhouette in bold ink. Returns its screen outline
  function solid(c, P3, faces, cen, lw, ramp, o) { o = o || {}; const vis = [], all = [];
    for (const f of faces) { let n = norm3(cross3(sub3(f[1], f[0]), sub3(f[f.length - 1], f[0]))); const fc = f.reduce((a, p) => add3(a, p), [0, 0, 0]).map(v => v / f.length); if (dot3(n, sub3(fc, cen)) < 0) n = mul3(n, -1);
      if (dot3(n, V3) <= 0.015) continue; const k = dot3(n, L3), col = k > 0.76 ? ramp[3] : k > 0.44 ? ramp[2] : k > 0.1 ? ramp[1] : ramp[0], pts = f.map(p => P3(p[0], p[1], p[2])); pts.forEach(p => all.push(p)); vis.push({ pts, col, k }); }
    if (!vis.length) return []; c.lineJoin = 'round';
    for (const F of vis) { c.beginPath(); F.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = F.col; c.fill(); c.lineWidth = 1; c.strokeStyle = F.col; c.stroke(); }
    if (o.inner) o.inner(c, vis);
    c.beginPath(); for (const F of vis) { F.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); } c.lineWidth = Math.max(0.8, lw * 0.4); c.strokeStyle = 'rgba(40,36,30,.32)'; c.stroke();
    const hull = hull2(all); if (K.Q.flash > 0 || o.flash) { c.beginPath(); hull.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = `rgba(255,246,236,${o.flash ? 0.35 * o.flash : 0.16})`; c.fill(); }
    c.beginPath(); hull.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
    return hull; }
  function hull2(pts) { pts = pts.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    return lo.slice(0, -1).concat(hi.slice(0, -1)); }
  // the stone's ramp, greying as it dies (settled)
  function stoneRamp(s) { return s > 0.01 ? [CAL_SH2, CAL_SH, CAL, CAL_HI].map(c => mix(c, DEAD, s * 0.75)) : [CAL_SH2, CAL_SH, CAL, CAL_HI]; }
  function tangent(S, k) { const a = S[k - 1], b = S[Math.min(S.length - 1, k + 1)]; let dx = a[0] - b[0], dy = a[1] - b[1]; const d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; }
  function drawBody(c, FX, m, X, Y, T, t) { const M = FX.mem; if (!M) return; if (!M.chain) solve(m, M, 0, true);
    const S = M.chain, P3 = TN.cam(X, Y, T, m), lw = Math.max(1.3, T * 0.065), rise = M.rise == null ? 1 : M.rise, parts = [];
    // its shadow on the flagstones (a ring), and where it rises, the broken floor
    c.save(); c.fillStyle = `rgba(20,18,24,${0.28 * rise})`; c.beginPath(); c.ellipse(X, Y + T * 0.15, T * (RR + 1.1), T * (RR + 0.7), 0, 0, TAU); c.ellipse(X, Y + T * 0.15, T * (RR - 0.7), T * (RR - 0.9), 0, 0, TAU); c.fill('evenodd'); c.restore();
    if (rise < 0.999) { c.save(); c.globalAlpha = 1 - rise * 0.6; c.fillStyle = 'rgba(18,16,20,.6)'; c.beginPath(); c.ellipse(X, Y, T * (RR + 0.8), T * (RR + 0.5), 0, 0, TAU); c.ellipse(X, Y, T * (RR - 0.8), T * (RR - 0.9), 0, 0, TAU); c.fill('evenodd');
      const R = mulberry32(31); c.strokeStyle = INK; c.lineWidth = Math.max(1, lw * 0.6); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r0 = RR + 0.8; let x = X + Math.cos(a) * r0 * T, y = Y + Math.sin(a) * (r0 - 0.3) * T; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 3; k++) { x += Math.cos(a + (R() - 0.5)) * T * 0.4; y += Math.sin(a + (R() - 0.5)) * T * 0.3; c.lineTo(x, y); } c.stroke(); } c.restore(); }
    // the dark gaps between the segments, the neck, the tail: each sorted just before the farther stone it joins
    const dk = p => p[1] + p[2] * 0.35;
    for (let k = 1; k < NS; k++) { const a = S[k], b = S[k + 1]; parts.push({ at: [0, Math.min(dk(a), dk(b)) - 0.02, 0], draw: () => gapTube(c, P3, a, b, T * 0.5 * Math.min(WK[k - 1], WK[k]), lw, M, t) }); }
    parts.push({ at: [0, Math.min(dk(S[0]), dk(S[1])) - 0.03, 0], draw: () => drawNeck(c, P3, M, T, lw) });
    parts.push({ at: [0, Math.min(dk(S[NS]), dk(S[NS + 1])) - 0.02, 0], draw: () => drawTail(c, P3, M, T, lw, t) });
    for (let k = 1; k <= NS; k++) parts.push({ at: [0, dk(S[k]), 0], draw: () => drawSeg(c, P3, M, k - 1, T, lw, t) });
    parts.push({ at: [0, dk(S[0]) + 0.05, 0], draw: () => drawHead(c, FX, P3, M, m, T, lw, t) });
    // (the depth key RiftFiend.sorted reads: y + z*0.35; the parts' keys are already that)
    parts.sort((a, b) => a.at[1] - b.at[1]).forEach(p => { c.save(); p.draw(); c.restore(); });
    if (rise < 0.999) { c.save(); c.globalCompositeOperation = 'source-over'; const g = c.createLinearGradient(0, Y - T * 0.2, 0, Y + T * 1.2); g.addColorStop(0, 'rgba(176,168,146,0)'); g.addColorStop(1, `rgba(176,168,146,${0.55 * (1 - rise)})`); c.fillStyle = g; c.fillRect(X - T * 3.5, Y - T * 0.2, T * 7, T * 1.4); c.restore(); }
    if ((M.reel || 0) > 0.4) { const h = P3(S[0][0], S[0][1], S[0][2] + 1.1); for (let i = 0; i < 3; i++) { const a = (M.bt || t) * 3.2 + i * TAU / 3; TN.twinkle(c, h[0] + Math.cos(a) * T * 0.8, h[1] + Math.sin(a) * T * 0.25, T * 0.2, HOT, 0.9); } } }
  // a dark flexible gap: a creased tube from one stone into the next
  function gapTube(c, P3, a, b, w, lw, M, t) { const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 - 0.06], pts = [a, mid, b].map(p => P3(p[0], p[1], p[2]));
    TN.tubeLite(c, pts, () => w, { col: GAP, shade: GAP_SH, shade2: '#0C0C0E', hi: GAP_HI, line: INK, lw, r: w, force: true });
    // its creases, flexing as it breathes
    const q = pts[1], dx = pts[2][0] - pts[0][0], dy = pts[2][1] - pts[0][1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d; c.strokeStyle = 'rgba(90,90,104,.5)'; c.lineWidth = Math.max(1, lw * 0.45); c.lineCap = 'round';
    for (const s of [-0.22, 0.22]) { const cx = q[0] + dx / d * w * s * (1 + Math.sin((M.bt || t) * 2.3) * 0.15), cy = q[1] + dy / d * w * s; c.beginPath(); c.moveTo(cx + nx * w * 0.36, cy + ny * w * 0.36); c.quadraticCurveTo(cx + dx / d * w * 0.12, cy + dy / d * w * 0.12, cx - nx * w * 0.36, cy - ny * w * 0.36); c.stroke(); } }
  // a segment: a faceted barrel of calcite (four rings of five points), its closed eye on top, ochre grooves, a number when it judges
  function segMesh(S, i, M) { const k = i + 1, p = S[k], w = WK[i], [ax, ay] = tangent(S, k), bx = -ay, by = ax, st = (M.settle || ZERO8)[i], L = 0.5 * w, Wd = 0.56 * w, Hh = 0.4 * w * (1 - st * 0.35), base = p[2] - 0.16 * w;
    const sec = [[-1, 0], [-0.8, 0.62], [0, 1], [0.8, 0.62], [1, 0]], rings = [[-L, 0.78, 0.84], [-L * 0.36, 1, 1], [L * 0.36, 1, 1], [L, 0.78, 0.84]];
    const R = rings.map(([al, s, h]) => sec.map(([u, v]) => [p[0] + ax * al + bx * u * Wd * s, p[1] + ay * al + by * u * Wd * s, base + v * Hh * h]));
    const faces = []; for (let r = 0; r < 3; r++) for (let s = 0; s < 4; s++) faces.push([R[r][s], R[r][s + 1], R[r + 1][s + 1], R[r + 1][s]]);
    faces.push(R[0].slice(), R[3].slice());
    return { p, w, R, faces, cen: [p[0], p[1], base + Hh * 0.35], top: [p[0], p[1], base + Hh], ax, ay }; }
  function drawSeg(c, P3, M, i, T, lw, t) { const S = M.chain, G = segMesh(S, i, M), st = (M.settle || ZERO8)[i], eye = (M.segEye || ZERO8)[i] || 0, hk = (M.segHit || ZERO8)[i] || 0, bt = M.bt || t;
    solid(c, P3, G.faces, G.cen, lw, stoneRamp(st), { flash: hk, inner: (g, vis) => {
      // the ochre grooves round its middle rings, and a hairline crack or two
      for (const r of [1, 2]) { const q = G.R[r].slice(1, 4).map(p => P3(p[0], p[1], p[2] + 0.005)); g.lineCap = 'round'; g.beginPath(); q.forEach((p, j) => j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = 'rgba(60,52,38,.45)'; g.lineWidth = Math.max(1.4, T * 0.07); g.stroke(); g.strokeStyle = mix(OCH, DEAD, st); g.lineWidth = Math.max(1, T * 0.035); g.stroke(); }
      const Rr = mulberry32(17 + i * 13), a = G.R[1][1], b = G.R[2][2]; let x = lerp(a[0], b[0], 0.3), y = lerp(a[1], b[1], 0.3), z = lerp(a[2], b[2], 0.3) + 0.01; g.strokeStyle = 'rgba(70,62,50,.45)'; g.lineWidth = Math.max(0.8, T * 0.02); g.beginPath(); let q = P3(x, y, z); g.moveTo(q[0], q[1]); for (let s = 0; s < 3; s++) { x += (Rr() - 0.5) * 0.18; y += (Rr() - 0.5) * 0.18; z -= Rr() * 0.06; q = P3(x, y, z); g.lineTo(q[0], q[1]); } g.stroke(); } });
    // the small eye on top, along the body: closed, its lid shivering; open, red
    const e = P3(G.top[0], G.top[1], G.top[2] + 0.02), f = P3(G.top[0] + G.ax, G.top[1] + G.ay, G.top[2] + 0.02), rot = Math.atan2(f[1] - e[1], f[0] - e[0]), ew = T * 0.5 * G.w * (1 + eye * 0.15);
    c.save(); c.translate(e[0], e[1]); c.rotate(rot > Math.PI / 2 ? rot - Math.PI : rot < -Math.PI / 2 ? rot + Math.PI : rot); c.scale(1, 0.78);
    if (eye > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * eye; blitSized(c, glowSprite(RED_HI), -ew * 1.2, -ew * 1.2, ew * 2.4, ew * 2.4); c.restore(); }
    B.eyeStone(c, 0, Math.sin(bt * 11 + i * 2.1) * T * 0.006 * (1 - eye), ew, Math.max(0, eye * 1.05 - 0.05) + (eye < 0.05 ? Math.max(0, Math.sin(bt * 0.9 + i * 1.7) - 0.93) * 2 : 0), Math.max(1, lw * 0.6), { col: mix(CAL_SH, DEAD, st), red: RED, glow: eye > 0.3 });
    c.restore();
    // its number, while it judges: a dark disc with a red ring; the next to fire larger and pulsing
    const num = (M.segNum || ZERO8)[i]; if (num > 0 && eye > 0.1) { const nx = P3(G.top[0], G.top[1], G.top[2] + 0.95 + Math.sin(bt * 3 + i) * 0.05), nxt = M.segNext === num, r = T * (nxt ? 0.36 + 0.04 * Math.sin(bt * 12) : 0.28);
      c.save(); c.globalAlpha = Math.min(1, eye * 1.4); c.strokeStyle = rgba(WARN, 0.5); c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.moveTo(e[0], e[1] - T * 0.12); c.lineTo(nx[0], nx[1] + r); c.stroke();
      c.fillStyle = 'rgba(22,18,22,.9)'; c.beginPath(); c.arc(nx[0], nx[1], r, 0, TAU); c.fill(); c.strokeStyle = nxt ? WARN : RED_HI; c.lineWidth = Math.max(1.5, T * (nxt ? 0.08 : 0.05)); c.stroke();
      c.font = `900 ${Math.round(r * 1.25)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = nxt ? '#FFFFFF' : HOT; c.fillText(String(num), nx[0], nx[1] + r * 0.06); c.restore(); } }
  // the neck: a thick dark tube from the first segment up under the head, two calcite collar plates on it
  function drawNeck(c, P3, M, T, lw) { const S = M.chain, h = S[0], s = S[1], G = headGeo(M), nape = G.nape, mid = [(s[0] + nape[0]) / 2, (s[1] + nape[1]) / 2, Math.max(s[2], nape[2]) * 0.92 + 0.12];
    const pts = [s, mid, nape].map(p => P3(p[0], p[1], p[2])); TN.tubeLite(c, pts, u => T * (0.62 - u * 0.12), { col: GAP, shade: GAP_SH, shade2: '#0C0C0E', hi: GAP_HI, line: INK, lw, r: T * 0.6, force: true });
    const st = (M.settle || ZERO8)[7]; for (const u of [0.35, 0.68]) { const q = [lerp(s[0], nape[0], u), lerp(s[1], nape[1], u), lerp(s[2], nape[2], u) + 0.12 + Math.sin(u * Math.PI) * 0.1], p = P3(q[0], q[1], q[2]), w = T * (0.36 - u * 0.06);
      TN.shape(c, TN.ell(p[0], p[1] - T * 0.05, w, w * 0.45), { col: mix(CAL, DEAD, st * 0.5), shade: CAL_SH, hi: CAL_HI, line: INK, lw: lw * 0.8, r: w, d1: 0.18, d2: 0.3, spec: false, force: true });
      c.strokeStyle = mix(OCH, DEAD, st); c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.ellipse(p[0], p[1] - T * 0.05, w * 0.7, w * 0.28, 0, 0.2, Math.PI - 0.2); c.stroke(); } }
  // the tail: a tapering dark tube to a pale stone spike; lashed out in the sweep, a blur along its arc
  function drawTail(c, P3, M, T, lw, t) { const S = M.chain, a = S[NS], b = S[NS + 1], ext = M.tailExt || 0, mid = [lerp(a[0], b[0], 0.5), lerp(a[1], b[1], 0.5), lerp(a[2], b[2], 0.5) + 0.15 + (M.tailLift || 0) * 0.3];
    const pts = [a, mid, b].map(p => P3(p[0], p[1], p[2])); TN.tubeLite(c, pts, u => T * (0.36 - u * 0.24), { col: GAP, shade: GAP_SH, shade2: '#0C0C0E', hi: GAP_HI, line: INK, lw, r: T * 0.36, force: true });
    const e = pts[2], d = [pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]], L = Math.hypot(d[0], d[1]) || 1, ux = d[0] / L, uy = d[1] / L, s = T * 0.42, st = (M.settle || ZERO8)[NS - 1];
    const tri = (k, col) => { c.beginPath(); c.moveTo(e[0] + ux * s * 1.4, e[1] + uy * s * 1.4); c.lineTo(e[0] - uy * s * 0.42 * k, e[1] + ux * s * 0.42 * k); c.lineTo(e[0] - ux * s * 0.2, e[1] - uy * s * 0.2); c.closePath(); c.fillStyle = col; c.fill(); };
    tri(1, mix(CAL_HI, DEAD, st)); tri(-1, mix(CAL_SH, DEAD, st)); c.beginPath(); c.moveTo(e[0] + ux * s * 1.4, e[1] + uy * s * 1.4); c.lineTo(e[0] - uy * s * 0.42, e[1] + ux * s * 0.42); c.lineTo(e[0] - ux * s * 0.2, e[1] - uy * s * 0.2); c.lineTo(e[0] + uy * s * 0.42, e[1] - ux * s * 0.42); c.closePath(); c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.lineJoin = 'round'; c.stroke();
    if (ext > 0.3 && M.SW) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * ext; blitSized(c, glowSprite(CAL_HI), e[0] - T, e[1] - T, T * 2, T * 2); c.restore(); } }
  /* the head: a broad faceted wedge (no jaw), a ridge from its snout to its crown with the red vertical eye in it, two hooked
     fins swept back from its rear corners */
  function headGeo(M) { const S = M.chain, H = S[0], hd = M.hd == null ? Math.PI / 2 : M.hd, rear = M.rear || 0, reel = M.reel || 0, fin = M.fin || 0, bt = M.bt || 0;
    // (it pitches up as it rears, droops and rolls as it reels)
    const pit = rear * 0.28 - reel * 0.2 + (M.recoil || 0) * 0.15, rol = reel * 0.35 * Math.sin(bt * 5) + Math.sin(bt * 0.8) * 0.04;
    const f0 = [Math.cos(hd), Math.sin(hd), 0], l0 = [-Math.sin(hd), Math.cos(hd), 0], u0 = [0, 0, 1];
    const f = norm3(add3(mul3(f0, Math.cos(pit)), mul3(u0, Math.sin(pit)))), u1 = norm3(sub3(mul3(u0, Math.cos(pit)), mul3(f0, Math.sin(pit)))), l = norm3(add3(mul3(l0, Math.cos(rol)), mul3(u1, Math.sin(rol)))), u = norm3(cross3(f, l));
    const P = (a, b, cc) => add3(H, mul3(add3(mul3(f, a), add3(mul3(l, b), mul3(u, cc))), 1.3));
    const W = 0.92 + fin * 0.05, tip = P(1.08, 0, -0.04), crown = P(0.02, 0, 0.44), bl = P(-0.5, W, 0.04), br = P(-0.5, -W, 0.04), nape = P(-0.66, 0, 0.22);
    const tipD = P(1.0, 0, -0.24), blD = P(-0.46, W * 0.94, -0.26), brD = P(-0.46, -W * 0.94, -0.26), napeD = P(-0.62, 0, -0.2);
    const eye3 = P(0.58, 0, 0.24);
    const fl = 1 + fin * 0.35, flk = fin * 0.3 + Math.sin(bt * 2.4) * 0.05;
    const finPts = s => [P(-0.38, W * s, 0.06), P(-0.68, (W + 0.42 * fl) * s, 0.16 + flk), P(-0.5, (W + 0.78 * fl) * s, 0.36 + flk), P(-0.08, (W + 0.72 * fl) * s, 0.5 + flk * 1.2), P(0.12, (W + 0.5 * fl) * s, 0.42 + flk)];
    return { H, f, l, u, tip, crown, bl, br, nape, tipD, blD, brD, napeD, eye3, finPts, P,
      faces: [[tip, crown, bl], [tip, br, crown], [crown, nape, bl], [crown, br, nape], [tip, bl, blD, tipD], [tip, tipD, brD, br], [bl, nape, napeD, blD], [nape, br, brD, napeD]] }; }
  function drawHead(c, FX, P3, M, m, T, lw, t) { const G = headGeo(M), st = (M.settle || ZERO8)[7], ramp = stoneRamp(st), eye = clamp(M.eyeR || 0, 0, 1), bt = M.bt || t;
    const pj = p => P3(p[0], p[1], p[2]);
    // the fins: the far one first, under the head; the near one over it
    const sides = [1, -1].map(s => ({ s, d: G.finPts(s)[3][1] + G.finPts(s)[3][2] * 0.35 })).sort((a, b) => a.d - b.d);
    const fin = s => { const F = G.finPts(s), q = F.map(pj), web = [pj(G.P(-0.42, 0.9 * s, 0.03))].concat(q.slice(1), [pj(G.P(0.22, (0.9 + 0.08) * s, 0.12))]);
      // the web: a stone blade, lit or shaded by which way it turns, ochre ribs
      const n = norm3(cross3(sub3(F[2], F[0]), sub3(F[4], F[0]))), k = Math.abs(dot3(n, L3)); c.beginPath(); web.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = k > 0.6 ? ramp[2] : k > 0.3 ? ramp[1] : ramp[0]; c.fill(); c.lineWidth = lw * 0.85; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
      c.strokeStyle = mix(OCH_D, DEAD, st); c.lineWidth = Math.max(1, T * 0.03); c.lineCap = 'round'; for (const j of [1, 2, 3]) { const a = web[0], b = q[j]; c.beginPath(); c.moveTo(lerp(a[0], b[0], 0.15), lerp(a[1], b[1], 0.15)); c.lineTo(lerp(a[0], b[0], 0.85), lerp(a[1], b[1], 0.85)); c.stroke(); }
      // the hook along its edge: a tapering tube of pale stone, its point dark
      TN.tubeLite(c, q, u => T * (0.2 - u * 0.15), { col: ramp[2], shade: ramp[1], shade2: ramp[0], hi: ramp[3], line: INK, lw: lw * 0.85, r: T * 0.2, force: true });
      const e = q[q.length - 1]; c.fillStyle = INK; c.beginPath(); c.arc(e[0], e[1], Math.max(1.2, T * 0.05), 0, TAU); c.fill(); };
    fin(sides[0].s);
    const hull = solid(c, P3, G.faces, add3(G.H, mul3(G.u, 0.08)), lw * 1.1, ramp, { flash: Math.max(M.eyeHit || 0, 0) * 0.6, inner: g => {
      // ochre edging along the brows and the crown, a few chisel marks
      g.lineCap = 'round'; for (const [a, b] of [[G.tip, G.bl], [G.tip, G.br], [G.bl, G.nape], [G.br, G.nape]]) { const p = pj(lerp3(a, b, 0.08)), q = pj(lerp3(a, b, 0.92)); g.strokeStyle = 'rgba(60,52,38,.5)'; g.lineWidth = Math.max(1.6, T * 0.075); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.strokeStyle = mix(OCH, DEAD, st); g.lineWidth = Math.max(1, T * 0.04); g.stroke(); }
      const cw = pj(G.crown); g.fillStyle = mix(OCH_HI, DEAD, st); g.beginPath(); g.arc(cw[0], cw[1] + T * 0.04, Math.max(1.5, T * 0.07), 0, TAU); g.fill(); g.strokeStyle = INK; g.lineWidth = Math.max(1, lw * 0.5); g.stroke(); } });
    fin(sides[1].s);
    // the red vertical eye in the ridge: closed, a seam between two stone lids; open, the lids part on a red iris with a slit
    const a = pj(lerp3(G.tip, G.crown, 0.16)), b = pj(lerp3(G.tip, G.crown, 0.82)), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], Lh = Math.max(T * 0.3, Math.hypot(dx, dy) * 0.62), ang = Math.atan2(dy, dx), Wd = T * (0.06 + 0.24 * eye) * (1 + (M.eyeHit || 0) * 0.15);
    c.save(); c.translate(cx, cy); c.rotate(ang);
    const almond = (w) => { c.beginPath(); c.moveTo(-Lh, 0); c.quadraticCurveTo(0, -w * 2, Lh, 0); c.quadraticCurveTo(0, w * 2, -Lh, 0); c.closePath(); };
    // (the lids: two calcite bulges round the slit)
    almond(T * 0.16); c.fillStyle = mix(CAL_SH, DEAD, st); c.fill(); c.lineWidth = lw * 0.8; c.strokeStyle = INK; c.stroke();
    if (eye > 0.03) { const fire = M.U && (M.U.st === 'fire' || M.U.st === 'frozen') ? 1 : 0;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, 0.35 * eye + fire * 0.4 + (M.eyeHit || 0) * 0.4); blitSized(c, glowSprite(RED_HI), -Lh * 2, -Lh * 2, Lh * 4, Lh * 4); c.restore();
      almond(Wd * 0.5); c.save(); c.clip(); c.fillStyle = '#1A0E10'; c.fillRect(-Lh, -T, Lh * 2, T * 2);
      const ir = Math.max(Wd * 0.9, T * 0.05); c.fillStyle = RED_D; c.beginPath(); c.ellipse(0, 0, Lh * 0.62, ir, 0, 0, TAU); c.fill(); c.fillStyle = RED; c.beginPath(); c.ellipse(0, ir * 0.12, Lh * 0.54, ir * 0.82, 0, 0, TAU); c.fill(); c.fillStyle = RED_HI; c.beginPath(); c.ellipse(-Lh * 0.12, -ir * 0.25, Lh * 0.26, ir * 0.36, 0, 0, TAU); c.fill();
      c.fillStyle = INK; c.beginPath(); c.ellipse(0, 0, Lh * 0.46, Math.max(1, ir * 0.16 * (1 + fire * 0.4)), 0, 0, TAU); c.fill();
      c.fillStyle = HOT; c.beginPath(); c.ellipse(-Lh * 0.2, -ir * 0.4, Lh * 0.1, ir * 0.16, 0.3, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(Lh * 0.24, ir * 0.3, Math.max(1, ir * 0.1), 0, TAU); c.fill(); c.restore();
      almond(Wd * 0.5); c.lineWidth = Math.max(1, lw * 0.7); c.strokeStyle = INK; c.stroke(); }
    else { c.strokeStyle = INK; c.lineWidth = Math.max(1.2, lw * 0.75); c.beginPath(); c.moveTo(-Lh * 0.9, 0); c.quadraticCurveTo(0, T * 0.03 * Math.sin(bt * 9), Lh * 0.9, 0); c.stroke(); c.strokeStyle = rgba(RED_HI, 0.35 + 0.25 * Math.sin(bt * 1.7)); c.lineWidth = Math.max(1, T * 0.025); c.stroke(); }
    // the lids' rims catch the light
    c.strokeStyle = rgba(CAL_HI, 0.85); c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.moveTo(-Lh * 0.7, -T * 0.13 - Wd * 0.4); c.quadraticCurveTo(0, -T * 0.3 - Wd * 0.6, Lh * 0.7, -T * 0.13 - Wd * 0.4); c.stroke();
    c.restore(); }
  function lerp3(a, b, u) { return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; }

  /* ---------- on the floor: the lanes, the beam, the sweep, every telegraph soft-edged and in warning red ---------- */
  function lab(c, X, Y, s, col, T, k) { c.save(); c.font = `900 ${Math.round(T * (k || 0.36))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3.5; c.strokeStyle = 'rgba(14,10,12,.85)'; c.lineJoin = 'round'; c.strokeText(s, X, Y); c.fillStyle = col || '#FFFFFF'; c.fillText(s, X, Y); c.restore(); }
  function floorClip(c, FX, T) { c.beginPath(); c.arc(FX.sx(FX.C.x), FX.sy(FX.C.y), (FX.C.R + 0.2) * T, 0, TAU); c.clip(); }
  function shadowsIn(c, FX, src) { for (const s of B.screens()) { const P = B.shadowOf(s, src); if (P) B.drawShadow(c, FX, P, 0.9); } }
  function lanePoly(FX, L, len) { const ca = Math.cos(L.a), sa = Math.sin(L.a), nx = -sa * L.w / 2, ny = ca * L.w / 2, x0 = L.x + ca * 0.4, y0 = L.y + sa * 0.4, x1 = L.x + ca * len, y1 = L.y + sa * len; return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]].map(p => [FX.sx(p[0]), FX.sy(p[1])]); }
  function path(c, P) { c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); }
  function conePath(c, FX, src, T) { const X = FX.sx(src.x), Y = FX.sy(src.y); c.beginPath(); c.moveTo(X, Y); c.arc(X, Y, src.len * T, src.a - src.spread, src.a + src.spread); c.closePath(); }
  function drawOverlay(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !M.stat || !m) return; const sx = FX.sx, sy = FX.sy, me = FX.me;
    c.save(); floorClip(c, FX, T);
    // the sweep's scar: dust ground into a ring round the coil
    M.marks.forEach(k => { const a = clamp((k.life - k.t) / 1.2, 0, 1); c.save(); c.globalAlpha = a * 0.5; c.strokeStyle = 'rgba(120,110,90,.6)'; c.lineWidth = T * 2.6; c.beginPath(); c.ellipse(sx(k.x), sy(k.y), (RR + 2.4) * T, (RR + 2.4) * T, 0, 0, TAU); c.stroke(); c.restore(); });
    // Passing Judgement: each lane a band out from its eye; the next to fire filling as it counts down; fired ones closed
    const J = M.J; if (J) { const next = J.lanes.find(L => L.st === 'wait');
      J.lanes.forEach(L => { const P = lanePoly(FX, L, L.len), on = L.st !== 'closed', isNext = L === next, u = isNext ? clamp((J.t - (L.fireAt - 1.2)) / 1.2, 0, 1) : 0;
        c.save(); if (!on) { const a = clamp(1 - L.t / 1.4, 0, 1); if (a > 0.02) { c.globalAlpha = a; c.setLineDash([T * 0.3, T * 0.25]); c.strokeStyle = 'rgba(200,196,184,.7)'; c.lineWidth = 2; path(c, P); c.stroke(); c.setLineDash([]); } c.restore(); return; }
        const hot = L.st === 'hot'; path(c, P); c.fillStyle = rgba(WARN, hot ? 0.55 : isNext ? 0.12 + 0.18 * u : 0.07); c.fill();
        if (isNext && u > 0) { const P2 = lanePoly(FX, L, 0.4 + (L.len - 0.4) * u); path(c, P2); c.fillStyle = rgba(WARN, 0.18); c.fill(); }
        if (hot) { const P3 = lanePoly(Object.assign({}, FX), Object.assign({}, L, { w: L.w * 0.35 }), L.len); path(c, P3); c.fillStyle = 'rgba(255,236,230,.7)'; c.fill(); }
        c.setLineDash(isNext || hot ? [] : [T * 0.35, T * 0.22]); c.lineDashOffset = -t * T; c.strokeStyle = rgba(WARN, hot ? 1 : isNext ? 0.9 : 0.5); c.lineWidth = isNext || hot ? Math.max(2, T * 0.08) : 2; path(c, P); c.stroke(); c.setLineDash([]);
        // (the screens' shadows from this eye cut into its lane: safe ground)
        path(c, P); c.clip(); shadowsIn(c, FX, { x: L.x, y: L.y, len: L.len }); c.restore(); });
      // the numbers along each lane, and the countdown of the next on the floor beside the pet
      J.lanes.forEach(L => { if (L.st === 'closed') return; const ca = Math.cos(L.a), sa = Math.sin(L.a); for (const d of [3.2, 9, 15]) lab(c, sx(L.x + ca * d), sy(L.y + sa * d), String(L.num), L === next ? '#FFFFFF' : RED_HI, T, L === next ? 0.5 : 0.36); });
      if (next) { const ca = Math.cos(next.a), sa = Math.sin(next.a), al = clamp((me.x - next.x) * ca + (me.y - next.y) * sa, 2.5, next.len - 1), left = Math.max(0, next.fireAt - J.t); lab(c, sx(next.x + ca * al), sy(next.y + sa * al) - T * 0.05, left.toFixed(1), '#FFFFFF', T, 0.46); }
      // a closed lane: safe to cross, a closed-eye mark on it
      J.lanes.forEach(L => { if (L.st !== 'closed' || L.t > 1.4) return; const ca = Math.cos(L.a), sa = Math.sin(L.a), al = clamp((me.x - L.x) * ca + (me.y - L.y) * sa, 2.5, L.len - 1); c.save(); c.globalAlpha = clamp(1 - L.t / 1.4, 0, 1); B.closedEye(c, sx(L.x + ca * al), sy(L.y + sa * al), T * 0.8, CAL_HI, Math.max(1.5, T * 0.06)); c.restore(); }); }
    // Unveiling: the beam's cone; following, then frozen, then firing with the screens' shadows cut into it
    const U = M.U; if (U && U.st !== 'open') { const src = U.src, fire = U.st === 'fire', frz = U.st === 'frozen', pu = 0.5 + 0.5 * Math.sin(t * 10);
      c.save(); conePath(c, FX, src, T); c.fillStyle = rgba(WARN, fire ? 0.34 : frz ? 0.16 + 0.08 * pu : 0.06); c.fill();
      c.setLineDash(U.st === 'lock' ? [T * 0.35, T * 0.25] : []); c.lineDashOffset = -t * T * 1.5; c.strokeStyle = rgba(WARN, fire ? 1 : frz ? 0.95 : 0.6); c.lineWidth = Math.max(2, T * (fire || frz ? 0.09 : 0.05)); conePath(c, FX, src, T); c.stroke(); c.setLineDash([]);
      if (fire) { c.save(); conePath(c, FX, { x: src.x, y: src.y, a: src.a, len: src.len, spread: src.spread * 0.35 }, T); c.fillStyle = 'rgba(255,226,216,.38)'; c.fill(); c.restore(); }
      if (U.st === 'lock') { c.strokeStyle = rgba(WARN, 0.8); c.lineWidth = 1.5; c.beginPath(); c.moveTo(sx(src.x), sy(src.y)); c.lineTo(sx(src.x + Math.cos(src.a) * src.len), sy(src.y + Math.sin(src.a) * src.len)); c.stroke(); }
      conePath(c, FX, src, T); c.clip(); shadowsIn(c, FX, src); c.restore(); }
    // the tail sweep: the turn it will run (arrows round the coil), then the swept arc filling behind the lashing tail
    const S = M.SW; if (S) { const X = sx(S.x), Y = sy(S.y), r0 = (RR + 0.6) * T, r1 = (AR + 1) * T, u = clamp((S.t - S.show) / S.dur, 0, 1), cur = S.a0 + S.dir * TAU * u;
      c.save(); if (u > 0) { c.beginPath(); c.arc(X, Y, r1, S.dir > 0 ? S.a0 : cur, S.dir > 0 ? cur : S.a0); c.arc(X, Y, r0, S.dir > 0 ? cur : S.a0, S.dir > 0 ? S.a0 : cur, true); c.closePath(); c.fillStyle = rgba(WARN, 0.2); c.fill(); }
      c.strokeStyle = rgba(WARN, 0.95); c.lineWidth = Math.max(2.5, T * 0.12); c.beginPath(); c.moveTo(X + Math.cos(cur) * r0, Y + Math.sin(cur) * r0); c.lineTo(X + Math.cos(cur) * r1, Y + Math.sin(cur) * r1); c.stroke();
      if (S.t < S.show) { const k = S.t / S.show; for (let i = 0; i < 8; i++) { const a = S.a0 + S.dir * (i / 8) * TAU + S.dir * t * 2, rr = (RR + 3.4) * T, x = X + Math.cos(a) * rr, y = Y + Math.sin(a) * rr, ta = a + S.dir * Math.PI / 2; c.save(); c.translate(x, y); c.rotate(ta); c.globalAlpha = 0.5 + 0.5 * k; c.strokeStyle = WARN; c.lineWidth = Math.max(2, T * 0.09); c.lineCap = 'round'; c.beginPath(); c.moveTo(-T * 0.3, -T * 0.3); c.lineTo(0, 0); c.lineTo(-T * 0.3, T * 0.3); c.stroke(); c.restore(); } }
      // (a screen's lee from the coil is safe from the lash: its shadow)
      c.beginPath(); c.arc(X, Y, r1, 0, TAU); c.clip(); shadowsIn(c, FX, { x: S.x, y: S.y, len: 22 }); c.restore(); }
    c.restore(); }

  /* ---------- in the air: the beam's shaft from the eye, the labels over the serpent; the stilled body at the end ---------- */
  function drawAir(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M || !M.stat) return; const sx = FX.sx, sy = FX.sy;
    if (m.dead && M.end) { drawBody(c, FX, m, sx(m.x), sy(m.y), T, t); return; }
    if (!M.chain) return; const G = headGeo(M), e = G.eye3, EX = sx(e[0]), EY = sy(e[1]) - e[2] * T, U = M.U;
    if (U && U.st === 'fire') { const a = U.src.a, k = 0.7 + 0.3 * Math.sin(t * 20), reach = shaftReach(U.src, 9); c.save(); c.globalCompositeOperation = 'lighter';
      for (const [w, col, al] of [[3.2, RED, 0.35], [1.6, RED_HI, 0.55], [0.55, HOT, 0.8]]) { c.save(); c.translate(EX, EY); const tx = sx(U.src.x + Math.cos(a) * reach), ty = sy(U.src.y + Math.sin(a) * reach); c.rotate(Math.atan2(ty - EY, tx - EX)); c.globalAlpha = al * k; blitSized(c, beamSprite(col), -T * 0.3, -w * T / 2, Math.hypot(tx - EX, ty - EY) + T, w * T); c.restore(); }
      K.glow(c, EX, EY, T * 1.6, RED_HI, 0.7); c.restore(); }
    else if (U && (U.st === 'lock' || U.st === 'frozen')) { c.save(); c.globalCompositeOperation = 'lighter'; K.glow(c, EX, EY, T * (0.9 + (U.st === 'frozen' ? 0.6 : 0.3 * Math.sin(t * 8))), RED_HI, 0.55); c.restore(); }
    const topY = sy(m.y) - (Math.max(...M.chain.map(p => p[2])) + 1.9) * T, X0 = sx(m.x);
    if (U && U.st !== 'end') { const left = U.st === 'lock' ? U.lock - U.t + U.frz : U.st === 'frozen' ? U.frz - U.t : U.st === 'fire' ? U.fire - U.t : U.open - U.t + U.lock + U.frz;
      lab(c, X0, topY, U.st === 'fire' ? 'THE BEAM FIRES' : U.st === 'frozen' ? 'FROZEN · ' + left.toFixed(1) : 'UNVEILING · ' + left.toFixed(1), U.st === 'lock' || U.st === 'open' ? RED_HI : '#FFFFFF', T, 0.46);
      lab(c, X0, topY + T * 0.55, 'behind a SCREEN', SAFE, T, 0.32); }
    if (M.J) { const nx = M.J.lanes.find(L => L.st === 'wait'); lab(c, X0, topY, nx ? `JUDGEMENT · ${nx.num} of ${M.J.n}` : 'JUDGEMENT', RED_HI, T, 0.44); }
    if (m.stunT > 0 && M.stunKind === 'reel') { lab(c, X0, topY, `IT REELS ${m.stunT.toFixed(1)}s`, '#FFFFFF', T, 0.46); lab(c, X0, topY + T * 0.55, 'RED EYE ×2 · BODY ×1.5', HOT, T, 0.32); }
    if (M.SW) lab(c, sx(m.x), sy(m.y) + T * (RR + 1.6), M.SW.t < M.SW.show ? 'TAIL SWEEP' : '', WARN, T, 0.42); }

  // (how far the shaft runs along the beam's axis before a screen stops it)
  function shaftReach(src, max) { const ca = Math.cos(src.a), sa = Math.sin(src.a); for (let d = 0.8; d < max; d += 0.25) if (B.screens().some(s => s.blocks(src.x, src.y, src.x + ca * d, src.y + sa * d))) return d; return max; }
  /* ---------- the Reliquary: a round court of pale calcite, a black basalt rim, the central lane, a closed eye inlaid ---------- */
  function paintFloor(c, A) { const R = A.R, rnd = A.rnd;
    // the basalt rim beyond the court: blocks, their faces in the dark
    c.fillStyle = '#121214'; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.fill();
    for (let i = 0; i < 40; i++) { const a0 = i / 40 * TAU, a1 = (i + 1) / 40 * TAU - 0.01; c.beginPath(); c.arc(0, 0, R + 1.4, a0, a1); c.arc(0, 0, R + 0.25, a1, a0, true); c.closePath(); c.fillStyle = i % 3 ? '#2A2A30' : '#242428'; c.fill(); c.strokeStyle = 'rgba(70,70,80,.35)'; c.lineWidth = 0.04; c.stroke(); }
    // the court: rings of calcite flagstones, each its own tone, lit edge and shaded edge
    c.fillStyle = '#BDB59E'; c.beginPath(); c.arc(0, 0, R + 0.25, 0, TAU); c.fill();
    const FL = ['#D8D1BB', '#D2CBB4', '#DDD6C1', '#CEC6AE', '#D6CFB8'];
    for (let r = 2.2, ring = 0; r < R; r += 1.8, ring++) { const n = Math.max(8, Math.round(TAU * r / 2.1)), off = rnd() * 0.5; for (let i = 0; i < n; i++) { const a0 = (i + off) / n * TAU, a1 = (i + 1 + off) / n * TAU, r1 = Math.min(R + 0.2, r + 1.8);
      c.beginPath(); c.arc(0, 0, r1 - 0.05, a0 + 0.012, a1 - 0.012); c.arc(0, 0, r + 0.05, a1 - 0.012, a0 + 0.012, true); c.closePath(); c.fillStyle = FL[Math.floor(rnd() * FL.length)]; c.fill();
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 0.06; c.beginPath(); c.arc(0, 0, r + 0.1, a0 + 0.02, a1 - 0.02); c.stroke();
      if (rnd() < 0.18) { let x = Math.cos((a0 + a1) / 2) * (r + 0.9), y = Math.sin((a0 + a1) / 2) * (r + 0.9); c.strokeStyle = 'rgba(80,72,58,.35)'; c.lineWidth = 0.035; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 0.6; y += (rnd() - 0.5) * 0.6; c.lineTo(x, y); } c.stroke(); } } }
    // the centre: a closed eye inlaid in ochre within two rings
    c.fillStyle = '#CFC7AF'; c.beginPath(); c.arc(0, 0, 2.2, 0, TAU); c.fill();
    c.strokeStyle = OCH; c.lineWidth = 0.14; c.beginPath(); c.arc(0, 0, 2.05, 0, TAU); c.stroke(); c.lineWidth = 0.05; c.beginPath(); c.arc(0, 0, 1.75, 0, TAU); c.stroke();
    c.lineWidth = 0.12; c.lineCap = 'round'; c.beginPath(); c.moveTo(-1.3, 0); c.quadraticCurveTo(0, 0.85, 1.3, 0); c.stroke(); c.beginPath(); c.moveTo(-1.3, 0); c.quadraticCurveTo(0, -0.55, 1.3, 0); c.globalAlpha = 0.45; c.stroke(); c.globalAlpha = 1;
    for (const u of [-0.55, 0, 0.55]) { c.beginPath(); c.moveTo(u, 0.45); c.lineTo(u * 1.2, 0.85); c.stroke(); }
    // the central lane: a paved strip of darker ochre slabs running north–south
    c.save(); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.clip(); for (let y = -R; y < R; y += 1.5) { c.fillStyle = rgba(OCH, 0.16 + rnd() * 0.06); c.fillRect(-1.45, y + 0.04, 2.9, 1.42); } c.strokeStyle = rgba(OCH_D, 0.55); c.lineWidth = 0.08; c.beginPath(); c.moveTo(-1.5, -R); c.lineTo(-1.5, R); c.moveTo(1.5, -R); c.lineTo(1.5, R); c.stroke(); c.restore();
    // where it lies: four worn rings in the stone, round the rim
    for (const a of HOME_A) { const x = Math.cos(a) * HOME_R, y = Math.sin(a) * HOME_R; c.strokeStyle = 'rgba(110,100,80,.28)'; c.lineWidth = 1.0; c.beginPath(); c.arc(x, y, RR, 0, TAU); c.stroke(); c.strokeStyle = rgba(OCH, 0.35); c.lineWidth = 0.05; c.beginPath(); c.arc(x, y, RR + 0.65, 0, TAU); c.stroke(); }
    // the ochre circle near the rim, seven closed eyes carved round it
    c.strokeStyle = OCH; c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, R - 0.7, 0, TAU); c.stroke(); c.strokeStyle = rgba(OCH, 0.5); c.lineWidth = 0.04; c.beginPath(); c.arc(0, 0, R - 0.95, 0, TAU); c.stroke();
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.2, x = Math.cos(a) * (R - 1.9), y = Math.sin(a) * (R - 1.9); if (Math.abs(x) < 2) continue; c.save(); c.translate(x, y); c.strokeStyle = rgba(OCH_D, 0.6); c.lineWidth = 0.08; c.beginPath(); c.moveTo(-0.55, 0); c.quadraticCurveTo(0, 0.4, 0.55, 0); c.stroke(); for (const u of [-0.25, 0, 0.25]) { c.beginPath(); c.moveTo(u, 0.2); c.lineTo(u * 1.2, 0.42); c.stroke(); } c.restore(); }
    // calcite dust in the joints
    for (let i = 0; i < 900; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R; c.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.3)' : 'rgba(110,100,80,.16)'; const s = 0.03 + rnd() * 0.05; c.fillRect(Math.cos(a) * d, Math.sin(a) * d, s, s); }
    // the court's edge: a step down to the rim
    c.strokeStyle = 'rgba(30,28,30,.6)'; c.lineWidth = 0.3; c.beginPath(); c.arc(0, 0, R + 0.25, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.06; c.beginPath(); c.arc(0, 0, R + 0.05, 0, TAU); c.stroke(); }
  // the reliquary's dark beyond: leaning walls, narrow pillars, red slit light high up
  function paintSky(c, W, H, T) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0C0B0E'); g.addColorStop(0.55, '#16141A'); g.addColorStop(1, '#0E0D10'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(4471); c.save();
    for (let i = 0; i < 7; i++) { const x = W * (i + 0.5) / 7; c.globalAlpha = 0.08; c.fillStyle = '#8A4640'; c.beginPath(); c.moveTo(x - 4, 0); c.lineTo(x + 4, 0); c.lineTo(x + 30, H); c.lineTo(x - 22, H); c.closePath(); c.fill(); }
    c.globalAlpha = 1; for (let i = 0; i < 11; i++) { const x = W * (i + 0.5) / 11 + (R() - 0.5) * 12, w = 14 + R() * 8, lean = (x - W / 2) * 0.04; c.fillStyle = '#1C1B20'; c.beginPath(); c.moveTo(x - w / 2 + lean, 0); c.lineTo(x + w / 2 + lean, 0); c.lineTo(x + w / 2, H); c.lineTo(x - w / 2, H); c.closePath(); c.fill(); c.fillStyle = 'rgba(161,142,101,.18)'; c.fillRect(x - w / 2 - 2, H * 0.3, w + 4, 3); c.fillStyle = 'rgba(216,209,187,.06)'; c.fillRect(x - w / 2, 0, 2, H); }
    for (let i = 0; i < 4; i++) { const x = W * (0.15 + i * 0.24), y = H * (0.15 + R() * 0.2); c.globalAlpha = 0.2; c.strokeStyle = '#B3AB95'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 14, y); c.quadraticCurveTo(x, y + 9, x + 14, y); c.stroke(); c.beginPath(); c.moveTo(x - 14, y); c.quadraticCurveTo(x, y - 6, x + 14, y); c.stroke(); }
    c.globalAlpha = 1; for (let i = 0; i < 50; i++) { c.fillStyle = `rgba(224,138,126,${0.08 + R() * 0.2})`; c.beginPath(); c.arc(R() * W, R() * H, 0.6 + R(), 0, TAU); c.fill(); }
    c.restore(); }
})());
