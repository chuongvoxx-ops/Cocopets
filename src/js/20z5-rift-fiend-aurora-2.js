/* ---------- NIVORA THE AURORAWING ----------
   The Pale Aurora's second boss, fought on the Telescope Platform of the Observatory Ruins: a disc of grey stone thirty
   metres across, ringed by a snow-capped parapet, the great brass telescope on its round pedestal in the middle and a
   wind vane on a plinth at its eastern and western edges; overhead the aurora hangs like an enormous open eye.
   Nivora is a six-metre insectile bird: a compact navy body, four broad triangular wings set in an X (white at the root,
   aurora green at the tip, as if the lights had frozen into them), no beak, its head a smooth dark sphere split by one
   luminous horizontal eye, and two long stiff tail vanes trailing behind. It glides in straight, deliberate passes and
   hovers low, breathing, when it recovers.
   Crosswind: it rises over one edge and beats the platform full of wind: arrows run across the stone toward the far rim,
   and that rim freezes; then the wind pushes everything toward it. Stand on the upwind side (by Nivora) before it
   begins. In the second phase ice shards ride the wind along shown lines: step sideways off them.
   Wing Shear: it marks two crossing flight lanes (numbered) and flies them in turn. Each lane runs past one of the wind
   vanes; stand at a vane to turn it and it raises a windbreak across its lane: Nivora strikes it and is STAGGERED,
   fallen low, its eye bared for a heavy blow. In the second phase it shears only the lane by the vane not used last
   time (the other vane freezes fast): cross the central pedestal to it while avoiding the cutting pass it flies first.
   Aurora Pass: one straight pass through the pet along a shown lane (a lingering curtain of light behind it in phase
   two). Aurora Gaze: its eye scans an arc in a sweep of light (twice in phase two). From the second phase veil rays,
   frost lanterns and rime scuttlers gather.
   It is never still: the X of wings flexes and ripples, aurora shimmers along the tips and streams behind them in a
   pass, the eye scans and blinks, the tail vanes swing a beat behind its turns, it banks into its passes, it sinks and
   breathes while it recovers, it jolts on a hit, and it comes down out of the aurora with its wings unfolding. */
