/* ---------- KHYROS THE HOUND BEYOND THE ANGLES ----------
   The Sepulchre's last boss, in the Final Sanctuary: a square platform of violet stone hanging in a starless void, four
   recessed alcoves in its corners, and at its heart a circular sanctuary ringed by one continuous silver border, the one
   place without a corner, which nothing that comes out of an angle may cross. Khyros is a seven-metre hound assembled
   from sharp matte-black planes: a deep keeled chest, a waist pinched almost to nothing, a long low crocodilian head,
   four legs bent back on themselves in hard zig-zags that end in three triangular claws, six violet slits down each
   flank, and in place of a tail three loose spearheads hovering in line behind it. Moving fast it sheds thin violet
   wireframes of itself; its body (and what it hits) never blurs.
   Angle Stalk (all fight): it steps out of where it stands, a corner lights and a violet lane runs from it; then it
   comes out of the angle along the lane. Off the lane. A lane stops at the silver ring; a lunge that ends in a corner
   wedges it there: STUCK IN THE ANGLE, the flank slits bared to be struck.
   Hunt the Past (below 70%): it marks where the pet stands, three times (numbered ghosts), and comes out of three corners
   along lanes through those marks, in order. Lay the marks by the outer wall and hide in the ring: lanes along the wall
   end in corners and the last one wedges it. A mark laid inside the ring brings its lane through the ring.
   Stolen Exit (below 35%): two lanes cross the sanctuary and it is closed: no longer proof against the angles, which come
   quickly now. The Memory Loom at its southern edge records the pet: step on it, walk onto the release plate inside the
   ring, and a gold echo walks the same path and holds the plate, and the sanctuary stays open for eight seconds while
   the pet dodges outside. Unused, the sanctuary simply stays closed until the stolen hour runs out.
   Also: Angled Jaw (a cone bite when close), Tail of Angles (the three spears thrown to rings round the pet) and, from
   the second phase, corner pups called out of the alcoves.
   It is never still: it stalks head low on its bent legs, the head turning to glare at the pet; the slits pulse down its
   flanks in sequence and the spears bob behind it one after another; it coils in its alcove before a lunge, stretches
   flat in the run and sheds wireframes; struck it flinches, head jerking up; wedged it thrashes and scrabbles, sparks off
   its claws; it assembles out of a wireframe with a howl on entering. */
