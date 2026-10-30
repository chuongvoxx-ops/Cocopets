/* ---------- TAMMOR THE LIVING DRUM ----------
   The Choir's first boss, in the Drum Chamber: a 28-metre floor that is itself a drum, three concentric rings numbered
   outward from the centre (the stage builds them: X.rift.self.mod.rings, ringOf, hush).
   Tammor is a low six-legged beast with a circular body four metres across: a maroon shell of bevelled plates laced with
   bone cords like a drum's, its back a taut pale membrane glowing faintly from within, three tarnished gold spikes round the
   rim, a small eyeless wedge head beneath the membrane's front lip with two blunt coral-tipped feelers. It drums the floor
   with its front pair of legs, and the membrane on its back visibly depresses before every shockwave.
   Threefold Beat: it lights the rings one by one in a displayed order (numbered badges with countdown borders), then
   strikes them in that order. A ring is safe the moment after it resolves: step into it. The orders are those in which
   each ring after the first lies next to one already struck, so there is always a resolved ring beside the next to strike.
   Hold the Silence: one empty beat is inserted into the phrase (the closed-mouth icon). Through that rest the membrane is
   exposed and Tammor takes x1.75; land enough blows in the rest and the drum falters (staggered, still exposed) and the
   rest of the phrase is broken off.
   At half health one beat of each phrase becomes a FRONTAL CONE from its head instead of a ring (numbered on the same
   preview): get round its side.
   Between phrases it shuffles and turns on its six legs, tapping the floor with its front pair.
   It is never still: the membrane breathes, the feelers sway and listen, the legs shift; it rocks back when struck. It dies
   with its membrane slackening, its legs folding under it, and the rings falling dark one by one. */
