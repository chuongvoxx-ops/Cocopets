/* ---------- THRENN THE SECOND EATER ----------
   The Sepulchre's first boss, in the Tomb Court: a long segmented centipede of blue-black stone curled round a floating
   hourglass, its six largest plates blue-grey slabs edged in old gold, eight short legs hanging under it as it floats at
   waist height. It has no mouth: its head is a flat round clock face with three thick hands that tick, and before every
   attack one hand stops dead, turns to point at what it means to strike, and glows violet.
   The court is a square of blue-black flagstones cut by four carved lanes, two each way, inlaid in gold, with the dial
   of the old clock round its edge (the court's walkable ground). Afterimage Bite marks one lane and rushes down it,
   leaving a transparent imprint of itself lying in the lane, a countdown on it; three seconds later the imprint bites the
   same lane again. Borrowed Moment flips the hourglass and throws three small seconds into the air, where they hang
   still with their paths drawn on the floor, then fly along them; as they go, the coil loosens and the hourglass is
   bare for a few seconds: crack it, and Threnn falls out of time, slumped on the flagstones with the core open (its
   weak point) for six seconds. From half health it steals a second: a lane strikes while the seconds still hang, so the
   pet must find a square safe from both; second-eaters gather in the court.
   It is never still: the coil breathes and ripples round the hourglass, the legs paddle at the air, the hourglass turns
   and its sand runs (and stops, violet, while it holds a moment), the hands tick with a jolt; it recoils when struck,
   rears its face before a bite, slumps and spills its sand when cracked, and descends with its hands whirling. */