RiftFiend.define({ id: 'khyros', name: 'Khyros', title: 'The Hound Beyond the Angles', color: '#16121E', glow: '#8E6BD0', accent: '#E8DDFF', biome: 'borrowed', r: 2.4, els: ['dark', 'light'], phases: 3, cuts: [1, 0.7, 0.35] }, (() => {
  const { TAU, TN } = RiftFiend, { INK, SILVER, SILVER_HI, GOLD, GOLD_HI, VIOLET, VIOLET_HI } = SEP;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const HS = 12, SR = 5.5, BS = 0.85, TIP = 5.2 * BS, LV = 27, CS = [[-1, -1], [1, -1], [1, 1], [-1, 1]], VIOLET_DK = '#2A1A4A', ROSE = '#FF6FB0';
  const cornerPt = (C, i, k) => [C.x + CS[i][0] * (HS - k), C.y + CS[i][1] * (HS - k)];
  /* the hound's sections, tail to snout: [u along it, centre height, half width, ridge above, keel below] (before BS) */
  const SECT = [[-2.55, 1.62, 0.06, 0.05, 0.05], [-2.15, 1.62, 0.42, 0.3, 0.32], [-1.65, 1.63, 0.6, 0.42, 0.46], [-1.05, 1.73, 0.42, 0.3, 0.3], [-0.45, 1.8, 0.27, 0.24, 0.24], [0.25, 1.76, 0.56, 0.42, 0.64], [0.95, 1.7, 0.8, 0.54, 1.0], [1.65, 1.64, 0.74, 0.54, 0.88], [2.2, 1.52, 0.52, 0.44, 0.5], [2.7, 1.28, 0.36, 0.3, 0.3], [3.15, 1.06, 0.44, 0.3, 0.2], [3.65, 0.98, 0.37, 0.24, 0.13], [4.35, 0.9, 0.24, 0.15, 0.09], [4.95, 0.86, 0.12, 0.08, 0.05], [5.25, 0.85, 0.02, 0.02, 0.02]];
  const JAW = [[3.05, 0.4, 0.17, 0.87], [3.65, 0.33, 0.14, 0.86], [4.35, 0.21, 0.1, 0.82], [4.95, 0.08, 0.05, 0.8]];
  const LEGS = [{ u0: 1.45, sd: 1, front: 1, ph: 0 }, { u0: 1.45, sd: -1, front: 1, ph: Math.PI }, { u0: -1.7, sd: 1, front: 0, ph: Math.PI }, { u0: -1.7, sd: -1, front: 0, ph: 0 }];
  const LIGHT = (() => { const l = [-0.42, -0.5, 0.76], n = Math.hypot(...l); return l.map(v => v / n); })();
  const inSquare = (C, x, y, pad) => Math.abs(x - C.x) < HS - (pad || 0) && Math.abs(y - C.y) < HS - (pad || 0);
  const inSanct = (C, x, y, pad) => Math.hypot(x - C.x, y - C.y) < SR + (pad || 0);
  const sanctOpen = M => !(M.closedT > 0) || M.heldT > 0;
  const W0 = (m, M, u, v, h) => { const th = M.hd == null ? Math.PI / 2 : M.hd, cf = Math.cos(th), sf = Math.sin(th); return [m.x + (cf * u - sf * v) * BS, m.y + (sf * u + cf * v) * BS, h * BS]; };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const addv = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k], mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  let offCv = null;
  return {
    arenaR: 17, firstAct: 'prowl',
    artPoses: [{ name: 'stalking, head low', mem: { demo: 1, hd: 0.35, spdK: 0.6, gait: 1.2, look: 0.4 } }, { name: 'coiled in an alcove', mem: { demo: 1, hd: 1.2, crouch: 1, menace: 1, jaw: 0.3 } }, { name: 'the lunge', mem: { demo: 1, hd: 0, lunge: 1, jaw: 0.5 } }, { name: 'stuck in the angle: the slits bared', mem: { demo: 1, hd: 0.8, stuck: 1, slitK: 1, jaw: 0.6 } }],
    phaseNames: ['Angle Stalk', 'Hunt the Past', 'Stolen Exit', 'Stolen Exit'],
    start(C) { return { x: C.x + 0.5, y: C.y + HS - 2.2 }; },
    // the walkable ground is the square: everything of the disc outside it is wall
    carve(set, C) { for (let y = -C.R - 1; y <= C.R + 1; y++) for (let x = -C.R - 1; x <= C.R + 1; x++) { const wx = Math.floor(C.x) + x, wy = Math.floor(C.y) + y; if (Math.abs(wx + 0.5 - C.x) > HS || Math.abs(wy + 0.5 - C.y) > HS) set(wx, wy, T_SOLID); } },
    paintGround(c, A) { paintSanctuary(c, A); },
    sky(c, W, H, t, cam, T) { voidSky(c, W, H, t, cam, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.x = C.x; m.y = C.y - SR - 4.2; m.act = 'enter'; m.touchK = 0.55; m.noTouch = true;
      Object.assign(M, { hd: Math.PI / 2, look: 0, crouch: 0, crouchTo: 0, lunge: 0, jaw: 0, jawTo: 0, menace: 0, recoil: 0, roar: 0, howl: 0, howlTo: 0, stuck: 0, lean: 0, fade: 1, fadeTo: 1, bt: 0, px: m.x, py: m.y, spd: 0, ghosts: [], ghT: 0, flickT: 3, lit: [0, 0, 0, 0], litTo: [0, 0, 0, 0], q: [], qt: 0, lg: null, marks: [], seen: {}, nextSig: null, broodT: 14, exitT: 0, closedT: 0, heldT: 0, picks: 0, slitK: 0, sparkT: 0, gait: 0, spdK: 0, orb: null, dir: 1, wasEnter: true, roared: false, wasStun: false, wantAngle: false, sanK: 1, goldK: 0,
        spears: [0, 1, 2].map(() => ({ st: 'hover', t: 0 })) });
      M.loom = { x: C.x, y: C.y + SR + 1.0, st: 'idle', ch: 0, t: 0, path: [], echo: { x: 0, y: 0, dead: false }, zone: null, told: 0 };
      M.plate = { x: C.x + SR - 1.3, y: C.y, told: 0 }; },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; reset(FX, m); M.roar = 1; M.howl = 1; M.menace = 1; M.recoil = 0.6; FX.H.shake(10, 0.5); FX.H.flash(0.2, VIOLET); FX.H.sfx.crash(); FX.H.sparks(m.x, m.y - 2, VIOLET_HI, 22, 8);
      if (lv === 2) { M.nextSig = 'hunt'; M.broodT = 9; callPups(FX, m, 2); FX.H.banner('HUNT THE PAST', 'It hunts where you have been · corner pups come out of the angles', VIOLET_HI, 2.6, true); }
      if (lv >= 3) { M.nextSig = 'exit'; M.exitT = 0; M.broodT = 8; FX.H.banner('STOLEN EXIT', 'It steals the sanctuary itself: the Memory Loom gives it back', GOLD_HI, 2.6, true); } },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, P = FX.S.lv, fast = FX.S.fast * (1 + (P - 1) * 0.08); m.actT += dt;
      m.noTouch = M.fade > 0.3 || !!M.lg || m.act === 'angle' || m.act === 'hunt' || m.act === 'exit';
      // the act's own timeline, then the run of a lunge
      M.qt += dt; while (M.q.length && M.q[0].at <= M.qt) M.q.shift().fn();
      if (M.lg) runLunge(FX, m, dt * fast);
      if (P >= 2 && (M.broodT -= dt) <= 0 && m.act === 'prowl') { M.broodT = P >= 3 ? 12 : 15; if (pupsAlive(FX) < 4) startHowl(FX, m); }
      if (P >= 3 && !(M.closedT > 0)) M.exitT -= dt;
      let menace = 0; M.crouchTo = 0; M.jawTo = 0; M.howlTo = 0; M.lean = toward(M.lean, 0, dt, 4);
      switch (m.act) {
        case 'prowl': prowl(FX, m, dt, fast); menace = 0.25; if (m.actT > (P >= 3 ? 1.15 : 1.55) / FX.S.fast) choose(FX, m); break;
        case 'recover': menace = 0.2; M.crouchTo = 0.2; if (m.actT > M.recT) { m.act = 'prowl'; m.actT = 0; } break;
        case 'snap': { const a = M.snapA, pre = m.actT < M.aw; menace = 1; M.hd = FX.K.lerpA(M.hd, a, Math.min(1, dt * 9)); M.look = toward(M.look, 0, dt, 6);
          if (pre) { M.crouchTo = 0.55; M.jawTo = clamp(m.actT / M.aw, 0, 1); M.lean = toward(M.lean, -0.6, dt, 5); }
          else { const k = m.actT - M.aw; if (k < 0.16) { m.x += Math.cos(a) * 14 * dt; m.y += Math.sin(a) * 14 * dt; keepOut(FX, m); } M.jawTo = 0; M.lean = toward(M.lean, 0.6, dt, 8); if (k > 0.55) { m.act = 'prowl'; m.actT = 0; } }
          break; }
        case 'spears': menace = 0.6; M.crouchTo = 0.25; faceTo(FX, m, M, dt, 4); if (m.actT > M.aw) { m.act = 'prowl'; m.actT = 0; } break;
        case 'howl': menace = 0.8; M.howlTo = m.actT < 1.3 ? 1 : 0; M.jawTo = m.actT < 1.3 ? 1 : 0; if (m.actT > 0.8 && !M.called) { M.called = true; callPups(FX, m, 2); } if (m.actT > 1.7) { m.act = 'prowl'; m.actT = 0; } break;
        case 'angle': case 'hunt': case 'exit': menace = 0.9; if (!M.lg && M.fade < 0.3) { M.crouchTo = 1; M.jawTo = 0.35; }
          if (M.lg) { M.crouchTo = 0; M.jawTo = 0.6; }
          if (!M.q.length && !M.lg && m.actT > 16) { reset(FX, m); } break;
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3);
      if (M.fade < 0.6) FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.stuck = Math.min(1, M.stuck + dt * 3); M.crouchTo = 0.35; M.jawTo = 0.7; M.slitK = toward(M.slitK, 1, dt, 4); M.menace = decay(M.menace, dt, 3); m.noTouch = true; M.fadeTo = 0; M.lg = null;
      const p = slitAt(FX, m, M); FX.weak('slits', p[0], p[1], 1.5, 2.4, m.stunT > 0.05);
      // wedged: it thrashes, its claws scrabbling sparks off the stone
      M.sparkT -= dt; if (M.sparkT <= 0) { M.sparkT = 0.22; const cf = Math.cos(M.hd), sf = Math.sin(M.hd), sd = Math.random() < 0.5 ? 1 : -1, fx = m.x + cf * 1.9 * BS - sf * sd * 0.9, fy = m.y + sf * 1.9 * BS + cf * sd * 0.9; FX.H.sparks(fx, fy, SILVER_HI, 5, 5); if (Math.random() < 0.35) FX.H.sfx.thud(); FX.H.shake(1.5, 0.08); }
      if (M.fade < 0.6) FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m) return; M.bt += dt; const me = FX.me, C = FX.C;
      if (!(m.stunT > 0)) { if (FX.S.weak.slits) FX.weak('slits', 0, 0, 0, 0, false); M.stuck = decay(M.stuck, dt, 2.5); M.slitK = decay(M.slitK, dt, 1.2); if (M.wasStun) { M.wasStun = false; M.recoil = 1; M.roar = 0.5; FX.H.text(m.x, m.y - 3, 'It tears free of the angle', VIOLET_HI, 13); ghost(M, poseOf(m, M), 0.6); } } else M.wasStun = true;
      // how it moves, and the bits of its body that follow the act (a crouch, the jaw, a howl)
      if (dt > 1e-4) { const vx = (m.x - M.px) / dt, vy = (m.y - M.py) / dt, jump = Math.hypot(vx, vy) > 60; M.px = m.x; M.py = m.y; M.spd = jump ? 0 : toward(M.spd, Math.hypot(vx, vy), dt, 8); }
      M.crouch = toward(M.crouch, M.crouchTo || 0, dt, 6); M.jaw = toward(M.jaw, Math.max(M.jawTo || 0, M.roar * 0.9), dt, (M.jawTo || 0) > M.jaw ? 7 : 12); M.howl = toward(M.howl, Math.max(M.howlTo || 0, m.act === 'enter' && FX.S.enterT > 1.2 ? 1 : 0), dt, 4);
      M.lunge = toward(M.lunge, M.lg ? 1 : 0, dt, M.lg ? 12 : 5); if (M.lg) M.gait += dt * 15;
      M.roar = decay(M.roar, dt, 0.7); M.recoil = decay(M.recoil, dt, 2.6);
      M.fade = toward(M.fade, M.fadeTo, dt, M.fadeTo > M.fade ? 8 : 6);
      // the head turns to glare at the pet (as far as the neck allows)
      if (!M.lg && m.act !== 'snap') { let da = Math.atan2(me.y - m.y, me.x - m.x) - M.hd; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; M.look = toward(M.look, clamp(da, -0.8, 0.8), dt, 4); }
      // out of reach while it is beyond the angles
      const gone = M.fade > 0.65 && !(m.stunT > 0) && m.act !== 'enter'; if (gone !== !!m.under) FX.untarget(gone);
      for (let i = 0; i < 4; i++) M.lit[i] = toward(M.lit[i], M.litTo[i], dt, M.litTo[i] > M.lit[i] ? 6 : 2.5);
      // the wireframes it sheds: whenever it moves fast or steps between the angles, and now and then of its own accord
      for (let i = M.ghosts.length - 1; i >= 0; i--) { const G = M.ghosts[i]; G.life -= dt; if (G.life <= 0) M.ghosts.splice(i, 1); }
      M.ghT -= dt; const fading = M.fade > 0.08 && M.fade < 0.92;
      if (M.ghT <= 0 && (M.spd > 9 || fading)) { M.ghT = M.spd > 9 ? 0.045 : 0.06; ghost(M, poseOf(m, M), M.spd > 9 ? 0.32 : 0.4); }
      M.flickT -= dt; if (M.flickT <= 0 && M.fade < 0.2 && m.act !== 'enter') { M.flickT = 2.2 + Math.random() * 3; const P2 = poseOf(m, M), a = M.hd + Math.PI + (Math.random() - 0.5); P2.x += Math.cos(a) * 0.5; P2.y += Math.sin(a) * 0.5; ghost(M, P2, 0.45); }
      // the spears: thrown, stuck where they fell, drawn back to hover
      M.spears.forEach((s, i) => { s.t += dt; if (s.st === 'stuck' && s.t > 0.65) { s.st = 'back'; s.t = 0; s.from = [s.x, s.y, 0.3]; } else if (s.st === 'back' && s.t > 0.55) { s.st = 'hover'; s.t = 0; } else if (s.st === 'fly' && s.t > s.dur + 0.3) { s.st = 'back'; s.t = 0; s.from = [s.to[0], s.to[1], 0.3]; } });
      sanctuary(FX, m, dt);
      // the entrance: it assembles out of a wireframe at the head of the sanctuary, and howls
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.fade = M.fadeTo = clamp(1 - (e - 0.3) / 1.3, 0, 1); if (e < 1.5) { M.ghT -= dt; if (Math.random() < dt * 12) { const P2 = poseOf(m, M); P2.x += FX.rnd(-0.3, 0.3); P2.y += FX.rnd(-0.3, 0.3); ghost(M, P2, 0.35); } } if (e > 1.4 && !M.roared) { M.roared = true; M.roar = 1; FX.H.sfx.crash(); FX.H.shake(10, 0.5); FX.H.sparks(m.x, m.y - 1.5, VIOLET_HI, 24, 8); } }
      else if (M.wasEnter) { M.wasEnter = false; M.fadeTo = 0; M.recoil = 0.6; FX.H.sfx.thud(); } },
    dmgK(FX, m) { const M = FX.mem; if (M && !M.lg) M.recoil = Math.max(M.recoil || 0, 0.35); return 1; },
    draw(c, FX, m, X, Y, T, t) { drawHound(c, FX, m, X, Y + (m.z || 0) * T * 4, T, t); },
    drawFx(c, FX, T, t) { drawFx(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.0 : 1.1, true); }
  function at(M, dt, fn) { M.q.push({ at: M.qt + dt, fn }); M.q.sort((a, b) => a.at - b.at); }
  function clampSq(C, p, pad) { const L = HS - pad; p.x = clamp(p.x, C.x - L, C.x + L); p.y = clamp(p.y, C.y - L, C.y + L); return p; }
  // it never sets foot in the ring, and keeps its body inside the square
  function keepOut(FX, m) { const C = FX.C, dx = m.x - C.x, dy = m.y - C.y, d = Math.hypot(dx, dy) || 1, R = SR + 2.4; if (d < R) { m.x = C.x + dx / d * R; m.y = C.y + dy / d * R; } clampSq(C, m, 2.4); }
  function safeSpot(FX, m) { const p = clampSq(FX.C, { x: m.x, y: m.y }, 2.6), C = FX.C, dx = p.x - C.x, dy = p.y - C.y, d = Math.hypot(dx, dy) || 1, R = SR + 2.6; if (d < R) { p.x = C.x + dx / d * R; p.y = C.y + dy / d * R; } return p; }
  function faceTo(FX, m, M, dt, k) { M.hd = FX.K.lerpA(M.hd, Math.atan2(FX.me.y - m.y, FX.me.x - m.x), Math.min(1, dt * k)); }
  function pupsAlive(FX) { return FX.H.mons.filter(q => !q.dead && q.type === 'cornerpup').length; }
  /* back to stalking: whatever was under way is let go, and it steps out of the angles where it can stand */
  function reset(FX, m) { const M = FX.mem; M.q.length = 0; M.lg = null; M.litTo = [0, 0, 0, 0];
    M.marks.forEach(k => { if (k.zone) k.zone.life = Math.min(k.zone.life, 0.3); }); M.marks = [];
    M.spears.forEach(s => { if (s.st === 'fly') { s.st = 'back'; s.t = 0; s.from = [s.to[0], s.to[1], 0.3]; } });
    if (M.fade > 0.3 || !inSquare(FX.C, m.x, m.y, 2.2) || inSanct(FX.C, m.x, m.y, 2.2)) { const p = safeSpot(FX, m); m.x = p.x; m.y = p.y; M.px = m.x; M.py = m.y; ghost(M, poseOf(m, M), 0.5); }
    M.fadeTo = 0; m.act = 'prowl'; m.actT = 0; }
  /* ---- stalking: it circles the pet at a distance, outside the ring, head low, glaring ---- */
  function prowl(FX, m, dt, fast) { const M = FX.mem, me = FX.me, C = FX.C;
    M.orb = (M.orb == null ? Math.atan2(m.y - me.y, m.x - me.x) : M.orb) + dt * 0.32 * fast * M.dir; if (Math.random() < dt * 0.15) M.dir = -M.dir;
    const R = 6.2 + Math.sin(m.t * 0.6) * 1.0, p = clampSq(C, { x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 2.6);
    { const dx = p.x - C.x, dy = p.y - C.y, d = Math.hypot(dx, dy) || 1, Rr = SR + 2.6; if (d < Rr) { p.x = C.x + dx / d * Rr; p.y = C.y + dy / d * Rr; } }
    const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy), v = Math.min(3.0 * fast, d * 2.2);
    if (d > 0.05) { m.x += dx / d * v * dt; m.y += dy / d * v * dt; } keepOut(FX, m);
    M.spdK = toward(M.spdK, Math.min(1, v / 3.2), dt, 5); M.gait += dt * (1.1 + v * 1.5);
    // it walks the way it goes, and turns to face the pet when it slows
    const want = v > 0.9 ? Math.atan2(dy, dx) : Math.atan2(me.y - m.y, me.x - m.x); M.hd = FX.K.lerpA(M.hd, want, Math.min(1, dt * 2.6)); }
  function choose(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv; m.actT = 0;
    if (M.nextSig === 'exit' || (P >= 3 && M.exitT <= 0 && !(M.closedT > 0))) { M.nextSig = null; return startExit(FX, m); }
    if (M.nextSig === 'hunt') { M.nextSig = null; return startHunt(FX, m); }
    if (M.wantAngle) { M.wantAngle = false; return startAngle(FX, m); }
    const hp = headPt(m, M), near = Math.hypot(me.x - hp[0], me.y - hp[1]) < 4.6, safe = inSanct(C, me.x, me.y) && sanctOpen(M), r = Math.random(); M.picks++;
    if (near && r < 0.42) return startSnap(FX, m);
    if (P >= 2 && !(M.closedT > 0) && M.picks % 4 === 0) return startHunt(FX, m);
    if (safe) return r < 0.7 ? startSpears(FX, m) : startAngle(FX, m);
    if (r < (M.closedT > 0 ? 0.78 : 0.62)) return startAngle(FX, m);
    return startSpears(FX, m); }
  /* ---- the lanes out of the corners ---- */
  function rayBox(C, x, y, dx, dy, B) { let t = 1e9; if (dx > 1e-6) t = Math.min(t, (C.x + B - x) / dx); else if (dx < -1e-6) t = Math.min(t, (C.x - B - x) / dx); if (dy > 1e-6) t = Math.min(t, (C.y + B - y) / dy); else if (dy < -1e-6) t = Math.min(t, (C.y - B - y) / dy); return t; }
  function rayCircle(C, x, y, dx, dy, r) { const fx = x - C.x, fy = y - C.y, b = fx * dx + fy * dy, cc = fx * fx + fy * fy - r * r; if (cc < 0) return null; const disc = b * b - cc; if (disc < 0) return null; const t = -b - Math.sqrt(disc); return t > 0 ? t : null; }
  // a lane from corner i along angle a: where the head stops (at the wall, or at the silver if the ring is in the way)
  function laneAt(FX, i, a, block) { const C = FX.C, K = cornerPt(C, i, 1.0), dx = Math.cos(a), dy = Math.sin(a), tW = rayBox(C, K[0], K[1], dx, dy, HS - 0.45), tS = block ? rayCircle(C, K[0], K[1], dx, dy, SR + 0.25) : null;
    const tip = tS != null && tS < tW ? tS : tW, ex = K[0] + dx * tip, ey = K[1] + dy * tip;
    let kind = tS != null && tS < tW ? 'rim' : 'wall'; if (kind === 'wall' && CS.some(s => Math.hypot(ex - (C.x + s[0] * HS), ey - (C.y + s[1] * HS)) < 3.8)) kind = 'corner';
    return { i, a, K, tip, ex, ey, kind, dx, dy }; }
  function pickLane(FX, tx, ty) { const M = FX.mem, C = FX.C; let best = null, bs = -1;
    for (let i = 0; i < 4; i++) { const K = cornerPt(C, i, 1.0), d = Math.hypot(tx - K[0], ty - K[1]); if (d < 7.5) continue; const L = laneAt(FX, i, Math.atan2(ty - K[1], tx - K[0]), sanctOpen(M)), s = (L.tip >= d - 0.6 ? 10 : 0) + Math.random() * 4 + (L.kind === 'corner' ? 1 : 0) + (M.lastCorner === i ? -3 : 0); if (s > bs) { bs = s; best = L; } }
    if (!best) best = laneAt(FX, 0, Math.atan2(ty - C.y + HS, tx - C.x + HS), sanctOpen(M));
    M.lastCorner = best.i; return best; }
  // the lane's warning: from inside its alcove to where the head stops
  function laneTele(FX, L, t, o) { return FX.tele(Object.assign({ shape: 'line', x: L.K[0] - L.dx * 0.9, y: L.K[1] - L.dy * 0.9, a: L.a, len: L.tip + 0.9, w: 2.4, t, dmg: 0, col: VIOLET_HI }, o || {})); }
  // it waits in the alcove, coiled, its head out along the lane
  function emerge(FX, m, L) { const M = FX.mem; if (M.lg) endLunge(FX, m, true); m.x = L.K[0] - L.dx * (TIP - 0.6); m.y = L.K[1] - L.dy * (TIP - 0.6); M.px = m.x; M.py = m.y; M.hd = L.a; M.look = 0; M.fade = Math.max(M.fade, 0.8); M.fadeTo = 0; M.crouch = 1; M.litTo[L.i] = 1; ghost(M, poseOf(m, M), 0.4); FX.H.sfx.hum(); }
  function launch(FX, m, L, o) { const M = FX.mem; if (M.lg) endLunge(FX, m, true); M.lg = Object.assign({ L, d: 0, len: Math.max(0.5, L.tip - 0.6), x0: L.K[0] - L.dx * (TIP - 0.6), y0: L.K[1] - L.dy * (TIP - 0.6), hit: false, dmg: m.dmg * 1.6 }, o || {}); m.x = M.lg.x0; m.y = M.lg.y0; M.px = m.x; M.py = m.y; M.hd = L.a; M.fade = 0; M.fadeTo = 0; M.litTo[L.i] = 0; M.lit[L.i] = 1;
    FX.H.sfx.whoosh(); FX.H.shake(5, 0.2); FX.H.sparks(L.K[0], L.K[1], VIOLET_HI, 14, 7); }
  function runLunge(FX, m, dt) { const M = FX.mem, G = M.lg, L = G.L, me = FX.me; G.d = Math.min(G.len, G.d + LV * dt); m.x = G.x0 + L.dx * G.d; m.y = G.y0 + L.dy * G.d;
    // what it runs into: the length of it, from haunch to snout, a little wider than it looks
    if (!G.hit) { const bx = m.x - L.dx * 2.0 * BS, by = m.y - L.dy * 2.0 * BS, hx = m.x + L.dx * TIP, hy = m.y + L.dy * TIP, vx = hx - bx, vy = hy - by, u = clamp(((me.x - bx) * vx + (me.y - by) * vy) / (vx * vx + vy * vy), 0, 1), dd = Math.hypot(me.x - bx - vx * u, me.y - by - vy * u);
      if (dd < 1.15 + me.r && FX.hurt(G.dmg)) { G.hit = true; me.push = { vx: -L.dy * 9 * Math.sign((me.x - m.x) * -L.dy + (me.y - m.y) * L.dx || 1), vy: L.dx * 9 * Math.sign((me.x - m.x) * -L.dy + (me.y - m.y) * L.dx || 1), t: 0.22 }; FX.H.sfx.crash(); } }
    // a mark of the past it runs through bursts
    if (G.mark && !G.mark.hitDone && G.d + TIP - 0.6 >= Math.hypot(G.mark.x - L.K[0], G.mark.y - L.K[1])) { G.mark.hitDone = true; if (G.mark.zone) G.mark.zone.life = Math.min(G.mark.zone.life, 0.25); FX.H.ring(G.mark.x, G.mark.y, 0.2, 1.6, 0.35, VIOLET_HI, 0.4); FX.H.sparks(G.mark.x, G.mark.y, VIOLET_HI, 10, 5); }
    if (G.d >= G.len) endLunge(FX, m, false); }
  function endLunge(FX, m, quiet) { const M = FX.mem, G = M.lg; if (!G) return; M.lg = null; const L = G.L, ex = L.ex, ey = L.ey;
    if (!quiet) { if (L.kind === 'rim') { FX.H.ring(ex, ey, 0.2, 2.2, 0.4, SILVER_HI, 0.5); FX.H.sparks(ex, ey, SILVER_HI, 18, 7); FX.H.sfx.crack(); FX.H.shake(6, 0.25); if ((M.rimTold = (M.rimTold || 0) + 1) <= 2) FX.H.text(ex, ey - 1.6, 'The silver turns it aside', SILVER_HI, 13); }
      else { FX.H.boom(ex, ey, 1.6, VIOLET, '#FFFFFF', { n: 16, shake: 10, smoke: 4 }); FX.H.sfx.crash(); for (let k = 0; k < 6; k++) FX.H.part({ kind: 'shard', x: ex, y: ey - 0.5, vx: FX.rnd(-4, 4), vy: FX.rnd(-6, -1), g: 9, life: 0.8, max: 0.8, size: 5, rot: Math.random() * 3, vr: 7, color: '#3A2E5E' }); } }
    if (G.cb) G.cb(L.kind, quiet); }
  function stagger(FX, m, t) { const M = FX.mem; m.act = 'recover'; m.actT = 0; M.recT = t; M.recoil = Math.max(M.recoil, 0.8); }
  function stick(FX, m, t) { const M = FX.mem; m.stunT = t; m.act = 'prowl'; m.actT = 0; M.q.length = 0; M.stuck = 0.4; M.recoil = 1; FX.H.shake(12, 0.5); FX.H.flash(0.2, VIOLET); FX.H.sfx.crash();
    say(FX, 'stuck', 'STUCK IN THE ANGLE', 'Wedged in the corner: strike the glowing flank slits!', VIOLET_HI); }
  /* ---- Angle Stalk: a corner lights, a lane runs from it, and it comes out along it ---- */
  function startAngle(FX, m) { const M = FX.mem, me = FX.me, P = FX.S.lv, w = (P >= 3 ? 1.0 : 1.2) / FX.S.fast; m.act = 'angle'; m.actT = 0; M.q.length = 0; M.qt = 0; M.fadeTo = 1; FX.H.sfx.whoosh();
    const L = pickLane(FX, me.x + (me.vx || 0) * 0.15, me.y + (me.vy || 0) * 0.15); M.litTo[L.i] = 1;
    at(M, 0.35, () => emerge(FX, m, L));
    laneTele(FX, L, 0.35 + w, { fn: () => { if (m.act !== 'angle') return; launch(FX, m, L, { cb: (kind, quiet) => { if (quiet) return; if (kind === 'corner') stick(FX, m, P >= 3 ? 4 : 4.5); else stagger(FX, m, 0.9); } }); } });
    say(FX, 'angle', 'ANGLE STALK', 'A corner lights: step off its violet lane', VIOLET_HI); }
  /* ---- Angled Jaw: a bite in a cone, when the pet comes too close to the head ---- */
  function startSnap(FX, m) { const M = FX.mem, me = FX.me, a = Math.atan2(me.y - m.y, me.x - m.x); M.snapA = a; m.act = 'snap'; m.actT = 0; M.aw = 0.85 / FX.S.fast; FX.H.sfx.hum();
    FX.tele({ shape: 'cone', x: m.x + Math.cos(a) * 1.0, y: m.y + Math.sin(a) * 1.0, a, len: 5.8, spread: 0.5, t: M.aw, dmg: m.dmg * 1.5, col: VIOLET_HI, fn: s => { const hx = s.x + Math.cos(a) * 4.2, hy = s.y + Math.sin(a) * 4.2; FX.H.boom(hx, hy, 1.2, VIOLET, '#FFFFFF', { n: 12, shake: 7 }); FX.H.sfx.crash(); FX.H.part({ kind: 'slash', x: hx, y: hy, a: a + Math.PI / 2, r: 2.4, life: 0.25, max: 0.25, color: VIOLET_HI }); } });
    say(FX, 'snap', 'ANGLED JAW', 'Out of the cone', VIOLET_HI); }
  /* ---- Tail of Angles: the three spears behind it thrown to rings round the pet, one after another ---- */
  function startSpears(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, gap = (P >= 3 ? 0.24 : 0.32) / FX.S.fast, w = 0.95 / FX.S.fast, B = build(poseOf(m, M)); m.act = 'spears'; m.actT = 0; M.aw = w + gap * 2 + 0.5; FX.H.sfx.hum();
    for (let i = 0; i < 3; i++) { const a = Math.random() * TAU, dd = i === 0 ? 0 : 1.8 + Math.random() * 1.6, p = clampSq(C, { x: me.x + (me.vx || 0) * 0.25 + Math.cos(a) * dd, y: me.y + (me.vy || 0) * 0.25 + Math.sin(a) * dd }, 0.8), s = M.spears[i], t = w + i * gap;
      Object.assign(s, { st: 'fly', t: 0, dur: t, from: B.spears[i].p.slice(), to: [p.x, p.y] });
      FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.3, t, dmg: m.dmg * 1.1, col: VIOLET_HI, fn: q => { s.st = 'stuck'; s.t = 0; s.x = q.x; s.y = q.y; FX.H.boom(q.x, q.y, 1.1, VIOLET, '#FFFFFF', { n: 10, shake: 5 }); FX.H.sfx.crack(); } }); }
    say(FX, 'spears', 'TAIL OF ANGLES', 'Its three spears fall where it points: off the rings', VIOLET_HI); }
  /* ---- the pups: out of two lit alcoves ---- */
  function startHowl(FX, m) { const M = FX.mem; m.act = 'howl'; m.actT = 0; M.called = false; FX.H.sfx.hum(); say(FX, 'howl', 'CORNER PUPS', 'It howls them out of the angles', VIOLET_HI); }
  function callPups(FX, m, n) { const M = FX.mem, C = FX.C, me = FX.me, order = [0, 1, 2, 3].sort((a, b) => { const A = cornerPt(C, a, 2), B = cornerPt(C, b, 2); return Math.hypot(me.x - A[0], me.y - A[1]) - Math.hypot(me.x - B[0], me.y - B[1]); }).slice(1, 1 + n);
    order.forEach(i => { const p = cornerPt(C, i, 2.0); M.lit[i] = 1; M.litTo[i] = 0; FX.H.ring(p[0], p[1], 0.2, 1.6, 0.4, VIOLET_HI, 0.4); FX.H.sparks(p[0], p[1], VIOLET_HI, 10, 5); const q = FX.minion('cornerpup', p[0], p[1]); if (q) q.cd = 1.2; }); }
  /* ---- Hunt the Past: three marks of where the pet stood, three lunges through them, in order ---- */
  function startHunt(FX, m) { const M = FX.mem, me = FX.me, C = FX.C; m.act = 'hunt'; m.actT = 0; M.q.length = 0; M.qt = 0; M.fadeTo = 1; M.marks = []; FX.H.sfx.hum();
    say(FX, 'hunt', 'HUNT THE PAST', 'It marks where you stand, three times: lay the marks by the outer wall, then hide in the silver ring', VIOLET_HI);
    for (let k = 0; k < 3; k++) at(M, 1.1 + k * 1.1, () => { const inside = inSanct(C, me.x, me.y, 0.2), mk = { x: me.x, y: me.y, n: k + 1, inside, t: 0 };
      mk.zone = { kind: 'ghost', x: mk.x, y: mk.y, life: 30, max: 30, own: 'none', face: me.face }; FX.H.zone(mk.zone); M.marks.push(mk);
      FX.H.ring(mk.x, mk.y, 0.2, 1.4, 0.35, inside ? ROSE : VIOLET_HI, 0.4); FX.H.sfx.pop(); FX.H.text(mk.x, mk.y - 1.8, inside ? `${k + 1} · inside the ring: this lane will cross it!` : `${k + 1}`, inside ? ROSE : VIOLET_HI, inside ? 12 : 16); });
    at(M, 3.5, () => planHunt(FX, m)); }
  function huntLane(FX, mk) { const C = FX.C, M = FX.mem; let best = null, bd = -1;
    const block = !mk.inside && sanctOpen(M);
    // (of the corners whose lane reaches the mark without crossing the ring, one whose lane runs on into a corner, then the longest)
    if (!mk.inside) for (let i = 0; i < 4; i++) { const K = cornerPt(C, i, 1.0), d = Math.hypot(mk.x - K[0], mk.y - K[1]); if (d < 4) continue; const dx = (mk.x - K[0]) / d, dy = (mk.y - K[1]) / d, tS = rayCircle(C, K[0], K[1], dx, dy, SR + 0.25); if (tS != null && tS < d) continue; const s = d + (laneAt(FX, i, Math.atan2(dy, dx), block).kind === 'corner' ? 100 : 0) + (M.lastCorner === i ? -0.5 : 0); if (s > bd) { bd = s; best = i; } }
    if (best != null) M.lastCorner = best;
    if (best == null) for (let i = 0; i < 4; i++) { const K = cornerPt(C, i, 1.0), d = Math.hypot(mk.x - K[0], mk.y - K[1]); if (d > bd) { bd = d; best = i; } }
    const K = cornerPt(C, best, 1.0); return laneAt(FX, best, Math.atan2(mk.y - K[1], mk.x - K[0]), block); }
  function planHunt(FX, m) { const M = FX.mem, P = FX.S.lv, gap = 1.5;
    M.marks.forEach((mk, k) => { const L = huntLane(FX, mk), t = 1.5 + k * gap, last = k === M.marks.length - 1; mk.lane = L;
      at(M, t - 0.45, () => { if (m.act === 'hunt') emerge(FX, m, L); });
      laneTele(FX, L, t, { label: String(k + 1), fn: () => { if (m.act !== 'hunt') return; launch(FX, m, L, { mark: mk, dmg: m.dmg * 1.5, cb: (kind, quiet) => { if (mk.zone) mk.zone.life = Math.min(mk.zone.life, 0.25); if (quiet) return; if (!last) { M.fadeTo = 1; return; } if (kind === 'corner') stick(FX, m, 5); else { stagger(FX, m, 1.0); FX.H.text(m.x, m.y - 3, 'It hunted nothing but the past', VIOLET_HI, 12); } M.marks = []; } }); } }); }); }
  /* ---- Stolen Exit: two lanes cross the sanctuary and it is closed; the loom gives it back ---- */
  function startExit(FX, m) { const M = FX.mem, C = FX.C; m.act = 'exit'; m.actT = 0; M.q.length = 0; M.qt = 0; M.fadeTo = 1; M.closedT = 17; M.exitT = 30; M.heldT = 0; FX.H.sfx.hum(); FX.H.flash(0.2, VIOLET);
    if (M.loom.st === 'idle') M.loom.st = 'ready';
    say(FX, 'exit', 'STOLEN EXIT', 'The sanctuary is closed: step on the Memory Loom, walk onto the release plate, and your echo will hold it open', GOLD_HI);
    const A = laneAt(FX, 0, Math.PI / 4, false), B = laneAt(FX, 1, Math.PI * 3 / 4, false);
    [[A, 1.6], [B, 3.4]].forEach(([L, t], k) => { at(M, t - 0.45, () => { if (m.act === 'exit') emerge(FX, m, L); });
      laneTele(FX, L, t, { fn: () => { if (m.act !== 'exit') return; launch(FX, m, L, { cb: (kind, quiet) => { if (quiet) return; if (k === 0) M.fadeTo = 1; else stagger(FX, m, 0.7); } }); } }); }); }
  /* the sanctuary's state and the Memory Loom: closed for the stolen hour unless an echo holds the plate */
  function sanctuary(FX, m, dt) { const M = FX.mem, me = FX.me, Lm = M.loom, Pl = M.plate, REC = 3.6;
    const wasClosed = M.closedT > 0; if (M.closedT > 0) M.closedT -= dt; if (M.heldT > 0) M.heldT -= dt;
    if (wasClosed && !(M.closedT > 0)) { FX.H.text(FX.C.x, FX.C.y - SR - 1, 'The silver returns', SILVER_HI, 14); FX.H.ring(FX.C.x, FX.C.y, SR - 0.3, SR + 0.6, 0.5, SILVER_HI, 0.4); FX.H.sfx.pop(); }
    M.sanK = toward(M.sanK, sanctOpen(M) ? 1 : 0, dt, 3); M.goldK = toward(M.goldK, M.heldT > 0 ? 1 : 0, dt, 3);
    const onLoom = Math.hypot(me.x - Lm.x, me.y - Lm.y) < 1.1;
    if (Lm.st === 'ready') { if (!(M.closedT > 0)) Lm.st = 'idle'; else if (onLoom) { Lm.ch += dt; if (Lm.ch >= 1.0) { Lm.st = 'rec'; Lm.t = 0; Lm.path = []; FX.H.banner('THE LOOM RECORDS', 'Walk onto the release plate and stay there: your echo will follow', GOLD_HI, 1.8, true); FX.H.sfx.hum(); FX.H.ring(Lm.x, Lm.y, 0.2, 1.4, 0.4, GOLD_HI, 0.4); } } else Lm.ch = decay(Lm.ch, dt, 1.5); }
    else if (Lm.st === 'rec') { Lm.t += dt; Lm.path.push([Lm.t, me.x, me.y]); if (Lm.t >= REC) { Lm.st = 'echo'; Lm.t = 0; Lm.echo = { x: Lm.path[0][1], y: Lm.path[0][2], dead: false }; Lm.zone = { kind: 'ghost', x: Lm.echo.x, y: Lm.echo.y, life: 30, max: 30, own: 'none', face: me.face, follow: Lm.echo }; FX.H.zone(Lm.zone); M.wantAngle = true; if (m.act === 'prowl') m.actT = 99; FX.H.banner('THE ECHO WALKS', 'Your gold echo walks to the plate: dodge the lunge outside', GOLD_HI, 1.6, true); } }
    else if (Lm.st === 'echo') { Lm.t += dt; const P = Lm.path; let j = 0; while (j < P.length - 1 && P[j + 1][0] < Lm.t) j++; const a = P[j], b = P[Math.min(P.length - 1, j + 1)], u = b[0] > a[0] ? clamp((Lm.t - a[0]) / (b[0] - a[0]), 0, 1) : 0; Lm.echo.x = lerp(a[1], b[1], u); Lm.echo.y = lerp(a[2], b[2], u);
      if (Math.random() < dt * 20) FX.H.part({ kind: 'star', x: Lm.echo.x + FX.rnd(-0.3, 0.3), y: Lm.echo.y - 0.5 - Math.random() * 0.6, vx: 0, vy: -0.8, life: 0.6, max: 0.6, size: 2.5, color: GOLD_HI });
      if (Lm.t >= REC) { if (Math.hypot(Lm.echo.x - Pl.x, Lm.echo.y - Pl.y) < 1.25) { Lm.st = 'hold'; Lm.echo.x = Pl.x; Lm.echo.y = Pl.y; M.heldT = 8; FX.H.banner('THE ECHO HOLDS THE PLATE', 'The sanctuary is open for eight seconds', GOLD_HI, 2.0, true); FX.H.flash(0.25, GOLD_HI); FX.H.sfx.fanfare ? FX.H.sfx.fanfare() : FX.H.sfx.pop(); FX.H.ring(FX.C.x, FX.C.y, SR - 0.4, SR + 0.8, 0.6, GOLD_HI, 0.5); }
        else { Lm.st = M.closedT > 0 ? 'ready' : 'idle'; Lm.ch = 0; if (Lm.zone) Lm.zone.life = 0.25; Lm.echo.dead = true; FX.H.text(Lm.echo.x, Lm.echo.y - 1.6, 'The echo missed the plate', GOLD_HI, 13); } } }
    else if (Lm.st === 'hold') { Lm.echo.x = Pl.x; Lm.echo.y = Pl.y; if (Math.random() < dt * 8) FX.H.part({ kind: 'star', x: Pl.x + FX.rnd(-0.4, 0.4), y: Pl.y - 0.4 - Math.random() * 0.8, vx: 0, vy: -0.8, life: 0.6, max: 0.6, size: 2.5, color: GOLD_HI }); if (!(M.heldT > 0)) { Lm.st = M.closedT > 0 ? 'ready' : 'idle'; Lm.ch = 0; if (Lm.zone) Lm.zone.life = 0.3; Lm.echo.dead = true; FX.H.text(Pl.x, Pl.y - 1.6, M.closedT > 0 ? 'The echo fades: the ring closes again' : 'The echo fades', GOLD_HI, 13); } }
    if (Lm.st === 'ready' && Math.hypot(me.x - Pl.x, me.y - Pl.y) < 1.0 && FX.S.t - (Pl.told || -9) > 6) { Pl.told = FX.S.t; FX.H.text(Pl.x, Pl.y - 1.6, 'Only an echo can hold the plate: use the loom', GOLD_HI, 12); } }

  /* ---------- the hound in three dimensions ---------- */
  function poseOf(m, M, t) { const bt = M.bt || t || 0; return { x: m.x, y: m.y, th: M.hd == null ? Math.PI / 2 : M.hd, crouch: M.crouch || 0, lunge: M.lunge || 0, jaw: Math.max(M.jaw || 0, (M.roar || 0) * 0.9), look: M.look || 0, br: Math.sin(bt * 1.6), bt, stuck: M.stuck || 0, recoil: M.recoil || 0, hs: m.hitSq || 0, howl: M.howl || 0, gait: M.gait || 0, spdK: M.spdK || 0, lean: M.lean || 0 }; }
  function headPt(m, M) { const p = W0(m, M, 4.1, 0, 0); return [p[0], p[1]]; }
  function bodyParts(m, M) { const h = (key, u, z, r) => { const p = W0(m, M, u, 0, z); return { key, dx: p[0] - m.x, dy: p[1] - p[2] - m.y, r }; }; return [h('chest', 1.0, 1.7, 1.4), h('hips', -1.6, 1.6, 1.05), h('head', 3.9, 0.95, 0.95)]; }
  // the weak point: the slits on the flank turned to the camera
  function slitAt(FX, m, M) { const cf = Math.cos(M.hd), sd = cf >= 0 ? 1 : -1, p = W0(m, M, 0.7, sd * 0.75, 1.7 - 0.35 * (M.crouch || 0)); return [p[0], p[1] - p[2]]; }
  function ghost(M, P, life) { M.ghosts.push({ P, life, max: life }); if (M.ghosts.length > 16) M.ghosts.shift(); }
  /* the mesh: rings of six vertices (a sharp dorsal ridge, two shoulders of plane, two lower flanks, a keel) along the
     body, faces between them; the lower jaw a hinged wedge; the legs as joint chains; the three spears */
  function build(P) {
    const cf = Math.cos(P.th), sf = Math.sin(P.th), W = (u, v, h) => [P.x + (cf * u - sf * v) * BS, P.y + (sf * u + cf * v) * BS, h * BS];
    const bob = Math.sin(P.gait * 2) * 0.05 * P.spdK + P.br * 0.02 - P.crouch * 0.5 + P.stuck * 0.05 * Math.sin(P.bt * 13), roll = P.stuck * Math.sin(P.bt * 9) * 0.17 + Math.sin(P.gait) * 0.05 * P.spdK, st = 1 + P.lunge * 0.08, yaw = clamp(P.look, -0.8, 0.8) * (1 - P.lunge) + P.stuck * Math.sin(P.bt * 7) * 0.25, cr = Math.cos(roll), sr = Math.sin(roll), axisH = 1.62 + bob;
    const loc = (u, v, h) => { let uu = u * st, vv = v, hh = h + bob + u * P.lean * 0.06;
      if (u > 2.2) { const k = Math.min(1, (u - 2.2) / 1.0), du = (u - 2.2) * st, a = yaw * k, ca = Math.cos(a), sa = Math.sin(a); uu = 2.2 * st + du * ca - vv * sa; vv = du * sa + vv * ca; hh += (P.recoil * 0.45 + P.howl * 0.75) * (u - 2.2) * 0.42 - P.crouch * 0.22 * k - P.lunge * 0.1 * k; }
      if (roll) { const v0 = vv, dh = hh - axisH; vv = v0 * cr - dh * sr; hh = axisH + v0 * sr + dh * cr; }
      return W(uu, vv, hh); };
    const rings = [], axes = [];
    for (const [u, hc, w0, tp0, bt0] of SECT) { const chest = u > 0 && u < 2 ? 1 + P.br * 0.035 : 1, w = w0 * chest * (1 + P.hs * 0.1), tp = tp0 * (1 - P.hs * 0.15), bt = bt0 * (1 + (chest - 1) * 1.2) * (1 - P.hs * 0.1);
      rings.push([[0, tp], [0.85 * w, 0.35 * tp], [w, -0.35 * bt], [0, -bt], [-w, -0.35 * bt], [-0.85 * w, 0.35 * tp]].map(([dv, dh]) => loc(u, dv, hc + dh))); axes.push(loc(u, 0, hc)); }
    const faces = [];
    const face = (pts, ref, kind) => { let n = norm(cross(sub(pts[1], pts[0]), sub(pts[pts.length - 1], pts[0]))); const cen = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length, a[2] + p[2] / pts.length], [0, 0, 0]); if (dot(n, sub(cen, ref)) < 0) n = [-n[0], -n[1], -n[2]]; faces.push({ pts, n, cen, d: cen[1] + cen[2], kind, vis: n[1] + n[2] > 0.02 }); };
    for (let k = 0; k < rings.length - 1; k++) { const A = rings[k], B = rings[k + 1], ref = mid(axes[k], axes[k + 1]); for (let j = 0; j < 6; j++) face([A[j], A[(j + 1) % 6], B[(j + 1) % 6], B[j]], ref, k >= 9 ? 'head' : 'body'); }
    // the lower jaw: a wedge hinged under the skull, dropping open
    const ang = P.jaw * 0.55, hu = 3.05, hh0 = 0.87, jr = JAW.map(([u, w, dp, ht]) => { const rot = (uu, h) => { const du = uu - hu, dh = h - hh0; return [hu + du * Math.cos(ang) + dh * Math.sin(ang), hh0 - du * Math.sin(ang) + dh * Math.cos(ang)]; }; const a1 = rot(u, ht), a2 = rot(u, ht - dp); return [loc(a1[0], w, a1[1]), loc(a2[0], 0, a2[1]), loc(a1[0], -w, a1[1])]; });
    for (let k = 0; k < jr.length - 1; k++) { const A = jr[k], B = jr[k + 1], all = A.concat(B), r2 = all.reduce((a, p) => [a[0] + p[0] / 6, a[1] + p[1] / 6, a[2] + p[2] / 6], [0, 0, 0]); face([A[0], B[0], B[1], A[1]], r2, 'jaw'); face([A[1], B[1], B[2], A[2]], r2, 'jaw'); face([A[2], B[2], B[0], A[0]], mid(A[1], B[1]), 'mouth'); }
    // the legs: hard zig-zags bent back on themselves (the hind: hip, knee forward, hock far back, foot; the fore:
    // shoulder, elbow back, wrist forward, foot), each foot a fan of three claws
    const fw = [cf, sf, 0], up = [0, 0, 1], legs = LEGS.map(Lg => { const ph = P.gait + Lg.ph, sd = Lg.sd, stride = 0.34 + P.spdK * 0.55; let fu = Lg.u0 + (Lg.front ? 0.45 : 0.2) - Math.cos(ph) * stride, lift = Math.max(0, Math.sin(ph)) * (0.16 + P.spdK * 0.42);
      fu = lerp(fu, Lg.u0 + (Lg.front ? 1.7 : -1.5), P.lunge); lift = lerp(lift, Lg.front ? 0.55 : 0.4, P.lunge);
      if (P.stuck) { lift += Lg.front ? Math.abs(Math.sin(P.bt * 13 + sd * 1.7)) * 0.5 * P.stuck : 0; fu -= Lg.front ? 0 : 0.45 * P.stuck; }
      const S = loc(Lg.u0, sd * (Lg.front ? 0.6 : 0.48), (Lg.front ? 1.45 : 1.5) + (Lg.front ? 0 : 0.05)), F = W(fu * st, sd * (0.98 + P.crouch * 0.3 + P.lunge * 0.1), lift), side = [-sf * sd, cf * sd, 0];
      let J1, J2; if (Lg.front) { J2 = addv(addv(F, fw, 0.2 * BS), up, (0.55 - P.crouch * 0.18 + P.lunge * 0.05) * BS); J1 = addv(addv(addv(mid(S, J2), fw, -0.52 * BS), up, -0.08 * BS), side, 0.12 * BS); }
      else { J2 = addv(addv(F, fw, -0.66 * BS), up, (0.82 - P.crouch * 0.3) * BS); J1 = addv(addv(addv(mid(S, J2), fw, 0.6 * BS), up, -0.32 * BS), side, 0.1 * BS); }
      return { pts: [S, J1, J2, F], sd, front: Lg.front, near: cf * sd * 0.9 + sf * Math.sign(Lg.u0) * 0.6 > 0, lift }; });
    // the spears: three loose spearheads in line behind it, bobbing one after another
    let prev = loc(-2.55, 0, 1.62); const spears = [0, 1, 2].map(i => { const u = -3.05 - i * 0.82 - P.lunge * 0.3 * (i + 1), p = loc(u, Math.sin(P.bt * 1.25 - i * 0.9) * 0.1 * (i + 1) - yaw * 0.25 * (i + 1), 1.66 + i * 0.07 + 0.16 * Math.sin(P.bt * 2.4 - i * 1.05) - P.crouch * 0.25 * (i + 1) * 0.5 + P.howl * 0.2 * i), d = norm(sub(p, prev)); prev = p; return { p, d, L: [0.78, 0.72, 1.0][i] * BS }; });
    return { faces, rings, axes, legs, spears, jr, fw, side: [-sf, cf, 0], cf, sf };
  }
  /* the shading: matte black planes, lit dull grey-violet toward the light, a violet bounce from the floor underneath */
  function faceCol(n, kind, P) { const l = Math.max(0, dot(n, LIGHT)), k = Math.pow(l, 1.25), under = Math.max(0, -n[2]);
    if (kind === 'mouth') { const g = 0.4 + P.jaw * 0.6; return `rgb(${Math.round(40 + 60 * g)},${Math.round(14 + 18 * g)},${Math.round(70 + 80 * g)})`; }
    const r = 14 + 58 * k + 26 * under, g = 12 + 52 * k + 10 * under, b = 22 + 74 * k + 52 * under; return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`; }
  function spearFaces(sp) { const { p, d, L } = sp, U0 = Math.abs(d[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1], S = norm(cross(d, U0)), U = norm(cross(S, d)), w = 0.17 * BS, h = 0.12 * BS, tip = addv(p, d, L * 0.62), back = addv(p, d, -L * 0.38), c0 = addv(p, d, 0.05 * L), R = [addv(c0, U, h), addv(c0, S, w), addv(c0, U, -h), addv(c0, S, -w)], out = [];
    for (let j = 0; j < 4; j++) { const a = R[j], b = R[(j + 1) % 4]; for (const e of [tip, back]) { let n = norm(cross(sub(b, a), sub(e, a))); const cen = [(a[0] + b[0] + e[0]) / 3, (a[1] + b[1] + e[1]) / 3, (a[2] + b[2] + e[2]) / 3]; if (dot(n, sub(cen, p)) < 0) n = [-n[0], -n[1], -n[2]]; out.push({ pts: [a, b, e], n, d: cen[1] + cen[2], vis: n[1] + n[2] > 0 }); } }
    return { faces: out, tip, back }; }
  // a leg segment as a flattened prism: two long planes meeting at a ridge, one turned to the light
  function prism(c, A, B, wA, wB, lw) { const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, lit = nx * -0.6 + ny * -0.8 > 0 ? 1 : -1;
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(A[0] + nx * wA * lit, A[1] + ny * wA * lit); c.lineTo(B[0] + nx * wB * lit, B[1] + ny * wB * lit); c.lineTo(B[0], B[1]); c.closePath(); c.fillStyle = '#3E3852'; c.fill();
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(A[0] - nx * wA * lit, A[1] - ny * wA * lit); c.lineTo(B[0] - nx * wB * lit, B[1] - ny * wB * lit); c.lineTo(B[0], B[1]); c.closePath(); c.fillStyle = '#141019'; c.fill();
    c.beginPath(); c.moveTo(A[0] + nx * wA, A[1] + ny * wA); c.lineTo(B[0] + nx * wB, B[1] + ny * wB); c.lineTo(B[0] - nx * wB, B[1] - ny * wB); c.lineTo(A[0] - nx * wA, A[1] - ny * wA); c.closePath(); c.strokeStyle = '#06040A'; c.lineWidth = lw; c.stroke(); }
  function drawLeg(c, P3, L, T, B, lw) { const sp = L.pts.map(p => P3(p[0], p[1], p[2])), w = [0.3, 0.2, 0.15, 0.1].map(k => k * T * BS);
    for (let i = 0; i < 3; i++) prism(c, sp[i], sp[i + 1], w[i], w[i + 1], lw);
    // the joints: small angular knuckles
    for (let i = 1; i < 3; i++) { const q = sp[i], r = w[i] * 1.15; c.beginPath(); c.moveTo(q[0], q[1] - r); c.lineTo(q[0] + r, q[1]); c.lineTo(q[0], q[1] + r); c.lineTo(q[0] - r, q[1]); c.closePath(); c.fillStyle = '#231D30'; c.fill(); c.strokeStyle = '#06040A'; c.lineWidth = lw * 0.8; c.stroke(); }
    // three triangular claws fanned forward from the foot
    const F = L.pts[3]; for (const k of [-1, 0, 1]) { const a = Math.atan2(B.fw[1], B.fw[0]) + k * 0.45 + L.sd * 0.08, ln = (k ? 0.5 : 0.62) * BS, ca = Math.cos(a), sa = Math.sin(a), bw = 0.08 * BS, t0 = P3(F[0] + ca * ln, F[1] + sa * ln, F[2]), b1 = P3(F[0] - sa * bw, F[1] + ca * bw, F[2]), b2 = P3(F[0] + sa * bw, F[1] - ca * bw, F[2]);
      c.beginPath(); c.moveTo(b1[0], b1[1]); c.lineTo(t0[0], t0[1]); c.lineTo(b2[0], b2[1]); c.closePath(); c.fillStyle = '#2A2438'; c.fill(); c.strokeStyle = 'rgba(169,181,197,.75)'; c.lineWidth = Math.max(0.8, lw * 0.7); c.stroke(); } }
  function drawFaces(c, P3, list, P, lw, seam) { for (const f of list) { c.beginPath(); f.pts.forEach((p, i) => { const q = P3(p[0], p[1], p[2]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath(); c.fillStyle = faceCol(f.n, f.kind, P); c.fill(); c.strokeStyle = seam; c.lineWidth = lw; c.stroke(); } }
  function drawSpear(c, P3, sp, P, lw, T, glow) { const S = spearFaces(sp); drawFaces(c, P3, S.faces.filter(f => f.vis).sort((a, b) => a.d - b.d), P, lw, '#06040A');
    const a = P3(S.back[0], S.back[1], S.back[2]), b = P3(S.tip[0], S.tip[1], S.tip[2]); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = VIOLET_HI; c.globalAlpha = 0.55 + 0.35 * glow; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(lerp(a[0], b[0], 0.2), lerp(a[1], b[1], 0.2)); c.lineTo(lerp(a[0], b[0], 0.8), lerp(a[1], b[1], 0.8)); c.stroke(); c.globalAlpha = 0.3 + 0.3 * glow; blitSized(c, glowSprite(VIOLET), (a[0] + b[0]) / 2 - T * 0.7, (a[1] + b[1]) / 2 - T * 0.7, T * 1.4, T * 1.4); c.restore(); }
  function drawHound(c, FX, m, X, Y, T, t) { const M = FX.mem || {}, a = 1 - clamp(M.fade || 0, 0, 1); if (a < 0.03) return;
    if (a > 0.97) { paintHound(c, FX, m, X, Y, T, t); return; }
    // half there: painted whole off screen and laid down faded, so its planes don't show through one another
    const cv = c.canvas, tr = c.getTransform(); if (!offCv) offCv = document.createElement('canvas'); if (offCv.width !== cv.width || offCv.height !== cv.height) { offCv.width = cv.width; offCv.height = cv.height; }
    const g = offCv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, offCv.width, offCv.height); g.setTransform(tr); g.lineJoin = 'round'; g.lineCap = 'round'; paintHound(g, FX, m, X, Y, T, t);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha *= a; c.drawImage(offCv, 0, 0); c.restore(); }
  function paintHound(c, FX, m, X, Y, T, t) {
    const M = FX.mem || {}, P = poseOf(m, M, t), B = build(P), P3 = TN.cam(X, Y, T, m), lw = Math.max(0.8, T * 0.03), menace = M.menace || 0, stuck = M.stuck || 0, slitK = Math.max(M.slitK || 0, stuck), bt = P.bt;
    // its shadow: the angular outline of it, laid on the stone
    c.save(); c.fillStyle = 'rgba(4,2,10,.42)'; c.beginPath(); const R = B.rings; for (let k = 0; k < R.length; k++) { const q = P3(R[k][2][0], R[k][2][1], 0); k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } for (let k = R.length - 1; k >= 0; k--) { const q = P3(R[k][4][0], R[k][4][1], 0); c.lineTo(q[0], q[1]); } c.closePath(); c.fill(); c.restore();
    const spearsOn = (M.spears || []).map(s => !s || s.st === 'hover' || s.st === 'back'), spearAt = i => { const s = (M.spears || [])[i], sp = B.spears[i]; if (!s || s.st !== 'back') return sp; const u = clamp(s.t / 0.55, 0, 1), e = u * u * (3 - 2 * u), p = [lerp(s.from[0], sp.p[0], e), lerp(s.from[1], sp.p[1], e), lerp(s.from[2], sp.p[2], e)]; return { p, d: sp.d, L: sp.L }; };
    const spGlow = i => 0.5 + 0.5 * Math.sin(bt * 2.4 - i * 1.05);
    const farS = [], nearS = []; B.spears.forEach((sp, i) => { if (spearsOn[i] !== false) (sp.p[1] + sp.p[2] < m.y + 1.6 * BS ? farS : nearS).push(i); });
    B.legs.filter(L => !L.near).forEach(L => drawLeg(c, P3, L, T, B, lw));
    farS.forEach(i => drawSpear(c, P3, spearAt(i), P, lw, T, spGlow(i)));
    // the body's planes, far to near (each a flat matte shade; the seams between them a hairline)
    const vis = B.faces.filter(f => f.vis).sort((a, b) => a.d - b.d); drawFaces(c, P3, vis, P, lw, 'rgba(6,4,12,.95)');
    // a thin violet rim along the dorsal ridge, where the void's light catches it
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(142,107,208,.45)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); for (let k = 1; k < R.length - 1; k++) { const q = P3(R[k][0][0], R[k][0][1], R[k][0][2]); k > 1 ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke(); c.restore();
    // teeth: silver triangles down the upper jaw, bared as it opens
    if (P.jaw > 0.12) { c.save(); c.fillStyle = SILVER_HI; c.strokeStyle = '#06040A'; c.lineWidth = lw * 0.7; for (const j of [2, 4]) { if ((j === 2 ? 1 : -1) * B.cf < -0.5) continue; for (let k = 10; k < 14; k++) for (const e of [0.25, 0.75]) { const a = R[k][j], b = R[k + 1][j], p = [lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e)], q0 = P3(p[0], p[1], p[2]), q1 = P3(p[0], p[1], p[2] - 0.2 * BS * Math.min(1, P.jaw * 1.6)), w = T * 0.06; c.beginPath(); c.moveTo(q0[0] - w, q0[1]); c.lineTo(q1[0], q1[1]); c.lineTo(q0[0] + w, q0[1]); c.closePath(); c.fill(); c.stroke(); } } c.restore(); }
    B.legs.filter(L => L.near).forEach(L => drawLeg(c, P3, L, T, B, lw));
    nearS.forEach(i => drawSpear(c, P3, spearAt(i), P, lw, T, spGlow(i)));
    // the six slits down each flank, pulsing in a wave from shoulder to waist (flared wide when it is wedged)
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const sd of [1, -1]) { if (B.cf * sd < -0.2) continue; const iU = sd > 0 ? 1 : 5, iL = sd > 0 ? 2 : 4;
      for (let i = 0; i < 6; i++) { const f = 6.85 - i * 0.42, k = Math.floor(f), e = f - k, top = [0, 1, 2].map(j => lerp(lerp(R[k][iU][j], R[k + 1][iU][j], e), lerp(R[k][iL][j], R[k + 1][iL][j], e), 0.15)), bot = [0, 1, 2].map(j => lerp(lerp(R[k][iU][j], R[k + 1][iU][j], e - 0.18), lerp(R[k][iL][j], R[k + 1][iL][j], e - 0.18), 0.9));
        const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(bt * 3.4 - i * 0.75)) * (0.6 + menace * 0.4) + slitK * 0.6, q0 = P3(top[0], top[1], top[2]), q1 = P3(bot[0], bot[1], bot[2]);
        c.globalAlpha = Math.min(1, 0.4 + pulse * 0.6); c.strokeStyle = slitK > 0.3 ? '#F4ECFF' : VIOLET_HI; c.lineWidth = Math.max(1.4, T * (0.07 + slitK * 0.05)); c.beginPath(); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.stroke();
        c.globalAlpha = Math.min(1, pulse * 0.45); blitSized(c, glowSprite(VIOLET), (q0[0] + q1[0]) / 2 - T * (0.5 + slitK * 0.4), (q0[1] + q1[1]) / 2 - T * (0.5 + slitK * 0.4), T * (1 + slitK * 0.8), T * (1 + slitK * 0.8)); } }
    // the eyes: short violet slits high on the skull, burning brighter with menace
    for (const sd of [1, -1]) { if (B.cf * sd < -0.6) continue; const j = sd > 0 ? 1 : 5, p = mid(R[10][j], R[11][j]), q = P3(p[0], p[1], p[2] + 0.04 * BS), f = mid(R[11][j], R[12][j]), q2 = P3(f[0], f[1], f[2] + 0.02 * BS); c.globalAlpha = 0.8 + menace * 0.2; c.strokeStyle = '#F4ECFF'; c.lineWidth = Math.max(1.2, T * 0.05); c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(lerp(q[0], q2[0], 0.55), lerp(q[1], q2[1], 0.55)); c.stroke(); c.globalAlpha = 0.35 + menace * 0.4; blitSized(c, glowSprite(VIOLET_HI), q[0] - T * 0.45, q[1] - T * 0.45, T * 0.9, T * 0.9); }
    // a lit mouth, when it gapes
    if (P.jaw > 0.25) { const p = mid(B.jr[1][1], B.jr[2][1]), q = P3(p[0], p[1], p[2] + 0.1 * BS); c.globalAlpha = (P.jaw - 0.25) * 0.8; blitSized(c, glowSprite(VIOLET), q[0] - T * 0.9, q[1] - T * 0.9, T * 1.8, T * 1.8); }
    c.restore();
    // wedged: dazed sparks circling over its skull
    if (stuck > 0.4) { const hp = P3(R[10][0][0], R[10][0][1], R[10][0][2] + 0.6 * BS); for (let i = 0; i < 3; i++) { const a = bt * 3.2 + i * TAU / 3; TN.twinkle(c, hp[0] + Math.cos(a) * T * 0.9, hp[1] + Math.sin(a) * T * 0.3, T * 0.16, '#F4ECFF', 0.9); } }
  }
  /* a wireframe of it, for the afterimages: the visible planes' edges and the legs, as one violet stroke */
  function drawWire(c, FX, P, T, a) { const B = build(P), P3 = (x, y, z) => [FX.sx(x), FX.sy(y) - z * T]; c.beginPath();
    for (const f of B.faces) { if (!f.vis) continue; f.pts.forEach((p, i) => { const q = P3(p[0], p[1], p[2]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath(); }
    for (const L of B.legs) L.pts.forEach((p, i) => { const q = P3(p[0], p[1], p[2]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); });
    for (const sp of B.spears) { const S = spearFaces(sp), q0 = P3(S.back[0], S.back[1], S.back[2]), q1 = P3(S.tip[0], S.tip[1], S.tip[2]); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); }
    c.globalAlpha = a; c.stroke(); }
  /* ---------- the effects over the fight: afterimages, thrown spears, the run of a lunge ---------- */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m) return; c.save(); c.lineJoin = 'round';
    // the lunge's streak: a violet wake from the alcove to the head
    if (M.lg) { const G = M.lg, L = G.L, x0 = FX.sx(L.K[0]), y0 = FX.sy(L.K[1]) - 1.2 * T, hx = m.x + L.dx * TIP, hy = m.y + L.dy * TIP, x1 = FX.sx(hx), y1 = FX.sy(hy) - 1.0 * T; c.globalCompositeOperation = 'lighter'; const gr = c.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(142,107,208,0)'); gr.addColorStop(1, 'rgba(201,176,255,.55)'); c.strokeStyle = gr; c.lineCap = 'round'; c.lineWidth = T * 1.1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.lineWidth = T * 0.25; c.strokeStyle = 'rgba(244,236,255,.5)'; c.stroke(); c.globalCompositeOperation = 'source-over'; }
    // the wireframes it sheds
    c.strokeStyle = VIOLET_HI; c.lineWidth = Math.max(0.8, T * 0.028); c.globalCompositeOperation = 'lighter';
    for (const G of M.ghosts) { const k = G.life / G.max; drawWire(c, FX, G.P, T, 0.55 * k * k); }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // the spears in flight: arcing from the tail to their rings, falling faster at the end
    for (let i = 0; i < 3; i++) { const s = M.spears[i]; if (!s || (s.st !== 'fly' && s.st !== 'stuck')) continue; let p, d;
      if (s.st === 'fly') { const u = clamp(s.t / s.dur, 0, 1), e = u * u, x = lerp(s.from[0], s.to[0], e), y = lerp(s.from[1], s.to[1], e), z = lerp(s.from[2], 0.3, e) + Math.sin(u * Math.PI) * 3.2 + (1 - u) * 0.5; const u2 = Math.min(1, u + 0.04), e2 = u2 * u2, x2 = lerp(s.from[0], s.to[0], e2), y2 = lerp(s.from[1], s.to[1], e2), z2 = lerp(s.from[2], 0.3, e2) + Math.sin(u2 * Math.PI) * 3.2 + (1 - u2) * 0.5; p = [x, y, z]; d = norm([x2 - x, y2 - y, z2 - z + (u > 0.96 ? -0.5 : 0)]); }
      else { p = [s.x, s.y, 0.45]; d = [0, 0.25, -0.97]; }
      const P3 = (x, y, z) => [FX.sx(x), FX.sy(y) - z * T]; drawSpear(c, P3, { p, d: norm(d), L: [0.78, 0.72, 1.0][i] * BS }, { jaw: 0 }, Math.max(0.8, T * 0.03), T, 1); }
    // recording: a gold count over the pet
    const Lm = M.loom; if (Lm && Lm.st === 'rec') { const X = FX.sx(FX.me.x), Y = FX.sy(FX.me.y) - T * 2.1, u = clamp(Lm.t / 3.6, 0, 1); c.strokeStyle = GOLD_HI; c.lineWidth = 3; c.beginPath(); c.arc(X, Y, T * 0.4, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - u)); c.stroke(); c.font = `900 ${Math.round(T * 0.32)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText('REC', X, Y); c.fillStyle = GOLD_HI; c.fillText('REC', X, Y); }
    c.restore(); }

  /* ---------- the arena on the ground: the square, its alcoves, the ring ---------- */
  function paintSanctuary(c, A) { const rnd = A.rnd, H = HS;
    // the slab hangs in the void: its south face drops away beneath its edge, broken stair ends hanging below it
    let g = c.createLinearGradient(0, H, 0, H + 3.4); g.addColorStop(0, '#1C1634'); g.addColorStop(0.5, '#120E22'); g.addColorStop(1, 'rgba(7,4,12,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(-H - 0.3, H); c.lineTo(H + 0.3, H); c.lineTo(H - 1.2, H + 3.4); c.lineTo(-H + 1.2, H + 3.4); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(78,64,136,.35)'; c.lineWidth = 0.06; for (let x = -H + 1; x < H; x += 2) { c.beginPath(); c.moveTo(x, H + 0.05); c.lineTo(x * 0.93, H + 2.4); c.stroke(); }
    for (let i = 0; i < 5; i++) { const x = -H + 2 + rnd() * (H * 2 - 4), y = H + 1.4 + rnd() * 1.4, s = 0.4 + rnd() * 0.4; for (let k = 0; k < 3; k++) { c.fillStyle = k % 2 ? '#2A2048' : '#3A2E5E'; c.fillRect(x + k * s * 0.5, y + k * s * 0.35, s * 1.4 - k * s * 0.3, s * 0.35); } }
    // the floor: square slabs of violet stone, two by two, grouted in a dim violet
    c.fillStyle = '#3A2F64'; c.fillRect(-H, -H, H * 2, H * 2);
    const cols = ['#2D2349', '#2A2044', '#32284F', '#2F2550'];
    for (let y = -H; y < H - 0.01; y += 2) for (let x = -H; x < H - 0.01; x += 2) { c.fillStyle = cols[Math.floor(rnd() * cols.length)]; c.fillRect(x + 0.06, y + 0.06, 1.88, 1.88); c.fillStyle = 'rgba(120,100,190,.08)'; c.fillRect(x + 0.06, y + 0.06, 1.88, 0.12); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + 0.06, y + 1.82, 1.88, 0.12);
      if (rnd() < 0.12) { c.strokeStyle = 'rgba(10,6,20,.5)'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(x + 0.3 + rnd(), y + 0.2); c.lineTo(x + 0.8 + rnd() * 0.4, y + 1.0); c.lineTo(x + 0.5 + rnd(), y + 1.8); c.stroke(); } }
    // a square inlay round the middle, and the angles: grooves from each alcove's mouth toward the ring, faintly lit
    c.strokeStyle = 'rgba(142,107,208,.22)'; c.lineWidth = 0.08; c.strokeRect(-8.6, -8.6, 17.2, 17.2); c.strokeRect(-8.9, -8.9, 17.8, 17.8);
    for (const [sx, sy] of CS) { const x0 = sx * (H - 2.1), y0 = sy * (H - 2.1), x1 = sx * (SR + 0.9) / Math.SQRT2, y1 = sy * (SR + 0.9) / Math.SQRT2; c.strokeStyle = 'rgba(8,4,16,.55)'; c.lineWidth = 0.34; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = 'rgba(142,107,208,.3)'; c.lineWidth = 0.07; c.stroke();
      // chevrons along the groove, pointing out of the corner
      for (let k = 1; k < 4; k++) { const u = k / 4, x = lerp(x0, x1, u), y = lerp(y0, y1, u), a = Math.atan2(-sy, -sx), w = 0.55; c.strokeStyle = 'rgba(142,107,208,.28)'; c.lineWidth = 0.08; c.beginPath(); c.moveTo(x + Math.cos(a + 2.4) * w, y + Math.sin(a + 2.4) * w); c.lineTo(x, y); c.lineTo(x + Math.cos(a - 2.4) * w, y + Math.sin(a - 2.4) * w); c.stroke(); } }
    // the parapet: a low lip of darker stone all round, lit along its inner edge
    c.strokeStyle = '#191330'; c.lineWidth = 0.7; c.strokeRect(-H + 0.35, -H + 0.35, H * 2 - 0.7, H * 2 - 0.7); c.strokeStyle = 'rgba(110,90,190,.5)'; c.lineWidth = 0.07; c.strokeRect(-H + 0.72, -H + 0.72, H * 2 - 1.44, H * 2 - 1.44); c.strokeStyle = 'rgba(201,176,255,.25)'; c.lineWidth = 0.05; c.strokeRect(-H + 0.03, -H + 0.03, H * 2 - 0.06, H * 2 - 0.06);
    // the four alcoves, recessed into the corners: a chamfered mouth between two square posts, a pocket of dark going
    // back beyond the corner, violet light deep in it
    CS.forEach(([sx, sy]) => { const d = [sx / Math.SQRT2, sy / Math.SQRT2], p = [-sy / Math.SQRT2, sx / Math.SQRT2], Q = [sx * H, sy * H], M0 = [Q[0] - d[0] * 1.5, Q[1] - d[1] * 1.5], Bk = [Q[0] + d[0] * 1.9, Q[1] + d[1] * 1.9];
      const m1 = [M0[0] + p[0] * 1.5, M0[1] + p[1] * 1.5], m2 = [M0[0] - p[0] * 1.5, M0[1] - p[1] * 1.5], b1 = [Bk[0] + p[0] * 1.0, Bk[1] + p[1] * 1.0], b2 = [Bk[0] - p[0] * 1.0, Bk[1] - p[1] * 1.0];
      const gg = c.createLinearGradient(M0[0], M0[1], Bk[0], Bk[1]); gg.addColorStop(0, '#17112A'); gg.addColorStop(1, '#040208'); c.fillStyle = gg; c.beginPath(); c.moveTo(m1[0], m1[1]); c.lineTo(b1[0], b1[1]); c.lineTo(b2[0], b2[1]); c.lineTo(m2[0], m2[1]); c.closePath(); c.fill(); c.strokeStyle = '#0B0816'; c.lineWidth = 0.18; c.stroke();
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; blitSized(c, glowSprite(VIOLET), Bk[0] - 1.6, Bk[1] - 1.6, 3.2, 3.2); c.restore();
      c.strokeStyle = 'rgba(201,176,255,.35)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(m1[0], m1[1]); c.lineTo(m2[0], m2[1]); c.stroke();
      // the back wall where it faces the camera (the far corners), and the posts
      if (sy < 0) { c.fillStyle = '#1A1430'; c.beginPath(); c.moveTo(b1[0], b1[1]); c.lineTo(b2[0], b2[1]); c.lineTo(b2[0], b2[1] - 1.6); c.lineTo(b1[0], b1[1] - 1.6); c.closePath(); c.fill(); c.strokeStyle = 'rgba(142,107,208,.4)'; c.lineWidth = 0.06; c.stroke(); }
      for (const q of [m1, m2]) { const s = 0.42, h = 1.5; c.fillStyle = '#140F26'; c.fillRect(q[0] - s, q[1] - h + s * 0.4, s * 2, h); c.fillStyle = '#3A2E5E'; c.fillRect(q[0] - s, q[1] - h - s * 0.4, s * 2, s * 0.8); c.strokeStyle = '#08050F'; c.lineWidth = 0.06; c.strokeRect(q[0] - s, q[1] - h - s * 0.4, s * 2, h + s * 0.8); c.fillStyle = 'rgba(201,176,255,.5)'; c.fillRect(q[0] - s, q[1] - h - s * 0.4, s * 2, 0.06); } });
    // the sanctuary: a round floor of paler stone in rings (no corner anywhere in it), a gold hourglass-ring at its heart
    g = c.createRadialGradient(0, 0, SR - 1.2, 0, 0, SR + 1.8); g.addColorStop(0, 'rgba(169,181,197,0)'); g.addColorStop(0.45, 'rgba(169,181,197,.14)'); g.addColorStop(1, 'rgba(169,181,197,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, SR + 1.8, 0, TAU); c.fill();
    c.fillStyle = '#3F3770'; c.beginPath(); c.arc(0, 0, SR, 0, TAU); c.fill();
    for (let r = 1.4, i = 0; r < SR; r += 1.0, i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.06)'; c.beginPath(); c.arc(0, 0, r + 1.0, 0, TAU); c.arc(0, 0, r, 0, TAU, true); c.fill(); c.strokeStyle = 'rgba(16,10,32,.45)'; c.lineWidth = 0.06; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); const n = Math.round(r * 3.2); for (let k = 0; k < n; k++) { const a = (k + (i % 2) * 0.5) / n * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(a) * Math.min(SR, r + 1.0), Math.sin(a) * Math.min(SR, r + 1.0)); c.stroke(); } }
    c.fillStyle = '#4C4488'; c.beginPath(); c.arc(0, 0, 1.4, 0, TAU); c.fill(); c.strokeStyle = GOLD; c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, 1.1, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(-0.5, -0.75); c.lineTo(0.5, -0.75); c.lineTo(-0.5, 0.75); c.lineTo(0.5, 0.75); c.closePath(); c.strokeStyle = GOLD_HI; c.lineWidth = 0.08; c.stroke(); c.fillStyle = 'rgba(232,207,142,.5)'; c.beginPath(); c.arc(0, -0.38, 0.13, 0, TAU); c.fill();
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; c.fillStyle = SILVER; c.beginPath(); c.arc(Math.cos(a) * (SR - 0.55), Math.sin(a) * (SR - 0.55), 0.09, 0, TAU); c.fill(); }
    // the one continuous silver border
    c.strokeStyle = '#0E0A1A'; c.lineWidth = 0.66; c.beginPath(); c.arc(0, 0, SR, 0, TAU); c.stroke(); c.strokeStyle = SILVER; c.lineWidth = 0.42; c.stroke(); c.strokeStyle = SILVER_HI; c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, SR - 0.1, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(60,68,86,.9)'; c.lineWidth = 0.07; c.beginPath(); c.arc(0, 0, SR + 0.17, 0, TAU); c.stroke(); }
  /* the void above: starless, violet haze, stairs hanging in it going nowhere, and far square frames lit at the corners */
  function voidSky(c, W, H, t, cam, T) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#030207'); g.addColorStop(0.5, '#0C0719'); g.addColorStop(1, '#05030A'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(41); c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { c.globalAlpha = 0.12 + R() * 0.1; const x = R() * W, y = R() * H, s = T * (6 + R() * 8); blitSized(c, glowSprite(i % 2 ? '#5A3A9A' : VIOLET), x - s, y - s * 0.6, s * 2, s * 1.2); } c.restore();
    for (let i = 0; i < 7; i++) { const x = R() * W, y = R() * H, s = T * (1.2 + R() * 2.2); c.globalAlpha = 0.35 + R() * 0.3; c.strokeStyle = VIOLET; c.lineWidth = 1; c.strokeRect(x - s, y - s, s * 2, s * 2); c.globalAlpha = 0.8; for (const [sx, sy] of CS) { c.fillStyle = VIOLET_HI; c.fillRect(x + sx * s - 2, y + sy * s - 2, 4, 4); } }
    for (let i = 0; i < 16; i++) { const x = R() * W, y = R() * H, s = T * (0.4 + R() * 0.9), n = 3 + Math.floor(R() * 3), dir = R() < 0.5 ? 1 : -1; c.globalAlpha = 0.25 + R() * 0.45; for (let k = 0; k < n; k++) { const xx = x + dir * k * s * 0.9, yy = y - k * s * 0.55; c.fillStyle = '#3A2E5E'; c.fillRect(xx, yy, s * 1.6, s * 0.28); c.fillStyle = '#1C1634'; c.fillRect(xx, yy + s * 0.28, s * 1.6, s * 0.4); } }
    c.globalAlpha = 1; }
  /* the ground's living layer: the ring's state, the lit alcoves, the loom and plate, the marks of the past */
  function drawOverlay(c, FX, t, T) { const M = FX.mem, C = FX.C; if (!M || !M.loom) return; const X0 = FX.sx(C.x), Y0 = FX.sy(C.y), r = SR * T, sk = M.sanK == null ? 1 : M.sanK, gk = M.goldK || 0;
    c.save();
    // the ring: a slow silver shimmer while it holds; closed, a violet dark over it and its silver gone dull; held open by
    // an echo, gold
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 * sk + 0.08 * Math.sin(t * 2) * sk; c.strokeStyle = SILVER_HI; c.lineWidth = T * 0.5; c.beginPath(); c.arc(X0, Y0, r, 0, TAU); c.stroke();
    for (let i = 0; i < 6; i++) { const a = t * 0.3 + i / 6 * TAU; c.globalAlpha = 0.5 * sk; blitSized(c, glowSprite(SILVER_HI), X0 + Math.cos(a) * r - T * 0.3, Y0 + Math.sin(a) * r - T * 0.3, T * 0.6, T * 0.6); }
    if (gk > 0.02) { c.globalAlpha = gk * (0.45 + 0.15 * Math.sin(t * 5)); c.strokeStyle = GOLD_HI; c.lineWidth = T * 0.35; c.beginPath(); c.arc(X0, Y0, r, 0, TAU); c.stroke(); c.globalAlpha = gk * 0.12; c.fillStyle = GOLD_HI; c.beginPath(); c.arc(X0, Y0, r, 0, TAU); c.fill(); if (M.heldT > 0) { c.globalAlpha = 0.9; c.lineWidth = T * 0.16; c.beginPath(); c.arc(X0, Y0, r + T * 0.5, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(M.heldT / 8, 0, 1)); c.stroke(); } }
    c.globalCompositeOperation = 'source-over';
    if (sk < 0.98) { const k = 1 - sk; c.globalAlpha = k * 0.55; c.fillStyle = '#0E0620'; c.beginPath(); c.arc(X0, Y0, r + T * 0.2, 0, TAU); c.fill(); c.globalAlpha = k * 0.9; c.strokeStyle = VIOLET_DK; c.lineWidth = T * 0.46; c.stroke(); c.strokeStyle = 'rgba(201,176,255,.7)'; c.lineWidth = T * 0.06; c.setLineDash([T * 0.5, T * 0.35]); c.lineDashOffset = -t * T; c.stroke(); c.setLineDash([]);
      c.globalAlpha = k * 0.4; c.strokeStyle = VIOLET; c.lineWidth = T * 0.08; for (let i = -3; i <= 3; i++) { const x = X0 + i * r * 0.28, hh = Math.sqrt(Math.max(0, 1 - (i * 0.28) ** 2)) * r; c.beginPath(); c.moveTo(x, Y0 - hh); c.lineTo(x, Y0 + hh); c.stroke(); }
      c.globalAlpha = k; c.font = `900 ${Math.round(T * 0.42)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText('CLOSED', X0, Y0 - r * 0.35); c.fillStyle = VIOLET_HI; c.fillText('CLOSED', X0, Y0 - r * 0.35); }
    c.globalAlpha = 1;
    // a lit alcove: violet light welling out of the corner, brackets pulsing at the angle
    for (let i = 0; i < 4; i++) { const k = M.lit[i]; if (k < 0.02) continue; const [sx, sy] = CS[i], X = FX.sx(C.x + sx * (HS + 0.6)), Y = FX.sy(C.y + sy * (HS + 0.6)), pul = 0.75 + 0.25 * Math.sin(t * 14); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * 0.8 * pul; blitSized(c, glowSprite(VIOLET), X - T * 3.2, Y - T * 3.2, T * 6.4, T * 6.4); c.globalAlpha = k * 0.6; blitSized(c, glowSprite(VIOLET_HI), X - T * 1.2, Y - T * 1.2, T * 2.4, T * 2.4);
      const cx = FX.sx(C.x + sx * (HS - 1.0)), cy = FX.sy(C.y + sy * (HS - 1.0)), L = T * 1.4 * (1 + 0.15 * Math.sin(t * 10)); c.globalAlpha = k; c.strokeStyle = VIOLET_HI; c.lineWidth = T * 0.12; c.beginPath(); c.moveTo(cx - sx * L, cy); c.lineTo(cx, cy); c.lineTo(cx, cy - sy * L); c.stroke(); c.restore(); }
    // the Memory Loom: a round dais, an upright frame of gold strung with threads; dim until the sanctuary is stolen
    const Lm = M.loom, Pl = M.plate, live = Lm.st !== 'idle', lx = FX.sx(Lm.x), ly = FX.sy(Lm.y), px = FX.sx(Pl.x), py = FX.sy(Pl.y), pul = 0.6 + 0.4 * Math.sin(t * 4);
    c.save(); c.globalAlpha = live ? 1 : 0.55; c.fillStyle = '#2A2240'; c.beginPath(); c.ellipse(lx, ly, T * 1.05, T * 0.5, 0, 0, TAU); c.fill(); c.strokeStyle = live ? GOLD_HI : GOLD; c.lineWidth = Math.max(1.5, T * 0.08); c.stroke();
    if (live) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * pul + (Lm.st === 'rec' ? 0.4 : 0); blitSized(c, glowSprite(GOLD_HI), lx - T * 1.6, ly - T * 2.2, T * 3.2, T * 3.2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    const fh = T * 1.5, fw = T * 0.75; c.strokeStyle = '#08050F'; c.lineWidth = Math.max(3, T * 0.16); c.beginPath(); c.moveTo(lx - fw, ly); c.lineTo(lx - fw, ly - fh); c.lineTo(lx + fw, ly - fh); c.lineTo(lx + fw, ly); c.moveTo(lx - fw, ly - fh * 0.25); c.lineTo(lx + fw, ly - fh * 0.25); c.stroke(); c.strokeStyle = live ? GOLD_HI : GOLD; c.lineWidth = Math.max(1.5, T * 0.08); c.stroke();
    c.strokeStyle = live ? (Lm.st === 'rec' ? '#FFF6D8' : 'rgba(232,207,142,.8)') : 'rgba(178,150,93,.5)'; c.lineWidth = 1; for (let i = 1; i < 6; i++) { const x = lx - fw + i * fw / 3, w2 = Lm.st === 'rec' ? Math.sin(t * 12 + i) * T * 0.06 : 0; c.beginPath(); c.moveTo(x, ly - fh); c.quadraticCurveTo(x + w2, ly - fh * 0.6, x, ly - fh * 0.25); c.stroke(); }
    if (Lm.st === 'ready' && Lm.ch > 0) { c.strokeStyle = GOLD_HI; c.lineWidth = 3; c.beginPath(); c.arc(lx, ly - fh * 0.6, T * 0.5, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(Lm.ch, 0, 1)); c.stroke(); }
    const near = Math.hypot(FX.me.x - Lm.x, FX.me.y - Lm.y) < 4.5, nearP = Math.hypot(FX.me.x - Pl.x, FX.me.y - Pl.y) < 4.5; c.font = `800 ${Math.round(T * 0.26)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)';
    if (live && near) { const s = Lm.st === 'ready' ? 'MEMORY LOOM · stand on it' : Lm.st === 'rec' ? 'RECORDING' : 'MEMORY LOOM'; c.strokeText(s, lx, ly - fh - T * 0.25); c.fillStyle = '#FFFFFF'; c.fillText(s, lx, ly - fh - T * 0.25); }
    // the release plate: a round gold-rimmed plate just inside the ring; bright when an echo stands on it
    const held = Lm.st === 'hold'; c.fillStyle = held ? '#6A5A30' : '#3A3256'; c.beginPath(); c.ellipse(px, py, T * 0.9, T * 0.45, 0, 0, TAU); c.fill(); c.strokeStyle = held ? GOLD_HI : live ? GOLD : 'rgba(178,150,93,.55)'; c.lineWidth = Math.max(1.5, T * 0.1); c.stroke(); c.strokeStyle = 'rgba(228,234,242,.5)'; c.lineWidth = 1; c.beginPath(); c.ellipse(px, py, T * 0.55, T * 0.27, 0, 0, TAU); c.stroke();
    if (live || held) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = held ? 0.8 : 0.3 * pul; blitSized(c, glowSprite(GOLD_HI), px - T * 1.3, py - T * 1.3, T * 2.6, T * 2.6); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    if (live && nearP && !held) { c.strokeText('RELEASE PLATE', px, py - T * 0.75); c.fillStyle = '#FFFFFF'; c.fillText('RELEASE PLATE', px, py - T * 0.75); }
    // the path being woven, and the echo's gold underfoot
    if ((Lm.st === 'rec' || Lm.st === 'echo') && Lm.path.length > 1) { c.strokeStyle = 'rgba(232,207,142,.75)'; c.lineWidth = Math.max(1.5, T * 0.07); c.setLineDash([T * 0.18, T * 0.16]); c.beginPath(); Lm.path.forEach(([, x, y], i) => { const X = FX.sx(x), Y = FX.sy(y); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); c.setLineDash([]); }
    if ((Lm.st === 'echo' || held) && !Lm.echo.dead) { const X = FX.sx(Lm.echo.x), Y = FX.sy(Lm.echo.y); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7; blitSized(c, glowSprite(GOLD_HI), X - T * 1.1, Y - T * 1.8, T * 2.2, T * 2.2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.strokeStyle = GOLD_HI; c.lineWidth = 2; c.beginPath(); c.ellipse(X, Y, T * 0.6, T * 0.28, 0, 0, TAU); c.stroke(); }
    c.restore();
    // the marks of the past: numbered rings where the pet stood
    for (const mk of M.marks) { if (mk.hitDone) continue; const X = FX.sx(mk.x), Y = FX.sy(mk.y), col = mk.inside ? ROSE : VIOLET_HI; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 + 0.25 * Math.sin(t * 6 + mk.n); c.strokeStyle = col; c.lineWidth = Math.max(2, T * 0.1); c.beginPath(); c.ellipse(X, Y, T * 1.0, T * 0.5, 0, 0, TAU); c.stroke(); c.restore();
      c.save(); c.font = `900 ${Math.round(T * 0.75)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.7)'; c.strokeText(String(mk.n), X + T * 1.05, Y - T * 0.55); c.fillStyle = col; c.fillText(String(mk.n), X + T * 1.05, Y - T * 0.55); c.restore(); } }
})());