RiftFiend.define({ id: 'tammor', hpK: 1.25, dmgK: 1.25, name: 'Tammor', title: 'The Living Drum', color: '#341C2F', glow: '#DA8F86', accent: '#F2E8CF', biome: 'scorehall', r: 2.4, els: ['wind', 'dark'], phases: 2 }, (() => {
  const { TAU, TN, sorted, hit } = RiftFiend, tubeLite = TN.tubeLite, K = DunFiend.KIT;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const lerp3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const add3 = (a, b, k) => [a[0] + b[0] * (k == null ? 1 : k), a[1] + b[1] * (k == null ? 1 : k), a[2] + b[2] * (k == null ? 1 : k)], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const len3 = a => Math.hypot(a[0], a[1], a[2]), norm3 = a => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const turnTo = (a, b, dt, w) => a + clamp(angTo(a, b), -w * dt, w * dt);
  const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const mix = (a, b, u) => K.mixC(a, b, clamp(u, 0, 1)), rgba = TN.rgba;
  const { MAROON, MAROON_HI, MAROON_D, BONE, BONE_HI, BONE_D, GOLD, GOLD_HI, GOLD_D, CORAL, CORAL_HI, CORAL_D, WARN, INK } = CHO;
  // the painter's palette: the maroon shell in four tones (and a deeper one for the legs and the head), the bone membrane and
  // cords, the tarnished gold of the spikes and hoops, coral for the living accents
  const SHELL = { hi: '#74466A', col: '#4E2C47', sh: MAROON, sh2: MAROON_D }, LEGR = { hi: '#6A3D5F', col: '#45273F', sh: '#2E1829', sh2: '#170A14' };
  const HEADR = { hi: '#6E3E60', col: '#43233D', sh: '#2C1528', sh2: '#170912' };
  const BONER = { hi: BONE_HI, col: BONE, sh: BONE_D, sh2: '#7A6A55' }, GOLDR = { hi: GOLD_HI, col: GOLD, sh: GOLD_D, sh2: '#3E2F18' }, CORR = { hi: CORAL_HI, col: CORAL, sh: CORAL_D, sh2: '#6A3436' };
  const HOT = '#FFF3DC', HOTG = '#FFE8A6', SAFE = '#9CFFD8', PATINA = '#4F5B3E';
  const tubeS = R => ({ col: R.col, shade: R.sh, shade2: R.sh2, hi: R.hi, line: INK });
  // the camera looks along (0, -1, -1); the key light from the upper left, a little toward the camera
  const VIEW = [0, Math.SQRT1_2, Math.SQRT1_2], LIGHT = norm3([-0.5, 0.32, 0.82]), LSCR = [-0.566, -0.824];
  const A = CHO.arena.tammor;
  // the orders a phrase may strike in: each ring after the first lies beside one already struck (so a resolved ring is
  // always next to the one about to strike)
  const ORDERS = [[0, 1, 2], [1, 0, 2], [1, 2, 0], [2, 1, 0]];
  const CYC = ['beat', 'shuffle', 'silence', 'shuffle'];
  const RING_NOTE = [131, 98, 73];   // (each ring its own pitch: high in the middle, low at the rim)
  // the drum's body: the shell's profile (radius, height) from its underside up to the rim, the lip and the membrane
  const NSEG = 22, PROF = [[1.72, 0.24], [2.1, 0.74], [2.0, 1.36]], LIP = [[2.05, 1.34], [1.7, 1.56]], MEM_R = 1.66, MEM_H = 1.46;
  const SPIKES = [Math.PI, Math.PI / 3, -Math.PI / 3];
  const LEGA = [0.72, 1.6, 2.42];
  const ring3 = (P, a, r, h) => P.W0(Math.cos(a) * r, Math.sin(a) * r, h);
  const path = (c, S) => { c.beginPath(); S.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); };
  const outN = (pts, cen) => { let n = norm3(cross3(sub3(pts[1], pts[0]), sub3(pts[pts.length - 1], pts[0]))); const ce = pts.reduce((q, p) => add3(q, p, 1 / pts.length), [0, 0, 0]); if (dot3(n, sub3(ce, cen)) < 0) n = mul3(n, -1); return n; };
  const poly = (c, S) => { c.beginPath(); S.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); };
  return {
    arenaR: A.R, carve: A.carve, start: A.start, firstAct: 'prowl', artY: 0.64, ambient: 'motes',
    artPoses: [{ name: 'at rest: the membrane breathes, the feelers listen', mem: { hd: 1.95 } },
      { name: 'drum wind-up: front legs rise, the membrane depresses', mem: { hd: 1.62, liftL: 1, liftR: 0.9, dent: 1, glow: 0.55 } },
      { name: 'the strike: legs down, the skin rebounds', mem: { hd: 1.62, slam: 1, ripple: 0.85, glow: 1 } },
      { name: 'hold the silence: the membrane exposed', mem: { hd: 1.4, hush: 1, glow: 1 } },
      { name: 'frontal beat wind-up: it rears toward the cone', mem: { hd: 1.15, rear: 1, dent: 0.8, liftL: 1, liftR: 1, glow: 0.7 } },
      { name: 'shuffling on six legs', mem: { hd: 0.55, spdK: 1, gait: 1.1 } },
      { name: 'faltering: the skin wobbles slack', mem: { hd: 1.85, reel: 1, slack: 0.45, glow: 0.8 }, m: { stunT: 1 } },
      { name: 'dead: membrane slack, legs folded', mem: { hd: 2.25, slack: 1, fold: 1, taut: 0, glow: 0, dim: 1 } }],
    phaseNames: ['The Drum Chamber', 'The Drum Chamber', 'The Frontal Beat', 'The Frontal Beat'],
    props(C) { const out = [], R = mulberry32(1111), far = ['pipecolumn', 'pipearch', 'pipespiral', 'pipecolumn', 'drumstack', 'pipespiral', 'pipearch', 'pipecolumn'], near = ['drumstack', 'bonehorn', 'drumstack', 'gaugepost'];
      for (let i = 0; i < 20; i++) { const a = i / 20 * TAU + (R() - 0.5) * 0.1, back = Math.sin(a) < 0.15, kind = back ? far[i % far.length] : near[i % near.length], s = back ? 0.9 + R() * 0.25 : 0.62 + R() * 0.15;
        out.push({ kind, i, v: Math.floor(R() * 12), s, x: C.x + Math.cos(a) * (C.R + (back ? 1.6 : 1.0)), y: C.y + Math.sin(a) * (C.R + (back ? 1.2 : 0.6)) }); } return out; },
    propKeep: { every: 30, box: p => [-3.6 * p.s, -7.4 * p.s, 3.6 * p.s, 1 * p.s] },
    drawProp(c, FX, p, X, Y, T) { c.translate(X, Y); const f = DunWorld.PROPS[p.kind]; if (f) f(c, T * p.s, p.v); },
    paintGround(c, A2) { paintChamber(c, A2); },
    sky(c, W, H, t, cam, T) { paintCavern(c, W, H, T); },
    overlay(c, FX, t, T) { },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m; m.noTouch = true; m.act = 'enter';
      Object.assign(M, { mod: null, X: null, bt: 0, hd: Math.PI / 2, hdTo: Math.PI / 2, rise: 0, taut: 0, slack: 0, fold: 0, dim: 0, dent: 0, dentTo: 0, ripple: 0, slam: 0, glow: 0.2, glowTo: 0.2, hush: 0, hushTo: 0, rear: 0, rearTo: 0,
        liftL: 0, liftR: 0, liftTo: [0, 0], tap: null, tapT: 1.2, tapSide: 0, recoil: 0, flinch: 0, reel: 0, nod: 0, feel: [0, 0], feelV: [0, 0], gait: 0, spdK: 0, turnK: 0, px: m.x, py: m.y, phd: Math.PI / 2,
        ph: null, sc: null, picks: 0, nextAct: null, lastOrd: -1, waves: [], darkR: [0, 0, 0], seen: {}, taught: false, demo: 0, wasStun: false, stunKind: null, end: null, exposed: false, expHits: 0, hpPrev: m.hp,
        stat: { phrases: 0, silences: 0, cones: 0, coneHit: 0, coneMiss: 0, rings: 0, ringHit: 0, ringMiss: 0, safeHold: 0, hushes: 0, staggers: 0, shuffles: 0, log: [] } });
      M.mod = stageMod(FX) || fakeMod(FX); M.X = stageX(FX); hookMod(FX, M); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; clearActs(FX, m, M); m.stunT = 0; M.recoil = 0.8; M.flinch = 1; M.ripple = 1;
      if (lv >= 3) { M.nextAct = 'beat'; M.coneTeach = true; } },
    ai(FX, m, dt) {
      const M = FX.mem, F = FX.S.fast; m.actT += dt; m.noTouch = true;
      switch (m.act) {
        case 'prowl': prowl(FX, m, M, dt); if (m.actT > (FX.S.lv >= 3 ? 0.9 : 1.4) / F) { m.actT = 0; choose(FX, m); } break;
        case 'beat': case 'silence': phraseStep(FX, m, M, dt); break;
        case 'shuffle': shuffleStep(FX, m, M, dt); break;
        default: toProwl(FX, m, M);
      }
      keepOut(FX, m);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; m.noTouch = true; FX.parts(bodyParts(m, M));
      if (Math.random() < dt * 5) { const a = Math.random() * TAU; FX.H.part({ kind: 'spark', x: m.x + Math.cos(a) * 1.2, y: m.y - 1.3 + Math.sin(a) * 0.6, vx: Math.cos(a) * 1.2, vy: -1.2, drag: 0.6, life: 0.6, max: 0.6, size: 3, color: Math.random() < 0.5 ? CORAL_HI : BONE_HI }); } },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.stat) return; M.bt += dt; const stun = m.stunT > 0 && !m.dead, bt = M.bt;
      if (!stun && M.wasStun) { M.wasStun = false; M.recoil = 0.5; M.stunKind = null; FX.H.text(m.x, m.y - 4.5, 'It finds its rhythm again', BONE_HI, 13); FX.H.sfx.thud(); }
      if (stun) M.wasStun = true;
      M.recoil = decay(M.recoil, dt, 2.4); M.flinch = decay(M.flinch, dt, 2.6); M.ripple = decay(M.ripple, dt, 1.1); M.slam = decay(M.slam, dt, 3.2);
      const mod = M.mod;
      // the entrance: its legs unfold beneath it, the membrane draws taut, the feelers lift, and three taps light the rings
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.rise = smooth((e - 0.2) / 1.3); M.taut = smooth((e - 1.0) / 0.9); M.glowTo = 0.25 + 0.5 * smooth((e - 1.2) / 0.8);
        if (e > 0.2 && e < 1.5 && Math.random() < dt * 14) dust(FX, m.x + FX.rnd(-2.6, 2.6), m.y + FX.rnd(-0.6, 1.6), 1.0, 2);
        for (let i = 0; i < 3; i++) if (M.demo === i && e > 1.95 + i * 0.45) { M.demo++; tapNow(FX, m, M, i % 2, true); const R = mod && mod.rings[i]; if (R) R.struck = 1; if (FX.H.sfx.note) FX.H.sfx.note(RING_NOTE[i], 0.35, 'sine', 0.45, RING_NOTE[i] * 0.7); } }
      else { M.rise = toward(M.rise, 1, dt, 4); M.taut = toward(M.taut, M.end ? 0 : 1, dt, M.end ? 1.6 : 3); }
      // the death: the membrane slackens, the legs fold under it, the rings fall dark one at a time
      if (M.end) { const E = M.end; E.t += dt; M.slack = smooth(E.t / 1.4); M.fold = smooth((E.t - 0.9) / 1.5); M.dim = smooth((E.t - 0.6) / 2.4); M.glowTo = 0;
        for (let i = 0; i < 3; i++) M.darkR[i] = smooth((E.t - 1.5 - i * 0.55) / 0.4);
        if (E.t < 2.6 && Math.random() < dt * 8) dust(FX, m.x + FX.rnd(-2.4, 2.4), m.y + FX.rnd(-0.6, 1.4), 0.7, 1); }
      else if (stun) { M.slack = toward(M.slack, 0.45, dt, 4); }
      else M.slack = toward(M.slack, 0, dt, 3);
      if (!M.taught && m.act === 'prowl') { M.taught = true; m.actT = -2.0; FX.H.banner('THE LIVING DRUM', 'It lights the numbered rings, then strikes them in that order. Step into a ring AFTER it strikes', '#FFFFFF', 3.0, true); }
      // the pose's moving parts: set by the acts each frame, eased here
      M.dent = toward(M.dent, M.dentTo, dt, M.dentTo > M.dent ? 7 : 14); M.dentTo = 0;
      M.rear = toward(M.rear, M.rearTo, dt, 6); M.rearTo = 0;
      M.hush = toward(M.hush, M.hushTo, dt, 5); M.hushTo = 0;
      M.glow = toward(M.glow, Math.max(M.glowTo, M.hush * 0.95, stun ? 0.75 : 0), dt, 5); M.glowTo = 0.25 + 0.08 * Math.sin(bt * 1.7);
      M.reel = toward(M.reel, stun ? 1 : 0, dt, stun ? 6 : 2.5);
      // the front legs: a phrase's wind-up raises both; between phrases one taps now and then
      const tp = M.tap; let tl = 0, tr = 0; if (tp) { tp.u += dt / 0.42; const k = tp.u < 0.62 ? smooth(tp.u / 0.62) : 1 - smooth((tp.u - 0.62) / 0.2); if (tp.side) tr = k * 0.55; else tl = k * 0.55; if (tp.u >= 0.82 && !tp.hit) { tp.hit = true; tapHit(FX, m, M, tp); } if (tp.u >= 1) M.tap = null; }
      M.liftL = toward(M.liftL, Math.max(M.liftTo[0], tl), dt, M.liftTo[0] > M.liftL ? 9 : 16); M.liftR = toward(M.liftR, Math.max(M.liftTo[1], tr), dt, M.liftTo[1] > M.liftR ? 9 : 16); M.liftTo = [0, 0];
      if (!stun && !M.end && m.act !== 'enter' && !M.ph) { M.tapT -= dt; if (M.tapT <= 0 && !M.tap) { M.tapT = 0.9 + Math.random() * 1.4; M.tapSide = 1 - M.tapSide; M.tap = { u: 0, side: M.tapSide, hit: false }; } }
      // heading, gait from how fast it moves and turns
      if (!stun && !M.end && m.act !== 'enter') M.hd = turnTo(M.hd, M.hdTo == null ? M.hd : M.hdTo, dt, M.sc ? 2.6 : 1.5);
      if (dt > 1e-4) { const sp = Math.hypot(m.x - M.px, m.y - M.py) / dt, tw = Math.abs(angTo(M.phd, M.hd)) / dt; M.px = m.x; M.py = m.y; M.phd = M.hd; M.spdK = toward(M.spdK, clamp(sp / 3.2, 0, 1), dt, 6); M.turnK = toward(M.turnK, clamp(tw / 1.2, 0, 1), dt, 6); }
      M.gait += dt * (1.2 + M.spdK * 8 + M.turnK * 5);
      // the feelers: springs toward where it listens (the pet, or down and still in the silence)
      { const me = FX.me, a = angTo(M.hd, Math.atan2(me.y - m.y, me.x - m.x)); for (let i = 0; i < 2; i++) { const want = M.end ? -0.9 : stun ? Math.sin(bt * 6 + i * 2) * 0.6 : M.hush > 0.3 ? -0.5 : clamp(a * 0.4, -0.6, 0.6) + Math.sin(bt * (1.3 + i * 0.4) + i) * 0.25; M.feelV[i] += (18 * (want - M.feel[i]) - 4 * M.feelV[i]) * dt; M.feel[i] += M.feelV[i] * dt; } }
      // the silence: the exposure, counted in blows; enough in one rest and the drum falters
      if (M.ph) { const w = M.ph.win; M.exposed = !!(w && M.ph.age >= w[0] && M.ph.age <= w[1]); } else M.exposed = false;
      if (M.exposed) M.hushTo = 1;
      if (mod && mod.hush) { mod.hush.on = M.exposed && !m.dead; mod.hush.x = m.x; mod.hush.y = m.y + 5.4; }
      // floor waves from strikes, travelling through their ring
      M.waves.forEach(w => w.t += dt); M.waves = M.waves.filter(w => w.t < w.life);
      if (!M.end && M.spdK > 0.3 && Math.random() < dt * 8) dust(FX, m.x + FX.rnd(-2.6, 2.6), m.y + FX.rnd(-0.4, 1.4), 0.5, 1);
      M.hpPrev = m.hp; },
    dmgK(FX, m, o) { const M = FX.mem; if (!M || !M.stat) return 1; M.recoil = Math.max(M.recoil || 0, 0.4); M.flinch = Math.max(M.flinch, 0.5); M.ripple = Math.max(M.ripple, 0.35);
      const open = M.exposed || (m.stunT > 0 && M.stunKind === 'falter');
      if (M.exposed && !(o && o.dot)) { M.expHits++; if (M.expHits >= 5 && !(m.stunT > 0)) falter(FX, m, M); }
      return open ? 1.75 : 1; },
    ending(FX, m) { const M = FX.mem; clearActs(FX, m, M); M.end = { t: 0 }; FX.H.sfx.hum(); const X = M.X; if (X) { try { CHO.ctx(X).silentT = 30; } catch (e) { /* no stage context */ } }
      if (M.mod && M.mod.hush) M.mod.hush.on = false;
      return { title: 'THE DRUM FALLS SILENT', sub: 'Tammor the Living Drum folds its legs', col: BONE_HI, delay: 4.4, bannerAt: 1.8 }; },
    camFocus(FX, m) { const M = FX.mem, me = FX.me; if (!M || !M.stat || m.act === 'enter') return null; const x = m.x, y = m.y - 1.4, d = Math.hypot(x - me.x, y - me.y) || 1; return { x, y, k: Math.min(0.32, 3.2 / d) }; },
    keep: { every: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t) { drawTammor(c, FX, m, X, Y, T, t); },
    drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (m && m.dead && M && M.end) drawTammor(c, FX, m, FX.sx(m.x), FX.sy(m.y), T, t); drawAir(c, FX, T, t); },
  };

  /* ---------- the stage's rings ---------- */
  // (the drum chamber's module is the stage's; the fiend reaches it through the Choir's running context for this game)
  function stageX(FX) { try { if (!FX.F || !FX.F.rift || !FX.H || !FX.H.g) return null; const C = CHO.ctx({ g: FX.H.g }); return C && C.X && C.X.Tz && C.X.rift ? C.X : null; } catch (e) { return null; } }
  function stageMod(FX) { const X = stageX(FX), R = X && X.rift; return R && R.self && R.self.mod && R.self.mod.rings ? R.self.mod : null; }
  function fakeMod(FX) { const C = FX.C, rings = A.rings.map(([r0, r1], i) => ({ i, n: i + 1, r0, r1, lit: 0, warn: 0, struck: 0 }));
    return { C, rings, ringOf: (x, y) => { const d = Math.hypot(x - C.x, y - C.y); for (const r of rings) if (d >= r.r0 && d < r.r1) return r.i; return -1; }, hush: { on: false, x: C.x, y: C.y }, fake: true }; }
  // the stage paints its rings on the ground; what Tammor adds to them (the waves, SAFE, the rings going dark) is laid on top
  function hookMod(FX, M) { const mod = M.mod; if (!mod || mod.fake || mod.tamHook) return; const f = mod.drawGround; mod.tamHook = true; mod.drawGround = c => { if (f) f.call(mod, c); ringLayer(c, FX); }; }
  function keepOut(FX, m) { const q = FX.clampArena(m, 3.0); m.x = q.x; m.y = q.y; }

  /* ---------- the fight's pieces ---------- */
  function dust(FX, x, y, r, n) {
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = r * (0.3 + Math.random() * 0.7), life = 0.7 + Math.random() * 0.6; FX.H.part({ kind: 'smoke', x: x + Math.cos(a) * d * 0.6, y: y + Math.sin(a) * d * 0.45, vx: Math.cos(a) * (1 + r * 0.9), vy: Math.sin(a) * (0.6 + r * 0.5) - 0.7, drag: 1.1, life, max: life, size: 0.5 + r * 0.2, color: Math.random() < 0.55 ? BONE_D : BONE }); } }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.6 : 1.1, true); }
  function clearRings(M) { const mod = M.mod; if (!mod) return; for (const R of mod.rings) { R.lit = 0; R.warn = 0; } if (mod.hush) mod.hush.on = false; }
  function cancelPhrase(M) { const Ph = M.ph; if (Ph) for (const s of Ph.slots) if (s.p && !s.p.fired) { if (s.p.cancel) s.p.cancel(); else { s.p.dmg = 0; s.p.fn = null; s.p.done = true; } } M.ph = null; M.exposed = false; clearRings(M); }
  function clearActs(FX, m, M) { cancelPhrase(M); M.sc = null; M.tap = null; m.act = 'prowl'; m.actT = 0; }
  function toProwl(FX, m, M) { if (M.ph) cancelPhrase(M); M.sc = null; m.act = 'prowl'; m.actT = 0; }
  function choose(FX, m) { const M = FX.mem; let k = M.nextAct; M.nextAct = null;
    if (!k) { k = CYC[M.picks % CYC.length]; M.picks++; }
    if (k === 'shuffle') startShuffle(FX, m); else startPhrase(FX, m, k === 'silence'); }
  /* ---- at rest: it turns on its six legs to face the pet, tapping the floor with its front pair ---- */
  function prowl(FX, m, M) { M.hdTo = FX.angPet(m.x, m.y); }
  // a tap of one front leg: a little ripple on the membrane, a puff of dust at the foot
  function tapNow(FX, m, M, side, big) { M.tap = { u: 0.3, side, hit: false, big }; }
  function tapHit(FX, m, M, tp) { M.ripple = Math.max(M.ripple, tp.big ? 0.8 : 0.4); const P = pose(m, M), L = legPose(P, M, tp.side ? -1 : 1, 0); dust(FX, L.foot[0], L.foot[1], 0.5, 2);
    if (tp.big) { FX.H.ring(L.foot[0], L.foot[1], 0.2, 1.6, 0.3, CORAL_HI, 0.2); FX.H.shake(3, 0.12); } }

  /* ---- Threefold Beat / Hold the Silence: a numbered phrase over the rings ---- */
  function startPhrase(FX, m, hush) { const M = FX.mem, F = FX.S.fast, P2 = FX.S.lv >= 3, X = M.X, C = (M.mod && M.mod.C) || FX.C;
    let oi = Math.floor(Math.random() * ORDERS.length); if (oi === M.lastOrd) oi = (oi + 1 + Math.floor(Math.random() * 3)) % ORDERS.length; M.lastOrd = oi;
    const slots = ORDERS[oi].map(i => ({ kind: 'ring', ring: i }));
    const a = FX.angPet(m.x, m.y);
    if (P2) { const k = Math.floor(Math.random() * 3); slots[k] = { kind: 'cone', ring: -1, a }; }
    if (hush) slots.splice(1 + (Math.random() < 0.5 ? 0 : 1), 0, { kind: 'hush' });
    const gap = (P2 ? 1.4 : 1.6) / F, hushGap = 2.4 / F; let at = (P2 ? 3.0 : 3.4) / F;
    slots.forEach((s, i) => { if (i > 0) at += slots[i - 1].kind === 'hush' ? hushGap : gap; s.at = at; s.rv = 0.3 + i * 0.5; s.n = i + 1; });
    const h = slots.findIndex(s => s.kind === 'hush'), win = h > 0 ? [slots[h - 1].at + 0.2, h < slots.length - 1 ? slots[h + 1].at - 0.75 : slots[h].at + 1.6] : null;
    M.ph = { slots, age: 0, hush, cone: P2, oi, order: ORDERS[oi].slice(), win, cx: m.x, cy: m.y, a, C, X, end: slots[slots.length - 1].at + 0.8 };
    M.expHits = 0; m.act = hush ? 'silence' : 'beat'; m.actT = 0; M.stat.phrases++; if (hush) M.stat.silences++; FX.H.sfx.hum();
    if (P2 && (M.coneTeach || !M.seen.cone)) { M.coneTeach = false; M.seen.cone = true; FX.H.banner('THE FRONTAL BEAT', 'Now one beat is a CONE from its head (shown in the same numbered phrase): get round its SIDE', WARN, 2.8, true); }
    else if (hush) say(FX, 'silence', 'HOLD THE SILENCE', 'One beat is empty (the closed mouth). In that rest its membrane is EXPOSED: strike it!', BONE_HI);
    else say(FX, 'beat', 'THREEFOLD BEAT', 'The rings light in order, then strike in that order. A ring is SAFE once it has struck', CORAL_HI); }
  function mkBeat(FX, m, M, s) { const Ph = M.ph, X = Ph.X, C = Ph.C, t = Math.max(0.3, s.at - Ph.age), fn = (p, hit) => resolve(FX, FX.m, M, s, hit);
    let o;
    if (s.kind === 'ring') { const R = M.mod.rings[s.ring]; o = { shape: 'ring', x: C.x, y: C.y, r0: R.r0, r1: R.r1, n: s.n, t, lead: t, dmg: m.dmg * 1.3, src: m, fn }; }
    else if (s.kind === 'cone') o = { shape: 'cone', x: Ph.cx, y: Ph.cy, a: s.a, len: 13, spread: 0.44, r0: 0, n: s.n, t, lead: t, dmg: m.dmg * 1.5, src: m, fn, label: 'FRONTAL' };
    else o = { shape: 'disc', x: m.x, y: m.y + 4.4, r1: 0.9, n: s.n, t, lead: t, hush: true, fn };
    if (X) return CHO.beat(X, o);
    // (no stage context: the fight's own telegraphs stand in, with the same timing)
    const sh = o.shape === 'disc' ? { shape: 'circle', r: o.r1 } : o.shape === 'ring' ? { shape: 'ring', r0: o.r0, r1: o.r1 } : { shape: 'cone', len: o.len, spread: o.spread };
    const tl = FX.tele(Object.assign(sh, { x: o.x, y: o.y, a: o.a, t, dmg: o.hush ? 0 : o.dmg, col: o.hush ? BONE_HI : WARN, fn: q => { const me = FX.me; fn(q, !o.hush && FX.inShape(q, me.x, me.y, me.r * 0.6) && !me.dodge); } }));
    return { get t() { return Math.max(0, tl.t - tl.age); }, get fired() { return tl.done; }, cancel() { tl.dmg = 0; tl.fn = null; tl.done = true; } }; }
  function phraseStep(FX, m, M, dt) { const Ph = M.ph; if (!Ph) { toProwl(FX, m, M); return; } Ph.age += dt; const mod = M.mod;
    let next = null;
    for (const s of Ph.slots) {
      if (!s.p && Ph.age >= s.rv) { s.p = mkBeat(FX, m, M, s); s.lit = 1;   // revealed: its ring flares and sounds its note
        if (s.kind === 'ring') { if (FX.H.sfx.note) FX.H.sfx.note(RING_NOTE[s.ring] * 2, 0.3, 'sine', 0.22); FX.H.ring(Ph.C.x, Ph.C.y, Math.max(0.2, mod.rings[s.ring].r0), mod.rings[s.ring].r1, 0.35, CORAL_HI, 0.18); }
        else if (FX.H.sfx.blip) FX.H.sfx.blip(); }
      if (s.lit) s.lit = Math.max(0, s.lit - dt * 2.2);
      if (s.p && !s.fired && !next && s.kind !== 'hush') next = s; }
    // the rings: pending ones glow coral (brighter the next to strike), red at the rim as it comes; resolved ones go quiet
    for (const R of mod.rings) { const s = Ph.slots.find(q => q.kind === 'ring' && q.ring === R.i);
      if (!s || !s.p || s.fired) { R.lit = 0; R.warn = 0; continue; }
      const tl = s.p.t; R.lit = Math.max(s.lit || 0, s === next ? 0.55 + 0.25 * Math.sin(Ph.age * 9) : 0.3); R.warn = s === next ? clamp(1 - tl / 1.3, 0, 1) : 0; }
    // the body: it faces the pet (or the cone it is about to sound), and winds up for the next beat: both front legs up,
    // the membrane pressed down, deeper the nearer the strike
    if (next) { const tl = next.p.t, w = clamp(1 - tl / 0.75, 0, 1), k = smooth(w);
      M.liftTo = [k, k * 0.92]; M.dentTo = k; M.glowTo = 0.35 + 0.4 * k;
      if (next.kind === 'cone') { M.hdTo = next.a; M.rearTo = smooth(clamp(1 - tl / 1.4, 0, 1)); }
      else M.hdTo = FX.angPet(m.x, m.y); }
    else M.hdTo = FX.angPet(m.x, m.y);
    if (Ph.slots.some(s => s.kind === 'cone' && s.p && !s.fired)) { const s = Ph.slots.find(q => q.kind === 'cone' && !q.fired); if (s && s.p && s.p.t < 2.2) M.hdTo = s.a; }
    if (M.exposed) { M.liftTo = [0, 0]; M.dentTo = 0; }
    if (Ph.age >= Ph.end && Ph.slots.every(s => s.fired)) { M.ph = null; clearRings(M); toProwl(FX, m, M); } }
  /* a beat resolves: a ring's shockwave, the cone's blast, or the silence passing */
  function resolve(FX, m, M, s, hit) { const Ph = M.ph; s.fired = true; if (!m || m.dead || !Ph) return; const me = FX.me, C = Ph.C, mod = M.mod;
    const pr = mod.ringOf(me.x, me.y), resolved = Ph.slots.filter(q => q.kind === 'ring' && q.fired && q !== s).map(q => q.ring);
    M.stat.log.push({ n: s.n, kind: s.kind, ring: s.ring, petRing: pr, hit: !!hit, safeRing: resolved.includes(pr), t: +Ph.age.toFixed(2) });
    if (M.stat.log.length > 60) M.stat.log.shift();
    if (s.kind === 'hush') { M.stat.hushes++; FX.H.ring(m.x, m.y, 0.4, 3.2, 0.5, BONE_HI, 0.18); FX.H.text(m.x, m.y - 4.2, '. . .', BONE_HI, 16); return; }
    M.slam = 1; M.ripple = 1; M.dent = 0; M.liftL = M.liftR = 0; M.recoil = Math.max(M.recoil, 0.25);
    if (FX.H.sfx.note) FX.H.sfx.note(s.kind === 'ring' ? RING_NOTE[s.ring] : 62, 0.5, 'sine', 0.55, (s.kind === 'ring' ? RING_NOTE[s.ring] : 62) * 0.6); FX.H.sfx.thud(); FX.H.shake(4, 0.18);
    const P = pose(m, M); for (const sd of [-1, 1]) { const L = legPose(P, M, sd, 0); dust(FX, L.foot[0], L.foot[1], 0.8, 3); }
    if (s.kind === 'ring') { const R = mod.rings[s.ring]; R.struck = 1; R.lit = 0; R.warn = 0; M.stat.rings++; if (hit) M.stat.ringHit++; else M.stat.ringMiss++; if (!hit && resolved.includes(pr)) M.stat.safeHold++;
      FX.H.ring(C.x, C.y, Math.max(0.2, R.r0), R.r1, 0.5, CORAL_HI, 0.3); M.waves.push({ ring: s.ring, t: 0, life: 0.9 });
      for (let i = 0; i < 10; i++) { const a = Math.random() * TAU, d = lerp(R.r0, R.r1, 0.2 + Math.random() * 0.6); if (Math.random() < 0.6) dust(FX, C.x + Math.cos(a) * d, C.y + Math.sin(a) * d, 0.6, 1); }
      if (hit) FX.H.text(me.x, me.y - 1.6, 'Struck by the beat!', WARN, 15); }
    else { M.stat.cones++; if (hit) M.stat.coneHit++; else M.stat.coneMiss++; const ca = Math.cos(s.a), sa = Math.sin(s.a);
      for (let k = 1; k <= 4; k++) { const d = k * 3; FX.H.after(k * 0.05, () => { FX.H.ring(Ph.cx + ca * d, Ph.cy + sa * d, 0.3, 1 + k * 0.7, 0.35, CORAL_HI, 0.25); dust(FX, Ph.cx + ca * d, Ph.cy + sa * d, 0.8, 2); }); }
      FX.H.flash(0.05, CORAL_HI); if (hit) FX.H.text(me.x, me.y - 1.6, 'The frontal beat!', WARN, 15); } }
  /* the drum falters: enough blows landed in a silence break its rhythm; the rest of the phrase is broken off */
  function falter(FX, m, M) { cancelPhrase(M); m.act = 'prowl'; m.actT = 0; m.stunT = Math.max(m.stunT || 0, 2.4); M.stunKind = 'falter'; M.stat.staggers++; M.recoil = 1; M.ripple = 1;
    FX.H.sfx.crash(); FX.H.shake(6, 0.25); FX.H.ring(m.x, m.y, 0.5, 4, 0.5, BONE_HI, 0.3); const first = !M.seen.falter; M.seen.falter = true;
    FX.H.banner('THE DRUM FALTERS', first ? 'You broke its rhythm: its membrane stays open. Strike it!' : 'Strike the membrane!', CORAL_HI, first ? 2.0 : 1.0, true); }

  /* ---- Shuffle: on its six legs to new ground, clear of the badges' column at the north ---- */
  function startShuffle(FX, m) { const M = FX.mem, C = FX.C, F = FX.S.fast; let to = null;
    for (let k = 0; k < 40 && !to; k++) { const a = Math.random() * TAU, d = 2.5 + Math.random() * 5.5, x = C.x + Math.cos(a) * d, y = C.y + Math.sin(a) * d;
      if (Math.hypot(x - m.x, y - m.y) < 3.5) continue; if (Math.abs(x - C.x) < 3.4 && y < C.y + 1) continue; to = { x, y }; }
    if (!to) to = { x: C.x + (m.x > C.x ? -5 : 5), y: C.y + 2 };
    const d = Math.hypot(to.x - m.x, to.y - m.y); m.act = 'shuffle'; m.actT = 0; M.sc = { t: 0, dur: (0.5 + d / 3.0) / F, x0: m.x, y0: m.y, x1: to.x, y1: to.y, a: Math.atan2(to.y - m.y, to.x - m.x) }; M.stat.shuffles++; FX.H.sfx.whoosh(); }
  function shuffleStep(FX, m, M, dt) { const S = M.sc; if (!S) { toProwl(FX, m, M); return; } S.t += dt; const k = smooth(S.t / S.dur); m.x = lerp(S.x0, S.x1, k); m.y = lerp(S.y0, S.y1, k);
    M.hdTo = S.t < S.dur * 0.75 ? S.a : FX.angPet(m.x, m.y);
    if (S.t >= S.dur) { M.sc = null; toProwl(FX, m, M); } }

  /* ---------- the body: where everything is ---------- */
  function pose(m, M) {
    const hd = M.hd == null ? Math.PI / 2 : M.hd, bt = M.bt || 0, rc = M.recoil || 0, rise = M.rise == null ? 1 : M.rise, fold = M.fold || 0, rear = M.rear || 0, rl = M.reel || 0, sl = M.slam || 0;
    const cf = Math.cos(hd), sf = Math.sin(hd), br = Math.sin(bt * 1.4) * 0.03, sp = M.spdK || 0, gait = M.gait || 0;
    const B = { x: m.x - cf * rc * 0.3, y: m.y - sf * rc * 0.3 };
    const W0 = RiftFiend.frame(B, hd, { z: -(1 - rise) * 0.32 - fold * 0.36 + br * (1 - fold) + rear * 0.12 - sl * 0.08 + Math.max(M.liftL || 0, M.liftR || 0) * 0.04,
      pitch: rc * 0.07 + rear * 0.16 + Math.max(M.liftL || 0, M.liftR || 0) * 0.07 - sl * 0.06 + rl * 0.05 * Math.sin(bt * 5) - fold * 0.03, roll: Math.sin(bt * 0.8) * 0.012 + sp * Math.sin(gait * 2) * 0.03 + rl * 0.06 * Math.sin(bt * 4.3) });
    const O = W0(0, 0, 0), dirW = (u, v, h) => sub3(W0(u, v, h), O);
    return { hd, cf, sf, B, W0, dirW, O, br, rise, fold, bt, fw: [cf, sf] };
  }
  // a point on the drum at angle a (from its heading), radius r, height h
  /* the legs: three a side; the hip under the shell's belly, the knee up and out, a blunt bone hoof on the floor. The front
     pair are the drumming legs: lifted they swing forward and high; folded in death they tuck under */
  function legPose(P, M, sd, k) { const sp = M.spdK || 0, tk = M.turnK || 0, fold = P.fold, rise = P.rise, gait = M.gait || 0;
    const ph = gait + ((k % 2 === 0) !== (sd > 0) ? Math.PI : 0) + k * 0.25, gl = Math.max(0, Math.sin(ph)) * (0.34 * sp + 0.18 * tk + 0.03), gu = Math.cos(ph) * (0.3 * sp + 0.12 * tk);
    const dl = k === 0 ? (sd > 0 ? M.liftL || 0 : M.liftR || 0) : 0, tuck = (1 - rise) * 0.8 + fold;
    const a0 = sd * LEGA[k], aF = sd * lerp(LEGA[k], 0.5, dl);
    const hip = ring3(P, a0, 1.8, 0.5);
    const kr = lerp(2.78, 3.15, dl) - tuck * 0.35, kh = 1.3 + gl * 0.4 + dl * 1.45 - tuck * 0.72;
    const knee = add3(ring3(P, lerp(a0, aF, 0.6), kr, kh), P.dirW(gu * 0.5, 0, 0));
    const fr = lerp(3.3, 3.75, dl) - tuck * 0.95, fh = gl + dl * 1.7;
    let foot = add3(ring3(P, aF, fr, 0), P.dirW(gu * 1.3, 0, 0)); foot = [foot[0], foot[1], Math.max(0, fh)];
    return { hip, knee, foot, dl }; }
  function headPose(P, M) { const W0 = P.W0, nod = (M.hush || 0) * 0.5 + (M.rear || 0) * -0.25 + Math.sin(P.bt * 1.1) * 0.05 + (M.flinch || 0) * 0.25 + P.fold * 0.5;
    return { BTL: W0(1.55, 0.46, 0.86), BTR: W0(1.55, -0.46, 0.86), BBL: W0(1.55, 0.5, 0.3), BBR: W0(1.55, -0.5, 0.3), RB: W0(1.55, 0, 1.04),
      TT: W0(2.62, 0, 0.62 - nod * 0.3), TL: W0(2.5, 0.16, 0.46 - nod * 0.3), TR: W0(2.5, -0.16, 0.46 - nod * 0.3), TB: W0(2.44, 0, 0.26 - nod * 0.2), nod }; }
  function feelerPose(P, M, H, sd) { const i = sd > 0 ? 0 : 1, f = (M.feel || [0, 0])[i], W0 = P.W0, droop = H.nod * 0.6;
    const b = W0(2.05, sd * 0.2, 0.84 - H.nod * 0.2), m1 = W0(2.85 + f * 0.1, sd * (0.62 + f * sd * 0.3), 1.35 - droop + f * 0.12), tip = W0(3.6 + f * 0.2, sd * (1.25 + f * sd * 0.6), 1.55 - droop * 1.5 + f * 0.2);
    return { pts: [b, lerp3(b, m1, 0.5), m1, lerp3(m1, tip, 0.5), tip], tip }; }
  function bodyParts(m, M) { const P = pose(m, M), H = headPose(P, M); return [hit('bd', P.W0(0, 0, 0.9), 2.3, m), hit('hd', lerp3(H.RB, H.TT, 0.5), 0.8, m), hit('ft', ring3(P, Math.PI, 2.6, 0.4), 0.9, m)]; }

  /* ---------- painting Tammor ---------- */
  function toneOf(R, lit) { return lit > 0.62 ? R.hi : lit > 0.22 ? R.col : lit > -0.12 ? R.sh : R.sh2; }
  // a material's tones, greyed and darkened as the life goes out of it
  function dimR(R, k) { if (!(k > 0.01)) return R; const g = '#2A2026'; return { hi: mix(R.hi, g, k * 0.45), col: mix(R.col, g, k * 0.4), sh: mix(R.sh, g, k * 0.3), sh2: R.sh2 }; }
  /* one flat face of a solid: filled by how the light lands on it, a hot edge along its lit rim, inked */
  function face(c, S, n, R, lw, o) { o = o || {}; const lit = dot3(n, LIGHT) + (o.bias || 0), col = o.fill || toneOf(R, lit);
    path(c, S); c.fillStyle = col; c.fill();
    if (K.Q.flash > 0) { c.fillStyle = 'rgba(255,244,236,.18)'; c.fill(); }
    if (o.inner) { c.save(); c.clip(); o.inner(c, S, lit); c.restore(); path(c, S); }
    if (o.line !== false) { c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); }
    if (lit > 0.3 && o.rim !== false) { const ce = S.reduce((q, p) => [q[0] + p[0] / S.length, q[1] + p[1] / S.length], [0, 0]); c.strokeStyle = rgba(o.hot || '#FFFFFF', o.hotA || 0.55); c.lineWidth = Math.max(1, lw * 0.6); c.beginPath();
      for (let i = 0; i < S.length; i++) { const a = S[i], b = S[(i + 1) % S.length], mx = (a[0] + b[0]) / 2 - ce[0], my = (a[1] + b[1]) / 2 - ce[1], ml = Math.hypot(mx, my) || 1; if ((mx * LSCR[0] + my * LSCR[1]) / ml < 0.45) continue; const ia = [lerp(a[0], ce[0], 0.12), lerp(a[1], ce[1], 0.12)], ib = [lerp(b[0], ce[0], 0.12), lerp(b[1], ce[1], 0.12)]; c.moveTo(ia[0], ia[1]); c.lineTo(ib[0], ib[1]); } c.stroke(); }
    return lit; }
  function drawTammor(c, FX, m, X, Y, T, t) {
    const M = FX.mem || {}, P = pose(m, M), P3 = TN.cam(X, Y, T, m), pr = w => P3(w[0], w[1], w[2]), lw = Math.max(1.3, T * 0.055), parts = [], dim = M.dim || 0;
    const SR = dimR(SHELL, dim), LR = dimR(LEGR, dim), HR = dimR(HEADR, dim), BR = dimR(BONER, dim * 0.8), GR = dimR(GOLDR, dim * 0.8), CR = dimR(CORR, dim);
    // its shadow on the floor, a soft dark under the shell and a wider one under the legs
    { const g0 = P3(P.B.x, P.B.y + 0.3, 0), k = 1 - (P.fold || 0) * 0.2; K.shade(c, g0[0] + T * 0.25, g0[1] + T * 0.15, T * 3.9 * k, T * 2.6 * k, 0.42, '#1A0C16'); K.shade(c, g0[0] + T * 0.15, g0[1], T * 2.5, T * 1.8, 0.4, '#12060E'); }
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const L = legPose(P, M, sd, k); parts.push({ at: [L.knee[0], L.knee[1], 0.2], draw: () => drawLeg(c, pr, T, lw, L, LR, BR, GR, CR, k) }); }
    const H = headPose(P, M); parts.push({ at: P.W0(1.95, 0, 0.3), draw: () => drawHead(c, pr, P3, T, lw, P, M, H, HR, BR, CR) });
    parts.push({ at: P.W0(0, 0, 0.55), draw: () => drawBody(c, pr, P3, T, lw, P, M, SR, BR, GR, CR, t) });
    sorted(parts).forEach(p => p.draw());
    // faltering: little bone-white stars over the membrane
    if ((M.reel || 0) > 0.4 && m.stunT > 0) { const q = pr(P.W0(0, 0, 2.4)), bt = M.bt || t; for (let i = 0; i < 5; i++) { const a = bt * 3.2 + i * TAU / 5; TN.twinkle(c, q[0] + Math.cos(a) * T * 1.4, q[1] + Math.sin(a) * T * 0.35, T * (i % 2 ? 0.22 : 0.16), i % 2 ? '#FFFFFF' : CORAL_HI, 0.95); } } }

  /* the drum: the shell's bevelled plates (two courses round it), the bone lacing over the upper course, the gold counter-hoop
     at its belly, the hoop's inner wall, the membrane, the maroon lip with its gold studs, and the three gold spikes */
  function drawBody(c, pr, P3, T, lw, P, M, SR, BR, GR, CR, t) {
    const cen = P.W0(0, 0, 0.7), N = NSEG, bt = P.bt, dent = M.dent || 0, slack = M.slack || 0;
    const ang = i => i / N * TAU;
    // the shell's courses: lower (dark, under the belly) and upper (the plates); each plate a flat facet
    const vis = [];
    for (let band = 0; band < 2; band++) for (let i = 0; i < N; i++) { const a0 = ang(i), a1 = ang(i + 1), [r0, h0] = PROF[band], [r1, h1] = PROF[band + 1];
      const Q = [ring3(P, a0, r0, h0), ring3(P, a1, r0, h0), ring3(P, a1, r1, h1), ring3(P, a0, r1, h1)], n = outN(Q, cen);
      if (dot3(n, VIEW) <= 0.02) continue; vis.push({ band, i, Q, n }); }
    vis.filter(f => f.band === 0).forEach(f => face(c, f.Q.map(pr), f.n, SR, lw, { bias: -0.25, rim: false }));
    vis.filter(f => f.band === 1).forEach(f => face(c, f.Q.map(pr), f.n, SR, lw, { inner: (g, S, lit) => plateDetail(g, pr, f, P, T, lw, lit) }));
    // the counter-hoop: a band of tarnished gold round the belly, studded
    { const pts = []; for (let i = 0; i <= N * 2; i++) { const a = i / (N * 2) * TAU, p = ring3(P, a, PROF[1][0] + 0.03, PROF[1][1]), n = norm3(sub3(p, P.W0(0, 0, PROF[1][1]))); if (dot3(n, VIEW) > -0.05) pts.push(pr(p)); else if (pts.length > 1) break; }
      if (pts.length > 1) { CHO.tube(c, pts, T * 0.15, GR.col, lw * 0.8, { hi: 0.7 }); } }
    // the lacing: bone cords zigzag from the rim's studs down to the hoop and back up, taut as a drum's
    const vI = new Set(vis.filter(f => f.band === 1).map(f => f.i));
    for (let i = 0; i < N; i++) { if (!vI.has(i)) continue; const a0 = ang(i), am = ang(i + 0.5), a1 = ang(i + 1), sag = slack * 0.12;
      const top0 = ring3(P, a0, PROF[2][0] + 0.03, PROF[2][1] - 0.06), bot = ring3(P, am, PROF[1][0] + 0.06, PROF[1][1] + 0.04), top1 = ring3(P, a1, PROF[2][0] + 0.03, PROF[2][1] - 0.06);
      for (const [p0, p1] of [[top0, bot], [bot, top1]]) { const mid = add3(lerp3(p0, p1, 0.5), [0, 0, -sag]); const S = [pr(p0), pr(mid), pr(p1)];
        c.save(); c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = T * 0.1 + lw; poly(c, S); c.stroke(); c.strokeStyle = BR.sh; c.lineWidth = T * 0.1; c.stroke(); c.strokeStyle = BR.col; c.lineWidth = T * 0.065; poly(c, S.map(q => [q[0] - T * 0.012, q[1] - T * 0.012])); c.stroke(); c.strokeStyle = rgba(BR.hi, 0.85); c.lineWidth = T * 0.025; poly(c, S.map(q => [q[0] - T * 0.025, q[1] - T * 0.025])); c.stroke(); c.restore(); }
      // the knot where two cords meet the hoop
      const bq = pr(bot); TN.shape(c, TN.ell(bq[0], bq[1], T * 0.09, T * 0.07), Object.assign({ lw: lw * 0.7, r: T * 0.09, spec: false, force: true }, tubeS(BR))); }
    // the hoop's inner wall (only its far half shows, above the membrane)
    const lipIn = i => ring3(P, ang(i), LIP[1][0], LIP[1][1]), memE = (i, h) => ring3(P, ang(i), MEM_R, h);
    for (let i = 0; i < N; i++) { const Q = [lipIn(i), lipIn(i + 1), memE(i + 1, MEM_H - 0.04), memE(i, MEM_H - 0.04)], n = mul3(outN(Q, cen), -1); if (dot3(n, VIEW) <= 0.02) continue; face(c, Q.map(pr), n, SR, lw * 0.8, { bias: -0.5, rim: false }); }
    drawMembrane(c, pr, P3, T, lw, P, M, BR, CR, t);
    // the lip: a maroon hoop of facets over the membrane's edge, gold studs round it
    for (let i = 0; i < N; i++) { const Q = [ring3(P, ang(i), LIP[0][0], LIP[0][1]), ring3(P, ang(i + 1), LIP[0][0], LIP[0][1]), lipIn(i + 1), lipIn(i)], n = outN(Q, P.W0(0, 0, 0)); if (dot3(n, VIEW) <= 0) continue; face(c, Q.map(pr), n, SR, lw, { bias: -0.15 }); }
    { const pts = []; for (let i = 0; i <= N * 2; i++) pts.push(pr(ring3(P, i / (N * 2) * TAU, LIP[1][0] - 0.01, LIP[1][1] - 0.02))); c.strokeStyle = INK; c.lineWidth = T * 0.1; poly(c, pts); c.stroke(); c.strokeStyle = GR.sh; c.lineWidth = T * 0.07; c.stroke(); c.strokeStyle = rgba(GR.hi, 0.85); c.lineWidth = Math.max(1, T * 0.025); poly(c, pts.map(q => [q[0], q[1] + T * 0.02])); c.stroke(); }
    for (let i = 0; i < N; i++) { const p = pr(ring3(P, ang(i + 0.5), (LIP[0][0] + LIP[1][0]) / 2, (LIP[0][1] + LIP[1][1]) / 2 + 0.03)), r = T * 0.085; TN.shape(c, TN.ell(p[0], p[1], r, r * 0.8), Object.assign({ lw: lw * 0.7, r, d1: 0.18, d2: 0.3, spec: 0.7, specAt: [p[0] - r * 0.35, p[1] - r * 0.35], specR: 0.3, force: true }, tubeS(GR))); }
    // the three spikes, far to near
    SPIKES.map(a => ({ a, at: ring3(P, a, 2.0, 1.3) })).sort((p, q) => p.at[1] + p.at[2] * 0.35 - (q.at[1] + q.at[2] * 0.35)).forEach(s => drawSpike(c, pr, T, lw, P, M, s.a, GR, SR)); }
  // an upper plate's detail: a seam down its middle, a gold stud at its top, a worn coral stain low on some
  function plateDetail(g, pr, f, P, T, lw, lit) { const Q = f.Q, mid = (u, v) => lerp3(lerp3(Q[0], Q[1], u), lerp3(Q[3], Q[2], u), v);
    // a shade at the plate's base where it meets the hoop, a lit band along its top
    let p0 = pr(mid(0.5, 0)), p1 = pr(mid(0.5, 1)); const gr = g.createLinearGradient(p0[0], p0[1], p1[0], p1[1]); gr.addColorStop(0, 'rgba(20,6,16,.35)'); gr.addColorStop(0.4, 'rgba(20,6,16,0)'); gr.addColorStop(0.66, `rgba(255,230,240,${lit > 0.2 ? 0.14 : 0.05})`); gr.addColorStop(0.84, 'rgba(255,230,240,0)'); gr.addColorStop(0.9, 'rgba(20,6,16,.2)'); gr.addColorStop(1, 'rgba(20,6,16,.5)'); g.fillStyle = gr; g.fillRect(Math.min(p0[0], p1[0]) - T * 2, Math.min(p0[1], p1[1]) - T, T * 4, Math.abs(p1[1] - p0[1]) + T * 2);
    // pitting in the shell
    const R = mulberry32(700 + f.i * 13); for (let k = 0; k < 5; k++) { const p = pr(mid(0.15 + R() * 0.7, 0.15 + R() * 0.7)), s = T * (0.025 + R() * 0.03); g.fillStyle = 'rgba(16,4,12,.4)'; g.beginPath(); g.arc(p[0], p[1], s, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,220,235,.18)'; g.beginPath(); g.arc(p[0] - s * 0.5, p[1] - s * 0.5, s * 0.5, 0, TAU); g.fill(); }
    if (f.i % 3 === 1) { const p = pr(mid(0.5, 0.25)); const gg = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], T * 0.35); gg.addColorStop(0, rgba(CORAL_D, 0.35)); gg.addColorStop(1, rgba(CORAL_D, 0)); g.fillStyle = gg; g.fillRect(p[0] - T * 0.4, p[1] - T * 0.4, T * 0.8, T * 0.8); } }
  /* the membrane: pale bone stretched in the hoop, lit from within; it presses down before a strike (a bowl: shaded on the
     side toward the light, bright on the far slope, its tension rings sinking), rebounds in ripples after, glows coral in the
     silence, and hangs slack and wrinkled in death */
  function drawMembrane(c, pr, P3, T, lw, P, M, BR, CR, t) {
    const N = 40, bt = P.bt, dent = (M.dent || 0) * 0.5 + (M.slack || 0) * 0.22, rip = M.ripple || 0, glow = M.glow || 0, hush = M.hush || 0, slack = M.slack || 0, taut = M.taut == null ? 1 : M.taut;
    const surf = (r, a) => { const u = r / MEM_R, sag = dent * (1 - u * u) + (1 - taut) * 0.08 * (1 - u * u), w = slack * 0.035 * Math.sin(a * 5 + r * 4 + bt * 0.6) * u + rip * 0.03 * Math.sin(r * 9 - bt * 18) * (1 - u); return ring3(P, a, r, MEM_H - sag + w + Math.sin(bt * 1.4) * 0.01); };
    const edge = []; for (let i = 0; i < N; i++) edge.push(pr(surf(MEM_R, i / N * TAU)));
    const C0 = pr(surf(0, 0)), Cr = pr(ring3(P, 0, 0, MEM_H)), Rs = MEM_R * T;
    c.save(); path(c, edge); c.fillStyle = BR.col; c.fill(); c.clip();
    // the skin's own tone: lighter toward the key light, deeper at the far side
    let g = c.createLinearGradient(Cr[0] - Rs, Cr[1] - Rs, Cr[0] + Rs, Cr[1] + Rs); g.addColorStop(0, BR.hi); g.addColorStop(0.45, BR.col); g.addColorStop(1, BR.sh); c.fillStyle = g; c.fillRect(Cr[0] - Rs * 1.2, Cr[1] - Rs * 1.3, Rs * 2.4, Rs * 2.6);
    // the light inside it (subsurface): warm coral at the heart, stronger as it winds up and in the silence
    const gk = clamp(0.25 + glow * 0.6 + hush * 0.25, 0, 1);
    g = c.createRadialGradient(C0[0], C0[1], 0, C0[0], C0[1], Rs * 1.05); g.addColorStop(0, rgba(mix(CORAL_HI, '#FFE6CC', hush * 0.5), 0.55 * gk)); g.addColorStop(0.45, rgba(CORAL, 0.28 * gk)); g.addColorStop(1, rgba(CORAL_D, 0.0)); c.fillStyle = g; c.fillRect(Cr[0] - Rs * 1.2, Cr[1] - Rs * 1.3, Rs * 2.4, Rs * 2.6);
    // mottling in the skin, and the veins of coral light under it, branching in from the hoop
    { const R = mulberry32(4242); for (let i = 0; i < 16; i++) { const a = R() * TAU, r = Math.sqrt(R()) * MEM_R * 0.9, q = pr(surf(r, a)), s2 = T * (0.18 + R() * 0.3); const gg = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], s2); gg.addColorStop(0, rgba(R() < 0.5 ? BR.sh : '#FFFFFF', 0.14)); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(q[0] - s2, q[1] - s2, s2 * 2, s2 * 2); }
      c.lineCap = 'round'; c.lineJoin = 'round'; const va = clamp(0.35 + glow * 0.5 + hush * 0.3 - (M.dim || 0), 0, 1);
      for (let i = 0; i < 9; i++) { const a0 = i / 9 * TAU + R() * 0.4; let a = a0, r = MEM_R * 0.97; const pts = [pr(surf(r, a))], br = [];
        for (let k = 0; k < 6; k++) { r -= MEM_R * (0.08 + R() * 0.06); a += (R() - 0.5) * 0.35; pts.push(pr(surf(r, a))); if (k === 2) br.push([r, a]); }
        const vein = (P2, w) => { c.strokeStyle = rgba(CORAL, 0.14 * va); c.lineWidth = T * w * 3; poly(c, P2); c.stroke(); c.strokeStyle = rgba(CORAL_D, 0.45 * va); c.lineWidth = Math.max(0.8, T * w); poly(c, P2); c.stroke(); };
        vein(pts, 0.035); for (const [r1, a1] of br) { const P2 = [pr(surf(r1, a1))]; let rr = r1, aa = a1, d = R() < 0.5 ? 1 : -1; for (let k = 0; k < 3; k++) { rr -= MEM_R * 0.07; aa += d * 0.18; P2.push(pr(surf(rr, aa))); } vein(P2, 0.022); } } }
    // the bowl: dark on the slope toward the light, a bright crescent on the far slope
    if (dent > 0.02) { const k = clamp(dent / 0.42, 0, 1), ox = -LSCR[0] * Rs * 0.34, oy = -LSCR[1] * Rs * 0.34;
      g = c.createRadialGradient(C0[0] + ox, C0[1] + oy, Rs * 0.05, C0[0], C0[1], Rs * 0.95); g.addColorStop(0, rgba(BONE_HI, 0.6 * k)); g.addColorStop(0.38, rgba(BR.col, 0.0)); g.addColorStop(0.7, rgba(BR.sh2, 0.62 * k)); g.addColorStop(1, rgba(BR.sh2, 0.1 * k)); c.fillStyle = g; c.fillRect(Cr[0] - Rs * 1.2, Cr[1] - Rs * 1.3, Rs * 2.4, Rs * 2.6); }
    // the tension rings: circles of the skin, sinking with the bowl
    for (const f of [0.3, 0.56, 0.8]) { const pts = []; for (let i = 0; i <= 32; i++) pts.push(pr(surf(MEM_R * f, i / 32 * TAU)));
      c.strokeStyle = rgba(BR.sh2, 0.42); c.lineWidth = Math.max(1, T * 0.03); poly(c, pts); c.stroke(); c.strokeStyle = rgba('#FFFFFF', 0.3); c.lineWidth = Math.max(0.8, T * 0.02); poly(c, pts.map(p => [p[0] + T * 0.03, p[1] + T * 0.035])); c.stroke(); }
    // the creases where the hoop pulls it taut (or wrinkles, slack)
    c.lineCap = 'round'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.13; const pts = []; for (let k = 0; k <= 6; k++) { const r = MEM_R * (0.55 + k * 0.075), q = surf(r, a + (slack ? Math.sin(k * 1.7 + i) * 0.06 * slack : 0)); pts.push(pr(q)); }
      c.strokeStyle = rgba(BR.sh, 0.3 + slack * 0.3); c.lineWidth = Math.max(1, T * 0.025); poly(c, pts); c.stroke(); }
    // the embossed triad at its heart (three circles, as its three rings), sinking with the bowl
    CHO.emboss(c, C0[0], C0[1], T * 1.05, 'triad', Math.max(1.4, T * 0.06), rgba(BR.sh2, 0.5), rgba('#FFFFFF', 0.55 * (1 - slack * 0.6)));
    // ripples after a strike, running out from the heart
    if (rip > 0.02) for (let k = 0; k < 3; k++) { const u = ((1 - rip) * 1.6 + k * 0.33) % 1, r = MEM_R * (0.1 + u * 0.88); const pts = []; for (let i = 0; i <= 32; i++) pts.push(pr(surf(r, i / 32 * TAU)));
      c.strokeStyle = rgba('#FFFFFF', 0.5 * rip * (1 - u)); c.lineWidth = Math.max(1, T * 0.05); poly(c, pts); c.stroke(); c.strokeStyle = rgba(BR.sh2, 0.35 * rip * (1 - u)); c.lineWidth = Math.max(1, T * 0.03); poly(c, pts.map(p => [p[0] + T * 0.04, p[1] + T * 0.05])); c.stroke(); }
    // the sheen: a soft highlight on the near-light side (dulled as it slackens), and the shade the lip casts at the rim
    g = c.createRadialGradient(Cr[0] - Rs * 0.42, Cr[1] - Rs * 0.48, 0, Cr[0] - Rs * 0.42, Cr[1] - Rs * 0.48, Rs * 0.5); g.addColorStop(0, rgba('#FFFFFF', 0.42 * (1 - slack * 0.7) * (1 - (M.dent || 0) * 0.5))); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(Cr[0] - Rs, Cr[1] - Rs, Rs * 1.2, Rs * 1.2);
    g = c.createRadialGradient(Cr[0], Cr[1], Rs * 0.78, Cr[0], Cr[1], Rs * 1.02); g.addColorStop(0, 'rgba(29,14,26,0)'); g.addColorStop(1, 'rgba(29,14,26,.45)'); c.fillStyle = g; c.fillRect(Cr[0] - Rs * 1.2, Cr[1] - Rs * 1.3, Rs * 2.4, Rs * 2.6);
    // the silence: the exposed skin pulses with a bright coral ring
    if (hush > 0.05) { const pu = 0.5 + 0.5 * Math.sin(bt * 7); c.strokeStyle = rgba(CORAL_HI, (0.5 + 0.45 * pu) * hush); c.lineWidth = Math.max(3, T * 0.26); path(c, edge); c.stroke(); c.strokeStyle = rgba('#FFFFFF', 0.5 * hush * pu); c.lineWidth = Math.max(1, T * 0.06); c.stroke(); }
    if (K.Q.flash > 0) { c.fillStyle = 'rgba(255,244,236,.18)'; c.fillRect(Cr[0] - Rs * 1.2, Cr[1] - Rs * 1.3, Rs * 2.4, Rs * 2.6); }
    c.restore();
    path(c, edge); c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.stroke();
    // its glow spills out over the rim when it is lit hard
    const ga = clamp(glow * 0.35 + hush * 0.35 + rip * 0.2 - (M.dim || 0), 0, 0.8); if (ga > 0.03) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = ga; blitSized(c, glowSprite(hush > 0.3 ? '#FFD8C8' : CORAL_HI), C0[0] - Rs * 1.3, C0[1] - Rs * 1.3, Rs * 2.6, Rs * 2.6); c.restore(); } }
  /* a spike: a four-faced pyramid of tarnished gold rising out and up from a maroon socket on the rim, patina in its facets */
  function drawSpike(c, pr, T, lw, P, M, a, GR, SR) { const bt = P.bt, sl = M.slam || 0, vib = sl * Math.sin(bt * 60) * 0.05;
    const Bc = ring3(P, a, 2.0, 1.28), out = norm3(sub3(ring3(P, a, 2.5, 1.28), Bc)), up = norm3(P.dirW(0, 0, 1)), d = norm3(add3(add3(mul3(out, 0.78), up, 0.72), out, vib));
    const e1 = norm3(cross3(up, out)), e2 = norm3(cross3(d, e1)), w = 0.3, L = 1.15, tip = add3(Bc, d, L), Bq = [add3(add3(Bc, e1, w), e2, w), add3(add3(Bc, e1, -w), e2, w), add3(add3(Bc, e1, -w), e2, -w), add3(add3(Bc, e1, w), e2, -w)];
    // the socket
    const so = pr(Bc); TN.shape(c, TN.ell(so[0], so[1], T * 0.36, T * 0.26), Object.assign({ lw, r: T * 0.36, d1: 0.14, d2: 0.26, spec: 0.35, specAt: [so[0] - T * 0.12, so[1] - T * 0.1], specR: 0.2, force: true }, tubeS(SR)));
    const fs = []; for (let i = 0; i < 4; i++) { const Q = [Bq[i], Bq[(i + 1) % 4], tip], n = outN(Q, add3(Bc, d, L * 0.3)); if (dot3(n, VIEW) > 0.01) fs.push({ Q, n, i }); }
    fs.forEach(f => face(c, f.Q.map(pr), f.n, GR, lw, { hot: HOTG, hotA: 0.75, inner: (g, S, lit) => { const R = mulberry32(31 + f.i * 7 + Math.round(a * 10)); for (let k = 0; k < 4; k++) { const u = R() * 0.6, v = R() * (1 - u) * 0.8; const p = pr(add3(add3(f.Q[0], sub3(f.Q[1], f.Q[0]), v), sub3(f.Q[2], f.Q[0]), u)); g.fillStyle = rgba(PATINA, 0.4); g.beginPath(); g.arc(p[0], p[1], T * (0.03 + R() * 0.035), 0, TAU); g.fill(); }
      const b0 = pr(lerp3(f.Q[0], f.Q[2], 0.25)), b1 = pr(lerp3(f.Q[1], f.Q[2], 0.25)); g.strokeStyle = rgba(GOLD_D, 0.7); g.lineWidth = Math.max(1, T * 0.04); g.beginPath(); g.moveTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1]); g.stroke(); } }));
    const tp = pr(tip); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + sl * 0.4; blitSized(c, glowSprite(HOTG), tp[0] - T * 0.3, tp[1] - T * 0.3, T * 0.6, T * 0.6); c.restore(); }
  /* the head: a small eyeless wedge under the membrane's front lip, faceted, a coral seam along its ridge and coral slits down
     its cheeks; two blunt feelers with coral knobs */
  function drawHead(c, pr, P3, T, lw, P, M, H, HR, BR, CR) {
    const cen = lerp3(lerp3(H.BTL, H.BBR, 0.5), H.TB, 0.35);
    const fcs = [[H.RB, H.TT, H.TL, H.BTL], [H.RB, H.BTR, H.TR, H.TT], [H.BTL, H.TL, H.TB, H.BBL], [H.BTR, H.BBR, H.TB, H.TR], [H.TL, H.TT, H.TR, H.TB], [H.BBL, H.TB, H.BBR]];
    const fl = []; fcs.forEach((Q, i) => { const n = outN(Q, cen); if (dot3(n, VIEW) > 0.01) fl.push({ Q, n, i }); });
    // the feelers that lie behind the head go first
    const fe = [1, -1].map(sd => ({ sd, F: feelerPose(P, M, H, sd) })), fBack = fe.filter(f => f.F.tip[1] + f.F.tip[2] * 0.35 < H.TT[1] + H.TT[2] * 0.35 - 0.2), fFront = fe.filter(f => !fBack.includes(f));
    fBack.forEach(f => drawFeeler(c, pr, T, lw, f.F, BR, CR));
    fl.forEach(f => face(c, f.Q.map(pr), f.n, HR, lw, { inner: (g, S, lit) => {
      if (f.i < 2) { // the ridge: a coral seam, three bone chevrons where eyes would be
        const a = pr(lerp3(H.RB, H.TT, 0.05)), b = pr(lerp3(H.RB, H.TT, 0.92)); g.strokeStyle = rgba(CR.col, 0.9); g.lineWidth = Math.max(1.2, T * 0.06); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
        for (let k = 0; k < 3; k++) { const u = 0.25 + k * 0.2, p = pr(lerp3(lerp3(H.RB, H.TT, u), f.i ? H.BTR : H.BTL, 0.35)), q = pr(lerp3(H.RB, H.TT, u + 0.06)); g.strokeStyle = rgba(BR.col, 0.55); g.lineWidth = Math.max(1, T * 0.035); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); } }
      else if (f.i < 4) { // the cheeks: three coral slits, and the shade under the lip above
        for (let k = 0; k < 3; k++) { const u = 0.3 + k * 0.17, p = pr(lerp3(lerp3(f.i === 2 ? H.BTL : H.BTR, f.i === 2 ? H.TL : H.TR, u), lerp3(f.i === 2 ? H.BBL : H.BBR, H.TB, u), 0.35)), q = pr(lerp3(lerp3(f.i === 2 ? H.BTL : H.BTR, f.i === 2 ? H.TL : H.TR, u), lerp3(f.i === 2 ? H.BBL : H.BBR, H.TB, u), 0.7)); g.strokeStyle = rgba(CR.sh, 0.95); g.lineWidth = Math.max(1.4, T * 0.06); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.strokeStyle = rgba(CR.hi, 0.6); g.lineWidth = Math.max(1, T * 0.025); g.beginPath(); g.moveTo(p[0] - T * 0.02, p[1] - T * 0.02); g.lineTo(q[0] - T * 0.02, q[1] - T * 0.02); g.stroke(); }
        const a = pr(f.i === 2 ? H.BTL : H.BTR), b = pr(f.i === 2 ? H.TL : H.TR), gr = g.createLinearGradient(a[0], a[1] - T * 0.1, a[0], a[1] + T * 0.4); gr.addColorStop(0, 'rgba(16,4,12,.45)'); gr.addColorStop(1, 'rgba(16,4,12,0)'); g.fillStyle = gr; g.fillRect(Math.min(a[0], b[0]) - T, a[1] - T * 0.2, Math.abs(b[0] - a[0]) + T * 2, T * 0.6); } } }));
    fFront.forEach(f => drawFeeler(c, pr, T, lw, f.F, BR, CR)); }
  function drawFeeler(c, pr, T, lw, F, BR, CR) { const S = F.pts.map(pr);
    tubeLite(c, S, u => T * (0.17 - u * 0.05), Object.assign({ lw, force: true }, tubeS(BR)));
    // coral bands along it
    for (const u of [0.35, 0.6]) { const i = Math.floor(u * (S.length - 1)), f = u * (S.length - 1) - i, p = [lerp(S[i][0], S[i + 1][0], f), lerp(S[i][1], S[i + 1][1], f)]; c.fillStyle = CR.col; c.strokeStyle = INK; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.ellipse(p[0], p[1], T * 0.13, T * 0.09, 0, 0, TAU); c.fill(); c.stroke(); }
    const tp = S[S.length - 1], r = T * 0.24; TN.shape(c, TN.ell(tp[0], tp[1], r, r * 0.9), Object.assign({ lw, r, d1: 0.14, d2: 0.26, spec: 0.75, specAt: [tp[0] - r * 0.35, tp[1] - r * 0.4], specR: 0.25, force: true }, tubeS(CR))); }
  /* a leg: a maroon thigh with a lit plate, a gold-banded coral knee, a darker shin, a bone hoof; the front pair a little heavier */
  function drawLeg(c, pr, T, lw, L, LR, BR, GR, CR, k) { const h = pr(L.hip), kn = pr(L.knee), an = lerp3(L.knee, L.foot, 0.78), a2 = pr(an), f = pr(L.foot), wk = k === 0 ? 1.15 : 1;
    tubeLite(c, [h, pr(lerp3(L.hip, L.knee, 0.5)), kn], u => T * (0.42 - u * 0.08) * wk, Object.assign({ lw, force: true }, tubeS(LR)));
    // a lit plate along the thigh's top
    { const p0 = pr(add3(lerp3(L.hip, L.knee, 0.2), [0, 0, 0.12])), p1 = pr(add3(lerp3(L.hip, L.knee, 0.8), [0, 0, 0.1])); c.strokeStyle = rgba(LR.hi, 0.9); c.lineWidth = Math.max(1, T * 0.07 * wk); c.lineCap = 'round'; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); c.strokeStyle = rgba('#FFFFFF', 0.35); c.lineWidth = Math.max(1, T * 0.025); c.stroke(); }
    tubeLite(c, [kn, pr(lerp3(L.knee, an, 0.5)), a2], u => T * (0.32 - u * 0.09) * wk, Object.assign({ lw, force: true }, tubeS(LR)));
    // the knee: a coral joint skin in a gold band
    TN.shape(c, TN.ell(kn[0], kn[1] + T * 0.04, T * 0.3 * wk, T * 0.24 * wk), Object.assign({ lw, r: T * 0.3, d1: 0.14, d2: 0.26, spec: false, force: true }, tubeS(CR)));
    TN.shape(c, TN.ell(kn[0] - T * 0.02, kn[1] - T * 0.04, T * 0.22 * wk, T * 0.18 * wk), Object.assign({ lw, r: T * 0.22, d1: 0.14, d2: 0.26, spec: 0.6, specAt: [kn[0] - T * 0.09, kn[1] - T * 0.1], specR: 0.25, force: true }, tubeS(GR)));
    // the ankle's gold cuff and the blunt bone hoof
    tubeLite(c, [a2, f], u => T * (0.21 - u * 0.02) * wk, Object.assign({ lw, force: true }, tubeS(GR)));
    TN.shape(c, TN.ell(f[0], f[1] - T * 0.06, T * 0.32 * wk, T * 0.22 * wk), Object.assign({ lw, r: T * 0.32, d1: 0.14, d2: 0.26, spec: 0.5, specAt: [f[0] - T * 0.1, f[1] - T * 0.13], specR: 0.22, force: true }, tubeS(BR)));
    c.strokeStyle = rgba(BR.sh2, 0.8); c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.ellipse(f[0], f[1] + T * 0.03, T * 0.2 * wk, T * 0.07, 0, 0.15, Math.PI - 0.15); c.stroke(); }

  /* ---------- the Drum Chamber: its floor and the hollow mountain round it ---------- */
  function paintChamber(c, A2) { const R = A2.R, rnd = A2.rnd;
    let g = c.createRadialGradient(0, 0, R - 0.5, 0, 0, R + 1.5); g.addColorStop(0, '#2A1626'); g.addColorStop(1, 'rgba(20,8,16,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.clip();
    c.fillStyle = '#9C8670'; c.fillRect(-R, -R, R * 2, R * 2);
    // the flagstones: courses of curved bone-stone laid in rings round the centre, each stone its own shade, lit inner edge
    const FL = ['#BBA88C', '#B2A084', '#C2B094', '#AA977C', '#B8A589', '#C6B59A'];
    for (let r0 = 0.9; r0 < R; r0 += 1.55) { const r1 = Math.min(R, r0 + 1.5), n = Math.max(6, Math.round(TAU * (r0 + 0.75) / 1.9)), off = rnd() * TAU;
      for (let i = 0; i < n; i++) { const a0 = off + i / n * TAU + 0.012, a1 = off + (i + 1) / n * TAU - 0.012; c.beginPath(); c.arc(0, 0, r1 - 0.05, a0, a1); c.arc(0, 0, r0 + 0.05, a1, a0, true); c.closePath(); c.fillStyle = FL[Math.floor(rnd() * FL.length)]; c.fill();
        c.strokeStyle = 'rgba(255,248,230,.16)'; c.lineWidth = 0.07; c.beginPath(); c.arc(0, 0, r0 + 0.1, a0, a1); c.stroke(); c.strokeStyle = 'rgba(52,28,47,.2)'; c.beginPath(); c.arc(0, 0, r1 - 0.1, a0, a1); c.stroke();
        if (rnd() < 0.16) { let a = lerp(a0, a1, rnd()), r = lerp(r0, r1, rnd()); c.strokeStyle = 'rgba(52,28,47,.35)'; c.lineWidth = 0.035; c.beginPath(); c.moveTo(Math.cos(a) * r, Math.sin(a) * r); for (let j = 0; j < 4; j++) { a += (rnd() - 0.5) * 0.08; r += (rnd() - 0.5) * 0.5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); } } }
    c.fillStyle = '#C9B89C'; c.beginPath(); c.arc(0, 0, 0.85, 0, TAU); c.fill();
    // drum-dust and coral bloom where the shockwaves have worn it
    for (let i = 0; i < 36; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.6 + rnd() * 1.6; g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(rnd() < 0.3 ? CORAL : '#6E5A48', 0.16)); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
    for (let i = 0; i < 1600; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R; c.fillStyle = rnd() < 0.5 ? `rgba(250,244,226,${0.08 + rnd() * 0.12})` : `rgba(70,44,56,${0.08 + rnd() * 0.12})`; c.fillRect(Math.cos(a) * d, Math.sin(a) * d, 0.04 + rnd() * 0.05, 0.04 + rnd() * 0.05); }
    // hoof prints in shuffling arcs
    for (let i = 0; i < 40; i++) { const a = rnd() * TAU, r0 = 2 + rnd() * 8, x = Math.cos(a) * r0, y = Math.sin(a) * r0; c.fillStyle = 'rgba(60,36,48,.2)'; c.beginPath(); c.ellipse(x, y, 0.14, 0.1, a, 0, TAU); c.fill(); }
    g = c.createRadialGradient(1.5, 1.5, R - 5, 1.5, 1.5, R + 1); g.addColorStop(0, 'rgba(40,16,30,0)'); g.addColorStop(1, 'rgba(40,16,30,.42)'); c.fillStyle = g; c.fillRect(-R, -R, R * 2, R * 2);
    c.restore();
    c.strokeStyle = MAROON_D; c.lineWidth = 0.7; c.beginPath(); c.arc(0, 0, R - 0.1, 0, TAU); c.stroke(); c.strokeStyle = rgba(GOLD, 0.8); c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, R - 0.5, 0, TAU); c.stroke(); }
  /* the hollow mountain beyond: maroon dark, giant pipes in three silhouettes (columns, low arches, spirals) whose mouths
     glow coral, a haze of bone dust */
  function paintCavern(c, W, H, T) { const R = mulberry32(1113);
    let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0B0509'); g.addColorStop(0.5, '#1D0E1A'); g.addColorStop(1, '#2A1626'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const mouth = (x, y, r) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite(CORAL_HI), x - r * 3, y - r * 3, r * 6, r * 6); c.restore(); c.fillStyle = '#0B0509'; c.beginPath(); c.ellipse(x, y, r, r * 0.4, 0, 0, TAU); c.fill(); c.strokeStyle = rgba(BONE, 0.5); c.lineWidth = 2; c.stroke(); };
    const pipe = (pts, w, col) => { c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#0E060C'; c.lineWidth = w + 4; poly(c, pts); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); c.strokeStyle = 'rgba(255,220,240,.08)'; c.lineWidth = w * 0.25; poly(c, pts.map(p => [p[0] - w * 0.25, p[1]])); c.stroke(); };
    // straight columns
    for (let i = 0; i < 9; i++) { const x = W * (i + 0.5) / 9 + (R() - 0.5) * 20, w = 10 + R() * 16, top = H * (0.08 + R() * 0.25); pipe([[x, H + 10], [x, top]], w, i % 2 ? '#2C1727' : '#3A2034'); for (let k = 0; k < 3; k++) { c.fillStyle = rgba(GOLD_D, 0.4); c.fillRect(x - w / 2, top + (H - top) * (0.2 + k * 0.28), w, 3); } mouth(x, top, w * 0.55); }
    // low arches
    for (let i = 0; i < 3; i++) { const cx = W * (0.15 + i * 0.35), r = W * (0.12 + R() * 0.06), y = H * (0.55 + R() * 0.1), pts = []; for (let k = 0; k <= 20; k++) { const a = Math.PI + k / 20 * Math.PI; pts.push([cx + Math.cos(a) * r, y + Math.sin(a) * r * 0.8]); } pipe(pts, 14 + R() * 8, '#331B2E'); mouth(cx + r, y, 8); }
    // spirals
    for (let i = 0; i < 2; i++) { const cx = W * (0.3 + i * 0.42), cy = H * (0.22 + R() * 0.1), pts = []; for (let k = 0; k <= 40; k++) { const u = k / 40, a = u * TAU * 1.6, r = 8 + u * W * 0.09; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.7]); } pipe(pts, 9, '#3A2034'); const e = pts[pts.length - 1]; mouth(e[0], e[1], 6); }
    c.fillStyle = BONE; for (let i = 0; i < 50; i++) { c.globalAlpha = 0.05 + R() * 0.18; c.beginPath(); c.arc(R() * W, R() * H, 0.5 + R() * 1.1, 0, TAU); c.fill(); } c.globalAlpha = 1; }

  /* ---------- on the floor, over the stage's rings: the shockwaves, SAFE, the rings going dark ---------- */
  function ringLayer(c, FX) { const M = FX.mem, m = FX.m; if (!M || !M.stat || !M.mod) return; const C = M.mod.C, T = FX.Tz(), X0 = FX.sx(C.x), Y0 = FX.sy(C.y), rings = M.mod.rings;
    const ann = R => { c.beginPath(); c.arc(X0, Y0, R.r1 * T, 0, TAU); if (R.r0 > 0) { c.moveTo(X0 + R.r0 * T, Y0); c.arc(X0, Y0, R.r0 * T, 0, TAU, true); } };
    // the wave: a bright band running from the ring's inner edge to its outer
    for (const w of M.waves) { const R = rings[w.ring], u = w.t / w.life, r = lerp(R.r0, R.r1, smooth(u)) * T; c.save(); ann(R); c.clip(); c.globalCompositeOperation = 'lighter';
      for (const [k, a] of [[1.0, 0.1], [0.55, 0.16], [0.25, 0.26]]) { c.strokeStyle = rgba(CORAL_HI, a * (1 - u)); c.lineWidth = T * k; c.beginPath(); c.arc(X0, Y0, Math.max(1, r), 0, TAU); c.stroke(); } c.restore(); }
    // a struck ring in this phrase: SAFE, quietly marked in mint along its south side
    const Ph = M.ph; if (Ph && !m.dead) for (const s of Ph.slots) if (s.kind === 'ring' && s.fired) { const R = rings[s.ring]; c.save(); ann(R); c.fillStyle = rgba(SAFE, 0.1); c.fill('evenodd'); c.setLineDash([T * 0.25, T * 0.3]); c.strokeStyle = rgba(SAFE, 0.5); c.lineWidth = 2; c.beginPath(); c.arc(X0, Y0, R.r1 * T - 3, 0, TAU); c.stroke(); c.restore(); }
    // the death: the rings fall dark one at a time
    for (let i = 0; i < 3; i++) { const k = M.darkR[i] || 0; if (k < 0.01) continue; c.save(); ann(rings[i]); c.fillStyle = rgba('#12060E', 0.42 * k); c.fill('evenodd'); c.restore(); } }
  function lab(c, X, Y, s, col, T, k) { c.save(); c.font = `900 ${Math.round(T * (k || 0.36))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3.5; c.strokeStyle = 'rgba(8,8,12,.82)'; c.lineJoin = 'round'; c.strokeText(s, X, Y); c.fillStyle = col || '#FFFFFF'; c.fillText(s, X, Y); c.restore(); }
  /* ---------- in the air: the silence's mouth over the membrane, labels ---------- */
  function drawAir(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M || !M.stat || m.dead) return; const sx = FX.sx, sy = FX.sy, pu = 0.5 + 0.5 * Math.sin(t * 8);
    const X = sx(m.x), Y = sy(m.y) - T * 3.6;
    if (M.exposed) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 + 0.3 * pu; blitSized(c, glowSprite(CORAL_HI), X - T * 1.2, Y - T * 1.2, T * 2.4, T * 2.4); c.restore();
      CHO.badge(c, X, Y, T * 1.15, '', null, BONE_HI); CHO.hushIcon(c, X, Y, T * 0.72, BONE_HI, Math.max(2, T * 0.08)); lab(c, X, Y - T * 0.95, 'EXPOSED · ×1.75', CORAL_HI, T, 0.32); }
    if (m.stunT > 0 && M.stunKind === 'falter') lab(c, X, Y + T * 0.2, `FALTERING ${m.stunT.toFixed(1)}s · ×1.75`, CORAL_HI, T, 0.34);
    const Ph = M.ph; if (Ph) { const C = Ph.C;
      for (const s of Ph.slots) if (s.kind === 'ring' && s.fired) { const R = M.mod.rings[s.ring], rm = (R.r0 + R.r1) / 2; let best = null;   // (on the side of the ring away from the boss)
        for (const a of [Math.PI / 2, 0, Math.PI, Math.PI * 0.25, Math.PI * 0.75]) { const x = C.x + Math.cos(a) * rm, y = C.y + Math.sin(a) * rm, d = Math.hypot(x - m.x, y - m.y); if (!best || d > best[2] + 0.5) best = [x, y, d]; }
        lab(c, sx(best[0]), sy(best[1]) + T * 0.75, 'SAFE', SAFE, T, 0.3); }
      const cs = Ph.slots.find(s => s.kind === 'cone' && s.p && !s.fired); if (cs) lab(c, sx(Ph.cx + Math.cos(cs.a) * 6), sy(Ph.cy + Math.sin(cs.a) * 6) + T * 0.8, 'get to its SIDE', '#FFE0D6', T, 0.28); } }
})());
