/* ---------- VEILWRACK THE LANTERN EEL ----------
   Built on Astaroth's model (the Tower's floor-50 fiend): the same serpentine dragon that never lands, flying its
   weaving circles over the arena with the ghosts of where it was behind it, but recoloured for the drowned nave:
   indigo scales, a milk-white belly, six fins of lantern-lit glass instead of the hour-marked wings, three amber
   glowing spines down its spine that light in turn, and a lantern on a chain hanging from its chin. It fights as
   Astaroth flies (lantern breath, swoops along a line, coils round the pet, the Lantern Run: three paths shown then
   flown backwards) with the nave's own rule on top: Thunderwater charges a whole lane (two in phase two), and four
   drain wheels round the nave: strike one and the lane drains, dragging the eel down onto the floor for seven seconds
   with its bulbs bared.
   It swims rather than slides: a wave runs down its body the faster it flies, its fins beat harder on the turns and
   it banks into them, the lantern swings on its chain with its own weight, the bulbs flicker, it blinks and works its
   jaw; before a breath it draws itself up and swells, before a swoop it climbs and then dives jaws wide; struck, a
   jolt runs down it; beached, it thrashes and its tail slaps the water. */
RiftFiend.define({ id: 'veilwrack', name: 'Veilwrack', title: 'The Lantern Eel', color: '#3B2F7A', glow: '#FFC857', accent: '#FFE9A8', biome: 'belfry', r: 2.2, els: ['water', 'spark'] }, (() => {
  const TAU = Math.PI * 2, N = 22, SEG = 0.58, { wetFloor, seaSky } = RiftFiend;
  const SCALE = '#3B2F7A', BELLY = '#F2F0FF', GHOST = '#FFC857', WHITE = '#FFE9A8', CYAN = '#61D9D2', HI = '#B9A3FF', BULB = [4, 8, 12];
  const lerp = (a, b, u) => a + (b - a) * u, decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k);
  const WH_A = [0.6, 0.6 + Math.PI / 2, 0.6 + Math.PI, 0.6 + Math.PI * 1.5];
  const wheelAt = (C, i) => [C.x + Math.cos(WH_A[i]) * (C.R - 2.0), C.y + Math.sin(WH_A[i]) * (C.R - 2.0)];
  // the lantern's flame: an unsteady light
  const flicker = t => 0.72 + 0.16 * Math.sin(t * 23) + 0.12 * Math.sin(t * 7.7 + 1);
  return {
    arenaR: 15, firstAct: 'circle', artY: 0.55, ambient: 'motes',
    artPoses: [{ name: 'gliding', mem: { demoA: 0.3 } }, { name: 'banking', mem: { demoA: 1.6, beat: 0.6, turn: 1.2 } }, { name: 'lantern breath', mem: { demoA: 2.6, jaw: 1, bulb: 1, menace: 1 } }, { name: 'beached (weak)', mem: { demoA: 1.0, reel: 1 } }],
    phaseNames: ['The Nave', 'Twin Thunder', 'The Drowning Hunt', 'The Last Lantern'],
    paintGround(c, A) { wetFloor(c, A, { mid: '#162E3A', edge: '#0E2430', extra: (c2, A2) => { const R = A2.R;
      [-5, 0, 5].forEach(y => { c2.fillStyle = 'rgba(97,217,210,.12)'; c2.fillRect(-R, y - 2, R * 2, 4); c2.strokeStyle = 'rgba(20,50,60,.6)'; c2.lineWidth = 0.14; c2.beginPath(); c2.moveTo(-R, y - 2.1); c2.lineTo(R, y - 2.1); c2.moveTo(-R, y + 2.1); c2.lineTo(R, y + 2.1); c2.stroke(); });
      for (let i = 0; i < 10; i++) { const x = -R + 2 + i * 2.8, y = i % 2 ? -9.5 : 9.5; if (Math.hypot(x, y) > R - 2) continue; c2.fillStyle = '#4A3A28'; c2.fillRect(x, y - 0.3, 1.6, 0.6); c2.strokeStyle = 'rgba(0,0,0,.5)'; c2.lineWidth = 0.06; c2.strokeRect(x, y - 0.3, 1.6, 0.6); }
      WH_A.forEach(a => { const x = Math.cos(a) * (R - 2.0), y = Math.sin(a) * (R - 2.0); c2.fillStyle = '#3E4F58'; c2.beginPath(); c2.ellipse(x, y + 0.3, 1.0, 0.45, 0, 0, TAU); c2.fill(); }); } }); },
    sky(c, W, H, t, cam, T) { seaSky(c, W, H, t, cam, T, { top: '#0A0820', mid: '#1A1444', bot: '#06041A', moon: '#B9A3FF' }); },
    /* ---- the fight ---- */
    init(FX) {
      const M = FX.mem, m = FX.m; m.noTouch = true; m.x = FX.C.x; m.y = FX.C.y - 6;
      Object.assign(M, { hd: 0, alt: 2.2, alt0: 2.2, jaw: 0, beat: 0, flare: 0, reel: 0, trail: [], snaps: [], snapT: 0, sched: [], sigT: 14, thT: 9, bulb: -1, wheels: WH_A.map(() => ({ obj: null, respawnT: 0 })),
        clk: 0, px: m.x, py: m.y, vx: 0, vy: 0, spd: 0, lastHd: 0, turn: 0, wph: 0, lanA: 0, lanW: 0, blink: 0, blinkT: 2.5, menace: 0, inhale: 0, recoil: 0, roar: 0, snapJ: 0, clack: 0, clackT: 2, gillT: 0, thrashT: 0, wasEnter: true, roared: false });
      for (let i = 0; i < 60; i++) M.trail.push({ x: m.x - i * 0.2, y: m.y, z: 2.2 });
      WH_A.forEach((a, i) => spawnWheel(FX, i));
    },
    phase(FX, p, lv) {
      const M = FX.mem, H = FX.H, m = FX.m; M.sigT = Math.min(M.sigT, 5); M.thT = 3; M.roar = 1; M.flare = 1; M.beat = 1; M.menace = 1; M.jaw = 1; H.shake(10, 0.5); H.flash(0.2, GHOST); H.sfx.crash(); H.sparks(m.x, m.y - M.alt, GHOST, 20, 8);
      if (lv === 2) H.banner('TWIN THUNDER', 'Two lanes charge at once; leeches cling to the other wheels', GHOST, 2.6, true);
      if (lv === 3) H.banner('THE DROWNING HUNT', 'It flies faster and the lanes charge sooner', GHOST, 2.4, true);
      if (lv === 4) H.banner('THE LAST LANTERN', 'Every spine burns', WHITE, 2.4, true);
    },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, lv = FX.S.lv, fast = (1 + (lv - 1) * 0.08) * FX.S.fast;
      M.sigT -= dt; M.thT -= dt; m.actT += dt; m.noTouch = true;
      M.wheels.forEach((h, i) => { if ((!h.obj || h.obj.dead) && !h.respawnT) h.respawnT = 10; if (h.respawnT) { h.respawnT -= dt; if (h.respawnT <= 0) { h.respawnT = 0; spawnWheel(FX, i); } } });
      const d = FX.dist(m.x, m.y); let menace = 0, inhale = 0;
      switch (m.act) {
        case 'circle': {
          M.orb = (M.orb == null ? Math.atan2(m.y - me.y, m.x - me.x) : M.orb) + dt * 0.5 * fast * (M.dir || 1);
          const R = 7 + Math.sin(m.t * 0.7) * 1.5, p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 2);
          fly(FX, m, M, p.x, p.y, 7 * fast, dt, 2.6); M.alt = lerp(M.alt, 2.2, Math.min(1, dt * 2));
          if (m.actT > (lv >= 3 ? 1.3 : 1.8) / FX.S.fast) { m.actT = 0; M.dir = Math.random() < 0.5 ? 1 : -1; pick(FX, m, d, lv); }
          break; }
        case 'breath': { const drawn = m.actT < M.bt.wait; M.jaw = Math.min(1, M.jaw + dt * 3); M.bulb = 0; menace = drawn ? 1 : 0.3; inhale = drawn ? 1 : 0; fly(FX, m, M, M.bt.x, M.bt.y, 2.5, dt, 5); if (m.actT > M.bt.wait + 0.4) { m.act = 'circle'; m.actT = 0; M.bulb = -1; } break; }
        case 'swoop': {
          const L = M.sw; if (m.actT < L.wait) { fly(FX, m, M, L.x0, L.y0, 9 * fast, dt, 4); M.alt = lerp(M.alt, 3.0, Math.min(1, dt * 2)); menace = 1; L.dove = false; break; }
          if (!L.dove) { L.dove = true; M.beat = 1; M.snapJ = 1; FX.H.sfx.whoosh && FX.H.sfx.whoosh(); }
          const u = clamp((m.actT - L.wait) / L.dur, 0, 1); m.x = lerp(L.x0, L.x1, u); m.y = lerp(L.y0, L.y1, u); M.hd = L.a; M.alt = lerp(M.alt, 0.8, Math.min(1, dt * 6)); push(M, m); menace = 0.6;
          if (!L.hit && FX.dist(m.x, m.y) < 1.6 + FX.me.r) { if (FX.hurt(m.dmg * 1.6)) L.hit = true; }
          if (u >= 1) { m.act = 'circle'; m.actT = 0; M.recoil = 0.6; }
          break; }
        case 'coil': { const L = M.cl, a = L.a0 + m.actT * 3.2, p = { x: L.x + Math.cos(a) * 3.4, y: L.y + Math.sin(a) * 3.4 }; fly(FX, m, M, p.x, p.y, 11 * fast, dt, 6); M.flare = Math.max(M.flare, 0.5); menace = 0.6; if (m.actT > L.wait + 0.5) { m.act = 'circle'; m.actT = 0; } break; }
        case 'thunder': { M.bulb = 2; menace = 1; fly(FX, m, M, FX.C.x, FX.C.y - 10, 8, dt, 3); M.alt = lerp(M.alt, 3.0, Math.min(1, dt * 2)); if (m.actT > 2.8) { m.act = 'circle'; m.actT = 0; M.bulb = -1; } break; }
        case 'run': {   // the Lantern Run: three lit paths shown, then flown backwards
          const G = M.gr; if (m.actT < G.show) { fly(FX, m, M, FX.C.x, FX.C.y - 12, 8, dt, 3); M.alt = lerp(M.alt, 3.2, Math.min(1, dt * 2)); menace = 1; break; }
          const k = Math.floor((m.actT - G.show) / G.each), u = ((m.actT - G.show) % G.each) / G.each;
          if (k >= 3) { m.act = 'circle'; m.actT = 0; M.bulb = -1; M.recoil = 0.6; break; }
          if (u < 0.05) M.beat = Math.max(M.beat, 0.8);
          M.bulb = 2 - k; const P2 = G.paths[2 - k]; m.x = lerp(P2.x0, P2.x1, u); m.y = lerp(P2.y0, P2.y1, u); M.hd = P2.a; M.alt = lerp(M.alt, 0.9, Math.min(1, dt * 8)); push(M, m); menace = 0.7;
          break; }
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3); M.inhale = toward(M.inhale, inhale, dt, inhale > M.inhale ? 2.5 : 8);
      if (m.act !== 'breath') M.jaw = Math.max(0, M.jaw - dt * 2.5);
      M.beat = Math.max(0, M.beat - dt * 1.5); M.flare = Math.max(0, M.flare - dt * 2);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.reel = Math.min(1, M.reel + dt * 3); M.alt = lerp(M.alt, 0.25, Math.min(1, dt * 3)); M.menace = decay(M.menace, dt, 4); const B = body(M); BULB.forEach((i, k) => { const p = B[i]; FX.weak('bulb' + k, p.x, p.y - p.z, 1.0, 2.2, m.stunT > 0.05); });
      // beached: it thrashes, and its tail slaps the water
      M.thrashT -= dt; if (M.thrashT <= 0) { M.thrashT = 0.55; const tl = B[N - 1]; splash(FX, tl.x, tl.y, 1.2); FX.H.shake(2.5, 0.1); if (Math.random() < 0.5) FX.H.sfx.splash && FX.H.sfx.splash(); }
      FX.parts(bodyParts(m, M)); },
    update(FX, dt) {
      const M = FX.mem, m = FX.m; if (!m) return; M.clk += dt;
      if (!(m.stunT > 0)) { M.reel = Math.max(0, M.reel - dt * 2); BULB.forEach((i, k) => { if (FX.S.weak['bulb' + k]) FX.weak('bulb' + k, 0, 0, 0, 0, false); }); }
      for (let i = M.sched.length - 1; i >= 0; i--) { const e = M.sched[i]; e.t -= dt; if (e.t <= 0) { M.sched.splice(i, 1); e.fn(); } }
      M.snapT -= dt; if (M.snapT <= 0) { M.snapT = 0.1; M.snaps.unshift(body(M).map(p => [p.x, p.y, p.z])); if (M.snaps.length > 14) M.snaps.pop(); }
      // how it moves: its speed drives the wave down its body, its turning banks it, and the lantern swings with its weight
      if (dt > 1e-4) { const vx = (m.x - M.px) / dt, vy = (m.y - M.py) / dt; M.px = m.x; M.py = m.y; const ax = (vx - M.vx) / dt; M.vx = toward(M.vx, vx, dt, 10); M.vy = toward(M.vy, vy, dt, 10); M.spd = toward(M.spd, Math.hypot(vx, vy), dt, 6);
        let dh = M.hd - M.lastHd; while (dh > Math.PI) dh -= TAU; while (dh < -Math.PI) dh += TAU; M.lastHd = M.hd; M.turn = toward(M.turn, clamp(dh / dt, -4, 4), dt, 5);
        // (a pendulum under the chin, swung by the head's accelerations and gravity, damped by the water)
        const acc = clamp(ax, -40, 40) * 0.08; M.lanW += (-16 * Math.sin(M.lanA) - acc * Math.cos(M.lanA)) * dt - M.lanW * 1.8 * dt; M.lanA += M.lanW * dt; M.lanA = clamp(M.lanA, -1.3, 1.3); }
      M.wph += dt * (3.2 + M.spd * 0.6 + (M.reel || 0) * 2);
      M.recoil = decay(M.recoil, dt, 2.2); M.roar = decay(M.roar, dt, 0.8); M.snapJ = decay(M.snapJ, dt, 2.5);
      // the eyes blink; the jaw works now and then
      M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = 3 + Math.random() * 3; M.blinkU = 0; } if (M.blinkU != null) { M.blinkU += dt / 0.12; M.blink = Math.sin(Math.min(1, M.blinkU) * Math.PI); if (M.blinkU >= 1) { M.blinkU = null; M.blink = 0; } }
      M.clackT -= dt; if (M.clackT <= 0) { M.clackT = 2 + Math.random() * 3; M.clackU = 0; } if (M.clackU != null) { M.clackU += dt / 0.5; M.clack = Math.sin(Math.min(1, M.clackU) * Math.PI) * 0.45; if (M.clackU >= 1) { M.clackU = null; M.clack = 0; } }
      // the entrance: it comes down out of the dark and lunges at the pet with a roar, jaws wide, before it begins
      if (m.act === 'enter') { const e = FX.S.enterT || 0; if (e > 1.5) { if (e < 2.7 && FX.dist(m.x, m.y) > 3) fly(FX, m, M, FX.me.x, FX.me.y, 7, dt, 4); M.jaw = Math.min(1, M.jaw + dt * 3); M.menace = toward(M.menace, 1, dt, 5); if (!M.roared) { M.roared = true; FX.H.sfx.crash(); FX.H.shake(6, 0.3); } } }
      else if (M.wasEnter) { M.wasEnter = false; M.recoil = 1; M.beat = 1; M.flare = 1; FX.H.sfx.whoosh && FX.H.sfx.whoosh(); }
    },
    dmgK() { return 1; },
    keep: { every: 2 },
    draw(c, FX, m, X, Y, T, t) { drawDragon(c, FX, m, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'wheel') drawWheel(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) {
      const M = FX.mem, G = M.gr; if (!G || FX.m.act !== 'run') return;
      c.save(); G.paths.forEach((P2, k) => { const x0 = FX.sx(P2.x0), y0 = FX.sy(P2.y0), x1 = FX.sx(P2.x1), y1 = FX.sy(P2.y1); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; c.strokeStyle = GHOST; c.lineWidth = T * 0.5; c.setLineDash([T * 0.6, T * 0.4]); c.lineDashOffset = -t * T * 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.setLineDash([]);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.font = `900 ${Math.round(T * 1.1)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.7)'; c.strokeText(String(k + 1), x0, y0); c.fillStyle = WHITE; c.fillText(String(k + 1), x0, y0); }); c.restore();
    },
  };
  /* ---- the nave's wheels ---- */
  function spawnWheel(FX, i) { const p = wheelAt(FX.C, i), h = FX.mem.wheels[i]; h.obj = FX.obj({ kind: 'wheel', x: p[0], y: p[1], r: 0.8, hp: FX.S.barHP * 0.03, idx: i, onKill: o => { const m = FX.m; if (!m || m.dead) return; if (FX.H.mons.some(q => !q.dead && q.type === 'leech' && Math.hypot(q.x - o.x, q.y - o.y) < 2.5)) { FX.H.text(o.x, o.y - 1.5, 'Leeches held it: nothing drains', '#B6A2F0', 12); return; } m.stunT = 7; FX.mem.reel = 0; FX.mem.thrashT = 0.3; FX.H.banner('THE LANE DRAINS', 'Dragged down: strike its glowing spines!', CYAN, 2, true); FX.H.boom(o.x, o.y, 1.4, CYAN, '#FFFFFF', { n: 16, shake: 8 }); FX.H.sfx.crash(); splash(FX, m.x, m.y, 2); if (FX.S.lv >= 2) FX.mem.wheels.forEach((h2, j) => { if (j === i || !h2.obj || h2.obj.dead) return; FX.minion('leech', h2.obj.x + 0.8, h2.obj.y - 0.6); }); } }); }
  function drawWheel(c, FX, o, X, Y, T, t) { const r = T * 0.42, cracked = 1 - o.hp / o.maxhp; c.save(); c.translate(X, Y - T * 0.3); c.fillStyle = '#3A4466'; c.strokeStyle = '#140E2E'; c.lineWidth = 1.5; GFX.rr(c, -T * 0.5, -T * 0.1, T * 1.0, T * 0.36, 4); c.fill(); c.stroke(); c.rotate(o.t * (FX.m && FX.m.stunT > 0 ? 3 : 0.3)); c.strokeStyle = '#140E2E'; c.lineWidth = r * 0.3; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.strokeStyle = '#957943'; c.lineWidth = r * 0.18; c.stroke(); for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(i * Math.PI / 2) * r, Math.sin(i * Math.PI / 2) * r); c.strokeStyle = '#140E2E'; c.lineWidth = r * 0.22; c.stroke(); c.strokeStyle = '#957943'; c.lineWidth = r * 0.1; c.stroke(); } c.fillStyle = cracked > 0.5 ? WHITE : '#957943'; c.beginPath(); c.arc(0, 0, r * 0.22, 0, TAU); c.fill(); c.restore(); }
  // water thrown up where it strikes the floor
  function splash(FX, x, y, k) { for (let i = 0; i < 5 * k; i++) { const a = Math.random() * TAU, v = (2 + Math.random() * 3) * k; FX.H.part({ kind: 'bubble', x: x + Math.cos(a) * 0.5 * k, y: y + Math.sin(a) * 0.3 * k, vx: Math.cos(a) * v * 0.5, vy: -v - 1, g: 9, life: 0.5 + Math.random() * 0.25, max: 0.75, size: 2 + Math.random() * 3, color: '#BFF5E4' }); } FX.H.ring(x, y, 0.3, 1.6 * k, 0.4, '#BFF5E4', 0.2); }
  /* ---- the body: the head leads, the rest follows its trail through the air (Astaroth's rig) ---- */
  // (a head that hovers, wandering about one spot, would wind the trail into a knot and the body with it; while it
  // doubles back on its own last stretch the head point is moved instead of a new one laid, so the body hangs behind it)
  function push(M, m) { const tr = M.trail, last = tr[0]; if (!last || Math.hypot(m.x - last.x, m.y - last.y) > 0.1) { const K = Math.min(18, tr.length - 1); if (K >= 10 && Math.hypot(m.x - tr[K].x, m.y - tr[K].y) < 1.5) { tr[0] = { x: m.x, y: m.y, z: M.alt }; return; } tr.unshift({ x: m.x, y: m.y, z: M.alt }); if (tr.length > 160) tr.pop(); } }
  function fly(FX, m, M, tx, ty, spd, dt, turn) {
    const want = Math.atan2(ty - m.y, tx - m.x); M.hd = FX.K.lerpA(M.hd, want, Math.min(1, dt * (turn || 2.2)));
    m.x += Math.cos(M.hd) * spd * dt; m.y += Math.sin(M.hd) * spd * dt; const q = FX.clampArena(m, 1.2); m.x = q.x; m.y = q.y; push(M, m);
  }
  function body(M) {
    const pts = [], tr = M.trail; let acc = 0; pts.push({ x: tr[0].x, y: tr[0].y, z: tr[0].z });
    for (let i = 1; i < tr.length && pts.length < N; i++) { const a = tr[i - 1], b = tr[i], d = Math.hypot(b.x - a.x, b.y - a.y); acc += d; while (acc >= SEG && pts.length < N) { acc -= SEG; const u = 1 - acc / (d || 1); pts.push({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u) }); } }
    while (pts.length < N) { const l = pts[pts.length - 1]; pts.push({ x: l.x - 0.3, y: l.y, z: l.z }); }
    return pts;
  }
  function bodyParts(m, M) { const B = body(M), out = [{ key: 'head', dx: 0, dy: -M.alt, r: 1.2 }]; [3, 7, 11, 15].forEach((i, k) => { const p = B[i]; out.push({ key: 'b' + k, dx: p.x - m.x, dy: p.y - p.z - m.y, r: 1.0 - k * 0.1 }); }); return out; }
  /* ---- choosing ---- */
  function pick(FX, m, d, lv) {
    const M = FX.mem, me = FX.me, k = 1 / FX.S.fast;
    if (M.thT <= 0) return startThunder(FX, m);
    if (lv >= 2 && M.sigT <= 0) return startRun(FX, m);
    const r = Math.random();
    if (r < 0.36) {   // lantern breath: a cone of amber fire
      const a = Math.atan2(me.y - m.y, me.x - m.x), wait = 0.9 * k;
      m.act = 'breath'; m.actT = 0; M.bt = { x: m.x + Math.cos(a) * 0.5, y: m.y + Math.sin(a) * 0.5, wait }; FX.H.sfx.hum(); FX.tele({ shape: 'cone', x: m.x, y: m.y, a, len: 9, spread: 0.42, t: wait, dmg: m.dmg * 1.5, col: GHOST, fn: s => { M.recoil = 1; M.flare = 1; M.beat = 1; FX.H.sfx.whoosh && FX.H.sfx.whoosh(); FX.H.beamFx && FX.H.beamFx(s.x, s.y, s.a, s.len, WHITE); FX.H.sparks(s.x + Math.cos(s.a) * 2, s.y + Math.sin(s.a) * 2 - M.alt, GHOST, 14, 8); } });
    } else if (r < 0.68) {   // it coils round the pet: a ring with a gap
      const p = FX.clampArena({ x: me.x, y: me.y }, 4), wait = 1.3 * k; m.act = 'coil'; m.actT = 0; M.cl = { x: p.x, y: p.y, a0: Math.atan2(m.y - p.y, m.x - p.x), wait }; M.flare = 1;
      FX.tele({ shape: 'ring', x: p.x, y: p.y, r0: 2.2, r1: 4.6, gaps: [[Math.random() * TAU, 0.45]], t: wait, dmg: m.dmg * 1.4, col: GHOST, fn: () => { M.beat = 1; FX.H.sfx.crash(); } }); FX.H.banner('COIL', 'Through the gap', GHOST, 1.2, true);
    } else {   // a swoop along a line through the pet
      const a = Math.atan2(me.y - m.y, me.x - m.x), p0 = FX.clampArena({ x: me.x - Math.cos(a) * 9, y: me.y - Math.sin(a) * 9 }, 1.5), p1 = FX.clampArena({ x: me.x + Math.cos(a) * 9, y: me.y + Math.sin(a) * 9 }, 1.5), wait = 1.0 * k;
      M.sw = { x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, a: Math.atan2(p1.y - p0.y, p1.x - p0.x), wait, dur: 0.75 * k, hit: false }; m.act = 'swoop'; m.actT = 0; FX.H.sfx.hum();
      FX.tele({ shape: 'line', x: p0.x, y: p0.y, a: M.sw.a, len: Math.hypot(p1.x - p0.x, p1.y - p0.y), w: 2.4, t: wait + 0.35 * k, dmg: m.dmg * 1.5, col: GHOST });
    }
  }
  function startThunder(FX, m) { const M = FX.mem, C = FX.C, P = FX.S.lv, lanes = [-5, 0, 5], my = FX.me.y - C.y, first = lanes.reduce((b, y) => (Math.abs(y - my) < Math.abs(b - my) ? y : b)); m.act = 'thunder'; m.actT = 0; M.thT = P >= 3 ? 10 : 14; const picks = [first]; if (P >= 2) picks.push(lanes.filter(y => y !== first)[Math.floor(Math.random() * 2)]);
    picks.forEach((y, k) => FX.tele({ shape: 'line', x: C.x - C.R, y: C.y + y, a: 0, len: C.R * 2, w: 4, t: 2.2 + k * 0.8, dmg: m.dmg * 1.9, col: GHOST, label: 'THUNDERWATER', fn: s => { M.recoil = 1; M.flare = 1; FX.H.beamFx && FX.H.beamFx(s.x, s.y, 0, s.len, WHITE); FX.H.bolt && FX.H.bolt(s.x + s.len * 0.5, s.y, WHITE); FX.H.shake(9, 0.3); FX.H.sfx.zap && FX.H.sfx.zap(); } }));
    FX.H.banner('THUNDERWATER', picks.length > 1 ? 'Two lanes charge: leave them' : 'The lane charges: leave it', GHOST, 1.8, true); FX.H.sfx.hum(); }
  function startRun(FX, m) {
    const M = FX.mem, C = FX.C, me = FX.me, lv = FX.S.lv, k = 1 / FX.S.fast; M.sigT = lv >= 4 ? 17 : 21; m.act = 'run'; m.actT = 0;
    const show = 2.3 * k, each = 0.8 * k, paths = [];
    for (let i = 0; i < 3; i++) { const a = Math.atan2(me.y - C.y, me.x - C.x) + (i - 1) * 0.9 + FX.rnd(-0.3, 0.3), off = FX.rnd(-2.5, 2.5), cx = me.x + Math.cos(a + Math.PI / 2) * off * 0.3, cy = me.y + Math.sin(a + Math.PI / 2) * off * 0.3;
      const p0 = FX.clampArena({ x: cx - Math.cos(a + Math.PI / 2) * 16, y: cy - Math.sin(a + Math.PI / 2) * 16 }, 1), p1 = FX.clampArena({ x: cx + Math.cos(a + Math.PI / 2) * 16, y: cy + Math.sin(a + Math.PI / 2) * 16 }, 1);
      paths.push({ x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, a: Math.atan2(p1.y - p0.y, p1.x - p0.x) }); }
    M.gr = { show, each, paths };
    paths.forEach((P2, i) => FX.tele({ shape: 'line', x: P2.x0, y: P2.y0, a: P2.a, len: Math.hypot(P2.x1 - P2.x0, P2.y1 - P2.y0), w: 2.6, t: show + (2 - i + 1) * each, dmg: m.dmg * 1.8, col: GHOST }));
    FX.H.banner('THE LANTERN RUN', 'Three paths are lit: it flies them in reverse, three, two, then one', GHOST, 2.8, true); FX.H.sfx.hum();
  }
  /* ---- painting: Astaroth's dragon in the eel's colours, with fins of lantern-glass, bone spines and the lantern ---- */
  function drawDragon(c, FX, m, X, Y, T, t) {
    const K = FX.K, M = FX.mem;
    if (M.demoA != null && (!M.trail || !M.trail.length)) { M.hd = M.demoA; M.alt = M.alt || 2.2; M.trail = []; for (let i = 0; i < 90; i++) { const u = i * 0.15; M.trail.push({ x: m.x - Math.cos(M.hd) * u + Math.sin(u * 0.6) * 0.8 * Math.sin(M.hd), y: m.y - Math.sin(M.hd) * u - Math.sin(u * 0.6) * 0.8 * Math.cos(M.hd), z: M.alt + Math.sin(u * 0.4) * 0.2 }); } M.snaps = []; }
    const SX = x => X + (x - m.x) * T, SY = y => Y + (y - m.y) * T, B = body(M), P = p => [SX(p.x), SY(p.y) - p.z * T], rl = M.reel || 0, bulb = M.bulb == null ? -1 : M.bulb, hs = m.hitSq || 0, roar = M.roar || 0, menace = M.menace || 0, inhale = M.inhale || 0, recoil = M.recoil || 0, turn = M.turn || 0, wph = M.wph == null ? t * 3.5 : M.wph, lit = bulb >= 0 || rl > 0.3 || roar > 0;
    // the swimming: a wave runs down the body from the neck, side to side and up and down, bigger toward the tail and
    // bigger still when it is struck (a jolt) or thrashing on the floor; the head is spared, it leads
    const amp = (1 + hs * 1.2) * (1 + rl * 1.4), wk = 0.6;
    for (let i = 1; i < N; i++) { const u = i / (N - 1), a = B[Math.max(0, i - 1)], b = B[Math.min(N - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, s = Math.sin(wph - i * wk) * (0.06 + u * 0.42) * amp * Math.min(1, i / 3), p = B[i]; p.x += -dy / d * s; p.y += dx / d * s; p.z += Math.cos(wph * 0.7 - i * 0.5) * 0.14 * u * amp; }
    // recoil: the head rears back and up for a moment after a breath or a dive
    if (recoil > 0) { const h = B[0], n = B[1], dx = h.x - n.x, dy = h.y - n.y, d = Math.hypot(dx, dy) || 1; h.x -= dx / d * recoil * 0.35; h.y -= dy / d * recoil * 0.35; h.z += recoil * 0.4; }
    const wfn = i => { const u = i / (N - 1); return T * (u < 0.08 ? 0.9 + u * 6 : 1.4 * Math.pow(1 - (u - 0.08) / 0.92, 0.75) + 0.12) * (1 + inhale * 0.14 * Math.max(0, 1 - u * 3) + hs * 0.1 + roar * 0.08); };
    // shadows on the nave floor
    c.save(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineCap = 'round'; for (let i = 0; i < N - 1; i++) { c.lineWidth = wfn(i) * 1.1; c.beginPath(); c.moveTo(SX(B[i].x), SY(B[i].y)); c.lineTo(SX(B[i + 1].x), SY(B[i + 1].y)); c.stroke(); } c.restore();
    // its lantern-light afterglow: where it was a moment ago
    if (M.snaps) [5, 11].forEach((k, j) => { const S2 = M.snaps[k]; if (!S2) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.14 - j * 0.05; c.strokeStyle = GHOST; c.lineCap = 'round'; for (let i = 0; i < N - 1; i++) { c.lineWidth = wfn(i) * 1.6; c.beginPath(); c.moveTo(SX(S2[i][0]), SY(S2[i][1]) - S2[i][2] * T); c.lineTo(SX(S2[i + 1][0]), SY(S2[i + 1][1]) - S2[i + 1][2] * T); c.stroke(); } c.restore(); });
    const pts = B.map(P);
    // the fins: three pairs of glassy membranes, veined, lit from the lantern-spines; they beat harder the faster it flies and
    // fold on the inside of a turn, flaring on the outside
    const wings = []; [3, 6, 9].forEach((i, k) => { const a = B[i], b = B[i + 1], hd = Math.atan2(a.y - b.y, a.x - b.x); for (const s of [-1, 1]) wings.push({ i, k, s, hd, far: Math.sin(hd + s * Math.PI / 2) < 0 }); });
    const wing = W => { const a = B[W.i], bank = clamp(turn * W.s * 0.25, -0.35, 0.35), beat = Math.sin(t * (3.2 + (M.spd || 0) * 0.25) + W.k * 0.7) * 0.5 + (M.beat || 0) * Math.sin(t * 14) * 0.6, spread = 1.35 - W.k * 0.18 + (M.flare || 0) * 0.3 + roar * 0.3, L = (3.0 - W.k * 0.6) * (1 + (M.flare || 0) * 0.15 + roar * 0.2 - bank);
      const sa = W.hd + W.s * (Math.PI / 2 + 0.35 + bank), root = P(a), tip = P({ x: a.x + Math.cos(sa) * L - Math.cos(W.hd) * 1.2, y: a.y + Math.sin(sa) * L - Math.sin(W.hd) * 1.2, z: a.z + 0.6 + beat * 1.4 * spread + bank * 1.5 }), mid = P({ x: a.x + Math.cos(sa) * L * 0.55 + Math.cos(W.hd) * 0.4, y: a.y + Math.sin(sa) * L * 0.55 + Math.sin(W.hd) * 0.4, z: a.z + 0.4 + beat * 0.8 + bank * 0.8 });
      const trail = P({ x: a.x - Math.cos(W.hd) * 1.6 + Math.cos(sa) * L * 0.3, y: a.y - Math.sin(W.hd) * 1.6 + Math.sin(sa) * L * 0.3, z: a.z + 0.1 });
      c.save(); c.globalAlpha = W.far ? 0.45 : 0.6;
      const path = () => { c.beginPath(); c.moveTo(root[0], root[1]); c.quadraticCurveTo(mid[0], mid[1] - T * 0.3, tip[0], tip[1]); c.quadraticCurveTo((tip[0] + trail[0]) / 2 + T * 0.2, (tip[1] + trail[1]) / 2 + T * 0.4, trail[0], trail[1]); c.closePath(); };
      path(); const g = c.createLinearGradient(root[0], root[1], tip[0], tip[1]); g.addColorStop(0, 'rgba(80,60,150,.9)'); g.addColorStop(0.55, `rgba(255,200,87,${0.45 + (lit ? 0.2 : 0)})`); g.addColorStop(1, 'rgba(255,233,168,.3)'); c.fillStyle = g; c.fill();
      c.clip(); c.globalCompositeOperation = 'lighter';
      c.strokeStyle = 'rgba(255,233,168,.55)'; c.lineWidth = Math.max(1, T * 0.06); c.beginPath(); c.moveTo(root[0], root[1]); c.quadraticCurveTo(mid[0], mid[1] - T * 0.3, tip[0], tip[1]); c.stroke(); for (let f = 1; f < 5; f++) { const e = [lerp(tip[0], trail[0], f / 5), lerp(tip[1], trail[1], f / 5)]; c.beginPath(); c.moveTo(mid[0], mid[1]); c.lineTo(e[0], e[1]); c.stroke(); }
      const sg = c.createLinearGradient(root[0] - T * 2, root[1], tip[0] + T * 2, tip[1]); sg.addColorStop(0, 'rgba(255,200,87,0)'); sg.addColorStop(0.5, 'rgba(255,220,140,.18)'); sg.addColorStop(1, 'rgba(185,163,255,0)'); c.fillStyle = sg; c.fillRect(Math.min(root[0], tip[0], trail[0]) - T, Math.min(root[1], tip[1], trail[1]) - T, Math.abs(tip[0] - root[0]) + T * 6, Math.abs(tip[1] - root[1]) + T * 6);
      c.restore(); };
    wings.filter(W => W.far).forEach(wing);
    // the long body: indigo scales above, the milk belly beneath, a crest of fins along the spine
    K.tube(c, pts.slice().reverse(), u => wfn(N - 1 - Math.round(u * (N - 1))), { col: SCALE, tex: 'scale', texA: 0.9, texS: 0.35, dk: '#0C0820', dkA: 0.6, hi: HI, hiA: 0.3, rim: GHOST, rimA: 0.3 + (lit ? 0.2 : 0),
      inner: (L, R) => { c.strokeStyle = 'rgba(242,240,255,.6)'; c.lineWidth = T * 0.38; c.beginPath(); (pts[0][1] < pts[N - 1][1] ? R : L).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); } });
    // the spine: a row of bone spines down the back, ivory hooks raked back along the body, long at the shoulders and
    // short toward the tail, riding the wave; three of them are larger, cracked lantern-spines (its weak points), their
    // roots glowing gold: the lit one blazes (all three when beached or roaring; in Thunderwater they light in
    // sequence), the others smoulder, and when it is beached their cracks split open with light
    const seq = m.act === 'thunder' ? Math.floor(t * 6) % 3 : -1, INK = '#1A1230', BONE = '#EFE6CF', BONE_SH = '#BBA98A', BONE_HI = '#FFFBF0';
    for (let i = N - 3; i >= 1; i--) { const u = i / (N - 1), k = BULB.indexOf(i), big = k >= 0, p = pts[i], nx = pts[i + 1][0] - pts[Math.max(0, i - 1)][0], ny = pts[i + 1][1] - pts[Math.max(0, i - 1)][1], nd = Math.hypot(nx, ny) || 1, dx = nx / nd, dy = ny / nd;
      const w = wfn(i), on = big && (bulb === k || seq === k || rl > 0.3 || roar > 0), fl = big ? flicker(t + k * 1.7) : 1, L = w * (0.45 + 0.5 * Math.pow(1 - u, 1.3)) * (big ? 1.3 : 1) * (1 + roar * 0.12 + Math.sin(wph - i * wk) * 0.06), up = 0.45 + 0.55 * Math.abs(dx), bw = w * (big ? 0.34 : 0.22);
      const bx = p[0], by = p[1] - w * 0.62, b0 = [bx - dx * bw, by - dy * bw], b1 = [bx + dx * bw, by + dy * bw], tip = [bx + dx * L * 0.85, by + dy * L * 0.6 - L * 0.95 * up], cf = [bx - dx * bw * 0.4 + dx * L * 0.1, by + dy * L * 0.1 - L * 0.75 * up], cb = [bx + dx * L * 0.55 + dx * bw, by + dy * (L * 0.4 + bw) - L * 0.25 * up];
      const spine = () => { c.beginPath(); c.moveTo(b0[0], b0[1]); c.quadraticCurveTo(cf[0], cf[1], tip[0], tip[1]); c.quadraticCurveTo(cb[0], cb[1], b1[0], b1[1]); c.closePath(); };
      c.save();
      if (big) { c.globalCompositeOperation = 'lighter'; const r = w * (on ? 1.9 : 0.9); c.globalAlpha = on ? 0.85 * fl + recoil * 0.3 : 0.2 + 0.1 * Math.sin(t * 2.3 + k) + menace * 0.3; blitSized(c, glowSprite(GHOST), bx - r, by - r * 0.8, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      spine(); c.fillStyle = BONE; c.fill();
      c.save(); c.clip();
      // the cel shade: the trailing face of the hook in shadow, a hard edge
      c.fillStyle = BONE_SH; c.beginPath(); c.moveTo(tip[0], tip[1]); c.quadraticCurveTo(cb[0], cb[1], b1[0], b1[1]); c.lineTo(lerp(b0[0], b1[0], 0.55), lerp(b0[1], b1[1], 0.55)); c.quadraticCurveTo(lerp(cf[0], cb[0], 0.6), lerp(cf[1], cb[1], 0.6), tip[0], tip[1]); c.fill();
      if (big) { // the root of the lantern-spine: lit from within, amber to white
        const gg = c.createLinearGradient(bx, by, bx, by - L * 0.8); gg.addColorStop(0, on ? '#FFF6D8' : '#E0B060'); gg.addColorStop(0.45, on ? 'rgba(255,200,87,.85)' : 'rgba(160,110,40,.55)'); gg.addColorStop(1, 'rgba(255,200,87,0)'); c.fillStyle = gg; c.fillRect(bx - L * 2, by - L * 2, L * 4, L * 2.4); }
      c.restore();
      spine(); c.strokeStyle = INK; c.lineWidth = Math.max(1, w * (big ? 0.09 : 0.07)); c.lineJoin = 'round'; c.stroke();
      // a glint up the leading edge
      c.strokeStyle = BONE_HI; c.lineWidth = Math.max(0.8, w * 0.05); c.globalAlpha = 0.8; c.beginPath(); c.moveTo(lerp(b0[0], tip[0], 0.2) + dx * bw * 0.3, lerp(b0[1], tip[1], 0.2)); c.quadraticCurveTo(lerp(cf[0], tip[0], 0.3) + dx * bw * 0.3, lerp(cf[1], tip[1], 0.3), lerp(b0[0], tip[0], 0.75) + dx * bw * 0.2, lerp(b0[1], tip[1], 0.75)); c.stroke(); c.globalAlpha = 1;
      if (big) { // the cracks: dark seams, splitting open with light when it is lit
        const cr = [[0.15, 0.35, 0.05], [0.3, 0.6, -0.12], [0.45, 0.82, 0.1]], at = f => [lerp(bx, tip[0], f) - dx * bw * 0.1, lerp(by, tip[1], f)];
        const crack = () => { c.beginPath(); cr.forEach(([f0, f1, o]) => { const q0 = at(f0), q1 = at(f1); c.moveTo(q0[0], q0[1]); c.lineTo((q0[0] + q1[0]) / 2 + dx * w * o * 2 + dy * w * o, (q0[1] + q1[1]) / 2 - dx * w * o); c.lineTo(q1[0], q1[1]); }); };
        crack(); c.strokeStyle = INK; c.lineWidth = Math.max(1, w * 0.07); c.stroke();
        if (on) { c.globalCompositeOperation = 'lighter'; crack(); c.strokeStyle = fl > 0.85 ? '#FFFFFF' : WHITE; c.globalAlpha = 0.6 + 0.4 * fl; c.lineWidth = Math.max(1, w * 0.045); c.stroke(); } }
      c.restore(); }
    // the tail ends in a fan of lantern light
    const te = pts[N - 1], tb = pts[N - 3], ta = Math.atan2(te[1] - tb[1], te[0] - tb[0]); c.save(); c.translate(te[0], te[1]); c.rotate(ta); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; const fg = c.createLinearGradient(0, 0, T * 2, 0); fg.addColorStop(0, GHOST); fg.addColorStop(1, 'rgba(255,200,87,0)'); c.fillStyle = fg; c.beginPath(); c.moveTo(0, 0); c.lineTo(T * 2.2, -T * 0.9); c.lineTo(T * 1.6, 0); c.lineTo(T * 2.2, T * 0.9); c.closePath(); c.fill(); c.restore();
    wings.filter(W => !W.far).forEach(wing);
    const jaw = Math.max(M.jaw || 0, M.clack || 0, M.snapJ || 0, roar);
    paintHead(c, K, pts[0], Math.atan2(pts[0][1] - pts[2][1], pts[0][0] - pts[2][0]), T * 1.15 * (1 + inhale * 0.1 + roar * 0.1), jaw, t, rl, lit, M, turn);
    // dizzy when beached: stars about its head
    if (rl > 0.4) for (let i = 0; i < 3; i++) { const a = t * 3 + i * TAU / 3; FiendToon.twinkle(c, pts[0][0] + Math.cos(a) * T * 1.3, pts[0][1] - T * 1.6 + Math.sin(a) * T * 0.35, T * 0.18, '#FFFFFF', 0.9); }
  }
  function paintHead(c, K, at, ang, hs, jaw, t, rl, lit, M, turn) {
    const flip = Math.cos(ang) < 0, menace = (M && M.menace) || 0, inhale = (M && M.inhale) || 0;
    c.save(); c.translate(at[0], at[1]); c.rotate(ang + clamp((turn || 0) * 0.08, -0.15, 0.15)); if (flip) c.scale(1, -1);
    // horns: two long pairs swept back, and the whiskers
    [[-0.1, -0.45, -1.6, -1.15], [0.15, -0.4, -1.1, -1.35], [-0.2, 0.4, -1.5, 0.95]].forEach(([x0, y0, x1, y1], k) => K.tube(c, [[x0 * hs, y0 * hs], [(x0 + x1) / 2 * hs, (y0 + y1) / 2 * hs - hs * 0.15], [x1 * hs, y1 * hs + Math.sin(t * 2.5 + k) * hs * 0.04]], u => hs * (0.17 - u * 0.15), { col: k === 2 ? '#2A2050' : '#E8E0FF', hi: '#FFFFFF', hiA: 0.45, dk: '#1A1240', dkA: 0.5 }));
    // the lower jaw
    c.save(); c.translate(hs * 0.1, hs * 0.18); c.rotate(jaw * 0.6);
    if (jaw > 0.1) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = jaw * 0.8 * (0.8 + inhale * 0.4); blitSized(c, glowSprite(GHOST), hs * 0.3, -hs * 0.7, hs * 1.6, hs * 1.2); c.restore(); }
    K.body(c, () => { c.beginPath(); c.moveTo(-hs * 0.2, 0); c.quadraticCurveTo(hs * 0.7, hs * 0.12, hs * 1.4, hs * 0.02); c.lineTo(hs * 1.35, hs * 0.15); c.quadraticCurveTo(hs * 0.6, hs * 0.35, -hs * 0.2, hs * 0.25); c.closePath(); }, hs * 0.5, hs * 0.1, hs * 0.8, { col: '#2E2460', hi: '#C8BFFF', tex: 'scale', texA: 0.8, texS: 0.2, spec: 0.3 });
    K.teeth(c, [0.4, 0.6, 0.8, 1.0, 1.2].map((u, i) => [hs * u, hs * 0.03, -Math.PI / 2, 0.6 + (i === 4 ? 0.5 : 0)]), hs * 0.14, '#F6F2FF');
    c.restore();
    // the throat glows as it draws breath
    if (inhale > 0.1) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = inhale * (0.5 + 0.2 * Math.sin(t * 12)); blitSized(c, glowSprite(GHOST), -hs * 0.5, -hs * 0.6, hs * 1.4, hs * 1.2); c.restore(); }
    // the skull: a long wedge, crested
    K.body(c, () => { c.beginPath(); c.moveTo(-hs * 0.45, -hs * 0.05); c.quadraticCurveTo(-hs * 0.3, -hs * 0.42, hs * 0.3, -hs * 0.38); c.quadraticCurveTo(hs * 1.0, -hs * 0.28, hs * 1.5, -hs * 0.05); c.quadraticCurveTo(hs * 1.55, hs * 0.1, hs * 1.4, hs * 0.16); c.quadraticCurveTo(hs * 0.6, hs * 0.22, -hs * 0.2, hs * 0.28); c.closePath(); }, hs * 0.5, -hs * 0.05, hs * 1.1,
      { col: SCALE, hi: HI, dk: '#0C0820', tex: 'scale', texA: 0.9, texS: 0.22, spec: 0.5, rim: GHOST, rimA: 0.35 + menace * 0.3 });
    K.teeth(c, [0.5, 0.75, 1.0, 1.25].map((u, i) => [hs * u, hs * 0.18, Math.PI / 2, 0.6 + (i === 3 ? 0.6 : 0)]), hs * 0.15, '#F6F2FF');
    c.fillStyle = '#05060C'; c.beginPath(); c.ellipse(hs * 1.38, -hs * 0.02, hs * 0.05, hs * 0.03, 0.2, 0, TAU); c.fill();
    // the eye: amber, a slit pupil; it blazes before a blow, blinks now and then, and rolls when it is beached
    const ex = hs * 0.45, ey = -hs * 0.16, blink = (M && M.blink) || 0;
    if (menace > 0.05) K.glow(c, ex, ey, hs * (0.6 + menace * 0.6), GHOST, menace * (0.5 + 0.25 * Math.sin(t * 14)));
    K.eyeR(c, ex + (rl > 0.4 ? Math.cos(t * 7) * hs * 0.03 : 0), ey + (rl > 0.4 ? Math.sin(t * 7) * hs * 0.02 : 0), hs * 0.13, menace > 0.5 ? '#FFE9A8' : GHOST, { white: '#2A1A40', irisK: 0.9 - menace * 0.25, ry: 0.75 });
    if (blink > 0.05) { c.fillStyle = SCALE; c.beginPath(); c.ellipse(ex, ey, hs * 0.16, hs * 0.13 * blink, 0, 0, TAU); c.fill(); }
    K.glow(c, ex, ey, hs * (0.45 + rl * 0.3), GHOST, 0.5);
    c.restore();
    // the lantern: a brass cage on a short chain from the chin, hanging by its own weight (so it swings as the head
    // moves, and trails on a dive), its flame bright and unsteady when a bulb is lit
    const ca = Math.cos(ang), sa = Math.sin(ang), lx0 = hs * 1.0, ly0 = flip ? -hs * 0.3 : hs * 0.3, cx = at[0] + ca * lx0 - sa * ly0, cy = at[1] + sa * lx0 + ca * ly0, th = (M && M.lanA) || Math.sin(t * 2.4) * 0.25, L = hs * 0.7, lx = cx + Math.sin(th) * L, ly = cy + Math.cos(th) * L, fl = flicker(t);
    c.save(); c.strokeStyle = '#3A2A10'; c.lineWidth = Math.max(1, hs * 0.04); c.beginPath(); c.moveTo(cx, cy); c.lineTo(lx, ly); c.stroke();
    c.translate(lx, ly); c.rotate(-th); if (lit) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9 * fl; blitSized(c, glowSprite(GHOST), -hs * 0.9, -hs * 0.9, hs * 1.8, hs * 1.8); c.restore(); }
    c.fillStyle = lit ? '#FFF2C8' : '#C98A2E'; c.strokeStyle = '#3A2A10'; c.lineWidth = Math.max(1, hs * 0.05); c.beginPath(); c.moveTo(-hs * 0.16, -hs * 0.22); c.lineTo(hs * 0.16, -hs * 0.22); c.lineTo(hs * 0.2, hs * 0.2); c.lineTo(-hs * 0.2, hs * 0.2); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#5C4620'; c.fillRect(-hs * 0.2, -hs * 0.3, hs * 0.4, hs * 0.08); c.fillRect(-hs * 0.22, hs * 0.2, hs * 0.44, hs * 0.07); c.beginPath(); c.moveTo(-hs * 0.05, -hs * 0.22); c.lineTo(-hs * 0.05, hs * 0.2); c.moveTo(hs * 0.05, -hs * 0.22); c.lineTo(hs * 0.05, hs * 0.2); c.stroke();
    if (lit) { c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(0, hs * 0.02 - (fl - 0.7) * hs * 0.1, hs * 0.06, hs * (0.08 + fl * 0.05), 0, 0, TAU); c.fill(); } else { c.fillStyle = 'rgba(255,200,87,.6)'; c.beginPath(); c.ellipse(0, hs * 0.04, hs * 0.04, hs * (0.05 + fl * 0.03), 0, 0, TAU); c.fill(); }
    c.restore();
  }
})());