RiftFiend.define({ id: 'threnn', name: 'Threnn', title: 'The Second Eater', color: '#2A3346', glow: '#C9B0FF', accent: '#E8CF8E', biome: 'sepulchre', r: 2.0, els: ['dark', 'light'] }, (() => {
  const { TAU, TN, ell, sorted, hit, limb } = RiftFiend, tubeLite = TN.tubeLite;
  const { INK, SILVER, SILVER_HI, GOLD, GOLD_HI, VIOLET, VIOLET_HI } = SEP;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const lerpA = (a, b, u) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + d * u; };
  // (the painter's palette: stone body, blue-grey plates, a pale silver face)
  const BODY = '#2B3447', BODY_SH = '#171C28', BODY_HI = '#4A587A', PLATE = '#71819B', PLATE_SH = '#4E5A70', PLATE_HI = '#A3B1C7', GOLD_SH = '#7A6435', LEG = '#4A5672', LEG_SH = '#283042', LEG_HI = '#7C8AA8';
  const FACE = '#DCE2EA', FACE_SH = '#A2ADBE', FACE_HI = '#F8FAFD', HAND = '#1B2030';
  /* the creature: the head and twelve body segments; their girth (the six largest plates are 3 to 8), the legs' segments */
  const N = 13, WK = [1, 0.74, 0.86, 1.0, 1.1, 1.18, 1.22, 1.2, 1.12, 1.0, 0.88, 0.75, 0.6], BIG = i => i >= 3 && i <= 8, LEGS = [3, 5, 7, 9];
  /* the court: 26 m square (the walkable dial inside it), four lanes 3 m wide, two each way, 4.5 m off the centre */
  const CS = 13, LW = 3.0, LO = 4.5, LANES = [{ v: 1, o: -LO }, { v: 1, o: LO }, { v: 0, o: -LO }, { v: 0, o: LO }];
  const laneEnds = (C, L) => { const h = Math.sqrt(Math.max(1, C.R * C.R - L.o * L.o)) - 0.2; return L.v ? [{ x: C.x + L.o, y: C.y - h }, { x: C.x + L.o, y: C.y + h }] : [{ x: C.x - h, y: C.y + L.o }, { x: C.x + h, y: C.y + L.o }]; };
  const laneOff = (C, L, x, y) => L.v ? Math.abs(x - (C.x + L.o)) : Math.abs(y - (C.y + L.o));
  // a clock hand's angle (0 at twelve, clockwise on the screen) pointing along a screen direction
  const clockA = (dx, dy) => Math.atan2(dx, -dy);
  const ease = u => u >= 1 ? 1 : 1 - Math.pow(1 - u, 3) + Math.sin(u * Math.PI) * 0.22;
  return {
    arenaR: 13, firstAct: 'drift', artY: 0.62,
    artPoses: [{ name: 'curled about its hour', mem: {} }, { name: 'a hand stopped: the bite marked', mem: { menace: 1, fz: 1, fzK: 1, fzOn: true, fzAim: 2.4 } }, { name: 'the borrowed moment: the core bare', mem: { open: 1, expose: 1 } }, { name: 'cracked: out of time', mem: { slump: 1, cracked: 1 } }],
    phaseNames: ['The Tomb Court', 'The Second Hour', 'The Stolen Second', 'The Last Second'],
    paintGround(c, A) { paintCourt(c, A); },
    sky(c, W, H, t, cam, T) { paintHalls(c, W, H, t, cam, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m; m.noTouch = true; m.x = FX.C.x; m.y = FX.C.y - 2; m.act = 'enter';
      Object.assign(M, { bt: 0, hd: Math.PI / 2, hdT: Math.PI / 2, dir: 1, alt: 6, open: 0, slump: 0, uncoil: 0, rushA: Math.PI / 2, menace: 0, roar: 0, recoil: 0, spd: 0, px: m.x, py: m.y, vx: 0, vy: 0, legPh: 0, coreRot: 0, flip: 0, flipU: null, sand: 0.3,
        hands: initHands(), fz: null, fzOn: false, fzK: 0, fzAim: null, spin: 1, bite: null, bm: null, orbs: [], smear: [], smearT: 0, expose: 0, exposeMax: 1, coreObj: null, cracked: 0, broodT: 12, orb: null, odir: 1, wasEnter: true, roared: false, wasStun: false, seen: {}, last: null, nextAct: null, kickT: 0 });
      solve(FX, m, M, 0, true); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; M.roar = 1; M.menace = 1; M.bite = null; M.bm = null; M.toll = null; M.tollW = 0; M.fzOn = false; M.uncoil = Math.min(M.uncoil, 0.5); M.orbs = M.orbs.filter(o => o.state === 'go'); closeCore(FX, false); dropImprints(FX); m.act = 'drift'; m.actT = 0; M.broodT = 6;
      FX.H.shake(10, 0.5); FX.H.flash(0.2, VIOLET); FX.H.sfx.crash(); FX.H.sparks(m.x, m.y - M.alt, VIOLET_HI, 20, 8); FX.H.ring(m.x, m.y, 0.5, 8, 0.9, VIOLET_HI, 0.4);
      for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, q = FX.clampArena({ x: m.x + Math.cos(a) * 4, y: m.y + Math.sin(a) * 4 }, 2); FX.H.ring(q.x, q.y, 0.2, 1.4, 0.4, SILVER_HI, 0.3); FX.minion('seceater', q.x, q.y); }
      if (lv >= 2) FX.H.banner('THE STOLEN SECOND', 'A lane strikes while the seconds hang: stand where neither reaches; second-eaters gather', VIOLET_HI, 2.6, true); if (lv >= 4) FX.H.banner('The Last Second', 'Every hand stops at once', '#FF6A5A', 2.2); },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, P = FX.S.lv, fast = (1 + (P - 1) * 0.08) * FX.S.fast; m.actT += dt; m.noTouch = true;
      // the second hour: second-eaters drift in to slow the court
      if (P >= 2 && m.act === 'drift' && (M.broodT -= dt) <= 0) { M.broodT = P >= 4 ? 10 : 14; const n = FX.H.mons.filter(x => !x.dead && x.type === 'seceater').length; if (n < 3) { for (let i = 0; i < Math.min(2, 3 - n); i++) { const a = Math.random() * TAU, d = 3 + Math.random() * 2.5; callEater(FX, m, me.x + Math.cos(a) * d, me.y + Math.sin(a) * d); } FX.H.text(me.x, me.y - 2, 'Second-eaters gather', SILVER_HI, 13); } }
      let menace = 0; M.hdT = FX.angPet(m.x, m.y);
      switch (m.act) {
        case 'drift': { if (M.orb == null) M.orb = Math.atan2(m.y - me.y, m.x - me.x); M.orb += dt * 0.32 * fast * M.odir; const R = 6.2 + Math.sin(m.t * 0.4) * 1.2, p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 3); float(FX, m, M, p.x, p.y, 2.4 * fast, dt, 3);
          // (in the first hour it waits for an imprint to bite before it begins anything new)
          const busy = P < 3 && FX.S.hz.some(z => z.kind === 'imprint');
          if (m.actT > (P >= 3 ? 1.3 : 1.8) / FX.S.fast && !busy) { m.actT = 0; if (Math.random() < 0.4) M.odir = -M.odir; choose(FX, m); } break; }
        case 'bite': { const r = biteStep(FX, m, M, dt, fast); menace = r.menace || 0; if (r.done) toDrift(m, M); break; }
        case 'toll': { const Tl = M.toll; Tl.age += dt; float(FX, m, M, m.x, m.y, 1, dt, 2); menace = Tl.age < Tl.wait ? 1 : 0.2; M.tollW = Tl.age < Tl.wait ? Math.min(1, Tl.age / (Tl.wait * 0.7)) : 0; if (Tl.age < Tl.wait) M.fzAim = clockA(me.x - m.x, me.y - m.y); else M.fzOn = false; if (Tl.age > Tl.wait + 0.8) { M.toll = null; M.tollW = 0; toDrift(m, M); } break; }
        case 'borrow': { float(FX, m, M, m.x, m.y, 1, dt, 2); const r = borrowStep(FX, m, M, dt); menace = r.menace || 0; if (r.done) toDrift(m, M); break; }
        case 'still': { const B = M.bm; if (B && B.launched && !B.biteGiven) { B.biteGiven = true; startBite(FX, m, true); }
          let rb = { done: true }; if (M.bite) rb = biteStep(FX, m, M, dt, fast); else float(FX, m, M, m.x, m.y, 1, dt, 2);
          const rm = borrowStep(FX, m, M, dt); menace = Math.max(rb.menace || 0, rm.menace || 0); if (rm.done && !M.bite) toDrift(m, M); break; }
        default: toDrift(m, M);
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.menace = decay(M.menace, dt, 4); M.fzOn = false; M.hdT = M.hd; m.noTouch = true;
      FX.weak('core', m.x, m.y - M.alt, 1.3, 2.4, m.stunT > 0.05);
      // out of time: its sand spills from the cracked glass, and it twitches on the flagstones
      M.kickT -= dt; if (M.kickT <= 0) { M.kickT = 0.16; FX.H.part({ kind: 'sand', x: m.x + FX.rnd(-0.25, 0.25), y: m.y - M.alt + 0.5, vx: FX.rnd(-0.6, 0.6), vy: 1.5, g: 9, life: 0.5, max: 0.5, size: 2, color: GOLD_HI }); if (Math.random() < 0.15) FX.H.shake(1.5, 0.08); }
      FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m) return; M.bt += dt; const stun = m.stunT > 0, P = FX.S.lv;
      if (!stun) { if (FX.S.weak.core) FX.weak('core', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.recoil = 0.8; M.roar = 0.6; M.cracked = 0.6; FX.H.text(m.x, m.y - 3.4, 'It turns its hourglass over again', VIOLET_HI, 13); FX.H.ring(m.x, m.y, 0.3, 4, 0.5, VIOLET_HI, 0.3); FX.H.sfx.hum(); } } else M.wasStun = true;
      M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.2); M.lash = decay(M.lash, dt, 2.4); M.cracked = stun ? 1 : decay(M.cracked, dt, 0.15);
      // the entrance: the hourglass sinks out of the dark, the coil tight about it, the hands whirling; then they snap
      // to their places, the face lifts and it shrieks a ring of violet
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.alt = 1.3 + Math.max(0, 1.7 - e) * 2.8; M.spin = e < 1.7 ? 1 : 0; if (e > 1.7 && !M.roared) { M.roared = true; M.roar = 1; M.recoil = 0.6; FX.H.sfx.crash(); FX.H.sfx.chime && FX.H.sfx.chime(); FX.H.shake(8, 0.4); FX.H.ring(m.x, m.y, 0.3, 7, 1, VIOLET_HI, 0.4); FX.H.sparks(m.x, m.y - M.alt, GOLD_HI, 16, 6); } }
      else { M.spin = 0; if (M.wasEnter) { M.wasEnter = false; M.recoil = 1; FX.H.sfx.whoosh(); } M.alt = toward(M.alt, stun ? 0.75 : 1.3 + Math.sin(M.bt * 1.5) * 0.08 + M.open * 0.2, dt, stun ? 4 : 3); }
      M.slump = stun ? Math.min(1, M.slump + dt * 2.2) : decay(M.slump, dt, 1.4);
      M.open = toward(M.open, M.expose > 0 ? 1 : 0, dt, M.expose > 0 ? 5 : 3);
      const rushing = M.bite && M.bite.go; M.uncoil = toward(M.uncoil, rushing ? 1 : M.bite ? 0.25 : 0, dt, rushing ? 16 : 3.5); if (M.bite) M.rushA = M.bite.a;
      M.hd = lerpA(M.hd, M.hdT == null ? M.hd : M.hdT, Math.min(1, dt * (M.bite ? 8 : 3)));
      // the stopped hand: it ramps up (violet) while an attack is wound, and lets go after
      M.fzK = toward(M.fzK, M.fzOn ? 1 : 0, dt, M.fzOn ? 7 : 3); if (!M.fzOn && M.fzK < 0.04) M.fz = null;
      tickHands(M, dt, stun, M.spin);
      // how it moves: its speed paddles the legs; the hourglass turns, faster when it is bare or wound
      if (dt > 1e-4) { const sp = Math.hypot(m.x - M.px, m.y - M.py) / dt; M.px = m.x; M.py = m.y; M.spd = toward(M.spd, Math.min(sp, 12), dt, 6); }
      M.legPh += dt * (3.2 + M.spd * 0.9 + M.menace * 2.5 + M.slump * 6);
      M.coreRot += dt * (0.6 + M.open * 2.5 + M.menace * 1.2 + M.roar * 3);
      if (M.flipU != null) { M.flipU += dt / 0.55; M.flip = Math.PI * ease(Math.min(1, M.flipU)); if (M.flipU >= 1) { M.flipU = null; M.flip = 0; M.sand = 1 - M.sand; } }
      const held = M.bm && M.bm.launched && !M.bm.released; if (!held && !stun) M.sand = (M.sand + dt / 9) % 1;
      // the bare core: it follows the hourglass; when the window closes the coil closes over it
      if (M.expose > 0) { M.expose -= dt; const o = M.coreObj; if (o && !o.dead) { o.x = m.x; o.y = m.y - M.alt; } if (M.expose <= 0) closeCore(FX, true); }
      // the borrowed seconds: flying out to hang, hanging, then flying their paths
      updOrbs(FX, m, M, dt);
      // the afterimages left by a rush
      M.smear.forEach(s => s.t += dt); while (M.smear.length && M.smear[0].t > 0.45) M.smear.shift();
      if (rushing) { M.smearT -= dt; if (M.smearT <= 0) { M.smearT = 0.035; const h = M.segs[0]; M.smear.push({ x: m.x, y: m.y, z: M.alt, hx: h[0], hy: h[1], hz: h[2], a: M.rushA, t: 0 }); } }
      solve(FX, m, M, dt, false); },
    dmgK() { return 1; },
    keep: { every: 2, pad: 2.5 },
    draw(c, FX, m, X, Y, T, t) { drawThrenn(c, FX, m, X, Y + (m.z || 0) * T * 4, T, t); },
    drawObj() {},
    drawFx(c, FX, T, t) { drawAir(c, FX, T, t); },
  };
  /* ---- choosing ---- */
  function toDrift(m, M) { m.act = 'drift'; m.actT = 0; M.fzOn = false; M.bite = null; M.bm = null; M.toll = null; M.tollW = 0; }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 1.9 : 1.1, true); }
  function choose(FX, m) { const M = FX.mem, P = FX.S.lv, r = Math.random(), close = FX.dist(m.x, m.y) < 5.2; let k = M.nextAct; M.nextAct = null;
    if (!k && close && M.last !== 'toll' && Math.random() < 0.4) k = 'toll';
    if (!k) { k = P >= 3 ? (r < 0.34 ? 'bite' : r < 0.62 ? 'still' : 'borrow') : (r < 0.55 ? 'bite' : 'borrow'); if (k === M.last && Math.random() < 0.6) k = k === 'bite' ? (P >= 3 && Math.random() < 0.5 ? 'still' : 'borrow') : 'bite'; }
    M.last = k; if (k === 'toll') startToll(FX, m); else if (k === 'bite') startBite(FX, m, false); else if (k === 'borrow') startBorrow(FX, m, false); else startBorrow(FX, m, true); }
  function float(FX, m, M, tx, ty, spd, dt, k) { const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy), v = Math.min(spd, d * 2.2), wx = d > 0.01 ? dx / d * v : 0, wy = d > 0.01 ? dy / d * v : 0; M.vx = toward(M.vx, wx, dt, k || 3); M.vy = toward(M.vy, wy, dt, k || 3); m.x += M.vx * dt; m.y += M.vy * dt; const q = FX.clampArena(m, 2.5); m.x = q.x; m.y = q.y; }
  function freezeHand(M) { M.fz = M.fz != null && M.fzK > 0.3 ? M.fz : Math.floor(Math.random() * 3); M.fzOn = true; }
  /* ---- Hour Toll: the coil winds tight and rises, then lashes out in a ring round it (two gaps where the coil is
     thinnest); for whatever crowds it ---- */
  function startToll(FX, m) { const M = FX.mem, P = FX.S.lv, wait = (P >= 3 ? 0.95 : 1.1) / FX.S.fast, a0 = Math.random() * TAU, gaps = [[a0, 0.42], [a0 + Math.PI * (0.8 + Math.random() * 0.4), 0.38]];
    M.toll = { age: 0, wait }; m.act = 'toll'; m.actT = 0; freezeHand(M); FX.H.sfx.hum();
    FX.tele({ shape: 'ring', x: m.x, y: m.y, r0: 1.2, r1: 4.6, gaps, t: wait, dmg: m.dmg * 1.4, col: GOLD_HI, tick: (dt, s) => { if (!s.done && FX.m) { s.x = FX.m.x; s.y = FX.m.y; } }, fn: s => { M.lash = 1; M.recoil = Math.max(M.recoil, 0.3); FX.H.shake(10, 0.4); FX.H.sfx.crash(); FX.H.ring(s.x, s.y, 1.0, 4.8, 0.35, GOLD_HI, 0.4); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; if (gaps.some(([g, w]) => Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g))) < w)) continue; FX.H.sparks(s.x + Math.cos(a) * 3.4, s.y + Math.sin(a) * 3.4, GOLD_HI, 3, 4); } } });
    say(FX, 'toll', 'HOUR TOLL', 'The coil lashes out round it: back off past the ring, or slip into a gap', GOLD_HI); }
  /* ---- Afterimage Bite: one lane marked, a rush down it, an imprint left lying in it that bites again three seconds on ---- */
  function pickLane(C, me) { let best = LANES[0], bd = 1e9; for (const L of LANES) { const d = laneOff(C, L, me.x, me.y); if (d < bd) { bd = d; best = L; } } return best; }
  function startBite(FX, m, combo) { const M = FX.mem, C = FX.C, P = FX.S.lv, L = pickLane(C, FX.me), E = laneEnds(C, L), near = Math.hypot(m.x - E[0].x, m.y - E[0].y) <= Math.hypot(m.x - E[1].x, m.y - E[1].y), s = near ? E[0] : E[1], e = near ? E[1] : E[0];
    const a = Math.atan2(e.y - s.y, e.x - s.x), len = Math.hypot(e.x - s.x, e.y - s.y), wait = (combo ? 1.5 : P >= 3 ? 1.3 : 1.5) / FX.S.fast, inset = 1.8;
    const B = { L, lx: s.x, ly: s.y, a, llen: len, sx: s.x + Math.cos(a) * inset, sy: s.y + Math.sin(a) * inset, len: len - inset * 2, wait, age: 0, go: false, prog: 0, combo };
    M.bite = B; if (!combo) { m.act = 'bite'; m.actT = 0; freezeHand(M); } FX.H.sfx.hum();
    FX.tele({ shape: 'line', x: s.x, y: s.y, a, len, w: LW, t: wait, dmg: m.dmg * 1.5, col: VIOLET_HI, fn: () => strike(FX, B) });
    if (!combo) say(FX, 'bite', 'AFTERIMAGE BITE', 'It rushes the marked lane, and its imprint bites the lane again: get out of it', VIOLET_HI); }
  function biteStep(FX, m, M, dt, fast) { const B = M.bite; B.age += dt;
    if (!B.go) { // it swings to the lane's mouth, lines up and rears its face
      const d = Math.hypot(B.sx - m.x, B.sy - m.y), left = Math.max(0.25, B.wait * 0.8 - B.age); float(FX, m, M, B.sx, B.sy, Math.min(18, Math.max(4, d / left)), dt, 7); M.hdT = B.a; if (!B.combo) M.fzAim = B.a;
      if (B.age > B.wait + 1.2) { M.bite = null; return { done: true } } return { menace: 1 }; }
    B.prog += 30 * fast * dt; const pr = Math.min(B.len, B.prog); m.x = B.sx + Math.cos(B.a) * pr; m.y = B.sy + Math.sin(B.a) * pr; M.hdT = B.a; M.vx = Math.cos(B.a) * 6; M.vy = Math.sin(B.a) * 6;
    if (B.prog >= B.len + 1.5) { M.bite = null; M.recoil = 0.9; FX.H.shake(5, 0.25); FX.H.sfx.thud(); FX.H.sparks(m.x + Math.cos(B.a) * 2, m.y + Math.sin(B.a) * 2 - M.alt, VIOLET_HI, 10, 5); if (!B.combo) M.fzOn = false; return { done: true }; }
    return { menace: 0.4 }; }
  function strike(FX, B) { const m = FX.m, M = FX.mem; if (!m || m.dead || M.bite !== B) return; B.go = true;
    // (if it is not yet at the lane's mouth it lunges into the lane from where it is)
    const rx = m.x - B.sx, ry = m.y - B.sy, al = clamp(rx * Math.cos(B.a) + ry * Math.sin(B.a), 0, B.len * 0.4); B.prog = al; m.x = B.sx + Math.cos(B.a) * al; m.y = B.sy + Math.sin(B.a) * al;
    M.recoil = 0; M.roar = Math.max(M.roar, 0.4); FX.H.shake(9, 0.35); FX.H.sfx.whoosh(); FX.H.sfx.crash(); FX.H.flash(0.08, VIOLET_HI);
    for (let i = 1; i < 6; i++) FX.H.part({ kind: 'slash', x: B.lx + Math.cos(B.a) * B.llen * i / 6, y: B.ly + Math.sin(B.a) * B.llen * i / 6, a: B.a, r: 2.6, life: 0.3, max: 0.3, color: VIOLET_HI });
    // the imprint, and its bite three seconds on
    const s2 = FX.tele({ shape: 'line', x: B.lx, y: B.ly, a: B.a, len: B.llen, w: LW, t: 3.0, dmg: m.dmg * 1.3, col: VIOLET, label: '3', ghost: true, tick: (dt, s) => { if (!s.done) s.label = String(Math.max(1, Math.ceil(s.t - s.age - 1e-6))); }, fn: s => afterBite(FX, s) });
    FX.hz({ kind: 'imprint', shape: 'line', x: B.lx, y: B.ly, a: B.a, len: B.llen, w: LW, life: 3.35, tele: s2, dir: M.dir, draw: drawImprint }); }
  function afterBite(FX, s) { const M = FX.mem; FX.H.shake(8, 0.35); FX.H.sfx.crack(); FX.H.sfx.crash(); FX.H.flash(0.06, VIOLET);
    for (let i = 0; i <= 6; i++) { const x = s.x + Math.cos(s.a) * s.len * i / 6, y = s.y + Math.sin(s.a) * s.len * i / 6; FX.H.part({ kind: 'slash', x, y, a: s.a + Math.PI / 2, r: 1.8, life: 0.28, max: 0.28, color: VIOLET_HI }); if (i % 2) FX.H.sparks(x, y, VIOLET_HI, 5, 4); }
    if (FX.m && !FX.m.dead) M.recoil = Math.max(M.recoil, 0.3); }
  function dropImprints(FX) { const Z = FX.S.hz; for (let i = Z.length - 1; i >= 0; i--) if (Z[i].kind === 'imprint') Z.splice(i, 1); }
  /* ---- Borrowed Moment: the hourglass flips, three seconds hang in the air with their paths drawn, then fly them; the
     core is bare while they go ---- */
  function startBorrow(FX, m, combo) { const M = FX.mem, P = FX.S.lv; M.bm = { age: 0, wait: (combo ? 0.7 : 0.9) / FX.S.fast, hold: (combo ? 2.5 : 1.6) / FX.S.fast, launched: false, released: false, combo, biteGiven: false }; m.act = combo ? 'still' : 'borrow'; m.actT = 0; M.flipU = 0; freezeHand(M); FX.H.sfx.hum();
    if (combo) say(FX, 'still', 'THE STOLEN SECOND', 'The seconds hang while a lane strikes: stand clear of both', VIOLET_HI); else say(FX, 'borrow', 'BORROWED MOMENT', 'Three seconds hang in the air: step off the paths drawn under them', GOLD_HI); }
  function borrowStep(FX, m, M, dt) { const B = M.bm; if (!B) return { done: true }; B.age += dt;
    if (!B.launched) { M.fzAim = clockA(FX.me.x - m.x, FX.me.y - m.y); if (B.age >= B.wait) launch(FX, m, B); return { menace: 1 }; }
    if (!B.released) { if (!M.bite) M.fzAim = clockA(FX.me.x - m.x, FX.me.y - m.y); if (B.age > B.wait + B.hold + 2) { M.bm = null; return { done: true }; } return { menace: 0.7 }; }
    if (!M.bite) M.fzOn = false; if (M.expose > 0) return { menace: 0 };
    M.bm = null; return { done: true }; }
  function launch(FX, m, B) { const M = FX.mem, me = FX.me, base = Math.atan2(m.y - me.y, m.x - me.x); B.launched = true; FX.H.sfx.whoosh(); FX.H.sfx.chime && FX.H.sfx.chime(); M.recoil = Math.max(M.recoil, 0.3);
    for (const k of [-1, 0, 1]) { const a0 = base + k * 0.95, q = FX.clampArena({ x: me.x + Math.cos(a0) * 4.6, y: me.y + Math.sin(a0) * 4.6 }, 1.6), a = Math.atan2(me.y - q.y, me.x - q.x);
      let len = 1; while (len < 30 && FX.inArena(q.x + Math.cos(a) * len, q.y + Math.sin(a) * len, 0.3)) len += 0.5;
      const o = { x0: m.x, y0: m.y, z0: M.alt, x: q.x, y: q.y, z: 0.8, qx: q.x, qy: q.y, a, len, t: 0, go: 0, state: 'fly', v: 0, dmg: m.dmg * 0.9, k, spin: Math.random() * TAU };
      o.tele = FX.tele({ shape: 'line', x: q.x, y: q.y, a, len, w: 0.9, t: B.hold, dmg: 0, col: VIOLET_HI, fn: () => release(FX, o) }); M.orbs.push(o); } }
  function release(FX, o) { const M = FX.mem, m = FX.m; if (o.state !== 'held' && o.state !== 'fly' || !m || m.dead) return; o.state = 'go'; o.v = 10.5 * FX.S.fast; o.x = o.qx; o.y = o.qy; o.go = 0; FX.H.ring(o.x, o.y, 0.1, 0.9, 0.25, VIOLET_HI, 0.3);
    if (M.bm && !M.bm.released) { M.bm.released = true; FX.H.sfx.whoosh(); openCore(FX, m); } }
  function updOrbs(FX, m, M, dt) { const me = FX.me;
    for (let i = M.orbs.length - 1; i >= 0; i--) { const o = M.orbs[i]; o.t += dt;
      if (o.state === 'fly') { const u = Math.min(1, o.t / 0.35); o.x = lerp(o.x0, o.qx, u); o.y = lerp(o.y0, o.qy, u); o.z = lerp(o.z0, 0.8, u) + Math.sin(u * Math.PI) * 1.2; if (u >= 1) { o.state = 'held'; o.x = o.qx; o.y = o.qy; o.z = 0.8; FX.H.ring(o.x, o.y, 0.2, 1.0, 0.3, VIOLET_HI, 0.3); FX.H.sfx.pop(); } }
      if ((o.state === 'held' || o.state === 'fly') && !FX.S.tele.includes(o.tele)) { o.state = 'done'; o.t = 0; FX.H.sparks(o.x, o.y - o.z, VIOLET_HI, 6, 3); }
      if (o.state === 'go') { o.go += o.v * dt; o.x = o.qx + Math.cos(o.a) * o.go; o.y = o.qy + Math.sin(o.a) * o.go;
        if (Math.hypot(me.x - o.x, me.y - o.y) < 0.42 + me.r) { FX.hurt(o.dmg); o.state = 'done'; o.t = 0; FX.H.boom(o.x, o.y, 0.9, VIOLET_HI, '#FFFFFF', { n: 10, shake: 5 }); FX.H.sfx.crack(); }
        else if (o.go > o.len + 0.5) { o.state = 'done'; o.t = 0; FX.H.sparks(o.x, o.y - o.z, VIOLET_HI, 6, 3); } }
      if (o.state === 'done' && o.t > 0.3) M.orbs.splice(i, 1); } }
  /* ---- the bare core: crack it and the creature falls out of time ---- */
  function openCore(FX, m) { const M = FX.mem, P = FX.S.lv, dur = P >= 3 ? 3.0 : 3.6; M.expose = dur; M.exposeMax = dur; M.roar = Math.max(M.roar, 0.3); if (M.coreObj && !M.coreObj.dead) M.coreObj.dead = true;
    M.coreObj = FX.obj({ kind: 'core', x: m.x, y: m.y - M.alt, r: 1.0, hp: FX.S.barHP * 0.04, onHit: () => { M.recoil = Math.max(M.recoil, 0.3); }, onKill: () => { M.coreObj = null; if (FX.m && !FX.m.dead) crack(FX, FX.m); } });
    say(FX, 'core', 'THE CORE IS BARE', 'Crack the hourglass before the coil closes on it', GOLD_HI); FX.H.sfx.hum(); }
  function closeCore(FX, say2) { const M = FX.mem, m = FX.m; M.expose = 0; if (M.coreObj && !M.coreObj.dead) { M.coreObj.dead = true; if (say2 && m) FX.H.text(m.x, m.y - 3.4, 'The coil closes about its hour', SILVER_HI, 13); } M.coreObj = null; }
  function crack(FX, m) { const M = FX.mem; m.stunT = 6; m.act = 'drift'; m.actT = 0; M.bite = null; M.bm = null; M.toll = null; M.tollW = 0; M.fzOn = false; M.expose = 0; M.coreObj = null; M.orbs = M.orbs.filter(o => o.state === 'go'); FX.S.tele.length = 0; dropImprints(FX); M.roar = 0.6; M.cracked = 1;
    FX.H.banner('THE HOURGLASS CRACKS', 'It falls out of time: strike the open core!', GOLD_HI, 2.2, true); FX.H.shake(12, 0.5); FX.H.sfx.crash(); FX.H.sfx.crack(); FX.H.flash(0.2, GOLD_HI); FX.H.boom(m.x, m.y - M.alt, 1.6, GOLD_HI, '#FFFFFF', { n: 22, shake: 10 });
    for (let k = 0; k < 10; k++) FX.H.part({ kind: 'shard', x: m.x, y: m.y - M.alt, vx: FX.rnd(-4, 4), vy: FX.rnd(-5, -1), g: 9, life: 0.8, max: 0.8, size: 4, rot: Math.random() * 3, vr: 7, color: SILVER_HI }); }
  function callEater(FX, m, x, y) { const p = FX.clampArena({ x, y }, 2); FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.1, t: 1.0, dmg: m.dmg * 0.5, col: SILVER_HI, fn: s => { FX.H.ring(s.x, s.y, 0.2, 1.4, 0.4, SILVER_HI, 0.3); FX.H.sfx.pop(); if (FX.m && !FX.m.dead) FX.minion('seceater', s.x, s.y); } }); }
  /* ---- the body: target places for the head and segments (curled round the core, laid out down a lane, slumped on
     the stones), each segment easing to its own a little behind the one before it, so the coil ripples ---- */
  function initHands() { return [{ a: 0.4, from: 0.4, u: 1, tt: 1.6, every: 1.6, step: TAU / 12 }, { a: 2.6, from: 2.6, u: 1, tt: 0.8, every: 0.8, step: TAU / 12 }, { a: 4.4, from: 4.4, u: 1, tt: 0.4, every: 0.4, step: TAU / 20 }]; }
  function handA(H) { return H.u >= 1 ? H.a : H.from + (H.a - H.from) * ease(H.u); }
  function tickHands(M, dt, stun, spin) { M.hands.forEach((H, k) => {
    if (stun || spin) { H.a += dt * (stun ? -(4 + k * 3) : 10 + k * 5); H.from = H.a; H.u = 1; return; }
    if (M.fz === k && M.fzOn) { if (M.fzAim != null) H.a = lerpA(handA(H), M.fzAim, Math.min(1, dt * 9)); H.from = H.a; H.u = 1; return; }
    H.tt -= dt; if (H.tt <= 0) { H.tt += H.every; H.from = handA(H); H.a = H.from + H.step; H.u = 0; } if (H.u < 1) H.u = Math.min(1, H.u + dt / 0.16); }); }
  function targets(m, M) {
    const bt = M.bt || 0, alt = M.alt == null ? 1.3 : M.alt, hd = M.hd == null ? Math.PI / 2 : M.hd, open = M.open || 0, slump = M.slump || 0, unc = M.uncoil || 0, ra = M.rushA == null ? hd : M.rushA, hs = m.hitSq || 0, menace = M.menace || 0, recoil = M.recoil || 0, roar = M.roar || 0, dir = M.dir || 1, lash = M.lash || 0, wind = M.tollW || 0;
    const cf = Math.cos(hd), sf = Math.sin(hd), ca = Math.cos(ra), sa = Math.sin(ra), out = [];
    const sway = Math.sin(bt * 1.3) * 0.22 + Math.sin(bt * 0.47) * 0.14, fwd = 1.55 - recoil * 0.45 - hs * 0.4 + menace * 0.3, side = (1.0 + sway) * dir;
    for (let i = 0; i < N; i++) { let c3;
      // curled: the head raised on its neck in front and to one side, the body wound round the core below it
      if (i === 0) c3 = [m.x + cf * fwd - sf * side, m.y + sf * fwd + cf * side, alt + 1.45 + menace * 0.3 + open * 0.55 + roar * 0.35 - recoil * 0.2 - hs * 0.15 + Math.sin(bt * 2.1) * 0.07];
      else { const u = (i - 1) / (N - 2), ph = hd + dir * (0.72 + (i - 1) * 0.47) + Math.sin(bt * 0.9) * 0.06, r = (1.55 + 0.07 * Math.sin(bt * 1.7 - i * 0.7)) * (1 + open * 0.4 + hs * 0.06 + lash * 0.55 - wind * 0.18) - u * 0.2;
        c3 = [m.x + Math.cos(ph) * r, m.y + Math.sin(ph) * r, alt + (i === 1 ? 0.45 : -0.2 - u * 0.35) + Math.sin(bt * 2.3 - i * 0.65) * 0.1 * (1 + menace) - open * 0.35 + wind * 0.35 - lash * 0.3]; }
      // laid out down the lane: the head well ahead of the core, the tail behind, a fast lash along it
      if (unc > 0.001) { const w = Math.sin(bt * 12 - i * 0.8) * 0.25 * (i / N), d = 3.4 - i * 0.62; c3 = [lerp(c3[0], m.x + ca * d - sa * w, unc), lerp(c3[1], m.y + sa * d + ca * w, unc), lerp(c3[2], alt + 0.2 + (i === 0 ? 0.35 : 0), unc)]; }
      // slumped on the flagstones, loosely ringed, twitching
      if (slump > 0.001) { const ph = hd + dir * (0.35 + i * 0.5), r = i === 0 ? 2.5 : 2.1, tw = Math.sin(bt * 9 + i * 1.7) * 0.04; const s3 = i === 0 ? [m.x + cf * 2.5, m.y + sf * 2.5, 0.5] : [m.x + Math.cos(ph) * r, m.y + Math.sin(ph) * r, 0.36 + tw];
        c3 = [lerp(c3[0], s3[0], slump), lerp(c3[1], s3[1], slump), lerp(c3[2], s3[2], slump)]; }
      out.push(c3); }
    return out; }
  function solve(FX, m, M, dt, snapAll) { const P = targets(m, M); if (!M.segs || snapAll) { M.segs = P.map(p => p.slice()); return; }
    const fastK = M.uncoil > 0.5 ? 30 : 10; for (let i = 0; i < N; i++) { const s = M.segs[i], q = P[i], k = Math.min(1, dt * (fastK - i * (M.uncoil > 0.5 ? 0.4 : 0.45))); s[0] += (q[0] - s[0]) * k; s[1] += (q[1] - s[1]) * k; s[2] += (q[2] - s[2]) * k; } }
  // the hit proxies: the core, the head and the coil (the core's goes when it is bare or open: the hourglass itself is struck)
  function bodyParts(m, M) { const S = M.segs, bare = M.expose > 0 || m.stunT > 0, out = [hit('core', [m.x, m.y, M.alt], bare ? 0.01 : 0.9, m), hit('head', S[0], 0.85, m)]; [3, 6, 9, 12].forEach((i, k) => out.push(hit('s' + k, S[i], 0.75, m))); return out; }
  /* ---- the court: blue-black flagstones in a 26 m square, four lanes carved and inlaid with gold, the old dial round the
     walkable ground, tomb lids in the corners beyond it, a curb round the whole ---- */
  function paintCourt(c, A) { const R = A.R, rnd = A.rnd, H = CS;
    // the curb outside the court (a raised stone band, its front face catching the dark)
    c.fillStyle = '#121620'; c.fillRect(-H - 1.2, -H - 1.2, (H + 1.2) * 2, (H + 1.2) * 2);
    c.fillStyle = '#323C52'; c.fillRect(-H - 1.0, -H - 1.0, (H + 1.0) * 2, (H + 1.0) * 2);
    c.fillStyle = '#1A202D'; c.fillRect(-H - 1.0, H + 0.55, (H + 1.0) * 2, 0.45);
    for (let x = -H - 1; x < H + 1; x += 1.6) { c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(x, -H - 1); c.lineTo(x, -H); c.moveTo(x, H); c.lineTo(x, H + 1); c.stroke(); }
    for (let y = -H - 1; y < H + 1; y += 1.6) { c.beginPath(); c.moveTo(-H - 1, y); c.lineTo(-H, y); c.moveTo(H, y); c.lineTo(H + 1, y); c.stroke(); }
    // the flagstones: 2 m squares, a few split in four, each its own shade with a lit upper edge and a dark lower one
    c.fillStyle = '#141924'; c.fillRect(-H, -H, H * 2, H * 2);
    const FL = ['#2C3446', '#283041', '#30394C', '#262D3D', '#2A3244'];
    for (let y = -H; y < H - 0.01; y += 2) for (let x = -H; x < H - 0.01; x += 2) { const split = rnd() < 0.16;
      const tile = (tx, ty, s) => { c.fillStyle = FL[Math.floor(rnd() * FL.length)]; c.fillRect(tx + 0.05, ty + 0.05, s - 0.1, s - 0.1); c.fillStyle = 'rgba(190,205,235,.05)'; c.fillRect(tx + 0.05, ty + 0.05, s - 0.1, 0.1); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(tx + 0.05, ty + s - 0.15, s - 0.1, 0.1); };
      if (split) { tile(x, y, 1); tile(x + 1, y, 1); tile(x, y + 1, 1); tile(x + 1, y + 1, 1); } else tile(x, y, 2);
      if (rnd() < 0.2) { let px = x + 0.3 + rnd() * 1.4, py = y + 0.3 + rnd() * 1.4; c.strokeStyle = 'rgba(8,10,16,.55)'; c.lineWidth = 0.04; c.beginPath(); c.moveTo(px, py); for (let j = 0; j < 4; j++) { px += (rnd() - 0.5) * 0.7; py += (rnd() - 0.5) * 0.7; c.lineTo(px, py); } c.stroke(); }
      if (rnd() < 0.08) { c.fillStyle = 'rgba(169,181,197,.06)'; c.beginPath(); c.ellipse(x + 1, y + 1, 0.6, 0.35, rnd() * 3, 0, TAU); c.fill(); } }
    // the lanes: carved channels across the whole court, their floors darker, a shadowed upper wall, gold inlay along
    // both lips, minute ticks down the middle and a gold boss where two lanes cross
    const strip = (L, f) => { const o = L.o; if (L.v) f(o - LW / 2, -H, LW, H * 2, true); else f(-H, o - LW / 2, H * 2, LW, false); };
    LANES.forEach(L => strip(L, (x, y, w, h, v) => { c.fillStyle = '#181D29'; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(0,0,0,.35)'; if (v) c.fillRect(x, y, 0.28, h); else c.fillRect(x, y, w, 0.28);
      c.strokeStyle = 'rgba(70,82,108,.35)'; c.lineWidth = 0.04; for (let k = -H; k < H; k += 1) { c.beginPath(); if (v) { c.moveTo(x, k); c.lineTo(x + w, k); } else { c.moveTo(k, y); c.lineTo(k, y + h); } c.stroke(); } }));
    LANES.forEach(L => strip(L, (x, y, w, h, v) => { c.lineCap = 'butt';
      for (const [col, lw2, off] of [['#3F3420', 0.2, 0], [GOLD, 0.11, 0], ['rgba(232,207,142,.55)', 0.035, -0.03]]) { c.strokeStyle = col; c.lineWidth = lw2; c.beginPath(); if (v) { c.moveTo(x + off, y); c.lineTo(x + off, y + h); c.moveTo(x + w + off, y); c.lineTo(x + w + off, y + h); } else { c.moveTo(x, y + off); c.lineTo(x + w, y + off); c.moveTo(x, y + h + off); c.lineTo(x + w, y + h + off); } c.stroke(); }
      c.fillStyle = 'rgba(178,150,93,.7)'; for (let k = -H + 0.5; k < H; k += 1) { const big = Math.round(k - 0.5) % 3 === 0, s = big ? 0.32 : 0.16; if (v) c.fillRect(x + w / 2 - s / 2, k - 0.035, s, 0.07); else c.fillRect(k - 0.035, y + h / 2 - s / 2, 0.07, s); } }));
    for (const ox of [-LO, LO]) for (const oy of [-LO, LO]) { c.save(); c.translate(ox, oy); c.rotate(Math.PI / 4); c.fillStyle = '#3F3420'; c.fillRect(-0.62, -0.62, 1.24, 1.24); c.fillStyle = GOLD; c.fillRect(-0.5, -0.5, 1.0, 1.0); c.fillStyle = '#1B2130'; c.fillRect(-0.32, -0.32, 0.64, 0.64); c.fillStyle = 'rgba(232,207,142,.8)'; c.fillRect(-0.12, -0.12, 0.24, 0.24); c.restore(); }
    // the centre: an hourglass inlaid in gold within a ring of hour marks
    c.strokeStyle = GOLD; c.lineWidth = 0.09; c.beginPath(); c.arc(0, 0, 2.7, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(178,150,93,.45)'; c.lineWidth = 0.04; c.beginPath(); c.arc(0, 0, 2.45, 0, TAU); c.stroke();
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, r0 = k % 3 ? 2.2 : 1.95; c.strokeStyle = GOLD; c.lineWidth = k % 3 ? 0.06 : 0.12; c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * 2.45, Math.sin(a) * 2.45); c.stroke(); }
    c.strokeStyle = GOLD; c.lineWidth = 0.1; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-0.8, -1.25); c.lineTo(0.8, -1.25); c.lineTo(0.08, 0); c.lineTo(0.8, 1.25); c.lineTo(-0.8, 1.25); c.lineTo(-0.08, 0); c.closePath(); c.stroke(); c.fillStyle = 'rgba(178,150,93,.25)'; c.fill();
    // the dial round the walkable ground: a dark band, a gold line, minute ticks and the hour bars
    c.strokeStyle = 'rgba(10,12,20,.55)'; c.lineWidth = 0.6; c.beginPath(); c.arc(0, 0, R + 0.3, 0, TAU); c.stroke();
    c.strokeStyle = GOLD; c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(178,150,93,.5)'; c.lineWidth = 0.04; c.beginPath(); c.arc(0, 0, R - 0.35, 0, TAU); c.stroke();
    for (let k = 0; k < 60; k++) { const a = k / 60 * TAU, hr = k % 5 === 0, r0 = hr ? R - 0.75 : R - 0.3; c.strokeStyle = hr ? GOLD : 'rgba(178,150,93,.55)'; c.lineWidth = hr ? 0.16 : 0.05; c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * (R - 0.04), Math.sin(a) * (R - 0.04)); c.stroke(); }
    // beyond the dial the corners lie in shadow, a tomb lid in each
    c.save(); c.beginPath(); c.rect(-H, -H, H * 2, H * 2); c.arc(0, 0, R + 0.35, 0, TAU, true); c.fillStyle = 'rgba(4,6,12,.5)'; c.fill(); c.restore();
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const x = sx * 10.9, y = sy * 11.2, w = 2.5, h = 1.3; c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x - w / 2 - 0.1, y - h / 2 + 0.2, w + 0.2, h + 0.3); c.fillStyle = '#1A202D'; c.fillRect(x - w / 2, y + h / 2 - 0.05, w, 0.4); c.fillStyle = '#323C52'; c.fillRect(x - w / 2, y - h / 2, w, h); c.fillStyle = 'rgba(190,205,235,.08)'; c.fillRect(x - w / 2, y - h / 2, w, 0.12);
      c.fillStyle = GOLD; c.fillRect(x - w / 2, y - 0.06, w, 0.12); c.fillRect(x - 0.06, y - h / 2, 0.12, h); c.strokeStyle = '#0E121A'; c.lineWidth = 0.06; c.strokeRect(x - w / 2, y - h / 2, w, h); }
    // the court's own gold border, inside the curb
    c.strokeStyle = '#3F3420'; c.lineWidth = 0.3; c.strokeRect(-H + 0.15, -H + 0.15, H * 2 - 0.3, H * 2 - 0.3); c.strokeStyle = GOLD; c.lineWidth = 0.12; c.strokeRect(-H + 0.15, -H + 0.15, H * 2 - 0.3, H * 2 - 0.3); }
  /* ---- the halls beyond the court: blue-black dark, colonnades, hanging hourglasses and gold motes, and the great
     still clock on the far wall ---- */
  function paintHalls(c, W, H, t, cam, T) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#05070C'); g.addColorStop(0.5, '#0A0E18'); g.addColorStop(1, '#101624'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(41), cx = W * 0.5, cy = H * 0.2, cr = Math.min(W, H) * 0.32;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25; blitSized(c, glowSprite(VIOLET), cx - cr * 1.4, cy - cr * 1.4, cr * 2.8, cr * 2.8); c.restore();
    c.strokeStyle = 'rgba(178,150,93,.18)'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, cr, 0, TAU); c.stroke(); c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, cr * 0.9, 0, TAU); c.stroke();
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.lineWidth = k % 3 ? 1.5 : 3; c.beginPath(); c.moveTo(cx + Math.cos(a) * cr * 0.78, cy + Math.sin(a) * cr * 0.78); c.lineTo(cx + Math.cos(a) * cr * 0.88, cy + Math.sin(a) * cr * 0.88); c.stroke(); }
    c.strokeStyle = 'rgba(201,176,255,.2)'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + cr * 0.5, cy - cr * 0.3); c.moveTo(cx, cy); c.lineTo(cx - cr * 0.15, cy + cr * 0.65); c.stroke();
    // the colonnade: square pillars with gold capitals, receding
    for (let i = 0; i < 9; i++) { const x = W * (i + 0.5) / 9 + (R() - 0.5) * 10, w = 16 + R() * 8, top = H * (0.38 + R() * 0.05); c.fillStyle = '#0C1018'; c.fillRect(x - w / 2, top, w, H - top); c.fillStyle = 'rgba(178,150,93,.25)'; c.fillRect(x - w / 2 - 3, top, w + 6, 4); c.fillStyle = 'rgba(54,66,90,.25)'; c.fillRect(x - w / 2, top + 4, 3, H - top); }
    // hourglasses hung on chains, each a faint gold point
    for (let i = 0; i < 7; i++) { const x = R() * W, L = 30 + R() * H * 0.3; c.strokeStyle = 'rgba(110,106,96,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, L); c.stroke(); c.fillStyle = 'rgba(178,150,93,.45)'; c.fillRect(x - 5, L, 10, 2); c.fillRect(x - 5, L + 14, 10, 2); c.fillStyle = 'rgba(169,181,197,.25)'; c.beginPath(); c.moveTo(x - 4, L + 2); c.lineTo(x + 4, L + 2); c.lineTo(x, L + 8); c.lineTo(x + 4, L + 14); c.lineTo(x - 4, L + 14); c.lineTo(x, L + 8); c.closePath(); c.fill(); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite(GOLD_HI), x - 9, L - 1, 18, 18); c.restore(); }
    c.fillStyle = GOLD_HI; for (let i = 0; i < 60; i++) { c.globalAlpha = 0.1 + R() * 0.35; c.beginPath(); c.arc(R() * W, R() * H, 0.5 + R() * 1.2, 0, TAU); c.fill(); } c.globalAlpha = 1; }
  /* ---- painting: the coil far to near about the hourglass, the head with its clock face ---- */
  function drawThrenn(c, FX, m, X, Y, T, t) {
    const M = FX.mem; if (!M.hands) M.hands = initHands(); if (!M.segs) solve(FX, m, M, 0, true);
    const P3 = TN.cam(X, Y, T, m), S = M.segs, alt = M.alt == null ? 1.3 : M.alt, lw = Math.max(1.3, T * 0.065), parts = [];
    // its shadow on the flagstones, and the core's gold light pooled under it
    TN.groundShadow(c, X, Y + T * 0.2, T * 2.9, T * 1.2, alt * 0.6, 0.4);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.12 + (M.open || 0) * 0.2 + (M.slump || 0) * 0.15; blitSized(c, glowSprite(GOLD_HI), X - T * 2.2, Y - T * 1.0, T * 4.4, T * 2.2); c.restore();
    for (let i = 1; i < N; i++) { const p = S[i], q = S[i - 1], r = S[Math.min(N - 1, i + 1)], th = Math.atan2(q[1] - r[1], q[0] - r[0]); parts.push({ at: p, draw: () => drawSeg(c, FX, m, M, P3, T, t, i, p, th, lw) }); }
    parts.push({ at: [S[0][0], S[0][1] + 0.2, S[0][2]], draw: () => drawHead(c, FX, m, M, P3, T, t, lw) });
    parts.push({ at: [m.x, m.y, alt], draw: () => drawCore(c, FX, m, M, P3, T, t, lw) });
    sorted(parts).forEach(p => p.draw()); }
  function drawSeg(c, FX, m, M, P3, T, t, i, p, th, lw) {
    const w = WK[i], ct = Math.cos(th), st = Math.sin(th), nx = -st, ny = ct, slump = M.slump || 0, big = BIG(i), last = i === N - 1;
    // the tail: two long spines trailing from the last segment, swaying
    if (last) { const bt = M.bt || t; [-1, 1].forEach(s => { const sw = Math.sin(bt * 2.4 + s) * 0.25; const pts = [p, [p[0] - ct * 0.5 + nx * s * 0.15, p[1] - st * 0.5 + ny * s * 0.15, p[2] + 0.1], [p[0] - ct * 1.0 + nx * (s * 0.35 + sw), p[1] - st * 1.0 + ny * (s * 0.35 + sw), p[2] + 0.25 + sw * 0.3], [p[0] - ct * 1.45 + nx * (s * 0.55 + sw * 1.4), p[1] - st * 1.45 + ny * (s * 0.55 + sw * 1.4), p[2] + 0.35]]; tubeLite(c, pts.map(q => P3(q[0], q[1], q[2])), u => T * (0.12 - u * 0.08), { col: LEG, shade: BODY_SH, hi: BODY_HI, line: INK, lw: lw * 0.8, force: true }); const e = P3(pts[3][0], pts[3][1], pts[3][2]); c.fillStyle = GOLD_HI; c.beginPath(); c.arc(e[0], e[1], T * 0.05, 0, TAU); c.fill(); }); }
    // the legs (four pairs) hang under it and paddle at the air; the far one before the body, the near one after
    const legs = LEGS.includes(i) ? [-1, 1].map(s => { const ph = (M.legPh || t * 3) - i * 0.9 + (s > 0 ? 0 : Math.PI), sw = Math.sin(ph), lift = Math.max(0, Math.cos(ph)) * 0.14, root = [p[0] + nx * s * 0.3 * w, p[1] + ny * s * 0.3 * w, p[2] - 0.08], spread = 0.95 + slump * 0.35;
      const foot = [p[0] + nx * s * spread * w + ct * sw * 0.24, p[1] + ny * s * spread * w + st * sw * 0.24, Math.max(0.04, p[2] - 0.8 + lift + slump * 0.3)]; return { s, root, foot, near: ny * s > 0 }; }) : [];
    const leg = L => { const k = limb(c, P3, L.root, L.foot, 0.22, [nx * L.s, ny * L.s], T * 0.16, T * 0.085, { col: LEG, shade: LEG_SH, hi: LEG_HI, line: INK, lw: lw * 0.8, force: true }, 0.32); const f = P3(L.foot[0], L.foot[1], L.foot[2]), kq = P3(k[0], k[1], k[2]); c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = Math.max(2.4, T * 0.09); c.beginPath(); c.moveTo(f[0], f[1]); c.lineTo(f[0] + (f[0] - kq[0]) * 0.4, f[1] + (f[1] - kq[1]) * 0.4 + T * 0.06); c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(1.2, T * 0.05); c.stroke(); };
    legs.filter(L => !L.near).forEach(leg);
    // the soft dark body between the plates, linking it to the segments either side
    { const q = M.segs[i - 1], r = M.segs[Math.min(N - 1, i + 1)], a = P3((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2 - 0.05), b = P3(p[0], p[1], p[2] - 0.05), e = last ? b : P3((p[0] + r[0]) / 2, (p[1] + r[1]) / 2, (p[2] + r[2]) / 2 - 0.05); tubeLite(c, [a, b, e], () => T * 0.5 * w, { col: BODY_SH, shade: '#0E121A', hi: BODY, line: INK, lw, force: true }); }
    // the segment: a stone body, rounded, under its plate
    ell(c, P3, th, p, [0.35, 0.36 * w, 0.28 * w], { T, col: BODY, shade: BODY_SH, hi: BODY_HI, line: INK, r: T * 0.4 * w, lw, d1: 0.1, d2: 0.22, spec: false, force: true });
    legs.filter(L => L.near).forEach(leg);
    // the plate on its back: a rectangle (a little arched across) with a thickness under it; the six largest blue-grey
    // and edged in gold
    const L2 = big ? 0.3 : 0.25, Wd = (big ? 0.42 : 0.33) * w, zt = p[2] + 0.22 * w, cn = (a, b, dz) => P3(p[0] + ct * a + nx * b, p[1] + st * a + ny * b, zt + dz);
    const top = [cn(L2, Wd, -0.07), cn(L2, 0, 0.05), cn(L2, -Wd, -0.07), cn(-L2, -Wd, -0.07), cn(-L2, 0, 0.05), cn(-L2, Wd, -0.07)], side = top.map(q => [q[0], q[1] + T * 0.11]);
    TN.shape(c, TN.poly(side), { col: big ? GOLD_SH : BODY_SH, line: INK, lw, hi: false, spec: false, r: T * 0.3, force: true });
    TN.shape(c, TN.poly(top), { col: big ? PLATE : PLATE_SH, shade: big ? PLATE_SH : '#3C465A', hi: big ? PLATE_HI : '#6E7D96', line: INK, lw: big ? lw * 1.9 : lw, r: T * 0.32 * w, d1: 0.12, d2: 0.2, spec: false, force: true, inner: g => { if (!big) return; const a = cn(0, Wd * 0.55, 0.02), b = cn(0, -Wd * 0.55, 0.02); g.strokeStyle = 'rgba(30,36,50,.55)'; g.lineWidth = Math.max(1, T * 0.04); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } });
    if (big) { c.save(); c.strokeStyle = GOLD; c.lineWidth = Math.max(1.2, lw * 0.85); c.lineJoin = 'round'; c.beginPath(); TN.poly(top)(c); c.stroke(); c.strokeStyle = 'rgba(232,207,142,.7)'; c.lineWidth = Math.max(0.8, lw * 0.3); c.beginPath(); c.moveTo(top[3][0], top[3][1]); c.lineTo(top[4][0], top[4][1]); c.lineTo(top[5][0], top[5][1]); c.stroke();
      [top[0], top[2], top[3], top[5]].forEach(q => { c.fillStyle = GOLD_HI; c.beginPath(); c.arc(q[0] + (top[1][0] - q[0]) * 0.12, q[1] + (top[1][1] - q[1]) * 0.12 + T * 0.03, Math.max(1, T * 0.035), 0, TAU); c.fill(); }); c.restore(); }
    else { c.strokeStyle = 'rgba(178,150,93,.75)'; c.lineWidth = Math.max(1, lw * 0.4); c.beginPath(); TN.poly(top)(c); c.stroke(); } }
  function drawHead(c, FX, m, M, P3, T, t, lw) {
    const S = M.segs, h = S[0], n1 = S[1], q = P3(h[0], h[1], h[2]), q1 = P3(n1[0], n1[1], n1[2]), hd = M.hd == null ? Math.PI / 2 : M.hd, slump = M.slump || 0, menace = M.menace || 0, hs = m.hitSq || 0;
    // the neck: from the first segment up under the face
    const mid = [(q[0] + q1[0]) / 2 + T * 0.1, (q[1] + q1[1]) / 2 + T * 0.15];
    tubeLite(c, [q1, mid, [q[0] - Math.cos(hd) * T * 0.15, q[1] + T * 0.25]], u => T * (0.42 - u * 0.1), { col: BODY, shade: BODY_SH, hi: BODY_HI, line: INK, lw, force: true });
    // which way it looks, a little, and a flinch when struck
    const me = FX.me || { x: m.x, y: m.y + 5 }, look = clamp((me.x - h[0]) * 0.03, -0.18, 0.18), rot = look + Math.sin((M.bt || t) * 1.1) * 0.05 - hs * 0.25 + (M.recoil || 0) * 0.1;
    drawFace(c, q[0], q[1], T, M, m, t, lw, { hd, lie: slump, rot, menace }); }
  /* the face: a drum of stone behind, a gold bezel, a pale dial with twelve marks and three thick hands; two hooked
     claws under it (no mouth), spread when it means to bite. The stopped hand points where it will strike, glowing */
  function drawFace(c, x, y, T, M, m, t, lw, o) {
    const R = T * 0.84 * (1 + (M.roar || 0) * 0.08 - (m.hitSq || 0) * 0.06), hd = o.hd, sq = 0.78 + 0.22 * Math.abs(Math.sin(hd)), ry = 1 - (o.lie || 0) * 0.5, rot = o.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot), menace = o.menace || 0, fzK = M.fzK || 0;
    const L = (u, v) => [x + u * sq * cr - v * ry * sr, y + u * sq * sr + v * ry * cr];
    // the claws under it
    [-1, 1].forEach(s => { const sp = 0.25 + menace * 0.45 + Math.sin((M.bt || t) * 3 + s) * 0.05; const a = L(s * R * 0.55, R * 0.55), b = L(s * R * (0.55 + sp * 0.5), R * 1.15), e = L(s * R * (0.15 + sp * 0.25), R * 1.55); tubeLite(c, [a, b, e], u => T * (0.17 - u * 0.13), { col: BODY, shade: BODY_SH, hi: BODY_HI, line: INK, lw: lw * 0.85, force: true }); c.fillStyle = GOLD_HI; c.beginPath(); c.arc(e[0], e[1], Math.max(1, T * 0.04), 0, TAU); c.fill(); });
    // the drum of the head behind the face
    const bx = -Math.cos(hd) * T * 0.22, by = -Math.sin(hd) * T * 0.1 - T * 0.06;
    TN.shape(c, TN.ell(x + bx, y + by, R * sq * 1.1, R * ry * 1.1, rot), { col: BODY, shade: BODY_SH, hi: BODY_HI, line: INK, r: R, lw, spec: false, force: true });
    if (fzK > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fzK * (0.45 + 0.2 * Math.sin(t * 10)); blitSized(c, glowSprite(VIOLET), x - R * 2.2, y - R * 2.2, R * 4.4, R * 4.4); c.restore(); }
    // the bezel and the dial
    TN.shape(c, TN.ell(x, y, R * sq * 1.08, R * ry * 1.08, rot), { col: GOLD, shade: GOLD_SH, hi: GOLD_HI, line: INK, r: R, lw, d1: 0.1, d2: 0.18, spec: 0.6, specAt: [x - R * 0.55, y - R * 0.7], force: true });
    TN.shape(c, TN.ell(x, y, R * sq * 0.9, R * ry * 0.9, rot), { col: FACE, shade: FACE_SH, hi: FACE_HI, line: INK, r: R * 0.9, lw: lw * 0.8, d1: 0.08, d2: 0.16, spec: false, force: true });
    c.save(); c.lineCap = 'round';
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, big = k % 3 === 0, p0 = L(Math.sin(a) * R * (big ? 0.62 : 0.7), -Math.cos(a) * R * (big ? 0.62 : 0.7)), p1 = L(Math.sin(a) * R * 0.82, -Math.cos(a) * R * 0.82); c.strokeStyle = big ? GOLD_SH : 'rgba(40,46,62,.7)'; c.lineWidth = Math.max(1.2, T * (big ? 0.075 : 0.035)); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); }
    // the hands: three thick marks; the stopped one violet
    const HL = [0.48, 0.66, 0.78], HW = [0.2, 0.16, 0.12];
    M.hands.forEach((Hh, k) => { const a = handA(Hh), fz = M.fz === k ? fzK : 0, jit = (m.hitSq || 0) * 0.3 * Math.sin(t * 60 + k), e = L(Math.sin(a + jit) * R * HL[k], -Math.cos(a + jit) * R * HL[k]), b = L(-Math.sin(a + jit) * R * 0.14, Math.cos(a + jit) * R * 0.14), w = Math.max(2, R * HW[k]);
      if (fz > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fz * 0.8; blitSized(c, glowSprite(VIOLET_HI), e[0] - R * 0.6, e[1] - R * 0.6, R * 1.2, R * 1.2); c.restore(); }
      c.strokeStyle = INK; c.lineWidth = w + 2.4; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(e[0], e[1]); c.stroke();
      c.strokeStyle = fz > 0.05 ? TN.rgba(VIOLET_HI, 0.35 + fz * 0.65) : HAND; c.lineWidth = w; c.stroke();
      c.strokeStyle = fz > 0.05 ? `rgba(255,255,255,${fz * 0.8})` : 'rgba(169,181,197,.55)'; c.lineWidth = Math.max(1, w * 0.28); c.beginPath(); c.moveTo((b[0] + e[0]) / 2, (b[1] + e[1]) / 2); c.lineTo(e[0], e[1]); c.stroke(); });
    const pin = L(0, 0); c.fillStyle = GOLD_HI; c.strokeStyle = INK; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.arc(pin[0], pin[1], R * 0.12, 0, TAU); c.fill(); c.stroke();
    // a glare across the glass
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = Math.max(1.2, R * 0.07); c.beginPath(); c.ellipse(x, y, R * sq * 0.72, R * ry * 0.72, rot, -2.6, -1.7); c.stroke();
    if (fzK > 0.05) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = TN.rgba(VIOLET_HI, fzK * (0.5 + 0.3 * Math.sin(t * 12))); c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.ellipse(x, y, R * sq * (1.18 + 0.06 * Math.sin(t * 8)), R * ry * (1.18 + 0.06 * Math.sin(t * 8)), rot, 0, TAU); c.stroke(); }
    c.restore();
    if ((o.lie || 0) > 0.5) for (let i = 0; i < 3; i++) { const a = (M.bt || t) * 3 + i * TAU / 3; TN.twinkle(c, x + Math.cos(a) * R * 1.4, y - R * 1.3 + Math.sin(a) * R * 0.3, T * 0.18, '#FFFFFF', 0.9); } }
  /* the hourglass core: gold caps, three posts turning about it, two glass bulbs, sand that runs (and hangs, violet,
     while a moment is borrowed); bare, it blazes; cracked, the glass splits */
  function drawCore(c, FX, m, M, P3, T, t, lw) {
    const alt = M.alt == null ? 1.3 : M.alt, Q = P3(m.x, m.y, alt), hh = T * 1.1, wr = T * 0.6, open = M.open || 0, menace = M.menace || 0, slump = M.slump || 0, roar = M.roar || 0, rot = M.coreRot || 0, held = !!(M.bm && M.bm.launched && !M.bm.released), sand = M.sand == null ? 0.3 : M.sand;
    const glowK = 0.3 + menace * 0.25 + open * 0.6 + slump * 0.4 + roar * 0.4, gc = held || menace > 0.6 ? VIOLET : GOLD_HI;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, glowK) * (0.8 + 0.2 * Math.sin(t * 5)); blitSized(c, glowSprite(gc), Q[0] - T * 2.1, Q[1] - T * 2.3, T * 4.2, T * 4.6);
    if (open > 0.05) { c.globalAlpha = open * 0.7; blitSized(c, glowSprite('#FFF4D0'), Q[0] - T * 1.1, Q[1] - T * 1.2, T * 2.2, T * 2.4); c.strokeStyle = TN.rgba(GOLD_HI, open * 0.5); c.lineWidth = Math.max(1, T * 0.05); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + rot * 0.5; c.beginPath(); c.moveTo(Q[0] + Math.cos(a) * T * 1.2, Q[1] + Math.sin(a) * T * 1.2); c.lineTo(Q[0] + Math.cos(a) * T * 1.5, Q[1] + Math.sin(a) * T * 1.5); c.stroke(); } }
    c.restore();
    c.save(); c.translate(Q[0], Q[1]); c.rotate((M.flip || 0) + Math.sin((M.bt || t) * 0.8) * 0.05 + slump * 0.5);
    const post = (a, front) => { const x = Math.cos(a) * wr * 0.98, d = Math.sin(a); if ((d > 0) !== front) return; c.fillStyle = front ? GOLD : GOLD_SH; c.strokeStyle = INK; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); c.rect(x - T * 0.045, -hh * 0.92, T * 0.09, hh * 1.84); c.fill(); c.stroke(); };
    const posts = front => { for (let k = 0; k < 3; k++) post(rot + k * TAU / 3, front); };
    const cap = (y, top) => { TN.shape(c, TN.ell(0, y + T * 0.07, wr * 1.15, wr * 0.36), { col: GOLD_SH, line: INK, lw, hi: false, spec: false, r: wr, force: true }); TN.shape(c, TN.ell(0, y, wr * 1.15, wr * 0.36), { col: GOLD, shade: GOLD_SH, hi: GOLD_HI, line: INK, lw, r: wr, d1: 0.14, d2: 0.24, spec: top ? 0.6 : false, specAt: [-wr * 0.5, y - wr * 0.12], force: true }); };
    const glass = g => { g.moveTo(-wr * 0.82, -hh * 0.9); g.bezierCurveTo(-wr * 1.0, -hh * 0.3, -wr * 0.14, -hh * 0.16, -wr * 0.11, 0); g.bezierCurveTo(-wr * 0.14, hh * 0.16, -wr * 1.0, hh * 0.3, -wr * 0.82, hh * 0.9); g.lineTo(wr * 0.82, hh * 0.9); g.bezierCurveTo(wr * 1.0, hh * 0.3, wr * 0.14, hh * 0.16, wr * 0.11, 0); g.bezierCurveTo(wr * 0.14, -hh * 0.16, wr * 1.0, -hh * 0.3, wr * 0.82, -hh * 0.9); g.closePath(); };
    cap(hh * 0.95, false); posts(false);
    // the glass and the sand in it
    c.beginPath(); glass(c); c.fillStyle = 'rgba(190,205,230,.22)'; c.fill();
    c.save(); c.beginPath(); glass(c); c.clip(); const sc = held ? VIOLET_HI : GOLD_HI, sd = held ? VIOLET : GOLD;
    const top = 1 - sand, yT = -hh * (0.1 + 0.72 * top); c.fillStyle = sd; c.beginPath(); c.moveTo(-wr, 0); c.lineTo(-wr, yT); c.quadraticCurveTo(0, yT + hh * 0.12, wr, yT); c.lineTo(wr, 0); c.closePath(); if (top > 0.02) c.fill();
    const yB = hh * (0.9 - 0.72 * sand); c.fillStyle = sd; c.beginPath(); c.moveTo(-wr, hh); c.lineTo(-wr, yB + hh * 0.08); c.quadraticCurveTo(0, yB - hh * 0.1, wr, yB + hh * 0.08); c.lineTo(wr, hh); c.closePath(); c.fill();
    c.fillStyle = sc; c.globalAlpha = 0.6; c.fillRect(-wr, yB + hh * 0.02, wr * 2, hh * 0.05); c.globalAlpha = 1;
    if (!held && !(m.stunT > 0) && top > 0.02) { c.strokeStyle = sc; c.lineWidth = Math.max(1, T * 0.035); c.setLineDash([T * 0.06, T * 0.04]); c.lineDashOffset = -t * T * 1.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, yB); c.stroke(); c.setLineDash([]); }
    if (held) { c.fillStyle = VIOLET_HI; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(Math.sin(k * 2.1) * T * 0.02, hh * (0.08 + k * 0.12), Math.max(1, T * 0.025), 0, TAU); c.fill(); } }
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 + open * 0.5; blitSized(c, glowSprite(sc), -wr, yB - wr * 0.6, wr * 2, wr * 1.6); c.restore();
    c.beginPath(); glass(c); c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); c.strokeStyle = 'rgba(228,234,242,.55)'; c.lineWidth = Math.max(1, lw * 0.45); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = Math.max(1.2, T * 0.05); c.lineCap = 'round'; c.beginPath(); c.moveTo(-wr * 0.6, -hh * 0.72); c.quadraticCurveTo(-wr * 0.72, -hh * 0.42, -wr * 0.35, -hh * 0.2); c.moveTo(-wr * 0.55, hh * 0.4); c.quadraticCurveTo(-wr * 0.7, hh * 0.6, -wr * 0.6, hh * 0.78); c.stroke();
    const ck = M.cracked || 0; if (ck > 0.05) { c.strokeStyle = TN.rgba('#FFFFFF', Math.min(1, ck * 1.3)); c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.moveTo(-wr * 0.2, -hh * 0.8); c.lineTo(wr * 0.1, -hh * 0.55); c.lineTo(-wr * 0.15, -hh * 0.38); c.lineTo(wr * 0.3, -hh * 0.2); c.moveTo(wr * 0.1, -hh * 0.55); c.lineTo(wr * 0.45, -hh * 0.62); c.moveTo(wr * 0.2, hh * 0.35); c.lineTo(-wr * 0.15, hh * 0.55); c.lineTo(wr * 0.05, hh * 0.75); c.stroke(); }
    posts(true); cap(-hh * 0.95, true);
    c.restore(); }
  /* ---- the imprint left lying in a lane: ghosts of the creature down its length, and the lane's outline wearing away
     as the countdown to its second bite runs ---- */
  function drawImprint(c, z, FX, T, t) { const s = z.tele, u = s ? clamp(s.age / s.t, 0, 1) : 1, fade = Math.min(1, z.age / 0.25, (z.life - z.age) / 0.3), ca = Math.cos(z.a), sa = Math.sin(z.a), nx = -sa, ny = ca;
    const W = (al, of) => [FX.sx(z.x + ca * al + nx * of), FX.sy(z.y + sa * al + ny * of)];
    c.save(); c.globalAlpha = fade;
    // the outline, and the part of it still left to run
    const corners = [W(0, -z.w / 2), W(z.len, -z.w / 2), W(z.len, z.w / 2), W(0, z.w / 2)];
    c.strokeStyle = TN.rgba(VIOLET_HI, 0.25); c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); TN.poly(corners)(c); c.stroke();
    partialPoly(c, corners.concat([corners[0]]), 1 - u, TN.rgba(VIOLET_HI, 0.85 + 0.15 * Math.sin(t * 14) * u), Math.max(2, T * 0.12));
    // ghosts of the body lying down the lane, brightening as the bite nears
    c.globalCompositeOperation = 'lighter'; const k = 0.22 + u * 0.4 + (u > 0.8 ? Math.sin(t * 30) * 0.12 : 0);
    for (const g of [0.22, 0.5, 0.78, 1.0]) { const head = z.len * g - 0.6; for (let i = N - 1; i >= 0; i--) { const al = head - i * 0.62, of = Math.sin(i * 0.8) * 0.22 * (i / N) * (z.dir || 1); if (al < 0.2) continue; const p = W(al, of), r = T * (i ? 0.36 * WK[i] : 0.8);
        c.globalAlpha = fade * k * (i ? 0.55 : 0.8) * (0.4 + 0.6 * g); c.fillStyle = TN.rgba(VIOLET, 0.6); c.strokeStyle = TN.rgba(VIOLET_HI, 0.9); c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); if (i) { c.save(); c.translate(p[0], p[1]); c.rotate(z.a); c.rect(-r * 0.75, -r, r * 1.5, r * 2); c.restore(); } else c.arc(p[0], p[1], r, 0, TAU); c.fill(); c.stroke();
        if (!i) { c.strokeStyle = TN.rgba('#FFFFFF', 0.7); c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + Math.cos(z.a) * r * 0.75, p[1] + Math.sin(z.a) * r * 0.75); c.moveTo(p[0], p[1]); c.lineTo(p[0] - r * 0.4, p[1] - r * 0.45); c.stroke(); } } }
    c.restore(); }
  function partialPoly(c, pts, f, col, w) { if (f <= 0) return; let tot = 0; for (let i = 1; i < pts.length; i++) tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); let left = tot * f;
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length && left > 0; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]), u = Math.min(1, left / (d || 1)); c.lineTo(lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)); left -= d; } c.stroke(); }
  /* ---- in the air: the afterimages of a rush, the borrowed seconds, the bare core's mark ---- */
  function drawAir(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const s of M.smear) { const u = s.t / 0.45, a = (1 - u) * 0.35, X = FX.sx(s.x), Y = FX.sy(s.y) - s.z * T, HX = FX.sx(s.hx), HY = FX.sy(s.hy) - s.hz * T; c.globalAlpha = a; c.strokeStyle = VIOLET_HI; c.lineWidth = T * 0.7; c.lineCap = 'round'; c.beginPath(); c.moveTo(X - Math.cos(s.a) * T * 2, Y - Math.sin(s.a) * T * 2); c.lineTo(HX, HY); c.stroke(); c.globalAlpha = a * 1.4; c.fillStyle = VIOLET_HI; c.beginPath(); c.arc(HX, HY, T * 0.6, 0, TAU); c.fill(); }
    c.restore();
    for (const o of M.orbs) drawOrb(c, FX, o, T, t);
    // the bare core: its name, and how near it is to cracking
    const co = M.coreObj; if (co && !co.dead && M.expose > 0) { const X = FX.sx(m.x), Y = FX.sy(m.y) - M.alt * T, f = clamp(co.hp / co.maxhp, 0, 1), w = M.expose / (M.exposeMax || 1);
      c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = Math.max(3, T * 0.14); c.beginPath(); c.arc(X, Y, T * 1.35, 0, TAU); c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(2, T * 0.09); c.beginPath(); c.arc(X, Y, T * 1.35, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke();
      c.strokeStyle = TN.rgba(SILVER_HI, 0.7); c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.arc(X, Y, T * 1.55, -Math.PI / 2, -Math.PI / 2 + TAU * w); c.stroke();
      c.font = `800 ${Math.round(T * 0.3)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)'; c.fillStyle = '#FFFFFF'; c.strokeText('CORE · crack it', X, Y - T * 1.9); c.fillText('CORE · crack it', X, Y - T * 1.9); c.restore(); } }
  /* a borrowed second: a small gold-rimmed dial with a violet heart and one hand; hanging, it is ringed by stopped
     ticks and a countdown, its path drawn ahead of it; loosed, it streaks along that path */
  function drawOrb(c, FX, o, T, t) { const X = FX.sx(o.x), Y = FX.sy(o.y), Yz = Y - o.z * T, r = T * 0.3, lw = Math.max(1.2, T * 0.05), fade = o.state === 'done' ? Math.max(0, 1 - o.t / 0.3) : 1;
    if (fade <= 0) return; c.save(); c.globalAlpha = fade;
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X, Y, r * 0.9, r * 0.35, 0, 0, TAU); c.fill();
    if (o.state === 'held' || o.state === 'fly') { const u = o.tele ? clamp(o.tele.age / o.tele.t, 0, 1) : 0, ca = Math.cos(o.a), sa = Math.sin(o.a);
      // its path, drawn at its own height ahead of it: a dashed line and chevrons that do not move
      c.strokeStyle = TN.rgba(VIOLET_HI, 0.85); c.lineWidth = Math.max(1.5, T * 0.07); for (let d = 1.0; d < o.len - 0.4; d += 1.5) { const px = FX.sx(o.x + ca * d), py = FX.sy(o.y + sa * d); c.beginPath(); c.moveTo(px - (ca * 0.3 - sa * 0.25) * T, py - (sa * 0.3 + ca * 0.25) * T); c.lineTo(px, py); c.lineTo(px - (ca * 0.3 + sa * 0.25) * T, py - (sa * 0.3 - ca * 0.25) * T); c.stroke(); }
      c.strokeStyle = 'rgba(201,176,255,.35)'; c.lineWidth = 1; c.setLineDash([2, 3]); c.beginPath(); c.moveTo(X, Y); c.lineTo(X, Yz + r); c.stroke(); c.setLineDash([]);
      if (o.state === 'held') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade * (0.5 + 0.3 * u); blitSized(c, glowSprite(VIOLET), X - r * 3, Yz - r * 3, r * 6, r * 6); c.restore();
        c.strokeStyle = TN.rgba(VIOLET_HI, 0.8); c.lineWidth = Math.max(1, T * 0.035); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.beginPath(); c.moveTo(X + Math.cos(a) * r * 1.5, Yz + Math.sin(a) * r * 1.5); c.lineTo(X + Math.cos(a) * r * 1.8, Yz + Math.sin(a) * r * 1.8); c.stroke(); }
        c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.arc(X, Yz, r * 2.0, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - u)); c.stroke(); } }
    else if (o.state === 'go') { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = VIOLET_HI; c.lineCap = 'round'; for (let k = 1; k <= 4; k++) { c.globalAlpha = fade * (0.35 - k * 0.07); c.lineWidth = r * (1.6 - k * 0.25); c.beginPath(); c.moveTo(X, Yz); c.lineTo(X - Math.cos(o.a) * T * k * 0.45, Yz - Math.sin(o.a) * T * k * 0.45); c.stroke(); } c.globalAlpha = fade * 0.7; blitSized(c, glowSprite(VIOLET), X - r * 2.5, Yz - r * 2.5, r * 5, r * 5); c.restore(); }
    // the little dial itself
    TN.shape(c, TN.ell(X, Yz, r, r), { col: GOLD, shade: GOLD_SH, hi: GOLD_HI, line: INK, lw, r, spec: false, force: true });
    c.fillStyle = '#1A1230'; c.beginPath(); c.arc(X, Yz, r * 0.7, 0, TAU); c.fill(); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; blitSized(c, glowSprite(VIOLET_HI), X - r, Yz - r, r * 2, r * 2); c.restore();
    const ha = o.state === 'go' ? o.spin + o.t * 14 : o.spin; c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(1.5, T * 0.06); c.lineCap = 'round'; c.beginPath(); c.moveTo(X, Yz); c.lineTo(X + Math.sin(ha) * r * 0.6, Yz - Math.cos(ha) * r * 0.6); c.stroke();
    c.restore(); }
})());