RiftFiend.define({ id: 'nivora', name: 'Nivora', title: 'The Aurorawing', color: '#172C4D', glow: '#78D7B2', accent: '#E8FFF6', biome: 'observatory', r: 2.6, els: ['wind', 'frost'] }, (() => {
  const { TAU, TN, hit } = RiftFiend;
  const { SNOW, NAVY, ICE, ICE_HI, GREEN, GREEN_HI, STONE } = AUR;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const LINE = '#14213A', NAVY_HI = '#2F4C7E', NAVY_SH = '#0D1A31', HEAD = '#0E172A', EYE = '#DDFBF0', BRASS = '#B89A5E', BRASS_HI = '#E8D4A0', BRASS_SH = '#7E6538', IRON = '#262F44';
  const ALT = 4.4, PASS_ALT = 2.9, LOW = 1.9, STUN_ALT = 1.05, LW = 3.2, RL = 13.4, VR = 1.5, TURN = 0.8, PED = 2.9;
  const FX0 = DunFiend.KIT;
  const LIT = nrm([-0.35, -0.5, 0.8]), VIEW = [0, 0.7071, 0.7071];
  const SIDE = [-1, 1];   // vane 0 west, vane 1 east
  const vaneAt = (C, i) => [C.x + SIDE[i] * 11.4, C.y + 0.4];          // where the pet stands to turn it
  const postAt = (C, i) => [C.x + SIDE[i] * 12.5, C.y - 0.5];          // the vane itself, just behind
  const sockAt = (C, i) => [C.x + SIDE[i] * 7.0, C.y];                 // where its windbreak rises
  return {
    arenaR: 15, firstAct: 'hover', artY: 0.9,
    artPoses: [{ name: 'gliding, the X of wings flexing', mem: { alt: 3.2 } }, { name: 'beating up a crosswind', mem: { alt: 4, beat: 1, menace: 1 } }, { name: 'in a pass, banked', mem: { alt: 2.6, passK: 1, roll: 0.45 } }, { name: 'staggered: fallen low, the eye bared', mem: { alt: 1.1, stag: 1 } }],
    phaseNames: ['The Telescope Platform', 'The Open Eye', 'The Open Eye', 'The Last Light'],
    props: C => [{ kind: 'telescope', x: C.x, y: C.y + 0.6 }, { kind: 'vane', i: 0, x: postAt(C, 0)[0], y: postAt(C, 0)[1] }, { kind: 'vane', i: 1, x: postAt(C, 1)[0], y: postAt(C, 1)[1] }],
    // (the telescope's foot is solid stone; the pedestal round it can be walked)
    carve(set, C) { for (let y = -1; y <= 0; y++) for (let x = -1; x <= 0; x++) set(Math.floor(C.x) + x, Math.floor(C.y) + y + 1, T_SOLID); },
    paintGround(c, A) { paintPlatform(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, t, cam, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.act = 'enter'; m.x = C.x; m.y = C.y - 4.5; m.noTouch = true;
      Object.assign(M, { hd: Math.PI / 2, tailHd: Math.PI / 2, look: Math.PI / 2, bt: 0, px: m.x, py: m.y, spd: 0, roll: 0, pitch: 0, hdRate: 0, alt: 16, unfold: 0, beat: 0, menace: 0, recoil: 0, roar: 0, passK: 0, stag: 0, breath: 0,
        blinkT: 2, blink: 0, beamA: 0, beamK: 0, scan: 0, tips: [], sh: null, ps: null, gz: null, cw: null, bar: [null, null], vch: [0, 0], vA: [Math.PI * 0.9, Math.PI * 0.1], lastVane: null, broodT: 10, seen: {}, last: null, bag: null, wasEnter: true, roared: false, wasStun: false, orb: null, dir: 1, restT: 1.2 }); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; endCrosswind(FX); M.sh = null; M.ps = null; M.gz = null; m.act = 'hover'; m.actT = 0; M.roar = 1; M.beat = 1; M.recoil = 1; M.broodT = 6; FX.H.shake(10, 0.5); FX.H.flash(0.22, GREEN_HI); FX.H.sfx.crash(); FX.H.ring(m.x, m.y, 0.5, 9, 1, GREEN_HI, 0.4); frostBurst(FX, m.x, m.y - 3, 18);
      const C = FX.C; [['veilray', -1], ['frostlantern', 1]].forEach(([type, s]) => { const q = FX.clampArena({ x: C.x + s * 5, y: C.y - 4 }, 2); FX.minion(type, q.x, q.y); });
      if (lv >= 2) FX.H.banner('THE OPEN EYE', 'It shears the vane you did not use · ice rides its wind · the brood gathers', GREEN_HI, 2.8, true); if (lv >= 4) FX.H.banner('The Last Light', 'The whole sky leans on the platform', '#FFFFFF', 2.2); },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, fast = (1 + (P - 1) * 0.06) * FX.S.fast; m.actT += dt; m.noTouch = true;
      // the open eye: the brood gathers round the pet while it hovers
      if (P >= 2 && m.act === 'hover' && (M.broodT -= dt) <= 0) { M.broodT = P >= 4 ? 11 : 15; const n = FX.H.mons.filter(q => !q.dead && !q.boss && !q.fobj && (q.type === 'veilray' || q.type === 'frostlantern' || q.type === 'rimescuttler')).length;
        if (n < 3) { for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, p = FX.clampArena({ x: me.x + Math.cos(a) * 4, y: me.y + Math.sin(a) * 4 }, 2), type = ['rimescuttler', 'veilray', 'frostlantern'][Math.floor(Math.random() * 3)];
          FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.1, t: 1.0, dmg: m.dmg * 0.6, col: ICE_HI, fn: s => { FX.H.sfx.pop(); FX.H.ring(s.x, s.y, 0.2, 1.4, 0.4, ICE_HI, 0.3); frostBurst(FX, s.x, s.y - 0.5, 8); if (FX.m && !FX.m.dead) FX.minion(type, s.x, s.y); } }); }
          FX.H.text(me.x, me.y - 2, 'The brood gathers', GREEN_HI, 13); } }
      let altW = ALT, menace = 0, beat = 0, pass = 0;
      switch (m.act) {
        case 'hover': {   // it circles the pet at a height, gliding, its eye on the pet; then chooses
          M.orb = (M.orb == null ? Math.atan2(m.y - me.y, m.x - me.x) : M.orb) + dt * 0.32 * fast * M.dir; const R = 7.2 + Math.sin(m.t * 0.5) * 0.8, p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 3);
          glide(FX, m, M, p.x, p.y, 3.4 * fast, dt, M.look);
          if (m.actT > (P >= 2 ? 1.25 : 1.7) / FX.S.fast) { m.actT = 0; M.dir = Math.random() < 0.5 ? 1 : -1; choose(FX, m); } break; }
        case 'rest': {   // recovering: it sinks low over the stone and breathes, wings fanning slowly
          altW = LOW; glide(FX, m, M, m.x, m.y, 0.6, dt, M.look); if (m.actT > M.restT) { m.act = 'hover'; m.actT = 0; } break; }
        case 'crosswind': { const W = M.cw; if (!W) { toRest(m, M, 1.0); break; }
          // it hangs over the upwind edge, facing down the wind, and beats
          const u = [C.x - Math.cos(W.a) * (C.R - 3.2), C.y - Math.sin(W.a) * (C.R - 3.2)]; glide(FX, m, M, u[0], u[1], 9 * fast, dt, W.a); altW = ALT + 0.6; menace = 1; beat = W.t > W.warn * 0.4 ? 1 : 0.5; break; }
        case 'shear': runShear(FX, m, M, dt, fast); altW = M.altW; menace = M.menW; pass = M.passW; break;
        case 'pass': { const S = M.ps; if (!S) { toRest(m, M, 1.2); break; }
          if (m.actT < S.wait) { glide(FX, m, M, S.x0, S.y0, 4, dt, S.a); altW = PASS_ALT + 0.4; menace = 0.8; break; }
          const v = 12.5 * fast, prog = Math.min(S.len, (m.actT - S.wait) * v); m.x = S.x0 + Math.cos(S.a) * prog; m.y = S.y0 + Math.sin(S.a) * prog; M.hd = FX.K.lerpA(M.hd, S.a, Math.min(1, dt * 8)); altW = PASS_ALT; pass = 1; menace = 0.5;
          flyHit(FX, m, M, S, S.a);
          if (prog >= S.len) { if (P >= 2) FX.hz({ shape: 'line', x: S.x0, y: S.y0, a: S.a, len: S.len, w: 1.8, life: 2.6, dps: m.dmg * 0.6, tick: 0.3, col: GREEN, arm: 0.1 }); FX.H.sfx.whoosh(); M.ps = null; toRest(m, M, 1.3); } break; }
        case 'gaze': { const G = M.gz; if (!G) { toRest(m, M, 0.8); break; } glide(FX, m, M, m.x, m.y, 0.5, dt, FX.angPet(m.x, m.y)); altW = ALT + 0.3; menace = 1; if (m.actT > G.end) { M.gz = null; toRest(m, M, 1.1); } break; }
        default: m.act = 'hover'; m.actT = 0;
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 2.5); M.beat = toward(M.beat, beat, dt, beat > M.beat ? 4 : 1.5); M.passK = toward(M.passK, pass, dt, 5);
      M.alt = toward(M.alt, altW, dt, m.act === 'shear' || m.act === 'pass' ? 4.5 : 2.2);
      FX.parts(bodyParts(FX, m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.stag = Math.min(1, M.stag + dt * 2.4); M.menace = decay(M.menace, dt, 4); M.beat = decay(M.beat, dt, 4); M.passK = decay(M.passK, dt, 4); m.noTouch = true; M.alt = toward(M.alt, STUN_ALT, dt, 5);
      const e = eyeWorld(FX, m, M); FX.weak('eye', e[0], e[1] - e[2], 1.5, 2.5, m.stunT > 0.05);
      // fallen, it shivers: frost flakes off its wings
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.35; FX.H.sparks(m.x + FX.rnd(-2.5, 2.5), m.y - 1 + FX.rnd(-0.8, 0.8), ICE_HI, 3, 3); FX.H.shake(1.2, 0.08); }
      FX.parts(bodyParts(FX, m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m, me = FX.me, C = FX.C; if (!m) return; M.bt += dt;
      // how it moves: it banks into its turns, the tail vanes swing round a beat behind
      if (dt > 1e-4) { const d = Math.hypot(m.x - M.px, m.y - M.py), sp = d / dt; M.px = m.x; M.py = m.y; M.spd = toward(M.spd, sp, dt, 6);
        const hr = angTo(M.hd0 == null ? M.hd : M.hd0, M.hd) / dt; M.hd0 = M.hd; M.hdRate = toward(M.hdRate, clamp(hr, -3, 3), dt, 4); }
      M.roll = toward(M.roll, clamp(M.hdRate * 0.28, -0.55, 0.55) * (1 - (M.stag || 0)) + (M.stag || 0) * 0.32, dt, 3);
      M.pitch = toward(M.pitch, -M.passK * 0.12 + (M.menace || 0) * 0.08 + (M.recoil || 0) * 0.22 + (m.act === 'rest' ? 0.08 : 0) - (M.stag || 0) * 0.1, dt, 4);
      M.tailHd = FX.K.lerpA(M.tailHd == null ? M.hd : M.tailHd, M.hd, Math.min(1, dt * 2.2));
      M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.4); M.beamK = decay(M.beamK, dt, 2.2); if (!(m.stunT > 0)) M.stag = decay(M.stag, dt, 1.4);
      M.breath = toward(M.breath, m.act === 'rest' || m.stunT > 0 ? 1 : 0, dt, 2);
      M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = 2.2 + Math.random() * 3; M.blinkU = 0; } if (M.blinkU != null) { M.blinkU += dt / 0.2; M.blink = Math.sin(Math.min(1, M.blinkU) * Math.PI); if (M.blinkU >= 1) { M.blinkU = null; M.blink = 0; } }
      M.look = FX.K.lerpA(M.look == null ? Math.PI / 2 : M.look, Math.atan2(me.y - m.y, me.x - m.x), Math.min(1, dt * 4));
      M.scan = toward(M.scan, m.act === 'gaze' && M.gz ? M.gz.cur : Math.sin(M.bt * 0.7) * 0.45, dt, 6);
      // the aurora it leaves behind its wing tips (kept a short while, in the world)
      const W = wings(FX, m, M); M.tips.push({ t: M.bt, p: W.map(w => w.pts[2]), k: M.passK }); while (M.tips.length > 2 && M.bt - M.tips[0].t > 0.55) M.tips.shift();
      updCrosswind(FX, m, M, dt); updVanes(FX, m, M, dt);
      if (!(m.stunT > 0)) { if (FX.S.weak.eye) FX.weak('eye', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.recoil = 1; M.roar = 0.6; M.beat = 1; FX.H.text(m.x, m.y - 4, 'It lifts back into the wind', GREEN_HI, 13); FX.H.sfx.whoosh(); } } else M.wasStun = true;
      // the entrance: it comes down out of the aurora, the four wings unfolding into their X
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.unfold = clamp((e - 0.2) / 1.9, 0, 1); M.alt = lerp(16, ALT, 1 - Math.pow(1 - M.unfold, 3)); M.beat = 1 - M.unfold * 0.6; M.hd = FX.K.lerpA(M.hd, M.look, Math.min(1, dt * 2));
        if (e > 1.9 && !M.roared) { M.roared = true; M.roar = 1; M.recoil = 0.6; FX.H.sfx.hum(); FX.H.sfx.crash(); FX.H.shake(9, 0.4); FX.H.ring(m.x, m.y, 0.3, 8, 1, GREEN_HI, 0.4); frostBurst(FX, m.x, m.y - 3, 14); } }
      else { M.unfold = toward(M.unfold, 1, dt, 3); if (M.wasEnter) { M.wasEnter = false; M.recoil = 1; FX.H.sfx.whoosh(); } }
      if ((m.hitSq || 0) > 0.5) M.recoil = Math.max(M.recoil, 0.5); },
    dmgK() { return 1; },
    keep: { steps: 2, pad: 5 },
    draw(c, FX, m, X, Y, T, t, step) { drawNivora(c, FX, m, X, Y, T, t, step); },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'telescope') drawTelescope(c, FX, p, X, Y, T, t); else if (p.kind === 'vane') drawVane(c, FX, p, X, Y, T, t); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    drawFx(c, FX, T, t) { drawLights(c, FX, T, t); drawBarriers(c, FX, T, t); drawWind(c, FX, T, t); },
  };

  /* ---- choosing ---- */
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.0 : 1.2, true); }
  function toRest(m, M, t) { m.act = 'rest'; m.actT = 0; M.restT = t; }
  function choose(FX, m) { const M = FX.mem;
    // (a shuffled round of its four, so none is long missing; never the same twice running)
    if (!M.bag || !M.bag.length) { M.bag = ['crosswind', 'shear', 'pass', 'gaze'].sort(() => Math.random() - 0.5); if (M.bag[M.bag.length - 1] === M.last) M.bag.unshift(M.bag.pop()); }
    const a = M.bag.pop(), go = { crosswind: startCrosswind, shear: startShear, pass: startPass, gaze: startGaze }[a]; if (!go) { m.act = 'hover'; m.actT = 0; return; } M.last = a; go(FX, m); }
  /* movement: it glides toward a point (never faster than spd), turning its heading toward face */
  function glide(FX, m, M, tx, ty, spd, dt, face) { const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); if (d > 0.05) { const v = Math.min(spd, d * 2.2); m.x += dx / d * v * dt; m.y += dy / d * v * dt; }
    const q = FX.clampArena(m, 2.2); m.x = q.x; m.y = q.y; const want = d > 2.5 && spd > 3 ? Math.atan2(dy, dx) : (face == null ? M.hd : face); M.hd = FX.K.lerpA(M.hd, want, Math.min(1, dt * 2.6)); }
  // a straight pass strikes whatever stands in its lane beside the body
  function flyHit(FX, m, M, L, a) { const me = FX.me, rx = me.x - m.x, ry = me.y - m.y, al = rx * Math.cos(a) + ry * Math.sin(a), of = -rx * Math.sin(a) + ry * Math.cos(a);
    if (!L.hit && Math.abs(al) < 1.7 && Math.abs(of) < LW / 2 + me.r) { if (FX.hurt(m.dmg * 1.45)) { L.hit = true; const s = of >= 0 ? 1 : -1; me.push = { vx: -Math.sin(a) * 9 * s, vy: Math.cos(a) * 9 * s, t: 0.22 }; FX.H.sparks(me.x, me.y - 0.5, GREEN_HI, 8, 5); } } }
  // where a line through p along a meets the platform's edge, both ways: [back, forward]
  function chord(C, p, a, R) { const d = [Math.cos(a), Math.sin(a)], q = [p[0] - C.x, p[1] - C.y], b = q[0] * d[0] + q[1] * d[1], cc = q[0] * q[0] + q[1] * q[1] - R * R, s = Math.sqrt(Math.max(0, b * b - cc)); return [-b - s, -b + s]; }

  /* ---- Crosswind ---- */
  function startCrosswind(FX, m) { const M = FX.mem, C = FX.C, me = FX.me, P = FX.S.lv, dc = Math.hypot(me.x - C.x, me.y - C.y);
    const a = (dc > 2 ? Math.atan2(me.y - C.y, me.x - C.x) : Math.random() * TAU) + FX.rnd(-0.35, 0.35), warn = (P >= 2 ? 2.2 : 2.6) / FX.S.fast, blow = 3.8;
    const W = M.cw = { a, t: 0, warn, blow, sp: P >= 2 ? 4.2 : 3.8, zones: [], hz: null, gust: P >= 2 ? [warn + 0.5, warn + 1.9] : [], gi: 0 };
    const d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]];
    for (const o of [-10.6, -5.3, 0, 5.3, 10.6]) { const h = Math.sqrt(Math.max(1, RL * RL - o * o)); const z = { kind: 'windlane', x: C.x + n[0] * o - d[0] * h, y: C.y + n[1] * o - d[1] * h, a, len: h * 2, w: 4.4, life: warn + blow, max: warn + blow, own: 'none' }; FX.H.zone(z); W.zones.push(z); }
    W.hz = FX.hz({ shape: 'fn', kind: 'rim', test: (x, y, rr) => { const dd = Math.hypot(x - C.x, y - C.y); return dd > C.R - 2.4 - rr && Math.abs(angTo(a, Math.atan2(y - C.y, x - C.x))) < 1.25; }, dps: m.dmg * 0.9, tick: 0.3, arm: warn, life: warn + blow, col: ICE_HI, draw: drawRim, cw: W });
    m.act = 'crosswind'; m.actT = 0; M.roar = 0.5; FX.H.sfx.hum();
    say(FX, 'crosswind', 'CROSSWIND', P >= 2 ? 'The wind will push you to the frozen rim, carrying ice: get upwind, by Nivora, and sidestep the shards' : 'The wind will push you to the frozen rim: get upwind, by Nivora, before it blows', ICE_HI); }
  function updCrosswind(FX, m, M, dt) { const W = M.cw; if (!W) return; const C = FX.C, me = FX.me; W.t += dt;
    const on = W.t > W.warn && W.t < W.warn + W.blow, k = on ? Math.min(1, (W.t - W.warn) / 0.35, (W.warn + W.blow - W.t) / 0.4) : 0, vx = Math.cos(W.a) * W.sp * k * dt, vy = Math.sin(W.a) * W.sp * k * dt;
    if (on && !(me.dead)) { FX.push(vx, vy); for (const q of FX.H.mons) if (!q.dead && !q.boss && !q.fobj) FX.H.moveEnt(q, vx * 0.8, vy * 0.8); }
    if (W.t > W.warn && !W.blew) { W.blew = true; FX.H.sfx.whoosh(); FX.H.shake(5, 0.3); }
    // the second phase: shards of ice ride the wind along shown lines
    while (W.gi < W.gust.length && W.t >= W.gust[W.gi] - 1.0) { W.gi++; const d = [Math.cos(W.a), Math.sin(W.a)], n = [-d[1], d[0]], rel = (me.x - C.x) * n[0] + (me.y - C.y) * n[1], offs = [rel + FX.rnd(-0.6, 0.6), rel + 4.2 * (Math.random() < 0.5 ? 1 : -1), rel - 7 * Math.sign(rel || 1)];
      for (const o of offs) { if (Math.abs(o) > RL - 1) continue; const h = Math.sqrt(RL * RL - o * o), x = C.x + n[0] * o - d[0] * h, y = C.y + n[1] * o - d[1] * h;
        FX.tele({ shape: 'line', x, y, a: W.a, len: h * 2, w: 1.3, t: 1.0 / FX.S.fast, dmg: m.dmg * 1.1, col: ICE_HI, fn: s => { FX.H.sfx.crack(); for (let i = 0; i < 7; i++) { const u = Math.random() * s.len; FX.H.sparks(s.x + Math.cos(s.a) * u, s.y + Math.sin(s.a) * u, ICE_HI, 2, 6); } shardFly(FX, s); } }); } }
    if (W.t > W.warn + W.blow) endCrosswind(FX); }
  function endCrosswind(FX) { const M = FX.mem, W = M.cw; if (!W) return; W.zones.forEach(z => { z.life = Math.min(z.life, 0.3); }); if (W.hz) W.hz.life = Math.min(W.hz.life, W.hz.age + 0.3); M.cw = null; }
  function shardFly(FX, s) { for (let i = 0; i < 5; i++) { const u = Math.random() * s.len * 0.4; FX.H.part({ kind: 'shard', x: s.x + Math.cos(s.a) * u, y: s.y + Math.sin(s.a) * u, vx: Math.cos(s.a) * 22, vy: Math.sin(s.a) * 22, g: 0, life: 0.7, max: 0.7, size: 4 + Math.random() * 3, rot: s.a, vr: 2, color: i % 2 ? ICE_HI : '#FFFFFF' }); } }

  /* ---- Wing Shear, the vanes and their windbreaks ---- */
  function laneFor(FX, i, sg, th) { const C = FX.C, B = sockAt(C, i), fa = i === 0 ? sg * th + Math.PI : -sg * th, [t0, t1] = chord(C, B, fa, RL);
    return { x0: B[0] + Math.cos(fa) * t0, y0: B[1] + Math.sin(fa) * t0, a: fa, len: t1 - t0, dB: -t0, vane: i, hit: false }; }
  function startShear(FX, m) { const M = FX.mem, C = FX.C, me = FX.me, P = FX.S.lv, f = FX.S.fast, sg = Math.random() < 0.5 ? 1 : -1, th = FX.rnd(0.55, 0.72);
    let lanes, locked = -1, target = -1;
    if (P >= 2) {   // the open eye: the lane by the vane not used last time, after a cutting pass over the pedestal
      target = M.lastVane == null ? (Math.hypot(me.x - vaneAt(C, 0)[0], me.y - vaneAt(C, 0)[1]) > Math.hypot(me.x - vaneAt(C, 1)[0], me.y - vaneAt(C, 1)[1]) ? 0 : 1) : 1 - M.lastVane; locked = 1 - target;
      const ca = Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1) + FX.rnd(-0.25, 0.25), cp = [C.x + FX.rnd(-1.2, 1.2), C.y], [c0, c1] = chord(C, cp, ca, RL);
      lanes = [{ x0: cp[0] + Math.cos(ca) * c0, y0: cp[1] + Math.sin(ca) * c0, a: ca, len: c1 - c0, dB: 1e9, vane: -1, hit: false }, laneFor(FX, target, sg, th)];
    } else { lanes = [laneFor(FX, 0, sg, th), laneFor(FX, 1, sg, th)]; if (Math.random() < 0.5) lanes.reverse(); }
    // the timetable: the first lane after a long mark; each next one once it has swung round to its start
    const v = 12 * f, vr = 16 * f; let t = (P >= 2 ? 3.0 : 3.7) / f;
    lanes.forEach((L, k) => { if (k) { const pv = lanes[k - 1], ex = pv.x0 + Math.cos(pv.a) * pv.len, ey = pv.y0 + Math.sin(pv.a) * pv.len; t = pv.t0 + pv.len / v + Math.max(1.0, Math.hypot(L.x0 - ex, L.y0 - ey) / vr) + 0.35; if (P >= 2) t = Math.max(t, 7.2 / f); }
      L.t0 = t; L.v = v; L.vr = vr; L.label = String(k + 1);
      L.tele = FX.tele({ shape: 'line', x: L.x0, y: L.y0, a: L.a, len: L.len, w: LW, t, dmg: 0, col: L.vane < 0 ? '#FFFFFF' : GREEN_HI, label: L.label, linger: L.len / v + 0.1 }); });
    M.sh = { lanes, k: 0, locked, target, P }; M.vch = [0, 0]; m.act = 'shear'; m.actT = 0; M.roar = 0.4; FX.H.sfx.hum();
    if (locked >= 0) { const q = vaneAt(C, locked); FX.H.ring(q[0], q[1], 0.3, 2, 0.5, ICE_HI, 0.35); FX.H.text(q[0], q[1] - 3, 'Frozen fast', ICE_HI, 13); }
    if (P >= 2) say(FX, 'shear2', 'WING SHEAR', `Only the ${target ? 'eastern' : 'western'} vane turns: cross the pedestal, dodge the cutting pass, turn it`, GREEN_HI);
    else say(FX, 'shear', 'WING SHEAR', 'Two flight lanes: stand at a wind vane to turn it and raise a windbreak across its lane', GREEN_HI); }
  function runShear(FX, m, M, dt, fast) { const S = M.sh; M.altW = ALT; M.menW = 0.6; M.passW = 0; if (!S) { toRest(m, M, 1.0); return; }
    const L = S.lanes[S.k], T = m.actT; if (!L) { M.sh = null; toRest(m, M, 1.4); return; }
    if (T < L.t0) {   // swinging round to the lane's start, then hanging there, wings raised
      const d = Math.hypot(L.x0 - m.x, L.y0 - m.y); glide(FX, m, M, L.x0, L.y0, L.vr, dt, L.a); if (d < 3) M.hd = FX.K.lerpA(M.hd, L.a, Math.min(1, dt * 5)); M.altW = d > 4 ? ALT + 1.2 : PASS_ALT + 0.5; M.menW = d < 4 ? 1 : 0.5; return; }
    const prog = (T - L.t0) * L.v, B = M.bar[L.vane];
    if (L.vane >= 0 && B && B.up && prog >= L.dB - 1.6) { crash(FX, m, M, L, B); return; }
    if (prog >= L.len) { const ex = L.x0 + Math.cos(L.a) * L.len, ey = L.y0 + Math.sin(L.a) * L.len; m.x = ex; m.y = ey; FX.H.sfx.whoosh(); S.k++; if (S.k >= S.lanes.length) { M.sh = null; M.bar.forEach(b => { if (b) b.life = Math.min(b.life, 0.6); }); toRest(m, M, 1.5); } return; }
    m.x = L.x0 + Math.cos(L.a) * prog; m.y = L.y0 + Math.sin(L.a) * prog; M.hd = FX.K.lerpA(M.hd, L.a, Math.min(1, dt * 8)); M.altW = PASS_ALT; M.passW = 1; M.menW = 0.4;
    if (!L.whoosh) { L.whoosh = true; FX.H.sfx.whoosh(); }
    flyHit(FX, m, M, L, L.a); }
  function crash(FX, m, M, L, B) { const P = FX.S.lv, p = L.dB - 1.6; m.x = L.x0 + Math.cos(L.a) * p; m.y = L.y0 + Math.sin(L.a) * p; B.up = false; B.life = 0.5; B.broke = 1;
    FX.S.tele.length = 0; M.sh = null; M.ps = null; toRest(m, M, 1.6); m.stunT = P >= 2 ? 4.8 : 5.8; M.stag = 0.2; M.recoil = 1; M.passK = 0;
    FX.H.banner('STAGGERED', 'It struck the windbreak and fell: strike the eye!', GREEN_HI, 2.4, true); FX.H.shake(13, 0.5); FX.H.flash(0.25, GREEN_HI); FX.H.sfx.crash(); FX.H.sfx.crack();
    FX.H.ring(B.x, B.y, 0.3, 3.4, 0.6, GREEN_HI, 0.4); frostBurst(FX, B.x, B.y - 1.5, 24); frostBurst(FX, m.x, m.y - 2, 12); }
  function updVanes(FX, m, M, dt) { const C = FX.C, me = FX.me, S = M.sh;
    for (let i = 0; i < 2; i++) { const B = M.bar[i]; if (B) { B.t += dt; B.k = toward(B.k, B.up ? 1 : 0, dt, B.up ? 3 : 4); B.broke = decay(B.broke, dt, 1.5); if (!B.up || !S) { B.life -= dt; if (B.life <= 0) B.up = false; if (B.life <= 0 && B.k < 0.03) M.bar[i] = null; } } }
    for (let i = 0; i < 2; i++) { const L = S && S.lanes.find(q => q.vane === i), live = !!(L && m.act === 'shear' && (S.lanes.indexOf(L) > S.k || m.actT < L.t0 + (L.dB - 2) / L.v)), q = vaneAt(C, i);
      // idle it creaks in the breeze; in a crosswind its arrow swings into the wind; turned, it squares to its lane
      let want = M.vA[i] + Math.sin(M.bt * 0.6 + i * 2) * 0.01, rate = 1.5, spin = false;
      if (M.cw) { want = M.cw.a + Math.PI; rate = 3; }
      if (live && S.locked !== i && !(M.bar[i] && M.bar[i].up)) { if (Math.hypot(me.x - q[0], me.y - q[1]) < VR + me.r) { M.vch[i] += dt; spin = true; if (Math.random() < dt * 12) FX.H.sparks(q[0] + FX.rnd(-0.6, 0.6), q[1] - FX.rnd(0.5, 2), GREEN_HI, 1, 2); if (M.vch[i] >= TURN) raise(FX, m, M, L); } else M.vch[i] = decay(M.vch[i], dt, 1.5); }
      else M.vch[i] = decay(M.vch[i], dt, 3);
      if (M.bar[i] && M.bar[i].up && L) { want = L.a + Math.PI / 2; rate = 4; }
      if (spin) M.vA[i] += dt * 7; else M.vA[i] = FX.K.lerpA(M.vA[i], want, Math.min(1, dt * rate)); } }
  function raise(FX, m, M, L) { const i = L.vane, B0 = sockAt(FX.C, i); M.vch[i] = 0; M.lastVane = i;
    M.bar[i] = { x: B0[0], y: B0[1], a: L.a + Math.PI / 2, half: LW / 2 + 0.8, up: true, k: 0, t: 0, life: 14, broke: 0 };
    FX.H.banner('WINDBREAK', 'The vane turns: a wall of wind rises across its lane', GREEN_HI, 1.6, true); FX.H.sfx.chime(); FX.H.sfx.thud(); FX.H.shake(5, 0.2); FX.H.ring(B0[0], B0[1], 0.3, 2.6, 0.5, GREEN_HI, 0.35); frostBurst(FX, B0[0], B0[1] - 1, 10); }

  /* ---- Aurora Pass and Aurora Gaze ---- */
  function startPass(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, q = FX.clampArena({ x: m.x, y: m.y }, 3), a = Math.atan2(me.y - q.y, me.x - q.x), wait = 1.25 / FX.S.fast;
    const [, t1] = chord(C, [q.x, q.y], a, RL), len = Math.max(4, Math.min(t1, Math.hypot(me.x - q.x, me.y - q.y) + 8));
    M.ps = { a, x0: q.x, y0: q.y, len, wait, hit: false }; m.act = 'pass'; m.actT = 0; FX.H.sfx.hum();
    FX.tele({ shape: 'line', x: q.x, y: q.y, a, len, w: LW, t: wait, dmg: 0, col: GREEN_HI, linger: len / (12.5 * FX.S.fast) });
    say(FX, 'pass', 'AURORA PASS', P >= 2 ? 'It glides the lane straight through you, and its light lingers there: off the lane' : 'It glides the lane straight through you: off the lane', GREEN_HI); }
  function startGaze(FX, m) { const M = FX.mem, P = FX.S.lv, a0 = FX.angPet(m.x, m.y), dir = Math.random() < 0.5 ? 1 : -1, n = 6, half = 0.95, w0 = 1.15 / FX.S.fast, gap = 0.14 / FX.S.fast;
    const sweep = (start, d, k0) => { for (let j = 0; j < n; j++) { const a = a0 + d * (-half + (j + 0.5) * 2 * half / n), t = start + j * gap;
      FX.tele({ shape: 'cone', x: m.x, y: m.y, a, len: 13, spread: half / n + 0.02, t, dmg: m.dmg * 1.2, col: EYE, tick: (dt, s) => { if (!s.done) { s.x = m.x; s.y = m.y; } }, fn: s => { M.beamA = s.a; M.beamK = 1; M.gz && (M.gz.cur = angTo(M.hd, s.a)); FX.H.sfx.whoosh(); for (let i = 1; i < 6; i++) FX.H.sparks(s.x + Math.cos(s.a) * i * 2.2, s.y + Math.sin(s.a) * i * 2.2, GREEN_HI, 2, 3); } }); } return start + n * gap; };
    let end = sweep(w0, dir, 0); if (P >= 2) end = sweep(end + 0.45 / FX.S.fast, -dir, n);
    M.gz = { end: end + 0.5, cur: -dir * 0.8 }; m.act = 'gaze'; m.actT = 0; FX.H.sfx.hum(); M.roar = 0.3;
    say(FX, 'gaze', 'AURORA GAZE', P >= 2 ? 'Its eye sweeps the arc, then sweeps back: get behind it or out of reach' : 'Its eye sweeps the arc in light: get behind it or out of reach', EYE); }
  /* a spray of frost: little turning shards of ice and a few sparks */
  function frostBurst(FX, x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 4; FX.H.part({ kind: 'shard', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 2.5, g: 8, life: 0.6 + Math.random() * 0.4, max: 1, size: 3 + Math.random() * 3, rot: Math.random() * 3, vr: 8, color: i % 3 ? ICE_HI : GREEN_HI }); } }

  /* ---- the body: a frame for its pose, the wings, the hit proxies ---- */
  function pose(FX, m, M) { const bt = M.bt || 0, st = M.stag || 0, br = M.breath || 0, hs = m.hitSq || 0;
    const z = (M.alt == null ? ALT : M.alt) + Math.sin(bt * 1.3) * 0.22 * (1 - st) + Math.sin(bt * 2.1) * 0.12 * br - (M.recoil || 0) * 0.25;
    const th = (M.hd == null ? Math.PI / 2 : M.hd) + Math.sin(bt * 0.8) * 0.04 + hs * 0.08;
    const roll = (M.roll || 0) + Math.sin(bt * 0.9) * 0.05 + st * Math.sin(bt * 7) * 0.04, pitch = (M.pitch || 0) + Math.sin(bt * 1.3 + 0.6) * 0.03;
    const S = (1 + (M.roar || 0) * 0.06 + Math.sin(bt * 2.1) * 0.025 * br) * lerp(0.7, 1, M.unfold == null ? 1 : M.unfold);
    return { W: RiftFiend.frame({ x: m.x, y: m.y }, th, { pitch, roll, z, scale: S }), th, z, bt, st, S }; }
  /* the four wings, as five points each (root front, leading edge, tip, trailing edge, root back), in the world. The front
     pair sweeps forward and up, the rear pair back and down: an X from above and from in front. They glide with a slow
     ripple, beat hard in a crosswind, sweep back in a pass, and droop when it falls */
  function wings(FX, m, M, Pz) { const p = Pz || pose(FX, m, M), W = p.W, bt = p.bt, st = p.st, beat = M.beat || 0, pk = M.passK || 0, unf = M.unfold == null ? 1 : M.unfold, out = [];
    const om = lerp(2.1, 8.0, beat), amp = lerp(0.3, 1.05, beat) * (1 - st * 0.85) * (1 - pk * 0.5);
    for (const f of [1, 0]) for (const s of [-1, 1]) { const ph = bt * om + (f ? 0 : Math.PI * 0.55) + (s > 0 ? 0.25 : 0), fl = Math.sin(ph);
      const al = f ? lerp(0.82, 1.08, pk) : lerp(2.28, 2.5, pk), L = (f ? 3.25 : 2.95) * lerp(0.35, 1, unf), al2 = lerp(f ? 2.2 : 2.8, al, unf);
      const base = f ? lerp(0.85, -0.25, st) : lerp(-0.4, -0.75, st), ht = base + amp * fl + (M.recoil || 0) * 0.4 * (f ? 1 : -1);
      const r1 = f ? [0.62, s * 0.42, 0.28] : [-0.12, s * 0.56, 0.24], r2 = f ? [-0.08, s * 0.56, 0.3] : [-0.78, s * 0.42, 0.16], tip = [(f ? 0.2 : -0.4) + Math.cos(al2) * L, s * Math.sin(al2) * L, ht];
      const cu = (r1[0] + r2[0] + tip[0]) / 3, cv = (r1[1] + r2[1] + tip[1]) / 3, off = (a, b, k) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ex = b[0] - a[0], ey = b[1] - a[1], el = Math.hypot(ex, ey) || 1; let nx = -ey / el, ny = ex / el; if ((mx - cu) * nx + (my - cv) * ny < 0) { nx = -nx; ny = -ny; } return [mx + nx * k, my + ny * k]; };
      const le = off(r1, tip, 0.28), te = off(tip, r2, f ? 1.0 : 0.85), hl = lerp(r1[2], ht, 0.5) + amp * 0.24 * Math.sin(ph - 0.8), hte = lerp(r2[2], ht, 0.55) + amp * 0.32 * Math.sin(ph - 1.15) - 0.06;
      const pts = [W(...r1), W(le[0], le[1], hl), W(...tip), W(te[0], te[1], hte), W(...r2)];
      out.push({ f, s, pts, at: [(pts[0][0] + pts[2][0] + pts[4][0]) / 3, (pts[0][1] + pts[2][1] + pts[4][1]) / 3, (pts[0][2] + pts[2][2] + pts[4][2]) / 3], key: (f ? 'f' : 'r') + (s > 0 ? 'l' : 'r') }); }
    return out; }
  function headWorld(p) { return p.W(1.12, 0, 0.22); }
  function eyeWorld(FX, m, M) { const p = pose(FX, m, M), h = headWorld(p), f = [Math.cos(p.th), Math.sin(p.th)]; return [h[0] + f[0] * 0.45, h[1] + f[1] * 0.45 + 0.2, h[2] + 0.05]; }
  function bodyParts(FX, m, M) { const p = pose(FX, m, M), c = p.W(0, 0, 0), h = headWorld(p), Wg = wings(FX, m, M, p); return [hit('body', c, 1.9, m), hit('head', h, 1.1, m)].concat(Wg.map(w => hit('w' + w.key, [lerp(w.pts[0][0], w.pts[2][0], 0.55), lerp(w.pts[0][1], w.pts[2][1], 0.55), lerp(w.pts[0][2], w.pts[2][2], 0.55)], 1.2, m))); }

  /* ---- painting Nivora ---- */
  function drawNivora(c, FX, m, X, Y, T, t, step) {
    const M = FX.mem, P3 = TN.cam(X, Y, T, m), lw = Math.max(1.3, T * 0.065), p = pose(FX, m, M), W = p.W, Wg = wings(FX, m, M, p), go = i => step == null || step === i;
    const items = [];
    Wg.forEach(w => items.push({ at: w.at, f: () => paintWing(c, w, P3, T, lw, M, p) }));
    for (const s of [-1, 1]) { const root = W(-1.42, s * 0.16, 0.02); items.push({ at: [root[0] - Math.cos(M.tailHd) * 2, root[1] - Math.sin(M.tailHd) * 2, root[2] - 0.3], f: () => paintTail(c, FX, m, M, p, s, root, P3, T, lw) }); }
    items.push({ at: W(-0.95, 0, -0.1), f: () => paintAbdomen(c, M, p, P3, T, lw) });
    items.push({ at: W(0.2, 0, -0.7), f: () => paintLegs(c, M, p, P3, T, lw) });
    items.push({ at: W(0, 0, 0.05), f: () => paintThorax(c, M, p, P3, T, lw) });
    items.push({ at: headWorld(p), f: () => paintHead(c, FX, m, M, p, P3, T, lw) });
    const list = RiftFiend.sorted(items), half = Math.ceil(list.length / 2);
    if (go(0)) {
      // its shadow on the stone: a soft X, larger and fainter the higher it flies
      const g0 = P3(m.x, m.y, 0), k = 1 / (1 + p.z * 0.1); FX.K.shade(c, g0[0], g0[1], T * 2.2 * k, T * 1.2 * k, 0.4, '#0A1426');
      Wg.forEach(w => { const q = P3(w.pts[2][0], w.pts[2][1], 0), r = P3(w.pts[0][0], w.pts[0][1], 0); FX.K.shade(c, (q[0] + r[0]) / 2, (q[1] + r[1]) / 2, T * 1.3 * k, T * 0.7 * k, 0.22, '#0A1426'); });
      list.slice(0, half).forEach(it => it.f()); }
    if (go(1)) list.slice(half).forEach(it => it.f()); }
  /* a wing: a broad triangle of frozen light, white at the root, aurora green at the tip; veins and cross-veins of an
     insect's wing, the leading edge catching the light; lit by how it is turned */
  function paintWing(c, w, P3, T, lw, M, p) { const Q = w.pts.map(q => P3(q[0], q[1], q[2])), st = p.st;
    let n = nrm(cross([w.pts[2][0] - w.pts[0][0], w.pts[2][1] - w.pts[0][1], w.pts[2][2] - w.pts[0][2]], [w.pts[4][0] - w.pts[0][0], w.pts[4][1] - w.pts[0][1], w.pts[4][2] - w.pts[0][2]])); if (n[2] < 0) n = n.map(x => -x);
    const lit = clamp(dot(n, LIT) * 0.8 + 0.3, 0, 1), under = dot(n, VIEW) < 0.1;
    const thru = (a, b, cc) => [2 * b[0] - (a[0] + cc[0]) / 2, 2 * b[1] - (a[1] + cc[1]) / 2];
    const path = g => { const k1 = thru(Q[0], Q[1], Q[2]), k2 = thru(Q[2], Q[3], Q[4]); g.moveTo(Q[0][0], Q[0][1]); g.quadraticCurveTo(k1[0], k1[1], Q[2][0], Q[2][1]); g.quadraticCurveTo(k2[0], k2[1], Q[4][0], Q[4][1]); g.closePath(); };
    const rm = [(Q[0][0] + Q[4][0]) / 2, (Q[0][1] + Q[4][1]) / 2], gr = c.createLinearGradient(rm[0], rm[1], Q[2][0], Q[2][1]);
    const tone = (hex, k) => FX0.mixC(hex, '#5E86A8', (1 - lit) * 0.45 + (under ? 0.2 : 0) + st * 0.15);
    gr.addColorStop(0, tone('#F4FAFC')); gr.addColorStop(0.38, tone('#E1EEF3')); gr.addColorStop(0.62, tone('#BDEBDB')); gr.addColorStop(0.84, tone('#84DDB8')); gr.addColorStop(1, tone('#55C79C'));
    c.save(); c.beginPath(); path(c); c.fillStyle = gr; c.fill();
    c.save(); c.clip();
    // veins fanning from the root, and a row of cross-veins: the cells of an insect's wing
    const at = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], edge = [Q[0], Q[1], Q[2], Q[3], Q[4]], tips = [at(Q[0], Q[1], 0.7), Q[1], at(Q[1], Q[2], 0.5), Q[2], at(Q[2], Q[3], 0.5), Q[3], at(Q[3], Q[4], 0.45)];
    c.strokeStyle = 'rgba(23,44,77,.32)'; c.lineWidth = Math.max(0.8, lw * 0.45); c.beginPath(); tips.forEach(q => { c.moveTo(rm[0], rm[1]); c.lineTo(q[0], q[1]); }); c.stroke();
    c.strokeStyle = 'rgba(23,44,77,.22)'; c.beginPath(); [0.45, 0.72].forEach(u => { tips.forEach((q, j) => { const r = at(rm, q, u); j ? c.lineTo(r[0], r[1]) : c.moveTo(r[0], r[1]); }); }); c.stroke();
    // a frosted sheen near the root, green light pooling in the tip
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + (M.menace || 0) * 0.25; blitSized(c, glowSprite(GREEN), Q[2][0] - T * 1.4, Q[2][1] - T * 1.4, T * 2.8, T * 2.8); c.globalAlpha = 0.25; blitSized(c, glowSprite('#FFFFFF'), rm[0] - T * 0.9, rm[1] - T * 0.9, T * 1.8, T * 1.8);
    c.restore();
    c.strokeStyle = LINE; c.lineWidth = lw; c.lineJoin = 'round'; c.beginPath(); path(c); c.stroke();
    // the leading edge, a bright rib of ice
    const k1 = thru(Q[0], Q[1], Q[2]); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(1, lw * 0.55); c.beginPath(); c.moveTo(Q[0][0], Q[0][1]); c.quadraticCurveTo(k1[0], k1[1], Q[2][0], Q[2][1]); c.stroke();
    c.restore(); }
  /* a tail vane: a long stiff blade of navy edged in ice, a green glint at its point; it swings a beat behind its turns */
  function paintTail(c, FX, m, M, p, s, root, P3, T, lw) { const a = (M.tailHd == null ? p.th : M.tailHd) + Math.PI + s * 0.11 + Math.sin(p.bt * 0.9 + s) * 0.03, L = 4.6 * p.S, d = [Math.cos(a), Math.sin(a)], nv = [-d[1], d[0]], dip = -0.35 - (M.passK || 0) * -0.25 + p.st * -0.5;
    const ax = u => [root[0] + d[0] * u * L, root[1] + d[1] * u * L, root[2] + dip * u + Math.sin(p.bt * 1.4 + s * 1.3 - u * 1.2) * 0.12 * u], wd = u => (u < 0.72 ? lerp(0.07, 0.34, u / 0.72) : lerp(0.34, 0, (u - 0.72) / 0.28)) * p.S;
    const us = [0, 0.2, 0.45, 0.72, 0.88, 1], Lp = us.map(u => { const q = ax(u); return P3(q[0] + nv[0] * wd(u), q[1] + nv[1] * wd(u), q[2]); }), Rp = us.map(u => { const q = ax(u); return P3(q[0] - nv[0] * wd(u), q[1] - nv[1] * wd(u), q[2]); });
    const pts = Lp.concat(Rp.slice().reverse());
    TN.shape(c, TN.poly(pts), { col: NAVY, shade: NAVY_SH, hi: NAVY_HI, line: LINE, lw, r: T * 0.5, d1: 0.12, d2: 0.24, spec: false, force: true, inner: g => { g.strokeStyle = ICE; g.lineWidth = Math.max(1, T * 0.05); g.beginPath(); const c0 = P3(...ax(0.05)), c1 = P3(...ax(0.95)); g.moveTo(c0[0], c0[1]); g.lineTo(c1[0], c1[1]); g.stroke(); } });
    const tp = P3(...ax(0.92)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; blitSized(c, glowSprite(GREEN_HI), tp[0] - T * 0.6, tp[1] - T * 0.6, T * 1.2, T * 1.2); c.restore(); }
  function paintAbdomen(c, M, p, P3, T, lw) { const g = p.W(-0.92, 0, -0.02);
    RiftFiend.ell(c, P3, p.th, g, [0.62 * p.S, 0.54 * p.S, 0.46 * p.S], { T, col: NAVY, shade: NAVY_SH, hi: NAVY_HI, line: LINE, lw, spec: 0.35, d1: 0.1, d2: 0.22,
      inner: g2 => { g2.strokeStyle = 'rgba(134,183,208,.55)'; g2.lineWidth = Math.max(1, T * 0.05); for (let k = 0; k < 3; k++) { const a = p.W(-0.7 - k * 0.22, -0.55, 0.28), b = p.W(-0.7 - k * 0.22, 0.55, 0.28), mm = p.W(-0.7 - k * 0.22, 0, 0.52), A = P3(...a), B = P3(...b), Mm = P3(...mm); g2.beginPath(); g2.moveTo(A[0], A[1]); g2.quadraticCurveTo(Mm[0], Mm[1] - T * 0.1, B[0], B[1]); g2.stroke(); } } }); }
  function paintThorax(c, M, p, P3, T, lw) { const g = p.W(0, 0, 0.05);
    RiftFiend.ell(c, P3, p.th, g, [0.95 * p.S, 0.82 * p.S, 0.68 * p.S], { T, col: NAVY, shade: NAVY_SH, hi: NAVY_HI, line: LINE, lw: lw * 1.1, spec: 0.55, d1: 0.1, d2: 0.22,
      inner: g2 => { // a keel of ice plates down its back, faintly lit from within
        const A = P3(...p.W(0.62, 0, 0.6)), B = P3(...p.W(-0.62, 0, 0.6)), Mm = P3(...p.W(0, 0, 0.8)); g2.strokeStyle = ICE_HI; g2.lineWidth = Math.max(1.5, T * 0.11); g2.beginPath(); g2.moveTo(A[0], A[1]); g2.quadraticCurveTo(Mm[0], Mm[1], B[0], B[1]); g2.stroke();
        g2.strokeStyle = 'rgba(120,215,178,.5)'; g2.lineWidth = Math.max(1, T * 0.04); for (const s of [-1, 1]) { const a = P3(...p.W(0.6, s * 0.45, 0.42)), b = P3(...p.W(-0.6, s * 0.5, 0.38)); g2.beginPath(); g2.moveTo(a[0], a[1]); g2.lineTo(b[0], b[1]); g2.stroke(); } } }); }
  // three pairs of thin dark legs tucked under the body, dangling a little lower when it sinks to rest
  function paintLegs(c, M, p, P3, T, lw) { const dn = (M.breath || 0) * 0.35 + p.st * 0.4;
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const sh = p.W(0.45 - k * 0.45, s * 0.42, -0.35), ft = p.W(0.75 - k * 0.65, s * (0.75 + k * 0.1), -0.95 - dn - Math.sin(p.bt * 1.5 + k + s) * 0.05);
      RiftFiend.limb(c, P3, sh, ft, 0.25, [0, 0], T * 0.12, T * 0.06, { col: NAVY_SH, line: LINE, lw: lw * 0.7, hi: NAVY, d1: 0.1, d2: 0.2 }); } }
  /* the head: a smooth dark sphere with one luminous horizontal eye; the eye scans (its bright core runs along the slit),
     narrows with menace, blinks, and opens wide when it falls */
  function paintHead(c, FX, m, M, p, P3, T, lw) { const h = headWorld(p), r = 0.62 * p.S;
    RiftFiend.ell(c, P3, p.th, h, [r, r, r * 0.96], { T, col: HEAD, shade: '#060B16', hi: '#24365A', line: LINE, lw: lw * 1.1, spec: 0.9, specR: 0.14, d1: 0.1, d2: 0.24 });
    paintEye(c, FX, m, M, p, P3, T, false); }
  function eyeCurve(M, p) { const h = headWorld(p), r = 0.63 * p.S, f = [Math.cos(p.th), Math.sin(p.th), 0], l = [-Math.sin(p.th), Math.cos(p.th), 0], up = [0, 0, 1], st = p.st;
    const open = clamp((0.27 + (M.menace || 0) * -0.06 + st * 0.2 + (M.roar || 0) * 0.1) * (1 - (M.blink || 0) * 0.9), 0.02, 0.45), top = [], bot = [], N = 15;
    for (let j = 0; j < N; j++) { const ph = -1.45 + 2.9 * j / (N - 1), dir = [f[0] * Math.cos(ph) + l[0] * Math.sin(ph), f[1] * Math.cos(ph) + l[1] * Math.sin(ph), 0], e = open * Math.cos(ph * 1.15) + 0.01, tilt = -(M.pitch || 0);
      for (const [arr, sg] of [[top, 1], [bot, -1]]) { const ee = e * sg + tilt + 0.04, n = [dir[0] * Math.cos(ee), dir[1] * Math.cos(ee), Math.sin(ee)]; arr.push({ p: [h[0] + n[0] * r, h[1] + n[1] * r, h[2] + n[2] * r], vis: dot(n, VIEW) > 0.02, ph }); } }
    return { top, bot, open, h, r }; }
  function paintEye(c, FX, m, M, p, P3, T, glowOnly) { const E = eyeCurve(M, p), idx = []; E.top.forEach((q, j) => { if (q.vis && E.bot[j].vis) idx.push(j); }); if (idx.length < 2) return;
    const top = idx.map(j => P3(...E.top[j].p)), bot = idx.map(j => P3(...E.bot[j].p)).reverse(), pts = top.concat(bot);
    const scan = clamp(M.scan || 0, -1.2, 1.2), jl = clamp(Math.round((scan + 1.45) / 2.9 * 14), idx[0], idx[idx.length - 1]), core = P3(...E.top[jl].p), core2 = P3(...E.bot[jl].p), cx = (core[0] + core2[0]) / 2, cy = (core[1] + core2[1]) / 2, gl = 0.5 + (M.menace || 0) * 0.4 + p.st * 0.5 + (M.beamK || 0) * 0.5;
    if (glowOnly) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, gl * 0.55); blitSized(c, glowSprite(GREEN), cx - T * 2.2, cy - T * 2.2, T * 4.4, T * 4.4); c.globalAlpha = Math.min(1, gl * 0.8); blitSized(c, glowSprite(EYE), cx - T * 0.8, cy - T * 0.8, T * 1.6, T * 1.6); c.restore(); return; }
    c.save(); c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); const g = c.createLinearGradient(top[0][0], top[0][1], top[top.length - 1][0], top[top.length - 1][1]); g.addColorStop(0, '#5FC9A4'); g.addColorStop(0.5, EYE); g.addColorStop(1, '#5FC9A4'); c.fillStyle = g; c.fill(); c.strokeStyle = '#08101E'; c.lineWidth = Math.max(1, T * 0.04); c.stroke();
    c.clip(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(cx, cy, T * 0.2, T * 0.14, 0, 0, TAU); c.fill(); c.restore(); }

  /* ---- live light over the scene: the eye's glow, the aurora along the wing tips and streaming behind them, the gaze ---- */
  function drawLights(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || m.dead) return; const sx = q => FX.sx(q[0]), sy = q => FX.sy(q[1]) - q[2] * T, p = pose(FX, m, M), Wg = wings(FX, m, M, p), unf = M.unfold == null ? 1 : M.unfold;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    // the streams behind the tips: ribbons of green light, brighter in a pass
    const H = M.tips; if (H && H.length > 2) for (let w = 0; w < 4; w++) { for (let j = 1; j < H.length; j++) { const a = H[j - 1].p[w], b = H[j].p[w], u = j / H.length, k = 0.25 + H[j].k * 0.75; if (!a || !b) continue; c.globalAlpha = u * 0.35 * k * unf; c.strokeStyle = w % 2 ? GREEN_HI : '#A8F0FF'; c.lineWidth = Math.max(1, T * (0.12 + u * 0.3) * k); c.beginPath(); c.moveTo(sx(a), sy(a)); c.lineTo(sx(b), sy(b)); c.stroke(); } }
    // the shimmer: curtains of aurora rising off the outer third of each wing, rippling
    Wg.forEach((w, k) => { const P = w.pts.map(q => [sx(q), sy(q)]);
      for (let j = 0; j < 9; j++) { const u = j / 8, edge = j % 2 ? [lerp(P[2][0], P[3][0], u * 0.7), lerp(P[2][1], P[3][1], u * 0.7)] : [lerp(P[2][0], P[1][0], u * 0.6), lerp(P[2][1], P[1][1], u * 0.6)], wave = 0.5 + 0.5 * Math.sin(t * 2.6 + j * 1.9 + k * 1.3), len = T * (0.45 + 0.75 * wave) * (1 - u * 0.5) * unf;
        const g = c.createLinearGradient(edge[0], edge[1], edge[0], edge[1] - len); g.addColorStop(0, j % 3 === 2 ? 'rgba(200,170,255,.0)' : 'rgba(120,215,178,.0)'); g.addColorStop(0.25, j % 3 === 2 ? 'rgba(200,170,255,.4)' : 'rgba(150,240,205,.55)'); g.addColorStop(1, 'rgba(184,245,218,0)');
        c.globalAlpha = (0.35 + 0.45 * wave) * (0.7 + (M.menace || 0) * 0.3); c.strokeStyle = g; c.lineWidth = Math.max(1, T * (0.1 + 0.08 * wave)); c.beginPath(); c.moveTo(edge[0], edge[1]); c.quadraticCurveTo(edge[0] + Math.sin(t * 1.7 + j) * T * 0.2, edge[1] - len * 0.5, edge[0] + Math.sin(t * 1.3 + j * 2) * T * 0.15, edge[1] - len); c.stroke(); }
      const tp = P[2], tw = 0.5 + 0.5 * Math.sin(t * 3.1 + k * 1.7); TN.twinkle(c, tp[0], tp[1], T * (0.14 + 0.1 * tw), '#FFFFFF', 0.5 + 0.4 * tw); });
    // the gaze: a blade of light from the eye along the last angle it struck
    if ((M.beamK || 0) > 0.02) { const e = eyeWorld(FX, m, M), ex = sx(e), ey = sy(e), a = M.beamA, L = 13 * T, bx = FX.sx(m.x + Math.cos(a) * 13), by = FX.sy(m.y + Math.sin(a) * 13);
      for (const [wk, al, col] of [[0.9, 0.2, GREEN], [0.4, 0.55, GREEN_HI], [0.12, 0.9, '#FFFFFF']]) { c.globalAlpha = al * M.beamK; c.strokeStyle = col; c.lineWidth = Math.max(1, T * wk); c.beginPath(); c.moveTo(ex, ey); c.lineTo(bx, by); c.stroke(); } void L; }
    c.restore();
    paintEye(c, FX, m, M, p, (x, y, z) => [FX.sx(x), FX.sy(y) - (z || 0) * T], T, true); }
  /* the windbreaks: tall curtains of green wind across their lanes, streaming upward; shattering when it strikes them */
  function drawBarriers(c, FX, T, t) { const M = FX.mem; if (!M.bar) return; c.save(); c.lineCap = 'round';
    for (const B of M.bar) { if (!B || B.k < 0.02) continue; const ca = Math.cos(B.a), sa = Math.sin(B.a), N = 14, k = B.k, Hh = 4.2 * k;
      const pt = (u, z) => [FX.sx(B.x + ca * u * B.half), FX.sy(B.y + sa * u * B.half) - z * T], top = u => Hh * (0.82 + 0.18 * Math.sin(u * 5 + t * 3));
      const a0 = pt(-1, 0), a1 = pt(1, 0), g = c.createLinearGradient(0, a0[1], 0, a0[1] - Hh * T); g.addColorStop(0, 'rgba(120,215,178,.55)'); g.addColorStop(0.5, 'rgba(120,215,178,.22)'); g.addColorStop(1, 'rgba(160,240,210,0)');
      // the curtain itself, its top edge rippling
      c.globalAlpha = k; c.fillStyle = g; c.beginPath(); c.moveTo(a0[0], a0[1]); for (let j = 0; j <= N; j++) { const u = -1 + 2 * j / N, q = pt(u, top(u)); c.lineTo(q[0], q[1]); } c.lineTo(a1[0], a1[1]); c.closePath(); c.fill();
      c.globalCompositeOperation = 'lighter';
      // streams of wind rising through it
      for (let j = 0; j <= N; j++) { const u = -1 + 2 * j / N + Math.sin(t * 2 + j) * 0.02, ph = (t * 1.3 + j * 0.41) % 1, z0 = top(u) * ph * 0.75, q0 = pt(u, z0), q1 = pt(u, z0 + top(u) * 0.3); c.globalAlpha = k * 0.8 * Math.sin(ph * Math.PI); c.strokeStyle = j % 2 ? GREEN_HI : '#FFFFFF'; c.lineWidth = Math.max(1.5, T * 0.1); c.beginPath(); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.stroke(); }
      c.globalAlpha = k * 0.7; c.strokeStyle = GREEN_HI; c.lineWidth = Math.max(1.5, T * 0.08); c.beginPath(); for (let j = 0; j <= N; j++) { const u = -1 + 2 * j / N, q = pt(u, top(u)); j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke();
      c.globalAlpha = k * (0.75 + 0.25 * Math.sin(t * 6)); c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(2, T * 0.14); c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.stroke();
      [a0, a1].forEach(q => blitSized(c, glowSprite(GREEN_HI), q[0] - T, q[1] - T, T * 2, T * 2));
      if (B.broke > 0) { c.globalAlpha = B.broke; blitSized(c, glowSprite('#FFFFFF'), (a0[0] + a1[0]) / 2 - T * 3.5, (a0[1] + a1[1]) / 2 - T * 5, T * 7, T * 7); }
      c.globalCompositeOperation = 'source-over'; }
    c.restore(); }
  /* the crosswind, blowing: snow streaking across the platform */
  function drawWind(c, FX, T, t) { const M = FX.mem, W = M.cw, C = FX.C; if (!W) return; const on = W.t > W.warn ? Math.min(1, (W.t - W.warn) / 0.3, (W.warn + W.blow - W.t) / 0.4) : 0.25 * Math.min(1, W.t / 0.5), d = [Math.cos(W.a), Math.sin(W.a)], n = [-d[1], d[0]];
    if (on <= 0.02) return; c.save(); c.lineCap = 'round'; const R = mulberry32(31);
    for (let i = 0; i < 70; i++) { const o = (R() * 2 - 1) * RL, sp = 0.7 + R() * 0.6, h = Math.sqrt(Math.max(0, RL * RL - o * o)), u = ((R() * 2 * h + t * 9 * sp) % (2 * h)) - h, x = C.x + n[0] * o + d[0] * u, y = C.y + n[1] * o + d[1] * u, L = (0.6 + R() * 0.9) * (W.t > W.warn ? 1 : 0.5), z = R() * 2.5;
      c.globalAlpha = on * (0.35 + R() * 0.4); c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(1, T * (0.04 + R() * 0.05)); c.beginPath(); c.moveTo(FX.sx(x), FX.sy(y) - z * T); c.lineTo(FX.sx(x + d[0] * L), FX.sy(y + d[1] * L) - z * T); c.stroke(); }
    c.restore(); }
  /* the downwind rim, freezing: a band of frost along the parapet; it grows its icicles as the wind arrives */
  function drawRim(c, z, FX, T, t) { const W = z.cw, C = FX.C, X = FX.sx(C.x), Y = FX.sy(C.y), on = W && W.t > W.warn, fade = Math.min(1, z.age / 0.4, (z.life - z.age) / 0.4); if (fade <= 0) return;
    const a = W ? W.a : 0, r0 = (C.R - 2.4) * T, r1 = (C.R + 0.2) * T; c.save(); c.globalAlpha = fade;
    c.beginPath(); c.arc(X, Y, r1, a - 1.25, a + 1.25); c.arc(X, Y, r0, a + 1.25, a - 1.25, true); c.closePath(); c.fillStyle = on ? 'rgba(207,232,244,.45)' : `rgba(207,232,244,${0.12 + 0.1 * Math.sin(t * 8)})`; c.fill();
    c.strokeStyle = on ? '#FFFFFF' : 'rgba(255,255,255,.7)'; c.lineWidth = Math.max(1.5, T * 0.08); c.setLineDash(on ? [] : [T * 0.4, T * 0.3]); c.lineDashOffset = -t * T; c.beginPath(); c.arc(X, Y, r0, a - 1.25, a + 1.25); c.stroke(); c.setLineDash([]);
    // icicles pointing inward along the band
    const k = on ? Math.min(1, (W.t - W.warn) / 0.5) : Math.min(1, z.age / Math.max(0.5, W ? W.warn : 1)) * 0.5; c.fillStyle = '#F2FAFF'; c.strokeStyle = '#5E86A8'; c.lineWidth = Math.max(1, T * 0.03);
    for (let i = 0; i < 26; i++) { const b = a - 1.2 + 2.4 * i / 25, L = T * (0.5 + (i * 37 % 7) / 7 * 0.9) * k, rr = r0 + T * 0.2, x0 = X + Math.cos(b) * rr, y0 = Y + Math.sin(b) * rr, tx = X + Math.cos(b) * (rr - L), ty = Y + Math.sin(b) * (rr - L), w = T * 0.16;
      c.beginPath(); c.moveTo(x0 - Math.sin(b) * w, y0 + Math.cos(b) * w); c.lineTo(tx, ty); c.lineTo(x0 + Math.sin(b) * w, y0 - Math.cos(b) * w); c.closePath(); c.fill(); c.stroke(); }
    c.font = `900 ${Math.round(T * 0.45)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; const lx = X + Math.cos(a) * (r0 - T * 1.1), ly = Y + Math.sin(a) * (r0 - T * 1.1); c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.55)'; c.fillStyle = '#FFFFFF'; c.strokeText('FROZEN RIM', lx, ly); c.fillText('FROZEN RIM', lx, ly);
    c.restore(); }

  /* ---- the vanes' rings, the windbreak sockets ---- */
  function drawOverlay(c, FX, t, T) { const M = FX.mem, C = FX.C, S = M && M.sh; if (!M || !C || !M.vch || !M.bar) return; c.save();
    for (let i = 0; i < 2; i++) { const q = vaneAt(C, i), X = FX.sx(q[0]), Y = FX.sy(q[1]), L = S && S.lanes.find(l => l.vane === i), usable = !!(L && FX.m && FX.m.act === 'shear' && S.locked !== i && !(M.bar[i] && M.bar[i].up)), locked = !!(S && S.locked === i), ch = clamp((M.vch[i] || 0) / TURN, 0, 1), r = VR * T;
      if (usable) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.2 * Math.sin(t * 5); blitSized(c, glowSprite(GREEN_HI), X - r * 1.5, Y - r * 1.5, r * 3, r * 3); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      c.strokeStyle = locked ? 'rgba(207,232,244,.8)' : usable ? `rgba(184,245,218,${0.7 + 0.3 * Math.sin(t * 6)})` : 'rgba(184,245,218,.3)'; c.lineWidth = Math.max(1.5, T * (usable ? 0.11 : 0.06)); if (!usable && !locked) c.setLineDash([T * 0.3, T * 0.25]); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.stroke(); c.setLineDash([]);
      if (ch > 0.01) { c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = Math.max(4, T * 0.2); c.beginPath(); c.arc(X, Y - T * 2.6, T * 0.5, 0, TAU); c.stroke(); c.strokeStyle = GREEN_HI; c.lineWidth = Math.max(3, T * 0.14); c.beginPath(); c.arc(X, Y - T * 2.6, T * 0.5, -Math.PI / 2, -Math.PI / 2 + TAU * ch); c.stroke(); }
      if (usable || locked) { c.font = `900 ${Math.round(T * 0.4)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = locked ? ICE_HI : '#FFFFFF'; const s = locked ? 'FROZEN' : ch > 0.01 ? 'TURNING' : 'TURN · stand here'; c.strokeText(s, X, Y + r + T * 0.5); c.fillText(s, X, Y + r + T * 0.5); }
      // the socket its windbreak rises from, lit while that lane is marked
      const B = sockAt(C, i), bx = FX.sx(B[0]), by = FX.sy(B[1]); c.strokeStyle = usable ? `rgba(184,245,218,${0.6 + 0.3 * Math.sin(t * 4)})` : 'rgba(184,154,94,.55)'; c.lineWidth = Math.max(1.5, T * 0.08); c.beginPath(); c.arc(bx, by, T * 0.7, 0, TAU); c.stroke();
      if (usable && L) { const pa = L.a + Math.PI / 2, h = (LW / 2 + 0.8) * T; c.setLineDash([T * 0.25, T * 0.2]); c.lineDashOffset = -t * T; c.beginPath(); c.moveTo(bx - Math.cos(pa) * h, by - Math.sin(pa) * h); c.lineTo(bx + Math.cos(pa) * h, by + Math.sin(pa) * h); c.stroke(); c.setLineDash([]); } }
    c.restore(); }

  /* ---- the great telescope: a stone drum, a brass fork, a long brass tube that follows Nivora across the sky ---- */
  function drawTelescope(c, FX, p, X, Y, T, t) { const m = FX.m, lw = Math.max(1.2, T * 0.06), P3 = (x, y, z) => [X + (x - p.x) * T, Y + (y - p.y) * T - z * T];
    c.save(); FX.K.shade(c, X, Y + T * 0.1, T * 1.4, T * 0.6, 0.35, '#0A1426');
    // the drum
    const r = 0.95, h = 1.0, top = Y - h * T; TN.shape(c, g => { g.moveTo(X - r * T, top); g.lineTo(X - r * T, Y); g.ellipse(X, Y, r * T, r * T * 0.42, 0, Math.PI, 0, true); g.lineTo(X + r * T, top); g.closePath(); }, { col: '#5C6A82', shade: '#3A4458', hi: '#7A8AA4', line: LINE, lw, r: T * 1.0, spec: false, force: true, inner: g => { g.strokeStyle = 'rgba(20,30,50,.4)'; g.lineWidth = Math.max(1, T * 0.04); for (let k = 1; k < 3; k++) { g.beginPath(); g.ellipse(X, top + k * h * T / 3, r * T, r * T * 0.42, 0, 0, Math.PI); g.stroke(); } } });
    c.fillStyle = '#F6FAFC'; c.beginPath(); c.ellipse(X, top, r * T, r * T * 0.42, 0, 0, TAU); c.fill(); c.strokeStyle = LINE; c.lineWidth = lw; c.stroke();
    // the tube: it tracks Nivora
    const az = m && !m.dead ? Math.atan2(m.y - p.y, m.x - p.x) : -0.9, el = m && !m.dead ? clamp(0.35 + ((FX.mem && FX.mem.alt) || ALT) * 0.05, 0.35, 0.8) : 0.6, pv = [p.x, p.y, h + 0.75], dd = [Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), Math.sin(el)];
    const at = u => [pv[0] + dd[0] * u, pv[1] + dd[1] * u, pv[2] + dd[2] * u], back = at(-0.9), front = at(2.6), sP = P3(...back), fP = P3(...front);
    // the fork
    for (const s of [-1, 1]) { const b = P3(p.x - Math.sin(az) * 0.45 * s, p.y + Math.cos(az) * 0.45 * s, h), tp = P3(pv[0] - Math.sin(az) * 0.4 * s, pv[1] + Math.cos(az) * 0.4 * s, pv[2]); c.strokeStyle = LINE; c.lineWidth = T * 0.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(tp[0], tp[1]); c.stroke(); c.strokeStyle = BRASS_SH; c.lineWidth = T * 0.12; c.stroke(); }
    TN.tubeLite(c, [sP, P3(...at(0)), P3(...at(1.2)), fP], u => T * lerp(0.46, 0.7, u), { col: BRASS, shade: BRASS_SH, hi: BRASS_HI, line: LINE, lw, d1: 0.14, d2: 0.26 });
    // brass rings and the objective's glass, catching the aurora
    c.strokeStyle = BRASS_SH; c.lineWidth = Math.max(1.5, T * 0.09); [0.1, 0.45, 0.8].forEach(u => { const q = P3(...at(lerp(-0.9, 2.6, u))), w = T * lerp(0.42, 0.62, u) * 0.5, nx = -(fP[1] - sP[1]), ny = fP[0] - sP[0], nl = Math.hypot(nx, ny) || 1; c.beginPath(); c.moveTo(q[0] - nx / nl * w, q[1] - ny / nl * w); c.lineTo(q[0] + nx / nl * w, q[1] + ny / nl * w); c.stroke(); });
    c.fillStyle = '#0E1A2E'; c.strokeStyle = LINE; c.lineWidth = lw; c.beginPath(); c.ellipse(fP[0], fP[1], T * 0.32, T * 0.24, Math.atan2(fP[1] - sP[1], fP[0] - sP[0]), 0, TAU); c.fill(); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.2 * Math.sin(t * 1.3); blitSized(c, glowSprite(GREEN), fP[0] - T * 0.5, fP[1] - T * 0.5, T, T); c.restore(); }
  /* a wind vane: a black iron post with a crank wheel at its foot, a broad triangular fin and an arrow turning at its top;
     it creaks in the breeze, swings round when turned, and lies frozen in ice when Nivora shuts it */
  function drawVane(c, FX, p, X, Y, T, t) { const M = FX.mem || {}, i = p.i, va = M.vA ? M.vA[i] : 0, S = M.sh, locked = !!(S && S.locked === i), up = !!(M.bar && M.bar[i] && M.bar[i].up), lw = Math.max(1.2, T * 0.06), Hp = 3.6, P3 = (x, y, z) => [X + (x - p.x) * T, Y + (y - p.y) * T - z * T];
    c.save(); FX.K.shade(c, X, Y + T * 0.1, T * 0.8, T * 0.35, 0.35, '#0A1426');
    // the post
    TN.shape(c, TN.poly([[X - T * 0.13, Y], [X - T * 0.1, Y - Hp * T], [X + T * 0.1, Y - Hp * T], [X + T * 0.13, Y]]), { col: IRON, shade: '#141A28', hi: '#46506A', line: LINE, lw, r: T * 0.3, spec: false, force: true });
    // the crank wheel
    const wy = Y - T * 1.0, ch = M.vch ? M.vch[i] : 0, wa = va * 2 + ch * 6; c.strokeStyle = LINE; c.lineWidth = lw * 1.6; c.beginPath(); c.arc(X, wy, T * 0.42, 0, TAU); c.stroke(); c.strokeStyle = BRASS; c.lineWidth = lw; c.stroke(); c.beginPath(); for (let k = 0; k < 4; k++) { const a = wa + k * Math.PI / 2; c.moveTo(X, wy); c.lineTo(X + Math.cos(a) * T * 0.42, wy + Math.sin(a) * T * 0.42); } c.stroke();
    // the fin and the arrow, in 3D about the post's top
    const d = [Math.cos(va), Math.sin(va)], tp = [p.x, p.y, Hp], fin = [[0.15, 0.15], [-1.7, 1.05], [-1.9, -0.45], [-0.2, -0.2]].map(([u, z]) => P3(tp[0] + d[0] * u, tp[1] + d[1] * u, tp[2] + z)), face = Math.abs(Math.sin(va)) * 0.6 + 0.4;
    const arrow = [P3(tp[0] + d[0] * 1.5, tp[1] + d[1] * 1.5, Hp), P3(tp[0] + d[0] * 0.9, tp[1] + d[1] * 0.9, Hp + 0.3), P3(tp[0] + d[0] * 0.9, tp[1] + d[1] * 0.9, Hp - 0.3)], rod = [P3(tp[0] - d[0] * 0.3, tp[1] - d[1] * 0.3, Hp), P3(tp[0] + d[0] * 1.2, tp[1] + d[1] * 1.2, Hp)];
    c.strokeStyle = LINE; c.lineWidth = T * 0.14; c.beginPath(); c.moveTo(rod[0][0], rod[0][1]); c.lineTo(rod[1][0], rod[1][1]); c.stroke(); c.strokeStyle = IRON; c.lineWidth = T * 0.08; c.stroke();
    TN.shape(c, TN.poly(arrow), { col: BRASS, shade: BRASS_SH, hi: BRASS_HI, line: LINE, lw, r: T * 0.4, spec: false, force: true });
    TN.shape(c, TN.poly(fin), { col: FX0.mixC('#5E7088', '#AEBBCB', face), shade: '#4A5870', hi: '#D6E0EA', line: LINE, lw, r: T * 0.9, spec: false, force: true, inner: g => { g.strokeStyle = up ? GREEN_HI : 'rgba(23,44,77,.45)'; g.lineWidth = Math.max(1, T * (up ? 0.12 : 0.05)); g.beginPath(); g.moveTo(fin[0][0], fin[0][1]); g.lineTo(fin[1][0], fin[1][1]); g.lineTo(fin[2][0], fin[2][1]); g.stroke(); } });
    c.fillStyle = BRASS_HI; c.strokeStyle = LINE; c.lineWidth = lw; c.beginPath(); c.arc(X, Y - Hp * T, T * 0.16, 0, TAU); c.fill(); c.stroke();
    if (up) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 + 0.2 * Math.sin(t * 6); blitSized(c, glowSprite(GREEN_HI), X - T * 1.4, Y - Hp * T - T * 1.4, T * 2.8, T * 2.8); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    // frozen fast: a skin of ice over it all, icicles off the fin
    if (locked) { c.globalAlpha = 0.55; c.fillStyle = ICE_HI; c.beginPath(); fin.forEach((q, k) => k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.fill(); c.fillRect(X - T * 0.2, Y - Hp * T, T * 0.4, Hp * T); c.globalAlpha = 1; c.fillStyle = '#F2FAFF'; c.strokeStyle = '#5E86A8'; c.lineWidth = 1;
      for (let k = 0; k < 5; k++) { const q = [lerp(fin[1][0], fin[2][0], k / 4), lerp(fin[1][1], fin[2][1], k / 4)], L = T * (0.3 + (k % 3) * 0.15); c.beginPath(); c.moveTo(q[0] - T * 0.07, q[1]); c.lineTo(q[0], q[1] + L); c.lineTo(q[0] + T * 0.07, q[1]); c.closePath(); c.fill(); c.stroke(); } }
    c.restore(); }

  /* ---- the Telescope Platform: grey flagstones in rings, brass meridians and a degree ring, the pedestal, the two vane
     plinths and their windbreak sockets, snow drifted against a snow-capped parapet ---- */
  function paintPlatform(c, A) { const R = A.R, rnd = A.rnd;
    let g = c.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.1, 0, 0, R + 1.5); g.addColorStop(0, '#66748C'); g.addColorStop(0.75, '#56637A'); g.addColorStop(1, '#46526A'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.2, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, R + 0.1, 0, TAU); c.clip();
    // flagstones laid in rings round the pedestal, each its own tone
    for (let r = PED + 0.2; r < R; r += 1.55) { const n = Math.max(8, Math.round(TAU * r / 1.7)), o = rnd() * TAU;
      for (let k = 0; k < n; k++) { const a0 = o + k / n * TAU, a1 = o + (k + 1) / n * TAU, v = rnd(); c.fillStyle = `rgba(${150 + v * 50},${160 + v * 50},${185 + v * 40},${0.08 + v * 0.1})`; c.beginPath(); c.arc(0, 0, r + 1.5, a0 + 0.012, a1 - 0.012); c.arc(0, 0, r + 0.05, a1 - 0.012, a0 + 0.012, true); c.closePath(); c.fill(); }
      c.strokeStyle = 'rgba(30,38,56,.45)'; c.lineWidth = 0.05; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); }
    // frost in the joints and a few cracks
    c.strokeStyle = 'rgba(30,38,56,.35)'; c.lineWidth = 0.05; for (let i = 0; i < 18; i++) { let a = rnd() * TAU, d = PED + rnd() * (R - PED), x = Math.cos(a) * d, y = Math.sin(a) * d; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (rnd() - 0.5) * 1.3; y += (rnd() - 0.5) * 1.3; c.lineTo(x, y); } c.stroke(); }
    // brass: four meridians from the pedestal to the rim, a ring of degree marks, the eight winds
    c.strokeStyle = 'rgba(184,154,94,.7)'; c.lineWidth = 0.12; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; c.beginPath(); c.moveTo(Math.cos(a) * (PED + 0.4), Math.sin(a) * (PED + 0.4)); c.lineTo(Math.cos(a) * (R - 0.6), Math.sin(a) * (R - 0.6)); c.stroke(); }
    c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, 9.2, 0, TAU); c.stroke(); c.lineWidth = 0.05; c.beginPath(); c.arc(0, 0, 9.6, 0, TAU); c.stroke();
    for (let k = 0; k < 72; k++) { const a = k / 72 * TAU, L = k % 9 === 0 ? 0.9 : k % 3 === 0 ? 0.5 : 0.3; c.lineWidth = k % 9 === 0 ? 0.1 : 0.05; c.beginPath(); c.moveTo(Math.cos(a) * 9.2, Math.sin(a) * 9.2); c.lineTo(Math.cos(a) * (9.2 - L), Math.sin(a) * (9.2 - L)); c.stroke(); }
    c.fillStyle = 'rgba(184,154,94,.35)'; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, L = k % 2 ? 1.2 : 2.0; c.beginPath(); c.moveTo(Math.cos(a) * (PED + 0.3 + L), Math.sin(a) * (PED + 0.3 + L)); c.lineTo(Math.cos(a + 0.12) * (PED + 0.35), Math.sin(a + 0.12) * (PED + 0.35)); c.lineTo(Math.cos(a - 0.12) * (PED + 0.35), Math.sin(a - 0.12) * (PED + 0.35)); c.closePath(); c.fill(); }
    // aurora light pooled on the stone
    const ag = c.createRadialGradient(0, -R * 0.4, 0, 0, -R * 0.4, R); ag.addColorStop(0, 'rgba(120,215,178,.12)'); ag.addColorStop(1, 'rgba(120,215,178,0)'); c.fillStyle = ag; c.fillRect(-R, -R, R * 2, R * 2);
    // snow drifted against the parapet, and patches on the stone
    for (let i = 0; i < 34; i++) { const a = i / 34 * TAU + rnd() * 0.15, d = R - 0.3 - rnd() * 0.5, r = 0.2 + rnd() * 0.3, x = Math.cos(a) * d, y = Math.sin(a) * d, ro = a + Math.PI / 2; c.fillStyle = 'rgba(70,96,130,.35)'; c.beginPath(); c.ellipse(x - Math.cos(a) * 0.12, y - Math.sin(a) * 0.12 + 0.08, r * 1.9, r * 0.75, ro, 0, TAU); c.fill(); c.fillStyle = '#EEF4F8'; c.beginPath(); c.ellipse(x, y, r * 1.8, r * 0.65, ro, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + Math.cos(ro) * r * 1.3, y + Math.sin(ro) * r * 1.3 + 0.05, r * 0.9, r * 0.5, ro, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(x + Math.cos(a) * 0.08, y + Math.sin(a) * 0.08 - 0.06, r * 1.2, r * 0.3, ro, 0, TAU); c.fill(); }
    for (let i = 0; i < 7; i++) { const a = rnd() * TAU, d = PED + 1.5 + rnd() * (R - PED - 4), r = 0.25 + rnd() * 0.4; c.fillStyle = 'rgba(236,244,248,.28)'; c.beginPath(); c.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * 1.6, r, rnd() * 3, 0, TAU); c.fill(); }
    c.restore();
    // the pedestal: a round dais two steps high, its rim of pale stone, snow on its top
    c.fillStyle = 'rgba(10,16,30,.35)'; c.beginPath(); c.arc(0.12, 0.28, PED + 0.25, 0, TAU); c.fill();
    [[PED, '#4E5A72'], [PED - 0.35, '#6E7C94'], [PED - 0.75, '#7A88A0']].forEach(([r, col], k) => { c.fillStyle = col; c.beginPath(); c.arc(0, -k * 0.12, r, 0, TAU); c.fill(); c.strokeStyle = 'rgba(20,28,44,.7)'; c.lineWidth = 0.07; c.stroke(); });
    c.strokeStyle = 'rgba(184,154,94,.8)'; c.lineWidth = 0.08; c.beginPath(); c.arc(0, -0.24, PED - 1.15, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(246,250,252,.55)'; [[-1.5, -1.2, 0.45], [1.6, 0.7, 0.4], [-0.9, 1.7, 0.3]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x, y - 0.24, r * 1.4, r * 0.7, 0.4, 0, TAU); c.fill(); });
    // the vane plinths and their sockets
    for (let i = 0; i < 2; i++) { const s = SIDE[i], vx = s * 11.4, vy = 0.4, px = s * 12.5, py = -0.5;
      c.fillStyle = 'rgba(10,16,30,.3)'; c.beginPath(); c.arc(vx + 0.1, vy + 0.2, VR + 0.25, 0, TAU); c.fill(); c.fillStyle = '#6A7890'; c.beginPath(); c.arc(vx, vy, VR + 0.1, 0, TAU); c.fill(); c.strokeStyle = 'rgba(20,28,44,.7)'; c.lineWidth = 0.07; c.stroke();
      c.strokeStyle = 'rgba(184,154,94,.75)'; c.lineWidth = 0.06; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.beginPath(); c.moveTo(vx + Math.cos(a) * (VR - 0.5), vy + Math.sin(a) * (VR - 0.5)); c.lineTo(vx + Math.cos(a) * (VR - 0.05), vy + Math.sin(a) * (VR - 0.05)); c.stroke(); }
      c.fillStyle = '#4A5468'; c.fillRect(px - 0.55, py - 0.45, 1.1, 0.9); c.strokeStyle = 'rgba(20,28,44,.8)'; c.strokeRect(px - 0.55, py - 0.45, 1.1, 0.9);
      const bx = s * 7; c.fillStyle = 'rgba(40,52,72,.6)'; c.beginPath(); c.arc(bx, 0, 0.7, 0, TAU); c.fill(); c.strokeStyle = 'rgba(184,154,94,.8)'; c.lineWidth = 0.08; c.stroke(); c.beginPath(); c.moveTo(bx, -0.5); c.lineTo(bx, 0.5); c.stroke(); }
    // the parapet: a low wall of dark stone round the edge, capped with snow
    c.fillStyle = '#323C52'; c.beginPath(); c.arc(0, 0, R + 1.35, 0, TAU); c.arc(0, 0, R + 0.05, 0, TAU, true); c.fill('evenodd'); c.strokeStyle = 'rgba(14,20,34,.8)'; c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, R + 0.05, 0, TAU); c.stroke();
    for (let i = 0; i < 40; i++) { const a0 = i / 40 * TAU, a1 = (i + 0.86) / 40 * TAU; c.fillStyle = '#F2F7FA'; c.beginPath(); c.arc(0, 0, R + 1.25, a0, a1); c.arc(0, 0, R + 0.35 + rnd() * 0.25, a1, a0, true); c.closePath(); c.fill(); }
    c.strokeStyle = 'rgba(14,20,34,.6)'; c.lineWidth = 0.08; c.beginPath(); c.arc(0, 0, R + 1.35, 0, TAU); c.stroke(); }
  /* the sky over the observatory: deep navy, stars, the aurora as an enormous open eye, ruined arches on the horizon */
  function paintSky(c, W, H, t, cam, T) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#050C1E'); g.addColorStop(0.5, '#0B1A36'); g.addColorStop(1, '#14284A'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(53); c.save(); for (let i = 0; i < 160; i++) { const x = R() * W, y = R() * H * 0.8, r = 0.4 + R() * R() * 1.6; c.globalAlpha = 0.3 + R() * 0.6; c.fillStyle = R() < 0.15 ? '#CFF5E6' : '#FFFFFF'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } c.restore();
    // the eye: two curtains of aurora meeting at the corners, a pale iris between
    const cx = W * 0.5, cy = H * 0.2, ew = W * 0.62, eh = H * 0.1; c.save(); c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.35; blitSized(c, glowSprite('#9FE8D8'), cx - ew * 0.5, cy - ew * 0.5, ew, ew); c.globalAlpha = 0.55; blitSized(c, glowSprite('#DDFBF0'), cx - eh * 1.2, cy - eh * 1.2, eh * 2.4, eh * 2.4);
    for (const sg of [-1, 1]) for (let i = 0; i <= 60; i++) { const u = i / 60, x = cx - ew + 2 * ew * u, yy = cy + sg * eh * Math.sin(u * Math.PI) * (1 + 0.15 * Math.sin(u * 17)), len = H * (0.05 + 0.07 * Math.sin(u * Math.PI)) * (0.6 + 0.4 * Math.sin(u * 23 + sg)), gr = c.createLinearGradient(x, yy, x, yy - len * (sg < 0 ? 1.4 : 1));
      gr.addColorStop(0, 'rgba(120,215,178,.55)'); gr.addColorStop(0.4, sg < 0 ? 'rgba(150,240,205,.3)' : 'rgba(170,150,240,.18)'); gr.addColorStop(1, 'rgba(120,215,178,0)'); c.strokeStyle = gr; c.lineWidth = 3 + (i % 3); c.globalAlpha = 0.7; c.beginPath(); c.moveTo(x, yy); c.lineTo(x + 4, yy - len * (sg < 0 ? 1.4 : 1)); c.stroke(); }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.5; c.fillStyle = '#081428'; c.beginPath(); c.ellipse(cx, cy, eh * 0.35, eh * 0.55, 0, 0, TAU); c.fill(); c.restore();
    // the far ruins: arches of the observatory galleries on a snowy ridge
    c.save(); const base = H * 0.52; c.fillStyle = '#1C2A44'; c.fillRect(0, base, W, H - base); c.fillStyle = 'rgba(228,237,240,.5)'; c.fillRect(0, base - 3, W, 4);
    for (let x = 10; x < W; x += 52) { const h = H * (0.1 + ((x * 13) % 7) / 70), lean = ((x / 52) % 2 ? 1 : -1) * 4; c.fillStyle = '#26344F'; c.fillRect(x - 12, base - h, 6, h); c.fillRect(x + 6, base - h, 6, h); c.beginPath(); c.moveTo(x - 12 + lean, base - h); c.quadraticCurveTo(x + lean, base - h - 22, x + 12 + lean, base - h); c.lineTo(x + 6 + lean, base - h); c.quadraticCurveTo(x + lean, base - h - 12, x - 6 + lean, base - h); c.closePath(); c.fill(); c.fillStyle = 'rgba(240,246,250,.75)'; c.beginPath(); c.ellipse(x + lean, base - h - 14, 10, 3, 0, 0, TAU); c.fill(); }
    c.restore(); }
})());
